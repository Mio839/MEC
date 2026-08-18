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


QUESTIONS += [

    # ── NO.9 (115F-40) ★ 97% ans=e ─────────────────────────────
    Q('115F-40', 97, [('bs', '★')],
      '74 歳の男性。<span class="kw">1 週前に大動脈弁狭窄症に対して'
      '大動脈弁置換術を施行した。</span>術後経過は良好で退院を目指し、'
      '一般病棟でリハビリテーションに励んでいた。'
      '<span class="kw">昨日から食欲不振があり、今朝から息切れと全身倦怠感を訴えている。</span>'
      '意識は清明。体温36.7℃。脈拍100/ 分、整。'
      '<span class="kw">血圧94/74mmHg</span>。呼吸数18/ 分。SpO<sub>2</sub> 98％（room air）。'
      '眼瞼結膜は軽度貧血様で、眼球結膜に黄染を認めない。'
      '<span class="kw">頸静脈怒張を認める。心音は減弱。呼吸音に異常を認めない。</span>'
      '腹部は平坦、軟で、胸部正中に手術痕を認める。'
      '血液所見：赤血球352 万、Hb 10.7g/dL、Ht 31％、白血球8,700、血小板10 万。'
      '血液生化学所見：アルブミン3.3g/dL、総ビリルビン1.2mg/dL、AST 31U/L、ALT 52U/L、'
      'LD 331U/L（基準120 ～245）、CK 50U/L（基準30 ～140）、尿素窒素30mg/dL、'
      'クレアチニン1.1mg/dL、Na 136mEq/L、K 5.1mEq/L、Cl 99mEq/L。CRP 1.2mg/dL。'
      '胸部エックス線写真（A）及び胸部単純CT（B）を示す。<br>'
      '<strong>症状に最も関連している病態はどれか。</strong>',
      [('a', '気　胸', False,
        '<span class="kw4">気胸なら患側の呼吸音減弱と'
        '胸部エックス線写真での虚脱した肺・肺紋理を欠く'
        '透亮域がみられるはず</span>だが、'
        '<span class="kw4">本例は「呼吸音に異常を認めない」うえ'
        'SpO<sub>2</sub> 98%と酸素化も保たれている</span>。'
        '<span class="kw">緊張性気胸なら頸静脈怒張と血圧低下は出るが、'
        '呼吸音は必ず左右差を生じる</span>。'),
       ('b', '貧　血', False,
        '<span class="kw4">Hb 10.7g/dL は術後としてはよくある程度の'
        '軽度貧血で、息切れと全身倦怠感の主因とするには軽すぎる</span>。'
        '<span class="kw4">何より貧血では頸静脈怒張も心音減弱も説明できない</span>。'
        '<span class="kw">貧血が原因なら循環血液量が減って'
        '頸静脈はむしろ虚脱する</span>。'),
       ('c', '縦隔炎', False,
        '<span class="kw4">胸骨正中切開後の縦隔炎は重篤な合併症だが、'
        '発熱・創部の発赤や排膿・強い炎症反応を伴う</span>。'
        '<span class="kw4">本例は体温36.7℃、白血球8,700、CRP 1.2mg/dLと'
        '炎症所見に乏しい</span>。'),
       ('d', '胸水貯留', False,
        '<span class="kw4">胸水があれば患側の呼吸音減弱・打診での濁音・'
        'エックス線写真での肋骨横隔膜角の鈍化がみられる</span>。'
        '<span class="kw4">本例は呼吸音正常で、'
        'しかも胸水では頸静脈怒張と心音減弱は説明できない</span>。'
        '<span class="kw">心囊液貯留に伴って少量の胸水を認めることはあるが、'
        '「最も関連している病態」ではない</span>。'),
       ('e', '心囊液貯留', True,
        '<span class="kw3">◯ 心臓手術後の心タンポナーデ</span>。'
        '<span class="kw3">Beckの三徴＝①血圧低下 ②頸静脈怒張 ③心音減弱</span>が'
        'そのまま並んでいる。'
        '<span class="kw3">加えて脈圧の狭小化（94/74mmHg＝脈圧20mmHg）</span>も'
        '典型的で、<span class="kw3">心囊内圧の上昇で拡張期の充満が妨げられ、'
        '1回拍出量が落ちて代償性頻脈（100/分）になっている</span>。'
        '<span class="kw3">心臓手術後1週というのは'
        '亜急性〜遅発性心タンポナーデの好発時期</span>で、'
        '<span class="kw3">徐々に貯留するため急性のような'
        'ショックにならず、「食欲不振・全身倦怠感・息切れ」という'
        '非特異的な訴えで始まる</span>のが臨床的な落とし穴である。'
        '<span class="kw3">診断は心エコー（右房・右室の拡張期虚脱）が最速で、'
        '治療は心囊穿刺／ドレナージ</span>。')],
      'Beckの三徴（血圧低下・頸静脈怒張・心音減弱）＋術後1週＝心タンポナーデ。',
      imgs=[IMG + '115F-40_1.jpeg', IMG + '115F-40_2.jpeg'],
      patho=('🔎 画像所見——胸部エックス線写真の心陰影拡大と、CTの心囊液',
             '<span class="kw3">A（胸部エックス線写真）では心陰影が'
             '左右へ大きく張り出し、いわゆる「フラスコ状」の輪郭を呈する</span>。'
             '<span class="kw3">肺野は清明で肺うっ血を伴わない</span>のが要点——'
             '<span class="kw3">心不全なら肺うっ血・Kerley B線・胸水を伴うが、'
             '心タンポナーデでは「心陰影だけが大きく、肺野は綺麗」</span>になる。<br>'
             '<span class="kw3">B（胸部単純CT）では、心臓の全周を取り囲む'
             '三日月〜輪状の低吸収域＝心囊液貯留</span>が確認できる。'
             '<span class="kw3">単純CTでも液体（水に近いCT値）と'
             '心筋（軟部組織）のコントラストで判別できる</span>。'
             '<table class="tb"><tr><th></th><th>心タンポナーデ</th>'
             '<th>心不全（うっ血）</th><th>緊張性気胸</th></tr>'
             '<tr><td>頸静脈怒張</td>'
             '<td><span class="kw3">あり</span></td>'
             '<td><span class="kw">あり</span></td>'
             '<td><span class="kw">あり</span></td></tr>'
             '<tr><td>心　音</td>'
             '<td><span class="kw3">減弱</span></td>'
             '<td>Ⅲ音・Ⅳ音</td><td>減弱（偏位）</td></tr>'
             '<tr><td>呼吸音</td>'
             '<td><span class="kw3">正常</span></td>'
             '<td><span class="kw">湿性ラ音</span></td>'
             '<td><span class="kw4">患側で消失</span></td></tr>'
             '<tr><td>胸部エックス線</td>'
             '<td><span class="kw3">心陰影拡大・肺野は清明</span></td>'
             '<td><span class="kw">心拡大＋肺うっ血・胸水</span></td>'
             '<td><span class="kw4">患側の透亮・縦隔偏位</span></td></tr>'
             '<tr><td>脈　圧</td>'
             '<td><span class="kw3">狭小（本例20mmHg）・奇脈</span></td>'
             '<td>—</td><td>—</td></tr>'
             '<tr><td>対応</td>'
             '<td><span class="kw3">心囊穿刺・ドレナージ</span></td>'
             '<td>利尿薬・血管拡張薬</td>'
             '<td><span class="kw4">緊急脱気</span></td></tr></table>'),
      deep=('💡 CTで液体をどう見分けるか——CT値という物差し',
            '<span class="kw3">CTの画素値（CT値、単位HU）は'
            '「水を0、空気を−1000」と決めた相対的な吸収値</span>で、'
            '<span class="kw3">これを覚えておくと単純CTでも'
            '中身をかなり推定できる</span>。'
            '<table class="tb"><tr><th>組織・物質</th><th>CT値（HU）</th>'
            '<th>臨床での使いどころ</th></tr>'
            '<tr><td><span class="kw3">骨・石灰化</span></td>'
            '<td><span class="kw3">＞100（骨皮質は1000前後）</span></td>'
            '<td><span class="kw3">結石・血管の石灰化・骨折</span></td></tr>'
            '<tr><td><span class="kw3">急性期の血腫</span></td>'
            '<td><span class="kw3">＞50（50〜80）</span></td>'
            '<td><span class="kw3">頭蓋内出血・血性心囊液／胸腹水</span>'
            '——<span class="kw3">単純CTで「白い」のが出血</span></td></tr>'
            '<tr><td>軟部組織・筋</td><td>約50（40〜60）</td>'
            '<td>基準になる</td></tr>'
            '<tr><td><span class="kw3">水・漿液</span></td>'
            '<td><span class="kw3">0前後</span></td>'
            '<td><span class="kw3">囊胞・漿液性の胸腹水・心囊液</span></td></tr>'
            '<tr><td><span class="kw">脂　肪</span></td>'
            '<td><span class="kw">−100前後</span></td>'
            '<td><span class="kw">脂肪腫・奇形腫・脂肪肝</span></td></tr>'
            '<tr><td><span class="kw">空　気</span></td>'
            '<td><span class="kw">−1000</span></td>'
            '<td><span class="kw">気胸・遊離ガス・消化管ガス</span></td></tr>'
            '<tr><td colspan="3"><span class="kw3">表示の設定も重要</span>——'
            '<span class="kw3">ウインドウレベル＝表示する濃度の中心'
            '（写真の明るさ）、ウインドウ幅＝表示する濃度の幅'
            '（コントラスト）</span>。'
            '<span class="kw">肺野条件・縦隔条件・骨条件は'
            'この2つを変えているだけで、元のデータは同じ</span>。</td></tr></table>'
            '<span class="kw3">心囊液が血性（術後出血）か漿液性かは'
            'CT値でおおよそ推定でき、治療の緊急度に関わる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">心タンポナーデのBeckの三徴＝'
             '血圧低下・頸静脈怒張・心音減弱</span>。'
             '<span class="kw3">＋脈圧狭小・奇脈・頻脈</span>。<br>'
             '② <span class="kw3">胸部エックス線では「心陰影拡大＋肺野は清明」</span>。<br>'
             '③ <span class="kw3">診断は心エコー（右房・右室の拡張期虚脱）、'
             '治療は心囊穿刺・ドレナージ</span>。<br>'
             '④ <span class="kw">心臓手術後1〜2週は遅発性心タンポナーデの好発時期</span>——'
             '<span class="kw">非特異的な倦怠感・食欲不振で始まる</span>。<br>'
             '⑤ <span class="kw3">CT値＝骨100超／出血50超／軟部50／水0／'
             '脂肪−100／空気−1000</span>。')),

    # ── NO.10 (113D-50) ★ 80% ans=a ────────────────────────────
    Q('113D-50', 80, [('bs', '★')],
      '72 歳の男性。6 か月前からの頻尿を主訴に来院した。'
      '1 日に何度もトイレに行きたくなることがあるが、'
      '咳やくしゃみをしたときに尿が漏れることはない。'
      '1 か月前から排尿時の違和感を感じるようになり、軽快しないため受診した。'
      '既往歴と家族歴とに特記すべきことはない。腹部は平坦、軟で、肝・脾を触知しない。'
      '尿所見：蛋白（－）、糖（－）、潜血1 ＋、沈渣は赤血球5 ～9/HPF、白血球5 ～9/HPF。'
      '血液所見：赤血球442 万、Hb 14.0g/dL、Ht 40％、白血球7,400、血小板24 万。'
      '血液生化学所見：総蛋白6.9g/dL、アルブミン4.3g/dL、総ビリルビン1.2mg/dL、'
      'AST 21U/L、ALT 15U/L、尿素窒素22mg/dL、クレアチニン1.0mg/dL、'
      '<span class="kw">尿酸8.6mg/dL</span>、血糖94mg/dL、総コレステロール192mg/dL、'
      'Na 142mEq/L、K 4.6mEq/L、Cl 106mEq/L。腹部超音波検査で水腎症を認めない。'
      '腹部エックス線写真（A）及び腹部単純CT（B）を示す。'
      '<span class="kw">砕石術を行ったところ、赤レンガ色の結石を排出した。</span><br>'
      '<strong>再発予防に有効な薬剤はどれか。</strong>',
      [('a', 'アロプリノール', True,
        '<span class="kw3">◯ 尿酸結石の再発予防</span>。'
        '<span class="kw3">アロプリノールはキサンチンオキシダーゼ阻害薬で、'
        '尿酸の産生そのものを抑える</span>——'
        '<span class="kw3">血中・尿中の尿酸量を減らすので結石の材料が減る</span>。'
        '<span class="kw3">尿酸結石の予防で最も重要なのは'
        '「尿のアルカリ化（クエン酸製剤で尿pH 6.2〜6.8へ）」と'
        '「十分な飲水（1日尿量2L以上）」で、'
        '高尿酸血症を伴う例ではこれに尿酸生成抑制薬を加える</span>。'
        '<span class="kw3">本例は尿酸8.6mg/dLと高値なのでよい適応</span>。'),
       ('b', 'サイアザイド系利尿薬', False,
        '<span class="kw4">サイアザイドが再発予防に有効なのは'
        '「高カルシウム尿症を伴うカルシウム結石」</span>である'
        '（<span class="kw">遠位尿細管でのCa再吸収を促進して尿中Caを減らす</span>）。'
        '<span class="kw4">しかもサイアザイドは尿酸の排泄を抑制して'
        '血清尿酸値を上げる</span>ので、'
        '<span class="kw4">尿酸結石にはむしろ不利</span>である。'),
       ('c', 'チオプロニン', False,
        '<span class="kw4">チオプロニン（およびD-ペニシラミン）は'
        'シスチン結石に用いる薬剤</span>。'
        '<span class="kw">シスチンとジスルフィド結合を作って'
        '溶解度の高い複合体にする</span>。'
        '<span class="kw4">シスチン結石は常染色体潜性遺伝の'
        'シスチン尿症による小児〜若年発症の結石</span>で、'
        '<span class="kw4">72歳の初発例では考えにくい</span>。'),
       ('d', 'ビタミンD 製剤', False,
        '<span class="kw4">活性型ビタミンDは腸管からのカルシウム吸収を促進し、'
        '尿中カルシウム排泄を増やす</span>ので、'
        '<span class="kw4">むしろ結石のリスクを上げる</span>。'
        '<span class="kw4">予防薬として真逆</span>である。'),
       ('e', 'ベンズブロマロン', False,
        '<span class="kw4">ベンズブロマロンは尿酸<u>排泄促進</u>薬</span>——'
        '<span class="kw4">尿中への尿酸排泄を増やすので、'
        '尿酸結石の患者には禁忌に近い</span>。'
        '<span class="kw3">同じ「高尿酸血症の薬」でも、'
        '尿路結石があるときは<u>産生抑制薬（アロプリノール・'
        'フェブキソスタット）</u>を選び、'
        '<u>排泄促進薬は避ける</u></span>——'
        '<span class="kw3">この使い分けが本問の核心</span>である。')],
      '赤レンガ色＋Ｘ線陰性＝尿酸結石。産生抑制薬（アロプリノール）で、排泄促進薬は禁。',
      imgs=[IMG + '113D-50_1.jpeg', IMG + '113D-50_2.jpeg'],
      patho=('🔎 画像所見——「単純エックス線で写らないのにCTでは写る」',
             '<span class="kw3">A（腹部エックス線写真・仰臥位）では'
             '尿路に一致する明らかな石灰化陰影を指摘できない</span>'
             '＝<span class="kw3">Ｘ線陰性結石</span>。'
             '<span class="kw3">一方 B（腹部単純CT）では高吸収の結石が描出される</span>。'
             '<span class="kw3">この「単純撮影で写らないのにCTでは写る」という'
             '組合せが、尿酸結石を強く示唆する</span>。'
             '<table class="tb"><tr><th>結石の種類</th><th>頻度</th>'
             '<th>単純エックス線</th><th>CT</th><th>背景・予防</th></tr>'
             '<tr><td><span class="kw3">シュウ酸カルシウム／'
             'リン酸カルシウム</span></td>'
             '<td><span class="kw3">約80%（最多）</span></td>'
             '<td><span class="kw3">陽性（写る）</span></td>'
             '<td>高吸収</td>'
             '<td><span class="kw">飲水・クエン酸。'
             '高Ca尿症にはサイアザイド</span>。'
             '<span class="kw4">カルシウム制限は逆効果</span></td></tr>'
             '<tr><td><span class="kw3">尿酸結石</span></td>'
             '<td><span class="kw3">約5〜10%</span></td>'
             '<td><span class="kw3">陰性（写らない）</span></td>'
             '<td><span class="kw3">写る</span></td>'
             '<td><span class="kw3">赤レンガ色。高尿酸血症・酸性尿・'
             '痛風・脱水・肥満。予防は尿アルカリ化＋飲水'
             '＋アロプリノール</span></td></tr>'
             '<tr><td><span class="kw">リン酸マグネシウム'
             'アンモニウム（ストルバイト）</span></td>'
             '<td>数%</td><td><span class="kw">陽性</span></td><td>写る</td>'
             '<td><span class="kw">ウレアーゼ産生菌（Proteus）による'
             '感染結石。サンゴ状結石を作る</span></td></tr>'
             '<tr><td><span class="kw">シスチン結石</span></td>'
             '<td>1%未満</td>'
             '<td><span class="kw">やや写りにくい</span></td><td>写る</td>'
             '<td><span class="kw">シスチン尿症（遺伝性）。'
             '小児〜若年。チオプロニン</span></td></tr>'
             '<tr><td colspan="5"><span class="kw3">尿路結石を疑ったときの'
             '第一選択の画像検査は「単純CT」</span>——'
             '<span class="kw3">造影しなくても、ほぼすべての結石が'
             '高吸収に描出されるから</span>'
             '（<span class="kw4">例外はインジナビルなど一部の薬剤性結石</span>）。</td></tr>'
             '</table>'),
      deep=('💡 「Ｘ線陰性結石」を疑わせる文の型',
            '<span class="kw3">国試では尿酸結石を'
            '3通りの書き方で示してくる</span>。'
            '<table class="tb"><tr><th>本文の記載</th><th>意味</th></tr>'
            '<tr><td><span class="kw3">腹部エックス線写真で結石を指摘できない'
            '／Ｘ線陰性</span></td>'
            '<td><span class="kw3">尿酸結石（またはシスチン・薬剤性）</span></td></tr>'
            '<tr><td><span class="kw3">赤レンガ色・黄褐色の結石を排出した</span></td>'
            '<td><span class="kw3">尿酸結石の肉眼所見</span></td></tr>'
            '<tr><td><span class="kw3">痛風・高尿酸血症・'
            '尿酸排泄促進薬の内服・肥満・酸性尿</span></td>'
            '<td><span class="kw3">尿酸結石の背景因子</span></td></tr>'
            '<tr><td colspan="2"><span class="kw3">この3つのどれかが出たら'
            '「単純CTで確認 → 尿アルカリ化＋飲水＋'
            '（高尿酸血症があれば）アロプリノール」</span>という筋になる。<br>'
            '<span class="kw3">尿酸結石は尿をアルカリ化すると'
            '<u>溶解する</u>のが特徴</span>——'
            '<span class="kw3">他の結石と違い、薬で溶かせる唯一の結石</span>である。</td></tr>'
            '</table>'
            '<span class="kw4">⚠️ 高尿酸血症の薬の使い分けは'
            '尿路結石の有無で決まる</span>——'
            '<span class="kw3">結石がある／尿酸排泄が多い → 産生抑制薬'
            '（アロプリノール・フェブキソスタット）／'
            '尿酸排泄が少ない → 排泄促進薬（ベンズブロマロン）</span>。'
            '<span class="kw4">結石患者に排泄促進薬を使うと'
            '結石を作りに行くことになる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">Ｘ線陰性＋赤レンガ色＝尿酸結石</span>。'
             '<span class="kw3">単純CTでは写る</span>。<br>'
             '② <span class="kw3">尿酸結石の予防＝尿のアルカリ化'
             '（クエン酸製剤）＋飲水＋アロプリノール</span>。<br>'
             '③ <span class="kw4">ベンズブロマロン（排泄促進薬）は尿酸結石に不適</span>。<br>'
             '④ <span class="kw">サイアザイド＝高Ca尿症のカルシウム結石／'
             'チオプロニン＝シスチン結石</span>。<br>'
             '⑤ <span class="kw3">尿路結石を疑ったらまず単純CT</span>'
             '（造影不要でほぼ全部写る）。')),

    # ── NO.11 (オリジナル) ★ rate=None ans=e ────────────────────
    Q('オリジナル', None, [('bs', '★')],
      '頭部CT を示す。<br><strong>診断はどれか。</strong>',
      [('a', '脳腫瘍', False,
        '<span class="kw4">脳腫瘍なら腫瘤性病変・周囲の浮腫（低吸収域）・'
        '正中偏位や脳室の変形といった占拠性病変の所見がみられる</span>。'
        '<span class="kw4">本例の単純CTにはそうした所見がない</span>。'),
       ('b', '水頭症', False,
        '<span class="kw4">水頭症では脳室が拡大する</span>'
        '（<span class="kw">側脳室前角の開大、Evans indexの上昇、'
        '第三脳室・側頭角の拡大</span>）。'
        '<span class="kw4">本例では脳室系の拡大を認めない</span>。'),
       ('c', '脳動脈瘤', False,
        '<span class="kw4">未破裂脳動脈瘤は単純CTではほとんど描出できない</span>——'
        '<span class="kw4">血管と同じ吸収値だから</span>。'
        '<span class="kw">診断にはCTA・MRA・脳血管造影が要る</span>。'
        '<span class="kw4">「単純CTで動脈瘤を診断する」という設定が'
        'そもそも成り立たない</span>。'),
       ('d', 'くも膜下出血', False,
        '<span class="kw4">くも膜下出血なら、'
        '本来は黒く見えるはずの脳底槽・シルビウス裂・'
        '迂回槽といったくも膜下腔が'
        '血液（CT値50〜80HU）で白く埋まる</span>——'
        '<span class="kw4">いわゆる「ヒトデ型（star sign）」</span>。'
        '<span class="kw4">本例では脳底部の脳槽は黒く保たれており、'
        '高吸収域を認めない</span>。'
        '<span class="kw3">単純CTはくも膜下出血の検出には'
        '極めて優れた検査で、発症直後の感度は90%以上</span>である。'),
       ('e', '超急性期脳梗塞', True,
        '<span class="kw3">◯ 「単純CTがほぼ正常に見える」ことこそが、'
        '超急性期脳梗塞を示唆する所見である</span>。'
        '<span class="kw3">脳梗塞では細胞性浮腫によって'
        '組織の含水量が増えCT値が下がるが、'
        'それが視認できる低吸収域として現れるまでには'
        '数時間〜24時間かかる</span>——'
        '<span class="kw3">つまり発症直後のCTは「写らない」のが正常な振る舞い</span>。'
        '<span class="kw3">したがってCTの役割は'
        '「脳梗塞を見つけること」ではなく'
        '「まず出血を否定すること」</span>にある'
        '（<span class="kw3">出血があればt-PAは投与できない</span>）。<br>'
        '<span class="kw3">なお注意深く見れば'
        '早期虚血サイン〈early CT sign〉が拾えることがある</span>——'
        '<span class="kw3">①皮髄境界の不明瞭化 ②レンズ核の不明瞭化 '
        '③島皮質の不明瞭化 ④脳溝・シルビウス裂の狭小化 '
        '⑤hyperdense MCA sign（閉塞した中大脳動脈が白く見える）</span>。')],
      '超急性期の脳梗塞は単純CTに写らない。CTの役割は「出血の否定」。',
      imgs=[IMG + 'orig11_1.jpeg'],
      ans_label='ｅ　超急性期脳梗塞',
      patho=('🔎 画像所見——脳底槽は黒く、明らかな低吸収域も腫瘤もない',
             '<span class="kw3">示された頭部単純CTは中脳〜橋の高さの水平断で、'
             '一見して「正常」である</span>。'
             '<span class="kw3">この「異常が指摘できない」という事実そのものが'
             '選択肢を絞る</span>。'
             '<table class="tb"><tr><th>疾患</th>'
             '<th>単純CTで期待される所見</th><th>本例</th></tr>'
             '<tr><td><span class="kw">脳腫瘍</span></td>'
             '<td>腫瘤・周囲の浮腫・占拠効果（正中偏位・脳室の変形）</td>'
             '<td><span class="kw4">なし</span></td></tr>'
             '<tr><td><span class="kw">水頭症</span></td>'
             '<td>脳室の拡大</td><td><span class="kw4">なし</span></td></tr>'
             '<tr><td><span class="kw">脳動脈瘤（未破裂）</span></td>'
             '<td><span class="kw4">そもそも単純CTでは写らない</span></td>'
             '<td>—</td></tr>'
             '<tr><td><span class="kw3">くも膜下出血</span></td>'
             '<td><span class="kw3">脳底槽・シルビウス裂が高吸収に'
             '（白く）埋まる</span></td>'
             '<td><span class="kw3">脳槽は黒く保たれている＝否定的</span></td></tr>'
             '<tr><td><span class="kw3">超急性期脳梗塞</span></td>'
             '<td><span class="kw3">ほぼ正常（写らないのが普通）</span></td>'
             '<td><span class="kw3">合致する</span></td></tr></table>'
             '<span class="kw3">MECのオリジナル問題で、'
             '「CTで写らないことに意味がある」という'
             '放射線科ならではの発想を問うている</span>。'
             '<span class="kw3">この症例はNO.16（MRIの3シーケンス）へ続く</span>——'
             '<span class="kw3">CTで異常が無いからこそ次にMRIを撮る</span>、'
             'という臨床の流れが2問で表現されている。'),
      deep=('💡 脳梗塞の時間経過と画像——「CTで写るころには手遅れ」',
            '<table class="tb"><tr><th>発症からの時間</th>'
            '<th><span class="kw3">単純CT</span></th>'
            '<th><span class="kw3">MRI 拡散強調像〈DWI〉</span></th>'
            '<th><span class="kw3">FLAIR像</span></th></tr>'
            '<tr><td><span class="kw3">〜数十分</span></td>'
            '<td><span class="kw4">正常</span></td>'
            '<td><span class="kw3">すでに高信号</span></td>'
            '<td><span class="kw3">まだ正常</span></td></tr>'
            '<tr><td><span class="kw3">〜4.5時間</span></td>'
            '<td><span class="kw4">正常〜早期虚血サイン</span></td>'
            '<td><span class="kw3">高信号</span></td>'
            '<td><span class="kw3">まだ正常（DWI-FLAIRミスマッチ）</span></td></tr>'
            '<tr><td>6〜24時間</td>'
            '<td><span class="kw">境界不明瞭な低吸収域</span></td>'
            '<td>高信号</td>'
            '<td><span class="kw">高信号になってくる</span></td></tr>'
            '<tr><td>数日〜</td>'
            '<td><span class="kw">明瞭な低吸収域・腫脹</span></td>'
            '<td>高信号（ADCは次第に上昇）</td><td>高信号</td></tr>'
            '<tr><td colspan="4"><span class="kw3">DWIで高信号なのに'
            'FLAIRではまだ高信号でない＝DWI-FLAILミスマッチ</span>'
            'は<span class="kw3">発症4.5時間以内を示唆</span>し、'
            '<span class="kw3">発症時刻が不明な症例'
            '（起床時発症・wake-up stroke）でも'
            't-PA療法の適応を判断する材料になる</span>。</td></tr></table>'
            '<span class="kw3">急性期脳卒中でまず単純CTを撮るのは'
            '「脳梗塞を見るため」ではなく'
            '「出血を否定してt-PAへ進めるかを決めるため」</span>——'
            '<span class="kw3">CTは出血に強く（発症直後から白く写る）、'
            '梗塞に弱い（数時間写らない）</span>という'
            '得意・不得意がそのまま診療手順になっている。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">超急性期脳梗塞は単純CTでは写らない</span>——'
             '<span class="kw3">「正常に見える」ことが所見</span>。<br>'
             '② <span class="kw3">急性期脳卒中でCTを撮る目的は'
             '「出血の否定」</span>。<br>'
             '③ <span class="kw3">早期虚血サイン＝皮髄境界／レンズ核／'
             '島皮質の不明瞭化・脳溝の狭小化・hyperdense MCA sign</span>。<br>'
             '④ <span class="kw3">発症直後から検出できるのはMRIの拡散強調像</span>。<br>'
             '⑤ <span class="kw4">くも膜下出血は単純CTで脳底槽が白くなる'
             '（感度90%以上）</span>。')),

    # ── NO.12 (118D-66) ★ 79% ans=b ────────────────────────────
    Q('118D-66', 79, [('bs', '★')],
      '<span class="kw">9 歳の男児。</span>腹痛のため救急車で搬入された。'
      '2 日前から嘔吐が出現し、徐々に嘔吐が頻回となり間欠的腹痛が出現した。'
      '体温36.8℃。心拍数120/ 分、整。血圧116/66mmHg。呼吸数24/ 分。'
      'SpO<sub>2</sub> 98％（room air）。腹部は軽度膨満し、軟で腸雑音は減弱していた。'
      '右側腹部に腫瘤を触知し、右上腹部に圧痛を認めた。'
      '<span class="kw">腹部超音波検査で腹部正中にtarget sign を認めた。'
      '空気による非観血的整復術にて還納した。</span>'
      'その後行った<span class="kw"><sup>99m</sup>TcO<sub>4</sub><sup>－</sup>'
      'シンチグラム</span>を示す。<br>'
      '<strong>診断はどれか。</strong>',
      [('a', 'Crohn 病', False,
        '<span class="kw4">Crohn病は全消化管に非連続性（skip lesion）の'
        '縦走潰瘍・敷石像を作る炎症性腸疾患</span>で、'
        '<span class="kw4">慢性の下痢・腹痛・体重減少・'
        '肛門病変（痔瘻）を伴う</span>。'
        '<span class="kw4"><sup>99m</sup>TcO<sub>4</sub><sup>－</sup>は'
        '異所性胃粘膜に集まる薬剤で、Crohn病の診断には用いない</span>。'),
       ('b', 'Meckel 憩室', True,
        '<span class="kw3">◯ <sup>99m</sup>TcO<sub>4</sub><sup>－</sup>'
        '（過テクネチウム酸イオン）は胃粘膜と唾液腺に集積する</span>。'
        '<span class="kw3">したがって「胃以外の場所に'
        '限局した集積があれば異所性胃粘膜がある」ことになり、'
        'それはすなわちMeckel憩室である</span>。'
        '<span class="kw3">Meckel憩室は卵黄腸管（臍腸管）の遺残による'
        '真性憩室で、回腸末端の腸間膜対側にできる</span>。'
        '<span class="kw3">「2の法則」——人口の約2%、'
        '回盲弁から約2フィート（60cm）、長さ約2インチ（5cm）、'
        '症状が出るのは2歳までが多く、'
        '異所性組織は胃粘膜と膵組織の2種類</span>。'
        '<span class="kw3">異所性胃粘膜が酸を分泌して隣接する'
        '回腸粘膜に潰瘍を作れば無痛性の下血、'
        '憩室が先進部になれば腸重積を起こす</span>——'
        '<span class="kw3">本例はまさに腸重積（target sign）で発症し、'
        '整復後に原因を探してシンチを撮ったという流れ</span>である。'),
       ('c', '悪性リンパ腫', False,
        '<span class="kw4">小児の腸重積の器質的原因としては'
        'Burkittリンパ腫などがありうる</span>が、'
        '<span class="kw4"><sup>99m</sup>TcO<sub>4</sub><sup>－</sup>には'
        '集積しない</span>。'
        '<span class="kw">リンパ腫の検索に用いるのはFDG-PETやCT</span>。'),
       ('d', '腸回転異常症', False,
        '<span class="kw4">腸回転異常症は胎生期の中腸の回転・固定の異常</span>で、'
        '<span class="kw4">多くは新生児期に中腸軸捻転による'
        '胆汁性嘔吐で発症する</span>。'
        '<span class="kw">診断は上部消化管造影（Treitz靱帯の位置異常）や'
        '超音波（SMA/SMVのwhirlpool sign）</span>で、'
        '<span class="kw4">シンチグラムで診断する疾患ではない</span>。'),
       ('e', '大腸ポリポーシス', False,
        '<span class="kw4">Peutz-Jeghers症候群のような'
        '過誤腫性ポリポーシスは小児の腸重積の原因になりうる</span>が、'
        '<span class="kw4">やはり<sup>99m</sup>TcO<sub>4</sub><sup>－</sup>には'
        '集積しない</span>。'
        '<span class="kw">診断は内視鏡と口唇・口腔粘膜の色素斑</span>。')],
      '99mTcO4-は胃粘膜に集積する。異所性の集積＝Meckel憩室。',
      imgs=[IMG + '118D-66_1.jpeg'],
      ans_label='ｂ　Meckel 憩室',
      patho=('🔎 画像所見——上腹部（胃）の強い集積のほかに、下腹部にもう1つの集積',
             '<span class="kw3">シンチグラムでは、上腹部に'
             '<sup>99m</sup>TcO<sub>4</sub><sup>－</sup>の'
             '強い集積（＝胃、生理的集積）を認める</span>。'
             '<span class="kw3">それとは別に、下腹部（骨盤に近い高さ）に'
             '限局した異常集積がもう1か所ある</span>——'
             '<span class="kw3">これが異所性胃粘膜＝Meckel憩室である</span>。'
             '<table class="tb"><tr><th>集積部位</th><th>意味</th></tr>'
             '<tr><td><span class="kw3">胃</span></td>'
             '<td><span class="kw3">生理的集積（胃粘膜の壁細胞に取り込まれる）</span></td></tr>'
             '<tr><td><span class="kw">唾液腺・甲状腺</span></td>'
             '<td><span class="kw">生理的集積'
             '（<sup>99m</sup>TcO<sub>4</sub><sup>－</sup>はヨードと同様に'
             'Na/I symporterで取り込まれる）</span></td></tr>'
             '<tr><td><span class="kw">膀　胱</span></td>'
             '<td><span class="kw">排泄による集積</span></td></tr>'
             '<tr><td><span class="kw3">上記以外の腹部の限局集積</span></td>'
             '<td><span class="kw3">異所性胃粘膜＝Meckel憩室</span></td></tr>'
             '<tr><td colspan="2"><span class="kw3">読影の要点は'
             '「生理的集積の場所を知っていること」</span>——'
             '<span class="kw3">核医学では'
             '「正常でも光る場所」を覚えておかないと'
             '異常が拾えない</span>。'
             '<span class="kw">FDG-PETで脳と尿路が光るのと同じ理屈'
             '（NO.7e）</span>。</td></tr></table>'),
      deep=('💡 小児の腸重積——年齢で「特発性か、器質的原因があるか」が変わる',
            '<span class="kw3">本例の要点は'
            '「9歳の腸重積」という年齢である</span>。'
            '<table class="tb"><tr><th></th>'
            '<th><span class="kw3">乳幼児（生後3か月〜2歳）</span></th>'
            '<th><span class="kw3">年長児・成人</span></th></tr>'
            '<tr><td>原因</td>'
            '<td><span class="kw3">特発性が大半</span>'
            '（<span class="kw">Peyer板のリンパ組織が'
            'ウイルス感染で腫れて先進部になる</span>）</td>'
            '<td><span class="kw3">器質的な先進部〈lead point〉を'
            '疑う</span>——'
            '<span class="kw3">Meckel憩室・ポリープ・'
            'リンパ腫・重複腸管・IgA血管炎の腸管壁血腫</span></td></tr>'
            '<tr><td>診断</td>'
            '<td colspan="2"><span class="kw3">腹部超音波で'
            'target sign（同心円状の層構造）・'
            'pseudokidney sign</span></td></tr>'
            '<tr><td>治療</td>'
            '<td colspan="2"><span class="kw3">まず非観血的整復'
            '（空気／造影剤による注腸整復）</span>。'
            '<span class="kw4">腹膜炎・穿孔・ショックがあれば'
            '整復せず手術</span></td></tr>'
            '<tr><td>整復後</td>'
            '<td>経過観察</td>'
            '<td><span class="kw3">先進部の検索'
            '（<sup>99m</sup>TcO<sub>4</sub><sup>－</sup>シンチ・'
            'CT・内視鏡）</span></td></tr></table>'
            '<span class="kw3">「9歳＝特発性では説明しにくい年齢だから'
            '整復後に原因を探した」</span>という文脈が読めれば、'
            '<span class="kw3">シンチを撮った意図＝Meckel憩室を探している、'
            'と分かる</span>。'
            '<span class="kw">なお三主徴（間欠的腹痛・嘔吐・血便）が'
            'そろうのは半数以下</span>で、'
            '<span class="kw">本例も血便の記載はない</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3"><sup>99m</sup>TcO<sub>4</sub><sup>－</sup>'
             'シンチ＝異所性胃粘膜＝Meckel憩室の検索</span>。<br>'
             '② <span class="kw3">生理的集積は胃・唾液腺・甲状腺・膀胱</span>。<br>'
             '③ <span class="kw3">Meckel憩室の2の法則＝人口の2%・'
             '回盲弁から2フィート・長さ2インチ・2歳までに発症・'
             '異所性組織は胃粘膜と膵組織の2種</span>。<br>'
             '④ <span class="kw3">年長児の腸重積は器質的な先進部を疑う</span>'
             '（Meckel憩室・ポリープ・リンパ腫）。<br>'
             '⑤ <span class="kw">腸重積は超音波のtarget sign → '
             '非観血的整復（腹膜炎があれば手術）</span>。')),

]


