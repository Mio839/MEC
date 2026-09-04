# -*- coding: utf-8 -*-
"""
肝胆膵PDF（MEC臓器別講座・肝胆膵・238ページ）から設問の原文・画像を取り出し、
questions_hbp.json と突き合わせる。resp_pdf.py / circ_pdf.py の同型。

    python _work/hbp_pdf.py pages                  各章がPDFの何ページかを推定
    python _work/hbp_pdf.py text   --ch 1          その章の設問原文をdump（Readで読む用）
    python _work/hbp_pdf.py qtdiff --ch 1          JSONのqtとPDF原文の乖離を検出
    python _work/hbp_pdf.py images --ch 1          画像矩形＋帰属候補＋ページ描画を出す
    python _work/hbp_pdf.py save   --ch 1          ch01_map.txt を検収してから保存

⚠️ 帰属は機械では決めきれない＝**整形外科式**（機械が候補を出し、ページ描画を見て
   ch{NN}_map.txt を1行ずつ検収してから save）。
"""
import argparse, io, json, os, re, sys

import fitz
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', 'MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf')
JSON_PATH = os.path.join(BASE, 'questions_hbp.json')
OUT = os.path.join(BASE, '_work', '_hbp_tmp')
DEST_IMG = os.path.join(BASE, '肝胆膵', 'images')

# 設問アンカー「442.（120A-3）」。pdf_audit.py と同じ規約
ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
TAG = re.compile(r'<[^>]+>')


def _w(name, text):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(text)
    print('-> %s (%d bytes)' % (p, len(text.encode('utf-8'))))
    return p


def load_json():
    return json.load(io.open(JSON_PATH, encoding='utf-8'))


def chapter_qs(ch):
    return load_json()['chapters'][ch - 1]['qs']


def scan_anchors(doc):
    """PDF全ページを走査して {国試番号: [(page, 位置, NO)]} を作る。"""
    found = {}
    pages = []
    for pno in range(doc.page_count):
        t = doc[pno].get_text()
        pages.append(t)
        for m in ANCHOR.finditer(t):
            found.setdefault(m.group(2), []).append(
                (pno + 1, m.start(), m.end(), int(m.group(1))))
    return found, pages


def cmd_pages(_a):
    doc = fitz.open(PDF)
    found, _ = scan_anchors(doc)
    data = load_json()
    print('PDF %d ページ / アンカー %d 種' % (doc.page_count, len(found)))
    for i, ch in enumerate(data['chapters'], 1):
        hits = []
        for q in ch['qs']:
            code = q['episode'].strip('()（）')
            for (p, _o, _e, _n) in found.get(code, []):
                hits.append(p)
        miss = sum(1 for q in ch['qs']
                   if not found.get(q['episode'].strip('()（）')))
        rng = ('p%d-%d' % (min(hits), max(hits))) if hits else '—'
        print('  ch%02d %-22s %3d問  %-12s  PDFで見つからない %d問'
              % (i, ch['title'], len(ch['qs']), rng, miss))


def pdf_block(pages, page, off, end, code):
    """アンカー位置から次のアンカーまでを1問ぶんの原文として切り出す。

    ⚠️ 次のアンカーは **今のアンカーの終端から**探すこと。ANCHOR の `\\d{1,3}` は
       「442.（120A-3）」の1文字先「42.（120A-3）」にも一致するので、off+1 から
       探すと必ず自分自身に当たり、1問が1文字に潰れる。
    """
    t = pages[page - 1]
    nxt = None
    for m in ANCHOR.finditer(t, end):
        nxt = m.start()
        break
    seg = t[off:nxt] if nxt else t[off:]
    # 次ページへまたぐ場合、次ページ冒頭〜最初のアンカーまでを足す
    if nxt is None and page < len(pages):
        t2 = pages[page]
        m2 = ANCHOR.search(t2)
        seg += '\n' + (t2[:m2.start()] if m2 else t2)
    return seg


def cmd_text(a):
    doc = fitz.open(PDF)
    found, pages = scan_anchors(doc)
    out = []
    for q in chapter_qs(a.ch):
        code = q['episode'].strip('()（）')
        hit = found.get(code)
        out.append('=' * 78)
        out.append('%s  %s  %s  正答率%s' % (q['uid'], q['qn'], q['episode'], q['rate_text'] or '—'))
        if not hit:
            out.append('!! PDFにアンカーが無い')
            continue
        p, off, end, no = hit[0]
        out.append('PDF p.%d (NO.%d)' % (p, no))
        out.append('-' * 78)
        out.append(pdf_block(pages, p, off, end, code).strip())
    _w('ch%02d_pdf_text.txt' % a.ch, '\n'.join(out))


def norm(s):
    """比較用に空白・記号のゆれを潰す。"""
    s = TAG.sub('', s)
    s = re.sub(r'[\s　]+', '', s)
    return s


