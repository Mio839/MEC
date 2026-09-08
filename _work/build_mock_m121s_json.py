# -*- coding: utf-8 -*-
"""questions_m121s.json を「2026年度 夏メック模試_解説書.pdf」から生成する。

  python _work/build_mock_m121s_json.py                 全6章を書き出す
  python _work/build_mock_m121s_json.py --block A       A問題だけ処理して統計を出す（書き出さない）
  python _work/build_mock_m121s_json.py --dump A17      1問ぶんの生成結果を見る
  python _work/build_mock_m121s_json.py --check         書き出さず、現物と一致するかだけ見る

⚠️ PDF は .gitignore 済み（MEC問題文pdf/）＝リポジトリには入っていない。手元に PDF が
   無いマシンでは動かないが、生成物 questions_m121s.json は追跡されている。

── この科目だけ他と作りが違う点 ──────────────────────────────────
  他の科目は「章別HTML → build_{sid}_json.py → questions_{sid}.json」で、正本はHTML。
  模試にはHTMLが無いので **PDF が唯一の正本**。そのため:

  ① **正解・配点・禁忌肢・連問・別冊No. は mock_data/m121s.js から借りる。**
     あれは解答表・科目別一覧表・設問文の3つを突き合わせて検算済み（引き継ぎ §2）で、
     採点ツールが現に使っている。ここで読み直すと**同じ事実の2つ目の実装**ができる。
     ⚠️ 借りるだけで**触らない**（触ると mec_mock_v1 の採点記録が切れる）。

  ② **手書きの解説は上書きしない。** 誤答65問は循環器品質で書き下ろす（引き継ぎ §6-3）が、
     それを questions_m121s.json に直接書くと、PDFの読み取りを直したくなった日に
     再生成できなくなる。手書きは _work/mock_m121s_overrides.json に置き、
     **生成の最後にマージする**（2026-09-08 ユーザー裁定）。
     questions_m121s.json は最後まで純粋な派生物のまま＝いつ再生成しても壊れない。

── PDF の読み方（座標と罠）────────────────────────────────────────
  ・見出しは**左マージン x<62** に7語しかない（全772ページを走査して確認）:
      出題ポイント／鑑別診断へのプロセス／確定診断／画像診断／英文和訳／選択肢考察／check point
    ⚠️ x を見ないと設問文の「確定診断に最も有用な検査はどれか。」が見出しに化ける。
  ・本文は x≒110〜142。ページ左右の大きな1文字 A〜F は**ブロックの柱**（x<20 か x>480）。
  ・設問ページ左肩の設問番号は**右端が x≒98 で揃う**ので x1<100 で外す。
  ・最初の見出しより上が**設問領域**（設問文＋選択肢、連問はステム＋全サブ設問）。
  ・行の右端は揃って x1≒465。**x1 が短い行が段落の終わり**（PDFの折り返しは本文ではない）。
  ・`正解：ｂ` は右寄せ（x0≒428）。連問は `正解：41－ｃ　42－ａ`。
  ・⚠️ セクションの並びは 出題ポイント → 鑑別診断 → **選択肢考察** → 画像診断 → 確定診断
    → check point で、引き継ぎ §3-1 に書いた順とは違う。**PDFの並びをそのまま残す。**

── 表 ─────────────────────────────────────────────────────────
  check point には**罫線で組まれた表**がある（95ページ・120個）。素通しすると
  「分　類薬　物抗菌薬アミノグリコシド系…」という読めない1行になる。
  ⚠️ `page.find_tables()` は使えない——左マージンの見出しと本文を1つの表と誤認し、
     本文の段落を勝手に列へ割る（p8・p19 で確認）。**罫線そのものを拾うこと**：
     細い矩形を水平線／垂直線に分け、触れ合うものを連結成分にまとめ、
     水平2本＋垂直2本以上を表とみなす。行は水平線、列は**その行を跨ぐ**垂直線で決める
     （結合セルがあるので列は行ごとに数え直す）。
"""
import fitz, io, json, os, re, sys, argparse
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PDF = 'MEC問題文pdf/2026年度 夏メック模試_解説書.pdf'
MOCK = 'mock_data/m121s.js'
OVERRIDES = '_work/mock_m121s_overrides.json'
OUT = 'questions_m121s.json'
IMGDIR = '夏メック模試/images'
EXDIR = '夏メック模試/images/ex'      # 解説（画像診断）の注釈付きの図
DOC = None                           # build() が開いた PDF（fig_html が使う）
WRITE_FIGS = False                   # --figs のときだけ解説図を書き出す

SID = 'm121s'
BLOCKS = 'ABCDEF'
# A〜F を ch01〜ch06 に、番号は**科目内で通し**にする（引き継ぎ §6-0・規約②）。
# ⚠️ 章頭の通し番号（A:1 B:76 C:126 D:201 E:276 F:326）を書き写さないこと。
#    ブロックの問題数から決まる値なので、数字で持つと構成が変わった日に黙って腐る。
#    ⚠️⚠️ **同じ規則が mock.js の MecMock.studyUid() にもある**（採点結果から解説の
#    uid を引くため）。式を変えるなら両方を直し、_work/test_mock_questions.js を通すこと。
CH_START = {}                        # build() が mock_data から組み立てる
CH_TITLE = {'A': '第1章 A問題（各論）', 'B': '第2章 B問題（必修）',
            'C': '第3章 C問題（総論）', 'D': '第4章 D問題（各論）',
            'E': '第5章 E問題（必修）', 'F': '第6章 F問題（総論）'}
HISSHU = {'B', 'E'}

# 左マージンの見出し → (キー, cls, 表示見出し)。
# ⚠️ cls は study.css の6色（ep/ee/ept/em/ec/ei）だけ。独自クラスを作らないこと。
SEC = {
    '出題ポイント':         ('point',  'ept', '📌 出題ポイント'),
    '鑑別診断へのプロセス': ('proc',   'ee',  '🔍 鑑別診断へのプロセス'),
    '確定診断':             ('dx',     'ee',  '🎯 確定診断'),
    '画像診断':             ('img',    'ei',  '🖼 画像診断'),
    '英文和訳':             ('en',     'ep',  '🔤 英文和訳'),
    '選択肢考察':           ('choice', 'em',  '□ 選択肢考察'),
    'check point':          ('cp',     'ep',  '📖 check point'),
}
HEAD_SPLIT = '鑑別診断への'          # この見出しだけ2行に割れる（＋「プロセス」）

