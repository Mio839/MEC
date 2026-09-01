# -*- coding: utf-8 -*-
"""巻末の解答一覧表を読む共通モジュール（**臓器別講座・マイナー講座で版面が同じ**）。

    NO. / 解答 / 国試番号 / 種別(★) / CBT / IRT型 / 出題テーマ / 疾患名 / 必修 / 一般 / 臨床 / 正答率

**列は罫線ではなく x 座標で切る**（表の罫線はテキストとして取れない）。この表は
  ・バッジ（必修 bh・CBT bc・一般 bip・臨床 brn・★ bs）の唯一の正本
  ・画像の読みの裏取り（「疾患名」列）
  ・正答率の裏取り（rate 列）
の3つで使う。**AIの判断が一切入らない機械転記**なのが要点。

    python _work/anstable.py circ            要約
    python _work/anstable.py resp --dump     全行を出す

⚠️ 2026-09-01 に `_work/_circ_tmp/anstable_all.py`（gitignore下の作業スクラッチ）から
   昇格させた。循環器の作り直しで書いたものを呼吸器でも使うため。**科目を足すときは
   PDFS に1行足すだけ**——列座標 COLS は循環器・呼吸器で実測一致しており触らない。
"""
import io, os, re, sys

import fitz

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# sid -> PDFのパス（BASE からの相対）
PDFS = {
    'circ': os.path.join('MEC問題文pdf', 'MEC臓器別講座・循環器_問題（表紙2026）.pdf'),
    'resp': os.path.join('MEC問題文pdf', 'MEC臓器別講座・呼吸器_問題（表紙2026）.pdf'),
}

COLS = [('no', 0), ('ans', 62), ('kid', 95), ('type', 145), ('cbt', 165),
        ('irt', 185), ('theme', 200), ('dis', 350), ('hisshu', 470),
        ('ippan', 487), ('rinsho', 504), ('rate', 522)]


def load(sid='circ', pdf=None):
    """NO. -> dict の辞書を返す。"""
    doc = fitz.open(pdf or os.path.join(BASE, PDFS[sid]))
    rows = {}
    for p in range(doc.page_count - 25, doc.page_count):
        words = [w for w in doc[p].get_text('words') if w[4].strip()]
        anchors = sorted((w[1], int(w[4])) for w in words
                         if w[0] < 66 and re.fullmatch(r'\d{1,3}', w[4]))
        if not anchors:
            continue
        # 章区切り行（「　9　〔 問題 〕末梢動静脈・リンパ」）が NO列に食い込むので、
        # 「〔」を含む行の単語はどのアンカーにも配らない
        skip_y = {round(w[1], 1) for w in words if w[4] in ('〔', '〕')}
        for i, (y, no) in enumerate(anchors):
            y1 = anchors[i + 1][0] if i + 1 < len(anchors) else 1e9
            cells = {n: [] for n, _ in COLS}
            for w in words:
                if not (y - 1 <= w[1] < y1 - 1) or round(w[1], 1) in skip_y:
                    continue
                name = COLS[0][0]
                for nm, x0 in COLS:
                    if w[0] >= x0:
                        name = nm
                cells[name].append(w[4])
            r = {n: ''.join(v) for n, v in cells.items()}
            r['no'] = no
            # ⚠️ 章区切り行（「〔 問題 〕心不全」）と「※採点除外」の注記が国試番号セルへ流れ込む。
            #    セルの文字列から国試番号の形だけを抜くこと（10行で実際に混入していた）。
            r['kid_raw'] = r['kid']
            kids = re.findall(r'\d{2,3}[A-Z]-\d{1,3}?(?=(?:\d{2,3}[A-Z]-)|\D|$)', r['kid'])
            r['kid'] = kids[0] if kids else ''
            r['kids'] = kids
            r['excluded'] = '採点除外' in r['kid_raw'] or '採点除外' in r['theme']
            r['star'] = '★' in r['type']
            r['cbt'] = '○' in r['cbt']
            for k in ('hisshu', 'ippan', 'rinsho'):
                r[k] = '○' in r[k]
            m = re.fullmatch(r'(\d{1,3})', r['rate'])
            r['rate'] = int(m.group(1)) if m else None
            rows[no] = r
    # ⚠️ 「※採点除外」の注記が国試番号セルを押し出し、**次の行の国試番号が前の行に載る**
    #    （NO.166 のセルが '115E-36113A-5'、NO.167 は '※採点除外' だけ＝ph で踏んだのと同型）。
    #    2つ持っている行の2つ目を、番号を失った次の行へ返す。
    for no in sorted(rows):
        r = rows[no]
        nxt = rows.get(no + 1)
        if len(r['kids']) == 2 and nxt is not None and not nxt['kid']:
            nxt['kid'] = r['kids'][1]
            r['kids'] = r['kids'][:1]
    return rows


if __name__ == '__main__':
    sid = next((a for a in sys.argv[1:] if not a.startswith('-')), 'circ')
    rows = load(sid)
    print('=== %s ===' % sid)
    print('読めた行 %d（NO.%d〜%d）' % (len(rows), min(rows), max(rows)))
    n = dict(star=0, cbt=0, hisshu=0, ippan=0, rinsho=0, rate=0, dis=0)
    for r in rows.values():
        for k in ('star', 'cbt', 'hisshu', 'ippan', 'rinsho'):
            n[k] += bool(r[k])
        n['rate'] += r['rate'] is not None
        n['dis'] += bool(r['dis'].strip())
    print('★%d  CBT%d  必修%d  一般%d  臨床%d  正答率あり%d  疾患名あり%d'
          % (n['star'], n['cbt'], n['hisshu'], n['ippan'], n['rinsho'], n['rate'], n['dis']))
    bad = [no for no, r in rows.items() if r['ippan'] == r['rinsho']]
    print('⚠ 一般と臨床が両方 or どちらも無い行:', bad if bad else 'なし')
    if '--dump' in sys.argv:
        for no in sorted(rows):
            r = rows[no]
            print('%3d %-2s %-9s %s%s%s%s%s %-4s %s' %
                  (no, r['ans'], r['kid'], '★' if r['star'] else '-',
                   'C' if r['cbt'] else '-', 'H' if r['hisshu'] else '-',
                   'I' if r['ippan'] else '-', 'R' if r['rinsho'] else '-',
                   r['rate'], r['dis'][:28]))
