"""血液（hema）の正解の解説（ans_sub）の点検用の道具。2026-09-27〜。

  python _work/hema_audit.py dump 1 6          Q.1〜Q.6 を読める形で出す（設問・選択肢・正解・ans_sub・画像）
  python _work/hema_audit.py apply edits.json  {uid: {"ans_sub": "...", ...}} を書き戻す（整形は元のまま）
  python _work/hema_audit.py pdf 118D-13       PDF でその国試番号が載っているページを探す（ページ番号を出す）
  python _work/hema_audit.py render 57         PDF の57ページ（1始まり）を scratch に 200dpi で描く

点検の手順と進捗は _work/血液_ans点検.md が正本。
⚠️ questions_hema.json は json.dumps(indent=2, ensure_ascii=False)・LF・末尾に改行なしと往復一致する。
"""
import json, re, sys, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
QJ = os.path.join(ROOT, 'questions_hema.json')
PDF = os.path.join(ROOT, 'MEC問題文pdf', 'MEC臓器別講座・血液_問題（表紙2026）.pdf')
OUTDIR = os.environ.get('HEMA_RENDER_DIR') or os.path.join(os.environ.get('TEMP', '.'), 'hema_render')


def load():
    with open(QJ, 'rb') as f:
        raw = f.read()
    j = json.loads(raw)
    assert dump_json(j) == raw, '往復一致しない＝整形が変わっている'
    return j


def dump_json(j):
    return json.dumps(j, ensure_ascii=False, indent=2).encode('utf-8')


def strip(s):
    s = re.sub(r'<br\s*/?>', '\n', s or '')
    s = re.sub(r'<[^>]+>', '', s)
    return s.replace('\u0001', ' ').strip()


def qnum(q):
    m = re.search(r'\d+', q.get('qn', ''))
    return int(m.group()) if m else -1


def cmd_dump(a, b):
    j = load()
    for ch in j['chapters']:
        for q in ch['qs']:
            n = qnum(q)
            if not (a <= n <= b):
                continue
            print('=' * 70)
            print(f"{q['qn']}  {q['uid']}  {q.get('episode','')}  正答率 {q.get('rate')}  [{ch['title']}]")
            print('バッジ:', ' '.join(x.get('t', '') for x in q.get('badges', [])))
            print('--- 設問')
            print(strip(q.get('qt')))
            print('--- 選択肢')
            for c in q.get('choices', []):
                print(('  ✔ ' if c.get('ok') else '    ') + strip(c.get('t')))
            print('--- 正解:', strip(q.get('ans_label')))
            print('--- ans_sub:', strip(q.get('ans_sub')))
            imgs = q.get('imgs') or []
            if imgs:
                print('--- 画像:', ', '.join(os.path.normpath(os.path.join(ROOT, i if isinstance(i, str) else i.get('src', ''))) for i in imgs))


def cmd_apply(path):
    with open(path, encoding='utf-8') as f:
        edits = json.load(f)
    j = load()
    hit = set()
    for ch in j['chapters']:
        for q in ch['qs']:
            if q['uid'] in edits:
                for k, v in edits[q['uid']].items():
                    q[k] = v
                hit.add(q['uid'])
    miss = set(edits) - hit
    assert not miss, '見つからない uid: ' + ', '.join(sorted(miss))
    with open(QJ, 'wb') as f:
        f.write(dump_json(j))
    print('書き戻した:', len(hit), '問')


def cmd_pdf(num):
    import fitz
    m = re.match(r'(\d+)([A-I])-?(\d+)', num)
    pat = re.compile(rf'{m.group(1)}\s*{m.group(2)}\s*[-‐－]\s*{m.group(3)}(?!\d)')
    doc = fitz.open(PDF)
    for i, p in enumerate(doc):
        if pat.search(p.get_text()):
            print('page', i + 1)


def cmd_render(page, dpi=200):
    import fitz
    os.makedirs(OUTDIR, exist_ok=True)
    doc = fitz.open(PDF)
    out = os.path.join(OUTDIR, f'p{page:03d}_{dpi}.png')
    doc[page - 1].get_pixmap(dpi=dpi).save(out)
    print(out)


if __name__ == '__main__':
    c = sys.argv[1]
    if c == 'dump':
        cmd_dump(int(sys.argv[2]), int(sys.argv[3]))
    elif c == 'apply':
        cmd_apply(sys.argv[2])
    elif c == 'pdf':
        cmd_pdf(sys.argv[2])
    elif c == 'render':
        cmd_render(int(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 200)
