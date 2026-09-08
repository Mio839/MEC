# -*- coding: utf-8 -*-
"""mock_data/m121s.js を「2026年度 夏メック模試_解説書.pdf」から作り直す。

  python _work/build_mock_m121s.py            書き出す
  python _work/build_mock_m121s.py --check    書き出さず、現物と一致するかだけ見る

⚠️ PDF は .gitignore 済み（MEC問題文pdf/）＝リポジトリには入っていない。手元に PDF が
   無いマシンではこのスクリプトは動かないが、生成物 mock_data/m121s.js は追跡されている
   ので採点ツールは動く。ここは「どうやって作ったか」の正本として残してある。

── 抽出する5つと、その出どころ ────────────────────────────────
  ① 正解・配点区分・禁忌肢の印   … 各ブロックの解答表（p8/178/258/388/564/648）
  ② 科目・出題テーマ・一般/臨床  … 科目別出題内容一覧表（p784-791）
  ③ 設問の在りか（解説書ページ） … 各設問ページ左肩の大きな番号／連問は「41〜42」の帯
  ④ 禁忌肢がどの肢か             … 選択肢考察で禁忌肢だけ ○/× ではなく □ が付く
  ⑤ 必要選択数（「Nつ選べ」）    … 設問文

⚠️ ①と②は独立に「禁忌肢問題はどれか」を持つので、突き合わせて検算している（17問で一致）。
⚠️ ⑤と①も独立に「正解は何個か」を持つので、突き合わせている（400問すべてで一致）。
   どちらかが崩れたら、それは読み取りが壊れた合図なので黙って通さず落とすこと。
"""
import fitz, json, re, sys, collections, io

sys.stdout.reconfigure(encoding='utf-8')

PDF = 'MEC問題文pdf/2026年度 夏メック模試_解説書.pdf'
OUT = 'mock_data/m121s.js'
EXAM = dict(id='m121s', name='第121回 夏メック模試', year=2026, season='夏',
            source='2026年度 夏メック模試_解説書.pdf')

COUNTS = {'A': 75, 'B': 50, 'C': 75, 'D': 75, 'E': 50, 'F': 75}
TOTALS = {'A': 75, 'B': 100, 'C': 75, 'D': 75, 'E': 100, 'F': 75}
HISSHU = {'B', 'E'}                       # 必修ブロック（臨床が3点）
KEY_PAGE = {'A': 7, 'B': 177, 'C': 257, 'D': 387, 'E': 563, 'F': 647}   # 0-origin
META_PAGES = range(783, 791)              # 科目別出題内容一覧表
LAST_Q_PAGE = 772                         # 出題内容一覧表の手前まで

# 解答表の列。A/C/D/F は3列、B/E（必修・50問）は2列で x が違う。
COLS3 = [dict(taboo=(55, 70), num=(70, 95), ans=(105, 142)),
         dict(taboo=(192, 207), num=(207, 232), ans=(243, 280)),
         dict(taboo=(330, 345), num=(345, 370), ans=(381, 417))]
COLS2 = [dict(taboo=(128, 142), num=(142, 167), ans=(177, 216)),
         dict(taboo=(265, 279), num=(279, 304), ans=(314, 353))]
LAYOUT = {'A': COLS3, 'B': COLS2, 'C': COLS3, 'D': COLS3, 'E': COLS2, 'F': COLS3}

# 科目別出題内容一覧表の列。⚠️ 見開きでページごとに左右へずれるので x_offset で基準を合わせる。
META_CUTS = dict(cat1=(20, 70), cat2=(70, 130), blk=(135, 155), no=(155, 177),
                 kind=(177, 196), taboo=(196, 213), gl=(213, 269), theme=(269, 520))

ZEN = 'ａｂｃｄｅ'
NUM_JA = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '一': 1, '二': 2, '三': 3}
RE_BETSU = re.compile(r'別冊\s*No\.\s*(\d+)\s*([A-Z])?')   # 図が複数だと英字の枝番が付く
RE_PICK = re.compile(r'([12345一二三])\s*つ\s*選\s*べ')     # 「2 つ選\nべ。」と割れる紙面がある
STOP = re.compile(r'出題ポイント|鑑別診断への|選択肢考察|確\s*定\s*診\s*断|check point')


