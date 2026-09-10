# -*- coding: utf-8 -*-
"""救急（現場でいきる救急）PDF ユーティリティ

  python _work/emg_pdf.py anstable     巻末解答一覧表を JSON にする
  python _work/emg_pdf.py page N [dpi] ページを画像化（既定300dpi）
  python _work/emg_pdf.py images       埋め込み画像の一覧
  python _work/emg_pdf.py save         map に従って画像を保存

⚠️ この PDF はマイナー講座と版面が違う（★列・CBT列が無い／必修・一般・臨床・正答率の4列）。
   座標は左表・右表・p54 で別々。
"""
import fitz, json, os, re, sys, io

PDF = os.path.join(os.path.dirname(__file__), '..', 'MEC問題文pdf', '現場でいきる救急（表紙2026）.pdf')
OUT = os.path.join(os.path.dirname(__file__), 'emg_anstable.json')

# (ページ index0, NO列x下限, NO列x上限, 解答x, 国試番号x, テーマx, 必修x, 一般x, 臨床x, 正答率x)
# (ページ index0, x範囲, NO列x下限, NO列x上限, 解答x, 国試番号x, テーマx, 必修x, 一般x, 臨床x, 正答率x, 右端)
TABLES = [
    (52, (40, 300),  44,  62,  62,  85, 130, 218, 236, 253, 270, 300),   # p53 左
    (52, (300, 560), 304, 322, 322, 345, 390, 478, 495, 512, 530, 560),  # p53 右
    (53, (40, 320),  49,  67,  67,  95, 135, 224, 241, 258, 276, 320),   # p54 左
]


def anstable():
    d = fitz.open(PDF)
    rows = []
    for (pi, xr_, nlo, nhi, xa, xk, xt, xh, xi, xr2, xp, xend) in TABLES:
        ws = [w for w in d[pi].get_text('words') if xr_[0] <= w[0] < xr_[1] and w[1] > 100]
        anchors = sorted([(w[1], int(w[4]), w) for w in ws
                          if nlo <= w[0] <= nhi and re.fullmatch(r'\d{1,3}', w[4])])
        heads = [(w[1], w[4].strip()) for w in ws
                 if nlo - 8 <= w[0] <= nlo + 2 and not re.fullmatch(r'\d{1,3}', w[4])]
        for idx, (y, no, w) in enumerate(anchors):
            y0 = (anchors[idx - 1][0] + y) / 2 if idx else 100
            y1 = (anchors[idx + 1][0] + y) / 2 if idx + 1 < len(anchors) else 10000
            sel = [x for x in ws if y0 <= x[1] < y1]

            def col(lo, hi):
                return ''.join(x[4] for x in sel if lo <= x[0] < hi)
            merged = col(xt, xh)
            rate = col(xp, xend)
            # ⚠️ 章見出し（「119回救急」等）が解答列の x 範囲に食い込む行がある
            #    （NO.48 が 'c回救急'、NO.52 が '回救急e' になっていた）。
            #    解答は a〜e とカンマだけなので、それ以外を落として取り出す。
            rows.append(dict(
                no=no,
                ans=re.sub(r'[^a-e,]', '', col(xa, xk)),
                kokushi=col(xk, xt).replace('／', '/'),
                theme=merged.replace('○', ''),
                hisshu=('○' in col(xh, xi)) or merged.endswith('○'),
                ippan='○' in col(xi, xr2),
                rinsho='○' in col(xr2, xp),
                rate=(int(rate) if re.fullmatch(r'\d+', rate) else None),
                head=([h for h in heads if y0 <= h[0] < y] or [(0, '')])[-1][1],
            ))
    rows.sort(key=lambda r: r['no'])
    io.open(OUT, 'w', encoding='utf-8').write(json.dumps(rows, ensure_ascii=False, indent=1))
    print('rows', len(rows), '->', OUT)



