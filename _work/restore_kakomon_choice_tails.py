# -*- coding: utf-8 -*-
"""過去問ビューアの「📋 選択肢考察」で落ちていた折り返し行を、MEC標準解説集PDFから戻す。

国家試験過去問/*/*.html の選択肢考察は、PDFで2行以上に折り返した肢の**1行目しか**
取り込まれていなかった（2026-09-11 発見。1,881枚中1,613枚）。紙面では肢の記号
「×ａ」が x≈115 に立ち、続きの行は x≈142 に字下げされているので、字下げの行を
記号の行へ繋ぎ直す。必修講座（hisshu）はこのHTMLから解説を借りているので、
直したあとは `python _work/build_hisshu_json.py` で作り直すこと。

照合の手順（誤った紙面の続きを繋がないため）:
  1. カードの肢を先頭から順に、PDFの「肢の記号で始まる行」の並びと突き合わせる。
     全部の肢が連続して一致する位置が1つだけ見つかったときだけ採用する。
  2. 既に直してある肢（1行目＋続き＝ビューアの文）はそのまま（冪等）。

    python _work/restore_kakomon_choice_tails.py            # 書き込む
    python _work/restore_kakomon_choice_tails.py --dry-run  # 数えるだけ
"""
import argparse
import glob
import html
import io
import os
import re
import sys
import unicodedata

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

MARK = re.compile(r'^[×○△]\s*[ａ-ｉ]')
BODY_Y = (44, 680)        # ヘッダー（問題番号一覧…）とフッター（―242―）を外す
BODY_X = 100              # 左余白の見出し（着目point・選択肢考察…）を外す
BODY_X_MAX = 520          # 右余白の縦見出し（ブロック記号の「F」）を外す——同じ高さの行末に紛れ込む
MAX_SKIP = 5              # ビューア側で欠けている肢（連問・取り落とし）を跨いでよい数
START_X = (111, 119)      # 肢の記号の行
CONT_X = (136, 150)       # 字下げされた続きの行


def norm(s):
    s = unicodedata.normalize('NFKC', html.unescape(re.sub(r'<[^>]+>', '', s)))
    return re.sub(r'[\s\x00-\x1f]', '', s)      # 紙面は記号の直後に U+0007 を持つ


BODY_PT = (8.7, 9.7)      # 本文の字の大きさ（9.2pt）。画像の注記・表の数字は 7.8pt で x≈140 に組まれ、
                          # 字下げの位置だけでは続きの行と見分けがつかない
PITCH = (11.5, 15.5)      # 行送り（13.4pt）
WRAP_X1 = 400             # 直前の行がここより右まで詰まっていれば折り返し（行末の禁則で 428 で折れる行がある）
FULL_X1 = 440             # 句点で終わる行は、ここまで詰まっているときだけ次の文が続きうる


def pdf_lines(path):
    """PDF全体の本文の行を読み順に並べる: (page, y, x0, x1, pt, text)。

    同じ高さの断片は x の順に並べて1行にする（上付きの「1mm²」で行が2つに割れて返り、
    行ごとに繋ぐと「…カウ後4 分間…1mmントする」と文字の順が崩れた）。
    """
    out = []
    doc = fitz.open(path)
    for pi, page in enumerate(doc):
        spans = []
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    x0, y0, x1, y1 = s['bbox']
                    if not s['text'].strip() or not (BODY_X <= x0 < BODY_X_MAX):
                        continue
                    # ブロックの見出し文字（x≈497 の「F」1文字）が同じ高さの肢の行に紛れ込む
                    if x0 > 480 and re.fullmatch(r'\s*[A-I]\s*', s['text']):
                        continue
                    if not (BODY_Y[0] < y0 < BODY_Y[1]):
                        continue
                    spans.append(((y0 + y1) / 2, x0, x1, s['size'], s['text']))
        spans.sort()
        rows = []
        for yc, x0, x1, pt, t in spans:
            if rows and abs(rows[-1][0] - yc) < 3.5:
                rows[-1][1].append((x0, x1, pt, t))
            else:
                rows.append([yc, [(x0, x1, pt, t)]])
        for yc, sp in rows:
            sp.sort()
            out.append((pi, yc, sp[0][0], max(s[1] for s in sp), max(s[2] for s in sp),
                        ''.join(s[3] for s in sp)))
    return out


