# -*- coding: utf-8 -*-
"""
全 questions_*.json から uid -> 本番正答率(rate) の軽量インデックスを生成。
stats.html の「取りこぼし分析」「AI相談エクスポート」用。
出力: rate_index.js  (window.MEC_RATE = {uid: rate, ...})
      rate はパーセント整数。rate<0（データ無し）は除外。
"""
import json, os, sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r'C:\Users\coool\Desktop\MEC'
SIDS = ['endo', 'resp', 'circ', 'dige', 'neur', 'hbp', 'jinzo_d', 'hema',
        'imma', 'kansen', 'peds', 'jitsu1', 'custom']

index = {}
per_sid = {}
for sid in SIDS:
    p = os.path.join(BASE, f'questions_{sid}.json')
    if not os.path.exists(p):
        continue
    with open(p, encoding='utf-8') as f:
        d = json.load(f)
    chapters = d.get('chapters', d) if isinstance(d, dict) else d
    n = 0
    for ch in chapters:
        for q in ch.get('qs', []):
            uid = q.get('uid')
            if not uid:
                continue
            rate = q.get('rate', -1)
            # rate が無効(-1)でも rate_text "63%" があれば拾う（感染症など）
            if not (isinstance(rate, (int, float)) and rate >= 0):
                m = re.search(r'(\d+)\s*%', q.get('rate_text', '') or '')
                rate = int(m.group(1)) if m else -1
            if rate >= 0:
                index[uid] = int(rate)
                n += 1
    per_sid[sid] = n

out = os.path.join(BASE, 'rate_index.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('window.MEC_RATE=' + json.dumps(index, ensure_ascii=False, separators=(',', ':')) + ';')

size = os.path.getsize(out)
print(f'rate_index.js: {len(index)}問, {size//1024}KB')
for sid, n in per_sid.items():
    print(f'  {sid}: {n}')
