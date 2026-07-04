import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

# Find first 2 question cards with full eg block
cards = re.findall(r'(<div class="qc"[^>]*>.*?)(?=<div class="qc"|$)', content, re.DOTALL)
for card in cards[:2]:
    qnum = re.search(r'<span class="qn">(.*?)</span>', card)
    qt = re.search(r'<div class="qt">(.*?)</div>', card, re.DOTALL)
    cs = re.search(r'<div class="cs">(.*?)</div></div>', card, re.DOTALL)
    eg = re.search(r'<div class="eg">(.*?)</div></div></div>$', card, re.DOTALL)
    print(f'=== {qnum.group(1) if qnum else "?"} ===')
    if qt: print(f'Q: {qt.group(1)[:150]}')
    if cs: print(f'Choices: {cs.group(1)[:300]}')
    if eg: print(f'EG block: {eg.group(1)[:500]}')
    print()
