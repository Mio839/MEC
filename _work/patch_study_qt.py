"""Apply same qt restoration to study.html for all subjects."""
import re, os, sys, fitz
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SUBJECTS = {
    'endo':  'MEC臓器別講座・内分泌代謝_問題（表紙2026）(1).pdf',
    'resp':  'MEC臓器別講座・呼吸器_問題（表紙2026）.pdf',
    'circ':  'MEC臓器別講座・循環器_問題（表紙2026）.pdf',
    'dige':  'MEC臓器別講座・消化管_問題（表紙2026）.pdf',
    'hbp':   'MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf',
    'jinzo': 'MEC臓器別講座・腎_問題（表紙2026）.pdf',
    'hema':  'MEC臓器別講座・血液_問題（表紙2026）.pdf',
}

Q_HEADER    = re.compile(r'^\s*\d+\.\s*[（(]([A-Z0-9]+-\d+[A-Z]?)[）)][^\n]*\n', re.MULTILINE)
CHOICE_LINE = re.compile(r'^[ａ-ｅ][\s　\t]', re.MULTILINE)
Q_END_PAT   = re.compile(r'((?:のはどれか|はどれか|についてどれか|を選べ|を\d+つ選べ)。(?:\d+つ選べ。)?)\s*$', re.DOTALL)
CARD_PAT    = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QE_PAT      = re.compile(r'<span[^>]*class="qe"[^>]*>\(?([^<()（）]+?)\)?</span>')
QT_PAT      = re.compile(r'(<div class="qt">)(.*?)(</div>)', re.DOTALL)

def clean_block(text):
    text = re.sub(r'(?:^.{1,2}\n){6,}', '', text, flags=re.MULTILINE)
    text = re.sub(r'^ *Q-\d+\n', '', text, flags=re.MULTILINE)
    text = text.replace('メック予備校用', '')
    text = re.sub(r'(?:^\d{2,3}\n)+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n[A-E①-⑤]\n(?:[A-E①-⑤]\n)*', '\n', text)
    text = re.sub(r'^\s*[★→↗]\d*\s*\n', '', text, flags=re.MULTILINE)
    return text.strip()

def build_stem_map(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = '\n'.join(page.get_text() for page in doc)
    blocks = [clean_block(b) for b in re.split(r'□□□', full_text)]
    stem_map = {}
    for block in blocks:
        block = block.strip()
        if not block: continue
        m = Q_HEADER.search(block)
        if not m: continue
        exam_id = m.group(1)
        after = block[m.end():]
        choice_m = CHOICE_LINE.search(after)
        stem_raw = after[:choice_m.start()] if choice_m else after
        lines = stem_raw.split('\n')
        merged, buffer = [], ''
        for line in lines:
            line = line.strip()
            if not line:
                if buffer: merged.append(buffer); buffer = ''
                continue
            if buffer:
                if buffer.endswith(('。','、','．','：','）','】','〕')):
                    merged.append(buffer); buffer = line
                else:
                    buffer += line
            else:
                buffer = line
        if buffer: merged.append(buffer)
        stem_clean = '\n'.join(merged).strip()
        if stem_clean and exam_id not in stem_map:
            stem_map[exam_id] = stem_clean
    return stem_map

def format_qt_html(stem):
    end_m = Q_END_PAT.search(stem)
    if not end_m:
        return stem.replace('\n', '<br>')
    q_end, q_start = end_m.group(1), end_m.start(1)
    pre = stem[:q_start]
    last_sep = max(pre.rfind('。'), pre.rfind('\n'))
    clause_start = last_sep + 1 if last_sep >= 0 else 0
    prefix = pre[:clause_start].strip()
    strong_text = pre[clause_start:].strip()
    if prefix:
        return prefix.replace('\n', '<br>') + '<br>' + f'<strong>{strong_text}</strong>' + q_end
    return f'<strong>{strong_text}</strong>' + q_end

# Load study.html once
with open('study.html', encoding='utf-8') as f:
    content = f.read()

total_updated = 0

for key, pdf_name in SUBJECTS.items():
    pdf_path = f'MEC問題文pdf/{pdf_name}'
    stem_map = build_stem_map(pdf_path)
    print(f'{key}: {len(stem_map)} stems extracted')

    card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]
    replacements = {}
    for i, (pos, uid) in enumerate(card_starts):
        if not uid.startswith(key + '_'): continue
        end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
        card_slice = content[pos:end_pos]
        qe_m = QE_PAT.search(card_slice[:600])
        if not qe_m: continue
        exam_id = qe_m.group(1).strip()
        stem = stem_map.get(exam_id)
        if stem is None: continue
        new_qt = format_qt_html(stem)
        qt_m = QT_PAT.search(card_slice)
        if not qt_m: continue
        old_plain = re.sub(r'<[^>]+>', '', qt_m.group(2)).strip()
        new_plain  = re.sub(r'<[^>]+>', '', new_qt).strip()
        if old_plain != new_plain:
            replacements[uid] = (qt_m.group(2), new_qt)

    if not replacements:
        print(f'  → no changes needed')
        continue

    uid_pat = '|'.join(re.escape(u) for u in replacements)
    block_re = re.compile(
        rf'(data-uid="(?:{uid_pat})" id="q\d+")(.*?)(?=data-uid="[^"]*" id="q\d+"|$)',
        re.DOTALL
    )
    def make_replacer(reps):
        def replacer(m):
            uid_m = re.search(r'data-uid="([^"]+)"', m.group(1))
            if not uid_m: return m.group(0)
            uid = uid_m.group(1)
            if uid not in reps: return m.group(0)
            old_i, new_i = reps[uid]
            full = m.group(1) + m.group(2)
            return QT_PAT.sub(lambda qm: qm.group(1) + new_i + qm.group(3), full, count=1)
        return replacer

    content = block_re.sub(make_replacer(replacements), content)
    total_updated += len(replacements)
    print(f'  → {len(replacements)} cards updated')

with open('study.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nTotal: {total_updated} cards updated in study.html')
