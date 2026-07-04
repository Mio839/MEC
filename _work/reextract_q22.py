import fitz
import os

pdf_path = r"C:\Users\coool\Desktop\MEC\MEC問題文pdf\MEC臓器別講座・感染症_問題（表紙2026）.pdf"
doc = fitz.open(pdf_path)
out_dir = r"C:\Users\coool\Desktop\MEC\感染症\images"

# Q22 (108F-15): page 13, 5 images
page13 = doc[13]
imgs = page13.get_images(full=True)
print(f"Page 13 images: {len(imgs)}")
for i, img in enumerate(imgs, 1):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n > 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out_path = os.path.join(out_dir, f"108F-15_{i}.jpeg")
    pix.save(out_path)
    print(f"  Saved 108F-15_{i}.jpeg ({pix.width}x{pix.height})")

print("Done")