QUESTIONS += [

    # ── NO.13 (120A-16) ★ 90% ans=b ────────────────────────────
    Q('120A-16', 90, [('bs', '★')],
      '69 歳の男性。転びやすいことを主訴に来院した。'
      '10 年前から糖尿病でインスリン療法を行っている。'
      '<span class="kw">3 年前から歩行時に前のめりになり転倒することが頻回になり、'
      '5 か月前に左上腕骨を骨折した。</span>診察時、表情は乏しく、やや小声であった。'
      '<span class="kw">眼球運動は上下方向に制限があり、'
      '筋強剛は頸部に強く認めたが四肢では軽かった。</span>'
      '四肢の腱反射は正常で、Babinski 徴候を認めない。便秘もない。'
      '<span class="kw">レボドパ〈L-dopa〉の内服による治療効果は認められなかった。</span>'
      '頭部単純MRI のT<sub>1</sub>強調像（A）と'
      'ドパミントランスポーターSPECT（B）とを示す。<br>'
      '<strong>最も考えられる疾患はどれか。</strong>',
      [('a', 'Parkinson 病', False,
        '<span class="kw4">Parkinson病なら①L-dopaがよく効く '
        '②症状が左右非対称に始まる ③安静時振戦が目立つ '
        '④筋強剛は四肢優位 ⑤便秘などの自律神経症状を伴う</span>のが典型。'
        '<span class="kw4">本例はいずれとも合わない</span>——'
        '<span class="kw4">とくに「L-dopa無効」「頸部優位の筋強剛」'
        '「便秘もない」は積極的に否定する記載</span>である。'
        '<span class="kw">Parkinson病では転倒（姿勢反射障害）が'
        '出るのも病期が進んでから</span>で、'
        '<span class="kw">発症早期からの易転倒は非典型</span>。'),
       ('b', '進行性核上性麻痺', True,
        '<span class="kw3">◯ 進行性核上性麻痺〈PSP〉</span>。'
        '<span class="kw3">診断の柱は4つで、本例はすべて満たす</span>——'
        '<span class="kw3">①発症早期からの易転倒（後方への転倒が典型）'
        '②垂直性核上性眼球運動障害（とくに下方視の制限）'
        '③体軸（頸部・体幹）優位の筋強剛＝四肢より頸部が硬い'
        '④L-dopaが無効</span>。'
        '<span class="kw3">「核上性」とは、眼球運動の障害が'
        '眼筋や動眼神経ではなく、その上位の中枢（中脳の垂直注視中枢）に'
        'あることを意味する</span>——'
        '<span class="kw">だから人形の目現象（頭位変換眼球反射）では'
        '眼球が動く</span>。'
        '<span class="kw3">画像では中脳被蓋の萎縮</span>'
        '（<span class="kw3">正中矢状断のhummingbird sign、'
        '水平断のmorning glory sign</span>）。'),
       ('c', '筋萎縮性側索硬化症', False,
        '<span class="kw4">ALSは上位・下位運動ニューロンがともに障害される疾患</span>で、'
        '<span class="kw4">筋萎縮・線維束性収縮・腱反射亢進・'
        'Babinski徴候陽性・球麻痺</span>がみられる。'
        '<span class="kw4">本例は腱反射正常・Babinski徴候陰性で、'
        '筋萎縮の記載もない</span>。'
        '<span class="kw">また眼球運動はALSでは末期まで保たれる</span>。'),
       ('d', '特発性正常圧水頭症', False,
        '<span class="kw4">iNPHの三徴は歩行障害・認知機能障害・尿失禁</span>で、'
        '<span class="kw4">歩行は「小刻み・すり足・開脚性（磁性歩行）」</span>。'
        '<span class="kw4">眼球運動障害は来さない</span>。'
        '<span class="kw">画像では脳室拡大とDESH'
        '（高位円蓋部・正中部の脳溝狭小化＋Sylvius裂の開大）</span>が特徴で、'
        '<span class="kw4">本例のT<sub>1</sub>強調像には脳室拡大がない</span>。'),
       ('e', '血管性Parkinson 症候群', False,
        '<span class="kw4">血管性パーキンソニズムは'
        '基底核・白質の多発性ラクナ梗塞によるもの</span>で、'
        '<span class="kw4">下半身優位のパーキンソニズム（lower body parkinsonism）・'
        '錐体路徴候（腱反射亢進・Babinski徴候陽性）・'
        '階段状の経過</span>を伴う。'
        '<span class="kw4">本例は腱反射正常・Babinski徴候陰性</span>で、'
        '<span class="kw4">画像にも多発梗塞の所見がない</span>。'
        '<span class="kw">糖尿病の既往が10年あるので'
        'これを疑わせる作りにはなっているが、所見が伴わない</span>。')],
      '易転倒・垂直性眼球運動障害・頸部優位の筋強剛・L-dopa無効＝進行性核上性麻痺。',
      imgs=[IMG + '120A-16_1.jpeg', IMG + '120A-16_2.jpeg'],
      patho=('🔎 画像所見——中脳被蓋の萎縮と、線条体DATの両側性低下',
             '<span class="kw3">A（頭部単純MRI T<sub>1</sub>強調像・水平断）は'
             '中脳の高さのスライスで、中脳被蓋が萎縮して'
             '外側縁が凹み、いわゆるmorning glory sign'
             '（朝顔の花のような輪郭）を呈する</span>。'
             '<span class="kw3">正中矢状断で撮れば'
             '中脳被蓋の上縁が凹んだhummingbird sign（ハチドリ徴候）'
             'として見える所見と同じもの</span>である。<br>'
             '<span class="kw3">B（ドパミントランスポーターSPECT＝DaTスキャン）では'
             '両側線条体の集積を評価する</span>。'
             '<span class="kw3">PSPでは集積が低下するが、'
             'Parkinson病と違って<u>左右差に乏しい両側性の低下</u>を示す</span>のが特徴。'
             '<table class="tb"><tr><th>疾患</th>'
             '<th><span class="kw3">DaTスキャン<br>（線条体の集積）</span></th>'
             '<th><span class="kw3">MIBG心筋シンチ</span></th>'
             '<th>決め手になる臨床所見</th></tr>'
             '<tr><td><span class="kw3">Parkinson病</span></td>'
             '<td><span class="kw3">低下（左右差あり・被殻後部から）</span></td>'
             '<td><span class="kw3">低下</span></td>'
             '<td><span class="kw">安静時振戦・左右差・L-dopa著効・便秘</span></td></tr>'
             '<tr><td><span class="kw3">Lewy小体型認知症</span></td>'
             '<td><span class="kw3">低下</span></td>'
             '<td><span class="kw3">低下</span></td>'
             '<td><span class="kw">具体的な幻視・認知の変動・REM睡眠行動障害</span></td></tr>'
             '<tr><td><span class="kw3">進行性核上性麻痺</span></td>'
             '<td><span class="kw3">低下（左右差に乏しい）</span></td>'
             '<td><span class="kw3">正常〜軽度低下</span></td>'
             '<td><span class="kw3">垂直性眼球運動障害・易転倒・'
             '頸部優位の筋強剛・L-dopa無効</span></td></tr>'
             '<tr><td><span class="kw">多系統萎縮症</span></td>'
             '<td><span class="kw">低下（左右差に乏しい）</span></td>'
             '<td><span class="kw">正常〜軽度低下</span></td>'
             '<td><span class="kw">起立性低血圧・排尿障害・小脳失調・'
             '錐体路徴候</span></td></tr>'
             '<tr><td><span class="kw4">Alzheimer型認知症<br>'
             '本態性振戦<br>薬剤性パーキンソニズム</span></td>'
             '<td><span class="kw4">正常</span></td>'
             '<td><span class="kw">正常（Alzheimer型）</span></td>'
             '<td>—</td></tr>'
             '<tr><td colspan="4"><span class="kw3">DaTスキャンは'
             '「変性性パーキンソニズムか、そうでないか」を分けるが、'
             '変性性のなかの鑑別はできない</span>。'
             '<span class="kw3">MIBG心筋シンチを組み合わせると'
             '「Parkinson病／Lewy小体型（低下）」と'
             '「PSP／MSA（正常〜軽度低下）」が分かれる</span>。</td></tr></table>'),
      deep=('💡 パーキンソニズムの鑑別——「L-dopaが効かない」がまず入口',
            '<span class="kw3">パーキンソニズム（無動・筋強剛・振戦・'
            '姿勢反射障害）を見たら、まずParkinson病かどうかを'
            'L-dopaの反応で分ける</span>。'
            '<table class="tb"><tr><th></th><th>Parkinson病</th>'
            '<th><span class="kw3">Parkinson症候群（非定型）</span></th></tr>'
            '<tr><td><span class="kw3">L-dopaの効果</span></td>'
            '<td><span class="kw3">著効する</span></td>'
            '<td><span class="kw3">効かない／効果が乏しい</span></td></tr>'
            '<tr><td>左右差</td><td><span class="kw">あり（片側から始まる）</span></td>'
            '<td><span class="kw">乏しい</span></td></tr>'
            '<tr><td>安静時振戦</td><td><span class="kw">目立つ</span></td>'
            '<td>乏しい</td></tr>'
            '<tr><td>姿勢反射障害（転倒）</td>'
            '<td>病期が進んでから</td>'
            '<td><span class="kw3">早期から（とくにPSP）</span></td></tr>'
            '<tr><td>その他の徴候</td>'
            '<td><span class="kw">嗅覚低下・便秘・REM睡眠行動障害</span></td>'
            '<td><span class="kw3">PSP＝垂直性眼球運動障害／'
            'MSA＝自律神経障害・小脳失調／'
            'CBD＝著明な左右差・肢節運動失行・他人の手徴候</span></td></tr></table>'
            '<span class="kw3">本例が「レボドパの内服による治療効果は認められなかった」と'
            'わざわざ書いているのは、'
            'この最初の分岐を通させるため</span>である。'
            '<span class="kw4">PSPには根本的な治療がなく、'
            '転倒による外傷（本例は上腕骨骨折）と'
            '嚥下障害・誤嚥が予後を規定する</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">PSP＝早期からの易転倒・垂直性核上性眼球運動障害'
             '（下方視の制限）・頸部優位の筋強剛・L-dopa無効</span>。<br>'
             '② <span class="kw3">画像は中脳被蓋の萎縮'
             '（矢状断hummingbird sign／水平断morning glory sign）</span>。<br>'
             '③ <span class="kw3">DaTスキャン＝変性性パーキンソニズムで低下、'
             'Alzheimer型・本態性振戦・薬剤性では正常</span>。<br>'
             '④ <span class="kw3">MIBG心筋シンチ＝Parkinson病・'
             'Lewy小体型で低下、PSP・MSAでは保たれる</span>。<br>'
             '⑤ <span class="kw">L-dopaが効かないパーキンソニズムを見たら'
             'PSP・MSA・CBD・血管性・薬剤性を考える</span>。')),

    # ── NO.14 (オリジナル) ★ rate=None ans=a,e ──────────────────
    Q('オリジナル', None, [('bs', '★')],
      '<strong>子宮体癌の原発巣評価に適した検査はどれか。2つ選べ。</strong>',
      [('a', 'MRI', True,
        '<span class="kw3">◯ 子宮体癌の原発巣評価（局所進展の評価）の主役はMRI</span>。'
        '<span class="kw3">T<sub>2</sub>強調像で子宮内膜・接合帯〈junctional zone〉・'
        '筋層のコントラストが明瞭につくため、'
        '<u>筋層浸潤が1/2を超えるか</u>、頸部間質へ及ぶか、'
        '子宮外へ出ているかを高い精度で判定できる</span>。'
        '<span class="kw3">筋層浸潤の深さは子宮体癌の進行期分類と'
        'リンパ節転移のリスクを直接決める</span>ので、'
        '<span class="kw3">術式（リンパ節郭清を行うか）の決定に直結する</span>。'
        '<span class="kw">拡散強調像と造影を組み合わせるとさらに精度が上がる</span>。'),
       ('b', 'CT', False,
        '<span class="kw4">CTは子宮内のコントラストがつきにくい</span>——'
        '<span class="kw4">子宮内膜も筋層も腫瘍も、'
        'CT値がほとんど同じ軟部組織だから</span>。'
        '<span class="kw3">CTが担うのは原発巣ではなく'
        '「遠隔転移とリンパ節転移の検索」</span>で、'
        '<span class="kw3">広い範囲を短時間に死角なく撮れる点で'
        'MRIより優れる</span>。'
        '<span class="kw3">「局所はMRI、全身はCT」という役割分担</span>。'),
       ('c', 'FDG-PET', False,
        '<span class="kw4">FDG-PETは遠隔転移・再発の検索には有用だが、'
        '原発巣の局所進展評価には向かない</span>。'
        '<span class="kw4">空間分解能が低く、筋層浸潤が1/2を超えるか'
        'といったミリ単位の判定はできない</span>。'
        '<span class="kw4">加えて尿路への生理的集積が骨盤内の読影を妨げる</span>し、'
        '<span class="kw">正常子宮内膜も月経周期に応じて生理的に集積する</span>。'),
       ('d', 'エックス線', False,
        '<span class="kw4">単純エックス線写真は軟部組織のコントラストがつかず、'
        '骨盤内臓器の評価にはまったく使えない</span>。'
        '<span class="kw">骨転移の評価に用いることはあるが、'
        '原発巣の評価とは無関係</span>。'),
       ('e', '経腟超音波', True,
        '<span class="kw3">◯ 経腟超音波は子宮体癌の入口の検査</span>。'
        '<span class="kw3">高周波プローブを腟から子宮のすぐ近くに'
        '当てられるので分解能が高く、'
        '子宮内膜の厚さ（閉経後で5mmを超えれば精査）と'
        '内腔の性状、筋層浸潤の有無を評価できる</span>。'
        '<span class="kw3">被ばくがなく、外来でその場で行え、'
        '安価で繰り返せる</span>——'
        '<span class="kw3">不正性器出血を主訴とする患者への'
        '最初のスクリーニングとして必須</span>である。'
        '<span class="kw">（確定診断は子宮内膜組織診）</span>')],
      '局所（筋層浸潤）はMRIと経腟超音波、全身検索はCT。CT・PETは子宮内が見えない。',
      ans_label='ａ・ｅ',
      patho=('🔎 「原発巣の評価」と「転移の検索」でモダリティが分かれる',
             '<span class="kw3">悪性腫瘍の画像検査は、'
             '「①原発巣がどこまで広がっているか（局所進展）」と'
             '「②遠くへ飛んでいないか（転移）」の2つに分かれる</span>。'
             '<span class="kw3">求められる性能が違うので、使う装置も違う</span>。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">原発巣の局所進展</span></th>'
             '<th><span class="kw3">転移の検索</span></th></tr>'
             '<tr><td>求められる性能</td>'
             '<td><span class="kw3">軟部組織のコントラストと空間分解能'
             '（数mmの浸潤を見分ける）</span></td>'
             '<td><span class="kw3">広い範囲を死角なく短時間で</span></td></tr>'
             '<tr><td>骨盤内臓器<br>（子宮・前立腺・直腸）</td>'
             '<td><span class="kw3">MRI</span>'
             '（＋<span class="kw3">経腟／経直腸超音波</span>）</td>'
             '<td><span class="kw3">造影CT</span>（＋PET-CT）</td></tr>'
             '<tr><td>理由</td>'
             '<td><span class="kw3">CTでは子宮筋層と内膜と腫瘍の'
             'CT値がほぼ同じで区別できない</span>。'
             '<span class="kw3">MRIのT<sub>2</sub>強調像なら層構造が見える</span></td>'
             '<td><span class="kw3">MRIは撮像に時間がかかり'
             '全身を撮るのに向かない</span></td></tr></table>'
             '<span class="kw3">この「局所はMRI、全身はCT」という原則は'
             '前立腺癌・直腸癌・子宮頸癌でも同じ</span>。'),
      deep=('💡 MRIが骨盤内で強いのはなぜか——T2強調像の層構造',
            '<span class="kw3">MRIのT<sub>2</sub>強調像では'
            '「水を多く含むほど白い」ため、'
            '子宮が3層に描き分けられる</span>。'
            '<table class="tb"><tr><th>層</th><th>T<sub>2</sub>強調像</th>'
            '<th>意味</th></tr>'
            '<tr><td><span class="kw3">子宮内膜</span></td>'
            '<td><span class="kw3">高信号（白）</span></td>'
            '<td>腺と分泌液に富む</td></tr>'
            '<tr><td><span class="kw3">接合帯〈junctional zone〉</span></td>'
            '<td><span class="kw3">低信号（黒い帯）</span></td>'
            '<td><span class="kw3">筋層の内側1/3。'
            '<u>この帯が保たれていれば筋層浸潤なし</u></span></td></tr>'
            '<tr><td><span class="kw3">子宮筋層</span></td>'
            '<td><span class="kw">中等度信号</span></td>'
            '<td>—</td></tr>'
            '<tr><td colspan="3"><span class="kw3">子宮体癌は'
            'T<sub>2</sub>強調像で内膜より低〜中等度の信号を示す腫瘤として現れ、'
            '接合帯の断裂・消失で筋層浸潤を判定する</span>。<br>'
            '<span class="kw3">筋層浸潤が1/2以上（深部浸潤）だと'
            'リンパ節転移のリスクが跳ね上がる</span>ので、'
            'この一点が術式を決める。</td></tr></table>'
            '<span class="kw">同じ原理で、MRIは子宮筋腫・子宮腺筋症・'
            '卵巣腫瘍（脂肪抑制で成熟囊胞性奇形腫の脂肪を証明する）にも強い</span>。'
            '<span class="kw">前立腺癌でも同様に'
            'T<sub>2</sub>強調像＋拡散強調像で辺縁領域の癌を拾う</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">子宮体癌の原発巣（筋層浸潤）評価＝'
             'MRIと経腟超音波</span>。<br>'
             '② <span class="kw3">CT・FDG-PETは遠隔転移とリンパ節転移の検索</span>——'
             '<span class="kw4">子宮内のコントラストがつかない</span>。<br>'
             '③ <span class="kw3">MRIのT<sub>2</sub>強調像で'
             '内膜（高信号）・接合帯（低信号）・筋層が描き分けられる</span>。<br>'
             '④ <span class="kw">閉経後で子宮内膜厚5mm超なら精査</span>。'
             '<span class="kw">確定診断は子宮内膜組織診</span>。<br>'
             '⑤ <span class="kw3">「局所はMRI、全身はCT」</span>。')),

    # ── NO.15 (117D-48) ★ 27% ans=a,c ──────────────────────────
    Q('117D-48', 27, [('bs', '★')],
      '80 歳の女性。左上下肢の脱力を主訴に救急車で搬入された。'
      '<span class="kw">本日午前6 時に起床したときから、'
      '左上下肢の脱力としゃべりにくさを自覚していたが、様子をみていた。'
      '夕方、左上下肢の麻痺が増悪したため救急車を要請した。</span>'
      '高血圧症と糖尿病で治療中である。日常生活動作は自立しており、'
      '<span class="kw">脳血管障害の既往や不整脈の指摘はない。</span>'
      '意識は清明。心拍数82/ 分、整。血圧154/82mmHg。'
      '復唱は可能だが構音障害を認める。左顔面を含む左上下肢の不全片麻痺を認めた。'
      '来院時の頭部MRI の拡散強調像（A）、FLAIR 像（B）及びMRA（C）を示す。<br>'
      '<strong>直ちに行うべき治療で適切なのはどれか。2つ選べ。</strong>',
      [('a', '抗血小板薬内服', True,
        '<span class="kw3">◯ 非心原性（アテローム血栓性・ラクナ）の'
        '急性期脳梗塞に対する標準治療</span>。'
        '<span class="kw3">発症48時間以内であれば'
        'アスピリン160〜300mg／日の投与が推奨され、'
        '死亡・再発を減らすことが示されている</span>。'
        '<span class="kw3">本例は不整脈の指摘がなく心拍数82/分・整、'
        'MRAに主幹動脈の閉塞がなく、'
        '拡散強調像の病変も穿通枝領域に限局している</span>——'
        '<span class="kw3">＝非心原性脳梗塞として矛盾しない</span>ので'
        '抗血小板薬が適応になる。'),
       ('b', '機械的血栓回収療法', False,
        '<span class="kw4">機械的血栓回収療法の適応は'
        '「主幹動脈（内頸動脈・中大脳動脈M1など）の閉塞」があること</span>。'
        '<span class="kw4">本例のMRA（C）では内頸動脈・中大脳動脈・'
        '前大脳動脈がいずれも良好に描出されており、'
        '取り除くべき血栓が存在しない</span>。'
        '<span class="kw4">加えて最終健常時刻が不明で'
        '発症から時間が経っている</span>。'
        '<span class="kw3">「病巣が穿通枝領域＝細い枝の梗塞」であることも'
        'カテーテルが届かない理由になる</span>。'),
       ('c', 'グリセオール静注療法', True,
        '<span class="kw3">◯ 高張グリセロール（グリセオール）は'
        '浸透圧利尿により脳浮腫を軽減する薬剤</span>で、'
        '<span class="kw3">急性期脳梗塞で脳浮腫による症状悪化が'
        '懸念される場合に投与される</span>。'
        '<span class="kw3">本例は「夕方に麻痺が増悪した」＝'
        '進行性の経過をたどっており、'
        '虚血周囲の浮腫が症状を悪化させている状況</span>と考えられる。'
        '<span class="kw">脳浮腫は発症後3〜5日でピークを迎える</span>ので、'
        '<span class="kw">急性期に抗浮腫療法を行う意義がある</span>。'),
       ('d', 't-PA〈tissue plasminogen activator〉静注療法', False,
        '<span class="kw4">t-PA静注療法の適応は'
        '「<u>発症（最終健常確認時刻）から4.5時間以内</u>」</span>。'
        '<span class="kw4">本例は午前6時に起床した時点ですでに症状があり、'
        '＝最終健常時刻は「前夜に眠った時刻」で不明</span>——'
        '<span class="kw4">いわゆるwake-up strokeで、'
        '発症時刻が特定できない</span>。'
        '<span class="kw4">しかも症状に気づいてから受診まで'
        '「様子をみて」夕方まで経過しており、'
        'どう見積もっても4.5時間を大きく超えている</span>。'
        '<span class="kw3">この設問の最大の分岐点で、正答率27%の主因</span>——'
        '<span class="kw3">「起床時に気づいた」という一文を'
        '「起床時に発症した」と読み替えてしまうと'
        'd を選んでしまう</span>。'
        '<span class="kw">（なお発症時刻不明例でも'
        'DWI-FLAILミスマッチがあればt-PAを考慮できるが、'
        '本例のFLAIR像にはすでに病変に対応する高信号があり'
        'ミスマッチとはいえない）</span>'),
       ('e', '直接経口抗凝固薬［direct oral anti coagulant〈DOAC〉］内服', False,
        '<span class="kw4">DOACの適応は心原性脳塞栓症'
        '（非弁膜症性心房細動を伴う）</span>だが、'
        '<span class="kw4">本例は「不整脈の指摘はない」「脈拍整」で'
        '心房細動を示唆する所見がない</span>。'
        '<span class="kw4">さらに急性期の梗塞巣に抗凝固薬を'
        '早期から入れると出血性梗塞のリスクがある</span>ため、'
        '<span class="kw4">心原性であっても梗塞巣の大きさに応じて'
        '開始時期を選ぶ（大きい梗塞ほど遅らせる）</span>。'
        '<span class="kw4">「直ちに行うべき治療」ではない</span>。')],
      '起床時に症状に気づいた＝最終健常時刻が不明でt-PA適応外。主幹動脈閉塞もない。',
      imgs=[IMG + '117D-48_1.jpeg', IMG + '117D-48_2.jpeg', IMG + '117D-48_3.jpeg'],
      patho=('🔎 画像所見——右穿通枝領域の新鮮梗塞、主幹動脈は開存',
             '<span class="kw3">A（拡散強調像）では、'
             '画像の左側＝患者の右側の大脳基底核〜放線冠にかけて'
             '斑状の高信号を認める</span>。'
             '<span class="kw3">左片麻痺という症候と一致する（右半球の病変）</span>。'
             '<span class="kw3">病変は皮質を広く含む楔状ではなく'
             '深部の穿通枝領域に限局している</span>——'
             '<span class="kw3">＝主幹動脈の閉塞による広範な梗塞ではない</span>。<br>'
             '<span class="kw3">B（FLAIR像）では脳室周囲に'
             '陳旧性の白質病変（慢性虚血性変化）が広がり、'
             '新鮮病巣に対応する部位にも高信号がみられる</span>。'
             '<span class="kw3">＝DWI-FLAILミスマッチは明らかでなく、'
             '発症から相当の時間が経過していることを支持する</span>。<br>'
             '<span class="kw3">C（MRA）では両側の内頸動脈・中大脳動脈・'
             '前大脳動脈がいずれも良好に描出され、'
             '主幹動脈の閉塞や高度狭窄を認めない</span>——'
             '<span class="kw3">＝機械的血栓回収療法の対象になる病変がない</span>。'
             '<table class="tb"><tr><th>画像</th><th>読み</th>'
             '<th>治療方針への意味</th></tr>'
             '<tr><td><span class="kw3">DWI（A）</span></td>'
             '<td><span class="kw3">右穿通枝領域の新鮮梗塞</span></td>'
             '<td><span class="kw3">脳梗塞であることの確定</span></td></tr>'
             '<tr><td><span class="kw3">FLAIR（B）</span></td>'
             '<td><span class="kw3">同部位にも高信号＋陳旧性白質病変</span></td>'
             '<td><span class="kw3">超急性期ではない'
             '＝t-PAの時間枠を外れている</span></td></tr>'
             '<tr><td><span class="kw3">MRA（C）</span></td>'
             '<td><span class="kw3">主幹動脈は開存</span></td>'
             '<td><span class="kw3">血栓回収の適応なし</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">3つの画像が'
             '「再開通療法は使えない」と'
             '3方向から示している</span>——'
             '<span class="kw3">残るのは抗血小板薬と抗浮腫療法</span>。</td></tr></table>'),
      deep=('💡 急性期脳梗塞の治療は「時間枠」と「閉塞部位」の2軸で決まる',
            '<table class="tb"><tr><th>治療</th><th>時間枠</th>'
            '<th>対象</th><th>本例</th></tr>'
            '<tr><td><span class="kw3">t-PA静注療法</span></td>'
            '<td><span class="kw3">発症4.5時間以内</span></td>'
            '<td>主幹動脈・末梢を問わない</td>'
            '<td><span class="kw4">×（最終健常時刻不明・時間超過）</span></td></tr>'
            '<tr><td><span class="kw3">機械的血栓回収療法</span></td>'
            '<td><span class="kw3">発症6時間以内（画像で'
            'ミスマッチがあれば最大24時間まで）</span></td>'
            '<td><span class="kw3">主幹動脈閉塞（ICA・MCA M1など）</span></td>'
            '<td><span class="kw4">×（主幹動脈が開存）</span></td></tr>'
            '<tr><td><span class="kw3">抗血小板薬</span></td>'
            '<td><span class="kw3">発症48時間以内</span></td>'
            '<td><span class="kw3">非心原性（アテローム血栓性・ラクナ）</span></td>'
            '<td><span class="kw3">◯</span></td></tr>'
            '<tr><td><span class="kw">抗凝固薬</span></td>'
            '<td><span class="kw">梗塞巣の大きさに応じて</span></td>'
            '<td><span class="kw">心原性脳塞栓症（心房細動）</span></td>'
            '<td><span class="kw4">×（心房細動なし）</span></td></tr>'
            '<tr><td><span class="kw3">抗浮腫療法'
            '（グリセロール・D-マンニトール）</span></td>'
            '<td><span class="kw3">脳浮腫による悪化が懸念されるとき</span></td>'
            '<td>—</td><td><span class="kw3">◯（夕方に麻痺が増悪）</span></td></tr>'
            '<tr><td><span class="kw">エダラボン</span></td>'
            '<td><span class="kw">発症24時間以内</span></td>'
            '<td>脳保護（フリーラジカル消去）</td><td>◯</td></tr></table>'
            '<span class="kw3">⚠️ 起床時に症状を自覚した脳卒中'
            '〈wake-up stroke〉では、'
            '最終健常時刻は「就寝時刻」になる</span>——'
            '<span class="kw3">「起きたときに気づいた」は'
            '「起きたときに発症した」ではない</span>。'
            '<span class="kw3">脳梗塞全体の1〜2割を占め、'
            '本来は再開通療法の恩恵を受けられたはずの患者が'
            '時間枠から漏れる大きな原因になっている</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">t-PA静注療法は発症（最終健常時刻）から'
             '4.5時間以内</span>。'
             '<span class="kw3">起床時に気づいた場合の起点は就寝時刻</span>。<br>'
             '② <span class="kw3">機械的血栓回収療法は主幹動脈閉塞が'
             'あることが前提</span>。<br>'
             '③ <span class="kw3">非心原性の急性期脳梗塞には抗血小板薬'
             '（発症48時間以内のアスピリン）</span>。<br>'
             '④ <span class="kw3">DWI-FLAIRミスマッチ＝発症4.5時間以内を示唆</span>'
             '——発症時刻不明例の判断材料。<br>'
             '⑤ <span class="kw4">心房細動がなければDOACの適応ではない</span>。'
             '<span class="kw">急性期の抗凝固は出血性梗塞に注意</span>。')),

    # ── NO.16 (オリジナル) ★ rate=None ans=c ────────────────────
    Q('オリジナル', None, [('bs', '★')],
      'MRI の拡散強調像（A）、FLAIR 像（B）、MRA（C）を示す。<br>'
      '<strong><u>誤っている</u>のはどれか。</strong>',
      [('a', '拡散強調像で両側小脳半球に異常を認める。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw3">A（拡散強調像）では、'
        'スライス下方の両側小脳半球に一致して高信号を認める</span>。'
        '<span class="kw3">拡散強調像は細胞性浮腫で水分子の拡散が'
        '制限された部位を高信号として描出する</span>ので、'
        '<span class="kw3">これは新鮮な虚血病巣を意味する</span>。'
        '<span class="kw">CTでは後頭蓋窩は骨によるアーチファクトで'
        '極めて見にくい（＝CTの苦手分野）</span>ため、'
        '<span class="kw">小脳・脳幹の病変はMRIでこそ拾える</span>。'),
       ('b', 'FLAIR 像は正常である。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw3">B（FLAIR像）では、拡散強調像で高信号を示した'
        '小脳に対応する高信号を認めない</span>。'
        '<span class="kw3">＝DWI陽性・FLAIR陰性の「DWI-FLAIRミスマッチ」</span>で、'
        '<span class="kw3">発症からおよそ4.5時間以内の'
        '超急性期であることを示唆する</span>。'
        '<span class="kw3">この所見こそが d・e の根拠になっている</span>。'),
       ('c', 'MRA は正常である。', True,
        '<span class="kw3">◯ これが誤り。C（MRA）では'
        '両側内頸動脈と中大脳動脈は良好に描出されているが、'
        '<u>正中を上行するはずの椎骨脳底動脈系が描出されていない</u></span>。'
        '<span class="kw3">後大脳動脈も追えず、'
        '＝椎骨脳底動脈系の閉塞を示す所見である</span>。'
        '<span class="kw3">両側小脳半球という左右にまたがる梗塞は、'
        '正中を1本で上行する脳底動脈が詰まったと考えれば'
        '一元的に説明できる</span>——'
        '<span class="kw3">「両側性の後方循環の梗塞をみたら脳底動脈を疑う」</span>。'
        '<span class="kw4">脳底動脈閉塞症は致死率の高い病態</span>で、'
        '<span class="kw3">再開通療法（t-PA・機械的血栓回収）の'
        '緊急適応になる</span>。'),
       ('d', '超急性期脳梗塞を疑う。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw3">DWIで高信号なのにFLAIRではまだ変化がない'
        '＝DWI-FLAIRミスマッチ</span>は、'
        '<span class="kw3">発症から4.5時間以内の超急性期を示唆する</span>。'
        '<span class="kw">FLAIRで高信号になるのは血管性浮腫が生じてからで、'
        '通常は発症数時間を要する</span>。'),
       ('e', 't-PA 療法を考慮する。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw3">超急性期であり、かつMRAで'
        '脳底動脈系の閉塞が示されている</span>ので、'
        '<span class="kw3">禁忌がなければt-PA静注療法'
        '（および機械的血栓回収療法）の適応を検討する</span>。'
        '<span class="kw3">脳底動脈閉塞は無治療なら予後がきわめて不良</span>なので、'
        '<span class="kw3">積極的に再開通を目指す</span>。')],
      'DWI陽性＋FLAIR陰性＝超急性期。MRAで椎骨脳底動脈系が描出されず＝閉塞。',
      imgs=[IMG + 'orig16_1.jpeg', IMG + 'orig16_2.jpeg', IMG + 'orig16_3.jpeg'],
      ans_label='ｃ　MRA は正常である。',
      patho=('🔎 3つのシーケンスを「順に読む」——何が写り、何が写らないか',
             '<span class="kw3">同じ患者を3通りの撮り方で見ると、'
             'それぞれ別の情報が得られる</span>。'
             '<span class="kw3">本問はその読み分けそのものを問うている</span>。'
             '<table class="tb"><tr><th>画像</th><th>本例の所見</th>'
             '<th>そこから言えること</th></tr>'
             '<tr><td><span class="kw3">A：拡散強調像〈DWI〉</span></td>'
             '<td><span class="kw3">両側小脳半球に高信号</span></td>'
             '<td><span class="kw3">新鮮な虚血病巣がある（発症直後から陽性）</span></td></tr>'
             '<tr><td><span class="kw3">B：FLAIR像</span></td>'
             '<td><span class="kw3">対応する高信号なし（正常）</span></td>'
             '<td><span class="kw3">まだ血管性浮腫に至っていない'
             '＝発症4.5時間以内の超急性期</span></td></tr>'
             '<tr><td><span class="kw3">C：MRA</span></td>'
             '<td><span class="kw3">内頸動脈系は良好だが、'
             '正中の椎骨脳底動脈系が描出されない</span></td>'
             '<td><span class="kw3">脳底動脈系の閉塞'
             '＝両側小脳梗塞の原因</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">「病巣はどこか（DWI）」'
             '「いつからか（FLAIRとの対比）」'
             '「なぜか（MRA）」の3つが1組で揃う</span>のが'
             'MRIの強みで、<span class="kw3">この3点が揃えば'
             '治療方針（再開通療法をやるか）が決まる</span>。</td></tr></table>'
             + TBL_MRI),
      deep=('💡 後方循環（椎骨脳底動脈系）の梗塞——「両側性」がサイン',
            '<span class="kw3">脳梗塞は原則として片側の症状を出すが、'
            '後方循環では両側性の所見が出ることがある</span>——'
            '<span class="kw3">正中を1本で上行する脳底動脈が'
            '左右の小脳・脳幹・後頭葉を養っているから</span>である。'
            '<table class="tb"><tr><th></th>'
            '<th>前方循環（内頸動脈系）</th>'
            '<th><span class="kw3">後方循環（椎骨脳底動脈系）</span></th></tr>'
            '<tr><td>灌流域</td><td>大脳半球の大部分</td>'
            '<td><span class="kw3">脳幹・小脳・後頭葉・視床</span></td></tr>'
            '<tr><td>症状</td>'
            '<td><span class="kw">片麻痺・失語・半側空間無視</span></td>'
            '<td><span class="kw3">めまい・複視・構音障害・嚥下障害・'
            '失調・視野障害・意識障害</span>。'
            '<span class="kw3">交代性片麻痺（同側の脳神経麻痺＋'
            '対側の片麻痺）</span></td></tr>'
            '<tr><td>両側性</td><td>まれ</td>'
            '<td><span class="kw3">起こりうる（脳底動脈は1本）</span></td></tr>'
            '<tr><td><span class="kw4">CTでの見え方</span></td>'
            '<td>比較的見やすい</td>'
            '<td><span class="kw4">後頭蓋窩は骨のアーチファクトで'
            '極めて見にくい＝CTの苦手分野</span></td></tr>'
            '<tr><td><span class="kw3">検査</span></td>'
            '<td>CT／MRI</td>'
            '<td><span class="kw3">MRI（DWI）が必須</span></td></tr>'
            '<tr><td><span class="kw4">脳底動脈閉塞</span></td><td>—</td>'
            '<td><span class="kw4">意識障害・四肢麻痺・'
            '閉じ込め症候群。無治療なら死亡率が高い</span>——'
            '<span class="kw3">再開通療法の緊急適応</span></td></tr></table>'
            '<span class="kw3">「めまい・ふらつきで来た患者に'
            'CTだけ撮って異常なしと帰す」のが'
            '後方循環梗塞の典型的な見逃し方</span>で、'
            '<span class="kw3">CTが苦手な領域を知っていることが'
            'そのまま安全につながる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">DWI陽性＋FLAIR陰性＝DWI-FLAIRミスマッチ'
             '＝発症4.5時間以内の超急性期</span>。<br>'
             '② <span class="kw3">両側小脳・脳幹の梗塞をみたら脳底動脈閉塞を疑う</span>。<br>'
             '③ <span class="kw3">MRAは造影剤なしで血管を描出できる</span>'
             '（flow voidを逆手に取る）。<br>'
             '④ <span class="kw4">後頭蓋窩はCTの苦手分野</span>——'
             '<span class="kw3">めまい・失調ではMRIを撮る</span>。<br>'
             '⑤ <span class="kw3">脳底動脈閉塞は予後不良で'
             '再開通療法（t-PA・血栓回収）の緊急適応</span>。')),

    # ── NO.17 (118B-7) ★CBT必修 92% ans=c ──────────────────────
    Q('118B-7', 92, [('bs', '★'), ('bc', 'CBT'), ('bh', '必修')],
      '<strong>膝関節MRI のT<sub>2</sub>強調像で筋肉より高信号になるのはどれか。</strong>',
      [('a', '腱', False,
        '<span class="kw4">腱は水分に乏しい緻密な膠原線維の束</span>で、'
        '<span class="kw4">T<sub>1</sub>強調像でもT<sub>2</sub>強調像でも低信号（黒）</span>。'
        '<span class="kw">膝でいえば膝蓋腱・大腿四頭筋腱</span>。'
        '<span class="kw3">断裂・炎症があると内部に水（浮腫）が入り込んで'
        'T<sub>2</sub>で高信号になる</span>ので、'
        '<span class="kw3">「本来黒いものが白くなっていたら病的」</span>という'
        '読み方をする。'),
       ('b', '靱　帯', False,
        '<span class="kw4">靱帯も腱と同じ膠原線維主体で、'
        'T<sub>2</sub>強調像で低信号</span>。'
        '<span class="kw">前十字靱帯・後十字靱帯・内側／外側側副靱帯</span>。'
        '<span class="kw3">前十字靱帯損傷では靱帯が'
        '腫大して内部がT<sub>2</sub>高信号になり、'
        '連続性が絶たれる</span>——'
        '<span class="kw3">これも「黒いはずのものが白い」の応用</span>。'),
       ('c', '関節液', True,
        '<span class="kw3">◯ 関節液は水そのもので、'
        'T<sub>2</sub>強調像で高信号（白）になる</span>。'
        '<span class="kw3">T<sub>2</sub>強調像は'
        '「水を白く写す」撮り方</span>だから、'
        '<span class="kw3">関節液・脳脊髄液・囊胞・浮腫・膿はすべて白い</span>。'
        '<span class="kw3">逆にT<sub>1</sub>強調像では水は黒い</span>。'
        '<span class="kw3">整形外科領域でMRIが多用されるのは、'
        'まさにこの「水の分布」＝'
        '関節液貯留・骨挫傷（骨髄浮腫）・腱／靱帯の損傷・半月板の変性が'
        '一目で分かるから</span>である。'),
       ('d', '骨皮質', False,
        '<span class="kw4">骨皮質は緻密で可動性の水素原子がほとんどなく、'
        'どのシーケンスでも無信号（真っ黒）</span>。'
        '<span class="kw3">「どのシーケンスでも黒いもの＝'
        '骨皮質・空気・flow void（血管内の流れる血液）・'
        '石灰化・金属」</span>と覚える。'
        '<span class="kw4">骨折線そのものはMRIで直接見えにくい</span>が、'
        '<span class="kw3">周囲の骨髄浮腫がT<sub>2</sub>・脂肪抑制像で'
        '高信号になるので、単純撮影で写らない不顕性骨折を拾える</span>。'),
       ('e', '半月板', False,
        '<span class="kw4">半月板は線維軟骨で、正常ならT<sub>2</sub>強調像で'
        '低信号の三角形（矢状断では蝶ネクタイ状）に見える</span>。'
        '<span class="kw3">内部に高信号が現れ、それが関節面に達していれば'
        '半月板断裂</span>——'
        '<span class="kw3">「低信号の中の高信号が関節面に届くか」で'
        '変性と断裂を分ける</span>のが読影の要点である。')],
      'T2強調像は「水が白い」撮り方。関節液・浮腫・囊胞が高信号。腱・靱帯・骨皮質は黒。',
      patho=('🔎 MRIの信号——「何が白いか」だけ覚えれば読める',
             '<span class="kw3">MRIの読影は、まず'
             '「そのシーケンスで何が白くなるか」を'
             '押さえるところから始まる</span>。' + TBL_MRI),
      deep=('💡 整形外科でMRIが強い理由——「水の分布」が病変そのもの',
            '<span class="kw3">骨と関節の病変の多くは'
            '「水がたまる」という形で現れる</span>——'
            '<span class="kw3">だからT<sub>2</sub>強調像（＋脂肪抑制）で'
            'ほとんどが可視化できる</span>。'
            '<table class="tb"><tr><th>組織</th>'
            '<th>T<sub>1</sub>強調像</th><th>T<sub>2</sub>強調像</th>'
            '<th>病変での変化</th></tr>'
            '<tr><td><span class="kw3">関節液・囊胞</span></td>'
            '<td><span class="kw4">低（黒）</span></td>'
            '<td><span class="kw3">高（白）</span></td>'
            '<td><span class="kw3">量が増えれば関節液貯留</span></td></tr>'
            '<tr><td>腱・靱帯</td><td>低</td><td>低</td>'
            '<td><span class="kw3">断裂・炎症でT<sub>2</sub>高信号'
            '＋腫大・連続性の途絶</span></td></tr>'
            '<tr><td>半月板・線維軟骨</td><td>低</td><td>低</td>'
            '<td><span class="kw3">内部の高信号が関節面に達すれば断裂</span></td></tr>'
            '<tr><td>硝子（関節）軟骨</td><td>中等度</td><td>中等度</td>'
            '<td>菲薄化・欠損</td></tr>'
            '<tr><td><span class="kw">骨　髄</span></td>'
            '<td><span class="kw">高（脂肪髄のため）</span></td>'
            '<td>中等度</td>'
            '<td><span class="kw3">骨挫傷・不顕性骨折・骨壊死・腫瘍で'
            'T<sub>1</sub>低信号＋脂肪抑制T<sub>2</sub>高信号</span></td></tr>'
            '<tr><td><span class="kw4">骨皮質</span></td>'
            '<td><span class="kw4">無信号</span></td>'
            '<td><span class="kw4">無信号</span></td>'
            '<td><span class="kw4">骨皮質の評価はCT・単純撮影が優る</span></td></tr>'
            '</table>'
            '<span class="kw3">脂肪抑制を併用するのは、'
            '骨髄の脂肪が明るくて病変（水）が埋もれるのを防ぐため</span>——'
            '<span class="kw3">「脂肪を消せば水だけが光る」</span>。'
            '<span class="kw3">婦人科領域（成熟囊胞性奇形腫の脂肪の証明）でも'
            '同じ手法を使う</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">T<sub>2</sub>強調像で白い＝水'
             '（関節液・脳脊髄液・浮腫・囊胞・膿）</span>。<br>'
             '② <span class="kw3">T<sub>1</sub>強調像で白い＝脂肪・'
             '亜急性期の出血・造影剤</span>。<br>'
             '③ <span class="kw3">どのシーケンスでも黒い＝骨皮質・空気・'
             'flow void・石灰化・金属</span>。<br>'
             '④ <span class="kw3">腱・靱帯・半月板は本来低信号</span>——'
             '<span class="kw3">そこに高信号が出れば損傷</span>。<br>'
             '⑤ <span class="kw">脂肪抑制＝脂肪を消して水だけを光らせる</span>'
             '（骨髄浮腫・奇形腫の脂肪証明）。')),

    # ── NO.18 (120E-41) ★必修 99% ans=b ────────────────────────
    Q('120E-41', 99, [('bs', '★'), ('bh', '必修')],
      '<span class="kw">次の文を読み、Q.18〜Q.19 の問いに答えよ。</span><br>'
      '75 歳の男性。尿量の減少を主訴に来院した。<br>'
      '<b>現病歴：</b><span class="kw">約1 年前から排尿困難感を自覚していた</span>が'
      '医療機関を受診しなかった。'
      '<span class="kw">2 日前から感冒様症状があり、自宅近くの診療所から'
      '総合感冒薬とアセトアミノフェンが処方され内服していた。'
      '昨夜、飲酒をした後から排尿困難感が悪化し、'
      '尿が間欠的に少量しか出なくなった。下腹部の膨満感も強くなった</span>ため、'
      '救急外来を受診した。<br>'
      '<b>既往歴：</b>高血圧症、糖尿病。<br>'
      '<b>生活歴：</b>喫煙は70 歳まで10 本/ 日を50 年間。飲酒は機会飲酒。<br>'
      '<b>家族歴：</b>特記すべきことはない。<br>'
      '<b>現　症：</b>意識は清明。身長175cm、体重77kg。体温36.4℃。脈拍64/ 分、整。'
      '血圧140/92mmHg。呼吸数20/ 分。SpO<sub>2</sub> 97％（room air）。'
      '努力呼吸を認めない。<span class="kw">皮膚、口腔内の乾燥を認めない。'
      '腹部は下腹部が膨隆しており、やや硬い。軽度の圧痛がある。</span>'
      '腸雑音に異常を認めない。'
      '<span class="kw">直腸指診で径5cm、弾性硬の前立腺を触知し、圧痛を認めない。</span><br>'
      '<b>検査所見：</b>尿所見：蛋白（－）、糖1 ＋、潜血（－）、沈渣に異常を認めない。'
      '血液所見：赤血球489 万、Hb 15.0g/dL、Ht 44％、白血球5,200、血小板17 万。'
      '血液生化学所見：総蛋白7.7g/dL、アルブミン4.8g/dL、総ビリルビン0.8mg/dL、'
      'AST 26U/L、ALT 15U/L、LD 200U/L（基準124 ～222）、ALP 67U/L（基準38 ～113）、'
      'γ-GT 40U/L（基準13 ～64）、アミラーゼ108U/L（基準44 ～132）、'
      'CK 180U/L（基準59 ～248）、尿素窒素14mg/dL、'
      '<span class="kw">クレアチニン0.9mg/dL</span>、尿酸6.6mg/dL、血糖130mg/dL、'
      'HbA1c 6.5％（基準4.9 ～6.0）、Na 138mEq/L、K 4.1mEq/L、Cl 100mEq/L。'
      'CRP 0.1mg/dL。腹部超音波像を示す。<br>'
      '<strong>最も考えられる病態はどれか。</strong>',
      [('a', '脱　水', False,
        '<span class="kw4">脱水なら皮膚・口腔内の乾燥、'
        '頻脈、血液濃縮（Ht上昇・BUN/Cr比の上昇）を伴う</span>。'
        '<span class="kw4">本例は「皮膚、口腔内の乾燥を認めない」と明記され、'
        '脈拍64/分、BUN 14／Cr 0.9（比15）と正常</span>。'
        '<span class="kw4">積極的に否定されている</span>。'),
       ('b', '尿　閉', True,
        '<span class="kw3">◯ 尿閉（急性尿閉）</span>。'
        '<span class="kw3">「下腹部が膨隆してやや硬い」＝'
        '充満した膀胱を触れている</span>のが決定的で、'
        '<span class="kw3">超音波でも著明に拡張した膀胱が確認できる</span>。'
        '<span class="kw3">背景は前立腺肥大症（1年前からの排尿困難感、'
        '直腸指診で径5cm・弾性硬・表面平滑・圧痛なし）</span>で、'
        '<span class="kw3">そこに引き金が2つ重なった</span>——'
        '<span class="kw3">①総合感冒薬（抗ヒスタミン薬の抗コリン作用で'
        '排尿筋が緩み、α刺激薬で尿道が締まる）'
        '②飲酒（急激な尿量増加と、アルコールによる排尿反射の抑制）</span>。'
        '<span class="kw3">これはMECが繰り返し出す定番の症例パターン</span>である。'),
       ('c', '心不全', False,
        '<span class="kw4">心不全なら呼吸困難・起坐呼吸・湿性ラ音・'
        '頸静脈怒張・浮腫を伴う</span>。'
        '<span class="kw4">本例はSpO<sub>2</sub> 97%・努力呼吸なし・'
        '呼吸数20/分で、心不全を示唆する所見がない</span>。'
        '<span class="kw">下腹部の膨隆を腹水と読むのも無理がある'
        '（腹水なら側腹部が張り、波動を触れ、「やや硬い」局所の膨隆にはならない）</span>。'),
       ('d', '腸閉塞', False,
        '<span class="kw4">腸閉塞なら腹部全体の膨満・'
        '腸雑音の亢進（金属音）または消失・嘔吐・排ガス停止を伴う</span>。'
        '<span class="kw4">本例は「腸雑音に異常を認めない」と明記され、'
        '膨隆は下腹部に限局している</span>。'),
       ('e', '急性腎障害', False,
        '<span class="kw4">尿量減少という主訴から飛びつきやすい肢</span>だが、'
        '<span class="kw4">クレアチニン0.9mg/dL・尿素窒素14mg/dLと'
        '腎機能はまったく正常</span>。'
        '<span class="kw3">「尿が出ない」の原因が'
        '「腎が作れていない」のか'
        '「作れているのに出せていない」のかは別問題</span>で、'
        '<span class="kw3">本例は後者＝膀胱に尿は溜まっている</span>。'
        '<span class="kw4">ただし尿閉を放置すれば'
        '腎後性の急性腎障害へ進む</span>ので、'
        '<span class="kw3">「今は正常だが、放置すればこうなる」という関係</span>にある。')],
      '下腹部の膨隆＋充満した膀胱＝尿閉。腎機能は正常で腎前性・腎性ではない。',
      imgs=[IMG + '120E-41_1.jpeg', IMG + '120E-41_2.jpeg'],
      patho=('🔎 画像所見——著明に拡張した膀胱と、水腎症のない腎',
             '<span class="kw3">腹部超音波像の上段は膀胱で、'
             '内部が無エコー（黒）の巨大な空間として描出され、'
             '縦80mm×横100〜120mm と計測されている</span>——'
             '<span class="kw3">＝尿が大量に貯留した膀胱そのもの</span>。'
             '<span class="kw3">下段は右腎・左腎で、'
             '腎盂・腎杯の拡張（水腎症）は目立たない</span>。'
             '<table class="tb"><tr><th>所見</th><th>読み</th><th>意味</th></tr>'
             '<tr><td><span class="kw3">膀胱の著明な拡張</span></td>'
             '<td><span class="kw3">尿は作られているが排出できていない</span></td>'
             '<td><span class="kw3">閉塞は膀胱より下（膀胱頸部・尿道）</span></td></tr>'
             '<tr><td><span class="kw3">水腎症は目立たない</span></td>'
             '<td><span class="kw3">閉塞がまだ急性で上部尿路まで'
             '及んでいない</span></td>'
             '<td><span class="kw3">腎機能が保たれていること'
             '（Cr 0.9）と整合する</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">⚠️ 泌尿器科の基本的な考え方'
             '——「膀胱に尿があるかどうかで閉塞の高さが決まる」</span>。<br>'
             '<span class="kw3">膀胱が空なのに両側水腎症 → 閉塞は尿管の高さ'
             '（尿管ステント・腎瘻）</span>／'
             '<span class="kw3">膀胱が張っている → 閉塞は尿道の高さ'
             '（尿道カテーテル・膀胱瘻）</span>。<br>'
             '本例は後者で、<span class="kw3">次問（Q.19）の答えが'
             'ここで決まっている</span>。</td></tr></table>'),
      deep=('💡 「尿が出ない」の3つの原因を切り分ける',
            '<span class="kw3">尿量減少・無尿を見たら、'
            '腎前性・腎性・腎後性のどれかを決める</span>。'
            '<table class="tb"><tr><th></th><th>腎前性</th><th>腎　性</th>'
            '<th><span class="kw3">腎後性（本例）</span></th></tr>'
            '<tr><td>原因</td>'
            '<td><span class="kw">脱水・出血・心不全・敗血症</span>'
            '（腎への血流低下）</td>'
            '<td><span class="kw">急性尿細管壊死・糸球体腎炎・'
            '間質性腎炎・造影剤腎症</span></td>'
            '<td><span class="kw3">尿路の閉塞'
            '（前立腺肥大症・尿路結石・腫瘍・神経因性膀胱）</span></td></tr>'
            '<tr><td><span class="kw3">膀胱の尿</span></td>'
            '<td>少ない（濃縮尿）</td><td>少ない</td>'
            '<td><span class="kw3">尿道閉塞なら充満、'
            '尿管閉塞なら空</span></td></tr>'
            '<tr><td>身体所見</td>'
            '<td><span class="kw">皮膚・口腔の乾燥、'
            '頻脈、起立性低血圧</span></td>'
            '<td>—</td>'
            '<td><span class="kw3">下腹部の膨隆（膀胱を触知）</span></td></tr>'
            '<tr><td>BUN/Cr比</td>'
            '<td><span class="kw">上昇（20以上）</span></td>'
            '<td>正常</td><td>さまざま</td></tr>'
            '<tr><td>画　像</td><td>—</td><td>—</td>'
            '<td><span class="kw3">超音波で膀胱の充満／水腎症</span></td></tr>'
            '<tr><td>対応</td>'
            '<td><span class="kw">輸液（細胞外液）</span></td>'
            '<td>原因の除去・腎保護</td>'
            '<td><span class="kw3">閉塞の解除が最優先</span></td></tr></table>'
            '<span class="kw3">腎後性は「解除すれば治る」ので、'
            '見つけたらまず解除する</span>——'
            '<span class="kw3">超音波1本で診断でき、しかも'
            '放置すれば不可逆な腎障害に進む</span>ため、'
            '<span class="kw3">「尿が出ない」と言われたら'
            'まずベッドサイドで膀胱をエコーで見る</span>のが実践的である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">下腹部の膨隆＋超音波で充満した膀胱＝尿閉</span>。<br>'
             '② <span class="kw3">膀胱に尿があるかどうかで閉塞の高さが決まる</span>'
             '（膀胱が空＋水腎症＝尿管／膀胱が張る＝尿道）。<br>'
             '③ <span class="kw3">BPHの尿閉の引き金＝総合感冒薬'
             '（抗ヒスタミン薬・α刺激薬）と飲酒</span>。<br>'
             '④ <span class="kw">BPHの直腸指診＝弾性硬・表面平滑・圧痛なし</span>'
             '（癌は石様硬・表面不整）。<br>'
             '⑤ <span class="kw4">放置すれば腎後性急性腎障害へ進む</span>。')),

    # ── NO.19 (120E-42) 必修 99% ans=e ─────────────────────────
    Q('120E-42', 99, [('bh', '必修')],
      '<span class="kw">次の文を読み、Q.18〜Q.19 の問いに答えよ。</span><br>'
      '75 歳の男性。尿量の減少を主訴に来院した。<br>'
      '<b>現病歴：</b><span class="kw">約1 年前から排尿困難感を自覚していた</span>が'
      '医療機関を受診しなかった。'
      '<span class="kw">2 日前から感冒様症状があり、自宅近くの診療所から'
      '総合感冒薬とアセトアミノフェンが処方され内服していた。'
      '昨夜、飲酒をした後から排尿困難感が悪化し、'
      '尿が間欠的に少量しか出なくなった。下腹部の膨満感も強くなった</span>ため、'
      '救急外来を受診した。<br>'
      '<b>既往歴：</b>高血圧症、糖尿病。<br>'
      '<b>生活歴：</b>喫煙は70 歳まで10 本/ 日を50 年間。飲酒は機会飲酒。<br>'
      '<b>家族歴：</b>特記すべきことはない。<br>'
      '<b>現　症：</b>意識は清明。身長175cm、体重77kg。体温36.4℃。脈拍64/ 分、整。'
      '血圧140/92mmHg。呼吸数20/ 分。SpO<sub>2</sub> 97％（room air）。'
      '努力呼吸を認めない。<span class="kw">皮膚、口腔内の乾燥を認めない。'
      '腹部は下腹部が膨隆しており、やや硬い。軽度の圧痛がある。</span>'
      '腸雑音に異常を認めない。'
      '<span class="kw">直腸指診で径5cm、弾性硬の前立腺を触知し、圧痛を認めない。</span><br>'
      '<b>検査所見：</b>尿所見：蛋白（－）、糖1 ＋、潜血（－）、沈渣に異常を認めない。'
      '血液所見：赤血球489 万、Hb 15.0g/dL、Ht 44％、白血球5,200、血小板17 万。'
      '血液生化学所見：総蛋白7.7g/dL、アルブミン4.8g/dL、総ビリルビン0.8mg/dL、'
      'AST 26U/L、ALT 15U/L、LD 200U/L（基準124 ～222）、ALP 67U/L（基準38 ～113）、'
      'γ-GT 40U/L（基準13 ～64）、アミラーゼ108U/L（基準44 ～132）、'
      'CK 180U/L（基準59 ～248）、尿素窒素14mg/dL、'
      '<span class="kw">クレアチニン0.9mg/dL</span>、尿酸6.6mg/dL、血糖130mg/dL、'
      'HbA1c 6.5％（基準4.9 ～6.0）、Na 138mEq/L、K 4.1mEq/L、Cl 100mEq/L。'
      'CRP 0.1mg/dL。腹部超音波像を示す。<br>'
      '<strong>適切な対応はどれか。</strong>',
      [('a', '絶飲食', False,
        '<span class="kw4">絶飲食は消化管の閉塞・穿孔・'
        '緊急手術を前提とする対応</span>。'
        '<span class="kw4">本例は消化管に問題がなく（腸雑音正常）、'
        '絶飲食にしても尿は出るようにならない</span>。'
        '<span class="kw4">むしろ脱水を招くだけで有害</span>。'),
       ('b', '血液透析', False,
        '<span class="kw4">クレアチニン0.9mg/dL・K 4.1mEq/L・'
        'アシドーシスも溢水も無く、透析の適応がまったくない</span>。'
        '<span class="kw3">仮に腎後性腎障害でCrが上昇していたとしても、'
        'まず行うべきは閉塞の解除であって透析ではない</span>——'
        '<span class="kw3">閉塞を解除すれば腎機能は回復する</span>。'
        '<span class="kw3">「透析より先にカテーテル」は泌尿器科で'
        '繰り返し問われる原則</span>である。'),
       ('c', 'β遮断薬投与', False,
        '<span class="kw4">β遮断薬は排尿に無関係</span>。'
        '<span class="kw3">前立腺肥大症で使うのはα<sub>1</sub>遮断薬'
        '（タムスロシン・シロドシンなど）</span>で、'
        '<span class="kw3">前立腺と膀胱頸部の平滑筋のα<sub>1</sub>受容体を'
        '遮断して尿道抵抗を下げる</span>。'
        '<span class="kw4">「α」と「β」を取り違えさせる肢</span>で、'
        '<span class="kw4">しかも急性尿閉の「いま」の対応としては'
        '薬では間に合わない</span>。'),
       ('d', 'フロセミド投与', False,
        '<span class="kw4">出口が詰まっているところに'
        '利尿薬で尿を増やしても、膀胱がさらに膨れるだけで有害</span>。'
        '<span class="kw4">膀胱破裂や強い苦痛につながりうる</span>。'
        '<span class="kw3">「尿量減少＝利尿薬」という条件反射が'
        '最も危険な誤り</span>で、'
        '<span class="kw3">利尿薬が意味を持つのは'
        '「腎は働けるのに体液がうっ滞している」場合（心不全など）だけ</span>である。'),
       ('e', '尿道カテーテル留置', True,
        '<span class="kw3">◯ 急性尿閉に対する第一の処置は導尿'
        '（尿道カテーテルの留置）</span>である。'
        '<span class="kw3">診断的にも治療的にも即効性があり、'
        '苦痛が直ちに取れ、腎後性腎障害への進行も防げる</span>。'
        '<span class="kw3">「尿閉をみたら、理屈より先に導尿」</span>——'
        '<span class="kw3">Crが高くても透析より先、'
        '両側水腎症があっても腎瘻より先にまずカテーテル</span>。'
        '<span class="kw">尿道からの挿入が困難なら'
        '（尿道狭窄・偽尿道形成・尿道損傷）膀胱瘻を考える</span>。<br>'
        '<span class="kw4">⚠️ 留置後の注意——長時間の閉塞後に'
        '一気に排出すると膀胱内圧の急減で'
        '膀胱粘膜からの出血（減圧性血尿）や'
        '閉塞解除後利尿〈post-obstructive diuresis〉、'
        '一過性の低血圧を起こしうる</span>ので、'
        '<span class="kw3">排出後は尿量・バイタル・電解質を監視する</span>。')],
      '急性尿閉は理屈より先に導尿。透析・腎瘻・利尿薬はすべてその後（または不要）。',
      imgs=[IMG + '120E-42_1.jpeg', IMG + '120E-42_2.jpeg'],
      patho=('🔎 閉塞の高さ別——何を入れるかは「どこで詰まっているか」で決まる',
             '<span class="kw3">尿路閉塞の解除は、'
             '閉塞部位より上流に「出口」を作ること</span>。'
             '<table class="tb"><tr><th>閉塞の高さ</th><th>代表的な原因</th>'
             '<th>超音波の所見</th><th>解除の方法</th></tr>'
             '<tr><td><span class="kw3">尿道・膀胱頸部</span></td>'
             '<td><span class="kw3">前立腺肥大症・前立腺癌・'
             '尿道狭窄・神経因性膀胱・薬剤性</span></td>'
             '<td><span class="kw3">膀胱が充満</span></td>'
             '<td><span class="kw3">尿道カテーテル</span>'
             '（困難なら<span class="kw3">膀胱瘻</span>）</td></tr>'
             '<tr><td><span class="kw3">尿　管</span></td>'
             '<td><span class="kw3">結石・腫瘍（尿路上皮癌・'
             '骨盤内腫瘍による圧排）・後腹膜線維症</span></td>'
             '<td><span class="kw3">膀胱は空で水腎症</span></td>'
             '<td><span class="kw3">尿管ステント</span>'
             '（困難なら<span class="kw3">経皮的腎瘻</span>）</td></tr>'
             '<tr><td colspan="4"><span class="kw3">⚠️ 発熱を伴う閉塞'
             '（閉塞性腎盂腎炎）は緊急ドレナージの適応</span>——'
             '<span class="kw3">抗菌薬だけでは治らず、'
             '砕石などの根本治療は感染が鎮まってから</span>。</td></tr></table>'),
      deep=('💡 前立腺肥大症による尿閉——引き金と、その後の治療',
            '<span class="kw3">急性尿閉は「前立腺が急に大きくなった」のではなく、'
            '「もともと狭かったところに引き金が加わった」</span>ために起こる。'
            '<table class="tb"><tr><th>引き金</th><th>機序</th></tr>'
            '<tr><td><span class="kw3">総合感冒薬・抗ヒスタミン薬</span></td>'
            '<td><span class="kw3">抗コリン作用で排尿筋（膀胱の収縮）が緩む</span></td></tr>'
            '<tr><td><span class="kw3">α刺激薬（点鼻薬・感冒薬に含まれる）</span></td>'
            '<td><span class="kw3">前立腺・膀胱頸部の平滑筋が収縮して'
            '尿道抵抗が上がる</span></td></tr>'
            '<tr><td><span class="kw3">飲　酒</span></td>'
            '<td><span class="kw3">利尿で急に尿量が増え、'
            'かつ中枢性に排尿反射が抑制される</span></td></tr>'
            '<tr><td><span class="kw">三環系抗うつ薬・抗パーキンソン病薬・'
            '一部の抗精神病薬</span></td>'
            '<td><span class="kw">抗コリン作用</span></td></tr>'
            '<tr><td><span class="kw">長時間の座位・便秘・寒冷</span></td>'
            '<td>骨盤内のうっ血・交感神経緊張</td></tr></table>'
            '<span class="kw3">導尿で急場をしのいだあとは、'
            'α<sub>1</sub>遮断薬（＋5α還元酵素阻害薬）を開始し、'
            'カテーテルを抜いて自排尿できるか試す</span>。'
            '<span class="kw4">再燃を繰り返す・腎機能障害を伴う・'
            '膀胱結石や反復する尿路感染がある場合は'
            '経尿道的前立腺切除術〈TURP〉などの手術</span>を考える。<br>'
            '<span class="kw4">⚠️ 前立腺肥大症に抗コリン薬（過活動膀胱の薬）を'
            '安易に使うと尿閉を招く</span>——'
            '<span class="kw4">国試で「不適切な処方」として頻出</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">急性尿閉の第一の処置は尿道カテーテル留置（導尿）</span>。<br>'
             '② <span class="kw3">Crが高くても透析より先、'
             '水腎症があっても腎瘻より先にまずカテーテル</span>。<br>'
             '③ <span class="kw4">出口が詰まっているのに利尿薬は禁</span>。<br>'
             '④ <span class="kw3">BPHの薬はα<sub>1</sub>遮断薬</span>'
             '（β遮断薬ではない）。'
             '<span class="kw4">抗コリン薬は尿閉を招く</span>。<br>'
             '⑤ <span class="kw">長時間閉塞後の急な減圧では'
             '血尿・閉塞解除後利尿・低血圧に注意</span>。')),

]


