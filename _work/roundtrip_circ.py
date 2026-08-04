# -*- coding: utf-8 -*-
"""
循環器の生成パイプラインが既存データを壊していないかを検証する。

    questions_circ.json ──scaffold──> build_circ_ch{NN}.py ──emit──> 循環器/ch*.html
                                                            ──build_circ_json.py──> questions_circ.json

この往復で **uid・設問文・選択肢・正解フラグ・画像・正答率が1問も変わらないこと**を保証する。
ここが通らないうちは解説を1文字も書かない（書いた後に配管の欠陥が出ると全部やり直しになる）。

    python _work/roundtrip_circ.py            # 不変フィールドだけ比較（解説の執筆中はこちら）
    python _work/roundtrip_circ.py --strict   # eg（解説）まで完全一致を要求（Step 0 の合格判定）
    python _work/roundtrip_circ.py --baseline # 現在の questions_circ.json を基準として保存し直す

基準ファイル: _work/_baseline_circ.json（作り直す前の questions_circ.json のスナップショット）
"""
import json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(r'C:\Users\coool\Desktop\MEC')
CUR = BASE / 'questions_circ.json'
BASELINE = BASE / '_work' / '_baseline_circ.json'

# 解説(eg)以外はすべて不変でなければならない
INVARIANT = ['uid', 'qn', 'episode', 'rate', 'rate_cls', 'rate_text',
             'badges', 'qt', 'ans_label', 'ans_sub', 'imgs']


def load(p):
    d = json.loads(p.read_text(encoding='utf-8'))
    out = {}
    for ch in d['chapters']:
        for q in ch['qs']:
            out[q['uid']] = q
    return d, out


def choice_sig(q):
    return [(c['t'], c['ok']) for c in q.get('choices', [])]


def main():
    strict = '--strict' in sys.argv

    if '--baseline' in sys.argv:
        BASELINE.write_text(CUR.read_text(encoding='utf-8'), encoding='utf-8')
        print(f'-> 基準を保存: {BASELINE.name}  ({BASELINE.stat().st_size // 1024}KB)')
        return 0

    if not BASELINE.exists():
        print('基準ファイルが無い。先に python _work/roundtrip_circ.py --baseline を実行すること。')
        return 2

    bd, bq = load(BASELINE)
    cd, cq = load(CUR)

    issues = []

    if len(bd['chapters']) != len(cd['chapters']):
        issues.append(f'[章数] 基準 {len(bd["chapters"])} → 現在 {len(cd["chapters"])}')
    for i, (b, c) in enumerate(zip(bd['chapters'], cd['chapters']), 1):
        if b['title'] != c['title']:
            issues.append(f'[章名] ch{i:02d}: {b["title"]!r} → {c["title"]!r}')
        if len(b['qs']) != len(c['qs']):
            issues.append(f'[問数] ch{i:02d}: {len(b["qs"])} → {len(c["qs"])}')

    missing = [u for u in bq if u not in cq]
    added = [u for u in cq if u not in bq]
    for u in missing[:20]:
        issues.append(f'[uid消失] {u}')
    for u in added[:20]:
        issues.append(f'[uid新設] {u}')
    if len(missing) > 20:
        issues.append(f'[uid消失] …他 {len(missing) - 20} 件')
    if len(added) > 20:
        issues.append(f'[uid新設] …他 {len(added) - 20} 件')

    n_eg_diff = 0
    for uid, b in bq.items():
        c = cq.get(uid)
        if c is None:
            continue
        for f in INVARIANT:
            if b.get(f) != c.get(f):
                bv, cv = repr(b.get(f))[:120], repr(c.get(f))[:120]
                issues.append(f'[{f}] {uid}\n      基準: {bv}\n      現在: {cv}')
        if choice_sig(b) != choice_sig(c):
            issues.append(f'[choices] {uid}\n      基準: {choice_sig(b)}\n      現在: {choice_sig(c)}')
        if b.get('eg') != c.get('eg'):
            n_eg_diff += 1
            if strict:
                bb, cc = b.get('eg', []), c.get('eg', [])
                if len(bb) != len(cc):
                    issues.append(f'[eg件数] {uid}: {len(bb)} → {len(cc)}')
                else:
                    for k, (x, y) in enumerate(zip(bb, cc)):
                        for f in ('cls', 'h', 'c'):
                            if x.get(f) != y.get(f):
                                issues.append(
                                    f'[eg.{k}.{f}] {uid}\n      基準: {x.get(f)!r:.160}\n'
                                    f'      現在: {y.get(f)!r:.160}')

    # 採点の不変条件（ガイド §4）も同時に見る
    for uid, c in cq.items():
        oks = sum(1 for x in c.get('choices', []) if x['ok'])
        excluded = any(b['cls'] == 'bx' for b in c.get('badges', []))
        if c.get('choices') and oks == 0 and not excluded:
            issues.append(f'[ok=0] {uid} 何を選んでも不正解になる')
        if bool(c.get('imgs')) != any(b['cls'] == 'bi' for b in c.get('badges', [])):
            issues.append(f'[📷バッジ] {uid} バッジと画像の有無が不一致')

    print(f'基準 {len(bq)}問 / 現在 {len(cq)}問')
    print(f'解説(eg)が変わった問題: {n_eg_diff}問'
          f'{"（--strict なので差分として扱う）" if strict else "（比較対象外）"}')
    if issues:
        print(f'\n=== 不一致 {len(issues)} 件 ===')
        for s in issues[:60]:
            print('  ' + s)
        if len(issues) > 60:
            print(f'  …他 {len(issues) - 60} 件')
        return 1
    print('\n✅ 往復で既存データは1件も変わっていない')
    return 0


if __name__ == '__main__':
    sys.exit(main())
