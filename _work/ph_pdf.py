# -*- coding: utf-8 -*-
"""
公衆衛生PDF（MEC公衆衛生講座・問題）から章を作るための抽出ツール。
`_work/tox_pdf.py` / `_work/rad_pdf.py` の構造を流用し、本PDF固有の版面に合わせてある。

  python _work/ph_pdf.py anstable          巻末解答一覧表(PDF p267-277)を全619問ぶん抽出
  python _work/ph_pdf.py spec   --ch 1     指定章の NO/国試番号/正解/バッジ/正答率 一覧
  python _work/ph_pdf.py text   --ch 1     指定章のページ本文を dump（Readで読む用）
  python _work/ph_pdf.py text   --ch 1 --resume --p0 2 --p1 9   レジュメPDFの指定ページを dump
  python _work/ph_pdf.py images --ch 1     画像の矩形と設問への帰属候補＋ページ画像（目視確認用）
  python _work/ph_pdf.py save   --ch 1     images が出した map ファイルに従って画像を保存

出力先は既定で _work/_ph_tmp/。Bashの標準出力はcp932で潰れるので、
生成された .txt を Read ツールで読むこと。

⚠️ PDFページ ＝ 印刷ページ + 5（表紙・目次・扉のぶん）。レジュメPDFは + 4。
⚠️ 各章は「A問題（★問題）／B問題（★問題）／A問題／B問題」の4ブロックに分かれるが、
   NO. は章内で通し。章のページ範囲は4ブロックすべてを含む。
⚠️ 解答一覧表の列は NO./解答/国試番号/種別(★)/CBT/出題テーマ/必修/一般/臨床/正答率 の10列。
   **疾患名の列は無い**（精神科〜整形外科の版面とはここが違う）。
   CBT の ○ は出題テーマの1語目とくっついて1単語になることがある（x≈173.7）ので、
   その位置の単語は先頭の ○ を切り離してから theme に回す。
⚠️ 右端に章名の縦書き（「医」「師」「法」…）が x≈563-569 に入る。cmd_text は x>545 を落とす。
⚠️ PDF p.6 は「MEC公衆衛生講座の特徴」の見本ページ（問題ページ範囲 p7- で限定して避ける）。
"""
import argparse, io, json, os, re, sys

import fitz
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', 'MEC公衆衛生講座_問題（表紙2026）.pdf')
RESUME = os.path.join(BASE, 'MEC問題文pdf', 'MEC公衆衛生講座_レジュメ（表紙2026）.pdf')
OUT = os.path.join(BASE, '_work', '_ph_tmp')
DEST_IMG = os.path.join(BASE, '公衆衛生', 'images')

TABLE_PAGES = range(267, 278)           # 巻末「解 答」一覧表（印刷 262-272）
INDEX_PAGES = range(278, 284)           # 巻末「国試番号索引」（印刷 273-278）

# 章 -> (NO.開始, NO.終了, 章ページ開始, 章ページ終了, 章名)   ページはPDFの通し（印刷+5）
CH = {
    1:  (1,   71,    7,  30, '医師法と医療法'),
    2:  (72,  80,   31,  36, '保健所'),
    3:  (81,  112,  37,  52, '死'),
    4:  (113, 131,  53,  60, '医療職'),
    5:  (132, 155,  61,  70, '医療保険'),
    6:  (156, 190,  71,  84, '介護保険'),
    7:  (191, 226,  85, 102, '人　口'),
    8:  (227, 272, 103, 120, '疫学研究'),
    9:  (273, 281, 121, 126, '検査学'),
    10: (282, 304, 127, 136, '健康増進と生活習慣'),
    11: (305, 316, 137, 142, '医薬品・食品・嗜好品'),
    12: (317, 337, 143, 152, '母子保健'),
    13: (338, 352, 153, 160, '小児保健・学校保健'),
    14: (353, 397, 161, 176, '障害とノーマライゼーション'),
    15: (398, 434, 177, 192, '感染症'),
    16: (435, 469, 193, 206, '産業衛生'),
    17: (470, 480, 207, 212, '環境問題'),
    18: (481, 497, 213, 220, '海外協力'),
    19: (498, 619, 221, 266, 'その他基本事項'),
}

# 解答一覧表の列の左端x（本PDF実測）
COLS = [('no', 0), ('ans', 70), ('kid', 100), ('sh', 150), ('cbt', 170),
        ('theme', 185), ('hisshu', 472), ('ippan', 489), ('rinsho', 506),
        ('rate', 523)]

