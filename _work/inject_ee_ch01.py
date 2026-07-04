import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q1": '<div class="eb ee"><h4>□ 検体保存温度の原則</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 尿</td><td>×</td><td>冷蔵（4℃）保存→常在菌の増殖を抑制</td></tr><tr><td>ｂ 便</td><td>×</td><td>冷蔵保存→常在菌の過剰増殖を防止</td></tr><tr><td>ｃ 喀痰</td><td>×</td><td>冷蔵保存→口腔常在菌の増殖を防止</td></tr><tr><td>ｄ 胸水</td><td>×</td><td>冷蔵保存（体腔液）</td></tr><tr><td>ｅ 血液</td><td>○</td><td>室温保存が原則→冷蔵すると肺炎球菌・髄膜炎菌等の低温死滅菌を見逃す</td></tr></table></div>',

"q3": '<div class="eb ee"><h4>□ 感染経路別の医療関連感染</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 破傷風</td><td>×</td><td>土壌中の芽胞が傷口から感染→手指介在は主経路でない</td></tr><tr><td>ｂ Ｃ型肝炎</td><td>×</td><td>血液感染（針刺し事故等）が主→手指経由ではない</td></tr><tr><td>ｃ プリオン病</td><td>×</td><td>脳・脊髄組織等を介して感染→手指は主経路でない</td></tr><tr><td>ｄ レジオネラ症</td><td>×</td><td>冷却塔・温泉等の水系からの吸入感染→手指経由ではない</td></tr><tr><td>ｅ MRSA感染症</td><td>○</td><td>接触感染（手指）が主経路→医療者の手洗いが最重要予防策</td></tr></table></div>',

"q4": '<div class="eb ee"><h4>□ インフルエンザ後の二次性細菌肺炎</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ Candida albicans</td><td>×</td><td>真菌→免疫不全患者に多い・インフルエンザ後の主役でない</td></tr><tr><td>ｂ Legionella pneumophila</td><td>×</td><td>水系吸入感染→インフルエンザ後の二次感染ではない</td></tr><tr><td>ｃ Mycoplasma pneumoniae</td><td>×</td><td>非定型肺炎→若年者・インフルエンザとは独立した感染</td></tr><tr><td>ｄ Pseudomonas aeruginosa</td><td>×</td><td>免疫不全・長期入院患者に多い→糖尿病単独では第一選択でない</td></tr><tr><td>ｅ Staphylococcus aureus</td><td>○</td><td>インフルエンザ後の二次性細菌肺炎で最多・糖尿病リスクでさらに↑・Gram陽性球菌</td></tr></table></div>',

"q5": '<div class="eb ee"><h4>□ 尿培養検体の適否</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 中間尿</td><td>○適</td><td>初尿を捨て中間尿を採取→外尿道常在菌の混入を最小化</td></tr><tr><td>ｂ 尿道分泌物</td><td>○適</td><td>淋菌・クラミジア等の性感染症検査に適した検体</td></tr><tr><td>ｃ 導尿で採取した尿</td><td>○適</td><td>無菌的操作→汚染なし</td></tr><tr><td>ｄ 腎瘻造設時に採取した尿</td><td>○適</td><td>直接採取→汚染なし</td></tr><tr><td>ｅ 集尿袋内の尿</td><td>×不適</td><td>細菌が蓄積・増殖して汚染→培養結果を過大評価するリスク</td></tr></table></div>',

"q7": '<div class="eb ee"><h4>□ Gram陽性双球菌・無脾症患者の菌血症</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ Clostridium perfringens</td><td>×</td><td>Gram陽性桿菌（芽胞形成）→双球菌ではない</td></tr><tr><td>ｂ Enterococcus faecium</td><td>×</td><td>Gram陽性球菌だが連鎖状→双球菌・無脾症の最多菌ではない</td></tr><tr><td>ｃ Haemophilus influenzae</td><td>×</td><td>Gram陰性小桿菌→双球菌でない（無脾症リスクはあるが形態が違う）</td></tr><tr><td>ｄ Neisseria meningitidis</td><td>×</td><td>Gram陰性双球菌→形態は近いが、無脾症の最多は肺炎球菌</td></tr><tr><td>ｅ Streptococcus pneumoniae</td><td>○</td><td>Gram陽性双球菌→莢膜菌の代表・無脾症患者で最多（OPSI）</td></tr></table></div>',

"q8": '<div class="eb ee"><h4>□ 病理解剖（病院解剖）の原則</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 解剖終了後は遺体を家族に返還</td><td>○</td><td>病院解剖は医学目的（原因究明）→法的拘束なし・終了後に遺族へ返還</td></tr><tr><td>ｂ 解剖器具は全て廃棄</td><td>×</td><td>適切に消毒・滅菌すれば再使用可能</td></tr><tr><td>ｃ 解剖実施を警察に届け出る</td><td>×</td><td>警察への届出は司法解剖（犯罪死体）が対象→病院解剖は不要</td></tr><tr><td>ｄ 医療従事者は予防抗菌薬を内服</td><td>×</td><td>適切なPPE着用で予防→予防的抗菌薬投与は通常不要</td></tr><tr><td>ｅ 死亡診断書は病理解剖報告書完成後に発行</td><td>×</td><td>死亡診断書は死亡確認時点で発行→解剖報告書を待つ必要はない</td></tr></table></div>',

