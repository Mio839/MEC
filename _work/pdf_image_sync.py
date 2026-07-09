# -*- coding: utf-8 -*-
"""
PDF を正本に questions_{sid}.json の画像割り当てを再計算し、差分を報告／適用する。

resp で判明した誤りを全科目で潰すための汎用版:
  - 連問の図は右段にまとめて置かれ、図の直下に A/B/C のラベルが描かれる。
    帰属は **ラベル文字の座標** で決める（読み順が A,B,C とは限らない）。
  - 単問の図は、その設問のアンカー y から次のアンカー y までにある raster。
  - ラベルの無い図は「示す」と書いた設問（連問ならステム＝1問目を優先）へ。
  - 図に言及していない設問には画像を付けない（推測挿入しない）。
  - `*_rendered.jpeg` はページ描画のゴミなので候補から除外する。

使い方:
  python _work/pdf_image_sync.py neur              # 差分を表示（dry-run）
  python _work/pdf_image_sync.py neur --apply      # 画像を書き出し JSON と 📷バッジを更新
  python _work/pdf_image_sync.py neur --apply --prune   # 未参照になったファイルも削除
"""
import fitz, re, os, sys, io, json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r'C:\Users\coool\Desktop\MEC'
PDF_DIR = os.path.join(BASE, 'MEC問題文pdf')
SUBJECTS = {
    'endo':    ('MEC臓器別講座・内分泌代謝_問題（表紙2026）(1).pdf', '内分泌'),
    'resp':    ('MEC臓器別講座・呼吸器_問題（表紙2026）.pdf', '呼吸器'),
    'circ':    ('MEC臓器別講座・循環器_問題（表紙2026）.pdf', '循環器'),
    'dige':    ('MEC臓器別講座・消化管_問題（表紙2026）.pdf', '消化器'),
    'neur':    ('MEC臓器別講座・神経_問題（表紙2026）.pdf', '神経'),
    'hbp':     ('MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf', '肝胆膵'),
    'jinzo_d': ('MEC臓器別講座・腎_問題（表紙2026）.pdf', '腎臓'),
    'hema':    ('MEC臓器別講座・血液_問題（表紙2026）.pdf', '血液'),
    'imma':    ('MEC臓器別講座・免アレ膠_問題（表紙2026）.pdf', '免アレ膠'),
    'kansen':  ('MEC臓器別講座・感染症_問題（表紙2026）.pdf', '感染症'),
    'peds':    ('MEC小児科講座_問題（表紙2026）.pdf', '小児科'),
    'obg':     ('MEC産婦人科講座_問題（表紙2026）.pdf', '産婦人科'),
}

ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
LABEL_REF = re.compile(r'[（(]\s*([A-H])(?:\s*[，,、]\s*([A-H]))?(?:\s*[，,、]\s*([A-H]))?\s*[）)]')
SHOW = re.compile(r'示す|呈示|(?:is|are)\s+shown', re.IGNORECASE)   # 英語問題もある（circ 116E-38 等）
STEM = '次の文を読み'
MIN_AREA, MIN_LONG, BOTTOM_MARGIN = 5000, 100, 80
IMG_BADGE = {'cls': 'bi', 't': '📷 画像'}


def reading_order(items):
    """(xref,y0,y1,x0) を 段(上→下) → 段内(左→右) で並べる"""
    rows = []
    for it in sorted(items, key=lambda t: t[1]):
        for row in rows:
            if min(it[2], row[0][2]) - max(it[1], row[0][1]) > 0:
                row.append(it)
                break
        else:
            rows.append([it])
    out = []
    for row in rows:
        out += sorted(row, key=lambda t: t[3])
    return out


