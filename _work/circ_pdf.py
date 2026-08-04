# -*- coding: utf-8 -*-
"""
循環器PDF（MEC臓器別講座・循環器）から設問の原文を取り出し、questions_circ.json の qt と突き合わせる。

    python _work/circ_pdf.py pages                  各章がPDFの何ページかを推定
    python _work/circ_pdf.py text   --ch 7          その章の設問原文をdump（Readで読む用）
    python _work/circ_pdf.py qtdiff --ch 7          JSONのqtとPDF原文の乖離を検出（要約された問題を探す）

なぜ要るか:
  questions_circ.json の設問文には、過去にAIが**要約・短縮してしまったもの**が混ざっている。
  例) 第7章 Q.447(120F-75) は連問3/3なのに共通ステム（誰の話か）が丸ごと落ちていて、
      「内科的治療で症状は改善したが…」から始まり単独では解答不能。
  試験モードは qt をそのまま出題するので、要約された設問文は**本番と違う問題**を解かせることになる。
  PDFが正本なので、乖離が見つかった問題は原文へ戻す。

⚠️ Bashの標準出力はcp932で潰れるので、生成された .txt を Read ツールで読むこと。
⚠️ 表・図が設問文や選択肢に入っている問題はテキスト抽出では列の対応が壊れる。
   qtdiff は表を含む可能性のある問題に [表?] を立てるので、**その問題はAI抽出せず
   ユーザーにスクリーンショットを依頼する**（_work/新科目HTML生成ガイド.md §1）。
"""
import argparse, io, json, os, re, sys

import fitz

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', 'MEC臓器別講座・循環器_問題（表紙2026）.pdf')
JSON_PATH = os.path.join(BASE, 'questions_circ.json')
OUT = os.path.join(BASE, '_work', '_circ_tmp')

# 設問アンカー「442.（120A-3）」。pdf_audit.py と同じ規約
ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
TAG = re.compile(r'<[^>]+>')


def _w(name, text):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(text)
    print('-> %s (%d bytes)' % (p, len(text.encode('utf-8'))))
    return p


def load_json():
    return json.load(io.open(JSON_PATH, encoding='utf-8'))


def chapter_qs(ch):
    return load_json()['chapters'][ch - 1]['qs']


def scan_anchors(doc):
    """PDF全ページを走査して {国試番号: [(page, 位置, NO)]} を作る。"""
    found = {}
    pages = []
    for pno in range(doc.page_count):
        t = doc[pno].get_text()
        pages.append(t)
        for m in ANCHOR.finditer(t):
            found.setdefault(m.group(2), []).append(
                (pno + 1, m.start(), m.end(), int(m.group(1))))
    return found, pages


def cmd_pages(_a):
    doc = fitz.open(PDF)
    found, _ = scan_anchors(doc)
    data = load_json()
    print('PDF %d ページ / アンカー %d 種' % (doc.page_count, len(found)))
    for i, ch in enumerate(data['chapters'], 1):
        hits = []
        for q in ch['qs']:
            code = q['episode'].strip('()（）')
            for (p, _o, _e, _n) in found.get(code, []):
                hits.append(p)
        miss = sum(1 for q in ch['qs']
                   if not found.get(q['episode'].strip('()（）')))
        rng = ('p%d-%d' % (min(hits), max(hits))) if hits else '—'
        print('  ch%02d %-22s %3d問  %-12s  PDFで見つからない %d問'
              % (i, ch['title'], len(ch['qs']), rng, miss))


def pdf_block(pages, page, off, end, code):
    """アンカー位置から次のアンカーまでを1問ぶんの原文として切り出す。

    ⚠️ 次のアンカーは **今のアンカーの終端から**探すこと。ANCHOR の `\\d{1,3}` は
       「442.（120A-3）」の1文字先「42.（120A-3）」にも一致するので、off+1 から
       探すと必ず自分自身に当たり、1問が1文字に潰れる。
    """
    t = pages[page - 1]
    nxt = None
    for m in ANCHOR.finditer(t, end):
        nxt = m.start()
        break
    seg = t[off:nxt] if nxt else t[off:]
    # 次ページへまたぐ場合、次ページ冒頭〜最初のアンカーまでを足す
    if nxt is None and page < len(pages):
        t2 = pages[page]
        m2 = ANCHOR.search(t2)
        seg += '\n' + (t2[:m2.start()] if m2 else t2)
    return seg