EDGE_L, EDGE_R = 40, 545                # 右端の縦書き章名を落とす


def _w(name, text):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(text)
    print('-> %s (%d bytes)' % (p, len(text.encode('utf-8'))))
    return p


# ---------------------------------------------------------------- anstable
def cmd_anstable(_args):
    """巻末の解答一覧表を x 座標で列に切る。

    ⚠️ 章区切り行（「　1　〔 問題 〕医師法と医療法」）が NO列・解答列に食い込むため、
       章区切り行の単語は行への割り当てから外す。
    ⚠️ 折り返し行（出題テーマの2行目）は**アンカーより上に来る**ことがあるので、
       「アンカーの y から次のアンカーの手前まで」で切ってはいけない。
       **各単語を「y が最も近いアンカー」へ配る**（ent_pdf.py と同じ方式）。
    ⚠️ CBT の ○ は theme の1語目とくっつく（x≈173.7）ので先頭の ○ を切り離す。
    """
    d = fitz.open(PDF)
    rows, chapters = [], []
    for pno in TABLE_PAGES:
        words = [w for w in d[pno - 1].get_text('words') if w[4].strip()]
        words = [w for w in words if EDGE_L <= w[0] <= EDGE_R]
        # CBT列の ○ が theme とくっついた単語を分割する
        split = []
        for w in words:
            if 168 <= w[0] <= 180 and w[4].startswith('○') and len(w[4]) > 1:
                split.append((w[0], w[1], w[0] + 8, w[3], '○'))
                split.append((188.0, w[1], w[2], w[3], w[4][1:]))
            else:
                split.append(w)
        words = split

        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        ch_keys = set()
        for key in sorted(lines):
            txt = ''.join(x[4] for x in sorted(lines[key], key=lambda z: z[0]))
            flat = txt.replace(' ', '').replace('　', '')
            if '〔問題〕' in flat and min(x[0] for x in lines[key]) < 62:
                m = re.match(r'^(\d+)〔問題〕(.*)$', flat)
                if m:
                    ch_keys.add(key)
                    chapters.append((pno, min(x[1] for x in lines[key]),
                                     int(m.group(1)), m.group(2)))

        anchors = sorted((w[1], w[0], w[4]) for w in words
                         if w[0] < 62 and w[1] > 102 and re.match(r'^\d+$', w[4])
                         and round(w[1] / 3) not in ch_keys)
        if not anchors:
            continue
        body = [w for w in words if w[1] > 102 and round(w[1] / 3) not in ch_keys]
        buckets = {i: [] for i in range(len(anchors))}
        for w in body:
            i = min(range(len(anchors)), key=lambda k: abs(w[1] - anchors[k][0]))
            buckets[i].append(w)

        for i, (y, _x, _no) in enumerate(anchors):
            cells = {n: [] for n, _ in COLS}
            for w in buckets[i]:
                name = COLS[0][0]
                for nm, x0 in COLS:
                    if w[0] >= x0 - 3:
                        name = nm
                cells[name].append((w[1], w[0], w[4]))
            rec = {n: ''.join(t for _y, _x, t in sorted(cells[n])) for n, _ in COLS}
            m = re.match(r'^(\d+)', rec['no'])
            rec['no'] = int(m.group(1)) if m else None
            # ⚠️ 「※不正解者のみ／採点除外」の注記は2行に折り返し、2行目が**次の行の
            #    国試番号セルへ流れ込む**（NO.15→NO.16、NO.33→NO.34 で実際に起きる）。
            #    国試番号は正規表現で取り直し、注記は raw に残す。
            rec['kid_raw'] = rec['kid']
            km = re.search(r'\d{2,3}[A-Z]-\d+', rec['kid'])
            rec['kid'] = km.group(0) if km else rec['kid']
            rec['excluded'] = rec['ans'].strip() in ('なし', '無し')
            rec['_page'], rec['_y'] = pno, y
            rows.append(rec)

    marks = sorted((p * 10000 + y, n) for p, y, n, _nm in chapters)
    for r in rows:
        cur = 1
        for pos, n in marks:
            if r['_page'] * 10000 + r['_y'] >= pos - 3:
                cur = n
        r['ch'] = cur

    os.makedirs(OUT, exist_ok=True)
    json.dump(rows, io.open(os.path.join(OUT, 'anstable.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=0)
    txt = ['ROWS: %d  NO: %s..%s' % (len(rows), rows[0]['no'], rows[-1]['no'])]
    nos = [r['no'] for r in rows]
    txt.append('MISSING NO: %s' % [i for i in range(1, rows[-1]['no'] + 1) if i not in nos])
    txt.append('DUP NO    : %s' % sorted({n for n in nos if nos.count(n) > 1}))
    txt.append('RATE NONE : %s' % [r['no'] for r in rows if not r['rate'].strip()])
    txt.append('ANS BROKEN: %s' % [r['no'] for r in rows
                                   if not re.match(r'^[a-g](,[a-g])*$', r['ans'].strip())])
    txt.append('STAR      : %d' % sum(1 for r in rows if '★' in r['sh']))
    txt.append('CBT       : %d' % sum(1 for r in rows if '○' in r['cbt']))
    txt.append('HISSHU    : %d' % sum(1 for r in rows if '○' in r['hisshu']))
    for pno, y, n, nm in chapters:
        ns = [r['no'] for r in rows if r['ch'] == n]
        txt.append('  ch%-2d %s  NO.%d-%d (%d問)' % (n, nm, min(ns), max(ns), len(ns)))
    txt.append('')
    for r in rows:
        txt.append('NO.%-3d ch%-2d ans=%-6s %-9s %s%s hi=%s ip=%s ri=%s rate=%-4s %s'
                   % (r['no'], r['ch'], r['ans'], r['kid'],
                      '★' if '★' in r['sh'] else '-',
                      'C' if '○' in r['cbt'] else '-',
                      '○' if '○' in r['hisshu'] else '-',
                      '○' if '○' in r['ippan'] else '-',
                      '○' if '○' in r['rinsho'] else '-',
                      r['rate'], r['theme']))
    _w('anstable.txt', '\n'.join(txt))
    print('rows=%d chapters=%d' % (len(rows), len(chapters)))


def _rows(ch):
    p = os.path.join(OUT, 'anstable.json')
    if not os.path.exists(p):
        cmd_anstable(None)
    return [r for r in json.load(io.open(p, encoding='utf-8')) if r['ch'] == ch]


# ---------------------------------------------------------------- spec
def cmd_spec(args):
    lines = []
    for r in _rows(args.ch):
        b = []
        if '★' in r['sh']:
            b.append('bs')
        if '○' in r['cbt']:
            b.append('bc')
        if '○' in r['hisshu']:
            b.append('bh')
        lines.append('NO.%-3d %-9s ans=%-7s badges=%-9s rate=%-5s theme=%s'
                     % (r['no'], r['kid'], r['ans'], ','.join(b) or '-',
                        r['rate'] or 'None', r['theme']))
    _w('ch%02d_spec.txt' % args.ch, '\n'.join(lines))


# ---------------------------------------------------------------- text
def cmd_text(args):
    """章のページ本文を dump。⚠️ 右端の縦書き章名を x で落とす。"""
    _no0, _no1, p0, p1, name = CH[args.ch]
    use_resume = getattr(args, 'resume', False)
    d = fitz.open(RESUME if use_resume else PDF)
    if use_resume:
        p0, p1 = args.p0, args.p1
    buf = []
    for p in range(p0, p1 + 1):
        pg = d[p - 1]
        buf.append('===== PAGE %d =====\n' % p)
        words = [w for w in pg.get_text('words') if w[4].strip()]
        words = [w for w in words if EDGE_L <= w[0] <= EDGE_R]
        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        for key in sorted(lines):
            buf.append(' '.join(x[4] for x in sorted(lines[key], key=lambda z: z[0])))
            buf.append('\n')
    tag = 'resume_p%d_%d' % (p0, p1) if use_resume else 'ch%02d_pages' % args.ch
    _w('%s.txt' % tag, ''.join(buf))
    print('%s  PDF p%d-%d' % (name, p0, p1))


# ---------------------------------------------------------------- images
def cmd_images(args):
    """画像の矩形を列挙し、設問アンカーのy座標で帰属候補を決める。
    ページ画像も出すので必ず目視で確認すること。"""
    no0, no1, p0, p1, name = CH[args.ch]
    d = fitz.open(PDF)
    log, maps = [], []
    sheet = os.path.join(OUT, 'sheet')
    os.makedirs(sheet, exist_ok=True)
    for pno in range(p0, p1 + 1):
        pg = d[pno - 1]
        imgs = pg.get_images(full=True)
        if not imgs:
            continue
        words = pg.get_text('words')
        qanch = sorted((w[1], int(re.match(r'^(\d+)\.$', w[4]).group(1)))
                       for w in words if re.match(r'^\d+\.$', w[4]) and w[0] < 90)
        log.append('PAGE %d  imgs=%d  Qanchors=%s' % (pno, len(imgs), qanch))
        rects = []
        for im in imgs:
            xref = im[0]
            info = d.extract_image(xref)
            for r in pg.get_image_rects(xref):
                owner = None
                for y, n in qanch:
                    if r.y0 >= y - 20:
                        owner = n
                rects.append((r, xref, owner))
                kid = next((x['kid'] for x in _rows(args.ch) if x['no'] == owner), '?')
                log.append('   xref=%-4d %dx%-4d rect=(%.0f,%.0f,%.0f,%.0f) -> Q%s (%s)'
                           % (xref, info['width'], info['height'],
                              r.x0, r.y0, r.x1, r.y1, owner, kid))
                maps.append('%d %d %s 1' % (pno, xref, kid))
        labs = []
        for w in words:
            if w[4] not in ('A', 'B', 'C', 'D', 'E', 'Ａ', 'Ｂ', 'Ｃ', 'Ｄ', 'Ｅ'):
                continue
            for r, xref, _o in rects:
                if r.y1 <= w[1] <= r.y1 + 30 and r.x0 - 20 <= w[0] <= r.x1 + 20:
                    labs.append((w[4], round(w[0]), round(w[1]), xref))
        if labs:
            log.append('   図ラベル(矩形直下のみ): %s' % labs)
        pg.get_pixmap(dpi=110).save(os.path.join(sheet, 'p%03d.png' % pno))

    _w('ch%02d_images.txt' % args.ch, '\n'.join(log))
    _w('ch%02d_map.txt' % args.ch,
       '# page xref 国試番号 連番   ← 目視で確認して直す（設問の図でないものは行ごと削る）\n'
       + '\n'.join(maps) + '\n')
    print('ch%d %s: ページ画像は %s' % (args.ch, name, sheet))


# ---------------------------------------------------------------- save
def _is_line_art(im):
    """ほぼ無彩色（＝シェーマ・グラフ・単純エックス線等の線画）かどうか。"""
    small = im.resize((32, 32))
    px = list(small.getdata())
    chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 24)
    return chroma < len(px) * 0.05


def cmd_save(args):
    """ch{NN}_map.txt に従って 公衆衛生/images/{国試番号}_{n}.jpeg を保存。
    ⚠️ compress_images.py は使わない（既存3000枚超を再エンコードして巨大な差分を生む）。
    ⚠️ 線画は q85 だと pdf_audit.py の知覚ハッシュ照合が誤検出するので q95。"""
    mp = os.path.join(OUT, 'ch%02d_map.txt' % args.ch)
    d = fitz.open(PDF)
    os.makedirs(DEST_IMG, exist_ok=True)
    n_done = 0
    for line in io.open(mp, encoding='utf-8'):
        line = line.split('#')[0].strip()
        if not line:
            continue
        _pno, xref, kid, idx = line.split()
        info = d.extract_image(int(xref))
        im = Image.open(io.BytesIO(info['image'])).convert('RGB')
        w, h = im.size
        if max(w, h) > 1200:
            s = 1200.0 / max(w, h)
            im = im.resize((int(w * s + 0.5), int(h * s + 0.5)), Image.LANCZOS)
        path = os.path.join(DEST_IMG, '%s_%s.jpeg' % (kid, idx))
        q = 95 if _is_line_art(im) else 85
        im.save(path, 'JPEG', quality=q, optimize=True)
        print('%-18s %4dx%-4d -> %dx%d  q%d' % (os.path.basename(path), w, h,
                                                im.size[0], im.size[1], q))
        n_done += 1
    print('saved %d images' % n_done)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('anstable')
    for c in ('spec', 'text', 'images', 'save'):
        s = sub.add_parser(c)
        s.add_argument('--ch', type=int, required=True, choices=sorted(CH))
        if c == 'text':
            s.add_argument('--resume', action='store_true', help='レジュメPDFを読む')
            s.add_argument('--p0', type=int, default=0)
            s.add_argument('--p1', type=int, default=0)
    a = ap.parse_args()
    globals()['cmd_' + a.cmd](a)
