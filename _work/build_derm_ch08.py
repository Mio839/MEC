# -*- coding: utf-8 -*-
"""
皮膚科 第8章「感染症」(NO.191-222) の章別HTML(皮膚科/ch08_kansenshou.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、産婦人科(obg)水準で作成。build_derm_ch07.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・皮膚科 皮Q-122〜140／PDF p.125-143)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.155-159) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全32問。画像は21問32枚。図ラベル(A/B/C)は**ラベル文字の x 座標**で帰属を決めた。
⚠️ p.135(NO.206) はラベルがテキスト順で A→C→B に出るが、実配置は A=右上・B=左下・C=右下。
⚠️ p.125 の「A 問題（★問題）」の A が y=84 でラベル抽出に掛かるので、
   画像矩形の直下(±30px)にあるものだけをラベルとして採用した。

NO.200(111E-47) は**標本写真そのものが選択肢**の問題（①〜⑤の番号は画像に焼き込まれていて
テキストとして取れない）。コンタクトシートを作って目視確認した結果、
①カンジダ（仮性菌糸＋分芽胞子）／②白癬（分節・分枝する菌糸＝正解）／③ニキビダニ〈毛包虫〉／
④硬壁小体〈muriform cell〉＝クロモミコーシス／⑤ヒゼンダニ虫体（疥癬）の順である。

複数選択は NO.202・220 の2問（いずれも2つ選べ）。
否定形は NO.195（伴わない）・201（誤っている）の2問。
**解答一覧表に正答率が無いのは NO.203・204・205・221・222 の5問**
（rate=None → .cr を出さない。採点除外ではないので bx は付けない）。
★問題は NO.191-205 の15問。CBTバッジ(bc)は NO.191・200・213 の3問。
必修(bh)は NO.193・198・207・208 の4問。

本章の低正答率問題: NO.202(36%)・NO.212(41%)・NO.200(46%)・NO.220(48%)・NO.195(59%)・NO.218(61%)。
丹毒は NO.191・193・207・213・217・218、疥癬は NO.192・206・210・216・222、
白癬は NO.199・200・201・214・215、伝染性膿痂疹は NO.194・209・221、
非結核性抗酸菌症は NO.196・211 で繰り返し問われる。
「顔面の境界明瞭な浮腫性紅斑＋悪寒戦慄＝丹毒（A群β溶連菌）→ペニシリン」
「鱗屑を見たらまずKOH直接鏡検」「施設内の集団瘙痒＝疥癬（届出不要・接触者健診）」が本章の軸。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '皮膚科' / 'ch08_kansenshou.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 191

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs or [], ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.191-194
# ============================================================
QUESTIONS += [

Q('120D-24', 87, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '50歳の女性。顔面の皮疹を主訴に来院した。'
  '<span class="kw">3日前から38℃台の発熱、悪寒</span>を認め、'
  '<span class="kw">顔面に熱感を伴う皮疹</span>が出現し、'
  '<span class="kw">急速に両側に拡大</span>した。'
  '<span class="kw">右耳後部リンパ節の腫大</span>を認めた。'
  '血液所見：赤血球458万、Hb 12.5g/dL、<span class="kw">白血球12,100</span>、血小板34万。'
  '<span class="kw">CRP 7.8mg/dL</span>。右顔面の皮疹の写真を示す。<br>'
  '<strong>最も考えられる診断はどれか。</strong>',
  [('a', 'せ　つ', False, '<span class="kw4">せつ〈癤〉は毛包を中心とした黄色ブドウ球菌の深在性感染</span>で、'
                     '<span class="kw4">中心に膿栓をもつ限局性の有痛性結節</span>として現れる。'
                     '<span class="kw4">「顔面の広い面が一様に赤く腫れて両側へ拡大する」という広がり方はしない</span>。'
                     '複数のせつが融合したものを癰〈よう〉と呼ぶ。'),
   ('b', '丹　毒', True, '<span class="kw3">①悪寒を伴う38℃台の発熱が皮疹に先行、'
                     '②顔面に熱感を伴う境界明瞭な浮腫性紅斑、'
                     '③急速に両側へ拡大、④所属（右耳後部）リンパ節腫大、'
                     '⑤白血球12,100・CRP 7.8mg/dLの強い炎症反応</span>——'
                     '<span class="kw3">この組合せは丹毒〈erysipelas〉に典型的</span>である。'
                     '<span class="kw3">丹毒は真皮浅層〜浅在リンパ管の急性A群β溶連菌感染</span>で、'
                     '<span class="kw3">好発部位は顔面と下腿</span>、'
                     '<span class="kw3">全身症状（悪寒戦慄・発熱）が皮疹に先行あるいは同時に出る</span>のが特徴である。'),
   ('c', 'ひょう疽', False, '<span class="kw4">ひょう疽〈瘭疽〉は指趾末節、とくに爪周囲の化膿性炎</span>で、'
                     '<span class="kw4">拍動性の激痛を伴う指先の腫脹</span>が本態である。'
                     '<span class="kw4">部位が顔面ではないので直ちに除外できる</span>。'),
   ('d', 'ブドウ球菌性熱傷様皮膚症候群', False,
                     '<span class="kw4">ブドウ球菌性熱傷様皮膚症候群〈SSSS〉は、'
                     '黄色ブドウ球菌の表皮剝脱毒素〈exfoliative toxin〉が血行性に全身へ回って生じる</span>。'
                     '<span class="kw4">乳幼児に好発し、口囲の放射状亀裂・全身のびまん性紅斑・'
                     'Nikolsky現象陽性のびらん</span>を来す。'
                     '<span class="kw4">50歳の成人で顔面に限局する例は該当しない</span>。'),
   ('e', '蜂窩織炎', False, '<span class="kw4">蜂窩織炎〈蜂巣炎〉は真皮深層〜皮下脂肪織の細菌感染</span>で、'
                     '<span class="kw4">境界不明瞭でびまん性の発赤・腫脹・圧痛</span>を呈する。'
                     '<span class="kw4">本問の最大の鑑別点は「境界」と「深さ」</span>で、'
                     '<span class="kw4">丹毒＝境界明瞭・鮮紅色・隆起する／蜂窩織炎＝境界不明瞭・暗赤色・平坦</span>。'
                     '<span class="kw4">また蜂窩織炎は下腿に多く、顔面で両側へ急速拡大する経過は丹毒らしい</span>。')],
  '悪寒を伴う発熱が先行し、顔面に熱感のある境界明瞭な紅斑が急速に拡大＋所属リンパ節腫大＝丹毒。境界不明瞭なら蜂窩織炎。',
  imgs=['images/120D-24_1.jpeg'],
  patho=('🦠 丹毒——真皮浅層のリンパ管を走る溶連菌感染',
         '<span class="kw3">丹毒〈erysipelas〉は、A群β溶血性連鎖球菌〈Streptococcus pyogenes〉が'
         '真皮浅層とその浅在リンパ管に侵入して起こす急性の細菌感染症</span>である。'
         '<span class="kw3">病変が「浅い層に限局し、リンパ管に沿って面状に広がる」</span>ため、'
         '<span class="kw3">周囲の正常皮膚との境界が土手状に明瞭で、鮮紅色に隆起する</span>という'
         '肉眼所見が生まれる。<br>'
         '<span class="kw3">臨床の型は決まっている</span>——'
         '<span class="kw3">①悪寒戦慄を伴う突然の高熱が皮疹に先行または同時に出現、'
         '②顔面（とくに鼻を中心とした蝶形）あるいは下腿に熱感・圧痛を伴う境界明瞭な浮腫性紅斑、'
         '③数時間〜数日で急速に拡大、④所属リンパ節の腫脹・圧痛、'
         '⑤白血球増多・CRP上昇・ASO上昇</span>。'
         '<span class="kw4">侵入門戸は鼻前庭や外耳道の小さな傷、足白癬の趾間びらんなど微細なもの</span>で、'
         '<span class="kw4">明らかな外傷歴がなくても否定しない</span>。<br>'
         '<span class="kw3">治療はペニシリン系抗菌薬（ベンジルペニシリン、アモキシシリン）が第一選択</span>である。'
         '<span class="kw3">溶連菌は現在もペニシリン耐性がほぼ知られていない</span>ため、'
         '広域抗菌薬を使う必要はない。'
         '<span class="kw4">重症例・全身症状が強い例は入院のうえ点滴静注とし、'
         '再発を繰り返す例では侵入門戸（足白癬・鼻前庭炎）の治療が再発予防になる</span>。'
         '<span class="kw4">合併症として急性糸球体腎炎、リンパ浮腫（象皮病）</span>がある。'),
  deep=('📌 「赤く腫れた」皮膚軟部組織感染症の深さ別鑑別',
        '<table class="tb"><tr><th>疾患</th><th>深さ</th><th>境界</th><th>起炎菌</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">丹　毒</span></td>'
        '<td><span class="kw3">真皮浅層＋浅在リンパ管</span></td>'
        '<td><span class="kw3">明瞭・隆起（土手状）</span></td>'
        '<td><span class="kw3">A群β溶連菌</span></td>'
        '<td><span class="kw3">顔面・下腿／悪寒戦慄が先行</span></td></tr>'
        '<tr><td><span class="kw4">蜂窩織炎</span></td>'
        '<td><span class="kw4">真皮深層〜皮下脂肪織</span></td>'
        '<td><span class="kw4">不明瞭・平坦</span></td>'
        '<td><span class="kw4">黄色ブドウ球菌・溶連菌</span></td>'
        '<td><span class="kw4">下腿に多い／糖尿病・浮腫が素因</span></td></tr>'
        '<tr><td><span class="kw4">壊死性筋膜炎</span></td><td><span class="kw4">筋膜</span></td>'
        '<td>不明瞭</td><td><span class="kw4">A群β溶連菌・嫌気性菌</span></td>'
        '<td><span class="kw4">見た目に不釣り合いな激痛・血疱・握雪感・急速なショック＝緊急デブリドマン</span></td></tr>'
        '<tr><td>せ　つ</td><td>毛包（深在性）</td><td>限局した結節</td><td>黄色ブドウ球菌</td>'
        '<td>中心に膿栓／複数融合＝癰</td></tr>'
        '<tr><td>接触皮膚炎</td><td>表皮・真皮浅層</td><td>接触部位に一致</td><td>—（非感染）</td>'
        '<td><span class="kw4">瘙痒が主体で発熱しない</span></td></tr></table>'
        '<span class="kw3">「境界が明瞭か」「発熱が皮疹に先行したか」の2点で丹毒はほぼ絞れる</span>。'
        '<span class="kw3">激痛・血疱・全身状態不良があれば壊死性筋膜炎を疑い、'
        '画像や試験切開を待たずに外科へ渡す</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">丹毒＝A群β溶連菌が真皮浅層＋リンパ管に感染</span>。<br>'
         '② <span class="kw3">境界明瞭・鮮紅色・隆起・熱感＋悪寒戦慄を伴う発熱が先行</span>。<br>'
         '③ 好発は<span class="kw3">顔面と下腿</span>、所属リンパ節腫大を伴う。<br>'
         '④ <span class="kw3">治療はペニシリン系抗菌薬</span>（<span class="kw">Q.207</span>・'
         '<span class="kw">Q.218</span>でも問われる）。<br>'
         '⑤ <span class="kw4">境界不明瞭・下腿・深い＝蜂窩織炎</span>との対比で覚える。'
         '侵入門戸としての<span class="kw4">足白癬</span>を忘れない。')),

Q('117A-67', 91, [('bs', '★'), ('bi', '📷')],
  '76歳の男性。<span class="kw">全身の強い瘙痒</span>を主訴に来院した。'
  '<span class="kw">介護老人保健施設に入所中</span>である。'
  '<span class="kw">2か月前から全身に瘙痒</span>があり、'
  '<span class="kw">瘙痒のために夜も眠れない</span>ことがある。'
  '<span class="kw">腋窩、体幹、四肢、手掌および陰部に紅色の丘疹や搔破痕</span>がみられる。'
  '<span class="kw">手掌の丘疹部から採取した検体の顕微鏡写真</span>を示す。<br>'
  '<strong>正しいのはどれか。</strong>',
  [('a', '蚊により媒介される。', False,
                     '<span class="kw4">疥癬はヒゼンダニ〈Sarcoptes scabiei var. hominis〉が'
                     '角層内に寄生して起こる</span>もので、'
                     '<span class="kw4">媒介する昆虫（ベクター）は存在しない</span>。'
                     '<span class="kw4">虫体そのものが皮膚から皮膚へ直接移動する</span>。'),
   ('b', '有効な治療薬はない。', False,
                     '<span class="kw4">イベルメクチン内服、フェノトリンローション外用、'
                     'イオウ含有外用薬、クロタミトン外用など有効な治療薬がある</span>。'
                     '<span class="kw4">近年はフェノトリン外用とイベルメクチン内服が主軸</span>で、'
                     '<span class="kw4">1回では卵に効かないため1週間後に再投与</span>するのが要点である。'),
   ('c', 'ヒトからヒトへ感染する。', True,
                     '<span class="kw3">疥癬はヒゼンダニの直接接触による人から人への感染症</span>である。'
                     '<span class="kw3">介護施設・病院での集団発生が典型的</span>で、'
                     '<span class="kw3">本例が「介護老人保健施設に入所中」とされているのはそのため</span>である。'
                     '<span class="kw3">通常疥癬は長時間の肌と肌の接触で伝播し、'
                     '角化型（ノルウェー）疥癬は寝具・衣類を介した間接接触でも伝播する</span>。'),
   ('d', '近年はまれな疾患となった。', False,
                     '<span class="kw4">高齢化と施設入所者の増加により、疥癬はむしろ増加している</span>。'
                     '<span class="kw4">高齢者施設・療養病床での集団発生は現在も日常的な問題</span>であり、'
                     '「まれな疾患」ではない。'),
   ('e', 'アトピー性皮膚炎の原因の一つである。', False,
                     '<span class="kw4">アトピー性皮膚炎はフィラグリン遺伝子異常などを背景とした'
                     'バリア障害＋Th2型炎症による慢性疾患</span>で、疥癬とは病因が無関係である。'
                     '<span class="kw4">ただし疥癬は湿疹と誤診されてステロイド外用を受け、'
                     '悪化・拡大してから紹介されることが多い</span>——'
                     '<span class="kw4">これは「原因」ではなく「誤診されやすい」という関係</span>である。')],
  '高齢者施設入所＋2か月続く夜間に強い全身瘙痒＋陰部の丘疹＝疥癬。ヒトからヒトへ直接接触で感染する。',
  imgs=['images/117A-67_1.jpeg'],
  patho=('🦠 疥癬——角層に穴を掘るダニと、遅れてくるアレルギー',
         '<span class="kw3">疥癬はヒゼンダニ〈Sarcoptes scabiei var. hominis〉の'
         '雌成虫が角層内にトンネル（疥癬トンネル）を掘って産卵することで生じる</span>。'
         '<span class="kw3">虫体は0.4mm程度で肉眼ではほぼ見えず、'
         '手指の指間・手関節屈側・肘・腋窩・臍周囲・陰部・乳房下</span>という'
         '<span class="kw3">「皮膚が薄く体温が高く擦れる場所」</span>に好発する。'
         '<span class="kw4">顔面と頭部は通常侵されない（乳幼児と角化型は例外）</span>。<br>'
         '<span class="kw3">瘙痒はダニそのものではなく、虫体・虫卵・糞に対する'
         'Ⅳ型アレルギー（遅延型）による</span>。'
         '<span class="kw3">このため初感染では感染から症状出現まで1〜2か月の潜伏期があり、'
         '再感染では数日で症状が出る</span>。'
         '<span class="kw3">「夜間に増強する激しい瘙痒」</span>が最大の特徴で、'
         '<span class="kw3">陰部の結節（疥癬結節）は男性で診断的価値が高い</span>。<br>'
         '<span class="kw3">診断は皮疹部（とくにトンネルの先端や丘疹）から角質を採取し、'
         'KOH直接鏡検で虫体・虫卵を証明する</span>。'
         '<span class="kw4">ダーモスコピーで疥癬トンネル先端の虫体が'
         '三角形の黒い影（delta wing sign／jet with contrail）として見えれば、'
         '採取部位を狙い撃ちできる</span>。'),
  deep=('📌 通常疥癬と角化型（ノルウェー）疥癬の対比',
        '<table class="tb"><tr><th>項目</th><th>通常疥癬</th><th>角化型疥癬</th></tr>'
        '<tr><td>寄生虫数</td><td><span class="kw3">数十匹</span></td>'
        '<td><span class="kw3">100万〜200万匹</span></td></tr>'
        '<tr><td>宿主</td><td>免疫正常</td>'
        '<td><span class="kw3">高齢・低栄養・ステロイド／免疫抑制薬・HTLV-1・HIV</span></td></tr>'
        '<tr><td>皮疹</td><td>紅色丘疹・疥癬トンネル・陰部結節</td>'
        '<td><span class="kw3">灰白色の厚い角質増殖（牡蠣殻状）。頭部・顔面・爪も侵す</span></td></tr>'
        '<tr><td>瘙痒</td><td><span class="kw3">激烈</span></td>'
        '<td><span class="kw4">乏しいことがある（だから見逃す）</span></td></tr>'
        '<tr><td>感染力</td><td>低い（長時間の直接接触が必要）</td>'
        '<td><span class="kw3">極めて高い。短時間接触・寝具や衣類経由でも伝播</span></td></tr>'
        '<tr><td>隔離</td><td><span class="kw3">個室隔離は不要</span></td>'
        '<td><span class="kw3">個室隔離が必要</span></td></tr></table>'
        '<span class="kw3">「疥癬＝隔離」と機械的に覚えると誤る</span>——'
        '<span class="kw3">個室管理が要るのは角化型だけ</span>である'
        '（<span class="kw">Q.206</span>・<span class="kw">Q.210</span>で問われる）。<br>'
        '<span class="kw4">なお疥癬は感染症法の届出対象疾患ではない</span>。'
        '<span class="kw4">保健所への届出は不要で、対応の主軸は施設内の接触者健診である</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">疥癬＝ヒゼンダニの直接接触感染。ベクターは無い</span>。<br>'
         '② <span class="kw3">夜間増強する激しい瘙痒＋指間・陰部の皮疹＋施設入所</span>の三点セット。<br>'
         '③ <span class="kw3">瘙痒はⅣ型アレルギー＝初感染の潜伏期は1〜2か月</span>。<br>'
         '④ <span class="kw3">診断はKOH直接鏡検で虫体・虫卵を証明</span>。<br>'
         '⑤ <span class="kw4">有効な治療薬（イベルメクチン・フェノトリン）がある。届出は不要</span>。')),

Q('117B-31', 85, [('bs', '★'), ('bh', '必修'), ('bi', '📷')],
  '65歳の女性。発熱を主訴に来院した。'
  '<span class="kw">2日前から悪寒を伴う39℃台の発熱と右顔面の痛み</span>が出現したため受診した。'
  '鼻閉や鼻汁はない。生来健康で、アレルギー歴や外傷歴はない。意識は清明。体温38.4℃。'
  '脈拍92/分、整。血圧134/68mmHg。呼吸数20/分。'
  '<span class="kw">顔面に右を主体とする腫脹があり、左右差</span>を認める。'
  '<span class="kw">右額面から右頰部にかけて硬結と圧痛を伴う浮腫性紅斑</span>を認める。'
  '<span class="kw">右眼に充血はなく、眼球運動は正常</span>である。顔面の写真を示す。<br>'
  '<strong>考えられる病原微生物はどれか。</strong>',
  [('a', '結核菌', False, '<span class="kw4">皮膚結核（尋常性狼瘡・皮膚腺病）は'
                     '数か月〜数年かけて緩徐に進行する慢性肉芽腫性病変</span>で、'
                     '<span class="kw4">2日で39℃の発熱と急速な浮腫性紅斑を来す経過とは全く異なる</span>。'),
   ('b', '緑膿菌', False, '<span class="kw4">緑膿菌〈Pseudomonas aeruginosa〉による皮膚感染は、'
                     '熱傷創・褥瘡・好中球減少患者の壊疽性膿瘡〈ecthyma gangrenosum〉など'
                     '「defectのある皮膚」「易感染宿主」に起こる</span>。'
                     '<span class="kw4">生来健康な65歳の顔面に一次感染することは考えにくい</span>。'),
   ('c', 'カンジダ', False, '<span class="kw4">皮膚カンジダ症は間擦部（指間・鼠径・乳房下）に'
                     '浸軟した紅斑と衛星病巣を作る</span>もので、'
                     '<span class="kw4">高熱と急速な顔面腫脹を来す病態ではない</span>。'),
   ('d', 'A群β溶連菌', True, '<span class="kw3">悪寒を伴う39℃台の発熱が先行し、'
                     '境界明瞭で硬結・圧痛を伴う浮腫性紅斑が顔面に片側性に生じる</span>——'
                     '<span class="kw3">典型的な丹毒であり、起炎菌はA群β溶血性連鎖球菌'
                     '〈Streptococcus pyogenes〉</span>である。'
                     '<span class="kw3">丹毒の起炎菌はほぼA群β溶連菌に限られる</span>と考えてよく、'
                     '<span class="kw3">治療はペニシリン系抗菌薬</span>となる。'),
   ('e', '水痘・帯状疱疹ウイルス', False,
                     '<span class="kw4">三叉神経第1枝領域の帯状疱疹なら、'
                     '神経支配領域に一致して片側性に「集簇性小水疱」が並ぶ</span>のが必発である。'
                     '<span class="kw4">本例は水疱がなく浮腫性紅斑のみで、'
                     '皮膚分節に沿う分布でもない</span>。'
                     '<span class="kw4">また「先行する神経痛」があって発熱は目立たないのが普通</span>で、'
                     '悪寒を伴う39℃の高熱が先行する経過は溶連菌感染らしい。')],
  '悪寒を伴う高熱が先行＋顔面片側の境界明瞭な浮腫性紅斑＝丹毒。起炎菌はA群β溶連菌で、治療はペニシリン。',
  imgs=['images/117B-31_1.jpeg'],
  patho=('🦠 A群β溶連菌が皮膚に起こす病気を1枚に並べる',
         '<span class="kw3">A群β溶血性連鎖球菌〈GAS, Streptococcus pyogenes〉は、'
         '感染する深さと産生する毒素の違いで、まったく見た目の異なる疾患を起こす</span>。'
         '<span class="kw3">国試では「どの層か」「毒素か菌体か」の2軸で整理すると迷わない</span>。<br>'
         '<span class="kw3">①丹毒＝真皮浅層＋リンパ管。境界明瞭な鮮紅色の浮腫性紅斑。顔面・下腿。'
         '②蜂窩織炎＝真皮深層〜皮下。境界不明瞭（黄色ブドウ球菌との混在あり）。'
         '③壊死性筋膜炎＝筋膜。激痛・急速進行・ショック（劇症型溶連菌感染症）。'
         '④伝染性膿痂疹の痂皮型＝溶連菌型。厚い痂皮を伴い、小児に多い。'
         '⑤猩紅熱＝発赤毒（発熱毒素）による全身の点状紅斑・苺舌・口囲蒼白</span>。<br>'
         '<span class="kw3">続発症も重要である</span>——'
         '<span class="kw3">急性糸球体腎炎（感染後10日〜2週、皮膚感染からも起こる）</span>と'
         '<span class="kw3">リウマチ熱（咽頭感染後。皮膚感染からは起こらない）</span>を区別する。'
         '<span class="kw4">血清学的にはASO・ASK（抗ストレプトキナーゼ）が上昇するが、'
         '皮膚感染ではASOが上がりにくくASKが有用</span>とされる点も押さえておきたい。'),
  deep=('📌 「顔面が片側だけ赤く腫れた」ときの鑑別',
        '<table class="tb"><tr><th>疾患</th><th>決め手</th><th>発熱</th></tr>'
        '<tr><td><span class="kw3">丹　毒</span></td>'
        '<td><span class="kw3">境界明瞭な浮腫性紅斑・熱感・圧痛。悪寒戦慄が先行</span></td>'
        '<td><span class="kw3">39℃台</span></td></tr>'
        '<tr><td><span class="kw4">帯状疱疹（三叉神経第1枝）</span></td>'
        '<td><span class="kw4">神経支配域に一致した集簇性小水疱＋先行する神経痛。Hutchinson徴候</span></td>'
        '<td>微熱程度</td></tr>'
        '<tr><td><span class="kw4">眼窩蜂窩織炎</span></td>'
        '<td><span class="kw4">眼球突出・眼球運動障害・視力低下。副鼻腔炎に続発</span></td>'
        '<td>高熱</td></tr>'
        '<tr><td>接触皮膚炎</td><td>瘙痒主体・接触部位に一致・原因物質の心当たり</td><td>なし</td></tr>'
        '<tr><td>血管性浮腫</td><td>眼瞼・口唇の非圧痕性腫脹、瘙痒に乏しい、数時間〜数日で消退</td>'
        '<td>なし</td></tr></table>'
        '<span class="kw3">本問は「右眼に充血なし・眼球運動正常」と書くことで'
        '眼窩蜂窩織炎を、「鼻閉・鼻汁なし」と書くことで副鼻腔炎由来を除外している</span>。'
        '<span class="kw3">除外文が並んでいるときは、それが何を消しに来ているかを読むと'
        '出題者の想定鑑別が見える</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">丹毒の起炎菌＝A群β溶連菌</span>（必修レベル）。<br>'
         '② <span class="kw3">悪寒戦慄を伴う高熱が皮疹に先行する</span>のが細菌感染の合図。<br>'
         '③ <span class="kw3">境界明瞭・硬結・圧痛を伴う浮腫性紅斑</span>。<br>'
         '④ <span class="kw4">水疱がない＝帯状疱疹ではない</span>。<br>'
         '⑤ 治療は<span class="kw3">ペニシリン系抗菌薬</span>、続発症は'
         '<span class="kw3">急性糸球体腎炎</span>。')),

Q('116D-8', 80, [('bs', '★')],
  '<strong>急性の細菌感染症はどれか。</strong>',
  [('a', '癜　風', False, '<span class="kw4">癜風〈でんぷう〉はマラセチア〈Malassezia〉による'
                     '表在性真菌症</span>である。'
                     '<span class="kw4">体幹・上腕に淡褐色〜白色の細かい鱗屑を伴う斑が多発し、'
                     '自覚症状に乏しく慢性の経過</span>をとる。細菌ではない。'),
   ('b', '掌蹠膿疱症', False, '<span class="kw4">掌蹠膿疱症は手掌・足底に無菌性膿疱を反復する慢性疾患</span>で、'
                     '<span class="kw4">病巣感染（扁桃炎・歯性感染）や喫煙が増悪因子</span>だが、'
                     '<span class="kw4">膿疱そのものは無菌（細菌培養陰性）</span>である。'
                     '<span class="kw4">胸鎖関節痛（掌蹠膿疱症性骨関節炎）を伴うことがある</span>。'),
   ('c', '膿疱性乾癬', False, '<span class="kw4">膿疱性乾癬は発熱を伴って全身の紅斑上に'
                     '無菌性膿疱が多発する乾癬の重症型</span>で、指定難病である。'
                     '<span class="kw4">発熱するので紛らわしいが、膿疱は無菌性</span>で'
                     '感染症ではない。'),
   ('d', '化膿性汗腺炎', False, '<span class="kw4">化膿性汗腺炎〈hidradenitis suppurativa〉は'
                     '腋窩・鼠径・殿部の毛包閉塞に始まり、瘻孔・瘢痕を形成する慢性再発性の炎症性疾患</span>である。'
                     '<span class="kw4">二次的に細菌感染を伴うが本態は慢性の毛包炎症性疾患</span>で、'
                     '<span class="kw4">「急性の」細菌感染症とは呼べない</span>。'),
   ('e', '伝染性膿痂疹', True, '<span class="kw3">伝染性膿痂疹〈とびひ〉は、'
                     '黄色ブドウ球菌（水疱性膿痂疹）またはA群β溶連菌（痂皮性膿痂疹）による'
                     '急性の細菌感染症</span>である。'
                     '<span class="kw3">小児の夏季に多く、掻破した手を介して皮疹が「飛び火」する</span>。'
                     '<span class="kw3">選択肢の中で唯一、菌が皮膚に感染している急性疾患</span>である。')],
  '無菌性膿疱（掌蹠膿疱症・膿疱性乾癬）と真菌症（癜風）を外す。急性の細菌感染症は伝染性膿痂疹。',
  patho=('🦠 伝染性膿痂疹——「水疱性」と「痂皮性」を毒素で分ける',
         '<span class="kw3">伝染性膿痂疹〈impetigo contagiosa、俗称とびひ〉は、'
         '起炎菌によって2型に分かれ、それぞれ臨床像も好発年齢も季節も違う</span>。<br>'
         '<span class="kw3">①水疱性膿痂疹＝黄色ブドウ球菌</span>。'
         '<span class="kw3">菌が産生する表皮剝脱毒素〈exfoliative toxin, ET〉が'
         'デスモグレイン1〈Dsg1〉を分解し、角層下（顆粒層）に弛緩性水疱ができる</span>。'
         '<span class="kw3">乳幼児の夏季に多く、水疱はすぐ破れてびらんと薄い痂皮になる</span>。'
         '<span class="kw3">掻破した手指を介して自家接種で次々に広がる（＝飛び火）</span>。<br>'
         '<span class="kw3">②痂皮性膿痂疹＝A群β溶連菌</span>。'
         '<span class="kw3">厚い黄褐色の痂皮を伴い、発熱・咽頭炎・リンパ節腫脹を伴うことがある</span>。'
         '<span class="kw3">季節・年齢を問わず生じ、アトピー性皮膚炎に合併しやすい</span>。'
         '<span class="kw4">続発症として急性糸球体腎炎に注意する</span>。<br>'
         '<span class="kw3">治療はいずれも抗菌薬（外用＋必要に応じて内服。'
         'セフェム系またはペニシリン系）</span>で、'
         '<span class="kw4">患部を洗って清潔にし、被覆してから登園させる</span>。'
         '<span class="kw4">プール（水を介した接触）は治癒まで控える</span>。'),
  deep=('📌 「膿疱」を見たら細菌か無菌かを最初に決める',
        '<table class="tb"><tr><th>疾患</th><th>膿疱の性質</th><th>本態</th></tr>'
        '<tr><td><span class="kw3">伝染性膿痂疹</span></td>'
        '<td><span class="kw3">細菌性（黄色ブドウ球菌／溶連菌）</span></td>'
        '<td><span class="kw3">急性の細菌感染症</span></td></tr>'
        '<tr><td>毛包炎・せつ</td><td><span class="kw3">細菌性（黄色ブドウ球菌）</span></td>'
        '<td>毛包の細菌感染</td></tr>'
        '<tr><td><span class="kw4">掌蹠膿疱症</span></td>'
        '<td><span class="kw4">無菌性</span></td>'
        '<td><span class="kw4">病巣感染・喫煙を背景とする自己炎症性疾患</span></td></tr>'
        '<tr><td><span class="kw4">膿疱性乾癬</span></td><td><span class="kw4">無菌性</span></td>'
        '<td><span class="kw4">乾癬の重症型（IL-36経路）。発熱を伴う</span></td></tr>'
        '<tr><td><span class="kw4">Behçet病の毛包炎様皮疹</span></td><td><span class="kw4">無菌性</span></td>'
        '<td>血管炎・針反応陽性</td></tr>'
        '<tr><td>角層下膿疱症</td><td><span class="kw4">無菌性</span></td>'
        '<td>環状に配列する弛緩性膿疱</td></tr></table>'
        '<span class="kw3">膿疱＝感染ではない</span>。'
        '<span class="kw3">「無菌性膿疱」を作る代表として掌蹠膿疱症・膿疱性乾癬を'
        'セットで記憶しておくと、本問のような除外問題は一瞬で解ける</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">伝染性膿痂疹＝急性の細菌感染症</span>。'
         '<span class="kw3">水疱性＝黄色ブドウ球菌／痂皮性＝A群β溶連菌</span>。<br>'
         '② <span class="kw3">水疱性膿痂疹の水疱は表皮剝脱毒素によるDsg1分解</span>'
         '（SSSSと同じ機序）。<br>'
         '③ <span class="kw4">掌蹠膿疱症・膿疱性乾癬の膿疱は無菌性</span>。<br>'
         '④ <span class="kw4">癜風はマラセチア＝真菌</span>。<br>'
         '⑤ <span class="kw3">同型の問題が Q.209・Q.217 にもある</span>——'
         '「急性の細菌感染症」＝丹毒／伝染性膿痂疹が正解になる。')),

]

# ============================================================
# B問題（★問題） NO.195-205
# ============================================================
QUESTIONS += [

Q('115C-18', 59, [('bs', '★')],
  '<strong>瘙痒を<span class="kw2">伴わない</span>のはどれか。</strong>',
  [('a', '疥　癬', False, '<span class="kw4">疥癬は「夜も眠れない」ほどの激烈な瘙痒</span>が主症状である。'
                     '<span class="kw4">虫体・虫卵・糞に対するⅣ型アレルギーによる</span>ため、'
                     '皮疹の数に比して瘙痒が強い。'),
   ('b', '扁平苔癬', False, '<span class="kw4">扁平苔癬は「4つのP」——'
                     'purple（紫紅色）、polygonal（多角形）、pruritic（瘙痒性）、papule（丘疹）</span>で'
                     '記憶される疾患で、<span class="kw4">瘙痒は診断の構成要素そのもの</span>である。'
                     '表面のWickham線条、口腔粘膜のレース状白斑、C型肝炎との関連も押さえる。'),
   ('c', '尋常性狼瘡', True, '<span class="kw3">尋常性狼瘡〈lupus vulgaris〉は皮膚結核の一型</span>で、'
                     '<span class="kw3">結核菌に対する慢性の肉芽腫性炎症</span>である。'
                     '<span class="kw3">褐色調の局面が数年〜数十年かけて緩徐に拡大し、'
                     '中央は瘢痕化しながら辺縁に新病変を作る</span>。'
                     '<span class="kw3">硝子圧法で「リンゴゼリー様」の黄褐色を呈する</span>のが古典的所見で、'
                     '<span class="kw3">自覚症状に乏しく、瘙痒はない</span>。'
                     '<span class="kw3">感染性肉芽腫は基本的に痒くない</span>と覚えるとよい。'),
   ('d', '疱疹状皮膚炎', False, '<span class="kw4">疱疹状皮膚炎〈Duhring〉は'
                     '「dermatitis herpetiformis」の名のとおり、'
                     '肘・膝・殿部の伸側に集簇する小水疱と、それに伴う激しい瘙痒</span>が特徴である。'
                     '<span class="kw4">瘙痒が強すぎて水疱が掻き壊され、びらんしか見えないこともある</span>。'
                     'グルテン過敏性腸症を合併し、真皮乳頭部への顆粒状IgA沈着、DDSが著効する。'),
   ('e', '水疱性類天疱瘡', False, '<span class="kw4">水疱性類天疱瘡は高齢者に生じる自己免疫性水疱症</span>で、'
                     '<span class="kw4">緊満性水疱が出る前に「瘙痒を伴う浮腫性紅斑・蕁麻疹様紅斑」の'
                     '前駆期（前駆症状としての瘙痒）</span>がある。'
                     '<span class="kw4">「高齢者の難治性の痒み」として発症することが多い</span>ため、'
                     '瘙痒を伴わないとは言えない。')],
  '感染性肉芽腫（皮膚結核＝尋常性狼瘡）は痒くない。他の4つはいずれも瘙痒が主症状。',
  patho=('🦠 尋常性狼瘡——痒くない、ゆっくり広がる皮膚結核',
         '<span class="kw3">皮膚結核は、結核菌が皮膚に到達する経路と、'
         '宿主の結核に対する免疫（感作の有無）によって病型が分かれる</span>。'
         '<span class="kw3">尋常性狼瘡〈lupus vulgaris〉は、既に結核に感作された宿主に'
         '少数の菌が血行性・リンパ行性・直達性に達して生じる、最も頻度の高い皮膚結核</span>である。<br>'
         '<span class="kw3">臨床像は「顔面・頸部に生じる褐紅色の局面」</span>で、'
         '<span class="kw3">数年〜数十年という極端に緩徐な経過</span>をとる。'
         '<span class="kw3">中心部は萎縮性瘢痕となり、辺縁に狼瘡結節（lupus nodule）が'
         '新生して環状〜地図状に拡大していく</span>。'
         '<span class="kw3">硝子圧法（ガラス板で圧迫して血液を排除する）を行うと、'
         '類上皮細胞肉芽腫が透見されて黄褐色の「リンゴゼリー様〈apple jelly〉」に見える</span>——'
         'これがサルコイドーシスと共通する古典的所見である。'
         '<span class="kw4">長期経過例では瘢痕上に有棘細胞癌が発生することがある</span>。<br>'
         '<span class="kw3">病理は乾酪壊死を伴う（あるいは伴わない）類上皮細胞肉芽腫で、'
         '菌数が少ないため抗酸菌染色や培養は陰性のことが多い</span>。'
         '<span class="kw3">診断はツベルクリン反応強陽性・IGRA陽性・PCR</span>で補強し、'
         '<span class="kw3">治療は肺結核と同じ多剤併用（INH＋RFP＋EB＋PZA）</span>を行う。'),
  deep=('📌 「痒い皮膚疾患／痒くない皮膚疾患」の切り分け',
        '<table class="tb"><tr><th></th><th>疾患</th><th>理由</th></tr>'
        '<tr><td rowspan="4"><span class="kw3">痒い</span></td>'
        '<td><span class="kw3">疥　癬</span></td>'
        '<td>虫体・虫卵へのⅣ型アレルギー。夜間増強</td></tr>'
        '<tr><td><span class="kw3">アトピー性皮膚炎・湿疹・蕁麻疹</span></td>'
        '<td>Th2型炎症、ヒスタミン・IL-31</td></tr>'
        '<tr><td><span class="kw3">扁平苔癬・疱疹状皮膚炎</span></td>'
        '<td>4つのP／Duhringは激烈な瘙痒が定義的</td></tr>'
        '<tr><td><span class="kw3">水疱性類天疱瘡</span></td>'
        '<td>前駆期の瘙痒性紅斑で発症することが多い</td></tr>'
        '<tr><td rowspan="4"><span class="kw4">痒くない</span></td>'
        '<td><span class="kw4">尋常性狼瘡・皮膚腺病（皮膚結核）</span></td>'
        '<td><span class="kw4">慢性肉芽腫。自覚症状に乏しい</span></td></tr>'
        '<tr><td><span class="kw4">サルコイドーシス</span></td>'
        '<td>非乾酪性肉芽腫。無症候の局面</td></tr>'
        '<tr><td><span class="kw4">癜　風</span></td>'
        '<td><span class="kw4">マラセチアの表在寄生。無症候か軽度</span></td></tr>'
        '<tr><td><span class="kw4">尋常性乾癬</span></td>'
        '<td><span class="kw4">痒みは軽度〜なしのことが多い（あっても軽い）</span></td></tr></table>'
        '<span class="kw3">「肉芽腫性疾患は痒くない」「表在性の炎症・アレルギー性疾患は痒い」</span>という'
        '大枠を先に置くと、初見の疾患名でも当たりを付けられる。'
        '<span class="kw4">正答率59％はこの整理が曖昧だと迷うためで、'
        '扁平苔癬（b）と尋常性狼瘡（c）の取り違えが失点の主因と考えられる</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">尋常性狼瘡＝皮膚結核。慢性肉芽腫なので瘙痒はない</span>。<br>'
         '② <span class="kw3">硝子圧法でリンゴゼリー様</span>（サルコイドーシスと共通）。<br>'
         '③ <span class="kw3">中央が瘢痕化しながら辺縁が拡大／長期経過で有棘細胞癌</span>。<br>'
         '④ <span class="kw4">扁平苔癬の4つのP に pruritic（瘙痒性）が入っている</span>。<br>'
         '⑤ <span class="kw4">水疱性類天疱瘡は水疱より先に「痒み」で来る</span>。')),

Q('115D-33', 88, [('bs', '★'), ('bi', '📷')],
  '58歳の女性。母指と前腕の皮疹を主訴に来院した。'
  '<span class="kw">2か月前から右母指に紅色結節</span>が出現し、'
  '<span class="kw">2週前から手背と前腕にも同様の結節が多発</span>してきたため受診した。'
  '<span class="kw">水族館で飼育員として勤務</span>している。'
  '受診時、同部位に径15mmまでの発赤を伴う結節が多発し、表面は一部びらん、痂皮を伴う。'
  '<span class="kw">局所熱感と圧痛とを認めない</span>。'
  '皮膚生検で<span class="kw">類上皮細胞肉芽腫と非特異的炎症像が混在</span>する。'
  '<span class="kw">胞子状菌要素を認めない</span>。'
  '<span class="kw">生検組織片の真菌培養は陰性、小川培地で7週後に白色コロニーを形成</span>した。'
  '手と前腕の写真を示す。<br>'
  '<strong>考えられる疾患はどれか。</strong>',
  [('a', '丹　毒', False, '<span class="kw4">丹毒は悪寒戦慄を伴う高熱と、'
                     '境界明瞭で熱感・圧痛の強い浮腫性紅斑</span>が特徴である。'
                     '<span class="kw4">本例は「局所熱感と圧痛を認めない」と明記されており、'
                     '2か月の緩徐な経過でもある</span>。急性化膿性炎ではない。'),
   ('b', '化膿性粉瘤', False, '<span class="kw4">感染性粉瘤〈化膿性粉瘤〉は'
                     '既存の表皮嚢腫に細菌感染が起きたもの</span>で、'
                     '<span class="kw4">強い発赤・熱感・圧痛を伴う単発の有痛性腫瘤</span>となる。'
                     '<span class="kw4">前腕に線状に多発する経過はとらず、肉芽腫も作らない</span>。'),
   ('c', '非結核性抗酸菌症', True, '<span class="kw3">①水族館勤務＝水系曝露、'
                     '②2か月かけて母指から前腕へ結節が上行性に多発、'
                     '③熱感・圧痛に乏しい、④病理で類上皮細胞肉芽腫、'
                     '⑤真菌培養陰性かつ胞子状菌要素なし（＝真菌を否定）、'
                     '⑥小川培地（抗酸菌用培地）で7週後に白色コロニー</span>——'
                     '<span class="kw3">これは Mycobacterium marinum による'
                     '皮膚非結核性抗酸菌症〈非定型抗酸菌症〉に決まる</span>。'
                     '<span class="kw3">M. marinum は至適発育温度が30℃前後と低く、'
                     '体温より低い四肢末梢の皮膚に病巣を作る</span>のが特徴である。'),
   ('d', '蜂巣炎〈蜂窩織炎〉', False, '<span class="kw4">蜂窩織炎は境界不明瞭なびまん性の'
                     '発赤・腫脹・熱感・圧痛と発熱</span>を伴う急性感染症である。'
                     '<span class="kw4">「熱感と圧痛を認めない」時点で除外</span>でき、'
                     '<span class="kw4">結節が多発して肉芽腫を作ることもない</span>。'),
   ('e', 'スポロトリコーシス', False, '<span class="kw4">スポロトリコーシスは'
                     'Sporothrix schenckii による深在性真菌症</span>で、'
                     '<span class="kw4">園芸・農作業での外傷（バラの棘・水苔）を契機に、'
                     'リンパ管に沿って線状に結節が並ぶ（リンパ管型）</span>——'
                     '<span class="kw4">臨床像は本例に極めてよく似ている</span>。'
                     '<span class="kw3">決定的な除外根拠は検査所見</span>で、'
                     '<span class="kw3">①真菌培養が陰性、②胞子状菌要素を認めない、'
                     '③抗酸菌用の小川培地でコロニーが生えた</span>——'
                     'いずれも真菌症を否定し、抗酸菌症を支持する。')],
  '水族館勤務＋熱感・圧痛のない結節が上行性に多発＋小川培地で7週後に白色コロニー＝M. marinum による非結核性抗酸菌症。',
  imgs=['images/115D-33_1.jpeg'],
  patho=('🦠 Mycobacterium marinum——「水」と「低温」と「四肢末梢」',
         '<span class="kw3">非結核性抗酸菌〈NTM〉のうち皮膚病変を作る代表が'
         'Mycobacterium marinum（旧称：M. balnei）</span>である。'
         '<span class="kw3">水槽・プール・海水・魚の体表に常在し、'
         '手指の小さな傷から侵入する</span>。'
         '<span class="kw3">「熱帯魚の水槽を掃除した」「水族館の飼育員」「釣り・漁業」といった'
         '水系曝露歴が最大の手がかり</span>で、'
         '<span class="kw3">swimming pool granuloma／fish tank granuloma</span>という'
         '別名がそのまま病歴になっている。<br>'
         '<span class="kw3">最大の生物学的特徴は至適発育温度が30〜32℃と低いこと</span>である。'
         '<span class="kw3">このため深部体温の高い体幹・内臓ではなく、'
         '手指・前腕・下腿といった体温の低い四肢末梢に限局する</span>。'
         '<span class="kw3">臨床像は接種部位の紅色結節に始まり、'
         'リンパ管に沿って中枢側へ数珠状に新病変が並ぶ（sporotrichoid pattern）</span>。'
         '<span class="kw4">化膿菌感染と違って熱感・圧痛・発熱に乏しく、'
         '数週〜数か月の緩徐な経過をとる</span>。<br>'
         '<span class="kw3">診断は生検組織の抗酸菌培養が決め手</span>で、'
         '<span class="kw3">小川培地を30℃前後で培養し、数週間（本例は7週）かけてコロニーが生える</span>。'
         '<span class="kw4">37℃の通常条件だけで培養すると発育せず「陰性」と誤読する</span>ため、'
         '<span class="kw4">臨床医が「M. marinum を疑う」と伝えて低温培養を依頼することが不可欠</span>である。'
         '<span class="kw3">治療はクラリスロマイシン、ミノサイクリン、リファンピシン＋エタンブトールなどを'
         '数か月投与</span>する。'),
  deep=('📌 「線状に結節が並ぶ」sporotrichoid pattern の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>曝露歴</th><th>培養・検査</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">M. marinum 感染症</span></td>'
        '<td><span class="kw3">水槽・水族館・魚</span></td>'
        '<td><span class="kw3">小川培地30℃で数週後にコロニー。真菌培養は陰性</span></td>'
        '<td><span class="kw3">クラリスロマイシン・ミノサイクリン等</span></td></tr>'
        '<tr><td><span class="kw4">スポロトリコーシス</span></td>'
        '<td><span class="kw4">土壌・園芸・バラの棘・水苔</span></td>'
        '<td><span class="kw4">Sabouraud培地で真菌培養陽性。星芒体〈asteroid body〉</span></td>'
        '<td><span class="kw4">ヨウ化カリウム内服・イトラコナゾール</span></td></tr>'
        '<tr><td>ノカルジア症</td><td>土壌・免疫抑制</td>'
        '<td>部分抗酸性のGram陽性分枝桿菌</td><td>ST合剤</td></tr>'
        '<tr><td>皮膚リーシュマニア症</td><td>流行地渡航・サシチョウバエ</td>'
        '<td>塗抹でamastigote</td><td>アンチモン剤</td></tr>'
        '<tr><td>皮膚腺病</td><td>結核既往・リンパ節結核</td>'
        '<td><span class="kw4">頸部リンパ節から皮膚へ穿破。瘻孔形成</span></td>'
        '<td>抗結核薬多剤併用</td></tr></table>'
        '<span class="kw3">臨床像だけでは M. marinum とスポロトリコーシスは区別できない</span>。'
        '<span class="kw3">分けるのは「曝露歴（水か土か）」と「どの培地で何が生えたか」</span>で、'
        '<span class="kw3">本問はその両方をわざわざ書いてくれている</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">水族館・熱帯魚の水槽＋四肢末梢の無痛性結節＝M. marinum</span>。<br>'
         '② <span class="kw3">至適発育温度30℃前後＝四肢末梢に限局し、低温培養が必要</span>。<br>'
         '③ <span class="kw3">小川培地で数週間後にコロニー／病理は類上皮細胞肉芽腫</span>。<br>'
         '④ <span class="kw4">土壌・バラの棘＝スポロトリコーシス</span>（真菌培養陽性）。<br>'
         '⑤ <span class="kw4">熱感・圧痛がない＝化膿性細菌感染ではない</span>という読み方。'
         '同型問題が <span class="kw">Q.211</span> にある。')),

Q('114D-24', 93, [('bs', '★'), ('bi', '📷')],
  '3歳の女児。発熱と全身の皮疹を主訴に祖母に連れられて来院した。'
  '<span class="kw">2日前から38℃台の発熱と顔面の紅斑</span>が出現し、'
  '紅斑は昨日から全身に拡大したという。<span class="kw">薬剤内服歴はない</span>。'
  '体温38.1℃。脈拍132/分、整。血圧96/58mmHg。呼吸数30/分。SpO<sub>2</sub> 98％（room air）。'
  '<span class="kw">口囲と鼻周囲の紅斑とともに鱗屑、黄色痂皮</span>を認める。'
  '<span class="kw">びまん性紅斑は頸部、腋窩、腹部および鼠径部に高度</span>である。'
  '<span class="kw">患児は接触痛を訴え</span>、元気がなく不機嫌である。'
  '頸部の紅斑には小水疱と小膿疱を伴う。'
  '<span class="kw">眼粘膜と口腔粘膜とに異常を認めない</span>。'
  '血液所見：赤血球434万、Hb 12.1g/dL、Ht 35％、白血球12,300、血小板33万。'
  '免疫血清学所見：CRP 0.8mg/dL、<span class="kw">ASO 230単位（基準250以下）</span>。'
  '顔面から胸部にかけての写真を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '風　疹', False, '<span class="kw4">風疹は淡紅色の小紅斑が顔から全身へ広がり、'
                     '耳後部・後頸部リンパ節腫脹を伴う</span>。'
                     '<span class="kw4">3日で消退し（三日はしか）、接触痛やびらんは生じない</span>。'
                     '口囲の痂皮・接触痛はまったく説明できない。'),
   ('b', '麻　疹', False, '<span class="kw4">麻疹はカタル期（発熱・咳嗽・鼻汁・結膜炎）と'
                     'Koplik斑を経て、いったん解熱してから再び発熱するとともに'
                     '融合傾向のある紅斑が耳後部から下降する</span>。'
                     '<span class="kw4">本例には眼・口腔粘膜の異常がなく（＝結膜炎もKoplik斑もない）、'
                     '接触痛やびらんも麻疹では説明できない</span>。'),
   ('c', '伝染性紅斑', False, '<span class="kw4">伝染性紅斑〈りんご病〉はヒトパルボウイルスB19による</span>。'
                     '<span class="kw4">両頬に境界明瞭な蝶翼状の紅斑（平手打ち様）が出て、'
                     '四肢にレース状・網目状の紅斑</span>が続く。'
                     '<span class="kw4">発疹が出る頃には解熱しており全身状態は良好</span>で、'
                     '接触痛や口囲の痂皮は伴わない。'),
   ('d', 'Stevens-Johnson症候群', False,
                     '<span class="kw4">SJSは薬剤（および Mycoplasma 感染）を契機に生じる重症薬疹</span>で、'
                     '<span class="kw3">眼粘膜（結膜充血・偽膜）・口唇口腔粘膜（びらん・血痂）の'
                     '粘膜疹が必須</span>である。'
                     '<span class="kw3">本例は「薬剤内服歴はない」「眼粘膜と口腔粘膜に異常を認めない」と'
                     '二重に否定されている</span>ため除外される。'),
   ('e', 'ブドウ球菌性熱傷様皮膚症候群', True,
                     '<span class="kw3">①乳幼児、②口囲・鼻周囲の紅斑＋鱗屑＋黄色痂皮（放射状亀裂）、'
                     '③頸部・腋窩・鼠径といった間擦部に高度なびまん性紅斑、'
                     '④接触痛（＝表皮が剝がれかけている）、'
                     '⑤眼・口腔の粘膜疹がない、⑥ASO陰性（溶連菌ではない）</span>——'
                     '<span class="kw3">ブドウ球菌性熱傷様皮膚症候群〈SSSS〉の典型像</span>である。'
                     '<span class="kw3">黄色ブドウ球菌が産生する表皮剝脱毒素〈ET〉が'
                     '血行性に全身へ回り、Dsg1を分解して顆粒層で表皮が剝離する</span>。')],
  '乳幼児＋口囲の痂皮と放射状亀裂＋間擦部に高度なびまん性紅斑＋接触痛＋粘膜疹なし＝SSSS。粘膜疹があればSJS。',
  imgs=['images/114D-24_1.jpeg'],
  patho=('🦠 SSSS——毒素が血流に乗り、Dsg1だけを壊す',
         '<span class="kw3">ブドウ球菌性熱傷様皮膚症候群〈staphylococcal scalded skin syndrome: SSSS〉は、'
         '黄色ブドウ球菌が産生する表皮剝脱毒素〈exfoliative toxin: ET-A/ET-B〉が'
         '血行性に全身の表皮へ到達し、デスモグレイン1〈Dsg1〉を特異的に分解することで生じる</span>。'
         '<span class="kw3">重要なのは「菌そのものは皮疹部にいない」こと</span>で、'
         '<span class="kw3">菌の巣は鼻腔・咽頭・結膜・臍・膿痂疹病巣などにあり、'
         '剝離した皮膚を培養しても菌は検出されない</span>。<br>'
         '<span class="kw3">Dsg1は表皮上層（顆粒層）に分布するため、裂隙は顆粒層にできる</span>。'
         '<span class="kw3">その結果、水疱は極めて浅く弛緩性で、すぐ破れて広範なびらんとなり、'
         '「熱傷様」の外観になる</span>。'
         '<span class="kw3">Nikolsky現象（一見正常な皮膚を擦ると表皮が剝離する）が陽性</span>で、'
         '<span class="kw3">これが「接触痛」「触ると痛がる」という記載の正体</span>である。<br>'
         '<span class="kw3">乳幼児に好発する理由は2つ</span>——'
         '<span class="kw3">①ETに対する中和抗体を持たない、②腎からのET排泄能が未熟</span>。'
         '<span class="kw4">成人発症はまれで、腎不全や免疫不全が背景にあることが多い</span>。'
         '<span class="kw3">初発部位は口囲・眼囲・頸部で、口囲の放射状亀裂（口角から放射状に走る亀裂）</span>が'
         '特徴的である。'
         '<span class="kw3">粘膜は侵されない（Dsg1優位でないため）</span>——'
         '<span class="kw3">これがSJS/TENとの決定的な鑑別点</span>である。<br>'
         '<span class="kw3">治療は抗菌薬（セフェム系など抗ブドウ球菌薬）の全身投与と、'
         '熱傷に準じた輸液・創部管理</span>。'
         '<span class="kw4">表皮の浅い層で剝がれるだけなので、適切に治療すれば瘢痕を残さず治癒する</span>。'),
  deep=('📌 SSSS と SJS/TEN と 尋常性天疱瘡——裂隙の高さで整理する',
        '<table class="tb"><tr><th>項目</th><th>SSSS</th><th>SJS/TEN</th><th>尋常性天疱瘡</th></tr>'
        '<tr><td>原因</td><td><span class="kw3">黄色ブドウ球菌の表皮剝脱毒素</span></td>'
        '<td><span class="kw4">薬剤・Mycoplasma</span></td>'
        '<td>抗Dsg3（±Dsg1）自己抗体</td></tr>'
        '<tr><td><span class="kw3">裂隙の高さ</span></td>'
        '<td><span class="kw3">顆粒層（表皮内・ごく浅い）</span></td>'
        '<td><span class="kw4">表皮全層壊死＋表皮下</span></td>'
        '<td><span class="kw3">基底層直上（表皮内）</span></td></tr>'
        '<tr><td><span class="kw3">粘膜疹</span></td>'
        '<td><span class="kw3">なし</span></td>'
        '<td><span class="kw4">必発（眼・口唇・外陰）</span></td>'
        '<td><span class="kw3">口腔粘膜びらんで初発することが多い</span></td></tr>'
        '<tr><td>好発年齢</td><td><span class="kw3">乳幼児</span></td><td>全年齢</td>'
        '<td>中高年</td></tr>'
        '<tr><td>Nikolsky現象</td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw3">陽性</span></td><td><span class="kw3">陽性</span></td></tr>'
        '<tr><td>治療</td><td><span class="kw3">抗菌薬＋支持療法</span></td>'
        '<td><span class="kw4">被疑薬中止＋ステロイド・IVIG</span></td>'
        '<td>ステロイド＋免疫抑制薬</td></tr>'
        '<tr><td>予後</td><td><span class="kw3">良好・瘢痕を残さない</span></td>'
        '<td><span class="kw4">TENは致死率20〜30％</span></td><td>治療により制御</td></tr></table>'
        '<span class="kw3">「Nikolsky現象陽性」は3つとも共通なので鑑別に使えない</span>。'
        '<span class="kw3">分けるのは「粘膜疹の有無」と「年齢」と「薬剤歴」</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">SSSS＝表皮剝脱毒素がDsg1を分解→顆粒層で剝離</span>。<br>'
         '② <span class="kw3">乳幼児・口囲の放射状亀裂・間擦部の紅斑・接触痛（Nikolsky陽性）</span>。<br>'
         '③ <span class="kw3">粘膜疹はない＝SJS/TENとの鑑別点</span>。<br>'
         '④ <span class="kw3">皮疹部に菌はいない（巣は鼻腔・咽頭）→抗菌薬全身投与</span>。<br>'
         '⑤ <span class="kw4">同じ毒素が局所で働くと水疱性膿痂疹になる</span>'
         '（<span class="kw">Q.194</span>・<span class="kw">Q.209</span>・'
         '<span class="kw">Q.220</span>と連動）。')),

Q('114E-26', 98, [('bs', '★'), ('bh', '必修')],
  '42歳の女性。発熱および悪寒戦慄が出現し、ぐったりしていたため家人に連れられて来院した。'
  '<span class="kw">昨日の夕方に悪寒戦慄を伴う発熱</span>が出現したため受診した。'
  '<span class="kw">咽頭痛、咳、痰および鼻汁はない</span>。'
  '<span class="kw">悪心、嘔吐、腹痛および下痢はなく、頻尿や排尿時痛もない</span>。'
  '周囲に同様の症状の人はいない。'
  '<span class="kw">小児期からアトピー性皮膚炎</span>があり、'
  '<span class="kw">数日前から皮膚の状態が悪化し全身に瘙痒感があり搔破している</span>という。'
  '<span class="kw">意識レベルはJCSⅠ-2。体温39.2℃。脈拍112/分、整。血圧86/58mmHg。呼吸数28/分</span>。'
  '心音と呼吸音とに異常を認めない。口腔内と咽頭とに異常を認めない。両側背部の叩打痛はない。'
  '顔面、体幹部、両側上肢および両側膝の背面部で紅斑、色素沈着、鱗屑および落屑を認める。'
  'また、同部に<span class="kw">多数の搔破痕および一部痂皮</span>を認める。<br>'
  '<strong>最も適切な検査はどれか。</strong>',
  [('a', '尿培養', False, '<span class="kw4">尿路感染症・腎盂腎炎も悪寒戦慄を伴う菌血症の原因になる</span>が、'
                     '<span class="kw4">本例は「頻尿や排尿時痛もない」「両側背部の叩打痛はない」と'
                     '明確に否定されている</span>。'
                     '<span class="kw4">加えて、感染巣が尿路であっても敗血症を疑う以上は'
                     '血液培養が最優先になる</span>。'),
   ('b', '血液培養', True, '<span class="kw3">悪寒戦慄＋39.2℃＋収縮期血圧86mmHg＋'
                     '脈拍112＋呼吸数28＋意識レベル低下（JCSⅠ-2）</span>——'
                     '<span class="kw3">qSOFA（意識変容・収縮期血圧≦100・呼吸数≧22）を'
                     '3項目すべて満たす敗血症</span>である。'
                     '<span class="kw3">悪寒戦慄〈shaking chill〉は菌血症を強く示唆する所見</span>で、'
                     '<span class="kw3">感染巣は「搔破痕・痂皮のある破綻したアトピー性皮膚炎の皮膚」</span>と'
                     '推定される。'
                     '<span class="kw3">敗血症を疑ったら、抗菌薬投与前に'
                     '血液培養2セット（好気・嫌気×2部位）を採取する</span>——これが原則である。'),
   ('c', '喀痰Gram染色', False, '<span class="kw4">「咳、痰および鼻汁はない」「呼吸音に異常を認めない」</span>と'
                     '記載されており、<span class="kw4">そもそも喀痰が出ない</span>。'
                     '肺炎を示唆する所見がない。'),
   ('d', '麻疹抗体価測定', False, '<span class="kw4">麻疹はカタル症状（咳・鼻汁・結膜炎）とKoplik斑を伴い、'
                     '発熱と発疹が段階的に出現する</span>。'
                     '<span class="kw4">本例の皮疹は長年のアトピー性皮膚炎による'
                     '慢性湿疹病変（色素沈着・鱗屑・苔癬化）であって新規の発疹ではない</span>。'
                     '<span class="kw4">また抗体価は結果が出るまで日数がかかり、'
                     'ショックの患者に「最も適切な検査」とはならない</span>。'),
   ('e', 'インフルエンザ迅速検査', False,
                     '<span class="kw4">咽頭痛・咳・鼻汁といった上気道症状がなく、'
                     '「周囲に同様の症状の人はいない」と流行状況も否定されている</span>。'
                     '<span class="kw4">インフルエンザ単独でqSOFA 3点のショックに至る経過は説明しにくい</span>。')],
  '悪寒戦慄＋qSOFA 3項目該当＝敗血症。侵入門戸は搔破したアトピー性皮膚炎の皮膚。抗菌薬投与前に血液培養。',
  patho=('🦠 皮膚は感染の入口——アトピー性皮膚炎と菌血症',
         '<span class="kw3">健常な皮膚は角層のバリア・抗菌ペプチド・常在菌叢によって'
         '病原体の侵入を防いでいる</span>。'
         '<span class="kw3">アトピー性皮膚炎ではフィラグリン異常によるバリア破綻に加え、'
         '抗菌ペプチド（LL-37、β-ディフェンシン）の産生が低下し、'
         '皮膚は黄色ブドウ球菌に高率に定着（コロナイズ）している</span>。'
         '<span class="kw3">そこへ搔破による物理的な破綻が加わると、'
         '菌が真皮・皮下・血流へ侵入する経路ができる</span>。<br>'
         '<span class="kw3">アトピー性皮膚炎に合併する感染症は国試頻出である</span>——'
         '<span class="kw3">①伝染性膿痂疹（黄色ブドウ球菌）、②蜂窩織炎・敗血症、'
         '③カポジ水痘様発疹症〈Kaposi varicelliform eruption〉＝単純ヘルペスウイルスの播種、'
         '④伝染性軟属腫の多発、⑤白癬・カンジダ</span>。'
         '<span class="kw4">とくにカポジ水痘様発疹症は、湿疹部位に一斉に'
         '同じ大きさの臍窩を持つ小水疱・膿疱が出現し高熱を伴うもので、'
         'アシクロビルの全身投与を要する</span>。<br>'
         '<span class="kw3">本問の核は皮膚科というより救急のアルゴリズム</span>である。'
         '<span class="kw3">悪寒戦慄〈rigor, shaking chill〉は「体ががたがた震えて止まらない」状態を指し、'
         '菌血症の存在を強く示唆する所見（陽性尤度比が高い）</span>である。'
         '<span class="kw3">敗血症を疑ったら「培養を採る→広域抗菌薬を1時間以内に投与→輸液」</span>の順で、'
         '<span class="kw3">抗菌薬投与後の培養は検出率が大きく下がる</span>ため'
         '<span class="kw3">必ず投与前に採取する</span>。'),
  deep=('📌 敗血症を疑う指標と、初期対応の順番',
        '<table class="tb"><tr><th>段階</th><th>内容</th></tr>'
        '<tr><td><span class="kw3">気づく</span></td>'
        '<td><span class="kw3">qSOFA：①意識変容 ②収縮期血圧≦100mmHg ③呼吸数≧22/分 のうち2項目以上</span>'
        '（本例は3項目すべて該当）</td></tr>'
        '<tr><td><span class="kw3">悪寒戦慄</span></td>'
        '<td><span class="kw3">震えが止まらないレベル＝菌血症の可能性が高い。'
        '「寒気がする」程度とは区別する</span></td></tr>'
        '<tr><td><span class="kw3">①培養</span></td>'
        '<td><span class="kw3">血液培養2セット（好気＋嫌気を2部位から）を'
        '抗菌薬投与前に採取。感染巣に応じて尿・喀痰・膿も</span></td></tr>'
        '<tr><td><span class="kw3">②抗菌薬</span></td>'
        '<td><span class="kw3">認知から1時間以内に広域抗菌薬を経験的に開始</span></td></tr>'
        '<tr><td><span class="kw3">③蘇生</span></td>'
        '<td><span class="kw3">晶質液30mL/kgの急速輸液、乳酸値測定、'
        '反応不良なら昇圧薬（ノルアドレナリン）</span></td></tr>'
        '<tr><td><span class="kw3">④感染巣制御</span></td>'
        '<td>膿瘍ドレナージ、壊死組織デブリドマン、カテーテル抜去</td></tr></table>'
        '<span class="kw3">「培養が先、抗菌薬が後」は必修レベルの原則</span>である。'
        '<span class="kw4">ただし培養採取で抗菌薬開始が遅れてはならず、'
        '45分以内に採取できないなら投与を優先する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">悪寒戦慄＝菌血症を示唆</span>。まず<span class="kw3">血液培養</span>。<br>'
         '② <span class="kw3">qSOFA：意識変容・収縮期血圧≦100・呼吸数≧22</span>。<br>'
         '③ <span class="kw3">血液培養は抗菌薬投与前に2セット</span>。<br>'
         '④ <span class="kw3">アトピー性皮膚炎の破綻した皮膚は侵入門戸になる</span>。<br>'
         '⑤ 除外文（咳なし・排尿時痛なし・叩打痛なし）は'
         '<span class="kw4">他の感染巣を潰すために置かれている</span>。'
         '正答率98％＝落としてはいけない問題。')),

]

QUESTIONS += [

Q('112D-33', 93, [('bs', '★'), ('bi', '📷')],
  '8歳の男児。<span class="kw">頭部の脱毛と疼痛</span>とを主訴に来院した。'
  '<span class="kw">2か月前から頭皮に痒みとともに脱毛斑</span>が出現した。'
  '<span class="kw">市販の副腎皮質ステロイド外用薬を塗布していたところ、'
  '2週間前から次第に発赤し、膿疱や痂皮を伴い疼痛も出現</span>してきたため受診した。'
  '<span class="kw">ネコを飼育している</span>。'
  '<span class="kw">痂皮を剝がすと少量の排膿があり圧痛</span>を伴う。'
  '<span class="kw">病変部に残存する毛は容易に抜毛</span>される。'
  '<span class="kw">後頸部に径2cmのリンパ節を2個触知し圧痛</span>を認める。'
  '後頭部の写真（A）と抜毛の苛性カリ〈KOH〉直接鏡検標本（B）とを示す。<br>'
  '<strong>治療薬として適切なのはどれか。</strong>',
  [('a', 'イソニアジド', False, '<span class="kw4">イソニアジドは抗結核薬</span>である。'
                     '<span class="kw4">頭部の皮膚結核（皮膚腺病）は数か月〜年単位で瘻孔を形成する慢性経過</span>で、'
                     '<span class="kw4">KOH直接鏡検で菌糸が見えることはない</span>。'),
   ('b', 'バラシクロビル', False, '<span class="kw4">バラシクロビルは抗ヘルペスウイルス薬</span>である。'
                     '<span class="kw4">頭部の帯状疱疹なら片側の神経支配域に一致した集簇性小水疱</span>となり、'
                     '<span class="kw4">脱毛斑や易抜毛性、KOHでの菌糸は説明できない</span>。'),
   ('c', 'ミノサイクリン', False, '<span class="kw4">ミノサイクリンは抗菌薬</span>である。'
                     '<span class="kw4">膿疱と排膿があるため細菌感染（頭部の毛包炎・せつ）を疑いたくなる</span>が、'
                     '<span class="kw3">Celsus禿瘡の膿疱・排膿は白癬菌に対する強いアレルギー反応（化膿性肉芽腫）</span>で、'
                     '<span class="kw3">細菌培養は陰性のことが多く、抗菌薬では治らない</span>。'
                     '<span class="kw4">ここを誤ると病変が拡大し瘢痕性脱毛を残す</span>。'),
   ('d', 'イトラコナゾール', True, '<span class="kw3">①2か月前からの痒みを伴う脱毛斑、'
                     '②ステロイド外用で増悪（＝真菌が増える）、③ネコの飼育歴、'
                     '④膿疱・排膿・圧痛、⑤易抜毛性、⑥所属リンパ節腫脹、'
                     '⑦KOH直接鏡検で毛内に菌要素</span>——'
                     '<span class="kw3">Celsus禿瘡〈ケルスス禿瘡＝深在性の頭部白癬〉</span>である。'
                     '<span class="kw3">毛の内部に菌が寄生しているため外用薬は毛内へ届かず、'
                     '抗真菌薬の内服（イトラコナゾールまたはテルビナフィン）が必須</span>である。'),
   ('e', 'レボフロキサシン', False, '<span class="kw4">レボフロキサシンはニューキノロン系抗菌薬</span>で、'
                     'ｃと同じ理由で不適である。'
                     '<span class="kw4">真菌には無効であり、小児では関節毒性の懸念から'
                     '通常は選択されない</span>。')],
  'ステロイド外用で増悪した頭部の脱毛＋膿疱＋易抜毛性＋KOHで菌要素＝Celsus禿瘡。毛内寄生なので抗真菌薬の内服。',
  imgs=['images/112D-33_1.jpeg', 'images/112D-33_2.jpeg'],
  patho=('🍄 頭部白癬とCelsus禿瘡——外用薬が届かない白癬',
         '<span class="kw3">頭部白癬〈しらくも、tinea capitis〉は、白癬菌が毛包・毛幹に寄生して'
         '脱毛斑を作る疾患</span>である。'
         '<span class="kw3">日本では Microsporum canis（イヌ・ネコ由来）と'
         'Trichophyton tonsurans（柔道・レスリングなど格闘技での人から人への感染）が主体</span>で、'
         '<span class="kw3">「ペット飼育歴」「格闘技部」は必ず聞く病歴</span>である。<br>'
         '<span class="kw3">これに宿主の強いアレルギー反応（Ⅳ型）が加わり、'
         '毛包周囲が化膿性肉芽腫となって隆起・排膿するようになったものが'
         'Celsus禿瘡〈ケルスス禿瘡、kerion celsi〉</span>である。'
         '<span class="kw3">臨床像は「膿疱・痂皮を伴う有痛性の隆起性局面。'
         '圧迫すると毛孔から排膿し、毛は抵抗なく抜ける（易抜毛性）。'
         '所属リンパ節が腫脹する」</span>。'
         '<span class="kw4">見た目が化膿性疾患そのものなので、細菌感染と誤診されて'
         '抗菌薬が投与されたり、湿疹と誤診されてステロイド外用が行われたりする</span>——'
         '<span class="kw3">本例の「ステロイド外用で悪化」という経過はまさにそれ</span>である'
         '（ステロイドで局所免疫が抑制され真菌が増殖した状態を'
         '<span class="kw3">異型白癬〈tinea incognito〉</span>と呼ぶ）。<br>'
         '<span class="kw3">診断はKOH直接鏡検で、抜いた毛を検体にする</span>。'
         '<span class="kw3">毛の内部に菌糸・胞子を認めれば毛内寄生（endothrix）</span>で、'
         '<span class="kw3">この「毛の中」という寄生部位こそが、外用抗真菌薬では治せず'
         '内服が必要である理由</span>である。'
         '<span class="kw4">Wood灯でM. canisは黄緑色蛍光を発する（T. tonsuransは発しない）</span>。<br>'
         '<span class="kw3">治療はイトラコナゾールまたはテルビナフィンの内服を'
         '4〜8週以上</span>行う。'
         '<span class="kw4">切開排膿は不要で、むしろ瘢痕性脱毛を残すため避ける</span>。'
         '<span class="kw4">診断が遅れると永久脱毛になるため、'
         '「頭部の膿疱＝まずKOH」が実地の要点である</span>。'),
  deep=('📌 頭部の脱毛斑を来す疾患の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>炎症</th><th>抜毛</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Celsus禿瘡</span></td>'
        '<td><span class="kw3">強い（膿疱・排膿・圧痛）</span></td>'
        '<td><span class="kw3">容易（易抜毛性）</span></td>'
        '<td><span class="kw3">KOHで毛内に菌要素／リンパ節腫脹／ペット・格闘技</span></td></tr>'
        '<tr><td>頭部白癬（浅在性）</td><td>軽い（鱗屑・断毛）</td><td>やや容易</td>'
        '<td>KOH陽性。Wood灯でM. canisは黄緑色蛍光</td></tr>'
        '<tr><td><span class="kw4">円形脱毛症</span></td>'
        '<td><span class="kw4">なし（皮膚は正常）</span></td>'
        '<td><span class="kw4">辺縁で容易（感嘆符毛）</span></td>'
        '<td><span class="kw4">境界明瞭な円形脱毛。自己免疫。爪の点状陥凹</span></td></tr>'
        '<tr><td>抜毛症</td><td>なし</td><td>—</td>'
        '<td>不整形・長さの不揃いな断毛。心理的背景</td></tr>'
        '<tr><td>頭部の膿皮症（せつ・毛包炎）</td><td>強い</td><td>—</td>'
        '<td><span class="kw4">細菌培養陽性。KOH陰性。抗菌薬が効く</span></td></tr>'
        '<tr><td>脂漏性皮膚炎</td><td>軽い紅斑・鱗屑</td><td>—</td>'
        '<td>脱毛は目立たない。マラセチア関与</td></tr></table>'
        '<span class="kw3">「炎症が強い脱毛斑」を見たら、細菌と決めつける前にKOHを取る</span>。'
        '<span class="kw3">円形脱毛症は炎症所見がまったくない</span>点で明確に分かれる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Celsus禿瘡＝深在性頭部白癬。膿疱・排膿・圧痛・易抜毛性・リンパ節腫脹</span>。<br>'
         '② <span class="kw3">毛内寄生なので外用は無効。抗真菌薬の内服（イトラコナゾール等）</span>。<br>'
         '③ <span class="kw4">細菌感染に見えるが細菌培養は陰性＝抗菌薬は効かない</span>。<br>'
         '④ <span class="kw3">ステロイド外用で増悪＝異型白癬〈tinea incognito〉</span>。<br>'
         '⑤ 病歴は<span class="kw3">ペット（M. canis）・格闘技（T. tonsurans）</span>。'
         '<span class="kw">Q.215</span>も同じ疾患。')),

Q('111E-47', 46, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '22歳の男性。頸部の皮疹を主訴に来院した。'
  '<span class="kw">3か月前に頸部に痒みを伴う皮疹が出現し、次第に拡大</span>した。'
  '<span class="kw">病変部から鱗屑を採取し、苛性カリ〈KOH〉直接鏡検法で観察</span>した。'
  '頸部の写真（A）を示す。<br>'
  '<strong>示す標本（B ①〜⑤）のうち、この患者のものと考えられるのはどれか。</strong>',
  [('a', '①', False, '<span class="kw4">長く伸びた仮性菌糸〈pseudohypha〉に沿って、'
                     '卵円形の分芽胞子〈blastoconidia〉がブドウの房状に集簇している</span>。'
                     '<span class="kw4">仮性菌糸＋分芽胞子＝カンジダ〈Candida〉</span>の像である。'
                     '<span class="kw4">カンジダは間擦部（指間・鼠径・乳房下・陰股部）に'
                     '浸軟した紅斑と衛星病巣を作る</span>ため、'
                     '頸部の環状に拡大する鱗屑性紅斑とは病像が異なる。'),
   ('b', '②', True, '<span class="kw3">太さの揃った菌糸が長く伸び、'
                     '規則的な隔壁でくびれて数珠状に見え、Y字型に分枝している</span>——'
                     '<span class="kw3">これが白癬菌〈皮膚糸状菌〉の分節菌糸で、'
                     '角層の鱗屑をKOHで溶かしたときに見える典型像</span>である。'
                     '<span class="kw3">頸部（体部）に3か月かけて痒みを伴いながら'
                     '遠心性に拡大する鱗屑性紅斑＝体部白癬〈生毛部白癬・たむし〉</span>で、'
                     '本例の臨床像と一致する。'),
   ('c', '③', False, '<span class="kw4">前方に短く太い脚が集まり、後方に細長い環状の腹部が伸びる'
                     '虫体が組織内に見えている</span>。'
                     '<span class="kw4">毛包虫〈ニキビダニ、Demodex folliculorum〉</span>で、'
                     '<span class="kw4">毛包内に常在するダニ</span>である。'
                     '<span class="kw4">酒皶様皮膚炎や毛包虫症で問題になるが、'
                     '角層の鱗屑をKOHで見て出てくるものではない</span>。'),
   ('d', '④', False, '<span class="kw4">厚い壁をもつ褐色の球形細胞が数個ずつ集簇し、'
                     '一部は内部に隔壁（十字）を認める</span>——'
                     '<span class="kw4">硬壁小体〈muriform cell、sclerotic body〉</span>で、'
                     '<span class="kw4">黒色真菌による深在性真菌症＝クロモミコーシス</span>の所見である。'
                     '<span class="kw4">外傷を契機に下肢などに疣状の局面を作る慢性疾患</span>で、'
                     '表在性の体部白癬とは別物である。'),
   ('e', '⑤', False, '<span class="kw4">円形の体に短い脚と剛毛をもつ虫体が見えている</span>——'
                     '<span class="kw4">ヒゼンダニ〈Sarcoptes scabiei〉すなわち疥癬</span>の所見である。'
                     '<span class="kw4">疥癬なら指間・手関節屈側・陰部に丘疹が多発し'
                     '夜間に激しい瘙痒を訴えるはず</span>で、'
                     '<span class="kw4">頸部に限局して環状に拡大する経過とは合わない</span>。')],
  '頸部に3か月かけて拡大する痒い鱗屑性紅斑＝体部白癬。KOHで見えるのは隔壁のある分節・分枝した菌糸（②）。',
  imgs=['images/111E-47_1.jpeg', 'images/111E-47_2.jpeg', 'images/111E-47_3.jpeg',
        'images/111E-47_4.jpeg', 'images/111E-47_5.jpeg', 'images/111E-47_6.jpeg'],
  patho=('🔬 KOH直接鏡検で「何が見えたら何か」を1枚に',
         '<span class="kw3">苛性カリ〈KOH〉直接鏡検法は、採取した鱗屑・毛・爪に'
         '20％KOH溶液を滴下してケラチンを溶解し、'
         '溶けずに残る菌要素や虫体を透見する検査</span>である。'
         '<span class="kw3">数分で結果が出て、外来でその場で治療方針が決まる</span>ため、'
         '皮膚科で最も使用頻度の高い検査の一つである。<br>'
         '<span class="kw3">見えるものと診断の対応は暗記事項である</span>——'
         '<span class="kw3">①太さの揃った隔壁のある分節・分枝菌糸＝白癬〈皮膚糸状菌〉。'
         '②仮性菌糸＋ブドウ房状の分芽胞子＝カンジダ。'
         '③短く湾曲した菌糸＋球形胞子の集塊（spaghetti and meatballs）＝癜風〈マラセチア〉。'
         '④厚壁で褐色・内部に隔壁のある球形細胞（硬壁小体）＝クロモミコーシス。'
         '⑤脚と剛毛のある円形の虫体・虫卵＝疥癬〈ヒゼンダニ〉</span>。<br>'
         '<span class="kw3">体部白癬〈tinea corporis〉の臨床像も定型的である</span>——'
         '<span class="kw3">中心部が治癒して色素沈着や正常化し、'
         '辺縁が堤防状に隆起して鱗屑・小水疱を伴いながら遠心性に拡大する'
         '（環状・多環状）</span>。'
         '<span class="kw3">瘙痒を伴い、数週〜数か月かけてゆっくり広がる</span>。'
         '<span class="kw4">ステロイド外用を先に行うと辺縁の隆起が消えて'
         '「湿疹に見える」異型白癬になるため、'
         '鱗屑のある環状紅斑はステロイドを塗る前にKOHを取るのが鉄則</span>である。'),
  deep=('📌 表在性真菌症の部位別呼称と治療',
        '<table class="tb"><tr><th>部位</th><th>呼称</th><th>治療</th></tr>'
        '<tr><td>体幹・四肢（生毛部）</td><td><span class="kw3">体部白癬（たむし・ぜにたむし）</span></td>'
        '<td><span class="kw3">抗真菌薬外用</span></td></tr>'
        '<tr><td>股部</td><td><span class="kw3">股部白癬（いんきんたむし）</span></td>'
        '<td><span class="kw3">抗真菌薬外用</span></td></tr>'
        '<tr><td>足</td><td>足白癬（みずむし）</td><td>抗真菌薬外用</td></tr>'
        '<tr><td><span class="kw3">爪</span></td><td><span class="kw3">爪白癬</span></td>'
        '<td><span class="kw3">内服（テルビナフィン・イトラコナゾール）または'
        'エフィナコナゾール等の爪外用液</span></td></tr>'
        '<tr><td><span class="kw3">頭部</span></td>'
        '<td><span class="kw3">頭部白癬・Celsus禿瘡</span></td>'
        '<td><span class="kw3">内服（毛内寄生のため外用は届かない）</span></td></tr>'
        '<tr><td>顔面</td><td>顔面白癬</td>'
        '<td>外用（ステロイドで異型化しやすい部位）</td></tr></table>'
        '<span class="kw3">「爪と頭は内服、それ以外は外用」</span>が原則である。'
        '<span class="kw4">正答率46％と低いのは、①②③の菌糸像を'
        '写真だけで見分ける訓練をしていないため</span>で、'
        '<span class="kw3">「白癬＝隔壁のある一様な太さの菌糸が分枝する」</span>という'
        '一点を写真で覚えておけば足りる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">白癬のKOH像＝隔壁でくびれた、太さの揃った分節・分枝菌糸</span>。<br>'
         '② <span class="kw3">カンジダ＝仮性菌糸＋ブドウ房状の分芽胞子</span>。<br>'
         '③ <span class="kw3">癜風＝短い菌糸＋球形胞子の集塊（spaghetti and meatballs）</span>。<br>'
         '④ <span class="kw3">疥癬＝脚のある虫体・虫卵</span>。<br>'
         '⑤ 体部白癬＝<span class="kw3">中心治癒＋辺縁隆起の環状紅斑</span>。'
         '<span class="kw4">ステロイドを塗る前にKOH</span>。')),

Q('103I-50', 75, [('bs', '★')],
  '53歳の男性。足趾の瘙痒感を主訴に来院した。'
  '<span class="kw">両側趾間部に鱗屑を伴う紅斑とびらん</span>とを認める。<br>'
  '<strong>診断のための手技で<span class="kw2">誤っている</span>のはどれか。</strong>',
  [('a', '採取した鱗屑をスライドガラスに載せる。', False,
                     '<span class="kw4">正しい</span>。'
                     '<span class="kw4">検体は鱗屑・水疱蓋・爪の混濁部など「菌がいる場所」から採る</span>。'
                     '<span class="kw4">足白癬では趾間の浸軟した鱗屑や、'
                     '小水疱型なら水疱蓋を鋏やメスで採取する</span>。'),
   ('b', '20％KOH溶液を滴下する。', False,
                     '<span class="kw4">正しい</span>。'
                     '<span class="kw4">KOHがケラチン（角質）を溶かして透明化し、'
                     'ケラチンを持たない菌要素だけが残って見えるようになる</span>。'
                     '<span class="kw4">濃度は10〜30％程度が用いられ、'
                     '爪など硬い検体には高濃度やDMSO添加を使う</span>。'),
   ('c', '墨汁を滴下する。', True,
                     '<span class="kw3">誤り＝これが正解</span>。'
                     '<span class="kw3">墨汁法〈India ink法〉は、髄液中のクリプトコッカスの'
                     '莢膜を「墨で染まらない抜けた輪」として観察する方法</span>であり、'
                     '<span class="kw3">白癬の直接鏡検には用いない</span>。'
                     '<span class="kw3">KOH標本を見やすくしたい場合に加えるのは'
                     'Parker inkやクロラゾールブラックE、'
                     '蛍光を用いるならcalcofluor white</span>である。'),
   ('d', 'カバーガラスをかぶせる。', False,
                     '<span class="kw4">正しい</span>。'
                     '<span class="kw4">カバーガラスをかけて軽く圧迫し、検体を薄く均一に広げる</span>。'
                     '<span class="kw4">気泡は菌糸と紛らわしいので押し出す</span>。'),
   ('e', 'ホットプレートで数分加温する。', False,
                     '<span class="kw4">正しい</span>。'
                     '<span class="kw4">加温するとKOHによる角質の溶解が促進され、'
                     '数分で観察可能になる</span>。'
                     '<span class="kw4">加温しない場合は室温で20〜30分放置する</span>。'
                     '<span class="kw4">加熱しすぎるとKOHが結晶化して観察を妨げる</span>。')],
  'KOH直接鏡検の手順は「採取→KOH滴下→カバーガラス→加温→鏡検」。墨汁法はクリプトコッカスの莢膜を見る別の検査。',
  patho=('🔬 KOH直接鏡検法の実際——手順と落とし穴',
         '<span class="kw3">KOH直接鏡検は、①検体採取 →②スライドガラスに載せる →'
         '③10〜30％KOH溶液を1〜2滴 →④カバーガラス →⑤加温または室温放置 →'
         '⑥鏡検（弱拡大で探し、強拡大で確認）</span>という手順で行う。'
         '<span class="kw3">結果は数分で出て、その場で抗真菌薬を始められる</span>。<br>'
         '<span class="kw3">検体採取の場所が最も重要である</span>——'
         '<span class="kw3">①趾間型足白癬：浸軟した鱗屑。'
         '②小水疱型：水疱蓋（水疱の屋根）に菌が多い。'
         '③角質増殖型：踵の厚い角質を削る。'
         '④爪白癬：混濁部と正常部の境界、爪の深部を削る。'
         '⑤頭部白癬：抜いた毛（毛内寄生を見る）</span>。'
         '<span class="kw4">病変の辺縁（活動性のある部位）から採ると陽性率が上がる</span>。<br>'
         '<span class="kw4">偽陰性の原因も問われる</span>——'
         '<span class="kw4">①抗真菌薬をすでに使っている、②採取部位が不適切、'
         '③検体量が少ない、④KOHの作用時間が足りない</span>。'
         '<span class="kw4">逆に偽陽性の原因は、モザイク菌〈mosaic fungus〉と呼ばれる'
         '細胞境界に沿ったコレステリン析出、繊維、気泡</span>である。'
         '<span class="kw4">モザイク菌は細胞の輪郭をなぞる網目状で、'
         '真の菌糸のように細胞境界を横切らない</span>ことで区別する。<br>'
         '<span class="kw3">なお足白癬の趾間びらん型は、二次的な細菌感染から'
         '蜂窩織炎・丹毒の侵入門戸になる</span>。'
         '<span class="kw3">下腿の丹毒を繰り返す患者では足白癬を必ず確認・治療する</span>。'),
  deep=('📌 「特殊染色・特殊検査は何を見るためのものか」',
        '<table class="tb"><tr><th>検査</th><th>対象</th><th>見えるもの</th></tr>'
        '<tr><td><span class="kw3">KOH直接鏡検</span></td>'
        '<td><span class="kw3">鱗屑・毛・爪</span></td>'
        '<td><span class="kw3">白癬菌・カンジダ・マラセチア・ヒゼンダニ</span></td></tr>'
        '<tr><td><span class="kw4">墨汁法〈India ink〉</span></td>'
        '<td><span class="kw4">髄液</span></td>'
        '<td><span class="kw4">クリプトコッカスの莢膜（黒い背景に抜けた輪）</span></td></tr>'
        '<tr><td>Tzanck試験</td><td>水疱底の擦過物</td>'
        '<td><span class="kw3">ウイルス性巨細胞・棘融解細胞（ヘルペス／天疱瘡）</span></td></tr>'
        '<tr><td><span class="kw3">Ziehl-Neelsen染色</span></td><td>膿・滲出液・組織</td>'
        '<td><span class="kw3">抗酸菌（赤い桿菌）</span></td></tr>'
        '<tr><td>Gram染色</td><td>膿・分泌物</td><td>細菌のGram陽性／陰性と形態</td></tr>'
        '<tr><td>Wood灯</td><td>頭部・体表</td>'
        '<td><span class="kw4">M. canis＝黄緑色蛍光、紅色陰癬＝サンゴ色、'
        '尋常性白斑＝白色増強</span></td></tr>'
        '<tr><td>ダーモスコピー</td><td>色素性病変・脱毛・疥癬</td>'
        '<td>色素ネットワーク、疥癬トンネル先端の三角形の影</td></tr></table>'
        '<span class="kw3">否定形（誤っているのはどれか）の問題は、'
        '「他の疾患用の検査が1つ紛れ込んでいる」形が定番</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">KOH直接鏡検＝角質を溶かして菌要素を見る。数分で結果</span>。<br>'
         '② 手順は<span class="kw3">採取→KOH滴下→カバーガラス→加温→鏡検</span>。<br>'
         '③ <span class="kw3">墨汁法はクリプトコッカスの莢膜用</span>で白癬には使わない。<br>'
         '④ <span class="kw4">偽陽性の代表はモザイク菌（コレステリン析出）</span>。<br>'
         '⑤ <span class="kw3">足白癬は丹毒・蜂窩織炎の侵入門戸</span>——'
         '<span class="kw">Q.191</span>・<span class="kw">Q.207</span>と繋げて覚える。')),

Q('101F-12', 36, [('bs', '★')],
  '<strong>細菌の<span class="kw">外毒素</span>が起こす皮膚病変はどれか。'
  '<span class="kw2">2つ選べ</span>。</strong>',
  [('a', '丹　毒', False, '<span class="kw4">丹毒はA群β溶連菌が真皮浅層とリンパ管に'
                     '「菌そのものが侵入・増殖」して起こす化膿性炎</span>である。'
                     '<span class="kw4">病変部から菌が検出される＝毒素が離れた場所で作用する病態ではない</span>。'
                     '<span class="kw4">なお同じ溶連菌でも、発赤毒（発熱毒素）が全身に回る猩紅熱は'
                     '毒素性である</span>——菌が同じでも病態で分ける。'),
   ('b', '瘭　疽', False, '<span class="kw4">瘭疽〈ひょう疽〉は指趾末節・爪周囲への'
                     '黄色ブドウ球菌などの直接感染による化膿性炎</span>である。'
                     '<span class="kw4">局所で菌が増殖して膿瘍を作る典型的な起炎菌感染</span>で、'
                     '毒素性ではない。'),
   ('c', '伝染性膿痂疹', True, '<span class="kw3">水疱性膿痂疹は、黄色ブドウ球菌が産生する'
                     '表皮剝脱毒素〈exfoliative toxin: ET〉がデスモグレイン1〈Dsg1〉を'
                     '分解して顆粒層に水疱を作る</span>——'
                     '<span class="kw3">水疱そのものは毒素による表皮細胞接着の破壊であり、'
                     '外毒素が起こす皮膚病変</span>である。'
                     '<span class="kw3">SSSSと同じ毒素が「局所で」働いた形</span>と理解するとよい。'),
   ('d', '蜂巣炎〈蜂窩織炎〉', False, '<span class="kw4">蜂窩織炎は真皮深層〜皮下脂肪織に'
                     '菌が侵入・増殖して起こす化膿性炎</span>である。'
                     '<span class="kw4">病巣に菌が存在する感染症であり、毒素性ではない</span>。'),
   ('e', 'ブドウ球菌性熱傷様皮膚症候群', True,
                     '<span class="kw3">SSSSは、鼻腔・咽頭などの巣で増えた黄色ブドウ球菌が'
                     '産生した表皮剝脱毒素が血行性に全身の表皮へ到達し、'
                     'Dsg1を分解して広範な表皮剝離を起こす</span>。'
                     '<span class="kw3">皮疹部そのものには菌がいない（培養陰性）</span>という点で、'
                     '<span class="kw3">「外毒素が起こす皮膚病変」の最も純粋な例</span>である。')],
  '菌が病巣にいる化膿性炎（丹毒・瘭疽・蜂窩織炎）と、毒素が表皮を壊す病態（伝染性膿痂疹・SSSS）を分ける。',
  patho=('🦠 毒素性か、菌の侵入か——皮膚感染症のもう一つの軸',
         '<span class="kw3">細菌性皮膚疾患は「どの層に菌がいるか」だけでなく、'
         '「病変を作っているのは菌本体か、菌が出した毒素か」でも整理できる</span>。'
         '<span class="kw3">この軸は治療方針（抗菌薬だけでよいか、毒素産生の抑制や'
         '支持療法が要るか）に直結する</span>。<br>'
         '<span class="kw3">【菌の侵入・増殖による病変】</span>'
         '<span class="kw3">丹毒、蜂窩織炎、せつ・癰、瘭疽、毛包炎</span>——'
         '<span class="kw3">病巣に菌がいるので、膿や組織の培養で起炎菌が検出される。'
         '治療は抗菌薬（＋必要なら切開排膿）</span>。<br>'
         '<span class="kw3">【外毒素による病変】</span>'
         '<span class="kw3">①SSSS：表皮剝脱毒素〈ET〉→Dsg1分解→顆粒層で剝離。皮疹部は培養陰性。'
         '②水疱性膿痂疹：同じETが局所で働いた形。'
         '③毒素性ショック症候群〈TSS〉：TSST-1などがスーパー抗原として働き、'
         '発熱・低血圧・びまん性紅斑・回復期の落屑。'
         '④猩紅熱：A群β溶連菌の発赤毒（発熱毒素）による全身の点状紅斑・苺舌・口囲蒼白</span>。<br>'
         '<span class="kw4">スーパー抗原はMHCクラスⅡとT細胞受容体Vβ鎖を'
         '抗原提示を介さずに架橋し、T細胞を大量に非特異的に活性化する</span>。'
         '<span class="kw4">これがTSSや猩紅熱で「全身が一斉に赤くなる」機序である</span>。'),
  deep=('📌 表皮剝脱毒素〈ET〉が起こす2疾患の対比',
        '<table class="tb"><tr><th>項目</th><th>水疱性膿痂疹</th><th>SSSS</th></tr>'
        '<tr><td>毒素の作用範囲</td><td><span class="kw3">局所（菌のいる場所）</span></td>'
        '<td><span class="kw3">全身（血行性に播種）</span></td></tr>'
        '<tr><td>皮疹部の菌</td><td><span class="kw3">いる（培養陽性）</span></td>'
        '<td><span class="kw3">いない（培養陰性）</span></td></tr>'
        '<tr><td>皮疹</td><td>限局した弛緩性水疱・びらん・薄い痂皮</td>'
        '<td><span class="kw3">全身のびまん性紅斑＋広範なびらん（熱傷様）</span></td></tr>'
        '<tr><td>全身症状</td><td>乏しい</td>'
        '<td><span class="kw3">発熱・不機嫌・接触痛</span></td></tr>'
        '<tr><td>裂隙の高さ</td><td colspan="2"><span class="kw3">いずれも顆粒層（Dsg1が分解される高さ）</span></td></tr>'
        '<tr><td>治療</td><td>抗菌薬（外用±内服）</td>'
        '<td><span class="kw3">抗菌薬全身投与＋熱傷に準じた支持療法</span></td></tr></table>'
        '<span class="kw3">「同じ毒素・同じ裂隙の高さで、局所か全身かの違い」</span>と'
        '押さえると2疾患が1つに繋がる。'
        '<span class="kw4">正答率36％と低いのは「丹毒＝溶連菌＝毒素」と'
        '短絡してしまうためで、丹毒は菌が真皮に侵入する化膿性炎である</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">外毒素性＝伝染性膿痂疹（水疱性）とSSSS</span>。'
         'いずれも<span class="kw3">表皮剝脱毒素→Dsg1分解→顆粒層で剝離</span>。<br>'
         '② <span class="kw4">丹毒・蜂窩織炎・瘭疽は菌が侵入する化膿性炎</span>。<br>'
         '③ <span class="kw3">SSSSは皮疹部の培養が陰性</span>（巣は鼻腔・咽頭）。<br>'
         '④ 他の毒素性疾患：<span class="kw3">TSS（TSST-1）・猩紅熱（発赤毒）</span>。<br>'
         '⑤ <span class="kw3">スーパー抗原はT細胞を非特異的に大量活性化する</span>。')),

]

QUESTIONS += [

Q('99F-25', None, [('bs', '★'), ('bi', '📷')],
  '60歳の女性。指間の皮疹を主訴に来院した。'
  '<span class="kw">関節リウマチで3年前から内服薬治療</span>を受けている。'
  '<span class="kw">最近、指間に痒みのある皮疹</span>を生じ、'
  '<span class="kw">市販の副腎皮質ステロイドを塗布したが、無効</span>であった。'
  '指間部の写真を示す。<br>'
  '<strong>まず行う検査はどれか。</strong>',
  [('a', '細菌培養', False, '<span class="kw4">指間の細菌感染（趾間・指間の膿皮症）もあり得る</span>が、'
                     '<span class="kw4">本例は発赤・熱感・圧痛・排膿といった化膿性炎の所見が記載されておらず、'
                     '「痒み」が主症状</span>である。'
                     '<span class="kw4">まず行う検査としては真菌の検索が優先する</span>。'),
   ('b', '皮膚生検', False, '<span class="kw4">皮膚生検は侵襲があり結果も数日を要する</span>。'
                     '<span class="kw4">KOH直接鏡検という無侵襲・数分で結果の出る検査があるのに、'
                     'それを飛ばして生検に進むのは順序が逆</span>である。'
                     '<span class="kw4">生検は真菌が否定され、なお診断がつかないときの次の手</span>。'),
   ('c', '外用薬の貼付試験', False, '<span class="kw4">貼付試験〈パッチテスト〉は'
                     'アレルギー性接触皮膚炎（Ⅳ型）を疑うときの検査</span>である。'
                     '<span class="kw4">ステロイド外用が無効という経過は接触皮膚炎らしくない</span>（多くは奏効する）。'
                     '<span class="kw4">またパッチテストは48・72時間後の判定が必要で、'
                     '「まず行う検査」には適さない</span>。'),
   ('d', 'KOH法による直接鏡検', True,
                     '<span class="kw3">①関節リウマチでの内服治療（＝ステロイドや免疫抑制薬による易感染状態）、'
                     '②指間という間擦部（湿潤・浸軟しやすい）、'
                     '③痒みを伴う皮疹、④ステロイド外用が無効（むしろ真菌は増える）</span>——'
                     '<span class="kw3">カンジダ性指間びらん症〈interdigital candidiasis, erosio interdigitalis blastomycetica〉</span>を'
                     'まず疑う。'
                     '<span class="kw3">KOH直接鏡検は数分で結果が出て、'
                     '仮性菌糸と分芽胞子を確認できればその場で抗真菌薬に切り替えられる</span>。'
                     '<span class="kw3">「鱗屑・びらんのある皮疹はステロイドを塗る前にKOH」</span>が原則である。'),
   ('e', '内服薬のリンパ球刺激試験', False,
                     '<span class="kw4">薬剤リンパ球刺激試験〈DLST〉は薬疹を疑うときに'
                     '被疑薬に対するリンパ球の反応を見る検査</span>である。'
                     '<span class="kw4">薬疹なら全身性の皮疹となるのが普通で、'
                     '指間だけに限局する皮疹は薬疹らしくない</span>。'
                     '<span class="kw4">感度・特異度とも高くなく、まず行う検査にはならない</span>。')],
  '易感染宿主＋間擦部の痒い皮疹＋ステロイド無効＝カンジダ性指間びらん症。無侵襲・即答のKOH直接鏡検が第一。',
  imgs=['images/99F-25_1.jpeg'],
  patho=('🍄 皮膚カンジダ症——「湿った折り目」に出る日和見感染',
         '<span class="kw3">カンジダ〈Candida albicans〉は口腔・消化管・腟の常在真菌</span>であり、'
         '<span class="kw3">病原性を発揮するには宿主側・局所環境側の条件が要る</span>。'
         '<span class="kw3">①局所因子：高温多湿・浸軟・摩擦（間擦部、水仕事、おむつ）。'
         '②宿主因子：糖尿病、ステロイド・免疫抑制薬・抗癌薬、'
         '広域抗菌薬による菌交代、悪性腫瘍、乳幼児・高齢者</span>。'
         '<span class="kw3">本例は関節リウマチの内服治療という宿主因子と、'
         '指間という局所因子の両方を持っている</span>。<br>'
         '<span class="kw3">皮膚カンジダ症の病型</span>は'
         '<span class="kw3">①カンジダ性間擦疹（鼠径・腋窩・乳房下・臀裂）、'
         '②指間びらん症（とくに中指・環指間。水仕事の主婦に多い）、'
         '③カンジダ性爪囲炎・爪炎、④乳児寄生菌性紅斑（おむつ部）、'
         '⑤口腔カンジダ症（鵞口瘡）、⑥外陰腟カンジダ症</span>。<br>'
         '<span class="kw3">臨床的特徴は「浸軟した境界明瞭な紅斑・びらんと、'
         'その周囲に散在する小膿疱・鱗屑＝衛星病巣〈satellite lesion〉」</span>である。'
         '<span class="kw3">衛星病巣はカンジダに特徴的で、'
         '境界が明瞭で衛星病巣のない股部白癬との鑑別点</span>になる。<br>'
         '<span class="kw3">診断はKOH直接鏡検で仮性菌糸＋分芽胞子を証明する</span>。'
         '<span class="kw3">治療はイミダゾール系抗真菌薬の外用と、'
         '乾燥を保つ環境調整（拭いて乾かす、通気）</span>。'
         '<span class="kw4">テルビナフィンは白癬には強いがカンジダには効きにくい</span>ため、'
         '<span class="kw4">カンジダにはイミダゾール系を選ぶ</span>。'),
  deep=('📌 間擦部（皮膚の折り目）の紅斑の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>境界・辺縁</th><th>決め手</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">カンジダ症</span></td>'
        '<td><span class="kw3">浸軟した紅斑＋周囲に衛星病巣</span></td>'
        '<td><span class="kw3">KOHで仮性菌糸＋分芽胞子</span></td>'
        '<td><span class="kw3">イミダゾール系外用</span></td></tr>'
        '<tr><td><span class="kw3">股部白癬</span></td>'
        '<td><span class="kw3">辺縁が堤防状に隆起・中心治癒。衛星病巣なし</span></td>'
        '<td><span class="kw3">KOHで分節菌糸</span></td>'
        '<td>抗真菌薬外用</td></tr>'
        '<tr><td>紅色陰癬</td><td>褐色調の平坦な斑</td>'
        '<td><span class="kw4">Wood灯でサンゴ色蛍光（Corynebacterium minutissimum）</span></td>'
        '<td>抗菌薬外用</td></tr>'
        '<tr><td>間擦疹（機械的）</td><td>接触する面に一致</td><td>肥満・多汗が背景。KOH陰性</td>'
        '<td>乾燥保持・亜鉛華</td></tr>'
        '<tr><td><span class="kw4">乳房外Paget病</span></td>'
        '<td><span class="kw4">境界明瞭な湿潤性紅斑。難治</span></td>'
        '<td><span class="kw4">生検（表皮内のPaget細胞）</span></td>'
        '<td><span class="kw4">広範切除</span></td></tr></table>'
        '<span class="kw4">「陰部の治らない湿疹」でKOH陰性・ステロイド無効が続くときは、'
        '乳房外Paget病を疑って生検する</span>——'
        '<span class="kw4">これが間擦部病変で最も見落としてはいけない疾患である</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">間擦部＋易感染宿主＋ステロイド無効＝カンジダを疑う</span>。<br>'
         '② <span class="kw3">まず行う検査はKOH直接鏡検（無侵襲・数分）</span>。<br>'
         '③ <span class="kw3">カンジダは衛星病巣、股部白癬は辺縁隆起＋中心治癒</span>。<br>'
         '④ <span class="kw4">テルビナフィンはカンジダに効きにくい→イミダゾール系</span>。<br>'
         '⑤ <span class="kw4">難治例では乳房外Paget病を鑑別に入れる</span>。')),

Q('95C-50', None, [('bs', '★'), ('bi', '📷')],
  '5歳の男児。<span class="kw">1年前から、手背に皮疹</span>が出現した。'
  '<span class="kw">放置したところ、肘頭と膝蓋とにも拡大</span>してきたので来院した。'
  '右手背の写真を示す。<br>'
  '<strong>適切な治療はどれか。</strong>',
  [('a', '酸素療法', False, '<span class="kw4">酸素療法は低酸素血症に対する治療</span>で、'
                     '皮膚の疣贅とは無関係である。'),
   ('b', '凍結療法', True, '<span class="kw3">①小児、②手背・肘頭・膝蓋という'
                     '「よくぶつける部位」に、③1年かけて多発、'
                     '④写真では表面が粗糙で角化した常色〜灰白色のドーム状小結節</span>——'
                     '<span class="kw3">尋常性疣贅〈verruca vulgaris、いぼ〉</span>である。'
                     '<span class="kw3">ヒト乳頭腫ウイルス〈HPV〉2型・27型・57型などが'
                     '微小な傷から表皮基底細胞に感染して生じる</span>。'
                     '<span class="kw3">治療の第一選択は液体窒素による凍結療法'
                     '〈cryotherapy〉で、1〜2週ごとに繰り返す</span>。'),
   ('c', '温熱療法', False, '<span class="kw4">温熱療法はスポロトリコーシスの補助療法や'
                     '一部の腫瘍治療で用いられる</span>が、'
                     '<span class="kw4">尋常性疣贅の標準治療ではない</span>。'),
   ('d', 'PUVA療法', False, '<span class="kw4">PUVA療法（ソラレン＋長波長紫外線）は'
                     '乾癬・尋常性白斑・菌状息肉症などに用いる光線療法</span>である。'
                     '<span class="kw4">ウイルス性の疣贅には無効で、'
                     'むしろ紫外線による免疫抑制は不利に働く</span>。'
                     '<span class="kw4">小児にPUVAを行うこと自体、長期発癌リスクの点で避けられる</span>。'),
   ('e', '減感作療法', False, '<span class="kw4">減感作療法〈アレルゲン免疫療法〉は'
                     'アレルギー性鼻炎やハチ毒アナフィラキシーなどⅠ型アレルギーに行う</span>。'
                     '<span class="kw4">疣贅はアレルギー疾患ではない</span>。')],
  '小児のぶつけやすい部位に1年かけて多発する角化性小結節＝尋常性疣贅（HPV）。第一選択は液体窒素凍結療法。',
  imgs=['images/95C-50_1.jpeg'],
  patho=('🦠 尋常性疣贅——HPVが基底細胞に入り、角化を暴走させる',
         '<span class="kw3">尋常性疣贅は、ヒト乳頭腫ウイルス〈human papillomavirus: HPV〉が'
         '微小な外傷部から表皮基底細胞に感染し、表皮の増殖と過角化を起こしたもの</span>である。'
         '<span class="kw3">HPV 2・27・57型が主体</span>で、'
         '<span class="kw3">手指・手背・足底・肘・膝など「外傷を受けやすい部位」に好発</span>する。'
         '<span class="kw3">掻破や外傷に沿って新病変が線状に並ぶことがあり、'
         'これをKöbner現象〈同形反応〉</span>と呼ぶ——'
         '<span class="kw3">本例が手背から肘頭・膝蓋へ拡大したのも自家接種による</span>。<br>'
         '<span class="kw3">臨床像は表面が粗糙で灰白色〜常色の角化性丘疹・小結節</span>。'
         '<span class="kw3">削ると点状の黒色点（血栓化した拡張毛細血管）が見える</span>のが'
         '<span class="kw3">診断的で、鶏眼〈うおのめ〉・胼胝〈たこ〉との鑑別点</span>になる。'
         '<span class="kw4">鶏眼は圧痛が強く中心に硬い芯があり、削っても黒色点は出ない</span>。<br>'
         '<span class="kw3">治療の第一選択は液体窒素による凍結療法</span>で、'
         '<span class="kw3">−196℃の液体窒素を綿棒やスプレーで当て、'
         '感染表皮を凍結壊死させると同時に局所免疫を賦活する</span>。'
         '<span class="kw3">1〜2週間隔で数回〜十数回繰り返す</span>。'
         '<span class="kw4">その他にサリチル酸絆創膏（角質軟化）、'
         'モノクロロ酢酸、活性型ビタミンD3外用、'
         '難治例に局所免疫療法（SADBE・DPCP）やブレオマイシン局注</span>がある。'
         '<span class="kw4">小児では自然消退もあるため、'
         '疼痛や整容の問題が小さければ経過観察も選択肢になる</span>。'),
  deep=('📌 「いぼ」と紛らわしいもの',
        '<table class="tb"><tr><th>疾患</th><th>原因</th><th>特徴</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">尋常性疣贅</span></td>'
        '<td><span class="kw3">HPV 2・27・57型</span></td>'
        '<td><span class="kw3">粗糙な角化性丘疹。削ると点状出血（黒色点）</span></td>'
        '<td><span class="kw3">液体窒素凍結療法</span></td></tr>'
        '<tr><td>足底疣贅</td><td>HPV 1型など</td>'
        '<td>足底で扁平化。圧痛は側方圧迫で強い</td><td>凍結療法</td></tr>'
        '<tr><td>青年性扁平疣贅</td><td>HPV 3・10型</td>'
        '<td>若年女性の顔面に扁平な小丘疹が多発。Köbner現象</td>'
        '<td>ビタミンD3外用・自然消退あり</td></tr>'
        '<tr><td><span class="kw3">伝染性軟属腫〈水いぼ〉</span></td>'
        '<td><span class="kw3">伝染性軟属腫ウイルス（ポックスウイルス科）</span></td>'
        '<td><span class="kw3">中心臍窩をもつ光沢のあるドーム状丘疹。粥状物を排出</span></td>'
        '<td>ピンセット摘除・自然消退</td></tr>'
        '<tr><td>尖圭コンジローマ</td><td>HPV 6・11型</td>'
        '<td>陰部の乳頭状・鶏冠状腫瘤。性感染症</td>'
        '<td>イミキモド外用・凍結・切除</td></tr>'
        '<tr><td><span class="kw4">鶏眼〈うおのめ〉</span></td>'
        '<td><span class="kw4">機械的圧迫（非感染）</span></td>'
        '<td><span class="kw4">中心に硬い芯。垂直圧で激痛。黒色点は出ない</span></td>'
        '<td>除圧・角質除去</td></tr></table>'
        '<span class="kw3">削って黒色点が出るか</span>——'
        '<span class="kw3">これが疣贅と鶏眼・胼胝を分ける最も実用的な所見</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">尋常性疣贅＝HPV感染。治療の第一選択は液体窒素凍結療法</span>。<br>'
         '② <span class="kw3">削ると点状の黒色点（血栓化した毛細血管）</span>。<br>'
         '③ <span class="kw3">自家接種・Köbner現象で拡大する</span>。<br>'
         '④ <span class="kw4">水いぼ（伝染性軟属腫）は中心臍窩をもつポックスウイルス感染</span>。<br>'
         '⑤ <span class="kw4">鶏眼は非感染で中心に芯があり黒色点は出ない</span>。')),

Q('91B-96', None, [('bs', '★'), ('bi', '📷')],
  '23歳の男性。'
  '<span class="kw">6月下旬から体幹に皮疹が出現し、次第に拡大</span>してきたため8月に来院した。'
  '<span class="kw">自覚症状はない</span>。皮膚写真を示す。<br>'
  '<strong>適切な外用薬はどれか。</strong>',
  [('a', '抗真菌薬', True, '<span class="kw3">①高温多湿の季節（6月下旬〜8月）に出現・拡大、'
                     '②若年男性の体幹（前胸部・背部・上腕という皮脂の多い部位）、'
                     '③自覚症状に乏しい、④写真では境界のやや不明瞭な'
                     '淡褐色〜色素脱失斑が融合して地図状に広がり、'
                     '細かい粃糠様鱗屑を伴う</span>——'
                     '<span class="kw3">癜風〈でんぷう、tinea versicolor〉</span>である。'
                     '<span class="kw3">常在真菌マラセチア〈Malassezia furfur〉が'
                     '皮脂を栄養に角層で増殖したもの</span>で、'
                     '<span class="kw3">治療はイミダゾール系抗真菌薬の外用</span>である。'),
   ('b', '抗ウイルス薬', False, '<span class="kw4">ウイルス性発疹症（帯状疱疹・単純疱疹）は'
                     '水疱を形成し疼痛を伴う</span>のが普通である。'
                     '<span class="kw4">2か月かけて無症候の色調変化が拡大する経過はウイルス性ではない</span>。'),
   ('c', '抗ヒスタミン薬', False, '<span class="kw4">抗ヒスタミン外用薬は瘙痒に対する対症療法</span>である。'
                     '<span class="kw4">本例は「自覚症状はない」と明記されており、'
                     '痒みを抑える薬を使う理由がない</span>。'
                     '<span class="kw4">そもそも原因（真菌）を放置すれば病変は拡大し続ける</span>。'),
   ('d', '非ステロイド性抗炎症薬', False,
                     '<span class="kw4">NSAIDs外用薬は消炎鎮痛が目的</span>で、'
                     '<span class="kw4">疼痛も炎症所見も乏しい本例には適応がない</span>。'
                     '<span class="kw4">かえって接触皮膚炎（光接触皮膚炎を含む）の原因になり得る</span>。'),
   ('e', '副腎皮質ステロイド', False,
                     '<span class="kw4">ステロイド外用は局所免疫を抑制するため、'
                     '真菌感染をむしろ増悪させる</span>。'
                     '<span class="kw4">癜風・白癬・カンジダにステロイドを塗ると'
                     '一時的に紅斑が薄れて「効いたように見える」が、'
                     '菌は増殖し病変は拡大する（異型白癬と同じ機序）</span>。'
                     '<span class="kw4">鱗屑を伴う病変にステロイドを塗る前にKOHを取る</span>のが原則である。')],
  '夏季に若年男性の体幹へ無症候性に広がる粃糠様鱗屑を伴う色調変化＝癜風（マラセチア）。抗真菌薬を外用する。',
  imgs=['images/91B-96_1.jpeg'],
  patho=('🍄 癜風——常在マラセチアが皮脂で増える「痒くない真菌症」',
         '<span class="kw3">癜風は、皮膚常在真菌である Malassezia（旧称 Pityrosporum）が'
         '角層で過剰増殖して生じる表在性真菌症</span>である。'
         '<span class="kw3">マラセチアは脂質要求性（脂質がないと発育できない）</span>のため、'
         '<span class="kw3">皮脂腺の多い前胸部・背部・頸部・上腕に限局</span>する。'
         '<span class="kw3">高温多湿・発汗・皮脂分泌の多い夏季に、'
         '若年〜中年の男性に好発</span>する——'
         '<span class="kw3">本例の「6月下旬に出現し8月に受診」という季節性はきわめて典型的</span>である。<br>'
         '<span class="kw3">皮疹は境界のやや不明瞭な淡褐色斑（黒色癜風）と'
         '色素脱失斑（白色癜風）が混在し、地図状に融合する</span>。'
         '<span class="kw3">表面を軽く擦ると細かい粃糠様〈ふすま様〉鱗屑が出る</span>のが特徴で、'
         '<span class="kw3">自覚症状はないか軽度の瘙痒にとどまる</span>。'
         '<span class="kw4">脱色素を来す機序は、マラセチアが産生するアゼライン酸が'
         'チロシナーゼを阻害してメラニン合成を抑制するため</span>とされ、'
         '<span class="kw4">治療後も色素脱失は数か月残る</span>（＝「治っていない」と'
         '患者が誤解しやすい点を説明しておく）。<br>'
         '<span class="kw3">診断はKOH直接鏡検で、短く湾曲した菌糸と'
         '球形胞子の集塊が混在する像（spaghetti and meatballs）</span>を見る。'
         '<span class="kw4">Wood灯で黄金色〜黄緑色の蛍光を発することがある</span>。'
         '<span class="kw3">治療はイミダゾール系抗真菌薬（ケトコナゾール等）の外用</span>で、'
         '<span class="kw4">広範例・再発例には抗真菌薬内服（イトラコナゾール）を用いる</span>。'
         '<span class="kw4">常在菌が原因なので再発しやすく、夏季の予防的洗浄が勧められる</span>。'),
  deep=('📌 マラセチアが関わる疾患と、脱色素斑の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>特徴</th></tr>'
        '<tr><td><span class="kw3">癜　風</span></td>'
        '<td><span class="kw3">体幹の淡褐色斑・脱色素斑＋粃糠様鱗屑。無症候。夏季。KOHで菌糸＋胞子集塊</span></td></tr>'
        '<tr><td>マラセチア毛包炎</td>'
        '<td><span class="kw4">体幹・上腕の毛包一致性の丘疹・膿疱。痤瘡と紛らわしいが面皰がない</span></td></tr>'
        '<tr><td>脂漏性皮膚炎</td>'
        '<td>頭部・眉間・鼻唇溝の紅斑と黄色調の鱗屑。マラセチアが増悪因子</td></tr>'
        '<tr><td><span class="kw4">尋常性白斑</span></td>'
        '<td><span class="kw4">完全な脱色素斑（乳白色）。鱗屑なし。Wood灯で境界が鮮明化。'
        'メラノサイトが消失（自己免疫）</span></td></tr>'
        '<tr><td>単純性粃糠疹〈はたけ〉</td>'
        '<td>小児の顔面の淡い脱色素斑＋細かい鱗屑。乾燥・日焼けで目立つ。自然軽快</td></tr>'
        '<tr><td>炎症後色素脱失</td><td>先行する炎症（湿疹・乾癬）の部位に一致</td></tr></table>'
        '<span class="kw3">癜風と尋常性白斑を分けるのは「鱗屑があるか」と「色が完全に抜けているか」</span>。'
        '<span class="kw3">癜風は角層に菌がいるので鱗屑があり、KOHで診断が確定する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">癜風＝マラセチア（脂質要求性）。皮脂の多い体幹に夏季好発</span>。<br>'
         '② <span class="kw3">褐色斑と脱色素斑が混在＋粃糠様鱗屑。自覚症状に乏しい</span>。<br>'
         '③ <span class="kw3">KOHで短い菌糸＋球形胞子集塊（spaghetti and meatballs）</span>。<br>'
         '④ <span class="kw3">治療はイミダゾール系抗真菌薬外用</span>。'
         '<span class="kw4">ステロイドは禁物</span>。<br>'
         '⑤ <span class="kw4">色素脱失は治癒後も数か月残る</span>。'
         '<span class="kw">Q.194</span>・<span class="kw">Q.219</span>でも癜風が問われる。')),

]

# ============================================================
# B問題 NO.206-222
# ============================================================
QUESTIONS += [

Q('112A-38', 84, [('bi', '📷')],
  '46歳の男性。全身の痒みを伴う皮疹を主訴に来院した。'
  '<span class="kw">3か月前から大腿、陰部および手に痒みを伴う皮疹</span>が出現した。'
  '<span class="kw">自宅近くの診療所で抗ヒスタミン薬と副腎皮質ステロイド外用薬とを処方されたが効果はなく</span>、'
  '皮疹が徐々に拡大してきたため受診した。'
  '<span class="kw">高齢者施設の介護職員</span>。'
  '受診時、<span class="kw">陰部を含む全身に鱗屑を伴う丘疹が多発</span>していた。'
  '陰部と手背の写真（A，B）及び手掌のダーモスコピー像（C）を示す。<br>'
  '<strong>対応として適切なのはどれか。</strong>',
  [('a', '保健所に届け出る。', False, '<span class="kw4">疥癬は感染症法上の届出対象疾患ではない</span>。'
                     '<span class="kw4">保健所への届出義務はなく、'
                     '集団発生時に施設が保健所へ相談・報告することはあっても'
                     '医師の法的届出とは別</span>である。'),
   ('b', '衣類を煮沸消毒する。', False, '<span class="kw4">ヒゼンダニはヒトの体表を離れると'
                     '数時間〜長くても数日で死滅し、乾燥と50℃10分の加熱に弱い</span>。'
                     '<span class="kw4">通常疥癬では日常的な洗濯・乾燥で十分</span>であり、'
                     '<span class="kw4">煮沸消毒までは不要</span>である。'
                     '<span class="kw4">角化型疥癬では50℃以上10分の熱処理や'
                     'ビニール袋密閉が推奨されるが、本例は通常疥癬</span>。'),
   ('c', '個室管理の上で治療を開始する。', False,
                     '<span class="kw3">個室隔離が必要なのは角化型（ノルウェー）疥癬だけ</span>である。'
                     '<span class="kw4">通常疥癬は寄生虫数が数十匹と少なく、'
                     '長時間の直接接触がなければ伝播しない</span>ため、'
                     '<span class="kw4">個室管理は不要</span>である。'
                     '<span class="kw4">本例は鱗屑を伴う丘疹の多発であって、'
                     '牡蠣殻状の厚い角質増殖はない</span>。'),
   ('d', '皮疹が完全に治癒するまでは就業を禁止する。', False,
                     '<span class="kw4">治療を開始すれば感染力は速やかに低下する</span>。'
                     '<span class="kw4">疥癬の皮疹（とくに疥癬結節や瘙痒）は'
                     '虫体が死滅した後も数週間〜数か月残ることがあり'
                     '（治療後瘙痒症）、これを待って就業禁止にするのは過剰</span>である。'
                     '<span class="kw4">法的な就業制限の対象疾患でもない</span>。'),
   ('e', '勤務先の施設の職員と入居者に問診と診察を行う。', True,
                     '<span class="kw3">本例は高齢者施設の介護職員で、'
                     '3か月前から皮疹があり、ステロイド外用で改善しないまま拡大している</span>。'
                     '<span class="kw3">すなわち感染源（施設内の未診断例）と'
                     '感染拡大先（職員・入居者）が同時に存在する可能性が高い</span>。'
                     '<span class="kw3">疥癬対策の要は「集団としてとらえて接触者を洗い出し、'
                     '同時期に一斉治療する」こと</span>である。'
                     '<span class="kw3">1人ずつ順に治療すると未治療者から再感染し、'
                     '施設内で無限に循環する</span>。'),
  ],
  '疥癬は届出不要・個室不要・就業禁止不要。介護施設職員の疥癬では接触者（職員・入居者）の一斉調査が最優先。',
  imgs=['images/112A-38_1.jpeg', 'images/112A-38_2.jpeg', 'images/112A-38_3.jpeg'],
  patho=('🦠 施設内疥癬——「1人の患者」ではなく「集団」として扱う',
         '<span class="kw3">疥癬が国試で繰り返し問われるのは、'
         '個人の治療より集団への対応が問われる感染症だから</span>である。'
         '<span class="kw3">高齢者施設・療養病床では、'
         '①瘙痒を訴えられない入居者がいる、'
         '②湿疹・皮脂欠乏性湿疹と誤診されステロイドが漫然と使われる、'
         '③介護は長時間の身体接触を伴う——という3条件が揃い、'
         '発見が遅れて集団発生に至る</span>。<br>'
         '<span class="kw3">対応の原則は次の通り</span>——'
         '<span class="kw3">①診断が付いたら、その人だけでなく'
         '「同室者・介護者・家族」を接触者として洗い出す。'
         '②接触者に問診（瘙痒の有無）と診察（指間・手関節屈側・腋窩・臍周囲・陰部）を行う。'
         '③有症状者はKOHやダーモスコピーで確認し、'
         '感染者は同時期に一斉治療する（時間差治療は再感染の温床）。'
         '④角化型疥癬が見つかったら直ちに個室隔離とリネンの熱処理を行う</span>。<br>'
         '<span class="kw3">誤解されやすい点を確認する</span>——'
         '<span class="kw3">通常疥癬に個室隔離は不要、感染症法の届出は不要、'
         '学校保健安全法の出席停止対象でもない</span>。'
         '<span class="kw4">環境消毒も通常疥癬では過剰で、'
         '日常的な清掃・洗濯で足りる</span>。'
         '<span class="kw4">「過剰な隔離・消毒は患者の尊厳とケアの質を損なう」という視点も'
         '出題意図に含まれている</span>。<br>'
         '<span class="kw3">なお本例のダーモスコピー像（C）は、'
         '疥癬トンネルの先端にいる雌成虫が三角形の黒い影として見える所見'
         '（delta wing sign／jet with contrail sign）</span>で、'
         '<span class="kw3">検体採取部位を狙い撃ちできるため診断効率が大きく上がる</span>。'),
  deep=('📌 疥癬の治療薬',
        '<table class="tb"><tr><th>薬剤</th><th>用法</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">イベルメクチン</span></td>'
        '<td><span class="kw3">200μg/kg 経口・空腹時に単回。1週後に再投与</span></td>'
        '<td><span class="kw3">卵には効かない→孵化を待って2回目が必須。'
        '角化型では複数回</span></td></tr>'
        '<tr><td><span class="kw3">フェノトリンローション</span></td>'
        '<td><span class="kw3">首から下の全身に塗布、12時間後に洗い流す。1週間隔で2回</span></td>'
        '<td><span class="kw3">日本で疥癬に保険適用のある唯一の外用ピレスロイド</span></td></tr>'
        '<tr><td>イオウ含有外用薬</td><td>連日全身塗布を数日〜1週</td>'
        '<td><span class="kw4">古典的だが有効・安価。臭いと刺激が難点</span></td></tr>'
        '<tr><td>クロタミトン</td><td>連日全身塗布</td><td>殺虫作用は弱め。止痒作用あり</td></tr>'
        '<tr><td>安息香酸ベンジル</td><td>外用</td><td>刺激が強く小児には不向き</td></tr></table>'
        '<span class="kw3">共通する要点は「首から下の全身に塗る（顔面・頭部は通常侵されない）」'
        '「卵には効かないので1週間後に必ず2回目」</span>である。'
        '<span class="kw4">治療後も瘙痒と疥癬結節は数週間残る（治療後瘙痒症）ので、'
        '「痒い＝治っていない」と判断して治療を延々と繰り返さない</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">通常疥癬＝届出不要・個室不要・就業制限なし</span>。<br>'
         '② <span class="kw3">施設内発生では接触者（職員・入居者）の問診と診察→一斉治療</span>。<br>'
         '③ <span class="kw3">個室隔離が要るのは角化型（ノルウェー）疥癬</span>。<br>'
         '④ <span class="kw3">治療薬は1週間後に必ず2回目（卵に効かないため）</span>。<br>'
         '⑤ <span class="kw4">ダーモスコピーでトンネル先端の三角形の影</span>。'
         '<span class="kw">Q.210</span>は同趣旨の問題。')),

Q('110H-30', 78, [('bh', '必修'), ('bi', '📷')],
  '62歳の男性。顔面の発赤を主訴に来院した。'
  '<span class="kw">3日前に顔面の発赤が出現</span>した。'
  '<span class="kw">37.2℃の発熱と顔面の熱感があり、押さえると痛み</span>を感じた。'
  '症状が改善しないため受診した。'
  '<span class="kw">顔面の痒み、日光過敏、関節痛および筋肉痛は自覚していない</span>。'
  '<span class="kw">化粧品や外用薬は使用していない</span>。'
  '<span class="kw">糖尿病で治療中</span>である。喫煙歴はなく、飲酒は機会飲酒。兄が関節リウマチ。'
  '意識は清明。体温37.5℃。脈拍96/分、整。血圧122/64mmHg。呼吸数14/分。'
  '<span class="kw">眼瞼結膜と眼球結膜とに異常を認めない</span>。'
  '<span class="kw">両頰部に発赤と圧痛</span>とを認める。'
  '心音と呼吸音とに異常を認めない。腹部は平坦、軟で、肝・脾を触知しない。顔面の写真を示す。<br>'
  '<strong>最も適切な治療薬はどれか。</strong>',
  [('a', '抗真菌薬', False, '<span class="kw4">顔面白癬・カンジダ症は鱗屑を伴い、'
                     '発熱や強い圧痛は伴わない</span>。'
                     '<span class="kw4">3日で急性に発赤・熱感・圧痛と発熱を来す経過は真菌症らしくない</span>。'),
   ('b', '抗ウイルス薬', False, '<span class="kw4">顔面のウイルス感染で問題になるのは'
                     '三叉神経領域の帯状疱疹だが、片側性の集簇性小水疱が必発</span>である。'
                     '<span class="kw4">本例は両頰部で水疱がない</span>。'),
   ('c', '副腎皮質ステロイド', False,
                     '<span class="kw4">両頰部の紅斑からSLEの蝶形紅斑を連想させる作りになっている</span>が、'
                     '<span class="kw3">本文は「日光過敏なし・関節痛なし・筋肉痛なし・眼球結膜に異常なし」と'
                     '膠原病を示唆する所見を丁寧に消している</span>。'
                     '<span class="kw3">さらにSLEの蝶形紅斑は熱感・圧痛を伴わず、発熱があっても'
                     '「押さえると痛い」局所所見にはならない</span>。'
                     '<span class="kw4">細菌感染にステロイドを投与すれば感染を増悪させる</span>。'),
   ('d', 'ペニシリン系抗菌薬', True,
                     '<span class="kw3">①3日という急性経過、②発熱、'
                     '③顔面の発赤に熱感と圧痛を伴う、'
                     '④糖尿病という易感染宿主</span>——'
                     '<span class="kw3">丹毒（あるいは顔面の蜂窩織炎）である</span>。'
                     '<span class="kw3">丹毒の起炎菌はA群β溶血性連鎖球菌で、'
                     '溶連菌にはペニシリン耐性がほぼ知られていない</span>ため、'
                     '<span class="kw3">ペニシリン系抗菌薬が第一選択</span>となる。'),
   ('e', '非ステロイド性抗炎症薬〈NSAIDs〉', False,
                     '<span class="kw4">NSAIDsは解熱鎮痛の対症療法にすぎず、'
                     '細菌感染の原因治療にならない</span>。'
                     '<span class="kw4">むしろ壊死性筋膜炎への進展を'
                     '解熱・鎮痛によってマスクする危険が指摘されている</span>。')],
  '両頰の紅斑でも、熱感・圧痛・発熱があれば感染症（丹毒）。膠原病を示唆する所見は全て否定されている。ペニシリン系。',
  imgs=['images/110H-30_1.jpeg'],
  patho=('🩺 「両頰が赤い」——蝶形紅斑と丹毒を分ける',
         '<span class="kw3">顔面の両側性紅斑は、感染症・膠原病・炎症性皮膚疾患の'
         'いずれもが取り得る所見であり、鑑別は「随伴所見」で行う</span>。<br>'
         '<span class="kw3">丹毒（感染）の側の所見は、'
         '①発熱（悪寒を伴うことが多い）、②局所の熱感、③圧痛、'
         '④境界明瞭で隆起した鮮紅色、⑤急性の経過（数日）、'
         '⑥白血球増多・CRP上昇、⑦所属リンパ節腫脹</span>である。<br>'
         '<span class="kw3">SLEの蝶形紅斑の側の所見は、'
         '①鼻背を越えて両頰に広がるが鼻唇溝は避ける、'
         '②熱感・圧痛はない、③日光曝露で誘発・増悪（光線過敏）、'
         '④関節痛・口腔内潰瘍・脱毛・レイノー現象などの全身症状、'
         '⑤抗核抗体・抗dsDNA抗体陽性、⑥週〜月単位の慢性経過</span>である。'
         '<span class="kw3">本問はこれらを一つずつ「認めない」と書いて消している</span>——'
         '<span class="kw3">「日光過敏なし」「関節痛・筋肉痛なし」「眼球結膜に異常なし」が'
         'その除外文であり、代わりに「熱感」「圧痛」「発熱」を残している</span>。<br>'
         '<span class="kw4">その他の鑑別として、'
         '酒皶（中年女性の鼻・頰の持続性紅斑と毛細血管拡張。潮紅発作を伴う）、'
         '脂漏性皮膚炎（鼻唇溝・眉間の鱗屑を伴う紅斑）、'
         '接触皮膚炎（化粧品の使用歴と瘙痒）、'
         '皮膚筋炎（ヘリオトロープ疹・Gottron徴候・筋力低下）</span>がある。'
         '<span class="kw4">本例では「化粧品や外用薬は使用していない」が接触皮膚炎を、'
         '「痒みなし」が湿疹群を消している</span>。<br>'
         '<span class="kw3">糖尿病という背景も重要で、'
         '高血糖は好中球機能を低下させ皮膚軟部組織感染症のリスクを高める</span>。'
         '<span class="kw4">糖尿病患者の皮膚感染では、壊死性筋膜炎やガス壊疽への'
         '進展にも警戒する</span>。'),
  deep=('📌 皮膚軟部組織感染症の抗菌薬選択',
        '<table class="tb"><tr><th>病態</th><th>想定起炎菌</th><th>第一選択</th></tr>'
        '<tr><td><span class="kw3">丹　毒</span></td>'
        '<td><span class="kw3">A群β溶連菌</span></td>'
        '<td><span class="kw3">ペニシリン系（ベンジルペニシリン、アモキシシリン）</span></td></tr>'
        '<tr><td><span class="kw3">蜂窩織炎（MSSA想定）</span></td>'
        '<td><span class="kw3">黄色ブドウ球菌・溶連菌</span></td>'
        '<td><span class="kw3">セファゾリン（第1世代セフェム）</span></td></tr>'
        '<tr><td>蜂窩織炎（MRSAリスクあり）</td><td>MRSA</td>'
        '<td><span class="kw4">バンコマイシン・リネゾリド・ダプトマイシン</span></td></tr>'
        '<tr><td>伝染性膿痂疹</td><td>黄色ブドウ球菌・溶連菌</td>'
        '<td>セフェム系外用±内服</td></tr>'
        '<tr><td><span class="kw4">壊死性筋膜炎</span></td>'
        '<td><span class="kw4">A群β溶連菌・嫌気性菌・混合</span></td>'
        '<td><span class="kw4">緊急デブリドマン＋広域（カルバペネム等）＋クリンダマイシン'
        '（毒素産生抑制）</span></td></tr>'
        '<tr><td>糖尿病性足感染</td><td>混合（好気＋嫌気）</td>'
        '<td>広域β-ラクタム＋創部管理・血糖是正</td></tr></table>'
        '<span class="kw3">溶連菌は今もペニシリン感受性が保たれている</span>ため、'
        '<span class="kw3">丹毒と分かればペニシリンで十分</span>である。'
        '<span class="kw4">起炎菌が絞れないときは黄色ブドウ球菌もカバーする'
        'セファゾリンを選ぶ</span>（<span class="kw">Q.212</span>）。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">熱感・圧痛・発熱があれば感染症（丹毒）を第一に考える</span>。<br>'
         '② <span class="kw3">丹毒の第一選択はペニシリン系抗菌薬</span>（必修レベル）。<br>'
         '③ <span class="kw4">SLEの蝶形紅斑は熱感・圧痛がなく、光線過敏と関節症状を伴う</span>。<br>'
         '④ <span class="kw4">感染症にステロイドは禁物</span>。<br>'
         '⑤ <span class="kw3">糖尿病は皮膚軟部組織感染症のリスク因子</span>。')),

Q('109F-13', 94, [('bh', '必修')],
  '<strong>ヒトヘルペスウイルスによる疾患はどれか。</strong>',
  [('a', '手足口病', False, '<span class="kw4">手足口病はコクサッキーウイルスA6・A16、'
                     'エンテロウイルス71によるピコルナウイルス科の感染症</span>である。'
                     '<span class="kw4">手掌・足底・口腔に水疱性発疹を生じ、'
                     'EV71は無菌性髄膜炎・脳炎を合併し得る</span>。'),
   ('b', '伝染性紅斑', False, '<span class="kw4">伝染性紅斑〈りんご病〉は'
                     'ヒトパルボウイルスB19（パルボウイルス科）</span>による。'
                     '<span class="kw4">両頰の平手打ち様紅斑と四肢のレース状紅斑。'
                     '妊婦感染で胎児水腫、溶血性貧血患者でaplastic crisisを起こす</span>。'),
   ('c', '突発性発疹', True, '<span class="kw3">突発性発疹〈exanthem subitum〉は'
                     'ヒトヘルペスウイルス6型〈HHV-6〉（一部はHHV-7）による</span>。'
                     '<span class="kw3">生後6か月〜2歳に好発し、'
                     '3〜4日間の高熱の後、解熱とともに体幹から'
                     '淡紅色の小紅斑が出現する</span>のが定型である。'
                     '<span class="kw3">「熱が下がってから発疹が出る」順序が診断の鍵</span>で、'
                     '<span class="kw3">発熱時に熱性痙攣を起こすことがある</span>。'),
   ('d', '伝染性軟属腫', False, '<span class="kw4">伝染性軟属腫〈水いぼ〉は'
                     '伝染性軟属腫ウイルス（ポックスウイルス科）</span>による。'
                     '<span class="kw4">中心臍窩をもつ光沢のあるドーム状小丘疹で、'
                     '圧出すると白い粥状物（軟属腫小体）が出る</span>。'),
   ('e', '尖圭コンジローマ', False, '<span class="kw4">尖圭コンジローマは'
                     'ヒト乳頭腫ウイルス〈HPV〉6型・11型（パピローマウイルス科）</span>による'
                     '性感染症である。'
                     '<span class="kw4">陰部に乳頭状・鶏冠状の腫瘤を形成する</span>。')],
  '突発性発疹＝HHV-6（一部HHV-7）。高熱が3〜4日続き、解熱とともに発疹が出る。',
  patho=('🦠 ヒトヘルペスウイルス8種を1枚で',
         '<span class="kw3">ヒトヘルペスウイルス〈HHV〉は現在8種が知られ、'
         'いずれも初感染後に潜伏感染し、免疫低下時に再活性化する</span>という共通性を持つ。'
         '<span class="kw3">国試では「何番が何の病気か」が直接問われる</span>。'
         '<table class="tb"><tr><th>番号</th><th>通称</th><th>疾患</th><th>潜伏部位</th></tr>'
         '<tr><td><span class="kw3">HHV-1</span></td><td><span class="kw3">単純ヘルペス1型</span></td>'
         '<td><span class="kw3">口唇ヘルペス、ヘルペス性歯肉口内炎、'
         'カポジ水痘様発疹症、単純ヘルペス脳炎</span></td>'
         '<td>三叉神経節</td></tr>'
         '<tr><td>HHV-2</td><td>単純ヘルペス2型</td>'
         '<td><span class="kw3">性器ヘルペス、新生児ヘルペス</span></td>'
         '<td>仙骨神経節</td></tr>'
         '<tr><td><span class="kw3">HHV-3</span></td><td><span class="kw3">水痘・帯状疱疹ウイルス</span></td>'
         '<td><span class="kw3">水痘（初感染）、帯状疱疹（再活性化）</span></td>'
         '<td>後根神経節</td></tr>'
         '<tr><td>HHV-4</td><td>EBウイルス</td>'
         '<td><span class="kw3">伝染性単核症、Burkittリンパ腫、上咽頭癌、種痘様水疱症</span></td>'
         '<td>B細胞</td></tr>'
         '<tr><td>HHV-5</td><td>サイトメガロウイルス</td>'
         '<td><span class="kw3">先天性CMV感染症、間質性肺炎、網膜炎、腸炎（免疫不全）</span></td>'
         '<td>単球・骨髄</td></tr>'
         '<tr><td><span class="kw3">HHV-6</span></td><td><span class="kw3">—</span></td>'
         '<td><span class="kw3">突発性発疹、DIHS（薬剤性過敏症症候群）での再活性化</span></td>'
         '<td>単球・T細胞</td></tr>'
         '<tr><td>HHV-7</td><td>—</td><td>突発性発疹（2回目のことがある）</td><td>T細胞</td></tr>'
         '<tr><td>HHV-8</td><td>KSHV</td>'
         '<td><span class="kw3">Kaposi肉腫、原発性滲出性リンパ腫</span></td>'
         '<td>B細胞</td></tr></table>'
         '<span class="kw4">HHV-6は突発性発疹だけでなく、'
         'DIHS〈drug-induced hypersensitivity syndrome〉の経過中に再活性化して'
         '症状の遷延・二峰性の発熱を来すことでも重要</span>である。'),
  deep=('📌 小児のウイルス性発疹症——「発熱と発疹の時間関係」で分ける',
        '<table class="tb"><tr><th>疾患</th><th>ウイルス</th><th>発熱と発疹の関係</th><th>皮疹の特徴</th></tr>'
        '<tr><td><span class="kw3">突発性発疹</span></td><td><span class="kw3">HHV-6・7</span></td>'
        '<td><span class="kw3">解熱してから発疹</span></td>'
        '<td><span class="kw3">体幹主体の淡紅色小紅斑。機嫌はよい</span></td></tr>'
        '<tr><td>麻　疹</td><td>麻疹ウイルス</td>'
        '<td><span class="kw3">いったん解熱後に再発熱して発疹（二峰性）</span></td>'
        '<td><span class="kw3">Koplik斑→耳後部から下降する融合性紅斑→色素沈着</span></td></tr>'
        '<tr><td>風　疹</td><td>風疹ウイルス</td><td>発熱と同時</td>'
        '<td>淡紅色小紅斑、耳後部・後頸部リンパ節腫脹。3日で消退</td></tr>'
        '<tr><td>伝染性紅斑</td><td>パルボウイルスB19</td>'
        '<td><span class="kw4">発疹が出る頃には解熱・全身状態良好</span></td>'
        '<td><span class="kw3">両頰の平手打ち様紅斑＋四肢のレース状紅斑</span></td></tr>'
        '<tr><td>水　痘</td><td>VZV（HHV-3）</td><td>発熱と同時〜やや先行</td>'
        '<td><span class="kw3">紅斑・水疱・膿疱・痂皮が同時に混在（多様性）</span></td></tr>'
        '<tr><td>手足口病</td><td>コクサッキーA・EV71</td><td>微熱を伴う</td>'
        '<td>手掌・足底・口腔の水疱。爪甲脱落を後遺することあり</td></tr></table>'
        '<span class="kw3">「熱が下がってから発疹＝突発性発疹」「二峰性でKoplik斑＝麻疹」'
        '「皮疹の多様性＝水痘」</span>という3点を軸にすると整理しやすい。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">突発性発疹＝HHV-6（一部HHV-7）</span>。<br>'
         '② <span class="kw3">3〜4日の高熱→解熱とともに体幹から発疹</span>。熱性痙攣に注意。<br>'
         '③ <span class="kw4">手足口病＝コクサッキー／伝染性紅斑＝パルボB19／'
         '水いぼ＝ポックス／尖圭コンジローマ＝HPV</span>。<br>'
         '④ <span class="kw3">HHV-3＝水痘・帯状疱疹、HHV-8＝Kaposi肉腫</span>。<br>'
         '⑤ <span class="kw4">HHV-6はDIHSでの再活性化でも問われる</span>。')),

Q('109I-5', 91, [],
  '<strong>黄色ブドウ球菌が産生する表皮剝脱毒素〈exfoliative toxin〉によって'
  '生じる疾患はどれか。</strong>',
  [('a', '伝染性膿痂疹', True, '<span class="kw3">水疱性膿痂疹は、黄色ブドウ球菌が'
                     '局所で産生した表皮剝脱毒素〈ET〉がデスモグレイン1〈Dsg1〉を分解し、'
                     '顆粒層に弛緩性水疱を作る</span>。'
                     '<span class="kw3">乳幼児の夏季に多く、掻破した手を介して自家接種で広がる'
                     '（＝とびひ）</span>。'
                     '<span class="kw3">同じ毒素が血行性に全身へ回るとSSSSになる</span>——'
                     '<span class="kw3">選択肢にSSSSがなければ伝染性膿痂疹が答え</span>である。'),
   ('b', '壊疽性膿皮症', False, '<span class="kw4">壊疽性膿皮症〈pyoderma gangrenosum〉は'
                     '好中球性皮膚症で、名前に反して感染症ではない</span>。'
                     '<span class="kw4">辺縁が穿掘性・堤防状に隆起する有痛性潰瘍を作り、'
                     '潰瘍性大腸炎・Crohn病・関節リウマチ・骨髄異形成症候群に合併</span>する。'
                     '<span class="kw4">デブリドマンで悪化する（pathergy）ため、'
                     '治療はステロイド・免疫抑制薬・生物学的製剤</span>である。'),
   ('c', '尋常性痤瘡', False, '<span class="kw4">尋常性痤瘡〈にきび〉は、'
                     '毛包漏斗部の角化異常による面皰形成に、'
                     '皮脂の増加と Cutibacterium acnes（旧 Propionibacterium acnes）の'
                     '増殖・炎症が加わって生じる</span>。'
                     '<span class="kw4">黄色ブドウ球菌の毒素は関与しない</span>。'),
   ('d', '皮膚腺病', False, '<span class="kw4">皮膚腺病〈scrofuloderma〉は、'
                     '頸部リンパ節結核などの深部結核病巣が皮膚へ穿破して'
                     '瘻孔・潰瘍を形成した皮膚結核</span>である。'
                     '<span class="kw4">起炎菌は結核菌</span>。'),
   ('e', '丹　毒', False, '<span class="kw4">丹毒はA群β溶連菌が真皮浅層とリンパ管に'
                     '侵入して起こす化膿性炎</span>で、'
                     '<span class="kw4">黄色ブドウ球菌でも毒素性でもない</span>。')],
  '表皮剝脱毒素→Dsg1分解→顆粒層で剝離。局所なら水疱性膿痂疹、血行性に全身へ回ればSSSS。',
  patho=('🦠 表皮剝脱毒素とデスモグレイン——分子で覚える水疱の高さ',
         '<span class="kw3">表皮細胞どうしはデスモソームで接着しており、'
         'その接着分子がデスモグレイン〈desmoglein: Dsg〉である</span>。'
         '<span class="kw3">皮膚ではDsg1が表皮上層（顆粒層）に、'
         'Dsg3が表皮下層（基底層直上）に多く分布する</span>——'
         '<span class="kw3">「1が上、3が下」</span>と覚える。<br>'
         '<span class="kw3">黄色ブドウ球菌の表皮剝脱毒素〈ET-A、ET-B〉は'
         'セリンプロテアーゼで、Dsg1だけを特異的に切断する</span>。'
         '<span class="kw3">その結果、裂隙はDsg1が主役の顆粒層にできる</span>——'
         '<span class="kw3">だから水疱は極めて浅く、すぐ破れて弛緩性水疱・びらんとなる</span>。<br>'
         '<span class="kw3">同じ「Dsg1が壊れる」病態は3つある</span>——'
         '<span class="kw3">①水疱性膿痂疹（ETが局所で作用）、'
         '②SSSS（ETが血行性に全身で作用）、'
         '③落葉状天疱瘡（抗Dsg1自己抗体）</span>。'
         '<span class="kw3">3つとも「表皮上層の浅い水疱・落屑」「粘膜疹なし」という'
         '共通の表現型をとる</span>のは、壊れる分子が同じだからである。'
         '<span class="kw4">粘膜にはDsg3が豊富でDsg1が壊れても代償されるため、'
         'この3疾患ではいずれも粘膜が侵されない</span>——'
         '<span class="kw4">これを「デスモグレイン代償説」と呼ぶ</span>。<br>'
         '<span class="kw3">対照的に、尋常性天疱瘡は抗Dsg3抗体が主体で'
         '基底層直上に裂隙ができ、Dsg1で代償できない口腔粘膜のびらんで初発する</span>。'),
  deep=('📌 Dsg1／Dsg3 で疾患を並べ替える',
        '<table class="tb"><tr><th>疾患</th><th>壊れる分子</th><th>機序</th>'
        '<th>裂隙</th><th>粘膜疹</th></tr>'
        '<tr><td><span class="kw3">水疱性膿痂疹</span></td>'
        '<td><span class="kw3">Dsg1</span></td>'
        '<td><span class="kw3">ETによる分解（局所）</span></td>'
        '<td><span class="kw3">顆粒層</span></td><td><span class="kw3">なし</span></td></tr>'
        '<tr><td><span class="kw3">SSSS</span></td><td><span class="kw3">Dsg1</span></td>'
        '<td><span class="kw3">ETによる分解（全身・血行性）</span></td>'
        '<td><span class="kw3">顆粒層</span></td><td><span class="kw3">なし</span></td></tr>'
        '<tr><td>落葉状天疱瘡</td><td><span class="kw3">Dsg1</span></td>'
        '<td>抗Dsg1自己抗体</td><td>顆粒層</td><td><span class="kw3">なし</span></td></tr>'
        '<tr><td><span class="kw4">尋常性天疱瘡</span></td>'
        '<td><span class="kw4">Dsg3（±Dsg1）</span></td>'
        '<td><span class="kw4">抗Dsg3自己抗体</span></td>'
        '<td><span class="kw4">基底層直上</span></td>'
        '<td><span class="kw4">あり（口腔で初発）</span></td></tr>'
        '<tr><td>水疱性類天疱瘡</td><td>BP180・BP230（ヘミデスモソーム）</td>'
        '<td>抗基底膜部抗体</td><td><span class="kw3">表皮下（緊満性水疱）</span></td>'
        '<td>少ない</td></tr></table>'
        '<span class="kw3">「Dsg1が壊れる＝浅い・弛緩性・粘膜なし」'
        '「Dsg3が壊れる＝深い・口腔粘膜から始まる」'
        '「基底膜部が壊れる＝表皮下・緊満性水疱」</span>——この3行で水疱症は整理できる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">表皮剝脱毒素〈ET〉はDsg1を分解する</span>。<br>'
         '② <span class="kw3">局所作用＝水疱性膿痂疹、全身作用＝SSSS</span>。<br>'
         '③ <span class="kw3">Dsg1は表皮上層＝裂隙は顆粒層＝弛緩性水疱・粘膜疹なし</span>。<br>'
         '④ <span class="kw4">壊疽性膿皮症は感染症ではない（好中球性皮膚症・IBDに合併）</span>。<br>'
         '⑤ <span class="kw4">Dsg3＝基底層直上＝尋常性天疱瘡＝口腔粘膜から</span>。')),

]

QUESTIONS += [

Q('108A-40', 91, [('bi', '📷')],
  '78歳の男性。<span class="kw">2日後の胃癌の手術のため入院中</span>である。'
  '<span class="kw">主治医が両手の皮疹に気付いた</span>。'
  '本人に聞くと、<span class="kw">1か月前から痒みが強く、市販の止痒薬を外用していたが'
  '軽快しなかった</span>という。他の部位に皮疹はない。'
  '左手の写真（A）と鱗屑の苛性カリ〈KOH〉直接鏡検標本（B）とを示す。<br>'
  '<strong>皮疹に対する治療のほかに、対応として適切なのはどれか。</strong>',
  [('a', '手術を延期する。', False, '<span class="kw4">疥癬は治療可能であり、'
                     '手術と並行して治療できる</span>。'
                     '<span class="kw4">胃癌の手術を疥癬のために延期すれば'
                     '原疾患の予後を損なう</span>——'
                     '<span class="kw4">感染対策を理由に必要な治療を遅らせない</span>のが原則である。'),
   ('b', '病室を閉鎖する。', False, '<span class="kw4">通常疥癬は寄生虫数が少なく、'
                     '長時間の直接接触がなければ伝播しない</span>。'
                     '<span class="kw4">病室閉鎖は角化型疥癬でも通常は行わず、'
                     '当該患者の個室管理で対応する</span>。過剰な対応である。'),
   ('c', '衣類を熱湯消毒する。', False, '<span class="kw4">ヒゼンダニは宿主を離れると'
                     '数時間〜数日で死滅し、通常の洗濯・乾燥で十分</span>である。'
                     '<span class="kw4">熱湯消毒（50℃10分以上）が推奨されるのは'
                     '虫体数が桁違いに多い角化型疥癬の場合</span>で、'
                     '本例のような通常疥癬では不要である。'),
   ('d', '病室に殺虫剤を散布する。', False, '<span class="kw4">ヒゼンダニは'
                     'ヒトの皮膚の角層内にしか棲めず、環境中で繁殖しない</span>。'
                     '<span class="kw4">環境への殺虫剤散布は無意味であり、'
                     '入院患者への曝露という害だけが残る</span>。'),
   ('e', '接触した職員の皮疹の有無を確認する。', True,
                     '<span class="kw3">1か月にわたり診断されないまま経過しており、'
                     '入院中に多数の医療者が身体接触（清拭・移乗・処置）を'
                     '行っている可能性が高い</span>。'
                     '<span class="kw3">疥癬の院内対応の核は、'
                     '接触者を洗い出して問診・診察し、'
                     '感染者を同時期に一斉治療して伝播の輪を断つこと</span>である。'
                     '<span class="kw3">環境ではなく「人」を追うのが正しい</span>。')],
  '疥癬の院内対応は接触者健診が核。手術延期・病室閉鎖・熱湯消毒・殺虫剤散布はいずれも過剰または無意味。',
  imgs=['images/108A-40_1.jpeg', 'images/108A-40_2.jpeg'],
  patho=('🏥 院内発生した疥癬への対応——「環境」ではなく「人」を追う',
         '<span class="kw3">疥癬の感染対策で最も重要な事実は、'
         'ヒゼンダニがヒトの角層内でしか生活できず、環境中で増殖しないこと</span>である。'
         '<span class="kw3">宿主を離れた虫体は乾燥に弱く、'
         '室温では数時間〜長くて数日しか生存しない</span>。'
         '<span class="kw3">したがって対策の重心は環境消毒ではなく、'
         '「誰が感染しているか」を突き止めて同時に治療すること</span>に置かれる。<br>'
         '<span class="kw3">院内で疥癬が診断されたときの手順</span>——'
         '<span class="kw3">①通常疥癬か角化型かを判定する（虫体数と感染力が桁違い）。'
         '②接触者リストを作る（同室者、担当看護師・介護士、リハビリ職員、家族）。'
         '③接触者に「瘙痒の有無」を問診し、'
         '指間・手関節屈側・腋窩・臍周囲・陰部を診察する。'
         '④有症状者はKOH・ダーモスコピーで確認する。'
         '⑤感染者は同時期に一斉治療する。'
         '⑥潜伏期（初感染で1〜2か月）を考慮し、'
         '一定期間は新規発症の監視を続ける</span>。<br>'
         '<span class="kw4">通常疥癬で不要なもの：個室隔離、病室閉鎖、'
         '手術や検査の延期、環境への殺虫剤散布、リネンの熱湯消毒、'
         '保健所への届出</span>。'
         '<span class="kw3">角化型疥癬で必要になるもの：個室隔離、'
         'ガウン・手袋、リネンの熱処理（50℃10分）またはビニール袋密閉、'
         '落屑の飛散防止と清掃</span>。<br>'
         '<span class="kw4">実地上の最大の問題は「診断の遅れ」である</span>——'
         '<span class="kw4">本例のように1か月「痒み止め」で経過してしまうと、'
         'その間に接触者が広がる</span>。'
         '<span class="kw4">高齢者の全身の強い痒みを見たら、'
         '湿疹と決めつける前に指間と陰部を診る</span>のが要点である。'),
  deep=('📌 「隔離が必要か」で感染症を仕分ける',
        '<table class="tb"><tr><th>感染経路</th><th>代表疾患</th><th>必要な予防策</th></tr>'
        '<tr><td><span class="kw3">接触（通常疥癬）</span></td>'
        '<td><span class="kw3">通常疥癬</span></td>'
        '<td><span class="kw3">標準予防策で足りる。個室不要</span></td></tr>'
        '<tr><td><span class="kw3">接触（強い）</span></td>'
        '<td><span class="kw3">角化型疥癬、MRSA、CD腸炎、流行性角結膜炎</span></td>'
        '<td><span class="kw3">個室・ガウン・手袋</span></td></tr>'
        '<tr><td>飛沫</td><td>インフルエンザ、風疹、流行性耳下腺炎、百日咳</td>'
        '<td>サージカルマスク・個室（またはコホート）</td></tr>'
        '<tr><td><span class="kw3">空気</span></td>'
        '<td><span class="kw3">結核、麻疹、水痘</span></td>'
        '<td><span class="kw3">陰圧個室・N95マスク</span></td></tr></table>'
        '<span class="kw4">CD（Clostridioides difficile）腸炎と芽胞形成菌には'
        'アルコールが効かないため石鹸と流水による手洗いが必要</span>、'
        '<span class="kw4">というように「例外」をセットで覚えると実地でも使える</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">疥癬の院内対応＝接触者（職員・同室者）の問診と診察</span>。<br>'
         '② <span class="kw3">ヒゼンダニは環境中で増殖しない→殺虫剤散布は無意味</span>。<br>'
         '③ <span class="kw4">通常疥癬に個室隔離・病室閉鎖・熱湯消毒は不要</span>。<br>'
         '④ <span class="kw4">感染対策を理由に必要な手術を延期しない</span>。<br>'
         '⑤ <span class="kw3">角化型疥癬なら個室隔離とリネンの熱処理が必要</span>。')),

Q('108I-43', 83, [('bi', '📷')],
  '65歳の男性。<span class="kw">1か月前からの右手背の潰瘍を伴う結節</span>を主訴に来院した。'
  '<span class="kw">自宅で熱帯魚を飼育</span>している。'
  '右手背に、<span class="kw">中央に潰瘍を伴う直径1cmの結節</span>を認める。'
  '<span class="kw">表在リンパ節は触知しない。発熱はない</span>。'
  '<span class="kw">胸部CTで肺野に異常を認めない</span>。'
  '<span class="kw">潰瘍の滲出液のPCR検査で結核菌は陰性</span>。'
  '<span class="kw">Sabouraud寒天培地での培養検査は陰性</span>。'
  '滲出液の<span class="kw">Ziehl-Neelsen染色標本</span>を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '皮膚腺病', False, '<span class="kw4">皮膚腺病〈scrofuloderma〉は、'
                     '頸部リンパ節結核や骨・関節結核が皮膚へ穿破して'
                     '瘻孔・潰瘍を作る皮膚結核</span>である。'
                     '<span class="kw4">本例はPCRで結核菌が陰性、'
                     '胸部CTで肺野に異常なし、表在リンパ節も触知しない</span>——'
                     '結核が三重に否定されている。'),
   ('b', '尋常性狼瘡', False, '<span class="kw4">尋常性狼瘡も皮膚結核</span>で、'
                     '<span class="kw4">顔面に数年〜数十年かけて緩徐に拡大する'
                     '褐色の局面（リンゴゼリー様）</span>を作る。'
                     '<span class="kw4">1か月の経過・手背の潰瘍性結節という所見に合わず、'
                     '結核菌PCRも陰性</span>である。'),
   ('c', 'アスペルギルス症', False, '<span class="kw4">アスペルギルスは真菌</span>であり、'
                     '<span class="kw3">Sabouraud寒天培地（真菌用培地）での培養が陰性</span>である'
                     '本例には合わない。'
                     '<span class="kw4">また皮膚アスペルギルス症は'
                     '好中球減少患者などの重篤な易感染宿主に生じる</span>。'),
   ('d', 'スポロトリコーシス', False, '<span class="kw4">スポロトリコーシスは'
                     'Sporothrix schenckii による深在性真菌症で、'
                     '土壌・植物（バラの棘・水苔）による外傷が契機</span>となる。'
                     '<span class="kw3">真菌なのでSabouraud培地で培養陽性になるはずだが、'
                     '本例は陰性</span>である。'
                     '<span class="kw4">また曝露歴が「熱帯魚の飼育」＝水系であって土壌ではない</span>。'),
   ('e', '非結核性〈非定型〉抗酸菌症', True,
                     '<span class="kw3">①熱帯魚の飼育＝水系曝露、'
                     '②手背という体温の低い四肢末梢、'
                     '③1か月の緩徐な経過で発熱なし、'
                     '④結核菌PCR陰性（＝結核ではない）、'
                     '⑤Sabouraud培地陰性（＝真菌ではない）、'
                     '⑥Ziehl-Neelsen染色で抗酸菌陽性</span>——'
                     '<span class="kw3">Mycobacterium marinum による'
                     '皮膚非結核性抗酸菌症</span>である。'
                     '<span class="kw3">「抗酸菌はいるが結核菌ではない」＝非結核性抗酸菌</span>という'
                     '消去法がそのまま診断になる。')],
  '熱帯魚の水槽＋手背の無痛性潰瘍性結節＋Ziehl-Neelsen陽性かつ結核菌PCR陰性＝M. marinum の非結核性抗酸菌症。',
  imgs=['images/108I-43_1.jpeg'],
  patho=('🔬 Ziehl-Neelsen染色が陽性なら次に問うのは「結核か、それ以外か」',
         '<span class="kw3">Ziehl-Neelsen染色〈チール・ネールゼン染色〉は、'
         '細胞壁にミコール酸を多量に含む菌が、'
         '石炭酸フクシンで染まった後に塩酸アルコールで脱色されない性質'
         '（抗酸性）を利用した染色</span>である。'
         '<span class="kw3">青いメチレンブルーの背景に赤い桿菌が見えれば抗酸菌陽性</span>。<br>'
         '<span class="kw3">ここで診断は終わらない</span>——'
         '<span class="kw3">抗酸菌には結核菌群と非結核性抗酸菌〈NTM〉があり、'
         '染色像だけでは区別できない</span>。'
         '<span class="kw3">区別するのは核酸増幅法（PCR・LAMP）と培養・同定</span>で、'
         '<span class="kw3">本例は「PCRで結核菌が陰性」なのに抗酸菌が見えている＝NTM</span>という'
         '論理で答えが決まる。<br>'
         '<span class="kw3">除外の連鎖を読み解くのが本問の骨格</span>である——'
         '<span class="kw3">胸部CT正常＝肺結核・粟粒結核の否定、'
         'PCR陰性＝結核菌の否定（ａ・ｂを消す）、'
         'Sabouraud培地陰性＝真菌の否定（ｃ・ｄを消す）、'
         'Ziehl-Neelsen陽性＝抗酸菌の証明（ｅを残す）</span>。'
         '<span class="kw4">選択肢を5つとも潰せる材料が本文に置かれており、'
         '「どの検査が何を否定するか」を知っていれば知識だけで解ける</span>。<br>'
         '<span class="kw3">M. marinum の実地上の要点は培養条件</span>である——'
         '<span class="kw3">至適発育温度が30℃前後なので、'
         '37℃の通常条件だけでは発育せず「培養陰性」と誤読される</span>。'
         '<span class="kw3">臨床医が疑いを検査室に伝え、低温培養を依頼する必要がある</span>。'
         '<span class="kw4">治療はクラリスロマイシン、ミノサイクリン、'
         'リファンピシン＋エタンブトールなどを数か月</span>。'),
  deep=('📌 皮膚の抗酸菌症を並べる',
        '<table class="tb"><tr><th>疾患</th><th>菌</th><th>臨床像</th><th>手がかり</th></tr>'
        '<tr><td><span class="kw3">M. marinum 感染症</span></td>'
        '<td><span class="kw3">M. marinum（NTM）</span></td>'
        '<td><span class="kw3">四肢末梢の無痛性結節・潰瘍。上行性に多発</span></td>'
        '<td><span class="kw3">水槽・水族館・魚。30℃培養</span></td></tr>'
        '<tr><td>尋常性狼瘡</td><td>結核菌</td>'
        '<td>顔面の褐色局面が年単位で拡大。中心瘢痕化</td>'
        '<td><span class="kw3">硝子圧法でリンゴゼリー様</span></td></tr>'
        '<tr><td>皮膚腺病</td><td>結核菌</td>'
        '<td><span class="kw3">深部病巣が皮膚へ穿破。瘻孔・潰瘍</span></td>'
        '<td>頸部リンパ節結核が原発</td></tr>'
        '<tr><td>結核疹（Bazin硬結性紅斑）</td><td>結核菌（アレルギー反応）</td>'
        '<td>下腿の皮下硬結・潰瘍</td>'
        '<td><span class="kw4">病変に菌はいない。ツ反強陽性</span></td></tr>'
        '<tr><td>Hansen病（らい）</td><td>M. leprae</td>'
        '<td><span class="kw3">知覚脱失を伴う皮疹・末梢神経肥厚</span></td>'
        '<td>菌は培養不能。生検・PCR</td></tr>'
        '<tr><td>Buruli潰瘍</td><td>M. ulcerans</td>'
        '<td>広範な無痛性潰瘍</td><td>熱帯・亜熱帯</td></tr></table>'
        '<span class="kw3">「無痛性」が抗酸菌症に共通するキーワード</span>である。'
        '<span class="kw3">化膿菌感染と違って熱感・圧痛・発熱に乏しい</span>点で'
        '最初のふるい分けができる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">熱帯魚の水槽・水族館＋四肢末梢の無痛性結節＝M. marinum</span>。<br>'
         '② <span class="kw3">Ziehl-Neelsen陽性＋結核菌PCR陰性＝非結核性抗酸菌</span>。<br>'
         '③ <span class="kw3">Sabouraud培地陰性で真菌症（スポロトリコーシス等）を除外</span>。<br>'
         '④ <span class="kw3">至適発育温度30℃＝低温培養の依頼が必須</span>。<br>'
         '⑤ <span class="kw">Q.196</span>と同一疾患の別年度出題。'
         '<span class="kw4">検査所見の読み方が毎回の鍵</span>。')),

Q('107D-11', 41, [],
  '<strong>メチシリン感受性黄色ブドウ球菌〈MSSA〉による蜂窩織炎の'
  '第一選択薬はどれか。</strong>',
  [('a', 'セファゾリン', True, '<span class="kw3">セファゾリンは第1世代セファロスポリン</span>で、'
                     '<span class="kw3">グラム陽性球菌（MSSA・連鎖球菌）に対する'
                     '抗菌活性が強く、MSSA感染症の第一選択</span>である。'
                     '<span class="kw3">「感受性がある最も狭域の薬を選ぶ」というのが'
                     '抗菌薬選択の原則</span>で、'
                     '<span class="kw3">MSSAと分かっているならバンコマイシンではなく'
                     'セファゾリン（またはABPC/SBT等）を選ぶ</span>。'
                     '<span class="kw3">MSSA菌血症ではバンコマイシンより'
                     'セファゾリンの方が予後がよい</span>ことが知られている。'),
   ('b', 'バンコマイシン', False, '<span class="kw4">バンコマイシンは MRSA に対する'
                     '標準薬</span>である。'
                     '<span class="kw4">MSSAと判明している症例に使うのは'
                     '「広すぎる」選択で、耐性菌の選択圧・腎毒性・'
                     'TDMの手間という不利益だけが増える</span>。'
                     '<span class="kw4">MSSAに対する殺菌力もβ-ラクタムに劣る</span>。'
                     '<span class="kw4">正答率41％の主因はここを取り違えたためと考えられる</span>。'),
   ('c', 'アジスロマイシン', False, '<span class="kw4">アジスロマイシンはマクロライド系</span>で、'
                     '<span class="kw4">非定型肺炎（マイコプラズマ・クラミジア・レジオネラ）や'
                     '性感染症に用いる</span>。'
                     '<span class="kw4">黄色ブドウ球菌にはマクロライド耐性が多く、第一選択にならない</span>。'),
   ('d', 'クリンダマイシン', False, '<span class="kw4">クリンダマイシンはリンコマイシン系で、'
                     'グラム陽性球菌と嫌気性菌をカバーする</span>。'
                     '<span class="kw3">壊死性軟部組織感染症では毒素産生を抑制する目的で'
                     'β-ラクタムに併用</span>されるが、'
                     '<span class="kw4">単純なMSSA蜂窩織炎の第一選択ではない</span>。'
                     '<span class="kw4">β-ラクタムアレルギー時の代替としての位置づけ</span>である。'),
   ('e', 'テトラサイクリン', False, '<span class="kw4">テトラサイクリン系は'
                     'リケッチア・クラミジア・マイコプラズマ・'
                     '一部の市中型MRSAなどに用いる</span>。'
                     '<span class="kw4">MSSAに対する殺菌力はβ-ラクタムに劣り、'
                     '重症の軟部組織感染症の第一選択にはならない</span>。')],
  '感受性が分かっているなら最も狭域で殺菌力の強い薬を選ぶ。MSSAには第1世代セフェムのセファゾリン。',
  patho=('💊 抗菌薬選択の原則——「広ければよい」ではない',
         '<span class="kw3">抗菌薬は、起炎菌が不明な段階では広く始め（empiric therapy）、'
         '菌と感受性が判明したら最も狭域の薬へ絞る（de-escalation）</span>のが原則である。'
         '<span class="kw3">本問は「MSSAと分かっている」＝'
         '既に絞れる段階なので、狭域で殺菌力の強いセファゾリンを選ぶ</span>。<br>'
         '<span class="kw3">なぜ広域薬を漫然と使ってはいけないか</span>——'
         '<span class="kw3">①耐性菌を選択してしまう、'
         '②常在菌叢を壊してCD腸炎・真菌感染を招く、'
         '③副作用（バンコマイシンなら腎毒性、TDMの負担）、'
         '④実は狭域薬の方が有効なことが多い</span>。'
         '<span class="kw3">MSSA菌血症でバンコマイシンよりセファゾリンやオキサシリン系が'
         '優れるのは、β-ラクタムの殺菌速度がグリコペプチドより速いため</span>である。<br>'
         '<span class="kw3">黄色ブドウ球菌の耐性機序も押さえておく</span>——'
         '<span class="kw3">MRSAは mecA 遺伝子がコードする'
         'ペニシリン結合蛋白PBP2\'（PBP2a）をもち、'
         'β-ラクタム薬が結合できないためすべてのβ-ラクタムに耐性</span>となる。'
         '<span class="kw4">つまりMRSAには「セフェムを強くすれば効く」という発想が通用しない</span>。'
         '<span class="kw4">逆にMSSAはペニシリナーゼは産生するがPBP2\'を持たないので、'
         'ペニシリナーゼ安定性のあるβ-ラクタム（セファゾリン、'
         'アンピシリン/スルバクタム）が有効</span>である。<br>'
         '<span class="kw4">MRSAリスク（医療曝露、透析、長期入院、'
         'MRSA既往、膿瘍形成、市中型MRSA流行地）がある場合は、'
         '培養結果が出るまでバンコマイシンで始める</span>。'),
  deep=('📌 皮膚軟部組織感染症でよく使う抗菌薬',
        '<table class="tb"><tr><th>薬剤</th><th>主な標的</th><th>使いどころ</th></tr>'
        '<tr><td><span class="kw3">ペニシリンG／アモキシシリン</span></td>'
        '<td><span class="kw3">A群β溶連菌</span></td>'
        '<td><span class="kw3">丹　毒</span></td></tr>'
        '<tr><td><span class="kw3">セファゾリン（第1世代セフェム）</span></td>'
        '<td><span class="kw3">MSSA・連鎖球菌</span></td>'
        '<td><span class="kw3">蜂窩織炎（MSSA）、術後創感染</span></td></tr>'
        '<tr><td>アンピシリン/スルバクタム</td><td>MSSA・嫌気性菌・口腔内細菌</td>'
        '<td>咬傷、糖尿病性足感染</td></tr>'
        '<tr><td><span class="kw3">バンコマイシン</span></td>'
        '<td><span class="kw3">MRSA</span></td>'
        '<td><span class="kw3">MRSA感染症、MRSAリスクのある重症例の初期治療</span></td></tr>'
        '<tr><td>クリンダマイシン</td><td>グラム陽性菌・嫌気性菌</td>'
        '<td><span class="kw3">壊死性筋膜炎での毒素産生抑制（β-ラクタムに併用）</span>、'
        'β-ラクタムアレルギー</td></tr>'
        '<tr><td>ミノサイクリン</td><td>市中型MRSA・非結核性抗酸菌</td>'
        '<td>M. marinum感染症</td></tr></table>'
        '<span class="kw3">「丹毒＝ペニシリン」「蜂窩織炎（MSSA）＝セファゾリン」'
        '「MRSA＝バンコマイシン」</span>の3つを軸に覚える。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">MSSA＝セファゾリン（第1世代セフェム）が第一選択</span>。<br>'
         '② <span class="kw4">バンコマイシンはMRSA用。MSSAには過剰かつ殺菌力で劣る</span>。<br>'
         '③ <span class="kw3">感受性が判明したら最も狭域の薬へ絞る（de-escalation）</span>。<br>'
         '④ <span class="kw3">MRSAの耐性機序＝mecA由来のPBP2\'（全β-ラクタムに耐性）</span>。<br>'
         '⑤ <span class="kw3">丹毒はペニシリン系</span>（<span class="kw">Q.207</span>）。')),

Q('107I-25', 95, [('bc', 'CBT')],
  '<strong>連鎖球菌感染症はどれか。</strong>',
  [('a', '丹　毒', True, '<span class="kw3">丹毒はA群β溶血性連鎖球菌'
                     '〈Streptococcus pyogenes〉が真皮浅層と浅在リンパ管に'
                     '感染して生じる</span>。'
                     '<span class="kw3">境界明瞭な鮮紅色の浮腫性紅斑が顔面・下腿に生じ、'
                     '悪寒戦慄を伴う発熱が先行する</span>。'
                     '<span class="kw3">治療はペニシリン系抗菌薬</span>。'),
   ('b', '皮膚腺病', False, '<span class="kw4">皮膚腺病〈scrofuloderma〉は'
                     '結核菌による皮膚結核</span>である。'
                     '<span class="kw4">頸部リンパ節結核などの深部病巣が皮膚へ穿破し、'
                     '瘻孔と潰瘍を形成する</span>。'),
   ('c', '掌蹠膿疱症', False, '<span class="kw4">掌蹠膿疱症は手掌・足底に'
                     '無菌性膿疱を反復する慢性疾患</span>で、'
                     '<span class="kw4">扁桃・歯性の病巣感染や喫煙が増悪因子だが、'
                     '膿疱そのものは無菌</span>である。'
                     '<span class="kw4">「病巣感染に溶連菌が関与し得る」ことと'
                     '「溶連菌感染症である」ことは別</span>である。'),
   ('d', '膿疱性乾癬', False, '<span class="kw4">膿疱性乾癬は発熱を伴って'
                     '全身の紅斑上に無菌性膿疱が多発する乾癬の重症型</span>（指定難病）で、'
                     '感染症ではない。'),
   ('e', 'Celsus禿瘡', False, '<span class="kw4">Celsus禿瘡は深在性の頭部白癬</span>で、'
                     '<span class="kw4">起炎菌は白癬菌（皮膚糸状菌）＝真菌</span>である。'
                     '<span class="kw4">膿疱と排膿があるので細菌感染に見えるが、'
                     '細菌培養は陰性で治療は抗真菌薬の内服</span>である。')],
  '「膿疱＝細菌」ではない。無菌性膿疱（掌蹠膿疱症・膿疱性乾癬）と真菌（Celsus禿瘡）と結核（皮膚腺病）を外す。',
  patho=('🦠 起炎菌で皮膚感染症を仕分ける',
         '<span class="kw3">皮膚感染症の設問は、'
         '「疾患名→起炎微生物」の対応表を持っていれば即答できる</span>ものが多い。'
         '<span class="kw3">本問のように高い正答率（95％）の問題は、'
         'この表を持っているかどうかだけで決まる</span>。'
         '<table class="tb"><tr><th>起炎微生物</th><th>代表疾患</th></tr>'
         '<tr><td><span class="kw3">A群β溶連菌</span></td>'
         '<td><span class="kw3">丹毒、痂皮性膿痂疹、蜂窩織炎、壊死性筋膜炎、猩紅熱</span></td></tr>'
         '<tr><td><span class="kw3">黄色ブドウ球菌</span></td>'
         '<td><span class="kw3">せつ・癰、毛包炎、瘭疽、水疱性膿痂疹、SSSS、TSS</span></td></tr>'
         '<tr><td><span class="kw3">結核菌</span></td>'
         '<td><span class="kw3">尋常性狼瘡、皮膚腺病、結核疹（Bazin硬結性紅斑）</span></td></tr>'
         '<tr><td>非結核性抗酸菌</td><td>M. marinum感染症（水槽・水族館）</td></tr>'
         '<tr><td><span class="kw3">白癬菌（真菌）</span></td>'
         '<td><span class="kw3">体部・股部・足・爪白癬、頭部白癬、Celsus禿瘡</span></td></tr>'
         '<tr><td>マラセチア（真菌）</td><td>癜風、マラセチア毛包炎、脂漏性皮膚炎の増悪</td></tr>'
         '<tr><td>カンジダ（真菌）</td><td>間擦疹、指間びらん症、爪囲炎、乳児寄生菌性紅斑</td></tr>'
         '<tr><td>ヒゼンダニ</td><td>疥　癬</td></tr>'
         '<tr><td>HPV</td><td>尋常性疣贅、扁平疣贅、尖圭コンジローマ</td></tr>'
         '<tr><td>VZV（HHV-3）</td><td>水痘、帯状疱疹</td></tr>'
         '<tr><td>HSV（HHV-1/2）</td><td>単純疱疹、カポジ水痘様発疹症</td></tr>'
         '<tr><td>ポックスウイルス</td><td>伝染性軟属腫（水いぼ）</td></tr>'
         '<tr><td><span class="kw4">なし（無菌・非感染）</span></td>'
         '<td><span class="kw4">掌蹠膿疱症、膿疱性乾癬、壊疽性膿皮症、Behçet病の皮疹</span></td></tr></table>'
         '<span class="kw3">最下段の「無菌」グループを覚えておくと、'
         '本問のような除外問題で強い</span>。'),
  deep=('📌 A群β溶連菌感染症の続発症',
        '<table class="tb"><tr><th>続発症</th><th>先行感染</th><th>時期</th><th>機序・要点</th></tr>'
        '<tr><td><span class="kw3">急性糸球体腎炎</span></td>'
        '<td><span class="kw3">咽頭炎・皮膚感染のどちらからも</span></td>'
        '<td><span class="kw3">1〜3週後</span></td>'
        '<td><span class="kw3">免疫複合体沈着。血尿・浮腫・高血圧・補体C3低下</span></td></tr>'
        '<tr><td><span class="kw4">リウマチ熱</span></td>'
        '<td><span class="kw4">咽頭炎のみ（皮膚感染からは起こらない）</span></td>'
        '<td>2〜4週後</td>'
        '<td><span class="kw4">Jones基準：心炎・多関節炎・舞踏病・輪状紅斑・皮下結節</span></td></tr>'
        '<tr><td>猩紅熱</td><td>咽頭炎</td><td>同時</td>'
        '<td><span class="kw3">発赤毒による全身点状紅斑・苺舌・口囲蒼白・落屑</span></td></tr>'
        '<tr><td><span class="kw4">劇症型溶連菌感染症〈STSS〉</span></td>'
        '<td>軟部組織感染</td><td>数時間〜数日</td>'
        '<td><span class="kw4">壊死性筋膜炎＋多臓器不全。致死率30％。'
        '緊急デブリドマン＋ペニシリン＋クリンダマイシン</span></td></tr></table>'
        '<span class="kw3">「皮膚からは腎炎は起こるがリウマチ熱は起こらない」</span>——'
        '<span class="kw3">この非対称性が頻出</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">丹毒＝A群β溶連菌</span>（CBT・必修レベル）。<br>'
         '② <span class="kw4">掌蹠膿疱症・膿疱性乾癬の膿疱は無菌性</span>。<br>'
         '③ <span class="kw4">皮膚腺病＝結核菌、Celsus禿瘡＝白癬菌</span>。<br>'
         '④ <span class="kw3">溶連菌の皮膚感染からは急性糸球体腎炎が起こる'
         '（リウマチ熱は咽頭感染から）</span>。<br>'
         '⑤ <span class="kw">Q.194</span>・<span class="kw">Q.217</span>と'
         '同型の「起炎菌で仕分ける」問題。')),

]

QUESTIONS += [

Q('106I-53', 78, [('bi', '📷')],
  '45歳の男性。皮疹を主訴に来院した。'
  '<span class="kw">6か月前に右鼠径部の皮疹に気付いた</span>。'
  '<span class="kw">中心部が治癒しながら周辺に拡大し、痒みを伴う</span>という。'
  '右鼠径部の写真を示す。<br>'
  '<strong>治療を開始するための迅速な検査法として最も有用なのはどれか。</strong>',
  [('a', '培養法', False, '<span class="kw4">真菌培養（Sabouraud培地）は菌種の同定に有用</span>だが、'
                     '<span class="kw4">白癬菌は発育が遅く2〜4週を要する</span>。'
                     '<span class="kw4">「治療を開始するための迅速な検査」にはならない</span>。'),
   ('b', 'PCR法', False, '<span class="kw4">PCR法は菌種同定の精度が高い</span>が、'
                     '<span class="kw4">白癬の日常診療で標準的に用いられる検査ではなく、'
                     '外注すれば結果は数日先</span>になる。'
                     '<span class="kw4">迅速性でKOHに劣る</span>。'),
   ('c', '皮膚生検', False, '<span class="kw4">皮膚生検は侵襲があり、'
                     '標本作製に数日かかる</span>。'
                     '<span class="kw4">PAS染色やGrocott染色で菌要素を証明できるが、'
                     'KOHで済む病変にわざわざ行うものではない</span>。'),
   ('d', 'トリコフィチン反応', False, '<span class="kw4">トリコフィチン反応は'
                     '白癬菌抗原に対する遅延型皮内反応</span>で、'
                     '<span class="kw4">判定に48時間を要する</span>。'
                     '<span class="kw4">また既感作の有無を見るだけで、'
                     '現在その病変に菌がいるかどうかは分からない</span>。'
                     '現在は白癬疹の診断補助程度の位置づけである。'),
   ('e', '苛性カリ〈KOH〉直接鏡検法', True,
                     '<span class="kw3">中心治癒＋辺縁拡大の環状紅斑が鼠径部にあり瘙痒を伴う'
                     '＝股部白癬〈いんきんたむし〉</span>である。'
                     '<span class="kw3">KOH直接鏡検は病変辺縁の鱗屑を採取して'
                     '20％KOHを滴下し、加温して鏡検するだけで、'
                     '数分で分節菌糸を確認できる</span>。'
                     '<span class="kw3">無侵襲・安価・その場で結果が出て'
                     '即座に抗真菌薬を開始できる</span>——'
                     '<span class="kw3">「迅速な検査法」の要件をすべて満たす</span>。')],
  '中心治癒＋辺縁拡大の環状紅斑＝股部白癬。数分で結果が出るKOH直接鏡検が第一。培養やPCRは日〜週単位。',
  imgs=['images/106I-53_1.jpeg'],
  patho=('🍄 股部白癬——「中心治癒・辺縁隆起」の環状紅斑',
         '<span class="kw3">股部白癬〈tinea cruris、いんきんたむし〉は、'
         '白癬菌（多くは Trichophyton rubrum）が鼠径部・大腿内側・臀部の'
         '角層に感染したもの</span>である。'
         '<span class="kw3">高温多湿・発汗・密着した衣類という環境因子が発症を促し、'
         '成人男性に多い</span>。'
         '<span class="kw4">自身の足白癬・爪白癬から手や下着を介して'
         '自家接種することが多く、股部白癬を診たら必ず足と爪も診る</span>。<br>'
         '<span class="kw3">臨床像の核心は「遠心性拡大」</span>である——'
         '<span class="kw3">菌は角層の中を外側へ広がるため、'
         '病変の辺縁（＝菌が今いる場所）に炎症が集中して'
         '堤防状に隆起し、鱗屑や小水疱を伴う</span>。'
         '<span class="kw3">一方、中心部は菌が減って炎症が鎮まり、'
         '色素沈着を残して治癒したように見える</span>。'
         '<span class="kw3">この「中心治癒＋辺縁隆起」の環状〜多環状の像が'
         '白癬に特徴的</span>で、本問の「中心部が治癒しながら周辺に拡大し」という'
         '記載がそのまま診断になっている。'
         '<span class="kw3">したがって検体は必ず辺縁から採る</span>。<br>'
         '<span class="kw4">陰嚢が侵されにくいのも股部白癬の特徴</span>で、'
         '<span class="kw4">陰嚢まで赤くなっていればカンジダ症や湿疹を疑う</span>。'
         '<span class="kw3">治療は抗真菌薬の外用を、'
         '皮疹が消えてからも2〜4週続ける</span>（角層のターンオーバーを待つため）。'
         '<span class="kw4">ステロイド外用を先に使うと辺縁の隆起が消えて'
         '「湿疹に見える」異型白癬〈tinea incognito〉になり、'
         'KOHの陽性率も下がる</span>。'),
  deep=('📌 検査の「速さ」で選ぶ——皮膚科の迅速検査',
        '<table class="tb"><tr><th>検査</th><th>所要時間</th><th>分かること</th></tr>'
        '<tr><td><span class="kw3">KOH直接鏡検</span></td>'
        '<td><span class="kw3">数分（その場）</span></td>'
        '<td><span class="kw3">菌要素の有無＝治療開始の可否</span></td></tr>'
        '<tr><td><span class="kw3">Tzanck試験</span></td>'
        '<td><span class="kw3">数分（その場）</span></td>'
        '<td><span class="kw3">ウイルス性巨細胞（ヘルペス）・棘融解細胞（天疱瘡）</span></td></tr>'
        '<tr><td>ダーモスコピー</td><td>その場</td>'
        '<td>色素性病変の良悪、疥癬トンネル、脱毛の性状</td></tr>'
        '<tr><td>Wood灯</td><td>その場</td>'
        '<td>M. canis（黄緑）、紅色陰癬（サンゴ色）、白斑の境界</td></tr>'
        '<tr><td>Gram染色</td><td>十数分</td><td>細菌の形態とGram性</td></tr>'
        '<tr><td>皮膚生検</td><td>数日</td><td>組織診断（確定診断）</td></tr>'
        '<tr><td>パッチテスト</td><td><span class="kw4">48・72時間後に判定</span></td>'
        '<td>アレルギー性接触皮膚炎の原因物質</td></tr>'
        '<tr><td><span class="kw4">真菌培養</span></td>'
        '<td><span class="kw4">2〜4週</span></td><td>菌種同定</td></tr>'
        '<tr><td>抗酸菌培養</td><td><span class="kw4">数週〜2か月</span></td>'
        '<td>抗酸菌の同定（M. marinumは30℃）</td></tr></table>'
        '<span class="kw3">「治療を始めるために今すぐ知りたいこと」に'
        '答えられる検査を選ぶ</span>——これが検査選択問題の共通の解き方である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">股部白癬＝中心治癒＋辺縁隆起の環状紅斑＋瘙痒</span>。<br>'
         '② <span class="kw3">迅速検査はKOH直接鏡検（数分でその場）</span>。<br>'
         '③ <span class="kw3">検体は病変の辺縁から採る（菌がいる場所）</span>。<br>'
         '④ <span class="kw4">培養は2〜4週、パッチテストは48〜72時間＝迅速ではない</span>。<br>'
         '⑤ <span class="kw4">足白癬・爪白癬からの自家接種を必ず確認する</span>。')),

Q('106I-73', 97, [('bi', '📷')],
  '62歳の男性。脱毛を主訴に来院した。'
  '<span class="kw">6か月前から頭頂部に痒み</span>を自覚するようになったため、'
  '<span class="kw">市販の副腎皮質ステロイド外用薬を塗布</span>していた。'
  '<span class="kw">2か月前から同部位に膿疱を生じ、脱毛も認める</span>ようになったため受診した。'
  '<span class="kw">膿疱の細菌培養は陰性</span>である。頭部の写真を示す。<br>'
  '<strong>診断として最も考えられるのはどれか。</strong>',
  [('a', '丹　毒', False, '<span class="kw4">丹毒は悪寒戦慄を伴う発熱と、'
                     '境界明瞭で熱感・圧痛の強い浮腫性紅斑が数日で急速に拡大する</span>。'
                     '<span class="kw4">6か月かけて進行し脱毛を来す経過とは全く異なる</span>。'),
   ('b', '尋常性乾癬', False, '<span class="kw4">尋常性乾癬の頭部病変は、'
                     '境界明瞭な紅斑に厚い銀白色の鱗屑が固着し、'
                     '生え際を越えて広がる</span>のが特徴である。'
                     '<span class="kw4">膿疱は作らず、脱毛も通常は来さない</span>。'
                     '<span class="kw4">爪の点状陥凹・Auspitz現象・Köbner現象を伴う</span>。'),
   ('c', 'Celsus禿瘡', True, '<span class="kw3">①6か月の緩徐な経過、'
                     '②痒みが先行、③ステロイド外用で増悪、'
                     '④膿疱の出現と脱毛、⑤細菌培養が陰性</span>——'
                     '<span class="kw3">Celsus禿瘡〈深在性頭部白癬〉</span>である。'
                     '<span class="kw3">膿疱・排膿があるのに細菌培養が陰性という所見が決め手</span>で、'
                     '<span class="kw3">これは膿疱が細菌感染ではなく'
                     '白癬菌に対する強いアレルギー反応（化膿性肉芽腫）であることを示す</span>。'
                     '<span class="kw3">診断は抜毛のKOH直接鏡検、'
                     '治療は抗真菌薬の内服</span>。'),
   ('d', '尋常性天疱瘡', False, '<span class="kw4">尋常性天疱瘡は抗Dsg3抗体による自己免疫性水疱症</span>で、'
                     '<span class="kw4">口腔粘膜のびらんで初発することが多く、'
                     '弛緩性水疱とびらん、Nikolsky現象陽性</span>を示す。'
                     '<span class="kw4">膿疱を作って脱毛斑となる病態ではない</span>。'),
   ('e', '伝染性膿痂疹', False, '<span class="kw4">伝染性膿痂疹は数日単位で拡大する'
                     '急性の細菌感染症</span>である。'
                     '<span class="kw3">本例は細菌培養が陰性であり、'
                     '6か月の経過も合わない</span>。'
                     '<span class="kw4">また膿痂疹は脱毛を残さない</span>。')],
  '頭部の膿疱＋脱毛＋ステロイドで増悪＋細菌培養陰性＝Celsus禿瘡。抗真菌薬の内服が必要。',
  imgs=['images/106I-73_1.jpeg'],
  patho=('🍄 「細菌培養陰性の膿疱」が指し示すもの',
         '<span class="kw3">膿疱を見たとき、反射的に細菌感染と考えるのは危険である</span>。'
         '<span class="kw3">膿疱は「好中球が集まった」という所見にすぎず、'
         '好中球を呼ぶ原因は細菌以外にもいくつもある</span>。<br>'
         '<span class="kw3">細菌培養が陰性の膿疱を来す病態</span>——'
         '<span class="kw3">①Celsus禿瘡（白癬菌へのⅣ型アレルギーによる化膿性肉芽腫）、'
         '②掌蹠膿疱症（病巣感染・喫煙を背景とする無菌性膿疱）、'
         '③膿疱性乾癬（IL-36経路の自己炎症）、'
         '④急性汎発性発疹性膿疱症〈AGEP〉（薬剤性）、'
         '⑤角層下膿疱症、⑥Behçet病の毛包炎様皮疹、'
         '⑦壊疽性膿皮症（好中球性皮膚症）</span>。'
         '<span class="kw3">これらに抗菌薬を投与しても治らない</span>。<br>'
         '<span class="kw3">本例で「膿疱の細菌培養は陰性である」とわざわざ書かれているのは、'
         'ｅ（伝染性膿痂疹）と頭部の細菌性毛包炎を消し、'
         '「では何が好中球を呼んでいるのか」を考えさせるため</span>である。'
         '<span class="kw3">病歴を見れば、6か月前からの痒み（＝白癬の初期症状）、'
         'ステロイド外用による増悪（＝異型白癬）、'
         '2か月前からの膿疱と脱毛（＝深在化してCelsus禿瘡へ）という'
         '一続きの物語が読み取れる</span>。<br>'
         '<span class="kw4">高齢者の頭部白癬は近年増加しており、'
         '介護を通じた家族内感染や、床屋・美容院でのバリカン共用が'
         '感染経路として報告されている</span>。'
         '<span class="kw4">Celsus禿瘡は診断が遅れると瘢痕性脱毛（永久脱毛）を残す</span>ため、'
         '<span class="kw3">「頭部の膿疱を見たらまずKOH」</span>が実地の鉄則である。'),
  deep=('📌 頭部の皮疹——鱗屑か膿疱か脱毛か',
        '<table class="tb"><tr><th>疾患</th><th>皮疹</th><th>脱毛</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Celsus禿瘡</span></td>'
        '<td><span class="kw3">膿疱・痂皮・排膿・圧痛</span></td>'
        '<td><span class="kw3">あり（易抜毛性）。放置で瘢痕性</span></td>'
        '<td><span class="kw3">KOHで毛内に菌要素。細菌培養陰性</span></td></tr>'
        '<tr><td>頭部白癬（浅在性）</td><td>鱗屑・断毛</td><td>あり</td><td>KOH陽性</td></tr>'
        '<tr><td><span class="kw4">尋常性乾癬</span></td>'
        '<td><span class="kw4">厚い銀白色鱗屑の固着した紅斑。生え際を越える</span></td>'
        '<td><span class="kw4">なし</span></td>'
        '<td><span class="kw4">爪の点状陥凹・Auspitz現象</span></td></tr>'
        '<tr><td>脂漏性皮膚炎</td><td>黄色調の鱗屑（ふけ）・軽い紅斑</td><td>目立たない</td>'
        '<td>眉間・鼻唇溝にも。マラセチア関与</td></tr>'
        '<tr><td>円形脱毛症</td><td><span class="kw4">なし（皮膚は正常）</span></td>'
        '<td><span class="kw4">境界明瞭な円形</span></td>'
        '<td><span class="kw4">感嘆符毛・爪の点状陥凹。自己免疫</span></td></tr>'
        '<tr><td>頭部の毛包炎・せつ</td><td>膿疱・排膿</td><td>一過性</td>'
        '<td><span class="kw3">細菌培養陽性。抗菌薬が有効</span></td></tr></table>'
        '<span class="kw3">「膿疱があって細菌培養が陰性」なら白癬か無菌性膿疱症</span>、'
        '<span class="kw3">「炎症所見がまったくない脱毛」なら円形脱毛症</span>——'
        'この2本の軸で頭部の疾患は大きく分けられる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Celsus禿瘡＝深在性頭部白癬。膿疱・排膿があるのに細菌培養陰性</span>。<br>'
         '② <span class="kw3">ステロイド外用で増悪＝異型白癬〈tinea incognito〉</span>。<br>'
         '③ <span class="kw3">診断は抜毛のKOH直接鏡検、治療は抗真菌薬の内服</span>。<br>'
         '④ <span class="kw4">放置すると瘢痕性脱毛（永久脱毛）を残す</span>。<br>'
         '⑤ <span class="kw">Q.199</span>と同一疾患。'
         '<span class="kw4">乾癬は膿疱も脱毛も作らない</span>。')),

Q('105D-33', 81, [('bi', '📷')],
  '38歳の女性。<span class="kw">看護師</span>。'
  '<span class="kw">全身の強い痒み</span>を主訴に来院した。'
  '<span class="kw">2か月前から全身に痒みがあり、この1週間は痒みのために夜も眠れない</span>という。'
  '<span class="kw">腋窩、乳房下、臍の周囲および陰部に赤い丘疹</span>がみられる。'
  '夫と子どもとの3人暮らしで、<span class="kw">ネコを室内で飼っている</span>。'
  '<span class="kw">丘疹部から採取した検体の顕微鏡写真</span>を示す。<br>'
  '<strong>診断はどれか。</strong>',
  [('a', '疥　癬', True, '<span class="kw3">①2か月前からの全身の痒み（初感染の潜伏期に一致）、'
                     '②夜間に増強して眠れない、'
                     '③腋窩・乳房下・臍周囲・陰部という疥癬の好発部位に赤い丘疹、'
                     '④看護師という職業（患者との身体接触）、'
                     '⑤顕微鏡写真でヒゼンダニの虫体</span>——'
                     '<span class="kw3">疥癬である</span>。'
                     '<span class="kw3">「ネコを飼っている」は他疾患へ誘導するための記載</span>で、'
                     '<span class="kw3">ヒト疥癬虫はヒトからヒトへ伝播する（動物疥癬は'
                     'ヒトでは一過性で自然消退する）</span>。'),
   ('b', 'マダニ症', False, '<span class="kw4">マダニ刺症は野外活動後に'
                     '露出部（頭部・頸部・下肢など）へ1匹が咬着し、'
                     '数mm〜1cmの虫体が皮膚に付着したまま見える</span>。'
                     '<span class="kw4">全身に丘疹が多発して2か月続く病態ではない</span>。'
                     '<span class="kw4">重症熱性血小板減少症候群〈SFTS〉や'
                     '日本紅斑熱の媒介として重要</span>。'),
   ('c', 'ネコノミ症', False, '<span class="kw4">ネコノミ刺症は、'
                     '露出しにくい下腿・大腿など下半身を中心に'
                     '強い痒みを伴う紅斑・水疱が「複数個ずつまとまって」出現する</span>。'
                     '<span class="kw4">ネコの飼育歴に引きずられやすい選択肢だが、'
                     '陰部・臍周囲・腋窩といった疥癬の好発部位に丘疹が多発する分布とは異なり、'
                     '顕微鏡でヒゼンダニが見えている時点で否定される</span>。'),
   ('d', 'ケジラミ症', False, '<span class="kw4">ケジラミ症は主に陰毛部に寄生し、'
                     '陰部の瘙痒と下着に付着する黒色の点状物（糞）、'
                     '毛に固着した卵（虫卵）が特徴</span>である。'
                     '<span class="kw4">性感染症として扱う</span>。'
                     '<span class="kw4">全身の丘疹は生じない</span>。'),
   ('e', 'コロモジラミ症', False, '<span class="kw4">コロモジラミは衣類の縫い目に'
                     '産卵・生息し、体幹を中心に瘙痒と掻破痕、'
                     '慢性化すると色素沈着（浮浪者皮膚）を来す</span>。'
                     '<span class="kw4">衛生状態の悪い環境で問題となり、'
                     '発疹チフス・回帰熱・塹壕熱を媒介する</span>。'
                     '<span class="kw4">虫体は衣類にいるので、皮膚から採取した検体には出てこない</span>。')],
  '夜間に増強する全身の痒み＋腋窩・臍周囲・陰部の丘疹＋顕微鏡でヒゼンダニ＝疥癬。ネコの飼育歴は誘導。',
  imgs=['images/105D-33_1.jpeg'],
  patho=('🦠 疥癬の「好発部位」が診断を決める',
         '<span class="kw3">疥癬の診断で最も再現性が高いのは皮疹の分布である</span>。'
         '<span class="kw3">ヒゼンダニの雌成虫は角層が薄く柔らかい部位を選んでトンネルを掘る</span>——'
         '<span class="kw3">指間、手関節屈側、肘、腋窩、乳房下、臍周囲、'
         '下腹部、鼠径、陰部、殿部</span>。'
         '<span class="kw3">逆に成人では顔面・頭部は侵されない</span>'
         '（<span class="kw4">乳幼児と角化型疥癬では顔面・頭部・手掌足底も侵される</span>）。'
         '<span class="kw3">本問の「腋窩、乳房下、臍の周囲および陰部」は'
         'この好発部位をそのまま並べたもの</span>である。<br>'
         '<span class="kw3">臨床像は3つの要素からなる</span>——'
         '<span class="kw3">①疥癬トンネル：手指の指間や手関節屈側にできる'
         '数mmの灰白色の線状皮疹。先端に雌成虫がいる。'
         '②紅色小丘疹：体幹・四肢に散在する。実際に虫がいるとは限らず'
         'アレルギー反応による。'
         '③疥癬結節：陰嚢・陰茎・腋窩などにできる暗赤色の硬い結節。'
         '男性の陰部にあれば診断的価値が高く、治療後も数か月残る</span>。<br>'
         '<span class="kw3">瘙痒は虫体・虫卵・糞に対するⅣ型アレルギー</span>のため、'
         '<span class="kw3">初感染では感染から発症まで1〜2か月かかる</span>——'
         '<span class="kw3">本例の「2か月前から」という記載はこの潜伏期に一致する</span>。'
         '<span class="kw3">再感染では既に感作されているので数日で発症する</span>。<br>'
         '<span class="kw4">「動物疥癬」（イヌ・ネコのヒゼンダニ）はヒトの皮膚では'
         '繁殖できず、掻痒と丘疹を一過性に起こすだけで数週で自然消退する</span>。'
         '<span class="kw4">本例のようにペットの飼育歴を書く問題は多いが、'
         'ヒトの角層で増殖して2か月続く疥癬はヒト疥癬虫による</span>。'),
  deep=('📌 皮膚に寄生する節足動物',
        '<table class="tb"><tr><th>寄生虫</th><th>部位</th><th>特徴</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">ヒゼンダニ（疥癬）</span></td>'
        '<td><span class="kw3">指間・腋窩・臍周囲・陰部（顔面は避ける）</span></td>'
        '<td><span class="kw3">夜間増強する激痛に近い瘙痒。トンネル・疥癬結節</span></td>'
        '<td><span class="kw3">イベルメクチン内服・フェノトリン外用</span></td></tr>'
        '<tr><td>ケジラミ</td><td><span class="kw3">陰毛部（まれに腋毛・睫毛）</span></td>'
        '<td><span class="kw3">性感染症。下着に黒色点、毛に固着した卵</span></td>'
        '<td>フェノトリンパウダー・剃毛</td></tr>'
        '<tr><td>コロモジラミ</td><td>体幹（虫は衣類の縫い目）</td>'
        '<td><span class="kw4">衛生不良環境。発疹チフス・回帰熱を媒介</span></td>'
        '<td>衣類の熱処理・交換</td></tr>'
        '<tr><td>アタマジラミ</td><td>頭髪</td>'
        '<td>小児の集団発生。毛幹に固着した卵（ふけと違い取れない）</td>'
        '<td>フェノトリンシャンプー</td></tr>'
        '<tr><td><span class="kw4">マダニ</span></td>'
        '<td><span class="kw4">露出部に1匹咬着</span></td>'
        '<td><span class="kw4">SFTS・日本紅斑熱・ライム病を媒介。'
        '無理に引き抜かず口器ごと切除</span></td><td>外科的除去</td></tr>'
        '<tr><td>ネコノミ</td><td>下腿など下半身</td>'
        '<td>数個ずつまとまった瘙痒性紅斑・水疱</td><td>環境駆除・対症療法</td></tr></table>'
        '<span class="kw3">部位（どこに出るか）と虫体がどこにいるか</span>で'
        '機械的に鑑別できる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">疥癬の好発部位＝指間・腋窩・乳房下・臍周囲・陰部。顔面は避ける</span>。<br>'
         '② <span class="kw3">夜間に増強する激しい瘙痒。初感染の潜伏期は1〜2か月</span>。<br>'
         '③ <span class="kw3">診断はKOH直接鏡検でヒゼンダニ・虫卵</span>。<br>'
         '④ <span class="kw4">ケジラミは陰毛部（性感染症）、コロモジラミは衣類</span>。<br>'
         '⑤ <span class="kw4">ペット飼育歴は誘導。動物疥癬はヒトでは自然消退</span>。')),

]

QUESTIONS += [

Q('105I-23', 94, [],
  '<strong>急性の細菌感染症はどれか。</strong>',
  [('a', '丹　毒', True, '<span class="kw3">丹毒はA群β溶血性連鎖球菌が'
                     '真皮浅層と浅在リンパ管に感染して起こる急性の細菌感染症</span>である。'
                     '<span class="kw3">悪寒戦慄を伴う発熱が皮疹に先行し、'
                     '数時間〜数日で境界明瞭な鮮紅色の浮腫性紅斑が拡大する</span>——'
                     '<span class="kw3">「急性」「細菌」の両方を満たすのはこれだけ</span>である。'),
   ('b', '掌蹠膿疱症', False, '<span class="kw4">掌蹠膿疱症は手掌・足底に'
                     '無菌性膿疱を年単位で反復する慢性疾患</span>である。'
                     '<span class="kw4">扁桃炎・歯性感染などの病巣感染や喫煙が増悪因子で、'
                     '病巣の除去（扁桃摘出・禁煙）が奏効することがある</span>が、'
                     '<span class="kw4">膿疱そのものは無菌</span>である。'),
   ('c', '壊疽性膿皮症', False, '<span class="kw4">壊疽性膿皮症は好中球性皮膚症であり感染症ではない</span>。'
                     '<span class="kw4">辺縁が穿掘性・堤防状に隆起する有痛性潰瘍が'
                     '急速に拡大し、潰瘍性大腸炎・Crohn病・関節リウマチ・'
                     '骨髄異形成症候群に合併する</span>。'
                     '<span class="kw4">デブリドマンや外傷で悪化する（pathergy）</span>ため、'
                     '<span class="kw4">感染症と誤診して切開すると致命的に悪化する</span>。'),
   ('d', '急性汎発性膿疱性乾癬', False,
                     '<span class="kw4">急性汎発性膿疱性乾癬〈von Zumbusch型〉は、'
                     '発熱と全身の紅斑上に無菌性膿疱が多発する乾癬の重症型</span>（指定難病）。'
                     '<span class="kw4">発熱するため感染症と紛らわしいが、'
                     '膿疱は無菌で、ステロイド内服の急な中止が誘因になる</span>。'),
   ('e', '顔面播種状粟粒性狼瘡', False,
                     '<span class="kw4">顔面播種状粟粒性狼瘡は、'
                     '顔面（とくに下眼瞼下部）に赤褐色の小結節が播種状に生じる'
                     '慢性の肉芽腫性疾患</span>である。'
                     '<span class="kw4">「狼瘡」の名がつくが結核とは無関係とされ、'
                     '数か月〜年単位で経過して瘢痕を残す</span>。'
                     '<span class="kw4">酒皶様皮膚炎との関連が指摘される</span>。')],
  '「急性」かつ「細菌」の二条件で絞る。無菌性膿疱症2つ・好中球性皮膚症・慢性肉芽腫を外して丹毒。',
  patho=('🩺 「膿疱を作るが感染症ではない」疾患群を覚える',
         '<span class="kw3">本問と Q.194・Q.213 は同型の出題で、'
         '選択肢に必ず「無菌性膿疱症」が紛れ込む</span>。'
         '<span class="kw3">これらは好中球が皮膚に集まる自己炎症性の機序を持ち、'
         '抗菌薬では治らない</span>——'
         '<span class="kw3">誤診すると抗菌薬を漫然と投与し、'
         '本来必要な免疫調整治療が遅れる</span>ため臨床的にも重要である。<br>'
         '<span class="kw3">①掌蹠膿疱症</span>：'
         '<span class="kw3">手掌・足底の無菌性膿疱を反復。'
         '喫煙と病巣感染（扁桃・歯・副鼻腔）が増悪因子。'
         '胸鎖関節痛を伴う掌蹠膿疱症性骨関節炎〈PAO〉を合併する</span>。'
         '<span class="kw4">治療は禁煙・病巣除去・ビタミンD3外用・光線療法・'
         '難治例に生物学的製剤</span>。<br>'
         '<span class="kw3">②膿疱性乾癬（汎発型）</span>：'
         '<span class="kw3">発熱・全身倦怠感とともに全身の紅斑上に無菌性膿疱が'
         '多発し、膿海〈lake of pus〉を形成する。指定難病</span>。'
         '<span class="kw4">誘因はステロイド内服の急な中止、感染、妊娠。'
         '治療はレチノイド・シクロスポリン・生物学的製剤</span>。<br>'
         '<span class="kw3">③壊疽性膿皮症</span>：'
         '<span class="kw3">小さな膿疱・紅色丘疹から始まり、'
         '急速に穿掘性の有痛性潰瘍へ拡大する。'
         '辺縁は堤防状に隆起し暗紫紅色を帯びる</span>。'
         '<span class="kw3">潰瘍性大腸炎・Crohn病・関節リウマチ・'
         '骨髄異形成症候群に合併</span>。'
         '<span class="kw3">最重要事項は pathergy（外傷やデブリドマンで悪化する）</span>で、'
         '<span class="kw3">治療はステロイド全身投与・免疫抑制薬・生物学的製剤</span>。<br>'
         '<span class="kw4">④Sweet病（急性熱性好中球性皮膚症）も同じ仲間で、'
         '発熱＋有痛性の隆起性紅斑＋好中球増多を示し、'
         '血液悪性腫瘍の合併に注意する</span>。'),
  deep=('📌 「急性の細菌感染症はどれか」型の解き方',
        '<table class="tb"><tr><th>選択肢のタイプ</th><th>見分け方</th><th>本問での該当</th></tr>'
        '<tr><td><span class="kw3">急性の細菌感染症</span></td>'
        '<td><span class="kw3">発熱＋数日以内の急速な経過＋菌が病巣にいる</span></td>'
        '<td><span class="kw3">丹毒、伝染性膿痂疹、蜂窩織炎、せつ</span></td></tr>'
        '<tr><td><span class="kw4">無菌性膿疱症</span></td>'
        '<td><span class="kw4">膿疱の細菌培養が陰性・慢性反復</span></td>'
        '<td><span class="kw4">掌蹠膿疱症、膿疱性乾癬</span></td></tr>'
        '<tr><td><span class="kw4">好中球性皮膚症</span></td>'
        '<td><span class="kw4">全身疾患に合併・pathergy・ステロイドが効く</span></td>'
        '<td><span class="kw4">壊疽性膿皮症、Sweet病</span></td></tr>'
        '<tr><td><span class="kw4">慢性肉芽腫性疾患</span></td>'
        '<td><span class="kw4">月〜年単位・無症候・瘢痕を残す</span></td>'
        '<td><span class="kw4">顔面播種状粟粒性狼瘡、尋常性狼瘡、サルコイドーシス</span></td></tr>'
        '<tr><td>真菌症</td><td>KOH陽性・抗真菌薬が効く</td>'
        '<td>癜風、白癬、Celsus禿瘡</td></tr></table>'
        '<span class="kw3">「急性」という語で慢性肉芽腫と無菌性膿疱症が落ち、'
        '「細菌」で真菌症が落ちる</span>——'
        '<span class="kw3">設問文の2語を条件として順に適用するだけで解ける</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">丹毒＝急性の細菌感染症（A群β溶連菌）</span>。<br>'
         '② <span class="kw4">掌蹠膿疱症・膿疱性乾癬の膿疱は無菌性</span>。<br>'
         '③ <span class="kw4">壊疽性膿皮症は感染症ではない。'
         'デブリドマンで悪化（pathergy）し、治療はステロイド</span>。<br>'
         '④ <span class="kw4">顔面播種状粟粒性狼瘡は慢性肉芽腫</span>。<br>'
         '⑤ <span class="kw">Q.194</span>・<span class="kw">Q.213</span>と同型。'
         '<span class="kw3">「急性」「細菌」の2語で機械的に絞る</span>。')),

Q('104I-72', 61, [('bi', '📷')],
  '62歳の女性。顔面の発疹と発熱とを主訴に来院した。'
  '<span class="kw">2日前に突然、右耳介、右頬部および右側頸部に発赤が出現</span>し、'
  '<span class="kw">悪寒と戦慄</span>とがみられた。'
  '<span class="kw">体温38.2℃</span>。顔面の写真を示す。<br>'
  '<strong>治療薬として適切なのはどれか。</strong>',
  [('a', '抗菌薬', True, '<span class="kw3">①2日前に「突然」発症、'
                     '②右耳介・右頬部・右側頸部という顔面片側の発赤、'
                     '③悪寒と戦慄、④38.2℃の発熱</span>——'
                     '<span class="kw3">丹毒である</span>。'
                     '<span class="kw3">起炎菌はA群β溶血性連鎖球菌なので、'
                     '治療はペニシリン系を中心とした抗菌薬</span>となる。'
                     '<span class="kw3">悪寒戦慄を伴う発熱＋局所の熱感を持つ紅斑＝細菌感染</span>という'
                     '対応を確実にしておきたい。'),
   ('b', '抗真菌薬', False, '<span class="kw4">顔面白癬・カンジダ症は鱗屑を伴い'
                     '数週間かけて緩徐に進行する</span>。'
                     '<span class="kw4">2日で悪寒戦慄と38℃台の発熱を伴う経過は真菌症では説明できない</span>。'),
   ('c', '抗ウイルス薬', False, '<span class="kw4">耳介の発赤から'
                     'Ramsay Hunt症候群（耳性帯状疱疹）を連想したくなる</span>が、'
                     '<span class="kw3">帯状疱疹なら外耳道・耳介に集簇性の小水疱が並び、'
                     '顔面神経麻痺・耳鳴・めまい・難聴を伴う</span>のが典型である。'
                     '<span class="kw4">本例は水疱の記載がなく、'
                     '悪寒戦慄を伴う発熱が突然生じるのも帯状疱疹らしくない</span>。'),
   ('d', '抗ヒスタミン薬', False, '<span class="kw4">抗ヒスタミン薬は蕁麻疹や'
                     '瘙痒に対する治療</span>である。'
                     '<span class="kw4">本例には瘙痒の記載がなく、'
                     '発熱と悪寒戦慄という全身の感染徴候を説明できない</span>。'),
   ('e', '副腎皮質ステロイド', False,
                     '<span class="kw4">細菌感染にステロイドを投与すれば'
                     '局所免疫を抑制して感染を増悪させ、'
                     '壊死性筋膜炎への進展を招きかねない</span>。'
                     '<span class="kw4">「赤い＝炎症＝ステロイド」という短絡が'
                     '最も危険な誤りである</span>。')],
  '突然発症＋顔面片側の発赤＋悪寒戦慄＋38.2℃＝丹毒。治療は抗菌薬（ペニシリン系）。',
  imgs=['images/104I-72_1.jpeg'],
  patho=('🩺 悪寒戦慄という一語の重み',
         '<span class="kw3">「悪寒戦慄〈shaking chill, rigor〉」は、'
         '毛布をかけても止まらないほど全身がガタガタ震える状態を指す</span>。'
         '<span class="kw3">単なる「寒気がする」とは区別され、'
         '菌血症の存在を強く示唆する所見</span>として救急・感染症領域で重視される。'
         '<span class="kw3">本章では Q.191・Q.193・Q.198・Q.218 に繰り返し登場し、'
         'いずれも細菌感染（丹毒・敗血症）へ誘導する合図</span>になっている。<br>'
         '<span class="kw3">機序は、菌体成分（LPSなど）が単球・マクロファージを刺激して'
         'IL-1・IL-6・TNF-αを放出させ、'
         '視床下部の体温調節中枢のセットポイントが急激に上昇するため</span>である。'
         '<span class="kw3">実際の体温がセットポイントに追いつくまで'
         '「寒い」と感じ、骨格筋の不随意収縮（戦慄）で熱を産生する</span>。'
         '<span class="kw4">セットポイントが急に大きく上がるほど戦慄は激しくなるので、'
         '「震えが止まらない」は炎症性サイトカインの急激な立ち上がり＝'
         '菌血症を示唆する</span>。<br>'
         '<span class="kw3">丹毒の治療の実際</span>——'
         '<span class="kw3">軽症〜中等症は経口ペニシリン系（アモキシシリン等）を'
         '10〜14日。全身状態不良・顔面例・高齢者・免疫低下例は'
         '入院のうえベンジルペニシリンの点滴静注</span>。'
         '<span class="kw3">患部の安静・挙上（下腿例）も治療の一部</span>である。'
         '<span class="kw4">再発を繰り返す例では侵入門戸（足白癬・鼻前庭炎・'
         '外傷）の治療とリンパ浮腫の管理が予防になる</span>。'
         '<span class="kw4">正答率61％と意外に低いのは、耳介の発赤から'
         'Ramsay Hunt症候群を想起して抗ウイルス薬を選んだ受験生が'
         '一定数いたためと考えられる</span>——'
         '<span class="kw3">水疱がなく悪寒戦慄がある時点で細菌感染に寄せる</span>。'),
  deep=('📌 顔面片側の発赤——丹毒と帯状疱疹の分岐',
        '<table class="tb"><tr><th>項目</th><th>丹　毒</th><th>帯状疱疹</th></tr>'
        '<tr><td>皮疹</td><td><span class="kw3">境界明瞭な浮腫性紅斑（水疱なし）</span></td>'
        '<td><span class="kw3">神経支配域に一致した集簇性小水疱</span></td></tr>'
        '<tr><td>分布</td><td><span class="kw3">解剖学的な境界に従わず面状に拡大</span></td>'
        '<td><span class="kw3">皮膚分節〈dermatome〉に一致し正中を越えない</span></td></tr>'
        '<tr><td>先行症状</td><td><span class="kw3">悪寒戦慄を伴う発熱</span></td>'
        '<td><span class="kw3">数日前からの神経痛（ピリピリした痛み）</span></td></tr>'
        '<tr><td>発熱</td><td><span class="kw3">38〜39℃台</span></td><td>微熱程度</td></tr>'
        '<tr><td>合併症</td><td>急性糸球体腎炎、リンパ浮腫、壊死性筋膜炎</td>'
        '<td><span class="kw4">Ramsay Hunt症候群（顔面神経麻痺・耳鳴・めまい）、'
        'Hutchinson徴候（鼻尖の水疱＝眼合併症のリスク）、帯状疱疹後神経痛</span></td></tr>'
        '<tr><td>治療</td><td><span class="kw3">ペニシリン系抗菌薬</span></td>'
        '<td><span class="kw3">アシクロビル・バラシクロビル（発症72時間以内）</span></td></tr></table>'
        '<span class="kw3">「水疱があるか」と「悪寒戦慄があるか」の2点で'
        'ほぼ確実に分かれる</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">悪寒戦慄＋発熱＋顔面の発赤＝丹毒→抗菌薬</span>。<br>'
         '② <span class="kw3">悪寒戦慄は菌血症を示唆する所見</span>。<br>'
         '③ <span class="kw4">水疱がなければ帯状疱疹ではない</span>。<br>'
         '④ <span class="kw4">感染にステロイドは禁忌的（増悪させる）</span>。<br>'
         '⑤ <span class="kw3">再発予防には侵入門戸（足白癬等）の治療</span>。'
         '<span class="kw">Q.191</span>・<span class="kw">Q.193</span>・'
         '<span class="kw">Q.207</span>と同一疾患。')),

Q('103I-21', 87, [],
  '<strong>苛性カリ〈KOH〉直接鏡検法が診断に有用なのはどれか。</strong>',
  [('a', '癜　風', True, '<span class="kw3">癜風はマラセチア〈Malassezia〉による表在性真菌症</span>で、'
                     '<span class="kw3">角層に菌が存在するためKOH直接鏡検が診断に直結する</span>。'
                     '<span class="kw3">鱗屑をKOHで透明化すると、'
                     '短く湾曲した菌糸と球形胞子の集塊が混在して見える'
                     '（spaghetti and meatballs）</span>。'
                     '<span class="kw3">KOHが有用なのは「角層に菌要素がいる疾患」'
                     '＝白癬・カンジダ・癜風・疥癬</span>である。'),
   ('b', '単純疱疹', False, '<span class="kw4">単純疱疹は単純ヘルペスウイルスによる</span>。'
                     '<span class="kw4">ウイルスは光学顕微鏡では見えず、KOHでは診断できない</span>。'
                     '<span class="kw3">迅速診断にはTzanck試験（水疱底の擦過物をGiemsa染色し、'
                     'ウイルス性巨細胞＝多核巨細胞を見る）</span>を用いる。'),
   ('c', '伝染性軟属腫', False, '<span class="kw4">伝染性軟属腫〈水いぼ〉は'
                     'ポックスウイルス科の伝染性軟属腫ウイルスによる</span>。'
                     '<span class="kw4">診断は臨床所見（中心臍窩をもつ光沢のあるドーム状丘疹）で付き、'
                     '圧出した粥状物に軟属腫小体〈Henderson-Paterson小体〉を'
                     'ギムザ染色などで確認できる</span>。KOHは用いない。'),
   ('d', '伝染性膿痂疹', False, '<span class="kw4">伝染性膿痂疹は細菌（黄色ブドウ球菌・溶連菌）による</span>。'
                     '<span class="kw4">細菌の検出にはGram染色と細菌培養を用いる</span>。'
                     '<span class="kw4">KOHはケラチンを溶かして真菌や虫体を見る検査で、'
                     '細菌の同定には適さない</span>。'),
   ('e', '尖圭コンジローマ', False, '<span class="kw4">尖圭コンジローマはHPV 6・11型による性感染症</span>。'
                     '<span class="kw4">診断は臨床所見と生検（コイロサイトーシス）、'
                     '必要に応じてHPV検査</span>で行う。'
                     '<span class="kw4">酢酸加工（3〜5％酢酸を塗ると白色化する）が補助的に使われることはあるが、'
                     'KOHは無関係</span>である。')],
  'KOHが有用なのは角層に菌要素がいる疾患＝白癬・カンジダ・癜風・疥癬。ウイルスと細菌には使えない。',
  patho=('🔬 KOHで見えるもの／見えないもの',
         '<span class="kw3">KOH直接鏡検はケラチン（角質）を溶かして'
         '「ケラチンを持たない構造物」を浮かび上がらせる検査</span>である。'
         '<span class="kw3">したがって見えるのは、角層の中に一定の大きさをもって'
         '存在するもの——真菌の菌糸・胞子と、ダニの虫体・虫卵</span>に限られる。'
         '<span class="kw3">細菌（1μm前後）は小さすぎて形態的な同定ができず、'
         'ウイルスは光学顕微鏡の分解能を超えている</span>。<br>'
         '<span class="kw3">KOHが診断に直結する疾患</span>——'
         '<span class="kw3">①白癬（体部・股部・足・爪・頭部）：隔壁のある分節・分枝菌糸。'
         '②カンジダ症：仮性菌糸＋ブドウ房状の分芽胞子。'
         '③癜風：短く湾曲した菌糸＋球形胞子の集塊。'
         '④疥癬：ヒゼンダニの虫体・虫卵・糞</span>。'
         '<span class="kw4">この4疾患は「鱗屑や角質を採ってKOH」で外来完結できる</span>。<br>'
         '<span class="kw3">代わりに使う検査を対にして覚える</span>——'
         '<span class="kw3">ウイルス性水疱（単純疱疹・水痘・帯状疱疹）にはTzanck試験、'
         '細菌にはGram染色と培養、抗酸菌にはZiehl-Neelsen染色と培養・PCR、'
         '自己免疫性水疱症には蛍光抗体直接法、'
         '接触皮膚炎にはパッチテスト、腫瘍には生検</span>。<br>'
         '<span class="kw4">なおTzanck試験で見えるウイルス性巨細胞は'
         '単純疱疹・水痘・帯状疱疹に共通で、この3つを区別できない</span>——'
         '<span class="kw4">区別するには臨床像（分布）か抗原検査・PCRが要る</span>。'),
  deep=('📌 皮膚科の「その場でできる検査」対応表',
        '<table class="tb"><tr><th>疑う疾患</th><th>行う検査</th><th>見えるもの</th></tr>'
        '<tr><td><span class="kw3">白癬・カンジダ・癜風</span></td>'
        '<td><span class="kw3">KOH直接鏡検（鱗屑）</span></td>'
        '<td><span class="kw3">菌糸・胞子</span></td></tr>'
        '<tr><td><span class="kw3">疥　癬</span></td>'
        '<td><span class="kw3">KOH直接鏡検（丘疹・トンネル）＋ダーモスコピー</span></td>'
        '<td><span class="kw3">虫体・虫卵／トンネル先端の三角形の影</span></td></tr>'
        '<tr><td><span class="kw3">単純疱疹・水痘・帯状疱疹</span></td>'
        '<td><span class="kw3">Tzanck試験（水疱底の擦過）</span></td>'
        '<td><span class="kw3">ウイルス性巨細胞（多核巨細胞）</span></td></tr>'
        '<tr><td>天疱瘡</td><td>Tzanck試験</td><td>棘融解細胞</td></tr>'
        '<tr><td>伝染性膿痂疹・毛包炎</td><td>Gram染色・細菌培養</td>'
        '<td>Gram陽性球菌</td></tr>'
        '<tr><td><span class="kw3">皮膚抗酸菌症</span></td>'
        '<td><span class="kw3">Ziehl-Neelsen染色・培養・PCR</span></td>'
        '<td><span class="kw3">赤い抗酸菌</span></td></tr>'
        '<tr><td>伝染性軟属腫</td><td>圧出内容のギムザ染色</td>'
        '<td>軟属腫小体</td></tr>'
        '<tr><td>紅色陰癬・頭部白癬</td><td>Wood灯</td>'
        '<td>サンゴ色／黄緑色蛍光</td></tr></table>'
        '<span class="kw3">「病原体の大きさ」で検査は決まる</span>——'
        '<span class="kw3">虫（数百μm）とカビ（数μm）はKOHで見え、'
        '細菌（1μm）は染色が要り、ウイルスは細胞変化を通してしか見えない</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">KOH直接鏡検＝白癬・カンジダ・癜風・疥癬</span>。<br>'
         '② <span class="kw3">癜風のKOH像＝短い菌糸＋球形胞子の集塊</span>。<br>'
         '③ <span class="kw3">ウイルス性水疱はTzanck試験（ウイルス性巨細胞）</span>。<br>'
         '④ <span class="kw4">細菌はGram染色・培養、抗酸菌はZiehl-Neelsen染色</span>。<br>'
         '⑤ <span class="kw">Q.201</span>（手技）・<span class="kw">Q.214</span>（迅速性）と'
         '併せてKOHは本章で3回問われている。')),

Q('101A-6', 48, [('bi', '📷')],
  '<span class="kw">生後3か月の乳児</span>。'
  '<span class="kw">昨日から左肩に紅斑が出現</span>し、'
  '<span class="kw">本日、全身に拡大傾向</span>を認めたため来院した。'
  '顔面と胸部との写真（A，B）を示す。<br>'
  '<strong>正しいのはどれか。<span class="kw2">2つ選べ</span>。</strong>',
  [('a', '溶連菌感染症である。', False,
                     '<span class="kw4">ブドウ球菌性熱傷様皮膚症候群〈SSSS〉の起炎菌は'
                     '黄色ブドウ球菌であって溶連菌ではない</span>。'
                     '<span class="kw4">黄色ブドウ球菌が産生する表皮剝脱毒素〈ET〉が'
                     '血行性に全身へ回ってDsg1を分解する</span>。'
                     '<span class="kw4">溶連菌が起こす毒素性疾患は猩紅熱</span>で、'
                     '<span class="kw4">こちらは苺舌・口囲蒼白・全身の点状紅斑を示し'
                     '表皮剝離は来さない</span>。'),
   ('b', '粘膜症状はまれである。', True,
                     '<span class="kw3">SSSSでは粘膜疹を来さない</span>。'
                     '<span class="kw3">毒素が分解するDsg1は表皮上層に多いが、'
                     '粘膜ではDsg3が豊富でDsg1の欠損を代償できるため'
                     '（デスモグレイン代償説）</span>である。'
                     '<span class="kw3">これがSJS/TENとの決定的な鑑別点</span>で、'
                     '<span class="kw3">SJS/TENでは眼・口唇・外陰の粘膜疹が必発</span>である。'),
   ('c', '急性糸球体腎炎を続発する。', False,
                     '<span class="kw4">急性糸球体腎炎はA群β溶連菌感染（咽頭炎・膿痂疹）の続発症</span>であり、'
                     '<span class="kw4">黄色ブドウ球菌の毒素性疾患であるSSSSでは起こらない</span>。'
                     '<span class="kw4">ａと同じく「溶連菌」に引きずられた誤答の典型</span>である。'),
   ('d', 'Nikolsky現象が陽性となる。', True,
                     '<span class="kw3">Nikolsky現象は「一見正常に見える皮膚を'
                     '指で擦ると表皮が剝離する」現象</span>で、'
                     '<span class="kw3">表皮細胞間の接着が広範に破綻していることを意味する</span>。'
                     '<span class="kw3">SSSSでは毒素が全身の表皮でDsg1を分解しているため、'
                     '皮疹のない部位でも陽性になる</span>。'
                     '<span class="kw3">乳児が「触ると痛がる・抱っこを嫌がる」のはこのため</span>である。'),
   ('e', '副腎皮質ステロイドが有効である。', False,
                     '<span class="kw4">SSSSは細菌感染（＋その毒素）による疾患であり、'
                     'ステロイドは感染を増悪させるため用いない</span>。'
                     '<span class="kw3">治療は抗ブドウ球菌薬（セフェム系等）の全身投与と、'
                     '熱傷に準じた輸液・保温・創部管理・疼痛管理</span>である。'
                     '<span class="kw4">なお鑑別疾患のSJS/TENではステロイドやIVIGが用いられる</span>——'
                     '<span class="kw4">両者を取り違えると治療方針が正反対になる</span>。')],
  '乳児＋1日で全身へ拡大する紅斑と表皮剝離＝SSSS。粘膜疹なし・Nikolsky現象陽性が2つの正解。',
  imgs=['images/101A-6_1.jpeg', 'images/101A-6_2.jpeg'],
  patho=('🦠 SSSSの臨床経過と、間違えやすい4点',
         '<span class="kw3">SSSSは、鼻腔・咽頭・臍・結膜・膿痂疹病巣などに'
         '定着した黄色ブドウ球菌が産生する表皮剝脱毒素〈ET-A/ET-B〉が'
         '血行性に全身へ播種して起こる</span>。'
         '<span class="kw3">好発は生後6か月〜5歳で、'
         '本例のような乳児例も典型的</span>である。'
         '<span class="kw3">乳幼児に多い理由は、'
         '①ETに対する中和抗体を持たない、'
         '②腎からのET排泄能が未熟——の2点</span>である。<br>'
         '<span class="kw3">経過は定型的である</span>——'
         '<span class="kw3">①発熱・不機嫌・接触痛で始まる。'
         '②口囲・眼囲・頸部の紅斑と、口角から放射状に走る亀裂。'
         '③1〜2日で頸部・腋窩・鼠径などの間擦部を中心に'
         'びまん性紅斑が全身へ拡大。'
         '④紅斑上に弛緩性水疱が生じ、すぐ破れて広範なびらん（熱傷様）。'
         '⑤Nikolsky現象陽性。'
         '⑥1〜2週で落屑して治癒し、瘢痕を残さない</span>。<br>'
         '<span class="kw3">受験生が間違えやすい4点を確認する</span>——'
         '<span class="kw3">①起炎菌は黄色ブドウ球菌（溶連菌ではない）。'
         '②粘膜疹はない（SJS/TENとの鑑別点）。'
         '③急性糸球体腎炎は続発しない（それは溶連菌）。'
         '④ステロイドは用いない（抗菌薬＋支持療法）</span>。'
         '<span class="kw4">正答率48％と低いのは、'
         '「乳児の全身の紅斑＝溶連菌」という連想（ａ・ｃ）に'
         '引きずられるため</span>と考えられる。<br>'
         '<span class="kw4">皮疹部の培養は陰性になるので、'
         '菌を探すなら鼻腔・咽頭・眼脂・臍などの巣を培養する</span>。'),
  deep=('📌 Nikolsky現象——どこで陽性になり、何を意味するか',
        '<table class="tb"><tr><th>疾患</th><th>Nikolsky現象</th><th>裂隙の高さ</th>'
        '<th>粘膜疹</th></tr>'
        '<tr><td><span class="kw3">SSSS</span></td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw3">顆粒層（表皮内・浅い）</span></td>'
        '<td><span class="kw3">なし</span></td></tr>'
        '<tr><td><span class="kw3">SJS／TEN</span></td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw4">表皮全層壊死・表皮下</span></td>'
        '<td><span class="kw4">必発</span></td></tr>'
        '<tr><td><span class="kw3">尋常性天疱瘡</span></td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw3">基底層直上（表皮内）</span></td>'
        '<td><span class="kw3">あり（口腔で初発）</span></td></tr>'
        '<tr><td>落葉状天疱瘡</td><td>陽性</td><td>顆粒層</td><td>なし</td></tr>'
        '<tr><td><span class="kw4">水疱性類天疱瘡</span></td>'
        '<td><span class="kw4">陰性</span></td>'
        '<td><span class="kw4">表皮下（基底膜部）</span></td>'
        '<td>少ない</td></tr></table>'
        '<span class="kw3">Nikolsky現象が陽性なのは「表皮の中（または表皮全層）で'
        '剝離が起きる疾患」</span>である。'
        '<span class="kw3">水疱性類天疱瘡は表皮ごと真皮から浮くので'
        '緊満性水疱となり、Nikolsky現象は陰性</span>——'
        '<span class="kw3">陽性／陰性の分岐は「剝がれる面が表皮内か表皮下か」</span>で決まる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">SSSS＝黄色ブドウ球菌の表皮剝脱毒素（溶連菌ではない）</span>。<br>'
         '② <span class="kw3">粘膜疹はない／Nikolsky現象は陽性</span>——本問の正解2つ。<br>'
         '③ <span class="kw4">急性糸球体腎炎は続発しない（それは溶連菌感染症）</span>。<br>'
         '④ <span class="kw3">治療は抗菌薬全身投与＋熱傷に準じた支持療法。'
         'ステロイドは用いない</span>。<br>'
         '⑤ <span class="kw3">瘢痕を残さず治癒する</span>。'
         '<span class="kw">Q.197</span>と同一疾患。')),

Q('99G-8', None, [('bi', '📷')],
  '4歳の女児。発疹を主訴として来院した。'
  '<span class="kw">前胸部と腹壁とに発赤と水疱とを伴う発疹</span>を認める。'
  '<span class="kw">発疹の数は増加し、分布も拡大</span>してきている。'
  '<span class="kw">通園している幼稚園で同様の発疹を認める児が数人いる</span>という。'
  '上腹部の写真を示す。<br>'
  '<strong>適切な処置はどれか。</strong>',
  [('a', 'アルコール消毒', False, '<span class="kw4">びらん面へのアルコール消毒は'
                     '強い疼痛を与え、健常な表皮や創傷治癒に必要な細胞まで障害する</span>。'
                     '<span class="kw4">現在の創傷管理では、'
                     'びらん・潰瘍面の消毒は原則行わず、'
                     '石鹸と流水による洗浄で細菌数を減らす</span>のが標準である。'),
   ('b', '抗菌薬服用', True, '<span class="kw3">①小児、②発赤と水疱を伴う発疹が'
                     '増加・拡大している、③幼稚園で同様の発疹の児が数人いる（集団発生）</span>——'
                     '<span class="kw3">伝染性膿痂疹〈とびひ〉である</span>。'
                     '<span class="kw3">水疱を伴うので水疱性膿痂疹＝黄色ブドウ球菌型</span>と考えられる。'
                     '<span class="kw3">皮疹が多発・拡大している例では'
                     '抗菌薬の内服（セフェム系等）を行い、'
                     '併せて患部の洗浄と抗菌薬外用、被覆を行う</span>。'),
   ('c', '抗ウイルス薬服用', False, '<span class="kw4">水疱を伴うため水痘を鑑別に挙げたくなる</span>が、'
                     '<span class="kw4">水痘なら発熱を伴い、'
                     '紅斑・水疱・膿疱・痂皮が同時に混在する「多様性」を示して'
                     '全身（頭髪部・口腔内を含む）に散布性に出る</span>。'
                     '<span class="kw4">前胸部と腹壁に限局し、'
                     'びらんと痂皮を作りながら接触部位へ広がる分布は膿痂疹である</span>。'),
   ('d', '抗ヒスタミン薬服用', False, '<span class="kw4">抗ヒスタミン薬は瘙痒に対する対症療法</span>で、'
                     '<span class="kw4">細菌感染そのものは治らない</span>。'
                     '<span class="kw4">掻破を減らす補助として併用することはあっても、'
                     '「適切な処置」の主体にはならない</span>。'),
   ('e', '副腎皮質ステロイド軟膏塗布', False,
                     '<span class="kw4">細菌感染にステロイド外用を行えば'
                     '局所免疫を抑制して感染を拡大させる</span>。'
                     '<span class="kw4">膿痂疹は掻破した手を介して自家接種で広がる疾患であり、'
                     'ステロイドは病勢を助長する</span>。')],
  '小児＋水疱を伴う発疹の増加拡大＋幼稚園での集団発生＝伝染性膿痂疹。多発例は抗菌薬内服。',
  imgs=['images/99G-8_1.jpeg'],
  patho=('🦠 とびひの実際——治療と登園の扱い',
         '<span class="kw3">伝染性膿痂疹は小児の代表的な細菌感染症で、'
         '「水疱性」と「痂皮性」の2型がある</span>。'
         '<span class="kw3">水疱性膿痂疹は黄色ブドウ球菌の表皮剝脱毒素によるもので、'
         '夏季の乳幼児に多く、弛緩性水疱がすぐ破れてびらん・薄い痂皮となる</span>。'
         '<span class="kw3">痂皮性膿痂疹はA群β溶連菌によるもので、'
         '厚い黄褐色の痂皮を伴い、季節・年齢を問わず'
         '発熱や咽頭炎を伴うことがある</span>。<br>'
         '<span class="kw3">拡大の機序は自家接種</span>である——'
         '<span class="kw3">病変を掻いた手指に菌が付き、'
         '別の部位に触れて次々に新病変を作る（＝飛び火）</span>。'
         '<span class="kw3">したがって治療の要点は「菌を減らす」「掻かせない」'
         '「他人に移さない」の3つ</span>になる。<br>'
         '<span class="kw3">具体的には、'
         '①患部を石鹸と流水で洗って清潔にする（消毒薬は不要）、'
         '②抗菌薬外用、'
         '③皮疹が多発・拡大している例や発熱を伴う例では抗菌薬内服'
         '（セフェム系。溶連菌型ならペニシリン系）、'
         '④爪を短く切る、⑤ガーゼ等で被覆して接触を防ぐ、'
         '⑥タオル・浴槽の共用を避ける</span>。<br>'
         '<span class="kw3">学校保健安全法上、伝染性膿痂疹は'
         '「第三種の感染症（その他の感染症）」に相当し、'
         '一律の出席停止はない</span>——'
         '<span class="kw3">患部を覆えば登園・登校できる</span>のが原則である。'
         '<span class="kw4">ただしプール（水を介した接触と衣類の共用）は'
         '治癒するまで控える</span>。'
         '<span class="kw4">痂皮性膿痂疹（溶連菌型）では'
         '急性糸球体腎炎の続発に注意し、'
         '感染後1〜3週の血尿・浮腫・高血圧を経過観察する</span>。'),
  deep=('📌 小児の「水疱を伴う発疹」の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>分布</th><th>特徴</th><th>治療</th></tr>'
        '<tr><td><span class="kw3">伝染性膿痂疹</span></td>'
        '<td><span class="kw3">顔面・四肢・体幹（接触部位へ拡大）</span></td>'
        '<td><span class="kw3">弛緩性水疱→びらん→薄い痂皮。自家接種で飛び火</span></td>'
        '<td><span class="kw3">抗菌薬（外用±内服）＋洗浄・被覆</span></td></tr>'
        '<tr><td><span class="kw3">水　痘</span></td>'
        '<td><span class="kw3">全身に散布性（頭髪部・口腔内にも）</span></td>'
        '<td><span class="kw3">紅斑・水疱・膿疱・痂皮が同時に混在（多様性）＋発熱</span></td>'
        '<td><span class="kw3">アシクロビル</span></td></tr>'
        '<tr><td>手足口病</td><td>手掌・足底・口腔・殿部</td>'
        '<td>楕円形の小水疱。微熱。爪甲脱落を後遺することあり</td><td>対症療法</td></tr>'
        '<tr><td><span class="kw3">SSSS</span></td>'
        '<td><span class="kw3">口囲・間擦部から全身へ</span></td>'
        '<td><span class="kw3">びまん性紅斑＋広範なびらん＋接触痛。Nikolsky陽性</span></td>'
        '<td><span class="kw3">抗菌薬全身投与＋支持療法</span></td></tr>'
        '<tr><td>カポジ水痘様発疹症</td><td>湿疹病変部（アトピー性皮膚炎）</td>'
        '<td><span class="kw4">同じ大きさの臍窩をもつ小水疱が一斉に多発＋高熱</span></td>'
        '<td><span class="kw4">アシクロビル全身投与</span></td></tr>'
        '<tr><td>虫刺症</td><td>露出部</td><td>中心に刺入点。強い瘙痒</td>'
        '<td>ステロイド外用</td></tr></table>'
        '<span class="kw3">「発熱を伴い全身に散布性で多様性がある」＝水痘、'
        '「発熱に乏しく接触部位へ広がる」＝膿痂疹</span>が分岐点である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">伝染性膿痂疹＝黄色ブドウ球菌（水疱性）／A群β溶連菌（痂皮性）</span>。<br>'
         '② <span class="kw3">多発・拡大例は抗菌薬内服＋外用＋洗浄・被覆</span>。<br>'
         '③ <span class="kw4">消毒（アルコール）は不要。石鹸と流水で洗う</span>。<br>'
         '④ <span class="kw4">ステロイド外用は感染を拡大させる</span>。<br>'
         '⑤ <span class="kw3">患部を覆えば登園可。プールは治癒まで不可</span>。'
         '<span class="kw4">溶連菌型では急性糸球体腎炎に注意</span>。')),

Q('97D-8', None, [('bi', '📷')],
  '75歳の男性。瘙痒を伴う皮疹を主訴に来院した。'
  '<span class="kw">介護老人保健施設入所後から、指間、外陰部に強い瘙痒を伴う発疹</span>が出現した。'
  '指間部の写真（A）と<span class="kw">角質の苛性カリ標本像（B）</span>とを示す。<br>'
  '<strong>適切な治療薬はどれか。</strong>',
  [('a', '抗真菌外用薬', False, '<span class="kw4">指間の皮疹は白癬・カンジダも鑑別に挙がる</span>が、'
                     '<span class="kw3">KOH標本に見えているのはヒゼンダニの虫体であって'
                     '菌糸ではない</span>。'
                     '<span class="kw4">また外陰部の強い瘙痒という分布は疥癬に特徴的</span>である。'),
   ('b', '抗ウイルス外用薬', False, '<span class="kw4">ウイルス感染（単純疱疹・帯状疱疹）は'
                     '集簇性の小水疱を作り、疼痛が主体</span>である。'
                     '<span class="kw4">指間と外陰部に瘙痒性の丘疹が多発する病態ではない</span>。'),
   ('c', 'ビタミンD<sub>3</sub>外用薬', False,
                     '<span class="kw4">活性型ビタミンD<sub>3</sub>外用薬は'
                     '角化細胞の増殖抑制と分化誘導を介して乾癬・魚鱗癬・掌蹠角化症に用いる</span>。'
                     '<span class="kw4">寄生虫を殺す作用はない</span>。'),
   ('d', 'イオウ含有外用薬', True, '<span class="kw3">①介護老人保健施設への入所後に発症、'
                     '②指間と外陰部という疥癬の好発部位、'
                     '③強い瘙痒、④KOH標本でヒゼンダニの虫体</span>——'
                     '<span class="kw3">疥癬である</span>。'
                     '<span class="kw3">イオウ含有外用薬は古典的だが有効な疥癬治療薬</span>で、'
                     '<span class="kw3">選択肢の中で唯一の殺虫作用をもつ薬剤</span>である。'
                     '<span class="kw4">現在の第一選択はイベルメクチン内服または'
                     'フェノトリンローション外用だが、'
                     'イオウ剤は安価で妊婦・乳児にも使え、'
                     '施設での使用実績がある</span>。'),
   ('e', '副腎皮質ステロイド外用薬', False,
                     '<span class="kw4">疥癬にステロイドを外用すると、'
                     '瘙痒が一時的に軽減して「効いた」ように見えるが、'
                     '局所免疫が抑制されて虫体が増殖し、'
                     '角化型疥癬へ進展することさえある</span>。'
                     '<span class="kw4">疥癬が「湿疹」として長く誤治療される'
                     '典型的な経路がこれ</span>である。')],
  '施設入所後の指間・外陰部の強い瘙痒＋KOHでヒゼンダニ＝疥癬。選択肢中で殺虫作用をもつのはイオウ含有外用薬。',
  imgs=['images/97D-8_1.jpeg', 'images/97D-8_2.jpeg'],
  patho=('💊 疥癬の治療薬——世代の違いを押さえる',
         '<span class="kw3">疥癬治療の目的は「虫体と虫卵を殺し切ること」</span>である。'
         '<span class="kw3">どの薬にも共通する要点が2つある</span>——'
         '<span class="kw3">①首から下の全身に塗る（成人では顔面・頭部は侵されないが、'
         '皮疹がない部位にも虫がいる可能性があるため全身に塗る）。'
         '②卵には薬が効かないので、孵化を待って1週間後に必ず2回目を行う</span>。<br>'
         '<span class="kw3">【現在の主軸】</span>'
         '<span class="kw3">イベルメクチン内服（200μg/kg、空腹時単回、1週後に再投与）</span>と'
         '<span class="kw3">フェノトリンローション外用（首から下の全身、'
         '12時間後に洗い流す、1週間隔で2回）</span>。'
         '<span class="kw4">イベルメクチンは無脊椎動物のグルタミン酸作動性クロライドチャネルに'
         '作用して虫体を麻痺させる。ヒトはこのチャネルを中枢に持つが'
         '血液脳関門で守られる</span>。<br>'
         '<span class="kw3">【古典的だが有効な薬】</span>'
         '<span class="kw3">イオウ含有外用薬（イオウ製剤・イオウカンフルローション等）</span>は'
         '<span class="kw3">数日〜1週間の連日全身塗布で効果を示す</span>。'
         '<span class="kw4">安価で、妊婦・乳児にも使用でき、耐性の心配がない</span>のが利点で、'
         '<span class="kw4">臭気と皮膚刺激（乾燥・接触皮膚炎）が欠点</span>である。'
         '<span class="kw4">クロタミトンは殺虫作用が弱く止痒が主、'
         '安息香酸ベンジルは刺激が強い</span>。<br>'
         '<span class="kw3">治療後の注意</span>——'
         '<span class="kw3">虫が死んでも瘙痒と疥癬結節は数週間〜数か月残る（治療後瘙痒症）</span>。'
         '<span class="kw3">「まだ痒い＝治っていない」と判断して駆虫を延々と繰り返さず、'
         'KOHやダーモスコピーで虫体の有無を確認して判断する</span>。'
         '<span class="kw4">残る瘙痒には保湿とステロイド外用（駆虫完了後なら可）を用いる</span>。'),
  deep=('📌 「痒い＋施設入所」を見たときの思考手順',
        '<table class="tb"><tr><th>手順</th><th>すること</th><th>理由</th></tr>'
        '<tr><td><span class="kw3">①疑う</span></td>'
        '<td><span class="kw3">高齢者施設・病院で全身の痒みを見たら疥癬を第一に</span></td>'
        '<td><span class="kw3">湿疹と誤診されステロイドで悪化する例が多い</span></td></tr>'
        '<tr><td><span class="kw3">②診る</span></td>'
        '<td><span class="kw3">指間・手関節屈側・腋窩・臍周囲・陰部を必ず診察</span></td>'
        '<td><span class="kw3">好発部位が診断の最大の手がかり</span></td></tr>'
        '<tr><td><span class="kw3">③確かめる</span></td>'
        '<td><span class="kw3">ダーモスコピーでトンネル先端を探し、'
        'その部位からKOH検体を採る</span></td>'
        '<td><span class="kw3">当てずっぽうの採取より陽性率が高い</span></td></tr>'
        '<tr><td><span class="kw3">④型を決める</span></td>'
        '<td><span class="kw3">通常疥癬か角化型か</span></td>'
        '<td><span class="kw3">隔離・環境対策の要否が変わる</span></td></tr>'
        '<tr><td><span class="kw3">⑤広げない</span></td>'
        '<td><span class="kw3">接触者（職員・同室者・家族）を洗い出し、'
        '感染者を同時期に一斉治療</span></td>'
        '<td><span class="kw3">時間差治療は再感染の温床</span></td></tr>'
        '<tr><td>⑥説明する</td><td>治療後も痒みと結節が数週間残ると伝える</td>'
        '<td>不要な再治療と不安を防ぐ</td></tr></table>'
        '<span class="kw3">本章では疥癬が Q.192・206・210・216・222 の5問で問われている</span>——'
        '<span class="kw3">診断（好発部位とKOH）・対応（接触者健診）・治療（薬と2回投与）の'
        '3方向すべてが出題範囲である</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">施設入所後の指間・陰部の強い瘙痒＝疥癬</span>。<br>'
         '② <span class="kw3">選択肢中で殺虫作用があるのはイオウ含有外用薬</span>。<br>'
         '③ <span class="kw3">第一選択はイベルメクチン内服・フェノトリン外用。'
         '卵に効かないので1週後に2回目</span>。<br>'
         '④ <span class="kw4">ステロイド外用は増悪させ、角化型疥癬を招くことがある</span>。<br>'
         '⑤ <span class="kw4">治療後も瘙痒・疥癬結節は数週間残る（治療後瘙痒症）</span>。')),

]

# @@END@@


# ============================================================
# レンダリング
# ============================================================

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 4),
    ('s3', 'B問題', '', 15),
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
                        'MEC皮膚科 第8章 感染症 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#B45309')
                .replace('--orl:#FCE4EC', '--orl:#FEF3C7')
                .replace('--ord:#880E4F', '--ord:#78350F'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 皮膚科</div>'
        '<h1>第<span>8</span>章｜感染症</h1>'
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
