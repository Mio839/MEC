# -*- coding: utf-8 -*-
"""
放射線科 第1章「序　章」(NO.1) の章別HTML(放射線科/ch01_josho.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_anes_ch02.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・放射線科 放Q-2／PDF p.5)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.39-40) を x 座標で列に切って読んだもの。
解説はPDFの問題編に無いため、同講座の**レジュメ編（放-2〜放-7）**と国試標準知識に基づき執筆
（医学的正確性は要ユーザー確認）。

全1問（本科目の最小章。画像なし・連問なし・採点除外なし）。
PDFのセクションは ★問題=NO.1 のみ。

■ 章の芯
  **放射線＝「放射状に飛ぶエネルギー」**。だから距離の2乗に反比例して弱まる（＝防護の第1原則）。
  そのうち **相手の原子から電子を弾き飛ばせる（＝電離させる）ほどエネルギーが大きいものだけ**を
  「電離放射線＝狭義の放射線」と呼ぶ。医学部で「放射線」と言えばこちらを指す。
  **電離できる／できないの境目は、電磁波の中では紫外線とエックス線の間にある**——
  これが本章唯一の問題（NO.1）の答えそのものである。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '放射線科' / 'ch01_josho.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 1

# 5択決め打ちにしない（ガイド§4）。
FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ',
      'f': 'ｆ', 'g': 'ｇ', 'h': 'ｈ', 'i': 'ｉ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    imgs = imgs or []
    # 📷バッジ(bi)と imgs は必ず対（ガイド§4）。手書きの取りこぼしを防ぐため自動で付ける。
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)


IMG = '放射線科/images/'


# ------------------------------------------------------------------
# 章を通して使い回す表
# ------------------------------------------------------------------

# ① 電離放射線と非電離放射線（レジュメ 放-3）
TBL_IONIZING = (
    '<table class="tb">'
    '<tr><th>大分類</th><th>本体</th><th>質量</th><th>電荷</th><th>具体名</th></tr>'
    '<tr><td rowspan="2"><span class="kw3">電離放射線</span><br>'
    '＝<span class="kw3">狭義の「放射線」</span><br>（エネルギー大）</td>'
    '<td><span class="kw">粒子線</span></td><td>あり</td>'
    '<td>あり／なし</td>'
    '<td><span class="kw">α線</span>（He原子核）・<span class="kw">β線</span>（電子・陽電子）・'
    '<span class="kw">陽子線</span>（H<sup>+</sup>）・<span class="kw">中性子線</span>（電荷なし）</td></tr>'
    '<tr><td><span class="kw">電磁波（光子）</span></td><td>なし</td><td>なし</td>'
    '<td><span class="kw">γ線</span>（自然崩壊で生じる）・'
    '<span class="kw">エックス線</span>（人工的に発生させる）</td></tr>'
    '<tr><td><span class="kw4">非電離放射線</span><br>（エネルギー小）</td>'
    '<td>電磁波（光子）</td><td>なし</td><td>なし</td>'
    '<td><span class="kw4">紫外線</span>・可視光線・赤外線・'
    'マイクロ波・電波</td></tr>'
    '<tr><td colspan="5"><span class="kw3">電磁波は波長が短いほどエネルギーが大きい</span>。'
    '<span class="kw3">その一本の物差しの上で、電離できるかどうかの境目が'
    '「紫外線」と「エックス線」の間に引かれている</span>——'
    '<span class="kw3">紫外線は電磁波のうち非電離側の一番端</span>で、'
    'これが国試で繰り返し問われる一点である。</td></tr></table>')

# ② 線種ごとの飛程と遮蔽（レジュメ 放-4／放-6）
TBL_SHIELD = (
    '<table class="tb">'
    '<tr><th>線種</th><th>本体</th><th>電荷</th><th>飛程</th>'
    '<th>遮蔽に必要なもの</th></tr>'
    '<tr><td><span class="kw">α線</span></td><td>He原子核（陽子2＋中性子2）</td>'
    '<td>＋2</td><td><span class="kw4">超短</span></td>'
    '<td><span class="kw3">紙1枚</span>で止まる</td></tr>'
    '<tr><td><span class="kw">β線・電子線</span></td><td>電子</td><td>－1（＋1）</td>'
    '<td>短</td><td><span class="kw3">アルミニウムなどの軽金属</span></td></tr>'
    '<tr><td><span class="kw">γ線・エックス線</span></td><td>光子</td><td>なし</td>'
    '<td><span class="kw4">超長</span></td>'
    '<td><span class="kw3">鉛・鉄など比重の大きい物質</span></td></tr>'
    '<tr><td><span class="kw">中性子線</span></td><td>中性子</td><td>なし</td>'
    '<td>長</td><td><span class="kw3">水・コンクリート</span>'
    '（<span class="kw3">水素原子核と質量がほぼ等しいので、水にぶつけると効率よく減速する</span>）</td></tr>'
    '<tr><td colspan="5"><span class="kw3">電荷があるものほど周囲の電子と相互作用して'
    'すぐエネルギーを失う＝飛程が短く遮蔽が容易</span>。'
    '<span class="kw3">電荷が無い（γ線・エックス線・中性子線）ほど遠くまで飛ぶ</span>——'
    'この一本の理屈で表全体が導ける。</td></tr></table>')


QUESTIONS = [

    # ── NO.1 (100G-20) ★ 57% ans=d ─────────────────────────────
    Q('100G-20', 57, [('bs', '★')],
      '<strong>非電離放射線はどれか。</strong>',
      [('a', 'α線', False,
        '<span class="kw4">α線はヘリウム原子核（陽子2個＋中性子2個）で、'
        '＋2という大きな電荷をもつ粒子線</span>。'
        '通り道の原子から片っ端に電子を弾き飛ばすので、'
        '<span class="kw4">電離作用は全線種のなかで最も強い</span>。'
        'その代わりエネルギーをすぐ使い果たすため<span class="kw">飛程は極端に短く、紙1枚で止まる</span>。'
        '外部被曝はほぼ問題にならない一方、'
        '<span class="kw">体内に取り込まれた場合（内部被曝）は狭い範囲に猛烈なダメージを与える</span>——'
        'これを治療に利用したのが<span class="kw">塩化ラジウム（<sup>223</sup>Ra）による'
        '去勢抵抗性前立腺癌の骨転移治療</span>である。'),
       ('b', 'β線', False,
        '<span class="kw4">β線の正体は電子（e<sup>－</sup>）または陽電子（e<sup>＋</sup>）で、'
        'これも電荷をもつ粒子線＝電離放射線</span>。'
        '飛程は<span class="kw">α線より長くγ線より短く、アルミニウムなどの軽金属で遮蔽できる</span>。'
        '<span class="kw">陽電子を出す核種（<sup>18</sup>F など）を使うのがPET</span>、'
        '<span class="kw">β線を出す核種（<sup>131</sup>I など）を使うのが内用療法</span>で、'
        '診断にも治療にも登場する。'),
       ('c', 'γ線', False,
        '<span class="kw4">γ線は電磁波（光子）だが、光子1粒あたりのエネルギーが桁違いに大きいので'
        '電離放射線に分類される</span>。'
        '<span class="kw">正体はエックス線とまったく同じ</span>で、'
        '<span class="kw">不安定な原子核の自然崩壊から出たものをγ線、'
        '装置（真空管に高電圧）で人工的に発生させたものをエックス線</span>と'
        '歴史的な由来で呼び分けているにすぎない。'
        '<span class="kw">質量も電荷も無いので飛程が長く、遮蔽には鉛など比重の大きい物質が要る</span>。'),
       ('d', '紫外線', True,
        '<span class="kw3">◯ 紫外線は電磁波のうち可視光線よりわずかに波長が短いだけで、'
        '光子1粒あたりのエネルギーが電離を起こすには足りない＝非電離放射線</span>。'
        '<span class="kw3">電磁波は「電波→赤外線→可視光線→紫外線→エックス線・γ線」の順に'
        '波長が短くなりエネルギーが大きくなる一本の連続体</span>で、'
        '<span class="kw3">電離できるかどうかの線引きは、この列のうち'
        '「紫外線」と「エックス線」の間に入る</span>。'
        'つまり<span class="kw3">紫外線は非電離放射線の一番エネルギーが高い端</span>にあり、'
        'だからこそ日焼け・皮膚癌・白内障といった生物学的作用をもつ。'
        '<span class="kw4">「体に悪い＝放射線」ではない</span>——'
        '医学でいう放射線（電離放射線）の定義はあくまで'
        '<span class="kw3">「対象物を電離させられるか」</span>である。'),
       ('e', '中性子線', False,
        '<span class="kw4">中性子線は電荷をもたない粒子線だが、質量があり電離作用も強い電離放射線</span>。'
        '<span class="kw">電荷が無いぶん物質中の電子に邪魔されず遠くまで飛ぶ</span>ので、'
        '<span class="kw">遮蔽は金属ではなく水やコンクリート</span>で行う'
        '（<span class="kw">水素原子核と質量がほぼ等しく、ぶつけると効率よく運動量を奪えるため</span>）。'
        '原子炉・原発事故で問題になる線種で、'
        '<span class="kw4">医療現場での日常的な取り扱いは無い</span>。')],
      '電磁波の列で「紫外線」までが非電離、「エックス線・γ線」から先が電離放射線。',
      patho=('🔎 放射線とは何か——「放射状のエネルギー」と「電離できるか」の2段構え',
             '<span class="kw3">放射線＝放射状に飛んでいくエネルギーの流れ</span>。'
             '<span class="kw3">点線源から四方八方へ広がるので、強さは距離の2乗に反比例して弱まる</span>——'
             'これがのちに学ぶ<span class="kw3">放射線防護の3原則（時間・距離・遮蔽）のうち'
             '「距離」の根拠</span>である。<br>'
             'そのうえで、<span class="kw3">医学で「放射線」と言うときは、'
             '相手の原子から電子を弾き飛ばせる（＝電離させられる）だけの'
             'エネルギーをもつものだけを指す</span>。これが'
             '<span class="kw3">電離放射線＝狭義の放射線</span>で、'
             '<span class="kw3">①物体を通過する（→ エックス線撮影・CT・核医学に使える）'
             '②電離させる（→ 放射線治療に使える／反面それが放射線障害になる）</span>'
             'という2つの性質は、どちらも「電離できる」という一点から出てくる。' + TBL_IONIZING),
      deep=('💡 電荷があるほど飛べない——遮蔽の表は理屈1本で作れる',
            '<span class="kw3">線種ごとの飛程と遮蔽材は丸暗記するものではなく、'
            '「電荷があるか」「質量があるか」から導ける</span>。'
            '<span class="kw3">電荷をもつ粒子（α線・β線・陽子線）は通り道の電子と'
            '電気的に相互作用してすぐ減速するので飛程が短く、遮蔽も容易</span>。'
            '逆に<span class="kw3">電荷を持たないもの（γ線・エックス線・中性子線）は'
            '素通りしやすいので飛程が長く、遮蔽が難しい</span>。' + TBL_SHIELD +
            '<span class="kw">なお用語として、放射線を浴びることは「被<u>曝</u>」と書く</span>'
            '（<span class="kw4">原爆の「被<u>爆</u>」ではない</span>）。'
            '<span class="kw">線源が体外にあれば外部被曝、'
            '飲食物や空気中の放射性物質を取り込んで体内から照射されれば内部被曝</span>で、'
            '<span class="kw">飛程の短いα線・β線は内部被曝でこそ問題になる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw">電離放射線＝α線・β線・陽子線・中性子線（粒子線）＋'
             'γ線・エックス線（電磁波）</span>。<br>'
             '② <span class="kw">非電離放射線＝紫外線・可視光線・赤外線・マイクロ波・電波</span>——'
             '<span class="kw3">電磁波の列で境目は「紫外線とエックス線の間」</span>。<br>'
             '③ <span class="kw">γ線とエックス線は正体が同じ光子</span>。'
             '<span class="kw">自然崩壊由来がγ線、人工的に発生させたものがエックス線</span>。<br>'
             '④ <span class="kw">遮蔽は α線＝紙／β線・電子線＝アルミ／γ線・エックス線＝鉛・鉄／'
             '中性子線＝水・コンクリート</span>。<br>'
             '⑤ <span class="kw">放射線は距離の2乗に反比例</span>'
             '（→ 第4章「防護の3原則」で回収される）。<br>'
             '⑥ <span class="kw">画像診断に使うのはほぼエックス線・γ線・β線（PET）、'
             '放射線治療に使うのはほぼエックス線・陽子線</span>。')),

]


SECTIONS = [
    ('s1', '★問題', '', 0),
]


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
                f'<div class="ac">{_ans_label(q)}</div><div class="as">{q["ans_sub"]}</div></div></div>')

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


CH_NUM, CH_NAME = 1, '序　章'


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC放射線科 第{CH_NUM}章 {CH_NAME} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#475569')
                .replace('--orl:#FCE4EC', '--orl:#F1F5F9')
                .replace('--ord:#880E4F', '--ord:#1E293B')
                .replace("content:'産'", "content:'放'"))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 放射線科</div>'
        f'<h1>第<span>{CH_NUM}</span>章｜{CH_NAME}</h1>'
        f'<div class="hs">解答・解説集 全{len(QUESTIONS)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(QUESTIONS)}</strong>問</div>'
        f'<div class="sp"><strong>★問題</strong> {n_star}問</div>'
        f'<div class="sp"><strong>📷画像</strong> {n_img}問</div></div></div>')

    nav = ['<div class="sn">']
    for anc, title, _sub, _i in SECTIONS:
        nav.append(f'<button class="nb" onclick="goto(\'{anc}\')">{title}</button>')
    nav.append('</div>')
    parts.append(''.join(nav))

    parts.append('<div class="ct">')
    _bounds = sorted(i for _a, _t, _s, i in SECTIONS) + [len(QUESTIONS)]
    _end = {b: _bounds[k + 1] - 1 for k, b in enumerate(_bounds[:-1])}
    sec_by_idx = {i: (anc, title) for anc, title, _sub, i in SECTIONS}
    for idx, q in enumerate(QUESTIONS):
        if idx in sec_by_idx:
            anc, title = sec_by_idx[idx]
            _lo, _hi = Q_START + idx, Q_START + _end[idx]
            sub = f'Q.{_lo}' if _lo == _hi else f'Q.{_lo}〜Q.{_hi}'
            parts.append(f'<div id="{anc}"><div class="sh"><div class="snum">§</div>'
                         f'<h2>{title}</h2><div class="sc">{sub}</div></div></div>')
        parts.append(render_card(Q_START + idx, q))
    parts.append('</div>')

    parts.append("""
<script>
var pb=document.getElementById('pb');
window.addEventListener('scroll',function(){var h=document.documentElement;var sc=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;pb.style.width=sc+'%';});
function goto(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
</script>
</body>
</html>""")
    OUT.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {OUT.name}  {len(QUESTIONS)}q (star {n_star}, img {n_img})  {OUT.stat().st_size//1024}KB')


if __name__ == '__main__':
    emit()
