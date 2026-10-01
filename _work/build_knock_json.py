# -*- coding: utf-8 -*-
"""1,000本ノック（knock）の questions_knock.json を PDF から作る。

  python _work/knock_pdf.py anstable        # 巻頭リスト → _work/knock_anstable.json
  python _work/knock_pdf.py parse           # 本文       → _work/knock_parsed.json
  python _work/build_knock_json.py --figs   # 設問の図・解説の図を 1000本ノック/images/ へ（図を変えたときだけ）
  python _work/build_knock_json.py          # questions_knock.json を書き出す
  python _work/build_knock_json.py --check  # 現物と一致するかだけ見る

方針（2026-10-01 ユーザー判断）:
  ・study.html の新科目1つ。章は出題基準の大項目で11章（番号どおり連続する塊で切る）。
    中項目（Ⅲ-4：心臓、脈管 など）はバッジ bb で出す。表示番号・uid の番号は紙面の NO. そのまま。
  ・解説は PDF の解説を先頭に引用し（`📖 1,000本ノックの解説`）、同じ国試問題が既存の科目・
    過去問ビューアにあれば、その解説を後ろに併記する（借用。判定は build_hisshu_json と同じ）。
  ・正答率は巻頭リストの値（PDF が正本）。

⚠️⚠️ questions_knock.json は派生物——直接編集しないこと。手書きは _work/knock_overrides.json（uid キー）へ。
"""
import argparse, io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import knock_pdf as K                                         # noqa: E402
import build_hisshu_json as B                                 # noqa: E402
import build_hisshu2_json as B2                               # noqa: E402

SID = 'knock'
OUT = 'questions_knock.json'
IMG_DIR = '1000本ノック/images'
OVERRIDES = '_work/knock_overrides.json'
FW, HW = B.FW, B.HW
FULL_X1 = 440        # 半ページの本文の右端は x≈455〜465。これより右で終わる行は「詰まっている」

# 借用元から外す: 借用した解説しか持たない科目（二重になる）と自分自身
B.NO_BORROW |= {SID, 'hisshu', 'hisshu2', 'lesdige'}
B.IMG_DIR = IMG_DIR

# 章＝大項目。番号どおり連続する塊（巻頭リストの (公衆衛生か, 大項目) が変わるところで切る）。
# 巻末の 942〜968 は公衆衛生の巻に載る他領域（Ⅳ・Ⅴ・Ⅶ・Ⅷ・Ⅸ）の問題で、合わせて1章にする。
CHAPTERS = [
    (1, 'Ⅱ 予防と健康管理・増進（医学）'),
    (5, 'Ⅲ 人体の正常構造と機能'),
    (119, 'Ⅳ 生殖、発生、成長、発達、加齢'),
    (199, 'Ⅴ 病因、病態生理'),
    (267, 'Ⅵ 症候'),
    (393, 'Ⅶ 診察'),
    (408, 'Ⅷ 検査'),
    (520, 'Ⅸ 治療'),
    (634, '公衆衛生 Ⅰ 保健医療論'),
    (798, '公衆衛生 Ⅱ 予防と健康管理・増進'),
    (942, '公衆衛生 その他の領域（Ⅳ〜Ⅸ）'),
]

# 「示す」とあるが図ではないもの（表・データ・会話を本文で示している／動詞の「示す」）。検算で見つけたらページを見て足す。
NO_FIG_OK = {163, 256, 322, 344, 429, 491, 854,          # 動詞の「示す」（低値を示す・徴候を示す…）
             167,                                          # 身体計測値を本文で示す
             270, 397, 420, 482, 826, 850, 858, 860, 878, 892, 902}   # 表・質問項目・証明書を本文で示す

# 手で書き起こしたもの（ページを描画して目視で読んだ）。NO. → 選択肢の本文の並び
TABLE_CHOICES = {}
# 設問文を丸ごと手で書いたもの。NO. → html
_T892 = [['年', 'A', 'B', 'C', 'D', 'E'],
         ['2011', '827', '1,535', '378', '439', '－'], ['2012', '875', '1,438', '2,386', '283', '－'],
         ['2013', '1,228', '1,586', '14,344', '229', '－'], ['2014', '1,661', '1,538', '319', '462', '15'],
         ['2015', '2,690', '1,431', '163', '35', '38'], ['2016', '4,575', '1,443', '126', '165', '33'],
         ['2017', '5,826', '1,395', '91', '186', '28'], ['2018', '7,007', '1,301', '2,941', '279', '24'],
         ['2019', '6,642', '1,231', '2,298', '744', '24'], ['2020', '5,867', '1,094', '101', '10', '10']]
