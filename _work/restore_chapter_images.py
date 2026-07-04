"""
Restore images to chapter files where study.html has qimg-row but chapter file lost it.
Source of truth: study.html (the images survived there through all cleanup passes).
"""
import re, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CARD_PAT    = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QIMGROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)
HAS_QIMG    = re.compile(r'class="qimg"')
QT_PAT      = re.compile(r'(<div class="qt">.*?</div>)', re.DOTALL)

# Subject folder → image path prefix mapping (study.html uses folder/images/, chapter uses images/)
SUBJECT_DIRS = {
    'endo':    '内分泌',
    'resp':    '呼吸器',
    'circ':    '循環器',
    'dige':    '消化器',
    'neur':    '神経',
    'hbp':     '肝胆膵',
    'jinzo_d': '腎臓',
    'hema':    '血液',
    'imma':    '免アレ膠',
}

# ── Step 1: Extract uid → qimg-row HTML from study.html ─────────────────────
print('Reading study.html...')
with open('study.html', encoding='utf-8') as f:
    study = f.read()

study_imgs = {}  # uid → qimg-row html (with folder-prefixed paths)
card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(study)]
for i, (pos, uid) in enumerate(card_starts):
    end = card_starts[i+1][0] if i+1 < len(card_starts) else len(study)
    card = study[pos:end]
    m = QIMGROW_PAT.search(card)
    if m and HAS_QIMG.search(m.group(0)):
        study_imgs[uid] = m.group(0)

print(f'study.html cards with images: {len(study_imgs)}')

# ── Step 2: For each chapter file, restore missing images ────────────────────
total_restored = 0

for prefix, folder in SUBJECT_DIRS.items():
    if not os.path.isdir(folder):
        continue
    folder_restored = 0
    for fn in sorted(os.listdir(folder)):
        if not fn.endswith('.html') or fn in ('mindmap.html', 'selfcheck_intro.html'):
            continue
        fpath = os.path.join(folder, fn)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()

        card_starts_ch = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
        if not card_starts_ch:
            continue

        result, prev, restored = [], 0, 0
        for i, (pos, uid) in enumerate(card_starts_ch):
            end = card_starts_ch[i+1][0] if i+1 < len(card_starts_ch) else len(content)
            result.append(content[prev:pos])
            card = content[pos:end]

            if uid in study_imgs and 'qimg-row' not in card:
                # Convert study.html paths back to chapter-relative paths
                # study.html: src="神経/images/foo.jpg" → chapter: src="images/foo.jpg"
                img_html = study_imgs[uid]
                img_html = re.sub(r'src="[^/"]*/images/', 'src="images/', img_html)

                # Insert after closing </div> of qt div
                qt_m = QT_PAT.search(card)
                if qt_m:
                    ins = qt_m.end()
                    card = card[:ins] + img_html + card[ins:]
                    restored += 1

            result.append(card)
            prev = end

        result.append(content[prev:])
        new_content = ''.join(result)

        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            folder_restored += restored

    if folder_restored:
        print(f'{folder}: restored {folder_restored} images')
    total_restored += folder_restored

print(f'\nTotal restored to chapter files: {total_restored}')
