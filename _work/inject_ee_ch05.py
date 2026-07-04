import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q240": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 結核</td><td>×</td><td>らい予防法による強制隔離の対象ではない（結核は結核予防法）</td></tr><tr><td>b B型肝炎</td><td>×</td><td>隔離政策の対象ではない</td></tr><tr><td>c Hansen病</td><td>○</td><td>らい予防法（1953〜1996年）により療養所に強制隔離→40年以上の差別・偏見が続いた</td></tr><tr><td>d サリドマイド先天異常</td><td>×</td><td>薬害問題だが隔離政策ではない</td></tr></table></div>',

"q241": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 結核</td><td>○</td><td>耐性菌予防のため必ずINH+RFP+PZA+EBの4剤多剤併用が必須</td></tr><tr><td>b 梅毒</td><td>×</td><td>ペニシリンG単剤が第一選択（多剤不要）</td></tr><tr><td>c レジオネラ症</td><td>×</td><td>レボフロキサシン単剤またはマクロライド単剤で治療可能</td></tr><tr><td>d インフルエンザ</td><td>×</td><td>オセルタミビル（抗ウイルス薬）単剤が基本</td></tr></table></div>',

"q242": '<div class="eb ee"><h4>□ 選択肢評価（MAC症の治療薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>×</td><td>PCP・ノカルジア治療薬（抗酸菌には無効）</td></tr><tr><td>b イソニアジド</td><td>×</td><td>結核治療薬（MACには無効）</td></tr><tr><td>c ピラジナミド</td><td>×</td><td>結核初期治療薬（NTMには使用しない）</td></tr><tr><td>d アムホテリシンB</td><td>×</td><td>抗真菌薬（抗酸菌には無効）</td></tr><tr><td>e クラリスロマイシン</td><td>○</td><td>MAC症の中心的治療薬（＋EB+RFPの3剤が標準）</td></tr></table></div>',

"q243": '<div class="eb ee"><h4>□ 選択肢評価（塗抹陽性教員への対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 勤務先に連絡</td><td>×</td><td>PCR確定前に連絡すると不要な混乱を招く→確定後に保健所が対応</td></tr><tr><td>b 保健所に報告</td><td>×</td><td>届出は結核確定（PCR陽性）後に行う</td></tr><tr><td>c 抗結核薬を投与</td><td>×</td><td>確定診断前に治療開始→PCR結果待ちの段階では不可</td></tr><tr><td>d 自宅待機を指示</td><td>○</td><td>PCR待ちの段階で院内・職場感染を予防するため自宅待機が適切</td></tr></table></div>',

"q244": '<div class="eb ee"><h4>□ 選択肢評価（治療効果判定検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ツベルクリン反応</td><td>×</td><td>感染既往の確認→治療で変化しない</td></tr><tr><td>b 喀痰抗酸菌塗抹検査</td><td>○</td><td>感染性（排菌）の確認→塗抹陰性化で感染性消失を判定</td></tr><tr><td>c 喀痰抗酸菌培養検査</td><td>○</td><td>生菌の有無を確認→培養陰性化で治癒を判定（塗抹より精度高い）</td></tr><tr><td>d 喀痰抗酸菌PCR</td><td>×</td><td>死菌のDNAも検出するため治療後も陽性が続く→効果判定に不向き</td></tr></table></div>',

"q245": '<div class="eb ee"><h4>□ 選択肢評価（空気感染予防策の必要性を判断する検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 喀痰抗酸菌染色</td><td>○</td><td>塗抹陽性→感染性あり→空気感染予防策が必要と当日中に判断できる</td></tr><tr><td>b 喀痰抗酸菌培養</td><td>×</td><td>確定診断に使う（2〜8週かかる）→隔離判断には遅すぎる</td></tr><tr><td>c ツベルクリン反応</td><td>×</td><td>感染既往の確認→感染性・隔離の必要性判断には使わない</td></tr><tr><td>d BAL培養</td><td>×</td><td>侵襲的・時間がかかる→隔離判断には使わない</td></tr></table></div>',