QT_FIX = {
    # 選択肢 a〜e（A〜E）の右に表が組まれていて、同じ高さの行が混ざる（p.275 を描画して書き起こした）
    892: ('感染症法上の五類感染症のうち、全数把握対象疾患である梅毒、風疹、麻疹、後天性免疫不全症候群、'
          '薬剤耐性アシネトバクター感染症について、発生動向調査によるそれぞれの患者数の年次推移を示す。<br/>'
          + '<table class="tb">%s</table>' % ''.join(
              '<tr>%s</tr>' % ''.join(('<th>%s</th>' if i == 0 or j == 0 else '<td>%s</td>') % c for j, c in enumerate(r))
              for i, r in enumerate(_T892))
          + '<br/><strong>風疹はどれか。</strong>'),
}
TABLE_CHOICES[892] = ['A', 'B', 'C', 'D', 'E']


def _tb(rows):
    """手で組む表。セルは文字列か (文字列, colspan, rowspan)。1行目と、行頭が th の印 '#' のセルは見出し。"""
    out = []
    for i, r in enumerate(rows):
        tds = []
        for c in r:
            t, cs, rs = (c, 1, 1) if isinstance(c, str) else (c + (1,) * (3 - len(c)))
            tag = 'th' if i == 0 or t.startswith('#') else 'td'
            attr = (' colspan="%d"' % cs if cs > 1 else '') + (' rowspan="%d"' % rs if rs > 1 else '')
            tds.append('<%s%s>%s</%s>' % (tag, attr, t.lstrip('#'), tag))
        out.append('<tr>%s</tr>' % ''.join(tds))
    return '<table class="tb">%s</table>' % ''.join(out)


# 見出しが2段で結合セルがある表（ページを描画して書き起こした・2026-10-01）
_CALC_NOTE2 = '<br/><strong>ただし、小数第2 位以下の数値が得られた場合には、小数第2 位を四捨五入すること。</strong>'
QT_FIX.update({
    828: ('ある地域の15 歳から49 歳までの女性人口と出生数を表のように仮定する。<br/>' + _tb([
        [('', 1, 2), ('年齢別女性人口（人）', 1, 2), ('年齢別出生数（人）', 2)],
        ['#男', '#女'],
        ['#15 歳から19 歳まで', '各100,000', '各2,100', '各2,000'],
        ['#20 歳から39 歳まで', '各100,000', '各5,200', '各5,000'],
        ['#40 歳から49 歳まで', '各100,000', '各1,100', '各1,000']])
        + '※ 15 歳から49 歳までの総女性人口　3,500,000 人<br/><strong>総再生産率を求めよ。</strong>'
        + _CALC_NOTE2 + '<br/>解答：①.②'),
    850: ('基準集団と対象集団の状況を表に示す。<br/>' + _tb([
        ['', ('基準集団', 3), ('対象集団', 3)],
        ['#年齢階級', '#人口', '#死亡数', '#死亡率', '#人口', '#死亡数', '#死亡率'],
        ['#0 ～14 歳', '200,000', '200', '100.0', '2,000', '1', '50.0'],
        ['#15 ～64 歳', '600,000', '900', '150.0', '4,000', '4', '100.0'],
        ['#65 歳～', '200,000', '600', '300.0', '4,000', '8', '200.0']])
        + '※死亡数は年間、死亡率は年間人口10 万対である。<br/><strong>対象集団の標準化死亡比はどれか。</strong>'),
    852: ('調査開始時に肺癌に罹患していなかった10 万人をその時点の喫煙状況で2 つのグループに分けた。'
          '調査開始後5 年間の肺癌罹患の有無を調べた結果を以下に示す。<br/>（単位：人）' + _tb([
              ['調査開始時点の喫煙状況', '調査開始時点の人数', '調査期間中に肺癌に罹患した人数'],
              ['#喫煙者', '40,000', '408'], ['#非喫煙者', '60,000', '72'], ['#計', '100,000', '480']])
          + '<strong>喫煙による肺癌罹患のリスク比を求めよ。</strong>'
          + '<br/><strong>ただし、小数第2 位以下の数値が得られた場合は、小数第2 位を四捨五入すること。</strong><br/>解答：①.②'),
    853: ('人口12 万人のA 市のある年の死亡者数は510 名であった。A 市の年齢群別の人口と死亡者数、'
          '同じ年の日本全国の年齢群別の人口の概数を示す。<br/>' + _tb([
              [('年齢群', 1, 2), ('A 市', 2), '日本'],
              ['#死亡者数', '#人口', '#人口'],
              ['#0 ～19 歳', '20', '40,000', '20,000,000'],
              ['#20 ～64 歳', '140', '70,000', '70,000,000'],
              ['#65 歳以上', '350', '10,000', '30,000,000'],
              ['#合計', '510', '120,000', '120,000,000']])
          + '<strong>表の日本全国の人口を基準人口としたとき、A 市の人口1,000 人あたりの年齢群で調整した死亡率を直接法で計算せよ。</strong>'
          + '<br/><strong>ただし、小数第2 位以下の数値が得られた場合は、小数第2 位を四捨五入すること。</strong><br/>解答：①②.③/ 人口1,000 対'),
})
# 見出しが3段（項目・単位・基準値）で、基準値の段は LD と γ-GTP の下にしか無い（p.141 を描画して確かめた）
_H420 = ['AST（IU/L）', 'ALT（IU/L）', 'LD（IU/L）（基準176～353）', 'γ-GTP（IU/L）（基準8～50）',
         'Na⁺（mEq/L）', 'K⁺（mEq/L）']
