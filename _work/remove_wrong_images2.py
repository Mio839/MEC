"""
Remove incorrectly attributed images from question cards.
Removes qimg-row from any card where:
  - the question text has NO image keyword
  - AND is NOT a clinical case (patient demographic) question

This is the correct approach: if no image keyword appears in the question,
the image was mis-attributed by the PDF extraction script.
"""
import re, os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

IMG_NEEDED = re.compile(
    r'を示す|示す|図[をにのは（(]|図$|模式図|断面図|模型図|前額断|横断|断面|'
    r'写真|画像|グラフ|曲線|波形|フローシート|スペクトル|スライド|'
    r'MRI|CT|エックス線|X線|Xp|レントゲン|シンチ|PET|超音波|エコー|内視鏡|マンモ|'
    r'脳波|筋電図|心電図|心音|聴力|オージオ|'
    r'染色|病理|顕微鏡|組織像|細胞像|血液像|尿沈渣|骨髄像|染色体|核型|精液|'
    r'眼底|視野|細隙灯|蛍光|'
    r'顔貌|顔写真|皮疹|皮膚所見|皮膚の|皮膚変化|'
    r'以下に示す|次に示す|下に示す|右に示す|左に示す|'
    r'\(A\)|\(B\)|\(C\)|\(a\)|\(b\)|（A）|（B）|（C）|（a）|（b）|'
    r'【図|【写真|〔図|〔写真|ABを|AとBを|'
    r'嚥下造影|シェーマ|造影',
    re.IGNORECASE
)

CLINICAL_CASE = re.compile(
    r'\d{1,3}歳|男性|女性|患者|症例|男児|女児|乳児|小児|新生児'
)

CARD_PAT = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
SUBJECTS = ['内分泌','呼吸器','循環器','消化器','神経','肝胆膵','腎臓','血液']

to_remove = []  # (subj_dir, fn, uid, qt_text)

for subj in SUBJECTS:
    subj_dir = f'C:/Users/coool/Desktop/MEC/{subj}'
    if not os.path.isdir(subj_dir): continue
    for fn in sorted(os.listdir(subj_dir)):
        if not fn.endswith('.html') or fn in ('mindmap.html','selfcheck_intro.html'): continue
        with open(f'{subj_dir}/{fn}', encoding='utf-8') as f:
            content = f.read()
        card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
        for i, (pos, uid) in enumerate(card_starts):
            end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
            card = content[pos:end_pos]
            if 'qimg-row' not in card: continue
            qt_m = re.search(r'<div class="qt">(.*?)</div>', card, re.DOTALL)
            if not qt_m: continue
            qt_text = re.sub(r'<[^>]+>', '', qt_m.group(1)).strip()
            if IMG_NEEDED.search(qt_text): continue
            if CLINICAL_CASE.search(qt_text): continue
            to_remove.append((subj_dir, fn, uid, qt_text))

print(f'Images to remove: {len(to_remove)}')
for _, fn, uid, qt in to_remove:
    print(f'  [{uid}] {qt[:80]}')

# ── Patch chapter HTML files ──────────────────────────────────────────────────
QIMGROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)

by_file = {}
for subj_dir, fn, uid, qt in to_remove:
    by_file.setdefault((subj_dir, fn), []).append(uid)

chapter_count = 0
for (subj_dir, fn), uids in sorted(by_file.items()):
    fpath = os.path.join(subj_dir, fn)
    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    changed = False
    for uid in uids:
        card_m = re.search(rf'data-uid="{re.escape(uid)}" id="q\d+"', content)
        if not card_m:
            print(f'  WARNING: {uid} not found in {fn}')
            continue
        next_card = re.search(r'data-uid="[^"]+" id="q\d+"', content[card_m.end():])
        end_pos = card_m.end() + next_card.start() if next_card else card_m.end() + 8000
        card_region = content[card_m.start():end_pos]
        new_region = QIMGROW_PAT.sub('', card_region, count=1)
        if new_region != card_region:
            content = content[:card_m.start()] + new_region + content[end_pos:]
            changed = True
        else:
            print(f'  NOTE: qimg-row already removed for {uid} in {fn}')
    if changed:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        chapter_count += 1
        print(f'Patched {fn} ({len(uids)} removals)')

print(f'\nChapter files updated: {chapter_count}')

# ── Patch study.html ──────────────────────────────────────────────────────────
study_path = 'C:/Users/coool/Desktop/MEC/study.html'
all_uids = {uid for _, _, uid, _ in to_remove}

with open(study_path, encoding='utf-8') as f:
    study = f.read()

study_changed = False
study_count = 0
for uid in sorted(all_uids):
    # study.html uses data-uid but may not have id="qN" on the outer div
    card_m = re.search(rf'data-uid="{re.escape(uid)}"', study)
    if not card_m:
        continue
    next_card = re.search(r'data-uid="[^"]+"', study[card_m.end():])
    end_pos = card_m.end() + next_card.start() if next_card else card_m.end() + 8000
    card_region = study[card_m.start():end_pos]
    new_region = QIMGROW_PAT.sub('', card_region, count=1)
    if new_region != card_region:
        study = study[:card_m.start()] + new_region + study[end_pos:]
        study_changed = True
        study_count += 1

if study_changed:
    with open(study_path, 'w', encoding='utf-8') as f:
        f.write(study)
    print(f'Patched study.html ({study_count} removals)')
else:
    print('study.html: no changes (UIDs may not be embedded there)')

print('\nDone.')
