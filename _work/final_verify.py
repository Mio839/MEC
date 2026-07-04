"""Verify all fixes across all 3 files."""
import json, re, sys

def check(name, ok, note=''):
    status = 'OK' if ok else 'FAIL'
    msg = f'{status} {name}' + (f' [{note}]' if note else '') + '\n'
    sys.stdout.buffer.write(msg.encode('utf-8'))

# ── questions_kansen.json ────────────────────────────────────────────────────
data = json.load(open(r'C:\Users\coool\Desktop\MEC\questions_kansen.json', encoding='utf-8'))
all_qs = [q for ch in data['chapters'] for q in ch.get('qs', [])]

q20 = all_qs[19]
check('JSON Q20 choices', len(q20['choices']) == 5, f'got {len(q20["choices"])}')
check('JSON Q20 correct answer ｃ', q20['choices'][2]['ok'] is True)
check('JSON Q22 imgs 5', len(all_qs[21]['imgs']) == 5)
check('JSON Q27 imgs 4', len(all_qs[26]['imgs']) == 4)
check('JSON Q40 imgs 2', len(all_qs[39]['imgs']) == 2)
check('JSON Q45 imgs 2', len(all_qs[44]['imgs']) == 2)
check('JSON Q46 imgs 5', len(all_qs[45]['imgs']) == 5)
check('JSON Q55 no bi badge', all(b['cls'] != 'bi' for b in all_qs[54].get('badges', [])))
check('JSON Q69 imgs 5', len(all_qs[68]['imgs']) == 5)

# ── cards_kansen.js ──────────────────────────────────────────────────────────
raw = open(r'C:\Users\coool\Desktop\MEC\cards_kansen.js', encoding='utf-8').read()
html_js = json.loads(raw[len('window["_cardHTML_kansen"]='):].rstrip(';'))

def check_js(label, q_num, pattern, expected_count):
    m = re.search(rf'data-uid="kansen_ch01_q{q_num}"(.{{0,2000}}?)(?=data-uid="kansen_ch01_q{q_num+1}")', html_js, re.S)
    count = len(re.findall(pattern, m.group(1) if m else ''))
    check(f'JS  {label}', count >= expected_count, f'{count}/{expected_count}')

check_js('Q20 choices(ch2)', 20, r'class="ch2', 5)
check_js('Q22 imgs',         22, r'108F-15_\d', 5)
check_js('Q27 imgs',         27, r'104H-15_\d', 4)
check_js('Q40 imgs',         40, r'117D-30_\d', 2)
check_js('Q45 imgs',         45, r'115D-65_\d', 2)
check_js('Q46 imgs',         46, r'115F-2_\d',  5)
check_js('Q69 imgs',         69, r'105E-17_\d', 5)
m55 = re.search(r'data-uid="kansen_ch01_q55"(.{0,400})', html_js)
check('JS  Q55 no badge', m55 and 'class="bg bi"' not in m55.group(1))

# ── ch01_kansen_basics.html ──────────────────────────────────────────────────
ch01 = open(r'C:\Users\coool\Desktop\MEC\感染症\ch01_kansen_basics.html', encoding='utf-8').read()

def check_ch(label, q_num, pattern, expected_count):
    m = re.search(rf'id="q{q_num}">(.{{0,2000}})', ch01, re.S)
    count = len(re.findall(pattern, m.group(1) if m else ''))
    check(f'CH  {label}', count >= expected_count, f'{count}/{expected_count}')

m = re.search(r'id="q20">(.{0,800})', ch01, re.S)
check('CH  Q20 choices', m and len(re.findall(r'class="ch2', m.group(1))) >= 5)
check_ch('Q22 imgs', 22, r'108F-15_\d', 5)
check_ch('Q27 imgs', 27, r'104H-15_\d', 4)
check_ch('Q40 imgs', 40, r'117D-30_\d', 2)
check_ch('Q45 imgs', 45, r'115D-65_\d', 2)
check_ch('Q46 imgs', 46, r'115F-2_\d',  5)
m55ch = re.search(r'id="q55">(.{0,400})', ch01)
check('CH  Q55 no badge', m55ch and 'class="bg bi"' not in m55ch.group(1))
check_ch('Q69 imgs', 69, r'105E-17_\d', 5)