def is_tail(prev, cur):
    """cur は prev の肢の続きの行か。"""
    pp, py, px0, px1, ppt, pt_ = prev
    cp, cy, cx0, cx1, cpt, ct = cur
    if not (CONT_X[0] <= cx0 <= CONT_X[1]) or MARK.match(ct) or not (BODY_PT[0] <= cpt <= BODY_PT[1]):
        return False
    t = re.sub(r'[\x00-\x1f\s]', '', pt_)
    if px1 < WRAP_X1 or (t.endswith('。') and px1 < FULL_X1):
        return False                      # 前の行は折り返していない＝肢はそこで終わっている
    if cp == pp:
        return PITCH[0] <= cy - py <= PITCH[1]
    return cp == pp + 1 and cy < 90       # 改ページ: 次のページの本文の先頭行だけ


def join_tail(lines):
    s = ''
    for t in lines:
        t = re.sub(r'[\x00-\x1f]', '', t).strip()
        if s and re.search(r'[A-Za-z]$', s) and re.match(r'[A-Za-z]', t):
            s += ' '                      # 英単語の途中ではなく語と語の境目で折り返している
        s += t
    return s


def items_of(lines):
    """肢の記号の行ごとに (行のindex, 1行目, [続きの行]) を作る。"""
    items = []
    for i, ln in enumerate(lines):
        if START_X[0] <= ln[2] <= START_X[1] and MARK.match(ln[5]):
            tail, prev = [], ln
            for j in range(i + 1, len(lines)):
                if not is_tail(prev, lines[j]):
                    break
                tail.append(lines[j][5])
                prev = lines[j]
            items.append((i, ln[5], tail))
    return items


# 選択肢考察の中身は入れ子の無い <div> の並び（肢と、ときどき地の文）。最短一致で
# </div></div> まで取ると最後の肢の閉じタグを食って、最後の肢が照合から漏れる。
BLOCK = re.compile(r'(<h4>📋 選択肢考察</h4>)((?:<div[^>]*>(?:(?!<div).)*?</div>)*)()', re.S)
ITEM = re.compile(r'(<div style="color:var\(--(?:ts|gr)\);margin-bottom:3px">)(.*?)(</div>)', re.S)
CARD = re.compile(r'<div class="qc"[^>]*>')


