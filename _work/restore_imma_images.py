"""
Restore missing qimg-row and bi badge to imma cards in study.html.
These images exist in 免アレ膠/images/ and the chapter files but were
never included in study.html (or were incorrectly removed).
"""
import re, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CARD_PAT    = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
IMG_ROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)
QT_PAT      = re.compile(r'(</div>)(?=\s*<div class="cs">)')  # end of qt -> before choices
QE_SPAN     = re.compile(r'(<span[^>]*class="qe"[^>]*>[^<]*</span>)')
BI_BADGE    = '<span class="bg bi">📷 画像</span>'
FOLDER      = '免アレ膠'

# ── Step 1: Build uid -> corrected qimg-row HTML from chapter files ──────────
chapter_imgs = {}
for fn in sorted(os.listdir(FOLDER)):
    if not fn.endswith('.html') or fn in ('mindmap.html', 'selfcheck_intro.html'):
        continue
    with open(os.path.join(FOLDER, fn), encoding='utf-8') as f:
        content = f.read()
    card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
    for i, (pos, uid) in enumerate(card_starts):
        end = card_starts[i + 1][0] if i + 1 < len(card_starts) else len(content)
        card = content[pos:end]
        img_m = IMG_ROW_PAT.search(card)
        if not img_m:
            continue
        img_html = img_m.group(0).replace('src="images/', f'src="{FOLDER}/images/')
        chapter_imgs[uid] = img_html

print(f'Chapter images found: {len(chapter_imgs)}')

# ── Step 2: Patch study.html ─────────────────────────────────────────────────
with open('study.html', encoding='utf-8') as f:
    study = f.read()

card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(study)]

result = []
prev = 0
img_added = badge_added = 0

for i, (pos, uid) in enumerate(card_starts):
    end = card_starts[i + 1][0] if i + 1 < len(card_starts) else len(study)
    result.append(study[prev:pos])
    card = study[pos:end]

    need_img   = uid in chapter_imgs and 'qimg-row' not in card
    need_badge = need_img and 'class="bg bi"' not in card[:500]

    if need_img:
        # Insert qimg-row after </div> that closes the qt div (before class="cs")
        # Find qt closing div and insert after it
        qt_close = re.search(r'(<div class="qt">.*?</div>)', card, re.DOTALL)
        if qt_close:
            ins = qt_close.end()
            card = card[:ins] + chapter_imgs[uid] + card[ins:]
            img_added += 1

    if need_badge:
        # Insert bi badge after qe span
        qe_m = QE_SPAN.search(card[:600])
        if qe_m:
            ins = qe_m.end()
            card = card[:ins] + BI_BADGE + card[ins:]
            badge_added += 1

    result.append(card)
    prev = end

result.append(study[prev:])
new_study = ''.join(result)

with open('study.html', 'w', encoding='utf-8') as f:
    f.write(new_study)

print(f'Images added to study.html: {img_added}')
print(f'Badges added to study.html: {badge_added}')