def cmd_text(a):
    doc = fitz.open(PDF)
    found, pages = scan_anchors(doc)
    out = []
    for q in chapter_qs(a.ch):
        code = q['episode'].strip('()（）')
        hit = found.get(code)
        out.append('=' * 78)
        out.append('%s  %s  %s  正答率%s' % (q['uid'], q['qn'], q['episode'], q['rate_text'] or '—'))
        if not hit:
            out.append('!! PDFにアンカーが無い')
            continue
        p, off, end, no = hit[0]
        out.append('PDF p.%d (NO.%d)' % (p, no))
        out.append('-' * 78)
        out.append(pdf_block(pages, p, off, end, code).strip())
    _w('ch%02d_pdf_text.txt' % a.ch, '\n'.join(out))


def norm(s):
    """比較用に空白・記号のゆれを潰す。"""
    s = TAG.sub('', s)
    s = re.sub(r'[\s　]+', '', s)
    return s


def cmd_qtdiff(a):
    doc = fitz.open(PDF)
    found, pages = scan_anchors(doc)
    rows, detail = [], []
    for q in chapter_qs(a.ch):
        code = q['episode'].strip('()（）')
        hit = found.get(code)
        jt = norm(q['qt'])
        # 連問ラベルは比較から外す
        jt = re.sub(r'^連問\d+/\d+', '', jt)
        if not hit:
            rows.append((q['qn'], code, len(jt), 0, '—', 'PDFに無し'))
            continue
        p, off, end, no = hit[0]
        blk = pdf_block(pages, p, off, end, code)
        # 選択肢(ａ〜ｅ)より前が設問文
        m = re.search('[\uff41a][\\s\u3000\\x01]', blk)
        stem = blk[:m.start()] if m else blk
        pt = norm(stem)
        pt = re.sub(r'^\d+[.．][（(][^）)]+[）)]', '', pt)
        ratio = len(jt) / len(pt) if pt else 0
        flags = []
        if ratio < 0.75:
            flags.append('要約の疑い')
        if '表' in stem or re.search(r'[①②③④⑤]', stem):
            flags.append('表?')
        if any('table' in (e.get('c') or '') for e in [{'c': q['qt']}]):
            flags.append('qtに表')
        rows.append((q['qn'], code, len(jt), len(pt), '%.2f' % ratio, ' '.join(flags)))
        if ratio < 0.75:
            detail.append('=' * 78)
            detail.append('%s %s  JSON %d字 / PDF %d字  (%.2f)' % (q['qn'], code, len(jt), len(pt), ratio))
            detail.append('--- JSON の qt ---')
            detail.append(TAG.sub('', q['qt']))
            detail.append('--- PDF の原文 ---')
            detail.append(stem.strip())

    print('%-8s %-11s %6s %6s %6s  %s' % ('Q', '国試', 'JSON', 'PDF', '比', 'flags'))
    for r in rows:
        print('%-8s %-11s %6d %6d %6s  %s' % r)
    n = sum(1 for r in rows if '要約の疑い' in r[5])
    print('\n要約の疑い %d問 / 全%d問' % (n, len(rows)))
    if detail:
        _w('ch%02d_qtdiff.txt' % a.ch, '\n'.join(detail))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('pages').set_defaults(f=cmd_pages)
    for name, fn in (('text', cmd_text), ('qtdiff', cmd_qtdiff)):
        p = sub.add_parser(name)
        p.add_argument('--ch', type=int, required=True)
        p.set_defaults(f=fn)
    args = ap.parse_args()
    args.f(args)
