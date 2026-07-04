"""
inject_kakumon.py
国家試験過去問 HTML に MEC 進捗UI（済/赤旗）を注入するスクリプト
"""
import re, os, glob

BASE_DIR = r'C:\Users\coool\Desktop\MEC\国家試験過去問'

MEC_INJECT_CSS = """
/* ── MEC 過去問 注入スタイル ── */
.mec-controls{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0;}
.mec-flag-btn{background:none;border:none;font-size:16px;cursor:pointer;opacity:.3;padding:0 2px;line-height:1;transition:opacity .2s;}
.mec-flag-btn.mec-flagged{opacity:1;}
.mec-lap-btn{padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid #E0E5EB;color:#A0AAB8;background:none;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
.mec-lap-btn.mec-lapped{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
.mec-lap-num{font-size:9px;margin-left:2px;}
.mec-ch-prog{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#1C2E4A;border-bottom:1px solid #2A4063;}
.mec-ch-prog-bar{flex:1;height:6px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden;}
.mec-ch-prog-fill{height:100%;background:#3DD68C;border-radius:3px;transition:width .3s;}
.mec-ch-prog-txt{font-size:12px;font-weight:700;color:rgba(255,255,255,.7);white-space:nowrap;}
.mec-hub-link{display:inline-block;font-size:12px;color:rgba(255,255,255,.7);text-decoration:none;padding:3px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;}
.mec-hub-link:hover{background:rgba(255,255,255,.15);color:#fff;}
.mec-sync-badge{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(255,255,255,.12);color:rgba(255,255,255,.7);}
.sn2{position:sticky;z-index:99;background:#fff;border-bottom:1px solid var(--bd);padding:5px 14px;display:flex;gap:4px;align-items:center;overflow-x:auto;box-shadow:0 2px 6px rgba(0,0,0,.05);scrollbar-width:none;}
.sn2::-webkit-scrollbar{display:none;}
.nb2{flex-shrink:0;background:none;border:1.5px solid var(--bd);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;font-family:'Noto Sans JP',sans-serif;cursor:pointer;color:var(--ts);transition:all .15s;white-space:nowrap;}
.nb2.fs-on{background:rgba(0,0,0,.08);border-color:var(--nv);color:var(--nv);}
[data-state="flag"].fs-on{background:#C0392B;border-color:#C0392B;color:#fff;}
[data-state="undone"].fs-on{background:#78909C;border-color:#78909C;color:#fff;}
[data-state="done"].fs-on{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
.vis-count{margin-left:auto;font-size:11px;font-weight:700;color:var(--ts);white-space:nowrap;flex-shrink:0;}
.filt-prog{display:flex;align-items:center;gap:8px;padding:3px 10px 5px;background:rgba(0,0,0,.08);}
.filt-prog-bar{flex:1;height:5px;background:rgba(0,0,0,.1);border-radius:3px;overflow:hidden;}
.filt-prog-fill{height:100%;background:#2D8C4E;border-radius:3px;transition:width .3s;}
.filt-prog-txt{font-size:10px;font-weight:700;color:var(--ts);white-space:nowrap;min-width:60px;text-align:right;}
#imgLightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;align-items:center;justify-content:center;cursor:zoom-out;}
#imgLightbox.open{display:flex;}
#imgLightbox img{max-width:95vw;max-height:90vh;border-radius:8px;object-fit:contain;}
"""