def cmd_qtdiff(a):
    doc = fitz.open(PDF)
    found, pages = scan_anchors(doc)
    rows, detail = [], []
    for q in chapter_qs(a.ch):
        code = q['episode'].strip('()（）')
        hit = found.get(code)
        jt = norm(q['qt'])
        # 連問ラベルは比較から外す
        jt = re.sub(r'^連問\d+/\d+', '', jt)
        if not hit:
            rows.append((q['qn'], code, len(jt), 0, '—', 'PDFに無し'))
            continue
        p, off, end, no = hit[0]
        blk = pdf_block(pages, p, off, end, code)
        # 選択肢(ａ〜ｅ)より前が設問文
        m = re.search('[\uff41a][\\s\u3000\\x01]', blk)
        stem = blk[:m.start()] if m else blk
        pt = norm(stem)
        pt = re.sub(r'^\d+[.．][（(][^）)]+[）)]', '', pt)
        ratio = len(jt) / len(pt) if pt else 0
        flags = []
        if ratio < 0.75:
            flags.append('要約の疑い')
        if '表' in stem or re.search(r'[①②③④⑤]', stem):
            flags.append('表?')
        if any('table' in (e.get('c') or '') for e in [{'c': q['qt']}]):
            flags.append('qtに表')
        rows.append((q['qn'], code, len(jt), len(pt), '%.2f' % ratio, ' '.join(flags)))
        if ratio < 0.75:
            detail.append('=' * 78)
            detail.append('%s %s  JSON %d字 / PDF %d字  (%.2f)' % (q['qn'], code, len(jt), len(pt), ratio))
            detail.append('--- JSON の qt ---')
            detail.append(TAG.sub('', q['qt']))
            detail.append('--- PDF の原文 ---')
            detail.append(stem.strip())

    print('%-8s %-11s %6s %6s %6s  %s' % ('Q', '国試', 'JSON', 'PDF', '比', 'flags'))
    for r in rows:
        print('%-8s %-11s %6d %6d %6s  %s' % r)
    n = sum(1 for r in rows if '要約の疑い' in r[5])
    print('\n要約の疑い %d問 / 全%d問' % (n, len(rows)))
    if detail:
        _w('ch%02d_qtdiff.txt' % a.ch, '\n'.join(detail))


# ---------------------------------------------------------------- images
# 設問アンカーの番号だけを持つ語（「118.」）。x<120 の左端に来る
NO_WORD = re.compile(r'^(\d{1,3})[.．]$')
# 連問の宣言「次の文を読み、118 と 119 の問いに答えよ。」
DECL_W = re.compile(r'次の文を読み[、,]\s*(\d{1,3})')


def page_events(pg):
    """そのページの「ここから誰の領域か」が変わる位置を y 昇順で返す。

    ⚠️ 臓器別講座の版面は **連問の共通ステム → 図 → 各設問** の順に並ぶ。
       図が最初の設問アンカーより上に来るので、アンカーだけを見ると持ち主が決まらない
       （実際に p60 の胸部エックス線写真が該当した）。宣言文もイベントとして拾い、
       規約どおり **連問1問目**を持ち主にする。
    """
    ev = []
    for w in pg.get_text('words'):
        m = NO_WORD.match(w[4])
        if m and w[0] < 120:
            ev.append((w[1], int(m.group(1)), 'anchor'))
    txt = pg.get_text('blocks')
    for b in txt:
        m = DECL_W.search(b[4].replace('\n', ''))
        if m:
            ev.append((b[1], int(m.group(1)), 'decl'))
    return sorted(ev)


def attribute(pages):
    """全ページを走査し、画像矩形ごとに持ち主のNOを決める。

    ⚠️ ページをまたいで持ち主を持ち越すこと。図だけが載ったページ（アンカーも宣言も無い）が
       実在するので、そのページで打ち切ると持ち主を見失う。
    """
    doc = pages
    out, cur = [], None
    for pno in range(doc.page_count):
        pg = doc[pno]
        ev = page_events(pg)
        rects = []
        for im in pg.get_images(full=True):
            for r in pg.get_image_rects(im[0]):
                rects.append((r, im[0]))
        rects.sort(key=lambda t: (t[0].y0, t[0].x0))
        for r, xref in rects:
            owner, kind = cur, 'carry'
            for y, n, k in ev:
                if y <= r.y0 + 24:
                    owner, kind = n, k
            out.append(dict(page=pno + 1, xref=xref, rect=r, owner=owner, via=kind))
        if ev:
            cur = ev[-1][1]
    return out


def fig_labels(pg, rects):
    """矩形の直下(±34px)にある A/B/C を図ラベルとして拾う。
    ⚠️ 読み順ではなく **x座標** で左右を決める（紙面が B A の順に並ぶことがある）。"""
    labs = []
    for w in pg.get_text('words'):
        if w[4] not in ('A', 'B', 'C', 'D', 'Ａ', 'Ｂ', 'Ｃ'):
            continue
        for r, xref in rects:
            if r.y1 <= w[1] <= r.y1 + 34 and r.x0 - 24 <= w[0] <= r.x1 + 24:
                labs.append((w[4], round(w[0]), xref))
    return sorted(labs, key=lambda t: t[1])


