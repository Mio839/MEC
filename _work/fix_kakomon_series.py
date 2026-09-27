# -*- coding: utf-8 -*-
"""過去問ビューアの連問カードを PDF から作り直す（冪等・--dry-run あり）。

■ 背景（2026-09-27）
過去問HTMLの連問（「次の文を読み、40、41 の問いに答えよ。」）は、HTML化のときにサブ設問ごとに
切り分けられておらず、230枚のうち
  - 175枚は設問の一文（<strong>40　…</strong>）が別のサブ設問のもの
  - 144枚は直前のカードと qt も選択肢も完全に同じ（＝別の設問の選択肢で出題・採点されていた）
  - 19枚は症例文ごと別の連問のもの（118F67 に 70〜72 の症例と 75 の選択肢が付いていた等）
だった。件数チェックでは見つからない壊れ方（ok の個数は合っている）。

■ 作り直す範囲
連問の全カードについて、qb の中身（qt・選択肢・正解・解説）と qh の正答率・N択バッジを
PDF から作り直す。qh のそれ以外（画像・★・採点除外バッジ、uid、ボタン）は触らない。

■ PDF の組版（MEC標準解説集）
  次の文を読み、40、41 の問いに答えよ。＋症例          ← 共通の症例（途中経過の文が挟まることもある）
  40　設問文 ＼n ａ　… ｅ　…                           ← サブ設問ごとに独立したブロック
  41　設問文 ＼n ａ　… ｅ　…
  [着目point] 40：… 41：… ／ [鑑別診断へのプロセス] ①②…
  [選択肢考察] 40＼n○ａ … ／ 41＼n○ａ …                  ← サブ設問ごとに独立したブロック
  [確定診断] … ／ [正解] 40：ａ　41：ｄ ／ [正答率（選択率）] 40：99.4％（…）
  [check point] 《…》… ／ [参考] …
左端（x<100）の見出しで区切りを判定する。

■ 検算（通らないカードは書き換えない）
  - 選択肢が2つ以上・ラベルが ａ から連番
  - 正解の肢がすべて選択肢に存在する
  - 「Nつ選べ」＝正解の個数（採点除外を除く）
  - 正答率が取れたら正解の肢の選択率と一致する

使い方:
  python _work/fix_kakomon_series.py --dry-run     # 変更件数と要確認だけ出す
  python _work/fix_kakomon_series.py               # 書き込む
  python _work/fix_kakomon_series.py --check       # 変更が残っていないか（0件で終了コード0）
"""
import sys, os, re, glob, html, unicodedata

import fitz

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAK = os.path.join(BASE, '国家試験過去問')

FULL = 'ａｂｃｄｅｆｇｈｉｊｋｌ'
CTRL = re.compile(r'[\u0000-\u0008\u000B\u000C\u000E-\u001F]')
HEAD_RE = re.compile(r'^次の文を読み、\s*(\d+)\s*(?:[、，,]\s*(\d+)\s*)*(?:[～~]\s*(\d+))?')
LABELS = ('着目point', '鑑別診断への', 'プロセス', '選択肢考察', '確定診断', '正解', '画像診断', '類問',
          '正答率（選択率）', 'check point', '参考', '割問コメント', '別解')


def clean(t):
    return CTRL.sub('', t)


def norm(s):
    s = unicodedata.normalize('NFKC', s or '')
    s = CTRL.sub('', s)
    return re.sub(r'\s+', '', s)


def esc(t):
    return html.escape(t, quote=False)


# ---------------------------------------------------------------- PDF 走査
def pdf_sequence(pdf):
    """ページ順に (section, kind, text, page) を返す。kind: 'main' / 'label'。"""
    d = fitz.open(pdf)
    seq = []
    for pi, p in enumerate(d):
        blocks = [b for b in p.get_text('blocks') if b[6] == 0]
        sec = None
        for b in blocks:
            t = b[4].strip()
            if re.fullmatch(r'[A-F]', t) and (b[0] < 30 or b[0] > 485):
                sec = t
        items = []
        for b in blocks:
            x0, y0, x1, y1, t = b[0], b[1], b[2], b[3], b[4]
            ts = t.strip()
            if not ts or y1 < 36 or y0 > 684:
                continue
            if x0 > 485 or x1 < 30:
                continue
            if x0 < 105:
                if re.fullmatch(r'\d+', ts):
                    items.append((y0, x0, 'qnum', ts))   # 単独問題の番号（本文が番号で始まらない紙面）
                    continue
                if re.fullmatch(r'[\d～~\-\s]+', ts):
                    continue                      # 左上の「40～41」
                items.append((y0, x0, 'label', ts))
            else:
                items.append((y0, x0, 'main', t.rstrip('\n')))
        items.sort(key=lambda z: (round(z[0]), z[1]))
        for y, x, k, t in items:
            seq.append((sec, k, t, pi))
    return seq


