# -*- coding: utf-8 -*-
"""過去問カードのうち「選択肢はあるが正解肢（ok）が無い」9件を直す（冪等・--dry-run あり）。

■ なぜ危ないか
試験モードの採点は `.ch2.ok` の個数だけで決まる（`ans_label` やバッジは見ない）。
ok が1つも無いカードは**何を選んでも黙って不正解**になる。呼吸器429問で起きたのと同じ失敗モード。
`node _work/test_calc_input.js` が件数を固定して見張っていた9件がこれ。

■ 9件は2種類だった
  (A) 正解ラベル(`ac`)ごと空の7件 — 抽出時に「正解」ブロックを取り落としたもの。
      PDFの「正解」ブロックを正本に ok を付け、選択率が最大の肢と一致することも確認する。
      いずれも「2つ選べ」で、複数正解の問題ほど落ちやすかった。
  (B) 計算問題に別の設問の選択肢が付いていた2件（`117F71` `118C73`）—
      どちらも連問の一部で、**連問のサブ設問どうしが同じ選択肢を共有**しているのが原因。
      計算問題は桁入力で解くので選択肢自体が誤り。選択肢を外して `calc_input.js` に渡す。
      外したあと `node _work/normalize_calc_answers.js` で `計算答：6,5` → `計算答：65` に正規化する
      （選択肢を持つカードは normalize の対象外だったため旧カンマ形式のまま残っていた）。

⚠️ (B)で判明した連問の選択肢共有は 147カード に及ぶ**別口の未解決問題**。このスクリプトは
   直さない（サブ設問ごとの設問文と選択肢をPDFから取り直す作業が要る）。

使い方:
  python _work/restore_missing_ok_flags.py --dry-run
  python _work/restore_missing_ok_flags.py
  node _work/normalize_calc_answers.js          # (B)のあとに続けて流す
"""
import sys, os, io, re

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAK = os.path.join(BASE, '国家試験過去問')
FULL = 'ａｂｃｄｅｆ'

# ── (A) 正解肢を付ける7件 ───────────────────────────────────────
# rate は PDF の「正答率（選択率）」。カードの data-rate と一致することを確認に使う
# （＝同じ問題の紙面を見ていることの独立した裏取り）。
OK_TARGETS = [
    dict(file='第116回/116D_kakuron.html', uid='kakumon_116D_q69', ok='cd', rate='82.7',
         note='レジオネラ肺炎。PDF正解「ｃ、ｄ」・選択率 c87.5/d87.0'),
    dict(file='第116回/116F_kakuron.html', uid='kakumon_116F_q57', ok='be', rate='88.5',
         note='眼窩吹き抜け骨折。PDF正解「ｂ、ｅ」・選択率 b88.9/e96.2'),
    dict(file='第117回/117D_kakuron.html', uid='kakumon_117D_q47', ok='de', rate='46.7',
         note='破傷風。PDF正解「ｄ、ｅ」・選択率 d99.4/e46.9'),
    dict(file='第118回/118C_kakuron.html', uid='kakumon_118C_q31', ok='bc', rate='99.1',
         note='要介護認定。PDF正解「ｂ、ｃ」・選択率 b99.3/c99.8'),
    dict(file='第118回/118F_kakuron.html', uid='kakumon_118F_q32', ok='bc', rate='71.5',
         note='複視をきたす疾患。PDF正解「ｂ、ｃ」・選択率 b75.9/c94.9'),
    dict(file='第118回/118F_kakuron.html', uid='kakumon_118F_q35', ok='cd', rate='97.7',
         note='特殊健康診断。PDF正解「ｃ、ｄ」・選択率 c98.4/d99.0'),
    dict(file='第119回/119C_kakuron.html', uid='kakumon_119C_q32', ok='be', rate='96.7',
         note='主治医意見書。PDF正解「ｂ、ｅ」・選択率 b97.9/e98.6'),
]

# ── (B) 計算問題から誤った選択肢を外す2件 ─────────────────────────
CALC_TARGETS = [
    dict(file='第117回/117F_kakuron.html', uid='kakumon_117F_q71', rate='67.8',
         first_choice='ａ　ヘパリン',
         note='連問71〜73の71（A-aDO2を求めよ・解答：①②Torr）。付いていたのは73「治療薬」の選択肢'),
    dict(file='第118回/118C_kakuron.html', uid='kakumon_118C_q73', rate='92.0',
         first_choice='ａ　眼球陥凹',
         note='連問72〜74の73（血清浸透圧を求めよ・解答：①②③mOsm/L）。付いていたのは72「身体所見」の選択肢'),
]


