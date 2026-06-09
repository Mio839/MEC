"""
add_images.py — PDFから問題画像を抽出してHTMLに埋め込む
画像は {科目}/images/{exam_id}_{n}.{ext} に保存し、<img>タグで参照する
"""
import re, sys, io
from pathlib import Path
from bs4 import BeautifulSoup
import fitz

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")

SUBJECTS = [
    ("神経",   r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\神経\MEC臓器別講座・神経_問題（表紙2026）.pdf"),
    ("内分泌", r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\内分泌\MEC臓器別講座・内分泌代謝_問題（表紙2026）.pdf"),
    ("循環器", r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\循環器\MEC臓器別講座・循環器_問題（表紙2026）.pdf"),
    ("呼吸器", r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\呼吸器\MEC臓器別講座・呼吸器_問題（表紙2026）.pdf"),
    ("血液",   r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\血液\MEC臓器別講座・血液_問題（表紙2026）.pdf"),
    ("肝胆膵", r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\肝胆膵\MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf"),
    ("消化器", r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\消化器\MEC臓器別講座・消化管_問題（表紙2026）.pdf"),
    ("腎臓",   r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\腎臓\MEC臓器別講座・腎_問題（表紙2026）.pdf"),
]

Q_PAT = re.compile(r'(\d+)\.\s+（(\d{2,3}[A-Z]-\d+)）')
MIN_IMG_PIXELS = 10000  # 小さいアイコン等をスキップ

IMG_CSS = (
    ".qimg-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px;}"
    ".qimg{max-height:220px;max-width:48%;object-fit:contain;border-radius:4px;"
    "border:1px solid var(--bd,#e0e5eb);cursor:zoom-in;transition:max-height .2s,max-width .2s;}"
    ".qimg:active{max-height:none;max-width:100%;}"
)


def extract_page_assignments(page):
    """ページ内の大きい画像を問題に割り当てる。{exam_id: [(bytes, ext), ...]} を返す"""
    blocks = page.get_text('dict')['blocks']

    q_positions = []
    for b in blocks:
        if b['type'] != 0:
            continue
        text = ''.join(s['text'] for l in b.get('lines', []) for s in l.get('spans', []))
        m = Q_PAT.search(text)
        if m:
            q_positions.append((b['bbox'][1], m.group(2)))

    if not q_positions:
        return {}

    q_positions.sort()
    boundaries = q_positions + [(page.rect.height, None)]

    result = {}
    for b in blocks:
        if b['type'] != 1:
            continue
        w, h = b.get('width', 0), b.get('height', 0)
        if w * h < MIN_IMG_PIXELS:
            continue

        img_y = b['bbox'][1]
        assigned = None
        for j in range(len(boundaries) - 1):
            if boundaries[j][0] <= img_y < boundaries[j + 1][0]:
                assigned = boundaries[j][1]
                break

        if not assigned:
            continue

        img_bytes = b.get('image')
        ext = b.get('ext', 'jpeg')
        if img_bytes:
            result.setdefault(assigned, []).append((img_bytes, ext))

    return result


def extract_all_assignments(pdf_path):
    """PDFの全ページから exam_id → [(bytes, ext)] マッピングを構築"""
    doc = fitz.open(pdf_path)
    all_assignments = {}
    for i in range(len(doc)):
        for eid, imgs in extract_page_assignments(doc[i]).items():
            all_assignments.setdefault(eid, []).extend(imgs)
    return all_assignments


def save_images(subj_dir, exam_to_images):
    """画像を {subj_dir}/images/ に保存。exam_id → [filename] を返す"""
    img_dir = subj_dir / 'images'
    img_dir.mkdir(exist_ok=True)

    saved = {}
    for exam_id, imgs in exam_to_images.items():
        saved[exam_id] = []
        for idx, (img_bytes, ext) in enumerate(imgs, 1):
            fname = f"{exam_id}_{idx}.{ext}"
            fpath = img_dir / fname
            if not fpath.exists():
                fpath.write_bytes(img_bytes)
            saved[exam_id].append(fname)

    return saved


def process_html(html_path, exam_to_filenames):
    """bi マーカーのあるカードに <img> を注入。注入数を返す"""
    with open(html_path, encoding='utf-8') as f:
        content = f.read()

    # 既に注入済みならスキップ
    if '.qimg-row' in content:
        return -1

    soup = BeautifulSoup(content, 'html.parser')
    injected = 0

    for card in soup.find_all('div', class_='qc'):
        if not card.find('span', class_='bi'):
            continue

        qe = card.find(class_='qe')
        if not qe:
            continue

        exam_id = re.sub(r'[（）()]', '', qe.get_text().strip())
        filenames = exam_to_filenames.get(exam_id)
        if not filenames:
            continue

        qt = card.find(class_='qt')
        if not qt:
            continue

        imgs_html = ''.join(
            f'<img class="qimg" src="images/{fname}" alt="">'
            for fname in filenames
        )
        row = BeautifulSoup(f'<div class="qimg-row">{imgs_html}</div>', 'html.parser')
        qt.insert_after(row)
        injected += 1

    if injected == 0:
        return 0

    new_content = str(soup)

    # CSS を最初の </style> 前に追加
    if '.qimg-row' not in content:
        new_content = new_content.replace('</style>', IMG_CSS + '</style>', 1)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return injected


def main():
    for subj_name, pdf_path in SUBJECTS:
        print(f"\n=== {subj_name} ===")
        subj_dir = DST / subj_name
        if not subj_dir.exists():
            print("  SKIP: folder not found")
            continue

        # bi マーカーのある問題数確認
        bi_exam_ids = set()
        for html_path in subj_dir.glob("*.html"):
            with open(html_path, encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
            for card in soup.find_all('div', class_='qc'):
                if card.find('span', class_='bi'):
                    qe = card.find(class_='qe')
                    if qe:
                        eid = re.sub(r'[（）()]', '', qe.get_text().strip())
                        bi_exam_ids.add(eid)

        if not bi_exam_ids:
            print(f"  SKIP: no image-marked cards")
            continue

        print(f"  Image-marked cards: {len(bi_exam_ids)}")

        # PDF から画像抽出
        assignments = extract_all_assignments(pdf_path)
        matched = {eid: imgs for eid, imgs in assignments.items() if eid in bi_exam_ids}
        print(f"  PDF images matched: {len(matched)}/{len(bi_exam_ids)} exam IDs")

        # 画像ファイル保存
        exam_to_filenames = save_images(subj_dir, matched)
        total_files = sum(len(v) for v in exam_to_filenames.values())
        print(f"  Saved {total_files} image files to {subj_name}/images/")

        # HTML 更新
        for html_path in sorted(subj_dir.glob("*.html")):
            result = process_html(html_path, exam_to_filenames)
            if result == -1:
                print(f"  ─ {html_path.name} — skip (already injected)")
            elif result == 0:
                print(f"  ─ {html_path.name} — no bi cards matched")
            else:
                print(f"  ✓ {html_path.name} — {result} cards updated")

    print("\nDone!")


if __name__ == '__main__':
    main()