def label_of(t):
    """左端の見出し。知らない見出し（参考文献・類問番号など左端に置かれた本文）は None。"""
    for L in LABELS:
        if t.startswith(L):
            return L
    return None


def parse_choices(lines):
    """['ａ\x07　気　胸', '続き', 'ｂ…'] → [('ａ','気　胸'), …]"""
    out = []
    for ln in lines:
        m = re.match(r'^[ 　\u0001-\u0008]*([' + FULL + r'])[\u0001-\u0008　 ]+(.*)$', ln)
        if m and (not out and m.group(1) == 'ａ' or out and ord(m.group(1)) == ord(out[-1][0]) + 1):
            out.append([m.group(1), clean(m.group(2)).strip()])
        elif out:
            out[-1][1] += clean(ln).strip()
        else:
            return None
    return [tuple(c) for c in out]


def has_choices(t):
    return re.search(r'(?:^|\n)[ \u3000\u0001-\u0008]*ａ[\u0001-\u0008\u3000 ]', t) is not None


def extract_groups(pdf):
    seq = pdf_sequence(pdf)
    groups = {}
    i = 0
    while i < len(seq):
        sec, k, t, pg = seq[i]
        m = HEAD_RE.match(t) if k == 'main' else None
        if not m or not sec:
            i += 1
            continue
        nums = [int(x) for x in re.findall(r'\d+', t.split('の問いに')[0])]
        if '～' in t.split('\n')[0] or '~' in t.split('\n')[0]:
            nums = list(range(nums[0], nums[-1] + 1))
        g = {'sec': sec, 'nums': nums, 'page': pg, 'case': [t], 'pre': {}, 'sub': {},
             'sections': [], 'bad': []}
        j = i + 1
        cur_case = [t]
        phase = 'q'
        cur_label = None
        last_sub = None
        while j < len(seq):
            s2, k2, t2, _ = seq[j]
            if k2 == 'main' and HEAD_RE.match(t2):
                break
            if s2 != sec:
                break                                    # ブロック（A〜F）が変わった＝巻末の表などへ入った
            if k2 == 'qnum':
                if int(t2) not in nums and g['sub']:
                    break                                # 次の単独問題（左端に番号だけが置かれる紙面）
                j += 1
                continue
            # 新しい設問は「番号＋全角空白」で始まる（症例文の「7 日前」は半角空白）
            mnum = re.match(r'^(\d+)　', t2) if k2 == 'main' else None
            if mnum and int(mnum.group(1)) not in nums and (phase != 'q' or g['sub']):
                break
            if phase == 'q':
                if k2 == 'label':
                    if label_of(t2) is None:
                        j += 1
                        continue
                    phase = 'e'
                    cur_label = label_of(t2)
                    g['sections'].append([cur_label, []])
                elif mnum and int(mnum.group(1)) in nums:
                    n = int(mnum.group(1))
                    g['sub'][n] = t2
                    g['pre'][n] = list(cur_case)
                    last_sub = n
                elif re.fullmatch(r'[A-Z](?:\s*\n\s*[A-Z])*', t2.strip()):
                    pass                                 # 図の下に組まれたラベル「A」「B」（画像そのものは別に持つ）
                elif last_sub is not None and not has_choices(g['sub'][last_sub]):
                    g['sub'][last_sub] += '\n' + t2      # 設問文・選択肢が次のブロックへ続く
                else:
                    cur_case.append(t2)                  # 途中経過の文＝以降の設問の症例に足す
            else:
                if k2 == 'label':
                    L = label_of(t2)
                    if L in ('着目point', '鑑別診断への', '選択肢考察') and any(x[0] == '正解' for x in g['sections']):
                        break                            # 次の問題の解説に入った（番号で始まらない設問が続く紙面）
                    if L is None:
                        g['sections'][-1][1].append(t2)
                    elif L == 'プロセス' and cur_label == '鑑別診断への':
                        pass
                    else:
                        cur_label = L
                        g['sections'].append([cur_label, []])
                else:
                    g['sections'][-1][1].append(t2)
            j += 1
        for n in nums:
            groups[(sec, n)] = g
        i = j
    return groups


