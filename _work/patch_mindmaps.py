"""
1. Fix broken icons in index.html (⚕️→🔶, 💨→🌬️)
2. Add cross-reference link click handlers to all 9 individual subject mindmaps
"""
import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/Users/coool/Desktop/MEC'

# ── Task 1: Fix index.html icons ─────────────────────────────────────────────
print('=== Fixing index.html icons ===')
path = os.path.join(BASE, 'index.html')
with open(path, encoding='utf-8') as f:
    content = f.read()

# ⚕️ (U+2695 + U+FE0F) → 🔶 (Large Orange Diamond, Unicode 6.0)
# 💨 (U+1F4A8) → 🌬️ (Wind Face, Unicode 7.0, iOS 9.1+)
before = content
content = content.replace("href: '肝胆膵/mindmap.html', color: '#E65100', icon: '⚕️'",
                           "href: '肝胆膵/mindmap.html', color: '#E65100', icon: '\U0001F536'")
content = content.replace("href: '呼吸器/mindmap.html', color: '#0288D1', icon: '\U0001f4a8'",
                           "href: '呼吸器/mindmap.html', color: '#0288D1', icon: '\U0001F32C️'")
if content != before:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  index.html: icons updated')
else:
    print('  index.html: no change (icons may already be updated)')

# ── Task 2: Patch individual subject mindmaps ────────────────────────────────
print('\n=== Patching individual subject mindmaps ===')

MINDMAPS = [
    '内分泌/mindmap.html',
    '呼吸器/mindmap.html',
    '循環器/mindmap.html',
    '消化器/mindmap.html',
    '神経/mindmap.html',
    '肝胆膵/mindmap.html',
    '腎臓/mindmap.html',
    '血液/mindmap.html',
    '免アレ膠/mindmap.html',
]

# Code to insert after DIS_CHIDX initialization CHAPTERS.forEach
DIS_OBJ_INIT = 'const DIS_OBJ={};CHAPTERS.forEach(ch=>ch.diseases.forEach(dis=>{DIS_OBJ[dis.id]=dis;}));'

# showRelPanel function (inserted before hidePanel)
SHOW_REL_PANEL = (
    "function showRelPanel(rel){"
    "const fd=DIS_OBJ[rel.from],td=DIS_OBJ[rel.to];"
    "const pCh=document.getElementById('panelCh');"
    "pCh.textContent='⇔ '+(rel.label||'関連');"  # ⇔ 関連
    "pCh.style.background=rel.color||'#888';"
    "pCh.style.color='#fff';"
    "document.getElementById('panelTitle').textContent="
    "(fd?fd.label:rel.from)+' ⇔ '+(td?td.label:rel.to);"
    "const ul=document.getElementById('panelKeys');ul.innerHTML='';"
    "document.getElementById('panelImgs').innerHTML='';"
    "const ci=DIS_CHIDX[rel.from];"
    "const lnk=document.getElementById('panelLink');"
    "lnk.href=(ci!==undefined?CHAPTERS[ci].link:'#');lnk.style.display='';"
    "document.getElementById('panel').classList.add('show');}"
)

# Hit path code (added right after rel._path is set)
HIT_CODE = (
    "const hit=svgNS('path',{d:`M ${fp.x} ${fp.y} Q ${cpx} ${cpy} ${tp.x} ${tp.y}`,"
    "fill:'none',stroke:'transparent','stroke-width':'15',cursor:'pointer'});"
    "hit.addEventListener('click',e=>{e.stopPropagation();showRelPanel(rel);});"
    "hit.addEventListener('touchstart',e=>{e.stopPropagation();showRelPanel(rel);},"
    "{passive:true});"
    "layerRelations.append(hit);rel._hit=hit;"
)

# BG click code (added after rel._label is set, inside if(!isSameCh))
BG_CLICK = (
    "bg.style.cursor='pointer';"
    "bg.addEventListener('click',e=>{e.stopPropagation();showRelPanel(rel);});"
)

updated = 0
skipped = 0

for mm in MINDMAPS:
    path = os.path.join(BASE, mm)
    with open(path, encoding='utf-8') as f:
        content = f.read()

    if 'showRelPanel' in content:
        print(f'  {mm}: already patched, skipping')
        skipped += 1
        continue

    original = content

    # ── Step A: Add DIS_OBJ after DIS_CHIDX initialization ──────────────────
    # Find the CHAPTERS.forEach that sets DIS_CHIDX
    # Pattern: matches DIS_CHIDX[dis.id]=ci (with optional spaces)
    # We need to find the end of this forEach statement
    # The forEach ends with ); or });
    m = re.search(
        r'(CHAPTERS\.forEach\([^)]*\)\s*\{[^}]*DIS_CHIDX\[dis\.id\]\s*=\s*ci\s*;[^}]*\}\s*\);)',
        content
    )
    if not m:
        # Try multi-line match
        m = re.search(
            r'(CHAPTERS\.forEach\(.*?DIS_CHIDX\[dis\.id\]\s*=\s*ci\s*;.*?\}\s*\)\s*;)',
            content, re.DOTALL
        )
    if m:
        insert_pos = m.end()
        # Check if there's already a newline
        prefix = '\n' if content[insert_pos:insert_pos+1] != '\n' else ''
        content = content[:insert_pos] + prefix + DIS_OBJ_INIT + content[insert_pos:]
    else:
        print(f'  {mm}: WARNING - could not find DIS_CHIDX forEach, trying simpler match')
        # Fallback: find DIS_CHIDX={} and insert after the next };) pattern
        idx = content.find('DIS_CHIDX')
        if idx != -1:
            # Find the end of the following forEach
            end_idx = content.find('});', idx)
            if end_idx == -1:
                end_idx = content.find(');', idx)
            if end_idx != -1:
                insert_pos = end_idx + 3
                content = content[:insert_pos] + '\n' + DIS_OBJ_INIT + content[insert_pos:]

    # ── Step B: Add showRelPanel before hidePanel ────────────────────────────
    idx = content.find('function hidePanel()')
    if idx != -1:
        content = content[:idx] + SHOW_REL_PANEL + '\n' + content[idx:]
    else:
        print(f'  {mm}: WARNING - hidePanel not found')

    # ── Step C: Add hit path after rel._path is assigned ─────────────────────
    # Pattern handles: rel._path=path; or rel._path = path;
    m2 = re.search(r'rel\._path\s*=\s*path\s*;', content)
    if m2:
        insert_pos = m2.end()
        content = content[:insert_pos] + HIT_CODE + content[insert_pos:]
    else:
        print(f'  {mm}: WARNING - rel._path assignment not found')

    # ── Step D: Add bg click handler after rel._label is assigned ────────────
    # Pattern handles various spacing: rel._bg=bg;rel._label=lt; etc.
    m3 = re.search(r'rel\._bg\s*=\s*bg\s*;\s*rel\._label\s*=\s*lt\s*;', content)
    if m3:
        insert_pos = m3.end()
        content = content[:insert_pos] + BG_CLICK + content[insert_pos:]
    else:
        print(f'  {mm}: WARNING - rel._label assignment not found')

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  {mm}: patched')
        updated += 1
    else:
        print(f'  {mm}: no changes made')
        skipped += 1

print(f'\nDone. Updated: {updated}, Skipped: {skipped}')
