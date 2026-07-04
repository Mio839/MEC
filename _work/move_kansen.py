#!/usr/bin/env python3
"""感染症セクションを免アレ膠の直後に移動する"""
import re, os

STUDY = r"C:\Users\coool\Desktop\MEC\study.html"

with open(STUDY, encoding="utf-8") as f:
    html = f.read()

# 感染症セクションを抽出
kansen_start = html.find('\n<div class="subj-section" data-sid="kansen"')
if kansen_start == -1:
    kansen_start = html.find('<div class="subj-section" data-sid="kansen"')

# kansen セクションの終わりを見つける（次の subj-section の直前）
kansen_end = html.find('<div class="subj-section"', kansen_start + 10)
if kansen_end == -1:
    print("次の subj-section が見つかりません")
    exit(1)

kansen_block = html[kansen_start:kansen_end]
print(f"感染症セクション: {len(kansen_block)} 文字")
print(f"開始位置: {kansen_start}, 終了位置: {kansen_end}")

# 感染症ブロックを削除
html_without_kansen = html[:kansen_start] + html[kansen_end:]

# 免アレ膠セクションの後に挿入
# imma セクション → 次の </div> が閉じセクション（subj-section の閉じ div は最後のもの）
# imma セクションの後には <script が来る
imma_end = html_without_kansen.rfind('</div>', 0, html_without_kansen.find('\n<script'))
if imma_end == -1:
    # fallback: script タグの直前
    script_pos = html_without_kansen.find('\n<script')
    insert_pos = script_pos
else:
    insert_pos = imma_end + len('</div>')

print(f"挿入位置: {insert_pos}")

# 挿入
html_fixed = html_without_kansen[:insert_pos] + '\n' + kansen_block.strip() + '\n' + html_without_kansen[insert_pos:]

with open(STUDY, "w", encoding="utf-8") as f:
    f.write(html_fixed)
print("完了")