"q9": '<div class="eb ee"><h4>□ 良質な喀痰の判定基準</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ うがい後に採取</td><td>○良</td><td>口腔内細菌を減らしてから採取→汚染を減少</td></tr><tr><td>ｂ 膿性部分が入っている</td><td>○良</td><td>膿性痰（黄緑色）は好中球・細菌が豊富→培養に適した良質な検体</td></tr><tr><td>ｃ 食塩水吸入で誘発</td><td>○良</td><td>誘発喀痰法→喀出困難な患者でも気道分泌物を得られる</td></tr><tr><td>ｄ Gram染色で白血球が多い</td><td>○良</td><td>好中球≥25個/HPF→炎症部位の検体（良質の判定基準）</td></tr><tr><td>ｅ Gram染色で上皮細胞が多い</td><td>×不良</td><td>扁平上皮細胞≥10個/HPF→口腔内汚染の指標（Miller&Jones分類 M1）→培養不適</td></tr></table></div>',

"q11": '<div class="eb ee"><h4>□ 空気感染予防策（airborne precautions）が必要な疾患</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ herpes（帯状疱疹・播種性）</td><td>△</td><td>播種性帯状疱疹は空気感染予防策も必要だが、単純ヘルペスは接触・飛沫</td></tr><tr><td>ｂ influenza（インフルエンザ）</td><td>×</td><td>飛沫感染が主→サージカルマスク・飛沫感染予防策</td></tr><tr><td>ｃ mumps（ムンプス）</td><td>×</td><td>飛沫感染→飛沫感染予防策</td></tr><tr><td>ｄ rubella（風疹）</td><td>×</td><td>飛沫感染→飛沫感染予防策</td></tr><tr><td>ｅ varicella（水痘）</td><td>○</td><td>飛沫核（空気感染）＋接触感染→N95マスク・陰圧個室・空気感染予防策が必要</td></tr></table></div>',

"q13": '<div class="eb ee"><h4>□ 抗菌薬適正使用の原則（誤りを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 培養検査提出後に開始</td><td>正しい</td><td>検体採取前に投与すると培養感度が著しく低下する</td></tr><tr><td>ｂ 薬物動態に合わせて投与量調整</td><td>正しい</td><td>腎機能・肝機能・体重によりPKが変わる→個別化が必要</td></tr><tr><td>ｃ 開始時のCRP値で投与期間決定</td><td>○（誤り）</td><td>CRPは感染の重症度参考指標→投与期間は臨床的改善・感受性結果・疾患種で決定</td></tr><tr><td>ｄ 臓器への移行性を考慮して選択</td><td>正しい</td><td>髄液移行・骨移行等→感染部位に応じた薬剤選択が必要</td></tr><tr><td>ｅ 感受性検査結果に応じて変更</td><td>正しい</td><td>de-escalation（狭域化）原則→培養・感受性が判明したら最適薬に変更</td></tr></table></div>',

"q14": '<div class="eb ee"><h4>□ 血液培養の採取方法（正しいものを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 抗菌薬投与後に採取</td><td>×</td><td>抗菌薬は血中の菌を死滅させる→必ず投与前に採取</td></tr><tr><td>ｂ 2セットとも1か所から採血</td><td>×</td><td>異なる2か所から採取→コンタミ（皮膚常在菌）との鑑別に必須</td></tr><tr><td>ｃ 消毒薬が乾く前に採血</td><td>×</td><td>消毒薬は乾燥させてから穿刺→培養ボトルへの消毒薬混入を防ぐ</td></tr><tr><td>ｄ 好気→嫌気ボトルの順に入れる</td><td>△</td><td>一般的プロトコル（針先は嫌気よりも好気優先が多い）</td></tr><tr><td>ｅ 注入後に転倒混和する</td><td>○</td><td>培地と血液を均一に混合→培養効率が向上する</td></tr></table></div>',

"q15": '<div class="eb ee"><h4>□ Listeria感染症の治療薬選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ アンピシリンに変更</td><td>○</td><td>Listeriaはセフェム系に自然耐性（PBP特異性）→アンピシリン（±ゲンタマイシン）が第一選択</td></tr><tr><td>ｂ セフトリアキソンを継続</td><td>×</td><td>L.monocytogenesはセフェム系に自然耐性→継続は無効</td></tr><tr><td>ｃ 中止して経過観察</td><td>×</td><td>妊婦のListeria→胎児・新生児への重篤な合併症リスク→放置は禁忌</td></tr><tr><td>ｄ メロペネムに変更</td><td>×</td><td>カルバペネムはListeria有効だが過剰治療・妊婦への安全性も考慮すべき</td></tr><tr><td>ｅ レボフロキサシンに変更</td><td>×</td><td>ニューキノロン→妊婦禁忌（軟骨毒性）・Listeria治療の第一選択でもない</td></tr></table></div>',

"q17": '<div class="eb ee"><h4>□ 菌血症を示唆する症状</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 悪心</td><td>×</td><td>非特異的症状→菌血症特異的でない</td></tr><tr><td>ｂ 頭痛</td><td>×</td><td>非特異的→菌血症の特異的所見でない</td></tr><tr><td>ｃ 関節痛</td><td>×</td><td>感染症全般に見られるが菌血症特異的でない</td></tr><tr><td>ｄ 悪寒戦慄</td><td>○</td><td>菌・毒素の血流侵入→TNF-α・IL-1放出→視床下部のセットポイント急上昇→悪寒戦慄（rigors）発生。菌血症の最も特異的な症状</td></tr><tr><td>ｅ リンパ節腫脹</td><td>×</td><td>局所感染や腫瘍等でも見られる→菌血症特異的でない</td></tr></table></div>',

