"""
MEC Build Script
OneDrive の解答解説 HTML を Desktop/MEC/ に変換コピーし、
SRS・チェック・フラグ UI を注入して chapters_meta.js を生成する。
"""
import os, re, shutil, json
from pathlib import Path
from bs4 import BeautifulSoup, Tag

SRC = Path(r"C:\Users\coool\OneDrive\MEC_Claude解答解説")
DST = Path(r"C:\Users\coool\Desktop\MEC")

# 分野マッピング: (OneDriveフォルダ名, 出力フォルダ名, UID prefix, 表示名, アイコン, カラー)
SUBJECTS = [
    ("内分泌",  "内分泌",  "endo",   "内分泌",  "⚗️",  "#00838F"),
    ("呼吸器",  "呼吸器",  "resp",   "呼吸器",  "🫁",  "#1565C0"),
    ("循環器",  "循環器",  "circ",   "循環器",  "🫀",  "#C62828"),
    ("消化器",  "消化器",  "dige",   "消化器",  "🦠",  "#6A1B9A"),
    ("神経",    "神経",    "neur",   "神経",    "🧠",  "#2E7D32"),
    ("肝胆膵",  "肝胆膵",  "hbp",    "肝胆膵",  "🏥",  "#E65100"),
    ("腎臓",    "腎臓",    "jinzo_d","腎臓(解説)","🫘", "#78909C"),
    ("血液",    "血液",    "hema",   "血液",    "🩸",  "#B71C1C"),
]

INJECT_CSS = """
<style id="mec-inject-css">
/* MEC injected UI */
.mec-controls{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0;}
.mec-flag-btn{background:none;border:none;font-size:16px;cursor:pointer;opacity:.3;padding:0 2px;line-height:1;transition:opacity .2s;}
.mec-flag-btn.mec-flagged{opacity:1;}
.mec-check-wrap{cursor:pointer;}
.mec-check-wrap input{display:none;}
.mec-check-box{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1.5px solid #E0E5EB;color:#5A6475;white-space:nowrap;transition:all .2s;}
.mec-check-wrap input:checked+.mec-check-box{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}
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
.mec-ch-prog{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#f0f4f8;border-bottom:1px solid #E0E5EB;}
.mec-ch-prog-bar{flex:1;height:6px;background:#E0E5EB;border-radius:3px;overflow:hidden;}
.mec-ch-prog-fill{height:100%;background:#2D8C4E;border-radius:3px;transition:width .3s;}
.mec-ch-prog-txt{font-size:12px;font-weight:700;color:#5A6475;white-space:nowrap;}
.mec-hub-link{display:inline-block;font-size:12px;color:rgba(255,255,255,.7);text-decoration:none;padding:3px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;}
.mec-hub-link:hover{background:rgba(255,255,255,.15);}
.mec-sync-badge{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;cursor:default;}
</style>
"""

INJECT_SCRIPT_TPL = """
<script src="../progress.js"></script>
<script>
// MECSync が初期化後、章ごとの進捗バーを更新
document.addEventListener('mecSyncComplete', function() {
  document.querySelectorAll('.qc[data-uid]').forEach(function(card) {
    var uid = card.dataset.uid;
    var done = JSON.parse(localStorage.getItem('done_v2') || '{}');
    var flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
    var cb = card.querySelector('.mec-done-cb');
    if (cb && done[uid]) { cb.checked = true; card.classList.add('mec-done'); }
    var fb = card.querySelector('.mec-flag-btn');
    if (fb && flags[uid]) fb.classList.add('mec-flagged');
  });
});
</script>
"""

def make_uid(prefix, q_id):
    """q1 → {prefix}_q1"""
    return f"{prefix}_{q_id}"

def inject_controls_to_qh(qh_tag, uid):
    """問題ヘッダーにチェック・フラグボタンを追加"""
    ctrl = Tag(name='div')
    ctrl['class'] = 'mec-controls'
    ctrl.append(BeautifulSoup(
        f'<button class="mec-flag-btn" data-uid="{uid}" onclick="mecToggleFlag(this)" title="苦手フラグ">🚩</button>'
        f'<label class="mec-check-wrap">'
        f'<input type="checkbox" class="mec-done-cb" data-uid="{uid}" onchange="mecOnCheck(this)">'
        f'<span class="mec-check-box">✓ 済</span>'
        f'</label>',
        'html.parser'
    ))
    qh_tag.append(ctrl)

def inject_srs_after_ab(ab_tag, uid):
    """解答ブロックの後に SRS ボタンを挿入"""
    srs_html = (
        f'<div class="mec-srs-row">'
        f'<span class="mec-srs-label">理解度：</span>'
        f'<button class="mec-srs-btn mec-srs-ok" data-uid="{uid}" data-g="2" onclick="mecApplySRS(this)">✅ わかった</button>'
        f'<button class="mec-srs-btn mec-srs-mid" data-uid="{uid}" data-g="1" onclick="mecApplySRS(this)">△ 迷った</button>'
        f'<button class="mec-srs-btn mec-srs-ng" data-uid="{uid}" data-g="0" onclick="mecApplySRS(this)">❌ わからない</button>'
        f'<span class="mec-srs-next" id="mecSrs_{uid}"></span>'
        f'</div>'
        f'<div class="mec-memo-wrap">'
        f'<div class="mec-memo-label">📝 メモ</div>'
        f'<textarea class="mec-memo-area" data-uid="{uid}" placeholder="メモを入力..." oninput="mecOnMemo(this)" rows="2"></textarea>'
        f'</div>'
    )
    ab_tag.insert_after(BeautifulSoup(srs_html, 'html.parser'))

