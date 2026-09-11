# -*- coding: utf-8 -*-
"""必修講座（hisshu）の PDF 読み取り。

  python _work/hisshu_pdf.py anstable   巻末「解答」表 → _work/hisshu_anstable.json
  python _work/hisshu_pdf.py parse      問題ページ → _work/hisshu_parsed.json（生成器の材料）
  python _work/hisshu_pdf.py render P [dpi]   ページ P を scratch へ PNG で描画

版面（MEC必修講座Part1・266ページ）:
  - 1段組み。右端の縦書き見出し（x>555）とヘッダー（y<45）は本文ではない。
  - 各節は「〔　〕穴埋めのレジュメ（■/◇）」→「□□□ + N. （国試番号）」の問題、の順。
    同じページの上にレジュメ・下に問題が載ることが多い。
  - 連問は「□□□ → 次の文を読み、93 と94 の問いに答えよ。→ 共通ステム → 図 → 93. → 94.」。
  - 巻末 p.242〜250 が解答表（NO./解答/国試番号/中小項目/出題テーマ/疾患名/一般/臨床）。
    ★・CBT・正答率の列は無い。
"""
import io, json, os, re, sys

import fitz

PDF = 'MEC問題文pdf/MEC必修講座Part1（表紙2026）.pdf'
ANSTABLE = '_work/hisshu_anstable.json'
PARSED = '_work/hisshu_parsed.json'
ANS_PAGES = range(242, 251)          # 1始まり
BODY_PAGES = range(18, 242)
SIDEBAR_X = 555
HEADER_Y = 45

KID = r'\d{2,3}[A-I]-\d+'
FW = 'ａｂｃｄｅｆｇｈｉ'


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── 解答表 ──────────────────────────────────────────────────────
# 列の x（p.242 の実測）: NO<62 / 解答 68-90 / 国試番号 95-132 / 中小項目 132-233 /
# 出題テーマ 233-418 / 疾患名 418-518 / 一般 ≈522 / 臨床 ≈539
# ⚠️ 見開きの左右で表全体が約6pxずれる（p.242 は NO. が x=46、p.250 は x=52）。
#    ページごとに「NO.」見出しの x から差分を取り、座標を引いてから列を決める。
def _page_offset(page):
    for w in page.get_text('words'):
        if w[4] == 'NO.' and w[1] < 110:
            return w[0] - 46
    return 0


def _col(x):
    if x < 62:
        return 'no'
    if x < 89:          # ⚠️ 国試番号の下の注記「のみ採点除外」の「の」が x=91 から始まる（NO.287）
        return 'ans'
    if x < 132:
        return 'kid'
    if x < 234:
        return 'guide'
    if x < 417:
        return 'theme'
    if x < 516:
        return 'dis'
    if x < 534:
        return 'ippan'
    return 'rinsho'