"q18": '<div class="eb ee"><h4>□ スルバクタム・アンピシリンのPK/PD（投与回数）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 1回経口投与</td><td>×</td><td>重症肺炎→静注が必要。経口は軽症外来のみ</td></tr><tr><td>ｂ 1回筋注</td><td>×</td><td>筋注は一部の軽症例→中等症肺炎は点滴静注が原則</td></tr><tr><td>ｃ 1回点滴静注</td><td>×</td><td>βラクタム系は時間依存性→1回では有効濃度が維持できない</td></tr><tr><td>ｄ 2回点滴静注</td><td>×</td><td>回数不足→T>MICを十分に確保できない</td></tr><tr><td>ｅ 3回点滴静注</td><td>○</td><td>βラクタム系は時間依存性（T>MICが重要）→1日3回分割投与でMIC超過時間を最大化</td></tr></table></div>',

"q19": '<div class="eb ee"><h4>□ 抗菌薬適正使用支援（AMS）で管理すべき薬剤</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ セフェム系</td><td>×</td><td>広く使用される標準薬→個別管理より教育が主体</td></tr><tr><td>ｂ ペニシリン系</td><td>×</td><td>第一選択薬として広く使用→特段の院内管理対象でない</td></tr><tr><td>ｃ カルバペネム系</td><td>○</td><td>CRE・MDRPの発現を防ぐため院内で使用制限・管理が必要→感染症科承認制を設ける施設が多い</td></tr><tr><td>ｄ マクロライド系</td><td>×</td><td>市中感染症の標準薬→院内管理の優先薬でない</td></tr><tr><td>ｅ アミノグリコシド系</td><td>×</td><td>腎毒性のため用量調整は必要だが院内管理の最優先ではない</td></tr></table></div>',

"q20": '<div class="eb ee"><h4>□ SIRS診断基準（6,600/mm³白血球は除外）</h4><table class="tb"><tr><th>SIRSの項目</th><th>基準値</th><th>本例の値</th></tr><tr><td>体温</td><td>&gt;38℃ または &lt;36℃</td><td>記載の数値を確認</td></tr><tr><td>心拍数</td><td>&gt;90/分</td><td>記載の数値を確認</td></tr><tr><td>呼吸数</td><td>&gt;20/分 またはPaCO₂&lt;32</td><td>記載の数値を確認</td></tr><tr><td>白血球数</td><td>&gt;12,000 または &lt;4,000 または幼若球&gt;10%</td><td>6,600→基準を満たさない（正常範囲）</td></tr></table><br><span style="font-size:12px;">白血球6,600/mm³はSIRS白血球基準（&gt;12,000または&lt;4,000）を満たさない</span></div>',

"q22": '<div class="eb ee"><h4>□ 良質な喀痰の判定（Gram染色鏡検）</h4><table class="tb"><tr><th>判定ポイント</th><th>良質</th><th>不良</th></tr><tr><td>好中球（HPF）</td><td>≥25個</td><td>&lt;25個</td></tr><tr><td>扁平上皮細胞（HPF）</td><td>&lt;10個</td><td>≥10個</td></tr><tr><td>判定</td><td>深部気道由来</td><td>口腔汚染→培養不適</td></tr></table><br><span style="font-size:12px;">選択肢⑤（扁平上皮細胞多数＝口腔汚染）が最も不適切</span></div>',

"q23": '<div class="eb ee"><h4>□ 院内感染リスクの比較</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 褥瘡処置</td><td>リスクあり</td><td>皮膚バリア破綻→MRSA等の侵入経路</td></tr><tr><td>ｂ 持続導尿</td><td>リスクあり</td><td>CAUTI（カテーテル関連尿路感染）の主要リスク</td></tr><tr><td>ｃ 腰椎穿刺</td><td>○（リスク低い）</td><td>無菌的手技で完結・カテーテル等の留置物が残らない→継続的感染リスクが低い</td></tr><tr><td>ｄ 人工呼吸</td><td>リスクあり</td><td>VAP（人工呼吸器関連肺炎）の原因→気道バリアの破綻</td></tr><tr><td>ｅ 中心静脈栄養</td><td>リスクあり</td><td>CLABSI（中心ライン関連血流感染）の主要リスク</td></tr></table></div>',

"q25": '<div class="eb ee"><h4>□ 室温保存が必要な検体（髄液）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 尿</td><td>×（冷蔵）</td><td>冷蔵4℃→常在菌の増殖を抑制</td></tr><tr><td>ｂ 便</td><td>×（冷蔵）</td><td>冷蔵→腸内常在菌の増殖防止</td></tr><tr><td>ｃ 喀痰</td><td>×（冷蔵）</td><td>冷蔵→口腔常在菌の過剰増殖防止</td></tr><tr><td>ｄ 髄液</td><td>○（室温）</td><td>肺炎球菌・髄膜炎菌は低温（冷蔵）で死滅→室温保存が必須</td></tr><tr><td>ｅ 胸水</td><td>×（冷蔵）</td><td>体腔液は冷蔵保存（常在菌の増殖防止）</td></tr></table></div>',

"q26": '<div class="eb ee"><h4>□ PK/PD：濃度依存性抗菌薬→単回投与が有効</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ キノロン系薬</td><td>○</td><td>濃度依存性（Cmax/MIC↑が有効性の指標）→単回大量投与でCmaxを最大化</td></tr><tr><td>ｂ ペニシリン系薬</td><td>×</td><td>時間依存性（T>MICが指標）→頻回分割投与が有効（単回では血中濃度が早く低下）</td></tr><tr><td>ｃ カルバペネム系薬</td><td>×</td><td>時間依存性→分割投与・持続投与が原則</td></tr><tr><td>ｄ セファロスポリン系薬</td><td>×</td><td>時間依存性→分割投与が原則</td></tr><tr><td>ｅ テトラサイクリン系薬</td><td>×</td><td>時間依存性に近い→分割投与が一般的</td></tr></table></div>',

