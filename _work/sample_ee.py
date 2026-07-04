import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch01_kansen_basics.html', encoding='utf-8') as f:
    content = f.read()

# Find cards that have ee
cards = re.findall(r'(<div class="qc"[^>]*>.*?)(?=<div class="qc"|$)', content, re.DOTALL)
for card in cards:
    if 'class="eb ee"' in card or '"ee"' in card or 'ee"' in card:
        qnum = re.search(r'<span class="qn">(.*?)</span>', card)
        print(f'=== {qnum.group(1) if qnum else "?"} ===')
        # Find the ee block
        ee_match = re.search(r'(<div class="eb ee">.*?</div>)', card, re.DOTALL)
        if ee_match:
            print(ee_match.group(1)[:500])
        else:
            # Look for anything with ee in class
            ee_match2 = re.search(r'(<div class="[^"]*ee[^"]*">.*?</div>)', card, re.DOTALL)
            if ee_match2:
                print(ee_match2.group(1)[:500])
        print()
        break  # Just show first one
