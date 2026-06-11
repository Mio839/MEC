"""
transform_immare.py — 免アレ膠 HTMLファイルの完全変換スクリプト

実行内容:
  1. PDFから画像を抽出して 免アレ膠/images/ に保存
  2. 画像のある問題に bi マーカーと qimg-row を注入
  3. 各問題カードに data-uid と MEC コントロールを追加
  4. sn バーの更新 (フィルターボタン追加・setFilter 化)
  5. mec-ch-prog バー追加
  6. sn2 バー (状態フィルター + しおり + コンパクト) 追加
  7. mec-inject-css スタイルブロック追加
  8. progress.js ロード
  9. JS を完全版に更新 (setFilter/setState/applyFilters/saveBookmark/toggleCompact/lightbox)
"""
import re, sys, io, fitz
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path(r"C:\Users\coool\Desktop\MEC")
SUBJ_DIR = ROOT / "免アレ膠"
PDF_PATH = ROOT / "MEC問題文pdf" / "MEC臓器別講座・免アレ膠_問題（表紙2026）.pdf"

MIN_IMG_PIXELS = 10000
Q_PAT = re.compile(r'\d+\.\s*（(\d{2,3}[A-Z]-\d+)）')

# chapter prefix mapping
CH_PREFIX = {
    "ch01_immare.html": "imma_ch01",
    "ch02_immare.html": "imma_ch02",
    "ch03_immare.html": "imma_ch03",
    "ch04_immare.html": "imma_ch04",
    "ch05_immare.html": "imma_ch05",
}

# ─── CSS to add inside mec-inject-css block ───────────────────────────────
MEC_INJECT_CSS = """\
.sn2{position:sticky;z-index:99;background:#fff;border-bottom:1px solid var(--bd);padding:5px 14px;display:flex;gap:4px;overflow-x:auto;box-shadow:0 2px 6px rgba(0,0,0,.05);scrollbar-width:none;}
.sn2::-webkit-scrollbar{display:none;}
.nb2{flex-shrink:0;background:none;border:1.5px solid var(--bd);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;color:var(--ts);transition:all .15s;white-space:nowrap;}
.nb2.fs-on{background:rgba(0,0,0,.08);border-color:var(--nv);color:var(--nv);}
[data-state="flag"].fs-on{background:#C0392B;border-color:#C0392B;color:#fff;}
[data-state="undone"].fs-on{background:#78909C;border-color:#78909C;color:#fff;}
[data-state="done"].fs-on{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
.vis-count{margin-left:auto;font-size:11px;font-weight:700;color:var(--ts);white-space:nowrap;flex-shrink:0;}
.mec-controls{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0;}
.mec-flag-btn{background:none;border:none;font-size:16px;cursor:pointer;opacity:.3;padding:0 2px;line-height:1;transition:opacity .2s;}
.mec-flag-btn.mec-flagged{opacity:1;}
.qc.mec-done{opacity:.45;}
.mec-memo-wrap{margin-top:8px;border-top:1px solid #E0E5EB;padding-top:8px;}
.mec-memo-label{font-size:11px;font-weight:700;color:#2D8C4E;margin-bottom:4px;}
.mec-memo-area{width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #c8ebd4;font-size:13px;font-family:inherit;resize:vertical;background:#fff;outline:none;}
.mec-memo-area:focus{border-color:#2D8C4E;}
.mec-ch-prog{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#f0f4f8;border-bottom:1px solid #E0E5EB;}
.mec-ch-prog-bar{flex:1;height:6px;background:#E0E5EB;border-radius:3px;overflow:hidden;}
.mec-ch-prog-fill{height:100%;background:#2D8C4E;border-radius:3px;transition:width .3s;}
.mec-ch-prog-txt{font-size:12px;font-weight:700;color:#5A6475;white-space:nowrap;}
.mec-hub-link{display:inline-block;font-size:12px;color:rgba(255,255,255,.7);text-decoration:none;padding:3px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;}
.mec-hub-link:hover{background:rgba(255,255,255,.15);}
.mec-sync-badge{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;cursor:default;}
.mec-lap-btn{padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid #E0E5EB;color:#A0AAB8;background:none;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
.mec-lap-btn.mec-lapped{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
.mec-lap-num{font-size:9px;margin-left:2px;}
.filt-prog{display:flex;align-items:center;gap:8px;padding:3px 10px 5px;background:rgba(0,0,0,.12);}
.filt-prog-bar{flex:1;height:6px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden;}
.filt-prog-fill{height:100%;background:var(--or);border-radius:3px;transition:width .3s;}
.filt-prog-txt{font-size:10px;font-weight:700;color:rgba(255,255,255,.65);white-space:nowrap;min-width:60px;text-align:right;}
.qimg{cursor:zoom-in!important;transition:none!important;}
.nb2.compact-on{background:#2E7D32;border-color:#2E7D32;color:#fff;}
#imgLightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;align-items:center;justify-content:center;cursor:zoom-out;}
#imgLightbox.open{display:flex;}
#imgLightbox img{max-width:95vw;max-height:90vh;border-radius:8px;object-fit:contain;}
.compact-mode .cs,.compact-mode .ab,.compact-mode .eg{display:none!important;}
.compact-mode .qc.compact-open .cs{display:block!important;}
.compact-mode .qc.compact-open .ab{display:flex!important;}
.compact-mode .qc.compact-open .eg{display:grid!important;}
.compact-mode .qc:not(.compact-open) .qt{cursor:pointer;}
.compact-mode .qc:not(.compact-open) .qt::after{content:" ▼";font-size:10px;opacity:.35;vertical-align:middle;}"""