QUESTIONS += [

    # ============================ 無印問題 ============================

    # ── NO.20 (117F-68) 89% ans=a ──────────────────────────────
    Q('117F-68', 89, [],
      '<span class="kw">次の文を読み、Q.20〜Q.22 の問いに答えよ。</span><br>'
      '76 歳の女性。歩行障害を主訴に来院した。<br>'
      '<b>現病歴：</b><span class="kw">6 年前から左上肢の動かしにくさが出現し、'
      '4 年前から歩くのが遅くなった。4 年前から自宅近くの診療所で'
      'レボドパ〈L-dopa〉を処方され症状は改善した。'
      '1 年前から内服薬の効果が持続しなくなり、歩行困難が進行した。'
      '半年前から、歩行中に足が止まってしまうことがあり、'
      '2 回転倒したため専門外来を受診した。</span><br>'
      '<b>既往歴：</b>脂質異常症でスタチンを内服している。<br>'
      '<b>生活歴：</b>喫煙歴、飲酒歴はない。転倒しないようにほとんど外出しない。'
      '室内のトイレ歩行などの日常生活動作は自立している。<br>'
      '<b>家族歴：</b>特記すべきことはない。<br>'
      '<b>現　症：</b>意識は清明。身長158cm、体重45kg。体温36.2℃。脈拍64/ 分、整。'
      '血圧110/60mmHg。胸腹部に異常を認めない。'
      '<span class="kw">神経診察では仮面様顔貌、小声および摂食時のむせこみを認める。'
      '四肢筋強剛、動作緩慢を認める。筋力低下、感覚低下は認めない。</span><br>'
      '<b>検査所見：</b>血液所見：赤血球340 万、Hb 11.2g/dL、白血球6,300、血小板13 万。'
      '血液生化学所見：総蛋白6.3g/dL、アルブミン4.5g/dL、総ビリルビン0.2mg/dL、'
      'AST 24U/L、ALT 18U/L、LD 160U/L（基準120 ～245）、γ-GT 41U/L（基準8 ～50）、'
      'CK 58U/L（基準30 ～140）、尿素窒素18mg/dL、クレアチニン0.6mg/dL、'
      '血糖98mg/dL、Na 138mEq/L、K 4.0mEq/L、Cl 97mEq/L。CRP 0.2mg/dL。<br>'
      '今回、撮像したドパミントランスポーターSPECT（A）と'
      '<sup>123</sup>I-MIBG 交感神経心筋シンチグラム（B）を示す。<br>'
      '<strong>診断はどれか。</strong>',
      [('a', 'Parkinson 病', True,
        '<span class="kw3">◯ Parkinson病の典型例</span>。'
        '<span class="kw3">①左上肢から始まった＝左右非対称の発症 '
        '②L-dopaが著効した ③仮面様顔貌・小声・筋強剛・動作緩慢という'
        '4徴のうち3つが揃う ④経過とともにwearing off（薬効の短縮）と'
        'すくみ足・姿勢反射障害が出てきた</span>——'
        '<span class="kw3">いずれもParkinson病の教科書的な経過</span>である。'
        '<span class="kw3">画像でもドパミントランスポーターの'
        '線条体集積が低下し、かつMIBG心筋シンチの集積も低下しており、'
        'この2つが揃うのはParkinson病とLewy小体型認知症だけ</span>。'
        '<span class="kw">認知症の記載がないので前者</span>。'),
       ('b', '多系統萎縮症', False,
        '<span class="kw4">MSAは自律神経障害（起立性低血圧・排尿障害）・'
        '小脳失調・錐体路徴候を伴い、L-dopaの効果は乏しい</span>。'
        '<span class="kw4">本例はL-dopaが著効しており（4年前から症状が改善）、'
        '自律神経症状・失調の記載もない</span>。'
        '<span class="kw3">またMSAではMIBG心筋シンチの集積が'
        '保たれる（正常〜軽度低下）</span>のが鑑別点。'),
       ('c', '進行性核上性麻痺', False,
        '<span class="kw4">PSPは①発症早期からの易転倒 '
        '②垂直性核上性眼球運動障害 ③頸部優位の筋強剛 '
        '④L-dopa無効</span>が特徴（NO.13参照）。'
        '<span class="kw4">本例はL-dopaが効き、'
        '転倒が出たのも発症6年後、眼球運動障害の記載もない</span>。'
        '<span class="kw3">MIBG心筋シンチも保たれるはず</span>。'),
       ('d', '大脳皮質基底核変性症', False,
        '<span class="kw4">CBDは著明な左右差に加えて'
        '肢節運動失行・観念運動失行・皮質性感覚障害・'
        '他人の手徴候といった大脳皮質症状を伴う</span>。'
        '<span class="kw4">L-dopaは無効で、本例の経過と合わない</span>。'),
       ('e', '薬剤性Parkinson 症候群', False,
        '<span class="kw4">薬剤性パーキンソニズムの原因は'
        '抗精神病薬・制吐薬（メトクロプラミド）・'
        'スルピリド・一部のカルシウム拮抗薬</span>で、'
        '<span class="kw4">本例の内服はスタチンのみ</span>。'
        '<span class="kw3">加えて薬剤性ではドパミントランスポーターの'
        '集積は正常</span>——'
        '<span class="kw3">シナプス前のドパミン神経は生きていて、'
        '受容体が遮断されているだけ</span>だからである。'
        '<span class="kw3">DaTスキャンはまさにこの鑑別のために使う</span>。')],
      '左右非対称の発症＋L-dopa著効＋DaT低下＋MIBG低下＝Parkinson病。',
      imgs=[IMG + '117F-68_1.jpeg', IMG + '117F-68_2.jpeg'],
      patho=('🔎 画像所見——線条体の集積低下と、心臓のMIBG集積低下',
             '<span class="kw3">A（ドパミントランスポーターSPECT）は'
             '線条体（被殻・尾状核）の集積を見る</span>。'
             '<span class="kw3">正常では左右対称の「コンマ（，）状」の'
             '強い集積として描出されるが、'
             'Parkinson病では被殻後部から集積が落ち、'
             'コンマが短く丸い「点状」に変形する</span>。'
             '<span class="kw3">しかも<u>左右差を伴う</u>のがParkinson病の特徴</span>'
             '（本例は左上肢から発症＝右半球側が強く障害される）。<br>'
             '<span class="kw3">B（<sup>123</sup>I-MIBG心筋シンチグラム）では'
             '早期相・遅延相ともに心臓への集積を評価する</span>。'
             '<span class="kw3">本患者では正常対照と比べて'
             '心臓の描出が乏しく＝心筋交感神経終末の変性を示す</span>。'
             '<span class="kw3">Parkinson病では中枢だけでなく'
             '末梢の自律神経系にもα-シヌクレインが蓄積する</span>ため、'
             '<span class="kw3">心臓のMIBG取り込みが低下する</span>。'
             '<table class="tb"><tr><th>疾患</th><th>DaTスキャン</th>'
             '<th>MIBG心筋シンチ</th><th>本例</th></tr>'
             '<tr><td><span class="kw3">Parkinson病</span></td>'
             '<td><span class="kw3">低下（左右差あり）</span></td>'
             '<td><span class="kw3">低下</span></td>'
             '<td><span class="kw3">合致</span></td></tr>'
             '<tr><td>Lewy小体型認知症</td><td>低下</td><td>低下</td>'
             '<td><span class="kw4">認知症・幻視の記載なし</span></td></tr>'
             '<tr><td>PSP／MSA／CBD</td>'
             '<td><span class="kw">低下（左右差に乏しい）</span></td>'
             '<td><span class="kw">正常〜軽度低下</span></td>'
             '<td><span class="kw4">MIBGが低下していて合わない</span></td></tr>'
             '<tr><td>薬剤性／本態性振戦／Alzheimer型</td>'
             '<td><span class="kw4">正常</span></td>'
             '<td>正常（Alzheimer型）</td>'
             '<td><span class="kw4">DaTが低下していて合わない</span></td></tr>'
             '<tr><td colspan="4"><span class="kw3">2つの核医学検査は'
             '「変性か否か」（DaT）と「自律神経を巻き込むか」（MIBG）を'
             '別々に測っている</span>——'
             '<span class="kw3">組み合わせて初めて鑑別できる</span>。</td></tr></table>'),
      deep=('💡 Parkinson病の経過——「効いていた薬が効かなくなる」まで',
            '<span class="kw3">本例の病歴は、Parkinson病の'
            '典型的な10年の経過をそのまま書いている</span>。'
            '<table class="tb"><tr><th>時期</th><th>本例の記載</th>'
            '<th>病態</th></tr>'
            '<tr><td><span class="kw3">6年前</span></td>'
            '<td><span class="kw3">左上肢の動かしにくさ</span></td>'
            '<td><span class="kw3">片側から発症（左右非対称）</span></td></tr>'
            '<tr><td>4年前</td>'
            '<td><span class="kw3">L-dopaで症状が改善</span></td>'
            '<td><span class="kw3">ハネムーン期——'
            '残存ニューロンがドパミンを貯蔵・放出できる</span></td></tr>'
            '<tr><td><span class="kw3">1年前</span></td>'
            '<td><span class="kw3">薬の効果が持続しなくなった</span></td>'
            '<td><span class="kw3">wearing off——'
            'ニューロンが減り貯蔵能が落ちて'
            '血中濃度に効果が直結するようになる</span></td></tr>'
            '<tr><td><span class="kw3">半年前</span></td>'
            '<td><span class="kw3">すくみ足・転倒</span></td>'
            '<td><span class="kw3">姿勢反射障害（Hoehn-Yahr Ⅲ度）</span>'
            '——<span class="kw4">L-dopaが効きにくい症状</span></td></tr>'
            '<tr><td>現在</td>'
            '<td><span class="kw">摂食時のむせこみ</span></td>'
            '<td><span class="kw4">嚥下障害</span>——'
            '<span class="kw4">誤嚥性肺炎が予後を規定する</span></td></tr></table>'
            '<span class="kw3">薬物療法で改善するのは'
            '無動・筋強剛・振戦（ドパミン系の症状）だけ</span>で、'
            '<span class="kw3">姿勢反射障害・すくみ足・嚥下障害・'
            '自律神経症状は薬では取れない</span>——'
            '<span class="kw3">だからリハビリテーションと環境調整が要る'
            '（Q.22へつながる）</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">Parkinson病＝左右非対称の発症＋L-dopa著効</span>。'
             '<span class="kw">4徴＝安静時振戦・筋強剛・無動／寡動・姿勢反射障害</span>。<br>'
             '② <span class="kw3">DaTスキャン低下＋MIBG心筋シンチ低下＝'
             'Parkinson病／Lewy小体型認知症</span>。<br>'
             '③ <span class="kw3">PSP・MSAではMIBGは保たれる</span>。'
             '<span class="kw3">薬剤性ではDaTが正常</span>。<br>'
             '④ <span class="kw">wearing off＝薬効時間の短縮（進行の指標）</span>。<br>'
             '⑤ <span class="kw4">姿勢反射障害・すくみ足・嚥下障害は'
             'L-dopaで改善しにくい</span>。')),

    # ── NO.21 (117F-69) CBT 86% ans=e ──────────────────────────
    Q('117F-69', 86, [('bc', 'CBT')],
      '<span class="kw">次の文を読み、Q.20〜Q.22 の問いに答えよ。</span><br>'
      '76 歳の女性。歩行障害を主訴に来院した。<br>'
      '<b>現病歴：</b><span class="kw">6 年前から左上肢の動かしにくさが出現し、'
      '4 年前から歩くのが遅くなった。4 年前から自宅近くの診療所で'
      'レボドパ〈L-dopa〉を処方され症状は改善した。'
      '1 年前から内服薬の効果が持続しなくなり、歩行困難が進行した。'
      '半年前から、歩行中に足が止まってしまうことがあり、'
      '2 回転倒したため専門外来を受診した。</span><br>'
      '<b>既往歴：</b>脂質異常症でスタチンを内服している。<br>'
      '<b>生活歴：</b>喫煙歴、飲酒歴はない。転倒しないようにほとんど外出しない。'
      '室内のトイレ歩行などの日常生活動作は自立している。<br>'
      '<b>家族歴：</b>特記すべきことはない。<br>'
      '<b>現　症：</b>意識は清明。身長158cm、体重45kg。体温36.2℃。脈拍64/ 分、整。'
      '血圧110/60mmHg。胸腹部に異常を認めない。'
      '<span class="kw">神経診察では仮面様顔貌、小声および摂食時のむせこみを認める。'
      '四肢筋強剛、動作緩慢を認める。筋力低下、感覚低下は認めない。</span><br>'
      '<b>検査所見：</b>血液・血液生化学所見に特記すべき異常を認めない。<br>'
      '<strong>この患者に認められる可能性が高い症候はどれか。</strong>',
      [('a', '下肢痙縮', False,
        '<span class="kw4">痙縮は上位運動ニューロン障害（錐体路障害）の徴候</span>で、'
        '<span class="kw4">腱反射亢進・Babinski徴候陽性を伴う</span>。'
        '<span class="kw3">Parkinson病の筋緊張亢進は「痙縮」ではなく'
        '「筋強剛〈固縮〉」</span>——'
        '<span class="kw3">痙縮は速度依存性で折りたたみナイフ現象を示すのに対し、'
        '筋強剛は速度に依存せず鉛管様・歯車様に'
        '全可動域で一様に抵抗する</span>。'
        '<span class="kw3">この2つの区別は錐体路障害と'
        '錐体外路障害を分ける基本</span>である。'),
       ('b', '測定障害', False,
        '<span class="kw4">測定障害〈dysmetria〉は小脳性運動失調の徴候</span>'
        '（<span class="kw">指鼻試験・踵膝試験で目標を行き過ぎる／届かない</span>）。'
        '<span class="kw4">Parkinson病は基底核の疾患であり小脳症状は出ない</span>。'
        '<span class="kw">小脳失調が前面に出るなら'
        '多系統萎縮症（MSA-C）や脊髄小脳変性症を考える</span>。'),
       ('c', '姿勢時振戦', False,
        '<span class="kw4">姿勢時振戦（手を前に伸ばして保持したときに出る振戦）は'
        '本態性振戦の特徴</span>。'
        '<span class="kw3">Parkinson病の振戦は「安静時振戦」</span>——'
        '<span class="kw3">力を抜いて膝の上に置いているときに'
        '4〜6Hzの丸薬まるめ様運動〈pill-rolling〉として出現し、'
        '動作を始めると軽減する</span>。'
        '<span class="kw3">「いつ出るか」で振戦の種類が決まる</span>'
        '（安静時＝Parkinson病／姿勢時・企図時＝本態性振戦・小脳）。'),
       ('d', '眼球運動障害', False,
        '<span class="kw4">垂直性核上性眼球運動障害は'
        '進行性核上性麻痺〈PSP〉の特徴</span>（NO.13参照）。'
        '<span class="kw4">Parkinson病でも上方視の軽度制限や'
        '輻輳不全がみられることはあるが、'
        '「認められる可能性が高い症候」として選ぶものではない</span>。'),
       ('e', '姿勢反射障害', True,
        '<span class="kw3">◯ 姿勢反射障害はParkinson病の4徴のひとつ</span>で、'
        '<span class="kw3">本例では「歩行中に足が止まる（すくみ足）」'
        '「2回転倒した」という形ですでに現れている</span>。'
        '<span class="kw3">診察では後方への引き試験〈pull test〉で確認する</span>'
        '（<span class="kw">背後から肩を引いて、'
        '2歩以上の後方突進または介助を要すれば陽性</span>）。'
        '<span class="kw3">姿勢反射障害が出現するとHoehn-Yahr重症度分類Ⅲ度</span>で、'
        '<span class="kw3">介護保険の対象（特定疾病）となり、'
        '難病医療費助成の対象にもなる（Ⅲ度以上かつ生活機能障害度Ⅱ度以上）</span>——'
        '<span class="kw3">臨床的にも制度的にも大きな区切り</span>である。'
        '<span class="kw4">しかもL-dopaで改善しにくい</span>ので、'
        '<span class="kw3">転倒予防（住宅改修・歩行訓練）が'
        '治療の中心になる（Q.22へ）</span>。')],
      'Parkinson病の4徴＝安静時振戦・筋強剛・無動／寡動・姿勢反射障害。',
      patho=('🔎 Parkinson病の4徴と、紛らわしい所見の切り分け',
             '<span class="kw3">Parkinson病の主症状は4つ（TRAP）</span>——'
             '<span class="kw3">Tremor（安静時振戦）・Rigidity（筋強剛）・'
             'Akinesia／bradykinesia（無動・動作緩慢）・'
             'Postural instability（姿勢反射障害）</span>。'
             '<table class="tb"><tr><th>Parkinson病の所見</th>'
             '<th>紛らわしい所見</th><th>それはどの疾患か</th></tr>'
             '<tr><td><span class="kw3">安静時振戦</span>'
             '（4〜6Hz・丸薬まるめ様・動作で軽減）</td>'
             '<td><span class="kw4">姿勢時振戦・企図振戦</span></td>'
             '<td><span class="kw4">本態性振戦／小脳疾患</span></td></tr>'
             '<tr><td><span class="kw3">筋強剛〈固縮〉</span>'
             '（速度非依存・鉛管様／歯車様）</td>'
             '<td><span class="kw4">痙縮</span>'
             '（速度依存・折りたたみナイフ）</td>'
             '<td><span class="kw4">錐体路障害（脳梗塞・脊髄症）</span></td></tr>'
             '<tr><td><span class="kw3">無動・動作緩慢</span>'
             '（仮面様顔貌・小声・小字症・小刻み歩行）</td>'
             '<td><span class="kw4">筋力低下</span></td>'
             '<td><span class="kw4">運動ニューロン疾患・筋疾患</span>'
             '（本例は「筋力低下なし」と明記）</td></tr>'
             '<tr><td><span class="kw3">姿勢反射障害</span>'
             '（前傾前屈姿勢・突進現象・すくみ足・転倒）</td>'
             '<td><span class="kw4">失調性歩行・測定障害</span></td>'
             '<td><span class="kw4">小脳疾患</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">加えて非運動症状も重要</span>——'
             '<span class="kw3">嗅覚低下・便秘・REM睡眠行動障害は'
             '運動症状に数年〜十数年先行しうる</span>。'
             '<span class="kw3">起立性低血圧・排尿障害・うつ・認知機能低下も</span>。</td></tr>'
             '</table>'),
      deep=('💡 Hoehn-Yahr重症度分類——姿勢反射障害が出るⅢ度が境目',
            '<table class="tb"><tr><th>度</th><th>状態</th>'
            '<th>制度上の位置づけ</th></tr>'
            '<tr><td>Ⅰ</td><td><span class="kw">一側性のみ。機能障害はないか軽微</span></td>'
            '<td>—</td></tr>'
            '<tr><td>Ⅱ</td><td><span class="kw">両側性だが姿勢反射障害はない</span></td>'
            '<td>—</td></tr>'
            '<tr><td><span class="kw3">Ⅲ</span></td>'
            '<td><span class="kw3">姿勢反射障害が出現。'
            '日常生活に介助を要することがあるが自立可能</span></td>'
            '<td><span class="kw3">難病医療費助成の対象'
            '（生活機能障害度Ⅱ度以上と併せて）</span></td></tr>'
            '<tr><td>Ⅳ</td><td><span class="kw">起立・歩行など'
            '日常生活の一部に介助が必要</span></td><td>同上</td></tr>'
            '<tr><td>Ⅴ</td><td><span class="kw4">車椅子または'
            '寝たきり。全面的な介助が必要</span></td><td>同上</td></tr>'
            '<tr><td colspan="3"><span class="kw3">Parkinson病は'
            '40〜64歳でも介護保険を使える「特定疾病」の1つ</span>。<br>'
            '<span class="kw3">本例は「室内のトイレ歩行などの日常生活動作は自立」'
            'なのでⅢ度に相当する</span>。</td></tr></table>'
            '<span class="kw3">Ⅲ度が境目になるのは、'
            '姿勢反射障害＝転倒＝骨折・頭部外傷という'
            '生命予後に直結する事象が始まるから</span>である。'
            '<span class="kw4">しかもこの症状はL-dopaで改善しにくい</span>——'
            '<span class="kw3">だから薬を増やすのではなく'
            '環境と訓練で対応する（Q.22）</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">Parkinson病の4徴＝安静時振戦・筋強剛・'
             '無動／寡動・姿勢反射障害</span>。<br>'
             '② <span class="kw3">安静時振戦（4〜6Hz・丸薬まるめ様）</span>'
             '——<span class="kw4">姿勢時振戦は本態性振戦</span>。<br>'
             '③ <span class="kw3">筋強剛（速度非依存・歯車様）</span>'
             '——<span class="kw4">痙縮（速度依存）は錐体路障害</span>。<br>'
             '④ <span class="kw3">姿勢反射障害の出現＝Hoehn-Yahr Ⅲ度</span>'
             '（pull testで確認）。<br>'
             '⑤ <span class="kw">非運動症状（嗅覚低下・便秘・REM睡眠行動障害）は'
             '運動症状に先行しうる</span>。')),

    # ── NO.22 (117F-70) 97% ans=a,b,c ──────────────────────────
    Q('117F-70', 97, [],
      '<span class="kw">次の文を読み、Q.20〜Q.22 の問いに答えよ。</span><br>'
      '76 歳の女性。歩行障害を主訴に来院した。<br>'
      '<b>現病歴：</b><span class="kw">6 年前から左上肢の動かしにくさが出現し、'
      '4 年前から歩くのが遅くなった。4 年前から自宅近くの診療所で'
      'レボドパ〈L-dopa〉を処方され症状は改善した。'
      '1 年前から内服薬の効果が持続しなくなり、歩行困難が進行した。'
      '半年前から、歩行中に足が止まってしまうことがあり、'
      '2 回転倒したため専門外来を受診した。</span><br>'
      '<b>既往歴：</b>脂質異常症でスタチンを内服している。<br>'
      '<b>生活歴：</b>喫煙歴、飲酒歴はない。'
      '<span class="kw">転倒しないようにほとんど外出しない。'
      '室内のトイレ歩行などの日常生活動作は自立している。</span><br>'
      '<b>家族歴：</b>特記すべきことはない。<br>'
      '<b>現　症：</b>意識は清明。身長158cm、体重45kg。体温36.2℃。脈拍64/ 分、整。'
      '血圧110/60mmHg。胸腹部に異常を認めない。'
      '<span class="kw">神経診察では仮面様顔貌、小声および摂食時のむせこみを認める。'
      '四肢筋強剛、動作緩慢を認める。筋力低下、感覚低下は認めない。</span><br>'
      '<b>検査所見：</b>血液・血液生化学所見に特記すべき異常を認めない。<br>'
      '<strong>薬物療法で改善しない症状に対して、'
      '在宅生活を継続するために必要なのはどれか。3つ選べ。</strong>',
      [('a', '嚥下訓練', True,
        '<span class="kw3">◯ 「摂食時のむせこみ」＝嚥下障害があり、'
        'これはL-dopaで改善しにくい症状の代表</span>。'
        '<span class="kw3">Parkinson病患者の直接死因の第1位は誤嚥性肺炎</span>で、'
        '<span class="kw3">嚥下機能の評価（嚥下造影・嚥下内視鏡）と'
        '訓練（間接訓練・直接訓練）、食形態の調整（とろみ）、'
        'food test、口腔ケア</span>が生命予後に直結する。'
        '<span class="kw3">在宅生活の継続という観点でも最優先の項目</span>。'),
       ('b', '住宅改修', True,
        '<span class="kw3">◯ すくみ足と姿勢反射障害による転倒を'
        '環境の側から減らす</span>。'
        '<span class="kw3">手すりの設置・段差の解消・滑りにくい床材・'
        '動線の確保・トイレと浴室の改修</span>が典型で、'
        '<span class="kw3">介護保険の住宅改修費（要支援・要介護の認定があれば'
        '原則20万円まで）が使える</span>。'
        '<span class="kw3">Parkinson病は40〜64歳でも介護保険を使える'
        '特定疾病の1つ</span>で、'
        '<span class="kw3">本例（76歳）は当然対象</span>。'
        '<span class="kw">床の目印（テープ）やメトロノーム音などの'
        '外的手がかり〈cue〉ですくみ足が軽減する</span>のも住環境調整の一部。'),
       ('c', '歩行訓練', True,
        '<span class="kw3">◯ Parkinson病のリハビリテーションの中核</span>。'
        '<span class="kw3">とくに外的手がかりを用いた歩行訓練'
        '（床のライン・メトロノーム・号令に合わせて大きく一歩を出す）は'
        'すくみ足に有効</span>で、'
        '<span class="kw3">大きな動作を意識させるLSVT BIGなどの'
        'プログラムも用いられる</span>。'
        '<span class="kw3">本例は「転倒しないようにほとんど外出しない」＝'
        '廃用が進行する悪循環に入っている</span>——'
        '<span class="kw3">安静ではなく、安全に動く方法を教えるのが正しい</span>。'),
       ('d', '失語症訓練', False,
        '<span class="kw4">Parkinson病の「小声」は失語ではなく'
        '構音・発声の障害（運動低下性構音障害）</span>である。'
        '<span class="kw4">失語は言語の理解・表出そのものの障害</span>で、'
        '<span class="kw4">大脳皮質の言語野の病変（脳血管障害など）で起こる</span>——'
        '<span class="kw4">本例には失語を示唆する所見がない</span>。'
        '<span class="kw">必要なのは失語症訓練ではなく'
        '発声・構音訓練（LSVT LOUDなど）</span>。'),
       ('e', '短下肢装具', False,
        '<span class="kw4">短下肢装具の適応は下垂足・内反尖足</span>——'
        '<span class="kw4">総腓骨神経麻痺や脳卒中後の痙性麻痺</span>である。'
        '<span class="kw4">本例は「筋力低下、感覚低下は認めない」と明記されており、'
        '足関節の背屈は保たれている</span>。'
        '<span class="kw3">Parkinson病の歩行障害は麻痺ではなく'
        'すくみ・小刻み・突進</span>なので、'
        '<span class="kw4">足関節を固定しても改善せず、'
        'むしろ動きを制限して転倒を招きうる</span>。')],
      '薬で取れない症状（嚥下・すくみ・転倒）は訓練と環境で支える。失語も麻痺もない。',
      patho=('🔎 「薬物療法で改善しない症状」を数え上げる',
             '<span class="kw3">この設問は'
             '「L-dopaが効く症状／効かない症状」を'
             '分けられるかを問うている</span>。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">薬物療法で改善する</span></th>'
             '<th><span class="kw3">薬物療法で改善しにくい</span></th></tr>'
             '<tr><td>症　状</td>'
             '<td><span class="kw3">無動・動作緩慢・筋強剛・'
             '安静時振戦</span></td>'
             '<td><span class="kw3">姿勢反射障害・すくみ足・'
             '嚥下障害・構音障害・自律神経症状・認知機能低下</span></td></tr>'
             '<tr><td>機　序</td>'
             '<td><span class="kw3">黒質線条体ドパミン系の障害</span></td>'
             '<td><span class="kw3">ドパミン以外の系'
             '（コリン・ノルアドレナリン・セロトニン）や'
             '皮質・脳幹の広範な変性</span></td></tr>'
             '<tr><td>対　応</td>'
             '<td><span class="kw">L-dopa・ドパミンアゴニスト・'
             'MAO-B阻害薬・COMT阻害薬</span>'
             '（進行例ではデバイス補助療法）</td>'
             '<td><span class="kw3">リハビリテーション'
             '（歩行訓練・嚥下訓練・発声訓練）＋'
             '環境調整（住宅改修・福祉用具）＋介護サービス</span></td></tr>'
             '<tr><td>本例で該当</td>'
             '<td>すでにL-dopaで治療中（wearing offあり）</td>'
             '<td><span class="kw3">すくみ足・転倒（→b・c）、'
             'むせこみ（→a）</span></td></tr></table>'
             '<span class="kw3">設問文が「薬物療法で改善しない症状に対して」と'
             '限定しているのは、'
             '答えを右列に絞らせるため</span>である。'),
      deep=('💡 在宅生活を支える3本柱——医療・リハ・制度',
            '<span class="kw3">「在宅生活を継続するために必要なもの」は'
            '医学的介入だけではない</span>。'
            '<table class="tb"><tr><th>柱</th><th>内容</th>'
            '<th>本例での具体</th></tr>'
            '<tr><td><span class="kw3">医　療</span></td>'
            '<td>薬物調整（wearing offへの対応）・'
            '合併症の管理</td>'
            '<td><span class="kw">L-dopaの分割投与、'
            'ドパミンアゴニスト／MAO-B阻害薬／COMT阻害薬の追加</span></td></tr>'
            '<tr><td><span class="kw3">リハビリテーション</span></td>'
            '<td><span class="kw3">歩行訓練・嚥下訓練・発声訓練・'
            '筋力／柔軟性の維持</span></td>'
            '<td><span class="kw3">外的手がかりを用いた歩行訓練、'
            '嚥下機能評価と食形態の調整、LSVT</span></td></tr>'
            '<tr><td><span class="kw3">制度・環境</span></td>'
            '<td><span class="kw3">介護保険（40〜64歳でも'
            'Parkinson病は特定疾病）・'
            '難病医療費助成（Hoehn-Yahr Ⅲ度以上）・'
            '身体障害者手帳</span></td>'
            '<td><span class="kw3">住宅改修（手すり・段差解消）、'
            '福祉用具貸与、訪問リハ、通所リハ、'
            'ケアマネジャーによる計画</span></td></tr>'
            '<tr><td colspan="3"><span class="kw4">⚠️ 「転倒しないように'
            'ほとんど外出しない」は改善すべき状態であって'
            '望ましい対処ではない</span>——'
            '<span class="kw3">閉じこもりは廃用・筋力低下・'
            '意欲低下・さらなる転倒という悪循環を作る</span>。<br>'
            '<span class="kw3">整形外科ch06（ロコモ・フレイル）の'
            '「高齢者に<u>動かさない</u>指導をしたら、その肢は誤り」と'
            '同じ原則がここでも効く</span>。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">L-dopaで改善しにくい症状＝姿勢反射障害・'
             'すくみ足・嚥下障害・構音障害・自律神経症状</span>。<br>'
             '② <span class="kw3">Parkinson病の直接死因の第1位は誤嚥性肺炎</span>'
             '——嚥下訓練と口腔ケアが予後を左右する。<br>'
             '③ <span class="kw3">すくみ足には外的手がかり（床のライン・'
             'メトロノーム・号令）を用いた歩行訓練</span>。<br>'
             '④ <span class="kw3">Parkinson病は40〜64歳でも介護保険を使える'
             '特定疾病</span>。'
             '<span class="kw">住宅改修・福祉用具・訪問リハが使える</span>。<br>'
             '⑤ <span class="kw4">閉じこもり（外出しない）は是正すべき状態</span>。')),

    # ── NO.23 (112B-5) 必修 98% ans=d ──────────────────────────
    Q('112B-5', 98, [('bh', '必修')],
      '<strong>造影CT を施行するにあたり事前に確認すべきこととして'
      '最も重要なのはどれか。</strong>',
      [('a', '喫煙歴', False,
        '<span class="kw4">喫煙歴は肺癌のリスク評価や'
        '術前評価には重要だが、造影剤の安全性とは無関係</span>。'),
       ('b', '飲酒歴', False,
        '<span class="kw4">飲酒歴も造影剤の禁忌には関係しない</span>。'
        '<span class="kw">肝疾患・膵疾患のリスク評価には必要だが、'
        '「造影CTを施行するにあたり」の確認事項ではない</span>。'),
       ('c', '肝機能', False,
        '<span class="kw4">ヨード造影剤はほぼ全量が腎から排泄され、'
        '肝での代謝を受けない</span>。'
        '<span class="kw4">したがって肝機能は造影剤の安全性に直結しない</span>。'
        '<span class="kw3">「排泄経路がどこか」を考えれば'
        '確認すべき臓器が決まる</span>——'
        '<span class="kw3">ヨード造影剤もガドリニウム造影剤も腎排泄</span>。'),
       ('d', '腎機能', True,
        '<span class="kw3">◯ ヨード造影剤を使う前に最も重要な確認事項は腎機能</span>。'
        '<span class="kw3">理由は2つ</span>——'
        '<span class="kw3">①造影剤腎症（contrast-induced nephropathy）の予防</span>'
        '（<span class="kw">腎髄質の血管収縮による虚血と、'
        '尿細管への直接毒性。投与後48〜72時間で血清Crが上昇する</span>）、'
        '<span class="kw3">②腎機能低下例では排泄が遅れて'
        '副作用が遷延する</span>。'
        '<span class="kw3">eGFRを確認し、低下例では'
        '検査の必要性を再検討したうえで、'
        '生理食塩液による輸液（水分負荷）・造影剤量の減量・'
        '腎毒性薬の中止といった対策をとる</span>。'
        '<span class="kw3">またビグアナイド系薬（メトホルミン）内服中の患者では'
        '乳酸アシドーシスを避けるため検査前後で休薬する</span>——'
        '<span class="kw3">これも腎機能に関わる確認である</span>。'),
       ('e', '認知機能', False,
        '<span class="kw4">認知機能は同意取得や検査中の協力（安静保持）に'
        '関わるが、造影剤そのものの安全性の問題ではない</span>。'
        '<span class="kw">むしろ体動アーチファクトの観点で'
        'CT撮影の質に影響する（NO.2参照）</span>。')],
      'ヨード造影剤もガドリニウム造影剤も腎排泄。まず腎機能を確認する。',
      patho=('🔎 造影剤を使う前の確認事項——「腎・喘息・既往」の3点',
             '<span class="kw3">造影剤の設問は、'
             '確認すべき3項目を持っていればほぼ解ける</span>。' + TBL_CONTRAST),
      deep=('💡 造影剤腎症——「起こる人」と「予防のしかた」',
            '<span class="kw3">造影剤腎症は'
            '「造影剤投与後72時間以内に血清Crが'
            '前値より0.5mg/dL以上または25%以上上昇したもの」</span>と定義される。'
            '<table class="tb"><tr><th></th><th>内容</th></tr>'
            '<tr><td><span class="kw3">リスク因子</span></td>'
            '<td><span class="kw3">慢性腎臓病（eGFR低下）が最大</span>。'
            'ほかに<span class="kw">糖尿病性腎症・脱水・高齢・心不全・'
            '腎毒性薬（NSAID・アミノグリコシド・利尿薬）の併用・'
            '造影剤の大量／反復投与</span></td></tr>'
            '<tr><td><span class="kw3">経　過</span></td>'
            '<td><span class="kw3">投与後24〜48時間でCrが上昇し、'
            '3〜5日でピーク、1〜2週で回復するのが典型</span>。'
            '<span class="kw3">多くは非乏尿性で無症候</span></td></tr>'
            '<tr><td><span class="kw3">予　防</span></td>'
            '<td><span class="kw3">①適応の再検討（本当に造影が要るか、'
            'MRIや超音波で代替できないか）'
            '②生理食塩液による輸液（検査前後）'
            '③造影剤量を最小に ④腎毒性薬の中止 '
            '⑤短期間での反復投与を避ける</span></td></tr>'
            '<tr><td><span class="kw">ビグアナイド薬</span></td>'
            '<td><span class="kw">腎機能低下で蓄積し'
            '乳酸アシドーシスを起こしうるため、'
            '造影剤投与時は検査前後で休薬する</span></td></tr>'
            '<tr><td><span class="kw4">発症したら</span></td>'
            '<td><span class="kw3">経時的な腎機能評価と補液</span>。'
            '<span class="kw4">多くは可逆的なので、'
            'いきなり透析やシャント造設に走らない</span>（NO.24）</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">造影CTの前に最も重要な確認事項は腎機能</span>。<br>'
             '② <span class="kw3">ヨード造影剤もガドリニウム造影剤も腎排泄</span>'
             '——だから肝機能ではなく腎機能。<br>'
             '③ <span class="kw3">確認3点セット＝腎機能・気管支喘息・'
             '造影剤副作用の既往</span>。<br>'
             '④ <span class="kw">ヨード特有の禁忌＝甲状腺機能亢進症・'
             '多発性骨髄腫／マクログロブリン血症・褐色細胞腫</span>。<br>'
             '⑤ <span class="kw">ビグアナイド薬は検査前後で休薬（乳酸アシドーシス）</span>。')),

    # ── NO.24 (112A-39) 93% ans=b ──────────────────────────────
    Q('112A-39', 93, [],
      '56 歳の男性。肝臓の腫瘤性病変の精査のため入院中である。'
      'C 型肝炎の経過観察中に行った腹部超音波検査で肝臓に腫瘤性病変が見つかったため入院した。'
      '<span class="kw">入院後に腹部造影CT を施行したところ、入院時1.1mg/dL であった'
      '血清クレアチニン値が造影検査後2 日目に3.0mg/dL に上昇した。</span>'
      '<span class="kw">入院後に新たな薬剤投与はなく、食事は毎日全量摂取できており、'
      '体重は安定していた。体温、脈拍、血圧、呼吸数ともに正常範囲で、'
      '排尿回数も5、6 回/ 日で変わらなかった。</span><br>'
      '造影検査後2 日目の検査所見：尿所見：蛋白（－）、糖（－）、潜血（－）、'
      '沈渣に赤血球1 ～4/1 視野、白血球1 ～4/1 視野。'
      '血液所見：赤血球302 万、Hb 10.4g/dL、Ht 31％、白血球4,600、血小板16 万。'
      '血液生化学所見：総ビリルビン1.4mg/dL、直接ビリルビン0.8mg/dL、'
      'AST 45U/L、ALT 62U/L、LD 360U/L（基準176 ～353）、ALP 380U/L（基準115 ～359）、'
      'γ-GTP 110U/L（基準8 ～50）、尿素窒素43mg/dL、クレアチニン3.0mg/dL、'
      '尿酸8.8mg/dL、Na 136mEq/L、K 5.2mEq/L、Cl 100mEq/L、Ca 8.2mg/dL、P 6.2mg/dL。'
      'CRP 0.3mg/dL。<span class="kw">腹部超音波検査では両腎に水腎症を認めない。</span><br>'
      '<strong>対応として正しいのはどれか。</strong>',
      [('a', '緊急血液透析', False,
        '<span class="kw4">緊急透析の適応（AIUEO）は'
        'Acidosis（重度アシドーシス）・Intoxication（中毒）・'
        'Uremia（尿毒症症状）・Electrolyte（高K血症）・'
        'Overload（体液過剰・肺水腫）</span>。'
        '<span class="kw4">本例はK 5.2mEq/Lと軽度上昇にとどまり、'
        '尿毒症症状も溢水も無く、尿量も保たれている</span>。'
        '<span class="kw4">Crが3.0というだけで透析を始めるのは過剰</span>。'),
       ('b', '経時的な腎機能評価', True,
        '<span class="kw3">◯ 造影剤腎症は多くが可逆的で、'
        '経過をみるうちに回復する</span>。'
        '<span class="kw3">典型的な経過は「投与後24〜48時間でCrが上昇し、'
        '3〜5日でピーク、1〜2週で前値に戻る」</span>で、'
        '<span class="kw3">本例（造影後2日目）はまさに上昇途中</span>。'
        '<span class="kw3">やるべきことは①十分な輸液で腎血流を保つ '
        '②腎毒性薬を避ける ③電解質と尿量を監視しながら'
        '経時的にCrを追う</span>ことである。'
        '<span class="kw3">「多くは自然に回復する」という自然経過を知っていれば、'
        '侵襲的な介入に走らずに済む</span>。'),
       ('c', '尿道カテーテル留置', False,
        '<span class="kw4">尿道カテーテルは尿路の閉塞（腎後性）を'
        '解除する処置</span>だが、'
        '<span class="kw4">本例は「排尿回数も5、6回/日で変わらなかった」'
        '「両腎に水腎症を認めない」と、'
        '腎後性を明確に否定している</span>。'
        '<span class="kw">尿量の正確な測定を目的に留置することはあるが、'
        '「対応として正しい」ものではなく、'
        '尿路感染のリスクを増やす</span>。'),
       ('d', '腹部造影CT の再施行', False,
        '<span class="kw4">造影剤腎症を起こした直後に'
        '同じ造影剤を再投与するのは禁忌に近い</span>。'
        '<span class="kw4">短期間での反復投与は造影剤腎症の'
        '明確なリスク因子</span>である。'
        '<span class="kw3">肝腫瘤の精査を続ける必要があるなら、'
        '造影超音波やEOB造影MRI（腎機能を見て）、'
        '腎機能回復後の再検を検討する</span>。'),
       ('e', '動静脈シャント造設術の準備', False,
        '<span class="kw4">シャント造設は慢性腎不全で'
        '維持透析導入が見込まれる患者に行う準備</span>。'
        '<span class="kw4">本例は入院時Cr 1.1mg/dLと'
        'ほぼ正常だった患者の急性かつ可逆性の変化</span>であり、'
        '<span class="kw4">維持透析を前提とした準備はまったく不要</span>。')],
      '造影剤腎症は多くが可逆的。輸液しながら経時的にCrを追うのが正しい。',
      patho=('🔎 急性腎障害を見たら——腎前性・腎性・腎後性を切り分ける',
             '<span class="kw3">Crが上がったら、'
             'まず3つのどれかを決める</span>。'
             '<span class="kw3">本例は「造影剤投与」という'
             '明確な曝露があり、腎後性（水腎症なし）と'
             '腎前性（脱水なし・体重安定・食事全量・バイタル正常）が'
             '丁寧に否定されている</span>。'
             '<table class="tb"><tr><th></th><th>腎前性</th>'
             '<th><span class="kw3">腎性（本例）</span></th><th>腎後性</th></tr>'
             '<tr><td>原　因</td>'
             '<td><span class="kw">脱水・出血・心不全・敗血症</span></td>'
             '<td><span class="kw3">造影剤腎症・急性尿細管壊死・'
             '薬剤性間質性腎炎・糸球体腎炎</span></td>'
             '<td><span class="kw">尿路閉塞</span></td></tr>'
             '<tr><td>本例での所見</td>'
             '<td><span class="kw4">体重安定・食事全量・'
             'バイタル正常＝否定的</span></td>'
             '<td><span class="kw3">造影剤の曝露あり・'
             '時期が合致（2日目）</span></td>'
             '<td><span class="kw4">水腎症なし・尿量保持＝否定的</span></td></tr>'
             '<tr><td>尿所見</td>'
             '<td>濃縮尿・Na排泄低下</td>'
             '<td><span class="kw3">造影剤腎症では'
             '尿所見に乏しいことが多い（本例も蛋白・潜血陰性）</span></td>'
             '<td>—</td></tr>'
             '<tr><td>対　応</td>'
             '<td><span class="kw">細胞外液の補充</span></td>'
             '<td><span class="kw3">原因の除去＋支持療法＋経過観察</span></td>'
             '<td><span class="kw">閉塞の解除</span></td></tr></table>'
             '<span class="kw3">なお薬剤性間質性腎炎（好酸球増多・'
             '好酸球尿・発疹・発熱を伴う）は'
             '「入院後に新たな薬剤投与はなく」の一文で否定されている</span>。'),
      deep=('💡 「介入しない」が正解になる設問の型',
            '<span class="kw3">国試には'
            '「何もしない（経過をみる）」が正解になる問題が'
            '一定数ある</span>。'
            '<span class="kw3">見分ける手がかりは共通している</span>。'
            '<table class="tb"><tr><th>手がかり</th><th>本例での該当</th></tr>'
            '<tr><td><span class="kw3">病態が自然に回復するものと'
            '分かっている</span></td>'
            '<td><span class="kw3">造影剤腎症は1〜2週で回復するのが典型</span></td></tr>'
            '<tr><td><span class="kw3">緊急介入の適応基準を'
            '満たしていない</span></td>'
            '<td><span class="kw3">透析の適応（高K・アシドーシス・'
            '溢水・尿毒症）をどれも満たさない</span></td></tr>'
            '<tr><td><span class="kw3">症例文が「危険な所見が無いこと」を'
            'わざわざ列挙している</span></td>'
            '<td><span class="kw3">「体温、脈拍、血圧、呼吸数ともに正常範囲」'
            '「排尿回数も変わらなかった」'
            '「水腎症を認めない」</span></td></tr>'
            '<tr><td><span class="kw4">他の肢がすべて侵襲的・不可逆的</span></td>'
            '<td><span class="kw4">緊急透析・カテーテル留置・'
            '造影剤の再投与・シャント造設</span></td></tr></table>'
            '<span class="kw3">同じ型は第4章 NO.57（無症候性の放射線肺炎は'
            '経過観察）にも出てくる</span>——'
            '<span class="kw3">「画像や検査値が動いた」ことと'
            '「治療が要る」ことは別</span>である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">造影剤腎症は投与後24〜48時間で上昇、'
             '3〜5日でピーク、1〜2週で回復するのが典型（可逆的）</span>。<br>'
             '② <span class="kw3">対応は輸液と経時的な腎機能評価</span>。<br>'
             '③ <span class="kw4">緊急透析の適応＝高K血症・重度アシドーシス・'
             '溢水・尿毒症症状・中毒</span>——Crの値だけでは決めない。<br>'
             '④ <span class="kw4">造影剤腎症の直後に造影剤を再投与しない</span>。<br>'
             '⑤ <span class="kw">急性腎障害はまず腎前性・腎性・腎後性を切り分ける</span>。')),

    # ── NO.25 (101B-92) 83% ans=b,c ────────────────────────────
    Q('101B-92', 83, [],
      '<strong>画像検査でヨード造影剤が用いられるのはどれか。2つ選べ。</strong>',
      [('a', '超音波検査', False,
        '<span class="kw4">超音波の造影剤はマイクロバブル'
        '（微小気泡）製剤</span>で、'
        '<span class="kw4">ヨードもガドリニウムも使わない</span>。'
        '<span class="kw">音響インピーダンスの差を人工的に作って'
        '血流を強調する</span>もので、'
        '<span class="kw3">腎機能障害があっても使えるのが利点</span>'
        '（<span class="kw">肝腫瘤の鑑別などに用いる</span>）。'),
       ('b', '血管造影', True,
        '<span class="kw3">◯ 血管造影は水溶性ヨード造影剤を'
        '動脈内に直接注入して血管の内腔を描出する検査</span>。'
        '<span class="kw3">ヨードは原子番号53と大きく'
        'エックス線をよく吸収するので、'
        '血管が白く浮かび上がる</span>。'
        '<span class="kw">冠動脈造影・脳血管造影・下肢動脈造影など'
        'すべて同じ原理</span>で、'
        '<span class="kw">そのままIVR（塞栓術・拡張術）へ移行できる</span>。'),
       ('c', 'CT', True,
        '<span class="kw3">◯ 造影CTで用いるのも水溶性ヨード造影剤</span>。'
        '<span class="kw3">静脈から注入し、'
        '血流に乗って全身へ行き渡ったところを撮影する</span>。'
        '<span class="kw3">造影のねらいは①血管を描出する '
        '②臓器・病変の血流の違い（造影パターン）を見る '
        '③正常構造と病変のコントラストを付ける</span>ことである。'
        '<span class="kw">肝細胞癌の「動脈相で濃染し門脈相で洗い出される」'
        'という所見も、造影のタイミングを変えて撮る'
        'ダイナミックCTで初めて見える</span>。'),
       ('d', 'MRI', False,
        '<span class="kw4">MRIの造影剤はガドリニウム製剤</span>'
        '（<span class="kw">ほかに肝特異性のEOB・鉄含有製剤・'
        '消化管用の経口製剤</span>）。'
        '<span class="kw4">ヨードは使わない</span>。'
        '<span class="kw3">MRIはエックス線の吸収差ではなく'
        '緩和時間の差で像を作るので、'
        '「エックス線をよく吸収する物質」は造影剤にならない</span>——'
        '<span class="kw3">ガドリニウムは常磁性体で'
        '周囲の水素原子のT<sub>1</sub>緩和時間を短縮させる</span>。'),
       ('e', 'SPECT', False,
        '<span class="kw4">SPECTは核医学検査で、'
        '用いるのは造影剤ではなく放射性医薬品（放射性同位元素で標識した薬剤）</span>。'
        '<span class="kw">体内から放出されるγ線を検出して像を作る</span>ので、'
        '<span class="kw4">外からエックス線を当てるわけではない</span>。'
        '<span class="kw">用いる核種は<sup>99m</sup>Tc・<sup>123</sup>I など</span>。')],
      'ヨード造影剤はエックス線を使う検査（CT・血管造影・消化管／尿路造影）。',
      patho=('🔎 造影剤は「その装置が何で像を作るか」に合わせて選ばれる',
             '<span class="kw3">造影剤の種類は、'
             '装置の原理から必然的に決まる</span>。'
             '<table class="tb"><tr><th>検査</th><th>像を作る原理</th>'
             '<th>造影剤</th><th>なぜそれか</th></tr>'
             '<tr><td><span class="kw3">単純エックス線・CT・'
             '血管造影・透視</span></td>'
             '<td><span class="kw3">エックス線の吸収差</span></td>'
             '<td><span class="kw3">ヨード造影剤・硫酸バリウム</span></td>'
             '<td><span class="kw3">原子番号が大きく'
             'エックス線をよく吸収する</span>'
             '（ヨード53・バリウム56）</td></tr>'
             '<tr><td><span class="kw3">MRI</span></td>'
             '<td><span class="kw3">水素原子の緩和時間の差</span></td>'
             '<td><span class="kw3">ガドリニウム製剤</span>'
             '（ほかにEOB・鉄含有）</td>'
             '<td><span class="kw3">常磁性体で周囲の'
             'T<sub>1</sub>緩和時間を短縮させる</span></td></tr>'
             '<tr><td><span class="kw3">超音波</span></td>'
             '<td><span class="kw3">音響インピーダンスの差</span></td>'
             '<td><span class="kw3">マイクロバブル</span></td>'
             '<td><span class="kw3">気泡が強く反射する。'
             '腎機能障害でも使える</span></td></tr>'
             '<tr><td><span class="kw3">核医学（SPECT・PET）</span></td>'
             '<td><span class="kw3">体内から出る放射線の検出</span></td>'
             '<td><span class="kw4">造影剤ではなく放射性医薬品</span></td>'
             '<td><span class="kw3">薬剤自体が線源になる</span></td></tr></table>'
             + TBL_CONTRAST),
      deep=('💡 ヨード造影剤の使われ方——「血管に入れるか、管腔に入れるか」',
            '<table class="tb"><tr><th>投与経路</th><th>製剤</th>'
            '<th>検査</th></tr>'
            '<tr><td><span class="kw3">静脈内</span></td>'
            '<td><span class="kw">水溶性非イオン性ヨード造影剤</span></td>'
            '<td><span class="kw3">造影CT・静脈性尿路造影〈IVU〉</span></td></tr>'
            '<tr><td><span class="kw3">動脈内</span></td>'
            '<td><span class="kw">水溶性非イオン性ヨード造影剤</span></td>'
            '<td><span class="kw3">血管造影・IVR</span></td></tr>'
            '<tr><td><span class="kw">くも膜下腔</span></td>'
            '<td><span class="kw">水溶性非イオン性ヨード造影剤</span></td>'
            '<td><span class="kw">脊髄造影〈ミエログラフィ〉</span></td></tr>'
            '<tr><td><span class="kw">消化管内</span></td>'
            '<td><span class="kw">硫酸バリウム</span>'
            '（<span class="kw4">穿孔・誤嚥のおそれがあれば'
            'ガストログラフィン</span>）</td>'
            '<td><span class="kw">上部・下部消化管造影</span></td></tr>'
            '<tr><td><span class="kw">子宮腔・リンパ管</span></td>'
            '<td><span class="kw">油性ヨード造影剤（リピオドール）</span></td>'
            '<td><span class="kw">子宮卵管造影・リンパ管造影</span>。'
            '<span class="kw">TACEの塞栓物質としても使う</span></td></tr>'
            '<tr><td colspan="3"><span class="kw4">⚠️ バリウムの禁忌は消化管穿孔'
            '（腹腔内に残って腹膜炎を起こす）</span>、'
            '<span class="kw4">ガストログラフィンの禁忌は誤嚥'
            '（高浸透圧で重症肺炎をきたす）</span>——'
            '<span class="kw3">「穿孔ならガストログラフィン、'
            '誤嚥のおそれならバリウム」と覚えると取り違えない</span>。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">ヨード造影剤＝エックス線を使う検査'
             '（CT・血管造影・消化管造影・尿路造影・脊髄造影）</span>。<br>'
             '② <span class="kw3">MRI＝ガドリニウム／超音波＝マイクロバブル／'
             '核医学＝放射性医薬品（造影剤ではない）</span>。<br>'
             '③ <span class="kw">造影剤がエックス線で効くのは'
             '原子番号が大きいから（ヨード53・バリウム56）</span>。<br>'
             '④ <span class="kw4">バリウムの禁忌＝消化管穿孔／'
             'ガストログラフィンの禁忌＝誤嚥</span>。<br>'
             '⑤ <span class="kw">マイクロバブルは腎機能障害があっても使える</span>。')),

    # ── NO.26 (111E-34) CBT 76% ans=b,e ────────────────────────
    Q('111E-34', 76, [('bc', 'CBT')],
      '腹部超音波検査で肝腫瘤を指摘された患者に対して、'
      '<span class="kw">腹部ガドリニウム造影MRI</span>を行うこととなった。<br>'
      '<strong>検査前に確認すべきなのはどれか。2つ選べ。</strong>',
      [('a', '腹　水', False,
        '<span class="kw4">腹水の有無はガドリニウム造影剤の'
        '安全性とは無関係</span>。'
        '<span class="kw">大量腹水があると仰臥位が保てず'
        '検査が困難になることはあるが、'
        '「検査前に確認すべき」項目として問われているのは'
        '造影剤の禁忌</span>である。'),
       ('b', '腎機能', True,
        '<span class="kw3">◯ ガドリニウム造影剤は腎から排泄されるため、'
        '重度の腎機能低下があると体内に長く留まり、'
        '腎性全身性線維症〈NSF〉を起こしうる</span>。'
        '<span class="kw3">NSFは皮膚・皮下組織から始まり'
        '関節拘縮・内臓の線維化に至る不可逆的な病態で、'
        '有効な治療法がない</span>。'
        '<span class="kw3">eGFRが30mL/分/1.73m<sup>2</sup>未満、'
        '急性腎障害、透析中の患者では原則使用しない</span>。'
        '<span class="kw3">「ヨードでもガドリニウムでも、まず腎機能」</span>。'),
       ('c', '肝機能', False,
        '<span class="kw4">通常のガドリニウム造影剤は肝で代謝されないので、'
        '肝機能は安全性に直結しない</span>。'
        '<span class="kw">ただし肝細胞特異性造影剤（Gd-EOB-DTPA）は'
        '一部が肝細胞に取り込まれて胆汁排泄されるため、'
        '高度の肝機能障害では肝細胞相の造影効果が落ちる</span>——'
        '<span class="kw4">これは「安全性」ではなく「画質」の問題</span>で、'
        '<span class="kw4">禁忌の確認事項ではない</span>。'),
       ('d', '抗血小板薬の内服', False,
        '<span class="kw4">抗血小板薬は出血を伴う手技'
        '（生検・穿刺・手術）で確認すべき事項</span>で、'
        '<span class="kw4">経静脈的な造影MRIとは関係しない</span>。'
        '<span class="kw">末梢静脈路の確保程度で問題になることはない</span>。'),
       ('e', '気管支喘息の既往', True,
        '<span class="kw3">◯ 気管支喘息はヨード造影剤・'
        'ガドリニウム造影剤いずれにおいても'
        'アナフィラキシー様反応のリスク因子</span>である。'
        '<span class="kw3">気道の過敏性が背景にあり、'
        '造影剤による気管支攣縮が重症化しやすい</span>。'
        '<span class="kw3">ガドリニウムの副作用頻度はヨードより低いが、'
        '起こったときの重症度は同等</span>なので、'
        '<span class="kw3">喘息の既往・コントロール状況（活動性）を必ず確認する</span>。'
        '<span class="kw">造影剤副作用の既往があればさらに厳格で、'
        '原則として同系統の造影剤は使わない</span>。')],
      'ガドリニウムでも確認は腎機能と喘息（＋副作用歴）。肝機能・抗血小板薬は無関係。',
      patho=('🔎 造影剤の確認3点セット——ヨードでもガドリニウムでも同じ',
             '<span class="kw3">NO.4・NO.6・NO.23・NO.26 と、'
             '本章には「造影の前に何を確認するか」の設問が4問ある</span>。'
             '<span class="kw3">答えの骨格は共通で、'
             '3つの確認事項＋造影剤ごとの追加項目</span>という構造である。'
             '<table class="tb"><tr><th>確認事項</th>'
             '<th>ヨード造影剤</th><th>ガドリニウム造影剤</th>'
             '<th>何が起こるか</th></tr>'
             '<tr><td><span class="kw3">① 腎機能</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">ヨード＝造影剤腎症（可逆的）／'
             'Gd＝腎性全身性線維症（不可逆）</span></td></tr>'
             '<tr><td><span class="kw3">② 気管支喘息</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">アナフィラキシー様反応・気管支攣縮</span></td></tr>'
             '<tr><td><span class="kw3">③ 造影剤副作用の既往</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">◯</span></td>'
             '<td><span class="kw3">再投与でより重篤化しうる</span></td></tr>'
             '<tr><td>④ 甲状腺機能亢進症</td>'
             '<td><span class="kw">◯</span></td><td>—</td>'
             '<td><span class="kw">ヨードによる甲状腺クリーゼ</span></td></tr>'
             '<tr><td>⑤ 多発性骨髄腫・'
             'マクログロブリン血症・褐色細胞腫</td>'
             '<td><span class="kw">◯</span></td><td>—</td>'
             '<td><span class="kw">腎障害の悪化・カテコラミンクリーゼ</span></td></tr>'
             '<tr><td>⑥ ビグアナイド薬の内服</td>'
             '<td><span class="kw">◯</span></td><td>—</td>'
             '<td><span class="kw">乳酸アシドーシス（検査前後で休薬）</span></td></tr>'
             '<tr><td><span class="kw3">⑦ 体内金属・'
             'ペースメーカの機種</span></td>'
             '<td>—</td><td><span class="kw3">◯（MRI共通）</span></td>'
             '<td><span class="kw3">吸引・発熱・誤作動</span></td></tr>'
             '<tr><td>⑧ 妊娠</td>'
             '<td><span class="kw">◯（被ばく）</span></td>'
             '<td><span class="kw">◯（原則Gdは使わない）</span></td>'
             '<td>—</td></tr></table>'),
      deep=('💡 肝腫瘤を「どの検査でどう詰めるか」',
            '<span class="kw3">本例は超音波で肝腫瘤を指摘され、'
            '造影MRIへ進む場面である</span>。'
            '<span class="kw3">肝腫瘤の診断は'
            '「血流のパターンを時間で追う」ことで進む</span>。'
            '<table class="tb"><tr><th>検査</th><th>役割</th></tr>'
            '<tr><td><span class="kw3">腹部超音波</span></td>'
            '<td><span class="kw3">スクリーニング</span>——'
            '被ばくなし・安価・繰り返せる。'
            '<span class="kw">囊胞（無エコー＋後方エコー増強）と'
            '充実性腫瘤の区別</span></td></tr>'
            '<tr><td><span class="kw3">ダイナミック造影CT</span></td>'
            '<td><span class="kw3">動脈相・門脈相・平衡相を撮って'
            '血流パターンを見る</span>——'
            '<span class="kw3">肝細胞癌は「動脈相で濃染し、'
            '門脈相〜平衡相で洗い出される〈washout〉」</span></td></tr>'
            '<tr><td><span class="kw3">EOB造影MRI</span></td>'
            '<td><span class="kw3">上記に加えて肝細胞相'
            '（投与20分後）が撮れる</span>——'
            '<span class="kw3">Gd-EOB-DTPAは正常肝細胞に取り込まれるので、'
            '取り込まない病変が黒く抜けて見える'
            '＝小さな肝細胞癌の検出に優れる</span></td></tr>'
            '<tr><td><span class="kw">造影超音波（マイクロバブル）</span></td>'
            '<td><span class="kw">腎機能障害でも使える血流評価</span></td></tr>'
            '<tr><td><span class="kw">血管造影・CTAP／CTHA</span></td>'
            '<td><span class="kw">TACEなどの治療とセットで</span></td></tr></table>'
            '<span class="kw3">MRIが選ばれるのは、'
            '被ばくがなく、軟部組織のコントラストに優れ、'
            'EOBという肝細胞特異性造影剤が使えるから</span>——'
            '<span class="kw3">C型肝炎の経過観察のように'
            '繰り返し検査する患者では被ばくの少なさが効いてくる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">ガドリニウム造影MRIの前に確認するのは'
             '腎機能と気管支喘息（＋造影剤副作用の既往）</span>。<br>'
             '② <span class="kw3">ガドリニウム＋重度腎機能低下＝'
             '腎性全身性線維症〈NSF〉（不可逆・治療法なし）</span>。<br>'
             '③ <span class="kw4">肝機能・抗血小板薬・腹水は'
             '造影剤の禁忌とは無関係</span>。<br>'
             '④ <span class="kw">MRIそのものの禁忌（体内金属・'
             'ペースメーカ）も別途確認する</span>。<br>'
             '⑤ <span class="kw">肝細胞癌＝ダイナミック造影で'
             '「動脈相で濃染し門脈相でwashout」</span>。')),

]


