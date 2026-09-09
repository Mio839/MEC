# -*- coding: utf-8 -*-
"""夏メック模試の設問図（別冊No.）を解説書PDFから抜き出す。

  python _work/mock_pdf.py figs             帰属候補を出す（_work/_mock_tmp/fig_map.txt ＋ ページ画像）
  python _work/mock_pdf.py figs --only A26  1問だけ見る
  python _work/mock_pdf.py save             fig_map.txt に従って 夏メック模試/images/ へ保存

⚠️⚠️ **「別冊No.○を別に示す」と書かれていても、解説書PDFでは設問文のすぐ後にその図が
   組まれている**（引き継ぎ §3-3）。別冊は要らない。

── なぜ get_images() で xref を保存せず、ページを clip して描画するのか ────────
  ① **1つの別冊No.が複数の埋め込み画像でできている**ことがある。C5「別冊No. 3」は
     2列×3段の6スライス、A26・D25 の「①～⑤」は5枚組（＝図が選択肢の問題）。
     xref を1枚ずつ保存するとバラバラになり、並べ直す情報がどこにも残らない。
  ② **4問はベクター描画**（B2 ROC曲線 / C1 生存数曲線 / C37 グラフ / F33 聴覚器のシェーマ）で
     `get_images()` では1枚も取れない。clip 描画なら同じ経路で扱える。
  ③ 埋め込み画像は元々おおむね 300dpi 相当（例: 173×114pt の枠に 721×477px）なので、
     300dpi で描き直しても情報はほぼ落ちない。

⚠️ **図ラベル A/B/C は画像の外に組まれた文字なので、切り出した画像には写らない。**
   並びが狂っても枚数チェックでは見つからない（循環器の作り直しで100問中21問が狂っていた）。
   **矩形の直下のラベル文字を拾ってラベル順に並べる**こと。位置で並べ替えて済ませない。

⚠️ ページ右端・左端の大きな1文字（`A`〜`F`）は**ブロックの柱**であってラベルではない。
   柱は x<20 か x>480 に置かれ、矩形は x 115〜455 の内側なので、
   「矩形の直下かつ矩形の x 範囲内」に絞れば構造的に排除される。

⚠️ 見出し（出題ポイント／鑑別診断／選択肢考察／確定診断／画像診断／check point）は
   **左マージン x<62** に組まれる。x を見ないと設問文の中の「確定診断に最も有用な検査は
   どれか。」に当たって、設問図より手前で打ち切ってしまう（A43 で実際に起きた）。
"""
import fitz, io, json, os, re, sys, argparse

PDF = 'MEC問題文pdf/2026年度 夏メック模試_解説書.pdf'
DATA = 'mock_data/m121s.js'
TMP = '_work/_mock_tmp'
SHEET = os.path.join(TMP, 'sheet')
MAP = os.path.join(TMP, 'fig_map.txt')
DEST = '夏メック模試/images'

HEAD = re.compile(r'出題ポイント|鑑別診断|選択肢考察|確\s*定\s*診\s*断|check|英\s*文|画\s*像\s*診\s*断|正\s*解')