# ── 選択肢が表になっている2問（機械では決まらない。ここが唯一の正本）────────────
# ⚠️ 表のまま置く方式は採らない——試験モードは肢をシャッフルするので、
#    別置きの表と肢の対応が崩れる（CLAUDE.md「表・図の選択肢の復元」）。
#    **列見出しを各肢に埋め込み**、単位は設問文の末尾に注記する。
# ⚠️ 値は該当ページを 300dpi で描画して目視で読んだもの（2026-09-09）。
#    ⚠️ 選択肢は card_renderer.js が esc() で描くので**HTMLタグは使えない**。
#       上付き・下付きは Unicode（₂ ₃ ⁻ ⁺）で書くこと——他科目も同じ流儀。
TABLE_CHOICES = {
    'A65': ('（PCO₂ は Torr、ほかは mEq/L）', [
        'pH 7.22／PCO₂ 35／HCO₃⁻ 14／Na 140／K 4.3／Cl 105',
        'pH 7.22／PCO₂ 76／HCO₃⁻ 35／Na 138／K 4.3／Cl 99',
        'pH 7.25／PCO₂ 40／HCO₃⁻ 17／Na 139／K 4.3／Cl 110',
        'pH 7.38／PCO₂ 48／HCO₃⁻ 26／Na 137／K 3.8／Cl 102',
        'pH 7.55／PCO₂ 60／HCO₃⁻ 35／Na 138／K 3.0／Cl 90']),
    'D46': ('（電解質は mEq/L、ブドウ糖は %）', [
        'Na⁺ 0／K⁺ 0／Cl⁻ 0／Lactate⁻ 0／ブドウ糖 5',
        'Na⁺ 35／K⁺ 20／Cl⁻ 35／Lactate⁻ 20／ブドウ糖 4.3',
        'Na⁺ 77／K⁺ 0／Cl⁻ 77／Lactate⁻ 0／ブドウ糖 2.5',
        'Na⁺ 90／K⁺ 0／Cl⁻ 70／Lactate⁻ 20／ブドウ糖 2.5',
        'Na⁺ 130／K⁺ 4／Cl⁻ 109／Lactate⁻ 28／ブドウ糖 5']),
}

X_BODY_MIN, X_BODY_MAX = 62.0, 480.0
X_SHOULDER = 100.0                   # 設問ページ左肩の番号は右端がこれより左
Y_TOP, Y_BOT = 40.0, 680.0
X_RIGHT_FULL = 448.0                 # ここまで伸びている行は次の行へ続く
FIG_PAD = 5.0                        # 解説図の clip に足す余白(pt)
FIG_DPI = 200                        # 解説図の解像度。⚠️ 別冊図(300dpi)より落としてある——
                                     #    こちらは注記の文字ごと写すので幅が2倍あり、
                                     #    300dpi だと1枚2MB級になる（実測で読める下限が200）
ZEN = 'ａｂｃｄｅ'
CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
# 2つの肢を1つの解説でまとめる縦の波括弧（設問ページに60本）。字そのものは本文ではない。
# ⚠️ 縦に伸ばす部品 ⎜(U+239C) と ｜(U+FF5C) を忘れないこと。3行を超える括弧は
#    ⎫ ⎜ ⎜ ⎬ ⎜ ⎭ のように部品が積まれる。落とし忘れると `⎜` が1行の段落として残り、
#    その肢の解説（ans_sub）が `⎜` だけになる（実際に5問でそうなった）。
BRACE = '⎧⎨⎩⎪⎫⎬⎭⎜｜'
RE_LABEL = re.compile(r'^([○×□])[　 ]?([' + ZEN + r'])$')
RE_CHOICE = re.compile(r'^([' + ZEN + r'])[　 ](.*)$')
RE_JUDGE = re.compile(r'^([○×□])[　 ]?([' + ZEN + r'])[　 ]?(.*)$')
RE_ANS = re.compile(r'^正解[：:]\s*(.*)$')
# ⚠️⚠️ 連問のサブ設問の区切りは**全角スペース（U+3000）だけ**。半角も許すと症例文の
#    書き出し「74 歳の女性。」が設問番号 74 に見えて、その設問の中身が丸ごと入れ替わる
#    （F73-75 で実際に起きた。build_mock_m121s.py が踏んだのと同じ罠）。
RE_SUBNO = re.compile(r'^(\d+)　(.*)$')
# ⚠️ 図が選択肢の問題では、選択肢の run の直後に図のパネル名だけの段落（「①②④⑤」
#    「①④②⑤③B」）が続く。これを「折り返した肢の続き」として畳むと、最後の肢 ｅ が
#    「ｅ　⑤①②④⑤」になる（A26・D25・D40・F58 の4問で実際にそうなっていた）。
#    丸数字と図ラベル（A〜E）と空白だけでできた段落は本文ではないので run を打ち切る。
RE_FIGLABEL = re.compile(r'^[' + CIRC + r'A-EＡ-Ｅ\s　]+$')
RE_CP_TITLE = re.compile(r'^《(.+?)》$')
RE_CALC_GRID = re.compile(r'^[' + CIRC + r'][　 ]*0[　 ]')     # マークシートの数字欄
RE_SUBHEAD = re.compile(r'^([０-９0-9]+|[一二三四五六七八九十]+)[）)]\s')
# 図の直下に組まれるラベル（A／B／C や ①〜⑤）。**画像の外に組まれた文字なので、
# 切り出した画像には写らない**（引き継ぎ §3-3）。本文ではないので落とす。
# ⚠️ パターンだけで落とさないこと——check point の箇条書きの「C）」等と紛れる。
#    「図の真下にあること」を必ず併せて見る。
RE_FIGLAB = re.compile(r'^[A-Z' + CIRC + r'　 ]{1,10}$')


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── mock_data/m121s.js を借りる ──────────────────────────────────
def load_mock():
    s = io.open(MOCK, encoding='utf-8').read()
    # `var d={…};` の JSON だけを取る。末尾に IIFE が続くので raw_decode で切る
    # （`rindex('};')` はファイル末尾の `})();` を掴む）。
    return json.JSONDecoder().raw_decode(s, s.index('{"id"'))[0]


# ── 罫線で組まれた表 ─────────────────────────────────────────────
def grids(page):
    """罫線から表を復元する。→ [(bbox, [行のy], [垂直線])]"""
    H, V = [], []
    for it in page.get_drawings():
        r = it['rect']
        if r.width >= 8 and r.height <= 1.6:
            H.append(r)
        elif r.height >= 8 and r.width <= 1.6:
            V.append(r)
    if not H or not V:
        return []
    segs = [('h', r) for r in H] + [('v', r) for r in V]
    used = [False] * len(segs)
    out = []

    def touch(a, b):
        return not (a.x1 < b.x0 - 2 or b.x1 < a.x0 - 2 or a.y1 < b.y0 - 2 or b.y1 < a.y0 - 2)

    for i in range(len(segs)):
        if used[i]:
            continue
        comp, used[i], k = [i], True, 0
        while k < len(comp):
            for j in range(len(segs)):
                if not used[j] and touch(segs[comp[k]][1], segs[j][1]):
                    used[j], _ = True, comp.append(j)
            k += 1
        h = [segs[i][1] for i in comp if segs[i][0] == 'h']
        v = [segs[i][1] for i in comp if segs[i][0] == 'v']
        if len(h) < 2 or len(v) < 2:
            continue
        box = fitz.Rect(min(r.x0 for r in h + v), min(r.y0 for r in h + v),
                        max(r.x1 for r in h + v), max(r.y1 for r in h + v))
        ys = sorted({round((r.y0 + r.y1) / 2, 1) for r in h})
        ys = [y for i, y in enumerate(ys) if i == 0 or y - ys[i - 1] > 3]
        if len(ys) < 2:
            continue
        out.append((box, ys, v))
    out.sort(key=lambda g: g[0].y0)
    return out