TABLE_CHOICES[420] = ['／'.join('%s %s' % hv for hv in zip(_H420, r)) for r in (
    ['30', '56', '200', '36', '152', '4.0'], ['30', '56', '200', '62', '137', '4.0'],
    ['30', '56', '200', '62', '137', '6.0'], ['48', '16', '420', '36', '137', '6.0'],
    ['48', '16', '420', '62', '137', '4.0'])]
# 男性・女性の2列（行 e だけ罫線が無く、他は「男性 ―― 6g 未満」と読まれる）
TABLE_CHOICES[910] = ['男性 %s　女性 %s' % mf for mf in (
    ('6g 未満', '6g 未満'), ('7g 未満', '7g 未満'), ('7g 未満', '8g 未満'), ('8g 未満', '7g 未満'), ('10g 未満', '10g 未満'))]
# 設問文の部分置換。NO. → [(置換元, 置換先)]
QT_SUB = {
    # 解答欄が「①, ② ③ 0 kcal」＋矢印と位取りの2行（千・百・十・一の位）。矢印の行は桁の対応を
    # 示すだけなので1行の注記に畳む（カンマで切れると桁入力の欄が作れない）
    531: [('解答：①, ② ③ 0 kcal<br/><strong>↑  ↑ ↑ ↑</strong><br/><strong>千  百 十 一の位</strong>',
           '解答：① ② ③ 0 kcal（①＝千の位・②＝百の位・③＝十の位。一の位の 0 は印字済み）')],
}
# 下線を残す問題（「下線部のうち、三次予防はどれか。」）。他の問題で拾った下線は表の罫だった
UL_OK = {799}


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


CH_START = re.compile(r'^([' + FW + r'a-i])(?:　|\t| {1,3})')
LETTER_ONLY = re.compile(r'^[×○]?[' + FW + r'](?:[・～][×○]?[' + FW + r'])*[\s　]*$')
ITEM = re.compile(r'^[×○△]?[' + FW + r']')


FIG_LABEL = re.compile(r'[A-Za-zＡ-Ｅ①-⑩](?:\t[A-Za-zＡ-Ｅ①-⑩])*')


def cells(line):
    return [c.strip() for c in line.split('\t')]


def table_html(rows):
    """タブ区切りの行 → <table>。
    ・上付きの符号（HCO3 の「－」、Na の「＋」）が別のセルに分かれていたら前のセルへ戻す。
    ・単位の行（「（Torr）（Torr）（mEq/L）」）は見出しより列が少なく、右の列の下に組まれている
      ＝足りない列を左に空けて揃える（NO.397）。"""
    fixed = []
    for r in rows:
        out = []
        for c in r:
            if out and c in ('－', '＋', '-', '+'):
                out[-1] += '<sup>%s</sup>' % c
            else:
                out.append(c)
        fixed.append(out)
    # 列が足りない行は左を空ける: 見出しの行は左上の角（行見出しの列）が空いている（NO.851・858）、
    # 単位の行は右の列の下にだけ組まれている（NO.397）。結合セルのある見出しは QT_FIX で手で組む
    # データの行（数字を含む）が短いときは右の列が空欄（NO.858 の P 値）
    w = max(len(r) for r in fixed)
    rows = [r + [''] * (w - len(r)) if i and any(ch.isdigit() for c in r for ch in c) and not r[0].startswith('（')
            else [''] * (w - len(r)) + r for i, r in enumerate(fixed)]
    return '<table class="tb">%s</table>' % ''.join(
        '<tr>%s</tr>' % ''.join(('<th>%s</th>' if i == 0 else '<td>%s</td>') % c for c in r)
        for i, r in enumerate(rows))


