import os, glob, re

root = r'C:\Users\coool\Desktop\MEC'
files = [f for f in glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
         if os.path.basename(f) not in ('study.html', 'index.html', 'stats.html')]

JS = (
    '<script>\n'
    "document.addEventListener('keydown',function(e){if(e.key!=='Enter')return;"
    "var tag=document.activeElement&&document.activeElement.tagName;"
    "if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON')return;"
    "e.preventDefault();"
    "var hdr=document.querySelector('.mec-ch-prog');"
    "var hdrH=hdr?hdr.getBoundingClientRect().bottom:0;"
    "var cards=[].slice.call(document.querySelectorAll('.qc[data-uid]')).filter(function(c){return c.style.display!=='none';});"
    "var card=cards.find(function(c){var r=c.getBoundingClientRect();return r.top>=hdrH-10&&r.bottom>hdrH;})"
    "||cards.find(function(c){return c.getBoundingClientRect().bottom>hdrH;});"
    "if(card){var btn=card.querySelector('.mec-lap-btn');if(btn)btn.click();}});\n"
    '</script>\n'
)

changed = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if 'keydown' in content:
        continue
    if 'class="qc"' not in content and 'class="qc ' not in content:
        continue
    # Match </body> with optional whitespace then </html>, across lines
    new_content = re.sub(r'(</body>\s*</html>)', JS + r'\1', content, flags=re.IGNORECASE)
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        changed += 1

print(f"Updated {changed} files")