# ------------------------------------------------------------------
# 連問 NO.27〜29（114C-69/70/71）の共通ステム。
# ⚠️ 試験モードはカードを1枚ずつ独立に出すので、3問すべての qt に連結すること。
# ------------------------------------------------------------------
_STEM_27 = (
    '<span class="kw">次の文を読み、Q.27〜Q.29 の問いに答えよ。</span><br>'
    '66 歳の男性。胸背部痛と左上下肢の筋力低下のため救急車で搬入された。<br>'
    '<b>現病歴：</b><span class="kw">本日午前11 時、デスクワーク中に'
    '本棚上段から書類を取ろうと手を伸ばしたところ、'
    '激烈な胸背部痛が突然出現した。その後すぐに左片麻痺が出現し、'
    'さらに重苦しい胸痛と冷汗が出現した</span>ため、'
    '発症から30 分後に救急車を要請した。<br>'
    '<b>既往歴：</b><span class="kw">2 年前から高血圧症で通院治療中。</span><br>'
    '<b>生活歴：</b>妻と2 人暮らし。喫煙歴はない。飲酒は機会飲酒。<br>'
    '<b>家族歴：</b>父親は脳出血のため86 歳で死亡。母は胃癌のため88 歳で死亡。<br>'
    '<b>現　症：</b>意識は清明。身長162cm、体重80kg。'
    '<span class="kw">血圧78/62mmHg で明らかな左右差を認めない。'
    '脈拍108/ 分（微弱）、整。</span>呼吸数18/ 分。SpO<sub>2</sub> 99％（room air）。'
    '<span class="kw">頸静脈の怒張を認める。</span>眼瞼結膜に貧血を認めない。'
    '<span class="kw">心音はⅠ音Ⅱ音とも減弱しており、'
    '胸骨左縁第3 肋間を最強とするⅡ/Ⅵの拡張期灌水様雑音を認める。</span>'
    '呼吸音に異常を認めない。腹部は平坦、軟で、肝・脾を触知しない。'
    '<span class="kw">左上下肢に不全片麻痺を認め、Babinski 徴候は陽性である。</span><br>'
    '<b>検査所見：</b><span class="kw">心電図は、心拍数108/ 分の洞調律で、'
    '肢誘導および胸部誘導ともに低電位で、Ⅱ、Ⅲ、aV<sub>F</sub> にST 上昇を認めた。</span><br>'
    '<span class="kw">ポータブル撮影機による仰臥位の胸部エックス線写真（A）及び'
    '6 か月前に撮影された立位の胸部エックス線写真（B）</span>を示す。'
    '胸部エックス線写真を見比べながら、研修医が指導医に所見や解釈を報告した。<br>')

