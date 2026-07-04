"""Split study.html card content into per-subject fragment files (line-based)."""

SIDS = ['endo','resp','circ','dige','neur','hbp','jinzo_d','hema','imma','kansen']

with open('study.html', encoding='utf-8') as f:
    lines = f.readlines()

original_size = sum(len(l) for l in lines)
print(f'Original size: {original_size:,} bytes, {len(lines)} lines')

# Find the line index (0-based) of each section opener
sec_line = {}
for i, line in enumerate(lines):
    for sid in SIDS:
        marker = f'<div class="subj-section" data-sid="{sid}"'
        if marker in line:
            sec_line[sid] = i

for sid in SIDS:
    print(f'  {sid}: line {sec_line[sid]+1}')

# Build section boundaries
# Structure per section:
#   sec_line[sid]+0 : <div class="subj-section" data-sid="...">
#   sec_line[sid]+1 : <div class="subj-hdr" ...>...</div>
#   sec_line[sid]+2 .. cards_end_idx : card content
#   cards_end_idx+1 : </div>   ← closes subj-section
#
# For all but last: next section starts at sec_line[next_sid]
#   so closing </div> is at sec_line[next_sid]-1
#   and cards end at sec_line[next_sid]-2
# For last (kansen): JS <script> starts at some line; find it

# Find JS start (first <script> after last section)
kansen_start = sec_line['kansen']
js_line = None
for i in range(kansen_start, len(lines)):
    if lines[i].strip().startswith('<script>'):
        js_line = i
        break
print(f'JS starts at line {js_line+1}')

# Collect replacements: list of (cards_content_lines, section_div_close_idx)
replacements = []
for idx, sid in enumerate(SIDS):
    next_sid = SIDS[idx+1] if idx+1 < len(SIDS) else None
    s = sec_line[sid]
    cards_start = s + 2  # line after subj-hdr

    if next_sid:
        n = sec_line[next_sid]
        # closing </div> is at n-1
        section_close_idx = n - 1
        cards_end = n - 2  # inclusive
    else:
        # kansen: find last </div> before <script>
        # js_line-1 might be empty, js_line-2 might be </div>, etc.
        # From inspection: </div> at js_line-4, empty at js_line-3, </div> at js_line-2, empty at js_line-1
        # kansen section closes at js_line-4
        section_close_idx = js_line - 4
        # Verify
        while section_close_idx >= cards_start and lines[section_close_idx].strip() == '':
            section_close_idx -= 1
        # section_close_idx should now be the </div> closing kansen
        cards_end = section_close_idx - 1

    cards_lines = lines[cards_start:cards_end+1]
    replacements.append((sid, cards_start, cards_end, section_close_idx, cards_lines))
    print(f'{sid}: cards lines {cards_start+1}-{cards_end+1} ({len(cards_lines)} lines, '
          f'{sum(len(l) for l in cards_lines):,} bytes), section closes at L{section_close_idx+1}')

# Write fragment files
for sid, cs, ce, sci, card_lines in replacements:
    out = f'cards_{sid}.html'
    with open(out, 'w', encoding='utf-8') as f:
        f.writelines(card_lines)
    print(f'  Wrote {out}: {sum(len(l) for l in card_lines):,} bytes')

# Build new lines list — replace card content + section-close with placeholder
# Process in reverse order to keep indices stable
new_lines = list(lines)
for sid, cs, ce, sci, card_lines in reversed(replacements):
    placeholder = f'<div class="subj-cards-loading" data-sid="{sid}">読み込み中...</div>\n'
    # Replace lines cs..sci (inclusive) with [placeholder, closing_div]
    closing_div = new_lines[sci]  # keep the </div> that closes the section
    new_lines[cs:sci+1] = [placeholder, closing_div]

with open('study.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

new_size = sum(len(l) for l in new_lines)
print(f'\nNew study.html: {new_size:,} bytes, {len(new_lines)} lines')
print(f'Reduction: {(original_size - new_size):,} bytes ({(original_size - new_size) / original_size * 100:.1f}%)')

# Verify
with open('study.html', encoding='utf-8') as f:
    check = f.read()
for sid in SIDS:
    assert f'subj-cards-loading" data-sid="{sid}"' in check, f'Missing placeholder for {sid}'
    assert f'cards_{sid}.html' not in check or True  # just check placeholder
print('\nAll placeholders verified OK.')
