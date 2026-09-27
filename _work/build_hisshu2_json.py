# -*- coding: utf-8 -*-
"""必修講座Part2（hisshu2）の questions_hisshu2.json を PDF から作る。

  python _work/hisshu2_pdf.py anstable        # 巻末の解答表 → _work/hisshu2_anstable.json
  python _work/hisshu2_pdf.py parse           # 問題ページ   → _work/hisshu2_parsed.json
  python _work/build_hisshu2_json.py --figs   # 設問の図を 必修講座Part2/images/ へ（図を変えたときだけ）
  python _work/build_hisshu2_json.py          # questions_hisshu2.json を書き出す
  python _work/build_hisshu2_json.py --check  # 現物と一致するかだけ見る

Part1（hisshu）とは別の科目（2026-09-27 ユーザー判断）。章＝A問題・B問題・C問題の3つ。
表示番号と uid は3ブロックを通した連番（A1=Q.1 … C60=Q.180・科目内通しの規約）で、
紙面の番号「A問題 17」はバッジ bb で別に出す（模試 m121s と同じ形）。

⚠️⚠️ questions_hisshu2.json は派生物——直接編集しないこと。
   解説は PDF に無いので書いていない（ユーザー判断）。入るのは2つの経路だけ:
   ① 借用: 同じ国試問題が既存の科目・過去問ビューアにあれば、その解説と正答率を生成時にコピー
      （判定は build_hisshu_json.same_question をそのまま使う）
   ② 手書き: _work/hisshu2_overrides.json に uid キーで書く（借用より優先）
"""
import argparse, io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hisshu_pdf as H                                        # noqa: E402
import hisshu2_pdf as H2                                      # noqa: E402
import build_hisshu_json as B                                 # noqa: E402

SID = 'hisshu2'
OUT = 'questions_hisshu2.json'
IMG_DIR = '必修講座Part2/images'
OVERRIDES = '_work/hisshu2_overrides.json'
FW, HW = B.FW, B.HW
BLOCK_TITLE = {'A': 'A問題', 'B': 'B問題', 'C': 'C問題'}

# 借用元から外す（Part1 の借用解説は「出典」ブロックを持つので二重になる）
B.NO_BORROW |= {'hisshu', SID}
B.IMG_DIR = IMG_DIR                                           # write_figs の出力先


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# ── 手で書き起こしたもの（ページを描画して目視で読んだ・2026-09-27） ──────
# 選択肢が表の問題。列見出しを各肢に埋め込む（試験モードの肢シャッフルで対応が崩れないように）。
# ⚠️ 選択肢は esc() で描かれるのでタグは使えない（上付きは Unicode）。
TABLE_CHOICES = {
    ('A', 54): ['Na⁺ 510／K⁺ 0／Cl⁻ 510／Lactate⁻ 0（mEq/L）／糖質 0％',
                'Na⁺ 154／K⁺ 0／Cl⁻ 154／Lactate⁻ 0（mEq/L）／糖質 0％',
                'Na⁺ 84／K⁺ 20／Cl⁻ 66／Lactate⁻ 20（mEq/L）／糖質 3.2％',
                'Na⁺ 35／K⁺ 20／Cl⁻ 35／Lactate⁻ 20（mEq/L）／糖質 4.3％',
                'Na⁺ 0／K⁺ 0／Cl⁻ 0／Lactate⁻ 0（mEq/L）／糖質 5％'],
    ('C', 17): ['6か月／脱水／5％ブドウ糖液／留置針（プラスチックカニューレ型）',
                '40歳／全身けいれん／生理食塩液／翼状針',
                '40歳／消化管出血／生理食塩液／留置針（プラスチックカニューレ型）',
                '40歳／熱中症／5％ブドウ糖液／翼状針',
                '80歳／心不全／乳酸リンゲル液／留置針（プラスチックカニューレ型）'],
    ('C', 21): ['Na⁺ 130／K⁺ 4／Cl⁻ 109（mEq/L）／ブドウ糖 0％',
                'Na⁺ 90／K⁺ 0／Cl⁻ 70（mEq/L）／ブドウ糖 2.6％',
                'Na⁺ 35／K⁺ 20／Cl⁻ 35（mEq/L）／ブドウ糖 4.3％',
                'Na⁺ 30／K⁺ 0／Cl⁻ 20（mEq/L）／ブドウ糖 4.3％',
                'Na⁺ 0／K⁺ 0／Cl⁻ 0（mEq/L）／ブドウ糖 5％'],
}
# 表の列の並びを設問文の末尾に注記する（C17 は列見出しが単位ではなく項目名）
TABLE_NOTE = {
    ('C', 17): '（選択肢は「患者の年齢／病態／輸液製剤／注射針の種類」の順）',
}

