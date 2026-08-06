# -*- coding: utf-8 -*-
"""
耳鼻咽喉科PDF（MECマイナー講座・耳鼻咽喉科）から章を作るための抽出ツール。
`_work/oph_pdf.py` の座標系をそのまま流用（解答一覧表の列xは精神科・皮膚科・眼科と同一）。

  python _work/ent_pdf.py anstable          巻末解答一覧表(p137-141)を全問ぶん抽出
  python _work/ent_pdf.py spec   --ch 1     指定章の NO/国試番号/正解/バッジ/正答率 一覧
  python _work/ent_pdf.py text   --ch 1     指定章の問題ページ本文を dump（Readで読む用）
  python _work/ent_pdf.py images --ch 1     画像の矩形と設問への帰属候補＋ページ画像（目視確認用）
  python _work/ent_pdf.py save   --ch 1     images が出した map ファイルに従って画像を保存

出力先は既定で _work/_ent_tmp/。Bashの標準出力はcp932で潰れるので、
生成された .txt を Read ツールで読むこと。

⚠️ PDF p.4 は「MECマイナー講座の特徴」の見本ページで、載っている問題は精神科のもの。
   耳鼻咽喉科の問題として拾わないこと（本ツールは章ページ範囲で限定しているので混入しない）。
"""
import argparse, io, json, os, re, sys

import fitz
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', 'MECマイナー講座・耳鼻咽喉科_問題（表紙2026）.pdf')
OUT = os.path.join(BASE, '_work', '_ent_tmp')
DEST_IMG = os.path.join(BASE, '耳鼻咽喉科', 'images')

TABLE_PAGES = range(137, 142)          # 巻末「解 答」一覧表
INDEX_PAGES = range(142, 144)          # 巻末「国試番号索引」

# 章 -> (NO.開始, NO.終了, 問題ページ開始, 問題ページ終了, 章名)
# NO.の範囲は anstable の実測で確定させる（下の値は暫定・cmd_anstable が検証する）
CH = {
    1: (1, 20, 5, 16, '耳①：耳の基本'),
    2: (21, 50, 17, 36, '耳②：耳の疾患（中耳）'),
    3: (51, 98, 37, 64, '耳③：耳の疾患（内耳・後迷路性・その他）'),
    4: (99, 101, 65, 66, '鼻・口・唾液腺①：鼻・口・唾液腺の基本'),
    5: (102, 137, 67, 90, '鼻・口・唾液腺②：鼻の疾患'),
    6: (138, 151, 91, 100, '鼻・口・唾液腺③：口・唾液腺の疾患'),
    7: (152, 171, 101, 110, '咽喉頭①：咽喉頭の基本'),
    8: (172, 216, 111, 136, '咽喉頭②：咽喉頭の疾患'),
}

# 解答一覧表の列の左端x（精神科・皮膚科・眼科と同一）
COLS = [('no', 0), ('ans', 62), ('kid', 95), ('type', 145), ('cbt', 165),
        ('irt', 185), ('theme', 200), ('dis', 350), ('hisshu', 470),
        ('ippan', 487), ('rinsho', 504), ('rate', 522)]


def _w(name, text):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(text)
    print('-> %s (%d bytes)' % (p, len(text.encode('utf-8'))))
    return p


