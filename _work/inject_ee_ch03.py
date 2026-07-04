import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q99": '<div class="eb ee"><h4>□ 選択肢評価</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 喀痰細胞診</td><td>×</td><td>肺癌の診断→皮膚症状には関係ない</td></tr><tr><td>b 安静時心電図</td><td>×</td><td>心疾患の評価→皮疹の原因検索には無関係</td></tr><tr><td>c 腹部超音波</td><td>×</td><td>腹部臓器の評価→皮疹の精査に直接寄与しない</td></tr><tr><td>d HIV抗原・抗体検査</td><td>○</td><td>若年男性・繰り返す皮疹・B型肝炎既往（血液感染リスク）→HIV感染の可能性→スクリーニングが最優先</td></tr><tr><td>e 胸部X線</td><td>×</td><td>肺病変評価→皮疹の原因鑑別には直接役立たない</td></tr></table></div>',

"q102": '<div class="eb ee"><h4>□ 選択肢評価（壊死性筋膜炎・DIC）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 胃管留置</td><td>×</td><td>胃管は栄養・胃洗浄目的→ショック状態の初期対応として優先度低い</td></tr><tr><td>b 気管挿管</td><td>×</td><td>呼吸不全の記載なし→現時点では適応なし</td></tr><tr><td>c 赤血球輸血</td><td>○</td><td>Hb 9.0g/dL＋DIC（血小板3.5万）の重症貧血→組織酸素化維持に赤血球輸血が必要</td></tr><tr><td>d 血液培養検査</td><td>×</td><td>重要だが既に診断は明らかな壊死性筋膜炎→まず輸血・輸液が先</td></tr><tr><td>e 乳酸リンゲル液輸液</td><td>×</td><td>輸液も必要だが、この状況では貧血の是正が最優先（PLT・Hbともに低い）</td></tr></table></div>',

"q105": '<div class="eb ee"><h4>□ 基本的ADL（Barthel Index）に該当するのはどれか</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>① バスに乗って買い物に行く</td><td>×（IADL）</td><td>公共交通機関の利用は手段的ADL（IADL）→Lawton尺度の項目</td></tr><tr><td>② レジでの支払い</td><td>×（IADL）</td><td>金銭管理はIADL→基本ADLに含まない</td></tr><tr><td>③ ひとりで食べる（食事）</td><td>○（基本ADL）</td><td>食事はBarthel Indexの基本ADL項目</td></tr><tr><td>④ 着替えができる（更衣）</td><td>○（基本ADL）</td><td>更衣はBarthel Indexの基本ADL項目</td></tr><tr><td>⑤ ゲートボールに行く（趣味活動）</td><td>×（IADL/余暇活動）</td><td>余暇活動・趣味はIADL→基本ADLに含まない</td></tr></table></div>',

"q106": '<div class="eb ee"><h4>□ 認知機能低下の鑑別に必要な追加検査（梅毒+認知症症状）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 葉酸</td><td>×</td><td>葉酸欠乏は巨赤芽球性貧血→認知機能低下の主要な原因ではない（B12の方が重要）</td></tr><tr><td>b ビタミンD</td><td>×</td><td>骨代謝・免疫系→認知症との関連は弱い</td></tr><tr><td>c ビタミンB1（チアミン）</td><td>○</td><td>VitB1欠乏→Wernicke脳症・Korsakoff症候群→記憶障害・認知機能低下の原因として除外必要</td></tr><tr><td>d β2-マイクログロブリン</td><td>×</td><td>腎機能・多発性骨髄腫マーカー→認知症鑑別には優先しない</td></tr><tr><td>e 甲状腺刺激ホルモン（TSH）</td><td>○</td><td>甲状腺機能低下症→認知機能低下の重要な可逆的原因→TSH測定で除外</td></tr></table></div>',

"q109": '<div class="eb ee"><h4>□ ジカウイルス感染症に関する誤り（誤りを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 蚊が媒介する</td><td>正しい</td><td>ネッタイシマカ・ヒトスジシマカが媒介するフラビウイルス感染症</td></tr><tr><td>b 潜伏期は最大14日</td><td>正しい</td><td>ジカウイルスの潜伏期は3〜14日</td></tr><tr><td>c 症状は最大7日間持続</td><td>正しい</td><td>発熱・発疹・関節痛・結膜炎は2〜7日で軽快</td></tr><tr><td>d 妊娠中感染で小頭症</td><td>正しい</td><td>ジカウイルス感染症の胎児への影響として小頭症が確認されている</td></tr><tr><td>e アシクロビルで治療（誤り）</td><td>○（誤り）</td><td>アシクロビルはDNAウイルス（ヘルペス属）に有効→ジカウイルス（RNAフラビウイルス）には無効。ジカに特異的治療薬はなく対症療法のみ</td></tr></table></div>',

