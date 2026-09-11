# -*- coding: utf-8 -*-
"""必修講座（hisshu）の questions_hisshu.json を PDF から作る。

  python _work/hisshu_pdf.py anstable     # 巻末の解答表 → _work/hisshu_anstable.json
  python _work/hisshu_pdf.py parse        # 問題ページ   → _work/hisshu_parsed.json
  python _work/build_hisshu_json.py --figs   # 設問の図を 必修講座/images/ へ（図を変えたときだけ）
  python _work/build_hisshu_json.py          # questions_hisshu.json を書き出す
  python _work/build_hisshu_json.py --check  # 現物と一致するかだけ見る

⚠️⚠️ questions_hisshu.json は純粋な派生物——直接編集しないこと。
   解説は2つの経路でしか入らない:
   ① 借用（BORROW）: 同じ国試問題が既存の科目・過去問ビューアにあれば、その解説と
      正答率を生成時にコピーする。元の科目の解説を直せば、次の生成でこちらにも入る。
   ② 手書き（_work/hisshu_overrides.json）: uid をキーに、ans_sub / eg などを上書きする。
      「欲しい問題だけ後から解説を付け足す」はこちらに書く。借用より優先される。
   どちらも無い問題は解説なし（✅ の下に解答表の出題テーマだけを出す）。

⚠️ 借用は「同じ問題であること」を確かめてからしか行わない（same_question）。
   episode の先頭の国試番号が一致し、選択肢の文言が5肢中4肢以上一致し、
   かつ正解の肢が同じもの。類題（episode の2つ目以降の番号）は借りない。
"""
import argparse, glob, io, json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hisshu_pdf as H                                        # noqa: E402

SID = 'hisshu'
OUT = 'questions_hisshu.json'
IMG_DIR = '必修講座/images'
OVERRIDES = '_work/hisshu_overrides.json'
FW = 'ａｂｃｄｅｆｇｈｉ'
HW = 'abcdefghi'

# 借用しない科目（国試問題ではない・ユーザー自作・模試）
NO_BORROW = {'custom', 'memo', 'm121s', SID}


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── 手で書き起こしたもの（ページを描画して目視で読んだ。_work/必修講座_引き継ぎ.md §3） ──
# 選択肢が表の問題。表は試験モードの肢シャッフルで対応が崩れるので、列見出しを各肢に埋め込む。
# 表の見出し行（\t を含む設問文の行）は設問文から落とす。
TABLE_CHOICES = {
    52: ['患者 HBs 抗原＋・HBs 抗体－／医療従事者 HBs 抗原－・HBs 抗体＋',
         '患者 HBs 抗原＋・HBs 抗体－／医療従事者 HBs 抗原－・HBs 抗体－',
         '患者 HBs 抗原－・HBs 抗体＋／医療従事者 HBs 抗原－・HBs 抗体＋',
         '患者 HBs 抗原－・HBs 抗体＋／医療従事者 HBs 抗原－・HBs 抗体－',
         '患者 HBs 抗原－・HBs 抗体＋／医療従事者 HBs 抗原＋・HBs 抗体－'],
    104: ['咳－／鼻汁－／体温38.6℃／扁桃腫大＋・白苔－／リンパ節腫脹＋（全身）',
          '咳－／鼻汁－／体温38.6℃／扁桃腫大＋・白苔＋／リンパ節腫脹＋（頸部）',
          '咳＋／鼻汁＋／体温37.4℃／扁桃腫大－・白苔－／リンパ節腫脹＋（頸部）',
          '咳＋／鼻汁＋／体温38.6℃／扁桃腫大－・白苔－／リンパ節腫脹－',
          '咳＋／鼻汁－／体温37.4℃／扁桃腫大－・白苔－／リンパ節腫脹－'],
    201: ['好中球 0 ―――― 扁平上皮細胞 0',
          '好中球 5 ―――― 扁平上皮細胞 5',
          '好中球 5 ―――― 扁平上皮細胞 30',
          '好中球 30 ―――― 扁平上皮細胞 5',
          '好中球 30 ―――― 扁平上皮細胞 30'],
    257: ['炭水化物 35％／蛋白質 35％／脂質 30％',
          '炭水化物 35％／蛋白質 15％／脂質 50％',
          '炭水化物 55％／蛋白質 35％／脂質 10％',
          '炭水化物 55％／蛋白質 15％／脂質 30％',
          '炭水化物 75％／蛋白質 15％／脂質 10％'],
    # 図の中の曲線 a〜e が選択肢（選択肢の本文は紙面に無い）。図があるのでシャッフルされない。
    231: ['a', 'b', 'c', 'd', 'e'],
}

