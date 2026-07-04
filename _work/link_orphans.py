"""
orphan画像を全科目の問題にリンクする。
orphan = ディスク上にあるがJSONのimgs[]に未参照のファイル。
"""
import json, re, os, sys
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')

SUBJECTS = [
    {'sid': 'endo',    'folder': '内分泌'},
    {'sid': 'resp',    'folder': '呼吸器'},
    {'sid': 'circ',    'folder': '循環器'},
    {'sid': 'dige',    'folder': '消化器'},
    {'sid': 'neur',    'folder': '神経'},
    {'sid': 'hbp',     'folder': '肝胆膵'},
    {'sid': 'jinzo_d', 'folder': '腎臓'},
    {'sid': 'hema',    'folder': '血液'},
    {'sid': 'imma',    'folder': '免アレ膠'},
    {'sid': 'kansen',  'folder': '感染症'},
]

BADGE_BI = '<span class="bg bi">📷 画像</span>'


def fname_to_episode(fname):
    m = re.match(r'^(.+?)_\d+\.jpeg$', fname, re.IGNORECASE)
    return m.group(1) if m else None


def normalize_ep(ep):
    return ep.strip('()').strip()


def build_imgrow(imgs):
    parts = []
    for p in imgs:
        fname = p.split('/')[-1]
        parts.append(f'<img alt="" class="qimg" loading="lazy" src="images/{fname}"/>')
    return '<div class="qimg-row">' + ''.join(parts) + '</div>'


def fix_html_card(html, qn, imgs):
    qid = f'q{qn}'
    start = html.find(f'id="{qid}">')
    if start == -1:
        return html, False
    end = html.find('<div class="qc" id="q', start + 1)
    if end == -1:
        end = len(html)
    card = html[start:end]
    orig = card

    # 既存imgrowを除去
    card = re.sub(r'<div class="qimg-row">.*?</div>', '', card, flags=re.S)
    card = re.sub(
        r'(<div class="qt">)(.*?)(</div>)',
        lambda m: m.group(1) + re.sub(r'<div class="qimg-row">.*?</div>', '', m.group(2), flags=re.S) + m.group(3),
        card, count=1, flags=re.S
    )

    # biバッジ追加
    if BADGE_BI not in card:
        if '<span class="cr ' in card:
            card = card.replace('<span class="cr ', BADGE_BI + '<span class="cr ', 1)
        elif '<div class="mec-controls">' in card:
            card = card.replace('<div class="mec-controls">', BADGE_BI + '<div class="mec-controls">', 1)

    # imgrow追加
    imgrow = build_imgrow(imgs)
    for marker in ['</div><div class="cs">', '</div><div class="ab">']:
        if marker in card:
            card = card.replace(marker, imgrow + marker, 1)
            break

    if card == orig:
        return html, False
    return html[:start] + card + html[end:], True


