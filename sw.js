// 2026-08-22i: ヘッダー折りたたみ時（hdr-collapsed）の1行統合レイアウト実装。
//   「← ハブへ」「試験モード」「統計バッジ群」を1行に整然とまとめ、問題閲覧領域を大幅拡大。
//   「← ハブへ」ボタンを高コントラスト・鮮明な発光・立体感のあるデザインに全面刷新。
//   シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-22h: UIテーマ自律進化・完全ビジュアル改善ループ（全10イテレーション完遂）。
//   全4テーマ（Aurora/Brass/Cyber/Liquid）の背景・環境光・問題カード立体造形・ヘッダー・
//   バッジ・引用インジケーター・タクタイル選択肢・解答解説・自己採点ボタン群（44pxタッチ領域）・
//   GPU動的リアクション・モバイル幅最適化を極限調律。
//   シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-22b: 疾患マインドマップが全科目で壊れていたのを直した。演出強化で入った
//   @keyframes mmDisPop が transform を動かしており、疾患ノードの位置を与えている
//   <g transform="translate(x,y)"> の提示属性を丸ごと上書き＝全ノードが原点（盤面中央）に
//   折り重なって病名が白文字の山になっていた。独立プロパティの scale へ替え、
//   非表示タブでアニメが凍っても見えるよう opacity を 0 にしない形にした。
//   シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-22a: 疾患マインドマップの残り6科目（精神科は前回・今回は 小児科(peds)・産婦人科(obg)・
//   感染症(kansen)）を追加し、全21科目のデータが揃った（176章804疾患236関連＋ハブ168疾患104関連）。
//   データファイルなので SHELL に登録した。CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-21h: 疾患マインドマップに 精神科(psy)・皮膚科(derm)・眼科(oph) を追加。
//   これでマイナー講座8科目＋横断テーマ tox が全部マップ化された（残るは kansen/peds/obg）。
// 2026-08-21g: 疾患マインドマップに 泌尿器科(uro)・整形外科(ortho)・耳鼻咽喉科(ent) を追加。
//   マイナー講座8科目のうち6科目（tox/anes/rad/uro/ortho/ent）がマップ化された。
// 2026-08-21f: 疾患マインドマップに 中毒・職業病(tox)・麻酔科(anes)・放射線科(rad) の3科目を追加
//   （mindmap_data/{tox,anes,rad}.js と _hub.js の代表疾患）。データファイルなので SHELL に登録した。
//   questions_*.json も画像も触っていないので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-21e: 効果音を sounds/{正解音,起動音,選択音}/ の3フォルダに整理し、一覧を
//   sounds_index.js（sounds/meta.json から node _work/build_sounds_index.js が生成）へ寄せた。
//   ファイル名・キー・音量の表が study_exam.js / index.html / chapter_exam.js の3か所に
//   分かれていたのを1本に統合＝片方だけ増やして乖離する事故が構造的に起きなくなった。
//   起動音は設定で選ばせず**試験開始のたびにランダム**（設定は鳴らす／鳴らさないだけ）。
//   正解音・選択音の合成音（ping/chime/…）は全廃し、ユーザーが置いた音だけにした。
//   ⚠️ sounds/ 自体は SHELL に入れていない（従来どおり＝オフラインでは鳴らない）。入れる
//      なら CACHE ごと bump が要る。シェルのみの変更なので今回は SHELL_VERSION だけ bump。
// 2026-08-21d: 疾患マインドマップを 1エンジン＋データ分離へ移行し、SHELL に登録した。
//   旧実装は mindmap 関連を1バイトもキャッシュしておらず、オフラインで開けなかった。
//   questions_*.json も画像も触っていないので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-20a: 結果画面の達成報告に「あと何件来るか」を持たせた（授与トレイ・Phase 6）。
// セレモニーとトーストは _cerQ / _toastQ の2列で並行に流れていたため、全画面セレモニーの真上に
// トーストが重なって両方読めず、しかも件数を数えられなかった。→ _annQ 1本に併合し、結果画面の
// #gmTrayMount に「🎖 今回の獲得 N件」の一覧を先に描く（行は再生に合わせて点灯＝残り＝暗い行）。
// タップで次へ／「まとめて受け取る」で打ち切れるが、飛ばした内容もトレイに残る＝情報は失われない。
// ⚠️ 総数は onExamFinish が返った時点で確定している（_bumpMission も _afterEvent も同期呼び出し）
// ので、あの1行でトレイを描けば表が後からガタつかない。⚠️ 位置表示は .gm-cer の中ではなく
// overlay 直下（画面下部・dvh 基準）に置く——中に入れるとトレイの見出しに重なる（実機で確認）。
// ⚠️ 2列へ戻さないこと（位置表示が意味を持つ前提が併合そのもの）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-19h: 歯車を吹き上がらせ、火花と煙をさらに大きく・濃くした。歯車は膨らんでいる間
// playbackRate 14倍（約0.4秒/回転）で回り、表示も 520→680ms（1回転半ぶん読める）。
// ⚠️⚠️ .ep-gear-blow に animation-play-state:running を強制しないと1frameも回らない——
// 解答した瞬間は D9 が exam-idle-lit を外して歯車を止めている（1拍止まる）ため。
// ⚠️⚠️ getAnimations() は CSS transition も返す。名前で絞らずに playbackRate を書き換えると
// 歯車の scale/opacity の transition まで加速され、膨らみのバネ(.16s)が14倍速で潰れて瞬間移動に
// 見える（実機で確認して _isNamedAnim を追加）。⚠️ playbackRate の持ち主は _machSurge 1つに
// 寄せること（R8 とR2 が別々のタイマー列を持つと片方の減速が他方の加速を打ち消す）。
// 火花は count 16→26・scale .85→2.2・speed 640→900（⚠️大きさは tier ではなく scale で上げる。
// tier は speed の既定と ttl も動かすので「大きく」ではなく「遠くまで長く飛ぶ」になる）。
// 煙は alpha .55→.82・max 110→130・粒数 64→88、色を STEAM_TONES で核ほど暗くして厚みを出した。
// ⚠️ 濃さは粒数と粒径ではなく alpha と色で稼ぐこと——描画面積は粒径の2乗で効く（現在
// 546px角×88粒＝約26Mpx/frame。テストが30Mpxを上限に見張る）。シェルのみ＝CACHE は据え置き。
// 2026-08-19g: 蒸気の放出(R1)をさらに拡大し、歯車の膨らみと火花(R2)を足した。左右の弁から
// それぞれ内側へ4段の小噴出（計8点・64粒・最大110px）を撒き、画面中央で重なる。⚠️ 到達距離は
// 必ず画面幅に比例させること（STEAM_SPAN=.42）——固定 px だと iPad で中央を越え、1920 では
// 届かない。⚠️ MecFX.steam の引数や既定値は変えない（エミッタは純増の約束＝7テーマに波及）。
// 横へ伸ばすのは同じ弁から x をずらして複数回呼ぶことで作る。あわせて放出の瞬間に歯車が3.2倍
// （520ms）になり噛み合いから火花が飛ぶ。⚠️⚠️ 拡大は scale プロパティで行うこと——歯車は
// animation:epGearSpin が transform を占有しており、transform:scale() は上書きされて何も起きない。
// scale はレイアウトに影響しないのでヘッダの高さは不変（実測 208.79px / 28.32px が拡大前後で同一）。
// ⚠️ 倍率は右の歯車から画面右端までの約110px を超えないこと（超えると iOS がレイアウト
// ビューポートを広げ 2026-08-19b の縮尺振動が再発する。3.2倍で108px 残る）。⚠️ 火花は burst に
// additive:false 必須（既定は加算合成＝光の玉になる）。シェルのみ＝CACHE は据え置き。
// 2026-08-19f: 解答した瞬間の蒸気の放出(R1)を約2.5倍へ引き上げた（両弁あわせて14→36粒・
// 最大44→84px・alpha .40→.55）。放出量を「読書中の噴気」の延長で決めており、原則1（周辺視野に
// 留める）を放出側にも引きずっていたのが小さかった原因。放出は解答した後＝読解がもう終わって
// いる瞬間なので、正解／誤答の演出と同じ土俵で大きく出してよい。⚠️ 噴気（読書中）は据え置き。
// ⚠️ rise は 250 まで上げてから 170 へ戻した——発生源はレール(実測 y≒209)で画面上端までの余地が
// それしかなく、初速を上げると寿命1.0〜1.9秒の半分以上を画面外で使い「速く抜ける細い噴射」に
// 見える。大きく見せるのは速度ではなく滞留時間と粒径(grow)。⚠️ 正誤で量も色も変えない
// （量っているのは正誤ではなく費やした思考＝機械は判定せず圧を抜くだけ）。シェルのみ＝CACHE 据え置き。
// 2026-08-19e: 決断フェーズ(R6)の選択肢から水平の「線」を3本とも落とした。各肢の上端の明線・
// 下端の暗線・直下の硬い銅の側壁を置いていたが、肢は負マージンで詰めて積んであるので
// 「各行に罫線が引かれた表」に見え、とくに銅の側壁が下線そのものに見えた。⚠️ 下線部はこの教材で
// 意味を持つ記号（本文中の下線部①〜⑤が選択肢そのもの＝ortho NO.167/171/142・rad NO.2）なので、
// 装飾の線が紛れると設問の読解を壊す。立体感は拡散した影1層（負の spread で端に線を作らない）
// ＋わずかな浮きだけで出す形へ変更。シェルのみ＝CACHE は据え置き。
// 2026-08-19d: 読んでいる間の演出を追加した（演出強化 Phase 5・R1〜R13）。解答するまでの
// 8〜15秒は「3pxの静止した焦点枠」と「1pxの稼働灯」しか無かったので、読書時間を
// 「機械が待っている時間」として作り直した。焦点カードを持ち上げ真鍮のクランプで掴み、
// 連続正解を枠の色に残す。7秒を超えると安全弁から蒸気が上がり解答の瞬間に放出、
// スクロール中は機械が速く回り、60秒で休んで動かすと起動する。計器ベイに歯車2枚。
// 画像は読影灯に掛かり、選択肢が視野に入ると「読む→決める」へ相転移して肢が起き上がる。
// ⚠️ 試験開始直後だけ焦点が付かない穴を塞いだ（R3/R5/R13 が全部そこにぶら下がるため）。
// ⚠️ ヘッダの高さは 211.375px で不変（実測）。⚠️ R8 は animation-duration ではなく playbackRate
// （走行中に duration を変えると進捗率が飛んで光がワープする）。シェルのみ＝CACHE は据え置き。
// 2026-08-19b: 稼働灯(D9)が試験中にページの縮尺を1.4秒周期で振動させていたのを直した。
// width:26% の疑似要素を translateX(-110%→395%) で走らせており右へ約547pxはみ出していた——
// デスクトップ Chrome は文書のスクロール領域を広げないが、iOS Safari は右へあふれた内容に
// 合わせてレイアウトビューポートを広げるため、width=device-width の下でページが勝手に
// 拡大→復帰を繰り返し続けた。left:0/right:0 で箱に固定し background-position を動かす形へ変更。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-19a: 試験UIを「筐体（真鍮固定）／盤面（テーマ可変）」の2層に分けた（演出強化 Phase 4・D1〜D9）。
// ヘッダ下端の真鍮のレール、進捗トラックを銅の樋（チャネル）へ、開始／結果モーダルを同じ真鍮の額縁
// （稜線＋四隅のリベット）に統一。開始＝琥珀・結果＝青という根拠の無い色分けを廃止。動くのは
// カードに向かっている間だけレールを走る稼働灯1つで、答えた瞬間に消える。⚠️ 盤面（.exam-prog-fill /
// .ep-tick / スコアリング等）には真鍮を1つも入れない——目盛りを真鍮にすると --yl と輝度がほぼ同一
// （1.008:1）で通過済み区間から消える。⚠️ モーダルの筐体は疑似要素で描かない（overflow-y:auto の
// 中では内容と一緒に流れる）。⚠️ ヘッダの高さは1pxも増やしていない（_fxBand() の焦点が動くため）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-18e: stats.html を再構成した（演出強化 Phase 3「減らす → 動かす」）。セクションを14→10に
// 畳み、4層（今の状態 / 積み上げ / どこが弱いか / 道具）に束ねた。弱いもののリスト4本と時間の記録
// 3本の重複を統合し、📐「本番との差」は引き算の左右で分母が違い読めない値なので廃止（同じ uid で
// 比べる形＝🔻本番差タグとして残す）。章別ヒートマップは科目→章の2段。⚠️ セクションを display:none
// から出入りさせない（日によってページの形が変わる）。⚠️ 入場は rv-on を外す1つの口で必ず解除する
// ——非表示タブでは CSS アニメーションが進まず fill:forwards が効かないので .in では救えない。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-18d: 試験経路の演出を広げた（B1〜B8）。科目の読み込みにチップの脈とカードの波状着地、
// 進捗バーに目盛りと難問の位置（節目は祝わず距離感だけを示す＝音も粒子も出さない）、残り5問から
// ラストスパート。開始モーダルに「この条件で N問（うち難問 M問）」、結果画面に難問の成績、
// 閉じたら幕が下りて解いた問題が成績付きで残る。1問目だけシャッフルを見せて特別に入場させ、
// 誤答再試験はリマッチとして始まる。⚠️ 集計は _tallyQuestion（採点経路は3つあり
// _afterCorrectFx は複数選択を通らない）。⚠️ 完了の合図を rAF だけに預けない（非表示タブで止まる）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-18c: セレモニー（LEVEL UP / MISSION COMPLETE / 章・科目制覇）をキュー式にした。
// 上書きするだけでキューが無く、40問目の解答では MISSION COMPLETE が同じ同期呼び出しの中の
// LEVEL UP に上書きされて必ず消えていた。あわせて試験モード中はセレモニーもトーストも溜め、
// 結果画面（onExamFinish が置く静粛時間の後）で順に再生する——全画面セレモニーは tier 演出の
// 真上に被り、トーストは top:14px 固定で iPad の試験ヘッダ(約180px)の裏に出て読めなかった。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-18a: 難問突破（正答率60%未満）の低い「ドン」を廃止した。正解音に重なって鳴るのに
// 音の設定から切れず、耳障りだった。演出（刻印＋粒子）はそのまま残す。study_exam.js の
// _playHardTone と chapter_exam.js の ceHardClear の ceTone を両方外した（ミラー）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-14c: ハブのボタンを止まっていても生かした（F1〜F5）。副ボタンにも光沢を走らせ、
// 縁が data-fx の色（🔔復習=青/📚全科目=緑/🔁誤答=赤）で呼吸し、先頭の絵文字が席ごとに
// ずれて跳ね、主ボタンからは粒子が常に立ち上る。片付いた席（is-off）だけは一切動かさない。
// ⚠️ CSS変数は --cta- 接頭辞必須。--cb は vars.css のカード背景色と衝突し、継承した色を
// animation ショートハンドが duration に食って主・副の呼吸が黙って死んだ。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-14b: ハブのヒーローに演出を足した。ボタンは押し込み・リップル・遷移前のひと呼吸で、
// 粒子の色は「席」ではなく中身で決める（🔔復習=青／📚全科目=緑／🔁誤答=赤）。誤答ボタンは
// 件数の段で縁が脈打ち、0件の席は✓で「片付いた」と描く。計器行（復習待ち・連続・済 累計）に
// カウントアップと入場を入れ、復習待ちの滞留を色で読ませる。目標に届いた日は大きな読み値が金。
// ⚠️ _tweenNum に落とし所を足した（非表示タブでは rAF が止まり数字が 0 で凍っていた）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-14a: 演出を広げた。正解の描き分け（難問クリア・初見突破・リベンジ・速答3段）、
// 誤答側（コンボメーター崩落・同じ肢の繰り返し・心電図テーマのフラットライン・傷マーカー）、
// 誤答の次を正解した「立て直し」、連続正解の天井を tier7（30連続〜）へ。
// ハブは起動シーケンス／Gist同期の歯車／レベルバー／30日波形の記録更新／炎の段階化／達成の刻印。
// SRS完走後に「次に戻ってくる日」の分布、結果表のバー、stats のカルテ登場、knowledge の絞り込み。
// fx_engine.js に shatter/ribbon/stamp/orbit/wave を純増（既存エミッタは無改変）。
// シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// 2026-08-13c: ハブの「今日の目標」ゲージを拡大（viewBox 140→168・盤面 152→208px・
// 歯車4枚）し、演出を常時化した（火花と蒸気が1.7秒ごと・22秒ごとに祝砲）。
// 見出し行に日付も出す。シェルのみの変更なので CACHE は据え置き＝SHELL_VERSION だけ bump。
// v168: 中毒・職業病(tox)を新科目として追加（☠️・#65A30D・全7章48問）。
// questions_tox.json を CARDS に加えたので CACHE を bump（画像は0枚）。
// 金属中毒4／有機溶剤中毒5／農薬中毒6／その他の中毒6／自然毒3／ガス体中毒6／
// 物理的原因による疾患18。マイナー講座8科目とは別枠の「横断テーマ」科目で、
// PDFは「レジュメ＋問題」が交互に並ぶ構成（マイナー講座の問題集PDFとは版面が違う）。
// 本科目の軸は①曝露源（BM＝生物学的モニタリング）から物質を決める ②ガス体中毒は
// 「酸素のどこを止めるか」の3系統（追い出す／運ばせない／使わせない）で割る
// ③物理的因子は「エネルギーがどこまで届くか」で障害部位が決まる（紫外線＝角膜上皮／
// 赤外線・マイクロ波＝白内障）④現場では「まず自分が死なない」。
// 最難は NO.46(115F-21・60%)＝奇形は受精2〜8週の器官形成期（8〜15週は精神発達遅滞）、
// 次いで NO.43(110I-24・64%)＝職業被ばくは 100mSv/5年 かつ 50mSv/年。
// v167: 放射線科(rad)を新科目として追加（☢️・#475569・全4章60問）。
// questions_rad.json を CARDS に加え、放射線科/images/（32枚）を追加したので CACHE を bump。
// 序章1問／放射線診断学33問／放射線治療学10問／医療安全・放射線防護16問。
// これでマイナー講座8科目（psy/derm/oph/ent/uro/ortho/anes/rad）が揃った。
// 本科目の軸は①検査を選ぶ前に禁忌（腎機能・喘息・体内金属）を通す ②モダリティは
// 「何を見たいか」で決まる（早期脳梗塞＝MRI／出血・石灰化＝CT）③感受性は
// Bergonie-Tribondeauの法則1本 ④防護は時間・距離・遮蔽の3原則。
// 最難は NO.27(114C-69・20%)＝仰臥位AP像と立位PA像では心拡大を比較できない、
// 次いで NO.54(109G-17・11%)＝ヒトでは遺伝的影響は確認されていない。
// v166: 麻酔科(anes) 第2章「緩和医療」NO.36-52（17問・画像1問1枚）を追加し全2章52問が完成。
// questions_anes.json を更新し 麻酔科/images/112F-50_1.jpeg を追加したので CACHE を bump。
// これでマイナー講座7科目（psy/derm/oph/ent/uro/ortho/anes）が全て揃った。
// 本章はWHO方式が答えそのもの——by mouth（飲めるなら口から）と by the clock（時刻を決めて）の
// 2原則で半分が解ける。オピオイドは積み上げず置き換える（強オピオイドに弱オピオイドを足さない
// ＝NO.43・正答率19%で本科目最低）。副作用は便秘だけ耐性がつかない＝開始と同時に緩下薬。
// NO.45（117F-42）は採点除外＝本科目で唯一（bxバッジ・正解肢0・rate なし）。
// v165: 麻酔科(anes)を新科目として追加（第1章「周術期の麻酔」NO.1-35・画像8問17枚）。
// questions_anes.json を CARDS に加え、麻酔科/images/ を追加したので CACHE を bump。
// マイナー講座7科目め。全2章52問の小さな科目で、第2章「緩和医療」17問は未実装。
// 気道確保・気管挿管10問／ERASの周術期管理6問／区域麻酔6問が骨格。
// 術中のバイタルは「向き」で答えが正反対（上がったら鎮痛不足＝NO.33／
// 侵襲が無いのに下がったら麻酔が深い＝NO.15）。
// v164: 整形外科(ortho) 第6章「ロコモとサルコペニア・フレイル」NO.167-174（8問・画像0枚）を追加。
// これで ortho 全6章174問が完成し、マイナー講座6科目（psy/derm/oph/ent/uro/ortho）が全て揃った。
// questions_ortho.json を更新したので CACHE を bump（本章は画像が無いので images/ の追加は無し）。
// フレイル4問＋ロコモ3問＋低栄養1問。身体的フレイルはJ-CHSの5項目で数える
// （体重減少・疲労感・歩行速度・握力・身体活動）＝日中の眠気は入らない。
// 高齢者に「安静・外出制限・減量・蛋白制限」を指示する肢は本章では例外なく誤り。
// v163: 整形外科(ortho) 第5章「その他の疾患」NO.140-166（27問・画像18問31枚）を追加。
// v162: 整形外科(ortho) 第4章「骨　折」NO.107-139（33問・画像19問39枚＝ortho最多）を追加。
// （v162・v163 は CACHE のみ bump していて、この見出しは後から補記したもの）
// v161: 整形外科(ortho) 第3章「関節疾患」NO.74-106（33問・画像19問29枚）を追加。
// questions_ortho.json と 整形外科/images/ を更新したので CACHE を bump。
// 変形性関節症9問・膝の靱帯/半月板6問・小児の股関節5問・肘内障3問・腱板断裂3問が骨格。
// 「小児が膝の痛みを訴えたら股関節を診る」がNO.86/90/99で3回反復する。
// v160: 整形外科(ortho) 第2章「神経の障害」NO.31-73（43問・画像10問17枚＝ortho最大の章）を追加。
// questions_ortho.json と 整形外科/images/ を更新したので CACHE を bump。
// 頸髄損傷10問・手根管症候群6問・腰椎椎間板ヘルニア5問が骨格。C6（手関節背屈＝万能カフ）と
// C7（上腕三頭筋＝プッシュアップ）の境目がADLの分水嶺で、4問がこの1点で解ける。
// v159: 整形外科(ortho)を新科目として追加（第1章「整形外科の基本」NO.1-30・画像10問19枚）。
// questions_ortho.json を CARDS に加え、整形外科/images/ を追加したので CACHE を bump。
// 本章はMMT（徒手筋力テスト）8問が骨格。3＝重力に抗して全可動域、2＝重力除去で全可動域。
// v158: 泌尿器科(uro) 第6章「泌尿器科感染症」NO.215-242（28問・画像4問9枚）を追加。
// これで uro 全6章242問が完成し、マイナー講座5科目（psy/derm/oph/ent/uro）が全て揃った。
// questions_uro.json と 泌尿器科/images/ を更新したので CACHE を bump。
// 腎盂腎炎16問＋性感染症8問が骨格。CVA叩打痛だけで4問（218・234・237・238）。
// v157: 泌尿器科(uro) 第5章「精巣・外性器」NO.187-214（28問・画像14問24枚）を追加。
// questions_uro.json と 泌尿器科/images/ を更新したので CACHE を bump。
// 精巣腫瘍8問・精巣捻転症3問・陰囊水腫3問が骨格（残るは第6章「泌尿器科感染症」28問）。
// v154: 泌尿器科(uro) 第2章「腎」NO.45-69（25問・画像18問22枚）を追加。
// questions_uro.json と 泌尿器科/images/ を更新したので CACHE を bump。
// 実質2疾患の章（腎細胞癌13問・多発性囊胞腎11問＋馬蹄鉄腎1問）。
// v153: 泌尿器科(uro)を新科目として追加（第1章「泌尿器の基本」NO.1-44・画像4問6枚）。
// questions_uro.json を CARDS に加え、泌尿器科/images/ を追加したので CACHE を bump。
// 全6章242問の予定（基本44／腎25／尿管膀胱尿道64／前立腺53／精巣外性器28／感染症28）。
// v146: 耳鼻咽喉科(ent)を新科目として追加（第1章「耳①：耳の基本」NO.1-20・画像8問14枚）。
// questions_ent.json を CARDS に加え、耳鼻咽喉科/images/ を追加したので CACHE を bump。
// 全8章214問の予定（耳20/30/48・鼻口唾3/36/14・咽喉頭20/43）。
// v141: 循環器ch02「心不全」後半25問(Q.103-127)の解説を眼科水準へ書き直し。
// これで ch02 全50問が完成。questions_circ.json を更新したので CACHE を bump。
// v140: 循環器ch02「心不全」前半25問(Q.78-102)の解説を眼科水準(ep/ee/em/ept)へ書き直し。
// あわせて ans_sub が設問と噛み合っていなかった11問を書き直した。うち Q.108(110G-68) と
// Q.114(107C-21) は「適切でないのはどれか」なのに ans_sub がその選択肢を推奨しており、
// **説明が正解と正反対**だった（ans_sub は設問文と突き合わせる検査を持たないため執筆時に発覚）。
// v139: 循環器ch02 の設問データをPDF原文へ戻した（正答率の入れ替わり2組・欠落3問、
// 連問ステムの欠落3問、設問文の書き換え1問、ans_label/ans_sub の取り違え1問、
// 表の選択肢が1列目だけに潰れていた2問、欠落画像1枚の抽出）。questions_circ.json と
// 循環器/images/106H-37_1.jpeg を更新したので CACHE を bump。
// v133: 循環器 第7章「心筋」28問(Q.442-469)の解説を眼科水準(ep/ee/em/ept)へ書き直し。
// あわせて Q.447 に欠けていた連問3/3の共通ステムを補い、Q.446 の設問文をPDF原文へ戻し、
// PDFの ↗N(IRT型)を誤読していた bm(N択)バッジ93問を削除した（表示専用・採点に影響なし）。
// ⚠️ この内容はいったん v132 の行として書いたが、**v132 は演出修正だけを載せて先に deploy され、
// その時点の questions_circ.json はまだ旧版だった**。その間にアプリを開いた端末は v132 の
// キャッシュに旧データを抱えたまま再取得しないので、データ側で改めて v133 へ bump している。
// 教訓: CACHE の bump は「データが同じコミットに入っていること」とセットで確認する。
// v132: 試験モードの演出の発火位置を「可視帯(_fxBand)」基準に変更（iPad実機の見切れ対策）。
// study_exam.js / chapter_exam.js / fx_engine.js を更新したので CACHE を bump
// （SHELL に入っているスクリプトなので bump しないと端末が旧版を掴んだまま）。
// v130: 眼科 第8章「その他の眼科疾患」22問を追加（questions_oph.json が 191→213問）。
// **これで眼科は全8章213問が完成**。画像も8問9枚を追加したので CACHE を bump。
// 章名は「その他」だが実体は眼外傷の章で、眼窩吹き抜け骨折だけで11問（半数）。
// 残りはうっ血乳頭3問・眼化学外傷/電気性眼炎4問・穿孔性眼外傷/眼内異物3問・視神経炎1問。
// v129: 眼科 第7章「ぶどう膜疾患」13問を追加（questions_oph.json が 178→191問）。
// 画像も10問19枚を追加したので CACHE を bump。軸はBehçet病4問・Vogt-小柳-原田病6問・
// サルコイドーシス2問＝三大ぶどう膜炎で12問。所見と病名の1対1対応が全問の分かれ目。
// v128: 眼科 第6章「黄斑部疾患」17問を追加（questions_oph.json が 161→178問）。
// 画像も12問23枚を追加したので CACHE を bump。軸は加齢黄斑変性10問・中心性漿液性脈絡網膜症4問。
// v127: 眼科 第5章「網膜疾患」46問を追加（questions_oph.json が 115→161問）。眼科で最大の章。
// 画像も23問40枚を追加したので CACHE を bump。軸は糖尿病網膜症11問・網膜血管閉塞9問・
// 裂孔原性網膜剝離10問・網膜色素変性8問で、血管新生緑内障5問がそれらを横につなぐ。
// v126: 眼科 第4章「緑内障」19問を追加（questions_oph.json が 96→115問）。
// 画像も9問16枚を追加したので CACHE を bump。本章は急性閉塞隅角緑内障発作（6問）と
// 開放隅角緑内障の視野障害・点眼薬選択が軸。NO.103 は視野図5枚が①〜⑤の選択肢そのもの。
// v125: 眼科 第3章「水晶体疾患」20問を追加（questions_oph.json が 76→96問）。
// 画像も12問12枚を追加したので CACHE を bump。本章は白内障手術（術式・術前検査・術後合併症）が軸。
// v124: 眼科 第2章「結膜・角膜疾患」26問を追加（questions_oph.json が 50→76問）。
// 画像も15問16枚を追加したので CACHE を bump。本章はアデノウイルス関連が9問を占める。
// v123: 眼科(oph)を新科目として追加（第1章「眼科の基本」NO.1-50・画像11問13枚）。
// questions_oph.json を CARDS に加え、眼科/images/ を追加したので CACHE を bump。
// 眼科は全8章213問の予定で、章頭NO.は 1／51／77／97／116／162／179／192。
// v122: エラー報告2件を修正。circ_ch03_q134(119F-70) に欠けていた心電図モニター波形を
// PDFから書き出して割り当て（循環器/images/119F-70_1.jpeg を新規追加）、peds_ch03_q127(115C-41)
// の「男児（％）／女児（％）」2列の表の選択肢から女児列が落ちていたのを復元。
// questions_circ/peds.json と画像を更新したので CACHE を bump。
// v121: 皮膚科 第9章「その他の皮膚疾患」27問を追加（questions_derm.json が 222→249問）。
// これで皮膚科は全9章・NO.1-249 が完成。画像も6問6枚を追加したので CACHE を bump。
// v120: 皮膚科 第8章「感染症」32問を追加（questions_derm.json が 190→222問）。
// 画像も21問32枚を追加したので CACHE を bump。
// v119: 皮膚科 第7章「悪性腫瘍」40問を追加（questions_derm.json が 150→190問）。
// derm では最大の章。画像も25問46枚を追加したので CACHE を bump。
// v118: 皮膚科 第6章「母斑と良性腫瘍」29問を追加（questions_derm.json が 121→150問）。
// 画像も18問26枚を追加したので CACHE を bump。
// v117: 皮膚科 第5章「水疱・膿疱」23問を追加（questions_derm.json が 98→121問）。
// 画像も20問33枚を追加したので CACHE を bump。
// v116: 皮膚科 第4章「角化症」17問を追加（questions_derm.json が 81→98問）。
// 画像も8問13枚を追加したので CACHE を bump。
// v115: 皮膚科 第3章「紅斑」27問を追加（questions_derm.json が 54→81問）。
// 画像も16問23枚を追加したので CACHE を bump。
// v114: 皮膚科 第2章「皮膚炎と蕁麻疹」27問を追加（questions_derm.json が 27→54問）。
// 画像も10問15枚を追加したので CACHE を bump。
// v113: 皮膚科(derm)を新科目として追加（第1章「皮膚科の基本」27問・画像8問）。
// questions_derm.json を CARDS に加え、皮膚科/images/ を追加したので CACHE を bump。
// v112: 精神科 第8章「その他の精神疾患」14問を追加（questions_psy.json が 242→256問）。
// これで精神科は全8章・NO.1-256 が完成。
// v111: 精神科 第7章「発達障害と小児の精神障害」24問を追加（questions_psy.json が 218→242問）。
// v110: 精神科 第6章「薬物に伴う精神行動障害」25問を追加（questions_psy.json が 193→218問）。
// v109: 精神科 第5章「睡眠の生理と睡眠障害」18問を追加（questions_psy.json が 175→193問）。
// あわせて psy のQ番号をPDF通し番号へ是正（章ごとにQ.1へ振り直していたのをやめた）。
// ch02〜ch04 の uid が psy_chNN_q1.. から通し番号へ変わるため、旧uidの進捗は引き継がれない。
// v108: 選択肢が欠落していた残り14問を復元（表・図の選択肢11問＋設問文ごと壊れていた3問）。
// questions_circ/jinzo_d.json を更新したので bump。過去問HTMLはシェル側の更新。
// v107: 精神科 第4章「神経症性障害」36問を追加（questions_psy.json が 139→175問）。データ更新のため bump。
// v106: 精神科 第3章「気分障害」41問を追加（questions_psy.json が 98→139問）。データ更新のため bump。
// v105: 精神科 第2章「統合失調症」25問を追加（questions_psy.json が 73→98問）。データ更新のため bump。
// v104: 精神科(psy)を新科目として追加。questions_psy.json を CARDS に加えたので CACHE を bump。
// v103: 計算問題を桁入力で解答できるようにした（calc_input.js 新設）。
// questions_circ/dige/endo/jinzo_d/peds/resp.json の ans_label を正規形へ書き換えたので、
// CARDS が旧内容のままだと入力欄が作れず解答不能のままになる。よって CACHE を bump する。
const CACHE = "mec-v169";
// シェル更新トリガ: この文字列を変えると sw.js のバイトが変わり SW 更新が走る。CACHE 名は
// 据え置きなので CARDS(問題JSON 約15MB)は再DLされない。install が cache:'reload' でシェルだけ
// 最新取得して上書きするため、シェル(html/css/js)を変えたらここを日付+連番で bump すれば確実に届く。
// （questions_*.json を変えた時だけ CACHE 自体を bump ＝全再DL）
const SHELL_VERSION = "2026-08-22i";
// パスは相対必須: GitHub Pages のプロジェクトサイト（/MEC/ 配下）では
// "/study.html" は 404 になり caches.addAll が失敗 → SW インストール自体が失敗する
const SHELL = [
  "./study.html",
  "./index.html",
  "./stats.html",
  "./knowledge.html",
  "./knowledge_notes.js",
  "./progress.js",
  "./attempts.js",
  "./fx_engine.js",
  "./calc_input.js",
  "./study_exam.js",
  "./fixed_uids.js",
  "./vars.css",
  "./theme.js",
  "./ui_theme.js",
  "./ui_theme.css",
  "./study.css",
  "./chapters_meta.js",
  "./rate_index.js",
  "./qmeta.json",
  "./image_dims.json",
  "./card_renderer.js",
  "./gamify.js",
  // 効果音の一覧（派生物）。⚠️ sounds/ の音そのものは入れていない（オフラインでは鳴らない）。
  "./sounds_index.js",
  // 疾患マインドマップ（2026-08-21・段A）。旧9本＋統合マップは1エンジン＋データ分離へ移行した。
  // ⚠️ 新しい科目のマップを作ったら mindmap_data/{sid}.js をここへ足すこと（足さないとその科目だけ
  //    オフラインで開けない）。index.js の ready:true と一致していること。
  "./mindmap.html",
  "./mindmap.js",
  "./mindmap.css",
  "./mindmap_data/index.js",
  "./mindmap_data/_hub.js",
  "./mindmap_data/endo.js",
  "./mindmap_data/resp.js",
  "./mindmap_data/circ.js",
  "./mindmap_data/dige.js",
  "./mindmap_data/neur.js",
  "./mindmap_data/hbp.js",
  "./mindmap_data/jinzo_d.js",
  "./mindmap_data/hema.js",
  "./mindmap_data/imma.js",
  "./mindmap_data/tox.js",
  "./mindmap_data/anes.js",
  "./mindmap_data/rad.js",
  "./mindmap_data/uro.js",
  "./mindmap_data/ortho.js",
  "./mindmap_data/ent.js",
  "./mindmap_data/psy.js",
  "./mindmap_data/derm.js",
  "./mindmap_data/oph.js",
  "./mindmap_data/peds.js",
  "./mindmap_data/obg.js",
  "./mindmap_data/kansen.js",
];
// 新科目追加時は必ずここにも questions_{prefix}.json を追加すること（chapters_meta.js の sid 一覧と一致させる）
const CARDS = [
  "questions_endo.json","questions_resp.json","questions_circ.json","questions_dige.json",
  "questions_neur.json","questions_hbp.json","questions_jinzo_d.json","questions_hema.json",
  "questions_imma.json","questions_kansen.json","questions_jitsu1.json",
  "questions_peds.json","questions_obg.json","questions_psy.json",
  "questions_derm.json","questions_oph.json","questions_ent.json","questions_uro.json","questions_ortho.json","questions_anes.json","questions_rad.json","questions_tox.json"
];

