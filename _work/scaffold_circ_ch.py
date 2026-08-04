# -*- coding: utf-8 -*-
"""
questions_circ.json から章の生成器 _work/build_circ_ch{NN}.py の骨格を自動生成する。

## なぜ手書きしないのか

眼科・皮膚科の生成器は設問文・選択肢・正解フラグまで人（AI）が書き起こしていた。新科目なら
PDFから起こす以外に道が無いのでそれでよいが、循環器は**既に正しい設問データが
questions_circ.json にある**。そこを人が転記し直すと

  - `.ch2.ok` の取りこぼし＝試験モードで何を選んでも不正解（呼吸器429問の前科がこれ）
  - uid の振り直し＝done_v2 / mec_srs_v1 / myrate_v1 / mec_attempts_v1 の学習履歴が消える

という壊し方を再生産する。そこで**設問データは機械が転記し、人は解説だけを書く**。
生成された build_circ_ch{NN}.py で編集してよいのは

  - 各選択肢の3番目の要素 `why`（肢別解説）
  - `patho=` / `deep=` / `point=`（ep病態 / em深掘り / ept国試ポイント）
  - `SECTIONS`（章内の見出し）

だけで、qt・choices の表示テキスト・ok・imgs・badges・rate には触らない。

## 使い方

    python _work/scaffold_circ_ch.py 7          # 第7章だけ生成
    python _work/scaffold_circ_ch.py all        # 全10章
    python _work/scaffold_circ_ch.py 7 --force  # 既存ファイルを上書き（解説が消えるので注意）

既存の build_circ_ch{NN}.py がある場合、--force なしなら中断する（書いた解説を守るため）。
"""
import json, sys, io
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(r'C:\Users\coool\Desktop\MEC')
WORK = BASE / '_work'
SRC = BASE / 'questions_circ.json'

# 章番号 -> 出力HTMLのファイル名（_archive/循環器 の名前をそのまま使う）
OUT_NAMES = {
    1: 'ch01_circulatory_basics.html',
    2: 'ch02_heart_failure.html',
    3: 'ch03_ischemic_heart.html',
    4: 'ch04_arrhythmia.html',
    5: 'ch05_valvular.html',
    6: 'ch06_pericardium.html',
    7: 'ch07_myocardium.html',
    8: 'ch08_aorta.html',
    9: 'ch09_peripheral_vessels.html',
    10: 'ch10_blood_pressure.html',
}

HEADER = '''# -*- coding: utf-8 -*-
"""
循環器 第{ch}章「{name}」(Q.{lo}-{hi}・{n}問) の章別HTML({out})を生成する。

⚠️ このファイルは _work/scaffold_circ_ch.py が questions_circ.json から自動生成した骨格である。
   **設問文・選択肢・ok・imgs・badges・正答率には手を触れないこと**（既存データの正本をそのまま
   転記してある）。編集してよいのは各選択肢の3番目 `why`・`patho=`・`deep=`・`point=`・SECTIONS だけ。

品質基準は _work/新科目HTML生成ガイド.md §2（眼科・皮膚科水準＝1問あたり
ep病態 + ee全肢検討表 + em深掘り + ept国試ポイント の4ブロック）。
解説はPDFに無くAIが執筆するため、**医学的正確性はユーザーの抜き取り確認が前提**。

    python _work/build_circ_ch{ch:02d}.py     # -> {out}
    python _work/build_circ_json.py           # -> questions_circ.json
    python _work/roundtrip_circ.py            # 既存データを壊していないか検証
"""
from circ_render import Q, emit

CH_NUM = {ch}
CH_NAME = '{name}'
OUT_NAME = '{out}'
Q_START = {lo}          # この章の先頭問題のQ番号（科目内の通し番号。章ごとに1へ戻さない）

# 章内の見出し。(アンカー, 見出し, '', QUESTIONS内の開始index)
SECTIONS = [
    ('s1', '第{ch}章 {name}', '', 0),
]

QUESTIONS = [
'''

FOOTER = '''
]

if __name__ == '__main__':
    emit(ch_num=CH_NUM, ch_name=CH_NAME, out_name=OUT_NAME,
         q_start=Q_START, questions=QUESTIONS, sections=SECTIONS)
'''


def py(s):
    """Python文字列リテラルとして安全に埋め込む。"""
    return repr(s)


def render_question(q):
    lines = []
    badges = ', '.join(f'({py(b["cls"])}, {py(b["t"])})' for b in q['badges'])
    lines.append(f'Q({py(q["episode"])}, {py(q["rate_cls"])}, {py(q["rate_text"])},')
    lines.append(f'  [{badges}],')
    lines.append(f'  {py(q["qt"])},')

    lines.append('  [')
    for c in q['choices']:
        lines.append(f'   ({py(c["t"])}, {c["ok"]}, None),')
    lines.append('  ],')

    lines.append(f'  {py(q["ans_label"])}, {py(q["ans_sub"])},')

    imgs = [p.split('/', 1)[1] if p.startswith('循環器/') else p for p in q['imgs']]
    if imgs:
        lines.append('  imgs=[' + ', '.join(py(p) for p in imgs) + '],')

    if q['eg']:
        lines.append('  legacy_eg=[')
        for e in q['eg']:
            lines.append(f'   ({py(e["cls"])}, {py(e["h"])},')
            lines.append(f'    {py(e["c"])}),')
        lines.append('  ],')

    lines.append('  patho=None, deep=None, point=None),')
    return '\n'.join(lines)


def scaffold(ch_num, force=False):
    data = json.loads(SRC.read_text(encoding='utf-8'))
    meta = json.loads((BASE / '循環器' / 'circ_questions.json').read_text(encoding='utf-8'))
    names = {c['chapter']['num']: c['chapter']['name'] for c in meta}

    ch = data['chapters'][ch_num - 1]
    qs = ch['qs']
    nums = [int(q['uid'].split('_q')[1]) for q in qs]
    lo, hi = nums[0], nums[-1]
    if nums != list(range(lo, hi + 1)):
        raise SystemExit(f'ch{ch_num:02d}: Q番号が連続していない。{nums[:5]}…')

    out_py = WORK / f'build_circ_ch{ch_num:02d}.py'
    if out_py.exists() and not force:
        print(f'  skip {out_py.name}（既存。上書きするなら --force）')
        return

    body = HEADER.format(ch=ch_num, name=names[ch_num], out=OUT_NAMES[ch_num],
                         lo=lo, hi=hi, n=len(qs))
    body += '\n'.join(render_question(q) for q in qs)
    body += FOOTER

    with io.open(out_py, 'w', encoding='utf-8', newline='\n') as f:
        f.write(body)
    n_img = sum(1 for q in qs if q['imgs'])
    print(f'-> {out_py.name}  Q.{lo}-{hi} {len(qs)}問（画像{n_img}問）'
          f'  {out_py.stat().st_size // 1024}KB')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    if not args:
        raise SystemExit(__doc__)
    targets = range(1, 11) if args[0] == 'all' else [int(args[0])]
    for c in targets:
        scaffold(c, force)