"q110": '<div class="eb ee"><h4>□ 選択肢評価（熱傷後皮膚感染・毒素症状）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 大腸菌</td><td>×</td><td>腸管・尿路感染の代表→熱傷後の皮膚感染＋毒素症状は起こしにくい</td></tr><tr><td>b 緑膿菌</td><td>×</td><td>熱傷後感染に多いが、毒素産生による全身毒素症状（嘔吐・下痢）は典型でない</td></tr><tr><td>c カンジダ</td><td>×</td><td>真菌→熱傷後感染には起こりうるが、急性の嘔吐・下痢等の毒素症状は起こさない</td></tr><tr><td>d 肺炎球菌</td><td>×</td><td>呼吸器・中耳・髄膜が主な感染部位→熱傷部位からの皮膚感染は少ない</td></tr><tr><td>e 黄色ブドウ球菌</td><td>○</td><td>熱傷後創感染→TSST-1産生による毒素性ショック症候群（TSS）→発熱・嘔吐・下痢が三主徴</td></tr></table></div>',

"q113": '<div class="eb ee"><h4>□ 猫引っ掻き病（頸部リンパ節炎）の治療薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗真菌薬</td><td>×</td><td>細菌感染（Bartonella henselae）→真菌でないため抗真菌薬は無効</td></tr><tr><td>b 抗ウイルス薬</td><td>×</td><td>ウイルス感染ではなく細菌感染→抗ウイルス薬は適応なし</td></tr><tr><td>c セフェム系薬</td><td>×</td><td>Bartonellaはβラクタム系への感受性が低い→セフェムは第一選択でない</td></tr><tr><td>d ペニシリン系薬</td><td>○</td><td>軽症猫引っ掻き病は自然治癒。重症・難治例にはアモキシシリン等ペニシリン系または選択肢からは最も妥当</td></tr><tr><td>e カルバペネム系薬</td><td>×</td><td>過剰治療→猫引っ掻き病にカルバペネムは不要</td></tr></table></div>',

"q115": '<div class="eb ee"><h4>□ Fournier壊疽（陰嚢壊死性筋膜炎）の検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 便培養</td><td>×</td><td>腸管感染症の診断→会陰部壊死性筋膜炎の評価には関係ない</td></tr><tr><td>b 下部消化管内視鏡</td><td>×</td><td>腸管の評価→Fournier壊疽の感染範囲確認には不要</td></tr><tr><td>c 持続血糖モニタリング</td><td>×</td><td>糖尿病管理に有用だが感染の緊急評価ではない</td></tr><tr><td>d ガリウムシンチグラフィ</td><td>×</td><td>骨髄炎・腫瘍の診断（時間がかかる）→緊急評価に不適</td></tr><tr><td>e 骨盤から大腿のCT</td><td>○</td><td>壊死性筋膜炎→CTで感染範囲・皮下ガス産生・筋膜への進展を迅速評価→緊急手術の判断に必須</td></tr></table></div>',

"q118": '<div class="eb ee"><h4>□ 無痛性外陰潰瘍の鑑別</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 梅毒</td><td>○</td><td>第1期梅毒→硬性下疳（painless ulcer）：無痛性の硬い潰瘍が外陰部に出現→典型</td></tr><tr><td>b 淋菌感染症</td><td>×</td><td>子宮頸管炎・尿道炎（帯下・排尿痛）→潰瘍形成は典型でない</td></tr><tr><td>c 性器ヘルペス</td><td>×</td><td>有痛性水疱・潰瘍→痛みが強いのが特徴（無痛性ではない）</td></tr><tr><td>d クラミジア感染症</td><td>×</td><td>無症状〜軽微な帯下→潰瘍形成はしない</td></tr><tr><td>e 尖圭コンジローマ</td><td>×</td><td>HPVによる疣贅（イボ）→潰瘍ではなくカリフラワー状突起物</td></tr></table></div>',

