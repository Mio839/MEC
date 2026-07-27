# -*- coding: utf-8 -*-
"""
questions_{sid}.json を PDF と突き合わせて壊れたデータを検出する汎用監査ツール。

既存の _work/audit_image_mismatch.py は「画像ファイル名の問題コード」と「カードの問題コード」しか
見ないため、中身が別物の画像（ページのスクリーンショット等）を素通しする。本ツールは PDF を
正本として中身まで照合する。

検出する不具合:
  [採点]  ok=0        … 正解フラグが1つも無い＝試験モードで何を選んでも不正解になる（最重要）
  [採点]  ok数の不一致 … 問題文の「Nつ選べ」と正解数が食い違う
  [採点]  選択肢の記号順が a,b,c… になっていない（複数の選択肢が1つに結合している等）
  [画像]  📷バッジと画像の有無が食い違う
  [画像]  画像ファイルが存在しない / どの問題からも参照されていない
  [画像]  画像の中身が PDF のどの図とも一致しない（＝ページ描画のゴミ画像の疑い）
  [本文]  qt に次問のアンカー「NNN.（119A-1）」が混入している
  [本文]  qt に「→」が含まれる（解答を埋め込んだ要約の疑い）
  [本文]  連問なのに共通ステム（qt-context）が無い

使い方:
  python _work/pdf_audit.py resp            # 呼吸器を監査
  python _work/pdf_audit.py resp --no-image # 画像の中身照合を省略（高速）
  python _work/pdf_audit.py                 # PDFが揃っている全科目

終了コード: 不具合が1件でもあれば 1
"""
import sys, os, re, io, json, glob, unicodedata

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = r'C:\Users\coool\Desktop\MEC'
PDF_DIR = os.path.join(BASE, 'MEC問題文pdf')

# sid -> (PDFファイル名, 画像ディレクトリ)
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
    'psy':     ('MECマイナー講座・精神科_問題（表紙2026）.pdf', '精神科'),
}

# PDFがベクター描画のため、こちらでレンダリング／手作りした画像。rasterと一致しなくて当然。
VECTOR_RENDERED = {
    'resp': {'106G-64_1.jpeg'},                    # %肺活量×1秒率の4象限グラフ
    'obg':  {'116D-1_1.png', '108I-40_1.png'},     # 組合せ表
    'circ': {'109A-32_2.jpeg', '112A-28_3.jpeg',   # PDF内でベクター描画された12誘導心電図
             '114D-26_1.jpeg', '120D-44_3.jpeg'},
    'peds': {'110A-54_table.png', '117E-36_table.png'},   # 手作りの組合せ表
    'hbp':  {'90D-14_table.png'},                  # 手作りの検査値表（選択肢が表）
}

ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
BLEED = re.compile(r'\d{1,3}\s*[.．]\s*[（(]\s*\d{2,3}[A-Z]-\d+\s*[）)]')
FNAME_CODE = re.compile(r'^([0-9]+[A-Z]-[0-9]+)')
MIN_AREA, MIN_LONG = 5000, 100
# 入力型（桁入力）の計算問題の正解。calc_input.js の CANON と同じ規約に揃えてある
CALC_ANS_RE = re.compile(r'^計算答[：:]\s*([0-9]+(?:\.[0-9]+)?)$')
CIRCLED = '①②③④⑤⑥⑦⑧⑨'


def plain(html):
    return re.sub(r'<[^>]+>', '', html or '')


def answer_slots(qt):
    """問題文の解答テンプレート（"解答：①. ② ℓ/分/m2"）の桁数を返す。無ければ None。

    丸数字が空白・ピリオドだけで連結された最長の並びを桁数とみなす。区切りが半角空白では
    なく U+2009 THIN SPACE の紙面があるため、空白は \\s 全体を許容する。
    """
    t = plain(qt)
    best = None
    i = 0
    while i < len(t):
        if t[i] not in CIRCLED:
            i += 1
            continue
        slots, j = 0, i
        while j < len(t):
            c = t[j]
            if c in CIRCLED:
                slots += 1
            elif c.isspace() or c in '.．':
                pass
            else:
                break
            j += 1
        if slots >= 2 and (best is None or slots > best):
            best = slots
        i = max(j, i + 1)
    return best


def required(q):
    t = unicodedata.normalize('NFKC', plain(q['qt']))
    m = re.search(r'([2-5])\s*つ選べ', t)
    return int(m.group(1)) if m else 1


def excluded(q):
    """採点除外（国試で採点対象外）。正解が定まらないので採点系のチェックはしない。"""
    return any(b['t'] == '採点除外' for b in q['badges']) or '採点除外' in (q['ans_label'] or '')


def multi_answer(q):
    """ok数 と「Nつ選べ」が一致しなくて正しい問題:
    「複数正解」バッジ付き、または PDF 自身に「編註：現在の正答は1つ」と注記された問題。"""
    if any(b['t'] == '複数正解' for b in q['badges']):
        return True
    return bool(re.search(r'編[註注]', plain(q['qt'])))


def dhash(im):
    im = im.convert('L').resize((9, 8))
    px = list(im.getdata())
    b = 0
    for r in range(8):
        for c in range(8):
            b = (b << 1) | (1 if px[r * 9 + c] < px[r * 9 + c + 1] else 0)
    return b


