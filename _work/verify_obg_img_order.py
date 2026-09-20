import fitz, json, re, io, sys, os
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

FIX = '--fix' in sys.argv
d = fitz.open(r'MEC問題文pdf\MEC産婦人科講座_問題（表紙2026）.pdf')
j = json.load(open('questions_obg.json', encoding='utf-8'))
qs = [q for ch in j['chapters'] for q in ch['qs'] if len(q.get('imgs') or []) >= 2]

anchor = {}
for i in range(len(d)):
    for m in re.finditer(r'[（(]\s*(\d{2,3}[A-I]-\d+)\s*[）)]', d[i].get_text()):
        anchor.setdefault(m.group(1), i)

def ahash(b):
    im = Image.open(io.BytesIO(b)).convert('L').resize((16,16))
    px = list(im.getdata()); avg = sum(px)/len(px)
    return int(''.join('1' if p > avg else '0' for p in px), 2)
def dist(a,b): return bin(a^b).count('1')

bad, unk, ok = [], [], 0
for q in qs:
    ep = (q.get('episode') or '').strip('()（）')
    pg = anchor.get(ep)
    if pg is None: unk.append((q['uid'], ep, 'ページ不明')); continue
    cand = []
    for p in (pg, pg+1):
        if p >= len(d): continue
        for im in d[p].get_images(full=True):
            r = d[p].get_image_rects(im[0])
            if not r or r[0].width < 40 or r[0].height < 40: continue
            cand.append((p, round(r[0].y0/20), r[0].x0, im[0]))
    cand.sort(key=lambda t:(t[0],t[1],t[2]))
    ph = []
    for p,_,_,x in cand:
        try: ph.append(ahash(d.extract_image(x)['image']))
        except Exception: ph.append(None)
    fh = [ahash(open(p,'rb').read()) for p in q['imgs']]
    if len(ph) < len(fh): unk.append((q['uid'], ep, f'pdf{len(ph)}<file{len(fh)}')); continue
    order = []
    for f in fh:
        best, bd = None, 99
        for k,p in enumerate(ph):
            if p is None: continue
            dd = dist(f,p)
            if dd < bd: bd, best = dd, k
        order.append(best if bd <= 12 else None)
    if None in order or len(set(order)) != len(order):
        unk.append((q['uid'], ep, f'対応不明 {order}')); continue
    if order != sorted(order):
        bad.append((q['uid'], ep, order, list(q['imgs'])))
    else: ok += 1

print(f'順序OK {ok} ／ 順序ずれ {len(bad)} ／ 判定不能 {len(unk)}')
for u,e,o,_ in bad: print('  ずれ', u, e, o)
for u,e,r in unk: print('  不能', u, e, r)

if FIX:
    for u,e,order,paths in bad:
        cur = [open(p,'rb').read() for p in paths]
        rank2file = {r:i for i,r in enumerate(order)}   # pdf順r -> 現ファイル添字
        newb = [cur[rank2file[r]] for r in range(len(paths))]
        for p,b in zip(paths, newb): open(p,'wb').write(b)
        print('  直した', u, e)
    print('FIXED', len(bad))