# 設問文の中に表がある問題（罫線はベクター）。表は <table class="tb"> で組む。
QT_FIX = {
    208: ('43 歳の女性。1 か月前の健康診断で異常を指摘され来院した。健診の報告書を示す。'
          '<table class="tb"><tr><th></th><th>基準値</th><th>あなたの値</th></tr>'
          '<tr><td>白血球（/μL）</td><td>4,000 ～8,000</td><td>3,800</td></tr></table>'
          '要精査。医療機関を受診してください。<br/>'
          '<strong>患者への説明として誤っているのはどれか。</strong>'),
    228: ('65 歳の女性。めまいを主訴に来院した。今朝、起床時に寝返りを打ったところ天井がぐるぐる回り、'
          '悪心を伴ったため、ベッド上で安静にしていた。めまいと悪心は1 分程度で消失した。その後、'
          '朝食の準備中に振り向いた際に同様のめまいと悪心が再び出現したため、心配になり受診した。'
          '安静時のめまいはない。頭痛、耳鳴および難聴はない。意識は清明。体温36.5℃。脈拍72/ 分、整。'
          '血圧122/76mmHg。神経診察で異常を認めない。<br/>'
          '良性発作性頭位めまい症の診断予測スコアを表1 に、その診断スコア合計点別の尤度比を表2 に示す。<br/>'
          '表1　良性発作性頭位めまい症の診断予測スコア'
          '<table class="tb"><tr><th>項目</th><th>スコア</th></tr>'
          '<tr><td>めまいの持続時間2 分以内</td><td>1</td></tr>'
          '<tr><td>寝返りで誘発される</td><td>2</td></tr>'
          '<tr><td>安静時にめまいがある</td><td>－1</td></tr></table>'
          '表2　診断スコア合計点別の尤度比'
          '<table class="tb"><tr><th>スコア合計</th><th>陽性尤度比</th></tr>'
          '<tr><td>－1 点</td><td>0.1</td></tr><tr><td>0 点</td><td>0.2</td></tr>'
          '<tr><td>1 点</td><td>1.3</td></tr><tr><td>2 点</td><td>2.8</td></tr>'
          '<tr><td>3 点</td><td>6.8</td></tr></table>'
          '<strong>この患者における良性発作性頭位めまい症の事前確率が40％である場合、'
          'この患者における良性発作性頭位めまい症の事後確率に最も近いのはどれか。</strong>'),
}

# 設問文の一部を差し替える（紙面の飾りをテキストでは表せないもの）。
QT_SUB = {
    215: [('　X　', ' <span style="border:1px solid currentColor;padding:0 .4em">X</span> ')],  # 枠で囲んだ X
}

# 図の切り出し範囲を画像の外まで広げる問題（PDF座標）。
# ⚠️ 見出しや番号が画像の外に組まれていて、それが無いと問いに答えられないもの。
#    A/B のラベルは入れない（並び順で表す＝既存科目と同じ規約）。
CLIP_FIX = {
    171: [(129, (205, 138, 400, 224))],       # 「Ⅰ音 Ⅱ音 Ⅰ音」の見出しが画像の上にある
    # 5枚の写真と ①〜⑤ の番号を1枚にまとめる。左上に入る選択肢「a ①…」は白で消す
    200: [(148, (75, 124, 530, 465), [(75, 124, 226, 300)])],
}


