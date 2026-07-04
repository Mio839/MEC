import json, re, sys

# questions_kansen.json
data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
all_qs = [q for ch in data['chapters'] for q in ch.get('qs', [])]
q84 = all_qs[83]

sys.stdout.buffer.write(b'=== questions_kansen.json Q84 ===\n')
sys.stdout.buffer.write(f'qt (first 80): {q84["qt"][:80]}\n'.encode('utf-8'))
sys.stdout.buffer.write(f'choices: {len(q84["choices"])}, correct: {[c["t"] for c in q84["choices"] if c["ok"]]}\n'.encode('utf-8'))
sys.stdout.buffer.write(f'imgs: {q84["imgs"]}\n'.encode('utf-8'))
sys.stdout.buffer.write(f'ans_label: {q84["ans_label"]}\n'.encode('utf-8'))

# cards_kansen.js
raw = open(r'C:\Users\coool\Desktop\MEC\cards_kansen.js', encoding='utf-8').read()
html = json.loads(raw[len('window["_cardHTML_kansen"]='):].rstrip(';'))
m = re.search(r'data-uid="kansen_ch02_q84"(.{0,600})', html, re.S)
if m:
    sys.stdout.buffer.write(b'\n=== cards_kansen.js Q84 (first 400) ===\n')
    sys.stdout.buffer.write(m.group(1)[:400].encode('utf-8'))