"q119": '<div class="eb ee"><h4>□ Fournier壊疽の原因病原体（2つ選べ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Candida albicans</td><td>×</td><td>真菌→糖尿病での日和見感染はあるが、壊死性筋膜炎の主役は細菌</td></tr><tr><td>b Chlamydia trachomatis</td><td>×</td><td>性感染症の原因→壊死性筋膜炎の起炎菌ではない</td></tr><tr><td>c Clostridioides difficile</td><td>×</td><td>C.difficileは腸炎の原因（偽膜性腸炎）→壊死性筋膜炎の主要原因でない</td></tr><tr><td>d Escherichia coli</td><td>○</td><td>会陰部→腸内細菌（大腸菌等）が混合感染の主役の一つ→好気性グラム陰性桿菌</td></tr><tr><td>e Peptostreptococcus anaerobius</td><td>○</td><td>嫌気性連鎖球菌→Fournier壊疽は好気性＋嫌気性菌の混合感染が特徴</td></tr></table></div>',

"q121": '<div class="eb ee"><h4>□ 壊死性筋膜炎の重症度判定に有用でない検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ALT（有用でない）</td><td>○</td><td>ALTは肝細胞障害の指標→LRINEC（壊死性筋膜炎重症度スコア）の項目に含まれない</td></tr><tr><td>b 白血球数</td><td>×（有用）</td><td>LRINEC score：WBC＞15000で加点→炎症の重症度指標</td></tr><tr><td>c 血小板数</td><td>×（有用）</td><td>DICの評価に必要→壊死性筋膜炎重症例ではDICを合併し血小板減少</td></tr><tr><td>d 総ビリルビン</td><td>×（有用）</td><td>LRINEC scoreにビリルビン>1.0mg/dLで加点</td></tr><tr><td>e クレアチニン</td><td>×（有用）</td><td>LRINEC score：Cr＞1.6mg/dLで加点→腎機能評価</td></tr></table></div>',

"q122": '<div class="eb ee"><h4>□ 梅毒治療後の血清反応（RPR陰性化後のTPHA陽性）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 「治療の必要はありません」</td><td>○</td><td>梅毒治療完了後→RPRは陰性化・TPHAは治療後も陽性が持続（既往感染の証）→追加治療不要</td></tr><tr><td>b 「抗核抗体検査を行います」</td><td>×</td><td>膠原病の除外検査→梅毒血清反応陽性の対応として優先しない</td></tr><tr><td>c 「ペニシリン内服で加療」</td><td>×</td><td>すでに治療完了→RPR陰性なら追加治療は不要（再治療の適応なし）</td></tr><tr><td>d 「7日以内に保健所届出」</td><td>×</td><td>梅毒は5類感染症→診断後7日以内に届出が必要だが、治療完了後の再確認時は新規診断ではない</td></tr><tr><td>e 「3か月後に再検査」</td><td>×</td><td>治療後の再検査フォローは有用だが、現時点で治療完了が確認済みなら「治療不要」の説明が最優先</td></tr></table></div>',

"q123": '<div class="eb ee"><h4>□ 選択肢評価（eschar＋全身皮疹＋山菜採り）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a デング熱</td><td>×</td><td>蚊媒介（ネッタイシマカ）→日本国内での山菜採りでは通常感染しない・eschariを形成しない</td></tr><tr><td>b マラリア</td><td>×</td><td>蚊媒介（ハマダラカ）→発熱・貧血が主症状→escharは形成しない</td></tr><tr><td>c ツツガ虫病</td><td>○</td><td>野外活動（山菜採り）→ツツガムシ（Leptotrombidium属）→Orientia tsutsugamushiによる感染→eschar（刺し口）＋全身皮疹＋発熱が三主徴</td></tr><tr><td>d 伝染性単核球症</td><td>×</td><td>EBV感染→咽頭炎・リンパ節腫脹・肝脾腫→eschariを形成しない</td></tr><tr><td>e レプトスピラ感染症</td><td>×</td><td>水田・河川での感染（土壌・水中の細菌）→発熱・黄疸→eschariは形成しない</td></tr></table></div>',

