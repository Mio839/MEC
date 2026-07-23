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
| `card_renderer.js` | JSON→カードHTML描画（`window._renderSubjectFromJson`、エスケープ処理あり） |
| `fx_engine.js` | エフェクトのCanvas描画エンジン（`window.MecFX`：粒子・花火・グリフバースト等） |
| `sw.js` | Service Worker（オフラインキャッシュ）。`CACHE`版数は**questions_*.json更新時のみbump**（bumpで全キャッシュ削除＝15MB再DL）。SHELL/CARDSにパス列挙。相対パス必須 |
| `chapters_meta.js` / `rate_index.js` | stats.html等が参照する章メタ・正答率インデックス（`_work/build.py`系で再生成） |
| `questions_*.json` / `questions_*.js` | **問題データの正本**（.json）。study.htmlはこれを読み込んで表示。.jsはfile://フォールバック用コピーで**pre-commitフックが自動生成**（[データソースの方針]参照） |
| `国家試験過去問/` | 過去問ビューアHTML（`chapter_exam.js`で試験モード）。PDFは`.gitignore`済み・追跡はhtmlのみ |
| `chapter_exam.js` | 過去問ビューアの試験モード（`CE_EFFECT_THEMES`＝study_exam.jsの演出を同配色でミラー） |
| `内分泌/` `呼吸器/` `循環器/` `消化器/` `神経/` `肝胆膵/` `腎臓/` `血液/` `免アレ膠/` | 各科目のフォルダ（画像・selfcheck_intro.html等）。章別解答解説HTML(ch01.html等)は全科目 `_archive/{科目}/` へ移動済み（2026-07-07完了） |
| `産婦人科/` | 章別HTML(ch01〜ch13)＋`images/`＋`obg_questions.json`（メタ）。HTMLが`questions_obg.json`のソース＝`_work/build_obg_json.py`で再生成 |
| `_archive/` | 到達不能になった旧・章別HTMLの保管先。編集対象外、読み物としてのみ残す |
| `vars.css` | 共通CSSカスタムプロパティ（全ページ共通色変数） |
| `_work/` | ビルド・検証・マージ用スクリプト（`build.py`・`gen_js_from_json.js`・`check_json_js_sync.js`・`pdf_audit.py`・`test_merge_remote.js`・`build_qmeta.py`・`test_attempts.js`・`test_karte.js`等） |

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
| 実力試験Ⅰ | jitsu1 | 2 | 160 |
| 自作問題 | custom | 1 | 可変（現在28） |
| **総合計** | | **129章** | **約5675問** |

※ `study.html` タイトルの「5487問」はコア12科目の合計。実力試験・自作・暗記メモは追加セクション。

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
- 科目prefix（全14）: `endo` / `resp` / `circ` / `dige` / `neur` / `hbp` / `jinzo_d` / `hema` / `imma` / `kansen` / `peds` / `obg` / `jitsu1` / `custom`

## UI 構造（study.html・各章共通）

### フィルター（2行）
- 行1（難易度）: 全問 / 難問(<60%) / 標準(60-80%) / 易問(≥80%) / 正答率なし / ★問題 / 🖼️画像
- 行2（状態）: すべて / 🚩赤旗 / 未済 / 済み

### カード内ボタン
- `🚩` 赤旗ボタン（`mecToggleFlag`）
- `済` 周回ボタン（`mecIncrLap`）: 押すたびに周回数 +1、数字が横に表示

## 採点データの不変条件（試験モードが壊れる原因になる）

試験モードの必要選択数は **`.ch2.ok` の個数**（`_getRequiredCount()`・study_exam.js）で決まる。
`ans_label` や「Nつ選べ」バッジは採点に一切使われない。したがって:

- **`ok` が1つも無い問題は、何を選んでも不正解になる**（例外を出さず黙って全問不正解）。
  2026-07-09に呼吸器ch02〜ch09の429問がこの状態で、以前から「正解でも不正解」と報告されていた原因だった。
- 選択肢は `a`,`b`,`c`… の順で1つずつ独立した要素であること。`"a　①　/　b　②"` のように結合していると選べない。
- `ok` の個数は問題文末尾の「Nつ選べ」と一致すること（`複数正解`・`採点除外` バッジのある問題を除く）。
- 📷バッジ（`bi`）と `imgs` の有無は必ず一致させること（🖼️フィルタの根拠）。
- `N択` バッジは PDF の `↗N`（画像枚数と無関係の内部マーカー）を誤読していたことがある。**正解数の根拠は問題文の「Nつ選べ」のみ**。
- 連問の図は右段にまとめて置かれ、図の直下に `A` `B` `C` のラベルが描かれる。**帰属はラベル文字の座標で決めること**（読み順=A,B,C とは限らず、実際に `B A` の順で並ぶ紙面がある）。ステムが参照する図は連問1問目、後続の設問が参照する図はその設問に付ける。

検査は `python _work/pdf_audit.py {sid}` （PDFを正本に中身まで照合。`--no-image` で画像照合を省略）。
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
- `questions_{prefix}.json`を更新したら同名の`.js`(`window["_cardJSON_{prefix}"]=<JSON>;`形式・file://フォールバック用)も一致させる必要がある。**pre-commitフックが`node _work/gen_js_from_json.js`で自動再生成＋add**するため手動再生成は不要（2026-07-05〜）。ズレるとfile://環境でのみ古いデータが表示される。
  - 手動で再生成する場合: `node _work/gen_js_from_json.js [prefix...]`（引数なしで全科目）。整合性検証は `node _work/check_json_js_sync.js`。
  - ⚠️ フックは`.git/hooks/pre-commit`にありGit管理外（マシンローカル）。別マシンでcloneした際は再設定が必要。
- 章別HTMLをJSONへ完全移行し終えた科目から `_archive/{科目}/` へ`git mv`する。移行未完了（HTML側にのみ存在する解説がある）科目は先にJSONへマージしてから移動する。