# ── 共通 ────────────────────────────────────────────────────
def rows_of(page, tol):
    """語を y でクラスタリングして行にする。"""
    ws = [w for w in page.get_text('words') if w[4].strip()]
    ws.sort(key=lambda w: ((w[1] + w[3]) / 2, w[0]))
    rows, cur, cy = [], [], None
    for w in ws:
        y = (w[1] + w[3]) / 2
        if cy is None or abs(y - cy) <= tol:
            cur.append(w)
            cy = y if cy is None else cy
        else:
            rows.append(cur)
            cur, cy = [w], y
    if cur:
        rows.append(cur)
    return rows


def cell(row, lo, hi):
    g = sorted([w for w in row if lo <= (w[0] + w[2]) / 2 < hi], key=lambda w: w[0])
    return ''.join(w[4] for w in g).strip()


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── ① 解答表 ────────────────────────────────────────────────
def read_answers(d):
    """{'A': {'10': {'ans':'b,e','taboo':False}, '74①': {...}}, ...}"""
    out = {}
    for blk, pno in KEY_PAGE.items():
        cells = {}
        for row in rows_of(d[pno], 6.0):
            for c in LAYOUT[blk]:
                num = cell(row, *c['num'])
                m = re.fullmatch(r'(\d+)([①②③④⑤])?', num)
                if not m:
                    continue
                cells[num] = dict(no=int(m.group(1)), sub=m.group(2),
                                  ans=cell(row, *c['ans']),
                                  taboo='禁' in cell(row, *c['taboo']))
        out[blk] = cells
    return out


# ── ② 科目別出題内容一覧表 ──────────────────────────────────
def x_offset(page):
    for w in page.get_text('words'):
        if w[4].strip() == 'A～F':
            return w[0] - 139.0
    return 0.0


def read_meta(d):
    out = {}
    for p in META_PAGES:
        dx = x_offset(d[p])
        for row in rows_of(d[p], 4.0):
            r = {k: cell(row, v[0] + dx, v[1] + dx) for k, v in META_CUTS.items()}
            if not re.fullmatch(r'[A-F]', r['blk']) or not r['no'].isdigit():
                continue
            out[(r['blk'], int(r['no']))] = dict(
                cat1=r['cat1'], cat2=r['cat2'], kind=r['kind'], taboo='禁' in r['taboo'],
                gl=re.sub(r'\s+', '', r['gl']), theme=r['theme'])
    return out


# ── ③ 設問の在りか ──────────────────────────────────────────
def qnums_on(page):
    """左肩の設問番号。単問は '41'（y≒54）、連問は '41～42'（y≒65）。右端が x≒97.8 で揃う。"""
    for w in page.get_text('words'):
        cy = (w[1] + w[3]) / 2
        if not (95 < w[2] < 100 and 50 < cy < 70):
            continue
        t = w[4].strip()
        if re.fullmatch(r'\d+', t):
            return [int(t)], None
        m = re.fullmatch(r'(\d+)～(\d+)', t)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            return list(range(a, b + 1)), '%d-%d' % (a, b)
    return None, None


def read_pages(d):
    order = sorted(KEY_PAGE.items(), key=lambda kv: kv[1])
    idx = {}
    for i, (blk, start) in enumerate(order):
        stop = order[i + 1][1] if i + 1 < len(order) else LAST_Q_PAGE
        seen, groups = {}, {}
        for p in range(start + 1, stop):
            nums, grp = qnums_on(d[p])
            if not nums:
                continue
            for n in nums:
                if n in seen:
                    die('%s%d の設問番号が2ページに出た（p%d と p%d）' % (blk, n, seen[n], p + 1))
                seen[n] = p + 1
                if grp:
                    groups[n] = blk + grp
        miss = [n for n in range(1, COUNTS[blk] + 1) if n not in seen]
        if miss:
            die('%s の設問ページが見つからない: %s' % (blk, miss))
        starts = sorted(set(seen.values()))
        nxt = {s: (starts[j + 1] - 1 if j + 1 < len(starts) else stop)
               for j, s in enumerate(starts)}
        for n, p in seen.items():
            idx[(blk, n)] = dict(pages=[p, nxt[p]], series=groups.get(n))
    return idx


