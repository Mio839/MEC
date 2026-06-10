import os, glob

root = r'C:\Users\coool\Desktop\MEC'
files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)

changed = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    # Replace both old and already-versioned references
    if 'progress.js' not in content:
        continue
    new_content = content.replace('progress.js?v=2', 'progress.js?v=3')
    new_content = new_content.replace('progress.js"', 'progress.js?v=3"')
    new_content = new_content.replace("progress.js'", "progress.js?v=3'")
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        changed += 1

print(f"Updated {changed} files")
