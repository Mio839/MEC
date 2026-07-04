import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q280": '<div class="eb ee"><h4>□ 選択肢評価（HIVが主に感染する細胞）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 好酸球</td><td>×</td><td>CD4を発現しない→HIVの標的でない</td></tr><tr><td>b 好中球</td><td>×</td><td>CD4を発現しない→HIVの標的でない</td></tr><tr><td>c 好塩基球</td><td>×</td><td>CD4を発現しない→HIVの標的でない</td></tr><tr><td>d リンパ球（CD4陽性Tリンパ球）</td><td>○</td><td>CD4がHIVの受容体→CD4陽性T細胞・マクロファージ・樹状細胞が標的</td></tr></table></div>',

"q281": '<div class="eb ee"><h4>□ 選択肢評価（空洞内腫瘤影の疾患）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a カンジダ症</td><td>×</td><td>カンジダは主に口腔・食道・膀胱（空洞内の球状陰影は典型でない）</td></tr><tr><td>b アスペルギルス症</td><td>○</td><td>アスペルギローマ（fungus ball）：陳旧性空洞内に菌塊→CT: air crescent sign→血痰</td></tr><tr><td>c クリプトコックス症</td><td>×</td><td>単発結節影や浸潤影（空洞内の球状菌塊は典型でない）</td></tr><tr><td>d ニューモシスチス肺炎</td><td>×</td><td>両側びまん性すりガラス影が典型（空洞内腫瘤ではない）</td></tr></table></div>',

"q282": '<div class="eb ee"><h4>□ 選択肢評価（HBV針刺し・HBs抗体十分）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 経過観察</td><td>○</td><td>HBs抗体≧10 mIU/mL（十分な免疫あり）→追加処置不要・経過観察のみ</td></tr><tr><td>b HBワクチン接種</td><td>×</td><td>抗体価が十分な場合は追加ワクチン不要</td></tr><tr><td>c 核酸アナログ製剤投与</td><td>×</td><td>HBV感染治療薬（曝露後予防には使わない）</td></tr><tr><td>d 抗HBsヒト免疫グロブリン投与</td><td>×</td><td>HBIGは未接種・非免疫者への曝露後予防（免疫ありの場合は不要）</td></tr></table></div>',

"q283": '<div class="eb ee"><h4>□ 選択肢評価（PCP確定診断に有用な染色法）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Gram染色</td><td>×</td><td>細菌の染色（Pneumocystis jiroveciiはGram染色で見えない）</td></tr><tr><td>b Grocott染色（六価銀染色）</td><td>○</td><td>真菌の細胞壁を黒〜褐色に染色→PCP嚢子の確認に最適</td></tr><tr><td>c Congo-Red染色</td><td>×</td><td>アミロイドの染色</td></tr><tr><td>d Papanicolaou染色</td><td>×</td><td>細胞診の染色（がん細胞の形態確認）</td></tr></table></div>',

"q284": '<div class="eb ee"><h4>□ 選択肢評価（PCPのリスクファクター）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 性別</td><td>×</td><td>PCPリスクと無関係（男女差なし）</td></tr><tr><td>b 年齢</td><td>×</td><td>PCPリスクと無関係（年齢より免疫状態が重要）</td></tr><tr><td>c 耐糖能異常</td><td>×</td><td>糖尿病はPCPの直接的リスクではない</td></tr><tr><td>d ワクチン接種</td><td>×</td><td>ワクチン接種はPCPリスクと無関係</td></tr><tr><td>e 副腎皮質ステロイド投与</td><td>○</td><td>プレドニゾロン≧20mg/日×4週以上→細胞性免疫低下→PCP発症リスク</td></tr></table></div>',

"q285": '<div class="eb ee"><h4>□ 選択肢評価（マスク5L分酸素・挿管拒否時の対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 気管切開</td><td>×</td><td>侵襲的（患者が挿管を拒否→気管切開も拒否と解釈）</td></tr><tr><td>b 気管挿管</td><td>×</td><td>患者が挿管を希望しない</td></tr><tr><td>c 輪状甲状靱帯切開</td><td>×</td><td>気道閉塞の緊急気道確保（今回は上気道閉塞ではない）</td></tr><tr><td>d ネーザルハイフローによる酸素投与</td><td>○</td><td>HFNC：最大60L/分の高流量酸素→FiO2を正確に設定・挿管回避が可能</td></tr></table></div>',

"q286": '<div class="eb ee"><h4>□ 選択肢評価（PCP治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤の経口投与</td><td>○</td><td>PCP第一選択（軽〜中等症：経口、重症：点滴）→21日間投与</td></tr><tr><td>b メロペネムの点滴静注</td><td>×</td><td>カルバペネム系→細菌性感染症（PCP＝真菌感染に無効）</td></tr><tr><td>c ボリコナゾールの点滴静注</td><td>×</td><td>アゾール系抗真菌薬→アスペルギルス症が適応（PCP Pneumocystisはアゾール無効）</td></tr><tr><td>d レボフロキサシンの点滴静注</td><td>×</td><td>ニューキノロン系→細菌性感染症（PCP真菌に無効）</td></tr></table></div>',

