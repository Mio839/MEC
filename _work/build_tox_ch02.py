# -*- coding: utf-8 -*-
"""
中毒・職業病 第2章「有機溶剤中毒」(NO.5-9) の章別HTML(中毒・職業病/ch02_yuki_yozai.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_tox_ch01.py と同方式。

問題文・選択肢はPDF(中毒・職業病 印刷 p.10-14／PDF p.16-20)を書き起こし、
正解/正答率は巻末解答一覧表(PDF p.66-67)から。
解説はPDFのレジュメ部（PDF p.13-15）と国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全5問（画像0枚）。

■ 章を貫く4本の筋
  ① **有機溶剤は「揮発性が高い＝経気道」＋「脂溶性が高い＝経皮」の二刀流**。
     だから<u>防毒マスクをしていても、半袖と軍手なら前腕から入る</u>（NO.5）。
  ② **BMは代謝産物の名前を丸暗記するだけで点になる**——
     トルエン＝馬尿酸／キシレン＝メチル馬尿酸／スチレン＝マンデル酸／
     ベンゼン＝フェノール／ノルマルヘキサン＝ヘキサンジオン／
     トリクロロエチレン＝トリクロロ酢酸。
  ③ **BMが高かったら、まずやるのは「作業状況の確認（職場巡視）」**（NO.7）。
     自宅療養も禁煙指導も、曝露そのものを減らさないので「まず」ではない。
  ④ **職業歴のひと言で疾患が決まる**——印刷工＋胆管癌＝ジクロロプロパン（NO.6）。

⚠️ **NO.5 は「2つ選べ」（c,e）**。ok の個数は必ず2にすること。
⚠️ **NO.8 は否定形**（治療方針決定に「有用でない」もの）。
⚠️ **本章の最難は NO.5（116C-59・正答率49%＝本章で最低）**＝シンナーの成分は1つではなく
   トルエン・キシレン・スチレンなどの混合物なので、**BMの代謝物も複数が同時に上がる**。
⚠️ 5問すべてに正答率があり、採点除外・必修バッジの問題は無い。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '中毒・職業病' / 'ch02_yuki_yozai.html'

Q_START = 5

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ',
      'f': 'ｆ', 'g': 'ｇ', 'h': 'ｈ', 'i': 'ｉ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    imgs = imgs or []
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)


# ------------------------------------------------------------------
# 章を通して何度も参照する表
# ------------------------------------------------------------------

# ① 有機溶剤とその生物学的モニタリング〈BM〉
SOLVENT_TABLE = (
    '<table class="tb"><tr><th>有機溶剤</th><th>主な健康障害</th>'
    '<th><span class="kw3">BM（尿中代謝産物）</span></th></tr>'
    '<tr><td><span class="kw3">ベンゼン C<sub>6</sub>H<sub>6</sub></span></td>'
    '<td><span class="kw3">骨髄抑制 → 再生不良性貧血・白血病</span>（発がん物質）。'
    '<u>ベンゼンゴム糊は1959年に製造使用禁止</u></td>'
    '<td><span class="kw3">尿中フェノール</span>'
    '（水溶性にしないと尿に出てこない）</td></tr>'
    '<tr><td><span class="kw3">トルエン C<sub>6</sub>H<sub>5</sub>CH<sub>3</sub></span></td>'
    '<td><span class="kw3">依存性</span>あり。高濃度曝露で幻覚、連用で大脳活動の低下。'
    '低濃度慢性曝露で疲労感・頭痛・情緒不安定・食思不振</td>'
    '<td><span class="kw3">尿中馬尿酸</span></td></tr>'
    '<tr><td>キシレン</td><td>トルエンと同様</td>'
    '<td><span class="kw3">尿中メチル馬尿酸</span></td></tr>'
    '<tr><td>スチレン</td>'
    '<td>急性＝粘膜刺激／慢性＝頭痛・傾眠・倦怠感などの神経症状</td>'
    '<td><span class="kw3">尿中マンデル酸</span>・フェニルグリオキシル酸</td></tr>'
    '<tr><td><span class="kw3">ノルマルヘキサン</span></td>'
    '<td><span class="kw3">多発神経炎（軸索障害）</span></td>'
    '<td><span class="kw3">尿中ヘキサンジオン</span></td></tr>'
    '<tr><td><span class="kw3">トリクロロエチレン</span>'
    '（塩化炭化水素）</td>'
    '<td><span class="kw3">肝機能障害</span>（有機塩素の特徴）・変異原性。'
    '脱脂洗浄剤。<u>かつてはドライクリーニングに使われた</u></td>'
    '<td><span class="kw3">尿中トリクロロ酢酸</span>・総三塩化物</td></tr>'
    '<tr><td>アニリン・ニトロベンゼン'
    '（芳香族アミノ・ニトロ化合物）</td>'
    '<td><span class="kw3">メトヘモグロビン血症 → チアノーゼ</span>'
    '（Fe<sup>2+</sup>がFe<sup>3+</sup>に酸化され酸素運搬能を失う）。'
    '治療は<span class="kw3">メチルチオニニウム（メチレンブルー）静注</span></td>'
    '<td>血中メトヘモグロビン</td></tr>'
    '<tr><td><span class="kw3">β-ナフチルアミン・ベンジジン</span>ほか</td>'
    '<td><span class="kw3">膀胱癌</span>（1972年に製造使用禁止）</td>'
    '<td><span class="kw3">尿沈渣の細胞診</span></td></tr>'
    '<tr><td><span class="kw3">塩化ビニルモノマー</span></td>'
    '<td><span class="kw3">肝血管肉腫</span>・全身性強皮症・末節骨溶解症</td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">ジクロロプロパン</span></td>'
    '<td><span class="kw3">胆管癌</span>（校正印刷工）。'
    '2013年に特化則の「特別管理物質」</td><td>—</td></tr>'
    '<tr><td><span class="kw3">メタノール</span></td>'
    '<td><span class="kw3">蟻酸に代謝され視神経毒性</span>。'
    '治療は<span class="kw3">ホメピゾール</span>'
    '（または高濃度エタノール）＝ADHの競合的阻害</td><td>—</td></tr>'
    '<tr><td>ホルムアルデヒド</td>'
    '<td>粘膜刺激・<span class="kw3">シックハウス症候群</span>。'
    '特化則の「特別管理物質」</td><td>—</td></tr>'
    '<tr><td>トリレンジイソシアネート〈TDI〉</td>'
    '<td><span class="kw4">中毒ではなくアレルギー性機序</span>で'
    '<span class="kw3">喘息様発作</span>（ウレタンフォームの発泡剤）</td>'
    '<td>—</td></tr>'
    '<tr><td>PCB</td>'
    '<td><span class="kw3">塩素挫創・肝障害</span>／'
    '<span class="kw3">カネミ油症（新生児黒皮症）</span>。'
    '生物濃縮</td><td>—</td></tr>'
    '<tr><td colspan="3"><span class="kw3">覚え方は「語尾」で束ねる</span>——'
    '<span class="kw3">トル<u>エン</u>→馬尿酸／キシレン→<u>メチル</u>馬尿酸</span>'
    '（トルエンにメチル基が1つ増えるとキシレン、'
    'だから代謝物にも「メチル」が付く）、'
    '<span class="kw3">ス<u>チ</u>レン→マン<u>デ</u>ル酸</span>、'
    '<span class="kw3">ベンゼン→フェノール</span>'
    '（どちらもベンゼン環1つ）</td></tr></table>')

# ② 有機溶剤の総論——なぜ「マスクだけでは足りない」のか
ROUTE_TABLE = (
    '<table class="tb"><tr><th>有機溶剤の性質</th><th>そこから決まること</th></tr>'
    '<tr><td><span class="kw3">揮発性が高い</span></td>'
    '<td><span class="kw3">容易に経気道吸収</span>される'
    ' → 局所排気装置と防毒マスクが要る</td></tr>'
    '<tr><td><span class="kw3">脂溶性が高い</span></td>'
    '<td><span class="kw3">容易に経皮吸収</span>される'
    ' → <span class="kw4">長そで・長ズボン＋（有機溶剤を通さない）手袋が要る</span>。'
    '<u>軍手は有機化合物を自由に通す</u>ので防護具にならない</td></tr>'
    '<tr><td>脂溶性が高い（続き）</td>'
    '<td><span class="kw3">血液-脳関門を通る</span> → '
    '中枢神経症状（頭痛・めまい・酩酊・依存）が出やすい</td></tr>'
    '<tr><td><span class="kw3">複数の溶剤に同時に曝露される</span></td>'
    '<td>シンナーのような<span class="kw3">混合物では'
    'BMの代謝物も複数が同時に上がる</span>（→ NO.5）</td></tr>'
    '<tr><td>有害業務の中で最多</td>'
    '<td><span class="kw3">特殊健康診断の受診者数は有機溶剤が第1位</span></td></tr>'
    '<tr><td colspan="2"><span class="kw3">総論の一行</span>——'
    '<span class="kw3">「有機溶剤は鼻からも皮膚からも入る」</span>。'
    '<span class="kw4">毒性が高い物質（四アルキル鉛など）では'
    '防毒マスクだけでは無効</span>で、'
    '<u>作業環境管理（局所排気）と作業管理（保護衣）を組み合わせて初めて安全</u>になる'
    '</td></tr></table>')

# ③ 尿中馬尿酸の分布（トルエンの特殊健康診断）
BUNPU_TABLE = (
    '<table class="tb"><tr><th>分布</th><th>尿中馬尿酸</th><th>意味</th>'
    '<th>産業医の対応</th></tr>'
    '<tr><td><span class="kw3">分布1</span></td><td>1g/L 以下</td>'
    '<td>職業性曝露はほぼ無い</td><td>経過観察</td></tr>'
    '<tr><td><span class="kw">分布2</span></td><td>1g/L 超 2.5g/L 以下</td>'
    '<td>曝露あり。境界域</td><td>作業状況の確認と改善指導</td></tr>'
    '<tr><td><span class="kw4">分布3</span></td>'
    '<td><span class="kw4">2.5g/L 超</span></td>'
    '<td><span class="kw4">明らかな職業性曝露</span></td>'
    '<td><span class="kw3">職場巡視して作業状況を確認</span>し、'
    '作業環境測定の管理区分が2・3なら事業者に環境改善を求める</td></tr>'
    '<tr><td colspan="4"><span class="kw3">我が国の有害業務の職場は'
    'ほとんどが管理区分1（適切）</span>——'
    'だから<span class="kw3">実際に問題になるのは'
    '「作業環境に問題がないのに、曝露濃度だけ高い」ケース</span>で、'
    '<u>原因は作業姿勢・防護具・休憩時の習慣にある</u>。'
    '<span class="kw">トルエンは空気より重いので床に溜まる</span>'
    '——膝を床につけて塗装し、休憩時にその膝へ手を置いて喫煙する、'
    'といった場面を職場巡視で初めて目撃できる</td></tr></table>')

# ④ 中毒患者を診るときに勤務先へ照会するもの
SDS_TABLE = (
    '<table class="tb"><tr><th>照会するもの</th><th>治療にどう効くか</th></tr>'
    '<tr><td><span class="kw3">安全データシート〈SDS〉</span></td>'
    '<td><span class="kw3">化学物質の名称・成分情報・危険有害性の要約・'
    '必要な応急処置</span>が書かれている。'
    '<span class="kw3">事業所には掲示または備付けが法令で義務付け</span>られており、'
    '<u>「最も有用なものを1つ選べ」ならこれが答え</u></td></tr>'
    '<tr><td><span class="kw3">曝露時の作業内容</span></td>'
    '<td>おおよその<span class="kw3">曝露量と曝露部位</span>を推定できる</td></tr>'
    '<tr><td><span class="kw3">直近の定期健康診断の結果</span></td>'
    '<td><span class="kw3">曝露前のベースライン</span>——'
    '曝露後の値と比較でき、'
    '<u>もともと肝機能が低ければ肝負荷のある薬を避けられる</u></td></tr>'
    '<tr><td><span class="kw3">直近の特殊健康診断の結果</span></td>'
    '<td>同上。加えて<span class="kw3">その職場で何に曝露しうるか</span>が'
    '検査項目から逆算できる</td></tr>'
    '<tr><td><span class="kw4">ストレスチェックの結果</span></td>'
    '<td><span class="kw4">高ストレス者であっても今回の事故と関連がなく、'
    '治療方針に何の影響も与えない</span></td></tr>'
    '<tr><td colspan="2"><span class="kw3">判断基準はただ1つ、'
    '「その情報で治療が変わるか」</span>。'
    '<u>変わらない情報は、たとえ正しい情報でも「有用でない」</u></td></tr></table>')

IMG = '中毒・職業病/images/'

QUESTIONS = [
    # ------------------------------------------------------------------ NO.5
    Q('116C-59', 49, [],
      '40歳の男性。職場の特殊健康診断で受診した。'
      '<span class="kw">工場でシンナーを使用した吹付け塗装作業</span>を担当している。'
      '自覚症状は特にない。AST 80U/L、ALT 60U/L。喫煙は20本/日を15年間。'
      '飲酒はビール500mL/日を20年間。工場内の局所排気装置は稼働している。'
      '<span class="kw">作業着は半袖で、防毒マスク、軍手は常時着用</span>している。'
      '特殊健康診断で測定した検体の代謝物濃度が高濃度であった。<br>'
      '<strong>高濃度を示す代謝物はどれか。2つ選べ。</strong>',
      [('a', '尿中デルタアミノレブリン酸', False,
        '<span class="kw4">尿中δ-ALAは金属鉛のBM</span>である。'
        '鉛はポルフィリン合成酵素を阻害するため、'
        'その手前の代謝産物であるδ-ALAが尿に溢れ出る。'
        '<u>本例は鉛取扱い業務ではない</u>。'),
       ('b', '血中アセトアルデヒド', False,
        'アセトアルデヒド脱水素酵素活性の低い人が作業中に飲酒すれば上昇しうるが、'
        '<span class="kw4">そもそも特殊健康診断の測定項目ではない</span>。'
        '飲酒歴に引きずられて選ばせる肢。'),
       ('c', '尿中マンデル酸', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">シンナーに含まれるスチレンのBM対象物質</span>。'
        'スチレンは尿中マンデル酸とその酸化物であるフェニルグリオキシル酸として測る。'),
       ('d', '血中コチニン', False,
        '<span class="kw3">コチニンはニコチンの代謝産物</span>で受動喫煙の指標に使われるが、'
        '<span class="kw4">特殊健康診断の測定項目ではない</span>。'
        '喫煙歴に引きずられて選ばせる肢。'
        '（コチニン cotinine の名はニコチン nicotine のアナグラム。）'),
       ('e', '尿中馬尿酸', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">シンナーに含まれるトルエンのBM対象物質</span>。'
        'トルエンは肝で酸化されて馬尿酸となり尿中に排泄される。')],
      'シンナー＝混合溶剤。トルエン(馬尿酸)とスチレン(マンデル酸)が同時に上がる',
      patho=('□ シンナーは「1つの物質」ではない——だからBMも複数が同時に上がる',
             '<p><span class="kw3">シンナー thinner は塗料を薄めて粘度を下げるための'
             '溶剤の「混合物」</span>であり、'
             '<span class="kw3">トルエン・キシレン・スチレンなどの芳香族炭化水素に、'
             'エステル・ケトン類が加わった複数成分</span>からなる。'
             '<span class="kw3">単一物質ではないので、'
             '特殊健康診断でも複数の代謝産物が同時に高値を示す</span>——'
             'ここが「2つ選べ」の根拠である。</p>'
             '<p>本例の作業環境と作業管理を読み分けると、'
             '<span class="kw3">局所排気装置は稼働しているので'
             '作業環境（空気中濃度）に問題はなさそう</span>である。'
             'ところが<span class="kw4">作業着が半袖で、手には軍手</span>——'
             '<span class="kw3">有機溶剤は脂溶性が高く容易に経皮吸収される</span>ので、'
             '<span class="kw4">軍手は有機化合物を自由に通し、'
             '半袖では前腕がそのまま曝露面になる</span>。'
             '<u>防毒マスクで気道は守れていても、皮膚から入っている</u>という'
             '「作業管理の失敗」の典型である。</p>' + ROUTE_TABLE),
      deep=('□ BMの代謝物は「対応表」で覚える——名前だけで点になる',
            '<p>本問の正答率が49%と本章で最低なのは、'
            '<span class="kw4">「シンナー＝トルエン」と1対1で覚えていて、'
            '2つ目が出てこない</span>ためである。'
            '<span class="kw3">シンナーはトルエン・キシレン・スチレンの混合物</span>と'
            '覚え直せば、<u>選択肢の中で該当するのは馬尿酸とマンデル酸の2つ</u>と決まる。</p>'
            '<p>また<span class="kw3">誤りの3肢は「BMではあるが対象が違う」（δ-ALA＝鉛）か、'
            '「そもそも特殊健診の項目でない」（アセトアルデヒド・コチニン）</span>という'
            '2種類の外し方になっている。'
            '<span class="kw3">症例文の喫煙歴・飲酒歴は、'
            'まさに ｂ と ｄ を選ばせるために置かれた餌</span>で、'
            '<u>特殊健康診断は「その有害業務で曝露する物質」だけを測る</u>という'
            '一線を引ければ引っかからない。</p>' + SOLVENT_TABLE),
      point=('□ 国試ポイント：特殊健康診断と有機溶剤',
             '<ol>'
             '<li><span class="kw3">特殊健康診断は有害業務に従事する労働者に'
             '雇入時・配置替え時・6か月以内ごとに1回</span>。'
             '<span class="kw3">受診者数が最も多いのが有機溶剤</span>で、'
             '有機溶剤中毒予防規則（有機則）が根拠。</li>'
             '<li><span class="kw3">有機溶剤の健康診断項目</span>——'
             '問診、<span class="kw">尿中蛋白</span>、'
             '<span class="kw">肝機能検査（AST・ALT・γ-GT）</span>、'
             '<span class="kw3">物質ごとのBM（尿中代謝産物）</span>。'
             '<u>本例のAST 80・ALT 60という肝機能異常は、'
             '溶剤・飲酒のどちらでも説明できるので鑑別には使えない</u>。</li>'
             '<li><span class="kw3">経皮吸収を止めるのは「保護衣と手袋」</span>——'
             '<span class="kw4">軍手・布手袋は有機溶剤に対して無力</span>で、'
             '溶剤に応じた耐透過性のある材質（ニトリル・フッ素ゴムなど）を選ぶ。'
             '<span class="kw">作業衣の交換頻度</span>も確認事項。</li>'
             '<li><span class="kw">労働者数50人未満の事業場には産業医の選任義務がない</span>'
             '（衛生推進者の選任にとどまる）。'
             '<u>この種の小規模な塗装工場では、産業医が不在のことが多い</u>という'
             '背景知識も本問の解説に添えられている。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">有機溶剤の急性中毒（酩酊・頭痛・意識障害）</span>、'
             '<span class="kw">トルエン依存（シンナー遊び）</span>、'
             '<span class="kw">有機溶剤等健康診断結果報告書</span>、'
             '<span class="kw">局所排気装置の定期自主検査（1年以内ごと）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.6
    Q('112F-60', 85, [],
      '38歳の男性。生来健康であったが、'
      '<span class="kw">2週間前から黄疸と右季肋部痛</span>が出現したため来院した。'
      '喫煙歴はなく、飲酒は機会飲酒。'
      '<span class="kw">20歳から印刷工場で印刷作業に従事</span>している。'
      '腹部超音波検査を施行したところ、<span class="kw">肝門部に腫瘤</span>が認められた。<br>'
      '<strong>診断のために聴取すべきなのはどれか。</strong>',
      [('a', '職場の分煙状況', False,
        '<span class="kw4">受動喫煙で肝胆道系疾患は生じない</span>。'
        '受動喫煙が問題になるのは肺癌・虚血性心疾患・脳卒中・小児の喘息などである。'),
       ('b', '最近5年間の健診受診の状況', False,
        '職場の定期健康診断の肝機能検査はALT・AST・γ-GTだが、'
        '<span class="kw4">初期の肝門部腫瘤では有意に上昇しない</span>'
        '（胆道に浸潤すればALP・ビリルビンが上がるが、これらは定期健診の項目にない）。'
        'しかも肢は<u>「受診の状況」であって「受診結果の内容」ではない</u>——'
        '受けたか否かのイエス・ノーからは何も分からない。'),
       ('c', '最近3か月の時間外勤務の状況', False,
        '<span class="kw4">過重労働で肝胆道系疾患は生じない</span>。'
        '長時間労働が問題になるのは<u>脳・心臓疾患（過労死）とメンタルヘルス</u>である。'),
       ('d', '作業時の防塵マスクの使用状況', False,
        '<span class="kw4">防塵マスクは粒子状物質を除くためのもので、'
        '印刷工程では粉塵に曝露されない</span>。'
        '有害な<u>ガス・蒸気</u>を防ぐには<span class="kw3">防毒マスク</span>が要る'
        '（ジクロロプロパンを1％以上含む有機物質を局所排気装置のない環境で扱うときは'
        '有機ガス用防毒マスクの着用が求められる）。'),
       ('e', '過去に作業で使用した有機溶剤の種類', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">2012年に大阪市の校正印刷工場で若年労働者を含む'
        '胆管癌の多発が発覚</span>し、疫学調査から'
        '<span class="kw3">ジクロロプロパン</span>が原因と推定され、'
        '2013年に<span class="kw">特化則の「特別管理物質」（発がん関連物質）</span>に'
        '指定された。'
        '<u>印刷業の肝胆道系疾患をみたら、ジクロロプロパン取扱いの職業歴を確認する</u>。')],
      '印刷工＋胆管癌＝ジクロロプロパン。過去に使った有機溶剤を聞く',
      patho=('□ 校正印刷工の胆管癌——記述疫学から規制が動いた実例',
             '<p><span class="kw3">ジクロロプロパン C<sub>3</sub>H<sub>6</sub>Cl<sub>2</sub></span>は'
             'もともと粘膜刺激性物質として有機溶剤中毒予防規則（有機則）で'
             '規制されているだけの物質だった。ところが——</p>'
             '<ol>'
             '<li><span class="kw3">2012年5月</span>、大阪市のオフセット校正印刷会社'
             '（労働者100人強、うち印刷工は約半数）で'
             '<span class="kw3">直近5人が胆管癌を発症し、うち4人が死亡</span>していた'
             '事実が発覚した。'
             '<span class="kw3">発症年齢は25〜45歳と若く</span>'
             '（60歳未満の胆管癌罹患率は10万対10程度）、'
             '<u>作業との関連が強く示唆された</u>。'
             '過去にさかのぼると17人が発症し9人が死亡していた。</li>'
             '<li>この時点でのエビデンスレベルは'
             '<span class="kw3">記述疫学</span>にすぎなかったが、'
             '厚生労働省は全国の校正印刷工場を一斉調査し、'
             '他工場でも発症していること・主因がジクロロプロパンであることを確認、'
             '<span class="kw3">2013年3〜6月に労働災害として認定</span>した。</li>'
             '<li>同年、<span class="kw3">IARCがジクロロプロパンを'
             '「発がん性がある」グループ1</span>に指定し、'
             '<span class="kw3">特化則の「特別管理物質」</span>にも追加された。</li>'
             '<li>なお当該印刷会社は<span class="kw4">産業医選任義務を怠っており、'
             '罰金刑に処せられた</span>。</li>'
             '</ol>'
             '<p><span class="kw3">この一連の流れは「職業がん」の教科書的な物語</span>で、'
             '<u>①若年発症 ②同一職場に集積 ③まれな癌</u>という3点が揃ったら'
             '職業曝露を疑う、という診断のかたちを示している。</p>'),
      deep=('□ 「聞くべきこと」を選ぶ問題は、答えが変わる情報だけを残す',
            '<p>本問は<span class="kw3">「診断のために聴取すべきなのはどれか」</span>という'
            '問い方で、<span class="kw3">誤りの4肢はいずれも'
            '「産業保健では大事だが、この患者の診断には結びつかない」もの</span>で'
            '構成されている。'
            '<span class="kw3">分煙＝呼吸器・循環器／過重労働＝脳心疾患とメンタル／'
            '防塵マスク＝粉塵（じん肺）</span>と、'
            '<u>それぞれ別の職業病の入口</u>になっている点に注意する。</p>'
            '<p><span class="kw3">読み筋は「まれな癌＋若年＋特定の職種」</span>。'
            '38歳で肝門部腫瘤（胆管癌）は明らかに若すぎ、'
            '喫煙も飲酒もない＝一般的なリスク因子で説明できない。'
            '<span class="kw3">残るのは職業歴だけ</span>で、'
            'しかも症例文は<u>「20歳から印刷工場で印刷作業」と18年の曝露歴</u>を'
            'わざわざ書いている。</p>'
            '<table class="tb"><tr><th>防護具</th><th>防げるもの</th>'
            '<th>防げないもの</th></tr>'
            '<tr><td><span class="kw3">防塵マスク</span></td>'
            '<td><span class="kw3">粒子状物質（粉塵・ヒューム・ミスト）</span></td>'
            '<td><span class="kw4">ガス・蒸気（有機溶剤）</span></td></tr>'
            '<tr><td><span class="kw3">防毒マスク</span></td>'
            '<td><span class="kw3">ガス・蒸気</span>'
            '（吸収缶を対象物質で選ぶ：有機ガス用・酸性ガス用など）</td>'
            '<td><span class="kw4">酸素欠乏環境では役に立たない</span>'
            '——空気を濾すだけで酸素は作れない（→第6章）</td></tr>'
            '<tr><td><span class="kw3">送気マスク・空気呼吸器</span></td>'
            '<td><span class="kw3">酸素欠乏・高濃度の有毒ガス</span></td>'
            '<td>—（清浄な空気を外から供給する）</td></tr>'
            '<tr><td colspan="3"><span class="kw4">酸素欠乏やH<sub>2</sub>Sの'
            '救助に防毒マスクで入ると救助者が二次被害を受ける</span>——'
            '<u>この区別は第6章 NO.28・NO.29 で再び問われる</u></td></tr></table>'),
      point=('□ 国試ポイント：職業がんと潜伏期',
             '<ol>'
             '<li><span class="kw3">職業がんの3条件</span>——'
             '<span class="kw3">①同一職場に集積 ②好発年齢より若い ③まれな組織型・部位</span>。'
             'この3つが揃ったら疫学調査へ。</li>'
             '<li><span class="kw3">代表的な職業がん</span>——'
             'ジクロロプロパン→<span class="kw3">胆管癌</span>／'
             '芳香族アミン（β-ナフチルアミン・ベンジジン）→<span class="kw3">膀胱癌</span>／'
             '石綿→<span class="kw3">肺癌・悪性胸膜中皮腫</span>／'
             'ベンゼン→<span class="kw3">白血病</span>／'
             '塩化ビニルモノマー→<span class="kw3">肝血管肉腫</span>／'
             'クロム・ニッケル・ヒ素→<span class="kw3">肺癌</span>／'
             'ITO→<span class="kw3">間質性肺炎〜肺癌</span>。</li>'
             '<li><span class="kw3">潜伏期が長い（10〜40年）</span>ので、'
             '<span class="kw3">特別管理物質は作業記録を30年間保存</span>する義務がある。'
             '<u>「過去に」使用した溶剤を聞くのはこのため</u>。</li>'
             '<li><span class="kw3">IARCの発がん性分類</span>——'
             '<span class="kw3">グループ1＝ヒトに対して発がん性がある</span>／'
             '2A＝おそらくある／2B＝可能性がある／3＝分類できない。'
             '<u>ジクロロプロパン・ホルムアルデヒド・オルト-トルイジン・PFOAはグループ1</u>。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">労災認定（業務上疾病）</span>、'
             '<span class="kw">記述疫学 → 分析疫学（症例対照・コホート）という段階</span>、'
             '<span class="kw">産業医の選任義務（労働者50人以上）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.7
    Q('109A-55', 94, [],
      '48歳の男性。工場で吹きつけ作業を担当している。'
      '特殊健康診断で<span class="kw">尿中馬尿酸が2.8g/L</span>'
      '（分布1は1g/L以下、分布2は1g/L超2.5g/L以下、'
      '<span class="kw">分布3は2.5g/L超</span>）であった。'
      '自覚症状は特にない。喫煙は10本/日を25年間。飲酒はビール1,000mL/日を25年間。<br>'
      '<strong>産業医がまずとるべき措置はどれか。</strong>',
      [('a', '作業状況の確認', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">馬尿酸を測っている＝吹付け作業でトルエン曝露の危険がある</span>と'
        '推定でき、しかも結果は'
        '<span class="kw3">分布3（明らかな職業性曝露あり）</span>である。'
        '<span class="kw3">まず職場巡視して作業状況を確認する</span>のが産業医の役目。'
        '作業環境測定の管理区分が2（改善の余地あり）・3（不適切）なら'
        '事業者に環境改善を求める。'),
       ('b', '自宅療養の指示', False,
        '<span class="kw4">この労働者に自覚症状はない</span>ので就労不能ではない。'
        'そもそも<span class="kw4">自宅療養を命じるのは事業者であって産業医ではない</span>'
        '（産業医は意見を述べる立場）。'),
       ('c', '職場内禁煙の確認', False,
        '喫煙歴は長く飲酒も適量を超えており、'
        '職場の健康増進を担う産業医がこれを放置してよいわけではないが、'
        '<span class="kw4">禁煙とトルエンの職業性曝露は無関係</span>。'
        '設問は<u>「まずとるべき措置」</u>を問うている。'),
       ('d', '貧血の有無の確認', False,
        '<span class="kw4">貧血の検査が必要なのは鉛取扱い業務</span>であり、'
        '本例にその記載はない。'
        '<u>「有害業務が違えば見るべき検査も違う」</u>という基本。'),
       ('e', 'ストレスの有無の確認', False,
        '<span class="kw4">ストレスとトルエンの職業性曝露は無関係</span>。'
        'ストレスの評価はストレスチェック制度の枠組みで行う。')],
      'BMが高い＝まず職場巡視して作業状況を確認する',
      patho=('□ BMが高かったとき、産業医は何から手をつけるか',
             '<p><span class="kw3">尿中馬尿酸はトルエンのBM</span>である。'
             '吹付け（塗装）作業で馬尿酸を測っているということは、'
             '<span class="kw3">その職場でトルエン曝露が想定されている</span>ということに'
             'ほかならない。そして結果は'
             '<span class="kw4">2.8g/L＝分布3</span>、'
             'すなわち<span class="kw3">明らかな職業性曝露がある</span>という判定である。</p>'
             '<p>ここで産業医が最初にすべきことは'
             '<span class="kw3">「なぜ体内に入ったのか」を現場で確かめること</span>、'
             'つまり<span class="kw3">職場巡視による作業状況の確認</span>である。'
             '<u>曝露を減らさない限り、次の健診でも同じ値が出る</u>。</p>' + BUNPU_TABLE),
      deep=('□ 「作業環境は良いのに曝露量だけ高い」を現場で捕まえる',
            '<p>正答率94%と易しい問題だが、'
            '<span class="kw3">この設問が本当に教えているのは'
            '「作業環境測定とBMは別物であり、両方見て初めて原因が分かる」</span>という'
            '構造である。</p>'
            '<p>PDFの解説は具体的な場面を挙げている——'
            '<span class="kw3">トルエンは空気より重いので床付近に溜まる</span>。'
            '<u>労働者が膝を床につけて塗装し、休憩時間に作業衣の膝へ手を置きながら'
            '喫煙している</u>、といった様子は'
            '<span class="kw3">職場巡視でしか見えない</span>。'
            '作業環境測定の数値（空気中濃度）は正常でも、'
            '<span class="kw4">作業姿勢と手指の汚染から経気道・経口・経皮で入り続ける</span>。</p>'
            '<table class="tb"><tr><th>状況</th>'
            '<th>作業環境測定（空気中濃度）</th><th>BM（体内量）</th>'
            '<th>直すべきもの</th></tr>'
            '<tr><td>環境も体内も正常</td><td>管理区分1</td><td>分布1</td>'
            '<td>——（維持）</td></tr>'
            '<tr><td><span class="kw4">環境が悪い</span></td>'
            '<td><span class="kw4">管理区分2・3</span></td>'
            '<td>高い</td>'
            '<td><span class="kw3">作業環境管理</span>'
            '（局所排気装置の設置・改修、有害物質の代替）</td></tr>'
            '<tr><td><span class="kw4">環境は良いのに体内だけ高い</span>'
            '（＝我が国で実際に多いパターン）</td>'
            '<td>管理区分1</td>'
            '<td><span class="kw4">分布3</span></td>'
            '<td><span class="kw3">作業管理</span>'
            '（保護具の選択と使い方・作業姿勢・作業時間・'
            '休憩前の手洗いと更衣）</td></tr>'
            '<tr><td colspan="4"><span class="kw3">産業医の一手目は'
            '「数値を見る」ではなく「現場を見る」</span>——'
            '<u>数値はすでに手元にあり、足りないのは原因の情報だから</u></td></tr></table>'),
      point=('□ 国試ポイント：産業医の権限と役割',
             '<ol>'
             '<li><span class="kw3">産業医は事業者に「勧告」する立場</span>であり、'
             '<span class="kw4">労働者に療養や休業を「命令」する権限はない</span>'
             '（命じるのは事業者）。<u>この一線がしばしば正誤の分岐になる</u>。</li>'
             '<li><span class="kw3">産業医の職務</span>——'
             '健康診断とその事後措置、'
             '<span class="kw3">作業環境の維持管理（少なくとも毎月1回の職場巡視）</span>、'
             '衛生教育、長時間労働者・高ストレス者の面接指導、'
             '衛生委員会への出席。</li>'
             '<li><span class="kw3">選任義務は労働者50人以上の事業場</span>'
             '（1,000人以上または有害業務500人以上は専属）。'
             '<u>50人未満では選任義務がなく、衛生推進者を置く</u>（→ NO.5 の背景）。</li>'
             '<li><span class="kw3">健康診断の事後措置</span>——'
             '就業場所の変更、作業の転換、労働時間の短縮、深夜業の回数減少など。'
             '<span class="kw">「まず曝露を断つ」が原則</span>で、'
             '<u>本人の生活習慣（喫煙・飲酒）の指導は並行して行うが「まず」ではない</u>。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">衛生委員会（毎月1回・労働者50人以上）</span>、'
             '<span class="kw">作業環境測定士</span>、'
             '<span class="kw">ストレスチェック制度（労働者50人以上・年1回）</span>、'
             '<span class="kw">労働安全衛生法第59条の安全衛生教育</span>（→ NO.8）。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.8
    Q('117C-36', 82, [],
      '35歳の男性。仕事中に、'
      '<span class="kw">作業で使用していた液体の化学物質を全身に浴び</span>、'
      '事故から2時間後に来院した。'
      '2年前に入職し、<span class="kw">配置転換で2週間前から現在の作業を始めたばかり</span>で、'
      '作業内容や使用していた化学物質の詳細については詳しくない。'
      '化学物質を浴びた後、すぐに緊急用のシャワーを浴び洗眼したという。'
      '意識は清明。身長171cm、体重65kg。体温36.8℃。脈拍72/分、整。血圧136/82mmHg。'
      '呼吸数17/分。眼瞼結膜、眼球結膜に充血を認める。顔面の皮膚に発赤を認める。<br>'
      '<strong>この患者の治療方針を決定するため、患者の勤務先に照会するものとして'
      '有用でないのはどれか。</strong>'
      'なお、患者の同意は得ているものとする。',
      [('a', '直近のストレスチェックの結果', True,
        '<span class="kw3">◯ これが「有用でない」＝正解</span>。'
        '<span class="kw4">高ストレス者であったとしても今回の事故との関連はなく、'
        '治療方針に何らの影響も与えない</span>。'
        '<u>「その情報で治療が変わるか」という基準を当てると、これだけが外れる</u>。'),
       ('b', '直近の定期健康診断の結果', False,
        '<span class="kw3">曝露前のベースラインとして有用</span>。'
        '曝露後の検査値と比較できるうえ、'
        '<u>事前から肝機能が低下していれば肝負荷のかかる薬を避けたり減量したりできる</u>。'),
       ('c', '直近の特殊健康診断の結果', False,
        '<span class="kw3">同じくベースラインとして有用</span>。'
        '加えて<span class="kw3">検査項目から「その職場で何に曝露しうるか」が'
        '逆算できる</span>点でも価値が高い。'),
       ('d', '安全データシート', False,
        '<span class="kw3">最も有用</span>。'
        '<span class="kw3">安全データシート〈SDS〉には化学物質の名称・成分情報・'
        '危険有害性の要約・必要な応急処置が記載</span>されており、'
        '<span class="kw">事業所には法令で掲示または備付けが義務付け</span>られている。'
        '<u>「最も有用なものを選べ」という問題なら、これが正解になる</u>。'),
       ('e', '曝露時の作業内容', False,
        '<span class="kw3">作業内容からおおよその曝露量と曝露しうる部位を推定できる</span>ので、'
        '治療の参考になる。')],
      '治療方針を変えない情報＝ストレスチェックだけが有用でない',
      ans_label='ａ　直近のストレスチェックの結果',
      patho=('□ 化学物質を浴びた患者を診るとき、外から取り寄せる情報',
             '<p>本例は<span class="kw3">皮膚粘膜刺激作用のある化学物質を全身に浴び、'
             '直後にシャワーで洗浄・洗眼してから来院</span>した患者である。'
             '幸いバイタルサインに問題はなく、'
             '<span class="kw">眼球結膜の充血と顔面の発赤</span>という'
             '局所の刺激症状にとどまっている。</p>'
             '<p>ここで問題になるのは'
             '<span class="kw4">「何を浴びたのか本人が知らない」</span>という点である。'
             '<span class="kw3">配置転換から2週間しか経っておらず、'
             '作業内容も取扱い物質の性状も分からない</span>——'
             'これは<span class="kw4">事業者が労働安全衛生法第59条の'
             '「雇入れ時・作業内容変更時の安全衛生教育」を怠っていた</span>可能性が'
             '高いことを示している。</p>'
             '<p><span class="kw3">物質が特定できなければ治療は決まらない</span>ので、'
             '医師は勤務先に情報を照会する。'
             'その際の判断基準はただ1つ、'
             '<span class="kw3">「その情報で治療方針が変わるか」</span>である。</p>'
             + SDS_TABLE),
      deep=('□ SDSは「化学物質の添付文書」——中毒診療の起点',
            '<p><span class="kw3">安全データシート Safety Data Sheet〈SDS〉</span>は'
            '化学物質を譲渡・提供する際に交付が義務付けられている文書で、'
            '<u>いわば化学物質の添付文書</u>にあたる。'
            '記載事項は16項目に標準化されており、'
            '中毒診療で直接効くのは次のあたりである。</p>'
            '<table class="tb"><tr><th>SDSの項目</th><th>診療でどう使うか</th></tr>'
            '<tr><td><span class="kw3">製品および会社情報／組成・成分情報</span></td>'
            '<td><span class="kw3">何を浴びたのかを確定する</span>'
            '（濃度・CAS番号まで分かる）</td></tr>'
            '<tr><td><span class="kw3">危険有害性の要約</span></td>'
            '<td>腐食性か・全身毒性か・発がん性か'
            ' → <span class="kw3">経過観察の長さが決まる</span></td></tr>'
            '<tr><td><span class="kw3">応急措置</span></td>'
            '<td><span class="kw3">洗浄の要否と方法、拮抗薬の有無</span></td></tr>'
            '<tr><td>物理的・化学的性質</td>'
            '<td>沸点・蒸気圧＝気道曝露のリスク／'
            '<span class="kw">pH＝酸かアルカリか（アルカリは融解壊死でより深く進む）</span></td></tr>'
            '<tr><td>暴露防止・保護措置</td>'
            '<td>医療者側の二次被害を防ぐ装備の判断</td></tr>'
            '<tr><td colspan="2"><span class="kw3">中毒診療の順序は'
            '「①自分と施設の安全 → ②除染 → ③全身管理 → ④物質の同定 → ⑤解毒薬」</span>。'
            '<u>SDSは④を一気に済ませる</u>ので、'
            '<span class="kw3">単独で「最も有用」を選ぶ問題なら常にSDS</span>が答え'
            '（→ 第3章 NO.14「落ちていた空の瓶は持ってきましたか」も同じ発想）</td></tr></table>'),
      point=('□ 国試ポイント：化学物質による事故への対応',
             '<ol>'
             '<li><span class="kw3">否定形の設問は「基準を1本立てて全肢に当てる」</span>。'
             'ここでの基準は<u>「治療方針が変わるか」</u>で、'
             '<span class="kw4">正しい情報でも治療を変えないなら「有用でない」</span>。</li>'
             '<li><span class="kw3">労働安全衛生法第59条</span>——'
             '事業者は<span class="kw3">雇入れ時・作業内容変更時・'
             '危険有害業務に就かせるとき</span>に安全衛生教育を行う義務がある。'
             '<u>配置転換2週間で何も知らない、という記載はこの義務違反を示唆</u>。</li>'
             '<li><span class="kw3">化学熱傷の初期対応は「大量の流水で長時間洗浄」</span>。'
             '<span class="kw4">中和は行わない</span>（中和熱で組織障害が増す）。'
             '<span class="kw">眼は少なくとも15〜30分以上、pHが中性化するまで洗う</span>。'
             '<u>例外的に生石灰・金属ナトリウムなど水と反応する物質は先に乾式で除去</u>。</li>'
             '<li><span class="kw3">酸とアルカリの違い</span>——'
             '<span class="kw3">酸＝凝固壊死（痂皮ができて深部への進行が止まりやすい）</span>／'
             '<span class="kw4">アルカリ＝融解壊死（深部へ進み続けるので予後が悪い）</span>。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">日本中毒情報センター（中毒110番）</span>、'
             '<span class="kw">GHS（化学品の分類および表示に関する世界調和システム）のラベル表示</span>、'
             '<span class="kw">リスクアセスメントの義務化</span>、'
             '<span class="kw">除染とゾーニング</span>（→第3章 NO.10、第7章 NO.47）。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.9
    Q('119F-13', 84, [],
      '<strong>主要な曝露源が魚介類摂取であるのはどれか。</strong>',
      [('a', '鉛', False,
        '鉛は食品中に広く含まれるが、'
        '<span class="kw4">消化管からの吸収量はわずか</span>で（排出量も少なくバランスを保つ）、'
        '問題になるのは<u>職業曝露での吸入</u>である。'),
       ('b', 'カドミウム', False,
        'カドミウムは土壌・鉱物に広く含まれ農畜水産物に蓄積するので'
        '魚介類からの摂取も<u>ありうる</u>が、'
        '<span class="kw4">日本人では約50％が米からの摂取で、魚介類は10％程度</span>。'
        '<span class="kw3">「主要な」曝露源とは言えない</span>のがこの肢の外し方。'),
       ('c', 'メチル水銀', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">メチル水銀は消化管から吸収されやすい脂溶性物質で、'
        '食物連鎖に沿って生物濃縮をきたす</span>。'
        '<span class="kw3">水俣病がメチル水銀に汚染された魚介類の摂取で発症した</span>ことは'
        '広く知られており、現在も'
        '<span class="kw">妊婦に対する魚介類の摂食指導</span>の根拠になっている。'),
       ('d', '塩化ビニルモノマー', False,
        '<span class="kw4">常温で気体</span>の物質であり密閉系で使用されるため、'
        '環境汚染を起こす確率は低い。'
        '<span class="kw4">分子量が小さく生物濃縮を起こさない</span>ので'
        '魚介類には蓄積しない。'),
       ('e', 'テトラクロロエチレン', False,
        '常温で液体の物質で<span class="kw">地下水汚染の原因</span>にはなるが、'
        '<span class="kw4">分子量が小さく生物濃縮を起こさない</span>ので'
        '魚介類には蓄積しない（トリクロロエチレンも同じ）。')],
      '生物濃縮する脂溶性物質＝メチル水銀。曝露源は魚介類',
      patho=('□ 生物濃縮——「脂に溶けて、壊れない」ものだけが食物連鎖を上る',
             '<p><span class="kw3">生物濃縮 biomagnification</span>とは、'
             '<span class="kw3">環境中の物質が食物連鎖を通じて上位の生物ほど'
             '高濃度に蓄積していく現象</span>である。'
             'これが起きるには物質の側に2つの条件が要る。</p>'
             '<ol>'
             '<li><span class="kw3">脂溶性が高い</span>——'
             '<u>脂肪組織に溜まり、尿から出ていかない</u>。'
             '水溶性の物質は速やかに排泄されるので濃縮しない。</li>'
             '<li><span class="kw3">難分解性（生体内・環境中で壊れない）</span>——'
             '<u>代謝されずに残るから、食べるたびに足し算になる</u>。</li>'
             '</ol>'
             '<p><span class="kw3">この2条件を満たす代表がメチル水銀・PCB・'
             '有機塩素系農薬（DDTなど）・ダイオキシン・PFOS/PFOA</span>である。'
             '逆に<span class="kw4">塩化ビニルモノマーやテトラクロロエチレンのように'
             '分子量が小さく揮発性の高いものは濃縮しない</span>——'
             '<u>これらが起こすのは大気汚染・地下水汚染であって、魚の汚染ではない</u>。</p>'
             '<table class="tb"><tr><th>物質</th><th>生物濃縮</th>'
             '<th>主要な曝露源</th></tr>'
             '<tr><td><span class="kw3">メチル水銀</span></td>'
             '<td><span class="kw3">する</span></td>'
             '<td><span class="kw3">魚介類（特に大型の捕食魚）</span></td></tr>'
             '<tr><td><span class="kw3">PCB・ダイオキシン</span></td>'
             '<td><span class="kw3">する</span></td>'
             '<td>魚介類・肉・乳製品（脂肪）</td></tr>'
             '<tr><td>有機塩素系農薬（DDT等）</td>'
             '<td><span class="kw3">する</span></td>'
             '<td>残留農薬による畜水産食品</td></tr>'
             '<tr><td><span class="kw3">PFOS・PFOA</span></td>'
             '<td><span class="kw3">する</span>（高蓄積性・難分解性）</td>'
             '<td><span class="kw3">飲料水</span>'
             '（2026年4月に水道水質基準へ追加、PFOS＋PFOA ≦50ng/L）</td></tr>'
             '<tr><td><span class="kw4">カドミウム</span></td>'
             '<td>植物に蓄積</td>'
             '<td><span class="kw4">米が約50％</span>（魚介類は10％程度）</td></tr>'
             '<tr><td>鉛</td><td>しない</td>'
             '<td>職業曝露（吸入）。経口吸収はわずか</td></tr>'
             '<tr><td>塩化ビニルモノマー</td><td><span class="kw4">しない</span></td>'
             '<td>職業曝露（気体・密閉系）</td></tr>'
             '<tr><td>トリクロロ／テトラクロロエチレン</td>'
             '<td><span class="kw4">しない</span></td>'
             '<td>職業曝露・<span class="kw">地下水汚染</span></td></tr></table>'),
      deep=('□ 「主要な」の一語が肢を1つに絞る',
            '<p>本問で最も紛らわしいのは'
            '<span class="kw4">ｂ カドミウム</span>である。'
            'カドミウムは確かに<u>農畜水産物に蓄積し、魚介類からも摂取される</u>。'
            'ところが設問は<span class="kw3">「主要な曝露源が魚介類摂取であるのはどれか」</span>と'
            '書いており、'
            '<span class="kw3">日本人のカドミウム摂取は約半分が米、魚介類は10％程度</span>'
            'にとどまる。<u>「ありうる」と「主要な」は別</u>である。</p>'
            '<p>この読み方は他科でも効く——'
            '<span class="kw3">設問に付いた限定語（最も／まず／主要な／'
            '通常は／原則として）は、必ず肢を絞るために置かれている</span>。'
            '<span class="kw4">限定語を読み落とすと、'
            '「間違ってはいない肢」が複数残って決められなくなる</span>。</p>'
            '<p>臨床への接続としては、'
            '<span class="kw3">妊婦の魚介類摂食指導</span>が重要である。'
            '<span class="kw3">メチル水銀は胎盤を通過し、胎児の中枢神経発達に影響しうる</span>ため、'
            '厚生労働省は<u>キンメダイ・メカジキ・クロマグロ・'
            'メバチマグロなど食物連鎖の上位にある魚は週1〜2回まで</u>という'
            '目安を示している。'
            '<span class="kw">一方でツナ缶（キハダ・カツオ）、サケ、アジ、サバ、イワシ、'
            'サンマ、タイ、ブリなどは対象外</span>——'
            '<u>「魚を食べるな」ではなく「上位捕食者を控えめに」</u>という指導になる。</p>'),
      point=('□ 国試ポイント：生物濃縮と環境保健',
             '<ol>'
             '<li><span class="kw3">生物濃縮の条件は「脂溶性＋難分解性」</span>。'
             '<u>分子量が小さく揮発性の高い有機溶剤は濃縮しない</u>。</li>'
             '<li><span class="kw3">水俣病の初発症状は四肢のしびれ（末梢神経障害）</span>で、'
             '進行すると<span class="kw3">Hunter-Russell症候群'
             '（求心性視野狭窄・小脳性失調症・構音障害）</span>。'
             '水俣病では<span class="kw">難聴と感覚障害</span>も高頻度。'
             'BMは<span class="kw3">毛髪中水銀</span>（曝露が途絶えると速やかに低下する）。</li>'
             '<li><span class="kw3">胎児性水俣病</span>——'
             '<u>母体はほぼ無症状でも、胎盤を通過したメチル水銀により'
             '出生児に重度の中枢神経障害が生じる</u>。'
             '<span class="kw">胎盤は水銀を「濾す」のではなく「通す」</span>。</li>'
             '<li><span class="kw3">PFAS（PFOS・PFOA）</span>は'
             '炭素とフッ素の強固な結合による撥水・撥油性で工業製品に広く使われ、'
             '<span class="kw3">高蓄積性・難分解性</span>のため'
             '「永遠の化学物質」と呼ばれる。'
             '<span class="kw">IARCはPFOAをグループ1、PFOSをグループ2B</span>に指定。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">四大公害病</span>、'
             '<span class="kw">環境基本法の環境基準</span>、'
             '<span class="kw">POPs条約（残留性有機汚染物質）</span>、'
             '<span class="kw">妊婦への魚介類摂食に関する注意事項（厚生労働省）</span>。</li>'
             '</ol>')),
]

SECTIONS = [
    ('s1', '有機溶剤中毒', '', 0),
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


CH_NUM = 2
CH_NAME = '有機溶剤中毒'


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC中毒・職業病 第{CH_NUM}章 {CH_NAME} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#65A30D')
                .replace('--orl:#FCE4EC', '--orl:#ECFCCB')
                .replace('--ord:#880E4F', '--ord:#365314'))

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
