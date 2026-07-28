# -*- coding: utf-8 -*-
"""
皮膚科 第2章「皮膚炎と蕁麻疹」(NO.28-54) の章別HTML(皮膚科/ch02_hifuen_jinmashin.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、産婦人科(obg)水準で作成。build_derm_ch01.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・皮膚科 皮Q-14〜29／PDF p.17-32)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.155-159) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

画像は10問15枚（NO.28/29/30/31/37/39/42/43/44/54）。全て目視で内容を確認済み。
- NO.42(107I-45) は2枚（A=顔面のびらん・黄色痂皮／B=Tzanck試験の多核巨細胞）。
- ⚠️ NO.44(104D-45) は**5枚の写真そのものが選択肢**（ａ①〜ｅ⑤）。目視で同定した内容は
  ①全身紫外線照射装置 ②打腱器等の神経学的診察器具 ③鑷子・スライドガラス・木ベラ
  ④前腕への皮内/プリックテスト（正解） ⑤前腕へのパッチテスト。
  選択肢テキストには番号だけでなく同定した器具名を併記し、肢をシャッフルしても
  対応が崩れないようにしてある（ガイド§1の「表・図が選択肢」への対応）。

複数選択は NO.34・49・51 の3問（いずれも2つ選べ）。
否定形（「誤っている」「〜でない」「原因とならない」）は NO.36・38・50・53 の4問。
NO.51-54 の4問は解答一覧表に正答率が無い（rate=None → .cr を出さない。採点除外ではないので bx は付けない）。
必修バッジ(bh)は NO.35・36・39・47・50・52・53 の7問。CBTバッジ(bc)は NO.28・30・31・33 の4問。

本章の低正答率問題: NO.38(32%)・NO.32(38%)・NO.44(51%)・NO.37(66%)・NO.29(73%)・NO.35/42(79%)。
アトピー性皮膚炎は NO.28・32・37・40・41・50・51・52・53 で、
Kaposi水痘様発疹症は NO.29・41・42・46・48 で、
接触皮膚炎とパッチテストは NO.30・35・39・43・54 で、
蕁麻疹・膨疹は NO.31・33・45・47・49 で繰り返し問われるので相互参照を張ってある。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '皮膚科' / 'ch02_hifuen_jinmashin.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 28

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs or [], ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.28-29 → Q.28-29
# ============================================================
QUESTIONS += [

Q('119A-24', 93, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '20歳の女性。<span class="kw">瘙痒を伴う体幹と四肢の皮疹</span>を主訴に来院した。全身に皮疹が出現し、瘙痒で夜も眠れていない。'
  '既往歴に<span class="kw">アレルギー性鼻炎</span>がある。エビ、豚肉、卵および牛乳のアレルギーがある。'
  '<span class="kw">乳児期から瘙痒を伴う皮疹が左右対称性に生じ、消長を繰り返している</span>。'
  '小児期は頭部および顔面に紅斑、鱗屑および漿液性丘疹を生じていた。'
  '<span class="kw">学童期は肘窩や膝窩などに搔破痕を伴う苔癬化局面を形成した</span>。<span class="kw">弟に同様の皮膚症状がある</span>。'
  '搔破による痒疹と苔癬化局面が全身に多発している。背部の皮疹の写真を示す。'
  '血液所見：赤血球468万、Hb 13.9g/dL、Ht 42％、白血球11,300（桿状核好中球10％、分葉核好中球52％、'
  '<span class="kw">好酸球17％</span>、好塩基球1％、単球6％、リンパ球14％）、血小板45万。'
  '血液生化学所見：LD 276U/L（基準124〜222）。免疫血清学所見：CRP 0.3mg/dL、'
  '<span class="kw">IgE 13,384IU/mL（基準170以下）</span>。'
  '<span class="kw4">病変部の病理検査で表皮内に異型リンパ球の浸潤を認めない</span>。<br>'
  '<strong>皮膚症状に対する適切な治療はどれか。</strong>',
  [('a', '抗菌薬内服', False, '二次感染（伝染性膿痂疹・毛包炎）を合併したときの補助的治療にすぎない。'
                     '<span class="kw4">湿疹病変そのものを治す薬ではなく、漫然と使えば耐性菌を生むだけ</span>。本例に膿痂疹化の記載もない。'),
   ('b', 'コルヒチン内服', False, '<span class="kw4">好中球の遊走を抑える薬</span>で、'
                     '<span class="kw">痛風発作・Behçet病・家族性地中海熱</span>などに用いる。'
                     'アトピー性皮膚炎はTh2優位の炎症であり、機序がまったく噛み合わない。'),
   ('c', '活性型ビタミンD3 外用', False, '<span class="kw4">表皮角化細胞の増殖を抑え分化を促す薬で、尋常性乾癬の外用薬</span>。'
                     'アトピー性皮膚炎の湿疹反応には適応が無く、'
                     '<span class="kw4">びらんや搔破面に塗ると刺激が強い</span>。'),
   ('d', '抗ロイコトリエン薬内服', False, '<span class="kw4">気管支喘息・アレルギー性鼻炎の薬</span>。'
                     '本例はアレルギー性鼻炎も持つが、設問が問うているのは<span class="kw4">「皮膚症状に対する」治療</span>であり、'
                     'アトピー性皮膚炎の皮疹に対する有効性は確立していない。'),
   ('e', '副腎皮質ステロイド外用', True, '<span class="kw3">アトピー性皮膚炎の抗炎症治療の第一選択</span>。'
                     '<span class="kw3">皮疹の重症度と部位に応じたランクを、十分な量（FTU）で、寛解導入まで毎日</span>塗る。'
                     '本例は痒疹・苔癬化局面が全身に多発する重症例なので、'
                     '<span class="kw3">strong〜very strong を主体に、保湿剤と抗ヒスタミン薬を併用</span>する。')],
  '乳児期発症・左右対称・慢性反復性の瘙痒性湿疹、部位の年齢推移（顔→肘膝窩→全身の苔癬化）、家族歴、好酸球17%・IgE 13,384。アトピー性皮膚炎で、皮膚症状の第一選択は副腎皮質ステロイド外用。',
  imgs=['images/119A-24_1.jpeg'],
  patho=('🌡️ アトピー性皮膚炎——「バリア破綻」と「Th2炎症」の悪循環',
         '<span class="kw3">アトピー性皮膚炎〈AD〉</span>は'
         '<span class="kw3">「増悪と寛解を繰り返す瘙痒のある湿疹を主病変とし、患者の多くがアトピー素因をもつ」</span>と'
         '定義される慢性疾患である。診断は<span class="kw3">①瘙痒、②特徴的な皮疹と分布、③慢性・反復性の経過</span>の'
         '3つをすべて満たすことによる。本例はこの3項目を病歴だけで完全に満たしている。<br>'
         '病態の核は<span class="kw3">2つの輪が噛み合った悪循環</span>である。'
         '<span class="kw3">①皮膚バリアの破綻</span>——'
         '<span class="kw3">フィラグリン遺伝子の機能喪失変異とセラミドの減少</span>により角層バリアが弱く、'
         '水分が逃げて乾燥し、外からアレルゲンや黄色ブドウ球菌が入りやすい。'
         '<span class="kw3">②Th2型（2型）炎症</span>——'
         '侵入した抗原に対し<span class="kw3">IL-4・IL-13・IL-31</span>を軸とする2型免疫が働き、'
         'IL-4/IL-13が<span class="kw3">IgE産生を促し、さらにフィラグリン発現を下げてバリアを一段と壊す</span>。'
         '<span class="kw3">IL-31は痒みを直接引き起こす</span>。'
         '痒くて掻けばバリアはさらに壊れ、抗原が入り、炎症が強まる——'
         'これが<span class="kw3">itch-scratch cycle（痒み・掻破の悪循環）</span>である。<br>'
         '<span class="kw3">皮疹の分布は年齢とともに移動する</span>のが大きな特徴で、本例の病歴はその教科書的な再現である。'
         '<span class="kw3">乳児期は頭部・顔面に浸出性の紅斑・漿液性丘疹</span>、'
         '<span class="kw3">幼小児期は肘窩・膝窩など四肢屈側に苔癬化</span>、'
         '<span class="kw3">思春期・成人期は上半身（頭・頸・胸・背）優位で、乾燥と苔癬化・痒疹が主体</span>となる。<br>'
         '検査では<span class="kw3">末梢血好酸球増多・血清IgE高値</span>が支持所見になる（<span class="kw">Q.51・Q.52</span>）。'
         '重症度と相関して動く<span class="kw3">血清TARC〈CCL17〉</span>は治療効果の判定に有用である。'
         'なお本問がわざわざ<span class="kw3">「表皮内に異型リンパ球の浸潤を認めない」</span>と書いているのは、'
         '<span class="kw3">成人発症の難治性紅皮症で鑑別すべき菌状息肉症（皮膚T細胞リンパ腫）を否定する</span>ためである。'
         '菌状息肉症では表皮内へ異型リンパ球が浸潤し<span class="kw">Pautrier微小膿瘍</span>をつくる。'),
  deep=('📌 アトピー性皮膚炎の治療——3本柱と重症例の選択肢',
        '<table class="tb"><tr><th>柱</th><th>内容</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">①抗炎症外用</span></td>'
        '<td><span class="kw3">ステロイド外用</span>／タクロリムス軟膏／デルゴシチニブ軟膏／ジファミラスト軟膏</td>'
        '<td><span class="kw3">部位と重症度でランクを選ぶ</span>。顔・頸はmedium以下かタクロリムス。'
        '寛解後は<span class="kw3">プロアクティブ療法</span>（週2回など間欠塗布）で再燃を防ぐ</td></tr>'
        '<tr><td><span class="kw3">②スキンケア</span></td><td>保湿剤（ヘパリン類似物質・白色ワセリン）</td>'
        '<td><span class="kw3">寛解期も継続</span>。入浴直後に塗る。熱い湯・ゴシゴシ洗いは避ける</td></tr>'
        '<tr><td><span class="kw3">③悪化因子の除去</span></td><td>ダニ・汗・食物・ストレス・黄色ブドウ球菌</td>'
        '<td><span class="kw4">自己判断の食物除去はさせない</span>（成長障害・感作リスク）</td></tr></table>'
        '<span class="kw3">重症・難治例の全身療法</span>: '
        '<span class="kw3">デュピルマブ（抗IL-4Rα抗体）</span>・'
        '<span class="kw">ネモリズマブ（抗IL-31受容体A抗体・痒みに）</span>・'
        '<span class="kw">トラロキヌマブ（抗IL-13抗体）</span>、'
        '<span class="kw">JAK阻害薬内服（バリシチニブ・ウパダシチニブ・アブロシチニブ）</span>、'
        '<span class="kw">シクロスポリン内服（短期）</span>、ナローバンドUVB。'
        '本例のように<span class="kw3">外用で抑えきれない重症例では、まず外用を適切な量・ランクで行ったうえで</span>'
        'これらへステップアップする。<br>'
        '<span class="kw4">避けるべき対応</span>も国試では狙われる。'
        '<span class="kw4">ステロイド外用の「塗る量が少なすぎる」ことが治療失敗の最大の原因</span>で、'
        '<span class="kw3">1 FTU（約0.5g）＝手掌2枚分</span>を目安に'
        '<span class="kw3">ティッシュが貼りつく程度</span>しっかり塗るよう具体的に指導する。'
        '<span class="kw4">ステロイド内服の漫然とした長期投与は、中止時のリバウンドがあり原則行わない</span>。'),
  point=('🎯 国試ポイント',
         '① AD診断の3本柱＝<span class="kw3">瘙痒・特徴的な皮疹と分布・慢性反復性の経過</span>。<br>'
         '② 病態＝<span class="kw3">フィラグリン変異等によるバリア破綻＋IL-4/IL-13/IL-31のTh2炎症</span>の悪循環。<br>'
         '③ 分布は年齢で動く＝<span class="kw3">乳児は顔・頭／幼小児は四肢屈側／成人は上半身と苔癬化・痒疹</span>。<br>'
         '④ 検査＝<span class="kw3">好酸球増多・IgE高値</span>（<span class="kw">Q.51・Q.52</span>）、'
         '重症度指標は<span class="kw3">TARC</span>。<br>'
         '⑤ 皮膚症状の第一選択は<span class="kw3">ステロイド外用</span>。'
         '＋保湿＋悪化因子の除去。難治例に<span class="kw3">デュピルマブ・JAK阻害薬</span>。<br>'
         '⑥ 「異型リンパ球の浸潤なし」＝<span class="kw3">菌状息肉症の否定</span>。成人の難治性紅皮症では必ず鑑別する。')),

Q('119A-61', 73, [('bs', '★'), ('bi', '📷')],
  '16歳の男子。<span class="kw">発熱と皮疹</span>を主訴に来院した。'
  '<span class="kw">幼少期からアトピー性皮膚炎で治療を受けていたが、3か月前から治療を中断していた</span>。'
  '<span class="kw">2日前から39.9℃の発熱</span>があり、顔面に皮疹が出現し体幹にも拡大したため受診した。疼痛はない。'
  '<span class="kw">顔面と体幹に小水疱、びらん及び紅斑を両側性に認めた</span>。顔面の写真を示す。<br>'
  '<strong>原因で最も考えられるのはどれか。</strong>',
  [('a', 'サイトメガロウイルス', False, '<span class="kw4">免疫不全者の網膜炎・肺炎・腸炎や、先天感染（難聴・小頭症）</span>が主体。'
                     '健常〜アトピー患者の皮膚に集簇性小水疱をつくる病原体ではない。'),
   ('b', '単純ヘルペスウイルス', True, '<span class="kw3">アトピー性皮膚炎の患者にHSVが広範に播種したもの＝Kaposi水痘様発疹症〈疱疹性湿疹〉</span>。'
                     '<span class="kw3">バリアが壊れた湿疹病変の上に、中心臍窩をもつ小水疱が集簇して急速に拡大し、'
                     '融合してびらん・出血性痂皮となる。高熱を伴う</span>——写真も病歴もこの典型像である。'),
   ('c', '水痘・帯状疱疹ウイルス', False, '<span class="kw4">水痘なら新旧の皮疹が混在して全身性に散在</span>し、'
                     '<span class="kw4">帯状疱疹なら片側性・デルマトームに一致し疼痛を伴う</span>。'
                     '本例は<span class="kw">両側性で顔面に集簇</span>し疼痛がなく、どちらの分布にも合わない。'),
   ('d', 'ヒトヘルペスウイルス6', False, '<span class="kw4">突発性発疹〈exanthema subitum〉の原因</span>。'
                     '乳幼児が3〜4日の高熱の後、<span class="kw4">解熱とともに体幹主体の淡い紅斑を生じる</span>もので、水疱はできない。'),
   ('e', 'Epstein-Barr〈EB〉ウイルス', False, '<span class="kw4">伝染性単核球症</span>（発熱・咽頭痛・リンパ節腫脹・肝脾腫・異型リンパ球）。'
                     '皮疹は<span class="kw">アンピシリン投与後の斑状丘疹状発疹</span>が有名で、集簇性の小水疱ではない。')],
  'アトピー性皮膚炎の治療中断中に、高熱とともに顔面から体幹へ集簇性小水疱・びらんが両側性に拡大。Kaposi水痘様発疹症で、原因は単純ヘルペスウイルス。',
  imgs=['images/119A-61_1.jpeg'],
  patho=('🦠 Kaposi水痘様発疹症——壊れたバリアをHSVが走る',
         '<span class="kw3">Kaposi水痘様発疹症〈eczema herpeticum／疱疹性湿疹〉</span>は、'
         '<span class="kw3">既存の湿疹病変（大半はアトピー性皮膚炎）の上に'
         '単純ヘルペスウイルス〈HSV〉が広範に播種した状態</span>である。'
         '名前に「水痘様」とあるが<span class="kw4">水痘ウイルスは無関係</span>で、'
         '原因は<span class="kw3">HSV-1（まれにHSV-2）</span>——ここが最大の引っかけである（<span class="kw">Q.48</span>）。<br>'
         'なぜアトピー性皮膚炎で起こるのかは病態から一直線に説明できる。'
         '<span class="kw3">①角層バリアが壊れている</span>のでウイルスが侵入しやすい。'
         '<span class="kw3">②Th2優位の環境では抗ウイルス自然免疫（抗菌ペプチドLL-37・β-ディフェンシン、'
         'Ⅰ型インターフェロン応答）が抑えられている</span>ため増殖を止められない。'
         '<span class="kw3">③掻破によって病変から病変へ自家接種される</span>。'
         '本例が<span class="kw3">3か月前から治療を中断していた</span>という記載は、'
         '湿疹がコントロールされずバリアが最も壊れた状態にあったことを示しており、発症の背景そのものである。<br>'
         '臨床像は<span class="kw3">急激</span>で、'
         '<span class="kw3">38〜40℃の高熱と全身倦怠感</span>を伴い、'
         '湿疹のある部位（とくに<span class="kw3">顔面・頸部・上半身</span>）に'
         '<span class="kw3">中心臍窩をもつ小水疱が集簇して出現し、数日で融合してびらん・出血性痂皮</span>となる。'
         '所属リンパ節が腫れることも多い。'
         '<span class="kw4">重要なのは合併症で、角膜へ及べばヘルペス角膜炎（失明のリスク）、'
         '中枢へ及べばヘルペス脳炎、皮膚バリアの広範な破綻から細菌の二次感染・敗血症・脱水</span>を起こしうる。'
         '<span class="kw3">眼周囲の病変では必ず眼科へコンサルトする</span>。<br>'
         '診断は臨床像で強く疑い、'
         '<span class="kw3">Tzanck試験（水疱底の擦過で多核巨細胞）</span>で迅速に裏づける（<span class="kw">Q.42</span>）。'
         '確定は<span class="kw">蛍光抗体法・PCR・ウイルス分離</span>による。'
         '治療は<span class="kw3">アシクロビル（重症例は点滴静注、軽症なら内服）を可及的早期に開始</span>し、'
         '<span class="kw3">細菌の二次感染があれば抗菌薬を併用</span>する。'
         '<span class="kw4">ステロイド外用は感染期には原則中止・減量</span>し、'
         '<span class="kw3">感染が制御されたら湿疹治療を再開してバリアを立て直す</span>——'
         '再発予防はアトピー性皮膚炎のコントロールそのものである。'),
  deep=('📌 集簇性小水疱の鑑別と、ヘルペスウイルス科の整理',
        '<table class="tb"><tr><th>疾患</th><th>分布</th><th>熱・痛み</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Kaposi水痘様発疹症</span></td>'
        '<td><span class="kw3">既存の湿疹部位（顔面・上半身）に両側性・集簇</span></td>'
        '<td>高熱あり／疼痛は乏しい</td><td><span class="kw3">AD の既往＋HSV</span></td></tr>'
        '<tr><td>水痘</td><td>全身に散在、<span class="kw">新旧混在</span></td><td>発熱</td><td>VZV初感染</td></tr>'
        '<tr><td>帯状疱疹</td><td><span class="kw3">片側性・デルマトームに一致</span></td>'
        '<td><span class="kw3">神経痛が強い</span></td><td>VZV再活性化・Ramsay Hunt症候群</td></tr>'
        '<tr><td>伝染性膿痂疹</td><td>顔面・四肢、飛び火</td><td>発熱は軽度</td>'
        '<td><span class="kw">黄色ブドウ球菌／A群溶連菌</span>・厚い黄色痂皮</td></tr>'
        '<tr><td>種痘様水疱症</td><td><span class="kw">露光部</span></td><td>—</td>'
        '<td><span class="kw">EBV関連・小児・瘢痕を残す</span>（<span class="kw">Q.46</span>の肢a）</td></tr>'
        '<tr><td>SSSS</td><td>全身・間擦部から</td><td>発熱・<span class="kw">疼痛あり</span></td>'
        '<td><span class="kw">表皮剝脱毒素・Nikolsky陽性・口囲の放射状亀裂</span></td></tr></table>'
        '<table class="tb"><tr><th>ヘルペスウイルス</th><th>代表疾患</th></tr>'
        '<tr><td><span class="kw3">HSV-1／HSV-2（HHV-1/2）</span></td>'
        '<td><span class="kw3">口唇ヘルペス・性器ヘルペス・Kaposi水痘様発疹症・ヘルペス脳炎・角膜炎</span></td></tr>'
        '<tr><td><span class="kw">VZV（HHV-3）</span></td><td>水痘・帯状疱疹</td></tr>'
        '<tr><td><span class="kw">EBV（HHV-4）</span></td><td>伝染性単核球症・上咽頭癌・Burkittリンパ腫・種痘様水疱症</td></tr>'
        '<tr><td>CMV（HHV-5）</td><td>先天感染・免疫不全者の網膜炎/肺炎/腸炎</td></tr>'
        '<tr><td><span class="kw">HHV-6／HHV-7</span></td><td><span class="kw3">突発性発疹</span>・（HHV-6は<span class="kw">DIHS</span>で再活性化）</td></tr>'
        '<tr><td>HHV-8</td><td>Kaposi肉腫（<span class="kw4">Kaposi水痘様発疹症とは無関係</span>）</td></tr></table>'
        '<span class="kw4">「Kaposi」が付く2つの疾患はまったく別物</span>——'
        '<span class="kw3">Kaposi水痘様発疹症＝HSV／Kaposi肉腫＝HHV-8</span>。ここも定番の混同ポイントである。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Kaposi水痘様発疹症の原因は単純ヘルペスウイルス〈HSV〉</span>。'
         '<span class="kw4">「水痘様」でもVZVではない</span>（<span class="kw">Q.42・Q.48</span>）。<br>'
         '② 背景は<span class="kw3">アトピー性皮膚炎</span>（<span class="kw">Q.41</span>）——'
         'バリア破綻＋Th2優位で抗ウイルス自然免疫が低下している。<br>'
         '③ 臨床＝<span class="kw3">高熱＋既存湿疹部位に集簇性小水疱→融合してびらん・出血性痂皮</span>。<br>'
         '④ 迅速診断は<span class="kw3">Tzanck試験（多核巨細胞）</span>、確定はPCR・蛍光抗体法。<br>'
         '⑤ 治療は<span class="kw3">アシクロビルを早期に</span>。'
         '<span class="kw4">眼周囲病変は角膜炎のリスクがあり眼科コンサルト</span>。<br>'
         '⑥ <span class="kw3">Kaposi水痘様発疹症＝HSV／Kaposi肉腫＝HHV-8</span>。')),
]

# ============================================================
# B問題（★問題） NO.30-36 → Q.30-36
# ============================================================
QUESTIONS += [

Q('115F-50', 98, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '42歳の女性。自宅近くの歯科診療所で<span class="kw">歯科金属のアレルギー</span>を疑われ、検査を勧められて来院した。'
  '<span class="kw">ネックレスとピアスで皮膚症状を生じたことがある</span>。実施した皮膚検査の写真を示す。<br>'
  '<strong>この検査で判定するアレルギー型はどれか。</strong>',
  [('a', 'Ⅰ型', False, '<span class="kw4">IgEと肥満細胞による即時型</span>。'
                     '<span class="kw">蕁麻疹・アナフィラキシー・食物アレルギー・アレルギー性鼻炎</span>が代表で、'
                     '検査は<span class="kw">プリックテスト・皮内テスト（15〜20分で膨疹）・特異的IgE</span>（<span class="kw">Q.44</span>）。'),
   ('b', 'Ⅱ型', False, '<span class="kw4">細胞表面の抗原に結合したIgG/IgMが補体や貪食細胞を介して細胞を壊す型</span>。'
                     '<span class="kw">自己免疫性溶血性貧血・ITP・Goodpasture症候群・天疱瘡・水疱性類天疱瘡</span>など。皮膚テストで判定するものではない。'),
   ('c', 'Ⅲ型', False, '<span class="kw4">免疫複合体が組織に沈着して補体を活性化する型</span>。'
                     '<span class="kw">血清病・SLE・IgA血管炎・Arthus反応</span>など。'),
   ('d', 'Ⅳ型', True, '<span class="kw3">写真は背部に多数のチャンバーを貼付したパッチテスト（貼布試験）</span>。'
                     '<span class="kw3">感作T細胞が抗原提示を受けて起こす遅延型反応を見る検査</span>で、'
                     '<span class="kw3">金属アレルギー・接触皮膚炎の原因検索の標準法</span>である。'),
   ('e', 'Ⅴ型', False, '<span class="kw4">受容体に対する自己抗体が刺激（または阻害）する型</span>で、Ⅱ型の亜型として扱われる。'
                     '<span class="kw">Basedow病（抗TSH受容体抗体）・重症筋無力症</span>が代表。皮膚テストの対象ではない。')],
  '写真は背部に貼付したパッチテスト（貼布試験）。Ⅳ型（遅延型）アレルギーを判定する検査で、金属アレルギー・接触皮膚炎の原因検索に用いる。',
  imgs=['images/115F-50_1.jpeg'],
  patho=('🔬 パッチテスト——Ⅳ型アレルギーを「時間」で読む検査',
         '<span class="kw3">パッチテスト〈貼布試験〉</span>は'
         '<span class="kw3">被疑物質を含むチャンバーを背部（または上腕外側）に貼り、'
         '感作T細胞による遅延型（Ⅳ型）反応が起こるかを見る検査</span>である。'
         '写真のように<span class="kw3">多数の抗原を並べたパネルを一度に貼れる</span>のが特徴で、'
         '日本では<span class="kw">ジャパニーズスタンダードアレルゲン</span>のパネルが用いられる。<br>'
         '検査が成立する理屈は、そのままⅣ型アレルギーの機序である。'
         'ニッケルなどの金属イオンは単独では小さすぎて抗原にならない'
         '<span class="kw3">ハプテン</span>だが、皮膚のタンパクと結合して完全抗原となる。'
         'これを<span class="kw3">表皮のLangerhans細胞が取り込み、所属リンパ節へ運んでT細胞に提示</span>する。'
         'すでに感作されている人では記憶T細胞が皮膚へ戻り、'
         '<span class="kw3">曝露から24〜48時間かけて</span>湿疹反応を起こす。'
         'この時間経過があるため、<span class="kw3">48時間貼付し、剝離30分〜1時間後・'
         'さらに48時間後（貼付から）・72時間後</span>と繰り返し判定する。'
         '金属では<span class="kw3">1週間後にようやく陽性化することもある</span>ため、'
         '歯科金属を疑う本例では<span class="kw3">7日目判定を加える</span>のが実務上の要点である。<br>'
         '判定は<span class="kw3">時間とともに反応が強まるか弱まるか</span>で読む。'
         '<span class="kw3">遅延型は日を追って強くなる（crescendo pattern）＝アレルギー性</span>、'
         '<span class="kw4">貼付直後が最も強く以後弱まる（decrescendo pattern）＝刺激性反応</span>である。'
         '<span class="kw4">湿疹が活動性の時期や、ステロイド／免疫抑制薬の内服中、'
         '検査部位へのステロイド外用後は偽陰性</span>になるため、皮疹が落ち着いてから行う。<br>'
         '本例の背景も押さえておきたい。'
         '<span class="kw3">ニッケルは最も頻度の高い接触アレルゲン</span>で、'
         '<span class="kw3">ピアス・ネックレス・時計・ベルトのバックル</span>で感作されることが多い。'
         '感作が成立すると、歯科金属や食物中の微量金属から'
         '<span class="kw3">全身型金属アレルギー（掌蹠膿疱症様の皮疹・全身の湿疹・扁平苔癬様の口腔粘膜病変）</span>を'
         '起こすことがあり、本例はまさにその流れで紹介されている。'
         '<span class="kw3">陽性金属が同定できれば、歯科補綴物の除去・置換</span>が治療になる。'),
  deep=('📌 アレルギーⅠ〜Ⅴ型と、対応する検査',
        '<table class="tb"><tr><th>型</th><th>機序</th><th>代表疾患</th><th>検査</th></tr>'
        '<tr><td><span class="kw3">Ⅰ型（即時型）</span></td><td><span class="kw3">IgE＋肥満細胞</span></td>'
        '<td>蕁麻疹・アナフィラキシー・食物/花粉症</td>'
        '<td><span class="kw3">プリック／皮内テスト（15〜20分）</span>・特異的IgE</td></tr>'
        '<tr><td>Ⅱ型（細胞傷害型）</td><td>IgG/IgM＋補体</td>'
        '<td>AIHA・ITP・<span class="kw">天疱瘡・水疱性類天疱瘡</span>・Goodpasture</td><td>Coombs試験・自己抗体・蛍光抗体法</td></tr>'
        '<tr><td>Ⅲ型（免疫複合体型）</td><td>免疫複合体の沈着</td>'
        '<td>血清病・SLE・<span class="kw">IgA血管炎</span>・Arthus反応</td><td>補体低下・免疫複合体・生検</td></tr>'
        '<tr><td><span class="kw3">Ⅳ型（遅延型）</span></td><td><span class="kw3">感作T細胞</span></td>'
        '<td><span class="kw3">接触皮膚炎・金属アレルギー</span>・ツベルクリン反応・移植拒絶・薬疹の一部</td>'
        '<td><span class="kw3">パッチテスト（48時間貼付／48・72時間・金属は7日判定）</span>・DLST</td></tr>'
        '<tr><td>Ⅴ型（刺激型）</td><td>受容体への自己抗体</td><td>Basedow病・重症筋無力症</td><td>抗TSH受容体抗体等</td></tr></table>'
        '<span class="kw3">主な接触アレルゲン</span>: '
        '<span class="kw3">ニッケル・コバルト・クロム（金属）</span>、'
        '<span class="kw">パラフェニレンジアミン（毛染め・<span class="kw">Q.39</span>）</span>、'
        '<span class="kw">ウルシ・ギンナン（植物）</span>、'
        '<span class="kw">チウラム・ラテックス（ゴム手袋）</span>、'
        '<span class="kw">香料・防腐剤（化粧品）</span>、そして'
        '<span class="kw4">外用薬そのもの（ケトプロフェン・抗菌薬・ステロイド基剤）</span>。'
        '<span class="kw4">「塗ると悪化する」と訴える患者では、治療薬自体による接触皮膚炎を必ず疑う</span>。<br>'
        'なお<span class="kw3">光パッチテスト</span>は、同じ抗原を2列貼って'
        '<span class="kw3">片方だけに紫外線を照射し、照射側のみ陽性なら光接触皮膚炎</span>と判定するもので、'
        '<span class="kw">ケトプロフェン外用薬</span>による光接触皮膚炎の診断に用いられる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">パッチテスト＝Ⅳ型（遅延型）</span>。接触皮膚炎・金属アレルギーの原因検索の標準法。<br>'
         '② 手技＝<span class="kw3">48時間貼付 → 剝離後・48時間・72時間に判定</span>。'
         '<span class="kw3">金属は7日目判定を加える</span>。<br>'
         '③ 判定＝<span class="kw3">日を追って強まる（crescendo）＝アレルギー性</span>／'
         '<span class="kw4">弱まる（decrescendo）＝刺激性</span>。<br>'
         '④ <span class="kw4">皮疹の活動期・ステロイド使用中は偽陰性</span>。落ち着いてから行う。<br>'
         '⑤ <span class="kw3">Ⅰ型はプリック／皮内テスト（15〜20分）</span>——判定時間で型が分かる（<span class="kw">Q.44</span>）。<br>'
         '⑥ ニッケルは<span class="kw3">最多の接触アレルゲン</span>。ピアス・ネックレスで感作され、歯科金属で全身型を起こす。')),

Q('112C-25', 95, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '32歳の女性。<span class="kw">痒みを伴う皮疹</span>を主訴に来院した。'
  '<span class="kw">昨日夕食後に皮疹が背部に出現し、消退した後に下肢に同様の皮疹が出現した</span>。下肢の写真を示す。<br>'
  '<strong>この皮疹の種類はどれか。</strong>',
  [('a', '丘　疹', False, '<span class="kw4">直径1cm未満の限局性の隆起で、持続する</span>。'
                     '本例のように<span class="kw4">数時間で消えて別の場所に出る</span>という移動性は示さない。'),
   ('b', '局　面', False, '<span class="kw4">丘疹や結節が融合してできた、平坦で面として広がる隆起（直径1cm以上）</span>。'
                     '乾癬や苔癬化のように<span class="kw4">持続的な病変</span>を指す語で、一過性の皮疹には使わない。'),
   ('c', '紅　斑', False, '<span class="kw4">血管拡張による限局性の赤みで、隆起を伴わない</span>。'
                     '写真の皮疹ははっきりと<span class="kw4">堤防状に隆起</span>しており、平坦な紅斑ではない。'),
   ('d', '水　疱', False, '<span class="kw4">表皮内または表皮下に漿液が貯留した隆起</span>。'
                     '本例に水疱の記載はなく、写真も内容液を含まない充実性の隆起である。'),
   ('e', '膨　疹', True, '<span class="kw3">真皮上層の一過性の浮腫による扁平な隆起</span>。'
                     '<span class="kw3">数十分〜数時間、遅くとも24時間以内に跡形なく消退し、次々と場所を変えて出没する</span>のが本態で、'
                     '写真でも下肢に地図状に癒合した扁平隆起がみられる。<span class="kw3">蕁麻疹の原発疹</span>である。')],
  '夕食後に出現し、消退した後に別の部位へ出現するという移動性・一過性、痒みを伴う扁平な隆起。膨疹（蕁麻疹）。',
  imgs=['images/112C-25_1.jpeg'],
  patho=('🌊 膨疹の定義は「一過性」——24時間で消えることが決め手',
         '<span class="kw3">膨疹〈wheal〉</span>は'
         '<span class="kw3">真皮上層の血管透過性が一過性に亢進して生じた浮腫による、'
         '扁平に隆起した皮疹</span>である。'
         '定義の中心は形ではなく<span class="kw3">時間</span>にある——'
         '<span class="kw3">個々の皮疹は数十分〜数時間、遅くとも24時間以内に、'
         '色素沈着も鱗屑も残さず跡形なく消退する</span>。'
         '本例の<span class="kw3">「背部に出現し、消退した後に下肢に同様の皮疹が出現した」</span>という一文が、'
         'まさにこの一過性と移動性を語っており、これだけで膨疹と決まる。<br>'
         '機序は<span class="kw3">肥満細胞の脱顆粒によるヒスタミン放出</span>である。'
         'ヒスタミンが<span class="kw3">H1受容体</span>に働くと、'
         '<span class="kw3">①細静脈の血管透過性亢進 → 真皮上層への血漿の漏出 → 膨疹</span>、'
         '<span class="kw3">②血管拡張 → 周囲の発赤（紅暈）</span>、'
         '<span class="kw3">③知覚神経のC線維の刺激 → 瘙痒</span>が同時に起こる。'
         'この3つが揃うのが蕁麻疹の皮疹で、'
         '<span class="kw">Q.22（皮膚描記症）で述べたLewisの三重反応</span>と同じ現象である。'
         '浮腫が引けば元通りになるので、<span class="kw3">表皮には変化が起きない</span>——'
         'だから<span class="kw3">鱗屑も痂皮もできない</span>（<span class="kw">Q.35</span>）し、'
         '病理でも<span class="kw3">真皮上層の浮腫</span>だけが見える（<span class="kw">Q.33</span>）。<br>'
         '<span class="kw3">蕁麻疹〈urticaria〉</span>は'
         '<span class="kw3">「膨疹すなわち一過性・限局性の浮腫が病的に出没する疾患」</span>と定義され、'
         '<span class="kw3">発症から6週未満を急性蕁麻疹、6週以上続くものを慢性蕁麻疹</span>と呼ぶ。'
         '本例は昨日からなので急性である。'
         '<span class="kw4">なお、個々の皮疹が24時間以上持続する・紫斑や色素沈着を残す・'
         '痛みや灼熱感が強い・発熱や関節痛を伴う場合は「蕁麻疹様血管炎」を疑い、生検を検討する</span>。'
         'ここは<span class="kw3">「消えるかどうかを必ず確かめる」</span>という臨床の要点になる。'),
  deep=('📌 蕁麻疹の分類と治療／膨疹と紛らわしい皮疹',
        '<table class="tb"><tr><th>皮疹</th><th>持続</th><th>隆起</th><th>あとに残るもの</th></tr>'
        '<tr><td><span class="kw3">膨疹</span></td><td><span class="kw3">24時間以内に消退</span></td>'
        '<td>扁平隆起</td><td><span class="kw3">何も残さない</span></td></tr>'
        '<tr><td>紅斑</td><td>数日〜</td><td>なし</td><td>色素沈着を残しうる</td></tr>'
        '<tr><td>丘疹</td><td>持続</td><td>あり（1cm未満）</td><td>—</td></tr>'
        '<tr><td>局面</td><td>持続</td><td>面状（1cm以上）</td><td>—</td></tr>'
        '<tr><td><span class="kw">血管性浮腫〈Quincke浮腫〉</span></td><td><span class="kw">2〜3日</span></td>'
        '<td><span class="kw">真皮深層〜皮下の腫脹</span></td><td>—（<span class="kw4">眼瞼・口唇・喉頭に注意</span>）</td></tr></table>'
        '<span class="kw3">蕁麻疹の分類</span>: '
        '<span class="kw3">①特発性</span>（急性＜6週／慢性≧6週。<span class="kw">最多で原因不明のことが多い</span>）、'
        '<span class="kw3">②刺激誘発型</span>（<span class="kw">機械性（皮膚描記症・Q.22）・寒冷・日光・温熱・'
        'コリン性（発汗刺激で1〜4mmの小型膨疹）・接触・食物・薬剤</span>）、'
        '<span class="kw3">③血管性浮腫</span>（<span class="kw4">遺伝性血管性浮腫〈HAE〉はC1インヒビター欠損で、'
        'ヒスタミンではなくブラジキニンが主体のため抗ヒスタミン薬もアドレナリンも効かない</span>）、'
        '④蕁麻疹関連疾患（色素性蕁麻疹＝<span class="kw">Q.7</span> など）。<br>'
        '<span class="kw3">治療</span>は<span class="kw3">非鎮静性（第2世代）抗ヒスタミン薬の内服が第一選択</span>で、'
        '効果不十分なら<span class="kw">増量・薬剤の変更・併用</span>、'
        '慢性難治例には<span class="kw3">オマリズマブ（抗IgE抗体）</span>や'
        '<span class="kw">シクロスポリン</span>を用いる。'
        '<span class="kw4">ステロイド全身投与は急性の重症例に短期で使うにとどめ、漫然と続けない</span>。'
        '<span class="kw3">アナフィラキシー（呼吸困難・血圧低下・喉頭浮腫）を伴うときは'
        'ためらわずアドレナリン0.3mgを大腿外側に筋注</span>する——これが最優先の対応である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">膨疹＝真皮上層の一過性浮腫。24時間以内に跡形なく消退する</span>のが定義（<span class="kw">Q.47</span>）。<br>'
         '② 機序＝<span class="kw3">肥満細胞のヒスタミン→血管透過性亢進・血管拡張・瘙痒</span>。<br>'
         '③ <span class="kw3">表皮に変化を起こさない</span>ので鱗屑・痂皮ができない（<span class="kw">Q.33・Q.35</span>）。<br>'
         '④ 急性＜6週／慢性≧6週。刺激誘発型には<span class="kw3">機械性・寒冷・日光・コリン性</span>がある。<br>'
         '⑤ 治療は<span class="kw3">非鎮静性抗ヒスタミン薬</span>が第一選択。難治例に<span class="kw3">オマリズマブ</span>。<br>'
         '⑥ <span class="kw4">24時間以上残る／紫斑を残す／痛い膨疹は蕁麻疹様血管炎</span>を疑い生検する。')),

Q('108A-14', 38, [('bs', '★')],
  '<strong>アトピー性皮膚炎に伴う<span class="kw">網膜剝離</span>の種類はどれか。</strong>',
  [('a', '出血性', False, '網膜下や硝子体への出血に伴うもので、'
                     '<span class="kw4">増殖糖尿病網膜症・網膜静脈閉塞症・加齢黄斑変性</span>などで問題になる病態。ADとは結びつかない。'),
   ('b', '牽引性', False, '<span class="kw4">増殖膜が網膜を引っ張って剝離させる</span>もので、'
                     '<span class="kw">増殖糖尿病網膜症・未熟児網膜症・増殖硝子体網膜症</span>が代表。'),
   ('c', '漿液性', False, '<span class="kw4">網膜色素上皮のバリア破綻により網膜下へ液体が貯留</span>するもの。'
                     '<span class="kw">中心性漿液性脈絡網膜症・Vogt-小柳-原田病・後部強膜炎</span>などでみられる。'),
   ('d', '滲出性', False, '漿液性とほぼ同義に扱われる分類で、'
                     '<span class="kw4">脈絡膜腫瘍・原田病・重症の高血圧網膜症</span>など。'
                     '網膜に「穴」が開いて起こるものではない点で本例と機序が異なる。'),
   ('e', '裂孔原性', True, '<span class="kw3">網膜に裂孔（穴）ができ、そこから液化硝子体が網膜下へ入り込んで剝離するもの</span>。'
                     '<span class="kw3">アトピー性皮膚炎では顔面・眼周囲を繰り返し叩く・こすることによる物理的な衝撃</span>で'
                     '網膜裂孔が生じ、これが起こる（<span class="kw">Q.40</span>）。')],
  'アトピー性皮膚炎に伴う網膜剝離は裂孔原性。顔面・眼周囲の反復する掻破・叩打という機械的刺激が網膜裂孔をつくる。',
  patho=('👁️ アトピー性皮膚炎の眼合併症——「叩く・こする」が眼を壊す',
         'アトピー性皮膚炎では顔面、とくに眼周囲に強い瘙痒が生じるため、'
         '患者は<span class="kw3">目をこすり、手のひらで叩き、時に強く圧迫する</span>という行為を'
         '何年にもわたって繰り返す。'
         'この<span class="kw3">反復する機械的外力が眼球に伝わること</span>が、'
         'アトピー性皮膚炎に特有の眼合併症を生む共通の原因である。'
         'AD患者の眼合併症は<span class="kw3">「掻破・叩打による外傷性」と理解する</span>と、'
         '個別に暗記せずに導ける。<br>'
         '<span class="kw3">網膜剝離</span>もこの延長にある。'
         '眼球に衝撃が加わると<span class="kw3">網膜周辺部に裂孔（穴）が生じ、'
         'そこから液化した硝子体が網膜下へ回り込んで網膜色素上皮から剝がす</span>。'
         'これが<span class="kw3">裂孔原性網膜剝離〈rhegmatogenous retinal detachment〉</span>で、'
         '「rhegma＝裂け目」という語源のとおり<span class="kw3">「穴があること」が定義</span>である。'
         '<span class="kw3">AD患者では10〜20歳代という若年で、しばしば両眼性に発症</span>する点が'
         '一般的な加齢性の裂孔原性網膜剝離と異なる。'
         '症状は<span class="kw3">飛蚊症・光視症で始まり、視野欠損が拡大して最終的に視力低下</span>に至る。'
         '<span class="kw4">黄斑に及ぶ前に治療できるかで視力予後が決まる</span>ため、'
         '<span class="kw3">網膜復位術（強膜バックリング・硝子体手術）が必要な眼科救急</span>である。<br>'
         'もう一つの代表が<span class="kw3">アトピー白内障</span>で、'
         'これも叩打による水晶体への衝撃と、慢性炎症・ステロイドの影響が関与すると考えられている。'
         '<span class="kw3">若年で、前囊下・後囊下に混濁</span>を生じ、急速に進行することがある（<span class="kw">Q.37・Q.50</span>）。'
         '<span class="kw3">円錐角膜</span>も目をこする習慣と関連して起こり、'
         '角膜が円錐状に突出して不正乱視をきたす。'
         '<span class="kw3">網膜剝離・白内障・円錐角膜——この3つがAD の三大眼合併症</span>である。<br>'
         '正答率38%と低いのは、<span class="kw4">網膜剝離の分類（裂孔原性・牽引性・漿液性）が'
         '眼科の知識として整理されていないまま、皮膚科の問題として出題されている</span>ためである。'
         '<span class="kw3">「AD＝叩く・こする＝外力＝穴が開く＝裂孔原性」</span>と機序でつなげば確実に取れる。'),
  deep=('📌 網膜剝離の3分類と、AD の眼合併症',
        '<table class="tb"><tr><th>種類</th><th>機序</th><th>代表的な原因</th></tr>'
        '<tr><td><span class="kw3">裂孔原性</span></td><td><span class="kw3">網膜裂孔から液化硝子体が流入</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎（叩打）</span>・強度近視・加齢（後部硝子体剝離）・外傷</td></tr>'
        '<tr><td>牽引性</td><td>増殖膜が網膜を引く</td><td>増殖糖尿病網膜症・未熟児網膜症</td></tr>'
        '<tr><td>漿液性（滲出性）</td><td>網膜色素上皮のバリア破綻で網膜下に液貯留</td>'
        '<td>中心性漿液性脈絡網膜症・<span class="kw">Vogt-小柳-原田病</span>・脈絡膜腫瘍</td></tr></table>'
        '<table class="tb"><tr><th>AD の眼合併症</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">アトピー白内障</span></td>'
        '<td><span class="kw3">最も頻度が高く、定期スクリーニングの対象</span>。若年発症・前囊下/後囊下混濁・急速進行しうる（<span class="kw">Q.37</span>）</td></tr>'
        '<tr><td><span class="kw3">裂孔原性網膜剝離</span></td>'
        '<td><span class="kw3">10〜20歳代・両眼性のことあり</span>。飛蚊症・光視症→視野欠損。<span class="kw4">眼科救急</span>（<span class="kw">Q.40</span>）</td></tr>'
        '<tr><td><span class="kw">円錐角膜</span></td><td>こする習慣と関連。角膜の円錐状突出・不正乱視</td></tr>'
        '<tr><td>アトピー性角結膜炎・春季カタル</td><td>眼瞼結膜の巨大乳頭・角膜潰瘍（シールド潰瘍）</td></tr>'
        '<tr><td>眼瞼炎・Hertoghe徴候</td><td><span class="kw">眉毛外側1/3の脱落</span>＝慢性の擦過による</td></tr></table>'
        '<span class="kw3">患者指導</span>が予防そのものになる。'
        '<span class="kw3">①顔面の湿疹をきちんと治療して痒みを断つ</span>（'
        '顔面には medium 以下のステロイドかタクロリムス軟膏を用いる）、'
        '<span class="kw3">②「目を叩かない・こすらない」と具体的に伝える</span>、'
        '<span class="kw3">③飛蚊症・光視症・視野欠損が出たらすぐ受診するよう教える</span>、'
        '<span class="kw3">④顔面に皮疹のある患者は定期的に眼科受診</span>——'
        'この4点が国試でも実臨床でも問われる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">AD に伴う網膜剝離＝裂孔原性</span>。原因は<span class="kw3">眼周囲の叩打・掻破という機械的外力</span>。<br>'
         '② <span class="kw3">10〜20歳代の若年発症で両眼性のこともある</span>。飛蚊症・光視症→視野欠損。<br>'
         '③ AD の三大眼合併症＝<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>（<span class="kw">Q.37・Q.40・Q.50</span>）。<br>'
         '④ 網膜剝離の3分類＝<span class="kw3">裂孔原性（穴）／牽引性（増殖膜）／漿液性（色素上皮のバリア破綻）</span>。<br>'
         '⑤ 予防は<span class="kw3">顔面の湿疹を治して痒みを断ち、叩かせないこと</span>＋定期的な眼科受診。<br>'
         '⑥ 正答率38%——<span class="kw4">分類を暗記でなく機序でつなぐ</span>（外力→穴→裂孔原性）。')),

Q('108G-13', 95, [('bs', '★'), ('bc', 'CBT')],
  '<strong><span class="kw">蕁麻疹</span>の病理組織像で正しいのはどれか。</strong>',
  [('a', '表皮の海綿状態', False, '<span class="kw4">表皮細胞間に浮腫が生じて細胞どうしが引き離され、スポンジ状に見える所見</span>。'
                     '<span class="kw3">湿疹・皮膚炎群（接触皮膚炎・アトピー性皮膚炎）に特徴的</span>で、'
                     '表皮に変化が及ぶために鱗屑や漿液性丘疹ができる（<span class="kw">Q.35</span>）。蕁麻疹では表皮は正常である。'),
   ('b', '表皮基底層の液状変性', False, '<span class="kw4">基底層の細胞が空胞化・壊死する所見＝界面皮膚炎</span>。'
                     '<span class="kw">扁平苔癬・固定薬疹・多形滲出性紅斑・GVHD・エリテマトーデス</span>でみられる（<span class="kw">Q.20</span>）。'),
   ('c', '真皮上層の浮腫', True, '<span class="kw3">正しい。膨疹の実体は真皮上層（乳頭層）の浮腫</span>で、'
                     '<span class="kw3">膠原線維束の間隙が開き、血管周囲に軽度の炎症細胞（好酸球・好中球・リンパ球）浸潤</span>を伴う。'
                     '<span class="kw3">表皮は正常</span>のままである。'),
   ('d', '真皮中層の血管炎', False, '<span class="kw4">血管壁のフィブリノイド壊死と核塵を伴う白血球破砕性血管炎</span>を指す。'
                     '<span class="kw">IgA血管炎などの血管炎</span>や、'
                     '<span class="kw4">膨疹が24時間以上持続する「蕁麻疹様血管炎」</span>でみられる所見で、通常の蕁麻疹にはない。'),
   ('e', '脂肪織炎', False, '<span class="kw4">皮下脂肪織の炎症</span>で、'
                     '<span class="kw">結節性紅斑・硬結性紅斑・膵性脂肪織炎</span>など。'
                     '病変の深さが真皮上層とはまったく異なる。')],
  '蕁麻疹（膨疹）の実体は真皮上層の浮腫。表皮は正常で、血管周囲に軽度の炎症細胞浸潤を伴うのみ。海綿状態は湿疹、液状変性は界面皮膚炎、血管炎は蕁麻疹様血管炎。',
  patho=('🔍 「病変の深さ」で病理像は決まる',
         '皮膚病理は<span class="kw3">「どの層に、何が起きているか」</span>の2点で整理すると、'
         '臨床像と一対一で結びつく。<br>'
         '<span class="kw3">蕁麻疹</span>の病変は<span class="kw3">真皮上層（乳頭層）の浮腫</span>——ただそれだけである。'
         '肥満細胞から出たヒスタミンが細静脈の透過性を上げ、血漿が真皮に漏れる。'
         '組織学的には<span class="kw3">膠原線維束のあいだが押し広げられて疎になり、'
         '血管周囲に好酸球・好中球・リンパ球がごく軽度に浸潤する</span>のが見える。'
         '<span class="kw3">重要なのは表皮がまったく変化しないこと</span>で、'
         'ここから臨床の性質がすべて導ける——'
         '<span class="kw3">①浮腫が引けば元に戻るので24時間以内に跡形なく消える</span>（<span class="kw">Q.31</span>）、'
         '<span class="kw3">②表皮が壊れないので鱗屑も痂皮も水疱もできない</span>（<span class="kw">Q.35・Q.36</span>）、'
         '<span class="kw3">③色素沈着も瘢痕も残さない</span>。<br>'
         'これと対をなすのが<span class="kw3">湿疹・皮膚炎群</span>である。'
         'こちらは<span class="kw3">表皮の海綿状態〈spongiosis〉＝表皮細胞間の浮腫</span>が本体で、'
         '細胞間橋が引き伸ばされてスポンジ状に見える。'
         '浮腫が強ければ表皮内に小水疱をつくり、破れて漿液が出て（漿液性丘疹・湿潤）、'
         '乾けば痂皮となり、慢性化すれば<span class="kw3">表皮肥厚と過角化＝苔癬化</span>に至る。'
         '<span class="kw3">「湿疹は表皮の病気、蕁麻疹は真皮の病気」</span>——'
         'この一行が<span class="kw">Q.35・Q.36</span>を含む本章の多くの問題の背骨になっている。<br>'
         '第3の型が<span class="kw3">界面皮膚炎〈interface dermatitis〉</span>で、'
         '<span class="kw3">表皮と真皮の境界（基底層）がT細胞に攻撃され、'
         '基底細胞の液状変性とケラチノサイトのアポトーシス</span>が起こる。'
         '<span class="kw3">扁平苔癬・固定薬疹・多形滲出性紅斑・GVHD・エリテマトーデス</span>がこの群で、'
         '基底層が壊れるため<span class="kw3">炎症後色素沈着を残しやすい</span>（メラニンが真皮へ落ちる）。'
         'この「深さで分ける」枠組みを持っておくと、初見の病理設問でも選択肢を機序で切れる。'),
  deep=('📌 皮膚病理の基本パターンと代表疾患',
        '<table class="tb"><tr><th>パターン</th><th>所見</th><th>代表疾患</th></tr>'
        '<tr><td><span class="kw3">真皮上層の浮腫</span></td><td>膠原線維束の離開・血管周囲の軽度浸潤・<span class="kw3">表皮は正常</span></td>'
        '<td><span class="kw3">蕁麻疹（膨疹）</span></td></tr>'
        '<tr><td><span class="kw3">海綿状態</span></td><td>表皮細胞間の浮腫→表皮内小水疱</td>'
        '<td><span class="kw3">湿疹・皮膚炎群</span>（接触皮膚炎・アトピー性皮膚炎・貨幣状湿疹）</td></tr>'
        '<tr><td><span class="kw3">界面皮膚炎</span></td><td><span class="kw3">基底層の液状変性</span>・アポトーシス（Civatte小体）</td>'
        '<td><span class="kw3">扁平苔癬・固定薬疹・多形滲出性紅斑・GVHD・LE</span></td></tr>'
        '<tr><td>乾癬様</td><td><span class="kw">錯角化・顆粒層消失・表皮突起の延長・Munro微小膿瘍</span></td><td>尋常性乾癬</td></tr>'
        '<tr><td>棘融解＋表皮内水疱</td><td>デスモソームの破綻</td><td>天疱瘡（<span class="kw">Q.23</span>）</td></tr>'
        '<tr><td>表皮下水疱</td><td>基底膜部での裂隙</td><td>水疱性類天疱瘡（好酸球浸潤を伴う）</td></tr>'
        '<tr><td>白血球破砕性血管炎</td><td>血管壁のフィブリノイド壊死・核塵</td>'
        '<td>IgA血管炎・<span class="kw">蕁麻疹様血管炎</span></td></tr>'
        '<tr><td>肉芽腫</td><td>類上皮細胞・多核巨細胞</td><td>サルコイドーシス・皮膚結核・環状肉芽腫</td></tr>'
        '<tr><td>脂肪織炎</td><td>皮下脂肪織の炎症（隔壁性／小葉性）</td>'
        '<td><span class="kw">結節性紅斑（隔壁性）・硬結性紅斑（小葉性）</span></td></tr></table>'
        '<span class="kw4">臨床で「生検すべき蕁麻疹」</span>を押さえておく。'
        '<span class="kw3">個々の膨疹が24時間以上持続する／消退後に紫斑や色素沈着を残す／'
        '痒みより痛み・灼熱感が強い／発熱・関節痛・補体低下を伴う</span>——'
        'これらがあれば<span class="kw3">蕁麻疹様血管炎</span>を疑って生検し、'
        '<span class="kw">白血球破砕性血管炎</span>が証明されれば'
        'SLE・シェーグレン症候群・クリオグロブリン血症などの基礎疾患を検索する。'
        '通常の蕁麻疹に生検は不要である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">蕁麻疹の病理＝真皮上層の浮腫。表皮は正常</span>。<br>'
         '② <span class="kw3">湿疹＝表皮の海綿状態</span>（表皮の病気）／<span class="kw3">蕁麻疹＝真皮の浮腫</span>（真皮の病気）。'
         'ここが<span class="kw">Q.35・Q.36</span>の根拠。<br>'
         '③ 表皮が壊れないから<span class="kw3">鱗屑・痂皮ができず、跡を残さず消える</span>。<br>'
         '④ <span class="kw3">基底層の液状変性＝界面皮膚炎</span>（扁平苔癬・固定薬疹・多形滲出性紅斑・GVHD・LE）。<br>'
         '⑤ <span class="kw3">脂肪織炎＝結節性紅斑・硬結性紅斑</span>。深さがまったく違う。<br>'
         '⑥ <span class="kw4">24時間以上続く膨疹は蕁麻疹様血管炎</span>を疑い生検する。')),

Q('103B-10', 91, [('bs', '★')],
  '<strong><span class="kw">急性湿疹</span>でみられるのはどれか。<span class="kw">2つ選べ</span>。</strong>',
  [('a', '硬　化', False, '<span class="kw4">真皮の膠原線維が増生して皮膚が硬く板状になった状態</span>。'
                     '<span class="kw">全身性強皮症・限局性強皮症・慢性の放射線皮膚炎</span>などでみられる'
                     '<span class="kw4">慢性・線維化の所見</span>で、急性の炎症では起こらない。'),
   ('b', '丘　疹', True, '<span class="kw3">急性湿疹の代表的な皮疹</span>。'
                     '<span class="kw3">紅斑の上に小丘疹が生じ、表皮の海綿状態が強まると小水疱・漿液性丘疹となり、'
                     '破れて湿潤し、乾いて痂皮</span>となる。この一連が<span class="kw3">湿疹三角</span>である。'),
   ('c', '紅　斑', True, '<span class="kw3">急性湿疹の最初に現れる基本的な皮疹</span>。'
                     '真皮の血管拡張と炎症細胞浸潤によるもので、境界がやや不明瞭で瘙痒を伴う。'),
   ('d', '膨　疹', False, '<span class="kw4">蕁麻疹の原発疹</span>で、'
                     '<span class="kw4">真皮上層の一過性浮腫による扁平隆起。24時間以内に消退する</span>（<span class="kw">Q.31・Q.33</span>）。'
                     '湿疹は表皮の炎症であり、病態も経過もまったく異なる。'),
   ('e', '紫　斑', False, '<span class="kw4">真皮内出血で、硝子圧法で圧迫しても退色しない</span>。'
                     '<span class="kw">血小板・凝固・血管の異常</span>を示す所見であり、湿疹の構成要素ではない。'
                     '（うっ滞性皮膚炎など慢性例で二次的に紫斑を伴うことはあるが、急性湿疹の皮疹ではない。）')],
  '急性湿疹は紅斑に始まり、丘疹・小水疱・湿潤・痂皮へ進む（湿疹三角）。硬化は慢性の線維化、膨疹は蕁麻疹、紫斑は出血で、いずれも湿疹の皮疹ではない。',
  patho=('🔺 湿疹三角——1つの病変に急性期と慢性期が同居する',
         '<span class="kw3">湿疹〈eczema〉</span>は'
         '<span class="kw3">表皮を主座とする炎症（海綿状態）</span>であり、'
         '国試では<span class="kw3">湿疹三角〈eczema triangle〉</span>という'
         '古典的な図式で経過を捉えるのが定石である。'
         'これは<span class="kw3">湿疹の皮疹が時間とともに決まった順序で移り変わり、'
         'しかも同じ患者の同じ病変に複数の段階が同時に混在する（多様性）</span>ことを示す枠組みである。<br>'
         '<span class="kw3">急性期</span>の順序はこうなる。'
         '<span class="kw3">①紅斑</span>（血管拡張と浮腫）→'
         '<span class="kw3">②丘疹</span>（表皮と真皮乳頭の浮腫が高まる）→'
         '<span class="kw3">③小水疱・漿液性丘疹</span>（海綿状態が進んで表皮内に水がたまる）→'
         '<span class="kw3">④湿潤・びらん</span>（水疱が破れて漿液が滲出する）→'
         '<span class="kw3">⑤痂皮</span>（漿液が乾いてかさぶたになる）→'
         '<span class="kw3">⑥鱗屑</span>（治癒に向かって角層が剝がれる）。'
         '本問の正解<span class="kw3">「丘疹」と「紅斑」</span>は、この列の最初の2つにあたる。<br>'
         '掻破が続いて<span class="kw3">慢性期</span>へ移ると像が変わる。'
         '<span class="kw3">表皮が肥厚して角層が厚くなり、皮野・皮溝が粗大化した'
         '「苔癬化」と、色素沈着、亀裂</span>が主体になる。'
         '<span class="kw">Q.28</span>の症例が「学童期は肘窩や膝窩に苔癬化局面」と書かれているのはこの段階である。'
         '<span class="kw4">ただし慢性期でも「硬化」にはならない</span>——'
         '硬化は真皮の膠原線維が増える線維化であり、強皮症のような別の病態を指す語で、'
         'これが肢aの誤りである。<br>'
         '湿疹の一般的性質も対で覚えておく（<span class="kw">Q.36</span>）。'
         '<span class="kw3">①瘙痒を伴う、②非伝染性、③表皮の炎症、④小水疱を形成しうる、'
         '⑤急性期と慢性期が混在する多様性、⑥境界が比較的不明瞭</span>。'
         'とくに<span class="kw3">「境界不明瞭」</span>は、'
         '<span class="kw3">境界明瞭な体部白癬・乾癬との鑑別点</span>として有用である。'),
  deep=('📌 湿疹の経過と、湿疹に見えて湿疹でないもの',
        '<table class="tb"><tr><th>時期</th><th>皮疹</th><th>病理</th></tr>'
        '<tr><td><span class="kw3">急性期</span></td>'
        '<td><span class="kw3">紅斑→丘疹→小水疱/漿液性丘疹→湿潤・びらん→痂皮→鱗屑</span></td>'
        '<td><span class="kw3">表皮の海綿状態</span>・真皮浅層の浮腫と炎症細胞浸潤</td></tr>'
        '<tr><td><span class="kw3">慢性期</span></td>'
        '<td><span class="kw3">苔癬化・色素沈着・亀裂・鱗屑</span></td>'
        '<td><span class="kw3">表皮肥厚（棘細胞層肥厚）・過角化</span></td></tr></table>'
        '<table class="tb"><tr><th>鑑別</th><th>湿疹との違い</th></tr>'
        '<tr><td><span class="kw3">蕁麻疹</span></td>'
        '<td><span class="kw3">膨疹のみ・24時間以内に消退・表皮は正常</span>（<span class="kw">Q.31・Q.33</span>）</td></tr>'
        '<tr><td><span class="kw3">体部白癬</span></td>'
        '<td><span class="kw3">環状で辺縁が堤防状に隆起・中心治癒・境界明瞭</span>。<span class="kw3">KOH直接鏡検で菌糸</span>。'
        '<span class="kw4">ステロイドを塗ると異型白癬〈tinea incognito〉になり悪化する</span></td></tr>'
        '<tr><td>尋常性乾癬</td><td>境界明瞭な紅斑＋<span class="kw">銀白色の厚い鱗屑</span>・Auspitz現象・伸側好発</td></tr>'
        '<tr><td>疥癬</td><td><span class="kw">指間の疥癬トンネル・夜間の激しい瘙痒・陰部の結節・集団発生</span></td></tr>'
        '<tr><td>菌状息肉症</td><td>難治で年余の経過・<span class="kw">異型リンパ球の表皮内浸潤（Pautrier微小膿瘍）</span>（<span class="kw">Q.28</span>）</td></tr></table>'
        '<span class="kw3">自家感作性皮膚炎</span>も湿疹群の重要な一型である。'
        '<span class="kw3">原発巣（うっ滞性皮膚炎・接触皮膚炎・白癬など）の炎症が強くなると、'
        '数日〜2週後に全身へ小型の紅色丘疹が散布状に多発する</span>もので、'
        '<span class="kw3">治療は原発巣をしっかり治すこと</span>が要点になる（<span class="kw">Q.38・Q.45</span>で誤答肢として登場する）。'
        '「原発巣＋散布疹」という組合せを見たらこれを想起する。'),
  point=('🎯 国試ポイント',
         '① 急性湿疹＝<span class="kw3">紅斑→丘疹→小水疱→湿潤→痂皮→鱗屑</span>（湿疹三角）。本問の答えは<span class="kw3">丘疹と紅斑</span>。<br>'
         '② 慢性湿疹＝<span class="kw3">苔癬化・色素沈着・亀裂</span>。'
         '<span class="kw4">「硬化」は強皮症などの線維化で、湿疹の所見ではない</span>。<br>'
         '③ <span class="kw3">膨疹は蕁麻疹の皮疹</span>で湿疹には出ない（<span class="kw">Q.31</span>）。<br>'
         '④ 湿疹の性質＝<span class="kw3">瘙痒あり・非伝染性・表皮の炎症・多様性・境界不明瞭</span>（<span class="kw">Q.36</span>）。<br>'
         '⑤ <span class="kw3">境界明瞭なら白癬・乾癬を疑う</span>。白癬は必ず<span class="kw3">KOH直接鏡検</span>で確認してから治療する。<br>'
         '⑥ 原発巣＋全身の散布疹＝<span class="kw3">自家感作性皮膚炎</span>。')),

Q('103C-8', 79, [('bs', '★'), ('bh', '必修')],
  '<strong><span class="kw">表皮に変化がみられる</span>のはどれか。</strong>',
  [('a', '蕁麻疹', False, '<span class="kw4">病変は真皮上層の一過性浮腫のみで、表皮は正常</span>（<span class="kw">Q.33</span>）。'
                     'だからこそ鱗屑も痂皮もできず、24時間以内に跡形なく消える。'),
   ('b', '網状皮斑', False, '<span class="kw">livedo</span>。'
                     '<span class="kw4">真皮の血管の攣縮・閉塞・血流のうっ滞により生じる網目状の紫紅色斑</span>で、'
                     '病変の主座は<span class="kw4">血管</span>。表皮に変化はない。'
                     '寒冷・抗リン脂質抗体症候群・結節性多発動脈炎・コレステロール塞栓などが背景になる。'),
   ('c', '接触皮膚炎', True, '<span class="kw3">湿疹・皮膚炎群であり、病理の本体は表皮の海綿状態</span>。'
                     '表皮が障害されるため<span class="kw3">小水疱・漿液性丘疹・湿潤・痂皮・鱗屑</span>を生じ、'
                     '慢性化すれば<span class="kw3">苔癬化</span>する。'),
   ('d', '結節性紅斑', False, '<span class="kw4">皮下脂肪織の隔壁性脂肪織炎</span>で、'
                     '下腿伸側に<span class="kw4">圧痛のある紅色皮下結節</span>をつくる。'
                     '病変は皮下であり<span class="kw4">表皮は保たれる</span>ので、潰瘍化も鱗屑も通常みられない。'
                     '背景に<span class="kw">溶連菌感染・サルコイドーシス・Behçet病・炎症性腸疾患・薬剤</span>。'),
   ('e', '蜂巣炎〈蜂窩織炎〉', False, '<span class="kw4">真皮深層から皮下脂肪織にかけての細菌感染</span>。'
                     '境界不明瞭な<span class="kw4">発赤・腫脹・熱感・疼痛</span>を呈するが、'
                     '炎症の主座は深部であり表皮そのものは保たれる。'
                     '（表皮浅層に及ぶ<span class="kw">丹毒</span>は境界明瞭になる点で対比される。）')],
  '表皮に変化をきたすのは湿疹・皮膚炎群である接触皮膚炎（海綿状態→小水疱・鱗屑・苔癬化）。蕁麻疹は真皮上層の浮腫、網状皮斑は血管、結節性紅斑は皮下脂肪織、蜂窩織炎は真皮深層〜皮下が主座。',
  patho=('📐 「病変の主座はどの層か」で疾患を並べ替える',
         '本問は必修らしく、<span class="kw3">皮膚疾患を「深さ」で分類できているか</span>だけを問うている。'
         '皮膚は<span class="kw3">表皮 → 真皮（乳頭層・網状層）→ 皮下脂肪織</span>という層構造をもち、'
         '<span class="kw3">どの層が主座かで臨床所見が決まる</span>。<br>'
         '<span class="kw3">表皮が主座なら「表面が変わる」</span>。'
         '角層まで炎症が及ぶので<span class="kw3">鱗屑・痂皮・びらん・小水疱・苔癬化</span>といった'
         '<span class="kw3">手で触って分かる表面の変化</span>が出る。'
         '代表が<span class="kw3">湿疹・皮膚炎群（接触皮膚炎・アトピー性皮膚炎・脂漏性皮膚炎）</span>と'
         '<span class="kw">乾癬・白癬・天疱瘡</span>である。'
         '接触皮膚炎はこの群の典型で、表皮細胞間に浮腫が生じる'
         '<span class="kw3">海綿状態</span>が本体だから、水疱ができ、破れて湿り、乾いて鱗屑になる。<br>'
         '<span class="kw3">真皮が主座なら「色は変わるが表面は変わらない」</span>。'
         '<span class="kw3">蕁麻疹（真皮上層の浮腫）・網状皮斑（血管）・紫斑（真皮内出血）・'
         '肉芽腫性疾患</span>がここに入る。'
         '表面がつるつるのまま色や隆起だけが変わるのが特徴で、'
         '<span class="kw3">「鱗屑がない」ことが真皮病変のサイン</span>になる。'
         '<span class="kw">Q.5（尋常性白斑は鱗屑なし）</span>で使った論理と同じである。<br>'
         '<span class="kw3">皮下脂肪織が主座なら「深いところにしこりがある」</span>。'
         '<span class="kw3">結節性紅斑・硬結性紅斑・蜂窩織炎</span>がここで、'
         '<span class="kw3">境界不明瞭な皮下結節や腫脹として触れ、表面の皮膚は比較的正常</span>である。'
         '結節性紅斑が<span class="kw3">「下腿伸側の圧痛を伴う紅色皮下結節で、潰瘍化せず瘢痕を残さない」</span>のは、'
         '炎症が皮下にとどまり表皮を壊さないからにほかならない。<br>'
         'この3階層の枠組みは、初見の疾患でも'
         '<span class="kw3">「鱗屑があるか」「触ってしこりが深いか」</span>という'
         '2つの問いで振り分けられるため、実臨床の視診・触診の型としてもそのまま使える。'),
  deep=('📌 深さ別の疾患一覧',
        '<table class="tb"><tr><th>主座</th><th>臨床の手がかり</th><th>疾患</th></tr>'
        '<tr><td><span class="kw3">表皮</span></td>'
        '<td><span class="kw3">鱗屑・痂皮・水疱・びらん・苔癬化</span>（表面が変わる）</td>'
        '<td><span class="kw3">湿疹・皮膚炎群（接触皮膚炎・AD・脂漏性）</span>・乾癬・白癬・天疱瘡・SSSS</td></tr>'
        '<tr><td><span class="kw3">表皮真皮境界</span></td><td>紫紅色調・色素沈着を残す</td>'
        '<td>扁平苔癬・固定薬疹・多形滲出性紅斑・GVHD・LE</td></tr>'
        '<tr><td><span class="kw3">真皮</span></td>'
        '<td><span class="kw3">表面は正常（鱗屑なし）</span>・色や隆起のみ変化</td>'
        '<td><span class="kw3">蕁麻疹・網状皮斑・紫斑</span>・肉芽腫（サルコイドーシス）・水疱性類天疱瘡</td></tr>'
        '<tr><td><span class="kw3">皮下脂肪織</span></td>'
        '<td><span class="kw3">深いしこり・圧痛・境界不明瞭</span></td>'
        '<td><span class="kw3">結節性紅斑（隔壁性）・硬結性紅斑（小葉性）・蜂窩織炎</span></td></tr></table>'
        '<span class="kw3">紛らわしい2組</span>を押さえておく。<br>'
        '<span class="kw3">①丹毒 vs 蜂窩織炎</span>: '
        '<span class="kw3">丹毒は真皮浅層〜リンパ管の感染で、境界明瞭・鮮紅色・隆起し、A群溶連菌が主因</span>。'
        '<span class="kw3">蜂窩織炎は真皮深層〜皮下で、境界不明瞭、黄色ブドウ球菌や溶連菌</span>。'
        '<span class="kw3">深いほど境界が不明瞭になる</span>という原理で覚える。<br>'
        '<span class="kw3">②結節性紅斑 vs 硬結性紅斑</span>: '
        '<span class="kw3">結節性紅斑は下腿伸側・圧痛あり・隔壁性脂肪織炎・潰瘍化しない</span>。'
        '<span class="kw3">硬結性紅斑（Bazin硬結性紅斑）は下腿屈側・小葉性脂肪織炎・潰瘍化しやすく、結核アレルギーが背景</span>。'
        '<span class="kw3">「伸側で潰れない＝結節性、屈側で潰れる＝硬結性」</span>と対で覚える。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">表皮に変化をきたすのは湿疹・皮膚炎群</span>（接触皮膚炎）。本体は<span class="kw3">海綿状態</span>。<br>'
         '② <span class="kw3">鱗屑・痂皮・水疱があれば表皮病変</span>／<span class="kw3">なければ真皮以深</span>——視診の第一の分岐。<br>'
         '③ <span class="kw3">蕁麻疹＝真皮上層の浮腫で表皮は正常</span>（<span class="kw">Q.33</span>）。<br>'
         '④ <span class="kw3">結節性紅斑＝皮下脂肪織（隔壁性）</span>。下腿伸側・圧痛・潰瘍化しない。<br>'
         '⑤ <span class="kw3">丹毒は境界明瞭（浅い）／蜂窩織炎は境界不明瞭（深い）</span>。<br>'
         '⑥ 網状皮斑は<span class="kw3">血管</span>の病態。抗リン脂質抗体症候群・結節性多発動脈炎などを背景に探す。')),

Q('100E-29', 93, [('bs', '★'), ('bh', '必修')],
  '<strong><span class="kw">湿疹</span>について<span class="kw4">誤っている</span>のはどれか。</strong>',
  [('a', '瘙痒を伴う。', False, '<span class="kw3">正しい</span>。'
                     '<span class="kw">瘙痒は湿疹の必発症状</span>で、掻破がさらにバリアを壊して炎症を強める'
                     '（itch-scratch cycle）。痒みのない「湿疹」はまず診断を疑う。'),
   ('b', '非伝染性である。', False, '<span class="kw3">正しい</span>。'
                     '湿疹は<span class="kw">アレルギーや刺激に対する皮膚の反応</span>であって感染症ではないため、人にうつらない。'
                     '（うつるのは白癬・疥癬・伝染性膿痂疹・伝染性軟属腫などで、これらとの鑑別が要る。）'),
   ('c', '小水疱を形成する。', False, '<span class="kw3">正しい</span>。'
                     '<span class="kw">表皮の海綿状態が進むと表皮内に小水疱・漿液性丘疹</span>を形成し、'
                     '破れて湿潤し痂皮になる（<span class="kw">Q.34</span>）。'),
   ('d', '表皮の炎症である。', False, '<span class="kw3">正しい</span>。'
                     '<span class="kw">湿疹の病変の主座は表皮（海綿状態）</span>であり、これが真皮病変である蕁麻疹との決定的な違いである（<span class="kw">Q.33・Q.35</span>）。'),
   ('e', '数時間で消退する。', True, '<span class="kw3">誤り＝これが正解</span>。'
                     '<span class="kw3">数時間〜24時間以内に跡形なく消退するのは蕁麻疹の膨疹</span>である（<span class="kw">Q.31</span>）。'
                     '<span class="kw3">湿疹は表皮が障害されるため、紅斑→丘疹→小水疱→湿潤→痂皮→鱗屑と'
                     '日〜週の単位で経過し、慢性化すれば苔癬化する</span>。')],
  '湿疹は瘙痒を伴う非伝染性の表皮の炎症で、小水疱を形成し、日〜週の経過をとる。「数時間で消退する」のは蕁麻疹（膨疹）の性質であり誤り。',
  patho=('⚖️ 湿疹と蕁麻疹——必修で問われる最重要の対比',
         '本問は<span class="kw3">湿疹の定義を1つずつ確認し、'
         '最後に蕁麻疹の性質を紛れ込ませて見抜けるかを問う</span>典型的な必修問題である。'
         '<span class="kw3">この2つの疾患群の区別が皮膚科の入口</span>であり、'
         '本章の<span class="kw">Q.31・Q.33・Q.34・Q.35</span>はすべて同じ軸の上に並んでいる。<br>'
         '<span class="kw3">湿疹〈eczema／皮膚炎 dermatitis〉</span>は'
         '<span class="kw3">表皮を主座とする炎症</span>である。'
         '病理は<span class="kw3">海綿状態＝表皮細胞間の浮腫</span>で、'
         '表皮というバリアそのものが壊れるため、'
         '<span class="kw3">水疱ができ、破れて漿液が出て、乾いて痂皮になり、'
         '治る過程で鱗屑が出る</span>。'
         '掻破が続けば<span class="kw3">表皮が厚くなって苔癬化</span>し、色素沈着を残す。'
         'つまり<span class="kw3">湿疹は「跡が残る」「時間がかかる」</span>疾患である。'
         '性質をまとめると<span class="kw3">①瘙痒を伴う、②非伝染性、③表皮の炎症、'
         '④小水疱を形成する、⑤多様な皮疹が同時に混在する、⑥境界が不明瞭、'
         '⑦日〜週〜年の経過をとる</span>となる。<br>'
         '対する<span class="kw3">蕁麻疹</span>は'
         '<span class="kw3">真皮上層の一過性の浮腫</span>にすぎない。'
         '表皮はまったく無傷なので、'
         '<span class="kw3">浮腫が引けば24時間以内に完全に元通りになる</span>。'
         '<span class="kw3">水疱も鱗屑も痂皮も色素沈着も残らない</span>。'
         'だから肢eの「数時間で消退する」は蕁麻疹の記述であり、湿疹としては誤りになる。<br>'
         '<span class="kw3">臨床では「その皮疹は明日も同じ場所にありますか」と尋ねる</span>のが'
         'この鑑別の実践的な形である。'
         '<span class="kw3">同じ場所に残る＝湿疹をはじめとする持続性の皮疹、'
         '消えて別の場所に出る＝蕁麻疹</span>。'
         '患者が「昨日は腕、今日は脚」と語れば蕁麻疹であり（<span class="kw">Q.31</span>）、'
         '「同じところが何週間もカサカサして痒い」と語れば湿疹である。'
         'この一問一答が診断の8割を決める。'),
  deep=('📌 湿疹 vs 蕁麻疹 完全対比／「うつる」皮膚疾患',
        '<table class="tb"><tr><th>項目</th><th><span class="kw3">湿疹・皮膚炎群</span></th><th><span class="kw3">蕁麻疹</span></th></tr>'
        '<tr><td>病変の主座</td><td><span class="kw3">表皮</span>（海綿状態）</td><td><span class="kw3">真皮上層</span>（浮腫）</td></tr>'
        '<tr><td>持続</td><td><span class="kw3">日〜週〜年</span></td><td><span class="kw3">24時間以内に消退</span></td></tr>'
        '<tr><td>皮疹</td><td>紅斑・丘疹・小水疱・湿潤・痂皮・鱗屑・苔癬化</td><td><span class="kw3">膨疹のみ</span></td></tr>'
        '<tr><td>表面の変化</td><td><span class="kw3">あり（鱗屑・痂皮）</span></td><td><span class="kw3">なし（つるつる）</span></td></tr>'
        '<tr><td>あとに残るもの</td><td>色素沈着・苔癬化</td><td><span class="kw3">何も残らない</span></td></tr>'
        '<tr><td>移動性</td><td>なし（同じ場所）</td><td><span class="kw3">あり（次々に場所を変える）</span></td></tr>'
        '<tr><td>主な治療</td><td><span class="kw3">ステロイド外用</span>＋保湿</td><td><span class="kw3">抗ヒスタミン薬内服</span></td></tr></table>'
        '<span class="kw3">「非伝染性」の裏返し</span>として、'
        '<span class="kw4">湿疹に見えるがうつる疾患</span>を必ず除外する習慣をつける。'
        '<span class="kw3">白癬</span>（環状・辺縁隆起・<span class="kw3">KOH直接鏡検</span>）、'
        '<span class="kw3">疥癬</span>（<span class="kw3">夜間の激しい瘙痒・指間の疥癬トンネル・陰部の結節・施設内集団発生</span>）、'
        '<span class="kw3">伝染性膿痂疹</span>（黄色痂皮・飛び火・小児・夏）、'
        '<span class="kw">伝染性軟属腫</span>（中心臍窩のある小丘疹）。'
        '<span class="kw4">これらにステロイドを外用すると、一時的に赤みは引くが病原体が増えて悪化する</span>——'
        '白癬でこれが起こったものが<span class="kw3">異型白癬〈tinea incognito〉</span>である。'
        '<span class="kw3">「治療で悪化した湿疹」を見たら、'
        '①診断が違う（白癬・疥癬）、②外用薬による接触皮膚炎（<span class="kw">Q.39・Q.43</span>）、'
        '③Kaposi水痘様発疹症などの感染合併（<span class="kw">Q.29</span>）——この3つを考える。</span>'),
  point=('🎯 国試ポイント',
         '① 湿疹＝<span class="kw3">瘙痒あり・非伝染性・表皮の炎症・小水疱を形成・日〜週の経過</span>。<br>'
         '② <span class="kw4">「数時間で消退」は蕁麻疹（膨疹）の性質</span>——これが本問の誤り。<br>'
         '③ 鑑別の実践的な問いは<span class="kw3">「その皮疹は明日も同じ場所にありますか」</span>。<br>'
         '④ 湿疹は<span class="kw3">跡（色素沈着・苔癬化）を残す</span>／蕁麻疹は<span class="kw3">何も残さない</span>。<br>'
         '⑤ 治療は<span class="kw3">湿疹＝ステロイド外用＋保湿／蕁麻疹＝抗ヒスタミン薬内服</span>。<br>'
         '⑥ <span class="kw4">「うつる湿疹もどき」＝白癬・疥癬・伝染性膿痂疹</span>。'
         'ステロイドで悪化する（<span class="kw3">異型白癬</span>）。')),
]

# ============================================================
# A問題 NO.37 → Q.37
# ============================================================
QUESTIONS += [

Q('116A-59', 66, [('bi', '📷')],
  '8歳の女児。<span class="kw">著しい瘙痒を伴う皮疹</span>を主訴に来院した。背部の所見を示す。'
  '<span class="kw">同様の皮疹が背部以外にも顔面、腹部、肘窩、膝窩など全身に認められる</span>。'
  '白血球8,600（<span class="kw">好酸球12％</span>）。<span class="kw">IgE 2,800IU/mL（基準250以下）</span>。'
  '抗原特異的IgEは<span class="kw">ハウスダスト、スギ花粉等吸入性抗原に強陽性</span>を示すが、食物抗原は陰性であった。<br>'
  '<strong>注意すべき合併症はどれか。</strong>',
  [('a', '気　胸', False, '<span class="kw4">アトピー性皮膚炎の合併症ではない</span>。'
                     '若年男性の特発性自然気胸や、Marfan症候群・肺囊胞性疾患で問題になる病態で、'
                     '「アトピー」の語から気管支喘息を連想させて誤らせる肢である。'),
   ('b', '貧　血', False, '<span class="kw4">AD に特徴的な合併症ではない</span>。'
                     '重症の紅皮症で鉄・蛋白の喪失が問題になることはあるが、'
                     '本例のような小児のAD で「注意すべき合併症」として第一に挙げるものではない。'),
   ('c', '白内障', True, '<span class="kw3">アトピー白内障。AD の眼合併症のなかで最も頻度が高く、定期的なスクリーニングの対象</span>。'
                     '<span class="kw3">顔面・眼周囲の皮疹を掻いたり叩いたりする機械的刺激</span>に'
                     '慢性炎症の影響が加わって生じ、<span class="kw3">若年で前囊下・後囊下に混濁</span>をきたす。'
                     '本例は顔面にも皮疹があり、まさにリスクを負っている。'),
   ('d', '円錐角膜', False, '<span class="kw3">これもAD の眼合併症として実在する</span>（目をこする習慣と関連し、角膜が円錐状に突出して不正乱視をきたす）。'
                     'ただし<span class="kw4">白内障に比べて頻度が明らかに低く、「まず注意すべき合併症」としては白内障が優先される</span>。'
                     '本問で最も紛らわしい肢であり、<span class="kw4">「誤りだから」ではなく「頻度で劣るから」選ばない</span>と理解しておくこと。'),
   ('e', 'アナフィラキシー', False, '<span class="kw4">本例では食物抗原特異的IgEが陰性</span>と明記されている。'
                     '感作されているのは<span class="kw4">ハウスダスト・スギ花粉といった吸入性抗原</span>であり、'
                     'これらで全身性のアナフィラキシーを起こすことは通常ない。'
                     '<span class="kw3">「食物抗原は陰性」の一文がこの肢を落とすために置かれている</span>。')],
  '小児のアトピー性皮膚炎（顔面を含む全身の瘙痒性皮疹・好酸球12%・IgE 2,800・吸入抗原に感作）。注意すべき合併症はアトピー白内障。食物抗原陰性なのでアナフィラキシーは該当しない。',
  imgs=['images/116A-59_1.jpeg'],
  patho=('👁️ アトピー白内障——顔面に皮疹のある患者は眼科へ',
         '本例は<span class="kw3">瘙痒・特徴的な分布（顔面・肘窩・膝窩）・慢性経過</span>という'
         'アトピー性皮膚炎の3要件を満たし、'
         '<span class="kw3">好酸球12%・IgE 2,800IU/mL</span>という支持所見も揃っている。'
         '写真の背部も<span class="kw3">乾燥・鱗屑・搔破痕・散在する紅斑</span>というAD の像である。'
         '診断は容易で、本問が問うているのは<span class="kw3">「その先に何を心配するか」</span>である。<br>'
         'AD の合併症は<span class="kw3">①眼、②感染、③その他</span>に整理できる。'
         'このうち<span class="kw3">眼合併症は不可逆的な視力障害につながるため最重要</span>で、'
         '<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>の3つが柱になる'
         '（<span class="kw">Q.32・Q.40・Q.50</span>）。'
         'いずれも<span class="kw3">顔面・眼周囲の皮疹を掻く・叩くという機械的刺激</span>が共通の背景にあり、'
         '<span class="kw3">顔面に皮疹のあるAD患者では眼合併症のリスクが高い</span>と考える。<br>'
         '<span class="kw3">アトピー白内障</span>はこの中で<span class="kw3">最も頻度が高い</span>。'
         '<span class="kw3">10〜20歳代という若年で発症し、前囊下または後囊下の混濁</span>として始まり、'
         '<span class="kw3">しばしば両眼性で、時に急速に進行</span>する。'
         '初期は無症状のことも多く、<span class="kw3">自覚症状が出たときには既に進んでいる</span>ため、'
         '<span class="kw3">症状の有無にかかわらず定期的な眼科受診によるスクリーニングが必要</span>になる。'
         'これが「注意すべき合併症」として白内障が選ばれる理由である。<br>'
         '<span class="kw4">ここで正直に押さえておくべきなのが肢dの円錐角膜</span>で、'
         '<span class="kw4">これもAD の眼合併症として確立している</span>。'
         '本問で選ばないのは「誤りだから」ではなく、'
         '<span class="kw3">白内障の方が頻度が高く、スクリーニングの主対象だから</span>である。'
         '国試では<span class="kw3">「AD の眼合併症を2つ選べ」なら白内障と網膜剝離（または円錐角膜）が正解になりうる</span>ので、'
         '<span class="kw3">3つとも合併症として知っておき、「最も」と問われたら白内障</span>という整理が安全である。'
         '正答率66%はこの紛らわしさを反映している。'),
  deep=('📌 アトピー性皮膚炎の合併症を3群で覚える',
        '<table class="tb"><tr><th>群</th><th>合併症</th><th>要点</th></tr>'
        '<tr><td rowspan="4"><span class="kw3">眼</span></td><td><span class="kw3">アトピー白内障</span></td>'
        '<td><span class="kw3">最多・定期スクリーニングの対象</span>。若年・前囊下/後囊下混濁</td></tr>'
        '<tr><td><span class="kw3">裂孔原性網膜剝離</span></td>'
        '<td>叩打による網膜裂孔。飛蚊症・光視症→視野欠損。<span class="kw4">眼科救急</span>（<span class="kw">Q.32・Q.40</span>）</td></tr>'
        '<tr><td><span class="kw">円錐角膜</span></td><td>こする習慣→角膜の円錐状突出・不正乱視</td></tr>'
        '<tr><td>アトピー性角結膜炎・春季カタル</td><td>巨大乳頭・シールド潰瘍</td></tr>'
        '<tr><td rowspan="4"><span class="kw3">感染</span></td>'
        '<td><span class="kw3">Kaposi水痘様発疹症</span></td>'
        '<td><span class="kw3">HSV</span>。高熱＋集簇性小水疱（<span class="kw">Q.29・Q.41・Q.42</span>）</td></tr>'
        '<tr><td>伝染性膿痂疹・毛包炎・蜂窩織炎</td><td><span class="kw">黄色ブドウ球菌の定着が多い</span></td></tr>'
        '<tr><td>伝染性軟属腫</td><td>バリア破綻で広がりやすい</td></tr>'
        '<tr><td>白癬・カンジダ</td><td>ステロイド外用下で<span class="kw">異型白癬</span>になりうる</td></tr>'
        '<tr><td rowspan="3">その他</td><td>アレルギーマーチ</td>'
        '<td><span class="kw3">AD →食物アレルギー→喘息→アレルギー性鼻炎</span>と進む</td></tr>'
        '<tr><td>睡眠障害・成長障害・QOL低下</td><td>瘙痒による不眠。小児では成長にも影響しうる</td></tr>'
        '<tr><td>Hertoghe徴候</td><td><span class="kw">眉毛外側1/3の脱落</span>（慢性の擦過による）</td></tr></table>'
        '<span class="kw3">アレルギーマーチ</span>の概念も本例に関係する。'
        '<span class="kw3">乳児期のAD（＝皮膚バリア破綻による経皮感作）を起点に、'
        '食物アレルギー・気管支喘息・アレルギー性鼻炎へと年齢とともに進展していく</span>という考え方で、'
        '本例が<span class="kw3">ハウスダスト・スギ花粉に強く感作されている</span>のはその途上にあることを示す。'
        '<span class="kw3">乳児期からの適切なスキンケアと湿疹治療が、'
        '経皮感作を減らして後の食物アレルギー発症を抑えうる</span>という点が、'
        '近年の予防的アプローチとして重要である。'),
  point=('🎯 国試ポイント',
         '① AD で<span class="kw3">まず注意すべき合併症は白内障</span>（最多・スクリーニング対象）。<br>'
         '② 眼合併症は<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>の3つ。'
         '<span class="kw4">円錐角膜も実在するが頻度で白内障に劣る</span>——本問最大の紛らわしさ。<br>'
         '③ 共通機序は<span class="kw3">眼周囲の掻破・叩打</span>。'
         '<span class="kw3">顔面に皮疹のあるAD患者は定期的に眼科へ</span>。<br>'
         '④ <span class="kw3">食物抗原特異的IgEが陰性ならアナフィラキシーは考えない</span>——設問文の一文が肢を落とす。<br>'
         '⑤ 感染合併＝<span class="kw3">Kaposi水痘様発疹症・伝染性膿痂疹・伝染性軟属腫</span>（<span class="kw">Q.29・Q.41</span>）。<br>'
         '⑥ <span class="kw3">アレルギーマーチ</span>＝AD →食物アレルギー→喘息→鼻炎。乳児期のスキンケアが予防になりうる。')),
]

# ============================================================
# B問題 NO.38-54 → Q.38-54
# ============================================================
QUESTIONS += [

Q('112A-2', 32, [],
  '<strong><span class="kw">続発性無汗症</span>の原因と<span class="kw4">ならない</span>のはどれか。</strong>',
  [('a', '糖尿病', False, '<span class="kw3">原因となる</span>。'
                     '<span class="kw3">糖尿病性自律神経障害</span>により汗腺を支配する交感神経（コリン作動性）が障害され、'
                     '<span class="kw3">下肢から始まる分節性の発汗低下</span>を生じる。'
                     '代償性に上半身の発汗が増えることもある。'),
   ('b', 'Fabry 病', False, '<span class="kw3">原因となる</span>。'
                     '<span class="kw3">X連鎖性のα-ガラクトシダーゼA欠損によりグロボトリアオシルセラミドが蓄積</span>する疾患で、'
                     '<span class="kw3">自律神経節・汗腺に沈着して低汗症・無汗症</span>をきたす。'
                     '<span class="kw">被角血管腫・四肢末端の灼熱痛（肢端疼痛症）・角膜混濁・蛋白尿から腎不全・心肥大</span>を伴う。'),
   ('c', 'Sjögren 症候群', False, '<span class="kw3">原因となる</span>。'
                     '<span class="kw3">外分泌腺に対する自己免疫性の破壊</span>が本態で、'
                     '涙腺・唾液腺だけでなく<span class="kw3">汗腺も障害されて皮膚乾燥・低汗症</span>を生じる。'),
   ('d', '甲状腺機能低下症', False, '<span class="kw3">原因となる</span>。'
                     '<span class="kw3">全身の代謝低下と皮膚のムコ多糖沈着</span>により'
                     '<span class="kw3">発汗低下・皮膚乾燥・粗糙</span>をきたす。'
                     '寒がり・徐脈・便秘・脱毛（眉毛外側の脱落）を伴う。'),
   ('e', '自家感作性皮膚炎', True, '<span class="kw3">原因とならない＝これが正解</span>。'
                     '<span class="kw3">原発巣（うっ滞性皮膚炎・接触皮膚炎・白癬など）の炎症が強まったのち、'
                     '数日〜2週で全身に小型の紅色丘疹が散布状に多発する湿疹反応</span>であり、'
                     '<span class="kw3">汗腺そのものや発汗の神経支配を壊す病態ではない</span>。')],
  '続発性無汗症は汗腺の破壊（Sjögren症候群）・自律神経障害（糖尿病・Fabry病）・代謝性（甲状腺機能低下症）で生じる。自家感作性皮膚炎は散布性の湿疹反応で、発汗の障害はきたさない。',
  patho=('💧 無汗症・低汗症——「汗が出ない」原因を経路で分ける',
         '発汗は<span class="kw3">視床下部の体温調節中枢 → 交感神経（節後線維はアセチルコリン） → '
         'エクリン汗腺</span>という経路で成立している（<span class="kw">Q.11</span>）。'
         'したがって<span class="kw3">無汗症・低汗症はこの経路のどこが壊れても起こる</span>と考えれば、'
         '原因疾患を丸暗記せずに導ける。<br>'
         '<span class="kw3">①中枢の障害</span>——脳腫瘍・脳血管障害・多系統萎縮症など。'
         '<span class="kw3">②末梢神経・自律神経の障害</span>——'
         '<span class="kw3">糖尿病性自律神経障害</span>が最も多く、'
         '<span class="kw3">Fabry病</span>（自律神経節への糖脂質沈着）、'
         '<span class="kw">アミロイドーシス・Ross症候群・Horner症候群・脊髄損傷</span>など。'
         '<span class="kw3">③汗腺そのものの障害</span>——'
         '<span class="kw3">Sjögren症候群</span>（外分泌腺の自己免疫性破壊）、'
         '<span class="kw3">外胚葉異形成症</span>（先天的にエクリン汗腺が形成されない）、'
         '<span class="kw">熱傷後・強皮症・放射線皮膚炎などの瘢痕</span>、'
         '<span class="kw">特発性後天性全身性無汗症〈AIGA〉</span>。'
         '<span class="kw3">④代謝・内分泌</span>——<span class="kw3">甲状腺機能低下症</span>、'
         '脱水、<span class="kw">薬剤性（抗コリン薬・三環系抗うつ薬・抗ヒスタミン薬）</span>。<br>'
         '肢eの<span class="kw3">自家感作性皮膚炎</span>だけが、この4系統のどこにも入らない。'
         'これは<span class="kw3">原発巣の炎症が引き金となって、離れた部位に湿疹反応が散布状に生じる現象</span>で、'
         '<span class="kw3">病変は表皮の海綿状態＝湿疹</span>であり、汗腺も神経も壊さない。'
         '<span class="kw3">「原発巣を治せば散布疹も引く」</span>のが治療の要点で、'
         '発汗機能とは無関係である。<br>'
         '<span class="kw4">臨床的に最も怖いのはうつ熱</span>である。'
         '汗をかけないと気化熱による体温調節ができないため、'
         '<span class="kw4">運動時や高温環境で容易に体温が上がり、熱中症・熱射病に至る</span>。'
         '患者には<span class="kw3">高温環境を避ける・こまめに水分をとる・'
         '衣服や送風・冷却で外から体温を下げる</span>という具体的な指導が必要になる。'
         '正答率32%と低いのは、<span class="kw4">無汗症という切り口で疾患を整理したことがないまま、'
         '個々の疾患名の印象で選んでしまう</span>ためで、'
         '<span class="kw3">「経路のどこが壊れるか」で並べ直せば確実に取れる</span>。'),
  deep=('📌 無汗症の原因一覧と、Fabry病・多汗症',
        '<table class="tb"><tr><th>障害部位</th><th>疾患</th><th>手がかり</th></tr>'
        '<tr><td>中枢</td><td>脳腫瘍・脳血管障害・多系統萎縮症</td><td>他の中枢症状を伴う</td></tr>'
        '<tr><td><span class="kw3">自律神経</span></td><td><span class="kw3">糖尿病</span></td>'
        '<td>下肢から分節性に。他の自律神経症状（起立性低血圧・胃不全麻痺）</td></tr>'
        '<tr><td><span class="kw3">自律神経</span></td><td><span class="kw3">Fabry病</span></td>'
        '<td><span class="kw3">被角血管腫・肢端疼痛症・角膜混濁・蛋白尿・心肥大</span></td></tr>'
        '<tr><td><span class="kw3">汗腺</span></td><td><span class="kw3">Sjögren症候群</span></td>'
        '<td><span class="kw3">乾燥性角結膜炎・口腔乾燥・抗SS-A/SS-B抗体</span></td></tr>'
        '<tr><td><span class="kw3">汗腺</span></td><td>外胚葉異形成症</td>'
        '<td><span class="kw">先天性・乏毛・歯牙欠損・うつ熱</span></td></tr>'
        '<tr><td>汗腺</td><td>特発性後天性全身性無汗症〈AIGA〉</td>'
        '<td>若年男性・<span class="kw">コリン性蕁麻疹様の刺痛</span>・ステロイドパルスが有効なことも</td></tr>'
        '<tr><td><span class="kw3">代謝</span></td><td><span class="kw3">甲状腺機能低下症</span></td>'
        '<td>寒がり・徐脈・便秘・皮膚乾燥・眉毛外側の脱落</td></tr>'
        '<tr><td>薬剤</td><td>抗コリン薬・三環系抗うつ薬・抗ヒスタミン薬</td>'
        '<td>口渇・散瞳・尿閉を伴う（<span class="kw">Q.17</span>の抗コリン中毒と同じ像）</td></tr></table>'
        '<span class="kw3">Fabry病</span>は皮膚科でも狙われる。'
        '<span class="kw3">X連鎖性（男性で重症、女性ヘテロ接合体でも発症しうる）</span>の'
        '<span class="kw3">α-ガラクトシダーゼA欠損</span>により'
        'グロボトリアオシルセラミドが血管内皮・自律神経・腎・心に蓄積する。'
        '皮膚症状の<span class="kw3">被角血管腫〈angiokeratoma〉</span>は'
        '<span class="kw3">臍〜大腿・陰部（水着で隠れる範囲）に集簇する暗赤色の小丘疹</span>で、'
        '<span class="kw3">思春期の男児が「手足が焼けるように痛い（肢端疼痛症）＋汗をかかない＋被角血管腫」</span>と'
        '揃えば本症を疑う。治療は<span class="kw3">酵素補充療法</span>。<br>'
        '逆の<span class="kw3">多汗症</span>も対で押さえる。'
        '<span class="kw3">原発性局所多汗症（掌蹠・腋窩・頭部）</span>は'
        '<span class="kw">塩化アルミニウム外用・抗コリン外用薬・イオントフォレーシス・'
        'A型ボツリヌス毒素局注・胸腔鏡下交感神経遮断術</span>で治療し、'
        '<span class="kw4">手術では代償性発汗</span>が問題になる。'
        '<span class="kw4">続発性（全身性）の多汗を見たら、甲状腺機能亢進症・褐色細胞腫・'
        '低血糖・悪性腫瘍・感染症・更年期を検索する</span>。'),
  point=('🎯 国試ポイント',
         '① 無汗症は<span class="kw3">中枢／自律神経／汗腺／代謝・薬剤</span>の4系統で整理する。<br>'
         '② <span class="kw3">糖尿病・Fabry病＝自律神経／Sjögren症候群＝汗腺／甲状腺機能低下症＝代謝</span>。<br>'
         '③ <span class="kw3">自家感作性皮膚炎は湿疹反応</span>で、発汗機能とは無関係——これが正解。<br>'
         '④ <span class="kw4">無汗症で最も危険なのはうつ熱・熱中症</span>。高温環境の回避と外部冷却を指導する。<br>'
         '⑤ <span class="kw3">Fabry病＝被角血管腫＋肢端疼痛症＋低汗症＋角膜混濁＋腎障害</span>。治療は酵素補充療法。<br>'
         '⑥ 正答率32%——<span class="kw3">疾患名でなく「経路のどこが壊れるか」で解く</span>。')),

Q('110C-24', 96, [('bh', '必修'), ('bi', '📷')],
  '52歳の女性。<span class="kw">頭皮と両耳介の皮疹</span>とを主訴に来院した。'
  '<span class="kw">数日前に染毛剤を使用した</span>。同時期にシャンプーも変更したという。'
  '<span class="kw">頭皮と両耳介とに痒みを伴う皮疹</span>を認める。耳介部の写真を示す。<br>'
  '<strong>この皮疹の<span class="kw">原因検索</span>に有用な検査はどれか。</strong>',
  [('a', '針反応', False, '<span class="kw4">Behçet病の検査</span>。'
                     '無菌の注射針を前腕に刺し、<span class="kw4">24〜48時間後に発赤・小膿疱が生じれば陽性</span>。'
                     '接触皮膚炎の原因物質を同定する検査ではない。'),
   ('b', '皮内テスト', False, '<span class="kw4">抗原液を皮内に注射して15〜20分後の膨疹で判定する即時型（Ⅰ型）の検査</span>。'
                     '本例は<span class="kw4">遅延型（Ⅳ型）の接触皮膚炎</span>であり型が合わない。'
                     'また皮内注射は全身反応の危険もあり、接触皮膚炎の原因検索には用いない。'),
   ('c', 'パッチテスト', True, '<span class="kw3">被疑物質を背部に48時間貼付し、遅延型（Ⅳ型）反応の有無を見る検査</span>。'
                     '<span class="kw3">染毛剤（パラフェニレンジアミン）とシャンプーという2つの被疑物質を'
                     '並べて貼れば、どちらが原因かを分離して同定できる</span>——本例にまさに必要な検査である。'),
   ('d', 'プリックテスト', False, '<span class="kw4">抗原液を皮膚に置いて浅く刺し、15〜20分後の膨疹で判定するⅠ型の検査</span>。'
                     '食物アレルギー・アレルギー性鼻炎などに用いる（<span class="kw">Q.44</span>）。'),
   ('e', 'スクラッチテスト', False, '<span class="kw4">皮膚を浅く引っかいて抗原を滴下するⅠ型の検査</span>。'
                     'プリックテストと同様に即時型を見るもので、遅延型の接触皮膚炎には適さない。')],
  '染毛剤（パラフェニレンジアミン）使用後に頭皮・両耳介へ生じた瘙痒性の湿疹＝アレルギー性接触皮膚炎（Ⅳ型）。原因検索はパッチテスト。',
  imgs=['images/110C-24_1.jpeg'],
  patho=('💇 染毛剤による接触皮膚炎——「使った場所とその流れた先」に出る',
         '<span class="kw3">アレルギー性接触皮膚炎</span>は'
         '<span class="kw3">ハプテンが皮膚タンパクと結合して完全抗原となり、'
         'Langerhans細胞の抗原提示を介して感作されたT細胞が起こすⅣ型（遅延型）反応</span>である'
         '（<span class="kw">Q.24・Q.30</span>）。'
         '<span class="kw3">初回曝露では発症せず、感作に1〜2週間を要し、'
         '再曝露後24〜48時間で湿疹が出る</span>という時間経過が診断の鍵になる。'
         '本例が「数日前に染毛剤を使用」で発症しているのは、'
         '<span class="kw3">以前から繰り返し使用して既に感作が成立していた</span>ことを意味する。<br>'
         '<span class="kw3">染毛剤の代表的なアレルゲンはパラフェニレンジアミン〈PPD〉</span>で、'
         '<span class="kw3">酸化型（永久染毛剤）</span>に含まれる。'
         '<span class="kw4">「何年も同じ製品を問題なく使っていた人が突然発症する」</span>のが典型で、'
         'これは感作の成立がある日を境に閾値を超えるためである。'
         '重症例では顔面の高度な浮腫（眼が開かないほど）をきたし、時に入院を要する。'
         '<span class="kw3">PPDはヘナタトゥー・黒色ゴム製品・一部の日焼け止め（PABA）と交叉反応</span>することがある。<br>'
         '<span class="kw3">分布が診断を語る</span>のが接触皮膚炎の最大の特徴である。'
         '<span class="kw3">皮疹は接触した部位に一致して、境界明瞭に出る</span>。'
         '染毛剤の場合は<span class="kw3">頭皮そのものよりも、液が流れて溜まる'
         '生え際・耳介・耳後部・頸部・顔面に強く出る</span>ことが多く、'
         '写真の耳介の紅斑・浮腫・漿液性丘疹・痂皮はその典型である。'
         '<span class="kw3">「使った場所」だけでなく「流れた先」を診る</span>という視点が要る。<br>'
         '本例には<span class="kw3">染毛剤とシャンプーという2つの被疑物質</span>がある。'
         '問診だけでは切り分けられないため、'
         '<span class="kw3">パッチテストで両者（および染毛剤の成分・スタンダードアレルゲン）を'
         '並べて貼り、どれが陽性かを見る</span>のが正攻法になる。'
         '<span class="kw3">原因が同定できれば、その物質を避けることが根本治療</span>であり、'
         '<span class="kw4">原因を放置したままステロイドを塗り続けても再発を繰り返す</span>。'
         'これが「原因検索」を問う本問の眼目である。'),
  deep=('📌 接触皮膚炎——アレルギー性と刺激性／代表的アレルゲン',
        '<table class="tb"><tr><th>項目</th><th><span class="kw3">アレルギー性接触皮膚炎</span></th>'
        '<th><span class="kw3">刺激性接触皮膚炎</span></th></tr>'
        '<tr><td>機序</td><td><span class="kw3">Ⅳ型アレルギー（感作が必要）</span></td>'
        '<td><span class="kw3">化学的・物理的刺激（免疫を介さない）</span></td></tr>'
        '<tr><td>発症</td><td><span class="kw3">初回は無症状。感作後、再曝露で24〜48時間後</span></td>'
        '<td><span class="kw3">誰にでも、初回曝露でも起こる</span></td></tr>'
        '<tr><td>濃度</td><td>ごく微量でも起こる</td><td>濃度・接触時間に依存</td></tr>'
        '<tr><td>広がり</td><td><span class="kw3">接触部位を越えて広がることがある</span></td><td>接触部位に限局</td></tr>'
        '<tr><td>パッチテスト</td><td><span class="kw3">陽性（crescendo）</span></td>'
        '<td><span class="kw4">陰性または decrescendo</span></td></tr>'
        '<tr><td>頻度</td><td>—</td><td><span class="kw3">刺激性の方が多い（主婦手湿疹など）</span></td></tr></table>'
        '<table class="tb"><tr><th>アレルゲン</th><th>由来</th></tr>'
        '<tr><td><span class="kw3">パラフェニレンジアミン〈PPD〉</span></td><td><span class="kw3">染毛剤</span>・ヘナタトゥー（本問）</td></tr>'
        '<tr><td><span class="kw3">ニッケル・コバルト・クロム</span></td><td>装身具・歯科金属（<span class="kw">Q.30・Q.54</span>）</td></tr>'
        '<tr><td><span class="kw3">チウラム・ラテックス</span></td><td><span class="kw3">ゴム手袋・聴診器のチューブ</span>（<span class="kw">Q.43</span>）</td></tr>'
        '<tr><td>ウルシ・ギンナン・サクラソウ</td><td>植物</td></tr>'
        '<tr><td>香料・防腐剤（パラベン等）</td><td>化粧品・シャンプー</td></tr>'
        '<tr><td><span class="kw4">外用薬そのもの</span></td>'
        '<td><span class="kw4">ケトプロフェン（光接触皮膚炎）・抗菌薬・ステロイド基剤</span></td></tr></table>'
        '<span class="kw3">治療の順序</span>は明快である。'
        '<span class="kw3">①原因物質の除去と回避（これが根本治療）</span>、'
        '<span class="kw3">②ステロイド外用</span>（顔面は medium 以下、体幹四肢は strong 以上）、'
        '<span class="kw3">③瘙痒に抗ヒスタミン薬</span>、'
        '<span class="kw3">④重症・広範例には短期のステロイド内服</span>。'
        '<span class="kw3">原因が同定できたら、同じ成分を含む製品のリストを渡して回避を具体的に指導する</span>ことが'
        '再発防止の要になる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">接触皮膚炎の原因検索＝パッチテスト（Ⅳ型・48時間貼付）</span>（<span class="kw">Q.30・Q.43・Q.54</span>）。<br>'
         '② <span class="kw4">プリック・皮内・スクラッチテストはⅠ型</span>の検査で、型が違う。<br>'
         '③ <span class="kw3">染毛剤のアレルゲンはパラフェニレンジアミン〈PPD〉</span>。'
         '長年使っていて突然発症するのが典型。<br>'
         '④ <span class="kw3">皮疹は接触部位に一致し境界明瞭</span>。'
         '染毛剤では<span class="kw3">液が流れる生え際・耳介・頸部</span>に強く出る。<br>'
         '⑤ <span class="kw3">根本治療は原因の同定と回避</span>。ステロイドだけでは再発を繰り返す。<br>'
         '⑥ <span class="kw3">刺激性は感作不要で誰にでも初回から起こる</span>——アレルギー性との最大の違い。')),
]

QUESTIONS += [

Q('110D-4', 94, [],
  '<strong>アトピー性皮膚炎の<span class="kw">眼合併症</span>はどれか。</strong>',
  [('a', '角膜実質炎', False, '<span class="kw4">先天梅毒（Hutchinson三徴）・結核・単純ヘルペス</span>などでみられる角膜深層の炎症。AD の合併症ではない。'),
   ('b', '水晶体脱臼', False, '<span class="kw4">Marfan症候群（上方偏位）・ホモシスチン尿症（下方偏位）・外傷</span>が代表。'
                     'AD では水晶体の<span class="kw4">混濁（白内障）</span>は起こるが、支持組織が切れて脱臼することはない。'),
   ('c', '網脈絡膜萎縮', False, '<span class="kw4">強度近視・網膜色素変性・加齢黄斑変性・トキソプラズマ感染</span>などの所見。'),
   ('d', '閉塞隅角緑内障', False, '<span class="kw4">浅前房・遠視・高齢女性に多い</span>。'
                     'AD ではむしろ<span class="kw4">ステロイド外用/点眼に伴うステロイド緑内障（開放隅角型）</span>が問題になることはあるが、閉塞隅角型は関係しない。'),
   ('e', '裂孔原性網膜剝離', True, '<span class="kw3">顔面・眼周囲を掻く・叩くという反復する機械的外力で網膜裂孔が生じ、'
                     'そこから液化硝子体が入って剝離する</span>（<span class="kw">Q.32</span>）。'
                     '<span class="kw3">10〜20歳代の若年発症・両眼性のこともあり、眼科救急</span>である。')],
  'アトピー性皮膚炎の眼合併症は白内障・裂孔原性網膜剝離・円錐角膜。選択肢中では裂孔原性網膜剝離が該当する。',
  patho=('👁️ AD の眼合併症は「叩く・こする」から導ける',
         '<span class="kw">Q.32・Q.37</span>と同じ主題を、今度は「どれが合併症か」という形で問う問題である。'
         'AD の眼合併症は<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>の3つで、'
         'いずれも<span class="kw3">眼周囲の強い瘙痒→掻破・叩打という反復する機械的外力</span>という'
         '共通の原因から生じる。<span class="kw3">この一本の筋を持っていれば、'
         '個々の眼疾患の知識が曖昧でも消去法が効く</span>。<br>'
         '本問の誤答肢はすべて<span class="kw3">「外力とは無関係な機序」で起こる眼疾患</span>である。'
         '<span class="kw3">角膜実質炎</span>は感染・免疫による角膜深層の炎症（先天梅毒のHutchinson三徴が有名）。'
         '<span class="kw3">水晶体脱臼</span>はチン小帯という支持組織が弱い先天性疾患'
         '（<span class="kw">Marfan症候群では上方、ホモシスチン尿症では下方</span>）か外傷。'
         '<span class="kw3">網脈絡膜萎縮</span>は強度近視や変性疾患。'
         '<span class="kw3">閉塞隅角緑内障</span>は前房が浅い解剖学的素因をもつ人（遠視・高齢女性）に起こる。'
         'どれもAD の掻破とは結びつかない。<br>'
         '一方<span class="kw3">裂孔原性網膜剝離</span>は'
         '<span class="kw3">「網膜に穴が開く」ことが定義</span>であり、'
         '<span class="kw3">外力によって穴が開く</span>という点でAD の病態と一直線につながる。'
         'AD 患者では<span class="kw3">10〜20歳代という若年で、しばしば両眼性</span>に発症し、'
         '<span class="kw3">飛蚊症・光視症で始まり、視野欠損が拡大し、黄斑に及べば視力が落ちる</span>。'
         '<span class="kw4">黄斑剝離に至る前の手術が視力予後を決める</span>ため、'
         '<span class="kw3">これらの症状を患者にあらかじめ教え、出たら直ちに眼科を受診させる</span>ことが実務上きわめて重要である。<br>'
         'なお<span class="kw4">ステロイド点眼・眼周囲への長期外用では'
         '「ステロイド緑内障（開放隅角型）」と「ステロイド白内障（後囊下混濁）」</span>という'
         '医原性の合併症もありうる。'
         'AD の眼合併症を考えるときは<span class="kw3">「掻破による外力」と「ステロイドの影響」の2系統</span>を'
         '併せて意識すると臨床的にも過不足がない。'),
  deep=('📌 眼疾患と背景疾患の対応表',
        '<table class="tb"><tr><th>眼疾患</th><th>典型的な背景</th></tr>'
        '<tr><td><span class="kw3">裂孔原性網膜剝離</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎（叩打）</span>・強度近視・加齢（後部硝子体剝離）・外傷</td></tr>'
        '<tr><td><span class="kw3">白内障</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎</span>・加齢・糖尿病・<span class="kw">ステロイド</span>・'
        '筋強直性ジストロフィー・先天性風疹症候群・Down症候群</td></tr>'
        '<tr><td><span class="kw3">円錐角膜</span></td><td><span class="kw3">アトピー性皮膚炎（こする）</span>・Down症候群・Marfan症候群</td></tr>'
        '<tr><td>角膜実質炎</td><td><span class="kw">先天梅毒（Hutchinson三徴）</span>・結核・単純ヘルペス</td></tr>'
        '<tr><td>水晶体脱臼</td><td><span class="kw">Marfan症候群（上方）・ホモシスチン尿症（下方）</span>・外傷</td></tr>'
        '<tr><td>閉塞隅角緑内障</td><td>浅前房・遠視・高齢女性・散瞳薬</td></tr>'
        '<tr><td>ぶどう膜炎</td><td><span class="kw">Behçet病・サルコイドーシス・Vogt-小柳-原田病</span>・強直性脊椎炎</td></tr>'
        '<tr><td>角膜混濁</td><td><span class="kw">Fabry病</span>（渦状角膜混濁）・ムコ多糖症</td></tr></table>'
        '皮膚科領域から眼所見が問われる組合せは他にもある。'
        '<span class="kw3">Behçet病</span>＝再発性アフタ性口内炎・外陰部潰瘍・結節性紅斑様皮疹・'
        '<span class="kw">ぶどう膜炎（前房蓄膿）</span>・<span class="kw">針反応陽性</span>。'
        '<span class="kw3">サルコイドーシス</span>＝結節性紅斑・皮膚サルコイド・<span class="kw">ぶどう膜炎</span>・両側肺門リンパ節腫脹。'
        '<span class="kw3">Vogt-小柳-原田病</span>＝両眼のぶどう膜炎に加え'
        '<span class="kw">白髪・脱毛・白斑（メラノサイトへの自己免疫）</span>・髄膜刺激症状・難聴。'
        '<span class="kw3">Fabry病</span>＝被角血管腫・低汗症・<span class="kw">渦状角膜混濁</span>（<span class="kw">Q.38</span>）。'
        '<span class="kw3">「皮膚＋眼」の組合せ問題はこの5つを押さえれば大半に対応できる</span>。'),
  point=('🎯 国試ポイント',
         '① AD の眼合併症＝<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>。共通原因は<span class="kw3">掻破・叩打</span>。<br>'
         '② <span class="kw3">網膜剝離は裂孔原性</span>（<span class="kw">Q.32</span>）。'
         '飛蚊症・光視症・視野欠損を教えておき、出たら即眼科。<br>'
         '③ <span class="kw3">白内障が最多</span>で定期スクリーニングの対象（<span class="kw">Q.37</span>）。<br>'
         '④ <span class="kw4">水晶体脱臼＝Marfan・ホモシスチン尿症／角膜実質炎＝先天梅毒</span>——AD とは無関係。<br>'
         '⑤ <span class="kw4">ステロイドによる緑内障（開放隅角）・白内障（後囊下）</span>という医原性の系統も別にある。<br>'
         '⑥ 皮膚＋眼＝<span class="kw3">Behçet病・サルコイドーシス・原田病・Fabry病・AD</span>で整理する。')),

Q('108A-2', 97, [],
  '<strong><span class="kw">Kaposi 水痘様発疹症</span>を合併しやすいのはどれか。</strong>',
  [('a', 'Sweet 病', False, '<span class="kw4">発熱・有痛性の浮腫性紅斑・末梢血好中球増多</span>を三徴とする急性熱性好中球性皮膚症。'
                     '<span class="kw">骨髄異形成症候群などの血液疾患</span>を背景にもつことがあるが、バリア破綻は伴わずHSVの播種とは無縁。'),
   ('b', '結節性紅斑', False, '<span class="kw4">下腿伸側の圧痛を伴う紅色皮下結節（隔壁性脂肪織炎）</span>。'
                     '病変は皮下で表皮は保たれるため、ウイルスの侵入門戸にならない。'),
   ('c', '多形滲出性紅斑', False, '<span class="kw4">標的状の紅斑（target lesion）</span>が四肢末梢に出る。'
                     '<span class="kw3">むしろ単純ヘルペス感染が「原因」となって起こる反応性の紅斑</span>であり、'
                     'HSVが播種する「土壌」ではない——両者の関係が逆である点に注意。'),
   ('d', 'アトピー性皮膚炎', True, '<span class="kw3">Kaposi水痘様発疹症の背景疾患として圧倒的に多い</span>。'
                     '<span class="kw3">①角層バリアの破綻でHSVが侵入しやすく、②Th2優位の環境で抗ウイルス自然免疫'
                     '（抗菌ペプチド・Ⅰ型IFN応答）が低下しており、③掻破で自家接種される</span>——'
                     '三拍子そろって播種を許してしまう。'),
   ('e', 'Stevens-Johnson 症候群', False, '<span class="kw4">薬剤等を契機に生じる重症型の粘膜皮膚反応</span>で、'
                     '発熱・粘膜疹・表皮壊死を伴う急性疾患。'
                     '慢性の湿疹病変という「土壌」ではなく、Kaposi水痘様発疹症の背景にはならない。')],
  'Kaposi水痘様発疹症はアトピー性皮膚炎に合併しやすい。バリア破綻・Th2優位による抗ウイルス自然免疫の低下・掻破による自家接種が背景。',
  patho=('🧱 なぜアトピー性皮膚炎にHSVが広がるのか',
         '<span class="kw3">Kaposi水痘様発疹症〈eczema herpeticum〉</span>は'
         '<span class="kw3">既存の湿疹病変の上に単純ヘルペスウイルスが広範に播種した状態</span>であり'
         '（<span class="kw">Q.29・Q.42・Q.48</span>）、'
         '<span class="kw3">その圧倒的多数がアトピー性皮膚炎を背景にもつ</span>。'
         '「湿疹があればどれでも起こる」わけではなく、'
         '<span class="kw3">AD には他の湿疹にはない3つの条件が揃っている</span>点が本問の核心である。<br>'
         '<span class="kw3">①バリアの破綻</span>——'
         '<span class="kw3">フィラグリン変異とセラミド減少</span>で角層が弱く、ウイルスが物理的に入りやすい。'
         '<span class="kw3">②抗ウイルス自然免疫の低下</span>——'
         'これが最も重要で、<span class="kw3">Th2サイトカイン（IL-4・IL-13）が'
         '抗菌ペプチド（LL-37・β-ディフェンシン）の産生とⅠ型インターフェロン応答を抑制する</span>。'
         'つまり<span class="kw3">AD の皮膚は「入りやすい」だけでなく「入られたら止められない」</span>。'
         '<span class="kw3">③掻破による自家接種</span>——'
         '痒みで掻くことで、ウイルスが健常部や別の湿疹病変へ次々と運ばれる。'
         'この3つが重なるため、通常なら口唇の一角にとどまるHSVが'
         '顔面全体〜体幹へ一気に広がってしまう。<br>'
         '<span class="kw3">同じ理由でAD 患者は他の皮膚感染症にも弱い</span>。'
         '<span class="kw3">黄色ブドウ球菌の定着率が高く（伝染性膿痂疹・毛包炎・蜂窩織炎）、'
         '伝染性軟属腫も広がりやすい</span>。'
         '<span class="kw3">「AD の皮膚は感染に弱い」</span>という一般則として覚えておくとよい。<br>'
         '<span class="kw4">肢cの多形滲出性紅斑は関係が逆</span>である点を強調しておきたい。'
         '<span class="kw3">再発性の単純ヘルペス感染が引き金となって、'
         '免疫反応として標的状紅斑が出る</span>のが多形滲出性紅斑（とくに再発型）であり、'
         '<span class="kw3">HSVが「原因」であって「土壌」ではない</span>。'
         '<span class="kw3">HSVとの関係が「播種先」なのか「誘因」なのかを区別する</span>と、'
         'この2疾患を取り違えずに済む。'),
  deep=('📌 アトピー性皮膚炎に合併しやすい感染症',
        '<table class="tb"><tr><th>感染症</th><th>病原体</th><th>臨床</th></tr>'
        '<tr><td><span class="kw3">Kaposi水痘様発疹症</span></td><td><span class="kw3">HSV-1（まれにHSV-2）</span></td>'
        '<td><span class="kw3">高熱＋既存湿疹部位に集簇性小水疱→びらん・出血性痂皮</span>。'
        '治療は<span class="kw3">アシクロビル</span>（<span class="kw">Q.29</span>）</td></tr>'
        '<tr><td><span class="kw3">伝染性膿痂疹</span></td>'
        '<td><span class="kw3">黄色ブドウ球菌／A群溶連菌</span></td>'
        '<td>水疱性（乳幼児・夏）と痂皮性。<span class="kw">飛び火</span></td></tr>'
        '<tr><td>毛包炎・蜂窩織炎・SSSS</td><td>黄色ブドウ球菌</td>'
        '<td>AD では<span class="kw3">黄色ブドウ球菌の定着率が高い</span></td></tr>'
        '<tr><td>伝染性軟属腫</td><td>伝染性軟属腫ウイルス</td><td>中心臍窩をもつ小丘疹。バリア破綻で広がる</td></tr>'
        '<tr><td>白癬・カンジダ</td><td>皮膚糸状菌・Candida</td>'
        '<td>ステロイド外用下で<span class="kw4">異型白癬〈tinea incognito〉</span>になりうる</td></tr></table>'
        '<span class="kw3">HSVと皮膚疾患の関係を3通りに整理</span>する。<br>'
        '<span class="kw3">①播種する</span>＝<span class="kw3">Kaposi水痘様発疹症</span>'
        '（AD などの湿疹が土壌。本問）。<br>'
        '<span class="kw3">②誘因になる</span>＝<span class="kw3">多形滲出性紅斑（再発型）</span>'
        '——HSV感染の1〜2週後に標的状紅斑が出る。'
        '再発を繰り返す例には<span class="kw">アシクロビルの抑制療法</span>が有効。<br>'
        '<span class="kw3">③直接の病変をつくる</span>＝口唇ヘルペス・性器ヘルペス・'
        '<span class="kw">ヘルペス性歯肉口内炎（初感染）・ヘルペス性瘭疽・角膜炎・脳炎</span>。<br>'
        '<span class="kw3">Kaposi水痘様発疹症を疑ったら、'
        'Tzanck試験で多核巨細胞を確認し（<span class="kw">Q.42</span>）、'
        'ためらわずアシクロビルを開始し、眼周囲病変では眼科へ紹介する</span>——'
        'この3ステップが実戦の型である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Kaposi水痘様発疹症の背景疾患＝アトピー性皮膚炎</span>。<br>'
         '② 理由は<span class="kw3">①バリア破綻②Th2優位で抗ウイルス自然免疫が低下③掻破による自家接種</span>。<br>'
         '③ <span class="kw3">AD の皮膚は感染に弱い</span>——膿痂疹・毛包炎・伝染性軟属腫・白癬も合併しやすい。<br>'
         '④ <span class="kw4">多形滲出性紅斑はHSVが「誘因」で、播種の土壌ではない</span>——関係が逆。<br>'
         '⑤ 原因ウイルスは<span class="kw3">HSV</span>で、VZVではない（<span class="kw">Q.29・Q.48</span>）。<br>'
         '⑥ 診断は<span class="kw3">Tzanck試験</span>、治療は<span class="kw3">アシクロビル</span>（<span class="kw">Q.42</span>）。')),

Q('107I-45', 79, [('bi', '📷')],
  '33歳の男性。<span class="kw">発熱と顔面の皮疹</span>とを主訴に来院した。'
  '<span class="kw">幼少期からアトピー性皮膚炎があり、治療を受けていた</span>。'
  '<span class="kw">2日前から38℃台の発熱、顔面の紅斑、びらんおよび小水疱が出現している</span>。'
  '顔面の写真（A）と<span class="kw">水疱内容のTzanck試験のMay-Giemsa染色標本（B）</span>とを示す。<br>'
  '<strong>原因として最も考えられるのはどれか。</strong>',
  [('a', 'EB ウイルス', False, '<span class="kw4">伝染性単核球症</span>（発熱・咽頭痛・頸部リンパ節腫脹・肝脾腫・異型リンパ球）。'
                     '皮膚では<span class="kw">アンピシリン投与後の斑状丘疹状発疹</span>や'
                     '<span class="kw">種痘様水疱症（露光部・小児・瘢痕を残す）</span>が関連するが、本例の像とは異なる。'),
   ('b', 'サイトメガロウイルス', False, '<span class="kw4">免疫不全者の網膜炎・肺炎・腸炎、先天感染</span>が主体。'
                     '健常成人の皮膚に集簇性小水疱をつくることはない。'),
   ('c', '単純ヘルペスウイルス', True, '<span class="kw3">アトピー性皮膚炎を背景に、高熱とともに顔面へ小水疱・びらんが急速に拡大＝Kaposi水痘様発疹症</span>。'
                     '<span class="kw3">写真BのTzanck試験で見えている大型の多核巨細胞（核が複数融合した細胞）が'
                     'ヘルペスウイルス感染の直接的な証拠</span>である。'),
   ('d', '水痘・帯状疱疹ウイルス', False, '<span class="kw4">Tzanck試験ではHSVと同じく多核巨細胞が見えるため、この検査だけでは区別できない</span>。'
                     'しかし<span class="kw3">水痘は全身に新旧混在して散在し、帯状疱疹は片側性・デルマトーム一致で疼痛が強い</span>のに対し、'
                     '本例は<span class="kw3">AD の既往＋顔面の湿疹部位に一致した集簇</span>という分布であり、Kaposi水痘様発疹症を考える。'),
   ('e', 'ヒトパピローマウイルス', False, '<span class="kw4">疣贅（尋常性疣贅・扁平疣贅・尖圭コンジローマ）や子宮頸癌</span>の原因。'
                     '<span class="kw4">増殖性の角化性病変をつくるウイルスであり、水疱は形成しない</span>。')],
  'アトピー性皮膚炎を背景に高熱と顔面の集簇性小水疱・びらん。Tzanck試験（May-Giemsa染色）で多核巨細胞を認め、Kaposi水痘様発疹症＝単純ヘルペスウイルスと診断できる。',
  imgs=['images/107I-45_1.jpeg', 'images/107I-45_2.jpeg'],
  patho=('🔬 Tzanck試験の多核巨細胞——ベッドサイドで数分で出る答え',
         '本問は<span class="kw">Q.29</span>と同じKaposi水痘様発疹症だが、'
         '<span class="kw3">臨床写真に加えてTzanck試験の標本が提示されている</span>点が異なる。'
         '<span class="kw3">写真Aは顔面の広範なびらんと黄色痂皮</span>——'
         '集簇した小水疱が融合して破れ、滲出液が乾いた像である。'
         '<span class="kw3">写真Bは大型で、複数の核が融合した「多核巨細胞」</span>が'
         'May-Giemsa染色で赤紫色に染まって見えている。<br>'
         '<span class="kw3">Tzanck試験</span>は'
         '<span class="kw3">新鮮な水疱の天井を除き、水疱底を擦過して細胞をスライドガラスに塗抹し、'
         'Giemsa（またはWright）染色して鏡検する</span>だけの検査で、'
         '<span class="kw3">数分で結果が出る</span>（<span class="kw">Q.15</span>）。'
         '見えるものは2つに大別され、'
         '<span class="kw3">①棘融解細胞〈Tzanck細胞〉＝天疱瘡</span>、'
         '<span class="kw3">②多核巨細胞・核内封入体＝ヘルペスウイルス感染</span>である。<br>'
         '多核巨細胞ができる理由は明快である。'
         '<span class="kw3">ヘルペスウイルスは感染細胞の膜を融合させる性質をもち、'
         '隣り合うケラチノサイトが融合して1個の細胞に複数の核が入った巨細胞となる</span>。'
         '核は<span class="kw3">すりガラス状（ground glass）に見え、辺縁に濃縮したクロマチンが押しやられる</span>のが'
         '典型で、写真Bはまさにこの像である。<br>'
         '<span class="kw4">ここで必ず押さえるべき限界がある。'
         'Tzanck試験ではHSVとVZVを区別できない</span>——'
         'どちらも同じ多核巨細胞を作るからである（これが肢dを単純に「誤り」と言えない理由でもある）。'
         'したがって<span class="kw3">両者の区別は臨床像（分布）で行う</span>。'
         '<span class="kw3">AD の既往＋既存湿疹部位に一致した集簇＋高熱＝Kaposi水痘様発疹症（HSV）</span>、'
         '<span class="kw3">全身に新旧混在＝水痘</span>、'
         '<span class="kw3">片側性・デルマトーム一致・強い神経痛＝帯状疱疹</span>。'
         '確定が必要なら<span class="kw3">蛍光抗体法・PCR</span>を追加する。'
         '<span class="kw3">「迅速性はTzanck、特異性はPCR」</span>という役割分担で理解しておく。'),
  deep=('📌 水疱をつくるウイルスと、つくらないウイルス',
        '<table class="tb"><tr><th>ウイルス</th><th>皮膚病変</th><th>水疱</th></tr>'
        '<tr><td><span class="kw3">HSV-1/2</span></td>'
        '<td><span class="kw3">口唇/性器ヘルペス・Kaposi水痘様発疹症・ヘルペス性瘭疽</span></td>'
        '<td><span class="kw3">あり（集簇性）</span></td></tr>'
        '<tr><td><span class="kw3">VZV</span></td><td>水痘（全身散在・新旧混在）／帯状疱疹（片側デルマトーム）</td>'
        '<td><span class="kw3">あり</span></td></tr>'
        '<tr><td>コクサッキーウイルス</td><td><span class="kw">手足口病</span>（手掌・足底・口腔）</td><td>あり</td></tr>'
        '<tr><td>EBV</td><td>伝染性単核球症の発疹・<span class="kw">種痘様水疱症</span></td><td>種痘様水疱症では あり</td></tr>'
        '<tr><td>CMV</td><td>先天感染・免疫不全者の臓器病変</td><td>通常なし</td></tr>'
        '<tr><td><span class="kw">HPV</span></td><td><span class="kw3">疣贅・尖圭コンジローマ</span></td>'
        '<td><span class="kw4">なし（角化性の増殖）</span></td></tr>'
        '<tr><td>伝染性軟属腫ウイルス</td><td>中心臍窩のある小丘疹</td><td>なし</td></tr>'
        '<tr><td>ヒトパルボウイルスB19</td><td><span class="kw">伝染性紅斑（りんご病）</span></td><td>なし</td></tr>'
        '<tr><td>HHV-6/7</td><td>突発性発疹・<span class="kw">DIHSでの再活性化</span></td><td>なし</td></tr></table>'
        '<span class="kw3">Tzanck試験の実務上の注意</span>を再確認しておく。'
        '<span class="kw3">①できるだけ新鮮な水疱を選ぶ</span>——'
        '<span class="kw4">古い水疱や膿疱では細胞が変性し、二次感染の細胞が混じって判定できない</span>。'
        '<span class="kw3">②水疱の内容液ではなく「水疱底を擦って細胞を採る」</span>——'
        '<span class="kw4">液だけでは細胞成分が乏しく診断できない</span>。'
        '<span class="kw3">③陰性でも否定はできない</span>——'
        '感度は必ずしも高くないため、臨床的に疑わしければ'
        '<span class="kw3">結果を待たずにアシクロビルを開始</span>し、PCRで確定する。'
        'Kaposi水痘様発疹症は<span class="kw4">治療の遅れが角膜炎・脳炎・敗血症につながる</span>ため、'
        '<span class="kw3">「疑ったら始める」</span>のが原則である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Tzanck試験で多核巨細胞＝ヘルペスウイルス感染</span>。'
         '<span class="kw3">棘融解細胞なら天疱瘡</span>（<span class="kw">Q.15</span>）。<br>'
         '② <span class="kw4">Tzanck試験ではHSVとVZVを区別できない</span>。'
         '<span class="kw3">区別は分布（臨床像）で行い、確定はPCR・蛍光抗体法</span>。<br>'
         '③ <span class="kw3">AD ＋高熱＋顔面の集簇性小水疱＝Kaposi水痘様発疹症（HSV）</span>。<br>'
         '④ 多核巨細胞ができるのは<span class="kw3">ウイルスが細胞膜を融合させる</span>ため。核はすりガラス状。<br>'
         '⑤ <span class="kw4">HPVは水疱を作らない</span>（角化性の増殖）——ウイルスごとの皮疹型を整理する。<br>'
         '⑥ <span class="kw3">疑ったら結果を待たずにアシクロビルを開始</span>する。')),

Q('104B-42', 98, [('bi', '📷')],
  '26歳の女性。<span class="kw">看護師</span>。<span class="kw">両側頸部の皮疹</span>を主訴に受診した。'
  '<span class="kw">1年前から両側頸部に痒みを伴う帯状の紅色の皮疹が出現した</span>。'
  '<span class="kw">休暇中は軽快したが、仕事を再開すると再燃した</span>。左側頸部の写真を示す。<br>'
  '<strong>診断に最も有用なのはどれか。</strong>',
  [('a', '針反応', False, '<span class="kw4">Behçet病の検査</span>（無菌針の刺入後24〜48時間で膿疱）。本例に口腔内アフタ・外陰部潰瘍・ぶどう膜炎の記載はない。'),
   ('b', '光線テスト', False, '<span class="kw4">紫外線を段階的に照射して最少紅斑量〈MED〉を測り、光線過敏の有無を見る検査</span>。'
                     '本例の皮疹は<span class="kw4">露光部の分布ではなく、頸部に帯状</span>——つまり物が当たる形をしている。'),
   ('c', 'パッチテスト', True, '<span class="kw3">写真には聴診器のチューブが写っており、皮疹はその当たる部位に一致して帯状に分布</span>している。'
                     '<span class="kw3">看護師・1年の経過・休暇で軽快し就業で再燃</span>——'
                     '<span class="kw3">聴診器のゴム（チウラム等）やラテックスによるアレルギー性接触皮膚炎</span>であり、'
                     '原因検索は<span class="kw3">パッチテスト（Ⅳ型）</span>である。'),
   ('d', 'プリックテスト', False, '<span class="kw4">Ⅰ型（即時型）の検査</span>で15〜20分後に膨疹を判定する。'
                     '（<span class="kw">ラテックスは即時型アレルギーも起こしうる</span>が、'
                     '本例は<span class="kw4">1年かけて慢性に経過する湿疹病変</span>であり、蕁麻疹やアナフィラキシーではない。）'),
   ('e', 'スクラッチテスト', False, '<span class="kw4">これもⅠ型の検査</span>。'
                     '皮膚を浅く引っかいて抗原を滴下し即時型反応を見るもので、遅延型の接触皮膚炎の原因検索には適さない。')],
  '看護師の両側頸部に、聴診器のチューブが当たる位置と一致した帯状の湿疹。休暇で軽快し就業で再燃する。ゴム（チウラム・ラテックス）によるアレルギー性接触皮膚炎で、診断にはパッチテスト。',
  imgs=['images/104B-42_1.jpeg'],
  patho=('🩺 「分布」と「時間」が原因を名指しする',
         '接触皮膚炎の診断は<span class="kw3">検査に頼る前に、まず分布と時間経過で原因を絞る</span>ことから始まる。'
         '本例はその教科書的な一例である。<br>'
         '<span class="kw3">①分布</span>——'
         '<span class="kw3">「両側頸部に帯状」</span>という形がまず異常である。'
         '自然に生じる皮膚疾患が、左右の頸部に帯状という幾何学的な形をとることはまずない。'
         '<span class="kw3">皮疹が不自然な形（帯状・線状・四角・輪状）をしていたら、外から当たっている物を探す</span>——'
         'これが接触皮膚炎を疑う第一の合図である。'
         '写真には<span class="kw3">聴診器のチューブが実際に写り込んでおり</span>、'
         'その走行と皮疹の位置が一致している。<br>'
         '<span class="kw3">②時間</span>——'
         '<span class="kw3">「休暇中は軽快し、仕事を再開すると再燃する」</span>という経過は、'
         '<span class="kw3">職業性（就業に伴う曝露）であることを決定づける</span>。'
         '<span class="kw3">曝露が止まれば治り、再開すれば再燃する</span>という'
         'この可逆性は、原因物質が職場にあることの何よりの証拠である。'
         '手湿疹で「休みの日はよい」と語る美容師・調理師・医療従事者も同じ論理で評価する。<br>'
         '<span class="kw3">③職業</span>——'
         '看護師で頸部に常時当たる物といえば<span class="kw3">聴診器</span>である。'
         '聴診器のチューブやイヤーピースには<span class="kw3">ゴム（加硫促進剤のチウラム・カルバメート）や'
         'ラテックス</span>が使われており、'
         '<span class="kw3">医療従事者に多いアレルギー性接触皮膚炎の原因</span>として知られる。<br>'
         'ここまで絞ったうえで<span class="kw3">パッチテスト</span>を行い、'
         '<span class="kw3">ゴム関連アレルゲン（チウラムミックス・カルバミックス・メルカプトミックス）や'
         '実際の聴診器チューブそのもの（as is テスト）を貼って確認</span>する。'
         '<span class="kw3">陽性物質が同定できれば、シリコン製チューブへの変更やカバーの装着で根治する</span>——'
         '<span class="kw4">原因を特定せずステロイドを塗り続ければ、働くかぎり再燃を繰り返す</span>。<br>'
         '<span class="kw4">なおラテックスは即時型（Ⅰ型）アレルギーも起こす</span>点は別に押さえる必要がある。'
         '<span class="kw4">手袋着用直後の蕁麻疹・鼻炎・喘息・アナフィラキシー</span>がそれで、'
         '<span class="kw3">こちらはプリックテストや特異的IgEで評価</span>する。'
         '本例は1年かけた慢性湿疹なので遅延型であり、パッチテストが正解になる。'),
  deep=('📌 職業性皮膚疾患と、皮疹の「形」が語ること',
        '<table class="tb"><tr><th>職業</th><th>典型的な原因</th><th>部位</th></tr>'
        '<tr><td><span class="kw3">医療従事者</span></td>'
        '<td><span class="kw3">ゴム手袋（チウラム・ラテックス）・聴診器・消毒薬（グルタラール）</span></td>'
        '<td>手・前腕・<span class="kw3">頸部</span></td></tr>'
        '<tr><td>美容師</td><td><span class="kw3">染毛剤（PPD）</span>・パーマ液・シャンプー</td><td>手・前腕（<span class="kw">Q.39</span>）</td></tr>'
        '<tr><td>調理師・主婦</td><td>水仕事・洗剤（<span class="kw3">刺激性が主体</span>）・食材</td><td>手（手湿疹）</td></tr>'
        '<tr><td>建設業</td><td><span class="kw">セメント（クロム）</span></td><td>手・下腿</td></tr>'
        '<tr><td>金属加工</td><td>切削油・ニッケル・コバルト</td><td>手・前腕</td></tr></table>'
        '<table class="tb"><tr><th>皮疹の形</th><th>示唆されるもの</th></tr>'
        '<tr><td><span class="kw3">帯状・線状・四角</span></td>'
        '<td><span class="kw3">外部から当たっている物（接触皮膚炎）</span>・人工的な要因</td></tr>'
        '<tr><td>露光部（顔・V領域・手背）に左右対称</td><td><span class="kw3">光線過敏症</span>（<span class="kw">Q.12・Q.27</span>）</td></tr>'
        '<tr><td>片側性・デルマトームに一致</td><td><span class="kw3">帯状疱疹</span></td></tr>'
        '<tr><td>環状で辺縁隆起・中心治癒</td><td><span class="kw3">体部白癬</span></td></tr>'
        '<tr><td>左右対称・四肢屈側</td><td><span class="kw3">アトピー性皮膚炎</span></td></tr>'
        '<tr><td>Blaschko線に沿う</td><td>色素失調症・線状苔癬など<span class="kw">モザイク性疾患</span></td></tr></table>'
        '<span class="kw3">職業性皮膚疾患を疑ったときの問診の型</span>: '
        '<span class="kw3">①何の仕事で、何に触れるか（具体的な製品名まで）</span>、'
        '<span class="kw3">②休日・休暇で軽快するか</span>、'
        '<span class="kw3">③同僚に同じ症状の人がいるか（いれば刺激性の可能性が上がる）</span>、'
        '<span class="kw3">④保護具（手袋）を使っているか、その素材は何か</span>。'
        '<span class="kw4">保護具そのものが原因のこともある</span>ので、'
        '「手袋をしているのに悪化する」という訴えは手袋のゴムを疑う合図になる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">帯状・線状など不自然な形の皮疹＝接触皮膚炎</span>を疑う。当たっている物を探す。<br>'
         '② <span class="kw3">休暇で軽快し就業で再燃＝職業性</span>。可逆性が原因の所在を語る。<br>'
         '③ 原因検索は<span class="kw3">パッチテスト（Ⅳ型）</span>（<span class="kw">Q.30・Q.39・Q.54</span>）。<br>'
         '④ 医療従事者では<span class="kw3">ゴム（チウラム）・ラテックス・消毒薬</span>が代表的な原因。<br>'
         '⑤ <span class="kw4">ラテックスは即時型（Ⅰ型）も起こす</span>——'
         '<span class="kw3">手袋直後の蕁麻疹・アナフィラキシーならプリックテスト・特異的IgE</span>。<br>'
         '⑥ 根本治療は<span class="kw3">原因物質の回避（材質変更）</span>。ステロイドだけでは再燃する。')),

Q('104D-45', 51, [('bi', '📷')],
  '24歳の男性。<span class="kw">皮疹と口腔内の違和感</span>とを主訴に来院した。'
  '<span class="kw">2か月前からバナナやメロンを摂取後10分位で口腔内に違和感が生じ、時々息苦しくなっていた</span>。'
  '<span class="kw">昨日、バナナを摂取後、同様の症状に加えて体幹と四肢とに多数の膨疹が生じた</span>。'
  '検査手技と関連した写真（①〜⑤）を示す。<br>'
  '<strong>診断に有用なのはどれか。</strong>',
  [('a', '①（全身の紫外線照射装置）', False, '<span class="kw4">光線療法（ナローバンドUVB・PUVA）の装置</span>で、'
                     '乾癬・尋常性白斑・アトピー性皮膚炎などの<span class="kw4">治療</span>に用いる（<span class="kw">Q.19</span>）。診断のための検査ではない。'),
   ('b', '②（打腱器・筆・針などの神経学的診察器具）', False, '<span class="kw4">腱反射・触覚・痛覚・関節可動域を調べる神経学的診察の器具</span>。'
                     '本例の即時型食物アレルギーの診断とは無関係である。'),
   ('c', '③（鑷子・スライドガラス・木ベラ）', False, '<span class="kw4">鱗屑や水疱底の細胞を採取してスライドガラスに載せるための器具</span>で、'
                     '<span class="kw">KOH直接鏡検（真菌）やTzanck試験</span>に用いる（<span class="kw">Q.15</span>）。感染症や水疱症の検査であり、本例には適さない。'),
   ('d', '④（前腕への皮内・プリックテスト）', True, '<span class="kw3">抗原液を前腕に置いて浅く刺す／皮内に注射し、15〜20分後の膨疹と発赤で判定する'
                     'Ⅰ型（即時型）アレルギーの検査</span>。'
                     '<span class="kw3">摂取後10分で症状が出る本例はまさに即時型</span>であり、'
                     '<span class="kw3">果物では新鮮な果肉を用いる prick-to-prick 法</span>が有用である。'),
   ('e', '⑤（前腕へのパッチテスト）', False, '<span class="kw4">被疑物質を48時間貼付してⅣ型（遅延型）反応を見る検査</span>（<span class="kw">Q.30</span>）。'
                     '<span class="kw4">接触皮膚炎の原因検索に用いるもので、即時型の食物アレルギーには型が合わない</span>。')],
  'バナナ・メロン摂取後10分で口腔内違和感・呼吸困難・膨疹＝Ⅰ型（即時型）の食物アレルギー（口腔アレルギー症候群／ラテックス-フルーツ症候群）。診断はプリック（皮内）テスト＝④。',
  imgs=['images/104D-45_1.jpeg', 'images/104D-45_2.jpeg', 'images/104D-45_3.jpeg',
        'images/104D-45_4.jpeg', 'images/104D-45_5.jpeg'],
  ans_label='ｄ　④（前腕への皮内・プリックテスト）',
  patho=('🍌 摂取後10分＝Ⅰ型——「時間」が検査を決める',
         '本問は<span class="kw3">5枚の写真そのものが選択肢</span>という形式だが、'
         '解く道筋は<span class="kw3">「この患者の反応は何型か」→「その型を見る検査はどれか」</span>の2段階でしかない。<br>'
         '<span class="kw3">第1段階：何型か</span>。'
         '<span class="kw3">摂取後10分という速さ、口腔内の違和感、息苦しさ、そして全身の膨疹</span>——'
         'これらはすべて<span class="kw3">IgEと肥満細胞によるⅠ型（即時型）アレルギー</span>の像である。'
         '<span class="kw3">分〜十数分で起こる反応はⅠ型、24〜48時間かかる反応はⅣ型</span>という'
         '時間の物差しがそのまま型の判定になる。<br>'
         '<span class="kw3">第2段階：Ⅰ型を見る検査</span>。'
         '<span class="kw3">プリックテスト・皮内テスト・スクラッチテスト（いずれも15〜20分で膨疹を判定）</span>と'
         '<span class="kw3">血清特異的IgE</span>である。'
         '写真④は<span class="kw3">前腕に針で抗原液を刺入している場面</span>で、これに該当する。'
         '一方⑤のパッチテストはⅣ型、③は真菌・水疱症の検査、'
         '①は治療装置、②は神経診察の器具であり、いずれも型も目的も合わない。<br>'
         '<span class="kw3">本例の病態はさらに特定できる</span>。'
         '<span class="kw3">バナナ・メロンといった果物の摂取直後に口腔・咽頭の違和感が出るもの</span>を'
         '<span class="kw3">口腔アレルギー症候群〈OAS〉</span>という。'
         'これは<span class="kw3">花粉やラテックスのアレルゲンと果物のタンパクが構造的に似ているため、'
         '交叉反応で口腔粘膜に症状が出る</span>もので、'
         '<span class="kw3">バナナ・アボカド・クリ・キウイはラテックスと交叉する（ラテックス-フルーツ症候群）</span>、'
         '<span class="kw3">メロン・スイカ・トマトはブタクサやカモガヤなどの花粉と交叉する</span>ことが知られる。'
         '<span class="kw4">本例は「息苦しさ」と「全身の膨疹」を伴っており、'
         '口腔内にとどまらない全身性の反応＝アナフィラキシーに進展しうる</span>点で注意を要する。<br>'
         '<span class="kw3">果物のアレルゲンは熱や消化で壊れやすく、'
         '市販の抗原エキスでは偽陰性になりやすい</span>。'
         'そこで<span class="kw3">新鮮な果肉に針を刺してから患者の皮膚を刺す prick-to-prick 法</span>が'
         '実務上とくに有用になる。'
         '正答率51%と低いのは、'
         '<span class="kw4">写真から器具を同定する視覚的な負荷が加わっている</span>ためだが、'
         '<span class="kw3">「10分＝Ⅰ型＝プリック」という筋が通っていれば、'
         '④と⑤のどちらが刺していてどちらが貼っているかを見るだけで決まる</span>。'),
  deep=('📌 皮膚テストの一覧／口腔アレルギー症候群の交叉反応',
        '<table class="tb"><tr><th>検査</th><th>型</th><th>手技</th><th>判定</th></tr>'
        '<tr><td><span class="kw3">プリックテスト</span></td><td><span class="kw3">Ⅰ型</span></td>'
        '<td>抗原液を置き専用針で浅く刺す</td><td><span class="kw3">15〜20分後の膨疹径</span></td></tr>'
        '<tr><td><span class="kw3">prick-to-prick法</span></td><td>Ⅰ型</td>'
        '<td><span class="kw3">新鮮な食材に刺した針で皮膚を刺す</span></td>'
        '<td>同上。<span class="kw3">果物・野菜で有用</span></td></tr>'
        '<tr><td>皮内テスト</td><td>Ⅰ型</td><td>抗原を皮内に注射</td>'
        '<td>15〜20分後。<span class="kw4">感度は高いが全身反応の危険</span></td></tr>'
        '<tr><td>スクラッチテスト</td><td>Ⅰ型</td><td>皮膚を引っかいて滴下</td><td>15〜20分後</td></tr>'
        '<tr><td><span class="kw3">パッチテスト</span></td><td><span class="kw3">Ⅳ型</span></td>'
        '<td>背部に48時間貼付</td><td><span class="kw3">48・72時間（金属は7日）</span></td></tr>'
        '<tr><td>食物経口負荷試験</td><td>—</td><td>実際に摂取させる</td>'
        '<td><span class="kw3">確定診断の gold standard</span>。<span class="kw4">救急対応可能な環境で</span></td></tr></table>'
        '<table class="tb"><tr><th>交叉反応</th><th>原因アレルゲン</th><th>関連する果物・野菜</th></tr>'
        '<tr><td><span class="kw3">ラテックス-フルーツ症候群</span></td><td><span class="kw3">ラテックス</span></td>'
        '<td><span class="kw3">バナナ・アボカド・クリ・キウイ</span></td></tr>'
        '<tr><td rowspan="3"><span class="kw3">花粉-食物アレルギー症候群</span></td>'
        '<td>シラカンバ・ハンノキ</td><td><span class="kw3">リンゴ・モモ・サクランボ・ナシ（バラ科）</span>・大豆</td></tr>'
        '<tr><td><span class="kw">ブタクサ</span></td><td><span class="kw3">メロン・スイカ・キュウリ・バナナ</span></td></tr>'
        '<tr><td>カモガヤ（イネ科）</td><td>メロン・スイカ・トマト・オレンジ</td></tr></table>'
        '<span class="kw3">対応の要点</span>: '
        '<span class="kw3">①原因食物の回避（加熱すれば食べられることも多い）</span>、'
        '<span class="kw3">②口腔内にとどまらず呼吸器症状・血圧低下を伴う例では'
        'アドレナリン自己注射薬〈エピペン〉を処方し、使い方を指導する</span>、'
        '<span class="kw3">③ラテックス-フルーツ症候群では、医療現場のラテックス手袋への曝露にも注意</span>'
        '（<span class="kw">Q.43</span>）。'
        '<span class="kw4">本例のように「息苦しさ」がある時点で、単なるOASではなくアナフィラキシーの前段階として扱う</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">摂取後数分〜十数分＝Ⅰ型</span>。検査は<span class="kw3">プリック／皮内／スクラッチテスト（15〜20分判定）</span>と特異的IgE。<br>'
         '② <span class="kw4">パッチテストはⅣ型</span>——即時型の食物アレルギーには使わない（<span class="kw">Q.30</span>）。<br>'
         '③ <span class="kw3">口腔アレルギー症候群〈OAS〉</span>＝果物摂取直後の口腔・咽頭の違和感。交叉反応による。<br>'
         '④ <span class="kw3">バナナ・アボカド・クリ・キウイ＝ラテックスと交叉</span>／'
         '<span class="kw3">メロン・スイカ＝ブタクサ等の花粉と交叉</span>。<br>'
         '⑤ 果物では<span class="kw3">新鮮な果肉を使う prick-to-prick 法</span>が有用（市販エキスは偽陰性になりやすい）。<br>'
         '⑥ <span class="kw4">呼吸器症状を伴えばアナフィラキシーとして扱い、エピペンを処方</span>する。')),
]

QUESTIONS += [

Q('103I-20', 95, [],
  '<strong><span class="kw">蕁麻疹</span>がみられるのはどれか。</strong>',
  [('a', 'GVHD', False, '<span class="kw4">ドナー由来T細胞が宿主組織を攻撃する</span>もので、'
                     '皮疹は<span class="kw4">斑状丘疹状の紅斑（手掌・足底・耳介から始まる）</span>、'
                     '重症ではTEN様の水疱・表皮剝離。病理は<span class="kw">界面皮膚炎・satellite cell necrosis</span>で膨疹ではない。'),
   ('b', 'うっ滞性皮膚炎', False, '<span class="kw4">下肢静脈のうっ滞により下腿（とくに内果周囲）に生じる慢性の湿疹</span>。'
                     '<span class="kw">色素沈着（ヘモジデリン）・浮腫・硬化・潰瘍</span>を伴い、経過は年単位。一過性の膨疹とは対極にある。'),
   ('c', '自家感作性皮膚炎', False, '<span class="kw4">原発巣の炎症増悪に続いて全身に小型の紅色丘疹が散布状に多発する湿疹反応</span>。'
                     '皮疹は<span class="kw4">丘疹であって膨疹ではなく、数時間で消えることもない</span>（<span class="kw">Q.38</span>）。'),
   ('d', 'Stevens-Johnson 症候群', False, '<span class="kw4">薬剤等を契機とする重症薬疹</span>。'
                     '<span class="kw">発熱・粘膜疹（眼・口唇・外陰）・標的状紅斑・水疱びらん</span>が主体で、'
                     '<span class="kw4">表皮壊死を伴う持続性の病変</span>である。'),
   ('e', '食物依存性運動誘発アナフィラキシー', True, '<span class="kw3">原因食物を摂取した後に運動が加わったときにのみ発症するⅠ型アレルギー</span>。'
                     '<span class="kw3">全身の蕁麻疹（膨疹）から始まり、血管性浮腫・呼吸困難・血圧低下へ進む</span>。'
                     '原因は<span class="kw3">小麦（ω-5グリアジン）・甲殻類</span>が代表。')],
  '食物依存性運動誘発アナフィラキシー〈FDEIA〉はⅠ型アレルギーで、全身の蕁麻疹（膨疹）から始まる。GVHD・SJSは界面皮膚炎、うっ滞性皮膚炎・自家感作性皮膚炎は湿疹群で膨疹は出ない。',
  patho=('🏃 FDEIA——「食べただけ」でも「走っただけ」でも起きない',
         '<span class="kw3">食物依存性運動誘発アナフィラキシー〈FDEIA〉</span>は、'
         '<span class="kw3">特定の食物を摂取し、その後2〜4時間以内に運動をしたときにのみ'
         'アナフィラキシーを起こす</span>という特殊なⅠ型アレルギーである。'
         '<span class="kw3">食物を食べるだけでは症状が出ず、運動だけでも出ない</span>——'
         'この<span class="kw3">「二重の条件」</span>が病名そのものであり、診断の鍵でもある。<br>'
         '機序は<span class="kw3">運動によって消化管のアレルゲン吸収が亢進し、'
         '血中の抗原量が反応の閾値を超える</span>ためと考えられている。'
         '<span class="kw4">NSAIDs・アルコール・入浴・疲労・月経・感冒も同じように閾値を下げる</span>ため、'
         '<span class="kw4">「運動していないのに発症した」例では、直前のNSAIDs内服や飲酒を必ず聞く</span>。<br>'
         '症状は<span class="kw3">全身の蕁麻疹（膨疹）で始まり、'
         '血管性浮腫（眼瞼・口唇・喉頭）、呼吸困難・喘鳴、腹痛・嘔吐、'
         'そして血圧低下・意識障害というアナフィラキシーショック</span>へ進みうる。'
         '<span class="kw3">最初に出るのが膨疹である</span>という点が本問の答えに直結する。'
         '<span class="kw3">原因食物は小麦（アレルゲンはω-5グリアジン）が最多で、次いで甲殻類（エビ・カニ）</span>。'
         '<span class="kw3">学童〜若年成人に多く、給食後の体育で発症する</span>という典型的な状況が国試でも問われる。<br>'
         '診断は<span class="kw3">病歴が最も重要</span>で、'
         '<span class="kw3">特異的IgE（ω-5グリアジン）</span>、プリックテスト、'
         '必要なら<span class="kw4">救急対応可能な環境での食物摂取＋運動負荷試験</span>で確認する。'
         '治療・予防は<span class="kw3">①原因食物の摂取後4時間は運動を避ける（または運動前4時間は食べない）、'
         '②アドレナリン自己注射薬〈エピペン〉の携帯と使用法の指導、'
         '③学校・職場への情報共有、④NSAIDs・アルコールの回避</span>。'
         '<span class="kw3">発症時はためらわずアドレナリン0.3mgを大腿外側に筋注</span>する。<br>'
         '本問の他の肢はいずれも<span class="kw3">膨疹を作らない疾患</span>で並べられており、'
         '<span class="kw3">「膨疹＝24時間以内に消える真皮上層の浮腫＝肥満細胞のヒスタミン」</span>という'
         '定義（<span class="kw">Q.31・Q.33・Q.47</span>）を持っていれば一択になる。'),
  deep=('📌 蕁麻疹をきたす病態と、アナフィラキシーの初期対応',
        '<table class="tb"><tr><th>分類</th><th>代表</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">Ⅰ型アレルギー</span></td>'
        '<td><span class="kw3">食物・薬剤・ハチ毒・ラテックス・FDEIA</span></td>'
        '<td>IgE介在。<span class="kw3">分〜十数分で発症</span></td></tr>'
        '<tr><td>非アレルギー性（直接脱顆粒）</td>'
        '<td><span class="kw">造影剤・バンコマイシン（red man症候群）・オピオイド・NSAIDs</span></td>'
        '<td>IgEを介さず肥満細胞を直接刺激</td></tr>'
        '<tr><td>物理性（刺激誘発型）</td>'
        '<td><span class="kw">機械性（皮膚描記症）・寒冷・日光・温熱・コリン性</span></td>'
        '<td>誘発試験で確認（<span class="kw">Q.22</span>）</td></tr>'
        '<tr><td>感染・全身疾患に伴う</td><td>ウイルス感染（小児の急性蕁麻疹の多く）・膠原病・悪性腫瘍</td><td>—</td></tr>'
        '<tr><td>肥満細胞の増加</td><td><span class="kw">色素性蕁麻疹・肥満細胞症</span></td>'
        '<td>Darier徴候（<span class="kw">Q.7・Q.25</span>）</td></tr>'
        '<tr><td>ヒスタミンの外因性摂取</td><td><span class="kw3">ヒスタミン食中毒</span></td>'
        '<td>アレルギーではない（<span class="kw">Q.49</span>）</td></tr></table>'
        '<span class="kw3">アナフィラキシーの初期対応</span>（順序が問われる）: '
        '<span class="kw3">①アドレナリン0.3mg（小児0.01mg/kg）を大腿前外側に筋注——最優先で、遅らせない</span>。'
        '<span class="kw3">②仰臥位にして下肢を挙上</span>'
        '（<span class="kw4">急に立たせたり座らせたりしない——静脈還流が減って心停止しうる</span>）。'
        '<span class="kw3">③気道確保・酸素投与・静脈路確保と急速輸液</span>。'
        '<span class="kw3">④効果不十分なら5〜15分ごとにアドレナリンを反復</span>。'
        '<span class="kw4">抗ヒスタミン薬・ステロイドは補助であり、アドレナリンの代わりにはならない</span>——'
        'ステロイドは効果発現に数時間かかるため二相性反応の予防目的で用いる。'
        '<span class="kw4">β遮断薬内服中の患者ではアドレナリンが効きにくく、グルカゴンを考慮</span>する。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">FDEIA＝原因食物の摂取後2〜4時間以内の運動でのみ発症</span>。初発症状は<span class="kw3">全身の蕁麻疹</span>。<br>'
         '② 原因は<span class="kw3">小麦（ω-5グリアジン）が最多、次いで甲殻類</span>。学童〜若年成人・給食後の体育。<br>'
         '③ <span class="kw4">NSAIDs・アルコール・入浴・疲労は閾値を下げる</span>——運動がなくても発症しうる。<br>'
         '④ 対応＝<span class="kw3">食後4時間の運動回避＋エピペン携帯＋学校への情報共有</span>。<br>'
         '⑤ <span class="kw3">アナフィラキシーはアドレナリン筋注が最優先</span>。'
         '<span class="kw4">抗ヒスタミン薬・ステロイドは補助</span>。<br>'
         '⑥ GVHD・SJSは<span class="kw3">界面皮膚炎</span>、うっ滞性・自家感作性皮膚炎は<span class="kw3">湿疹群</span>で膨疹は出ない。')),

Q('102A-32', 96, [],
  '14歳の男子。<span class="kw">発熱と顔面の皮疹</span>とを主訴に来院した。'
  '<span class="kw">乳児期から顔面と四肢屈曲部とに痒みのある皮疹を繰り返し</span>、'
  '小学校に入学するころから体幹に乾燥肌を伴うようになった。'
  '<span class="kw">来院の3日前から38℃台の発熱</span>があり、'
  '<span class="kw">顔面全体に多数の小水疱とびらんとを認める</span>。<br>'
  '<strong>考えられるのはどれか。</strong>',
  [('a', '種痘様水疱症', False, '<span class="kw4">EBV関連のリンパ増殖性疾患で、小児の露光部（顔面・手背）に'
                     '日光曝露後の水疱・壊死・痂皮を生じ、痘瘡様の瘢痕を残す</span>。'
                     '慢性・反復性の経過をとり、<span class="kw4">高熱とともに数日で急速に広がるものではない</span>。'),
   ('b', '多形滲出性紅斑', False, '<span class="kw4">四肢末梢優位に標的状紅斑（target lesion）が対称性に出る</span>。'
                     '中心が暗紅色〜水疱になることはあるが、<span class="kw4">顔面全体を埋める集簇性小水疱にはならない</span>。'),
   ('c', '自家感作性皮膚炎', False, '<span class="kw4">原発巣の増悪後、全身に小型の紅色丘疹が散布状に多発する湿疹反応</span>。'
                     '<span class="kw4">丘疹が主体で水疱・びらんではなく、高熱も伴わない</span>。'),
   ('d', 'Kaposi 水痘様発疹症', True, '<span class="kw3">乳児期からのアトピー性皮膚炎という基礎疾患に、'
                     '3日前からの38℃台の発熱と顔面全体の多数の小水疱・びらん</span>——'
                     '<span class="kw3">既存の湿疹病変にHSVが播種した典型像</span>である（<span class="kw">Q.29・Q.41・Q.42</span>）。'),
   ('e', 'ブドウ球菌性熱傷様皮膚症候群', False, '<span class="kw4">黄色ブドウ球菌の表皮剝脱毒素がDsg1を切断して表皮浅層が剝離する</span>もので、'
                     '<span class="kw">乳幼児に多く、口囲の放射状亀裂・眼脂・全身の紅斑と表皮剝離・Nikolsky現象陽性</span>が特徴。'
                     '<span class="kw4">集簇性の小水疱ではなく、熱傷様に「面」で皮膚がむける</span>点が異なる。')],
  '乳児期からのアトピー性皮膚炎を背景に、高熱と顔面全体の多数の小水疱・びらん。Kaposi水痘様発疹症（HSVの播種）。',
  patho=('🔥 「AD ＋高熱＋顔面の小水疱」は一つの型として覚える',
         '本問は<span class="kw">Q.29・Q.42</span>と同じ疾患を、'
         '<span class="kw3">写真なし・病歴のみ</span>で診断させる形式である。'
         '<span class="kw3">Kaposi水痘様発疹症は国試で繰り返し出題される最重要疾患</span>であり、'
         '<span class="kw3">「アトピー性皮膚炎の既往＋急な発熱＋顔面・上半身に集簇する小水疱／びらん」</span>という'
         '3点セットを<span class="kw3">一つの型</span>として記憶しておけば、'
         '写真の有無にかかわらず即答できる。<br>'
         '本例の病歴を分解すると診断根拠が並んでいる。'
         '<span class="kw3">①「乳児期から顔面と四肢屈曲部に痒みのある皮疹を繰り返し」</span>——'
         '年齢による分布の推移を含む典型的なアトピー性皮膚炎の経過（<span class="kw">Q.28</span>）。'
         '<span class="kw3">②「小学校入学ころから体幹に乾燥肌」</span>——'
         'バリア機能の低下が続いていることの表現。'
         '<span class="kw3">③「3日前から38℃台の発熱」</span>——'
         'ウイルス血症を伴う全身感染であることを示す。'
         '<span class="kw3">④「顔面全体に多数の小水疱とびらん」</span>——'
         '集簇した小水疱が融合し破れた像で、HSV播種の形態そのものである。<br>'
         '<span class="kw3">鑑別の切り口は「皮疹の形」と「基礎疾患」の2つ</span>である。'
         '<span class="kw3">小水疱が集簇する</span>のはヘルペス群の特徴で、'
         '<span class="kw4">SSSSのように「面」で表皮がむけるのとも、'
         '多形滲出性紅斑のように「標的状の紅斑」が散在するのとも、'
         '自家感作性皮膚炎のように「小丘疹」が散布するのとも明確に違う</span>。'
         'さらに<span class="kw3">基礎疾患がアトピー性皮膚炎である</span>という一点が、'
         'Kaposi水痘様発疹症を他から決定的に分ける。<br>'
         '<span class="kw3">対応も型で覚える</span>。'
         '<span class="kw3">①Tzanck試験で多核巨細胞を確認（数分で出る）</span>、'
         '<span class="kw3">②アシクロビルを直ちに開始（重症・広範なら点滴静注）</span>、'
         '<span class="kw3">③細菌の二次感染があれば抗菌薬を併用</span>、'
         '<span class="kw3">④眼周囲病変は角膜炎のリスクがあるので眼科へ紹介</span>、'
         '<span class="kw4">⑤感染期のステロイド外用は中止・減量し、制御後に再開してバリアを立て直す</span>。'),
  deep=('📌 「発熱＋全身の皮疹＋水疱/びらん」の鑑別',
        '<table class="tb"><tr><th>疾患</th><th>皮疹の形</th><th>好発</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Kaposi水痘様発疹症</span></td>'
        '<td><span class="kw3">集簇性小水疱→融合してびらん・出血性痂皮</span></td>'
        '<td><span class="kw3">既存の湿疹部位（顔面・上半身）</span></td>'
        '<td><span class="kw3">AD の既往・Tzanckで多核巨細胞</span></td></tr>'
        '<tr><td><span class="kw3">SSSS</span></td>'
        '<td><span class="kw3">びまん性紅斑→「面」で表皮剝離</span></td><td>乳幼児・間擦部から全身</td>'
        '<td><span class="kw3">口囲の放射状亀裂・Nikolsky陽性・表皮剝脱毒素（Dsg1切断）</span></td></tr>'
        '<tr><td><span class="kw">水痘</span></td><td>紅斑→水疱→痂皮が<span class="kw3">新旧混在</span></td>'
        '<td>全身に散在（体幹優位）</td><td>VZV初感染</td></tr>'
        '<tr><td>手足口病</td><td>楕円形の小水疱</td><td><span class="kw">手掌・足底・口腔</span></td><td>コクサッキーウイルス</td></tr>'
        '<tr><td><span class="kw">Stevens-Johnson症候群／TEN</span></td>'
        '<td>標的状紅斑→水疱・びらん・表皮壊死</td><td>粘膜（眼・口唇・外陰）＋全身</td>'
        '<td><span class="kw3">薬剤歴・粘膜疹・表皮全層壊死</span></td></tr>'
        '<tr><td>多形滲出性紅斑</td><td><span class="kw3">標的状紅斑（target lesion）</span></td>'
        '<td>四肢末梢優位・対称性</td><td><span class="kw">HSV感染・マイコプラズマが誘因</span></td></tr>'
        '<tr><td>種痘様水疱症</td><td>水疱→壊死→痘瘡様瘢痕</td><td><span class="kw">露光部</span></td>'
        '<td><span class="kw">EBV関連・慢性反復性</span></td></tr></table>'
        '<span class="kw3">粘膜疹の有無</span>も強力な分岐点になる。'
        '<span class="kw3">粘膜（眼・口唇・外陰）に強い病変があれば Stevens-Johnson症候群／TEN を最優先で考え、'
        '被疑薬の中止と全身管理（熱傷に準じた輸液・感染対策）を急ぐ</span>。'
        '<span class="kw4">SSSSでは粘膜疹が出ない</span>のが SJS/TEN との重要な鑑別点で、'
        'これは<span class="kw3">表皮剝脱毒素が標的とするDsg1が粘膜にはほとんど分布しない</span>（'
        '粘膜はDsg3が主体）という分子レベルの理由から説明できる（<span class="kw">Q.23</span>）。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">AD の既往＋発熱＋顔面の集簇性小水疱・びらん＝Kaposi水痘様発疹症</span>。写真がなくても即答できる型。<br>'
         '② 原因は<span class="kw3">HSV</span>（<span class="kw">Q.29・Q.48</span>）。診断は<span class="kw3">Tzanck試験</span>、治療は<span class="kw3">アシクロビル</span>。<br>'
         '③ <span class="kw3">SSSSは「面」で表皮がむける</span>・口囲の放射状亀裂・Nikolsky陽性・<span class="kw4">粘膜疹なし</span>。<br>'
         '④ <span class="kw3">多形滲出性紅斑＝標的状紅斑</span>で四肢末梢優位。HSV・マイコプラズマが誘因。<br>'
         '⑤ <span class="kw3">粘膜疹が強ければSJS/TEN</span>——被疑薬中止と全身管理を急ぐ。<br>'
         '⑥ <span class="kw3">種痘様水疱症＝EBV関連・露光部・瘢痕</span>。')),

Q('101C-14', 93, [('bh', '必修')],
  '<strong><span class="kw">膨疹</span>の特徴はどれか。</strong>',
  [('a', '浮　腫', True, '<span class="kw3">膨疹の実体は真皮上層（乳頭層）の浮腫</span>である。'
                     '肥満細胞から放出されたヒスタミンが血管透過性を亢進させ、血漿が真皮に漏れて扁平に隆起する。'
                     '<span class="kw3">浮腫が引けば24時間以内に跡形なく消える</span>（<span class="kw">Q.31・Q.33</span>）。'),
   ('b', '苔癬化', False, '<span class="kw4">慢性の掻破・摩擦により表皮が肥厚し、皮野・皮溝が粗大化した状態</span>。'
                     'アトピー性皮膚炎の慢性期など<span class="kw4">湿疹の続発疹</span>であり、'
                     '一過性の膨疹とは時間軸も病変の層もまったく異なる。'),
   ('c', '色素沈着', False, '<span class="kw4">膨疹は跡を残さない</span>。'
                     '色素沈着を残すのは<span class="kw">固定薬疹・扁平苔癬・炎症後色素沈着</span>など'
                     '<span class="kw4">表皮基底層が障害される疾患（界面皮膚炎）</span>で、'
                     'メラニンが真皮へ落ちて長く残る（<span class="kw">Q.20・Q.33</span>）。'),
   ('d', '水疱形成', False, '<span class="kw4">膨疹では表皮に変化が起こらない</span>ため水疱はできない。'
                     '水疱を作るのは<span class="kw">湿疹（表皮の海綿状態）・天疱瘡・類天疱瘡・ヘルペス群</span>である。'),
   ('e', '鱗屑付着', False, '<span class="kw4">鱗屑は角層の異常が表面に現れたもの</span>で、表皮病変のサインである。'
                     '<span class="kw4">膨疹は真皮の病変なので表面はつるつるのまま</span>で、鱗屑は付かない（<span class="kw">Q.35</span>）。')],
  '膨疹の実体は真皮上層の浮腫。表皮に変化がないため水疱も鱗屑もできず、消退後に色素沈着も苔癬化も残さない。',
  patho=('💧 必修で問われる「膨疹＝浮腫」',
         '本問は<span class="kw3">膨疹の定義を一語で答えさせる必修問題</span>である。'
         '<span class="kw3">膨疹〈wheal〉＝真皮上層の一過性の浮腫による扁平隆起</span>——'
         'この定義の中心語がそのまま答えになる。<br>'
         '成り立ちを機序で追うと、他の4肢がなぜ除外されるかも同時に分かる。'
         '<span class="kw3">肥満細胞が脱顆粒してヒスタミンを放出</span>→'
         '<span class="kw3">H1受容体を介して細静脈の透過性が亢進</span>→'
         '<span class="kw3">血漿が真皮乳頭層に漏れ出て組織が膨らむ＝浮腫</span>→'
         'これが肉眼的に<span class="kw3">扁平に隆起した皮疹（膨疹）</span>として見える。'
         '同時に<span class="kw3">血管拡張による周囲の発赤（紅暈）</span>と'
         '<span class="kw3">知覚神経C線維の刺激による瘙痒</span>が起こる。'
         '<span class="kw3">Lewisの三重反応</span>と呼ばれるこの一連が蕁麻疹の皮疹の全体像である（<span class="kw">Q.22</span>）。<br>'
         '<span class="kw3">決定的なのは「表皮がまったく巻き込まれない」こと</span>である。'
         '病変が真皮にとどまるため、'
         '<span class="kw3">①表皮の角層が乱れないので鱗屑が出ない</span>、'
         '<span class="kw3">②表皮内・表皮下に裂隙ができないので水疱にならない</span>、'
         '<span class="kw3">③基底層が壊れないのでメラニンが真皮に落ちず、色素沈着を残さない</span>、'
         '<span class="kw3">④表皮が増殖しないので苔癬化しない</span>。'
         'つまり<span class="kw3">誤答肢b〜eはすべて「表皮の変化」であり、'
         '膨疹が真皮の病変である以上、原理的に起こりえない</span>。'
         '<span class="kw3">1つの原理から4つの肢が同時に落ちる</span>——'
         'これが定義から解く問題の強みである。<br>'
         '<span class="kw4">臨床で膨疹らしくない所見を見たときの意味</span>も押さえておく。'
         '<span class="kw4">膨疹が24時間以上持続する、消退後に紫斑や色素沈着を残す、'
         '痒みより痛み・灼熱感が強い、発熱・関節痛を伴う</span>——'
         'これらは<span class="kw3">蕁麻疹様血管炎</span>を示唆し、'
         '<span class="kw3">生検で白血球破砕性血管炎を確認し、'
         'SLE・シェーグレン症候群・クリオグロブリン血症などの基礎疾患を検索する</span>。'
         '<span class="kw3">「跡が残る膨疹は膨疹ではない」</span>と覚えておくとよい。'),
  deep=('📌 原発疹の定義を一覧で固める（必修頻出）',
        '<table class="tb"><tr><th>原発疹</th><th>定義</th><th>病変の層</th></tr>'
        '<tr><td>斑（紅斑・紫斑・色素斑・白斑）</td><td>隆起・陥凹を伴わない色調の変化</td><td>真皮（血管・色素）</td></tr>'
        '<tr><td><span class="kw3">膨疹</span></td>'
        '<td><span class="kw3">一過性の浮腫による扁平隆起（24時間以内に消退）</span></td>'
        '<td><span class="kw3">真皮上層</span></td></tr>'
        '<tr><td>丘疹</td><td>直径1cm未満の隆起</td><td>表皮／真皮</td></tr>'
        '<tr><td>結節・腫瘤</td><td>1cm以上／さらに大きい隆起</td><td>真皮〜皮下</td></tr>'
        '<tr><td>水疱・小水疱</td><td>漿液を入れた隆起</td><td><span class="kw3">表皮内／表皮下</span></td></tr>'
        '<tr><td>膿疱</td><td>膿を入れた隆起</td><td>表皮内</td></tr>'
        '<tr><td>囊腫</td><td>内容物を有する袋状の病変</td><td>真皮〜皮下</td></tr></table>'
        '<table class="tb"><tr><th>続発疹</th><th>定義</th></tr>'
        '<tr><td>鱗屑・落屑</td><td>角層が厚く残る／剝がれ落ちる</td></tr>'
        '<tr><td>痂皮</td><td>滲出液・血液・膿が乾燥固着したもの</td></tr>'
        '<tr><td><span class="kw3">びらん</span></td><td><span class="kw3">表皮までの欠損＝瘢痕を残さない</span></td></tr>'
        '<tr><td><span class="kw3">潰瘍</span></td><td><span class="kw3">真皮以深に及ぶ欠損＝瘢痕を残す</span></td></tr>'
        '<tr><td>亀裂</td><td>線状の深い裂け目</td></tr>'
        '<tr><td><span class="kw3">苔癬化</span></td><td><span class="kw3">慢性掻破による表皮肥厚と皮野の粗大化</span></td></tr>'
        '<tr><td>萎縮・瘢痕</td><td>組織の菲薄化／欠損の線維性修復</td></tr></table>'
        '<span class="kw3">必修対策としては「びらんと潰瘍」「膨疹と丘疹」の2組が最頻出</span>である。'
        '<span class="kw3">びらん＝表皮まで＝瘢痕なし／潰瘍＝真皮以深＝瘢痕あり</span>、'
        '<span class="kw3">膨疹＝一過性で消える／丘疹＝持続する</span>——'
        'いずれも<span class="kw3">「深さ」と「時間」</span>という同じ2軸で区別できる。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">膨疹の特徴＝真皮上層の浮腫</span>。必修頻出。<br>'
         '② <span class="kw3">表皮に変化がない</span>ので、'
         '<span class="kw3">水疱・鱗屑・色素沈着・苔癬化はいずれも起こらない</span>。<br>'
         '③ <span class="kw3">24時間以内に跡形なく消退する</span>のが定義（<span class="kw">Q.31・Q.36</span>）。<br>'
         '④ 機序は<span class="kw3">肥満細胞のヒスタミン→血管透過性亢進・血管拡張・瘙痒（Lewisの三重反応）</span>。<br>'
         '⑤ <span class="kw4">跡を残す膨疹・24時間以上続く膨疹は蕁麻疹様血管炎</span>を疑って生検する。<br>'
         '⑥ <span class="kw3">びらん＝瘢痕なし／潰瘍＝瘢痕あり</span>も必修の定番。')),

Q('101F-10', 94, [],
  '<strong><span class="kw">Kaposi 水痘様発疹症</span>の病因はどれか。</strong>',
  [('a', 'EB ウイルス', False, '<span class="kw4">伝染性単核球症・上咽頭癌・Burkittリンパ腫・種痘様水疱症</span>の原因。'),
   ('b', 'ヒト乳頭腫ウイルス', False, '<span class="kw">HPV</span>。'
                     '<span class="kw4">尋常性疣贅・扁平疣贅・尖圭コンジローマ・子宮頸癌</span>の原因で、'
                     '<span class="kw4">角化性の増殖性病変をつくり、水疱は形成しない</span>。'),
   ('c', 'サイトメガロウイルス', False, '<span class="kw4">先天感染（難聴・小頭症・肝脾腫）や免疫不全者の網膜炎・肺炎・腸炎</span>。皮膚の水疱症をきたす病原体ではない。'),
   ('d', '単純ヘルペスウイルス', True, '<span class="kw3">Kaposi水痘様発疹症の原因はHSV-1（まれにHSV-2）</span>。'
                     '<span class="kw3">アトピー性皮膚炎などの湿疹病変にHSVが広範に播種したもの</span>で、'
                     '<span class="kw4">「水痘様」という病名はあくまで見た目の形容であり、水痘ウイルスは無関係</span>である。'),
   ('e', '水痘・帯状疱疹ウイルス', False, '<span class="kw4">病名に「水痘様」とあるため最も引っかかりやすい肢</span>。'
                     'VZVは<span class="kw">水痘（全身に新旧混在）と帯状疱疹（片側性・デルマトーム一致・疼痛）</span>を起こすが、'
                     'Kaposi水痘様発疹症とは無関係である。')],
  'Kaposi水痘様発疹症の病因は単純ヘルペスウイルス。「水痘様」は見た目の形容にすぎず、水痘・帯状疱疹ウイルスではない。',
  patho=('⚠️ 病名に騙されない——「水痘様」だがHSV',
         '<span class="kw3">Kaposi水痘様発疹症</span>の原因ウイルスは'
         '<span class="kw3">単純ヘルペスウイルス〈HSV〉</span>である。'
         '本章で<span class="kw3">Q.29・Q.41・Q.42・Q.46</span>と繰り返し出題されていることからも、'
         'この一点がいかに重視されているかが分かる。'
         '<span class="kw3">国試が繰り返し問うのは、それだけ間違えやすいから</span>であり、'
         '間違えやすい理由は<span class="kw4">病名に「水痘様」という語が入っている</span>ことに尽きる。<br>'
         'この病名は<span class="kw3">「水痘に似た見た目の発疹症」という形態の記述</span>であって、'
         '<span class="kw4">原因ウイルスを指してはいない</span>。'
         '実際、集簇した小水疱が全身へ広がる様子は水痘に似ており、'
         'ウイルス学が未発達だった時代に付けられた名前がそのまま残っている。'
         '英語名の<span class="kw3">eczema herpeticum（＝ヘルペス性の湿疹）</span>のほうが'
         '病態を正確に表しており、こちらで覚えるほうが混乱しない。<br>'
         '<span class="kw3">医学には「病名が原因を誤って示す」例がいくつかある</span>ので、'
         'まとめて整理しておくと得点源になる。'
         '<span class="kw3">Kaposi水痘様発疹症＝HSV（VZVではない）</span>、'
         '<span class="kw3">Kaposi肉腫＝HHV-8（Kaposi水痘様発疹症とは全く別）</span>、'
         '<span class="kw3">伝染性紅斑（りんご病）＝ヒトパルボウイルスB19</span>、'
         '<span class="kw3">突発性発疹＝HHV-6/7</span>、'
         '<span class="kw3">帯状疱疹と単純疱疹は別のウイルス</span>。'
         'とくに<span class="kw3">「Kaposi」が付く2疾患</span>は'
         '人名由来で共通しているだけの無関係な疾患であり、頻出の引っかけである。<br>'
         '<span class="kw3">臨床的にも、この区別は治療に直結する</span>。'
         '<span class="kw3">HSVもVZVもアシクロビルが有効</span>という点では共通するが、'
         '<span class="kw3">VZV（帯状疱疹・水痘）にはHSVより高用量が必要</span>である。'
         'また<span class="kw3">Kaposi水痘様発疹症では基礎にあるアトピー性皮膚炎の管理が再発予防の本体</span>になる一方、'
         '<span class="kw3">帯状疱疹では帯状疱疹後神経痛の予防とワクチン</span>が課題になるなど、'
         'その後のマネジメントが大きく異なる。'),
  deep=('📌 皮膚科のウイルス感染症を病原体で整理する',
        '<table class="tb"><tr><th>ウイルス</th><th>皮膚疾患</th><th>キーワード</th></tr>'
        '<tr><td><span class="kw3">HSV-1/2</span></td>'
        '<td><span class="kw3">口唇/性器ヘルペス・Kaposi水痘様発疹症</span>・ヘルペス性歯肉口内炎・ヘルペス性瘭疽</td>'
        '<td><span class="kw3">集簇性小水疱・Tzanckで多核巨細胞・再発性</span></td></tr>'
        '<tr><td><span class="kw3">VZV</span></td><td>水痘・帯状疱疹</td>'
        '<td><span class="kw3">水痘＝新旧混在／帯状疱疹＝片側デルマトーム・神経痛</span></td></tr>'
        '<tr><td>EBV</td><td>伝染性単核球症・<span class="kw">種痘様水疱症</span>・上咽頭癌</td>'
        '<td>異型リンパ球・アンピシリン疹</td></tr>'
        '<tr><td>CMV</td><td>先天感染・免疫不全者の臓器病変</td><td>—</td></tr>'
        '<tr><td>HHV-6/7</td><td><span class="kw3">突発性発疹</span></td>'
        '<td>解熱とともに発疹・<span class="kw">DIHSで再活性化</span></td></tr>'
        '<tr><td><span class="kw3">HHV-8</span></td><td><span class="kw3">Kaposi肉腫</span></td>'
        '<td><span class="kw4">AIDS指標疾患・紫紅色の局面/結節</span></td></tr>'
        '<tr><td><span class="kw">HPV</span></td><td>尋常性疣贅・扁平疣贅・尖圭コンジローマ</td>'
        '<td><span class="kw4">角化性の増殖・水疱を作らない</span></td></tr>'
        '<tr><td>伝染性軟属腫ウイルス</td><td><span class="kw">伝染性軟属腫（みずいぼ）</span></td>'
        '<td>中心臍窩・ポックスウイルス科（<span class="kw">Q.2</span>）</td></tr>'
        '<tr><td>ヒトパルボウイルスB19</td><td><span class="kw">伝染性紅斑（りんご病）</span></td>'
        '<td>両頰の紅斑・<span class="kw">胎児水腫・赤芽球癆</span></td></tr>'
        '<tr><td>コクサッキーウイルス</td><td>手足口病・ヘルパンギーナ</td><td>手掌足底・口腔</td></tr>'
        '<tr><td>麻疹／風疹ウイルス</td><td>麻疹／風疹</td><td><span class="kw">Koplik斑／耳後部リンパ節腫脹</span></td></tr></table>'
        '<span class="kw3">抗ヘルペスウイルス薬</span>も整理しておく。'
        '<span class="kw3">アシクロビル・バラシクロビル（プロドラッグ）・ファムシクロビル</span>が基本で、'
        '<span class="kw3">ウイルスのチミジンキナーゼでリン酸化されて初めて活性化する</span>ため'
        '感染細胞に選択的に働く。'
        '<span class="kw4">腎排泄なので腎機能障害では減量が必要で、'
        '高用量・脱水下では急性腎障害や意識障害（アシクロビル脳症）</span>をきたす点に注意する。'
        '<span class="kw3">アメナメビル</span>はヘリカーゼ・プライマーゼ阻害薬で'
        '<span class="kw">腎機能による用量調節が不要</span>という特徴がある。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Kaposi水痘様発疹症の病因＝単純ヘルペスウイルス〈HSV〉</span>。'
         '<span class="kw4">「水痘様」はVZVを意味しない</span>。<br>'
         '② 英語名<span class="kw3">eczema herpeticum</span>で覚えると混乱しない。<br>'
         '③ <span class="kw3">Kaposi水痘様発疹症＝HSV／Kaposi肉腫＝HHV-8</span>——人名が同じだけの別疾患。<br>'
         '④ <span class="kw4">HPVは疣贅（角化性増殖）で水疱を作らない</span>。<br>'
         '⑤ 治療は<span class="kw3">アシクロビル等</span>。'
         '<span class="kw4">腎排泄のため腎機能で減量、アシクロビル脳症に注意</span>。<br>'
         '⑥ 本章では<span class="kw">Q.29・Q.41・Q.42・Q.46</span>と5問が同一疾患——それだけ頻出。')),
]

QUESTIONS += [

Q('100A-57', 88, [],
  '28歳の女性。<span class="kw">悪心、嘔吐および蕁麻疹</span>を主訴に来院した。'
  '<span class="kw">昨夜青みの魚を食べた後</span>、悪心と嘔吐とが出現し、全身に蕁麻疹も出現した。'
  '意識は清明。体温37.2℃。脈拍68/分、整。<span class="kw">血圧120/60mmHg</span>。胸部に異常はない。'
  '腹部は軽度膨隆し、右肋骨弓下に圧痛を認める。<span class="kw">全身に小豆大の膨疹を認め、一部癒合している</span>。'
  '尿所見：蛋白（－）、糖（－）、沈渣に異常はない。糞便検査：潜血（－）。'
  '血液所見：赤沈18mm/1時間、赤血球400万、Hb 12.6g/dl、'
  '白血球8,600（好中球59％、<span class="kw">好酸球4％</span>、好塩基球1％、単球10％、リンパ球26％）、血小板39万。'
  '血液生化学所見：総蛋白7.9g/dl、尿素窒素9mg/dl、クレアチニン0.5mg/dl、AST 12U/L、ALT 6U/L。CRP 0.5mg/dl。<br>'
  '<strong>この患者の治療薬として適切なのはどれか。<span class="kw">2つ選べ</span>。</strong>',
  [('a', '抗菌薬', False, '<span class="kw4">ヒスタミン食中毒は「細菌に感染した」のではなく、'
                     '魚の保存中に細菌がすでに作ったヒスタミンを摂取した中毒</span>である。'
                     '体内で細菌が増えているわけではないので<span class="kw4">抗菌薬は無効</span>。'
                     '発熱37.2℃・CRP 0.5と炎症反応も乏しい。'),
   ('b', '免疫抑制薬', False, '<span class="kw4">自己免疫疾患や移植拒絶に用いる薬</span>で、効果発現にも時間がかかる。'
                     '数時間で自然軽快する急性の中毒に用いる薬ではない。'),
   ('c', '抗ヒスタミン薬', True, '<span class="kw3">病態そのものが「ヒスタミンの過剰」なので、H1受容体拮抗薬が最も理にかなった治療</span>。'
                     '膨疹・瘙痒・紅潮を速やかに抑える。'
                     '<span class="kw3">悪心・嘔吐にはH2受容体拮抗薬の併用</span>も行われる。'),
   ('d', '副腎皮質ステロイド', True, '<span class="kw3">症状が全身性で強い場合に短期で併用する</span>。'
                     '本例は<span class="kw3">全身の膨疹が癒合し、悪心・嘔吐という消化器症状も伴う</span>ため適応となる。'
                     '（効果発現には数時間を要するので、あくまで抗ヒスタミン薬との併用である。）'),
   ('e', '非ステロイド性抗炎症薬', False, '<span class="kw4">NSAIDsは肥満細胞を直接刺激して蕁麻疹を悪化させうる（アスピリン過敏）</span>。'
                     '<span class="kw4">FDEIA など他のアレルギー反応でも閾値を下げる増悪因子</span>であり、'
                     'この病態には投与すべきでない。')],
  '青みの魚（ヒスチジンが多い赤身魚）を食べた後の全身の膨疹・悪心・嘔吐＝ヒスタミン食中毒。治療は抗ヒスタミン薬を主体に、症状が強ければ副腎皮質ステロイドを併用する。',
  patho=('🐟 ヒスタミン食中毒——アレルギーではない「中毒」',
         '<span class="kw3">ヒスタミン食中毒〈scombroid poisoning〉</span>は'
         '<span class="kw3">アレルギーではなく、化学物質による中毒</span>である。'
         'ここを取り違えないことが本問の出発点になる。<br>'
         '成り立ちはこうである。'
         '<span class="kw3">マグロ・カツオ・サバ・サンマ・イワシといった赤身魚（青魚）には'
         'アミノ酸のヒスチジンが多く含まれる</span>。'
         'これらの魚を<span class="kw3">常温で長く置くと、魚に付着したヒスタミン産生菌'
         '（Morganella morganii など）がヒスチジン脱炭酸酵素でヒスチジンをヒスタミンに変える</span>。'
         'このヒスタミンを<span class="kw3">大量に摂取すると、'
         '食べた本人の肥満細胞とは無関係に、外から入ったヒスタミンが直接H1受容体に働いて症状を起こす</span>。'
         '<span class="kw3">IgEも肥満細胞も介さないので「アレルギーではない」</span>し、'
         '<span class="kw3">初めてその魚を食べた人にも、感作のない人にも起こる</span>。<br>'
         '<span class="kw4">臨床上きわめて重要な性質が2つ</span>ある。'
         '<span class="kw4">①ヒスタミンは熱に安定なので、加熱調理しても分解されない</span>——'
         '「火を通したから大丈夫」は誤りである。'
         '<span class="kw4">②同じ料理を食べた複数人が同時に発症する</span>——'
         '食物アレルギーなら特定の個人にしか起こらないので、'
         '<span class="kw3">「集団発生」はヒスタミン食中毒を強く示唆する</span>。<br>'
         '症状は<span class="kw3">摂取後30分〜1時間で急速に出現</span>し、'
         '<span class="kw3">顔面の紅潮・熱感・頭痛・全身の膨疹・瘙痒</span>に加え、'
         '<span class="kw3">悪心・嘔吐・腹痛・下痢</span>といった消化器症状を伴う。'
         '通常は<span class="kw3">数時間〜半日で自然軽快し予後は良好</span>である。'
         '本例が<span class="kw3">血圧120/60と保たれ、意識清明で、好酸球も4%と正常</span>であることは、'
         'アナフィラキシーではなく典型的な経過であることを示している。<br>'
         '治療は病態から一直線に決まる。'
         '<span class="kw3">過剰なヒスタミンが原因なのだから、抗ヒスタミン薬〈H1拮抗薬〉が主役</span>で、'
         '<span class="kw3">消化器症状にはH2拮抗薬を併用</span>することもある。'
         '<span class="kw3">症状が全身性で強い場合には副腎皮質ステロイドを短期併用</span>する。'
         '<span class="kw4">血圧低下・喉頭浮腫・呼吸困難があればアナフィラキシーに準じてアドレナリン筋注</span>となるが、'
         '本例はその段階にはない。'
         '<span class="kw3">予防は「鮮度管理＝低温保存」に尽きる</span>——'
         'いったん生成したヒスタミンは冷やしても加熱しても減らないため、'
         '<span class="kw3">最初から作らせないことが唯一の対策</span>である。'),
  deep=('📌 「アレルギーに見えて違うもの」を並べる',
        '<table class="tb"><tr><th>病態</th><th>機序</th><th>見分けるポイント</th></tr>'
        '<tr><td><span class="kw3">ヒスタミン食中毒</span></td>'
        '<td><span class="kw3">外から摂取したヒスタミン（IgE非介在）</span></td>'
        '<td><span class="kw3">赤身魚・加熱で防げない・集団発生・初回でも起こる</span></td></tr>'
        '<tr><td>アニサキスアレルギー</td><td>IgE介在（寄生虫抗原）</td>'
        '<td>魚介摂取後の蕁麻疹＋<span class="kw">心窩部痛</span>。内視鏡で虫体</td></tr>'
        '<tr><td>食物アレルギー</td><td><span class="kw3">IgE介在</span></td>'
        '<td>特定の個人のみ・<span class="kw">感作が必要</span>・特異的IgE陽性</td></tr>'
        '<tr><td><span class="kw">造影剤・バンコマイシン</span></td>'
        '<td>肥満細胞の直接刺激（非IgE）</td>'
        '<td><span class="kw">red man症候群</span>＝投与速度依存。減速で軽快</td></tr>'
        '<tr><td><span class="kw">アスピリン喘息・NSAIDs過敏</span></td>'
        '<td>COX阻害→ロイコトリエン増加（非IgE）</td>'
        '<td>鼻茸・慢性副鼻腔炎を合併。<span class="kw4">全てのNSAIDsで起こる</span></td></tr>'
        '<tr><td>遺伝性血管性浮腫〈HAE〉</td>'
        '<td><span class="kw3">C1インヒビター欠損→ブラジキニン</span></td>'
        '<td><span class="kw4">膨疹・瘙痒を伴わない浮腫。抗ヒスタミン薬もアドレナリンも無効</span></td></tr></table>'
        '<span class="kw3">魚介摂取後の蕁麻疹</span>を見たときの実践的な鑑別を整理しておく。'
        '<span class="kw3">①同席者も発症した／加熱調理済み／赤身魚 → ヒスタミン食中毒</span>。'
        '<span class="kw3">②本人だけ／強い心窩部痛を伴う／生の魚介 → アニサキス</span>'
        '（内視鏡で虫体を摘出すれば速やかに軽快する）。'
        '<span class="kw3">③本人だけ／繰り返す／特異的IgE陽性 → 食物アレルギー</span>。'
        '<span class="kw3">④食後に運動した → FDEIA</span>（<span class="kw">Q.45</span>）。'
        '<span class="kw4">病歴の「誰が」「何を」「その後どうしたか」の3点で、検査をする前に大半が絞れる</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">ヒスタミン食中毒＝赤身魚（青魚）のヒスチジン→細菌がヒスタミンに変換</span>。'
         '<span class="kw3">アレルギーではない</span>。<br>'
         '② <span class="kw4">加熱しても分解されない</span>／<span class="kw3">集団発生する</span>／初回摂取でも起こる。<br>'
         '③ 症状は摂取後<span class="kw3">30分〜1時間で紅潮・膨疹・頭痛・悪心嘔吐</span>。数時間で軽快し予後良好。<br>'
         '④ 治療は<span class="kw3">抗ヒスタミン薬＋（強ければ）副腎皮質ステロイド</span>。'
         '<span class="kw4">抗菌薬は無効</span>。<br>'
         '⑤ <span class="kw4">NSAIDsは蕁麻疹を悪化させうる</span>ので避ける。<br>'
         '⑥ 予防は<span class="kw3">鮮度管理（低温保存）</span>のみ——できてしまったヒスタミンは除去できない。')),

Q('100E-30', 95, [('bh', '必修')],
  '<strong>アトピー性皮膚炎に<span class="kw4">特徴的でない</span>のはどれか。</strong>',
  [('a', '瘙　痒', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">瘙痒はAD の診断3要件の1つ</span>で必発症状。'
                     '掻破がバリアを壊してさらに炎症を強める（itch-scratch cycle）。'),
   ('b', '虹彩炎', True, '<span class="kw3">特徴的でない＝これが正解</span>。'
                     '<span class="kw3">虹彩炎（前部ぶどう膜炎）は Behçet病・サルコイドーシス・強直性脊椎炎・'
                     '若年性特発性関節炎などでみられる</span>もので、AD の眼合併症ではない。'
                     '<span class="kw3">AD の眼合併症は白内障・裂孔原性網膜剝離・円錐角膜</span>である（<span class="kw">Q.32・Q.37・Q.40</span>）。'),
   ('c', '白内障', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">アトピー白内障はAD の眼合併症のうち最も頻度が高く、定期スクリーニングの対象</span>。'
                     '若年発症で前囊下・後囊下に混濁を生じる。'),
   ('d', '対称性皮疹', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">AD の皮疹は左右対称性に分布する</span>のが原則で、'
                     '<span class="kw4">左右非対称なら接触皮膚炎・白癬・帯状疱疹など他疾患を疑う</span>（<span class="kw">Q.53</span>）。'),
   ('e', '血清IgE 増加', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">Th2優位の炎症でIL-4・IL-13がIgE産生を促す</span>ため高値になる（<span class="kw">Q.51・Q.52</span>）。'
                     '末梢血好酸球増多も伴う。')],
  'アトピー性皮膚炎の特徴は瘙痒・左右対称性の皮疹・血清IgE増加・白内障（眼合併症）。虹彩炎はBehçet病やサルコイドーシスの所見でADには特徴的でない。',
  patho=('🔎 「AD らしさ」を4項目で確認する',
         '本問は必修らしく、<span class="kw3">AD の代表的な特徴を1つずつ確認し、'
         '別疾患の所見を1つだけ紛れ込ませる</span>形式である。'
         '正しい4肢を確実に「正しい」と判断できることが、'
         '誤りの1肢を見抜く力になる。<br>'
         '<span class="kw3">①瘙痒</span>——AD の診断は'
         '<span class="kw3">「瘙痒」「特徴的な皮疹と分布」「慢性・反復性の経過」</span>の3要件で行う。'
         '<span class="kw3">瘙痒はその筆頭</span>であり、'
         '痒みのない湿疹様病変ではまず診断を疑う。'
         '<span class="kw3">IL-31</span>が痒みを直接引き起こすサイトカインとして知られる。<br>'
         '<span class="kw3">②対称性皮疹</span>——'
         'AD は内因性の炎症性疾患なので<span class="kw3">左右対称に分布する</span>。'
         '乳児期は顔・頭、幼小児期は肘窩・膝窩などの<span class="kw3">四肢屈側</span>、'
         '成人期は上半身優位と部位は年齢で動くが、'
         '<span class="kw3">どの時期でも左右対称であることは変わらない</span>（<span class="kw">Q.53</span>）。<br>'
         '<span class="kw3">③血清IgE増加</span>——'
         '<span class="kw3">Th2細胞が産生するIL-4・IL-13がB細胞のクラススイッチを促し、IgEが増える</span>。'
         '同時に<span class="kw3">末梢血好酸球も増加</span>する（<span class="kw">Q.51</span>）。'
         'ただしこれらは<span class="kw3">支持所見であって診断必須ではない</span>——'
         '<span class="kw4">IgEが正常なAD（内因性AD）も存在する</span>点は知っておきたい。'
         '重症度と相関して動く指標としては<span class="kw3">血清TARC〈CCL17〉</span>が有用である。<br>'
         '<span class="kw3">④白内障</span>——'
         '眼周囲の掻破・叩打を背景とする<span class="kw3">AD の代表的な眼合併症</span>である。'
         '<span class="kw3">白内障・裂孔原性網膜剝離・円錐角膜</span>の3つを一組で覚える（<span class="kw">Q.32・Q.37・Q.40</span>）。<br>'
         'これに対し<span class="kw3">虹彩炎（虹彩毛様体炎＝前部ぶどう膜炎）</span>は、'
         '<span class="kw3">眼内の免疫学的炎症</span>であって外力とは無関係である。'
         '<span class="kw3">Behçet病（前房蓄膿を伴う）・サルコイドーシス・強直性脊椎炎・'
         '若年性特発性関節炎・Vogt-小柳-原田病</span>といった'
         '<span class="kw3">全身性の炎症性・自己免疫性疾患</span>で問題になる。'
         '<span class="kw3">「AD の眼合併症は外力によるもの、虹彩炎は免疫によるもの」</span>と'
         '機序で切り分ければ確実に選べる。'),
  deep=('📌 AD の診断基準（日本皮膚科学会）と、ぶどう膜炎の鑑別',
        '<table class="tb"><tr><th>AD の診断3要件</th><th>内容</th></tr>'
        '<tr><td><span class="kw3">①瘙痒</span></td><td>必発</td></tr>'
        '<tr><td><span class="kw3">②特徴的な皮疹と分布</span></td>'
        '<td>湿疹病変（急性＝紅斑・丘疹・漿液性丘疹／慢性＝苔癬化・痒疹）が'
        '<span class="kw3">左右対称</span>に。<span class="kw">乳児期＝顔頭／幼小児期＝四肢屈側／成人期＝上半身</span></td></tr>'
        '<tr><td><span class="kw3">③慢性・反復性の経過</span></td>'
        '<td><span class="kw3">乳児は2か月以上、それ以外は6か月以上</span></td></tr>'
        '<tr><td colspan="2"><span class="kw">参考所見</span>: 家族歴・アトピー素因（喘息・鼻炎・結膜炎）、'
        '<span class="kw">血清IgE高値・好酸球増多・TARC上昇</span>、'
        '<span class="kw">Dennie-Morgan 皺襞・Hertoghe徴候（眉毛外側1/3の脱落）・白色皮膚描記症</span></td></tr></table>'
        '<table class="tb"><tr><th>眼の炎症</th><th>背景疾患</th></tr>'
        '<tr><td><span class="kw3">虹彩炎・前部ぶどう膜炎</span></td>'
        '<td><span class="kw3">Behçet病（前房蓄膿）・サルコイドーシス・強直性脊椎炎（HLA-B27）・'
        '若年性特発性関節炎・Vogt-小柳-原田病</span></td></tr>'
        '<tr><td>強膜炎</td><td>関節リウマチ・多発血管炎性肉芽腫症</td></tr>'
        '<tr><td>結膜炎</td><td>アレルギー性・<span class="kw">春季カタル（AD に合併しうる）</span>・Stevens-Johnson症候群</td></tr>'
        '<tr><td><span class="kw3">白内障・網膜剝離・円錐角膜</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎（掻破・叩打による外力）</span></td></tr></table>'
        '<span class="kw3">AD に合併しうる眼の「炎症」</span>としては'
        '<span class="kw3">アトピー性角結膜炎・春季カタル</span>があり、'
        '<span class="kw">眼瞼結膜の巨大乳頭・角膜のシールド潰瘍</span>をきたす。'
        '<span class="kw4">これは結膜の炎症であって、虹彩（ぶどう膜）の炎症ではない</span>——'
        'この区別まで押さえておくと、選択肢が「アレルギー性結膜炎」に置き換わった応用問題にも対応できる。'),
  point=('🎯 国試ポイント',
         '① AD に特徴的＝<span class="kw3">瘙痒・左右対称性の皮疹・血清IgE増加・（合併症としての）白内障</span>。<br>'
         '② <span class="kw4">虹彩炎（前部ぶどう膜炎）はAD の所見ではない</span>——'
         '<span class="kw3">Behçet病・サルコイドーシス・強直性脊椎炎</span>を考える。<br>'
         '③ AD の眼合併症は<span class="kw3">外力によるもの（白内障・裂孔原性網膜剝離・円錐角膜）</span>。<br>'
         '④ 診断3要件＝<span class="kw3">瘙痒・特徴的な皮疹と分布・慢性反復性の経過（乳児2か月／他6か月以上）</span>。<br>'
         '⑤ <span class="kw4">IgE正常のAD（内因性AD）もある</span>——IgEは支持所見であり必須ではない。<br>'
         '⑥ AD に合併する眼の炎症は<span class="kw3">角結膜炎・春季カタル</span>（結膜であって虹彩ではない）。')),

Q('98A-52', None, [],
  '6歳の男児。<span class="kw">かゆみを伴う皮疹</span>のため来院した。'
  '<span class="kw">皮疹は数か月前から頭部と四肢屈曲部とに繰り返し出現している</span>。'
  '<span class="kw">母親にアレルギー性鼻炎がある</span>。体温36.5℃。血圧102/60mmHg。胸部は打聴診で異常を認めない。'
  '<span class="kw">頸部と両側の肘屈側とに落屑を伴う皮疹</span>を認める。尿所見：蛋白（－）、糖（－）。'
  '血液所見：赤血球420万、Hb 14.3g/dl、白血球7,300、血小板18万。'
  '血液生化学所見：総蛋白7.6g/dl、AST 28U/L（基準40以下）、ALT 30U/L（基準35以下）。<br>'
  '<strong>この疾患でみられる検査所見はどれか。<span class="kw">2つ選べ</span>。</strong>',
  [('a', '好酸球増加', True, '<span class="kw3">Th2型炎症でIL-5が好酸球の産生・遊走・生存延長を促す</span>ため、'
                     '<span class="kw3">末梢血好酸球が増加</span>する。'
                     '重症度とおおむね相関し、皮膚組織にも好酸球が浸潤する。'),
   ('b', 'リンパ球減少', False, '<span class="kw4">AD ではリンパ球は減少しない</span>。'
                     'リンパ球減少をきたすのは<span class="kw">HIV感染・ステロイド全身投与・粟粒結核・SLE・放射線被曝</span>など。'),
   ('c', 'IgE 高値', True, '<span class="kw3">IL-4・IL-13がB細胞のIgEへのクラススイッチを促す</span>ため'
                     '<span class="kw3">血清総IgEが高値</span>となり、'
                     'ダニ・ハウスダスト等の<span class="kw3">抗原特異的IgEも陽性</span>になることが多い（<span class="kw">Q.52</span>）。'),
   ('d', '血清補体価低値', False, '<span class="kw4">免疫複合体が補体を消費するⅢ型アレルギーの所見</span>。'
                     '<span class="kw">SLE・急性糸球体腎炎・クリオグロブリン血症・蕁麻疹様血管炎</span>などでみられる。AD では補体は正常。'),
   ('e', 'リウマトイド因子陽性', False, '<span class="kw4">IgGのFc部分に対する自己抗体</span>で、'
                     '<span class="kw">関節リウマチ・Sjögren症候群・慢性感染症</span>などで陽性になる。AD の所見ではない。')],
  '数か月続く瘙痒性皮疹が頭部と四肢屈曲部に反復、家族にアレルギー性鼻炎＝アトピー性皮膚炎。検査所見は末梢血好酸球増加と血清IgE高値。',
  patho=('🧪 AD の検査所見はTh2炎症から導ける',
         '本例は<span class="kw3">6歳・数か月続く瘙痒性皮疹・頭部と四肢屈曲部という好発部位・'
         '反復性の経過・母親のアレルギー性鼻炎（アトピー素因の家族歴）</span>という'
         'アトピー性皮膚炎の典型例である。'
         '<span class="kw3">「頸部と両側肘屈側」という左右対称の分布</span>も'
         '幼小児期のAD らしさを裏づけている。<br>'
         '検査所見は<span class="kw3">病態のTh2型炎症から一直線に導ける</span>ので、'
         '暗記する必要がない。'
         'AD では<span class="kw3">2型ヘルパーT細胞〈Th2〉が優位</span>となり、'
         '3つの主要サイトカインを出す。<br>'
         '<span class="kw3">①IL-4・IL-13</span>——'
         '<span class="kw3">B細胞にIgEへのクラススイッチを起こさせる</span>。'
         'その結果<span class="kw3">血清総IgEが上昇</span>し、'
         '<span class="kw3">ダニ・ハウスダスト・食物などの抗原特異的IgEも陽性</span>になる。'
         'さらにIL-4/IL-13は<span class="kw3">フィラグリンの発現を下げてバリアをいっそう壊す</span>ため、'
         '炎症とバリア破綻が相互に増幅し合う。'
         'この経路を遮断するのが<span class="kw3">デュピルマブ（抗IL-4受容体α抗体）</span>である。<br>'
         '<span class="kw3">②IL-5</span>——'
         '<span class="kw3">骨髄での好酸球産生を促し、遊走と生存延長を助ける</span>。'
         'これにより<span class="kw3">末梢血好酸球が増加</span>し、皮膚組織にも好酸球が浸潤する。<br>'
         '<span class="kw3">③IL-31</span>——'
         '<span class="kw3">知覚神経に働いて痒みを直接引き起こす</span>。'
         'これを標的とするのが<span class="kw">ネモリズマブ</span>である。<br>'
         'したがって<span class="kw3">AD の代表的検査所見＝好酸球増加＋IgE高値</span>となり、本問の答えになる。'
         '一方、誤答肢の<span class="kw3">補体低下はⅢ型（免疫複合体）</span>、'
         '<span class="kw3">リウマトイド因子は自己抗体</span>、'
         '<span class="kw3">リンパ球減少は免疫抑制状態</span>を示すもので、'
         'いずれも<span class="kw3">Th2型のアレルギー炎症とは別の軸</span>にある。'
         '<span class="kw4">なお、これらの検査値は診断に必須ではなく支持所見にとどまる</span>点は繰り返し確認しておきたい。'
         '<span class="kw3">AD の診断はあくまで臨床（瘙痒・皮疹と分布・慢性反復性の経過）で行う</span>。'),
  deep=('📌 AD の検査所見と、鑑別に使う検査',
        '<table class="tb"><tr><th>検査</th><th>AD での動き</th><th>意義</th></tr>'
        '<tr><td><span class="kw3">末梢血好酸球</span></td><td><span class="kw3">増加</span></td>'
        '<td>IL-5による。重症度とおおむね相関</td></tr>'
        '<tr><td><span class="kw3">血清総IgE</span></td><td><span class="kw3">高値</span></td>'
        '<td>IL-4/IL-13による。<span class="kw4">正常例（内因性AD）もある</span></td></tr>'
        '<tr><td>抗原特異的IgE</td><td>ダニ・ハウスダスト等に陽性</td>'
        '<td><span class="kw4">陽性＝原因とは限らない（感作の証明にすぎない）</span></td></tr>'
        '<tr><td><span class="kw3">血清TARC〈CCL17〉</span></td><td><span class="kw3">上昇</span></td>'
        '<td><span class="kw3">短期の重症度・治療効果の判定に最も有用</span></td></tr>'
        '<tr><td>LDH</td><td>上昇することがある</td><td>皮膚の炎症量を反映</td></tr>'
        '<tr><td>補体・リウマトイド因子・抗核抗体</td><td><span class="kw3">正常</span></td>'
        '<td>異常なら<span class="kw3">膠原病</span>を疑う</td></tr></table>'
        '<span class="kw4">検査値の解釈で誤りやすい点</span>を押さえる。'
        '<span class="kw4">①抗原特異的IgEが陽性でも、その抗原が症状の原因とは限らない</span>——'
        '感作されているだけのことが多く、'
        '<span class="kw4">陽性を理由に食物を除去すると、成長障害を招くうえ、'
        '経口免疫寛容が失われて逆に食物アレルギーを発症させうる</span>。'
        '<span class="kw3">食物除去は、明確な症状誘発の病歴か経口負荷試験の結果に基づいて行う</span>。'
        '<span class="kw4">②IgEが正常でもAD は否定できない</span>（内因性AD）。'
        '<span class="kw3">③重症で難治な「AD らしき」例では他疾患を鑑別する</span>——'
        '<span class="kw3">菌状息肉症（表皮内への異型リンパ球浸潤・<span class="kw">Q.28</span>）、'
        '疥癬（夜間の激しい瘙痒・疥癬トンネル）、'
        '高IgE症候群（著明なIgE高値＋反復する皮膚/肺の細菌感染＋特徴的顔貌＋乳歯の脱落遅延）、'
        'Wiskott-Aldrich症候群（湿疹＋血小板減少＋易感染性・X連鎖）</span>。'
        '<span class="kw3">とくに小児で「湿疹＋血小板減少」ならWiskott-Aldrich症候群を想起</span>する。'),
  point=('🎯 国試ポイント',
         '① AD の検査所見＝<span class="kw3">末梢血好酸球増加＋血清IgE高値</span>。<br>'
         '② 機序＝<span class="kw3">IL-4/IL-13→IgE、IL-5→好酸球、IL-31→痒み</span>。'
         'それぞれデュピルマブ・ネモリズマブの標的。<br>'
         '③ <span class="kw3">TARCは短期の重症度・治療効果判定に有用</span>。<br>'
         '④ <span class="kw4">特異的IgE陽性＝原因ではない</span>。'
         '<span class="kw4">安易な食物除去は禁物</span>（成長障害・かえって発症させうる）。<br>'
         '⑤ <span class="kw4">補体低下・リウマトイド因子陽性・リンパ球減少はAD の所見ではない</span>。<br>'
         '⑥ 難治例では<span class="kw3">菌状息肉症・疥癬・高IgE症候群・Wiskott-Aldrich症候群</span>を鑑別する。')),

Q('97E-32', None, [('bh', '必修')],
  '<strong>アトピー性皮膚炎で<span class="kw">血中濃度が高値</span>を示すのはどれか。</strong>',
  [('a', 'IgA', False, '<span class="kw4">粘膜免疫の主役（分泌型IgA）</span>で、血中で最も多い免疫グロブリンとしては2番目。'
                     '高値になるのは<span class="kw">IgA腎症・IgA血管炎・肝硬変・多発性骨髄腫（IgA型）</span>など。AD では上昇しない。'),
   ('b', 'IgD', False, '<span class="kw4">血中にごく微量しか存在せず、機能も未解明な部分が多い</span>。'
                     'B細胞表面の抗原受容体として働く。臨床で測定する場面はほとんどない。'),
   ('c', 'IgE', True, '<span class="kw3">Th2型炎症でIL-4・IL-13がB細胞にIgEへのクラススイッチを促す</span>ため高値になる。'
                     '<span class="kw3">IgEは肥満細胞・好塩基球のFcεRIに結合し、抗原の架橋で脱顆粒を起こす'
                     '＝Ⅰ型アレルギーの担い手</span>である（<span class="kw">Q.51</span>）。'),
   ('d', 'IgG', False, '<span class="kw4">血中で最も多く、唯一胎盤を通過する免疫グロブリン</span>。'
                     '二次免疫応答の主役で、高値になるのは<span class="kw">慢性感染症・自己免疫疾患・多発性骨髄腫</span>など。'),
   ('e', 'IgM', False, '<span class="kw4">五量体で分子量が最大、感染初期に最初に産生される</span>。'
                     '高値は<span class="kw">急性感染症・原発性胆汁性胆管炎・原発性マクログロブリン血症</span>など。')],
  'アトピー性皮膚炎ではTh2型炎症（IL-4・IL-13）により血清IgEが高値となる。',
  patho=('🧬 IgE——Ⅰ型アレルギーの担い手',
         '<span class="kw3">アトピー性皮膚炎で高値を示すのはIgE</span>である。'
         '必修レベルの知識だが、<span class="kw3">なぜIgEなのか</span>と'
         '<span class="kw3">IgEが何をするのか</span>まで押さえておくと、'
         '蕁麻疹・食物アレルギー・気管支喘息など'
         'Ⅰ型アレルギー全般の設問に横断的に効いてくる。<br>'
         '<span class="kw3">産生される理由</span>——'
         'AD では<span class="kw3">Th2細胞が優位</span>となり、'
         'そこから出る<span class="kw3">IL-4とIL-13がB細胞に働いて、'
         '産生する抗体のクラスをIgEへ切り替えさせる（クラススイッチ）</span>。'
         'その結果、血清総IgEが上昇し、'
         '同時にダニ・ハウスダスト・花粉・食物などに対する<span class="kw3">抗原特異的IgE</span>も産生される。<br>'
         '<span class="kw3">IgEの働き</span>——'
         '産生されたIgEは<span class="kw3">肥満細胞と好塩基球の表面にある高親和性受容体FcεRIに結合して待機</span>する。'
         'そこへ<span class="kw3">抗原が来て、隣り合う2分子のIgEを橋渡し（架橋）すると、'
         '細胞内にシグナルが入って脱顆粒が起こる</span>。'
         '放出された<span class="kw3">ヒスタミン・ロイコトリエン・プロスタグランジン</span>が'
         '<span class="kw3">血管透過性亢進（膨疹）・血管拡張（発赤）・平滑筋収縮（気管支攣縮）・'
         '知覚神経刺激（瘙痒）</span>を起こす——これが<span class="kw3">Ⅰ型（即時型）アレルギー</span>の全体像である。'
         '<span class="kw3">「分〜十数分で症状が出る」のは、この反応が'
         '既に待機している細胞の脱顆粒だけで完結するから</span>である'
         '（<span class="kw">Q.44</span>で問われた時間の物差しの根拠がこれ）。<br>'
         '<span class="kw3">この経路を狙った治療薬</span>も整理しておくと臨床とつながる。'
         '<span class="kw3">オマリズマブ（抗IgE抗体）</span>は遊離IgEを捕捉して'
         'FcεRIへの結合を妨げるもので、<span class="kw3">難治性の慢性蕁麻疹・重症喘息</span>に用いる。'
         '<span class="kw3">デュピルマブ（抗IL-4受容体α抗体）</span>はIL-4/IL-13の上流を止めるもので、'
         '<span class="kw3">中等症〜重症のAD</span>に用いる。'
         '<span class="kw4">なおIgEは血中濃度が最も低い免疫グロブリンであり、'
         '「高値」といっても他のクラスに比べれば桁違いに微量</span>である点も豆知識として押さえておくとよい。'),
  deep=('📌 免疫グロブリン5クラスの整理',
        '<table class="tb"><tr><th>クラス</th><th>特徴</th><th>高値になる代表</th></tr>'
        '<tr><td><span class="kw">IgG</span></td>'
        '<td><span class="kw3">血中最多・唯一胎盤を通過</span>・二次応答の主役・4サブクラス</td>'
        '<td>慢性感染症・自己免疫疾患・骨髄腫。'
        '<span class="kw">IgG4関連疾患</span></td></tr>'
        '<tr><td><span class="kw">IgA</span></td>'
        '<td><span class="kw3">分泌型は粘膜免疫（二量体・分泌片）</span>・母乳に多い</td>'
        '<td><span class="kw">IgA腎症・IgA血管炎</span>・肝硬変</td></tr>'
        '<tr><td><span class="kw">IgM</span></td>'
        '<td><span class="kw3">五量体・分子量最大・感染初期に最初に出る</span>・補体活性化が強い</td>'
        '<td>急性感染症・<span class="kw">原発性胆汁性胆管炎</span>・マクログロブリン血症</td></tr>'
        '<tr><td>IgD</td><td>血中に微量・B細胞の抗原受容体</td><td>（臨床的意義は限定的）</td></tr>'
        '<tr><td><span class="kw3">IgE</span></td>'
        '<td><span class="kw3">血中濃度は最少・肥満細胞/好塩基球のFcεRIに結合・Ⅰ型アレルギー</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎・気管支喘息・アレルギー性鼻炎・寄生虫感染</span>・'
        '<span class="kw">高IgE症候群</span></td></tr></table>'
        '<span class="kw3">IgE高値をきたす「AD 以外」の疾患</span>も鑑別に必要である。'
        '<span class="kw3">①寄生虫感染（回虫・糞線虫・アニサキスなど）</span>——'
        '好酸球増多も伴うためAD と紛らわしい。'
        '<span class="kw3">②高IgE症候群〈Job症候群〉</span>——'
        '<span class="kw3">著明なIgE高値（数千〜数万）＋新生児期からの湿疹＋'
        '反復する皮膚膿瘍・肺炎（肺囊胞形成）＋特徴的顔貌＋乳歯の脱落遅延＋側彎</span>。'
        'STAT3変異が原因。'
        '<span class="kw3">③Wiskott-Aldrich症候群</span>——'
        '<span class="kw3">X連鎖性で、湿疹＋血小板減少（小型血小板）＋易感染性</span>。'
        '<span class="kw3">④アレルギー性気管支肺アスペルギルス症〈ABPA〉</span>——'
        '喘息＋IgE著明高値＋アスペルギルス特異的IgE陽性＋中枢性気管支拡張。'
        '<span class="kw4">「難治性の湿疹＋著明なIgE高値＋反復する感染」なら原発性免疫不全症を疑う</span>——'
        'これが単なるAD との分岐点になる。'),
  point=('🎯 国試ポイント',
         '① AD で高値になるのは<span class="kw3">IgE</span>。必修レベル。<br>'
         '② 機序＝<span class="kw3">Th2のIL-4・IL-13によるIgEクラススイッチ</span>。<br>'
         '③ IgEは<span class="kw3">肥満細胞・好塩基球のFcεRIに結合し、抗原の架橋で脱顆粒</span>→Ⅰ型アレルギー。<br>'
         '④ <span class="kw3">IgG＝血中最多・唯一胎盤通過／IgA＝粘膜／IgM＝五量体・感染初期／IgE＝血中最少</span>。<br>'
         '⑤ IgE高値は<span class="kw3">寄生虫感染・高IgE症候群・Wiskott-Aldrich症候群・ABPA</span>でも起こる。<br>'
         '⑥ 治療薬＝<span class="kw3">オマリズマブ（抗IgE）・デュピルマブ（抗IL-4Rα）</span>。')),

Q('95E-35', None, [('bh', '必修')],
  '<strong>アトピー性皮膚炎に<span class="kw4">特徴的でない</span>のはどれか。</strong>',
  [('a', '左右非対称性の皮疹', True, '<span class="kw3">特徴的でない＝これが正解</span>。'
                     '<span class="kw3">AD の皮疹は左右対称性に分布する</span>のが原則である（<span class="kw">Q.50</span>）。'
                     '<span class="kw3">左右非対称なら、外的要因による疾患——接触皮膚炎（当たる物の形に一致）・'
                     '体部白癬・帯状疱疹（片側デルマトーム）</span>などを疑う。'),
   ('b', '慢性の経過', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">「慢性・反復性の経過」はAD の診断3要件の1つ</span>で、'
                     '<span class="kw3">乳児では2か月以上、それ以外では6か月以上</span>の持続が要件とされる。'),
   ('c', '瘙　痒', False, '<span class="kw3">特徴的である</span>。診断3要件の筆頭で必発症状。'
                     '<span class="kw">IL-31</span>が痒みを直接引き起こす。'),
   ('d', '白内障の合併', False, '<span class="kw3">特徴的である</span>。'
                     '<span class="kw3">アトピー白内障はAD の眼合併症のうち最多で、定期スクリーニングの対象</span>'
                     '（<span class="kw">Q.37・Q.50</span>）。'),
   ('e', '血清IgE の増加', False, '<span class="kw3">特徴的である</span>。'
                     'Th2型炎症（IL-4・IL-13）によるもので、末梢血好酸球増多も伴う（<span class="kw">Q.51・Q.52</span>）。')],
  'アトピー性皮膚炎の皮疹は左右対称性に分布するのが原則。「左右非対称性の皮疹」は特徴的でない。慢性の経過・瘙痒・白内障合併・IgE増加はいずれも特徴的。',
  patho=('↔️ 「左右対称かどうか」で内因性と外因性を分ける',
         '本問は<span class="kw">Q.50</span>と同じ「AD に特徴的でないものを選べ」という形式だが、'
         '狙われているのは<span class="kw3">皮疹の分布の対称性</span>である。'
         '<span class="kw3">AD の皮疹は左右対称性に分布する</span>——'
         'これは単なる暗記事項ではなく、<span class="kw3">皮膚疾患を大きく2つに分ける原理</span>の一例である。<br>'
         '<span class="kw3">左右対称に出る＝内因性・全身性の要因</span>。'
         '体の内側から働く要因（免疫・代謝・薬剤・血流）は左右を区別しないため、'
         '皮疹も対称になる。'
         '<span class="kw3">アトピー性皮膚炎・尋常性乾癬・薬疹・扁平苔癬・'
         '光線過敏症（露光部に左右対称）・結節性紅斑・掌蹠膿疱症</span>などがこれにあたる。<br>'
         '<span class="kw3">左右非対称に出る＝外因性・局所的な要因</span>。'
         '外から加わるもの（接触・感染・外傷・神経支配）は当たった側にだけ作用するので非対称になる。'
         '<span class="kw3">接触皮膚炎（当たる物の形に一致・<span class="kw">Q.43</span>）・'
         '体部白癬（環状に拡大）・帯状疱疹（片側性・デルマトーム一致）・'
         '外傷・熱傷・虫刺症</span>などである。<br>'
         'したがって<span class="kw3">診察で「左右対称か」を確認することは、'
         '原因が内にあるのか外にあるのかを最初に振り分ける作業</span>にほかならない。'
         '<span class="kw3">AD らしい病歴でも皮疹が明らかに非対称なら、'
         '接触皮膚炎の合併や白癬・疥癬の混在を疑う</span>——これが実臨床での使い方になる。<br>'
         '本問の他の4肢は、AD の診断3要件と代表的所見をそのまま並べたものである。'
         '<span class="kw3">①瘙痒、②特徴的な皮疹と分布（左右対称）、③慢性・反復性の経過</span>が診断3要件、'
         '<span class="kw3">血清IgE増加・好酸球増多</span>が支持所見、'
         '<span class="kw3">白内障</span>が代表的な合併症である。'
         '<span class="kw3">Q.50 と本問は「AD に特徴的でないもの」を'
         '眼合併症の側（虹彩炎）と分布の側（非対称）から問い分けた姉妹問題</span>であり、'
         '2問をセットで復習すると AD の輪郭が固まる。'),
  deep=('📌 分布のパターンから疾患を読む',
        '<table class="tb"><tr><th>分布</th><th>示唆されるもの</th><th>代表疾患</th></tr>'
        '<tr><td><span class="kw3">左右対称</span></td><td><span class="kw3">内因性・全身性</span></td>'
        '<td><span class="kw3">アトピー性皮膚炎</span>・尋常性乾癬・薬疹・扁平苔癬・結節性紅斑・掌蹠膿疱症</td></tr>'
        '<tr><td><span class="kw3">左右非対称</span></td><td><span class="kw3">外因性・局所性</span></td>'
        '<td><span class="kw3">接触皮膚炎・白癬・帯状疱疹</span>・虫刺症・熱傷</td></tr>'
        '<tr><td>露光部に左右対称</td><td>光＋内因</td>'
        '<td><span class="kw3">光線過敏症（SLE・皮膚筋炎・ペラグラ・ポルフィリン症）</span>（<span class="kw">Q.12・Q.27</span>）</td></tr>'
        '<tr><td>片側・デルマトームに一致</td><td>神経支配</td><td><span class="kw3">帯状疱疹</span></td></tr>'
        '<tr><td>接触部位に一致（帯状・線状）</td><td>接触</td><td><span class="kw3">接触皮膚炎</span>（<span class="kw">Q.39・Q.43・Q.54</span>）</td></tr>'
        '<tr><td>Blaschko線に沿う</td><td>発生学的モザイク</td><td>色素失調症・線状苔癬・表皮母斑</td></tr>'
        '<tr><td>間擦部（腋窩・鼠径・乳房下）</td><td>湿潤・摩擦</td><td>カンジダ症・脂漏性皮膚炎・尋常性天疱瘡</td></tr>'
        '<tr><td>伸側（肘頭・膝蓋）</td><td>—</td><td><span class="kw3">尋常性乾癬</span></td></tr>'
        '<tr><td>屈側（肘窩・膝窩）</td><td>—</td><td><span class="kw3">アトピー性皮膚炎（幼小児期）</span></td></tr></table>'
        '<span class="kw3">「伸側は乾癬、屈側はアトピー」</span>は最も使用頻度の高い対比の一つで、'
        '本章の<span class="kw">Q.28・Q.37・Q.51</span>の症例がいずれも'
        '<span class="kw3">肘窩・膝窩（屈側）</span>と書かれているのは偶然ではない。'
        'あわせて<span class="kw3">年齢による分布の推移</span>'
        '（<span class="kw3">乳児期＝顔・頭 → 幼小児期＝四肢屈側 → 思春期・成人期＝上半身優位</span>）も'
        '押さえておけば、症例文の一行から年齢と診断を突き合わせられる。'),
  point=('🎯 国試ポイント',
         '① AD の皮疹は<span class="kw3">左右対称</span>。'
         '<span class="kw4">「左右非対称」は特徴的でない</span>——これが本問の答え。<br>'
         '② <span class="kw3">対称＝内因性／非対称＝外因性</span>という原理で振り分ける。<br>'
         '③ 非対称なら<span class="kw3">接触皮膚炎・白癬・帯状疱疹</span>を疑う。<br>'
         '④ AD の診断3要件＝<span class="kw3">瘙痒・特徴的な皮疹と分布・慢性反復性の経過</span>。<br>'
         '⑤ <span class="kw3">伸側＝乾癬／屈側＝アトピー</span>、'
         '<span class="kw3">乳児は顔頭→幼小児は四肢屈側→成人は上半身</span>。<br>'
         '⑥ <span class="kw">Q.50</span>（虹彩炎）と本問（非対称）は姉妹問題。セットで復習する。')),

Q('95G-6', None, [('bi', '📷')],
  '25歳の女性。<span class="kw">3日前から右耳に瘙痒を伴う皮疹が出現してきた</span>ので来院した。'
  '<span class="kw">3週前からピアス型イヤリングを使用していた</span>。右耳介の写真を示す。<br>'
  '<strong>行うべき検査はどれか。</strong>',
  [('a', '皮内試験', False, '<span class="kw4">抗原を皮内に注射して15〜20分後の膨疹で判定する即時型（Ⅰ型）の検査</span>。'
                     '本例は<span class="kw4">3週間の接触を経て生じた遅延型（Ⅳ型）の湿疹</span>であり型が合わない。'),
   ('b', '貼布試験', True, '<span class="kw3">パッチテストのこと。被疑物質を背部に48時間貼付し、'
                     '遅延型（Ⅳ型）反応を判定する</span>。'
                     '<span class="kw3">金属（ニッケル）アレルギーの標準的な診断法</span>で、'
                     '<span class="kw3">金属では7日目判定を加える</span>（<span class="kw">Q.30・Q.39・Q.43</span>）。'),
   ('c', '最小紅斑量試験', False, '<span class="kw4">紫外線を段階的に照射してMEDを測り、光線過敏の有無を調べる光線テスト</span>'
                     '（<span class="kw">Q.18・Q.19</span>）。'
                     '本例の皮疹は<span class="kw4">露光部ではなく耳垂という接触部位に一致</span>しており、光は関係しない。'),
   ('d', 'Tzanck 試験', False, '<span class="kw4">水疱底を擦過して細胞を染色し、棘融解細胞やウイルス性多核巨細胞を見る検査</span>'
                     '（<span class="kw">Q.15・Q.42</span>）。天疱瘡やヘルペス感染を疑うときの検査であり、本例には適さない。'),
   ('e', 'リンパ球刺激試験', False, '<span class="kw">DLST</span>。'
                     '<span class="kw4">患者リンパ球に被疑薬を加えて増殖反応を見る検査で、主に薬疹の原因薬剤の推定に用いる</span>。'
                     '接触皮膚炎の原因物質の同定にはパッチテストが標準である。')],
  'ピアス型イヤリング装着3週後に、接触部位である耳垂に一致して生じた瘙痒性の湿疹＝ニッケルによるアレルギー性接触皮膚炎（Ⅳ型）。検査は貼布試験（パッチテスト）。',
  imgs=['images/95G-6_1.jpeg'],
  patho=('💍 ピアスとニッケル——最も頻度の高い接触アレルゲン',
         '本例は<span class="kw3">接触皮膚炎の教科書的な提示</span>である。'
         '診断根拠は3つ揃っている。'
         '<span class="kw3">①部位が接触部位に一致</span>——'
         '写真では<span class="kw3">イヤリングが当たる耳垂を中心に、'
         '紅斑・浮腫・湿潤・びらん・痂皮</span>がみられ、耳介の他の部位は保たれている。'
         '<span class="kw3">②時間経過が遅延型に合う</span>——'
         '<span class="kw3">3週前から使用開始し、3日前に発症</span>。'
         '初回接触では発症せず、<span class="kw3">感作が成立してから症状が出る</span>という'
         'Ⅳ型アレルギーの時間軸そのものである。'
         '<span class="kw3">③瘙痒を伴う湿疹病変</span>——'
         '<span class="kw3">表皮の海綿状態</span>により小水疱・湿潤・痂皮を生じている。<br>'
         '<span class="kw3">ニッケルは最も頻度の高い接触アレルゲン</span>で、'
         '<span class="kw3">とくにピアスは、装身具の中でも感作を成立させやすい</span>。'
         '理由は<span class="kw3">「傷ついた皮膚と金属が長時間、汗の存在下で接触する」</span>ためで、'
         '<span class="kw3">汗（塩化物イオン）が金属からニッケルイオンを溶出させ、'
         'ピアス孔という創面から真皮へ直接届く</span>。'
         'これが強力な感作を成立させる。'
         '<span class="kw3">いったんニッケルに感作されると生涯持続する</span>のが厄介な点で、'
         '<span class="kw3">その後は時計・ベルトのバックル・ネックレス・眼鏡フレーム・'
         '硬貨・さらには歯科金属や食物中の微量ニッケルにまで反応しうる</span>（<span class="kw">Q.30</span>）。<br>'
         '確定診断は<span class="kw3">貼布試験〈パッチテスト〉</span>で行う。'
         '<span class="kw3">硫酸ニッケルを含むスタンダードアレルゲンを背部に48時間貼付し、'
         '48・72時間、そして金属では7日目にも判定</span>する。'
         '<span class="kw4">金属は反応が遅く、72時間では陰性で7日目に初めて陽性化する例がある</span>ため、'
         'この追加判定が実務上重要になる。<br>'
         '<span class="kw3">治療と生活指導</span>は明快である。'
         '<span class="kw3">①原因の除去——イヤリングの使用中止</span>（これが根本治療）。'
         '<span class="kw3">②ステロイド外用</span>で湿疹を鎮める。'
         '<span class="kw3">③再開する場合は、ニッケルを含まない素材'
         '（サージカルステンレス・純チタン・18金以上・プラチナ・樹脂）を選ぶ</span>。'
         '<span class="kw4">「金メッキ」は下地にニッケルが使われていることが多く、'
         '摩耗すると露出するため安全とは言えない</span>——この具体性まで指導できると実臨床で役立つ。'),
  deep=('📌 装身具・金属アレルギーの実際',
        '<table class="tb"><tr><th>金属</th><th>主な曝露源</th><th>備考</th></tr>'
        '<tr><td><span class="kw3">ニッケル</span></td>'
        '<td><span class="kw3">ピアス・ネックレス・時計・ベルトのバックル・硬貨・歯科金属</span></td>'
        '<td><span class="kw3">最も頻度が高い</span>。女性に多い（ピアスの影響）</td></tr>'
        '<tr><td><span class="kw">コバルト</span></td><td>顔料・セメント・装身具</td><td>ニッケルと同時陽性が多い</td></tr>'
        '<tr><td><span class="kw">クロム</span></td><td><span class="kw">セメント・皮革（なめし）・メッキ</span></td>'
        '<td>建設業の手・下腿の皮膚炎</td></tr>'
        '<tr><td>金・パラジウム・水銀</td><td>歯科金属</td><td>口腔粘膜の扁平苔癬様病変・掌蹠膿疱症様の皮疹</td></tr></table>'
        '<span class="kw3">全身型金属アレルギー</span>という概念も押さえておきたい。'
        '<span class="kw3">歯科金属や食物中の微量金属が体内に取り込まれ、'
        '接触部位から離れた場所に皮疹を生じる</span>もので、'
        '<span class="kw3">掌蹠膿疱症様の皮疹・全身の湿疹・汗疱状湿疹</span>として現れる。'
        '<span class="kw3">パッチテストで原因金属を同定し、歯科補綴物を除去・置換すると改善することがある</span>（<span class="kw">Q.30</span>）。<br>'
        '<span class="kw4">ピアス関連のトラブル</span>は接触皮膚炎だけではない点も重要である。'
        '<span class="kw3">①細菌感染（耳垂の膿瘍・軟骨部では軟骨膜炎で耳介変形をきたしうる）</span>、'
        '<span class="kw3">②ケロイド（とくに耳垂は好発部位で、体質により大きく増殖する）</span>、'
        '<span class="kw3">③粉瘤・肉芽形成</span>、'
        '<span class="kw3">④ピアス孔の裂傷</span>。'
        '<span class="kw4">耳介軟骨へのピアスは感染すると軟骨が融解して不可逆的な変形を残す</span>ため、'
        'とくに注意を要する。'
        '<span class="kw3">「ピアス後の耳の異常」では、接触皮膚炎・感染・ケロイドの3つを想起する</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">接触部位に一致した瘙痒性湿疹＝アレルギー性接触皮膚炎</span>。検査は<span class="kw3">貼布試験（パッチテスト）</span>。<br>'
         '② <span class="kw3">ニッケルは最多の接触アレルゲン</span>。'
         '<span class="kw3">ピアスは汗＋創面という条件で強く感作する</span>。<br>'
         '③ <span class="kw3">金属は7日目判定を加える</span>（72時間では陰性のことがある）。<br>'
         '④ <span class="kw4">皮内試験・スクラッチ・プリックはⅠ型</span>、'
         '<span class="kw4">DLSTは薬疹</span>、<span class="kw4">Tzanckは水疱症</span>——型と目的が違う。<br>'
         '⑤ 治療＝<span class="kw3">原因の除去＋ステロイド外用</span>。'
         '再開時は<span class="kw3">チタン・サージカルステンレス等</span>を選ぶ。<br>'
         '⑥ ピアスのトラブルは<span class="kw3">接触皮膚炎・感染（軟骨膜炎）・ケロイド</span>の3つ。')),
]


# ============================================================
# レンダリング
# ============================================================

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 2),
    ('s3', 'A問題', '', 9),
    ('s4', 'B問題', '', 10),
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
                        'MEC皮膚科 第2章 皮膚炎と蕁麻疹 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#B45309')
                .replace('--orl:#FCE4EC', '--orl:#FEF3C7')
                .replace('--ord:#880E4F', '--ord:#78350F'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 皮膚科</div>'
        '<h1>第<span>2</span>章｜皮膚炎と蕁麻疹</h1>'
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