"q246": '<div class="eb ee"><h4>□ 選択肢評価（NTMの特徴）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗菌薬単剤治療を避ける</td><td>○</td><td>NTMも単剤では耐性が出現→CAM+EB+RFPの多剤が必須</td></tr><tr><td>b 治療は6か月が基本</td><td>×</td><td>NTMは陰性化後12か月以上の長期治療（結核の6か月とは異なる）</td></tr><tr><td>c ヒトへ感染させる可能性あり</td><td>×</td><td>NTMはヒト→ヒト感染しない（環境〔土壌・水〕から感染）</td></tr><tr><td>d 菌が検出されたら直ちに治療</td><td>×</td><td>NTMは病状・進行度・患者状態で判断（必ずしも直ちに治療しない）</td></tr></table></div>',

"q247": '<div class="eb ee"><h4>□ 選択肢評価（BCG接種28日後の発赤・正常反応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 心配ないと説明する</td><td>○</td><td>BCG接種後21〜28日での発赤・腫脹・膿疱は正常経過→経過観察で問題ない</td></tr><tr><td>b 抗結核薬の投与</td><td>×</td><td>正常経過であり治療は不要</td></tr><tr><td>c ツベルクリン反応を行う</td><td>×</td><td>コッホ現象は2〜3日以内の発赤（本例は21〜28日→正常反応）→追加検査不要</td></tr><tr><td>d 抗酸菌塗抹・培養検査</td><td>×</td><td>正常反応に対して侵襲的検査は不要</td></tr></table></div>',

"q248": '<div class="eb ee"><h4>□ 選択肢評価（結核に多く・NTMに少ない所見）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 血痰</td><td>×</td><td>結核・NTM両者でみられる（鑑別に使えない）</td></tr><tr><td>b CRP上昇</td><td>×</td><td>両者で起こりうる（特異的でない）</td></tr><tr><td>c 空洞性肺結節</td><td>×</td><td>両者で形成される</td></tr><tr><td>d 喀痰塗抹ZN陽性</td><td>×</td><td>両者で陽性となりうる（PCRで菌種鑑別が必要）</td></tr><tr><td>e IGRA陽性</td><td>○</td><td>結核菌特異的抗原（ESAT-6・CFP-10）に反応→NTMでは陰性が多い</td></tr></table></div>',

"q249": '<div class="eb ee"><h4>□ 選択肢評価（リンパ節生検の追加染色）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a PAS染色</td><td>×</td><td>真菌・糖タンパクの染色</td></tr><tr><td>b Gram染色</td><td>×</td><td>細菌の染色（抗酸菌はGram染色では見えない）</td></tr><tr><td>c Grocott染色</td><td>×</td><td>真菌（アスペルギルス・カンジダ・PCP）の染色</td></tr><tr><td>d Ziehl-Neelsen染色</td><td>○</td><td>抗酸菌を赤色に染色→結核性リンパ節炎の確定に最適</td></tr></table></div>',

"q250": '<div class="eb ee"><h4>□ 選択肢評価（BCG接種後2日目発赤・コッホ現象）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 経過観察</td><td>×</td><td>コッホ現象は既感染を示す→精査が必要（経過観察のみでは不十分）</td></tr><tr><td>b CRP測定</td><td>×</td><td>炎症の程度は確認できるが結核感染の有無は判断できない</td></tr><tr><td>c ツベルクリン反応</td><td>○</td><td>BCG後2〜3日以内発赤（コッホ現象）→既感染疑い→ツ反で感染状況確認</td></tr><tr><td>d イソニアジド内服</td><td>×</td><td>確定診断前に治療開始→ツ反・胸部X線等の精査が先</td></tr></table></div>',