"q287": '<div class="eb ee"><h4>□ 選択肢評価（急性HIV感染症の診断検査2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 咽頭培養</td><td>×</td><td>細菌・連鎖球菌の培養→HIVの診断には使わない</td></tr><tr><td>b 血液培養</td><td>×</td><td>細菌血症の診断→HIVには使わない</td></tr><tr><td>c 血中HIV RNA定量検査</td><td>○</td><td>急性HIV感染（ウィンドウ期）→抗体陰性でもRNA定量で検出可能</td></tr><tr><td>d CD4陽性Tリンパ球数測定</td><td>×</td><td>免疫状態の評価（確定診断ではない・ウィンドウ期には変化少ない）</td></tr><tr><td>e HIV Western blot法</td><td>○</td><td>スクリーニング陽性後の確認検査→偽陽性除外</td></tr></table></div>',

"q288": '<div class="eb ee"><h4>□ 選択肢評価（HIV患者PCP・呼吸状態の評価）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a A-aDO2は開大している</td><td>○</td><td>PCP（間質性肺炎）→拡散障害→A-aDO2（肺胞-動脈血酸素分圧較差）が開大</td></tr><tr><td>b CO2ナルコーシスである</td><td>×</td><td>CO2ナルコーシスはCOPD等の低換気→PCP患者は過換気傾向（CO2低下）</td></tr><tr><td>c 直ちに気管挿管を実施する</td><td>×</td><td>まずST合剤±ステロイドで治療・HFNC等も考慮→直ちに挿管は過剰</td></tr><tr><td>d 肺胞低換気が低酸素血症の原因</td><td>×</td><td>肺胞低換気→CO2貯留・換気不足（PCP＝拡散障害が主体）</td></tr></table></div>',

"q289": '<div class="eb ee"><h4>□ 選択肢評価（空気感染予防策で想定される検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 喀痰Gram染色</td><td>×</td><td>細菌（一般肺炎）を想定した検査（空気感染は細菌性肺炎ではない）</td></tr><tr><td>b 喀痰Grocott染色</td><td>×</td><td>真菌（PCP等）を想定（真菌は通常空気感染予防策は不要）</td></tr><tr><td>c 喀痰Ziehl-Neelsen染色</td><td>○</td><td>空気感染予防策（陰圧個室＋N95）→結核を想定→ZN染色で抗酸菌確認</td></tr><tr><td>d 血中β-D-グルカン測定</td><td>×</td><td>真菌感染のマーカー（空気感染予防策の想定感染症ではない）</td></tr></table></div>',

"q290": '<div class="eb ee"><h4>□ 選択肢評価（HIV感染症の初回ART）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a プロテアーゼ阻害薬1剤</td><td>×</td><td>単剤は禁忌→耐性ウイルスが速やかに出現する</td></tr><tr><td>b 核酸系逆転写酵素阻害薬2種類</td><td>×</td><td>2剤では不十分→3剤以上が必須</td></tr><tr><td>c 核酸系逆転写酵素阻害薬3種類</td><td>×</td><td>旧来のレジメン→現在はINSTI＋NRTI 2剤が標準</td></tr><tr><td>d インテグラーゼ阻害薬1種類＋NRTI 2種類</td><td>○</td><td>現在の標準初回治療：INSTI（例：ドルテグラビル）＋NRTI 2剤（テノフォビル＋エムトリシタビン）</td></tr></table></div>',

"q291": '<div class="eb ee"><h4>□ 選択肢評価（嚥下困難・上部消化管内視鏡所見）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Barrett食道</td><td>×</td><td>GERD長期経過→食道下部の円柱上皮化生（白苔は典型でない）</td></tr><tr><td>b 逆流性食道炎</td><td>×</td><td>胸焼け・胃酸逆流が主症状→白苔は典型でない</td></tr><tr><td>c 好酸球性食道炎</td><td>×</td><td>縦走溝・輪状狭窄が特徴的（白苔は典型でない）</td></tr><tr><td>d 食道アカラシア</td><td>×</td><td>食道下部括約筋弛緩不全→鳥の嘴様狭窄（白苔は典型でない）</td></tr><tr><td>e 食道カンジダ症</td><td>○</td><td>白色偽膜（チーズ様白苔）→高齢・免疫低下・ステロイド使用→フルコナゾール治療</td></tr></table></div>',

"q292": '<div class="eb ee"><h4>□ 選択肢評価（6か月乳児・多呼吸の原因微生物）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a カンジダ</td><td>×</td><td>口腔・食道（肺炎は免疫正常の乳児には稀）</td></tr><tr><td>b リステリア</td><td>×</td><td>新生児髄膜炎・食中毒（5か月乳児の肺炎には典型でない）</td></tr><tr><td>c クラミジア</td><td>×</td><td>新生児肺炎（生後2〜12週）→5か月での発症は時期が遅い</td></tr><tr><td>d ニューモシスチス</td><td>○</td><td>母子感染HIV→CD4低下→生後3〜6か月に乳児PCP発症（咳嗽・多呼吸・SpO2低下）</td></tr></table></div>',

"q293": '<div class="eb ee"><h4>□ 選択肢評価（IPF急性増悪・ステロイド大量投与中の起因微生物）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺結核症</td><td>×</td><td>結核は慢性経過・高熱・空洞形成が多い（ステロイド投与中でも起こるがCMVが優先）</td></tr><tr><td>b 肺ムーコル症</td><td>×</td><td>好中球減少・DKA等の代謝異常（今回は好中球減少より免疫抑制）</td></tr><tr><td>c ニューモシスチス肺炎</td><td>×</td><td>PCPも起こりうるが、ステロイド大量・高齢・IPF急性増悪ではCMVが最も多い</td></tr><tr><td>d 肺クリプトコックス症</td><td>×</td><td>クリプトコックスは軽度免疫低下・慢性経過（IPF急性増悪との合併は稀）</td></tr><tr><td>e サイトメガロウイルス（CMV）肺炎</td><td>○</td><td>ステロイド大量投与→CMV潜伏感染が再活性化→CMVアンチゲネミアで診断→ガンシクロビル治療</td></tr></table></div>',

