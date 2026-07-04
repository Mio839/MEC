"""
Remove wrongly attributed qimg-rows from study.html and chapter files.
Criterion: remove if question text contains NO image-related keywords.
(No CLINICAL_CASE exception - that was too conservative and kept wrong images.)
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

CARD_PAT   = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QIMGROW_PAT = re.compile(r'<div class="qimg-row">.*?</div>', re.DOTALL)
QT_PAT     = re.compile(r'<div class="qt">(.*?)</div>', re.DOTALL)


def find_wrong_uids(content):
    card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
    wrong = set()
    for i, (pos, uid) in enumerate(card_starts):
        end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
        card = content[pos:end_pos]
        if 'qimg-row' not in card:
            continue
        qt_m = QT_PAT.search(card)
        if not qt_m:
            continue
        qt_text = re.sub(r'<[^>]+>', '', qt_m.group(1)).strip()
        if not IMG_NEEDED.search(qt_text):
            wrong.add(uid)
    return wrong, card_starts


def remove_wrong_images(content, wrong_uids, card_starts):
    if not wrong_uids:
        return content, 0
    result_parts = []
    prev_end = 0
    removed = 0
    for i, (pos, uid) in enumerate(card_starts):
        end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
        result_parts.append(content[prev_end:pos])
        card_region = content[pos:end_pos]
        if uid in wrong_uids:
            new_region = QIMGROW_PAT.sub('', card_region, count=1)
            result_parts.append(new_region)
            if new_region != card_region:
                removed += 1
        else:
            result_parts.append(card_region)
        prev_end = end_pos
    result_parts.append(content[prev_end:])
    return ''.join(result_parts), removed


# ── study.html ────────────────────────────────────────────────────────────────
study_path = 'study.html'
with open(study_path, encoding='utf-8') as f:
    content = f.read()

wrong_uids, card_starts = find_wrong_uids(content)
print(f'study.html: {len(wrong_uids)} wrong images to remove')
new_content, removed = remove_wrong_images(content, wrong_uids, card_starts)
if removed:
    with open(study_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'  → removed {removed}')

# ── Chapter files ─────────────────────────────────────────────────────────────
DIRS = ['内分泌','呼吸器','循環器','消化器','神経','肝胆膵','腎臓','血液']
total_removed = 0
for d in DIRS:
    dir_removed = 0
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.html') or fn in ('mindmap.html', 'selfcheck_intro.html'):
            continue
        fpath = os.path.join(d, fn)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()
        wrong_uids, card_starts = find_wrong_uids(content)
        if not wrong_uids:
            continue
        new_content, removed = remove_wrong_images(content, wrong_uids, card_starts)
        if removed:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            dir_removed += removed
    if dir_removed:
        print(f'{d}: removed {dir_removed}')
    total_removed += dir_removed

print(f'\nTotal removed: {removed + total_removed}')
