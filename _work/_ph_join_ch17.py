# -*- coding: utf-8 -*-
"""_ph_ch17_p1..pN.py ＋ _ph_ch17_tail.py を連結して _work/build_ph_ch17.py を作る。

公衆衛生 第17章は11問。1パート2問で分割して書いている。
章を直すときは該当のパート（または tail）を編集してから、このスクリプトを流し直すこと。
build_ph_ch17.py を直接編集しても、次の join で消える。
"""
import glob, io, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
PARTS = sorted(glob.glob(os.path.join(BASE, '_ph_ch17_p*.py')),
               key=lambda p: int(re.search(r'_p(\d+)\.py$', p).group(1)))
TAIL = os.path.join(BASE, '_ph_ch17_tail.py')
OUT = os.path.join(BASE, 'build_ph_ch17.py')

buf = []
for p in PARTS + [TAIL]:
    buf.append(io.open(p, encoding='utf-8').read().lstrip('﻿'))
io.open(OUT, 'w', encoding='utf-8').write('\n'.join(buf))
print('-> %s  parts=%d (%d KB)' % (OUT, len(PARTS), os.path.getsize(OUT) // 1024))
