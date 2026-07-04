import fitz
import os

pdf_path = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\coool\Desktop\MEC\感染症\images"

# Q27 (104H-15): page 15, 4 images → 104H-15_1.jpeg〜4.jpeg
page15 = doc[15]
imgs15 = page15.get_images(full=True)
print(f"Page 15 images: {len(imgs15)}")
for i, img in enumerate(imgs15, 1):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n > 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out_path = os.path.join(out_dir, f"104H-15_{i}.jpeg")
    pix.save(out_path)
    print(f"  Saved 104H-15_{i}.jpeg ({pix.width}x{pix.height})")

# Q39 (117C-43): page 20, 1 image → 117C-43_1.jpeg
page20 = doc[20]
imgs20 = page20.get_images(full=True)
print(f"Page 20 images: {len(imgs20)}")
for i, img in enumerate(imgs20, 1):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n > 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out_path = os.path.join(out_dir, f"117C-43_{i}.jpeg")
    pix.save(out_path)
    print(f"  Saved 117C-43_{i}.jpeg ({pix.width}x{pix.height})")

# Also verify Q22 (108F-15): page 14, 5 images
page14 = doc[14]
imgs14 = page14.get_images(full=True)
print(f"Page 14 images: {len(imgs14)}")
for i, img in enumerate(imgs14, 1):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n > 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out_path = os.path.join(out_dir, f"108F-15_{i}.jpeg")
    pix.save(out_path)
    print(f"  Saved 108F-15_{i}.jpeg ({pix.width}x{pix.height})")

print("Done")
