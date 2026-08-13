# -*- coding: utf-8 -*-
"""
麻酔科PDF（MECマイナー講座・麻酔科）から章を作るための抽出ツール。
`_work/ortho_pdf.py` の座標系をそのまま流用
（解答一覧表の列xは精神科・皮膚科・眼科・耳鼻咽喉科・泌尿器科・整形外科と同一）。

  python _work/anes_pdf.py anstable          巻末解答一覧表(p33-34)を全問ぶん抽出
  python _work/anes_pdf.py spec   --ch 1     指定章の NO/国試番号/正解/バッジ/正答率 一覧
  python _work/anes_pdf.py text   --ch 1     指定章の問題ページ本文を dump（Readで読む用）
  python _work/anes_pdf.py images --ch 1     画像の矩形と設問への帰属候補＋ページ画像（目視確認用）
  python _work/anes_pdf.py save   --ch 1     images が出した map ファイルに従って画像を保存

出力先は既定で _work/_anes_tmp/。Bashの標準出力はcp932で潰れるので、
生成された .txt を Read ツールで読むこと。

⚠️ PDF p.4 は「MECマイナー講座 麻酔科の特徴」の見本ページで、
   NO.1-3 の問題がレイアウト見本として再掲されている。問題ページ範囲(p5-)で限定して避ける。
⚠️ 本PDFは各ページの左右端に章名の縦書き（「周」「術」「期」「の」「麻」「酔」…）が1文字ずつ入る。
   本文テキストへ混じるので、cmd_text は x<40 / x>540 の単語を落として dump する。
⚠️ 本PDFは1章が「★問題」→「無印問題」の2ブロックに分かれるが、章としては割らない
   （NO. は章内で連続しているのでそのまま1章として扱う）。
"""
import argparse, io, json, os, re, sys

import fitz
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, 'MEC問題文pdf', 'MECマイナー講座・麻酔科_問題（表紙2026）.pdf')
OUT = os.path.join(BASE, '_work', '_anes_tmp')
DEST_IMG = os.path.join(BASE, '麻酔科', 'images')

TABLE_PAGES = range(33, 35)            # 巻末「解 答」一覧表（印刷 麻Q-30, 麻Q-31）
INDEX_PAGES = range(35, 36)            # 巻末「国試番号索引」（印刷 麻Q-32）

# 章 -> (NO.開始, NO.終了, 問題ページ開始, 問題ページ終了, 章名)
CH = {
    1: (1, 35, 5, 23, '周術期の麻酔'),
    2: (36, 52, 24, 32, '緩和医療'),
}

# 解答一覧表の列の左端x（精神科・皮膚科・眼科・耳鼻咽喉科・泌尿器科・整形外科と同一）
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

    ⚠️ 章区切り行（「　2　〔 問題 〕緩和医療」）が NO列・解答列に食い込むため、
       章区切り行の単語は行への割り当てから外す。
    ⚠️ 折り返し行は**アンカー（NO列の数字）より上に来ることがある**ので、
       「アンカーの y から次のアンカーの手前まで」で切ってはいけない。
       **各単語を「y が最も近いアンカー」へ配る**のが実測の版面に合う。
    """
    d = fitz.open(PDF)
    rows, chapters = [], []
    for pno in TABLE_PAGES:
        words = [w for w in d[pno - 1].get_text('words') if w[4].strip()]
        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 3), []).append(w)
        ch_keys = set()
        for key in sorted(lines):
            txt = ''.join(x[4] for x in sorted(lines[key], key=lambda z: z[0]))
            m = re.match(r'^(\d+)〔問題〕(.+)$', txt.replace(' ', '').replace('　', ''))
            if m:
                ch_keys.add(key)
                chapters.append((pno, lines[key][0][1], int(m.group(1)), m.group(2)))

        anchors = sorted((w[1], w[0], w[4]) for w in words
                         if w[0] < 62 and re.match(r'^\d+$', w[4]))
        if not anchors:
            continue
        # 表本体の単語だけを残す（ヘッダ「NO. 解答 国試番号…」は y=98、柱・ノンブルはさらに上）
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
    miss = [i for i in range(1, rows[-1]['no'] + 1) if i not in [r['no'] for r in rows]]
    txt.append('MISSING NO: %s' % miss)
    txt.append('RATE NONE : %s' % [r['no'] for r in rows if not r['rate'].strip()])
    txt.append('ANS BROKEN: %s' % [r['no'] for r in rows
                                   if not re.match(r'^[a-g](,[a-g])*$', r['ans'].strip())])
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
    """章の問題ページ本文を dump。
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

    ⚠️ 図ラベル A/B はテキスト順が当てにならない。必ず**単語のx座標**で左右を決める。
    ⚠️ 本PDFは講義用の「参考画像」（© Dr. Watari 等）が問題の傍らに置かれることがある。
       これは設問の図ではなく答えを示す参考図なので、map から手で外すこと。
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
       '# page xref 国試番号 連番   ← 目視で確認して直す（連図は A→1, B→2／参考画像は行ごと削る）\n'
       + '\n'.join(maps) + '\n')
    print('ch%d %s: ページ画像は %s' % (args.ch, name, sheet))


# ---------------------------------------------------------------- save
def _is_line_art(im):
    """ほぼ無彩色（＝シェーマ・単純エックス線・白黒CT等の線画）かどうか。
    小さく潰してから R/G/B の最大差を見る。彩度の乗った医用写真は弾かれる。"""
    small = im.resize((32, 32))
    px = list(small.getdata())
    chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 24)
    return chroma < len(px) * 0.05


def cmd_save(args):
    """ch{NN}_map.txt に従って 麻酔科/images/{国試番号}_{n}.jpeg を保存。
    ⚠️ compress_images.py は使わない（既存3000枚超を再エンコードして巨大な差分を生む）。
       ここで長辺1200px・JPEG に落として直接保存する。

    ⚠️ 線画（シェーマ・単純エックス線・白黒CT）は q85 だと細い線が崩れ、
       pdf_audit.py の知覚ハッシュ照合が閾値(hamming 6)を超えて「ゴミ画像」と誤検出される。
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
