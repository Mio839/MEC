import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import fitz
from PIL import Image

PDF = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(PDF)

print(f"Total pages: {doc.page_count}")
for i in range(85, 115):
    page = doc[i]
    txt = page.get_text()
    if '115E' in txt:
        print(f"Page {i+1}: found 115E reference")
        for pg in range(max(0, i-1), min(doc.page_count, i+3)):
            p = doc[pg]
            pix = p.get_pixmap(dpi=180)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img.save(f"tmp_q189_pdf_p{pg+1}.png")
            print(f"  Rendered page {pg+1}")
        break
else:
    print("Not found in 86-115")
    for i in range(doc.page_count):
        page = doc[i]
        txt = page.get_text()
        if '115E' in txt:
            print(f"Page {i+1}: {txt[:80]}")
