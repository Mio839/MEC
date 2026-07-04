import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ee blocks for ch04 (Q144-Q239)
# Format: question_id -> HTML string to inject inside class="eg" div
EE = {
"q144": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 栄養・水分・安静</td><td>○</td><td>感冒の基本的一般指導</td></tr><tr><td>b 1週間で改善</td><td>○</td><td>ウイルス性感冒の自然経過</td></tr><tr><td>c 抗菌薬を処方</td><td>×</td><td>ウイルス感染に抗菌薬は無効・予防的投与は根拠なし</td></tr><tr><td>d 悪化時再診</td><td>○</td><td>適切な受診指示</td></tr><tr><td>e 水分不摂取時再診</td><td>○</td><td>脱水予防のための適切な受診指示</td></tr></table></div>',

"q145": '<div class="eb ee"><h4>□ 抗菌薬の選択肢比較</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a キノロン系</td><td>×</td><td>GASには過剰・広域すぎる、耐性誘導リスク</td></tr><tr><td>b 抗ウイルス薬</td><td>×</td><td>細菌感染症に抗ウイルス薬は無効</td></tr><tr><td>c ペニシリン系</td><td>○</td><td>GAS咽頭炎の第一選択（アモキシシリン10日間）</td></tr><tr><td>d マクロライド系</td><td>×</td><td>PCアレルギー時の代替（GAS耐性株増加中）</td></tr><tr><td>e 第3世代セフェム</td><td>×</td><td>過剰治療・GAS咽頭炎には広域すぎる</td></tr></table></div>',

"q146": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗菌薬終了</td><td>×</td><td>治療反応中に突然中止は不適切</td></tr><tr><td>b 抗真菌薬追加</td><td>×</td><td>真菌感染の根拠なし</td></tr><tr><td>c 抗MRSA薬追加</td><td>×</td><td>MRSA感染の根拠なし（培養陽性でない）</td></tr><tr><td>d 現在の抗菌薬継続</td><td>○</td><td>治療反応良好→変更せず継続（de-escalation原則）</td></tr></table></div>',

"q147": '<div class="eb ee"><h4>□ 抗菌薬とマイコプラズマ</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ペニシリン系</td><td>×</td><td>細胞壁合成阻害→細胞壁のないマイコプラズマに無効</td></tr><tr><td>b カルバペネム系</td><td>×</td><td>細胞壁合成阻害→マイコプラズマに無効</td></tr><tr><td>c マクロライド系</td><td>○</td><td>タンパク合成阻害→細胞内寄生菌に有効・第一選択</td></tr><tr><td>d アミノグリコシド系</td><td>×</td><td>グラム陰性桿菌が主な対象・細胞内移行不良</td></tr><tr><td>e テトラサイクリン系</td><td>○</td><td>タンパク合成阻害→マイコプラズマ有効・代替薬</td></tr></table></div>',

"q148": '<div class="eb ee"><h4>□ インフルエンザ重症化指標</h4><table class="tb"><tr><th>情報</th><th>評価</th><th>根拠</th></tr><tr><td>①受診動機（症状出現）</td><td>△</td><td>重症化指標にならない</td></tr><tr><td>②家族の罹患</td><td>△</td><td>感染拡大を示すが重症化指標でない</td></tr><tr><td>③発熱（38.2℃）</td><td>△</td><td>発熱自体は重症化の直接指標でない</td></tr><tr><td>④SpO2低下</td><td>○</td><td>低酸素血症→肺炎合併・呼吸不全→最重要重症化指標</td></tr><tr><td>⑤咳嗽増強</td><td>△</td><td>肺炎合併の示唆にはなるが④が最強指標</td></tr></table></div>',

"q149": '<div class="eb ee"><h4>□ 百日咳の特徴（各選択肢）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 空気感染する</td><td>×</td><td>飛沫感染（空気感染ではない）</td></tr><tr><td>b 潜伏期は2〜3日</td><td>×</td><td>潜伏期は7〜14日（約1〜2週）</td></tr><tr><td>c 痙咳期に呼気喘鳴</td><td>×</td><td>吸気性笛声（whoop）が特徴、呼気時ではない</td></tr><tr><td>d セフェム系が有効</td><td>×</td><td>マクロライド系が第一選択（Bordetella pertussis）</td></tr><tr><td>e カタル期にPCR有用</td><td>○</td><td>カタル期が菌排出最大→PCR/LAMP法が診断に最適</td></tr></table></div>',

"q150": '<div class="eb ee"><h4>□ 伝染性単核球症類似症候群の原因</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ライノウイルス</td><td>×</td><td>上気道炎の原因・肝脾腫は起こさない</td></tr><tr><td>b サイトメガロウイルス</td><td>○</td><td>IM類似症候群（発熱・リンパ節腫脹・肝脾腫）の原因</td></tr><tr><td>c 水痘・帯状疱疹ウイルス</td><td>×</td><td>水疱疹が特徴・IM様症候群の原因にならない</td></tr><tr><td>d EBウイルス</td><td>○</td><td>伝染性単核球症の最多原因</td></tr><tr><td>e HIV</td><td>○</td><td>急性HIV感染症（初感染2〜4週）：EBV様症候群</td></tr></table></div>',

"q151": '<div class="eb ee"><h4>□ インフルエンザ指導（各選択肢）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 解熱翌日から登校可</td><td>×</td><td>出席停止基準：発症後5日かつ解熱後2日（小学生）</td></tr><tr><td>b 2日以内は異常行動に留意</td><td>○</td><td>インフルエンザ脳症は発症後2日以内に多い</td></tr><tr><td>c マスク不要</td><td>×</td><td>家族への飛沫感染予防にマスク着用を推奨</td></tr><tr><td>d 口渇なければ水分不要</td><td>×</td><td>発熱時は不感蒸泄増加→積極的水分摂取が必要</td></tr></table></div>',

"q152": '<div class="eb ee"><h4>□ 鼻咽頭ぬぐい液採取手順</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 個人防護具を着用</td><td>○</td><td>飛沫感染対策にPPE必須</td></tr><tr><td>b 患者の側方に立つ</td><td>○</td><td>正面は飛沫直撃リスク→側方が安全</td></tr><tr><td>c 頭部を固定する</td><td>○</td><td>動くと採取不良・鼻腔損傷リスク</td></tr><tr><td>d 上方に向けて挿入</td><td>×</td><td>鼻孔から水平後方に挿入（上方は鼻骨に当たる）</td></tr><tr><td>e 抵抗部で回転採取</td><td>○</td><td>鼻咽頭壁に3〜5秒接触させ回転→適切採取</td></tr></table></div>',

"q153": '<div class="eb ee"><h4>□ COPD合併肺炎の抗菌薬選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セファゾリン</td><td>×</td><td>第1世代セフェム→グラム陽性球菌主体・H.influenzae非カバー</td></tr><tr><td>b バンコマイシン</td><td>×</td><td>抗MRSA薬→MRSA感染の根拠なし</td></tr><tr><td>c クリンダマイシン</td><td>×</td><td>嫌気性菌向け・グラム陰性桿菌カバー不十分</td></tr><tr><td>d セフトリアキソン</td><td>○</td><td>第3世代セフェム→肺炎球菌・H.influenzae・M.catarrhalisをカバー</td></tr></table></div>',

"q154": '<div class="eb ee"><h4>□ 胃全摘後・低栄養患者の抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セファゾリン</td><td>×</td><td>第1世代→緑膿菌に無効</td></tr><tr><td>b ピペラシリン</td><td>○</td><td>抗緑膿菌ペニシリン系→低栄養・免疫低下患者の緑膿菌カバー</td></tr><tr><td>c バンコマイシン</td><td>×</td><td>MRSA用グリコペプチド系→適応なし</td></tr><tr><td>d クリンダマイシン</td><td>×</td><td>嫌気性菌主体・緑膿菌非カバー</td></tr></table></div>',

"q155": '<div class="eb ee"><h4>□ レジオネラに有効な抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セフェム系</td><td>×</td><td>βラクタム系→細胞外作用→細胞内寄生のレジオネラに無効</td></tr><tr><td>b カルバペネム系</td><td>×</td><td>βラクタム系→同様に細胞内移行不良</td></tr><tr><td>c マクロライド系</td><td>○</td><td>細胞内移行良好→レジオネラ第一選択（代替）</td></tr><tr><td>d ニューキノロン系</td><td>○</td><td>細胞内移行良好→レジオネラ第一選択（LVFX等）</td></tr></table></div>',

"q156": '<div class="eb ee"><h4>□ 院内肺炎（各選択肢）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 主要菌は肺炎球菌</td><td>×</td><td>院内肺炎はグラム陰性桿菌・MRSA→肺炎球菌は市中肺炎</td></tr><tr><td>b VAPは含まれない</td><td>×</td><td>VAP（人工呼吸器関連肺炎）はHAPのサブカテゴリー</td></tr><tr><td>c 入院当日も含まれる</td><td>×</td><td>院内肺炎は入院48時間以降の発症と定義</td></tr><tr><td>d 死亡率はNHCAPより低い</td><td>×</td><td>院内肺炎は耐性菌が多く死亡率高い</td></tr><tr><td>e 免疫低下患者に多い</td><td>○</td><td>免疫抑制・術後・高齢→宿主防御機能低下で院内肺炎リスク↑</td></tr></table></div>',

"q157": '<div class="eb ee"><h4>□ 器質化肺炎（COP）の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 人工呼吸管理</td><td>○</td><td>SpO2低下・呼吸不全→気道確保・人工呼吸が必要</td></tr><tr><td>b 抗線維化薬投与</td><td>×</td><td>ニンテダニブ・ピルフェニドンはIPF用→COPには適応なし</td></tr><tr><td>c 気管支鏡下肺生検</td><td>×</td><td>COPの確定診断に使うが、現在呼吸不全→緊急処置優先</td></tr><tr><td>d 副腎皮質ステロイド</td><td>○</td><td>COPの主力治療（PSL）→劇的に奏効する</td></tr></table></div>',

"q158": '<div class="eb ee"><h4>□ 白血球正常の肺炎の鑑別</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 風疹</td><td>×</td><td>発疹熱→肺炎は特徴的でない</td></tr><tr><td>b 麻疹</td><td>×</td><td>肺炎合併あるが、Koplik斑・カタル症状が先行する</td></tr><tr><td>c アスペルギルス感染症</td><td>×</td><td>免疫不全患者に多い→13歳健常女子では考えにくい</td></tr><tr><td>d マイコプラズマ感染症</td><td>○</td><td>若年者・集団発生・白血球正常・乾性咳嗽→典型的非定型肺炎</td></tr></table></div>',

"q159": '<div class="eb ee"><h4>□ GAS vs EBV鑑別の所見</h4><table class="tb"><tr><th>所見</th><th>GAS</th><th>EBV</th></tr><tr><td>頭痛</td><td>○</td><td>○（どちらも）</td></tr><tr><td>発熱</td><td>○</td><td>○（どちらも）</td></tr><tr><td>咽頭発赤</td><td>○</td><td>○（どちらも）</td></tr><tr><td>乾性咳嗽</td><td>△</td><td>△（どちらも非特異的）</td></tr><tr><td>後頸部リンパ節腫脹</td><td>×（前頸部主体）</td><td>○（EBVに特徴的）</td></tr></table></div>',

"q160": '<div class="eb ee"><h4>□ 重症肺炎の初期検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 血液培養</td><td>○</td><td>菌血症の評価→抗菌薬前に採取（2セット）</td></tr><tr><td>b 喀痰Gram染色</td><td>○</td><td>起炎菌の迅速推定→治療薬選択に直結</td></tr><tr><td>c 喀痰Grocott染色</td><td>×</td><td>真菌（PCP・アスペルギルス）用→免疫正常者には不要</td></tr><tr><td>d 血中アスペルギルス抗原</td><td>×</td><td>免疫不全患者のアスペルギルス症検索→適応なし</td></tr></table></div>',

"q161": '<div class="eb ee"><h4>□ A-DROPスコアと入院適応</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 外来治療</td><td>○</td><td>A-DROP 0点（年齢52歳・SpO297%・食事可）→外来可</td></tr><tr><td>b 高炎症反応→入院</td><td>×</td><td>CRPは重症度判定に使わない（A-DROPはCRP含まない）</td></tr><tr><td>c 肺炎球菌→ICU</td><td>×</td><td>原因菌だけでICU基準にはならない・A-DROP 4〜5点でICU</td></tr><tr><td>d 肝機能障害→入院</td><td>×</td><td>肝機能障害はA-DROPの評価項目でない</td></tr></table></div>',

"q162": '<div class="eb ee"><h4>□ MRSA-VAP対応の選択肢</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 上体30度挙上</td><td>×</td><td>VAP予防策（発症後の治療ではない）</td></tr><tr><td>b ドレーン排液確認</td><td>×</td><td>膿胸疑い時→MRSAが培養陽性→抗菌薬変更が先</td></tr><tr><td>c カフ圧確認</td><td>×</td><td>VAP予防策・発症後の優先事項でない</td></tr><tr><td>d 抗菌薬を変更</td><td>○</td><td>MRSA検出→アンピシリンからバンコマイシンへ変更</td></tr></table></div>',

"q163": '<div class="eb ee"><h4>□ 誤嚥性肺炎の再発予防薬剤</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 睡眠薬</td><td>×（減量対象）</td><td>BZD系→嚥下反射・咳反射を抑制→誤嚥リスク増大</td></tr><tr><td>b 去痰薬</td><td>○（継続）</td><td>分泌物の排出を助ける→誤嚥予防に役立つ</td></tr><tr><td>c 胃粘膜保護薬</td><td>○（継続）</td><td>誤嚥性肺炎の誘発因子にならない</td></tr><tr><td>d 腸管蠕動改善薬</td><td>○（継続）</td><td>便秘・腸閉塞予防→誤嚥との直接関係薄</td></tr></table></div>',

"q164": '<div class="eb ee"><h4>□ 高齢者施設肺炎の起炎菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a E.coli</td><td>×</td><td>腸管・尿路感染の代表菌→呼吸器感染では少ない</td></tr><tr><td>b K.pneumoniae</td><td>×</td><td>糖尿病・アルコール中毒患者に多い→本例には当たらない</td></tr><tr><td>c P.aeruginosa</td><td>×</td><td>免疫不全・気管支拡張症・長期入院患者に多い</td></tr><tr><td>d S.pneumoniae</td><td>○</td><td>市中肺炎・高齢者施設肺炎の最多起炎菌</td></tr></table></div>',

"q165": '<div class="eb ee"><h4>□ 誤嚥性肺炎の起炎菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 腸球菌属</td><td>×</td><td>尿路感染・腹腔内感染に多い→誤嚥性肺炎では少ない</td></tr><tr><td>b 放線菌属</td><td>×</td><td>放線菌症（放線菌症は慢性肉芽腫）→誤嚥性肺炎の代表菌でない</td></tr><tr><td>c Candida属</td><td>×</td><td>真菌→免疫不全者に多い・誤嚥性肺炎の主役でない</td></tr><tr><td>d 連鎖球菌属</td><td>○</td><td>口腔内常在菌の最多→誤嚥性肺炎の主要起炎菌</td></tr></table></div>',

"q166": '<div class="eb ee"><h4>□ 誤嚥性肺炎（ショック）の初期治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 培養結果待ち</td><td>×</td><td>ショック状態→直ちに経験的抗菌薬投与が必要</td></tr><tr><td>b アムホテリシンB</td><td>×</td><td>抗真菌薬→真菌感染の根拠なし</td></tr><tr><td>c ゲンタマイシン</td><td>×</td><td>腎毒性・嫌気性菌カバー不良→誤嚥性肺炎の初期治療に不適</td></tr><tr><td>d スルバクタム・アンピシリン</td><td>○</td><td>嫌気性菌＋グラム陰性桿菌をカバー→誤嚥性肺炎第一選択</td></tr></table></div>',

"q167": '<div class="eb ee"><h4>□ 肺炎と抗菌薬の組合せ</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 市中肺炎—グリコペプチド系</td><td>×</td><td>グリコペプチド（バンコマイシン）はMRSA用→市中肺炎には過剰</td></tr><tr><td>b 院内肺炎—テトラサイクリン系</td><td>×</td><td>院内肺炎の主役は緑膿菌・MRSA→テトラサイクリンでは不十分</td></tr><tr><td>c 非定型肺炎—アミノグリコシド系</td><td>×</td><td>アミノグリコシドは細胞内移行不良→マイコプラズマに無効</td></tr><tr><td>d COP—ニューキノロン系</td><td>×</td><td>COPは自己免疫性→ステロイドが主力・抗菌薬は不要</td></tr><tr><td>e VAP—カルバペネム系</td><td>○</td><td>多剤耐性グラム陰性桿菌カバー→重症VAPの標準治療</td></tr></table></div>',

"q168": '<div class="eb ee"><h4>□ オウム病の抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セフェム系</td><td>×</td><td>細胞外作用→細胞内寄生のC.psittaciに無効</td></tr><tr><td>b ペニシリン系</td><td>×</td><td>同様に細胞内移行不良</td></tr><tr><td>c マクロライド系</td><td>○</td><td>細胞内移行良好→C.psittaciに有効（代替薬）</td></tr><tr><td>d アミノ配糖体系</td><td>×</td><td>細胞内移行不良・腎毒性</td></tr></table></div>',

"q169": '<div class="eb ee"><h4>□ 肺炎の治療選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 外来+βラクタム経口</td><td>×</td><td>軽症市中肺炎のみ→この患者は入院レベル</td></tr><tr><td>b 外来+アミノグリコシド経口</td><td>×</td><td>アミノグリコシドは経口吸収不良→経口投与は意味なし</td></tr><tr><td>c 入院+βラクタム静注</td><td>○</td><td>入院治療の標準→セフトリアキソン等で確実な血中濃度確保</td></tr><tr><td>d 入院+アミノグリコシド静注</td><td>×</td><td>腎毒性・嫌気性菌カバー不足→市中肺炎の第一選択でない</td></tr></table></div>',

"q170": '<div class="eb ee"><h4>□ 抗菌薬投与期間の目安</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 解熱確認日</td><td>×</td><td>解熱当日終了は早すぎる→再燃リスク</td></tr><tr><td>b 解熱後2〜3日</td><td>○</td><td>市中肺炎（菌血症なし）の標準的終了目安</td></tr><tr><td>c 解熱後7日</td><td>×</td><td>不必要な長期投与→耐性菌誘導リスク</td></tr><tr><td>d 解熱後14日</td><td>×</td><td>レジオネラ・Pseudomonas等の特例→一般市中肺炎には不要</td></tr></table></div>',

"q172": '<div class="eb ee"><h4>□ ライ症候群の確定診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 血中アスピリン濃度</td><td>×</td><td>ライ症候群の診断は病理（肝生検）→薬剤濃度は診断にならない</td></tr><tr><td>b 髄液ウイルス抗体価</td><td>×</td><td>ウイルス性脳炎との鑑別には使うが確定診断でない</td></tr><tr><td>c 脳波</td><td>×</td><td>脳症評価に有用→ライ症候群の病理診断にならない</td></tr><tr><td>d 脳SPECT</td><td>×</td><td>血流評価→ライ症候群特有でない</td></tr><tr><td>e 肝生検</td><td>○</td><td>ミトコンドリア腫大・脂肪変性→電子顕微鏡で確定診断</td></tr></table></div>',

"q173": '<div class="eb ee"><h4>□ EBV感染症（免疫正常者）の対応</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 経過観察</td><td>○</td><td>免疫正常者のEBV感染→自然治癒（2〜4週）・支持療法</td></tr><tr><td>b 血漿交換</td><td>×</td><td>重症自己免疫疾患・TTP等に使用→EBVには適応なし</td></tr><tr><td>c アシクロビル投与</td><td>×</td><td>EBVへの有効性は限定的→日常的には推奨されない</td></tr><tr><td>d アンピシリン投与</td><td>×</td><td>EBVにアンピシリン投与→全身性皮疹が高率に発現（禁忌）</td></tr></table></div>',

"q174": '<div class="eb ee"><h4>□ A群溶連菌感染後合併症</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 冠動脈瘤</td><td>×</td><td>川崎病の合併症（A群溶連菌感染後ではない）</td></tr><tr><td>b 間質性肺炎</td><td>×</td><td>A群溶連菌感染後の合併症でない</td></tr><tr><td>c 血小板減少</td><td>×</td><td>溶連菌感染後の非化膿性合併症でない（ITP等とは別）</td></tr><tr><td>d 急性糸球体腎炎</td><td>○</td><td>PSAGN：感染後1〜3週・血尿・蛋白尿・浮腫・高血圧</td></tr></table></div>',

"q175": '<div class="eb ee"><h4>□ MRSA関節炎への追加検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a エンドトキシン</td><td>×</td><td>グラム陰性菌敗血症の指標→MRSAはグラム陽性菌</td></tr><tr><td>b 血液培養</td><td>○</td><td>化膿性関節炎では菌血症を高率に合併→起炎菌の確認必須</td></tr><tr><td>c 尿酸</td><td>×</td><td>痛風の評価→感染症の評価でない</td></tr><tr><td>d 尿中アルブミン</td><td>×</td><td>腎機能評価→現時点での優先事項でない</td></tr></table></div>',

"q176": '<div class="eb ee"><h4>□ MRSA感染症の抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アンピシリン</td><td>×</td><td>βラクタム系→MRSAはβラクタム系全般に耐性</td></tr><tr><td>b クラリスロマイシン</td><td>×</td><td>マクロライド系→MRSAへの確実な有効性なし</td></tr><tr><td>c クリンダマイシン</td><td>×</td><td>嫌気性菌向け→抗MRSA活性は限定的</td></tr><tr><td>d バンコマイシン</td><td>○</td><td>グリコペプチド系→MRSA感染症の第一選択薬</td></tr></table></div>',

"q177": '<div class="eb ee"><h4>□ 術後急性肺塞栓症の診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胸部造影CT</td><td>○</td><td>CT肺動脈造影（CTPA）→肺動脈内の充填欠損→PEの確定診断</td></tr><tr><td>b 心エコー</td><td>×</td><td>右心負荷の評価に有用→PEの確定診断にはならない</td></tr><tr><td>c 心電図</td><td>×</td><td>S1Q3T3パターン→PEを示唆するが確定でない</td></tr><tr><td>d スパイロメトリ</td><td>×</td><td>慢性呼吸器疾患の評価→急性期PEには不適切</td></tr></table></div>',

"q178": '<div class="eb ee"><h4>□ COVID-19事前確率を高める情報</h4><table class="tb"><tr><th>情報</th><th>評価</th><th>根拠</th></tr><tr><td>①同居者がCOVID-19確定</td><td>○</td><td>確定した濃厚接触歴→事前確率を最も高める</td></tr><tr><td>②発熱</td><td>△</td><td>非特異的→多くの感染症でも発熱する</td></tr><tr><td>③咳嗽</td><td>△</td><td>非特異的→風邪・インフルエンザ等でも同様</td></tr><tr><td>④倦怠感</td><td>△</td><td>非特異的症状→COVID-19に特有でない</td></tr></table></div>',

"q179": '<div class="eb ee"><h4>□ 抗原陰性後の次の検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a SARS-CoV-2 PCR</td><td>○</td><td>抗原検査は感度約80%→偽陰性あり→感度約95%のPCRで確認</td></tr><tr><td>b インフルエンザ迅速検査</td><td>×</td><td>COVID-19の確認が優先→インフルエンザの鑑別は後回し</td></tr><tr><td>c アデノウイルス迅速検査</td><td>×</td><td>COVID-19確認前に他のウイルス検索は優先順位が低い</td></tr><tr><td>d マイコプラズマ迅速検査</td><td>×</td><td>非定型肺炎の検索→現時点での優先事項でない</td></tr></table></div>',

"q180": '<div class="eb ee"><h4>□ 誤嚥を疑う所見の評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 発熱</td><td>○（誤嚥所見）</td><td>誤嚥性肺炎→発熱が主徴</td></tr><tr><td>b 湿性咳嗽</td><td>○（誤嚥所見）</td><td>気道内分泌物貯留→湿性咳嗽</td></tr><tr><td>c 味覚障害</td><td>×（誤嚥と無関係）</td><td>亜鉛欠乏・薬剤性・口腔乾燥が原因→誤嚥所見でない</td></tr><tr><td>d 喀痰増加</td><td>○（誤嚥所見）</td><td>気道内への誤嚥→分泌物増加</td></tr></table></div>',

"q181": '<div class="eb ee"><h4>□ EBV感染症・水分摂取不能時の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 補液</td><td>○</td><td>水分摂取不能→脱水予防に輸液が最優先</td></tr><tr><td>b 口蓋扁桃摘出術</td><td>×</td><td>急性期には行わない→脾腫破裂リスク・出血</td></tr><tr><td>c ペニシリン投与</td><td>×</td><td>EBVはウイルス→ペニシリンは無効（GAS咽頭炎ではない）</td></tr><tr><td>d 抗ウイルス薬投与</td><td>×</td><td>EBVへの確実な抗ウイルス薬なし→対症療法が基本</td></tr></table></div>',

"q182": '<div class="eb ee"><h4>□ 意識障害患者の誤嚥予防処置</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 輸血</td><td>×</td><td>出血・貧血の根拠なし→適応なし</td></tr><tr><td>b 気管挿管</td><td>×</td><td>SpO2・呼吸状態の記載なし→現時点では優先度低い</td></tr><tr><td>c 経鼻胃管挿入</td><td>○</td><td>嘔吐繰り返し＋意識障害→胃内容物の除去で誤嚥防止</td></tr><tr><td>d ヘパリン投与</td><td>×</td><td>抗凝固療法の適応なし（脳卒中急性期は慎重投与）</td></tr></table></div>',

"q183": '<div class="eb ee"><h4>□ 検査陰性後の事後確率（Bayes定理）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 10%</td><td>○</td><td>LR-=0.2/0.9≒0.22、事前オッズ=0.11→事後オッズ≒0.024→事後確率≒2%→選択肢aが最も近い（実際約2%）</td></tr><tr><td>b 25%</td><td>×</td><td>計算値と合わない</td></tr><tr><td>c 40%</td><td>×</td><td>計算値と合わない</td></tr><tr><td>d 50%</td><td>×</td><td>計算値と合わない</td></tr></table></div>',

"q184": '<div class="eb ee"><h4>□ EBVの感染経路（感染源）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 尿</td><td>×</td><td>CMVは尿中に排泄→CMVの感染源（EBVは尿中排泄なし）</td></tr><tr><td>b 汗</td><td>×</td><td>EBVは汗中に排泄されない</td></tr><tr><td>c 唾液</td><td>○</td><td>EBVの主要感染源→口腔咽頭上皮で活発に複製→唾液中に排泄</td></tr><tr><td>d 糞便</td><td>×</td><td>EBVは糞口感染しない（ノロウイルス等は糞口感染）</td></tr></table></div>',

"q185": '<div class="eb ee"><h4>□ 嚥下障害患者の食事形態</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 凝集性が高い</td><td>○</td><td>食塊がまとまる→バラバラにならず誤嚥防止</td></tr><tr><td>b 均質性が低い</td><td>×</td><td>不均一な食品→咽頭内でばらける→誤嚥リスク↑</td></tr><tr><td>c 付着性が高い</td><td>×</td><td>べたつき→口腔・咽頭に残留→誤嚥リスク↑</td></tr><tr><td>d 硬度が高い</td><td>×</td><td>硬い食品→咀嚼困難→誤嚥リスク↑</td></tr></table></div>',

"q186": '<div class="eb ee"><h4>□ レジオネラ肺炎の特徴</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 集団感染がみられる</td><td>○</td><td>冷却塔・温泉・加湿器のエアロゾル→集団発生</td></tr><tr><td>b 中枢神経系症状</td><td>○</td><td>頭痛・意識障害・精神症状がみられる</td></tr><tr><td>c 低ナトリウム血症</td><td>○</td><td>SIADH→レジオネラに特徴的な検査所見</td></tr><tr><td>d βラクタム系が有効</td><td>×</td><td>細胞内寄生菌→βラクタム系（細胞外作用）は無効</td></tr></table></div>',

"q187": '<div class="eb ee"><h4>□ EBV感染症の対症療法薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アシクロビル</td><td>×</td><td>EBVへの有効性は限定的→通常は推奨されない</td></tr><tr><td>b アセトアミノフェン</td><td>○</td><td>解熱・鎮痛→EBV感染症の対症療法に安全・適切</td></tr><tr><td>c アンピシリン</td><td>×</td><td>EBV感染症にアンピシリン→全身性皮疹（禁忌に準じる）</td></tr><tr><td>d オセルタミビル</td><td>×</td><td>抗インフルエンザ薬→EBVには無効</td></tr></table></div>',

"q188": '<div class="eb ee"><h4>□ 若年者・血痰の鑑別診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺癌</td><td>×</td><td>23歳・非喫煙→肺癌は考えにくい</td></tr><tr><td>b 気管支喘息</td><td>×</td><td>喘鳴・発作性呼吸困難→本例は乾性咳嗽のみ</td></tr><tr><td>c 急性気管支炎</td><td>○</td><td>若年者・ウイルス性・乾性咳嗽・少量血痰→炎症による粘膜出血</td></tr><tr><td>d Goodpasture症候群</td><td>×</td><td>抗GBM抗体・肺胞出血＋急速進行性糸球体腎炎→本例には合わない</td></tr></table></div>',

"q189": '<div class="eb ee"><h4>□ 誤嚥後の緊急気道管理</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胃洗浄</td><td>×</td><td>経口中毒時の処置→誤嚥性肺炎には不適切</td></tr><tr><td>b 気管挿管</td><td>○</td><td>気道確保・人工呼吸・気管内吸引→誤嚥後呼吸不全への対処</td></tr><tr><td>c アトロピン静注</td><td>×</td><td>徐脈・有機リン中毒時→本例には適応なし</td></tr><tr><td>d フロセミド静注</td><td>×</td><td>利尿薬→肺水腫への対処→誤嚥性肺炎の初期処置でない</td></tr></table></div>',

"q190": '<div class="eb ee"><h4>□ 誤嚥性肺炎と合致しない所見</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胸郭打診による濁音</td><td>○（合致する）</td><td>肺炎→空気が液体に置換→打診音が濁音化</td></tr><tr><td>b 皮下握雪感</td><td>×（合致しない）</td><td>皮下気腫のサイン→気胸・縦隔気腫・食道穿孔で生じる</td></tr><tr><td>c 口腔内の吐物残渣</td><td>○（合致する）</td><td>誤嚥の直接証拠</td></tr><tr><td>d Coarse crackles</td><td>○（合致する）</td><td>分泌物貯留・肺炎→Coarse crackles聴取</td></tr></table></div>',

"q191": '<div class="eb ee"><h4>□ インフルエンザの疫学</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 成人の罹患率が高い</td><td>×</td><td>小児・学童の罹患率が最も高い（集団生活による伝播）</td></tr><tr><td>b 年間1〜2万人</td><td>×</td><td>年間推定患者数は約1,000万人</td></tr><tr><td>c 4〜5月がピーク</td><td>×</td><td>流行ピークは1〜2月（冬季）</td></tr><tr><td>d 高齢者の致死率が高い</td><td>○</td><td>肺炎合併・基礎疾患→高齢者の致死率が他年齢層より高い</td></tr></table></div>',

"q192": '<div class="eb ee"><h4>□ 汚染源と病原体の組合せ</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 海水—レジオネラ</td><td>×</td><td>レジオネラは淡水系（冷却塔・温泉・加湿器）→海水は感染源でない</td></tr><tr><td>b 食材—ノロウイルス</td><td>○</td><td>カキ等の二枚貝→ノロウイルス食中毒の代表的汚染源</td></tr><tr><td>c 井戸水—エルシニア</td><td>○</td><td>汚染井戸水→エルシニア感染症（腸炎・敗血症）</td></tr><tr><td>d 水道水—クリプトスポリジウム</td><td>○</td><td>塩素耐性→水道水の塩素処理でも除去できない</td></tr></table></div>',

"q193": '<div class="eb ee"><h4>□ 重症肺炎患者への電話対応</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a NSAIDを服用</td><td>×</td><td>高齢者にNSAID→腎障害・胃腸障害リスク・肺炎の根本治療にならない</td></tr><tr><td>b 直ちに救急搬送</td><td>○</td><td>39℃発熱＋呼吸困難→高齢者の重症肺炎サイン→緊急対応</td></tr><tr><td>c 外来終了後に再連絡</td><td>×</td><td>数時間の待機→重症化・死亡リスク</td></tr><tr><td>d 安静・水分摂取</td><td>×</td><td>呼吸困難がある→自宅安静は危険・搬送が必要</td></tr></table></div>',

"q194": '<div class="eb ee"><h4>□ 高齢者施設の発熱・呼吸困難の診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺炎</td><td>○</td><td>39℃発熱＋湿性咳嗽＋呼吸困難＋高齢者施設入所→肺炎が最有力</td></tr><tr><td>b 腎盂腎炎</td><td>×</td><td>排尿時痛・頻尿等の尿路症状の記載なし</td></tr><tr><td>c 創部感染</td><td>×</td><td>創部・手術歴の記載なし</td></tr><tr><td>d 急性胆管炎</td><td>×</td><td>右上腹部痛・黄疸等の記載なし</td></tr></table></div>',

"q196": '<div class="eb ee"><h4>□ 抗菌薬治療効果の早期指標</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 呼吸数の減少</td><td>○</td><td>バイタルサイン→治療開始24〜48時間で最も早く改善する指標</td></tr><tr><td>b 下腿浮腫の消失</td><td>×</td><td>感染とは直接関連しない</td></tr><tr><td>c CRP正常化</td><td>×</td><td>CRPは治療後1〜2週間かけて低下→早期指標でない</td></tr><tr><td>d 白血球数正常化</td><td>×</td><td>数日〜1週間かけて改善→呼吸数より遅れる</td></tr></table></div>',

"q197": '<div class="eb ee"><h4>□ 軽症インフルエンザの対応</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 点滴をしましょう</td><td>×</td><td>軽症・若年者→経口水分補給で十分・点滴は不要</td></tr><tr><td>b 入院して治療</td><td>×</td><td>20歳健常者・合併症なし→外来管理で十分</td></tr><tr><td>c 自宅で安静</td><td>○</td><td>軽症インフルエンザ→安静・水分・アセトアミノフェン・必要に応じ抗ウイルス薬</td></tr><tr><td>d 胸部X線撮影</td><td>×</td><td>肺炎合併を疑う所見なし→不要な検査</td></tr></table></div>',

"q198": '<div class="eb ee"><h4>□ EBV感染症の診断に有用な検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a CK</td><td>×</td><td>筋疾患・心筋梗塞の指標→EBVには有用でない</td></tr><tr><td>b アルブミン</td><td>×</td><td>栄養状態・肝機能の間接指標→診断には使わない</td></tr><tr><td>c アミラーゼ</td><td>×</td><td>膵炎・唾液腺炎の指標→EBVに特異的でない</td></tr><tr><td>d クレアチニン</td><td>×</td><td>腎機能指標→EBV診断に使わない</td></tr><tr><td>e 末梢血白血球分画</td><td>○</td><td>異型リンパ球（Downey細胞）→EBV感染症の特徴的所見</td></tr></table></div>',

"q199": '<div class="eb ee"><h4>□ アルコール手指消毒の有効性</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 破傷風菌</td><td>×</td><td>芽胞形成菌→アルコールで芽胞は死滅しない（石鹸と流水）</td></tr><tr><td>b ノロウイルス</td><td>×</td><td>エンベロープなしウイルス→アルコール抵抗性（次亜塩素酸が有効）</td></tr><tr><td>c ロタウイルス</td><td>×</td><td>エンベロープなし→アルコール抵抗性</td></tr><tr><td>d ボツリヌス菌</td><td>×</td><td>芽胞形成菌→アルコール無効</td></tr><tr><td>e インフルエンザウイルス</td><td>○</td><td>エンベロープ有ウイルス→アルコールで脂質二重層が破壊され不活化</td></tr></table></div>',

"q200": '<div class="eb ee"><h4>□ 伝染性単核球症の特徴</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 空気感染する</td><td>×</td><td>唾液による飛沫・接触感染（空気感染はしない）</td></tr><tr><td>b アシクロビルが著効</td><td>×</td><td>EBVへのアシクロビル効果は限定的→著効はしない</td></tr><tr><td>c アンピシリンは禁忌</td><td>○</td><td>EBV感染症にアンピシリン→全身性丘疹状発疹が高頻度発現</td></tr><tr><td>d 皮疹は二峰性</td><td>×</td><td>皮疹は一峰性（アンピシリン投与時は遅発性）</td></tr></table></div>',

"q202": '<div class="eb ee"><h4>□ ウイルス性扁桃炎を示唆する所見</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 後頸リンパ節腫大</td><td>○</td><td>EBV等のウイルス感染→後頸部リンパ節腫大が特徴（GASは前頸部）</td></tr><tr><td>b 口蓋垂偏位</td><td>×</td><td>扁桃周囲膿瘍（細菌性）を示唆→ウイルス性ではない</td></tr><tr><td>c 結膜充血なし</td><td>×</td><td>アデノウイルス（ウイルス性）は結膜炎を伴う→陰性は特異的でない</td></tr><tr><td>d 肝脾腫なし</td><td>×</td><td>EBVでは肝脾腫あり→なしはウイルス性を示唆しない</td></tr></table></div>',

"q203": '<div class="eb ee"><h4>□ 誤嚥予防法の評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 顎を上げて食べる</td><td>×</td><td>頸部後屈→気道が開いて誤嚥リスク増大</td></tr><tr><td>b 鎮咳薬を投与</td><td>×</td><td>咳反射を抑制→誤嚥を増加させる</td></tr><tr><td>c 仰臥位で食べる</td><td>×</td><td>重力が逆→誤嚥リスク大幅増加</td></tr><tr><td>d 食べ物にとろみをつける</td><td>○</td><td>液体の流速を低下→嚥下反射が遅い高齢者でも対処可能</td></tr></table></div>',

"q204": '<div class="eb ee"><h4>□ 乳幼児発熱＋肝脾腫の鑑別</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a EBウイルス感染症</td><td>○</td><td>乳幼児EBV→発熱・頸部リンパ節腫脹・肝脾腫（不顕性感染が多い）</td></tr><tr><td>b パルボウイルスB19</td><td>×</td><td>りんご病（伝染性紅斑）→頬部発疹・顔面熱感が主症状</td></tr><tr><td>c 単純ヘルペスウイルス</td><td>×</td><td>口腔粘膜病変（歯肉口内炎）→肝脾腫は特徴でない</td></tr><tr><td>d CMV感染症</td><td>○</td><td>乳幼児CMV→発熱・リンパ節腫脹・肝脾腫（EBVと類似）</td></tr></table></div>',

"q205": '<div class="eb ee"><h4>□ ウイルスと病態の組合せ</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺炎—アデノウイルス</td><td>×</td><td>アデノウイルス肺炎は小児に多い→成人では少ない</td></tr><tr><td>b 上気道炎—ライノウイルス</td><td>○</td><td>成人普通感冒の約50%はライノウイルスが原因</td></tr><tr><td>c 喘息増悪—CMV</td><td>×</td><td>喘息増悪はライノウイルス・RSV→CMVは免疫不全者に多い</td></tr><tr><td>d 気管支拡張症増悪—RSV</td><td>×</td><td>RSVは乳幼児細気管支炎の主役→成人の気管支拡張症増悪はインフルエンザ等</td></tr></table></div>',

"q206": '<div class="eb ee"><h4>□ インフルエンザ後の細菌性肺炎の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ザナミビル</td><td>×</td><td>抗インフルエンザ薬→ウイルスは治癒・二次性細菌肺炎への効果なし</td></tr><tr><td>b アシクロビル</td><td>×</td><td>抗ヘルペス薬→細菌肺炎には効果なし</td></tr><tr><td>c ミノサイクリン</td><td>×</td><td>非定型肺炎向け→S.aureus/S.pneumoniae等には不十分</td></tr><tr><td>d オセルタミビル</td><td>×</td><td>抗インフルエンザ薬→細菌感染には無効</td></tr><tr><td>e スルバクタム・アンピシリン</td><td>○</td><td>S.aureus・S.pneumoniae・H.influenzae・嫌気性菌をカバー</td></tr></table></div>',

"q207": '<div class="eb ee"><h4>□ 急性上気道炎の鑑別診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺炎</td><td>×</td><td>呼吸音正常・下気道症状なし→肺炎を否定</td></tr><tr><td>b 気管支喘息</td><td>×</td><td>喘鳴・発作性呼吸困難なし→喘息を否定</td></tr><tr><td>c 急性上気道炎</td><td>○</td><td>鼻汁・咽頭痛・軽度咳嗽・微熱・透明鼻汁→典型的感冒</td></tr><tr><td>d 伝染性単核球症</td><td>×</td><td>リンパ節腫脹・脾腫・異型リンパ球なし→EBVを否定</td></tr></table></div>',

"q208": '<div class="eb ee"><h4>□ マイコプラズマ肺炎の特徴</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 重症肺炎が多い</td><td>×</td><td>通常は軽症〜中等症（"Walking pneumonia"）</td></tr><tr><td>b 50歳代に最も多い</td><td>×</td><td>5〜35歳の若年者に多い</td></tr><tr><td>c 比較的徐脈を呈する</td><td>×</td><td>比較的徐脈はレジオネラの特徴（マイコプラズマではない）</td></tr><tr><td>d Gram染色で陰性桿菌</td><td>×</td><td>マイコプラズマは細胞壁なし→Gram染色で染まらない</td></tr><tr><td>e マクロライド耐性株が増加</td><td>○</td><td>日本では小児を中心にマクロライド耐性株が増加</td></tr></table></div>',

"q209": '<div class="eb ee"><h4>□ 誤嚥性肺炎の再発予防</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 口腔ケア</td><td>○</td><td>口腔内菌量を減少→誤嚥しても肺炎リスクを低下（エビデンスあり）</td></tr><tr><td>b 食後の臥位安静</td><td>×</td><td>食後の仰臥位→逆流・誤嚥リスク増加</td></tr><tr><td>c 鎮咳薬の服用</td><td>×</td><td>咳反射の抑制→誤嚥物を排出できなくなる</td></tr><tr><td>d 向精神薬の服用</td><td>×</td><td>鎮静→嚥下反射低下・誤嚥リスク増加</td></tr></table></div>',

"q210": '<div class="eb ee"><h4>□ 患者安全（患者確認）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 紹介状はお持ちですか</td><td>×</td><td>患者確認前に紹介状を聞くのは順序が逆</td></tr><tr><td>b 今日はどうされましたか</td><td>×</td><td>主訴聴取→患者確認後に行う</td></tr><tr><td>c 体温の測定は済みましたか</td><td>×</td><td>バイタル確認→本人確認後に行う</td></tr><tr><td>d どなたか一緒に来られましたか</td><td>×</td><td>同伴者確認→本人確認後</td></tr><tr><td>e フルネームでおっしゃっていただけますか</td><td>○</td><td>最初の本人確認→フルネームで誤認を防ぐ</td></tr></table></div>',

"q211": '<div class="eb ee"><h4>□ 市中肺炎の抗菌薬選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ペニシリン系</td><td>○</td><td>市中肺炎最多の肺炎球菌に第一選択（AMPC）</td></tr><tr><td>b カルバペネム系</td><td>×</td><td>多剤耐性菌・重症院内感染向け→市中肺炎には過剰治療</td></tr><tr><td>c マクロライド系</td><td>×</td><td>非定型肺炎（マイコプラズマ等）向け→典型肺炎には第一選択でない</td></tr><tr><td>d ニューキノロン系</td><td>×</td><td>結核診断遅延リスク・市中肺炎への乱用を避けるべき</td></tr></table></div>',

"q212": '<div class="eb ee"><h4>□ レジオネラ肺炎の抗菌薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セファロスポリン系</td><td>×</td><td>βラクタム系→細胞外作用→細胞内寄生レジオネラに無効</td></tr><tr><td>b ニューキノロン系</td><td>○</td><td>細胞内移行良好→レジオネラ第一選択（LVFX）</td></tr><tr><td>c マクロライド系</td><td>○</td><td>細胞内移行良好→レジオネラ代替薬（AZM）</td></tr><tr><td>d カルバペネム系</td><td>×</td><td>βラクタム系→同様に細胞内移行不良</td></tr></table></div>',

"q213": '<div class="eb ee"><h4>□ 尿中抗原検査の対象菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a S.pneumoniae</td><td>○</td><td>肺炎球菌尿中抗原→重症市中肺炎の迅速診断に有用</td></tr><tr><td>b P.aeruginosa</td><td>×</td><td>緑膿菌の尿中抗原検査は臨床使用されていない</td></tr><tr><td>c M.pneumoniae</td><td>×</td><td>マイコプラズマ→血清抗体・PCRで診断（尿中抗原なし）</td></tr><tr><td>d L.pneumophila</td><td>○</td><td>レジオネラ尿中抗原→重症肺炎の迅速診断に有用（血清型1型のみ）</td></tr></table></div>',

"q214": '<div class="eb ee"><h4>□ EBV感染症の確定診断検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 咽頭培養</td><td>×</td><td>細菌性咽頭炎（GAS等）の診断→EBV（ウイルス）は培養不可</td></tr><tr><td>b 骨髄穿刺</td><td>×</td><td>血液悪性腫瘍の鑑別に使用→EBVの診断には通常不要</td></tr><tr><td>c リンパ節生検</td><td>×</td><td>悪性リンパ腫との鑑別→EBVの第一診断法でない</td></tr><tr><td>d 鼻腔ぬぐい液迅速検査</td><td>×</td><td>インフルエンザ等の検査→EBVには対応していない</td></tr><tr><td>e 血清ウイルス抗体価</td><td>○</td><td>EBV-VCA IgM（急性期マーカー）→EBV感染症の確定診断</td></tr></table></div>',

"q216": '<div class="eb ee"><h4>□ EBV感染症・水分摂取不能の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 輸液療法</td><td>○</td><td>食事水分摂取不能→脱水予防に輸液が最優先</td></tr><tr><td>b アシクロビル投与</td><td>×</td><td>EBVには著効しない→通常推奨されない</td></tr><tr><td>c 副腎皮質ステロイド</td><td>×</td><td>重症例（気道閉塞・血小板減少）のみ使用→通常は不要</td></tr><tr><td>d ペニシリン系抗菌薬</td><td>×</td><td>ウイルス感染に無効・アンピシリンは皮疹リスクあり</td></tr></table></div>',

"q217": '<div class="eb ee"><h4>□ 高齢者肺炎の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 酸素吸入</td><td>×</td><td>SpO2低下の記載なし→適応が明確でない</td></tr><tr><td>b 抗菌薬の投与</td><td>○</td><td>細菌性肺炎→抗菌薬投与が根治治療（年齢は問わない）</td></tr><tr><td>c モルヒネの投与</td><td>×</td><td>緩和・鎮咳目的→根治治療でない（終末期でない）</td></tr><tr><td>d 中心静脈栄養</td><td>×</td><td>経口摂取可能→中心静脈栄養は不要（感染リスクも上昇）</td></tr></table></div>',

"q218": '<div class="eb ee"><h4>□ 血液検査所見の解釈（核左方移動）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 小球性貧血</td><td>×</td><td>MCVの低下→鉄欠乏・サラセミア（白血球分画の話でない）</td></tr><tr><td>b 汎血球減少</td><td>×</td><td>三系統全て減少→骨髄不全・再生不良性貧血</td></tr><tr><td>c 顆粒球減少</td><td>×</td><td>白血球＜500（好中球数）→薬剤性・放射線・白血病</td></tr><tr><td>d リンパ球減少</td><td>×</td><td>リンパ球＜1000→HIV・副腎皮質ステロイド</td></tr><tr><td>e 好中球の核左方移動</td><td>○</td><td>桿状核球（未熟好中球）の増加→細菌感染急性期の特徴</td></tr></table></div>',

"q219": '<div class="eb ee"><h4>□ POMRのプロブレムリスト</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 発熱</td><td>×</td><td>症状→診断名で記載すべき</td></tr><tr><td>b 湿性咳嗽</td><td>×</td><td>症状→診断名で記載すべき</td></tr><tr><td>c 歩行障害</td><td>×</td><td>今回の主症状でない</td></tr><tr><td>d 細菌性肺炎</td><td>○</td><td>診断名→プロブレムリストは可能な限り診断名で記載</td></tr></table></div>',

"q220": '<div class="eb ee"><h4>□ 呼吸器感染症と起炎菌の組合せ</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺膿瘍—黄色ブドウ球菌</td><td>○</td><td>S.aureus・嫌気性菌→壊死性肺炎・肺膿瘍の原因</td></tr><tr><td>b 院内肺炎—マイコプラズマ</td><td>×</td><td>マイコプラズマは市中肺炎（若年者）→院内肺炎の起炎菌でない</td></tr><tr><td>c 誤嚥性肺炎—嫌気性菌</td><td>○</td><td>口腔内嫌気性菌（Bacteroides等）→誤嚥性肺炎の主要起炎菌</td></tr><tr><td>d 重症市中肺炎—レジオネラ</td><td>○</td><td>重症非定型肺炎の代表→ICU入室が必要な市中肺炎に多い</td></tr></table></div>',

"q221": '<div class="eb ee"><h4>□ Gram染色で推定される起炎菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a C.pneumoniae</td><td>×</td><td>細胞内寄生菌→Gram染色で見えない・非定型肺炎</td></tr><tr><td>b H.influenzae</td><td>○</td><td>Gram陰性短桿菌→膿性痰・高齢者COPD合併肺炎に多い</td></tr><tr><td>c K.pneumoniae</td><td>×</td><td>Gram陰性桿菌だが、糖尿病・アルコール患者に多い→本例では可能性低い</td></tr><tr><td>d M.pneumoniae</td><td>×</td><td>細胞壁なし→Gram染色で見えない・若年者に多い</td></tr></table></div>',

"q222": '<div class="eb ee"><h4>□ インフルエンザ迅速検査の検体</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 唾液</td><td>×</td><td>ウイルス量が少なく感度低い</td></tr><tr><td>b 喀痰</td><td>×</td><td>下気道分泌物→インフルエンザ迅速検査の標準検体でない</td></tr><tr><td>c 鼻咽頭ぬぐい液</td><td>○</td><td>鼻咽頭はウイルス増殖部位→感度最高の標準検体</td></tr><tr><td>d 尿</td><td>×</td><td>インフルエンザウイルスは尿中に排泄されない</td></tr></table></div>',

"q223": '<div class="eb ee"><h4>□ 妊婦インフルエンザの対応</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 入院隔離</td><td>×</td><td>重症でなければ入院不要→外来管理が原則</td></tr><tr><td>b 緊急帝王切開</td><td>×</td><td>産科的適応なし→インフルエンザだけでは帝王切開の適応でない</td></tr><tr><td>c 抗インフルエンザ薬投与</td><td>○</td><td>妊婦はハイリスク群→オセルタミビル投与（妊婦に使用可能）</td></tr><tr><td>d インフルエンザワクチン接種</td><td>×</td><td>予防（治療でない）→発症後に接種しても意味なし</td></tr></table></div>',

"q224": '<div class="eb ee"><h4>□ 百日咳の抗菌薬選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ペニシリン系</td><td>×</td><td>Bordetella pertussisにはペニシリン系の臨床効果は限定的</td></tr><tr><td>b マクロライド系</td><td>○</td><td>百日咳の第一選択（アジスロマイシン・クラリスロマイシン）</td></tr><tr><td>c ニューキノロン系</td><td>×</td><td>代替薬だが第一選択でない（特に小児への使用制限あり）</td></tr><tr><td>d アミノグリコシド系</td><td>×</td><td>腎毒性・百日咳への有効性低い</td></tr></table></div>',

"q225": '<div class="eb ee"><h4>□ 溶連菌感染後の注意すべき合併症</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 血尿</td><td>○</td><td>急性糸球体腎炎（PSAGN）→血尿・蛋白尿・浮腫・高血圧</td></tr><tr><td>b 血便</td><td>×</td><td>腸管感染症の症状→溶連菌感染後腎炎と無関係</td></tr><tr><td>c 喀血</td><td>×</td><td>肺出血・Goodpasture症候群→溶連菌感染後腎炎と無関係</td></tr><tr><td>d 吐血</td><td>×</td><td>上部消化管出血→溶連菌感染後の合併症でない</td></tr></table></div>',

"q226": '<div class="eb ee"><h4>□ 小児インフルエンザの解熱薬選択</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アスピリン</td><td>×</td><td>サリチル酸系→ライ症候群リスク→小児インフルエンザに禁忌</td></tr><tr><td>b メフェナム酸</td><td>×</td><td>インフルエンザ脳症を増悪させるリスク→使用禁忌</td></tr><tr><td>c インドメタシン</td><td>×</td><td>同様にインフルエンザ脳症増悪リスク→禁忌</td></tr><tr><td>d アセトアミノフェン</td><td>○</td><td>小児インフルエンザの唯一の推奨解熱薬→ライ症候群リスクなし</td></tr></table></div>',

"q227": '<div class="eb ee"><h4>□ EBウイルスの基本知識</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 赤血球に感染</td><td>×</td><td>EBVはBリンパ球（CD21受容体）に感染→赤血球ではない</td></tr><tr><td>b 突発性発疹の原因</td><td>×</td><td>突発性発疹はHHV-6/7→EBVは伝染性単核球症の原因</td></tr><tr><td>c ヘルペスウイルス科に属する</td><td>○</td><td>EBV = HHV-4（Human herpesvirus 4）→ヘルペスウイルス科</td></tr><tr><td>d 思春期以降の感染が多い</td><td>×</td><td>日本では乳幼児期に不顕性感染が多い（成人の90%以上が既感染）</td></tr></table></div>',

"q228": '<div class="eb ee"><h4>□ 高齢COPD患者の重症インフルエンザ初期検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 気管支鏡検査</td><td>×</td><td>急性期には侵襲的→安定後に施行</td></tr><tr><td>b 胸部X線撮影</td><td>○</td><td>肺炎合併・気胸等の確認→緊急優先検査</td></tr><tr><td>c 呼吸機能検査</td><td>×</td><td>急性期には実施困難→安定後の肺機能評価に使用</td></tr><tr><td>d 動脈血ガス分析</td><td>○</td><td>意識混濁＋COPD→Ⅱ型呼吸不全（CO2貯留）の評価に必須</td></tr><tr><td>e インフルエンザ迅速抗原</td><td>○</td><td>病原体確認→抗ウイルス薬（オセルタミビル）投与の判断</td></tr></table></div>',

"q229": '<div class="eb ee"><h4>□ マイコプラズマ肺炎の有効薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ペニシリン系</td><td>×</td><td>細胞壁合成阻害→細胞壁のないマイコプラズマに無効</td></tr><tr><td>b カルバペネム系</td><td>×</td><td>βラクタム系→同様に無効</td></tr><tr><td>c アミノグリコシド系</td><td>×</td><td>細胞内移行不良→マイコプラズマへの有効性低い</td></tr><tr><td>d マクロライド系</td><td>○</td><td>細胞内移行良好・タンパク合成阻害→マイコプラズマ第一選択</td></tr><tr><td>e テトラサイクリン系</td><td>○</td><td>タンパク合成阻害→マイコプラズマ有効・耐性株への代替薬</td></tr></table></div>',

"q230": '<div class="eb ee"><h4>□ 伝染性単核球症の特徴</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 末梢血で単球が増加</td><td>×</td><td>リンパ球（異型リンパ球＝Downey細胞）が増加→単球でない</td></tr><tr><td>b 心筋炎の合併はまれ</td><td>○</td><td>心筋炎合併はあるが頻度は低い（まれ）→正しい記述</td></tr><tr><td>c アンピシリンを使用</td><td>×</td><td>アンピシリン投与→全身性薬疹→禁忌に準じる</td></tr><tr><td>d EBVによる垂直感染</td><td>×</td><td>唾液による水平感染が主→垂直感染（母→子）は通常なし</td></tr></table></div>',

"q231": '<div class="eb ee"><h4>□ GAS感染後合併症</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 川崎病</td><td>×</td><td>川崎病の原因はGAS感染後ではない（原因不明の血管炎）</td></tr><tr><td>b リウマチ熱</td><td>○</td><td>GAS咽頭炎後2〜4週→心炎・多発性関節炎・舞踏病</td></tr><tr><td>c 急性糸球体腎炎</td><td>○</td><td>GAS感染後1〜3週（咽頭炎）→血尿・蛋白尿・浮腫</td></tr><tr><td>d 若年性特発性関節炎</td><td>×</td><td>JIAは自己免疫疾患→GAS感染後の合併症でない</td></tr></table></div>',

"q232": '<div class="eb ee"><h4>□ EBV感染症の口腔内所見</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 後鼻漏</td><td>×</td><td>アレルギー性鼻炎・副鼻腔炎→EBVの口腔内所見でない</td></tr><tr><td>b イチゴ舌</td><td>×</td><td>川崎病・猩紅熱（A群溶連菌）の所見→EBVでない</td></tr><tr><td>c Koplik斑</td><td>×</td><td>麻疹の口腔粘膜の白い斑点→EBVでない</td></tr><tr><td>d 扁桃白苔</td><td>○</td><td>両側扁桃腫大＋白灰色の偽膜（白苔）→EBV感染症の典型的口腔内所見</td></tr></table></div>',

"q233": '<div class="eb ee"><h4>□ 両側肺浸潤陰影を来す病原体</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺炎球菌</td><td>×</td><td>大葉性肺炎（片側葉性）→両側性は稀</td></tr><tr><td>b 肺炎桿菌</td><td>×</td><td>右上葉に多い（bulging fissure）→両側性は稀</td></tr><tr><td>c レジオネラ属菌</td><td>○</td><td>重症非定型肺炎→両側肺野への浸潤影が特徴</td></tr><tr><td>d 黄色ブドウ球菌</td><td>×</td><td>血行性播種で多発性空洞→両側性だが浸潤陰影より結節影・空洞</td></tr><tr><td>e 肺炎マイコプラズマ</td><td>○</td><td>間質性陰影〜浸潤影が両側性に出現することが多い</td></tr></table></div>',

"q234": '<div class="eb ee"><h4>□ 百日咳の診断に最も有用な検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 末梢血リンパ球数</td><td>○</td><td>著明なリンパ球増多（白血球30,000〜100,000・リンパ球70〜90%）→百日咳の特徴的血液像</td></tr><tr><td>b 血清CRP値</td><td>×</td><td>炎症マーカー→百日咳に特異的でない</td></tr><tr><td>c 胸部X線撮影</td><td>×</td><td>百日咳自体は胸部X線で特徴的所見を示さない</td></tr><tr><td>d 呼吸機能検査</td><td>×</td><td>慢性咳嗽の原因検索に使用→百日咳の診断には直接使わない</td></tr></table></div>',

"q235": '<div class="eb ee"><h4>□ 学童期・発疹＋肺炎の診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a RSウイルス</td><td>×</td><td>乳幼児細気管支炎の代表→10歳女児の肺炎として非典型</td></tr><tr><td>b 麻疹ウイルス</td><td>×</td><td>Koplik斑・特徴的皮疹（麻疹疹）→本例の体幹発疹と異なる</td></tr><tr><td>c A群レンサ球菌</td><td>×</td><td>咽頭炎・猩紅熱→肺炎は稀・肝脾腫は起こさない</td></tr><tr><td>d アデノウイルス</td><td>×</td><td>咽頭炎・結膜炎→肝脾腫は特徴的でない</td></tr><tr><td>e 肺炎マイコプラズマ</td><td>○</td><td>学童・遷延する咳嗽・発疹（多形性紅斑）・肝脾腫軽度→典型的マイコプラズマ</td></tr></table></div>',

"q236": '<div class="eb ee"><h4>□ 乳幼児発熱＋血小板減少の鑑別</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a EBウイルス</td><td>○</td><td>乳幼児EBV→発熱・リンパ節腫脹・血小板減少（肝脾腫合併）</td></tr><tr><td>b アデノウイルス</td><td>×</td><td>咽頭炎・結膜炎・腸炎→血小板減少・リンパ節腫脹は稀</td></tr><tr><td>c エコーウイルス</td><td>×</td><td>無菌性髄膜炎・発疹熱→血小板減少・リンパ節腫脹は稀</td></tr><tr><td>d CMV</td><td>○</td><td>乳幼児CMV→発熱・肝脾腫・血小板減少（EBVと類似症状）</td></tr></table></div>',

"q237": '<div class="eb ee"><h4>□ 扁桃周囲膿瘍の診断検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>①GAS迅速検査</td><td>△</td><td>原因菌確認に有用だが膿瘍の範囲確認には不十分</td></tr><tr><td>②血液培養</td><td>△</td><td>菌血症合併確認に有用→扁桃周囲膿瘍の確定診断でない</td></tr><tr><td>③超音波検査</td><td>△</td><td>膿瘍確認に使えるが深部への波及確認に限界</td></tr><tr><td>④頸部造影CT</td><td>○</td><td>膿瘍の範囲・深頸部への波及確認→治療方針決定に必須</td></tr></table></div>',

"q238": '<div class="eb ee"><h4>□ 乳幼児百日咳の治療薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 利尿薬</td><td>×</td><td>浮腫・心不全の治療→百日咳の咳嗽への効果なし</td></tr><tr><td>b 気管支拡張薬</td><td>×</td><td>気管支喘息の治療→百日咳は喘息でないため無効</td></tr><tr><td>c 抗ヒスタミン薬</td><td>×</td><td>アレルギー・鼻炎の治療→百日咳への抗菌効果なし</td></tr><tr><td>d 副腎皮質ステロイド</td><td>×</td><td>抗炎症→百日咳の根治治療でない（感染症に対しては適応なし）</td></tr><tr><td>e マクロライド系抗菌薬</td><td>○</td><td>Bordetella pertussisの第一選択→感染拡大防止・症状軽減</td></tr></table></div>',

"q239": '<div class="eb ee"><h4>□ 伝染性単核球症の診断</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 敗血症</td><td>×</td><td>血圧低下・臓器障害なし→敗血症には合わない</td></tr><tr><td>b 川崎病</td><td>×</td><td>川崎病は5歳以下・冠動脈病変・唇発赤→12歳・脾腫は合わない</td></tr><tr><td>c 伝染性単核球症</td><td>○</td><td>発熱＋扁桃炎＋後頸部LN腫大＋肝脾腫＋異型リンパ球→EBVの典型的四徴</td></tr><tr><td>d A群レンサ球菌感染症</td><td>×</td><td>GAS咽頭炎→扁桃白苔あるが脾腫・異型リンパ球はない</td></tr></table></div>',
}