"q294": '<div class="eb ee"><h4>□ 選択肢評価（SIRSの基準を満たす所見3つ）</h4><table class="tb"><tr><th>選択肢</th><th>SIRS基準</th><th>根拠</th></tr><tr><td>a 体温</td><td>○</td><td>38℃超または36℃未満がSIRS基準（体温異常）</td></tr><tr><td>b 血圧</td><td>×</td><td>血圧はSIRS基準に含まれない（ショックの指標）</td></tr><tr><td>c 呼吸数</td><td>○</td><td>呼吸数>20回/分またはPaCO2&lt;32mmHgがSIRS基準</td></tr><tr><td>d CRP値</td><td>×</td><td>CRPはSIRS基準に含まれない（炎症マーカーだが基準外）</td></tr><tr><td>e 白血球数</td><td>○</td><td>12,000/mm³超または4,000/mm³未満または桿状核球>10%がSIRS基準</td></tr></table></div>',

"q295": '<div class="eb ee"><h4>□ 選択肢評価（ペニシリン感受性肺炎球菌・抗菌薬管理）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a メロペネムを追加投与</td><td>×</td><td>ペニシリン感受性→カルバペネム追加は過剰治療</td></tr><tr><td>b バンコマイシンを追加投与</td><td>×</td><td>バンコマイシンはMRSA・VRE用（今回は不要）</td></tr><tr><td>c セフトリアキソン単独投与を継続</td><td>○</td><td>感受性確認→現在の治療を継続（デエスカレーション完了）</td></tr><tr><td>d セフトリアキソンをメロペネムに変更</td><td>×</td><td>エスカレーション（感受性があるのに変更する必要なし）</td></tr></table></div>',

"q296": '<div class="eb ee"><h4>□ 選択肢評価（HIV感染後・日和見感染スクリーニング2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗風疹IgM抗体</td><td>×</td><td>風疹急性感染の確認（HIV日和見感染とは無関係）</td></tr><tr><td>b 抗ムンプスIgM抗体</td><td>×</td><td>流行性耳下腺炎急性感染（HIV日和見感染とは無関係）</td></tr><tr><td>c サイトメガロウイルス抗原（CMVアンチゲネミア）</td><td>○</td><td>CMV再活性化の早期検出→網膜炎・肺炎・食道炎の原因となる日和見感染</td></tr><tr><td>d 抗トキソプラズマIgM抗体</td><td>○</td><td>トキソプラズマ再活性化→脳炎・眼炎→免疫低下時に顕性感染→IgMで現症確認</td></tr></table></div>',

"q297": '<div class="eb ee"><h4>□ 選択肢評価（クリプトコックス症に関する正しい記述）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 内因性感染である</td><td>×</td><td>Cryptococcus neoformansは鳩の糞に多い→外因性感染（環境から吸入）</td></tr><tr><td>b 血清抗原検査の感度は高い</td><td>○</td><td>血清莢膜抗原検査（ラテックス凝集法）→感度・特異度ともに高い（95%以上）</td></tr><tr><td>c 血清β-D-グルカン値は上昇する</td><td>×</td><td>β-D-グルカン→アスペルギルス・カンジダ・PCP→クリプトコックスでは莢膜に覆われ陰性</td></tr><tr><td>d ST合剤の内服で予防できる</td><td>×</td><td>ST合剤予防→PCP予防（クリプトコックス予防はフルコナゾール：CD4&lt;100）</td></tr></table></div>',

"q298": '<div class="eb ee"><h4>□ 選択肢評価（Bayes定理による事後確率の計算）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 41%</td><td>×</td><td>計算誤り（LR+＝3での事後確率は75%）</td></tr><tr><td>b 50%</td><td>×</td><td>事前確率のまま変化がない（LR+＝1の場合）</td></tr><tr><td>c 62%</td><td>×</td><td>計算誤り</td></tr><tr><td>d 75%</td><td>○</td><td>事前オッズ＝1 × LR+3＝事後オッズ3→事後確率3/(3+1)＝75%</td></tr></table></div>',

"q299": '<div class="eb ee"><h4>□ 選択肢評価（針刺し後に誤った血液検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a HA抗体</td><td>○（誤り）</td><td>HAV（A型肝炎）は経口・糞口感染→針刺しでは感染しない→検査は不要</td></tr><tr><td>b HBs抗原</td><td>正しい</td><td>HBVは針刺しで感染（感染率6〜30%）→患者のHBs抗原確認が必要</td></tr><tr><td>c HBs抗体</td><td>正しい</td><td>医療者のHBs抗体（免疫）の有無を確認→HBV予防策の選択に必須</td></tr><tr><td>d HCV抗体</td><td>正しい</td><td>HCVは針刺しで感染（感染率0.5〜1.8%）→患者のHCV抗体確認が必要</td></tr></table></div>',