def build(sid):
    pdf_name, dirname = SUBJECTS[sid]
    doc = fitz.open(os.path.join(PDF_DIR, pdf_name))

    page_anchors, page_text, page_rast, page_labels = {}, {}, {}, {}
    for p in range(len(doc)):
        t = doc[p].get_text()
        page_text[p] = t
        for blk in doc[p].get_text('dict')['blocks']:
            if blk.get('type') != 0:
                continue
            bt = ''.join(s['text'] for l in blk['lines'] for s in l['spans'])
            for m in ANCHOR.finditer(bt):
                page_anchors.setdefault(p, []).append((blk['bbox'][1], m.group(2)))
        rs = []
        for im in doc[p].get_images(full=True):
            for r in doc[p].get_image_rects(im[0]):
                w, h = r.x1 - r.x0, r.y1 - r.y0
                if w * h < MIN_AREA or max(w, h) < MIN_LONG:
                    continue
                rs.append((im[0], r.y0, r.y1, r.x0, r.x1))
                break
        page_rast[p] = rs
        # 図の直下に描かれたラベル文字
        lm = {}
        for blk in doc[p].get_text('dict')['blocks']:
            if blk.get('type') != 0:
                continue
            for line in blk['lines']:
                for s in line['spans']:
                    tx = s['text'].strip()
                    if not re.fullmatch(r'[A-H]', tx):
                        continue
                    lx0, ly0, lx1, _ = s['bbox']
                    best = None
                    for (x, ry0, ry1, rx0, rx1) in rs:
                        if ry1 > ly0 or min(rx1, lx1) - max(rx0, lx0) <= 0:
                            continue
                        gap = ly0 - ry1
                        if gap < 40 and (best is None or gap < best[0]):
                            best = (gap, x)
                    if best:
                        lm[tx] = best[1]
        page_labels[p] = lm
    for p in page_anchors:
        page_anchors[p].sort()

    first_anchor = {}
    for p, v in page_anchors.items():
        for y, e in v:
            first_anchor.setdefault(e, (p, y))

    def labels_in(text):
        out = []
        for m in LABEL_REF.finditer(text):
            out += [g for g in m.groups() if g]
        return out

    expected = {}          # eid -> [xref]
    handled_pages = set()

    # ── 連問ページ: ラベル基準で割り当て ──────────────────────────
    for p in range(len(doc)):
        if STEM not in page_text[p] or not page_rast[p]:
            continue
        t = page_text[p]
        ms = list(ANCHOR.finditer(t))
        if not ms:
            continue
        stem_text = t[t.index(STEM):ms[0].start()]
        seg = {m.group(2): t[m.end():ms[i + 1].start() if i + 1 < len(ms) else len(t)]
               for i, m in enumerate(ms)}
        label_of = page_labels[p]
        assign, claimed = {}, set()

        def claim(eid, lbs):
            for lb in lbs:
                if lb in label_of and label_of[lb] not in claimed:
                    assign.setdefault(eid, []).append(label_of[lb])
                    claimed.add(label_of[lb])

        claim(ms[0].group(2), labels_in(stem_text))
        for eid, s in seg.items():
            claim(eid, labels_in(s))

        unlabeled = [x for (x, *_) in page_rast[p] if x not in claimed and x not in label_of.values()]
        if unlabeled:
            owner = ms[0].group(2) if SHOW.search(stem_text) else next(
                (e for e in seg if SHOW.search(seg[e])), None)
            if owner is None:
                continue           # 帰属不明。このページは触らない
            assign.setdefault(owner, []).extend(unlabeled)

        if sum(len(v) for v in assign.values()) != len(page_rast[p]):
            continue               # 全部の図を説明できないページは触らない
        order = {x: i for i, x in enumerate(
            x for (x, *_) in reading_order([(a, b, c, d) for (a, b, c, d, _) in page_rast[p]]))}
        for eid, xs in assign.items():
            expected[eid] = sorted(xs, key=lambda x: order[x])
        handled_pages.add(p)

    # ── 単問: アンカーの y レンジ内の raster ────────────────────────
    for eid, (p, y) in first_anchor.items():
        if p in handled_pages or eid in expected:
            continue
        seg_text = page_text[p][page_text[p].find(eid):]
        nxt = ANCHOR.search(seg_text[len(eid):])
        seg_text = seg_text[:nxt.start()] if nxt else seg_text
        if not SHOW.search(seg_text):
            continue               # 図に言及していない設問には付けない
        y_end = doc[p].rect.height
        for yy, _ in page_anchors[p]:
            if y + 1 < yy < y_end:
                y_end = yy
        hits = [(x, y0, y1, x0) for (x, y0, y1, x0, _) in page_rast[p] if y <= (y0 + y1) / 2 <= y_end]
        if not hits and (doc[p].rect.height - y_end) < BOTTOM_MARGIN and p + 1 < len(doc):
            nys = page_anchors.get(p + 1, [])
            n_end = nys[0][0] if nys else doc[p + 1].rect.height
            hits = [(x, y0, y1, x0) for (x, y0, y1, x0, _) in page_rast[p + 1] if (y0 + y1) / 2 <= n_end]
            p = p + 1
        if hits:
            expected[eid] = [x for (x, *_) in reading_order(hits)]
    return doc, expected, dirname


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    apply_ = '--apply' in sys.argv
    prune = '--prune' in sys.argv
    # --drop=103B-32,102C-28 : 図が無いと目視確認した設問から画像と📷バッジを外す
    global DROP
    DROP = set()
    for a in sys.argv[1:]:
        if a.startswith('--drop='):
            DROP = {x for x in a[len('--drop='):].split(',') if x}
    for sid in args:
        doc, expected, dirname = build(sid)
        jpath = os.path.join(BASE, f'questions_{sid}.json')
        data = json.load(open(jpath, encoding='utf-8'))
        qs = [q for ch in data['chapters'] for q in ch['qs']]
        by = {q['episode'].strip('()'): q for q in qs}
        img_dir = os.path.join(BASE, dirname, 'images')

        add, remove, change = [], [], []
        for eid, xrefs in expected.items():
            q = by.get(eid)
            if not q:
                continue
            want = [f'{dirname}/images/{eid}_{i}.jpeg' for i in range(1, len(xrefs) + 1)]
            cur = q.get('imgs') or []
            if cur == want:
                continue
            (add if not cur else change).append((eid, [os.path.basename(s) for s in cur], len(want)))
        for q in qs:
            eid = q['episode'].strip('()')
            if q.get('imgs') and eid not in expected:
                remove.append((eid, [os.path.basename(s) for s in q['imgs']]))

        print(f'\n=== {sid} ===')
        print(f'  PDF が図ありと判定: {len(expected)}問 / JSON で画像あり: {sum(1 for q in qs if q.get("imgs"))}問')
        print(f'  追加 {len(add)} / 枚数や順序の変更 {len(change)} / 削除候補 {len(remove)}')
        for t, l in (('追加', add), ('変更', change), ('削除候補', remove)):
            for x in l[:12]:
                print(f'    [{t}]', x)
            if len(l) > 12:
                print(f'    ... 他 {len(l)-12} 件')

        if not apply_:
            continue
        os.makedirs(img_dir, exist_ok=True)
        for eid, xrefs in expected.items():
            q = by.get(eid)
            if not q:
                continue
            names = []
            for i, x in enumerate(xrefs, 1):
                b = doc.extract_image(x)
                fn = f'{eid}_{i}.jpeg'
                fp = os.path.join(img_dir, fn)
                if b['ext'].lower() in ('jpeg', 'jpg'):
                    open(fp, 'wb').write(b['image'])
                else:
                    from PIL import Image
                    Image.open(io.BytesIO(b['image'])).convert('RGB').save(fp, 'JPEG', quality=90)
                names.append(f'{dirname}/images/{fn}')
            q['imgs'] = names
            if not any(bb['cls'] == 'bi' for bb in q['badges']):
                q['badges'].append(dict(IMG_BADGE))
        # 削除は自動でやらない。計画器が説明できない図＝正しい図のこともある
        # （連問ステムの図・ベクター描画の手作り画像など）。--drop で個別に指定する。
        for eid in DROP:
            q = by.get(eid)
            if q:
                q['imgs'] = []
                q['badges'] = [b for b in q['badges'] if b['cls'] != 'bi']
        with open(jpath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'  -> questions_{sid}.json を更新')
        if prune:
            used = {os.path.basename(s) for q in qs for s in (q.get('imgs') or [])}
            gone = [f for f in sorted(os.listdir(img_dir)) if f not in used]
            for f in gone:
                os.remove(os.path.join(img_dir, f))
            print(f'  -> 未参照ファイル {len(gone)}枚を削除')
        doc.close()


main()