"q29": '<div class="eb ee"><h4>□ 比較的徐脈を示さない疾患</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ レジオネラ肺炎</td><td>×（除外できない）</td><td>比較的徐脈を示す→腸チフスと同様</td></tr><tr><td>ｂ 肺炎球菌性肺炎</td><td>○（比較的徐脈を示さない）</td><td>高熱に対して頻脈が伴う（比較的頻脈）→比較的徐脈は示さない</td></tr><tr><td>ｃ オウム病</td><td>×（除外できない）</td><td>Chlamydia psittaci感染→比較的徐脈を示す</td></tr><tr><td>ｄ 腸チフス</td><td>×（除外できない）</td><td>Salmonella typhi→比較的徐脈（Faget徴候）の典型</td></tr><tr><td>ｅ ウイルス性髄膜炎</td><td>×（除外できない）</td><td>ウイルス感染→比較的徐脈を示すことがある</td></tr></table></div>',

"q30": '<div class="eb ee"><h4>□ NSAIDs併用で痙攣を起こす抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ イソニアジド</td><td>×</td><td>INH→末梢神経障害（B6欠乏）・痙攣との直接相互作用は主ではない</td></tr><tr><td>ｂ マクロライド系</td><td>×</td><td>QT延長・CYP3A4阻害が主な副作用→NSAIDsとの痙攣相互作用は主でない</td></tr><tr><td>ｃ ニューキノロン系</td><td>○</td><td>GABAA受容体拮抗作用→NSAIDsも同受容体に作用→相加的に痙攣閾値を低下させる</td></tr><tr><td>ｄ セフェム系</td><td>×</td><td>高用量では痙攣リスクあるが NSAIDsとの特異的相互作用は主でない</td></tr><tr><td>ｅ アミノグリコシド系</td><td>×</td><td>腎毒性・聴器毒性が主な副作用→痙攣との相互作用は主でない</td></tr></table></div>',

"q32": '<div class="eb ee"><h4>□ 嫌気性菌感染症に無効な抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ βラクタム系</td><td>有効</td><td>細胞壁合成阻害→嫌気性菌に有効（スルバクタム/アンピシリン等）</td></tr><tr><td>ｂ アミノグリコシド系</td><td>○無効</td><td>細胞内取込みに酸素依存性電子伝達系が必要→嫌気環境では取込まれない→無効</td></tr><tr><td>ｃ マクロライド系</td><td>有効</td><td>タンパク合成阻害（50S）→嫌気性菌に有効</td></tr><tr><td>ｄ クリンダマイシン</td><td>有効</td><td>50Sリボソーム阻害→嫌気性菌に対して優れた効果</td></tr><tr><td>ｅ テトラサイクリン系</td><td>有効</td><td>30Sリボソーム阻害→嫌気性菌にも有効</td></tr></table></div>',

"q35": '<div class="eb ee"><h4>□ 標準予防策：手袋なしで扱える物品</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 患者の眼鏡</td><td>○</td><td>血液・体液・排泄物に接触しない物品→手袋不要</td></tr><tr><td>ｂ 創部にあてたガーゼ</td><td>×</td><td>血液・滲出液が付着→手袋必要</td></tr><tr><td>ｃ 便が付着したオムツ</td><td>×</td><td>便（排泄物）に接触→手袋必要</td></tr><tr><td>ｄ 口腔ケアに用いたブラシ</td><td>×</td><td>唾液・口腔内分泌物に接触→手袋必要</td></tr><tr><td>ｅ 喀痰が付着したティッシュ</td><td>×</td><td>喀痰（呼吸器分泌物）に接触→手袋必要</td></tr></table></div>',

"q36": '<div class="eb ee"><h4>□ ショックと症候（誤りの組合せを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 出血性ショック—頻脈</td><td>正しい</td><td>循環血液量減少→交感神経亢進→頻脈</td></tr><tr><td>ｂ 心原性ショック—乏尿</td><td>正しい</td><td>心拍出量低下→腎血流低下→乏尿</td></tr><tr><td>ｃ 神経原性ショック—徐脈</td><td>正しい</td><td>交感神経遮断→副交感優位→徐脈・末梢血管拡張（温かいショック）</td></tr><tr><td>ｄ 敗血症性ショック—蕁麻疹</td><td>○（誤り）</td><td>蕁麻疹はアナフィラキシーショックの症状→敗血症性ショックでは見られない</td></tr><tr><td>ｅ アナフィラキシー—喉頭浮腫</td><td>正しい</td><td>IgE介在型アレルギー→ヒスタミン放出→喉頭浮腫（気道閉塞）</td></tr></table></div>',

"q37": '<div class="eb ee"><h4>□ 手袋脱衣手順（誤りを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 手袋で対側の表面をつかむ</td><td>正しい</td><td>最初は汚染面同士が触れても問題ない→正しい手順の第一歩</td></tr><tr><td>ｂ 外側が内になるように外す</td><td>正しい</td><td>汚染された外側が内側に→自己汚染を防ぐ</td></tr><tr><td>ｃ 外した手袋を持つ</td><td>正しい</td><td>外した手袋を手袋した手で保持→手順通り</td></tr><tr><td>ｄ 素手で対側の手袋の表面をつかむ</td><td>○（誤り）</td><td>素手（清潔な手）で汚染された手袋表面に触れる→自己汚染が発生する</td></tr><tr><td>ｅ 素手を対側の内側に差し込んで外す</td><td>正しい</td><td>内側（清潔面）に素手を差し込む→外側に触れずに外せる</td></tr></table></div>',

