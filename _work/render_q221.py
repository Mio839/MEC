import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import fitz
from PIL import Image

PDF = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(PDF)

# Search for 105A-51 or 105A51 across pages near end of chapter 4
# ch04 is respiration - likely around pages 110-130 area (guess based on ch04 content)
# Let's search text for "105A-51" or "105A51"
print(f"Total pages: {doc.page_count}")

for i in range(100, 140):
    page = doc[i]
    txt = page.get_text()
    if '105A' in txt and ('51' in txt or '52' in txt):
        print(f"Page {i+1}: found 105A reference")
        # Also render nearby pages
        for pg in range(max(0, i-1), min(doc.page_count, i+2)):
            p = doc[pg]
            pix = p.get_pixmap(dpi=150)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img.save(f"tmp_q221_p{pg+1}.png")
            print(f"  Rendered page {pg+1}")
        break
else:
    print("Not found in pages 101-140, searching all...")
    for i in range(doc.page_count):
        page = doc[i]
        txt = page.get_text()
        if '105A' in txt:
            print(f"Page {i+1}: {txt[:100]}")