def _card(txt, uid):
    """カード1枚の [開始, 終了) を返す。カードは次の qc の直前まで。"""
    i = txt.find(f'data-uid="{uid}"')
    if i < 0:
        return None, None
    a = txt.rfind('<div class="qc"', 0, i)
    b = txt.find('<div class="qc"', a + 10)
    return a, (b if b > 0 else len(txt))


def _choices(card):
    return [(m.group(0), m.group(1), m.group(2))
            for m in re.finditer(r'<div class="ch2([^"]*)">([\s\S]*?)</div>', card)]


def patch_ok(t, dry):
    path = os.path.join(KAK, t['file'])
    txt = io.open(path, encoding='utf-8', newline='').read()
    a, b = _card(txt, t['uid'])
    if a is None:
        return f'✗ {t["uid"]}: カードが見つからない'
    card = txt[a:b]

    rate = re.search(r'data-rate="([^"]*)"', card)
    if not rate or rate.group(1) != t['rate']:
        return f'✗ {t["uid"]}: data-rate={rate and rate.group(1)} が PDF の {t["rate"]} と違う'

    chs = _choices(card)
    if any('ok' in c[1] for c in chs):
        return f'– {t["uid"]}: 既に正解肢あり（スキップ）'
    if len(chs) != 5:
        return f'✗ {t["uid"]}: 選択肢が5個でない（{len(chs)}個）'

    want = [FULL['abcdef'.index(c)] for c in t['ok']]
    new, labels = card, []
    for whole, cls, body in chs:
        letter = re.sub(r'<[^>]+>', '', body).strip()[:1]
        if letter in want:
            new = new.replace(whole, f'<div class="ch2 ok">{body}</div>', 1)
            labels.append(re.sub(r'<[^>]+>', '', body).strip())
    if len(labels) != len(want):
        return f'✗ {t["uid"]}: 正解肢 {t["ok"]} を選択肢の中に見つけられない'

    # 空の正解ラベルを埋める（既存カードの体裁＝改行区切り）
    new = new.replace('<div class="ac"></div>',
                      '<div class="ac">' + '\n'.join(labels) + '</div>', 1)

    if not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(txt[:a] + new + txt[b:])
    return f'✓ {t["uid"]}: ok={t["ok"]}（{t["note"]}）'


def patch_calc(t, dry):
    path = os.path.join(KAK, t['file'])
    txt = io.open(path, encoding='utf-8', newline='').read()
    a, b = _card(txt, t['uid'])
    if a is None:
        return f'✗ {t["uid"]}: カードが見つからない'
    card = txt[a:b]

    rate = re.search(r'data-rate="([^"]*)"', card)
    if not rate or rate.group(1) != t['rate']:
        return f'✗ {t["uid"]}: data-rate={rate and rate.group(1)} が PDF の {t["rate"]} と違う'
    if not re.search(r'<div class="ac">\s*計算答', card):
        return f'✗ {t["uid"]}: ans_label が計算答でない（計算問題ではない？）'

    m = re.search(r'<div class="cs">([\s\S]*?)</div>\s*<div class="ab">', card)
    if not m:
        return f'✗ {t["uid"]}: cs が見つからない'
    if not m.group(1).strip():
        return f'– {t["uid"]}: 既に選択肢なし（スキップ）'
    # 外す選択肢が想定どおり別設問のものか、先頭肢で確認する
    first = re.sub(r'<[^>]+>', '', _choices(card)[0][2]).strip()
    if first != t['first_choice']:
        return f'✗ {t["uid"]}: 先頭の肢が {first!r}（想定 {t["first_choice"]!r}）'

    new = card[:m.start(1)] + card[m.end(1):]
    if not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(txt[:a] + new + txt[b:])
    return f'✓ {t["uid"]}: 誤った選択肢5個を除去（{t["note"]}）'


def main():
    dry = '--dry-run' in sys.argv
    print('=== (A) 正解肢を付ける ===')
    for t in OK_TARGETS:
        print('  ' + patch_ok(t, dry))
    print('=== (B) 計算問題から誤った選択肢を外す ===')
    for t in CALC_TARGETS:
        print('  ' + patch_calc(t, dry))
    if dry:
        print('\n(--dry-run: 書き込みなし)')
    else:
        print('\n次に: node _work/normalize_calc_answers.js')


if __name__ == '__main__':
    main()
