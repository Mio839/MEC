# 新科目 章別HTML 生成ガイド（最終版品質のためのプロンプト）

MECの講座PDFから**新しい科目**の章別HTML（`{科目}/chNN_*.html`）を作り、study.htmlへ統合するときの手順・品質基準。
2026-07-26 に精神科(psy)第1章を産婦人科(obg)水準へ仕上げた経過から抽出した「最初から最終版で作る」ための指示書。
**次に別科目を作るときは、まずこのファイルを読んでから着手すること。**

参照実装:
- 生成器: `_work/build_psy_ch01.py`（`EXTRA`辞書で肢別解説を後付けマージする方式）
- JSON変換: `_work/build_psy_json.py`（HTML→`questions_{sid}.json`。obg版と同構造）
- 手本の質: `産婦人科/ch01_sanfujinka_soron.html`（＝到達すべき解説の厚み）

---

## 0. 最重要の心得

1. **解説の厚みが命**。表を足しただけでは産婦人科水準にならない。下記「品質基準」の数値を満たすまで書く。
2. **正解データを絶対に間違えない**。採点は `.ch2.ok` の個数だけで決まる（`ans_label`やバッジは不使用）。ok欠落＝黙って全問不正解。
3. **医学的正確性はユーザーの抜き取り確認が前提**。解説はPDFに無くAIが執筆するので、その旨を必ず伝える。

---

## 1. データ抽出フロー

### PDFがmojibake（文字化け）で開ける場合
MEC講座PDFは埋め込みフォントにToUnicodeが無く、テキスト抽出すると化ける（例: `ϝοΫ`=MEC）。
→ **PyMuPDF(fitz)でページを画像化し、Readツールで視覚的に読む**。

```python
import fitz
d = fitz.open(r'MEC問題文pdf/....pdf')
d[p-1].get_pixmap(dpi=150).save(f'{SCRATCH}/p{p}.png')   # 1問3枚前後/ページ
```

### 何を読むか（正本の順序）
- **巻末の「解答一覧表」が正解・正答率の正本**。NO→解答(a / a,c 等)・国試番号・種別(★)・CBT・必修/一般/臨床・正答率が1表に載る。章の区切り（「2 統合失調症」等）もここで分かる。→ まずこの表を全ページ読んで表化する。
- 各問題ページから**問題文＋選択肢a〜e**を書き起こす（正解/正答率は表から引く）。
- **画像問題**は `page.get_images()` で埋め込みJPEGを抽出し、`{科目}/images/{国試番号}_1.jpeg` として保存。どれがどの設問の図かは画像を目視で確認して割り当てる。

### 転記はスクラッチに保存しながら
長丁場なので `{SCRATCH}/chNN_transcription.md` に問題文・選択肢・正解・正答率を追記しつつ進める（コンテキスト圧縮対策）。

---

## 2. 品質基準（産婦人科水準＝これを満たすまで書く）

`questions_{sid}.json` を集計して数値で検証する（下の検証スクリプト参照）。

| 指標 | 目標（obg第1章の実測） | 意味 |
|---|---|---|
| 1問あたり解説ブロック数 | **3.8前後** | ep＋ee＋em＋ept の4枚が基本 |
| 1問あたり解説文字数 | **500字以上** | 病態を機序で書くと届く |
| 1問あたりkw強調数 | **10個以上** | 重要語を色付きで立てる |

### 各問の解説ブロック構成（`.eb` の cls）
1. **`ep` 病態／定義**（青）… 疾患・概念を**機序で段階的に**書く。例「黄体退縮→ホルモン急減→らせん動脈攣縮→虚血壊死→剝脱」。症状学・検査の分類問題でも「その用語の定義＋位置づけ」を1枚書く。
2. **`ee` 選択肢の検討**（緑）… **全選択肢a〜eを1つずつ**「なぜ正解／不正解か」を表で解説。正解肢は `<span class="kw3">◯ …</span>` で強調。**これを全問必須にする**。
3. **`em` 深掘り／覚え方**（紫）… 正解肢の深掘り・ニーモニック・鑑別のコツ・対比。ee表の繰り返しにしない。
4. **`ept` 国試ポイント**（オレンジ枠）… 番号つき複数項目＋**関連疾患・発展知識へ横展開**（例: Asherman症候群, Fitz-Hugh-Curtis症候群）。

### 文章の書き方
- 重要語は `<span class="kw">…</span>`（強調）/ `kw3`（正解・肯定）/ `kw4`（注意・誤り）で色付け。1ブロックに2〜3個。
- 比較・鑑別は `<table class="tb">` で表化すると密度が上がる。
- CSSクラスは study.css が持つ: `.ep .ee .ept .em .ec .ei .kw .kw2 .kw3 .kw4 .tb`。独自クラスを作らない。

---

## 3. カード/データ構造（HTML→JSON）

章別HTMLは `産婦人科/ch*.html` と同一構造。`build_{sid}_json.py`（obg版のコピー）がHTMLをパースして `questions_{sid}.json` を出す。

