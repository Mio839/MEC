# -*- coding: utf-8 -*-
"""_tox_ch07_p1.py〜p4.py を連結して _work/build_tox_ch07.py を作る。

⚠️ **build_tox_ch07.py は派生物**。章を直すときはパート側（p1〜p4）を編集してから
   これを流し直すこと（build_tox_ch07.py を直接編集すると次の join で消える）。
   放射線科 ch02 の `_rad_join_ch02.py` と同方式。

  p1 … 冒頭のdocstring・定数・共通の表・QUESTIONS = [ 〜 NO.36
  p2 … NO.37 〜 NO.42
  p3 … NO.43 〜 NO.48 ＋ 閉じ括弧 ]
  p4 … SECTIONS・ヘルパー・render_card・emit
"""
from pathlib import Path

W = Path(__file__).resolve().parent
PARTS = ['_tox_ch07_p1.py', '_tox_ch07_p2.py', '_tox_ch07_p3.py', '_tox_ch07_p4.py']
OUT = W / 'build_tox_ch07.py'

buf = []
for i, name in enumerate(PARTS):
    s = (W / name).read_text(encoding='utf-8')
    if i:
        # 2つ目以降は先頭の coding 宣言・docstring を持たないフラグメント
        s = s.lstrip('﻿')
    buf.append(s)
    if not s.endswith('\n'):
        buf.append('\n')

OUT.write_text(''.join(buf), encoding='utf-8')
print(f'-> {OUT.name}  {OUT.stat().st_size//1024}KB  ({len(PARTS)} parts)')