# ── 設問文と選択肢 ──────────────────────────────────────────────
def split_problem(p):
    """問題の行 → (設問文の行, 選択肢 [(記号の index, 本文 uni)], 表の選択肢か)"""
    # 「〈公衆衛生〉」は p.205 の扉の文字。図の中のラベル（A B／a d／① ② ③）は図の右に組まれた行として拾われる
    lines = [l for l in p['lines'] if l[2].strip() not in ('〈公衆衛生〉',)
             and not (l[1] > 100 and FIG_LABEL.fullmatch(l[2].strip()))]
    first = next((i for i, l in enumerate(lines) if CH_START.match(l[2].strip())
                  and not (i + 1 < len(lines) and False)), None)
    if first is None:
        return lines, [], False
    # 選択肢の直前に表の見出し行（タブ区切り）が続いていたら、それも選択肢の表
    head = first
    while head > 0 and '\t' in lines[head - 1][2] and not lines[head - 1][2].rstrip().endswith('。'):
        head -= 1
    qt_lines, rest = lines[:head], lines[head:]
    table = head < first or any('\t' in l[2] for l in rest[:1]) and \
        re.match(r'^[' + FW + r'a-i]\t', rest[0][2].strip() if rest else '')
    choices = []
    if table:
        hdr = [cells(l[5]) for l in rest[:first - head]]
        for l in rest[first - head:]:
            t = l[5].strip()
            m = CH_START.match(t)
            if not m:
                if choices:                             # 表の行の折り返し
                    choices[-1][1].append(cells(t))
                    continue
                die('NO.%d: 表の選択肢の行が読めない %r' % (p['no'], t))
            row = cells(t[m.end():])
            if len(row) == 1:                           # 組合せの罫線で区切られた行（NO.397）
                row = [c.strip() for c in re.split(r'\s*(?:[―─]\s*){2,}\s*', row[0])]
            choices.append([m.group(1), [row]])
        out = []
        def tight(v):                                   # 「上　昇」「血　糖」の字間の全角空白
            return v.replace('　', '') if len(v) <= 4 else v
        for letter, rows in choices:
            vals = [tight(v) for v in rows[0]]
            if hdr:
                names = [tight(v) for v in hdr[0]]
                if len(hdr) > 1 and len(hdr[1]) == len(names):
                    names = ['%s%s' % (a, b) for a, b in zip(names, hdr[1])]
                if len(names) == len(vals):
                    vals = ['%s %s' % (n, v) for n, v in zip(names, vals)]
                elif len(names) == len(vals) - 1:       # 先頭の列に見出しが無い（行見出し）
                    vals = [vals[0]] + ['%s %s' % (n, v) for n, v in zip(names, vals[1:])]
                else:
                    die('NO.%d: 表の見出し %d 列と行 %d 列が合わない' % (p['no'], len(names), len(vals)))
            out.append((letter, re.sub(r'\s+([⁺⁻])', r'\1', '／'.join(vals))))
        return qt_lines, out, True
    for l in rest:
        t = l[5].strip()
        parts = [m for m in re.finditer(r'(?:^|(?<=[\t ]))([' + FW + r'])(?:　|\t| {1,3})', t)]
        if parts and parts[0].start() == 0:
            for k, m in enumerate(parts):
                end = parts[k + 1].start() if k + 1 < len(parts) else len(t)
                choices.append([m.group(1), t[m.end():end].strip()])
        elif choices:
            choices[-1][1] += t                         # 選択肢の折り返し
        else:
            die('NO.%d: 選択肢の行が読めない %r' % (p['no'], t))
    return qt_lines, [(c[0], B.norm_choice(c[1])) for c in choices], False


def qt_paragraphs(lines):
    """設問文の行 → 段落 html。表（タブ区切りの連続行）は <table> に。図の下の A B ラベルは落とす。"""
    paras, prev_full, i = [], False, 0
    while i < len(lines):
        y0, x0, text, html, x1, uni = lines[i]
        t = text.strip()
        if re.fullmatch(r'[Ａ-ＥA-E①-⑤](?:\s*[Ａ-ＥA-E①-⑤])*', t):
            i += 1
            continue
        if '\t' in text:
            j = i
            while j < len(lines) and '\t' in lines[j][2]:
                j += 1
            if j - i >= 2:
                paras.append(table_html([cells(re.sub(r'</?u>', '', lines[k][3])) for k in range(i, j)]))
                i, prev_full = j, False
                continue
        h = B._clean(html)
        if paras and prev_full and not paras[-1].startswith('<table'):
            sep = ' ' if re.search(r'[A-Za-z,]$', paras[-1]) and re.match(r'[A-Za-z]', t) else ''
            paras[-1] += sep + h
        else:
            paras.append(h)
        prev_full = x1 > FULL_X1
        i += 1
    return [p.replace('</u><u>', '') for p in paras]


def strongify(paras):
    body = [p for p in paras if not p.startswith('<table')]
    if not body:
        return paras
    plain = [re.sub(r'<[^>]+>', '', p) for p in paras]
    cand = [i for i, t in enumerate(plain) if re.search(r'(?:か|よ)。(?:\s*\d\s*つ選べ。)?$|か。（', t)]
    idx = max(cand) if cand else len(paras) - 1
    if paras[idx].startswith('<table'):
        return paras
    # 表と計算問題の解答欄（「解答：①.②」）は太字にしない
    return paras[:idx] + ['<strong>%s</strong>' % p if not (p.startswith('<table') or p.startswith('解答：')) else p
                          for p in paras[idx:]]


