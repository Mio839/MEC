# -*- coding: utf-8 -*-
"""
中毒・職業病PDF（MEC「中毒・職業病」テキスト）から章を作るための抽出ツール。
`_work/anes_pdf.py` の構造を流用しつつ、本PDF固有の版面に合わせてある。

  python _work/tox_pdf.py anstable          巻末解答一覧表(p66-67)を全問ぶん抽出
  python _work/tox_pdf.py spec   --ch 1     指定章の NO/国試番号/正解/バッジ/正答率 一覧
  python _work/tox_pdf.py text   --ch 1     指定章のページ本文を dump（Readで読む用）
  python _work/tox_pdf.py images --ch 1     画像の矩形と設問への帰属候補＋ページ画像（目視確認用）
  python _work/tox_pdf.py save   --ch 1     images が出した map ファイルに従って画像を保存

出力先は既定で _work/_tox_tmp/。Bashの標準出力はcp932で潰れるので、
生成された .txt を Read ツールで読むこと。

⚠️ 本PDFは「レジュメ＋問題」が交互に並ぶ構成（マイナー講座の問題集PDFとは違う）。
   解説ページと問題ページが同じ章の中に混ざるので、章のページ範囲は解説ページも含む。
   問題は `□□□` に続く `N. （国試番号）↗M` で始まる。
⚠️ 本PDFの解答一覧表には**種別★列・CBT列が無い**（NO./解答/国試番号/IRT型/出題テーマ/
   疾患名/必修/一般/臨床/正答率 の10列）。したがってバッジは `bh`（必修）だけ。
   必修/一般/臨床/正答率 の4列はヘッダが1語 `必修一般臨床正答率`（x=476.9〜543.9）に
   潰れているので、○ の x で列を決める（必修≈480 / 一般≈497 / 臨床≈514）。
⚠️ 本PDFは各ページの左右端に章名の縦書き（「金」「属」「中」「毒」…）が7章ぶん
   1文字ずつ入る。本文テキストへ混じるので、cmd_text は x<40 / x>540 の単語を落とす。
"""
import argparse, io, json, os, re, sys

import fitz
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', '中毒・職業病（表紙2026）.pdf')
OUT = os.path.join(BASE, '_work', '_tox_tmp')
DEST_IMG = os.path.join(BASE, '中毒・職業病', 'images')

TABLE_PAGES = range(66, 68)            # 巻末「解 答」一覧表（印刷 60-61）
INDEX_PAGES = range(68, 69)            # 巻末「国試番号索引」（印刷 62）

# 章 -> (NO.開始, NO.終了, 章ページ開始, 章ページ終了, 章名)   ページはPDFの通し（印刷+6）
CH = {
    1: (1,  4,   7, 12, '金属中毒'),
    2: (5,  9,  13, 20, '有機溶剤中毒'),
    3: (10, 15, 21, 27, '農薬中毒'),
    4: (16, 21, 28, 35, 'その他の中毒'),
    5: (22, 24, 36, 39, '自然毒'),
    6: (25, 30, 40, 46, 'ガス体中毒'),
    7: (31, 48, 47, 65, '物理的原因による疾患'),
}

# 解答一覧表の列の左端x（本PDF実測。★・CBT列は無い）
COLS = [('no', 0), ('ans', 70), ('kid', 100), ('irt', 150), ('theme', 168),
        ('dis', 320), ('hisshu', 474), ('ippan', 491), ('rinsho', 508),
        ('rate', 525)]


def _w(name, text):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(text)
    print('-> %s (%d bytes)' % (p, len(text.encode('utf-8'))))
    return p