"q300": '<div class="eb ee"><h4>□ 選択肢評価（Tリンパ球機能低下の日和見感染「でないもの」）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 粟粒結核</td><td>T細胞免疫低下あり</td><td>結核菌は細胞内寄生→細胞性免疫（T細胞）が主要防御機構</td></tr><tr><td>b 食道カンジダ症</td><td>T細胞免疫低下あり</td><td>AIDS指標疾患→CD4低下→カンジダ日和見感染</td></tr><tr><td>c 肺炎球菌性肺炎</td><td>○（T細胞と無関係）</td><td>肺炎球菌は莢膜多糖体に対する抗体（液性免疫・Bリンパ球）で防御→T細胞とは主に別機序</td></tr><tr><td>d ニューモシスチス肺炎</td><td>T細胞免疫低下あり</td><td>CD4&lt;200で発症→T細胞免疫の低下が直接の発症要因</td></tr></table></div>',

"q301": '<div class="eb ee"><h4>□ 選択肢評価（HBs抗体陰性・HBV患者針刺し）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 無投薬</td><td>×</td><td>抗体なし→感染リスク最大→無投薬は不適切</td></tr><tr><td>b HBワクチン単独投与</td><td>×</td><td>ワクチン単独→免疫獲得に時間がかかる→急性HBV感染を防げない</td></tr><tr><td>c 核酸アナログ製剤の投与</td><td>×</td><td>HBV治療薬（曝露後予防としての有効性はない）</td></tr><tr><td>d 抗HBsヒト免疫グロブリン単独投与</td><td>×</td><td>HBIG単独では長期的な予防効果がない</td></tr><tr><td>e HBワクチン＋抗HBsヒト免疫グロブリン</td><td>○</td><td>72時間以内に同時投与→HBIGで即時の受動免疫、ワクチンで長期の能動免疫</td></tr></table></div>',

"q302": '<div class="eb ee"><h4>□ 選択肢評価（HIV患者・PCP診断を支持する検査所見）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a KL-6正常</td><td>×</td><td>KL-6→間質性肺炎の活動性指標→PCP活動期は上昇する（正常なら活動性低い）</td></tr><tr><td>b 尿中抗原の陽性</td><td>×</td><td>尿中抗原→レジオネラ・肺炎球菌の迅速診断（PCPには使わない）</td></tr><tr><td>c β-D-グルカン高値</td><td>○</td><td>PCP・アスペルギルス・カンジダで上昇→HIV患者の乾性咳嗽＋SpO2低下でPCP診断補助</td></tr><tr><td>d 喀痰の培養検査で原因微生物を同定</td><td>×</td><td>Pneumocystis jiroveciiは人工培地で発育しない→培養では同定不可</td></tr></table></div>',

"q303": '<div class="eb ee"><h4>□ 選択肢評価（HIV陽性患者体液曝露後の対応）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 尿付着皮膚を流水で洗浄させる</td><td>×</td><td>尿中HIVウイルス量は少ない→洗浄は重要だが優先順位は低い</td></tr><tr><td>b 尿付着皮膚に外傷がないか確認</td><td>×</td><td>確認は必要だが最優先ではない</td></tr><tr><td>c 患者の血液が付着していないか確認</td><td>×</td><td>重要な確認だが、曝露確認後の対応（PEP開始）が優先</td></tr><tr><td>d 直ちに抗HIV薬の内服を開始させる</td><td>○</td><td>PEP（曝露後予防）は2時間以内（最大72時間以内）の開始が重要→28日間継続</td></tr></table></div>',

"q304": '<div class="eb ee"><h4>□ 選択肢評価（HIV検査に関する正しい記述3つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 医師がHIV感染症を疑う症状・所見があれば保険診療となる</td><td>○</td><td>医師がHIVを疑い検査を実施する場合→保険診療が適用される</td></tr><tr><td>b スクリーニング検査の結果は実施の2週後</td><td>×</td><td>スクリーニング結果は翌日〜数日後（2週後は誤り）</td></tr><tr><td>c スクリーニング検査は保健所において匿名で受けることができる</td><td>○</td><td>保健所：匿名・無料でHIV検査が可能</td></tr><tr><td>d スクリーニング検査は保健所において無料で受けることができる</td><td>○</td><td>保健所：匿名・無料でHIV検査が可能</td></tr></table></div>',

"q305": '<div class="eb ee"><h4>□ 選択肢評価（臨床実習前医学生への相談）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a BCG接種が必要</td><td>×</td><td>BCGは出生時に接種済み（追加接種は通常不要）</td></tr><tr><td>b MRワクチンの再接種が必要</td><td>×</td><td>麻疹・風疹は重要だが今の文脈では別の話題</td></tr><tr><td>c 帯状疱疹になる可能性が高い</td><td>×</td><td>帯状疱疹リスクは高齢・免疫低下者（若い医学生が主なリスクではない）</td></tr><tr><td>d B型肝炎ワクチンの接種状況を確認</td><td>○</td><td>医療従事者・医学生は血液・体液接触前にHBワクチン接種とHBs抗体価確認が必須</td></tr></table></div>',

