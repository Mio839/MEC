# MEC 医師国試学習ツール

## 作業スタンス

タスクに取り掛かる前に、必要な情報が不足していると判断した場合は実装を始める前にユーザーに確認を取ること。推測で進めず、曖昧な点は必ず質問する。

## プロジェクト概要

医師国家試験対策の学習ツール。GitHub Pages 経由で iPad・PC・スマホからアクセス。

- **リポジトリ:** GitHub `Mio839/MEC`
- **変更反映:** `git push origin main` で GitHub Pages に自動反映

## 詳細仕様の置き場所（`_work/仕様/`・2026-09-28〜）

CLAUDE.md が 150,000 字の上限を越えたので、領域ごとの詳細を `_work/仕様/` へ**原文のまま**移した。
CLAUDE.md に残してあるのは各領域の不変条件の要約だけで、**その領域のコードやデータを触る前に、該当ファイルを必ず読むこと**。

| ファイル | 中身 |
|---|---|
| `_work/仕様/学習画面とSRS.md` | 章ジャンプ・SRS（自己採点・経過日数・ゆらぎ・試験日ゲート・重複コピー・新規の上限・並び・連問の群）・今日の誤答の再履修・examQueue |
| `_work/仕様/ハブ.md` | ヒーローのボタン・今日の所見・実力の輪郭（8軸レーダー）・円弧ゲージ・全国正答率の索引・デイリー／ウィークリーミッション |
| `_work/仕様/演出.md` | セレモニーとトースト・筐体（Phase 4）・読んでいる間（Phase 5）・スチームパンク（Phase 7）・試験経路の演出・演出の予算・省電力・正解／誤答の演出・演出の死んだコード・試験モードの演出エフェクト仕様（効果音を含む） |
| `_work/仕様/採点データと科目の作り直し.md` | 採点データの不変条件（計算問題・欠落選択肢の復元・表の選択肢・連問カード）・既存科目の HTML を作り直すときの不変条件 |
| `_work/仕様/統計と弱点分析.md` | 弱点分析・stats.html の構成 |
| `_work/仕様/模試.md` | 模試の自己採点・成績カルテ・❌模試誤答フィルタ・模試の解説 |
| `_work/仕様/マインドマップ.md` | 疾患マインドマップ |

⚠️ コードのコメントにある「CLAUDE.md「〇〇」」という参照は、見出しが CLAUDE.md に無ければ `_work/仕様/` の中にある
（見出しは移設時のまま変えていない＝`grep -rn "〇〇" _work/仕様/` で引ける）。
⚠️ **新しい節を足すときも、詳細はここのファイルへ書き、CLAUDE.md には「⚠️ 〜しないこと」の要約とポインタだけを足すこと**
（CLAUDE.md の上限は 150,000 字。`python -c "print(len(open('CLAUDE.md',encoding='utf-8').read()))"` で測れる）。

## ファイル構成

