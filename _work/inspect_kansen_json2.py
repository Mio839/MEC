import json, sys

data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
chapters = data['chapters']

for i, ch in enumerate(chapters):
    qs = ch.get('questions', [])
    ch_id = ch.get('id', ch.get('cid', '?'))
    sys.stdout.buffer.write(f'Ch{i+1} id={ch_id} questions={len(qs)}\n'.encode('utf-8'))

# Find ch with q20
for ch in chapters:
    qs = ch.get('questions', [])
    for q in qs:
        uid = q.get('uid', '')
        if 'q20' in uid:
            sys.stdout.buffer.write(f'\nFound Q20 in ch: {ch.get("id")}\n'.encode('utf-8'))
            sys.stdout.buffer.write(json.dumps(q, ensure_ascii=False, indent=2)[:2000].encode('utf-8'))
            break