# ── 設問文の組み立て ────────────────────────────────────────────
HEADING = re.compile(r'^([^\s：「」。、]{1,6}(?:　[^\s：「」。、]{1,3})?)：')
FULL_X1 = 520        # 本文の右端は x≈537〜545。これより右で終わる行は「詰まっている」


def _clean(s):
    s = re.sub(r'[\x00-\x08\x0b-\x1f]', '', s)
    s = s.replace('\t', '')
    return s.strip()


def paragraphs(lines):
    """PDF の行 → 段落（html）の並び。

    ・行頭の「現病歴：」「研修医：」のような見出し（x<62）＝ 新しい段落（見出しは <b>）
    ・見出しの無い段落: 字下げ（x≥62）で始まる行 ＝ 新しい段落。続きの行は字下げしない（x≈58）
    ・見出しの段落: 続きの行も字下げされる（ぶら下げ）。字下げだけでは新しい段落と区別できない
      ので、直前の行が右端まで詰まっていれば折り返し、短く終わっていれば新しい段落とみなす
      （S19 の「…呼吸数16/ 分。」→「SpO2 97％…」は折り返し、「…腫大を認める。」→
      「左肺腺癌と診断され…」は新しい段落）。
    ⚠️ PDF の折り返しは本文の一部ではないので繋ぐ（原文の字は1字も変えない）。"""
    paras = []
    prev_full, head_para = False, False
    for y0, x0, text, html, x1 in lines:
        t, h = _clean(text), _clean(html)
        if not t:
            continue
        if re.fullmatch(r'[Ａ-ＥA-E](?:\s*[Ａ-ＥA-E])*', t):   # _clean がタブを落とし済み
            continue                                   # 図の下の A B ラベル
        m = HEADING.match(t) if x0 < 62 else None
        if m:
            paras.append(h.replace(m.group(0), '<b>%s</b>' % m.group(0), 1))
            head_para = True
        elif not paras:
            paras.append(h)
            head_para = False
        elif x0 >= 62 and not (head_para and prev_full):
            paras.append(h)
            head_para = False
        else:
            paras[-1] += h
        prev_full = x1 > FULL_X1
    return [p.replace('</u><u>', '').replace('</u> <u>', ' ') for p in paras]


def strongify(paras):
    """問いの段落を <strong> で囲む。整形外科・耳鼻咽喉科と同じ形。

    問いは普通は最後の段落だが、後ろに「ただし、…」の但し書きが続くことがある（NO.201・250）。
    最後に「か。」で終わる段落から末尾までを問いとみなす。"""
    if not paras:
        return paras
    plain = [re.sub(r'<[^>]+>', '', p) for p in paras]
    idx = max([i for i, t in enumerate(plain) if re.search(r'か。$|か。（', t)] or [len(paras) - 1])
    return paras[:idx] + ['<strong>%s</strong>' % p for p in paras[idx:]]


def series_decl(nos):
    if len(nos) == 2:
        return '次の文を読み、Q.%d と Q.%d の問いに答えよ。' % tuple(nos)
    return '次の文を読み、Q.%d 〜 Q.%d の問いに答えよ。' % (nos[0], nos[-1])


# ── 選択肢 ──────────────────────────────────────────────────────
def norm_choice(body):
    """組合せ問題の罫線（―――）と、セルの区切りのタブを「 ―――― 」へ揃える。"""
    b = re.sub(r'\s*(?:[―─]\s*){2,}\t?\s*', ' ―――― ', body)
    b = re.sub(r'\s*\t\s*', ' ―――― ', b)
    return b.strip()


# ── 借用元の索引 ────────────────────────────────────────────────
KIDRE = re.compile(r'(\d{2,3})([A-I])-?(\d{1,3})')