# ------------------------------------------------------------------
# 画像
# ------------------------------------------------------------------
# 設問図の帰属（整形外科式＝機械が候補を出し、ページ描画で人が検収した結果）。
#   (PDFページ, xref) -> 保存名（拡張子なし）
# ⚠️ 「参考画像」「check point」の図は設問図ではないので入れない。
IMG_MAP = {
    # 頭部外傷
    (12, 106): '118B-44_1',          # 処置後の頭部単純CT（3スライス）
    # 全身熱傷（連問 12〜14 の共通ステムの図＝兄弟3人に付ける）
    (13, 117): '108E-63_1',          # 熱傷深度と熱傷範囲の図
    # 創傷
    (17, 143): '111C-22_1',          # 別紙No.1-A 左下腿の開放創（A=左の写真）
    (17, 145): '111C-22_2',          # 別紙No.1-B 下腿エックス線
    (18, 153): '117D-1_1',           # 別紙No.2-A 損傷の写真
    (18, 155): '117D-1_2',           # 別紙No.2-B 創部を寄せ合わせた状態
    (19, 164): '118B-36_1',          # 別紙No.3 額の縫合後
    (19, 166): '116F-38_1',          # 別紙No.4 耳介の創部
    # 化学損傷
    (21, 175): '112A-52_1',          # 別紙No.5 前眼部写真（右眼・左眼）
    # 鑑別（⚠️ A が左＝xref276、B が右＝xref274。xref順とラベル順が逆）
    (33, 276): '106E-51_1',          # A 胸部単純CT
    (33, 274): '106E-51_2',          # 別紙No.6-B 胸郭3D-CT
    # BLS
    (38, 309): '110C-2_1',           # 別紙No.7 前頸部の模式図（①〜⑤）
    (38, 311): '116E-12_1',          # 別紙No.8 正面および側面の頸部写真（①〜⑤）
    # 119回
    (42, 339): '119F-59_1',          # 別紙No.9 左下腿の感染創
    # 120回
    (43, 345): '120A-65_1',          # A 胸部エックス線写真
    (43, 347): '120A-65_2',          # B 胸部単純CT
    (47, 360): '120C-70_1',          # 連問 58〜60 の共通ステムの熱傷範囲図
    (49, 373): '120D-17_1',          # 別紙No.10-A 画鋲の写真
    (49, 375): '120D-17_2',          # 別紙No.10-B 胸腹部エックス線写真
}


def images():
    """埋め込み画像の一覧（ページ・xref・矩形・寸法）＋ページ描画を出す。"""
    S = os.environ.get('SCRATCH', '.')
    d = fitz.open(PDF)
    only = set(int(x) for x in sys.argv[2:]) if len(sys.argv) > 2 else None
    for i in range(d.page_count):
        if only and (i + 1) not in only:
            continue
        ims = d[i].get_images(full=True)
        if not ims:
            continue
        print('--- page %d' % (i + 1))
        for im in ims:
            xref = im[0]
            rects = d[i].get_image_rects(xref)
            for r in rects:
                print('   xref=%-5d %4dx%-4d  rect=(%.0f,%.0f)-(%.0f,%.0f)'
                      % (xref, im[2], im[3], r.x0, r.y0, r.x1, r.y1))
        d[i].get_pixmap(dpi=110).save(os.path.join(S, 'pg%02d.png' % (i + 1)))


def save():
    """IMG_MAP に従って 救急/images/ へ保存する。線画は q95、写真は q85。"""
    from PIL import Image
    out = os.path.join(os.path.dirname(__file__), '..', '救急', 'images')
    os.makedirs(out, exist_ok=True)
    d = fitz.open(PDF)
    n = 0
    for (pg, xref), name in sorted(IMG_MAP.items()):
        pix = fitz.Pixmap(d, xref)
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        q = 95 if _is_line_art(img) else 85
        img.save(os.path.join(out, name + '.jpeg'), 'JPEG', quality=q, optimize=True)
        print('%-22s %4dx%-4d q%d' % (name + '.jpeg', img.width, img.height, q))
        n += 1
    print('saved', n)


def _is_line_art(img):
    """ほぼ無彩色なら線画とみなす（ent_pdf.py と同じ判定）。"""
    sm = img.resize((64, 64))
    px = list(sm.getdata())
    gray = sum(1 for (r, g, b) in px if max(r, g, b) - min(r, g, b) < 18)
    return gray / len(px) > 0.92


def page():
    n = int(sys.argv[2]); dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 300
    S = os.environ.get('SCRATCH', '.')
    d = fitz.open(PDF)
    p = os.path.join(S, 'p%d.png' % n)
    d[n - 1].get_pixmap(dpi=dpi).save(p)
    print(p)

if __name__ == '__main__':
    {'anstable': anstable, 'page': page, 'images': images, 'save': save}[sys.argv[1]]()
