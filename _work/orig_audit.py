# -*- coding: utf-8 -*-
"""原文照合（作り直し工程④）の検査を1本にまとめたもの。**科目を引数で切り替える。**

    python _work/orig_audit.py resp            要約だけ
    python _work/orig_audit.py resp --dump     _work/_{sid}_tmp/orig_*.txt に明細を書く

4つの検査を持つ。**4つを突き合わせて初めて実害が絞れる**（画像の④本と同じ考え方）:

  ans    巻末解答一覧表（anstable）との照合 — 国試番号・正解肢・正答率・「Nつ選べ」と ok の数
  choice 選択肢の**内容**が PDF 原文と一致するか
  qt     設問の文章（連問は共通ステム込み）が PDF 原文と一致するか
  stem   連問の共通ステムが兄弟全員の qt に入っているか

⚠️ **組版のゆれは畳んでから比べる**（〈〉/（）・PaO₂/PaO2・リーダー線の長さ・
   `10L/ 分` の追い出し空白・`気　胸` の中付き空白・末尾の「。」・異体字・合字）。
   畳まないと呼吸器では500件超が出て、本当の書き換え（要約・脱字・肢の入れ替わり）が埋もれた。

⚠️ **付着物を文字列で落とす保険を置かないこと。** 一度「JSON の全文で始まり余りが
   英数字だけなら同一とみなす」を入れたところ、呼吸器 NO.103 の
   `活性化プロテインC` が `活性化プロテイン` に痩せているのを**C は図ラベルだと解釈して
   握りつぶした**。版面の付着物は `pdfchoice` が span の座標と文字サイズで落とす
   ——**幾何で落とせるものを文字種で落とさない。**

⚠️ 直す側（fix4_*.py）は科目ごとの作業スクラッチ（`_work/_{sid}_tmp/`・Git管理外）に置く。
   **ここに置くのは「見つける側」だけ**——直し方は科目の事情で変わるが、
   何を食い違いと呼ぶかは変わらないため。
"""
import argparse
import importlib
import io
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anstable
import pdfchoice
import stem_pdf
import fitz

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = re.compile(r'<[^>]+>')
SUBSCRIPT = str.maketrans('₀₁₂₃₄₅₆₇₈₉⁻⁺',
                          '0123456789-+')
VARIANT = str.maketrans('囊瘙', '嚢掻')   # 囊->嚢 / 瘙->掻（異体字は組版のゆれ）
DASH = '‐‑‒–—―─－-−~〜～:：・'   # リーダー線・区切り記号は組版のゆれ
LIG = (('ﬁ', 'fi'), ('ﬂ', 'fl'), ('ﬀ', 'ff'), ('ﬃ', 'ffi'), ('ﬄ', 'ffl'))
KANSU = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
         '１': 1, '２': 2, '３': 3, '４': 4, '５': 5}


def N(s, dash=True):
    """内容の同一性だけを見る正規形。"""
    s = TAG.sub('', (s or '').replace('<br/>', '\n'))
    s = unicodedata.normalize('NFKC', s)
    s = s.translate(SUBSCRIPT).translate(VARIANT)
    for a, b in LIG:
        s = s.replace(a, b)
    s = s.replace('〈', '(').replace('〉', ')')
    if dash:
        s = re.sub('[' + re.escape(DASH) + ']+', '', s)
    s = re.sub(r'[\s　\x01]+', '', s)
    # 大小文字の差（`mEq/l` と `mEq/L`）は内容の違いではないので畳む
    return s.rstrip('<').rstrip('。').lower()


def load(sid):
    mod = importlib.import_module('%s_pdf' % sid)
    doc = fitz.open(mod.PDF)
    data = json.load(io.open(mod.JSON_PATH, encoding='utf-8'))
    found, _pages = mod.scan_anchors(doc)
    return mod, doc, data, found


def question_lines(doc, pno, code):
    """アンカーの後ろ〜最初の肢ラベルの手前（＝設問の文章）の行。"""
    out = []
    for row in pdfchoice.block_lines(doc, pno, code):
        t = row[2]
        if re.match(r'^[ａ-ｅ]', t.strip()):
            break
        if re.match(r'^(?:□|メック予備校用|Q-\d|\d{1,4}$|[A-F]{1,3}$)',
                    t.strip()):
            continue
        out.append(t)
    return out


def _sentences(body):
    buf, out = '', []
    for l in body:
        buf += l
        if l.endswith('。') or l.endswith('）'):
            out.append(buf)
            buf = ''
    if buf:
        out.append(buf)
    return out


