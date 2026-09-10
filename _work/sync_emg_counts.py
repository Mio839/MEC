# -*- coding: utf-8 -*-
"""救急(emg)の問題数を3か所へ同時に反映する。

  python _work/sync_emg_counts.py

`node _work/test_subject_totals.js` が守るのは
  questions_emg.json ／ gamify.js の SUBJECTS ／ chapters_meta.js
の三者一致だけで、`study.html` の `subj-hdr-count` は誰も守らない。
章を1つ足すたびに4か所を手で直すと必ずどこかが腐るので、
**questions_emg.json（実測）を正本にして残り3か所を書き換える**。

⚠️ chapters_meta.js の emg エントリが無ければ末尾（"ph" の直前）に新設する。
"""
import io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SID = 'emg'
NAME = '救急'
ICON = '🚑'
COLOR = '#FF8A5B'

# 章番号 -> 章別HTMLのファイル名（7章＝PDF巻末「MEC講義収録内容」の7単位）
FILES = {
    1: '救急/ch01_shoshin_gairai.html',
    2: '救急/ch02_gaisho.html',
    3: '救急/ch03_kagaku_bioterro_anaphylaxis.html',
    4: '救急/ch04_zutsu_kansen_doubutsu_triage.html',
    5: '救急/ch05_teitaion_kanbetsu_bls.html',
    6: '救急/ch06_119kai_kyukyu.html',
    7: '救急/ch07_120kai_kyukyu.html',
}


def read(p, **kw):
    return io.open(os.path.join(BASE, p), encoding='utf-8', newline='', **kw).read()


def write(p, s):
    io.open(os.path.join(BASE, p), 'w', encoding='utf-8', newline='').write(s)


def main():
    d = json.load(io.open(os.path.join(BASE, 'questions_%s.json' % SID), encoding='utf-8'))
    chs = d['chapters']
    total = sum(len(c['qs']) for c in chs)

    # --- chapters_meta.js -------------------------------------------------
    meta = read('chapters_meta.js')
    entry = ['  {\n    "id": "%s",\n    "name": "%s",\n    "icon": "%s",\n'
             '    "color": "%s",\n    "chapters": [\n' % (SID, NAME, ICON, COLOR)]
    rows = []
    for i, c in enumerate(chs, 1):
        rows.append('      {\n        "prefix": "%s_ch%02d",\n        "file": "%s",\n'
                    '        "title": "%s",\n        "count": %d\n      }'
                    % (SID, i, FILES[i], c['title'], len(c['qs'])))
    entry.append(',\n'.join(rows))
    entry.append('\n    ]\n  }')
    entry = ''.join(entry)

    old = re.search(r'  \{\n    "id": "%s",.*?\n    \]\n  \}' % SID, meta, re.S)
    if old:
        meta = meta[:old.start()] + entry + meta[old.end():]
    else:
        anchor = '  {\n    "id": "ph",'
        assert meta.count(anchor) == 1
        meta = meta.replace(anchor, entry + ',\n' + anchor)
    write('chapters_meta.js', meta)

    # --- gamify.js --------------------------------------------------------
    g = read('gamify.js')
    g2 = re.sub(r"(\{ id: '%s',.*?total: )\d+( \})" % SID, r'\g<1>%d\g<2>' % total, g)
    assert g2 != g or ('total: %d ' % total) in g, 'gamify.js に emg の行が無い'
    write('gamify.js', g2)

    # --- study.html（subj-hdr-count） --------------------------------------
    h = read('study.html')
    pat = (r'(<div class="subj-hdr" style="background:%s">.*?'
           r'<span class="subj-hdr-count">)\d+(問</span>)' % re.escape(COLOR))
    h2, n = re.subn(pat, r'\g<1>%d\g<2>' % total, h, flags=re.S)
    assert n == 1, 'study.html の subj-hdr-count が %d 箇所' % n
    write('study.html', h2)

    print('%s: %d章 %d問 → chapters_meta.js / gamify.js / study.html を更新' %
          (SID, len(chs), total))
    for i, c in enumerate(chs, 1):
        print('   ch%02d %-40s %2d問' % (i, c['title'], len(c['qs'])))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
