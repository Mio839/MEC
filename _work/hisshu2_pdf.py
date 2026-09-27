# -*- coding: utf-8 -*-
"""必修講座Part2（hisshu2）の PDF 読み取り。

  python _work/hisshu2_pdf.py anstable   巻末「解答」表 → _work/hisshu2_anstable.json
  python _work/hisshu2_pdf.py parse      問題ページ → _work/hisshu2_parsed.json（生成器の材料）
  python _work/hisshu2_pdf.py render P [dpi]   ページ P を scratch へ PNG で描画

版面（MEC必修講座Part2・99ページ）:
  - Part1 と同じ組版（本文 x≈67・「現病歴：」の見出し x≈58・右端 x>555 に縦書きの A/B/C 見出し）。
    行を読む関数（page_lines / merged_lines）は hisshu_pdf.py のものをそのまま使う。
  - Part1 と違い、**A問題・B問題・C問題の3ブロック（各60問）で NO. が 1 から振り直される**。
    レジュメは無く、問題だけが並ぶ。各ブロックの 51〜60 は連問（2問ずつ5組）。
  - 巻末 p.94〜98 が解答表（NO./解答/国試番号/中小項目/出題テーマ/疾患名/一般/臨床）。
    列の座標は Part1 と同じなので hisshu_pdf._col を使う。
  - 以下「seq」＝ 3ブロックを通した連番（A1=1 … C60=180）。uid と表示番号はこれを使う。
"""
import io, json, os, re, sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hisshu_pdf as H                                        # noqa: E402

PDF = 'MEC問題文pdf/MEC必修講座Part2（表紙2026）.pdf'
ANSTABLE = '_work/hisshu2_anstable.json'
PARSED = '_work/hisshu2_parsed.json'
ANS_PAGES = range(94, 99)            # 1始まり
BODY_PAGES = range(17, 94)
BLOCKS = 'ABC'
KID = H.KID
FW = H.FW


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── 解答表 ──────────────────────────────────────────────────────
BLOCK_HEAD = re.compile(r'^\s*\d\s*([ABC])\s*問題\s*$')