QUESTIONS += [

    # ── NO.27 (114C-69) 20% ans=d ← 本科目の最難 ────────────────
    Q('114C-69', 20, [],
      _STEM_27 + '<strong>適切なのはどれか。</strong>',
      [('a', '「6 か月前と比較して胃泡が多くなっています」', False,
        '<span class="kw4">胃泡（胃の中の空気）の見え方は体位で大きく変わる</span>。'
        '<span class="kw4">立位では空気が胃底部に集まって'
        '横隔膜下の明瞭なガス像として写るが、'
        '仰臥位では空気が広がって不明瞭になる</span>。'
        '<span class="kw4">体位の違う2枚で胃泡の「量」を比較することはできない</span>。'
        '<span class="kw">そもそも本例の病態と胃泡は無関係</span>。'),
       ('b', '「本日の写真では下行大動脈が認められません」', False,
        '<span class="kw4">下行大動脈は椎体の左縁に沿う線として'
        '通常は追える</span>。'
        '<span class="kw4">本例の写真でも認められないわけではない</span>。'
        '<span class="kw">むしろ大動脈解離では上縦隔の拡大・'
        '大動脈陰影の拡大がみられることがあるが、'
        '<span class="kw3">仰臥位AP像では縦隔がもともと広く写る</span>ので'
        'これも単純には比較できない</span>。'),
       ('c', '「本日の写真では著しい気管の偏位が認められます」', False,
        '<span class="kw4">著しい気管偏位をきたすのは'
        '緊張性気胸・大量胸水・広範な無気肺・巨大な縦隔腫瘤</span>など。'
        '<span class="kw4">本例にそれらの所見はなく、'
        '呼吸音も正常でSpO<sub>2</sub> 99%</span>。'
        '<span class="kw">「著しい」と断定する根拠がない</span>。'),
       ('d', '「6 か月前と心拡大の程度を比較するのは困難です」', True,
        '<span class="kw3">◯ これが正しい。'
        '本日はポータブル撮影機による<u>仰臥位のAP（前後）像</u>、'
        '6か月前は<u>立位のPA（後前）像</u>で、'
        '撮影体位も方向も違う</span>。'
        '<span class="kw3">AP像では、心臓がフィルム（検出器）から遠く'
        'エックス線管に近い位置にあるため、'
        '幾何学的に拡大して写る</span>——'
        '<span class="kw3">つまりAP像の心陰影は'
        '実際より大きく見えるのが当たり前</span>である。'
        '<span class="kw3">さらに仰臥位では静脈還流が増えて'
        '心陰影・縦隔が実際に広がるうえ、'
        'ポータブル撮影では撮影距離が短く（100cm程度）、'
        '深吸気を保てないことも多い</span>。'
        '<span class="kw3">したがって心胸郭比〈CTR〉を'
        '2枚で比較して「心拡大が進んだ」と述べることはできない</span>。<br>'
        '<span class="kw4">⚠️ 正答率20%＝本科目で最も低い</span>。'
        '<span class="kw4">画像そのものを読むのではなく'
        '「その画像で何が言えて、何が言えないか」を問う設問</span>で、'
        '<span class="kw3">まさに放射線科らしい一問である</span>。'),
       ('e', '「いずれの写真でもCP アングル〈肋骨横隔膜角〉は鋭なので'
        '胸水貯留はありません」', False,
        '<span class="kw4">仰臥位では胸水は背側に薄く広がるため、'
        'CPアングルの鈍化として現れない</span>——'
        '<span class="kw4">「仰臥位でCPアングルが鋭い」ことは'
        '胸水がないことの証明にならない</span>。'
        '<span class="kw3">仰臥位で胸水を示唆するのは'
        '「患側肺野全体のびまん性の淡い濃度上昇」</span>である。'
        '<span class="kw">（なお立位でCPアングルが鈍化するには'
        '200〜250mL以上の胸水が必要で、'
        '立位でも少量胸水は見逃されうる）</span>')],
      '仰臥位AP像と立位PA像では心陰影の拡大率が違う。心拡大の比較はできない。',
      imgs=[IMG + '114C-69_1.jpeg', IMG + '114C-69_2.jpeg'],
      patho=('🔎 胸部エックス線写真は「どう撮ったか」で見え方が変わる',
             '<span class="kw3">胸部単純写真を読む前に、'
             '必ず撮影条件を確認する</span>——'
             '<span class="kw3">体位（立位／仰臥位）、方向（PA／AP）、'
             '吸気の程度、回旋の有無</span>。'
             '<span class="kw3">これを無視すると、'
             '正常を異常と読み、異常を正常と読む</span>。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">立位 PA像（標準）</span></th>'
             '<th><span class="kw3">仰臥位 AP像（ポータブル）</span></th></tr>'
             '<tr><td>エックス線の向き</td>'
             '<td><span class="kw3">背中から前へ（心臓が検出器に近い）</span></td>'
             '<td><span class="kw3">前から背中へ（心臓が検出器から遠い）</span></td></tr>'
             '<tr><td><span class="kw3">心陰影</span></td>'
             '<td><span class="kw3">実物大に近い</span></td>'
             '<td><span class="kw3">拡大して写る（＋仰臥位で静脈還流が増え'
             '実際にも広がる）</span>'
             '——<span class="kw4">CTRを過大評価する</span></td></tr>'
             '<tr><td><span class="kw3">縦　隔</span></td>'
             '<td>細く写る</td>'
             '<td><span class="kw4">広く写る</span>'
             '——<span class="kw4">縦隔拡大と誤読しやすい</span></td></tr>'
             '<tr><td><span class="kw3">胸　水</span></td>'
             '<td><span class="kw3">CPアングルの鈍化</span>'
             '（200〜250mL以上で）</td>'
             '<td><span class="kw3">背側に広がり、'
             '肺野全体の淡い濃度上昇として写る</span>'
             '——<span class="kw4">CPアングルは鋭いまま</span></td></tr>'
             '<tr><td><span class="kw">気　胸</span></td>'
             '<td><span class="kw">肺尖部に虚脱線</span></td>'
             '<td><span class="kw4">空気が前方（腹側）へ移動するので'
             '見えにくい（deep sulcus sign を探す）</span></td></tr>'
             '<tr><td><span class="kw">遊離ガス（穿孔）</span></td>'
             '<td><span class="kw">横隔膜下の free air</span></td>'
             '<td><span class="kw4">写らない</span></td></tr>'
             '<tr><td>撮影距離</td><td>約180cm</td>'
             '<td><span class="kw">約100cm（拡大率がさらに上がる）</span></td></tr>'
             '<tr><td>吸　気</td><td>深吸気で保持</td>'
             '<td><span class="kw4">不十分になりやすい'
             '（＝肺野の濃度が上がり心陰影も大きく見える）</span></td></tr></table>'),
      deep=('💡 この症例の全体像——急性大動脈解離のStanford A型',
             '<span class="kw3">本例は「突然の激烈な胸背部痛」で始まり、'
             '複数の臓器の症状が同時に出ている</span>——'
             '<span class="kw3">1つの病気で説明するなら急性大動脈解離</span>である。'
             '<table class="tb"><tr><th>所見</th><th>解離のどの合併症か</th></tr>'
             '<tr><td><span class="kw3">突然の激烈な胸背部痛</span></td>'
             '<td><span class="kw3">解離そのもの（引き裂かれるような痛み）</span></td></tr>'
             '<tr><td><span class="kw3">左片麻痺・Babinski徴候陽性</span></td>'
             '<td><span class="kw3">右腕頭動脈／総頸動脈への解離進展'
             '＝脳虚血</span></td></tr>'
             '<tr><td><span class="kw3">Ⅱ、Ⅲ、aV<sub>F</sub>のST上昇</span></td>'
             '<td><span class="kw3">右冠動脈入口部への解離進展'
             '＝下壁の急性心筋梗塞</span></td></tr>'
             '<tr><td><span class="kw3">拡張期灌水様雑音'
             '（胸骨左縁第3肋間）</span></td>'
             '<td><span class="kw3">大動脈弁輪の拡大'
             '＝急性大動脈弁閉鎖不全症</span></td></tr>'
             '<tr><td><span class="kw3">血圧78/62mmHg・脈拍微弱・'
             '頸静脈怒張・心音減弱・心電図の低電位</span></td>'
             '<td><span class="kw3">上行大動脈からの出血が心囊へ'
             '＝心タンポナーデ</span></td></tr>'
             '<tr><td colspan="2"><span class="kw3">上行大動脈に及ぶ'
             '＝Stanford A型で、緊急手術の適応</span>。<br>'
             '<span class="kw4">「胸痛＋神経症状」「胸痛＋左右差／血圧低下」'
             '「胸痛＋大動脈弁逆流」の組合せをみたら'
             '大動脈解離を最優先で疑う</span>。</td></tr></table>'
             '<span class="kw3">この全体像が見えていると、'
             'Q.28（可能性が低い疾患）とQ.29（優先する検査）が'
             'そのまま解ける</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">仰臥位AP像は心陰影が拡大して写る</span>'
             '——<span class="kw3">立位PA像と心拡大を比較できない</span>。<br>'
             '② <span class="kw3">仰臥位では胸水がCPアングルの鈍化として'
             '現れない</span>（肺野全体の淡い濃度上昇になる）。<br>'
             '③ <span class="kw">仰臥位では気胸・遊離ガスも見えにくい</span>。<br>'
             '④ <span class="kw3">読影の前に体位・方向・吸気・回旋を確認する</span>。<br>'
             '⑤ <span class="kw3">突然の胸背部痛＋神経症状＋大動脈弁逆流＋'
             'ショック＝Stanford A型急性大動脈解離</span>。')),

    # ── NO.28 (114C-70) 91% ans=d ──────────────────────────────
    Q('114C-70', 91, [],
      _STEM_27 + '<strong>この時点で可能性が低い疾患はどれか。</strong>',
      [('a', '脳梗塞', False,
        '<span class="kw4">「左上下肢の不全片麻痺・Babinski徴候陽性」＝'
        '右大脳半球の障害があり、脳梗塞は否定できない</span>。'
        '<span class="kw3">大動脈解離が右腕頭動脈・総頸動脈へ進展して'
        '脳虚血を起こしたと考えるのが本例の筋</span>だが、'
        '<span class="kw3">いずれにせよ「脳梗塞という病態が起きている」'
        'ことに変わりはない</span>。'),
       ('b', '大動脈解離', False,
        '<span class="kw4">むしろ本例の本態</span>。'
        '<span class="kw3">突然の激烈な胸背部痛・'
        '拡張期灌水様雑音（大動脈弁閉鎖不全）・'
        '脳虚血・下壁のST上昇・心タンポナーデという'
        '多臓器の所見を1つで説明できるのは解離だけ</span>である。'),
       ('c', '急性冠症候群', False,
        '<span class="kw4">Ⅱ、Ⅲ、aV<sub>F</sub>のST上昇＝'
        '下壁の急性心筋梗塞の所見があり、可能性は高い</span>。'
        '<span class="kw3">ただし本例では「解離が右冠動脈入口部へ及んだ結果」'
        'である可能性が高く、'
        'ここを見落として抗血栓療法を始めると'
        '解離を悪化させ致命的になる</span>——'
        '<span class="kw3">「下壁梗塞＋胸背部痛＋血圧低下」では'
        '必ず解離を否定してからPCIへ進む</span>。'),
       ('d', '肺血栓塞栓症', True,
        '<span class="kw3">◯ 可能性が低い。'
        '肺血栓塞栓症であれば低酸素血症を伴うのが原則</span>だが、'
        '<span class="kw3">本例はSpO<sub>2</sub> 99％（room air）・'
        '呼吸数18/分・呼吸音正常</span>。'
        '<span class="kw3">肺塞栓は肺動脈が詰まって'
        '換気血流不均衡と死腔換気が生じるので、'
        '呼吸困難・頻呼吸・低酸素血症が前面に出る</span>。'
        '<span class="kw3">また心電図所見も合わない</span>——'
        '<span class="kw3">肺塞栓では右心負荷所見'
        '（S<sub>1</sub>Q<sub>3</sub>T<sub>3</sub>パターン・'
        'V<sub>1-3</sub>の陰性T波・右脚ブロック・洞性頻脈）が出るのであって、'
        'Ⅱ・Ⅲ・aV<sub>F</sub>のST上昇にはならない</span>。'
        '<span class="kw3">さらに拡張期灌水様雑音（大動脈弁逆流）や'
        '片麻痺も説明できない</span>。'),
       ('e', '心タンポナーデ', False,
        '<span class="kw4">むしろ強く疑う所見が揃っている</span>——'
        '<span class="kw3">血圧低下（78/62mmHg）・頸静脈怒張・心音減弱'
        '＝Beckの三徴</span>に加えて'
        '<span class="kw3">脈拍微弱・脈圧の狭小化・'
        '心電図の低電位（心囊液が電気を減衰させる）</span>。'
        '<span class="kw3">上行大動脈解離からの出血が心囊内へ及んだもの</span>で、'
        '<span class="kw4">解離に伴う心タンポナーデは'
        '最も多い死因の1つ</span>である。')],
      '肺塞栓なら低酸素になるはず。SpO2 99%・右心負荷所見なしで否定的。',
      imgs=[IMG + '114C-70_1.jpeg', IMG + '114C-70_2.jpeg'],
      patho=('🔎 急性胸痛の鑑別——「命に関わる5つ」を先に潰す',
             '<span class="kw3">急性胸痛では、まず致死的な5疾患'
             '（killer chest pain）を否定する</span>。'
             '<table class="tb"><tr><th>疾患</th><th>特徴的な所見</th>'
             '<th>本例での評価</th></tr>'
             '<tr><td><span class="kw3">急性大動脈解離</span></td>'
             '<td><span class="kw3">突然の激烈な胸背部痛・'
             '血圧の左右差／上下肢差・大動脈弁逆流の雑音・'
             '分枝閉塞による多彩な症状（脳・冠動脈・腎・腸間膜・下肢）</span></td>'
             '<td><span class="kw3">最も合致（本態）</span></td></tr>'
             '<tr><td><span class="kw3">急性冠症候群</span></td>'
             '<td><span class="kw3">ST変化・トロポニン上昇・冷汗</span></td>'
             '<td><span class="kw3">Ⅱ・Ⅲ・aV<sub>F</sub>のST上昇あり'
             '（解離の合併として）</span></td></tr>'
             '<tr><td><span class="kw3">肺血栓塞栓症</span></td>'
             '<td><span class="kw3">呼吸困難・頻呼吸・<u>低酸素血症</u>・'
             'D-ダイマー上昇・右心負荷所見'
             '（S<sub>1</sub>Q<sub>3</sub>T<sub>3</sub>）・'
             '長期臥床や術後などの誘因</span></td>'
             '<td><span class="kw4">SpO<sub>2</sub> 99%で否定的</span></td></tr>'
             '<tr><td><span class="kw">緊張性気胸</span></td>'
             '<td><span class="kw">患側呼吸音の消失・'
             '頸静脈怒張・気管偏位・皮下気腫</span></td>'
             '<td><span class="kw4">呼吸音正常</span></td></tr>'
             '<tr><td><span class="kw">食道破裂'
             '（Boerhaave症候群）</span></td>'
             '<td><span class="kw">嘔吐に続く胸痛・皮下気腫・'
             '縦隔気腫</span></td>'
             '<td><span class="kw4">嘔吐の記載なし</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">＋心タンポナーデ'
             '（Beckの三徴）も忘れない</span>。<br>'
             '<span class="kw3">本例は「解離が原因で、'
             '心筋梗塞・脳梗塞・心タンポナーデを二次的に起こしている」</span>'
             'という構造になっている。</td></tr></table>'),
      deep=('💡 「1つの病気で全部説明できるか」を考える',
            '<span class="kw3">複数の臓器の症状が同時に出たとき、'
            '偶然の合併を考えるより'
            '「1つの病態が広がった」と考えるほうが自然</span>である。'
            '<span class="kw3">大動脈解離はまさにそれを起こす疾患</span>——'
            '<span class="kw3">大動脈から分岐するあらゆる血管が'
            '巻き込まれうるので、症状が多彩になる</span>。'
            '<table class="tb"><tr><th>巻き込まれる分枝</th>'
            '<th>起こること</th><th>紛らわしい診断</th></tr>'
            '<tr><td><span class="kw3">冠動脈（とくに右）</span></td>'
            '<td><span class="kw3">急性心筋梗塞（下壁が多い）</span></td>'
            '<td><span class="kw4">急性冠症候群</span>'
            '——<span class="kw4">抗血栓療法を始めると致命的</span></td></tr>'
            '<tr><td><span class="kw3">腕頭動脈・総頸動脈</span></td>'
            '<td><span class="kw3">脳梗塞・意識障害・片麻痺</span></td>'
            '<td><span class="kw4">脳梗塞</span>'
            '——<span class="kw4">t-PAを投与すると致命的</span></td></tr>'
            '<tr><td><span class="kw">鎖骨下動脈</span></td>'
            '<td><span class="kw">上肢の血圧左右差・脈拍消失</span></td>'
            '<td>—</td></tr>'
            '<tr><td><span class="kw">腹腔／上腸間膜動脈</span></td>'
            '<td><span class="kw">腹痛・腸管虚血</span></td>'
            '<td>急性腹症</td></tr>'
            '<tr><td><span class="kw">腎動脈</span></td>'
            '<td><span class="kw">急性腎障害・高血圧</span></td>'
            '<td>—</td></tr>'
            '<tr><td><span class="kw">腸骨・大腿動脈</span></td>'
            '<td><span class="kw">下肢虚血・対麻痺（脊髄動脈）</span></td>'
            '<td>—</td></tr>'
            '<tr><td><span class="kw3">大動脈弁輪・心囊</span></td>'
            '<td><span class="kw3">急性大動脈弁閉鎖不全・'
            '心タンポナーデ</span></td>'
            '<td><span class="kw">心不全・ショック</span></td></tr></table>'
            '<span class="kw4">⚠️ 大動脈解離を「急性冠症候群」や'
            '「脳梗塞」と誤診して抗血栓薬・t-PAを投与することが'
            '最も避けたい事故</span>——'
            '<span class="kw3">だからQ.29で「まず造影CTで解離を確認する」に'
            'つながる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">肺血栓塞栓症は低酸素血症を伴う</span>'
             '——SpO<sub>2</sub>正常なら可能性は低い。<br>'
             '② <span class="kw">肺塞栓の心電図＝'
             'S<sub>1</sub>Q<sub>3</sub>T<sub>3</sub>・'
             'V<sub>1-3</sub>陰性T・右脚ブロック・洞性頻脈</span>。<br>'
             '③ <span class="kw3">大動脈解離は分枝の巻き込みで'
             '心筋梗塞・脳梗塞・腸管虚血・下肢虚血を二次的に起こす</span>。<br>'
             '④ <span class="kw4">解離を見落として抗血栓療法・t-PAを行うと致命的</span>。<br>'
             '⑤ <span class="kw">急性胸痛では致死的5疾患'
             '（解離・ACS・肺塞栓・緊張性気胸・食道破裂）を先に潰す</span>。')),

    # ── NO.29 (114C-71) 89% ans=b ──────────────────────────────
    Q('114C-71', 89, [],
      _STEM_27 + '<strong>治療方針決定のために優先される検査はどれか。</strong>',
      [('a', '心臓MRI', False,
        '<span class="kw4">MRIは撮像に時間がかかり、'
        '検査中は患者に近づけない</span>。'
        '<span class="kw4">ショック状態（血圧78/62mmHg）で'
        '刻一刻と状態が変わる患者を'
        'MRIの筒の中に入れるのは危険</span>。'
        '<span class="kw4">「状態が不安定な患者はMRIの禁忌」</span>という'
        '原則がここで効く。'),
       ('b', '胸部造影CT', True,
        '<span class="kw3">◯ 急性大動脈解離が疑われる患者で'
        '最優先されるのは造影CT</span>。'
        '<span class="kw3">数分で撮れて、'
        '①解離腔（フラップ）の有無 '
        '②解離の範囲（上行大動脈に及ぶか＝Stanford分類）'
        '③分枝の巻き込み ④心囊液・胸腔内／縦隔血腫の有無 '
        '⑤破裂の切迫を一度に評価できる</span>。'
        '<span class="kw3">この情報がそのまま治療方針を決める</span>——'
        '<span class="kw3">上行大動脈に及ぶStanford A型なら緊急手術、'
        'B型なら降圧を中心とした保存的治療</span>。'
        '<span class="kw">撮影範囲は頸部〜骨盤まで広くとる</span>。'),
       ('c', '冠動脈造影CT', False,
        '<span class="kw4">心電図に下壁のST上昇があるので'
        '選びたくなる肢</span>だが、'
        '<span class="kw4">冠動脈造影CTは心電図同期で'
        '冠動脈だけを詳細に見る検査</span>であり、'
        '<span class="kw4">大動脈全体の解離の範囲を評価する目的には合わない</span>。'
        '<span class="kw3">そもそも本例のST上昇は'
        '「解離が右冠動脈入口部に及んだ結果」と考えられ、'
        '治療は冠動脈への介入ではなく解離そのものの手術</span>である。'
        '<span class="kw4">解離を確認せずに冠動脈造影・PCIへ進むと'
        '致命的になりうる</span>。'),
       ('d', 'D ダイマー測定', False,
        '<span class="kw4">D-ダイマーは大動脈解離でも上昇するが、'
        '特異度が低く（肺塞栓・DIC・悪性腫瘍・感染・術後でも上がる）、'
        '「治療方針を決める」情報にはならない</span>。'
        '<span class="kw3">陰性なら解離の可能性を下げる'
        '（除外に使える）という位置づけ</span>で、'
        '<span class="kw4">本例のように臨床的に強く疑われる状況では'
        '結果を待つ時間が無駄</span>。'),
       ('e', '心筋トロポニンT 測定', False,
        '<span class="kw4">トロポニンは心筋傷害のマーカーで、'
        '本例でも上昇しうる</span>。'
        '<span class="kw4">しかし「心筋が傷んでいる」ことが分かっても'
        '原因が解離か一次性のACSかは区別できず、'
        '治療方針は決まらない</span>。'
        '<span class="kw4">むしろ「心筋梗塞だ」と判断して'
        '抗血栓療法を始めると解離を悪化させる</span>。')],
      '解離を疑ったら造影CT。範囲（Stanford分類）が手術かどうかを直接決める。',
      imgs=[IMG + '114C-71_1.jpeg', IMG + '114C-71_2.jpeg'],
      patho=('🔎 急性大動脈解離——Stanford分類が治療を決める',
             '<span class="kw3">大動脈解離の治療方針は'
             '「上行大動脈に解離が及んでいるかどうか」の一点で決まる</span>。'
             '<table class="tb"><tr><th></th>'
             '<th><span class="kw3">Stanford A型</span></th>'
             '<th><span class="kw3">Stanford B型</span></th></tr>'
             '<tr><td>範　囲</td>'
             '<td><span class="kw3">上行大動脈に解離が及ぶ</span></td>'
             '<td><span class="kw3">上行大動脈に及ばない'
             '（左鎖骨下動脈より遠位）</span></td></tr>'
             '<tr><td><span class="kw3">治　療</span></td>'
             '<td><span class="kw3">緊急手術（人工血管置換術）</span></td>'
             '<td><span class="kw3">原則は保存的治療'
             '（降圧・心拍数の管理）</span>。'
             '<span class="kw">合併症例（破裂・臓器虚血・'
             '難治性疼痛）はステントグラフト内挿術／手術</span></td></tr>'
             '<tr><td>理　由</td>'
             '<td><span class="kw4">心タンポナーデ・大動脈弁閉鎖不全・'
             '冠動脈閉塞・破裂で急速に死亡する'
             '（無治療では発症48時間以内に約半数が死亡）</span></td>'
             '<td><span class="kw">上記の合併症が起こりにくい</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">薬物療法は'
             '「血圧」と「dP/dt（血圧の立ち上がりの勢い）」を'
             '同時に下げることが要点</span>——'
             '<span class="kw3">まずβ遮断薬で心拍数を60/分程度へ落とし、'
             'そのうえで血管拡張薬を加える</span>。'
             '<span class="kw4">血管拡張薬を先に使うと反射性頻脈で'
             'dP/dtが上がり解離を進展させる</span>。<br>'
             '<span class="kw4">⚠️ ただし本例のようにショック'
             '（心タンポナーデ）を伴う場合は降圧よりも'
             '緊急手術・心囊ドレナージが優先される</span>。</td></tr></table>'),
      deep=('💡 造影CTが「治療方針を決める検査」になる理由',
            '<span class="kw3">検査を選ぶ基準は'
            '「その結果で次の行動が変わるか」</span>である。'
            '<table class="tb"><tr><th>検査</th>'
            '<th>得られる情報</th><th>治療方針が変わるか</th></tr>'
            '<tr><td><span class="kw3">胸部造影CT</span></td>'
            '<td><span class="kw3">解離の有無・範囲（A型かB型か）・'
            '分枝の巻き込み・心囊液・破裂の切迫</span></td>'
            '<td><span class="kw3">◎ 緊急手術か保存的治療かが直接決まる</span></td></tr>'
            '<tr><td><span class="kw">経食道心エコー</span></td>'
            '<td><span class="kw">上行大動脈のフラップ・'
            '大動脈弁逆流・心囊液</span></td>'
            '<td><span class="kw">◯ ベッドサイドで可能で、'
            '搬送できないほど不安定な場合の代替になる</span></td></tr>'
            '<tr><td><span class="kw">経胸壁心エコー</span></td>'
            '<td><span class="kw3">心囊液・大動脈弁逆流・'
            '上行大動脈の拡大</span></td>'
            '<td><span class="kw3">◯ 数十秒でできるので'
            'CTの前に当てる（心タンポナーデの確認）</span></td></tr>'
            '<tr><td><span class="kw4">D-ダイマー</span></td>'
            '<td><span class="kw4">解離の可能性（特異度が低い）</span></td>'
            '<td><span class="kw4">△ 除外には使えるが確定できない</span></td></tr>'
            '<tr><td><span class="kw4">トロポニン</span></td>'
            '<td><span class="kw4">心筋傷害の有無</span></td>'
            '<td><span class="kw4">× 原因が特定できない</span></td></tr>'
            '<tr><td><span class="kw4">MRI</span></td>'
            '<td>解離の詳細（画質は良い）</td>'
            '<td><span class="kw4">× 時間がかかり不安定な患者に使えない</span></td></tr>'
            '</table>'
            '<span class="kw3">救急では「情報の精度」より'
            '「その情報が今すぐ手に入り、'
            '次の一手を決められるか」で検査を選ぶ</span>——'
            '<span class="kw3">造影CTが第一選択なのは、'
            '速くて、範囲が広くて、治療方針に直結するから</span>である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">急性大動脈解離を疑ったら造影CT</span>'
             '（頸部〜骨盤まで）。<br>'
             '② <span class="kw3">Stanford A型（上行に及ぶ）＝緊急手術／'
             'B型＝原則保存的（降圧）</span>。<br>'
             '③ <span class="kw3">薬物療法はまずβ遮断薬で心拍数を落としてから'
             '血管拡張薬</span>（dP/dtを下げる）。<br>'
             '④ <span class="kw4">状態が不安定な患者にMRIは使えない</span>。<br>'
             '⑤ <span class="kw4">D-ダイマー・トロポニンは治療方針を決められない</span>。')),

    # ── NO.30 (114A-7) 84% ans=a ───────────────────────────────
    Q('114A-7', 84, [],
      '<strong>疾患と治療の組合せで正しいのはどれか。</strong>',
      [('a', '多発肝細胞癌 ――― 経カテーテル的動脈化学塞栓術〈TACE〉', True,
        '<span class="kw3">◯ 正しい組合せ</span>。'
        '<span class="kw3">肝細胞癌は肝動脈から栄養される（多血性腫瘍）</span>のに対し、'
        '<span class="kw3">正常肝は約7割を門脈から養われている</span>——'
        '<span class="kw3">この血流の違いを利用して'
        '肝動脈だけを塞栓すれば、'
        '腫瘍を選択的に壊死させて正常肝を残せる</span>。'
        '<span class="kw3">抗癌薬をリピオドール（油性ヨード造影剤）に懸濁して'
        '腫瘍血管に注入し、ゼラチンスポンジなどで塞栓する</span>。'
        '<span class="kw3">切除もラジオ波焼灼も難しい多発例が'
        'よい適応</span>である。'
        '<span class="kw4">門脈本幹が閉塞している例では'
        '肝動脈まで止めると肝梗塞になるので禁忌</span>。'),
       ('b', '胆石合併胆囊癌 ――― 腹腔鏡下胆囊摘出術', False,
        '<span class="kw4">胆囊癌に腹腔鏡下胆囊摘出術は不適</span>。'
        '<span class="kw4">術中に胆囊を破って腹腔内に播種させる危険があり、'
        'ポート部再発も知られている</span>。'
        '<span class="kw3">胆囊癌の標準術式は開腹による'
        '胆囊摘出＋肝床部切除＋リンパ節郭清（深達度に応じて拡大）</span>。'
        '<span class="kw">（胆石症に対する腹腔鏡下胆囊摘出術後に'
        '偶発的に癌が見つかることはあり、その場合は追加切除を検討する）</span>'),
       ('c', '特発性門脈圧亢進症 ――― 門脈内ステント留置', False,
        '<span class="kw4">特発性門脈圧亢進症〈IPH〉は'
        '肝内末梢門脈枝の閉塞・線維化による肝前性〜類洞前性の門脈圧亢進</span>で、'
        '<span class="kw4">門脈本幹に狭窄があるわけではない</span>ため'
        '<span class="kw4">ステントを置く場所がない</span>。'
        '<span class="kw3">治療は食道・胃静脈瘤の管理（内視鏡的治療）と'
        '脾機能亢進に対する脾摘・部分的脾動脈塞栓術〈PSE〉</span>。'
        '<span class="kw">肝機能は比較的保たれるので予後は肝硬変より良い</span>。'),
       ('d', '膵管内乳頭粘液性腫瘍 ――― 膵管ステント留置', False,
        '<span class="kw4">IPMNは膵管内に粘液を産生する腫瘍性病変で、'
        '主膵管型・分枝型・混合型に分かれる</span>。'
        '<span class="kw3">対応は「経過観察」か「切除」の二択</span>で、'
        '<span class="kw4">ステントを置いても粘液で詰まるだけで意味がない</span>。'
        '<span class="kw">主膵管の拡張（10mm以上）・造影される壁在結節・'
        '閉塞性黄疸などのhigh-risk stigmataがあれば切除</span>。'),
       ('e', '急性化膿性閉塞性胆管炎 ――― 胆管切除術', False,
        '<span class="kw4">急性閉塞性化膿性胆管炎〈AOSC〉は'
        '敗血症性ショックに至る緊急病態</span>で、'
        '<span class="kw3">やるべきことは「胆道ドレナージ」であって切除ではない</span>。'
        '<span class="kw3">抗菌薬と全身管理を行いながら、'
        '緊急でENBD／EBS（内視鏡的経鼻胆道ドレナージ／胆道ステント）'
        'またはPTBD（経皮経肝胆道ドレナージ）を行う</span>。'
        '<span class="kw4">原因（結石・腫瘍）の根治的治療は'
        '感染が鎮まってから</span>——'
        '<span class="kw3">「膿があるところは、まずドレナージ」</span>。')],
      '肝細胞癌は肝動脈支配・正常肝は門脈支配。この差を使うのがTACE。',
      patho=('🔎 IVRの5つの動作——「詰める・広げる・入れる・焼く・取る」',
             '<span class="kw3">インターベンショナルラジオロジー〈IVR〉は'
             '画像で体内を透視しながらカテーテルや針で治療する手技</span>。'
             '<span class="kw3">やっていることは5つの動作に整理できる</span>。'
             + TBL_IVR),
      deep=('💡 TACEが成立する理由——肝臓の「二重支配」',
            '<span class="kw3">肝臓は肝動脈と門脈という'
            '2本の血管から血流を受ける唯一の臓器</span>である。'
            '<table class="tb"><tr><th></th><th>正常肝</th>'
            '<th><span class="kw3">肝細胞癌</span></th></tr>'
            '<tr><td><span class="kw3">血流の由来</span></td>'
            '<td><span class="kw3">門脈 約70%＋肝動脈 約30%</span></td>'
            '<td><span class="kw3">ほぼ100%が肝動脈</span></td></tr>'
            '<tr><td>造影CTでの見え方</td>'
            '<td>門脈相で最も濃染</td>'
            '<td><span class="kw3">動脈相で強く濃染し、'
            '門脈相〜平衡相で周囲より低吸収になる〈washout〉</span></td></tr>'
            '<tr><td><span class="kw3">肝動脈を塞栓すると</span></td>'
            '<td><span class="kw3">門脈があるので壊死しない</span></td>'
            '<td><span class="kw3">血流が絶たれて壊死する</span></td></tr></table>'
            '<span class="kw3">この「腫瘍だけが肝動脈に依存している」という'
            '性質があるからTACEが成り立つ</span>。'
            '<span class="kw3">同じ理屈で、造影CTの'
            '「動脈相での濃染＋門脈相でのwashout」が'
            '肝細胞癌の診断根拠になる</span>——'
            '<span class="kw3">診断と治療が同じ血行動態の上に乗っている</span>。'
            '<table class="tb"><tr><th>肝細胞癌の治療</th><th>適応の目安</th></tr>'
            '<tr><td><span class="kw">肝切除</span></td>'
            '<td><span class="kw">肝機能が保たれ、腫瘍数が少ない</span></td></tr>'
            '<tr><td><span class="kw">ラジオ波焼灼療法〈RFA〉</span></td>'
            '<td><span class="kw">3cm以下・3個以下</span></td></tr>'
            '<tr><td><span class="kw3">TACE</span></td>'
            '<td><span class="kw3">多発（切除・焼灼の適応外）だが'
            '肝機能が保たれ、脈管侵襲・遠隔転移がない</span></td></tr>'
            '<tr><td><span class="kw">薬物療法（分子標的薬・'
            '免疫チェックポイント阻害薬）</span></td>'
            '<td><span class="kw">脈管侵襲・遠隔転移がある</span></td></tr>'
            '<tr><td><span class="kw">肝移植</span></td>'
            '<td><span class="kw">Milan基準内で肝機能不良</span></td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">多発肝細胞癌＝TACE</span>。'
             '<span class="kw3">腫瘍は肝動脈支配、正常肝は門脈支配</span>。<br>'
             '② <span class="kw4">門脈本幹閉塞例へのTACEは禁忌（肝梗塞）</span>。<br>'
             '③ <span class="kw4">胆囊癌に腹腔鏡下胆囊摘出術は不適（播種）</span>。<br>'
             '④ <span class="kw3">急性閉塞性化膿性胆管炎は緊急胆道ドレナージ</span>'
             '（ENBD／EBS／PTBD）。<br>'
             '⑤ <span class="kw">IPMNは経過観察か切除。'
             '特発性門脈圧亢進症は静脈瘤治療と脾摘／PSE</span>。')),

    # ── NO.31 (112C-13) 67% ans=a ──────────────────────────────
    Q('112C-13', 67, [],
      '<strong>疾患と用いられる治療との組合せで<u>誤っている</u>のはどれか。</strong>',
      [('a', '洞性頻脈 ――― カテーテルアブレーション', True,
        '<span class="kw3">◯ これが誤り。洞性頻脈は「不整脈」ではなく'
        '<u>洞結節が正常に反応した結果</u></span>である。'
        '<span class="kw3">発熱・脱水・貧血・疼痛・不安・甲状腺機能亢進症・'
        '心不全・低酸素・出血といった原因があって'
        '心拍数が上がっているのだから、'
        '治療すべきは原因のほう</span>。'
        '<span class="kw4">洞結節を焼灼すれば'
        '必要なときに心拍数を上げられなくなり、'
        '洞不全症候群を作ってペースメーカが必要になる</span>——'
        '<span class="kw4">「体の正常な代償反応を壊す」ことになる</span>。<br>'
        '<span class="kw">カテーテルアブレーションの適応は'
        '発作性上室頻拍（WPW症候群・房室結節リエントリー）・'
        '心房粗動・心房細動・心室頻拍など、'
        '<u>異常な旋回路や異常自動能</u>をもつ不整脈</span>である。'),
       ('b', '急性冠症候群 ――― 経皮的冠動脈インターベンション', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">ST上昇型心筋梗塞〈STEMI〉では'
        '発症からできるだけ早く（door-to-balloon 90分以内を目標に）'
        '責任血管を再開通させる</span>。'
        '<span class="kw">バルーン拡張＋薬剤溶出性ステント留置が標準</span>。'
        '<span class="kw3">IVRの「広げる」動作の代表例</span>。'),
       ('c', '頸動脈狭窄症 ――― ステント留置術', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw">頸動脈狭窄症の血行再建には'
        '頸動脈内膜剝離術〈CEA〉と'
        '頸動脈ステント留置術〈CAS〉の2つ</span>があり、'
        '<span class="kw">高齢・心肺合併症・対側閉塞・'
        '頸部放射線照射後・手術到達が困難な高位病変では'
        'CASが選ばれる</span>。'
        '<span class="kw">遠位塞栓を防ぐプロテクションデバイスを併用する</span>。'),
       ('d', '腹部大動脈瘤 ――― ステントグラフト留置術', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">ステントグラフト内挿術〈EVAR〉は'
        '大腿動脈から人工血管を折りたたんで挿入し、'
        '瘤の内側で展開して血流を通す</span>。'
        '<span class="kw3">開腹による人工血管置換術に比べて低侵襲</span>で、'
        '<span class="kw">高齢・併存疾患の多い症例に適する</span>。'
        '<span class="kw4">エンドリーク（瘤内への血流の残存）の'
        '長期フォローが必要</span>。'),
       ('e', '閉塞性動脈硬化症 ――― ステント留置術', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw">間欠性跛行や重症下肢虚血に対して、'
        'バルーン拡張＋ステント留置（EVT／血管内治療）を行う</span>。'
        '<span class="kw">腸骨動脈・浅大腿動脈が代表的な治療部位'
        '（NO.32参照）</span>。'
        '<span class="kw">なお軽症では運動療法・薬物療法・'
        '危険因子の管理が基本</span>。')],
      '洞性頻脈は正常な代償反応。焼灼するのは異常な旋回路をもつ不整脈だけ。',
      patho=('🔎 カテーテルアブレーションの適応——「異常な回路があるか」',
             '<span class="kw3">アブレーションは'
             '「不整脈の原因となっている心筋の一部を焼いて'
             '電気的に切り離す」治療</span>。'
             '<span class="kw3">したがって適応があるのは'
             '「焼くべき異常な回路・異常な起源が存在する」不整脈だけ</span>である。'
             '<table class="tb"><tr><th>不整脈</th><th>機序</th>'
             '<th>アブレーション</th></tr>'
             '<tr><td><span class="kw3">WPW症候群'
             '（房室回帰頻拍）</span></td>'
             '<td><span class="kw3">副伝導路（Kent束）</span></td>'
             '<td><span class="kw3">◎ 副伝導路を焼灼＝根治的</span></td></tr>'
             '<tr><td><span class="kw3">房室結節リエントリー性頻拍</span></td>'
             '<td><span class="kw3">房室結節内の二重伝導路</span></td>'
             '<td><span class="kw3">◎ 遅伝導路を焼灼</span></td></tr>'
             '<tr><td><span class="kw3">心房粗動</span></td>'
             '<td><span class="kw3">三尖弁輪を旋回するリエントリー</span></td>'
             '<td><span class="kw3">◎ 三尖弁輪-下大静脈間峡部を焼灼</span></td></tr>'
             '<tr><td><span class="kw3">心房細動</span></td>'
             '<td><span class="kw3">肺静脈起源の異常興奮</span></td>'
             '<td><span class="kw3">◯ 肺静脈隔離術</span></td></tr>'
             '<tr><td><span class="kw">心室頻拍・期外収縮</span></td>'
             '<td><span class="kw">異常自動能・リエントリー</span></td>'
             '<td><span class="kw">◯ 起源を同定して焼灼</span></td></tr>'
             '<tr><td><span class="kw4">洞性頻脈</span></td>'
             '<td><span class="kw4">洞結節の<u>正常な</u>反応</span></td>'
             '<td><span class="kw4">× 適応なし——原因を治療する</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">「頻脈だから焼く」ではない</span>。'
             '<span class="kw3">洞性頻脈をみたら'
             '発熱・脱水・貧血・疼痛・低酸素・出血・'
             '甲状腺機能亢進症・心不全といった'
             '<u>背後の原因</u>を探す</span>のが正しい。</td></tr></table>'),
      deep=('💡 「ステント」と「ステントグラフト」は別物',
            '<span class="kw3">名前が似ているが、'
            'やっていることも適応もまったく違う</span>。'
            '<table class="tb"><tr><th></th>'
            '<th><span class="kw3">ステント</span></th>'
            '<th><span class="kw3">ステントグラフト</span></th></tr>'
            '<tr><td>構　造</td>'
            '<td><span class="kw3">金属メッシュの筒（網目が開いている）</span></td>'
            '<td><span class="kw3">金属の骨格に人工血管の膜を貼った筒'
            '（内腔が閉じている）</span></td></tr>'
            '<tr><td>目　的</td>'
            '<td><span class="kw3">狭くなった血管を内側から支えて広げる</span></td>'
            '<td><span class="kw3">瘤や解離の部分をバイパスして'
            '血流を内側の管に通し、瘤壁に圧をかけない</span></td></tr>'
            '<tr><td>適　応</td>'
            '<td><span class="kw3">冠動脈狭窄・頸動脈狭窄症・'
            '閉塞性動脈硬化症・腎動脈狭窄</span></td>'
            '<td><span class="kw3">胸部／腹部大動脈瘤・'
            'Stanford B型大動脈解離</span></td></tr>'
            '<tr><td>合併症</td>'
            '<td><span class="kw">再狭窄・ステント血栓症'
            '（抗血小板薬が要る）</span></td>'
            '<td><span class="kw4">エンドリーク（瘤内へ血流が残る）・'
            '脊髄虚血</span></td></tr></table>'
            '<span class="kw3">「狭いところを広げるのがステント、'
            '膨らんだところを内張りするのがステントグラフト」</span>と'
            '覚えると取り違えない。'
            '<span class="kw3">NO.34では「肺動静脈瘻にフィルター留置」という'
            '同種の取り違えが問われている</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw4">洞性頻脈はアブレーションの適応ではない</span>'
             '——<span class="kw3">原因（発熱・脱水・貧血・疼痛・'
             '甲状腺機能亢進症など）を治す</span>。<br>'
             '② <span class="kw3">アブレーションの適応＝WPW症候群・'
             '房室結節リエントリー性頻拍・心房粗動・心房細動・心室頻拍</span>。<br>'
             '③ <span class="kw3">ステント＝狭窄を広げる／'
             'ステントグラフト＝瘤を内張りする</span>。<br>'
             '④ <span class="kw">頸動脈狭窄症＝CEAまたはCAS</span>。<br>'
             '⑤ <span class="kw">STEMIはdoor-to-balloon 90分以内のPCI</span>。')),

]