"q251": '<div class="eb ee"><h4>□ 選択肢評価（結核確定後の対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 外来で経過観察</td><td>×</td><td>塗抹陽性（GaffkyⅡ号）→感染性あり→入院隔離が必要</td></tr><tr><td>b 外来でINH投与</td><td>×</td><td>単剤・外来→耐性菌出現リスク・隔離不備</td></tr><tr><td>c 入院で多剤併用療法開始</td><td>○</td><td>塗抹陽性→陰圧個室入院＋HRZE 4剤開始が正しい</td></tr><tr><td>d 保健所に7日以内に届出</td><td>×</td><td>結核（2類感染症）は「直ちに」届出（7日以内は5類感染症）</td></tr></table></div>',

"q252": '<div class="eb ee"><h4>□ 選択肢評価（ハンセン病の知識）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 主として消化器が侵される</td><td>×</td><td>M.lepraeは皮膚・末梢神経に主に感染（消化器ではない）</td></tr><tr><td>b 感染するとほとんど発症する</td><td>×</td><td>感染力は非常に弱く、感染してもほとんど発症しない</td></tr><tr><td>c 多剤併用療法は有効でない</td><td>×</td><td>ダプソン+クロファジミン+RFPの多剤で治癒可能</td></tr><tr><td>d 保険診療の対象である</td><td>○</td><td>1996年らい予防法廃止後→一般保険診療（強制入院・外出制限は廃止）</td></tr></table></div>',

"q253": '<div class="eb ee"><h4>□ 選択肢評価（抗結核薬副作用の「誤り」を選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a INH―末梢神経障害</td><td>正しい</td><td>B6欠乏による末梢神経障害→ピリドキシン補充で予防</td></tr><tr><td>b RFP―心臓刺激伝導障害</td><td>○（誤り）</td><td>RFPの副作用は肝障害・CYP誘導・橙赤色尿（心刺激伝導障害ではない）</td></tr><tr><td>c EB―視神経障害</td><td>正しい</td><td>球後視神経炎→視力低下・色覚異常</td></tr><tr><td>d PZA―肝障害</td><td>正しい</td><td>肝障害・高尿酸血症が代表的副作用</td></tr></table></div>',

"q254": '<div class="eb ee"><h4>□ 選択肢評価（乳幼児の結核性髄膜炎）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a HIV</td><td>×</td><td>HIVは髄膜炎を起こすが、BCG未接種乳幼児ではまず結核を考える</td></tr><tr><td>b 肺炎球菌</td><td>×</td><td>細菌性髄膜炎の最多だが髄液は好中球優位・糖は著明低下（リンパ球優位と異なる）</td></tr><tr><td>c 結核菌</td><td>○</td><td>BCG未接種→血行性播種→結核性髄膜炎；リンパ球優位・糖↓・蛋白↑が特徴</td></tr><tr><td>d クラミジア</td><td>×</td><td>クラミジア肺炎（新生児）→肺炎が主体・髄膜炎は起こさない</td></tr></table></div>',

"q255": '<div class="eb ee"><h4>□ 選択肢評価（結核菌感染の確定診断検査2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胸部単純CT</td><td>×</td><td>病変の確認はできるが確定診断にはならない</td></tr><tr><td>b 胸部単純MRI</td><td>×</td><td>画像診断（確定診断に不向き）</td></tr><tr><td>c ツベルクリン反応</td><td>×</td><td>感染既往の確認（BCG後も陽性→特異度低い）</td></tr><tr><td>d 喀痰結核菌培養検査</td><td>○</td><td>生菌の確認・薬剤感受性検査→確定診断（2〜8週）</td></tr><tr><td>e 喀痰結核菌PCR</td><td>○</td><td>迅速（当日〜翌日）に結核菌を特異的に同定→確定診断</td></tr></table></div>',