def grid_html(box, ys, verts, lines):
    """表の中の行を格子へ流し込んで <table class="tb"> にする。
    ⚠️ 列は**その行を跨ぐ垂直線**だけで決める（結合セルがあるので表全体では決まらない）。"""
    rows = []
    for i in range(len(ys) - 1):
        y0, y1 = ys[i], ys[i + 1]
        if y1 - y0 < 6:
            continue
        xs = sorted({round(v.x0, 1) for v in verts if v.y0 <= y0 + 3 and v.y1 >= y1 - 3})
        xs = [x for j, x in enumerate(xs) if j == 0 or x - xs[j - 1] > 3]
        if len(xs) < 2:
            xs = [box.x0, box.x1]
        cells = []
        for c in range(len(xs) - 1):
            got = sorted([ln for ln in lines
                          if y0 - 2 <= (ln['y0'] + ln['y1']) / 2 <= y1 + 2
                          and xs[c] - 2 <= ln['x0'] < xs[c + 1] + 2],
                         key=lambda g: (g['y0'], g['x0']))
            # セルの中も折り返しと改行を見分ける。⚠️ 全部つなぐと「アミノグリコシド系
            #    （…）グリコペプチド系（…）」のように別項目が1つに溶ける。
            cell = ''
            for k, gl in enumerate(got):
                if k and got[k - 1]['x1'] < xs[c + 1] - 12:
                    cell += '<br/>'
                cell += gl['t'].strip()
            cells.append(cell)
        if any(cells):
            rows.append(cells)
    if not rows:
        return ''
    head = rows[0]
    body = rows[1:]
    cel = lambda c: '<br/>'.join(rich(x) for x in c.split('<br/>'))
    h = '<tr>' + ''.join('<th>' + cel(c) + '</th>' for c in head) + '</tr>'
    b = ''.join('<tr>' + ''.join('<td>' + cel(c) + '</td>' for c in r) + '</tr>' for r in body)
    return '<table class="tb">' + h + b + '</table>'


# ── ページを行にする ─────────────────────────────────────────────
def page_parts(page):
    """→ ([本文行], [(y0, 見出し名)], [表])
    本文行は dict(x0, y0, x1, y1, t)。表の中の行は tbl キーで表の番号を持つ。"""
    raw, brace, boxes = [], [], []
    for b in page.get_text('dict')['blocks']:
        if b['type'] != 0:
            boxes.append(b['bbox'])
            continue
        for l in b['lines']:
            x0, y0, x1, y1 = l['bbox']
            # ⚠️ 行末の空白を落とさないこと。この紙面は半角数字と全角文字の間に空白を
            #    置くので、折り返し位置の「3 」を rstrip すると「3杯/日」になり、
            #    同じ文の中で「3 cm」と「3杯」が混ざる（逐語移植の名に反する）。
            t = ''.join(s['text'] for s in l['spans']).lstrip()
            if not t.strip() or not (Y_TOP <= y0 <= Y_BOT):
                continue
            if all(c in BRACE for c in t.strip()):
                brace.append(dict(x0=x0, y0=y0, y1=y1))     # 肢をまとめる波括弧
                continue
            if t.strip() == '禁':
                continue                                     # 禁忌肢の印（□ が別に残る）
            raw.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, t=t))
    raw.sort(key=lambda r: (r['y0'], r['x0']))
    # 縦に積まれた ⎫⎬⎭ を1本の波括弧にまとめる（実測60本・すべて3字1組）
    brace.sort(key=lambda b: (round(b['x0']), b['y0']))
    groups = []
    for b in brace:
        if groups and abs(groups[-1]['x0'] - b['x0']) < 4 and b['y0'] - groups[-1]['y1'] < 14:
            groups[-1]['y1'] = b['y1']
        else:
            groups.append(dict(x0=b['x0'], y0=b['y0'], y1=b['y1']))
    gs = grids(page)
    body, head = [], []
    i = 0
    while i < len(raw):
        ln = raw[i]
        if ln['x0'] < X_BODY_MIN:
            name = ln['t'].strip().replace(' ', '').replace(' ', '')
            if name == HEAD_SPLIT:                      # 「鑑別診断への／プロセス」の2行
                name = '鑑別診断へのプロセス'
                if i + 1 < len(raw) and raw[i + 1]['t'].strip() == 'プロセス':
                    i += 1
            if name in SEC:
                head.append((ln['y0'], name))
            # 柱の A〜F、禁の字、ページ番号、誌名は無視する
        elif ln['x0'] <= X_BODY_MAX and ln['x1'] >= X_SHOULDER:
            cy = (ln['y0'] + ln['y1']) / 2
            ln['tbl'] = next((k for k, g in enumerate(gs)
                              if g[0].y0 - 2 <= cy <= g[0].y1 + 2
                              and g[0].x0 - 4 <= ln['x0'] <= g[0].x1 + 4), None)
            ln['brace'] = next((k for k, b in enumerate(groups)
                                if b['y0'] - 3 <= cy <= b['y1'] + 3), None)
            near = any(bx[1] - 4 <= (ln['y0'] + ln['y1']) / 2 <= bx[3] + 34
                       and bx[0] - 6 <= (ln['x0'] + ln['x1']) / 2 <= bx[2] + 6 for bx in boxes)
            ln['figlab'] = near and bool(RE_FIGLAB.match(ln['t'].strip()))
            # 図に添えられた短い注記（「3 cm/分」「仰臥位」「右側臥位」）。⚠️ 設問領域でだけ
            # 落とすこと——解説の本文にも図はあり、そこは短い一文が本文でありうる。
            ln['figanno'] = near and len(ln['t'].strip()) <= 24
            body.append(ln)
        i += 1
    return body, sorted(head), gs, boxes


# 解説の図を出すのは「画像診断」だけ（2026-09-09 ユーザー裁定）。選択肢考察と
# check point にも図はあるが（各8枚）、そちらは本文中の図表なので見送った。
FIG_SEC = '画像診断'


