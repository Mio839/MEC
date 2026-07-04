#!/usr/bin/env python3
"""感染症 章HTMLからqcを抽出してstudy.htmlに挿入するスクリプト"""
import re, os

BASE = r"C:\Users\coool\Desktop\MEC"
STUDY = os.path.join(BASE, "study.html")

CHAPTERS = [
    ("ch01", "感染症の基本",        "ch01_kansen_basics.html"),
    ("ch02", "消化器の感染症",       "ch02_kansen_gi.html"),
    ("ch03", "皮膚・軟部組織の感染症", "ch03_kansen_skin.html"),
    ("ch04", "呼吸器の感染症",       "ch04_kansen_resp.html"),
    ("ch05", "非結核性抗酸菌症",      "ch05_kansen_ntm.html"),
    ("ch06", "HIV感染症",           "ch06_kansen_hiv.html"),
    ("ch07", "その他の感染症",        "ch07_kansen_other.html"),
]

def make_mec_controls(uid: str) -> str:
    return (
        f'<div class="mec-controls">'
        f'<button class="mec-flag-btn" data-uid="{uid}" data-action="flag" title="苦手フラグ">🚩</button>'
        f'<button class="mec-lap-btn" data-uid="{uid}" data-action="lap">済<span class="mec-lap-num"></span></button>'
        f'</div>'
    )

def extract_chapter(ch_id: str, ch_name: str, filename: str):
    """章HTMLからqcブロック一覧とセクション区切りを返す"""
    path = os.path.join(BASE, "感染症", filename)
    with open(path, encoding="utf-8") as f:
        html = f.read()

    # <div class="ct">～</div></div></div> の本文部分を取得
    m = re.search(r'<div class="ct">(.*?)</div>\s*<div class="pf"', html, re.DOTALL)
    if not m:
        # fallback: <div class="ct"> 以降すべて
        m = re.search(r'<div class="ct">(.*)', html, re.DOTALL)
    body = m.group(1) if m else html

    ch_num = int(ch_id[2:])   # "ch01" -> 1

    # セクションヘッダー (sh div) を ch-divider に変換
    def sh_to_divider(match):
        inner = match.group(1)
        # <h2>テキスト</h2> を取り出す
        h2 = re.search(r'<h2>(.*?)</h2>', inner)
        label = h2.group(1) if h2 else ch_name
        return f'<div class="ch-divider">{label}</div>'

    body = re.sub(r'<div class="sh">(.*?)</div></div>', sh_to_divider, body, flags=re.DOTALL)
    # 残った <div id="sN"> ラッパーも除去
    body = re.sub(r'<div id="s\d+">', '', body)

    # qc ごとに data-uid を付与 + mec-controls 追加
    q_counter = [0]

    def process_qc(match):
        attrs = match.group(1)   # class="qc" ...
        content = match.group(2)

        # id="qN" から問番号取得
        id_m = re.search(r'id="q(\d+)"', attrs)
        q_num = int(id_m.group(1)) if id_m else (q_counter[0] + 1)
        q_counter[0] = q_num

        uid = f"kansen_{ch_id}_q{q_num}"

        # data-uid がまだ無ければ追加
        new_attrs = attrs
        if 'data-uid=' not in attrs:
            new_attrs = f'data-uid="{uid}" ' + attrs

        # qh の末尾（</div>の直前）に mec-controls を挿入
        def add_controls(qh_match):
            qh_inner = qh_match.group(1)
            if 'mec-controls' not in qh_inner:
                qh_inner += make_mec_controls(uid)
            return f'<div class="qh">{qh_inner}</div>'

        content = re.sub(r'<div class="qh">(.*?)</div>', add_controls, content, flags=re.DOTALL, count=1)

        # 画像パスを感染症/ に変換（images/ → 感染症/images/）
        content = re.sub(r'src="images/', 'src="感染症/images/', content)
        content = re.sub(r'src="感染症/感染症/images/', 'src="感染症/images/', content)

        return f'<div {new_attrs}>{content}</div>'

    body = re.sub(r'<div ((?:class|id|data)[^>]*)>(.*?)</div>(?=\s*(?:<div|$))',
                  lambda m: process_qc(m) if 'class="qc"' in m.group(1) else m.group(0),
                  body, flags=re.DOTALL)

    # より正確な qc 抽出: qc ブロック単位でパース
    # BeautifulSoupなしで正規表現でやる：入れ子divに対応した手動パーサ
    result_blocks = []
    i = 0
    while i < len(body):
        m = re.search(r'<div\s+(?:[^>]*\s)?class="[^"]*\bqc\b[^"]*"', body[i:])
        if not m:
            # セクション区切りは残す
            div_m = re.search(r'<div class="ch-divider">.*?</div>', body[i:], re.DOTALL)
            if div_m:
                result_blocks.append(div_m.group(0))
            break
        start_offset = i + m.start()

        # ch-divider があれば先に追加
        pre = body[i:start_offset]
        for cd in re.findall(r'<div class="ch-divider">.*?</div>', pre, re.DOTALL):
            result_blocks.append(cd)

        # qc ブロックの終わりを見つける（入れ子divカウント）
        pos = start_offset
        depth = 0
        while pos < len(body):
            open_m = re.search(r'<div', body[pos:])
            close_m = re.search(r'</div>', body[pos:])
            if not close_m:
                break
            if open_m and open_m.start() < close_m.start():
                depth += 1
                pos += open_m.start() + 4
            else:
                depth -= 1
                pos += close_m.start() + 6
                if depth == 0:
                    break

        qc_block = body[start_offset:pos]

        # data-uid 付与
        id_m = re.search(r'id="q(\d+)"', qc_block)
        q_num = int(id_m.group(1)) if id_m else (q_counter[0] + 1)
        q_counter[0] = q_num
        uid = f"kansen_{ch_id}_q{q_num}"

        if f'data-uid="{uid}"' not in qc_block:
            qc_block = qc_block.replace('<div class="qc"', f'<div class="qc" data-uid="{uid}"', 1)
            # data-rate あり形式にも対応
            qc_block = re.sub(
                r'<div (data-rate="[^"]*" class="qc")',
                lambda mm: f'<div data-uid="{uid}" {mm.group(1)}',
                qc_block, count=1
            )

        # mec-controls 追加
        if 'mec-controls' not in qc_block:
            def add_controls_inner(qh_m):
                inner = qh_m.group(1)
                inner += make_mec_controls(uid)
                return f'<div class="qh">{inner}</div>'
            qc_block = re.sub(r'<div class="qh">(.*?)</div>', add_controls_inner,
                               qc_block, count=1, flags=re.DOTALL)

        # 画像パス修正
        qc_block = re.sub(r'src="images/', 'src="感染症/images/', qc_block)

        result_blocks.append(qc_block)
        i = pos

    return result_blocks, q_counter[0]


