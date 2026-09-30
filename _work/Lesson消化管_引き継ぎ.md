# Lesson消化管（lesdige） 作業ノート

> **この科目に手を入れるときはここを読む。** CLAUDE.md の表には「何のフォルダで、どう再生成するか」だけを置く。

---

**Lesson消化管（prefix `lesdige`・🍙・#E0829C）**。2026-09-30 新設。PDF は `MEC問題文pdf/` の2冊:

| 冊子 | 中身 | 使い方 |
|---|---|---|
| `2026Lesson消化管.pdf`（9p） | 問題1〜20（問題9は ①② の2問）と Dr. のコメント（▷ の行）・前半／後半のまとめ | 1章21問（Q.1〜21）。紙面の番号はバッジ `bb`「Lesson 問題N」（問題9は「問題9①」「問題9②」） |
| `2026Lesson消化管　参考資料・問題リスト.pdf`（5p） | 参考資料1〜22（スライド）と p.5 の使用問題リスト（国試番号・改変有無・テーマ・授業内解答） | 解説の引用元（生成器は読まない）。解答・テーマは生成器の `ANS` に書き写してある |

## 方針（2026-09-30 ユーザー判断）

- study.html の**新科目1つ**（dige に章を足すのではない）。
- 解説は**最低限でPDFからの引用**。✅の下（`ans_sub`）＝出題テーマ＋1行の理由、`📖 テキストより` ブロック＝
  Lesson 本文の ▷ の行と参考資料の文言そのまま（`_work/lesdige_notes.json`）。
- **作り直した解説があればそれも引用**＝消化器 `dige` の同じ国試番号の解説を**全問ぶん**借りる（オリジナル2問を除く）。
  MEC が「改変」した13問は選択肢・正解が原題と違うので、借りた解説の前に `📎` ブロックで注記と
  **原題の選択肢・正解**を出し、全国正答率は載せない。改変なしの6問は選択肢と正解の一致を確かめてから正答率も借りる
  （`same_question` が落ちたら生成が止まる）。
- 参考資料の図（解剖図・内視鏡の模式図など）は入れていない。参考資料9・12・13は画像のスライドなので、250dpi で描画して書き起こした。
  参考資料21・22（整理ノートの作り方）は問題に紐づかないので使っていない。

## 再生成

```bash
python _work/build_lesdige_json.py --figs   # 設問の図を Lesson消化管/images/ へ（5枚）
python _work/build_lesdige_json.py          # questions_lesdige.json（--check で一致確認）
python _work/build_image_dims.py && python _work/build_qmeta.py && node _work/build_natrate_index.js && node _work/build_dup_index.js
python _work/pdf_audit.py lesdige           # 0件
```

⚠️⚠️ **questions_lesdige.json は派生物——直接編集しないこと。** 解説は `_work/lesdige_notes.json`（キー＝紙面の問題番号・問題9は `9a`/`9b`）を直す。
⚠️ **dige の解説を直したら、この科目も作り直すこと**（借用は生成時のコピー。run_all の `--check` が食い違いを見張る）。

## 版面の罠

- 組版は Lesson 呼吸器と同じ＝行の読み取りは `sumresp_pdf.parse_lesson` をそのまま使う。
  CJK 部首補助の「⺟」（問題12 の「発生⺟地」）は `sumresp_pdf.RADICAL_SUP` に無いので、生成器の `EXTRA_RADICAL` で直す。
- 問題9 は1つのステムに ①（110D-21・改変なし）と ②（118D-24 改変）の問い。パーサは ② の問いを「選択肢の後ろに残った行」として拾い、
  選択肢を10個つなげるので、生成器が5つずつに切り分ける。
- **問題19 は本文の国試番号が「110A-19 改変」だが問題リストは「109A-18」**。選択肢（拡張術・結紮術・硬化療法）と問いが dige の 109A-18 と同じ＝本文の誤植。問題リストに合わせた。
- **問題19 は「上部消化管内視鏡像を示す」とあるのに紙面に図が無い**。原題の図 `消化器/images/109A-18_1.jpeg` を借りて載せ、📎 ブロックに断り書きを出している。
  `pdf_audit.py` のファイル名照合は episode の「改変」を落として比べる。
- p.1 の小さい画像（x=305, y=394）は参考資料1への手書きの胃のイラスト＝設問の図ではない。

## 借用元で気づいたこと（未対応）

- dige Q.342（118D-24）の解説は、先頭の「💊 機能性ディスペプシア診断とNSAIDの問診」ブロックが「問診で確認すべきもの」の話になっていて、
  選択肢解説（「治療で用いられないもの」＝NSAID）と噛み合っていない。借用先の lesdige Q.10 にもそのまま出る。

## 登録先

study.html（チップ・セクション・`STUDY_SUBJECTS`）／gamify.js `SUBJECTS`（total 21）／chapters_meta.js／progress.js `SID_NAMES`／
study_exam.js `subjNameMap`／sw.js `CARDS`／mindmap_data/index.js（生成）／pdf_audit.py／run_all.js（`--check`）／
build_dup_index.js の `LATE`（代表は dige 側）／テスト3本（card_render・hub_radar の除外・subject_totals の区分「サマライズ・Lesson」）。
ハブの実力レーダーには入れていない（サマライズ呼吸器と同じ扱い）。