# ---------------------------------------------------------------- anstable
def cmd_anstable(_args):
    """巻末の解答一覧表を x 座標で列に切る。

    ⚠️ 章区切り行（「　1　金属中毒」）が NO列・解答列に食い込むため、
       章区切り行の単語は行への割り当てから外す。
    ⚠️ 折り返し行（出題テーマの2行目）は**アンカー（NO列の数字）より上に来る**ので、
       「アンカーの y から次のアンカーの手前まで」で切ってはいけない。
       **各単語を「y が最も近いアンカー」へ配る**（ent_pdf.py と同じ方式）。
    """
    d = fitz.open(PDF)
    rows, chapters = [], []
    for pno in TABLE_PAGES:
        words = [w for w in d[pno - 1].get_text('words') if w[4].strip()]
        # 左右端の縦書き柱を落とす
        words = [w for w in words if 40 <= w[0] <= 548]
        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        ch_keys = set()
        for key in sorted(lines):
            txt = ''.join(x[4] for x in sorted(lines[key], key=lambda z: z[0]))
            m = re.match(r'^(\d)([^\d].*)$', txt.replace(' ', '').replace('　', ''))
            if m and len(lines[key]) == 1 and lines[key][0][0] < 60:
                ch_keys.add(key)
                chapters.append((pno, lines[key][0][1], int(m.group(1)), m.group(2)))

        # ⚠️ y>102 で切らないと**ページ番号（ノンブル・x=49/y=26）が NO列のアンカーに化ける**
        anchors = sorted((w[1], w[0], w[4]) for w in words
                         if w[0] < 62 and w[1] > 102 and re.match(r'^\d+$', w[4])
                         and round(w[1] / 3) not in ch_keys)
        if not anchors:
            continue
        # 表本体の単語だけを残す（ヘッダ「NO. 解答 国試番号…」は y≈97.5、柱・ノンブルはさらに上）
        body = [w for w in words
                if w[1] > 102 and round(w[1] / 3) not in ch_keys]
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
    txt.append('RATE NONE : %s' % [r['no'] for r in rows if not r['rate'].strip()])
    txt.append('ANS BROKEN: %s' % [r['no'] for r in rows
                                   if not re.match(r'^[a-g](,[a-g])*$', r['ans'].strip())])
    txt.append('HISSHU    : %s' % [r['no'] for r in rows if '○' in r['hisshu']])
    for pno, y, n, nm in chapters:
        ns = [r['no'] for r in rows if r['ch'] == n]
        txt.append('  ch%d %s  NO.%d-%d (%d問)' % (n, nm, min(ns), max(ns), len(ns)))
    txt.append('')
    for r in rows:
        txt.append('NO.%-3d ch%d ans=%-6s %-9s irt=%-2s hi=%s ip=%s ri=%s rate=%-4s %s / %s'
                   % (r['no'], r['ch'], r['ans'], r['kid'], r['irt'].strip(),
                      '○' if '○' in r['hisshu'] else '-',
                      '○' if '○' in r['ippan'] else '-',
                      '○' if '○' in r['rinsho'] else '-',
                      r['rate'], r['theme'], r['dis']))
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
        b = ['bh'] if '○' in r['hisshu'] else []
        lines.append('NO.%-3d %-9s ans=%-7s badges=%-6s rate=%-5s theme=%s / %s'
                     % (r['no'], r['kid'], r['ans'], ','.join(b) or '-',
                        r['rate'] or 'None', r['theme'], r['dis']))
    _w('ch%02d_spec.txt' % args.ch, '\n'.join(lines))


# ---------------------------------------------------------------- text
def cmd_text(args):
    """章のページ本文を dump。
    ⚠️ 左右端の縦書き章名／柱（1文字ずつ縦に並ぶ）を x で落とす。"""
    _no0, _no1, p0, p1, name = CH[args.ch]
    d = fitz.open(PDF)
    buf = []
    for p in range(p0, p1 + 1):
        pg = d[p - 1]
        buf.append('===== PAGE %d =====\n' % p)
        words = [w for w in pg.get_text('words') if w[4].strip()]
        words = [w for w in words if 40 <= w[0] <= 540]
        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        for key in sorted(lines):
            buf.append(' '.join(x[4] for x in sorted(lines[key], key=lambda z: z[0])))
            buf.append('\n')
    _w('ch%02d_pages.txt' % args.ch, ''.join(buf))
    print('ch%d %s  PDF p%d-%d' % (args.ch, name, p0, p1))


# ---------------------------------------------------------------- images
def cmd_images(args):
    """画像の矩形を列挙し、設問アンカーのy座標で帰属候補を決める。
    ページ画像も出すので必ず目視で確認すること。

    ⚠️ 本PDFはレジュメ部分に**解説用の図（ポルフィリン代謝経路など）が大量にある**。
       設問の図ではないので map から手で外すこと（設問の図は「〜を示す。」の記載がある）。
    ⚠️ 図ラベル A/B はテキスト順が当てにならない。必ず**単語のx座標**で左右を決める。
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
       '# page xref 国試番号 連番   ← 目視で確認して直す（レジュメの解説図は行ごと削る）\n'
       + '\n'.join(maps) + '\n')
    print('ch%d %s: ページ画像は %s' % (args.ch, name, sheet))


# ---------------------------------------------------------------- save
def _is_line_art(im):
    """ほぼ無彩色（＝シェーマ・単純エックス線・白黒CT等の線画）かどうか。"""
    small = im.resize((32, 32))
    px = list(small.getdata())
    chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 24)
    return chroma < len(px) * 0.05


def cmd_save(args):
    """ch{NN}_map.txt に従って 中毒・職業病/images/{国試番号}_{n}.jpeg を保存。
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
    a = ap.parse_args()
    globals()['cmd_' + a.cmd](a)