# ── 設問文の切り出し（⑤⑥が使う）────────────────────────────
def qtext(d, no, pages, series):
    a, b = pages
    txt = '\n'.join(d[p].get_text() for p in range(a - 1, b))
    if series:
        # 連問は1ページに複数の設問が並ぶので、行頭の「64　」で切り出す。
        # ⚠️ 区切りは全角スペース（U+3000）だけを見ること。半角も許すと症例文の書き出し
        #    「66 歳の男性。」が設問番号に見えて、ステムが1行目で切れる。
        m = re.search(r'^' + str(no) + r'　', txt, re.M)
        if not m:
            return ''
        txt = txt[m.end():]
        m2 = re.search(r'^' + str(no + 1) + r'　', txt, re.M)
        if m2:
            txt = txt[:m2.start()]
    return STOP.split(txt)[0]


def series_stem(d, page):
    """連問の共通ステム（グループ先頭ページの、最初の設問番号が現れるまで）。
    ⚠️ 区切りは全角スペース（U+3000）だけ。半角も許すと「66 歳の男性。」で切れて、
       ステムが参照する図（別冊No.）を丸ごと取り落とす。
    ⚠️ そのページに設問番号が無い＝ステムだけのページなら、全部がステム。"""
    tail = d[page - 1].get_text().split('次の文を読み')[-1]
    m = re.search(r'^\d+　', tail, re.M)
    return tail[:m.start()] if m else tail


# ── ④ どの肢が禁忌肢か ──────────────────────────────────────
def read_taboo_choices(d, pages):
    a, b = pages
    hits = []
    for p in range(a - 1, b):
        for m in re.finditer(r'□\s*([' + ZEN + r'])', d[p].get_text()):
            hits.append('abcde'[ZEN.index(m.group(1))])
    return sorted(set(hits))


# ── 組み立て ────────────────────────────────────────────────
def build():
    d = fitz.open(PDF)
    A, META, PAGE = read_answers(d), read_meta(d), read_pages(d)

    if len(META) != 400:
        die('科目別一覧表から取れたのが %d 行（400 のはず）' % len(META))

    qs = []
    for blk in 'ABCDEF':
        cells = A[blk]
        digits = collections.defaultdict(dict)
        for c in cells.values():
            if c['sub']:
                digits[c['no']][c['sub']] = c['ans']
        for no in range(1, COUNTS[blk] + 1):
            m = META.get((blk, no)) or die('%s%d が科目別一覧表に無い' % (blk, no))
            pg = PAGE[(blk, no)]
            gen = (m['kind'] == '一')
            q = dict(uid='%s_%s_q%d' % (EXAM['id'], blk, no), block=blk, no=no,
                     kind=m['kind'], cat='一般' if gen else '臨床',
                     pts=1 if gen else (3 if blk in HISSHU else 1),
                     cat1=m['cat1'], cat2=m['cat2'], gl=m['gl'], theme=m['theme'],
                     series=pg['series'], pdf=pg['pages'])

            head = qtext(d, no, pg['pages'], pg['series'])
            if no in digits:
                seq = [digits[no][s] for s in '①②③④⑤' if s in digits[no]]
                q['type'] = 'calc'
                q['ans'] = [''.join(seq)]      # 桁文字列が正本（先頭ゼロも意味を持つ）
                q['digits'] = len(seq)
            else:
                q['type'] = 'choice'
                q['ans'] = [x.strip() for x in cells[str(no)]['ans'].split(',') if x.strip()]
                pk = RE_PICK.findall(head)
                q['pick'] = NUM_JA[pk[-1]] if pk else 1

            # 解答表とメタの両方が禁忌肢問題だと言っていること。
            # ⚠️ 桁入力の計算問題は解答表に '74①' の形でしか行が無いので突き合わせの対象外
            #    （そもそも肢が無いので禁忌肢になりえない）。
            if str(no) in cells and cells[str(no)]['taboo'] != m['taboo']:
                die('%s%d の禁忌肢の印が解答表(%s)と一覧表(%s)で食い違う'
                    % (blk, no, cells[str(no)]['taboo'], m['taboo']))
            if m['taboo']:
                if q['type'] == 'calc':
                    die('%s%d は計算問題なのに禁忌肢の印がある' % (blk, no))
                ch = read_taboo_choices(d, pg['pages'])
                if not ch:
                    die('%s%d は禁忌肢問題だが、選択肢考察に □ の肢が無い' % (blk, no))
                q['taboo'] = ch

            # 連問の共通ステムが参照する図は兄弟全員に付ける
            # （study.html の 2026-09-06 規約「ステムの図はそれを表示する兄弟全員に付ける」と同じ）
            if pg['series']:
                head += '\n' + series_stem(d, pg['pages'][0])
            fig = sorted({mm[0] + mm[1] for mm in RE_BETSU.findall(head)},
                         key=lambda x: (int(re.match(r'\d+', x).group()), x))
            if fig:
                q['fig'] = fig                 # 別冊No.（ブロックごとに1から振り直される）
            qs.append(q)

    verify(qs)
    blocks = {b: dict(count=COUNTS[b], total=TOTALS[b], hisshu=(b in HISSHU),
                      ippan=sum(q['pts'] for q in qs if q['block'] == b and q['cat'] == '一般'),
                      rinsho=sum(q['pts'] for q in qs if q['block'] == b and q['cat'] == '臨床'))
              for b in 'ABCDEF'}
    return dict(EXAM, blocks=blocks, questions=qs)


