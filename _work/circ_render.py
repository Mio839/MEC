# -*- coding: utf-8 -*-
"""
循環器の章別HTMLレンダラ（build_circ_ch{NN}.py が共有して使う）。

眼科・皮膚科では render_card 一式を章ごとの生成器へコピーしていたが、循環器は10章あるため
描画ロジックはここ1本に集約する（ロジックの二重管理をしない）。章の生成器はデータだけを持つ。

出力するカードの骨格は 眼科/皮膚科/精神科 と完全に同じ:

  <div class="qc" id="q442">
    <div class="qh"><span class="qn">Q.442</span><span class="qe">(112A-28)</span>
        <span class="bg bs">★</span><span class="cr cm">正答率 70%</span></div>
    <div class="qb">
      <div class="qt">…</div>
      <div class="qimg-row"><img src="images/…" alt=""></div>
      <div class="cs"><div class="ch2">ａ　…</div><div class="ch2 ok">ｂ　…</div></div>
      <div class="ab"><span class="ai">✅</span><div><div class="ac">…</div><div class="as">…</div></div></div>
      <div class="eg">…ep → ee → em → ept…</div>
    </div>
  </div>

⚠️ 不変条件（壊すと試験モードが無言で誤採点する。_work/新科目HTML生成ガイド.md §4）:
  - 正解肢は `<div class="ch2 ok">`。ok が1つも無い問題を作らない（採点除外バッジの問題を除く）。
  - 📷バッジ(bi)と imgs の有無を必ず一致させる。
  - 選択肢テキストは questions_circ.json の t を**そのまま**出す（'ａ　' の全角記号＋全角空白を含む）。
    ここを組み立て直すと表記が変わり、既存データとの往復一致が壊れる。

## 解説の2モード

各問は「未着手（legacy）」と「oph水準（authored）」のどちらかで描画される。判定は patho の有無:

  patho が None      → legacy_eg をそのまま出す（現行 questions_circ.json の再現）
  patho が入っている → ep(patho) + ee(選択肢の検討表) + em(deep) + ept(point) の4ブロックを組む

これにより1章を数セッションに分けても、途中の状態で常に正しいJSONが生成できる。
authored に切り替えたら legacy_eg は削除してよい（残っていても無視される）。
"""
from html import escape as _esc
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
SUBJ_DIR = BASE / '循環器'

# 循環器のテーマ色（gamify.js の SUBJECTS と揃える: circ = #EF4444）
ACCENT = ('#EF4444', '#FEE2E2', '#7F1D1D')


def Q(ep, rate_cls, rate_text, badges, qt, choices, ans_label, ans_sub,
      imgs=None, legacy_eg=None, patho=None, deep=None, point=None):
    """1問ぶんのデータ。

    ep        : 国試番号。'(112A-28)' のように括弧込みで持つ（questions_circ.json の episode と同一）
    rate_cls  : 'ch'(≥80) / 'cm'(60-79) / 'cl'(<60) / '' (正答率なし)
    rate_text : '正答率 85%' など。'' なら .cr スパンを出さない
    badges    : [('bs','★'), ('bi','📷 画像'), …]
    qt        : 設問文のHTML（<br/> や <strong> を含む生HTML）
    choices   : [(表示テキスト, ok, why), …]。表示テキストは 'ａ　…' の全角記号込みで**そのまま**。
                why は ee 表に入れる肢別解説（未着手なら None）
    imgs      : ['images/112A-28_1.jpeg', …]（'循環器/' は付けない。JSON化時に付与される）
    legacy_eg : [(cls, h, c), …] 旧解説。patho を書いたら不要
    patho/deep/point : (見出し, 本文HTML) の2つ組。ep / em / ept になる
    """
    return dict(ep=ep, rate_cls=rate_cls, rate_text=rate_text, badges=badges,
                qt=qt, choices=choices, ans_label=ans_label, ans_sub=ans_sub,
                imgs=imgs or [], legacy_eg=legacy_eg or [],
                patho=patho, deep=deep, point=point)


def is_authored(q):
    return q['patho'] is not None


def _choice_table(q):
    rows = ['<table class="tb"><tr><th>選択肢</th><th>解説</th></tr>']
    for text, ok, why in q['choices']:
        cell = _esc(text)
        why = _fix_html(why or '')
        if ok:
            rows.append(f'<tr><td><span class="kw3">◯ {cell}</span></td><td>{why}</td></tr>')
        else:
            rows.append(f'<tr><td>{cell}</td><td>{why}</td></tr>')
    rows.append('</table>')
    return ''.join(rows)


