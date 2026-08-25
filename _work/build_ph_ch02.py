# -*- coding: utf-8 -*-
"""
公衆衛生 第2章「保健所」(NO.72-80) の章別HTML
(公衆衛生/ch02_hokenjo.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_ph_ch01.py と同方式。

問題文・選択肢はPDF(MEC公衆衛生講座・問題 Q-26〜Q-30／PDF p.31-35)を書き起こし、
正解/正答率/種別/CBT/必修は巻末解答一覧表(PDF p.267-277)を x 座標で列に切って読んだもの。
解説は**レジュメPDF(MEC公衆衛生講座・レジュメ p.10-11／PDF p.16-17)を正本**に執筆した
（医学的正確性は要ユーザー確認）。

全9問（**本科目で第9章「検査学」と並ぶ最小の章**）。**画像は1枚も無く、連問も無い**。
セクションは A問題(★)=NO.72-73／B問題(★)=NO.74-75／A問題=NO.76／B問題=NO.77-80。
★問題は4問・CBT 2問・必修 0問。**採点除外・正答率なしの問題は無い**。

■ 本章は9問すべてが「誰の仕事か」を問う。軸は3つの機関の対比ただ1本：
  **保健所＝広域的・専門的（許認可・立入検査・感染症・食品衛生・人口動態統計の審査）／
  市町村保健センター＝住民に身近な対人サービス（健康相談・保健指導・乳幼児健診・健康教室）／
  地方衛生研究所＝検査と調査研究（対物・技術支援）**。
  設問はこの3つに、**労働基準監督署（産業医の届出・労災認定）・検疫所（船舶の隔離）・
  福祉事務所（生活保護・障害者手帳）・市町村（3歳児健診・予防接種）**を混ぜて作られる。

⚠️ **レジュメが明示する「保健 health ＝ 健康を守り保つ／保険 insurance ＝ 皆でお金を出し合う」
   の対比がそのまま NO.79 の正解**（保健所は医療保険に関わる業務を行わない）。

⚠️ **本章の最難は NO.74(114C-33・正答率52%)**＝「3つ選べ」で**国勢調査の調査票の審査**を
   外せるか（**人口動態統計の審査は保健所だが、国勢調査は総務省の系統で保健所は関与しない**）。
   次いで **NO.77(115C-27・60%)＝産業医の届出は労働基準監督署／船舶の隔離は検疫所／
   労災認定は労働基準監督署**の3つを同時に外す必要がある。

⚠️ 本ファイルは `_work/_ph_ch02_p1.py`〜`p2.py` ＋ `_ph_ch02_tail.py` を
   `_work/_ph_join_ch02.py` で連結して作った**派生物**。章を直すときはパート側を編集してから
   join を流し直すこと（build_ph_ch02.py を直接編集すると次の join で消える）。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '公衆衛生' / 'ch02_hokenjo.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 72

# 5択決め打ちにしない（ガイド§4）。
FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ', 'f': 'ｆ', 'g': 'ｇ'}


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


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.72-73
# ============================================================
QUESTIONS += [

Q('120F-5', 82, [('bs', '★'), ('bc', 'CBT')],
  '<strong>地域保健法に基づく保健所の業務はどれか。</strong>',
  [('a', '生活保護の認定', False,
    '<span class="kw4">福祉事務所の業務</span>（生活保護法・社会福祉法）。'
    '<span class="kw4">都道府県と市は福祉事務所の設置が義務、町村は任意</span>で、'
    '生活保護の申請受理・調査・決定はここが行う。'
    '<span class="kw4">保健所は「健康」を扱い、「生計」は扱わない</span>。'),
   ('b', '食品衛生に関する事項', True,
    '<span class="kw3">◯ 保健所の中心的な業務の1つ</span>。'
    '<span class="kw3">飲食店の営業許可、施設への立入検査（監視指導）、'
    '食中毒発生時の原因調査</span>を担う。'
    '<span class="kw3">地域保健法は保健所の事業として「食品衛生に関する事項」を'
    '明文で挙げている</span>——'
    '<span class="kw3">許認可と監視という「対物の権限」を持つのが保健所の特徴</span>で、'
    'これは市町村保健センターには無い。'),
   ('c', '予防接種後の健康被害救済', False,
    '<span class="kw4">予防接種法に基づき、市町村が申請を受けて国が認定する</span>。'
    '<span class="kw4">定期予防接種の実施主体は市町村</span>なので、'
    '救済の窓口も市町村になる。'),
   ('d', '休日夜間急患センターの設置', False,
    '<span class="kw4">一次救急（初期救急）の体制で、市町村が整備する</span>。'
    '<span class="kw4">病院群輪番制とともに地域医師会の協力で運営される</span>もので、'
    '保健所が設置する施設ではない。'),
   ('e', '地域包括支援センターの設置', False,
    '<span class="kw4">介護保険法に基づき市町村が設置する</span>。'
    '<span class="kw4">高齢者の総合相談・権利擁護・介護予防ケアマネジメント</span>を担う'
    '（第1章 NO.47・61）。')],
  '食品衛生（営業許可・立入検査・食中毒の原因調査）は保健所の業務。生活保護は福祉事務所、予防接種と地域包括支援センターは市町村。',
  patho=('🏛 保健所——「広域的・専門的・技術的」を担う出先機関',
         '<span class="kw3">保健所は地域保健法に基づき、都道府県・政令指定都市・中核市・'
         'その他の政令で定める市・特別区が設置する</span>（全国450か所程度）。'
         '<span class="kw3">設置は義務</span>で、'
         '<span class="kw3">原則として保健所長は医師でなければならない</span>。<br>'
         '<span class="kw">地域保健法が保健所の事業として挙げるもの</span>——'
         '<span class="kw">①地域保健に関する思想の普及・向上 ②人口動態統計その他の統計 '
         '③栄養の改善・食品衛生 ④住宅・水道・下水道・廃棄物処理・環境衛生 '
         '⑤医事及び薬事 ⑥保健師に関する事項 ⑦公共医療事業の向上・増進 '
         '⑧母性・乳幼児・老人の保健 ⑨歯科保健 ⑩精神保健 '
         '⑪治療方法が確立していない疾病（難病） ⑫エイズ・結核・性病・伝染病その他の疾病の予防 '
         '⑬衛生上の試験・検査 ⑭その他地域住民の健康の保持増進</span>。<br>'
         '<span class="kw4">要点は「許認可と監視の権限を持つ」こと</span>——'
         '<span class="kw4">飲食店や医療機関に立ち入り、指導し、営業を許可する</span>。'
         '<span class="kw4">この対物の権限があるかどうかが、'
         '市町村保健センターとの決定的な違い</span>である。'),
  deep=('📌 保健所／市町村保健センター／地方衛生研究所',
        '<table class="tb"><tr><th></th><th>保健所</th><th>市町村保健センター</th>'
        '<th>地方衛生研究所</th></tr>'
        '<tr><td>根拠</td><td><span class="kw3">地域保健法（設置は義務）</span></td>'
        '<td><span class="kw">地域保健法（設置できる＝任意）</span></td>'
        '<td>設置要綱（設置が好ましい）</td></tr>'
        '<tr><td>設置者</td>'
        '<td><span class="kw3">都道府県・政令指定都市・中核市・特別区など</span></td>'
        '<td><span class="kw">市町村</span></td><td>都道府県・政令指定都市など</td></tr>'
        '<tr><td>数</td><td><span class="kw3">全国450か所程度</span></td><td>全国2,400か所超</td>'
        '<td><span class="kw">全国80か所程度</span></td></tr>'
        '<tr><td>長</td><td><span class="kw3">原則 医師</span></td>'
        '<td><span class="kw">医師である必要はない</span></td><td>—</td></tr>'
        '<tr><td>性格</td>'
        '<td><span class="kw3">広域的・専門的・技術的（許認可・監視・立入検査）</span></td>'
        '<td><span class="kw">住民に身近な対人サービス（健康相談・保健指導・健診）</span></td>'
        '<td><span class="kw">検査・調査研究・研修指導（対物・技術支援）</span></td></tr></table>'
        '<span class="kw3">「対物なら保健所、対人なら市町村保健センター、'
        '試験検査なら地方衛生研究所」</span>——本章9問はこの1行でほぼ割れる。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①保健所の設置は都道府県・政令指定都市・中核市・特別区など。'
         '所長は原則 医師</span>。<br>'
         '<span class="kw">②食品衛生（営業許可・立入検査・食中毒の原因調査）は保健所</span>。<br>'
         '<span class="kw">③生活保護の認定は福祉事務所</span>。<br>'
         '<span class="kw">④予防接種の実施と健康被害救済の窓口、地域包括支援センターは市町村</span>。<br>'
         '<span class="kw">⑤休日夜間急患センター（一次救急）は市町村が整備</span>。'),
  ),

Q('116C-25', 88, [('bs', '★')],
  '<strong>地方衛生研究所の業務でないのはどれか。</strong>',
  [('a', '人口動態統計に係る統計', True,
    '<span class="kw3">◯ 人口動態統計に関する業務は保健所の仕事</span>である。'
    '<span class="kw3">市町村が受理した出生届・死亡届などから作られた'
    '人口動態調査票を、保健所が審査して都道府県・厚生労働省へ送る</span>——'
    '<span class="kw3">地域保健法が保健所の事業として「人口動態統計その他地域保健に係る統計」を'
    '明文で挙げている</span>。'
    '<span class="kw3">地方衛生研究所は「検査と調査研究」の機関</span>で、'
    '統計の審査事務は担わない。'),
   ('b', '疾病予防に関する調査研究', False,
    '<span class="kw4">地方衛生研究所の業務</span>。'
    '<span class="kw4">地域の健康課題について科学的な裏づけを与える</span>のが役割である。'),
   ('c', '地域保健関係者の研修指導', False,
    '<span class="kw4">地方衛生研究所の業務</span>。'
    '<span class="kw4">保健所や市町村の職員に対する技術的な研修</span>を行う。'),
   ('d', '衛生微生物に関する試験検査', False,
    '<span class="kw4">地方衛生研究所の中心的な業務</span>。'
    '<span class="kw4">感染症の病原体検査、食品・環境の理化学検査</span>を担い、'
    '<span class="kw4">保健所が集めた検体を実際に調べるのがここ</span>である。'),
   ('e', '公衆衛生情報の収集・解析・提供', False,
    '<span class="kw4">地方衛生研究所の業務</span>。'
    '<span class="kw4">感染症発生動向調査の情報を解析して還元する</span>などが該当する。')],
  '地方衛生研究所の4本柱は「調査研究・研修指導・試験検査・情報の収集解析提供」。人口動態統計の審査は保健所。',
  patho=('🔬 地方衛生研究所——「検体を実際に調べる」機関',
         '<span class="kw3">地方衛生研究所は、都道府県・政令指定都市などが設置する'
         '衛生・地域保健の専門機関</span>（全国80か所程度）。'
         '<span class="kw3">法律ではなく国の設置要綱に基づくため、'
         '「設置が望ましい」という位置づけ</span>である点が保健所と違う。<br>'
         '<span class="kw">業務は4本柱</span>——'
         '<span class="kw">①調査研究 ②試験検査 ③研修指導 ④公衆衛生情報の収集・解析・提供</span>。'
         '<span class="kw">この4つを唱えられれば、本問はそこに無いものを選ぶだけ</span>で解ける。<br>'
         '<span class="kw4">保健所との関係は「現場と実験室」</span>——'
         '<span class="kw4">保健所が食中毒の探知・検体採取・営業停止の処分を行い、'
         '地方衛生研究所がその検体から病原体を同定する</span>。'
         '<span class="kw4">感染症の集団発生でも、保健所が疫学調査、'
         '地方衛生研究所が病原体検査という分担になる</span>。'
         '<span class="kw4">「住民と直接向き合わない＝対物・技術支援の機関」</span>と'
         '押さえておくと、第1章 NO.47 の誤り肢（「主に対人サービスを行う」）も同時に切れる。'),
  deep=('📌 人口動態統計は誰が何をするか',
        '<table class="tb"><tr><th>段階</th><th>担い手</th></tr>'
        '<tr><td><span class="kw">届出（出生・死亡・死産・婚姻・離婚）</span></td>'
        '<td><span class="kw">市町村（戸籍の窓口）が受理</span></td></tr>'
        '<tr><td><span class="kw3">調査票の審査</span></td>'
        '<td><span class="kw3">保健所</span></td></tr>'
        '<tr><td><span class="kw">集計・公表</span></td>'
        '<td><span class="kw">都道府県 → 厚生労働省</span></td></tr></table>'
        '<span class="kw4">同じ「統計」でも国勢調査は別系統</span>——'
        '<span class="kw4">総務省が5年に1回行う人口の全数調査で、'
        '調査員・市町村を通じて行われ、保健所は関与しない</span>。'
        '<span class="kw3">この対比が本章の最難問 NO.74 の分かれ目</span>になる。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①地方衛生研究所の4本柱＝調査研究・試験検査・研修指導・'
         '情報の収集解析提供</span>。<br>'
         '<span class="kw">②人口動態統計の調査票の審査は保健所</span>。<br>'
         '<span class="kw">③地方衛生研究所は法律ではなく設置要綱に基づく（全国80か所程度）</span>。<br>'
         '<span class="kw">④保健所＝現場（探知・採取・処分）、地方衛生研究所＝実験室（同定）</span>。<br>'
         '<span class="kw">⑤地方衛生研究所は対人サービスを行わない</span>（第1章 NO.47）。'),
  ),

]

# ============================================================
# B問題（★問題） NO.74-75
# ============================================================
QUESTIONS += [

Q('114C-33', 52, [('bs', '★')],
  '<strong>保健所の役割はどれか。3 つ選べ。</strong>',
  [('a', '3 歳児健康診査', False,
    '<span class="kw4">母子保健法に基づき市町村が行う</span>。'
    '<span class="kw4">1歳6か月児健診と3歳児健診は市町村の義務</span>で、'
    '<span class="kw4">実施の場は市町村保健センター</span>である。'
    '<span class="kw4">乳幼児健診は「住民に身近な対人サービス」の代表</span>なので保健所ではない。'),
   ('b', '医療法に基づく立入検査', True,
    '<span class="kw3">◯ 保健所の役割</span>。'
    '<span class="kw3">医療法第25条に基づき、病院・診療所・助産所に立ち入り、'
    '人員配置・構造設備・診療録の管理などが基準に適合しているかを検査する</span>。'
    '<span class="kw3">許認可と監視という「対物の権限」は保健所だけが持つ</span>。'),
   ('c', '国勢調査の調査票の審査', False,
    '<span class="kw4">国勢調査は総務省が5年に1回行う人口の全数調査</span>で、'
    '<span class="kw4">調査員 → 市町村 → 都道府県 → 総務省という系統で処理される</span>。'
    '<span class="kw4">保健所は関与しない</span>。'
    '<span class="kw4">「人口動態統計の調査票の審査（＝保健所）」と'
    '入れ替えてあるのが本問最大の罠</span>で、'
    '<span class="kw4">正答率52%の主因はここ</span>である。'),
   ('d', '地域における健康危機管理', True,
    '<span class="kw3">◯ 保健所の役割</span>。'
    '<span class="kw3">地域保健法に基づく基本指針は、保健所を'
    '「地域における健康危機管理の拠点」と位置づけている</span>。'
    '<span class="kw3">感染症の集団発生、食中毒、自然災害、化学物質による健康被害などに、'
    '平時から備え、発生時には情報収集・調査・関係機関の調整を担う</span>。'),
   ('e', '人口動態統計の調査票の審査', True,
    '<span class="kw3">◯ 保健所の役割</span>。'
    '<span class="kw3">市町村が受理した出生届・死亡届などから作られた調査票を'
    '保健所が審査し、都道府県を経て厚生労働省へ送る</span>。'
    '<span class="kw3">地域保健法が保健所の事業として明文で挙げている</span>。')],
  '保健所＝医療法に基づく立入検査・健康危機管理の拠点・人口動態統計の審査。3歳児健診は市町村、国勢調査は総務省の系統。',
  patho=('⚠️ 「統計」を2つ並べて入れ替える——本章の最難問',
         '<span class="kw3">本問の正答率は52%</span>で、本章で最も低い。'
         '<span class="kw3">原因は c と e の対比</span>である。<br>'
         '<span class="kw">人口動態統計＝保健所が調査票を審査する</span>。'
         '<span class="kw">出生・死亡・死産・婚姻・離婚の届出を市町村が受理し、'
         'そこから作られた調査票を保健所が審査して上へ送る</span>——'
         '<span class="kw">地域保健法が保健所の事業として明文で挙げている</span>。<br>'
         '<span class="kw">国勢調査＝総務省の系統で保健所は関与しない</span>。'
         '<span class="kw">5年に1回の人口の全数調査で、調査員が世帯へ配布・回収する</span>。'
         '<span class="kw">人口動態統計の「分母（人口）」を与えるのが国勢調査</span>、という'
         '関係だけ押さえておけばよい。<br>'
         '<span class="kw4">もう1つの罠が a の3歳児健康診査</span>——'
         '<span class="kw4">「健診」と聞くと保健所を思い浮かべやすいが、'
         '乳幼児健診は母子保健法に基づく市町村の義務</span>である。'
         '<span class="kw4">かつて保健所が担っていた母子保健の対人サービスは、'
         '1994年の地域保健法改正で市町村へ移された</span>——'
         'この歴史がそのまま出題の軸になっている。'),
  deep=('📌 1994年の地域保健法改正で何が動いたか',
        '<table class="tb"><tr><th></th><th>移管前（保健所法の時代）</th>'
        '<th>移管後（地域保健法）</th></tr>'
        '<tr><td><span class="kw3">対人サービス</span></td>'
        '<td>保健所が母子保健・老人保健も担っていた</td>'
        '<td><span class="kw3">市町村（保健センター）へ移管'
        '——乳幼児健診・保健指導・健康相談・予防接種</span></td></tr>'
        '<tr><td><span class="kw">保健所に残ったもの</span></td><td>—</td>'
        '<td><span class="kw">広域的・専門的・技術的な業務——感染症、難病、精神保健、'
        '食品衛生、環境衛生、医事薬事、統計、健康危機管理</span></td></tr></table>'
        '<span class="kw3">「身近なものは市町村へ、専門的なものは保健所に」</span>という'
        'この整理を知っていると、'
        '<span class="kw3">本章の9問すべてが同じ原理で解ける</span>。'
        '<span class="kw4">難病・精神保健・結核・エイズが保健所に残っている</span>のは、'
        '<span class="kw4">専門性が高く、かつ市町村単位では数が少なすぎて'
        '経験が蓄積しないため</span>である。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①保健所＝医療法に基づく立入検査／健康危機管理の拠点／'
         '人口動態統計の調査票の審査</span>。<br>'
         '<span class="kw">②国勢調査（総務省・5年に1回・全数）に保健所は関与しない</span>。<br>'
         '<span class="kw">③1歳6か月児・3歳児健診は母子保健法に基づく市町村の義務</span>。<br>'
         '<span class="kw">④1994年の地域保健法改正で対人サービスが市町村へ移った</span>。<br>'
         '<span class="kw">⑤保健所に残ったのは感染症・難病・精神保健・食品衛生・統計など</span>。'),
  ),

Q('111G-7', 77, [('bs', '★')],
  '<strong>市町村保健センターの業務はどれか。</strong>',
  [('a', '夜間・休日の診療', False,
    '<span class="kw4">市町村保健センターは診療所ではない</span>。'
    '<span class="kw4">一次救急（初期救急）は休日夜間急患センターや'
    '在宅当番医制が担う</span>もので、'
    '<span class="kw4">保健センターは「治療の場」ではなく「予防と健康づくりの場」</span>である。'),
   ('b', '乳幼児の健康診査', True,
    '<span class="kw3">◯ 市町村保健センターの代表的な業務</span>。'
    '<span class="kw3">母子保健法に基づく1歳6か月児健診・3歳児健診は市町村の義務</span>で、'
    '実施の場が保健センターになる。'
    '<span class="kw3">ほかに健康相談・保健指導・健康教室・予防接種・'
    '特定健診／特定保健指導など、住民と直接向き合う対人サービス全般</span>を担う。'),
   ('c', '要支援、要介護の認定', False,
    '<span class="kw4">介護保険法に基づき市町村が行うが、担当は介護保険担当課</span>。'
    '<span class="kw4">認定調査と主治医意見書をもとに介護認定審査会が判定する</span>もので、'
    '保健センターの業務として整理されない。'),
   ('d', '食中毒発生時の原因調査', False,
    '<span class="kw4">保健所の業務</span>（食品衛生法）。'
    '<span class="kw4">立入検査・検体採取・営業停止処分という'
    '「権限を伴う対物の仕事」</span>なので、保健センターにはできない。'),
   ('e', '病院運営についての助言', False,
    '<span class="kw4">保健所の業務</span>（医療法）。'
    '<span class="kw4">医療機関への立入検査・指導</span>は保健所が行う。')],
  '市町村保健センターは対人サービス（乳幼児健診・健康相談・保健指導・健康教室）の場。許認可・監視は保健所。',
  patho=('🏫 市町村保健センター——「住民に一番近い保健の場」',
         '<span class="kw3">市町村保健センターは地域保健法に基づき市町村が設置する</span>。'
         '<span class="kw3">保健所と違って設置は義務ではなく「設置することができる」</span>'
         '（実際には全国2,400か所超に置かれている）。'
         '<span class="kw3">センター長が医師である必要は無い</span>——'
         '<span class="kw3">保健所長は原則 医師</span>との対比で問われる。<br>'
         '<span class="kw">業務は住民に対する対人サービス</span>——'
         '<span class="kw">健康相談、保健指導、健康診査（とくに乳幼児健診）、'
         '健康教室、予防接種、家庭訪問、特定健診・特定保健指導</span>。'
         '<span class="kw">中心になる職種は保健師</span>である。<br>'
         '<span class="kw4">できないのは「権限を伴う仕事」</span>——'
         '<span class="kw4">営業許可、立入検査、届出の受理、処分</span>はすべて保健所の領分。'
         '<span class="kw4">選択肢に「検査」「調査」「指導（監督の意味）」「届出を受ける」が'
         '出てきたら保健所</span>、'
         '<span class="kw4">「相談」「教室」「健診」「訪問」なら保健センター</span>と'
         '見分けるとよい。'),
  deep=('📌 保健所と市町村保健センターの業務の振り分け',
        '<table class="tb"><tr><th>業務</th><th>担い手</th></tr>'
        '<tr><td><span class="kw3">乳幼児健診（1歳6か月児・3歳児）</span></td>'
        '<td><span class="kw3">市町村（保健センター）</span></td></tr>'
        '<tr><td><span class="kw3">健康相談・保健指導・健康教室・家庭訪問</span></td>'
        '<td><span class="kw3">市町村（保健センター）※保健所も相談は行う</span></td></tr>'
        '<tr><td><span class="kw3">予防接種の実施</span></td>'
        '<td><span class="kw3">市町村</span></td></tr>'
        '<tr><td><span class="kw">飲食店の営業許可・立入検査・食中毒の原因調査</span></td>'
        '<td><span class="kw">保健所</span></td></tr>'
        '<tr><td><span class="kw">医療機関への立入検査・指導</span></td>'
        '<td><span class="kw">保健所</span></td></tr>'
        '<tr><td><span class="kw">感染症の届出の受理・積極的疫学調査</span></td>'
        '<td><span class="kw">保健所</span></td></tr>'
        '<tr><td><span class="kw">難病・精神保健の相談と申請の受付</span></td>'
        '<td><span class="kw">保健所</span></td></tr>'
        '<tr><td>要介護認定</td><td>市町村（介護保険担当課・介護認定審査会）</td></tr>'
        '<tr><td>生活保護の認定</td><td>福祉事務所</td></tr></table>'
        '<span class="kw4">母子保健は市町村、難病と精神保健は保健所</span>——'
        '<span class="kw4">同じ「相談」でも扱う対象の専門性で分かれる</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①市町村保健センター＝乳幼児健診・健康相談・保健指導・健康教室</span>。<br>'
         '<span class="kw">②設置は市町村の任意。センター長は医師でなくてよい</span>。<br>'
         '<span class="kw">③許認可・立入検査・届出の受理・処分は保健所</span>。<br>'
         '<span class="kw">④保健センターは診療所ではない（夜間・休日診療は行わない）</span>。<br>'
         '<span class="kw">⑤要介護認定は市町村だが保健センターの業務ではない</span>。'),
  ),

]

# ============================================================
# A問題 NO.76
# ============================================================
QUESTIONS += [

Q('119F-18', 88, [],
  '<strong>保健所の業務で誤っているのはどれか。</strong>',
  [('a', '精神疾患の相談', False,
    '<span class="kw4">保健所の業務</span>。'
    '<span class="kw4">精神保健福祉法に基づき、精神保健福祉相談・訪問指導・'
    '医療及び保護に関する事務（措置入院の申請の受理など）</span>を担う。'
    '<span class="kw4">より専門的な判定や技術支援は精神保健福祉センター'
    '（都道府県・指定都市）が行う</span>。'),
   ('b', '医療機関への立入検査', False,
    '<span class="kw4">保健所の業務</span>（医療法第25条）。'
    '<span class="kw4">人員配置・構造設備・記録の管理が基準を満たしているかを検査する</span>。'),
   ('c', '身体障害者手帳の交付', True,
    '<span class="kw3">◯ これが誤り＝正解。交付するのは都道府県知事'
    '（政令指定都市・中核市では市長）</span>である。'
    '<span class="kw3">申請の窓口は市町村（福祉担当）、'
    '障害程度の判定は身体障害者更生相談所</span>が行う。'
    '<span class="kw3">保健所は「健康」を扱う機関で、'
    '福祉の給付や手帳の交付は福祉の系統（福祉事務所・更生相談所）</span>——'
    '<span class="kw3">この「保健と福祉の線引き」が本問の要点</span>である。'),
   ('d', '人口動態統計に関する業務', False,
    '<span class="kw4">保健所の業務</span>。'
    '<span class="kw4">出生届・死亡届などから作られた調査票の審査</span>を行う'
    '（本章 NO.73・74）。'),
   ('e', '結核発生時の接触者健康診断', False,
    '<span class="kw4">保健所の業務</span>（感染症法）。'
    '<span class="kw4">結核患者が発生したら、接触者を洗い出して健康診断を行い、'
    '潜在性結核感染症〈LTBI〉があれば治療につなぐ</span>。'
    '<span class="kw4">結核は保健所が患者登録・服薬支援〈DOTS〉まで一貫して担う</span>。')],
  '身体障害者手帳を交付するのは都道府県知事（申請窓口は市町村、判定は身体障害者更生相談所）。保健所ではない。',
  patho=('🧾 「保健」と「福祉」の境目——手帳・給付は福祉の系統',
         '<span class="kw3">保健所は健康を守る機関で、'
         '金銭給付や資格の付与（手帳の交付）は行わない</span>。'
         'この線引きが分かると、本章の誤り肢の多くが一度に切れる。<br>'
         '<span class="kw">福祉の系統</span>——'
         '<span class="kw">生活保護の認定＝福祉事務所／'
         '身体障害者手帳の交付＝都道府県知事（申請は市町村、判定は身体障害者更生相談所）／'
         '療育手帳＝都道府県知事（判定は児童相談所・知的障害者更生相談所）／'
         '精神障害者保健福祉手帳＝都道府県知事（申請は市町村、判定は精神保健福祉センター）</span>。<br>'
         '<span class="kw4">ただし精神保健だけは保健所が深く関わる</span>——'
         '<span class="kw4">精神保健福祉相談、訪問指導、措置入院に関する事務</span>は'
         '保健所の業務である。'
         '<span class="kw4">「相談と調査は保健所、手帳と給付は福祉」</span>と'
         '分けて覚えるとよい。<br>'
         '<span class="kw">結核が保健所の担当なのは感染症法による</span>——'
         '<span class="kw">患者の登録、接触者健診、直接服薬確認療法〈DOTS〉、'
         '公費負担申請の受理</span>まで一貫して保健所が担う。'),
  deep=('📌 保健所が担う「専門性の高い相談」',
        '<table class="tb"><tr><th>分野</th><th>保健所の役割</th></tr>'
        '<tr><td><span class="kw3">精神保健</span></td>'
        '<td><span class="kw3">相談・訪問指導・措置入院に関する事務'
        '（判定と技術支援は精神保健福祉センター）</span></td></tr>'
        '<tr><td><span class="kw3">難病</span></td>'
        '<td><span class="kw3">相談・訪問指導・医療費助成の申請の受理</span></td></tr>'
        '<tr><td><span class="kw3">結核・感染症</span></td>'
        '<td><span class="kw3">届出の受理・積極的疫学調査・接触者健診・DOTS・'
        '入院勧告に関する事務</span></td></tr>'
        '<tr><td><span class="kw">エイズ・性感染症</span></td>'
        '<td><span class="kw">匿名・無料の検査と相談</span></td></tr>'
        '<tr><td><span class="kw">母子（未熟児など）</span></td>'
        '<td><span class="kw">一般の母子保健は市町村。'
        '未熟児養育医療など専門性の高いものに関与</span></td></tr></table>'
        '<span class="kw4">「治療方法が確立していない疾病（難病）」と'
        '「結核・エイズ・性病その他の疾病の予防」は、'
        '地域保健法が保健所の事業として明文で挙げている</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①身体障害者手帳の交付は都道府県知事。保健所ではない</span>。<br>'
         '<span class="kw">②申請窓口は市町村、判定は身体障害者更生相談所</span>。<br>'
         '<span class="kw">③精神保健・難病・結核の相談と調査は保健所</span>。<br>'
         '<span class="kw">④結核は患者登録・接触者健診・DOTSまで保健所が担う</span>。<br>'
         '<span class="kw">⑤「相談と調査は保健所、手帳と給付は福祉」</span>。'),
  ),

]

# ============================================================
# B問題 NO.77-80
# ============================================================
QUESTIONS += [

Q('115C-27', 60, [],
  '<strong>保健所の業務で正しいのはどれか。2 つ選べ。</strong>',
  [('a', '医療機関に立入検査を行う。', True,
    '<span class="kw3">◯ 医療法第25条に基づく保健所の業務</span>。'
    '<span class="kw3">病院・診療所・助産所に立ち入り、人員・構造設備・記録の管理が'
    '法令の基準に適合しているかを検査し、必要な指導を行う</span>。'),
   ('b', '選任している産業医の変更の届出を受ける。', False,
    '<span class="kw4">労働基準監督署が受ける</span>（労働安全衛生法）。'
    '<span class="kw4">常時50人以上の労働者を使用する事業場は産業医を選任し、'
    '遅滞なく労働基準監督署長へ届け出る</span>。'
    '<span class="kw4">労働者の健康は「労働」の系統で、保健所の所管ではない</span>。'),
   ('c', '検疫感染症が流行している地域からの船舶を隔離する。', False,
    '<span class="kw4">検疫所の業務</span>（検疫法）。'
    '<span class="kw4">検疫所は厚生労働省の機関で、'
    '国内に常在しない感染症の侵入を水際で防ぐ</span>。'
    '<span class="kw4">「国境の外から中へ」が検疫所、'
    '「国内で発生したもの」が保健所</span>という分担である。'),
   ('d', '業務中に結核に感染した労働者の労働災害を認定する。', False,
    '<span class="kw4">労働基準監督署が認定する</span>（労働者災害補償保険法）。'
    '<span class="kw4">結核そのものの届出・接触者健診は保健所だが、'
    '「業務上の災害かどうか」の認定は労災の系統</span>である。'
    '<span class="kw4">同じ疾患でも、扱う側面によって担い手が変わる</span>。'),
   ('e', 'カルバペネム耐性腸内細菌科細菌感染症の届出を受ける。', True,
    '<span class="kw3">◯ 感染症法に基づく届出の受理は保健所</span>。'
    '<span class="kw3">カルバペネム耐性腸内細菌科細菌〈CRE〉感染症は'
    '5類感染症の全数把握対象</span>で、'
    '<span class="kw3">診断した医師が7日以内に最寄りの保健所長を経由して'
    '都道府県知事へ届け出る</span>。'
    '<span class="kw3">1〜5類のいずれであっても、届出の宛先は保健所</span>である。')],
  '医療機関への立入検査（医療法）と感染症の届出の受理（感染症法）は保健所。産業医の届出と労災認定は労働基準監督署、船舶の隔離は検疫所。',
  patho=('🚧 保健所・労働基準監督署・検疫所——3つの「監督する役所」',
         '<span class="kw3">本問の正答率は60%</span>。'
         '<span class="kw3">誤り肢3つがいずれも「いかにも公衆衛生っぽい仕事」</span>で、'
         '担い手を知らないと消せないためである。'
         '<span class="kw3">保健所と紛らわしい2つの役所を対で覚えておく</span>。<br>'
         '<span class="kw">労働基準監督署（厚生労働省・都道府県労働局の下）</span>——'
         '<span class="kw">労働安全衛生法と労働基準法の執行機関。'
         '産業医・衛生管理者の選任の届出、定期健康診断結果報告書の受理、'
         '労働災害の認定と労災保険の給付、事業場への立入調査</span>。'
         '<span class="kw">「働く人の健康と安全」はすべてこちら</span>。<br>'
         '<span class="kw">検疫所（厚生労働省）</span>——'
         '<span class="kw">検疫法の執行機関。空港・港で入国者と貨物を検疫し、'
         '検疫感染症の患者を隔離、接触者を停留する</span>。'
         '<span class="kw">「国内に常在しない感染症を水際で止める」のが役割</span>。<br>'
         '<span class="kw4">保健所は「国内で暮らす住民の健康」を、'
         '地域を単位に担う</span>——'
         '<span class="kw4">水際でもなく、職場でもない</span>。'
         'この3分割で本問は確実に取れる。'),
  deep=('📌 紛らわしい担い手の一覧',
        '<table class="tb"><tr><th>業務</th><th>担い手</th><th>根拠法</th></tr>'
        '<tr><td><span class="kw3">医療機関への立入検査</span></td>'
        '<td><span class="kw3">保健所</span></td><td><span class="kw3">医療法</span></td></tr>'
        '<tr><td><span class="kw3">感染症の届出の受理・積極的疫学調査</span></td>'
        '<td><span class="kw3">保健所</span></td><td><span class="kw3">感染症法</span></td></tr>'
        '<tr><td><span class="kw">産業医・衛生管理者の選任の届出</span></td>'
        '<td><span class="kw">労働基準監督署</span></td>'
        '<td><span class="kw">労働安全衛生法</span></td></tr>'
        '<tr><td><span class="kw">労働災害の認定・労災保険の給付</span></td>'
        '<td><span class="kw">労働基準監督署</span></td>'
        '<td><span class="kw">労働者災害補償保険法</span></td></tr>'
        '<tr><td><span class="kw">入国者・船舶の検疫、患者の隔離・接触者の停留</span></td>'
        '<td><span class="kw">検疫所</span></td><td><span class="kw">検疫法</span></td></tr>'
        '<tr><td>飲食店の営業許可・食中毒の原因調査</td><td>保健所</td><td>食品衛生法</td></tr>'
        '<tr><td>生活保護の認定</td><td>福祉事務所</td><td>生活保護法</td></tr></table>'
        '<span class="kw3">「隔離」と「停留」の使い分け</span>——'
        '<span class="kw3">隔離は患者本人、停留は感染したおそれのある者</span>に対して行う'
        '（第15章 感染症で再び問われる）。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①医療機関への立入検査（医療法）と感染症の届出の受理（感染症法）は保健所</span>。<br>'
         '<span class="kw">②産業医の選任の届出・労災の認定は労働基準監督署</span>。<br>'
         '<span class="kw">③船舶・入国者の検疫と隔離は検疫所</span>。<br>'
         '<span class="kw">④CRE感染症は5類の全数把握（7日以内に届出）</span>。<br>'
         '<span class="kw">⑤保健所＝地域の住民、労働基準監督署＝働く人、検疫所＝水際</span>。'),
  ),

Q('112C-10', 96, [],
  '<strong>市町村保健センターの業務はどれか。</strong>',
  [('a', '医療計画の策定', False,
    '<span class="kw4">都道府県が策定する</span>（医療法）。'
    '<span class="kw4">医療圏・基準病床数・5疾病6事業・地域医療構想などを定める</span>'
    '（第1章 NO.25・63）。'),
   ('b', '健康教室の開催', True,
    '<span class="kw3">◯ 市町村保健センターの代表的な業務</span>。'
    '<span class="kw3">生活習慣病予防・栄養・運動・歯科保健・育児などの'
    '健康教育を住民に直接行う</span>。'
    '<span class="kw3">健康相談・保健指導・乳幼児健診と並ぶ「対人サービス」</span>で、'
    '<span class="kw3">中心になる職種は保健師</span>である。'),
   ('c', '人口動態統計の作成', False,
    '<span class="kw4">調査票の審査は保健所、集計・公表は都道府県を経て厚生労働省</span>。'
    '<span class="kw4">市町村は届出（出生・死亡等）を受理する役</span>で、'
    '統計そのものを作るわけではない。'),
   ('d', '食中毒発生時の原因調査', False,
    '<span class="kw4">保健所の業務</span>（食品衛生法）。'
    '<span class="kw4">立入検査・検体採取・営業停止処分という権限を伴う</span>。'),
   ('e', '医療安全管理に関する指導', False,
    '<span class="kw4">保健所の業務</span>（医療法）。'
    '<span class="kw4">立入検査の一環として医療安全管理体制を確認・指導する</span>。'
    '<span class="kw4">患者からの苦情・相談は医療安全支援センター</span>が受ける'
    '（第1章 NO.13・33）。')],
  '健康教室の開催は市町村保健センター。医療計画は都道府県、食中毒調査と医療安全の指導は保健所。',
  patho=('🎓 健康教育——「集団に働きかける」公衆衛生の基本手段',
         '<span class="kw3">市町村保健センターの業務は、'
         '住民に直接届く対人サービス</span>である。'
         '<span class="kw3">健康相談・保健指導・健康診査・健康教室・予防接種・家庭訪問</span>——'
         'いずれも<span class="kw3">「一人ひとりに会って行う」もの</span>。<br>'
         '<span class="kw">健康教室（健康教育）は、公衆衛生の代表的な手段</span>で、'
         '<span class="kw">集団全体のリスクを少しずつ下げる'
         '「ポピュレーションアプローチ」</span>に位置づく。'
         '<span class="kw">これに対し、リスクの高い人を選んで介入するのが'
         '「ハイリスクアプローチ」</span>（特定保健指導など）。'
         '<span class="kw">第19章で両者の区別が問われる</span>。<br>'
         '<span class="kw4">本問の正答率は96%と高い</span>——'
         '<span class="kw4">「教室」という語が対人サービスであることを直接示している</span>ためで、'
         '<span class="kw4">語感で選べる問題は確実に取る</span>。'
         '残りの肢はいずれも都道府県か保健所の仕事で、'
         '<span class="kw4">「策定」「調査」「指導（監督）」という'
         '権限を含む語が付いている</span>のが見分けの手がかりになる。'),
  deep=('📌 予防の階層と担い手',
        '<table class="tb"><tr><th>手段</th><th>考え方</th><th>担い手の例</th></tr>'
        '<tr><td><span class="kw3">ポピュレーションアプローチ</span></td>'
        '<td><span class="kw3">集団全体に働きかけ、リスク分布ごと下げる</span></td>'
        '<td><span class="kw3">健康教室、減塩の啓発、受動喫煙防止（健康増進法）、'
        '食品への栄養成分表示の義務化</span></td></tr>'
        '<tr><td><span class="kw">ハイリスクアプローチ</span></td>'
        '<td><span class="kw">リスクの高い人を選んで集中的に介入する</span></td>'
        '<td><span class="kw">特定保健指導、禁煙外来、'
        '要保護児童への家庭訪問</span></td></tr></table>'
        '<span class="kw4">両者は対立ではなく組み合わせて使う</span>——'
        '<span class="kw4">ポピュレーションアプローチは1人あたりの効果は小さいが'
        '全体では大きく（予防のパラドックス）、'
        'ハイリスクアプローチは対象者への効果は大きいが全体への寄与は限られる</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①健康教室・健康相談・保健指導・乳幼児健診は市町村保健センター</span>。<br>'
         '<span class="kw">②医療計画の策定は都道府県</span>。<br>'
         '<span class="kw">③食中毒の原因調査・医療安全の指導は保健所</span>。<br>'
         '<span class="kw">④人口動態統計は市町村が届出を受理し保健所が審査する</span>。<br>'
         '<span class="kw">⑤健康教室はポピュレーションアプローチの代表例</span>。'),
  ),

Q('112F-25', 84, [('bc', 'CBT')],
  '<strong>保健所の業務として誤っているのはどれか。</strong>',
  [('a', '難病に関する相談を受ける。', False,
    '<span class="kw4">保健所の業務</span>。'
    '<span class="kw4">地域保健法は「治療方法が確立していない疾病その他の特殊の疾病により'
    '長期に療養を必要とする者の保健に関する事項」を保健所の事業として挙げている</span>。'
    '<span class="kw4">難病法に基づく医療費助成の申請の受理・訪問指導</span>も担う。'),
   ('b', '食中毒患者の届出を受ける。', False,
    '<span class="kw4">保健所の業務</span>（食品衛生法）。'
    '<span class="kw4">食中毒を診断した医師は直ちに最寄りの保健所長に届け出る</span>。'),
   ('c', '医療保険に関する事務を行う。', True,
    '<span class="kw3">◯ これが誤り＝正解。保健所は医療保険に関わる業務を行わない</span>。'
    '<span class="kw3">「保健」は健康を守り保つこと、'
    '「保険」は皆でお金を出し合って損失に備える仕組み</span>で、'
    '<span class="kw3">読みが同じでも別物</span>である。'
    '<span class="kw3">医療保険の事務は、市町村（国民健康保険）・'
    '全国健康保険協会や健康保険組合（被用者保険）・'
    '後期高齢者医療広域連合が担う</span>。'),
   ('d', '保健師による家庭訪問活動を行う。', False,
    '<span class="kw4">保健所の業務</span>。'
    '<span class="kw4">結核患者、難病患者、精神障害者などへの訪問指導</span>を行う。'
    '<span class="kw4">市町村保健センターも家庭訪問を行う</span>ので、'
    '<span class="kw4">「訪問だから市町村」とは限らない</span>点に注意する。'),
   ('e', '人口動態統計に関する事務を行う。', False,
    '<span class="kw4">保健所の業務</span>。調査票の審査を行う（本章 NO.73・74）。')],
  '保健所は医療保険に関する事務を行わない。「保健」と「保険」は読みが同じでも別物。',
  patho=('💴 「保健」と「保険」——読みが同じで中身が違う',
         '<span class="kw3">レジュメが冒頭で「保健 health ＝ 健康を守り保つこと／'
         '保険 insurance ＝ 皆でお金を出し合い損失に備えるシステム」と'
         '並べているのは、まさに本問のため</span>である。'
         '<span class="kw3">保健所は前者の機関で、後者には一切関わらない</span>。<br>'
         '<span class="kw">医療保険の事務を担うのは保険者</span>——'
         '<span class="kw">国民健康保険は市町村と都道府県、'
         '被用者保険は全国健康保険協会〈協会けんぽ〉や健康保険組合・共済組合、'
         '75歳以上は後期高齢者医療広域連合</span>。'
         '<span class="kw">保険証の発行、保険料の徴収、給付の支払いはすべてこちら</span>。<br>'
         '<span class="kw4">同じ理屈で、介護保険の事務（要介護認定・保険料）も'
         '保健所の業務ではない</span>——'
         '<span class="kw4">介護保険の保険者は市町村</span>である。'
         '<span class="kw4">「お金の話が出てきたら保健所ではない」</span>と'
         '覚えておくと、本章の誤り肢（生活保護の認定、予防接種後の健康被害救済、'
         '労働災害の認定）もまとめて切れる。'),
  deep=('📌 保健所が「行わない」ことの一覧',
        '<table class="tb"><tr><th>行わないこと</th><th>誰が行うか</th></tr>'
        '<tr><td><span class="kw3">医療保険・介護保険に関する事務</span></td>'
        '<td><span class="kw3">保険者（市町村・協会けんぽ・健保組合・'
        '後期高齢者医療広域連合）</span></td></tr>'
        '<tr><td><span class="kw">生活保護の認定</span></td>'
        '<td><span class="kw">福祉事務所</span></td></tr>'
        '<tr><td><span class="kw">身体障害者手帳の交付</span></td>'
        '<td><span class="kw">都道府県知事（申請は市町村・判定は更生相談所）</span></td></tr>'
        '<tr><td><span class="kw">予防接種の実施と健康被害救済</span></td>'
        '<td><span class="kw">市町村</span></td></tr>'
        '<tr><td><span class="kw">労働災害の認定・産業医の届出の受理</span></td>'
        '<td><span class="kw">労働基準監督署</span></td></tr>'
        '<tr><td><span class="kw">入国者・船舶の検疫</span></td>'
        '<td><span class="kw">検疫所</span></td></tr>'
        '<tr><td>1歳6か月児・3歳児健診</td><td>市町村（保健センター）</td></tr>'
        '<tr><td>国勢調査</td><td>総務省</td></tr></table>'
        '<span class="kw3">本章9問の誤り肢は、ほぼこの表から出ている</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①保健所は医療保険に関する事務を行わない（保健≠保険）</span>。<br>'
         '<span class="kw">②医療保険の保険者＝市町村・都道府県（国保）／協会けんぽ・'
         '健保組合（被用者）／後期高齢者医療広域連合</span>。<br>'
         '<span class="kw">③難病・食中毒・人口動態統計・家庭訪問は保健所の業務</span>。<br>'
         '<span class="kw">④家庭訪問は保健所も市町村保健センターも行う</span>。<br>'
         '<span class="kw">⑤「お金の話が出てきたら保健所ではない」</span>。'),
  ),

Q('111B-30', 87, [],
  '<strong>保健所の業務はどれか。</strong>',
  [('a', '生活保護の認定', False,
    '<span class="kw4">福祉事務所の業務</span>（生活保護法）。'
    '<span class="kw4">都道府県と市は必置、町村は任意設置</span>。'),
   ('b', '食品に関する営業者の監視', True,
    '<span class="kw3">◯ 保健所の業務</span>（食品衛生法）。'
    '<span class="kw3">飲食店・食品製造業などの営業許可を与え、'
    '食品衛生監視員が定期的に立入検査（監視指導）を行う</span>。'
    '<span class="kw3">違反があれば改善命令・営業停止の処分もできる</span>——'
    '<span class="kw3">こうした権限を伴う対物の仕事こそ保健所の本領</span>である。'),
   ('c', '予防接種後の健康被害救済', False,
    '<span class="kw4">予防接種法に基づき、市町村が申請を受けて国が認定する</span>。'),
   ('d', '地域包括支援センターの設置', False,
    '<span class="kw4">介護保険法に基づき市町村が設置する</span>。'),
   ('e', '休日夜間急患センターの設置', False,
    '<span class="kw4">一次救急の体制として市町村が整備する</span>。')],
  '食品に関する営業者の監視（許可・立入検査・処分）は保健所。生活保護は福祉事務所、他は市町村。',
  patho=('🍽 食品衛生——保健所の「許可・監視・処分」がそろう分野',
         '<span class="kw3">本問は本章 NO.72（120F-5）とほぼ同じ選択肢で、'
         '正解の肢だけが「食品衛生に関する事項」から'
         '「食品に関する営業者の監視」に言い換えられている</span>。'
         '<span class="kw3">MECは同じ論点を年度違いで繰り返し載せる</span>ので、'
         'この2問はセットで確実に取る。<br>'
         '<span class="kw">食品衛生は、保健所の権限が最もはっきり現れる分野</span>である——'
         '<span class="kw">①営業許可（飲食店を開くには保健所の許可が要る） '
         '②監視指導（食品衛生監視員による立入検査） '
         '③食中毒発生時の原因調査（検体採取・喫食調査） '
         '④行政処分（改善命令・営業停止・営業禁止）</span>。<br>'
         '<span class="kw4">この「許可 → 監視 → 調査 → 処分」の4段は、'
         '医療機関に対する立入検査（医療法）とまったく同じ構造</span>である。'
         '<span class="kw4">保健所は住民に直接サービスするのではなく、'
         '事業者を規律することで住民の健康を守る</span>——'
         'この性格が市町村保健センターとの違いを作っている。'),
  deep=('📌 本章に繰り返し出る誤り肢の出どころ',
        '<table class="tb"><tr><th>誤り肢</th><th>正しい担い手</th><th>本章での出現</th></tr>'
        '<tr><td><span class="kw">生活保護の認定</span></td>'
        '<td><span class="kw">福祉事務所</span></td>'
        '<td><span class="kw">NO.72・80（2回）</span></td></tr>'
        '<tr><td><span class="kw">予防接種後の健康被害救済</span></td>'
        '<td><span class="kw">市町村（認定は国）</span></td>'
        '<td><span class="kw">NO.72・80（2回）</span></td></tr>'
        '<tr><td><span class="kw">地域包括支援センターの設置</span></td>'
        '<td><span class="kw">市町村</span></td>'
        '<td><span class="kw">NO.72・80（2回）</span></td></tr>'
        '<tr><td><span class="kw">休日夜間急患センターの設置</span></td>'
        '<td><span class="kw">市町村</span></td>'
        '<td><span class="kw">NO.72・80（2回）</span></td></tr>'
        '<tr><td>食中毒発生時の原因調査</td><td>保健所（＝正しい）</td>'
        '<td>NO.75・78 で「保健センターではない」肢として</td></tr></table>'
        '<span class="kw3">4つの誤り肢がそのまま2回使い回されている</span>——'
        '<span class="kw3">この4つを覚えるだけで本章の2問が確実に取れる</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①食品に関する営業者の監視（許可・立入検査・処分）は保健所</span>。<br>'
         '<span class="kw">②生活保護＝福祉事務所、予防接種の救済・地域包括支援センター・'
         '休日夜間急患センター＝市町村</span>。<br>'
         '<span class="kw">③保健所は事業者を規律することで住民の健康を守る</span>。<br>'
         '<span class="kw">④本章 NO.72 とほぼ同一問題（正解の言い換えだけが違う）</span>。<br>'
         '<span class="kw">⑤「許可 → 監視 → 調査 → 処分」は食品衛生も医療法も同じ構造</span>。'),
  ),

]

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),   # NO.72-73
    ('s2', 'B問題（★問題）', '', 2),   # NO.74-75
    ('s3', 'A問題', '', 4),            # NO.76
    ('s4', 'B問題', '', 5),            # NO.77-80
]


def _ans_label(q):
    if q['ans_label']:
        return q['ans_label']
    oks = [(l, t) for (l, t, ok, w) in q['choices'] if ok]
    if not oks:
        return '（採点除外）'
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
                        'MEC公衆衛生 第2章 保健所 解答解説')
    # 公衆衛生(ph)のテーマ色（🏛 #0891B2）
    head = (head.replace('--or:#C2185B', '--or:#0891B2')
                .replace('--orl:#FCE4EC', '--orl:#CFFAFE')
                .replace('--ord:#880E4F', '--ord:#164E63'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MEC公衆衛生講座 \'26 | 公衆衛生</div>'
        '<h1>第<span>2</span>章｜保健所</h1>'
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