def process_subject(subj):
    sid = subj['sid']
    folder = subj['folder']
    json_path = BASE / f'questions_{sid}.json'
    js_path   = BASE / f'questions_{sid}.js'
    img_dir   = BASE / folder / 'images'
    ch_dir    = BASE / folder

    if not json_path.exists():
        return {'sid': sid, 'error': 'JSON not found'}
    if not img_dir.exists():
        return {'sid': sid, 'error': 'img_dir not found'}

    data = json.loads(json_path.read_text(encoding='utf-8'))
    all_qs = [q for ch in data['chapters'] for q in ch.get('qs', [])]

    # 現在参照済みファイル名
    json_referenced = set()
    for q in all_qs:
        for img_path in q.get('imgs', []):
            json_referenced.add(img_path.split('/')[-1])

    # orphan一覧
    disk_files = sorted([
        f for f in os.listdir(img_dir)
        if f.lower().endswith('.jpeg') and f not in json_referenced
    ])

    # episode -> orphanファイル群
    ep_to_files = {}
    for fname in disk_files:
        ep = fname_to_episode(fname)
        if ep:
            ep_to_files.setdefault(ep, []).append(fname)
    # 各episodeのファイルを_nの順にソート
    for ep in ep_to_files:
        ep_to_files[ep].sort(key=lambda f: int(re.search(r'_(\d+)\.jpeg$', f, re.I).group(1)))

    # episode -> 先頭の問題インデックス（シリーズ問題は最小indexのみ）
    ep_to_first_qidx = {}
    for i, q in enumerate(all_qs):
        ep = normalize_ep(q.get('episode', ''))
        if ep and ep not in ep_to_first_qidx:
            ep_to_first_qidx[ep] = i

    # orphanファイルをリンク
    changed_qidxs = {}   # qidx -> updated imgs list
    unmatched = []

    for ep, fnames in ep_to_files.items():
        if ep not in ep_to_first_qidx:
            unmatched.extend(fnames)
            continue
        qidx = ep_to_first_qidx[ep]
        q = all_qs[qidx]
        existing_fnames = set(p.split('/')[-1] for p in q.get('imgs', []))
        new_files = [f for f in fnames if f not in existing_fnames]
        if not new_files:
            continue  # 既にリンク済み

        # imgs[]に追加（_1, _2, ...順を維持）
        all_for_ep = sorted(
            list(existing_fnames) + new_files,
            key=lambda f: int(re.search(r'_(\d+)\.jpeg$', f, re.I).group(1))
        )
        q['imgs'] = [f'{folder}/images/{f}' for f in all_for_ep]

        # biバッジ追加
        if not any(b['cls'] == 'bi' for b in q.get('badges', [])):
            q.setdefault('badges', []).insert(0, {'cls': 'bi', 't': '📷 画像'})

        changed_qidxs[qidx] = q['imgs']

    if not changed_qidxs:
        return {'sid': sid, 'folder': folder, 'linked': 0, 'unmatched': unmatched}

    # JSON保存
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    js_path.write_text(
        f'window["_cardJSON_{sid}"]=' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n',
        encoding='utf-8'
    )

    # HTML更新
    html_files = sorted(ch_dir.glob('ch*.html'))
    # カードのqn(グローバル)で引く辞書
    qn_to_imgs = {idx + 1: imgs for idx, imgs in changed_qidxs.items()}

    html_fix_counts = {}
    for hf in html_files:
        html = hf.read_text(encoding='utf-8')
        orig_len = len(html)
        n_fixed = 0
        for qn, imgs in qn_to_imgs.items():
            html, changed = fix_html_card(html, qn, imgs)
            if changed:
                n_fixed += 1
        if n_fixed:
            hf.write_text(html, encoding='utf-8')
            html_fix_counts[hf.name] = n_fixed

    return {
        'sid': sid,
        'folder': folder,
        'linked': len(changed_qidxs),
        'html_fixes': html_fix_counts,
        'unmatched': unmatched,
    }


# Run
all_unmatched = {}
summary_lines = []

for subj in SUBJECTS:
    result = process_subject(subj)
    sid = result['sid']
    if 'error' in result:
        summary_lines.append(f'{sid}: ERROR - {result["error"]}')
        continue
    linked = result['linked']
    unmatched = result['unmatched']
    html_info = result.get('html_fixes', {})
    summary_lines.append(
        f'{result["folder"]} ({sid}): {linked}問にimgs[]追加, '
        f'HTML更新={sum(html_info.values())}箇所, '
        f'未マッチ={len(unmatched)}枚'
    )
    if unmatched:
        all_unmatched[result['folder']] = unmatched

output = '\n'.join(summary_lines)
sys.stdout.buffer.write(output.encode('utf-8', 'replace'))
sys.stdout.buffer.write(b'\n')

if all_unmatched:
    sys.stdout.buffer.write(b'\n--- \xe6\x9c\xaa\xe3\x83\x9e\xe3\x83\x83\xe3\x83\x81orphan ---\n')
    for folder, files in all_unmatched.items():
        line = f'{folder}: {len(files)}\xe6\x9c\xaa\n'
        sys.stdout.buffer.write(line.encode('utf-8', 'replace'))
        for f in files[:5]:
            sys.stdout.buffer.write(f'  {f}\n'.encode('utf-8', 'replace'))
        if len(files) > 5:
            sys.stdout.buffer.write(f'  ...他{len(files)-5}枚\n'.encode('utf-8', 'replace'))