"q39": '<div class="eb ee"><h4>□ PPEの着脱場所（バッファーゾーン）</h4><table class="tb"><tr><th>原則</th><th>説明</th></tr><tr><td>PPE着用場所</td><td>病室に入る前（廊下側・前室）で着用→病室内の汚染を廊下に持ち込まない</td></tr><tr><td>PPE脱衣場所</td><td>病室を出る前（前室・バッファーゾーン内）で脱衣→廊下への汚染拡散を防ぐ</td></tr><tr><td>選択肢④</td><td>○ バッファーゾーン（前室）での着脱が感染拡散を防ぐ最適な場所</td></tr><tr><td>廊下での脱衣</td><td>× 汚染が廊下に拡散するリスク</td></tr><tr><td>病室内での脱衣</td><td>× 廊下に出る際に汚染を持ち出すリスク</td></tr></table></div>',

"q41": '<div class="eb ee"><h4>□ 標準予防策（正しいものを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 滅菌手袋を着用する</td><td>×</td><td>標準予防策は未滅菌手袋（清潔手袋）→滅菌手袋は手術・無菌操作時</td></tr><tr><td>ｂ 感染症診断後に実施</td><td>×</td><td>標準予防策は全患者に適用→診断前から実施</td></tr><tr><td>ｃ 次亜塩素酸で手指衛生</td><td>×</td><td>手指衛生はアルコール手指消毒または流水と石鹸→次亜塩素酸は環境消毒用</td></tr><tr><td>ｄ 嘔吐時に撥水性ガウン着用</td><td>○</td><td>嘔吐物は体液→衣服への汚染リスク→撥水性ガウン（バリア機能）着用が正しい</td></tr><tr><td>ｅ 木製舌圧子は一般廃棄物</td><td>×</td><td>唾液付着→感染性廃棄物として処理</td></tr></table></div>',

"q45": '<div class="eb ee"><h4>□ 市中肺炎（気管支喘息・吸入ステロイド使用）の起因菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ Haemophilus influenzae</td><td>×</td><td>COPD・慢性気道疾患に多い→本例（41歳・急性発症）では第一選択でない</td></tr><tr><td>ｂ Moraxella catarrhalis</td><td>×</td><td>COPD増悪に関連→本例では優先度が低い</td></tr><tr><td>ｃ Mycoplasma pneumoniae</td><td>×</td><td>非定型肺炎（乾性咳嗽・白血球正常）→本例は膿性痰・CT右下葉→典型肺炎</td></tr><tr><td>ｄ Staphylococcus aureus</td><td>×</td><td>インフルエンザ後・免疫不全での二次感染に多い</td></tr><tr><td>ｅ Streptococcus pneumoniae</td><td>○</td><td>市中肺炎の最多起炎菌（40〜50%）→急性発症・膿性痰・葉性浸潤影が典型</td></tr></table></div>',

"q46": '<div class="eb ee"><h4>□ 個人防護具（PPE）の定義</h4><table class="tb"><tr><th>PPEの種類</th><th>用途</th></tr><tr><td>手袋（未滅菌）</td><td>接触感染予防・血液体液保護</td></tr><tr><td>サージカルマスク</td><td>飛沫感染予防（医療者・患者）</td></tr><tr><td>N95マスク</td><td>空気感染予防（結核・麻疹・水痘）</td></tr><tr><td>ガウン（撥水性）</td><td>体液汚染から衣服を保護</td></tr><tr><td>ゴーグル・フェイスシールド</td><td>眼粘膜への飛沫保護</td></tr></table><br><span style="font-size:12px;">④ 聴診器は診察器具（medical device）→PPEには含まれない</span></div>',

"q47": '<div class="eb ee"><h4>□ 抗菌薬の適正使用（正しいものを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 解熱後すぐに中止</td><td>×</td><td>早期中止→再燃・耐性菌誘導リスク→規定期間継続が原則</td></tr><tr><td>ｂ 発熱があれば投与</td><td>×</td><td>ウイルス感染・非感染性疾患の発熱には不要→適応を確認してから投与</td></tr><tr><td>ｃ 検体採取後に投与</td><td>○</td><td>血液培養・喀痰等の検体採取後に開始→培養感度の維持（抗菌薬前採取が原則）</td></tr><tr><td>ｄ 感受性によらず広域継続</td><td>×</td><td>de-escalation原則→感受性判明後に最も狭域の抗菌薬に変更</td></tr><tr><td>ｅ 解熱薬併用で判定容易</td><td>×</td><td>解熱薬は解熱効果があり治療効果の判定を困難にする</td></tr></table></div>',

"q49": '<div class="eb ee"><h4>□ qSOFA（quick SOFA）スコアの構成要素</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 体温と脈拍</td><td>×</td><td>体温・脈拍はSIRS基準の要素→qSOFAには含まれない</td></tr><tr><td>ｂ 体温と血圧</td><td>×</td><td>体温はqSOFAに含まれない</td></tr><tr><td>ｃ 脈拍と血圧</td><td>×</td><td>脈拍はqSOFAに含まれない</td></tr><tr><td>ｄ 脈拍と呼吸数</td><td>×</td><td>脈拍はqSOFAに含まれない（SIRS基準の要素）</td></tr><tr><td>ｅ 血圧と呼吸数</td><td>○</td><td>qSOFA＝意識変容（GCS&lt;15）＋血圧≦100mmHg＋呼吸数≧22/分の3項目→意識＋血圧＋呼吸数</td></tr></table></div>',