self.addEventListener("install", e => {
  // cache:'reload' で HTTP キャッシュを無視し必ず最新シェルを取得する（deploy 直後、GitHub Pages の
  // max-age 内でもブラウザHTTPキャッシュの旧ファイルを掴まない＝「pushしたのに反映されない」を根絶）。
  // 1ファイル失敗しても install 全体は落とさない。skipWaiting で待機せず即座に新SWへ切替える。
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      SHELL.map(u => fetch(u, { cache: "reload" }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {}))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache API に保存してよいレスポンスか。
// ⚠️ res.ok は 200〜299 で true なので 206 Partial Content も通してしまうが、Cache API は
// 部分レスポンスの保存を仕様で禁じており put() が必ず reject する（"Partial response
// (status code 206) is unsupported"）。効果音の <audio> は Range リクエストを投げるため
// 206 が日常的に返り、catch を付けていないと未処理の promise 拒否がコンソールに出続けて
// 本物のエラーを埋もれさせる。Range 付きリクエスト自体もキャッシュ対象から外す。
function _cacheable(req, res) {
  return res && res.ok && res.status !== 206 && !req.headers.has("range");
}
// put の失敗でレスポンス配送を巻き込まないよう握り潰す（容量超過などでも落とさない）。
function _putSafe(cache, req, res) {
  try { cache.put(req, res).catch(() => {}); } catch (e) {}
}

self.addEventListener("fetch", e => {
  // GET かつ同一オリジンのみ（Gist API 等の POST/PATCH は cache.put が例外を投げる）
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (CARDS.some(c => url.pathname.endsWith(c))) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (_cacheable(e.request, res)) _putSafe(c, e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (_cacheable(e.request, res)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => _putSafe(c, e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