def main():
    print("study.html を読み込み中...")
    with open(STUDY, encoding="utf-8") as f:
        study = f.read()

    if 'data-sid="kansen"' in study:
        print("既に感染症セクションが存在します。中止。")
        return

    # 全章を処理
    all_blocks = []
    total_q = 0
    for ch_id, ch_name, filename in CHAPTERS:
        print(f"  {filename} を処理中...")
        blocks, last_q = extract_chapter(ch_id, ch_name, filename)
        # 章ヘッダー
        ch_num = int(ch_id[2:])
        divider = f'<div class="ch-divider">第{ch_num}章&emsp;{ch_name}</div>'
        # blocks 先頭に ch-divider がなければ追加
        if not blocks or 'ch-divider' not in (blocks[0] if blocks else ''):
            all_blocks.append(divider)
        all_blocks.extend(blocks)
        q_count = sum(1 for b in blocks if 'class="qc"' in b)
        total_q += q_count
        print(f"    → {q_count}問 抽出")

    print(f"\n合計 {total_q}問")

    # subj-section 組み立て
    section_html = (
        f'\n<div class="subj-section" data-sid="kansen" data-visible="true">\n'
        f'<div class="subj-hdr" style="background:#00695C">'
        f'<span class="subj-hdr-icon">🦠</span>'
        f'<span class="subj-hdr-name">感染症</span>'
        f'<span class="subj-hdr-count">{total_q}問</span>'
        f'</div>\n'
        + '\n'.join(all_blocks)
        + '\n</div>\n'
    )

    # imma セクションの終わりを探してその後に挿入
    # imma セクションは </div> で閉じる（最後の subj-section）
    # study.html のほぼ末尾にある
    insert_marker = '</div>\n</div>\n'  # 免アレ膠の閉じタグ付近

    # より確実に: data-sid="imma" の subj-section 終わりを探す
    # imma の後の最初の </div>\n で終わる（subj-section の閉じ）
    m = re.search(r'(data-sid="imma".*?</div>\s*\n)(?=\s*(?:<script|<!--|\Z))',
                  study, re.DOTALL)
    if not m:
        # fallback: 最後の subj-section の閉じ </div> の後
        m = re.search(r'(</div>\s*\n)(\s*<script)', study, re.DOTALL)
        if m:
            insert_pos = m.start(2)
        else:
            print("挿入位置が見つかりませんでした")
            return
    else:
        insert_pos = m.end()

    new_study = study[:insert_pos] + section_html + study[insert_pos:]

    # チップボタンを追加（感染症チップ）
    chip_marker = '<button class="chip" data-sid="imma" onclick="toggleSubjectChip(this,\'imma\')">🛡️&nbsp;免アレ膠</button>'
    kansen_chip = '\n    <button class="chip" data-sid="kansen" onclick="toggleSubjectChip(this,\'kansen\')">🦠&nbsp;感染症</button>'
    new_study = new_study.replace(chip_marker, chip_marker + kansen_chip)

    # JS の subjNameMap に kansen を追加
    new_study = new_study.replace(
        "hema:'血液'",
        "hema:'血液', kansen:'感染症'"
    )
    # 他のsbjNameMap箇所も
    new_study = new_study.replace(
        "'hema':'血液'",
        "'hema':'血液', 'kansen':'感染症'"
    )

    print("study.html に書き込み中...")
    with open(STUDY, "w", encoding="utf-8") as f:
        f.write(new_study)
    print("完了！")


if __name__ == "__main__":
    main()
