import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

cards = re.findall(r'<div class="qc"[^>]*>(.*?)(?=<div class="qc"|$)', content, re.DOTALL)
for card in cards:
    qnum = re.search(r'<span class="qn">(Q\.\d+)</span>', card)
    qt = re.search(r'<div class="qt">(.*?)</div>', card, re.DOTALL)
    ac = re.search(r'<div class="ac">(.*?)</div>', card)
    # clean html tags from qt
    qt_text = re.sub(r'<[^>]+>', '', qt.group(1)) if qt else '?'
    ac_text = ac.group(1) if ac else '?'
    print(f'{qnum.group(1) if qnum else "?"}: {qt_text[:60]} → {ac_text[:30]}')