# ── 機械では決まらない5件（目視で決めた矩形。ここが唯一の正本）────────────────
# ⚠️ 手で直した fig_map.txt は `figs` を流し直すと消えるので、**決めた事実はここに置く**。
#    値は 300dpi のクリップを実際に見て詰めてある（余白の切り過ぎ・文字の混入を潰した）。
#
#   B2 / C1 / C37 / F33 … ベクター描画で get_images() が1枚も返さない4問（引き継ぎ §3-3）。
#                          矩形は get_drawings() の外接（柱・ヘッダ帯・版面外を除く）＋
#                          図の中の目盛り文字の外接。⚠️ C37 は「グラフ」ではなく**表**
#                          （ワクチン接種スケジュール）で、見出し行まで含めて1枚の図。
#   D40 …………………………… 「図が選択肢」の問題。16A は眼底写真、**16B は視野検査 ①〜⑤ の
#                          5枚組で、①②③が左列・④⑤が右列という列優先の並び**。
#                          丸数字が肢 a〜e に対応するので**左端の丸数字を必ず含めること**
#                          （x0 を 127 にすると①②③が切れる。実測 x=115）。
MANUAL = {
    ('B2',  '1'):   (180, 209, 165, 362, 311),
    ('C1',  '1'):   (259, 176, 172, 394, 311),
    ('C37', '5'):   (313, 109, 196, 461, 272),
    ('F33', '2'):   (698, 173, 135, 397, 258),
    ('D40', '16A'): (475, 199, 178, 371, 325),
    ('D40', '16B'): (476, 105,  44, 461, 398),
    # 2026-09-09 追加の4件は**機械が出した矩形のまま・上余白だけ 6pt → 1pt に詰めた**もの。
    #   PAD=6 だと直前の見出し行の descender が clip の上端に入り、絵の上に文字の切れ端が
    #   1本残る（A42「胸部の写真です」/ C57「眼窩下壁」等）。矩形そのものは自動判定で正しい。
    ('A42', '17'):  (97,  189, 372, 382, 513),
    ('C14', '4'):   (281, 109, 156, 461, 338),
    ('C57', '12'):  (357, 134, 183, 437, 325),
    ('E49', '9'):   (643, 199, 318, 372, 460),
}
LABEL = re.compile(r'^[A-DＡ-Ｄ]$')
PAD = 6          # clip に足す余白(pt)
LABEL_BAND = 30  # 矩形の下端からラベルを探す帯(pt)


def load_questions():
    src = io.open(DATA, encoding='utf-8').read()
    # ⚠️ 末尾に window.MecMockData への代入が続くので貪欲マッチで丸ごと拾わないこと。
    d = json.loads(re.search(r'var d=(\{.*\});\n', src, re.S).group(1))
    return d['questions']


def head_y(pg):
    """そのページで最初に現れる見出しの y（無ければ None）。"""
    ys = [w[1] for w in pg.get_text('words') if w[0] < 62 and HEAD.search(w[4])]
    return min(ys) if ys else None


def rects_of(pg):
    """同じ xref が同じ場所で二重に返ることがあるので潰す。読み順は上→左。"""
    seen, out = set(), []
    for im in pg.get_images(full=True):
        for r in pg.get_image_rects(im[0]):
            k = (im[0], round(r.x0), round(r.y0))
            if k in seen:
                continue
            seen.add(k)
            out.append(r)
    return sorted(out, key=lambda r: (round(r.y0 / 8), r.x0))


def labels_under(pg, rs):
    """矩形の直下にあるラベル文字。⚠️ 矩形の x 範囲内に限ること（柱を拾わないため）。"""
    got = {}
    for w in pg.get_text('words'):
        t = w[4].strip()
        if not LABEL.match(t):
            continue
        for i, r in enumerate(rs):
            if r.y1 - 2 <= w[1] <= r.y1 + LABEL_BAND and r.x0 - 20 <= w[0] <= r.x1 + 20:
                got.setdefault(i, []).append(t.translate(str.maketrans('ＡＢＣＤ', 'ABCD')))
    return {i: v[0] for i, v in got.items()}


def collect(doc, q):
    """設問図の候補を (page, rect, label) で返す。最初の見出しが出たページで打ち切る。"""
    out = []
    for pno in range(q['pdf'][0], q['pdf'][1] + 1):
        pg = doc[pno - 1]
        hy = head_y(pg)
        rs = [r for r in rects_of(pg) if hy is None or r.y1 <= hy + 4]
        lab = labels_under(pg, rs)
        for i, r in enumerate(rs):
            out.append((pno, r, lab.get(i)))
        if hy is not None:
            break
    return out


def group(q, cand):
    """候補を別冊キー（q['fig']）へ割り付ける。

    キーが1つ  … 候補を全部まとめて1枚にする（複数パネルの図＝C5 の6スライス等）。
    キーが複数 … ラベル文字で分ける。ラベルの並びがキーの枝番と一致することを要求する。
    """
    keys = q['fig']
    sfx = [re.sub(r'^\d+', '', k) for k in keys]
    if len(keys) == 1:
        return ([(keys[0], cand)], 'ok' if cand else 'NOIMG')
    if all(sfx) and all(c[2] for c in cand):
        by = {}
        for c in cand:
            by.setdefault(c[2], []).append(c)
        if sorted(by) == sorted(sfx):
            return ([(k, by[s]) for k, s in zip(keys, sfx)], 'ok')
        return ([(k, by.get(s, [])) for k, s in zip(keys, sfx)], 'LABELMISS')
    return ([(k, []) for k in keys], 'NOLABEL')