def cmd_anstable():
    doc = fitz.open(PDF)
    rows, chapters = [], []
    for pn in ANS_PAGES:
        page = doc[pn - 1]
        off = _page_offset(page)
        chars = []
        for b in page.get_text('rawdict')['blocks']:
            for ln in b.get('lines', []):
                for sp in ln['spans']:
                    for c in sp['chars']:
                        x0, y0, x1, y1 = c['bbox']
                        chars.append(((x0 + x1) / 2 - off, (y0 + y1) / 2, c['c'], x0 - off))
        # 章見出し「　1　大項目1：医師のプロフェッショナリズム」
        lines = {}
        for cx, cy, ch, x0 in chars:
            lines.setdefault(round(cy), []).append((x0, ch))
        heads = []
        for y, cs in sorted(lines.items()):
            s = ''.join(ch for _, ch in sorted(cs)).strip()
            m = re.match(r'^(\d+)\s*大項目(\d+)：(.+)$', s.replace('　', ' ').strip())
            if m:
                heads.append(y)
                chapters.append(dict(n=int(m.group(1)), daikomoku=int(m.group(2)),
                                     title=m.group(3).strip()))
                chapters[-1]['_y'] = (pn, y)
        # 行のアンカー＝NO 列の数字
        anchors = []
        for y, cs in sorted(lines.items()):
            no = ''.join(ch for x0, ch in sorted(cs) if x0 < 62 and ch.isdigit())
            if no and y > 105 and y not in heads:
                anchors.append((y, int(no)))
        if not anchors:
            continue
        cells = {no: {} for _, no in anchors}
        # 国試番号の列だけは「最も近い行」で決めない。注記（※複数の選択肢を正解とする 等）が
        # 3行ぶら下がると国試番号がアンカーより14pxも上に来て、前の行の方が近くなる。
        # 国試番号は1行に必ず1つなので、y 順に並べてアンカーと順番どおりに対にする。
        kidl = {}
        for cx, cy, ch, x0 in chars:
            if _col(x0) == "kid" and 105 < cy < 800 and not any(abs(cy - h) < 4 for h in heads):
                kidl.setdefault(round(cy), []).append((x0, ch))
        kidlines = [(y, ''.join(c for _, c in sorted(v))) for y, v in sorted(kidl.items())]
        kid_tokens = [(y, s) for y, s in kidlines if re.search(KID, s)]
        if len(kid_tokens) != len(anchors):
            die('p%d: 国試番号 %d個 ≠ 行 %d' % (pn, len(kid_tokens), len(anchors)))
        kid_of = {}
        for (ky, ks), (ay, no) in zip(kid_tokens, anchors):
            kid_of[no] = [ks]
        for y, s in kidlines:
            if re.search(KID, s):
                continue
            prev = [(ky, no) for (ky, _), (_, no) in zip(kid_tokens, anchors) if ky < y]
            kid_of[prev[-1][1]].append(s)            # 注記は直前の国試番号の下に続く
        for cx, cy, ch, x0 in chars:
            if cy < 105 or any(abs(cy - h) < 4 for h in heads):
                continue
            if cy > 800:
                continue
            col = _col(x0)
            if col in ('no', 'kid'):
                continue
            # 最も近いアンカーへ（出題テーマ・疾患名は高々2行でアンカーの上下に収まる）
            y, no = min(anchors, key=lambda a: abs(a[0] - cy))
            cells[no].setdefault(col, []).append((round(cy), x0, ch))
        for no, ls in kid_of.items():
            cells[no]['kid'] = [(i, 0, s) for i, s in enumerate(ls)]
        for y, no in anchors:
            c = cells[no]

            def txt(col):
                cs = sorted(c.get(col, []))
                return ''.join(ch for _, _, ch in cs).strip()
            kidraw = txt('kid')
            m = re.search(KID, kidraw)
            if not m:
                die('解答表 NO.%d: 国試番号が読めない %r' % (no, kidraw))
            # 解答は「d」「a, c」のほか「a or c」（どちらも正解として採点）がある
            # ⚠️ NO.37 だけ解答が全角「ｂ」で組まれている
            ansraw = txt('ans').replace(' ', '').replace('　', '').translate(
                str.maketrans(FW, 'abcdefghi'))
            either = 'or' in ansraw
            ans = ','.join(re.findall(r'[a-i]', ansraw.replace('or', ' ')))
            note = kidraw[m.end():].strip()
            rows.append(dict(
                no=no, kid=m.group(0), ans=ans, either=either, note=note,
                excluded=('採点除外' in note and '不正解者のみ' not in note),
                guide=txt('guide'), theme=txt('theme'),
                disease='' if txt('dis') in ('－', '-', '') else txt('dis'),
                ippan='○' in txt('ippan'), rinsho='○' in txt('rinsho'),
                page=pn))
    rows.sort(key=lambda r: r['no'])
    nos = [r['no'] for r in rows]
    if nos != list(range(1, len(rows) + 1)):
        die('解答表の NO. が連番でない')
    for ch in chapters:
        ch.pop('_y')
    _assign_chapter_starts(doc, rows, chapters)
    bad = [r['no'] for r in rows if not re.fullmatch(r'[a-i](,[a-i])*', r['ans'])]
    if bad:
        die('解答が読めない NO.: %s' % bad)
    bad = [r['no'] for r in rows if r['ippan'] == r['rinsho']]
    if bad:
        die('一般/臨床がちょうど1つでない NO.: %s' % bad)
    data = dict(pdf=PDF, chapters=chapters, rows=rows)
    io.open(ANSTABLE, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(data, ensure_ascii=False, indent=1))
    print('解答表 %d行・%d章 → %s' % (len(rows), len(chapters), ANSTABLE))
    for ch in chapters:
        print('  第%2d章（大項目%2d）NO.%3d〜  %s' % (ch['n'], ch['daikomoku'], ch['start'], ch['title']))
    print('  採点除外:', [r['no'] for r in rows if r['excluded']])
    print('  複数解答:', [(r['no'], r['ans'], 'or' if r['either'] else 'and') for r in rows if ',' in r['ans']])
    print('  注記:', [(r['no'], r['note']) for r in rows if r['note']])
    print('  一般/臨床: %d / %d' % (sum(r['ippan'] for r in rows), sum(r['rinsho'] for r in rows)))


