import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CARD_PAT = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QIMGROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)
QT_PAT = re.compile(r'<div class="qt">(.*?)</div>', re.DOTALL)
IMG_SRC_PAT = re.compile(r'src="([^"]+)"')

# Find Q88 in 免アレ膠 chapter files
for fn in ['免アレ膠/ch01_immare.html','免アレ膠/ch02_immare.html','免アレ膠/ch03_immare.html',
           '免アレ膠/ch04_immare.html','免アレ膠/ch05_immare.html','免アレ膠/ch06_immare.html',
           '免アレ膠/ch07_immare.html','免アレ膠/ch08_immare.html','免アレ膠/ch09_immare.html']:
    try:
        with open(fn, encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        continue

    card_starts = [(m.start(), m.group(1), m.group(2)) for m in CARD_PAT.finditer(content)]
    for i, (pos, uid, qnum) in enumerate(card_starts):
        if qnum != '88':
            continue
        end = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
        card = content[pos:end]
        img_m = QIMGROW_PAT.search(card)
        qt_m = QT_PAT.search(card)
        qt_text = re.sub(r'<[^>]+>', '', qt_m.group(1)).strip()[:200] if qt_m else '(no qt)'
        print(f'File: {fn}')
        print(f'UID: {uid}')
        print(f'Question text: {qt_text}')
        if img_m:
            srcs = IMG_SRC_PAT.findall(img_m.group(0))
            print(f'Images: {srcs}')
        else:
            print('Images: none')
        print()

# Also check study.html
print('=== study.html ===')
with open('study.html', encoding='utf-8') as f:
    study = f.read()

card_starts = [(m.start(), m.group(1), m.group(2)) for m in CARD_PAT.finditer(study)]
for i, (pos, uid, qnum) in enumerate(card_starts):
    if 'imma' not in uid:
        continue
    end = card_starts[i+1][0] if i+1 < len(card_starts) else len(study)
    card = study[pos:end]
    if '<div class="qimg-row">' not in card:
        continue
    qt_m = QT_PAT.search(card)
    qt_text = re.sub(r'<[^>]+>', '', qt_m.group(1)).strip()[:150] if qt_m else '(no qt)'
    img_m = QIMGROW_PAT.search(card)
    srcs = IMG_SRC_PAT.findall(img_m.group(0)) if img_m else []
    print(f'{uid}: {qt_text[:80]}...')
    print(f'  imgs: {srcs}')
