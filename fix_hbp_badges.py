"""
fix_hbp_badges.py — 肝胆膵HTMLに bi(画像) / bm(多択) バッジを追加する
"""
import re, sys, io
from pathlib import Path
from bs4 import BeautifulSoup, Tag
import fitz

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PDF_PATH = r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\肝胆膵\MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf"
HBP_DIR = Path(r"C:\Users\coool\Desktop\MEC\肝胆膵")
Q_PAT = re.compile(r'(\d+)\.\s+（(\d{2,3}[A-Z]-\d+)）')
MULTI_PAT = re.compile(r'(\d+)\s*つ選べ|(\d+)\s*つ答えよ')
MIN_PX = 10000


def get_image_exam_ids(pdf_path):
    """PDFから画像のある問題のexam_idセットを返す"""
    doc = fitz.open(pdf_path)
    image_ids = set()
    for i in range(len(doc)):
        page = doc[i]
        blocks = page.get_text('dict')['blocks']
        q_pos = []
        for b in blocks:
            if b['type'] != 0:
                continue
            text = ''.join(s['text'] for l in b.get('lines', []) for s in l.get('spans', []))
            m = Q_PAT.search(text)
            if m:
                q_pos.append((b['bbox'][1], m.group(2)))
        if not q_pos:
            continue
        q_pos.sort()
        bounds = q_pos + [(page.rect.height, None)]
        for b in blocks:
            if b['type'] != 1:
                continue
            if b.get('width', 0) * b.get('height', 0) < MIN_PX:
                continue
            img_y = b['bbox'][1]
            for j in range(len(bounds) - 1):
                if bounds[j][0] <= img_y < bounds[j + 1][0]:
                    if bounds[j][1]:
                        image_ids.add(bounds[j][1])
                    break
    return image_ids


def insert_badge_before_cr_or_ctrl(qh, badge_html):
    """qh内で .cr or .mec-controls の直前にバッジを挿入する"""
    badge = BeautifulSoup(badge_html, 'html.parser')
    # .mec-controls または .cr の前に挿入
    for child in qh.children:
        if not isinstance(child, Tag):
            continue
        classes = child.get('class', [])
        if 'mec-controls' in classes or 'cr' in classes:
            child.insert_before(badge)
            return
    # なければ末尾に追加
    qh.append(badge)


def process_file(html_path, image_ids):
    with open(html_path, encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    cards = soup.find_all('div', class_='qc')

    bi_added = bm_added = 0

    for card in cards:
        qe = card.find(class_='qe')
        qh = card.find(class_='qh')
        qt = card.find(class_='qt')
        if not qe or not qh:
            continue

        exam_id = re.sub(r'[（）()]', '', qe.get_text().strip())
        already_bi = bool(card.find('span', class_='bi'))
        already_bm = bool(card.find('span', class_='bm'))

        # bi バッジ追加
        if not already_bi and exam_id in image_ids:
            insert_badge_before_cr_or_ctrl(qh, '<span class="bg bi">📷 画像</span>')
            bi_added += 1

        # bm バッジ追加（問題文から多択を検出）
        if not already_bm and qt:
            m = MULTI_PAT.search(qt.get_text())
            if m:
                count = m.group(1) or m.group(2)
                insert_badge_before_cr_or_ctrl(qh, f'<span class="bg bm">{count}択</span>')
                bm_added += 1

    if bi_added == 0 and bm_added == 0:
        return 0, 0

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

    return bi_added, bm_added


def main():
    print("画像問題IDをPDFから抽出中...")
    image_ids = get_image_exam_ids(PDF_PATH)
    print(f"  {len(image_ids)} image exam IDs found")

    total_bi = total_bm = 0
    for html_path in sorted(HBP_DIR.glob("*.html")):
        bi, bm = process_file(html_path, image_ids)
        print(f"  {html_path.name}: bi+{bi}, bm+{bm}")
        total_bi += bi
        total_bm += bm

    print(f"\n合計: bi {total_bi}件, bm {total_bm}件 追加")


if __name__ == '__main__':
    main()
