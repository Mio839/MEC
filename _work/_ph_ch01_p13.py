QUESTIONS += [

Q('112F-3', 96, [],
  '<strong>医療法に規定されていないのはどれか。</strong>',
  [('a', '特定機能病院', False,
    '<span class="kw4">医療法</span>。厚生労働大臣が承認する高度医療の病院。'),
   ('b', '地域医療支援病院', False,
    '<span class="kw4">医療法</span>。都道府県知事が承認し、かかりつけ医を支援する。'),
   ('c', '臨床研究中核病院', False,
    '<span class="kw4">医療法</span>（2015年施行）。'
    '<span class="kw4">国際水準の臨床研究や医師主導治験の中心的役割を担う</span>。'
    '厚生労働大臣が承認する。'),
   ('d', '地域包括支援センター', True,
    '<span class="kw3">◯ 介護保険法に基づき市町村が設置する</span>。'
    '<span class="kw3">医療法の規定ではない</span>。'
    '<span class="kw3">高齢者の総合相談・権利擁護・包括的継続的ケアマネジメント支援・'
    '介護予防ケアマネジメントを担い、'
    '保健師・社会福祉士・主任介護支援専門員の3職種を置く</span>。'
    '<span class="kw3">医療法に出てくる「センター」は医療安全支援センターと'
    '医療事故調査・支援センターの2つだけ</span>と覚えておくと切れる。'),
   ('e', '医療安全支援センター', False,
    '<span class="kw4">医療法</span>。'
    '<span class="kw4">都道府県・保健所を設置する市・特別区が設置し、'
    '患者・家族からの苦情や相談に対応する</span>（本章 NO.13・33・47）。')],
  '地域包括支援センターは介護保険法。医療法にある「センター」は医療安全支援センターと医療事故調査・支援センター。',
  patho=('🏥 医療法に載っている施設・組織',
         '<span class="kw3">医療法は「施設の法律」</span>なので、'
         '<span class="kw3">病院・診療所・助産所の定義と要件、'
         '名称独占の3病院、そして医療安全に関わる2つのセンター</span>が並ぶ。<br>'
         '<span class="kw">①病院（20床以上）・診療所（19床以下）・助産所（9床以下）</span>。<br>'
         '<span class="kw">②特定機能病院（厚生労働大臣が承認・高度医療）、'
         '地域医療支援病院（都道府県知事が承認・かかりつけ医支援）、'
         '臨床研究中核病院（厚生労働大臣が承認・臨床研究）</span>。<br>'
         '<span class="kw">③医療安全支援センター（苦情・相談）、'
         '医療事故調査・支援センター（死亡事例の調査）</span>。<br>'
         '<span class="kw4">ここに介護保険法の「地域包括支援センター」を混ぜるのが'
         '定番の作り方</span>である。'
         '<span class="kw4">名前に「センター」が付くだけで、'
         '根拠法も設置者も目的もまったく違う</span>——'
         '<span class="kw4">医療（医療法）・介護（介護保険法）・地域保健（地域保健法）の'
         '3系統に分けて覚える</span>。'),
  deep=('📌 「センター」の系統',
        '<table class="tb"><tr><th>系統</th><th>組織</th><th>設置</th></tr>'
        '<tr><td><span class="kw3">医療（医療法）</span></td>'
        '<td><span class="kw3">医療安全支援センター</span></td>'
        '<td><span class="kw3">都道府県・保健所設置市・特別区</span></td></tr>'
        '<tr><td><span class="kw3">医療（医療法）</span></td>'
        '<td><span class="kw3">医療事故調査・支援センター</span></td>'
        '<td><span class="kw3">厚生労働大臣が指定（全国1か所）</span></td></tr>'
        '<tr><td><span class="kw">介護（介護保険法）</span></td>'
        '<td><span class="kw">地域包括支援センター</span></td><td><span class="kw">市町村</span></td></tr>'
        '<tr><td><span class="kw">地域保健（地域保健法）</span></td>'
        '<td><span class="kw">市町村保健センター</span></td><td><span class="kw">市町村</span></td></tr>'
        '<tr><td>母子（母子保健法・児童福祉法）</td>'
        '<td>こども家庭センター（旧・子育て世代包括支援センター等）</td><td>市町村</td></tr>'
        '<tr><td>難病（難病法）</td><td>難病相談支援センター</td><td>都道府県・指定都市</td></tr>'
        '<tr><td>精神（精神保健福祉法）</td><td>精神保健福祉センター</td><td>都道府県・指定都市</td></tr></table>'
        '<span class="kw4">「市町村が設置＝住民に身近／都道府県が設置＝広域的・専門的／'
        '国が指定＝全国に1つ」</span>という階層で並べると覚えやすい。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①地域包括支援センターは介護保険法・市町村</span>。医療法ではない。<br>'
         '<span class="kw">②医療法の3病院＝特定機能・地域医療支援・臨床研究中核</span>。<br>'
         '<span class="kw">③医療法の2センター＝医療安全支援・医療事故調査支援</span>。<br>'
         '<span class="kw">④病院20床以上・診療所19床以下・助産所9床以下</span>。<br>'
         '<span class="kw">⑤市町村保健センターは地域保健法</span>。'),
  ),

Q('112F-24', 77, [('bc', 'CBT')],
  '<strong>医師の義務と規定する法律との組合せで正しいのはどれか。</strong>',
  [('a', '守秘義務 ―――― 医師法', False,
    '<span class="kw4">守秘義務は刑法第134条（秘密漏示罪）</span>。'
    '<span class="kw4">医師法には守秘義務の規定が無い</span>'
    '（本章 NO.32・38・68 で繰り返し問われる）。'),
   ('b', '応召義務 ―――― 民　法', False,
    '<span class="kw4">応召義務は医師法第19条第1項</span>。'
    '<span class="kw4">民法にあるのは善管注意義務（診療契約上の注意義務）</span>である。'),
   ('c', '説明義務 ―――― 医療法', True,
    '<span class="kw3">◯ インフォームド・コンセント（説明と理解）は'
    '医療法第1条の4第2項の努力義務</span>である。'
    '<span class="kw3">「医療の担い手は、医療を提供するに当たり、適切な説明を行い、'
    '医療を受ける者の理解を得るよう努めなければならない」</span>。'
    '<span class="kw3">医師法ではない</span>（本章 NO.45・50 の誤り肢と同じ論点）。'),
   ('d', '処方箋の交付義務 ―――― 健康保険法', False,
    '<span class="kw4">処方箋の交付義務は医師法第22条</span>。'
    '<span class="kw4">健康保険法が定めるのは保険医の登録・保険医療機関の指定・'
    '療養の給付など</span>である（本章 NO.2）。'),
   ('e', '異状死体の届出義務 ―――― 刑　法', False,
    '<span class="kw4">異状死体の届出義務は医師法第21条</span>'
    '（検案して異状を認めたとき24時間以内に所轄警察署へ）。'
    '<span class="kw4">刑法にあるのは守秘義務</span>で、'
    '<span class="kw4">a と e で医師法と刑法をちょうど入れ替えてある</span>のが'
    'この問題の作り方である。')],
  '説明義務（IC）は医療法。守秘義務は刑法、応召義務・処方箋交付・異状死体の届出は医師法。',
  patho=('⚖️ 5つの義務の所在——「入れ替え」を見抜く',
         '<span class="kw3">本問は5つの肢のうち4つで法律を入れ替えている</span>。'
         '<span class="kw3">正しい対応は次のとおり</span>——<br>'
         '<span class="kw">①守秘義務＝刑法134条</span>（医師法ではない）。<br>'
         '<span class="kw">②応召義務＝医師法19条1項</span>（民法ではない）。<br>'
         '<span class="kw3">③説明義務（IC）＝医療法1条の4第2項の努力義務</span>（これが正解）。<br>'
         '<span class="kw">④処方箋の交付義務＝医師法22条</span>（健康保険法ではない）。<br>'
         '<span class="kw">⑤異状死体の届出義務＝医師法21条</span>（刑法ではない）。<br>'
         '<span class="kw4">特に a と e は医師法と刑法をちょうど交換してある</span>——'
         '<span class="kw4">「刑法に何かある」という記憶だけで解くと、'
         'どちらが刑法か分からなくなる</span>。'
         '<span class="kw4">刑法にあるのは守秘義務ただ1つ</span>、と限定して覚えるのが安全である。'
         '<span class="kw4">本問の正答率77%は、この入れ替えの巧みさを反映している</span>。'),
  deep=('📌 医師の義務と根拠法',
        '<table class="tb"><tr><th>義務</th><th>根拠法</th><th>条文の要旨</th></tr>'
        '<tr><td><span class="kw">応召義務</span></td><td><span class="kw">医師法19条1項</span></td>'
        '<td><span class="kw">正当な事由がなければ診療を拒めない（罰則なし）</span></td></tr>'
        '<tr><td><span class="kw">診断書等の交付義務</span></td>'
        '<td><span class="kw">医師法19条2項</span></td>'
        '<td><span class="kw">診断書・検案書・出生証明書等の求めを正当な事由なく拒めない</span></td></tr>'
        '<tr><td><span class="kw">無診察治療の禁止</span></td><td><span class="kw">医師法20条</span></td>'
        '<td><span class="kw">自ら診察せずに治療・診断書・処方箋の交付をしない</span></td></tr>'
        '<tr><td><span class="kw">異状死体の届出</span></td><td><span class="kw">医師法21条</span></td>'
        '<td><span class="kw">24時間以内に所轄警察署へ</span></td></tr>'
        '<tr><td><span class="kw">処方箋の交付</span></td><td><span class="kw">医師法22条</span></td>'
        '<td>薬剤を投与する必要があるとき</td></tr>'
        '<tr><td><span class="kw">療養方法等の指導</span></td><td><span class="kw">医師法23条</span></td>'
        '<td>療養の方法その他保健の向上に必要な事項を指導</td></tr>'
        '<tr><td><span class="kw">診療録の記載・保存</span></td><td><span class="kw">医師法24条</span></td>'
        '<td>遅滞なく記載し5年保存</td></tr>'
        '<tr><td><span class="kw3">説明義務（IC）</span></td>'
        '<td><span class="kw3">医療法1条の4第2項</span></td>'
        '<td><span class="kw3">適切な説明を行い理解を得るよう努める（努力義務）</span></td></tr>'
        '<tr><td><span class="kw4">守秘義務</span></td><td><span class="kw4">刑法134条</span></td>'
        '<td><span class="kw4">業務上知り得た秘密を漏らさない</span></td></tr>'
        '<tr><td>善管注意義務</td><td>民法</td><td>診療契約上、一定水準以上の注意をもつ</td></tr></table>'),
  point=('🎯 国試ポイント',
         '<span class="kw">①説明義務（IC）は医療法の努力義務</span>。<br>'
         '<span class="kw">②刑法にあるのは守秘義務ただ1つ</span>。<br>'
         '<span class="kw">③応召義務・無診察治療の禁止・異状死体の届出・処方箋の交付・'
         '診療録は医師法</span>。<br>'
         '<span class="kw">④民法は善管注意義務</span>。<br>'
         '<span class="kw">⑤健康保険法は保険医の登録・保険医療機関の指定</span>。'),
  ),

Q('112F-27', 68, [],
  '<strong>都道府県による地域医療構想において検討すべき内容に含まれないのはどれか。</strong>',
  [('a', '医療提供体制', False,
    '<span class="kw4">含まれる</span>。'
    '<span class="kw4">構想区域ごとに、必要な医療提供体制をどう整えるかを検討する</span>。'),
   ('b', '保健所の配置', True,
    '<span class="kw3">◯ 保健所の設置は地域保健法の話</span>で、'
    '<span class="kw3">地域医療構想の検討内容ではない</span>。'
    '<span class="kw3">保健所は都道府県・政令指定都市・中核市・特別区が'
    '地域保健法に基づいて設置する</span>もので、'
    '<span class="kw3">医療計画（医療法）の枠組みとは別系統</span>である。'
    '<span class="kw3">「都道府県が決めること」という点だけが共通していて、'
    'そこを混ぜてある</span>。'),
   ('c', '医療従事者の確保・養成', False,
    '<span class="kw4">含まれる</span>。'
    '<span class="kw4">病床の機能を転換するには、その機能に見合う人員が要る</span>。'),
   ('d', '医療需要の将来推計', False,
    '<span class="kw4">含まれる</span>。'
    '<span class="kw4">2025年の医療需要（機能別の必要病床数＋在宅医療等で対応する患者数）を推計する</span>'
    '（本章 NO.54）。'),
   ('e', '病床の機能分化推進', False,
    '<span class="kw4">含まれる</span>。'
    '<span class="kw4">高度急性期・急性期・回復期・慢性期の4機能への分化と連携が'
    '地域医療構想の中心</span>である。')],
  '地域医療構想の内容は医療需要の推計・提供体制・従事者の確保・病床の機能分化。保健所の配置は地域保健法。',
  patho=('🔭 地域医療構想が扱う4つ——「医療提供体制」の話に限られる',
         '<span class="kw3">地域医療構想で検討するのは4つ</span>——'
         '<span class="kw3">①医療需要の将来推計 ②医療提供体制の整備 '
         '③医療従事者の確保・養成 ④病床の機能分化（高度急性期・急性期・回復期・慢性期）の推進</span>。'
         '<span class="kw3">いずれも「医療をどう提供するか」の話</span>である。<br>'
         '<span class="kw">保健所は地域保健法に基づく行政機関</span>で、'
         '<span class="kw">感染症・難病・精神保健・食品衛生・医療機関の監視など'
         '「保健行政」を担う</span>。'
         '<span class="kw">医療提供体制の一部ではないので、'
         '地域医療構想の検討内容には入らない</span>。<br>'
         '<span class="kw4">本問の正答率は68%</span>。'
         '<span class="kw4">「どちらも都道府県が関わる」という共通点があるため紛れやすい</span>が、'
         '<span class="kw4">医療法（医療提供体制）と地域保健法（保健行政）は'
         '別の法体系だ</span>と押さえておけば切れる。'
         '<span class="kw4">本章 NO.25（医療計画の記載事項に労働災害は含まれない）と'
         '同じ型の設問</span>である。'),
  deep=('📌 都道府県が作る主な計画',
        '<table class="tb"><tr><th>計画</th><th>根拠法</th><th>内容</th><th>期間</th></tr>'
        '<tr><td><span class="kw3">医療計画（地域医療構想を含む）</span></td>'
        '<td><span class="kw3">医療法</span></td>'
        '<td><span class="kw3">医療圏・基準病床数・5疾病6事業・在宅医療・'
        '医療従事者の確保</span></td><td><span class="kw3">6年</span></td></tr>'
        '<tr><td><span class="kw">健康増進計画</span></td>'
        '<td><span class="kw">健康増進法</span></td>'
        '<td><span class="kw">住民の健康づくり（健康日本21の地方版）</span></td><td>—</td></tr>'
        '<tr><td><span class="kw">介護保険事業支援計画</span></td>'
        '<td><span class="kw">介護保険法</span></td>'
        '<td><span class="kw">市町村の介護保険事業計画を支援</span></td>'
        '<td><span class="kw">3年</span></td></tr>'
        '<tr><td>がん対策推進計画</td><td>がん対策基本法</td>'
        '<td>がん医療の均てん化・予防・検診</td><td>6年</td></tr>'
        '<tr><td>医療費適正化計画</td><td>高齢者医療確保法</td>'
        '<td>特定健診・特定保健指導の目標等</td><td>6年</td></tr></table>'
        '<span class="kw4">保健所の設置は「計画」ではなく地域保健法の規定</span>——'
        '<span class="kw4">都道府県が関わるものすべてが医療計画に入るわけではない</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①地域医療構想の4項目＝医療需要の推計・提供体制・従事者の確保・'
         '病床の機能分化</span>。<br>'
         '<span class="kw">②保健所の設置は地域保健法。医療計画の内容ではない</span>。<br>'
         '<span class="kw">③医療計画は6年ごと（在宅医療等は3年で中間見直し）</span>。<br>'
         '<span class="kw">④構想区域は概ね二次医療圏</span>。<br>'
         '<span class="kw">⑤同型の設問＝本章 NO.25（医療計画に労働災害は含まれない）</span>。'),
  ),

Q('112F-35', 76, [],
  '<strong>患者調査について正しいのはどれか。</strong>',
  [('a', '毎年実施する。', False,
    '<span class="kw4">3年に1回</span>（10月の指定日）。'
    '<span class="kw4">毎年行うのは国民生活基礎調査・国民健康・栄養調査</span>である。'),
   ('b', '外来患者のみ調査を行う。', False,
    '<span class="kw4">入院・外来の両方を調査する</span>。'
    '<span class="kw4">入院患者については退院票により平均在院日数も算出される</span>。'),
   ('c', '傷病別の受療率を推計する。', True,
    '<span class="kw3">◯ 患者調査の中心的な指標</span>。'
    '<span class="kw3">受療率＝調査日に医療施設で受療した推計患者数を人口10万対で表したもの</span>で、'
    '<span class="kw3">傷病分類別・性別・年齢階級別・都道府県別に推計される</span>。'
    '<span class="kw3">「その日に医療機関にいた人の割合」という断面のデータ</span>である。'),
   ('d', '国内の全医療施設で実施する。', False,
    '<span class="kw4">全数調査ではなく、層化無作為抽出による標本調査</span>である。'
    '<span class="kw4">全数調査なのは国勢調査（総務省・5年に1回）</span>。'),
   ('e', '医療費についての調査が含まれる。', False,
    '<span class="kw4">医療費は患者調査では分からない</span>。'
    '<span class="kw4">医療費は国民医療費（毎年公表）で把握する</span>'
    '（本章 NO.18 でも問われる）。')],
  '患者調査は3年に1回の標本調査で、入院・外来の傷病別受療率を推計する。医療費は含まない。',
  patho=('📈 受療率——「その日、医療機関にいた人」の割合',
         '<span class="kw3">受療率は、患者調査の調査日に医療施設で受療した推計患者数を'
         '人口10万人あたりで表した値</span>である。'
         '<span class="kw3">ある1日の断面（point prevalence）を見ている</span>点が特徴で、'
         '<span class="kw3">「1年間に何人が受診したか」ではない</span>。<br>'
         '<span class="kw">患者調査から得られる主な指標</span>——'
         '<span class="kw">①推計患者数（調査日に受療した患者数） '
         '②受療率（人口10万対） ③総患者数（継続的に医療を受けていると推計される患者数） '
         '④平均在院日数（退院票から）</span>。<br>'
         '<span class="kw4">よく問われる特徴は5つ</span>——'
         '<span class="kw4">①3年に1回 ②厚生労働省 ③医療施設の層化無作為抽出（標本調査） '
         '④回答するのは施設 ⑤医療費は含まない</span>。'
         '<span class="kw4">本章では NO.15・18・64 の3問がこの5点の組合せで作られている</span>。'),
  deep=('📌 受療率の傾向（覚えておくと選択肢が切れる）',
        '<table class="tb"><tr><th>観点</th><th>傾向</th></tr>'
        '<tr><td><span class="kw3">年齢</span></td>'
        '<td><span class="kw3">高齢になるほど高い（入院・外来とも）</span></td></tr>'
        '<tr><td><span class="kw">入院の傷病分類</span></td>'
        '<td><span class="kw">精神及び行動の障害が最多（統合失調症が押し上げる）</span></td></tr>'
        '<tr><td><span class="kw">外来の傷病分類</span></td>'
        '<td><span class="kw">消化器系の疾患が最多（歯科疾患を含むため）</span></td></tr>'
        '<tr><td><span class="kw">外来の傷病名別（総患者数）</span></td>'
        '<td><span class="kw">高血圧性疾患が最多</span>（本章 NO.24）</td></tr>'
        '<tr><td>平均在院日数</td>'
        '<td>全体では短縮傾向。傷病分類別では精神及び行動の障害が最長</td></tr></table>'
        '<span class="kw4">「入院は精神、外来は消化器（大分類）／傷病名なら高血圧」</span>という'
        '3点セットで覚えると、患者調査の設問は数字を暗記せずに解ける。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①患者調査は3年に1回・厚生労働省・標本調査（全数ではない）</span>。<br>'
         '<span class="kw">②入院と外来の両方を調査し、傷病別の受療率を推計する</span>。<br>'
         '<span class="kw">③受療率は人口10万対。調査日1日の断面</span>。<br>'
         '<span class="kw">④医療費は含まない（国民医療費で把握）</span>。<br>'
         '<span class="kw">⑤回答するのは医療施設。患者本人は受療行動調査</span>。'),
  ),

Q('111E-7', 97, [],
  '<strong>災害医療について正しいのはどれか。</strong>',
  [('a', '災害拠点病院は市区町村が指定する。', False,
    '<span class="kw4">指定するのは都道府県</span>。'
    '<span class="kw4">基幹災害拠点病院は原則 都道府県に1か所、'
    '地域災害拠点病院は原則 二次医療圏に1か所</span>。'),
   ('b', '災害現場では医師は救急救命士の指揮下に入る。', False,
    '<span class="kw4">救急救命士の特定行為は医師の指示のもとで行われる</span>ので'
    '関係が逆である。'
    '<span class="kw4">災害現場の指揮は消防・災害対策本部を中心とした指揮系統（CSCATTTのC）で'
    '組まれる</span>。'),
   ('c', '防災体制を整備する地域的単位を二次医療圏と呼ぶ。', False,
    '<span class="kw4">二次医療圏は医療法に基づく医療提供体制の単位</span>であり、'
    '<span class="kw4">「防災体制の単位」という定義ではない</span>。'),
   ('d', 'トリアージは医師以外の医療職も行うことができる。', True,
    '<span class="kw3">◯ 実施者の資格要件は無い</span>。'
    '<span class="kw3">看護師・救急救命士等も行える</span>。'
    '<span class="kw3">START法が器具も検査も使わない手順で組まれているのは、'
    '誰が行っても同じ結論に達するようにするため</span>である。'),
   ('e', '災害医療とは災害派遣医療チーム〈DMAT〉の医療活動のことである。', False,
    '<span class="kw4">DMATの活動は災害医療の一部にすぎない</span>。'
    '<span class="kw4">DMATは急性期（概ね48時間以内）に活動する医療チーム</span>で、'
    '<span class="kw4">その後はJMAT・DPAT・DHEATなどが引き継ぎ、'
    '避難所の保健活動や慢性疾患の医療、こころのケアへと移っていく</span>。')],
  'トリアージは医師以外の医療職も実施できる。災害拠点病院の指定は都道府県。',
  patho=('🚑 本章 NO.27 との違いは選択肢 e だけ',
         '<span class="kw3">本問（111E-7）は本章 NO.27（117C-4）と'
         'ほぼ同一の問題</span>である。'
         '<span class="kw3">a〜d はまったく同じ文で、e だけが'
         '「DHEATの医療活動」（NO.27）と「DMATの医療活動」（本問）で入れ替わっている</span>。'
         '<span class="kw3">正解はどちらも d</span>。'
         '<span class="kw3">MECは同じ問題を年度違いで繰り返し載せる</span>ので、'
         'こうした重複は消さずに残してある。<br>'
         '<span class="kw">DMAT（災害派遣医療チーム）は、'
         '医師・看護師・業務調整員で構成され、'
         '発災後おおむね48時間以内の急性期に活動する</span>。'
         '<span class="kw">主な任務は、被災地域内での医療、'
         '広域医療搬送、病院支援、現場活動</span>。<br>'
         '<span class="kw4">災害医療はDMATだけで完結しない</span>——'
         '<span class="kw4">急性期を過ぎればJMAT（避難所・被災地医療）、'
         'DPAT（精神医療）、DHEAT（保健行政の支援）へと引き継がれ、'
         '生活の再建まで続く</span>。'
         '「災害医療＝DMAT」と等号で結ぶ肢は、この広がりを取り落としている。'),
  deep=('📌 災害のフェーズと担い手',
        '<table class="tb"><tr><th>時期</th><th>主な活動</th><th>担い手</th></tr>'
        '<tr><td><span class="kw3">超急性期〜急性期（〜48時間）</span></td>'
        '<td><span class="kw3">トリアージ・救命処置・広域医療搬送</span></td>'
        '<td><span class="kw3">DMAT・救急隊・災害拠点病院</span></td></tr>'
        '<tr><td><span class="kw">亜急性期（数日〜数週）</span></td>'
        '<td><span class="kw">避難所の巡回診療、慢性疾患の医療の継続、'
        '感染症対策、エコノミークラス症候群の予防</span></td>'
        '<td><span class="kw">JMAT・日赤救護班・保健師チーム</span></td></tr>'
        '<tr><td><span class="kw">慢性期〜復興期</span></td>'
        '<td><span class="kw">こころのケア（PTSD・うつ・アルコール）、'
        '生活不活発病の予防、地域医療の再建</span></td>'
        '<td><span class="kw">DPAT・保健所・自治体</span></td></tr>'
        '<tr><td>全期間</td><td>保健医療活動の指揮調整</td>'
        '<td>DHEAT・都道府県保健医療調整本部</td></tr></table>'
        '<span class="kw3">本章 NO.71（111H-27）は、まさに亜急性期の'
        '「慢性疾患の医療の継続」を問う問題</span>——'
        '<span class="kw3">災害医療は外傷だけではない</span>という視点が要る。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①トリアージは医師以外の医療職も実施できる</span>。<br>'
         '<span class="kw">②災害拠点病院の指定は都道府県</span>。<br>'
         '<span class="kw">③DMATは急性期（〜48時間）。災害医療＝DMATではない</span>。<br>'
         '<span class="kw">④急性期の後はJMAT・DPAT・DHEATへ引き継がれる</span>。<br>'
         '<span class="kw">⑤本章 NO.27 とほぼ同一問題（選択肢 e だけが違う）</span>。'),
  ),

]