| ファイル/フォルダ | 役割 |
|---|---|
| `study.html` | 統合学習ツール（コア12科目＋マイナー講座・実力試験・自作・フィルター）。試験モードUI等のマークアップ＋インラインJS |
| `study_exam.js` | study.htmlの試験モードロジック（state・効果音・演出エフェクト・SRS採点連携）。classic scriptでインライン<script>より前に読込み、共有グローバルスコープで相互参照 |
| `study.css` | study.html専用のCSS（旧インライン<style>を2026-07-05に外出し）。⚠️ study.htmlはこれに依存＝両方一緒にcommit/push必須 |
| `index.html` | ハブダッシュボード（全科目の進捗表示・ナビ・同期設定）。ヒーローのボタンは**席が固定の3つ**＝主（due>0 なら復習／0なら全科目）・副（due>0 なら全科目／0なら無効の復習）・「🔁 今日の誤答を再履修」。0件の日も席を空けず `.is-off` で無効表示にする。⚠️ **統計への導線をここに置かないこと**（`_work/仕様/ハブ.md`「ヒーローのボタン」）。⚠️ **CSS は `index.css`・JS は `index.js`**（2026-09-28 にインラインから外出し。`index.css` は材料で、ページが読むのは生成物 `theme_css/index.{テーマ}.css`＝下の `ui_theme.css` の行）。テストは `_work/lib_hub_source.js` で元の1枚の形に組み立てて読む |
| `progress.js` | 共有モジュール：localStorage + GitHub Gist 同期。localStorageキーは`K*`定数が正本。**「済」と全問題数の正本**（`MECSync.doneInScope`/`totalInScope`・下記「問題数」） |
| `attempts.js` | 解答イベントログ（`mec_attempts_v1`・`window.MecAttempts`）。1解答=パイプ区切り1行の文字列で上限5000件のリングバッファ（2026-08-06に2000から引き上げ。1日1400解答の日があり2000件では約1.4日分しか持たず「昨日の誤答」がその日のうちに消えた。⚠️`attempts.js`の`CAP`と`progress.js`の`ATT_CAP`は一致必須）。集計値の`myrate_v1`と違い時刻・出題順・所要秒・選んだ肢を残す＝弱点分析の素材。study.html／stats.html／**index.html**が読込み。`todayWrongUids()`は「今日の誤答を再履修」の対象UIDの正本（ハブの件数表示と出題側が同じ関数を使う） |
| `qmeta.json` | 設問メタ（全科目1ファイル・`_work/build_qmeta.py`が生成する**派生物**）。設問形式(診断/検査/治療/対応/知識)・否定形・複数選択・画像・症例・計算・採点除外を自動分類。stats.htmlの弱点カルテが使う。**questions_*.json は一切変更しない**（pdf_audit.pyの監査対象を汚さないため） |
| `dup_index.js` | **同じ国試問題の重複コピーの組**（2026-09-27新設・**派生物**・`node _work/build_dup_index.js`）。国試番号・選択肢の集合・正解がすべて一致する uid の組（443組892問・先頭が代表）。progress.js の `MECSync.srsSiblings`/`srsIsShadow`/`srsUnifyDups` が使う＝**SRS の予定だけ組で共有し、件数・出題は代表だけ**（`_work/仕様/学習画面とSRS.md`「重複コピーと新規の上限」）。study/index/stats が progress.js より**前に**読む。**questions_*.json を変えたら作り直すこと** |
| `hub_opening.js` | **1日の最初のブリーフィング**（2026-09-23新設・`window.MecOpening`）。その日はじめてハブを開いたときに全画面で ①前回のリザルト ②週の結果発表（**その週はじめて開いた日**・ランクS〜C） ③今日のブリーフィング を出す。ヒーローの日付をタップで開き直せる。材料は既存の同期済みデータだけ（fetch を足さない）。⚠️ 前回の結果は「昨日」固定ではなく今日より前の最後の学習日。既視 `mec_hub_opening_v1` は UIローカル。テスト: `node _work/test_hub_opening.js` |
| `hub_liquid.js` | **ハブのヒーローゲージ（UIテーマ Liquid）**（2026-09-29新設・`window.MecLiquidGauge`）。旧 Liquid ゲージ（ラバ・セル・膜のくびれ等）を撤去し、`#gaugeLiquidCanvas` 1枚に塊・漂うかけら・光の網・弧を描く。index.js は `set(pct)` を呼ぶだけ。⚠️ 100% 超でも色を変えない／かけらを周回させない／雫はその場で消さず塊へ吸い込ませる。正本のデモは `_work/gauge_liquid_demo.html`。詳細は `_work/仕様/ハブ.md`「Liquid のゲージ」。テスト: `node _work/test_hub_liquid.js` |
| `trophy.js` | **トロフィー棚**（2026-09-23新設・`window.MecTrophy`・ハブのタイル 🏆）。定着コレクション（科目ごとの宝石）・章メダル（金銀銅＝`gamify.js` の `chapterGrade`＝章の星と同じ式）・科目制覇の👑。**新しいキーを持たず** `mec_srs_v1`/`myrate_v1`/`done_v2` から毎回計算。⚠️ **「定着」＝reps≥3 かつ 間隔≥min(21日, 試験日ゲートの上限)**。固定の「30日以上」にすると試験日ゲートで直前期に誰も届かず宝石が消えていく。study.html の `_updateSRS` が増分を拾い、試験の結果画面で1件の通知にまとめる。index.html と study.html が読む |
| `boss.js` | **ボス戦**（2026-09-23新設・`window.MecBoss`・`study.html?mode=boss`・ハブのタイル ⚔️）。苦手（誤答率・🚩・直近30日の誤答）から決定論で20問を選び、10問で開戦・10問は控え。正解でダメージ（難問18・通常12・3連続ごとに会心×1.5）、**誤答でボスが回復(+8)し控えから1問増援**。体力0で撃破＝その場で結果画面へ。問題が尽きれば撤退。配管は今日の誤答の再履修と同じホスト出題（`_bossMode`・`_isHostSession()` に含まれる）。体力は `_tallyQuestion`（3採点経路の合流点）で動かす。⚠️ こちらの体力・敗北は作らない（ユーザー判断）。戦績 `mec_boss_v1` は UIローカル。テスト: `node _work/test_trophy_boss.js` |
| `ward.js` | **病棟回診**（2026-09-25新設・`window.MecWard`）。**今日の復習（SRS復習）の見せ方**。開始前に「朝の申し送り」（科目＝病棟ごとのベッド・病状 重症/要注意/安定＝期限切れの日数と待たされ具合）→「回診を始める」のタップで `startExam`。画面下の病棟ボード（表示だけ・押せる物は置かない）に診察数と退院（正解）/入院継続（誤答）。転帰は `_tallyQuestion` で記帳、結果画面に病棟別の転帰・重症の退院数・次の外来。⚠️ **確信度の宣言（確実/たぶん/勘）は同日に撤去した**（キー操作が面倒＝ユーザー判断）。戻さないこと。⚠️ SRS復習だけ（今日の誤答・統合カンファレンス・弱点強化・誤答再試験には出さない）。⚠️ 新しい localStorage キーを持たず、SRS の採点も変えない。テスト: `node _work/test_ward.js` |
| `stats.html` | 学習統計ページ（30日チャート・SRS統計・AI相談Markdownエクスポート） |
| `knowledge.html` | 検索知識ノート機能 |
| `mock.html` / `mock.js` / `mock_data/` / `mock_karte.html` | **模試の自己採点**（2026-09-08新設）。`mock.js`＝採点エンジン（`window.MecMock`・UIは式を1つも持たない）／`mock_data/index.js`＝模試レジストリ／`mock_data/{id}.js`＝解答表（**派生物**・`_work/build_mock_m121s.py` が解説書PDFから生成）。記録は `mec_mock_v1`（Gist同期対象）。⚠️ **模試を1つ足す作業＝`mock_data/` にファイルを1つ書いて index.js に1行足すだけ**（エンジンは触らない・`sw.js` の SHELL への追記は必要）。⚠️ `_work/仕様/模試.md`「模試の自己採点」の不変条件を読んでから触ること。`mock_karte.html`＝**成績カルテ**（2026-09-09新設・ハブのタイル 🩺 から開く）。採点は `mock.js` に任せ、集計して並べるだけ＝**式を1つも持たない**。全国正答率の受け口は `mock_data/{id}_rates.js`（`window.MecMockRates`・空でも必ず置く） |
| `夏メック模試/images/` | 第121回 夏メック模試の設問図**138枚**（**派生物**・`_work/mock_pdf.py` が解説書PDFから生成）。ファイル名は `{ブロック}{番号}_{n}.jpeg`（例 `A25_1.jpeg`）で、**連問の兄弟は群の先頭の名前を共有する**。⚠️ **xref をそのまま保存せず、ページを clip して 300dpi で描き直している**（1つの別冊No.が複数パネルの図・ベクター描画の4問を同じ経路で扱うため）。手順と罠は `_work/夏メック模試_引き継ぎ.md` §6-2 が正本。テスト: `node _work/test_mock_figs.js` |
| `questions_m121s.json` ＋ `夏メック模試/images/ex/` | **第121回 夏メック模試の解説400問**（2026-09-09新設・**派生物**）。`_work/build_mock_m121s_json.py` が解説書PDFから生成し、`_work/mock_m121s_overrides.json`（手書き）を最後に重ねる。A〜Fが ch01〜ch06、**番号は科目内で通し**（Q.1〜Q.400・規約②）。紙面の番号は新設バッジ `bb`「A問題 17」で別に出す。`images/ex/` は**画像診断ブロックの注釈付きの図140枚**（設問の図とは別物で、解説ブロックの中に出す）。⚠️ **questions_m121s.json を直接編集しないこと**（再生成で消える）。⚠️ `_work/仕様/模試.md`「模試の解説」の不変条件を読んでから触ること。テスト: `node _work/test_mock_questions.js` |
| `mindmap.html` / `mindmap.js` / `mindmap.css` | 疾患マインドマップ。**1枚のページで科目マップ（`?sid=hema`）とハブ（引数なし＝全科目）の両方を描く**。2026-08-21に、9科目ぶんの自前エンジンを内蔵した `{科目}/mindmap.html` ＋ `mindmap_integrated.html` から移行した（旧ファイルは `_archive/mindmap_src/`・旧URLにはリダイレクトstubを置いてある）。⚠️ `_work/仕様/マインドマップ.md` の不変条件を読んでから触ること |
| `mindmap_data/` | マインドマップのデータ。`index.js`（科目レジストリ。**マップがあるのは `ready:true` の科目だけ**・`gamify.js` の SUBJECTS から `_work/build_mindmap_index.js` が生成する**派生物**）／`{sid}.js`（科目1件ぶんの章・疾患・関連）／`_hub.js`（ハブの代表疾患。科目データの射影**ではなく**独立にキュレーションされたもの）。**新科目のマップを足す作業＝ここにファイルを1つ書くこと**（エンジンは触らない） |
| `calc_input.js` | 計算問題の桁入力エンジン（`window.MecCalc`）。原文がマークシートの計算問題50問（科目33＋過去問17）は選択肢を持たないため試験モードで解答不能だった。正解は `.ac`（ans_label）の `計算答：<桁文字列>` が正本。**study.html と 国家試験過去問/*.html の両方が読む共有ファイル**（演出テーマのようなミラー乖離を作らないため）。CSSは自前で注入する |
| `card_renderer.js` | JSON→カードHTML描画（`window._renderSubjectFromJson`、エスケープ処理あり） |
| `fx_engine.js` | エフェクトのCanvas描画エンジン（`window.MecFX`：粒子・花火・グリフバースト等）。ハブのゲージ用に `gears`／`gearRain`／`steam`（真鍮の歯車・蒸気）を、2026-08-14に `shatter`（破片）／`ribbon`（2点間を走る光）／`stamp`（刻印）／`orbit`（極座標で回る粒）／`wave`（走査する波形）を足した。**エミッタの追加は常に純増で行うこと**——study.html／chapter_exam.js の試験演出が同じエンジンを共用しているので、既存関数の引数や既定値を変えると7テーマ全部に波及する。⚠️ **位置を自前で持つ型（ribbon/wave/stamp/bar/bolt/ring）は `STATIC_TYPES` に登録すること**——登録し忘れると step() の物理を通り、重力で画面外へ落ちて1フレームで消える |
| `sounds/` ＋ `sounds_index.js` | 効果音。実体は `sounds/{正解音,起動音,選択音,結果画面}/` の**4フォルダ**（`結果画面/` は 2026-08-21 に追加）、台帳は `sounds/meta.json`、一覧は `_work/build_sounds_index.js` が生成する `sounds_index.js`（**派生物**・`window.MecSounds`）。**ファイル名・キー・音量の唯一の正本**で、study.html／index.html／chapter_exam.js の3つが全部これを読む。⚠️ 音を足すのは「フォルダに置く→meta.json に1行→生成スクリプト」の3手順でコードは触らない。⚠️ 起動音は設定で選ばせず毎回ランダム（テーマ固有の起動画面＝Frost・Celestial・Liquid では鳴らさない） |
| `image_dims.json` | 問題画像の実寸（パス→[w,h]・約109KB・**派生物**。`_work/build_image_dims.py`が生成）。`card_renderer.js`が`<img width height>`を出す材料。これが無いと遅延読込の画像でレイアウトが後からずれ、章ジャンプが目標に収束しない。**画像を差し替え・追加したら必ず再生成** |
| `sw.js` | Service Worker（オフラインキャッシュ）。`CACHE`版数は**questions_*.json・画像を更新した時にbump**（bumpで全キャッシュ削除＝再DL）。SHELL/CARDSにパス列挙。相対パス必須。⚠️ **変更履歴はここに書かず `_work/sw_changelog.md` の先頭へ**（sw.js はページを開くたびに更新確認で取り直される＝コメントも毎回ダウンロードされる。2026-09-28 に 238KB を移した。`test_theme_css.js` が 20KB を超えたら落ちる） |
| `chapters_meta.js` / `rate_index.js` | 章メタ（`_work/build.py`系で再生成）と**全国正答率の索引**（**派生物**・`node _work/build_natrate_index.js`。uid→% を章ごとの数値列に畳み、読み込み時に `window.MEC_RATE` へ展開する）。索引は stats.html の弱点カルテと index.html の実力レーダーが読む |
| `questions_*.json` | **問題データの正本**。study.htmlはこれを読み込んで表示。⚠️ 2026-07-24に`questions_*.js`（file://フォールバック用の同内容コピー・計約15MB）を廃止した。運用はGitHub Pages一本で、コピーはリポジトリを二重に太らせ更新のたびに再生成が要るだけだったため。`_work/gen_js_from_json.js`・`_work/check_json_js_sync.js`・pre-commitフックの自動生成ステップも同時に撤去済み |
| `国家試験過去問/` | 過去問ビューアHTML（`chapter_exam.js`で試験モード）。PDFは`.gitignore`済み・追跡はhtmlのみ |
| `chapter_exam.js` | 過去問ビューアの試験モード（`CE_EFFECT_THEMES`＝study_exam.jsの演出を同配色でミラー） |
| `内分泌/` `呼吸器/` `循環器/` `消化器/` `神経/` `肝胆膵/` `腎臓/` `血液/` `免アレ膠/` | 各科目のフォルダ（画像・selfcheck_intro.html等）。章別解答解説HTML(ch01.html等)は全科目 `_archive/{科目}/` へ移動済み（2026-07-07完了） |
| `産婦人科/` | 章別HTML(ch01〜ch13)＋`images/`＋`obg_questions.json`（メタ）。HTMLが`questions_obg.json`のソース＝`_work/build_obg_json.py`で再生成 |
| `_archive/` | 到達不能になった旧・章別HTMLの保管先。編集対象外、読み物としてのみ残す |
| `vars.css` | 共通CSSカスタムプロパティ（全ページ共通色変数） |
| `ui_theme.css` / `ui_theme.js` | **UIテーマ（着せ替えスキン）全8種**（aurora／brass／cyber／liquid／kintsugi／celestial／abyss／frost）。`ui_theme.js` が `localStorage['mec_ui_theme_v1']` を読んで `<html>` に `ui-{id}` を付ける＝**必ず1つ適用される**（既定 `aurora`）。テスト: `node _work/test_ui_theme.js`・`node _work/test_theme_css.js`。⚠️ **`ui_theme.css`（と `index.css`）は材料で、ページは直接読まない**（2026-09-28〜）。`node _work/build_theme_css.js` が「ほかの7テーマのルールだけを落とした」生成物 `theme_css/{ui_theme,index}.{テーマ}.css` を作り、6ページ（study/index/stats/knowledge/mock/mock_karte）は元の `<link>` の位置の `<script>MecUITheme.css('ui_theme')</script>` で**使うテーマの1つだけ**を読む（347KB→約50KB）。**材料を直したら必ず生成器を流すこと**（`run_all.js` の `--check` が見張る）。ルールの並びは1つも入れ替えていない（共通のルールは各テーマのファイルに重複して入る）＝カスケードは元の1ファイルと同じ。テーマの切り替えは新しい CSS を読み終えてからクラスを付け替える（`apply`）。⚠️ 生成器は最上位の余った `}` で止まる（ブラウザは次のルールを黙って捨てる。2026-09-28 に frost で1件あった）。⚠️ **全8テーマが `.qc` に `animation: {id}CardEnter … both`（`from{opacity:0}`）と `overflow:hidden` を掛けている**。`.qc` を触るときは Phase 4/5/7 の「`.qc` の層は満杯」「`transform` は既存アニメに黙って殺される」がここと直接ぶつかることを思い出すこと。⚠️ `opacity:0` の backwards fill は**非表示タブではアニメが1frameも進まない**間そのまま残る（stats.html の `armReveal`・マインドマップと同型）。ここはアニメが自分で終わる形なのでタブを表に戻せば自力で復帰するが、**JSでクラスを外す形へ作り変えないこと**（落ちた日にカードが白紙になる）。⚠️ **iOS WebKit では `.qc` の `contain: layout` と `backdrop-filter` は必ず解除すること**（`study.css` 側で上書き）。残すと遅延ロード画像でカード高さが伸びた際に GPU 合成バッファが初期高さで固定され、装飾（`::before`/`::after`）が画像に被る。 |
| `_work/` | ビルド・検証・マージ用スクリプト（`build.py`・`pdf_audit.py`・`build_qmeta.py`・`build_image_dims.py`・`compress_images.py`・`fix_missing_bi_badges.py`・各`test_*.js`等）。⚠️**PDFから新科目の章別HTMLを作るときは先に `_work/新科目HTML生成ガイド.md` を読む**（抽出フロー・産婦人科水準の解説品質基準・統合チェックリスト・着手プロンプト。参照実装は精神科psy=`build_psy_ch01.py`／`build_psy_json.py`） |
| `精神科/` | マイナー講座・精神科（prefix `psy`・💭・#7386F2）。章別HTML(`ch01_seishinka_kihon.html`〜`ch08_sonota.html`)＋`images/`＋`psy_questions.json`（章名メタ）。HTMLが`questions_psy.json`のソース＝`_work/build_psy_ch{NN}.py`→`_work/build_psy_json.py`で再生成。**全8章256問**。⚠️ **この科目の章を書く・直すときは `_work/精神科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・採点除外はそこが正本） |
| `耳鼻咽喉科/` | マイナー講座・耳鼻咽喉科（prefix `ent`・👂・#549C93）。章別HTML(`ch01_mimi_kihon.html`〜)＋`images/`＋`ent_questions.json`（章名メタ）。HTMLが`questions_ent.json`のソース＝`_work/build_ent_ch{NN}.py`→`_work/build_ent_json.py`で再生成。**全8章214問**。抽出・照合は `_work/ent_pdf.py`／`_work/verify_ent_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/耳鼻咽喉科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・採点除外はそこが正本） |
| `泌尿器科/` | マイナー講座・泌尿器科（prefix `uro`・💦・#0F9CC0）。章別HTML(`ch01_hinyokika_kihon.html`〜)＋`images/`＋`uro_questions.json`（章名メタ）。HTMLが`questions_uro.json`のソース＝`_work/build_uro_ch{NN}.py`→`_work/build_uro_json.py`で再生成。**全6章242問**。抽出・照合は `_work/uro_pdf.py`／`_work/verify_uro_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/泌尿器科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・採点除外はそこが正本） |
| `整形外科/` | マイナー講座・整形外科（prefix `ortho`・🦴・#C57E3A）。章別HTML(`ch01_seikeigeka_kihon.html`〜)＋`images/`＋`ortho_questions.json`（章名メタ）。HTMLが`questions_ortho.json`のソース＝`_work/build_ortho_ch{NN}.py`→`_work/build_ortho_json.py`で再生成。**全6章174問**。抽出・照合は `_work/ortho_pdf.py`／`_work/verify_ortho_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/整形外科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・採点除外はそこが正本） |
| `麻酔科/` | マイナー講座・麻酔科（prefix `anes`・💉・#A373FE）。章別HTML(`ch01_shujutsuki.html`〜)＋`images/`＋`anes_questions.json`（章名メタ）。HTMLが`questions_anes.json`のソース＝`_work/build_anes_ch{NN}.py`→`_work/build_anes_json.py`で再生成。**全2章52問＝マイナー講座で最小**。抽出・照合は `_work/anes_pdf.py`／`_work/verify_anes_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/麻酔科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・採点除外はそこが正本） |
| `放射線科/` | マイナー講座・放射線科（prefix `rad`・☢️・#8790A9）。章別HTML(`ch01_josho.html`〜)＋`images/`＋`rad_questions.json`（章名メタ）。HTMLが`questions_rad.json`のソース＝`_work/build_rad_ch{NN}.py`→`_work/build_rad_json.py`で再生成。**全4章60問**。⚠️ **この科目だけPDFが2冊**（問題41p＋レジュメ43p）で**レジュメが解説の正本**。抽出・照合は `_work/rad_pdf.py`／`_work/verify_rad_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/放射線科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・分割生成器はそこが正本） |
| `中毒・職業病/` | **マイナー講座ではなく横断テーマ**（prefix `tox`・☠️・#65A30D）。章別HTML(`ch01_kinzoku_chudoku.html`〜`ch07_butsuriteki_shikkan.html`)＋`tox_questions.json`（章名メタ）。HTMLが`questions_tox.json`のソース＝`_work/build_tox_ch{NN}.py`→`_work/build_tox_json.py`で再生成。**全7章48問・画像0枚**。⚠️ **版面が他科目と違う**（レジュメと問題が交互に並ぶ／解答表に★列・CBT列が無い）。抽出・照合は `_work/tox_pdf.py`／`_work/verify_tox_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/中毒・職業病_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問はそこが正本） |
| `救急/` | **マイナー講座ではなく横断テーマ**（prefix `emg`・🚑・#FF8A5B）。章別HTML(`ch01_shoshin_gairai.html`〜`ch07_120kai_kyukyu.html`)＋`images/`＋`emg_questions.json`（章名メタ）。HTMLが`questions_emg.json`のソース＝`_work/build_emg_ch{NN}.py`→`_work/build_emg_json.py`→`_work/sync_emg_counts.py`で再生成。**全7章68問**。⚠️ **描画コードの正本は `_work/emg_render.py` 1本**（章ファイルへ丸写ししていない）。抽出・照合は `_work/emg_pdf.py`／`_work/verify_emg_ch.py`。⚠️ **この科目の章を書く・直すときは `_work/救急_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問はそこが正本） |
| `公衆衛生/` | **マイナー講座ではなく独立した公衆衛生講座**（prefix `ph`・🏛・#3097CE）。章別HTML(`ch01_ishihou_to_iryouhou.html`〜`ch19_sonota_kihonjikou.html`)＋`ph_questions.json`（全19章の章名メタ）。HTMLが`questions_ph.json`のソース＝`_work/build_ph_ch{NN}.py`→`_work/build_ph_json.py`で再生成。**全19章619問が完成**（2026-08-28）。⚠️ **この科目もPDFが2冊**（問題283p＋レジュメ96p）で**レジュメが解説の正本**。抽出・照合は `_work/ph_pdf.py`／`_work/verify_ph_ch.py`。章ごとの軸・罠・座標の台帳は `_work/公衆衛生_引き継ぎ.md`（作業手順そのものは `_work/公衆衛生_章作業手順.md` に残してある——将来この科目に手を入れる際の参照実装として） |
| `眼科/` | マイナー講座・眼科（prefix `oph`・👁️・#5197B7）。章別HTML(`ch01_ganka_kihon.html`〜)＋`images/`＋`oph_questions.json`（章名メタ）。HTMLが`questions_oph.json`のソース＝`_work/build_oph_ch{NN}.py`→`_work/build_oph_json.py`で再生成。**全8章213問**。抽出・照合は `_work/oph_pdf.py`／`_work/verify_oph_ch.py`（⚠️ 後者は長く**0バイト**で存在しないのと同じだった。2026-08-26に ent 版から復元＝全8章213問 errors=0。**`--dis` で解答一覧表の「疾患名」列を出せる**＝眼底写真の読みを裏取りする正本）。⚠️ **この科目の章を書く・直すときは `_work/眼科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・最難問・図が選択肢の問題はそこが正本） |
| `皮膚科/` | マイナー講座・皮膚科（prefix `derm`・🩹・#BF7F60）。章別HTML(`ch01_hifuka_kihon.html`〜)＋`images/`＋`derm_questions.json`（章名メタ）。HTMLが`questions_derm.json`のソース＝`_work/build_derm_ch{NN}.py`→`_work/build_derm_json.py`で再生成。**全9章249問**（画像問題が主体・PDF全体で埋め込みJPEG204枚）。⚠️ **この科目の章を書く・直すときは `_work/皮膚科_引き継ぎ.md` を読む**（章の軸・PDF固有の罠・章頭NO.はそこが正本） |
| `必修講座/` ＋ `questions_hisshu.json` | **必修講座**（prefix `hisshu`・🏅・#D4AF37・2026-09-11新設）。`MEC必修講座Part1（表紙2026）.pdf` の全17章327問。**章別HTMLは無く、`_work/build_hisshu_json.py` がPDFから直接JSONを作る**（`_work/hisshu_pdf.py anstable`→`parse`→生成器。`images/` は `--figs`・20枚）。**解説はPDFに無いので書いていない**——同じ国試問題が既存の科目・過去問ビューアにある213問は生成時にその解説と正答率を**借用**し、残り114問は解説なし。⚠️ **questions_hisshu.json を直接編集しないこと**（派生物）。後から足す解説は `_work/hisshu_overrides.json`（uid キー）へ。Part2 は別科目 `hisshu2`（下の行）。⚠️ **この科目に手を入れるときは `_work/必修講座_引き継ぎ.md` を読む** |
| `必修講座Part2/` ＋ `questions_hisshu2.json` | **必修講座Part2**（prefix `hisshu2`・🎖️・#B8A14A・2026-09-27新設・**Part1 とは別科目**）。`MEC必修講座Part2（表紙2026）.pdf` の A/B/C問題 各60問＝180問（章＝ブロック・表示番号は通し Q.1〜180・紙面番号はバッジ `bb`）。章別HTMLは無く `_work/hisshu2_pdf.py anstable`→`parse`→`_work/build_hisshu2_json.py` で PDF から直接作る（`images/` は `--figs`・27枚）。**解説は書いていない**——同じ国試問題が既存科目・過去問ビューアにある134問だけ借用。⚠️ **MEC が選択肢の並びを入れ替えている**（117問）ので、並びは紙面どおりに保ち、借りた解説の先頭に記号の対応表を置く。⚠️ questions_hisshu2.json は派生物（手書きは `_work/hisshu2_overrides.json`）。⚠️ **この科目に手を入れるときは `_work/必修講座Part2_引き継ぎ.md` を読む** |
| `サマライズ呼吸器/` ＋ `questions_sumresp.json` | **サマライズ呼吸器**（prefix `sumresp`・🫁・#4FB0D8・2026-09-29新設）。`国試サマライズ・メジャー・呼吸器（表紙2026）.pdf` の8章39問（Q.1〜39＝紙面の NO.）＋ `2026Lesson呼吸器.pdf` の19問（ch09・Q.40〜58・紙面の「問題N」はバッジ `bb`）。章別HTMLは無く `_work/sumresp_pdf.py parse`→`_work/build_sumresp_json.py`（`images/` は `--figs`・34枚）。**解説はテキストの引用＋1行の理由だけ**（ユーザー指定）＝手書きの材料は `_work/sumresp_notes.json`。⚠️ questions_sumresp.json は派生物。⚠️ **この科目に手を入れるときは `_work/サマライズ呼吸器_引き継ぎ.md` を読む** |

⚠️ **科目フォルダの行には「何のフォルダで、どう再生成するか」だけを書く。**
章の軸・PDF固有の罠・最難問・採点除外・図の抽出順といった**章単位の作業ノートは `_work/{科目名}_引き継ぎ.md` が正本**で、2026-08-26 に全10科目ぶんをこの表から移した（CLAUDE.md 全体で約135,000字 → 約88,000字）。表のセルに書くと、**二度と書かない完成科目のぶんまで毎セッション読み込まれる**うえ、セル内改行で表そのものが Markdown として壊れる。**新しい科目を足すときも同じ形にすること。**

## 問題数

⚠️ **ここに数字の表を置かないこと。** 章を足すたびに変わる数字を文書へ手で書くと必ず腐る——
2026-08-26 まで `ph` の行が `5章155問` のまま残っており、実際は `7章226問`（2章71問ぶんのずれ）だった。
**正本は `questions_*.json` だけ**で、実測はいつでもこれで出る:

```bash
node _work/test_subject_totals.js --table   # 区分別の一覧＋総合計＋コア12科目の合計
```

区分（ここは章を足しても変わらない）:

| 区分 | prefix |
|---|---|
| コア12科目 | `endo` `resp` `circ` `dige` `neur` `hbp` `jinzo_d` `hema` `imma` `kansen` `peds` `obg` |
| マイナー講座8科目 | `psy` `derm` `oph` `ent` `uro` `ortho` `anes` `rad`（**全科目完成済み**） |
| 横断テーマ | `tox` `emg`（マイナー講座ではない・版面が違う） |
| 公衆衛生講座 | `ph`（マイナー講座ではない・**全19章619問が完成**） |
| 必修講座 | `hisshu` `hisshu2`（Part1・Part2 は別科目。解説は既存科目からの借用＋手書きの上書きだけ） |
| サマライズ | `sumresp`（サマライズ呼吸器＋Lesson 呼吸器。解説はテキストの引用だけ） |
| 模試 | `m121s`（第121回 夏メック模試・A〜F の6章400問）。⚠️ **模試は回ごとに1科目**（`m122w` 等）＝進捗と弱点が回ごとに独立して見える |
| 非コア | `jitsu1`（実力試験Ⅰ）・`custom`（自作）・`memo`（暗記メモ） |

⚠️ **章を足したら `gamify.js` の `total`・`chapters_meta.js`・`study.html` の `subj-hdr-count` を
実数へ更新し、`node _work/test_subject_totals.js` を通すこと。** テストが守るのは**この3者の一致だけ**で、
文書に書いた数字は誰も守らない（だからここに書かない）。

### 「済」と「全問題数」は1か所で数える（2026-09-11〜）

**正本は `progress.js` の `MECSync.doneInScope()` / `totalInScope()` / `isDoneInScope(uid)`**。
ハブ「済 累計」・統合学習ツールのヘッダー「済／合計」とタイトル・学習統計「済み」・Lvパネル「済 N問」は全部これを読む。

| | 数え方 |
|---|---|
| 済 | `done_v2` のうち **自作問題(`custom_`)・暗記メモ(`memo_`) を除いた**もの（周回数0も除く） |
| 全問題数 | `chapters_meta.js` の全章 ＋ 国試過去問（`MEC_KAKUMON_BLOCKS`）＋ 実力試験Ⅰ（`MEC_JITSU1_CHAPTERS`） |

- ⚠️ **ページ側で `done_v2` のキー数を数え直さないこと。** 2026-09-11 まで4か所が別々に数えていて
  （全キー／自作・暗記メモを除く／周回数0を除く）、ハブと統合学習ツールの「済」が一致しなかった。
  しかも統合学習ツールの「済」は**開いた瞬間に1回数えるだけ**で、×△○や試験モードで解いても増えなかった。
- ⚠️ 過去問・実力試験Ⅰの問題数の表は `progress.js` に移した（index.html は `window.MEC_KAKUMON_BLOCKS` を読むだけ）。
  `test_done_scope.js` が表と `国家試験過去問/*.html` の `data-uid` 件数の一致を見張る。
- ⚠️ 統合学習ツールの「済」は `window.mecMarkStale` 経由で追従する。**`done_v2` を書く経路を足したら
  `mecMarkStale()` を呼ぶこと**（現状は `mecIncrLap`・`mecUndoLap`・`_markExamDone` の3つ＋同期完了・他タブ）。
- ⚠️ Lvパネルで揃えたのは「済 N問」と実績の件数だけ。**XP の材料 `laps` は自作・暗記メモも含めたまま**
  （範囲を狭めるとレベルが下がるため）。
- 統合学習ツールのタイトル・ヘッダーの「合計」は、以前はコア12科目の固定値「5487問」だった。
  2026-09-11 にユーザーの判断でハブと同じ全問題数（JS で計算）へ変えた。

各科目がいつどの章を追加したかの経緯は `_work/{科目名}_引き継ぎ.md` にある。

## localStorage キー（全ページ共通）

**正本は `progress.js` 冒頭の `K*` 定数**（`KD`/`KF`/`KA`/`KR`/`KT`/`KE`/`KDT`/`K_SRS`/`KRT`/`KER`/`K_TOKEN`/`K_GIST` 等）。同期対象キーの追加・変更時はここと `_mergeRemote`（progress.js）・`pushToGist`のpayload・`index.html`の復元パスを揃えること。主要キー:

- `done_v2` — UID → 周回数（整数、0=未済）／ `done_tombstones_v1` — undo削除の墓標（同期で復活防止）
- `flag_v2` — 苦手UID → 設定時刻ms（旧データは1）／ `flag_tombstones_v1` — 旗解除の墓標（uid→解除時刻ms、マージは旗vs墓標の新しい方が勝つ）
- `mec_choice_v1` — UID → 選択肢別の誤答回数＋`_last`（最後に選んだ肢）。同期対象（回数はmax、`_last`はローカル優先）
- `activity_v1` — YYYY-MM-DD → 操作回数（連続日数🔥と30日間の学習記録の算出元）。**書き込み口は `logActivity()` の1本だけ**。通常モードは`mecIncrLap`、試験モード／SRS復習は`_markExamDone`（study_exam.js）から`window.mecLogActivity()`を呼ぶ。done_v2を直接書く新経路を足すときはここも通すこと（通し忘れるとその日が学習日として残らない）
- `myrate_v1` — UID → `{correct,total}`（試験モードの自己正答率。マージは各フィールドmax）
- `studytime_v1` — YYYY-MM-DD → 学習分数
- `mec_srs_v1` — SRS復習スケジュール ／ `mec_exam_resumes_v1` — 試験中断の再開データ ／ `mec_ch_exam_v1` — 章別試験履歴
- `mec_attempts_v1` — 解答イベントログ（attempts.js）。`"uid|t|c|o|s|m|sess|n[|r]"` の文字列配列・上限5000件（9番目 `r`＝全国正答率は任意・2026-09-28〜）。追記専用なので同期は`sess+n`をキーにしたunion＋時刻昇順ソート
- `mec_attempts_roll_v1` — 生ログの上限から**あふれた行をセッション単位に畳んだ集計**（2026-09-28〜・同期対象・Gist では `mec_attempts.json` に同居）。`{sess:{u,br,tr,l,d:{日:{sid:[解答,正解,難問,難問の正解]}}}}`。**試験日まで1件も捨てない**。規則の正本は `progress.js` の `attCompact`／`attMerge`／`attStore`（下記「解答ログの集計」）
- `mec_weekly_v1` — **週ごとの弱点の推移**（2026-09-29〜・同期対象・Gist では `mec_weekly.json`）。解答のたびに克服／忘却／取りこぼし／再発を判定して週×端末ごとに貯める。書き口は `MecAttempts.log` → `MECSync.weekRecord` の1本だけ（詳細は `_work/仕様/統計と弱点分析.md`「週ごとの弱点の推移」）
- `mec_mock_v1` — 模試の自己採点（mock.js）。`{examId:{cur,rounds:{rN:{started,graded,ans:{"A10":{p,t}}}},border}}`。**保存されるのは「何を選んだか」だけで正誤は入っていない**（正誤は解答表と突き合わせて毎回計算する）。マージは1問ごとの last-writer-wins（各エントリが時刻 `t` を持つ）
- `error_reports_v1` — 問題エラー報告。1件＝`{uid, type, reported_at}`。**自由記述コメントも同じ配列に `type:'note'` の1レコードとして入る**（`text` を持つ・下記「エラー報告」） ／ `mec_err_cleared_at` — 一括消去のタイムスタンプ
- `mec_gist_token` — GitHub PAT（gistスコープ）／ `mec_gist_id` — Gist ID ／ `mec_last_sync_v1` — 最終同期時刻
- 演出のUIローカル（非同期・**同期対象に足さない**）: `mec_hub_opening_v1`（ブリーフィングの既視 `{day, week}`）／`mec_boss_v1`（ボス戦の戦績）
- UIローカル設定（非同期）: `mec_subjects_v1`（選択科目）/`mec_filter_v1`/`mec_state_v1`/`mec_correct_sound_v1`/`mec_select_sound_v1`/`mec_boot_sound_v1` 等

## UID フォーマット

- 各科目解説: `{prefix}_ch{nn}_q{n}` 例: `endo_ch01_q1`, `resp_ch02_q3`, `jinzo_d_ch03_q136`
- 科目prefix（全30）: `endo` / `resp` / `circ` / `dige` / `neur` / `hbp` / `jinzo_d` / `hema` / `imma` / `kansen` / `peds` / `obg` / `psy` / `derm` / `oph` / `ent` / `uro` / `ortho` / `anes` / `rad` / `tox` / `emg` / `ph` / `hisshu` / `hisshu2` / `sumresp` / `m121s` / `jitsu1` / `custom` / `memo`

### ⚠️ 問題番号は科目内の通し番号（章ごとにQ.1へ振り直さない）

`{prefix}_ch{nn}_q{n}` の `{n}` と、カードに表示される `Q.{n}` は **科目内で通し**。
章が変わっても続きから振る（産婦人科: ch01=Q.1〜26／ch02=<b>Q.27</b>〜85／ch03=Q.86〜145…）。
これは講座PDFの `NO.` と一致し、`_work/build_{sid}_json.py` が `id="qN"` からuidを作るので
**表示番号とuidの番号は常に同じ**になる。

- 根拠: `jumpToQnum`（study.html）は `.qn` のテキストで探し、コメントにも
  「Q番号は科目ごとの連番」とある。章ごとに振り直すと**同じ科目内にQ.1が複数できてジャンプが壊れる**。
- 2026-07-28に精神科(psy)がこれに違反していた（ch01〜ch04が全部Q.1始まり）ので、
  PDF巻末の解答一覧表と全問を突き合わせて是正した。psyの章頭NO.は
  1／74／99／140／176／194／219／243（全8章・最終NO.256）。
- 生成器は各 `_work/build_psy_ch{NN}.py` の **`Q_START` 定数**が章頭のNO.を持ち、
  カード番号は `Q_START + idx`、セクション見出しの「Q.a〜Q.b」も自動計算する。
  新章を足すときは `Q_START` を前章の最終NO.+1 にする。
- ⚠️ 振り直しを是正するとuidが変わる（psy ch02〜ch04がそうだった）。
  **旧uidに紐づくlocalStorageの進捗（done_v2・SRS・myrate等）は引き継がれない**ので、
  是正するなら早い段階で行う。

## UI 構造（study.html・各章共通）

### フィルター（2行）
- 行1（難易度）: 全問 / 難問(<60%) / 標準(60-80%) / 易問(≥80%) / 正答率なし / ★問題 / 🖼️画像
- 行2（状態）: すべて / 🚩赤旗 / 🎯苦手（学習統計の弱点リストと同じ判定・`?state=weak`）

### カード内ボタン
- `🚩` 赤旗ボタン（`mecToggleFlag`）
- 自己採点 `×` `△` `○`（`mecIncrLap`・キーボード `1` `2` `3`／`Enter`=○）:
  3つとも `data-action="lap"` で、違いは `data-grade`（`ng`/`mid`/`ok`）だけ。
  どれを押しても周回数 +1・学習日の記録・次カードへのスクロールは共通で、
  変わるのは SRS へ渡す自己申告のみ（[SRSの自己採点]参照）。
  周回数と緑の塗りは常に `○`（`.mec-lap-btn`）が持つ。
  ⚠️ `.mec-lap-btn` というクラス名は変えないこと。`study_exam.js`・`progress.js`・
  キーボード操作・旧`selfcheck_intro.html`がこの名前で掴んでいる。

### 章ジャンプ・SRS（詳細 → `_work/仕様/学習画面とSRS.md`）

章ジャンプ（`_jumpScrollToEl`）・SRS（`_updateSRS`・復習キュー）を触る前に必ず読むこと。要点:

- ジャンプ・ヘッダ・`.qc` の高さを触ったら `python _work/test_jumps_browser.py`（node のテストでは再現しない）。
  ⚠️ `html.mec-jumping .qc` で `contain-intrinsic-block-size:none` にしない／検索欄の Enter は `stopPropagation`／
  検索欄と章の選択欄を `.filter-row` に戻さない（`.find-row`）／試験中はヘッダの高さを変えない。
- 自己採点: `ok`＝ef+0.1・間隔 1→6→前回×ef／`mid`＝ef 据え置き・1→3→前回×max(1.15, ef-0.6)／`ng`＝ef-0.2・1日へ戻し reps=0。
  間隔上限90日・ef 上限2.5。⚠️ 採点除外は `mecOnLapSRS` でも弾く。
- 間隔の伸びは経過日数で按分（`ratio = 経過日数 / 予定間隔`）。⚠️ `ng` は割り引かない。`lastSeen` の無い旧データは ratio=1。
- ゆらぎ `_srsFuzz`（±5%）は uid と間隔だけから決まる。⚠️ 乱数を使わない（端末ごとに予定日が揺れる）。当てるのは伸びた回と上限で切られた回だけ。
- 試験日ゲート `_srsExamCap`: `interval ≤ floor(残り日数 × SRS_EXAM_FRACTION(=0.8))`。⚠️ `_srsFuzz` より前に掛ける。
  試験日の正本は `MECSync.examDate()`、書くのは `setExamDate` / `clearExamDate` だけ（同期は時刻の新しい方が勝つ）。`trophy.js` に写しがある。
- 重複コピー（`dup_index.js`）は SRS の予定だけを組で共有し、件数と出題は代表だけ。⚠️ due を数える経路を足したら `MECSync.srsIsShadow(uid)` で影を外す。
  新規の上限は `MECSync.srsNewBudget()` が正本（定数をページ側に書き写さない）。
- 復習キューの並びは `_srsUrgency` の降順。出題順は `_srsInterleave`（uid と日付のハッシュ・乱数禁止・ホストの DOM 順も並べ替える）。
  交ぜる単位は連問の群（群の中は章→番号の昇順に固定・番号による同定は同じ章の中だけ）。
- テスト: `node _work/test_srs_grade.js`・`node _work/test_srs_dups_newcap.js`。

## セレモニーとトースト（詳細 → `_work/仕様/演出.md`）

- `gamify.js` の全画面セレモニーとトーストは **1本の列 `_annQ`** で1つずつ再生する。⚠️ 2列に戻さない／`ceremony()` に上書き実装を戻さない。
  音（`opts.snd`・`toast()` の第4引数）は積んだ瞬間ではなく、実際に出る瞬間に鳴らす。
- 試験中（`_fxHeld()`）は溜めておき、`onExamFinish` の静粛時間 `CER_SETTLE_MS` の後、結果画面で再生する。
  ⚠️ `_afterEvent` に `if (examMode) return;` を足さない（記帳まで止まり、上がったレベルが祝われなくなる）。
- 獲得は授与トレイ（`#gmTrayMount`・study.html の結果画面にだけ置く）に先に並べる。タップで次へ、「まとめて受け取る」で残りを打ち切る。
- ACHIEVEMENTS の意匠は UIテーマごと（`ACH_THEME` ＋ CSS）。テーマを増やしたら両方に足す。CSS 変数は `--ach-` 接頭辞。
- テスト: `test_gamify_ceremony.js`・`test_ach_theme.js`。

## デイリー／ウィークリーミッション（詳細 → `_work/仕様/ハブ.md`）

- 定義は `gamify.js` の `MISSIONS_DAILY` / `MISSIONS_WEEKLY`、進捗は `mec_missions_v1` の端末別カウンタ（表示と判定は端末横断の合計）。
- `MISSION COMPLETE` の判定は `tier:'core'` だけ。core に置くのは「手を動かせば必ず届く」ものだけ（運や在庫に左右されるものは bonus）。
  ⚠️ `day` を core に置かない。`subj` を週次に使わない。章の「制覇」を週次の材料にしない。
- 期間キーは `'d:'+日付` / `'w:'+週キー`。達成ボーナス XP は台帳 `(期間キー, missionId)` で持つ（二重加算の防止）。
  ⚠️ `MISSION_XP_KEEP_DAYS` は gamify.js と progress.js の両方にある。片方だけ変えない。
- `FOCUS_AXES` は index.html の `RADAR_AXES` と一致させる。テスト: `test_missions.js`。

## ハブ（index.html）（詳細 → `_work/仕様/ハブ.md`）

ヒーローのボタン・今日の所見・実力の輪郭（8軸レーダー）・円弧ゲージ・全国正答率の索引。ハブを触る前に読むこと。要点:

- ヒーローのボタンは **席が固定の3つ**（主・副は due の有無で中身が入れ替わる・3つ目＝今日の誤答）。0件の日も `.is-off` で残し、href を外す。
  ⚠️ 統計への導線をこの3席に置かない。粒子の色は席ではなく中身（`data-fx`）で決める。
- 文言を入れる口は `_setCtaLabel()` だけ。ボタン用の CSS 変数は `--cta-` 接頭辞必須（vars.css のトークンを継承で拾う）。
  `.cta-sub` の `overflow:hidden` は `min-width:min-content` とセット。要素1つにつき層は3つ（本体＝入場／`::before`＝呼吸／`::after`＝光沢）。
- rAF で数字を動かすなら `setTimeout(finish, dur+400)` の落とし所を必ず添える（非表示タブでは rAF が来ない）。
  常時演出のタイマーは、段が変わらない限り張り替えない（同期完了のたびに `renderHero()` が走る）。日付は JST で切る。
- 今日の所見: ルールごとに最低件数を置く／選抜は決定論（乱数禁止）／`mec_hub_notes_v1` は同期しない／
  追加のファイル読み込みを増やさない（`qmeta.json` と模試の解答表を持ち込まない）。⚠️ 六角レーダー（旧「臨床スキルプロファイル」）を戻さない。
- 実力の輪郭: 自分と**同じ uid の全国正答率**の二重ポリゴン（色は青＝上回り／琥珀＝下回り）。未測定の軸を0に落とさない。
  科目を足したら `RADAR_AXES` にも入れる。`mec_radar_snap_v1` は同期しない。中身が同じなら描き直さない。
- ゲージ＝今日の目標: 分子・分母は `MecGamify.dailyGoal()` が正本。100% で頭打ちにしない。歯車の寸法と viewBox はテストが守る。
  速さは `--gear-t` 1本だけで動かす。祝砲は段が上がったときだけ。
- `rate_index.js` は派生物（`node _work/build_natrate_index.js`）。公開する形は `window.MEC_RATE` のまま変えない。questions_*.json を更新したら作り直す。
- テスト: `test_hero_cta.js`・`test_hub_notes.js`・`test_hub_radar.js`・`test_daily_goal.js`・`test_hub_fx.js`。

## 今日の誤答を再履修（詳細 → `_work/仕様/学習画面とSRS.md`）

- 対象 UID の正本は `MecAttempts.todayWrongUids()`（ハブの件数表示と出題側が同じ関数を呼ぶ）。1セッション50問で、どこまで出したかは `_todayWrongDone` が持つ。
- 配管の分岐は `_isHostSession()` で書く。⚠️ `_srsReviewMode` と `_todayWrongMode` を混ぜない（ミッションの `srs`・attempts の `m`・続きの数え方・結果画面のタイトルが壊れる）。
  `_srsUnloadedForReview` は代入で上書きせず `||` で足す。

## 試験モードの出題範囲は examQueue が権威（詳細 → `_work/仕様/学習画面とSRS.md`）

- 所属判定は `_examHas(card)` だけで行う。`examQueue` を差し替えたら `_examSyncQueue()` を呼ぶ。
  ⚠️ 「次の問題」「クリック可否」「採点可否」を DOM の全走査で決めない。開始後に DOM へ足されたカードにも関所を貼り直す（`_applyJson`）。
- 選択肢の click リスナーは `_bindExamChoices` / `_examChoiceClick` の1組だけ（名前付き関数で渡す）。⚠️ `exitExam` で `dataset.examInit` を消さない。
- テスト: `test_exam_queue_scope.js`。

## 採点データの不変条件（詳細 → `_work/仕様/採点データと科目の作り直し.md`）

問題データ（questions_*.json・過去問 HTML）を直す前に必ず読むこと。要点:

- 必要選択数は **`.ch2.ok` の個数**で決まる。`ok` が1つも無い問題は何を選んでも不正解になる（例外は出ない）。
  選択肢は a, b, c… と1つずつ独立した要素にする。`ok` の個数は設問文の「Nつ選べ」と一致させる。
- 📷バッジ（`bi`）と `imgs` の有無は必ず一致させる。`N択` バッジは PDF の `↗N` の誤読だったことがある＝正解数の根拠は「Nつ選べ」だけ。
- 連問の図は「そのステムを表示する兄弟全員」に付ける（2026-09-06〜）。帰属は図ラベルの座標で決める（読み順とは限らない）。
- 選択肢を持たない問題は計算問題だけ（`ans_label` は `計算答：<桁文字列>` の正規形。数値化しない・カンマ形式に戻さない）。
  ⚠️ 5択決め打ちのコードを書かない（6〜9択が実在）。
- MEC の ○/× は「正解の印」ではない（否定形の設問では × の肢が正解）。
- 表や図が選択肢の問題は、PDF を 300dpi で描画して目視で書き起こし、列見出しを各肢に埋め込む。表を直したら `ans_label` も作り直す。
- 検査は `python _work/pdf_audit.py {sid}`。

## 解答ログの集計（`mec_attempts_roll_v1`・2026-09-28〜）

生ログ `mec_attempts_v1` は上限5,000件で、1日1,400問解く日があるので**3〜4日分しか残らない**。
そのため「週の結果発表」（今週と先週）と「今日の所見」（直近14日の比較）が、よく解いた週ほど古い日を
黙って取りこぼしていた。上限からあふれた行は**捨てずにセッション単位の集計へ畳む**。
テスト: `node _work/test_attempts_roll.js`。

- ⚠️ **生ログを書く経路は全部 `MECSync.attStore` を通すこと**（attempts.js の追記・`_mergeRemote`・
  ハブのバックアップ復元・容量超過の処理）。`slice(-N)` で切り詰める書き方を足すと、そこで行が消える。
  旧実装はバックアップ復元だけ上限 2000 のまま取り残されていた。
- ⚠️ **二重に数えない約束は2つ**：① 1つのセッションは1台の端末でしか生まれないので、同じ sess なら
  ウォーターマーク `u` の大きい集計が必ず上位集合＝マージは `u` の大きい方を採る
  ② 生ログ側は「sess が一致し n ≤ u の行」を必ず落とす。畳む単位は**同じ sess の n ≤ u 全部**
  （時刻は分単位なので、同じ分の行を途中で切ると①が崩れる）。
- 集計に入るのは**解答数・正解数・難問・最長連続だけ**。所要秒・時刻帯・前半後半・解き直しは
  生ログからしか出せない＝「今日の所見」のその4つは生ログに残る数日分で判定する。
- 難問の判定は行の9番目（全国正答率）→ `window.MEC_RATE` の順。**study.html は rate_index.js を
  読まない**ので、行に持たせておかないと畳んだ時点で難問が数えられない。
- ⚠️ **期間の集計を出す側は `MecAttempts.all()` と `MecAttempts.roll()` の両方を読むこと**
  （現在: `hub_opening.js` の `attemptStats`、index.html の `_noteFacts`）。
- 読む側の科目の切り出しは `MECSync.attSid`（index.html の `_noteSid` と同じ規則）。

## 弱点分析・学習統計（詳細 → `_work/仕様/統計と弱点分析.md`）

stats.html と弱点分析を触る前に読むこと。要点:

- 方針は「事実の抽出は JS、解釈だけ AI」。⚠️ AI に問題文・解説の全文を送らない（MEC 教材の著作物）。
- 正誤が残るのは試験モード・SRS・章別試験だけ。カルテの数字は**同じ uid の全国正答率との差（pt）**。
  ⚠️ 科目平均どうしを引かない（📐「本番との差」の `renderGap()` を作り直さない）。
- 苦手の判定式の正本は `MECSync.weakTags(entry, nat)`。stats.html / study.html に書き直さない。
- 判定と描画を分けたまま置く（`weakUnified` / `hmStat` / `wkPicks`・テストが関数を直接 eval する）。`HM_MIN_N` / `WK_GAP_PT` / `WK_LIMIT` は名前付きの定数のまま。
- セクションをデータの有無で `display:none` から出し入れしない（中身だけ空の状態に差し替える）。裏のタブの canvas はタブを開いたときに描き直す。
- 演出は `html.fx-on` の下にだけ書く。CSS だけで本文を隠さない。rAF には `setTimeout` の落とし所を添える。
- **📅 週ごとの弱点の推移**（弱点分析タブの先頭・ハブの先週の結果発表・AI相談）：判定 `weekClassify`・集計 `weekReport` の正本は progress.js。
  ⚠️ 記帳を採点経路に足さない（`MecAttempts.log` の1本）／study の `_recordMyRate` → `_logAttempt` → `_updateSRS` の順を変えない／画面側に境目の数字を書き写さない。
- テスト: `test_karte.js`・`test_stats_sections.js`・`test_weekly_weak.js`。

## エラー報告（種別 ＋ 自由記述コメント・2026-09-09〜）

カードの ⚠️ を押すと出るパネル（`.mec-err-panel`）で報告する。**種別6つのボタン**と、
**問題ごとに1つの自由記述コメント**（`.mec-err-note`）。種別だけでは「どこを直したいのか」が
伝わらなかったので 2026-09-09 にコメントを足した。実装は `progress.js`（保存・一覧・同期）と
`study.html`（パネルUI）で、閲覧モーダルは hub と共通。
テスト: `node _work/test_merge_remote.js` の note 8件 ＋ `_work/test_err_note_browser.html`（実ブラウザ21件）。

```
error_reports_v1 = [
  { uid, type:'wrong_image', reported_at },          ← 種別の報告（在る／無いだけ）
  { uid, type:'note', text:'図Bが別問題のもの', reported_at }   ← コメント（問題ごとに1つ）
]
```

- ⚠️ **コメント用の localStorage キーを新設しないこと。** 一覧・テキスト/JSONコピー・全消去・
  バッジ件数・同期マージが**全部この1本の配列**を見ている＝別キーにすると同じ配管を5か所で
  二重管理することになる。書き口は `mecSetErrorNote(uid, text)` / 読み口は `mecGetErrorNote(uid)`。
- **種別を1つも選ばずコメントだけでも報告として成立する**（バッジも1件と数える）。
- ⚠️ **種別は union のまま・コメントだけ last-writer-wins**（`_mergeRemote`）。
  種別は「在るか無いか」しか持たないので union でよいが、コメントは**本文が書き換わる**ので
  union にすると別端末で直した本文が黙って巻き戻る。判定材料は `reported_at` だけなので、
  **書くたびに必ず時刻を更新すること**。
- ⚠️ **コメントを消したときレコードごと捨てないこと。** union なので、捨てると「まだ持っている
  端末」から次の同期で本文が復活する。**本文を空にしたレコード（`text:''`）を新しい時刻で残す**＝
  last-writer-wins がそのまま削除として働く。`mecGetErrorReports()` がその墓標を落として返すので、
  UI・件数・一覧には出ない。⚠️ **localStorage を直に読む経路を作らないこと**（`study.html` の
  `_errReportedSet` は共有APIを通す。直読みすると墓標だけの問題まで ⚠️ が赤くなる）。
- ⚠️ **コメントは試験モードの出題キューからカードを外さない**（外すのは種別を押したときだけ）。
  種別は「この問題は壊れている」だが、コメントは所感のこともあるため。
- **保存は自動（入力停止900ms＋blur）＋ 💾保存ボタン**。押し忘れても消えないための二重化で、
  ボタンは「押した確証」のために置いてある。⚠️ 上限は `ERR_NOTE_MAX = 1000` 文字
  （`study.html` の `ERR_NOTE_MAXLEN`＝`maxlength` と揃えること）。
- ⚠️ **コメント欄の `font-size` を16px未満にしないこと**——iOS がフォーカス時にページを自動ズームし、
  カードの位置が飛んで書いている場所を見失う（`progress.js` の手動コピー枠と同じ理由）。
- 一覧とコピーは **`_errGroups()` が問題ごとに畳む**（種別を `/` で連ね、コメントは本文として出す）。
  JSONコピーだけは生の配列のまま＝機械に渡す側は畳まない。

## 模試（詳細 → `_work/仕様/模試.md`・作業ノートは `_work/夏メック模試_引き継ぎ.md`）

mock.html / mock.js / mock_karte.html / questions_m121s.json を触る前に読むこと。要点:

- ⚠️ `mec_mock_v1` に保存するのは「何を選んだか」だけ。正誤も得点も保存しない（式は `mock.js` の1か所）。`mock_karte.html` も式を持たない。
- 自動送りの条件は `q.pick`（「Nつ選べ」）だけ。⚠️ `q.ans.length` を使うと正解数が漏れる。採点前は禁忌肢問題であることを出さない。
- 未入力ブロックは満点にも母数にも入れない。一般・臨床のボーダーや全国正答率の推測値を入れない。
- `mock_data/{id}_rates.js` は派生物（`node _work/build_mock_m121s_rates.js`）。⚠️ 受験者 ID を載せない（リポジトリは公開）。
- `questions_m121s.json` は派生物＝直接編集しない（手書きは `_work/mock_m121s_overrides.json`）。uid の対応は `MecMock.studyUid()` が唯一の正本。
  禁忌肢をカードの見出しに出さない。解説の図（`images/ex/`）は `q.imgs` に入れず、行を `.qimg-row` にしない。
- ❌模試誤答フィルタ: 誤答 uid の一覧を保存しない（`MecMock.weights()` に毎回計算させる）。未入力ブロックは丸ごと除く。模試かどうかはレジストリ `mock_data/index.js` で判定する。
- UI の検査は実ブラウザで（`_work/test_mock_browser.html`・http で開く）。テスト: `test_mock_score.js`・`test_mock_questions.js`・`test_mock_figs.js`・`test_mock_wrong_filter.js`。

## 疾患マインドマップ（詳細 → `_work/仕様/マインドマップ.md`・設計は `_work/マインドマップ_設計.md`）

- 1つのエンジン（`mindmap.html` / `.js` / `.css`）＋データ（`mindmap_data/`）。新しい科目は `mindmap_data/{sid}.js` を書き、`_hub.js` に代表疾患8つを足し、
  `node _work/build_mindmap_index.js` を流して、`sw.js` の SHELL に追記する。⚠️ `{科目}/mindmap.html` を新しく作らない。`_archive/mindmap_src/` を消さない。
- 不変条件: `infinite` アニメを置かない／SVG フィルタを使わない／拡縮は `viewBox` の書き換えで行う（CSS の `transform:scale` 禁止）／
  章の色と角度をデータに持たない／走るアニメは常に1本／進捗や正答率でノードを塗らない／
  ノードの位置は `translate` の提示属性が正本（CSS で `transform` を動かさない・入場で `opacity:0` を使わない）／`fit()` は背景と演出を測らない。
- ハブに「すべて開く」を置かない（`HUB_MAX_OPEN = 3`）。`keys` に書くのは数値・略語・鑑別の分岐を含む具体的な記述だけ。
- テスト: `test_mindmap_layout.js`。

## テスト一覧

いずれも実ソースを読み込む（ロジックの二重管理をしない）。

### 一括実行とフック・CI（2026-09-28〜）

```bash
node _work/run_all.js            # テスト全部＋生成物の --check
node _work/run_all.js --quick    # テストだけ
node _work/run_all.js --browser  # 実ブラウザのテストも（章ジャンプの計測で約15分）
```

- ⚠️ **合否は終了コードで決めること。出力の最後の行を信用しない。** 2026-09-28 まで8本のテストが、
  失敗しても合格数だけを「全 N 件 ok」と最後に出していた（直した）。`run_all.js` は終了コードだけを見る。
- **生成物の食い違い**も見る（rate_index / dup_index / sounds_index / mindmap の index / 模試の成績表 /
  qmeta / image_dims / 模試の解説 / 必修講座 Part1・Part2 / 画像の整合性）。⚠️ **生成物は連鎖する**——
  `questions_*.json` を変えると qmeta と rate_index も作り直しが要り、**元の科目の解説を直すと
  必修講座（解説を借りている）も作り直しが要る**。2026-09-28 に qmeta（血液5問）と必修講座（4問）が
  古いまま残っていたのをこれで見つけた。
- **フックは Git 管理下 `_work/hooks/`**（pre-commit＝今までどおりの軽い検査／pre-push＝`run_all.js`）。
  ⚠️ **マシンごとに一度だけ `git config core.hooksPath _work/hooks`** が要る（`run_all.js` が未設定を知らせる）。
  旧 `.git/hooks/` の Git LFS の残りのフックは使わない（LFS はもう使っていない）。
- **GitHub Actions**（`.github/workflows/test.yml`）が push のたびに `run_all.js --ci` を流す。落ちると
  メールが来るだけで Pages の反映は止めない。PDF（Git 管理外）が要る検査はそこではスキップになる。

```
node _work/run_all.js              ↓ 全部まとめて（終了コードで判定・生成物の食い違いも見る）
node _work/test_attempts.js        解答イベントログ・今日の誤答
node _work/test_attempts_roll.js   解答ログの集計（畳む・同期で二重に数えない・週の結果発表）
node _work/test_weekly_weak.js     週ごとの弱点の推移（克服・忘却・取りこぼし・再発の判定・端末別の同期・週の報告・配線）
node _work/test_karte.js           弱点カルテの集計・全国比
node _work/test_merge_remote.js    Gist同期のマージ戦略
node _work/test_streak.js          連続日数と activity_v1
node _work/test_copy.js            クリップボード/2段階タップ
node _work/test_today_learning.js  ハブの「今日解いた問題」
node _work/test_srs_grade.js       SRSの自己採点3段階・経過日数ゲート・ゆらぎ・並び・試験日ゲート・連問
node _work/test_subject_totals.js  科目別問題数の三者一致
node _work/test_card_render.js     カード描画（画像実寸・採点ボタン）
node _work/test_calc_input.js      計算問題の桁入力・データ整合
python _work/test_jumps_browser.py 章・番号ジャンプを全科目で実ブラウザ計測（要 Chrome＋websockets・約15分）
node _work/test_missions.js        日次/週次ミッション
node _work/test_gamify_ceremony.js セレモニー/授与トレイ/スキップ
node _work/test_exam_prog.js       試験の進捗バー・難問の可視化
node _work/test_exam_queue_scope.js 試験の出題範囲がキューに閉じているか
node _work/test_daily_goal.js      ハブのゲージ・歯車の意匠
node _work/test_hero_cta.js        ハブのボタン・計器ベイの演出
node _work/test_fx_band.js         試験演出の可視帯(発火位置)
node _work/test_fx_additions.js    新エミッタ・tier7・難問/速答
node _work/test_stats_sections.js  統計の4タブ構成・弱点リスト統合・演出の門
node _work/test_gist_sync.js       Gistの分割保存・切り詰めの復旧
node _work/test_exam_chassis.js    試験UIの筐体／盤面の分離
node _work/test_exam_reading.js    読んでいる間の演出
node _work/test_exam_brasswork.js  筐体の外へ広げた真鍮細工
node _work/test_mindmap_layout.js  マインドマップのレイアウト/データ
node _work/test_sounds.js          効果音の一覧・音量・ランダム起動音
node _work/test_ui_theme.js        UIテーマ全8種（.qc への干渉・ネタバレ防止）
node _work/test_theme_css.js       テーマ別 CSS の読み込み・切り替え・sw.js の大きさ
python _work/measure_load.py       読み込みの重さを実ブラウザで測る（前後比較。最初の数回はフォントの冷えで遅いので捨てている）
node _work/test_done_scope.js      「済」と全問題数の正本・全ページの一致
node _work/test_hub_notes.js      ハブ「今日の所見」の集計と選抜
node _work/test_hub_radar.js      ハブ「実力の輪郭」8軸レーダー・全国正答率の索引
node _work/test_hub_opening.js    1日の最初のブリーフィング／週の結果発表
node _work/test_hub_liquid.js     ハブの Liquid ゲージ（止まらない・回らない・はみ出さない・雫は塊へ戻る・金色なし）
node _work/test_trophy_boss.js    トロフィー棚（定着・章メダル）とボス戦
node _work/test_ward.js           病棟回診（配線・確信度の撤去）
node _work/test_ach_theme.js      ACHIEVEMENTS の意匠がUIテーマ全種ぶんあるか
node _work/test_mock_score.js      模試の自己採点（データ検算・採点・同期・成績表）
node _work/test_mock_figs.js       模試の設問図が全部あるか（138枚）
node _work/test_mock_wrong_filter.js  ❌模試誤答フィルタ（件数の一致・uid対応・配線）
node _work/test_body_containing_block.js  body/html を position:fixed の包含ブロックにしない
node _work/test_glitch_bars.js     グリッチ帯の引数形・可視帯・幅（実ソースを回す）
node _work/test_theme_correct_fx.js  UIテーマ8種の正解演出・study/chapter の同期
node _work/test_rf_polish.js       正解・誤答の演出の仕上げ（連続数の置き場・進捗の桁・動きの規則・選び直しの意匠）
node _work/check_effect_themes_sync.js  演出テーマのミラー整合
node _work/test_dead_fx.js         演出の死んだコード（読まれない設定値・呼ばれない関数・参照されない @keyframes）
python _work/visual_snapshot.py    見た目が変わっていないかを実ブラウザで比べる（CSS の削除・分割のとき。手順は `_work/仕様/演出.md`「演出の死んだコードと、見た目の前後比較」）

# UIテーマの「自律進化ループ」（2026-08-23〜24）が置いていった検査。粒度が細かく
# 個別の @keyframes 名を名指しするので、演出を作り直すとここが落ちる
node _work/test_step1_fx.js   node _work/test_step2_fx.js
node _work/test_step4_fx.js    node _work/test_new10_fx.js
node _work/test_next10_fx.js    node _work/test_dynamic_fx.js
node _work/test_concentric_fx.js
```

`node _work/check_themes.js` はベース6テーマの配色検査（基準はカード面に対して 4.5:1）。
科目色は色相を保ったまま明度だけで調整する。

⚠️ **科目色を足すときはこの検査を通すこと。** 満たすべきは3つ:
① カード面に 4.5:1 以上（最も明るいのは `th-teal` の L=0.0210）
② `--subj-ink` を載せて 4.5:1 以上（科目色は**地**として使われ、暗インクが乗る）
③ 既存の科目色と OKLab ΔE 3.0 以上（現在の最小は `neur`-`tox` の 3.0）
⚠️ **色は4つのテーブルすべてで同じ値にすること**——`chapters_meta.js` /
`study.html` の `STUDY_SUBJECTS` / `gamify.js` の `SUBJECTS` / `mindmap_data/index.js`
（最後の1つは `node _work/build_mindmap_index.js` で `gamify.js` から生成する）。
⚠️ `{科目}/ch*.html` の `--or` は**別のトークン**（章別ページ自身のアクセント色）で、
この統一の対象ではない。study.html からは参照されないので古い色のまま残っている。

`test_subject_totals.js` は questions_*.json / `gamify.js`の`SUBJECTS` / `chapters_meta.js`
の3か所に散らばった問題数が一致しているかを見る。問題を増減したら必ずここが落ちる。

## 試験モードの演出（詳細 → `_work/仕様/演出.md`・設計の経緯は `_work/演出強化_設計.md`）

study_exam.js / study.css / fx_engine.js / chapter_exam.js / ui_theme.css / gamify.js の演出と効果音を触る前に必ず読むこと。要点:

**全体**
- ⚠️ `<body>` / `<html>` に `transform` `filter` `backdrop-filter` `perspective` `will-change:transform` `contain` を掛けない（JS でも CSS でも）。
  `position:fixed` の包含ブロックが変わり、演出と `#mecFxCanvas` が崩れる。画面を揺らすなら `_shakeFxLayers()` で演出レイヤーだけを揺らす
  （正解時・連続正解時は揺らさない）。検査は `test_body_containing_block.js`。
- ⚠️ `transform` は既存のアニメーションに黙って上書きされる。移動・回転・拡大は独立プロパティ `translate` / `rotate` / `scale` で書く。
- `var()` を含むショートハンドは、置換結果が不正だとプロパティごと `unset` になる。CSS 変数には用途の接頭辞を付ける（`--exam-`＝vars.css に同名が無いこと／`--cta-`／`--ach-`）。
- 発火位置は可視帯 `_fxBand()` / `ceBand()` が正本（画面基準の座標を書かない）。`FX_BAND_TTL_MS` を伸ばさない・rAF でキャッシュを無効化しない。
- 演出の遅延は `_fxTimeout()` を通す（`exitExam` の先頭で掃除する）。reduced-motion では DOM 演出と粒子（`MecFX.setEnabled`）の両方を止める。
  `ui_theme.css` の全停止で `animation:none` にしない（`.qc` の入場アニメごと消えてカードが白紙になる）。
- `.qc` の層（`::before` / `::after`）は満杯で、状態で排他。`.qc` を全走査しない・`.qc` の疑似要素に `infinite` を常時走らせない・状態クラスに `will-change` を貼りっぱなしにしない。
- 非表示タブでは rAF も CSS アニメも進まない。完了の合図を rAF だけに預けない。入場を `opacity:0` から始めて JS で外す形にしない。
- 省電力 `html.mec-lite`（iPad・スマホだけ）は常時アニメだけを減らす。解答の瞬間の演出は減らさない。PC は変えない。

**正解・誤答（study 側・2026-09-24〜）**
- 正解の合流点は `_rfCorrectFx`（選択肢と計算問題の2経路が呼ぶ）。演出は合流点に足す（片方だけだと計算問題50問で抜ける）。抑えすぎないこと（一度指摘されている）。
- 誤答は答えを見せずに選び直させる（`.exam-retry`）。⚠️ 2回目以降のクリックを採点経路に通さない（採点の口は `_rfScoreWrong`）。肢を選ばずに開いたら不正解として記録する。
  選択肢に水平の線を作らない（下線部はこの教材で意味を持つ記号）。
- 連続数は `#examRfStreak`（ヘッダーの下端に重ねる）。動きの規則は vars.css の `--ease-*` / `--dur-*`（JS は `MO`）。
- 集計は `_tallyQuestion`（3つの採点経路の合流点）。難問の判定は `_isHardCard`（`data-rate < 60`・率なしは難問に数えない・閾値は3か所で一致させる）。
- tier の梯子を変えたら `ceTier`（chapter_exam.js）も揃える。tier で配列を引くときは `_tIdx` / `ceTIdx`。
- ⚠️ 2026-09-28 にデモページで選んだ24件（コンボメーター・オーバードライブ・覚醒・速答・初見／リベンジ・当て板・立て直し・傷・稼働灯・蒸気・排圧計・ワープゲート等）を study から外した。戻さない（一覧は詳細ファイル）。
- UIテーマ固有の正解演出（liquid / frost / celestial / brass など）は肢の位置に出し、文字の上に描かない。

**筐体・読書中（Phase 4 / 5 / 7）**
- 筐体（レール・溝・モーダルの額縁）は真鍮固定、盤面（進捗・数字）はテーマ可変。物は真鍮、読み値は意味色。`body.exam-effect-*` に筐体の上書きを足さない。
- ヘッダの高さを1pxも増やさない（`_fxBand` の基準）。筐体に常時アニメを置かない（稼働灯・歯車の回転・熾火は 2026-09-28 に撤去）。
  光を走らせるなら箱の中の `background` を動かして作る（箱の外へ出すと iOS でページの縮尺が振動する）。
- 読書中の演出は周辺視野だけに置き、文字の上に重ねない・解答に影響する情報を出さない・急かさない。R11（筐体が温まる）は保留＝ついでに実装しない。
- 試験の筐体を `body::before` に置かない（`#examChrome` の div を消さない）。

**テーマと効果音**
- 演出セットは UIテーマから `UI_TO_EXAM_SET` で決定論的に引く（ランダムに戻さない）。粒子の fallback を書き戻さない（UIテーマを増やしたら各分岐に足す）。
  `EXAM_EFFECT_THEMES` と `CE_EFFECT_THEMES` の乖離は `check_effect_themes_sync.js`、誰も読まないキーは `test_dead_fx.js` が見張る。
- 全画面を覆う層（暗転など）は study 側では出さない（2026-09-28 に `FULLSCREEN_BUDGET` ごと撤去）。全画面フラッシュは 2.8Hz 以下。
  例外は UIテーマ固有の正解演出の `.rf-full`（`_rfFullHost`・デモと同じ濃さ＝不透明度で薄めない）。肢の層は送り（`RF_ADVANCE_MS`＝403/460/345ms）の前に終え、
  カードの中で出していた層は全画面でラボの尺のまま再生する（2026-09-28・ユーザー判断）。
- ⚠️ 2026-09-28 に全テーマ共通の正解演出（明るさフラッシュ・ゾーン・グリッチ／墨・背景の呼吸・暗転・神速の稲妻）と、liquid/frost/celestial/brass の ui_theme.css 旧正解層（試験モードのみ）を外した。戻さない（詳細は `_work/仕様/演出.md`）。
- 効果音の正本は `sounds_index.js`（足す手順は「フォルダに置く → `sounds/meta.json` に1行 → `node _work/build_sounds_index.js`」）。
  ⚠️ ファイル名の表を2本目に書かない／「無音」と合成音を戻さない／キーを改名しない。起動音は毎回ランダム（抽選は `startExam` の中）。テーマ固有の起動画面（`_examBootTable` が表を返す Frost・Celestial・Liquid）では鳴らさない。`vol>1` は GainNode でしか効かない。
- 過去問ビューア（`chapter_exam.js`）は意図的に旧演出のまま。
- CSS の削除・分割のときは `python _work/visual_snapshot.py` で見た目の前後を比べる（手順は詳細ファイル）。

## 科目選択は単一選択（2026-07-20〜）

study.html の科目チップは**1科目だけ選べる**。「全科目」ボタンは廃止した。

- **理由**: 全科目選択は最大5487問（約22万ノード）をDOMに載せ、iPad/iPhone がメモリ退避で
  タブを強制リロードする主因だった。実運用でも複数科目を同時に開く場面が無かった。
- **効果**: DOMは常に1科目ぶんに固定される（最大の科目は `node _work/test_subject_totals.js --table` で確認）。
- `toggleSubjectChip` が「前の科目を `_unloadSubjectCards` で捨ててから次を読む」を担保する。
  同じチップの再タップで未選択に戻れる（`#mecNoSubj` の案内が出る）。
- `applyFilters` は元々 `selectedSubjects` に限定されているため、難易度・状態・検索・
  🎯苦手・🔔復習の**すべてが選択中の1科目内**になる。これは仕様。
- 科目横断が必要な用途には既に代替がある:
  - 苦手 → stats.html の弱点リスト（科目横断）から `study.html?sid=X&state=weak`
  - 復習 → SRS復習モード（🔔ボタン / `?mode=srs_review`）は科目横断で動く
  - 用語の横断検索 → knowledge.html

### 将来の検討事項: 全科目ミックスの総合演習（未実装）

本番は全科目ミックスだが、単一選択化により study.html 上での総合演習はできなくなった。
現状は **実力試験Ⅰ（jitsu1・160問）** と **章別試験** でカバーしている。

もし実装するなら、**全科目をDOMに載せる方式に戻してはいけない**（上記の理由で却下済み）。
**SRS復習モードと同じ「必要な問題だけをDOMに起こす」方式**を流用するのが筋:

- `_renderDueCardsForReview` / `srsq` 単品キャッシュ（IndexedDB）/ `_srsHostShow` の仕組みが
  そのまま使える。出題uidを決めてから、そのuidぶんだけホストへ描画する。
- 出題数は上限を設ける（SRS復習は `SRS_SESSION_LIMIT = 50`）。100問程度が現実的。
- 科目配分は本番の出題比率に寄せるか、`myrate_v1` の弱点重み付けにするかを決める必要がある。
- 起動経路は `?mode=mock` 等を新設し、`_srsLaunch` と同様に全科目初期化をスキップする。
- 終了後の復帰は `_srsRestoreAfterReview()` と同じ考え方が要る（解放した科目の読み直し）。

## 複数デバイス同期

GitHub Gist API で進捗を保存。`index.html` の「同期設定」から PAT と Gist ID を登録。
マージ戦略：done はunion（周回数は大きい方）。

### ⚠️ 1つの Gist ファイルに全部を詰めない（2026-08-13〜）

**Gist API の応答は `content` を 900KiB(921,600B) で切り詰め、`file.truncated` を立てる**。
2026-08-13に進捗が 963,716B まで育ち、`Unterminated string in JSON at position 920360` で
同期が止まった。

⚠️ **この 900KiB はファイル単位ではなく応答全体の合計**。実測で4ファイルに分けても
合計 content が 921,600B ちょうどで頭打ちになり、最後のファイル（`mec_srs.json`）が切られた。
**つまりファイル分割では切り詰めを避けられない**。本体の対策は raw からの取り直しの方:

- **読む側（本体の対策）** — `truncated`（および content が壊れているとき）は `raw_url` から
  全文を取り直す（`_readGistFile`）。**truncated なファイルは複数同時に出るので全部拾う**。
  ⚠️ **`raw_url` に `Authorization` を付けてはいけない**。`gist.githubusercontent.com` は
  プリフライトを通さないので `Failed to fetch` になる。secret gist の raw_url はリビジョンの
  sha入りで推測できないためヘッダ無しで取ってよい（実測で 200・全文が返る）。
- **書く側（`GIST_SHARDS`）** — 大きいキーを別ファイルへ分ける。現在は
  `mec_srs.json`（srs）／`mec_attempts.json`（attempts）／`mec_rate.json`（myrate＋choice）／
  `mec_weekly.json`（週ごとの弱点の推移・2026-09-29〜）／残り全部が `mec_progress.json`。狙いは切り詰め回避ではなく、**1ファイルの肥大で書き込み側の
  上限に当たるのを防ぐこと**と、**取り直す raw の量をそのファイルぶんに抑えること**。
  読む側は**全ファイルを浅くマージして1つの payload に戻す**ので `_mergeRemote` は分割を知らない。
  旧形式（全キーが `mec_progress.json`）もそのまま読める。混在時は `mec_progress.json` が勝つ。

⚠️ **`pushToGist` の read-modify-write の事前取得が失敗したら push を中止すること**。
以前ここは `catch {}` で握り潰して push を続行しており、**リモートを読めないまま
ローカル状態で上書きして他端末の進捗を消す経路**だった（切り詰めで parse が落ちていた間、
まさにここを通っていた）。例外は「リモートが本当に壊れている(`kind==='parse'`)」ときだけで、
これはマージのしようがないので上書きで修復する。

テスト: `node _work/test_gist_sync.js`（実ソースを vm で読み込み fetch だけスタブ）

## 大量ファイル変更時の注意

questions_*.json など多数のファイルに同じ変更を入れるときは、Pythonスクリプトで一括処理し、
数ファイルで動作確認してからコミットする。

## 既存科目の HTML を作り直すとき（詳細 → `_work/仕様/採点データと科目の作り直し.md`）

作り直しに着手する前に必ず読むこと。要点:

- 解説だけでなく、設問文(qt)・画像・バッジ・rate_text を同じパスで作り直す。
- 画像は既存のものを信用せず、PDF から抽出し直して目視で突き合わせる（`pdf_audit.py` は帰属を検証しない）。手順は整形外科式（機械が候補を出し、ページ描画で人が検収する）。
  ⚠️ 既存画像を先に消さない／帰属を y 座標で決めない／複数枚は図ラベル順に並べ、直すときはファイルの中身を入れ替える。
  画像を差し替えたら `build_image_dims.py` と `sw.js` の `CACHE` bump。
- qt は整形外科式に揃える（設問文を1文まるごと `<strong>`・連問のステムを qt へ展開・`qt-context` / `series-label` を新しく書かない・PDF の折り返しを消す・文字は1字も変えない）。
- バッジは `bh` 必修／`bc` CBT／`bip` 一般／`brn` 臨床（巻末解答一覧表の座標から機械転記）。`bg` と `br` は使用中。`rate_text` は `"96%"` の形。
- 原文照合は自動化できない（`qtdiff` は当てにならない）。

## データソースの方針（2026-07-04〜）

- **解説・問題文の編集は必ず `questions_{prefix}.json` を対象にすること。** 章別HTML(`{科目}/ch*.html`)は編集対象ではない（study.htmlから参照されないため、直しても画面に反映されない）。
- 過去に神経・血液で「HTMLだけ強化してJSONに未反映」「科目ごとにcls命名がバラバラ(`em` vs `eem`)」という事故が発生済み。新しく解説を追加する科目でも同じ命名規則を使うこと。
- `eg`配列の`cls`命名規則（共通）: `ep`=病態, `ee`=鑑別, `ept`=国試ポイント, `em`=選択肢別解説（またはニーモニック）, `ec`=計算, `ei`=画像所見。`study.css`内のCSS(`.ep` `.ee` `.ept` `.em` `.ec` `.ei`)で色分けされるため、独自クラス名を作らない（旧: study.html内インライン。2026-07-05にstudy.cssへ外出し）。
- `questions_*.json` の整形はファイルごとにバラバラ（compact＝jitsu1 / indent=1+CRLF＝resp / 手書き混在＝custom）。**書き戻しで整形を変えないこと**。1問直しただけで全行が差分になりレビュー不能になる。`_work/fix_missing_bi_badges.py` が「往復で再現できるならjson.dumps、できなければ行単位パッチ」の実装例。
- 画像を追加・差し替えたら `python _work/build_image_dims.py` で `image_dims.json` を作り直す（`<img width height>` の材料。忘れるとその画像だけレイアウトシフトが戻る）。
- 画像は `python _work/compress_images.py`（長辺1200px・JPEG q85・**ファイル名は不変**）を通す。2026-07-24に全2544枚で461MB→228MBにした。パスが変わらないのでJSON/HTML/sw.jsの書き換えは不要。
- ⚠️ フックは `_work/hooks/`（Git 管理下・2026-09-28〜）。別マシンで clone したら `git config core.hooksPath _work/hooks` を一度だけ。pre-commit は「演出テーマ乖離チェック」と「画像整合性チェック」、pre-push は `node _work/run_all.js`。
- 章別HTMLをJSONへ完全移行し終えた科目から `_archive/{科目}/` へ`git mv`する。移行未完了（HTML側にのみ存在する解説がある）科目は先にJSONへマージしてから移動する。
