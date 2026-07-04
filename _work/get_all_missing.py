#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, re

SUBJECTS = [
    ('endo','内分泌'),('resp','呼吸器'),('circ','循環器'),('dige','消化器'),
    ('neur','神経'),('hbp','肝胆膵'),('jinzo_d','腎臓'),('hema','血液'),('imma','免アレ膠')
]
IMAGE_KW_RE = re.compile(r'を示す|示した|の写真|の像|の画像')
QE_RE = re.compile(r'<span class="qe">\(([^)]+)\)</span>')
QT_RE = re.compile(r'<div class="qt">(.*?)</div>', re.DOTALL)

def make_card_pat(prefix):
    return re.compile(r'<div[^>]*class="qc"[^>]*data-uid="(' + prefix + r'_ch\d+_q\d+)"')

def get_existing_images(folder):
    img_dir = folder + '/images'
    if not os.path.isdir(img_dir): return {}
    result = {}
    for fn in os.listdir(img_dir):
        m = re.match(r'^(\d{2,3}[A-Z]-\d+)_(\d+)\.(jpe?g|png)$', fn, re.I)
        if m: result.setdefault(m.group(1), []).append(fn)
    return result

with open('study.html', encoding='utf-8') as f:
    study = f.read()

all_missing = {}
for prefix, folder in SUBJECTS:
    existing = get_existing_images(folder)
    card_pat = make_card_pat(prefix)
    positions = [(m.start(), m.group(1)) for m in card_pat.finditer(study)]
    no_file = []
    for i, (pos, uid) in enumerate(positions):
        end = positions[i+1][0] if i+1 < len(positions) else pos+10000
        card = study[pos:end]
        qe_m = QE_RE.search(card, 0, 600)
        if not qe_m: continue
        code = qe_m.group(1).replace(' ','')
        qt_m = QT_RE.search(card, 0, 3000)
        if not qt_m: continue
        if not IMAGE_KW_RE.search(qt_m.group(1)): continue
        cs_idx = card.find('<div class="cs">')
        if cs_idx == -1: continue
        if 'qimg-row' in card[:cs_idx]: continue
        if not existing.get(code):
            no_file.append((uid, code))
    if no_file:
        all_missing[folder] = no_file
        print(folder + ': ' + str(len(no_file)) + ' missing')
        for uid, code in no_file:
            print('  ' + uid + ' (' + code + ')')

total = sum(len(v) for v in all_missing.values())
print()
print('TOTAL missing: ' + str(total))