# ---------------------------------------------------------------- カードの材料
# 選択肢が表の問題。テキスト抽出では列の対応が崩れるので、PDF を描画して目視で書き起こした
# （CLAUDE.md「表・図の選択肢の復元」と同じ流儀＝列見出しを各肢に埋め込む。単位は見出しに添える）。
TABLE_CHOICES = {
    ('117', 'C', 68): [('ａ', 'ABO型 AB／Rho(D) 陽性／主試験凝集 あり／副試験凝集 なし'),
                       ('ｂ', 'ABO型 AB／Rho(D) 陽性／主試験凝集 なし／副試験凝集 なし'),
                       ('ｃ', 'ABO型 AB／Rho(D) 陰性／主試験凝集 なし／副試験凝集 なし'),
                       ('ｄ', 'ABO型 O／Rho(D) 陽性／主試験凝集 なし／副試験凝集 あり'),
                       ('ｅ', 'ABO型 O／Rho(D) 陰性／主試験凝集 なし／副試験凝集 あり')],
    ('118', 'C', 74): [('ａ', 'Na⁺ 154／K⁺ 0／Cl⁻ 154／Lactate⁻ 0（mEq/L）／ブドウ糖 0％'),
                       ('ｂ', 'Na⁺ 84／K⁺ 20／Cl⁻ 66／Lactate⁻ 20（mEq/L）／ブドウ糖 3.2％'),
                       ('ｃ', 'Na⁺ 35／K⁺ 20／Cl⁻ 35／Lactate⁻ 20（mEq/L）／ブドウ糖 4.3％'),
                       ('ｄ', 'Na⁺ 30／K⁺ 0／Cl⁻ 20／Lactate⁻ 10（mEq/L）／ブドウ糖 4.3％'),
                       ('ｅ', 'Na⁺ 0／K⁺ 0／Cl⁻ 0／Lactate⁻ 0（mEq/L）／ブドウ糖 5.0％')],
    ('120', 'C', 71): [('ａ', 'Na⁺ 220／K⁺ 0／Cl⁻ 220／L-lactate⁻ 0（mEq/L）／24時間の輸液量 7,400mL'),
                       ('ｂ', 'Na⁺ 220／K⁺ 0／Cl⁻ 220／L-lactate⁻ 0（mEq/L）／24時間の輸液量 10,000mL'),
                       ('ｃ', 'Na⁺ 130／K⁺ 4／Cl⁻ 109／L-lactate⁻ 28（mEq/L）／24時間の輸液量 7,400mL'),
                       ('ｄ', 'Na⁺ 130／K⁺ 4／Cl⁻ 109／L-lactate⁻ 28（mEq/L）／24時間の輸液量 10,000mL'),
                       ('ｅ', 'Na⁺ 40／K⁺ 35／Cl⁻ 40／L-lactate⁻ 0（mEq/L）／24時間の輸液量 10,000mL')],
    ('118', 'F', 74): [('ａ', '心拍出量 増加／肺動脈楔入圧 低下／中心静脈圧 低下／末梢血管抵抗 上昇'),
                       ('ｂ', '心拍出量 減少／肺動脈楔入圧 上昇／中心静脈圧 上昇／末梢血管抵抗 上昇'),
                       ('ｃ', '心拍出量 減少／肺動脈楔入圧 上昇／中心静脈圧 上昇／末梢血管抵抗 低下'),
                       ('ｄ', '心拍出量 減少／肺動脈楔入圧 低下／中心静脈圧 上昇／末梢血管抵抗 低下'),
                       ('ｅ', '心拍出量 減少／肺動脈楔入圧 低下／中心静脈圧 低下／末梢血管抵抗 上昇')],
}