MARU = re.compile(r'^[①②③④⑤⑥]$')


def clips_of(items, doc=None):
    """1つの図が**ページをまたぐ**ことがあるので、ページごとに矩形を返す。

    ⚠️⚠️ 全部の外接を1つ取って先頭ページに当ててはいけない。A26「別冊No. 6 ①～⑤」は
       ①②③が p52・④⑤が p53 に分かれており、union を p52 に当てると y が 50 まで
       上がって**設問文の段落を丸ごと巻き込む**（実際にそうなった）。
       save 側で縦に積み直すので、ここではページごとに切っておく。"""
    by = {}
    for p, r, _l in items:
        by[p] = r if p not in by else (by[p] | r)
    out = []
    for p in sorted(by):
        r = fitz.Rect(by[p])
        # ⚠️ ①～⑤ の丸数字は**図の外に組まれているが図の一部**（そのまま選択肢 a〜e に対応する）。
        #    含めないと「どの視野がどの肢か」が読めない絵になる。A26・D25・D40(16B)・F33 が該当。
        if doc is not None:
            for w in doc[p - 1].get_text('words'):
                if not MARU.match(w[4].strip()):
                    continue
                # ⚠️ 縦の中心が図の中に入っているものだけ。上下に緩めると、図の直前にある
                #    選択肢の行（「ｅ　⑤」）まで引き込んで絵の上に文字が乗る（D25 で実際に出た）。
                if r.y0 <= (w[1] + w[3]) / 2 <= r.y1 and r.x0 - 46 <= w[0] <= r.x1 + 46:
                    r |= fitz.Rect(w[0], w[1], w[2], w[3])
        r.x0 -= PAD
        r.y0 -= PAD
        r.x1 += PAD
        r.y1 += PAD
        out.append((p, r))
    return out