"q256": '<div class="eb ee"><h4>□ 選択肢評価（結核疑い患者の診察時感染対策）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 陰圧個室での診察</td><td>○</td><td>結核は空気感染→飛沫核の室外漏れを防ぐ陰圧個室が最優先</td></tr><tr><td>b 聴診器の単回使用</td><td>×</td><td>接触感染予防（結核の主経路は空気感染→優先度低い）</td></tr><tr><td>c 撥水性ガウンの着用</td><td>×</td><td>接触感染予防（空気感染する結核には主要な予防策でない）</td></tr><tr><td>d サージカルマスクの着用</td><td>×</td><td>医療者はN95マスクが必須（サージカルマスクは飛沫核を通過させる）</td></tr></table></div>',

"q257": '<div class="eb ee"><h4>□ 選択肢評価（NTM診断後の管理）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺生検が必要</td><td>×</td><td>BAL液培養陽性＋抗MAC抗体陽性→生検なしで診断可能（ATS基準）</td></tr><tr><td>b 接触者健康診断を行う</td><td>×</td><td>NTMはヒト→ヒト感染しない→接触者調査は不要</td></tr><tr><td>c 個室隔離のため入院</td><td>×</td><td>NTMは感染性なし→隔離・入院は不要</td></tr><tr><td>d 保健所への届出は不要</td><td>○</td><td>NTMは感染症法の届出対象でない（結核は2類感染症で届出必須）</td></tr></table></div>',

"q258": '<div class="eb ee"><h4>□ 選択肢評価（空洞性肺病変・次に行うべき検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a FDG-PET</td><td>×</td><td>悪性腫瘍スタジング（抗酸菌感染の診断には優先しない）</td></tr><tr><td>b スパイロメトリ</td><td>×</td><td>肺機能評価（感染症の診断ではない）</td></tr><tr><td>c 喀痰抗酸菌検査</td><td>○</td><td>糖尿病＋空洞→結核・NTMのリスク大→塗抹・培養・PCRが最優先</td></tr><tr><td>d 尿中肺炎球菌抗原</td><td>×</td><td>細菌性肺炎（肺炎球菌）の迅速診断→空洞性病変には優先しない</td></tr></table></div>',

"q259": '<div class="eb ee"><h4>□ 選択肢評価（結核確定後の適切な対応2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 直ちに保健所に届出</td><td>○</td><td>結核は2類感染症→診断後「直ちに」届出義務あり</td></tr><tr><td>b 患者にN95マスク装着</td><td>×</td><td>N95マスクは医療従事者用（患者はサージカルマスク）</td></tr><tr><td>c 広域セフェム系に変更</td><td>×</td><td>結核にセフェムは無効（抗結核薬が必要）</td></tr><tr><td>d キノロン系を点滴で再開</td><td>×</td><td>キノロン曝露で耐性化リスクあり→継続は禁忌</td></tr><tr><td>e 薬剤感受性試験を実施</td><td>○</td><td>キノロン曝露歴あり→FQ耐性結核の可能性→感受性試験が必須</td></tr></table></div>',

"q260": '<div class="eb ee"><h4>□ 選択肢評価（確定診断に最も有用な所見）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ①</td><td>×</td><td>胸部X線や臨床所見は確定診断の根拠にならない</td></tr><tr><td>b ②</td><td>×</td><td>IGRA・ツ反は感染の証拠（確定診断ではない）</td></tr><tr><td>c ③</td><td>×</td><td>塗抹検査は抗酸菌の存在確認（NTMとの鑑別不可）</td></tr><tr><td>d ④</td><td>○</td><td>喀痰培養またはPCRで結核菌を同定→確定診断</td></tr></table></div>',

"q261": '<div class="eb ee"><h4>□ 選択肢評価（結核届出の期限）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 直ちに</td><td>○</td><td>結核は2類感染症→1〜4類はすべて「直ちに」届出（診断後速やかに保健所へ）</td></tr><tr><td>b 7日以内</td><td>×</td><td>7日以内は5類感染症（全数把握疾患）の届出期限</td></tr><tr><td>c 14日以内</td><td>×</td><td>該当する届出期限の類型なし</td></tr><tr><td>d 21日以内</td><td>×</td><td>該当する届出期限の類型なし</td></tr></table></div>',

