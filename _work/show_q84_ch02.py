import re, sys

html = open(r'C:\Users\coool\Desktop\MEC\感染症\ch02_kansen_gi.html', encoding='utf-8').read()
m = re.search(r'id="q84">(.{0,3000})', html, re.S)
if m:
    sys.stdout.buffer.write(m.group(1)[:2500].encode('utf-8'))