def inject_ee(html_content, ee_data):
    """Inject ee blocks into question cards within the eg div."""
    cards_injected = 0

    def replace_card(m):
        nonlocal cards_injected
        card_html = m.group(0)
        # Get question id
        qid_match = re.search(r'id="(q\d+)"', card_html)
        if not qid_match:
            return card_html
        qid = qid_match.group(1)
        if qid not in ee_data:
            return card_html
        # Find the eg div and inject ee after the last eb div inside it
        # The eg div contains ep and ept divs; we add ee after them
        # Pattern: find </div></div></div>$ at end of card (eg closing)
        # Better: find the last </div> inside class="eg" and insert before closing
        ee_html = ee_data[qid]
        # Insert ee block just before the closing of the eg div
        # The eg div ends with </div></div></div> (eb closing, eg closing, qb closing)
        # We want to add ee before the first </div></div></div> sequence at the end
        # Actually: insert ee before the pattern that closes the eg div
        # eg div: <div class="eg">...<div class="eb ept">...</div></div></div></div>
        # We insert ee before the last </div></div></div></div>
        insert_marker = '</div></div></div></div>'
        pos = card_html.rfind(insert_marker)
        if pos == -1:
            return card_html
        new_card = card_html[:pos] + ee_html + insert_marker
        cards_injected += 1
        return new_card

    # Match each question card
    result = re.sub(
        r'<div class="qc"[^>]*>.*?(?=<div class="qc"|$)',
        replace_card,
        html_content,
        flags=re.DOTALL
    )
    print(f"Injected ee blocks: {cards_injected}")
    return result


# Process ch04
with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', encoding='utf-8') as f:
    content = f.read()

# Verify injection point by checking one card
test_card = re.search(r'(<div class="qc" id="q144">.*?)(?=<div class="qc"|$)', content, re.DOTALL)
if test_card:
    card = test_card.group(1)
    pos = card.rfind('</div></div></div></div>')
    print(f"Q144 injection point found: {pos != -1}")
    print(f"Context around injection: ...{card[pos-50:pos+30]}...")

new_content = inject_ee(content, EE)

# Verify injection worked
ep_count = len(re.findall(r'class="[^"]*\bep\b[^"]*"', new_content))
ee_count = len(re.findall(r'class="[^"]*\bee\b[^"]*"', new_content))
print(f"After injection: ep={ep_count} ee={ee_count}")

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch04_kansen_resp.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("ch04 written successfully")