def verify(qs):
    err = []
    for blk in 'ABCDEF':
        bq = [q for q in qs if q['block'] == blk]
        if len(bq) != COUNTS[blk]:
            err.append('%s: 問題数 %d != %d' % (blk, len(bq), COUNTS[blk]))
        s = sum(q['pts'] for q in bq)
        if s != TOTALS[blk]:
            err.append('%s: 配点合計 %d != %d' % (blk, s, TOTALS[blk]))
    for q in qs:
        if q['type'] == 'choice':
            if not q['ans'] or any(a not in 'abcde' for a in q['ans']):
                err.append('%s: 正解が不正 %s' % (q['uid'], q['ans']))
            if len(set(q['ans'])) != len(q['ans']):
                err.append('%s: 正解に重複' % q['uid'])
            if q['ans'] != sorted(q['ans']):
                err.append('%s: 正解が昇順でない' % q['uid'])
            # 設問文の「Nつ選べ」と正解数が食い違ったら、どちらかの読み取りが壊れている
            if q['pick'] != len(q['ans']):
                err.append('%s: 「%dつ選べ」と正解数 %d が不一致'
                           % (q['uid'], q['pick'], len(q['ans'])))
        else:
            if not re.fullmatch(r'\d+', q['ans'][0]):
                err.append('%s: 計算答が不正 %s' % (q['uid'], q['ans']))
            if len(q['ans'][0]) != q['digits']:
                err.append('%s: 桁数が合わない' % q['uid'])
        if q.get('taboo') and set(q['taboo']) & set(q['ans']):
            err.append('%s: 禁忌肢が正解肢と重複 %s / %s' % (q['uid'], q['taboo'], q['ans']))
    if err:
        print('*** 検算エラー')
        for e in err:
            print('   ', e)
        sys.exit(1)


def render(data):
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    return ('// 自動生成 — 編集しないこと（_work/build_mock_m121s.py が作る）\n'
            '// 出典: ' + EXAM['source'] + '\n'
            '//   正解・配点区分・禁忌肢の印 = 各ブロックの解答表／科目・出題テーマ・一般臨床 = 科目別出題内容一覧表\n'
            '//   どの肢が禁忌肢か = 選択肢考察の □ 印／必要選択数 = 設問文の「Nつ選べ」\n'
            '(function(){var d=' + body + ';\n'
            'window.MecMockData=window.MecMockData||{};window.MecMockData[d.id]=d;})();\n')


def main():
    check = '--check' in sys.argv
    data = build()
    js = render(data)
    qs = data['questions']
    print('問題 %d  配点 %s  合計 %d 点'
          % (len(qs), {b: data['blocks'][b]['total'] for b in data['blocks']},
             sum(b['total'] for b in data['blocks'].values())))
    print('禁忌肢問題 %d  計算(桁入力) %d  複数選択 %d  連問 %d群  別冊参照 %d問'
          % (sum(1 for q in qs if q.get('taboo')),
             sum(1 for q in qs if q['type'] == 'calc'),
             sum(1 for q in qs if q.get('pick', 1) > 1),
             len({q['series'] for q in qs if q['series']}),
             sum(1 for q in qs if q.get('fig'))))
    if check:
        cur = io.open(OUT, encoding='utf-8', newline='').read()
        print('現物と一致' if cur == js else '*** 現物と差分あり（書き出すには --check を外す）')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し ' + OUT + '  ' + str(len(js)) + ' bytes')


if __name__ == '__main__':
    main()