# ---------------------------------------------------------------- anstable
def cmd_anstable(_args):
    """巻末の解答一覧表を x 座標で列に切る。

    ⚠️ 章区切り行（「　2　〔 問題 〕耳②：耳の疾患（中耳）」）が NO列・解答列に食い込むため、
       各行は「次の設問アンカー」か「章区切り行」の手前で閉じる。
    """
    d = fitz.open(PDF)
    rows, chapters = [], []
    for pno in TABLE_PAGES:
        words = [w for w in d[pno - 1].get_text('words') if w[4].strip()]
        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        ch_ys = []
        for key in sorted(lines):
            txt = ''.join(x[4] for x in sorted(lines[key], key=lambda z: z[0]))
            m = re.match(r'^(\d+)〔問題〕(.+)$', txt.replace(' ', '').replace('　', ''))
            if m:
                ch_ys.append((lines[key][0][1], int(m.group(1)), m.group(2)))
                chapters.append((pno, lines[key][0][1], int(m.group(1)), m.group(2)))

        anchors = sorted((w[1], w[0], w[4]) for w in words
                         if w[0] < 62 and re.match(r'^\d+$', w[4]))
        for i, (y, _x, _no) in enumerate(anchors):
            y_end = anchors[i + 1][0] - 1 if i + 1 < len(anchors) else 10 ** 6
            for cy, _n, _nm in ch_ys:
                if y < cy - 2 < y_end:
                    y_end = min(y_end, cy - 2)
            cells = {n: [] for n, _ in COLS}
            for w in words:
                if not (y - 4 <= w[1] < y_end):
                    continue
                name = COLS[0][0]
                for nm, x0 in COLS:
                    if w[0] >= x0 - 3:
                        name = nm
                cells[name].append((w[1], w[0], w[4]))
            rec = {n: ''.join(t for _y, _x, t in sorted(cells[n])) for n, _ in COLS}
            m = re.match(r'^(\d+)', rec['no'])
            rec['no'] = int(m.group(1)) if m else None
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
    miss = [i for i in range(1, rows[-1]['no'] + 1) if i not in [r['no'] for r in rows]]
    txt.append('MISSING NO: %s' % miss)
    txt.append('RATE NONE : %s' % [r['no'] for r in rows if not r['rate'].strip()])
    txt.append('ANS BROKEN: %s' % [r['no'] for r in rows
                                   if not re.match(r'^[a-e](,[a-e])*$', r['ans'].strip())])
    for pno, y, n, nm in chapters:
        ns = [r['no'] for r in rows if r['ch'] == n]
        txt.append('  ch%d %s  NO.%d-%d (%d問)' % (n, nm, min(ns), max(ns), len(ns)))
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
        if '★' in r['type']:
            b.append('bs')
        if '○' in r['cbt']:
            b.append('bc')
        if '○' in r['hisshu']:
            b.append('bh')
        lines.append('NO.%-3d %-9s ans=%-7s badges=%-12s rate=%-5s theme=%s / %s'
                     % (r['no'], r['kid'], r['ans'], ','.join(b) or '-',
                        r['rate'] or 'None', r['theme'], r['dis']))
    _w('ch%02d_spec.txt' % args.ch, '\n'.join(lines))


# ---------------------------------------------------------------- text
def cmd_text(args):
    _no0, _no1, p0, p1, name = CH[args.ch]
    d = fitz.open(PDF)
    buf = []
    for p in range(p0, p1 + 1):
        buf.append('===== PAGE %d =====\n' % p)
        buf.append(d[p - 1].get_text())
    _w('ch%02d_pages.txt' % args.ch, ''.join(buf))
    print('ch%d %s  PDF p%d-%d' % (args.ch, name, p0, p1))


# ---------------------------------------------------------------- images
def cmd_images(args):
    """画像の矩形を列挙し、設問アンカーのy座標で帰属候補を決める。
    ページ画像も出すので必ず目視で確認すること。

    ⚠️ 図ラベル A/B はテキスト順が当てにならない。必ず**単語のx座標**で左右を決める。
    ⚠️ 見出し「A 問題（★問題）」「B 問題」の A/B が y=50〜84 で拾われる。
       画像矩形の直下（±30px）にあるものだけを図ラベルとして扱う。
    """
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
            if w[4] not in ('A', 'B', 'C', 'Ａ', 'Ｂ', 'Ｃ'):
                continue
            for r, xref, _o in rects:
                if r.y1 <= w[1] <= r.y1 + 30 and r.x0 - 20 <= w[0] <= r.x1 + 20:
                    labs.append((w[4], round(w[0]), round(w[1]), xref))
        if labs:
            log.append('   図ラベル(矩形直下のみ): %s' % labs)
        pg.get_pixmap(dpi=110).save(os.path.join(sheet, 'p%03d.png' % pno))

    _w('ch%02d_images.txt' % args.ch, '\n'.join(log))
    _w('ch%02d_map.txt' % args.ch,
       '# page xref 国試番号 連番   ← 目視で確認して直す（連図は A→1, B→2）\n'
       + '\n'.join(maps) + '\n')
    print('ch%d %s: ページ画像は %s' % (args.ch, name, sheet))


# ---------------------------------------------------------------- save
def _is_line_art(im):
    """ほぼ無彩色（＝オージオグラム等の線画・白黒CT）かどうか。
    小さく潰してから R/G/B の最大差を見る。彩度の乗った医用写真は弾かれる。"""
    small = im.resize((32, 32))
    px = list(small.getdata())
    chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 24)
    return chroma < len(px) * 0.05


def cmd_save(args):
    """ch{NN}_map.txt に従って 耳鼻咽喉科/images/{国試番号}_{n}.jpeg を保存。
    ⚠️ compress_images.py は使わない（既存2900枚超を再エンコードして巨大な差分を生む）。
       ここで長辺1200px・JPEG に落として直接保存する。

    ⚠️ 線画（オージオグラム・シェーマ）は q85 だと細い格子線が崩れ、
       pdf_audit.py の知覚ハッシュ照合が閾値(hamming 6)を超えて「ゴミ画像」と誤検出される。
       実測: 104D-1（オージオグラム）は q85→hamming 7、q90→6、q95→0。
       そこで**ほぼ無彩色の画像だけ q95** で保存する（写真は従来どおり q85）。"""
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
    a = ap.parse_args()
    globals()['cmd_' + a.cmd](a)
