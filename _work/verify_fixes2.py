import json, re

raw = open(r'C:\Users\coool\Desktop\MEC\cards_kansen.js', 'r', encoding='utf-8').read()
prefix = 'window["_cardHTML_kansen"]='
html = json.loads(raw[len(prefix):].rstrip(';'))

# Q20 - count all ch2 divs (including ch2 ok)
m = re.search(r'data-uid="kansen_ch01_q20".{0,3000}?(?=data-uid="kansen_ch01_q21")', html, re.S)
ch2_count = len(re.findall(r'class="ch2', m.group()))
print(f'Q20 total choices (ch2*): {ch2_count}')

# Print choices section
cs_m = re.search(r'<div class="cs">(.+?)</div><div class="ab">', m.group(), re.S)
if cs_m:
    print('Q20 choices content:')
    print(cs_m.group(1)[:600])
