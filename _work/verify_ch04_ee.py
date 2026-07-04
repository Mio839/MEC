import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

# Find Q144 card and check ee block
match = re.search(r'(<div class="qc" id="q144">.*?)(?=<div class="qc" id="q145">)', content, re.DOTALL)
if match:
    card = match.group(1)
    ee_match = re.search(r'<div class="eb ee">.*?</div>', card, re.DOTALL)
    if ee_match:
        print("Q144 ee block found:")
        print(ee_match.group(0)[:400])
    else:
        print("Q144 ee block NOT found!")

# Count ep and ee
ep_count = len(re.findall(r'class="[^"]*\bep\b[^"]*"', content))
ee_count = len(re.findall(r'class="[^"]*\bee\b[^"]*"', content))
print(f"\nTotal: ep={ep_count} ee={ee_count}")
# Find missing ee
cards = re.findall(r'<div class="qc" id="(q\d+)">', content)
missing = []
for qid in cards:
    card_match = re.search(f'<div class="qc" id="{qid}">(.*?)(?=<div class="qc"|$)', content, re.DOTALL)
    if card_match and 'class="eb ee"' not in card_match.group(1):
        missing.append(qid)
print(f"Missing ee: {missing}")
