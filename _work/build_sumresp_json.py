# -*- coding: utf-8 -*-
"""サマライズ呼吸器（sumresp）の questions_sumresp.json を PDF から作る。

  python _work/sumresp_pdf.py parse            # 2冊の問題 → _work/sumresp_parsed.json
  python _work/build_sumresp_json.py --figs    # 設問の図を サマライズ呼吸器/images/ へ（図を変えたときだけ）
  python _work/build_sumresp_json.py           # questions_sumresp.json を書き出す
  python _work/build_sumresp_json.py --check   # 現物と一致するかだけ見る

章＝サマライズの8章（Q.1〜39＝紙面の NO. と同じ）＋ Lesson 呼吸器（Q.40〜58・紙面の「問題N」はバッジ bb）。

⚠️⚠️ questions_sumresp.json は派生物——直接編集しないこと。
   解説は _work/sumresp_notes.json（手書き）から入れる。方針はユーザー指定（2026-09-29）:
   「解説はなるべくテキストの内容を引用して、最低限でいい」
     ・✅の下（ans_sub）＝出題テーマ＋1行の理由
     ・📖 ブロック＝サマライズ本文（基礎の確認・ひっかけ選択肢・出題者の意図・Dr. のアドバイス等）
       または Lesson の参考資料1〜27 の文言をそのまま引用
"""
import argparse, io, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_hisshu_json as B                                  # noqa: E402
import sumresp_pdf as S                                        # noqa: E402

SID = 'sumresp'
OUT = 'questions_sumresp.json'
IMG_DIR = 'サマライズ呼吸器/images'
NOTES = '_work/sumresp_notes.json'
FW, HW = B.FW, B.HW

# ── 章（サマライズの目次）──────────────────────────────────────
CHAPTERS = [
    ('気管支喘息', range(1, 5)),
    ('肺気腫', range(5, 9)),
    ('過敏性肺炎（夏型過敏性肺炎）', range(9, 12)),
    ('じん肺', range(12, 16)),
    ('肺塞栓症', range(16, 19)),
    ('縦隔腫瘍', range(19, 23)),
    ('アレルギー性気管支肺アスペルギルス症', range(23, 26)),
    ('近年の国試で他に押さえておくべきもの', range(26, 40)),
]
LESSON_TITLE = 'Lesson 呼吸器'