def _fix_html(c):
    """解説HTMLの br を正規化してから出す。**legacy / authored の両方に必ず通す。**

    理由は2つあり、どちらも build_circ_json.py（BeautifulSoup + html.parser）で
    **設問文(qt)が壊れる**という同じ症状を出す。

    1. 現行 questions_circ.json の旧解説には **不正な閉じタグ `</br>` が1292個**（384問）ある。
       `</br>` はHTMLに存在しないタグで、html.parser はこれを「開始タグ br」として扱うため、
       全文パース時に div の入れ子が崩れて隣の設問文にゴミが漏れる
       （実測: circ_ch03_q168 の qt 末尾に `</br></br>` が付いた）。

    2. **自分で書いた解説に `<br>`（自己閉じでない形）を1つでも混ぜてはいけない。**
       bs4 は `<br>` を見ると内部の `already_closed_empty_element` に 'br' を積むが、
       これは消費されずに残る。以降に現れた `<br/>` は
       「すでに閉じられた要素」と誤認されて**閉じられないまま開きっぱなし**になり、
       後続のテキストを子として飲み込む。
       結果、`<br/>` を含む qt が軒並み `…<br>本文</br>` に化ける
       （2026-08-04 ch07 執筆時に21問で実際に発生した）。

    これは表示の変更ではなく破損の予防である（`</br>` はブラウザ上も無意味）。
    """
    return c.replace('</br>', '').replace('<br>', '<br/>')


# 旧名。既存の呼び出しを壊さないための別名
_fix_legacy = _fix_html


def _render_eg(q):
    parts = ['<div class="eg">']
    if is_authored(q):
        parts.append(f'<div class="eb ep"><h4>{_esc(q["patho"][0])}</h4>{_fix_html(q["patho"][1])}</div>')
        parts.append(f'<div class="eb ee"><h4>□ 選択肢の検討</h4>{_choice_table(q)}</div>')
        if q['deep']:
            parts.append(f'<div class="eb em"><h4>{_esc(q["deep"][0])}</h4>{_fix_html(q["deep"][1])}</div>')
        if q['point']:
            parts.append(f'<div class="eb ept"><h4>{_esc(q["point"][0])}</h4>{_fix_html(q["point"][1])}</div>')
    else:
        for cls, h, c in q['legacy_eg']:
            parts.append(f'<div class="eb {cls}"><h4>{_esc(h)}</h4>{_fix_html(c)}</div>')
    parts.append('</div>')
    return ''.join(parts)


def render_card(n, q):
    qh = [f'<div class="qh"><span class="qn">Q.{n}</span>'
          f'<span class="qe">{_esc(q["ep"])}</span>']
    for cls, t in q['badges']:
        qh.append(f'<span class="bg {cls}">{_esc(t)}</span>')
    if q['rate_text']:
        cls = f'cr {q["rate_cls"]}'.strip()
        qh.append(f'<span class="{cls}">{_esc(q["rate_text"])}</span>')
    qh.append('</div>')

    body = [f'<div class="qb"><div class="qt">{q["qt"]}</div>']
    if q['imgs']:
        body.append('<div class="qimg-row">' +
                    ''.join(f'<img src="{_esc(s)}" alt="">' for s in q['imgs']) + '</div>')

    body.append('<div class="cs">')
    for text, ok, _why in q['choices']:
        body.append(f'<div class="{"ch2 ok" if ok else "ch2"}">{_esc(text)}</div>')
    body.append('</div>')

    body.append(f'<div class="ab"><span class="ai">✅</span><div>'
                f'<div class="ac">{_esc(q["ans_label"])}</div>'
                f'<div class="as">{_esc(q["ans_sub"])}</div></div></div>')

    body.append(_render_eg(q))
    body.append('</div>')

    return f'<div class="qc" id="q{n}">' + ''.join(qh) + ''.join(body) + '</div>'


def emit(*, ch_num, ch_name, out_name, q_start, questions, sections=None):
    """章別HTMLを書き出す。sections は [(anchor, 見出し, '', 先頭index), …]。"""
    out = SUBJ_DIR / out_name
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC循環器 第{ch_num}章 {ch_name} 解答解説')
    head = (head.replace('--or:#C2185B', f'--or:{ACCENT[0]}')
                .replace('--orl:#FCE4EC', f'--orl:{ACCENT[1]}')
                .replace('--ord:#880E4F', f'--ord:{ACCENT[2]}'))

    n_star = sum(1 for q in questions if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in questions if q['imgs'])
    n_done = sum(1 for q in questions if is_authored(q))

    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MEC臓器別講座 \'26 | 循環器</div>'
        f'<h1>第<span>{ch_num}</span>章｜{ch_name}</h1>'
        f'<div class="hs">解答・解説集 全{len(questions)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(questions)}</strong>問</div>'
        f'<div class="sp"><strong>★問題</strong> {n_star}問</div>'
        f'<div class="sp"><strong>📷画像</strong> {n_img}問</div></div></div>')

    sections = sections or [('s1', f'第{ch_num}章 {ch_name}', '', 0)]
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
    out.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {out.name}  {len(questions)}問 (★{n_star} 📷{n_img})  '
          f'解説oph水準 {n_done}/{len(questions)}問  {out.stat().st_size // 1024}KB')