"q262": '<div class="eb ee"><h4>□ 選択肢評価（標準治療に「使用しない」薬剤）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a イソニアジド（INH）</td><td>使用する</td><td>初期強化期・維持期ともに使用（殺菌作用が強い）</td></tr><tr><td>b ピラジナミド（PZA）</td><td>使用する</td><td>初期2か月使用（静止期菌に有効）</td></tr><tr><td>c エタンブトール（EB）</td><td>使用する</td><td>初期2か月使用（INH耐性時の代替薬）</td></tr><tr><td>d リファンピシン（RFP）</td><td>使用する</td><td>初期・維持期ともに使用（殺菌作用が強い）</td></tr><tr><td>e フルオロキノロン</td><td>○（使用しない）</td><td>標準レジメンに含まない→使用すると耐性菌を誘導するリスクがある</td></tr></table></div>',

"q263": '<div class="eb ee"><h4>□ 選択肢評価（ステロイド効果を減弱させる抗結核薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ピラジナミド（PZA）</td><td>×</td><td>CYP誘導作用はない（副作用：肝障害・高尿酸血症）</td></tr><tr><td>b イソニアジド（INH）</td><td>×</td><td>CYP誘導作用はない（むしろCYPを軽度阻害）</td></tr><tr><td>c リファンピシン（RFP）</td><td>○</td><td>強力なCYP3A4誘導薬→ステロイド代謝↑→血中濃度↓→効果減弱</td></tr><tr><td>d エタンブトール（EB）</td><td>×</td><td>CYP誘導作用はない（副作用：視神経障害）</td></tr></table></div>',

"q264": '<div class="eb ee"><h4>□ 選択肢評価（結核疑い患者への医療者の感染対策）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 手袋を着用する</td><td>×</td><td>手袋は接触感染予防（結核は空気感染→手袋では防げない）</td></tr><tr><td>b 聴診器を患児専用にする</td><td>×</td><td>接触感染予防（空気感染する結核では優先度が低い）</td></tr><tr><td>c トイレでの採痰を指示</td><td>×</td><td>トイレは換気が悪く感染リスク大→指定の採痰ブースを使用</td></tr><tr><td>d 医療従事者はN95マスク着用</td><td>○</td><td>空気感染予防→N95マスクが必須（飛沫核を通過させないフィルタ機能）</td></tr></table></div>',

"q265": '<div class="eb ee"><h4>□ 選択肢評価（結核疑い患者来院時の最初の対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 保健所へ届ける</td><td>×</td><td>届出は確定診断後（まず感染拡大防止が優先）</td></tr><tr><td>b 特定機能病院に紹介</td><td>×</td><td>紹介前に感染対策が先（搬送中に感染リスク）</td></tr><tr><td>c 抗菌薬による治療開始</td><td>×</td><td>確定診断前に治療開始→検査結果に影響・耐性菌リスク</td></tr><tr><td>d 同居者・接触者の健診</td><td>×</td><td>接触者調査は保健所の業務→確定後に行う</td></tr><tr><td>e 患者にサージカルマスクを着用させる</td><td>○</td><td>飛沫核の飛散防止→他の患者・医療者への感染拡大を最初に防ぐ最優先行動</td></tr></table></div>',

"q266": '<div class="eb ee"><h4>□ 選択肢評価（診断のためまず行うべき検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胸部MRI</td><td>×</td><td>画像診断（確定診断には不十分・コスト高）</td></tr><tr><td>b FDG-PET</td><td>×</td><td>悪性腫瘍のスタジング→結核の第一選択検査でない</td></tr><tr><td>c 呼吸機能検査</td><td>×</td><td>機能評価（感染症の診断ではない）</td></tr><tr><td>d 喀痰塗抹検査</td><td>○</td><td>迅速（当日結果）・感染性確認・隔離判断→結核診断の第一歩</td></tr></table></div>',