def add_progress_bar(soup):
    """ページ上部に章ごとの進捗バーを追加（.sn の前）"""
    sn = soup.find(class_='sn')
    if not sn:
        return
    prog_html = (
        '<div class="mec-ch-prog">'
        '<a class="mec-hub-link" href="../index.html">← ハブへ</a>'
        '<div class="mec-ch-prog-bar"><div class="mec-ch-prog-fill" style="width:0%"></div></div>'
        '<span class="mec-ch-prog-txt">0/0</span>'
        '<span class="mec-sync-badge">⚙️ 未設定</span>'
        '</div>'
    )
    sn.insert_before(BeautifulSoup(prog_html, 'html.parser'))

def process_html(src_path, dst_path, prefix):
    """HTMLを読み込んでUIを注入し保存。問題数を返す"""
    with open(src_path, encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    cards = soup.find_all('div', class_='qc')
    count = 0

    for card in cards:
        q_id = card.get('id', '')
        if not q_id:
            continue
        uid = make_uid(prefix, q_id)
        card['data-uid'] = uid

        # チェック・フラグをヘッダーに追加
        qh = card.find(class_='qh')
        if qh:
            inject_controls_to_qh(qh, uid)

        # SRS ボタンをアンサーブロックの後に追加
        ab = card.find(class_='ab')
        if ab:
            inject_srs_after_ab(ab, uid)

        count += 1

    # 進捗バー追加
    add_progress_bar(soup)

    # CSS 注入 (</head> の前)
    head = soup.find('head')
    if head:
        head.append(BeautifulSoup(INJECT_CSS, 'html.parser'))

    # JS 注入 (</body> の前)
    body = soup.find('body')
    if body:
        body.append(BeautifulSoup(INJECT_SCRIPT_TPL, 'html.parser'))

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

    return count

def build():
    meta = {}  # { prefix_ch: { count: N, title: "...", file: "..." } }
    subject_meta = []

    for (src_dir, dst_dir, prefix, label, icon, color) in SUBJECTS:
        src_folder = SRC / src_dir
        dst_folder = DST / dst_dir
        if not src_folder.exists():
            print(f"  SKIP {src_dir}: folder not found")
            continue

        html_files = sorted(src_folder.glob("*.html"))
        chapters = []

        for html_file in html_files:
            # chXX_ から章番号を抽出
            m = re.match(r'(ch\d+)', html_file.stem)
            ch_num = m.group(1) if m else html_file.stem
            ch_prefix = f"{prefix}_{ch_num}"

            dst_file = dst_folder / html_file.name
            count = process_html(html_file, dst_file, ch_prefix)
            print(f"  OK {dst_dir}/{html_file.name}  ({count}q, prefix={ch_prefix})")

            # タイトルを <title> タグから取得
            with open(html_file, encoding='utf-8') as f:
                title_m = re.search(r'<title>(.*?)</title>', f.read(), re.IGNORECASE)
            title_raw = title_m.group(1) if title_m else html_file.stem
            # "MEC… | 分野" → 章名だけ抽出
            title = re.sub(r'^.*?第\d+章[｜|]?\s*', '', title_raw).strip()
            title = re.sub(r'\s*解答解説.*$', '', title).strip()
            if not title or len(title) > 40:
                title = html_file.stem.replace('_', ' ')

            chapters.append({
                "prefix": ch_prefix,
                "file": f"{dst_dir}/{html_file.name}",
                "title": title,
                "count": count
            })
            meta[ch_prefix] = {"count": count, "title": title, "file": f"{dst_dir}/{html_file.name}"}

        subject_meta.append({
            "id": prefix,
            "name": label,
            "icon": icon,
            "color": color,
            "chapters": chapters
        })
        print(f"  -> {label}: {len(chapters)} chapters done")

    # chapters_meta.js 生成
    meta_js = "// Auto-generated by build.py -- do not edit manually\n"
    meta_js += "const MEC_CHAPTERS = " + json.dumps(subject_meta, ensure_ascii=False, indent=2) + ";\n"
    meta_js += "const MEC_CHAPTER_META = " + json.dumps(meta, ensure_ascii=False, indent=2) + ";\n"
    (DST / "chapters_meta.js").write_text(meta_js, encoding='utf-8')
    print(f"\nchapters_meta.js generated")

    total = sum(v["count"] for v in meta.values())
    print(f"Total: {total} questions processed")

if __name__ == '__main__':
    build()