"q306": '<div class="eb ee"><h4>□ 選択肢評価（研修医が救急針刺し後に最も注意すべき感染症）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a HIV</td><td>○</td><td>HBVは入職時ワクチン接種済み（免疫あり）→残るリスクはHIV（PEP必要）・HCV</td></tr><tr><td>b HBV</td><td>×</td><td>ワクチン接種済みで免疫あり→針刺し感染率は高いが予防済み</td></tr><tr><td>c HCV</td><td>×</td><td>針刺し感染率0.5〜1.8%（有効なPEPなし）→重要だが免疫がないHIVが優先</td></tr><tr><td>d 梅毒</td><td>×</td><td>針刺しでの梅毒感染は理論上あるが稀</td></tr></table></div>',

"q307": '<div class="eb ee"><h4>□ 選択肢評価（HIV患者PCP・呼吸障害の主たる病態）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 換気血流比不均衡</td><td>×</td><td>肺塞栓・細菌性肺炎で主体（PCPは拡散障害が主）</td></tr><tr><td>b 呼吸筋疲労</td><td>×</td><td>神経筋疾患・重症COPD（PCPでは一般に起こらない）</td></tr><tr><td>c 上気道閉塞</td><td>×</td><td>喉頭癌・アナフィラキシー等（PCPとは無関係）</td></tr><tr><td>d 肺拡散能障害</td><td>○</td><td>PCP（間質性肺炎）→間質への滲出・線維化→DLCO↓・A-aDO2開大が主病態</td></tr></table></div>',

"q308": '<div class="eb ee"><h4>□ 選択肢評価（BAL検体のPCP診断に有用な染色法）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Gram染色</td><td>×</td><td>細菌の染色（Pneumocystisは細菌でない）</td></tr><tr><td>b Grocott染色（六価銀染色）</td><td>○</td><td>真菌の細胞壁を黒〜褐色に染色→PCP嚢子の確認に最適</td></tr><tr><td>c HE染色</td><td>×</td><td>組織の一般染色（真菌の詳細同定には向かない）</td></tr><tr><td>d Papanicolaou染色</td><td>×</td><td>細胞診（がん細胞の形態確認）</td></tr></table></div>',

"q309": '<div class="eb ee"><h4>□ 選択肢評価（口腔内の紫紅色隆起性病変）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 白板症</td><td>×</td><td>境界明瞭な白色病変（前癌病変）→紫紅色の隆起性病変とは異なる</td></tr><tr><td>b 乳頭腫</td><td>×</td><td>HPV感染→単発・有茎性白色病変（紫紅色の多発病変とは異なる）</td></tr><tr><td>c Kaposi肉腫</td><td>○</td><td>HHV-8感染＋AIDS→紫紅色〜暗褐色の斑・丘疹・腫瘤→口腔・口蓋・歯肉に好発</td></tr><tr><td>d ヘルペス性舌炎</td><td>×</td><td>痛みのある水疱・潰瘍（紫紅色隆起性病変とは異なる）</td></tr></table></div>',

"q310": '<div class="eb ee"><h4>□ 選択肢評価（肺アスペルギルス症→膿胸の治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 心囊穿刺</td><td>×</td><td>心囊液貯留への処置（今回は胸腔の問題）</td></tr><tr><td>b 陽圧呼吸管理</td><td>×</td><td>陽圧をかけると胸腔内圧↑→ドレナージ前に陽圧は危険</td></tr><tr><td>c 胸腔鏡下手術</td><td>×</td><td>ドレナージ不十分な場合の次の手段（まずドレナージが優先）</td></tr><tr><td>d 胸腔ドレナージ</td><td>○</td><td>膿胸→胸腔ドレナージで排膿が最優先＋抗真菌薬（ボリコナゾール）継続</td></tr></table></div>',

"q311": '<div class="eb ee"><h4>□ 選択肢評価（HIV患者のART選択前に重要な確認事項）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 飲酒歴</td><td>×</td><td>HIV治療選択には直接関係しない</td></tr><tr><td>b 喫煙歴</td><td>×</td><td>HIV治療選択には直接関係しない</td></tr><tr><td>c B型肝炎の合併</td><td>○</td><td>HBV共感染→テノフォビル（TDF/TAF）含むARTが有効→HBVに効く薬剤の中断でHBV急性増悪リスク</td></tr><tr><td>d 口唇ヘルペスの既往</td><td>×</td><td>HSV感染歴（ART選択には直接影響しない）</td></tr></table></div>',

"q312": '<div class="eb ee"><h4>□ 選択肢評価（HCV針刺し後の研修医へのアドバイス）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 今すぐワクチンを接種</td><td>×</td><td>HCVワクチンは存在しない（現在未承認）</td></tr><tr><td>b 今すぐガンマグロブリンを投与</td><td>×</td><td>HCVに有効な免疫グロブリン製剤はない</td></tr><tr><td>c C型肝炎を発症する確率は約20%</td><td>×</td><td>HCV針刺し感染率は約0.5〜1.8%（20%は誤り）</td></tr><tr><td>d 1週間後にC型肝炎ウイルス感染の有無の検査</td><td>○</td><td>曝露後1〜2週後にHCV RNA検査（早期検出）→4〜6週後・12週後にも追跡検査</td></tr></table></div>',

"q313": '<div class="eb ee"><h4>□ 選択肢評価（クリプトコックス髄膜炎の治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アシクロビル</td><td>×</td><td>抗ウイルス薬→HSV/VZV脳炎に使用（真菌には無効）</td></tr><tr><td>b アムホテリシンB</td><td>○</td><td>導入期（2週）：アムホテリシンB＋フルシトシン→地固め（8週）：フルコナゾール</td></tr><tr><td>c 副腎皮質ステロイド</td><td>×</td><td>クリプトコックス髄膜炎ではステロイドは禁忌（免疫をさらに抑制）</td></tr><tr><td>d 免疫グロブリン製剤</td><td>×</td><td>液性免疫補充（細菌感染に使用）→真菌感染には適応なし</td></tr></table></div>',