def collect(doc, pages):
    """[開始, 終了]（1-origin）の本文を見出しで区切る。
    → [[見出し名 or None, [行...]]] — 先頭の None が設問領域。

    ⚠️ 画像診断のセクションだけ、**図を本文と同じ並びに混ぜて返す**（`img` キーを持つ項目）。
       この節は「写真A　…の所見。→ 図A → 写真B　…の所見。→ 図B」という組み方なので、
       文を全部先に出して図を後ろへまとめると、どの説明がどの絵のことか読めなくなる。
    ⚠️ 図の中や真上に置かれた注記（矢印の先の「顆粒状隆起性病変」など）は**図の一部**。
       blocks_of が本文から外して clip を広げる（判定に段落の切れ目が要るのでここではやらない）。"""
    segs = [[None, []]]
    for p in range(pages[0] - 1, pages[1]):
        body, head, gs, boxes = page_parts(doc[p])
        stream = body + [dict(x0=b[0], y0=b[1], x1=b[2], y1=b[3], t='', img=b) for b in boxes]
        stream.sort(key=lambda r: (r['y0'], r['x0']))
        for ln in stream:
            while head and ln['y0'] >= head[0][0] - 4:
                segs.append([head.pop(0)[1], []])
            here = segs[-1][0]
            if ln.get('img'):
                if here != FIG_SEC:
                    continue                             # 設問の図は imgs が持つ／他節は見送り
                ln['page'] = p
                segs[-1][1].append(ln)
                continue
            if ln.get('figlab') or (ln.get('figanno') and len(segs) == 1):
                continue        # 図のラベルと、設問領域で図に添えられた短い注記
            ln['page'] = p
            ln['grids'] = gs
            segs[-1][1].append(ln)
        for y, nm in head:                              # 行を伴わない見出し（ページ末尾）
            segs.append([nm, []])
    return segs


# ── 行 → 段落／表 ───────────────────────────────────────────────
# 図に添えられた注記（矢印の先の「顆粒状隆起性病変」「仰臥位」など）。
# ⚠️⚠️ 位置だけでも字数だけでも説明文と見分けられない——注記も、折り返した説明文も、
#    図のすぐ上に深い字下げで置かれる。3つを重ねて初めて分かれる:
#      ① 1つの段落で終わる短い文であること（説明文は右端まで伸びて次行へ続く＝複数行）
#      ② 「写真」で始まらないこと（写真A/B/C は必ず説明文の頭）
#      ③ 図に重なっているか、図の直上・直下で**図の横幅の内側**にあること
#         （説明文は本文の左マージン x=115/124 から始まるので、③の下2つでは弾かれる。
#          図に重なる注記は x=120 から始まるものもあるので、重なりの場合は x を見ない）
# ⚠️ 注記を本文に残すと「総胆管・肝内胆管拡張」のような語が説明文の途中に紛れ、しかも
#    **絵の側からは切り落とされて矢印だけが残る**（両方で壊れる）。
FIG_NOTE_MAX = 40                    # 注記とみなす字数の上限
# ⚠️ 「右端まで伸びている段落は説明文」で弾かないこと。図の右脇に置かれる注記は
#    版面の右端（x1≒465）まで使うので、その条件だと A43・A50・C51・D23・F67 の
#    注記が本文へ残り、絵からは切り落とされる（2026-09-09 に一度そうなった）。
FIG_NOTE_X = 130.0                   # 本文の字下げ（114.8 / 124.0）より深いこと
FIG_NOTE_GAP = 32.0                  # 図の上下これだけ離れていても図のもの
FIG_NOTE_SIDE = 24.0                 # 図の左右へこれだけはみ出してよい


def _fold_fig_notes(items):
    """画像診断の節で、図の注記を本文から外して図の clip へ畳む。"""
    figs = [x for x in items if x[0] == 'i']
    if not figs:
        return [(k, v) for k, v, _b in items]
    notes = set()
    for n, (kind, v, box) in enumerate(items):
        if kind != 'p' or box is None:
            continue
        if len(v) > FIG_NOTE_MAX or v.startswith('写真'):
            continue
        if RE_FIGLAB.match(v):
            # ⚠️ 図の脇の裸のラベル（A／B）は**落とすだけ**。clip へ畳むと矩形が横へ伸びて
            #    隣の図を巻き込む（D20 で写真Aの clip に写真Bの左端が写り込んだ）。
            #    A/B の対応は説明文「写真A、B　…」と図の並びが持っている。
            notes.add(n)
            continue
        cy = (box[1] + box[3]) / 2
        hit = []
        for f in figs:
            # ⚠️⚠️ **同じページの図だけ**を候補にすること。画像診断の節はページをまたぐので
            #    （F70 は写真A〜C が p767・写真D が p768）、ページを見ないと p768 の注記が
            #    p766 の図の y 範囲に「重なっている」と判定され、**別ページの絵へ黙って
            #    吸い込まれて消える**（2026-09-09 に F70 の写真Dで実際にそうなった）。
            if f[1][0] != box[4]:
                continue
            r = f[1][1]
            inside = r[1] <= cy <= r[3]
            near = (r[1] - FIG_NOTE_GAP <= box[3] <= r[1]
                    or r[3] <= box[1] <= r[3] + FIG_NOTE_GAP)
            fits = (box[0] >= FIG_NOTE_X and box[0] >= r[0] - FIG_NOTE_SIDE
                    and box[2] <= r[2] + FIG_NOTE_SIDE)
            if inside or (near and fits):
                hit.append((0 if inside else abs(cy - (r[1] + r[3]) / 2), r))
        if not hit:
            continue
        # ⚠️ 最初に当たった図ではなく**一番近い図**へ寄せること。写真Bの直上に置かれた
        #    注記は写真Aの「直下 32pt 以内」にも入るので、順番で決めると写真Aの clip が
        #    下へ伸びて**写真Bの説明文を巻き込む**（A38 で実際にそうなった）。
        r = min(hit, key=lambda h: h[0])[1]
        r[0], r[1] = min(r[0], box[0]), min(r[1], box[1])
        r[2], r[3] = max(r[2], box[2]), max(r[3], box[3])
        notes.add(n)

    keep = [b for n, (k, v, b) in enumerate(items)
            if n not in notes and k in ('p', 't') and b is not None]
    out = []
    for n, (kind, v, box) in enumerate(items):
        if n in notes:
            continue
        if kind == 'i':
            r = v[1]
            c = [r[0] - FIG_PAD, r[1] - FIG_PAD, r[2] + FIG_PAD, r[3] + FIG_PAD]
            # ⚠️ 余白が本文へ食い込むと、絵の上端に説明文の下半分が帯で写る（実機で確認）。
            #    本文として残す段落の箱には**1ptも掛からない**ところまで詰める。
            for b in keep:
                if b[4] != v[0] or b[2] <= c[0] or b[0] >= c[2]:
                    continue                              # 横に離れている
                if b[3] <= r[1]:
                    c[1] = max(c[1], b[3] + 1)
                if b[1] >= r[3]:
                    c[3] = min(c[3], b[1] - 1)
            v = (v[0], c)
        out.append((kind, v))
    return out


