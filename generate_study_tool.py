"""
generate_study_tool.py — 全科目統合学習ツール (study.html) を生成する
chapters_meta.js の全科目・章HTMLから .qc カードを抽出し、
1ファイルの統合学習ツールとして出力する
"""
import re, json, sys, io
from pathlib import Path
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")
OUT = DST / "study.html"


def load_subjects():
    js = (DST / "chapters_meta.js").read_text(encoding='utf-8')
    m = re.search(r'const MEC_CHAPTERS\s*=\s*(\[[\s\S]*?\]);\s*\nconst', js)
    if not m:
        raise ValueError("MEC_CHAPTERS not found in chapters_meta.js")
    return json.loads(m.group(1))


def fix_img_paths(html_str, base_dir):
    """img.qimg の src を base_dir/ 相対パスに修正"""
    return re.sub(
        r'src="(images/[^"]+)"',
        lambda m: f'src="{base_dir}/{m.group(1)}"',
        html_str
    )


def extract_cards(html_path):
    """HTMLファイルから .qc[data-uid] カードの HTML 文字列リストを返す"""
    with open(html_path, encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    return [str(c) for c in soup.find_all('div', class_='qc') if c.get('data-uid')]


# ─────────────────────────────────────────────
#  CSS (カードスタイル + ツールUI)
# ─────────────────────────────────────────────
STUDY_CSS = """\
:root{--or:#D4570A;--orl:#FDF0E8;--ord:#A8420A;--nv:#1C2E4A;--nvl:#2A4063;--gr:#2D8C4E;--grl:#EAF7EE;--yl:#F5A623;--yll:#FFF8E6;--rd:#C0392B;--rdl:#FDEAEA;--pu:#7B5EA7;--pul:#F3EEFF;--bl:#EAF2FF;--gb:#F4F6F8;--cb:#FFF;--bd:#E0E5EB;--tx:#1A2332;--ts:#5A6475;}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:-apple-system,'Noto Sans JP','Helvetica Neue',sans-serif;background:var(--gb);color:var(--tx);font-size:14px;line-height:1.7;}

.st-hdr{background:var(--nv);color:#fff;padding:10px 12px 8px;position:sticky;top:0;z-index:200;box-shadow:0 2px 12px rgba(0,0,0,.3);}
.st-title-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.st-title{font-size:15px;font-weight:800;}
.hub-link{font-size:11px;color:rgba(255,255,255,.7);text-decoration:none;padding:3px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;white-space:nowrap;}
.hub-link:hover{background:rgba(255,255,255,.15);}
.mec-sync-badge{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;margin-left:auto;}
.st-stats{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;}
.st-stat{background:rgba(255,255,255,.12);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
.st-stat span{color:#F5A623;}

.chip-row{display:flex;gap:4px;overflow-x:auto;padding-bottom:5px;scrollbar-width:none;margin-bottom:6px;}
.chip-row::-webkit-scrollbar{display:none;}
.chip{padding:3px 10px;border-radius:20px;border:1.5px solid rgba(255,255,255,.3);background:none;color:rgba(255,255,255,.6);font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0;}
.chip.on{color:#fff;}

.filter-row{display:flex;align-items:center;gap:3px;overflow-x:auto;scrollbar-width:none;}
.filter-row::-webkit-scrollbar{display:none;}
.nb{flex-shrink:0;background:none;border:1.5px solid rgba(255,255,255,.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;color:rgba(255,255,255,.65);transition:all .15s;white-space:nowrap;}
.nb.fc-on{background:var(--or);border-color:var(--or);color:#fff;}
.nb[data-filter="hard"].fc-on{background:var(--rd);border-color:var(--rd);}
.nb[data-filter="mid"].fc-on{background:var(--yl);border-color:var(--yl);color:#744A00;}
.nb[data-filter="easy"].fc-on{background:var(--gr);border-color:var(--gr);}
.nb[data-filter="norate"].fc-on{background:#78909C;border-color:#78909C;}
.nb[data-filter="star"].fc-on{background:#F5A623;border-color:#F5A623;color:#744A00;}
.nb[data-filter="img"].fc-on{background:#1565C0;border-color:#1565C0;}
.fsep{width:1px;height:14px;background:rgba(255,255,255,.25);margin:0 2px;flex-shrink:0;align-self:center;}
.vis-count{margin-left:auto;font-size:11px;font-weight:700;color:rgba(255,255,255,.55);white-space:nowrap;flex-shrink:0;}

.filter-row2{display:flex;align-items:center;gap:3px;overflow-x:auto;scrollbar-width:none;margin-top:4px;}
.filter-row2::-webkit-scrollbar{display:none;}
.nb2{flex-shrink:0;background:none;border:1.5px solid rgba(255,255,255,.3);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;color:rgba(255,255,255,.65);transition:all .15s;white-space:nowrap;}
.nb2.fs-on{background:rgba(255,255,255,.2);border-color:#fff;color:#fff;}
.nb2[data-state="flag"].fs-on{background:#C0392B;border-color:#C0392B;color:#fff;}
.nb2[data-state="due"].fs-on{background:#E65100;border-color:#E65100;color:#fff;}
.nb2[data-state="undone"].fs-on{background:#78909C;border-color:#78909C;color:#fff;}
.nb2[data-state="done"].fs-on{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}

.ct{max-width:900px;margin:0 auto;padding:14px 12px 60px;}

.subj-section[data-visible="false"]{display:none;}
.subj-hdr{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;color:#fff;margin:14px 0 8px;position:sticky;top:190px;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.subj-hdr-icon{font-size:18px;}
.subj-hdr-name{font-size:13px;font-weight:800;}
.subj-hdr-count{margin-left:auto;font-size:11px;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:10px;}

.ch-divider{font-size:11px;font-weight:700;color:var(--ts);padding:6px 6px 4px;margin-top:4px;border-bottom:1px solid var(--bd);margin-bottom:6px;}

.qc{background:var(--cb);border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.07);margin-bottom:12px;border-left:4px solid var(--or);overflow:hidden;transition:box-shadow .2s;}
.qc:hover{box-shadow:0 5px 20px rgba(0,0,0,.12);}
.qh{display:flex;align-items:center;gap:7px;padding:11px 15px 7px;flex-wrap:wrap;border-bottom:1px solid var(--gb);}
.qn{font-size:14px;font-weight:900;color:var(--nv);min-width:30px;}
.qe{font-size:11px;color:var(--ts);}
.bg{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;}
.bs{background:#FFF3CD;color:#B45309;border:1px solid #F5D87A;}
.bc{background:#E8F4FD;color:#1565C0;border:1px solid #90CAF9;}
.bh{background:#FCE4EC;color:#C62828;border:1px solid #F48FB1;}
.bi{background:#F3E5F5;color:#6A1B9A;border:1px solid #CE93D8;}
.bk{background:#E8F5E9;color:#1B5E20;border:1px solid #A5D6A7;}
.bm{background:#FFF8E1;color:#E65100;border:1px solid #FFCC80;}
.br{background:#E3F2FD;color:#01579B;border:1px solid #81D4FA;}
.bx{background:#F3E5F5;color:#4A148C;border:1px solid #CE93D8;}
.cr{margin-left:auto;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;flex-shrink:0;}
.ch{background:var(--grl);color:var(--gr);border:1px solid #A5D6A7;}
.cm{background:var(--yll);color:#92660A;border:1px solid #FFD54F;}
.cl{background:var(--rdl);color:var(--rd);border:1px solid #EF9A9A;}
.qb{padding:11px 15px 14px;}
.qt{font-size:13.5px;line-height:1.75;margin-bottom:9px;}
.qt strong{color:var(--ord);}
.cs{background:var(--gb);border-radius:6px;padding:9px 13px;margin-bottom:11px;}
.ch2{font-size:13px;padding:2px 0;line-height:1.6;}
.ch2.ok{color:var(--gr);font-weight:700;}
.ab{background:var(--grl);border:1.5px solid #81C784;border-radius:8px;padding:9px 13px;margin-bottom:11px;display:flex;align-items:flex-start;gap:7px;}
.ai{font-size:15px;flex-shrink:0;margin-top:1px;}
.ac{font-size:13.5px;font-weight:700;color:var(--gr);line-height:1.5;}
.as{font-size:12px;font-weight:400;color:#3A7D51;margin-top:2px;}
.eg{display:grid;gap:9px;margin-top:9px;}
.eb{border-radius:6px;padding:9px 12px;font-size:13px;line-height:1.7;}
.eb h4{font-size:11px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:.05em;}
.ep{background:var(--bl);border-left:3px solid #1976D2;}.ep h4{color:#1565C0;}
.ee{background:#F0FDF4;border-left:3px solid var(--gr);}.ee h4{color:var(--gr);}
.ept{background:linear-gradient(135deg,#FFF9F0,#FFF3E0);border:1.5px solid var(--or);border-radius:8px;}.ept h4{color:var(--ord);font-size:11px;}
.em{background:var(--pul);border-left:3px solid var(--pu);}.em h4{color:var(--pu);}
.ec{background:#F9FBE7;border-left:3px solid #8BC34A;font-size:13px;}.ec h4{color:#558B2F;}
.kw{color:var(--ord);font-weight:700;}
.kw2{color:#1565C0;font-weight:700;}
.kw3{color:var(--gr);font-weight:700;}
.kw4{color:var(--rd);font-weight:700;}
.tb{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:5px;}
.tb th{background:var(--nv);color:#fff;padding:5px 9px;text-align:left;font-weight:700;}
.tb td{padding:4px 9px;border-bottom:1px solid var(--bd);}
.tb tr:last-child td{border-bottom:none;}
.tb tr:nth-child(even) td{background:var(--gb);}
.sg{margin-bottom:6px;}
.sgh{background:linear-gradient(90deg,var(--nvl),var(--nv));color:#fff;border-radius:8px 8px 0 0;padding:7px 16px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;}
.sg>.qc{border-radius:0;margin-bottom:0;border-top:1px solid var(--gb);}
.sg>.qc:last-child{border-radius:0 0 10px 10px;margin-bottom:12px;}
.qimg-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px;}
.qimg{max-height:220px;max-width:48%;object-fit:contain;border-radius:4px;border:1px solid var(--bd,#e0e5eb);cursor:zoom-in;transition:max-height .2s,max-width .2s;}
.qimg:active{max-height:none;max-width:100%;}

.mec-controls{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0;}
.mec-flag-btn{background:none;border:none;font-size:16px;cursor:pointer;opacity:.3;padding:0 2px;line-height:1;transition:opacity .2s;}
.mec-flag-btn.mec-flagged{opacity:1;}
.mec-done-btns{display:flex;gap:3px;}
.mec-done-btn{padding:2px 7px;border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid #E0E5EB;color:#A0AAB8;background:none;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}
.mec-done-btn.passed{background:#C8EBD4;border-color:#A5D6A7;color:#2D8C4E;}
.mec-done-btn.active{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
.qc.mec-done{opacity:.45;}
.mec-srs-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:10px 0 8px;padding:10px 0 8px;border-top:1px dashed #c8ebd4;}
.mec-srs-label{font-size:12px;color:#5A6475;}
.mec-srs-btn{padding:5px 10px;border:none;border-radius:8px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;}
.mec-srs-ok{background:#EAF7EE;color:#2D8C4E;}
.mec-srs-mid{background:#FFF8E1;color:#E65100;}
.mec-srs-ng{background:#FDEAEA;color:#C0392B;}
.mec-srs-next{font-size:11px;font-weight:700;margin-left:4px;}
.mec-memo-wrap{margin-top:8px;border-top:1px solid #E0E5EB;padding-top:8px;}
.mec-memo-label{font-size:11px;font-weight:700;color:#2D8C4E;margin-bottom:4px;}
.mec-memo-area{width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #c8ebd4;font-size:13px;font-family:inherit;resize:vertical;background:#fff;outline:none;}
.mec-memo-area:focus{border-color:#2D8C4E;}
"""

STUDY_JS = """\
// State
const selectedSubjects = new Set(STUDY_SUBJECTS.map(s => s.id));
let currentFilter = 'all';
let currentState = 'all';

function toggleSubjectChip(btn, id) {
  if (id === '__all__') {
    const allOn = selectedSubjects.size === STUDY_SUBJECTS.length;
    if (allOn) {
      selectedSubjects.clear();
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('on');
        c.style.background = 'none';
        c.style.borderColor = 'rgba(255,255,255,.3)';
        c.style.color = 'rgba(255,255,255,.6)';
      });
    } else {
      STUDY_SUBJECTS.forEach(s => selectedSubjects.add(s.id));
      document.querySelectorAll('.chip[data-sid="__all__"]').forEach(c => {
        c.classList.add('on');
        c.style.background = 'rgba(255,255,255,.2)';
        c.style.borderColor = '#fff';
        c.style.color = '#fff';
      });
      document.querySelectorAll('.chip:not([data-sid="__all__"])').forEach(c => {
        const subj = STUDY_SUBJECTS.find(s => s.id === c.dataset.sid);
        if (!subj) return;
        c.classList.add('on');
        c.style.background = subj.color + 'bb';
        c.style.borderColor = subj.color;
        c.style.color = '#fff';
      });
    }
  } else {
    const subj = STUDY_SUBJECTS.find(s => s.id === id);
    if (selectedSubjects.has(id)) {
      selectedSubjects.delete(id);
      btn.classList.remove('on');
      btn.style.background = 'none';
      btn.style.borderColor = 'rgba(255,255,255,.3)';
      btn.style.color = 'rgba(255,255,255,.6)';
    } else {
      selectedSubjects.add(id);
      btn.classList.add('on');
      if (subj) {
        btn.style.background = subj.color + 'bb';
        btn.style.borderColor = subj.color;
        btn.style.color = '#fff';
      }
    }
    const allChip = document.querySelector('.chip[data-sid="__all__"]');
    if (allChip) {
      const allOn = selectedSubjects.size === STUDY_SUBJECTS.length;
      allChip.classList.toggle('on', allOn);
      allChip.style.background = allOn ? 'rgba(255,255,255,.2)' : 'none';
      allChip.style.borderColor = allOn ? '#fff' : 'rgba(255,255,255,.3)';
      allChip.style.color = allOn ? '#fff' : 'rgba(255,255,255,.6)';
    }
  }
  applyFilters();
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('fc-on', b.dataset.filter === f));
  applyFilters();
}

function setState(s) {
  currentState = s;
  document.querySelectorAll('[data-state]').forEach(b => b.classList.toggle('fs-on', b.dataset.state === s));
  applyFilters();
}

function applyFilters() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  const flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
  const srs = JSON.parse(localStorage.getItem('srs_v2') || '{}');
  const today = new Date().toISOString().slice(0, 10);
  let visible = 0;
  document.querySelectorAll('.subj-section').forEach(section => {
    const subjVisible = selectedSubjects.has(section.dataset.sid);
    section.dataset.visible = String(subjVisible);
    if (!subjVisible) return;
    section.querySelectorAll('.qc').forEach(c => {
      const uid = c.dataset.uid;
      const r = c.dataset.rate !== undefined && c.dataset.rate !== '' ? +c.dataset.rate : null;
      const f = currentFilter;
      // Difficulty filter
      let showDiff;
      if (f === 'all') showDiff = true;
      else if (f === 'norate') showDiff = r === null;
      else if (f === 'star') showDiff = !!c.querySelector('.bg.bs');
      else if (f === 'img') showDiff = !!c.querySelector('.qimg');
      else if (r !== null) showDiff = (f === 'hard' && r < 60) || (f === 'mid' && r >= 60 && r < 80) || (f === 'easy' && r >= 80);
      else showDiff = false;
      // State filter
      const st = currentState;
      let showState;
      if (st === 'all') showState = true;
      else if (st === 'flag') showState = !!flags[uid];
      else if (st === 'due') { const sr = srs[uid]; showState = !!sr && sr.next <= today; }
      else if (st === 'undone') showState = !done[uid];
      else if (st === 'done') showState = !!done[uid];
      else showState = true;
      const show = showDiff && showState;
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });
  });
  const vc = document.getElementById('visCount');
  if (vc) vc.textContent = visible ? visible + '問' : '—';
}

function initCards() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  const flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
  const srs = JSON.parse(localStorage.getItem('srs_v2') || '{}');
  const memos = JSON.parse(localStorage.getItem('memo_v2') || '{}');
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('.qc[data-uid]').forEach(card => {
    const uid = card.dataset.uid;
    const doneLevel = done[uid] || 0;
    card.querySelectorAll('.mec-done-btn').forEach(b => {
      const bl = +b.dataset.level;
      b.classList.toggle('active', bl === doneLevel);
      b.classList.toggle('passed', bl < doneLevel);
    });
    if (doneLevel) card.classList.add('mec-done');
    const fb = card.querySelector('.mec-flag-btn');
    if (fb && flags[uid]) fb.classList.add('mec-flagged');
    const srsEl = document.getElementById('mecSrs_' + uid);
    const r = srs[uid];
    if (srsEl && r) {
      srsEl.textContent = r.next <= today ? '🔔 復習期限！' : '📅 次回: ' + r.next;
      srsEl.style.color = r.next <= today ? '#C0392B' : '#888';
    }
    const memoEl = card.querySelector('.mec-memo-area');
    if (memoEl && memos[uid]) memoEl.value = memos[uid];
  });
  updateStats();
  applyFilters();
}

function updateStats() {
  if (!window.MECSync) return;
  const stats = MECSync.getStats();
  const d = document.getElementById('statDone');
  if (d) d.textContent = stats.doneCount;
  const r = document.getElementById('statDue');
  if (r) r.textContent = stats.dueCount;
}

document.addEventListener('DOMContentLoaded', () => {
  initCards();
  document.addEventListener('mecSyncComplete', () => { initCards(); });
});
"""


def build_html(all_sections):
    subjects_meta = [
        {'id': s['subj']['id'], 'name': s['subj']['name'],
         'icon': s['subj']['icon'], 'color': s['subj']['color']}
        for s in all_sections if s['chapters']
    ]

    # Build chip row
    chips = ['<button class="chip on" data-sid="__all__" '
             'style="background:rgba(255,255,255,.2);border-color:#fff;color:#fff" '
             'onclick="toggleSubjectChip(this,\'__all__\')">全科目</button>']
    for s in subjects_meta:
        color = s['color']
        chips.append(
            f'<button class="chip on" data-sid="{s["id"]}" '
            f'style="background:{color}bb;border-color:{color};color:#fff" '
            f'onclick="toggleSubjectChip(this,\'{s["id"]}\')">'
            f'{s["icon"]}&nbsp;{s["name"]}</button>'
        )

    # Build content sections
    sections_html = []
    for section_data in all_sections:
        subj = section_data['subj']
        if not section_data['chapters']:
            continue

        parts = []
        total_q = 0
        for ci, ch_data in enumerate(section_data['chapters']):
            cards = ch_data['cards']
            if not cards:
                continue
            title = ch_data['ch']['title']
            parts.append(f'<div class="ch-divider">第{ci + 1}章&emsp;{title}</div>')
            parts.extend(cards)
            total_q += len(cards)

        if not parts:
            continue

        sections_html.append(
            f'<div class="subj-section" data-sid="{subj["id"]}" data-visible="true">\n'
            f'<div class="subj-hdr" style="background:{subj["color"]}">'
            f'<span class="subj-hdr-icon">{subj["icon"]}</span>'
            f'<span class="subj-hdr-name">{subj["name"]}</span>'
            f'<span class="subj-hdr-count">{total_q}問</span>'
            f'</div>\n'
            + '\n'.join(parts)
            + '\n</div>'
        )

    subjects_js = json.dumps(subjects_meta, ensure_ascii=False)
    chip_row = '\n    '.join(chips)
    content = '\n'.join(sections_html)

    total_q = sum(
        sum(len(cd['cards']) for cd in s['chapters'])
        for s in all_sections
    )

    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MEC 統合学習ツール ({total_q}問)</title>
<script src="progress.js"></script>
<style>
{STUDY_CSS}
</style>
</head>
<body>

<header class="st-hdr">
  <div class="st-title-row">
    <span class="st-title">📚 統合学習ツール</span>
    <a class="hub-link" href="index.html">← ハブへ</a>
    <span class="mec-sync-badge">⚙️ 未設定</span>
  </div>
  <div class="st-stats">
    <div class="st-stat">済 <span id="statDone">0</span>問</div>
    <div class="st-stat">復習 <span id="statDue">0</span>問</div>
    <div class="st-stat">合計 <span style="color:#F5A623">{total_q}</span>問</div>
  </div>
  <div class="chip-row">
    {chip_row}
  </div>
  <div class="filter-row">
    <button class="nb fc-on" data-filter="all" onclick="setFilter('all')">全問</button>
    <button class="nb" data-filter="hard" onclick="setFilter('hard')">難問</button>
    <button class="nb" data-filter="mid" onclick="setFilter('mid')">標準</button>
    <button class="nb" data-filter="easy" onclick="setFilter('easy')">易問</button>
    <button class="nb" data-filter="norate" onclick="setFilter('norate')">正答率なし</button>
    <button class="nb" data-filter="star" onclick="setFilter('star')">★問題</button>
    <button class="nb" data-filter="img" onclick="setFilter('img')">🖼️ 画像</button>
    <span class="fsep"></span>
    <span class="vis-count" id="visCount">—</span>
  </div>
  <div class="filter-row2">
    <button class="nb2 fs-on" data-state="all" onclick="setState('all')">すべて</button>
    <button class="nb2" data-state="flag" onclick="setState('flag')">🚩 赤旗</button>
    <button class="nb2" data-state="due" onclick="setState('due')">🔔 要復習</button>
    <button class="nb2" data-state="undone" onclick="setState('undone')">未済</button>
    <button class="nb2" data-state="done" onclick="setState('done')">済み</button>
  </div>
</header>

<div class="ct">
{content}
</div>

<script>
const STUDY_SUBJECTS = {subjects_js};
{STUDY_JS}
</script>
</body>
</html>'''


def main():
    print("chapters_meta.js から科目情報を読込...")
    subjects = load_subjects()
    print(f"  {len(subjects)} 科目")

    all_sections = []
    grand_total = 0

    for subj in subjects:
        print(f"\n=== {subj['name']} ===")
        chapters_data = []

        for ch in subj['chapters']:
            html_path = DST / ch['file']
            if not html_path.exists():
                print(f"  SKIP: {ch['file']} not found")
                continue

            cards = extract_cards(html_path)

            # Fix image paths (base_dir = the subject folder, e.g., "神経")
            base_dir = ch['file'].rsplit('/', 1)[0]
            cards_fixed = [fix_img_paths(c, base_dir) for c in cards]

            print(f"  {html_path.name}: {len(cards_fixed)} cards")
            chapters_data.append({'ch': ch, 'cards': cards_fixed})
            grand_total += len(cards_fixed)

        all_sections.append({'subj': subj, 'chapters': chapters_data})

    print(f"\n合計: {grand_total} cards")
    print("study.html を生成中...")

    html = build_html(all_sections)
    OUT.write_text(html, encoding='utf-8')
    size_kb = OUT.stat().st_size // 1024
    print(f"生成完了: {OUT} ({size_kb} KB)")


if __name__ == '__main__':
    main()