def cmd_anstable():
    doc = fitz.open(PDF)
    rows = []
    block = None
    for pn in ANS_PAGES:
        page = doc[pn - 1]
        off = H._page_offset(page)
        chars = []
        for b in page.get_text('rawdict')['blocks']:
            for ln in b.get('lines', []):
                for sp in ln['spans']:
                    for c in sp['chars']:
                        x0, y0, x1, y1 = c['bbox']
                        chars.append(((x0 + x1) / 2 - off, (y0 + y1) / 2, c['c'], x0 - off))
        lines = {}
        for cx, cy, ch, x0 in chars:
            lines.setdefault(round(cy), []).append((x0, ch))
        # 行の並び（y 順）の中に「1 A問題」の見出しとアンカー（NO 列の数字）が交互に現れる
        seq = []
        heads = []
        for y, cs in sorted(lines.items()):
            s = ''.join(ch for _, ch in sorted(cs)).replace('　', ' ')
            m = BLOCK_HEAD.match(s)
            if m:
                heads.append(y)
                seq.append((y, 'head', m.group(1)))
                continue
            no = ''.join(ch for x0, ch in sorted(cs) if x0 < 62 and ch.isdigit())
            if no and y > 105:
                seq.append((y, 'row', int(no)))
        anchors = []
        for y, kind, v in seq:
            if kind == 'head':
                block = v
            else:
                if block is None:
                    die('p%d: ブロック見出しより前に行がある' % pn)
                anchors.append((y, v, block))
        if not anchors:
            continue
        cells = {(b, no): {} for _, no, b in anchors}
        kidl = {}
        for cx, cy, ch, x0 in chars:
            if H._col(x0) == 'kid' and 105 < cy < 800 and not any(abs(cy - h) < 4 for h in heads):
                kidl.setdefault(round(cy), []).append((x0, ch))
        kidlines = [(y, ''.join(c for _, c in sorted(v))) for y, v in sorted(kidl.items())]
        kid_tokens = [(y, s) for y, s in kidlines if re.search(KID, s)]
        if len(kid_tokens) != len(anchors):
            die('p%d: 国試番号 %d個 ≠ 行 %d' % (pn, len(kid_tokens), len(anchors)))
        kid_of = {}
        for (ky, ks), (ay, no, b) in zip(kid_tokens, anchors):
            kid_of[(b, no)] = [ks]
        for y, s in kidlines:
            if re.search(KID, s):
                continue
            prev = [(ky, (b, no)) for (ky, _), (_, no, b) in zip(kid_tokens, anchors) if ky < y]
            kid_of[prev[-1][1]].append(s)
        for cx, cy, ch, x0 in chars:
            if cy < 105 or cy > 800 or any(abs(cy - h) < 4 for h in heads):
                continue
            col = H._col(x0)
            if col in ('no', 'kid'):
                continue
            y, no, b = min(anchors, key=lambda a: abs(a[0] - cy))
            cells[(b, no)].setdefault(col, []).append((round(cy), x0, ch))
        for k, ls in kid_of.items():
            cells[k]['kid'] = [(i, 0, s) for i, s in enumerate(ls)]
        for y, no, b in anchors:
            c = cells[(b, no)]

            def txt(col):
                cs = sorted(c.get(col, []))
                return ''.join(ch for _, _, ch in cs).strip()
            kidraw = txt('kid')
            m = re.search(KID, kidraw)
            if not m:
                die('解答表 %s%d: 国試番号が読めない %r' % (b, no, kidraw))
            ansraw = txt('ans').replace(' ', '').replace('　', '').translate(
                str.maketrans(FW, 'abcdefghi'))
            either = 'or' in ansraw
            ans = ','.join(re.findall(r'[a-i]', ansraw.replace('or', ' ')))
            note = kidraw[m.end():].strip()
            rows.append(dict(
                block=b, no=no, kid=m.group(0), ans=ans, either=either, note=note,
                excluded=('採点除外' in note and '不正解者のみ' not in note),
                guide=txt('guide'), theme=txt('theme'),
                disease='' if txt('dis') in ('－', '-', '') else txt('dis'),
                ippan='○' in txt('ippan'), rinsho='○' in txt('rinsho'),
                page=pn))
    rows.sort(key=lambda r: (BLOCKS.index(r['block']), r['no']))
    for b in BLOCKS:
        nos = [r['no'] for r in rows if r['block'] == b]
        if nos != list(range(1, len(nos) + 1)) or not nos:
            die('解答表 %s問題の NO. が連番でない: %s' % (b, nos))
    for i, r in enumerate(rows, 1):
        r['seq'] = i
    bad = [(r['block'], r['no']) for r in rows if not re.fullmatch(r'[a-i](,[a-i])*', r['ans'])]
    if bad:
        die('解答が読めない: %s' % bad)
    bad = [(r['block'], r['no']) for r in rows if r['ippan'] == r['rinsho']]
    if bad:
        die('一般/臨床がちょうど1つでない: %s' % bad)
    data = dict(pdf=PDF, rows=rows)
    io.open(ANSTABLE, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(data, ensure_ascii=False, indent=1))
    print('解答表 %d行 → %s' % (len(rows), ANSTABLE))
    for b in BLOCKS:
        print('  %s問題 %d問' % (b, sum(1 for r in rows if r['block'] == b)))
    print('  採点除外:', [(r['block'], r['no']) for r in rows if r['excluded']])
    print('  複数解答:', [(r['block'], r['no'], r['ans'], 'or' if r['either'] else 'and')
                      for r in rows if ',' in r['ans']])
    print('  注記:', [(r['block'], r['no'], r['note']) for r in rows if r['note']])
    print('  一般/臨床: %d / %d' % (sum(r['ippan'] for r in rows), sum(r['rinsho'] for r in rows)))


# ── 問題ページ ───────────────────────────────────────────────────
HDR = H.HDR
SERIES = H.SERIES
CHOICE_START = H.CHOICE_START
CHOICE_SPLIT = H.CHOICE_SPLIT
PAGE_BLOCK = re.compile(r'([ABC])問題$')