def kid_key(s):
    m = KIDRE.search(s or '')
    return '%s%s%s' % (m.group(1), m.group(2), int(m.group(3))) if m else None


def _nz(s):
    """選択肢の比較用に正規化する（空白・全半角・下付き・記号の差を消す）。"""
    s = re.sub(r'<[^>]+>', '', s or '')
    s = re.sub(r'^[ａ-ｉa-i][\s　]*', '', s.strip())
    s = unicodedata.normalize('NFKC', s)             # 全角英数・下付き・上付き → 半角
    s = re.sub(r'〈[^〉]*〉', '', s)                    # 既存側が〈ADL〉のような略語を補っていることがある
    s = re.sub(r'[\s・、。，．,.:：「」<>()―─—‐\-−]', '', s)   # 組合せの罫線は ― ─ — が混在
    return s.lower()


def _same_text(a, b):
    a, b = _nz(a), _nz(b)
    if a == b:
        return True
    # 片方が途中で切れている／片方が補っているだけなら同じとみなす:
    #   過去問ビューアの選択肢は2段組の右端で切れている（120E-13 の d・e）、組合せの左列だけ
    #   になっている（116B-14「乳癌」）。公衆衛生は「①」の後ろに下線部の文を補っている（119B-41）。
    # ⚠️ 前方一致を許しても誤って借りないのは、国試番号と正解の肢の一致を先に要求しているから。
    short, long_ = sorted((a, b), key=len)
    return len(short) >= 1 and long_.startswith(short)


def subject_names():
    src = io.open('study.html', encoding='utf-8').read()
    m = re.search(r'const STUDY_SUBJECTS = (\[.*?\]);', src)
    return {s['id']: s['name'] for s in json.loads(m.group(1))}


def load_sources():
    """国試番号 → 借用候補の一覧。"""
    names = subject_names()
    idx = {}
    for f in sorted(glob.glob('questions_*.json')):
        sid = os.path.basename(f)[10:-5]
        if sid in NO_BORROW:
            continue
        d = json.load(io.open(f, encoding='utf-8'))
        for ch in d['chapters']:
            for q in ch['qs']:
                k = kid_key(q.get('episode', ''))      # 先頭の番号だけ（類題は借りない）
                if not k or not q.get('eg'):
                    continue
                idx.setdefault(k, []).append(dict(
                    kind='subject', sid=sid, name=names.get(sid, sid), uid=q['uid'],
                    qn=q['qn'], choices=[c['t'] for c in q['choices']],
                    ok=[i for i, c in enumerate(q['choices']) if c['ok']],
                    rate=q.get('rate', -1), eg=q['eg'], ans_sub=q.get('ans_sub', ''),
                    size=sum(len(b.get('c', '')) for b in q['eg'])))
    for f in sorted(glob.glob('国家試験過去問/*/*.html')):
        s = io.open(f, encoding='utf-8').read()
        for m in re.finditer(r'<div class="qc"[^>]*data-uid="kakumon_(\d+)([A-I])_q(\d+)"', s):
            end = s.find('<div class="qc"', m.end())
            card = s[m.start(): end if end > 0 else len(s)]
            k = '%s%s%s' % (m.group(1), m.group(2), int(m.group(3)))
            rate = re.search(r'data-rate="([\d.]+)"', card[:200])
            chs = re.findall(r'<div class="ch2( ok)?">(.*?)</div>', card)
            egm = card.find('<div class="eg">')
            eg = []
            if egm >= 0:
                body = card[egm + len('<div class="eg">'):]
                for bm in re.finditer(r'<div class="eb (\w+)"><h4>(.*?)</h4>(.*?)</div>(?=<div class="eb |</div></div></div>)',
                                      body, re.S):
                    eg.append(dict(cls=bm.group(1), h=re.sub('<[^>]+>', '', bm.group(2)), c=bm.group(3)))
            as_ = re.search(r'<div class="as">(.*?)</div>', card, re.S)
            if not eg:
                continue
            idx.setdefault(k, []).append(dict(
                kind='kakomon', sid='kakomon', name='過去問 第%s回%s問題' % (m.group(1), m.group(2)),
                uid='kakumon_%s%s_q%s' % m.groups(), qn='%s' % m.group(3),
                choices=[c[1] for c in chs], ok=[i for i, c in enumerate(chs) if c[0]],
                rate=float(rate.group(1)) if rate else -1, eg=eg,
                ans_sub=as_.group(1) if as_ else '',
                size=sum(len(b['c']) for b in eg)))
    return idx