"q124": '<div class="eb ee"><h4>□ 梅毒（硬性下疳）の治療薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セフェム系</td><td>×</td><td>梅毒（Treponema pallidum）に対するセフェムの有効性は低い</td></tr><tr><td>b キノロン系</td><td>×</td><td>梅毒に対してキノロン系は推奨されない</td></tr><tr><td>c ペニシリン系</td><td>×（本問では）</td><td>ペニシリンGが梅毒の第一選択だが、選択肢の文脈によりテトラサイクリンが正解</td></tr><tr><td>d カルバペネム系</td><td>×</td><td>過剰治療・梅毒の標準治療に含まれない</td></tr><tr><td>e テトラサイクリン系</td><td>○</td><td>ペニシリンアレルギー時の代替薬（ドキシサイクリン）→梅毒第1期の代替治療として有効</td></tr></table></div>',

"q126": '<div class="eb ee"><h4>□ 繰り返す帯状疱疹→合併を考慮すべき疾患</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a HIV</td><td>○</td><td>若年男性の帯状疱疹・2年前にも発症→繰り返す帯状疱疹はHIV免疫不全の指標疾患（AIDSに至る前の指標）</td></tr><tr><td>b EBウイルス</td><td>×</td><td>EBVは伝染性単核球症の原因→帯状疱疹の繰り返しとは直接関連しない</td></tr><tr><td>c 麻疹ウイルス</td><td>×</td><td>麻疹ウイルスはコプリック斑・発疹を起こすが帯状疱疹の繰り返しとは無関係</td></tr><tr><td>d 風疹ウイルス</td><td>×</td><td>風疹は発疹・リンパ節腫脹を起こすが、帯状疱疹の繰り返しとは無関係</td></tr><tr><td>e コクサッキーウイルス</td><td>×</td><td>手足口病・ヘルパンギーナの原因→帯状疱疹の繰り返しとは無関係</td></tr></table></div>',

"q128": '<div class="eb ee"><h4>□ 蜂窩織炎・壊死性筋膜炎疑いの治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 局所切開</td><td>○</td><td>急速進行する皮膚・軟部組織感染症→膿瘍形成・壊死性筋膜炎疑い→外科的切開・ドレナージが根本治療</td></tr><tr><td>b 利尿薬投与</td><td>×</td><td>浮腫は感染による炎症性浮腫→利尿薬は原因治療にならない</td></tr><tr><td>c 外用抗菌薬塗布</td><td>×</td><td>深部感染症に外用抗菌薬は浸透不十分→全身投与が必要</td></tr><tr><td>d アドレナリン静注</td><td>×</td><td>アナフィラキシーの治療薬→本症例に適応なし</td></tr><tr><td>e ステロイドパルス療法</td><td>×</td><td>自己免疫性疾患向け→細菌性感染症への高用量ステロイドは感染悪化リスク</td></tr></table></div>',

"q129": '<div class="eb ee"><h4>□ 帯状疱疹（高齢者・皮膚分節型水疱性皮疹）の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a メロペネム</td><td>×</td><td>カルバペネム系抗菌薬→細菌感染に使用。ウイルス（VZV）には無効</td></tr><tr><td>b バラシクロビル</td><td>○</td><td>帯状疱疹（VZV）→バラシクロビル（アシクロビルのプロドラッグ）経口投与が第一選択</td></tr><tr><td>c オセルタミビル</td><td>×</td><td>抗インフルエンザ薬→VZVには無効</td></tr><tr><td>d フルコナゾール</td><td>×</td><td>抗真菌薬→ウイルス（VZV）には無効</td></tr><tr><td>e レボフロキサシン</td><td>×</td><td>ニューキノロン系抗菌薬→細菌感染に使用。VZVには無効</td></tr></table></div>',

"q131": '<div class="eb ee"><h4>□ 壊死性筋膜炎の最優先治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 高圧酸素療法</td><td>×</td><td>壊死性筋膜炎に補助療法として用いることはあるが、外科的デブリドマンが先</td></tr><tr><td>b 右膝関節穿刺</td><td>×</td><td>関節炎の評価目的→壊死性筋膜炎の根本治療ではない</td></tr><tr><td>c 右下肢デブリドマン</td><td>○</td><td>壊死性筋膜炎の根本治療は緊急外科的デブリドマン→坏死組織を徹底除去しないと抗菌薬単独では救命不能</td></tr><tr><td>d 副腎皮質ステロイド投与</td><td>×</td><td>感染症に高用量ステロイド→免疫抑制により感染が悪化するリスク</td></tr><tr><td>e 破傷風ガンマグロブリン投与</td><td>×</td><td>破傷風の受動免疫→壊死性筋膜炎の治療ではない</td></tr></table></div>',

