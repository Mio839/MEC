import os, glob, re

root = r'C:\Users\coool\Desktop\MEC'
files = [f for f in glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
         if os.path.basename(f) not in ('study.html', 'index.html', 'stats.html')]

changed = 0
for f in files:
    with open(f, 'r', encoding='utf-8', newline='') as fh:
        content = fh.read()

    # Skip if setFilter already has scrollTo
    if re.search(r'function setFilter\(f\)[^}]*scrollTo', content):
        continue
    if 'class="qc"' not in content and 'class="qc ' not in content:
        continue

    orig = content

    content = re.sub(
        r"(function setFilter\(f\)\s*\{[^}]*applyFilters\(\);)",
        r"\1\r\n  window.scrollTo({ top: 0, behavior: 'smooth' });",
        content
    )
    content = re.sub(
        r"(function setState\(s\)\s*\{[^}]*applyFilters\(\);)",
        r"\1\r\n  window.scrollTo({ top: 0, behavior: 'smooth' });",
        content
    )

    if content != orig:
        with open(f, 'w', encoding='utf-8', newline='') as fh:
            fh.write(content)
        changed += 1

print(f"Updated {changed} files")
