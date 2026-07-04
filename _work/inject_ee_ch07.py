import sys, re
sys.stdout.reconfigure(encoding='utf-8')

EE = {
"q333": '<div class="eb ee"><h4>□ Choice Evaluation (Person-to-Person Transmission)</h4><table class="tb"><tr><th>Disease</th><th>Eval</th><th>Rationale</th></tr><tr><td>a Malaria</td><td>○ (NO P2P)</td><td>Transmitted via Anopheles mosquito bite — not person-to-person directly</td></tr><tr><td>b Measles</td><td>× (causes P2P)</td><td>Airborne transmission — highly contagious person-to-person</td></tr><tr><td>c Meningococcal meningitis</td><td>× (causes P2P)</td><td>Droplet transmission — person-to-person respiratory spread</td></tr><tr><td>d Pertussis</td><td>× (causes P2P)</td><td>Droplet/contact transmission — person-to-person spread</td></tr></table></div>',

"q334": '<div class="eb ee"><h4>□ 選択肢評価（マラリアに関する正しい記述）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 経口感染する</td><td>×</td><td>Anopheles蚊の刺咬で感染（経口感染しない）</td></tr><tr><td>b 脾腫がみられる</td><td>○</td><td>マラリア原虫を貪食するマクロファージが脾臓に集積→脾腫</td></tr><tr><td>c ワクチンが有効である</td><td>×</td><td>ヒトマラリアに完全有効なワクチンは限定的（RTS,Sが一部使用されるが有効率は低い）</td></tr><tr><td>d 潜伏期は3〜5日である</td><td>×</td><td>熱帯熱（P.falciparum）：9〜14日、三日熱（P.vivax）：14〜40日（3〜5日は誤り）</td></tr></table></div>',

"q335": '<div class="eb ee"><h4>□ 選択肢評価（アフリカ流行・体液接触・出血傾向）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a エボラウイルス</td><td>○</td><td>フィロウイルス科・アフリカ中西部・感染者の体液への直接接触→突然の発熱＋出血傾向</td></tr><tr><td>b ジカウイルス</td><td>×</td><td>フラビウイルス科・Aedes蚊媒介→発熱・発疹・関節痛（出血は稀）</td></tr><tr><td>c 新型コロナウイルス</td><td>×</td><td>飛沫・空気感染（体液接触が主経路ではない）・出血傾向はない</td></tr><tr><td>d デングウイルス</td><td>×</td><td>Aedes蚊媒介・熱帯・亜熱帯→デング出血熱（出血はあるが体液接触感染ではない）</td></tr></table></div>',

"q336": '<div class="eb ee"><h4>□ 選択肢評価（破傷風の治療2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a アマンタジン塩酸塩</td><td>×</td><td>インフルエンザA型の抗ウイルス薬（破傷風には無効）</td></tr><tr><td>b アムホテリシンB</td><td>×</td><td>抗真菌薬（破傷風菌には無効）</td></tr><tr><td>c ACE阻害薬</td><td>×</td><td>降圧薬（破傷風治療には使わない）</td></tr><tr><td>d 抗破傷風ヒト免疫グロブリン（TIG）</td><td>○</td><td>毒素を中和する受動免疫→早期に投与（感染後できるだけ早く）</td></tr><tr><td>e メトロニダゾール（またはペニシリンG）</td><td>○</td><td>Clostridium tetaniの除菌→創部デブリードメントも並行して実施</td></tr></table></div>',

"q337": '<div class="eb ee"><h4>□ 選択肢評価（アメーバ赤痢の治療薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a ST合剤</td><td>×</td><td>PCP・ノカルジア治療（Entamoeba histolyticaには無効）</td></tr><tr><td>b クリンダマイシン</td><td>×</td><td>嫌気性菌・MRSA（アメーバ原虫には無効）</td></tr><tr><td>c セファレキシン</td><td>×</td><td>セフェム系抗菌薬→グラム陽性菌（アメーバには無効）</td></tr><tr><td>d メトロニダゾール</td><td>○</td><td>アメーバ赤痢・トリコモナス・嫌気性菌→第一選択（10日間内服）</td></tr></table></div>',

"q338": '<div class="eb ee"><h4>□ 選択肢評価（アニサキス症に関する正しい記述）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 夏季に多い</td><td>×</td><td>通年に生じる（特定の季節に限定されない）</td></tr><tr><td>b 腸での発症が多い</td><td>×</td><td>胃アニサキス症が大半（腸アニサキス症は少ない）</td></tr><tr><td>c 魚類摂取後24時間以降に発症</td><td>×</td><td>摂食後数時間以内に急性上腹部痛が発症（24時間以降は誤り）</td></tr><tr><td>d プロトンポンプ阻害薬が有効</td><td>×</td><td>PPI→胃酸抑制（アニサキス虫体を除去しない）→治療は内視鏡的除去</td></tr><tr><td>e 上部消化管内視鏡で虫体を除去する</td><td>○</td><td>診断と治療を兼ねる→内視鏡で白色糸状の虫体を確認・把持鉗子で除去→劇的改善</td></tr></table></div>',

"q339": '<div class="eb ee"><h4>□ 選択肢評価（アメーバ赤痢の治療薬）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a エリスロマイシン</td><td>×</td><td>マクロライド→マイコプラズマ・クラミジア（アメーバ原虫には無効）</td></tr><tr><td>b フルコナゾール</td><td>×</td><td>抗真菌薬（アメーバは原虫→無効）</td></tr><tr><td>c プレドニゾロン</td><td>×</td><td>副腎皮質ステロイド→原因治療でない（アメーバを悪化させる可能性）</td></tr><tr><td>d ミノサイクリン</td><td>×</td><td>テトラサイクリン系→アメーバに対しては補助的（第一選択でない）</td></tr><tr><td>e メトロニダゾール</td><td>○</td><td>アメーバ赤痢の第一選択→組織アメーバ（腸管・肝膿瘍）に有効</td></tr></table></div>',

"q340": '<div class="eb ee"><h4>□ 選択肢評価（咳嗽・胸痛・胸水→肺吸虫症）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 肺結核症</td><td>×</td><td>空洞性病変・塗抹陽性が典型（好酸球性胸水・サワガニ摂食歴と合わない）</td></tr><tr><td>b 肺化膿症</td><td>×</td><td>急性の化膿性炎症（慢性経過・好酸球性胸水とは合わない）</td></tr><tr><td>c 肺吸虫症</td><td>○</td><td>Paragonimus westermani：サワガニ・ザリガニ生食→咳嗽・血痰・胸痛・好酸球性胸水</td></tr><tr><td>d 肺クリプトコックス症</td><td>×</td><td>単発結節影が典型（好酸球性胸水は典型でない）</td></tr></table></div>',

"q341": '<div class="eb ee"><h4>□ 選択肢評価（ボツリヌス中毒でみられない症状）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 縮瞳</td><td>○（みられない）</td><td>ボツリヌス毒素→副交感神経阻害→瞳孔括約筋弛緩→散瞳（縮瞳ではない）</td></tr><tr><td>b 眼瞼下垂</td><td>みられる</td><td>外眼筋麻痺→眼瞼下垂・複視（コリン作動性神経が障害）</td></tr><tr><td>c 輻輳障害</td><td>みられる</td><td>外眼筋麻痺→輻輳（寄り目）が困難</td></tr><tr><td>d 対光反射消失</td><td>みられる</td><td>副交感神経阻害→瞳孔収縮反応がなくなる（固定散瞳）</td></tr></table></div>',

"q342": '<div class="eb ee"><h4>□ 選択肢評価（フグ中毒に関する正しい記述）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 毒は肝臓と卵巣とに多い</td><td>○</td><td>テトロドトキシン（TTX）：卵巣・肝臓に最多→皮膚・腸にも含まれる</td></tr><tr><td>b 毒は加熱調理によって分解される</td><td>×</td><td>TTXは熱安定（調理しても分解されない→完全な予防には有毒部位の除去が必須）</td></tr><tr><td>c 摂食して1日以上経過してから発症する</td><td>×</td><td>摂食後30分〜3時間で発症（1日以上は誤り）</td></tr><tr><td>d 胃洗浄は禁忌である</td><td>×</td><td>早期の胃洗浄は有効（禁忌ではない）</td></tr></table></div>',

"q343": '<div class="eb ee"><h4>□ 選択肢評価（性感染症でないもの）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 梅毒性肝炎</td><td>STD</td><td>梅毒（Treponema pallidum）→性行為感染症が主要経路</td></tr><tr><td>b B型急性肝炎</td><td>STD</td><td>HBVは性行為感染・血液感染（針刺し・母子）</td></tr><tr><td>c 日本住血吸虫症</td><td>○（STDでない）</td><td>ミヤイリガイ（中間宿主）→淡水中のセルカリアが皮膚から感染（性行為感染ではない）</td></tr><tr><td>d アメーバ性肝膿瘍</td><td>STD（含む）</td><td>アメーバ赤痢→性行為（肛門性交等）でも感染→STD的側面あり</td></tr></table></div>',

"q344": '<div class="eb ee"><h4>□ 選択肢評価（マラリアに関する正しい記述2つ）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 防蚊対策が予防に有効</td><td>○</td><td>Anopheles蚊が媒介→蚊帳・虫除けスプレー・長袖長ズボンが予防の基本</td></tr><tr><td>b 原因微生物はウイルスである</td><td>×</td><td>Plasmodium属（原虫）→ウイルスではない</td></tr><tr><td>c 飛沫感染でヒト−ヒト感染する</td><td>×</td><td>Anopheles蚊媒介（飛沫感染しない）</td></tr><tr><td>d 重症化すると多臓器不全を起こす</td><td>○</td><td>重症熱帯熱マラリア（P.falciparum）：脳マラリア・腎不全・DIC・多臓器不全</td></tr></table></div>',

"q345": '<div class="eb ee"><h4>□ 選択肢評価（5か月乳児・便秘→下降性筋弛緩）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 脳性麻痺</td><td>×</td><td>周産期脳障害による運動障害（新生児期から症状あり・便秘から始まる経過と合わない）</td></tr><tr><td>b 重症筋無力症</td><td>×</td><td>自己抗体（AChR抗体等）による神経筋接合部障害（乳児では稀・便秘は典型症状でない）</td></tr><tr><td>c ボツリヌス症</td><td>○</td><td>乳児ボツリヌス症：芽胞摂取→腸内で毒素産生→便秘（初発）→哺乳力低下→頸部から下降性麻痺</td></tr><tr><td>d 先天性ミオパチー</td><td>×</td><td>筋力低下は出生時から（便秘から始まる急性発症とは異なる）</td></tr></table></div>',

"q346": '<div class="eb ee"><h4>□ 選択肢評価（ボツリヌス食中毒の予防食品取扱い）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 真空保存を行う</td><td>×</td><td>C.botulinumは嫌気性菌→真空（無酸素）状態で増殖しやすい（逆効果）</td></tr><tr><td>b 紫外線照射を行う</td><td>×</td><td>芽胞は紫外線に耐性（表面のみ効果・内部には到達しない）</td></tr><tr><td>c 120℃で4分間加熱する</td><td>○</td><td>C.botulinum芽胞の不活化→オートクレーブ（加圧蒸気滅菌）が必要（100℃では死滅しない）</td></tr><tr><td>d 20℃以下の温度で保存する</td><td>×</td><td>C.botulinumは低温（4℃以上）でも増殖可能（20℃以下では不十分）</td></tr></table></div>',

"q347": '<div class="eb ee"><h4>□ 選択肢評価（海外渡航後下痢の原因微生物）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 赤痢アメーバ</td><td>×</td><td>粘血便・腹痛が典型（腹部膨満・脂肪便・悪臭は典型でない）</td></tr><tr><td>b 病原性大腸菌</td><td>×</td><td>水様下痢（ETEC等）→旅行者下痢の最多だが脂肪吸収障害は典型でない</td></tr><tr><td>c ランブル鞭毛虫（Giardia lamblia）</td><td>○</td><td>小腸に寄生→脂肪吸収障害→水様下痢・腹部膨満・悪臭脂肪便・発熱少ない</td></tr><tr><td>d Clostridium difficile</td><td>×</td><td>院内感染・抗菌薬投与後（海外渡航者の初発には典型でない）</td></tr></table></div>',

"q348": '<div class="eb ee"><h4>□ 選択肢評価（ランブル鞭毛虫症の患者で追加確認すべき事項）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 外傷歴</td><td>×</td><td>ランブル鞭毛虫の感染経路（糞口・性的接触）とは無関係</td></tr><tr><td>b 虫刺痕</td><td>×</td><td>節足動物媒介感染（マラリア等）の確認→ランブル鞭毛虫には無関係</td></tr><tr><td>c 抗菌薬服用歴</td><td>×</td><td>C.difficile腸炎の確認（ランブル鞭毛虫とは別の文脈）</td></tr><tr><td>d 同性との性的接触歴</td><td>○</td><td>Giardia→肛門性交でも感染→同性間性交渉（MSM）でリスク→HIVや梅毒等のSTDも評価</td></tr></table></div>',

"q349": '<div class="eb ee"><h4>□ 選択肢評価（「財布がない」と訴えるが保管されている→この症状）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 滞続言語</td><td>×</td><td>同じ言葉を繰り返す（perseveration）→異なる症状</td></tr><tr><td>b 収集癖</td><td>×</td><td>物を集めて溜め込む行動→「財布がない」という訴えとは異なる</td></tr><tr><td>c 取り繕い</td><td>○</td><td>記憶できないことを自然に誤魔化す行動→「財布がない」という誤った訴えを本人は信じている</td></tr><tr><td>d 立ち去り行動</td><td>×</td><td>説明等から逃げ出す行動→「財布がない」と訴え続ける行動とは異なる</td></tr></table></div>',

"q350": '<div class="eb ee"><h4>□ 選択肢評価（マラリア診断に用いる染色法）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a Gram染色</td><td>×</td><td>細菌の染色（原虫には使わない）</td></tr><tr><td>b Grocott染色</td><td>×</td><td>真菌の染色（原虫には使わない）</td></tr><tr><td>c May-Giemsa染色</td><td>○</td><td>赤血球内のPlasmodium（マラリア原虫）を染色→薄層・厚層塗抹で感度を上げる</td></tr><tr><td>d Papanicolaou染色</td><td>×</td><td>細胞診（がん細胞の形態確認→原虫には使わない）</td></tr></table></div>',

"q351": '<div class="eb ee"><h4>□ 選択肢評価（アニサキス症の診断に最も適切な検査）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 腹部造影CT</td><td>×</td><td>重症例（穿孔・腸閉塞疑い）では有用だが、初期診断では内視鏡が優先</td></tr><tr><td>b 腹部超音波検査</td><td>×</td><td>腸アニサキス症では有用だが胃アニサキス症の確定診断には限界</td></tr><tr><td>c 腹部エックス線撮影</td><td>×</td><td>穿孔の確認（フリーエアー）→アニサキス虫体の確認はできない</td></tr><tr><td>d 上部消化管内視鏡検査</td><td>○</td><td>診断と治療を兼ねる→胃壁に刺入した白色糸状虫体を確認・把持鉗子で除去</td></tr></table></div>',

"q352": '<div class="eb ee"><h4>□ 選択肢評価（肝吸虫症で最も増加する白血球分画）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 好中球</td><td>×</td><td>細菌感染で増加（寄生虫感染では主役でない）</td></tr><tr><td>b 好酸球</td><td>○</td><td>多細胞寄生虫（蠕虫・吸虫・条虫）→Th2サイトカイン（IL-5）→好酸球増多</td></tr><tr><td>c 好塩基球</td><td>×</td><td>アレルギー反応・一部の寄生虫感染で増加することがあるが好酸球が主役</td></tr><tr><td>d 単球</td><td>×</td><td>単核球→慢性感染・肉芽腫形成（好酸球増多ほど顕著でない）</td></tr></table></div>',

"q353": '<div class="eb ee"><h4>□ 選択肢評価（5日前からの嚥下困難・徐々に増悪の原因）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 破傷風</td><td>○</td><td>Clostridium tetaniの毒素→咬筋・嚥下筋の痙縮→開口障害・嚥下困難（初発症状として多い）</td></tr><tr><td>b 多発性筋炎</td><td>×</td><td>炎症性筋疾患→近位筋筋力低下が主体・嚥下困難もあるが開口障害・後弓反張は典型でない</td></tr><tr><td>c 重症筋無力症</td><td>×</td><td>抗AChR抗体→神経筋接合部障害→易疲労性・夕方増悪（痙縮・後弓反張はない）</td></tr><tr><td>d 多発性硬化症</td><td>×</td><td>中枢神経脱髄→視力障害・感覚障害・運動障害（嚥下困難はあるが痙縮様の開口障害は典型でない）</td></tr></table></div>',

"q354": '<div class="eb ee"><h4>□ 選択肢評価（南アジア旅行後・腹部膨満・下痢の診断）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 回虫症</td><td>×</td><td>回虫は成虫になると腸内に住む→腹痛・腸閉塞（脂肪便・腹部膨満とは異なる）</td></tr><tr><td>b アメーバ赤痢</td><td>×</td><td>粘血便・腹痛が典型（脂肪便・腹部膨満は典型でない）</td></tr><tr><td>c 日本海裂頭条虫症</td><td>×</td><td>サーモン・鮭の生食→成虫（条虫）が腸内に寄生（腹部膨満・脂肪便は典型でない）</td></tr><tr><td>d ランブル鞭毛虫症</td><td>○</td><td>Giardia lamblia：小腸寄生→脂肪吸収障害→腹部膨満・水様下痢（脂肪便）・発熱少ない</td></tr></table></div>',

"q355": '<div class="eb ee"><h4>□ 選択肢評価（アメーバ赤痢の最も起こりやすい合併症）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 髄膜炎</td><td>×</td><td>アメーバ性髄膜炎は非常に稀（Naegleria等の別アメーバが原因）</td></tr><tr><td>b 肝膿瘍</td><td>○</td><td>Entamoeba histolyticaが門脈を介して肝臓へ血行性播種→右葉単発のチョコレート色膿→最多合併症</td></tr><tr><td>c 進行麻痺</td><td>×</td><td>梅毒の晩期合併症（アメーバ赤痢とは無関係）</td></tr><tr><td>d 壊死性筋膜炎</td><td>×</td><td>A群連鎖球菌・嫌気性菌等の皮膚軟部組織感染（アメーバ赤痢の合併症でない）</td></tr></table></div>',

"q356": '<div class="eb ee"><h4>□ 選択肢評価（破傷風でみられない症状）</h4><table class="tb"><tr><th>選択肢</th><th>評価</th><th>根拠</th></tr><tr><td>a 流涎</td><td>みられる</td><td>自律神経障害→副交感神経亢進→唾液分泌過多</td></tr><tr><td>b 開口障害</td><td>みられる</td><td>牙関緊急（trismus）：咬筋の痙縮→初発症状として最も多い</td></tr><tr><td>c 弓なり反張</td><td>みられる</td><td>後弓反張（opisthotonus）：背筋・脊柱起立筋の痙縮→弓状に後屈</td></tr><tr><td>d 排尿・排便障害</td><td>みられる</td><td>自律神経障害→膀胱・腸管の痙縮→尿閉・便秘</td></tr><tr><td>e 弛緩性四肢麻痺</td><td>○（みられない）</td><td>破傷風は痙縮性麻痺（筋の過収縮）→弛緩性麻痺はボツリヌス中毒の特徴（破傷風ではない）</td></tr></table></div>',
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

path = r'C:\Users\coool\Desktop\MEC\感染症\ch07_kansen_other.html'
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
print("Done ch07")