def same_question(src, choices, ok, table=False):
    """同じ問題か。選択肢数が同じ・文言が4/5以上一致・正解の肢が同じ。

    table=True（選択肢が表で、ここで列見出しを埋め込んで書き起こした問題）は
    文言の書き方が科目ごとに違って比べられないので、正解の肢の一致だけで判定する。
    ⚠️ 対象は TABLE_CHOICES の5問だけで、どれもページを描画して同じ問題だと目で確かめてある。"""
    if len(src['choices']) != len(choices):
        return False
    if not (src['ok'] and set(src['ok']) <= set(ok) and src['ok'][0] == ok[0]):
        return False
    if table:
        return True
    same = sum(1 for a, b in zip(src['choices'], choices) if _same_text(a, b))
    return same >= len(choices) - 1


def pick_source(cands, choices, ok, table=False):
    good = [c for c in cands if same_question(c, choices, ok, table)]
    if not good:
        return None, cands
    # 作り直した科目の解説（ep/ee/em/ept）を過去問ビューアより優先し、その中で厚いもの
    good.sort(key=lambda c: (c['kind'] != 'subject', -c['size']))
    return good[0], [c for c in cands if c not in good]


def rate_fields(r):
    if r is None or r < 0:
        return -1, '', ''
    r = int(round(r))
    cls = 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')
    return r, cls, '%d%%' % r


# ── 図 ──────────────────────────────────────────────────────────
def figure_plan(doc, P):
    """問題 NO. → [dict(page, rect, name, mask), …]。

    ・連問のステムの図は兄弟全員へ配る（2026-09-06 の規約）。ファイル名は群の先頭の設問の
      国試番号を共有する。兄弟の設問文の中にある図（NO.295 の頭部CT）は自分の番号で持つ。
    ・並びは図の直下の A/B ラベル順（ラベルが無ければ上から・左から）。"""
    import fitz
    stems = P['series']
    by = {p['no']: p for p in P['problems']}
    groups = {}                                        # (owner_kid, nos) → [(key, page, rect, mask)]
    for no, figs in CLIP_FIX.items():
        for i, f in enumerate(figs):
            groups.setdefault((by[no]['kid'], (no,)), []).append(
                ((i,), f[0], fitz.Rect(*f[1]), [fitz.Rect(*m) for m in (f[2] if len(f) > 2 else [])]))
    for pn in sorted({p['page'] for p in P['problems']}):
        page = doc[pn - 1]
        infos = page.get_image_info()
        if not infos:
            continue
        drs = page.get_drawings()
        boxes = [d['rect'] for d in drs if d['rect'].width > 440 and d['rect'].height > 30 and d['rect'].x0 < 70]
        heads = sorted([(p['y'], p['no']) for p in P['problems'] if p['page'] == pn] +
                       [(v['y'], k) for k, v in stems.items() if v['page'] == pn])
        labels = [l for l in H.page_lines(page) if re.fullmatch(r'[Ａ-ＥA-E]', l['text'].strip())]
        for info in infos:
            r = fitz.Rect(info['bbox'])
            if not any(b.intersects(r) for b in boxes):
                continue                                # レジュメの図
            owner = [h for h in heads if h[0] < r.y0]
            if not owner:
                continue
            who = owner[-1][1]
            if isinstance(who, str):                    # 連問のステムの図
                nos = tuple(stems[who]['nos'])
                kid = by[nos[0]]['kid']
            else:
                nos, kid = (who,), by[who]['kid']
            if any(n in CLIP_FIX for n in nos):
                continue
            lab = [l for l in labels if r.x0 - 10 <= l['x0'] <= r.x1 and 0 <= l['y0'] - r.y1 <= 25]
            key = (lab[0]['text'].strip().translate(str.maketrans('ＡＢＣＤＥ', 'ABCDE')) if lab else '',
                   round(r.y0 / 20), r.x0)
            groups.setdefault((kid, nos), []).append((key, pn, r, []))
    plan = {}
    for (kid, nos), figs in sorted(groups.items()):
        figs.sort(key=lambda t: t[0])
        items = [dict(page=pn, rect=r, mask=m, name='%s_%d.jpeg' % (kid, i))
                 for i, (_, pn, r, m) in enumerate(figs, 1)]
        for n in nos:
            plan.setdefault(n, []).extend(items)
    return plan