QIMG_CSS = (
    ".qimg-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px;}"
    ".qimg{max-height:220px;max-width:48%;object-fit:contain;border-radius:4px;"
    "border:1px solid var(--bd,#e0e5eb);cursor:zoom-in;transition:max-height .2s,max-width .2s;}"
)

# ─── Main JS block ────────────────────────────────────────────────────────
MAIN_JS = """\
window.addEventListener('scroll',()=>{
  const p=document.documentElement;
  document.getElementById('pb').style.width=((p.scrollTop||document.body.scrollTop)/(p.scrollHeight-p.clientHeight)*100)+'%';
  const st=document.getElementById('st');
  if(st)(p.scrollTop||document.body.scrollTop)>300?st.style.display='flex':st.style.display='none';
});
function goto(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelectorAll('.nb:not([data-filter])').forEach(b=>{b.addEventListener('click',function(){document.querySelectorAll('.nb:not([data-filter])').forEach(x=>x.classList.remove('active'));this.classList.add('active');});});

let currentFilter = 'all';
let currentState = 'all';

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('fc-on', b.dataset.filter === f));
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setState(s) {
  currentState = s;
  document.querySelectorAll('[data-state]').forEach(b => b.classList.toggle('fs-on', b.dataset.state === s));
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  const flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
  let visible = 0, doneVis = 0;
  document.querySelectorAll('.qc[data-uid]').forEach(c => {
    const uid = c.dataset.uid;
    const r = c.dataset.rate !== undefined && c.dataset.rate !== '' ? +c.dataset.rate : null;
    const f = currentFilter;
    let showDiff;
    if (f === 'all') showDiff = true;
    else if (f === 'norate') showDiff = r === null;
    else if (f === 'star') showDiff = !!c.querySelector('.bg.bs');
    else if (f === 'img') showDiff = !!c.querySelector('.qimg');
    else if (r !== null) showDiff = (f === 'hard' && r < 60) || (f === 'mid' && r >= 60 && r < 80) || (f === 'easy' && r >= 80);
    else showDiff = false;
    const st = currentState;
    let showState;
    if (st === 'all') showState = true;
    else if (st === 'flag') showState = !!flags[uid];
    else if (st === 'undone') showState = !done[uid];
    else if (st === 'done') showState = !!done[uid];
    else showState = true;
    const show = showDiff && showState;
    c.style.display = show ? '' : 'none';
    if (show) { visible++; if (window.mecSessionDone && window.mecSessionDone.has(uid)) doneVis++; }
  });
  document.querySelectorAll('.sg').forEach(g => {
    const vis = [...g.querySelectorAll('.qc')].some(c => c.style.display !== 'none');
    g.style.display = vis ? '' : 'none';
  });
  const vc = document.getElementById('visCount');
  if (vc) vc.textContent = visible ? visible + '問' : '—';
  const fp = document.getElementById('filtProgFill');
  const ft = document.getElementById('filtProgTxt');
  const pct = visible > 0 ? Math.round(doneVis / visible * 100) : 0;
  if (fp) fp.style.width = pct + '%';
  if (ft) ft.textContent = '残り' + (visible - doneVis) + '問';
}

function filterCards(f) { setFilter(f); }"""

