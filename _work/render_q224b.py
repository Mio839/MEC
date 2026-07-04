import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import fitz
from PIL import Image

PDF = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(PDF)

# Render p117 at higher resolution to read case text clearly
for pg in [116, 117]:  # 0-indexed
    p = doc[pg]
    pix = p.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(f"tmp_q224_hq_p{pg+1}.png")
    print(f"Rendered page {pg+1} at 200dpi")