def audit(sid, check_images=True):
    pdf_name, img_dir_name = SUBJECTS[sid]
    pdf_path = os.path.join(PDF_DIR, pdf_name)
    json_path = os.path.join(BASE, f'questions_{sid}.json')
    img_dir = os.path.join(BASE, img_dir_name, 'images')
    if not os.path.exists(json_path):
        return [(f'questions_{sid}.json が無い', '')]

    data = json.load(open(json_path, encoding='utf-8'))
    qs = [q for ch in data['chapters'] for q in ch['qs']]
    issues = []

    def add(kind, q, msg):
        issues.append((kind, f"{q['uid']} {q['episode']}", msg))

    # ── 採点データ ─────────────────────────────────────────────
    # 選択肢が1つも無い問題は、これまで無検査でスキップしていた。原文がマークシートの
    # 計算問題（入力型）なら ans_label の "計算答：<桁文字列>" で採点できるが、その形式から
    # 外れていると試験モードで解答できない問題が黙って増える。ここで検出する。
    for q in qs:
        if q['choices'] or excluded(q):
            continue
        al = (q.get('ans_label') or '').strip()
        if CALC_ANS_RE.match(al):
            # 桁数が問題文の解答テンプレート（"解答：① ② ％"）と食い違えば入力欄が作れない
            slots = answer_slots(q['qt'])
            digits = len(CALC_ANS_RE.match(al).group(1).replace('.', ''))
            if slots is not None and slots != digits:
                add('採点', q, f'計算答の桁数={digits} だが解答欄は{slots}桁')
        else:
            add('採点', q, f'★選択肢が無く計算答も無い : 解答できない（ans_label={al!r}）')

    for q in qs:
        if not q['choices'] or excluded(q):
            continue
        n = sum(c['ok'] for c in q['choices'])
        if n == 0:
            add('採点', q, '★ok=0 : 試験モードで常に不正解になる')
        elif n != required(q) and not multi_answer(q):
            add('採点', q, f'ok数={n} だが問題文は{required(q)}つ選べ')
        # 選択肢は a,b,c… の順（組合せ問題では g 以降まで続くことがある）
        for i, c in enumerate(q['choices']):
            m = re.match(r'\s*([a-zａ-ｚ])', c['t'])
            if not m or unicodedata.normalize('NFKC', m.group(1)).lower() != chr(97 + i):
                add('採点', q, f'選択肢{i}の記号が{chr(97+i)}でない（選択肢の結合か欠落）')
                break

    # ── 本文 ───────────────────────────────────────────────────
    for q in qs:
        t = plain(q['qt'])
        if BLEED.search(t):
            add('本文', q, '次問のアンカーが問題文に混入している')
        if '→' in t:
            add('本文', q, '「→」を含む（解答を埋め込んだ要約の疑い）')
        if any(b['t'] == '連問' for b in q['badges']) and 'qt-context' not in q['qt']:
            add('本文', q, '連問なのに共通ステムが無い')

    # ── 画像（存在・バッジ・命名） ──────────────────────────────
    used = set()
    for q in qs:
        imgs = q.get('imgs') or []
        badge = any(b['cls'] == 'bi' for b in q['badges'])
        if imgs and not badge:
            add('画像', q, '画像があるのに📷バッジが無い')
        if badge and not imgs:
            add('画像', q, '📷バッジがあるのに画像が無い')
        eid = q['episode'].strip('()')
        for s in imgs:
            used.add(os.path.basename(s))
            if not os.path.exists(os.path.join(BASE, s)):
                add('画像', q, f'ファイルが無い: {s}')
            m = FNAME_CODE.match(os.path.basename(s))
            if m and m.group(1) != eid:
                add('画像', q, f'ファイル名の問題コード {m.group(1)} ≠ {eid}')
    if os.path.isdir(img_dir):
        for f in sorted(os.listdir(img_dir)):
            if f not in used:
                issues.append(('画像', f'{img_dir_name}/images/{f}', 'どの問題からも参照されていない'))

    # ── 画像の中身を PDF と照合 ────────────────────────────────
    if check_images and os.path.exists(pdf_path) and os.path.isdir(img_dir):
        import fitz
        from PIL import Image
        doc = fitz.open(pdf_path)
        hashes, seen = [], set()
        for p in range(len(doc)):
            for im in doc[p].get_images(full=True):
                if im[0] in seen:
                    continue
                seen.add(im[0])
                try:
                    hashes.append(dhash(Image.open(io.BytesIO(doc.extract_image(im[0])['image']))))
                except Exception:
                    pass
        doc.close()
        for f in sorted(used):
            fp = os.path.join(img_dir, f)
            if not os.path.exists(fp) or f in VECTOR_RENDERED.get(sid, ()):
                continue
            try:
                h = dhash(Image.open(fp))
            except Exception:
                continue
            if hashes and min(bin(h ^ r).count('1') for r in hashes) > 6:
                issues.append(('画像', f'{img_dir_name}/images/{f}',
                               'PDF内のどの図とも一致しない（ページ描画のゴミ画像の疑い）'))
    return issues


targets = [a for a in sys.argv[1:] if not a.startswith('-')] or [
    s for s in SUBJECTS if os.path.exists(os.path.join(PDF_DIR, SUBJECTS[s][0]))]
check_images = '--no-image' not in sys.argv

total = 0
for sid in targets:
    if sid not in SUBJECTS:
        print(f'不明な科目: {sid}')
        continue
    issues = audit(sid, check_images)
    total += len(issues)
    print(f'\n=== {sid} : {len(issues)}件 ===')
    for kind, where, msg in issues[:60]:
        print(f'  [{kind}] {where}  {msg}')
    if len(issues) > 60:
        print(f'  ... 他 {len(issues)-60} 件')

print(f'\n合計 {total} 件')
sys.exit(1 if total else 0)