MEC_INJECT_JS = """
<script src="../../progress.js?v=3"></script>
<script>
document.addEventListener('mecSyncComplete', function() {
  var done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  var flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
  var total = 0, doneCount = 0;
  document.querySelectorAll('.qc[data-uid]').forEach(function(card) {
    var uid = card.dataset.uid;
    total++;
    var fb = card.querySelector('.mec-flag-btn');
    if (fb && flags[uid]) fb.classList.add('mec-flagged');
    var lb = card.querySelector('.mec-lap-btn');
    if (lb) {
      var laps = done[uid] || 0;
      if (laps > 0) {
        lb.classList.add('mec-lapped');
        lb.querySelector('.mec-lap-num').textContent = laps > 1 ? laps : '';
        doneCount++;
      }
    }
  });
  var fill = document.getElementById('mecChProgFill');
  var txt = document.getElementById('mecChProgTxt');
  if (fill) fill.style.width = (total ? Math.round(doneCount/total*100) : 0) + '%';
  if (txt) txt.textContent = doneCount + '/' + total;
  applyFilters();
});

var currentFilter = 'all';
var currentState = 'all';

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('[data-filter]').forEach(function(b) {
    b.classList.toggle('fc-on', b.dataset.filter === f);
  });
  applyFilters();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function setState(s) {
  currentState = s;
  document.querySelectorAll('[data-state]').forEach(function(b) {
    b.classList.toggle('fs-on', b.dataset.state === s);
  });
  applyFilters();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function applyFilters() {
  var done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  var flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
  var visible = 0, doneVis = 0;
  document.querySelectorAll('.qc[data-uid]').forEach(function(c) {
    var uid = c.dataset.uid;
    var r = (c.dataset.rate !== undefined && c.dataset.rate !== '') ? +c.dataset.rate : null;
    var f = currentFilter;
    var showDiff;
    if (f === 'all') showDiff = true;
    else if (f === 'star') showDiff = !!c.querySelector('.bg.bs');
    else if (r !== null) showDiff = (f==='hard' && r<60) || (f==='mid' && r>=60 && r<80) || (f==='easy' && r>=80);
    else showDiff = false;
    var st = currentState;
    var showState;
    if (st === 'all') showState = true;
    else if (st === 'flag') showState = !!flags[uid];
    else if (st === 'undone') showState = !done[uid];
    else if (st === 'done') showState = !!done[uid];
    else showState = true;
    var show = showDiff && showState;
    c.style.display = show ? '' : 'none';
    if (show) { visible++; if (done[uid]) doneVis++; }
  });
  document.querySelectorAll('.sg').forEach(function(g) {
    var vis = [].slice.call(g.querySelectorAll('.qc')).some(function(c) { return c.style.display !== 'none'; });
    g.style.display = vis ? '' : 'none';
  });
  var vc = document.getElementById('visCount');
  if (vc) vc.textContent = visible ? visible + '問' : '—';
  var fp = document.getElementById('filtProgFill');
  var ft = document.getElementById('filtProgTxt');
  var pct = visible > 0 ? Math.round(doneVis/visible*100) : 0;
  if (fp) fp.style.width = pct + '%';
  if (ft) ft.textContent = '残り' + (visible - doneVis) + '問';
}

function filterCards(f) { setFilter(f); }
</script>
<script>
function openLightbox(src){var lb=document.getElementById('imgLightbox');var img=document.getElementById('imgLightboxImg');if(!lb||!img)return;img.src=src;lb.classList.add('open');}
function closeLightbox(){var lb=document.getElementById('imgLightbox');if(lb)lb.classList.remove('open');}
document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.qimg').forEach(function(img){img.addEventListener('click',function(e){e.stopPropagation();openLightbox(this.src);});});});
</script>
<div id="imgLightbox" onclick="closeLightbox()"><img id="imgLightboxImg" src="" alt=""></div>
"""

def get_block_id(filepath):
    base = os.path.basename(filepath)
    m = re.match(r'(\d+[A-F])_kakuron\.html$', base)
    return m.group(1) if m else None

def process_qc_cards(html, block_id):
    """Add data-uid and mec-controls (in qh)"""
    result = []
    pos = 0

    # Match <div class="qc" id="qN" ...>
    qc_pat = re.compile(r'<div class="qc" id="q(\d+)"([^>]*)>')

    for m in qc_pat.finditer(html):
        q_num = m.group(1)
        rest_attrs = m.group(2)
        uid = f'kakumon_{block_id}_q{q_num}'

        result.append(html[pos:m.start()])
        result.append(f'<div class="qc" id="q{q_num}"{rest_attrs} data-uid="{uid}">')

        search_from = m.end()

        # Find </div><div class="qb"> — end of .qh, start of .qb
        qh_end_pat = re.compile(r'</div>(?=<div class="qb">)')
        qh_m = qh_end_pat.search(html, search_from)

        if not qh_m:
            result.append(html[search_from:])
            pos = len(html)
            break

        # .qh content (between opening .qc tag and closing </div> of .qh)
        result.append(html[search_from:qh_m.start()])

        # Inject mec-controls before </div> of .qh
        mec_ctrl = (
            f'<div class="mec-controls">'
            f'<button class="mec-flag-btn" data-uid="{uid}" onclick="mecToggleFlag(this)" title="苦手フラグ">\U0001f6a9</button>'
            f'<button class="mec-lap-btn" data-uid="{uid}" onclick="mecIncrLap(this)">済<span class="mec-lap-num"></span></button>'
            f'</div>'
        )
        result.append(mec_ctrl)
        result.append('</div>')       # close .qh
        result.append('<div class="qb">')

        # Find end of .qb by tracking div depth
        qb_start = qh_m.end() + len('<div class="qb">')
        depth = 1
        i = qb_start
        qb_end = -1

        while i < len(html) and depth > 0:
            next_open = html.find('<div', i)
            next_close = html.find('</div>', i)
            if next_close == -1:
                break
            if next_open == -1 or next_close < next_open:
                depth -= 1
                if depth == 0:
                    qb_end = next_close
                    break
                i = next_close + 6
            else:
                depth += 1
                i = next_open + 4

        if qb_end == -1:
            result.append(html[qb_start:])
            pos = len(html)
            break

        result.append(html[qb_start:qb_end])
        result.append('</div>')  # close .qb

        pos = qb_end + 6  # skip the consumed </div>

    result.append(html[pos:])
    return ''.join(result)