カード骨格:
```html
<div class="qc" id="qN">
  <div class="qh">
    <span class="qn">Q.N</span><span class="qe">(国試番号)</span>
    <span class="bg bs">★</span>          <!-- 種別バッジ。bs=★, bc=CBT, bh=必修, bi=📷 画像 -->
    <span class="cr ch">98%</span>          <!-- cr=正答率。ch=緑(≥80) cm=黄(60-79) cl=赤(<60) -->
  </div>
  <div class="qb">
    <div class="qt">症例…<br><strong>問い</strong></div>   <!-- 知識問題は<strong>のみ -->
    <div class="qimg-row"><img src="images/国試番号_1.jpeg" alt=""></div>  <!-- 画像問題のみ -->
    <div class="cs">
      <div class="ch2">ａ　…</div>
      <div class="ch2 ok">ｃ　…</div>       <!-- ok=正解肢。全角字＋全角空白＋本文 -->
    </div>
    <div class="ab"><span class="ai">✅</span><div><div class="ac">正解ラベル</div><div class="as">一言サマリ</div></div></div>
    <div class="eg"><!-- ep→ee→em→ept の順で .eb を並べる --></div>
  </div>
</div>
```

- uid = `{sid}_chNN_qN`（例 `psy_ch01_q1`）。JSONの画像パスは `build`が `images/…`→`{科目}/images/…` に補正する。
- 生成器は**選択肢を `(letter, text, ok, why)` の4つ組**で持ち、`ee`表を自動生成すると肢別解説を書き漏らさない（psy版の`_choice_table`参照）。
- 追加解説（ep/em）は**国試番号キーの`EXTRA`辞書で後付けマージ**すると、選択肢データを壊さず厚みを足せる（psy版参照）。

---

## 4. 採点・画像の不変条件（壊すと試験モードが無言で誤採点）

- **`ok`が1つも無い問題を作らない**（何を選んでも不正解になる）。
- `ok`の個数＝問題文末尾の「Nつ選べ」と一致（複数正解・採点除外バッジ問題を除く）。
- **📷バッジ(`bi`)と`imgs`の有無を必ず一致**させる。
- 選択肢は `a,b,c…` の順で1つずつ独立要素。結合しない。

検証スクリプト（生成後に必ず流す）:
```python
import json,re
d=json.load(open('questions_{sid}.json',encoding='utf-8'))
for ch in d['chapters']:
  for q in ch['qs']:
    assert sum(c['ok'] for c in q['choices'])>0, ('NO OK',q['uid'])
    assert bool(q['imgs'])==any(b['cls']=='bi' for b in q['badges']), ('IMG',q['uid'])
    assert any(e['cls']=='ee' for e in q['eg']), ('NO ee',q['uid'])
```

---

## 5. study.html への統合チェックリスト（新科目で触るファイル）

`obg`/`psy` を grep すれば全登録箇所が分かる。sid（例 `psy`）・絵文字・色を決めて以下を対で更新:

1. **`questions_{sid}.json`** … 生成物（データ正本）。
2. **`study.html`** 3か所 … ①科目チップ(`<button class="chip" data-sid=…>`) ②`subj-section` div ③`STUDY_SUBJECTS`配列。※チップは希望位置（例: 産婦人科の右）に入れる。読み込みは `fetch('questions_'+sid+'.json')` の汎用処理なのでファイル対応表は不要。
3. **`sw.js`** … `CARDS`に`questions_{sid}.json`追加＋`CACHE`をbump（再DL）。
4. **`gamify.js`** の `SUBJECTS` … `{id,name,icon,color,total}`追加。total＝実問題数（章追加ごとに更新）。
5. **`chapters_meta.js`** … 科目エントリ（chapters配列に`prefix/file/title/count`）。※gamifyにあってchapters_metaに無いとテストが落ちる。
6. **`progress.js`** の `SID_NAMES`、**`study_exam.js`** の `subjNameMap` … `sid:'科目名'`追加。
7. **`qmeta.json`** … `python _work/build_qmeta.py` で再生成（全`questions_*.json`を自動発見）。
8. （任意）**`rate_index.js`** … stats.html用。study.htmlの表示には不要（rateはJSONに埋め込み済み）。

### テスト（コミット前に必ず）
```
node _work/test_subject_totals.js   # questions/gamify/chapters_meta の3者一致（新科目で落ちやすい）
node _work/test_card_render.js
```

---

## 6. 進め方の作法

- **1章ずつ「完成→ユーザー確認→次章」**。いきなり全章書かない。
- 完成の定義＝品質基準(§2)を数値で満たし、不変条件(§4)0件、テスト(§5)全通過、study.htmlで表示・採点できる。
- 医学的正確性の抜き取り確認をユーザーに依頼する一文を添える。
- 化けた commit message を避けるため、日本語メッセージ内でmojibakeが出たら気にしすぎない（機能に影響なし）。git系はrtkフックが出力を加工するので正確な確認は `rtk proxy git …`。

---

## 7. そのまま使える着手プロンプト（次科目用）

> `MEC問題文pdf/{PDF名}` から新科目 `{sid}`（{科目名}）の章別HTMLを作り、study.htmlへ完全統合する。`_work/新科目HTML生成ガイド.md` の手順・品質基準に従うこと。
> 1. PDFは化けるので fitz でページ画像化して読む。巻末「解答一覧表」を正本に正解・正答率・章区切りを表化。
> 2. まず第1章だけ、全問を**産婦人科(obg)水準**（1問4ブロック=ep病態＋ee全肢検討表＋em深掘り＋ept国試ポイント、500字/kw10以上）で書く。画像問題は埋め込みJPEGを抽出。
> 3. `_work/build_{sid}_json.py`（obg版コピー）でJSON生成→§4検証→§5統合→テスト。
> 4. 完成したら**ユーザーに第1章をレビュー依頼**（医学的正確性の抜き取り確認を含む）してから次章へ。