"q132": '<div class="eb ee"><h4>□ Gram陽性連鎖状球菌（GAS）に対する抗菌薬変更</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a セフタジジム</td><td>×</td><td>第3世代セフェム（グラム陰性桿菌・緑膿菌対応）→Gram陽性連鎖球菌には不適切</td></tr><tr><td>b ゲンタマイシン</td><td>×</td><td>アミノグリコシド系→グラム陰性桿菌が主対象・連鎖球菌単独治療には不適</td></tr><tr><td>c アジスロマイシン</td><td>×</td><td>非定型肺炎・軽症GAS感染の代替薬だが、菌血症の重症感染には不十分</td></tr><tr><td>d レボフロキサシン</td><td>×</td><td>キノロン系はGASへの有効性はあるが第一選択ではない</td></tr><tr><td>e ベンジルペニシリン（ペニシリンG）</td><td>○</td><td>Gram陽性連鎖球菌（A群β溶血性連鎖球菌）→ベンジルペニシリンが第一選択・GASはペニシリン100%感受性</td></tr></table></div>',

"q133": '<div class="eb ee"><h4>□ 無痛性外陰部潰瘍（梅毒疑い）の検査</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 梅毒血清反応（RPR+TPHA）</td><td>○</td><td>無痛性外陰部潰瘍→梅毒第1期（硬性下疳）が最有力→RPR（非特異的）＋TPHA（特異的）で確定</td></tr><tr><td>b 病変部の生検</td><td>×</td><td>生検は確定的だが侵襲的→まず血清学的検査が優先</td></tr><tr><td>c 尿淋菌核酸増幅検査</td><td>×</td><td>淋菌は有痛性・帯下・排尿痛→無痛性潰瘍の第一検査ではない</td></tr><tr><td>d 尿クラミジア核酸増幅検査</td><td>×</td><td>クラミジアは潰瘍を作らない→無痛性潰瘍には優先しない</td></tr><tr><td>e 浸出液のヘルペスウイルス抗原検査</td><td>×</td><td>性器ヘルペスは有痛性→無痛性潰瘍の鑑別では第一でない</td></tr></table></div>',

"q134": '<div class="eb ee"><h4>□ 梅毒第1期（硬性下疳）の治療薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アシクロビル</td><td>×</td><td>抗ヘルペス薬→細菌（Treponema pallidum）には無効</td></tr><tr><td>b レボフロキサシン</td><td>×</td><td>キノロン系は梅毒の標準治療に含まれない</td></tr><tr><td>c アムホテリシンB</td><td>×</td><td>抗真菌薬→梅毒（細菌）には無効</td></tr><tr><td>d クラリスロマイシン</td><td>×</td><td>マクロライド系→梅毒の代替薬として使用可能だが第一選択ではない</td></tr><tr><td>e ベンジルペニシリン（ペニシリンG）</td><td>○</td><td>梅毒（全期）の第一選択薬→Treponema pallidumはペニシリン100%感受性（耐性なし）</td></tr></table></div>',

"q136": '<div class="eb ee"><h4>□ 皮下ガス像（X線）の原因菌</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Aspergillus fumigatus</td><td>×</td><td>真菌（アスペルギルス）→肺・副鼻腔感染→皮下ガス産生はしない</td></tr><tr><td>b Brucella abortus</td><td>×</td><td>ブルセラ症（動物由来）→発熱・関節痛→皮下ガス産生はしない</td></tr><tr><td>c Clostridium perfringens</td><td>○</td><td>嫌気性Gram陽性桿菌→α毒素（レシチナーゼ）産生→ガス壊疽→X線でガス像（クレピタシオン）</td></tr><tr><td>d Mycobacterium tuberculosis</td><td>×</td><td>結核菌→肺・リンパ節・骨関節感染→急性皮下ガス産生はしない</td></tr><tr><td>e Pseudomonas aeruginosa</td><td>×</td><td>緑膿菌→免疫不全患者の感染症→ガス産生は少量で典型的でない</td></tr></table></div>',