# 設問文の中の表で、行をそのまま表にできないもの（紙面を描画して目視で確かめた）。
# キー: 問題 (block, no) または連問のステム 'BS51'。値: (表の最初の行の先頭文字列, 表の最後の行の先頭文字列, 置き換える html)
TB = '<table class="tb">%s</table>'
TABLE_FIX = {
    # 2×2 表。行見出し「検査」と列見出し「疾患」が縦書き・横書きで組まれている
    ('B', 26): ('（単位：人）', '査',
                '（単位：人）' + TB % ('<tr><th></th><th>疾患 有</th><th>疾患 無</th></tr>'
                                   '<tr><th>検査 陽性</th><td>80</td><td>20</td></tr>'
                                   '<tr><th>検査 陰性</th><td>10</td><td>90</td></tr>')),
    # 表1 と表2 が左右に並んでいる
    'BS51': ('表1', '好中球', '表1　急性虫垂炎の診断スコア' + TB % (
        '<tr><th>項目</th><th>スコア</th></tr>'
        '<tr><td>腹痛部位の移動</td><td>1</td></tr><tr><td>食欲不振</td><td>1</td></tr>'
        '<tr><td>悪心、嘔吐</td><td>1</td></tr><tr><td>右下腹部の圧痛</td><td>2</td></tr>'
        '<tr><td>反跳痛</td><td>1</td></tr><tr><td>発熱（体温 ≧37.3℃）</td><td>1</td></tr>'
        '<tr><td>末梢血白血球数 ≧10,000</td><td>2</td></tr><tr><td>好中球 ≧75％</td><td>1</td></tr>')
        + '表2　診断スコア合計点別の尤度比' + TB % (
        '<tr><th>スコア合計</th><th>陽性尤度比</th></tr>'
        '<tr><td>0 ～4 点</td><td>1.0</td></tr><tr><td>5 ～6 点</td><td>1.6</td></tr>'
        '<tr><td>7 点以上</td><td>3.0</td></tr>')),
}


def fix_tables(lines, key):
    """設問文の行の中の表を <table> にした1行へ畳む。TABLE_FIX に無い表は、タブで区切られた
    連続する行をそのまま表にする（1行目が見出し）。返り値は paragraphs に渡せる行の並び。"""
    out, i = [], 0
    fx = TABLE_FIX.get(key)
    while i < len(lines):
        t = lines[i][2].strip()
        if fx and t.startswith(fx[0]):
            j = i
            while not lines[j][2].strip().startswith(fx[1]):
                j += 1
            out.append([lines[i][0], 62, fx[2], fx[2], 0, 'table'])
            i = j + 1
            continue
        if '\t' in lines[i][2] and not fx:
            j = i
            while j < len(lines) and '\t' in lines[j][2]:
                j += 1
            rows = [re.sub(r'</?u>', '', lines[k][3]).strip().split('\t') for k in range(i, j)]
            h = TB % ''.join('<tr>%s</tr>' % ''.join(
                ('<th>%s</th>' if n == 0 else '<td>%s</td>') % c.strip() for c in r)
                for n, r in enumerate(rows))
            out.append([lines[i][0], 62, h, h, 0, 'table'])
            i = j
            continue
        out.append(lines[i])
        i += 1
    return out


# 「示す」とあるが図ではないもの（seq）。検算で見つかったら、ページを見て確かめてから足す。
NO_FIG_OK = {1, 55, 86, 89, 93, 111, 112, 155}   # バイタル・表・WHO憲章の文・会話・動詞の「示す」

LABEL = re.compile(r'[A-EＡ-Ｅ]')


def permuted_source(cands, choices, ok):
    """選択肢の並びだけが違う同じ問題を探す。返り値 (src, perm)。perm[i] = 出典の i 番目の肢が
    この問題の何番目か。

    ⚠️ Part2 は MEC が選択肢の並びを入れ替えて組んでいる（同じ国試問題134問のうち並びが
       同じなのは17問）。紙面の並び（＝解答表の記号）は変えず、借りた解説の先頭に記号の
       対応表を置く。解説の中の記号は出典の並びのまま（書き換えると取りこぼしが出るので触らない）。
    判定: 肢の文言が1対1で対応し（1つだけ食い違いを許し、残りの1つ同士を対にする）、
          正解の肢がちょうど対応し合うこと。"""
    for c in cands:
        if len(c['choices']) != len(choices):
            continue
        perm, used = [None] * len(choices), set()
        for i, a in enumerate(c['choices']):
            for j, b in enumerate(choices):
                if j not in used and B._same_text(a, b):
                    perm[i] = j
                    used.add(j)
                    break
        miss = [i for i, v in enumerate(perm) if v is None]
        if len(miss) > 1:
            continue
        if miss:
            perm[miss[0]] = (set(range(len(choices))) - used).pop()
        if c['ok'] and {perm[i] for i in c['ok']} == set(ok):
            return c, perm
    return None, None