"q50": '<div class="eb ee"><h4>□ qSOFAスコア計算（GCS15・BP92/50・RR26）</h4><table class="tb"><tr><th>qSOFA項目</th><th>基準</th><th>本例</th><th>点数</th></tr><tr><td>意識変容</td><td>GCS &lt; 15</td><td>GCS 15（正常）</td><td>0点</td></tr><tr><td>血圧低下</td><td>収縮期BP ≤ 100mmHg</td><td>BP 92/50 → 満たす</td><td>1点</td></tr><tr><td>呼吸数増加</td><td>RR ≥ 22/分</td><td>RR 26 → 満たす</td><td>1点</td></tr><tr><td>合計</td><td>≥2点で敗血症を疑う</td><td>2点</td><td>○ 2点</td></tr></table></div>',

"q51": '<div class="eb ee"><h4>□ 血液培養の感度を下げる操作</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 検体を冷蔵保存</td><td>○（感度↓）</td><td>低温で死滅する菌（肺炎球菌・髄膜炎菌・淋菌等）を見逃す→室温保存が原則</td></tr><tr><td>ｂ 採取回数を増やす</td><td>×（感度↑）</td><td>複数セット採取→感度が上昇する</td></tr><tr><td>ｃ 抗菌薬投与前に採取</td><td>×（感度↑）</td><td>投与前採取→菌の生存率が高い→感度維持</td></tr><tr><td>ｄ 異なる部位から2セット</td><td>×（感度↑）</td><td>部位を変えることでコンタミ鑑別＋感度向上</td></tr><tr><td>ｅ 好気→嫌気ボトルの順</td><td>×</td><td>感度に大きな影響なし</td></tr></table></div>',

"q55": '<div class="eb ee"><h4>□ COPD患者の下気道感染起因菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 腸球菌</td><td>×</td><td>尿路・腹腔内感染の主役→下気道感染では稀</td></tr><tr><td>ｂ 肺炎球菌</td><td>×（一般的に多いが）</td><td>市中肺炎の第一位だが、COPD患者ではインフルエンザ菌・M.catarrhalisも多い</td></tr><tr><td>ｃ 化膿連鎖球菌</td><td>×</td><td>咽頭炎・蜂巣炎の主役→COPD下気道感染では稀</td></tr><tr><td>ｄ 黄色ブドウ球菌</td><td>×</td><td>インフルエンザ後・重症COPD・免疫不全で→本例の優先度は低い</td></tr><tr><td>ｅ Moraxella catarrhalis</td><td>○</td><td>COPD患者・高齢者・免疫低下での下気道感染に多い→β-ラクタマーゼ産生率高くSBT/ABPCが有効</td></tr></table></div>',

"q57": '<div class="eb ee"><h4>□ 良質な喀痰：好中球と扁平上皮細胞の基準</h4><table class="tb"><tr><th>選択肢</th><th>好中球(/HPF)</th><th>扁平上皮(/HPF)</th><th>評価</th></tr><tr><td>ａ</td><td>0</td><td>0</td><td>×（白血球がなく炎症部位でない）</td></tr><tr><td>ｂ</td><td>5</td><td>5</td><td>×（好中球が少なく深部からの検体でない）</td></tr><tr><td>ｃ</td><td>5</td><td>30</td><td>×（扁平上皮多い＝口腔汚染・好中球少ない）</td></tr><tr><td>ｄ</td><td>30</td><td>5</td><td>○（好中球≥25個で炎症あり・扁平上皮&lt;10個で口腔汚染少ない）</td></tr><tr><td>ｅ</td><td>30</td><td>30</td><td>×（好中球は十分だが扁平上皮≥10個→口腔汚染あり）</td></tr></table></div>',

"q59": '<div class="eb ee"><h4>□ 敗血症性ショックの初期治療（まず行うべき）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ アトロピン急速静注</td><td>×</td><td>徐脈治療薬→敗血症性ショックでは適応なし（通常は頻脈）</td></tr><tr><td>ｂ アドレナリン急速静注</td><td>×</td><td>アナフィラキシーショックには第一選択だが敗血症性ショックでは第一選択でない</td></tr><tr><td>ｃ ジゴキシン急速静注</td><td>×</td><td>心不全・心房細動治療薬→敗血症性ショックの初期治療でない</td></tr><tr><td>ｄ 生理食塩液の急速輸液</td><td>○</td><td>敗血症性ショック：まず30mL/kgの晶質液急速輸液→循環血液量を補正・臓器灌流を改善</td></tr><tr><td>ｅ 副腎皮質ステロイド急速静注</td><td>×</td><td>ステロイドは十分な輸液・昇圧薬後も血圧維持できない場合の補助→初期治療ではない</td></tr></table></div>',

"q60": '<div class="eb ee"><h4>□ 敗血症の治療方針（誤りを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 心電図で心拍数を監視</td><td>正しい</td><td>循環動態の継続的モニタリング→必要な処置</td></tr><tr><td>ｂ 尿道カテで時間尿量監視</td><td>正しい</td><td>腎灌流の指標（目標尿量：0.5mL/kg/hr以上）→敗血症管理の基本</td></tr><tr><td>ｃ 抗菌薬は感受性判明後に開始</td><td>○（誤り）</td><td>敗血症は時間が命→1時間以内に経験的抗菌薬投与が必須。感受性待ちは死亡率を上昇させる</td></tr><tr><td>ｄ SpO₂参考に酸素調節</td><td>正しい</td><td>組織酸素化の維持→SpO₂ 94-98%を目標に投与量調節</td></tr><tr><td>ｅ 血液培養複数セット提出</td><td>正しい</td><td>起因菌の同定→異なる部位から2セット（抗菌薬投与前に）</td></tr></table></div>',