QUESTIONS += [

    # ── NO.32 (111A-42) CBT 23% ans=d ← ch02の第2の難問 ─────────
    Q('111A-42', 23, [('bc', 'CBT')],
      '67 歳の男性。<span class="kw">歩行時の両下肢痛</span>を主訴に来院した。'
      '15 年前から高血圧症と脂質異常症とで内服治療中である。'
      '<span class="kw">最近、10 分程度の歩行で両下肢痛が出現するようになった。'
      '安静にしていると軽快する</span>という。体温36.5℃。脈拍64/ 分、整。'
      '<span class="kw">右上腕血圧134/72mmHg、足関節上腕血圧比〈ABI〉は'
      '右0.67、左0.50（基準0.9 以上）。</span>'
      '入院後、下肢血管に対してステント留置術が行われた。'
      '左下肢の治療前（A）、ガイドワイヤ通過後（B）及び治療後（C）の'
      '血管造影写真を示す。<br>'
      '<strong>ステントが留置された矢印で示す血管はどれか。</strong>',
      [('a', '左腓骨動脈', False,
        '<span class="kw4">腓骨動脈は膝窩動脈が分かれたあとの'
        '下腿の3本（前脛骨動脈・後脛骨動脈・腓骨動脈）のひとつ</span>で、'
        '<span class="kw4">下腿の腓骨に沿って走る細い血管</span>。'
        '<span class="kw4">写真に写っているのは膝より近位の大腿部で、'
        '血管の径も太い</span>ため合致しない。'),
       ('b', '左総腸骨動脈', False,
        '<span class="kw4">総腸骨動脈は腹部大動脈が'
        '第4腰椎の高さで分岐した直後の血管</span>で、'
        '<span class="kw4">骨盤内（仙腸関節の前）を走る</span>。'
        '<span class="kw4">写真の血管は骨盤ではなく大腿部を'
        '縦に長く走行しており、位置が違う</span>。'
        '<span class="kw">なお腸骨動脈領域の病変は'
        '「殿部・大腿の跛行＋大腿動脈拍動の減弱」として現れる</span>。'),
       ('c', '左内腸骨動脈', False,
        '<span class="kw4">内腸骨動脈は骨盤内臓（膀胱・直腸・子宮）と'
        '殿部を養う血管で、骨盤内を後下方へ向かう</span>。'
        '<span class="kw4">下肢へは向かわない</span>ので'
        '間欠性跛行の責任血管にはならない'
        '（<span class="kw">両側閉塞では殿筋跛行・勃起障害を来す'
        '＝Leriche症候群</span>）。'),
       ('d', '左浅大腿動脈', True,
        '<span class="kw3">◯ 浅大腿動脈〈SFA〉</span>。'
        '<span class="kw3">写真では、大腿部を上から下へ'
        'ほぼ直線的に長く走る太い血管に'
        'ガイドワイヤが通され、ステントが留置されている</span>。'
        '<span class="kw3">これは総大腿動脈から'
        '大腿深動脈を分岐したあと、'
        '内転筋管〈Hunter管〉を通って膝窩動脈へ移行する'
        '浅大腿動脈そのもの</span>である。'
        '<span class="kw3">浅大腿動脈は閉塞性動脈硬化症の'
        '最好発部位で、血管内治療の主戦場</span>——'
        '<span class="kw3">とくに内転筋管の出口付近は'
        '筋に圧迫され屈曲を繰り返すため閉塞しやすい</span>。'
        '<span class="kw3">大腿深動脈が側副血行路として発達するので、'
        'SFAが閉塞しても下肢が壊死せずに'
        '「歩くと痛い（間欠性跛行）」で済む</span>のが典型像である。'),
       ('e', '左大腿深動脈', False,
        '<span class="kw4">大腿深動脈は総大腿動脈から'
        '後外側へ分岐して大腿の筋群を養う血管</span>で、'
        '<span class="kw4">浅大腿動脈より背側を短く走り、'
        '分枝を出しながら細くなっていく</span>。'
        '<span class="kw3">SFA閉塞時の最も重要な側副血行路</span>なので、'
        '<span class="kw4">むしろ温存すべき血管</span>である。'
        '<span class="kw4">写真で長く直線的に描出されている本幹とは'
        '走行が異なる</span>。')],
      '大腿部を縦に長く走る太い血管＝浅大腿動脈。ASOの最好発部位で治療の主戦場。',
      imgs=[IMG + '111A-42_1.jpeg', IMG + '111A-42_2.jpeg', IMG + '111A-42_3.jpeg'],
      patho=('🔎 画像所見——治療前・ガイドワイヤ通過後・治療後の3枚を並べて読む',
             '<span class="kw3">A（治療前）では大腿部を走る主幹動脈が'
             '途中で描出されなくなっている（閉塞）</span>。'
             '<span class="kw3">B（ガイドワイヤ通過後）では'
             '閉塞部を貫いたガイドワイヤが線状に写り、'
             'その脇に目盛りつきのカテーテル（マーカーカテーテル）が見える</span>。'
             '<span class="kw3">C（治療後）ではステントが留置されて'
             '血管の連続性が回復している</span>。'
             '<table class="tb"><tr><th>読影の手がかり</th><th>本例</th>'
             '<th>結論</th></tr>'
             '<tr><td><span class="kw3">走行の高さ</span></td>'
             '<td><span class="kw3">大腿骨に沿った大腿部（骨盤内でも下腿でもない）</span></td>'
             '<td><span class="kw3">腸骨動脈・腓骨動脈を除外</span></td></tr>'
             '<tr><td><span class="kw3">走行の形</span></td>'
             '<td><span class="kw3">ほぼ直線的に長く下行する太い1本</span></td>'
             '<td><span class="kw3">浅大腿動脈</span>'
             '（<span class="kw4">大腿深動脈は分枝を出しながら'
             '後外側へ短く走る</span>）</td></tr>'
             '<tr><td><span class="kw3">分枝の出方</span></td>'
             '<td><span class="kw3">近位で1本太い枝を後方へ分けたあと、'
             '本幹はほとんど枝を出さずに下行</span></td>'
             '<td><span class="kw3">分けた枝＝大腿深動脈、'
             '本幹＝浅大腿動脈</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">下肢動脈の解剖'
             '（近位→遠位）</span>：'
             '<span class="kw3">腹部大動脈 → 総腸骨動脈 → 外腸骨動脈'
             '（内腸骨動脈は骨盤内へ）→ 総大腿動脈 → '
             '<u>浅大腿動脈</u>（＋大腿深動脈）→ 膝窩動脈 → '
             '前脛骨動脈・後脛骨動脈・腓骨動脈</span>。</td></tr></table>'),
      deep=('💡 閉塞性動脈硬化症——「詰まった高さ」が症状の場所を決める',
            '<span class="kw3">間欠性跛行の「痛む場所」から'
            '病変の高さが推定できる</span>——'
            '<span class="kw3">痛むのは閉塞部より<u>遠位</u>の筋である</span>。'
            '<table class="tb"><tr><th>閉塞部位</th><th>跛行の部位</th>'
            '<th>拍動の触知</th><th>特徴</th></tr>'
            '<tr><td><span class="kw3">大動脈・腸骨動脈</span></td>'
            '<td><span class="kw3">殿部・大腿</span></td>'
            '<td><span class="kw3">大腿動脈から触れない</span></td>'
            '<td><span class="kw3">両側閉塞＋勃起障害＝Leriche症候群</span></td></tr>'
            '<tr><td><span class="kw3">浅大腿動脈</span></td>'
            '<td><span class="kw3">下腿（ふくらはぎ）</span>'
            '——<span class="kw3">最も多い</span></td>'
            '<td><span class="kw3">大腿動脈は触れるが'
            '膝窩以下が減弱</span></td>'
            '<td><span class="kw3">ASOの最好発部位</span></td></tr>'
            '<tr><td><span class="kw">膝窩動脈・下腿動脈</span></td>'
            '<td><span class="kw">足部</span></td>'
            '<td><span class="kw">足背・後脛骨動脈が触れない</span></td>'
            '<td><span class="kw">糖尿病・透析例に多く'
            '重症下肢虚血になりやすい</span></td></tr></table>'
            '<table class="tb"><tr><th>ABI</th><th>解釈</th></tr>'
            '<tr><td><span class="kw3">0.9以下</span></td>'
            '<td><span class="kw3">下肢動脈の狭窄・閉塞を示唆</span></td></tr>'
            '<tr><td><span class="kw">0.4未満</span></td>'
            '<td><span class="kw4">重症虚血（安静時疼痛・潰瘍のリスク）</span></td></tr>'
            '<tr><td><span class="kw4">1.4以上</span></td>'
            '<td><span class="kw4">石灰化で血管が圧迫できず偽性高値'
            '（糖尿病・透析例）</span>——'
            '<span class="kw">この場合は足趾上腕血圧比〈TBI〉や'
            '皮膚灌流圧〈SPP〉で評価する</span></td></tr></table>'
            '<span class="kw3">治療の階段は'
            '「禁煙・運動療法・薬物療法（抗血小板薬・シロスタゾール）→ '
            '血管内治療（EVT）→ バイパス術」</span>。'
            '<span class="kw3">Fontaine分類Ⅱ度（間欠性跛行）までは'
            'まず運動療法と薬物療法、'
            'Ⅲ度（安静時疼痛）・Ⅳ度（潰瘍・壊死）は血行再建</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">閉塞性動脈硬化症の最好発部位は浅大腿動脈</span>'
             '（下腿の間欠性跛行）。<br>'
             '② <span class="kw3">跛行の部位は閉塞部より遠位の筋</span>——'
             '<span class="kw">殿部・大腿＝腸骨／下腿＝浅大腿／足部＝下腿動脈</span>。<br>'
             '③ <span class="kw3">ABI 0.9以下で狭窄を示唆、'
             '1.4以上は石灰化による偽性高値</span>。<br>'
             '④ <span class="kw">Leriche症候群＝両側腸骨動脈閉塞＋'
             '殿筋跛行＋勃起障害</span>。<br>'
             '⑤ <span class="kw">大腿深動脈はSFA閉塞時の重要な側副血行路</span>。')),

    # ── NO.33 (111B-11) 49% ans=c ──────────────────────────────
    Q('111B-11', 49, [],
      '<strong>内視鏡による止血が困難であった十二指腸潰瘍出血に対する'
      'インターベンショナルラジオロジー〈IVR〉で使用するのはどれか。</strong>',
      [('a', 'エタノール', False,
        '<span class="kw4">無水エタノールは組織を凝固壊死させる薬剤</span>で、'
        '<span class="kw">肝細胞癌の経皮的エタノール注入療法〈PEIT〉、'
        '囊胞の硬化療法、内視鏡的局注などに用いる</span>。'
        '<span class="kw4">動脈内に注入すると'
        '末梢の細動脈レベルまで壊死させてしまい、'
        '十二指腸壁の広範な虚血・穿孔を招く</span>。'
        '<span class="kw4">消化管出血の塞栓物質としては使わない</span>。'),
       ('b', 'クリップ', False,
        '<span class="kw4">クリップは<u>内視鏡的</u>止血の道具</span>'
        '（<span class="kw">機械的止血法</span>）。'
        '<span class="kw4">設問は「内視鏡による止血が困難であった」場合の'
        'IVRを問うている</span>ので、'
        '<span class="kw4">すでに試して失敗した手段を選ぶことになる</span>。'
        '<span class="kw3">「内視鏡で止まらないから血管側から攻める」'
        'という文脈を読み取ることが本問の要点</span>。'),
       ('c', 'コイル', True,
        '<span class="kw3">◯ 経カテーテル的動脈塞栓術〈TAE〉に用いる'
        '代表的な塞栓物質がコイル</span>である。'
        '<span class="kw3">大腿動脈からカテーテルを進めて'
        '責任血管（十二指腸潰瘍出血なら胃十二指腸動脈が最多）を'
        '選択し、金属コイルを充填して血流を遮断する</span>。'
        '<span class="kw3">コイルは留置位置を正確に決められ、'
        '必要なら追加・調整もできる</span>のが利点。'
        '<span class="kw3">十二指腸は胃十二指腸動脈と'
        '下膵十二指腸動脈から二重に血流を受けるため、'
        '出血部位の前後をはさんで塞栓する'
        '（isolation法）</span>のが定石である。'
        '<span class="kw3">同じコイル塞栓術は脳動脈瘤・'
        '肺動静脈瘻・外傷性出血にも用いられる</span>。'),
       ('d', 'ステント', False,
        '<span class="kw4">ステントは狭窄を広げて血流を通すための器具</span>で、'
        '<span class="kw4">出血を止める目的とは正反対</span>である。'
        '<span class="kw">（大血管の損傷に対して'
        'ステントグラフトで内張りする手技はあるが、'
        '十二指腸潰瘍出血の責任血管のような'
        '細い動脈には用いない）</span>'),
       ('e', 'フィルター', False,
        '<span class="kw4">フィルターは下大静脈〈IVC〉に留置して'
        '下肢深部静脈血栓が肺へ飛ぶのを受け止める器具</span>。'
        '<span class="kw4">静脈系の器具であり、動脈性出血の止血とは無関係</span>。'
        '<span class="kw">適応は「抗凝固療法ができない／'
        '抗凝固中にもかかわらず肺塞栓を繰り返す」深部静脈血栓症</span>。')],
      '内視鏡で止まらない消化管出血はTAE（コイル塞栓術）。クリップは内視鏡の道具。',
      patho=('🔎 消化管出血の止血——内視鏡 → IVR → 手術の順',
             '<span class="kw3">上部消化管出血の対応は段階的で、'
             '侵襲の少ないものから順に進む</span>。'
             '<table class="tb"><tr><th>段階</th><th>方法</th><th>内容</th></tr>'
             '<tr><td><span class="kw3">① 全身管理</span></td>'
             '<td><span class="kw3">輸液・輸血・PPI静注</span></td>'
             '<td><span class="kw3">循環を保つことが最優先。'
             'ショックなら内視鏡より先に蘇生</span></td></tr>'
             '<tr><td><span class="kw3">② 内視鏡的止血</span></td>'
             '<td><span class="kw3">クリップ（機械的）・'
             '高周波凝固／アルゴンプラズマ（熱凝固）・'
             '局注（エタノール・高張Naエピネフリン）</span></td>'
             '<td><span class="kw3">第一選択。'
             '9割以上はここで止まる</span></td></tr>'
             '<tr><td><span class="kw3">③ IVR（TAE）</span></td>'
             '<td><span class="kw3">コイル塞栓術'
             '（ゼラチンスポンジ・NBCAなども）</span></td>'
             '<td><span class="kw3">内視鏡で止まらない／'
             '出血点に到達できない場合。'
             '<u>開腹せずに止血できる</u></span></td></tr>'
             '<tr><td><span class="kw4">④ 外科手術</span></td>'
             '<td><span class="kw4">開腹による止血・切除</span></td>'
             '<td><span class="kw4">上記でも止まらない、'
             'または穿孔を合併した場合</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">十二指腸潰瘍出血で'
             '責任血管になるのは胃十二指腸動脈が最も多い</span>'
             '（<span class="kw">球部後壁の潰瘍が'
             '背側を走る胃十二指腸動脈を穿破する</span>）。</td></tr></table>'),
      deep=('💡 IVRで「詰める」ときの材料——何をどこに使うか',
            '<table class="tb"><tr><th>塞栓物質</th><th>性質</th>'
            '<th>代表的な適応</th></tr>'
            '<tr><td><span class="kw3">金属コイル</span></td>'
            '<td><span class="kw3">永久塞栓。留置位置を正確に決められ、'
            '比較的太い血管を確実に閉じる</span></td>'
            '<td><span class="kw3">消化管出血・外傷性出血・'
            '脳動脈瘤・肺動静脈瘻・静脈瘤</span></td></tr>'
            '<tr><td><span class="kw">ゼラチンスポンジ</span></td>'
            '<td><span class="kw">一時的塞栓（数日〜数週で吸収され再開通する）</span></td>'
            '<td><span class="kw">外傷性出血・産科危機的出血・TACEの併用</span></td></tr>'
            '<tr><td><span class="kw">NBCA（接着剤）</span></td>'
            '<td><span class="kw">液体で瞬時に固まる。'
            '凝固障害があっても効く</span></td>'
            '<td><span class="kw">凝固能が破綻した出血・'
            '末梢の細い血管</span></td></tr>'
            '<tr><td><span class="kw">リピオドール＋抗癌薬</span></td>'
            '<td><span class="kw">油性造影剤に薬を懸濁して腫瘍血管に停滞させる</span></td>'
            '<td><span class="kw">肝細胞癌のTACE</span></td></tr>'
            '<tr><td><span class="kw">球状塞栓物質'
            '（マイクロスフェア）</span></td>'
            '<td><span class="kw">粒径が一定で末梢まで届く</span></td>'
            '<td><span class="kw">子宮動脈塞栓術〈UAE〉・TACE</span></td></tr>'
            '<tr><td><span class="kw4">無水エタノール</span></td>'
            '<td><span class="kw4">組織を凝固壊死させる</span></td>'
            '<td><span class="kw4">腫瘍の直接注入・囊胞の硬化療法</span>'
            '——<span class="kw4">動脈内塞栓には使わない</span></td></tr></table>'
            '<span class="kw3">選ぶ基準は「永久に詰めてよいか」'
            '「どこまで末梢へ届かせたいか」「凝固能はあるか」</span>。'
            '<span class="kw4">臓器が虚血に耐えられない場合'
            '（腸管など）は、末梢まで詰めすぎると壊死・穿孔を招く</span>'
            'ので<span class="kw3">コイルで太めの血管を'
            'ピンポイントに止めるのが安全</span>である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">内視鏡で止まらない消化管出血は'
             'TAE（コイル塞栓術）</span>。<br>'
             '② <span class="kw4">クリップ・局注・熱凝固は内視鏡的止血の手段</span>。<br>'
             '③ <span class="kw3">十二指腸潰瘍出血の責任血管は胃十二指腸動脈が最多</span>。<br>'
             '④ <span class="kw">コイル＝永久塞栓／ゼラチンスポンジ＝一時的／'
             'NBCA＝凝固障害でも効く液体塞栓</span>。<br>'
             '⑤ <span class="kw4">IVCフィルターは静脈系（肺塞栓の予防）で'
             '止血とは無関係</span>。')),

    # ── NO.34 (107E-26) 77% ans=c ──────────────────────────────
    Q('107E-26', 77, [],
      '<strong>疾患と適応となるインターベンショナルラジオロジー〈IVR〉の'
      '組合せで<u>誤っている</u>のはどれか。</strong>',
      [('a', '上顎癌 ――― 動注化学療法', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">上顎洞癌に対しては、'
        '浅側頭動脈などから顎動脈へカテーテルを進めて'
        'シスプラチンを選択的に動注し、'
        '放射線治療と併用する（RADPLAT）</span>という治療がある。'
        '<span class="kw3">腫瘍への薬剤濃度を高めつつ'
        '全身の副作用を抑えられる</span>のが利点で、'
        '<span class="kw">上顎全摘という整容・機能への影響が大きい手術を'
        '避けられる可能性がある</span>。'),
       ('b', '大動脈瘤 ――― ステントグラフト内挿術', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">大腿動脈から折りたたんだ人工血管を挿入し、'
        '瘤の内側で展開して血流を内腔へ通す</span>。'
        '<span class="kw3">瘤壁に血圧がかからなくなるので破裂を防げる</span>。'
        '<span class="kw">開腹・開胸による人工血管置換術より低侵襲で、'
        '高齢・併存疾患の多い症例に適する</span>。'),
       ('c', '肺動静脈瘻 ――― フィルター留置術', True,
        '<span class="kw3">◯ これが誤り。肺動静脈瘻に対するIVRは'
        '<u>コイル塞栓術</u>である</span>。'
        '<span class="kw3">肺動静脈瘻は肺動脈と肺静脈が'
        '毛細血管を介さず直接つながった短絡</span>で、'
        '<span class="kw3">①右左シャントによる低酸素血症（起坐呼吸・チアノーゼ・'
        'ばち指）②肺での濾過を受けない血流が'
        '脳へ流れることによる奇異性塞栓（脳梗塞・脳膿瘍）'
        '③瘻の破裂による喀血・血胸</span>を起こす。'
        '<span class="kw3">治療は流入する肺動脈枝を'
        'コイルで塞栓して短絡を閉じること</span>。'
        '<span class="kw4">フィルター（IVCフィルター）は'
        '下大静脈に留置して下肢からの血栓を受け止める器具</span>で、'
        '<span class="kw4">肺動静脈瘻とはまったく別の話</span>である。'
        '<span class="kw">なお肺動静脈瘻の多くは'
        '遺伝性出血性末梢血管拡張症〈Osler病〉に伴う</span>。'),
       ('d', '肝細胞癌 ――― 動脈化学塞栓療法', False,
        '<span class="kw3">正しい組合せ</span>（NO.30参照）。'
        '<span class="kw3">肝細胞癌は肝動脈支配、正常肝は門脈支配という'
        '血流の違いを利用して、'
        '肝動脈だけを塞栓し腫瘍を選択的に壊死させる</span>。'),
       ('e', '腎血管性高血圧症 ――― 経皮血管形成術〈PTA〉', False,
        '<span class="kw3">正しい組合せ</span>。'
        '<span class="kw3">腎動脈狭窄によりレニン-アンジオテンシン系が'
        '活性化して起こる二次性高血圧が腎血管性高血圧</span>で、'
        '<span class="kw3">狭窄をバルーンで拡張（＋ステント留置）すれば'
        '血圧が改善しうる</span>。'
        '<span class="kw">とくに若年女性の線維筋性異形成による狭窄では'
        'PTAの効果が高い</span>'
        '（<span class="kw">動脈硬化性の狭窄では効果が限定的とする'
        '大規模試験もある</span>）。'
        '<span class="kw4">なお両側腎動脈狭窄では'
        'ACE阻害薬・ARBは腎機能を悪化させるため禁忌</span>。')],
      '肺動静脈瘻はコイル塞栓術。フィルターは下大静脈に置く別物。',
      patho=('🔎 IVRの組合せ問題は「動作」で振り分ける',
             '<span class="kw3">組合せ問題は、'
             '疾患ごとに「詰めるのか、広げるのか、入れるのか」を'
             '決めれば解ける</span>。' + TBL_IVR),
      deep=('💡 肺動静脈瘻——「肺というフィルターを迂回する」ことが病態',
            '<span class="kw3">肺循環は本来、'
            '全身から戻ってきた血液を毛細血管で濾過してから'
            '左心系へ送る役をしている</span>。'
            '<span class="kw3">肺動静脈瘻はその濾過装置を'
            'バイパスしてしまうので、症状が3方向に出る</span>。'
            '<table class="tb"><tr><th>迂回されるもの</th><th>結果</th>'
            '<th>臨床像</th></tr>'
            '<tr><td><span class="kw3">ガス交換</span></td>'
            '<td><span class="kw3">右左シャント</span></td>'
            '<td><span class="kw3">低酸素血症・チアノーゼ・ばち指・'
            '多血症。<u>酸素投与で改善しにくい</u></span>。'
            '<span class="kw">下肺野に多いため'
            '立位で悪化する（起坐呼吸・扁平呼吸）</span></td></tr>'
            '<tr><td><span class="kw3">血栓・細菌の捕捉</span></td>'
            '<td><span class="kw3">奇異性塞栓</span></td>'
            '<td><span class="kw3">脳梗塞・脳膿瘍</span>'
            '——<span class="kw3">若年者の原因不明の脳梗塞・脳膿瘍では'
            '肺動静脈瘻と卵円孔開存を疑う</span></td></tr>'
            '<tr><td><span class="kw">血管壁の保護</span></td>'
            '<td><span class="kw">瘤の破裂</span></td>'
            '<td><span class="kw">喀血・血胸</span></td></tr>'
            '<tr><td colspan="3"><span class="kw3">診断は'
            '造影CT（3D-CTA）で流入動脈と流出静脈を同定する</span>。'
            '<span class="kw">胸部エックス線写真では'
            '肺門から連なる境界明瞭な結節として写る</span>。<br>'
            '<span class="kw3">治療は流入肺動脈枝のコイル塞栓術</span>——'
            '<span class="kw3">流入動脈径3mm以上、'
            'または症状・奇異性塞栓の既往があれば適応</span>。<br>'
            '<span class="kw3">基礎疾患として'
            '遺伝性出血性末梢血管拡張症〈Osler病〉'
            '（常染色体顕性遺伝・反復する鼻出血・'
            '口唇／舌の毛細血管拡張・家族歴）を必ず探す</span>。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">肺動静脈瘻＝コイル塞栓術</span>'
             '（<span class="kw4">フィルターではない</span>）。<br>'
             '② <span class="kw3">肺動静脈瘻の3つの顔＝低酸素血症・'
             '奇異性塞栓（脳梗塞・脳膿瘍）・喀血</span>。'
             '<span class="kw">背景にOsler病</span>。<br>'
             '③ <span class="kw3">IVCフィルターは下大静脈に留置し'
             '肺塞栓を予防する</span>。<br>'
             '④ <span class="kw">上顎癌＝動注化学療法／大動脈瘤＝'
             'ステントグラフト内挿術／肝細胞癌＝TACE／'
             '腎血管性高血圧＝PTA</span>。<br>'
             '⑤ <span class="kw4">両側腎動脈狭窄にACE阻害薬・ARBは禁忌</span>。')),

]