def inject_css(html):
    """Append inject CSS before last </style> in <head>"""
    # Find </head> position to limit search
    head_end = html.find('</head>')
    if head_end == -1:
        head_end = len(html)
    last_style_close = html.rfind('</style>', 0, head_end)
    if last_style_close == -1:
        return html
    inject = f'<style id="mec-inject-css">{MEC_INJECT_CSS}</style>'
    return html[:last_style_close] + inject + html[last_style_close:]

def inject_ui_chrome(html, block_id, year_num, block_letter):
    """Insert progress bar before .sn; sn2+filt_prog after .sn"""
    sn_open = html.find('<div class="sn">')
    if sn_open == -1:
        return html

    # .sn has no nested divs, first </div> closes it
    sn_close = html.find('</div>', sn_open)
    if sn_close == -1:
        return html
    sn_close_end = sn_close + 6

    block_label_map = {
        'A': 'A問題（一般・臨床）',
        'B': 'B問題（必修）',
        'C': 'C問題（一般・臨床）',
        'D': 'D問題（一般・臨床）',
        'E': 'E問題（必修）',
        'F': 'F問題（一般・臨床）',
    }

    prog_bar = (
        '<div class="mec-ch-prog">'
        '<a class="mec-hub-link" href="../../index.html">← ハブへ</a>'
        '<div class="mec-ch-prog-bar"><div class="mec-ch-prog-fill" id="mecChProgFill" style="width:0%"></div></div>'
        '<span class="mec-ch-prog-txt" id="mecChProgTxt">0/0</span>'
        '<span class="mec-sync-badge mec-ch-prog-badge">⚙️ 未設定</span>'
        '</div>'
    )

    # Add ★フィルターボタン and visCount span to .sn content
    # Insert before </div> of .sn
    sn_content = html[sn_open:sn_close]
    sn_extra = (
        '<span class="fsep"></span>'
        '<button class="nb" data-filter="star" onclick="setFilter(\'star\')">★問題</button>'
        '<span class="fsep"></span>'
        '<span class="vis-count" id="visCount">—</span>'
    )
    sn_full = sn_content + sn_extra + '</div>'

    sn2 = (
        '<div class="sn2">'
        '<button class="nb2 fs-on" data-state="all" onclick="setState(\'all\')">すべて</button>'
        '<button class="nb2" data-state="flag" onclick="setState(\'flag\')">\U0001f6a9 赤旗</button>'
        '<button class="nb2" data-state="undone" onclick="setState(\'undone\')">未済</button>'
        '<button class="nb2" data-state="done" onclick="setState(\'done\')">済み</button>'
        '</div>'
        '<div class="filt-prog">'
        '<div class="filt-prog-bar"><div class="filt-prog-fill" id="filtProgFill" style="width:0%"></div></div>'
        '<span class="filt-prog-txt" id="filtProgTxt">—</span>'
        '</div>'
    )

    return html[:sn_open] + prog_bar + sn_full + sn2 + html[sn_close_end:]

def inject_scripts(html):
    """Inject progress.js and MEC init scripts before </body>"""
    body_close = html.rfind('</body>')
    if body_close == -1:
        return html + MEC_INJECT_JS
    return html[:body_close] + MEC_INJECT_JS + html[body_close:]

def process_file(filepath):
    block_id = get_block_id(filepath)
    if not block_id:
        print(f'  SKIP (no block id): {filepath}')
        return

    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    # Skip already-processed files
    if 'data-uid="kakumon_' in html:
        print(f'  Already done: {os.path.basename(filepath)}')
        return

    year_num = block_id[:-1]
    block_letter = block_id[-1]

    html = process_qc_cards(html, block_id)
    html = inject_css(html)
    html = inject_ui_chrome(html, block_id, year_num, block_letter)
    html = inject_scripts(html)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

    # Verify injection
    uid_count = html.count(f'data-uid="kakumon_{block_id}_q')
    print(f'  OK: {os.path.basename(filepath)} ({uid_count} questions tagged)')

if __name__ == '__main__':
    import sys
    # If a specific file path passed, process only that file (for testing)
    if len(sys.argv) > 1:
        process_file(sys.argv[1])
    else:
        for year_dir in sorted(os.listdir(BASE_DIR)):
            year_path = os.path.join(BASE_DIR, year_dir)
            if not os.path.isdir(year_path):
                continue
            print(f'\nProcessing {year_dir}...')
            for html_file in sorted(glob.glob(os.path.join(year_path, '*.html'))):
                process_file(html_file)
        print('\nAll done!')
