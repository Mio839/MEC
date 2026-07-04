import json, re, sys

# questions_kansen.json
data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
all_qs = [q for ch in data['chapters'] for q in ch.get('qs', [])]
q84 = all_qs[83]
sys.stdout.buffer.write(b'=== questions_kansen.json Q84 ===\n')
sys.stdout.buffer.write(json.dumps(q84, ensure_ascii=False, indent=2)[:2000].encode('utf-8'))
sys.stdout.buffer.write(b'\n')

# Also show Q83 and Q85 for context
for idx in [83, 85]:
    q = all_qs[idx-1]
    sys.stdout.buffer.write(f'\n=== Q{idx}: uid={q["uid"]} ep={q["episode"]} ===\n'.encode('utf-8'))
    sys.stdout.buffer.write(q.get('qt','')[:200].encode('utf-8'))
    sys.stdout.buffer.write(b'\n')