MECSYNC_JS = """\
document.addEventListener('mecSyncComplete', function() {
  document.querySelectorAll('.qc[data-uid]').forEach(function(card) {
    var uid = card.dataset.uid;
    var done = JSON.parse(localStorage.getItem('done_v2') || '{}');
    var flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
    var fb = card.querySelector('.mec-flag-btn');
    if (fb && flags[uid]) fb.classList.add('mec-flagged');
  });
});"""

SN2_POS_JS = """\
document.addEventListener('DOMContentLoaded', function() {
  var sn = document.querySelector('.sn');
  var sn2 = document.querySelector('.sn2');
  if (sn && sn2) {
    var setTop = function() { sn2.style.top = sn.offsetHeight + 'px'; };
    setTop();
    if (window.ResizeObserver) new ResizeObserver(setTop).observe(sn);
  }
});"""

ENTER_KEY_JS = """document.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var tag=document.activeElement&&document.activeElement.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON')return;e.preventDefault();var hdr=document.querySelector('.mec-ch-prog');var hdrH=hdr?hdr.getBoundingClientRect().bottom:0;var cards=[].slice.call(document.querySelectorAll('.qc[data-uid]')).filter(function(c){return c.style.display!=='none';});var card=cards.find(function(c){var r=c.getBoundingClientRect();return r.top>=hdrH-10&&r.bottom>hdrH;})||cards.find(function(c){return c.getBoundingClientRect().bottom>hdrH;});if(card){var btn=card.querySelector('.mec-lap-btn');if(btn)btn.click();}});"""

BOOKMARK_JS = """\
function _bmPageKey(){var p=location.pathname.split('/');var last=p[p.length-1];return last.replace(/\\.html$/i,'');}
function saveBookmark(){var cards=[].slice.call(document.querySelectorAll('.qc[data-uid]')).filter(function(c){return c.style.display!=='none';});if(!cards.length)return;var hdr=document.querySelector('.mec-ch-prog');var hdrH=hdr?hdr.getBoundingClientRect().bottom:80;var best=null;for(var i=0;i<cards.length;i++){if(cards[i].getBoundingClientRect().top>=hdrH-10){best=cards[i];break;}}if(!best)best=cards[0];var bm=JSON.parse(localStorage.getItem('bookmark_v1')||'{}');bm[_bmPageKey()]=best.dataset.uid;localStorage.setItem('bookmark_v1',JSON.stringify(bm));var btn=document.getElementById('bookmarkBtn');if(btn){btn.textContent='📖 保存済';setTimeout(function(){btn.textContent='📖 しおり';},1500);}}
function restoreBookmark(){var uid=(JSON.parse(localStorage.getItem('bookmark_v1')||'{}'))[_bmPageKey()];if(!uid)return;var card=document.querySelector('.qc[data-uid="'+uid+'"]');if(!card)return;if(card.style.display==='none'){setState('all');card=document.querySelector('.qc[data-uid="'+uid+'"]');}hideBmBanner();var hdr=document.querySelector('.mec-ch-prog');var offset=hdr?hdr.getBoundingClientRect().height+16:80;var y=card.getBoundingClientRect().top+(window.scrollY||document.documentElement.scrollTop)-offset;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});card.style.outline='2px solid #F5A623';setTimeout(function(){card.style.outline='';},2000);}
function hideBmBanner(){var b=document.getElementById('bmBanner');if(b)b.style.display='none';}
document.addEventListener('DOMContentLoaded',function(){var uid=(JSON.parse(localStorage.getItem('bookmark_v1')||'{}'))[_bmPageKey()];if(uid){var b=document.getElementById('bmBanner');if(b)b.style.display='flex';}});"""

COMPACT_LIGHTBOX_JS = """\
var compactMode=false;
function toggleCompact(){compactMode=!compactMode;document.body.classList.toggle('compact-mode',compactMode);if(!compactMode)document.querySelectorAll('.qc.compact-open').forEach(function(el){el.classList.remove('compact-open');});var btn=document.getElementById('compactBtn');if(btn){btn.textContent=compactMode?'📋 通常表示':'📋 コンパクト';btn.classList.toggle('compact-on',compactMode);}}
document.addEventListener('click',function(e){if(!compactMode)return;var card=e.target.closest?e.target.closest('.qc[data-uid]'):null;if(!card)return;if(e.target.closest('button, a, input, textarea'))return;card.classList.toggle('compact-open');});
function openLightbox(src){var lb=document.getElementById('imgLightbox');var img=document.getElementById('imgLightboxImg');if(!lb||!img)return;img.src=src;lb.classList.add('open');}
function closeLightbox(){var lb=document.getElementById('imgLightbox');if(lb)lb.classList.remove('open');}
document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.qimg').forEach(function(img){img.addEventListener('click',function(e){e.stopPropagation();openLightbox(this.src);});});});"""

