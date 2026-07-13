# -*- coding: utf-8 -*-
"""
検出専用（書き換えなし）。小児科・産婦人科を除く10科目について、
  (A) 画像問題でないのに画像が挿入されている疑い
      = json に imgs があるが、PDF原文の設問本文に図参照の語が無い
  (B) 問題文が省略されている疑い
      = json の qt(タグ除去・qt-context除去) が PDF原文の 70% 未満に短縮
を一覧化する。PDFのアンカー「NNN.（119A-1）」〜選択肢 ａ 直前を設問本文とみなす。

実行: python _work/detect_summary_and_image.py            # 全10科目
      python _work/detect_summary_and_image.py resp circ  # 指定科目
"""
import fitz, re, os, sys, json, csv

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = r'C:\Users\coool\Desktop\MEC'
PDF_DIR = os.path.join(BASE, 'MEC問題文pdf')
CSV_OUT = os.path.join(BASE, '_work', 'summarized_questions.csv')
csv_rows = []

PDFS = {
    'endo':    'MEC臓器別講座・内分泌代謝_問題（表紙2026）(1).pdf',
    'resp':    'MEC臓器別講座・呼吸器_問題（表紙2026）.pdf',
    'circ':    'MEC臓器別講座・循環器_問題（表紙2026）.pdf',
    'dige':    'MEC臓器別講座・消化管_問題（表紙2026）.pdf',
    'neur':    'MEC臓器別講座・神経_問題（表紙2026）.pdf',
    'hbp':     'MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf',
    'jinzo_d': 'MEC臓器別講座・腎_問題（表紙2026）.pdf',
    'hema':    'MEC臓器別講座・血液_問題（表紙2026）.pdf',
    'imma':    'MEC臓器別講座・免アレ膠_問題（表紙2026）.pdf',
    'kansen':  'MEC臓器別講座・感染症_問題（表紙2026）.pdf',
}

ANCHOR = re.compile(r'(\d{1,3})\s*[.．]\s*[（(]\s*(\d{2,3}[A-Z]-\d+)\s*[）)]')
CTX = re.compile(r'<span class="qt-context">.*?</span>', re.DOTALL)
STEM = '次の文を読み'
SERIES_RANGE = re.compile(r'次の文を読み[、,]?\s*(\d+)\s*[〜～\-とー,、]\s*(\d+)\s*の問いに答えよ')
# PDF原文が「図を参照している」ことを示す語。CT/MR等は ACTH・MRSA 等への誤マッチを避け境界付き。
FIG_KW = re.compile(
    r'示す|写真|シェーマ|エックス線|Ｘ線|心電図|超音波|エコー|内視鏡|'
    r'造影|標本|所見を|アルゴリズム|フローチャート|模式図|眼底|皮膚所見|'
    r'次に示|以下に示|下に示|グラフ|組合せ|を呈する所見|病理|染色'
    r'|(?<![A-Za-z])CT(?![A-Za-z])|(?<![A-Za-z])MRI?(?![A-Za-z])'
    r'|(?<![A-Za-z])X線|(?<![A-Za-z])US(?![A-Za-z])|超音波|穿刺|生検組織')
PANEL = re.compile(r'^[A-Za-z]{1,2}$')


def plain(html):
    return re.sub(r'<[^>]+>', '', html or '')


def pdf_body(seg):
    m = re.search(r'\n\s*ａ[\s　]', seg)
    s = seg[:m.start()] if m else seg
    s = re.sub(r'^[\s★→↗↘⤴☆\d]*', '', s)
    lines = [l.strip() for l in s.split('\n')
             if l.strip() and not PANEL.match(l.strip())]
    return ''.join(lines)


for sid in [a for a in sys.argv[1:] if not a.startswith('-')] or list(PDFS):
    doc = fitz.open(os.path.join(PDF_DIR, PDFS[sid]))
    seg, qnum, stem_of = {}, {}, {}
    for p in range(len(doc)):
        t = doc[p].get_text()
        ms = list(ANCHOR.finditer(t))
        for i, m in enumerate(ms):
            e = m.group(2)
            if e not in seg:
                seg[e] = t[m.end():ms[i + 1].start() if i + 1 < len(ms) else len(t)]
                qnum[e] = int(m.group(1))
        if STEM in t and ms:
            mr = SERIES_RANGE.search(re.sub(r'\s*\n\s*', '', t))
            if mr:
                body = t[t.index(STEM):ms[0].start()]
                body = re.sub(r'^' + STEM + r'[^\n]*\n', '', body)
                for n in range(int(mr.group(1)), int(mr.group(2)) + 1):
                    stem_of[n] = body
    doc.close()

    data = json.load(open(os.path.join(BASE, f'questions_{sid}.json'), encoding='utf-8'))
    qs = [q for ch in data['chapters'] for q in ch['qs']]

    summarized, ghost_img = [], []
    for q in qs:
        eid = q['episode'].strip('()')
        if eid not in seg:
            continue
        # PDF全文（個別セグメント＋連問ステムの症例文）と json全文（qt-context込み）を比較。
        # 連問で症例文を qt-context に正しく保持していれば ~100%。要約 or 症例文欠落なら低くなる。
        pdf_indiv = pdf_body(seg[eid])
        stem = stem_of.get(qnum.get(eid), '')
        is_series = bool(stem)
        stem_plain = re.sub(r'\s+', '', stem)
        true_len = len(pdf_indiv) + len(stem_plain)
        if true_len < 40:
            continue
        json_len = len(plain(q['qt']))  # qt-context 込みの全文
        if json_len < 0.7 * true_len:
            summarized.append((q['uid'], eid, json_len, true_len, is_series))
            csv_rows.append([sid, q['uid'], eid, json_len, true_len,
                             f'{json_len*100//true_len}%', 'Y' if is_series else '',
                             plain(q['qt'])[:80]])
        # (A) 画像があるが PDF原文（本文＋ステム）に図参照語が無い
        imgs = q.get('imgs') or []
        if imgs and not FIG_KW.search(pdf_indiv + stem):
            ghost_img.append((q['uid'], eid, imgs, pdf_indiv[-60:]))

    print(f'\n########## {sid} ##########')
    print(f'[A] 画像あり・PDF原文に図参照語なし: {len(ghost_img)}件')
    for uid, eid, imgs, tail in ghost_img:
        print(f'    {uid} {eid} imgs={[os.path.basename(x) for x in imgs]}')
        print(f'        PDF末尾: …{tail}')
    print(f'[B] 省略の疑い(json<70%PDF全文): {len(summarized)}件')
    for uid, eid, jl, pl, ser in summarized:
        print(f'    {uid} {eid}  {jl}/{pl}字 ({jl*100//pl}%){"  [連問]" if ser else ""}')

if csv_rows or True:
    with open(CSV_OUT, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['sid', 'uid', 'episode', 'json字数', 'pdf字数', '比率', '連問', 'json先頭80字'])
        w.writerows(csv_rows)
    print(f'\n[record] {len(csv_rows)}件を {CSV_OUT} に書き出し')