def perm_note(perm, choices):
    rows = ''.join('<tr><td>%s</td><td>%s</td></tr>' % (FW[i], choices[j]['t'])
                   for i, j in enumerate(perm))
    return dict(cls='ept', h='🔀 選択肢の並びが出典と違います',
                c='この解説は出典（同じ国試問題）の並びで書かれています。解説中の記号は下の対応で読み替えてください。'
                  '<table class="tb"><tr><th>出典の記号</th><th>この問題の選択肢</th></tr>%s</table>' % rows)


def _strip_labels():
    """図の下の A/B ラベルを行の読み取りから落とす（選択肢と同じ高さに並ぶと肢の末尾に付く）。"""
    orig = H.page_lines
    H.page_lines = lambda page: [l for l in orig(page) if not LABEL.fullmatch(l['text'].strip())]
    return orig


# ── 設問文 ──────────────────────────────────────────────────────
def paragraphs(lines):
    """Part1 の paragraphs と同じ規則。ただし「詰まった行」の判定に句点を足す。

    Part2 は図の左の狭い段に症例文が組まれることがあり（B56）、見出しの段落のぶら下げが
    右端（x≈537）まで届かない。行末が句点で終わっていなければ折り返しとみなす。"""
    paras = []
    prev_full, head_para = False, False
    for ln in lines:
        y0, x0, text, html, x1 = ln[:5]
        if len(ln) > 5:                                # fix_tables が組んだ表
            paras.append(html)
            head_para, prev_full = False, False
            continue
        t, h = B._clean(text), B._clean(html)
        if not t:
            continue
        m = B.HEADING.match(t) if x0 < 62 else None
        if m:
            paras.append(h.replace(m.group(0), '<b>%s</b>' % m.group(0), 1))
            head_para = True
        elif not paras:
            paras.append(h)
            head_para = False
        elif x0 >= 62 and not prev_full:
            paras.append(h)
            head_para = False
        else:
            # 英文の折り返し（"disease or" / "infirmity"）は語の間の空白が行末で落ちている
            sep = ' ' if re.search(r'[A-Za-z,]$', paras[-1]) and re.match(r'[A-Za-z]', t) else ''
            paras[-1] += sep + h
        prev_full = x1 > B.FULL_X1 or not t.endswith('。')
    return [p.replace('</u><u>', '').replace('</u> <u>', ' ') for p in paras]


