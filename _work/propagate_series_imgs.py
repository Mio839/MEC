# -*- coding: utf-8 -*-
"""連問（次の文を読み〜）の兄弟設問に、その設問の qt が参照している図を行き渡らせる。

なぜ要るか:
  連問は共通ステムを**全兄弟の qt へ丸ごと展開する**形式（整形外科式）なので、
  「心エコー図（A，B）を示す。」の一文は2問目・3問目の画面にも必ず出る。
  ところが imgs は「ステムの図は連問1問目」の規約で1問にしか付いておらず、
  2問目以降は**図を参照する文だけがあって図が無い**状態だった（エラー報告6件）。

規約:
  設問Mが持つ図 = 「Mの qt に含まれる図の宣言文」に対応する図すべて。
  宣言文は所有者（imgs を持つ設問）の qt の中で図に言及する最後の一文から取る。
  枝分かれ（「その後の経過：」で別の話になる兄弟）は宣言文を含まないので何も足さない。
  並びは宣言文が qt に出てくる位置の順（＝図ラベル A→B→C の順）。
  imgs が付いた設問には 📷 バッジ（bi）も入れる（バッジと imgs は一致必須）。

    python _work/propagate_series_imgs.py [sid] [--dry-run]      # sid 既定 circ

冪等。整形（indent/改行コード）は元ファイルのまま書き戻す。
"""
import io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SERIES = re.compile(r'<span class="kw">次の文を読み、(.+?)の問いに答えよ。</span>')
TAG = re.compile(r'<[^>]+>')
DECL = re.compile(r'[^。]*(?:示す|示した|行った|撮影した)。')
FIG = re.compile(r'図|写真|CT|MRI|エコー|造影|波形|モニター|シンチ|超音波|像')
BADGE_ORDER = ['bs', 'bh', 'bc', 'bip', 'brn', 'bi', 'bm', 'bx']
IMG_BADGE = {'cls': 'bi', 't': '📷 画像'}


def plain(qt):
    return TAG.sub('', qt)


def decls(qt):
    return [s.strip() for s in DECL.findall(plain(qt)) if FIG.search(s)]


def owner_decl(q):
    d = decls(q['qt'])
    return d[-1] if d else None


def build_plan(data):
    groups = {}
    for ch in data['chapters']:
        for q in ch['qs']:
            m = SERIES.match(q['qt'])
            if m:
                groups.setdefault(m.group(1), []).append(q)
    plan = []
    for key, members in groups.items():
        owners = [(q, owner_decl(q)) for q in members if q.get('imgs')]
        owners = [(q, d) for q, d in owners if d]
        if not owners:
            continue
        for q in members:
            txt = plain(q['qt'])
            slots = []
            for o, d in owners:
                pos = txt.find(d)
                if pos >= 0:
                    slots.append((pos, o['imgs']))
            slots.sort(key=lambda x: x[0])
            want = []
            for _, imgs in slots:
                for p in imgs:
                    if p not in want:
                        want.append(p)
            if want != (q.get('imgs') or []):
                plan.append((key, q, want))
    return plan


def dump(data, fmt):
    indent, crlf, tail = fmt
    out = json.dumps(data, ensure_ascii=False, indent=indent) + tail
    return out.replace('\n', '\r\n') if crlf else out


def detect_format(src, data):
    """元ファイルの整形（indent・改行コード・末尾改行）を突き止める。

    ⚠️ questions_*.json の整形は科目ごとにバラバラ（circ=indent2/CRLF、resp=indent1/CRLF、
    ortho=indent2/LF…）。往復で1バイトも変わらない組み合わせが見つからなければ書き戻さない
    ——1問直しただけで全行が差分になり、レビューできなくなる。
    """
    for indent in (2, 1, 4, None):
        for crlf in (False, True):
            for tail in ('', '\n'):
                if dump(data, (indent, crlf, tail)) == src:
                    return (indent, crlf, tail)
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    sid = args[0] if args else 'circ'
    json_path = os.path.join(BASE, 'questions_%s.json' % sid)
    dry = '--dry-run' in sys.argv
    src = io.open(json_path, encoding='utf-8', newline='').read()
    data = json.loads(src)
    fmt = detect_format(src, data)
    assert fmt, '整形が往復で一致しない。書き戻すと全行が差分になるので中止'
    plan = build_plan(data)
    for key, q, want in plan:
        before = q.get('imgs') or []
        print('%-10s %-16s %s -> %s' % (key.strip(), q['uid'],
              [p.split('/')[-1] for p in before], [p.split('/')[-1] for p in want]))
    print('changed questions: %d' % len(plan))
    if dry or not plan:
        return
    for _, q, want in plan:
        q['imgs'] = want
        if want and not any(b['cls'] == 'bi' for b in q['badges']):
            b = list(q['badges']) + [dict(IMG_BADGE)]
            b.sort(key=lambda x: BADGE_ORDER.index(x['cls']))
            q['badges'] = b
    out = dump(data, fmt)
    io.open(json_path, 'w', encoding='utf-8', newline='').write(out)
    print('written (%d -> %d bytes)' % (len(src.encode('utf-8')), len(out.encode('utf-8'))))


if __name__ == '__main__':
    main()