# ── 計算問題 ────────────────────────────────────────────────────
CIRC = '①②③④⑤⑥'


def calc_answer(no, qt_lines, ans):
    """「解答：①.② 倍」の型と「①1, ②3, ③0」から 計算答：<桁文字列> を作る。"""
    tmpl = next((l[2] for l in qt_lines if l[2].strip().startswith('解答：')), None)
    if not tmpl:
        die('NO.%d: 計算問題の解答欄が無い' % no)
    digits = dict(re.findall(r'([' + CIRC + r'])\s*(\d)', ans))
    body = re.sub(r'\s', '', tmpl.split('解答：', 1)[1])
    shape = ''.join(ch for ch in body if ch in CIRC or ch == '.')
    if not shape or set(c for c in shape if c != '.') != set(digits):
        die('NO.%d: 計算問題の解答欄 %r と解答 %r が噛み合わない' % (no, tmpl, ans))
    return ''.join(digits.get(c, c) for c in shape)


# ── 解説 ────────────────────────────────────────────────────────
def expl_html(e):
    """解説の行 → html。選択肢ごとの段落（ａ　… ／ ×ａ　… ／ ａ・ｂ　…）を1段落ずつ。

    ・続きの行は字下げされる（x≈78。項目の先頭は x≈69）。
    ・記号だけの行が縦に並び、その右に本文が1つだけ組まれていることがある（NO.44 の ×ｂ ×ｃ）
      ＝記号をまとめて1つの段落の頭にする。"""
    lines = e['lines']
    paras, i = [], 0
    prev_full = False
    while i < len(lines):
        y0, x0, text, html, x1, uni = lines[i]
        t = text.strip()
        if '\t' in text and i + 1 < len(lines) and '\t' in lines[i + 1][2] and not ITEM.match(t):
            j = i
            while j < len(lines) and '\t' in lines[j][2]:
                j += 1
            paras.append(table_html([cells(re.sub(r'</?u>', '', lines[k][3])) for k in range(i, j)]))
            i, prev_full = j, False
            continue
        if LETTER_ONLY.match(t):                        # 記号だけの行の塊
            labels, body, j = [t.strip()], [], i + 1
            while j < len(lines):
                tj = lines[j][2].strip()
                if LETTER_ONLY.match(tj):
                    labels.append(tj)
                elif lines[j][1] > 85 or (body and lines[j][1] > 74):
                    body.append(B._clean(lines[j][3]))
                else:
                    break
                j += 1
            if body:
                paras.append('%s　%s' % ('・'.join(labels), ''.join(body)))
                i, prev_full = j, False
                continue
        h = B._clean(html.replace('\t', '　'))
        new = not paras or x0 < 74 and (ITEM.match(t) or not prev_full) or paras[-1].startswith('<table')
        if new:
            paras.append(h)
        else:
            sep = ' ' if re.search(r'[A-Za-z,]$', paras[-1]) and re.match(r'[A-Za-z]', t) else ''
            paras[-1] += sep + h
        prev_full = x1 > FULL_X1
        i += 1
    out = []
    for p in paras:
        p = p.replace('</u><u>', '')
        out.append(p if p.startswith('<table') else re.sub(r'^([×○△]?[' + FW + r'](?:[・～][×○△]?[' + FW + r'])*)(?=　|$)', r'<b>\1</b>', p))
    return '<br/>'.join(out)


# ── 図 ──────────────────────────────────────────────────────────
def figure_plan(P):
    """NO. → [dict(page, rect, name)]（設問の図）／ NO. → [...]（解説の図）。
    図の持ち主は同じ半ページで図より上にある最後の見出し。無ければ前のページの最後の問題。"""
    import fitz
    heads_q = {}
    for p in P['problems']:
        heads_q.setdefault(p['page'], []).append((p['y'], p['no']))
    heads_e = {}
    for e in P['expls']:
        heads_e.setdefault(e['page'], []).append((e.get('y', 0), e['no']))
    q_plan, e_plan, last = {}, {}, None
    by_page = {}
    for f in P['figs']:
        by_page.setdefault(f['page'], []).append(f)
    lastq = None
    for pn in K.BODY_PAGES:
        for f in sorted(by_page.get(pn, []), key=lambda f: (f['rect'][1], f['rect'][0])):
            r = f['rect']
            heads = heads_q if f['side'] == 'q' else heads_e
            owner = [n for y, n in sorted(heads.get(pn, [])) if y < r[1]]
            who = owner[-1] if owner else lastq
            if who is None:
                die('p%d: 図の持ち主が決まらない %s' % (pn, r))
            (q_plan if f['side'] == 'q' else e_plan).setdefault(who, []).append(
                dict(page=pn, rect=fitz.Rect(*r)))
        if heads_q.get(pn):
            lastq = sorted(heads_q[pn])[-1][1]
    return q_plan, e_plan