def cmd_images(a):
    """画像の矩形を列挙し、帰属候補つきの ch{NN}_map.txt とページ描画を出す。

    map の行は `page xref 国試番号 連番`。**必ずページ描画を見て検収してから save すること**
    （帰属は機械では決めきれない＝整形外科式）。
    """
    doc = fitz.open(PDF)
    qs = chapter_qs(a.ch)
    nos = {int(q['qn'].replace('Q.', '')): q['episode'].strip('()（）') for q in qs}
    lo, hi = min(nos), max(nos)
    recs = [r for r in attribute(doc) if r['owner'] is not None and lo <= r['owner'] <= hi]

    sheet = os.path.join(OUT, 'sheet')
    os.makedirs(sheet, exist_ok=True)
    log, maps = [], []
    seen = {}
    for pno in sorted({r['page'] for r in recs}):
        rs = [r for r in recs if r['page'] == pno]
        pg = doc[pno - 1]
        log.append('PAGE %d  events=%s' % (pno, page_events(pg)))
        labs = fig_labels(pg, [(r['rect'], r['xref']) for r in rs])
        if labs:
            log.append('   図ラベル(x順): %s' % labs)
        for r in rs:
            kid = nos.get(r['owner'], '?')
            seen[kid] = seen.get(kid, 0) + 1
            rc = r['rect']
            log.append('   xref=%-5d rect=(%.0f,%.0f,%.0f,%.0f) -> NO.%s (%s) via=%s'
                       % (r['xref'], rc.x0, rc.y0, rc.x1, rc.y1, r['owner'], kid, r['via']))
            maps.append('%d %d %s %d' % (pno, r['xref'], kid, seen[kid]))
        pg.get_pixmap(dpi=110).save(os.path.join(sheet, 'p%03d.png' % pno))

    _w('ch%02d_images.txt' % a.ch, '\n'.join(log))
    _w('ch%02d_map.txt' % a.ch,
       '# page xref 国試番号 連番   ← ページ描画を見て検収して直す（連図は A→1, B→2）\n'
       + '\n'.join(maps) + '\n')
    print('ch%02d: 画像 %d 枚 / %d ページ  ページ描画は %s'
          % (a.ch, len(recs), len({r['page'] for r in recs}), sheet))


# ---------------------------------------------------------------- save
def _is_line_art(im):
    """ほぼ無彩色（＝シェーマ・心電図・単純エックス線）かどうか。
    線画は q85 だと細い線が崩れ pdf_audit.py の知覚ハッシュ照合が誤検出するので q95 で保存する。"""
    small = im.resize((32, 32))
    px = list(small.getdata())
    chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 24)
    return chroma < len(px) * 0.05


def cmd_save(a):
    """ch{NN}_map.txt に従って 呼吸器/images/{国試番号}_{n}.jpeg を保存。
    ⚠️ compress_images.py は使わない（既存を再エンコードして巨大な差分を生む）。"""
    mp = getattr(a, 'map', None) or os.path.join(OUT, 'ch%02d_map.txt' % a.ch)
    doc = fitz.open(PDF)
    os.makedirs(DEST_IMG, exist_ok=True)
    n = 0
    for line in io.open(mp, encoding='utf-8'):
        line = line.split('#')[0].strip()
        if not line:
            continue
        _p, xref, kid, idx = line.split()
        info = doc.extract_image(int(xref))
        im = Image.open(io.BytesIO(info['image'])).convert('RGB')
        w, h = im.size
        if max(w, h) > 1200:
            s = 1200.0 / max(w, h)
            im = im.resize((int(w * s + 0.5), int(h * s + 0.5)), Image.LANCZOS)
        path = os.path.join(DEST_IMG, '%s_%s.jpeg' % (kid, idx))
        q = 95 if _is_line_art(im) else 85
        im.save(path, 'JPEG', quality=q, optimize=True)
        print('%-20s %4dx%-4d -> %dx%d q%d' % (os.path.basename(path), w, h,
                                               im.size[0], im.size[1], q))
        n += 1
    print('saved %d images' % n)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('pages').set_defaults(f=cmd_pages)
    for name, fn in (('text', cmd_text), ('qtdiff', cmd_qtdiff),
                     ('images', cmd_images), ('save', cmd_save)):
        p = sub.add_parser(name)
        # save は章ぶんの map でも、全章まとめた map（--map）でも動く
        p.add_argument('--ch', type=int, required=(name != 'save'))
        if name == 'save':
            p.add_argument('--map')
        p.set_defaults(f=fn)
    args = ap.parse_args()
    args.f(args)
