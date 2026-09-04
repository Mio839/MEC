import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('questions_hbp.json', encoding='utf-8') as f:
    data = json.load(f)

ch3 = data['chapters'][2]
for q in ch3['qs'][47:53]:
    print(f"==================== {q['uid']} ({q['qn']} {q.get('episode')}) ====================")
    print("rate:", q.get('rate_text'))
    print("badges:", [b['t'] for b in q.get('badges', [])])
    print("qt:", q.get('qt'))
    print("choices:")
    for c in q.get('choices', []):
        print(f"  {c.get('t')} (ok={c.get('ok')})")
    print("ans_label:", q.get('ans_label'))
    print("ans_sub:", q.get('ans_sub'))
    print("imgs:", q.get('imgs'))
    print("eg_count:", len(q.get('eg', [])))
