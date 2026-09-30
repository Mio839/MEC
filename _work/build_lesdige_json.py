# -*- coding: utf-8 -*-
"""Lesson消化管（lesdige）の questions_lesdige.json を PDF から作る。

  python _work/build_lesdige_json.py --figs    # 設問の図を Lesson消化管/images/ へ（図を変えたときだけ）
  python _work/build_lesdige_json.py           # questions_lesdige.json を書き出す
  python _work/build_lesdige_json.py --check   # 現物と一致するかだけ見る

PDF は2冊（MEC問題文pdf/）:
  2026Lesson消化管.pdf                        9p・問題1〜20（問題9は ①② の2問）
  2026Lesson消化管　参考資料・問題リスト.pdf   5p・参考資料1〜22と解答（p.5）。生成器は読まない（解説の引用元）

1章21問（Q.1〜21）。紙面の「問題N」はバッジ bb。組版は Lesson 呼吸器と同じ＝行の読み取りは
sumresp_pdf.parse_lesson をそのまま使う。

⚠️⚠️ questions_lesdige.json は派生物——直接編集しないこと。解説は2つの経路で入る（2026-09-30 ユーザー指定）:
   ① 引用: _work/lesdige_notes.json（手書き）。✅の下＝出題テーマ＋1行の理由、📖 ブロック＝
      Lesson 本文の ▷ の行と参考資料の文言そのまま。
   ② 借用: 同じ国試番号の消化器（dige）の解説を全問ぶん載せる。MEC が「改変」した問題は選択肢・正解が
      原題と違うので、借りた解説の前に「原題の解説です」という注記と原題の選択肢・正解を置き、
      全国正答率は載せない（改変なしの問題だけ原題の正答率を出す）。
"""
import argparse, io, json, os, re, sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_hisshu_json as B                                  # noqa: E402
import build_sumresp_json as R                                 # noqa: E402
import sumresp_pdf as S                                        # noqa: E402

SID = 'lesdige'
OUT = 'questions_lesdige.json'
IMG_DIR = 'Lesson消化管/images'
NOTES = '_work/lesdige_notes.json'
PDF = 'MEC問題文pdf/2026Lesson消化管.pdf'
TITLE = 'Lesson 消化管'
FW = B.FW

# ── 使用問題リスト（参考資料・問題リスト.pdf p.5 を書き写した・2026-09-30）──────────
# キー → (国試番号, 改変あり, 授業内解答, テーマ)。問題9は ①=9a・②=9b。
# ⚠️ 問題19 は本文が「110A-19 改変」だが、問題リストは「109A-18」。選択肢（拡張術・結紮術・硬化療法）と
#    内視鏡像の問いは dige の 109A-18 と同じ＝本文の誤植。問題リストに合わせた。
ANS = {
    '1': ('113A-7', True, 'c', '胃体部進行癌が浸潤しにくいもの'),
    '2': ('115D-53', True, 'ac', '胃食道逆流症について'),
    '3': ('113F-65', True, 'bc', '胃癌の治療方針決定に有用な検査'),
    '4': ('111G-57', True, 'ad', '偽膜性腸炎の治療薬'),
    '5': ('113C-42', True, 'e', '便潜血陽性患者への対応'),
    '6': ('114A-59', False, 'a', '嵌頓した鼠径ヘルニアの治療'),
    '7': ('110A-18', False, 'bd', '高齢女性の占める割合が高いヘルニア'),
    '8': ('オリジナル', False, 'e', '胃食道逆流症のリスク因子'),
    '9a': ('110D-21', False, 'e', '機能性ディスペプシアの診断'),
    '9b': ('118D-24', True, 'ace', '機能性ディスペプシアの治療'),
    '10': ('116D-20', True, 'e', '大腸憩室炎の診断'),
    '11': ('111G-18', False, 'a', '食道狭窄に対して内視鏡的ステント留置の適応となるもの'),
    '12': ('115D-49', True, 'e', '潰瘍性大腸炎の特徴'),
    '13': ('108A-16', True, 'e', 'Crohn 病に特徴的ではないもの'),
    '14': ('オリジナル', False, 'c', '上部消化管穿孔に関する対応'),
    '15': ('106G-36', True, 'ade', '胃酸分泌を亢進させるもの'),
    '16': ('113A-16', False, 'd', 'S 状結腸癌の多発肝転移の治療'),
    '17': ('112A-5', True, 'b', 'Mallory-Weiss 症候群について'),
    '18': ('110A-19', True, 'ade', 'Helicobacter pylori 除菌治療の適応疾患'),
    '19': ('109A-18', True, 'bc', '胃食道静脈瘤の治療'),
    '20': ('112F-52', False, 'c', '上行結腸癌の周術期管理'),
}
ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9a', '9b'] + [str(i) for i in range(10, 21)]