"q61": '<div class="eb ee"><h4>□ 空気感染する病原体（2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ インフルエンザウイルス</td><td>×</td><td>主に飛沫感染（サージカルマスクで予防）→空気感染の証拠は限定的</td></tr><tr><td>ｂ 風疹ウイルス</td><td>×</td><td>飛沫感染が主→空気感染予防策は不要</td></tr><tr><td>ｃ 麻疹ウイルス</td><td>○</td><td>飛沫核（空気）感染→N95マスク・陰圧個室・空気感染予防策が必要</td></tr><tr><td>ｄ 百日咳菌</td><td>×</td><td>飛沫感染（Bordetella pertussis）→飛沫感染予防策</td></tr><tr><td>ｅ 結核菌</td><td>○</td><td>飛沫核（空気）感染→N95マスク・陰圧個室が必要。空気感染3大疾患（麻疹・水痘・結核）</td></tr></table></div>',

"q63": '<div class="eb ee"><h4>□ 血液培養の診断感度を下げる操作</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 検体を冷蔵保存</td><td>○（感度↓）</td><td>肺炎球菌・髄膜炎菌・淋菌は低温で死滅→感度が著しく低下する</td></tr><tr><td>ｂ 採取回数を増やす</td><td>×（感度↑）</td><td>回数増加→感度上昇・コンタミ鑑別にも有用</td></tr><tr><td>ｃ 抗菌薬投与前に採取</td><td>×（感度↑）</td><td>抗菌薬が血中の菌を死滅させるため→投与前採取が感度維持の原則</td></tr><tr><td>ｄ 異なる部位から2セット採取</td><td>×（感度↑）</td><td>2部位採取→感度向上・コンタミ（皮膚常在菌）の鑑別</td></tr><tr><td>ｅ 好気→嫌気ボトルの順</td><td>×</td><td>感度に対する有意な影響はない</td></tr></table></div>',

"q64": '<div class="eb ee"><h4>□ 陽圧無菌室の清潔度（HEPA供給口が最清潔）</h4><table class="tb"><tr><th>原則</th><th>説明</th></tr><tr><td>HEPAフィルター供給口付近</td><td>最清潔→造血幹細胞移植患者の療養空間として最適</td></tr><tr><td>陽圧の方向</td><td>清潔な空気が患者側から廊下側へ流れる→外からの汚染を排除</td></tr><tr><td>選択肢①</td><td>○ HEPA供給口（頭側・最上流）が最も清潔な場所</td></tr><tr><td>廊下側・ドア付近</td><td>× 廊下からの汚染が流入しやすい最も不潔な場所</td></tr></table></div>',

"q65": '<div class="eb ee"><h4>□ SIRS診断基準（体温35.0℃は基準を満たす）</h4><table class="tb"><tr><th>選択肢</th><th>値</th><th>SIRS基準</th><th>評価</th></tr><tr><td>ａ 末梢血白血球6,000</td><td>6,000/mm³</td><td>&gt;12,000 または &lt;4,000</td><td>×満たさない</td></tr><tr><td>ｂ 心拍数70/分</td><td>70/分</td><td>&gt;90/分</td><td>×満たさない</td></tr><tr><td>ｃ 呼吸数15/分</td><td>15/分</td><td>&gt;20/分</td><td>×満たさない</td></tr><tr><td>ｄ 尿量40mL/時</td><td>40mL/時</td><td>尿量はSIRS基準に含まれない</td><td>×</td></tr><tr><td>ｅ 体温35.0℃</td><td>35.0℃</td><td>&lt;36℃</td><td>○満たす（低体温もSIRS基準）</td></tr></table></div>',

"q68": '<div class="eb ee"><h4>□ 多剤耐性緑膿菌（MDRP）の定義</h4><table class="tb"><tr><th>薬剤群</th><th>評価</th><th>根拠</th></tr><tr><td>ａ ニューキノロン系</td><td>○（耐性確認必要）</td><td>MDRPの定義に含まれる3系統の1つ</td></tr><tr><td>ｂ カルバペネム系</td><td>○（耐性確認必要）</td><td>MDRPの定義に含まれる3系統の1つ（最重要）</td></tr><tr><td>ｃ アミノ配糖体系</td><td>○（耐性確認必要）</td><td>MDRPの定義に含まれる3系統の1つ</td></tr><tr><td>ｄ ペニシリン系</td><td>×</td><td>MDRPの定義基準には含まれない</td></tr><tr><td>ｅ セフェム系</td><td>×</td><td>MDRPの定義基準には含まれない</td></tr></table><br><span style="font-size:12px;">MDRP：カルバペネム系＋アミノ配糖体系＋ニューキノロン系すべてに耐性（本問は採点除外）</span></div>',