# ── 図 ──────────────────────────────────────────────────────────
def figure_plan(doc, P, orig_page_lines):
    """seq → [dict(page, rect, name, mask)]。

    ・図の持ち主は「図より上にある直前の見出し（N. または連問の宣言文）」。見出しの無いページ
      （C52 の図は次の p.89 に単独で載る）では前のページの最後の見出しを引き継ぐ。
    ・連問の兄弟が持つ位置に置かれた図でも、その記号（A/B…）をステムが「（A）を示す」と
      宣言していればステムの図＝兄弟全員に配る（B55・C53 の心電図 A は設問 55/53 の横に
      組まれているが、宣言はステムにある）。
    ・並びは図の直下の A/B ラベル順。ファイル名は持ち主の国試番号＋連番で、衝突したら落とす。"""
    import fitz
    stems = P['series']
    by = {(p['block'], p['no']): p for p in P['problems']}
    stem_of = {(v['block'], n): k for k, v in stems.items() for n in v['nos']}

    def plain(lines):
        return ''.join(B._clean(l[2]) for l in lines)
    groups, last = {}, None
    for pn in H2.BODY_PAGES:
        page = doc[pn - 1]
        heads = sorted([(p['y'], (p['block'], p['no'])) for p in P['problems'] if p['page'] == pn] +
                       [(v['y'], k) for k, v in stems.items() if v['page'] == pn])
        infos = page.get_image_info()
        if infos:
            drs = page.get_drawings()
            boxes = [d['rect'] for d in drs if d['rect'].width > 440 and d['rect'].height > 30 and d['rect'].x0 < 70]
            labels = [l for l in orig_page_lines(page) if LABEL.fullmatch(l['text'].strip())]
            for info in infos:
                r = fitz.Rect(info['bbox'])
                if not any(bx.intersects(r) for bx in boxes):
                    continue
                owner = [h[1] for h in heads if h[0] < r.y0] or ([last] if last else [])
                if not owner:
                    die('p%d: 図の持ち主が決まらない %s' % (pn, r))
                who = owner[-1]
                lab = [l for l in labels if r.x0 - 10 <= l['x0'] <= r.x1 and 0 <= l['y0'] - r.y1 <= 25]
                letter = (lab[0]['text'].strip().translate(str.maketrans('ＡＢＣＤＥ', 'ABCDE'))
                          if lab else '')
                if not isinstance(who, str) and who in stem_of and letter and                         re.search(r'（[A-E，、]*%s[A-E，、]*）' % letter, plain(stems[stem_of[who]]['stem'])):
                    who = stem_of[who]
                if isinstance(who, str):               # 連問のステムの図
                    S = stems[who]
                    keys = tuple((S['block'], n) for n in S['nos'])
                else:
                    keys = (who,)
                groups.setdefault(keys, []).append(((letter, round(r.y0 / 20), r.x0), pn, r))
        if heads:
            last = heads[-1][1]
    plan, seen, count = {}, set(), {}
    for keys, figs in sorted(groups.items(), key=lambda kv: (-len(kv[0]), kv[0])):
        figs.sort(key=lambda t: t[0])
        kid = by[keys[0]]['kid']
        items = []
        for _, pn, r in figs:
            count[kid] = count.get(kid, 0) + 1
            name = '%s_%d.jpeg' % (kid, count[kid])
            if name in seen:
                die('図のファイル名が衝突 %s' % name)
            seen.add(name)
            items.append(dict(page=pn, rect=r, mask=[], name=name))
        for k in keys:
            plan.setdefault(by[k]['seq'], []).extend(items)
    for v in plan.values():                            # ステムの図 → 自分の図 の順（紙面の A→B）
        v.sort(key=lambda f: f['name'])
    return plan