_LINES = {}


def lines_of(doc, pn, lo=0, hi=2000):
    """page_lines のキャッシュ（図ごとに rawdict を読み直すと数分かかる）。"""
    k = (pn, lo, hi)
    if k not in _LINES:
        _LINES[k] = K.page_lines(doc[pn - 1], lo, hi)
    return _LINES[k]


LABEL_ORDER = 'AＡaａ①BＢbｂ②CＣcｃ③DＤdｄ④EＥeｅ⑤'


def fig_label(doc, f):
    """図の直下に組まれたラベル（A／a／①）。無ければ ''。"""
    r = f['rect']
    for l in lines_of(doc, f['page']):
        t = l['text'].strip()
        cx = (l['x0'] + l['x1']) / 2
        if len(t) == 1 and t in LABEL_ORDER and r.x0 - 10 <= cx <= r.x1 + 10 and 0 <= l['y0'] - r.y1 <= 25:
            return t
    return ''


def combine_figs(plan, Q, doc):
    """3枚以上の図（画像が選択肢の問題・連続スライス）は、ラベルごと1枚に切り出す。

    ラベル（①〜⑤・A〜F）と注記（「（頭側A →尾側F ）」）は画像の外に文字で組まれていて、
    1枚ずつ切るとラベルが失われるうえ、並びも位置の順とずれる（NO.85 は ①④／②⑤／③ の2列）。
    切り出す範囲は画像の外接矩形を、近くにある短い文字の行（ラベル・注記）まで広げたもの。
    範囲に掛かる選択肢の行（「ａ　①」）は白で消す。範囲内の文字は設問文に入れない（戻り値）。"""
    import fitz
    inside = {}
    for no, figs in plan.items():
        if len(figs) < 3 or len({f['page'] for f in figs}) != 1:
            continue
        pn = figs[0]['page']
        u = fitz.Rect(figs[0]['rect'])
        for f in figs:
            u |= f['rect']
        lines = lines_of(doc, pn, 0, K.MID_X)
        taken, grown = set(), True
        while grown:                                   # ラベルの下の注記…と連なって広がる
            grown = False
            near = fitz.Rect(u.x0 - 30, u.y0 - 28, u.x1 + 30, u.y1 + 28)
            for i, l in enumerate(lines):
                t = l['text'].strip()
                lr = fitz.Rect(l['x0'], l['y0'], l['x1'], l['y1'])
                # 設問文の行（左端 x≈69 から始まる）は短くても取り込まない（「写真を示す。」）
                if i in taken or l['x0'] < 74 or CH_START.match(t) or len(t) > 16 or not near.intersects(lr):
                    continue
                taken.add(i)
                u |= lr
                grown = True
        u = fitz.Rect(u.x0 - 3, u.y0 - 3, u.x1 + 3, u.y1 + 3)
        mask = [fitz.Rect(l['x0'] - 1, l['y0'] - 1, l['x1'] + 1, l['y1'] + 1) for l in lines
                if CH_START.match(l['text'].strip()) and u.intersects(fitz.Rect(l['x0'], l['y0'], l['x1'], l['y1']))]
        plan[no] = [dict(page=pn, rect=u, mask=mask)]
        inside[no] = u
    return inside