"q70": '<div class="eb ee"><h4>□ 人畜（人獣）共通感染症（zoonosis）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 口蹄疫</td><td>×</td><td>偶蹄類（牛・豚等）の疾患→ヒトへの感染は極めて稀・日本では人獣共通として扱わない</td></tr><tr><td>ｂ 天然痘</td><td>×</td><td>ヒト固有の疾患（1980年根絶宣言）→動物リザーバーがない</td></tr><tr><td>ｃ 狂犬病</td><td>○</td><td>動物（犬・コウモリ等）→咬傷によりヒトへ感染→致死率ほぼ100%</td></tr><tr><td>ｄ ブルセラ症</td><td>○</td><td>家畜（牛・豚・羊）→接触・乳製品摂取によりヒトへ感染→4類感染症</td></tr><tr><td>ｅ レジオネラ肺炎</td><td>×</td><td>環境（水系）由来→動物を介さない（人獣共通感染症ではない）</td></tr></table></div>',

"q74": '<div class="eb ee"><h4>□ 多臓器不全（MOF）でみられる所見（3つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 尿量減少</td><td>○</td><td>腎不全（急性尿細管壊死）→乏尿・無尿→MOFの腎障害指標</td></tr><tr><td>ｂ 低酸素血症</td><td>○</td><td>ARDS（急性呼吸窮迫症候群）→肺胞膜障害→低酸素血症→MOFの肺障害指標</td></tr><tr><td>ｃ 乳酸アシドーシス</td><td>○</td><td>組織低灌流→嫌気性代謝亢進→乳酸蓄積→代謝性アシドーシス</td></tr><tr><td>ｄ 血清アルブミン増加</td><td>×</td><td>MOFでは肝機能低下・血管透過性亢進→アルブミンは低下（増加しない）</td></tr><tr><td>ｅ 血清クレアチニン減少</td><td>×</td><td>腎不全→クレアチニンは上昇（減少しない）</td></tr></table></div>',

"q75": '<div class="eb ee"><h4>□ 院内感染（CLABSI）のリスクが最も高い処置</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 出血時間検査</td><td>×</td><td>皮膚への小切開（Ivy法）→短時間で完了・留置なし</td></tr><tr><td>ｂ 末梢静脈からの採血</td><td>×</td><td>一過性の穿刺→留置なし・感染リスクは低い</td></tr><tr><td>ｃ 末梢静脈での点滴針留置</td><td>×</td><td>留置はあるが、末梢静脈→感染リスクは中程度（CVKより低い）</td></tr><tr><td>ｄ 中心静脈栄養カテーテル留置</td><td>○</td><td>CLABSI（中心ライン関連血流感染）→大血管への長期留置・栄養液が培地→感染リスク最高</td></tr><tr><td>ｅ 血液ガス分析のための動脈穿刺</td><td>×</td><td>一過性穿刺（動脈）→留置なし・感染リスクは低い</td></tr></table></div>',

"q78": '<div class="eb ee"><h4>□ 不明熱の原因（4大原因とならない疾患）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 薬剤</td><td>×（原因になる）</td><td>薬剤性発熱（drug fever）は不明熱の重要な原因（10〜15%）</td></tr><tr><td>ｂ 腫瘍</td><td>×（原因になる）</td><td>悪性腫瘍（リンパ腫等）→腫瘍壊死・サイトカイン放出→不明熱の20〜30%</td></tr><tr><td>ｃ 感染症</td><td>×（原因になる）</td><td>不明熱最多原因（30〜40%）→結核・腸チフス・心内膜炎・膿瘍等</td></tr><tr><td>ｄ 膠原病</td><td>×（原因になる）</td><td>自己免疫疾患→Still病・SLE・血管炎等が不明熱の10〜25%</td></tr><tr><td>ｅ 変性疾患</td><td>○（原因となりにくい）</td><td>神経変性・関節変性等→組織壊死・炎症反応が主体でない→不明熱の4大原因に含まれない</td></tr></table></div>',

"q80": '<div class="eb ee"><h4>□ 抗菌薬が有効な感染症（2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>ａ 百日咳</td><td>○</td><td>Bordetella pertussis（細菌）→マクロライド系（AZM・CAM）が有効</td></tr><tr><td>ｂ 日本脳炎</td><td>×</td><td>ウイルス感染症→抗菌薬無効（ワクチン予防が主体）</td></tr><tr><td>ｃ 伝染性紅斑</td><td>×</td><td>パルボウイルスB19（ウイルス）→抗菌薬無効</td></tr><tr><td>ｄ 突発性発疹</td><td>×</td><td>HHV-6（ウイルス）→抗菌薬無効（通常自然治癒）</td></tr><tr><td>ｅ つつが虫病</td><td>○</td><td>Orientia tsutsugamushi（リケッチア）→テトラサイクリン系（DOX）が第一選択</td></tr></table></div>',
}


def inject_ee(html_content, ee_data):
    cards_injected = 0
    def replace_card(m):
        nonlocal cards_injected
        card_html = m.group(0)
        qid_m = re.search(r'id="(q\d+)"', card_html)
        if not qid_m:
            return card_html
        qid = qid_m.group(1)
        if qid not in ee_data:
            return card_html
        if 'class="eb ee"' in card_html:
            return card_html
        ee_html = ee_data[qid]
        insert_marker = '</div></div></div></div>'
        pos = card_html.rfind(insert_marker)
        if pos == -1:
            return card_html
        new_card = card_html[:pos] + ee_html + insert_marker
        cards_injected += 1
        return new_card
    result = re.sub(
        r'<div class="qc"[^>]*>.*?(?=<div class="qc"|$)',
        replace_card,
        html_content,
        flags=re.DOTALL
    )
    print(f"Injected ee blocks: {cards_injected}")
    return result


with open(r'C:\Users\coool\Desktop\MEC\感染症\ch01_kansen_basics.html', encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee(content, EE)

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch01_kansen_basics.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("ch01 written successfully")