def write_figs(doc, plan):
    from PIL import Image, ImageDraw
    os.makedirs(IMG_DIR, exist_ok=True)
    done = set()
    for figs in plan.values():
        for f in figs:
            if f['name'] in done:
                continue
            done.add(f['name'])
            r = f['rect']
            pix = doc[f['page'] - 1].get_pixmap(dpi=300, clip=r)
            im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            k = pix.width / r.width
            for m in f['mask']:                        # 切り出し範囲に入った紙面の文字を消す
                ImageDraw.Draw(im).rectangle([(m.x0 - r.x0) * k, (m.y0 - r.y0) * k,
                                              (m.x1 - r.x0) * k, (m.y1 - r.y0) * k], fill='white')
            if max(im.size) > 1200:                    # compress_images.py と同じ上限
                s = 1200 / max(im.size)
                im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            px = list(im.resize((64, 64)).getdata())
            gray = sum(1 for p in px if max(p) - min(p) < 14) / len(px)
            # ⚠️ 線画（心電図・模式図）は q85 だと pdf_audit.py の知覚ハッシュがずれる
            im.save(os.path.join(IMG_DIR, f['name']), quality=95 if gray > 0.92 else 85)
    print('図 %d枚 → %s/' % (len(done), IMG_DIR))


# ── 本体 ────────────────────────────────────────────────────────
def build():
    import fitz
    A = json.load(io.open(H.ANSTABLE, encoding='utf-8'))
    P = json.load(io.open(H.PARSED, encoding='utf-8'))
    at = {r['no']: r for r in A['rows']}
    by = {p['no']: p for p in P['problems']}
    doc = fitz.open(H.PDF)
    plan = figure_plan(doc, P)
    sources = load_sources()
    report = dict(borrowed=[], rejected=[], none=[])

    chapters = []
    starts = [c['start'] for c in A['chapters']] + [len(at) + 1]
    for ci, ch in enumerate(A['chapters']):
        qs = []
        for no in range(starts[ci], starts[ci + 1]):
            p, r = by[no], at[no]
            uid = '%s_ch%02d_q%d' % (SID, ci + 1, no)
            # 設問文
            if no in QT_FIX:
                qt = QT_FIX[no]
            else:
                lines = [l for l in p['qt'] if not (no in TABLE_CHOICES and '\t' in l[2])]
                own = strongify(paragraphs(lines))
                if p['series']:
                    S = P['series'][p['series']]
                    stem = paragraphs(S['stem'])
                    qt = ('<span class="kw">%s</span><br/>' % series_decl(S['nos'])
                          + '<br/>'.join(stem + own))
                else:
                    qt = '<br/>'.join(own)
            for old, new in QT_SUB.get(no, []):
                if old not in qt:
                    die('NO.%d: QT_SUB の置換元が見つからない %r' % (no, old))
                qt = qt.replace(old, new)
            # 選択肢
            bodies = TABLE_CHOICES.get(no) or [norm_choice(c[1]) for c in p['choices']]
            letters = [FW[i] for i in range(len(bodies))]
            ans = r['ans'].split(',')
            ok_idx = [HW.index(a) for a in ans]
            if r['either']:
                ok_idx = ok_idx[:1]        # 「a or c」は a を正解肢にし、c も正解だったことは ans_label に書く
            choices = [dict(t='%s　%s' % (letters[i], b), ok=i in ok_idx) for i, b in enumerate(bodies)]
            ans_label = '／'.join(choices[i]['t'] for i in ok_idx)
            if r['either']:
                alt = [HW.index(a) for a in ans][1:]
                ans_label += '（%s も正解として採点）' % '・'.join(choices[i]['t'] for i in alt)
            # バッジ
            badges = [dict(cls='bip', t='一般') if r['ippan'] else dict(cls='brn', t='臨床')]
            imgs = ['%s/%s' % (IMG_DIR, f['name']) for f in plan.get(no, [])]
            if imgs:
                badges.append(dict(cls='bi', t='📷 画像'))
            if r['excluded']:
                badges.append(dict(cls='bx', t='採点除外'))
            theme = r['theme'] + ('（%s）' % r['disease'] if r['disease'] else '')
            q = dict(uid=uid, qn='Q.%d' % no, episode='(%s)' % r['kid'],
                     rate=-1, rate_cls='', rate_text='', badges=badges, qt=qt,
                     choices=choices, ans_label=ans_label,
                     ans_sub='出題テーマ：' + theme, eg=[], imgs=imgs)
            if r['note'] and not r['either']:
                q['ans_sub'] += '<br/>' + r['note']
            # 借用
            src, rej = pick_source(sources.get(kid_key(r['kid']), []),
                                   [c['t'] for c in choices], [HW.index(a) for a in ans],
                                   table=no in TABLE_CHOICES)
            for c in rej:
                report['rejected'].append((no, r['kid'], c['uid']))
            if src:
                q['rate'], q['rate_cls'], q['rate_text'] = rate_fields(src['rate'])
                # 過去問ビューアの .as は「着目point」の冒頭をそのまま切ったもので、連問では
                # 「48～49 48：…」と兄弟の話から始まる（116B-49）。出題テーマのままにする。
                if src['kind'] == 'subject' and src['ans_sub']:
                    q['ans_sub'] = src['ans_sub']
                where = ('<b>%s %s</b>' % (src['name'], src['qn']) if src['kind'] == 'subject'
                         else '<b>%s %s番</b>' % (src['name'], src['qn']))
                q['eg'] = list(src['eg']) + [dict(
                    cls='ept', h='📎 解説の出典',
                    c='この問題（%s）は %s と同じ国試問題なので、その解説を借りて載せています。'
                      '<br/>出題テーマ：%s' % (r['kid'], where, theme))]
                report['borrowed'].append((no, r['kid'], src['uid']))
            else:
                report['none'].append((no, r['kid']))
            qs.append(q)
        chapters.append(dict(title='第%d章 %s' % (ci + 1, ch['title']), qs=qs))
    return chapters, report, plan, doc, P


