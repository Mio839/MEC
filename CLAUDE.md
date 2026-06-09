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
| `study.html` | 統合学習ツール（全3826問・フィルター・SRS） |
| `index.html` | ハブダッシュボード（全8分野の進捗表示・ナビ） |
| `progress.js` | 共有モジュール：localStorage + GitHub Gist 同期 |
| `stats.html` | 学習統計ページ（30日チャート・SRS統計） |
| `内分泌/` `呼吸器/` `循環器/` `消化器/` `神経/` `肝胆膵/` `腎臓/` `血液/` | 各科目の解答解説 HTML（各章ファイル） |

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
| **合計** | **73章** | **3826問** |

## localStorage キー（全ページ共通）

- `done_v2` — UID → 周回数（整数、0=未済）
- `srs_v2` — UID → `{interval, ease, next, count}`
- `flag_v2` — 苦手UID → 1
- `memo_v2` — UID → メモ文字列
- `activity_v1` — YYYY-MM-DD → 操作回数
- `mec_gist_token` — GitHub PAT（gistスコープ）
- `mec_gist_id` — Gist ID

## UID フォーマット

- 各科目解説: `{prefix}_ch{nn}_q{n}` 例: `endo_ch01_q1`, `resp_ch02_q3`, `jinzo_d_ch03_q136`
- 科目prefix: `endo` / `resp` / `circ` / `dige` / `neur` / `hbp` / `jinzo_d` / `hema`

## UI 構造（study.html・各章共通）

### フィルター（2行）
- 行1（難易度）: 全問 / 難問(<60%) / 標準(60-80%) / 易問(≥80%) / 正答率なし / ★問題 / 🖼️画像
- 行2（状態）: すべて / 🚩赤旗 / 🔔要復習 / 未済 / 済み

### カード内ボタン
- `🚩` 赤旗ボタン（`mecToggleFlag`）
- `済` 周回ボタン（`mecIncrLap`）: 押すたびに周回数 +1、数字が横に表示
- SRS（わかった / 迷った / わからない）
- 📝 メモエリア

## 複数デバイス同期

GitHub Gist API で `mec_progress.json` に進捗を保存。
`index.html` の「同期設定」から PAT と Gist ID を登録。
マージ戦略：done はunion（周回数は大きい方）、srs はcount大優先、memo はローカル優先。

## 大量ファイル変更時の注意

章ファイルは73個ある。共通パターンの変更はPythonスクリプトで一括処理すること。
変更後は必ず数ファイルで動作確認してからコミットする。
