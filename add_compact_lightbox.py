import os, glob, re

root = r'C:\Users\coool\Desktop\MEC'
files = [f for f in glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
         if os.path.basename(f) not in ('study.html', 'index.html', 'stats.html')]

# CSS to inject inside existing <style> block (before </style>)
CSS_INJECT = (
    '.qimg{cursor:zoom-in!important;transition:none!important;}\n'
    '.qimg:active{max-height:450px!important;max-width:80%!important;}\n'
    '#imgLightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;align-items:center;justify-content:center;cursor:zoom-out;}\n'
    '#imgLightbox.open{display:flex;}\n'
    '#imgLightbox img{max-width:95vw;max-height:90vh;border-radius:8px;object-fit:contain;}\n'
    '.compact-mode .cs,.compact-mode .ab,.compact-mode .eg{display:none!important;}\n'
    '.compact-mode .qc.compact-open .cs{display:block!important;}\n'
    '.compact-mode .qc.compact-open .ab{display:flex!important;}\n'
    '.compact-mode .qc.compact-open .eg{display:grid!important;}\n'
    '.compact-mode .qc:not(.compact-open) .qt{cursor:pointer;}\n'
    '.compact-mode .qc:not(.compact-open) .qt::after{content:" ▼";font-size:10px;opacity:.35;vertical-align:middle;}\n'
    '.nb2.compact-on{background:#2E7D32;border-color:#2E7D32;color:#fff;}\n'
)

# JS + HTML to inject before </body></html>
INJECT = """\
<script>
var compactMode=false;
function toggleCompact(){compactMode=!compactMode;document.body.classList.toggle('compact-mode',compactMode);if(!compactMode)document.querySelectorAll('.qc.compact-open').forEach(function(el){el.classList.remove('compact-open');});var btn=document.getElementById('compactBtn');if(btn){btn.textContent=compactMode?'📋 通常表示':'📋 コンパクト';btn.classList.toggle('compact-on',compactMode);}}
document.addEventListener('click',function(e){if(!compactMode)return;var card=e.target.closest?e.target.closest('.qc[data-uid]'):null;if(!card)return;if(e.target.closest('button, a, input, textarea'))return;card.classList.toggle('compact-open');});
function openLightbox(src){var lb=document.getElementById('imgLightbox');var img=document.getElementById('imgLightboxImg');if(!lb||!img)return;img.src=src;lb.classList.add('open');}
function closeLightbox(){var lb=document.getElementById('imgLightbox');if(lb)lb.classList.remove('open');}
document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.qimg').forEach(function(img){img.addEventListener('click',function(e){e.stopPropagation();openLightbox(this.src);});});});
</script>
<div id="imgLightbox" onclick="closeLightbox()"><img id="imgLightboxImg" src="" alt=""></div>
"""

BM_BTN_COMPACT = '<button id="compactBtn" class="nb2" onclick="toggleCompact()">📋 コンパクト</button>'

changed = 0
skipped = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if 'compactBtn' in content:
        skipped += 1
        continue

    if 'class="qc"' not in content and 'class="qc ' not in content:
        skipped += 1
        continue

    orig = content

    # 1. Inject CSS before </style>
    content = content.replace('</style>', CSS_INJECT + '</style>', 1)

    # 2. Add compact button to sn2 (after bookmark button if present, else at end before </div>)
    if 'bookmarkBtn' in content:
        content = content.replace(
            '<button id="bookmarkBtn" class="nb2" style="margin-left:auto" onclick="saveBookmark()">📖 しおり</button></div>',
            '<button id="bookmarkBtn" class="nb2" style="margin-left:auto" onclick="saveBookmark()">📖 しおり</button>' + BM_BTN_COMPACT + '</div>'
        )
    else:
        content = re.sub(
            r"(onclick=\"setState\('done'\)\">済み</button>)(</div>)",
            r'\1' + BM_BTN_COMPACT + r'\2',
            content
        )

    # 3. Inject JS + lightbox HTML before </body></html>
    content = content.replace('</body></html>', INJECT + '</body></html>')

    if content != orig:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        changed += 1
    else:
        skipped += 1

print(f"Updated {changed} files, skipped {skipped}")
