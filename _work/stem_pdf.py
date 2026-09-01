# -*- coding: utf-8 -*-
"""連問の共通ステムを PDF から原文のまま取り出す（原文照合④で使う共通モジュール）。

「次の文を読み、N と M の問いに答えよ。」の行から**最初の設問アンカーの手前**までが
共通ステム。行は pdfchoice.page_lines で作る（右端の正答率欄を落とし、
添字のベースラインずれを吸収するため）。
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pdfchoice

DECL = re.compile(r'次の文を読み[、,]\s*(\d{1,3})\s*[～〜と]\s*(\d{1,3})\s*の問いに答えよ。')
ANCHOR_L = pdfchoice.ANCHOR_L
DROP = re.compile(r'^(?:□|メック予備校用|Q-\d|\d{1,4}$|[A-F]{1,3}$|↗|〔)')


def find(doc):
    """[(先頭NO, 末尾NO, 宣言文, [ステムの行]), ...] を返す。"""
    out = []
    for pno in range(doc.page_count):
        lines = pdfchoice.page_lines(doc, pno)
        for i, (_y, _x, t, _x1) in enumerate(lines):
            m = DECL.search(t)
            if not m:
                continue
            body = [t[m.end():]]
            rest = lines[i + 1:]
            hit = False
            for (_y2, _x2, t2, _x3) in rest:
                if ANCHOR_L.match(t2):
                    hit = True
                    break
                body.append(t2)
            if not hit and pno + 1 < doc.page_count:   # 次ページへまたぐ
                for (_y2, _x2, t2, _x3) in pdfchoice.page_lines(doc, pno + 1):
                    if ANCHOR_L.match(t2):
                        break
                    body.append(t2)
            body = [b for b in (x.strip() for x in body) if b and not DROP.match(b)]
            out.append((int(m.group(1)), int(m.group(2)), m.group(0), body))
    return out