SECTIONS = [
    ('s1', '★問題', '', 0),
    ('s2', '無印問題', '', 18),
]


def _ans_label(q):
    if q['ans_label']:
        return q['ans_label']
    oks = [(l, t) for (l, t, ok, w) in q['choices'] if ok]
    if len(oks) == 1:
        return f'{FW[oks[0][0]]}　{oks[0][1]}'
    return '・'.join(FW[l] for l, _ in oks)


def _choice_table(q):
    rows = ['<table class="tb"><tr><th>選択肢</th><th>解説</th></tr>']
    for letter, text, ok, why in q['choices']:
        cell = f'{FW[letter]}　{text}'
        if ok:
            rows.append(f'<tr><td><span class="kw3">◯ {cell}</span></td><td>{why}</td></tr>')
        else:
            rows.append(f'<tr><td>{cell}</td><td>{why}</td></tr>')
    rows.append('</table>')
    return ''.join(rows)


def render_card(n, q):
    qh = [f'<div class="qh"><span class="qn">Q.{n}</span><span class="qe">({q["id"]})</span>']
    for cls, t in q['badges']:
        qh.append(f'<span class="bg {cls}">{t}</span>')
    if q['rate'] is not None:
        qh.append(f'<span class="cr {rcls(q["rate"])}">{q["rate"]}%</span>')
    qh.append('</div>')

    body = [f'<div class="qb"><div class="qt">{q["qt"]}</div>']
    if q['imgs']:
        body.append('<div class="qimg-row">' +
                    ''.join(f'<img src="{s}" alt="">' for s in q['imgs']) + '</div>')
    body.append('<div class="cs">')
    for letter, text, ok, _w in q['choices']:
        cl = 'ch2 ok' if ok else 'ch2'
        body.append(f'<div class="{cl}">{FW[letter]}　{text}</div>')
    body.append('</div>')

    body.append(f'<div class="ab"><span class="ai">✅</span><div>'
                f'<div class="ac">{_ans_label(q)}</div><div class="as">{q["ans_sub"]}</div></div></div>')

    body.append('<div class="eg">')
    if q['patho']:
        body.append(f'<div class="eb ep"><h4>{q["patho"][0]}</h4>{q["patho"][1]}</div>')
    body.append(f'<div class="eb ee"><h4>□ 選択肢の検討</h4>{_choice_table(q)}</div>')
    if q['deep']:
        body.append(f'<div class="eb em"><h4>{q["deep"][0]}</h4>{q["deep"][1]}</div>')
    if q['point']:
        body.append(f'<div class="eb ept"><h4>{q["point"][0]}</h4>{q["point"][1]}</div>')
    body.append('</div></div>')

    return f'<div class="qc" id="q{n}">' + ''.join(qh) + ''.join(body) + '</div>'


