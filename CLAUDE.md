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
| `study.html` | 統合学習ツール（全4429問・フィルター） |
| `index.html` | ハブダッシュボード（全9分野の進捗表示・ナビ） |
| `progress.js` | 共有モジュール：localStorage + GitHub Gist 同期 |
| `stats.html` | 学習統計ページ（30日チャート・SRS統計） |
| `questions_*.json` / `questions_*.js` | **問題データの正本**。study.htmlはこれを読み込んで表示する（.jsはfile://フォールバック用の同内容コピー） |
| `内分泌/` `呼吸器/` `循環器/` `消化器/` `神経/` `肝胆膵/` `腎臓/` `血液/` `免アレ膠/` | 各科目のフォルダ（画像・selfcheck_intro.html等）。章別解答解説HTML(ch01.html等)は旧世代の遺物でstudy.htmlからは参照されない → `_archive/{科目}/`へ順次移動中 |
| `_archive/` | 到達不能になった旧・章別HTMLの保管先。編集対象外、読み物としてのみ残す |
| `vars.css` | 共通CSSカスタムプロパティ（全ページ共通色変数） |

## 問題数

| 分野 | 章数 | 問題数 |
|---|---|---|
| 内分泌 | 10 | 542 |
| 呼吸器 | 9 | 506 |
| 循環器 | 10 | 572 |
| 消化器 | 11 | 501 |
| 神経 | 11 | 594 |
| 肝胆膵 | 8 | 418 |
| 腎臓 | 6 | 315 |
| 血液 | 8 | 378 |
| 免アレ膠 | 5 | 247 |
| 感染症 | - | 356 |
| 小児科 | 13 | 373 |
| **合計** | **91章+** | **4802問** |

## localStorage キー（全ページ共通）

- `done_v2` — UID → 周回数（整数、0=未済）
- `flag_v2` — 苦手UID → 1
- `activity_v1` — YYYY-MM-DD → 操作回数
- `mec_gist_token` — GitHub PAT（gistスコープ）
- `mec_gist_id` — Gist ID

## UID フォーマット

- 各科目解説: `{prefix}_ch{nn}_q{n}` 例: `endo_ch01_q1`, `resp_ch02_q3`, `jinzo_d_ch03_q136`
- 科目prefix: `endo` / `resp` / `circ` / `dige` / `neur` / `hbp` / `jinzo_d` / `hema` / `imma` / `kansen`

## UI 構造（study.html・各章共通）

### フィルター（2行）
- 行1（難易度）: 全問 / 難問(<60%) / 標準(60-80%) / 易問(≥80%) / 正答率なし / ★問題 / 🖼️画像
- 行2（状態）: すべて / 🚩赤旗 / 未済 / 済み

### カード内ボタン
- `🚩` 赤旗ボタン（`mecToggleFlag`）
- `済` 周回ボタン（`mecIncrLap`）: 押すたびに周回数 +1、数字が横に表示

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
過去問ビューア側は `CE_EFFECT_THEMES` / `CE_EFFECT_POOL` として同一配色をミラー実装。片方の配色・ラベルを変えたら**もう片方も合わせる**こと（乖離リスク・改善案バックログ参照）。

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