def apply_overrides(chapters):
    if not os.path.exists(OVERRIDES):
        return 0
    ov = json.load(io.open(OVERRIDES, encoding='utf-8'))
    by = {q['uid']: q for ch in chapters for q in ch['qs']}
    n = 0
    for uid, patch in ov.items():
        if uid.startswith('_'):
            continue
        if uid not in by:
            die('overrides に未知の uid: %s' % uid)
        by[uid].update(patch)
        n += 1
    return n


def verify(chapters):
    """読み取りが壊れていないことの検算。⚠️ 黙って通さず落とすこと。"""
    err, seen = [], set()
    for ch in chapters:
        for q in ch['qs']:
            u = q['uid']
            if u in seen:
                err.append('%s: uid が重複' % u)
            seen.add(u)
            if not q['qt'].strip():
                err.append('%s: 設問文が空' % u)
            if len(q['choices']) < 2:
                err.append('%s: 選択肢が %d 個' % (u, len(q['choices'])))
            letters = [c['t'][0] for c in q['choices']]
            if letters != list(FW[:len(letters)]):
                err.append('%s: 選択肢の記号 %s' % (u, ''.join(letters)))
            if not any(c['ok'] for c in q['choices']):
                err.append('%s: 正解肢(ok)が1つも無い' % u)
            if any(re.search(r'[\t\x00-\x1f]', c['t']) for c in q['choices']):
                err.append('%s: 選択肢にタブ・制御文字' % u)
            if re.search(r'[\t\x00-\x08]', q['qt']):
                err.append('%s: 設問文にタブ・制御文字' % u)
            if q['qt'].count('<u>') != q['qt'].count('</u>'):
                err.append('%s: <u> が閉じていない' % u)
            if any(b['cls'] == 'bi' for b in q['badges']) != bool(q['imgs']):
                err.append('%s: 📷バッジと imgs が食い違う' % u)
            for src in q['imgs']:
                if not os.path.exists(src):
                    err.append('%s: 図の実体が無い %s（--figs で書き出す）' % (u, src))
            for b in q['eg']:
                if b['cls'] not in ('ep', 'ee', 'ept', 'em', 'ec', 'ei'):
                    err.append('%s: 未知の cls %s' % (u, b['cls']))
            m = re.search(r'Q\.(\d+) (?:と|〜) Q\.(\d+)', q['qt'])
            if m and not (int(m.group(1)) <= int(u.split('_q')[1]) <= int(m.group(2))):
                err.append('%s: 連問の宣言文と番号が噛み合わない' % u)
            if re.search(r'示す|図の', re.sub(r'<[^>]+>', '', q['qt'])) and not q['imgs'] \
                    and u.split('_q')[1] not in NO_FIG_OK:
                err.append('%s: 「示す」とあるのに図が無い' % u)
    if err:
        print('*** 検算エラー %d件' % len(err))
        for e in err[:60]:
            print('   ', e)
        sys.exit(1)