def cmd_figs(args):
    doc = fitz.open(PDF)
    qs = [q for q in load_questions() if q.get('fig')]
    if args.only:
        want = set(args.only)
        qs = [q for q in qs if q['block'] + str(q['no']) in want]
    os.makedirs(SHEET, exist_ok=True)
    # ⚠️ 連問の兄弟は同じ図を指す。**ファイル名は図を持ち込んだ設問（群の先頭）のまま**にして
    #    1枚を共有する（CLAUDE.md「連問の図」と同じ約束）。兄弟ごとに同じ絵を別名で保存すると、
    #    あとで図を差し替えたときに片方だけ古いまま残る。
    owner = {}
    for q in load_questions():
        if q['series'] and q['series'] not in owner:
            owner[q['series']] = q['block'] + str(q['no'])
    lines, log, pages, stat, refs, seen = [], [], set(), {}, [], set()
    for q in qs:
        tag = owner.get(q['series'], q['block'] + str(q['no']))
        refs.append('%s %s' % (q['uid'], ' '.join(
            '%s_%d.jpeg' % (tag, i) for i in range(1, len(q['fig']) + 1))))
        cand = collect(doc, q)
        parts, why = group(q, cand)
        stat[why] = stat.get(why, 0) + 1
        log.append('%-5s fig=%-16s cand=%d %s %s'
                   % (tag, ','.join(q['fig']), len(cand), why, q['series'] or ''))
        for pno, r, lab in cand:
            log.append('        p%-4d rect=(%.0f,%.0f,%.0f,%.0f) label=%s'
                       % (pno, r.x0, r.y0, r.x1, r.y1, lab or '-'))
        for i, (key, items) in enumerate(parts, 1):
            if (tag, key) in seen:      # 連問の2問目以降は先頭のぶんで足りている
                continue
            seen.add((tag, key))
            if (tag, key) in MANUAL:
                pno, x0, y0, x1, y1 = MANUAL[(tag, key)]
                lines.append('%s %s %d %d %d %d %d %d  # 目視' % (tag, key, i, pno, x0, y0, x1, y1))
            elif items:
                # 同じ (tag, 連番) の行が複数あれば save が縦に積む（ページまたぎ）
                for pno, c in clips_of(items, doc):
                    lines.append('%s %s %d %d %.0f %.0f %.0f %.0f' %
                                 (tag, key, i, pno, c.x0, c.y0, c.x1, c.y1))
            else:
                lines.append('# TODO %s %s %d  <- %s (手で埋める)' % (tag, key, i, why))
        for pno, _r, _l in cand:
            pages.add(pno)
        if why != 'ok':
            for pno in range(q['pdf'][0], min(q['pdf'][1], q['pdf'][0] + 2) + 1):
                pages.add(pno)
    for pno in sorted(pages):
        f = os.path.join(SHEET, 'p%03d.png' % pno)
        if not os.path.exists(f):
            doc[pno - 1].get_pixmap(dpi=110).save(f)
    io.open(os.path.join(TMP, 'figs.txt'), 'w', encoding='utf-8').write('\n'.join(log) + '\n')
    io.open(MAP, 'w', encoding='utf-8').write(
        '# tag 別冊キー 連番 page x0 y0 x1 y1   <- ページ画像を見て検収する\n'
        '# 連番は図ラベル順（A->1, B->2）。位置で並べ替えないこと。\n'
        + '\n'.join(lines) + '\n')
    io.open(os.path.join(TMP, 'fig_refs.txt'), 'w', encoding='utf-8').write(
        '# uid が参照する画像ファイル（連問の兄弟は先頭のぶんを共有する）\n'
        + '\n'.join(refs) + '\n')
    print('候補 %d問 / 画像 %d枚  %s' % (len(qs), len(lines), stat))
    print('ページ画像 %s / 明細 %s / 地図 %s' % (SHEET, os.path.join(TMP, 'figs.txt'), MAP))


def cmd_save(args):
    from PIL import Image
    doc = fitz.open(PDF)
    os.makedirs(DEST, exist_ok=True)
    jobs = []
    for line in io.open(MAP, encoding='utf-8'):
        line = line.split('#')[0].strip()
        if not line:
            continue
        tag, _key, idx, pno, x0, y0, x1, y1 = line.split()
        jobs.append(((tag, int(idx)), (int(pno), fitz.Rect(*map(float, (x0, y0, x1, y1))))))
    grouped = {}
    for k, v in jobs:
        grouped.setdefault(k, []).append(v)
    n = 0
    for (tag, idx), parts in grouped.items():
        pieces = []
        for pno, r in parts:
            pix = doc[pno - 1].get_pixmap(dpi=300, clip=r)
            pieces.append(Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB'))
        if len(pieces) == 1:
            im = pieces[0]
        else:
            # ページまたぎ（A26 の ①～⑤ だけ）。幅を揃えて縦に積む。
            wmax = max(p.width for p in pieces)
            pieces = [p if p.width == wmax else
                      p.resize((wmax, int(p.height * wmax / p.width + .5)), Image.LANCZOS)
                      for p in pieces]
            im = Image.new('RGB', (wmax, sum(p.height for p in pieces)), 'white')
            y = 0
            for p in pieces:
                im.paste(p, (0, y))
                y += p.height
        w, h = im.size
        if max(w, h) > 1200:
            s = 1200.0 / max(w, h)
            im = im.resize((int(w * s + .5), int(h * s + .5)), Image.LANCZOS)
        path = os.path.join(DEST, '%s_%s.jpeg' % (tag, idx))
        im.save(path, 'JPEG', quality=92, optimize=True)
        print('%-16s %dx%d' % (os.path.basename(path), im.size[0], im.size[1]))
        n += 1
    print('saved %d' % n)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    f = sub.add_parser('figs')
    f.add_argument('--only', nargs='*')
    sub.add_parser('save')
    a = ap.parse_args()
    globals()['cmd_' + a.cmd](a)
