# MEC 医師国試学習ツール

## 作業スタンス

タスクに取り掛かる前に、必要な情報が不足していると判断した場合は実装を始める前にユーザーに確認を取ること。推測で進めず、曖昧な点は必ず質問する。

## プロジェクト概要

医師国家試験対策の学習ツール。GitHub Pages 経由で iPad・PC・スマホからアクセス。

- **リポジトリ:** GitHub `Mio839/MEC`
- **変更反映:** `git push origin main` で GitHub Pages に自動反映

## ファイル構成

| ファイル/フォルダ | 役割 |
|---|---|
| `study.html` | 統合学習ツール（コア11科目4802問＋実力試験・自作・フィルター）。試験モードUI等のマークアップ＋インラインJS |
| `study_exam.js` | study.htmlの試験モードロジック（state・効果音・演出エフェクト・SRS採点連携）。classic scriptでインライン<script>より前に読込み、共有グローバルスコープで相互参照 |
| `study.css` | study.html専用のCSS（旧インライン<style>を2026-07-05に外出し）。⚠️ study.htmlはこれに依存＝両方一緒にcommit/push必須 |
| `index.html` | ハブダッシュボード（全科目の進捗表示・ナビ・同期設定） |
| `progress.js` | 共有モジュール：localStorage + GitHub Gist 同期。localStorageキーは`K*`定数が正本 |
| `attempts.js` | 解答イベントログ（`mec_attempts_v1`・`window.MecAttempts`）。1解答=パイプ区切り1行の文字列で上限2000件のリングバッファ。集計値の`myrate_v1`と違い時刻・出題順・所要秒・選んだ肢を残す＝弱点分析の素材。study.html／stats.htmlが読込み |
| `qmeta.json` | 設問メタ（全科目1ファイル・`_work/build_qmeta.py`が生成する**派生物**）。設問形式(診断/検査/治療/対応/知識)・否定形・複数選択・画像・症例・計算・採点除外を自動分類。stats.htmlの弱点カルテが使う。**questions_*.json は一切変更しない**（pdf_audit.pyの監査対象を汚さないため） |
| `stats.html` | 学習統計ページ（30日チャート・SRS統計・AI相談Markdownエクスポート） |
| `knowledge.html` | 検索知識ノート機能 |
| `calc_input.js` | 計算問題の桁入力エンジン（`window.MecCalc`）。原文がマークシートの計算問題48問（科目33＋過去問15）は選択肢を持たないため試験モードで解答不能だった。正解は `.ac`（ans_label）の `計算答：<桁文字列>` が正本。**study.html と 国家試験過去問/*.html の両方が読む共有ファイル**（演出テーマのようなミラー乖離を作らないため）。CSSは自前で注入する |
| `card_renderer.js` | JSON→カードHTML描画（`window._renderSubjectFromJson`、エスケープ処理あり） |
| `fx_engine.js` | エフェクトのCanvas描画エンジン（`window.MecFX`：粒子・花火・グリフバースト等）。ハブのゲージ用に `gears`／`gearRain`／`steam`（真鍮の歯車・蒸気）を後から足した。**エミッタの追加は常に純増で行うこと**——study.html／chapter_exam.js の試験演出が同じエンジンを共用しているので、既存関数の引数や既定値を変えると7テーマ全部に波及する |
| `image_dims.json` | 問題画像の実寸（パス→[w,h]・約109KB・**派生物**。`_work/build_image_dims.py`が生成）。`card_renderer.js`が`<img width height>`を出す材料。これが無いと遅延読込の画像でレイアウトが後からずれ、章ジャンプが目標に収束しない。**画像を差し替え・追加したら必ず再生成** |
| `sw.js` | Service Worker（オフラインキャッシュ）。`CACHE`版数は**questions_*.json・画像を更新した時にbump**（bumpで全キャッシュ削除＝再DL）。SHELL/CARDSにパス列挙。相対パス必須 |
| `chapters_meta.js` / `rate_index.js` | stats.html等が参照する章メタ・正答率インデックス（`_work/build.py`系で再生成） |
| `questions_*.json` | **問題データの正本**。study.htmlはこれを読み込んで表示。⚠️ 2026-07-24に`questions_*.js`（file://フォールバック用の同内容コピー・計約15MB）を廃止した。運用はGitHub Pages一本で、コピーはリポジトリを二重に太らせ更新のたびに再生成が要るだけだったため。`_work/gen_js_from_json.js`・`_work/check_json_js_sync.js`・pre-commitフックの自動生成ステップも同時に撤去済み |
| `国家試験過去問/` | 過去問ビューアHTML（`chapter_exam.js`で試験モード）。PDFは`.gitignore`済み・追跡はhtmlのみ |
| `chapter_exam.js` | 過去問ビューアの試験モード（`CE_EFFECT_THEMES`＝study_exam.jsの演出を同配色でミラー） |
| `内分泌/` `呼吸器/` `循環器/` `消化器/` `神経/` `肝胆膵/` `腎臓/` `血液/` `免アレ膠/` | 各科目のフォルダ（画像・selfcheck_intro.html等）。章別解答解説HTML(ch01.html等)は全科目 `_archive/{科目}/` へ移動済み（2026-07-07完了） |
| `産婦人科/` | 章別HTML(ch01〜ch13)＋`images/`＋`obg_questions.json`（メタ）。HTMLが`questions_obg.json`のソース＝`_work/build_obg_json.py`で再生成 |
| `_archive/` | 到達不能になった旧・章別HTMLの保管先。編集対象外、読み物としてのみ残す |
| `vars.css` | 共通CSSカスタムプロパティ（全ページ共通色変数） |
| `_work/` | ビルド・検証・マージ用スクリプト（`build.py`・`pdf_audit.py`・`build_qmeta.py`・`build_image_dims.py`・`compress_images.py`・`fix_missing_bi_badges.py`・各`test_*.js`等）。⚠️**PDFから新科目の章別HTMLを作るときは先に `_work/新科目HTML生成ガイド.md` を読む**（抽出フロー・産婦人科水準の解説品質基準・統合チェックリスト・着手プロンプト。参照実装は精神科psy=`build_psy_ch01.py`／`build_psy_json.py`） |
| `精神科/` | マイナー講座・精神科（prefix `psy`）。章別HTML(`ch01_seishinka_kihon.html`〜`ch08_sonota.html`)＋`images/`＋`psy_questions.json`（章名メタ）。HTMLが`questions_psy.json`のソース＝章ごとの生成器`_work/build_psy_ch{NN}.py`→`_work/build_psy_json.py`で再生成。産婦人科と同構造。**ch01は`EXTRA`辞書で肢別解説を後付けする方式、ch02以降はQ()に`patho`/`deep`/`point`を直接渡す方式**（新章は最初から4ブロック書くため）。ch03のQ.34(105D-54)は国試の**採点除外問題**＝`bx`バッジ・正解肢0・`rate=None`で作る（`_isExamUngraded`が中立表示で通す）。第1章73問・第2章25問・第3章41問・第4章36問・第5章18問・第6章25問・第7章24問・第8章14問＝**全8章256問（NO.1-256）完成**。**Q番号はPDFの通し番号（NO.）を厳守**＝章ごとにQ.1へ振り直さない（下記「問題番号は科目内の通し番号」） |
| `皮膚科/` | マイナー講座・皮膚科（prefix `derm`）。章別HTML(`ch01_hifuka_kihon.html`〜)＋`images/`＋`derm_questions.json`（全9章の章名メタ）。HTMLが`questions_derm.json`のソース＝章ごとの生成器`_work/build_derm_ch{NN}.py`→`_work/build_derm_json.py`で再生成。精神科ch02以降と同方式（Q()に`patho`/`deep`/`point`を直接渡す）。**全9章249問・章頭NO.は 1／28／55／82／99／122／151／191／223**（生成器の`Q_START`がこれを持つ）。**2026-07-29に全9章249問が完成**（ch03「紅斑」NO.55-81・27問・画像16問23枚／ch04「角化症」NO.82-98・17問・画像8問13枚／ch05「水疱・膿疱」NO.99-121・23問・画像20問33枚／ch06「母斑と良性腫瘍」NO.122-150・29問・画像18問26枚／ch07「悪性腫瘍」NO.151-190・40問・画像25問46枚＝**derm最大の章**／ch08「感染症」NO.191-222・32問・画像21問32枚／ch09「その他の皮膚疾患」NO.223-249・27問・画像6問6枚＝**実質「褥瘡14問＋創傷治癒5問」の章**）。精神科との最大の差は**画像問題が主体**（PDF全体で埋め込みJPEG204枚・第1章は8問／第3章は16問）。⚠️ 問題文の`↗N`は解答表の**IRT型**の値で画像枚数とは無関係——画像の有無は「〜の写真を示す」の記載と`page.get_images()`で判定する。巻末解答一覧表はPDF p.155-159で、列のx座標は精神科と同一 |

## 問題数

実測値（`node -e`で `questions_*.json` の `chapters[].qs` を集計、2026-07-05時点）。

| 分野 | prefix | 章数 | 問題数 |
|---|---|---|---|
| 内分泌 | endo | 10 | 542 |
| 呼吸器 | resp | 9 | 506 |
| 循環器 | circ | 10 | 572 |
| 消化器 | dige | 11 | 501 |
| 神経 | neur | 11 | 594 |
| 肝胆膵 | hbp | 8 | 418 |
| 腎臓 | jinzo_d | 6 | 315 |
| 血液 | hema | 8 | 378 |
| 免アレ膠 | imma | 5 | 247 |
| 感染症 | kansen | 22 | 356 |
| 小児科 | peds | 13 | 373 |
| 産婦人科 | obg | 13 | 685 |
| **コア12科目 小計** | | **126章** | **5487問** |
| 精神科（マイナー講座） | psy | 8 | 256 |
| 皮膚科（マイナー講座） | derm | 9 | 249 |
| 実力試験Ⅰ | jitsu1 | 2 | 160 |
| 自作問題 | custom | 1 | 可変（現在28） |
| 暗記メモ | memo | 4 | 可変（現在121） |
| **総合計** | | **150章** | **6301問** |

※ `study.html` タイトルの「5487問」はコア12科目の合計（マイナー講座・実力試験・自作・暗記メモは含まない）。
※ 精神科は2026-07-28に全8章完成。`study.html` の科目ヘッダは実数（256問）を出す。
※ 皮膚科は2026-07-29に全9章249問が完成。`study.html` の科目ヘッダは実数（249問）を出す。
　 章を足すたびに `gamify.js` の `total`・`chapters_meta.js`・`study.html` の `subj-hdr-count` を実数へ更新すること。

## localStorage キー（全ページ共通）

**正本は `progress.js` 冒頭の `K*` 定数**（`KD`/`KF`/`KA`/`KR`/`KT`/`KE`/`KDT`/`K_SRS`/`KRT`/`KER`/`K_TOKEN`/`K_GIST` 等）。同期対象キーの追加・変更時はここと `_mergeRemote`（progress.js）・`pushToGist`のpayload・`index.html`の復元パスを揃えること。主要キー:

- `done_v2` — UID → 周回数（整数、0=未済）／ `done_tombstones_v1` — undo削除の墓標（同期で復活防止）
- `flag_v2` — 苦手UID → 設定時刻ms（旧データは1）／ `flag_tombstones_v1` — 旗解除の墓標（uid→解除時刻ms、マージは旗vs墓標の新しい方が勝つ）
- `mec_choice_v1` — UID → 選択肢別の誤答回数＋`_last`（最後に選んだ肢）。同期対象（回数はmax、`_last`はローカル優先）
- `activity_v1` — YYYY-MM-DD → 操作回数（連続日数🔥と30日間の学習記録の算出元）。**書き込み口は `logActivity()` の1本だけ**。通常モードは`mecIncrLap`、試験モード／SRS復習は`_markExamDone`（study_exam.js）から`window.mecLogActivity()`を呼ぶ。done_v2を直接書く新経路を足すときはここも通すこと（通し忘れるとその日が学習日として残らない）
- `myrate_v1` — UID → `{correct,total}`（試験モードの自己正答率。マージは各フィールドmax）
- `studytime_v1` — YYYY-MM-DD → 学習分数
- `mec_srs_v1` — SRS復習スケジュール ／ `mec_exam_resumes_v1` — 試験中断の再開データ ／ `mec_ch_exam_v1` — 章別試験履歴
- `mec_attempts_v1` — 解答イベントログ（attempts.js）。`"uid|t|c|o|s|m|sess|n"` の文字列配列・上限2000件。追記専用なので同期は`sess+n`をキーにしたunion＋時刻昇順ソート＋上限切り詰め
- `error_reports_v1` — 問題エラー報告 ／ `mec_err_cleared_at` — 一括消去のタイムスタンプ
- `mec_gist_token` — GitHub PAT（gistスコープ）／ `mec_gist_id` — Gist ID ／ `mec_last_sync_v1` — 最終同期時刻
- UIローカル設定（非同期）: `mec_subjects_v1`（選択科目）/`mec_filter_v1`/`mec_state_v1`/`mec_combo_sound_v1` 等

## UID フォーマット

- 各科目解説: `{prefix}_ch{nn}_q{n}` 例: `endo_ch01_q1`, `resp_ch02_q3`, `jinzo_d_ch03_q136`
- 科目prefix（全17）: `endo` / `resp` / `circ` / `dige` / `neur` / `hbp` / `jinzo_d` / `hema` / `imma` / `kansen` / `peds` / `obg` / `psy` / `derm` / `jitsu1` / `custom` / `memo`

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
- 行2（状態）: すべて / 🚩赤旗 / 未済 / 済み

### カード内ボタン
- `🚩` 赤旗ボタン（`mecToggleFlag`）
- 自己採点 `×` `△` `○`（`mecIncrLap`・キーボード `1` `2` `3`／`Enter`=○）:
  3つとも `data-action="lap"` で、違いは `data-grade`（`ng`/`mid`/`ok`）だけ。
  どれを押しても周回数 +1・学習日の記録・次カードへのスクロールは共通で、
  変わるのは SRS へ渡す自己申告のみ（[SRSの自己採点]参照）。
  周回数と緑の塗りは常に `○`（`.mec-lap-btn`）が持つ。
  ⚠️ `.mec-lap-btn` というクラス名は変えないこと。`study_exam.js`・`progress.js`・
  キーボード操作・旧`selfcheck_intro.html`がこの名前で掴んでいる。

### SRSの自己採点（2026-07-24〜）

以前は「済」1つで、押すたびに**無条件で正解扱い**として SRS の間隔を伸ばしていた。
想起テストを経ずに間隔だけ伸びるため、通常モードで一周すると SRS が「定着済み」で埋まり、
試験モードでしか書かれない `myrate_v1` と食い違っていた。`_updateSRS(uid, grade)`（study.html）:

| grade | ef | 間隔 |
|---|---|---|
| `ok`（○ 余裕） | +0.1（上限2.5） | 1 → 6 → 前回×ef |
| `mid`（△ あやふや） | 据え置き | 1 → 3 → 前回×max(1.15, ef-0.6) |
| `ng`（× わからない） | -0.2（下限1.3） | 1日へ戻し reps=0 |

- 試験モードは従来どおり真偽値で呼ぶ（`true`=○ / `false`=×）。互換は維持されている。
- 直近の申告は `mec_srs_v1` の `g` に入る（同期対象）。カード上の選択表示に使う。
- 間隔上限90日・ef上限2.5は意図的（本番まで1年スパンで間隔を暴走させないため）。
- テスト: `node _work/test_srs_grade.js`

## デイリー／ウィークリーミッション（2026-07-30 拡張）

定義は `gamify.js` の `MISSIONS_DAILY`（8個）・`MISSIONS_WEEKLY`（8個）。進捗は同期キー
`mec_missions_v1` の**端末別カウンタ**（表示・判定は端末横断で sum）。テスト: `node _work/test_missions.js`。

### tier（core / bonus）— 新しいミッションを足すときの基準

`MISSION COMPLETE` セレモニーは **`tier:'core'` だけ**で判定する。core は「手を動かせば必ず届く」
ものに限ること（現在: 解答40問・試験セッション1本・試験で20問正解／週次は250問・120正解・7セッション）。

- ⚠️ 旧仕様はセレモニーが**全ミッション達成**を条件にしていて、そこに「試験で全問正解」という
  運任せの条件が混ざっていたため、日次のセレモニーが事実上一度も発火しなかった。
  在庫や運に左右されるもの（`perfect`・`acc80`・`srs`）は必ず `bonus` に置く。
- ハブ（index.html）の見出し件数が緑になる条件も core のみ。行の `data-tier` 属性で判定している。

### カウンタと加算口

| counter | 意味 | 加算する場所 |
|---|---|---|
| `ans` / `cor` | 解答数／試験モードの正解数 | `onAnswer`（通常モードの「済」も `onLap` から `ans` に算入） |
| `srs` | SRS復習セッションでの解答（正誤問わず消化数） | `onAnswer(..., {srs:true})`。`_recordMyRate` が `_srsReviewMode` を渡す |
| `redo` | 過去に落とした問題を正解し直した | `onAnswer(..., {wasWrong})`。**`myrate_v1` 加算前**の値で判定すること |
| `hard` | 難問（正答率60%未満）に触った数 | `onAnswer`／`onLap` から `_isHardQ(uid)`。正誤は問わない（正解だけだと難問を避けるほど有利になる） |
| `subj` | その日に触った科目数 | `_dailyFirstBumps`（`onAnswer`／`onLap` が同じ `_bumpMission` に合流させる）。同じ科目はその日1回だけ。**日次専用**（下記） |
| `day` | 学習した日 | `_dailyFirstBumps`（`onAnswer`／`onLap` が同じ `_bumpMission` に合流させる）。その日1回だけ＝週次バケットが「今週の学習日数」になる |
| `exam`/`acc80`/`perfect` | セッション完了／80%以上／全問正解 | `onExamFinish`（10問以上のセッションのみ） |
| `chexam80` | 章別試験で80%以上 | `onExamFinish(..., {chPrefix})`。同じ章は週1回だけ |

- `hard` の判定はカードの `data-rate` が正本（`study.html` のフィルタ「難問(<60%)」と同じ閾値
  `HARD_RATE = 60`）。**`data-rate` が無い問題（正答率なし）は難問に数えない**——出典に数字が
  載っていないだけで、難しいという意味ではないため。
- ⚠️ **`subj` を週次ミッションに使ってはいけない**。`_bumpMission` は日次と週次の両方へ足すので、
  週次側の `subj` は「日ごとの異なる科目数」の週合計＝同じ科目を5日やれば5になる（科目数ではない）。
  科目の広さを週で問うなら週キーの帳簿を別に持つこと（`chexam80` と同じ方式）。
- ⚠️ **`day` を core に置いてはいけない**。日数は**最終日に巻き返せない唯一のカウンタ**で、2日空けた
  時点でその週は到達不能になる。週次のペース表示は「カウンタ型は理屈の上では最終日でも巻き返せる」
  前提で遅れをグレーアウトしない設計なので、core にすると週の前半でセレモニーが死ぬ週が出る。
- 🚩の克服数（旧 `unflag`）は**2026-07-30に廃止**。① 旗が5個溜まっていない日は達成不能な在庫依存、
  ② 報酬が「旗を外すこと」に付くので弱点リストを畳む動機になる（旗は「後で戻る印」で、消すことは
  上達の証明ではない）、③ 解除はワンタップで想起テストを経ていない＝`cor`／`redo` と違い証拠が無い。
  `onFlag` は演出だけを担い、ミッションカウンタを触らない。代わりに日次へ `subj`（科目を2つまたぐ）を置いた。

- ⚠️ **章の「制覇」を週次ミッションの材料にしてはいけない**。旧 `chclear` は端末ローカルの
  `L.chDone` を見ていたため、全章を済にした時点で**永久未達**になり週次コンプリートが不可能だった。
  周回しても成立する指標（章別試験のスコア等）を使うこと。
- 期間キーは `'d:'+日付` / `'w:'+週キー` と名前空間を分ける。**月曜は日次キーと週次キー（その週の月曜）が
  同じ日付文字列になる**ので、素の日付で引くと `__all__` が衝突して片方のセレモニーが消える。

### 達成ボーナスXP

達成すると `mec_missions_v1.xp` に記帳され、`stats()` の XP に加算される（レベルに効く）。

```
xp: { banked: number, ledger: { 'd:2026-07-29': { ans:40, exam:40, __all__:150 } } }
```

- 「いくつ取ったか」ではなく**「何を取ったか」**を持つ。同じ `(期間キー, missionId)` にはどの端末も
  同じ値を書くので、同期の union マージで合流しても**二重加算にならない**。
- 台帳から落ちた古い期間は `banked` へ繰り入れる（総額が保存され、レベルが下がらない）。
  ⚠️ 保持日数 `MISSION_XP_KEEP_DAYS = 150` は **`gamify.js` と `progress.js` の両方**にある。
  両側が同じ日付基準で同じ繰り入れをすることで、同期が繰り入れ済みのキーを復活させて
  二重加算するのを防いでいる。**片方だけ変えないこと**。

### 週次のペース表示

週次の行だけバーに「今そこまで進んでいるべき位置」の目盛り（`.gm-pace`）を引き、遅れている行の
数字をアンバーにする（`.behind`）。見出しに残り日数を出す。カウンタ型のミッションは理屈の上では
最終日でも巻き返せるので、**達成不能としてグレーアウトはしない**（遅れの提示までに留める）。

## ハブの円弧ゲージ＝「今日の目標」（2026-07-29〜）

`index.html` のヒーロー右の円弧ゲージは **「一日にやるべき問題数のうち何％まで来たか」**。
以前は生涯の全体進捗（済 / 全7472問）だったが、毎日ほとんど動かない数字だったので主役を降ろし、
**旧・全体進捗はゲージ下の小さな一行（`.gauge-all`）に残した**。

- **分子も分母も `MecGamify.dailyGoal()` が正本**（gamify.js）。日次ミッション `ans`（40問 解答する）の
  target と端末横断カウンタをそのまま借りる＝**ゲージのすぐ下に並ぶミッション行と必ず同じ数字**になる。
  index.html 側に目標値を持たせないこと（`DAILY_GOAL_FALLBACK` は gamify.js が読めない時の代用の1箇所だけ）。
  目標を変えたいときは `MISSIONS_DAILY` の `ans` の `target` を直す。
- ⚠️ **達成率を 100% で頭打ちにしないこと**。超えた日は `130%` と出す。弧だけが2周目
  （`.gauge-ovf`＝1周目に重ねて描く弧）に回り、200%超は2周目が満タンで止まる（**数字は素の値のまま**）。
  3桁は円からはみ出すので `.gauge-mid.wide` で一段字を落とす。
- 演出の段は `_goalTier(pct)`（0 / 1〜4=途中 / 5=達成 / 6=1.5倍超）。`data-tier` を `.gauge` に載せ、
  CSSが「発光 → 歯車列が速く回る → 盤面が脈打つ → 達成色」と層を積む。粒子は `_gaugeCelebrate(tier)`
  が同じ段構造で撒く（tier5以上でだけ画面全体に出る＝1日の山をそこに置く）。
- **祝砲は段が上がったときだけ鳴らす**（`_gaugeTierShown`）。Gist同期の完了で `renderHero()` は
  何度も走るので、条件を外すと同期のたびに祝砲が上がる。
- テスト: `node _work/test_daily_goal.js`（index.html から `_goalTier`/`_driveGauge`/`_gearPath`/`GEARS` を
  切り出して実行するので、関数名や `let _gaugeTierShown` の宣言を変えるとテスト側も直す必要がある）。

### スチームパンクの歯車（2026-07-29）

ゲージの意匠は**真鍮・銅の歯車列**。色はテーマに振らず固定（`.gauge` の `--brass`/`--brass-hi`/`--copper`）。
進捗の弧（`--or`／達成の `--gr`）とは別系統の色にして、「読み値」と「機械」を描き分けている。

- 歯車の `d` は `_buildGears()` が起動時に**歯数から生成**する（`_gearPath` + `_holePath`、`fill-rule:evenodd` で軸穴）。
  諸元は `GEARS` 定数：大24枚／小 a=12・b=16・c=10 枚。`gear-c` は段3から現れる。
- ⚠️ **速さは `--gear-t` 1本だけを動かすこと**。小歯車の duration は `calc(var(--gear-t) * 歯数比)` で、
  逆回り（`reverse`）。個別に `animation-duration` を上書きすると歯数比が崩れて噛み合いが嘘になる。
- ⚠️ 小歯車の位置は「歯先が大歯車の歯の領域（root〜tip）へ食い込む」距離で決めてある。
  座標を動かすと離れて浮くか、深く刺さって潰れる。`test_daily_goal.js` がこの寸法を守る。
- 粒子も同じ意匠。花火・紙吹雪・絵文字は使わず、**真鍮の火花（`shard`）・回る歯車（`gears`/`gearRain`）・
  蒸気（`steam`）**で作る。⚠️ 蒸気は `blend:false`（加算合成にすると湯気ではなく発光体になる）。
- canvas と SVG で歯車の実装が**2本ある**（`fx_engine.js` の `gearPath` と index.html の `_gearPath`）。
  テストは両方の輪郭を検査する（canvas側は rAF を掴んで1フレーム描かせて確認している）。

## 採点データの不変条件（試験モードが壊れる原因になる）

試験モードの必要選択数は **`.ch2.ok` の個数**（`_getRequiredCount()`・study_exam.js）で決まる。
`ans_label` や「Nつ選べ」バッジは採点に一切使われない。したがって:

- **`ok` が1つも無い問題は、何を選んでも不正解になる**（例外を出さず黙って全問不正解）。
  2026-07-09に呼吸器ch02〜ch09の429問がこの状態で、以前から「正解でも不正解」と報告されていた原因だった。
- 選択肢は `a`,`b`,`c`… の順で1つずつ独立した要素であること。`"a　①　/　b　②"` のように結合していると選べない。
- `ok` の個数は問題文末尾の「Nつ選べ」と一致すること（`複数正解`・`採点除外` バッジのある問題を除く）。
- 📷バッジ（`bi`）と `imgs` の有無は必ず一致させること（🖼️フィルタの根拠）。
  2026-07-24に jitsu1 53問・custom 8問で欠落が見つかり `_work/fix_missing_bi_badges.py` で修正した。
  同スクリプトを `--dry-run` で流せばいつでも検出できる（現在0件）。
- `N択` バッジは PDF の `↗N`（画像枚数と無関係の内部マーカー）を誤読していたことがある。**正解数の根拠は問題文の「Nつ選べ」のみ**。
- 連問の図は右段にまとめて置かれ、図の直下に `A` `B` `C` のラベルが描かれる。**帰属はラベル文字の座標で決めること**（読み順=A,B,C とは限らず、実際に `B A` の順で並ぶ紙面がある）。ステムが参照する図は連問1問目、後続の設問が参照する図はその設問に付ける。

### 選択肢を持たない問題（2026-07-26〜）

選択肢が0個の問題は**計算問題48問だけ**になった（2026-07-28に欠落分の復元が完了）。
`node _work/test_calc_input.js` の「選択肢を持たない問題は計算問題48件だけ」がこれを守る。

- **計算問題48問（科目33・過去問15）** — 原文がマークシートの桁入力。`ans_label` は
  **`計算答：<桁文字列>` の正規形**でなければならない（例 `計算答：2.0` `計算答：0.40` `計算答：315`）。
  桁数＝文字数、小数点位置＝文字列そのもの。**正解は数値ではなく桁文字列**で、`0.40` の
  先頭ゼロ・末尾ゼロは意味を持つ（数値化して `0.4` にすると採点が壊れる）。
  採点は完全一致・部分点なし。`calc_input.js` が入力欄を作り、`revealAnswer`（study_exam.js）／
  `ceSubmitCalc`（chapter_exam.js）が採点する。
  - 旧形式 `計算答：2,0`（カンマ区切り）は小数点位置が読めないので**戻してはいけない**。
    形式の統一は `node _work/normalize_calc_answers.js`（冪等・`--dry-run` あり）。
  - 同じ問題が questions_*.json と 国家試験過去問/*.html の両方にあるものが11問あり、
    正規化スクリプトはこれを使って桁数と小数点位置を相互検証・相互補完する。
  - ⚠️ 同じ正規表現が `calc_input.js`（CANON）・`build_qmeta.py`・`pdf_audit.py` の3箇所にある。
    `node _work/test_calc_input.js` が乖離を検出する。
- **選択肢データの欠落 — 26問すべて復元済み（2026-07-28完了）**。図のa〜eや組合せの選択肢が
  データから落ちていたもの。計算問題ではないので入力型では解決しない。
  12問はPDFのブロック解析で復元（下記）、残り14問は下記「表・図の選択肢の復元」で復元した。
  未解決の欠落が再発した場合の受け皿は残してある：試験モードは中立で開封して先へ通し
  （`_isExamUngraded`）、過去問側は出題から外して理由を表示する（`ceIsAnswerable`）。
  ⚠️ `117F74` だけ **a〜f の6択**（表が6行）。5択決め打ちのコードを書かないこと。

### 欠落選択肢のPDF復元（2026-07-26）

`python _work/extract_missing_choices.py` で抽出・検証 → `python _work/apply_missing_choices.py` で適用。
⚠️ この2本は `.gitignore` の `extract_*.py` / `apply_*.py` に該当し**Git管理外**（マシンローカル）。
別マシンでは再作成が必要。以下の知見はそのための記録でもある。
**テキストの並び順ではなくPDFのブロックを見る**のが要点。MEC解説集は1問が
「設問文＋選択肢」「着目point」「選択肢考察」「正解」「正答率（選択率）」の独立ブロックに
分かれており、素のテキスト順で切ると最後の選択肢（ｅ）が解説を飲み込む。

信頼度は PDF が持つ独立な3情報と `ans_label` の一致で判定する:
「正解」ブロック／選択率が最大の肢／全体正答率が `data-rate` と一致。2つ以上一致で `ok`。

- ⚠️ **`○`/`×` マーカーは検証に使えない**。MEC は「その記述が正しい」の意味で使う紙面と
  「これが正解」の意味で使う紙面が混在する（`116C-41` は `×ｃ` が正解、`116B-15` は `○ｄ` が正解で
  どちらも否定形の設問）。参考情報としてだけ出す。
- ⚠️ 検証材料はページ全体から拾ってはいけない。1ページに2問載る紙面があり前の問題の正解を
  拾う（`116C-41`）。次ページを無条件に足すと次問のマーカーを拾う（`116B-15`）。
  **選択肢ブロックの直後から「正答率」ブロックまで**で閉じる（`verify_region`）。
- 選択肢ラベルの直後は **U+0001**（PDF・過去問HTMLの qt 共通）。空白決め打ちでは切れない。

### 表・図の選択肢の復元（2026-07-28・残り14問を完了）

`python _work/restore_table_choices.py`（冪等・`--dry-run` あり・**Git管理下**）。
上の PDF ブロック解析では最後まで取れなかった14問。2種類あった。

- **表・図が選択肢の11問** — PDFからテキスト抽出すると列の対応が崩れるため、
  **ユーザーがスクリーンショットを撮って送り、それを目視で読んで書き起こした**。
  以後この形の問題はAI抽出せずスクリーンショットを依頼する（`_work/新科目HTML生成ガイド.md` §1）。
  書き起こしは**列見出しを各肢に埋め込む**（`ｃ　Na 75／K 0／Cl 75／…`）。
  表を別途置く方式は肢のシャッフルで対応が崩れるので採らない。単位は qt 末尾に注記。
- **カードごと別問題の紙面から作られていた3問**（`118C15` `119E7` `119E14`）— qt に隣の問題の
  check point の表が丸ごと入り、設問文も選択肢も失われていた。`119E14` は解説まで別問題
  （《処方箋》）のものだった。**`data-rate` と正解の肢は正しかった**ので、その2つが一致する
  問題をPDFから同定して設問文・選択肢・解説を復元した。同種の破損を探すときはこの2つを鍵にする。

### 正解肢（ok）が無いカードの修復（2026-07-28・過去問9件を完了）

`python _work/restore_missing_ok_flags.py`（冪等・`--dry-run` あり・**Git管理下**）。
選択肢はあるのに `ok` が1つも無い＝**何を選んでも黙って不正解**になる過去問カード9件を直した。
`node _work/test_calc_input.js` の「正解肢が無いカードは0件」がこれを守る（1件でも増えると落ちる）。

- **7件は正解ラベル(`ac`)ごと空**だった＝抽出時に「正解」ブロックを取り落としたもの。
  **9件中7件が「2つ選べ」**で、複数正解の問題ほど落ちやすい。
  PDFの「正解」ブロックを正本に、選択率が最大の肢・`data-rate` との一致で裏取りしてから入れる。
- **2件は計算問題に別の設問の選択肢が付いていた**（`117F71` `118C73`）。選択肢を外して
  `calc_input.js` の入力型に戻し、`node _work/normalize_calc_answers.js` で
  `計算答：6,5`→`計算答：65` に正規化した。**選択肢を持つカードは normalize の対象外**なので、
  この2件だけ旧カンマ形式が残り続けていた（バグが別のバグを隠していた例）。
  これで計算問題は48→**50問**。

### ⚠️ 未解決：連問（次の文を読み〜）のサブ設問が設問文と選択肢を共有している（147カード）

上の `117F71` を調べる過程で見つかった**別口の未解決問題**。過去問カード1825枚のうち
**147枚が「直前のカードと qt も選択肢も完全一致」**している。連問（`次の文を読み、71〜73の問いに答えよ`）を
HTML化したときにサブ設問ごとに切り分けられず、グループ内の全カードが**同じ設問文と同じ1組の選択肢**を
持ってしまっている。正しいのはグループ内の1問だけで、残りは別の設問の選択肢で出題・採点される。

- 検出: 連続するカードで `qt` と `.ch2` の並びが完全一致するものを数える（147件・
  一致したものは**例外なく選択肢も一致**していた）。
- `ac`（正解ラベル）の肢の文字は正しいことが多いので、`.ch2.ok` の位置は合っていても
  **表示される選択肢の文言が別設問のもの**という壊れ方をする。件数チェックでは見つからない。
- 直すには PDF から**サブ設問ごとの設問文と選択肢**を取り直す必要がある（PDFでは
  `72　この患者で認める可能性の高い身体所見はどれか。ａ…ｅ…` のように番号始まりの独立ブロックに
  なっているので機械的に切り出せる見込み）。表が選択肢のサブ設問はスクリーンショット依頼になる。

検査は `python _work/pdf_audit.py {sid}` （PDFを正本に中身まで照合。`--no-image` で画像照合を省略）。
選択肢0個の問題は以前は無検査でスキップしていたが、正解データが解釈可能かを検査するようにした。
既存の `_work/audit_image_mismatch.py` はファイル名しか見ないため、ページのスクリーンショットが
正しい名前で貼られているケースを見逃す。`pdf_audit.py` はこれを知覚ハッシュで検出する。

## 弱点分析（2026-07-23〜）

「事実の抽出はJS、解釈だけAI」が方針。指標はローカルの決定論コードで計算し、AIには数字の解釈だけ聞く。
AIを呼ばなくても stats.html の弱点カルテとして単体で成立する。

```
attempts.js (mec_attempts_v1)  ← 解答イベントの生ログ（時刻・出題順・所要秒・選んだ肢）
qmeta.json  (build_qmeta.py)   ← 設問形式の自動分類
        ↓
stats.html「🩺 弱点カルテ」     ← 科目×設問形式ヒートマップ／本番正答率帯カーブ
        ↓
「AI相談用にコピー」のMarkdown  ← 集計済みの表だけを渡す（問題文は含めない）
```

- **正誤が記録されるのは試験モード＋SRSのみ**（`_recordMyRate`／`_logAttempt`・study_exam.js）。
  通常モードの「済」はSRSに正解扱いで入るだけで正誤は残らない。分析の母数はこれで確定。
- `questions_*.json` を更新したら `python _work/build_qmeta.py` を流して qmeta.json を作り直す。
- ヒートマップの配色は**アンバー単一色相の逐次ランプ**（強い＝面に沈む／弱い＝明るく浮く）。
  塗りだけに意味を負わせないよう全セルに％と受験回数を印字してある。赤緑は使わない。
- AIへ渡すのは uid・章・形式タグ・成績まで。**問題文・解説の全文は送らない**（MEC教材の著作物）。
  個別に深掘りする場合だけ対象を数問に絞って手で添付する。
- テスト: `node _work/test_attempts.js`（ログ）・`node _work/test_karte.js`（集計）・
  `node _work/test_merge_remote.js`（同期マージ）。いずれも実ソースを読み込むのでロジックの二重管理は無い。

## テスト一覧

いずれも実ソースを読み込む（ロジックの二重管理をしない）。コミット前に全部通すこと。

```
node _work/test_attempts.js        解答イベントログ            (9)
node _work/test_karte.js           弱点カルテの集計            (14)
node _work/test_merge_remote.js    Gist同期のマージ戦略        (63)
node _work/test_streak.js          連続日数と activity_v1      (9)
node _work/test_copy.js            クリップボード/2段階タップ  (17)
node _work/test_today_learning.js  ハブの「今日解いた問題」
node _work/test_srs_grade.js       SRSの自己採点3段階          (10)
node _work/test_subject_totals.js  科目別問題数の三者一致      (3)
node _work/test_card_render.js     カード描画（画像実寸・採点ボタン）(7)
node _work/test_calc_input.js      計算問題の桁入力・データ整合      (29)
node _work/test_missions.js        日次/週次ミッション          (36)
node _work/test_daily_goal.js      ハブのゲージ・歯車の意匠      (29)
node _work/check_effect_themes_sync.js  演出テーマのミラー整合
```

`test_subject_totals.js` は questions_*.json / `gamify.js`の`SUBJECTS` / `chapters_meta.js`
の3か所に散らばった問題数が一致しているかを見る。問題を増減したら必ずここが落ちる。

## 試験モードの演出エフェクト仕様

試験モード（🎓）で選択肢を選んだ瞬間に発火する視覚エフェクトの仕様。実装は `study_exam.js`（統合study.html用）と `chapter_exam.js`（章別過去問用・同一配色をミラー）。CSSアニメの一部は `study.css`。パーティクル描画は `fx_engine.js`（`window.MecFX`）。

### 演出セット（テーマ）
- 全7セット: `classic` / `neon` / `ink` / `ecg` / `space` / `retro` / `luxury`（`EXAM_EFFECT_SETS`）。定義本体は `EXAM_EFFECT_THEMES`（study_exam.js）。
- **試験開始ごとにランダム選択**（ユーザー選択UIは無い・localStorage永続もしない）。`EXAM_EFFECT_POOL` は classic を1票・他を各2票の重み付き（classicは他の半分の確率）。
- セットは正解／連続正解エフェクトの見た目（配色パレット・絵文字・ラベル・雷/紙吹雪/花火などのON/OFF）を丸ごと切り替える。各テーマは `burstPalettes` `labels(n)` `comboLabel(n)` `comboColors` `fullscreenCols/Glow` `flashColors` `borderColors` `meterGrads` `floaterGlyphs` `correctEmoji` `use*`（useConfetti/useFireworks/useLightning/useGlitch 等のフラグ）を持つ。
- ⚠️ `body.exam-effect-*` クラスのCSS定義は `neon`/`ink` のみ（`study.css`）。他セット（ecg/space/retro/luxury）はJS（`EXAM_EFFECT_THEMES` + `MecFX`）だけで描画される。classicは `body` クラス無し。

### 正解時（単発・連続数に関係なく毎回）
`_triggerChoiceCorrectPop()`:
- 選んだ選択肢を pop（scale+brightness、420ms）＋カードを bounce（480ms）＋ `popOverlay` 色オーバーレイをカードに重ねてフェード。
- フローティングコンボ `_spawnFloatingCombo()`: カード上に浮かぶ数字。連続1（＝単発）は `+1`、2以上は `comboLabel(n)`（例 classic=`×n COMBO!`）。上へ飛んで消える（900ms）。
- classic以外は `correctEmoji`（例 neon=`⚡️💠🔷`）を6個バースト（`MecFX.glyphBurst`）。

### 連続正解時（ストリーク）
連続数 `examStreak` は正解で+1、**不正解で0にリセット**。ティア判定 `_examTier(n)`:

| tier | 連続数 n |
|---|---|
| 1 | 2〜3 |
| 2 | 4〜6 |
| 3 | 7〜9 |
| 4 | 10〜14 |
| 5 | 15〜19 |
| 6 | 20〜 |

`_showStreakEffect(n)` は **n≥2 でのみ発火**し、tierに応じて段階的に増える:
- **全tier(≥2)**: 上部トースト（`t1`〜`t6`、`labels[tier]` 例 classic=`🔥 n連続！！`）＋ 背景ブレス（`_triggerBgBreath`）＋ コンボ音（`_playComboNote`・設定キー `mec_combo_sound_v1`）＋ 上端コンボメーター（`_updateComboMeter`）
- **tier≥2**: 画面中央に特大 `×n`（`_triggerFullscreenCombo`）＋ 全画面フラッシュ（`flashColors`）＋ ストリーク粒子（`_spawnStreakParticles`）
- **tier≥3**: 画面シェイク（`_triggerScreenShake`）
- **tier≥4**: タイムストップ暗転（`_triggerTimeStop`）＋ 画面外周ボーダーグロー（`_triggerBorderGlow`）＋ フラッシュが複数回パルス
- **tier≥5**: 絵文字フローター群（`floaterGlyphs`）＋ グリッチ（`useGlitch`）or 墨スワイプ（`useBrushSwipe`）＋ dust（luxury/space）
- 個別フラグで花火・雷・紙吹雪・CRT・ECGスイープ・ブラックホール等がテーマごとに追加（`use*`）。

### 章別（chapter_exam.js）との関係
過去問ビューア側は `CE_EFFECT_THEMES` / `CE_EFFECT_POOL` として同一配色をミラー実装。片方の配色・ラベルを変えたら**もう片方も合わせる**こと。乖離は `node _work/check_effect_themes_sync.js` で自動検出でき、pre-commitフックが study_exam.js / chapter_exam.js のステージ時に自動実行する（study側のみの `fx` キーは除外。フックはGit管理外＝別マシンでは要再設定）。

## 科目選択は単一選択（2026-07-20〜）

study.html の科目チップは**1科目だけ選べる**。「全科目」ボタンは廃止した。

- **理由**: 全科目選択は最大5487問（約22万ノード）をDOMに載せ、iPad/iPhone がメモリ退避で
  タブを強制リロードする主因だった。実運用でも複数科目を同時に開く場面が無かった。
- **効果**: DOMは常に1科目ぶん（最大594問・神経）に固定される。
- `toggleSubjectChip` が「前の科目を `_unloadSubjectCards` で捨ててから次を読む」を担保する。
  同じチップの再タップで未選択に戻れる（`#mecNoSubj` の案内が出る）。
- `applyFilters` は元々 `selectedSubjects` に限定されているため、難易度・状態・検索・
  🎯苦手・🔔復習の**すべてが選択中の1科目内**になる。これは仕様。
- 科目横断が必要な用途には既に代替がある:
  - 苦手 → stats.html の苦手ランキング（科目横断）から `study.html?sid=X&filter=weak`
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

GitHub Gist API で `mec_progress.json` に進捗を保存。
`index.html` の「同期設定」から PAT と Gist ID を登録。
マージ戦略：done はunion（周回数は大きい方）。

## 大量ファイル変更時の注意

章ファイルは78個ある（9科目）。共通パターンの変更はPythonスクリプトで一括処理すること。
変更後は必ず数ファイルで動作確認してからコミットする。

## データソースの方針（2026-07-04〜）

- **解説・問題文の編集は必ず `questions_{prefix}.json` を対象にすること。** 章別HTML(`{科目}/ch*.html`)は編集対象ではない（study.htmlから参照されないため、直しても画面に反映されない）。
- 過去に神経・血液で「HTMLだけ強化してJSONに未反映」「科目ごとにcls命名がバラバラ(`em` vs `eem`)」という事故が発生済み。新しく解説を追加する科目でも同じ命名規則を使うこと。
- `eg`配列の`cls`命名規則（共通）: `ep`=病態, `ee`=鑑別, `ept`=国試ポイント, `em`=選択肢別解説（またはニーモニック）, `ec`=計算, `ei`=画像所見。`study.css`内のCSS(`.ep` `.ee` `.ept` `.em` `.ec` `.ei`)で色分けされるため、独自クラス名を作らない（旧: study.html内インライン。2026-07-05にstudy.cssへ外出し）。
- `questions_*.json` の整形はファイルごとにバラバラ（compact＝jitsu1 / indent=1+CRLF＝resp / 手書き混在＝custom）。**書き戻しで整形を変えないこと**。1問直しただけで全行が差分になりレビュー不能になる。`_work/fix_missing_bi_badges.py` が「往復で再現できるならjson.dumps、できなければ行単位パッチ」の実装例。
- 画像を追加・差し替えたら `python _work/build_image_dims.py` で `image_dims.json` を作り直す（`<img width height>` の材料。忘れるとその画像だけレイアウトシフトが戻る）。
- 画像は `python _work/compress_images.py`（長辺1200px・JPEG q85・**ファイル名は不変**）を通す。2026-07-24に全2544枚で461MB→228MBにした。パスが変わらないのでJSON/HTML/sw.jsの書き換えは不要。
- ⚠️ pre-commitフックは`.git/hooks/pre-commit`にありGit管理外（マシンローカル）。別マシンでcloneした際は再設定が必要。現在は「演出テーマ乖離チェック」と「画像整合性チェック」の2本。
- 章別HTMLをJSONへ完全移行し終えた科目から `_archive/{科目}/` へ`git mv`する。移行未完了（HTML側にのみ存在する解説がある）科目は先にJSONへマージしてから移動する。