"q314": '<div class="eb ee"><h4>□ 選択肢評価（ST合剤で予防できる感染症）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Kaposi肉腫</td><td>×</td><td>ART開始で改善（ST合剤での予防はない）</td></tr><tr><td>b ニューモシスチス肺炎（PCP）</td><td>○</td><td>ST合剤1錠/日→PCP予防（CD4&lt;200/mm³で開始）</td></tr><tr><td>c クリプトコックス髄膜炎</td><td>×</td><td>フルコナゾール予防（CD4&lt;100）→ST合剤ではない</td></tr><tr><td>d サイトメガロウイルス網膜炎</td><td>×</td><td>ガンシクロビル予防（CD4&lt;50）→ST合剤ではない</td></tr></table></div>',

"q315": '<div class="eb ee"><h4>□ 選択肢評価（AIDS患者急性感染症で直ちに必要な治療3つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 輸液</td><td>○</td><td>発熱・下痢による脱水補正→まず循環動態を安定させる</td></tr><tr><td>b 抗菌薬投与</td><td>○</td><td>細菌感染・敗血症の可能性→広域抗菌薬で早期治療</td></tr><tr><td>c 抗真菌薬投与</td><td>○</td><td>カンジダ・クリプトコックス等の真菌感染も考慮→経験的投与</td></tr><tr><td>d 抗HIV薬投与</td><td>×</td><td>急性日和見感染中のART開始→IRIS（免疫再構築炎症症候群）リスク→感染コントロール後に開始</td></tr></table></div>',

"q316": '<div class="eb ee"><h4>□ 選択肢評価（T細胞性リンパ腫・化学療法中のPCP治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>○</td><td>PCP治療の第一選択（HIV関連でも非HIV関連でも同じ）→TMP 15〜20 mg/kg/日を21日間</td></tr><tr><td>b ペニシリン</td><td>×</td><td>細菌（連鎖球菌等）→Pneumocystisには無効</td></tr><tr><td>c レボフロキサシン</td><td>×</td><td>ニューキノロン→細菌性肺炎に使用（PCPには無効）</td></tr><tr><td>d エリスロマイシン</td><td>×</td><td>マクロライド→マイコプラズマ・クラミジア（PCPには無効）</td></tr></table></div>',

"q317": '<div class="eb ee"><h4>□ 選択肢評価（HIV患者の白血球分画で割合が減少しているもの）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 単球</td><td>×</td><td>単球（マクロファージ前駆体）→HIVで減少するが主役でない</td></tr><tr><td>b 好酸球</td><td>×</td><td>HIV感染で特に好酸球が減少する機序なし</td></tr><tr><td>c 好中球</td><td>×</td><td>HIV感染初期は好中球数は比較的保たれる</td></tr><tr><td>d 好塩基球</td><td>×</td><td>HIV感染で特に好塩基球が減少する機序なし</td></tr><tr><td>e リンパ球</td><td>○</td><td>HIVがCD4陽性Tリンパ球を破壊→リンパ球全体が減少（白血球分画でリンパ球↓）</td></tr></table></div>',

"q318": '<div class="eb ee"><h4>□ 選択肢評価（AIDS患者・CD4低下・肺病変の原因）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 結核菌</td><td>×</td><td>CD4&lt;200でも起こるが、典型的には両側びまん性すりガラス影ではなく空洞・浸潤影</td></tr><tr><td>b カンジダ</td><td>×</td><td>カンジダ肺炎は免疫正常者には起こらず、AIDSでも口腔・食道が主体</td></tr><tr><td>c トキソプラズマ</td><td>×</td><td>トキソプラズマ→脳炎が典型（肺炎もあるが稀）</td></tr><tr><td>d ニューモシスチス</td><td>○</td><td>CD4&lt;200→PCP最多→両側びまん性すりガラス影＋乾性咳嗽＋SpO2低下</td></tr></table></div>',

"q319": '<div class="eb ee"><h4>□ 選択肢評価（口腔カンジダ症の治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>×</td><td>PCP・ノカルジア治療（カンジダには無効）</td></tr><tr><td>b アシクロビル</td><td>×</td><td>抗ウイルス薬→HSV/VZV（カンジダ真菌には無効）</td></tr><tr><td>c イソニアジド</td><td>×</td><td>抗結核薬（カンジダには無効）</td></tr><tr><td>d アムホテリシンB</td><td>○</td><td>口腔カンジダ→アムホテリシンBトローチ（局所）またはフルコナゾール（経口）</td></tr></table></div>',

"q320": '<div class="eb ee"><h4>□ 選択肢評価（肺クリプトコックス症・軽〜中等症の治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>×</td><td>PCP・ノカルジア治療（クリプトコックスには無効）</td></tr><tr><td>b リファンピシン</td><td>×</td><td>抗結核薬（クリプトコックスには無効）</td></tr><tr><td>c フルコナゾール</td><td>○</td><td>軽〜中等症の肺クリプトコックス症→フルコナゾール経口が第一選択</td></tr><tr><td>d ガンシクロビル</td><td>×</td><td>CMV感染症治療薬（クリプトコックスには無効）</td></tr></table></div>',

