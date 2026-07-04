#!/usr/bin/env python3
"""感染症セクションを study.html の免アレ膠直後（外側 </div> の前）に挿入"""
import re, os

BASE = r"C:\Users\coool\Desktop\MEC"
STUDY = os.path.join(BASE, "study.html")

CHAPTERS = [
    ("ch01", "感染症の基本",          "ch01_kansen_basics.html",  1,   80),
    ("ch02", "消化器の感染症",         "ch02_kansen_gi.html",     81,   98),
    ("ch03", "皮膚・軟部組織の感染症", "ch03_kansen_skin.html",   99,  143),
    ("ch04", "呼吸器の感染症",         "ch04_kansen_resp.html",  144,  239),
    ("ch05", "非結核性抗酸菌症",       "ch05_kansen_ntm.html",   240,  279),
    ("ch06", "HIV感染症",             "ch06_kansen_hiv.html",    280,  332),
    ("ch07", "その他の感染症",         "ch07_kansen_other.html", 333,  356),
]

def make_mec_controls(uid):
    return (
        f'<div class="mec-controls">'
        f'<button class="mec-flag-btn" data-uid="{uid}" data-action="flag" title="苦手フラグ">🚩</button>'
        f'<button class="mec-lap-btn" data-uid="{uid}" data-action="lap">済<span class="mec-lap-num"></span></button>'
        f'</div>'
    )

def extract_qc_blocks(html_text, ch_id, q_start):
    """chapter HTML から qc ブロックを一覧取得し uid を付与して返す"""
    # <div class="ct"> の中身だけを対象にする
    ct_m = re.search(r'<div class="ct">(.*)', html_text, re.DOTALL)
    body = ct_m.group(1) if ct_m else html_text

    # セクションヘッダー div.sh → ch-divider に変換
    def sh_to_divider(m):
        h2 = re.search(r'<h2>(.*?)</h2>', m.group(0), re.DOTALL)
        label = h2.group(1).strip() if h2 else ""
        return f'<div class="ch-divider">{label}</div>'
    body = re.sub(r'<div class="sh">.*?</div>\s*</div>', sh_to_divider, body, flags=re.DOTALL)
    body = re.sub(r'<div id="s\d+">', '', body)

    # qc ブロックを入れ子 div カウントで取り出す
    results = []   # (type, content): type = 'divider' or 'qc'
    i = 0
    q_counter = [0]

    while i < len(body):
        # ch-divider を先に探す
        cd_m = re.search(r'<div class="ch-divider">.*?</div>', body[i:], re.DOTALL)
        qc_m = re.search(r'<div(?:\s[^>]*)?\s+class="qc"', body[i:])

        if not qc_m:
            # 残りの ch-divider をすべて追加
            for m in re.finditer(r'<div class="ch-divider">.*?</div>', body[i:], re.DOTALL):
                results.append(('divider', m.group(0)))
            break

        # ch-divider が qc より先にある場合
        if cd_m and cd_m.start() < qc_m.start():
            results.append(('divider', cd_m.group(0)))
            i += cd_m.end()
            continue

        # qc ブロックを入れ子カウントで切り出す
        abs_start = i + qc_m.start()
        pos = abs_start
        depth = 0
        while pos < len(body):
            next_open  = body.find('<div', pos)
            next_close = body.find('</div>', pos)
            if next_close < 0:
                pos = len(body)
                break
            if next_open >= 0 and next_open < next_close:
                depth += 1
                pos = next_open + 4
            else:
                depth -= 1
                pos = next_close + 6
                if depth == 0:
                    break
        qc_block = body[abs_start:pos]

        # 問番号 id="qN" から取得
        id_m = re.search(r'\bid="q(\d+)"', qc_block)
        if id_m:
            q_num = int(id_m.group(1))
        else:
            q_counter[0] += 1
            q_num = q_start + q_counter[0] - 1

        uid = f"kansen_{ch_id}_q{q_num}"

        # data-uid 付与
        if 'data-uid=' not in qc_block[:qc_block.find('>')]:
            qc_block = qc_block.replace('<div ', f'<div data-uid="{uid}" ', 1)

        # mec-controls を qh に追加
        if 'mec-controls' not in qc_block:
            def add_ctrl(m):
                inner = m.group(1)
                return f'<div class="qh">{inner}{make_mec_controls(uid)}</div>'
            qc_block = re.sub(r'<div class="qh">(.*?)</div>', add_ctrl, qc_block, count=1, flags=re.DOTALL)

        # 画像パス修正
        qc_block = qc_block.replace('src="images/', 'src="感染症/images/')

        results.append(('qc', qc_block))
        i = pos

    return results