# ── 本体 ────────────────────────────────────────────────────────
def build():
    import fitz
    A = json.load(io.open(H2.ANSTABLE, encoding='utf-8'))
    P = json.load(io.open(H2.PARSED, encoding='utf-8'))
    at = {(r['block'], r['no']): r for r in A['rows']}
    by = {(p['block'], p['no']): p for p in P['problems']}
    seq_of = {k: r['seq'] for k, r in at.items()}
    doc = fitz.open(H2.PDF)
    orig = _strip_labels()
    plan = figure_plan(doc, P, orig)
    sources = B.load_sources()
    report = dict(borrowed=[], rejected=[], none=[], permuted=[])

    chapters = []
    for ci, blk in enumerate('ABC'):
        qs = []
        for r in [r for r in A['rows'] if r['block'] == blk]:
            key = (blk, r['no'])
            p, seq = by[key], r['seq']
            uid = '%s_ch%02d_q%d' % (SID, ci + 1, seq)
            lines = p['qt']
            if key in TABLE_CHOICES:                   # 問いの文より後ろは選択肢の表（見出し・複数行のセル）
                last = max(i for i, l in enumerate(lines) if l[2].rstrip().endswith('か。'))
                lines = lines[:last + 1]
            lines = fix_tables(lines, key)
            own = B.strongify(paragraphs(lines))
            if key in TABLE_NOTE:
                own[-1] += TABLE_NOTE[key]
            if p['series']:
                S = P['series'][p['series']]
                nos = [seq_of[(S['block'], n)] for n in S['nos']]
                qt = ('<span class="kw">%s</span><br/>' % B.series_decl(nos)
                      + '<br/>'.join(paragraphs(fix_tables(S['stem'], p['series'])) + own))
            else:
                qt = '<br/>'.join(own)
            bodies = TABLE_CHOICES.get(key) or [B.norm_choice(c[1]) for c in p['choices']]
            letters = [FW[i] for i in range(len(bodies))]
            ans = r['ans'].split(',')
            ok_idx = [HW.index(a) for a in ans]
            if r['either']:
                ok_idx = ok_idx[:1]
            choices = [dict(t='%s　%s' % (letters[i], b), ok=i in ok_idx) for i, b in enumerate(bodies)]
            ans_label = '／'.join(choices[i]['t'] for i in ok_idx)
            if r['either']:
                alt = [HW.index(a) for a in ans][1:]
                ans_label += '（%s も正解として採点）' % '・'.join(choices[i]['t'] for i in alt)
            badges = [dict(cls='bb', t='%s %d' % (BLOCK_TITLE[blk], r['no'])),
                      dict(cls='bip', t='一般') if r['ippan'] else dict(cls='brn', t='臨床')]
            imgs = ['%s/%s' % (IMG_DIR, f['name']) for f in plan.get(seq, [])]
            if imgs:
                badges.append(dict(cls='bi', t='📷 画像'))
            if r['excluded']:
                badges.append(dict(cls='bx', t='採点除外'))
            theme = r['theme'] + ('（%s）' % r['disease'] if r['disease'] else '')
            q = dict(uid=uid, qn='Q.%d' % seq, episode='(%s)' % r['kid'],
                     rate=-1, rate_cls='', rate_text='', badges=badges, qt=qt,
                     choices=choices, ans_label=ans_label,
                     ans_sub='出題テーマ：' + theme, eg=[], imgs=imgs)
            if r['note'] and not r['either']:
                q['ans_sub'] += '<br/>' + r['note']
            src, rej = B.pick_source(sources.get(B.kid_key(r['kid']), []),
                                     [c['t'] for c in choices], [HW.index(a) for a in ans],
                                     table=key in TABLE_CHOICES)
            perm = None
            if not src:
                src, perm = permuted_source(sources.get(B.kid_key(r['kid']), []),
                                            [c['t'] for c in choices], [HW.index(a) for a in ans])
                if src:
                    rej = [c for c in rej if c is not src]
                    report['permuted'].append(seq)
            for c in rej:
                report['rejected'].append((seq, r['kid'], c['uid']))
            if src:
                q['rate'], q['rate_cls'], q['rate_text'] = B.rate_fields(src['rate'])
                # ⚠️ 並びが違う問題では出典の要約（ans_sub）も出典の記号で書かれていて、対応表より
                #    上に出るので読み違える。出題テーマのままにして、下の解説の並びだけ断る。
                if perm:
                    q['ans_sub'] += '<br/>（下の解説は出典の選択肢の並びで書かれています。記号は対応表で読み替えてください）'
                elif src['kind'] == 'subject' and src['ans_sub']:
                    q['ans_sub'] = src['ans_sub']
                where = ('<b>%s %s</b>' % (src['name'], src['qn']) if src['kind'] == 'subject'
                         else '<b>%s %s番</b>' % (src['name'], src['qn']))
                q['eg'] = ([perm_note(perm, choices)] if perm else []) + list(src['eg']) + [dict(
                    cls='ept', h='📎 解説の出典',
                    c='この問題（%s）は %s と同じ国試問題なので、その解説を借りて載せています。'
                      '<br/>出題テーマ：%s' % (r['kid'], where, theme))]
                report['borrowed'].append((seq, r['kid'], src['uid']))
            else:
                report['none'].append((seq, r['kid']))
            qs.append(q)
        chapters.append(dict(title=BLOCK_TITLE[blk], qs=qs))
    return chapters, report, plan, doc


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--figs', action='store_true', help='設問の図を 必修講座Part2/images/ へ書き出す')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--report', action='store_true', help='借用の内訳を出す')
    a = ap.parse_args()
    chapters, report, plan, doc = build()
    if a.figs:
        B.write_figs(doc, plan)
    tot = sum(len(c['qs']) for c in chapters)
    for c in chapters:
        qs = c['qs']
        print('  %-8s %3d問（借用%3d・画像%2d）' % (
            c['title'], len(qs), sum(1 for q in qs if q['eg']), sum(1 for q in qs if q['imgs'])))
    n = apply_overrides(chapters)
    print('借用 %d問（うち選択肢の並び違い %d問）・解説なし %d問・手書きの上書き %d問'
          % (len(report['borrowed']), len(report['permuted']), len(report['none']), n))
    if a.report:
        for seq, kid, uid in report['rejected']:
            print('  借用しなかった候補 Q.%d %s ← %s' % (seq, kid, uid))
        print('  解説なし:', ' '.join('Q.%d(%s)' % t for t in report['none']))
    B.NO_FIG_OK = {str(s) for s in NO_FIG_OK}
    B.verify(chapters)
    js = json.dumps(dict(sid=SID, chapters=chapters), ensure_ascii=False, indent=2)
    if a.check:
        cur = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        print('現物と一致' if cur == js else '*** 現物と差分あり')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し %s  %dKB  %d問' % (OUT, os.path.getsize(OUT) // 1024, tot))


if __name__ == '__main__':
    main()