"q138": '<div class="eb ee"><h4>□ 外毒素によるショック（毒素性ショック症候群：TSS）の原因菌（2つ選べ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 腸球菌</td><td>×</td><td>腸球菌は主に尿路・腹腔内感染→超抗原毒素によるTSSの原因ではない</td></tr><tr><td>b 緑色連鎖球菌（S.viridans）</td><td>×</td><td>感染性心内膜炎の原因→外毒素産生によるTSSは起こさない</td></tr><tr><td>c 表皮ブドウ球菌（S.epidermidis）</td><td>×</td><td>凝固酵素陰性ブドウ球菌→TSST-1非産生・TSSの原因にならない</td></tr><tr><td>d 黄色ブドウ球菌（S.aureus）</td><td>○</td><td>TSST-1（毒素性ショック症候群毒素-1）産生→超抗原として大量サイトカイン放出→ショック・高熱・発疹</td></tr><tr><td>e A群β溶血性連鎖球菌（GAS）</td><td>○</td><td>発熱性外毒素（SPE：溶連菌発熱外毒素）産生→超抗原→劇症型溶連菌感染症・壊死性筋膜炎に合併</td></tr></table></div>',

"q139": '<div class="eb ee"><h4>□ 透析シャント部位の膿瘍の治療</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗真菌薬投与</td><td>×</td><td>真菌感染の根拠なし（透析シャント感染は通常細菌性）</td></tr><tr><td>b 創の縫合閉鎖</td><td>×</td><td>感染創を縫合閉鎖→膿が閉じ込められて悪化する</td></tr><tr><td>c 切開排膿ドレナージ</td><td>○</td><td>局所膿瘍→切開排膿が根本治療（膿のある感染症は排膿が必須）＋抗菌薬投与を併用</td></tr><tr><td>d 免疫グロブリン製剤投与</td><td>×</td><td>免疫グロブリンは重症感染症・特定の自己免疫疾患用→通常の膿瘍には適応なし</td></tr><tr><td>e 副腎皮質ステロイド投与</td><td>×</td><td>感染症に免疫抑制→細菌感染が悪化するリスク・適応なし</td></tr></table></div>',

"q140": '<div class="eb ee"><h4>□ 旅行者疾患（誤りを選ぶ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 旅行者下痢症では発熱はない（誤り）</td><td>×（誤りの主張自体が誤り）</td><td>旅行者下痢症（細菌性・原虫性）→発熱を伴う場合もある（特に侵襲性腸炎）</td></tr><tr><td>b マラリアで死亡することはない（誤り）</td><td>×（誤りの主張自体が誤り）</td><td>熱帯熱マラリア（P.falciparum）→重症マラリア・脳マラリア→死亡リスクあり</td></tr><tr><td>c 狂犬病は犬以外からは感染しない（誤り）</td><td>×（誤りの主張自体が誤り）</td><td>狂犬病ウイルスはコウモリ・狐・アライグマ等からも感染する</td></tr><tr><td>d デング熱のワクチンは実用化されていない</td><td>○（正しい主張）</td><td>出題当時、一般旅行者へのデングワクチンは未実用的（現在は一部承認）→設問の時点ではこれが正しい</td></tr><tr><td>e 届出義務のある疾患はない（誤り）</td><td>×（誤りの主張自体が誤り）</td><td>マラリア・デング熱は4類感染症→都道府県知事への届出義務がある</td></tr></table></div>',

"q141": '<div class="eb ee"><h4>□ ツツガ虫病（eschar＋皮疹＋発熱）の治療薬</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 抗真菌薬</td><td>×</td><td>真菌感染でない→Orientia tsutsugamushi（グラム陰性桿菌様の偏性細胞内寄生菌）</td></tr><tr><td>b 抗ウイルス薬</td><td>×</td><td>ウイルス感染でない（細菌の一種）</td></tr><tr><td>c 副腎皮質ステロイド</td><td>×</td><td>自己免疫性疾患向け→感染症に単独投与は禁忌</td></tr><tr><td>d ペニシリン系抗菌薬</td><td>×</td><td>細胞壁合成阻害→偏性細胞内寄生のOrientiaは細胞内に存在→βラクタム系は移行不良で無効</td></tr><tr><td>e テトラサイクリン系抗菌薬</td><td>○</td><td>ドキシサイクリン（テトラサイクリン系）→細胞内移行良好→Orientia tsutsugamushiの第一選択</td></tr></table></div>',
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


with open(r'C:\Users\coool\Desktop\MEC\感染症\ch03_kansen_skin.html', encoding='utf-8') as f:
    content = f.read()

new_content = inject_ee(content, EE)

with open(r'C:\Users\coool\Desktop\MEC\感染症\ch03_kansen_skin.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("ch03 written successfully")