def _assign_chapter_starts(doc, rows, chapters):
    """章見出しの y と各行の NO の y を突き合わせ、見出しの直後の行を章頭にする。"""
    seq = []                                   # (page, y, kind, value)
    for pn in ANS_PAGES:
        for w in doc[pn - 1].get_text('words'):
            x0, y0, x1, y1, s = w[:5]
            if x0 < 62 and s.isdigit() and y0 > 105:
                seq.append((pn, y0, 'row', int(s)))
            if '大項目' in s:
                m = re.search(r'大項目(\d+)', s)
                seq.append((pn, y0, 'head', int(m.group(1))))
    seq.sort()
    by_dk = {c['daikomoku']: c for c in chapters}
    pending = None
    for pn, y, kind, v in seq:
        if kind == 'head':
            pending = by_dk[v]
        elif pending is not None:
            pending['start'] = v
            pending = None
    for c in chapters:
        if 'start' not in c:
            die('章頭が決まらない: %s' % c['title'])


# ── 問題ページ ───────────────────────────────────────────────────
SUB_U = str.maketrans('0123456789+-－−', '₀₁₂₃₄₅₆₇₈₉₊₋₋₋')
SUP_U = str.maketrans('0123456789+-－−＋', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁻⁺')


def _esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def underline_rects(page):
    """下線（文字の直下に引かれた細い横線）の候補。表の罫線も混ざるが、
    罫線は文字の直下 3pt 以内には来ないので _is_ul の距離の条件で落ちる。"""
    out = []
    for dr in page.get_drawings():
        r = dr['rect']
        if r.height < 1.5 and 4 < r.width < 440 and r.x0 < SIDEBAR_X:
            out.append(r)
    return out


def _is_ul(ch_bbox, rects):
    x0, y0, x1, y1 = ch_bbox
    cx = (x0 + x1) / 2
    for r in rects:
        if r.x0 - 0.5 <= cx <= r.x1 + 0.5 and y1 - 2.5 <= r.y0 <= y1 + 3:
            return True
    return False


def page_lines(page):
    """本文の行（サイドバー・ヘッダー・ページ番号を除く）を返す。

    1行 = dict(y0, x0, text, html, uni)
      text … 素の文字列
      html … 下付き <sub>・上付き <sup>・下線 <u> を復元したもの（設問文に使う）
      uni  … 下付き・上付きを Unicode（₂ ⁻）へ置き換えたもの（選択肢に使う。選択肢は
             card_renderer.js が esc() で描くのでタグを書けない）
    ⚠️ 下付きの判定は「行の中で一番大きい字の 75% 未満」かつ基線が下がっていないもの。
       SpO2 の「2」は 9.2pt の行の中で 5.5pt・基線は +0.5pt だった（p.203 実測）。"""
    ul = underline_rects(page)
    out = []
    for b in page.get_text('rawdict')['blocks']:
        if b.get('type') != 0:
            continue
        for ln in b['lines']:
            x0, y0, x1, y1 = ln['bbox']
            if x0 >= SIDEBAR_X or y1 < HEADER_Y or y0 > 800:
                continue
            spans = ln['spans']
            if not spans:
                continue
            big = max(sp['size'] for sp in spans)
            base = max((sp['origin'][1] for sp in spans if sp['size'] >= big * 0.75), default=0)
            text, html, uni = [], [], []
            cur_u = False
            for sp in spans:
                small = sp['size'] < big * 0.75
                kind = ('sub' if sp['origin'][1] >= base - 1 else 'sup') if small else None
                s = ''.join(c['c'] for c in sp['chars'])
                text.append(s)
                if kind:
                    uni.append(s.translate(SUB_U if kind == 'sub' else SUP_U))
                else:
                    uni.append(s)
                for c in sp['chars']:
                    u = _is_ul(c['bbox'], ul) and c['c'].strip() != ''
                    if u != cur_u:
                        html.append('<u>' if u else '</u>')
                        cur_u = u
                    e = _esc(c['c'])
                    html.append('<%s>%s</%s>' % (kind, e, kind) if kind else e)
            if cur_u:
                html.append('</u>')
            t = ''.join(text)
            if not t.strip():
                continue
            h = ''.join(html).replace('</sub><sub>', '').replace('</sup><sup>', '').replace('</u><u>', '')
            out.append(dict(y0=round(y0, 1), x0=round(x0, 1), x1=round(x1, 1), text=t, html=h, uni=''.join(uni)))
    out.sort(key=lambda r: (r['y0'], r['x0']))
    return out


def merged_lines(page):
    """同じ高さの行を1行にまとめる（区切りは \\t）。

    ⚠️ 選択肢は「ａ　…\\t ｂ　…」と1行に並ぶことも、記号「ａ」と本文が別々の行として
       同じ高さに並ぶこともある（NO.98・115・167）。y で束ねてから x 順に繋げば両方同じ形になる。
    ⚠️ 上付き・下付き（HCO3⁻ の「－」）は y が 0.4pt ずれるので、束ねる幅は 1.5pt。"""
    rows = []
    for ln in page_lines(page):
        if rows and abs(rows[-1][0] - ln['y0']) <= 1.5:
            rows[-1][1].append(ln)
        else:
            rows.append([ln['y0'], [ln]])
    out = []
    for y0, segs in rows:
        segs.sort(key=lambda l: l['x0'])
        segs = [l for l in segs if l['text'].strip()]

        def j(k):
            s = ''
            for i, l in enumerate(segs):
                v = l[k].strip('\t ')
                # 上付きだけが別の行に分かれていたら（HCO3 と ⁻）区切らずに繋ぐ
                glue = i and (l['uni'].strip()[:1] in '⁺⁻₊₋' or l['html'].startswith('<sup>'))
                s += ('' if not i or glue else '\t') + v
            return s
        out.append(dict(y0=y0, x0=segs[0]['x0'], x1=max(l['x1'] for l in segs),
                        text=j('text'), html=j('html'), uni=j('uni')))
    return out


HDR = re.compile(r'^\s*(\d+)\.\s*（(' + KID + r')）\s*$')
SERIES = re.compile(r'次の文を読み、\s*(\d+)\s*(?:と|、|～|〜)\s*(\d+)(?:\s*(?:と|、)\s*(\d+))?\s*の問いに答えよ')
CHOICE_START = re.compile(r'^[' + FW + r'](?:　|\t| {1,3})')
# 行の中の選択肢の切れ目（行頭か、タブ／空白の直後に来る「ａ　」）
CHOICE_SPLIT = re.compile(r'(?:^|(?<=[\t ]))([' + FW + r'])(?:　|\t| {1,3})')


def cmd_parse():
    doc = fitz.open(PDF)
    probs, series = [], {}
    cur = None          # 今読んでいる問題 or 連問ステム
    mode = None         # 'qt' | 'ch' | 'stem'
    tails = []

    def close():
        nonlocal cur, mode
        cur, mode = None, None

    for pn in BODY_PAGES:
        page = doc[pn - 1]
        close()                                     # 問題はページをまたがない（検算で確かめる）
        for ln in merged_lines(page):
            y0, x0 = ln['y0'], ln['x0']
            s = ln['text'].rstrip()
            st = s.strip()
            uni = ln['uni'].strip()
            if st == '□□□':
                close()
                mode = 'wait'
                continue
            if re.match(r'^■\s*\d+\.', st) or st.startswith('◇'):
                close()
                continue
            m = HDR.match(st)
            if m:
                cur = dict(no=int(m.group(1)), kid=m.group(2), page=pn, y=y0,
                           qt=[], choices=[], series=None)
                sid = [k for k, v in series.items() if int(m.group(1)) in v['nos']]
                if sid:
                    cur['series'] = sid[0]
                probs.append(cur)
                mode = 'qt'
                continue
            m = SERIES.search(st)
            if m and mode in ('wait', None):
                nos = [int(g) for g in m.groups() if g]
                if len(nos) == 2 and nos[1] - nos[0] > 1:
                    nos = list(range(nos[0], nos[1] + 1))
                key = 'S%d' % nos[0]
                series[key] = dict(nos=nos, page=pn, y=y0, decl=st, stem=[])
                cur = series[key]
                mode = 'stem'
                continue
            if cur is None:
                continue
            if mode == 'stem':
                cur['stem'].append((y0, x0, s, ln['html'].rstrip(), ln['x1']))
                continue
            if CHOICE_START.match(st) and mode in ('qt', 'ch'):
                parts = CHOICE_SPLIT.split(uni)[1:]          # [letter, text, letter, text, …]
                for i in range(0, len(parts), 2):
                    body = parts[i + 1].strip('\t 　')
                    cur['choices'].append([parts[i], body])
                    if '\t' in body:
                        cur['table'] = True                  # 記号の後ろにセルが並ぶ＝表の選択肢
                cur['last_y'] = y0
                mode = 'ch'
                continue
            if mode == 'qt':
                cur['qt'].append((y0, x0, s, ln['html'].rstrip(), ln['x1']))
            elif mode == 'ch':
                # 選択肢の折り返し（字下げが選択肢本文の位置）だけ続きとみなす
                if x0 >= 76 and cur['choices'] and y0 - cur['last_y'] < 20:
                    cur['choices'][-1][1] += uni
                    cur['last_y'] = y0
                else:
                    tails.append((pn, cur['no'], st))
    for p in probs:
        p['qt'] = [list(r) for r in p['qt']]
    for k, v in series.items():
        v['stem'] = [list(r) for r in v['stem']]
    data = dict(problems=probs, series=series, tails=tails)
    io.open(PARSED, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(data, ensure_ascii=False, indent=1))
    print('問題 %d・連問 %d → %s' % (len(probs), len(series), PARSED))
    # ── 検算 ──
    at = {r['no']: r for r in json.load(io.open(ANSTABLE, encoding='utf-8'))['rows']}
    err = []
    nos = [p['no'] for p in probs]
    if nos != list(range(1, len(at) + 1)):
        missing = sorted(set(range(1, len(at) + 1)) - set(nos))
        dup = sorted(n for n in set(nos) if nos.count(n) > 1)
        err.append('NO. が連番でない（欠け %s／重複 %s）' % (missing[:20], dup))
    for p in probs:
        r = at.get(p['no'])
        if not r:
            continue
        if r['kid'] != p['kid']:
            err.append('NO.%d: 国試番号 本文%s ≠ 解答表%s' % (p['no'], p['kid'], r['kid']))
        letters = [c[0] for c in p['choices']]
        if letters != list(FW[:len(letters)]) or len(letters) < 2:
            err.append('NO.%d p%d: 選択肢の並び %s' % (p['no'], p['page'], ''.join(letters)))
        if not p['qt'] and not p['series']:
            err.append('NO.%d p%d: 設問文が空' % (p['no'], p['page']))
        for a in (r['ans'].split(',') if r['ans'] else []):
            if 'ａｂｃｄｅｆｇｈｉ'['abcdefghi'.index(a)] not in letters:
                err.append('NO.%d: 正解 %s が選択肢に無い' % (p['no'], a))
    for t in tails:
        err.append('選択肢の後ろに残った行 p%d NO.%d: %s' % t)
    for e in err:
        print('   ', e)
    print('検算 %d件' % len(err))


def cmd_render(pn, dpi=200):
    scratch = os.environ.get('SCRATCH', '.')
    doc = fitz.open(PDF)
    out = os.path.join(scratch, 'hs_p%d_%d.png' % (pn, dpi))
    doc[pn - 1].get_pixmap(dpi=dpi).save(out)
    print(out)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'anstable':
        cmd_anstable()
    elif cmd == 'parse':
        cmd_parse()
    elif cmd == 'render':
        cmd_render(int(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 200)
    else:
        print(__doc__)
