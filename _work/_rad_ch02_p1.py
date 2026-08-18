# -*- coding: utf-8 -*-
"""
放射線科 第2章「放射線診断学」(NO.2-34) の章別HTML
(放射線科/ch02_hoshasen_shindangaku.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_rad_ch01.py と同方式。

⚠️ このファイルは `_rad_ch02_p1.py` + `_rad_ch02_p2.py` を連結して作られている
   （1回のWriteに収まらないため）。再生成するときは両方を直して連結し直すこと。

問題文・選択肢はPDF(MECマイナー講座・放射線科 放Q-4〜25／PDF p.7-28)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.39-40)を x 座標で列に切って読んだもの。
解説はPDFの問題編に無いため、同講座のレジュメ編（放-8〜放-27）と国試標準知識に基づき執筆
（医学的正確性は要ユーザー確認）。

全33問（本科目最大の章・画像15問30枚）。
PDFのセクションは ★問題=NO.2-19 / 無印問題=NO.20-34（SECTIONS の idx は 0/18）。

■ 章の内訳
  造影剤の禁忌・副作用   6問（4 ペースメーカ／6 Gd／23 造影CT前／24 造影剤腎症／25 ヨード／26 Gd）
  モダリティの選択       6問（5 被ばく量／7 血尿／14 子宮体癌／17 MRI信号／11・16 脳梗塞）
  画像から診断する       8問（3 アメーバ性肝膿瘍／9 心タンポナーデ／10 尿酸結石／12 Meckel憩室／
                              13 PSP／15 脳梗塞の治療／20・21 Parkinson病）
  アーチファクト         1問（2 CTのアーチファクト）
  IVR                    5問（8 セルディンガー法／30・31・34 組合せ／32 浅大腿動脈／33 コイル）
  胸部エックス線の読影   3問（27・28・29 連問）
  連問（尿閉・在宅）     4問（18・19／22）

■ 章を貫く4本の筋
  ① **検査を選ぶ前に「禁忌はないか」を必ず通す**——
     **ヨード造影剤なら腎機能・喘息・副作用歴・甲状腺／Gdなら腎機能（NSF）／
     MRIなら体内金属とペースメーカの機種**。本章の6問がこれだけで解ける。
  ② **モダリティは「何を見たいか」で決まる**——
     **石灰化・出血・急性期の全体像＝CT／早期脳梗塞・後頭蓋窩・骨盤内・骨軟部＝MRI／
     機能と全身検索＝核医学／ベッドサイドと血流＝超音波**。
  ③ **画像は「所見」ではなく「病歴＋所見の組」で読む**——
     アンチョビペースト状の膿（NO.3）、術後の頸静脈怒張＋心音減弱（NO.9）、
     赤レンガ色の結石とＸ線陰性（NO.10）のように、
     **1文のキーワードが画像の意味を確定させる**。
  ④ **IVRは「詰める・広げる・入れる・焼く・取る」の5動作**で、
     **疾患ごとにどれを使うかが決まっている**（NO.30・31・33・34）。

⚠️ 本章（および本科目）の最難は **NO.27（114C-69・正答率20%）**＝
   ポータブル仰臥位AP像と6か月前の立位PA像は**撮影体位・方向が違うので心拡大を比較できない**。
   次いで **NO.32（111A-42・23%）＝ステントを留置した血管は左浅大腿動脈**、
   **NO.15（117D-48・27%）＝起床時発症で最終健常時刻が不明＝t-PAの適応外**、
   **NO.33（111B-11・49%）＝十二指腸潰瘍出血のIVRはコイル塞栓術**。

⚠️ **NO.11・14・16 はMECのオリジナル問題**（国試番号が無く、解答一覧表の正答率欄も空欄）。
   `rate=None` で作るが、**採点除外ではないので `bx` バッジは付けない**（正解肢は存在する）。
   画像ファイル名は国試番号を名乗れないので **`orig{NO.}_{n}.jpeg`** とした
   （`pdf_audit.py` の `FNAME_CODE` は数字始まりなので、この名前は照合対象から外れる）。

⚠️ **連問は2組**——**NO.18・19（120E-41/42）** と **NO.20〜22（117F-68/69/70）**、
   および **NO.27〜29（114C-69/70/71）** の計3組。
   **症例文は組の全カードに載せる**こと（試験モードはカードを1枚ずつ独立に出す）。
   共通ステムが参照する図は**各問ぶん別名で保存**してある
   （`120E-41_1,2`／`120E-42_1,2`、`114C-69_1,2`／`114C-70_1,2`／`114C-71_1,2`＝中身は同一）。

⚠️ **NO.9（115F-40）は `get_images()` の抽出順が紙面と逆**（xref139=CT が先、xref140=胸部Xp が後）。
   `ch02_map.txt` で A=胸部エックス線写真、B=胸部単純CT に入れ替えてある。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '放射線科' / 'ch02_hoshasen_shindangaku.html'

Q_START = 2

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ',
      'f': 'ｆ', 'g': 'ｇ', 'h': 'ｈ', 'i': 'ｉ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    imgs = imgs or []
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)


IMG = '放射線科/images/'


# ------------------------------------------------------------------
# 章を通して何度も参照する表（レジュメ 放-8〜放-27）
# ------------------------------------------------------------------

# ① モダリティ一覧
TBL_MODALITY = (
    '<table class="tb"><tr><th>検査</th><th>原理</th><th>被ばく</th>'
    '<th>得意なもの</th><th>苦手なもの・禁忌</th></tr>'
    '<tr><td><span class="kw">単純エックス線</span></td>'
    '<td>エックス線の透過差を2次元に投影</td><td>★</td>'
    '<td><span class="kw">簡便・安価・ベッドサイド可。'
    'スクリーニング、肺、骨</span></td>'
    '<td><span class="kw4">情報が少ない。妊娠中は原則避ける</span></td></tr>'
    '<tr><td><span class="kw">血管造影</span></td>'
    '<td>動脈にカテーテルを進めヨード造影剤を注入</td>'
    '<td><span class="kw4">★★★（術者も被ばく）</span></td>'
    '<td><span class="kw3">そのまま血管内治療（IVR）ができる</span>。'
    '時間分解能に優れる</td>'
    '<td><span class="kw4">診断法としては高侵襲。妊娠中は禁忌</span></td></tr>'
    '<tr><td><span class="kw3">CT</span></td>'
    '<td>線源と検出器を回して断面を再構成</td>'
    '<td><span class="kw4">★★〜★★★</span></td>'
    '<td><span class="kw3">ほぼ万能・画質と客観性。'
    '出血・石灰化・骨・肺・救急</span>。任意断面と3Dの再構成</td>'
    '<td><span class="kw4">早期脳梗塞・後頭蓋窩・骨盤内が苦手。'
    '妊娠中は原則避ける</span></td></tr>'
    '<tr><td><span class="kw3">MRI</span></td>'
    '<td>磁場で水素原子を励起し、緩和時間を画像化</td>'
    '<td><span class="kw3">なし</span></td>'
    '<td><span class="kw3">早期脳梗塞（拡散強調像）・後頭蓋窩・脊柱管内・'
    '骨盤内（子宮・前立腺）・骨軟部・胆膵（MRCP）</span>。任意断面</td>'
    '<td><span class="kw4">禁忌が多い（ペースメーカ・古い体内金属・閉所恐怖症・'
    '不安定な患者）。高価・長時間・騒音。出血の評価は苦手</span></td></tr>'
    '<tr><td><span class="kw3">核医学（PET含む）</span></td>'
    '<td>放射性医薬品を投与し、体内から出る放射線を検出</td>'
    '<td><span class="kw4">★★★（内部被ばく）</span></td>'
    '<td><span class="kw3">機能・代謝の評価（定性・定量）。'
    '全身の腫瘍検索、認知症の鑑別、Meckel憩室</span></td>'
    '<td><span class="kw4">空間分解能が低い・高価・薬剤を買い置きできない</span></td></tr>'
    '<tr><td><span class="kw3">超音波</span></td>'
    '<td>音波の反射を検出（＝「硬さ」の境界で像ができる）</td>'
    '<td><span class="kw3">なし</span></td>'
    '<td><span class="kw3">ベッドサイド・救急・妊婦。'
    '囊胞と充実性の区別、石灰化（結石）、血流評価（ドプラ）</span></td>'
    '<td><span class="kw4">骨と空気に弱い（頭部・肺・腸管ガスの奥は見えない）。'
    '死角が多く術者依存</span></td></tr></table>')

# ② 造影剤
TBL_CONTRAST = (
    '<table class="tb"><tr><th>造影剤</th><th>使う検査</th>'
    '<th>主な副作用</th><th><span class="kw4">禁忌・注意</span></th></tr>'
    '<tr><td><span class="kw3">ヨード造影剤</span><br>（水溶性）</td>'
    '<td><span class="kw3">造影CT・血管造影・IVR・'
    '尿路造影・脊髄造影</span></td>'
    '<td><span class="kw4">アナフィラキシー様反応・造影剤腎症・'
    '悪心／嘔吐・発疹</span></td>'
    '<td><span class="kw4">造影剤副作用の既往／腎機能低下／'
    '甲状腺機能亢進症／気管支喘息（活動性に応じ禁忌〜慎重投与）／'
    '多発性骨髄腫・マクログロブリン血症／褐色細胞腫</span><br>'
    '<span class="kw">ビグアナイド薬は検査前後で休薬（乳酸アシドーシス）</span></td></tr>'
    '<tr><td><span class="kw3">ガドリニウム造影剤</span></td>'
    '<td><span class="kw3">造影MRI</span></td>'
    '<td><span class="kw4">腎性全身性線維症〈NSF〉</span>・'
    'アナフィラキシー様反応（頻度はヨードより低い）</td>'
    '<td><span class="kw4">重度の腎機能低下（透析中を含む）／'
    '造影剤副作用の既往／気管支喘息</span></td></tr>'
    '<tr><td><span class="kw">硫酸バリウム</span></td>'
    '<td>消化管造影</td><td>便秘・バリウム虫垂炎</td>'
    '<td><span class="kw4">消化管穿孔（腹腔内に残り腹膜炎を起こす）・'
    '腸閉塞</span></td></tr>'
    '<tr><td><span class="kw">ガストログラフィン</span><br>'
    '（水溶性ヨード）</td>'
    '<td>穿孔が疑われる消化管造影</td><td>高浸透圧性下痢</td>'
    '<td><span class="kw4">誤嚥（高浸透圧のため重症肺炎をきたす）</span></td></tr>'
    '<tr><td><span class="kw">リピオドール</span><br>（油性ヨード）</td>'
    '<td><span class="kw">子宮卵管造影・リンパ管造影・'
    'TACEの塞栓物質</span></td><td>油性塞栓</td>'
    '<td>甲状腺機能異常</td></tr>'
    '<tr><td><span class="kw">マイクロバブル</span></td>'
    '<td>造影超音波</td><td>まれ</td><td>—</td></tr>'
    '<tr><td colspan="4"><span class="kw3">造影剤の設問はほぼ'
    '「腎機能」「喘息」「副作用歴」の3つで解ける</span>——'
    '<span class="kw3">ヨードもガドリニウムも、まず腎機能を確認する</span>。</td></tr></table>')

# ③ MRIのシーケンス
TBL_MRI = (
    '<table class="tb"><tr><th>シーケンス</th><th>白く（高信号に）写るもの</th>'
    '<th>使いどころ</th></tr>'
    '<tr><td><span class="kw">T1強調像</span></td>'
    '<td><span class="kw">脂肪・（亜急性期の）出血・造影剤</span>。'
    '<span class="kw4">水は黒</span></td>'
    '<td><span class="kw">解剖を見る</span>。'
    '灰白質は灰色、白質はやや白い</td></tr>'
    '<tr><td><span class="kw3">T2強調像</span></td>'
    '<td><span class="kw3">水（関節液・脳脊髄液・浮腫・囊胞）</span></td>'
    '<td><span class="kw3">水分量＝病変を見る</span>。'
    '「病変は白い」が基本</td></tr>'
    '<tr><td><span class="kw3">FLAIR像</span></td>'
    '<td><span class="kw3">T2強調像から自由水（脳脊髄液）の信号だけ消したもの</span></td>'
    '<td><span class="kw3">脳室・脳溝に接した病変が見やすい</span>。'
    '<span class="kw3">急性期脳梗塞ではまだ高信号にならない</span></td></tr>'
    '<tr><td><span class="kw3">拡散強調像〈DWI〉</span></td>'
    '<td><span class="kw3">水分子の拡散が制限された部位</span>——'
    '<span class="kw3">急性期脳梗塞・膿瘍・細胞密度の高い腫瘍</span></td>'
    '<td><span class="kw3">発症直後の脳梗塞を数十分で描出できる'
    '（CTでは写らない）</span></td></tr>'
    '<tr><td><span class="kw">MRA</span></td>'
    '<td><span class="kw">流れている血液</span></td>'
    '<td><span class="kw3">造影剤なしで血管を描出できる</span>'
    '（血管内の血液は励起断面から流出して無信号になる'
    '＝flow void。それを逆手に取る）</td></tr>'
    '<tr><td><span class="kw">MRCP</span></td>'
    '<td><span class="kw">流れの遅い水＝胆汁・膵液</span></td>'
    '<td><span class="kw3">heavy T2 で水以外を消し、'
    '胆管・膵管だけを描出</span>。非侵襲でERCPの前段に使う</td></tr>'
    '<tr><td colspan="3"><span class="kw3">どのシーケンスでも黒いもの＝'
    '骨皮質・空気・flow void（血管内の血液）</span>。<br>'
    '<span class="kw3">⚠️ DWIで高信号なのにFLAIRではまだ高信号でない'
    '（DWI-FLAIRミスマッチ）＝発症4.5時間以内の超急性期脳梗塞</span>'
    'を示唆し、<span class="kw3">t-PA療法の適応判断に使える</span>。</td></tr></table>')

# ④ アーチファクト
TBL_ARTIFACT = (
    '<table class="tb"><tr><th>装置</th><th>アーチファクト</th>'
    '<th>原因</th><th>所見・対策</th></tr>'
    '<tr><td rowspan="3"><span class="kw3">CT</span></td>'
    '<td><span class="kw3">体動アーチファクト</span></td>'
    '<td><span class="kw3">体動・呼吸・心拍動</span></td>'
    '<td><span class="kw3">ブレ・多重像</span>。'
    '横隔膜近傍と心臓周囲に出やすい。心電図同期で軽減</td></tr>'
    '<tr><td><span class="kw3">金属（ビームハードニング）'
    'アーチファクト</span></td>'
    '<td><span class="kw3">高度エックス線吸収体</span>——'
    '<span class="kw3">歯科金属・人工関節・脊椎固定材・'
    '金属ステント・クリップ・コイル・ペースメーカ</span></td>'
    '<td><span class="kw3">放射状の streak artifact</span>。'
    '最新機器の補正機能で軽減</td></tr>'
    '<tr><td>部分容積効果</td>'
    '<td>同一スライス内に異なるCT値が混在</td>'
    '<td>境界の不鮮明化。微小肝囊胞を転移と、'
    '肺・横隔膜境界をすりガラス影と誤りうる。薄いスライスで軽減</td></tr>'
    '<tr><td rowspan="3"><span class="kw">MRI</span></td>'
    '<td>体動アーチファクト</td><td>体動・呼吸・心拍動</td>'
    '<td>ブレ・ゴースト像。息止め・同期撮影</td></tr>'
    '<tr><td><span class="kw">磁化率アーチファクト</span></td>'
    '<td><span class="kw">磁化率の差（金属）</span></td>'
    '<td><span class="kw">信号欠損・画像の歪み</span>。'
    'CTの金属アーチファクトに似るが機序が違う'
    '（<span class="kw">CT＝吸収／MRI＝局所磁場の乱れ</span>）</td></tr>'
    '<tr><td>ケミカルシフト／折り返し</td>'
    '<td>脂肪と水の共鳴周波数差／視野外信号</td>'
    '<td>脂肪・水境界の黒帯（脂肪の検出に利用できる）／'
    '解剖構造の回り込み</td></tr>'
    '<tr><td rowspan="2"><span class="kw">超音波</span></td>'
    '<td><span class="kw">後方音響陰影／後方音響増強</span></td>'
    '<td>強い反射・吸収／液体による減衰低下</td>'
    '<td><span class="kw3">結石・石灰化の検出（陰影）と'
    '囊胞の判定（増強）にそのまま利用できる</span></td></tr>'
    '<tr><td>多重反射／鏡像</td><td>反射波の往復／強い反射面</td>'
    '<td>コメットサイン（胆囊腺筋腫症）／横隔膜の向こうに肝臓が写る</td></tr>'
    '<tr><td colspan="4"><span class="kw3">アーチファクトは'
    '一般に診断の邪魔だが、超音波の後方音響陰影・増強・多重反射のように'
    '診断に利用するものもある</span>。</td></tr></table>')

# ⑤ 核医学
TBL_NUCMED = (
    '<table class="tb"><tr><th>検査</th><th>核種</th><th>何を見るか</th>'
    '<th>代表的な適応</th></tr>'
    '<tr><td><span class="kw3">FDG-PET／PET-CT</span></td>'
    '<td><span class="kw"><sup>18</sup>F-FDG（β<sup>+</sup>）</span></td>'
    '<td><span class="kw3">糖代謝の亢進</span></td>'
    '<td><span class="kw3">悪性腫瘍の全身検索・病期診断・再発チェック</span>。'
    '<span class="kw4">脳と尿路への集積は生理的</span></td></tr>'
    '<tr><td><span class="kw3">ドパミントランスポーター'
    'SPECT〈DaTスキャン〉</span></td>'
    '<td><span class="kw"><sup>123</sup>I-イオフルパン</span></td>'
    '<td><span class="kw3">線条体のドパミン神経終末</span></td>'
    '<td><span class="kw3">低下＝変性性パーキンソニズム'
    '（Parkinson病・Lewy小体型認知症・進行性核上性麻痺・多系統萎縮症）／'
    '正常＝Alzheimer型認知症・本態性振戦・薬剤性</span></td></tr>'
    '<tr><td><span class="kw3">MIBG心筋シンチグラフィ</span></td>'
    '<td><span class="kw"><sup>123</sup>I-MIBG</span></td>'
    '<td><span class="kw3">心臓の交感神経終末</span></td>'
    '<td><span class="kw3">低下＝Parkinson病・Lewy小体型認知症／'
    '正常〜軽度低下＝進行性核上性麻痺・多系統萎縮症・'
    'Alzheimer型認知症</span></td></tr>'
    '<tr><td><span class="kw">脳血流SPECT</span></td>'
    '<td><span class="kw"><sup>99m</sup>Tc-ECD／<sup>123</sup>I-IMP</span></td>'
    '<td>局所脳血流</td>'
    '<td><span class="kw">Alzheimer型＝側頭頭頂葉／'
    'Lewy小体型＝後頭葉の血流低下</span></td></tr>'
    '<tr><td><span class="kw3">Meckel憩室シンチ</span></td>'
    '<td><span class="kw3"><sup>99m</sup>TcO<sub>4</sub><sup>－</sup></span></td>'
    '<td><span class="kw3">異所性胃粘膜</span>'
    '（胃粘膜と唾液腺に生理的集積）</td>'
    '<td><span class="kw3">Meckel憩室</span></td></tr>'
    '<tr><td><span class="kw">副腎髄質シンチ</span></td>'
    '<td><span class="kw"><sup>131</sup>I-MIBG</span></td>'
    '<td>カテコラミン産生細胞</td>'
    '<td><span class="kw">褐色細胞腫・神経芽腫</span></td></tr>'
    '<tr><td><span class="kw">副腎皮質シンチ</span></td>'
    '<td><sup>131</sup>I-アドステロール</td><td>コレステロール取り込み</td>'
    '<td>Cushing症候群・原発性アルドステロン症</td></tr>'
    '<tr><td>骨シンチ</td><td><sup>99m</sup>Tc-MDP</td>'
    '<td>骨代謝の亢進</td><td>骨転移の検索</td></tr></table>')

# ⑥ IVR
TBL_IVR = (
    '<table class="tb"><tr><th>動作</th><th>手技</th><th>適応</th></tr>'
    '<tr><td rowspan="3"><span class="kw3">詰める<br>（塞栓術）</span></td>'
    '<td><span class="kw3">止血の塞栓術</span></td>'
    '<td><span class="kw3">骨盤骨折・外傷性の実質臓器損傷（脾・腎・肝）・'
    '消化管出血（内視鏡で止まらない十二指腸潰瘍など）・喀血・'
    '肝細胞癌破裂・産科危機的出血</span></td></tr>'
    '<tr><td><span class="kw3">腫瘍の塞栓術</span></td>'
    '<td><span class="kw3">肝細胞癌の肝動脈化学塞栓療法〈TACE〉・'
    '子宮筋腫の子宮動脈塞栓術〈UAE〉</span></td></tr>'
    '<tr><td><span class="kw3">異常血管の塞栓術（コイル）</span></td>'
    '<td><span class="kw3">脳動脈瘤・肺動静脈瘻・脳動静脈奇形〈AVM〉</span></td></tr>'
    '<tr><td><span class="kw3">広げる</span></td>'
    '<td><span class="kw3">バルーン拡張術（＋ステント留置）</span></td>'
    '<td><span class="kw3">閉塞性動脈硬化症・冠動脈狭窄（PCI）・'
    '頸動脈狭窄症・腎動脈狭窄（腎血管性高血圧）</span></td></tr>'
    '<tr><td><span class="kw3">かぶせる</span></td>'
    '<td><span class="kw3">ステントグラフト内挿術</span></td>'
    '<td><span class="kw3">胸部・腹部大動脈瘤</span></td></tr>'
    '<tr><td><span class="kw">入れる</span></td>'
    '<td><span class="kw">動注化学療法・血栓溶解療法</span></td>'
    '<td><span class="kw">上顎癌などの局所進行癌・血栓塞栓症</span></td></tr>'
    '<tr><td><span class="kw">受け止める</span></td>'
    '<td><span class="kw">下大静脈〈IVC〉フィルター留置</span></td>'
    '<td><span class="kw">下肢深部静脈血栓症（肺塞栓の予防）</span></td></tr>'
    '<tr><td><span class="kw">焼く・凍らす</span></td>'
    '<td><span class="kw">ラジオ波焼灼療法〈RFA〉・凍結療法・'
    'カテーテルアブレーション</span></td>'
    '<td><span class="kw">肝細胞癌・肺／腎の小腫瘍・不整脈</span></td></tr>'
    '<tr><td><span class="kw">抜く・取る</span></td>'
    '<td><span class="kw">ドレナージ・生検・異物や血栓の除去</span></td>'
    '<td><span class="kw">膿瘍・胆汁・胸腹水／病理採取／'
    '離断カテーテル・血栓</span></td></tr></table>')


QUESTIONS = [

    # ============================ ★問題 ============================

    # ── NO.2 (120C-59) ★ 65% ans=d,e ───────────────────────────
    Q('120C-59', 65, [('bs', '★')],
      '82 歳の男性。脳梗塞による左片麻痺、脳血管性認知症のため入院中である。'
      '寝たきりの状態で経口摂取が困難であり、'
      '<u>①経鼻経管栄養を行っている</u>。右胸部違和感を訴え、今朝血痰を認めた。'
      '既往歴に慢性閉塞性肺疾患、脂質異常症、高血圧症および完全房室ブロックがある。'
      '過去の胸部単純CT では<u>②気腫性変化が著明であった</u>。'
      'また<u>③大動脈の石灰化を指摘されており</u>、'
      '<u>④心臓ペースメーカ植え込み術を受けている</u>。'
      '喫煙は20 本/ 日を52 年間。意思疎通は可能であるが、'
      '<u>⑤絶えず右半身を動かしておりじっとしていられない</u>。'
      '胸部エックス線写真で右肺野に結節影が疑われる。'
      '原因検索のため、胸部単純CT を行うこととした。<br>'
      '<strong>下線部のうち、この患者の胸部単純CT で、'
      'アーチファクトの原因となるのはどれか。2つ選べ。</strong>',
      [('a', '①', False,
        '<span class="kw4">経鼻胃管はポリウレタン・シリコーンなどの'
        '樹脂製で、エックス線吸収はごくわずか</span>。'
        '<span class="kw">位置確認のために先端や側管に細い金属ライン'
        '（造影ライン）が入っているが、'
        '径が小さくアーチファクトを生じるほどの吸収差にはならない</span>。'
        '<span class="kw4">「体内に入っている異物＝アーチファクト」と'
        '短絡しないこと</span>——問題になるのは'
        '<span class="kw3">エックス線を強く吸収する高原子番号の金属</span>である。'),
       ('b', '②', False,
        '<span class="kw4">気腫性変化（肺気腫）はむしろCT値が下がる'
        '（空気に近づく）方向の変化</span>で、'
        '<span class="kw4">ビームハードニングも散乱も起こさない</span>。'
        '<span class="kw">画像は「黒っぽくなる」だけで、'
        '偽像（アーチファクト）は生じない</span>。'
        'なお<span class="kw">気腫性変化があると肺野の観察はむしろ容易</span>で、'
        '結節の検出を妨げるものではない。'),
       ('c', '③', False,
        '<span class="kw4">大動脈壁の石灰化はCT値が高い（100〜数百HU）が、'
        '厚みが薄く体積が小さいのでビームハードニングは軽微</span>。'
        '<span class="kw">冠動脈のように高度石灰化が管腔評価を妨げる'
        '状況はあるが、それは「石灰化そのものが内腔を隠す」問題であって'
        '放射状の streak artifact ではない</span>。'
        '<span class="kw3">2つ選ぶ設問では、'
        'より確実な原因（金属と体動）が優先される</span>。'),
       ('d', '④', True,
        '<span class="kw3">◯ 心臓ペースメーカは本体（チタン缶）とリードという'
        '明確な金属で、金属アーチファクト（ビームハードニング）の典型的な原因</span>。'
        '<span class="kw3">高原子番号の金属は低エネルギー成分を'
        '選択的に吸収してビームを「硬く」してしまうため、'
        '再構成の前提が崩れて放射状の縞（streak artifact）や'
        '黒い帯が生じる</span>。'
        '<span class="kw3">本例では右肺野の結節を評価したいのに、'
        '胸腔内のデバイス由来の縞が重なりうる</span>。'
        '<span class="kw">歯科金属・人工関節・脊椎固定材・クリップ・'
        'コイル・金属ステントも同じ理由でアーチファクト源になる</span>。'),
       ('e', '⑤', True,
        '<span class="kw3">◯ 「絶えず右半身を動かしておりじっとしていられない」'
        '＝体動アーチファクトの原因</span>である。'
        '<span class="kw3">CTは線源と検出器を回転させながら'
        '多方向の投影データを集めて1枚の断面を再構成する</span>ので、'
        '<span class="kw3">撮影中に被写体が動くとデータの整合が取れず、'
        'ブレ・多重像・輪郭の二重化が生じる</span>。'
        '<span class="kw3">認知症で指示に従えない患者、不随意運動のある患者、'
        '呼吸を止められない患者では必発</span>で、'
        '<span class="kw3">「息を止められるか」「じっとしていられるか」は'
        'CTをオーダーする前に確認すべき情報</span>である。')],
      '金属（ペースメーカ）と体動——CTアーチファクトの2大原因。',
      patho=('🔎 CTのアーチファクト——原因は「動く」か「金属」か',
             '<span class="kw3">アーチファクト（偽像）とは、'
             '実在しないのに画像に写ってしまうもの</span>。'
             '<span class="kw3">CTで臨床的に問題になるのは'
             '体動と金属の2つがほとんど</span>である。' + TBL_ARTIFACT),
      deep=('💡 CTとMRIで「金属」の意味が違う',
            '<span class="kw3">同じ金属でも、CTとMRIでは'
            '起きることも危険性もまったく違う</span>。'
            '<table class="tb"><tr><th></th><th><span class="kw3">CT</span></th>'
            '<th><span class="kw3">MRI</span></th></tr>'
            '<tr><td>金属が起こすこと</td>'
            '<td><span class="kw3">エックス線を強く吸収 → '
            'ビームハードニング → 放射状の streak artifact</span></td>'
            '<td><span class="kw3">局所磁場を乱す → '
            '磁化率アーチファクト（信号欠損・画像の歪み）</span></td></tr>'
            '<tr><td><span class="kw4">危険性</span></td>'
            '<td><span class="kw3">画質が落ちるだけ（安全）</span></td>'
            '<td><span class="kw4">吸引・移動・発熱・'
            'デバイスの誤作動＝患者に危害が及ぶ</span></td></tr>'
            '<tr><td>ペースメーカ</td>'
            '<td><span class="kw3">撮影自体は可能</span></td>'
            '<td><span class="kw4">原則禁忌</span>。'
            '<span class="kw3">ただし条件付きMRI対応機種があるので'
            '「機種の確認」が要る</span>（NO.4）</td></tr>'
            '<tr><td>対策</td>'
            '<td>金属アーチファクト低減の再構成、管電圧を上げる</td>'
            '<td><span class="kw3">外せるものは外す。'
            '事前の体内金属チェックリストが必須</span></td></tr></table>'
            '<span class="kw3">「CTの金属は画質の問題、MRIの金属は安全の問題」</span>と'
            '押さえておくと、本章の造影・禁忌の設問がすべてつながる。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">CTのアーチファクトの2大原因＝体動と金属</span>。<br>'
             '② <span class="kw3">金属アーチファクト＝歯科金属・人工関節・'
             '脊椎固定材・ステント・クリップ・コイル・ペースメーカ</span>。'
             '放射状の streak artifact。<br>'
             '③ <span class="kw3">体動アーチファクト＝体動・呼吸・心拍動</span>。'
             '<span class="kw">ブレ・多重像。心電図同期で軽減</span>。<br>'
             '④ <span class="kw4">石灰化・気腫性変化はアーチファクトの原因にならない</span>。<br>'
             '⑤ <span class="kw3">MRIでは金属は「画質」ではなく「安全」の問題</span>。')),

    # ── NO.3 (119D-67) ★ 85% ans=d ─────────────────────────────
    Q('119D-67', 85, [('bs', '★')],
      '53 歳の男性。10 日前からの発熱を主訴に来院した。海外渡航歴はない。'
      '意識は清明。体温38.4℃。脈拍96/ 分、整。血圧116/70mmHg。'
      '心音と呼吸音とに異常を認めない。'
      '<span class="kw">腹部は平坦、軟で圧痛を認めないが、右季肋部に叩打痛を認める。</span>'
      '血液所見：赤血球468 万、Hb 13.9g/dL、白血球21,900、血小板28 万。'
      '血液生化学所見：総ビリルビン1.2mg/dL、AST 125U/L、ALT 83U/L、'
      'LD 338U/L（基準124 ～222）、γ-GT 163U/L（基準13 ～64）。CRP 29mg/dL。'
      '腹部造影CT を示す。'
      '<span class="kw">超音波ガイド下に穿刺し、得られた液体は無臭で'
      'アンチョビペースト状であった。血液および穿刺液の培養で細菌は検出されなかった。</span><br>'
      '<strong>この患者の感染経路を確認する上で重要な質問はどれか。</strong>',
      [('a', '「覚醒剤を使ったことはありますか」', False,
        '<span class="kw4">注射薬物使用で問題になるのは'
        'B型・C型肝炎、HIV、感染性心内膜炎</span>である。'
        '<span class="kw4">肝膿瘍の原因を薬物使用に求める設定ではない</span>。'
        '（<span class="kw">感染性心内膜炎から多発性の膿瘍を作ることはあるが、'
        '本例は心音正常・単発の大きな膿瘍</span>）'),
       ('b', '「キツネを触ったことはありますか」', False,
        '<span class="kw4">キツネ＝エキノコックス（多包条虫）</span>。'
        '<span class="kw4">北海道で問題になり、肝に多発性の囊胞性病変を作る</span>が、'
        '<span class="kw4">経過は数年〜十数年と極めて緩徐で、'
        '10日の発熱で発症する病態ではない</span>。'
        '<span class="kw4">また内容は「アンチョビペースト状」ではない</span>。'
        '<span class="kw">エキノコックス症では穿刺は原則禁忌'
        '（播種とアナフィラキシーの危険）</span>という点も重要。'),
       ('c', '「ダニに咬まれたことはありますか」', False,
        '<span class="kw4">ダニ媒介感染症は日本紅斑熱・'
        '重症熱性血小板減少症候群〈SFTS〉・ツツガムシ病</span>で、'
        '<span class="kw4">刺し口・発疹・血小板減少・白血球減少</span>を伴う。'
        '<span class="kw4">本例は白血球21,900と増加、血小板も正常で合わない</span>。'),
       ('d', '「同性間で性交渉をしたことはありますか」', True,
        '<span class="kw3">◯ アンチョビペースト状（チョコレート様）の膿で'
        '細菌培養陰性＝アメーバ性肝膿瘍</span>。'
        '<span class="kw3">原因は赤痢アメーバ〈Entamoeba histolytica〉で、'
        '感染経路は糞口感染</span>である。'
        '<span class="kw3">日本では流行地への渡航歴がない症例が多くを占め、'
        'その主な感染経路が男性同性間の性的接触〈MSM〉</span>——'
        '<span class="kw3">「海外渡航歴はない」という一文が'
        'この質問へ誘導するために置かれている</span>。'
        '<span class="kw">HIV感染の合併も多いので同時に検索する</span>。'
        '<span class="kw3">治療はメトロニダゾール</span>で、'
        '<span class="kw">腸管内の囊子を除くためパロモマイシンを追加する</span>。'),
       ('e', '「シカやイノシシなどの獣肉を食べたことはありますか」', False,
        '<span class="kw4">ジビエ（野生獣肉）の生食で問題になるのは'
        'E型肝炎・旋毛虫症・住肉胞子虫など</span>。'
        '<span class="kw4">E型肝炎は急性肝炎の像（トランスアミナーゼの著明高値）を呈し、'
        '膿瘍は作らない</span>。'
        '<span class="kw">本例のAST 125／ALT 83 は膿瘍による'
        '二次的な上昇の範囲</span>である。')],
      'アンチョビペースト状＋培養陰性＝アメーバ性肝膿瘍。感染経路はMSMを含む糞口感染。',
      imgs=[IMG + '119D-67_1.jpeg'],
      patho=('🔎 画像所見——肝右葉の単発性・辺縁が造影される低吸収腫瘤',
             '<span class="kw3">腹部造影CTでは、肝右葉に周囲肝実質より'
             '明らかに低吸収の大きな腫瘤性病変を認める</span>。'
             '<span class="kw3">内部は不均一で液体成分を主体とし、'
             '辺縁が造影効果を受けて縁取られている（rim enhancement）</span>——'
             '<span class="kw3">これが「膿瘍の壁」で、囊胞や壊死した腫瘍との'
             '鑑別点になる</span>。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">アメーバ性肝膿瘍</span></th>'
             '<th>細菌性肝膿瘍</th><th>肝囊胞</th></tr>'
             '<tr><td>数・部位</td>'
             '<td><span class="kw3">単発・右葉が多い</span></td>'
             '<td><span class="kw">多発することが多い</span></td>'
             '<td>単発〜多発</td></tr>'
             '<tr><td>内容</td>'
             '<td><span class="kw3">アンチョビペースト状（赤褐色）・無臭</span></td>'
             '<td><span class="kw">黄色〜緑色の膿・悪臭</span></td>'
             '<td>漿液</td></tr>'
             '<tr><td>細菌培養</td>'
             '<td><span class="kw3">陰性</span>（アメーバは培養で出ない）</td>'
             '<td><span class="kw">陽性</span>（腸内細菌・Klebsiella）</td>'
             '<td>陰性</td></tr>'
             '<tr><td>造影CT</td>'
             '<td colspan="2"><span class="kw3">辺縁が造影される低吸収腫瘤'
             '（rim enhancement）</span></td>'
             '<td><span class="kw4">壁が造影されない・境界明瞭</span></td></tr>'
             '<tr><td>診断</td>'
             '<td><span class="kw3">血清抗体・穿刺液の鏡検／PCR</span></td>'
             '<td><span class="kw">血液培養・穿刺液培養</span></td>'
             '<td>—</td></tr>'
             '<tr><td>治療</td>'
             '<td><span class="kw3">メトロニダゾール（＋パロモマイシン）。'
             '通常はドレナージ不要</span></td>'
             '<td><span class="kw">抗菌薬＋経皮的ドレナージ</span></td>'
             '<td>無症状なら経過観察</td></tr></table>'),
      deep=('💡 「1文のキーワード」が画像の意味を確定させる',
            '<span class="kw3">本問の画像だけからは'
            '「肝の膿瘍または壊死性腫瘍」までしか言えない</span>。'
            '<span class="kw3">診断を確定させているのは文章の側</span>である。'
            '<table class="tb"><tr><th>文中の記載</th><th>そこから決まること</th></tr>'
            '<tr><td><span class="kw3">アンチョビペースト状</span></td>'
            '<td><span class="kw3">アメーバ性肝膿瘍に特徴的</span>——'
            '肝細胞が融解した内容物の色</td></tr>'
            '<tr><td><span class="kw3">無臭</span></td>'
            '<td><span class="kw3">嫌気性菌を含む細菌性膿瘍を否定する方向</span></td></tr>'
            '<tr><td><span class="kw3">培養で細菌が検出されない</span></td>'
            '<td><span class="kw3">細菌性を否定</span>——'
            'アメーバは通常の培養では検出されない</td></tr>'
            '<tr><td><span class="kw3">海外渡航歴はない</span></td>'
            '<td><span class="kw3">「輸入感染症ではない＝国内での感染経路がある」</span>'
            'と読ませ、MSMへ誘導する</td></tr>'
            '<tr><td><span class="kw">右季肋部の叩打痛</span></td>'
            '<td><span class="kw">肝表面に及ぶ病変</span></td></tr></table>'
            '<span class="kw3">画像問題では「画像で診断名を絞り、'
            '文章で確定させる」という順序</span>で読む。'
            '<span class="kw3">逆に、画像を見ずに文章だけで解ける問題も多い</span>——'
            '<span class="kw3">本問がまさにそれで、'
            '「アンチョビペースト状」の6文字で答えが決まる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">アンチョビペースト状・無臭・細菌培養陰性＝'
             'アメーバ性肝膿瘍</span>。<br>'
             '② <span class="kw3">感染経路は糞口感染</span>——'
             '<span class="kw3">日本では男性同性間の性的接触が主</span>'
             '（HIV合併の検索を）。<br>'
             '③ <span class="kw3">治療はメトロニダゾール</span>'
             '（＋腸管内囊子にパロモマイシン）。'
             '<span class="kw">通常ドレナージは不要</span>。<br>'
             '④ <span class="kw">細菌性肝膿瘍は多発・悪臭・培養陽性で'
             '抗菌薬＋ドレナージ</span>。<br>'
             '⑤ <span class="kw4">エキノコックス（キツネ）は経過が年単位で'
             '穿刺は禁忌</span>。')),

    # ── NO.4 (115E-16) ★必修 99% ans=e ─────────────────────────
    Q('115E-16', 99, [('bs', '★'), ('bh', '必修')],
      '<strong>心臓ペースメーカー植込み患者に対して、'
      'ペースメーカーの機種を確認してから実施すべきなのはどれか。</strong>',
      [('a', '食道生検', False,
        '<span class="kw4">内視鏡下の生検はペースメーカと無関係</span>。'
        '<span class="kw">注意すべきは抗血栓薬の内服と出血リスク</span>で、'
        '<span class="kw4">機種を確認する必要はない</span>。'),
       ('b', 'FDG-PET', False,
        '<span class="kw4">PETは放射性医薬品から出るγ線を検出するだけ</span>で、'
        '<span class="kw4">強い磁場も電気メスのような高周波も使わない</span>。'
        '<span class="kw">ペースメーカ本体は金属アーチファクトの原因になりうる</span>が、'
        '<span class="kw4">機器の安全性の問題ではない</span>。'),
       ('c', '腹部造影CT', False,
        '<span class="kw4">CTはエックス線を使う検査でペースメーカに影響しない</span>。'
        '<span class="kw">確認すべきはヨード造影剤の禁忌（腎機能・喘息・副作用歴）</span>で、'
        '<span class="kw4">機種の確認ではない</span>。'
        '（<span class="kw">きわめて高線量のCT照射で一過性の誤作動が'
        '報告されたことはあるが、通常の診断では問題にならない</span>）'),
       ('d', '超音波内視鏡検査', False,
        '<span class="kw4">超音波は音波であり、電磁的な干渉を起こさない</span>。'
        '<span class="kw">ペースメーカ植込み部の直上に'
        'プローブを強く当てることは避けるが、'
        '機種確認を要する検査ではない</span>。'),
       ('e', '磁気共鳴胆管膵管撮影〈MRCP〉', True,
        '<span class="kw3">◯ MRCPはMRIの一種であり、'
        'MRIはペースメーカ患者にとって原則禁忌</span>である。'
        '<span class="kw3">強力な静磁場でデバイスが動く／'
        '高周波によりリードが発熱する／'
        '磁場と高周波でペーシングが抑制される、'
        'あるいは不適切な作動を起こす</span>という危険がある。'
        '<span class="kw3">しかし近年は「条件付きMRI対応'
        '〈MRI conditional〉」の機種が普及しており、'
        '定められた条件（磁場強度・撮像部位・SAR・'
        'MRIモードへの設定変更・モニタ下での実施）を守れば撮像できる</span>。'
        '<span class="kw3">だから「絶対にできない」ではなく'
        '「機種を確認してから」になる</span>。'
        '<span class="kw">確認はペースメーカ手帳・植込みカード・'
        '循環器医への照会で行う</span>。')],
      'MRI（MRCPを含む）だけがペースメーカの安全性に関わる。条件付き対応機種がある。',
      patho=('🔎 MRIの禁忌——「磁場に反応するもの」を全部拾う',
             '<span class="kw3">MRIは被ばくが無いという大きな利点があるが、'
             'その代わり禁忌が多い</span>。'
             '<span class="kw3">禁忌の理由は3つ——'
             '①強磁場による吸引・移動 ②高周波による発熱 '
             '③電磁干渉によるデバイスの誤作動</span>。'
             '<table class="tb"><tr><th>対象</th><th>可否</th><th>理由・注意</th></tr>'
             '<tr><td><span class="kw3">心臓ペースメーカ・ICD・CRT</span></td>'
             '<td><span class="kw3">原則禁忌。ただし条件付き対応機種なら'
             '条件を守って可</span></td>'
             '<td><span class="kw3">誤作動・リードの発熱。'
             '必ず機種と条件を確認する</span></td></tr>'
             '<tr><td><span class="kw4">人工内耳・神経刺激装置・'
             '古い動脈瘤クリップ・眼内の金属片</span></td>'
             '<td><span class="kw4">禁忌</span></td>'
             '<td><span class="kw4">移動・発熱・機能障害</span>。'
             '<span class="kw">金属加工業の既往では眼窩の単純撮影で'
             '金属片の有無を確認する</span></td></tr>'
             '<tr><td><span class="kw">人工関節・骨接合材・'
             '冠動脈ステント・チタン製クリップ</span></td>'
             '<td><span class="kw3">多くは可</span></td>'
             '<td><span class="kw">非磁性体が主流。'
             '磁化率アーチファクトは出る</span></td></tr>'
             '<tr><td><span class="kw4">閉所恐怖症・状態の不安定な患者・'
             '安静を保てない患者</span></td>'
             '<td><span class="kw4">困難</span></td>'
             '<td><span class="kw4">撮像に時間がかかり、'
             '検査中は近づけない</span></td></tr>'
             '<tr><td><span class="kw">妊　婦</span></td>'
             '<td><span class="kw3">被ばくは無いので実施可</span></td>'
             '<td><span class="kw">器官形成期は慎重に。'
             'ガドリニウム造影剤は原則使わない</span></td></tr>'
             '<tr><td><span class="kw4">重度の腎機能低下</span></td>'
             '<td><span class="kw3">単純MRIは可</span></td>'
             '<td><span class="kw4">ガドリニウム造影は禁忌（NSF）</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">検査室に持ち込んではいけないもの'
             '——酸素ボンベ・車椅子・ストレッチャー・点滴台・'
             'はさみ・聴診器・磁気カード・時計</span>。'
             '<span class="kw4">吸引事故は死亡例が報告されている</span>。</td></tr></table>'),
      deep=('💡 「検査の前に確認すべきこと」を検査別に整理する',
            '<span class="kw3">本章には「〜を実施する前に確認すべきなのはどれか」型の'
            '設問が繰り返し出る（NO.4・23・26）</span>。'
            '<span class="kw3">検査ごとに「何が危ないか」を1つずつ持っておけば全部解ける</span>。'
            '<table class="tb"><tr><th>検査</th>'
            '<th><span class="kw3">確認すべきこと</span></th><th>理由</th></tr>'
            '<tr><td><span class="kw3">単純エックス線・CT（単純）</span></td>'
            '<td><span class="kw3">妊娠の可能性</span></td>'
            '<td>胎児被ばく（ただし閾値未満）</td></tr>'
            '<tr><td><span class="kw3">造影CT（ヨード造影剤）</span></td>'
            '<td><span class="kw3">腎機能・喘息・造影剤副作用歴・'
            '甲状腺機能・ビグアナイド薬</span></td>'
            '<td><span class="kw3">造影剤腎症・アナフィラキシー様反応・'
            '乳酸アシドーシス</span></td></tr>'
            '<tr><td><span class="kw3">MRI（単純）</span></td>'
            '<td><span class="kw3">体内金属・ペースメーカの機種・'
            '閉所恐怖症</span></td>'
            '<td><span class="kw3">吸引・発熱・誤作動</span></td></tr>'
            '<tr><td><span class="kw3">造影MRI（ガドリニウム）</span></td>'
            '<td><span class="kw3">上記＋腎機能・喘息・副作用歴</span></td>'
            '<td><span class="kw3">腎性全身性線維症〈NSF〉</span></td></tr>'
            '<tr><td><span class="kw">消化管造影（バリウム）</span></td>'
            '<td><span class="kw">穿孔・閉塞の有無、誤嚥のリスク</span></td>'
            '<td><span class="kw">腹膜炎・重症肺炎</span></td></tr>'
            '<tr><td><span class="kw">核医学（内用療法を含む）</span></td>'
            '<td><span class="kw">妊娠・授乳</span></td>'
            '<td><span class="kw">胎児・乳児の内部被ばく</span></td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">ペースメーカ患者でMRIは原則禁忌</span>——'
             '<span class="kw3">条件付きMRI対応機種があるので「機種の確認」が要る</span>。<br>'
             '② <span class="kw3">MRCP・MRA・DWIはすべてMRIの一種</span>。'
             '名前に惑わされない。<br>'
             '③ <span class="kw4">MRIの禁忌＝人工内耳・神経刺激装置・'
             '古い動脈瘤クリップ・眼内金属片・閉所恐怖症</span>。<br>'
             '④ <span class="kw4">検査室に酸素ボンベ・車椅子・'
             'はさみ・磁気カードを持ち込まない</span>。<br>'
             '⑤ <span class="kw">CT・PET・超音波はペースメーカの安全性に影響しない</span>。')),

    # ── NO.5 (114C-18) ★ 60% ans=d ─────────────────────────────
    Q('114C-18', 60, [('bs', '★')],
      '<strong>被験者の検査1 回当たりの放射線被ばくが最も多いのはどれか。</strong>',
      [('a', 'FDG-PET', False,
        '<span class="kw4">FDG-PET単独での被ばくは概ね2〜4mSv</span>で、'
        '<span class="kw">投与した<sup>18</sup>Fからの内部被ばくが主体</span>。'
        '<span class="kw3">ただし実際に行われるPET-CTでは'
        '同時に撮るCTのぶんが加わり10〜20mSv超になりうる</span>ので、'
        '<span class="kw4">「PETだから被ばくが多い」と単純に決めないこと</span>。'
        '<span class="kw4">本問の選択肢は「FDG-PET」であって'
        '「PET-CT」ではない</span>。'),
       ('b', '頭部単純CT', False,
        '<span class="kw4">頭部単純CTは約2mSv</span>。'
        '<span class="kw">頭部は撮影範囲が狭く、'
        '実効線量に大きく寄与する臓器（生殖腺・骨髄・肺・胃・結腸）が'
        '照射野にほとんど入らない</span>ため、'
        '<span class="kw">CTのなかでは被ばくが少ない部類</span>である。'
        '<span class="kw3">実効線量は「どの臓器が浴びたか」で決まる'
        '（組織加重係数）</span>という第4章の考え方がここに効く。'),
       ('c', '上部消化管造影検査', False,
        '<span class="kw4">胃透視（上部消化管造影）は概ね3mSv前後</span>。'
        '<span class="kw">透視と撮影を繰り返すので単純撮影よりは多いが、'
        'CTには及ばない</span>。'
        '<span class="kw">検診で行われる水準の検査</span>である。'),
       ('d', '腹部ダイナミックCT', True,
        '<span class="kw3">◯ 腹部ダイナミックCTが最多で、'
        '概ね20〜30mSv に達する</span>。理由は2つ。'
        '<span class="kw3">①腹部は撮影範囲が広く、'
        '胃・結腸・肝臓・生殖腺など組織加重係数の大きい臓器が'
        'まとめて照射野に入る</span>。'
        '<span class="kw3">②「ダイナミック」＝造影剤注入後の'
        '動脈相・門脈相・平衡相（さらに単純相）と'
        '同じ範囲を何度も撮る</span>——'
        '<span class="kw3">相の数だけ被ばくが掛け算で増える</span>。'
        '<span class="kw3">「撮影範囲の広さ×相の数」が被ばく量を決める</span>と'
        '理解しておけば、CT同士の比較で迷わない。'),
       ('e', '胸部単純エックス線写真', False,
        '<span class="kw4">約0.06mSv で、選択肢中で最も少ない</span>。'
        '<span class="kw3">腹部ダイナミックCTの約1/400</span>にあたる。'
        '<span class="kw">日本の自然放射線（年間約2.1mSv）の'
        '1/30程度でしかない</span>ので、'
        '<span class="kw">「胸部単純撮影の被ばくは無視できる」</span>という'
        '感覚を持っておくと患者説明に使える。')],
      '撮影範囲の広さ×相の数で決まる。腹部ダイナミックCTが最多（20〜30mSv）。',
      patho=('🔎 検査ごとの被ばく量——胸部単純撮影を「1」として並べる',
             '<span class="kw3">絶対値を覚えるのは大変なので、'
             '胸部単純エックス線写真（0.06mSv）を1としたときの'
             '倍率で持っておく</span>。'
             '<table class="tb"><tr><th>検査</th><th>実効線量の目安</th>'
             '<th>胸部単純撮影の何倍か</th></tr>'
             '<tr><td><span class="kw3">胸部単純エックス線写真</span></td>'
             '<td><span class="kw3">0.06mSv</span></td><td>1</td></tr>'
             '<tr><td>マンモグラフィ</td><td>約0.2mSv</td><td>3</td></tr>'
             '<tr><td>腹部単純エックス線写真</td><td>約0.5mSv</td><td>8</td></tr>'
             '<tr><td><span class="kw">上部消化管造影</span></td>'
             '<td><span class="kw">約3mSv</span></td><td>50</td></tr>'
             '<tr><td><span class="kw">頭部単純CT</span></td>'
             '<td><span class="kw">約2mSv</span></td><td>30</td></tr>'
             '<tr><td><span class="kw">FDG-PET（単独）</span></td>'
             '<td><span class="kw">2〜4mSv</span></td><td>50前後</td></tr>'
             '<tr><td>胸部CT</td><td>5〜10mSv</td><td>100前後</td></tr>'
             '<tr><td>腹部単純CT</td><td>約10mSv</td><td>170</td></tr>'
             '<tr><td><span class="kw3">腹部ダイナミックCT</span></td>'
             '<td><span class="kw3">20〜30mSv</span></td>'
             '<td><span class="kw3">300〜500</span></td></tr>'
             '<tr><td>PET-CT</td><td>10〜20mSv超</td><td>—</td></tr>'
             '<tr><td>心血管造影・IVR</td>'
             '<td><span class="kw4">手技時間により数〜数十mSv</span></td>'
             '<td>—</td></tr>'
             '<tr><td colspan="3"><span class="kw3">被ばく量を決めるのは'
             '①撮影範囲の広さ ②相（フェーズ）の数 '
             '③照射野に入る臓器の組織加重係数</span>。<br>'
             '<span class="kw3">超音波とMRIは電離放射線を使わないので0</span>。</td></tr></table>'),
      deep=('💡 「実効線量」は臓器で重みが違う——だから頭部CTは低い',
            '<span class="kw3">同じCTでも頭部と腹部で実効線量が'
            '10倍以上違うのは、単に範囲の問題だけではない</span>。'
            '<span class="kw3">実効線量＝各臓器の等価線量×組織加重係数の総和</span>'
            'であり、<span class="kw3">組織加重係数は臓器ごとにまったく違う</span>。'
            '<table class="tb"><tr><th>組織加重係数</th><th>臓器</th>'
            '<th>頭部CTで照射されるか</th></tr>'
            '<tr><td><span class="kw3">0.20</span></td>'
            '<td><span class="kw3">生殖腺</span></td>'
            '<td><span class="kw3">されない</span></td></tr>'
            '<tr><td><span class="kw3">0.12</span></td>'
            '<td><span class="kw3">赤色骨髄・肺・結腸・胃・乳房</span></td>'
            '<td><span class="kw3">ほぼされない</span>'
            '（頭蓋骨の骨髄がわずかに入る程度）</td></tr>'
            '<tr><td>0.05</td><td>膀胱・食道・肝臓・甲状腺</td>'
            '<td>甲状腺がわずかに入りうる</td></tr>'
            '<tr><td><span class="kw4">0.01</span></td>'
            '<td><span class="kw4">骨表面・脳・唾液腺・皮膚</span></td>'
            '<td><span class="kw4">ここが主に照射される</span></td></tr>'
            '<tr><td colspan="3"><span class="kw3">頭部CTでは'
            '「重みの軽い臓器」しか照射されないので、'
            '吸収線量（Gy）は決して小さくないのに'
            '実効線量（mSv）は小さくなる</span>。<br>'
            '<span class="kw3">逆に腹部・骨盤CTは重みの大きい臓器を'
            'まとめて照射するので実効線量が跳ね上がる</span>。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">検査1回の被ばくが最も多いのは'
             '腹部ダイナミックCT（20〜30mSv）</span>。<br>'
             '② <span class="kw3">被ばく量＝撮影範囲×相の数×臓器の組織加重係数</span>。<br>'
             '③ <span class="kw3">胸部単純撮影0.06mSv／頭部CT約2mSv／'
             '胸部CT 5〜10mSv／上部消化管造影約3mSv／FDG-PET 2〜4mSv</span>。<br>'
             '④ <span class="kw3">頭部CTは範囲が狭く重みの軽い臓器しか'
             '照射しないので実効線量が低い</span>。<br>'
             '⑤ <span class="kw3">超音波・MRIは電離放射線を使わない（被ばく0）</span>。')),

    # ── NO.6 (113E-16) ★必修 95% ans=e ─────────────────────────
    Q('113E-16', 95, [('bs', '★'), ('bh', '必修')],
      '<strong>MRI でガドリニウム造影剤を使用する際に、'
      '最も注意すべき患者背景はどれか。</strong>',
      [('a', '脳卒中', False,
        '<span class="kw4">脳卒中そのものはガドリニウム造影剤の禁忌ではない</span>。'
        '<span class="kw">むしろ脳梗塞・脳腫瘍の評価でMRIは第一選択</span>であり、'
        '<span class="kw">急性期脳梗塞の診断には拡散強調像（単純）で足りる</span>。'
        '<span class="kw4">注意すべきは「造影剤が使えるか」ではなく'
        '「MRIに入れる状態か（安静を保てるか）」</span>のほう。'),
       ('b', '心房細動', False,
        '<span class="kw4">心房細動は造影剤とは無関係</span>。'
        '<span class="kw">検査上の注意としては、心臓MRIで心電図同期が'
        '取りにくくなる（画質が落ちる）という点はあるが、'
        '造影剤の安全性の問題ではない</span>。'),
       ('c', '間質性肺炎', False,
        '<span class="kw4">間質性肺炎はガドリニウム造影剤の禁忌ではない</span>。'
        '<span class="kw">なお造影剤アレルギーのリスク因子として'
        '重要なのは気管支喘息（＝気道の過敏性）</span>であり、'
        '<span class="kw4">間質性肺炎とは別の病態</span>である。'
        '<span class="kw4">「肺の病気」でひとくくりにしないこと</span>。'),
       ('d', '頭蓋内圧亢進症', False,
        '<span class="kw4">頭蓋内圧亢進は造影剤の禁忌ではない</span>。'
        '<span class="kw">造影MRIはむしろ原因（腫瘍・膿瘍・髄膜炎）の検索に必要</span>。'
        '<span class="kw">禁忌になるのは腰椎穿刺（脳ヘルニアの危険）</span>であって、'
        '<span class="kw4">画像検査ではない</span>——'
        'この2つを混同させる肢である。'),
       ('e', '人工透析中の慢性腎不全', True,
        '<span class="kw3">◯ 重度の腎機能低下（とくに透析中）は'
        'ガドリニウム造影剤の最も重要な禁忌</span>である。'
        '<span class="kw3">理由は腎性全身性線維症'
        '〈NSF：nephrogenic systemic fibrosis〉</span>。'
        '<span class="kw3">ガドリニウムは腎から排泄されるため、'
        '腎機能が失われていると体内に長く留まり、'
        'キレートから遊離したGdイオンが組織に沈着して'
        '皮膚・皮下組織・関節・さらには心臓・肺・肝までを'
        'びまん性に線維化させる</span>。'
        '<span class="kw3">四肢遠位から始まる皮膚の硬化と関節拘縮で'
        '歩行不能に至ることもあり、'
        '有効な治療法がなく予後不良</span>——'
        '<span class="kw4">だから「起きてから対処する」のではなく'
        '「起こさない」しかない</span>。'
        '<span class="kw">eGFR 30mL/分/1.73m<sup>2</sup>未満、'
        '急性腎障害、透析中の患者では原則使用しない</span>。')],
      'ガドリニウム＋腎不全＝腎性全身性線維症〈NSF〉。有効な治療がなく予防しかない。',
      patho=('🔎 造影剤の禁忌——ヨードもガドリニウムも「まず腎機能」',
             '<span class="kw3">造影剤の設問は、'
             '「腎機能」「喘息」「副作用歴」の3つを確認する習慣があれば'
             'ほぼ解ける</span>。'
             '<span class="kw3">なかでも腎機能は両方の造影剤に共通で、'
             'しかも起こる合併症が違う</span>のが要点である。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">ヨード造影剤（CT・血管造影）</span></th>'
             '<th><span class="kw3">ガドリニウム造影剤（MRI）</span></th></tr>'
             '<tr><td><span class="kw3">腎機能低下で起こること</span></td>'
             '<td><span class="kw3">造影剤腎症</span>'
             '——<span class="kw3">造影剤が腎を傷つける（腎機能が「悪くなる」）</span></td>'
             '<td><span class="kw3">腎性全身性線維症〈NSF〉</span>'
             '——<span class="kw3">排泄されない造影剤が全身を傷つける</span></td></tr>'
             '<tr><td>経過</td>'
             '<td><span class="kw3">投与後48〜72時間でCr上昇、'
             '多くは1〜2週で自然回復（可逆的）</span></td>'
             '<td><span class="kw4">数日〜数か月後に発症。'
             '有効な治療がなく不可逆・予後不良</span></td></tr>'
             '<tr><td>対策</td>'
             '<td><span class="kw3">生理食塩液による輸液（水分負荷）。'
             '腎毒性薬・NSAIDを避ける。ビグアナイド薬は休薬</span></td>'
             '<td><span class="kw3">重度腎障害では原則使用しない</span>。'
             'やむを得ない場合は最小量・安定性の高い製剤・'
             '直後の血液透析</span></td></tr>'
             '<tr><td>その他の共通の禁忌</td>'
             '<td colspan="2"><span class="kw3">造影剤副作用の既往・'
             '気管支喘息（アナフィラキシー様反応のリスク）</span></td></tr>'
             '<tr><td>ヨード特有</td>'
             '<td><span class="kw">甲状腺機能亢進症（ヨードで悪化）・'
             '多発性骨髄腫／マクログロブリン血症・褐色細胞腫・'
             'ビグアナイド薬内服</span></td><td>—</td></tr></table>'),
      deep=('💡 造影剤の副作用——即時型と遅発型、そして「アナフィラキシー様」',
            '<table class="tb"><tr><th>分類</th><th>時期</th><th>症状</th>'
            '<th>対応</th></tr>'
            '<tr><td><span class="kw3">即時型（急性）</span></td>'
            '<td><span class="kw3">投与から1時間以内'
            '（多くは5分以内）</span></td>'
            '<td><span class="kw">軽症：悪心・嘔吐・熱感・蕁麻疹<br>'
            '<span class="kw4">重症：喉頭浮腫・気管支攣縮・'
            '血圧低下・意識障害</span></span></td>'
            '<td><span class="kw4">重症ではただちにアドレナリン0.3mg筋注</span>'
            '（大腿前外側）＋酸素・輸液</td></tr>'
            '<tr><td>遅発型</td><td>1時間〜1週</td>'
            '<td>発疹・瘙痒</td><td>対症療法</td></tr>'
            '<tr><td><span class="kw3">造影剤腎症</span></td>'
            '<td><span class="kw3">48〜72時間</span></td>'
            '<td><span class="kw3">血清Crの上昇（多くは無症候性・非乏尿性）</span></td>'
            '<td><span class="kw3">経時的な腎機能評価と補液（NO.24）</span></td></tr>'
            '<tr><td><span class="kw4">NSF（Gdのみ）</span></td>'
            '<td><span class="kw4">数日〜数か月</span></td>'
            '<td><span class="kw4">四肢遠位から始まる皮膚硬化・関節拘縮・'
            '内臓の線維化</span></td>'
            '<td><span class="kw4">確立した治療なし。予防のみ</span></td></tr></table>'
            '<span class="kw3">⚠️ 造影剤の急性反応は「アナフィラキシー<u>様</u>反応」</span>'
            'と呼ばれる——'
            '<span class="kw3">IgEを介さない機序（ヒスタミンの直接遊離など）が'
            '主体で、初回投与でも起こりうる</span>からである。'
            '<span class="kw4">ただし対応は真のアナフィラキシーと同じで、'
            '重症ならアドレナリン筋注をためらわない</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">ガドリニウム造影剤＋重度腎機能低下＝'
             '腎性全身性線維症〈NSF〉</span>。'
             '<span class="kw4">治療法がなく予防のみ</span>。<br>'
             '② <span class="kw3">ヨード造影剤＋腎機能低下＝造影剤腎症'
             '（48〜72時間・多くは可逆的）</span>。<br>'
             '③ <span class="kw3">両者に共通の禁忌＝造影剤副作用の既往・'
             '気管支喘息・腎機能低下</span>。<br>'
             '④ <span class="kw">ヨード特有＝甲状腺機能亢進症・'
             '多発性骨髄腫・褐色細胞腫・ビグアナイド薬</span>。<br>'
             '⑤ <span class="kw4">重症の即時型反応にはアドレナリン0.3mg筋注</span>。')),

    # ── NO.7 (112D-69) ★ 96% ans=c,d ───────────────────────────
    Q('112D-69', 96, [('bs', '★')],
      '78 歳の男性。<span class="kw">約1 か月前から断続的に生じる肉眼的血尿</span>を'
      '主訴に来院した。排尿時痛はない。'
      '<span class="kw">60 歳時に前立腺癌に対して放射線照射を行った。</span>'
      '喫煙歴はない。血液所見に異常を認めない。'
      '<span class="kw">PSA 値は0.01ng/mL（基準4.0 以下）。</span><br>'
      '<strong>まず行うべき検査はどれか。2つ選べ。</strong>',
      [('a', '骨シンチグラフィ', False,
        '<span class="kw4">骨シンチは前立腺癌の骨転移を探す検査</span>だが、'
        '<span class="kw4">PSA 0.01ng/mL は「検出限界以下」で'
        '前立腺癌は完全に制御されている</span>。'
        '<span class="kw4">再発を疑う根拠がない</span>ので、'
        '血尿の精査としては的外れである。'
        '<span class="kw3">「PSA 0.01」という数字は'
        '「これは前立腺癌の再発ではない」と宣言するために'
        '置かれている</span>。'),
       ('b', '腎シンチグラフィ', False,
        '<span class="kw4">腎シンチは腎機能の左右差や'
        '尿路の通過障害、瘢痕の評価に用いる機能検査</span>で、'
        '<span class="kw4">血尿の原因となる腫瘍や結石の形態評価には向かない</span>。'
        '<span class="kw">血液所見に異常がなく腎機能低下も示唆されていない</span>。'),
       ('c', '腹部超音波検査', True,
        '<span class="kw3">◯ 肉眼的血尿の精査では、'
        'まず上部尿路（腎・尿管）と膀胱を画像で評価する</span>。'
        '<span class="kw3">腹部超音波は非侵襲・被ばくなし・安価で'
        '腎腫瘍・水腎症・結石・膀胱内の腫瘤をスクリーニングできる</span>ので'
        '第一段階に適する。'
        '<span class="kw">（上部尿路の精査を厳密に行うなら'
        '造影CT〈CTウログラフィ〉が最も感度が高いが、'
        '「まず行うべき」検査としては超音波が置かれる）</span>'),
       ('d', '膀胱鏡検査', True,
        '<span class="kw3">◯ 肉眼的血尿の精査で最も重要な検査</span>。'
        '<span class="kw3">膀胱・尿道の粘膜を直接観察でき、'
        '画像では捉えにくい平坦な病変（上皮内癌）も見つけられる</span>。'
        '<span class="kw3">本例は60歳時の骨盤内放射線照射という'
        '明確な背景がある</span>——'
        '<span class="kw3">照射後の晩期障害である放射線性膀胱炎'
        '（出血性膀胱炎）と、二次性の膀胱癌の両方を'
        '同時に鑑別できるのが膀胱鏡</span>である。'
        '<span class="kw3">加えて尿細胞診を組み合わせるのが定石</span>。'),
       ('e', 'FDG-PET', False,
        '<span class="kw4">FDGは尿中に排泄されるため'
        '腎盂・尿管・膀胱に強い生理的集積が生じ、'
        '尿路の病変検出には向かない</span>——'
        '<span class="kw4">これは核医学の基本的な弱点</span>である。'
        '<span class="kw">全身の悪性腫瘍検索や病期診断には有用だが、'
        '「まず行うべき」一次検査ではない</span>。')],
      '肉眼的血尿の精査＝膀胱鏡＋尿細胞診＋上部尿路の画像。FDGは尿に出るので不適。',
      patho=('🔎 肉眼的血尿を見たら——「悪性腫瘍を否定するまで終わらない」',
             '<span class="kw3">無症候性（無痛性）の肉眼的血尿は'
             '尿路上皮癌の代表的な初発症状</span>であり、'
             '<span class="kw3">「一度出て止まったから大丈夫」ではない'
             '（断続的に出るのが典型）</span>。'
             '<table class="tb"><tr><th>手順</th><th>検査</th><th>ねらい</th></tr>'
             '<tr><td>①</td><td><span class="kw3">尿検査・尿沈渣</span></td>'
             '<td><span class="kw3">糸球体性か非糸球体性か</span>'
             '（変形赤血球・赤血球円柱・蛋白尿があれば腎炎を疑う）</td></tr>'
             '<tr><td>②</td><td><span class="kw3">尿細胞診</span></td>'
             '<td><span class="kw3">尿路上皮癌の検出</span>'
             '（<span class="kw">高異型度の癌・上皮内癌で陽性率が高い</span>）</td></tr>'
             '<tr><td>③</td><td><span class="kw3">膀胱鏡</span></td>'
             '<td><span class="kw3">膀胱・尿道の直接観察</span>——'
             '<span class="kw3">平坦な上皮内癌は画像では写らない</span></td></tr>'
             '<tr><td>④</td><td><span class="kw3">上部尿路の画像'
             '（超音波／造影CT・CTウログラフィ）</span></td>'
             '<td><span class="kw3">腎細胞癌・腎盂尿管癌・結石・水腎症</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">この3点セット'
             '（尿細胞診・膀胱鏡・上部尿路の画像）で'
             '尿路全体を漏れなく評価する</span>のが原則。<br>'
             '<span class="kw3">尿路上皮は腎盂から尿道まで連続しており、'
             '多発・再発しやすい（field cancerization）</span>ので'
             '「膀胱だけ見て終わり」にしない。</td></tr></table>'),
      deep=('💡 放射線照射の既往がある患者の血尿——2つの晩期障害を考える',
            '<span class="kw3">本例のポイントは'
            '「18年前に骨盤内へ放射線照射を受けている」こと</span>である。'
            '<table class="tb"><tr><th>考えるべきもの</th><th>機序</th>'
            '<th>時期</th><th>診断</th></tr>'
            '<tr><td><span class="kw3">放射線性（出血性）膀胱炎</span></td>'
            '<td><span class="kw3">粘膜下の血管が拡張・脆弱化し'
            '（毛細血管拡張）、粘膜が虚血性に萎縮する</span></td>'
            '<td><span class="kw3">照射後数か月〜十数年（晩期障害）</span></td>'
            '<td><span class="kw3">膀胱鏡で毛細血管拡張と'
            '易出血性の粘膜を確認</span></td></tr>'
            '<tr><td><span class="kw3">二次性膀胱癌</span></td>'
            '<td><span class="kw3">照射による発がん（確率的影響）</span></td>'
            '<td><span class="kw3">照射後10年以上（潜伏期が長い）</span></td>'
            '<td><span class="kw3">膀胱鏡＋生検＋尿細胞診</span></td></tr>'
            '<tr><td><span class="kw4">前立腺癌の再発</span></td>'
            '<td>—</td><td>—</td>'
            '<td><span class="kw4">PSA 0.01ng/mL で否定されている</span></td></tr></table>'
            '<span class="kw3">どちらも膀胱鏡で診断に近づける</span>——'
            '<span class="kw3">だから本例で膀胱鏡は「あってもいい検査」ではなく'
            '「必ず行う検査」である</span>。'
            '<span class="kw">なお放射線性膀胱炎の治療は'
            '保存的（止血・膀胱内注入・高気圧酸素療法）が中心</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">無症候性肉眼的血尿＝尿路上皮癌を'
             '否定するまで精査する</span>。<br>'
             '② <span class="kw3">精査の3点セット＝尿細胞診・膀胱鏡・'
             '上部尿路の画像（超音波／造影CT）</span>。<br>'
             '③ <span class="kw3">平坦な上皮内癌は画像に写らない</span>——'
             '<span class="kw3">膀胱鏡が要る</span>。<br>'
             '④ <span class="kw3">骨盤照射後の血尿＝放射線性膀胱炎と'
             '二次性膀胱癌の2つを考える</span>。<br>'
             '⑤ <span class="kw4">FDGは尿中に排泄されるので尿路病変の検出に不向き</span>'
             '（脳と尿路の集積は生理的）。')),

    # ── NO.8 (107B-26) ★ 92% ans=e ─────────────────────────────
    Q('107B-26', 92, [('bs', '★')],
      '<strong>血管造影検査を行う際、動脈を穿刺し血液の逆流を確認した後、'
      '次に用いるのはどれか。</strong>',
      [('a', 'コイル', False,
        '<span class="kw4">コイルは血管を「詰める」ための塞栓物質</span>で、'
        '<span class="kw4">手技の最後に、目的の血管まで到達してから使う</span>。'
        '<span class="kw">脳動脈瘤・肺動静脈瘻・'
        '消化管出血（NO.33）などの塞栓術に用いる</span>。'),
       ('b', 'ステント', False,
        '<span class="kw4">ステントは狭窄した血管を内側から支える器具</span>で、'
        '<span class="kw4">これも治療の最終段階</span>。'
        '<span class="kw">閉塞性動脈硬化症・冠動脈狭窄・頸動脈狭窄症</span>に用いる。'),
       ('c', 'バルーン', False,
        '<span class="kw4">バルーンは狭窄部を拡張する器具</span>で、'
        '<span class="kw4">やはり目的血管に到達してから使うもの</span>。'
        '<span class="kw">「穿刺の直後」ではない</span>。'),
       ('d', 'カテーテル', False,
        '<span class="kw4">カテーテルは正しい器具だが「順番」が違う</span>。'
        '<span class="kw3">セルディンガー法では、'
        'ガイドワイヤを血管内に進めてから、それに被せる形で'
        'シース・カテーテルを入れる</span>。'
        '<span class="kw4">ガイドワイヤなしにカテーテルを進めると'
        '血管壁を損傷する（解離・穿孔）</span>ので、'
        '<span class="kw3">必ずワイヤが先</span>である。'
        '<span class="kw3">「最も紛らわしい肢」で、'
        '手技の順序を正確に知っているかが問われている</span>。'),
       ('e', 'ガイドワイヤ', True,
        '<span class="kw3">◯ セルディンガー法の手順で、'
        '逆血を確認した直後に入れるのはガイドワイヤ</span>である。'
        '<span class="kw3">①穿刺針で血管前壁を穿刺 → '
        '②内套針を抜いて逆血（拍動性の動脈血）を確認 → '
        '<u>③ガイドワイヤを血管内へ深く進める</u> → '
        '④針を抜いてワイヤを残し、'
        'イントロデューサー（シース＋ダイレーター）を挿入 → '
        '⑤ワイヤに沿ってカテーテルを進める</span>。'
        '<span class="kw3">この方法の要点は'
        '「血管を露出させずに、細い針の穴を'
        'ワイヤを介して段階的に広げていく」</span>ところにあり、'
        '<span class="kw3">中心静脈カテーテル挿入・'
        '経皮的ドレナージ・胸腔ドレーンなど'
        'およそすべての経皮的手技の共通の型</span>になっている。')],
      'セルディンガー法＝穿刺→逆血確認→ガイドワイヤ→シース→カテーテル。ワイヤが先。',
      patho=('🔎 セルディンガー法——「ワイヤを残して太くしていく」',
             '<span class="kw3">Seldinger法は、血管を切開して露出させることなく'
             'カテーテルを血管内へ導く手技</span>で、'
             '<span class="kw3">IVRだけでなく中心静脈路の確保・'
             '各種ドレナージ・胸腔ドレーンにも共通して使われる</span>。'
             '<table class="tb"><tr><th>手順</th><th>使う器具</th><th>要点</th></tr>'
             '<tr><td>①穿刺</td><td><span class="kw">穿刺針'
             '（内套針＋外套針）</span></td>'
             '<td><span class="kw3">体表から触れる動脈'
             '（大腿動脈・橈骨動脈・上腕動脈）を選ぶ</span></td></tr>'
             '<tr><td><span class="kw3">②逆血の確認</span></td>'
             '<td>—</td>'
             '<td><span class="kw3">内套針を抜き、'
             '拍動性の血液の逆流で血管内にあることを確かめる</span></td></tr>'
             '<tr><td><span class="kw3">③ガイドワイヤ挿入</span></td>'
             '<td><span class="kw3">ガイドワイヤ</span></td>'
             '<td><span class="kw3">柔らかい先端で血管を傷つけずに深く進める。'
             '<u>抵抗があれば絶対に押し込まない</u></span></td></tr>'
             '<tr><td>④シース留置</td>'
             '<td><span class="kw">イントロデューサー'
             '（シース＋ダイレーター）</span></td>'
             '<td><span class="kw3">ワイヤを残したまま針を抜き、'
             'ワイヤに沿って挿入して穴を広げる</span></td></tr>'
             '<tr><td>⑤カテーテル操作</td>'
             '<td><span class="kw">カテーテル（＋ガイドワイヤ）</span></td>'
             '<td><span class="kw3">シースを通して目的血管へ。'
             'ヨード造影剤で血管解剖を描出し、必要なら治療へ移る</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">合言葉は'
             '「針 → ワイヤ → シース → カテーテル」で、'
             '一貫して<u>細いものから太いものへ、ワイヤを軸にして</u>進む</span>。</td></tr>'
             '</table>'),
      deep=('💡 血管造影の位置づけ——診断法としては高侵襲、治療としては低侵襲',
            '<span class="kw3">CT・MRIが発達した現在、'
            '「診断だけのため」に血管造影を行うことはほとんどない</span>。'
            '<table class="tb"><tr><th></th><th>利点</th><th>欠点</th></tr>'
            '<tr><td><span class="kw3">診断法として</span></td>'
            '<td><span class="kw">空間・時間分解能が高く、'
            '血流の動きをリアルタイムに見られる</span></td>'
            '<td><span class="kw4">高侵襲（動脈穿刺）・被ばくが多い'
            '（術者も）・ヨード造影剤が必要・術者の技量に左右される</span>'
            '<br><span class="kw4">妊婦は禁忌</span></td></tr>'
            '<tr><td><span class="kw3">治療法として</span></td>'
            '<td><span class="kw3">開胸・開腹せずに'
            '止血・塞栓・拡張・薬剤注入ができる＝外科手術より低侵襲</span></td>'
            '<td>—</td></tr>'
            '<tr><td colspan="3"><span class="kw3">だから現在の血管造影は'
            '「IVRを行うための手技」として位置づけられる</span>。<br>'
            '<span class="kw">なおデジタルサブトラクション血管造影〈DSA〉は、'
            '造影前の画像を差し引いて骨を消し血管だけを表示する方法</span>で、'
            '<span class="kw">少ない造影剤・低線量で'
            'コントラストの良い像が得られる</span>。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">セルディンガー法＝穿刺 → 逆血確認 → '
             '<u>ガイドワイヤ</u> → シース → カテーテル</span>。<br>'
             '② <span class="kw3">ガイドワイヤが先、カテーテルは後</span>'
             '（ワイヤなしで進めると血管を傷つける）。<br>'
             '③ <span class="kw">中心静脈カテーテル・ドレナージも同じ手順</span>。<br>'
             '④ <span class="kw3">血管造影は診断としては高侵襲、'
             '治療（IVR）としては低侵襲</span>。<br>'
             '⑤ <span class="kw">DSA＝造影前後の引き算で骨を消し血管だけを描出</span>。')),

]