def blocks_of(lines):
    """行の並びを段落・表・波括弧グループ・図に畳む。
    → [('p', 本文) | ('t', 表HTML) | ('g', ([ラベル], 本文)) | ('i', (ページ, clip))]
    ⚠️ PDFの折り返しを消すのは原文改変ではない（レイアウト由来で本文の一部ではない）。
       **文字そのものは1字も変えない。**"""
    out, cur, prev, curbox = [], '', None, None
    i = 0

    def flush():
        nonlocal cur, curbox, prev
        if cur.strip():
            out.append(('p', cur.strip(), curbox))
        cur, curbox, prev = '', None, None

    while i < len(lines):
        ln = lines[i]

        if ln.get('tbl') is not None:                    # 表はまとめて1つ
            key = (ln['page'], ln['tbl'])
            grp = [x for x in lines if (x['page'], x.get('tbl')) == key]
            flush()
            box, ys, verts = ln['grids'][ln['tbl']]
            html = grid_html(box, ys, verts, grp)
            if html:
                out.append(('t', html, None))
            while i < len(lines) and (lines[i]['page'], lines[i].get('tbl')) == key:
                i += 1
            continue

        if ln.get('img'):                                # 解説の図（画像診断だけ）
            flush()
            b = ln['img']
            out.append(('i', [ln['page'], [b[0], b[1], b[2], b[3]]], None))
            i += 1
            continue

        if ln.get('brace') is not None:                  # 2つの肢が1つの解説を共有する
            key = (ln['page'], ln['brace'])
            grp = [x for x in lines if (x['page'], x.get('brace')) == key]
            flush()
            labels = [x['t'].strip() for x in grp if RE_LABEL.match(x['t'].strip())]
            body = ''.join(x['t'] for x in sorted(
                (x for x in grp if not RE_LABEL.match(x['t'].strip())),
                key=lambda x: (round(x['y0']), x['x0'])))
            out.append(('g', (labels, body.strip()), None))
            while i < len(lines) and (lines[i]['page'], lines[i].get('brace')) == key:
                i += 1
            continue

        # 同じ y の断片は1本の行。⚠️ 区切りを入れずに x 順でつなぐこと——上付きの
        #    「H＋/K＋ -ATPase」や注記の「※」が別断片で来るので、空白を挟むと字が増える。
        same = [ln]
        while (i + 1 < len(lines) and lines[i + 1].get('tbl') is None
               and lines[i + 1].get('brace') is None and not lines[i + 1].get('img')
               and abs(lines[i + 1]['y0'] - ln['y0']) < 3):
            i += 1
            same.append(lines[i])
        t = ''.join(x['t'] for x in sorted(same, key=lambda x: x['x0']))
        x1 = max(x['x1'] for x in same)
        if t.strip():
            starts = not cur
            if not starts:
                st = t.strip()
                if prev is not None and prev < X_RIGHT_FULL:
                    starts = True                        # 前の行が右端まで伸びていない
                elif (RE_JUDGE.match(st) or RE_CHOICE.match(st) or RE_SUBNO.match(st)
                      or (st[0] in CIRC and (len(st) < 2 or st[1] not in '）)、。，・」』】'))
                      or st[0] in '・《'):
                    starts = True                        # 記号始まりは必ず段落の頭
            if starts and cur:
                out.append(('p', cur.strip(), curbox))
                cur, curbox = '', None
            cur += t if cur else t.lstrip()
            bb = [min(x['x0'] for x in same), min(x['y0'] for x in same),
                  x1, max(x['y1'] for x in same), ln['page']]
            curbox = bb if curbox is None else [min(curbox[0], bb[0]), min(curbox[1], bb[1]),
                                                max(curbox[2], bb[2]), max(curbox[3], bb[3]),
                                                curbox[4]]
            prev = x1
        i += 1
    flush()
    return _fold_fig_notes(out)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def rich(s):
    """記法だけHTMLへ。⚠️ 文字は1字も足さない・削らない。"""
    s = esc(s)
    for k in ('SpO', 'PaO', 'PaCO', 'PAO', 'SaO', 'FiO', 'PCO', 'PO'):
        s = re.sub(k + r'\s?2(?![0-9])', k + '<sub>2</sub>', s)
    s = re.sub(r'HCO\s?3\s?[－−-]', 'HCO<sub>3</sub><sup>−</sup>', s)
    return s


SUB_MAP = [('SpO', '₂'), ('PaO', '₂'), ('PaCO', '₂'), ('PAO', '₂'), ('SaO', '₂'),
           ('FiO', '₂'), ('PCO', '₂'), ('PO', '₂')]


def plain(s):
    """HTMLを置けない場所（ans_sub・選択肢）向けに、上付き下付きを Unicode で表す。
    ⚠️ rich() と同じ正規化を、markup の代わりに文字で行っているだけ。片方だけ直すと
       同じカードの中で「PCO₂」と「PCO 2」が混ざる（実際にそう見えた）。"""
    for k, sub in SUB_MAP:
        s = re.sub(k + r'\s?2(?![0-9])', k + sub, s)
    s = re.sub(r'HCO\s?3\s?[－−-]', 'HCO₃⁻', s)
    return s


MAX_SIDE = 1200                      # 長辺の上限。compress_images.py・mock_pdf.py と揃える


def fig_html(path, page, clip):
    """解説の図を1枚。⚠️ 図の中の注記（矢印の先の文字）ごと写す clip が来る前提。
    ⚠️ width/height は**保存したファイルの実寸**を読むこと。計算値を書くと、長辺の
       頭打ち（MAX_SIDE）で縮めたぶんだけ属性が実物とずれ、遅延読込でカードの高さが
       後からずれる（image_dims.json を作った理由と同じ穴）。
    ⚠️ 解説図は q['imgs'] に入れないこと——あれは設問の図で、選択肢より**上**に出る。
       注釈付きの絵は答えそのものなので、解説ブロックの中（＝正解を見た後）に置く。"""
    if WRITE_FIGS:
        pix = DOC[page].get_pixmap(dpi=FIG_DPI, clip=fitz.Rect(*clip))
        im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
        w, h = im.size
        if max(w, h) > MAX_SIDE:
            k = MAX_SIDE / float(max(w, h))
            im = im.resize((int(w * k + .5), int(h * k + .5)), Image.LANCZOS)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        im.save(path, 'JPEG', quality=92, optimize=True)
    if not os.path.exists(path):
        die('解説図が無い: %s（先に --figs で書き出すこと）' % path)
    with Image.open(path) as im:
        w, h = im.size
    # ⚠️ class は `qimg exfig`。`qimg` はライトボックス（study.html の委譲ハンドラ）が
    #    掴む名前なので外さないこと。⚠️ 一方で **`.qimg-row` に入れてはいけない**——
    #    「🖼️画像だけ」フィルタの hasImg が `.qimg-row .qimg` を見ており、解説の図まで
    #    数えると**設問に図が無い問題まで画像問題になる**（実測で121問と122問がずれる）。
    return ('<img loading="lazy" decoding="async" width="%d" height="%d" alt="" '
            'class="qimg exfig" src="%s"/>' % (w, h, path))