# ── 図（紙面を描画して目視で持ち主を確かめた・2026-09-30）──────────────────
# 問題 → (ページ, 画像の左上 x, y)。p.1 の (305,394) は参考資料1への手書きの胃のイラスト＝設問の図ではない。
FIGS = {'2': (1, 382, 560), '6': (3, 338, 542), '10': (5, 351, 182), '12': (6, 350, 407), '16': (7, 335, 566)}
# ⚠️ 問題19 は「上部消化管内視鏡像を示す」とあるのに紙面に図が無い＝原題 109A-18 の図を dige から借りる
BORROW_FIG = {'19': '消化器/images/109A-18_1.jpeg'}

# 本文の CJK 部首補助の残り（sumresp_pdf.RADICAL_SUP に無いもの）
EXTRA_RADICAL = str.maketrans('⺟', '母')


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


def parse():
    """PDF → キー（'1'〜'20'・'9a'/'9b'）ごとの dict(qt, choices, page)。"""
    probs = S.parse_lesson(fitz.open(PDF))
    fix = lambda s: s.translate(EXTRA_RADICAL) if isinstance(s, str) else s
    for p in probs:
        p['qt'] = [[fix(v) for v in l] for l in p['qt']]
        p['choices'] = [[a, fix(b)] for a, b in p['choices']]
    if [p['no'] for p in probs] != list(range(1, 21)):
        die('問題番号: %s' % [p['no'] for p in probs])
    out = {}
    for p in probs:
        k = str(p['no'])
        if k == '9':
            # ①の問いは qt の最後の行、②の問いは選択肢の後ろに残った行（tails）。選択肢は5つずつ
            stem = [l for l in p['qt'] if not l[2].startswith('①')]
            q1 = [l for l in p['qt'] if l[2].startswith('①')]
            if len(q1) != 1 or len(p.get('tails', [])) != 1 or len(p['choices']) != 10:
                die('問題9 の①②の切り分けが崩れた')
            q2 = [[q1[0][0], q1[0][1], p['tails'][0], p['tails'][0], q1[0][4]]]
            out['9a'] = dict(qt=stem + q1, choices=p['choices'][:5], page=p['page'])
            out['9b'] = dict(qt=stem + q2, choices=p['choices'][5:], page=p['page'])
            continue
        if p.get('tails'):
            die('問題%s: 選択肢の後ろに残った行 %s' % (k, p['tails']))
        letters = ''.join(c[0] for c in p['choices'])
        if letters != FW[:5]:
            die('問題%s: 選択肢の並び %s' % (k, letters))
        out[k] = dict(qt=p['qt'], choices=p['choices'], page=p['page'])
    for k, v in out.items():
        blob = json.dumps(v, ensure_ascii=False)
        left = sorted({c for c in blob if '⺀' <= c <= '⿟'})
        if left:
            die('問題%s: 部首の字が残っている %s' % (k, ''.join(left)))
    return out


def fig_plan(doc):
    plan = {}
    for k, (pn, x, y) in FIGS.items():
        hits = [fitz.Rect(inf['bbox']) for inf in doc[pn - 1].get_image_info()
                if abs(inf['bbox'][0] - x) < 2 and abs(inf['bbox'][1] - y) < 2]
        if len(hits) != 1:
            die('問題%s: p%d (%d,%d) の画像が %d 個' % (k, pn, x, y, len(hits)))
        plan[k] = [dict(page=pn, rect=hits[0], mask=[], name='l%02d_1.jpeg' % int(k))]
    return plan