def main():
    print("study.html 読み込み中...")
    with open(STUDY, encoding="utf-8") as f:
        study = f.read()

    if 'data-sid="kansen"' in study:
        print("既に感染症セクションが存在します。中止。")
        return

    # 各章を処理
    all_parts = []
    total_q = 0
    for ch_id, ch_name, filename, q_start, q_end in CHAPTERS:
        path = os.path.join(BASE, "感染症", filename)
        with open(path, encoding="utf-8") as f:
            html = f.read()
        ch_num = int(ch_id[2:])
        parts = extract_qc_blocks(html, ch_id, q_start)
        qc_count = sum(1 for t, _ in parts if t == 'qc')
        total_q += qc_count
        print(f"  ch{ch_num:02d} {ch_name}: {qc_count}問")
        # 章見出しを先頭に挿入
        all_parts.append(('divider', f'<div class="ch-divider">第{ch_num}章&emsp;{ch_name}</div>'))
        all_parts.extend(parts)

    print(f"合計 {total_q}問")

    # subj-section を組み立て
    lines = [f'<div class="subj-section" data-sid="kansen" data-visible="true">',
             f'<div class="subj-hdr" style="background:#00695C">'
             f'<span class="subj-hdr-icon">🦠</span>'
             f'<span class="subj-hdr-name">感染症</span>'
             f'<span class="subj-hdr-count">{total_q}問</span>'
             f'</div>']
    for _, content in all_parts:
        lines.append(content)
    lines.append('</div>')
    section_html = '\n'.join(lines)

    # 挿入位置: imma セクション直後の </div>（外側コンテナ）の直前
    # = imma セクションの </div> の直後、外側 </div> の直前
    # 具体的には </div>\n</div>\n\n<script> のパターンを探す
    insert_marker = '</div>\n</div>\n\n<script>'
    pos = study.rfind(insert_marker)
    if pos == -1:
        insert_marker = '</div>\n</div>\n<script>'
        pos = study.rfind(insert_marker)
    if pos == -1:
        print("挿入マーカーが見つかりません")
        # fallback: <script> の直前の </div> を探す
        script_pos = study.rfind('\n<script>')
        pos = study.rfind('</div>', 0, script_pos)
        insert_at = pos + 6  # </div> の後
    else:
        # </div> の後、</div> の前に挿入
        insert_at = pos + 6  # 最初の </div> の後

    study_new = study[:insert_at] + '\n' + section_html + '\n' + study[insert_at:]

    # チップボタン追加
    imma_chip = '<button class="chip" data-sid="imma" onclick="toggleSubjectChip(this,\'imma\')">🛡️&nbsp;免アレ膠</button>'
    kansen_chip = '\n    <button class="chip" data-sid="kansen" onclick="toggleSubjectChip(this,\'kansen\')">🦠&nbsp;感染症</button>'
    study_new = study_new.replace(imma_chip, imma_chip + kansen_chip, 1)

    # STUDY_SUBJECTS に kansen を追加
    study_new = study_new.replace(
        '{"id": "imma", "name": "免アレ膠", "icon": "🛡️", "color": "#AD1457"}]',
        '{"id": "imma", "name": "免アレ膠", "icon": "🛡️", "color": "#AD1457"}, {"id": "kansen", "name": "感染症", "icon": "🦠", "color": "#00695C"}]'
    )

    # subjNameMap に kansen を追加（exam resume など）
    study_new = study_new.replace(
        "hema:'血液'",
        "hema:'血液', kansen:'感染症'"
    )

    print("study.html に書き込み中...")
    with open(STUDY, "w", encoding="utf-8") as f:
        f.write(study_new)
    print("完了！")

if __name__ == "__main__":
    main()