def sub_parts(g, n, key=None):
    t = g['sub'].get(n)
    if not t:
        return None
    lines = t.split('\n')
    if key in TABLE_CHOICES:
        end = max(k for k, ln in enumerate(lines) if 'どれか' in ln)
        return {'stem': [clean(x) for x in lines[:end + 1]], 'choices': TABLE_CHOICES[key]}
    if any('解答：①' in ln for ln in lines):
        end = max(k for k, ln in enumerate(lines) if '解答：①' in ln)
        return {'stem': [clean(x) for x in lines[:end + 1]], 'choices': [], 'calc': True}
    ci = next((k for k, ln in enumerate(lines) if re.match(r'^[ 　\u0001-\u0008]*ａ[\u0001-\u0008　 ]', ln)), None)
    if ci is None:
        return {'stem': [clean(x) for x in lines], 'choices': []}
    ch = parse_choices(lines[ci:])
    return {'stem': [clean(x) for x in lines[:ci]], 'choices': ch}


def sec_text(g, name):
    out = []
    for L, ts in g['sections']:
        if L == name:
            out.extend(ts)
    return out


def all_blocks(g, prefer):
    """prefer の見出しのブロックを先に、残りを後に。見出しとブロックの y がわずかにずれて
    「正解」の中身が1つ上の「確定診断」に入る紙面がある（119B43）ので全部を候補にする。"""
    first = sec_text(g, prefer)
    rest = [t for L, ts in g['sections'] if L != prefer for t in ts]
    return first + rest


ANS_LINE = re.compile(r'^\s*(?:\d+\s*[：:]\s*(?:なし|[' + FULL + r'①-⑨][^\s　]*)(?:[　\s]*※採点除外)?[　\s]*)+$')


def answers(g):
    """{n: ['ａ',…]} 。採点除外は {n: []}。計算問題は {n: '①6、②5'}。"""
    res = {}
    for t in all_blocks(g, '正解'):
        c = clean(t).strip()
        if not ANS_LINE.match(c):
            continue
        for m in re.finditer(r'(\d+)\s*[：:]\s*(なし|[' + FULL + r'](?:[　、，,・]*[' + FULL + r'])*|①[^　\s]*)', c):
            n = int(m.group(1))
            if n in res:
                continue
            v = m.group(2)
            res[n] = [] if v == 'なし' else (v if v.startswith('①') else re.findall('[' + FULL + ']', v))
        if all(n in res for n in g['nums']):
            break
    return res


def rates(g):
    res = {}
    for t in all_blocks(g, '正答率（選択率）'):
        for m in re.finditer(r'(\d+)\s*[：:]\s*([\d.]+)\s*％\s*[（(]([^）)]*)[）)]', clean(t).replace('\n', '')):
            sel = {a: float(v) for a, v in re.findall(r'([' + FULL + r'])\s*([\d.]+)\s*％', m.group(3))}
            res.setdefault(int(m.group(1)), (float(m.group(2)), sel))
    return res


