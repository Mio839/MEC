# -*- coding: utf-8 -*-
"""scan_all_ghosts の候補を「別症例ゴースト」と「連問内共有」に分類（書き換えなし）。
連問判定: PDFの「次の文を読み、N〜M の問いに答えよ」範囲に self と owner が同居 → 同一症例。
または同一セッション(例 114C)かつ通し番号が近接(±3)かつ self が qt-context を持つ → 同一症例。
それ以外は別症例ゴースト。"""
import fitz, re, os, sys, io, json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = r'C:\Users\coool\Desktop\MEC'
PDF_DIR = os.path.join(BASE, 'MEC問題文pdf')
SUBJECTS = {
    'endo': ('MEC臓器別講座・内分泌代謝_問題（表紙2026）(1).pdf', '内分泌'),
    'resp': ('MEC臓器別講座・呼吸器_問題（表紙2026）.pdf', '呼吸器'),
    'circ': ('MEC臓器別講座・循環器_問題（表紙2026）.pdf', '循環器'),
    'dige': ('MEC臓器別講座・消化管_問題（表紙2026）.pdf', '消化器'),
    'neur': ('MEC臓器別講座・神経_問題（表紙2026）.pdf', '神経'),
    'hbp': ('MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf', '肝胆膵'),
    'jinzo_d': ('MEC臓器別講座・腎_問題（表紙2026）.pdf', '腎臓'),
    'hema': ('MEC臓器別講座・血液_問題（表紙2026）.pdf', '血液'),
    'imma': ('MEC臓器別講座・免アレ膠_問題（表紙2026）.pdf', '免アレ膠'),
    'kansen': ('MEC臓器別講座・感染症_問題（表紙2026）.pdf', '感染症'),
}
ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
SERIES = re.compile(r'次の文を読み[、,]?\s*(\d+)\s*[〜～\-とー,、]\s*(\d+)\s*の問いに答えよ')
SESS = re.compile(r'^(\d{2,3}[A-Z])-(\d+)$')


def dhash(im):
    im = im.convert('L').resize((9, 8)); px = list(im.getdata()); b = 0
    for r in range(8):
        for c in range(8):
            b = (b << 1) | (1 if px[r * 9 + c] < px[r * 9 + c + 1] else 0)
    return b


cross_total = []
for sid in [a for a in sys.argv[1:] if not a.startswith('-')] or list(SUBJECTS):
    pdf_name, dir_name = SUBJECTS[sid]
    doc = fitz.open(os.path.join(PDF_DIR, pdf_name))
    fig_by_page, anchors_by_page = {}, {}
    qnum, series_of = {}, {}
    for p in range(len(doc)):
        figs = []
        for im in doc[p].get_images(full=True):
            try:
                h = dhash(Image.open(io.BytesIO(doc.extract_image(im[0])['image'])))
                rects = doc[p].get_image_rects(im[0])
                figs.append((rects[0].y0 if rects else 0, h))
            except Exception:
                pass
        fig_by_page[p] = figs
        t = doc[p].get_text()
        ms = list(ANCHOR.finditer(t))
        for m in ms:
            qnum[m.group(2)] = int(m.group(1))
        mr = SERIES.search(re.sub(r'\s*\n\s*', '', t))
        if mr and ms:
            rng = (int(mr.group(1)), int(mr.group(2)))
            for m in ms:
                if rng[0] <= int(m.group(1)) <= rng[1]:
                    series_of[m.group(2)] = rng
        d = doc[p].get_text('dict'); anchors = []
        for blk in d.get('blocks', []):
            for ln in blk.get('lines', []):
                txt = ''.join(sp['text'] for sp in ln.get('spans', []))
                for m in ANCHOR.finditer(txt):
                    anchors.append((ln['bbox'][1], m.group(2)))
        anchors_by_page[p] = sorted(anchors)
    doc.close()

    img_dir = os.path.join(BASE, dir_name, 'images')
    data = json.load(open(os.path.join(BASE, f'questions_{sid}.json'), encoding='utf-8'))
    qs = [q for ch in data['chapters'] for q in ch['qs']]
    jq = {q['episode'].strip('()'): q for q in qs}
    own_hashes = {}
    for e, q in jq.items():
        for s in (q.get('imgs') or []):
            fn = os.path.basename(s)
            if fn.startswith(e):
                fp = os.path.join(img_dir, fn)
                if os.path.exists(fp):
                    own_hashes.setdefault(e, []).append(dhash(Image.open(fp)))

    def same_case(a, b):
        if a in series_of and b in series_of and series_of[a] == series_of[b]:
            return True
        ma, mb = SESS.match(a), SESS.match(b)
        if ma and mb and ma.group(1) == mb.group(1) and abs(qnum.get(a, 0) - qnum.get(b, 0)) <= 3:
            if 'qt-context' in (jq[a]['qt'] if a in jq else ''):
                return True
        return False

    cross, series = [], []
    for q in qs:
        eid = q['episode'].strip('()')
        for s in (q.get('imgs') or []):
            fn = os.path.basename(s)
            fp = os.path.join(img_dir, fn)
            if not os.path.exists(fp):
                continue
            h = dhash(Image.open(fp))
            best = None
            for p, figs in fig_by_page.items():
                for fy, fh in figs:
                    ham = bin(h ^ fh).count('1')
                    if best is None or ham < best[0]:
                        best = (ham, p, fy)
            ham, pg, fy = best
            owner = None
            for ay, code in anchors_by_page.get(pg, []):
                if ay <= fy + 5:
                    owner = code
            if owner and owner != eid and owner in own_hashes and any(bin(h ^ oh).count('1') <= 6 for oh in own_hashes[owner]):
                (series if same_case(eid, owner) else cross).append((eid, fn, owner))
    print(f'\n##### {sid}: 別症例ゴースト {len(cross)} / 連問共有 {len(series)} #####')
    print(' [別症例ゴースト]')
    for eid, fn, owner in cross:
        print(f'    {eid} {fn} -> {owner}')
    print(' [連問共有(温存)]')
    for eid, fn, owner in series:
        print(f'    {eid} {fn} -> {owner}')
    cross_total.extend((sid, eid, fn, owner) for eid, fn, owner in cross)

print(f'\n====== 別症例ゴースト合計 {len(cross_total)}件 ======')
OUT = os.path.join(BASE, '_work', 'cross_case_ghosts.json')
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump([{'sid': s, 'eid': e, 'file': fn, 'owner': o} for s, e, fn, o in cross_total],
              f, ensure_ascii=False, indent=1)
print(f'-> {OUT}')
