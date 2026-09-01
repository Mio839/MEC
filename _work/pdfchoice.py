# -*- coding: utf-8 -*-
r"""PDF の1問から ａ〜ｅ の**原文**を切り出す（④-2 の正本）。

⚠️ 生テキストの行単位で切ってはいけない。
   ① `ａ　動脈血pH` の次行 ` 7.40` は その行頭の数字 に当たって肢の一部が落ちる
   ② 最後の肢には**ページ右端の正答率（sz 8.5・x 516.5）**と**図ラベル A/B** がくっつく
   どちらも版面の要素なので、**span の座標と文字サイズ**で外す。

版面の実測（呼吸器・臓器別講座）:
    本文 sz 9.2 / 添字 sz 5.5 / 行送り 14.2 / 左端 58.1（折り返し）・67.3（行頭）
    正答率 sz 8.5 x 516.5 / 「メック予備校用」sz 6.0 / 柱「Q-9」sz 7.8
"""
import re
import unicodedata

RATE_X = 512.0        # ここから右で sz≒8.5 なら正答率の欄
TAB_X = 545.0         # ここから右は縦組みの柱（「呼吸器の基本」）
LINE_GAP = 26.0       # これを超える縦の空きは「肢の並びが終わった」
ANCHOR_L = re.compile(r'^\s*(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
LAB = re.compile(r'^([ａ-ｅ])(?:[\s　]+|(?=[^\s　]))')


def page_lines(doc, pno):
    """1ページを (y, x0, text) の行の並びにする。正答率欄・柱・ノンブルは落とす。

    ⚠️ 添字（sz 5.5）はベースラインが本文より 4.7pt 下がるので、y で素朴に並べると
       **行末へ飛ぶ**（`安静時PaO 96Torr、労作後PaO 76Torr22`）。
       先に y で行へ束ね、**束ねてから x で並べる**こと。
    """
    spans = []
    for b in doc[pno].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                t = s['text']
                if not t.strip():
                    continue
                x, y, sz = s['bbox'][0], s['bbox'][1], s['size']
                # ⚠️ 右端を x だけで切ってはいけない——本文も右端 x517 まで組まれる
                #    （`（B）` sz9.2 x517.0）し、添字は x534 まで出る（sz5.5）。
                #    正答率の欄は **x>=512 かつ sz≒8.5** で、そこだけを落とす。
                if sz < 4.5 or sz > 12.0 or t.strip() == 'メック予備校用':
                    continue
                if x >= TAB_X:
                    continue          # 縦組みの柱（1文字ずつ縦に並ぶ）
                if x >= RATE_X and 8.0 <= sz <= 9.0:
                    continue
                spans.append((y, x, t, s['bbox'][2]))
    spans.sort(key=lambda v: v[0])
    lines, cur, top = [], [], None
    for y, x, t, x1 in spans:
        if top is None or y - top <= 6.0:
            if top is None:
                top = y
            cur.append((x, t, x1))
        else:
            lines.append(_mkline(top, cur))
            cur, top = [(x, t, x1)], y
    if cur:
        lines.append(_mkline(top, cur))
    return lines


def _mkline(y, parts):
    """1行ぶんの span を x で並べて連結する。

    ⚠️ 図ラベル（A〜E の1文字）が本文と同じ行に組まれる紙面がある
       （`胸部造影MRI` の右に `C`）。**本文から大きく離れた1文字は落とす**
       ——文字種だけで判定すると `MRI` の `I` のような正当な末尾を巻き込む。
    """
    parts.sort(key=lambda v: v[0])
    while len(parts) >= 2 and re.fullmatch(r'[A-E]', parts[-1][1].strip())             and parts[-1][0] - parts[-2][0] > 60:
        parts.pop()
    # (y, 行頭x, 本文, 行末x) — 行末xは「版面の右端まで届いた＝折り返し」の判定に使う
    return (y, parts[0][0], ''.join(p[1] for p in parts), max(p[2] for p in parts))


def block_lines(doc, pno, code):
    """その設問の行だけを返す（次のアンカーの手前まで。ページをまたぐ場合は次ページ冒頭も）。"""
    ls = page_lines(doc, pno)
    start = None
    for i, (_y, _x, t, _x1) in enumerate(ls):
        m = ANCHOR_L.match(t)
        if m and m.group(2) == code:
            start = i
            break
    if start is None:
        return []
    out = []
    for row in ls[start + 1:]:
        if ANCHOR_L.match(row[2]):
            return out
        out.append(row)
    if pno + 1 < doc.page_count:      # 次ページへまたぐ
        for row in page_lines(doc, pno + 1):
            if ANCHOR_L.match(row[2]):
                break
            out.append((row[0] + 10000,) + tuple(row[1:]))
    return out


def extract(doc, pno, code):
    """{'a': '原文', ...}。見つからない肢はキーごと無い。

    ⚠️ ラベルは行頭にあるとは限らない——図の中の文字が同じ行に流れ込んで
       `Aｃ　海外渡航歴` `100ｃ　①又は④` になる紙面がある。**次に来るはずの
       ラベルを行の中から探す**（順序で縛るので図の文字を肢と誤認しない）。
    """
    ls = block_lines(doc, pno, code)
    seq = 'ａｂｃｄｅ'
    hits = []          # (行index, ラベル, ラベルの後ろの文字列)
    k = 0
    for i, (_y, _x, t, _x1) in enumerate(ls):
        while k < len(seq):
            m = re.search(seq[k] + r'(?:[\s　]+|(?=[^\s　]))', t)
            if not m:
                break
            hits.append((i, unicodedata.normalize('NFKC', seq[k]), t[m.end():]))
            t = t[m.end():]
            k += 1
    if not hits:
        return {}
    out = {}
    for n, (i, lab, head) in enumerate(hits):
        parts = [head]
        stop = hits[n + 1][0] if n + 1 < len(hits) else len(ls)
        if n + 1 < len(hits) and hits[n + 1][0] == i:
            out[lab] = clean(head[:len(head) - len(hits[n + 1][2])])
            continue
        prev_y = ls[i][0]
        for j in range(i + 1, stop):
            y, _x, t2 = ls[j][0], ls[j][1], ls[j][2]
            if y - prev_y > LINE_GAP or t2.strip().startswith('□'):
                break
            if re.fullmatch(r'[A-E]', t2.strip()) and _x > 300:
                break          # 右段の図ラベルが肢の直後の行に来る紙面がある

            parts.append(t2)
            prev_y = y
        out[lab] = clean(''.join(parts))
    return out


def clean(s):
    s = s.replace('\x01', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip().strip('　').strip()