def body_html(items, fig=None):
    """段落と表を1つのHTMLへ。段落は <br/> で継ぐ（他科目と同じ流儀）。"""
    parts, n = [], 0
    for kind, v in items:
        if kind == 't':
            parts.append(v)
        elif kind == 'i':                                # 解説の図（画像診断だけ）
            n += 1
            html = fig_html(fig(n), v[0], v[1]) if fig else ''
            # 紙面で横に並んでいる図（D20 の正面像と断層像）は1つの行にまとめる。
            if parts and parts[-1].endswith('</div>') and parts[-1].startswith('<div class="exfig-row">'):
                parts[-1] = parts[-1][:-6] + html + '</div>'
            else:
                parts.append('<div class="exfig-row">' + html + '</div>')
        elif kind == 'g':                                # 波括弧でまとめられた2肢
            parts.append(rich('／'.join(v[0]) + '　' + v[1]))
        else:
            m = RE_SUBHEAD.match(v)
            parts.append(('<b>' + rich(v) + '</b>') if m and len(v) < 40 else rich(v))
    out = ''
    for i, p in enumerate(parts):
        if i and not re.match(r'<(table|div)', p) and not re.match(r'<(table|div)', parts[i - 1]):
            out += '<br/>'
        out += p
    return out


# ── 設問領域を分ける ─────────────────────────────────────────────
def split_members(items, nums):
    """設問領域の段落を [共通ステム, {番号: 段落}] に割る。
    ⚠️ 単問なら nums は1つで、ステムは空・全部がその設問のもの。
    ⚠️ 連問の区切りは**行頭の裸の番号**（`41　…`）。全角スペースでも半角でも来るが、
       症例文の書き出し「66 歳の男性。」と衝突するので**番号が兄弟のものと一致する**
       ことを必ず確かめる（build_mock_m121s.py が踏んだ罠と同じ）。"""
    if len(nums) == 1:
        return [], {nums[0]: items}
    stem, cur, out = [], None, {}
    for kind, v in items:
        m = RE_SUBNO.match(v) if kind == 'p' else None
        if m and int(m.group(1)) in nums and int(m.group(1)) not in out:
            cur = int(m.group(1))
            out[cur] = [('p', m.group(2))]
            continue
        (out[cur] if cur is not None else stem).append((kind, v))
    return stem, out


def cut_choices(items):
    """段落の並びから選択肢を切り出す。→ (設問文の段落, [(記号, 本文)])
    ⚠️ ａ〜の並びが揃っている**最後の** run だけを選択肢とみなす（設問文の中の
       「ａ」始まりの文を巻き込まない）。
    ⚠️ 「組合せ」の長い肢は2行に割れる（C15 の ｅ）。ラベルを持たない次の段落は
       直前の肢の続きとして畳む——別の段落として残すと肢が欠ける。
    ⚠️ 選択肢の run より後ろは設問文ではない（図の注記の残り）ので捨てる。"""
    labels = {c: i for i, c in enumerate(ZEN)}
    best = None
    for i in range(len(items)):
        if items[i][0] != 'p':
            continue
        m0 = RE_CHOICE.match(items[i][1])
        if not m0 or m0.group(1) != ZEN[0]:
            continue
        got, want, j = [], 0, i
        while j < len(items) and items[j][0] == 'p':
            m = RE_CHOICE.match(items[j][1])
            if m and labels.get(m.group(1)) == want:
                got.append([m.group(1), m.group(2)])
                want += 1
            elif got and not m and not RE_FIGLABEL.match(items[j][1]):
                got[-1][1] += items[j][1]              # 折り返した肢の続き
            else:
                break
            j += 1
        if len(got) >= 2:
            best = (i, got)
    if not best:
        return items, []
    return items[:best[0]], [(z, t) for z, t in best[1]]


def qt_html(stem, items, decl):
    """設問文を 整形外科式（1文まるごと <strong>）で組む。
    ⚠️ 連問の宣言文の番号は**科目内の通し番号**へ書き換える。紙面の「41、42」を
       そのまま出すと、同じ章に実在する別の Q.41 を指してしまい、study.html の
       SERIES_DECL_RE も uid の番号と噛み合わない（CLAUDE.md「連問」参照）。"""
    parts = []
    if decl:
        parts.append('<span class="kw">' + esc(decl) + '</span>')
    body = [x for x in stem + items if not (x[0] == 'p' and RE_CALC_GRID.match(x[1]))]
    if not body:
        return ''.join(parts)
    # 最後の段落＝問いかけの一文。ここだけ <strong>（整形外科式）。
    last = len(body) - 1
    while last > 0 and body[last][0] != 'p':
        last -= 1
    out = []
    for i, (kind, v) in enumerate(body):
        if kind == 't':
            out.append(v)
        elif i == last:
            out.append('<strong>' + rich(v) + '</strong>')
        else:
            out.append(rich(v))
    html = ''.join(parts)
    for i, p in enumerate(out):
        if (i or html) and not p.startswith('<table'):
            html += '<br/>'
        html += p
    return html


# ── 選択肢考察 ───────────────────────────────────────────────────
def em_html(items, choices, ans):
    """選択肢考察を循環器と同じ <table class="tb"> に組む。
    ⚠️ 禁忌肢の `□` は解説書の印そのもの。落とさずそのまま出す（○/× と並ぶ位置にある）。
    ⚠️ 縦の波括弧でまとめられた2肢は**1行**にする（解説文が1つしか無いので、
       素直に行ごと割ると文が肢 d と肢 e に切り分けられて日本語が壊れる）。"""
    rows, other = [], []
    for kind, v in items:
        if kind == 'g':
            rows.append(([(x[0], x[1]) for x in
                          (RE_LABEL.match(l).groups() for l in v[0])], v[1]))
            continue
        if kind != 'p':
            other.append((kind, v))
            continue
        m = RE_JUDGE.match(v)
        if m:
            rows.append(([(m.group(1), m.group(2))], m.group(3)))
        elif rows:
            rows[-1] = (rows[-1][0], rows[-1][1] + v)
        else:
            other.append((kind, v))
    if not rows:
        return body_html(items)
    txt = {c['z']: c['t'] for c in choices}
    ok = {ZEN['abcde'.index(a)] for a in ans if a in 'abcde'}
    out = '<table class="tb"><tr><th>選択肢</th><th>解説</th></tr>'
    for labs, desc in rows:
        cells = []
        for mark, z in labs:
            # ⚠️⚠️ 緑にするのは「○ の肢」ではなく**正解の肢**。
            #    MEC の ○/× は「その記述が正しいか」であって「これが正解か」ではない
            #    （CLAUDE.md「○/× マーカーは検証に使えない」）。否定形の設問
            #    「〜でないのはどれか」では **× の肢が正解**で、実測68問がそうだった。
            #    印そのものは紙面の事実なので消さず、先頭にそのまま残す。
            cls = 'kw3' if z in ok else ('kw2' if mark == '□' else '')
            cell = rich(mark + ' ' + txt.get(z, z))
            cells.append(('<span class="' + cls + '">' + cell + '</span>') if cls else cell)
        out += '<tr><td>' + '<br/>'.join(cells) + '</td><td>' + rich(desc) + '</td></tr>'
    out += '</table>'
    pre = body_html(other) if other else ''
    return (pre + '<br/>' if pre else '') + out


