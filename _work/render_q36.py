import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import fitz
from PIL import Image

PDF = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(PDF)
print(f"Total pages: {doc.page_count}")

# Search for 118E in chapter 1 area (pages 1-30)
for i in range(0, 30):
    page = doc[i]
    txt = page.get_text()
    if '118E' in txt and ('25' in txt or '24' in txt or '26' in txt):
        print(f"Page {i+1}: found 118E reference near 25")
        for pg in range(max(0, i-1), min(doc.page_count, i+2)):
            p = doc[pg]
            pix = p.get_pixmap(dpi=180)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img.save(f"tmp_q36_p{pg+1}.png")
            print(f"  Rendered page {pg+1}")
        break
else:
    print("Not found in pages 1-30")
    for i in range(doc.page_count):
        page = doc[i]
        txt = page.get_text()
        if '118E' in txt:
            print(f"Page {i+1}: found 118E - {txt[:80].strip()}")
