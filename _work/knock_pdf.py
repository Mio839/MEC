# -*- coding: utf-8 -*-
"""1,000本ノック（knock）の PDF を読む。

  python _work/knock_pdf.py anstable   # 巻頭リスト → _work/knock_anstable.json
  python _work/knock_pdf.py parse      # 本文       → _work/knock_parsed.json
  python _work/knock_pdf.py render N   # PDF の N ページ目（1始まり）を scratch に PNG で描く（目視用）

版面（2026-10-01 実測・301ページ）:
  ・1ページ＝見開き（幅 1032pt）。左半分（x<516）が問題、右半分が同じ番号の解説。
  ・p.5〜24 が巻頭リスト（NO.・国試番号・問題頁・解説頁・テーマ・正答率・解答）。
    p.2 はリンク機能の説明の見本（NO.1・2 の行がもう一度出る）なので読まない。
  ・p.25〜29 は国試番号の索引（読まない）。本文は p.30〜301。
  ・問題の見出しは「N.\\t（118F-11）」、解説の見出しは「N.\\t（118F-11）テーマ」＋同じ高さの「解答：d」。
"""
import io, json, os, re, sys, unicodedata

import fitz

PDF = 'MEC問題文pdf/2026年度1,000本ノック.pdf'
ANSTABLE = '_work/knock_anstable.json'
PARSED = '_work/knock_parsed.json'
LIST_PAGES = range(5, 25)            # 1始まり
BODY_PAGES = range(30, 302)
MID_X = 516                          # 見開きの境目
HEADER_Y = 45                        # ページ番号（y≈28）・「メック予備校用」（y≈22）より下
FOOTER_Y = 715
KID = r'\d{3}[A-I]-\d+'
FW = 'ａｂｃｄｅｆｇｈｉ'
ROMAN = 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨ'


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── 行の読み取り ─────────────────────────────────────────────────
SUB_U = str.maketrans('0123456789+-－−', '₀₁₂₃₄₅₆₇₈₉₊₋₋₋')
SUP_U = str.maketrans('0123456789+-－−＋', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁻⁺')


def _esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# 組版の制御文字（BEL など）・ゼロ幅文字（NO.961 の「ｅ」の直後に BEL が入っている）
_CTL = re.compile('[%s]' % ''.join(map(chr, list(range(0, 9)) + list(range(11, 32)) + [0x200b, 0x200c, 0x200d, 0xfeff])))


def _ctl(s):
    return _CTL.sub('', s).replace(chr(0x2002), ' ')   # EN SPACE は空白に


def underline_rects(page, lo, hi):
    out = []
    for dr in page.get_drawings():
        r = dr['rect']
        if r.height < 1.5 and 4 < r.width < 400 and lo <= r.x0 < hi:
            out.append(r)
    return out


def _is_ul(ch_bbox, rects):
    x0, y0, x1, y1 = ch_bbox
    cx = (x0 + x1) / 2
    for r in rects:
        if r.x0 - 0.5 <= cx <= r.x1 + 0.5 and y1 - 2.5 <= r.y0 <= y1 + 3:
            return True
    return False


def page_lines(page, lo, hi, skip=()):
    """x が [lo, hi) にある本文の行。1行 = dict(y0, x0, x1, text, html, uni)。
    hisshu_pdf.page_lines と同じ規則（下付き・上付き・下線の復元）を半ページに絞ったもの。"""
    ul = underline_rects(page, lo, hi)
    out = []
    for b in page.get_text('rawdict')['blocks']:
        if b.get('type') != 0:
            continue
        for ln in b['lines']:
            x0, y0, x1, y1 = ln['bbox']
            if not (lo <= x0 < hi) or y1 < HEADER_Y or y0 > FOOTER_Y:
                continue
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            if any(r[0] - 2 <= cx <= r[2] + 2 and r[1] - 2 <= cy <= r[3] + 2 for r in skip):
                continue                              # 図の中の注記（解説の図の「声門」「総頸動脈」など）
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
                uni.append(s.translate(SUB_U if kind == 'sub' else SUP_U) if kind else s)
                for c in sp['chars']:
                    u = _is_ul(c['bbox'], ul) and c['c'].strip() != ''
                    if u != cur_u:
                        html.append('<u>' if u else '</u>')
                        cur_u = u
                    e = _esc(c['c'])
                    html.append('<%s>%s</%s>' % (kind, e, kind) if kind else e)
            if cur_u:
                html.append('</u>')
            t = _ctl(''.join(text))
            if not t.strip():
                continue
            uni = [_ctl(u) for u in uni]
            h = _ctl(''.join(html)).replace('</sub><sub>', '').replace('</sup><sup>', '').replace('</u><u>', '')
            out.append(dict(y0=round(y0, 1), y1=round(y1, 1), x0=round(x0, 1), x1=round(x1, 1),
                            text=t, html=h, uni=''.join(uni)))
    out.sort(key=lambda r: (r['y0'], r['x0']))
    return out


def merged_lines(page, lo, hi, skip=()):
    """同じ高さ（±1.5pt）の行を1行にまとめる（区切りは \\t）。"""
    rows = []
    for ln in page_lines(page, lo, hi, skip):
        if rows and abs(rows[-1][0] - ln['y0']) <= 1.5:
            rows[-1][1].append(ln)
        else:
            rows.append([ln['y0'], [ln]])
    out = []
    for y0, segs in rows:
        segs.sort(key=lambda l: l['x0'])

        def j(k):
            s = ''
            for i, l in enumerate(segs):
                v = l[k].strip('\t ')
                glue = i and (l['uni'].strip()[:1] in '⁺⁻₊₋' or l['html'].startswith('<sup>'))
                s += ('' if not i or glue else '\t') + v
            return s
        out.append(dict(y0=y0, y1=max(l['y1'] for l in segs), x0=segs[0]['x0'],
                        x1=max(l['x1'] for l in segs), text=j('text'), html=j('html'), uni=j('uni')))
    return out


# ── 巻頭リスト ───────────────────────────────────────────────────
# 列の x（半ページの左端からの相対位置。p.24 の実測）
COLS = [('no', 88, 118), ('kid', 118, 165), ('p1', 165, 196), ('p2', 196, 225),
        ('theme', 225, 398), ('rate', 398, 421), ('ans', 421, 500)]
HEAD_MAJOR = re.compile(r'^[　\s]*([' + ROMAN + r'])[　\s]+(\S.*)$')
HEAD_MID = re.compile(r'^[　\s]*([' + ROMAN + r'])-(\d+)：(.+)$')


def cmd_anstable():
    doc = fitz.open(PDF)
    events = []                                       # (page, half, y, kind, payload)
    for pn in LIST_PAGES:
        page = doc[pn - 1]
        for half in (0, 1):
            lo = half * MID_X
            lines = page_lines(page, lo, lo + MID_X)
            rows = []
            for l in lines:
                rx = l['x0'] - lo
                t = l['text'].strip()
                if rx < 88:
                    if t.startswith('【公衆衛生】'):
                        events.append((pn, half, l['y0'], 'ph', None))
                    elif HEAD_MID.match(t):
                        m = HEAD_MID.match(t)
                        events.append((pn, half, l['y0'], 'mid', '%s-%s：%s' % m.groups()))
                    elif HEAD_MAJOR.match(t) and 'チェック' not in t:
                        m = HEAD_MAJOR.match(t)
                        events.append((pn, half, l['y0'], 'major', '%s　%s' % (m.group(1), m.group(2).strip())))
                    continue
                if 88 <= rx < 118 and re.fullmatch(r'\d{1,3}', t):
                    rows.append(dict(y=l['y0'], cells={'no': [t]}))
            for l in lines:
                rx = l['x0'] - lo
                t = l['text'].strip()
                if rx < 118 or l['y0'] < 70 or t in ('国試NO.', '問題頁解説頁', 'テーマ', '正答率', '解答'):
                    continue
                cands = [r for r in rows if r['y'] <= l['y0'] + 6]
                if not cands:
                    continue
                r = cands[-1]
                col = next((c for c, a, b in COLS if a <= rx < b), None)
                if col is None:
                    die('p%d: 列が決まらない x=%.0f %r' % (pn, rx, t))
                # テーマが2行のとき、2行目は x=228 から始まる（列の判定はそのまま）
                r['cells'].setdefault(col, []).append(t)
            for r in rows:
                events.append((pn, half, r['y'], 'row', r['cells']))
    events.sort(key=lambda e: (e[0], e[1], e[2]))
    out, major, mid, ph = [], None, None, False
    for pn, half, y, kind, p in events:
        if kind == 'ph':
            ph = True
        elif kind == 'major':
            # 大項目の見出しはリストのページ（列）が変わるたびに再掲される＝同じなら中項目を保つ
            # （⽣ ⻑ などの CJK 部首補助で書かれた再掲もあるので NFKC で比べる）
            if major is None or unicodedata.normalize('NFKC', p) != unicodedata.normalize('NFKC', major):
                major, mid = p, None
        elif kind == 'mid':
            mid = p
        else:
            c = p
            for k in ('kid', 'p1', 'p2', 'theme'):
                if k not in c:
                    die('p%d NO.%s: %s が無い' % (pn, c['no'][0], k))
            theme = ''.join(c['theme'])
            if not c.get('rate'):                     # 正答率がテーマの末尾に付いて1つの行で取れることがある（NO.634・942）
                m = re.match(r'^(.*?)(\d{1,3})$', theme)
                if m:
                    theme, c['rate'] = m.group(1), [m.group(2)]
            out.append(dict(no=int(c['no'][0]), kid=c['kid'][0], page=int(c['p1'][0]),
                            theme=theme,
                            rate=int(c['rate'][0]) if c.get('rate') and c['rate'][0].isdigit() else None,
                            ans_raw=' '.join(c.get('ans', [])),
                            major=major, mid=mid, ph=ph))
    nos = [r['no'] for r in out]
    if nos != list(range(1, len(nos) + 1)):
        die('巻頭リストの NO. が連番でない（重複・欠番）: %s' % [n for n in range(1, max(nos) + 1) if nos.count(n) != 1][:20])
    io.open(ANSTABLE, 'w', encoding='utf-8').write(json.dumps(dict(rows=out), ensure_ascii=False, indent=1))
    print('巻頭リスト %d行 → %s' % (len(out), ANSTABLE))


# ── 本文 ────────────────────────────────────────────────────────
QHDR = re.compile(r'^\s*(\d+)\.\s*（(' + KID + r')）\s*$')
EHDR = re.compile(r'^\s*(\d+)\.\s*（(' + KID + r')）\s*(.*?)\s*$')
SECTION = re.compile(r'^[' + ROMAN + r'](?:-\d+：|[　\s])')


# 解説の図のうち、注記・説明文が画像の外にテキストで組まれているもの（ページ → 切り出す範囲）。
# 範囲はページを描画して目で決めた（2026-10-01）。範囲内の文字は解説の本文に入れない。
EX_FIG_CLIP = {
    31: (745, 272, 982, 476),     # NO.6 頸部造影CT（声門・総頸動脈・胸鎖乳突筋・外頸静脈）
    151: (692, 88, 864, 266),     # NO.457 Swan-Ganz カテーテル（図の下の説明文）
    248: (655, 238, 940, 405),    # NO.814 死因別死亡率の推移（死因の名前）
}


def cmd_parse():
    doc = fitz.open(PDF)
    probs, expls, figs = {}, {}, []
    cur_q = cur_e = None
    for pn in BODY_PAGES:
        page = doc[pn - 1]
        imgs = [i['bbox'] for i in page.get_image_info()
                if i['bbox'][2] - i['bbox'][0] >= 20 and i['bbox'][3] - i['bbox'][1] >= 20]
        if pn in EX_FIG_CLIP:
            imgs.append(EX_FIG_CLIP[pn])
        # 左＝問題
        for l in merged_lines(page, 0, MID_X, imgs):
            t = l['text'].strip()
            # 大項目（中央寄せ）・中項目（左端）の見出し
            if SECTION.match(t) and len(t) < 45 and not t.endswith('。'):
                continue
            m = QHDR.match(t.replace('\t', ' '))
            if m:
                no = int(m.group(1))
                if no in probs:
                    die('p%d: 問題 NO.%d が2回出る' % (pn, no))
                cur_q = probs[no] = dict(no=no, kid=m.group(2), page=pn, y=l['y0'], lines=[])
                continue
            if cur_q is None:
                die('p%d: 見出しより前に問題の行 %r' % (pn, t))
            if cur_q['page'] != pn:
                cur_q.setdefault('cont', []).append(pn)
            cur_q['lines'].append([l['y0'], l['x0'], l['text'], l['html'], l['x1'], l['uni']])
        # 右＝解説
        for l in merged_lines(page, MID_X, 2000, imgs):
            t = l['text'].strip()
            m = EHDR.match(t.split('解答：')[0].replace('\t', ' '))
            if m and l['x0'] < MID_X + 65:
                no = int(m.group(1))
                if no in expls:
                    die('p%d: 解説 NO.%d が2回出る' % (pn, no))
                ans = re.search(r'解答：\s*(.*)$', t)
                cur_e = expls[no] = dict(no=no, kid=m.group(2), theme=m.group(3).strip(),
                                         ans=ans.group(1).strip() if ans else None, page=pn, y=l['y0'], lines=[])
                continue
            if cur_e is None:
                die('p%d: 見出しより前に解説の行 %r' % (pn, t))
            # テーマが2行に折り返すと「解答：」は2行目の右端に来る（NO.700・701・787）
            if '解答：' in t and not cur_e['ans'] and not cur_e['lines']:
                head, ans = t.split('解答：', 1)
                cur_e['theme'] += head.replace('\t', '').strip()
                cur_e['ans'] = ans.strip()
                continue
            cur_e['lines'].append([l['y0'], l['x0'] - MID_X, l['text'], l['html'], l['x1'] - MID_X, l['uni']])
        # 図
        for info in page.get_image_info():
            r = info['bbox']
            if r[2] - r[0] < 20 or r[3] - r[1] < 20:
                continue
            side = 'q' if r[0] < MID_X else 'e'
            if side == 'e' and pn in EX_FIG_CLIP:
                r = EX_FIG_CLIP[pn]
            figs.append(dict(page=pn, rect=[round(v, 1) for v in r], side=side))
    io.open(PARSED, 'w', encoding='utf-8').write(json.dumps(
        dict(problems=[probs[k] for k in sorted(probs)], expls=[expls[k] for k in sorted(expls)], figs=figs),
        ensure_ascii=False, indent=0))
    print('問題 %d・解説 %d・図 %d → %s' % (len(probs), len(expls), len(figs), PARSED))


def cmd_render(pn, dpi=150):
    doc = fitz.open(PDF)
    out = os.path.join(os.environ.get('KNOCK_SCRATCH', '.'), 'knock_p%d.png' % pn)
    doc[pn - 1].get_pixmap(dpi=dpi).save(out)
    print(out)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'anstable':
        cmd_anstable()
    elif cmd == 'parse':
        cmd_parse()
    elif cmd == 'render':
        cmd_render(int(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 150)
    else:
        print(__doc__)