def considerations(g, n):
    """[(印, 肢, 本文)…], まとめの文。
    紙面は2通り: ①「○ａ　本文」が肢ごとに並ぶ ②「×ａ ×ｂ ○ｃ…」の印だけが並び、次のブロックに
    まとめの文が来る（118F73）。どちらも「n」だけの行で始まるブロックから、次の「m」までを1問ぶんとする。"""
    lines, on = [], False
    for t in sec_text(g, '選択肢考察'):
        ls = t.split('\n')
        head = re.fullmatch(r'\d+', ls[0].strip())
        if head:
            if on:
                break
            if int(ls[0]) == n:
                on = True
                lines.extend(ls[1:])
        elif on:
            lines.extend(ls)
    if not on:
        return None, ''
    rows, prose = [], []

    def trailing_empty():
        k = 0
        while k < len(rows) and not rows[-1 - k][2]:
            k += 1
        return k

    def merge(k, text):
        """本文の無い印が続いたあとに本文が来たら、その本文は続いた肢すべてに共通
        （「×ｃ ×ｄ ×ｅ ＼n 結腸で認められる…」「○ｃ ＼n ○ｄ〔選択肢考察ａ〕に同じ。」）。"""
        grp = rows[-k:]
        del rows[-k:]
        rows.append([grp[0][0], grp[0][1] + ''.join(' ' + r[0] + r[1] for r in grp[1:]), text])

    for ln in lines:
        m = re.match(r'^([○×△□◎])[　 \u0001-\u0008]*([' + FULL + r'])[　 \u0001-\u0008]*(.*)$', ln)
        if m:
            tx = clean(m.group(3)).strip()
            k = trailing_empty()
            rows.append([m.group(1), m.group(2), tx])
            if tx and k:
                merge(k + 1, tx)
        elif prose:
            prose.append(clean(ln).strip())
        elif rows and rows[-1][2]:
            rows[-1][2] += clean(ln).strip()
        elif rows and trailing_empty() == len(rows) and len(rows) >= 4:
            prose.append(clean(ln).strip())       # 印だけが全肢ぶん並び、まとめの文が続く（118F73）
        elif rows:
            merge(trailing_empty(), clean(ln).strip())
        else:
            prose.append(clean(ln).strip())
    # 本文が複数の肢の真ん中の高さに組まれていると、読み順で「印→本文→残りの印」になる
    # （116C74・119F71）。末尾に残った本文の無い印は直前の本文を共有する。
    k = trailing_empty()
    if k and len(rows) > k and not prose:
        if k + 1 == len(rows) and len(rows) >= 4:
            prose = [rows[0][2]]                  # 全肢に1つの本文（117C68）＝まとめの文
            rows[0][2] = ''
        else:
            merge(k + 1, rows[-k - 1][2])
    return rows, ''.join(prose)


def focus_para(g, n):
    txt = '\n'.join(clean(x) for x in sec_text(g, '着目point'))
    m = re.search(r'(?:^|\n)' + str(n) + r'\s*[：:](.*?)(?=\n\d+\s*[：:]|\n①|\Z)', txt, re.S)
    if not m:
        return None
    return str(n) + '：' + m.group(1).strip()


def br(lines):
    return '<br>'.join(esc(clean(x)) for x in lines)


def build_eg(g, n):
    parts = []
    focus = sec_text(g, '着目point') + sec_text(g, '鑑別診断への')
    dx = sec_text(g, '確定診断')
    if focus or dx:
        body = br('\n'.join(focus).split('\n'))
        if dx:
            body += ('<br>' if body else '') + '<strong>確定診断：</strong>' + br('\n'.join(dx).split('\n'))
        parts.append('<div class="eb ept"><h4>🎯 着目point</h4>' + body + '</div>')
    wari = sec_text(g, '割問コメント')
    if wari:
        parts.append('<div class="eb ept"><h4>📊 割問コメント</h4>' + br('\n'.join(wari).split('\n')) + '</div>')
    cp = sec_text(g, 'check point') + sec_text(g, '参考')
    if cp:
        rows = []
        for ln in '\n'.join(cp).split('\n'):
            c = esc(clean(ln))
            if re.match(r'^《.*》$', clean(ln).strip()):
                c = '<strong style="color:var(--nv)">' + c + '</strong>'
            elif re.match(r'^[１２３４５６７８９０]+）', clean(ln)):
                c = '<strong>' + c + '</strong>'
            rows.append(c)
        parts.append('<div class="eb ep"><h4>📖 解説</h4><div style="margin-bottom:6px">' + '<br>'.join(rows) + '</div></div>')
    cons, prose = considerations(g, n)
    if cons or prose:
        rows = ''.join('<div style="color:var(--%s);margin-bottom:3px">%s%s%s</div>'
                       % ('gr' if mk == '○' else 'ts', mk, lab, (' ' + esc(tx)) if tx else '') for mk, lab, tx in cons or [])
        if prose:
            rows += '<div style="margin-top:4px">' + esc(prose) + '</div>'
        parts.append('<div class="eb ep"><h4>📋 選択肢考察</h4>' + rows + '</div>')
    return '<div class="eg">' + ''.join(parts) + '</div>'


def rate_cls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


