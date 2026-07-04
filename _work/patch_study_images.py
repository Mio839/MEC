"""
Patch study.html to remove incorrectly attributed qimg-rows.
Uses id="qN" boundaries to correctly bound each card.
"""
import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Same filters as remove_wrong_images2.py
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

# In study.html, cards are separated by the id="qN" pattern on outer divs
CARD_PAT = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QIMGROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)

study_path = 'C:/Users/coool/Desktop/MEC/study.html'
with open(study_path, encoding='utf-8') as f:
    content = f.read()

card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
print(f'Total cards in study.html: {len(card_starts)}')

to_remove_uids = set()
for i, (pos, uid) in enumerate(card_starts):
    end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
    card = content[pos:end_pos]
    if 'qimg-row' not in card: continue
    qt_m = re.search(r'<div class="qt">(.*?)</div>', card, re.DOTALL)
    if not qt_m: continue
    qt_text = re.sub(r'<[^>]+>', '', qt_m.group(1)).strip()
    if IMG_NEEDED.search(qt_text): continue
    if CLINICAL_CASE.search(qt_text): continue
    to_remove_uids.add(uid)

print(f'qimg-rows to remove: {len(to_remove_uids)}')

# Now remove
removed = 0
for i, (pos, uid) in enumerate(card_starts):
    if uid not in to_remove_uids: continue
    end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
    card_region = content[pos:end_pos]
    new_region = QIMGROW_PAT.sub('', card_region, count=1)
    if new_region != card_region:
        content = content[:pos] + new_region + content[end_pos:]
        # Adjust subsequent positions — rebuild card_starts to be safe
        removed += 1

# Since we modified content in-place with position adjustments being tricky,
# do it in a single pass instead: build a new content string
print(f'Actually rebuilding with single-pass approach...')

with open(study_path, encoding='utf-8') as f:
    content = f.read()

card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]

result_parts = []
prev_end = 0
removed = 0

for i, (pos, uid) in enumerate(card_starts):
    end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
    card_region = content[pos:end_pos]

    result_parts.append(content[prev_end:pos])

    if uid in to_remove_uids:
        new_region = QIMGROW_PAT.sub('', card_region, count=1)
        result_parts.append(new_region)
        if new_region != card_region:
            removed += 1
    else:
        result_parts.append(card_region)

    prev_end = end_pos

result_parts.append(content[prev_end:])
new_content = ''.join(result_parts)

with open(study_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Done: removed {removed} qimg-rows from study.html')
remaining = new_content.count('qimg-row')
print(f'Remaining qimg-row occurrences: {remaining}')
