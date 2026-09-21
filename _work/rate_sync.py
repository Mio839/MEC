# -*- coding: utf-8 -*-
"""② 正答率を巻末の解答一覧表から機械転記する（`rate` / `rate_text` / `rate_cls`）。

    python _work/rate_sync.py endo            # 下見
    python _work/rate_sync.py endo --apply    # 適用

`badge_sync.py` と同じ思想——**値の正本は `anstable.py` だけ**で、AIの判断が入らない。

| | |
|---|---|
| `rate` | 表の数値。表に無ければ `-1` |
| `rate_text` | `"96%"`。表に無ければ `""`。⚠️ `"正答率 96%"` は旧コア12科目だけの古い形 |
| `rate_cls` | `cl`(<60 難問) / `cm`(60〜79 標準) / `ch`(>=80 易問)。表に無ければ `""` |

⚠️⚠️ **`rate` は難易度フィルタ・`_isHardCard`・`qmeta.r`・`rate_index.js`・弱点カルテの全国比が
読む**。ずれていると「全国的に難しい問題」が易問として出る。内分泌代謝では **18問が
連問グループ内で1つずつ回転してずれていた**（NO.338 は実際 16% なのに 92% と表示されていた）。
回転は抽出時のオフセット由来で、**行ごとに x 座標で切る解答一覧表の側には起こりえない**。

⚠️ 表に無いのに `rate_cls` だけ入っている問題があると、**正答率が無いのに易問フィルタに出る**
（呼吸器で9問が `ch` のまま残っていた）。ここを揃えるのもこのツールの仕事。
"""
import argparse, io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anstable
from qt_restyle import _fmt

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UID_NO = re.compile(r'_q(\d+)$')


def cls_of(rate):
    if rate is None:
        return ''
    return 'cl' if rate < 60 else ('cm' if rate < 80 else 'ch')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sid')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--show', type=int, default=40)
    a = ap.parse_args()

    path = os.path.join(BASE, 'questions_%s.json' % a.sid)
    raw = io.open(path, 'rb').read()
    j = json.loads(raw.decode('utf-8'))
    fmt = _fmt(raw, j)
    if fmt is None:
        sys.exit('⚠️ JSON の整形を再現できない＝書き戻すと全行が差分になる。中止する。')

    rows = anstable.load(a.sid)
    qs = [q for ch in j['chapters'] for q in ch['qs']]
    moved, filled, cleared, styled, clsfix = [], [], [], 0, []
    for q in qs:
        no = int(UID_NO.search(q['uid']).group(1))
        want = rows[no]['rate'] if no in rows else None
        have = q.get('rate')
        have = None if (have is None or have < 0) else have
        if want is not None and have is not None and want != have:
            moved.append((no, q.get('episode'), have, want))
        elif want is not None and have is None:
            filled.append((no, q.get('episode'), want))
        elif want is None and have is not None:
            cleared.append((no, q.get('episode'), have))
        text = '%d%%' % want if want is not None else ''
        if (q.get('rate_text') or '') != text and want is not None and have == want:
            styled += 1
        if (q.get('rate_cls') or '') != cls_of(want):
            clsfix.append(no)
        q['rate'] = want if want is not None else -1
        q['rate_text'] = text
        q['rate_cls'] = cls_of(want)

    print('%s: %d問  値のずれ %d  表にあって未記入 %d  表に無いのに記入 %d  '
          'rate_text を "N%%" へ %d  rate_cls の是正 %d'
          % (a.sid, len(qs), len(moved), len(filled), len(cleared), styled, len(clsfix)))
    for no, ep, have, want in moved[:a.show]:
        print('   ずれ NO.%-4d %-12s %s%% -> %s%%' % (no, ep, have, want))
    for no, ep, want in filled[:a.show]:
        print('   補完 NO.%-4d %-12s     -> %s%%' % (no, ep, want))
    for no, ep, have in cleared[:a.show]:
        print('   ⚠️消去 NO.%-4d %-12s %s%% -> なし' % (no, ep, have))
    if not a.apply:
        print('（下見。書き込むには --apply）')
        return
    indent, sep, nl, tail = fmt
    s = json.dumps(j, ensure_ascii=False, indent=indent, separators=sep)
    io.open(path, 'wb').write((s.replace('\n', nl) + tail).encode('utf-8'))
    print('-> %s を書き換えた' % path)


if __name__ == '__main__':
    main()