# ---------------------------------------------------------------- HTML 書き換え
CARD_RE = re.compile(r'<div class="qc[^"]*"[^>]*data-uid="kakumon_(\d+)([A-F])_q(\d+)"')


def split_cards(s):
    starts = [m.start() for m in CARD_RE.finditer(s)]
    return starts


def rebuild_card(card, g, n, issues, uid):
    m = re.match(r'(\d+)([A-F])(\d+)', uid)
    sp = sub_parts(g, n, (m.group(1), m.group(2), int(m.group(3))))
    excluded = 'class="bg bx"' in card
    ans = answers(g).get(n)
    if sp and sp.get('calc'):
        return rebuild_calc(card, g, n, sp, ans, issues, uid)
    if not sp or len(sp['choices']) < 2:
        issues.append(f'{uid}: サブ設問の選択肢が取れない（組版違い）')
        return None
    if ans is None:
        issues.append(f'{uid}: 正解が取れない')
        return None
    if ans == [] and not excluded:
        issues.append(f'{uid}: PDF は採点除外なのに bx バッジが無い')
        return None
    if excluded:
        return rebuild_excluded(card, g, n, sp, issues, uid)
    labs = [c[0] for c in sp['choices']]
    if any(a not in labs for a in ans):
        issues.append(f'{uid}: 正解 {ans} が選択肢 {labs} に無い')
        return None
    stem = '\n'.join(sp['stem'])
    k = re.search(r'([2-9])\s*つ選べ', unicodedata.normalize('NFKC', stem))
    if k and int(k.group(1)) != len(ans) and not excluded:
        issues.append(f'{uid}: 「{k.group(1)}つ選べ」なのに正解 {ans}')
        return None
    if not k and len(ans) != 1 and not excluded:
        issues.append(f'{uid}: 単一選択なのに正解 {ans}')
        return None
    rt = rates(g).get(n)
    if rt and len(ans) == 1 and rt[1] and ans[0] in rt[1] and abs(rt[1][ans[0]] - rt[0]) > 0.15:
        issues.append(f'{uid}: 正答率 {rt[0]} と正解肢 {ans[0]} の選択率 {rt[1][ans[0]]} が不一致')
        return None

    cs = ''.join('<div class="ch2%s">%s　%s</div>' % (' ok' if a in ans else '', a, esc(t)) for a, t in sp['choices'])
    ac = '\n'.join('%s　%s' % (a, esc(t)) for a, t in sp['choices'] if a in ans)
    fp = focus_para(g, n)
    as_ = ('<div class="as">' + esc(fp) + '</div>') if fp else ''
    ab = '<div class="ab"><span class="ai">✅</span><div><div class="ac">' + ac + '</div>' + as_ + '</div></div>'
    return assemble(card, g, n, sp, '<div class="cs">' + cs + '</div>' + ab, rt, len(ans))


def make_qt(g, n, sp):
    """共通の症例（このサブ設問までに挟まった経過の文を含む）＋自分の設問文。"""
    case_lines = '\n'.join(g['pre'][n]).split('\n')
    return br(case_lines) + '<br><strong>' + br(sp['stem']) + '</strong>'


def assemble(card, g, n, sp, cs_ab, rt, nans):
    qb = '<div class="qb"><div class="qt">' + make_qt(g, n, sp) + '</div>' + cs_ab + build_eg(g, n) + '</div>'
    qi = card.find('<div class="qb">')
    new = card[:qi] + qb + '</div>'
    if rt:
        r = rt[0]
        om = re.search(r'data-rate="([^"]*)"', new)
        if not om or abs(float(om.group(1)) - r) > 1e-9:   # 値が同じなら書式（66.0 / 66）も触らない
            new = re.sub(r'data-rate="[^"]*"', 'data-rate="%.1f"' % r, new, count=1)
            new = re.sub(r'<span class="cr \w+">正答率 [\d.]+%</span>',
                         '<span class="cr %s">正答率 %.1f%%</span>' % (rate_cls(r), r), new, count=1)
    new = re.sub(r'<span class="bg bm">\d+択</span>', '', new)
    if nans >= 2:
        badge = '<span class="bg bm">%d択</span>' % nans
        new = new.replace('<span class="cr ', badge + '<span class="cr ', 1)
    return new


