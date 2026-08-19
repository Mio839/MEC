# -*- coding: utf-8 -*-
"""
中毒・職業病 第5章「自然毒」(NO.22-24) の章別HTML(中毒・職業病/ch05_shizendoku.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_tox_ch01.py と同方式。

問題文・選択肢はPDF(中毒・職業病 印刷 p.29-32／PDF p.35-38)を書き起こし、
正解/正答率/必修バッジは巻末解答一覧表(PDF p.66-67)から。
解説はPDFのレジュメ部（PDF p.35-36「5 自然毒」）と国試標準知識に基づき執筆
（医学的正確性は要ユーザー確認）。

全3問（画像0枚）＝**本科目の最小章**。連問なし・必修バッジなし・採点除外なし。

■ 章を貫く4本の筋
  ① **自然毒はほぼすべて耐熱性**——銀杏のMPN、フグのTTX、貝毒、キノコ毒、
     ジャガイモのα-ソラニンはいずれも加熱で壊れない。
     **したがって「加熱調理済み」という記載は自然毒を否定しない**（むしろ細菌を否定する）。
  ② **発症までの時間で系統が決まる**——**1時間前後＝毒素型・自然毒**／
     半日＝ノロ・ウェルシュ／**1日以上＝カンピロバクター・腸管出血性大腸菌（感染型）**。
     NO.22（2時間）とNO.23（1時間）は、この一点だけで感染性食中毒が消える。
  ③ **症状で毒を絞る**——**けいれん＝銀杏**（GABA低下）／**しびれ＝フグ・麻痺性貝毒**
     （Na<sup>+</sup>チャネル遮断）／**ムスカリン様症状＝ジャガイモの芽・アセタケ**（抗ChE）。
  ④ **「食べられるもの」の中に「食べられない部分」がある**——
     ジャガイモの塊茎は食用だが芽と緑色部は毒、銀杏の胚乳は食用だが多食で毒。
     **素人が採った山菜・キノコは常に疑う**。

⚠️ **本章の最難は NO.22（120A-26・正答率57%）**＝居酒屋の食事でけいれんを起こすのは銀杏だけ。
   摂取2時間という時間が感染性食中毒を消す。
⚠️ 3問すべてに正答率があり、採点除外の問題は無い。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '中毒・職業病' / 'ch05_shizendoku.html'

Q_START = 22

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

# ① 自然毒の一覧——「何に・何が・どう効くか」
SHIZEN_TABLE = (
    '<table class="tb"><tr><th>自然毒</th><th>毒素</th><th>機序</th>'
    '<th>症状</th><th>耐熱性</th></tr>'
    '<tr><td><span class="kw3">フグ</span>（肝臓・卵巣）</td>'
    '<td><span class="kw3">テトロドトキシン〈TTX〉</span>。'
    '<u>海洋細菌が作った毒素が食物連鎖で蓄積</u></td>'
    '<td><span class="kw3">膜電位依存性Na<sup>+</sup>チャネルを遮断</span>し'
    '神経伝導を止める</td>'
    '<td><span class="kw3">口周囲・四肢遠位のしびれ → 運動麻痺 → 呼吸筋麻痺</span>。'
    '<span class="kw">血液脳関門を通らないので意識は最後まで清明</span></td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td>麻痺性貝毒（二枚貝）</td>'
    '<td>サキシトキシン〈STX〉・ゴニオトキシン〈GTX〉。'
    '<u>藻類の毒素が生物濃縮</u></td>'
    '<td>TTX類似＝Na<sup>+</sup>チャネル遮断</td>'
    '<td>フグ中毒と同様だが重篤化は少ない</td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td>下痢性貝毒（二枚貝）</td><td>オカダ酸など</td>'
    '<td>腸管上皮の脱リン酸化酵素を阻害</td>'
    '<td>腸炎ビブリオ様の水様性下痢・悪心・嘔吐</td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td><span class="kw4">キノコ①致死性</span>'
    '（タマゴテングタケ）</td>'
    '<td>アマトキシン類</td>'
    '<td><span class="kw4">RNAポリメラーゼⅡを阻害＝蛋白合成停止</span></td>'
    '<td>細胞増殖の盛んな<span class="kw4">消化管粘膜・肝細胞・造血器</span>を障害。'
    '<u>水様性下痢で始まり、いったん軽快してから肝不全へ進む</u></td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td>キノコ②コレラ様（ツキヨタケ・クサウラベニタケ）</td>'
    '<td>イルジンSなど</td><td>消化管刺激</td>'
    '<td><span class="kw3">最も多いタイプ</span>。水様性下痢・腹痛・嘔吐。'
    '<u>ツキヨタケはシイタケに似る</u></td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td>キノコ③ムスカリン様（アセタケ・カヤタケ）</td>'
    '<td>ムスカリン</td><td>ムスカリン受容体を直接刺激</td>'
    '<td><span class="kw3">発汗・流涙・流涎・縮瞳・徐脈・下痢</span>'
    '（＝有機リン中毒と同じ顔つき）</td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td>キノコ④幻覚型（シビレタケ・ワライタケ）</td>'
    '<td>シロシビン</td><td>セロトニン受容体を刺激</td>'
    '<td>めまい・不穏・幻覚。'
    '<span class="kw">麻薬及び向精神薬取締法の麻薬原料植物</span></td>'
    '<td>—</td></tr>'
    '<tr><td><span class="kw3">ジャガイモの芽・緑色部</span></td>'
    '<td><span class="kw3">α-ソラニン</span>（ステロイドアルカロイド配糖体）</td>'
    '<td><span class="kw3">抗コリンエステラーゼ作用</span></td>'
    '<td>嘔吐・腹痛・下痢・徐脈などの<span class="kw3">ムスカリン様症状</span>と頭痛。'
    '<u>通常は軽症</u></td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td><span class="kw3">銀杏（多食）</span></td>'
    '<td><span class="kw3">MPN＝4\'-O-メチルピリドキシン</span>'
    '（ビタミンB<sub>6</sub>のメチルエーテル）</td>'
    '<td><span class="kw3">ビタミンB<sub>6</sub>の拮抗物質</span>——'
    'GAD（グルタミン酸脱炭酸酵素）が働けず'
    '<span class="kw3">GABAが作れない</span></td>'
    '<td><span class="kw3">けいれん</span>・意識障害・消化器症状・呼吸困難</td>'
    '<td><span class="kw4">◯</span></td></tr>'
    '<tr><td colspan="5"><span class="kw3">表の右端がすべて「耐熱性◯」であることが'
    '本章の核心</span>——'
    '<span class="kw3">「加熱調理してあった」という記載は自然毒を否定しない</span>。'
    '<u>否定されるのは細菌・ウイルスの方</u>で、'
    'だからこそ NO.23 では「加熱済みなのに1時間で発症」が'
    '自然毒を名指しする根拠になる。</td></tr></table>')

# ② 食中毒——潜伏期で系統が決まる
SENPUKU_TABLE = (
    '<table class="tb"><tr><th>潜伏期</th><th>原因</th><th>手がかり</th></tr>'
    '<tr><td><span class="kw3">30分〜6時間</span><br>'
    '（<span class="kw3">毒素型・自然毒・化学性</span>）</td>'
    '<td><span class="kw3">黄色ブドウ球菌</span>（1〜5時間・おにぎり・手指の化膿巣）／'
    '<span class="kw3">セレウス菌 嘔吐型</span>（1〜5時間・焼飯・パスタ）／'
    '<span class="kw3">ヒスタミン</span>（30分・赤身魚）／'
    '<span class="kw3">キノコ・山菜・銀杏</span>／'
    '<span class="kw3">フグ</span>（20分〜3時間）</td>'
    '<td><span class="kw3">できあがった毒素を食べているので、'
    '菌が増える時間が要らない＝速い</span>。'
    '<u>加熱しても毒素は残る</u></td></tr>'
    '<tr><td>6〜24時間</td>'
    '<td>ウェルシュ菌（6〜18時間・給食のカレー）／'
    '<span class="kw">ノロウイルス</span>（12〜48時間・牡蠣）／'
    'ボツリヌス（8〜36時間・いずし・蜂蜜）</td>'
    '<td>腸管内で毒素を作る、あるいはウイルスが増える時間が要る</td></tr>'
    '<tr><td><span class="kw3">1日以上</span><br>'
    '（<span class="kw3">感染型</span>）</td>'
    '<td>サルモネラ（6〜72時間・卵）／'
    '<span class="kw3">カンピロバクター</span>（2〜5日・鶏の生焼け）／'
    '<span class="kw3">腸管出血性大腸菌</span>（3〜8日・牛肉）</td>'
    '<td><span class="kw3">菌が腸管で増えてから発症するので遅い</span>。'
    '<u>加熱が有効</u></td></tr>'
    '<tr><td colspan="3"><span class="kw3">「食べてから何時間で発症したか」を'
    '真っ先に計算する</span>——'
    '<span class="kw3">1時間なら細菌感染症は全部消える</span>。'
    'NO.23 は午後9時の食事で午後10時ころ発症＝約1時間、'
    'NO.22 は搬送2時間前の夕食＝2時間で、どちらもこの一段で決まる。</td></tr></table>')

# ③ 素人が採った山菜・キノコ——取り違えの定番
GOSHOKU_TABLE = (
    '<table class="tb"><tr><th>毒草</th><th>間違えられる食用植物</th><th>毒と症状</th></tr>'
    '<tr><td><span class="kw4">トリカブト</span></td>'
    '<td>ニリンソウ・モミジガサ</td>'
    '<td><span class="kw4">アコニチン</span>——Na<sup>+</sup>チャネルを'
    '<u>開きっぱなしにする</u>（TTXと逆）。口唇のしびれ・不整脈・心停止</td></tr>'
    '<tr><td><span class="kw4">スイセン</span></td><td>ニラ・ノビル</td>'
    '<td>リコリン。<u>激しい嘔吐</u>。<span class="kw">ニラと違って匂いが無い</span></td></tr>'
    '<tr><td><span class="kw4">イヌサフラン</span></td>'
    '<td>ギョウジャニンニク・行者菜</td>'
    '<td><span class="kw4">コルヒチン</span>——'
    '<u>死亡例が多い</u>。嘔吐・下痢のあと多臓器不全</td></tr>'
    '<tr><td><span class="kw4">バイケイソウ</span></td>'
    '<td>オオバギボウシ・ギョウジャニンニク</td>'
    '<td>ベラトルムアルカロイド。嘔吐・徐脈・血圧低下</td></tr>'
    '<tr><td><span class="kw4">ツキヨタケ</span></td>'
    '<td>シイタケ・ヒラタケ・ムキタケ</td>'
    '<td>イルジンS。<span class="kw3">日本のキノコ中毒の最多原因</span>。'
    '嘔吐・下痢・腹痛</td></tr>'
    '<tr><td colspan="3"><span class="kw3">「昨日〈自分で〉採った山菜」'
    '「知人にもらったキノコ」は、それだけで自然毒を第一に考える語句</span>。'
    '<u>市販品には検査と流通の網があるが、自家採取にはそれが無い</u>。</td></tr></table>')

IMG = '中毒・職業病/images/'

QUESTIONS = [
    # ------------------------------------------------------------------ NO.22
    Q('120A-26', 57, [],
      '4歳の男児。'
      '<span class="kw">けいれん</span>を主訴に救急車で搬入された。'
      '<span class="kw">搬送される2時間前に、両親に連れられて居酒屋で夕食を食べていた</span>。'
      '突然、全身のけいれんを認めたため父親が救急車を要請した。'
      '病院到着時、けいれんは持続していた。'
      '体温36.5℃。心拍数170/分、整。血圧98/50mmHg。呼吸数40/分。'
      'SpO<sub>2</sub> 91％（マスク5L/分酸素投与下）。'
      '<span class="kw">過去に食事によるアレルギー歴はない</span>。'
      '<span class="kw">呼吸音の減弱や喘鳴を認めない。皮疹を認めない。</span><br>'
      '<strong>男児が摂取していた食事のうち、けいれんの原因で最も考えられるのはどれか。</strong>',
      [('a', '枝　豆', False,
        '枝豆による重篤な食中毒は<span class="kw4">まれ</span>。'
        '<u>生食すると消化不良で食中毒をきたすことはある</u>が、'
        'けいれんを起こす成分は含まれない。'),
       ('b', '銀　杏', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">選択肢の中でけいれんを起こしうるのはこれだけ</span>。'
        '<span class="kw3">銀杏の胚乳に含まれるMPN（4\'-O-メチルピリドキシン）が'
        'ビタミンB<sub>6</sub>に拮抗し、GABAが作れなくなる</span>ためけいれんに至る。'
        '<u>居酒屋＝茶碗蒸し・焼き銀杏という道筋</u>も合う。'),
       ('c', 'マグロ', False,
        'マグロによる重篤な食中毒はまれ。ただし'
        '<span class="kw">鮮度の落ちた赤身魚を大量に食べると、'
        'ヒスチジンから細菌が作ったヒスタミンによる'
        '「アレルギー様食中毒」</span>をきたすことがある。'
        '<u>症状は顔面紅潮・蕁麻疹・頭痛でけいれんではない</u>。'
        'しかも本例は<span class="kw3">皮疹を認めない</span>と明記されている。'),
       ('d', '焼き鳥', False,
        '焼き鳥による重篤な食中毒はまれ。ただし'
        '<span class="kw">生焼けだとカンピロバクター食中毒</span>をきたす。'
        '<span class="kw4">潜伏期は2〜5日</span>で、2時間で発症する経過に合わない。'),
       ('e', 'ゆで卵', False,
        'ゆで卵による重篤な食中毒はまれ。ただし'
        '<span class="kw">生茹でだとサルモネラ食中毒</span>を起こす。'
        '<span class="kw4">潜伏期は6〜72時間</span>で、やはり2時間には合わない。')],
      '居酒屋の食事でけいれん＝銀杏。摂取2時間という速さが感染性食中毒を全部消す',
      patho=('□ 銀杏中毒——ビタミンB<sub>6</sub>の「偽物」がGABAを止める',
             '<p><span class="kw3">銀杏はイチョウの種子で、食用になるのは胚乳の部分</span>である。'
             'ここに<span class="kw3">MPN（4\'-O-メチルピリドキシン）</span>——'
             '<span class="kw3">ビタミンB<sub>6</sub>（ピリドキシン）のメチルエーテル</span>——が'
             '大量に含まれる。</p>'
             '<p>けいれんに至る道筋は一本道である。</p>'
             '<ol>'
             '<li>本来、<span class="kw3">ビタミンB<sub>6</sub>の活性型'
             '（ピリドキサールリン酸〈PLP〉）は'
             'グルタミン酸脱炭酸酵素〈GAD〉の補酵素</span>として、'
             '<span class="kw3">グルタミン酸 → γ-アミノ酪酸〈GABA〉</span>の反応を進める。</li>'
             '<li><span class="kw4">MPNはビタミンB<sub>6</sub>とよく似た構造をもつ拮抗物質</span>で、'
             '<u>活性型PLPが作られる段階を競合的に阻害する</u>。</li>'
             '<li>結果として<span class="kw4">GADが働けず、'
             '興奮性のグルタミン酸が過剰・抑制性のGABAが不足</span>となる。</li>'
             '<li><span class="kw3">脳のブレーキ（GABA）が外れてアクセル（グルタミン酸）だけが'
             '踏まれた状態＝けいれん</span>。</li>'
             '</ol>'
             '<p><span class="kw4">MPNは耐熱性なので、加熱調理しても中毒は防げない</span>。'
             '茶碗蒸しの銀杏も焼き銀杏も等しく危ない。</p>'
             '<p>症状は<span class="kw3">摂取1時間〜半日後にけいれん・意識障害・'
             '消化器症状・呼吸困難</span>。'
             '<span class="kw3">身体の小さい小児では5〜6粒でも発症し、'
             '特に3歳以下では重症になりやすい</span>'
             '（本例は4歳）。</p>'
             '<p><span class="kw3">治療は①活性炭の投与 ②抗けいれん薬'
             '（ジアゼパム・ミダゾラム）③活性型ビタミンB<sub>6</sub>'
             '（ピリドキサール）の静脈注射</span>——'
             '<u>③が「拮抗物質を本物で押し返す」治療で、'
             '機序を知っていれば治療名まで導ける</u>。</p>'
             '<p>なお<span class="kw">種子が熟すと外種皮が悪臭を放ち、'
             '素手で触れるとギンコール酸による接触皮膚炎</span>を起こす。'
             '<u>これはウルシと同系統のアレルゲンで、食中毒とは別の話</u>である。</p>'),
      deep=('□ なぜ57%まで割れたか——「けいれんの原因」を食材から選ばせる形の異様さ',
            '<p>本問が難しいのは、'
            '<span class="kw3">小児のけいれんという最頻の主訴に対して、'
            '鑑別ではなく「食材」を並べてくる</span>ためである。'
            '熱性けいれん・てんかん・低血糖・頭蓋内病変といった'
            '普段の道具立てが一切使えない。</p>'
            '<p>そこで<span class="kw3">設問文が丁寧に潰していった可能性</span>を'
            '数え直すのが正攻法になる。</p>'
            '<ol>'
            '<li><span class="kw3">体温36.5℃</span> → '
            '<u>熱性けいれんと感染症を消す</u>。</li>'
            '<li><span class="kw3">過去に食事によるアレルギー歴はない・'
            '喘鳴なし・皮疹なし</span> → '
            '<u>アナフィラキシーを消す</u>（＝マグロのヒスタミンも同時に消える）。</li>'
            '<li><span class="kw3">摂取から2時間</span> → '
            '<u>カンピロバクター（2〜5日）もサルモネラ（6〜72時間）も間に合わない</u>。</li>'
            '</ol>'
            '<p>残るのは<span class="kw3">「食べたものそのものに、'
            'けいれんを起こす毒が入っていた」</span>という筋だけで、'
            '<span class="kw3">選択肢5つのうちその条件を満たすのは銀杏ただ一つ</span>である。</p>'
            '<p><span class="kw4">なお心拍数170/分・呼吸数40/分・SpO<sub>2</sub> 91％は'
            '「けいれんが持続していること」の結果</span>であって、'
            '原因を指す所見ではない。'
            '<u>けいれん重積では筋の酸素消費と換気不全で必ずこうなる</u>——'
            'ここに引きずられて呼吸器疾患を考えると迷路に入る。</p>'
            '<p>成人でも大量（40粒以上とされる）に食べれば発症するが、'
            '<span class="kw3">国試に出るのはほぼ小児</span>である。'
            '<u>「小児＋けいれん＋直前に和食」で銀杏を思い出せるようにしておく</u>。</p>'
            + SHIZEN_TABLE),
      point=('□ 国試ポイント：銀杏中毒と自然毒の総論',
             '<ol>'
             '<li><span class="kw3">銀杏の毒はMPN＝ビタミンB<sub>6</sub>拮抗物質</span>。'
             '<span class="kw3">GABAが作れない → けいれん</span>。'
             '<u>治療は活性型ビタミンB<sub>6</sub>の静注</u>。</li>'
             '<li><span class="kw3">小児は5〜6粒で発症、3歳以下は重症化</span>。'
             '<u>「子どもに銀杏を食べさせすぎない」は保健指導としても問われる</u>。</li>'
             '<li><span class="kw4">自然毒はほぼすべて耐熱性</span>——'
             '<u>加熱調理の記載があっても自然毒は消えない</u>。</li>'
             '<li><span class="kw3">摂取から発症までの時間が最強の分岐</span>——'
             '<span class="kw3">数時間以内なら毒素型・自然毒、'
             '1日以上なら感染型</span>。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">ギンコール酸による接触皮膚炎</span>、'
             '<span class="kw">ヒスタミン（アレルギー様）食中毒</span>、'
             '<span class="kw">小児のけいれん重積の初期対応'
             '（気道確保・ジアゼパム静注）</span>、'
             '<span class="kw">イチョウ葉エキスと抗凝固薬の相互作用</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.23
    Q('110I-45', 67, [],
      '58歳の男性と55歳の女性の夫婦。本日午後11時に、下痢、嘔吐および腹痛を主訴に'
      '夫婦とも救急車で搬入された。'
      '<span class="kw">夫は長期出張から午後8時に帰ったばかり</span>であり、'
      '<span class="kw">午後9時に夫婦揃って夕食</span>をとった。'
      '妻によると献立は鍋物で、具材は'
      '<span class="kw">冷凍にしておいた牡蠣</span>、'
      'スーパーで本日午後に買った豆腐と野菜（春菊、ねぎ、もやし）であった。'
      'その他に米飯と市販の漬物と'
      '<span class="kw">昨日妻が採った山菜の天ぷら</span>で'
      '夫婦で同じ物を食べたという。'
      '<span class="kw">午後10時ころより夫婦とも腹痛が出現</span>し、'
      '症状が増悪したため救急車を要請した。<br>'
      '<strong>原因と考えられるのはどれか。</strong>',
      [('a', 'アニサキス', False,
        '<span class="kw">サバ・アジ・イワシ・スルメイカなどの海洋生物の生食</span>で'
        '感染する。'
        '<span class="kw4">本例の献立に生食は無く、加熱処理で虫体は死ぬ</span>。'
        'しかも発症までに数時間以上を要し、'
        '<u>症状は激烈な心窩部痛で夫婦同時発症の下痢とは像が違う</u>。'),
       ('b', '植物性自然毒', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">多くは耐熱性毒素なので、'
        '加熱調理済みという条件に矛盾しない唯一の選択肢</span>。'
        '<span class="kw3">野生の山菜やキノコには食用に適さないものも多く、'
        '素人が安易に採取するとこのような事例に至る</span>。'),
       ('c', 'ノロウィルス', False,
        '<span class="kw4">牡蠣は冷凍してあり、しかも鍋物で加熱処理している</span>ので考えにくい。'
        '<u>加えて潜伏期は12〜48時間</u>で、1時間で発症する経過に合わない。'),
       ('d', 'カンピロバクター', False,
        '<span class="kw">家畜の生焼けの肉</span>で感染するが該当食品がない。'
        'しかも<span class="kw4">加熱処理は有効で、潜伏期は2〜5日</span>。'),
       ('e', '腸管出血性大腸菌', False,
        '家畜の生焼けの肉や糞尿に汚染された食物から感染するが'
        '<span class="kw4">加熱処理は有効</span>。'
        '<u>仮に妻が汚れた手で調理して糞口感染したとしても、潜伏期は3〜8日</u>で'
        '当日の発症を説明できない。')],
      '食後わずか1時間で夫婦同時発症＋全食材が加熱済み＝耐熱性の自然毒',
      patho=('□ 「1時間」と「加熱済み」の2語で答えが決まる',
             '<p>本問は<span class="kw3">情報量の多い献立を丁寧に読ませておいて、'
             '実は2つの語だけで解ける</span>という構造をしている。</p>'
             '<p><span class="kw3">第一の語は「午後9時に夕食、午後10時ころより腹痛」'
             '＝潜伏期およそ1時間</span>。'
             '<span class="kw3">細菌が腸管で増えてから発症する感染型食中毒'
             '（サルモネラ・カンピロバクター・腸管出血性大腸菌）は、'
             'どれだけ早くても半日以上かかる</span>ので、'
             '<u>この一段で d・e が消え、ウイルスの c も消える</u>。'
             '残るのは<span class="kw3">「できあがった毒素を食べた」＝毒素型か自然毒</span>だけである。</p>'
             '<p><span class="kw3">第二の語は「鍋物」「天ぷら」＝全食材が加熱されている</span>。'
             '<span class="kw3">加熱で壊れない毒でなければならない</span>。'
             '<u>植物性自然毒はほとんどが耐熱性</u>なので、これに適う。</p>'
             '<p>この2つを通ると、<span class="kw3">献立の中で'
             '「検査も流通の網もくぐっていない食材」</span>が'
             '<span class="kw3">昨日妻が自分で採った山菜</span>ただ一つであることが'
             '浮かび上がる。'
             '牡蠣は冷凍、豆腐と野菜はスーパー、米飯と漬物は市販品——'
             '<u>設問はわざわざ全品の出所を書いて、山菜だけを浮かせている</u>。</p>'
             + SENPUKU_TABLE),
      deep=('□ 「夫は長期出張から帰ったばかり」——曝露をこの1食に閉じ込める一文',
            '<p>疫学の問題として読むと、'
            '<span class="kw3">この一文が共通曝露を「今日の夕食」だけに限定している</span>'
            'ことがわかる。'
            '<u>夫は今日の午後8時まで家にいなかったのだから、'
            '夫婦が同じものを口にした機会は午後9時の食事しかない</u>。'
            '<span class="kw3">家庭内の水・冷蔵庫の作り置き・数日前の食事といった'
            '可能性がすべて排除される</span>ので、'
            '「同時に発症した2人の共通項」を探す作業が要らなくなる。</p>'
            '<p><span class="kw3">実務では、こういう症例で真っ先にすべきなのは'
            '「残った食品を捨てさせないこと」</span>である。'
            '<span class="kw3">食中毒は診断がついたら保健所への届出（食品衛生法）が要り、'
            '原因究明には検体（残品・吐物・便）が要る</span>。'
            '<u>山菜の残りや天ぷらの残りがあれば、それが唯一の物証になる</u>。</p>'
            '<p>日本の自然毒による食中毒は、'
            '<span class="kw3">件数ではキノコ、死亡例では植物（イヌサフラン・トリカブト）が'
            '上位</span>を占め、'
            '<span class="kw3">発生は「自分で採った」「知人にもらった」に集中する</span>。'
            '<u>スーパーで買ったものが原因になることは、まずない</u>。</p>'
            + GOSHOKU_TABLE),
      point=('□ 国試ポイント：食中毒の絞り込み',
             '<ol>'
             '<li><span class="kw3">まず潜伏期を計算する</span>——'
             '<span class="kw3">数時間以内＝毒素型・自然毒／半日＝ノロ・ウェルシュ／'
             '1日以上＝感染型</span>。</li>'
             '<li><span class="kw3">加熱の有無で毒素型と感染型を分ける</span>——'
             '<span class="kw3">毒素（黄色ブドウ球菌エンテロトキシン・自然毒）は耐熱性、'
             '菌そのものは加熱で死ぬ</span>。</li>'
             '<li><span class="kw3">「自分で採った」「知人にもらった」は自然毒の合図</span>。</li>'
             '<li><span class="kw">食中毒（疑いを含む）を診断した医師は'
             '24時間以内に最寄りの保健所長へ届け出る</span>（食品衛生法第63条）。'
             '<u>感染症法ではなく食品衛生法である</u>ことに注意。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">腸管出血性大腸菌とHUS（抗菌薬・止痢薬の是非）</span>、'
             '<span class="kw">ノロウイルスの次亜塩素酸消毒（アルコール無効）</span>、'
             '<span class="kw">アニサキスの内視鏡的摘除</span>、'
             '<span class="kw">ボツリヌス症と乳児ボツリヌス症（蜂蜜）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.24
    Q('109I-31', 97, [],
      '<strong>食中毒の原因となるのはどれか。</strong>',
      [('a', 'たらの芽', False,
        '<span class="kw">ウコギ科のタラノキの新芽</span>で、'
        '天ぷらなどに調理される代表的な山菜である。'
        '<u>「芽」という語につられやすいが無毒</u>。'),
       ('b', '青いトマト', False,
        '<span class="kw">グリーントマトは未成熟のトマト</span>で、'
        'ピクルスやサラダに利用できるほか、日に当てれば熟して赤いトマトになる。'
        '（微量のトマチンを含むが、通常の摂取量で中毒には至らない。）'),
       ('c', '芽キャベツ', False,
        '<span class="kw">キャベツの変種</span>で、'
        'ビタミンCを豊富に含み様々な食材として利用される。'
        '<u>これも「芽」という語だけの引っかけ</u>。'),
       ('d', '発芽した大豆', False,
        '<span class="kw">大豆の新芽はもやしとして食材になる</span>'
        '（市販のもやしは大豆より緑豆を用いることが多い）。'
        '<u>市販の良質な大豆も水に浸せば発芽する</u>。'),
       ('e', 'ジャガイモの新芽', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">α-ソラニンの抗コリンエステラーゼ作用</span>により、'
        '<span class="kw3">嘔吐・腹痛・下痢・徐脈などのムスカリン様症状</span>と'
        '頭痛を引き起こす。')],
      'ジャガイモは塊茎が食用でも「芽と緑色部」は毒——α-ソラニン',
      patho=('□ ジャガイモ中毒——同じ植物の中に食用部と有毒部がある',
             '<p><span class="kw3">ジャガイモの有毒成分は'
             'ステロイドグリコアルカロイドの一種であるα-ソラニン</span>'
             '（およびα-チャコニン）である。</p>'
             '<p><span class="kw3">含まれる場所がはっきり決まっている</span>のが'
             'この中毒の特徴である。</p>'
             '<ol>'
             '<li><span class="kw3">芽（発芽部）</span>——'
             '<u>最も濃度が高い</u>。</li>'
             '<li><span class="kw3">日光に当たって緑色になった皮の部分</span>——'
             '<u>クロロフィルは無毒だが、緑化と同時にソラニンも増える</u>ため、'
             '<span class="kw3">「緑色」は毒の目印として使える</span>。</li>'
             '<li><span class="kw4">未熟な小さいイモ</span>——'
             '<u>学校菜園で採れた小イモによる集団食中毒が毎年報告される</u>。</li>'
             '</ol>'
             '<p><span class="kw3">機序は抗コリンエステラーゼ作用</span>で、'
             '<span class="kw3">アセチルコリンが分解されずに溜まる</span>ため'
             '<span class="kw3">副交感神経刺激症状（ムスカリン様症状）</span>——'
             '嘔吐・腹痛・下痢・徐脈——に加えて頭痛・めまいをきたす。'
             '<u>有機リン中毒（第3章）と同じ機序だが、はるかに弱く通常は軽症で済む</u>。</p>'
             '<p><span class="kw4">α-ソラニンは加熱で分解されない</span>ので、'
             '<span class="kw3">予防は「調理で壊す」ではなく'
             '「芽と緑色部を厚めに取り除く」「未熟なイモを食べない」'
             '「日光の当たらない冷暗所で保存する」</span>という'
             '<u>物理的な除去と保存の話</u>になる。</p>'),
      deep=('□ 「食べられるものの中の食べられない部分」という出題の型',
            '<p>本問の4つの誤答は、'
            '<span class="kw3">「芽」「新芽」「発芽」「青い（未熟）」という'
            '同じ語感で並べてある</span>。'
            '<u>語感で選ぶと当たらず、'
            '「その植物に毒があるか」を知っているかだけが問われる</u>。</p>'
            '<p>同じ型の知識をまとめておく。'
            '<span class="kw3">いずれも「食材として流通しているのに、'
            '特定の部位・時期だけが毒」</span>という構造である。</p>'
            '<table class="tb"><tr><th>食材</th><th>毒のある部分</th>'
            '<th>毒素と症状</th></tr>'
            '<tr><td><span class="kw3">ジャガイモ</span></td>'
            '<td><span class="kw3">芽・緑色になった皮・未熟な小イモ</span></td>'
            '<td>α-ソラニン。<span class="kw3">ムスカリン様症状</span>・頭痛</td></tr>'
            '<tr><td><span class="kw3">銀杏</span></td>'
            '<td><u>胚乳そのもの（多食で）</u>／外種皮は接触皮膚炎</td>'
            '<td>MPN。<span class="kw3">けいれん</span>（→NO.22）</td></tr>'
            '<tr><td>ウメ・アンズ・ビワ</td>'
            '<td><span class="kw4">未熟な種子（仁）</span></td>'
            '<td>アミグダリン（青酸配糖体）→'
            '<span class="kw4">腸内細菌でシアンを遊離</span></td></tr>'
            '<tr><td>ワラビ・ゼンマイ</td><td>あく抜きしていないもの</td>'
            '<td>プタキロシド（発癌性）。'
            '<u>重曹や木灰による処理が必須</u></td></tr>'
            '<tr><td>フグ</td><td><span class="kw4">肝臓・卵巣</span></td>'
            '<td>TTX。<span class="kw3">しびれ → 呼吸筋麻痺</span></td></tr>'
            '<tr><td>ハチミツ</td>'
            '<td><span class="kw4">1歳未満に与えた場合</span></td>'
            '<td>ボツリヌス菌芽胞 → <span class="kw3">乳児ボツリヌス症</span></td></tr>'
            '</table>'
            '<p><span class="kw3">正答率97%の必修レベルの問題だが、'
            '「なぜ毒なのか」まで言えると NO.22・NO.23 も自動的に解ける</span>——'
            '<u>本章の3問はいずれも「加熱で壊れない毒が、食材の中に最初から入っていた」'
            'という同じ話をしている</u>。</p>'),
      point=('□ 国試ポイント：ジャガイモ中毒',
             '<ol>'
             '<li><span class="kw3">毒素はα-ソラニン</span>。'
             '<span class="kw3">芽・緑色の皮・未熟な小イモ</span>に多い。</li>'
             '<li><span class="kw3">抗コリンエステラーゼ作用 → ムスカリン様症状</span>'
             '（嘔吐・腹痛・下痢・徐脈）＋頭痛。<u>通常は軽症</u>。</li>'
             '<li><span class="kw4">加熱では分解されない</span>——'
             '<span class="kw3">予防は除去と冷暗所保存</span>。</li>'
             '<li><span class="kw3">学校菜園の未熟なジャガイモによる集団食中毒</span>は'
             '学校保健の題材としても出る。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">有機リン中毒（同じ抗ChE作用・第3章）</span>、'
             '<span class="kw">ムスカリン様症状とニコチン様症状の区別</span>、'
             '<span class="kw">アミグダリンとシアン中毒（第6章）</span>、'
             '<span class="kw">乳児ボツリヌス症とハチミツ</span>。</li>'
             '</ol>')),
]

SECTIONS = [
    ('s1', 'けいれんを起こす自然毒', '', 0),
    ('s2', '食中毒の原因を当てる', '', 1),
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


CH_NUM = 5
CH_NAME = '自然毒'


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