# ── 解答表（紙面を見て書き写した・2026-09-29）────────────────────
# サマライズ巻末 p.54「解答」: NO. → (解答, 出題テーマ, 疾患名, 区分, 全国正答率)。区分 h=必修 i=一般 r=臨床
SUM_ANS = {
    1: ('e', '気管支喘息患者で日内変動を認める指標', '気管支喘息', 'i', 81),
    2: ('a', '気管支喘息の診断に有用な検査', '気管支喘息', 'r', 75),
    3: ('de', '咳喘息疑い患者に対する検査', '咳喘息', 'r', 64),
    4: ('d', '吸入薬の効果が不十分な気管支喘息患者への対応', '気管支喘息', 'r', None),
    5: ('c', 'COPD の急性増悪に対する初期治療', '慢性閉塞性肺疾患', 'r', 77),
    6: ('b', 'COPD の急性増悪への対応', '慢性閉塞性肺疾患', 'r', 71),
    7: ('e', 'CO₂ ナルコーシスの治療', '慢性閉塞性肺疾患、CO₂ ナルコーシス', 'r', 53),
    8: ('ab', '慢性閉塞性肺疾患について', '慢性閉塞性肺疾患', 'i', None),
    9: ('abc', '過敏性肺炎の特徴', '過敏性肺炎', 'i', None),
    10: ('c', '夏型過敏性肺炎について', '過敏性肺炎', 'r', 92),
    11: ('b', '農夫肺の原因抗原物質', '過敏性肺炎', 'i', None),
    12: ('c', '石綿のばく露に起因する可能性が低いもの', '間質性肺炎、胸膜中皮腫、肺癌', 'i', 93),
    13: ('ac', '悪性胸膜中皮腫の組織型を決定するための検査', '悪性胸膜中皮腫', 'r', 79),
    14: ('d', '石綿肺患者への説明', '石綿肺', 'r', None),
    15: ('e', '胸膜中皮腫の診断に有用なもの', '胸膜中皮腫', 'i', None),
    16: ('c', '深部静脈血栓症のリスクファクターについて', '深部静脈血栓症', 'i', 90),
    17: ('cd', '急性肺血栓塞栓症の確定診断のために必要な検査', '肺血栓塞栓症', 'r', 92),
    18: ('e', '肺血栓塞栓症の治療', '肺血栓塞栓症', 'r', 84),
    19: ('ab', '縦隔疾患の発生部位', '奇形腫、胸腺腫', 'i', 96),
    20: ('ae', '前縦隔腫瘍の鑑別', '縦隔腫瘍、胸腺腫、悪性リンパ腫', 'r', 82),
    21: ('e', '神経原性腫瘍の診断', '神経原性腫瘍', 'r', 76),
    22: ('abcde', '縦隔腫瘍について', '胸腺腫、心膜囊胞、奇形腫、縦隔腫瘍', 'i', None),
    23: ('e', '呼吸器疾患と治療薬の組合せ', 'アレルギー性気管支肺アスペルギルス症', 'i', 85),
    24: ('ad', 'アレルギー性気管支肺アスペルギルス症患者への対応', 'アレルギー性気管支肺アスペルギルス症', 'r', None),
    25: ('b', '肺アスペルギルス症の診断', '肺アスペルギルス症', 'r', None),
    26: ('b', '肺腺癌のCT 所見', '肺癌、肺腺癌', 'i', 59),
    27: ('a', '肺腺癌の治療法', '肺癌、肺腺癌', 'r', 89),
    28: ('e', 'EGFR チロシンキナーゼ阻害薬の有害事象', '肺癌、肺腺癌', 'i', 66),
    29: ('e', '転移を伴わない肺腺癌の治療', '肺癌、肺腺癌', 'r', 86),
    30: ('b', '進展型の肺小細胞癌への対応', '肺癌、肺小細胞癌', 'r', 57),
    31: ('d', '結核が疑われる患者への対応', '結核', 'r', 64),
    32: ('c', '血痰の原因を検索するために行うこと', '', 'h', 94),
    33: ('e', '病理組織上肉芽腫をみとめるもの', '過敏性肺炎、サルコイドーシス、非結核性抗酸菌症', 'i', None),
    34: ('d', '非結核性抗酸菌症の治療方針', '非結核性抗酸菌症', 'r', None),
    35: ('a', '市中肺炎患者への対応', '市中肺炎、肺炎球菌性肺炎', 'r', 47),
    36: ('e', 'quick SOFA における評価項目', '敗血症', 'h', 86),
    37: ('e', '医療・介護関連肺炎の定義', '医療・介護関連肺炎', 'i', None),
    38: ('d', '肺胞の虚脱を防ぐために有効な指標', '新生児呼吸窮迫症候群', 'r', 92),
    39: ('b', '終夜睡眠ポリグラフ検査で観察されるもの', '', 'i', None),
}
SUM_KINKI = {4: 'e'}                   # 解答表の「（禁：e）」

# 参考資料・問題リスト p.6「使用問題リスト」: 問題N → (授業内解答, テーマ)
LES_ANS = {
    1: ('a', '聴診所見と呼吸器疾患の組合せ'),
    2: ('acd', '乾性咳嗽をきたす疾患'),
    3: ('c', '肺血栓塞栓症の診断確定のための検査'),
    4: ('abe', 'COPD の急性増悪への対応'),
    5: ('bcd', '夏型過敏性肺炎で見られる所見'),
    6: ('c', '急性呼吸窮迫症候群の病態'),
    7: ('bd', '気管支喘息発作に対して直ちに行うべき治療'),
    8: ('a', '肺腺癌の治療方針決定のために行うべき検査'),
    9: ('abd', '誤嚥性肺炎のリスク因子'),
    10: ('b', 'CO₂ナルコーシスの患者に対してまず行うべきもの'),
    11: ('b', 'ポリソムノグラフィに含まれないもの'),
    12: ('e', '我が国の対策型がん検診で行われる乳がんの検査方法'),
    13: ('abf', '胸膜中皮腫について正しいもの'),
    14: ('ac', '労作時呼吸困難の高齢患者で認める所見'),
    15: ('b', '肺癌のCT から合併症推測する問題'),
    16: ('a', '労作時息切れをきたした患者の鑑別疾患'),
    17: ('b', '再膨張性肺水腫に対する有効な呼吸管理'),
    18: ('cde', '慢性副鼻腔炎と合併する可能性が高いもの'),
    19: ('b', '縦隔腫瘍の好発部位'),
}
# Lesson 問題15 は選択肢が CT 画像 a〜e（本文の選択肢は無い）
LES_IMAGE_CHOICES = {15: ['画像 a', '画像 b', '画像 c', '画像 d', '画像 e']}

