# -*- coding: utf-8 -*-
"""救急(emg)の章別HTMLを描くための共通部品。

⚠️ **章ごとに描画コードを複製しないこと。** 他科目（tox/psy/ortho …）の生成器は
   `render_card` と `emit` を章ファイルごとに丸写ししているが、救急は7章あるので
   同じものが7本並ぶ＝1か所直すと6か所が置き去りになる。ここが唯一の正本。

各章の生成器は
    from emg_render import FW, Q, emit
    QUESTIONS = [...]   SECTIONS = [...]
    emit(CH_NUM, CH_NAME, OUT, Q_START, QUESTIONS, SECTIONS)
だけを書く。
"""
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
# 章別HTMLの <head>（CSS）の供給元。精神科ch01を雛形にして色トークンだけ差し替える。
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'

# 5択決め打ちにしない（ガイド§4）。a〜e以外の設問が他科目に実在する。
FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ',
      'f': 'ｆ', 'g': 'ｇ', 'h': 'ｈ', 'i': 'ｉ'}

SUBJ_NAME = '救急'
SUBJ_HEAD = "MEC '26 | 現場でいきる救急"
# 科目色 #FF8A5B（🚑）。章別ページ自身のアクセント色トークンで、
# study.html からは参照されない（CLAUDE.md「{科目}/ch*.html の --or は別のトークン」）。
COLOR_OR, COLOR_ORL, COLOR_ORD = '#FF8A5B', '#FFEDE5', '#7C2D12'


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    """1問ぶんのデータ。

    choices は (letter, text, ok, why) の4つ組＝**肢別解説を書き漏らせない形**にしてある。
    📷バッジ(bi)は imgs があれば自動で付ける（手書きの badges に並べると必ず取りこぼす）。
    """
    imgs = imgs or []
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷 画像'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)


def _ans_label(q):
    if q['ans_label']:
        return q['ans_label']
    oks = [(l, t) for (l, t, ok, w) in q['choices'] if ok]
    if len(oks) == 1:
        return f'{FW[oks[0][0]]}　{oks[0][1]}'
    return '・'.join(FW[l] for l, _ in oks)


def _choice_table(q):
    rows = ['<table class="tb"><tr><th>選択肢</th><th>解説</th></tr>']
    for letter, text, ok, why in q['choices']:
        cell = f'{FW[letter]}　{text}'
        if ok:
            rows.append(f'<tr><td><span class="kw3">◯ {cell}</span></td><td>{why}</td></tr>')
        else:
            rows.append(f'<tr><td>{cell}</td><td>{why}</td></tr>')
    rows.append('</table>')
    return ''.join(rows)


def render_card(n, q):
    qh = [f'<div class="qh"><span class="qn">Q.{n}</span><span class="qe">({q["id"]})</span>']
    for cls, t in q['badges']:
        qh.append(f'<span class="bg {cls}">{t}</span>')
    if q['rate'] is not None:
        qh.append(f'<span class="cr {rcls(q["rate"])}">{q["rate"]}%</span>')
    qh.append('</div>')

    body = [f'<div class="qb"><div class="qt">{q["qt"]}</div>']
    if q['imgs']:
        body.append('<div class="qimg-row">' +
                    ''.join(f'<img src="{s}" alt="">' for s in q['imgs']) + '</div>')
    body.append('<div class="cs">')
    for letter, text, ok, _w in q['choices']:
        cl = 'ch2 ok' if ok else 'ch2'
        body.append(f'<div class="{cl}">{FW[letter]}　{text}</div>')
    body.append('</div>')

    body.append(f'<div class="ab"><span class="ai">✅</span><div>'
                f'<div class="ac">{_ans_label(q)}</div>'
                f'<div class="as">{q["ans_sub"]}</div></div></div>')

    # ⚠️ ブロックは ep → ee → em → ept の4枚この順（verify_emg_ch.py が検査する）。
    body.append('<div class="eg">')
    if q['patho']:
        body.append(f'<div class="eb ep"><h4>{q["patho"][0]}</h4>{q["patho"][1]}</div>')
    body.append(f'<div class="eb ee"><h4>□ 選択肢の検討</h4>{_choice_table(q)}</div>')
    if q['deep']:
        body.append(f'<div class="eb em"><h4>{q["deep"][0]}</h4>{q["deep"][1]}</div>')
    if q['point']:
        body.append(f'<div class="eb ept"><h4>{q["point"][0]}</h4>{q["point"][1]}</div>')
    body.append('</div></div>')

    return f'<div class="qc" id="q{n}">' + ''.join(qh) + ''.join(body) + '</div>'


def emit(ch_num, ch_name, out, q_start, questions, sections):
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC{SUBJ_NAME} 第{ch_num}章 {ch_name} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:' + COLOR_OR)
                .replace('--orl:#FCE4EC', '--orl:' + COLOR_ORL)
                .replace('--ord:#880E4F', '--ord:' + COLOR_ORD))

    n_hisshu = sum(1 for q in questions if any(c == 'bh' for c, _ in q['badges']))
    n_img = sum(1 for q in questions if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        f'<div class="ph"><div class="hb">{SUBJ_HEAD}</div>'
        f'<h1>第<span>{ch_num}</span>章｜{ch_name}</h1>'
        f'<div class="hs">解答・解説集 全{len(questions)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(questions)}</strong>問</div>'
        f'<div class="sp"><strong>必修</strong> {n_hisshu}問</div>'
        f'<div class="sp"><strong>📷画像</strong> {n_img}問</div></div></div>')

    nav = ['<div class="sn">']
    for anc, title, _sub, _i in sections:
        nav.append(f'<button class="nb" onclick="goto(\'{anc}\')">{title}</button>')
    nav.append('</div>')
    parts.append(''.join(nav))

    parts.append('<div class="ct">')
    bounds = sorted(i for _a, _t, _s, i in sections) + [len(questions)]
    end = {b: bounds[k + 1] - 1 for k, b in enumerate(bounds[:-1])}
    sec_by_idx = {i: (anc, title) for anc, title, _sub, i in sections}
    for idx, q in enumerate(questions):
        if idx in sec_by_idx:
            anc, title = sec_by_idx[idx]
            lo, hi = q_start + idx, q_start + end[idx]
            sub = f'Q.{lo}' if lo == hi else f'Q.{lo}〜Q.{hi}'
            parts.append(f'<div id="{anc}"><div class="sh"><div class="snum">§</div>'
                         f'<h2>{title}</h2><div class="sc">{sub}</div></div></div>')
        parts.append(render_card(q_start + idx, q))
    parts.append('</div>')

    parts.append("""
<script>
var pb=document.getElementById('pb');
window.addEventListener('scroll',function(){var h=document.documentElement;var sc=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;pb.style.width=sc+'%';});
function goto(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
</script>
</body>
</html>""")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {out.name}  {len(questions)}q (hisshu {n_hisshu}, img {n_img})  '
          f'{out.stat().st_size//1024}KB')
