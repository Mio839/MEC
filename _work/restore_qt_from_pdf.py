"""
Restore full question text (qt) from the original PDF.
Replaces abbreviated <div class="qt"> content with the full clinical stem.

Usage: python restore_qt_from_pdf.py [subject_key]
  subject_key: one of neur, endo, resp, circ, dige, hbp, jinzo, hema
  Default: neur (神経)
"""
import re, os, sys, fitz
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Config per subject ────────────────────────────────────────────────────────
SUBJECTS = {
    'neur':  ('神経',  'MEC臓器別講座・神経_問題（表紙2026）.pdf'),
    'endo':  ('内分泌', 'MEC臓器別講座・内分泌代謝_問題（表紙2026）(1).pdf'),
    'resp':  ('呼吸器', 'MEC臓器別講座・呼吸器_問題（表紙2026）.pdf'),
    'circ':  ('循環器', 'MEC臓器別講座・循環器_問題（表紙2026）.pdf'),
    'dige':  ('消化器', 'MEC臓器別講座・消化管_問題（表紙2026）.pdf'),
    'hbp':   ('肝胆膵', 'MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf'),
    'jinzo': ('腎臓',  'MEC臓器別講座・腎_問題（表紙2026）.pdf'),
    'hema':  ('血液',  'MEC臓器別講座・血液_問題（表紙2026）.pdf'),
}

key = sys.argv[1] if len(sys.argv) > 1 else 'neur'
if key not in SUBJECTS:
    print(f'Unknown subject: {key}. Choose from: {list(SUBJECTS)}')
    sys.exit(1)

SUBJ_DIR, PDF_NAME = SUBJECTS[key]
PDF_PATH  = f'C:/Users/coool/Desktop/MEC/MEC問題文pdf/{PDF_NAME}'
HTML_BASE = f'C:/Users/coool/Desktop/MEC/{SUBJ_DIR}'

# ── Step 1: Extract stems from PDF ───────────────────────────────────────────
doc = fitz.open(PDF_PATH)

# Concatenate all page text
pages_text = []
for page in doc:
    pages_text.append(page.get_text())
full_text = '\n'.join(pages_text)

# Split by □□□ FIRST (before any cleanup, so separators aren't accidentally removed)
raw_blocks = re.split(r'□□□', full_text)

def clean_block(text):
    # Remove sidebar navigation (sequences of 1-2 char lines, 6+ consecutive)
    text = re.sub(r'(?:^.{1,2}\n){6,}', '', text, flags=re.MULTILINE)
    # Remove page markers like "Q-28\n"
    text = re.sub(r'^ *Q-\d+\n', '', text, flags=re.MULTILINE)
    # Remove watermarks
    text = text.replace('メック予備校用', '')
    # Remove isolated score numbers (2-3 digit standalone lines)
    text = re.sub(r'(?:^\d{2,3}\n)+', '', text, flags=re.MULTILINE)
    # Remove image label lines like "A\n" "B\n" at end of blocks
    text = re.sub(r'\n[A-E①-⑤]\n(?:[A-E①-⑤]\n)*', '\n', text)
    # Remove difficulty/remark markers: ↗1, ★, → etc. on their own lines
    text = re.sub(r'^\s*[★→↗]\d*\s*\n', '', text, flags=re.MULTILINE)
    return text.strip()

blocks = [clean_block(b) for b in raw_blocks]

# Parse each block into {exam_id: stem}
Q_HEADER = re.compile(
    r'^\s*\d+\.\s*[（(]([A-Z0-9]+-\d+[A-Z]?)[）)][^\n]*\n',
    re.MULTILINE
)
# Full-width hiragana choices: ａ～ｅ (or in some PDFs ａ　text)
CHOICE_LINE = re.compile(r'^[ａ-ｅ][\s　\t]', re.MULTILINE)

stem_map = {}  # exam_id → cleaned stem text

for block in blocks:
    block = block.strip()
    if not block:
        continue
    m = Q_HEADER.search(block)
    if not m:
        continue
    exam_id = m.group(1)
    after_header = block[m.end():]

    # Stem ends before the first choice line
    choice_m = CHOICE_LINE.search(after_header)
    if choice_m:
        stem = after_header[:choice_m.start()]
    else:
        stem = after_header

    # Normalize the stem text
    # Join soft-wrapped lines: if a line doesn't end with 。 or 、 or special char,
    # join with the next line (PDF layout artifact)
    lines = stem.split('\n')
    merged = []
    buffer = ''
    for line in lines:
        line = line.strip()
        if not line:
            if buffer:
                merged.append(buffer)
                buffer = ''
            continue
        if buffer:
            # Check if previous line ends a sentence
            if buffer.endswith(('。', '、', '．', '：', '）', '】', '〕', '↗1', '★', '→')):
                merged.append(buffer)
                buffer = line
            else:
                buffer = buffer + line
        else:
            buffer = line
    if buffer:
        merged.append(buffer)

    stem_clean = '\n'.join(merged).strip()

    if stem_clean and exam_id not in stem_map:
        stem_map[exam_id] = stem_clean

