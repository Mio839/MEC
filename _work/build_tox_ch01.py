# -*- coding: utf-8 -*-
"""
中毒・職業病 第1章「金属中毒」(NO.1-4) の章別HTML(中毒・職業病/ch01_kinzoku_chudoku.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_anes_ch01.py と同方式。

問題文・選択肢はPDF(中毒・職業病 印刷 p.4-6／PDF p.10-12)を書き起こし、
正解/正答率/必修バッジは巻末解答一覧表(PDF p.66-67)を x 座標で列に切って読んだもの。
肢別コメントはPDFに載っているが、ep/em/ept はPDFのレジュメ部（PDF p.7-9）と
国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全4問（画像0枚）。本PDFは埋め込み画像が1枚しかなく（p.40のレジュメ図）、
**設問の図は1枚も無い**＝biバッジ・imgs はどの章にも存在しない。

■ 章を貫く4本の筋
  ① 金属中毒は「どの金属が・どの臓器を・どの機序で」の3点セットで覚える。
     臓器は**吸入なら肺／接触なら皮膚粘膜／吸収されたら標的臓器**の3方向にしか散らない。
  ② **有機か無機かで血液-脳関門の通過が決まる＝中枢神経症状の有無**。
     水銀（有機＝Hunter-Russell／無機＝腎）も鉛（四アルキル鉛＝中枢／金属鉛＝貧血）も同じ形。
  ③ **生物学的モニタリング〈BM〉が使えるのは「体内に入る化学物質」だけ**。
     放射線・騒音・過重労働・ストレスは物質が体内に入らないので BM の枠外（NO.1）。
  ④ **鼻中隔穿孔＋肺癌はヒ素とクロムで共通**。分けるのは皮膚所見（ヒ素＝黒皮症・Bowen病／
     クロム＝皮膚潰瘍・金属アレルギー）。

⚠️ **NO.2 は組合せ問題で「誤っているもの」を選ぶ**（否定形）。無機水銀は BBB を通らない。
⚠️ **本章の最難は NO.2（110G-20・正答率58%）**＝「水銀＝中枢神経」の刷り込みで ｃ を
   正しいと読んでしまう。**中枢神経をやるのは有機水銀（アルキル水銀）だけ**。
⚠️ 4問すべてに正答率があり、採点除外・必修バッジの問題は無い。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '中毒・職業病' / 'ch01_kinzoku_chudoku.html'

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


# ------------------------------------------------------------------
# 章を通して何度も参照する表は定数にして使い回す。
# ------------------------------------------------------------------

# ① 主な金属中毒——「どこから入って・どこをやるか」
METAL_TABLE = (
    '<table class="tb"><tr><th>金属</th><th>主な曝露</th><th>標的と症状</th>'
    '<th>生物学的モニタリング〈BM〉</th></tr>'
    '<tr><td><span class="kw3">金属鉛</span></td>'
    '<td>蓄電池の製造・解体、鉛の精錬</td>'
    '<td><span class="kw3">続発性鉄芽球性貧血</span>（低色素性）'
    '——<span class="kw">ポルフィリン合成酵素を3か所で阻害</span>'
    '（SH基にPbが結合）／腹部疝痛・伸筋麻痺</td>'
    '<td><span class="kw3">血中鉛濃度</span>・'
    '<span class="kw3">尿中δ-ALA</span>（必要なら赤血球中プロトポルフィリン）</td></tr>'
    '<tr><td><span class="kw">四アルキル鉛</span>（有機鉛）</td>'
    '<td>かつてのガソリンのアンチノック剤（現在は曝露機会なし）</td>'
    '<td><span class="kw4">中枢神経症状</span>——'
    '<u>有機なので血液-脳関門を通る</u>。造血器はほとんどやられない</td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">アルキル水銀</span>（有機水銀）</td>'
    '<td><span class="kw3">水俣病・新潟水俣病</span>／魚介類（生物濃縮）</td>'
    '<td><span class="kw3">Hunter-Russell症候群</span>'
    '（求心性視野狭窄・小脳性失調・構音障害）。'
    '<u>初発は四肢のしびれ＝末梢神経障害</u></td>'
    '<td><span class="kw3">毛髪中水銀</span></td></tr>'
    '<tr><td>金属水銀・無機水銀</td>'
    '<td>体温計・血圧計・水銀電池（現在は職業曝露ほぼ無し）</td>'
    '<td><span class="kw4">無機は血液-脳関門を通らない</span>——'
    '無機水銀は<span class="kw3">腎障害</span>。'
    '金属水銀（蒸気）は肺から吸収され振戦・不眠・せん妄</td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">カドミウム</span></td>'
    '<td><span class="kw3">イタイイタイ病</span>（富山県神通川流域）／'
    '粉塵・フュームの吸入</td>'
    '<td><span class="kw3">近位尿細管障害</span> → '
    '<span class="kw">リン再吸収障害 → 低P血症 → 骨軟化症</span>。'
    '初期に歯牙の黄色環</td>'
    '<td><span class="kw3">尿中β<sub>2</sub>-ミクログロブリン</span>（低分子蛋白）</td></tr>'
    '<tr><td><span class="kw3">クロム</span></td>'
    '<td>メッキ・合金・皮革なめし・顔料（接触と吸入）</td>'
    '<td><span class="kw3">皮膚潰瘍・鼻中隔穿孔・肺癌</span>。'
    '<span class="kw">6価が毒性が強い</span>（6価→3価への還元時に粘膜を障害）。'
    'ニッケル・コバルトとともに<span class="kw3">金属アレルギー</span>の原因</td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">ヒ素</span></td>'
    '<td>旧土呂久鉱山・笹ヶ谷地区の公害／半導体・顔料</td>'
    '<td><span class="kw3">黒皮症・Bowen病・皮膚癌</span>、'
    '<span class="kw3">鼻中隔穿孔</span>、<span class="kw3">肺癌</span>、'
    '<span class="kw3">多発神経炎</span>（軸索障害）。'
    '<u>3価が毒性が強くSH基を障害</u></td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">マンガン</span></td>'
    '<td>吸入による慢性中毒</td>'
    '<td><span class="kw3">大脳基底核に蓄積 → Parkinson症候群</span></td>'
    '<td><span class="kw3">血中マンガン</span>'
    '（<u>尿中には出にくい</u>）</td></tr>'
    '<tr><td><span class="kw3">ベリリウム</span></td>'
    '<td>合金の硬化剤（航空機・ミサイル・人工衛星）</td>'
    '<td>慢性吸入 → <span class="kw3">類上皮細胞性肉芽腫症（ベリリウム肺）</span>／'
    '高濃度の急性接触 → <span class="kw3">湿疹</span>、反復で皮下肉芽腫症</td>'
    '<td>—</td></tr>'
    '<tr><td>ニッケルカルボニル Ni(CO)<sub>4</sub></td>'
    '<td>精錬・合成樹脂触媒（吸入）</td>'
    '<td>急性＝呼吸困難／慢性＝<span class="kw3">肺癌</span>・肝機能障害・皮膚瘙痒感</td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">インジウム・スズ酸化物〈ITO〉</span></td>'
    '<td><span class="kw3">液晶パネル・プラズマディスプレイの製造</span></td>'
    '<td>慢性吸入 → <span class="kw3">間質性肺炎</span>〜肺癌</td>'
    '<td><span class="kw3">血清インジウム濃度</span>と'
    '<span class="kw3">KL-6</span></td></tr>'
    '<tr><td colspan="4"><span class="kw3">読み筋は3つだけ</span>——'
    '<span class="kw3">①吸って肺に来るもの（ベリリウム・ITO・ニッケル・クロム・ヒ素）</span>／'
    '<span class="kw3">②触って皮膚粘膜に来るもの（クロム・ヒ素・ベリリウム）</span>／'
    '<span class="kw3">③吸収されて特定の標的臓器に来るもの'
    '（鉛＝骨髄、カドミウム＝近位尿細管、マンガン＝基底核、有機水銀＝中枢神経）</span>。'
    '<span class="kw4">「鼻中隔穿孔＋肺癌」はヒ素とクロムに共通</span>なので、'
    '<u>分けるのは皮膚所見</u>（黒皮症・Bowen病＝ヒ素／皮膚潰瘍・金属アレルギー＝クロム）'
    '</td></tr></table>')

# ② 生物学的モニタリング〈BM〉の対象物質
BM_TABLE = (
    '<table class="tb"><tr><th>曝露物質</th><th>測る検体と指標</th></tr>'
    '<tr><td><span class="kw3">ベンゼン</span></td>'
    '<td>尿中<span class="kw3">フェノール</span></td></tr>'
    '<tr><td><span class="kw3">トルエン</span></td>'
    '<td>尿中<span class="kw3">馬尿酸</span></td></tr>'
    '<tr><td>キシレン</td><td>尿中<span class="kw3">メチル馬尿酸</span></td></tr>'
    '<tr><td>スチレン</td><td>尿中<span class="kw3">マンデル酸</span>'
    '・フェニルグリオキシル酸</td></tr>'
    '<tr><td>ノルマルヘキサン</td><td>尿中<span class="kw3">ヘキサンジオン</span></td></tr>'
    '<tr><td><span class="kw3">トリクロロエチレン</span></td>'
    '<td>尿中<span class="kw3">トリクロロ酢酸</span>・総三塩化物</td></tr>'
    '<tr><td><span class="kw3">金属鉛</span></td>'
    '<td><span class="kw3">血中鉛濃度</span>・尿中δ-ALA</td></tr>'
    '<tr><td><span class="kw3">カドミウム</span></td>'
    '<td>尿中<span class="kw3">β<sub>2</sub>-ミクログロブリン</span></td></tr>'
    '<tr><td>マンガン</td><td>血中マンガン</td></tr>'
    '<tr><td>アルキル水銀</td><td>毛髪中水銀</td></tr>'
    '<tr><td>一酸化炭素</td><td>血中<span class="kw3">CO-Hb</span>'
    '（半減期6時間なので時間が経つと当てにならない）</td></tr>'
    '<tr><td>アニリン・ニトロベンゼン</td><td>血中メトヘモグロビン</td></tr>'
    '<tr><td>ITO</td><td>血清インジウム・KL-6</td></tr>'
    '<tr><td colspan="2"><span class="kw3">BMが成立する条件は2つだけ</span>——'
    '<span class="kw3">①体内に吸収される化学物質であること</span>、'
    '<span class="kw3">②その物質か代謝産物が、簡単に採れる生体試料'
    '（血液・尿・毛髪）に出てくること</span>。'
    '<span class="kw4">放射線・騒音・振動・過重労働・ストレスは'
    '「体内に入る物質」ではないので、そもそもBMの対象にならない</span></td></tr></table>')

# ③ 労働衛生の3管理——BMがどこに位置するか
KANRI_TABLE = (
    '<table class="tb"><tr><th>管理</th><th>何を測る／何をする</th><th>代表的な道具</th></tr>'
    '<tr><td><span class="kw3">作業環境管理</span></td>'
    '<td><span class="kw3">空気中にどれだけあるか</span>'
    '——環境そのものを改善する</td>'
    '<td><span class="kw3">作業環境測定</span>（管理区分1〜3）、'
    '<span class="kw">局所排気装置</span>、有害物質の代替</td></tr>'
    '<tr><td><span class="kw3">作業管理</span></td>'
    '<td><span class="kw3">働き方・防護具が適切か</span>'
    '——曝露する時間と経路を減らす</td>'
    '<td>防毒マスク・防塵マスク、保護衣、作業姿勢、作業時間の短縮</td></tr>'
    '<tr><td><span class="kw3">健康管理</span></td>'
    '<td><span class="kw3">体内にどれだけ入ったか・影響が出ていないか</span></td>'
    '<td><span class="kw3">特殊健康診断</span>、'
    '<span class="kw3">生物学的モニタリング〈BM〉</span></td></tr>'
    '<tr><td colspan="3"><span class="kw3">作業環境が「管理区分1（適切）」でも'
    'BMだけが高い、ということが起こる</span>——'
    '<u>空気は綺麗でも、防護具の使い方や作業姿勢が悪ければ体内には入る</u>。'
    '<span class="kw3">だからBMが高いときにまずやるのは「作業状況の確認（職場巡視）」</span>'
    'であって、いきなり療養を命じることではない（→ 第2章 NO.7）</td></tr></table>')

# ④ 公害病——原因物質と地域
KOGAI_TABLE = (
    '<table class="tb"><tr><th>公害病</th><th>地域</th><th>原因物質</th><th>中心症状</th></tr>'
    '<tr><td><span class="kw3">水俣病</span></td><td>熊本県水俣湾</td>'
    '<td><span class="kw3">メチル水銀</span>（アルキル水銀）</td>'
    '<td><span class="kw3">Hunter-Russell症候群</span>'
    '（求心性視野狭窄・小脳性失調・構音障害）＋難聴・感覚障害。'
    '<u>初発は四肢のしびれ</u></td></tr>'
    '<tr><td><span class="kw3">新潟水俣病</span></td><td>新潟県阿賀野川流域</td>'
    '<td>メチル水銀</td><td>同上</td></tr>'
    '<tr><td><span class="kw3">イタイイタイ病</span></td><td>富山県神通川流域</td>'
    '<td><span class="kw3">カドミウム</span></td>'
    '<td><span class="kw3">近位尿細管障害 → 低P血症 → 骨軟化症</span>'
    '（多発骨折で「痛い痛い」）</td></tr>'
    '<tr><td><span class="kw3">四日市ぜんそく</span></td><td>三重県四日市市</td>'
    '<td><span class="kw3">亜硫酸ガス〈SO<sub>2</sub>〉</span>'
    '（石油コンビナート）</td>'
    '<td><span class="kw3">粘膜刺激</span>による気管支喘息・気管支炎</td></tr>'
    '<tr><td>土呂久・笹ヶ谷の鉱害</td><td>宮崎県／島根県津和野町</td>'
    '<td><span class="kw3">ヒ素</span></td>'
    '<td>皮膚粘膜障害・多発神経炎</td></tr>'
    '<tr><td>カネミ油症（1968年）</td><td>西日本</td>'
    '<td><span class="kw3">PCB</span>（由来のダイオキシン）</td>'
    '<td>塩素挫創・肝障害・<span class="kw3">新生児黒皮症</span></td></tr>'
    '<tr><td colspan="4"><span class="kw3">四大公害病は'
    '「水銀2つ・カドミウム1つ・大気1つ」</span>と数えると混ざらない。'
    '<span class="kw3">水銀は神経、カドミウムは腎（→骨）、SO<sub>2</sub>は気道</span></td></tr></table>')

# ⑤ ヒ素とクロム——似ているところと分かれるところ
AS_CR_TABLE = (
    '<table class="tb"><tr><th></th>'
    '<th><span class="kw3">ヒ素</span></th>'
    '<th><span class="kw3">クロム</span></th></tr>'
    '<tr><td>共通</td><td colspan="2"><span class="kw3">接触＋吸入で問題になる慢性中毒／'
    '鼻中隔穿孔／肺癌／皮膚癌</span></td></tr>'
    '<tr><td>皮膚の顔つき</td>'
    '<td><span class="kw3">黒皮症（色素沈着）・Bowen病（表皮内癌）の多発</span>'
    '・角化</td>'
    '<td><span class="kw3">皮膚潰瘍（クロム潰瘍）</span>・'
    '<span class="kw3">アレルギー性接触皮膚炎</span></td></tr>'
    '<tr><td>神経</td>'
    '<td><span class="kw3">多発神経炎（軸索障害）</span></td>'
    '<td>—</td></tr>'
    '<tr><td>毒性が強い価数</td>'
    '<td><span class="kw3">3価</span>（生体内でSH基を障害）</td>'
    '<td><span class="kw3">6価</span>（3価へ還元されるときに粘膜を障害）</td></tr>'
    '<tr><td>金属アレルギー</td><td>—</td>'
    '<td><span class="kw3">ニッケル・コバルトとともに代表格</span>'
    '（溶出後に蛋白と結合して抗原性を獲得）</td></tr>'
    '<tr><td colspan="3"><span class="kw4">Bowen病が全身に多発していたら、'
    'まずヒ素を疑う</span>——'
    '<u>Bowen病自体は表皮内癌で、通常は日光露光部に単発する</u>のに、'
    '<span class="kw3">慢性ヒ素中毒では体幹を含めて多発する</span>のが特徴</td></tr></table>')

IMG = '中毒・職業病/images/'

QUESTIONS = [
    # ------------------------------------------------------------------ NO.1
    Q('115F-25', 73, [],
      '<strong>労働衛生管理の手法として生物学的モニタリングが用いられるのはどれか。</strong>',
      [('a', '過重労働', False,
        '過重労働は<span class="kw4">長時間労働という「働き方」の問題</span>で、'
        '体内に入る化学物質ではない。'
        '把握するのは<u>時間外労働時間の集計</u>と<u>面接指導</u>であり、'
        'BMの対象にならない。'),
       ('b', '気分障害', False,
        '気分障害は精神疾患であり、'
        '<span class="kw4">曝露物質そのものが存在しない</span>。'
        '職場での評価は<u>ストレスチェック制度</u>と産業医面談による。'),
       ('c', '筋骨格系障害', False,
        '腰痛・頸肩腕障害などは<span class="kw4">力学的負荷（作業姿勢・重量物）'
        'による障害</span>であって、化学物質の曝露ではない。'
        '評価は作業姿勢の観察と自覚症状調査による。'),
       ('d', '有機溶剤中毒', True,
        '<span class="kw3">有機溶剤は代謝産物が尿に出るのでBMの主役</span>——'
        'ベンゼン→尿中フェノール、トルエン→尿中馬尿酸、'
        'トリクロロエチレン→尿中トリクロロ酢酸。'
        '<u>これらを測って曝露量を推定し、健康影響を評価できる</u>。'
        'なお<span class="kw">BMは有機溶剤だけでなく、'
        '金属鉛（血中鉛・尿中δ-ALA）やカドミウム'
        '（尿中β<sub>2</sub>-ミクログロブリン）などの金属中毒でも用いられる</span>。'),
       ('e', '電離放射線障害', False,
        '<span class="kw4">放射線は「体内に入る物質」ではなくエネルギー</span>。'
        '曝露量は<u>個人線量計</u>で測れるが、'
        'これは<span class="kw4">生体試料中の化学物質や代謝産物を測る</span>という'
        'BMの定義に当てはまらない。'
        '「測れる＝BM」ではないところがこの肢の罠。')],
      '有機溶剤は代謝産物が尿に出るのでBMの対象になる',
      patho=('□ 生物学的モニタリング〈BM〉とは何か',
             '<p><span class="kw3">生物学的モニタリング biological monitoring〈BM〉</span>とは、'
             '<span class="kw3">曝露を受けた労働者の生体試料（血液・尿・毛髪など）の中の'
             '化学物質そのもの、またはその代謝産物を測定して、'
             '体内に入った量＝曝露の程度を評価する手法</span>である。'
             '<span class="kw">作業環境測定が「空気中にどれだけあるか」を測るのに対し、'
             'BMは「体内にどれだけ入ったか」を測る</span>——'
             'この2つは互いの穴を塞ぐ関係にある。</p>'
             '<p>したがって<span class="kw3">BMが成立するには2つの条件が要る</span>。'
             '<span class="kw3">①曝露するのが体内に吸収される化学物質であること</span>、'
             '<span class="kw3">②その物質か代謝産物が、容易に採取できる生体試料に'
             '分布すること</span>。'
             '<span class="kw4">この2条件を当てはめるだけで、'
             '5つの肢のうち4つが物質ですらない</span>ことに気づく。</p>' + BM_TABLE),
      deep=('□ 「物質か、そうでないか」で1秒で切る',
            '<p>この設問が易しく見えて正答率73%にとどまるのは、'
            '<span class="kw4">「曝露量が測れるもの＝BM」と読んでしまう</span>からである。'
            '電離放射線は個人線量計で被ばく線量を精密に測れるが、'
            '<span class="kw4">測っているのは体外の線量計に当たった放射線であって、'
            '体内の物質ではない</span>。BMの定義は'
            '<u>「生体試料中の化学物質や代謝産物を測る」</u>と語まで決まっている。</p>'
            '<p><span class="kw3">労働衛生でBMの枠外にあるものを並べておくと'
            '——放射線・騒音・振動・高温・過重労働・ストレス</span>。'
            'いずれも<u>物質が体内に入るわけではない</u>ので、'
            'それぞれ線量計・騒音計・振動レベル・WBGT・労働時間・'
            'ストレスチェックという別の物差しで測る。'
            '<span class="kw3">選択肢に化学物質の曝露が1つしか無ければ、それが答え</span>。</p>'
            + KANRI_TABLE),
      point=('□ 国試ポイント：労働衛生の3管理と特殊健康診断',
             '<ol>'
             '<li><span class="kw3">労働衛生の3管理＝作業環境管理・作業管理・健康管理</span>。'
             'BMは<u>健康管理</u>に属し、特殊健康診断の一項目として実施される。</li>'
             '<li><span class="kw3">特殊健康診断は「有害業務」に従事する労働者に'
             '6か月に1回</span>（一般の定期健康診断は年1回）。'
             '<span class="kw">受診者数が最も多いのは有機溶剤</span>で、'
             '鉛・特定化学物質・電離放射線・高気圧・石綿などが続く。</li>'
             '<li><span class="kw3">作業環境測定の管理区分</span>——'
             '<span class="kw3">1＝適切</span>／<span class="kw">2＝改善の余地あり</span>／'
             '<span class="kw4">3＝不適切（直ちに改善が必要）</span>。'
             '我が国の職場はほとんどが区分1なので、'
             '<u>問題になるのは「環境は良いのに曝露量だけ高い」ケース</u>＝作業管理の失敗。</li>'
             '<li><span class="kw3">主な規則</span>——'
             '有機溶剤中毒予防規則（有機則）／鉛中毒予防規則（鉛則）／'
             '特定化学物質障害予防規則（特化則）／電離放射線障害防止規則（電離則）／'
             '酸素欠乏症等防止規則。'
             '<span class="kw">発がん性の強い物質は特化則の「特別管理物質」</span>に指定され、'
             'ITO・ジクロロプロパン・ホルムアルデヒド・オルト-トルイジンがこれに当たる。</li>'
             '<li>関連する発展知識：<span class="kw">安全データシート〈SDS〉</span>'
             '（→第2章 NO.8）、<span class="kw">リスクアセスメント</span>、'
             '<span class="kw">健康診断の事後措置（就業場所の変更・作業転換）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.2
    Q('110G-20', 58, [],
      '<strong>金属と健康障害の組合せで誤っているのはどれか。</strong>',
      [('a', '鉛 ―― 貧血', False,
        '<span class="kw3">正しい組合せ</span>。'
        '金属鉛は<span class="kw">ポルフィリン合成酵素をSH基に結合して3か所で阻害</span>し、'
        'ヘムが作れなくなるため<span class="kw3">続発性鉄芽球性貧血（低色素性貧血）</span>を'
        'きたす。BMは血中鉛濃度と尿中δ-ALA。'),
       ('b', 'クロム ―― 鼻中隔穿孔', False,
        '<span class="kw3">正しい組合せ</span>。'
        'クロム（特に<span class="kw">6価</span>）は'
        '<span class="kw3">皮膚粘膜障害</span>を起こし、'
        '鼻中隔軟骨部に潰瘍を作って<span class="kw3">鼻中隔穿孔</span>に至る。'
        '同時に皮膚潰瘍・皮膚癌・肺癌のリスクにもなる。'),
       ('c', '無機水銀 ―― 中枢神経障害', True,
        '<span class="kw3">◯ これが誤り＝正解</span>。'
        '<span class="kw4">無機水銀は血液-脳関門を通過しないので中枢神経症状を生じない</span>。'
        '無機水銀の標的は<span class="kw3">腎（近位尿細管）</span>である。'
        '<span class="kw3">中枢神経をやるのは有機水銀（アルキル水銀）</span>で、'
        'Hunter-Russell症候群（求心性視野狭窄・小脳性失調・構音障害）をきたす。'),
       ('d', 'ベリリウム ―― 湿疹', False,
        '<span class="kw3">正しい組合せ</span>。'
        'ベリリウムは<span class="kw3">高濃度の急性接触曝露で湿疹</span>を生じ、'
        'これを反復すると皮下肉芽腫症になる。'
        '一方<span class="kw">慢性吸入曝露では肺にⅣ型アレルギー反応が起こり、'
        '類上皮細胞性肉芽腫症（ベリリウム肺）</span>をきたす。'),
       ('e', 'インジウム ―― 間質性肺炎', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">インジウム・スズ酸化物〈ITO〉</span>は液晶パネルなどの材料で、'
        '<span class="kw3">慢性吸入曝露により間質性肺炎〜肺癌</span>をきたす。'
        '2013年に特化則の<span class="kw">「特別管理物質」</span>に指定された。')],
      '無機水銀はBBBを通らないので中枢神経症状は出ない（腎障害）',
      ans_label='ｃ　無機水銀 ―― 中枢神経障害',
      patho=('□ 水銀は3つに割って覚える——有機か無機かで到達する臓器が変わる',
             '<p>水銀は<span class="kw3">①金属水銀（Hg<sup>0</sup>）'
             '②無機水銀 ③有機水銀（アルキル水銀）</span>の3つに割れ、'
             '<span class="kw3">どれも別の病気になる</span>。'
             '分岐点はただ1つ、<span class="kw3">血液-脳関門〈BBB〉を通れるか</span>である。</p>'
             '<table class="tb"><tr><th>種類</th><th>BBB</th>'
             '<th>標的と症状</th><th>現在の曝露機会</th></tr>'
             '<tr><td><span class="kw3">金属水銀 Hg<sup>0</sup></span></td>'
             '<td>蒸気は<span class="kw">脂溶性で通る</span></td>'
             '<td>吸入で肺から吸収され、'
             '<span class="kw3">振戦・不眠・せん妄</span>などの神経症状。'
             '全身倦怠感・食思不振で始まる</td>'
             '<td>体温計・血圧計・水銀電池——'
             '<u>我が国ではほぼ使われていない</u></td></tr>'
             '<tr><td><span class="kw3">無機水銀</span></td>'
             '<td><span class="kw4">通らない</span></td>'
             '<td><span class="kw3">腎障害（近位尿細管）</span>。'
             '<span class="kw4">中枢神経症状は出ない</span></td>'
             '<td>ほぼ皆無</td></tr>'
             '<tr><td><span class="kw3">アルキル水銀（有機水銀）</span></td>'
             '<td><span class="kw3">脂溶性なのでよく通る</span></td>'
             '<td><span class="kw3">Hunter-Russell症候群</span>'
             '（求心性視野狭窄・小脳性失調症・構音障害）。'
             '<u>初発症状は四肢のしびれ＝末梢神経障害</u>、'
             '水俣病では難聴と感覚障害も高頻度</td>'
             '<td><span class="kw3">水俣病・新潟水俣病</span>／'
             '<span class="kw3">魚介類（生物濃縮）</span></td></tr></table>'
             '<p><span class="kw3">この「有機は脳へ、無機は末梢の標的臓器へ」という形は'
             '鉛でもそのまま繰り返される</span>——'
             '<span class="kw3">金属鉛は貧血（骨髄）</span>、'
             '<span class="kw3">四アルキル鉛（有機鉛）は中枢神経症状</span>で、'
             '<u>有機鉛は逆に造血器障害をほとんど起こさない</u>。</p>'),
      deep=('□ この1問で金属中毒の表がまるごと復習できる',
            '<p>本問は<span class="kw3">「誤っているものを選べ」という否定形</span>で、'
            '<u>4つの正しい組合せを読み流して1つの嘘を見つける</u>形になっている。'
            '正答率58%と割れたのは、'
            '<span class="kw4">「水銀＝神経」という刷り込みが強すぎて、'
            'ｃを正しいと読んでしまう</span>ためである。'
            '<span class="kw3">水銀を見たら反射的に「有機か無機か」を確認する</span>癖をつける。</p>'
            + METAL_TABLE),
      point=('□ 国試ポイント：四大公害病と金属の標的臓器',
             '<ol>'
             '<li><span class="kw3">「水銀＝中枢神経」は有機水銀に限る</span>。'
             '無機水銀の標的は腎、金属水銀（蒸気）は肺から入って神経症状。</li>'
             '<li><span class="kw3">四大公害病</span>は下表のとおり。'
             '<span class="kw">水銀2つ・カドミウム1つ・大気1つ</span>と数える。</li>'
             '<li><span class="kw3">貧血をきたす職業曝露は鉛とベンゼン</span>だが中身が違う——'
             '<span class="kw3">鉛＝続発性鉄芽球性貧血（ヘム合成の障害）</span>、'
             '<span class="kw3">ベンゼン＝再生不良性貧血・白血病（骨髄そのものの抑制）</span>。'
             'この対比は第3章 NO.3（ヒ素）でも受け皿として出る。</li>'
             '<li><span class="kw3">肉芽腫をきたす吸入曝露はベリリウム</span>——'
             '病理像が<u>サルコイドーシスと区別できないほど似る</u>ので、'
             '職業歴を聞かないと診断できない。</li>'
             '<li>関連する発展知識：<span class="kw">金属アレルギー'
             '（ニッケル・クロム・コバルト）</span>、'
             '<span class="kw">フューム〈fume〉＝溶融金属の蒸気が凝集した微細粒子</span>'
             '（金属熱の原因。亜鉛・銅で有名）、'
             '<span class="kw">生物濃縮</span>（有機水銀・PCB・有機塩素系農薬）。</li>'
             '</ol>' + KOGAI_TABLE)),

    # ------------------------------------------------------------------ NO.3
    Q('111A-7', 86, [],
      '<strong>慢性ヒ素中毒でみられるのはどれか。</strong>',
      [('a', '肝細胞癌', False,
        '<span class="kw4">ヒ素中毒と関連しない</span>。'
        '職業曝露で問題になる肝臓の悪性腫瘍は'
        '<span class="kw">塩化ビニルモノマーによる肝血管肉腫</span>であって、'
        '肝細胞癌ではない。'),
       ('b', '骨粗鬆症', False,
        '<span class="kw4">ヒ素中毒と関連しない</span>。'
        '職業・環境曝露で骨が問題になるのは'
        '<span class="kw">カドミウム（近位尿細管障害→低P血症→骨軟化症）</span>と'
        '<span class="kw">減圧症の無菌性骨壊死</span>であり、'
        'どちらも骨粗鬆症とは別物。'),
       ('c', 'Bowen 病', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">Bowen病は表皮内癌で、通常は日光露光部に単発する</span>が、'
        '<span class="kw3">慢性ヒ素中毒では体幹を含めて全身に多発する</span>のが特徴。'
        'ヒ素はほかに黒皮症（色素沈着）・角化・皮膚癌といった皮膚粘膜障害、'
        '鼻中隔穿孔、肺癌、多発神経炎をきたす。'),
       ('d', '慢性気管支炎', False,
        '<span class="kw4">ヒ素中毒と関連しない</span>。'
        '職業曝露で慢性の気道症状を作るのは'
        '<span class="kw">粉塵（じん肺）や亜硫酸ガスなどの刺激性ガス</span>。'
        'ヒ素の呼吸器への影響は<u>肺癌</u>であって慢性気管支炎ではない。'),
       ('e', '再生不良性貧血', False,
        '<span class="kw4">再生不良性貧血をきたすのはベンゼン</span>。'
        'ベンゼンは骨髄を抑制して再生不良性貧血と白血病を起こす発がん物質である。'
        '<u>「職業曝露＋血液疾患」で反射的にヒ素へ行かないこと</u>——'
        'ヒ素の主戦場は皮膚である。')],
      '全身に多発するBowen病は慢性ヒ素中毒のサイン',
      patho=('□ 慢性ヒ素中毒——3価がSH基を掴んで、皮膚・気道・末梢神経をやる',
             '<p>ヒ素は<span class="kw3">接触と吸入による慢性中毒</span>が問題になる。'
             '<span class="kw3">特に3価（亜ヒ酸）の毒性が強く、'
             '生体内で蛋白質のSH基（チオール基）に結合して酵素を止める</span>——'
             '<u>金属鉛がポルフィリン合成酵素のSH基を掴むのと同じ機序</u>である。</p>'
             '<p>症状は3方向に散る。</p>'
             '<ol>'
             '<li><span class="kw3">皮膚粘膜障害</span>——'
             '<span class="kw3">発疹・黒皮症（びまん性の色素沈着）・'
             '手掌足底の角化・Bowen病・皮膚癌</span>、そして'
             '<span class="kw3">鼻中隔穿孔</span>。'
             '<u>ヒ素の最大の特徴はここ</u>で、皮膚を見れば疑える。</li>'
             '<li><span class="kw3">肺癌</span>——吸入曝露による。</li>'
             '<li><span class="kw3">多発神経炎（軸索障害）</span>——'
             '手袋・靴下型の感覚障害から始まる。'
             '<u>有機溶剤のノルマルヘキサンも同じ軸索障害型の多発神経炎</u>を起こす。</li>'
             '</ol>'
             '<p><span class="kw">公害としては宮崎県旧土呂久鉱山と'
             '島根県津和野町笹ヶ谷地区</span>が知られる。'
             '職業では半導体（化合物半導体ガス）・医薬品や染料の原料・顔料の製造工程。</p>'
             + AS_CR_TABLE),
      deep=('□ 「職業曝露 × 悪性腫瘍」は組合せで丸暗記する',
            '<p>本問は正答率86%と易しいが、'
            '<span class="kw3">誤りの肢がいずれも「別の職業曝露の答え」になっている</span>ので、'
            '1問で表がひととおり復習できる作りになっている。'
            '<span class="kw4">とくに ｅ 再生不良性貧血＝ベンゼン</span>は'
            '毎年どこかで問われる。</p>'
            '<table class="tb"><tr><th>職業曝露</th><th>起こる悪性腫瘍・血液疾患</th></tr>'
            '<tr><td><span class="kw3">ヒ素</span></td>'
            '<td><span class="kw3">皮膚癌（Bowen病の多発）・肺癌</span></td></tr>'
            '<tr><td><span class="kw3">クロム（6価）・ニッケル</span></td>'
            '<td><span class="kw3">肺癌</span>（＋鼻中隔穿孔）</td></tr>'
            '<tr><td><span class="kw3">石綿〈アスベスト〉</span></td>'
            '<td><span class="kw3">肺癌・悪性胸膜中皮腫</span></td></tr>'
            '<tr><td><span class="kw3">ベンゼン</span></td>'
            '<td><span class="kw3">再生不良性貧血・白血病</span></td></tr>'
            '<tr><td><span class="kw3">β-ナフチルアミン・ベンジジン</span>'
            '（芳香族アミン）</td>'
            '<td><span class="kw3">膀胱癌</span>（BMは尿沈渣の細胞診）</td></tr>'
            '<tr><td><span class="kw3">塩化ビニルモノマー</span></td>'
            '<td><span class="kw3">肝血管肉腫</span>'
            '（＋全身性強皮症・末節骨溶解症）</td></tr>'
            '<tr><td><span class="kw3">ジクロロプロパン</span>'
            '（印刷）</td>'
            '<td><span class="kw3">胆管癌</span>（→第2章 NO.6）</td></tr>'
            '<tr><td><span class="kw3">ビス(クロロメチル)エーテル</span></td>'
            '<td><span class="kw3">肺癌</span>（製造使用禁止）</td></tr>'
            '<tr><td><span class="kw3">ITO（インジウム）</span></td>'
            '<td><span class="kw3">間質性肺炎〜肺癌</span>（→NO.4）</td></tr>'
            '<tr><td colspan="2"><span class="kw3">臓器で束ねると3つ</span>——'
            '<span class="kw3">肺（ヒ素・クロム・ニッケル・石綿・ITO・BCME）</span>／'
            '<span class="kw3">膀胱（芳香族アミン）</span>／'
            '<span class="kw3">血液（ベンゼン）</span>。'
            '<u>肝は塩化ビニル＝血管肉腫、胆管はジクロロプロパン</u>と'
            '例外だけ別に覚える</td></tr></table>'),
      point=('□ 国試ポイント：Bowen病とヒ素',
             '<ol>'
             '<li><span class="kw3">Bowen病＝表皮内有棘細胞癌（上皮内癌）</span>。'
             '境界明瞭な<u>落屑を伴う紅褐色局面</u>で、'
             '通常は高齢者の日光露光部に<span class="kw">単発</span>する。'
             '<span class="kw3">多発していたら慢性ヒ素中毒を疑う</span>のがこの問題の核心。</li>'
             '<li><span class="kw3">ヒ素の3方向＝皮膚粘膜・肺癌・多発神経炎</span>。'
             '<span class="kw">鼻中隔穿孔と肺癌はクロムと共通</span>なので、'
             '<u>分けるのは皮膚所見</u>（黒皮症・Bowenならヒ素／潰瘍・接触皮膚炎ならクロム）。</li>'
             '<li><span class="kw3">急性ヒ素中毒</span>は別物で、'
             '<u>激しい消化器症状（コレラ様の水様下痢）・血圧低下</u>から始まり、'
             '遅れて末梢神経障害・Mees線（爪の白い横線）が出る。'
             '和歌山毒物カレー事件が有名。</li>'
             '<li><span class="kw3">治療はキレート剤</span>——'
             '<span class="kw">ジメルカプロール〈BAL〉</span>が'
             'ヒ素・水銀・鉛・金に用いられる。'
             '<u>SH基を持つ薬で、SH基を掴む毒を横取りする</u>と考えると機序が繋がる。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">亜ヒ酸〈ATO〉は急性前骨髄球性白血病〈APL〉の治療薬</span>'
             'でもある（毒と薬は用量と文脈で入れ替わる）。'
             '<span class="kw">井戸水のヒ素汚染（バングラデシュ）</span>も国際保健の頻出。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.4
    Q('112C-43', 79, [],
      '27歳の男性。1か月前に乾性咳嗽と呼吸困難が出現し、軽快しないため受診した。'
      '<span class="kw">4年前から液晶パネル製造工場に勤務</span>している。'
      '胸部エックス線写真で両肺野に<span class="kw">すりガラス陰影</span>を認める。'
      '<span class="kw">胸腔鏡下肺生検で直径1μm前後の微細粒子</span>を認める。<br>'
      '<strong>この患者が曝露した物質として考えられるのはどれか。</strong>',
      [('a', '鉛', False,
        '鉛の曝露は<span class="kw">精錬・蓄電池の製造解体・鉛ライニング・'
        '絵具や光学ガラスの製造</span>で、主に吸入による。'
        '<span class="kw4">液晶パネル製造には用いられず、'
        '慢性曝露で呼吸器症状も示さない</span>。'
        '鉛の標的は骨髄（貧血）・末梢神経・腹部疝痛である。'),
       ('b', 'ヒ 素', False,
        'ヒ素は化合物半導体ガス・医薬品や染料の原料・顔料の製造で曝露する。'
        '<span class="kw4">慢性曝露の主戦場は皮膚粘膜（黒皮症・Bowen病・皮膚癌）'
        'と鼻中隔穿孔・肺癌・末梢神経障害で、間質性肺炎は呈さない</span>。'),
       ('c', '水 銀', False,
        '金属水銀を用いる工場は現在まれ。'
        '慢性曝露では全身倦怠感や食思不振に始まり、'
        '<span class="kw4">振戦・不眠・せん妄などの神経症状</span>を呈する。'
        '無機水銀なら腎障害。<u>いずれも間質性肺炎ではない</u>。'),
       ('d', 'クロム', False,
        'クロムは合金・メッキ・皮革なめし・顔料製造・触媒と曝露機会が多いが、'
        '<span class="kw4">皮膚からはアレルギー性皮膚炎・皮膚潰瘍・皮膚癌、'
        '呼吸器からは鼻中隔穿孔・肺癌</span>であり、'
        '間質性肺炎の報告は極めてまれである。'),
       ('e', 'インジウム', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">液晶パネル製造工程では、高い透明度と導電性をもつ'
        'インジウム・スズ酸化物〈ITO〉が使われる</span>。'
        '<span class="kw3">慢性吸入曝露で間質性肺炎および肺癌</span>を引き起こすことが'
        '2010年に疫学的に明らかとなり、'
        '<span class="kw">6か月ごとの特殊健康診断（血清インジウム濃度・KL-6の測定を含む）</span>'
        'が義務付けられた。2013年に特化則の「特別管理物質」に指定されている。')],
      '液晶パネル製造＋間質性肺炎＝インジウム肺（ITO）',
      patho=('□ インジウム肺——「液晶パネル」の一語で決まる新しい職業性肺疾患',
             '<p><span class="kw3">インジウム・スズ酸化物 Indium Tin Oxide〈ITO〉</span>は、'
             '<span class="kw3">高い透明度と導電性を併せ持つ</span>という'
             '他に代えがたい性質があり、'
             '<span class="kw3">液晶パネルやプラズマディスプレイパネルの'
             '透明電極材料</span>として2000年ごろから需要が急伸した。</p>'
             '<p>問題になるのは<span class="kw3">研磨・切削の工程で発生する微細粒子の'
             '慢性吸入曝露</span>である。'
             '<span class="kw3">直径1μm前後の粒子は肺胞まで到達し、'
             '肺胞マクロファージに貪食されても分解されずに残る</span>ため、'
             '慢性の炎症と線維化が進み、'
             '<span class="kw3">間質性肺炎（両肺のすりガラス陰影）</span>、'
             'さらには肺癌に至る。</p>'
             '<p><span class="kw3">BMは血清インジウム濃度と'
             'KL-6（間質性肺炎のマーカー）</span>の2本立てで、'
             '<u>曝露量そのもの（インジウム）と、その結果起きた障害（KL-6）を'
             '同時に追いかける</u>設計になっている。'
             '<span class="kw">2004年に厚生労働省が曝露低減措置を指示、'
             '2010年に疫学データが確立、2013年に特化則の「特別管理物質」に指定</span>'
             'という経緯も出題される。</p>'),
      deep=('□ 職業歴のひと言で疾患が決まる型——キーワード対応表',
            '<p>本問は<span class="kw3">「4年前から液晶パネル製造工場」という'
            'ひと言だけで答えが決まる</span>典型例である。'
            '<span class="kw3">中毒・職業病の症例問題は、'
            '検査所見よりも先に「どこで何をしていたか」を読む</span>のが鉄則で、'
            '<u>職業歴が書かれていない中毒問題は無い</u>と思ってよい。</p>'
            '<table class="tb"><tr><th>症例文に出てくる仕事・場所</th>'
            '<th>疑う物質と疾患</th></tr>'
            '<tr><td><span class="kw3">液晶パネル製造</span></td>'
            '<td><span class="kw3">ITO → 間質性肺炎（インジウム肺）</span></td></tr>'
            '<tr><td><span class="kw3">印刷工場（校正印刷）</span></td>'
            '<td><span class="kw3">ジクロロプロパン → 胆管癌</span>（→第2章 NO.6）</td></tr>'
            '<tr><td><span class="kw3">吹付け塗装・シンナー</span></td>'
            '<td><span class="kw3">トルエン・キシレン・スチレン</span>'
            '（→第2章 NO.5・NO.7）</td></tr>'
            '<tr><td><span class="kw3">蓄電池の製造・解体</span></td>'
            '<td><span class="kw3">金属鉛 → 貧血</span></td></tr>'
            '<tr><td><span class="kw3">アーク溶接</span></td>'
            '<td><span class="kw3">紫外線 → 電気性眼炎</span>（→第7章 NO.42）／'
            '金属フューム</td></tr>'
            '<tr><td><span class="kw3">ガラス工・溶鉱炉</span></td>'
            '<td><span class="kw3">赤外線 → 白内障</span>（→第7章 NO.48）</td></tr>'
            '<tr><td><span class="kw3">チェーンソー・鋲打器</span></td>'
            '<td><span class="kw3">手腕系振動障害 → Raynaud現象</span>（→第7章 NO.41）</td></tr>'
            '<tr><td><span class="kw3">穀物貯蔵庫・マンホール</span></td>'
            '<td><span class="kw3">酸素欠乏症</span>（→第6章 NO.25・NO.29）</td></tr>'
            '<tr><td><span class="kw3">ドライクリーニング（過去）</span></td>'
            '<td><span class="kw3">トリクロロエチレン → 肝機能障害</span></td></tr>'
            '<tr><td><span class="kw3">染料・ゴム工業（過去）</span></td>'
            '<td><span class="kw3">芳香族アミン → 膀胱癌</span></td></tr>'
            '<tr><td colspan="2"><span class="kw3">逆に言えば、'
            '職業歴が書いてあるのに使わずに解けた気になったら、'
            'たいてい間違えている</span></td></tr></table>'),
      point=('□ 国試ポイント：職業性の間質性肺疾患を並べる',
             '<ol>'
             '<li><span class="kw3">吸入曝露で間質性肺炎・肉芽腫をきたす代表</span>——'
             '<span class="kw3">ITO（インジウム肺）</span>／'
             '<span class="kw3">ベリリウム（類上皮細胞性肉芽腫症＝ベリリウム肺）</span>／'
             '<span class="kw3">石綿（石綿肺）</span>／'
             '<span class="kw3">遊離ケイ酸（珪肺）</span>／'
             '<span class="kw">超硬合金肺（コバルト）</span>。</li>'
             '<li><span class="kw3">粒子の大きさが到達する深さを決める</span>——'
             '<u>直径10μm以上は上気道で捕まり、'
             '1〜5μm前後が肺胞まで届く</u>。'
             '設問がわざわざ<span class="kw">「直径1μm前後の微細粒子」</span>と'
             '書いているのは、<u>肺胞に到達しうるサイズ</u>だと示すため。</li>'
             '<li><span class="kw3">KL-6</span>はⅡ型肺胞上皮由来のマーカーで、'
             '間質性肺炎の活動性を反映する。'
             '<span class="kw">SP-A・SP-D</span>も同様。</li>'
             '<li><span class="kw3">特化則の「特別管理物質」＝発がん性の強い物質</span>——'
             'ITO・ジクロロプロパン・ホルムアルデヒド・オルト-トルイジン・'
             'ベンゼン・石綿など。'
             '<u>作業記録を30年間保存する義務</u>がある（潜伏期が長いため）。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">じん肺法（じん肺健康診断・管理区分1〜4）</span>、'
             '<span class="kw">石綿健康被害救済法</span>、'
             '<span class="kw">過敏性肺炎（農夫肺・夏型・加湿器肺）</span>——'
             'こちらは<u>抗原からの隔離で改善する</u>点がじん肺・インジウム肺と違う。</li>'
             '</ol>')),
]

SECTIONS = [
    ('s1', '金属中毒', '', 0),
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


CH_NUM = 1
CH_NAME = '金属中毒'


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC中毒・職業病 第{CH_NUM}章 {CH_NAME} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#65A30D')
                .replace('--orl:#FCE4EC', '--orl:#ECFCCB')
                .replace('--ord:#880E4F', '--ord:#365314'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_hisshu = sum(1 for q in QUESTIONS if any(c == 'bh' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MEC \'26 | 中毒・職業病</div>'
        f'<h1>第<span>{CH_NUM}</span>章｜{CH_NAME}</h1>'
        f'<div class="hs">解答・解説集 全{len(QUESTIONS)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(QUESTIONS)}</strong>問</div>'
        f'<div class="sp"><strong>必修</strong> {n_hisshu}問</div>'
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
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {OUT.name}  {len(QUESTIONS)}q (hisshu {n_hisshu}, img {n_img})  '
          f'{OUT.stat().st_size//1024}KB')


if __name__ == '__main__':
    emit()
