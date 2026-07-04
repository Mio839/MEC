#!/usr/bin/env python3
"""Generate questions_*.js wrappers for file:// local access fallback."""
import json
from pathlib import Path

BASE = Path(__file__).parent.parent
SIDS = ['endo','resp','circ','dige','neur','hbp','jinzo_d','hema','imma','kansen','jitsu1','peds']

for sid in SIDS:
    src = BASE / f'questions_{sid}.json'
    if not src.exists():
        print(f'SKIP {sid} (json not found)')
        continue
    data = src.read_text(encoding='utf-8')
    out = BASE / f'questions_{sid}.js'
    out.write_text(f'window["_cardJSON_{sid}"]={data};', encoding='utf-8')
    print(f'{out.name}: {out.stat().st_size // 1024}KB')

print('Done.')