print(f'Extracted {len(stem_map)} question stems from PDF')

# ── Step 2: Format stem as HTML (add <strong> around question phrase) ─────────
Q_END_PAT = re.compile(
    r'((?:のはどれか|はどれか|についてどれか|を選べ|を\d+つ選べ)。(?:\d+つ選べ。)?)\s*$',
    re.DOTALL
)

def format_qt_html(stem: str) -> str:
    """Convert plain stem text to HTML with <strong> on the question phrase."""
    end_m = Q_END_PAT.search(stem)
    if not end_m:
        # No standard ending found — return plain (covers series stems etc.)
        return stem.replace('\n', '<br>')

    q_end   = end_m.group(1)           # e.g. "のはどれか。"
    q_start = end_m.start(1)           # index of the ending in stem

    pre  = stem[:q_start]
    # Find where the question clause starts (after last sentence-ending punct)
    last_sep = max(pre.rfind('。'), pre.rfind('\n'))
    clause_start = last_sep + 1 if last_sep >= 0 else 0

    prefix        = pre[:clause_start].strip()
    strong_text   = pre[clause_start:].strip()

    # Build HTML
    if prefix:
        html = prefix.replace('\n', '<br>') + '<br>' + f'<strong>{strong_text}</strong>' + q_end
    else:
        html = f'<strong>{strong_text}</strong>' + q_end

    return html

# ── Step 3: Update HTML files ─────────────────────────────────────────────────
CARD_PAT = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QE_PAT   = re.compile(r'<span[^>]*class="qe"[^>]*>\(?([^<()（）]+?)\)?</span>')
QT_PAT   = re.compile(r'(<div class="qt">)(.*?)(</div>)', re.DOTALL)

updated_files  = 0
updated_cards  = 0
not_found_eids = set()

for fn in sorted(os.listdir(HTML_BASE)):
    if not fn.endswith('.html') or fn in ('mindmap.html', 'selfcheck_intro.html'):
        continue
    fpath = os.path.join(HTML_BASE, fn)
    with open(fpath, encoding='utf-8') as f:
        content = f.read()

    # Build per-card replacement map first, then apply all at once
    replacements = {}  # uid -> (old_qt_inner, new_qt_inner)
    card_starts = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(content)]

    for i, (pos, uid) in enumerate(card_starts):
        end_pos = card_starts[i+1][0] if i+1 < len(card_starts) else len(content)
        card_slice = content[pos:end_pos]

        qe_m = QE_PAT.search(card_slice[:600])
        if not qe_m:
            continue
        exam_id = qe_m.group(1).strip()

        stem = stem_map.get(exam_id)
        if stem is None:
            not_found_eids.add(exam_id)
            continue

        new_qt_inner = format_qt_html(stem)
        qt_m = QT_PAT.search(card_slice)
        if not qt_m:
            continue

        old_inner = qt_m.group(2)
        old_plain = re.sub(r'<[^>]+>', '', old_inner).strip()
        new_plain  = re.sub(r'<[^>]+>', '', new_qt_inner).strip()

        if old_plain != new_plain:
            replacements[uid] = (old_inner, new_qt_inner)

    if not replacements:
        continue

    # Apply replacements via uid-targeted substitution (no position tracking needed)
    def make_replacer(uid_map):
        def replacer(m):
            uid = m.group(1)
            if uid not in uid_map:
                return m.group(0)
            old_inner, new_inner = uid_map[uid]
            # Replace only the first qt div after this card's uid
            card_text = m.group(0)
            new_card = QT_PAT.sub(
                lambda qm: qm.group(1) + new_inner + qm.group(3),
                card_text, count=1
            )
            return new_card
        return replacer

    # Match each full card block and apply replacements
    uid_pattern = '|'.join(re.escape(u) for u in replacements)
    card_block_pat = re.compile(
        rf'(data-uid="(?:{uid_pattern})" id="q\d+")(.*?)(?=data-uid="[^"]*" id="q\d+"|$)',
        re.DOTALL
    )

    def card_replacer(m):
        uid_m = re.search(r'data-uid="([^"]+)"', m.group(1))
        if not uid_m:
            return m.group(0)
        uid = uid_m.group(1)
        if uid not in replacements:
            return m.group(0)
        old_inner, new_inner = replacements[uid]
        full = m.group(1) + m.group(2)
        new_full = QT_PAT.sub(
            lambda qm: qm.group(1) + new_inner + qm.group(3),
            full, count=1
        )
        return new_full

    new_content = card_block_pat.sub(card_replacer, content)
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated_files += 1
        updated_cards += len(replacements)
        print(f'Updated {fn} ({len(replacements)} cards)')

print(f'\nDone: {updated_cards} cards updated across {updated_files} files')
if not_found_eids:
    print(f'Exam IDs not found in PDF ({len(not_found_eids)}):')
    for eid in sorted(not_found_eids)[:30]:
        print(f'  {eid}')
    if len(not_found_eids) > 30:
        print(f'  ...and {len(not_found_eids)-30} more')
