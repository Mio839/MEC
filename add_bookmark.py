import os, glob, re

root = r'C:\Users\coool\Desktop\MEC'
files = [f for f in glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
         if os.path.basename(f) not in ('study.html', 'index.html', 'stats.html')]

BM_JS = """\
<script>
function _bmPageKey(){var p=location.pathname.split('/');var last=p[p.length-1];return last.replace(/\\.html$/i,'');}
function saveBookmark(){var cards=[].slice.call(document.querySelectorAll('.qc[data-uid]')).filter(function(c){return c.style.display!=='none';});if(!cards.length)return;var hdr=document.querySelector('.mec-ch-prog');var hdrH=hdr?hdr.getBoundingClientRect().bottom:80;var best=null;for(var i=0;i<cards.length;i++){if(cards[i].getBoundingClientRect().top>=hdrH-10){best=cards[i];break;}}if(!best)best=cards[0];var bm=JSON.parse(localStorage.getItem('bookmark_v1')||'{}');bm[_bmPageKey()]=best.dataset.uid;localStorage.setItem('bookmark_v1',JSON.stringify(bm));var btn=document.getElementById('bookmarkBtn');if(btn){btn.textContent='📖 保存済';setTimeout(function(){btn.textContent='📖 しおり';},1500);}}
function restoreBookmark(){var uid=(JSON.parse(localStorage.getItem('bookmark_v1')||'{}'))[_bmPageKey()];if(!uid)return;var card=document.querySelector('.qc[data-uid="'+uid+'"]');if(!card)return;if(card.style.display==='none'){setState('all');card=document.querySelector('.qc[data-uid="'+uid+'"]');}hideBmBanner();var hdr=document.querySelector('.mec-ch-prog');var offset=hdr?hdr.getBoundingClientRect().height+16:80;var y=card.getBoundingClientRect().top+(window.scrollY||document.documentElement.scrollTop)-offset;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});card.style.outline='2px solid #F5A623';setTimeout(function(){card.style.outline='';},2000);}
function hideBmBanner(){var b=document.getElementById('bmBanner');if(b)b.style.display='none';}
document.addEventListener('DOMContentLoaded',function(){var uid=(JSON.parse(localStorage.getItem('bookmark_v1')||'{}'))[_bmPageKey()];if(uid){var b=document.getElementById('bmBanner');if(b)b.style.display='flex';}});
</script>
"""

BM_BANNER = (
    '<div id="bmBanner" style="display:none;position:fixed;bottom:72px;left:50%;transform:translateX(-50%);'
    'background:#1A1A2E;color:#fff;border-radius:24px;padding:8px 16px;font-size:13px;font-weight:700;'
    'gap:8px;align-items:center;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.4);white-space:nowrap;">'
    '📖 前回の続きから'
    '<button onclick="restoreBookmark()" style="background:#F5A623;border:none;border-radius:16px;'
    'padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;color:#000;margin-left:4px;">再開</button>'
    '<button onclick="hideBmBanner()" style="background:none;border:none;color:rgba(255,255,255,.5);'
    'font-size:18px;cursor:pointer;padding:0 0 0 6px;line-height:1;">✕</button></div>\n'
)

BM_BTN = '<button id="bookmarkBtn" class="nb2" style="margin-left:auto" onclick="saveBookmark()">📖 しおり</button>'

changed = 0
skipped = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if 'bookmarkBtn' in content:
        skipped += 1
        continue

    if 'class="qc"' not in content and 'class="qc ' not in content:
        skipped += 1
        continue

    orig = content

    # Add bookmark button to end of .sn2 div (after 済み button, before </div>)
    content = re.sub(
        r"(onclick=\"setState\('done'\)\">済み</button>)(</div>)",
        r'\1' + BM_BTN + r'\2',
        content
    )

    # Inject JS + banner before </body></html>
    content = content.replace('</body></html>', BM_JS + BM_BANNER + '</body></html>')

    if content != orig:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        changed += 1
    else:
        skipped += 1

print(f"Updated {changed} files, skipped {skipped}")