BM_BANNER = (
    '<div id="bmBanner" style="display:none;position:fixed;bottom:72px;left:50%;transform:translateX(-50%);'
    'background:#1A1A2E;color:#fff;border-radius:24px;padding:8px 16px;font-size:13px;font-weight:700;'
    'gap:8px;align-items:center;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.4);white-space:nowrap;">'
    '📖 前回の続きから'
    '<button onclick="restoreBookmark()" style="background:#F5A623;border:none;border-radius:16px;'
    'padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;color:#000;margin-left:4px;">再開</button>'
    '<button onclick="hideBmBanner()" style="background:none;border:none;color:rgba(255,255,255,.5);'
    'font-size:18px;cursor:pointer;padding:0 0 0 6px;line-height:1;">✕</button></div>'
)

LIGHTBOX_HTML = '<div id="imgLightbox" onclick="closeLightbox()"><img id="imgLightboxImg" src="" alt=""></div>'


# ─── Image extraction ─────────────────────────────────────────────────────

def extract_pdf_images(pdf_path):
    """PDF から exam_id → [(bytes, ext), ...] マッピングを返す"""
    doc = fitz.open(str(pdf_path))
    all_assignments = {}
    for i in range(len(doc)):
        page = doc[i]
        blocks = page.get_text('dict')['blocks']
        q_positions = []
        for b in blocks:
            if b['type'] != 0:
                continue
            text = ''.join(s['text'] for l in b.get('lines', []) for s in l.get('spans', []))
            m = Q_PAT.search(text)
            if m:
                q_positions.append((b['bbox'][1], m.group(1)))
        if not q_positions:
            continue
        q_positions.sort()
        boundaries = q_positions + [(page.rect.height, None)]
        for b in blocks:
            if b['type'] != 1:
                continue
            w, h = b.get('width', 0), b.get('height', 0)
            if w * h < MIN_IMG_PIXELS:
                continue
            img_y = b['bbox'][1]
            for j in range(len(boundaries) - 1):
                if boundaries[j][0] <= img_y < boundaries[j + 1][0]:
                    qid = boundaries[j][1]
                    img_bytes = b.get('image')
                    ext = b.get('ext', 'jpeg')
                    if img_bytes and qid:
                        all_assignments.setdefault(qid, []).append((img_bytes, ext))
                    break
    return all_assignments


def save_images(img_dir, exam_to_images):
    """画像を img_dir/ に保存。exam_id → [filename] を返す"""
    img_dir.mkdir(exist_ok=True)
    saved = {}
    for exam_id, imgs in exam_to_images.items():
        saved[exam_id] = []
        for idx, (img_bytes, ext) in enumerate(imgs, 1):
            fname = f"{exam_id}_{idx}.{ext}"
            fpath = img_dir / fname
            if not fpath.exists():
                fpath.write_bytes(img_bytes)
            saved[exam_id].append(fname)
    return saved


# ─── HTML transformation ─────────────────────────────────────────────────