CH_NUM, CH_NAME = 2, '放射線診断学'


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC放射線科 第{CH_NUM}章 {CH_NAME} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#475569')
                .replace('--orl:#FCE4EC', '--orl:#F1F5F9')
                .replace('--ord:#880E4F', '--ord:#1E293B')
                .replace("content:'産'", "content:'放'"))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 放射線科</div>'
        f'<h1>第<span>{CH_NUM}</span>章｜{CH_NAME}</h1>'
        f'<div class="hs">解答・解説集 全{len(QUESTIONS)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(QUESTIONS)}</strong>問</div>'
        f'<div class="sp"><strong>★問題</strong> {n_star}問</div>'
        f'<div class="sp"><strong>📷画像</strong> {n_img}問</div></div></div>')

    nav = ['<div class="sn">']
    for anc, title, _sub, _i in SECTIONS:
        nav.append(f'<button class="nb" onclick="goto(\'{anc}\')">{title}</button>')
    nav.append('</div>')
    parts.append(''.join(nav))

    parts.append('<div class="ct">')
    _bounds = sorted(i for _a, _t, _s, i in SECTIONS) + [len(QUESTIONS)]
    _end = {b: _bounds[k + 1] - 1 for k, b in enumerate(_bounds[:-1])}
    sec_by_idx = {i: (anc, title) for anc, title, _sub, i in SECTIONS}
    for idx, q in enumerate(QUESTIONS):
        if idx in sec_by_idx:
            anc, title = sec_by_idx[idx]
            _lo, _hi = Q_START + idx, Q_START + _end[idx]
            sub = f'Q.{_lo}' if _lo == _hi else f'Q.{_lo}〜Q.{_hi}'
            parts.append(f'<div id="{anc}"><div class="sh"><div class="snum">§</div>'
                         f'<h2>{title}</h2><div class="sc">{sub}</div></div></div>')
        parts.append(render_card(Q_START + idx, q))
    parts.append('</div>')

    parts.append("""
<script>
var pb=document.getElementById('pb');
window.addEventListener('scroll',function(){var h=document.documentElement;var sc=h.scrollTop/(h.scrollHeight-h.clientHeight)*100;pb.style.width=sc+'%';});
function goto(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
</script>
</body>
</html>""")
    OUT.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {OUT.name}  {len(QUESTIONS)}q (star {n_star}, img {n_img})  {OUT.stat().st_size//1024}KB')


if __name__ == '__main__':
    emit()