def ans_sub_of(items, ans):
    """✅ の直下に出す一文＝**正解の肢**についての選択肢考察（2026-09-08 ユーザー裁定）。
    ⚠️⚠️ 「○ の行」ではない。MEC の ○/× は「その記述が正しいか」であって
       「これが正解か」ではないので、否定形の設問では × の行が正解の解説になる
       （実測68問）。⚠️ 複数正解は正解肢の行を全部つなぐ。計算問題は空。"""
    want = {ZEN['abcde'.index(a)] for a in ans if a in 'abcde'}
    got, take = [], False
    for kind, v in items:
        if kind == 'g':
            if any(RE_LABEL.match(l).group(2) in want for l in v[0]):
                got.append(v[1])
            take = False
            continue
        if kind != 'p':
            take = False
            continue
        m = RE_JUDGE.match(v)
        if m:
            take = m.group(2) in want
            if take:
                got.append(m.group(3))
        elif take and got:
            got[-1] += v
    return plain('　'.join(x.strip() for x in got))


# ── 1問ぶんを組む ───────────────────────────────────────────────
def make_card(q, owner, stem, mine, secs, ansline, decl):
    blk, no = q['block'], q['no']
    seq = CH_START[blk] + no - 1
    ch = BLOCKS.index(blk) + 1
    qtext, chs = cut_choices(mine)
    tag = blk + str(no)
    if tag in TABLE_CHOICES:
        # 選択肢が表の2問。表そのものは設問文から外し、単位だけ注記して残す。
        note, vals = TABLE_CHOICES[tag]
        qtext = [x for x in qtext if x[0] != 't'] + [('p', note)]
        chs = list(zip(ZEN, vals))
    ans = q['ans']
    choices = [dict(z=z, t=z + '　' + t, ok=('abcde'[ZEN.index(z)] in ans)) for z, t in chs]

    # 正解ラベル。⚠️ 肢とバイト一致させない（読みやすい表記が正本＝循環器の教訓）が、
    #    模試は肢の文が短いのでそのまま使える。複数正解は「　＋　」でつなぐ（他科目と同じ）。
    if q['type'] == 'calc':
        ans_label = '計算答：' + q['ans'][0]
    else:
        got = [c['t'] for c in choices if c['ok']]
        ans_label = '　＋　'.join(got) if got else (ansline or '')

    eg = []
    for name, items in secs:
        key, cls, h = SEC[name]
        if not items:
            continue
        if key == 'choice':
            if q['type'] == 'calc':
                eg.append(dict(cls='ec', h='🧮 計算', c=body_html(items)))
            else:
                eg.append(dict(cls=cls, h=h, c=em_html(items, choices, ans)))
            continue
        if key == 'cp':
            title = None
            if items and items[0][0] == 'p' and RE_CP_TITLE.match(items[0][1]):
                title = RE_CP_TITLE.match(items[0][1]).group(1)
                items = items[1:]
            eg.append(dict(cls=cls, h='📖 ' + (title or 'check point'), c=body_html(items)))
            continue
        eg.append(dict(cls=cls, h=h, c=body_html(
            items, (lambda n: '%s/%s_%d.jpeg' % (EXDIR, owner, n)) if key == 'img' else None)))

    imgs = []
    for i, _f in enumerate(q.get('fig') or []):
        p = '%s/%s_%d.jpeg' % (IMGDIR, owner, i + 1)
        if not os.path.exists(p):
            die('%s%d の図が無い: %s' % (blk, no, p))
        imgs.append(p)

    badges = [dict(cls='bb', t='%s問題 %d' % (blk, no))]
    if blk in HISSHU:
        badges.append(dict(cls='bh', t='必修'))
    badges.append(dict(cls='bip', t='一般') if q['cat'] == '一般' else dict(cls='brn', t='臨床'))
    if q.get('cat2'):
        badges.append(dict(cls='bsub', t=q['cat2']))
    if q.get('pick', 1) > 1:
        badges.append(dict(cls='bm', t='%d択' % q['pick']))
    if q['type'] == 'calc':
        badges.append(dict(cls='bk', t='計算'))
    if imgs:
        badges.append(dict(cls='bi', t='📷 画像'))

    return dict(
        uid='%s_ch%02d_q%d' % (SID, ch, seq), qn='Q.%d' % seq, episode='',
        rate=-1, rate_cls='', rate_text='', badges=badges,
        qt=qt_html(stem, qtext, decl),
        choices=[dict(t=c['t'], ok=c['ok']) for c in choices],
        ans_label=ans_label,
        ans_sub='' if q['type'] == 'calc' else ans_sub_of(dict(secs).get('選択肢考察', []), ans),
        eg=eg, imgs=imgs)


def build_group(doc, members):
    """連問の1群（単問なら1問）ぶんのカードを作る。"""
    head = members[0]
    nums = [m['no'] for m in members]
    segs = collect(doc, head['pdf'])
    qregion = blocks_of(segs[0][1])
    stem, per = split_members(qregion, nums)
    miss = [n for n in nums if n not in per]
    if miss:
        die('%s%s の設問領域を割れない（%s が見つからない）'
            % (head['block'], nums, miss))

    # 「正解：…」を全セクションから抜く（ans_label の材料であって解説ではない）
    ansline, sections = '', []
    for name, lines in segs[1:]:
        items = []
        for kind, v in blocks_of(lines):
            m = RE_ANS.match(v) if kind == 'p' else None
            if m:
                ansline = m.group(1)
                continue
            items.append((kind, v))
        sections.append((name, items))

    # 連問は選択肢考察だけがサブ設問ごとに割れる。ほかの5つは群に1つ＝**兄弟全員に配る**
    # （2026-09-08 ユーザー裁定。SRS は兄弟が揃って出るとは限らないので、
    #  2問目だけ出た日に解説が空にならないようにする）。
    per_choice = {}
    for i, (name, items) in enumerate(sections):
        if name != '選択肢考察' or len(nums) == 1:
            continue
        cur, buf = None, {}
        for kind, v in items:
            m = re.fullmatch(r'(\d+)', v.strip()) if kind == 'p' else None
            if m and int(m.group(1)) in nums:
                cur = int(m.group(1))
                buf[cur] = []
                continue
            if cur is not None:
                buf[cur].append((kind, v))
        if len(buf) == len(nums):
            per_choice = buf
        sections[i] = (name, items)

    decl = ''
    if len(nums) > 1:
        lo = CH_START[head['block']] + nums[0] - 1
        hi = CH_START[head['block']] + nums[-1] - 1
        decl = '次の文を読み、Q.%d〜Q.%d の問いに答えよ。' % (lo, hi)

    owner = head['block'] + str(head['no'])
    out = []
    for m in members:
        secs = [(n, per_choice.get(m['no'], it) if (n == '選択肢考察' and per_choice) else it)
                for n, it in sections]
        st = [x for x in stem if not (x[0] == 'p' and x[1].startswith('次の文を読み'))]
        out.append(make_card(m, owner, st, per[m['no']], secs, ansline, decl))
    return out