def transform_file(html_path, ch_prefix, exam_to_filenames):
    content = html_path.read_text(encoding='utf-8')

    # 1. Parse with BeautifulSoup
    soup = BeautifulSoup(content, 'html.parser')

    # 2. Add data-uid and MEC controls to each card, add bi+images if needed
    q_num = 0
    for card in soup.find_all('div', class_='qc'):
        q_num += 1
        uid = f"{ch_prefix}_q{q_num}"

        # Add data-uid and ensure id
        card['data-uid'] = uid
        if not card.get('id'):
            card['id'] = f"q{q_num}"

        # Get exam_id from qe span
        qe = card.find('span', class_='qe')
        exam_id = None
        if qe:
            raw = qe.get_text().strip()
            exam_id = re.sub(r'[（）()]', '', raw)

        # Add bi marker if this question has images (and not already there)
        qh = card.find('div', class_='qh')
        if qh and exam_id and exam_to_filenames.get(exam_id):
            if not card.find('span', class_='bi'):
                bi_span = soup.new_tag('span', attrs={'class': 'bg bi'})
                bi_span.string = '📷 画像'
                # Insert before cr (correct rate badge)
                cr = qh.find(class_='cr')
                if cr:
                    cr.insert_before(bi_span)
                else:
                    qh.append(bi_span)

        # Add MEC controls to qh (if not already present)
        if qh and not card.find('div', class_='mec-controls'):
            controls = soup.new_tag('div', attrs={'class': 'mec-controls'})

            flag_btn = soup.new_tag('button', attrs={
                'class': 'mec-flag-btn',
                'data-uid': uid,
                'onclick': 'mecToggleFlag(this)',
                'title': '苦手フラグ'
            })
            flag_btn.string = '🚩'
            controls.append(flag_btn)

            lap_btn = soup.new_tag('button', attrs={
                'class': 'mec-lap-btn',
                'data-uid': uid,
                'onclick': 'mecIncrLap(this)'
            })
            lap_btn.string = '済'
            lap_num = soup.new_tag('span', attrs={'class': 'mec-lap-num'})
            lap_btn.append(lap_num)
            controls.append(lap_btn)

            qh.append(controls)

        # Inject image row after .qt (if not already present)
        if exam_id and exam_to_filenames.get(exam_id):
            qt = card.find('div', class_='qt')
            if qt and not card.find('div', class_='qimg-row'):
                row = soup.new_tag('div', attrs={'class': 'qimg-row'})
                for fname in exam_to_filenames[exam_id]:
                    img = soup.new_tag('img', attrs={
                        'class': 'qimg',
                        'src': f'images/{fname}',
                        'alt': ''
                    })
                    row.append(img)
                qt.insert_after(row)

    # 3. Update sn bar
    sn = soup.find('div', class_='sn')
    if sn:
        # Extract chapter nav buttons (goto buttons, not filter buttons)
        nav_buttons = []
        for btn in list(sn.children):
            if hasattr(btn, 'get') and btn.get('data-filter'):
                continue  # skip old filter buttons
            if hasattr(btn, 'name') and btn.name == 'span' and 'fsep' in btn.get('class', []):
                continue  # skip separators
            nav_buttons.append(btn)

        # Rebuild sn
        sn.clear()
        for btn in nav_buttons:
            sn.append(btn)

        # Add separator + new filter buttons
        sep1 = soup.new_tag('span', attrs={'class': 'fsep'})
        sn.append(sep1)

        filter_defs = [
            ('all', '全問', True),
            ('hard', '難問', False),
            ('mid', '標準', False),
            ('easy', '易問', False),
            ('norate', '正答率なし', False),
            ('star', '★問題', False),
            ('img', '🖼️ 画像', False),
        ]
        for fval, flabel, active in filter_defs:
            btn_cls = 'nb fc-on' if active else 'nb'
            btn = soup.new_tag('button', attrs={
                'class': btn_cls,
                'data-filter': fval,
                'onclick': f"setFilter('{fval}')"
            })
            btn.string = flabel
            sn.append(btn)

        # Add separator + vis-count
        sep2 = soup.new_tag('span', attrs={'class': 'fsep'})
        sn.append(sep2)
        vc = soup.new_tag('span', attrs={'class': 'vis-count', 'id': 'visCount'})
        vc.string = '—'
        sn.append(vc)

    # 4. Add mec-ch-prog before sn (if not present)
    if not soup.find('div', class_='mec-ch-prog') and sn:
        prog_div = BeautifulSoup(
            '<div class="mec-ch-prog">'
            '<a class="mec-hub-link" href="../index.html">← ハブへ</a>'
            '<div class="mec-ch-prog-bar"><div class="mec-ch-prog-fill" style="width:0%"></div></div>'
            '<span class="mec-ch-prog-txt">0/0</span>'
            '<span class="mec-sync-badge">⚙️ 未設定</span>'
            '</div>',
            'html.parser'
        )
        sn.insert_before(prog_div)

    # 5. Add sn2 after sn (if not present)
    if not soup.find('div', class_='sn2') and sn:
        sn2_html = (
            '<div class="sn2">'
            '<button class="nb2 fs-on" data-state="all" onclick="setState(\'all\')">すべて</button>'
            '<button class="nb2" data-state="flag" onclick="setState(\'flag\')">🚩 赤旗</button>'
            '<button class="nb2" data-state="undone" onclick="setState(\'undone\')">未済</button>'
            '<button class="nb2" data-state="done" onclick="setState(\'done\')">済み</button>'
            '<button id="bookmarkBtn" class="nb2" style="margin-left:auto" onclick="saveBookmark()">📖 しおり</button>'
            '<button id="compactBtn" class="nb2" onclick="toggleCompact()">📋 コンパクト</button>'
            '</div>'
        )
        sn2_soup = BeautifulSoup(sn2_html, 'html.parser')
        sn.insert_after(sn2_soup)

    # 6. Add CSS to <style> block
    style = soup.find('style')
    if style:
        existing_css = style.string or ''
        if '.qimg-row' not in existing_css:
            style.string = existing_css + '\n' + QIMG_CSS
        if 'mec-inject-css' not in str(soup):
            inject_css_tag = soup.new_tag('style', attrs={'id': 'mec-inject-css'})
            inject_css_tag.string = MEC_INJECT_CSS
            style.insert_after(inject_css_tag)

    # 7. Add progress.js before existing <script>
    main_script = soup.find('script', src=False)
    if main_script and 'progress.js' not in str(soup):
        prog_script = soup.new_tag('script', attrs={'src': '../progress.js?v=3'})
        main_script.insert_before(prog_script)

    # 8. Replace main script content with comprehensive JS
    if main_script:
        main_script.string = '\n' + MAIN_JS + '\n'

    # 9. Add additional scripts before </body>
    body = soup.find('body')
    if body:
        # Remove any existing bare JS outside script tags (cleanup)
        # Add all additional script blocks
        mecsync_tag = soup.new_tag('script')
        mecsync_tag.string = '\n' + MECSYNC_JS + '\n'
        body.append(mecsync_tag)

        sn2pos_tag = soup.new_tag('script')
        sn2pos_tag.string = '\n' + SN2_POS_JS + '\n'
        body.append(sn2pos_tag)

        bookmark_tag = soup.new_tag('script')
        bookmark_tag.string = '\n' + BOOKMARK_JS + '\n'
        body.append(bookmark_tag)

        compact_lb_tag = soup.new_tag('script')
        compact_lb_tag.string = '\n' + COMPACT_LIGHTBOX_JS + '\n'
        body.append(compact_lb_tag)

        enter_tag = soup.new_tag('script')
        enter_tag.string = '\n' + ENTER_KEY_JS + '\n'
        body.append(enter_tag)

        # Add bookmark banner and lightbox HTML
        bm_soup = BeautifulSoup(BM_BANNER, 'html.parser')
        body.append(bm_soup)

        lb_soup = BeautifulSoup(LIGHTBOX_HTML, 'html.parser')
        body.append(lb_soup)

    return str(soup)