def rebuild_calc(card, g, n, sp, ans, issues, uid):
    """計算問題は選択肢を持たない（calc_input.js の桁入力）。既存の正解（計算答：…）と PDF の
    「①6、②5」が一致するときだけ、qt と解説を作り直す。"""
    oac = re.search(r'<div class="ac">計算答：([^<]+)</div>', card)
    if not oac or not isinstance(ans, str):
        issues.append(f'{uid}: 計算問題の正解が照合できない（既存 {oac and oac.group(1)} / PDF {ans}）')
        return None
    digits = ''.join(re.findall(r'[①-⑨]\s*([0-9.])', ans))
    if digits != oac.group(1).strip():
        issues.append(f'{uid}: 計算答 {oac.group(1)} と PDF {ans} が不一致')
        return None
    qi = card.find('<div class="qb">')
    ci = card.find('<div class="cs">', qi)                  # 空の cs も残す（calc_input.js が桁入力の器にする）
    ai = card.find('<div class="ab">', qi)
    ei = card.find('<div class="eg">', ai)
    return assemble(card, g, n, sp, card[ci if 0 <= ci < ai else ai:ei], rates(g).get(n), 1)


def rebuild_excluded(card, g, n, sp, issues, uid):
    """採点除外（PDF の正解が「なし ※採点除外」）。正解肢を持たせず、既存と同じ ⚠️ 表示にする。"""
    cs = ''.join('<div class="ch2">%s　%s</div>' % (a, esc(t)) for a, t in sp['choices'])
    ab = ('<div class="ab"><span class="ai">⚠️</span><div><div class="ac">採点除外問題</div>'
          '<div class="as">本問は国家試験において採点除外となりました。</div></div></div>')
    return assemble(card, g, n, sp, '<div class="cs">' + cs + '</div>' + ab, None, 1)


def process(path, groups, write, issues, stats):
    s = open(path, encoding='utf-8', newline='').read()
    starts = split_cards(s)
    out = []
    last = 0
    changed = 0
    for idx, st in enumerate(starts):
        en = starts[idx + 1] if idx + 1 < len(starts) else None
        m = CARD_RE.match(s, st)
        yr, L, n = m.group(1), m.group(2), int(m.group(3))
        uid = f'{yr}{L}{n}'
        if en is None:
            # 最後のカードは </div></div></div> の後ろに本文の閉じが続く。カードの終わりを数えて切る
            depth = 0
            for mm in re.finditer(r'<div\b|</div>', s[st:]):
                depth += 1 if mm.group(0) != '</div>' else -1
                if depth == 0:
                    en = st + mm.end()
                    break
        card = s[st:en]
        g = groups.get((L, n))
        if not g:
            continue
        stats['series'] += 1
        new = rebuild_card(card, g, n, issues, uid)
        if new is None:
            stats['skip'] += 1
            continue
        # 末尾の空白・改行はカード間の区切りなので残す
        tail = card[len(card.rstrip()):]
        new = new + tail
        if new != card:
            out.append(s[last:st]); out.append(new); last = en
            changed += 1
    out.append(s[last:])
    ns = ''.join(out)
    stats['changed'] += changed
    if write and changed:
        open(path, 'w', encoding='utf-8', newline='').write(ns)
    return changed


def main():
    write = '--dry-run' not in sys.argv and '--check' not in sys.argv
    issues = []
    stats = {'series': 0, 'changed': 0, 'skip': 0}
    for yd in sorted(glob.glob(os.path.join(KAK, '第*回'))):
        yr = re.search(r'第(\d+)回', yd).group(1)
        pdfs = glob.glob(os.path.join(KAK, f'第{yr}回*.pdf'))
        if not pdfs:
            print('PDF なし', yr); continue
        groups = extract_groups(pdfs[0])
        for f in sorted(glob.glob(os.path.join(yd, '*_kakuron.html'))):
            c = process(f, groups, write, issues, stats)
            if c:
                print(os.path.basename(f), c)
    print(stats)
    for x in issues:
        print('  要確認', x)
    if '--check' in sys.argv:
        sys.exit(1 if stats['changed'] else 0)


if __name__ == '__main__':
    main()