def dige_source(kid):
    """国試番号 → dige の同じ問題（無ければ die）。"""
    d = json.load(io.open('questions_dige.json', encoding='utf-8'))
    key = B.kid_key(kid)
    hits = [q for ch in d['chapters'] for q in ch['qs'] if B.kid_key(q.get('episode', '')) == key]
    if len(hits) != 1:
        die('%s: dige に %d 問' % (kid, len(hits)))
    return hits[0]


def quote_block(note):
    if not note['q']:
        return []
    parts = ['<span class="kw2">%s</span><br/>%s' % (h, c) for h, c in note['q']]
    return [dict(cls='ep', h='📖 テキストより（Lesson 消化管）', c='<br/><br/>'.join(parts))]


def build():
    P = parse()
    notes = json.load(io.open(NOTES, encoding='utf-8'))
    doc = fitz.open(PDF)
    plan = fig_plan(doc)
    qs = []
    for seq, k in enumerate(ORDER, 1):
        p = P[k]
        kid, modified, ans, theme = ANS[k]
        n = notes[k]
        paper = '問題%s' % {'9a': '9①', '9b': '9②'}.get(k, k)
        clinical = bool(re.match(r'\d+\s*歳', B._clean(p['qt'][0][2])))
        badges = [dict(cls='bb', t='Lesson ' + paper),
                  dict(cls='brn', t='臨床') if clinical else dict(cls='bip', t='一般')]
        imgs = ['%s/%s' % (IMG_DIR, f['name']) for f in plan.get(k, [])] + (
            [BORROW_FIG[k]] if k in BORROW_FIG else [])
        episode = kid + (' 改変' if modified else '')
        q = R.make_q('%s_ch01_q%d' % (SID, seq), seq, dict(p, src='lesson'), ans, badges, episode,
                     theme, n['why'], n, [], None)
        q['eg'] = quote_block(n)
        if imgs:
            q['imgs'] = imgs
            q['badges'].append(dict(cls='bi', t='📷 画像'))
        if kid != 'オリジナル':
            src = dige_source(kid)
            ok_src = [i for i, c in enumerate(src['choices']) if c['ok']]
            ok_now = ['abcde'.index(a) for a in ans]
            if not modified:
                # 改変なし＝同じ問題のはず。選択肢と正解の一致を確かめてから正答率も借りる
                if not B.same_question(dict(choices=[c['t'] for c in src['choices']], ok=ok_src),
                                       [c['t'] for c in q['choices']], ok_now):
                    die('問題%s: 改変なしのはずが dige %s と選択肢・正解が違う' % (k, src['uid']))
                q['rate'], q['rate_cls'], q['rate_text'] = src['rate'], src['rate_cls'], src['rate_text']
                head = ('この問題（%s）は <b>消化器 %s</b> と同じ国試問題なので、その解説を借りて載せています。'
                        % (kid, src['qn']))
            else:
                orig = '<br/>'.join(re.sub(r'<[^>]+>', '', c['t']) for c in src['choices'])
                head = ('⚠️ この問題は国試 %s を MEC が<b>改変</b>したものです。下の解説は原題（<b>消化器 %s</b>）'
                        'のもので、<b>選択肢の記号・内容・正解が本問と違うところがあります</b>。'
                        '<br/><br/>原題の選択肢：<br/>%s<br/>原題の正解：%s'
                        % (kid, src['qn'], orig,
                           '・'.join(re.sub(r'<[^>]+>', '', src['choices'][i]['t']) for i in ok_src)))
            if k in BORROW_FIG:
                head += '<br/><br/>紙面に図が載っていないので、原題（%s）の内視鏡像を載せています。' % kid
            q['eg'] += [dict(cls='ept', h='📎 消化器（dige）の解説を借用', c=head)] + list(src['eg'])
        qs.append(q)
    return [dict(title=TITLE, qs=qs)], plan, doc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--figs', action='store_true', help='設問の図を Lesson消化管/images/ へ書き出す')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    chapters, plan, doc = build()
    if a.figs:
        B.IMG_DIR = IMG_DIR
        B.write_figs(doc, plan)
    for c in chapters:
        print('  %-24s %3d問（画像%2d）' % (c['title'], len(c['qs']), sum(1 for q in c['qs'] if q['imgs'])))
    B.NO_FIG_OK = set()
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