"q321": '<div class="eb ee"><h4>□ 選択肢評価（真菌の染色法2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Grocott染色</td><td>○</td><td>六価銀染色→真菌細胞壁を黒〜褐色に染色（PCP・アスペルギルス・カンジダ）</td></tr><tr><td>b Masson染色</td><td>×</td><td>コラーゲン線維の染色（線維化の評価）→真菌には使わない</td></tr><tr><td>c PAM染色</td><td>×</td><td>腎糸球体基底膜・メサンギウムの染色→真菌には使わない</td></tr><tr><td>d PAS染色</td><td>○</td><td>多糖体を赤〜赤紫色に染色→真菌・糖タンパク全般（カンジダ・アスペルギルス等）</td></tr></table></div>',

"q322": '<div class="eb ee"><h4>□ 選択肢評価（SLE・ステロイド＋シクロホスファミド6週後の発熱の原因微生物）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a サイトメガロウイルス（CMV）</td><td>○</td><td>ステロイド大量＋免疫抑制薬→CMV潜伏感染の再活性化→発熱＋リンパ球減少→CMVアンチゲネミアで診断</td></tr><tr><td>b 黄色ブドウ球菌</td><td>×</td><td>急性の化膿性感染（6週間の経過・リンパ球減少とは合わない）</td></tr><tr><td>c アスペルギルス</td><td>×</td><td>好中球減少・長期ステロイドが背景（今回は好中球よりリンパ球減少が目立つ）</td></tr><tr><td>d ノカルジア</td><td>×</td><td>ステロイド投与中に起こりうるが、亜急性〜慢性経過・肺・皮膚病変が典型</td></tr></table></div>',

"q323": '<div class="eb ee"><h4>□ 選択肢評価（HIV感染患者体液に曝露した研修医への投与）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗HIV薬</td><td>○</td><td>PEP（曝露後予防）→2時間以内（最大72時間以内）に3剤抗HIV薬を28日間内服</td></tr><tr><td>b HIVワクチン</td><td>×</td><td>有効なHIVワクチンは承認されていない</td></tr><tr><td>c 免疫グロブリン</td><td>×</td><td>HIV感染予防に免疫グロブリンは無効</td></tr><tr><td>d インターフェロン</td><td>×</td><td>HBV/HCV治療に使う（HIVのPEPには使わない）</td></tr></table></div>',

"q324": '<div class="eb ee"><h4>□ 選択肢評価（PCP治療薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ニューキノロン系抗菌薬</td><td>×</td><td>レジオネラ・非定型肺炎→真菌（Pneumocystis）には無効</td></tr><tr><td>b アムホテリシンB</td><td>×</td><td>抗真菌薬だがPCP（Pneumocystis）にはアムホテリシンBが無効（ST合剤が第一選択）</td></tr><tr><td>c ガンシクロビル</td><td>×</td><td>CMV感染症治療薬（PCPには無効）</td></tr><tr><td>d オセルタミビル</td><td>×</td><td>インフルエンザウイルス（PCPには無効）</td></tr><tr><td>e ST合剤（TMP-SMX）</td><td>○</td><td>PCP第一選択→HIV関連・非HIV関連ともに同じ→21日間投与</td></tr></table></div>',

"q325": '<div class="eb ee"><h4>□ 選択肢評価（AIDS指標疾患に含まれるもの）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胃癌</td><td>×</td><td>AIDS指標疾患でない（一般的な悪性腫瘍）</td></tr><tr><td>b 乳癌</td><td>×</td><td>AIDS指標疾患でない</td></tr><tr><td>c 卵巣癌</td><td>×</td><td>AIDS指標疾患でない</td></tr><tr><td>d 大腸癌</td><td>×</td><td>AIDS指標疾患でない</td></tr><tr><td>e Kaposi肉腫（または悪性リンパ腫）</td><td>○</td><td>AIDS指標悪性腫瘍：Kaposi肉腫・悪性リンパ腫（Burkitt型等）・子宮頸癌</td></tr></table></div>',

"q326": '<div class="eb ee"><h4>□ 選択肢評価（AIDS合併疾患「でない」もの）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a サイトメガロウイルス感染症</td><td>AIDS合併あり</td><td>AIDS日和見感染症→CMV網膜炎・食道炎・肺炎</td></tr><tr><td>b ニューモシスチス肺炎</td><td>AIDS合併あり</td><td>AIDS最多日和見感染症（CD4&lt;200で発症）</td></tr><tr><td>c 口腔内カンジダ症</td><td>AIDS合併あり</td><td>AIDS指標疾患→CD4低下で発症</td></tr><tr><td>d 悪性リンパ腫</td><td>AIDS合併あり</td><td>EBV関連→AIDS指標疾患（Burkittリンパ腫等）</td></tr><tr><td>e プリオン病（CJD）</td><td>○（AIDS合併でない）</td><td>プリオン病はHIV感染とは無関係（異常プリオンタンパクの蓄積→AIDS合併疾患でない）</td></tr></table></div>',