"q267": '<div class="eb ee"><h4>□ 選択肢評価（抗菌薬無効・空洞性陰影で最も有用な検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a IGRA</td><td>×</td><td>感染既往の確認（確定診断にはならない）</td></tr><tr><td>b 喀痰抗酸菌PCR法</td><td>○</td><td>当日〜翌日に結核菌とNTMを鑑別できる→抗菌薬無効例で迅速確定が必要</td></tr><tr><td>c 喀痰塗抹検査</td><td>×</td><td>抗酸菌の存在確認はできるが菌種の鑑別はできない</td></tr><tr><td>d 喀痰嫌気培養</td><td>×</td><td>嫌気性菌（誤嚥性肺炎等）→結核・NTMは好気性菌</td></tr></table></div>',

"q268": '<div class="eb ee"><h4>□ 選択肢評価（頸部リンパ節から抗酸菌検出→投与薬剤）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗真菌薬</td><td>×</td><td>真菌感染（カンジダ等）→抗酸菌感染には無効</td></tr><tr><td>b 抗結核薬</td><td>○</td><td>リンパ節から抗酸菌検出→結核性リンパ節炎→INH+RFP+PZA±EBで治療</td></tr><tr><td>c 抗悪性腫瘍薬</td><td>×</td><td>悪性リンパ腫・転移性リンパ節腫脹→今回は感染症が原因</td></tr><tr><td>d ペニシリン系抗菌薬</td><td>×</td><td>細菌（連鎖球菌等）→抗酸菌には無効</td></tr></table></div>',

"q269": '<div class="eb ee"><h4>□ 選択肢評価（結核検査の適切な対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 痰が出ないときは胃液を採取</td><td>○</td><td>乳幼児・喀痰が出せない患者→早朝空腹時胃液に菌が混入→培養可能</td></tr><tr><td>b 白血球増多→結核の可能性低い</td><td>×</td><td>結核は白血球変化が軽微だが著明な増多でも結核を否定できない</td></tr><tr><td>c ツ反陽性→直ちに治療</td><td>×</td><td>ツ反陽性は感染既往の証拠→未発症なら潜在性結核を検討（直ちに治療でない）</td></tr><tr><td>d 気管支ファイバーで採痰→隔離判断</td><td>×</td><td>塗抹検査で隔離判断（気管支鏡は侵襲的・感染リスク大）</td></tr></table></div>',

"q270": '<div class="eb ee"><h4>□ 選択肢評価（ZN陽性・PCR陰性・NTM培養陽性）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 粟粒結核</td><td>×</td><td>結核菌PCR陰性→粟粒結核ではない</td></tr><tr><td>b 過敏性肺炎</td><td>×</td><td>抗原吸入による免疫反応（感染症ではない）→培養では確認されない</td></tr><tr><td>c 非結核性抗酸菌症</td><td>○</td><td>ZN陽性＋結核菌PCR陰性＋NTM培養陽性→NTM症の診断基準を満たす</td></tr><tr><td>d マイコプラズマ肺炎</td><td>×</td><td>マイコプラズマはZN染色で陽性にならない（細胞壁なし）</td></tr></table></div>',

"q271": '<div class="eb ee"><h4>□ 選択肢評価（患者・医療者・家族のマスク選択）</h4><table class="tb"><tr><th>対象</th><th>適切なマスク</th><th>根拠</th></tr><tr><td>患者（結核感染者）</td><td>サージカルマスク</td><td>飛沫核の飛散を抑制（N95は患者には不要）</td></tr><tr><td>医療従事者</td><td>N95マスク</td><td>飛沫核（直径5μm以下）を吸入しないため→サージカルマスクでは不十分</td></tr><tr><td>家族（濃厚接触者）</td><td>N95マスク</td><td>濃厚接触→吸入リスク大→N95が推奨</td></tr></table></div>',

