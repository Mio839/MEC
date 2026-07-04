import json, sys, re

raw = open(r'C:\Users\coool\Desktop\MEC\cards_kansen.js', 'r', encoding='utf-8').read()
prefix = 'window["_cardHTML_kansen"]='
html = json.loads(raw[len(prefix):].rstrip(';'))

checks = [
    ('Q20 choices',  r'data-uid="kansen_ch01_q20".{0,2000}?(?=data-uid="kansen_ch01_q21")', 'class="ch2"', 5),
    ('Q22 images',   r'data-uid="kansen_ch01_q22".{0,1500}', '108F-15_', 5),
    ('Q27 images',   r'data-uid="kansen_ch01_q27".{0,1500}', '104H-15_', 4),
    ('Q40 images',   r'data-uid="kansen_ch01_q40".{0,1500}', '117D-30_', 2),
    ('Q45 images',   r'data-uid="kansen_ch01_q45".{0,1500}', '115D-65_', 2),
    ('Q46 images',   r'data-uid="kansen_ch01_q46".{0,1500}', '115F-2_',  5),
    ('Q69 images',   r'data-uid="kansen_ch01_q69".{0,1500}', '105E-17_', 5),
]

for name, pattern, needle, expected in checks:
    m = re.search(pattern, html, re.S)
    if not m:
        print(f'{name}: PATTERN NOT FOUND')
        continue
    count = len(re.findall(re.escape(needle), m.group()))
    status = 'OK' if count >= expected else f'FAIL (got {count}, expected {expected})'
    print(f'{name}: {status}')

# Q55 badge check
m55 = re.search(r'data-uid="kansen_ch01_q55".{0,600}', html)
has_badge = 'class="bg bi"' in m55.group()
print(f'Q55 badge removed: {"FAIL (still present)" if has_badge else "OK"}')
