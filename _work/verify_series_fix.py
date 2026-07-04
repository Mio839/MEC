#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TARGETS = {
    'neur_ch03_q141','neur_ch03_q170','neur_ch03_q182','neur_ch03_q183',
    'neur_ch03_q205','neur_ch03_q218','neur_ch03_q222','neur_ch03_q229',
    'neur_ch03_q230','neur_ch04_q260','neur_ch05_q292','neur_ch05_q296',
    'neur_ch05_q306','neur_ch05_q320','neur_ch06_q344','neur_ch06_q345',
}
CARD_PAT = re.compile(r'data-uid="([^"]+)" id="q(\d+)"')
QE_PAT   = re.compile(r'<span[^>]*class="qe"[^>]*>\(?([^<()（）]+?)\)?</span>')
QT_PAT   = re.compile(r'<div class="qt">(.*?)</div>', re.DOTALL)

def strip_html(s): return re.sub(r'<[^>]+>', '', s).strip()

with open('study.html', encoding='utf-8') as f:
    study = f.read()

cards = [(m.start(), m.group(1)) for m in CARD_PAT.finditer(study)]
fixed, not_fixed = [], []

for i, (pos, uid) in enumerate(cards):
    if uid not in TARGETS: continue
    end = cards[i+1][0] if i+1 < len(cards) else len(study)
    card = study[pos:end]
    qe_m = QE_PAT.search(card[:600])
    code = qe_m.group(1).strip() if qe_m else '?'
    qt_m = QT_PAT.search(card)
    qt = qt_m.group(1) if qt_m else ''
    has_ctx = 'qt-context' in qt
    qt_plain = strip_html(qt)
    if has_ctx:
        ctx_end = qt.find('</span><br>')
        ctx = strip_html(qt[:ctx_end])[:80] if ctx_end != -1 else ''
        q_part = strip_html(qt[ctx_end:]) if ctx_end != -1 else qt_plain[:50]
        fixed.append(f'  ✓ {uid} ({code})\n    [前問] {ctx}\n    [問]   {q_part}')
    else:
        not_fixed.append(f'  ✗ {uid} ({code}): {qt_plain[:80]}')

print(f'=== 補完済み ({len(fixed)}件) ===')
for s in fixed: print(s)
print(f'\n=== 未補完 ({len(not_fixed)}件) ===')
for s in not_fixed: print(s)
