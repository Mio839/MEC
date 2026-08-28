# -*- coding: utf-8 -*-
"""パートファイル(_ph_chNN_pM.py)を直接execして、各QUESTIONの kw数・文字数をその場で確認する。
build/join を経由しないので高速。使い方: python _work/_ph_kwcheck.py 19 4
"""
import re, sys

ch = sys.argv[1]
part = sys.argv[2]
target = open(f'_work/_ph_ch{ch}_p{part}.py', encoding='utf-8').read()

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ', 'f': 'ｆ', 'g': 'ｇ'}

def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')

def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    imgs = imgs or []
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)

ns = {'Q': Q, 'FW': FW, 'rcls': rcls, 'QUESTIONS': []}
exec(compile(target, f'p{part}', 'exec'), ns)

def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)

for q in ns['QUESTIONS']:
    blocks = []
    if q.get('patho'): blocks.append(q['patho'][1])
    if q.get('deep'): blocks.append(q['deep'][1])
    if q.get('point'): blocks.append(q['point'][1])
    ee = ''.join(w for (_l, _t, _ok, w) in q['choices'])
    body = ''.join(blocks) + ee
    kw = len(re.findall(r'<span class="kw[234]?"', body))
    n = len(strip_tags(body))
    status = 'OK' if (kw >= 25 and n >= 800) else 'NG'
    print(status, q['id'], 'kw=', kw, 'chars=', n, 'choices=', len(q['choices']))