# ── 全体 ────────────────────────────────────────────────────────
def build(blocks):
    global CH_START, DOC
    doc = DOC = fitz.open(PDF)
    M = load_mock()
    CH_START, n = {}, 1
    for b in BLOCKS:
        CH_START[b] = n
        n += M['blocks'][b]['count']
    qs = M['questions']
    chapters = []
    for blk in blocks:
        bq = [q for q in qs if q['block'] == blk]
        done, cards = set(), []
        for q in bq:
            if q['no'] in done:
                continue
            fam = [x for x in bq if x['series'] and x['series'] == q['series']] if q['series'] else [q]
            for x in fam:
                done.add(x['no'])
            cards += build_group(doc, fam)
        cards.sort(key=lambda c: int(c['uid'].split('_q')[1]))
        chapters.append(dict(title=CH_TITLE[blk], qs=cards))
    return chapters


def apply_overrides(chapters, strict=True):
    """手書きの解説を最後にかぶせる（PDF からの再生成で消えないように）。
    キーは uid。値は questions の項目名（ans_sub / eg / qt …）を差し替える。"""
    if not os.path.exists(OVERRIDES):
        return 0
    ov = json.load(io.open(OVERRIDES, encoding='utf-8'))
    n = 0
    by = {q['uid']: q for ch in chapters for q in ch['qs']}
    for uid, patch in ov.items():
        if uid.startswith('_'):
            continue
        if uid not in by:
            if not strict:
                continue                                 # --block では他章ぶんを飛ばす
            die('overrides に未知の uid: %s' % uid)
        by[uid].update(patch)
        n += 1
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--block')
    ap.add_argument('--dump')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--figs', action='store_true',
                    help='画像診断の図を 夏メック模試/images/ex/ へ書き出す')
    a = ap.parse_args()
    global WRITE_FIGS
    WRITE_FIGS = a.figs

    if a.dump:
        blk = re.match(r'([A-F])(\d+)', a.dump).group(1)
        chapters = build([blk])
        M = load_mock()
        q = [x for x in M['questions'] if x['block'] + str(x['no']) == a.dump][0]
        seq = CH_START[blk] + q['no'] - 1
        uid = '%s_ch%02d_q%d' % (SID, BLOCKS.index(blk) + 1, seq)
        card = [c for c in chapters[0]['qs'] if c['uid'] == uid][0]
        print(json.dumps(card, ensure_ascii=False, indent=1))
        return

    blocks = [a.block] if a.block else list(BLOCKS)
    chapters = build(blocks)
    tot = sum(len(c['qs']) for c in chapters)
    for c in chapters:
        n = len(c['qs'])
        img = sum(1 for q in c['qs'] if q['imgs'])
        print('  %-22s %3d問（画像%2d問・連問%2d問）'
              % (c['title'], n, img,
                 sum(1 for q in c['qs'] if '次の文を読み' in q['qt'])))
    # ⚠️ 上書きを当ててから検算すること（手書きの側が壊れていても気づけるように）。
    n = apply_overrides(chapters, strict=not a.block)
    print('手書きの上書き %d問（%s）' % (n, OVERRIDES))
    verify(chapters)
    if a.block:
        print('--block は書き出さない（%d問を検算しただけ）' % tot)
        return
    data = dict(sid=SID, chapters=chapters)
    js = json.dumps(data, ensure_ascii=False, indent=2)
    if a.check:
        cur = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        print('現物と一致' if cur == js else '*** 現物と差分あり')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し %s  %dKB  %d問' % (OUT, os.path.getsize(OUT) // 1024, tot))


def verify(chapters):
    """読み取りが壊れていないことの検算。⚠️ 黙って通さず落とすこと。"""
    err = []
    seen = set()
    for ch in chapters:
        for q in ch['qs']:
            u = q['uid']
            if u in seen:
                err.append('%s: uid が重複' % u)
            seen.add(u)
            if not q['qt'].strip():
                err.append('%s: 設問文が空' % u)
            if not q['ans_label'].strip():
                err.append('%s: 正解ラベルが空' % u)
            calc = q['ans_label'].startswith('計算答')
            if not calc:
                ok = [c for c in q['choices'] if c['ok']]
                if len(q['choices']) < 2:
                    err.append('%s: 選択肢が %d 個' % (u, len(q['choices'])))
                if not ok:
                    err.append('%s: 正解肢(ok)が1つも無い' % u)
                # 「Nつ選べ」＝ok の数（mock_data 側で400問すべて一致済み。ここは移送の検算）
                m = re.search(r'([12345一二三])\s*つ\s*選\s*べ', q['qt'])
                want = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
                        '一': 1, '二': 2, '三': 3}.get(m.group(1)) if m else 1
                if want != len(ok):
                    err.append('%s: 「%dつ選べ」と正解肢 %d が不一致' % (u, want, len(ok)))
            if not q['eg']:
                err.append('%s: 解説ブロックが0個' % u)
            if not any(b['cls'] in ('em', 'ec') for b in q['eg']):
                err.append('%s: 選択肢考察が無い' % u)     # 解説書では全問にある
            if not calc and not q['ans_sub'].strip():
                err.append('%s: ✅の下が空（選択肢考察に ○ の行が無い）' % u)
            m = re.search(r'次の文を読み、Q\.(\d+)〜Q\.(\d+)', q['qt'])
            if m:
                lo, hi = int(m.group(1)), int(m.group(2))
                n = int(u.split('_q')[1])
                if not (lo <= n <= hi) or not (1 <= hi - lo <= 5):
                    err.append('%s: 連問の宣言文 Q.%d〜Q.%d が自分の番号と噛み合わない'
                               % (u, lo, hi))
            for b in q['eg']:
                if b['cls'] not in ('ep', 'ee', 'ept', 'em', 'ec', 'ei'):
                    err.append('%s: 未知の cls %s' % (u, b['cls']))
            if any(b['cls'] == 'bi' for b in q['badges']) != bool(q['imgs']):
                err.append('%s: 📷バッジと imgs が食い違う' % u)
    if err:
        print('*** 検算エラー %d件' % len(err))
        for e in err[:40]:
            print('   ', e)
        sys.exit(1)


if __name__ == '__main__':
    main()