# ── 図（紙面を描画して目視で持ち主と並びを確かめた・2026-09-29）──────
# (冊子, 問題番号) → [(ページ, 画像の左上 x, y)]。並びは紙面のラベル A→B→C（Lesson 15 は a→e）。
# 参考画像（解説の中の図）は入れない。
FIGS = {
    ('sum', 6): [(14, 95, 289), (14, 311, 296)],
    ('sum', 10): [(18, 339, 370)],
    ('sum', 13): [(22, 339, 365), (22, 123, 582), (22, 339, 594)],
    ('sum', 14): [(23, 90, 343), (23, 307, 363)],
    ('sum', 20): [(30, 95, 446), (30, 311, 500)],
    ('sum', 21): [(31, 339, 142)],
    ('sum', 24): [(34, 116, 384), (34, 280, 402)],
    ('sum', 25): [(35, 339, 187)],
    ('sum', 26): [(37, 349, 107)],
    ('sum', 27): [(38, 90, 320), (38, 307, 391)],
    ('sum', 29): [(43, 154, 342), (43, 339, 242), (43, 339, 425)],
    ('sum', 30): [(44, 109, 314), (44, 297, 367)],
    ('sum', 34): [(47, 339, 229)],
    ('sum', 35): [(50, 339, 189)],
    ('sum', 38): [(51, 282, 223)],
    ('lesson', 8): [(4, 291, 487)],
    ('lesson', 10): [(6, 342, 217)],
    ('lesson', 14): [(8, 326, 154)],
    ('lesson', 15): [(8, 56, 427), (8, 220, 427), (8, 412, 429), (8, 57, 533), (8, 220, 539)],
    ('lesson', 17): [(9, 316, 493)],
}
# 「示す」とあるが図ではないもの（表示番号）
NO_FIG_OK = set()

HEADING = re.compile(r'^([^\s：「」。、]{1,6}(?:[　 ][^\s：「」。、]{1,3})?)：')


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


def paragraphs(lines, indent):
    """PDF の行 → 段落。行頭の「現病歴：」等の見出し＝新しい段落（見出しは <b>）。
    ・sum: 字下げ（x≥62）で段落が始まる。ただし見出しの段落は続きの行もぶら下げで字下げされる
      ので、直前の行が右端まで詰まっていれば折り返しとみなす（必修講座と同じ規則）。
    ・lesson: 字下げが無い。直前の行が右端まで届かずに「。」で終わっていれば新しい段落。
    ・どちらも、問いの文（…どれか。／…選べ。）は直前の行が「。」で終わっていれば新しい段落
      （Lesson 問題3 の「…圧排像を認める。」は右端近くまで届いている）。
    ⚠️ 折り返しは繋ぐ（字は変えない）。"""
    paras, prev_end, prev_full, prev_t, head_para = [], False, False, '', False
    for y0, x0, text, html, x1 in lines:
        t, h = B._clean(text), B._clean(html)
        if not t or re.fullmatch(r'[Ａ-ＥA-Ea-e](?:\s*[Ａ-ＥA-Ea-e])*', t):
            continue
        m = HEADING.match(t)
        ask = re.search(r'(?:か|選べ)。$', t) and prev_t.endswith('。')
        if m and x0 < 62:
            paras.append(h.replace(m.group(0), '<b>%s</b>' % m.group(0), 1))
            head_para = True
        elif not paras or ask or (indent and x0 >= 62 and not (head_para and prev_full))                 or (not indent and prev_end):
            paras.append(h)
            head_para = False
        else:
            sep = ' ' if re.search(r'[A-Za-z,]$', paras[-1]) and re.match(r'[A-Za-z0-9]', t) else ''   # 「Cl／97mEq/L」
            paras[-1] += sep + h
        prev_full = x1 > B.FULL_X1
        prev_end = x1 < 500 and t.endswith('。')
        prev_t = t
    return paras


def norm_choice(body):
    b = B.norm_choice(body)
    return re.sub(r'\s+', ' ', b).strip()


def quote_block(note):
    if not note['q']:
        return []
    parts = ['<span class="kw2">%s</span><br/>%s' % (h, c) for h, c in note['q']]
    src = note.get('src') or ('Lesson 参考資料' if note['q'][0][0].startswith('参考資料') else 'サマライズ')
    return [dict(cls='ep', h='📖 テキストより（%s）' % src, c='<br/><br/>'.join(parts))]


def fig_plan(docs):
    """(src, no) → [dict(page, rect, name)]"""
    import fitz
    plan = {}
    for (src, no), spec in FIGS.items():
        doc = docs[src]
        items = []
        for i, (pn, x, y) in enumerate(spec, 1):
            hits = [fitz.Rect(inf['bbox']) for inf in doc[pn - 1].get_image_info()
                    if abs(inf['bbox'][0] - x) < 2 and abs(inf['bbox'][1] - y) < 2]
            if len(hits) != 1:
                die('%s%d: p%d (%d,%d) の画像が %d 個' % (src, no, pn, x, y, len(hits)))
            items.append(dict(page=pn, rect=hits[0], mask=[], name='%s%02d_%d.jpeg' % (src[0], no, i)))
        plan[(src, no)] = items
    return plan


