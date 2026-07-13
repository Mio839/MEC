# -*- coding: utf-8 -*-
"""キーワード非依存の総点検: 画像を持つ全設問について、その画像が一致するPDF図の
座標上の持ち主が別設問で、かつその持ち主が自前の同内容ファイルを持つ場合をゴーストとして列挙。
（＝誤った名前で別設問の図が複製されているケースを網羅検出）書き換えなし。"""
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


def dhash(im):
    im = im.convert('L').resize((9, 8)); px = list(im.getdata()); b = 0
    for r in range(8):
        for c in range(8):
            b = (b << 1) | (1 if px[r * 9 + c] < px[r * 9 + c + 1] else 0)
    return b


for sid in [a for a in sys.argv[1:] if not a.startswith('-')] or list(SUBJECTS):
    pdf_name, dir_name = SUBJECTS[sid]
    doc = fitz.open(os.path.join(PDF_DIR, pdf_name))
    fig_by_page, anchors_by_page = {}, {}
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
    # 各設問の自前ファイルの hash 一覧
    own_hashes = {}
    for e, q in jq.items():
        for s in (q.get('imgs') or []):
            fn = os.path.basename(s)
            if fn.startswith(e):
                fp = os.path.join(img_dir, fn)
                if os.path.exists(fp):
                    own_hashes.setdefault(e, []).append((fn, dhash(Image.open(fp))))

    ghosts = []
    for q in qs:
        eid = q['episode'].strip('()')
        for s in (q.get('imgs') or []):
            fn = os.path.basename(s)
            fp = os.path.join(img_dir, fn)
            if not os.path.exists(fp):
                continue
            h = dhash(Image.open(fp))
            # 図の座標上の持ち主
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
            if owner and owner != eid and owner in own_hashes:
                # 持ち主の自前ファイルと同内容か
                if any(bin(h ^ oh).count('1') <= 6 for _, oh in own_hashes[owner]):
                    ghosts.append((eid, fn, owner, ham))
    print(f'\n########## {sid}: ゴースト候補 {len(ghosts)}件 ##########')
    for eid, fn, owner, ham in ghosts:
        print(f'  {eid} {fn} -> 真の持ち主 {owner} (fig_ham{ham})')