"q272": '<div class="eb ee"><h4>□ 選択肢評価（塗抹陽性入院後にまず行うこと）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 保健所に届け出る</td><td>×</td><td>届出は結核確定診断後→PCRで確認してから</td></tr><tr><td>b 抗結核薬を投与する</td><td>×</td><td>治療開始は確定診断後（NTMの可能性排除のためPCRが先）</td></tr><tr><td>c 結核菌のPCR検査を行う</td><td>○</td><td>塗抹陽性→結核かNTMかをPCRで迅速鑑別→確定後に届出・治療開始</td></tr><tr><td>d 患者にN95マスク着用させる</td><td>×</td><td>N95は医療従事者用（患者にはサージカルマスク）</td></tr></table></div>',

"q273": '<div class="eb ee"><h4>□ 選択肢評価（結核疑い患者来院時にまず行うこと）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 喀痰Gram染色を行う</td><td>×</td><td>細菌性肺炎には有用だが感染対策が最優先</td></tr><tr><td>b 胸部単純CTを予約する</td><td>×</td><td>画像診断の前に感染拡大防止が先</td></tr><tr><td>c 喀痰細胞診を依頼する</td><td>×</td><td>悪性腫瘍の診断→感染対策より後回し</td></tr><tr><td>d 医療従事者が手袋を装着する</td><td>×</td><td>接触感染予防（空気感染が主の結核には優先度低い）</td></tr><tr><td>e 患者にサージカルマスクを着用させる</td><td>○</td><td>飛沫核の飛散防止→他の患者・医療者への感染拡大を最初に防ぐ</td></tr></table></div>',

"q274": '<div class="eb ee"><h4>□ 選択肢評価（BCG接種3日前からの発赤・膿疱）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 通常の反応で検査・処置不要</td><td>×</td><td>BCG接種の3日「前」からの発赤→接種前の反応は既感染（コッホ現象前の変化）を示唆→精査必要</td></tr><tr><td>b 1週後に再受診</td><td>×</td><td>経過観察のみでは不十分→精査が必要</td></tr><tr><td>c 膿を採取して顕微鏡検査</td><td>×</td><td>即時判断はできるが感染の確認には培養が優れる</td></tr><tr><td>d 膿を採取して培養検査</td><td>○</td><td>接種部位の膿を培養→M.bovisやM.tuberculosisの同定→感染の有無を確認</td></tr></table></div>',

"q275": '<div class="eb ee"><h4>□ 選択肢評価（入院隔離が必須な肺結核患者）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 喀痰塗抹染色陽性</td><td>○</td><td>多量の菌を排菌→感染性が高い→陰圧個室入院・空気感染予防策が必須</td></tr><tr><td>b 喀痰培養陽性</td><td>×</td><td>少量の菌排菌（塗抹陰性）→感染性低い→外来DOTS管理可能</td></tr><tr><td>c 培養コロニーPCR陽性</td><td>×</td><td>培養の同定検査→塗抹陰性の場合は感染性低い</td></tr><tr><td>d ツベルクリン反応強陽性</td><td>×</td><td>感染既往・免疫反応の強さ（感染性・排菌量とは無関係）</td></tr></table></div>',

"q276": '<div class="eb ee"><h4>□ 選択肢評価（MAC症の治療薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>×</td><td>PCP・ノカルジア治療薬（抗酸菌には無効）</td></tr><tr><td>b ペニシリンG</td><td>×</td><td>梅毒・A群連鎖球菌（抗酸菌には無効）</td></tr><tr><td>c オセルタミビル</td><td>×</td><td>インフルエンザウイルス（抗ウイルス薬→抗酸菌には無効）</td></tr><tr><td>d アムホテリシンB</td><td>×</td><td>抗真菌薬（カンジダ・アスペルギルス等→抗酸菌には無効）</td></tr><tr><td>e クラリスロマイシン</td><td>○</td><td>MACの中心的治療薬（＋EB+RFPの3剤が標準レジメン）</td></tr></table></div>',

