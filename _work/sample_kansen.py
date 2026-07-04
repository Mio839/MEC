import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

# Extract first 3 question cards
cards = re.findall(r'<div class="qc".*?(?=<div class="qc"|</div>\s*</div>\s*<script)', content, re.DOTALL)
for i, card in enumerate(cards[:3]):
    # Extract key parts
    qnum = re.search(r'<span class="qn">(.*?)</span>', card)
    qt = re.search(r'<div class="qt">(.*?)</div>', card, re.DOTALL)
    ac = re.search(r'<div class="ac">(.*?)</div>', card)
    as_ = re.search(r'<div class="as">(.*?)</div>', card, re.DOTALL)
    print(f'=== Card {i+1} ===')
    print(f'Q: {qnum.group(1) if qnum else "?"}')
    print(f'Text: {qt.group(1)[:80] if qt else "?"}')
    print(f'Answer: {ac.group(1) if ac else "?"}')
    print(f'Explanation: {as_.group(1)[:200] if as_ else "?"}')
    print()
