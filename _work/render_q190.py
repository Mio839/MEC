import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import fitz
from PIL import Image

PDF = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(PDF)
# Page 100 (0-indexed: 99) - higher DPI
for pg in [99, 100]:
    p = doc[pg]
    pix = p.get_pixmap(dpi=250)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img.save(f"tmp_q190_hq_p{pg+1}.png")
    print(f"Rendered page {pg+1}")