def write_figs(docs, plan):
    B.IMG_DIR = IMG_DIR
    for src in ('sum', 'lesson'):
        B.write_figs(docs[src], {k: v for k, v in plan.items() if k[0] == src})


def make_q(uid, seq, p, ans, badges, episode, theme, why, note, imgs, rate, bodies=None):
    lines = p['qt']
    paras = B.strongify(paragraphs(lines, p['src'] == 'sum'))
    bodies = bodies or [norm_choice(c[1]) for c in p['choices']]
    ok_idx = ['abcdefghi'.index(a) for a in ans]
    choices = [dict(t='%s　%s' % (FW[i], b), ok=i in ok_idx) for i, b in enumerate(bodies)]
    if imgs:
        badges = badges + [dict(cls='bi', t='📷 画像')]
    rate_f = B.rate_fields(rate) if rate is not None else (-1, '', '')
    return dict(uid=uid, qn='Q.%d' % seq, episode='(%s)' % episode,
                rate=rate_f[0], rate_cls=rate_f[1], rate_text=rate_f[2], badges=badges,
                qt='<br/>'.join(paras), choices=choices,
                ans_label='／'.join(choices[i]['t'] for i in ok_idx),
                ans_sub='出題テーマ：%s<br/>%s' % (theme, why),
                eg=quote_block(note), imgs=imgs)


def build():
    import fitz
    P = json.load(io.open(S.PARSED, encoding='utf-8'))
    notes = json.load(io.open(NOTES, encoding='utf-8'))
    docs = {k: fitz.open(S.PDFS[k]) for k in ('sum', 'lesson')}
    plan = fig_plan(docs)

    def imgs_of(src, no):
        return ['%s/%s' % (IMG_DIR, f['name']) for f in plan.get((src, no), [])]
    by_sum = {p['no']: p for p in P['sum']}
    chapters = []
    for ci, (title, nos) in enumerate(CHAPTERS, 1):
        qs = []
        for no in nos:
            p = by_sum[no]
            ans, theme, dis, kind, rate = SUM_ANS[no]
            badges = [dict(cls={'h': 'bh', 'i': 'bip', 'r': 'brn'}[kind],
                           t={'h': '必修', 'i': '一般', 'r': '臨床'}[kind])]
            n = notes['s%d' % no]
            why = n['why']
            if no in SUM_KINKI:
                why += '<br/><span class="kw4">禁忌肢：%s</span>' % FW['abcdefghi'.index(SUM_KINKI[no])]
            q = make_q('%s_ch%02d_q%d' % (SID, ci, no), no, p, ans, badges, p['kid'],
                       theme + ('（%s）' % dis if dis else ''), why, n, imgs_of('sum', no), rate)
            qs.append(q)
        chapters.append(dict(title=title, qs=qs))
    qs = []
    base = len(P['sum'])
    for p in P['lesson']:
        no = p['no']
        seq = base + no
        ans, theme = LES_ANS[no]
        clinical = bool(re.match(r'\d+\s*歳', B._clean(p['qt'][0][2])))
        badges = [dict(cls='bb', t='Lesson 問題%d' % no),
                  dict(cls='brn', t='臨床') if clinical else dict(cls='bip', t='一般')]
        bodies = LES_IMAGE_CHOICES.get(no)
        if not bodies:
            bodies = [norm_choice(c[1]) for c in p['choices']]
        q = make_q('%s_ch%02d_q%d' % (SID, len(CHAPTERS) + 1, seq), seq, p, ans, badges, p['kid'],
                   theme, notes['l%d' % no]['why'], notes['l%d' % no], imgs_of('lesson', no), None, bodies)
        qs.append(q)
    chapters.append(dict(title=LESSON_TITLE, qs=qs))
    return chapters, plan, docs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--figs', action='store_true', help='設問の図を サマライズ呼吸器/images/ へ書き出す')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    chapters, plan, docs = build()
    if a.figs:
        write_figs(docs, plan)
    for c in chapters:
        print('  %-24s %3d問（画像%2d）' % (c['title'], len(c['qs']), sum(1 for q in c['qs'] if q['imgs'])))
    B.NO_FIG_OK = {str(s) for s in NO_FIG_OK}
    B.verify(chapters)
    js = json.dumps(dict(sid=SID, chapters=chapters), ensure_ascii=False, indent=2)
    if a.check:
        cur = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        print('現物と一致' if cur == js else '*** 現物と差分あり')
        sys.exit(0 if cur == js else 1)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('書き出し %s  %dKB  %d問' % (OUT, os.path.getsize(OUT) // 1024, sum(len(c['qs']) for c in chapters)))


if __name__ == '__main__':
    main()