def cmd_parse():
    # 図の下の A/B ラベルは本文ではない。選択肢と同じ高さに並ぶと肢の末尾にタブで付き、
    # 表の選択肢と誤認される（B55「心室ペーシング	A」）ので、行を読む段階で落とす。
    orig = H.page_lines
    H.page_lines = lambda page: [l for l in orig(page)
                                 if not re.fullmatch(r'[A-EＡ-Ｅ]', l['text'].strip())]
    doc = fitz.open(PDF)
    probs, series = [], {}
    cur, mode, block = None, None, None
    tails = []
    for pn in BODY_PAGES:
        page = doc[pn - 1]
        cur, mode = None, None                      # 問題はページをまたがない（検算で確かめる）
        for ln in H.merged_lines(page):
            y0, x0 = ln['y0'], ln['x0']
            s = ln['text'].rstrip()
            st = s.strip()
            uni = ln['uni'].strip()
            m = PAGE_BLOCK.search(st.replace('\t', ''))
            if m and y0 < 90 and len(st) < 12:      # ブロックの扉「1 A問題」
                block = m.group(1)
                cur, mode = None, None
                continue
            if st == '□□□':
                cur, mode = None, 'wait'
                continue
            m = HDR.match(st)
            if m:
                no = int(m.group(1))
                cur = dict(block=block, no=no, kid=m.group(2), page=pn, y=y0,
                           qt=[], choices=[], series=None)
                sid = [k for k, v in series.items() if v['block'] == block and no in v['nos']]
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
                key = '%sS%d' % (block, nos[0])
                series[key] = dict(block=block, nos=nos, page=pn, y=y0, decl=st, stem=[])
                cur = series[key]
                mode = 'stem'
                continue
            if cur is None:
                continue
            if mode == 'stem':
                cur['stem'].append((y0, x0, s, ln['html'].rstrip(), ln['x1']))
                continue
            if CHOICE_START.match(st) and mode in ('qt', 'ch'):
                parts = CHOICE_SPLIT.split(uni)[1:]
                for i in range(0, len(parts), 2):
                    body = parts[i + 1].strip('\t 　')
                    cur['choices'].append([parts[i], body])
                    if '\t' in body:
                        cur['table'] = True
                cur['last_y'] = y0
                mode = 'ch'
                continue
            if mode == 'qt':
                cur['qt'].append((y0, x0, s, ln['html'].rstrip(), ln['x1']))
            elif mode == 'ch':
                if x0 >= 76 and cur['choices'] and y0 - cur['last_y'] < 20:
                    cur['choices'][-1][1] += uni
                    cur['last_y'] = y0
                else:
                    tails.append((pn, '%s%d' % (cur['block'], cur['no']), st))
    for p in probs:
        p['qt'] = [list(r) for r in p['qt']]
    for v in series.values():
        v['stem'] = [list(r) for r in v['stem']]
    at = {(r['block'], r['no']): r for r in json.load(io.open(ANSTABLE, encoding='utf-8'))['rows']}
    for p in probs:
        r = at.get((p['block'], p['no']))
        p['seq'] = r['seq'] if r else None
    data = dict(problems=probs, series=series, tails=tails)
    io.open(PARSED, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(data, ensure_ascii=False, indent=1))
    print('問題 %d・連問 %d → %s' % (len(probs), len(series), PARSED))
    # ── 検算 ──
    err = []
    keys = [(p['block'], p['no']) for p in probs]
    if sorted(keys) != sorted(at) or len(keys) != len(set(keys)):
        err.append('問題の集合が解答表と一致しない（欠け %s／余り %s）'
                   % (sorted(set(at) - set(keys))[:20], sorted(set(keys) - set(at))[:20]))
    for p in probs:
        r = at.get((p['block'], p['no']))
        tag = '%s%d' % (p['block'], p['no'])
        if not r:
            continue
        if r['kid'] != p['kid']:
            err.append('%s: 国試番号 本文%s ≠ 解答表%s' % (tag, p['kid'], r['kid']))
        letters = [c[0] for c in p['choices']]
        if letters != list(FW[:len(letters)]) or len(letters) < 2:
            err.append('%s p%d: 選択肢の並び %s' % (tag, p['page'], ''.join(letters)))
        if not p['qt'] and not p['series']:
            err.append('%s p%d: 設問文が空' % (tag, p['page']))
        for a in (r['ans'].split(',') if r['ans'] else []):
            if FW['abcdefghi'.index(a)] not in letters:
                err.append('%s: 正解 %s が選択肢に無い' % (tag, a))
        if p.get('table'):
            err.append('%s p%d: 選択肢が表（TABLE_CHOICES に書き起こす）' % (tag, p['page']))
    for t in tails:
        err.append('選択肢の後ろに残った行 p%d %s: %s' % t)
    for e in err:
        print('   ', e)
    print('検算 %d件' % len(err))


def cmd_render(pn, dpi=200):
    scratch = os.environ.get('SCRATCH', '.')
    doc = fitz.open(PDF)
    out = os.path.join(scratch, 'hs2_p%d_%d.png' % (pn, dpi))
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