"q277": '<div class="eb ee"><h4>□ 選択肢評価（リスク因子＋両上葉空洞の起因菌）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 緑膿菌</td><td>×</td><td>気管支拡張症・COPD患者に多い（慢性3か月の経過と異なる）</td></tr><tr><td>b 結核菌</td><td>○</td><td>両上葉空洞＋盗汗・体重減少＋路上生活歴・過剰飲酒→結核の典型的プレゼンテーション</td></tr><tr><td>c 肺炎球菌</td><td>×</td><td>急性（数日）の肺炎・菌血症（慢性3か月の経過と合わない）</td></tr><tr><td>d 肺炎桿菌</td><td>×</td><td>糖尿病・アルコール依存症が背景だが急性肺炎が多い</td></tr></table></div>',

"q278": '<div class="eb ee"><h4>□ 選択肢評価（人工培地で発育しない菌）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a M.tuberculosis（結核菌）</td><td>×（発育する）</td><td>小川培地・MGIT液体培地で発育（2〜8週）</td></tr><tr><td>b M.kansasii</td><td>×（発育する）</td><td>NTMの一種→人工培地で発育可能</td></tr><tr><td>c M.avium</td><td>×（発育する）</td><td>MAC→培養可能</td></tr><tr><td>d M.intracellulare</td><td>×（発育する）</td><td>MAC→培養可能</td></tr><tr><td>e M.leprae（らい菌）</td><td>○（発育しない）</td><td>人工培地での培養が不可能→アルマジロ足蹠での増殖が必要</td></tr></table></div>',

"q279": '<div class="eb ee"><h4>□ 選択肢評価（行うべき検査2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胸膜生検</td><td>×</td><td>胸膜病変→肺浸潤影の診断には不適</td></tr><tr><td>b 呼吸機能検査</td><td>×</td><td>肺機能評価（感染症の確定診断には使わない）</td></tr><tr><td>c 喀痰塗抹検査</td><td>○</td><td>感染性確認・菌の検出（抗酸菌含む）→肺浸潤影で最初に行う</td></tr><tr><td>d 肺シンチグラフィ</td><td>×</td><td>肺血栓塞栓症の診断（感染症の確定診断には使わない）</td></tr><tr><td>e 気管支鏡下肺生検</td><td>○</td><td>喀痰陰性例の確定診断・組織培養・ZN染色→浸潤影の原因菌同定に有用</td></tr></table></div>',
}

def inject_ee(html_content, ee_data):
    cards_injected = 0

    def replace_card(m):
        nonlocal cards_injected
        card_html = m.group(0)
        qid_match = re.search(r'id="(q\d+)"', card_html)
        if not qid_match:
            return card_html
        qid = qid_match.group(1)
        if qid not in ee_data:
            return card_html
        if 'class="eb ee"' in card_html:
            return card_html
        ee_html = ee_data[qid]
        insert_marker = '</div></div></div></div>'
        pos = card_html.rfind(insert_marker)
        if pos == -1:
            return card_html
        cards_injected += 1
        return card_html[:pos] + ee_html + insert_marker

    result = re.sub(
        r'<div class="qc"[^>]*>.*?(?=<div class="qc"|$)',
        replace_card,
        html_content,
        flags=re.DOTALL
    )
    print(f"Injected: {cards_injected}")
    return result

path = r'C:\Users\coool\Desktop\MEC\感染症\ch05_kansen_ntm.html'
with open(path, encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee(content, EE)

ep_count = len(re.findall(r'class="[^"]*\bep\b[^"]*"', new_content))
ee_count = len(re.findall(r'class="[^"]*\bee\b[^"]*"', new_content))
print(f"ep={ep_count} ee={ee_count}")

# Show missing
cards = re.findall(r'<div class="qc" id="(q\d+)">', new_content)
missing = []
for qid in cards:
    card_match = re.search(f'<div class="qc" id="{qid}">(.*?)(?=<div class="qc"|$)', new_content, re.DOTALL)
    if card_match and 'class="eb ee"' not in card_match.group(1):
        missing.append(qid)
print(f"Missing ee: {missing}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done ch05")