def name_figs(plan, kid_of, suffix='', doc=None):
    """並びは図の下のラベル順（A→B、a→e、①→⑤）。ラベルが揃っていなければ上から・左から。
    ⚠️ NO.891 は a d／b e／c の2段組なので、位置の順だと a,d,b,e,c になる。"""
    for no, figs in plan.items():
        labs = [fig_label(doc, f) for f in figs] if doc is not None and len(figs) > 1 else []
        if labs and all(labs) and len(set(labs)) == len(labs):
            order = {id(f): LABEL_ORDER.index(lb) // 5 for f, lb in zip(figs, labs)}
            figs.sort(key=lambda f: order[id(f)])
        else:
            figs.sort(key=lambda f: (round(f['rect'].y0 / 20), f['rect'].x0))
        for i, f in enumerate(figs, 1):
            f['name'] = '%s%s_%d.jpeg' % (kid_of[no], suffix, i)


# ── 本体 ────────────────────────────────────────────────────────
_CALC = None


def calc_labels():
    """既存の科目の計算問題 uid → 桁文字列（借用の判定に使う）。"""
    global _CALC
    if _CALC is None:
        _CALC = {}
        import glob
        for f in glob.glob('questions_*.json'):
            for ch in json.load(io.open(f, encoding='utf-8'))['chapters']:
                for q in ch['qs']:
                    if q.get('ans_label', '').startswith('計算答：'):
                        _CALC[q['uid']] = q['ans_label'][4:]
    return _CALC


def borrow(sources, kid, choices, ok, calc_ans, table):
    cands = sources.get(B.kid_key(kid), [])
    if calc_ans is not None:                           # 計算問題は桁文字列の一致で同じ問題とみなす
        for c in cands:
            if c['kind'] == 'subject' and calc_labels().get(c['uid']) == calc_ans:
                return c, None
        return None, None
    src, rej = B.pick_source(cands, choices, ok, table=table)
    if src:
        return src, None
    return B2.permuted_source(cands, choices, ok)


def build():
    import fitz
    A = {r['no']: r for r in json.load(io.open(K.ANSTABLE, encoding='utf-8'))['rows']}
    P = json.load(io.open(K.PARSED, encoding='utf-8'))
    # 下線として拾った細い横線は、この1問を除いて全部が表の罫だった（表の上罫が直上の問いの行に掛かる）
    for p in P['problems'] + P['expls']:
        if p['no'] in UL_OK and p in P['problems']:
            continue
        for l in p['lines']:
            l[3] = l[3].replace('<u>', '').replace('</u>', '')
    Q = {p['no']: p for p in P['problems']}
    E = {e['no']: e for e in P['expls']}
    if not (set(A) == set(Q) == set(E)):
        die('巻頭リスト・問題・解説の NO. が揃わない')
    kid_of = {n: A[n]['kid'] for n in A}
    q_plan, e_plan = figure_plan(P)
    import fitz
    fdoc = fitz.open(K.PDF)
    inside = combine_figs(q_plan, Q, fdoc)
    for no, u in inside.items():                       # 1枚にまとめた図の中の文字（ラベル・注記）は設問文に入れない
        Q[no]['lines'] = [l for l in Q[no]['lines']
                          if not (u.x0 <= (l[1] + l[4]) / 2 <= u.x1 and u.y0 <= l[0] + 4 <= u.y1)
                          or CH_START.match(l[2].strip())]
    name_figs(q_plan, kid_of, doc=fdoc)
    name_figs(e_plan, kid_of)
    for figs in e_plan.values():                       # 解説の図は images/ex/（設問の図とは別物・模試と同じ置き方）
        for f in figs:
            f['name'] = 'ex/' + f['name']
    sources = B.load_sources()
    report = dict(borrowed=[], none=[], permuted=[])
    starts = [s for s, _ in CHAPTERS] + [max(A) + 1]
    chapters = []
    for ci, (start, title) in enumerate(CHAPTERS):
        qs = []
        for no in range(start, starts[ci + 1]):
            a, p, e = A[no], Q[no], E[no]
            uid = '%s_ch%02d_q%d' % (SID, ci + 1, no)
            qt_lines, choices, is_table = split_problem(p)
            if no in TABLE_CHOICES:
                choices, is_table = [(FW[i], t) for i, t in enumerate(TABLE_CHOICES[no])], True
            ans_raw = e['ans'] or ''
            calc = None
            either = None
            if not choices:
                calc = calc_answer(no, qt_lines, ans_raw)
            # 設問文
            if no in QT_FIX:
                qt = QT_FIX[no]
            else:
                qt = '<br/>'.join(strongify(qt_paragraphs(qt_lines)))
            for old, new in QT_SUB.get(no, []):
                if old not in qt:
                    die('NO.%d: QT_SUB の置換元が見つからない %r' % (no, old))
                qt = qt.replace(old, new)
            # 選択肢と正解
            cl = []
            ans_label = ''
            ok_idx = []
            if calc is None:
                letters = [FW.index(c[0]) if c[0] in FW else HW.index(c[0]) for c in choices]
                if letters != list(range(len(letters))):
                    die('NO.%d: 選択肢の記号が並んでいない %s' % (no, [c[0] for c in choices]))
                m = re.match(r'^([a-i](?:,[a-i])*)(.*)$', ans_raw)
                if not m:
                    die('NO.%d: 解答が読めない %r' % (no, ans_raw))
                ok_idx = [HW.index(x) for x in m.group(1).split(',')]
                rest = m.group(2).strip()
                if rest.startswith('or'):
                    either = rest
                cl = [dict(t='%s　%s' % (FW[i], b), ok=i in ok_idx) for i, (_, b) in enumerate(choices)]
                ans_label = '／'.join(cl[i]['t'] for i in ok_idx)
                if either:
                    alt = re.sub(r'\s*※.*$', '', ans_raw[len(m.group(1)):]).strip()
                    ans_label += '（複数の選択肢を正解とする：%s %s）' % (m.group(1), alt)
                elif rest:
                    ans_label += '　' + rest
            else:
                ans_label = '計算答：' + calc
            # バッジ
            badges = []
            if a['mid']:
                badges.append(dict(cls='bb', t=a['mid'].replace('：', ' ')))
            imgs = ['%s/%s' % (IMG_DIR, f['name']) for f in q_plan.get(no, [])]
            if imgs:
                badges.append(dict(cls='bi', t='📷 画像'))
            rate, rate_cls, rate_text = B.rate_fields(a['rate'] if a['rate'] is not None else -1)
            theme = e['theme']
            # 解説（PDF）
            body = expl_html(e)
            for f in e_plan.get(no, []):
                body += ('<div class="exfig-row"><img loading="lazy" decoding="async" alt="" '
                         'class="qimg exfig" src="%s/%s"/></div>' % (IMG_DIR, f['name']))
            eg = [dict(cls='em', h='📖 1,000本ノックの解説', c=body)]
            q = dict(uid=uid, qn='Q.%d' % no, episode='(%s)' % a['kid'],
                     rate=rate, rate_cls=rate_cls, rate_text=rate_text, badges=badges, qt=qt,
                     choices=cl, ans_label=ans_label, ans_sub='出題テーマ：' + theme, eg=eg, imgs=imgs)
            # 借用
            src, perm = borrow(sources, a['kid'], [c['t'] for c in cl], ok_idx, calc, is_table)
            if src:
                where = ('%s %s' % (src['name'], src['qn']) if src['kind'] == 'subject'
                         else '%s %s番' % (src['name'], src['qn']))
                intro = 'この問題（%s）は <b>%s</b> と同じ国試問題なので、その解説を下に併記しています。' % (a['kid'], where)
                if src['kind'] == 'subject' and src['ans_sub']:
                    intro += '<br/>' + src['ans_sub']
                if perm:
                    report['permuted'].append(no)
                q['eg'] += [dict(cls='ept', h='📎 %s の解説（同じ国試問題）' % where, c=intro)]
                if perm:
                    q['eg'].append(B2.perm_note(perm, cl))
                q['eg'] += list(src['eg'])
                report['borrowed'].append((no, a['kid'], src['uid']))
            else:
                report['none'].append((no, a['kid']))
            qs.append(q)
        chapters.append(dict(title='第%d章 %s' % (ci + 1, title), qs=qs))
    doc = fitz.open(K.PDF)
    return chapters, report, (q_plan, e_plan), doc


def apply_overrides(chapters):
    if not os.path.exists(OVERRIDES):
        return 0
    ov = json.load(io.open(OVERRIDES, encoding='utf-8'))
    by = {q['uid']: q for ch in chapters for q in ch['qs']}
    n = 0
    for uid, patch in ov.items():
        if uid.startswith('_'):
            continue
        if uid not in by:
            die('overrides に未知の uid: %s' % uid)
        by[uid].update(patch)
        n += 1
    return n


def verify(chapters):
    """B.verify に、計算問題（選択肢0個）を通す分岐を足したもの。"""
    calc = [q for ch in chapters for q in ch['qs'] if not q['choices']]
    for q in calc:
        if not re.fullmatch(r'計算答：[0-9.]+', q['ans_label']):
            die('%s: 計算問題の ans_label %r' % (q['uid'], q['ans_label']))
    tmp = [dict(c, qs=[q for q in c['qs'] if q['choices']]) for c in chapters]
    B.NO_FIG_OK = {str(s) for s in NO_FIG_OK}
    B.verify(tmp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--figs', action='store_true', help='図を 1000本ノック/images/ へ書き出す')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--report', action='store_true', help='借用の内訳を出す')
    a = ap.parse_args()
    chapters, report, (q_plan, e_plan), doc = build()
    if a.figs:
        plan = {}
        for d in (q_plan, e_plan):
            for no, figs in d.items():
                plan.setdefault(('q' if d is q_plan else 'e', no), []).extend(figs)
        B.write_figs(doc, {k: [dict(f, mask=f.get('mask', [])) for f in v] for k, v in plan.items()})
    tot = sum(len(c['qs']) for c in chapters)
    for c in chapters:
        qs = c['qs']
        print('  %-30s %3d問（借用%3d・画像%2d・計算%2d）' % (
            c['title'], len(qs), sum(1 for q in qs if len(q['eg']) > 1),
            sum(1 for q in qs if q['imgs']), sum(1 for q in qs if not q['choices'])))
    n = apply_overrides(chapters)
    print('借用 %d問（うち選択肢の並び違い %d問）・借用なし %d問・手書きの上書き %d問'
          % (len(report['borrowed']), len(report['permuted']), len(report['none']), n))
    if a.report:
        print('  借用なし:', ' '.join('%d(%s)' % t for t in report['none']))
    verify(chapters)
    js = json.dumps(dict(sid=SID, chapters=chapters), ensure_ascii=False, indent=2)
    if a.check:
        cur = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        print('現物と一致' if cur == js else '*** 現物と差分あり')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し %s  %dKB  %d問' % (OUT, os.path.getsize(OUT) // 1024, tot))


if __name__ == '__main__':
    main()
