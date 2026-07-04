import json, sys

data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
chapters = data['chapters']

all_qs = []
for ch in chapters:
    for q in ch.get('qs', []):
        all_qs.append(q)

q20 = all_qs[19]
sys.stdout.buffer.write(json.dumps(q20, ensure_ascii=False, indent=2).encode('utf-8'))
