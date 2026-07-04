"""感染症のHTMLからQ番号を読み取り、audit_images.htmlを再生成"""
import re, json, glob, os

subject = '感染症'

# ch*.html から 試験番号 → Q番号 のマップを作成
code_to_q = {}
for html_path in sorted(glob.glob(f'{subject}/ch*.html')):
    with open(html_path, encoding='utf-8') as f:
        content = f.read()
    # <span class="qn">Q.22</span><span class="qe">(108F-15)</span>
    for m in re.finditer(r'<span class="qn">(Q\.\d+)</span><span class="qe">\(([^)]+)\)</span>', content):
        qn, code = m.group(1), m.group(2)
        code_to_q[code] = qn

print(f'Mapped {len(code_to_q)} codes to Q numbers')

# ログ読み込み
with open(f'{subject}/image_extraction_log.json', encoding='utf-8') as f:
    results = json.load(f)

results_with_imgs = {k: v for k, v in results.items() if v['images']}

# audit HTML再生成
lines = [
    '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">',
    f'<title>画像確認 {subject}</title>',
    '<style>',
    'body{font-family:sans-serif;background:#0d1117;color:#e6edf3;padding:16px;margin:0}',
    'h1{font-size:16px;margin:0 0 12px}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}',
    '.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px}',
    '.card.warn{border-color:#d29922}',
    '.card.shared{border-color:#f85149}',
    '.code{font-size:13px;font-weight:700;color:#58a6ff;margin-bottom:2px}',
    '.qnum{font-size:12px;color:#3fb950;font-weight:700;margin-bottom:4px}',
    '.meta{font-size:10px;color:#8b949e;margin-bottom:6px}',
    '.warn-msg{font-size:10px;color:#d29922;margin-bottom:6px}',
    '.shared-msg{font-size:10px;color:#f85149;margin-bottom:6px}',
    '.imgs{display:flex;flex-wrap:wrap;gap:4px}',
    '.img-wrap{text-align:center}',
    '.img-wrap img{max-width:140px;max-height:120px;border-radius:4px;border:1px solid #30363d}',
    '.img-wrap p{font-size:9px;color:#8b949e;margin:2px 0 0}',
    '</style></head><body>',
    f'<h1>画像抽出確認: {subject} ({len(results_with_imgs)}件)</h1>',
    '<div class="grid">',
]

for code, info in sorted(results_with_imgs.items(), key=lambda x: x[1]['page']):
    imgs = info['images']
    warn = info.get('warn', '') or ''
    is_shared = '同一' in warn
    qnum = code_to_q.get(code, '（HTML未登録）')

    card_cls = 'card shared' if is_shared else ('card warn' if warn else 'card')
    lines.append(f'<div class="{card_cls}">')
    lines.append(f'<div class="qnum">{qnum}</div>')
    lines.append(f'<div class="code">({code})</div>')
    lines.append(f'<div class="meta">PDF p{info["page"]} / 画像 p{imgs[0]["page"] if imgs else "―"} / {len(imgs)}枚</div>')

    if is_shared:
        lines.append(f'<div class="shared-msg">🔴 {warn}</div>')
    elif warn:
        lines.append(f'<div class="warn-msg">⚠ {warn}</div>')

    if imgs:
        lines.append('<div class="imgs">')
        for img in imgs:
            rel = f'images/{img["file"]}'
            lines.append(f'<div class="img-wrap"><img src="{rel}" loading="lazy"><p>{img["file"]}</p></div>')
        lines.append('</div>')

    lines.append('</div>')

lines.append('</div></body></html>')

out_path = f'{subject}/audit_images.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print(f'Done: {out_path}')