def audit(sid):
    mod, doc, data, found = load(sid)
    rows = anstable.load(sid)
    stems = {}
    for a, b, decl, body in stem_pdf.find(doc):
        for no in range(a, b + 1):
            stems[no] = decl + ''.join(body)

    rep = {'ans': [], 'choice': [], 'qt': [], 'stem': []}
    byno = {}
    for ci, ch in enumerate(data['chapters'], 1):
        for q in ch['qs']:
            no = int(q['uid'].split('_q')[1])
            byno[no] = q
            code = q['episode'].strip('()（）')
            r = rows.get(no)

            # --- ans: 解答一覧表との照合
            if r is not None:
                if code != r['kid']:
                    rep['ans'].append('[番号] NO.%-4d JSON=%s 表=%s' % (no, code, r['kid']))
                oks = ''.join(sorted(c['t'].strip()[0] for c in q['choices'] if c.get('ok')))
                tbl = ''.join(sorted(c for c in r['ans'] if c in 'abcdefg'))
                if q['choices'] and tbl and oks != tbl:
                    rep['ans'].append('[正解] NO.%-4d %-10s JSON=%-4s 表=%s'
                                      % (no, code, oks or '(なし)', tbl))
                if r['rate'] is not None and q.get('rate') != r['rate']:
                    rep['ans'].append('[正答率] NO.%-4d %-10s JSON=%s 表=%s'
                                      % (no, code, q.get('rate'), r['rate']))
                m = re.search(r'([1-5１-５])\s*つ選べ', TAG.sub('', q['qt']))
                if m and q['choices'] and KANSU[m.group(1)] != len(oks):
                    rep['ans'].append('[個数] NO.%-4d %-10s 「%s つ選べ」だが ok=%d'
                                      % (no, code, m.group(1), len(oks)))

            if code not in found:
                rep['qt'].append('[原文なし] NO.%d %s' % (no, code))
                continue
            pno = found[code][0][0] - 1

            # --- choice: 選択肢の内容
            if q['choices']:
                pc = pdfchoice.extract(doc, pno, code)
                bad = []
                for c in q['choices']:
                    lab = unicodedata.normalize('NFKC', c['t'].strip()[0])
                    j, pv = N(c['t'][1:]), N(pc.get(lab, ''))
                    if j == pv:
                        continue
                    bad.append((lab, c['t'][1:].strip(), pc.get(lab, '')))
                if bad:
                    rep['choice'].append('NO.%-4d ch%02d %-10s %s'
                                         % (no, ci, code, ','.join(b[0] for b in bad)))
                    for lab, jt, pt in bad:
                        rep['choice'].append('    JSON %s| %s' % (lab, jt[:110]))
                        rep['choice'].append('    PDF  %s| %s' % (lab, pt[:110]))

            # --- qt: 設問の文章（連問は共通ステム込み）
            pv = N(stems.get(no, '') + ''.join(question_lines(doc, pno, code)))
            jv = N(q['qt'])
            if pv != jv:
                i = 0
                while i < min(len(pv), len(jv)) and pv[i] == jv[i]:
                    i += 1
                rep['qt'].append('NO.%-4d ch%02d %-10s JSON %d字 / PDF %d字  一致 %d字目まで'
                                 % (no, ci, code, len(jv), len(pv), i))
                rep['qt'].append('   JSON...| %s' % jv[i:i + 150])
                rep['qt'].append('   PDF ...| %s' % pv[i:i + 150])

    # --- stem: 連問の共通ステムが兄弟全員に入っているか
    for a, b, decl, body in stem_pdf.find(doc):
        if a not in byno:
            continue
        for s in _sentences(body):
            n = N(s, dash=False)
            if len(n) < 8:
                continue
            miss = [x for x in range(a, b + 1)
                    if x in byno and n not in N(byno[x]['qt'], dash=False)]
            if miss:
                rep['stem'].append('連問%d-%d NG Q.%s に無い: %s' % (a, b, miss, s[:110]))
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sid')
    ap.add_argument('--dump', action='store_true')
    a = ap.parse_args()
    rep = audit(a.sid)
    for k in ('ans', 'choice', 'qt', 'stem'):
        head = sum(1 for l in rep[k] if not l.startswith(' '))
        print('%-7s %d 件' % (k, head))
        if a.dump:
            out = os.path.join(BASE, '_work', '_%s_tmp' % a.sid)
            os.makedirs(out, exist_ok=True)
            p = os.path.join(out, 'orig_%s.txt' % k)
            io.open(p, 'w', encoding='utf-8').write('\n'.join(rep[k]))
            print('   -> %s' % p)


if __name__ == '__main__':
    main()
