import json, sys

data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
chapters = data['chapters']

all_qs = []
for ch in chapters:
    for q in ch.get('qs', []):
        all_qs.append(q)

for idx in [22, 27, 46, 69]:
    q = all_qs[idx - 1]
    out = {'uid': q['uid'], 'imgs': q.get('imgs', []), 'choices_count': len(q.get('choices', []))}
    sys.stdout.buffer.write(f'Q{idx}: {json.dumps(out, ensure_ascii=False)}\n'.encode('utf-8'))