def main():
    print("=== 免アレ膠 Transform ===")
    print()

    # Step 1: Extract images from PDF
    print(f"PDF: {PDF_PATH}")
    if not PDF_PATH.exists():
        print("ERROR: PDF not found!")
        return

    print("Extracting images from PDF...")
    exam_to_images = extract_pdf_images(PDF_PATH)
    print(f"  Found {len(exam_to_images)} questions with images")

    # Get all exam IDs from HTML files to filter
    html_exam_ids = set()
    for f in SUBJ_DIR.glob('*.html'):
        c = f.read_text(encoding='utf-8')
        ids = re.findall(r'<span class="qe">\(([^)]+)\)</span>', c)
        html_exam_ids.update(ids)

    matched = {eid: imgs for eid, imgs in exam_to_images.items() if eid in html_exam_ids}
    print(f"  Matched to HTML: {len(matched)} questions")

    # Save images
    img_dir = SUBJ_DIR / 'images'
    exam_to_filenames = save_images(img_dir, matched)
    total_files = sum(len(v) for v in exam_to_filenames.values())
    print(f"  Saved {total_files} image files to {img_dir}")
    print()

    # Step 2: Transform each HTML file
    for filename, ch_prefix in sorted(CH_PREFIX.items()):
        html_path = SUBJ_DIR / filename
        if not html_path.exists():
            print(f"SKIP: {filename} not found")
            continue

        print(f"Transforming {filename} (prefix: {ch_prefix})...")

        new_content = transform_file(html_path, ch_prefix, exam_to_filenames)

        # Count changes
        card_count = new_content.count(f'data-uid="{ch_prefix}')
        img_count = new_content.count('class="qimg"')
        print(f"  Cards with UID: {card_count}, Image cards: {img_count}")

        html_path.write_text(new_content, encoding='utf-8')
        print(f"  ✓ Saved")

    print()
    print("Done! Next steps:")
    print("  1. Update chapters_meta.js to add 免アレ膠")
    print("  2. Run generate_study_tool.py to regenerate study.html")


if __name__ == '__main__':
    main()
