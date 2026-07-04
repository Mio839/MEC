#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fix_series_questions.py が追加した qt-context を全て削除。"""
import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# qt-context span と後続の <br> を削除
CTX_RE = re.compile(r'<span class="qt-context">.*?</span><br>', re.DOTALL)

def remove_context(content):
    new = CTX_RE.sub('', content)
    return new, new != content

# study.html
with open('study.html', encoding='utf-8') as f:
    study = f.read()
study, changed = remove_context(study)
if changed:
    with open('study.html', 'w', encoding='utf-8') as f:
        f.write(study)
    print('study.html: reverted')

# 全章ファイル
for folder in ['神経','内分泌','呼吸器','循環器','消化器','肝胆膵','腎臓','血液','免アレ膠']:
    for html_file in Path(folder).glob('ch*.html'):
        with open(html_file, encoding='utf-8') as f:
            c = f.read()
        new_c, ch = remove_context(c)
        if ch:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_c)
            print(f'{html_file}: reverted')
print('Done')