"q327": '<div class="eb ee"><h4>□ 選択肢評価（IPF急性増悪・ステロイド大量投与中の起因微生物）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺結核症</td><td>×</td><td>結核は慢性経過（急性増悪の経緯とは合わない）</td></tr><tr><td>b 肺ムコール症</td><td>×</td><td>好中球減少・糖尿病性ケトアシドーシス（今回は好中球減少が主でない）</td></tr><tr><td>c ニューモシスチス肺炎</td><td>×</td><td>PCPも起こりうるがステロイド大量・高齢・IPF急性増悪ではCMVが最多</td></tr><tr><td>d 肺クリプトコックス症</td><td>×</td><td>軽度免疫低下・慢性経過（急性の状況には典型でない）</td></tr><tr><td>e サイトメガロウイルス（CMV）肺炎</td><td>○</td><td>ステロイド大量→CMV再活性化→CMVアンチゲネミア・組織でフクロウ眼封入体→ガンシクロビル治療</td></tr></table></div>',

"q328": '<div class="eb ee"><h4>□ 選択肢評価（舌の白色病変・KOH鏡検陽性→治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗真菌薬を塗布する</td><td>○</td><td>口腔カンジダ症→アムホテリシンBトローチ（局所塗布）またはミコナゾールゲルが第一選択</td></tr><tr><td>b 抗菌薬を経口投与する</td><td>×</td><td>カンジダは真菌（細菌でない）→抗菌薬は無効</td></tr><tr><td>c 白色病変部の舌を部分切除する</td><td>×</td><td>外科的切除は悪性腫瘍の治療（カンジダには不要）</td></tr><tr><td>d オピオイドで疼痛コントロール</td><td>×</td><td>対症療法のみ→原因治療（抗真菌薬）が先</td></tr></table></div>',

"q329": '<div class="eb ee"><h4>□ 選択肢評価（SLE・ステロイド治療中のPCP治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>○</td><td>非HIV関連PCPもHIV関連PCPも治療は同じ→ST合剤（TMP-SMX）が第一選択</td></tr><tr><td>b イソニアジド</td><td>×</td><td>抗結核薬（PCPには無効）</td></tr><tr><td>c ゲンタマイシン</td><td>×</td><td>アミノグリコシド系→グラム陰性菌（PCPには無効）</td></tr><tr><td>d エリスロマイシン</td><td>×</td><td>マクロライド→マイコプラズマ・クラミジア（PCPには無効）</td></tr></table></div>',

"q330": '<div class="eb ee"><h4>□ 選択肢評価（肺結核後空洞・空洞内球状陰影の治療）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アムホテリシンB静注</td><td>×</td><td>侵襲性アスペルギルス症の重症例（慢性肺アスペルギローマには第一選択でない）</td></tr><tr><td>b ボリコナゾール</td><td>○</td><td>慢性肺アスペルギルス症（CPA）/アスペルギローマ→ボリコナゾールまたはイトラコナゾール経口が第一選択</td></tr><tr><td>c フルコナゾール</td><td>×</td><td>カンジダ・クリプトコックス治療（アスペルギルスにはほぼ無効）</td></tr><tr><td>d ST合剤</td><td>×</td><td>PCP・ノカルジア治療（アスペルギルスには無効）</td></tr></table></div>',

"q331": '<div class="eb ee"><h4>□ 選択肢評価（AIDS患者急性感染症で直ちに必要な治療3つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 輸液</td><td>○</td><td>発熱・下痢による脱水補正→循環動態の安定が最優先</td></tr><tr><td>b 抗菌薬投与</td><td>○</td><td>細菌感染・敗血症の可能性→広域抗菌薬で経験的治療</td></tr><tr><td>c 抗真菌薬投与</td><td>○</td><td>カンジダ・クリプトコックス等の真菌感染も考慮→経験的投与</td></tr><tr><td>d 抗HIV薬投与</td><td>×</td><td>急性日和見感染中のART開始→IRIS（免疫再構築炎症症候群）リスク→感染コントロール後に開始</td></tr></table></div>',

"q332": '<div class="eb ee"><h4>□ 選択肢評価（同性愛者・体重減少・多発皮疹の診断）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 二期梅毒</td><td>×</td><td>バラ疹（淡紅色斑）が体幹に多発→紫紅色の隆起性病変とは異なる</td></tr><tr><td>b 皮膚結核</td><td>×</td><td>ルプス・尋常性・疣状（色調・部位が典型と異なる）</td></tr><tr><td>c 悪性黒色腫</td><td>×</td><td>単発・非対称性の黒色腫（多発・紫紅色の病変とは異なる）</td></tr><tr><td>d Kaposi肉腫</td><td>○</td><td>HHV-8感染＋AIDS（同性愛男性に多い）→紫紅色〜暗褐色の多発斑・丘疹・腫瘤がAIDS指標疾患</td></tr></table></div>',
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

path = r'C:\Users\coool\Desktop\MEC\感染症\ch06_kansen_hiv.html'
with open(path, encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee(content, EE)

ep_count = len(re.findall(r'class="[^"]*\bep\b[^"]*"', new_content))
ee_count = len(re.findall(r'class="[^"]*\bee\b[^"]*"', new_content))
print(f"ep={ep_count} ee={ee_count}")

cards = re.findall(r'<div class="qc" id="(q\d+)">', new_content)
missing = []
for qid in cards:
    card_match = re.search(f'<div class="qc" id="{qid}">(.*?)(?=<div class="qc"|$)', new_content, re.DOTALL)
    if card_match and 'class="eb ee"' not in card_match.group(1):
        missing.append(qid)
print(f"Missing ee: {missing}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done ch06")