def card_name(tag, f):
    m = re.search(r'data-uid="([^"]+)"', tag)
    if m:
        return m.group(1)
    m = re.search(r'\bid="([^"]+)"', tag)          # uid を持たないカードが175枚ある
    return '%s#%s' % (os.path.basename(f)[:4], m.group(1) if m else '?')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--list-skipped', action='store_true', help='紙面と文言が合わず手を付けなかった肢を一覧する')
    ap.add_argument('--show', help='この uid の結果を表示する（例 kakumon_119B_q38）')
    a = ap.parse_args()

    stats = dict(cards=0, items=0, fixed=0, already=0, single=0, cards_fixed=0, partial=0, skipped=0, unique_only=0)
    unmatched, skipped = [], []
    for year in ('116', '117', '118', '119', '120'):
        pdf = glob.glob('国家試験過去問/第%s回*MEC標準解説集*.pdf' % year)
        if len(pdf) != 1:
            sys.exit('PDF が見つからない: 第%s回' % year)
        lines = pdf_lines(pdf[0])
        items = items_of(lines)
        keys = [norm(t) for _, t, _ in items]
        by_key = {}
        for k, (_, t, tail) in enumerate(items):
            for key in {norm(t), norm(t + join_tail(tail))}:
                by_key.setdefault(key, []).append(k)

        for f in sorted(glob.glob('国家試験過去問/第%s回/*.html' % year)):
            src = io.open(f, encoding='utf-8', newline='').read()
            starts = [(m.start(), card_name(m.group(0), f)) for m in CARD.finditer(src)]

            def uid_at(pos):
                u = None
                for p, uid in starts:
                    if p > pos:
                        break
                    u = uid
                return u

            def fix_block(bm):
                uid = uid_at(bm.start())
                body = bm.group(2)
                its = list(ITEM.finditer(body))
                if not its:
                    return bm.group(0)
                stats['cards'] += 1
                stats['items'] += len(its)
                want = [norm(m.group(2)) for m in its]
                # 肢ごとに紙面の候補を引き、順番を保って並ぶ組み合わせが1つだけのときに採用する
                # （既に直した肢は「1行目＋続き」で一致する）。ビューアは肢を取り落としている
                # カードがあるので、隣の肢との間は MAX_SKIP まで飛んでよい。
                # 紙面の1行目と文言が合わない肢（ビューア側で複数の肢を1行に畳んだ・下付きで
                # 切れた等）は読み飛ばして手を付けず、残りの肢で並びを決める。
                cands = [[k for k in by_key.get(w, ())] for w in want]
                live = [n for n, c in enumerate(cands) if c]
                miss = [n for n, c in enumerate(cands) if not c]
                chains = [[k] for k in cands[live[0]]] if live else []
                for a_, b_ in zip(live, live[1:]):
                    lim = MAX_SKIP + 1 + (b_ - a_ - 1)
                    chains = [c + [k] for c in chains for k in cands[b_] if 0 < k - c[-1] <= lim]
                if len(chains) == 1 and not (miss and len(live) < 2):
                    chain = dict(zip(live, chains[0]))
                else:
                    # 並びが決まらない（連問のカードに別の設問の考察が付いている破損カード等）。
                    # 年度のPDF全体で1行目の文言が1か所にしか無い肢だけは取り違えようがないので直す。
                    chain = {n: cands[n][0] for n in live if len(cands[n]) == 1}
                    if not chain:
                        unmatched.append('%s  一致 %d 通り  紙面に無い肢 %s  先頭「%s」' % (
                            uid, len(chains), ''.join(re.sub(r'<[^>]+>', '', its[n].group(2))[:2] for n in miss) or '-',
                            re.sub(r'<[^>]+>', '', its[miss[0] if miss else 0].group(2))[:36]))
                        return bm.group(0)
                    stats['unique_only'] += 1
                left = len(its) - len(chain)
                if left:
                    stats['partial'] += 1
                    stats['skipped'] += left
                out, last, changed = [], 0, False
                for n, m in enumerate(its):
                    if n not in chain:
                        skipped.append('%s  %s' % (uid, re.sub(r'<[^>]+>', '', m.group(2))[:60]))
                        out.append(body[last:m.end()])
                        last = m.end()
                        continue
                    _, t, tail = items[chain[n]]
                    inner = m.group(2)
                    if not tail:
                        stats['single'] += 1
                    elif norm(inner) == norm(t + join_tail(tail)):
                        stats['already'] += 1
                    else:
                        inner = inner.rstrip() + html.escape(join_tail(tail), quote=False)
                        stats['fixed'] += 1
                        changed = True
                    out.append(body[last:m.start()] + m.group(1) + inner + m.group(3))
                    last = m.end()
                    if a.show == uid:
                        print('  ', re.sub(r'<[^>]+>', '', inner))
                out.append(body[last:])
                if changed:
                    stats['cards_fixed'] += 1
                return bm.group(1) + ''.join(out) + bm.group(3)

            dst = BLOCK.sub(fix_block, src)
            if dst != src and not a.dry_run:
                io.open(f, 'w', encoding='utf-8', newline='').write(dst)

    print('選択肢考察 %(cards)d 枚・肢 %(items)d' % stats)
    print('  続きを足した肢 %(fixed)d（カード %(cards_fixed)d 枚）／既に完全 %(already)d／1行で完結 %(single)d' % stats)
    print('  紙面と文言が合わず読み飛ばした肢 %(skipped)d（カード %(partial)d 枚・残りの肢は直した）' % stats)
    print('  並びが決まらず、文言が一意の肢だけ直したカード %(unique_only)d 枚' % stats)
    if a.list_skipped:
        for s in skipped:
            print('    (読み飛ばし) ' + s)
    print('  PDFと並びが一致しなかったカード %d 枚（手を付けていない）' % len(unmatched))
    for u in unmatched:
        print('   ', u)
    if a.dry_run:
        print('(--dry-run: 書き込んでいない)')


if __name__ == '__main__':
    main()
