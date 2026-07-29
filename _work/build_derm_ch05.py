# -*- coding: utf-8 -*-
"""
皮膚科 第5章「水疱・膿疱」(NO.99-121) の章別HTML(皮膚科/ch05_suihou_nouhou.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、産婦人科(obg)水準で作成。build_derm_ch04.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・皮膚科 皮Q-60〜77／PDF p.63-80)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.155-159) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

画像は20問33枚。図ラベル(A/B)は**ラベル文字の x 座標**で帰属を決めた
（NO.101・103・109 は紙面のテキスト順が "B A" だが、座標では左がA）。
p.74(NO.111/112)・p.75(NO.113/114) は同一ページに設問が2つあり、**y座標**で割り当てた。
⚠️ NO.106(108I-19) は蛍光抗体直接法の写真5枚（①〜⑤）が選択肢そのもの。
番号は画像に焼き込まれているので目視で確認した（①②③=抗IgA／④⑤=抗IgG、⑤が基底膜部線状＝正解）。
⚠️ NO.101(119F-50) と NO.114(111E-52) は**同一症例・同一写真・同一選択肢の別年度の問題**。
重複ではないので両方残し、画像はそれぞれの国試番号で保存してある。

複数選択は NO.105・110・113・115 の4問（いずれも2つ選べ）。
否定形は NO.107（誤っている組合せ）・NO.112（認められないもの）の2問。
**NO.109 は解答一覧表に正答率が無い**（rate=None → .cr を出さない。採点除外ではないので bx は付けない）。
必修バッジ(bh)は NO.112 の1問。CBTバッジ(bc)は NO.112・113 の2問。

本章の低正答率問題: NO.115(58%)・NO.105(61%)・NO.108(73%)・NO.114(76%)・NO.104(78%)。
水疱性類天疱瘡は NO.100・106・109・112・115・121、尋常性天疱瘡は NO.103・119、
落葉状天疱瘡は NO.104・117、掌蹠膿疱症は NO.102・108・111・113・116、
壊疽性膿皮症は NO.99・105・118・120 で繰り返し問われるので相互参照を張ってある。
「表皮細胞間IgG＝天疱瘡／表皮基底膜部の線状IgG＝類天疱瘡・後天性表皮水疱症」が本章最頻出の軸。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '皮膚科' / 'ch05_suihou_nouhou.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 99

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs or [], ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.99-102
# ============================================================
QUESTIONS += [

Q('120D-65', 96, [('bs', '★'), ('bi', '📷')],
  '25歳の女性。<span class="kw">右下腿の皮疹</span>を主訴に来院した。'
  '1週間前に右下腿に小丘疹が出現し、<span class="kw">搔破後に急速に潰瘍が拡大</span>した。'
  'その後、潰瘍は多発してきた。<span class="kw">潰瘍性大腸炎で治療中</span>である。'
  '体温36.1℃。下腿は<span class="kw">強い疼痛</span>を伴い、'
  '<span class="kw">潰瘍辺縁は紫紅色調</span>を呈している。'
  '<span class="kw">潰瘍部の細菌培養は陰性</span>。'
  '病変部の病理検査で<span class="kw">真皮に好中球の浸潤を多数認める</span>が、'
  '<span class="kw4">乾酪壊死を伴う類上皮細胞肉芽腫を認めない</span>。右下腿の皮疹の写真を示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '結節性紅斑', False, '<span class="kw4">下腿伸側に生じる有痛性の皮下結節・紅斑</span>で、'
                     '病理は<span class="kw4">中隔性脂肪織炎</span>。'
                     '<span class="kw4">潰瘍化しないのが原則</span>で、'
                     '数週で瘢痕を残さず消退する。'
                     '溶連菌感染・サルコイドーシス・Behçet病・IBDなどに伴う。'
                     '本例のような<span class="kw4">深く穿掘性の潰瘍は作らない</span>。'),
   ('b', '硬結性紅斑', False, '<span class="kw4">Bazin硬結性紅斑</span>は'
                     '<span class="kw4">結核疹（結核アレルギー）の一型</span>で、'
                     '<span class="kw4">中年女性の下腿屈側（ふくらはぎ）</span>に皮下結節を生じ、'
                     '潰瘍化することもある。'
                     '病理は<span class="kw4">小葉性脂肪織炎＋乾酪壊死を伴う類上皮細胞肉芽腫・血管炎</span>で、'
                     '<span class="kw4">本例は「乾酪壊死を伴う類上皮細胞肉芽腫を認めない」と明記されており否定できる</span>。'
                     'この一文は硬結性紅斑を消すために置かれている。'),
   ('c', '壊死性筋膜炎', False, '<span class="kw4">A群β溶血性レンサ球菌などによる劇症の深部軟部組織感染</span>。'
                     '<span class="kw4">高熱・ショック・急速に進行する壊死</span>を呈し、'
                     '<span class="kw4">見た目に不釣り合いな激痛</span>が特徴で緊急デブリドマンを要する。'
                     '本例は<span class="kw4">体温36.1℃と平熱で全身状態が保たれ、細菌培養も陰性</span>であり合致しない。'),
   ('d', '壊疽性膿皮症', True, '<span class="kw3">潰瘍性大腸炎に合併し、軽微な外傷（搔破）を契機に'
                     '急速に拡大する有痛性潰瘍</span>——典型的な壊疽性膿皮症である。'
                     '<span class="kw3">潰瘍辺縁が紫紅色調に堤防状に隆起し、'
                     '細菌培養陰性、病理で真皮に好中球が密に浸潤する（好中球性皮膚症）</span>という'
                     '3点がそろっている。'
                     '<span class="kw3">外傷部位に新病変を生じる pathergy〈パーサジー〉現象</span>が'
                     '「搔破後に急速に拡大」という記載に表れている。'),
   ('e', '血栓性静脈炎', False, '<span class="kw4">表在静脈に沿った索状の発赤・硬結・圧痛</span>を呈する。'
                     '<span class="kw4">静脈の走行に一致した線状の病変</span>であることが決め手で、'
                     '<span class="kw4">深い穿掘性潰瘍を多発させることはない</span>。'
                     'Behçet病や悪性腫瘍（Trousseau症候群）で反復する点は押さえておく。')],
  '潰瘍性大腸炎の患者に、搔破を契機として急速拡大する有痛性潰瘍。辺縁は紫紅色、培養陰性、真皮に好中球浸潤。壊疽性膿皮症。',
  imgs=['images/120D-65_1.jpeg'],
  patho=('🔥 壊疽性膿皮症——「感染していない好中球の暴走」',
         '<span class="kw3">壊疽性膿皮症〈pyoderma gangrenosum〉は、名前に「膿皮症」とあるが'
         '感染症ではない</span>。'
         '<span class="kw3">自然免疫の過剰活性化（自己炎症）により好中球が皮膚へ大量に動員され、'
         '組織を融解させる好中球性皮膚症〈neutrophilic dermatosis〉</span>である。'
         '<span class="kw3">同じ仲間がSweet病（急性熱性好中球性皮膚症）・Behçet病の皮膚病変</span>で、'
         'いずれも<span class="kw3">「培養陰性なのに膿が出る」「ステロイドで良くなる」</span>という'
         '共通の顔をもつ。<br>'
         '<span class="kw3">経過は特徴的である</span>。'
         '<span class="kw3">①小さな膿疱・丘疹や毛囊炎様の病変で始まり、'
         '②急速に融解して潰瘍化し、'
         '③辺縁が紫紅色〜暗紅色に堤防状（undermined border＝辺縁が内側へえぐれる）に隆起し、'
         '④強い疼痛を伴って遠心性に拡大する</span>。'
         '<span class="kw3">好発部位は下腿</span>で、'
         '<span class="kw3">治癒しても篩状〈しじょう・cribriform〉瘢痕を残す</span>。<br>'
         '<span class="kw3">最大の臨床的落とし穴が pathergy（パーサジー）現象</span>である。'
         '<span class="kw3">針穿刺・手術・デブリドマンなど、わずかな機械的刺激で新しい病変が誘発され、'
         '潰瘍がかえって拡大する</span>。'
         '<span class="kw3">「感染だと思ってデブリドマンをしたら悪化した」というのが典型的な誤診のパターン</span>で、'
         '本例の「搔破後に急速に潰瘍が拡大した」もこれにあたる。'
         '<span class="kw4">したがって治療は外科的切除ではなく、'
         '副腎皮質ステロイド全身投与を主体とする免疫抑制療法（＋シクロスポリン、'
         '難治例には抗TNF-α抗体）</span>である。<br>'
         '<span class="kw3">診断は除外診断</span>で、'
         '<span class="kw3">①細菌・真菌・抗酸菌培養が陰性であること、'
         '②病理で真皮に好中球のびまん性浸潤を認めること、'
         '③感染・血管炎・悪性腫瘍・血管閉塞を否定すること</span>が要件になる。'
         '<span class="kw3">病理所見そのものに特異性はない</span>ため、'
         '<span class="kw3">「培養陰性＋好中球浸潤＋基礎疾患」の組合せで診断に迫る</span>。'),
  deep=('📌 下腿潰瘍の鑑別——「基礎疾患」と「潰瘍の顔つき」で切る',
        '<table class="tb"><tr><th>疾患</th><th>潰瘍の特徴</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">壊疽性膿皮症</span></td>'
        '<td><span class="kw3">紫紅色に隆起した辺縁・強い疼痛・急速拡大</span></td>'
        '<td><span class="kw3">IBD/血液疾患の合併・培養陰性・好中球浸潤・pathergy</span></td></tr>'
        '<tr><td>静脈うっ滞性潰瘍</td><td>下腿内側下1/3、浅く辺縁平坦、色素沈着・浮腫を伴う</td>'
        '<td>静脈瘤・下肢挙上で軽快</td></tr>'
        '<tr><td>動脈性（虚血性）潰瘍</td><td>足趾・踵に打ち抜き様、疼痛は安静時に増悪</td>'
        '<td>ABI低下・脈拍触知不良</td></tr>'
        '<tr><td>糖尿病性足潰瘍</td><td>足底の胼胝下に無痛性の穿孔性潰瘍</td>'
        '<td><span class="kw4">神経障害のため痛くない</span></td></tr>'
        '<tr><td>Behçet病</td><td>陰部潰瘍・口腔アフタ・毛囊炎様皮疹</td>'
        '<td><span class="kw3">針反応（pathergy）陽性</span>・ぶどう膜炎</td></tr>'
        '<tr><td>硬結性紅斑（Bazin）</td><td>下腿屈側の皮下硬結が潰瘍化</td>'
        '<td><span class="kw4">乾酪壊死を伴う肉芽腫・結核</span></td></tr>'
        '<tr><td>壊死性筋膜炎</td><td>急速な壊死、皮膚所見に不釣り合いな激痛</td>'
        '<td><span class="kw4">高熱・ショック・緊急手術</span></td></tr></table>'
        '<span class="kw3">国試では「潰瘍性大腸炎／Crohn病で治療中」＋「下腿の有痛性潰瘍」＋「培養陰性」の3語が'
        '出た瞬間に壊疽性膿皮症でよい</span>（<span class="kw">Q.118</span>・'
        '<span class="kw">Q.120</span>も同型）。'
        '逆に<span class="kw4">「乾酪壊死を伴う肉芽腫」があれば結核（硬結性紅斑・尋常性狼瘡）</span>、'
        '<span class="kw4">「高熱・ショック」があれば壊死性筋膜炎</span>と切り替える。'),
  point=('🎯 国試ポイント',
         '① 壊疽性膿皮症は<span class="kw3">感染症ではなく好中球性皮膚症</span>。'
         '<span class="kw3">培養陰性・真皮に好中球浸潤</span>。<br>'
         '② 潰瘍は<span class="kw3">紫紅色の堤防状辺縁・強い疼痛・急速拡大</span>、好発は下腿。<br>'
         '③ <span class="kw3">pathergy現象</span>——'
         '<span class="kw4">デブリドマン・生検などの刺激で増悪</span>するため、'
         '<span class="kw4">外科的切除は禁忌に近い</span>。治療は<span class="kw3">ステロイド全身投与</span>。<br>'
         '④ 合併疾患＝<span class="kw3">炎症性腸疾患（UC＞Crohn）・関節リウマチ・'
         '血液疾患（骨髄異形成症候群、白血病、IgA型M蛋白血症）・Behçet病・高安動脈炎</span>'
         '（<span class="kw">Q.105</span>）。<br>'
         '⑤ 鑑別で<span class="kw4">「乾酪壊死＋類上皮細胞肉芽腫」なら結核（硬結性紅斑）</span>、'
         '<span class="kw4">高熱・ショックなら壊死性筋膜炎</span>。')),

Q('119D-63', 82, [('bs', '★'), ('bi', '📷')],
  '80歳の男性。皮疹を主訴に来院した。3週間前から、'
  '<span class="kw">体幹および四肢に水疱やびらんが出現</span>し、徐々に増数、拡大してきたため受診した。'
  '皮膚生検組織のH-E染色標本を示す。'
  '<span class="kw">蛍光抗体直接法で表皮基底膜部にIgGとC3との線状沈着</span>を認める。'
  '<span class="kw">食塩水処理皮膚を用いた蛍光抗体間接法で表皮側にIgGの陽性反応</span>を認める。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '尋常性天疱瘡', False, '<span class="kw4">抗デスモグレイン3抗体による表皮内水疱症</span>。'
                     '蛍光抗体直接法では<span class="kw4">表皮細胞間に網目状（レース状）のIgG沈着</span>を'
                     '認めるのであって、<span class="kw4">基底膜部の線状沈着ではない</span>。'
                     '口腔粘膜のびらんで初発する点も本例と合わない（<span class="kw">Q.103</span>）。'),
   ('b', '水疱性類天疱瘡', True, '<span class="kw3">高齢者・体幹四肢の緊満性水疱・基底膜部にIgGとC3の線状沈着</span>で'
                     '類天疱瘡群と決まり、'
                     '<span class="kw3">食塩水処理皮膚（salt-split skin）で抗体が「表皮側」に付いた</span>ことから'
                     '<span class="kw3">水疱性類天疱瘡</span>と確定する。'
                     '<span class="kw3">標的抗原BP180（XVII型コラーゲン）・BP230はヘミデスモソームの構成蛋白で、'
                     '人工的な裂隙より表皮側に位置する</span>ためである。'),
   ('c', 'Hailey-Hailey病', False, '<span class="kw4">ATP2C1遺伝子（ゴルジ体Ca²⁺ポンプSPCA1）変異による'
                     '常染色体顕性遺伝の棘融解性疾患</span>＝家族性良性慢性天疱瘡。'
                     '<span class="kw4">間擦部（腋窩・鼠径・頸部）にびらん・亀裂を生じ、'
                     '自己抗体は陰性（蛍光抗体法で沈着を認めない）</span>。'
                     '本例は80歳発症で家族歴の記載もなく、抗体陽性である。'),
   ('d', '後天性表皮水疱症', False, '<span class="kw4">抗Ⅶ型コラーゲン抗体</span>による'
                     '<span class="kw4">後天性の表皮下水疱症</span>。'
                     '直接法では類天疱瘡と同じく<span class="kw4">基底膜部に線状のIgG沈着</span>を示すため'
                     'ここまでは区別できないが、'
                     '<span class="kw4">Ⅶ型コラーゲンは基底板より下（係留線維）にあるため、'
                     'salt-split skinでは抗体が「真皮側」に付く</span>。'
                     '<span class="kw4">本例は表皮側なので否定される</span>——この1点が本問の核心である。'),
   ('e', '先天性表皮水疱症', False, '<span class="kw4">表皮水疱症〈EB〉は基底膜部構成蛋白の遺伝子変異による'
                     '先天性の機械的脆弱性疾患</span>。'
                     '<span class="kw4">出生時〜乳児期から、摩擦部位に水疱・びらんを反復</span>する。'
                     '<span class="kw4">自己抗体は関与しないので蛍光抗体法でIgG沈着は認めない</span>。'
                     '80歳の新規発症という時点で除外できる。')],
  '高齢男性の体幹四肢の水疱・びらん。基底膜部にIgG・C3の線状沈着、salt-split skinで表皮側。水疱性類天疱瘡。',
  imgs=['images/119D-63_1.jpeg'],
  patho=('🧬 水疱性類天疱瘡——ヘミデスモソームが攻撃される',
         '<span class="kw3">水疱性類天疱瘡〈bullous pemphigoid〉は、'
         '表皮基底細胞を基底膜に繋ぎ止めるヘミデスモソームの構成蛋白'
         '（BP180＝XVII型コラーゲン、BP230）に対する自己抗体（IgG）による'
         '表皮下水疱症</span>である。'
         '<span class="kw3">自己抗体が結合すると補体が活性化され、'
         '好酸球・好中球が集まって放出する蛋白分解酵素が基底膜部を切断する</span>。'
         '<span class="kw3">裂隙が表皮の「下」にできるので、水疱の天井は表皮全層＝厚くて破れにくい</span>。'
         'これが<span class="kw3">緊満性水疱でNikolsky現象が陰性</span>である理由である。<br>'
         '<span class="kw3">臨床像</span>は'
         '<span class="kw3">高齢者（70〜80歳代）に好発し、強い瘙痒を伴う浮腫性紅斑（蕁麻疹様紅斑）が先行して、'
         'その上に緊満性水疱が多発</span>する。'
         '<span class="kw3">粘膜疹は乏しい（あっても軽度）</span>のが'
         '<span class="kw3">口腔粘膜から始まる尋常性天疱瘡との大きな違い</span>である。'
         '<span class="kw3">末梢血好酸球増多</span>を伴うことが多い。'
         '<span class="kw4">DPP-4阻害薬（グリプチン系の糖尿病薬）による薬剤誘発性</span>が'
         '近年よく問われるので、高齢者の水疱症では内服歴を必ず確認する。<br>'
         '<span class="kw3">検査は三段構え</span>で覚える。'
         '<span class="kw3">①病理＝表皮下水疱＋好酸球浸潤、'
         '②蛍光抗体直接法＝基底膜部にIgG・C3の線状沈着、'
         '③血清＝抗BP180抗体（ELISA）が陽性で疾患活動性と相関する</span>'
         '（<span class="kw">Q.112</span>では421U/mLと高値であった）。'
         '<span class="kw3">治療はステロイド外用・全身投与が基本</span>で、'
         '<span class="kw3">軽症〜中等症ではテトラサイクリン＋ニコチン酸アミド、DDS（ジアフェニルスルホン）</span>、'
         '重症例には免疫抑制薬・IVIg・血漿交換を用いる。'),
  deep=('📌 食塩水処理皮膚〈salt-split skin〉法——「表皮側か真皮側か」で1問',
        '<span class="kw3">1M食塩水に正常皮膚を浸すと、透明層〈lamina lucida〉で人工的に裂ける</span>。'
        'この標本に患者血清を反応させると、'
        '<span class="kw3">標的抗原がその裂隙より上（表皮側）にあるか下（真皮側）にあるかで'
        '蛍光の付く場所が分かれる</span>。'
        '<table class="tb"><tr><th>salt-split</th><th>疾患</th><th>標的抗原</th><th>抗原の局在</th></tr>'
        '<tr><td><span class="kw3">表皮側〈epidermal side〉</span></td>'
        '<td><span class="kw3">水疱性類天疱瘡</span>／妊娠性類天疱瘡</td>'
        '<td><span class="kw3">BP180（XVII型コラーゲン）・BP230</span></td>'
        '<td>ヘミデスモソーム〜透明層上部</td></tr>'
        '<tr><td><span class="kw3">真皮側〈dermal side〉</span></td>'
        '<td><span class="kw3">後天性表皮水疱症</span>／水疱性エリテマトーデス</td>'
        '<td><span class="kw3">Ⅶ型コラーゲン</span></td>'
        '<td><span class="kw3">緻密層下の係留線維〈anchoring fibril〉</span></td></tr>'
        '<tr><td>両側〜真皮側</td><td>抗ラミニン332型粘膜類天疱瘡</td><td>ラミニン332</td>'
        '<td>透明層下部</td></tr></table>'
        '<span class="kw3">「BPは上、EBAは下」——基底膜部の解剖の順番'
        '（ヘミデスモソーム→透明層→緻密層→係留線維）をそのまま使えばよい</span>。'
        '<span class="kw4">直接法だけではこの2疾患は区別できない</span>ので、'
        '<span class="kw4">「基底膜部に線状IgG」と書かれた問題で選択肢に両方あるときは、'
        'salt-split skinの結果か臨床像（EBAは外傷部位・手足に瘢痕を残す、Crohn病に合併）を探す</span>。'
        '<span class="kw">Q.115</span>は「基底膜部にIgGが沈着する疾患を2つ」でこの2疾患を並べて問い、'
        '<span class="kw">Q.121</span>は本問とまったく同じ salt-split の設定である。'),
  point=('🎯 国試ポイント',
         '① 水疱性類天疱瘡＝<span class="kw3">高齢者・緊満性水疱・強い瘙痒・粘膜疹は乏しい・'
         'Nikolsky陰性・好酸球増多</span>。<br>'
         '② 直接法＝<span class="kw3">基底膜部にIgGとC3の線状沈着</span>、'
         '病理＝<span class="kw3">表皮下水疱</span>、血清＝<span class="kw3">抗BP180抗体</span>。<br>'
         '③ <span class="kw3">salt-split skinで表皮側＝水疱性類天疱瘡、真皮側＝後天性表皮水疱症'
         '（抗Ⅶ型コラーゲン）</span>。<br>'
         '④ <span class="kw4">DPP-4阻害薬による薬剤誘発性</span>を必ず疑う。<br>'
         '⑤ 治療＝ステロイド（外用・全身）、軽症はテトラサイクリン＋ニコチン酸アミドやDDS。')),

Q('119F-50', 92, [('bs', '★'), ('bi', '📷')],
  '45歳の男性。2か月前から生じた<span class="kw">右腋窩の皮疹</span>を主訴に来院した。'
  '<span class="kw">被覆皮膚と癒着し波動を触れる径20mmの皮疹</span>を認める。'
  '腋窩の写真（A）と皮疹部の超音波像（B）とを示す。<br>'
  '<strong>この皮疹の種類はどれか。</strong>',
  [('a', '丘　疹', False, '<span class="kw4">直径10mm未満の充実性の小隆起</span>。'
                     '<span class="kw4">内部に液体を含まないので波動は触れず、超音波でも内部は充実性</span>。'
                     '本例は径20mmで波動があり合致しない。'),
   ('b', '苔　癬', False, '<span class="kw4">小丘疹が多数集簇して面をなした状態</span>を指す用語で、'
                     '扁平苔癬・光沢苔癬などに用いる。'
                     '<span class="kw4">単発の隆起性病変を指す語ではない</span>。'),
   ('c', '囊　腫', True, '<span class="kw3">上皮に裏打ちされた袋状の構造の中に、'
                     '角質・液体・粥状物などの内容物が貯留したもの</span>。'
                     '<span class="kw3">触診で波動を触れ、超音波では境界明瞭な低〜等エコーの'
                     '腫瘤として後方エコー増強を伴う</span>。'
                     '<span class="kw3">腋窩・背部・耳後部に好発し、被覆皮膚と癒着して中央に開口部（黒点）をもつ</span>のが'
                     '<span class="kw3">表皮囊腫〈粉瘤・アテローム〉</span>の典型像である。'),
   ('d', '膿　疱', False, '<span class="kw4">内部に膿（好中球）を入れた、直径数mm程度の小水疱</span>。'
                     '<span class="kw4">表皮内〜角層下の浅い病変</span>で、'
                     '<span class="kw4">径20mmの皮下腫瘤を指す語ではない</span>。'
                     '掌蹠膿疱症・膿疱性乾癬などで見る（<span class="kw">Q.116</span>）。'),
   ('e', '膨　疹', False, '<span class="kw4">真皮上層の一過性の浮腫による扁平隆起＝蕁麻疹の皮疹</span>。'
                     '<span class="kw4">数十分〜24時間以内に跡を残さず消退する</span>のが定義上の要件で、'
                     '2か月持続する本例とは相容れない。')],
  '被覆皮膚と癒着し波動を触れる径20mmの腋窩腫瘤。超音波で境界明瞭な内容物貯留。皮疹の種類は囊腫（表皮囊腫）。',
  imgs=['images/119F-50_1.jpeg', 'images/119F-50_2.jpeg'],
  patho=('📖 発疹学——「原発疹」を定義から引き直す',
         '<span class="kw3">皮膚科の設問は「診断名」ではなく「皮疹の種類（発疹名）」を'
         '問うことがあり、定義の暗記がそのまま得点になる</span>。'
         '<span class="kw3">原発疹は、内容物の有無・大きさ・深さ・経過の4点で機械的に分類できる</span>。'
         '<table class="tb"><tr><th>発疹</th><th>定義</th><th>代表例</th></tr>'
         '<tr><td>斑〈macule〉</td><td>隆起も陥凹もない色調変化のみ</td><td>紅斑・紫斑・色素斑・白斑</td></tr>'
         '<tr><td>丘疹〈papule〉</td><td><span class="kw3">10mm未満</span>の充実性隆起</td>'
         '<td>扁平苔癬・尋常性疣贅</td></tr>'
         '<tr><td>結節〈nodule〉／腫瘤</td><td>10mmを超える充実性隆起（大きいものは腫瘤）</td>'
         '<td>結節性紅斑・皮膚腫瘍</td></tr>'
         '<tr><td>膨疹〈wheal〉</td><td><span class="kw3">真皮上層の一過性浮腫。24時間以内に消退</span></td>'
         '<td><span class="kw3">蕁麻疹</span></td></tr>'
         '<tr><td>水疱〈bulla/vesicle〉</td><td><span class="kw3">透明な液体（漿液）を入れた隆起</span>。'
         '小さいものが小水疱</td><td>類天疱瘡・帯状疱疹</td></tr>'
         '<tr><td>膿疱〈pustule〉</td><td><span class="kw3">膿（好中球）を入れた小隆起</span></td>'
         '<td>掌蹠膿疱症・膿疱性乾癬</td></tr>'
         '<tr><td>血疱</td><td>内容が血性の水疱</td><td>外傷・帯状疱疹・類天疱瘡</td></tr>'
         '<tr><td><span class="kw3">囊腫〈cyst〉</span></td>'
         '<td><span class="kw3">上皮に裏打ちされた袋の中に内容物が貯留。波動を触れる</span></td>'
         '<td><span class="kw3">表皮囊腫（粉瘤）・毛根鞘囊腫</span></td></tr></table>'
         '<span class="kw3">「波動を触れる」は液体・粥状物の貯留を意味する診察所見</span>で、'
         '<span class="kw3">充実性の丘疹・結節との決定的な違い</span>になる。'),
  deep=('📌 表皮囊腫〈粉瘤・アテローム〉の実際',
        '<span class="kw3">表皮囊腫は、表皮成分が真皮内に迷入して袋を作り、'
        '内部に角質（ケラチン）が溜まったもの</span>である。'
        '<span class="kw3">体幹・顔面・頸部・腋窩・背部に好発</span>し、'
        '<span class="kw3">中央に黒点状の開口部（punctum）を認め、圧すると悪臭のある粥状物が出る</span>。'
        '<span class="kw3">被覆皮膚と癒着している</span>のは、'
        '<span class="kw3">囊腫壁が開口部で表皮と連続しているから</span>で、'
        '本問の「被覆皮膚と癒着し」という記載はこれを指している。<br>'
        '<span class="kw3">超音波では境界明瞭な類円形の低〜等エコー腫瘤で、後方エコー増強を伴う</span>。'
        '脂肪腫（皮下の扁平な等〜高エコー、可動性良好、開口部なし）や'
        'リンパ節腫大（門構造をもつ）との鑑別に用いる。<br>'
        '<span class="kw3">治療は囊腫壁ごとの摘出</span>で、'
        '<span class="kw4">壁を残すと必ず再発する</span>。'
        '<span class="kw4">感染・破裂して炎症性粉瘤になっている急性期は、まず切開排膿と抗菌薬で炎症を鎮め、'
        '消退後に摘出する</span>のが原則である。<br>'
        '<span class="kw4">腋窩の腫瘤という点では、化膿性汗腺炎〈hidradenitis suppurativa〉も鑑別に挙がる</span>。'
        'こちらは<span class="kw4">腋窩・鼠径・殿部に多発する有痛性結節・膿瘍・瘻孔・索状瘢痕</span>を'
        '反復するのが特徴で、喫煙・肥満が増悪因子である。'
        '<span class="kw">Q.114（111E-52）はこの問題とまったく同一の症例・写真・選択肢</span>で、'
        '同じ問題が年度を変えて出題された好例である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">波動を触れる＝内部に液体・粥状物 ⇒ 囊腫</span>。'
         '充実性なら丘疹・結節。<br>'
         '② <span class="kw3">膨疹は「24時間以内に消退する一過性の浮腫」</span>——'
         '<span class="kw4">持続する病変には使えない</span>。<br>'
         '③ 表皮囊腫＝<span class="kw3">中央に開口部（黒点）、被覆皮膚と癒着、悪臭のある粥状内容</span>。'
         '<span class="kw3">治療は囊腫壁ごと摘出（壁を残すと再発）</span>。<br>'
         '④ 超音波＝<span class="kw3">境界明瞭・後方エコー増強</span>。脂肪腫やリンパ節と区別。<br>'
         '⑤ 腋窩の反復する有痛性結節・瘻孔なら<span class="kw">化膿性汗腺炎</span>を考える。')),

]

QUESTIONS += [

Q('118A-45', 94, [('bs', '★'), ('bi', '📷')],
  '50歳の女性。<span class="kw">両手掌と両足底の皮疹</span>を主訴に来院した。'
  '数年前から両手掌と両足底の皮疹が出現し<span class="kw">消長を繰り返す</span>。瘙痒と疼痛がある。'
  '<span class="kw">しばしば扁桃炎に罹患</span>する。'
  '<span class="kw">喫煙は20本/日を30年間</span>。'
  '<span class="kw">皮疹部の真菌検査は陰性</span>。右手掌の写真（A）と右足の写真（B）を示す。<br>'
  '<strong>この患者に合併しやすい関節炎の部位はどれか。</strong>',
  [('a', '顎関節', False, '<span class="kw4">顎関節炎は関節リウマチや若年性特発性関節炎で問題になる</span>が、'
                     '<span class="kw4">掌蹠膿疱症性骨関節炎の主座ではない</span>。'),
   ('b', '胸鎖関節', True, '<span class="kw3">掌蹠膿疱症の約10〜30％に掌蹠膿疱症性骨関節炎〈PAO〉を合併し、'
                     'その主座が前胸壁——胸鎖関節・胸肋関節・胸骨柄体結合</span>である。'
                     '<span class="kw3">前胸部痛と同部の骨性肥厚・熱感・圧痛</span>を呈し、'
                     '<span class="kw3">骨シンチグラフィで胸鎖関節部に「牛の頭〈bull\'s head〉サイン」</span>と'
                     '呼ばれる特徴的な集積を示す。'),
   ('c', '遠位指節間関節', False, '<span class="kw4">DIP関節炎といえば乾癬性関節炎（と変形性関節症のHeberden結節）</span>。'
                     '<span class="kw4">乾癬性関節炎は爪病変を伴うDIP型が典型</span>で、'
                     '掌蹠膿疱症で最も問われる部位ではない。'
                     'なお<span class="kw">Q.111</span>では近位指節間関節の腫脹・圧痛も併記されているが、'
                     '<span class="kw">診断の決め手はやはり胸鎖関節の所見</span>である。'),
   ('d', '仙腸関節', False, '<span class="kw4">仙腸関節炎は強直性脊椎炎をはじめとする脊椎関節炎の中核所見</span>。'
                     'PAOでも仙腸関節が侵されることはあるが、'
                     '<span class="kw4">「掌蹠膿疱症といえば前胸壁」が第一に問われる</span>。'),
   ('e', '足関節', False, '<span class="kw4">足関節炎は反応性関節炎・痛風・関節リウマチなどで生じる</span>。'
                     '掌蹠膿疱症に特徴的な部位ではない。')],
  '掌蹠に消長する無菌性膿疱、扁桃炎の反復、ヘビースモーカー、真菌陰性＝掌蹠膿疱症。合併する関節炎は前胸壁（胸鎖関節）。',
  imgs=['images/118A-45_1.jpeg', 'images/118A-45_2.jpeg'],
  patho=('🦶 掌蹠膿疱症——「無菌性膿疱＋病巣感染＋喫煙」',
         '<span class="kw3">掌蹠膿疱症〈palmoplantar pustulosis〉は、'
         '手掌・足底に無菌性の膿疱と鱗屑・紅斑が'
         '週〜月単位で新生と消退を繰り返す慢性難治性の疾患</span>である。'
         '<span class="kw3">膿疱は無菌</span>で、'
         '<span class="kw3">病理では表皮内（角層下）に好中球が集簇した'
         '海綿状膿疱〈Kogoj海綿状膿疱〉</span>を認める（<span class="kw">Q.108</span>）。'
         '<span class="kw3">真菌検査（KOH直接鏡検）が陰性であることが必須</span>で、'
         '<span class="kw3">足白癬（小水疱型）との鑑別</span>にこれを行う'
         '（<span class="kw">Q.113</span>）。<br>'
         '<span class="kw3">3大増悪因子＝①病巣感染、②喫煙、③金属アレルギー</span>で、'
         'いずれも国試の解答になる。'
         '<span class="kw3">①病巣感染は慢性扁桃炎が代表</span>で、'
         '<span class="kw3">歯性感染（根尖病巣・歯周炎）や副鼻腔炎</span>も原因となる。'
         '<span class="kw3">扁桃摘出術で皮疹・関節症状ともに改善することがあり、治療選択肢になる</span>。'
         '<span class="kw3">②喫煙者が圧倒的に多く、禁煙が治療の一部</span>である（本例は30年間20本/日）。'
         '<span class="kw3">③歯科金属（パラジウム・ニッケル・水銀など）による'
         '全身型金属アレルギーがパッチテストで検出される</span>ことがあり、'
         '金属除去で軽快する例がある。<br>'
         '<span class="kw3">最重要の合併症が掌蹠膿疱症性骨関節炎〈PAO〉</span>である。'
         '<span class="kw3">胸鎖関節・胸肋関節・胸骨柄体結合といった前胸壁</span>に'
         '<span class="kw3">疼痛・腫脹・骨性肥厚・熱感</span>を生じ、'
         '<span class="kw3">骨シンチで前胸壁に左右対称の集積（bull\'s headサイン）</span>を示す。'
         '<span class="kw3">SAPHO症候群（Synovitis, Acne, Pustulosis, Hyperostosis, Osteitis）の'
         '一部</span>として位置づけられる。'
         '<span class="kw4">皮疹より先に前胸部痛だけで整形外科・循環器を受診することがあり、'
         '「原因不明の前胸部痛＋手掌の皮疹」から拾い上げる</span>のが国試の頻出パターンである'
         '（<span class="kw">Q.111</span>）。'),
  deep=('📌 掌蹠に膿疱・小水疱を作る疾患の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>鍵となる所見</th><th>検査</th></tr>'
        '<tr><td><span class="kw3">掌蹠膿疱症</span></td>'
        '<td><span class="kw3">無菌性膿疱が消長を繰り返す・扁桃炎・喫煙・前胸部痛</span></td>'
        '<td><span class="kw3">KOH陰性・膿疱は無菌・病理でKogoj海綿状膿疱</span></td></tr>'
        '<tr><td>足白癬（小水疱型）</td><td>片側性のことが多い、瘙痒、足趾間病変</td>'
        '<td><span class="kw3">KOH直接鏡検で菌糸陽性</span></td></tr>'
        '<tr><td>汗疱／異汗性湿疹</td><td>手掌・側縁の小水疱、夏に悪化、膿疱化しない</td>'
        '<td>KOH陰性</td></tr>'
        '<tr><td>膿疱性乾癬（汎発型）</td><td><span class="kw4">発熱・全身の紅皮症上に無菌性膿疱が多発</span></td>'
        '<td>入院加療を要する重症疾患</td></tr>'
        '<tr><td>手掌の梅毒性乾癬（第2期梅毒）</td><td><span class="kw4">手掌・足底の落屑性紅斑、無症候</span></td>'
        '<td>梅毒血清反応</td></tr>'
        '<tr><td>掌蹠角化症</td><td>びまん性の角化・亀裂、膿疱なし</td><td>遺伝性・家族歴</td></tr></table>'
        '<span class="kw3">治療は、①禁煙・扁桃摘出・歯科金属除去などの誘因除去、'
        '②ステロイド外用・活性型ビタミンD3外用、③紫外線療法（PUVA・エキシマ）、'
        '④重症例・PAO合併例にはレチノイド内服や生物学的製剤（抗IL-23抗体グセルクマブが本邦で保険適用）</span>と'
        '段階的に進める。'
        '<span class="kw3">本例のように喫煙歴と扁桃炎が明記されている症例では、'
        '禁煙指導と耳鼻科紹介が現実の第一歩</span>になる。'),
  point=('🎯 国試ポイント',
         '① 掌蹠膿疱症＝<span class="kw3">手掌・足底の無菌性膿疱、消長を繰り返す、KOH陰性</span>。<br>'
         '② 3大誘因＝<span class="kw3">病巣感染（慢性扁桃炎・歯性感染）／喫煙／歯科金属アレルギー</span>。<br>'
         '③ 合併＝<span class="kw3">掌蹠膿疱症性骨関節炎〈PAO〉。主座は前胸壁＝胸鎖関節・胸肋関節</span>。'
         '<span class="kw3">骨シンチでbull\'s headサイン</span>。<br>'
         '④ <span class="kw3">SAPHO症候群</span>の一部（滑膜炎・痤瘡・膿疱症・骨化過形成・骨炎）。<br>'
         '⑤ <span class="kw4">DIP関節＝乾癬性関節炎、仙腸関節＝強直性脊椎炎</span>と混同しない。')),

]

# ============================================================
# B問題（★問題） NO.103-109
# ============================================================
QUESTIONS += [

Q('115D-60', 90, [('bs', '★'), ('bi', '📷')],
  '73歳の女性。<span class="kw">口腔粘膜疹と皮疹</span>を主訴に来院した。'
  '<span class="kw">2か月前から口腔粘膜にびらんを生じ、摂食時に疼痛</span>を伴うようになった。'
  '自宅近くの診療所でうがい薬を処方されたがびらんが拡大し、'
  '<span class="kw">2週前から皮膚にも水疱とびらんが出現</span>したため受診した。'
  '受診時、歯肉と口蓋部に発赤を伴うびらんを多数認める。'
  '体幹と四肢には径15mmまでの紅斑、水疱、びらん及び痂皮を認める。'
  '<span class="kw">皮膚生検で表皮基底層直上に裂隙を認め、棘融解像を伴う</span>。'
  '<span class="kw">蛍光抗体直接法では表皮下層を中心に表皮細胞間にIgG、C3の沈着</span>を認める。'
  '口腔粘膜と上肢の写真（A）及び生検組織のH-E染色標本（B）を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '後天性表皮水疱症', False, '<span class="kw4">抗Ⅶ型コラーゲン抗体による表皮下水疱症</span>。'
                     '<span class="kw4">蛍光抗体直接法は基底膜部の線状IgG沈着</span>であり、'
                     '<span class="kw4">表皮細胞間の沈着でも棘融解でもない</span>。'
                     '外傷を受けやすい部位（手足・肘膝）に水疱・びらんを生じ、'
                     '瘢痕と稗粒腫を残すのが臨床像である。'),
   ('b', '尋常性天疱瘡', True, '<span class="kw3">口腔粘膜のびらんが先行し、遅れて皮膚に水疱・びらんが出現</span>という'
                     '経過が典型的である。'
                     '<span class="kw3">病理は表皮基底層直上（suprabasal）の裂隙＋棘融解、'
                     '蛍光抗体直接法は表皮細胞間（とくに下層）のIgG・C3沈着</span>で、'
                     '<span class="kw3">抗デスモグレイン3抗体による表皮内水疱症</span>と確定できる。'
                     '<span class="kw3">基底細胞だけが基底膜に残る「墓石〈tombstone〉像」</span>が'
                     '教科書的な組織所見である。'),
   ('c', '水疱性類天疱瘡', False, '<span class="kw4">表皮下水疱＋基底膜部の線状IgG・C3沈着</span>が特徴で、'
                     '<span class="kw4">棘融解は起こさない</span>。'
                     '<span class="kw4">水疱は緊満性でNikolsky陰性、粘膜疹は乏しい</span>。'
                     '本例は口腔粘膜が主戦場で、病理も細胞間沈着であり合致しない'
                     '（<span class="kw">Q.100</span>）。'),
   ('d', '疱疹状皮膚炎', False, '<span class="kw4">Duhring疱疹状皮膚炎はセリアック病（グルテン過敏性腸症）に伴い、'
                     '肘膝伸側・殿部に瘙痒の強い小水疱が集簇</span>する。'
                     '<span class="kw4">直接法では真皮乳頭部に顆粒状のIgA沈着</span>で、'
                     '<span class="kw4">IgGでも細胞間でもない</span>（<span class="kw">Q.106</span>）。'),
   ('e', '落葉状天疱瘡', False, '<span class="kw4">抗デスモグレイン1抗体による、より浅い（顆粒層〜角層下の）棘融解</span>。'
                     '<span class="kw4">粘膜は侵されない</span>のが決定的な違いで、'
                     '<span class="kw4">口腔粘膜びらんで初発した本例は否定される</span>。'
                     '皮疹も水疱よりは落屑・痂皮が主体となる（<span class="kw">Q.104</span>）。')],
  '口腔粘膜びらんが先行し、遅れて皮膚に水疱・びらん。基底層直上の裂隙と棘融解、表皮細胞間のIgG・C3沈着。尋常性天疱瘡。',
  imgs=['images/115D-60_1.jpeg', 'images/115D-60_2.jpeg'],
  patho=('🧩 天疱瘡——デスモグレインの「分布」が症状を決める',
         '<span class="kw3">天疱瘡〈pemphigus〉は、角化細胞どうしを接着するデスモソームの'
         'カドヘリン（デスモグレイン）に対するIgG自己抗体により、'
         '接着が失われて表皮内に水疱を生じる疾患群</span>である。'
         '<span class="kw3">抗体が結合すると細胞間接着が破綻し、'
         '角化細胞がバラバラになる＝棘融解〈acantholysis〉</span>が起こる。'
         '<span class="kw3">裂隙が表皮の「中」にできるため水疱の天井が薄く、'
         'すぐ破れてびらんになる（弛緩性水疱）</span>。'
         '<span class="kw3">健常に見える皮膚を擦ると表皮が剝離するNikolsky現象が陽性</span>である。<br>'
         '<span class="kw3">病型は「デスモグレイン代償説」で美しく説明できる</span>。'
         '<span class="kw3">Dsg1は皮膚（とくに表皮上層）に、Dsg3は粘膜と皮膚の下層に多く分布する</span>。'
         '<table class="tb"><tr><th>病型</th><th>自己抗体</th><th>病変部位</th><th>裂隙の高さ</th></tr>'
         '<tr><td><span class="kw3">尋常性天疱瘡（粘膜優位型）</span></td>'
         '<td><span class="kw3">抗Dsg3</span></td>'
         '<td><span class="kw3">口腔粘膜のみ</span>（皮膚はDsg1が代償）</td>'
         '<td rowspan="2"><span class="kw3">基底層直上</span></td></tr>'
         '<tr><td>尋常性天疱瘡（粘膜皮膚型）</td><td><span class="kw3">抗Dsg3＋抗Dsg1</span></td>'
         '<td>粘膜＋皮膚</td></tr>'
         '<tr><td><span class="kw3">落葉状天疱瘡</span></td>'
         '<td><span class="kw3">抗Dsg1</span></td>'
         '<td><span class="kw3">皮膚のみ（粘膜は侵さない＝Dsg3が代償）</span></td>'
         '<td><span class="kw3">顆粒層〜角層下</span></td></tr>'
         '<tr><td>腫瘍随伴性天疱瘡</td><td>抗デスモプラキン・エンボプラキンほか</td>'
         '<td><span class="kw4">難治性の口内炎・多形紅斑様皮疹＋閉塞性細気管支炎</span></td>'
         '<td>多彩</td></tr></table>'
         '<span class="kw3">本例は口腔粘膜で発症し、2か月後に皮膚へ拡大している＝'
         '抗Dsg3で始まり抗Dsg1が加わった粘膜皮膚型の経過</span>と読める。<br>'
         '<span class="kw3">診断は①病理（基底層直上の棘融解・墓石像）、'
         '②蛍光抗体直接法（表皮細胞間のIgG・C3が網目状）、'
         '③血清の抗Dsg1/Dsg3抗体ELISA</span>で行う。'
         '<span class="kw3">治療はステロイド全身投与が第一選択</span>で、'
         '<span class="kw3">難治例には免疫抑制薬・IVIg・血漿交換・リツキシマブ</span>を用いる。'),
  deep=('📌 「粘膜疹があるか」で水疱症を振り分ける',
        '<span class="kw3">水疱症の第一関門は「口腔粘膜が侵されるか」</span>である。'
        '<table class="tb"><tr><th>粘膜疹</th><th>疾患</th></tr>'
        '<tr><td><span class="kw3">必発・初発することが多い</span></td>'
        '<td><span class="kw3">尋常性天疱瘡</span>／粘膜類天疱瘡／腫瘍随伴性天疱瘡／'
        'Stevens-Johnson症候群・中毒性表皮壊死融解症</td></tr>'
        '<tr><td><span class="kw4">侵さない・乏しい</span></td>'
        '<td><span class="kw4">落葉状天疱瘡</span>／<span class="kw4">水疱性類天疱瘡</span>／'
        '疱疹状皮膚炎／Hailey-Hailey病</td></tr></table>'
        '<span class="kw3">2つ目の関門が「水疱が弛緩性か緊満性か」＝裂隙が表皮内か表皮下か</span>である。'
        '<table class="tb"><tr><th></th><th>天疱瘡（表皮内）</th><th>類天疱瘡（表皮下）</th></tr>'
        '<tr><td>水疱</td><td><span class="kw3">弛緩性・破れやすくびらんになる</span></td>'
        '<td><span class="kw3">緊満性・破れにくい</span></td></tr>'
        '<tr><td>Nikolsky現象</td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw3">陰性</span></td></tr>'
        '<tr><td>病理</td><td><span class="kw3">棘融解あり</span></td>'
        '<td><span class="kw3">棘融解なし・好酸球浸潤</span></td></tr>'
        '<tr><td>直接法</td><td><span class="kw3">表皮細胞間に網目状IgG</span></td>'
        '<td><span class="kw3">基底膜部に線状IgG・C3</span></td></tr>'
        '<tr><td>標的抗原</td><td><span class="kw3">デスモグレイン1/3（デスモソーム）</span></td>'
        '<td><span class="kw3">BP180/BP230（ヘミデスモソーム）</span></td></tr></table>'
        '<span class="kw3">この2つの表を書ければ、本章の水疱症の問題（Q.100・103・104・109・'
        '112・115・117・119・121）はすべて解ける</span>。'),
  point=('🎯 国試ポイント',
         '① 尋常性天疱瘡＝<span class="kw3">口腔粘膜のびらんで初発</span>、'
         '<span class="kw3">弛緩性水疱・Nikolsky陽性</span>。<br>'
         '② 病理＝<span class="kw3">基底層直上の裂隙・棘融解・墓石像</span>、'
         '直接法＝<span class="kw3">表皮細胞間のIgG・C3</span>。<br>'
         '③ 抗体＝<span class="kw3">抗Dsg3（粘膜）／抗Dsg1（皮膚）</span>。'
         '<span class="kw3">落葉状天疱瘡は抗Dsg1のみ＝粘膜を侵さない</span>。<br>'
         '④ 治療＝<span class="kw3">ステロイド全身投与</span>。'
         '難治例にIVIg・血漿交換・リツキシマブ。<br>'
         '⑤ <span class="kw4">難治性口内炎＋閉塞性細気管支炎なら腫瘍随伴性天疱瘡</span>（Castleman病・リンパ腫を探す）。')),

Q('111A-34', 78, [('bs', '★'), ('bi', '📷')],
  '55歳の男性。全身の皮疹を主訴に来院した。'
  '1か月前から<span class="kw">頭部、顔面、頸部および体幹に皮疹が出現</span>し、徐々に拡大してきた。'
  '胸部の写真（A）と皮膚生検のH-E染色標本（B）とを示す。<br>'
  '<strong>診断として最も考えられるのはどれか。</strong>',
  [('a', '疱疹状皮膚炎', False, '<span class="kw4">肘膝伸側・殿部・肩甲部に、瘙痒の強い小水疱が集簇</span>する。'
                     '<span class="kw4">病理は真皮乳頭部の好中球微小膿瘍、直接法は真皮乳頭部に顆粒状IgA</span>で、'
                     '<span class="kw4">棘融解は生じない</span>。'
                     'グルテン過敏性腸症の合併とDDSが著効する点を押さえる。'),
   ('b', '尋常性天疱瘡', False, '<span class="kw4">口腔粘膜のびらんで初発し、裂隙は基底層直上</span>にできる。'
                     '<span class="kw4">本例は粘膜症状の記載がなく、'
                     '皮疹も脂漏部位（頭・顔・頸・体幹）に浅い落屑・痂皮として広がっている</span>。'
                     '病理標本でも裂隙は表皮の浅い層にあり合致しない（<span class="kw">Q.103</span>）。'),
   ('c', '落葉状天疱瘡', True, '<span class="kw3">抗デスモグレイン1抗体により、'
                     '顆粒層〜角層下という浅いレベルで棘融解を起こす表皮内水疱症</span>である。'
                     '<span class="kw3">水疱は極めて浅く、できた端から破れるので'
                     '臨床的には「水疱」より落屑・鱗屑・痂皮を伴う紅斑として見える</span>。'
                     '<span class="kw3">頭部・顔面・頸部・上背部などの脂漏部位に好発し、'
                     '粘膜は侵さない</span>——本例の分布そのものである。'),
   ('d', '水疱性類天疱瘡', False, '<span class="kw4">高齢者の体幹・四肢に強い瘙痒を伴う緊満性水疱</span>を作り、'
                     '<span class="kw4">病理は表皮下水疱で棘融解を伴わない</span>。'
                     '裂隙の高さが決定的に異なる（<span class="kw">Q.100</span>）。'),
   ('e', '後天性表皮水疱症', False, '<span class="kw4">抗Ⅶ型コラーゲン抗体による表皮下水疱症</span>で、'
                     '<span class="kw4">外力のかかる手背・肘・膝に水疱・びらんを生じ、瘢痕と稗粒腫を残す</span>。'
                     '<span class="kw4">脂漏部位の落屑性紅斑という分布を取らない</span>。')],
  '中年男性の頭部・顔面・頸部・体幹（脂漏部位）に拡大する浅い水疱・落屑。粘膜疹なし。落葉状天疱瘡。',
  imgs=['images/111A-34_1.jpeg', 'images/111A-34_2.jpeg'],
  patho=('🍂 落葉状天疱瘡——「浅いから水疱に見えない」',
         '<span class="kw3">落葉状天疱瘡〈pemphigus foliaceus〉は抗デスモグレイン1〈Dsg1〉抗体による天疱瘡</span>である。'
         '<span class="kw3">Dsg1は表皮の上層に豊富に分布する</span>ため、'
         '<span class="kw3">棘融解が顆粒層〜角層下という非常に浅いレベルで起こる</span>。'
         '<span class="kw3">その結果、水疱の天井は角層数層ぶんしかなく、'
         '生じた瞬間に破れて「落ち葉」のような鱗屑・痂皮になる</span>——病名の由来である。'
         '<span class="kw3">臨床写真で明瞭な水疱を探しても見つからず、'
         '落屑を伴う紅斑局面として見える</span>のが本問の難所（正答率78％）である。<br>'
         '<span class="kw3">分布は脂漏部位（頭部・顔面・前胸部・上背部）</span>で、'
         '<span class="kw3">脂漏性皮膚炎・尋常性乾癬・紅皮症と紛らわしい</span>。'
         '<span class="kw3">重要なのは「粘膜を侵さない」こと</span>で、'
         '<span class="kw3">Dsg1が失われても粘膜ではDsg3が接着を代償するから</span>である'
         '（デスモグレイン代償説）。'
         '<span class="kw3">Nikolsky現象は陽性</span>。<br>'
         '<span class="kw3">亜型・関連病態も問われる</span>。'
         '<span class="kw3">①Senear-Usher症候群〈紅斑性天疱瘡〉＝落葉状天疱瘡の限局型で、'
         '顔面に蝶形紅斑様の皮疹を作りSLEと紛らわしい（抗核抗体陽性のことがある）</span>。'
         '<span class="kw3">②ブラジルの風土病 fogo selvagem は落葉状天疱瘡と同一の抗体をもつ</span>。'
         '<span class="kw3">③薬剤誘発性——D-ペニシラミン・カプトプリルなど'
         'チオール（SH）基をもつ薬剤で誘発される</span>のは有名な出題点である。'
         '<span class="kw3">④黄色ブドウ球菌の表皮剝脱毒素〈ET〉はDsg1を切断するため、'
         'ブドウ球菌性熱傷様皮膚症候群〈SSSS〉や伝染性膿痂疹（水疱性膿痂疹）は'
         '落葉状天疱瘡と同じ高さで裂ける</span>——'
         '<span class="kw3">「Dsg1が壊れる」という同じ機序が、自己抗体か細菌毒素かの違いで起こる</span>と'
         '理解しておくと忘れない。'),
  deep=('📌 表皮内水疱を「高さ」で並べる',
        '<table class="tb"><tr><th>裂隙の高さ</th><th>疾患</th><th>機序</th></tr>'
        '<tr><td><span class="kw3">角層下〜顆粒層</span></td>'
        '<td><span class="kw3">落葉状天疱瘡</span>／水疱性膿痂疹／SSSS／角層下膿疱症</td>'
        '<td><span class="kw3">Dsg1が抗体または表皮剝脱毒素で失われる</span></td></tr>'
        '<tr><td>表皮中層（有棘層）</td><td>Hailey-Hailey病／Darier病／ウイルス性水疱（ヘルペス）</td>'
        '<td>Ca²⁺ポンプ異常・バルーン変性</td></tr>'
        '<tr><td><span class="kw3">基底層直上</span></td>'
        '<td><span class="kw3">尋常性天疱瘡</span></td>'
        '<td><span class="kw3">Dsg3（±Dsg1）に対する抗体</span></td></tr>'
        '<tr><td><span class="kw3">表皮下（基底膜部）</span></td>'
        '<td><span class="kw3">水疱性類天疱瘡／後天性表皮水疱症／疱疹状皮膚炎／表皮水疱症</span></td>'
        '<td><span class="kw3">BP180・Ⅶ型コラーゲンなど接着装置の破綻</span></td></tr></table>'
        '<span class="kw3">「浅いほど水疱が壊れやすく落屑に見え、深いほど緊満性で破れにくい」</span>という'
        '一本の軸で整理できる。<br>'
        '<span class="kw4">落葉状天疱瘡を脂漏性皮膚炎や乾癬と誤らないコツ</span>は、'
        '<span class="kw4">①ステロイド外用で治りきらず拡大する、'
        '②びらん面がじくじくして痂皮化する、'
        '③Nikolsky現象が陽性、という3点を疑いのきっかけにして、'
        '生検と抗Dsg1抗体を出す</span>ことである。'
        '<span class="kw3">治療はステロイド全身投与が基本</span>だが、'
        '<span class="kw3">尋常性天疱瘡より軽症で経過することが多く、'
        '限局例では外用やDDS、抗菌薬（ミノサイクリン）で管理できる例もある</span>。'),
  point=('🎯 国試ポイント',
         '① 落葉状天疱瘡＝<span class="kw3">抗Dsg1抗体・顆粒層〜角層下の棘融解</span>。<br>'
         '② <span class="kw3">水疱は浅く壊れやすいので、臨床は落屑・痂皮を伴う紅斑</span>に見える。'
         '<span class="kw3">脂漏部位に好発</span>。<br>'
         '③ <span class="kw3">粘膜は侵さない</span>（Dsg3が代償）。'
         '<span class="kw3">Nikolsky陽性</span>。<br>'
         '④ 亜型＝<span class="kw3">Senear-Usher症候群（紅斑性天疱瘡）</span>、'
         '誘因＝<span class="kw3">D-ペニシラミンなどSH基をもつ薬剤</span>。<br>'
         '⑤ <span class="kw3">SSSS・水疱性膿痂疹は表皮剝脱毒素がDsg1を切る＝同じ高さで裂ける</span>。')),

]

QUESTIONS += [

Q('110G-58', 61, [('bs', '★'), ('bi', '📷')],
  '38歳の女性。<span class="kw">左下腿の潰瘍</span>を主訴に来院した。'
  '3か月前から母指頭大の紅色結節が出現し、中央が潰瘍化した。'
  '自宅近くの医療機関で<span class="kw4">抗菌薬を処方されたが、潰瘍がさらに拡大</span>したため受診した。'
  '左下腿の写真を示す。'
  '<span class="kw">一般細菌、真菌および抗酸菌培養はいずれも陰性</span>であった。'
  '<span class="kw">皮疹部の病理組織所見では真皮全層に好中球浸潤がみられるが血管炎像はない</span>。<br>'
  '<strong>この患者で合併を疑うべき疾患はどれか。2つ選べ。</strong>',
  [('a', '糖尿病', False, '<span class="kw4">糖尿病に伴う皮膚潰瘍は、神経障害と末梢動脈疾患による'
                     '足底・足趾の無痛性潰瘍</span>が典型で、'
                     '<span class="kw4">壊疽性膿皮症の代表的な基礎疾患には挙がらない</span>。'
                     'なお<span class="kw">糖尿病に特徴的な皮膚病変は、リポイド類壊死症'
                     '（下腿前面の黄色調で萎縮性の局面）・環状肉芽腫・糖尿病性水疱</span>である。'),
   ('b', '潰瘍性大腸炎', True, '<span class="kw3">壊疽性膿皮症の基礎疾患として最も有名なのが炎症性腸疾患</span>で、'
                     '<span class="kw3">潰瘍性大腸炎＞Crohn病</span>の順に多い。'
                     '<span class="kw3">腸管の炎症活動性と皮膚病変は必ずしも並行しない</span>ため、'
                     '<span class="kw3">皮膚科が先に気づいて消化器へ回すことがある</span>。'
                     '<span class="kw">Q.99・Q.118・Q.120</span>もこの組合せである。'),
   ('c', '甲状腺機能低下症', False, '<span class="kw4">粘液水腫（非圧痕性浮腫）・皮膚乾燥・脱毛・眉毛外側1/3の脱落</span>などを来すが、'
                     '<span class="kw4">潰瘍を作る疾患ではない</span>。'
                     'なお<span class="kw">前脛骨部粘液水腫はBasedow病（機能亢進症）に伴う</span>もので、'
                     '低下症ではない点も併せて確認しておく。'),
   ('d', '弾性線維性偽性黄色腫', False, '<span class="kw4">ABCC6遺伝子変異による弾性線維の変性疾患</span>で、'
                     '<span class="kw4">頸部・腋窩に黄色小丘疹が敷石状に集簇し、'
                     '眼底に網膜色素線条〈angioid streaks〉、消化管出血、動脈石灰化</span>を伴う。'
                     '<span class="kw4">好中球性皮膚症とは無関係</span>である。'),
   ('e', '骨髄異形成症候群〈MDS〉', True, '<span class="kw3">血液疾患は壊疽性膿皮症のもう一つの二大基礎疾患</span>で、'
                     '<span class="kw3">骨髄異形成症候群・白血病・IgA型単クローン性γグロブリン血症（MGUS）</span>が'
                     '代表である。'
                     '<span class="kw3">MDSは同じ好中球性皮膚症であるSweet病の基礎疾患としても最頻出</span>で、'
                     '<span class="kw3">「培養陰性の好中球性皮膚症を見たら血算・血液像を必ず確認する」</span>のが'
                     '実地の鉄則になる。')],
  '培養がすべて陰性で、抗菌薬に反応せず拡大する下腿潰瘍＋真皮の好中球浸潤＝壊疽性膿皮症。合併を疑うのは炎症性腸疾患と血液疾患。',
  imgs=['images/110G-58_1.jpeg'],
  ans_label='ｂ・ｅ',
  patho=('🔎 壊疽性膿皮症の基礎疾患を「4群」で覚える',
         '<span class="kw3">壊疽性膿皮症は約半数で基礎疾患を伴う</span>ため、'
         '<span class="kw3">診断がついた時点で全身検索を行うのが必須</span>である。'
         '<span class="kw3">出題される基礎疾患は次の4群に整理できる</span>。'
         '<table class="tb"><tr><th>群</th><th>疾患</th><th>ひとこと</th></tr>'
         '<tr><td><span class="kw3">①炎症性腸疾患</span></td>'
         '<td><span class="kw3">潰瘍性大腸炎</span>／Crohn病</td>'
         '<td><span class="kw3">最頻。腸炎の活動性とは必ずしも一致しない</span></td></tr>'
         '<tr><td><span class="kw3">②血液疾患</span></td>'
         '<td><span class="kw3">骨髄異形成症候群〈MDS〉</span>／急性・慢性白血病／'
         '<span class="kw3">IgA型M蛋白血症</span>／多発性骨髄腫</td>'
         '<td><span class="kw3">Sweet病と共通。血算・血液像を必ず見る</span></td></tr>'
         '<tr><td>③関節炎・自己炎症</td><td>関節リウマチ／脊椎関節炎／PAPA症候群</td>'
         '<td>RAでは血清反応陽性の活動期に多い</td></tr>'
         '<tr><td>④血管炎・その他</td><td>Behçet病／高安動脈炎／原発性胆汁性胆管炎</td>'
         '<td>Behçetは針反応（pathergy）を共有する</td></tr></table>'
         '<span class="kw3">診断そのものは除外診断</span>である。'
         '<span class="kw3">本問はその手順を丁寧になぞっており、'
         '①一般細菌・真菌・抗酸菌培養がすべて陰性＝感染症を除外、'
         '②血管炎像がない＝血管炎性潰瘍を除外、'
         '③真皮全層に好中球浸潤＝好中球性皮膚症、'
         'という3段階で壊疽性膿皮症に到達させている</span>。'
         '<span class="kw4">「抗菌薬を処方されたが拡大した」という記載も、'
         '感染症でないことを示す重要な手がかり</span>である。'),
  deep=('📌 好中球性皮膚症〈neutrophilic dermatosis〉の兄弟たち',
        '<span class="kw3">培養陰性なのに好中球が大量に浸潤する一群</span>で、'
        '<span class="kw3">基礎疾患・治療（ステロイドが著効）を共有する</span>。'
        '<table class="tb"><tr><th>疾患</th><th>皮疹</th><th>特徴・基礎疾患</th></tr>'
        '<tr><td><span class="kw3">壊疽性膿皮症</span></td>'
        '<td><span class="kw3">紫紅色の堤防状辺縁をもつ有痛性潰瘍（下腿）</span></td>'
        '<td><span class="kw3">IBD・MDS・RA。pathergy陽性</span></td></tr>'
        '<tr><td><span class="kw3">Sweet病</span></td>'
        '<td><span class="kw3">有痛性の浮腫性紅色局面（顔・頸・上肢）</span></td>'
        '<td><span class="kw3">発熱・好中球増多・赤沈亢進。MDS・白血病・上気道感染後</span></td></tr>'
        '<tr><td>Behçet病の皮膚病変</td><td>結節性紅斑様皮疹・毛囊炎様皮疹</td>'
        '<td>口腔アフタ・陰部潰瘍・ぶどう膜炎・<span class="kw3">針反応陽性</span></td></tr>'
        '<tr><td>角層下膿疱症（Sneddon-Wilkinson）</td><td>間擦部の弛緩性膿疱（膿が下に溜まる）</td>'
        '<td><span class="kw3">IgA型M蛋白血症</span></td></tr>'
        '<tr><td>掌蹠膿疱症</td><td>掌蹠の無菌性膿疱</td><td>病巣感染・喫煙（<span class="kw">Q.102</span>）</td></tr></table>'
        '<span class="kw4">実地で最も危険な誤りは、壊疽性膿皮症を「感染した壊死組織」と考えて'
        'デブリドマンしてしまうこと</span>である。'
        '<span class="kw4">pathergy現象により潰瘍は術後さらに拡大する</span>。'
        '<span class="kw3">治療の柱は副腎皮質ステロイド全身投与で、'
        'シクロスポリン、難治例には抗TNF-α抗体（インフリキシマブ、'
        'IBD合併例では腸病変にも有効）を用いる</span>。'
        '<span class="kw3">創部は湿潤環境を保つ被覆と疼痛管理を行い、'
        '外科的操作は最小限にとどめる</span>。'),
  point=('🎯 国試ポイント',
         '① 壊疽性膿皮症の基礎疾患は<span class="kw3">①炎症性腸疾患（UC＞Crohn）'
         '②血液疾患（MDS・白血病・IgA型M蛋白血症）③関節リウマチ ④Behçet病・高安動脈炎</span>。<br>'
         '② 診断は除外診断——<span class="kw3">培養陰性・血管炎なし・真皮に好中球浸潤</span>。<br>'
         '③ <span class="kw4">抗菌薬が効かない／デブリドマンで悪化（pathergy）</span>は積極的な手がかり。<br>'
         '④ 同じ好中球性皮膚症の<span class="kw3">Sweet病</span>も'
         '<span class="kw3">MDS・白血病</span>を背景にもつ。<br>'
         '⑤ 糖尿病の皮膚病変は<span class="kw4">リポイド類壊死症・環状肉芽腫・糖尿病性水疱</span>で、'
         '壊疽性膿皮症ではない。')),

Q('108I-19', 83, [('bs', '★'), ('bi', '📷')],
  '<span class="kw">皮膚生検組織の蛍光抗体直接法の写真（①〜⑤）</span>を示す。<br>'
  '<strong>水疱性類天疱瘡の所見はどれか。</strong>',
  [('a', '①', False, '<span class="kw4">抗IgA抗体による染色で、表皮基底膜部に沿って「線状」に蛍光を認める</span>。'
                     '<span class="kw4">基底膜部の線状IgA沈着＝線状IgA水疱性皮膚症</span>の所見である。'
                     '<span class="kw4">沈着している免疫グロブリンがIgAである時点で、'
                     'IgGを見る水疱性類天疱瘡ではない</span>。'),
   ('b', '②', False, '<span class="kw4">抗IgA抗体で、真皮乳頭部に「顆粒状」の蛍光が並んでいる</span>。'
                     '<span class="kw4">真皮乳頭部の顆粒状IgA沈着＝疱疹状皮膚炎〈Duhring〉</span>の所見。'
                     'グルテン過敏性腸症を合併し、DDSが著効する疾患である。'),
   ('c', '③', False, '<span class="kw4">抗IgA抗体で、真皮上層の血管壁に一致して顆粒状の蛍光を認める</span>。'
                     '<span class="kw4">血管壁へのIgA沈着＝IgA血管炎〈Henoch-Schönlein紫斑病〉</span>の所見で、'
                     '水疱症ではなく紫斑を来す疾患である。'),
   ('d', '④', False, '<span class="kw4">抗IgG抗体で、表皮細胞間が網目状（レース状・魚網状）に光っている</span>。'
                     '<span class="kw4">表皮細胞間のIgG沈着＝天疱瘡</span>の所見である。'
                     'IgGではあるが沈着部位が違う——'
                     'この選択肢が最も紛らわしく、正答率83％の主因と考えられる。'),
   ('e', '⑤', True, '<span class="kw3">抗IgG抗体で、表皮と真皮の境界（表皮基底膜部）に沿って'
                     '連続した「線状」の蛍光を認める</span>。'
                     '<span class="kw3">基底膜部の線状IgG沈着こそが水疱性類天疱瘡の所見</span>である。'
                     '毛囊漏斗部の基底膜にも線状に沿っており、基底膜部の分布であることが分かる。')],
  '蛍光抗体直接法は「どの免疫グロブリンが」「どこに」「どんな形で」沈着するかで読む。水疱性類天疱瘡＝IgGが表皮基底膜部に線状。',
  imgs=['images/108I-19_1.jpeg', 'images/108I-19_2.jpeg', 'images/108I-19_3.jpeg',
        'images/108I-19_4.jpeg', 'images/108I-19_5.jpeg'],
  patho=('🔬 蛍光抗体直接法の読み方——「クラス×部位×形」の3軸',
         '<span class="kw3">蛍光抗体直接法〈direct immunofluorescence: DIF〉は、'
         '患者の皮膚（病変部周囲の正常皮膚）に沈着している免疫グロブリンや補体を、'
         '蛍光標識した抗ヒトIgG／IgA／IgM／C3抗体で可視化する検査</span>である。'
         '<span class="kw3">読影は3つの軸を機械的に当てはめるだけでよい</span>。'
         '<table class="tb"><tr><th>クラス</th><th>部位</th><th>形</th><th>疾患</th></tr>'
         '<tr><td><span class="kw3">IgG</span></td>'
         '<td><span class="kw3">表皮細胞間</span></td><td><span class="kw3">網目状</span></td>'
         '<td><span class="kw3">天疱瘡（尋常性・落葉状）</span></td></tr>'
         '<tr><td><span class="kw3">IgG＋C3</span></td>'
         '<td><span class="kw3">表皮基底膜部</span></td><td><span class="kw3">線状</span></td>'
         '<td><span class="kw3">水疱性類天疱瘡／後天性表皮水疱症／妊娠性類天疱瘡</span></td></tr>'
         '<tr><td>IgA</td><td>表皮基底膜部</td><td>線状</td>'
         '<td><span class="kw3">線状IgA水疱性皮膚症</span></td></tr>'
         '<tr><td>IgA</td><td>真皮乳頭部</td><td><span class="kw3">顆粒状</span></td>'
         '<td><span class="kw3">疱疹状皮膚炎〈Duhring〉</span></td></tr>'
         '<tr><td>IgA</td><td>真皮上層の血管壁</td><td>顆粒状</td>'
         '<td><span class="kw3">IgA血管炎〈Henoch-Schönlein紫斑病〉</span></td></tr>'
         '<tr><td>IgG・IgM・C3</td><td>表皮基底膜部</td><td>顆粒状（帯状）</td>'
         '<td><span class="kw3">エリテマトーデス（ルーペバンドテスト陽性）</span></td></tr>'
         '<tr><td>IgA</td><td>表皮細胞間</td><td>網目状</td><td>IgA天疱瘡</td></tr></table>'
         '<span class="kw3">本問はこの表を写真で問うている</span>。'
         '<span class="kw3">①②③は写真下に「抗IgA抗体」と明記されており、'
         'この時点で水疱性類天疱瘡（IgG）ではない</span>。'
         '<span class="kw3">残る④⑤の抗IgG抗体のうち、'
         '④は細胞間の網目状＝天疱瘡、⑤は基底膜部の線状＝水疱性類天疱瘡</span>である。<br>'
         '<span class="kw4">なお線状か顆粒状かは「連続した1本の線に見えるか、点の集合に見えるか」で判断する</span>。'
         '<span class="kw4">線状＝自己抗体が均一に並んだ抗原に結合している、'
         '顆粒状＝免疫複合体が沈着している</span>、と機序に対応させると理解しやすい'
         '（エリテマトーデスやIgA血管炎が顆粒状なのはこのためである）。'),
  deep=('📌 直接法・間接法・salt-splitの使い分け',
        '<table class="tb"><tr><th>検査</th><th>材料</th><th>分かること</th></tr>'
        '<tr><td><span class="kw3">蛍光抗体直接法</span></td>'
        '<td><span class="kw3">患者の皮膚（病変部周囲）</span></td>'
        '<td><span class="kw3">組織にすでに沈着している抗体のクラスと部位＝診断の第一歩</span></td></tr>'
        '<tr><td>蛍光抗体間接法</td><td><span class="kw3">患者の血清</span>＋正常皮膚・サル食道</td>'
        '<td>循環自己抗体の有無と抗体価（疾患活動性）</td></tr>'
        '<tr><td><span class="kw3">salt-split skin法</span></td>'
        '<td>1M食塩水で裂いた正常皮膚＋患者血清</td>'
        '<td><span class="kw3">抗原が裂隙の表皮側（BP180/BP230）か真皮側（Ⅶ型コラーゲン）か</span></td></tr>'
        '<tr><td>ELISA</td><td>患者血清</td>'
        '<td><span class="kw3">抗Dsg1／抗Dsg3／抗BP180抗体を定量。経過観察に使う</span></td></tr></table>'
        '<span class="kw3">直接法は「どの疾患群か」、間接法・ELISAは「どのくらい活動性があるか」、'
        'salt-splitは「基底膜部疾患のうちどれか」を決める</span>——役割分担で覚える。<br>'
        '<span class="kw4">検体採取の実務も出題される</span>。'
        '<span class="kw4">直接法は水疱そのものではなく、水疱周囲の一見正常な皮膚から採る</span>。'
        '<span class="kw4">水疱内は炎症で抗原が破壊され、偽陰性になるためである</span>。'
        '<span class="kw4">また直接法用の検体はホルマリン固定すると抗原性が失われるので、'
        '生食ガーゼで運ぶか凍結（Michel液）で提出する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">IgG・細胞間・網目状＝天疱瘡</span>。<br>'
         '② <span class="kw3">IgG（＋C3）・基底膜部・線状＝水疱性類天疱瘡／後天性表皮水疱症</span>。<br>'
         '③ <span class="kw3">IgA・真皮乳頭部・顆粒状＝疱疹状皮膚炎</span>、'
         '<span class="kw3">IgA・基底膜部・線状＝線状IgA水疱性皮膚症</span>、'
         '<span class="kw3">IgA・血管壁＝IgA血管炎</span>。<br>'
         '④ <span class="kw3">基底膜部に顆粒状のIgG・IgM・C3＝エリテマトーデス（ルーペバンドテスト）</span>。<br>'
         '⑤ 直接法の検体は<span class="kw4">水疱周囲の正常皮膚から、ホルマリン固定せずに</span>提出する。')),

Q('101B-26', 86, [('bs', '★')],
  '<strong>組合せで<span class="kw4">誤っている</span>のはどれか。</strong>',
  [('a', '色素細胞 ―― メラノソーム', False, '<span class="kw4">正しい組合せ</span>。'
                     '<span class="kw">色素細胞〈メラノサイト〉は神経堤由来で表皮基底層に存在し、'
                     'メラニンを合成する細胞内小器官がメラノソーム</span>である。'
                     '<span class="kw">メラノソームは樹状突起を介して周囲の角化細胞へ受け渡される</span>。'),
   ('b', 'Langerhans細胞 ―― Birbeck顆粒', False, '<span class="kw4">正しい組合せ</span>。'
                     '<span class="kw">Langerhans細胞は骨髄由来の樹状細胞で、表皮有棘層に分布する抗原提示細胞</span>。'
                     '<span class="kw">電子顕微鏡でテニスラケット状のBirbeck顆粒</span>を認め、'
                     '<span class="kw">免疫染色ではS-100蛋白・CD1a・ランゲリンが陽性</span>になる。'
                     'アレルギー性接触皮膚炎の感作相で主役を演じる。'),
   ('c', 'マスト細胞 ―― ヒスタミン', False, '<span class="kw4">正しい組合せ</span>。'
                     '<span class="kw">マスト細胞〈肥満細胞〉は真皮に存在し、'
                     '顆粒内にヒスタミン・ヘパリン・トリプターゼを含む</span>。'
                     '<span class="kw">IgEを介した脱顆粒でヒスタミンが放出され、'
                     '血管拡張・透過性亢進・瘙痒＝膨疹（蕁麻疹）を生じる</span>。'
                     '色素性蕁麻疹（皮膚肥満細胞症）ではDarier徴候が陽性となる。'),
   ('d', '表皮角化細胞 ―― ケラチン', False, '<span class="kw4">正しい組合せ</span>。'
                     '<span class="kw">角化細胞〈ケラチノサイト〉は表皮の大部分を占め、'
                     '中間径フィラメントとしてケラチンを産生する</span>。'
                     '<span class="kw">ケラチン5/14（基底層）・ケラチン1/10（有棘層以上）</span>という'
                     '組合せは表皮水疱症や魚鱗癬の病態理解につながる。'),
   ('e', 'デスモソーム ―― Ⅶ型コラーゲン', True, '<span class="kw3">これが誤り</span>。'
                     '<span class="kw3">デスモソームは角化細胞どうしを接着する装置で、'
                     '構成分子はカドヘリンであるデスモグレイン・デスモコリンと、'
                     '裏打ち蛋白のデスモプラキン・プラコグロビン</span>である。'
                     '<span class="kw3">Ⅶ型コラーゲンはデスモソームではなく、'
                     '基底膜の緻密層直下にある係留線維〈anchoring fibril〉の主成分</span>で、'
                     '<span class="kw3">表皮を真皮につなぎ留める分子</span>である。'
                     '<span class="kw3">これを標的とするのが後天性表皮水疱症、'
                     '遺伝子変異で生じるのが栄養障害型表皮水疱症</span>である。')],
  'デスモソーム＝デスモグレイン／デスモコリン（細胞と細胞の接着）。Ⅶ型コラーゲンは基底膜下の係留線維（表皮と真皮の接着）で、組合せが誤り。',
  patho=('🧱 皮膚の「接着装置」を階層で整理する',
         '<span class="kw3">皮膚の接着は、上から下へ「細胞どうし」→「細胞と基底膜」→「基底膜と真皮」の'
         '3階建てになっている</span>。'
         '<span class="kw3">この階層と、それぞれを壊す疾患を対応させるのが本章全体の骨格</span>である。'
         '<table class="tb"><tr><th>階層</th><th>装置</th><th>主要分子</th><th>壊れると起こる疾患</th></tr>'
         '<tr><td><span class="kw3">角化細胞どうし</span></td>'
         '<td><span class="kw3">デスモソーム</span></td>'
         '<td><span class="kw3">デスモグレイン1・3／デスモコリン／デスモプラキン</span></td>'
         '<td><span class="kw3">天疱瘡（自己抗体）・Darier病／Hailey-Hailey病（Ca²⁺ポンプ異常）</span></td></tr>'
         '<tr><td><span class="kw3">基底細胞と基底膜</span></td>'
         '<td><span class="kw3">ヘミデスモソーム</span></td>'
         '<td><span class="kw3">BP180（XVII型コラーゲン）・BP230・α6β4インテグリン・ラミニン332</span></td>'
         '<td><span class="kw3">水疱性類天疱瘡・粘膜類天疱瘡／接合部型表皮水疱症</span></td></tr>'
         '<tr><td><span class="kw3">基底膜と真皮</span></td>'
         '<td><span class="kw3">係留線維〈anchoring fibril〉</span></td>'
         '<td><span class="kw3">Ⅶ型コラーゲン</span></td>'
         '<td><span class="kw3">後天性表皮水疱症（自己抗体）／栄養障害型表皮水疱症（COL7A1変異）</span></td></tr>'
         '<tr><td>細胞骨格（細胞内）</td><td>中間径フィラメント</td>'
         '<td>ケラチン5/14・1/10</td><td>単純型表皮水疱症／表皮融解性魚鱗癬</td></tr></table>'
         '<span class="kw3">「デスモソームは横の接着、ヘミデスモソーム＋係留線維は縦の接着」</span>と'
         '一言でまとめられる。'
         '<span class="kw3">横が壊れる＝表皮内水疱（天疱瘡）、縦が壊れる＝表皮下水疱（類天疱瘡・EB）</span>'
         'という対応が、本章のあらゆる問題の基礎になる。'),
  deep=('📌 表皮を構成する4つの細胞',
        '<table class="tb"><tr><th>細胞</th><th>由来・局在</th><th>マーカー・小器官</th><th>働き</th></tr>'
        '<tr><td><span class="kw3">角化細胞〈ケラチノサイト〉</span></td>'
        '<td>外胚葉／表皮の約95％</td><td><span class="kw3">ケラチン</span>・ケラトヒアリン顆粒</td>'
        '<td>角化によるバリア形成</td></tr>'
        '<tr><td><span class="kw3">色素細胞〈メラノサイト〉</span></td>'
        '<td><span class="kw3">神経堤</span>／基底層</td>'
        '<td><span class="kw3">メラノソーム</span>・S-100・HMB-45・チロシナーゼ</td>'
        '<td>メラニン合成と受け渡し（紫外線防御）</td></tr>'
        '<tr><td><span class="kw3">Langerhans細胞</span></td>'
        '<td><span class="kw3">骨髄</span>／有棘層</td>'
        '<td><span class="kw3">Birbeck顆粒（テニスラケット状）</span>・CD1a・S-100・ランゲリン</td>'
        '<td><span class="kw3">抗原提示（接触皮膚炎の感作相）</span></td></tr>'
        '<tr><td>Merkel細胞</td><td>表皮基底層（神経終末と接する）</td>'
        '<td>サイトケラチン20・神経内分泌顆粒</td>'
        '<td><span class="kw3">触覚の受容。腫瘍化するとMerkel細胞癌（高悪性）</span></td></tr></table>'
        '<span class="kw3">真皮側の主役はマスト細胞・線維芽細胞</span>で、'
        '<span class="kw3">マスト細胞＝ヒスタミン＝蕁麻疹（膨疹）、'
        '線維芽細胞＝Ⅰ・Ⅲ型コラーゲンと弾性線維</span>と対応づけられる。<br>'
        '<span class="kw4">コラーゲンの型番は皮膚科で頻出</span>なので'
        '<span class="kw4">Ⅰ型＝真皮の主成分、Ⅲ型＝細網線維（Ehlers-Danlos血管型）、'
        'Ⅳ型＝基底膜（緻密層）、Ⅶ型＝係留線維、XVII型＝BP180（ヘミデスモソーム）</span>と'
        '一気に押さえておく。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">デスモソーム＝デスモグレイン／デスモコリン（＋デスモプラキン）</span>。'
         '<span class="kw4">Ⅶ型コラーゲンではない</span>。<br>'
         '② <span class="kw3">Ⅶ型コラーゲン＝係留線維＝後天性表皮水疱症・栄養障害型表皮水疱症</span>。<br>'
         '③ <span class="kw3">BP180＝XVII型コラーゲン＝ヘミデスモソーム＝水疱性類天疱瘡</span>。<br>'
         '④ <span class="kw3">Langerhans細胞＝Birbeck顆粒・CD1a・S-100（骨髄由来の抗原提示細胞）</span>。<br>'
         '⑤ <span class="kw3">メラノサイト＝神経堤由来・メラノソーム</span>、'
         '<span class="kw3">Merkel細胞＝触覚・CK20</span>、'
         '<span class="kw3">マスト細胞＝ヒスタミン＝膨疹</span>。')),

]

QUESTIONS += [

Q('100H-36', 73, [('bs', '★'), ('bi', '📷')],
  '35歳の男性。手足の発疹を主訴に来院した。'
  '<span class="kw">半年前から、手掌と足蹠とに皮疹が出現</span>した。'
  '<span class="kw">苛性カリ検鏡法で真菌は陰性</span>である。皮膚生検H-E染色標本を示す。<br>'
  '<strong>この疾患に合併しやすいのはどれか。</strong>',
  [('a', '間質性肺炎', False, '<span class="kw4">皮膚科で間質性肺炎といえば皮膚筋炎（とくに抗MDA5抗体陽性例の'
                     '急速進行性間質性肺炎）や全身性強皮症</span>である。'
                     '<span class="kw4">掌蹠膿疱症との関連は問われない</span>。'),
   ('b', '慢性扁桃炎', True, '<span class="kw3">掌蹠膿疱症の代表的な病巣感染〈focal infection〉が慢性扁桃炎</span>である。'
                     '<span class="kw3">扁桃で活性化されたT細胞・サイトカインが遠隔の皮膚（掌蹠）で'
                     '無菌性膿疱を誘導すると考えられており、'
                     '扁桃摘出術によって皮疹と骨関節症状がともに改善する例がある</span>。'
                     '<span class="kw3">歯性感染（根尖病巣・歯周炎）・副鼻腔炎も同じ位置づけ</span>で、'
                     '<span class="kw">Q.113</span>では「歯科治療歴」が正解になっている。'),
   ('c', '慢性肝炎', False, '<span class="kw4">C型慢性肝炎に伴う皮膚病変は、晩発性皮膚ポルフィリン症・'
                     'クリオグロブリン血症性血管炎・扁平苔癬</span>などである。'
                     '<span class="kw4">掌蹠膿疱症の合併症としては挙がらない</span>。'),
   ('d', 'IgA腎症', False, '<span class="kw4">IgA腎症も扁桃を病巣とする「病巣感染症」として'
                     '扁桃摘出＋ステロイドパルスが行われる疾患</span>であり、'
                     '<span class="kw4">掌蹠膿疱症と発想は近い</span>。'
                     'しかし<span class="kw4">本問が問うているのは「この疾患（掌蹠膿疱症）に合併しやすいもの」</span>であり、'
                     '<span class="kw4">掌蹠膿疱症にIgA腎症が高率に合併するわけではない</span>。'
                     '紛らわしいためこの選択肢が正答率を73％に下げていると考えられる。'),
   ('e', '白内障', False, '<span class="kw4">皮膚疾患に合併する白内障といえばアトピー性皮膚炎（アトピー白内障）</span>で、'
                     '<span class="kw4">顔面の重症例・搔破や叩打が誘因</span>とされる。'
                     '掌蹠膿疱症とは無関係である。')],
  '半年続く掌蹠の皮疹、KOH陰性、病理で表皮内の好中球性膿疱＝掌蹠膿疱症。合併しやすいのは病巣感染としての慢性扁桃炎。',
  imgs=['images/100H-36_1.jpeg'],
  patho=('🦷 病巣感染〈focal infection〉という考え方',
         '<span class="kw3">病巣感染とは、身体のどこかにある限局した慢性炎症巣（原発巣）が、'
         'それ自体はほとんど症状を出さないのに、'
         '遠隔の臓器に免疫学的機序で別の疾患（二次疾患）を起こす病態</span>をいう。'
         '<span class="kw3">原発巣として最も重要なのが口蓋扁桃、次いで歯性感染（根尖病巣・歯周炎）・'
         '副鼻腔炎</span>である。'
         '<table class="tb"><tr><th>二次疾患</th><th>ひとこと</th></tr>'
         '<tr><td><span class="kw3">掌蹠膿疱症</span></td>'
         '<td><span class="kw3">扁桃摘出で皮疹・PAOともに改善しうる</span></td></tr>'
         '<tr><td><span class="kw3">IgA腎症</span></td>'
         '<td><span class="kw3">扁摘＋ステロイドパルス療法</span></td></tr>'
         '<tr><td><span class="kw3">胸肋鎖骨過形成症〈SAPHO〉</span></td><td>掌蹠膿疱症と連続した病態</td></tr>'
         '<tr><td>滴状乾癬</td><td>小児〜若年の溶連菌性咽頭炎後に全身へ小紅斑</td></tr>'
         '<tr><td>結節性紅斑・急性糸球体腎炎・リウマチ熱</td><td>いずれも溶連菌感染が引き金</td></tr></table>'
         '<span class="kw3">掌蹠膿疱症の病理</span>は'
         '<span class="kw3">表皮内（角層下）に好中球が集簇した膿疱＝Kogojの海綿状膿疱</span>で、'
         '<span class="kw3">膿疱内容は無菌</span>である。'
         '<span class="kw3">真菌が陰性であることを苛性カリ〈KOH〉直接鏡検で確認するのが必須の手順</span>で、'
         '<span class="kw3">足白癬（小水疱型）を除外するため</span>に行う'
         '（<span class="kw">Q.113</span>）。<br>'
         '<span class="kw3">治療は誘因の除去から始める</span>——'
         '<span class="kw3">禁煙、扁桃・歯性病巣の治療（必要なら扁桃摘出）、'
         '歯科金属アレルギーがあれば金属除去</span>。'
         '<span class="kw3">皮疹にはステロイド外用・活性型ビタミンD₃外用・紫外線療法</span>、'
         '<span class="kw3">難治例・骨関節炎合併例にはレチノイド内服や生物学的製剤</span>を用いる。'),
  deep=('📌 手掌・足底の皮疹を見たら——KOHを置いてから考える',
        '<span class="kw3">掌蹠の皮疹で最初にすべき検査は苛性カリ〈KOH〉直接鏡検</span>である。'
        '<span class="kw3">白癬は「うつる・治療が全く違う・ステロイドで悪化する」ため、'
        '真っ先に外さねばならない</span>。'
        '<table class="tb"><tr><th>疾患</th><th>臨床</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">掌蹠膿疱症</span></td>'
        '<td><span class="kw3">両側性・無菌性膿疱と鱗屑が消長</span></td>'
        '<td><span class="kw3">KOH陰性・喫煙・扁桃炎・前胸部痛</span></td></tr>'
        '<tr><td>足白癬／手白癬</td><td>しばしば片側性、趾間のびらん、爪白癬の併存</td>'
        '<td><span class="kw3">KOHで菌糸陽性</span></td></tr>'
        '<tr><td>汗疱（異汗性湿疹）</td><td>手掌・指側縁の小水疱、膿疱化せず、夏に悪化</td>'
        '<td>KOH陰性、金属アレルギーの関与</td></tr>'
        '<tr><td>接触皮膚炎</td><td>接触部位に一致した紅斑・小水疱</td><td>パッチテスト</td></tr>'
        '<tr><td>第2期梅毒（梅毒性乾癬）</td><td><span class="kw4">手掌・足底の落屑性紅斑・無症候</span></td>'
        '<td>梅毒血清反応（RPR・TPHA）</td></tr>'
        '<tr><td>掌蹠角化症</td><td>びまん性の厚い角化と亀裂</td><td>幼少期発症・家族歴</td></tr></table>'
        '<span class="kw4">「掌蹠の皮疹＋KOH陰性」と書かれていたら、'
        '出題者は白癬を消して掌蹠膿疱症へ誘導している</span>——'
        '<span class="kw4">この一文は本章で3回（Q.102・108・113）繰り返されている</span>。'),
  point=('🎯 国試ポイント',
         '① 掌蹠膿疱症の病巣感染＝<span class="kw3">慢性扁桃炎・歯性感染・副鼻腔炎</span>。'
         '<span class="kw3">扁桃摘出で改善しうる</span>。<br>'
         '② 病理＝<span class="kw3">表皮内の無菌性好中球膿疱（Kogoj海綿状膿疱）</span>。'
         '<span class="kw3">KOH陰性の確認は必須</span>。<br>'
         '③ 病巣感染の二次疾患＝<span class="kw3">掌蹠膿疱症・IgA腎症・胸肋鎖骨過形成症・滴状乾癬</span>。<br>'
         '④ <span class="kw4">アトピー性皮膚炎の合併症＝白内障・網膜剝離・Kaposi水痘様発疹症</span>と混同しない。<br>'
         '⑤ 増悪因子は<span class="kw3">喫煙</span>——禁煙指導は治療の一部である。')),

Q('99F-36', None, [('bs', '★'), ('bi', '📷')],
  '78歳の女性。1週前から<span class="kw">体幹に痒みとともに水疱が出現</span>し、'
  '次第に増加してきたため来院した。'
  '<span class="kw4">発熱と体重減少とはない</span>。'
  '<span class="kw">口腔内病変を認めない</span>。'
  '体幹部の写真（A）と皮膚生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>蛍光抗体法で免疫グロブリンの沈着を認める部位はどれか。</strong>',
  [('a', '血管壁', False, '<span class="kw4">真皮上層の血管壁への免疫グロブリン沈着は血管炎の所見</span>で、'
                     '<span class="kw4">IgA血管炎〈Henoch-Schönlein紫斑病〉では血管壁に顆粒状のIgA</span>が'
                     '沈着する（<span class="kw">Q.106</span>の③）。'
                     '<span class="kw4">皮疹は水疱ではなく触知可能な紫斑</span>である。'),
   ('b', '表皮細胞間', False, '<span class="kw4">表皮細胞間の網目状IgG沈着は天疱瘡の所見</span>。'
                     '<span class="kw4">天疱瘡なら口腔粘膜のびらん（尋常性）や'
                     '脂漏部位の落屑（落葉状）を呈し、水疱は弛緩性でNikolsky陽性</span>となる。'
                     '<span class="kw4">本例は「口腔内病変を認めない」と明記</span>されており、'
                     'この一文が天疱瘡を外すために置かれている。'),
   ('c', '表皮細胞核', False, '<span class="kw4">表皮細胞核が染まるのは、抗核抗体を用いた検査や'
                     'in vivo ANA（エリテマトーデスで細胞核に蛍光を認めることがある）</span>の所見で、'
                     '<span class="kw4">水疱症の診断に用いる部位ではない</span>。'),
   ('d', '表皮基底膜部', True, '<span class="kw3">高齢者・体幹の瘙痒を伴う緊満性水疱・口腔粘膜疹なし＝水疱性類天疱瘡</span>。'
                     '<span class="kw3">蛍光抗体直接法では表皮基底膜部にIgGとC3が線状に沈着</span>する。'
                     '<span class="kw3">標的抗原はヘミデスモソームのBP180（XVII型コラーゲン）・BP230</span>で、'
                     '<span class="kw3">病理でも表皮下水疱＋好酸球浸潤</span>を示す。'),
   ('e', '真皮乳頭部', False, '<span class="kw4">真皮乳頭部への顆粒状IgA沈着は疱疹状皮膚炎〈Duhring〉の所見</span>。'
                     '<span class="kw4">肘膝伸側・殿部に瘙痒の強い小水疱が集簇し、'
                     'グルテン過敏性腸症を合併、DDSが著効する</span>。'
                     '高齢女性の体幹に多発する水疱という本例とは分布が異なる。')],
  '高齢女性、体幹の瘙痒を伴う水疱、口腔粘膜疹なし＝水疱性類天疱瘡。蛍光抗体直接法では表皮基底膜部にIgGとC3が線状に沈着する。',
  imgs=['images/99F-36_1.jpeg', 'images/99F-36_2.jpeg'],
  patho=('📍 「どこに沈着するか」を臨床像から逆算する',
         '<span class="kw3">本問は蛍光抗体法の写真を見せずに、'
         '臨床像と病理から「沈着部位を予測せよ」と問う形式</span>である。'
         '<span class="kw3">臨床像→疾患→沈着部位、という2段階の推論</span>になる。<br>'
         '<span class="kw3">まず臨床像の読み</span>——'
         '<span class="kw3">①78歳の高齢者、②体幹に瘙痒を伴う水疱が急速に増加、'
         '③口腔粘膜病変がない、④発熱・体重減少がない（悪性腫瘍や感染症を示唆する所見がない）</span>。'
         '<span class="kw3">この4点で水疱性類天疱瘡がほぼ決まる</span>。'
         '<span class="kw3">病理（B）は表皮下水疱で、水疱腔と真皮に好酸球が目立つ</span>のが典型である。<br>'
         '<span class="kw3">次に沈着部位</span>——'
         '<span class="kw3">水疱性類天疱瘡の標的はヘミデスモソームのBP180・BP230であり、'
         'これらは表皮基底細胞の底面＝表皮基底膜部に局在する</span>。'
         'よって<span class="kw3">蛍光抗体直接法では表皮と真皮の境界に沿って'
         '連続した線状の蛍光（IgG＋C3）</span>を認める。<br>'
         '<span class="kw3">選択肢は「発疹の場所」ではなく「顕微鏡での沈着部位」を並べており、'
         'Q.106の3軸（クラス×部位×形）の表がそのまま使える</span>。'
         '<span class="kw3">血管壁＝IgA血管炎、表皮細胞間＝天疱瘡、'
         '表皮基底膜部（線状IgG）＝水疱性類天疱瘡・後天性表皮水疱症、'
         '真皮乳頭部（顆粒状IgA）＝疱疹状皮膚炎</span>と対応させればよい。<br>'
         '<span class="kw4">なお本問は巻末の解答一覧表に正答率の記載がない</span>。'
         '<span class="kw4">採点除外ではなく、単に数値が掲載されていないだけ</span>である。'),
  deep=('📌 高齢者の水疱を見たときの実践的な進め方',
        '<span class="kw3">①まず薬剤歴</span>——'
        '<span class="kw3">DPP-4阻害薬（シタグリプチンなど）による水疱性類天疱瘡</span>は'
        '近年の頻出テーマで、'
        '<span class="kw3">中止だけで軽快することがある</span>。'
        '<span class="kw3">利尿薬（フロセミド）・抗菌薬も誘因になりうる</span>。<br>'
        '<span class="kw3">②水疱の性状を見る</span>——'
        '<span class="kw3">緊満性でNikolsky陰性なら表皮下（類天疱瘡群）、'
        '弛緩性でNikolsky陽性なら表皮内（天疱瘡群）</span>。<br>'
        '<span class="kw3">③粘膜を診る</span>——'
        '<span class="kw3">口腔粘膜びらんが目立てば尋常性天疱瘡・粘膜類天疱瘡・'
        '腫瘍随伴性天疱瘡・SJS/TEN</span>。<br>'
        '<span class="kw3">④検査は3点セット</span>——'
        '<span class="kw3">生検2か所（H-E用は水疱を含めて、蛍光抗体直接法用は水疱周囲の正常皮膚から）、'
        '血清の抗BP180・抗Dsg1/3抗体、末梢血好酸球</span>。<br>'
        '<table class="tb"><tr><th>臨床の落とし穴</th><th>解説</th></tr>'
        '<tr><td><span class="kw4">前駆期は水疱がない</span></td>'
        '<td><span class="kw4">瘙痒と蕁麻疹様紅斑だけの時期が数週続き、'
        '「難治性の湿疹」として扱われることがある</span></td></tr>'
        '<tr><td>高齢者の全身状態</td>'
        '<td>広範なびらんは体液・蛋白喪失と感染のリスク。'
        '<span class="kw3">熱傷に準じた全身管理</span>を要する</td></tr>'
        '<tr><td>ステロイドの副作用</td>'
        '<td>高齢者では糖尿病・感染症・骨粗鬆症・せん妄に注意し、'
        '<span class="kw3">軽症ではテトラサイクリン＋ニコチン酸アミドやDDS</span>を選ぶ</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 水疱性類天疱瘡の蛍光抗体直接法＝<span class="kw3">表皮基底膜部にIgGとC3が線状</span>。<br>'
         '② 臨床＝<span class="kw3">高齢者・瘙痒・緊満性水疱・口腔粘膜疹は乏しい・好酸球増多</span>。<br>'
         '③ 病理＝<span class="kw3">表皮下水疱＋好酸球浸潤</span>。血清＝<span class="kw3">抗BP180抗体</span>。<br>'
         '④ 沈着部位の対応＝<span class="kw3">細胞間（天疱瘡）／基底膜部線状（類天疱瘡・EBA）／'
         '真皮乳頭部顆粒状IgA（疱疹状皮膚炎）／血管壁（IgA血管炎）</span>。<br>'
         '⑤ 高齢者では<span class="kw4">DPP-4阻害薬</span>の内服歴を必ず確認する。')),

]

# ============================================================
# A問題 NO.110
# ============================================================
QUESTIONS += [

Q('118F-58', 92, [('bi', '📷')],
  '40歳の男性。右胸部から右背部の皮疹を主訴に来院した。'
  '<span class="kw">7日前から右胸部の痛みを自覚</span>した。'
  '<span class="kw">5日前に右胸部から右背部にかけて皮疹が出現</span>した。'
  '痛みが増強したため来院した。<span class="kw">最近、過労気味</span>であった。'
  '胸部の写真（A：胸部、B：右胸部の拡大）を示す。<br>'
  '<strong>写真Bでみられる皮疹の種類はどれか。2つ選べ。</strong>',
  [('a', '血　疱', False, '<span class="kw4">内容が血性（暗赤色）の水疱</span>。'
                     '<span class="kw4">重症の帯状疱疹では出血性・壊死性となり血疱を生じることもある</span>が、'
                     '<span class="kw4">写真Bの水疱内容は漿液性〜黄白色であり、血性の水疱は指摘できない</span>。'),
   ('b', '紫　斑', False, '<span class="kw4">真皮内の出血による斑で、硝子圧法で退色しない</span>のが定義。'
                     '<span class="kw4">「斑」であるから隆起しない</span>。'
                     '写真の皮疹は明らかに隆起して内容物を含んでおり、紫斑ではない。'),
   ('c', '水　疱', True, '<span class="kw3">紅斑上に、透明〜漿液性の内容を入れた小水疱が集簇（群れをなして）'
                     '多発している</span>のが読み取れる。'
                     '<span class="kw3">帯状疱疹の皮疹は「片側性・神経支配領域（デルマトーム）に沿った'
                     '紅斑と集簇性小水疱」</span>が基本形である。'),
   ('d', '膿　疱', True, '<span class="kw3">水疱の一部は内容が黄白色に混濁しており、膿疱となっている</span>。'
                     '<span class="kw3">帯状疱疹の水疱は経過とともに膿疱化し、'
                     'やがて破れてびらん・痂皮となる</span>——'
                     '<span class="kw3">発症5日目の本例では水疱と膿疱が混在するのが自然な経過</span>である。'),
   ('e', '膿　瘍', False, '<span class="kw4">膿瘍は真皮〜皮下に膿が貯留した「腫瘤」</span>で、'
                     '<span class="kw4">波動を触れる深部病変</span>を指す。'
                     '<span class="kw4">表皮内の小さな膿疱とは深さも大きさも異なる</span>。'
                     '皮下膿瘍・毛囊炎からの膿瘍形成などで用いる語である。')],
  '片側性・デルマトームに沿った有痛性の紅斑と集簇性小水疱＝帯状疱疹。写真Bでは漿液性の水疱と、混濁した膿疱が混在する。',
  imgs=['images/118F-58_1.jpeg', 'images/118F-58_2.jpeg'],
  ans_label='ｃ・ｄ',
  patho=('⚡ 帯状疱疹——「痛みが皮疹に先行する」',
         '<span class="kw3">帯状疱疹〈herpes zoster〉は、'
         '初感染（水痘）後に後根神経節・脳神経節へ潜伏した'
         '水痘・帯状疱疹ウイルス〈VZV〉が、'
         '加齢・過労・悪性腫瘍・免疫抑制薬などで細胞性免疫が低下した際に再活性化して起こる</span>。'
         '<span class="kw3">ウイルスは神経を下行して皮膚へ達するため、'
         '皮疹は必ず①片側性で、②1〜2本の神経支配領域（デルマトーム）に一致し、'
         '③正中線を越えない</span>。'
         '<span class="kw3">本例は「7日前から右胸部の痛み→5日前に皮疹」と、'
         '疼痛が皮疹に数日先行</span>しており典型的である。'
         '<span class="kw4">皮疹が出る前の疼痛期には、狭心症・胆石発作・尿管結石・肋間神経痛などと'
         '誤診されやすい</span>。<br>'
         '<span class="kw3">皮疹の経過</span>は'
         '<span class="kw3">紅斑 → 集簇性小水疱 → 膿疱 → びらん・痂皮 → 治癒（色素沈着・瘢痕）</span>と'
         '進む。'
         '<span class="kw3">同じ部位に新旧さまざまな段階の皮疹が混在する</span>のが特徴で、'
         '<span class="kw3">本問が「水疱」と「膿疱」の2つを選ばせるのはこの性質による</span>。<br>'
         '<span class="kw3">治療は抗ヘルペスウイルス薬（アシクロビル、バラシクロビル、'
         'ファムシクロビル、アメナメビル）を発症72時間以内に開始</span>する。'
         '<span class="kw3">腎排泄の薬剤が多く、高齢者・腎機能低下例では減量が必要</span>で、'
         '<span class="kw4">過量投与でアシクロビル脳症（意識障害・振戦）</span>を起こす。'
         '<span class="kw3">急性期の疼痛管理を十分に行うことが、帯状疱疹後神経痛の予防につながる</span>。'),
  deep=('📌 帯状疱疹の合併症と「見逃してはいけない部位」',
        '<table class="tb"><tr><th>病態</th><th>特徴</th><th>対応</th></tr>'
        '<tr><td><span class="kw3">帯状疱疹後神経痛〈PHN〉</span></td>'
        '<td><span class="kw3">皮疹治癒後も3か月以上続く神経障害性疼痛。高齢者・急性期の疼痛が強い例で多い</span></td>'
        '<td><span class="kw3">プレガバリン・ミロガバリン・三環系抗うつ薬・神経ブロック</span></td></tr>'
        '<tr><td><span class="kw3">Ramsay Hunt症候群</span></td>'
        '<td><span class="kw3">膝神経節の再活性化。耳介の水疱＋末梢性顔面神経麻痺＋耳鳴・難聴・めまい</span></td>'
        '<td>抗ウイルス薬＋ステロイド。<span class="kw4">Bell麻痺より予後不良</span></td></tr>'
        '<tr><td><span class="kw3">眼部帯状疱疹</span></td>'
        '<td><span class="kw3">三叉神経第1枝。Hutchinson徴候（鼻背・鼻尖の皮疹）は鼻毛様体神経の障害を示し'
        '眼合併症のリスク</span></td>'
        '<td><span class="kw3">角膜炎・ぶどう膜炎の恐れ。眼科へ緊急紹介</span></td></tr>'
        '<tr><td>汎発性帯状疱疹</td>'
        '<td><span class="kw4">デルマトームを越えて全身に散布性水疱。免疫不全（悪性腫瘍・HIV・免疫抑制薬）を示唆</span></td>'
        '<td><span class="kw4">空気予防策＋接触予防策で個室隔離、点滴静注</span></td></tr>'
        '<tr><td>仙骨部帯状疱疹</td><td>排尿障害（Elsberg症候群）</td><td>導尿を要することがある</td></tr></table>'
        '<span class="kw3">感染対策も頻出</span>である。'
        '<span class="kw3">通常の帯状疱疹は水疱内にウイルスがいるので接触感染予防（水疱を覆う）</span>、'
        '<span class="kw3">汎発性・免疫不全例では空気感染に準じた対策</span>を取る。'
        '<span class="kw4">水痘の免疫がない人（未罹患・未接種の小児など）に接触すると'
        '「帯状疱疹」ではなく「水痘」として発症する</span>点に注意する。'
        '<span class="kw3">50歳以上には帯状疱疹ワクチン（生ワクチンまたは不活化サブユニットワクチン）が'
        '推奨される</span>。'),
  point=('🎯 国試ポイント',
         '① 帯状疱疹＝<span class="kw3">片側性・デルマトームに沿う・正中を越えない・'
         '疼痛が皮疹に先行</span>。<br>'
         '② 皮疹は<span class="kw3">紅斑→集簇性小水疱→膿疱→痂皮</span>と進み、'
         '<span class="kw3">水疱と膿疱が混在</span>する。<br>'
         '③ 治療＝<span class="kw3">発症72時間以内に抗ヘルペスウイルス薬</span>。'
         '<span class="kw4">腎機能に応じて減量（アシクロビル脳症）</span>。<br>'
         '④ 合併症＝<span class="kw3">帯状疱疹後神経痛／Ramsay Hunt症候群／眼部帯状疱疹'
         '（Hutchinson徴候）／汎発性（免疫不全を疑う）</span>。<br>'
         '⑤ 発疹学＝<span class="kw3">水疱（漿液）／膿疱（膿・表皮内）／膿瘍（深部の膿の貯留）／'
         '紫斑（隆起しない出血斑）</span>を区別する。')),

]

# ============================================================
# B問題 NO.111-121
# ============================================================
QUESTIONS += [

Q('114A-37', 94, [('bi', '📷')],
  '68歳の男性。<span class="kw">上前胸部痛</span>を主訴に来院した。'
  '<span class="kw">2年前から両手掌に皮疹が繰り返し出現</span>していた。'
  '1年前から上前胸部痛を自覚していたという。'
  '1か月前から上前胸部の疼痛が増悪したため受診した。'
  '<span class="kw">両手掌に膿疱性皮疹を多数認める</span>。'
  '両側の近位指節間関節の腫脹と圧痛を認める。'
  '<span class="kw">両側胸鎖関節の骨性肥厚と熱感および圧痛</span>を認める。'
  'この患者の胸部エックス線写真を示す。<br>'
  '<strong>関節病変の原因として最も考えられるのはどれか。</strong>',
  [('a', '関節リウマチ', False, '<span class="kw4">手指のMCP・PIP関節と手関節を左右対称に侵し、'
                     '朝のこわばりが1時間以上続く</span>。'
                     '<span class="kw4">胸鎖関節の骨性肥厚を主症状とすることはなく、'
                     '掌蹠の無菌性膿疱も伴わない</span>。'
                     '本例のPIP関節腫脹だけを見てRAに飛びつかないこと。'),
   ('b', '強直性脊椎炎', False, '<span class="kw4">若年男性に多く、HLA-B27陽性、'
                     '仙腸関節炎から脊椎の靱帯骨化（bamboo spine）へ進む</span>。'
                     '<span class="kw4">炎症性腰背部痛（安静で悪化・運動で改善・夜間痛）</span>が主症状で、'
                     '<span class="kw4">前胸壁の骨性肥厚と掌蹠膿疱が組になることはない</span>。'),
   ('c', '慢性疲労症候群', False, '<span class="kw4">6か月以上続く強い倦怠感を主症状とする診断名</span>で、'
                     '<span class="kw4">骨性肥厚のような他覚的な構造変化は生じない</span>。'
                     '本例には明確な局所所見があり該当しない。'),
   ('d', '掌蹠膿疱症性骨関節炎', True, '<span class="kw3">両手掌の膿疱性皮疹（掌蹠膿疱症）＋'
                     '両側胸鎖関節の骨性肥厚・熱感・圧痛</span>という組合せで確定できる。'
                     '<span class="kw3">掌蹠膿疱症性骨関節炎〈PAO〉は前胸壁'
                     '（胸鎖関節・胸肋関節・胸骨柄体結合）を主座とする無菌性の骨関節炎</span>で、'
                     '<span class="kw3">胸肋鎖骨過形成症とも呼ばれる</span>。'
                     '<span class="kw3">骨シンチグラフィで前胸壁に牛の頭〈bull\'s head〉状の集積</span>を示す。'),
   ('e', 'リウマチ性多発筋痛症', False, '<span class="kw4">50歳以上に急性発症する肩・腰帯の痛みとこわばり</span>で、'
                     '<span class="kw4">赤沈亢進・CRP高値、少量ステロイドが著効</span>する。'
                     '<span class="kw4">関節そのものの骨性肥厚は来さず、皮疹も伴わない</span>。'
                     '巨細胞性動脈炎の合併に注意する疾患である。')],
  '掌蹠の無菌性膿疱＋両側胸鎖関節の骨性肥厚・熱感・圧痛＝掌蹠膿疱症性骨関節炎（胸肋鎖骨過形成症）。',
  imgs=['images/114A-37_1.jpeg'],
  patho=('🦴 掌蹠膿疱症性骨関節炎〈PAO〉——前胸部痛から皮膚を見に行く',
         '<span class="kw3">掌蹠膿疱症性骨関節炎〈pustulotic arthro-osteitis: PAO〉は、'
         '掌蹠膿疱症の約10〜30％に合併する無菌性の骨関節炎</span>である。'
         '<span class="kw3">主座は前胸壁——胸鎖関節・胸肋関節・胸骨柄体結合</span>で、'
         '<span class="kw3">骨増殖（過形成）と骨硬化を起こすため「骨性肥厚」として触れる</span>。'
         '<span class="kw3">別名を胸肋鎖骨過形成症〈sternocostoclavicular hyperostosis〉</span>という。<br>'
         '<span class="kw3">画像所見</span>は'
         '<span class="kw3">①単純エックス線・CTで鎖骨内側端・胸骨柄・第1肋軟骨の骨硬化と骨肥厚、'
         '関節裂隙の狭小化・骨性架橋、'
         '②骨シンチグラフィで前胸壁に左右対称の強い集積＝牛の頭〈bull\'s head〉サイン'
         '（胸骨柄が頭、鎖骨内側端が角に見える）</span>が特徴的である。'
         '<span class="kw3">MRIでは骨髄浮腫が早期から捉えられる</span>。<br>'
         '<span class="kw3">PAOは、より広い概念であるSAPHO症候群'
         '（Synovitis 滑膜炎／Acne 痤瘡／Pustulosis 膿疱症／Hyperostosis 骨化過形成／Osteitis 骨炎）</span>の'
         '一部と位置づけられる。'
         '<span class="kw3">いずれも「無菌性」であることが本質で、'
         '培養は陰性、抗菌薬は無効</span>である。<br>'
         '<span class="kw3">治療は皮膚病変と同じ考え方</span>で、'
         '<span class="kw3">誘因除去（禁煙・扁桃摘出・歯科金属除去）＋NSAIDs、'
         '効果不十分ならビスホスホネート・メトトレキサート・生物学的製剤</span>を用いる。'
         '<span class="kw3">扁桃摘出により骨関節症状が劇的に改善する例がある</span>のは'
         '病巣感染という病態を反映している（<span class="kw">Q.108</span>）。'),
  deep=('📌 「前胸部痛」の鑑別に皮膚科疾患を混ぜる',
        '<span class="kw3">前胸部痛といえばまず虚血性心疾患・大動脈解離・肺塞栓を除外する</span>が、'
        '<span class="kw3">それらが否定されたあとに残る「胸壁由来の痛み」に'
        'PAOが紛れている</span>のが本問の狙いである。'
        '<table class="tb"><tr><th>疾患</th><th>手がかり</th></tr>'
        '<tr><td><span class="kw3">掌蹠膿疱症性骨関節炎</span></td>'
        '<td><span class="kw3">胸鎖関節の骨性肥厚・熱感・圧痛＋掌蹠の無菌性膿疱。骨シンチでbull\'s head</span></td></tr>'
        '<tr><td>Tietze症候群／肋軟骨炎</td><td>第2〜3肋軟骨の限局性腫脹と圧痛、自然軽快</td></tr>'
        '<tr><td>化膿性胸鎖関節炎</td>'
        '<td><span class="kw4">発熱・炎症反応高値・単関節。血液培養と穿刺、抗菌薬</span></td></tr>'
        '<tr><td>関節リウマチ</td><td>手指MCP・PIPの対称性滑膜炎、朝のこわばり、抗CCP抗体</td></tr>'
        '<tr><td>強直性脊椎炎</td><td>若年男性、仙腸関節炎、HLA-B27、炎症性腰背部痛</td></tr>'
        '<tr><td>乾癬性関節炎</td><td>DIP関節炎・指趾炎（ソーセージ指）・爪病変・付着部炎</td></tr>'
        '<tr><td>帯状疱疹（前駆期）</td>'
        '<td><span class="kw4">皮疹前の片側性の痛み。数日後にデルマトームに沿った水疱</span>'
        '（<span class="kw">Q.110</span>）</td></tr></table>'
        '<span class="kw3">国試での解き方は単純で、'
        '「前胸部痛」と「手掌・足底の膿疱」の2語が同じ症例文に出たらPAOでよい</span>。'
        '<span class="kw4">本例のようにPIP関節の腫脹が併記されていても、'
        '胸鎖関節の骨性肥厚と掌蹠膿疱の組合せが優先する</span>。'),
  point=('🎯 国試ポイント',
         '① PAO＝<span class="kw3">掌蹠膿疱症＋前胸壁（胸鎖関節・胸肋関節）の無菌性骨関節炎</span>。<br>'
         '② 画像＝<span class="kw3">骨硬化・骨肥厚、骨シンチでbull\'s headサイン</span>。<br>'
         '③ <span class="kw3">SAPHO症候群</span>（滑膜炎・痤瘡・膿疱症・骨化過形成・骨炎）の一部。<br>'
         '④ 治療＝<span class="kw3">禁煙・扁桃摘出・歯科金属除去＋NSAIDs、'
         'ビスホスホネート・生物学的製剤</span>。<span class="kw4">抗菌薬は無効（無菌性）</span>。<br>'
         '⑤ <span class="kw4">発熱＋単関節の激痛なら化膿性胸鎖関節炎</span>——こちらは緊急疾患。')),

Q('113E-30', 88, [('bc', 'CBT'), ('bh', '必修'), ('bi', '📷')],
  '78歳の女性。全身の皮疹を主訴に来院した。'
  '3週間前から両側大腿に<span class="kw">瘙痒を伴う皮疹</span>が出現し、躯幹と四肢に拡大してきたため受診した。'
  '<span class="kw">生検組織の蛍光抗体直接法所見にて表皮基底膜部にIgGとC3の線状沈着</span>を認めた。'
  '<span class="kw">抗BP180抗体421U/mL（基準9.0未満）</span>。大腿の写真を示す。<br>'
  '<strong><span class="kw4">認められない</span>のはどれか。</strong>',
  [('a', '血　疱', False, '<span class="kw4">写真では内容が暗赤色に見える水疱が複数あり、血疱として認められる</span>。'
                     '<span class="kw4">水疱性類天疱瘡では真皮乳頭の血管からの出血により'
                     '水疱内容が血性となることがしばしばある</span>。'),
   ('b', '紅　斑', False, '<span class="kw4">水疱の周囲は広範に発赤しており紅斑を認める</span>。'
                     '<span class="kw4">水疱性類天疱瘡では、水疱に先行して'
                     '瘙痒の強い浮腫性紅斑（蕁麻疹様紅斑）が出現する</span>のが典型で、'
                     '前駆期には紅斑だけのことも多い。'),
   ('c', '水　疱', False, '<span class="kw4">緊満性の大型水疱が多発しており、本疾患の主病変である</span>。'
                     '<span class="kw4">表皮下水疱のため天井が厚く、破れにくい（Nikolsky陰性）</span>。'),
   ('d', '囊　腫', True, '<span class="kw3">囊腫は上皮に裏打ちされた袋に内容物が貯留したもので、'
                     '表皮囊腫（粉瘤）のように波動を触れる皮下腫瘤として存在する</span>'
                     '（<span class="kw">Q.101・Q.114</span>）。'
                     '<span class="kw3">自己免疫性水疱症の病変として生じるものではなく、写真にも認めない</span>。'
                     'これが正解である。'),
   ('e', 'びらん', False, '<span class="kw4">水疱が破れた後の、表皮が欠損して湿潤した面（びらん）を認める</span>。'
                     '<span class="kw4">びらんは表皮までの欠損で瘢痕を残さず治癒する</span>のに対し、'
                     '<span class="kw4">潰瘍は真皮以深に及び瘢痕を残す</span>——'
                     'この区別も発疹学の基本である。')],
  '抗BP180抗体高値・基底膜部の線状IgG/C3沈着＝水疱性類天疱瘡。紅斑・水疱・血疱・びらんはすべて生じるが、囊腫は生じない。',
  imgs=['images/113E-30_1.jpeg'],
  patho=('👀 写真から発疹名を拾う——「続発疹」まで含めて読む',
         '<span class="kw3">本問は診断（水疱性類天疱瘡）を検査所見で先に与えたうえで、'
         '「写真に写っている発疹の名前を言えるか」を問う発疹学の問題</span>である。'
         '<span class="kw3">原発疹（最初に生じる皮疹）と続発疹（原発疹が変化して生じる皮疹）を'
         '分けて覚えておく</span>と読み落としがない。'
         '<table class="tb"><tr><th>区分</th><th>発疹</th><th>定義</th></tr>'
         '<tr><td rowspan="5">原発疹</td><td>紅斑</td><td>血管拡張による発赤。硝子圧で退色する</td></tr>'
         '<tr><td>紫斑</td><td><span class="kw3">真皮内の出血。硝子圧で退色しない</span></td></tr>'
         '<tr><td>水疱</td><td>漿液を入れた隆起。表皮内なら弛緩性、表皮下なら緊満性</td></tr>'
         '<tr><td><span class="kw3">血疱</span></td><td><span class="kw3">内容が血性の水疱</span></td></tr>'
         '<tr><td>囊腫</td><td><span class="kw3">上皮性の袋に内容物が貯留。波動を触れる</span></td></tr>'
         '<tr><td rowspan="4">続発疹</td><td><span class="kw3">びらん</span></td>'
         '<td><span class="kw3">表皮までの欠損。瘢痕を残さない</span></td></tr>'
         '<tr><td><span class="kw3">潰瘍</span></td>'
         '<td><span class="kw3">真皮以深に及ぶ欠損。瘢痕を残す</span></td></tr>'
         '<tr><td>痂皮</td><td>滲出液・血液・膿が乾燥固着したもの（かさぶた）</td></tr>'
         '<tr><td>鱗屑・膿痂疹・瘢痕・苔癬化</td><td>角層の剝離、膿を伴う痂皮、線維化、慢性搔破による肥厚</td></tr></table>'
         '<span class="kw3">水疱性類天疱瘡の1枚の写真には、'
         '紅斑（前駆〜周囲）・水疱（主病変）・血疱（出血を伴う水疱）・'
         'びらん（破れた跡）・痂皮が同時に写る</span>。'
         '<span class="kw3">「その疾患の経過で生じうるか」を考えれば、'
         '囊腫だけが場違いであると分かる</span>。'),
  deep=('📌 抗BP180抗体の使い方と、水疱性類天疱瘡の治療',
        '<span class="kw3">抗BP180抗体（ELISA）は水疱性類天疱瘡の診断と経過観察の中心的な検査</span>である。'
        '<span class="kw3">本例は421U/mL（基準9.0未満）と著明高値</span>で、'
        '<span class="kw3">抗体価は疾患活動性とよく相関する</span>ため'
        '<span class="kw3">治療反応の指標にも使える</span>。'
        '<table class="tb"><tr><th>重症度</th><th>治療</th></tr>'
        '<tr><td>軽症（限局性）</td>'
        '<td><span class="kw3">ストロング〜ベリーストロングのステロイド外用</span>、'
        '<span class="kw3">テトラサイクリン系＋ニコチン酸アミド</span>、DDS（ジアフェニルスルホン）</td></tr>'
        '<tr><td><span class="kw3">中等症〜重症</span></td>'
        '<td><span class="kw3">プレドニゾロン0.5〜1.0mg/kg/日の全身投与</span>。'
        '効果不十分なら免疫抑制薬（アザチオプリン・ミコフェノール酸モフェチル）併用</td></tr>'
        '<tr><td>難治・重症</td>'
        '<td><span class="kw3">ステロイドパルス、大量免疫グロブリン療法〈IVIg〉、血漿交換、リツキシマブ</span></td></tr></table>'
        '<span class="kw4">高齢者に長期ステロイドを使うことになるので、'
        '感染症（ニューモシスチス肺炎の予防）・糖尿病・骨粗鬆症・消化性潰瘍・'
        'せん妄への対策を最初から組む</span>のが実地の要点である。<br>'
        '<span class="kw3">薬剤誘発性の可能性を必ず検討する</span>——'
        '<span class="kw3">DPP-4阻害薬（シタグリプチン、ビルダグリプチンなど）による'
        '水疱性類天疱瘡は本邦で多数報告があり、'
        '被疑薬の中止だけで軽快することがある</span>。'
        '<span class="kw3">高齢の糖尿病患者に水疱が出たら、処方歴を必ず確認する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">びらん＝表皮までの欠損（瘢痕を残さない）／潰瘍＝真皮以深（瘢痕を残す）</span>。<br>'
         '② <span class="kw3">血疱＝内容が血性の水疱</span>。'
         '<span class="kw3">紫斑＝隆起しない出血斑（硝子圧で退色しない）</span>。<br>'
         '③ <span class="kw3">囊腫は上皮性の袋＝波動を触れる腫瘤</span>。'
         '<span class="kw4">水疱症の皮疹としては現れない</span>。<br>'
         '④ 抗BP180抗体は<span class="kw3">診断＋活動性の指標</span>。'
         '基底膜部の線状IgG・C3沈着とセットで水疱性類天疱瘡。<br>'
         '⑤ 治療は<span class="kw3">ステロイド（外用・全身）</span>、'
         '軽症は<span class="kw3">テトラサイクリン＋ニコチン酸アミド</span>。'
         '<span class="kw4">DPP-4阻害薬の関与を確認</span>。')),

Q('111B-49', 81, [('bc', 'CBT'), ('bi', '📷')],
  '55歳の男性。<span class="kw">両側の手掌と足底に半年前から認める皮疹</span>を主訴に来院した。'
  '<span class="kw">鱗屑の苛性カリ〈KOH〉直接鏡検法で真菌を認めない</span>。'
  '初診時の右足底の写真を示す。<br>'
  '<strong>診断に有用なのはどれか。2つ選べ。</strong>',
  [('a', '喫煙歴', True, '<span class="kw3">掌蹠膿疱症の患者は喫煙者が圧倒的に多く、'
                     '喫煙は発症・増悪の最大の環境因子である</span>。'
                     '<span class="kw3">禁煙により皮疹が改善することがあり、'
                     '喫煙歴の聴取は診断の支持と治療方針の決定の両方に有用</span>である。'),
   ('b', '飲酒歴', False, '<span class="kw4">飲酒は乾癬の増悪因子として知られる</span>が、'
                     '<span class="kw4">掌蹠膿疱症の診断に寄与する情報ではない</span>。'
                     '本問は「2つ選べ」なので、より特異度の高い喫煙と歯科治療歴を優先する。'),
   ('c', '海外渡航歴', False, '<span class="kw4">海外渡航歴が診断に効くのは輸入感染症（マラリア・デング熱・'
                     '皮膚リーシュマニア症・皮膚幼虫移行症など）</span>である。'
                     '<span class="kw4">半年続く両側性の掌蹠病変には結びつかない</span>。'),
   ('d', '歯科治療歴', True, '<span class="kw3">掌蹠膿疱症では、歯科金属（パラジウム・ニッケル・水銀・コバルトなど）に対する'
                     '全身型金属アレルギーが増悪因子となることがあり、'
                     '金属除去で軽快する例がある</span>。'
                     '<span class="kw3">さらに根尖病巣・歯周炎といった歯性感染は'
                     '扁桃と並ぶ代表的な病巣感染</span>である。'
                     '<span class="kw3">「歯科治療歴」は金属アレルギーと病巣感染の両方を'
                     '同時に拾える設問</span>になっている。'),
   ('e', 'ペット飼育歴', False, '<span class="kw4">ペット飼育歴が有用なのは、'
                     'イヌ・ネコ・ウサギ由来の白癬（Microsporum canis など）や'
                     '猫ひっかき病、疥癬などを疑うとき</span>である。'
                     '<span class="kw4">本例はKOHで真菌を認めておらず、白癬は既に除外されている</span>。')],
  '両側掌蹠の半年続く皮疹でKOH陰性＝掌蹠膿疱症。3大誘因のうち問診で拾えるのは喫煙歴と歯科治療歴（金属アレルギー・歯性病巣）。',
  imgs=['images/111B-49_1.jpeg'],
  ans_label='ａ・ｄ',
  patho=('🚬 掌蹠膿疱症の問診——「タバコ・のど・歯」を必ず聞く',
         '<span class="kw3">掌蹠膿疱症は、原因を1つに特定できないものの、'
         '3つの増悪因子がよく知られており、いずれも問診と簡単な検査で拾える</span>。'
         '<table class="tb"><tr><th>因子</th><th>聞き方・調べ方</th><th>介入</th></tr>'
         '<tr><td><span class="kw3">①喫煙</span></td>'
         '<td><span class="kw3">喫煙歴（本数×年数）</span></td>'
         '<td><span class="kw3">禁煙。治療の一部として明確に指導する</span></td></tr>'
         '<tr><td><span class="kw3">②病巣感染</span></td>'
         '<td><span class="kw3">扁桃炎の反復、歯科治療歴・歯痛、副鼻腔炎症状。'
         '扁桃誘発試験、歯科でのパノラマエックス線</span></td>'
         '<td><span class="kw3">扁桃摘出、根尖病巣・歯周炎の治療</span></td></tr>'
         '<tr><td><span class="kw3">③金属アレルギー</span></td>'
         '<td><span class="kw3">歯科金属の有無、パッチテスト（パラジウム・ニッケル・水銀・コバルト）</span></td>'
         '<td><span class="kw3">原因金属の除去・置換</span></td></tr></table>'
         '<span class="kw3">本問は「診断に有用なのはどれか」と問うているが、'
         '実質は「この疾患の増悪因子を知っているか」を試している</span>。'
         '<span class="kw3">KOH陰性という一文で白癬が除外され、'
         '両側性・半年の経過という情報から掌蹠膿疱症が想定されている</span>ため、'
         '<span class="kw3">残る仕事はその背景因子を確認すること</span>になる。<br>'
         '<span class="kw4">正答率81％は、b（飲酒歴）を乾癬の増悪因子から連想して'
         '選んでしまう受験生がいるため</span>と考えられる。'
         '<span class="kw4">飲酒・肥満・ストレスは乾癬の因子であって、'
         '掌蹠膿疱症で第一に挙げるものではない</span>。'),
  deep=('📌 皮膚科の問診で「効く」項目リスト',
        '<span class="kw3">皮膚疾患は問診で診断の半分が決まる</span>。'
        '<span class="kw3">どの病歴がどの疾患に効くのかを対にして覚えておくと、'
        '本問のような設問に強くなる</span>。'
        '<table class="tb"><tr><th>病歴</th><th>想起すべき疾患</th></tr>'
        '<tr><td><span class="kw3">喫煙</span></td>'
        '<td><span class="kw3">掌蹠膿疱症</span>／化膿性汗腺炎／Buerger病</td></tr>'
        '<tr><td><span class="kw3">歯科治療・歯科金属</span></td>'
        '<td><span class="kw3">掌蹠膿疱症</span>／全身型金属アレルギー／扁平苔癬（歯科金属・C型肝炎）</td></tr>'
        '<tr><td>扁桃炎の反復</td>'
        '<td><span class="kw3">掌蹠膿疱症・滴状乾癬・IgA腎症・結節性紅斑</span></td></tr>'
        '<tr><td>薬剤（内服開始時期）</td>'
        '<td><span class="kw3">薬疹・SJS/TEN・DIHS・DPP-4阻害薬による水疱性類天疱瘡・'
        'SH基薬剤による落葉状天疱瘡</span></td></tr>'
        '<tr><td>海外渡航</td><td>皮膚リーシュマニア症・皮膚幼虫移行症・デング熱</td></tr>'
        '<tr><td>ペット・動物接触</td><td>動物由来白癬・猫ひっかき病・疥癬・ツツガムシ病</td></tr>'
        '<tr><td>職業（湿潤作業・化学物質）</td><td>手湿疹・接触皮膚炎・職業性白斑</td></tr>'
        '<tr><td>日光曝露</td><td>光線過敏型薬疹・多形日光疹・ポルフィリン症・エリテマトーデス</td></tr>'
        '<tr><td>下痢・腹痛</td>'
        '<td><span class="kw3">壊疽性膿皮症（IBD）</span>／疱疹状皮膚炎（セリアック病）</td></tr></table>'
        '<span class="kw3">掌蹠膿疱症では、これらのうち'
        '「喫煙・扁桃・歯」の3点セットを必ず聞く</span>と覚えてしまえばよい。'),
  point=('🎯 国試ポイント',
         '① 掌蹠膿疱症の3大誘因＝<span class="kw3">喫煙／病巣感染（扁桃・歯性・副鼻腔）／'
         '歯科金属アレルギー</span>。<br>'
         '② <span class="kw3">KOH直接鏡検で白癬を除外</span>するのが診断の必須手順。<br>'
         '③ <span class="kw3">禁煙・扁桃摘出・金属除去</span>はいずれも治療になりうる。<br>'
         '④ <span class="kw4">飲酒・肥満・ストレスは乾癬の増悪因子</span>——混同しない。<br>'
         '⑤ 前胸部痛があれば<span class="kw3">掌蹠膿疱症性骨関節炎</span>を疑う'
         '（<span class="kw">Q.111</span>）。')),

]

QUESTIONS += [

Q('111E-52', 76, [('bi', '📷')],
  '45歳の男性。2か月前から生じた<span class="kw">右腋窩の皮疹</span>を主訴に来院した。'
  '<span class="kw">被覆皮膚と癒着し波動を触れる径20mmの皮疹</span>が存在する。'
  '腋窩の写真（A）と皮疹部の超音波像（B）とを示す。<br>'
  '<strong>この皮疹の種類はどれか。</strong>',
  [('a', '丘　疹', False, '<span class="kw4">直径10mm未満の充実性小隆起</span>。'
                     '<span class="kw4">液体を含まないため波動はなく、'
                     '超音波でも内部エコーは充実性となる</span>。径20mmという大きさとも合わない。'),
   ('b', '苔　癬', False, '<span class="kw4">小丘疹が集簇して面をなした状態を表す用語</span>で、'
                     '<span class="kw4">扁平苔癬・光沢苔癬のように「集簇した状態」を指す</span>。'
                     '単発の皮下腫瘤には使わない。'),
   ('c', '囊　腫', True, '<span class="kw3">上皮に裏打ちされた袋の中に角質・液体などの内容物が貯留したもの</span>で、'
                     '<span class="kw3">触診で波動を触れる</span>のが決め手。'
                     '<span class="kw3">超音波像（B）でも境界明瞭な類円形の低エコー腫瘤として描出</span>されている。'
                     '<span class="kw3">腋窩で被覆皮膚と癒着している径20mmの波動性腫瘤＝'
                     '表皮囊腫（粉瘤・アテローム）</span>である。'),
   ('d', '膿　疱', False, '<span class="kw4">膿を入れた数mm大の小隆起で、病変は表皮内〜角層下と浅い</span>。'
                     '<span class="kw4">掌蹠膿疱症や膿疱性乾癬で見られる発疹</span>であり、'
                     '<span class="kw4">皮下の腫瘤を指す語ではない</span>。'),
   ('e', '膨　疹', False, '<span class="kw4">真皮上層の一過性浮腫＝蕁麻疹の皮疹</span>で、'
                     '<span class="kw4">通常24時間以内に跡を残さず消える</span>。'
                     '2か月持続する腫瘤には当てはまらない。')],
  '腋窩に2か月持続する、被覆皮膚と癒着した径20mmの波動性腫瘤。超音波で内容物の貯留。皮疹の種類は囊腫。',
  imgs=['images/111E-52_1.jpeg', 'images/111E-52_2.jpeg'],
  patho=('🔁 同一問題の再出題——Q.101（119F-50）とまったく同じ',
         '<span class="kw3">本問は第119回のQ.101（119F-50）と、症例文・写真・選択肢・正解のすべてが同一</span>である。'
         '<span class="kw3">第111回に出題されたものが、8年後の第119回でほぼそのまま再出題された</span>。'
         '<span class="kw3">正答率は111回で76％、119回で92％</span>と上がっており、'
         '<span class="kw3">過去問演習が正答率を押し上げる典型例</span>になっている。'
         '<span class="kw3">この章の学習では「過去問を繰り返した者が確実に取れる問題」として'
         '両方を残してある</span>。<br>'
         '<span class="kw3">押さえるべき論理は3段</span>である。'
         '<span class="kw3">①「波動を触れる」＝内部に液体・粥状物が貯留している。'
         '②内容物を入れた袋状の病変＝囊腫。'
         '③被覆皮膚と癒着＋腋窩＋径20mm＝表皮囊腫（粉瘤）</span>。'
         '<span class="kw3">設問が問うているのは診断名ではなく「皮疹の種類（発疹名）」</span>である点に'
         '注意する——'
         '<span class="kw4">「表皮囊腫」という診断名を選ばせる問題ではなく、'
         '発疹学の用語を選ばせている</span>。<br>'
         '<span class="kw3">超音波（B）の読み</span>も確認しておく。'
         '<span class="kw3">境界明瞭・類円形・内部は低〜等エコーでやや不均一、後方エコー増強</span>——'
         '<span class="kw3">これは液体〜半固形の内容物が袋に入っている像</span>である。'
         '<span class="kw3">充実性腫瘍なら後方エコーは増強せず、'
         '血流シグナル（ドプラ）を伴うことがある</span>。'),
  deep=('📌 腋窩の腫瘤——粉瘤以外に何を考えるか',
        '<table class="tb"><tr><th>疾患</th><th>特徴</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">表皮囊腫（粉瘤）</span></td>'
        '<td><span class="kw3">中央に開口部（黒点）、被覆皮膚と癒着、波動、悪臭のある粥状内容</span></td>'
        '<td><span class="kw3">囊腫壁ごと摘出。感染時はまず切開排膿</span></td></tr>'
        '<tr><td>脂肪腫</td><td>皮下の柔らかい扁平な腫瘤、可動性良好、開口部なし</td>'
        '<td>超音波で線状高エコーを含む等エコー腫瘤</td></tr>'
        '<tr><td><span class="kw3">化膿性汗腺炎</span></td>'
        '<td><span class="kw3">腋窩・鼠径・殿部に有痛性結節・膿瘍・瘻孔・索状瘢痕を反復</span></td>'
        '<td><span class="kw3">喫煙・肥満が増悪因子。抗菌薬・生物学的製剤・広範切除</span></td></tr>'
        '<tr><td>リンパ節腫脹</td><td>可動性、複数、圧痛の有無で炎症性か腫瘍性かを推定</td>'
        '<td><span class="kw4">腋窩リンパ節は乳癌・悪性黒色腫の所属リンパ節</span></td></tr>'
        '<tr><td>副乳</td><td>乳腺堤に沿った位置、月経周期で腫脹</td><td>両側性のことがある</td></tr>'
        '<tr><td>汗腺腫瘍（汗孔腫など）</td><td>単発の紅色結節</td><td>生検で確定</td></tr></table>'
        '<span class="kw4">粉瘤で最も多い実地の失敗は、炎症性粉瘤（感染・破裂した粉瘤）に対して'
        '急性期に摘出術を行い、境界が分からず壁を残して再発させること</span>である。'
        '<span class="kw3">急性期は切開排膿と抗菌薬で炎症を鎮め、'
        '数か月後に囊腫壁ごと摘出する</span>のが定石になる。<br>'
        '<span class="kw4">なお、稀ではあるが長期に存在する粉瘤から有棘細胞癌が発生することがある</span>。'
        '<span class="kw4">急速な増大・易出血性・硬結を伴う場合は生検を検討する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">波動を触れる＝内容物の貯留 ⇒ 囊腫</span>（充実性なら丘疹・結節）。<br>'
         '② 表皮囊腫＝<span class="kw3">開口部（黒点）・被覆皮膚と癒着・粥状内容</span>、'
         '<span class="kw3">治療は囊腫壁ごと摘出</span>。<br>'
         '③ 超音波＝<span class="kw3">境界明瞭・後方エコー増強</span>。'
         '脂肪腫・リンパ節と区別する。<br>'
         '④ 腋窩の反復する有痛性結節・瘻孔なら<span class="kw3">化膿性汗腺炎</span>。<br>'
         '⑤ 本問は<span class="kw">Q.101（119F-50）と同一問題</span>——'
         '<span class="kw3">発疹学の定義問題は繰り返し出る</span>。')),

Q('110I-36', 58, [],
  '<strong>病変部皮膚の<span class="kw">表皮基底膜部にIgGが沈着</span>する疾患はどれか。2つ選べ。</strong>',
  [('a', '天疱瘡', False, '<span class="kw4">天疱瘡は表皮「細胞間」に網目状のIgGが沈着する</span>。'
                     '<span class="kw4">標的はデスモグレイン1・3で、'
                     '角化細胞どうしの接着装置（デスモソーム）を攻撃する</span>ため、'
                     '<span class="kw4">沈着部位は基底膜部ではない</span>。'
                     '裂隙も表皮内にできる（<span class="kw">Q.103・Q.117</span>）。'),
   ('b', '疱疹状皮膚炎', False, '<span class="kw4">Duhring疱疹状皮膚炎の直接法所見は'
                     '「真皮乳頭部に顆粒状のIgA沈着」</span>である。'
                     '<span class="kw4">IgGでも基底膜部でもない</span>。'
                     'グルテン過敏性腸症（セリアック病）を合併し、'
                     'DDS（ジアフェニルスルホン）が著効する。'),
   ('c', '水疱性類天疱瘡', True, '<span class="kw3">ヘミデスモソームのBP180（XVII型コラーゲン）・BP230に対するIgG抗体</span>により、'
                     '<span class="kw3">表皮基底膜部にIgGとC3が線状に沈着</span>する。'
                     '<span class="kw3">salt-split skin法では抗体が表皮側に付く</span>のが'
                     '後天性表皮水疱症との鑑別点である（<span class="kw">Q.100</span>）。'),
   ('d', 'Hailey-Hailey病', False, '<span class="kw4">家族性良性慢性天疱瘡。ATP2C1遺伝子（ゴルジ体Ca²⁺ポンプSPCA1）変異による'
                     '常染色体顕性遺伝疾患</span>で、'
                     '<span class="kw4">自己抗体は関与しない＝蛍光抗体法で沈着を認めない</span>。'
                     '<span class="kw4">間擦部（腋窩・鼠径・頸部）のびらん・亀裂を反復し、'
                     '病理では「崩れかけたレンガ塀」様の広範な棘融解</span>を示す。'),
   ('e', '後天性表皮水疱症', True, '<span class="kw3">基底膜の緻密層直下にある係留線維の主成分'
                     'Ⅶ型コラーゲンに対するIgG抗体</span>による表皮下水疱症で、'
                     '<span class="kw3">直接法では基底膜部に線状のIgG沈着</span>を示す。'
                     '<span class="kw3">salt-split skinでは真皮側に付く</span>。'
                     '<span class="kw3">外力のかかる手足・肘膝に水疱・びらんを生じ、'
                     '瘢痕と稗粒腫を残す（機械的脆弱型）</span>のが臨床的特徴で、'
                     'Crohn病の合併が知られる。')],
  '基底膜部に線状IgGが沈着するのは水疱性類天疱瘡（BP180/BP230）と後天性表皮水疱症（Ⅶ型コラーゲン）。天疱瘡は細胞間、疱疹状皮膚炎は真皮乳頭部のIgA、Hailey-Hailey病は自己抗体なし。',
  ans_label='ｃ・ｅ',
  patho=('🎯 「基底膜部に線状IgG」の2疾患を確実に分ける',
         '<span class="kw3">本章で最も正答率が低い問題（58％）</span>である。'
         '<span class="kw3">「2つ選べ」の形式で、'
         '同じ直接法所見をもつ2疾患を答えさせる</span>ため、'
         '<span class="kw3">1つ（水疱性類天疱瘡）は分かっても、'
         'もう1つ（後天性表皮水疱症）を落とすと失点する</span>。'
         '<span class="kw3">「基底膜部に線状IgG」は水疱性類天疱瘡の専売特許ではない、'
         'という一点を必ず覚えておく</span>。<br>'
         '<span class="kw3">整理はこうなる</span>。'
         '<table class="tb"><tr><th>疾患</th><th>クラス</th><th>部位・形</th><th>標的抗原</th></tr>'
         '<tr><td><span class="kw3">水疱性類天疱瘡</span></td><td><span class="kw3">IgG＋C3</span></td>'
         '<td><span class="kw3">基底膜部・線状</span></td>'
         '<td><span class="kw3">BP180（XVII型コラーゲン）・BP230</span></td></tr>'
         '<tr><td><span class="kw3">後天性表皮水疱症</span></td><td><span class="kw3">IgG</span></td>'
         '<td><span class="kw3">基底膜部・線状</span></td>'
         '<td><span class="kw3">Ⅶ型コラーゲン（係留線維）</span></td></tr>'
         '<tr><td>粘膜類天疱瘡</td><td>IgG（±IgA）</td><td>基底膜部・線状</td>'
         '<td>BP180・ラミニン332</td></tr>'
         '<tr><td>妊娠性類天疱瘡</td><td>C3（±IgG）</td><td>基底膜部・線状</td><td>BP180</td></tr>'
         '<tr><td>線状IgA水疱性皮膚症</td><td><span class="kw4">IgA</span></td><td>基底膜部・線状</td>'
         '<td>LAD-1（BP180の分解産物）</td></tr>'
         '<tr><td>天疱瘡</td><td>IgG</td><td><span class="kw4">表皮細胞間・網目状</span></td>'
         '<td>デスモグレイン1・3</td></tr>'
         '<tr><td>疱疹状皮膚炎</td><td><span class="kw4">IgA</span></td>'
         '<td><span class="kw4">真皮乳頭部・顆粒状</span></td><td>表皮型トランスグルタミナーゼ</td></tr>'
         '<tr><td>エリテマトーデス</td><td>IgG・IgM・C3</td>'
         '<td><span class="kw4">基底膜部・顆粒状</span></td><td>免疫複合体の沈着</td></tr>'
         '<tr><td><span class="kw4">Hailey-Hailey病・Darier病・表皮水疱症</span></td>'
         '<td colspan="3"><span class="kw4">遺伝性疾患のため自己抗体は沈着しない（陰性）</span></td></tr></table>'
         '<span class="kw3">「線状か顆粒状か」「IgGかIgAか」「基底膜部か細胞間か真皮乳頭部か」の'
         '3軸で全疾患が一意に決まる</span>（<span class="kw">Q.106</span>）。'),
  deep=('📌 後天性表皮水疱症〈EBA〉——見落としがちなもう1疾患',
        '<span class="kw3">後天性表皮水疱症〈epidermolysis bullosa acquisita: EBA〉は、'
        'Ⅶ型コラーゲンに対する自己抗体による後天性の表皮下水疱症</span>である。'
        '<span class="kw3">同じ分子の遺伝子（COL7A1）変異で起こるのが'
        '栄養障害型表皮水疱症（先天性）</span>で、'
        '<span class="kw3">「後天性は自己抗体、先天性は遺伝子変異」と対で覚える</span>。'
        '<table class="tb"><tr><th>病型</th><th>臨床像</th></tr>'
        '<tr><td><span class="kw3">機械的脆弱型（古典型）</span></td>'
        '<td><span class="kw3">手背・肘・膝・足など外力のかかる部位に水疱・びらん。'
        '治癒後に瘢痕と稗粒腫〈milium〉を残す。爪の変形・瘢痕性脱毛</span></td></tr>'
        '<tr><td>炎症型（類天疱瘡様）</td>'
        '<td>体幹・四肢に瘙痒を伴う紅斑と緊満性水疱。'
        '<span class="kw4">水疱性類天疱瘡と臨床的に区別できない</span></td></tr>'
        '<tr><td>粘膜型</td><td>口腔・眼粘膜のびらんと瘢痕化</td></tr></table>'
        '<span class="kw3">合併症としてCrohn病が有名</span>で、'
        '<span class="kw3">Ⅶ型コラーゲンが腸管上皮の基底膜にも存在する</span>ことによると考えられている。'
        '<span class="kw3">診断はsalt-split skinで真皮側に抗体が付くこと、'
        '抗Ⅶ型コラーゲン抗体（ELISA）、'
        '蛍光抗体直接法のu-serrated pattern（真皮側に沿った鋸歯状の蛍光）</span>で行う。'
        '<span class="kw4">治療は水疱性類天疱瘡より難治で、'
        'ステロイドに加えコルヒチン・DDS・免疫抑制薬・IVIg・リツキシマブを要する</span>ことが多い。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">基底膜部の線状IgG＝水疱性類天疱瘡＋後天性表皮水疱症</span>（2つある！）。<br>'
         '② <span class="kw3">表皮細胞間の網目状IgG＝天疱瘡</span>、'
         '<span class="kw3">真皮乳頭部の顆粒状IgA＝疱疹状皮膚炎</span>。<br>'
         '③ <span class="kw3">Hailey-Hailey病・Darier病・（先天性）表皮水疱症は遺伝性＝自己抗体なし</span>。<br>'
         '④ 両者の鑑別は<span class="kw3">salt-split skin（表皮側＝BP／真皮側＝EBA）</span>。<br>'
         '⑤ EBAは<span class="kw3">外力部位の水疱・瘢痕・稗粒腫、Crohn病の合併</span>。')),

Q('109A-25', 98, [('bi', '📷')],
  '42歳の女性。<span class="kw">両手掌と足底の皮疹の悪化</span>を主訴に来院した。'
  '<span class="kw">1年前から両手掌と足底とに皮疹が繰り返し出現</span>している。'
  '<span class="kw">半年前から両側胸鎖関節部に痛み</span>がある。手足の写真（A，B）を示す。<br>'
  '<strong>最も考えられる疾患はどれか。</strong>',
  [('a', '扁平苔癬', False, '<span class="kw4">手関節屈側・下腿に紫紅色で多角形の扁平な丘疹、'
                     '表面にWickham線条</span>を認める。'
                     '<span class="kw4">口腔粘膜にレース状白斑を伴い、C型肝炎や歯科金属との関連</span>がある。'
                     '<span class="kw4">膿疱は作らない</span>。'),
   ('b', '菌状息肉症', False, '<span class="kw4">皮膚T細胞リンパ腫。紅斑期→局面期→腫瘤期と年単位で進行</span>し、'
                     '<span class="kw4">病理では異型リンパ球の表皮向性（Pautrier微小膿瘍）</span>を認める。'
                     '<span class="kw4">掌蹠に限局する膿疱性病変ではない</span>。'),
   ('c', '掌蹠膿疱症', True, '<span class="kw3">両手掌・足底に無菌性膿疱が1年にわたり消長を繰り返し、'
                     '両側胸鎖関節部に疼痛がある</span>——'
                     '<span class="kw3">掌蹠膿疱症＋掌蹠膿疱症性骨関節炎〈PAO〉の典型例</span>である。'
                     '<span class="kw3">写真でも掌蹠に黄色調の膿疱と鱗屑・紅斑が混在</span>している。'
                     '<span class="kw3">正答率98％——本章で最も易しい問題</span>で、'
                     '<span class="kw3">「掌蹠の膿疱＋前胸部痛」だけで解ける</span>。'),
   ('d', '尋常性狼瘡', False, '<span class="kw4">皮膚結核の一型で、顔面に緩徐に拡大する褐色調の局面（狼瘡結節）</span>を作る。'
                     '<span class="kw4">硝子圧法でapple-jelly nodule（りんごゼリー状結節）</span>が見え、'
                     '<span class="kw4">病理は乾酪壊死を伴う類上皮細胞肉芽腫</span>。'
                     '掌蹠の膿疱とは無関係である。'),
   ('e', '種痘様水疱症', False, '<span class="kw4">EBウイルス関連のT/NK細胞増殖症で、'
                     '小児の露光部（顔面・手背）に日光曝露後、水疱・壊死・痂皮を生じ痘瘡様瘢痕を残す</span>。'
                     '<span class="kw4">発熱・肝脾腫を伴い、蚊刺過敏症を合併</span>する。'
                     '成人女性の掌蹠病変には合致しない。')],
  '両掌蹠に1年繰り返す無菌性膿疱＋両側胸鎖関節痛＝掌蹠膿疱症（＋掌蹠膿疱症性骨関節炎）。',
  imgs=['images/109A-25_1.jpeg', 'images/109A-25_2.jpeg'],
  patho=('✅ 掌蹠膿疱症の「型」を最後に固める',
         '<span class="kw3">本章では掌蹠膿疱症が5問（Q.102・108・111・113・116）出題されており、'
         '出題パターンは4つに集約できる</span>。'
         '<table class="tb"><tr><th>問い方</th><th>答え</th><th>該当問題</th></tr>'
         '<tr><td>診断は何か</td><td><span class="kw3">掌蹠膿疱症</span></td>'
         '<td>Q.116</td></tr>'
         '<tr><td>合併する関節炎の部位</td><td><span class="kw3">前胸壁（胸鎖関節・胸肋関節）</span></td>'
         '<td>Q.102</td></tr>'
         '<tr><td>合併しやすい疾患</td><td><span class="kw3">慢性扁桃炎（病巣感染）</span></td>'
         '<td>Q.108</td></tr>'
         '<tr><td>診断・治療に有用な情報</td><td><span class="kw3">喫煙歴・歯科治療歴</span></td>'
         '<td>Q.113</td></tr>'
         '<tr><td>関節病変の原因</td><td><span class="kw3">掌蹠膿疱症性骨関節炎</span></td>'
         '<td>Q.111</td></tr></table>'
         '<span class="kw3">臨床像の骨格</span>は'
         '<span class="kw3">①中年（40〜50歳代）の、しばしば女性、'
         '②両側の手掌・足底に、無菌性の膿疱・小水疱と鱗屑・紅斑が混在し、'
         '③週〜月単位で新生と消退を繰り返して慢性に経過し、'
         '④KOHで真菌は陰性</span>である。'
         '<span class="kw3">爪甲の点状陥凹や肥厚・混濁（爪の掌蹠膿疱症）を伴う</span>ことがある。<br>'
         '<span class="kw3">病理は表皮内（角層下）の無菌性好中球膿疱＝Kogoj海綿状膿疱</span>で、'
         '<span class="kw3">乾癬と共通の所見</span>である。'
         '<span class="kw4">実際、掌蹠膿疱症を乾癬の一亜型（膿疱性乾癬の限局型）と'
         'みなすかどうかは議論がある</span>が、'
         '<span class="kw4">国試レベルでは「病巣感染・喫煙・金属アレルギーが誘因の独立した疾患」として'
         '扱えばよい</span>。'),
  deep=('📌 掌蹠に「膿疱」を作る疾患・作らない疾患',
        '<table class="tb"><tr><th>膿疱を作る</th><th>膿疱を作らない（鑑別）</th></tr>'
        '<tr><td><span class="kw3">掌蹠膿疱症</span>（無菌性・両側性・消長）</td>'
        '<td>扁平苔癬（紫紅色・多角形・Wickham線条）</td></tr>'
        '<tr><td>膿疱性乾癬（汎発型：発熱＋全身の膿疱）</td>'
        '<td>掌蹠角化症（びまん性角化と亀裂）</td></tr>'
        '<tr><td>急性汎発性発疹性膿疱症〈AGEP〉'
        '（<span class="kw4">薬剤性・発熱・数日で小膿疱が多発</span>）</td>'
        '<td>第2期梅毒（手掌の落屑性紅斑・無症候）</td></tr>'
        '<tr><td>膿痂疹（細菌性・膿疱の内容は有菌）</td>'
        '<td>汗疱／異汗性湿疹（小水疱・夏に悪化）</td></tr>'
        '<tr><td>白癬性膿疱（KOH陽性）</td>'
        '<td>手湿疹・接触皮膚炎（職業歴・接触歴）</td></tr></table>'
        '<span class="kw3">膿疱を見たら最初にする2つの検査が'
        '「KOH直接鏡検（真菌）」と「膿疱内容の細菌培養（有菌か無菌か）」</span>である。'
        '<span class="kw3">どちらも陰性であれば無菌性膿疱症＝掌蹠膿疱症・膿疱性乾癬・AGEPへ絞られる</span>。<br>'
        '<span class="kw4">AGEPは薬剤（β-ラクタム系抗菌薬など）投与後数日で'
        '発熱とともに全身に小膿疱が多発する重症薬疹で、'
        '被疑薬の中止が最優先</span>——'
        '<span class="kw4">「掌蹠限局・慢性・無熱」の掌蹠膿疱症とは'
        '経過と全身症状で明確に区別できる</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">掌蹠の無菌性膿疱が消長＋前胸部（胸鎖関節）痛＝掌蹠膿疱症</span>。<br>'
         '② 検査は<span class="kw3">KOH陰性・膿疱は無菌</span>を確認。'
         '病理は<span class="kw3">Kogoj海綿状膿疱</span>。<br>'
         '③ 誘因＝<span class="kw3">喫煙・病巣感染・歯科金属</span>。'
         '合併＝<span class="kw3">PAO（SAPHO症候群）</span>。<br>'
         '④ 鑑別＝<span class="kw4">足白癬（KOH陽性）／汗疱／扁平苔癬／第2期梅毒／AGEP（薬剤性・発熱）</span>。<br>'
         '⑤ 爪の点状陥凹は<span class="kw3">乾癬・掌蹠膿疱症</span>で見られる。')),

Q('109D-4', 87, [],
  '<strong>蛍光抗体法で病変皮膚の<span class="kw">表皮細胞間にIgGの沈着</span>を認める疾患はどれか。</strong>',
  [('a', '全身性エリテマトーデス〈SLE〉', False, '<span class="kw4">エリテマトーデスでは'
                     '「表皮基底膜部に顆粒状のIgG・IgM・C3の沈着」</span>を認める'
                     '（<span class="kw4">ルーペバンドテスト〈lupus band test〉</span>）。'
                     '<span class="kw4">免疫複合体の沈着なので線状ではなく顆粒状</span>である点も対比になる。'
                     '<span class="kw4">SLEでは非露光部の正常皮膚でも陽性となりうる</span>のに対し、'
                     '円板状エリテマトーデスでは病変部のみ陽性となる。'),
   ('b', '後天性表皮水疱症', False, '<span class="kw4">Ⅶ型コラーゲン（係留線維）に対する自己抗体</span>により、'
                     '<span class="kw4">表皮基底膜部に線状のIgG沈着</span>を認める。'
                     '<span class="kw4">細胞間ではない</span>（<span class="kw">Q.115</span>）。'),
   ('c', '水疱性類天疱瘡', False, '<span class="kw4">BP180・BP230（ヘミデスモソーム）に対する自己抗体</span>により、'
                     '<span class="kw4">表皮基底膜部にIgGとC3が線状に沈着</span>する。'
                     '<span class="kw4">これも細胞間ではない</span>（<span class="kw">Q.100・Q.109</span>）。'),
   ('d', '落葉状天疱瘡', True, '<span class="kw3">天疱瘡群は、角化細胞どうしの接着装置デスモソームの'
                     'デスモグレインに対するIgG抗体をもつ</span>ため、'
                     '<span class="kw3">蛍光抗体直接法では表皮細胞間が網目状（レース状）にIgGで染まる</span>。'
                     '<span class="kw3">落葉状天疱瘡は抗デスモグレイン1抗体により'
                     '顆粒層〜角層下で棘融解を起こす</span>ので、'
                     '<span class="kw3">沈着は表皮上層の細胞間で目立つ</span>。'
                     '<span class="kw3">選択肢のなかで天疱瘡群はこれだけ</span>である。'),
   ('e', '疱疹状皮膚炎', False, '<span class="kw4">Duhring疱疹状皮膚炎は'
                     '「真皮乳頭部に顆粒状のIgA沈着」</span>。'
                     '<span class="kw4">クラスがIgAである点でも、部位が真皮側である点でも異なる</span>。'
                     'セリアック病を合併し、DDSが著効する。')],
  '表皮細胞間の網目状IgG沈着＝天疱瘡群。選択肢中の天疱瘡群は落葉状天疱瘡だけ。他はすべて基底膜部（線状IgG／顆粒状IgG）か真皮乳頭部（顆粒状IgA）。',
  patho=('🗺️ 蛍光抗体直接法の「地図」を一枚にする',
         '<span class="kw3">本問は Q.106（写真で問う）・Q.109（臨床像から問う）・'
         'Q.115（2つ選ばせる）と同じ知識を、'
         '「部位→疾患」の向きで問うている</span>。'
         '<span class="kw3">同じ表を4通りの角度から出題されているのだから、'
         'この地図を一度きちんと描いておけば本章の1/4が確実に取れる</span>。'
         '<table class="tb"><tr><th>沈着部位（上から下へ）</th><th>クラス・形</th><th>疾患</th></tr>'
         '<tr><td><span class="kw3">表皮細胞間</span></td>'
         '<td><span class="kw3">IgG・網目状</span></td>'
         '<td><span class="kw3">尋常性天疱瘡・落葉状天疱瘡</span>（IgAならIgA天疱瘡）</td></tr>'
         '<tr><td><span class="kw3">表皮基底膜部</span></td><td><span class="kw3">IgG＋C3・線状</span></td>'
         '<td><span class="kw3">水疱性類天疱瘡・後天性表皮水疱症・粘膜類天疱瘡・妊娠性類天疱瘡</span></td></tr>'
         '<tr><td>表皮基底膜部</td><td><span class="kw3">IgA・線状</span></td>'
         '<td><span class="kw3">線状IgA水疱性皮膚症</span></td></tr>'
         '<tr><td>表皮基底膜部</td><td><span class="kw3">IgG・IgM・C3・顆粒状</span></td>'
         '<td><span class="kw3">エリテマトーデス（ルーペバンドテスト）</span></td></tr>'
         '<tr><td><span class="kw3">真皮乳頭部</span></td><td><span class="kw3">IgA・顆粒状</span></td>'
         '<td><span class="kw3">疱疹状皮膚炎〈Duhring〉</span></td></tr>'
         '<tr><td>真皮上層の血管壁</td><td>IgA・顆粒状</td>'
         '<td><span class="kw3">IgA血管炎〈Henoch-Schönlein紫斑病〉</span></td></tr></table>'
         '<span class="kw3">覚え方は「上から順に、細胞間＝天疱瘡、'
         '基底膜部の線＝類天疱瘡、基底膜部の粒＝ループス、'
         '真皮乳頭の粒＝Duhring」</span>と唱えるとよい。'),
  deep=('📌 「線状」と「顆粒状」が意味するもの',
        '<span class="kw3">蛍光の形は病態の違いをそのまま映している</span>。'
        '<table class="tb"><tr><th>形</th><th>意味</th><th>代表</th></tr>'
        '<tr><td><span class="kw3">線状〈linear〉</span></td>'
        '<td><span class="kw3">自己抗体が、基底膜部に規則正しく並んだ構造蛋白に直接結合している</span></td>'
        '<td><span class="kw3">水疱性類天疱瘡（BP180）・後天性表皮水疱症（Ⅶ型コラーゲン）</span></td></tr>'
        '<tr><td><span class="kw3">網目状〈intercellular〉</span></td>'
        '<td><span class="kw3">細胞と細胞の接着面（デスモソーム）に抗体が結合し、'
        '細胞の輪郭が浮き上がる</span></td>'
        '<td><span class="kw3">天疱瘡（デスモグレイン）</span></td></tr>'
        '<tr><td><span class="kw3">顆粒状〈granular〉</span></td>'
        '<td><span class="kw3">抗原抗体複合体（免疫複合体）が塊として沈着している</span></td>'
        '<td><span class="kw3">エリテマトーデス・疱疹状皮膚炎・IgA血管炎</span></td></tr></table>'
        '<span class="kw3">「連続した1本の線に見えるか、点の集まりに見えるか」で'
        '機序（直接結合か免疫複合体か）まで言える</span>ようにしておくと、'
        '腎生検の蛍光所見（抗GBM腎炎の線状IgG／ループス腎炎・IgA腎症の顆粒状沈着）とも'
        '同じ論理でつながる。<br>'
        '<span class="kw4">臨床の落とし穴</span>としては、'
        '<span class="kw4">①直接法の検体は水疱そのものではなく水疱周囲の正常皮膚から採る、'
        '②ホルマリン固定すると抗原性が失われるので凍結または生食で提出する、'
        '③ステロイド治療開始後は沈着が減弱し偽陰性になりうる</span>——'
        '<span class="kw4">検査は治療開始前に行うのが原則</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">表皮細胞間の網目状IgG＝天疱瘡群（尋常性・落葉状）</span>。<br>'
         '② <span class="kw3">基底膜部の線状IgG＝水疱性類天疱瘡・後天性表皮水疱症</span>、'
         '<span class="kw3">線状IgA＝線状IgA水疱性皮膚症</span>。<br>'
         '③ <span class="kw3">基底膜部の顆粒状IgG/IgM/C3＝エリテマトーデス（ルーペバンドテスト）</span>。<br>'
         '④ <span class="kw3">真皮乳頭部の顆粒状IgA＝疱疹状皮膚炎</span>、'
         '<span class="kw3">血管壁の顆粒状IgA＝IgA血管炎</span>。<br>'
         '⑤ 検査は<span class="kw4">治療開始前に、水疱周囲の正常皮膚から、非固定で</span>提出する。')),

]

QUESTIONS += [

Q('107E-47', 96, [('bi', '📷')],
  '33歳の女性。右の側腹部の皮疹を主訴に来院した。'
  '1か月前から<span class="kw">疼痛を伴う潰瘍</span>を形成し、徐々に拡大していた。'
  '<span class="kw">同時期から時々下腹部痛と下痢とを認めている</span>。'
  '<span class="kw">潰瘍から細菌は検出されていない</span>。'
  '<span class="kw">皮疹の生検組織で真皮全層に密な好中球浸潤</span>を認める。'
  '初診時の右の側腹部の写真を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '褥　瘡', False, '<span class="kw4">持続的な圧迫による阻血で生じる皮膚潰瘍</span>で、'
                     '<span class="kw4">仙骨部・踵・大転子など骨突出部に、'
                     '臥床・車椅子など不動の状況で発生</span>する。'
                     '<span class="kw4">33歳の歩行可能な女性の側腹部に生じる病態ではない</span>。'),
   ('b', '尋常性狼瘡', False, '<span class="kw4">皮膚結核の一型</span>。'
                     '<span class="kw4">顔面に緩徐（年単位）に拡大する褐色の局面を作り、'
                     '硝子圧法でapple-jelly noduleを認める</span>。'
                     '<span class="kw4">病理は乾酪壊死を伴う類上皮細胞肉芽腫</span>であり、'
                     '好中球浸潤ではない。1か月で拡大する経過とも合わない。'),
   ('c', '基底細胞癌', False, '<span class="kw4">高齢者の顔面（とくに鼻・眼周囲）に好発する'
                     '黒色調の光沢を帯びた結節で、辺縁は堤防状に隆起し中央が潰瘍化（ロデントアルサー）</span>する。'
                     '<span class="kw4">数年かけて緩徐に増大し、疼痛は乏しい</span>。'
                     '33歳・側腹部・1か月の経過・好中球浸潤のいずれとも合わない。'),
   ('d', '壊疽性膿皮症', True, '<span class="kw3">疼痛を伴い急速に拡大する潰瘍、細菌培養陰性、'
                     '真皮全層の密な好中球浸潤</span>という3点で確定できる。'
                     '<span class="kw3">「同時期から下腹部痛と下痢」＝炎症性腸疾患'
                     '（Crohn病・潰瘍性大腸炎）の未診断例を示唆</span>しており、'
                     '<span class="kw3">皮膚科が先に腸疾患を見つける典型的なシナリオ</span>である。'),
   ('e', '血栓性静脈炎', False, '<span class="kw4">表在静脈に沿った索状の発赤・硬結・圧痛</span>が特徴で、'
                     '<span class="kw4">静脈の走行に一致する線状の病変</span>となる。'
                     '<span class="kw4">真皮全層の好中球浸潤を伴う大きな潰瘍は作らない</span>。')],
  '有痛性で急速に拡大する潰瘍＋培養陰性＋真皮全層の好中球浸潤＝壊疽性膿皮症。下腹部痛・下痢の併存から炎症性腸疾患の検索が必要。',
  imgs=['images/107E-47_1.jpeg'],
  patho=('🩺 皮膚から腸を見つける——壊疽性膿皮症と炎症性腸疾患',
         '<span class="kw3">本例の眼目は「下腹部痛と下痢」という一文</span>である。'
         '<span class="kw3">壊疽性膿皮症は炎症性腸疾患〈IBD〉の皮膚外病変として最も有名で、'
         '皮膚症状が腸症状に先行したり、腸疾患がまだ診断されていない段階で'
         '皮膚科を受診したりすることがある</span>。'
         '<span class="kw3">したがって壊疽性膿皮症と診断したら、'
         '消化器症状の問診と大腸内視鏡検査を含む全身検索が必須</span>になる。<br>'
         '<span class="kw3">IBDの皮膚・関節・眼病変（腸管外合併症）は国試頻出</span>である。'
         '<table class="tb"><tr><th>臓器</th><th>病変</th><th>特徴</th></tr>'
         '<tr><td rowspan="3">皮膚</td><td><span class="kw3">結節性紅斑</span></td>'
         '<td><span class="kw3">下腿伸側の有痛性紅色結節。腸炎の活動性と並行することが多い</span></td></tr>'
         '<tr><td><span class="kw3">壊疽性膿皮症</span></td>'
         '<td><span class="kw3">有痛性潰瘍。腸炎の活動性と必ずしも並行しない</span></td></tr>'
         '<tr><td>アフタ性口内炎・Sweet病</td><td>Crohn病で多い</td></tr>'
         '<tr><td>関節</td><td>末梢関節炎／仙腸関節炎・強直性脊椎炎</td>'
         '<td>末梢型は腸炎と並行、体軸型は独立して進行</td></tr>'
         '<tr><td>眼</td><td><span class="kw3">上強膜炎・ぶどう膜炎</span></td>'
         '<td>視力障害を来しうるので眼科紹介</td></tr>'
         '<tr><td>肝胆道</td><td><span class="kw3">原発性硬化性胆管炎〈PSC〉</span></td>'
         '<td><span class="kw3">潰瘍性大腸炎に合併。胆管癌・大腸癌のリスク</span></td></tr>'
         '<tr><td>血栓</td><td>深部静脈血栓症・肺塞栓</td><td>活動期は過凝固状態</td></tr></table>'
         '<span class="kw3">若年者の「原因不明の皮膚潰瘍＋腹痛・下痢」は'
         '壊疽性膿皮症＋IBDとして一体で考える</span>のが本問の教えである。'),
  deep=('📌 潰瘍を見たときの「深さ」と「時間軸」の読み',
        '<span class="kw3">皮膚欠損はまず深さで分ける</span>。'
        '<span class="kw3">びらん＝表皮まで（瘢痕を残さない）、潰瘍＝真皮以深（瘢痕を残す）</span>。'
        '<span class="kw3">次に時間軸</span>——'
        '<span class="kw3">「1か月で拡大」なら炎症性・感染性、'
        '「年単位で緩徐」なら腫瘍性（基底細胞癌・有棘細胞癌）や皮膚結核</span>を考える。'
        '<table class="tb"><tr><th>経過</th><th>候補</th><th>次の一手</th></tr>'
        '<tr><td><span class="kw3">数日〜数週で急速</span></td>'
        '<td><span class="kw3">壊疽性膿皮症・壊死性筋膜炎・血管炎・カルシフィラキシス</span></td>'
        '<td><span class="kw3">培養・生検・全身状態の評価（発熱・ショックの有無）</span></td></tr>'
        '<tr><td>数か月</td><td>静脈うっ滞性潰瘍・動脈性潰瘍・糖尿病性足潰瘍</td>'
        '<td>ABI・下肢静脈エコー・神経学的評価</td></tr>'
        '<tr><td><span class="kw3">年単位で緩徐</span></td>'
        '<td><span class="kw3">基底細胞癌・有棘細胞癌・皮膚結核（尋常性狼瘡）・Marjolin潰瘍</span></td>'
        '<td><span class="kw3">生検（腫瘍を疑うなら必須）</span></td></tr></table>'
        '<span class="kw3">壊疽性膿皮症では、生検そのものがpathergyの誘因になりうる</span>が、'
        '<span class="kw3">感染症・血管炎・悪性腫瘍を除外するために'
        '辺縁部から慎重に採取して病理と培養に出す</span>のが標準的である。'
        '<span class="kw4">「培養陰性であること」を確認して初めて壊疽性膿皮症と言える</span>ため、'
        '<span class="kw4">一般細菌・真菌・抗酸菌の3種を出す</span>'
        '（<span class="kw">Q.105</span>ではこの3つが明記されている）。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">有痛性潰瘍＋培養陰性＋真皮の好中球浸潤＝壊疽性膿皮症</span>。<br>'
         '② 壊疽性膿皮症を見たら<span class="kw3">炎症性腸疾患・血液疾患・関節リウマチを検索</span>する。'
         '<span class="kw3">腹痛・下痢があれば大腸内視鏡</span>。<br>'
         '③ IBDの腸管外合併症＝<span class="kw3">結節性紅斑・壊疽性膿皮症・関節炎・'
         'ぶどう膜炎・原発性硬化性胆管炎</span>。<br>'
         '④ <span class="kw4">結節性紅斑は腸炎の活動性と並行、壊疽性膿皮症は必ずしも並行しない</span>。<br>'
         '⑤ 潰瘍の鑑別は<span class="kw3">「深さ」と「拡大の速さ」</span>で切る。')),

Q('107G-48', 93, [('bi', '📷')],
  '55歳の女性。<span class="kw">口腔粘膜疹と全身の皮疹</span>とを主訴に来院した。'
  '<span class="kw">2か月前から口腔粘膜にびらんが出現</span>した。'
  '<span class="kw">1か月前から全身に径3cmまでの水疱が多発</span>してきた。'
  '<span class="kw">皮疹の生検組織の蛍光抗体直接法で表皮細胞間にIgGとC3の沈着</span>を認める。'
  '口腔内粘膜疹の写真（A）と皮疹の生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '接触皮膚炎', False, '<span class="kw4">原因物質が接触した部位に一致して、'
                     '境界明瞭な紅斑・丘疹・小水疱と瘙痒を生じる</span>。'
                     '<span class="kw4">自己抗体は関与せず、蛍光抗体直接法でIgG沈着を認めない</span>。'
                     '口腔粘膜のびらんが2か月先行する経過とも合わない。'),
   ('b', '尋常性天疱瘡', True, '<span class="kw3">口腔粘膜のびらんが先行し、遅れて皮膚に水疱が多発</span>という'
                     '経過に、'
                     '<span class="kw3">蛍光抗体直接法で表皮細胞間にIgGとC3の沈着</span>という'
                     '所見が加われば尋常性天疱瘡で確定する。'
                     '<span class="kw3">標的は抗デスモグレイン3抗体（±Dsg1）</span>で、'
                     '<span class="kw3">病理（B）では表皮基底層直上に棘融解性の裂隙を認め、'
                     '基底細胞だけが基底膜に残る墓石像</span>を呈する。'),
   ('c', '疱疹状皮膚炎', False, '<span class="kw4">肘膝伸側・殿部に瘙痒の強い小水疱が集簇し、'
                     '直接法では真皮乳頭部に顆粒状のIgAが沈着</span>する。'
                     '<span class="kw4">クラス（IgA）も部位（真皮乳頭部）も本例と異なる</span>。'
                     'セリアック病を合併しDDSが著効する。'),
   ('d', '水疱性類天疱瘡', False, '<span class="kw4">高齢者の体幹四肢に瘙痒を伴う緊満性水疱を生じ、'
                     '直接法は基底膜部の線状IgG・C3沈着</span>。'
                     '<span class="kw4">粘膜疹は乏しく、病理は表皮下水疱で棘融解を伴わない</span>。'
                     '本例は細胞間沈着であり否定される（<span class="kw">Q.100</span>）。'),
   ('e', '後天性表皮水疱症', False, '<span class="kw4">抗Ⅶ型コラーゲン抗体による表皮下水疱症で、'
                     '直接法は基底膜部の線状IgG沈着</span>。'
                     '<span class="kw4">外力のかかる手足・肘膝に水疱・びらんを生じ、'
                     '瘢痕と稗粒腫を残す</span>。細胞間沈着ではない。')],
  '口腔粘膜びらんが2か月先行し全身に水疱が多発。表皮細胞間へのIgG・C3沈着＝尋常性天疱瘡（抗Dsg3抗体）。',
  imgs=['images/107G-48_1.jpeg', 'images/107G-48_2.jpeg'],
  patho=('🗣️ 口腔粘膜びらんを主訴に来る疾患',
         '<span class="kw3">尋常性天疱瘡の患者は、皮膚科ではなく歯科・耳鼻科・内科を'
         '最初に受診することが多い</span>。'
         '<span class="kw3">口腔粘膜のびらんが数週〜数か月先行し、'
         '「治らない口内炎」として扱われるからである</span>。'
         '<span class="kw3">本例も「うがい薬で様子を見られたが拡大」という'
         'Q.103と同じ経過をたどっている</span>。'
         '<span class="kw3">摂食時痛による経口摂取不良と体重減少を伴うことがあり、'
         '全身管理の観点でも重要</span>である。'
         '<table class="tb"><tr><th>疾患</th><th>口腔病変の特徴</th><th>皮膚・他臓器</th></tr>'
         '<tr><td><span class="kw3">尋常性天疱瘡</span></td>'
         '<td><span class="kw3">歯肉・口蓋・頰粘膜の広範なびらん。水疱はすぐ破れて見えない</span></td>'
         '<td><span class="kw3">弛緩性水疱・Nikolsky陽性</span></td></tr>'
         '<tr><td>粘膜類天疱瘡</td>'
         '<td>びらんが瘢痕化し癒着を起こす</td>'
         '<td><span class="kw4">眼粘膜の瘢痕化（瞼球癒着）→失明のリスク</span></td></tr>'
         '<tr><td>扁平苔癬（口腔）</td><td><span class="kw3">頰粘膜のレース状白斑（Wickham線条）</span></td>'
         '<td>手関節屈側の紫紅色多角形丘疹。歯科金属・C型肝炎</td></tr>'
         '<tr><td><span class="kw3">Stevens-Johnson症候群／TEN</span></td>'
         '<td><span class="kw4">急性発症、口唇の血痂、眼・外陰にも及ぶ</span></td>'
         '<td><span class="kw4">発熱・薬剤歴・表皮壊死。緊急疾患</span></td></tr>'
         '<tr><td>Behçet病</td><td>再発性アフタ性潰瘍（有痛性・円形）</td>'
         '<td>陰部潰瘍・ぶどう膜炎・結節性紅斑様皮疹</td></tr>'
         '<tr><td>手足口病・ヘルパンギーナ</td><td>小児、口腔内小水疱・アフタ</td>'
         '<td>手掌・足底の水疱、夏季流行</td></tr>'
         '<tr><td><span class="kw3">腫瘍随伴性天疱瘡</span></td>'
         '<td><span class="kw4">難治性で激烈な口内炎</span></td>'
         '<td><span class="kw4">Castleman病・リンパ腫＋閉塞性細気管支炎</span></td></tr></table>'
         '<span class="kw3">「2か月続く口内炎」と書かれたら、'
         'まず尋常性天疱瘡と扁平苔癬、そして腫瘍随伴性天疱瘡を思い浮かべる</span>。'),
  deep=('📌 尋常性天疱瘡の治療と全身管理',
        '<span class="kw3">尋常性天疱瘡はステロイド登場以前は致死的な疾患だった</span>。'
        '<span class="kw3">広範なびらんによる体液・蛋白喪失と敗血症が死因</span>となる。'
        '<span class="kw3">治療の中心はいまも副腎皮質ステロイドの全身投与</span>である。'
        '<table class="tb"><tr><th>段階</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">初期治療</span></td>'
        '<td><span class="kw3">プレドニゾロン0.5〜1.0mg/kg/日。重症例はステロイドパルス</span></td></tr>'
        '<tr><td>ステロイド減量のため</td>'
        '<td>免疫抑制薬（アザチオプリン、ミコフェノール酸モフェチル、シクロホスファミド）</td></tr>'
        '<tr><td><span class="kw3">難治・重症</span></td>'
        '<td><span class="kw3">大量免疫グロブリン療法〈IVIg〉・血漿交換・リツキシマブ（抗CD20抗体）</span></td></tr>'
        '<tr><td>局所・支持療法</td>'
        '<td><span class="kw3">びらん面の被覆と感染予防、疼痛管理、栄養管理（経口摂取困難なら経管・輸液）、'
        '口腔ケア</span></td></tr></table>'
        '<span class="kw3">経過観察は抗Dsg1／Dsg3抗体価（ELISA）で行う</span>——'
        '<span class="kw3">Dsg3が粘膜病変、Dsg1が皮膚病変の活動性を反映</span>する。<br>'
        '<span class="kw4">長期ステロイド療法の副作用対策も必ず組む</span>：'
        '<span class="kw4">日和見感染（ニューモシスチス肺炎の予防内服）、'
        'ステロイド糖尿病、骨粗鬆症（ビスホスホネート）、消化性潰瘍（PPI）、'
        '白内障・緑内障、精神症状</span>。'
        '<span class="kw3">Nikolsky現象が陽性なので、'
        '寝具・処置での摩擦を避けることも実際的なケアになる</span>。'),
  point=('🎯 国試ポイント',
         '① 尋常性天疱瘡＝<span class="kw3">口腔粘膜びらんが先行 → 皮膚に弛緩性水疱</span>。<br>'
         '② 直接法＝<span class="kw3">表皮細胞間のIgG・C3（網目状）</span>、'
         '病理＝<span class="kw3">基底層直上の棘融解・墓石像</span>。<br>'
         '③ 抗体＝<span class="kw3">抗Dsg3（粘膜）／抗Dsg1（皮膚）</span>。抗体価で活動性を追う。<br>'
         '④ 治療＝<span class="kw3">ステロイド全身投与</span>±免疫抑制薬、'
         '難治例に<span class="kw3">IVIg・血漿交換・リツキシマブ</span>。<br>'
         '⑤ <span class="kw4">難治性口内炎では腫瘍随伴性天疱瘡（Castleman病・リンパ腫）も忘れない</span>。')),

Q('106A-49', 96, [('bi', '📷')],
  '45歳の女性。左下腿の皮疹を主訴に来院した。'
  '1か月前に左下腿に紅斑が生じ、<span class="kw">急速に拡大</span>してきたという。'
  '<span class="kw">30歳時に潰瘍性大腸炎と診断され</span>、'
  '自宅近くの診療所でメサラジンの内服治療を受けている。'
  '意識は清明。身長158cm、体重52kg。<span class="kw4">体温36.2℃</span>。脈拍76/分、整。'
  '血圧134/80mmHg。呼吸数16/分。'
  '<span class="kw">左下腿に巨大な潰瘍</span>を認める。'
  '<span class="kw">潰瘍面の細菌培養は陰性</span>である。左下腿の写真を示す。<br>'
  '<strong>診断として最も考えられるのはどれか。</strong>',
  [('a', '蜂巣炎', False, '<span class="kw4">真皮深層〜皮下脂肪織の細菌感染（主にA群β溶血性レンサ球菌・黄色ブドウ球菌）</span>で、'
                     '<span class="kw4">境界不明瞭な発赤・腫脹・熱感・疼痛と発熱を伴う</span>。'
                     '<span class="kw4">本例は体温36.2℃と平熱で、培養も陰性</span>であり合致しない。'
                     '通常は潰瘍化せず、抗菌薬に反応する。'),
   ('b', '環状肉芽腫', False, '<span class="kw4">手背・足背などに、中央が陥凹した環状に配列する常色〜紅色の小丘疹</span>を作る。'
                     '<span class="kw4">無症候性で自然消退することが多く、潰瘍化しない</span>。'
                     '糖尿病との関連が語られることがある。'),
   ('c', '基底細胞癌', False, '<span class="kw4">高齢者の顔面（鼻・眼囲）に好発する黒色調の結節で、'
                     '数年かけて緩徐に増大し中央が潰瘍化する（ロデントアルサー）</span>。'
                     '<span class="kw4">1か月で巨大潰瘍に至る経過ではなく、部位も合わない</span>。'),
   ('d', '壊死性筋膜炎', False, '<span class="kw4">筋膜に沿って急速に進行する壊死性軟部組織感染症</span>。'
                     '<span class="kw4">高熱・頻脈・低血圧などの全身症状（敗血症性ショック）と'
                     '見た目に不釣り合いな激痛</span>を伴い、'
                     '<span class="kw4">緊急デブリドマンを要する</span>。'
                     '<span class="kw4">本例はバイタルサインがすべて正常で、'
                     '培養も陰性であることから明確に否定できる</span>。'),
   ('e', '壊疽性膿皮症', True, '<span class="kw3">潰瘍性大腸炎の既往＋1か月で急速拡大した巨大潰瘍＋細菌培養陰性</span>という'
                     '3点で確定する。'
                     '<span class="kw3">写真でも辺縁が紫紅色調に隆起した、境界の明瞭な潰瘍</span>が'
                     '見て取れる。'
                     '<span class="kw3">治療は副腎皮質ステロイド全身投与</span>で、'
                     '<span class="kw4">感染と誤ってデブリドマンを行うと'
                     'pathergy現象で潰瘍が拡大する</span>。')],
  '潰瘍性大腸炎の既往、1か月で急速拡大した巨大潰瘍、培養陰性、バイタル正常＝壊疽性膿皮症。',
  imgs=['images/106A-49_1.jpeg'],
  patho=('🚨 「バイタルサインが正常」という情報の使い方',
         '<span class="kw3">本問はバイタルサインを丁寧に並べている</span>——'
         '<span class="kw3">体温36.2℃、脈拍76/分、血圧134/80mmHg、呼吸数16/分、意識清明</span>。'
         '<span class="kw3">これは「重症軟部組織感染症ではない」ことを示すために置かれた情報</span>である。'
         '<span class="kw3">下腿に巨大な潰瘍があるのに全身状態がまったく保たれている、'
         'という不一致こそが非感染性（好中球性皮膚症）を示唆する</span>。'
         '<table class="tb"><tr><th></th><th>壊疽性膿皮症</th><th>壊死性筋膜炎</th><th>蜂巣炎</th></tr>'
         '<tr><td>発熱</td><td><span class="kw3">なし〜微熱</span></td>'
         '<td><span class="kw4">高熱・ショック</span></td><td>あり</td></tr>'
         '<tr><td>培養</td><td><span class="kw3">陰性</span></td><td>陽性（複数菌のことも）</td>'
         '<td>陽性</td></tr>'
         '<tr><td>進行</td><td>日〜週で拡大</td><td><span class="kw4">時間単位</span></td>'
         '<td>日単位</td></tr>'
         '<tr><td>皮膚所見</td><td><span class="kw3">紫紅色の隆起した辺縁をもつ潰瘍</span></td>'
         '<td><span class="kw4">暗紫色斑・血疱・捻髪音・皮膚の知覚低下</span></td>'
         '<td>境界不明瞭な発赤・腫脹</td></tr>'
         '<tr><td>治療</td><td><span class="kw3">ステロイド全身投与</span></td>'
         '<td><span class="kw4">緊急デブリドマン＋広域抗菌薬</span></td>'
         '<td>抗菌薬</td></tr>'
         '<tr><td><span class="kw3">デブリドマン</span></td>'
         '<td><span class="kw4">禁忌に近い（pathergyで悪化）</span></td>'
         '<td><span class="kw3">最優先で行う</span></td><td>通常不要</td></tr></table>'
         '<span class="kw4">この2疾患は治療方針が正反対</span>である。'
         '<span class="kw4">「切るべき病気」と「切ってはいけない病気」を'
         '発熱・バイタル・培養で見分けるのが、本問の実臨床的な意義</span>である。'),
  deep=('📌 潰瘍性大腸炎の患者を全身で診る',
        '<span class="kw3">本例は30歳で潰瘍性大腸炎と診断され、'
        'メサラジン（5-アミノサリチル酸製剤）で維持されている</span>。'
        '<span class="kw3">15年の経過で皮膚に壊疽性膿皮症が出た</span>ということになる。'
        '<span class="kw3">壊疽性膿皮症は腸炎の活動性と必ずしも並行しない</span>ため、'
        '<span class="kw3">「腸の調子は良いから関係ない」とは言えない</span>のが要点である。'
        '<table class="tb"><tr><th>確認すべきこと</th><th>理由</th></tr>'
        '<tr><td><span class="kw3">腸病変の活動性（内視鏡・便回数・血便）</span></td>'
        '<td>治療強化の必要性を判断する</td></tr>'
        '<tr><td><span class="kw3">他の腸管外合併症</span></td>'
        '<td>結節性紅斑・関節炎・ぶどう膜炎・原発性硬化性胆管炎</td></tr>'
        '<tr><td>薬剤</td>'
        '<td><span class="kw3">抗TNF-α抗体は腸病変と壊疽性膿皮症の両方に有効</span>——'
        '同時に治療できる</td></tr>'
        '<tr><td>長期経過</td>'
        '<td><span class="kw4">8〜10年以上の全大腸炎型では大腸癌サーベイランス</span>が必要</td></tr></table>'
        '<span class="kw3">壊疽性膿皮症の治療は、局所（ステロイド外用・タクロリムス外用）から'
        '全身（プレドニゾロン0.5〜1mg/kg/日）へ、'
        'さらにシクロスポリン・抗TNF-α抗体へと段階的に進める</span>。'
        '<span class="kw3">創部は湿潤環境を保ち、'
        '疼痛管理を十分に行い、外科的操作は最小限にとどめる</span>。'
        '<span class="kw4">植皮が必要なほど大きな潰瘍でも、'
        '炎症を抑えてからでなければ移植片の周囲に新たな病変を作る</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">IBDの既往＋急速拡大する下腿潰瘍＋培養陰性＝壊疽性膿皮症</span>。<br>'
         '② <span class="kw3">バイタル正常・平熱は「感染症ではない」ことの根拠</span>になる。<br>'
         '③ <span class="kw4">壊死性筋膜炎は高熱・ショック・激痛で、治療は緊急デブリドマン</span>——'
         '<span class="kw4">壊疽性膿皮症とは正反対</span>。<br>'
         '④ 治療＝<span class="kw3">ステロイド全身投与、シクロスポリン、抗TNF-α抗体'
         '（腸病変にも有効）</span>。<br>'
         '⑤ <span class="kw3">壊疽性膿皮症は腸炎の活動性と並行しないことがある</span>。')),

Q('106D-51', 88, [('bi', '📷')],
  '60歳の女性。全身の皮疹を主訴に来院した。'
  '3か月前から、特に誘因なく<span class="kw">全身に痒みを伴う紅斑と水疱とが多発</span>するようになったという。'
  '体幹と四肢とに紅斑と水疱とを認める。<span class="kw">粘膜疹を認めない</span>。'
  '<span class="kw">皮膚生検の病理組織では表皮下水疱</span>を認め、'
  '<span class="kw">蛍光抗体直接法で表皮基底膜部にIgGとC3との線状沈着</span>を認める。'
  '<span class="kw">食塩水処理皮膚を用いた蛍光抗体間接法で表皮側にIgGの陽性反応</span>を認める。'
  '両前腕屈側の写真を示す。<br>'
  '<strong>診断として最も考えられるのはどれか。</strong>',
  [('a', '疱疹状皮膚炎', False, '<span class="kw4">肘膝伸側・殿部・肩甲部に瘙痒の強い小水疱が集簇</span>し、'
                     '<span class="kw4">直接法では真皮乳頭部に顆粒状のIgA沈着</span>を認める。'
                     '<span class="kw4">クラスも部位も形も本例と異なる</span>。'
                     'グルテン過敏性腸症を合併し、DDSが著効する。'),
   ('b', '尋常性天疱瘡', False, '<span class="kw4">口腔粘膜のびらんで初発し、表皮内（基底層直上）の棘融解による'
                     '弛緩性水疱を生じる</span>。'
                     '<span class="kw4">直接法は表皮細胞間の網目状IgG沈着</span>で、'
                     '<span class="kw4">本例の「粘膜疹なし・表皮下水疱・基底膜部の線状沈着」と'
                     'ことごとく食い違う</span>。'),
   ('c', '水疱性類天疱瘡', True, '<span class="kw3">高齢者・瘙痒を伴う紅斑と水疱・粘膜疹なし・表皮下水疱・'
                     '基底膜部の線状IgG＋C3沈着</span>まででほぼ確定し、'
                     '<span class="kw3">salt-split skinで抗体が「表皮側」に付いた</span>ことで'
                     '<span class="kw3">後天性表皮水疱症を除外して確定する</span>。'
                     '<span class="kw3">標的抗原BP180（XVII型コラーゲン）・BP230は'
                     'ヘミデスモソームにあり、人工裂隙より表皮側に位置する</span>ためである。'),
   ('d', '後天性表皮水疱症', False, '<span class="kw4">抗Ⅶ型コラーゲン抗体による表皮下水疱症で、'
                     '直接法は同じく基底膜部の線状IgG沈着</span>を示すためここまでは区別できない。'
                     '<span class="kw4">しかしⅦ型コラーゲンは係留線維＝裂隙より下にあるため、'
                     'salt-split skinでは「真皮側」に付く</span>。'
                     '<span class="kw4">本例は表皮側なので否定される</span>。'),
   ('e', '家族性良性慢性天疱瘡', False, '<span class="kw4">Hailey-Hailey病。ATP2C1遺伝子（ゴルジ体Ca²⁺ポンプSPCA1）変異による'
                     '常染色体顕性遺伝疾患</span>。'
                     '<span class="kw4">腋窩・鼠径・頸部などの間擦部にびらん・亀裂を反復し、'
                     '病理は「崩れかけたレンガ塀」様の広範な棘融解</span>。'
                     '<span class="kw4">遺伝性で自己抗体は関与しないため、蛍光抗体法は陰性</span>である。')],
  '高齢女性・瘙痒を伴う紅斑と水疱・粘膜疹なし・表皮下水疱・基底膜部の線状IgG／C3、salt-splitで表皮側＝水疱性類天疱瘡。',
  imgs=['images/106D-51_1.jpeg'],
  patho=('🧾 水疱性類天疱瘡の診断アルゴリズムを完成させる',
         '<span class="kw3">本問は水疱性類天疱瘡の診断過程を、'
         '所見の順序どおりに全部並べた「模範解答のような問題」</span>である。'
         '<span class="kw3">Q.100（119D-63）とほぼ同一の構成で、'
         '13年の間隔をおいて同じ論理が問われている</span>。'
         '<table class="tb"><tr><th>段階</th><th>本例の所見</th><th>絞られるもの</th></tr>'
         '<tr><td>①臨床</td>'
         '<td><span class="kw3">60歳・全身の瘙痒を伴う紅斑と水疱・粘膜疹なし</span></td>'
         '<td><span class="kw3">天疱瘡群（粘膜）を後退させ、類天疱瘡群が浮上</span></td></tr>'
         '<tr><td>②病理</td><td><span class="kw3">表皮下水疱</span></td>'
         '<td><span class="kw3">表皮内水疱症（天疱瘡・Hailey-Hailey）を除外</span></td></tr>'
         '<tr><td>③直接法</td>'
         '<td><span class="kw3">基底膜部にIgG・C3が線状</span></td>'
         '<td><span class="kw3">類天疱瘡群＋後天性表皮水疱症に絞られる。'
         '疱疹状皮膚炎（IgA顆粒状）・遺伝性疾患（陰性）を除外</span></td></tr>'
         '<tr><td>④salt-split</td><td><span class="kw3">表皮側にIgG</span></td>'
         '<td><span class="kw3">水疱性類天疱瘡と確定（真皮側なら後天性表皮水疱症）</span></td></tr>'
         '<tr><td>⑤血清</td><td>（本例では記載なし）</td>'
         '<td><span class="kw3">抗BP180抗体で確認・活動性の指標</span>（<span class="kw">Q.112</span>）</td></tr></table>'
         '<span class="kw3">この5段の階段を、どの段の情報が与えられても'
         '同じ結論に到達できるようにしておくことが本章の到達目標</span>である。'
         '<span class="kw3">Q.109は①だけ、Q.112は③⑤、Q.100とQ.121は①〜④すべて、'
         'という具合に切り出し方を変えて出題されている</span>。'),
  deep=('📌 水疱症の「まとめ表」——本章の総復習',
        '<table class="tb"><tr><th>疾患</th><th>裂隙</th><th>直接法</th><th>臨床の鍵</th></tr>'
        '<tr><td><span class="kw3">尋常性天疱瘡</span></td>'
        '<td><span class="kw3">基底層直上（表皮内）</span></td>'
        '<td><span class="kw3">細胞間・IgG網目状</span></td>'
        '<td><span class="kw3">口腔粘膜びらんが先行、弛緩性水疱、Nikolsky陽性</span></td></tr>'
        '<tr><td><span class="kw3">落葉状天疱瘡</span></td>'
        '<td><span class="kw3">顆粒層〜角層下</span></td><td>細胞間・IgG網目状</td>'
        '<td><span class="kw3">脂漏部位の落屑・痂皮、粘膜を侵さない</span></td></tr>'
        '<tr><td><span class="kw3">水疱性類天疱瘡</span></td>'
        '<td><span class="kw3">表皮下</span></td>'
        '<td><span class="kw3">基底膜部・IgG＋C3線状</span></td>'
        '<td><span class="kw3">高齢者、緊満性水疱、瘙痒、好酸球増多、salt-split表皮側</span></td></tr>'
        '<tr><td><span class="kw3">後天性表皮水疱症</span></td><td>表皮下</td>'
        '<td>基底膜部・IgG線状</td>'
        '<td><span class="kw3">外力部位、瘢痕・稗粒腫、salt-split真皮側、Crohn病</span></td></tr>'
        '<tr><td>粘膜類天疱瘡</td><td>表皮下</td><td>基底膜部・IgG線状</td>'
        '<td><span class="kw4">眼粘膜の瘢痕化（瞼球癒着）→失明</span></td></tr>'
        '<tr><td><span class="kw3">疱疹状皮膚炎</span></td><td>表皮下</td>'
        '<td><span class="kw3">真皮乳頭部・IgA顆粒状</span></td>'
        '<td><span class="kw3">肘膝伸側の集簇性小水疱、セリアック病、DDS著効</span></td></tr>'
        '<tr><td>線状IgA水疱性皮膚症</td><td>表皮下</td>'
        '<td><span class="kw3">基底膜部・IgA線状</span></td>'
        '<td>小児では環状に配列（string of pearls）、バンコマイシン誘発性</td></tr>'
        '<tr><td><span class="kw3">Hailey-Hailey病</span></td>'
        '<td>表皮内（広範な棘融解）</td><td><span class="kw4">陰性</span></td>'
        '<td><span class="kw3">ATP2C1変異・常染色体顕性、間擦部のびらん</span></td></tr>'
        '<tr><td>表皮水疱症（先天性）</td><td>型により表皮内〜表皮下</td>'
        '<td><span class="kw4">陰性</span></td>'
        '<td><span class="kw3">出生時から摩擦部位に水疱、ケラチン5/14・ラミニン332・Ⅶ型コラーゲンの遺伝子変異</span></td></tr></table>'
        '<span class="kw3">この1枚で本章の水疱症9問（Q.100・103・104・106・109・112・115・117・121）が'
        'すべてカバーできる</span>。'),
  point=('🎯 国試ポイント',
         '① 水疱性類天疱瘡＝<span class="kw3">高齢者・瘙痒・緊満性水疱・粘膜疹に乏しい・表皮下水疱</span>。<br>'
         '② 直接法＝<span class="kw3">基底膜部にIgGとC3が線状</span>、'
         '<span class="kw3">salt-split skinで表皮側</span>（真皮側なら後天性表皮水疱症）。<br>'
         '③ 血清＝<span class="kw3">抗BP180抗体</span>で診断と活動性評価。<br>'
         '④ <span class="kw3">Hailey-Hailey病（家族性良性慢性天疱瘡）は遺伝性＝蛍光抗体法陰性</span>。<br>'
         '⑤ 治療＝<span class="kw3">ステロイド（外用・全身）、軽症はテトラサイクリン＋ニコチン酸アミドやDDS</span>。'
         '<span class="kw4">DPP-4阻害薬の関与を確認</span>。')),

]
# @@END@@


# ============================================================
# レンダリング
# ============================================================

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 4),
    ('s3', 'A問題', '', 11),
    ('s4', 'B問題', '', 12),
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
                        'MEC皮膚科 第5章 水疱・膿疱 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#B45309')
                .replace('--orl:#FCE4EC', '--orl:#FEF3C7')
                .replace('--ord:#880E4F', '--ord:#78350F'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 皮膚科</div>'
        '<h1>第<span>5</span>章｜水疱・膿疱</h1>'
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
