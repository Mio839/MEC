# -*- coding: utf-8 -*-
import fitz, io, os, glob, unicodedata
BASE = r'C:\Users\coool\Desktop\MEC'
PDF = [p for p in glob.glob(os.path.join(BASE, 'MEC問題文pdf', '*.pdf'))
       if '放射線' in p and 'レジュメ' in unicodedata.normalize('NFC', p)][0]
OUT = os.path.join(BASE, '_work', '_rad_tmp', 'resume.txt')
d = fitz.open(PDF)
buf = []
for i in range(d.page_count):
    pg = d[i]
    buf.append('===== PAGE %d =====\n' % (i + 1))
    words = [w for w in pg.get_text('words') if w[4].strip()]
    words = [w for w in words if 30 <= w[0] <= 560]
    lines = {}
    for w in words:
        lines.setdefault(round(w[1] / 3), []).append(w)
    for key in sorted(lines):
        buf.append(' '.join(x[4] for x in sorted(lines[key], key=lambda z: z[0])))
        buf.append('\n')
io.open(OUT, 'w', encoding='utf-8').write(''.join(buf))
print('ok')
