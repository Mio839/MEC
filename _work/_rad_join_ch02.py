# -*- coding: utf-8 -*-
"""_rad_ch02_p1..p6.py を連結して _work/build_rad_ch02.py を作る。

放射線科 第2章は33問と大きく、1回のWriteに収まらないので分割して書いている。
章を直すときは該当のパートを編集してから、このスクリプトを流し直すこと。
"""
import io, os

BASE = os.path.dirname(os.path.abspath(__file__))
PARTS = [os.path.join(BASE, '_rad_ch02_p%d.py' % i) for i in range(1, 7)]
OUT = os.path.join(BASE, 'build_rad_ch02.py')

buf = []
for i, p in enumerate(PARTS):
    s = io.open(p, encoding='utf-8').read()
    if i > 0:
        # 2つ目以降の先頭にある coding 宣言は落とす（あれば）
        s = s.lstrip('﻿')
    buf.append(s)
io.open(OUT, 'w', encoding='utf-8').write('\n'.join(buf))
print('-> %s (%d KB)' % (OUT, os.path.getsize(OUT) // 1024))
