#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Render PDF pages for specific exam codes and check for vector images.
Tries to extract images by rendering the page.
"""
import re, fitz, os

EXAM_RE = re.compile(r'(\d{2,3}[A-Z]-\d+)')

TARGET_CHECKS = [
    ('MEC問題文pdf/MEC臓器別講座・神経_問題（表紙2026）.pdf', '神経', {'114E-31', '109I-43', '114A-19', '113D-22'}),
    ('MEC問題文pdf/MEC臓器別講座・血液_問題（表紙2026）.pdf', '血液', {'110E-32', '108C-10', '98H-39', '94A-55'}),
    ('MEC問題文pdf/MEC臓器別講座・循環器_問題（表紙2026）.pdf', '循環器', {'108D-60', '115A-51'}),
    ('MEC問題文pdf/MEC臓器別講座・腎_問題（表紙2026）.pdf', '腎臓', {'119C-10', '116A-33', '106I-80', '117A-75', '112C-36'}),
]

def find_target_pages(pdf_path, target_codes):
    """Find which pages contain each target code."""
    doc = fitz.open(pdf_path)
    result = {}
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        for code in EXAM_RE.findall(text):
            if code in target_codes:
                result.setdefault(code, []).append(page_num)
    doc.close()
    return result

def check_page_content(pdf_path, page_num_0based):
    """Check if page has vector drawings (paths) that might be images."""
    doc = fitz.open(pdf_path)
    page = doc[page_num_0based]
    # Count drawings/paths
    drawings = page.get_drawings()
    img_list = page.get_images(full=True)
    print(f'  Page {page_num_0based+1}: {len(img_list)} raster images, {len(drawings)} vector drawings')
    if drawings:
        # Show bounding boxes of significant drawings
        for d in drawings[:3]:
            if 'rect' in d:
                r = d['rect']
                area = (r.x1-r.x0) * (r.y1-r.y0)
                if area > 5000:  # significant size
                    print(f'    drawing bbox: {r} area={area:.0f}')
    doc.close()
    return len(drawings)

def render_page_around_code(pdf_path, folder, code, page_num_0based, output_n=1):
    """Render a page and save a crop around where the image should be."""
    doc = fitz.open(pdf_path)
    page = doc[page_num_0based]

    # Get text positions to find where the question starts
    text_items = [(s['origin'][1], s['text'])
                  for b in page.get_text('dict')['blocks']
                  if b.get('type') == 0
                  for l in b.get('lines', [])
                  for s in l.get('spans', [])]
    text_items.sort()

    # Find position of the code
    code_y = None
    for y, text in text_items:
        if code in text:
            code_y = y
            break

    # Determine crop region
    page_rect = page.rect
    if code_y is not None:
        # Crop from just before the code to ~400pt below
        y0 = max(0, code_y - 30)
        y1 = min(page_rect.height, code_y + 500)
    else:
        # Full page
        y0 = 0
        y1 = page_rect.height

    clip = fitz.Rect(page_rect.x0, y0, page_rect.x1, y1)
    mat = fitz.Matrix(1.5, 1.5)  # 1.5x resolution
    pix = page.get_pixmap(matrix=mat, clip=clip)

    img_dir = folder + '/images'
    os.makedirs(img_dir, exist_ok=True)
    fname = f'{code}_{output_n}.jpeg'
    fpath = os.path.join(img_dir, fname)
    if not os.path.exists(fpath):
        pix.save(fpath)
        print(f'  [RENDERED] {fname} from page {page_num_0based+1} (crop y={y0:.0f}-{y1:.0f})')
    else:
        print(f'  [EXISTS] {fname}')

    doc.close()
    return fname

# Check each subject
for pdf_path, folder, target_codes in TARGET_CHECKS:
    print(f'\n=== {folder} ===')
    target_pages = find_target_pages(pdf_path, target_codes)
    for code, pages in sorted(target_pages.items()):
        print(f'{code}: found on pages {[p+1 for p in pages[:5]]}')
        for pg in pages[:1]:  # Check first occurrence
            n_drawings = check_page_content(pdf_path, pg)
            if n_drawings > 5:  # Has significant vector content
                print(f'  → Vector-based image detected, rendering page...')
                render_page_around_code(pdf_path, folder, code, pg)
