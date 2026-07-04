import json, sys, glob, re
sys.stdout.reconfigure(encoding='utf-8')

subject = '神経'
with open(f'{subject}/image_extraction_log.json', encoding='utf-8') as f:
    d = json.load(f)

code_to_q = {}
for html_path in sorted(glob.glob(f'{subject}/ch*.html')):
    with open(html_path, encoding='utf-8') as f:
        content = f.read()
    for m in re.finditer(r'<span class="qn">Q\.(\d+)</span><span class="qe">\(([^)]+)\)</span>', content):
        code_to_q[m.group(2)] = f"Q.{m.group(1)}"

flagged = [(k, v) for k, v in d.items() if v.get('shared_page_codes')]
print(f'要確認: {len(flagged)}件\n')
for code, info in sorted(flagged, key=lambda x: x[1]['page']):
    qn = code_to_q.get(code, '?')
    shared = info['shared_page_codes']
    shared_str = ', '.join(f"{c}({code_to_q.get(c,'?')})" for c in shared)
    print(f"  {qn} ({code}) p{info['page']}: {len(info['images'])}枚 | 共有: {shared_str}")
