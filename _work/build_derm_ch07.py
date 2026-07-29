# -*- coding: utf-8 -*-
"""
皮膚科 第7章「悪性腫瘍」(NO.151-190) の章別HTML(皮膚科/ch07_akusei_shuyou.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、産婦人科(obg)水準で作成。build_derm_ch06.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・皮膚科 皮Q-96〜121／PDF p.99-124)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.155-159) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全40問＝derm では最大の章。画像は25問46枚。図ラベル(A/B/C)は**ラベル文字の x 座標**で帰属を決めた
（p.110 の A・p.123 の B/C は全角 Ａ Ｂ Ｃ でラベル抽出に掛からないため、残りの矩形を位置で埋めた）。
p.123(NO.189) は A が右上・B が左下・C が右下という**読み順と異なる配置**である。

複数選択は NO.167・168・169 の3問（いずれも2つ選べ）。
否定形は NO.154（誤っている）・158（でない）・166（でない）・172（みられない）の4問。
**解答一覧表に正答率が無いのは NO.170・171・172 の3問**
（rate=None → .cr を出さない。採点除外ではないので bx は付けない）。
★問題は NO.151-172 の22問。CBTバッジ(bc)は NO.156・161・174・180 の4問。必修(bh)は本章になし。

本章の低正答率問題: NO.167(29%)・NO.178(30%)・NO.152(35%)・NO.160(37%)・NO.180(41%)・
NO.158(53%)・NO.177(54%)・NO.169(55%)・NO.189(57%)・NO.187(58%)。
悪性黒色腫は NO.156・162・163・166・174・175・180・188、血管肉腫は NO.159・176・178・187、
乳房外Paget病は NO.155・170・181・190、日光角化症は NO.160・167・184、
Bowen病は NO.161・183・189、菌状息肉症は NO.151・164・171 で繰り返し問われる。
「表皮内癌（日光角化症・Bowen病・乳房外Paget病）は切除で治る／浸潤癌（有棘細胞癌・悪性黒色腫）は
センチネルリンパ節生検を含む病期評価へ」「黒い病変はまずダーモスコピー」が本章の軸。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '皮膚科' / 'ch07_akusei_shuyou.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 151

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs or [], ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.151-159
# ============================================================
QUESTIONS += [

Q('120A-39', 72, [('bs', '★'), ('bi', '📷')],
  '63歳の女性。全身の皮疹を主訴に来院した。'
  '<span class="kw">約15年前から体幹を中心に瘙痒を伴う紅斑</span>が出現し、近くの診療所で'
  '<span class="kw">湿疹として副腎皮質ステロイド外用薬による治療</span>を受けていたが、'
  '改善と増悪を繰り返していた。'
  '<span class="kw">約5年前から紅斑の一部が盛り上がり、局面を形成</span>するようになった。'
  '<span class="kw">6か月前から局面の一部が急速に増大し、腫瘤が複数出現</span>した。'
  '腫瘤からの出血や悪臭も伴うようになった。'
  '顔面、体幹および四肢に<span class="kw">径1〜8cmの半球状〜茸状に隆起する暗紅色の結節と腫瘤</span>を'
  '複数認める。周囲には<span class="kw">浸潤を触れる紅斑や局面</span>が散在する。'
  '鼠径リンパ節に軽度の腫大を認める。血液所見：末梢血白血球数8,000/μL、'
  '<span class="kw">異型リンパ球は認めない</span>。LD 350U/L（基準124〜222）。'
  '胸腹部造影CTでは両側鼠径リンパ節の軽度腫大以外に、内臓病変は指摘されなかった。'
  '腫瘤部からの皮膚生検の病理検査では、'
  '<span class="kw">真皮に大型で核形不整な異型リンパ球が密に浸潤</span>していた。'
  '<span class="kw">表皮への浸潤は一部で認められた</span>。皮疹の写真を示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '菌状息肉症', True, '<span class="kw3">①15年におよぶ「治りにくい湿疹」＝紅斑期、'
                     '②5年前からの浸潤を触れる局面＝扁平浸潤期、'
                     '③6か月前からの急速な結節・腫瘤の出現＝腫瘍期</span>——'
                     '<span class="kw3">紅斑期→扁平浸潤期→腫瘍期という年単位の三相性の経過</span>は'
                     '<span class="kw3">菌状息肉症〈mycosis fungoides〉に特異的</span>である。'
                     '<span class="kw3">病理で真皮の異型リンパ球浸潤＋表皮向性〈epidermotropism〉</span>を'
                     '認めることも合致する。'
                     '<span class="kw3">末梢血に異型リンパ球（Sézary細胞）を認めない</span>点が'
                     'ｃとの決定的な鑑別点である。'),
   ('b', '結節性痒疹', False, '<span class="kw4">結節性痒疹は、掻破の反復により'
                     '四肢伸側を中心に生じるドーム状で表面が角化・痂皮化した硬い小結節</span>で、'
                     '<span class="kw4">強い瘙痒があり数mm〜2cm程度で大きさが揃う</span>。'
                     '<span class="kw4">径8cmの茸状腫瘤にはならず、異型リンパ球の浸潤も来さない</span>。'),
   ('c', 'Sézary症候群', False, '<span class="kw4">Sézary症候群は菌状息肉症の白血化型</span>で、'
                     '<span class="kw4">①紅皮症（体表の80％以上を占める全身の紅斑）、'
                     '②全身のリンパ節腫脹、③末梢血中のSézary細胞（脳回状核の異型リンパ球）1,000/μL以上</span>の'
                     '三徴で定義される。'
                     '本例は<span class="kw4">紅皮症ではなく限局した結節・腫瘤で、'
                     '末梢血に異型リンパ球を認めない</span>ので該当しない。'),
   ('d', 'サルコイドーシス', False, '<span class="kw4">皮膚サルコイドーシスは、'
                     '常色〜褐紅色の局面型・結節型・皮下型などをとり、'
                     '硝子圧法で黄褐色の「リンゴゼリー様」を呈する</span>。'
                     '<span class="kw4">両側肺門リンパ節腫脹〈BHL〉・ぶどう膜炎・血清ACE上昇・'
                     '病理での非乾酪性類上皮細胞肉芽腫</span>が診断の軸で、'
                     '本例の<span class="kw4">異型リンパ球浸潤とは病理像が全く異なる</span>。'),
   ('e', 'スポロトリコーシス', False, '<span class="kw4">スポロトリコーシスは Sporothrix schenckii による'
                     '深在性真菌症</span>で、'
                     '<span class="kw4">園芸・農作業での外傷を契機に露出部（顔面・四肢）に単発の'
                     '結節・潰瘍を生じ、リンパ管に沿って線状に新病変が並ぶ（リンパ管型）</span>。'
                     '<span class="kw4">15年かけて全身に多発する経過はとらず</span>、'
                     '病理では化膿性肉芽腫と菌要素を認める。')],
  '「長年ステロイドで治らない湿疹」→局面→腫瘤という三相性の経過＋病理の表皮向性で菌状息肉症。末梢血に異型リンパ球が無いのでSézary症候群ではない。',
  imgs=['images/120A-39_1.jpeg'],
  patho=('🧬 菌状息肉症——「治らない湿疹」の顔をした皮膚T細胞リンパ腫',
         '<span class="kw3">菌状息肉症は、皮膚に生着した成熟CD4陽性ヘルパーT細胞が緩徐にクローン性増殖する'
         '皮膚原発T細胞リンパ腫〈CTCL〉で、CTCLの約半数を占める最多の病型</span>である。'
         '<span class="kw3">中高年男性にやや多く、経過は年〜数十年単位</span>と極めて緩徐で、'
         '<span class="kw3">「湿疹・乾癬として何年も外用治療を受けていた」という病歴</span>が'
         '最大の手がかりになる。<br>'
         '<span class="kw3">病期は3期に分かれる</span>——'
         '<span class="kw3">①紅斑期〈patch stage〉：非日光露出部（殿部・大腿・体幹）に'
         '境界不明瞭で萎縮性の淡紅色斑。瘙痒を伴い湿疹と区別がつかない。'
         '②扁平浸潤期〈plaque stage〉：浸潤を触れる隆起した局面となる。'
         '③腫瘍期〈tumor stage〉：半球状〜茸状の結節・腫瘤が出現し、'
         '潰瘍化・二次感染で悪臭を伴う</span>。'
         '<span class="kw3">腫瘍期に入るとリンパ節・内臓へ進展し予後が急速に悪化する</span>。<br>'
         '<span class="kw3">病理の特徴は表皮向性〈epidermotropism〉</span>——'
         '<span class="kw3">脳回状核〈cerebriform nucleus〉をもつ異型リンパ球が表皮内に侵入し、'
         '海綿状態を伴わずに集簇したものをPautrier微小膿瘍</span>と呼ぶ。'
         '<span class="kw4">ただし腫瘍期では表皮向性が失われる（大細胞転化）ことがあり、'
         '本例で「表皮への浸潤は一部」とされているのはこのため</span>である。'
         '免疫染色は<span class="kw3">CD3陽性・CD4陽性・CD8陰性で、CD7の脱落</span>が診断の補助となる。<br>'
         '<span class="kw3">治療は病期依存で、紅斑期〜扁平浸潤期はステロイド外用・'
         'PUVA/narrow-band UVB などの光線療法・電子線全身照射が中心</span>、'
         '<span class="kw3">腫瘍期・進行期でレチノイド、インターフェロンγ、'
         '抗CCR4抗体〈モガムリズマブ〉、ベキサロテン、化学療法</span>へ進む。'),
  deep=('📌 皮膚に浸潤するリンパ球性疾患の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>皮疹</th><th>末梢血</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">菌状息肉症</span></td>'
        '<td><span class="kw3">紅斑→局面→腫瘤（年単位）</span></td>'
        '<td><span class="kw3">正常</span></td>'
        '<td>表皮向性・Pautrier微小膿瘍・CD4陽性</td></tr>'
        '<tr><td><span class="kw4">Sézary症候群</span></td>'
        '<td><span class="kw4">紅皮症＋全身リンパ節腫脹</span></td>'
        '<td><span class="kw4">Sézary細胞≧1,000/μL</span></td>'
        '<td>白血化した菌状息肉症。予後不良</td></tr>'
        '<tr><td>成人T細胞白血病〈ATL〉</td><td>紅斑・丘疹・結節・紅皮症と多彩</td>'
        '<td><span class="kw4">花弁状核細胞〈flower cell〉</span></td>'
        '<td><span class="kw4">HTLV-1抗体陽性・九州沖縄・高Ca血症</span></td></tr>'
        '<tr><td>皮膚白血病〈leukemia cutis〉</td><td>浸潤性の紅色結節</td>'
        '<td>芽球</td><td>原疾患（AML等）が既知のことが多い</td></tr>'
        '<tr><td>偽リンパ腫</td><td>単発の紅色結節（虫刺・薬剤後）</td>'
        '<td>正常</td><td>polyclonal・自然消退</td></tr></table>'
        '<span class="kw3">「難治性湿疹が年単位で局面化・腫瘤化」＝菌状息肉症</span>、'
        '<span class="kw3">「紅皮症＋末梢血異型リンパ球」＝Sézary症候群</span>、'
        '<span class="kw3">「九州沖縄出身＋高Ca血症」＝ATL</span>が入口である。'),
  point=('🎯 国試ポイント',
         '① 菌状息肉症＝<span class="kw3">CD4陽性の皮膚T細胞リンパ腫。紅斑期→扁平浸潤期→腫瘍期</span>。<br>'
         '② <span class="kw3">「何年もステロイドで治らない湿疹」は本症を疑う合図</span>。<br>'
         '③ 病理＝<span class="kw3">表皮向性・Pautrier微小膿瘍・脳回状核</span>。<br>'
         '④ <span class="kw3">末梢血にSézary細胞が出れば Sézary症候群</span>（紅皮症を伴う）。<br>'
         '⑤ 早期は<span class="kw3">外用ステロイド・PUVA/NB-UVB</span>、腫瘍期は全身療法へ。')),

Q('120D-51', 35, [('bs', '★'), ('bi', '📷')],
  '75歳の男性。鼻部の皮疹を主訴に来院した。'
  '<span class="kw">約2年前から鼻根部に小さな皮疹</span>が出現したが医療機関を受診しなかった。'
  '<span class="kw">徐々に増大し、中心部が少し凹み、縁が堤防状に盛り上がってきた</span>。'
  '<span class="kw">時々、かさぶたが付着し、剝がれるとわずかに出血</span>することがあったが、'
  '<span class="kw">痛みや痒みはない</span>。鼻根部に<span class="kw">長径20mmの結節</span>を認める。'
  '<span class="kw">頸部リンパ節の腫大はない</span>。'
  '鼻部の皮疹の写真（A）とダーモスコピー像（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '悪性黒色腫', False, '<span class="kw4">悪性黒色腫も黒色を呈するが、'
                     '日本人では足底・爪などの末端黒子型が最多</span>で、'
                     '<span class="kw4">ダーモスコピーでは色調・構造が不均一（多彩な色調、'
                     '不規則な色素ネットワーク、blue-white veil）</span>を示す。'
                     '<span class="kw4">「中心が凹み、縁が堤防状に隆起」という形態はとらない</span>。'
                     '本例のダーモスコピー像で見える<span class="kw4">樹枝状血管と類円形の大型青灰色胞巣は'
                     '基底細胞癌のパターン</span>である。'),
   ('b', '基底細胞癌', True, '<span class="kw3">①高齢者、②顔面正中（鼻・内眼角）という'
                     '基底細胞癌の最好発部位、③2年かけて緩徐に増大、'
                     '④中心が陥凹し辺縁が堤防状に隆起する「rodent ulcer（結節潰瘍型）」、'
                     '⑤易出血性だが自覚症状に乏しい、⑥リンパ節転移がない</span>——'
                     'すべて<span class="kw3">基底細胞癌〈basal cell carcinoma: BCC〉</span>の典型像である。'
                     '<span class="kw3">日本人のBCCは大半が黒色調（色素性BCC）で、'
                     'ダーモスコピーで樹枝状血管〈arborizing vessels〉と'
                     '青灰色類円形胞巣〈blue-gray ovoid nests〉、maple leaf-like area</span>を認める。'),
   ('c', '日光角化症', False, '<span class="kw4">日光角化症〈光線角化症〉は表皮内癌</span>で、'
                     '<span class="kw4">顔面・手背など日光曝露部に生じる、'
                     '境界不明瞭で紅色の、鱗屑・角化を伴う「ざらついた平坦な斑」</span>である。'
                     '<span class="kw4">長径20mmの隆起した結節にはならず、中心陥凹も来さない</span>'
                     '（<span class="kw">Q.160</span>・<span class="kw">Q.184</span>）。'),
   ('d', '有棘細胞癌', False, '<span class="kw4">有棘細胞癌は、角化を伴う紅色の腫瘤で、'
                     '表面が粗造・易出血性で、進行すると悪臭を伴う潰瘍を形成し、'
                     'しばしば所属リンパ節転移を来す</span>。'
                     '<span class="kw4">本例は2年で20mmと緩徐で、リンパ節腫大もなく、'
                     '境界明瞭な黒色結節</span>である点が異なる。'
                     'なお<span class="kw4">BCCはほとんど転移しないが、SCCは転移する</span>という'
                     '対比が国試では繰り返し問われる。'),
   ('e', '脂漏性角化症', False, '<span class="kw4">脂漏性角化症〈老人性疣贅〉は良性腫瘍</span>で、'
                     '<span class="kw4">境界明瞭で「貼り付けたような（stuck-on）」褐色〜黒色の'
                     '扁平隆起、表面は疣状・脂ぎった感じ</span>を示す。'
                     'ダーモスコピーでは<span class="kw4">面皰様開大〈comedo-like openings〉と'
                     '稗粒腫様囊腫〈milia-like cysts〉</span>が特徴。'
                     '<span class="kw4">中心の陥凹・出血・堤防状隆起はなく、増大しても潰瘍化しない</span>。')],
  '高齢者の顔面正中、緩徐に増大、中心陥凹＋堤防状の隆起した縁（rodent ulcer）、黒色調＝基底細胞癌。ダーモスコピーの樹枝状血管と青灰色卵円形胞巣が決め手。',
  imgs=['images/120D-51_1.jpeg', 'images/120D-51_2.jpeg'],
  patho=('🧬 基底細胞癌——最多の皮膚悪性腫瘍。局所破壊性だがほぼ転移しない',
         '<span class="kw3">基底細胞癌は日本人で最も頻度の高い皮膚悪性腫瘍</span>で、'
         '<span class="kw3">毛包を含む表皮の未分化な基底細胞様細胞に由来</span>する。'
         '<span class="kw3">危険因子は長年の紫外線曝露・高齢・放射線照射既往で、'
         '約8割が顔面（とくに鼻・内眼角・上口唇など正中部＝いわゆるH-zone）に生じる</span>。'
         '<span class="kw3">脂腺母斑〈Jadassohn〉から二次的に発生する</span>ことも国試頻出である。<br>'
         '<span class="kw3">臨床型は、①結節潰瘍型（最多。黒色の光沢ある小結節が増大し、'
         '中央が潰瘍化して辺縁が堤防状に隆起する＝rodent ulcer）、'
         '②表在型（体幹の淡紅色〜褐色の局面）、③斑状強皮症型（境界不明瞭な白色瘢痕様。'
         '深部進展が強く再発しやすい）</span>に分かれる。<br>'
         '<span class="kw3">最大の臨床的特徴は「局所破壊性は強いが遠隔転移はほぼ皆無（0.1％未満）」</span>で、'
         '<span class="kw3">治療は外科的切除が第一選択、'
         '通常は腫瘍辺縁から3〜5mmのマージンで切除すれば治癒する</span>'
         '（<span class="kw">Q.157</span>・<span class="kw">Q.182</span>）。'
         '<span class="kw4">放置すると眼窩・鼻骨・頭蓋へ深く破壊性に進展する</span>ため、'
         '「転移しないから経過観察でよい」わけではない。<br>'
         '<span class="kw3">ダーモスコピーは非侵襲的に確度を上げる最重要ツール</span>で、'
         '<span class="kw3">樹枝状血管、青灰色類円形大胞巣、'
         'maple leaf-like area（葉状領域）、spoke wheel area（車軸状領域）、潰瘍</span>を認め、'
         '<span class="kw3">悪性黒色腫の所見である色素ネットワークを欠く</span>ことが鑑別に効く。'),
  deep=('📌 顔面の黒色・褐色結節の鑑別——ダーモスコピー所見で切る',
        '<table class="tb"><tr><th>疾患</th><th>臨床</th><th>ダーモスコピー</th></tr>'
        '<tr><td><span class="kw3">基底細胞癌</span></td>'
        '<td><span class="kw3">中心陥凹＋堤防状の縁、黒色光沢、易出血</span></td>'
        '<td><span class="kw3">樹枝状血管・青灰色卵円形胞巣・葉状領域</span></td></tr>'
        '<tr><td>脂漏性角化症</td><td>stuck-on、疣状、境界明瞭</td>'
        '<td><span class="kw4">面皰様開大・稗粒腫様囊腫・脳回状構造</span></td></tr>'
        '<tr><td>色素性母斑</td><td>均一な褐色、対称性</td>'
        '<td>規則的な色素ネットワーク・globular pattern</td></tr>'
        '<tr><td><span class="kw4">悪性黒色腫</span></td>'
        '<td><span class="kw4">非対称・辺縁不整・多彩な色調・拡大</span></td>'
        '<td><span class="kw4">不規則ネットワーク・blue-white veil・末端では平行隆線パターン</span></td></tr>'
        '<tr><td>血管腫（血栓化）</td><td>青黒色の柔らかい丘疹</td>'
        '<td>赤紫〜黒色のラクーナ〈lacunae〉</td></tr></table>'
        '<span class="kw3">「顔面正中＋高齢＋中心陥凹の黒色結節」を見たらまずBCC</span>を想起し、'
        'ダーモスコピーで<span class="kw3">色素ネットワークがあるか（母斑・黒色腫系）／'
        '樹枝状血管があるか（BCC）</span>を見るのが実戦的な順序である。'),
  point=('🎯 国試ポイント',
         '① 基底細胞癌＝<span class="kw3">日本人で最多の皮膚悪性腫瘍。顔面正中に好発</span>。<br>'
         '② 形態＝<span class="kw3">黒色光沢のある結節、中心が潰瘍化し辺縁が堤防状（rodent ulcer）</span>。<br>'
         '③ <span class="kw3">局所破壊性は強いが遠隔転移はほぼしない</span>。<br>'
         '④ 治療＝<span class="kw3">辺縁から3〜5mmをつけた外科的切除。断端陰性なら経過観察</span>。<br>'
         '⑤ <span class="kw3">脂腺母斑からの二次発生</span>、<span class="kw3">ダーモスコピーの樹枝状血管</span>は必修。')),

Q('120F-12', 92, [('bs', '★')],
  '<strong>内臓悪性腫瘍の合併を想起すべきなのはどれか。</strong>',
  [('a', '亜鉛欠乏症候群', False, '<span class="kw4">亜鉛欠乏症（腸性肢端皮膚炎を含む）は、'
                     '口囲・肛囲・四肢末端の境界明瞭なびらん性紅斑、脱毛、下痢、'
                     '味覚障害、創傷治癒遅延</span>を来す。'
                     '<span class="kw4">原因は摂取不足・吸収不良・長期輸液・薬剤で、'
                     '内臓悪性腫瘍のマーカーではない</span>。'),
   ('b', '黒色表皮腫', True, '<span class="kw3">黒色表皮腫〈acanthosis nigricans〉は、'
                     '腋窩・頸部・鼠径などの間擦部に生じる、'
                     '褐色調で乳頭腫状にざらついた色素沈着</span>である。'
                     '<span class="kw3">中高年に急速に発症し、口唇・口腔粘膜や手掌にも及ぶ広範な例（悪性型）は'
                     '内臓悪性腫瘍、とくに胃癌の合併を強く示唆する</span>'
                     '（<span class="kw">Q.168</span>・<span class="kw">Q.186</span>）。'
                     '<span class="kw3">デルマドローム〈dermadrome〉の代表格</span>である。'),
   ('c', '弾性線維性仮性黄色腫', False, '<span class="kw4">弾性線維性仮性黄色腫〈PXE〉は'
                     'ABCC6遺伝子変異による常染色体潜性〈劣性〉遺伝疾患</span>で、'
                     '<span class="kw4">頸部・腋窩に黄色小丘疹が敷石状に集簇し（plucked chicken skin）、'
                     '眼底の血管様線条〈angioid streaks〉、消化管出血、'
                     '早発性の動脈硬化・虚血性心疾患</span>を合併する。'
                     '<span class="kw4">悪性腫瘍とは関連しない</span>。'),
   ('d', 'Ehlers-Danlos症候群', False, '<span class="kw4">Ehlers-Danlos症候群はコラーゲン代謝異常による'
                     '遺伝性結合組織疾患</span>で、'
                     '<span class="kw4">皮膚の過伸展性・脆弱性（易出血、菲薄な瘢痕）、'
                     '関節過可動性</span>が主徴。'
                     '<span class="kw4">血管型では動脈・腸管破裂</span>を来すが、'
                     '<span class="kw4">悪性腫瘍の合併は想起しない</span>。'),
   ('e', 'Fabry病', False, '<span class="kw4">Fabry病はα-ガラクトシダーゼA欠損によるX連鎖性のライソゾーム病</span>で、'
                     '<span class="kw4">被膜様分布（下腹部〜殿部・大腿）の被角血管腫、'
                     '四肢末端痛〈acroparesthesia〉、低汗症、角膜混濁、'
                     '進行性腎不全、肥大型心筋症</span>を来す。'
                     '<span class="kw4">悪性腫瘍のマーカーではない</span>。')],
  'デルマドロームの代表＝黒色表皮腫。間擦部のざらついた褐色斑が中年以降に急速に出たら胃癌を探す。',
  patho=('🧬 デルマドローム〈dermadrome〉——皮膚が内臓悪性腫瘍を教える',
         '<span class="kw3">デルマドロームとは、内臓悪性腫瘍に随伴して出現する皮膚病変の総称</span>で、'
         '<span class="kw3">腫瘍そのものの転移ではなく、腫瘍が産生する因子や免疫応答を介した'
         '「遠隔効果」として生じる</span>。'
         '<span class="kw3">悪性腫瘍と時間的に並行して出没する（腫瘍の治療で軽快し、再発で再燃する）</span>のが'
         '定義上の要件である。<br>'
         '<span class="kw3">黒色表皮腫は最も代表的なデルマドローム</span>で、'
         '<span class="kw3">病理は表皮の乳頭腫症〈papillomatosis〉と過角化・棘細胞層の肥厚が本体であり、'
         '実はメラニンの増加は乏しい（褐色に見えるのは角層の肥厚のため）</span>という点が'
         '国試で問われる（<span class="kw">Q.168</span>）。<br>'
         '<span class="kw3">黒色表皮腫には2型ある</span>——'
         '<span class="kw3">①良性型：肥満・インスリン抵抗性（2型糖尿病）・内分泌疾患（Cushing症候群、'
         '多囊胞性卵巣症候群、先端巨大症）に伴い、若年から緩徐に出現する。'
         '高インスリン血症がIGF-1受容体を介して角化細胞・線維芽細胞を増殖させる。'
         '②悪性型：中高年に急速に発症し、範囲が広く、'
         '口唇・口腔粘膜や手掌（tripe palms＝牛肚状手掌）にも及び、瘙痒を伴う。'
         '約6割が胃癌、その他の腺癌（膵・肺・大腸・卵巣）</span>。'
         '<span class="kw3">したがって黒色表皮腫を見たら、まず肥満・糖尿病を確認し、'
         '中高年で急速なら上部消化管内視鏡へ進む</span>（<span class="kw">Q.186</span>）。'),
  deep=('📌 主なデルマドロームと対応する腫瘍',
        '<table class="tb"><tr><th>皮膚所見</th><th>特徴</th><th>想起すべき腫瘍</th></tr>'
        '<tr><td><span class="kw3">黒色表皮腫</span></td>'
        '<td><span class="kw3">間擦部のざらつく褐色斑。悪性型は急速・広範</span></td>'
        '<td><span class="kw3">胃癌（腺癌）</span></td></tr>'
        '<tr><td><span class="kw3">Leser-Trélat徴候</span></td>'
        '<td><span class="kw3">脂漏性角化症が短期間に多発</span></td><td>胃癌・大腸癌</td></tr>'
        '<tr><td><span class="kw3">皮膚筋炎</span></td>'
        '<td><span class="kw3">ヘリオトロープ疹・Gottron徴候</span></td>'
        '<td><span class="kw3">卵巣癌・胃癌・肺癌（40歳以上で悪性合併率が上がる）</span></td></tr>'
        '<tr><td>Sweet病</td><td>発熱＋有痛性の浮腫性紅色局面＋好中球増多</td>'
        '<td><span class="kw4">骨髄異形成症候群・急性骨髄性白血病</span></td></tr>'
        '<tr><td>壊疽性膿皮症</td><td>辺縁が穿掘性の潰瘍。pathergy陽性</td>'
        '<td>炎症性腸疾患・骨髄増殖性疾患・骨髄腫</td></tr>'
        '<tr><td>後天性魚鱗癬</td><td>成人発症の乾燥・鱗屑</td><td>悪性リンパ腫（Hodgkin）</td></tr>'
        '<tr><td>環状紅斑（匐行性回状紅斑）</td><td>木目状に広がる環状紅斑</td><td>肺癌・乳癌</td></tr>'
        '<tr><td>Bazex症候群〈肢端角化症〉</td><td>耳介・鼻・手足の乾癬様角化</td>'
        '<td>上気道・上部消化管の扁平上皮癌</td></tr></table>'
        '<span class="kw4">なお日光角化症は「紫外線による前癌病変」であって'
        '内臓悪性腫瘍のマーカーではない</span>——'
        'これがそのまま <span class="kw">Q.158</span> の答えになる。'),
  point=('🎯 国試ポイント',
         '① デルマドローム＝<span class="kw3">内臓悪性腫瘍に随伴する皮膚病変。転移ではない</span>。<br>'
         '② 代表＝<span class="kw3">黒色表皮腫（胃癌）・Leser-Trélat徴候（胃癌）・皮膚筋炎（卵巣癌など）</span>。<br>'
         '③ 黒色表皮腫の良性型＝<span class="kw3">肥満・インスリン抵抗性</span>、'
         '悪性型＝<span class="kw3">中高年で急速・広範・粘膜にも及ぶ</span>。<br>'
         '④ 病理は<span class="kw3">乳頭腫症と角質増殖であり、メラニン増加は主体でない</span>。<br>'
         '⑤ <span class="kw4">日光角化症・Fabry病・PXE・EDSはデルマドロームではない</span>。')),

]

QUESTIONS += [

Q('119A-4', 60, [('bs', '★')],
  '<strong>疾患と好発部位の組合せで<span class="kw2">誤っている</span>のはどれか。</strong>',
  [('a', '疥　癬  ―――――――――――― 外陰部', False, '<span class="kw4">正しい組合せ。'
                     '疥癬〈scabies〉はヒゼンダニ〈Sarcoptes scabiei〉の寄生による感染症</span>で、'
                     '<span class="kw4">指間・手関節屈側・腋窩・臍囲・外陰部</span>など'
                     '<span class="kw4">皮膚の柔らかい部位</span>に好発する。'
                     'とくに<span class="kw4">男性外陰部（陰囊・陰茎）の瘙痒性の紅色小結節（疥癬結節）は'
                     '本症にほぼ特異的</span>で、夜間に増悪する激しい瘙痒を伴う。'),
   ('b', 'ケロイド  ――――――――――― 耳　介', False, '<span class="kw4">正しい組合せ。'
                     'ケロイドは前胸部（とくに胸骨前）・肩・上背部・恥骨上部・耳垂</span>に好発する。'
                     '<span class="kw4">耳介（耳垂）はピアス孔が契機となる代表的な好発部位</span>である。'
                     '共通するのは<span class="kw4">皮膚の緊張・伸展が大きい部位</span>という点。'),
   ('c', '脂腺母斑  ――――――――――― 頭　部', False, '<span class="kw4">正しい組合せ。'
                     '脂腺母斑〈Jadassohn〉は頭部（有毛部）・顔面に好発</span>し、'
                     '<span class="kw4">出生時から存在する境界明瞭な黄色調の脱毛斑</span>として気付かれる。'
                     '<span class="kw4">思春期に隆起・疣状化し、成人期以降に'
                     '基底細胞癌・乳頭状汗管囊胞腺腫などの二次腫瘍を生じうる</span>のが臨床的な要点である。'),
   ('d', '血管性浮腫  ―――――――――― 口　唇', False, '<span class="kw4">正しい組合せ。'
                     '血管性浮腫〈Quincke浮腫〉は口唇・眼瞼など皮下組織が疎な部位</span>に好発する。'
                     '<span class="kw4">境界不明瞭で非圧痕性、瘙痒に乏しく数日で消退</span>する。'
                     '<span class="kw4">喉頭浮腫を来せば致死的</span>で、'
                     '遺伝性血管性浮腫〈HAE〉ではC1インヒビター欠損によりブラジキニンが蓄積するため'
                     '<span class="kw4">抗ヒスタミン薬・アドレナリンが無効</span>である。'),
   ('e', 'ケラトアカントーマ  ―――――― 臍　部', True, '<span class="kw3">誤り。'
                     'ケラトアカントーマ〈keratoacanthoma〉は高齢者の日光曝露部'
                     '——顔面（とくに鼻・頬）・手背・前腕に好発</span>する。'
                     '<span class="kw3">臍部は日光が当たらず、好発部位ではない</span>。'
                     '本症は<span class="kw3">数週間で急速に増大し、中央に角栓を伴うドーム状結節となり、'
                     '数か月で自然消退する</span>のが特徴である'
                     '（<span class="kw">Q.177</span>）。')],
  'ケラトアカントーマは日光曝露部（顔面・手背）に生じる。臍部は日光が当たらず好発部位でない。',
  patho=('🧬 好発部位から疾患を絞る——「なぜそこにできるか」で覚える',
         '<span class="kw3">皮膚疾患の好発部位は丸暗記ではなく、成因から導ける</span>。<br>'
         '<span class="kw3">①紫外線が原因のもの（日光角化症・有棘細胞癌・基底細胞癌・'
         'ケラトアカントーマ・悪性黒子）は露光部＝顔面・頭部・手背・前腕・下腿前面</span>に出る。'
         '逆に<span class="kw3">臍部・腋窩・殿部などの非露光部に紫外線関連腫瘍が「好発」することはない</span>。<br>'
         '<span class="kw3">②機械的緊張が原因のもの（ケロイド・肥厚性瘢痕）は'
         '前胸部・肩・上背部・恥骨上部・耳垂</span>。<br>'
         '<span class="kw3">③角層が薄く柔らかい部位を好む寄生虫・感染（疥癬）は'
         '指間・手関節屈側・腋窩・臍囲・外陰部</span>。<br>'
         '<span class="kw3">④皮下組織が疎で浮腫が溜まりやすい部位（血管性浮腫）は'
         '眼瞼・口唇・外陰</span>。<br>'
         '<span class="kw3">⑤アポクリン腺が分布する部位に生じるもの'
         '（乳房外Paget病・化膿性汗腺炎）は外陰部・腋窩・肛囲</span>'
         '（<span class="kw">Q.155</span>）。<br>'
         '<span class="kw3">⑥皮脂腺が多い部位（脂漏性皮膚炎・脂腺母斑）は頭部・顔面・前胸部</span>。'),
  deep=('📌 皮膚悪性腫瘍の好発部位まとめ',
        '<table class="tb"><tr><th>腫瘍</th><th>好発部位</th><th>成因の理屈</th></tr>'
        '<tr><td><span class="kw3">基底細胞癌</span></td>'
        '<td><span class="kw3">顔面正中（鼻・内眼角・上口唇）</span></td><td>紫外線＋毛包由来</td></tr>'
        '<tr><td><span class="kw3">有棘細胞癌</span></td>'
        '<td><span class="kw3">顔面・手背・下口唇／熱傷瘢痕・慢性潰瘍・放射線皮膚炎</span></td>'
        '<td>紫外線・慢性刺激・HPV</td></tr>'
        '<tr><td><span class="kw3">日光角化症</span></td><td>顔面・頭部（禿頭）・手背</td>'
        '<td>累積紫外線量に比例</td></tr>'
        '<tr><td><span class="kw3">悪性黒色腫（日本人）</span></td>'
        '<td><span class="kw3">足底・爪部（末端黒子型が約半数）</span></td>'
        '<td><span class="kw4">日本人は紫外線非依存の末端型が多い</span></td></tr>'
        '<tr><td><span class="kw3">乳房外Paget病</span></td>'
        '<td><span class="kw3">外陰部・肛囲・腋窩</span></td><td>アポクリン腺の分布域</td></tr>'
        '<tr><td>血管肉腫</td><td><span class="kw3">頭部・顔面（高齢者）</span></td>'
        '<td>頭部血管肉腫は特徴的</td></tr>'
        '<tr><td>ケラトアカントーマ</td><td>顔面・手背</td><td>露光部</td></tr>'
        '<tr><td>菌状息肉症</td><td><span class="kw4">殿部・大腿など非露光部</span></td>'
        '<td>紫外線と無関係</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">紫外線関連腫瘍は露光部（顔面・手背）</span>——臍部・殿部には出ない。<br>'
         '② <span class="kw3">ケロイドは前胸部・肩・耳垂＝緊張のかかる部位</span>。<br>'
         '③ <span class="kw3">脂腺母斑は頭部の黄色調脱毛斑。基底細胞癌が二次発生</span>。<br>'
         '④ <span class="kw3">疥癬は指間・手関節屈側・外陰部（疥癬結節）</span>。<br>'
         '⑤ <span class="kw3">日本人の悪性黒色腫は足底・爪</span>という例外を必ず押さえる。')),

Q('119D-18', 97, [('bs', '★'), ('bi', '📷')],
  '83歳の男性。陰囊の皮疹を主訴に来院した。'
  '<span class="kw">9か月前から左陰囊に痛みや痒みを伴わない皮疹</span>が出現し、'
  '自宅近くの医療機関で<span class="kw">外用薬による治療</span>をしていたが、'
  '<span class="kw">次第に拡大</span>してきたため紹介受診した。'
  '陰部の写真（A）と生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', 'Bowen病', False, '<span class="kw4">Bowen病も表皮内癌で、'
                     '境界明瞭で不整形の紅褐色局面（鱗屑・痂皮を伴う）</span>として'
                     '陰部にも生じうるため鑑別に挙がる。'
                     'しかし<span class="kw4">病理は表皮全層の異型有棘細胞の増殖（full-thickness atypia）で、'
                     '角化異常（異常角化細胞・多核細胞）を伴う</span>。'
                     '<span class="kw4">本例のような明るい胞体をもつ大型細胞（Paget細胞）の'
                     '孤在性・巣状の散在はみられない</span>（<span class="kw">Q.183</span>・'
                     '<span class="kw">Q.189</span>）。'),
   ('b', '悪性黒色腫', False, '<span class="kw4">悪性黒色腫であれば黒色調が主体</span>となり、'
                     '<span class="kw4">病理では表皮基底層〜真皮にメラニン顆粒を有する'
                     '異型メラノサイトの増殖、HMB-45・Melan-A・S-100陽性</span>を示す。'
                     '本例は<span class="kw4">境界明瞭な紅色局面で黒色調に乏しく</span>合致しない。'),
   ('c', '基底細胞癌', False, '<span class="kw4">基底細胞癌は顔面正中に好発し、'
                     '陰囊は極めてまれ</span>。'
                     '<span class="kw4">形態も黒色光沢のある結節で中心が潰瘍化する</span>ものであり、'
                     '<span class="kw4">病理は基底細胞様腫瘍胞巣が表皮から真皮へ連続し、'
                     '辺縁に柵状配列〈palisading〉と裂隙〈retraction artifact〉</span>を示す。'
                     '本例の像とは異なる。'),
   ('d', '脂漏性角化症', False, '<span class="kw4">脂漏性角化症は良性の表皮腫瘍で、'
                     '境界明瞭な褐色〜黒色の「貼り付けたような」扁平隆起</span>。'
                     '<span class="kw4">9か月で拡大し続ける紅色局面にはならず、'
                     '病理も角化嚢腫〈horn cyst〉を伴う基底細胞様細胞の増殖</span>で異型を伴わない。'),
   ('e', '乳房外Paget病', True, '<span class="kw3">①高齢男性、②陰囊という'
                     'アポクリン腺分布域の好発部位、③9か月以上かけて緩徐に拡大、'
                     '④「湿疹」として外用治療されていたが治らない、'
                     '⑤境界明瞭で紅色調の、一部白色調の混じる湿潤性局面</span>——'
                     '<span class="kw3">乳房外Paget病〈extramammary Paget disease〉</span>の典型像である。'
                     '<span class="kw3">病理では、表皮内に明るく広い胞体と大型核をもつ'
                     'Paget細胞が孤在性・胞巣状に散在（pagetoid spread）</span>し、'
                     '<span class="kw3">PAS陽性・CK7陽性・CEA陽性、S-100陰性</span>で確定する。')],
  '高齢男性の外陰部で「治らない湿疹」が緩徐に拡大＝乳房外Paget病。病理の表皮内に散在する明るい大型細胞（Paget細胞）が決め手。',
  imgs=['images/119D-18_1.jpeg', 'images/119D-18_2.jpeg'],
  patho=('🧬 乳房外Paget病——「治らない陰部の湿疹」の正体は表皮内腺癌',
         '<span class="kw3">乳房外Paget病は、アポクリン腺に関連した表皮内腺癌</span>で、'
         '<span class="kw3">外陰部（男性は陰囊・陰茎、女性は大陰唇）・肛囲・腋窩</span>という'
         '<span class="kw3">アポクリン腺が分布する部位に一致して発生</span>する。'
         '<span class="kw3">60〜80歳代の高齢者、日本では男性に多い</span>。<br>'
         '<span class="kw3">臨床の要点は「数年単位で緩徐に拡大する境界明瞭な紅色局面」</span>で、'
         '<span class="kw3">びらん・湿潤・白色調の脱色素部分が混在し、瘙痒を伴うことも伴わないこともある</span>。'
         '<span class="kw3">湿疹・白癬・カンジダとして長期間外用治療され、'
         '「治らない」ことでようやく生検に至る</span>——これが国試での定型的な提示のされ方である'
         '（<span class="kw">Q.181</span>・<span class="kw">Q.190</span>）。<br>'
         '<span class="kw3">病理の核心はPaget細胞</span>——'
         '<span class="kw3">豊富で明るい（淡明な）胞体と大型で異型のある核をもつ細胞が、'
         '表皮内を孤在性あるいは小胞巣状に上方へ散らばる（pagetoid spread）</span>。'
         '<span class="kw3">粘液を含むためPAS染色・アルシアン青陽性、'
         '免疫染色はCK7陽性・CEA陽性・GCDFP-15陽性、S-100とHMB-45は陰性</span>（＝黒色腫の除外）。<br>'
         '<span class="kw3">治療は外科的切除が第一選択</span>で、'
         '<span class="kw3">臨床的な境界より広く（通常1〜3cm）マージンをとる、'
         'あるいはマッピング生検で範囲を確認してから切除する</span>。'
         '<span class="kw4">境界を越えて表皮内進展しているため、'
         '見た目どおりに切ると高率に再発する</span>（<span class="kw">Q.170</span>）。'
         '<span class="kw3">真皮浸潤があればリンパ節転移のリスクが生じ、'
         'センチネルリンパ節生検・所属リンパ節郭清が検討される</span>。'),
  deep=('📌 Paget病：乳房と乳房外の違い',
        '<table class="tb"><tr><th></th><th>乳房Paget病</th><th>乳房外Paget病</th></tr>'
        '<tr><td>部位</td><td><span class="kw3">乳頭・乳輪</span></td>'
        '<td><span class="kw3">外陰部・肛囲・腋窩</span></td></tr>'
        '<tr><td>本態</td><td><span class="kw4">ほぼ全例が乳管癌の表皮内進展（＝乳癌の一型）</span></td>'
        '<td><span class="kw3">大半は原発性の表皮内腺癌（アポクリン腺由来）</span></td></tr>'
        '<tr><td>随伴腫瘍</td><td><span class="kw4">乳癌の検索が必須</span></td>'
        '<td>約1割で下部尿路・直腸肛門の腺癌の表皮内進展（続発性）→'
        '<span class="kw4">大腸内視鏡・膀胱鏡を検討</span></td></tr>'
        '<tr><td>臨床</td><td>片側乳頭のびらん・鱗屑・分泌</td>'
        '<td>境界明瞭な紅色局面。緩徐に拡大</td></tr>'
        '<tr><td>治療</td><td>乳癌に準じる</td>'
        '<td><span class="kw3">広範囲切除（マッピング生検）</span></td></tr></table>'
        '<span class="kw3">共通するのはPaget細胞（CK7陽性・PAS陽性）</span>であり、'
        '<span class="kw4">「表皮内を這って広がる腺癌細胞」という点が両者の本質</span>である。'),
  point=('🎯 国試ポイント',
         '① 乳房外Paget病＝<span class="kw3">アポクリン腺領域（外陰・肛囲・腋窩）の表皮内腺癌</span>。<br>'
         '② 臨床＝<span class="kw3">高齢者の「治らない湿疹」。境界明瞭な紅色局面が緩徐に拡大</span>。<br>'
         '③ 病理＝<span class="kw3">明るい胞体の大型Paget細胞が表皮内に散在。PAS・CK7・CEA陽性、S-100陰性</span>。<br>'
         '④ 治療＝<span class="kw3">十分なマージンをとった切除。狭いと再発する</span>。<br>'
         '⑤ <span class="kw3">乳房Paget病は乳癌の表皮内進展</span>——乳癌の検索が必須。')),

Q('118A-20', 95, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '36歳の女性。右上腕の皮疹を主訴に来院した。'
  '<span class="kw">約10年前から右上腕に長径3mmほどで平坦な皮疹</span>が出現した。'
  '<span class="kw">約3か月前から次第に拡大し隆起</span>してきた。'
  '<span class="kw">2週間前から出血</span>するようになった。'
  '右上腕に<span class="kw">18×16mmの褐色結節</span>を認める。'
  '<span class="kw">右腋窩に径1cmのリンパ節1つを触知</span>する。'
  '右上腕の写真（A）とダーモスコピー像（B）を示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', 'Bowen病', False, '<span class="kw4">Bowen病は表皮内の有棘細胞癌</span>で、'
                     '<span class="kw4">境界明瞭で不整形の、鱗屑・痂皮を伴う紅褐色の「局面」</span>である。'
                     '<span class="kw4">隆起した黒褐色の結節にはならず、'
                     'ダーモスコピーで色素ネットワークも示さない</span>。'),
   ('b', '悪性黒色腫', True, '<span class="kw3">①長年存在した平坦な色素斑が、'
                     '②直近3か月で急速に拡大・隆起し、③出血するようになり、'
                     '④18×16mmと6mmを大きく超え、⑤所属リンパ節（右腋窩）を触知</span>——'
                     '<span class="kw3">「もともとあったほくろが最近変化した」という病歴は'
                     '悪性黒色腫の最重要のサイン</span>である。'
                     '<span class="kw3">ダーモスコピーでも、色調が多彩で辺縁が不整、'
                     '不規則な色素ネットワークと青白色構造〈blue-white veil〉</span>を認め'
                     '悪性を支持する。'),
   ('c', '色素性母斑', False, '<span class="kw4">色素性母斑〈母斑細胞母斑〉は良性</span>で、'
                     '<span class="kw4">左右対称・辺縁整・色調均一で、径は通常6mm以下、'
                     '成長は身体の成長に比例して緩徐</span>である。'
                     '<span class="kw4">3か月で急速に増大し出血する経過は良性の経過ではない</span>。'
                     '本例のように<span class="kw4">長年の母斑を背景に黒色腫が発生することもある</span>ので、'
                     '「昔からあるから良性」とは言えない。'),
   ('d', '日光角化症', False, '<span class="kw4">日光角化症は高齢者の露光部（顔面・手背）に生じる'
                     '鱗屑を伴う紅色の平坦な角化性病変</span>で、'
                     '<span class="kw4">36歳の上腕に褐色結節として出る疾患ではない</span>。'),
   ('e', '脂漏性角化症', False, '<span class="kw4">脂漏性角化症は中高年に生じる良性腫瘍</span>で、'
                     '<span class="kw4">表面が疣状で「貼り付けたような」境界明瞭な褐色隆起</span>。'
                     'ダーモスコピーでは<span class="kw4">面皰様開大・稗粒腫様囊腫・脳回状構造</span>を示し、'
                     '<span class="kw4">急速増大・出血・リンパ節腫大は来さない</span>。')],
  '既存の色素斑が数か月で急速に拡大・隆起・出血し、径18mm、所属リンパ節も触知＝悪性黒色腫。ABCDE基準のE（Evolving）が決め手。',
  imgs=['images/118A-20_1.jpeg', 'images/118A-20_2.jpeg'],
  patho=('🧬 悪性黒色腫——ABCDE基準と日本人に特有の病型分布',
         '<span class="kw3">悪性黒色腫はメラノサイト由来の悪性腫瘍で、'
         '皮膚悪性腫瘍のなかで最も予後が悪い</span>。'
         '<span class="kw3">早期はリンパ行性・血行性転移を来しやすく、'
         '厚さ（腫瘍浸潤の深さ）が予後を規定する</span>のが最大の特徴である'
         '（<span class="kw">Q.162</span>）。<br>'
         '<span class="kw3">診断のスクリーニングはABCDE基準</span>——'
         '<span class="kw3">A: Asymmetry（非対称性）、B: Border irregularity（辺縁不整）、'
         'C: Color variegation（色調不均一・多彩）、D: Diameter＞6mm（大きさ）、'
         'E: Evolving/Elevation（変化・隆起）</span>。'
         '<span class="kw4">「黒色調の強さ」は指標ではない</span>——'
         '<span class="kw4">むしろ均一に濃い黒より、濃淡が入り混じる不均一さが悪性を示唆する</span>'
         '（<span class="kw">Q.166</span>）。<br>'
         '<span class="kw3">病型は4つ</span>——'
         '<span class="kw3">①末端黒子型〈acral lentiginous melanoma: ALM〉：'
         '足底・手掌・爪部。日本人で最多（約半数）で、紫外線とは無関係。'
         '②表在拡大型〈SSM〉：白人で最多。体幹・四肢の既存母斑に生じることが多い。'
         '③結節型〈NM〉：初めから隆起し垂直方向へ速く進む。予後不良。'
         '④悪性黒子型〈LMM〉：高齢者の顔面。累積紫外線量が原因で、進行は緩徐</span>。<br>'
         '<span class="kw3">診断は原則としてダーモスコピー＋切除生検（全切除生検）</span>で行う。'
         '<span class="kw4">部分生検は、腫瘍の最も厚い部分を評価できず病期を誤る危険があるため'
         '原則として避ける</span>（<span class="kw">Q.180</span>）。'
         '<span class="kw3">確定後は腫瘍厚〈Breslow thickness〉と潰瘍の有無でpTを決め、'
         'センチネルリンパ節生検でリンパ節郭清の適応を判断する</span>。'),
  deep=('📌 ダーモスコピーで良悪を切り分ける',
        '<table class="tb"><tr><th>所見</th><th>良性（色素性母斑）</th><th>悪性黒色腫</th></tr>'
        '<tr><td>体幹・四肢</td><td>規則的な色素ネットワーク、'
        'globular/homogeneous pattern、対称性</td>'
        '<td><span class="kw3">不規則ネットワーク、辺縁の突然の途切れ、'
        'blue-white veil、不規則な点・小球、退縮構造</span></td></tr>'
        '<tr><td><span class="kw3">足底（掌蹠）</span></td>'
        '<td><span class="kw3">平行溝パターン〈parallel furrow pattern〉'
        '＝皮溝に沿って色素が並ぶ</span></td>'
        '<td><span class="kw3">平行隆線パターン〈parallel ridge pattern〉'
        '＝皮丘（汗孔のある隆線）に色素が並ぶ</span></td></tr>'
        '<tr><td>爪</td><td>均一な幅・色調の縦条、境界明瞭</td>'
        '<td><span class="kw3">線の幅・間隔・色調が不均一、'
        '近位で幅広い三角形、Hutchinson徴候（爪郭への色素滲み出し）</span></td></tr></table>'
        '<span class="kw3">足底の色素斑では「溝か、丘か」の一点で判断できる</span>——'
        '<span class="kw3">汗孔が並ぶ隆線（皮丘）に色素があれば悪性</span>と覚える。'
        'この非侵襲的な判別が、<span class="kw">Q.163</span>・<span class="kw">Q.188</span> の'
        '「有用な検査＝ダーモスコピー」の根拠になっている。'),
  point=('🎯 国試ポイント',
         '① 悪性黒色腫＝<span class="kw3">ABCDE基準（非対称・辺縁不整・色調不均一・6mm超・変化）</span>。<br>'
         '② <span class="kw3">「既存の母斑が最近変化した／出血した」は最重要の危険サイン</span>。<br>'
         '③ <span class="kw3">日本人は末端黒子型（足底・爪）が最多</span>で紫外線と無関係。<br>'
         '④ <span class="kw3">診断はダーモスコピー＋全切除生検。部分生検は原則避ける</span>。<br>'
         '⑤ <span class="kw3">予後を決めるのは腫瘍厚（Breslow）＝深達度</span>。')),

]

QUESTIONS += [

Q('117A-37', 91, [('bs', '★'), ('bi', '📷')],
  '60歳の女性。皮疹を主訴に来院した。'
  '<span class="kw">1年前から右肩甲部に皮疹が出現し徐々に拡大</span>してきた。痒みや痛みはない。'
  '右肩甲部に<span class="kw">約2cmの境界明瞭で平坦な淡褐色結節</span>を認める。'
  '血液所見と血液生化学所見とに異常を認めない。'
  '<span class="kw">胸腹部造影CTで明らかな転移を認めない</span>。'
  '生検で病理診断を行った後、<span class="kw">結節を辺縁から5mm離して切除</span>した。'
  '術前の右肩甲部の写真（A）と摘出組織のH-E染色標本（B）とを示す。'
  '<span class="kw">H-E染色標本で切除断端に病変はなかった</span>。<br>'
  '<strong>切除後の対応で適切なのはどれか。</strong>',
  [('a', '拡大切除', False, '<span class="kw4">拡大切除（追加切除）が必要になるのは、'
                     '断端陽性の場合、または悪性黒色腫のように腫瘍厚に応じた'
                     '規定マージンが定められている場合</span>である。'
                     '<span class="kw4">本例は5mmマージンで断端陰性が確認された基底細胞癌であり、'
                     '追加切除は過剰治療</span>となる。'),
   ('b', '経過観察', True, '<span class="kw3">病理像は、表皮から連続する好塩基性の腫瘍胞巣が'
                     '真皮内に増殖し、胞巣辺縁で核が柵状に配列〈palisading〉、'
                     '周囲間質との間に裂隙〈retraction artifact〉</span>を認める'
                     '<span class="kw3">基底細胞癌</span>の像である。'
                     '<span class="kw3">基底細胞癌は遠隔転移がほぼなく、'
                     '3〜5mmのマージンで切除し断端陰性であれば治癒が期待できる</span>。'
                     '<span class="kw3">追加治療は不要で、局所再発と新規病変の監視のために'
                     '定期的な経過観察を行う</span>のが標準である。'),
   ('c', '電子線照射', False, '<span class="kw4">放射線（電子線）照射は、'
                     '手術が困難な部位・高齢や合併症で手術に耐えない症例・'
                     '切除後に断端陽性で追加切除が難しい症例</span>で選択される。'
                     '<span class="kw4">断端陰性で完全切除された症例に予防照射を行う意義はなく、'
                     '晩期の放射線皮膚炎から二次癌のリスクを増やす</span>だけである。'),
   ('d', 'PUVA療法', False, '<span class="kw4">PUVA療法はソラレン＋長波長紫外線による光線療法</span>で、'
                     '<span class="kw4">乾癬・尋常性白斑・菌状息肉症（早期）・掌蹠膿疱症</span>などに用いる。'
                     '<span class="kw4">紫外線は基底細胞癌の発症要因そのもの</span>であり、'
                     '術後に照射するのは有害無益である。'),
   ('e', '薬物による抗癌治療', False, '<span class="kw4">全身化学療法や分子標的薬'
                     '（ヘッジホッグ経路阻害薬ビスモデギブ等）が対象となるのは、'
                     '切除不能な局所進行例・転移例</span>という極めて限られた状況のみ。'
                     '<span class="kw4">完全切除された基底細胞癌に術後補助化学療法を行う根拠はない</span>。')],
  '病理は柵状配列＋裂隙をもつ基底細胞癌。5mmマージンで断端陰性なら追加治療は不要で、経過観察でよい。',
  imgs=['images/117A-37_1.jpeg', 'images/117A-37_2.jpeg'],
  patho=('🧬 基底細胞癌の病理と、切除マージンの考え方',
         '<span class="kw3">基底細胞癌の病理像は特徴的で、'
         '①表皮基底層から連続して真皮内へ落ち込む好塩基性の腫瘍胞巣、'
         '②胞巣最外層の細胞が核を垂直に揃える柵状配列〈peripheral palisading〉、'
         '③固定操作で腫瘍胞巣と間質の間に生じる裂隙〈retraction artifact／clefting〉、'
         '④腫瘍細胞は基底細胞に似て核細胞質比が高いが、核異型・分裂像は比較的乏しい</span>。'
         '<span class="kw3">この「柵状配列＋裂隙」の2点セットが有棘細胞癌との決定的な違い</span>である'
         '（有棘細胞癌は角化＝癌真珠を作り、細胞間橋が目立つ）。<br>'
         '<span class="kw3">治療の原則は外科的切除</span>で、'
         '<span class="kw3">結節潰瘍型など境界明瞭な型では臨床的辺縁から3〜5mmのマージン</span>、'
         '<span class="kw4">斑状強皮症型・再発例・H-zone（鼻・眼瞼・耳など再発しやすい高リスク部位）では'
         'より広いマージンやMohs手術／術中迅速病理での断端確認</span>が推奨される。<br>'
         '<span class="kw3">術後の要点は「断端が陰性なら追加治療は不要」</span>——'
         '<span class="kw3">基底細胞癌は遠隔転移が0.1％未満と極めてまれで、'
         '再発は切除断端の遺残による局所再発がほぼすべて</span>だからである。'
         '<span class="kw3">一方で紫外線曝露を共有するため、'
         '同一患者に別の基底細胞癌・日光角化症・有棘細胞癌が新生する頻度が高く、'
         '全身の皮膚の定期チェックと遮光指導が経過観察の中身になる</span>。'),
  deep=('📌 皮膚悪性腫瘍の切除マージンと術後対応',
        '<table class="tb"><tr><th>腫瘍</th><th>標準マージン</th><th>断端陰性後の対応</th></tr>'
        '<tr><td><span class="kw3">基底細胞癌</span></td>'
        '<td><span class="kw3">3〜5mm</span>（高リスク型はより広く）</td>'
        '<td><span class="kw3">経過観察</span>（転移監視は不要）</td></tr>'
        '<tr><td><span class="kw3">有棘細胞癌</span></td>'
        '<td><span class="kw3">4〜10mm（低リスク）／10mm以上（高リスク）</span></td>'
        '<td><span class="kw3">所属リンパ節の触診・エコーで転移監視</span></td></tr>'
        '<tr><td><span class="kw3">悪性黒色腫</span></td>'
        '<td><span class="kw3">腫瘍厚で決まる：in situ 5mm／≤1mm 1cm／'
        '1〜2mm 1〜2cm／＞2mm 2cm</span></td>'
        '<td><span class="kw3">厚さ≧0.8mm等でセンチネルリンパ節生検</span></td></tr>'
        '<tr><td>日光角化症・Bowen病（表皮内癌）</td><td>数mm（凍結・イミキモド等も可）</td>'
        '<td>経過観察</td></tr>'
        '<tr><td>乳房外Paget病</td>'
        '<td><span class="kw4">1〜3cm＋マッピング生検（境界を越えて進展するため）</span></td>'
        '<td>再発監視</td></tr></table>'
        '<span class="kw3">「転移する腫瘍か（SCC・melanoma）／しない腫瘍か（BCC）」で'
        '術後のフォローの中身が変わる</span>——これが本問の本質である。'),
  point=('🎯 国試ポイント',
         '① 基底細胞癌の病理＝<span class="kw3">柵状配列＋腫瘍胞巣周囲の裂隙</span>。<br>'
         '② <span class="kw3">3〜5mmマージンで断端陰性なら追加治療不要＝経過観察</span>。<br>'
         '③ <span class="kw4">断端陽性のときに初めて追加切除／放射線を考える</span>。<br>'
         '④ <span class="kw3">紫外線が原因なので、術後は遮光指導と新規病変のチェック</span>。<br>'
         '⑤ <span class="kw4">PUVAは禁物（紫外線は発癌要因）</span>——同型の問題が'
         '<span class="kw">Q.182</span> にもある。')),

Q('117F-26', 53, [('bs', '★')],
  '<strong>デルマドロームで<span class="kw2">ない</span>のはどれか。</strong>',
  [('a', 'Sweet病', False, '<span class="kw4">Sweet病〈急性熱性好中球性皮膚症〉は'
                     'デルマドロームである</span>。'
                     '<span class="kw4">発熱・有痛性の浮腫性紅色局面（顔面・頸部・上肢）・'
                     '末梢血好中球増多・病理で真皮上層の稠密な好中球浸潤（血管炎は伴わない）</span>が特徴で、'
                     '<span class="kw4">約2割に血液悪性腫瘍（とくに骨髄異形成症候群・急性骨髄性白血病）</span>を'
                     '合併する。ステロイド全身投与が著効する。'),
   ('b', '皮膚筋炎', False, '<span class="kw4">皮膚筋炎はデルマドロームの代表格</span>である。'
                     '<span class="kw4">ヘリオトロープ疹・Gottron徴候・V徴候・ショール徴候と'
                     '近位筋優位の筋力低下</span>を示し、'
                     '<span class="kw4">40歳以上の成人発症例では約2〜3割に悪性腫瘍'
                     '（卵巣癌・胃癌・肺癌・大腸癌など）を合併</span>する。'
                     '<span class="kw4">診断時に悪性腫瘍のスクリーニングが必須</span>で、'
                     'とくに抗TIF1-γ抗体陽性例で合併率が高い。'),
   ('c', '黒色表皮腫', False, '<span class="kw4">黒色表皮腫はデルマドロームの筆頭</span>。'
                     '<span class="kw4">中高年で急速に出現し、範囲が広く粘膜にも及ぶ悪性型は'
                     '胃癌をはじめとする腺癌</span>を強く示唆する'
                     '（<span class="kw">Q.153</span>・<span class="kw">Q.186</span>）。'),
   ('d', '日光角化症', True, '<span class="kw3">日光角化症〈光線角化症〉は、'
                     '長年の紫外線曝露により露光部の表皮角化細胞に生じる表皮内癌（前癌病変）</span>であり、'
                     '<span class="kw3">「皮膚そのものの腫瘍」であって内臓悪性腫瘍とは無関係</span>である。'
                     '<span class="kw3">デルマドロームは内臓悪性腫瘍に随伴して出現する皮膚病変を指すため、'
                     '定義上あてはまらない</span>。'),
   ('e', '壊疽性膿皮症', False, '<span class="kw4">壊疽性膿皮症もデルマドロームに含まれる</span>。'
                     '<span class="kw4">急速に拡大し、辺縁が穿掘性・堤防状で紫紅色を呈する'
                     '有痛性潰瘍</span>で、'
                     '<span class="kw4">潰瘍性大腸炎・Crohn病、関節リウマチ、'
                     '骨髄増殖性疾患・単クローン性γグロブリン血症（IgA型）</span>を合併する。'
                     '<span class="kw4">軽微な外傷で新病変が生じるpathergy現象</span>のため'
                     'デブリドマンは禁忌に近い。')],
  '日光角化症は紫外線による皮膚自体の前癌病変で、内臓悪性腫瘍の随伴徴候ではない。他の4つはいずれも悪性腫瘍を探すきっかけになる。',
  patho=('🧬 デルマドロームの「定義」で解く',
         '<span class="kw3">デルマドローム＝内臓悪性腫瘍に随伴して現れる皮膚病変</span>。'
         '<span class="kw3">腫瘍の転移でも、腫瘍が皮膚に直接浸潤したものでもなく、'
         '腫瘍が産生するサイトカイン・成長因子や免疫学的機序を介した遠隔効果</span>である。'
         '<span class="kw3">したがって「皮膚原発の腫瘍・前癌病変」はデルマドロームには入らない</span>——'
         'この一点だけで本問は解ける。<br>'
         '<span class="kw3">選択肢を分類すると</span>：'
         '<span class="kw3">Sweet病（血液悪性腫瘍）・皮膚筋炎（固形癌）・黒色表皮腫（胃癌）・'
         '壊疽性膿皮症（IBD・血液疾患）はいずれも「他臓器の病気を皮膚が知らせる」病態</span>。'
         '対して<span class="kw4">日光角化症は紫外線が角化細胞のDNAに与えた損傷（p53変異など）が'
         '蓄積して生じた表皮内癌そのもの</span>であり、'
         '<span class="kw4">位置づけが根本的に異なる</span>。<br>'
         '<span class="kw4">なお本問の正答率が53％と低いのは、'
         '「日光角化症＝癌に関係する」という連想でｄを外してしまうため</span>と考えられる。'
         '<span class="kw3">問われているのは「内臓悪性腫瘍の存在を示唆するか」であって'
         '「悪性かどうか」ではない</span>点に注意する。'),
  deep=('📌 皮膚と悪性腫瘍の3つの関係を区別する',
        '<table class="tb"><tr><th>関係</th><th>内容</th><th>例</th></tr>'
        '<tr><td><span class="kw3">デルマドローム（傍腫瘍症候群）</span></td>'
        '<td><span class="kw3">遠隔効果として生じる皮膚病変</span></td>'
        '<td><span class="kw3">黒色表皮腫、Leser-Trélat徴候、皮膚筋炎、Sweet病、'
        '壊疽性膿皮症、後天性魚鱗癬、Bazex症候群</span></td></tr>'
        '<tr><td>皮膚転移・直接浸潤</td><td>腫瘍細胞そのものが皮膚に存在</td>'
        '<td>Sister Mary Joseph結節（臍転移）、炎症性乳癌、皮膚白血病</td></tr>'
        '<tr><td><span class="kw4">皮膚原発の悪性腫瘍・前癌病変</span></td>'
        '<td><span class="kw4">皮膚そのものの腫瘍</span></td>'
        '<td><span class="kw4">日光角化症、Bowen病、有棘細胞癌、基底細胞癌、悪性黒色腫</span></td></tr>'
        '<tr><td>（参考）遺伝性腫瘍症候群の皮膚所見</td><td>同じ遺伝子異常が皮膚と内臓に発現</td>'
        '<td>Cowden病（外毛根鞘腫＋乳癌・甲状腺癌）、'
        'Muir-Torre症候群（脂腺腫瘍＋大腸癌）、Peutz-Jeghers症候群（口唇色素斑＋消化管過誤腫）</td></tr></table>'
        '<span class="kw3">「デルマドロームでないもの」を問われたら、'
        'まず皮膚原発の腫瘍・前癌病変を探す</span>のが最短経路である。'),
  point=('🎯 国試ポイント',
         '① デルマドローム＝<span class="kw3">内臓悪性腫瘍の遠隔効果としての皮膚病変</span>。'
         '転移・浸潤ではない。<br>'
         '② <span class="kw4">日光角化症・Bowen病は皮膚原発の前癌病変＝デルマドロームではない</span>。<br>'
         '③ Sweet病＝<span class="kw3">発熱＋有痛性紅色局面＋好中球増多。MDS/AMLを探す</span>。<br>'
         '④ 壊疽性膿皮症＝<span class="kw3">穿掘性潰瘍＋pathergy。IBDと血液疾患</span>。<br>'
         '⑤ 皮膚筋炎＝<span class="kw3">40歳以上では悪性腫瘍スクリーニング必須</span>。')),

Q('116A-60', 86, [('bs', '★'), ('bi', '📷')],
  '80歳の男性。左側頭部から左頰部の皮疹を主訴に来院した。'
  '<span class="kw">3か月前に左側頭部に紫紅色斑が出現</span>した。'
  '<span class="kw">次第に拡大、隆起し、出血するように</span>なった。'
  '<span class="kw">10年前から心房細動で抗凝固薬を服用中</span>である。'
  '<span class="kw">皮疹の契機について思い当たることはない</span>という。'
  '左側頭部に皮疹を認める。<span class="kw">鱗屑は認めない</span>。'
  '<span class="kw">左頸部リンパ節を触知</span>する。左側頭部の写真を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '血管肉腫', True, '<span class="kw3">①高齢者、②頭部・顔面という好発部位、'
                     '③打撲などの契機なく出現した紫紅色斑（＝一見「あざ」に見える）、'
                     '④3か月で拡大・隆起・易出血化、⑤鱗屑がない（表皮病変ではなく真皮の血管病変）、'
                     '⑥所属リンパ節を触知</span>——'
                     '<span class="kw3">頭部血管肉腫〈angiosarcoma〉</span>の典型像である。'
                     '<span class="kw3">「高齢者の頭部にできた、治らない・広がる打撲痕様の紫斑」は'
                     '国試での定型的な提示</span>で、'
                     '<span class="kw3">早期から肺転移を来し極めて予後不良</span>である'
                     '（<span class="kw">Q.176</span>・<span class="kw">Q.178</span>・'
                     '<span class="kw">Q.187</span>）。'),
   ('b', '有棘細胞癌', False, '<span class="kw4">有棘細胞癌は角化を伴う紅色の腫瘤で、'
                     '表面に鱗屑・痂皮・角栓を伴い、進行すると悪臭のある潰瘍</span>を作る。'
                     '<span class="kw4">本例は鱗屑がなく紫紅色（血管性）の色調</span>で合致しない。'
                     'また多くは<span class="kw4">日光角化症・熱傷瘢痕などの前駆病変や'
                     '慢性刺激の既往</span>を伴う。'),
   ('c', '老人性紫斑', False, '<span class="kw4">老人性紫斑〈senile purpura〉は、'
                     '加齢による真皮結合織の脆弱化で前腕伸側・手背に生じる'
                     '境界明瞭な暗紫色斑</span>で、'
                     '<span class="kw4">平坦で隆起せず、1〜2週で自然に消退する</span>。'
                     '<span class="kw4">3か月かけて拡大・隆起し出血するようになる経過は紫斑ではない</span>。'),
   ('d', '血管拡張性肉芽腫', False, '<span class="kw4">血管拡張性肉芽腫〈毛細血管拡張性肉芽腫・'
                     '化膿性肉芽腫〉は、外傷を契機に手指・口唇などに生じる'
                     '有茎性の鮮紅色小結節</span>で、'
                     '<span class="kw4">数週で急速に大きくなるが通常1〜2cm程度で頭打ちになり、'
                     '易出血性だが良性</span>である。'
                     '<span class="kw4">リンパ節腫大は来さず、'
                     '広範な浸潤性の紫紅色局面にもならない</span>。'),
   ('e', '抗凝固薬の内服による紫斑', False, '<span class="kw4">抗凝固薬による紫斑は、'
                     '打撲部位に一致して出現し、平坦で、時間とともに色調が変化して消退</span>する。'
                     '<span class="kw4">「隆起する」「拡大し続ける」「リンパ節を触知する」ことはない</span>。'
                     '本例で服薬歴は<span class="kw4">紫斑と誤認させて診断を遅らせるための'
                     '撹乱因子</span>であり、'
                     '実際にこの誤認が頭部血管肉腫の発見を遅らせる最大の要因になっている。')],
  '高齢者の頭部に契機なく出た紫紅色斑が拡大・隆起・出血し、リンパ節も触知＝血管肉腫。「消えない打撲痕」を紫斑と片付けないことが要点。',
  imgs=['images/116A-60_1.jpeg'],
  patho=('🧬 血管肉腫——高齢者の頭部にできる「消えないあざ」',
         '<span class="kw3">血管肉腫〈angiosarcoma〉は血管内皮細胞に由来する悪性腫瘍</span>で、'
         '<span class="kw3">皮膚の軟部悪性腫瘍のなかでもとくに予後不良（5年生存率10〜20％程度）</span>である。'
         '<span class="kw3">3つの臨床型</span>を押さえる——'
         '<span class="kw3">①頭部顔面型（高齢者・特発性）：最多。70〜80歳代の頭部（有毛部）〜顔面に生じる。'
         '②慢性リンパ浮腫関連〈Stewart-Treves症候群〉：乳癌の腋窩郭清後の'
         '慢性リンパ浮腫肢に長期を経て発生。③放射線照射後</span>。<br>'
         '<span class="kw3">臨床経過は「境界不明瞭な紫紅色斑（打撲痕・血腫に酷似）として始まり、'
         '数か月で拡大・隆起・結節化し、易出血性となる」</span>。'
         '<span class="kw3">鱗屑を伴わない（表皮ではなく真皮の血管の病変）</span>点が'
         '有棘細胞癌・日光角化症との簡便な鑑別点になる。'
         '<span class="kw4">「頭を打った覚えがないのに、あざが消えずに広がる高齢者」を見たら本症を疑う</span>のが'
         '早期発見の鍵である。<br>'
         '<span class="kw3">病理では、不規則に吻合する血管腔を、'
         '核異型の強い内皮細胞が多層性・乳頭状に裏打ちして増殖し、'
         '既存の膠原線維束の間を解離するように浸潤（dissecting pattern）</span>する。'
         '<span class="kw3">免疫染色はCD31・CD34・第Ⅷ因子関連抗原〈vWF〉・ERG陽性</span>。<br>'
         '<span class="kw3">きわめて早期から肺転移（とくに気胸を伴う多発嚢胞性転移）を来す</span>のが'
         '本症の悪名高い特徴で（<span class="kw">Q.178</span>）、'
         '<span class="kw3">治療は広範切除＋放射線＋パクリタキセルなどの化学療法を組み合わせるが、'
         '境界不明瞭で完全切除が難しく予後は不良</span>である。'),
  deep=('📌 頭部・顔面の紫紅色病変の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>経過</th><th>鍵</th></tr>'
        '<tr><td><span class="kw3">血管肉腫</span></td>'
        '<td><span class="kw3">数か月で拡大・隆起・出血</span></td>'
        '<td><span class="kw3">高齢者の頭部。鱗屑なし。リンパ節腫大。肺転移</span></td></tr>'
        '<tr><td>老人性紫斑</td><td>1〜2週で自然消退</td>'
        '<td><span class="kw4">前腕伸側・手背。平坦</span></td></tr>'
        '<tr><td>薬剤（抗凝固薬）による紫斑</td><td>打撲部位に一致し消退</td>'
        '<td>平坦・隆起しない</td></tr>'
        '<tr><td>血管拡張性肉芽腫</td><td>数週で急速増大するが自己限定的</td>'
        '<td><span class="kw4">外傷契機・有茎性・鮮紅色・小型</span></td></tr>'
        '<tr><td>Kaposi肉腫</td><td>緩徐（古典型）／急速（AIDS関連型）</td>'
        '<td><span class="kw4">HHV-8。下腿（古典型）／HIV感染。多発性</span></td></tr>'
        '<tr><td>巨細胞性動脈炎</td><td>数週の頭痛・顎跛行</td>'
        '<td><span class="kw4">拍動を触れる索状の側頭動脈・赤沈亢進・視力障害</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 血管肉腫＝<span class="kw3">高齢者の頭部・顔面の紫紅色斑が拡大・隆起・易出血</span>。<br>'
         '② <span class="kw3">「打撲の記憶がないのに消えないあざ」＝疑うきっかけ</span>。'
         '<span class="kw4">鱗屑がないのが表皮系腫瘍との違い</span>。<br>'
         '③ <span class="kw3">早期から肺転移（気胸を伴う）。予後は極めて不良</span>。<br>'
         '④ <span class="kw3">Stewart-Treves症候群＝乳癌術後のリンパ浮腫肢に生じる血管肉腫</span>。<br>'
         '⑤ 免疫染色＝<span class="kw3">CD31・CD34陽性</span>。')),

]

# ============================================================
# B問題（★問題） NO.160-172
# ============================================================
QUESTIONS += [

Q('114D-62', 37, [('bs', '★'), ('bi', '📷')],
  '78歳の女性。顔面の皮疹を主訴に来院した。'
  '<span class="kw">4年前から右内眼角部に皮疹が出現し、徐々に増大</span>したため受診した。'
  '受診時に右内眼角部に<span class="kw">鱗屑を伴う不整形の紅斑</span>を認める。'
  '紅斑の中央部から皮膚生検を行った。顔面の写真（A）及び生検病理組織像（B）を示す。<br>'
  '<strong>異型角化細胞の増殖がみられるのはどれか。</strong>',
  [('a', '角質層', False, '<span class="kw4">角質層は核を失った角化細胞（角質細胞）の層</span>であり、'
                     '<span class="kw4">「増殖する細胞」は存在しない</span>。'
                     '日光角化症では<span class="kw4">錯角化〈parakeratosis：核が残った角化〉と'
                     '正角化が交互に並ぶ</span>ため角質層にも異常は及ぶが、'
                     '<span class="kw4">異型細胞が増殖する場ではない</span>。'),
   ('b', '透明層', False, '<span class="kw4">透明層〈淡明層〉は手掌・足底にのみ存在する層</span>で、'
                     '<span class="kw4">顔面の表皮には存在しない</span>。'
                     'したがって本例では選択肢として成立しない。'),
   ('c', '顆粒層', False, '<span class="kw4">顆粒層はケラトヒアリン顆粒をもつ終末分化過程の細胞層</span>で、'
                     '増殖能はほぼ失われている。'
                     '<span class="kw4">日光角化症では顆粒層はしばしば減少・消失する</span>が、'
                     '<span class="kw4">異型細胞が増殖する起点ではない</span>。'),
   ('d', '有棘層', False, '<span class="kw4">有棘層は基底層から押し上げられた細胞が'
                     '分化しながら重層する層</span>である。'
                     '<span class="kw4">病変が進行すれば異型細胞は有棘層へも広がる</span>が、'
                     '<span class="kw4">日光角化症の定義的な所見は「表皮下層（基底層側）に限局した異型」</span>であり、'
                     '<span class="kw4">表皮全層に異型が及べばそれはBowen病（表皮内癌の全層型）</span>と'
                     '呼ばれる段階になる。'),
   ('e', '基底層', True, '<span class="kw3">日光角化症〈光線角化症〉では、'
                     '紫外線でDNA損傷を受けた表皮の幹細胞由来の角化細胞が'
                     '基底層（表皮下層）を中心に異型を示して増殖</span>する。'
                     '<span class="kw3">病理では、基底層側の核腫大・核濃染・極性の乱れ、'
                     '錯角化と正角化の交互配列、真皮上層の日光弾性線維症〈solar elastosis〉</span>を認める。'
                     '<span class="kw3">「異型が表皮下1/3に留まる＝日光角化症、'
                     '全層に及ぶ＝Bowen病、基底膜を破って真皮へ出る＝有棘細胞癌」</span>という'
                     '連続した段階のいちばん手前が本症である。')],
  '日光角化症は表皮の基底層側から異型角化細胞が増殖する。全層に及べばBowen病、基底膜を越えれば有棘細胞癌。',
  imgs=['images/114D-62_1.jpeg', 'images/114D-62_2.jpeg'],
  patho=('🧬 日光角化症〈光線角化症〉——有棘細胞癌へ至る道の第一歩',
         '<span class="kw3">日光角化症は、長年の紫外線曝露により表皮角化細胞に'
         'p53変異などのDNA損傷が蓄積して生じる表皮内癌（前癌病変）</span>である。'
         '<span class="kw3">高齢者の露光部——顔面・禿頭部・耳介・手背・前腕伸側</span>に多発し、'
         '<span class="kw3">農業・漁業など屋外労働歴が背景にある</span>ことが多い。<br>'
         '<span class="kw3">臨床像は「境界不明瞭で紅色調の、乾いた鱗屑・角化を伴う平坦な斑」</span>で、'
         '<span class="kw3">見るより触れたほうが分かりやすい（ざらざらした手触り）</span>のが特徴。'
         '<span class="kw3">単発ではなく周囲にも同様の病変が散在する（field cancerization）</span>ことが多い。<br>'
         '<span class="kw3">組織学的には、①表皮下層（基底層側）の角化細胞の異型と極性の乱れ、'
         '②錯角化と正角化が交互する「flag sign」、'
         '③毛包・汗管の開口部は正常角化のまま残る、'
         '④真皮上層の好塩基性に変性した膠原線維＝日光弾性線維症</span>が揃う。<br>'
         '<span class="kw3">経過は、放置すると年率0.1〜1％程度で有棘細胞癌へ進展</span>するため'
         '治療対象となる。'
         '<span class="kw3">治療は、①凍結療法（液体窒素）、②外科的切除、'
         '③イミキモド外用（免疫賦活）、④5-FU外用、⑤光線力学的療法〈PDT〉</span>が選択肢で、'
         '<span class="kw3">病変が単発で診断確定が必要／浸潤が疑われるなら切除、'
         '多発する薄い病変なら凍結・外用</span>と使い分ける'
         '（<span class="kw">Q.167</span>）。'
         '<span class="kw4">紫外線が原因なので、遮光（帽子・日焼け止め）指導が再発予防の柱</span>である。'),
  deep=('📌 表皮内癌から浸潤癌への連続——「異型がどこまで及んでいるか」',
        '<table class="tb"><tr><th>段階</th><th>異型の範囲</th><th>臨床</th><th>転移</th></tr>'
        '<tr><td><span class="kw3">日光角化症</span></td>'
        '<td><span class="kw3">表皮下層（基底層側）に限局</span></td>'
        '<td>露光部の紅色・鱗屑を伴う平坦な斑。多発</td><td>なし</td></tr>'
        '<tr><td><span class="kw3">Bowen病</span></td>'
        '<td><span class="kw3">表皮全層（full thickness）。基底膜は保たれる</span></td>'
        '<td>境界明瞭な不整形の紅褐色局面。非露光部にも生じる</td><td>なし</td></tr>'
        '<tr><td><span class="kw3">有棘細胞癌</span></td>'
        '<td><span class="kw3">基底膜を破って真皮へ浸潤</span></td>'
        '<td>角化を伴う結節・潰瘍。易出血・悪臭</td>'
        '<td><span class="kw4">あり（リンパ行性）</span></td></tr></table>'
        '<span class="kw3">この3段階は「同じ細胞（角化細胞）の、異型の広がりの違い」</span>である。'
        '<span class="kw3">日光角化症とBowen病はともに表皮内癌で転移しないため、'
        '切除・凍結・外用で治癒しうる</span>が、'
        '<span class="kw4">有棘細胞癌になるとリンパ節転移の評価（触診・エコー）が必要</span>になる。'
        'なお<span class="kw4">Bowen病が真皮に浸潤したものは Bowen癌</span>と呼ばれる。'),
  point=('🎯 国試ポイント',
         '① 日光角化症＝<span class="kw3">露光部の表皮内癌。異型は表皮下層（基底層側）に限局</span>。<br>'
         '② 臨床＝<span class="kw3">紅色でざらつく平坦な斑。多発（field cancerization）</span>。<br>'
         '③ 病理＝<span class="kw3">錯角化と正角化の交互配列＋日光弾性線維症</span>。<br>'
         '④ <span class="kw3">全層異型ならBowen病、真皮浸潤なら有棘細胞癌</span>。<br>'
         '⑤ 治療＝<span class="kw3">切除・凍結療法・イミキモド／5-FU外用・PDT。遮光指導</span>。')),

Q('111A-7', 86, [('bs', '★'), ('bc', 'CBT')],
  '<strong>慢性ヒ素中毒でみられるのはどれか。</strong>',
  [('a', '肝細胞癌', False, '<span class="kw4">ヒ素は肝血管肉腫との関連が指摘されるが、'
                     '肝「細胞」癌の主因はB型・C型肝炎ウイルス、アルコール、'
                     '非アルコール性脂肪肝炎</span>である。'
                     '<span class="kw4">なお肝血管肉腫の職業性発癌物質としては'
                     '塩化ビニルモノマー・トロトラスト・ヒ素</span>が挙げられ、'
                     'この文脈でヒ素が登場することはあるが、選択肢としてはｃが優先される。'),
   ('b', '骨粗鬆症', False, '<span class="kw4">骨粗鬆症を来す中毒・薬剤として代表的なのは'
                     'ステロイド長期投与</span>である。'
                     '<span class="kw4">重金属中毒でカドミウム（イタイイタイ病）が骨軟化症・'
                     '腎尿細管障害を来す</span>のと混同しやすいが、'
                     '<span class="kw4">ヒ素中毒の標的は皮膚・末梢神経・血管である</span>。'),
   ('c', 'Bowen病', True, '<span class="kw3">慢性ヒ素中毒では、'
                     '①手掌・足底の点状の角化性丘疹〈ヒ素角化症〉、'
                     '②雨滴状〈rain-drop〉の色素沈着と脱色素斑の混在、'
                     '③多発性のBowen病、④有棘細胞癌、⑤基底細胞癌</span>を来す。'
                     '<span class="kw3">とくに「非露光部（体幹）に多発するBowen病」は'
                     '慢性ヒ素曝露を強く示唆する</span>のが国試の定番である'
                     '（<span class="kw">Q.183</span>・<span class="kw">Q.189</span>）。'
                     '<span class="kw3">皮膚以外では肺癌・膀胱癌のリスクも上昇</span>する。'),
   ('d', '慢性気管支炎', False, '<span class="kw4">慢性気管支炎の主因は喫煙・大気汚染</span>である。'
                     '<span class="kw4">ヒ素は吸入曝露で肺癌のリスクを上げる</span>が、'
                     '<span class="kw4">慢性気管支炎を特徴的に来す中毒ではない</span>。'),
   ('e', '再生不良性貧血', False, '<span class="kw4">再生不良性貧血を来す化学物質としては'
                     'ベンゼン・クロラムフェニコール・抗腫瘍薬</span>が代表である。'
                     '<span class="kw4">急性ヒ素中毒では骨髄抑制・汎血球減少を来しうる</span>が、'
                     '<span class="kw4">慢性ヒ素中毒の典型像として問われるのは皮膚病変</span>である。'
                     'なお<span class="kw4">三酸化ヒ素は急性前骨髄球性白血病の治療薬</span>でもある。')],
  '慢性ヒ素中毒＝手掌足底の点状角化＋雨滴状色素沈着＋多発するBowen病。非露光部に多発するBowen病を見たらヒ素曝露を問診する。',
  patho=('🧬 慢性ヒ素中毒と皮膚——「非露光部の多発Bowen病」を見たら曝露歴を聞く',
         '<span class="kw3">ヒ素〈arsenic〉は、井戸水・地下水の汚染、'
         '殺鼠剤・農薬・防腐剤、鉱山・製錬所での職業曝露、'
         '過去には梅毒治療薬〈ヒ素剤〉や慢性喘息の薬（亜ヒ酸）として'
         '長期に摂取された歴史</span>がある。'
         '日本では<span class="kw3">1955年のヒ素ミルク中毒事件、'
         '土呂久・笹ヶ谷の鉱山公害</span>が知られる。<br>'
         '<span class="kw3">慢性曝露の皮膚三徴</span>は——'
         '<span class="kw3">①ヒ素角化症：手掌・足底に多発する数mmの硬い点状角化性丘疹。'
         '②雨滴状色素沈着〈rain-drop pigmentation〉：体幹を中心に'
         'びまん性の褐色色素沈着のなかに点状の脱色素斑が散在する独特の像。'
         '③多発性Bowen病：曝露から10〜数十年の潜伏期を経て、'
         '体幹など非露光部に多発する</span>。'
         '<span class="kw3">日光角化症が露光部に出るのと対照的に、'
         'ヒ素によるBowen病は「日の当たらない部位に多発する」</span>——'
         'この対比が診断の入口になる。<br>'
         '<span class="kw3">悪性腫瘍は皮膚（Bowen病→有棘細胞癌、基底細胞癌）だけでなく、'
         '肺癌・膀胱癌・肝血管肉腫のリスクも上昇</span>する。'
         '<span class="kw3">皮膚以外の慢性症状としては、末梢神経障害（手袋靴下型の感覚障害）、'
         '爪のMees線（横走する白色帯）、末梢血管障害（黒足病）</span>がある。<br>'
         '<span class="kw4">急性中毒では消化器症状（激しい嘔吐・下痢）・ショック・'
         '多臓器不全を来し、治療はキレート剤（ジメルカプロール等）</span>である。'),
  deep=('📌 Bowen病の背景因子を整理する',
        '<table class="tb"><tr><th>背景</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">紫外線</span></td>'
        '<td>露光部（顔面・手背）に単発〜数個</td></tr>'
        '<tr><td><span class="kw3">慢性ヒ素中毒</span></td>'
        '<td><span class="kw3">非露光部（体幹）に多発。手掌足底の点状角化・雨滴状色素沈着を伴う</span></td></tr>'
        '<tr><td><span class="kw3">ヒトパピローマウイルス〈HPV〉</span></td>'
        '<td><span class="kw3">HPV16など。外陰部・肛囲・指（Bowen様丘疹症も同系統）</span></td></tr>'
        '<tr><td>免疫抑制</td><td>臓器移植後・免疫抑制薬長期使用</td></tr>'
        '<tr><td>放射線</td><td>慢性放射性皮膚炎の部位に発生（<span class="kw">Q.169</span>）</td></tr></table>'
        '<span class="kw3">「多発性Bowen病」というキーワードが出たら、'
        'まずヒ素曝露歴（井戸水・職業・古い薬）を問診する</span>のが定石である。'),
  point=('🎯 国試ポイント',
         '① 慢性ヒ素中毒＝<span class="kw3">手掌足底の点状角化＋雨滴状色素沈着＋多発Bowen病</span>。<br>'
         '② <span class="kw3">非露光部に多発するBowen病はヒ素を疑う</span>'
         '（紫外線由来は露光部）。<br>'
         '③ 潜伏期は<span class="kw3">10〜数十年</span>と長い。<br>'
         '④ 皮膚以外＝<span class="kw3">肺癌・膀胱癌、末梢神経障害、爪のMees線</span>。<br>'
         '⑤ <span class="kw4">カドミウム＝骨軟化症、鉛＝貧血と腹痛、水銀＝Minamata病</span>と混同しない。')),

Q('110D-51', 74, [('bs', '★'), ('bi', '📷')],
  '69歳の男性。顔面の皮疹を主訴に来院した。'
  '<span class="kw">以前より顔面のしみが多かった</span>が、'
  '<span class="kw">3か月前からその一部の色が濃くなり、拡大</span>してきたという。'
  '顔面の写真（A）と黒色斑のダーモスコピー像（B）とを示す。<br>'
  '<strong>この患者について正しいのはどれか。</strong>',
  [('a', '放射線治療が有効である。', False, '<span class="kw4">悪性黒色腫は放射線感受性が低い</span>のが'
                     '古典的な認識で、'
                     '<span class="kw4">根治治療は外科的切除</span>である。'
                     '放射線は<span class="kw4">切除不能例・骨転移や脳転移の緩和目的・'
                     '術後の局所制御の補助</span>として限定的に用いられるにすぎない。'),
   ('b', '液体窒素療法が有効である。', False, '<span class="kw4">凍結（液体窒素）療法は'
                     '尋常性疣贅・日光角化症・脂漏性角化症など、'
                     '組織診断が不要か、または表在性で転移しない病変に用いる</span>治療である。'
                     '<span class="kw4">悪性黒色腫に凍結療法を行うと、'
                     '病理標本が得られず腫瘍厚（＝病期・予後）が評価できないうえ、'
                     '残存腫瘍を刺激して進展させる危険がある</span>ため禁忌に等しい。'),
   ('c', '病変の深達度が予後に影響する。', True, '<span class="kw3">悪性黒色腫の予後を最も強く規定するのは'
                     '腫瘍の厚さ〈Breslow thickness：顆粒層から腫瘍最深部までのmm〉</span>である。'
                     '<span class="kw3">TNM分類のpTはこの腫瘍厚と潰瘍の有無で決まり、'
                     'センチネルリンパ節生検の適応や切除マージンもここから決まる</span>。'
                     '<span class="kw3">「深さ＝予後」という一点が悪性黒色腫の最重要事項</span>である'
                     '（<span class="kw">Q.180</span>）。'),
   ('d', 'ヒトパピローマウイルス〈HPV〉が発症に関与する。', False,
                     '<span class="kw4">HPVが関与するのは、尋常性疣贅・尖圭コンジローマ、'
                     '子宮頸癌、Bowen様丘疹症、疣贅状表皮発育異常症からの有棘細胞癌</span>などである。'
                     '<span class="kw4">悪性黒色腫の発症にHPVは関与しない</span>。'
                     '本例は<span class="kw4">高齢者の顔面に長く存在した色素斑（悪性黒子）から'
                     '生じた悪性黒子型黒色腫</span>と考えられ、背景因子は累積紫外線量である。'),
   ('e', 'センチネルリンパ節生検が診断のために必要である。', False,
                     '<span class="kw4">センチネルリンパ節生検は「診断」のための検査ではない</span>。'
                     '<span class="kw4">原発巣の病理診断（切除生検）で悪性黒色腫と確定し、'
                     '腫瘍厚が判明した後に、リンパ節郭清の適応を決める＝病期診断のために行う</span>ものである。'
                     '順序を逆にしない（<span class="kw">Q.180</span>）。')],
  '悪性黒色腫の予後を規定するのは腫瘍厚（Breslow）＝深達度。放射線・凍結は不適で、センチネルリンパ節生検は診断ではなく病期評価のための検査。',
  imgs=['images/110D-51_1.jpeg', 'images/110D-51_2.jpeg'],
  patho=('🧬 悪性黒子型黒色腫と、腫瘍厚が予後を決める理由',
         '<span class="kw3">本例は「高齢者の顔面に以前からあったしみの一部が、'
         '数か月で濃く・大きくなった」</span>という提示で、'
         '<span class="kw3">悪性黒子〈lentigo maligna：表皮内に留まる段階〉から'
         '悪性黒子型黒色腫〈lentigo maligna melanoma: LMM〉へ進展した</span>典型例である。'
         '<span class="kw3">LMMは累積紫外線量が原因で、高齢者の顔面に生じ、'
         '長期間（数年〜十数年）表皮内に留まった後に真皮浸潤する</span>ため'
         '<span class="kw3">4型のなかでは進行が緩徐</span>だが、'
         '<span class="kw3">浸潤すれば他型と同じく厚さに応じた転移リスクを負う</span>。<br>'
         '<span class="kw3">Breslow thickness（腫瘍厚）</span>とは'
         '<span class="kw3">表皮顆粒層から腫瘍浸潤の最深部までの垂直距離（mm）</span>で、'
         '<span class="kw3">これが薄いほど予後がよい</span>。'
         '<span class="kw3">なぜ厚さが効くのか——真皮深層〜皮下に近づくほど'
         'リンパ管・血管に到達する確率が上がり、微小転移が成立するから</span>である。'
         '<span class="kw3">現行のAJCC分類ではpTを厚さと潰瘍の有無で規定</span>し、'
         '<span class="kw3">切除マージン（in situ 5mm／≦1mm 1cm／1〜2mm 1〜2cm／＞2mm 2cm）も'
         'センチネルリンパ節生検の適応（概ね厚さ0.8mm以上、または潰瘍あり）も厚さで決まる</span>。'
         '<span class="kw4">かつて用いられたClark levelは、'
         '皮膚の層（表皮内〜皮下脂肪）を基準にした指標だが、'
         '現在はBreslow厚が主に用いられる</span>。<br>'
         '<span class="kw3">進行期の治療は近年大きく変わり、'
         '抗PD-1抗体（ニボルマブ・ペムブロリズマブ）や抗CTLA-4抗体（イピリムマブ）、'
         'BRAF V600変異例ではBRAF阻害薬＋MEK阻害薬</span>が標準となった'
         '（<span class="kw">Q.175</span>）。'),
  deep=('📌 悪性黒色腫でやってはいけないこと／やるべきこと',
        '<table class="tb"><tr><th></th><th>内容</th><th>理由</th></tr>'
        '<tr><td><span class="kw4">避ける</span></td>'
        '<td><span class="kw4">凍結療法・レーザー・電気焼灼・薬剤での「焼く」治療</span></td>'
        '<td><span class="kw4">組織が得られず腫瘍厚を評価できない。残存病変を刺激する</span></td></tr>'
        '<tr><td><span class="kw4">原則避ける</span></td>'
        '<td><span class="kw4">部分生検・パンチ生検</span></td>'
        '<td><span class="kw4">最深部を外すと病期を過小評価する（巨大病変等では已むを得ず行う）</span></td></tr>'
        '<tr><td><span class="kw3">行う</span></td>'
        '<td><span class="kw3">ダーモスコピー→全切除生検（狭いマージンで一括切除）</span></td>'
        '<td><span class="kw3">腫瘍厚を正確に測るため</span></td></tr>'
        '<tr><td><span class="kw3">行う</span></td>'
        '<td><span class="kw3">厚さに応じた追加拡大切除＋センチネルリンパ節生検</span></td>'
        '<td><span class="kw3">局所制御と病期診断（郭清の適応判断）</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 悪性黒色腫の予後因子＝<span class="kw3">腫瘍厚〈Breslow〉と潰瘍の有無</span>。<br>'
         '② <span class="kw4">放射線感受性は低い。凍結・レーザーは行わない</span>。<br>'
         '③ <span class="kw3">センチネルリンパ節生検は病期診断（郭清の適応決定）のため</span>。'
         '診断のためではない。<br>'
         '④ <span class="kw3">悪性黒子型＝高齢者の顔面、累積紫外線が原因、進行は緩徐</span>。<br>'
         '⑤ <span class="kw4">HPVは悪性黒色腫と無関係</span>（疣贅・Bowen様丘疹症・子宮頸癌が守備範囲）。')),

]

QUESTIONS += [

Q('107E-20', 99, [('bs', '★')],
  '<strong>悪性黒色腫と良性の色素性病変との鑑別に有用な検査はどれか。</strong>',
  [('a', '硝子圧法', False, '<span class="kw4">硝子圧法〈diascopy〉は、'
                     'ガラス板やスライドグラスで皮疹を圧迫して退色するかをみる方法</span>。'
                     '<span class="kw4">退色すれば紅斑（血管拡張）、退色しなければ紫斑（血管外への出血）や'
                     '色素沈着</span>と判定する。'
                     '<span class="kw4">サルコイドーシスや尋常性狼瘡で黄褐色の「リンゴゼリー様」を'
                     '確認する</span>のが代表的な用途で、'
                     '<span class="kw4">色素性病変の良悪の鑑別には使えない</span>。'),
   ('b', '皮膚描記法', False, '<span class="kw4">皮膚描記法〈dermographism〉は、'
                     '皮膚を鈍的にこすって膨疹が出るかをみる検査</span>で、'
                     '<span class="kw4">機械性蕁麻疹（人工蕁麻疹）や'
                     '肥満細胞症のDarier徴候の確認</span>に用いる。'
                     '色素性病変の評価とは無関係である。'),
   ('c', 'パッチテスト', False, '<span class="kw4">パッチテスト〈貼布試験〉は、'
                     '疑わしい物質を背部などに48時間貼付し、'
                     'Ⅳ型（遅延型）アレルギーの原因物質を同定する検査</span>である。'
                     '<span class="kw4">アレルギー性接触皮膚炎・金属アレルギーの原因検索</span>に用いる。'),
   ('d', 'プリックテスト', False, '<span class="kw4">プリックテストは、'
                     '抗原液を滴下した皮膚を専用の針で浅く刺し、'
                     '15〜20分後の膨疹・紅斑をみるⅠ型（即時型）アレルギーの検査</span>である。'
                     '<span class="kw4">食物アレルギー・花粉症・ラテックスアレルギー</span>などが対象で、'
                     '腫瘍の鑑別には用いない。'),
   ('e', 'ダーモスコピー試験', True, '<span class="kw3">ダーモスコピーは、'
                     'エコーゼリーや偏光を用いて角層の乱反射を消し、'
                     '10〜30倍で表皮〜真皮浅層の色素分布を非侵襲的に観察する検査</span>である。'
                     '<span class="kw3">色素性病変の良悪鑑別における第一選択のスクリーニング法</span>で、'
                     '<span class="kw3">悪性黒色腫の診断精度を肉眼所見のみの場合より'
                     '大きく高めることが確立</span>している。'
                     '<span class="kw3">足底では「平行溝パターン＝良性／平行隆線パターン＝悪性」</span>という'
                     '明快な指標がある（<span class="kw">Q.188</span>）。')],
  '色素性病変の良悪鑑別＝ダーモスコピー。非侵襲的に色素分布パターンを見る、悪性黒色腫スクリーニングの標準手技。',
  patho=('🧬 ダーモスコピー——「切らずに色素の並び方を見る」',
         '<span class="kw3">ダーモスコピー〈dermoscopy／epiluminescence microscopy〉は、'
         '角層による光の乱反射を消して表皮〜真皮乳頭層のメラニン・血管を可視化する手技</span>である。'
         '<span class="kw3">ジェルを介して接触させるか、偏光レンズで非接触に観察</span>する。<br>'
         '<span class="kw3">なぜ有用か——肉眼では「黒い斑」としか見えないものが、'
         'メラニンの存在する深さによって色調が変わって見える</span>からである。'
         '<span class="kw3">角層内のメラニン＝黒、表皮内＝褐色、真皮乳頭層＝灰色、'
         '真皮深層＝青（Tyndall効果）</span>という対応があり、'
         '<span class="kw3">「色調が多彩＝メラニンが複数の深さに散在＝浸潤や退縮がある」</span>と'
         '読める。<span class="kw3">blue-white veil はこの原理で説明される悪性のサイン</span>である。<br>'
         '<span class="kw3">部位別の読み方</span>——'
         '<span class="kw3">①体幹・四肢：規則的な色素ネットワークがあれば母斑、'
         'ネットワークの不整・辺縁の突然の途切れ・不規則な点や小球・退縮構造があれば黒色腫。'
         '②掌蹠：皮溝（溝）に色素が並ぶ平行溝パターンが良性、'
         '皮丘（汗孔のある隆線）に並ぶ平行隆線パターンが悪性。'
         '③爪：線の幅・色調が不均一で近位ほど幅広い三角形、'
         'Hutchinson徴候（爪郭への色素の滲み出し）があれば悪性</span>。<br>'
         '<span class="kw3">ダーモスコピーは非侵襲・即時・反復可能</span>という利点があり、'
         '<span class="kw3">悪性が疑われれば次の段階として全切除生検で確定する</span>という'
         '流れになる。<span class="kw3">基底細胞癌の樹枝状血管、'
         '脂漏性角化症の面皰様開大・稗粒腫様囊腫の判定にも用いる</span>ため、'
         '「黒い病変を見たらまずダーモスコピー」が実地の作法である。'),
  deep=('📌 皮膚科の検査法——何を見る検査か',
        '<table class="tb"><tr><th>検査</th><th>見るもの</th><th>主な対象疾患</th></tr>'
        '<tr><td><span class="kw3">ダーモスコピー</span></td>'
        '<td><span class="kw3">表皮〜真皮浅層の色素・血管パターン</span></td>'
        '<td><span class="kw3">悪性黒色腫、母斑、基底細胞癌、脂漏性角化症、円形脱毛症</span></td></tr>'
        '<tr><td>硝子圧法</td><td>退色するか（血管性か出血性か）</td>'
        '<td>紫斑と紅斑の鑑別、サルコイドーシス（リンゴゼリー様）</td></tr>'
        '<tr><td>Wood灯</td><td>長波長紫外線での蛍光</td>'
        '<td>白癬（黄緑）、紅色陰癬（サンゴ色）、尋常性白斑・結節性硬化症の葉状白斑の描出</td></tr>'
        '<tr><td>Tzanck試験</td><td>水疱底のスメアの細胞像</td>'
        '<td>ヘルペス（多核巨細胞）、天疱瘡（棘融解細胞）</td></tr>'
        '<tr><td>KOH直接鏡検</td><td>菌糸・胞子</td><td>白癬・カンジダ・癜風</td></tr>'
        '<tr><td>パッチテスト</td><td>Ⅳ型アレルギー</td><td>アレルギー性接触皮膚炎</td></tr>'
        '<tr><td>プリック／皮内テスト</td><td>Ⅰ型アレルギー</td><td>食物・薬剤・花粉</td></tr>'
        '<tr><td>皮膚描記法</td><td>膨疹の誘発</td><td>機械性蕁麻疹、肥満細胞症</td></tr>'
        '<tr><td>蛍光抗体直接法</td><td>皮膚に沈着した自己抗体</td>'
        '<td>天疱瘡（細胞間）、類天疱瘡（表皮基底膜部の線状）</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 色素性病変の良悪鑑別＝<span class="kw3">ダーモスコピー</span>（非侵襲・第一選択）。<br>'
         '② <span class="kw3">掌蹠：平行溝＝良性／平行隆線＝悪性</span>。<br>'
         '③ <span class="kw3">爪：Hutchinson徴候があれば悪性黒色腫を強く疑う</span>。<br>'
         '④ <span class="kw3">確定診断は切除生検（病理）</span>——ダーモスコピーはあくまでスクリーニング。<br>'
         '⑤ <span class="kw4">硝子圧法・Wood灯・Tzanck・パッチ／プリックの用途を混同しない</span>。')),

Q('107I-14', 91, [('bs', '★')],
  '<strong>T細胞の腫瘍はどれか。</strong>',
  [('a', '濾胞性リンパ腫', False, '<span class="kw4">濾胞性リンパ腫はB細胞性の低悪性度リンパ腫</span>で、'
                     '<span class="kw4">t(14;18)によるBCL2の過剰発現</span>が特徴。'
                     '<span class="kw4">CD20陽性</span>で、リツキシマブを含む治療が行われる。'),
   ('b', 'Burkittリンパ腫', False, '<span class="kw4">Burkittリンパ腫もB細胞性</span>で、'
                     '<span class="kw4">t(8;14)によるMYC転座、'
                     '病理の"starry sky"（星空像）、極めて速い増殖（腫瘍崩壊症候群に注意）</span>が特徴。'
                     '<span class="kw4">アフリカ型はEBウイルスと関連</span>する。'),
   ('c', 'MALTリンパ腫', False, '<span class="kw4">MALTリンパ腫は粘膜関連リンパ組織由来のB細胞性</span>で、'
                     '<span class="kw4">胃MALTリンパ腫はHelicobacter pylori感染と関連し、'
                     '除菌で寛解する</span>ことが国試頻出。'
                     '甲状腺（橋本病）・唾液腺（Sjögren症候群）にも生じる。'),
   ('d', 'hairy cell leukemia〈有毛細胞白血病〉', False,
                     '<span class="kw4">有毛細胞白血病はB細胞性の慢性白血病</span>で、'
                     '<span class="kw4">細胞質に毛髪様の突起をもつ細胞、'
                     '酒石酸抵抗性酸ホスファターゼ〈TRAP〉陽性、脾腫、汎血球減少、'
                     '骨髄線維化による dry tap</span>が特徴。'
                     '<span class="kw4">BRAF V600E変異</span>を高率に有する。'),
   ('e', '菌状息肉症', True, '<span class="kw3">菌状息肉症は皮膚原発のT細胞リンパ腫〈CTCL〉</span>で、'
                     '<span class="kw3">成熟したCD3陽性・CD4陽性・CD8陰性のヘルパーT細胞が'
                     '皮膚に生着して増殖</span>する。'
                     '<span class="kw3">CD7の脱落、T細胞受容体遺伝子再構成のクローナリティ</span>が'
                     '診断の補助となる。'
                     '<span class="kw3">紅斑期→扁平浸潤期→腫瘍期と年単位で進む</span>'
                     '（<span class="kw">Q.151</span>・<span class="kw">Q.171</span>）。')],
  '選択肢のうち菌状息肉症だけがT細胞性（皮膚T細胞リンパ腫・CD4陽性）。他はすべてB細胞性。',
  patho=('🧬 リンパ系腫瘍の細胞系列——「T細胞性はどれか」を確実に答えるために',
         '<span class="kw3">悪性リンパ腫の大多数（日本では約8〜9割）はB細胞性</span>である。'
         '<span class="kw3">したがって「T細胞性はどれか」という問いは、'
         '数少ないT細胞性を覚えておけば消去法で解ける</span>。<br>'
         '<span class="kw3">押さえるべきT/NK細胞性腫瘍</span>——'
         '<span class="kw3">①菌状息肉症・Sézary症候群（皮膚T細胞リンパ腫）、'
         '②成人T細胞白血病リンパ腫〈ATL〉（HTLV-1）、'
         '③末梢性T細胞リンパ腫、非特定型、'
         '④血管免疫芽球性T細胞リンパ腫、'
         '⑤未分化大細胞型リンパ腫〈ALCL：CD30陽性、ALK転座〉、'
         '⑥節外性NK/T細胞リンパ腫・鼻型（EBV関連、鼻の破壊性病変）、'
         '⑦T細胞性急性リンパ性白血病（縦隔腫瘤をもつ思春期男児）</span>。<br>'
         '<span class="kw3">残りは基本的にB細胞性</span>——'
         '<span class="kw3">びまん性大細胞型B細胞リンパ腫〈DLBCL：最多〉、濾胞性リンパ腫、'
         'MALTリンパ腫、マントル細胞リンパ腫、Burkittリンパ腫、'
         '慢性リンパ性白血病、有毛細胞白血病、形質細胞腫瘍（多発性骨髄腫）</span>。<br>'
         '<span class="kw4">Hodgkinリンパ腫のReed-Sternberg細胞もB細胞由来</span>である'
         '（CD15・CD30陽性、CD20は多くで陰性という染色パターンが独特）。<br>'
         '<span class="kw3">皮膚に病変を作るリンパ腫としては、'
         '菌状息肉症（T）とATL（T）が二大巨頭</span>で、'
         '<span class="kw3">「皮膚が主戦場のリンパ腫はT細胞性が多い」</span>と押さえておくと'
         '本問のような設問に強くなる。'),
  deep=('📌 主なリンパ系腫瘍の由来と特徴',
        '<table class="tb"><tr><th>疾患</th><th>系列</th><th>キーワード</th></tr>'
        '<tr><td><span class="kw3">菌状息肉症／Sézary症候群</span></td>'
        '<td><span class="kw3">T（CD4陽性）</span></td>'
        '<td><span class="kw3">皮膚原発。表皮向性・Pautrier微小膿瘍</span></td></tr>'
        '<tr><td><span class="kw3">成人T細胞白血病リンパ腫</span></td>'
        '<td><span class="kw3">T（CD4陽性）</span></td>'
        '<td><span class="kw3">HTLV-1、九州沖縄、flower cell、高Ca血症</span></td></tr>'
        '<tr><td>濾胞性リンパ腫</td><td>B</td><td>t(14;18)／BCL2、低悪性度</td></tr>'
        '<tr><td>Burkittリンパ腫</td><td>B</td><td>t(8;14)／MYC、starry sky、EBV</td></tr>'
        '<tr><td>MALTリンパ腫</td><td>B</td><td><span class="kw3">H. pylori 除菌で寛解</span></td></tr>'
        '<tr><td>有毛細胞白血病</td><td>B</td><td>TRAP陽性、脾腫、dry tap</td></tr>'
        '<tr><td>NK/T細胞リンパ腫・鼻型</td><td>NK/T</td><td>EBV、鼻中隔穿孔・正中線破壊</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 菌状息肉症＝<span class="kw3">皮膚T細胞リンパ腫。CD3・CD4陽性、CD8陰性、CD7脱落</span>。<br>'
         '② <span class="kw3">悪性リンパ腫の大半はB細胞性</span>——T細胞性を数個覚えて消去法。<br>'
         '③ <span class="kw3">皮膚のT細胞リンパ腫の双璧＝菌状息肉症とATL</span>。<br>'
         '④ MALTリンパ腫＝<span class="kw3">H. pylori 除菌で寛解しうる</span>。<br>'
         '⑤ <span class="kw3">Sézary症候群は菌状息肉症の白血化型（紅皮症＋末梢血Sézary細胞）</span>。')),

Q('105D-4', 98, [('bs', '★')],
  '<strong>疾患と発生母地の組合せで正しいのはどれか。</strong>',
  [('a', '乳房外Paget 病  ―――――――― Bowen 病', False,
                     '<span class="kw4">乳房外Paget病はアポクリン腺に関連した表皮内腺癌で、'
                     '外陰部・肛囲・腋窩に「原発」する</span>。'
                     '<span class="kw4">Bowen病（表皮内の有棘細胞癌）から発生することはない</span>——'
                     '両者は<span class="kw4">腺系と扁平上皮系という別系統の腫瘍</span>である。'),
   ('b', '有棘細胞癌  ―――――――――― 熱傷瘢痕', True,
                     '<span class="kw3">正しい。熱傷瘢痕・慢性潰瘍・瘻孔など、'
                     '長期にわたり炎症と再生を繰り返す瘢痕組織から発生する有棘細胞癌を'
                     'Marjolin潰瘍〈Marjolin ulcer〉</span>と呼ぶ。'
                     '<span class="kw3">受傷から数十年（20〜50年）の潜伏期を経て、'
                     '瘢痕の一部が潰瘍化・易出血化・悪臭を伴う腫瘤となって発症</span>する'
                     '（<span class="kw">Q.185</span>）。'
                     '<span class="kw3">通常の有棘細胞癌より転移率が高い</span>とされる。'),
   ('c', '悪性黒色腫  ―――――――――― 黒色表皮腫', False,
                     '<span class="kw4">黒色表皮腫は角化細胞の乳頭腫症・角質増殖であって'
                     'メラノサイトの増殖ではない</span>。'
                     '<span class="kw4">前癌病変でもなく、悪性黒色腫の発生母地にはならない</span>。'
                     '<span class="kw4">悪性黒色腫の発生母地となりうるのは、'
                     '先天性巨大色素性母斑・悪性黒子・異形成母斑</span>である'
                     '（<span class="kw">Q.169</span>）。'),
   ('d', '血管肉腫  ――――――――――― 血管拡張性肉芽腫', False,
                     '<span class="kw4">血管拡張性肉芽腫は外傷を契機に生じる良性の血管増殖で、'
                     '悪性化しない</span>。'
                     '<span class="kw4">血管肉腫の背景として押さえるべきは、'
                     '①高齢者の頭部（特発性）、②慢性リンパ浮腫〈Stewart-Treves症候群〉、'
                     '③放射線照射後</span>である（<span class="kw">Q.159</span>）。'),
   ('e', '菌状息肉症  ―――――――――― 体白癬', False,
                     '<span class="kw4">「菌状」「息肉」という名は、'
                     '腫瘍期の結節がキノコ（菌）状に隆起する外観に由来する</span>もので、'
                     '<span class="kw4">真菌感染とは何の関係もない</span>。'
                     '<span class="kw4">体白癬から菌状息肉症が発生することはない</span>。'
                     'むしろ<span class="kw4">紅斑期の菌状息肉症が体部白癬と誤診される</span>ことが'
                     '臨床的な問題になる。')],
  '熱傷瘢痕から生じる有棘細胞癌＝Marjolin潰瘍。数十年の潜伏期を経て瘢痕が潰瘍化・腫瘤化する。',
  patho=('🧬 皮膚悪性腫瘍の「発生母地」——前駆病変を覚える',
         '<span class="kw3">皮膚悪性腫瘍の多くは、何らかの前駆病変・素地の上に生じる</span>。'
         '<span class="kw3">これを問う設問は繰り返し出題される</span>ので、'
         '対応表として頭に入れておく。<br>'
         '<span class="kw3">有棘細胞癌の発生母地</span>——'
         '<span class="kw3">①日光角化症（最多）、②Bowen病、③熱傷瘢痕（Marjolin潰瘍）、'
         '④慢性放射性皮膚炎、⑤慢性膿皮症・瘻孔・褥瘡などの慢性潰瘍、'
         '⑥色素性乾皮症、⑦HPV関連（尋常性疣贅、疣贅状表皮発育異常症）、'
         '⑧慢性円板状エリテマトーデスの瘢痕</span>。'
         '<span class="kw3">共通するのは「長期の慢性刺激・炎症・DNA損傷」</span>である。<br>'
         '<span class="kw3">悪性黒色腫の発生母地</span>——'
         '<span class="kw3">①先天性巨大色素性母斑（生涯リスク数％）、②悪性黒子、'
         '③異形成母斑（欧米）、④色素性乾皮症</span>。'
         '<span class="kw4">通常の後天性色素性母斑からの悪性化はまれ</span>である。<br>'
         '<span class="kw3">基底細胞癌の発生母地</span>——'
         '<span class="kw3">①脂腺母斑〈Jadassohn〉、②慢性放射性皮膚炎、'
         '③母斑基底細胞癌症候群〈Gorlin症候群〉</span>。<br>'
         '<span class="kw3">Marjolin潰瘍の臨床的な要点</span>は、'
         '<span class="kw3">「何十年も前の熱傷瘢痕に、最近潰瘍ができて治らない」という提示</span>で'
         '登場することである。'
         '<span class="kw3">難治性潰瘍の底や辺縁が隆起・易出血・悪臭を伴えば生検が必須</span>で、'
         '<span class="kw3">治療は外科的切除（+所属リンパ節評価）</span>となる'
         '（<span class="kw">Q.185</span>）。'),
  deep=('📌 発生母地の対応表',
        '<table class="tb"><tr><th>腫瘍</th><th>発生母地・素地</th></tr>'
        '<tr><td><span class="kw3">有棘細胞癌</span></td>'
        '<td><span class="kw3">日光角化症、Bowen病、熱傷瘢痕（Marjolin潰瘍）、慢性放射性皮膚炎、'
        '慢性潰瘍・瘻孔、色素性乾皮症、HPV感染</span></td></tr>'
        '<tr><td><span class="kw3">悪性黒色腫</span></td>'
        '<td><span class="kw3">先天性巨大色素性母斑、悪性黒子、異形成母斑、色素性乾皮症</span></td></tr>'
        '<tr><td><span class="kw3">基底細胞癌</span></td>'
        '<td><span class="kw3">脂腺母斑、慢性放射性皮膚炎、Gorlin症候群</span></td></tr>'
        '<tr><td>血管肉腫</td>'
        '<td><span class="kw3">高齢者頭部（特発性）、慢性リンパ浮腫（Stewart-Treves）、放射線照射後</span></td></tr>'
        '<tr><td>Merkel細胞癌</td><td>高齢者の露光部。Merkel細胞ポリオーマウイルス、免疫抑制</td></tr>'
        '<tr><td>乳房外Paget病</td><td><span class="kw4">原発（前駆病変を持たない）</span></td></tr>'
        '<tr><td>菌状息肉症</td><td><span class="kw4">原発。感染や湿疹から発生するわけではない</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">熱傷瘢痕→有棘細胞癌＝Marjolin潰瘍（潜伏期20〜50年）</span>。<br>'
         '② 有棘細胞癌の母地＝<span class="kw3">日光角化症・Bowen病・瘢痕・慢性潰瘍・放射線皮膚炎</span>。<br>'
         '③ 悪性黒色腫の母地＝<span class="kw3">先天性巨大色素性母斑・悪性黒子</span>。<br>'
         '④ 基底細胞癌の母地＝<span class="kw3">脂腺母斑</span>。<br>'
         '⑤ <span class="kw4">菌状息肉症は真菌症とは無関係</span>（名前に惑わされない）。')),

Q('102A-10', 66, [('bs', '★')],
  '<strong>悪性黒色腫の診断指標で<span class="kw2">ない</span>のはどれか。</strong>',
  [('a', '大きさ', False, '<span class="kw4">ABCDE基準の D＝Diameter</span>。'
                     '<span class="kw4">径6mmを超えるものは悪性黒色腫を疑う</span>。'
                     '<span class="kw4">ただし早期病変では6mm以下のこともある</span>ため、'
                     '単独では決め手にならない補助的指標である。'),
   ('b', '辺縁の性状', False, '<span class="kw4">ABCDE基準の B＝Border irregularity</span>。'
                     '<span class="kw4">辺縁が不整でギザギザ、周囲へ滲み出すようにぼやける</span>のは'
                     '悪性を示唆する。'
                     '良性の母斑は<span class="kw4">辺縁が滑らかで境界明瞭</span>である。'),
   ('c', '黒色調の強さ', True, '<span class="kw3">「黒さの程度」そのものは診断指標ではない</span>。'
                     '<span class="kw3">濃く真っ黒でも均一で対称なら良性（色素性母斑）のことが多く、'
                     '逆に淡くても色調にむらがあれば悪性を疑う</span>。'
                     '<span class="kw3">ABCDE基準で問われるのは「色調の不均一さ（variegation）」であって'
                     '「濃さ」ではない</span>——この区別が本問の核心である。'
                     '<span class="kw3">無色素性黒色腫〈amelanotic melanoma〉のように'
                     '黒くない黒色腫すら存在する</span>。'),
   ('d', '形状の対称性', False, '<span class="kw4">ABCDE基準の A＝Asymmetry</span>。'
                     '<span class="kw4">病変の中心を通る線で二分したときに'
                     '形・色が左右で一致しない（非対称）</span>のは悪性を示唆する。'),
   ('e', '色調の均一性', False, '<span class="kw4">ABCDE基準の C＝Color variegation</span>。'
                     '<span class="kw4">褐色・黒色・青灰色・赤色・白色（退縮部）が混在する'
                     '＝色調が不均一</span>であれば悪性を疑う。'
                     '<span class="kw4">これは「濃さ」ではなく「ばらつき」の指標</span>であり、'
                     'ｃとの違いを明確に区別すること。')],
  'ABCDE基準は非対称性・辺縁不整・色調の不均一・6mm超・変化。「黒色調の強さ（濃さ）」は指標に含まれない。',
  patho=('🧬 ABCDE基準の正確な理解——「濃さ」ではなく「ばらつき」と「変化」',
         '<span class="kw3">悪性黒色腫のスクリーニングに用いるABCDE基準は、'
         '「良性の母斑は秩序があり、悪性は秩序が崩れる」という一つの原理から'
         '導かれた5つの見方</span>である。<br>'
         '<span class="kw3">A＝Asymmetry（非対称性）</span>：'
         '良性は細胞が一様に増えるため対称に育つ。悪性は増殖速度が場所ごとに違うため非対称になる。<br>'
         '<span class="kw3">B＝Border irregularity（辺縁不整）</span>：'
         '良性は境界が滑らかで明瞭。悪性は周囲へ不規則に浸潤するためギザギザ・不明瞭になる。<br>'
         '<span class="kw3">C＝Color variegation（色調の不均一）</span>：'
         '<span class="kw3">複数の深さにメラニンが散在し、さらに免疫による退縮（白色部）や'
         '炎症（赤色部）が加わるため多彩になる</span>。'
         '<span class="kw4">「黒が濃いこと」自体は悪性の証拠にならない</span>。<br>'
         '<span class="kw3">D＝Diameter（6mm超）</span>：'
         '目安であり絶対ではない。<br>'
         '<span class="kw3">E＝Evolving／Elevation（変化・隆起）</span>：'
         '<span class="kw3">最も鋭敏な指標。数か月単位で大きさ・形・色が変わる、'
         '隆起する、出血する、症状（痒み・痛み）が出る</span>——'
         '<span class="kw3">「変化したかどうか」が実地では決め手</span>になる'
         '（<span class="kw">Q.156</span>）。<br>'
         '<span class="kw4">なお日本人に多い末端黒子型では、'
         'ABCDEよりダーモスコピーの平行隆線パターンのほうが鋭敏</span>である。'
         '<span class="kw4">爪ではHutchinson徴候（爪郭への色素の滲み出し）と'
         '色素線条の幅・不均一さ</span>を見る（<span class="kw">Q.174</span>）。'),
  deep=('📌 良性色素性母斑と悪性黒色腫の対比',
        '<table class="tb"><tr><th>項目</th><th>色素性母斑（良性）</th><th>悪性黒色腫</th></tr>'
        '<tr><td>対称性</td><td>対称</td><td><span class="kw3">非対称</span></td></tr>'
        '<tr><td>辺縁</td><td>滑らか・明瞭</td><td><span class="kw3">不整・不明瞭</span></td></tr>'
        '<tr><td>色調</td><td>均一（濃くてもよい）</td>'
        '<td><span class="kw3">多彩・まだら（黒・褐・青灰・赤・白）</span></td></tr>'
        '<tr><td>径</td><td>通常6mm以下</td><td><span class="kw3">6mm超が多い</span></td></tr>'
        '<tr><td>経過</td><td>身体の成長に伴い緩徐</td>'
        '<td><span class="kw3">数か月で拡大・隆起・出血</span></td></tr>'
        '<tr><td>足底ダーモスコピー</td><td><span class="kw3">平行溝パターン</span></td>'
        '<td><span class="kw3">平行隆線パターン</span></td></tr></table>'
        '<span class="kw4">「黒色調が強い＝悪性」という直感が働きやすいのが本問の正答率66％の理由</span>だが、'
        '<span class="kw3">評価しているのは色の“濃さ”ではなく“ばらつき”</span>である。'),
  point=('🎯 国試ポイント',
         '① ABCDE＝<span class="kw3">非対称・辺縁不整・色調不均一・径6mm超・変化（隆起）</span>。<br>'
         '② <span class="kw4">「黒色調の強さ（濃さ）」は診断指標ではない</span>。<br>'
         '③ <span class="kw3">最も重要なのはE＝変化（拡大・隆起・出血）</span>。<br>'
         '④ <span class="kw3">無色素性黒色腫もある</span>——色だけで判断しない。<br>'
         '⑤ 日本人の末端型は<span class="kw3">ダーモスコピーの平行隆線パターン</span>で捉える。')),

]

QUESTIONS += [

Q('102A-34', 29, [('bs', '★'), ('bi', '📷')],
  '71歳の男性。<span class="kw">数年前に出現した顔面の紅色皮疹が拡大</span>してきたことを主訴に来院した。'
  '顔面の写真（A）と同部の病理組織H-E染色標本（B）とを示す。<br>'
  '<strong>治療法として適切なのはどれか。<span class="kw2">2つ選べ</span>。</strong>',
  [('a', '切　除', True, '<span class="kw3">外科的切除は日光角化症の確実な治療</span>である。'
                     '<span class="kw3">病変全体を病理検査に回せるため、'
                     '有棘細胞癌への浸潤の有無を確認できる</span>という点で'
                     '<span class="kw3">診断と治療を兼ねる</span>。'
                     '<span class="kw3">単発・肥厚した病変・浸潤が疑われる病変では第一選択</span>となる。'),
   ('b', '凍結療法', True, '<span class="kw3">液体窒素による凍結療法は日光角化症の標準治療の一つ</span>で、'
                     '<span class="kw3">簡便・低コストで外来で完結し、'
                     '多発病変にも対応できる</span>。'
                     '<span class="kw3">異型角化細胞は凍結に対する抵抗性が低く、'
                     '数回の施行で治癒が得られる</span>。'
                     '<span class="kw4">ただし組織が得られないため、'
                     '浸潤癌が否定できない病変ではまず生検を行う</span>のが原則である。'),
   ('c', '温熱療法', False, '<span class="kw4">温熱療法は皮膚悪性腫瘍の標準治療ではない</span>。'
                     '<span class="kw4">深部の軟部肉腫などで放射線・化学療法の増感を狙って'
                     '併用されることはある</span>が、'
                     '<span class="kw4">表在性の表皮内癌に単独で行う治療としての位置づけはない</span>。'),
   ('d', '放射線治療', False, '<span class="kw4">放射線治療は、手術が困難な部位や'
                     '全身状態から手術に耐えない高齢者で選択されうる</span>が、'
                     '<span class="kw4">日光角化症のような表在性の前癌病変に'
                     '第一選択として用いるのは過剰</span>である。'
                     '<span class="kw4">照射部位が後に慢性放射性皮膚炎となり、'
                     '二次的に有棘細胞癌・基底細胞癌を生じるリスク</span>もある。'),
   ('e', '紫外線療法', False, '<span class="kw4">紫外線こそが日光角化症の原因</span>である。'
                     '<span class="kw4">PUVAやnarrow-band UVBを照射すればDNA損傷をさらに蓄積させ、'
                     '病変を悪化させ新たな病変を誘発する</span>。'
                     '<span class="kw4">むしろ治療の一環として遮光指導を行う</span>のが正しい。'
                     '<span class="kw4">光線力学的療法〈PDT〉は「光感受性物質＋可視光」で'
                     '腫瘍細胞を選択的に破壊する別の治療</span>であり、'
                     '単なる紫外線照射とは区別する。')],
  '日光角化症（表皮内癌）の治療は切除と凍結療法。紫外線療法は原因そのもので禁忌、温熱・放射線は第一選択にならない。',
  imgs=['images/102A-34_1.jpeg', 'images/102A-34_2.jpeg'],
  patho=('🧬 日光角化症の治療選択——「診断が要るか」「何個あるか」で決める',
         '<span class="kw3">日光角化症は表皮内癌であり転移しないため、'
         '局所を確実に破壊できれば治癒する</span>。'
         '<span class="kw3">選択肢は複数あり、①病理診断が必要か、'
         '②病変が単発か多発か、③部位と整容面</span>で使い分ける。<br>'
         '<span class="kw3">①外科的切除</span>：'
         '<span class="kw3">病変全体を標本にできるので、'
         '「浸潤癌が混じっていないか」を確定できる唯一の方法</span>。'
         '<span class="kw3">肥厚・硬結・潰瘍・急速増大があれば有棘細胞癌への進展を疑い、切除を選ぶ</span>。<br>'
         '<span class="kw3">②凍結療法（液体窒素）</span>：'
         '<span class="kw3">簡便・安価・外来で反復可能。多発例に向く</span>。'
         '<span class="kw4">欠点は組織が得られないことと、色素脱失を残しうること</span>。<br>'
         '<span class="kw3">③イミキモド5％クリーム外用</span>：'
         '<span class="kw3">TLR7を介して自然免疫を賦活し、腫瘍細胞を排除する</span>。'
         '<span class="kw3">顔面・頭部の多発病変（field cancerization）に適する</span>。'
         '強い局所炎症反応が起こるが、これは効果の現れである。<br>'
         '<span class="kw3">④5-FU外用</span>：異型細胞のDNA合成を阻害する。<br>'
         '<span class="kw3">⑤光線力学的療法〈PDT〉</span>：'
         '<span class="kw3">アミノレブリン酸を塗って腫瘍細胞にプロトポルフィリンⅨを蓄積させ、'
         '可視光を照射して活性酸素で破壊する</span>。整容性に優れる。<br>'
         '<span class="kw3">いずれの治療後も、遮光（帽子・日焼け止め・長袖）と'
         '定期的な全身の皮膚チェックが再発・新生の予防の柱</span>になる。'),
  deep=('📌 「紫外線を当ててよい疾患／いけない疾患」',
        '<table class="tb"><tr><th></th><th>疾患</th><th>理由</th></tr>'
        '<tr><td><span class="kw3">光線療法が有効</span></td>'
        '<td><span class="kw3">尋常性乾癬、尋常性白斑、菌状息肉症（早期）、'
        'アトピー性皮膚炎（難治例）、掌蹠膿疱症、円形脱毛症</span></td>'
        '<td><span class="kw3">T細胞のアポトーシス誘導・免疫調節・色素再生</span></td></tr>'
        '<tr><td><span class="kw4">紫外線が禁忌／有害</span></td>'
        '<td><span class="kw4">日光角化症、Bowen病、有棘細胞癌、基底細胞癌、'
        '悪性黒色腫、色素性乾皮症、全身性エリテマトーデス、ポルフィリン症</span></td>'
        '<td><span class="kw4">紫外線が発症要因そのもの／光線過敏を悪化させる</span></td></tr></table>'
        '<span class="kw3">「その疾患にとって紫外線は敵か味方か」</span>を'
        '一度整理しておくと、治療選択の設問で迷わない。'
        '<span class="kw4">本問の正答率が29％と低いのは、'
        '「紫外線療法」を光線力学的療法と混同したためと考えられる</span>。'),
  point=('🎯 国試ポイント',
         '① 日光角化症の治療＝<span class="kw3">切除・凍結療法・イミキモド／5-FU外用・PDT</span>。<br>'
         '② <span class="kw3">浸潤癌が疑われるなら切除（＝病理で確認できる）</span>。<br>'
         '③ <span class="kw3">多発例には凍結・外用が向く</span>。<br>'
         '④ <span class="kw4">紫外線療法は禁忌</span>——原因そのもの。<span class="kw4">PDTとは別物</span>。<br>'
         '⑤ 治療後は<span class="kw3">遮光指導と定期的な皮膚チェック</span>。')),

Q('102A-35', 87, [('bs', '★'), ('bi', '📷')],
  '54歳の男性。<span class="kw">腋窩と頸部との皮膚のざらつきと痒み</span>とを主訴に来院した。'
  '腋窩部の写真（A）と腋窩部皮疹の病理組織H-E染色標本（B）とを示す。<br>'
  '<strong>基礎疾患として考えられるのはどれか。<span class="kw2">2つ選べ</span>。</strong>',
  [('a', '肝硬変', False, '<span class="kw4">肝硬変の皮膚所見は、'
                     'クモ状血管腫・手掌紅斑・女性化乳房・黄疸・腹壁静脈怒張（medusa頭）・'
                     '出血傾向（紫斑）・爪の白色化</span>である。'
                     '<span class="kw4">間擦部のざらついた色素沈着は来さない</span>。'),
   ('b', '糖尿病', True, '<span class="kw3">黒色表皮腫の良性型（＝仮性黒色表皮腫）の'
                     '最も多い背景がインスリン抵抗性を伴う肥満・2型糖尿病</span>である。'
                     '<span class="kw3">高インスリン血症のインスリンが'
                     'IGF-1受容体に交差結合して角化細胞・線維芽細胞の増殖を促す</span>のが機序で、'
                     '<span class="kw3">黒色表皮腫はインスリン抵抗性の「見える指標」</span>として'
                     '扱われる。'),
   ('c', '悪性腫瘍', True, '<span class="kw3">黒色表皮腫は代表的なデルマドローム</span>で、'
                     '<span class="kw3">悪性型は中高年に急速に発症し、範囲が広く、'
                     '口唇・口腔粘膜や手掌（tripe palms）にも及び、瘙痒を伴う</span>。'
                     '<span class="kw3">合併腫瘍の約6割は胃癌</span>で、'
                     '他に膵・肺・大腸・卵巣などの腺癌がある'
                     '（<span class="kw">Q.153</span>・<span class="kw">Q.186</span>）。'
                     '<span class="kw3">54歳で痒みを伴い頸部にも及ぶ本例では、'
                     '上部消化管内視鏡による検索が必要</span>である。'),
   ('d', '悪性貧血', False, '<span class="kw4">悪性貧血は抗内因子抗体・抗胃壁細胞抗体による'
                     'ビタミンB12欠乏</span>で、'
                     '<span class="kw4">Hunter舌炎（舌乳頭の萎縮）、亜急性連合性脊髄変性症、'
                     '皮膚の蒼白・軽度の黄疸、白髪</span>を来す。'
                     '<span class="kw4">黒色表皮腫の背景疾患ではない</span>。'
                     'なお<span class="kw4">悪性貧血の背景である萎縮性胃炎は胃癌のリスク</span>ではあるが、'
                     '設問が問うているのは黒色表皮腫の基礎疾患である。'),
   ('e', 'Basedow病', False, '<span class="kw4">Basedow病の皮膚所見は、'
                     '発汗過多・温かく湿った皮膚・脛骨前粘液水腫（前脛骨部の非圧痕性浮腫状局面）・'
                     'ばち指〈thyroid acropachy〉</span>である。'
                     '<span class="kw4">黒色表皮腫を来す内分泌疾患としては、'
                     'Cushing症候群・先端巨大症・多囊胞性卵巣症候群など'
                     'インスリン抵抗性を伴うもの</span>が挙げられ、'
                     '<span class="kw4">Basedow病はこれに含まれない</span>。')],
  '間擦部のざらついた褐色斑＝黒色表皮腫。背景はインスリン抵抗性（肥満・2型糖尿病）と内臓悪性腫瘍（胃癌）の2つ。',
  imgs=['images/102A-35_1.jpeg', 'images/102A-35_2.jpeg'],
  patho=('🧬 黒色表皮腫の病理——「黒い」のはメラニンのせいではない',
         '<span class="kw3">黒色表皮腫の病理像は、'
         '①乳頭腫症〈papillomatosis：真皮乳頭が指状に伸びて表皮が波打つ〉、'
         '②過角化〈hyperkeratosis〉、③軽度の棘細胞層肥厚</span>が本体で、'
         '<span class="kw3">メラニン色素の増加はごく軽度かほとんどない</span>。'
         '<span class="kw3">褐色に見えるのは、厚くなった角層と'
         '乳頭状の凹凸による光の吸収・散乱の効果</span>である——'
         '<span class="kw3">名前に反して「色素性疾患ではない」</span>という点が'
         '国試で狙われる典型的なポイントである。<br>'
         '<span class="kw3">臨床的には、腋窩・頸部・鼠径・肘窩・臍囲などの間擦部に、'
         '左右対称性に、灰褐色でビロード状〜乳頭腫状のざらついた肥厚</span>が生じる。'
         '<span class="kw3">しばしば軟性線維腫〈スキンタッグ〉を伴う</span>。<br>'
         '<span class="kw3">2つの型の見分け方</span>——'
         '<span class="kw3">①良性型（仮性黒色表皮腫）：若年〜中年、肥満・2型糖尿病・'
         'Cushing症候群・多囊胞性卵巣症候群・先端巨大症などインスリン抵抗性を伴う病態。'
         '緩徐に出現し瘙痒は乏しい。減量・血糖是正で改善しうる。'
         '②悪性型：中高年、数か月で急速に出現、範囲が広い、'
         '口唇・口腔粘膜・眼瞼結膜にも及ぶ、手掌のtripe palms、瘙痒を伴う</span>。'
         '<span class="kw3">悪性型を疑ったら上部消化管内視鏡を含む腫瘍検索</span>を行う。'
         '<span class="kw3">腫瘍の切除で皮疹が軽快し、再発とともに再燃する</span>という'
         '並行性がデルマドロームであることの証拠になる。<br>'
         '<span class="kw4">なお薬剤性（ニコチン酸、副腎皮質ステロイド、'
         '経口避妊薬など）や遺伝性（FGFR3変異）の黒色表皮腫もある</span>。'),
  deep=('📌 良性型と悪性型の黒色表皮腫の鑑別',
        '<table class="tb"><tr><th>項目</th><th>良性型（インスリン抵抗性）</th><th>悪性型（腫瘍随伴）</th></tr>'
        '<tr><td>年齢</td><td>若年〜中年</td><td><span class="kw3">中高年</span></td></tr>'
        '<tr><td>発症</td><td>緩徐（年単位）</td><td><span class="kw3">急速（数か月）</span></td></tr>'
        '<tr><td>範囲</td><td>腋窩・頸部に限局</td>'
        '<td><span class="kw3">広範。口唇・口腔粘膜・手掌（tripe palms）にも及ぶ</span></td></tr>'
        '<tr><td>瘙痒</td><td>乏しい</td><td><span class="kw3">あり</span></td></tr>'
        '<tr><td>背景</td><td><span class="kw3">肥満、2型糖尿病、PCOS、Cushing症候群、先端巨大症</span></td>'
        '<td><span class="kw3">胃癌（約6割）、その他の腺癌</span></td></tr>'
        '<tr><td>対応</td><td>減量・血糖管理</td>'
        '<td><span class="kw3">上部消化管内視鏡を含む腫瘍検索</span></td></tr></table>'
        '<span class="kw3">両者は排他的ではなく、「どちらもあり得る」ので'
        '本問のように2つ選ばせる設問になる</span>。'),
  point=('🎯 国試ポイント',
         '① 黒色表皮腫の基礎疾患＝<span class="kw3">インスリン抵抗性（肥満・糖尿病）と内臓悪性腫瘍</span>。<br>'
         '② 病理＝<span class="kw3">乳頭腫症・過角化が本体。メラニン増加は主体でない</span>。<br>'
         '③ 悪性型＝<span class="kw3">中高年・急速・広範・粘膜にも及ぶ・瘙痒あり→胃癌を探す</span>。<br>'
         '④ <span class="kw3">tripe palms（牛肚状手掌）も悪性型のサイン</span>。<br>'
         '⑤ <span class="kw4">Basedow病・悪性貧血・肝硬変は背景疾患ではない</span>。')),

Q('101F-11', 55, [('bs', '★')],
  '<strong>疾患と発生母地の組合せで正しいのはどれか。<span class="kw2">2つ選べ</span>。</strong>',
  [('a', 'Merkel 細胞癌  ――――――――― 局面状類乾癬', False,
                     '<span class="kw4">Merkel細胞癌は高齢者の露光部（頭頸部・四肢）に生じる'
                     '神経内分泌腫瘍で、Merkel細胞ポリオーマウイルス感染と免疫抑制</span>が背景である。'
                     '<span class="kw4">局面状類乾癬〈parapsoriasis en plaques〉は'
                     '菌状息肉症の前駆病変（とくに大局面型）</span>であり、'
                     '<span class="kw4">Merkel細胞癌とは無関係</span>である。'),
   ('b', '有棘細胞癌  ―――――――――― 慢性放射性皮膚炎', True,
                     '<span class="kw3">正しい。慢性放射性皮膚炎は、'
                     '放射線照射後に萎縮・色素異常・毛細血管拡張・難治性潰瘍を来した皮膚</span>で、'
                     '<span class="kw3">照射から10〜30年の潜伏期を経て'
                     '有棘細胞癌・基底細胞癌が発生</span>する。'
                     '<span class="kw3">かつてX線技師や結核・白癬の放射線治療を受けた患者に多かった</span>。'
                     '慢性の細胞障害と再生の反復という点で'
                     '<span class="kw3">熱傷瘢痕（Marjolin潰瘍）と同じ機序</span>である。'),
   ('c', '悪性黒色腫  ―――――――――― 先天性巨大色素性母斑', True,
                     '<span class="kw3">正しい。先天性巨大色素性母斑（成人換算で径20cm以上）は、'
                     '生涯にわたり数％程度の確率で悪性黒色腫を発生</span>する。'
                     '<span class="kw3">発生は小児期を含む早期にも起こりうる</span>ため'
                     '経過観察・整容目的の治療が検討される。'
                     '<span class="kw3">体幹の巨大病変では神経皮膚黒色症〈neurocutaneous melanosis〉を'
                     '合併し中枢神経にもメラノサイト病変を伴うことがある</span>。'
                     '<span class="kw4">なお通常の小型の後天性色素性母斑からの悪性化はまれ</span>である。'),
   ('d', 'Paget 病  ――――――――――― 黒色表皮腫', False,
                     '<span class="kw4">黒色表皮腫は角化細胞の乳頭腫症であり前癌病変ではない</span>。'
                     '<span class="kw4">乳房外Paget病はアポクリン腺関連の表皮内腺癌として'
                     '原発する</span>もので、'
                     '<span class="kw4">発生母地をもたない</span>（<span class="kw">Q.155</span>）。'),
   ('e', '血管肉腫  ――――――――――― 尋常性狼瘡', False,
                     '<span class="kw4">尋常性狼瘡〈lupus vulgaris〉は皮膚結核の一型</span>で、'
                     '<span class="kw4">硝子圧法でリンゴゼリー様の黄褐色結節</span>を示す。'
                     '<span class="kw4">長期経過例では有棘細胞癌を生じうる</span>が、'
                     '<span class="kw4">血管肉腫の母地にはならない</span>。'
                     '血管肉腫の背景は<span class="kw4">高齢者頭部・慢性リンパ浮腫・放射線照射後</span>である'
                     '（<span class="kw">Q.159</span>）。')],
  '慢性放射性皮膚炎→有棘細胞癌、先天性巨大色素性母斑→悪性黒色腫。いずれも「慢性の細胞障害」「母斑細胞の巨大な集積」という素地がある。',
  patho=('🧬 慢性放射性皮膚炎と先天性巨大色素性母斑',
         '<span class="kw3">【慢性放射性皮膚炎】</span>'
         '<span class="kw3">放射線の急性反応（紅斑・水疱・脱毛）が治まった後、'
         '数年〜数十年をかけて皮膚が萎縮し、色素沈着と脱失が混在し、'
         '毛細血管拡張と皮膚付属器の消失を来した状態</span>である。'
         '<span class="kw3">血流と再生能が失われているため軽微な外傷で難治性潰瘍となり、'
         'その慢性刺激を背景に有棘細胞癌・基底細胞癌が発生</span>する。'
         '<span class="kw3">潜伏期は10〜30年と長い</span>。'
         '<span class="kw4">「照射部位に治らない潰瘍・隆起ができた」ら悪性化を疑って生検する</span>。<br>'
         '<span class="kw3">【先天性巨大色素性母斑】</span>'
         '<span class="kw3">出生時から存在する色素性母斑のうち、'
         '成人換算の最大径20cm以上のもの</span>を指す。'
         '<span class="kw3">体幹に「水着様〈bathing trunk nevus〉」の分布をとることがあり、'
         '周囲に衛星病変を伴う</span>。'
         '<span class="kw3">悪性黒色腫の発生率は数％（報告により1〜5％程度）で、'
         '約半数は5歳までに発生する</span>とされ、'
         '<span class="kw3">真皮深層〜皮下から発生するため早期発見が難しい</span>のが問題である。'
         '<span class="kw3">また中枢神経にメラノサイトが増殖する神経皮膚黒色症を合併しうる</span>ため、'
         '大型例では頭部MRIによる評価が行われる。<br>'
         '<span class="kw4">一方、径1cm前後の小型の先天性母斑や通常の後天性色素性母斑からの'
         '悪性化はまれ</span>で、'
         '<span class="kw4">日本人の悪性黒色腫の多くは母斑と無関係に足底・爪から生じる</span>。'),
  deep=('📌 「慢性刺激→有棘細胞癌」のバリエーション',
        '<table class="tb"><tr><th>素地</th><th>潜伏期</th><th>備考</th></tr>'
        '<tr><td><span class="kw3">熱傷瘢痕（Marjolin潰瘍）</span></td>'
        '<td><span class="kw3">20〜50年</span></td><td>転移率が高い</td></tr>'
        '<tr><td><span class="kw3">慢性放射性皮膚炎</span></td>'
        '<td><span class="kw3">10〜30年</span></td><td>基底細胞癌も生じる</td></tr>'
        '<tr><td>慢性膿皮症・瘻孔・褥瘡</td><td>年単位</td><td>治らない潰瘍は生検</td></tr>'
        '<tr><td>尋常性狼瘡（皮膚結核）</td><td>数十年</td><td>リンゴゼリー様結節</td></tr>'
        '<tr><td>慢性円板状エリテマトーデス</td><td>年単位</td><td>瘢痕性の萎縮局面</td></tr>'
        '<tr><td>日光角化症・Bowen病</td><td>—</td><td>表皮内癌からの連続的進展</td></tr></table>'
        '<span class="kw3">共通の原理は「細胞障害と再生の反復がDNA変異を蓄積させる」</span>こと。'
        '<span class="kw4">したがって「昔からある瘢痕・潰瘍が最近変化した」という提示は'
        'すべて有棘細胞癌を疑う合図</span>である（<span class="kw">Q.185</span>）。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">慢性放射性皮膚炎→有棘細胞癌・基底細胞癌（潜伏期10〜30年）</span>。<br>'
         '② <span class="kw3">先天性巨大色素性母斑→悪性黒色腫（数％。約半数は5歳まで）</span>。<br>'
         '③ <span class="kw3">巨大母斑では神経皮膚黒色症の合併に注意（頭部MRI）</span>。<br>'
         '④ <span class="kw4">黒色表皮腫は前癌病変ではない</span>。<br>'
         '⑤ Merkel細胞癌＝<span class="kw3">高齢者の露光部・ポリオーマウイルス・免疫抑制</span>。')),

Q('95B-47', None, [('bs', '★')],
  '<strong>女性外陰疾患で正しいのはどれか。</strong>',
  [('a', 'Bowen病は外陰部以外にみられない。', False,
                     '<span class="kw4">Bowen病は全身どこにでも生じる</span>。'
                     '<span class="kw4">紫外線による露光部の病変、'
                     '慢性ヒ素中毒による体幹（非露光部）の多発病変、'
                     'HPV関連の外陰・肛囲病変</span>と背景は多様である'
                     '（<span class="kw">Q.161</span>）。'
                     '「外陰部以外にみられない」は明らかな誤り。'),
   ('b', 'Paget病は術後再発しやすい。', True,
                     '<span class="kw3">正しい。乳房外Paget病は、'
                     '肉眼的な病変の境界を越えて表皮内をpagetoidに進展している</span>ため、'
                     '<span class="kw3">見た目どおりに切除すると断端に腫瘍細胞が残り、高率に再発</span>する。'
                     '<span class="kw3">このため十分なマージン（1〜3cm）をとる、'
                     'あるいは事前に病変周囲を格子状に生検して進展範囲を確認する'
                     'マッピング生検を行ってから切除</span>するのが標準である'
                     '（<span class="kw">Q.155</span>）。'),
   ('c', '基底細胞癌が好発する。', False,
                     '<span class="kw4">基底細胞癌は顔面正中（鼻・内眼角）に好発し、'
                     '約8割が頭頸部に生じる</span>。'
                     '<span class="kw4">外陰部の基底細胞癌は極めてまれ</span>である。'
                     '外陰部に好発する悪性腫瘍は<span class="kw4">扁平上皮癌と乳房外Paget病</span>。'),
   ('d', '扁平上皮癌の好発年齢は40歳代である。', False,
                     '<span class="kw4">外陰扁平上皮癌の好発年齢は60〜70歳代以降</span>である。'
                     '<span class="kw4">高齢者では硬化性苔癬などの慢性炎症を背景としたHPV非依存性、'
                     '比較的若年ではHPV（16型など）関連の外陰上皮内腫瘍からの進展</span>という'
                     '2経路があるが、いずれにせよ<span class="kw4">40歳代が好発年齢ではない</span>。'),
   ('e', '悪性黒色腫は腺上皮由来である。', False,
                     '<span class="kw4">悪性黒色腫は神経堤由来のメラノサイトから発生</span>する。'
                     '<span class="kw4">腺上皮由来ではない</span>。'
                     '<span class="kw4">外陰部の悪性黒色腫は粘膜型で、'
                     '皮膚原発より進行例で発見されやすく予後不良</span>である。'
                     '免疫染色は<span class="kw4">S-100・HMB-45・Melan-A陽性</span>。')],
  '乳房外Paget病は肉眼的境界を越えて表皮内を進展するため、通常のマージンでは高率に再発する。マッピング生検＋広範切除が原則。',
  patho=('🧬 外陰部の腫瘍性病変——「治らない外陰の皮疹」の考え方',
         '<span class="kw3">外陰部の慢性の皮疹は、'
         'カンジダ・白癬・接触皮膚炎・湿疹として長期に外用治療されがちで、'
         '腫瘍性病変の発見が遅れやすい部位</span>である。'
         '<span class="kw3">「外用薬で治らない」「緩徐に拡大する」皮疹は生検の対象</span>と考える。<br>'
         '<span class="kw3">外陰部に生じる主な腫瘍性病変</span>——'
         '<span class="kw3">①乳房外Paget病：境界明瞭な紅色局面。緩徐に拡大。'
         '外陰では女性は大陰唇、男性は陰囊に好発。'
         '②外陰上皮内腫瘍〈VIN〉／Bowen病：HPV関連の褐色〜紅色の局面や多発丘疹。'
         '③外陰扁平上皮癌：高齢者。硬化性苔癬やVINを背景とする。潰瘍・硬結。'
         '④悪性黒色腫（粘膜型）：黒色斑・結節。予後不良。'
         '⑤基底細胞癌：まれ</span>。<br>'
         '<span class="kw3">乳房外Paget病の「再発しやすさ」の理由</span>を理解しておく——'
         '<span class="kw3">Paget細胞は表皮内を一層ずつ這うように広がるため、'
         '肉眼で見える紅色の範囲より外側にも既に存在している</span>。'
         '<span class="kw3">術中迅速病理やマッピング生検（病変周囲を放射状に数箇所生検して'
         '腫瘍細胞の有無を確認する）で真の境界を定めてから切除する</span>ことで'
         '再発率を下げられる。'
         '<span class="kw3">また表皮内に留まる限り予後は良好だが、'
         '真皮浸潤を来すとリンパ節転移が生じ予後が悪化する</span>ため、'
         '<span class="kw3">結節形成・硬結があれば浸潤を疑う</span>。<br>'
         '<span class="kw4">なお乳房外Paget病の約1割は、'
         '直腸肛門癌・尿路上皮癌が表皮内へ進展した続発性</span>であり、'
         '<span class="kw4">肛囲病変では下部消化管内視鏡、'
         '陰茎周囲では膀胱鏡の検討</span>が必要になる。'),
  deep=('📌 外陰部の主な疾患の見分け方',
        '<table class="tb"><tr><th>疾患</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">乳房外Paget病</span></td>'
        '<td><span class="kw3">境界明瞭な紅色局面。白色調が混在。緩徐に拡大。高齢者</span></td></tr>'
        '<tr><td>硬化性苔癬</td>'
        '<td>白色の萎縮性局面。瘙痒。閉経後女性と小児。'
        '<span class="kw4">扁平上皮癌のリスク</span></td></tr>'
        '<tr><td>外陰カンジダ症</td><td>紅斑＋辺縁の膜様鱗屑と衛星病変。KOHで仮性菌糸</td></tr>'
        '<tr><td>股部白癬</td><td><span class="kw4">辺縁が堤防状に隆起し中心治癒傾向。陰囊は侵しにくい</span></td></tr>'
        '<tr><td>接触皮膚炎</td><td>接触部位に一致。急性の紅斑・小水疱</td></tr>'
        '<tr><td>尖圭コンジローマ</td><td>HPV6/11。乳頭状・鶏冠状の丘疹</td></tr>'
        '<tr><td>疥癬結節</td><td><span class="kw4">陰囊・陰茎の瘙痒性紅色結節。夜間増悪</span></td></tr></table>'
        '<span class="kw3">共通の教訓は「外陰の治らない皮疹は生検」</span>。'
        'この一手が乳房外Paget病の診断を決める。'),
  point=('🎯 国試ポイント',
         '① 乳房外Paget病は<span class="kw3">肉眼的境界を越えて進展するため術後再発しやすい</span>。<br>'
         '② 対策＝<span class="kw3">マッピング生検＋十分なマージンの広範切除</span>。<br>'
         '③ <span class="kw4">Bowen病は外陰部以外にも生じる</span>（露光部・体幹・肛囲）。<br>'
         '④ <span class="kw4">基底細胞癌は顔面正中が好発、外陰部はまれ</span>。<br>'
         '⑤ <span class="kw4">悪性黒色腫はメラノサイト（神経堤）由来であり腺上皮由来ではない</span>。')),

]

QUESTIONS += [

Q('95D-34', None, [('bs', '★'), ('bi', '📷')],
  '68歳の女性。'
  '<span class="kw">20年前から躯幹と四肢とに大小の皮疹が散在性に多発</span>し、'
  '<span class="kw">次第に硬く触れる</span>ようになり、'
  '<span class="kw">最近一部が隆起</span>してきたため来院した。'
  '<span class="kw">時々瘙痒がある以外には自覚症状はない</span>。'
  '背部の写真（A）と生検組織H-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '貨幣状湿疹', False, '<span class="kw4">貨幣状湿疹は、四肢（とくに下腿）に生じる'
                     '硬貨大の境界明瞭な滲出性紅斑で、痂皮・鱗屑を伴い強い瘙痒</span>がある。'
                     '<span class="kw4">数週〜数か月で軽快と再燃を繰り返すが、'
                     '20年かけて硬く浸潤し隆起・腫瘤化することはない</span>。'),
   ('b', '乾　癬', False, '<span class="kw4">尋常性乾癬は、被髪頭部・肘頭・膝蓋・殿部など'
                     '刺激を受ける部位に生じる、銀白色の厚い鱗屑を伴う境界明瞭な紅色局面</span>。'
                     '<span class="kw4">Auspitz現象（鱗屑を剝がすと点状出血）とKöbner現象</span>が特徴で、'
                     '<span class="kw4">病理は錯角化・顆粒層の消失・Munro微小膿瘍（角層内の好中球）・'
                     '表皮突起の棍棒状延長</span>である。'
                     '<span class="kw4">異型リンパ球の浸潤は来さない</span>。'),
   ('c', '扁平苔癬', False, '<span class="kw4">扁平苔癬は、手関節屈側・下腿に生じる'
                     '紫紅色で多角形の扁平隆起性丘疹（Wickham線条を伴う）</span>が特徴。'
                     '<span class="kw4">病理は表皮基底層の液状変性と真皮上層の帯状リンパ球浸潤</span>で、'
                     '<span class="kw4">浸潤するリンパ球に異型はない</span>。'
                     '<span class="kw4">口腔粘膜のレース状白斑・C型肝炎との関連</span>も押さえる。'),
   ('d', '皮膚T細胞リンパ腫', True, '<span class="kw3">①20年という超長期の経過、'
                     '②躯幹・四肢の非露光部に多発する斑、'
                     '③次第に「硬く触れる」＝浸潤を触れる局面へ（扁平浸潤期）、'
                     '④最近になって一部が隆起＝腫瘍期への移行、'
                     '⑤瘙痒はあるが全身状態は良好</span>——'
                     '<span class="kw3">菌状息肉症＝皮膚T細胞リンパ腫〈CTCL〉</span>の'
                     '典型的な自然史である。'
                     '<span class="kw3">病理では真皮上層の帯状リンパ球浸潤に加え、'
                     '表皮内へ異型リンパ球が侵入する表皮向性とPautrier微小膿瘍</span>を認める'
                     '（<span class="kw">Q.151</span>・<span class="kw">Q.164</span>）。'),
   ('e', 'スポロトリコーシス', False, '<span class="kw4">スポロトリコーシスは'
                     '土壌中の Sporothrix による深在性真菌症</span>で、'
                     '<span class="kw4">外傷を契機に露出部（顔面・上肢）に単発の結節・潰瘍を生じ、'
                     'リンパ管に沿って線状に新病変が並ぶ</span>。'
                     '<span class="kw4">20年かけて全身の躯幹・四肢に多発することはなく、'
                     '病理は化膿性肉芽腫（好中球＋類上皮細胞）である</span>。')],
  '20年かけて斑→浸潤局面→隆起した腫瘤へ進む「三相性」＝菌状息肉症（皮膚T細胞リンパ腫）。長い経過そのものが診断の手がかり。',
  imgs=['images/95D-34_1.jpeg', 'images/95D-34_2.jpeg'],
  patho=('🧬 菌状息肉症の自然史と、湿疹・乾癬との「経過」による切り分け',
         '<span class="kw3">菌状息肉症の最大の診断の鍵は「時間軸」</span>である。'
         '<span class="kw3">湿疹・乾癬・白癬はいずれも治療への反応があり、'
         '数週〜数か月の単位で軽快と再燃を繰り返す</span>のに対し、'
         '<span class="kw3">菌状息肉症は10〜20年かけて一方向に進行し、'
         '「平坦な斑→触れて硬い局面→隆起した腫瘤」と形態そのものが変化していく</span>。'
         '<span class="kw3">この不可逆的な進行性こそが腫瘍性であることの臨床的証拠</span>である。<br>'
         '<span class="kw3">紅斑期の皮疹は非露光部（殿部・大腿内側・体幹）に好発</span>し、'
         '<span class="kw3">境界不明瞭で萎縮性（表面が細かくしわ寄る）、'
         '大小不同で形も不整</span>という特徴がある。'
         '<span class="kw3">この段階の病理は非特異的で、'
         '「湿疹」としか読めないことも多く、'
         '数年にわたり繰り返し生検してようやく診断がつくことがある</span>。<br>'
         '<span class="kw3">病期分類はTNMB分類（皮膚T・リンパ節N・内臓M・末梢血B）</span>で行い、'
         '<span class="kw3">早期（ⅠA〜ⅡA：皮膚に限局）の予後は良好で天寿を全うしうる</span>のに対し、'
         '<span class="kw3">腫瘍期（ⅡB）以降・紅皮症・リンパ節や内臓浸潤があると予後は不良</span>となる。<br>'
         '<span class="kw3">治療は病期依存の階段状</span>で、'
         '<span class="kw3">早期＝ステロイド外用・PUVA／NB-UVB・電子線照射（局所または全身）、'
         '進行期＝レチノイド（ベキサロテン）、インターフェロン、'
         '抗CCR4抗体〈モガムリズマブ〉、化学療法</span>。'
         '<span class="kw4">早期に強い全身化学療法を行っても予後は改善せず、'
         '有害事象が増えるだけ</span>とされ、「必要最小限から始める」のが原則である。'),
  deep=('📌 「体幹に多発する局面」の鑑別——経過と病理で切る',
        '<table class="tb"><tr><th>疾患</th><th>経過</th><th>病理の要点</th></tr>'
        '<tr><td><span class="kw3">菌状息肉症</span></td>'
        '<td><span class="kw3">10〜20年、一方向に進行</span></td>'
        '<td><span class="kw3">表皮向性・Pautrier微小膿瘍・脳回状核</span></td></tr>'
        '<tr><td>貨幣状湿疹</td><td>数週〜数か月、寛解増悪</td><td>海綿状態＋リンパ球浸潤（異型なし）</td></tr>'
        '<tr><td>尋常性乾癬</td><td>慢性だが形態は変わらない</td>'
        '<td><span class="kw4">錯角化・顆粒層消失・Munro微小膿瘍・表皮突起の棍棒状延長</span></td></tr>'
        '<tr><td>扁平苔癬</td><td>数か月〜年。自然消退あり</td>'
        '<td><span class="kw4">基底層の液状変性＋帯状リンパ球浸潤</span></td></tr>'
        '<tr><td>体部白癬</td><td>数週〜数か月。抗真菌薬で治る</td>'
        '<td>角層内に菌糸（PAS・Grocott染色）</td></tr>'
        '<tr><td>類乾癬（大局面型）</td><td>年単位</td>'
        '<td><span class="kw4">菌状息肉症の前駆病変となりうる</span></td></tr></table>'
        '<span class="kw3">Pautrier微小膿瘍は「海綿状態を伴わずに'
        '表皮内に異型リンパ球が集簇する」</span>点で、'
        '<span class="kw3">海綿状態（細胞間浮腫）を伴う湿疹の表皮内リンパ球とは異なる</span>。'),
  point=('🎯 国試ポイント',
         '① 菌状息肉症＝<span class="kw3">10〜20年かけて斑→局面→腫瘤と進む皮膚T細胞リンパ腫</span>。<br>'
         '② <span class="kw3">「経過が長く、一方向に進む」ことが湿疹・乾癬との決定的な違い</span>。<br>'
         '③ 好発は<span class="kw3">非露光部（殿部・大腿・体幹）</span>。<br>'
         '④ 病理＝<span class="kw3">表皮向性・Pautrier微小膿瘍</span>。<br>'
         '⑤ <span class="kw3">早期は外用・光線療法から。全身化学療法を急がない</span>。')),

Q('94E-13', None, [('bs', '★'), ('bi', '📷')],
  '23歳の男性。'
  '<span class="kw">幼少時から顔面に雀卵斑が多かった</span>が、'
  '<span class="kw">数年前から黒色丘疹が多発</span>するようになったため来院した。顔面の写真を示す。<br>'
  '<strong>この疾患でみられ<span class="kw2">ない</span>のはどれか。</strong>',
  [('a', '常染色体優性遺伝', True, '<span class="kw3">色素性乾皮症〈xeroderma pigmentosum: XP〉は'
                     '常染色体潜性〈劣性〉遺伝である</span>。'
                     '<span class="kw3">紫外線で生じたDNA損傷（ピリミジンダイマー）を除去する'
                     'ヌクレオチド除去修復〈NER〉に関わる遺伝子（XPA〜XPGとバリアント型XPV）の'
                     '両アレル変異で発症</span>する。'
                     '<span class="kw3">日本ではXPA群が最多で、'
                     '両親が保因者（血族婚があると頻度が上がる）</span>という'
                     '典型的な潜性遺伝の家系像をとる。したがって「優性遺伝」は誤り。'),
   ('b', '光線過敏症', False, '<span class="kw4">みられる。'
                     '乳児期に少量の日光曝露で強い日焼け（水疱を生じるほどの遷延する紅斑）</span>を来し、'
                     '<span class="kw4">これが最初の気付きになることが多い</span>。'
                     '<span class="kw4">その後、露光部に雀卵斑様色素斑が密に多発し、'
                     '色素脱失・毛細血管拡張・皮膚萎縮が混在する'
                     '「多形皮膚萎縮〈poikiloderma〉」</span>を呈する。'),
   ('c', '皮膚の悪性腫瘍', False, '<span class="kw4">みられる。DNA修復ができないため、'
                     '露光部に基底細胞癌・有棘細胞癌・悪性黒色腫が'
                     '若年（多くは20歳未満）から多発</span>する。'
                     '<span class="kw4">健常人に比べ皮膚癌の発生率は千倍以上</span>とされる。'
                     '本例の<span class="kw4">「数年前から黒色丘疹が多発」はこの腫瘍発生を意味</span>しており、'
                     '<span class="kw4">徹底した遮光が生命予後を決める</span>'
                     '（<span class="kw">Q.179</span>）。'),
   ('d', '眼症状', False, '<span class="kw4">みられる。羞明・結膜充血・角膜炎・角膜混濁、'
                     '眼瞼の萎縮と外反、眼瞼・結膜の悪性腫瘍</span>を来す。'
                     '<span class="kw4">眼も露光部であるため皮膚と同じ機序で障害される</span>。'
                     'サングラス・遮光眼鏡による防御が指導される。'),
   ('e', '神経症状', False, '<span class="kw4">みられる。XPA群など一部の病型では、'
                     '進行性の神経変性（感音難聴、腱反射消失、知的障害、'
                     '小脳失調、けいれん、嚥下障害）を合併</span>する。'
                     '<span class="kw4">日本で最多のA群は神経症状を伴う型</span>であり、'
                     '<span class="kw4">「皮膚だけの病気ではない」</span>ことが'
                     '国試で問われる重要点である。')],
  '色素性乾皮症は常染色体潜性〈劣性〉遺伝。DNA修復（ヌクレオチド除去修復）の欠損で、光線過敏・若年からの皮膚癌多発・眼症状・神経症状を来す。',
  imgs=['images/94E-13_1.jpeg'],
  patho=('🧬 色素性乾皮症——DNA修復が効かないと何が起きるか',
         '<span class="kw3">色素性乾皮症は、紫外線によって生じたDNA損傷を修復できないために'
         '皮膚癌が若年から多発する常染色体潜性〈劣性〉遺伝疾患</span>である。'
         '<span class="kw3">紫外線はDNAの隣り合うピリミジン塩基を共有結合させ、'
         'シクロブタン型ピリミジン二量体などの損傷を作る</span>。'
         '<span class="kw3">正常ではヌクレオチド除去修復〈nucleotide excision repair: NER〉が'
         'この部分を切り出して再合成する</span>が、'
         '<span class="kw3">XPではこの経路の酵素（XPA〜XPG）が欠損している</span>。'
         '<span class="kw3">バリアント型〈XPV〉はNERは正常だが、'
         '損傷を乗り越えて複製するDNAポリメラーゼη の異常</span>で発症する。<br>'
         '<span class="kw3">臨床経過</span>——'
         '<span class="kw3">①乳児期：わずかな日光曝露で強い日焼け（遷延する紅斑・水疱）。'
         '②幼児期：露光部に雀卵斑様の色素斑が密に多発。'
         '③学童期以降：色素斑・脱色素斑・毛細血管拡張・萎縮が混在する多形皮膚萎縮。'
         '④10〜20歳代：基底細胞癌・有棘細胞癌・悪性黒色腫が多発</span>。'
         '<span class="kw3">無治療では平均寿命が著しく短縮する</span>。<br>'
         '<span class="kw3">治療の中心は徹底した遮光</span>——'
         '<span class="kw3">屋外活動の制限、UVカットフィルム・衣類・帽子・遮光眼鏡、'
         'SPFの高い日焼け止めの常用、蛍光灯からの紫外線対策</span>。'
         '<span class="kw3">加えて定期的な皮膚科診察で早期の腫瘍を切除する</span>。'
         '<span class="kw4">A群など神経型では、進行性の神経変性に対する'
         'リハビリ・嚥下管理・補聴などの支持療法</span>が必要になる。'),
  deep=('📌 DNA修復異常症・光線過敏症の整理',
        '<table class="tb"><tr><th>疾患</th><th>遺伝形式／異常</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">色素性乾皮症</span></td>'
        '<td><span class="kw3">常染色体潜性／ヌクレオチド除去修復</span></td>'
        '<td><span class="kw3">光線過敏、雀卵斑様色素斑、若年からの皮膚癌多発、神経症状</span></td></tr>'
        '<tr><td>Cockayne症候群</td><td>常染色体潜性／転写共役修復</td>'
        '<td>低身長、老人様顔貌、光線過敏、'
        '<span class="kw4">皮膚癌は増えない</span></td></tr>'
        '<tr><td>毛細血管拡張性運動失調症</td><td>常染色体潜性／ATM（二本鎖切断）</td>'
        '<td>小脳失調、眼球結膜の毛細血管拡張、免疫不全、リンパ腫</td></tr>'
        '<tr><td>Bloom症候群</td><td>常染色体潜性／BLMヘリカーゼ</td>'
        '<td>低身長、顔面の蝶形紅斑様光線過敏、悪性腫瘍</td></tr>'
        '<tr><td>Fanconi貧血</td><td>常染色体潜性／DNA架橋修復</td>'
        '<td>汎血球減少、橈骨異常、白血病</td></tr>'
        '<tr><td>ポルフィリン症（晩発性皮膚）</td><td>ヘム合成酵素異常</td>'
        '<td><span class="kw4">露光部の水疱・びらん・脆弱性。癌は増えない</span></td></tr></table>'
        '<span class="kw3">「光線過敏＋若年の皮膚癌多発」の組合せはXPに特異的</span>である。'),
  point=('🎯 国試ポイント',
         '① 色素性乾皮症＝<span class="kw3">常染色体潜性〈劣性〉遺伝</span>。'
         '<span class="kw4">「優性」は誤り</span>。<br>'
         '② 病態＝<span class="kw3">ヌクレオチド除去修復の欠損（バリアント型はポリメラーゼη異常）</span>。<br>'
         '③ <span class="kw3">乳児期の強い日焼け → 雀卵斑様色素斑 → 10〜20歳代で皮膚癌多発</span>。<br>'
         '④ <span class="kw3">A群（日本で最多）は神経症状（難聴・失調・知的障害）を伴う</span>。<br>'
         '⑤ 治療＝<span class="kw3">徹底した遮光と定期的な皮膚チェック・早期切除</span>。')),

]

# ============================================================
# A問題 NO.173-174
# ============================================================
QUESTIONS += [

Q('118F-40', 99, [('bi', '📷')],
  '74歳の女性。鼻尖部の皮疹を主訴に来院した。'
  '<span class="kw">20年前から鼻尖部に皮疹があり、徐々に隆起</span>してきた。顔面の写真を示す。'
  '<span class="kw">皮疹から生検した病理診断の結果は有棘細胞癌</span>であった。<br>'
  '<strong>最も考えられる病因はどれか。</strong>',
  [('a', '飲　酒', False, '<span class="kw4">飲酒は口腔・咽頭・喉頭・食道の扁平上皮癌、'
                     '肝細胞癌のリスク</span>となるが、'
                     '<span class="kw4">皮膚の有棘細胞癌の主要な病因ではない</span>。'),
   ('b', '肥　満', False, '<span class="kw4">肥満は子宮体癌・乳癌（閉経後）・大腸癌・'
                     '腎細胞癌・食道腺癌などのリスク</span>となる。'
                     '<span class="kw4">皮膚では黒色表皮腫（インスリン抵抗性）・'
                     '間擦疹・カンジダ症などと関連する</span>が、'
                     '<span class="kw4">有棘細胞癌の病因ではない</span>。'),
   ('c', '紫外線', True, '<span class="kw3">高齢者の鼻尖部という典型的な露光部に、'
                     '20年という長い経過で生じた有棘細胞癌</span>である。'
                     '<span class="kw3">皮膚有棘細胞癌の最大の病因は紫外線（UVB）による'
                     'DNA損傷の蓄積（p53変異など）</span>で、'
                     '<span class="kw3">多くは日光角化症を前駆病変として発生</span>する。'
                     '<span class="kw3">屋外労働歴のある高齢者の顔面・頭部（禿頭）・耳介・手背</span>が'
                     '好発部位であり、本例の病歴と完全に合致する。'),
   ('d', 'アスベスト', False, '<span class="kw4">アスベスト（石綿）は'
                     '悪性胸膜中皮腫・肺癌の原因</span>であり、'
                     '<span class="kw4">曝露から発症までの潜伏期が20〜50年と長い</span>点が'
                     '国試の頻出事項。'
                     '<span class="kw4">皮膚腫瘍とは関連しない</span>。'),
   ('e', 'EB ウイルス', False, '<span class="kw4">EBウイルスは伝染性単核球症、'
                     'Burkittリンパ腫、上咽頭癌、Hodgkinリンパ腫、'
                     '胃癌の一部、移植後リンパ増殖性疾患</span>と関連する。'
                     '<span class="kw4">皮膚の有棘細胞癌に関与するウイルスは'
                     'EBVではなくHPV（ヒトパピローマウイルス）</span>であり、'
                     '<span class="kw4">それも外陰・肛囲や疣贅状表皮発育異常症での関与</span>が中心である。')],
  '高齢者の露光部（鼻尖部）に長い経過で生じた有棘細胞癌＝紫外線が病因。多くは日光角化症を前駆病変とする。',
  imgs=['images/118F-40_1.jpeg'],
  patho=('🧬 有棘細胞癌の病因——紫外線が主役、その他は「慢性刺激」と「ウイルス」',
         '<span class="kw3">有棘細胞癌〈squamous cell carcinoma: SCC〉は'
         '表皮の有棘細胞（角化細胞）に由来する悪性腫瘍で、'
         '基底細胞癌に次いで頻度が高い</span>。'
         '<span class="kw3">最大の病因は紫外線（UVB）</span>で、'
         '<span class="kw3">露光部（顔面・耳介・下口唇・禿頭部・手背・前腕）に'
         '高齢者で発生し、屋外労働歴が背景にある</span>。'
         '<span class="kw3">多くは日光角化症という表皮内癌の段階を経て真皮浸潤に至る</span>'
         '（<span class="kw">Q.160</span>・<span class="kw">Q.184</span>）。<br>'
         '<span class="kw3">紫外線以外の病因</span>——'
         '<span class="kw3">①慢性の炎症・瘢痕：熱傷瘢痕（Marjolin潰瘍）、慢性放射性皮膚炎、'
         '慢性膿皮症・瘻孔、褥瘡、尋常性狼瘡（皮膚結核）、'
         '慢性円板状エリテマトーデス。'
         '②化学発癌物質：ヒ素（多発Bowen病を経て）、コールタール、鉱物油。'
         '③ウイルス：HPV（外陰・肛囲、疣贅状表皮発育異常症）。'
         '④免疫抑制：臓器移植後（健常人の数十〜百倍のリスク）。'
         '⑤遺伝性：色素性乾皮症</span>。<br>'
         '<span class="kw3">臨床像は「角化を伴う紅色の結節・腫瘤で、'
         '表面は粗造・易出血性。進行すると潰瘍化し悪臭を伴う」</span>。'
         '<span class="kw3">病理は、異型有棘細胞が基底膜を破って真皮へ浸潤し、'
         '同心円状の角化＝癌真珠〈cancer pearl／horn pearl〉と細胞間橋</span>を認める。<br>'
         '<span class="kw3">基底細胞癌と違いリンパ行性に転移する</span>ため、'
         '<span class="kw3">治療は十分なマージン（低リスクで4〜6mm、'
         '高リスクで10mm以上）をとった切除＋所属リンパ節の評価</span>となる。'),
  deep=('📌 基底細胞癌と有棘細胞癌の対比',
        '<table class="tb"><tr><th>項目</th><th>基底細胞癌</th><th>有棘細胞癌</th></tr>'
        '<tr><td>由来</td><td>基底細胞・毛包</td><td><span class="kw3">有棘細胞（角化細胞）</span></td></tr>'
        '<tr><td>好発部位</td><td><span class="kw3">顔面正中（鼻・内眼角）</span></td>'
        '<td><span class="kw3">顔面・耳介・下口唇・禿頭・手背／瘢痕・潰瘍</span></td></tr>'
        '<tr><td>臨床</td><td>黒色光沢の結節、中心陥凹・堤防状の縁</td>'
        '<td><span class="kw3">角化を伴う紅色腫瘤、易出血、潰瘍、悪臭</span></td></tr>'
        '<tr><td>前駆病変</td><td>脂腺母斑</td>'
        '<td><span class="kw3">日光角化症・Bowen病・瘢痕</span></td></tr>'
        '<tr><td>病理</td><td><span class="kw3">柵状配列＋裂隙</span></td>'
        '<td><span class="kw3">癌真珠・細胞間橋・角化</span></td></tr>'
        '<tr><td>転移</td><td><span class="kw3">ほぼしない</span></td>'
        '<td><span class="kw3">する（リンパ行性）</span></td></tr>'
        '<tr><td>マージン</td><td>3〜5mm</td><td><span class="kw3">4〜10mm以上</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 有棘細胞癌の最大の病因＝<span class="kw3">紫外線</span>。露光部・高齢者・屋外労働。<br>'
         '② 前駆病変＝<span class="kw3">日光角化症・Bowen病</span>。<br>'
         '③ その他の病因＝<span class="kw3">熱傷瘢痕・放射線皮膚炎・慢性潰瘍・ヒ素・HPV・免疫抑制</span>。<br>'
         '④ 病理＝<span class="kw3">癌真珠と細胞間橋</span>。<br>'
         '⑤ <span class="kw3">基底細胞癌と違ってリンパ節転移する</span>＝所属リンパ節の評価が要る。')),

Q('116D-57', 92, [('bc', 'CBT'), ('bi', '📷')],
  '82歳の女性。右母趾爪の褐色斑を主訴に来院した。'
  '<span class="kw">20年前から同部位に褐色斑</span>が出現した。'
  '10年前に自宅近くの診療所を受診したが<span class="kw">良性の皮膚疾患と診断</span>された。'
  '<span class="kw">半年前から褐色斑が拡大し、自然に出血</span>するようになったため受診した。'
  '瘙痒と疼痛はない。右母趾に皮疹を認める。圧痛はない。'
  '<span class="kw">右鼠径リンパ節を触知</span>する。'
  '右母趾の写真（A）とダーモスコピー像（B）とを示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', 'Bowen病', False, '<span class="kw4">Bowen病は表皮内の有棘細胞癌で、'
                     '境界明瞭で不整形の紅褐色局面（鱗屑・痂皮を伴う）</span>である。'
                     '<span class="kw4">爪部に黒色の縦条を作る疾患ではない</span>。'),
   ('b', '悪性黒色腫', True, '<span class="kw3">①20年前からの爪の褐色斑（色素線条）が、'
                     '②半年前から急速に拡大し出血、③爪郭に色素がはみ出している'
                     '（Hutchinson徴候）、④所属リンパ節（右鼠径）を触知</span>——'
                     '<span class="kw3">末端黒子型悪性黒色腫〈acral lentiginous melanoma〉</span>である。'
                     '<span class="kw3">日本人の悪性黒色腫では足底・爪部が最多で、'
                     '本例のように「良性と言われて何年も放置された」のち'
                     '進行して発見されるのが典型的な悲劇のパターン</span>である。'),
   ('c', '基底細胞癌', False, '<span class="kw4">基底細胞癌は顔面正中に好発し、'
                     '爪部（足趾）に生じることは極めてまれ</span>。'
                     '<span class="kw4">形態も中心が陥凹し辺縁が堤防状に隆起する黒色結節</span>で、'
                     '<span class="kw4">爪甲の縦の色素線条という形はとらない</span>。'),
   ('d', '色素性母斑', False, '<span class="kw4">爪部の色素性母斑（爪甲色素線条の良性原因）では、'
                     '線条の幅・色調が均一で境界明瞭、経過中に大きく変化しない</span>。'
                     '<span class="kw4">小児では母斑による幅広い線条もあるが、'
                     '成人で「急速に拡大し出血する」変化があれば良性とは言えない</span>。'
                     '<span class="kw4">10年前の「良性」という診断に引きずられてはいけない</span>——'
                     '評価すべきは<span class="kw4">この半年の変化</span>である。'),
   ('e', '乳房外Paget病', False, '<span class="kw4">乳房外Paget病はアポクリン腺領域'
                     '（外陰・肛囲・腋窩）に生じる表皮内腺癌</span>で、'
                     '<span class="kw4">境界明瞭な紅色局面</span>を呈する。'
                     '<span class="kw4">足趾の爪部に黒色線条として現れることはない</span>。')],
  '爪の色素線条が急速に拡大・出血し、爪郭に色素がはみ出す（Hutchinson徴候）＋リンパ節触知＝末端黒子型悪性黒色腫。',
  imgs=['images/116D-57_1.jpeg', 'images/116D-57_2.jpeg'],
  patho=('🧬 爪甲色素線条〈melanonychia〉——良性と悪性をどこで分けるか',
         '<span class="kw3">爪甲に縦走する黒〜褐色の帯（爪甲色素線条）は、'
         '爪母のメラノサイトが活性化したり増殖したりして生じる</span>。'
         '<span class="kw3">原因は、①生理的（有色人種では加齢とともに多発する）、'
         '②爪母の色素性母斑（小児に多い）、③薬剤（抗腫瘍薬など）、'
         '④外傷・炎症、⑤内分泌疾患（Addison病）、'
         '⑥爪部の悪性黒色腫</span>と幅広い。<br>'
         '<span class="kw3">悪性を疑う所見（ABCDEF ルール）</span>——'
         '<span class="kw3">A: Age（中高年）とAsian/African（末端型が多い人種）、'
         'B: Band（幅3mm以上、色調が不均一、境界不明瞭）、'
         'C: Change（急速に拡大・濃くなる）、'
         'D: Digit（母指・母趾など単一指趾に限局。とくに親指・親趾）、'
         'E: Extension（Hutchinson徴候＝爪郭・爪囲皮膚への色素の滲み出し）、'
         'F: Family／既往</span>。'
         '<span class="kw3">とくにHutchinson徴候と「近位ほど幅が広い三角形」は'
         '悪性を強く示唆</span>する。<br>'
         '<span class="kw3">進行すると、爪甲が破壊されて易出血性の腫瘤となり、'
         '「爪の水虫」「巻き爪」「外傷後の血腫」と誤診されて診断が遅れる</span>。'
         '<span class="kw4">爪下血腫との鑑別は、'
         '血腫なら爪の伸長とともに遠位へ移動して消えるのに対し、'
         '黒色腫は爪母に固定して残る</span>点である。<br>'
         '<span class="kw3">日本人の悪性黒色腫は末端黒子型が約半数を占め、'
         '足底・足趾・爪部・手掌に生じる</span>。'
         '<span class="kw3">紫外線とは無関係で、慢性的な機械的刺激との関連が指摘される</span>。'
         '<span class="kw3">足底では平行隆線パターンが決定的なダーモスコピー所見</span>である'
         '（<span class="kw">Q.188</span>）。'),
  deep=('📌 爪の黒色病変の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>特徴</th><th>経過</th></tr>'
        '<tr><td><span class="kw3">爪部悪性黒色腫</span></td>'
        '<td><span class="kw3">幅広く不均一な線条、近位で幅広い、Hutchinson徴候</span></td>'
        '<td><span class="kw3">拡大・濃染・爪甲破壊・出血</span></td></tr>'
        '<tr><td>爪母の色素性母斑</td><td>均一な幅・色調、境界明瞭</td><td>不変または緩徐</td></tr>'
        '<tr><td>生理的色素線条</td><td><span class="kw4">複数指趾に多発</span>、細い</td>'
        '<td>不変</td></tr>'
        '<tr><td>爪下血腫</td><td>紫黒色。外傷歴</td>'
        '<td><span class="kw4">爪の伸長とともに遠位へ移動して消える</span></td></tr>'
        '<tr><td>爪白癬</td><td>白濁・肥厚・脆弱。<span class="kw4">KOHで菌糸</span></td>'
        '<td>緩徐に進行</td></tr>'
        '<tr><td>グロムス腫瘍</td><td><span class="kw4">爪下の青紅色点。強い自発痛・冷水で増悪</span></td>'
        '<td>疼痛が主訴</td></tr></table>'
        '<span class="kw4">本問で「10年前に良性と診断された」という情報は、'
        '受診を遅らせた事情であって現在の診断根拠にはならない</span>。'
        '<span class="kw3">評価すべきは直近半年の「変化」である</span>。'),
  point=('🎯 国試ポイント',
         '① 爪の色素線条＋<span class="kw3">Hutchinson徴候＝悪性黒色腫を強く疑う</span>。<br>'
         '② <span class="kw3">日本人は末端黒子型（足底・爪）が最多</span>。紫外線と無関係。<br>'
         '③ 悪性のサイン＝<span class="kw3">幅3mm以上・不均一・近位で幅広い・急速な変化・単一指趾</span>。<br>'
         '④ <span class="kw4">爪下血腫は爪の伸長とともに遠位へ移動する</span>のが鑑別点。<br>'
         '⑤ <span class="kw3">「昔は良性と言われた」に引きずられず、最近の変化で判断する</span>。')),

]

# ============================================================
# B問題 NO.175-190
# ============================================================
QUESTIONS += [

Q('115A-4', 94, [],
  '<strong>切除不能の悪性黒色腫に使用される抗体薬の標的抗原はどれか。</strong>',
  [('a', 'IL-17', False, '<span class="kw4">IL-17を標的とする抗体薬（セクキヌマブ、'
                     'イキセキズマブ、ブロダルマブ〈IL-17受容体A〉）は'
                     '尋常性乾癬・乾癬性関節炎・膿疱性乾癬</span>に用いる。'
                     '<span class="kw4">IL-23阻害薬（ウステキヌマブ、グセルクマブ）と並ぶ'
                     '乾癬の生物学的製剤</span>で、腫瘍治療薬ではない。'),
   ('b', 'EGF受容体', False, '<span class="kw4">抗EGFR抗体（セツキシマブ、パニツムマブ）は'
                     'RAS野生型の大腸癌、頭頸部扁平上皮癌</span>に用いる。'
                     '<span class="kw4">副作用として痤瘡様皮疹・皮膚乾燥・爪囲炎</span>が生じ、'
                     '皮膚科的には有名だが、'
                     '<span class="kw4">悪性黒色腫の標的ではない</span>。'),
   ('c', 'IL-6受容体', False, '<span class="kw4">抗IL-6受容体抗体（トシリズマブ、'
                     'サリルマブ）は関節リウマチ、若年性特発性関節炎、'
                     'Castleman病、高安動脈炎、サイトカイン放出症候群</span>に用いる。'),
   ('d', 'PD〈programmed cell death〉-1', True,
                     '<span class="kw3">抗PD-1抗体（ニボルマブ、ペムブロリズマブ）は'
                     '切除不能・転移性悪性黒色腫の標準治療</span>である。'
                     '<span class="kw3">腫瘍細胞のPD-L1がT細胞のPD-1に結合してT細胞を不活化する'
                     '「免疫チェックポイント」を遮断し、'
                     '疲弊したT細胞の抗腫瘍活性を回復させる</span>。'
                     '<span class="kw3">ニボルマブは日本で悪性黒色腫を最初の適応として承認された'
                     '免疫チェックポイント阻害薬</span>で、'
                     '<span class="kw3">抗CTLA-4抗体（イピリムマブ）との併用でさらに奏効率が上がる</span>。'),
   ('e', 'VEGF〈vascular endothelial growth factor〉', False,
                     '<span class="kw4">抗VEGF抗体（ベバシズマブ）は大腸癌・非小細胞肺癌・'
                     '卵巣癌・膠芽腫などに用いる血管新生阻害薬</span>である。'
                     '<span class="kw4">副作用は高血圧・蛋白尿・出血・創傷治癒遅延・消化管穿孔</span>。'
                     '<span class="kw4">悪性黒色腫の標準治療の標的ではない</span>。')],
  '切除不能悪性黒色腫＝抗PD-1抗体（ニボルマブ・ペムブロリズマブ）。免疫チェックポイント阻害でT細胞の抗腫瘍活性を回復させる。',
  patho=('🧬 悪性黒色腫の薬物療法——免疫チェックポイント阻害薬と分子標的薬',
         '<span class="kw3">かつて進行期悪性黒色腫はダカルバジンなどの化学療法しかなく'
         '極めて予後不良だったが、2010年代に治療体系が根本的に変わった</span>。<br>'
         '<span class="kw3">①免疫チェックポイント阻害薬</span>：'
         '<span class="kw3">T細胞は活性化の行き過ぎを防ぐブレーキ（免疫チェックポイント）をもつ。'
         '腫瘍はこれを悪用して免疫から逃れる</span>。'
         '<span class="kw3">抗PD-1抗体（ニボルマブ・ペムブロリズマブ）は'
         'T細胞側のPD-1と腫瘍側のPD-L1の結合を、'
         '抗CTLA-4抗体（イピリムマブ）はリンパ節での初期活性化のブレーキを外す</span>。'
         '<span class="kw3">悪性黒色腫は変異負荷〈tumor mutational burden〉が高く'
         '新生抗原が多いため、この治療がとくによく効く癌種</span>である。'
         '<span class="kw4">副作用は免疫関連有害事象〈irAE〉——'
         '甲状腺機能異常、1型糖尿病、下垂体炎、間質性肺炎、大腸炎、肝炎、'
         '重症皮膚障害</span>で、<span class="kw4">ステロイドによる免疫抑制で対処</span>する。<br>'
         '<span class="kw3">②分子標的薬</span>：'
         '<span class="kw3">約半数の悪性黒色腫にBRAF V600変異があり、'
         'BRAF阻害薬（ベムラフェニブ、ダブラフェニブ）＋MEK阻害薬（トラメチニブ）の併用</span>で'
         '<span class="kw3">高い奏効率が得られる（ただし耐性が生じやすい）</span>。'
         '<span class="kw4">なお日本人に多い末端黒子型・粘膜型ではBRAF変異が少なく、'
         'KIT変異が見られることがある</span>。<br>'
         '<span class="kw3">③手術・その他</span>：'
         '<span class="kw3">根治は依然として外科的切除であり、'
         '薬物療法は切除不能例・転移例・術後補助療法として用いられる</span>。'),
  deep=('📌 代表的な抗体薬と適応（皮膚科と関連するもの）',
        '<table class="tb"><tr><th>標的</th><th>薬剤</th><th>適応</th></tr>'
        '<tr><td><span class="kw3">PD-1</span></td>'
        '<td><span class="kw3">ニボルマブ、ペムブロリズマブ</span></td>'
        '<td><span class="kw3">悪性黒色腫、非小細胞肺癌、腎細胞癌ほか</span></td></tr>'
        '<tr><td>CTLA-4</td><td>イピリムマブ</td><td>悪性黒色腫（PD-1阻害薬と併用）</td></tr>'
        '<tr><td>IL-4/13受容体</td><td>デュピルマブ</td>'
        '<td><span class="kw3">アトピー性皮膚炎、気管支喘息</span></td></tr>'
        '<tr><td>IL-17／IL-17受容体</td><td>セクキヌマブ、ブロダルマブ</td>'
        '<td><span class="kw3">乾癬</span></td></tr>'
        '<tr><td>IL-23（p19）</td><td>グセルクマブ</td><td>乾癬</td></tr>'
        '<tr><td>TNF-α</td><td>インフリキシマブ、アダリムマブ</td>'
        '<td>乾癬、関節リウマチ、Crohn病、Behçet病</td></tr>'
        '<tr><td>IgE</td><td>オマリズマブ</td><td>慢性蕁麻疹、気管支喘息</td></tr>'
        '<tr><td>CCR4</td><td>モガムリズマブ</td>'
        '<td><span class="kw3">ATL、菌状息肉症／Sézary症候群</span></td></tr>'
        '<tr><td>EGFR</td><td>セツキシマブ</td>'
        '<td>大腸癌・頭頸部癌（<span class="kw4">副作用に痤瘡様皮疹</span>）</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 切除不能悪性黒色腫＝<span class="kw3">抗PD-1抗体（ニボルマブ・ペムブロリズマブ）</span>。<br>'
         '② 機序＝<span class="kw3">PD-1/PD-L1の結合を遮断してT細胞の抗腫瘍活性を回復</span>。<br>'
         '③ <span class="kw3">BRAF V600変異例ではBRAF阻害薬＋MEK阻害薬</span>。<br>'
         '④ <span class="kw4">irAE（甲状腺機能異常・1型糖尿病・間質性肺炎・大腸炎）に注意</span>。<br>'
         '⑤ <span class="kw3">IL-17／IL-23＝乾癬、IL-4/13＝アトピー、IgE＝蕁麻疹</span>と混同しない。')),

Q('115F-36', 96, [('bi', '📷')],
  '78歳の男性。頭部の皮疹を主訴に来院した。'
  '<span class="kw">7か月前に頭部に紫紅色斑が出現</span>し、'
  '<span class="kw">次第に拡大、隆起し、出血</span>するようになった。'
  '頭部の写真（A）及び同部の病理組織H-E染色標本（B）を示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '血管肉腫', True, '<span class="kw3">高齢男性の頭部に生じた紫紅色斑が'
                     '7か月で拡大・隆起し易出血性となった</span>——'
                     '<span class="kw3">頭部血管肉腫の典型的な提示</span>である。'
                     '<span class="kw3">病理では、核異型の強い内皮細胞が'
                     '不規則に吻合する血管腔を裏打ちして増殖し、'
                     '既存の膠原線維束の間を解離するように浸潤する（dissecting pattern）</span>。'
                     '<span class="kw3">CD31・CD34・ERG陽性</span>で確定する'
                     '（<span class="kw">Q.159</span>・<span class="kw">Q.187</span>）。'),
   ('b', '基底細胞癌', False, '<span class="kw4">基底細胞癌は黒色光沢のある結節で'
                     '中心が潰瘍化し辺縁が堤防状に隆起</span>する。'
                     '<span class="kw4">紫紅色のびまん性の斑として広がる形はとらない</span>。'
                     '<span class="kw4">病理も柵状配列と裂隙を伴う上皮性腫瘍胞巣</span>であり、'
                     '本例の血管性の増殖像とは全く異なる。'),
   ('c', '海綿状血管腫', False, '<span class="kw4">海綿状血管腫（静脈奇形）は'
                     '拡張した血管腔が海綿状に集まった良性病変</span>で、'
                     '<span class="kw4">多くは出生時〜小児期から存在し、'
                     '柔らかく圧迫で退色（縮小）する青紫色の腫瘤</span>である。'
                     '<span class="kw4">病理では内皮細胞に異型がなく一層で、'
                     '浸潤性増殖もない</span>。'
                     '<span class="kw4">高齢者に新たに出現して7か月で拡大することはない</span>。'),
   ('d', 'グロムス腫瘍', False, '<span class="kw4">グロムス腫瘍は動静脈吻合を調節する'
                     'グロムス小体に由来する良性腫瘍</span>で、'
                     '<span class="kw4">爪下に好発する数mmの青紅色の小結節。'
                     '発作性の強い自発痛・圧痛、寒冷での増悪</span>が特徴。'
                     '<span class="kw4">頭部にびまん性の紫紅色局面を作る疾患ではない</span>。'),
   ('e', '巨細胞性動脈炎〈側頭動脈炎〉', False,
                     '<span class="kw4">巨細胞性動脈炎は高齢者の側頭動脈を主座とする血管炎</span>で、'
                     '<span class="kw4">拍動を触れる索状に腫脹した側頭動脈、側頭部痛、顎跛行、'
                     '赤沈亢進・CRP上昇、リウマチ性多発筋痛症の合併、'
                     '虚血性視神経症による突然の視力障害</span>が特徴である。'
                     '<span class="kw4">「血管に沿った索状の腫脹」であり、'
                     '面として広がる紫紅色斑ではない</span>。'
                     '<span class="kw4">病理は中膜の肉芽腫性炎症と多核巨細胞、内弾性板の破壊</span>で、'
                     '腫瘍性増殖ではない。')],
  '高齢者の頭部の紫紅色斑が数か月で拡大・隆起・出血＋病理で異型内皮細胞の浸潤性増殖＝血管肉腫。',
  imgs=['images/115F-36_1.jpeg', 'images/115F-36_2.jpeg'],
  patho=('🧬 血管肉腫の病理——「血管のかたちをした癌」',
         '<span class="kw3">血管肉腫の病理像は、腫瘍の分化度によって大きく見え方が変わる</span>。'
         '<span class="kw3">分化のよい部分では、不規則に分岐・吻合する血管腔が'
         '既存の膠原線維束を裂くように広がり（dissecting pattern）、'
         'その腔を核の腫大した内皮細胞が裏打ちする</span>。'
         '<span class="kw3">腫瘍細胞は多層化し、腔内へ乳頭状に突出する</span>。'
         '<span class="kw3">低分化な部分では血管腔の形成が乏しく、'
         '紡錘形〜類上皮様の異型細胞がシート状に増殖して'
         '一見「血管の腫瘍」に見えない</span>ことがある。'
         '<span class="kw3">このため免疫染色（CD31・CD34・ERG・第Ⅷ因子関連抗原）が'
         '診断に不可欠</span>である。<br>'
         '<span class="kw3">臨床上の最大の問題は「境界がわからない」こと</span>——'
         '<span class="kw3">肉眼的に正常に見える皮膚にも腫瘍細胞が'
         '既に広がっている（skip lesion）</span>ため、'
         '<span class="kw3">切除しても断端陽性となりやすく局所再発が高率</span>である。'
         '<span class="kw3">このため広範切除に加えて放射線照射（電子線）と'
         'パクリタキセルなどの化学療法を組み合わせる集学的治療</span>が行われるが、'
         '<span class="kw3">5年生存率は10〜20％程度と極めて不良</span>である。<br>'
         '<span class="kw3">転移は早期から起こり、とくに肺転移が多い</span>。'
         '<span class="kw3">肺転移巣は薄壁の嚢胞状になりやすく、'
         '破綻して気胸（しばしば両側性・反復性）を来す</span>のが'
         '本症に特徴的で国試でも問われる（<span class="kw">Q.178</span>）。'),
  deep=('📌 血管系腫瘍・血管奇形の良悪',
        '<table class="tb"><tr><th>疾患</th><th>良悪</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">血管肉腫</span></td><td><span class="kw3">悪性</span></td>'
        '<td><span class="kw3">高齢者の頭部。拡大・隆起・出血。肺転移。予後不良</span></td></tr>'
        '<tr><td>Kaposi肉腫</td><td>悪性（低〜中悪性度）</td>'
        '<td><span class="kw4">HHV-8。古典型は下腿、AIDS関連型は多発</span></td></tr>'
        '<tr><td>血管拡張性肉芽腫</td><td>良性</td>'
        '<td>外傷後の有茎性鮮紅色小結節。易出血だが自己限定的</td></tr>'
        '<tr><td>乳児血管腫（いちご状血管腫）</td><td>良性（腫瘍）</td>'
        '<td><span class="kw3">生後数週から増大→1歳以降に自然消退。'
        '大きければプロプラノロール</span></td></tr>'
        '<tr><td>単純性血管腫（毛細血管奇形）</td><td>良性（奇形）</td>'
        '<td><span class="kw4">出生時から。自然消退しない。'
        '三叉神経第1枝領域ならSturge-Weber症候群</span></td></tr>'
        '<tr><td>海綿状血管腫（静脈奇形）</td><td>良性（奇形）</td>'
        '<td>圧迫で縮小。深部に及ぶ</td></tr>'
        '<tr><td>グロムス腫瘍</td><td>良性</td>'
        '<td><span class="kw4">爪下の青紅色点。発作性疼痛・寒冷で増悪</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 血管肉腫＝<span class="kw3">高齢者頭部の紫紅色斑が拡大・隆起・出血</span>。<br>'
         '② 病理＝<span class="kw3">異型内皮細胞が不規則な血管腔を作り膠原線維を解離して浸潤</span>。<br>'
         '③ 免疫染色＝<span class="kw3">CD31・CD34・ERG陽性</span>。<br>'
         '④ <span class="kw3">境界不明瞭で完全切除困難＝局所再発が高率</span>。<br>'
         '⑤ <span class="kw3">肺転移で気胸を来す。予後は極めて不良</span>。')),

Q('113D-20', 54, [('bi', '📷')],
  '68歳の男性。手背の結節を主訴に来院した。'
  '<span class="kw">3週間前に右手背の3mm大の皮疹に気付いた</span>。'
  '<span class="kw">皮疹が最近2週間で急速に増大</span>してきたため受診した。'
  '右手背に<span class="kw">径12mmの褐色調の腫瘤</span>を認め、'
  '<span class="kw">中央に角栓を伴う</span>。波動はなく弾性硬に触知する。'
  '腫瘤の部分生検では、'
  '<span class="kw">中央が陥凹して角質が充満し、有棘細胞の腫瘍性増殖</span>を認めた。'
  '<span class="kw">腫瘤は生検1か月後にピーク時の25％以下に縮小</span>した。'
  '右手背の写真（A）及び生検組織のH-E染色標本（B）を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '粉　瘤', False, '<span class="kw4">粉瘤〈表皮嚢腫〉は、表皮成分が真皮内に嚢腫を作り'
                     '角質を溜めたもの</span>で、'
                     '<span class="kw4">中央に黒点状の開口部をもつドーム状の皮下腫瘤で波動を触れ、'
                     '圧すると悪臭のある粥状物が出る</span>。'
                     '<span class="kw4">本例は「波動はなく弾性硬」であり、'
                     '病理も嚢腫壁ではなく有棘細胞の腫瘍性増殖</span>で合致しない。'),
   ('b', '基底細胞癌', False, '<span class="kw4">基底細胞癌は顔面正中に好発し、'
                     '数か月〜数年かけて緩徐に増大</span>する。'
                     '<span class="kw4">3週間で3mmから12mmへ急速増大し、'
                     'その後自然縮小する経過はとらない</span>。'
                     '<span class="kw4">病理も柵状配列を伴う基底細胞様胞巣</span>である。'),
   ('c', '有棘細胞癌', False, '<span class="kw4">有棘細胞癌は本症と病理像が酷似し、'
                     '実際に鑑別が最も難しい</span>。'
                     '<span class="kw4">しかし有棘細胞癌は自然消退せず、'
                     '放置すれば増大を続けて潰瘍化・転移する</span>。'
                     '<span class="kw4">本例の「生検1か月後にピーク時の25％以下に縮小」という'
                     '自然消退傾向が決定的にこれを否定</span>する。'
                     '<span class="kw4">なお両者の鑑別は病理でも難しく、'
                     'ケラトアカントーマを高分化型有棘細胞癌の一亜型とみなす考え方もある</span>。'),
   ('d', 'グロムス腫瘍', False, '<span class="kw4">グロムス腫瘍は爪下に好発する数mmの'
                     '青紅色小結節で、発作性の激痛・圧痛・冷水での増悪</span>が主訴となる。'
                     '<span class="kw4">角栓を伴う褐色腫瘤ではなく、'
                     '病理も血管周囲のグロムス細胞の増殖</span>である。'),
   ('e', 'ケラトアカントーマ', True, '<span class="kw3">①高齢者の日光曝露部（手背）、'
                     '②数週間で急速に増大（3mm→12mm）、'
                     '③中央に角栓を伴うドーム状・火口状の結節、'
                     '④病理で中央が陥凹して角質が充満し、'
                     '有棘細胞が増殖する「crateriform architecture」、'
                     '⑤経過中に自然縮小</span>——'
                     '<span class="kw3">ケラトアカントーマ〈keratoacanthoma〉</span>の'
                     '典型的な三相性（急速増殖期→静止期→退縮期）の経過である。')],
  '数週間で急速に増大し、中央に角栓をもつ火口状結節が、その後自然縮小＝ケラトアカントーマ。有棘細胞癌と病理が酷似するのが要注意。',
  imgs=['images/113D-20_1.jpeg', 'images/113D-20_2.jpeg'],
  patho=('🧬 ケラトアカントーマ——「速く育ち、勝手に消える」腫瘍',
         '<span class="kw3">ケラトアカントーマは、毛包漏斗部由来と考えられる'
         '角化性の腫瘍で、急速増大→静止→自然消退という三相性の経過をとる</span>。'
         '<span class="kw3">高齢者の日光曝露部（顔面・鼻・頬・手背・前腕）に好発</span>し、'
         '<span class="kw3">紫外線、外傷、HPV、免疫抑制、化学発癌物質</span>が誘因として挙げられる。<br>'
         '<span class="kw3">経過の3相</span>——'
         '<span class="kw3">①増殖期（数週間）：数mmの丘疹が2〜8週で1〜2cmへ急速に増大し、'
         '中央に角栓を詰めた火口状〈crateriform〉のドーム状結節となる。'
         '②静止期（数週〜数か月）：大きさが変わらない。'
         '③退縮期（数か月）：角栓が脱落し、萎縮性の瘢痕を残して消退する</span>。<br>'
         '<span class="kw3">病理は、中央の大きな角質充満腔を、'
         '増殖した高分化な有棘細胞が左右から取り囲む'
         '（口唇状に張り出す＝lipping／buttressing）</span>という'
         '<span class="kw3">「建築構造」で見るのが特徴</span>で、'
         '<span class="kw4">細胞レベルの異型だけを見ると高分化有棘細胞癌と区別がつかない</span>。'
         '<span class="kw4">このため「病変全体の構築を評価できる全切除標本」で診断すべき</span>とされ、'
         '<span class="kw4">部分生検では確定できないことがある</span>。<br>'
         '<span class="kw3">臨床的な扱い</span>——'
         '<span class="kw3">自然消退するとはいえ、'
         '①有棘細胞癌との鑑別が困難、②消退後に醜い瘢痕を残す、'
         '③まれに浸潤・転移する例の報告がある、という理由から'
         '実地では外科的切除が選択される</span>ことが多い。'),
  deep=('📌 「急速に増大する皮膚腫瘤」の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>速さ</th><th>手がかり</th></tr>'
        '<tr><td><span class="kw3">ケラトアカントーマ</span></td>'
        '<td><span class="kw3">数週間で1〜2cm</span></td>'
        '<td><span class="kw3">中央の角栓・火口状。自然消退する</span></td></tr>'
        '<tr><td>血管拡張性肉芽腫</td><td>数週間</td>'
        '<td><span class="kw4">外傷契機・有茎性の鮮紅色・易出血</span></td></tr>'
        '<tr><td>Merkel細胞癌</td><td>数週〜数か月</td>'
        '<td><span class="kw4">高齢者の露光部、赤〜紫紅色のドーム状で無痛性。転移が早い</span></td></tr>'
        '<tr><td>有棘細胞癌</td><td>数か月</td>'
        '<td><span class="kw3">角化・潰瘍・悪臭。消退しない</span></td></tr>'
        '<tr><td>粉瘤（炎症性）</td><td>数日（感染時）</td>'
        '<td><span class="kw4">中央の黒点、波動、圧痛、悪臭のある内容</span></td></tr>'
        '<tr><td>癤（せつ）</td><td>数日</td><td>発赤・熱感・強い圧痛。膿栓</td></tr></table>'
        '<span class="kw3">「速い」だけでは良悪は決まらない</span>。'
        '<span class="kw3">ケラトアカントーマは速いが良性寄り、'
        'Merkel細胞癌は速くて悪性、基底細胞癌は遅いが悪性</span>——'
        '<span class="kw3">速度と良悪は独立</span>と理解する。'),
  point=('🎯 国試ポイント',
         '① ケラトアカントーマ＝<span class="kw3">数週で急速増大→静止→自然消退の三相性</span>。<br>'
         '② 形態＝<span class="kw3">中央に角栓を詰めた火口状のドーム状結節</span>。露光部（手背・顔面）。<br>'
         '③ <span class="kw4">病理は高分化有棘細胞癌と酷似</span>——構築（全体像）で判断する。<br>'
         '④ <span class="kw3">自然消退を待たず切除するのが実地の対応</span>（鑑別困難・瘢痕）。<br>'
         '⑤ <span class="kw3">「自然に小さくなった」という経過が有棘細胞癌を否定する根拠</span>。')),

Q('112A-22', 30, [('bi', '📷')],
  '75歳の男性。頭部の皮疹を主訴に来院した。'
  '<span class="kw">皮疹は3か月前に同部位を打撲した後に出現</span>し、'
  '<span class="kw">徐々に拡大して、わずかな刺激で出血</span>するようになってきた。頭部の写真を示す。<br>'
  '<strong>この疾患について正しいのはどれか。</strong>',
  [('a', '肺転移しやすい。', True, '<span class="kw3">本例は頭部血管肉腫である。'
                     '血管肉腫は早期から血行性に転移し、とくに肺転移が高頻度</span>である。'
                     '<span class="kw3">肺転移巣は薄壁の嚢胞状病変となりやすく、'
                     '破綻して気胸（両側性・反復性のことがある）を来す</span>のが'
                     '本症に特徴的な所見として知られる。'
                     '<span class="kw3">診断時には胸部CTによる肺転移の検索が必須</span>である。'),
   ('b', '生検は禁忌である。', False, '<span class="kw4">生検は禁忌ではなく、'
                     'むしろ確定診断のために必須</span>である。'
                     '<span class="kw4">血管肉腫は「打撲後の血腫」「老人性紫斑」と誤認されて'
                     '診断が遅れることが最大の問題</span>であり、'
                     '<span class="kw4">疑った時点で速やかに生検して免疫染色（CD31・CD34）で'
                     '確定する</span>ことが求められる。'
                     '易出血性のため止血に配慮する必要はあるが、禁忌という根拠はない。'),
   ('c', 'HIV感染と関連がある。', False, '<span class="kw4">HIV感染と関連する血管系腫瘍は'
                     'Kaposi肉腫</span>である。'
                     '<span class="kw4">Kaposi肉腫はヒトヘルペスウイルス8型〈HHV-8〉が原因で、'
                     'AIDS関連型では顔面・体幹・口腔粘膜に多発する紫紅色の斑・結節</span>を来す。'
                     '<span class="kw4">血管肉腫はウイルス関連ではない</span>。'),
   ('d', '九州・沖縄地方に多い。', False, '<span class="kw4">九州・沖縄地方に多いのは'
                     'HTLV-1関連の成人T細胞白血病リンパ腫〈ATL〉</span>である。'
                     '<span class="kw4">血管肉腫に地域集積性はない</span>。'
                     'ATLの皮膚病変は紅斑・丘疹・結節・紅皮症と多彩で、'
                     '<span class="kw4">末梢血のflower cell、高Ca血症、'
                     '抗HTLV-1抗体陽性</span>で診断する。'),
   ('e', 'レーザー治療が著効する。', False, '<span class="kw4">レーザー治療が有効なのは、'
                     '単純性血管腫（色素レーザー）・太田母斑や異所性蒙古斑（Qスイッチレーザー）などの'
                     '良性の色素・血管病変</span>である。'
                     '<span class="kw4">悪性腫瘍にレーザーを当てても腫瘍細胞は残り、'
                     '病理標本も得られないため有害</span>である。'
                     '<span class="kw4">血管肉腫の治療は広範切除＋放射線＋化学療法の集学的治療</span>。')],
  '頭部血管肉腫は早期から肺転移し、嚢胞状の転移巣が破れて気胸を来す。「打撲後の血腫」と誤認されやすいので生検が必要。',
  imgs=['images/112A-22_1.jpeg'],
  patho=('🧬 血管肉腫の転移と予後——「打撲のせい」で片付けない',
         '<span class="kw3">本例で「3か月前に打撲した」という病歴があるが、'
         '打撲は血管肉腫の原因ではなく、'
         '「打撲したからこのあざができた」と患者も医療者も納得してしまう'
         '＝診断が遅れる罠</span>である。'
         '<span class="kw3">打撲による皮下出血なら1〜2週で色調が変化して消退する。'
         '3か月かけて拡大し、易出血性になるのは腫瘍の経過</span>である。<br>'
         '<span class="kw3">血管肉腫の転移</span>——'
         '<span class="kw3">腫瘍細胞が血管内皮そのものであるため、'
         '早期から血行性転移を来す。最も多いのは肺転移</span>で、'
         '<span class="kw3">画像上は結節影のほか、薄壁の嚢胞・空洞として現れることがあり、'
         'これが破綻して気胸・血胸を起こす</span>。'
         '<span class="kw3">「高齢者の反復する気胸＋頭部の紫紅色病変」という組合せは'
         '血管肉腫を示唆する</span>。'
         '<span class="kw3">その他、リンパ節・肝・骨・脳への転移もみられる</span>。<br>'
         '<span class="kw3">治療と予後</span>——'
         '<span class="kw3">境界不明瞭で完全切除が難しいため、'
         '広範切除＋術後放射線（電子線）＋パクリタキセルを中心とした化学療法</span>を'
         '組み合わせる。'
         '<span class="kw3">それでも局所再発・遠隔転移が高率で、'
         '5年生存率は10〜20％程度</span>と皮膚悪性腫瘍のなかでも際立って不良である。'
         '<span class="kw4">本問の正答率が30％と低いのは、'
         '「Kaposi肉腫（HIV）」「ATL（九州沖縄）」といった'
         '他疾患のキーワードに引かれるため</span>と考えられる。'
         '<span class="kw3">まず病変から診断を確定し、'
         'それから各選択肢を当てはめる順序を守ること</span>。'),
  deep=('📌 紛らわしい「地域性・ウイルス関連」の皮膚疾患',
        '<table class="tb"><tr><th>疾患</th><th>関連因子</th><th>皮膚所見</th></tr>'
        '<tr><td><span class="kw3">血管肉腫</span></td>'
        '<td><span class="kw3">なし（高齢・頭部／リンパ浮腫／放射線）</span></td>'
        '<td><span class="kw3">頭部の紫紅色斑→隆起・出血。肺転移</span></td></tr>'
        '<tr><td><span class="kw3">Kaposi肉腫</span></td>'
        '<td><span class="kw3">HHV-8、HIV感染・免疫抑制</span></td>'
        '<td>紫紅色の斑・局面・結節。多発。口腔粘膜にも</td></tr>'
        '<tr><td><span class="kw3">成人T細胞白血病リンパ腫</span></td>'
        '<td><span class="kw3">HTLV-1、九州・沖縄</span></td>'
        '<td>紅斑・丘疹・結節・紅皮症。<span class="kw4">高Ca血症・flower cell</span></td></tr>'
        '<tr><td>Merkel細胞癌</td><td>Merkel細胞ポリオーマウイルス、免疫抑制</td>'
        '<td>高齢者露光部の赤紫色ドーム状結節。転移が早い</td></tr>'
        '<tr><td>Bowen様丘疹症</td><td>HPV16など</td><td>外陰部の褐色扁平丘疹</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 血管肉腫は<span class="kw3">早期から肺転移。嚢胞状転移が破れて気胸</span>。<br>'
         '② <span class="kw4">「打撲後のあざが消えない」は血管肉腫を疑う病歴</span>。生検は禁忌でない。<br>'
         '③ <span class="kw4">HIV／HHV-8＝Kaposi肉腫、九州沖縄＝ATL</span>と混同しない。<br>'
         '④ <span class="kw4">悪性腫瘍にレーザーは行わない</span>。<br>'
         '⑤ 治療＝<span class="kw3">広範切除＋放射線＋化学療法。予後は極めて不良</span>。')),

]

QUESTIONS += [

Q('110I-27', 85, [],
  '<strong>有棘細胞癌を発症しやすい疾患はどれか。</strong>',
  [('a', '硬結性紅斑', False, '<span class="kw4">硬結性紅斑〈Bazin硬結性紅斑〉は、'
                     '結核菌に対するアレルギー反応による結核疹の一型</span>で、'
                     '<span class="kw4">若い女性の下腿後面に、疼痛を伴う皮下結節が生じ、'
                     '潰瘍化して瘢痕を残す</span>。'
                     '<span class="kw4">悪性化しやすい疾患ではない</span>。'),
   ('b', '膿疱性乾癬', False, '<span class="kw4">膿疱性乾癬は、発熱・全身の紅斑上に'
                     '無菌性膿疱が多発し、全身状態が悪化しうる重症型の乾癬</span>である。'
                     '<span class="kw4">難治で生物学的製剤の適応となるが、'
                     '有棘細胞癌の素地にはならない</span>。'
                     '<span class="kw4">なお乾癬に対するPUVA療法を長期・大量に行った場合には'
                     '皮膚癌のリスクが上がる</span>が、疾患自体が発癌するわけではない。'),
   ('c', '毛孔性苔癬', False, '<span class="kw4">毛孔性苔癬〈毛孔性角化症〉は、'
                     '上腕外側・大腿・頬に生じる毛孔一致性の小さな角化性丘疹</span>で、'
                     '<span class="kw4">思春期に目立ち加齢とともに軽快する体質的な変化</span>。'
                     '<span class="kw4">悪性化しない</span>。'),
   ('d', '壊疽性膿皮症', False, '<span class="kw4">壊疽性膿皮症は、辺縁が穿掘性・堤防状で'
                     '紫紅色を呈する有痛性の潰瘍</span>で、'
                     '<span class="kw4">炎症性腸疾患・関節リウマチ・血液疾患に随伴</span>する。'
                     '<span class="kw4">慢性の潰瘍という点では発癌の素地になりうるが、'
                     '「有棘細胞癌を発症しやすい疾患」として典型的に挙げられるものではない</span>。'
                     '<span class="kw4">むしろ有棘細胞癌の潰瘍が壊疽性膿皮症と誤診される</span>ことがある。'),
   ('e', '色素性乾皮症', True, '<span class="kw3">色素性乾皮症〈XP〉は、'
                     '紫外線によるDNA損傷を修復するヌクレオチド除去修復の欠損により、'
                     '若年から露光部に有棘細胞癌・基底細胞癌・悪性黒色腫が多発</span>する'
                     '常染色体潜性〈劣性〉遺伝疾患である。'
                     '<span class="kw3">皮膚癌の発生率は健常人の千倍以上、'
                     '発症年齢の中央値は10歳未満〜10歳代</span>と極めて早い'
                     '（<span class="kw">Q.172</span>）。'
                     '<span class="kw3">徹底した遮光が唯一の予防手段</span>である。')],
  '色素性乾皮症はDNA修復欠損により若年から露光部に有棘細胞癌・基底細胞癌・悪性黒色腫が多発する。',
  patho=('🧬 有棘細胞癌のリスクが高い病態を一望する',
         '<span class="kw3">有棘細胞癌は「角化細胞のDNAが繰り返し傷つく状況」で生じる</span>。'
         '<span class="kw3">その状況は4つに整理できる</span>。<br>'
         '<span class="kw3">①DNAが傷つきやすい／修復できない</span>：'
         '<span class="kw3">色素性乾皮症（NERの欠損）、'
         '長年の紫外線曝露（日光角化症を経て）、慢性ヒ素中毒、'
         '慢性放射性皮膚炎</span>。<br>'
         '<span class="kw3">②慢性の炎症・組織破壊と再生が続く</span>：'
         '<span class="kw3">熱傷瘢痕（Marjolin潰瘍）、慢性膿皮症・瘻孔、褥瘡、'
         '尋常性狼瘡（皮膚結核）、慢性円板状エリテマトーデス、'
         '栄養障害型表皮水疱症（若年から手足に多発し予後を規定する）</span>。<br>'
         '<span class="kw3">③発癌ウイルスの持続感染</span>：'
         '<span class="kw3">HPV（外陰・肛囲のBowen病／扁平上皮癌、'
         '疣贅状表皮発育異常症）</span>。<br>'
         '<span class="kw3">④免疫監視の低下</span>：'
         '<span class="kw3">臓器移植後の免疫抑制薬長期投与（健常人の数十〜百倍）、'
         'HIV感染、長期のPUVA療法</span>。<br>'
         '<span class="kw3">この4分類に照らせば、'
         '硬結性紅斑・膿疱性乾癬・毛孔性苔癬はいずれも当てはまらない</span>ことが分かる。'
         '<span class="kw3">色素性乾皮症は①の代表であり、'
         'しかも「若年発症」「多発」という点で群を抜いている</span>。'),
  deep=('📌 遺伝性疾患と皮膚悪性腫瘍',
        '<table class="tb"><tr><th>疾患</th><th>遺伝形式</th><th>皮膚腫瘍</th></tr>'
        '<tr><td><span class="kw3">色素性乾皮症</span></td>'
        '<td><span class="kw3">常染色体潜性</span></td>'
        '<td><span class="kw3">有棘細胞癌・基底細胞癌・悪性黒色腫が若年から多発</span></td></tr>'
        '<tr><td>母斑基底細胞癌症候群〈Gorlin症候群〉</td><td>常染色体顕性（PTCH1）</td>'
        '<td><span class="kw3">多発性基底細胞癌、掌蹠の小陥凹、顎骨嚢胞、大脳鎌の石灰化</span></td></tr>'
        '<tr><td>栄養障害型表皮水疱症</td><td>常染色体潜性／顕性（COL7A1）</td>'
        '<td><span class="kw4">慢性びらん部からの有棘細胞癌（予後規定因子）</span></td></tr>'
        '<tr><td>疣贅状表皮発育異常症</td><td>常染色体潜性</td>'
        '<td>HPV関連の扁平疣贅様病変から有棘細胞癌</td></tr>'
        '<tr><td>Muir-Torre症候群</td><td>常染色体顕性（ミスマッチ修復）</td>'
        '<td>脂腺腫瘍・ケラトアカントーマ＋大腸癌</td></tr>'
        '<tr><td>Cowden病</td><td>常染色体顕性（PTEN）</td>'
        '<td>外毛根鞘腫・口腔粘膜の乳頭腫＋乳癌・甲状腺癌</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 色素性乾皮症＝<span class="kw3">DNA修復欠損。若年から露光部に皮膚癌が多発</span>。<br>'
         '② 有棘細胞癌のリスク＝<span class="kw3">紫外線・慢性瘢痕／潰瘍・放射線・ヒ素・HPV・免疫抑制</span>。<br>'
         '③ <span class="kw3">臓器移植後は有棘細胞癌が数十倍</span>——定期的な皮膚チェックが要る。<br>'
         '④ <span class="kw3">栄養障害型表皮水疱症では有棘細胞癌が予後を決める</span>。<br>'
         '⑤ <span class="kw4">毛孔性苔癬・硬結性紅斑・膿疱性乾癬は発癌素地ではない</span>。')),

Q('109A-3', 41, [('bc', 'CBT')],
  '<strong>悪性黒色腫について正しいのはどれか。</strong>',
  [('a', '放射線感受性が高い。', False, '<span class="kw4">悪性黒色腫は伝統的に'
                     '放射線感受性が低い腫瘍とされる</span>。'
                     '<span class="kw4">放射線は切除不能例・骨転移や脳転移の症状緩和・'
                     'リンパ節郭清後の局所制御など補助的に用いられるにとどまり、'
                     '根治手段は外科的切除</span>である。'),
   ('b', '日本人では結節型が多い。', False, '<span class="kw4">日本人で最も多いのは'
                     '末端黒子型〈acral lentiginous melanoma〉で約半数を占める</span>。'
                     '<span class="kw4">足底・足趾・爪部・手掌に生じ、紫外線とは無関係</span>である。'
                     '<span class="kw4">結節型は初めから垂直方向に増殖し予後不良だが、'
                     '頻度としては末端黒子型に及ばない</span>。'
                     '<span class="kw4">白人で最多なのは表在拡大型</span>である。'),
   ('c', '部分生検によって診断する。', False, '<span class="kw4">悪性黒色腫の生検は'
                     '原則として全切除生検（狭いマージンで病変全体を一括切除）</span>で行う。'
                     '<span class="kw4">部分生検では腫瘍の最も厚い部分を外す可能性があり、'
                     'Breslow厚を過小評価して病期・治療方針を誤る</span>。'
                     '<span class="kw4">巨大病変や顔面・掌蹠など全切除が困難な部位では'
                     'やむを得ず部分生検を行うことがある</span>が、'
                     '「部分生検によって診断する」を原則とは言えない。'),
   ('d', 'TNM病期分類のpTは原発巣の大きさで判定する。', False,
                     '<span class="kw4">悪性黒色腫のpTは「大きさ（面積・直径）」ではなく'
                     '腫瘍の厚さ〈Breslow thickness〉と潰瘍の有無で決まる</span>。'
                     '<span class="kw4">水平方向にどれだけ広がっていても、'
                     '薄ければ予後はよい</span>——'
                     '<span class="kw4">これが他の多くの癌（大きさでTを決める）と'
                     '決定的に異なる点</span>である（<span class="kw">Q.162</span>）。'),
   ('e', 'センチネルリンパ節生検はリンパ節郭清の適応決定に有用である。', True,
                     '<span class="kw3">正しい。センチネルリンパ節〈sentinel lymph node〉とは、'
                     '原発巣から流れるリンパが最初に到達するリンパ節</span>である。'
                     '<span class="kw3">色素とラジオアイソトープで同定して摘出し、'
                     '転移の有無を病理で調べる</span>。'
                     '<span class="kw3">陰性なら以遠のリンパ節にも転移はないと判断でき、'
                     '不要な郭清（リンパ浮腫などの合併症を伴う）を回避できる</span>。'
                     '<span class="kw3">陽性なら郭清や薬物療法を検討する</span>——'
                     '<span class="kw3">つまり「病期診断と治療方針の決定」のための検査</span>である。')],
  'センチネルリンパ節生検は郭清の適応を決めるための病期診断。pTは大きさでなく腫瘍厚で決まり、日本人は末端黒子型が最多、生検は全切除が原則。',
  patho=('🧬 センチネルリンパ節生検——「郭清すべきかを決める」ための検査',
         '<span class="kw3">リンパ節郭清は、リンパ浮腫・神経損傷・創部合併症といった'
         '長期的な負担を伴う侵襲的な処置</span>である。'
         '<span class="kw3">一方で、転移があるのに郭清しなければ再発・進行を招く</span>。'
         '<span class="kw3">この「やるべきか、やらざるべきか」を判断する材料が'
         'センチネルリンパ節生検</span>である。<br>'
         '<span class="kw3">手技</span>：'
         '<span class="kw3">原発巣周囲にラジオアイソトープ（テクネチウム標識コロイド）と'
         '色素（インドシアニングリーン等）を注入し、'
         'リンパ流を追ってガンマプローブ・蛍光で最初に染まるリンパ節を同定し摘出、'
         '術中迅速あるいは永久標本で転移を評価</span>する。<br>'
         '<span class="kw3">悪性黒色腫での適応</span>：'
         '<span class="kw3">概ね腫瘍厚0.8mm以上、または厚さにかかわらず潰瘍を伴う例</span>で、'
         '<span class="kw3">臨床的に触知するリンパ節がない（cN0）ことが前提</span>。'
         '<span class="kw4">既に触知できるリンパ節があるなら、'
         'それは臨床的転移であってセンチネル生検の対象ではなく、'
         '直接郭清・薬物療法を検討する</span>。<br>'
         '<span class="kw3">意義の整理</span>：'
         '<span class="kw3">①正確な病期分類（予後予測）、'
         '②不要な郭清の回避、③術後補助療法（免疫チェックポイント阻害薬等）の'
         '適応判断</span>。'
         '<span class="kw4">「診断のため」ではない</span>——'
         '<span class="kw4">原発巣の悪性黒色腫という診断は、'
         '既に切除生検の病理でついている</span>（<span class="kw">Q.162</span>）。<br>'
         '<span class="kw3">なおセンチネルリンパ節生検は乳癌でも同じ論理で用いられる</span>。'),
  deep=('📌 悪性黒色腫の要点を一つの表に',
        '<table class="tb"><tr><th>項目</th><th>正しい理解</th><th>よくある誤り</th></tr>'
        '<tr><td>日本人の最多病型</td><td><span class="kw3">末端黒子型（足底・爪）</span></td>'
        '<td><span class="kw4">結節型／表在拡大型</span></td></tr>'
        '<tr><td>生検</td><td><span class="kw3">全切除生検が原則</span></td>'
        '<td><span class="kw4">部分生検で診断</span></td></tr>'
        '<tr><td>pTの決定</td><td><span class="kw3">腫瘍厚（Breslow）＋潰瘍の有無</span></td>'
        '<td><span class="kw4">腫瘍の大きさ（直径）</span></td></tr>'
        '<tr><td>放射線</td><td><span class="kw3">感受性は低い（補助的）</span></td>'
        '<td><span class="kw4">放射線が第一選択</span></td></tr>'
        '<tr><td>センチネル生検</td><td><span class="kw3">郭清の適応決定＝病期診断</span></td>'
        '<td><span class="kw4">診断（悪性かどうかの判定）のため</span></td></tr>'
        '<tr><td>切除マージン</td><td><span class="kw3">腫瘍厚に応じて0.5〜2cm</span></td>'
        '<td><span class="kw4">一律に広く切る</span></td></tr></table>'
        '<span class="kw4">本問の正答率41％は、'
        '「pTは大きさで決まる」というほかの癌の常識に引きずられたため</span>と考えられる。'),
  point=('🎯 国試ポイント',
         '① センチネルリンパ節生検＝<span class="kw3">郭清の適応を決める病期診断</span>。'
         '診断のためではない。<br>'
         '② <span class="kw3">pTは腫瘍厚（Breslow）と潰瘍の有無で決まる</span>。大きさではない。<br>'
         '③ <span class="kw3">日本人は末端黒子型が最多</span>。<br>'
         '④ <span class="kw3">生検は全切除が原則</span>（厚さを正確に測るため）。<br>'
         '⑤ <span class="kw4">放射線感受性は低い</span>。根治は外科的切除。')),

Q('109D-24', 95, [('bi', '📷')],
  '67歳の男性。<span class="kw">陰部の痒み</span>を主訴に来院した。'
  '<span class="kw">3年前から右陰囊に痒みを伴う皮疹</span>が出現し、'
  '<span class="kw">市販の外用薬で治療</span>していたが、'
  '<span class="kw">次第に拡大</span>してきたため受診した。'
  '陰囊と陰茎の写真（A）と生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '血管肉腫', False, '<span class="kw4">血管肉腫は高齢者の頭部・顔面に好発する'
                     '紫紅色の斑・局面</span>で、'
                     '<span class="kw4">陰部に生じることはまれ</span>。'
                     '<span class="kw4">病理も異型内皮細胞による血管腔の増殖</span>であり、'
                     '表皮内に散在する大型細胞という像ではない。'),
   ('b', 'Bowen病', False, '<span class="kw4">Bowen病は陰部にも生じうる表皮内癌で、'
                     '臨床的には本症と紛らわしい</span>。'
                     'しかし<span class="kw4">病理は「表皮全層にわたる有棘細胞の異型」＝'
                     '細胞は表皮の細胞として連続的に配列し、'
                     '核が大小不同で極性を失い、異常角化細胞や多核細胞が混じる</span>。'
                     '<span class="kw4">明るい胞体をもつ大型細胞が孤在性に散らばる像ではない</span>。'
                     '<span class="kw4">免疫染色でもBowen病はCK7陰性・PAS陰性</span>で区別できる。'),
   ('c', '基底細胞癌', False, '<span class="kw4">基底細胞癌は顔面正中に好発し、'
                     '陰囊はきわめてまれ</span>。'
                     '<span class="kw4">黒色調で中心が潰瘍化した結節を作り、'
                     '病理は柵状配列と裂隙を伴う腫瘍胞巣</span>である。'),
   ('d', '悪性黒色腫', False, '<span class="kw4">悪性黒色腫なら黒色調が主体で、'
                     '病理では異型メラノサイトの増殖とメラニン顆粒</span>を認め、'
                     '<span class="kw4">S-100・HMB-45・Melan-A陽性</span>を示す。'
                     '<span class="kw4">本例は紅色局面であり合致しない</span>。'
                     'ただし<span class="kw4">乳房外Paget病のPaget細胞にメラニンが取り込まれ'
                     '色素性に見える例（pigmented EMPD）があり、'
                     'このとき免疫染色（CK7陽性／S-100陰性）が決め手</span>になる。'),
   ('e', '乳房外Paget病', True, '<span class="kw3">①高齢男性の陰囊、'
                     '②3年にわたり市販薬で治療されても治らず緩徐に拡大、'
                     '③痒みを伴う境界明瞭な紅色局面、'
                     '④病理で表皮内に明るく広い胞体と大型核をもつ細胞が'
                     '孤在性・胞巣状に散在（pagetoid spread）</span>——'
                     '<span class="kw3">乳房外Paget病</span>の典型像である。'
                     '<span class="kw3">PAS陽性・CK7陽性・CEA陽性、S-100陰性</span>で確定する'
                     '（<span class="kw">Q.155</span>・<span class="kw">Q.190</span>）。')],
  '高齢男性の陰囊で「市販薬で治らない痒い皮疹」が3年かけて拡大＋病理でPaget細胞の表皮内散在＝乳房外Paget病。',
  imgs=['images/109D-24_1.jpeg', 'images/109D-24_2.jpeg'],
  patho=('🧬 陰部の乳房外Paget病——Bowen病との病理学的な切り分け',
         '<span class="kw3">陰部に生じる表皮内癌は、'
         '乳房外Paget病（腺系）とBowen病（扁平上皮系）の2つが双璧</span>で、'
         '<span class="kw3">臨床像だけでは区別できないことが多い</span>。'
         '<span class="kw3">両者はいずれも「境界明瞭で緩徐に拡大する紅褐色局面」として現れ、'
         '湿疹・白癬・カンジダとして長期に外用治療される</span>。<br>'
         '<span class="kw3">病理での違い</span>——'
         '<span class="kw3">【乳房外Paget病】表皮内に、周囲の角化細胞より'
         '明らかに大きく、胞体が淡明〜好酸性で広く、核が大型で偏在する細胞'
         '（Paget細胞）が、単独あるいは小胞巣を作って散在する。'
         '基底層側に多いが表皮上層にも上がっていく（pagetoid spread）。'
         '周囲の角化細胞は正常</span>。'
         '<span class="kw3">【Bowen病】表皮を構成する角化細胞そのものが'
         '全層にわたって異型を示す。'
         '核の大小不同・過染・極性の消失、分裂像、'
         '異常角化細胞〈dyskeratotic cell〉、多核細胞</span>。'
         '<span class="kw3">「異物のような大型細胞が混ざる」のがPaget病、'
         '「もともとの細胞が全部おかしい」のがBowen病</span>と捉えると分かりやすい。<br>'
         '<span class="kw3">免疫染色・特殊染色</span>——'
         '<span class="kw3">乳房外Paget病：PAS陽性（粘液）、CK7陽性、CEA陽性、'
         'GCDFP-15陽性、S-100陰性、HMB-45陰性。'
         'Bowen病：CK7陰性、PAS陰性、p63・高分子CK陽性</span>。'
         '<span class="kw3">悪性黒色腫との鑑別にはS-100・HMB-45・Melan-A</span>を用いる。<br>'
         '<span class="kw3">治療はいずれも切除だが、'
         '乳房外Paget病は境界を越えて進展するため'
         'マッピング生検＋広いマージンが必要</span>という点で異なる'
         '（<span class="kw">Q.170</span>）。'),
  deep=('📌 「表皮内に大型の異細胞が散在する」病変＝pagetoid pattern',
        '<table class="tb"><tr><th>疾患</th><th>散在する細胞</th><th>免疫染色</th></tr>'
        '<tr><td><span class="kw3">乳房外Paget病／乳房Paget病</span></td>'
        '<td><span class="kw3">Paget細胞（腺系）</span></td>'
        '<td><span class="kw3">CK7＋、CEA＋、PAS＋、S-100−</span></td></tr>'
        '<tr><td>表在拡大型悪性黒色腫（pagetoid melanoma）</td>'
        '<td>異型メラノサイト</td>'
        '<td><span class="kw3">S-100＋、HMB-45＋、Melan-A＋、CK7−</span></td></tr>'
        '<tr><td>Bowen病（pagetoid型）</td><td>異型角化細胞</td>'
        '<td>高分子CK＋、CK7−</td></tr>'
        '<tr><td>菌状息肉症（Pautrier微小膿瘍）</td><td>異型T細胞</td>'
        '<td><span class="kw3">CD3＋、CD4＋、CK−</span></td></tr>'
        '<tr><td>Langerhans細胞組織球症</td><td>Langerhans細胞</td>'
        '<td>S-100＋、CD1a＋、Langerin＋</td></tr></table>'
        '<span class="kw3">「表皮内に散らばる大型細胞」を見たら、'
        'この5つを免疫染色で切り分ける</span>のが病理の実際である。'),
  point=('🎯 国試ポイント',
         '① 乳房外Paget病＝<span class="kw3">高齢者の外陰・肛囲・腋窩の「治らない湿疹」</span>。<br>'
         '② 病理＝<span class="kw3">明るい胞体の大型Paget細胞が表皮内に散在（pagetoid spread）</span>。<br>'
         '③ <span class="kw3">Bowen病は「角化細胞自体が全層で異型」</span>——細胞の由来が違う。<br>'
         '④ 免疫染色＝<span class="kw3">CK7・CEA・PAS陽性／S-100陰性</span>。<br>'
         '⑤ 治療＝<span class="kw3">マッピング生検＋広範切除</span>（再発しやすい）。')),

Q('108I-61', 75, [('bi', '📷')],
  '65歳の男性。左内眼角部の結節を主訴に来院した。'
  '<span class="kw">3年前から左内眼角部に小結節が出現し、徐々に増大</span>した。'
  '初診時、左内眼角部に<span class="kw">直径1cm、高さ2mmの結節</span>がみられた。'
  '<span class="kw">頸部リンパ節は触知しない</span>。'
  '<span class="kw">結節を辺縁から5mm離して切除</span>した。'
  '内眼角部の写真（A）、ダーモスコピーの写真（B）および摘出組織のH-E染色標本（C）を示す。'
  '<span class="kw">病理学的に切除断端に病変は認められなかった</span>。<br>'
  '<strong>切除後の対応として適切なのはどれか。</strong>',
  [('a', '温熱療法', False, '<span class="kw4">温熱療法は皮膚悪性腫瘍の標準治療ではない</span>。'
                     '完全切除後に追加する根拠はまったくない。'),
   ('b', '拡大切除', False, '<span class="kw4">拡大切除が必要なのは断端陽性の場合</span>である。'
                     '<span class="kw4">本例は5mmマージンで断端陰性が確認されており、'
                     '追加切除は不要</span>。'
                     '<span class="kw4">内眼角部は整容・機能上の制約が大きい部位</span>であり、'
                     '不要な追加切除は避けるべきである。'),
   ('c', '経過観察', True, '<span class="kw3">臨床像（内眼角部の黒色光沢のある結節）、'
                     'ダーモスコピー（樹枝状血管・青灰色類円形胞巣）、'
                     '病理（柵状配列と裂隙を伴う基底細胞様腫瘍胞巣）から基底細胞癌</span>である。'
                     '<span class="kw3">基底細胞癌は遠隔転移をほぼ来さず、'
                     '断端陰性で切除できていれば追加治療は不要</span>。'
                     '<span class="kw3">内眼角部はH-zoneと呼ばれる再発高リスク部位</span>なので、'
                     '<span class="kw3">局所再発と新規病変の監視のための定期的な経過観察</span>を行う'
                     '（<span class="kw">Q.157</span>）。'),
   ('d', '電子線照射', False, '<span class="kw4">放射線は手術困難例・断端陽性で追加切除できない例に'
                     '限って考慮する</span>。'
                     '<span class="kw4">完全切除後の予防照射に意義はなく、'
                     '眼周囲では白内障・角膜障害・涙道障害などの'
                     '有害事象リスクがある</span>ため避けるべきである。'),
   ('e', '抗癌化学療法', False, '<span class="kw4">化学療法・分子標的薬（ヘッジホッグ阻害薬）は'
                     '切除不能な局所進行例や転移例に限られる</span>。'
                     '<span class="kw4">完全切除された基底細胞癌に'
                     '術後補助化学療法を行う根拠はない</span>。')],
  '内眼角部の基底細胞癌を5mmマージンで切除し断端陰性＝追加治療不要。H-zoneは再発しやすいので経過観察は続ける。',
  imgs=['images/108I-61_1.jpeg', 'images/108I-61_2.jpeg', 'images/108I-61_3.jpeg'],
  patho=('🧬 基底細胞癌の「高リスク部位」と再発——H-zoneという考え方',
         '<span class="kw3">基底細胞癌は転移しないが、切除が不十分だと局所再発する</span>。'
         '<span class="kw3">再発リスクは「部位・組織型・大きさ・境界の明瞭さ・'
         '初発か再発か」で決まる</span>。<br>'
         '<span class="kw3">高リスク部位＝H-zone</span>：'
         '<span class="kw3">顔面の中央から耳介にかけての「H」の形をした領域——'
         '鼻・鼻唇溝・内眼角と外眼角・眼瞼・耳介と耳前部・上口唇・こめかみ</span>。'
         '<span class="kw3">この領域では、①胎生期の癒合線に沿って腫瘍が深部へ潜り込みやすい、'
         '②整容・機能の制約から十分なマージンを取りにくい、'
         '③眼窩・鼻腔・頭蓋など重要構造が近い</span>という理由で'
         '<span class="kw3">再発率が高くなる</span>。<br>'
         '<span class="kw3">高リスク組織型</span>：'
         '<span class="kw3">斑状強皮症型・浸潤型・微小結節型（境界不明瞭で深部進展）</span>。'
         '<span class="kw3">対して結節潰瘍型・表在型は低リスク</span>である。<br>'
         '<span class="kw3">対応</span>：'
         '<span class="kw3">高リスク例では、より広いマージン、'
         '術中迅速病理での断端確認、'
         'あるいはMohs顕微鏡手術（切除面を全周・全深部にわたり顕微鏡で確認しながら'
         '段階的に切除する方法）</span>が用いられる。'
         '<span class="kw3">断端陰性が確認できたら、'
         '追加治療は行わず定期的な視診・触診で経過をみる</span>。'
         '<span class="kw3">なお同一患者では他部位にも新たな基底細胞癌・日光角化症が'
         '生じやすい</span>ため、'
         '<span class="kw3">「切ったところ」だけでなく全身の皮膚を診る</span>のが'
         '経過観察の要点になる。'),
  deep=('📌 「切除後の対応」を問う設問の解き方',
        '<table class="tb"><tr><th>状況</th><th>対応</th></tr>'
        '<tr><td><span class="kw3">断端陰性・転移しない腫瘍（基底細胞癌・表皮内癌）</span></td>'
        '<td><span class="kw3">経過観察</span></td></tr>'
        '<tr><td><span class="kw4">断端陽性</span></td>'
        '<td><span class="kw4">追加切除（不能なら放射線）</span></td></tr>'
        '<tr><td>有棘細胞癌（断端陰性）</td>'
        '<td><span class="kw3">経過観察＋所属リンパ節の触診・エコーで転移監視</span></td></tr>'
        '<tr><td>悪性黒色腫（生検で確定後）</td>'
        '<td><span class="kw3">腫瘍厚に応じた拡大切除＋センチネルリンパ節生検</span></td></tr>'
        '<tr><td>乳房外Paget病</td>'
        '<td><span class="kw3">マッピング生検を踏まえた広範切除。再発監視</span></td></tr></table>'
        '<span class="kw3">設問文に「切除断端に病変を認めない」と書いてあれば、'
        'それは出題者が「追加治療は不要」と言っているのと同じ</span>である。'
        '<span class="kw3">この一文を見落とさないことが得点の鍵</span>。'),
  point=('🎯 国試ポイント',
         '① 基底細胞癌は<span class="kw3">断端陰性なら追加治療不要＝経過観察</span>。<br>'
         '② <span class="kw3">H-zone（鼻・眼周囲・耳・上口唇）は再発高リスク部位</span>。<br>'
         '③ 高リスク型＝<span class="kw3">斑状強皮症型・浸潤型</span>→広いマージンやMohs手術。<br>'
         '④ <span class="kw4">完全切除後の放射線・化学療法・温熱療法はいずれも不要</span>。<br>'
         '⑤ 経過観察では<span class="kw3">全身の皮膚（新規病変）も診る</span>。')),

]

QUESTIONS += [

Q('107D-23', 96, [('bi', '📷')],
  '88歳の女性。皮疹を主訴に来院した。'
  '<span class="kw">3年前から右大腿に皮疹が出現し徐々に拡大</span>してきた。'
  '<span class="kw">痒みや痛みはない</span>。'
  '右大腿伸側に<span class="kw">長径約5cmで一部にびらんを伴う紅斑局面</span>がある。'
  '意識は清明。身長164cm、体重62kg。脈拍64/分、整。血圧124/84mmHg。呼吸数24/分。'
  '<span class="kw">血液所見と血液生化学所見とに異常を認めない</span>。'
  '初診時の大腿の写真（A）と病変部の生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>治療として適切なのはどれか。</strong>',
  [('a', '光線療法', False, '<span class="kw4">光線（紫外線）療法は乾癬・尋常性白斑・'
                     '菌状息肉症（早期）・アトピー性皮膚炎などに用いる</span>。'
                     '<span class="kw4">Bowen病は表皮内癌であり、'
                     '紫外線はむしろ発症要因</span>である。'
                     '<span class="kw4">照射すればDNA損傷を上乗せするだけで有害</span>。'),
   ('b', '外科的切除', True, '<span class="kw3">病理は表皮全層にわたる有棘細胞の異型'
                     '（核の大小不同・過染・極性の消失、異常角化細胞、多核細胞）で、'
                     '基底膜は保たれている＝Bowen病（表皮内有棘細胞癌）</span>である。'
                     '<span class="kw3">治療の第一選択は外科的切除</span>で、'
                     '<span class="kw3">病変全体を病理に回せるため'
                     '真皮浸潤（Bowen癌）の有無を確認できる</span>点でも合理的である。'
                     '<span class="kw3">表皮内に留まる限り転移せず、'
                     '完全切除で治癒</span>する。'),
   ('c', '抗癌化学療法', False, '<span class="kw4">全身化学療法は転移例に対する治療</span>である。'
                     '<span class="kw4">Bowen病は表皮内癌で転移しない</span>ため、'
                     '<span class="kw4">88歳の患者に全身化学療法を行うのは'
                     '有害無益</span>である。'
                     'なお<span class="kw4">局所の5-FU外用は表在性の病変に対する'
                     '選択肢の一つ</span>だが、これは「抗癌化学療法（全身投与）」とは別である。'),
   ('d', '抗菌薬の投与', False, '<span class="kw4">細菌感染を示唆する所見（発熱・疼痛・熱感・'
                     '膿性分泌・白血球増多・CRP上昇）がない</span>。'
                     '<span class="kw4">3年かけて緩徐に拡大する無症候性の紅斑局面は'
                     '感染症の経過ではない</span>。'),
   ('e', '抗真菌薬の投与', False, '<span class="kw4">体部白癬は辺縁が堤防状に隆起して'
                     '中心が治癒傾向を示す環状の紅斑</span>で、'
                     '<span class="kw4">KOH直接鏡検で菌糸を確認して診断</span>する。'
                     '<span class="kw4">Bowen病は臨床的に白癬・湿疹と誤診されやすく、'
                     '実際に抗真菌薬・ステロイドで治療されて何年も経過することが多い</span>——'
                     '<span class="kw4">「治らないから生検した」という本例の流れが'
                     'まさにそれ</span>である。')],
  '表皮全層の異型＝Bowen病（表皮内有棘細胞癌）。治療は外科的切除。白癬・湿疹と誤診されて長期に外用されがち。',
  imgs=['images/107D-23_1.jpeg', 'images/107D-23_2.jpeg'],
  patho=('🧬 Bowen病——「表皮全層の異型」という定義と、その帰結',
         '<span class="kw3">Bowen病は表皮内有棘細胞癌〈squamous cell carcinoma in situ〉であり、'
         '定義は「異型角化細胞が表皮全層を置換しているが、基底膜は破っていない」</span>。'
         '<span class="kw3">基底膜を破って真皮へ浸潤したものはBowen癌</span>と呼ばれる。<br>'
         '<span class="kw3">臨床像は「境界明瞭で不整形の、'
         '鱗屑・痂皮を伴う紅褐色の局面が数年かけて緩徐に拡大する」</span>。'
         '<span class="kw3">自覚症状に乏しく（痒み・痛みがない）、'
         '体幹・四肢など非露光部にも生じる</span>のが日光角化症との違いである。'
         '<span class="kw4">乾癬・貨幣状湿疹・体部白癬と誤診されやすく、'
         '「ステロイドや抗真菌薬で治らない片側性の単発の局面」は'
         'Bowen病を疑って生検する</span>のが定石である。<br>'
         '<span class="kw3">背景因子</span>——'
         '<span class="kw3">紫外線（露光部）、慢性ヒ素中毒（体幹に多発）、'
         'HPV（外陰・肛囲・指趾）、免疫抑制、放射線</span>'
         '（<span class="kw">Q.161</span>）。'
         '<span class="kw4">とくに「多発するBowen病」を見たらヒ素曝露歴を問診</span>する。<br>'
         '<span class="kw3">治療</span>——'
         '<span class="kw3">第一選択は外科的切除（数mmのマージン）</span>。'
         '<span class="kw3">高齢・多発・整容上の問題がある場合は'
         '凍結療法・イミキモド外用・5-FU外用・光線力学的療法・電子線照射</span>も選択肢となる。'
         '<span class="kw3">表皮内に留まる限り転移しないため、'
         '完全に切除できれば治癒</span>する。'
         '<span class="kw4">ただし結節形成・硬結・潰瘍化があれば'
         '真皮浸潤（Bowen癌）を疑い、リンパ節評価を含めた対応が必要</span>になる。'),
  deep=('📌 「緩徐に拡大する境界明瞭な紅斑局面」の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>特徴</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Bowen病</span></td>'
        '<td><span class="kw3">単発・片側性・不整形。数年で緩徐に拡大。無症候</span></td>'
        '<td><span class="kw3">生検（表皮全層の異型）</span></td></tr>'
        '<tr><td>体部白癬</td>'
        '<td><span class="kw4">辺縁堤防状・中心治癒傾向の環状</span></td>'
        '<td><span class="kw4">KOH直接鏡検で菌糸</span></td></tr>'
        '<tr><td>貨幣状湿疹</td><td>多発・両側性・強い瘙痒・滲出</td><td>治療反応性</td></tr>'
        '<tr><td>尋常性乾癬</td><td>銀白色の厚い鱗屑、Auspitz現象、好発部位</td><td>臨床像</td></tr>'
        '<tr><td>日光角化症</td><td><span class="kw3">露光部。ざらつく。多発</span></td>'
        '<td>生検（表皮下層の異型）</td></tr>'
        '<tr><td>乳房外Paget病</td><td>外陰・肛囲・腋窩</td>'
        '<td><span class="kw3">生検（Paget細胞。CK7＋）</span></td></tr>'
        '<tr><td>菌状息肉症</td><td>非露光部に多発。10〜20年の経過</td>'
        '<td>生検（表皮向性）</td></tr></table>'
        '<span class="kw3">共通する教訓は「単発・片側性・無症候・緩徐に拡大＝腫瘍を疑って生検」</span>。'),
  point=('🎯 国試ポイント',
         '① Bowen病＝<span class="kw3">表皮全層の異型（表皮内有棘細胞癌）。基底膜は保たれる</span>。<br>'
         '② 臨床＝<span class="kw3">境界明瞭で不整形の紅褐色局面。数年かけて緩徐に拡大。無症候</span>。<br>'
         '③ 治療＝<span class="kw3">外科的切除が第一選択</span>（凍結・外用・PDTも可）。<br>'
         '④ <span class="kw4">白癬・湿疹と誤診されやすい</span>——治らなければ生検。<br>'
         '⑤ <span class="kw3">多発例はヒ素曝露を問診</span>。<span class="kw3">浸潤すればBowen癌</span>。')),

Q('105A-41', 78, [('bi', '📷')],
  '92歳の女性。左頰部の結節を主訴に来院した。'
  '<span class="kw">5年前から同部に「赤い皮疹」があった</span>が受診しなかった。'
  '<span class="kw">主訴である結節は、この「赤い皮疹」が発生母地になっている</span>と考えられた。'
  '左頰部の写真（A）と生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>「赤い皮疹」の診断名として考えられるのはどれか。</strong>',
  [('a', '血管肉腫', False, '<span class="kw4">血管肉腫は高齢者の頭部・顔面に生じる'
                     '紫紅色の斑・局面だが、それ自体が悪性腫瘍</span>である。'
                     '<span class="kw4">「他の癌の発生母地になる前癌病変」ではない</span>。'
                     'また<span class="kw4">5年前から存在して現在まで生存している経過は'
                     '血管肉腫の予後（きわめて不良）と矛盾</span>する。'),
   ('b', '菌状息肉症', False, '<span class="kw4">菌状息肉症は年単位で紅斑→局面→腫瘤と進む'
                     '皮膚T細胞リンパ腫</span>で、'
                     '<span class="kw4">紅斑期から腫瘍期へ進むという意味では'
                     '「赤い皮疹が腫瘤になる」経過に見える</span>。'
                     'しかし<span class="kw4">菌状息肉症は非露光部に多発するのが典型で、'
                     '顔面単発ではない</span>。'
                     'また<span class="kw4">病理は異型リンパ球の浸潤</span>であり、'
                     '本例の有棘細胞癌の像とは異なる。'),
   ('c', '光線角化症', True, '<span class="kw3">光線角化症（＝日光角化症）は、'
                     '高齢者の露光部（顔面・頭部・手背）に生じる'
                     '「鱗屑を伴う紅色の平坦な斑」で、'
                     '有棘細胞癌の最も代表的な前駆病変</span>である。'
                     '<span class="kw3">5年前からあった「赤い皮疹」＝光線角化症が、'
                     '基底膜を破って真皮浸潤し、結節（有棘細胞癌）を形成した</span>——'
                     'という経過が問われている。'
                     '<span class="kw3">病理では表皮内の異型に加え、'
                     '真皮内へ浸潤する異型有棘細胞と癌真珠</span>を認める'
                     '（<span class="kw">Q.160</span>）。'),
   ('d', 'Merkel細胞癌', False, '<span class="kw4">Merkel細胞癌は高齢者の露光部に生じる'
                     '神経内分泌腫瘍で、赤紫色のドーム状結節として急速に増大し'
                     '早期に転移</span>する。'
                     '<span class="kw4">それ自体が悪性腫瘍であり前駆病変ではない</span>。'
                     '<span class="kw4">病理は小型で核細胞質比の高い円形細胞のびまん性増殖、'
                     'CK20が核周囲にdot状に陽性</span>で、'
                     '角化を伴う有棘細胞癌とは異なる。'),
   ('e', '乳房外Paget病', False, '<span class="kw4">乳房外Paget病は外陰部・肛囲・腋窩に生じる'
                     '表皮内腺癌</span>で、'
                     '<span class="kw4">顔面には生じない</span>。'
                     'また<span class="kw4">それ自体が癌であって、'
                     '有棘細胞癌の発生母地にはならない</span>。')],
  '高齢者の顔面で「5年前からあった赤い皮疹」から結節が生じた＝光線角化症を発生母地とする有棘細胞癌。',
  imgs=['images/105A-41_1.jpeg', 'images/105A-41_2.jpeg'],
  patho=('🧬 光線角化症から有棘細胞癌へ——「赤い斑が結節になる」瞬間',
         '<span class="kw3">光線角化症（日光角化症）は、'
         '有棘細胞癌の最も頻度の高い前駆病変</span>である。'
         '<span class="kw3">個々の病変が癌化する確率は年率0.1〜1％程度と低いが、'
         '多発するため（field cancerization）'
         '生涯のどこかで有棘細胞癌が発生する確率は無視できない</span>。<br>'
         '<span class="kw3">「浸潤した」と判断するサイン</span>——'
         '<span class="kw3">①平坦だった病変が隆起・結節化する、'
         '②触れて硬い（硬結）、③潰瘍・出血、④疼痛、'
         '⑤急速な増大、⑥径が大きい（1cm以上）</span>。'
         '<span class="kw3">本例の「赤い皮疹の上に結節ができた」はまさに①</span>で、'
         '<span class="kw3">この変化を見たら生検・切除が必要</span>である。<br>'
         '<span class="kw3">病理での連続性</span>——'
         '<span class="kw3">切除標本では、腫瘤の周辺部に光線角化症の像'
         '（表皮下層の異型、錯角化と正角化の交互配列、日光弾性線維症）が残り、'
         '中央部で異型有棘細胞が基底膜を破って真皮へ索状・胞巣状に浸潤し、'
         '癌真珠を形成している</span>——'
         '<span class="kw3">「前駆病変と浸潤癌が地続きに存在する」のが観察できる</span>。<br>'
         '<span class="kw3">臨床上の対応</span>——'
         '<span class="kw3">浸潤癌である以上、治療は十分なマージンをとった外科的切除で、'
         '所属リンパ節の触診・エコーによる転移評価が必要</span>。'
         '<span class="kw3">高齢で手術が難しい場合は放射線治療も選択肢</span>となる。'
         '<span class="kw3">周囲に残る光線角化症も凍結・外用などで処置し、'
         '以後の遮光指導を行う</span>。'),
  deep=('📌 「前駆病変（発生母地）」として問われるもの',
        '<table class="tb"><tr><th>母地</th><th>できる腫瘍</th><th>移行を疑うサイン</th></tr>'
        '<tr><td><span class="kw3">光線角化症</span></td>'
        '<td><span class="kw3">有棘細胞癌</span></td>'
        '<td><span class="kw3">隆起・硬結・潰瘍・急速増大</span></td></tr>'
        '<tr><td><span class="kw3">Bowen病</span></td><td>有棘細胞癌（Bowen癌）</td>'
        '<td>結節形成・浸潤感</td></tr>'
        '<tr><td><span class="kw3">熱傷瘢痕・慢性潰瘍</span></td>'
        '<td>有棘細胞癌（Marjolin潰瘍）</td><td>治らない潰瘍・辺縁の隆起</td></tr>'
        '<tr><td><span class="kw3">脂腺母斑</span></td><td>基底細胞癌など</td>'
        '<td>成人期に結節が出現</td></tr>'
        '<tr><td><span class="kw3">先天性巨大色素性母斑</span></td><td>悪性黒色腫</td>'
        '<td>色調・形の変化、結節</td></tr>'
        '<tr><td><span class="kw3">悪性黒子</span></td><td>悪性黒子型黒色腫</td>'
        '<td>一部が濃く隆起（<span class="kw">Q.162</span>）</td></tr>'
        '<tr><td>局面状類乾癬</td><td>菌状息肉症</td><td>浸潤を触れる局面へ</td></tr></table>'
        '<span class="kw3">共通するのは「平坦だったものが隆起・硬結する」</span>——'
        '<span class="kw3">これが表皮内から真皮浸潤への移行を意味する</span>。'),
  point=('🎯 国試ポイント',
         '① 有棘細胞癌の最頻の発生母地＝<span class="kw3">光線角化症（日光角化症）</span>。<br>'
         '② 浸潤のサイン＝<span class="kw3">隆起・硬結・潰瘍・急速増大</span>。<br>'
         '③ 病理では<span class="kw3">周辺に光線角化症、中央に浸潤癌が地続き</span>に見える。<br>'
         '④ 治療＝<span class="kw3">十分なマージンの切除＋所属リンパ節の評価</span>。<br>'
         '⑤ <span class="kw4">血管肉腫・Merkel細胞癌・乳房外Paget病はそれ自体が癌で母地ではない</span>。')),

Q('104D-56', 89, [('bi', '📷')],
  '68歳の女性。右下肢の潰瘍を主訴に来院した。'
  '<span class="kw">60年前から右下肢に熱傷後の瘢痕</span>があり、'
  '<span class="kw">8か月前から同部が潰瘍化</span>してきた。右膝窩の写真を示す。<br>'
  '<strong>治療として適切なのはどれか。</strong>',
  [('a', '外科的切除', True, '<span class="kw3">60年前の熱傷瘢痕に生じた難治性潰瘍＝'
                     'Marjolin潰瘍（瘢痕癌）＝有棘細胞癌</span>と考える。'
                     '<span class="kw3">悪性腫瘍であるから治療は外科的切除</span>で、'
                     '<span class="kw3">十分なマージンをとった切除＋植皮・皮弁による再建、'
                     'および所属リンパ節（鼠径）の評価</span>が必要である。'
                     '<span class="kw3">通常の有棘細胞癌よりリンパ節転移率が高い</span>とされ、'
                     '安易な保存的治療で経過をみてはならない。'),
   ('b', '紫外線療法', False, '<span class="kw4">紫外線は有棘細胞癌の発癌要因であり、'
                     '悪性腫瘍に照射するのは有害</span>である。'
                     '光線療法の適応は乾癬・白斑・菌状息肉症などである。'),
   ('c', '血行再建手術', False, '<span class="kw4">血行再建が適応となるのは'
                     '末梢動脈疾患による虚血性潰瘍</span>である。'
                     '<span class="kw4">下肢の冷感・間欠性跛行・足背動脈の触知不良・'
                     'ABI低下といった所見</span>が根拠になるが、'
                     '本例は<span class="kw4">熱傷瘢痕という明らかな素地があり、'
                     '虚血を示唆する情報はない</span>。'),
   ('d', '肉芽形成促進薬外用', False, '<span class="kw4">創傷治癒を促す外用薬は'
                     '褥瘡・外傷性潰瘍など「治る見込みのある創」に用いる</span>。'
                     '<span class="kw4">悪性腫瘍による潰瘍に外用を続ければ'
                     '診断と治療が遅れるだけ</span>である。'
                     '<span class="kw4">「治らない潰瘍」に対して漫然と外用を続けないこと、'
                     'まず生検すること</span>が本問の教訓である。'),
   ('e', '腰部交感神経節ブロック', False, '<span class="kw4">交感神経節ブロックは'
                     '複合性局所疼痛症候群〈CRPS〉や'
                     '重症虚血肢の疼痛緩和・血流改善を目的に行う</span>。'
                     '<span class="kw4">腫瘍性潰瘍の治療にはならない</span>。')],
  '60年前の熱傷瘢痕に生じた潰瘍＝Marjolin潰瘍（有棘細胞癌）。治療は外科的切除＋所属リンパ節の評価。',
  imgs=['images/104D-56_1.jpeg'],
  patho=('🧬 Marjolin潰瘍——「何十年も前の瘢痕」が癌になる',
         '<span class="kw3">Marjolin潰瘍とは、熱傷瘢痕・慢性潰瘍・瘻孔・褥瘡など'
         '長期にわたる慢性創傷を母地として発生する悪性腫瘍</span>の総称で、'
         '<span class="kw3">その大半は有棘細胞癌</span>である。'
         '<span class="kw3">熱傷から発症までの潜伏期は20〜50年と非常に長く、'
         '本例の60年はまさに典型的</span>である。<br>'
         '<span class="kw3">なぜ癌化するのか</span>——'
         '<span class="kw3">①瘢痕組織は血流とリンパ流に乏しく免疫監視が届きにくい、'
         '②繰り返す潰瘍化と再生で細胞分裂が続き変異が蓄積する、'
         '③慢性炎症性サイトカインが増殖を促す</span>と説明される。<br>'
         '<span class="kw3">臨床の要点</span>——'
         '<span class="kw3">「古い瘢痕に、最近になって治らない潰瘍ができた」'
         '「潰瘍の辺縁が隆起してきた」「悪臭・出血を伴う」「急に大きくなった」</span>という'
         '<span class="kw3">変化があれば必ず生検</span>する。'
         '<span class="kw4">漫然と外用処置を続けて数か月を空費するのが最悪の対応</span>である。<br>'
         '<span class="kw3">治療と予後</span>——'
         '<span class="kw3">十分なマージン（通常1〜2cm）をとった広範切除と再建（植皮・皮弁）、'
         '所属リンパ節の評価（触診・エコー・必要に応じ生検や郭清）</span>。'
         '<span class="kw3">Marjolin潰瘍は通常の日光曝露由来の有棘細胞癌より'
         '分化度が低く転移率が高い</span>とされ、'
         '<span class="kw3">下肢では鼠径リンパ節の評価が重要</span>である。'
         '<span class="kw4">高度に進行し骨浸潤を伴う場合は切断が必要になることもある</span>。'),
  deep=('📌 「治らない下腿潰瘍」の鑑別',
        '<table class="tb"><tr><th>原因</th><th>手がかり</th><th>対応</th></tr>'
        '<tr><td><span class="kw3">悪性腫瘍（Marjolin潰瘍・有棘細胞癌）</span></td>'
        '<td><span class="kw3">瘢痕・慢性潰瘍の既往、辺縁の隆起、悪臭、易出血</span></td>'
        '<td><span class="kw3">生検→広範切除</span></td></tr>'
        '<tr><td>静脈うっ滞性潰瘍</td>'
        '<td>下腿内果周囲、色素沈着・脂肪皮膚硬化症・浮腫、静脈瘤</td>'
        '<td>圧迫療法・静脈治療</td></tr>'
        '<tr><td>動脈性（虚血性）潰瘍</td>'
        '<td><span class="kw4">足趾・足部、疼痛強い、冷感、脈拍触知不良、ABI低下</span></td>'
        '<td><span class="kw4">血行再建</span></td></tr>'
        '<tr><td>糖尿病性足潰瘍</td><td>荷重部、神経障害で無痛、胼胝を伴う</td>'
        '<td>免荷・感染管理・血糖是正</td></tr>'
        '<tr><td>壊疽性膿皮症</td>'
        '<td><span class="kw4">穿掘性で紫紅色の辺縁、pathergy、IBDの合併</span></td>'
        '<td><span class="kw4">ステロイド（デブリドマンは悪化させる）</span></td></tr>'
        '<tr><td>血管炎</td><td>紫斑・網状皮斑を伴う多発性潰瘍</td><td>原疾患の治療</td></tr></table>'
        '<span class="kw3">「潰瘍の周囲に何があるか（瘢痕・静脈瘤・胼胝・紫斑）」を見るのが'
        '鑑別の出発点</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">熱傷瘢痕に生じた潰瘍＝Marjolin潰瘍＝有棘細胞癌</span>。潜伏期20〜50年。<br>'
         '② 治療＝<span class="kw3">外科的切除（＋再建）と所属リンパ節の評価</span>。<br>'
         '③ <span class="kw4">「治らない潰瘍」に外用を続けず、まず生検</span>。<br>'
         '④ <span class="kw3">通常の有棘細胞癌より転移率が高い</span>。<br>'
         '⑤ 下腿潰瘍の鑑別＝<span class="kw3">腫瘍・静脈性・動脈性・糖尿病性・壊疽性膿皮症</span>。')),

Q('103B-46', 84, [],
  '66歳の男性。<span class="kw">間擦部の色素斑</span>を主訴に来院した。'
  '<span class="kw">1か月前から腋窩と鼠径部とに自覚症状のない褐色斑</span>が出現した。'
  '<span class="kw">次第に色調が濃くなり、表面がざらざら</span>するようになってきた。'
  '<span class="kw">3週前から上腹部不快感</span>があり、'
  '<span class="kw">上部消化管内視鏡検査で胃癌を指摘</span>された。<br>'
  '<strong>考えられるのはどれか。</strong>',
  [('a', '魚鱗癬', False, '<span class="kw4">魚鱗癬は全身の皮膚が乾燥し'
                     '魚の鱗のような鱗屑を生じる角化異常症</span>で、'
                     '<span class="kw4">先天性（尋常性魚鱗癬など）が大半</span>。'
                     '<span class="kw4">成人発症の後天性魚鱗癬はデルマドロームとして'
                     'Hodgkinリンパ腫などに伴う</span>が、'
                     '<span class="kw4">分布は四肢伸側・体幹のびまん性乾燥であって、'
                     '間擦部の褐色斑ではない</span>。'),
   ('b', 'Addison病', False, '<span class="kw4">Addison病（慢性副腎皮質機能低下症）では、'
                     'ACTH・MSH増加によりびまん性の色素沈着</span>を来す。'
                     '<span class="kw4">露光部・手掌の皮溝・関節伸側・爪床・瘢痕・'
                     '口腔粘膜（歯肉・頬粘膜）に強く出る</span>のが特徴で、'
                     '<span class="kw4">全身倦怠感・体重減少・食欲不振・低血圧・低Na血症・高K血症</span>を伴う。'
                     '<span class="kw4">「表面がざらざらする」乳頭腫状の変化はない</span>。'),
   ('c', '黒色真菌症', False, '<span class="kw4">黒色真菌症〈クロモミコーシス等〉は'
                     '黒色真菌による深在性真菌症</span>で、'
                     '<span class="kw4">外傷を契機に四肢の露出部に'
                     '疣状・結節状の局面を単発性に形成</span>する。'
                     '<span class="kw4">間擦部に左右対称に生じる褐色斑ではない</span>。'),
   ('d', '黒色表皮腫', True, '<span class="kw3">①腋窩・鼠径という間擦部、'
                     '②1か月という急速な出現、③褐色でざらつく（乳頭腫状の）色素斑、'
                     '④中高年、⑤胃癌の存在</span>——'
                     '<span class="kw3">悪性型の黒色表皮腫（デルマドローム）</span>の'
                     '教科書的な組合せである。'
                     '<span class="kw3">合併腫瘍の約6割が胃癌</span>で、'
                     '<span class="kw3">腫瘍の治療により皮疹が軽快し、'
                     '再発とともに再燃する</span>という並行性を示す'
                     '（<span class="kw">Q.153</span>・<span class="kw">Q.168</span>）。'),
   ('e', 'Leser-Trélat徴候', False, '<span class="kw4">Leser-Trélat徴候も'
                     '内臓悪性腫瘍（胃癌・大腸癌）に伴うデルマドローム</span>だが、'
                     '<span class="kw4">その内容は「脂漏性角化症〈老人性疣贅〉が'
                     '短期間に多数出現する」こと</span>である。'
                     '<span class="kw4">個々の病変は境界明瞭で'
                     '「貼り付けたような（stuck-on）」隆起した疣状の腫瘤</span>であり、'
                     '<span class="kw4">本例のような間擦部のびまん性の褐色斑とは形態が異なる</span>。'
                     '<span class="kw4">両者が同一患者に併存することはある</span>が、'
                     '記載された皮疹の性状から選ぶべきはｄである。')],
  '間擦部に急速に出た、ざらつく褐色斑＋胃癌＝悪性型の黒色表皮腫。Leser-Trélat徴候は「脂漏性角化症の多発」で形態が違う。',
  patho=('🧬 デルマドロームの並行性——皮膚が腫瘍の経過を映す',
         '<span class="kw3">デルマドロームであることの臨床的な証拠は「並行性」</span>である。'
         '<span class="kw3">腫瘍の発症とともに皮疹が出現し、'
         '腫瘍の治療（切除・化学療法）で皮疹が軽快し、'
         '腫瘍の再発とともに皮疹も再燃する</span>。'
         '<span class="kw3">本例では胃癌の指摘と皮疹の出現がほぼ同時期であり、'
         'この関係が示唆されている</span>。<br>'
         '<span class="kw3">悪性型黒色表皮腫を疑うポイント（再掲・実戦版）</span>——'
         '<span class="kw3">①発症が急（数週〜数か月）、'
         '②中高年（若年で肥満・糖尿病がないのに出た）、'
         '③範囲が広い（間擦部を越えて体幹・四肢・顔面へ）、'
         '④粘膜（口唇・口腔・眼瞼結膜）に及ぶ、'
         '⑤手掌のtripe palms（牛肚状手掌＝皮溝が深く目立つビロード状の肥厚）、'
         '⑥瘙痒を伴う、⑦体重減少などの全身症状を伴う</span>。'
         '<span class="kw3">これらがあれば上部消化管内視鏡を含む腫瘍検索へ進む</span>。<br>'
         '<span class="kw3">胃癌に伴う皮膚所見はほかにもある</span>——'
         '<span class="kw3">Leser-Trélat徴候（脂漏性角化症の急速多発）、'
         'Sister Mary Joseph結節（臍への皮膚転移）、'
         '皮膚筋炎、後天性魚鱗癬、Bazex症候群</span>。'
         '<span class="kw3">「皮膚を見て消化管を疑う」回路を持っておくことが'
         '本章の実践的な意義</span>である。<br>'
         '<span class="kw4">なお良性型（インスリン抵抗性による）はきわめて頻度が高く、'
         '肥満の若年者に見られる黒色表皮腫を'
         'すべて腫瘍検索に回す必要はない</span>——'
         '<span class="kw4">「急速・広範・中高年・粘膜」の4条件が判断の軸</span>である。'),
  deep=('📌 色素沈着を来す全身疾患との鑑別',
        '<table class="tb"><tr><th>疾患</th><th>分布</th><th>随伴所見</th></tr>'
        '<tr><td><span class="kw3">黒色表皮腫</span></td>'
        '<td><span class="kw3">腋窩・頸部・鼠径などの間擦部。左右対称。ざらつく</span></td>'
        '<td><span class="kw3">肥満・糖尿病／内臓悪性腫瘍</span></td></tr>'
        '<tr><td>Addison病</td>'
        '<td><span class="kw3">全身びまん性。露光部・手掌皮溝・瘢痕・口腔粘膜が濃い</span></td>'
        '<td><span class="kw4">低血圧・低Na・高K・易疲労</span></td></tr>'
        '<tr><td>ヘモクロマトーシス</td><td>全身の灰褐色（青銅色）</td>'
        '<td>肝硬変・糖尿病・心筋症（青銅色糖尿病）</td></tr>'
        '<tr><td>肝斑</td><td>頬・前額に左右対称</td><td>妊娠・経口避妊薬。境界がぼやける</td></tr>'
        '<tr><td>薬剤性色素沈着</td><td>薬剤ごとに特徴的（ミノサイクリン・抗腫瘍薬）</td>'
        '<td>服薬歴</td></tr>'
        '<tr><td>Peutz-Jeghers症候群</td>'
        '<td><span class="kw4">口唇・口囲・指趾の点状色素斑</span></td>'
        '<td><span class="kw4">消化管過誤腫性ポリープ・腸重積</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 間擦部のざらつく褐色斑＋中高年＋急速＝<span class="kw3">悪性型黒色表皮腫→胃癌を探す</span>。<br>'
         '② <span class="kw3">Leser-Trélat徴候は「脂漏性角化症の急速多発」</span>——形態が違う。<br>'
         '③ デルマドロームの証拠＝<span class="kw3">腫瘍の経過と皮疹の経過が並行する</span>。<br>'
         '④ <span class="kw4">Addison病はびまん性で口腔粘膜にも及び、低血圧・電解質異常を伴う</span>。<br>'
         '⑤ 胃癌の皮膚所見＝<span class="kw3">黒色表皮腫・Leser-Trélat・Sister Mary Joseph結節</span>。')),

]

QUESTIONS += [

Q('103D-47', 58, [('bi', '📷')],
  '90歳の男性。頭部の皮疹を主訴に来院した。'
  '<span class="kw">7か月前に頭部に紫紅色斑が出現</span>し、'
  '<span class="kw">次第に拡大、隆起し、出血</span>するようになった。'
  '頭部の写真（A）と同部の病理組織H-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '血管肉腫', True, '<span class="kw3">90歳男性の頭部に生じた紫紅色斑が'
                     '7か月で拡大・隆起し易出血性となった</span>——'
                     '<span class="kw3">頭部血管肉腫</span>である。'
                     '<span class="kw3">病理では異型内皮細胞が不規則に吻合する血管腔を裏打ちし、'
                     '膠原線維束の間を解離するように浸潤（dissecting pattern）</span>する。'
                     '<span class="kw3">CD31・CD34・ERG陽性</span>で確定する'
                     '（<span class="kw">Q.159</span>・<span class="kw">Q.176</span>・'
                     '<span class="kw">Q.178</span>）。'),
   ('b', 'グロムス腫瘍', False, '<span class="kw4">グロムス腫瘍は爪下に好発する'
                     '数mmの青紅色小結節で、発作性の激痛・圧痛・寒冷での増悪</span>が特徴。'
                     '<span class="kw4">病理はグロムス小体由来の均一な類円形細胞が'
                     '血管腔を取り囲む像で、異型はない</span>。'
                     '頭部にびまん性の紫紅色局面を作ることはない。'),
   ('c', '海綿状血管腫', False, '<span class="kw4">海綿状血管腫（静脈奇形）は'
                     '拡張した血管腔が海綿状に集簇する良性の脈管奇形</span>で、'
                     '<span class="kw4">多くは出生時から存在し、'
                     '柔らかく圧迫で縮小する青紫色の腫瘤</span>。'
                     '<span class="kw4">内皮細胞は一層で異型がなく、浸潤性増殖もない</span>。'),
   ('d', '毛細血管拡張性肉芽腫', False, '<span class="kw4">毛細血管拡張性肉芽腫'
                     '（＝血管拡張性肉芽腫・化膿性肉芽腫）は、'
                     '外傷を契機に手指・口唇などに生じる有茎性の鮮紅色小結節</span>。'
                     '<span class="kw4">数週で急速に増大するが1〜2cm程度で頭打ちとなり良性</span>で、'
                     '<span class="kw4">病理は分葉状の毛細血管増生（lobular capillary hemangioma）で'
                     '内皮細胞に異型はない</span>。'),
   ('e', 'Kasabach-Merritt症候群', False, '<span class="kw4">Kasabach-Merritt症候群は、'
                     '乳児の巨大な血管性腫瘍（カポジ型血管内皮腫・房状血管腫）の内部で'
                     '血小板が消費されて生じる、血小板減少と消費性凝固障害</span>である。'
                     '<span class="kw4">乳児期の疾患であり、'
                     '90歳の頭部の腫瘍を説明しない</span>。'
                     '<span class="kw4">出血傾向（紫斑・貧血）を伴う点で紛らわしい</span>が、'
                     '本例の出血は腫瘍表面の易出血性である。')],
  '高齢者頭部の紫紅色斑が数か月で拡大・隆起・出血＋病理で異型内皮細胞の浸潤性増殖＝血管肉腫。良性の血管腫・血管奇形は経過が違う。',
  imgs=['images/103D-47_1.jpeg', 'images/103D-47_2.jpeg'],
  patho=('🧬 血管性病変の分類——腫瘍か、奇形か',
         '<span class="kw3">血管性病変は「血管性腫瘍〈vascular tumor〉」と'
         '「脈管奇形〈vascular malformation〉」に大別する（ISSVA分類）</span>——'
         'この区別が治療方針を決める。<br>'
         '<span class="kw3">【血管性腫瘍】内皮細胞が増殖する</span>。'
         '<span class="kw3">①乳児血管腫（いちご状血管腫）：生後数週から急速に増大し、'
         '1歳ごろから数年かけて自然消退する。'
         '視野・気道を妨げる場合や潰瘍化例ではプロプラノロールが第一選択。'
         '②血管拡張性肉芽腫：外傷後の有茎性鮮紅色結節。'
         '③カポジ型血管内皮腫・房状血管腫：'
         '<span class="kw3">Kasabach-Merritt現象（血小板消費）を起こす</span>。'
         '④血管肉腫：悪性</span>。<br>'
         '<span class="kw3">【脈管奇形】内皮細胞は増殖せず、血管の形成異常</span>。'
         '<span class="kw3">出生時から存在し、自然消退せず、身体の成長に比例して大きくなる</span>。'
         '<span class="kw3">①毛細血管奇形（単純性血管腫・ポートワイン母斑）：'
         '色素レーザーが有効。三叉神経第1枝領域ならSturge-Weber症候群を疑う。'
         '②静脈奇形（海綿状血管腫）：柔らかく圧迫で縮小。'
         '③リンパ管奇形、④動静脈奇形</span>。<br>'
         '<span class="kw3">この枠組みで本例を見ると</span>——'
         '<span class="kw3">「90歳で新たに出現し、7か月で拡大・隆起・出血」は'
         '奇形ではありえず（奇形は出生時から）、'
         '自然消退する良性腫瘍でもない（乳児血管腫は乳児の疾患）</span>。'
         '<span class="kw3">残るのは悪性の血管性腫瘍＝血管肉腫</span>である。'),
  deep=('📌 血管性腫瘍と脈管奇形の対比',
        '<table class="tb"><tr><th></th><th>血管性腫瘍</th><th>脈管奇形</th></tr>'
        '<tr><td>本態</td><td><span class="kw3">内皮細胞の増殖</span></td>'
        '<td><span class="kw3">血管の形成異常（増殖しない）</span></td></tr>'
        '<tr><td>出現</td><td>出生後（乳児血管腫は生後数週）</td>'
        '<td><span class="kw3">出生時から存在</span></td></tr>'
        '<tr><td>経過</td><td><span class="kw3">増大期→消退期（乳児血管腫）</span></td>'
        '<td><span class="kw3">自然消退しない。成長に比例</span></td></tr>'
        '<tr><td>代表</td><td>乳児血管腫、血管拡張性肉芽腫、'
        '<span class="kw4">血管肉腫（悪性）</span></td>'
        '<td>単純性血管腫、海綿状血管腫、動静脈奇形</td></tr>'
        '<tr><td>治療</td><td>プロプラノロール（乳児血管腫）、切除</td>'
        '<td>色素レーザー（毛細血管奇形）、硬化療法、切除</td></tr></table>'
        '<span class="kw3">「いつからあるか」を問診するだけで、'
        '腫瘍か奇形かの大半は切り分けられる</span>。'),
  point=('🎯 国試ポイント',
         '① 高齢者頭部の紫紅色斑が拡大・隆起・出血＝<span class="kw3">血管肉腫</span>。<br>'
         '② <span class="kw3">Kasabach-Merritt症候群は乳児の巨大血管性腫瘍＋血小板減少</span>。<br>'
         '③ <span class="kw3">乳児血管腫は自然消退する／単純性血管腫は消退しない</span>。<br>'
         '④ グロムス腫瘍＝<span class="kw3">爪下・激痛・寒冷で増悪</span>。<br>'
         '⑤ <span class="kw3">「いつからあるか」で腫瘍と奇形を切り分ける</span>。')),

Q('103I-40', 96, [],
  '<strong>足底に生じた黒色斑の診断に有用なのはどれか。</strong>',
  [('a', '針反応', False, '<span class="kw4">針反応〈pathergy test〉は、'
                     '滅菌針で皮膚を刺し、24〜48時間後に無菌性の膿疱・紅色丘疹が'
                     '生じるかをみる検査</span>で、'
                     '<span class="kw4">Behçet病の診断基準の副症状</span>として用いる。'
                     '<span class="kw4">壊疽性膿皮症でも同様の現象がみられる</span>。'
                     '色素性病変の評価には用いない。'),
   ('b', '硝子圧法', False, '<span class="kw4">硝子圧法はガラス板で圧迫して退色するかをみる方法</span>で、'
                     '<span class="kw4">紅斑と紫斑の区別、'
                     'サルコイドーシスや尋常性狼瘡のリンゴゼリー様所見の確認</span>に使う。'
                     '<span class="kw4">メラニン色素は圧迫しても退色しないため、'
                     '色素性病変の良悪鑑別には無力</span>である。'),
   ('c', '皮膚描記法', False, '<span class="kw4">皮膚描記法は擦過による膨疹の誘発をみるもの</span>で、'
                     '<span class="kw4">機械性蕁麻疹・肥満細胞症のDarier徴候</span>の確認に用いる。'),
   ('d', 'Wood灯検査', False, '<span class="kw4">Wood灯（長波長紫外線）検査は、'
                     '白癬（Microsporum属で黄緑色蛍光）、紅色陰癬（サンゴ赤色）、'
                     '癜風（黄白色）、ポルフィリン症（尿の赤色蛍光）、'
                     '尋常性白斑や結節性硬化症の葉状白斑の範囲の描出</span>に用いる。'
                     '<span class="kw4">表皮のメラニンを強調するため'
                     '「白斑や淡い色素斑を見やすくする」検査であって、'
                     '黒色斑の良悪を判定するものではない</span>。'),
   ('e', 'ダーモスコピー試験', True, '<span class="kw3">足底の黒色斑では、'
                     'ダーモスコピーが良悪の鑑別に決定的である</span>。'
                     '<span class="kw3">掌蹠は皮溝〈furrow〉と皮丘〈ridge：汗孔が並ぶ隆線〉が'
                     '規則正しく交互に走る特殊な皮膚</span>で、'
                     '<span class="kw3">良性の色素性母斑では色素が皮溝に沿って並ぶ'
                     '「平行溝パターン〈parallel furrow pattern〉」、'
                     '悪性黒色腫では皮丘に沿って並ぶ'
                     '「平行隆線パターン〈parallel ridge pattern〉」</span>を示す。'
                     '<span class="kw3">この一点で高い精度の判別ができる</span>'
                     '（<span class="kw">Q.163</span>）。')],
  '足底の黒色斑はダーモスコピーで判別する。平行溝パターン＝良性、平行隆線パターン＝悪性黒色腫。',
  patho=('🧬 掌蹠の黒色斑——「溝か、丘か」で決まる',
         '<span class="kw3">日本人の悪性黒色腫は末端黒子型が約半数を占め、'
         '足底が最も多い発生部位</span>である。'
         '<span class="kw3">一方で、足底の色素性母斑や外傷による色素沈着・'
         '足底血腫もありふれており、'
         '「足の裏の黒い斑」をどう扱うかは実地で頻繁に直面する問題</span>である。<br>'
         '<span class="kw3">掌蹠の皮膚には皮溝と皮丘が平行に走る</span>。'
         '<span class="kw3">汗孔（エクリン汗腺の開口部）は皮丘の上に並ぶ</span>ので、'
         '<span class="kw3">ダーモスコピーで「点々と汗孔が見える線」＝皮丘</span>と同定できる。<br>'
         '<span class="kw3">【平行溝パターン】色素が皮溝（へこんだ線）に沿う</span>——'
         '<span class="kw3">良性の色素性母斑。母斑細胞が皮溝直下に位置するため</span>。'
         '<span class="kw3">変法として「格子状パターン」「線維状パターン」も良性</span>。<br>'
         '<span class="kw3">【平行隆線パターン】色素が皮丘（汗孔のある隆線）に沿う</span>——'
         '<span class="kw3">悪性黒色腫。腫瘍細胞が皮丘直下（汗管の周囲）で増殖するため</span>。'
         '<span class="kw3">感度・特異度ともに高く、早期病変でも検出できる</span>のが'
         'この所見の価値である。<br>'
         '<span class="kw3">その他、悪性を示唆する所見</span>——'
         '<span class="kw3">びまん性の不整な色素沈着、多彩な色調、'
         '径7mm以上、非対称</span>。'
         '<span class="kw4">外傷性の足底血腫との鑑別も重要で、'
         '血腫ではダーモスコピーで赤紫〜黒色の均一な塊（globule）が見え、'
         '角層が伸びるとともに消退する</span>。'
         '<span class="kw3">疑わしければ全切除生検で確定する</span>のは黒色腫全般と同じである。'),
  deep=('📌 足底の黒色病変の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>ダーモスコピー</th><th>経過</th></tr>'
        '<tr><td><span class="kw3">悪性黒色腫（末端黒子型）</span></td>'
        '<td><span class="kw3">平行隆線パターン、不整な色調</span></td>'
        '<td><span class="kw3">緩徐に拡大、径が大きい、隆起・潰瘍化</span></td></tr>'
        '<tr><td>色素性母斑</td><td><span class="kw3">平行溝／格子状／線維状パターン</span></td>'
        '<td>不変または緩徐、対称</td></tr>'
        '<tr><td>足底血腫（黒踵）</td>'
        '<td><span class="kw4">赤紫〜黒色の均一な小塊。辺縁に衛星状の点</span></td>'
        '<td><span class="kw4">スポーツ後。数週で消退・遠位へ移動</span></td></tr>'
        '<tr><td>ウイルス性疣贅（点状出血を伴う）</td>'
        '<td>乳頭状構造＋点状の黒色（血栓化した毛細血管）</td>'
        '<td>削ると点状出血</td></tr>'
        '<tr><td>色素沈着（機械的刺激・薬剤）</td><td>びまん性で構造に乏しい</td>'
        '<td>原因除去で軽快</td></tr></table>'
        '<span class="kw3">「足底の黒い斑を見たらダーモスコピーで汗孔の線を探す」'
        '——これが最短で最も確実な一手</span>である。'),
  point=('🎯 国試ポイント',
         '① 足底の黒色斑＝<span class="kw3">ダーモスコピーで鑑別</span>。<br>'
         '② <span class="kw3">平行溝パターン＝良性／平行隆線パターン＝悪性黒色腫</span>。<br>'
         '③ <span class="kw3">皮丘（隆線）には汗孔が並ぶ</span>——これが溝と丘の見分け方。<br>'
         '④ 足底血腫は<span class="kw4">数週で消退し、角層の伸長とともに遠位へ移動</span>。<br>'
         '⑤ 疑わしければ<span class="kw3">全切除生検</span>で確定する。')),

Q('101G-9', 57, [('bi', '📷')],
  '66歳の女性。右下腿の紅斑を主訴に来院した。'
  '<span class="kw">2年前に右下腿伸側に小紅斑</span>が出現した。'
  '<span class="kw">次第に拡大して現在のような病変を形成</span>した。'
  '<span class="kw">ときに軽い痒みがある</span>。'
  '皮膚病変の写真（A）とその生検H-E染色標本（B，C）とを示す。<br>'
  '<strong>治療法として適切なのはどれか。</strong>',
  [('a', '切除手術', True, '<span class="kw3">病理は表皮全層にわたる有棘細胞の異型'
                     '（核の大小不同・過染・極性の喪失、異常角化細胞、多核細胞）で、'
                     '基底膜は保たれている＝Bowen病（表皮内有棘細胞癌）</span>である。'
                     '<span class="kw3">治療の第一選択は外科的切除</span>で、'
                     '<span class="kw3">病変全体を病理検査に回すことで'
                     '真皮浸潤の有無も確認できる</span>'
                     '（<span class="kw">Q.183</span>）。'),
   ('b', 'PUVA療法', False, '<span class="kw4">PUVA療法は乾癬・菌状息肉症（早期）・'
                     '尋常性白斑・掌蹠膿疱症に用いる光線療法</span>である。'
                     '<span class="kw4">Bowen病は表皮内癌であり、'
                     '紫外線はその発症要因の一つ</span>。'
                     '<span class="kw4">照射すればDNA損傷を上乗せするだけで、'
                     'PUVAの長期・大量使用そのものが皮膚癌のリスクを上げる</span>。'),
   ('c', '抗真菌薬塗布', False, '<span class="kw4">体部白癬は辺縁が堤防状に隆起し'
                     '中心が治癒傾向を示す環状の紅斑</span>で、'
                     '<span class="kw4">KOH直接鏡検で菌糸を確認</span>して診断する。'
                     '<span class="kw4">Bowen病は白癬・湿疹と誤診されて'
                     '長期に外用治療されることが多い</span>——'
                     '<span class="kw4">本例の「2年かけて拡大」もその経過</span>だが、'
                     '生検で診断がついた以上、抗真菌薬に意味はない。'),
   ('d', 'エトレチナート内服', False, '<span class="kw4">エトレチナート（レチノイド）は'
                     '乾癬（膿疱性乾癬・尋常性乾癬）・魚鱗癬・Darier病などの'
                     '角化異常症に用いる</span>。'
                     '<span class="kw4">催奇形性が強く、女性では内服中止後2年間の避妊が必要</span>という点が'
                     '国試の頻出事項である。'
                     '<span class="kw4">Bowen病の標準治療ではない</span>。'),
   ('e', 'ビタミンD3軟膏塗布', False, '<span class="kw4">活性型ビタミンD3外用薬'
                     '（カルシポトリオール、マキサカルシトール）は'
                     '角化細胞の増殖抑制と分化誘導により尋常性乾癬に用いる</span>。'
                     '<span class="kw4">Bowen病には無効</span>。'
                     '<span class="kw4">本問の誤答の多く（正答率57％）は、'
                     '臨床写真の紅斑局面を乾癬と誤認したことによる</span>と考えられる。'
                     '<span class="kw4">写真ではなく病理（B，C）を根拠に判断する</span>のが正しい。')],
  '病理で表皮全層の異型＝Bowen病。治療は切除手術。PUVA・レチノイド・ビタミンD3はいずれも乾癬の治療で、本症には無効。',
  imgs=['images/101G-9_1.jpeg', 'images/101G-9_2.jpeg', 'images/101G-9_3.jpeg'],
  patho=('🧬 Bowen病と乾癬——「似た紅斑局面」をどう切り分けるか',
         '<span class="kw3">Bowen病は境界明瞭な紅褐色の局面として現れ、'
         '鱗屑・痂皮を伴うため乾癬とよく似る</span>。'
         '<span class="kw3">実際、本問の選択肢はPUVA・エトレチナート・ビタミンD3外用と'
         '「乾癬の治療」で固められており、'
         '出題者はこの誤認を試している</span>。<br>'
         '<span class="kw3">臨床での切り分け</span>——'
         '<span class="kw3">①数：Bowen病は単発が原則、乾癬は多発する。'
         '②左右対称性：Bowen病は片側性・非対称、乾癬は左右対称に分布する。'
         '③好発部位：乾癬は被髪頭部・肘頭・膝蓋・殿裂・爪（点状陥凹）と決まった場所に出る。'
         '④鱗屑の質：乾癬は銀白色の厚い雲母状鱗屑で、剝がすと点状出血（Auspitz現象）。'
         '⑤経過：乾癬は増悪と寛解を繰り返す。Bowen病は一方向に緩徐に拡大する。'
         '⑥治療反応：乾癬はステロイド・ビタミンD3外用に反応する</span>。<br>'
         '<span class="kw3">病理での切り分け</span>——'
         '<span class="kw3">【Bowen病】表皮全層の角化細胞に核異型・極性の消失・'
         '分裂像・異常角化細胞・多核細胞。基底膜は保たれる。'
         '【乾癬】錯角化、顆粒層の消失、表皮突起の規則的な棍棒状延長、'
         '真皮乳頭の毛細血管拡張と延長、角層内の好中球集簇（Munro微小膿瘍）。'
         '角化細胞に異型はない</span>。<br>'
         '<span class="kw3">結論として「臨床像が紛らわしいときは生検」</span>であり、'
         '<span class="kw3">本問では既に病理が提示されているのだから、'
         'そこから診断を確定して治療を選ぶ</span>のが正解への道筋である。'),
  deep=('📌 皮膚科の外用・内服治療の対応表（混同しやすいもの）',
        '<table class="tb"><tr><th>治療</th><th>適応</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">外科的切除</span></td>'
        '<td><span class="kw3">Bowen病、日光角化症、有棘細胞癌、基底細胞癌、悪性黒色腫</span></td>'
        '<td><span class="kw3">病理で断端と浸潤を評価できる</span></td></tr>'
        '<tr><td>活性型ビタミンD3外用</td><td>尋常性乾癬</td><td>角化細胞の分化誘導</td></tr>'
        '<tr><td>エトレチナート（レチノイド）</td><td>乾癬、魚鱗癬、Darier病</td>'
        '<td><span class="kw4">催奇形性。女性は中止後2年避妊</span></td></tr>'
        '<tr><td>PUVA／NB-UVB</td><td>乾癬、白斑、菌状息肉症（早期）、掌蹠膿疱症</td>'
        '<td><span class="kw4">長期大量で皮膚癌リスク</span></td></tr>'
        '<tr><td>イミキモド外用</td>'
        '<td><span class="kw3">日光角化症、尖圭コンジローマ、表在型基底細胞癌</span></td>'
        '<td>TLR7を介した免疫賦活</td></tr>'
        '<tr><td>5-FU外用</td><td>日光角化症、Bowen病</td><td>DNA合成阻害</td></tr>'
        '<tr><td>抗真菌薬外用</td><td>白癬、カンジダ、癜風</td>'
        '<td><span class="kw4">KOHで確認してから使う</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① Bowen病の治療＝<span class="kw3">外科的切除が第一選択</span>。<br>'
         '② <span class="kw4">PUVA・レチノイド・ビタミンD3外用は乾癬の治療</span>——Bowen病には無効。<br>'
         '③ 乾癬との違い＝<span class="kw3">単発・非対称・一方向に拡大・治療に反応しない</span>。<br>'
         '④ 病理＝<span class="kw3">Bowen病は全層異型／乾癬はMunro微小膿瘍と規則的な表皮突起延長</span>。<br>'
         '⑤ <span class="kw3">臨床写真ではなく病理を根拠に判断する</span>。')),

Q('100A-8', 99, [('bi', '📷')],
  '67歳の男性。陰部の赤い斑を主訴に来院した。'
  '<span class="kw">3年前から左の陰囊に痒みを伴う紅斑</span>が出現した。'
  '<span class="kw">市販の塗り薬で治療</span>していたが、'
  '<span class="kw">紅斑は次第に拡大</span>してきた。'
  '陰囊の写真（A）と生検H-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', 'Bowen病', False, '<span class="kw4">Bowen病も陰部に生じる表皮内癌で'
                     '臨床的には鑑別に挙がる</span>。'
                     'しかし<span class="kw4">病理は「表皮を構成する角化細胞そのものが'
                     '全層で異型を示す」</span>のに対し、'
                     '<span class="kw4">本例は表皮内に明るい胞体をもつ大型細胞が'
                     '孤在性・胞巣状に散在する</span>像であり異なる'
                     '（<span class="kw">Q.181</span>）。'),
   ('b', '基底細胞癌', False, '<span class="kw4">基底細胞癌は顔面正中に好発し、'
                     '陰囊はきわめてまれ</span>。'
                     '<span class="kw4">黒色光沢のある結節で中心が潰瘍化し、'
                     '病理は柵状配列と裂隙を伴う腫瘍胞巣</span>である。'),
   ('c', '悪性黒色腫', False, '<span class="kw4">悪性黒色腫であれば黒色調が主体</span>で、'
                     '<span class="kw4">病理は異型メラノサイトの増殖とメラニン顆粒、'
                     'S-100・HMB-45・Melan-A陽性</span>を示す。'
                     '<span class="kw4">3年かけて拡大する紅斑という提示に合致しない</span>。'),
   ('d', '単純性血管腫', False, '<span class="kw4">単純性血管腫（毛細血管奇形）は'
                     '出生時から存在する境界明瞭な鮮紅色〜暗赤色の斑</span>で、'
                     '<span class="kw4">自然消退せず、身体の成長に比例して大きくなるだけ</span>。'
                     '<span class="kw4">67歳で新たに出現して3年で拡大することはなく、'
                     '瘙痒も伴わない</span>。'),
   ('e', '乳房外Paget病', True, '<span class="kw3">①高齢男性の陰囊、'
                     '②3年にわたる「市販薬で治らない」経過、'
                     '③痒みを伴い緩徐に拡大する境界明瞭な紅色局面、'
                     '④病理で表皮内に明るく広い胞体と大型核をもつPaget細胞が散在</span>——'
                     '<span class="kw3">乳房外Paget病</span>である。'
                     '<span class="kw3">PAS陽性・CK7陽性・CEA陽性、S-100陰性</span>で確定し、'
                     '<span class="kw3">治療はマッピング生検を踏まえた広範切除</span>となる'
                     '（<span class="kw">Q.155</span>・<span class="kw">Q.170</span>）。')],
  '高齢男性の陰囊で市販薬に反応せず3年かけて拡大する痒い紅斑＋病理でPaget細胞＝乳房外Paget病。',
  imgs=['images/100A-8_1.jpeg', 'images/100A-8_2.jpeg'],
  patho=('🧬 陰囊の紅斑——「よくある疾患」で説明できないときに疑うもの',
         '<span class="kw3">陰囊・外陰の紅斑は日常的にありふれており、'
         'その大半は湿疹・接触皮膚炎・カンジダ症・股部白癬</span>である。'
         '<span class="kw3">しかしこれらはいずれも'
         '「適切な外用治療で数週間以内に改善する」</span>。'
         '<span class="kw3">3年間治らず拡大し続けたという事実そのものが、'
         'これらの診断を否定している</span>——'
         'これが本問（正答率99％）の骨格である。<br>'
         '<span class="kw3">陰部の紅斑の鑑別</span>——'
         '<span class="kw3">①股部白癬：辺縁が堤防状に隆起し中心が治癒傾向。'
         '大腿内側に広がるが陰囊は侵しにくい。KOHで菌糸。'
         '②皮膚カンジダ症：紅斑の辺縁に膜様の鱗屑と衛星病変（satellite lesion）。'
         '陰囊も侵す。KOHで仮性菌糸・胞子。'
         '③接触皮膚炎・湿疹：接触部位に一致。急性期は紅斑・小水疱・滲出。'
         '原因除去とステロイド外用で軽快。'
         '④疥癬（疥癬結節）：陰囊・陰茎の瘙痒性紅色結節。夜間に増悪。'
         '⑤乾癬（間擦部型）：鱗屑に乏しい境界明瞭な紅色局面。他部位の乾癬を伴う。'
         '⑥乳房外Paget病：緩徐に拡大する境界明瞭な紅色局面。白色調が混在。'
         '⑦Bowen病：紅褐色の局面</span>。<br>'
         '<span class="kw3">見分けの実際</span>——'
         '<span class="kw3">まずKOH直接鏡検で真菌を否定し、'
         'ステロイド外用への反応をみる。'
         '「数週間の適切な治療で改善しない」なら生検</span>。'
         '<span class="kw4">乳房外Paget病は診断までに平均数年を要するとされ、'
         'その遅れの大半は「湿疹として外用を続けたこと」による</span>。'
         '<span class="kw3">高齢者の外陰部の慢性紅斑には'
         '常に本症を鑑別に置いておく</span>ことが早期発見につながる。'),
  deep=('📌 乳房外Paget病の診療の流れ',
        '<table class="tb"><tr><th>段階</th><th>内容</th></tr>'
        '<tr><td>疑う</td>'
        '<td><span class="kw3">高齢者、外陰・肛囲・腋窩、境界明瞭な紅色局面、'
        '外用治療に反応せず緩徐に拡大</span></td></tr>'
        '<tr><td>確定</td>'
        '<td><span class="kw3">生検（Paget細胞のpagetoid spread）＋'
        '免疫染色 CK7＋／CEA＋／S-100−</span></td></tr>'
        '<tr><td>進展範囲の評価</td>'
        '<td><span class="kw3">マッピング生検（病変周囲を放射状に複数箇所生検）</span></td></tr>'
        '<tr><td>浸潤・転移の評価</td>'
        '<td><span class="kw3">結節・硬結があれば真皮浸潤を疑う。'
        '所属リンパ節エコー、CT。必要ならセンチネルリンパ節生検</span></td></tr>'
        '<tr><td>続発性の除外</td>'
        '<td><span class="kw4">肛囲病変では下部消化管内視鏡、'
        '陰茎周囲では膀胱鏡（約1割が下部尿路・直腸肛門癌の表皮内進展）</span></td></tr>'
        '<tr><td>治療</td>'
        '<td><span class="kw3">広範切除（1〜3cmマージン）＋再建。'
        '切除不能例では放射線・化学療法</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 乳房外Paget病＝<span class="kw3">高齢者の外陰・肛囲・腋窩の「治らない湿疹」</span>。<br>'
         '② <span class="kw3">数か月〜数年、外用治療に反応せず緩徐に拡大したら生検</span>。<br>'
         '③ 病理＝<span class="kw3">Paget細胞のpagetoid spread。CK7・CEA・PAS陽性</span>。<br>'
         '④ 治療＝<span class="kw3">マッピング生検＋広範切除</span>（再発しやすい）。<br>'
         '⑤ <span class="kw4">陰部の紅斑はまずKOHで真菌を否定する</span>のが実地の第一歩。')),

]

# @@END@@


# ============================================================
# レンダリング
# ============================================================

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 9),
    ('s3', 'A問題', '', 22),
    ('s4', 'B問題', '', 24),
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


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        'MEC皮膚科 第7章 悪性腫瘍 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#B45309')
                .replace('--orl:#FCE4EC', '--orl:#FEF3C7')
                .replace('--ord:#880E4F', '--ord:#78350F'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 皮膚科</div>'
        '<h1>第<span>7</span>章｜悪性腫瘍</h1>'
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