# 「示す」とあるが図ではないもの（会話・報告書・表を本文で示している／動詞としての「示す」）
NO_FIG_OK = {'19', '20', '91', '129', '185', '208', '228'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--figs', action='store_true', help='設問の図を 必修講座/images/ へ書き出す')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--report', action='store_true', help='借用の内訳を出す')
    a = ap.parse_args()
    chapters, report, plan, doc, P = build()
    if a.figs:
        write_figs(doc, plan)
    tot = sum(len(c['qs']) for c in chapters)
    for c in chapters:
        qs = c['qs']
        print('  %-26s %3d問（借用%3d・画像%2d）' % (
            c['title'], len(qs), sum(1 for q in qs if q['eg']), sum(1 for q in qs if q['imgs'])))
    n = apply_overrides(chapters)
    print('借用 %d問・解説なし %d問・手書きの上書き %d問（%s）'
          % (len(report['borrowed']), len(report['none']), n, OVERRIDES))
    if a.report:
        for no, kid, uid in report['rejected']:
            print('  借用しなかった候補 NO.%d %s ← %s' % (no, kid, uid))
    verify(chapters)
    js = json.dumps(dict(sid=SID, chapters=chapters), ensure_ascii=False, indent=2)
    if a.check:
        cur = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        print('現物と一致' if cur == js else '*** 現物と差分あり')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し %s  %dKB  %d問' % (OUT, os.path.getsize(OUT) // 1024, tot))


if __name__ == '__main__':
    main()
