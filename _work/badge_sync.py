# -*- coding: utf-8 -*-
"""② バッジを巻末の解答一覧表から機械転記する（★・必修・CBT・一般・臨床・採点除外）。

    python _work/badge_sync.py endo            # 下見
    python _work/badge_sync.py endo --apply    # 適用

**AIの判断が一切入らない**のが要点——値の正本は `anstable.py`（x座標で列を切る）だけ。
循環器の作り直しで「一般・臨床」を新設したときの規約に従う（CLAUDE.md「バッジと rate_text」）。

| cls | 出どころ |
|---|---|
| `bs` ★ / `bh` 必修 / `bc` CBT / `bip` 一般 / `brn` 臨床 / `bx` 採点除外 | 解答一覧表 |
| `bi` 📷 画像 / `bm` N択 / `bk` 計算 / `bsub` 科目 | **設問そのものの性質＝既存 JSON をそのまま持ち越す** |

並びは `bs → bh → bc → bip|brn → （持ち越し分は元の相対順） → bx`（循環器・神経の実測に合わせる）。

⚠️ **`bi` は `imgs` の有無と一致していなければならない**（🖼️フィルタの根拠・採点データの不変条件）。
   食い違ったら**書き換えずに落とす**。
⚠️ **JSON の整形はファイルごとに違う**。生バイトと往復一致する形が見つからなければ書き込まない。
"""
import argparse, io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anstable
from qt_restyle import _fmt

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UID_NO = re.compile(r'_q(\d+)$')
# 解答一覧表から来るバッジ（並び順に並べてある）
FROM_TABLE = [('star', 'bs', '★'), ('hisshu', 'bh', '必修'), ('cbt', 'bc', 'CBT'),
              ('ippan', 'bip', '一般'), ('rinsho', 'brn', '臨床')]
# 設問そのものの性質＝解答一覧表に無いので既存 JSON を**元の相対順のまま**持ち越す
KEEP = ['bi', 'bm', 'bk', 'bsub']
TAIL = ('excluded', 'bx', '採点除外')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sid')
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()

    path = os.path.join(BASE, 'questions_%s.json' % a.sid)
    raw = io.open(path, 'rb').read()
    j = json.loads(raw.decode('utf-8'))
    fmt = _fmt(raw, j)
    if fmt is None:
        sys.exit('⚠️ JSON の整形を再現できない＝書き戻すと全行が差分になる。中止する。')

    rows = anstable.load(a.sid)
    qs = [q for ch in j['chapters'] for q in ch['qs']]
    add, drop, bad = {}, {}, []
    for q in qs:
        no = int(UID_NO.search(q['uid']).group(1))
        r = rows.get(no)
        if r is None:
            bad.append((q['uid'], '解答一覧表に行が無い'))
            continue
        old = [(b['cls'], b['t']) for b in (q.get('badges') or [])]
        keep = [(c, t) for c, t in old if c in KEEP]
        # ⚠️ 📷バッジと imgs の一致（採点データの不変条件）
        if bool(q.get('imgs')) != any(c == 'bi' for c, _t in keep):
            bad.append((q['uid'], '📷バッジと imgs が食い違う'))
            continue
        new = [(cls, t) for key, cls, t in FROM_TABLE if r[key]]
        new += keep
        if r[TAIL[0]]:
            new.append(TAIL[1:])
        for c, _t in new:
            if c not in dict(old):
                add[c] = add.get(c, 0) + 1
        for c, _t in old:
            if c not in dict(new):
                drop[c] = drop.get(c, 0) + 1
        q['badges'] = [{'cls': c, 't': t} for c, t in new]

    print('%s: %d問  足した %s  外した %s' % (a.sid, len(qs), add or '-', drop or '-'))
    for uid, why in bad:
        print('  ⚠️ %s  %s' % (uid, why))
    if bad:
        sys.exit('⚠️ 食い違いがある。直してから流し直すこと。')
    if not a.apply:
        print('（下見。書き込むには --apply）')
        return
    indent, sep, nl, tail = fmt
    s = json.dumps(j, ensure_ascii=False, indent=indent, separators=sep)
    io.open(path, 'wb').write((s.replace('\n', nl) + tail).encode('utf-8'))
    print('-> %s を書き換えた' % path)


if __name__ == '__main__':
    main()
