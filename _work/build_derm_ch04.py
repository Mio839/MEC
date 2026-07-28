# -*- coding: utf-8 -*-
"""
皮膚科 第4章「角化症」(NO.82-98) の章別HTML(皮膚科/ch04_kakukashou.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、産婦人科(obg)水準で作成。build_derm_ch03.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・皮膚科 皮Q-50〜59／PDF p.53-62)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.155-159) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

画像は8問13枚。図ラベル(A/B)は**ラベル文字の x 座標**で帰属を決めた
（NO.85・92・95 は紙面のテキスト順が "B A" だが、座標では左がA）。
NO.89(115F-35) と NO.90(109B-45) は同一ページに図が上下2枚あり、**y座標**で設問へ割り当てた。
⚠️ NO.92(105G-51) と NO.95(101H-24) は**同一症例・同一写真を使う別年度の問題**（選択肢eだけが違う）。
重複ではないので両方残し、画像はそれぞれの国試番号で保存してある。

複数選択は NO.93・94 の2問（いずれも2つ選べ）。
否定形は NO.83（頻度が最も低い）・NO.98（誤っているもの）の2問。
**NO.88・97・98 は解答一覧表に正答率が無い**（rate=None → .cr を出さない。採点除外ではないので bx は付けない）。
必修バッジ(bh)は NO.91 の1問。CBTバッジ(bc)は NO.85・89 の2問。

本章の低正答率問題: NO.82(44%)・NO.83(55%)・NO.95(59%)・NO.86(61%)・NO.92(72%)・NO.85(74%)。
尋常性乾癬は NO.83・86・89・90・91・93・94・96 で、
扁平苔癬は NO.85・92・94・95・97・98 で繰り返し問われるので相互参照を張ってある。
Köbner現象は NO.89・90・93・94 の4問で問われる本章最頻出の概念。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '皮膚科' / 'ch04_kakukashou.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 82

FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs or [], ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.82-83
# ============================================================
QUESTIONS += [

Q('116A-39', 44, [('bs', '★'), ('bi', '📷')],
  '20歳の女性。<span class="kw">腹部の皮疹</span>を主訴に来院した。'
  '1か月前から腹部に多発する皮疹が出現し消退せず持続している。<span class="kw4">瘙痒はない</span>。'
  '<span class="kw">母親も15歳から同様の皮疹が認められ、Kaposi水痘様発疹症をしばしば発症する</span>。発熱はない。'
  '<span class="kw">頸部、腋窩、肋骨部、乳房下、腹部、鼠径に暗褐色の丘疹が多発</span>している。'
  '<span class="kw">患者と母親にATP2A2遺伝子の同じ部位の変異が同定</span>された。'
  '腹部の写真（A）と生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', 'Sweet病', False, '<span class="kw4">発熱と有痛性の浮腫性紅色局面が急性に多発し、'
                     '真皮に好中球がびまん性に浸潤する</span>疾患。'
                     '<span class="kw4">遺伝性ではなく、家族内発症もしない</span>。'
                     '本例は発熱がなく、皮疹も1か月持続する暗褐色丘疹である。'),
   ('b', 'Darier病', True, '<span class="kw3">ATP2A2遺伝子（SERCA2をコードする）の変異による常染色体顕性遺伝の角化症</span>。'
                     '<span class="kw3">脂漏部位（頸部・腋窩・前胸部・乳房下・鼠径）に角化性の暗褐色丘疹が多発し、'
                     '母娘で同じ変異が同定されている</span>。'
                     '<span class="kw3">Kaposi水痘様発疹症を反復する</span>のもDarier病の代表的な合併症である。'),
   ('c', 'Kaposi肉腫', False, '<span class="kw4">HHV-8によって生じる血管性腫瘍</span>。'
                     '<span class="kw4">AIDS関連型では下肢・体幹・口腔に暗紫紅色の斑・局面・結節を生じる</span>。'
                     '<span class="kw4">遺伝性ではなく、脂漏部位に左右対称の角化性丘疹を作る疾患でもない</span>。'
                     '「Kaposi水痘様発疹症」とは名前が似ているだけで無関係である。'),
   ('d', '尋常性天疱瘡', False, '<span class="kw4">抗デスモグレイン3抗体による表皮内（棘融解）水疱症</span>。'
                     '<span class="kw4">口腔粘膜のびらんで初発し、正常皮膚上に弛緩性水疱を生じ、Nikolsky現象陽性</span>。'
                     '<span class="kw4">病理では棘融解を認めるためDarier病と紛らわしいが、自己免疫性で遺伝性ではなく、'
                     '主病変は水疱・びらんであって角化性丘疹ではない</span>。'),
   ('e', 'アトピー性皮膚炎', False, '<span class="kw4">瘙痒・特徴的な皮疹と分布・慢性反復性の経過</span>が診断の3本柱。'
                     '<span class="kw4">本例は「瘙痒はない」と明記</span>されており、この時点で否定できる。'
                     'なお<span class="kw">アトピー性皮膚炎もKaposi水痘様発疹症を起こす</span>ため'
                     '（<span class="kw">Q.29</span>）、'
                     'その一点だけで飛びつかないよう注意する。')],
  'ATP2A2遺伝子変異が母娘で同定され、脂漏部位に瘙痒のない暗褐色角化性丘疹が多発。Kaposi水痘様発疹症を反復。Darier病（毛囊角化症）。',
  imgs=['images/116A-39_1.jpeg', 'images/116A-39_2.jpeg'],
  patho=('🧬 Darier病——カルシウムポンプの故障が「接着」を壊す',
         '<span class="kw3">Darier病〈毛囊角化症・dyskeratosis follicularis〉</span>は'
         '<span class="kw3">ATP2A2遺伝子のヘテロ変異による常染色体顕性遺伝（優性遺伝）の角化異常症</span>である。'
         '<span class="kw3">家族歴があること（本例では母親も同じ変異）</span>が'
         '診断の強い手がかりになる。<br>'
         '<span class="kw3">病態は「小胞体のカルシウムポンプが壊れる」の一点から説明できる</span>。'
         '<span class="kw3">ATP2A2がコードするSERCA2は、細胞質のCa²⁺を小胞体へ汲み戻すポンプ</span>である。'
         '<span class="kw3">これが機能を失うと小胞体内のCa²⁺が不足し、'
         'デスモソーム（細胞間接着装置）の構成蛋白が正しく折りたたまれず、表面へ運ばれなくなる</span>。'
         '結果として<span class="kw3">①角化細胞どうしの接着が失われて棘融解〈acantholysis〉が起こり、'
         '②接着を失った細胞が個々にバラバラの異常角化（dyskeratosis）を起こす</span>。'
         '<span class="kw3">病理でこの2つが同時に見えるのがDarier病の決め手</span>で、'
         '<span class="kw3">異常角化した細胞は、有棘層では「円形体〈corps ronds〉」、'
         '角層では「顆粒体〈grains〉」と呼ばれる特徴的な形態</span>をとる。'
         '<span class="kw3">基底層直上に棘融解による裂隙（suprabasal cleft）</span>ができ、'
         '<span class="kw3">絨毛〈villi〉と呼ばれる真皮乳頭の突出</span>を伴う。<br>'
         '<span class="kw3">臨床像</span>は'
         '<span class="kw3">思春期以降に発症し、脂漏部位（前胸部・背部正中・頸部・腋窩・乳房下・鼠径）に'
         '角化性の褐色〜暗褐色の丘疹が多発・融合して疣状の局面をつくる</span>。'
         '<span class="kw3">高温・多湿・発汗・日光で悪化</span>し、'
         '<span class="kw3">悪臭を伴うことがある</span>。'
         '<span class="kw3">手掌・足底の点状陥凹、爪の縦線条と遠位のV字型切れ込み（V-shaped nick）、'
         '手背の疣贅状丘疹（疣贅状肢端角化症）、口腔粘膜の白色小丘疹</span>という'
         '<span class="kw3">爪と手掌の所見が診断を裏づける</span>。<br>'
         '<span class="kw3">最重要の合併症がKaposi水痘様発疹症</span>である。'
         '<span class="kw3">角層バリアが壊れているため単純ヘルペスウイルスが広範に播種し、'
         '高熱とともに中心臍窩をもつ小水疱が集簇する</span>（<span class="kw">Q.29・Q.42</span>）。'
         '<span class="kw3">本例の「母親がKaposi水痘様発疹症をしばしば発症する」という記載は、'
         'Darier病を示す積極的な所見</span>として置かれている。'),
  deep=('📌 病理で「棘融解」を示す疾患を並べる',
        '<span class="kw3">棘融解〈acantholysis〉は角化細胞どうしの接着が失われる現象</span>で、'
        '<span class="kw3">自己免疫性（抗体が接着分子を攻撃する）と遺伝性（接着分子の産生・輸送が破綻する）に'
        '大きく分かれる</span>。'
        '<table class="tb"><tr><th>疾患</th><th>機序</th><th>臨床像</th></tr>'
        '<tr><td><span class="kw3">尋常性天疱瘡</span></td>'
        '<td><span class="kw3">抗デスモグレイン3（±1）抗体</span></td>'
        '<td><span class="kw3">口腔粘膜びらんで初発、弛緩性水疱、Nikolsky陽性</span></td></tr>'
        '<tr><td>落葉状天疱瘡</td><td><span class="kw3">抗デスモグレイン1抗体</span></td>'
        '<td>浅い水疱・落屑、<span class="kw3">粘膜は侵さない</span></td></tr>'
        '<tr><td><span class="kw3">Darier病</span></td>'
        '<td><span class="kw3">ATP2A2（SERCA2）変異・常染色体顕性</span></td>'
        '<td><span class="kw3">脂漏部位の角化性褐色丘疹、爪のV字切れ込み</span></td></tr>'
        '<tr><td><span class="kw3">Hailey-Hailey病〈家族性良性慢性天疱瘡〉</span></td>'
        '<td><span class="kw3">ATP2C1（SPCA1・ゴルジ体のCa²⁺ポンプ）変異・常染色体顕性</span></td>'
        '<td><span class="kw3">間擦部（腋窩・鼠径・頸部）にびらん・亀裂。'
        '病理は「崩れかけたレンガ塀」様の広範な棘融解</span></td></tr>'
        '<tr><td>Grover病（一過性棘融解性皮膚症）</td><td>不明（発汗・臥床が誘因）</td>'
        '<td>中高年男性の体幹に瘙痒性丘疹</td></tr></table>'
        '<span class="kw3">Darier病とHailey-Hailey病は「兄弟疾患」</span>である。'
        '<span class="kw3">どちらも常染色体顕性遺伝で、細胞内Ca²⁺ポンプの遺伝子変異（ATP2A2／ATP2C1）により'
        '棘融解を起こす</span>——'
        '<span class="kw3">Darierは小胞体のSERCA2、Hailey-Haileyはゴルジ体のSPCA1</span>と対で覚える。'
        '<span class="kw3">臨床では、Darierが脂漏部位の角化性丘疹、'
        'Hailey-Haileyが間擦部のびらん・亀裂</span>と分布と性状で区別できる。<br>'
        '<span class="kw3">Darier病の治療</span>は'
        '<span class="kw3">①遮光・高温多湿の回避・発汗対策・二次感染の予防</span>という生活指導が基本で、'
        '<span class="kw3">②外用（ステロイド・活性型ビタミンD3・レチノイド外用・尿素）</span>、'
        '<span class="kw3">③重症例には内服レチノイド（エトレチナート）</span>を用いる。'
        '<span class="kw4">エトレチナートは強い催奇形性があり、女性では投与終了後2年間の避妊が必要</span>で、'
        '<span class="kw4">本例のような20歳女性では慎重な適応判断と説明を要する</span>。'
        '<span class="kw3">Kaposi水痘様発疹症を起こしたら直ちにアシクロビル</span>を開始する。'),
  point=('🎯 国試ポイント',
         '① Darier病＝<span class="kw3">ATP2A2（SERCA2）変異・常染色体顕性遺伝</span>。<br>'
         '② 皮疹＝<span class="kw3">脂漏部位（前胸・背正中・頸・腋窩・鼠径）の角化性褐色丘疹</span>、'
         '高温多湿・発汗・日光で悪化。<br>'
         '③ 爪＝<span class="kw3">縦線条と遠位のV字型切れ込み</span>、'
         '手掌の<span class="kw3">点状陥凹</span>。<br>'
         '④ 病理＝<span class="kw3">棘融解＋異常角化（corps ronds・grains）＋基底層直上の裂隙</span>。<br>'
         '⑤ 合併症＝<span class="kw3">Kaposi水痘様発疹症を反復</span>する。<br>'
         '⑥ 兄弟疾患＝<span class="kw3">Hailey-Hailey病（ATP2C1・間擦部のびらん）</span>。<br>'
         '⑦ 治療＝生活指導＋外用、重症例に<span class="kw3">エトレチナート</span>'
         '（<span class="kw4">催奇形性・女性は2年間避妊</span>）。')),

Q('116F-9', 55, [('bs', '★')],
  '<strong>粘膜疹が見られる頻度が最も<span class="kw4">低い</span>のはどれか。</strong>',
  [('a', '扁平苔癬', False, '<span class="kw4">口腔粘膜（とくに頬粘膜）にレース状・網目状の白色線条〈Wickham線条〉を生じ、'
                     '粘膜病変だけで発症することもある</span>'
                     '（<span class="kw">Q.85・Q.92・Q.95・Q.97</span>）。'
                     '<span class="kw4">口腔扁平苔癬は有病率の高い粘膜疾患</span>である。'),
   ('b', '尋常性乾癬', True, '<span class="kw3">尋常性乾癬は粘膜を侵さないのが原則</span>である。'
                     '<span class="kw3">病変は角層の異常増殖（角化）であり、角層をもたない粘膜では'
                     '同じ病理が成立しにくい</span>。'
                     '<span class="kw3">例外的に「地図状舌」「亀頭の紅斑」が見られることはあるが頻度は低い</span>。'),
   ('c', '膿疱性乾癬', False, '<span class="kw4">全身型では粘膜病変が比較的よく見られる</span>。'
                     '<span class="kw4">地図状舌・溝状舌などの舌病変</span>が'
                     '<span class="kw4">膿疱性乾癬の診断基準の副症状</span>に含まれており'
                     '（<span class="kw">Q.84</span>）、'
                     '同じ「乾癬」でも尋常性とは粘膜への出方が異なる。'),
   ('d', '尋常性天疱瘡', False, '<span class="kw4">大半の症例が口腔粘膜のびらんで初発し、'
                     '皮膚病変に数か月先行することも多い</span>。'
                     '<span class="kw4">抗デスモグレイン3抗体は粘膜型のデスモグレインを標的にする</span>ため、'
                     '粘膜病変が前面に出るのは理にかなっている。'),
   ('e', '多形滲出性紅斑', False, '<span class="kw4">粘膜疹を伴うものはEM major と呼ばれ、'
                     'さらに重症化するとSJS／TENへ連続する</span>'
                     '（<span class="kw">Q.60・Q.74</span>）。'
                     '<span class="kw4">口唇・口腔のびらんは典型的に見られる</span>。')],
  '尋常性乾癬は角層の異常増殖が本態であり、粘膜を侵さないのが原則。扁平苔癬・膿疱性乾癬・尋常性天疱瘡・多形滲出性紅斑はいずれも粘膜疹を伴う。',
  patho=('👄 「粘膜を侵すか」で皮膚疾患を仕分ける',
         '<span class="kw3">粘膜疹の有無は、皮膚疾患を鑑別する最も強力な軸の一つ</span>である。'
         '<span class="kw3">口腔・眼・外陰の粘膜は角層をもたない（非角化重層扁平上皮）</span>ため、'
         '<span class="kw3">「角層に起こる病気」は粘膜に出ず、'
         '「細胞間接着や基底膜、免疫反応の病気」は粘膜にも出る</span>——'
         'この原理で整理すると丸暗記が要らなくなる。'
         '<table class="tb"><tr><th></th><th>疾患</th><th>粘膜に出る／出ない理由</th></tr>'
         '<tr><td><span class="kw3">出る</span></td>'
         '<td><span class="kw3">尋常性天疱瘡</span></td>'
         '<td><span class="kw3">抗デスモグレイン3抗体。Dsg3は粘膜に豊富</span></td></tr>'
         '<tr><td><span class="kw3">出る</span></td><td><span class="kw3">扁平苔癬</span></td>'
         '<td><span class="kw3">基底細胞に対するT細胞性の界面皮膚炎。粘膜上皮にも基底細胞がある</span></td></tr>'
         '<tr><td><span class="kw3">出る</span></td>'
         '<td><span class="kw3">SJS／TEN・多形滲出性紅斑（major）</span></td>'
         '<td><span class="kw3">上皮細胞のアポトーシス。粘膜上皮も同じ標的</span></td></tr>'
         '<tr><td><span class="kw3">出る</span></td><td><span class="kw3">Behçet病</span></td>'
         '<td><span class="kw3">再発性アフタが主症状</span></td></tr>'
         '<tr><td><span class="kw3">出る</span></td><td><span class="kw3">膿疱性乾癬</span></td>'
         '<td><span class="kw3">地図状舌・溝状舌が診断基準の副症状</span></td></tr>'
         '<tr><td><span class="kw4">出ない</span></td>'
         '<td><span class="kw4">尋常性乾癬</span></td>'
         '<td><span class="kw4">角層の異常増殖（錯角化＋Munro微小膿瘍）が本態。粘膜に角層がない</span></td></tr>'
         '<tr><td><span class="kw4">出ない</span></td><td><span class="kw4">落葉状天疱瘡</span></td>'
         '<td><span class="kw4">抗Dsg1抗体のみ。粘膜ではDsg3が代償する</span></td></tr>'
         '<tr><td><span class="kw4">出ない</span></td>'
         '<td><span class="kw4">ブドウ球菌性熱傷様皮膚症候群〈SSSS〉</span></td>'
         '<td><span class="kw4">表皮剝脱毒素の標的がDsg1。TENとの最重要鑑別点</span></td></tr></table>'
         '<span class="kw3">デスモグレイン代償説〈desmoglein compensation theory〉</span>は'
         'この表の理屈そのもので、'
         '<span class="kw3">粘膜ではDsg3が優位に、皮膚上層ではDsg1が優位に発現している</span>ため、'
         '<span class="kw3">Dsg1だけが壊れても粘膜はDsg3が支えて水疱ができない</span>。'
         '<span class="kw3">落葉状天疱瘡とSSSSが粘膜を侵さない理由が同じ</span>なのはこのためである。'),
  deep=('📌 尋常性乾癬に「粘膜疹が無い」ことの臨床的な意味',
        '<span class="kw3">尋常性乾癬〈psoriasis vulgaris〉</span>は'
        '<span class="kw3">表皮角化細胞のターンオーバーが著しく亢進（正常45日→数日）し、'
        '角層が未熟なまま厚く積み上がる疾患</span>である。'
        '<span class="kw3">病理は錯角化・顆粒層の消失・表皮突起の棍棒状延長・'
        '角層下のMunro微小膿瘍</span>で（<span class="kw">Q.86</span>）、'
        '<span class="kw3">いずれも「角層と表皮」の異常</span>である。'
        '<span class="kw3">粘膜には角層も顆粒層も無いので、この病理は成立しにくい</span>。<br>'
        '<span class="kw4">ただし「絶対に出ない」わけではない</span>点も知っておきたい。'
        '<span class="kw3">①地図状舌〈benign migratory glossitis〉</span>——'
        '<span class="kw3">乾癬患者に健常者より高頻度に見られ、膿疱性乾癬では診断基準の副症状</span>である'
        '（<span class="kw">Q.84</span>）。'
        '<span class="kw3">②亀頭包皮の紅斑</span>——'
        '<span class="kw3">陰茎亀頭に生じる乾癬は鱗屑を欠く境界明瞭な紅斑</span>となる。'
        '<span class="kw4">本問が「見られる頻度が最も低い」という慎重な表現を使っているのはこのため</span>で、'
        '<span class="kw4">「粘膜疹は絶対にない」と断定する設問ではない</span>ことに注意する。<br>'
        '<span class="kw3">口腔粘膜病変を見たときの鑑別</span>を整理しておく。'
        '<table class="tb"><tr><th>所見</th><th>疾患</th></tr>'
        '<tr><td><span class="kw3">レース状・網目状の白色線条</span></td>'
        '<td><span class="kw3">扁平苔癬（Wickham線条）</span></td></tr>'
        '<tr><td><span class="kw3">こすっても取れない均一な白色板</span></td>'
        '<td><span class="kw3">白板症（前癌病変・生検が必要）</span></td></tr>'
        '<tr><td><span class="kw3">こすると取れる白苔</span></td>'
        '<td><span class="kw3">口腔カンジダ症</span></td></tr>'
        '<tr><td><span class="kw3">有痛性の円形アフタが再発</span></td>'
        '<td><span class="kw3">Behçet病・再発性アフタ性口内炎</span></td></tr>'
        '<tr><td><span class="kw3">広範なびらん・血痂を伴う出血性口唇炎</span></td>'
        '<td><span class="kw3">SJS／TEN</span>（<span class="kw">Q.69</span>）</td></tr>'
        '<tr><td><span class="kw3">緩徐に拡大する弛緩性水疱・びらん</span></td>'
        '<td><span class="kw3">尋常性天疱瘡</span></td></tr>'
        '<tr><td>Koplik斑（頬粘膜の白色小斑）</td><td>麻疹</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">尋常性乾癬は粘膜を侵さないのが原則</span>（角層の病気だから）。<br>'
         '② 粘膜疹を伴う＝<span class="kw3">扁平苔癬・尋常性天疱瘡・SJS/TEN・多形滲出性紅斑（major）・'
         'Behçet病・膿疱性乾癬</span>。<br>'
         '③ <span class="kw3">デスモグレイン代償説</span>——'
         '<span class="kw3">粘膜はDsg3優位</span>なので、'
         '<span class="kw3">抗Dsg1のみの落葉状天疱瘡とSSSSは粘膜を侵さない</span>。<br>'
         '④ <span class="kw3">膿疱性乾癬では地図状舌が診断基準の副症状</span>'
         '（<span class="kw">Q.84</span>）。<br>'
         '⑤ 口腔の白色病変＝<span class="kw3">扁平苔癬（レース状）／白板症（取れない）／'
         'カンジダ（取れる）</span>。<br>'
         '⑥ 尋常性乾癬でも<span class="kw3">地図状舌・亀頭の紅斑</span>はまれに見られる。<br>'
         '⑦ <span class="kw3">「粘膜疹の有無」は皮膚疾患の鑑別で最強の軸の一つ</span>。')),

]

# ============================================================
# B問題（★問題） NO.84-88
# ============================================================
QUESTIONS += [

Q('115A-21', 79, [('bs', '★'), ('bi', '📷')],
  '35歳の男性。<span class="kw">発熱と全身の皮疹</span>を主訴に来院した。'
  '<span class="kw">8年前に尋常性乾癬と診断され副腎皮質ステロイド外用薬を塗布していた</span>。'
  '<span class="kw">7日前から39℃台の発熱とともに、急速に紅斑が全身に拡大</span>したため受診した。'
  '受診時<span class="kw">紅斑上に径5mmまでの小膿疱が多発し、集簇</span>する。'
  '<span class="kw">地図状舌</span>を認める。'
  '血液所見：白血球16,000（桿状核好中球15％、分葉核好中球70％、好酸球3％、単球5％、リンパ球7％）。'
  '血液生化学所見：<span class="kw">血清アルブミン3.0g/dL</span>。CRP 15.0mg/dL。'
  '<span class="kw4">膿疱からの細菌培養検査は陰性、真菌鏡検とTzanck試験はいずれも陰性</span>であった。'
  '皮膚生検で<span class="kw">Kogoj海綿状膿疱</span>を認める。体幹の写真を示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '膿疱性乾癬', True, '<span class="kw3">尋常性乾癬の既往をもつ患者に、発熱とともに全身の紅斑と'
                     '無菌性の小膿疱が急速に拡大</span>——'
                     '<span class="kw3">汎発性膿疱性乾癬〈GPP〉の典型像</span>である。'
                     '<span class="kw3">地図状舌・白血球増多・低アルブミン血症・Kogoj海綿状膿疱</span>は'
                     'いずれも診断基準の項目そのもの。'),
   ('b', '伝染性膿痂疹', False, '<span class="kw4">黄色ブドウ球菌（またはA群溶連菌）による表在性の皮膚感染症</span>。'
                     '<span class="kw4">小児に多く、水疱・びらん・蜜色の痂皮が接触で広がる（とびひ）</span>。'
                     '<span class="kw4">本例は細菌培養が陰性で「無菌性膿疱」であり、感染症ではない</span>。'),
   ('c', '疱疹状皮膚炎', False, '<span class="kw4">Duhring疱疹状皮膚炎。IgA沈着を伴い、'
                     '肘・膝・殿部の伸側に強い瘙痒を伴う小水疱・丘疹が集簇</span>する。'
                     '<span class="kw4">セリアック病（グルテン過敏性腸症）を高率に合併</span>し、'
                     'DDSが著効する。膿疱ではなく水疱で、高熱も伴わない。'),
   ('d', 'Kaposi水痘様発疹症', False, '<span class="kw4">既存の湿疹病変に単純ヘルペスウイルスが広範に播種したもの</span>'
                     '（<span class="kw">Q.29・Q.42</span>）。'
                     '<span class="kw4">中心臍窩をもつ小水疱が集簇するが、'
                     '本例はTzanck試験が陰性（多核巨細胞なし）でHSVを否定</span>している。'),
   ('e', 'ブドウ球菌性熱傷様皮膚症候群', False, '<span class="kw4">黄色ブドウ球菌の表皮剝脱毒素により顆粒層で表皮が浅く裂ける</span>。'
                     '<span class="kw4">乳幼児に多く、口囲の放射状亀裂とNikolsky現象陽性の広範な表皮剝離を来す</span>。'
                     '<span class="kw4">膿疱が主病変ではなく、35歳の成人に生じることもまれ</span>である。')],
  '尋常性乾癬の既往のある成人に、高熱とともに全身の紅斑と無菌性小膿疱が急速拡大。地図状舌・白血球増多・低アルブミン血症・Kogoj海綿状膿疱。汎発性膿疱性乾癬。',
  imgs=['images/115A-21_1.jpeg'],
  patho=('🔥 汎発性膿疱性乾癬〈GPP〉——「無菌性膿疱」の全身病',
         '<span class="kw3">膿疱性乾癬（汎発型・GPP）</span>は'
         '<span class="kw3">全身の潮紅の上に無菌性膿疱が多発し、発熱・全身倦怠感を伴う重症の乾癬</span>で、'
         '<span class="kw3">日本では指定難病</span>に含まれる。'
         '<span class="kw3">尋常性乾癬から移行する例（本例）</span>と'
         '<span class="kw3">初発から膿疱性の例</span>があり、'
         '<span class="kw4">誘因としてステロイド全身投与の急な中止・感染・妊娠・低カルシウム血症</span>が'
         'よく知られている。<br>'
         '<span class="kw3">病態は自然免疫（IL-36経路）の暴走</span>である。'
         '<span class="kw3">IL-36受容体拮抗因子をコードするIL36RN遺伝子の変異（DITRA）</span>が'
         '一部の症例で見つかり、'
         '<span class="kw3">IL-36シグナルが抑えられずに角化細胞から好中球走化因子が大量に出て、'
         '表皮内へ好中球が押し寄せる</span>。'
         '<span class="kw3">尋常性乾癬がIL-23／Th17軸（獲得免疫）主体であるのに対し、'
         'GPPはIL-36軸（自然免疫）主体</span>という対比が、治療の違いにも直結する。<br>'
         '<span class="kw3">診断基準（厚労省）</span>は'
         '<span class="kw3">①発熱あるいは全身倦怠感、②全身または広範囲の潮紅を伴う無菌性膿疱の多発、'
         '③病理組織学的にKogoj海綿状膿疱を特徴とする膿疱、④以上の臨床・組織像を繰り返す</span>で、'
         '<span class="kw3">①〜③を満たせば確定</span>とされる。'
         '<span class="kw3">Kogoj海綿状膿疱〈spongiform pustule of Kogoj〉</span>は'
         '<span class="kw3">表皮有棘層上部で、変性した角化細胞が作る海綿状の網目の中に好中球が集簇したもの</span>で、'
         '<span class="kw3">尋常性乾癬のMunro微小膿瘍（角層内）より深い層にできる</span>'
         '（<span class="kw">Q.86</span>）。<br>'
         '<span class="kw3">検査所見</span>は'
         '<span class="kw3">白血球増多（好中球優位）・CRP上昇・赤沈亢進・低アルブミン血症・低カルシウム血症</span>で、'
         '<span class="kw3">本例のアルブミン3.0は、広範な皮膚炎症による蛋白漏出と全身の異化亢進</span>を示す。'
         '<span class="kw3">重症例では脱水・循環不全・低体温・急性呼吸窮迫症候群〈ARDS〉・'
         '心不全・敗血症で致死的</span>となる。'
         '<span class="kw3">地図状舌・溝状舌</span>は副症状として重要で、'
         '<span class="kw3">尋常性乾癬では粘膜病変がほぼ無いのに対し、膿疱性乾癬では舌病変が出る</span>のが'
         '対比になる（<span class="kw">Q.83</span>）。'),
  deep=('📌 無菌性膿疱を作る疾患と、GPPの治療',
        '<span class="kw3">「膿疱＝細菌感染」と短絡しないこと</span>が本問の最大の教訓である。'
        '<span class="kw3">本例では細菌培養・真菌鏡検・Tzanck試験の3つをすべて陰性と示して、'
        '感染性（細菌・真菌・ウイルス）を明示的に除外している</span>。'
        '<table class="tb"><tr><th>疾患</th><th>膿疱の場所・特徴</th><th>手がかり</th></tr>'
        '<tr><td><span class="kw3">膿疱性乾癬</span></td>'
        '<td><span class="kw3">全身の潮紅上に散在〜集簇、Kogoj海綿状膿疱</span></td>'
        '<td><span class="kw3">高熱・白血球増多・低Alb・地図状舌・乾癬の既往</span></td></tr>'
        '<tr><td><span class="kw3">掌蹠膿疱症</span></td>'
        '<td><span class="kw3">手掌・足底に限局した無菌性膿疱と鱗屑</span></td>'
        '<td><span class="kw3">病巣感染（扁桃炎・歯性感染）・喫煙・金属アレルギー、'
        '胸鎖肋関節炎（掌蹠膿疱症性骨関節炎）</span></td></tr>'
        '<tr><td><span class="kw3">急性汎発性発疹性膿疱症〈AGEP〉</span></td>'
        '<td><span class="kw3">浮腫性紅斑上に多数の小膿疱</span></td>'
        '<td><span class="kw3">薬剤投与後数日で急性発症、中止で1〜2週で軽快</span>'
        '（<span class="kw">Q.59</span>）</td></tr>'
        '<tr><td>角層下膿疱症</td><td>間擦部の弛緩性膿疱（上下2層に分かれる）</td>'
        '<td>IgA単クローン性γグロブリン血症</td></tr>'
        '<tr><td>好酸球性膿疱性毛包炎</td><td>顔面の環状に配列する毛包一致性丘疹・膿疱</td>'
        '<td>好酸球増多、インドメタシンが有効</td></tr>'
        '<tr><td><span class="kw4">伝染性膿痂疹・毛包炎</span></td><td>膿疱・痂皮</td>'
        '<td><span class="kw4">培養陽性（黄色ブドウ球菌・溶連菌）＝これだけが感染性</span></td></tr></table>'
        '<span class="kw3">GPPの治療</span>は'
        '<span class="kw3">①全身管理（輸液・電解質補正・保温・栄養・感染予防）</span>と'
        '<span class="kw3">②全身療法</span>の2本立てである。'
        '<span class="kw3">第一選択は、生物学的製剤（IL-17阻害薬＝セクキヌマブ・ブロダルマブ・イキセキズマブ、'
        'IL-23阻害薬、TNF-α阻害薬、そしてIL-36受容体阻害薬スペソリマブ）</span>で、'
        '<span class="kw3">スペソリマブは急性増悪に対し1回投与で膿疱を消退させる</span>。'
        'ほかに<span class="kw3">エトレチナート（レチノイド）・シクロスポリン・メトトレキサート・顆粒球吸着療法</span>。'
        '<span class="kw4">ステロイド全身投与は、中止・減量時に膿疱性乾癬を誘発・悪化させるため原則として避ける</span>——'
        '<span class="kw4">「乾癬にステロイド内服は使わない」は国試の定番</span>である'
        '（<span class="kw">Q.96</span>）。'),
  point=('🎯 国試ポイント',
         '① 膿疱性乾癬＝<span class="kw3">発熱＋全身の潮紅＋無菌性膿疱＋Kogoj海綿状膿疱</span>。'
         '指定難病。<br>'
         '② 検査＝<span class="kw3">白血球増多・CRP上昇・低アルブミン血症・低Ca血症</span>。<br>'
         '③ <span class="kw3">地図状舌・溝状舌</span>が副症状'
         '（尋常性乾癬は粘膜を侵さない・<span class="kw">Q.83</span>）。<br>'
         '④ 誘因＝<span class="kw4">ステロイド全身投与の急な中止</span>・感染・妊娠・低Ca。<br>'
         '⑤ 病態＝<span class="kw3">IL-36経路（IL36RN変異＝DITRA）</span>。'
         '尋常性乾癬は<span class="kw3">IL-23／Th17</span>。<br>'
         '⑥ 治療＝<span class="kw3">生物学的製剤（IL-17・IL-23・TNF-α阻害薬、IL-36R阻害薬スペソリマブ）</span>、'
         'エトレチナート、シクロスポリン。<br>'
         '⑦ 無菌性膿疱＝<span class="kw3">膿疱性乾癬・掌蹠膿疱症・AGEP・角層下膿疱症</span>——'
         '<span class="kw4">培養陰性を確認する</span>。')),

Q('113A-41', 74, [('bs', '★'), ('bc', 'CBT'), ('bi', '📷')],
  '57歳の女性。<span class="kw">下肢の皮疹</span>を主訴に来院した。'
  '<span class="kw">6か月前から激しい瘙痒を伴う皮疹が多発</span>し、自宅近くの診療所で副腎皮質ステロイド外用薬を'
  '処方されているが、寛解と増悪を繰り返すため受診した。'
  '<span class="kw">下肢の広範囲に米粒大から爪甲大の丘疹、結節が多発し、'
  '表面は紫紅色調で光沢を帯び、白色線条を伴う</span>。'
  '<span class="kw4">既往歴に特記すべきことはない。内服している薬はない</span>。'
  '皮膚生検を施行したところ、'
  '<span class="kw">表皮基底細胞の液状変性と表皮直下の帯状細胞浸潤</span>を認めた。'
  '下肢の写真（A）及び生検組織のH-E染色標本（B）を示す。<br>'
  '<strong>さらに確認すべき部位はどれか。</strong>',
  [('a', '頭　皮', False, '<span class="kw4">扁平苔癬が頭皮に生じると毛孔性扁平苔癬となり瘢痕性脱毛を残す</span>ため'
                     '確認する意味はあるが、'
                     '<span class="kw4">口腔粘膜に比べれば頻度は低く、診断・経過観察上の優先度が下がる</span>。'
                     '被髪頭部の鱗屑性紅斑といえば尋常性乾癬・脂漏性皮膚炎が主。'),
   ('b', '口腔粘膜', True, '<span class="kw3">扁平苔癬は皮膚病変の約半数で口腔粘膜病変を合併し、'
                     '頬粘膜にレース状・網目状の白色線条〈Wickham線条〉を生じる</span>'
                     '（<span class="kw">Q.92・Q.95・Q.97</span>）。'
                     '<span class="kw3">粘膜病変は診断を裏づけるだけでなく、'
                     'びらん型では有棘細胞癌が発生しうるため長期の経過観察を要する</span>。'),
   ('c', '腋　窩', False, '<span class="kw4">腋窩が診断の鍵になるのは、'
                     'Hailey-Hailey病・化膿性汗腺炎・黒色表皮腫・カンジダ性間擦疹・Darier病</span>など。'
                     '扁平苔癬の好発部位ではない。'),
   ('d', '背　部', False, '<span class="kw4">背部（正中の脂漏部位）はDarier病・脂漏性皮膚炎・'
                     'Gibertばら色粃糠疹</span>で見るべき部位。'
                     '扁平苔癬は<span class="kw4">四肢屈側（手関節屈側・前腕・下腿）</span>が好発で、'
                     '背部を特に確認する必然性はない。'),
   ('e', '臍　部', False, '<span class="kw4">臍部は尋常性乾癬の好発部位（機械的刺激を受ける部位）</span>として有名で、'
                     '<span class="kw">Q.87</span>の乾癬性関節炎の症例でも臍部の角化性紅斑が記載されている。'
                     '扁平苔癬とは結びつかない。')],
  '紫紅色で光沢のある扁平丘疹＋白色線条（Wickham線条）、病理は基底細胞の液状変性＋帯状のリンパ球浸潤＝扁平苔癬。皮膚病変の約半数に口腔粘膜病変を伴うため口腔内を確認する。',
  imgs=['images/113A-41_1.jpeg', 'images/113A-41_2.jpeg'],
  patho=('🟣 扁平苔癬——「6つのP」と界面皮膚炎',
         '<span class="kw3">扁平苔癬〈lichen planus〉</span>は'
         '<span class="kw3">表皮基底細胞に対する細胞傷害性T細胞の攻撃（界面皮膚炎）</span>によって生じる'
         '慢性の炎症性角化症である。<br>'
         '<span class="kw3">臨床像は英語の頭文字Pで整理される（6つのP）</span>: '
         '<span class="kw3">Purple（紫紅色）・Polygonal（多角形）・Planar／Flat-topped（扁平で頂面が平ら）・'
         'Pruritic（強い瘙痒）・Papule（丘疹）・Plaque（局面）</span>。'
         'これに<span class="kw3">表面の光沢と、白色の網目状線条〈Wickham線条〉</span>が加わる。'
         '<span class="kw3">Wickham線条は顆粒層の楔状の肥厚を反映した所見</span>で、'
         '<span class="kw3">皮膚でも粘膜でも見られる扁平苔癬の特徴的サイン</span>である。'
         '<span class="kw3">好発部位は手関節屈側・前腕屈側・下腿・腰部</span>で、'
         '<span class="kw3">Köbner現象（外傷部位に線状に新生する）が陽性</span>である'
         '（<span class="kw">Q.94</span>）。<br>'
         '<span class="kw3">病理</span>は問題文にそのまま書かれている。'
         '<span class="kw3">①表皮基底細胞の液状変性（空胞変性・liquefaction degeneration）、'
         '②表皮直下に帯状〈band-like〉のリンパ球浸潤、'
         '③顆粒層の楔状肥厚、④表皮突起の鋸歯状変化（saw-tooth appearance）、'
         '⑤基底層の壊死角化細胞（Civatte小体／コロイド小体）</span>。'
         '<span class="kw3">「基底細胞の液状変性＋帯状リンパ球浸潤」の組合せは'
         '界面皮膚炎〈interface dermatitis〉と総称され、'
         '扁平苔癬・エリテマトーデス・多形滲出性紅斑・GVHD・苔癬型薬疹で共通して見られる</span>。<br>'
         '<span class="kw3">粘膜病変が本問の主題</span>である。'
         '<span class="kw3">皮膚扁平苔癬の40〜60％に口腔病変を伴い、'
         '逆に口腔扁平苔癬の患者の一部にしか皮膚病変が無い</span>。'
         '<span class="kw3">頬粘膜のレース状白色線条（網状型）が最も多く、'
         'ほかに萎縮型・びらん型・水疱型</span>がある。'
         '<span class="kw4">びらん型の口腔扁平苔癬は疼痛が強く、長期経過で有棘細胞癌が発生しうる</span>ため、'
         '<span class="kw3">前癌病変として定期的な観察・必要なら生検</span>を行う。'
         '<span class="kw3">外陰部・腟に生じる vulvovaginal-gingival syndrome</span>もあり、'
         '<span class="kw3">爪では縦線条・翼状片〈pterygium〉・爪甲の消失</span>を来す。'),
  deep=('📌 扁平苔癬の背景疾患と、鑑別の実務',
        '<span class="kw3">扁平苔癬（様の皮疹）を見たら背景を確認する</span>のが臨床の作法である。'
        '<table class="tb"><tr><th>背景</th><th>内容</th></tr>'
        '<tr><td><span class="kw3">C型肝炎ウイルス</span></td>'
        '<td><span class="kw3">扁平苔癬との関連が繰り返し報告されている。HCV抗体を確認する</span></td></tr>'
        '<tr><td><span class="kw3">薬剤（苔癬型薬疹）</span></td>'
        '<td><span class="kw3">降圧薬（ACE阻害薬・βブロッカー・サイアザイド）・金製剤・'
        '抗マラリア薬・NSAID・免疫チェックポイント阻害薬</span>。'
        '<span class="kw3">本例は「内服している薬はない」と明記され薬剤性を除外</span>している</td></tr>'
        '<tr><td><span class="kw3">歯科金属</span></td>'
        '<td><span class="kw3">口腔扁平苔癬では金属との接触部位に一致することがあり、'
        'パッチテストで陽性なら補綴物の除去で改善する</span>（<span class="kw">Q.30</span>）</td></tr>'
        '<tr><td>移植片対宿主病〈GVHD〉</td>'
        '<td><span class="kw3">慢性GVHDの苔癬型病変は扁平苔癬に酷似する</span></td></tr></table>'
        '<span class="kw3">紫紅色の丘疹・局面の鑑別</span>: '
        '<table class="tb"><tr><th>疾患</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">扁平苔癬</span></td>'
        '<td><span class="kw3">多角形・扁平・光沢・Wickham線条・強い瘙痒・口腔粘膜病変</span></td></tr>'
        '<tr><td><span class="kw3">結節性痒疹</span></td>'
        '<td><span class="kw3">搔破による半球状のドーム型結節、中央に痂皮</span></td></tr>'
        '<tr><td>尋常性乾癬</td>'
        '<td><span class="kw3">銀白色の厚い鱗屑・Auspitz現象・伸側好発</span>（<span class="kw">Q.93</span>）</td></tr>'
        '<tr><td>菌状息肉症</td><td>慢性・多形性、病理で異型リンパ球のPautrier微小膿瘍</td></tr>'
        '<tr><td>扁平苔癬様角化症</td><td>孤立性、日光露光部、脂漏性角化症からの移行</td></tr></table>'
        '<span class="kw4">本例が「ステロイド外用で寛解と増悪を繰り返す」</span>のも扁平苔癬らしい経過で、'
        '<span class="kw3">治療は強力なステロイド外用（必要なら密封療法）を主軸に、'
        '抗ヒスタミン薬、広範例ではナローバンドUVB・PUVA・レチノイド内服・'
        'シクロスポリン</span>を用いる。'
        '<span class="kw3">口腔病変にはステロイド軟膏・含嗽、'
        'びらん型では歯科・口腔外科と連携して長期に観察する</span>。'),
  point=('🎯 国試ポイント',
         '① 扁平苔癬＝<span class="kw3">紫紅色・多角形・扁平・光沢・Wickham線条・強い瘙痒</span>（6つのP）。<br>'
         '② 好発＝<span class="kw3">手関節屈側・前腕・下腿</span>。'
         '<span class="kw3">Köbner現象陽性</span>（<span class="kw">Q.94</span>）。<br>'
         '③ <span class="kw3">皮膚病変の約半数に口腔粘膜病変（頬粘膜のレース状白色線条）</span>——'
         '<span class="kw3">必ず口腔内を診る</span>。<br>'
         '④ 病理＝<span class="kw3">基底細胞の液状変性＋帯状リンパ球浸潤（界面皮膚炎）＋'
         '鋸歯状の表皮突起＋Civatte小体</span>。<br>'
         '⑤ 背景＝<span class="kw3">C型肝炎・薬剤（苔癬型薬疹）・歯科金属・GVHD</span>。<br>'
         '⑥ <span class="kw4">びらん型の口腔扁平苔癬は有棘細胞癌のリスク</span>——定期観察。<br>'
         '⑦ 治療＝<span class="kw3">ステロイド外用が主軸</span>、広範例に光線療法・レチノイド。')),

Q('111I-17', 61, [('bs', '★')],
  '<strong>尋常性乾癬の病理組織所見について正しいのはどれか。</strong>',
  [('a', '表皮の海綿状態', False, '<span class="kw4">海綿状態〈spongiosis〉は表皮細胞間の浮腫</span>で、'
                     '<span class="kw4">湿疹・接触皮膚炎・アトピー性皮膚炎に特徴的</span>な所見である。'
                     '<span class="kw4">乾癬では海綿状態は目立たない</span>。'),
   ('b', '表皮顆粒層の肥厚', False, '<span class="kw4">乾癬では顆粒層はむしろ消失・菲薄化する</span>。'
                     '<span class="kw4">角化が速すぎて顆粒層を作る時間がないまま角層になる（錯角化）</span>ためである。'
                     '<span class="kw4">顆粒層が楔状に肥厚するのは扁平苔癬</span>で、'
                     'これがWickham線条の実体である（<span class="kw">Q.85</span>）。'),
   ('c', '表皮基底層の液状変性', False, '<span class="kw4">基底細胞の液状変性は界面皮膚炎の所見</span>で、'
                     '<span class="kw4">扁平苔癬・エリテマトーデス・多形滲出性紅斑・GVHD</span>で見られる'
                     '（<span class="kw">Q.85</span>）。'
                     '乾癬では基底層はむしろ増殖が亢進している。'),
   ('d', '真皮浅層の好酸球浸潤', False, '<span class="kw4">好酸球浸潤は薬疹・水疱性類天疱瘡・虫刺症・'
                     'アレルギー性接触皮膚炎</span>で目立つ。'
                     '<span class="kw4">乾癬に浸潤するのは好中球とリンパ球であって好酸球ではない</span>。'),
   ('e', '角質層下の好中球性小膿瘍', True, '<span class="kw3">角層内（錯角化した角層の中）に好中球が集簇したものが'
                     'Munro微小膿瘍〈Munro microabscess〉</span>で、'
                     '<span class="kw3">尋常性乾癬に特徴的な病理所見</span>である。'
                     '<span class="kw3">表皮有棘層上部にできるKogoj海綿状膿疱（膿疱性乾癬）と対で覚える</span>'
                     '（<span class="kw">Q.84</span>）。')],
  '尋常性乾癬の病理は錯角化・顆粒層の消失・表皮突起の棍棒状延長・真皮乳頭の毛細血管拡張、そして角層内のMunro微小膿瘍（好中球性小膿瘍）。',
  patho=('🔬 尋常性乾癬の病理——「速すぎるターンオーバー」が全部を説明する',
         '<span class="kw3">尋常性乾癬の病理所見は、'
         '「表皮角化細胞のターンオーバーが正常の10倍近く速い（約45日→3〜4日）」という'
         '一点からすべて導ける</span>。'
         '<table class="tb"><tr><th>病理所見</th><th>なぜそうなるか</th></tr>'
         '<tr><td><span class="kw3">錯角化〈parakeratosis〉</span></td>'
         '<td><span class="kw3">角層になっても核が残っている。'
         '成熟する時間がないまま押し上げられるため</span></td></tr>'
         '<tr><td><span class="kw3">顆粒層の消失・菲薄化</span></td>'
         '<td><span class="kw3">ケラトヒアリン顆粒を作る段階を飛ばしてしまう</span></td></tr>'
         '<tr><td><span class="kw3">表皮肥厚（棘細胞層の肥厚）と'
         '表皮突起の棍棒状・規則的な延長</span></td>'
         '<td><span class="kw3">増殖する細胞が増え、表皮が下方へ規則正しく伸びる</span></td></tr>'
         '<tr><td><span class="kw3">真皮乳頭の延長と毛細血管の拡張・蛇行</span></td>'
         '<td><span class="kw3">増殖する表皮を養うため血管が伸びる。'
         '鱗屑を剝がすと点状出血する＝Auspitz現象の実体</span>（<span class="kw">Q.93</span>）</td></tr>'
         '<tr><td><span class="kw3">Munro微小膿瘍（角層内の好中球集簇）</span></td>'
         '<td><span class="kw3">角化細胞が出す好中球走化因子（IL-8/CXCL8等）に引かれて'
         '好中球が角層まで上がってくる</span></td></tr>'
         '<tr><td>真皮上層のリンパ球浸潤</td><td>T細胞（Th17）主体の炎症</td></tr></table>'
         '<span class="kw3">なぜターンオーバーが速くなるのか</span>——'
         '<span class="kw3">病態の中心はIL-23／Th17軸</span>である。'
         '<span class="kw3">樹状細胞が出すIL-23がTh17細胞を維持・活性化し、'
         'Th17がIL-17A・IL-22・TNF-αを産生する</span>。'
         '<span class="kw3">IL-17Aは角化細胞を刺激して増殖させ、抗菌ペプチドやケモカインを出させ、'
         'IL-22は表皮肥厚を促す</span>。'
         '<span class="kw3">この炎症ループが自己増幅するため慢性化する</span>。'
         '<span class="kw3">生物学的製剤（IL-17阻害薬・IL-23阻害薬・TNF-α阻害薬）がよく効く理由が'
         'ここにある</span>。'
         '<span class="kw3">遺伝的にはHLA-Cw6</span>との関連が知られ、'
         '<span class="kw3">環境因子として肥満・喫煙・ストレス・感染（溶連菌＝滴状乾癬）・'
         '薬剤（βブロッカー・リチウム・抗マラリア薬・IFN）</span>が誘因となる。'),
  deep=('📌 病理所見と疾患の対応表——ここを押さえると一気に解ける',
        '<table class="tb"><tr><th>病理所見</th><th>代表疾患</th></tr>'
        '<tr><td><span class="kw3">海綿状態〈spongiosis〉（表皮細胞間浮腫）</span></td>'
        '<td><span class="kw3">湿疹・接触皮膚炎・アトピー性皮膚炎・貨幣状湿疹</span></td></tr>'
        '<tr><td><span class="kw3">錯角化＋顆粒層消失＋Munro微小膿瘍</span></td>'
        '<td><span class="kw3">尋常性乾癬</span></td></tr>'
        '<tr><td><span class="kw3">Kogoj海綿状膿疱（有棘層上部）</span></td>'
        '<td><span class="kw3">膿疱性乾癬</span>（<span class="kw">Q.84</span>）</td></tr>'
        '<tr><td><span class="kw3">基底細胞の液状変性＋帯状リンパ球浸潤＋顆粒層の楔状肥厚</span></td>'
        '<td><span class="kw3">扁平苔癬</span>（<span class="kw">Q.85</span>）</td></tr>'
        '<tr><td><span class="kw3">棘融解＋異常角化（corps ronds・grains）</span></td>'
        '<td><span class="kw3">Darier病</span>（<span class="kw">Q.82</span>）</td></tr>'
        '<tr><td><span class="kw3">基底層直上の棘融解性水疱</span></td>'
        '<td><span class="kw3">尋常性天疱瘡</span></td></tr>'
        '<tr><td><span class="kw3">表皮下水疱＋好酸球浸潤</span></td>'
        '<td><span class="kw3">水疱性類天疱瘡</span></td></tr>'
        '<tr><td><span class="kw3">表皮全層壊死＋表皮下水疱</span></td>'
        '<td><span class="kw3">中毒性表皮壊死症〈TEN〉</span>（<span class="kw">Q.73</span>）</td></tr>'
        '<tr><td><span class="kw3">真皮のびまん性好中球浸潤（血管炎なし）</span></td>'
        '<td><span class="kw3">Sweet病</span>（<span class="kw">Q.64・Q.80</span>）</td></tr>'
        '<tr><td><span class="kw3">隔壁性脂肪織炎</span>／<span class="kw3">小葉性脂肪織炎＋乾酪壊死</span></td>'
        '<td><span class="kw3">結節性紅斑</span>／<span class="kw3">硬結性紅斑</span>'
        '（<span class="kw">Q.58・Q.65</span>）</td></tr>'
        '<tr><td><span class="kw3">表皮内への異型リンパ球浸潤（Pautrier微小膿瘍）</span></td>'
        '<td><span class="kw3">菌状息肉症</span></td></tr></table>'
        '<span class="kw4">Munro微小膿瘍とPautrier微小膿瘍は名前が似ていて紛らわしい</span>。'
        '<span class="kw3">Munroは「好中球が角層に」＝尋常性乾癬、'
        'Pautrierは「異型リンパ球が表皮内に」＝菌状息肉症</span>と、'
        '<span class="kw3">細胞の種類と場所で区別する</span>。'
        '<span class="kw3">Kogojも合わせて「乾癬三兄弟の膿疱：Munro（角層内・尋常性）'
        '／Kogoj（有棘層上部・膿疱性）」</span>と整理しておくとよい。'),
  point=('🎯 国試ポイント',
         '① 尋常性乾癬の病理＝<span class="kw3">錯角化・顆粒層の消失・表皮突起の棍棒状延長・'
         '真皮乳頭の毛細血管拡張・Munro微小膿瘍</span>。<br>'
         '② <span class="kw3">Munro微小膿瘍＝角層内の好中球集簇</span>。<br>'
         '③ <span class="kw3">Kogoj海綿状膿疱＝有棘層上部＝膿疱性乾癬</span>（<span class="kw">Q.84</span>）。<br>'
         '④ <span class="kw4">顆粒層が肥厚するのは扁平苔癬</span>（乾癬は消失）。<br>'
         '⑤ <span class="kw4">海綿状態は湿疹、液状変性は界面皮膚炎、好酸球は薬疹・類天疱瘡</span>。<br>'
         '⑥ 病態＝<span class="kw3">IL-23／Th17軸</span>、'
         '<span class="kw3">HLA-Cw6</span>。生物学的製剤の標的。<br>'
         '⑦ <span class="kw3">Munro（好中球・角層・乾癬）とPautrier（異型リンパ球・表皮内・菌状息肉症）</span>を'
         '取り違えない。')),

Q('105A-25', 85, [('bs', '★'), ('bi', '📷')],
  '56歳の男性。<span class="kw">皮膚の角化性紅斑</span>を主訴に来院した。'
  '<span class="kw">2年前から手指の関節と手関節とに痛みと腫脹とがあり治療を受けていた</span>。'
  '最近、<span class="kw">手指の爪に変形</span>が生じ、'
  '<span class="kw">頭部、四肢関節部および臍部に境界明瞭な角化性紅斑</span>が生じてきた。'
  '<span class="kw">リウマトイド因子〈RF〉陰性</span>。'
  '手指と腹部の写真（A）と紅斑部の生検組織のH-E染色標本（B）とを示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '成人Still病', False, '<span class="kw4">弛張熱・関節炎・咽頭痛を三徴とし、'
                     '発熱時に一致して出没するサーモンピンク疹（リウマトイド疹）</span>を伴う。'
                     '<span class="kw4">血清フェリチンの著増</span>が特徴的。'
                     '<span class="kw4">境界明瞭な角化性紅斑や爪変形は来さない</span>。'),
   ('b', '乾癬性関節炎', True, '<span class="kw3">被髪頭部・四肢関節伸側・臍部という乾癬の好発部位に'
                     '境界明瞭な角化性紅斑があり、爪変形と関節炎を伴い、RF陰性</span>——'
                     '<span class="kw3">乾癬性関節炎〈psoriatic arthritis〉</span>である。'
                     '<span class="kw3">爪病変を伴う乾癬では関節炎の合併率が高い</span>ことも知られる。'),
   ('c', '梅毒性関節炎', False, '<span class="kw4">先天梅毒・第2〜3期梅毒に伴う関節症状</span>。'
                     '皮疹は<span class="kw4">第2期の梅毒性バラ疹・丘疹性梅毒疹・手掌足底の梅毒性乾癬</span>で、'
                     '<span class="kw4">「乾癬」と名がつくが尋常性乾癬とは別物</span>。'
                     '梅毒血清反応で確認する。'),
   ('d', '悪性関節リウマチ', False, '<span class="kw4">関節リウマチに血管炎を伴い、'
                     '皮膚潰瘍・多発単神経炎・間質性肺炎などの関節外症状を来す病型</span>。'
                     '<span class="kw4">前提として関節リウマチであり、RFは通常陽性</span>。'
                     '<span class="kw4">本例はRF陰性</span>で、皮疹も乾癬型である。'),
   ('e', '全身性エリテマトーデス〈SLE〉', False, '<span class="kw4">蝶形紅斑・円板状皮疹・日光過敏・口腔潰瘍・'
                     '非びらん性関節炎・漿膜炎・腎炎・血球減少</span>。'
                     '<span class="kw4">抗核抗体・抗dsDNA抗体・抗Sm抗体陽性、低補体</span>が診断の柱で、'
                     '<span class="kw4">境界明瞭な角化性紅斑と爪変形の組合せは合わない</span>。')],
  '乾癬の好発部位（頭部・四肢関節伸側・臍部）の角化性紅斑＋爪変形＋RF陰性の関節炎。乾癬性関節炎。',
  imgs=['images/105A-25_1.jpeg', 'images/105A-25_2.jpeg'],
  patho=('🦴 乾癬性関節炎——皮膚と爪と関節をつなぐ',
         '<span class="kw3">乾癬性関節炎〈psoriatic arthritis：PsA〉</span>は'
         '<span class="kw3">乾癬患者の約10〜30％に生じる炎症性関節炎</span>で、'
         '<span class="kw3">脊椎関節炎〈spondyloarthritis〉の一員</span>として'
         '強直性脊椎炎・反応性関節炎・炎症性腸疾患関連関節炎と同じグループに属する。'
         '<span class="kw3">共通する特徴は「リウマトイド因子陰性（血清反応陰性）」「付着部炎」'
         '「仙腸関節炎」「HLA-B27との関連」</span>である。<br>'
         '<span class="kw3">関節リウマチとの鑑別</span>が最重要ポイントになる。'
         '<table class="tb"><tr><th></th><th><span class="kw3">乾癬性関節炎</span></th>'
         '<th><span class="kw3">関節リウマチ</span></th></tr>'
         '<tr><td>好発関節</td>'
         '<td><span class="kw3">DIP関節（遠位指節間関節）を侵す</span>・非対称性・'
         '脊椎／仙腸関節</td>'
         '<td><span class="kw3">MCP・PIP関節（DIPは侵さない）</span>・左右対称性</td></tr>'
         '<tr><td>RF・抗CCP抗体</td><td><span class="kw3">陰性</span></td>'
         '<td><span class="kw3">陽性が多い</span></td></tr>'
         '<tr><td>特徴的所見</td>'
         '<td><span class="kw3">指趾炎〈dactylitis：ソーセージ様指〉・付着部炎・'
         'X線でpencil-in-cup変形・骨新生</span></td>'
         '<td><span class="kw3">朝のこわばり・尺側偏位・スワンネック／ボタン穴変形・'
         'X線で骨びらんと関節裂隙狭窄</span></td></tr>'
         '<tr><td>皮膚・爪</td>'
         '<td><span class="kw3">乾癬の皮疹・爪の点状陥凹・爪甲下角質増殖・油滴様変化</span></td>'
         '<td>リウマトイド結節</td></tr></table>'
         '<span class="kw3">爪病変は乾癬性関節炎の強い予測因子</span>である。'
         '<span class="kw3">DIP関節と爪母は解剖学的に連続しており、'
         '爪病変（点状陥凹・爪甲剝離・油滴様変化・爪甲下角質増殖）がある乾癬患者では'
         'DIP関節炎の合併が多い</span>——'
         '<span class="kw3">本例が「手指の爪に変形」と書いているのは、この爪と関節のつながりを示すため</span>である。<br>'
         '<span class="kw3">皮疹の分布</span>も診断の柱である。'
         '<span class="kw3">被髪頭部（生え際を越えて広がる鱗屑性紅斑）・肘膝の伸側・殿裂・臍部・爪</span>は'
         '<span class="kw3">乾癬を疑ったら必ず診るべき5か所</span>で、'
         '<span class="kw3">いずれも機械的刺激を受ける部位＝Köbner現象が働く場所</span>である'
         '（<span class="kw">Q.89・Q.90</span>）。'),
  deep=('📌 乾癬性関節炎の病型と治療',
        '<span class="kw3">Mollとwrightの5病型</span>: '
        '<span class="kw3">①非対称性少関節炎型（最多）、②DIP関節優位型、'
        '③対称性多関節炎型（RA類似）、④脊椎炎型、'
        '⑤ムチランス型（破壊性・pencil-in-cup変形・指の短縮）</span>。'
        '<span class="kw3">診断にはCASPAR基準</span>（乾癬の存在／既往／家族歴、'
        '乾癬性の爪病変、RF陰性、指趾炎、X線での関節近傍の骨新生）が用いられる。<br>'
        '<span class="kw3">治療</span>は皮膚と関節の両方を見て組み立てる。'
        '<table class="tb"><tr><th>段階</th><th>治療</th></tr>'
        '<tr><td>軽症（皮膚のみ・少関節）</td>'
        '<td><span class="kw3">NSAID、ステロイド外用、活性型ビタミンD3外用、'
        '光線療法（ナローバンドUVB・PUVA）</span></td></tr>'
        '<tr><td>中等症以上</td>'
        '<td><span class="kw3">メトトレキサート、シクロスポリン、'
        'アプレミラスト（PDE4阻害薬）、エトレチナート</span></td></tr>'
        '<tr><td><span class="kw3">難治・関節破壊進行例</span></td>'
        '<td><span class="kw3">生物学的製剤——TNF-α阻害薬（インフリキシマブ・アダリムマブ）、'
        'IL-17阻害薬（セクキヌマブ・イキセキズマブ・ブロダルマブ）、'
        'IL-23／IL-12-23阻害薬（グセルクマブ・ウステキヌマブ）、JAK阻害薬</span></td></tr></table>'
        '<span class="kw4">関節破壊は不可逆</span>なので、'
        '<span class="kw3">乾癬患者では「関節が痛くないか」を必ず問診し、'
        '疑えばリウマチ科と連携して早期に治療を強化する</span>のが現代の考え方である。'
        '<span class="kw4">なお乾癬にステロイド全身投与は行わない</span>——'
        '<span class="kw4">中止時に膿疱性乾癬や紅皮症化を誘発しうる</span>'
        '（<span class="kw">Q.84・Q.96</span>）。<br>'
        '<span class="kw3">乾癬の併存症</span>も近年重視されている。'
        '<span class="kw3">乾癬は全身の慢性炎症性疾患であり、'
        'メタボリック症候群・肥満・脂質異常症・2型糖尿病・高血圧・'
        '心血管イベント（心筋梗塞・脳卒中）・炎症性腸疾患・ぶどう膜炎・うつ</span>を合併しやすい。'
        '<span class="kw3">皮膚科医が生活習慣病を含めて診る必要がある</span>という点は'
        '国試の「対応」を問う設問でも狙われる。'),
  point=('🎯 国試ポイント',
         '① 乾癬性関節炎＝<span class="kw3">乾癬の皮疹＋爪病変＋RF陰性の関節炎</span>。'
         '脊椎関節炎の一員。<br>'
         '② <span class="kw3">DIP関節を侵す・非対称性・指趾炎（ソーセージ様指）・付着部炎</span>。'
         '<span class="kw3">RAはMCP/PIPで対称性・RF陽性</span>。<br>'
         '③ X線＝<span class="kw3">pencil-in-cup変形・骨新生</span>（RAは骨びらん）。<br>'
         '④ <span class="kw3">爪病変（点状陥凹・油滴様変化・爪甲下角質増殖）はDIP関節炎の予測因子</span>。<br>'
         '⑤ 乾癬を疑ったら診る5か所＝<span class="kw3">被髪頭部・肘膝伸側・殿裂・臍部・爪</span>。<br>'
         '⑥ 治療＝NSAID・外用・光線療法→MTX・アプレミラスト→'
         '<span class="kw3">生物学的製剤（TNF-α／IL-17／IL-23阻害薬）</span>。<br>'
         '⑦ 併存症＝<span class="kw3">メタボリック症候群・心血管イベント</span>。'
         '<span class="kw4">ステロイド全身投与はしない</span>。')),

Q('80B-81', None, [('bs', '★')],
  '26歳の女性。'
  '<span class="kw">10日前に左肩に母指頭大の紅斑落屑性局面が1個生じ</span>、'
  '<span class="kw">2日前から体幹に対側性に皮疹が多発</span>してきた。'
  '個疹は<span class="kw">境界鮮明、楕円形で、辺縁が淡紅色、その内側が鱗屑により縁どられ、'
  '中央が淡黄紅色</span>である。'
  '<span class="kw">皮疹の長軸は皮膚割線方向に一致</span>している。'
  '<span class="kw4">瘙痒は軽く、リンパ節腫脹はない</span>。<br>'
  '<strong>最も考えられる疾患はどれか。</strong>',
  [('a', '毛孔性紅色粃糠疹', False, '<span class="kw4">毛孔一致性の角化性丘疹が融合して橙赤色の局面をつくり、'
                     '正常皮膚を島状に residual island として残す</span>のが特徴。'
                     '<span class="kw4">手掌足底の橙黄色の角化（keratoderma）</span>を伴う。'
                     '<span class="kw4">herald patch も皮膚割線に沿う配列も無い</span>。'),
   ('b', '第2期梅毒疹', False, '<span class="kw4">最も紛らわしく、必ず鑑別すべき疾患</span>。'
                     '<span class="kw4">梅毒性バラ疹（体幹の淡紅色斑）・丘疹性梅毒疹・'
                     '手掌足底の梅毒性乾癬・扁平コンジローマ・梅毒性脱毛</span>を来す。'
                     '<span class="kw4">herald patchが無く、全身のリンパ節腫脹を伴い、'
                     '手掌足底にも皮疹が出る</span>点で区別し、'
                     '<span class="kw4">迷ったら梅毒血清反応（RPR・TPHA）を必ず提出する</span>。'),
   ('c', '脂漏性皮膚炎', False, '<span class="kw4">被髪頭部・眉間・鼻唇溝・耳介周囲・前胸部といった'
                     '脂漏部位に、黄色調の鱗屑を伴う紅斑が慢性に生じる</span>。'
                     '<span class="kw4">マラセチアの関与</span>があり、経過は慢性・再燃性で、'
                     '<span class="kw4">herald patchや皮膚割線に沿う配列は無い</span>。'),
   ('d', 'Gibert薔薇色粃糠疹', True, '<span class="kw3">先行する1個の大きな紅斑落屑性局面（herald patch／初発斑）に'
                     '1〜2週遅れて、体幹に楕円形の淡紅色斑が多発</span>し、'
                     '<span class="kw3">長軸が皮膚割線（Langer線）に一致してクリスマスツリー状に配列</span>する。'
                     '<span class="kw3">辺縁の内側を鱗屑が縁取る（collarette scale）</span>のも典型的で、'
                     '<span class="kw3">1〜2か月で自然治癒し再発しにくい</span>。'),
   ('e', '自家感作性皮膚炎', False, '<span class="kw4">うっ滞性皮膚炎・接触皮膚炎などの原発巣が悪化した後に、'
                     '離れた部位へ瘙痒性の散布疹が全身性に多発する</span>もの。'
                     '<span class="kw4">原発巣（多くは下腿）の存在が前提で、瘙痒が強く、'
                     '皮膚割線に沿う配列はしない</span>。')],
  '1個のherald patchに続いて体幹に楕円形の紅斑が多発し、長軸が皮膚割線に一致。辺縁の内側を鱗屑が縁取る。Gibert薔薇色粃糠疹。',
  patho=('🎄 Gibert薔薇色粃糠疹——「先触れ」とクリスマスツリー',
         '<span class="kw3">Gibert薔薇色粃糠疹〈pityriasis rosea〉</span>は'
         '<span class="kw3">若年〜中年（10〜35歳）に好発し、1〜2か月で自然治癒する'
         '良性の炎症性皮膚疾患</span>である。'
         '<span class="kw3">HHV-6・HHV-7の再活性化</span>が原因として有力視されており、'
         '<span class="kw3">春・秋に多く、上気道感染に続いて発症することがある</span>。'
         '<span class="kw4">ただし感染性（人にうつる）とは考えられていない</span>。<br>'
         '<span class="kw3">臨床経過には決まった「型」があり、それがそのまま診断根拠になる</span>。'
         '<span class="kw3">①初発斑〈herald patch／母斑・メダリオン〉</span>——'
         '<span class="kw3">体幹（本例は左肩）に、'
         '母指頭大〜手掌大の楕円形の紅斑落屑性局面が「1個だけ」先に出る</span>。'
         '<span class="kw3">②1〜2週後に播種疹</span>——'
         '<span class="kw3">体幹と四肢近位に、より小型の楕円形淡紅色斑が多発</span>する。'
         '<span class="kw3">③配列</span>——'
         '<span class="kw3">個疹の長軸が皮膚割線〈Langer線〉に一致</span>するため、'
         '<span class="kw3">背部では脊柱から斜め下外側へ向かう配列となり、'
         '全体が「クリスマスツリー」に見える</span>。'
         '<span class="kw3">④鱗屑</span>——'
         '<span class="kw3">辺縁のやや内側に沿って細かい鱗屑が輪状に付く（collarette scale／襟飾り状鱗屑）</span>。'
         '<span class="kw3">⑤経過</span>——'
         '<span class="kw3">瘙痒は軽度、全身症状は乏しく、4〜8週で色素沈着を残して自然消退</span>し、'
         '<span class="kw3">再発はまれ</span>である。<br>'
         '<span class="kw4">最も重要な鑑別が第2期梅毒疹</span>である。'
         '<span class="kw4">「体幹に多発する淡紅色斑」という点が共通し、'
         '見逃せば梅毒を治療しないまま経過させてしまう</span>。'
         '<table class="tb"><tr><th></th><th><span class="kw3">Gibert薔薇色粃糠疹</span></th>'
         '<th><span class="kw3">第2期梅毒疹</span></th></tr>'
         '<tr><td>初発斑</td><td><span class="kw3">あり（herald patch）</span></td>'
         '<td><span class="kw3">なし</span></td></tr>'
         '<tr><td>手掌・足底</td><td><span class="kw3">出ない</span></td>'
         '<td><span class="kw3">出る（梅毒性乾癬）——決定的</span></td></tr>'
         '<tr><td>リンパ節腫脹</td><td><span class="kw3">なし</span></td>'
         '<td><span class="kw3">全身性にあり</span></td></tr>'
         '<tr><td>配列</td><td><span class="kw3">皮膚割線に一致</span></td><td>不規則</td></tr>'
         '<tr><td>血清</td><td>—</td><td><span class="kw3">RPR・TPHA陽性</span></td></tr></table>'
         '<span class="kw3">本例が「リンパ節腫脹はない」とわざわざ書いているのは梅毒を除外するため</span>である。'),
  deep=('📌 体幹に多発する紅斑落屑性皮疹の鑑別と、治療',
        '<table class="tb"><tr><th>疾患</th><th>決め手</th></tr>'
        '<tr><td><span class="kw3">Gibert薔薇色粃糠疹</span></td>'
        '<td><span class="kw3">herald patch・皮膚割線に沿う配列・collarette scale・自然治癒</span></td></tr>'
        '<tr><td><span class="kw3">第2期梅毒疹</span></td>'
        '<td><span class="kw3">手掌足底の皮疹・全身リンパ節腫脹・血清反応陽性</span></td></tr>'
        '<tr><td><span class="kw3">滴状乾癬</span></td>'
        '<td><span class="kw3">溶連菌性咽頭炎の1〜3週後、小型の鱗屑性紅斑が全身に散在、'
        'ASO上昇。若年に多く自然軽快しうる</span></td></tr>'
        '<tr><td><span class="kw3">体部白癬</span></td>'
        '<td><span class="kw3">辺縁が堤防状に隆起し中心が治癒（中心治癒傾向）、'
        'KOH直接鏡検で菌糸</span>。'
        '<span class="kw4">herald patchを体部白癬と誤診してステロイドを塗ると'
        '異型白癬〈tinea incognito〉になる</span></td></tr>'
        '<tr><td>薬疹（播種状紅斑丘疹型）</td><td>薬剤歴、瘙痒、全身に融合</td></tr>'
        '<tr><td>ウイルス性発疹症</td><td>発熱・カタル症状・粘膜疹</td></tr>'
        '<tr><td>菌状息肉症（紅斑期）</td><td>年余にわたる慢性経過、生検</td></tr></table>'
        '<span class="kw3">治療</span>は'
        '<span class="kw3">基本的に不要（自然治癒するため経過観察と説明）</span>で、'
        '<span class="kw3">瘙痒に対してステロイド外用・抗ヒスタミン薬</span>、'
        '<span class="kw3">広範・遷延例にはナローバンドUVB</span>を用いる。'
        '<span class="kw3">患者への説明が治療の中心</span>で、'
        '<span class="kw3">「1〜2か月で自然に治る／人にうつらない／再発はまれ」</span>と伝える。'
        '<span class="kw4">妊婦の発症では、妊娠15週未満での発症が流産・早産と関連するという報告があり</span>、'
        '<span class="kw4">妊婦では慎重に経過を見る</span>。<br>'
        '<span class="kw4">なお本問は昭和期の古い国試（80B-81）で、'
        '解答一覧表に正答率が載っていない</span>。'
        '<span class="kw3">それでもherald patchと皮膚割線という2つのキーワードは'
        '現在も繰り返し問われる</span>ので、確実に押さえたい。'),
  point=('🎯 国試ポイント',
         '① Gibert薔薇色粃糠疹＝<span class="kw3">herald patch（初発斑）→1〜2週後に体幹へ多発</span>。<br>'
         '② <span class="kw3">個疹の長軸が皮膚割線（Langer線）に一致＝クリスマスツリー状</span>。<br>'
         '③ <span class="kw3">辺縁の内側を縁取る鱗屑（collarette scale）</span>。<br>'
         '④ <span class="kw3">4〜8週で自然治癒・再発まれ・瘙痒は軽度</span>。'
         '<span class="kw3">HHV-6／7の関与</span>。<br>'
         '⑤ <span class="kw3">最重要鑑別は第2期梅毒疹</span>——'
         '<span class="kw3">手掌足底の皮疹・全身リンパ節腫脹・血清反応</span>で区別。<br>'
         '⑥ ほかに<span class="kw3">滴状乾癬（溶連菌後）・体部白癬（KOH鏡検）</span>を鑑別。<br>'
         '⑦ 治療は<span class="kw3">説明と経過観察</span>が主体、瘙痒に外用。')),

]

# ============================================================
# B問題 NO.89-98
# ============================================================
QUESTIONS += [

Q('115F-35', 96, [('bc', 'CBT'), ('bi', '📷')],
  '43歳の男性。<span class="kw">腰背部、両肘および両膝の皮疹</span>を主訴に来院した。'
  '5年前に発症し、次第に範囲が拡大するため受診した。'
  '<span class="kw">同部位に鱗屑を伴う境界明瞭な地図状紅斑</span>を認める。'
  '<span class="kw">両手示指、中指および環指の遠位指節間関節の腫脹</span>を認める。'
  '<span class="kw4">真菌直接鏡検は陰性</span>であった。腰背部の写真を示す。<br>'
  '<strong>この患者でみられるのはどれか。</strong>',
  [('a', 'Darier徴候', False, '<span class="kw4">病変を機械的にこすると膨疹・発赤を生じる現象</span>で、'
                     '<span class="kw4">肥満細胞症（色素性蕁麻疹）に特徴的</span>。'
                     '肥満細胞から遊離したヒスタミンによる。'
                     '<span class="kw4">Darier「病」（Q.82）とは名前が同じだけで別概念</span>なので注意する。'),
   ('b', 'Gottron徴候', False, '<span class="kw4">手指関節（MCP・PIP・DIP）伸側の角化性紅斑</span>で、'
                     '<span class="kw4">皮膚筋炎に特徴的</span>（<span class="kw">Q.60</span>）。'
                     'ヘリオトロープ疹・近位筋の筋力低下・CK上昇を伴う。'
                     '<span class="kw4">本例は関節の「腫脹」であって伸側の紅斑ではない</span>。'),
   ('c', 'Köbner現象', True, '<span class="kw3">外傷・擦過・日焼けなど機械的刺激を受けた部位に、'
                     'その疾患と同じ皮疹が新たに生じる現象</span>。'
                     '<span class="kw3">尋常性乾癬の代表的な所見</span>で、'
                     '<span class="kw3">肘・膝・腰背部・殿裂といった刺激を受けやすい部位に好発する理由でもある</span>。'
                     '<span class="kw3">扁平苔癬・尋常性白斑・扁平疣贅でも陽性</span>（<span class="kw">Q.94</span>）。'),
   ('d', 'Leser-Trélat徴候', False, '<span class="kw4">脂漏性角化症が短期間に多発・急増する現象</span>で、'
                     '<span class="kw4">内臓悪性腫瘍（とくに胃癌などの消化器癌）のデルマドローム</span>とされる。'
                     '<span class="kw4">乾癬とは無関係</span>。'),
   ('e', 'Nikolsky現象', False, '<span class="kw4">一見正常な皮膚をこすると表皮が剝離する現象</span>で、'
                     '<span class="kw4">TEN・SSSS・尋常性天疱瘡</span>で陽性となる'
                     '（<span class="kw">Q.73</span>）。'
                     '<span class="kw4">乾癬では表皮の接着は保たれており陰性</span>。'
                     '乾癬で鱗屑を剝がすと点状出血するのはAuspitz現象（別概念）。')],
  '腰背部・肘・膝という機械的刺激部位に境界明瞭な鱗屑性紅斑、DIP関節腫脹（乾癬性関節炎）。尋常性乾癬でみられるのはKöbner現象。',
  imgs=['images/115F-35_1.jpeg'],
  patho=('🔨 Köbner現象——「刺激された場所に病気が出る」',
         '<span class="kw3">Köbner現象〈isomorphic response：同形反応〉</span>とは、'
         '<span class="kw3">外傷・擦過・熱傷・日焼け・手術創など、'
         'それまで健常だった皮膚に加わった刺激の部位に一致して、'
         'その患者がもつ疾患と同じ皮疹が新たに生じる現象</span>である。'
         '<span class="kw3">典型的には引っかき傷に沿って線状に皮疹が並ぶ</span>ため、'
         '<span class="kw3">診察室では「線状に並んだ皮疹」を見たらKöbner現象を疑う</span>。<br>'
         '<span class="kw3">Köbner現象が陽性となる代表疾患</span>: '
         '<span class="kw3">①尋常性乾癬（最も有名）、②扁平苔癬、③尋常性白斑、'
         '④扁平疣贅（ウイルスの接種による偽Köbner現象）、⑤Duhring疱疹状皮膚炎</span>。'
         '<span class="kw3">「乾癬・扁平苔癬・白斑・扁平疣贅」の4つ</span>を覚えておけば'
         '国試には十分対応できる（<span class="kw">Q.94</span>）。<br>'
         '<span class="kw3">乾癬でKöbner現象が起こる理由</span>は病態から説明できる。'
         '<span class="kw3">乾癬では表皮角化細胞が「刺激に対して過剰に反応する」状態にあり、'
         '損傷を受けると抗菌ペプチド（LL-37）を放出する</span>。'
         '<span class="kw3">LL-37は自己DNAと複合体を作って形質細胞様樹状細胞のTLR9を活性化し、'
         'Ⅰ型インターフェロン→IL-23→Th17というカスケードに火をつける</span>。'
         '<span class="kw3">つまり「傷が乾癬の炎症ループの点火装置になる」</span>のである。'
         '<span class="kw3">乾癬の好発部位（肘・膝の伸側、腰背部、殿裂、被髪頭部、爪）が'
         'いずれも慢性的に機械的刺激を受ける場所であること</span>は、'
         'この現象の日常的な現れにほかならない。'
         '<span class="kw3">本例の「腰背部、両肘および両膝」という分布はまさにこれ</span>である。<br>'
         '<span class="kw4">臨床上の含意</span>も重要である。'
         '<span class="kw4">乾癬患者には「掻かない・こすらない・強く洗わない」ことを指導する</span>。'
         '<span class="kw4">垢すり・ナイロンタオルでの強い洗浄・きつい衣類・手術やタトゥーの部位に'
         '新たな皮疹が出る</span>ことを説明しておく。'
         '<span class="kw3">逆に、Köbner現象を利用して「刺激を避ければ皮疹は減らせる」という'
         '前向きなメッセージにもできる</span>。'),
  deep=('📌 「〜現象／〜徴候」を一気に整理する',
        '<span class="kw3">皮膚科は人名のついた現象・徴候が多く、'
        'これらは選択肢として並べられることが非常に多い</span>。'
        '<table class="tb"><tr><th>名称</th><th>内容</th><th>疾患</th></tr>'
        '<tr><td><span class="kw3">Köbner現象</span></td>'
        '<td><span class="kw3">機械的刺激部位に同じ皮疹が生じる</span></td>'
        '<td><span class="kw3">尋常性乾癬・扁平苔癬・尋常性白斑・扁平疣贅</span></td></tr>'
        '<tr><td><span class="kw3">Auspitz現象</span></td>'
        '<td><span class="kw3">鱗屑を剝がすと点状出血する</span>'
        '（真皮乳頭の毛細血管が表面近くまで来ているため）</td>'
        '<td><span class="kw3">尋常性乾癬</span>（<span class="kw">Q.93</span>）</td></tr>'
        '<tr><td><span class="kw3">Nikolsky現象</span></td>'
        '<td><span class="kw3">正常に見える皮膚をこすると表皮が剝離</span></td>'
        '<td><span class="kw3">TEN・SSSS・尋常性天疱瘡</span></td></tr>'
        '<tr><td><span class="kw3">Darier徴候</span></td>'
        '<td><span class="kw3">病変をこすると膨疹・発赤（ヒスタミン遊離）</span></td>'
        '<td><span class="kw3">肥満細胞症（色素性蕁麻疹）</span></td></tr>'
        '<tr><td><span class="kw3">Gottron徴候</span></td>'
        '<td><span class="kw3">手指関節伸側の角化性紅斑</span></td>'
        '<td><span class="kw3">皮膚筋炎</span></td></tr>'
        '<tr><td><span class="kw3">Leser-Trélat徴候</span></td>'
        '<td><span class="kw3">脂漏性角化症の急激な多発</span></td>'
        '<td><span class="kw3">内臓悪性腫瘍（デルマドローム）</span></td></tr>'
        '<tr><td>針反応〈pathergy〉</td><td>注射針の刺入部が発赤・膿疱化</td>'
        '<td><span class="kw3">Behçet病</span>（<span class="kw">Q.76</span>）</td></tr>'
        '<tr><td>Wickham線条</td><td>病変表面のレース状白色線条</td>'
        '<td><span class="kw3">扁平苔癬</span>（<span class="kw">Q.85</span>）</td></tr>'
        '<tr><td>ろう片現象</td><td>鱗屑をこするとろうを削ったように白くなる</td>'
        '<td>尋常性乾癬</td></tr></table>'
        '<span class="kw4">Köbner現象・Auspitz現象・ろう片現象の3つはすべて尋常性乾癬</span>で、'
        '<span class="kw3">これらが選択肢に並んだら乾癬の症例だと逆算できる</span>。'
        '<span class="kw4">紛らわしいのがDarier徴候（肥満細胞症）とDarier病（ATP2A2変異の角化症・Q.82）</span>で、'
        '<span class="kw3">名前が同じでも別物</span>なので確実に区別する。<br>'
        '<span class="kw3">本例では「真菌直接鏡検は陰性」</span>という記載で'
        '<span class="kw3">体部白癬を除外</span>している。'
        '<span class="kw4">境界明瞭な鱗屑性紅斑を見たら白癬をKOHで否定してからステロイドを塗る</span>のが'
        '皮膚科の鉄則で、<span class="kw4">怠ると異型白癬〈tinea incognito〉を作る</span>。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">Köbner現象＝機械的刺激部位に同じ皮疹が生じる</span>。'
         '<span class="kw3">尋常性乾癬・扁平苔癬・尋常性白斑・扁平疣贅</span>。<br>'
         '② 乾癬の好発部位（<span class="kw3">肘膝伸側・腰背部・殿裂・被髪頭部・爪</span>）は'
         '<span class="kw3">刺激を受ける場所</span>。<br>'
         '③ <span class="kw3">Auspitz現象＝鱗屑を剝がすと点状出血</span>（真皮乳頭の毛細血管）。<br>'
         '④ <span class="kw4">Darier徴候は肥満細胞症</span>、'
         '<span class="kw4">Darier病はATP2A2変異の角化症</span>——別物。<br>'
         '⑤ <span class="kw3">Gottron徴候＝皮膚筋炎、Leser-Trélat徴候＝内臓悪性腫瘍、'
         'Nikolsky現象＝TEN／SSSS／天疱瘡</span>。<br>'
         '⑥ <span class="kw3">DIP関節の腫脹＝乾癬性関節炎</span>を示唆（<span class="kw">Q.87</span>）。<br>'
         '⑦ 鱗屑性紅斑では<span class="kw3">KOH直接鏡検で白癬を否定</span>してから治療する。')),

Q('109B-45', 95, [('bi', '📷')],
  '34歳の男性。<span class="kw">全身の皮疹</span>を主訴に来院した。'
  '<span class="kw">数年前から白色の鱗屑を伴う紅斑が体幹と四肢とに多数みられ痒みを伴っていた</span>。'
  '1か月前から皮疹が増加したため受診した。背部の写真を示す。<br>'
  '<strong>この患者でみられるのはどれか。</strong>',
  [('a', 'Darier徴候', False, '<span class="kw4">肥満細胞症（色素性蕁麻疹）で見られる、'
                     'こすると膨疹・発赤を生じる現象</span>。'
                     '色素性蕁麻疹は<span class="kw4">褐色の色素斑</span>が主体で、'
                     '白色鱗屑を伴う紅斑ではない。'),
   ('b', 'Köbner現象', True, '<span class="kw3">白色（銀白色）の鱗屑を伴う境界明瞭な紅斑が体幹・四肢に多発する'
                     '＝尋常性乾癬</span>であり、'
                     '<span class="kw3">Köbner現象が陽性</span>となる'
                     '（<span class="kw">Q.89・Q.93・Q.94</span>）。'),
   ('c', 'Leser-Trélat徴候', False, '<span class="kw4">脂漏性角化症が急激に多発する現象で、'
                     '内臓悪性腫瘍を示唆するデルマドローム</span>。'
                     '<span class="kw4">脂漏性角化症は褐色〜黒色の疣状に隆起した良性腫瘍</span>であり、'
                     '本例の鱗屑性紅斑とは別物である。'),
   ('d', 'Nikolsky現象', False, '<span class="kw4">TEN・SSSS・尋常性天疱瘡で陽性</span>となる'
                     '<span class="kw4">表皮の接着が失われていることを示す所見</span>'
                     '（<span class="kw">Q.73</span>）。'
                     '<span class="kw4">乾癬では表皮の接着は保たれる</span>。'),
   ('e', 'Tinel徴候', False, '<span class="kw4">末梢神経の絞扼部位を叩打すると、'
                     'その支配領域に放散する痛み・しびれが生じる神経学的所見</span>。'
                     '<span class="kw4">手根管症候群（正中神経）・肘部管症候群（尺骨神経）</span>などで診る。'
                     '皮膚疾患の所見ではない。')],
  '白色鱗屑を伴う紅斑が体幹・四肢に多発する慢性の経過＝尋常性乾癬。Köbner現象が陽性となる。',
  imgs=['images/109B-45_1.jpeg'],
  patho=('🩶 尋常性乾癬の臨床像——「銀白色の鱗屑」を見抜く',
         '<span class="kw3">尋常性乾癬〈psoriasis vulgaris〉</span>は'
         '<span class="kw3">境界明瞭な浸潤性の紅斑の上に、銀白色で厚い雲母状の鱗屑が'
         '層状に付着する</span>のが基本の皮疹である。'
         '<span class="kw3">日本人の有病率は0.1〜0.3％程度で、乾癬全体の約90％を尋常性乾癬が占める</span>。'
         '<span class="kw3">発症のピークは20〜30代と50〜60代の二峰性</span>で、'
         '<span class="kw3">やや男性に多い</span>。<br>'
         '<span class="kw3">診察でとるべき所見</span>は'
         '<span class="kw3">①分布（被髪頭部・肘膝の伸側・腰背部・殿裂・臍部）、'
         '②爪（点状陥凹・爪甲剝離・油滴様変化・爪甲下角質増殖）、'
         '③関節（DIP関節の腫脹・指趾炎）、'
         '④現象（Köbner現象・Auspitz現象・ろう片現象）</span>の4点である。'
         '<span class="kw3">この4点をそろえれば、生検をしなくても臨床的に診断できる</span>ことが多い。<br>'
         '<span class="kw3">乾癬の病型</span>も整理しておく。'
         '<table class="tb"><tr><th>病型</th><th>特徴</th></tr>'
         '<tr><td><span class="kw3">尋常性乾癬</span></td>'
         '<td><span class="kw3">全体の約90％。境界明瞭な鱗屑性紅斑</span></td></tr>'
         '<tr><td><span class="kw3">滴状乾癬</span></td>'
         '<td><span class="kw3">溶連菌性咽頭炎の1〜3週後に、小型の紅斑が全身に散在。'
         '若年に多く自然軽快しうる</span></td></tr>'
         '<tr><td><span class="kw3">乾癬性紅皮症</span></td>'
         '<td><span class="kw3">体表の90％以上が紅斑・落屑。'
         '体温調節・体液・蛋白の喪失で全身管理を要する</span></td></tr>'
         '<tr><td><span class="kw3">膿疱性乾癬</span></td>'
         '<td><span class="kw3">無菌性膿疱＋発熱。指定難病</span>（<span class="kw">Q.84</span>）</td></tr>'
         '<tr><td><span class="kw3">関節症性乾癬（乾癬性関節炎）</span></td>'
         '<td><span class="kw3">RF陰性・DIP関節を侵す</span>（<span class="kw">Q.87</span>）</td></tr></table>'
         '<span class="kw3">瘙痒</span>については'
         '<span class="kw3">「乾癬は痒くない」と一般に言われるが、実際には約半数の患者が瘙痒を訴える</span>。'
         '<span class="kw3">本例も「痒みを伴っていた」と記載されている</span>が、'
         '<span class="kw3">これは乾癬を否定する根拠にはならない</span>。'
         '<span class="kw3">アトピー性皮膚炎のように瘙痒が診断の必須項目になっているわけではない、と理解する</span>。'),
  deep=('📌 乾癬の治療——「軽症は外用、重症は全身」の階段',
        '<table class="tb"><tr><th>段階</th><th>治療</th><th>ポイント</th></tr>'
        '<tr><td><span class="kw3">①外用</span></td>'
        '<td><span class="kw3">副腎皮質ステロイド外用、活性型ビタミンD3外用'
        '（カルシポトリオール・マキサカルシトール）、両者の配合剤</span></td>'
        '<td><span class="kw3">ビタミンD3は角化細胞の増殖を抑え分化を促す</span>。'
        '<span class="kw4">高Ca血症に注意し、使用量の上限を守る</span></td></tr>'
        '<tr><td><span class="kw3">②光線療法</span></td>'
        '<td><span class="kw3">ナローバンドUVB（311nm）、PUVA療法（ソラレン＋UVA）、'
        'エキシマライト</span></td>'
        '<td><span class="kw3">T細胞のアポトーシスを誘導</span>。'
        '<span class="kw4">PUVAは長期で皮膚癌のリスク</span>（<span class="kw">Q.96</span>）</td></tr>'
        '<tr><td><span class="kw3">③内服</span></td>'
        '<td><span class="kw3">エトレチナート（レチノイド）、シクロスポリン、'
        'メトトレキサート、アプレミラスト（PDE4阻害薬）、JAK/TYK2阻害薬</span></td>'
        '<td><span class="kw4">エトレチナートは催奇形性（女性は投与終了後2年間避妊）</span></td></tr>'
        '<tr><td><span class="kw3">④生物学的製剤</span></td>'
        '<td><span class="kw3">TNF-α阻害薬、IL-17阻害薬、IL-23／IL-12-23阻害薬</span></td>'
        '<td><span class="kw3">難治例・関節症性・膿疱性に高い効果</span>。'
        '<span class="kw4">投与前に結核・B型肝炎のスクリーニングが必須</span></td></tr></table>'
        '<span class="kw4">最重要の禁忌事項</span>: '
        '<span class="kw4">副腎皮質ステロイドの全身投与（内服・注射）は乾癬に行わない</span>。'
        '<span class="kw4">一時的には効くが、中止・減量時に膿疱性乾癬や紅皮症へ悪化させる（リバウンド）</span>'
        '（<span class="kw">Q.84・Q.96</span>）。<br>'
        '<span class="kw3">生活指導と併存症</span>: '
        '<span class="kw3">①Köbner現象を避ける（掻かない・こすらない）</span>、'
        '<span class="kw3">②禁煙・減量（肥満は乾癬を悪化させ、減量で改善する）</span>、'
        '<span class="kw3">③飲酒を控える</span>、'
        '<span class="kw3">④誘因となる薬剤（βブロッカー・リチウム・抗マラリア薬・'
        'インターフェロン）の確認</span>、'
        '<span class="kw3">⑤メタボリック症候群・心血管リスクの評価</span>。'
        '<span class="kw3">乾癬は「皮膚に出る全身の慢性炎症」であるという理解が現代的である</span>。'),
  point=('🎯 国試ポイント',
         '① 尋常性乾癬＝<span class="kw3">境界明瞭な浸潤性紅斑＋銀白色の厚い鱗屑</span>。<br>'
         '② 診るべき4点＝<span class="kw3">分布（頭・肘膝伸側・腰背部・殿裂・臍）／爪／関節／現象</span>。<br>'
         '③ <span class="kw3">Köbner現象・Auspitz現象・ろう片現象</span>はすべて乾癬。<br>'
         '④ 病型＝<span class="kw3">尋常性・滴状（溶連菌後）・紅皮症・膿疱性・関節症性</span>。<br>'
         '⑤ <span class="kw3">乾癬でも約半数は瘙痒を訴える</span>——'
         '痒みがあっても乾癬を否定しない。<br>'
         '⑥ 治療＝<span class="kw3">外用（ステロイド＋活性型ビタミンD3）→光線療法→内服→生物学的製剤</span>。<br>'
         '⑦ <span class="kw4">ステロイドの全身投与は禁</span>（中止時に膿疱性乾癬へ）。')),

Q('108F-7', 86, [('bh', '必修')],
  '<strong>関節痛を伴いやすいのはどれか。</strong>',
  [('a', '尋常性乾癬', True, '<span class="kw3">乾癬患者の約10〜30％に乾癬性関節炎を合併</span>する'
                     '（<span class="kw">Q.87</span>）。'
                     '<span class="kw3">RF陰性・DIP関節を侵す非対称性の関節炎・指趾炎・付着部炎・仙腸関節炎</span>が'
                     '特徴で、<span class="kw3">脊椎関節炎の一員</span>である。'),
   ('b', '尋常性痤瘡', False, '<span class="kw4">毛包脂腺系の慢性炎症（面皰・丘疹・膿疱・囊腫）</span>で、'
                     '<span class="kw4">関節症状は伴わない</span>。'
                     'ただし<span class="kw">重症型の集簇性痤瘡はSAPHO症候群'
                     '（滑膜炎・痤瘡・膿疱症・骨過形成・骨炎）の一部として関節症状を伴うことがある</span>——'
                     'これは例外的な知識である。'),
   ('c', '尋常性白斑', False, '<span class="kw4">メラノサイトが自己免疫機序で消失し、'
                     '境界明瞭な脱色素斑を生じる</span>。'
                     '<span class="kw4">自覚症状はなく関節痛も伴わない</span>。'
                     '<span class="kw">甲状腺疾患・悪性貧血・円形脱毛症など他の自己免疫疾患を合併</span>することはある。'),
   ('d', '尋常性魚鱗癬', False, '<span class="kw4">フィラグリン遺伝子変異による常染色体顕性遺伝の角化症</span>で、'
                     '<span class="kw4">四肢伸側を中心に魚のうろこ状の鱗屑と乾燥を生じる</span>。'
                     '<span class="kw4">炎症性疾患ではなく、関節症状とは無縁</span>。'
                     'アトピー性皮膚炎を合併しやすい。'),
   ('e', '尋常性天疱瘡', False, '<span class="kw4">抗デスモグレイン3抗体による表皮内水疱症</span>。'
                     '<span class="kw4">口腔粘膜のびらん・弛緩性水疱・Nikolsky現象陽性</span>が主体で、'
                     '<span class="kw4">関節症状は伴わない</span>。')],
  '関節痛（関節炎）を伴いやすい皮膚疾患は尋常性乾癬。約10〜30％に乾癬性関節炎を合併する。',
  patho=('🤝 皮膚と関節をつなぐ疾患群',
         '<span class="kw3">「皮膚疾患＋関節症状」の組合せは国試の定番</span>である。'
         '<span class="kw3">選択肢はすべて「尋常性」で始まる紛らわしい並びだが、'
         '関節炎を伴うのは尋常性乾癬だけ</span>である。'
         '<table class="tb"><tr><th>皮膚疾患</th><th>関節症状</th><th>特徴</th></tr>'
         '<tr><td><span class="kw3">尋常性乾癬</span></td>'
         '<td><span class="kw3">乾癬性関節炎（10〜30％）</span></td>'
         '<td><span class="kw3">RF陰性・DIP・指趾炎・付着部炎・pencil-in-cup</span></td></tr>'
         '<tr><td><span class="kw3">Behçet病</span></td><td><span class="kw3">関節炎（副症状）</span></td>'
         '<td><span class="kw3">口腔アフタ・外陰部潰瘍・結節性紅斑様皮疹・ぶどう膜炎</span>'
         '（<span class="kw">Q.76</span>）</td></tr>'
         '<tr><td><span class="kw3">Sweet病</span></td><td><span class="kw3">関節痛（約半数）</span></td>'
         '<td><span class="kw3">発熱＋有痛性の浮腫性紅色局面＋好中球増多</span>'
         '（<span class="kw">Q.63</span>）</td></tr>'
         '<tr><td><span class="kw3">結節性紅斑</span></td><td><span class="kw3">関節痛・発熱</span></td>'
         '<td><span class="kw3">Löfgren症候群＝結節性紅斑＋BHL＋関節炎</span>'
         '（<span class="kw">Q.58</span>）</td></tr>'
         '<tr><td><span class="kw3">皮膚筋炎</span></td><td>関節痛</td>'
         '<td><span class="kw3">ヘリオトロープ疹・Gottron徴候・近位筋力低下・悪性腫瘍</span></td></tr>'
         '<tr><td><span class="kw3">SLE</span></td><td><span class="kw3">非びらん性関節炎</span></td>'
         '<td><span class="kw3">蝶形紅斑・日光過敏・抗dsDNA抗体</span></td></tr>'
         '<tr><td><span class="kw3">成人Still病</span></td><td><span class="kw3">関節炎</span></td>'
         '<td><span class="kw3">弛張熱＋サーモンピンク疹＋フェリチン著増</span></td></tr>'
         '<tr><td>IgA血管炎</td><td>関節痛</td>'
         '<td><span class="kw3">下肢の触知可能な紫斑＋腹痛＋腎炎</span></td></tr>'
         '<tr><td>SAPHO症候群</td><td>胸鎖肋関節炎・骨炎</td>'
         '<td><span class="kw3">掌蹠膿疱症・重症痤瘡</span></td></tr></table>'
         '<span class="kw3">脊椎関節炎〈spondyloarthritis〉というくくり</span>も押さえておきたい。'
         '<span class="kw3">乾癬性関節炎・強直性脊椎炎・反応性関節炎・炎症性腸疾患関連関節炎</span>が'
         'これに属し、'
         '<span class="kw3">共通点は「RF陰性・付着部炎・仙腸関節炎・HLA-B27・'
         '皮膚／眼／腸の炎症を伴う」</span>である。'
         '<span class="kw3">乾癬性関節炎はこの一員として、'
         '「皮膚科医が最初に気づく関節疾患」という位置にある</span>。'),
  deep=('📌 「尋常性」で始まる疾患を並べて整理する',
        '<span class="kw3">本問の選択肢はすべて「尋常性〜」</span>であり、'
        '<span class="kw3">名前の類似だけで選ばせないための出題</span>である。'
        'この機会に一覧で押さえておく。'
        '<table class="tb"><tr><th>疾患</th><th>本態</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">尋常性乾癬</span></td>'
        '<td><span class="kw3">IL-23／Th17による角化異常</span></td>'
        '<td><span class="kw3">銀白色鱗屑・Köbner／Auspitz・爪・関節炎</span></td></tr>'
        '<tr><td><span class="kw3">尋常性痤瘡</span></td>'
        '<td><span class="kw3">毛包脂腺系の慢性炎症（Cutibacterium acnes・アンドロゲン・角栓）</span></td>'
        '<td><span class="kw3">面皰が原発疹。'
        '治療はアダパレン・過酸化ベンゾイル・抗菌薬</span></td></tr>'
        '<tr><td><span class="kw3">尋常性白斑</span></td>'
        '<td><span class="kw3">メラノサイトの自己免疫性消失</span></td>'
        '<td><span class="kw3">境界明瞭な脱色素斑・Köbner現象陽性・'
        'Wood灯で白く光る・甲状腺疾患の合併</span></td></tr>'
        '<tr><td><span class="kw3">尋常性魚鱗癬</span></td>'
        '<td><span class="kw3">フィラグリン遺伝子変異・常染色体顕性</span></td>'
        '<td><span class="kw3">四肢伸側の鱗屑・掌蹠の皺の増強・'
        'アトピー性皮膚炎を合併</span></td></tr>'
        '<tr><td><span class="kw3">尋常性天疱瘡</span></td>'
        '<td><span class="kw3">抗デスモグレイン3抗体</span></td>'
        '<td><span class="kw3">口腔びらんで初発・弛緩性水疱・Nikolsky陽性・'
        '蛍光抗体直接法で細胞間IgG</span></td></tr>'
        '<tr><td><span class="kw3">尋常性疣贅</span></td><td>HPV感染</td>'
        '<td>手指・足底の角化性丘疹。<span class="kw3">液体窒素凍結療法</span></td></tr>'
        '<tr><td><span class="kw3">尋常性狼瘡</span></td>'
        '<td><span class="kw3">真性皮膚結核（皮膚に結核菌がいる）</span></td>'
        '<td><span class="kw3">顔面の褐紅色局面。'
        '硝子圧法でapple-jelly nodule</span>（<span class="kw">Q.65</span>）</td></tr></table>'
        '<span class="kw4">「尋常性」は vulgaris（ありふれた・普通の）の訳語</span>で、'
        '<span class="kw4">その疾患群の中で最も一般的な病型を指す</span>にすぎない。'
        '<span class="kw3">名前が似ていても病態はまったく異なるので、'
        '一つずつ本態と特徴を結びつけて覚える</span>。'
        '<span class="kw3">なお尋常性乾癬と尋常性白斑はどちらもKöbner現象が陽性</span>である'
        '（<span class="kw">Q.94</span>）。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">関節痛を伴う皮膚疾患の代表＝尋常性乾癬（乾癬性関節炎 10〜30％）</span>。<br>'
         '② 乾癬性関節炎＝<span class="kw3">RF陰性・DIP関節・非対称性・指趾炎・付着部炎</span>。<br>'
         '③ ほかに関節症状を伴う＝<span class="kw3">Behçet病・Sweet病・結節性紅斑・'
         '皮膚筋炎・SLE・成人Still病・IgA血管炎・SAPHO症候群</span>。<br>'
         '④ <span class="kw3">脊椎関節炎</span>＝乾癬性関節炎・強直性脊椎炎・反応性関節炎・'
         'IBD関連（<span class="kw3">RF陰性・HLA-B27</span>）。<br>'
         '⑤ <span class="kw4">痤瘡・白斑・魚鱗癬・天疱瘡は関節症状を伴わない</span>。<br>'
         '⑥ <span class="kw3">尋常性白斑と尋常性乾癬はKöbner現象陽性</span>。<br>'
         '⑦ 例外＝<span class="kw3">SAPHO症候群（掌蹠膿疱症・重症痤瘡＋胸鎖肋関節炎）</span>。')),

Q('105G-51', 72, [('bi', '📷')],
  '68歳の男性。<span class="kw">口腔内病変と四肢の皮疹</span>とを主訴に来院した。'
  '<span class="kw">3年前から両側頬粘膜に粘膜疹</span>がある。'
  '<span class="kw">最近、四肢に皮疹が出現</span>してきた。'
  '頬粘膜病変の写真（A）と皮膚病変の写真（B）とを示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '白板症', False, '<span class="kw4">こすっても除去できない白色の板状病変で、'
                     '他の疾患に分類できないもの</span>と定義される。'
                     '<span class="kw4">前癌病変（口腔癌のリスク）であり生検が必要</span>だが、'
                     '<span class="kw4">レース状の線条をなさず、四肢に皮疹を伴うこともない</span>。'),
   ('b', '扁平苔癬', True, '<span class="kw3">両側頬粘膜のレース状白色線条〈Wickham線条〉が数年持続し、'
                     '遅れて四肢に紫紅色の扁平丘疹が出現</span>——'
                     '<span class="kw3">扁平苔癬（口腔病変が先行した典型例）</span>である'
                     '（<span class="kw">Q.85・Q.95・Q.97</span>）。'
                     '<span class="kw3">口腔病変は両側性・対称性に出るのが特徴</span>。'),
   ('c', 'Behçet病', False, '<span class="kw4">口腔病変は「再発性アフタ性潰瘍」であり、'
                     '有痛性の円形潰瘍が出ては治るのを繰り返す</span>。'
                     '<span class="kw4">レース状の白色線条ではない</span>。'
                     '皮膚症状は結節性紅斑様皮疹・毛囊炎様皮疹で、'
                     '外陰部潰瘍とぶどう膜炎を伴う（<span class="kw">Q.76</span>）。'),
   ('d', '尋常性天疱瘡', False, '<span class="kw4">口腔粘膜のびらんで初発することが多い</span>点は共通するが、'
                     '<span class="kw4">病変は「びらん」であって白色線条ではなく、'
                     '皮膚では弛緩性水疱とびらんを生じる</span>。'
                     '<span class="kw4">Nikolsky現象陽性・抗デスモグレイン3抗体陽性</span>で確認する。'),
   ('e', '多形滲出性紅斑', False, '<span class="kw4">四肢末梢に標的状紅斑が急性・左右対称に多発する</span>'
                     '（<span class="kw">Q.60</span>）。'
                     '<span class="kw4">3年にわたって粘膜病変が持続するという慢性経過とは相容れない</span>。')],
  '両側頬粘膜のレース状白色線条（Wickham線条）が3年持続し、遅れて四肢に皮疹。扁平苔癬。',
  imgs=['images/105G-51_1.jpeg', 'images/105G-51_2.jpeg'],
  patho=('🕸️ 口腔扁平苔癬——「レース状の白」を見分ける',
         '<span class="kw3">扁平苔癬は皮膚だけの病気ではなく、口腔粘膜が主戦場になることも多い</span>。'
         '<span class="kw3">口腔扁平苔癬〈oral lichen planus〉は中年以降の女性にやや多く、'
         '有病率は1〜2％と決してまれではない</span>。'
         '<span class="kw3">本例のように粘膜病変が数年先行し、後から皮膚病変が出る</span>ことも、'
         '<span class="kw3">逆に皮膚病変が先行することもある</span>。<br>'
         '<span class="kw3">口腔扁平苔癬の病型</span>: '
         '<table class="tb"><tr><th>病型</th><th>所見</th><th>症状</th></tr>'
         '<tr><td><span class="kw3">網状型（最多）</span></td>'
         '<td><span class="kw3">両側頬粘膜にレース状・網目状の白色線条（Wickham線条）</span></td>'
         '<td><span class="kw3">無症状のことが多い</span></td></tr>'
         '<tr><td>丘疹型・局面型</td><td>白色の小丘疹・局面</td><td>軽度</td></tr>'
         '<tr><td><span class="kw3">萎縮型・紅斑型</span></td>'
         '<td><span class="kw3">歯肉に発赤・萎縮（剝離性歯肉炎）</span></td>'
         '<td>接触痛</td></tr>'
         '<tr><td><span class="kw3">びらん型・潰瘍型</span></td>'
         '<td><span class="kw3">びらん・潰瘍。周囲に白色線条を伴う</span></td>'
         '<td><span class="kw3">強い疼痛・摂食障害</span></td></tr></table>'
         '<span class="kw3">診断のポイントは「両側性・対称性」</span>である。'
         '<span class="kw3">扁平苔癬は左右の頬粘膜に対称に出る</span>のに対し、'
         '<span class="kw4">片側性・限局性の白色病変では白板症や癌を疑って生検する</span>。<br>'
         '<span class="kw4">最も重要な臨床的注意点は悪性化</span>である。'
         '<span class="kw4">口腔扁平苔癬、とくにびらん型・萎縮型からは'
         '有棘細胞癌（口腔扁平上皮癌）が発生しうる（年率0.5〜1％程度）</span>ため、'
         '<span class="kw3">WHOは口腔潜在的悪性疾患〈oral potentially malignant disorder〉に'
         '分類しており、定期的な観察と、'
         '変化する部位・治りにくい潰瘍があれば生検</span>を行う。'
         '<span class="kw3">禁煙・禁酒の指導、口腔衛生の維持、義歯や歯科金属による機械的刺激の除去</span>も'
         '重要な管理である。<br>'
         '<span class="kw3">背景の確認</span>も忘れない。'
         '<span class="kw3">C型肝炎ウイルス、薬剤（苔癬型薬疹）、歯科金属アレルギー、'
         '慢性GVHD</span>が扁平苔癬（様病変）を起こす'
         '（<span class="kw">Q.85</span>）。'
         '<span class="kw3">歯科金属が原因なら、パッチテストで原因金属を同定して補綴物を交換すると改善する</span>'
         '（<span class="kw">Q.30</span>）。'),
  deep=('📌 口腔の白色病変——「取れるか／両側か／変化するか」',
        '<table class="tb"><tr><th>疾患</th><th>ガーゼでこする</th><th>分布</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">扁平苔癬</span></td>'
        '<td><span class="kw3">取れない</span></td>'
        '<td><span class="kw3">両側頬粘膜に対称性</span></td>'
        '<td><span class="kw3">レース状白色線条。びらん型は疼痛と癌化リスク</span></td></tr>'
        '<tr><td><span class="kw3">白板症</span></td>'
        '<td><span class="kw3">取れない</span></td>'
        '<td><span class="kw3">片側・限局</span></td>'
        '<td><span class="kw3">前癌病変。均一型より不均一型（紅斑混在）が高リスク。生検</span></td></tr>'
        '<tr><td><span class="kw3">口腔カンジダ症</span></td>'
        '<td><span class="kw3">取れる（下は発赤）</span></td><td>散在</td>'
        '<td><span class="kw3">高齢・義歯・ステロイド吸入・抗菌薬・免疫低下。'
        'KOH／培養で確認、抗真菌薬</span></td></tr>'
        '<tr><td>白色海綿状母斑</td><td>取れない</td><td>両側びまん性</td>'
        '<td>遺伝性・幼少期から・無症状</td></tr>'
        '<tr><td>Koplik斑</td><td>—</td><td>臼歯対側の頬粘膜</td>'
        '<td><span class="kw3">麻疹のカタル期</span></td></tr>'
        '<tr><td>咬傷（頬咬み）</td><td>取れない</td><td>咬合線に一致</td><td>白色のぼやけた線状</td></tr></table>'
        '<span class="kw3">扁平苔癬の治療</span>: '
        '<span class="kw3">①無症状の網状型は経過観察でよい</span>。'
        '<span class="kw3">②症状のある萎縮型・びらん型にはステロイド軟膏（口腔用）・含嗽</span>、'
        '<span class="kw3">③難治例にはタクロリムス軟膏・ステロイド内服・免疫抑制薬</span>、'
        '<span class="kw3">④誘因の除去（歯科金属・薬剤・不適合義歯・不良な口腔衛生）</span>、'
        '<span class="kw3">⑤カンジダの二次感染を合併しやすいので必要なら抗真菌薬</span>。'
        '<span class="kw3">⑥定期観察（3〜6か月ごと）で悪性化を監視</span>。<br>'
        '<span class="kw4">本問（105G-51）と Q.95（101H-24）は、同じ症例文・同じ写真を'
        '別々の年度に出題したもの</span>である。'
        '<span class="kw4">違うのは年齢（68歳／78歳）と選択肢eだけ</span>で、'
        '<span class="kw3">「口腔粘膜病変が先行し、後から四肢の皮疹」というパターンが'
        'それだけ典型的で重要だという証拠</span>と言える。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">両側頬粘膜のレース状白色線条＝扁平苔癬（Wickham線条）</span>。<br>'
         '② <span class="kw3">口腔病変が皮膚病変に数年先行することがある</span>。<br>'
         '③ <span class="kw3">両側性・対称性なら扁平苔癬、片側・限局なら白板症／癌を疑う</span>。<br>'
         '④ <span class="kw3">こすって取れるならカンジダ、取れないなら扁平苔癬・白板症</span>。<br>'
         '⑤ <span class="kw4">びらん型の口腔扁平苔癬は有棘細胞癌のリスク</span>——定期観察と生検。<br>'
         '⑥ 背景＝<span class="kw3">C型肝炎・薬剤・歯科金属・GVHD</span>。<br>'
         '⑦ 治療＝<span class="kw3">ステロイド局所（無症状の網状型は経過観察）＋誘因除去</span>。')),

Q('104I-4', 96, [],
  '<strong>尋常性乾癬でみられるのはどれか。2つ選べ。</strong>',
  [('a', 'Auspitz現象', True, '<span class="kw3">鱗屑を無理に剝がすと点状の出血を生じる現象</span>。'
                     '<span class="kw3">乾癬では真皮乳頭が延長し毛細血管が拡張して表面近くまで来ているため、'
                     '薄くなった表皮ごと鱗屑を剝がすと血管が破れる</span>'
                     '（<span class="kw">Q.86</span>の病理と直結）。'),
   ('b', 'Darier徴候', False, '<span class="kw4">病変をこすると膨疹・発赤を生じる現象で、'
                     '肥満細胞症（色素性蕁麻疹）に特徴的</span>。'
                     '<span class="kw4">肥満細胞から遊離したヒスタミンによる</span>。'
                     '<span class="kw4">Darier病（Q.82）とは無関係の別概念</span>。'),
   ('c', 'Köbner現象', True, '<span class="kw3">機械的刺激を受けた部位に同じ皮疹が新生する現象</span>。'
                     '<span class="kw3">尋常性乾癬の代表的な所見</span>で、'
                     '肘膝伸側・腰背部・殿裂といった好発部位を説明する'
                     '（<span class="kw">Q.89・Q.90</span>）。'),
   ('d', 'Leser-Trélat徴候', False, '<span class="kw4">脂漏性角化症が短期間に急増する現象で、'
                     '内臓悪性腫瘍（消化器癌など）を示唆するデルマドローム</span>。'
                     '<span class="kw4">乾癬とは関係がない</span>。'),
   ('e', 'Nikolsky現象', False, '<span class="kw4">正常に見える皮膚をこすると表皮が剝離する現象で、'
                     'TEN・SSSS・尋常性天疱瘡で陽性</span>（<span class="kw">Q.73</span>）。'
                     '<span class="kw4">乾癬では表皮の細胞間接着は保たれているため陰性</span>。')],
  '尋常性乾癬でみられるのはAuspitz現象（鱗屑を剝がすと点状出血）とKöbner現象（刺激部位に同じ皮疹が新生）。',
  ans_label='ａ・ｃ',
  patho=('🩸 Auspitz現象——病理がそのまま臨床所見になる',
         '<span class="kw3">Auspitz現象〈Auspitz sign〉</span>は'
         '<span class="kw3">乾癬の鱗屑をピンセットや爪で剝離すると、'
         'その下面に点状の出血が現れる現象</span>である。'
         '<span class="kw3">これは尋常性乾癬の病理そのものを目で見ていることに等しい</span>。<br>'
         '<span class="kw3">仕組み</span>: '
         '<span class="kw3">①乾癬では真皮乳頭が上方へ長く延び、その中の毛細血管が拡張・蛇行して'
         '皮膚表面のすぐ近くまで来ている</span>。'
         '<span class="kw3">②一方、乳頭の上を覆う表皮（乳頭上表皮）は菲薄化している（suprapapillary thinning）</span>。'
         '<span class="kw3">③そのため鱗屑を剝がすと、この薄い部分ごと剝がれ、拡張した毛細血管が破れて点状に出血する</span>。'
         '<span class="kw3">つまりAuspitz現象＝「真皮乳頭の延長＋毛細血管拡張＋乳頭上表皮の菲薄化」の可視化</span>である'
         '（<span class="kw">Q.86</span>）。'
         '<span class="kw4">なお実際の診療で無理に鱗屑を剝がすことは、'
         'Köbner現象を誘発しうるので推奨されない</span>——'
         '<span class="kw4">知識として知っておくべき所見であって、日常的に行う手技ではない</span>。<br>'
         '<span class="kw3">乾癬の3つの「現象」を並べる</span>と理解が固まる。'
         '<table class="tb"><tr><th>現象</th><th>手技</th><th>見えるもの</th><th>病理的裏づけ</th></tr>'
         '<tr><td><span class="kw3">ろう片現象</span></td>'
         '<td><span class="kw3">鱗屑を軽くこする</span></td>'
         '<td><span class="kw3">ろうを削ったように白く粉状になる</span></td>'
         '<td><span class="kw3">錯角化した緩い角層</span></td></tr>'
         '<tr><td><span class="kw3">Auspitz現象</span></td>'
         '<td><span class="kw3">鱗屑をさらに剝がす</span></td>'
         '<td><span class="kw3">点状出血</span></td>'
         '<td><span class="kw3">真皮乳頭の延長・毛細血管拡張・乳頭上表皮の菲薄化</span></td></tr>'
         '<tr><td><span class="kw3">Köbner現象</span></td>'
         '<td><span class="kw3">健常部を傷つける</span></td>'
         '<td><span class="kw3">そこに新たな乾癬皮疹</span></td>'
         '<td><span class="kw3">損傷→LL-37→IFN→IL-23／Th17の点火</span></td></tr></table>'),
  deep=('📌 「2つ選べ」を確実に取る——現象・徴候の総まとめ',
        '<span class="kw3">本問は Q.89・Q.90 と同じ知識を「2つ選べ」形式で問うている</span>。'
        '<span class="kw3">選択肢に並ぶ5つの現象・徴候をすべて疾患と結びつけられれば'
        '確実に正解できる</span>。'
        '<table class="tb"><tr><th>名称</th><th>疾患</th><th>ひとことで</th></tr>'
        '<tr><td><span class="kw3">Auspitz現象</span></td>'
        '<td><span class="kw3">尋常性乾癬</span></td>'
        '<td><span class="kw3">鱗屑を剝がすと点状出血</span></td></tr>'
        '<tr><td><span class="kw3">Köbner現象</span></td>'
        '<td><span class="kw3">尋常性乾癬・扁平苔癬・尋常性白斑・扁平疣贅</span></td>'
        '<td><span class="kw3">傷つけた場所に同じ皮疹</span></td></tr>'
        '<tr><td><span class="kw3">Darier徴候</span></td>'
        '<td><span class="kw3">肥満細胞症（色素性蕁麻疹）</span></td>'
        '<td><span class="kw3">こすると膨疹（ヒスタミン）</span></td></tr>'
        '<tr><td><span class="kw3">Leser-Trélat徴候</span></td>'
        '<td><span class="kw3">内臓悪性腫瘍</span></td>'
        '<td><span class="kw3">脂漏性角化症が急に増える</span></td></tr>'
        '<tr><td><span class="kw3">Nikolsky現象</span></td>'
        '<td><span class="kw3">TEN・SSSS・尋常性天疱瘡</span></td>'
        '<td><span class="kw3">こすると表皮が剝がれる</span></td></tr></table>'
        '<span class="kw3">デルマドローム（内臓病変の皮膚症状）</span>もあわせて覚えておくとよい。'
        '<table class="tb"><tr><th>皮膚所見</th><th>示唆する内臓疾患</th></tr>'
        '<tr><td><span class="kw3">Leser-Trélat徴候</span></td><td><span class="kw3">消化器癌など</span></td></tr>'
        '<tr><td><span class="kw3">黒色表皮腫（悪性型）</span></td>'
        '<td><span class="kw3">胃癌（良性型は肥満・インスリン抵抗性）</span></td></tr>'
        '<tr><td><span class="kw3">皮膚筋炎</span></td>'
        '<td><span class="kw3">悪性腫瘍（卵巣癌・肺癌・胃癌など。成人では必ず検索）</span></td></tr>'
        '<tr><td><span class="kw3">壊疽性膿皮症</span></td>'
        '<td><span class="kw3">炎症性腸疾患・関節リウマチ・血液疾患</span></td></tr>'
        '<tr><td><span class="kw3">Sweet病</span></td>'
        '<td><span class="kw3">急性骨髄性白血病・骨髄異形成症候群</span>（<span class="kw">Q.64</span>）</td></tr>'
        '<tr><td>環状紅斑・遊走性壊死性紅斑</td><td>グルカゴノーマ</td></tr>'
        '<tr><td>汎発性の帯状疱疹・難治性カンジダ</td><td>免疫不全（悪性腫瘍・HIV）</td></tr></table>'),
  point=('🎯 国試ポイント',
         '① 尋常性乾癬でみられる＝<span class="kw3">Auspitz現象・Köbner現象・ろう片現象</span>。<br>'
         '② <span class="kw3">Auspitz現象の裏づけ＝真皮乳頭の延長・毛細血管拡張・乳頭上表皮の菲薄化</span>。<br>'
         '③ <span class="kw3">Köbner現象は乾癬・扁平苔癬・尋常性白斑・扁平疣贅</span>。<br>'
         '④ <span class="kw4">Darier徴候＝肥満細胞症</span>（Darier病ではない）。<br>'
         '⑤ <span class="kw4">Leser-Trélat徴候＝内臓悪性腫瘍</span>のデルマドローム。<br>'
         '⑥ <span class="kw4">Nikolsky現象＝TEN・SSSS・尋常性天疱瘡</span>。<br>'
         '⑦ デルマドローム＝<span class="kw3">黒色表皮腫（胃癌）・皮膚筋炎（悪性腫瘍）・'
         '壊疽性膿皮症（IBD）・Sweet病（血液悪性腫瘍）</span>。')),

Q('103D-11', 94, [],
  '<strong>Köbner現象を示すのはどれか。2つ選べ。</strong>',
  [('a', 'Bowen病', False, '<span class="kw4">表皮内有棘細胞癌（上皮内癌）</span>。'
                     '<span class="kw4">境界明瞭で不整形の紅褐色局面に鱗屑・痂皮を伴い、緩徐に拡大</span>する。'
                     '<span class="kw4">腫瘍性病変であり、外傷部位に新病変が生じることはない</span>。'
                     'ヒ素曝露・HPVとの関連が知られ、放置すると浸潤癌になる。'),
   ('b', '扁平苔癬', True, '<span class="kw3">Köbner現象が陽性</span>で、'
                     '<span class="kw3">引っかき傷に沿って紫紅色の扁平丘疹が線状に配列する</span>'
                     '（<span class="kw">Q.85</span>）。'
                     '手関節屈側という擦れやすい部位が好発部位であることとも合致する。'),
   ('c', '尋常性狼瘡', False, '<span class="kw4">結核菌が皮膚に実際に存在する真性皮膚結核</span>。'
                     '<span class="kw4">顔面に褐紅色の局面が緩徐に拡大し、'
                     '硝子圧法でapple-jelly nodule（りんごゼリー様結節）</span>を認める。'
                     '<span class="kw4">感染症であり、Köbner現象を示す疾患ではない</span>'
                     '（結核アレルギーの硬結性紅斑は<span class="kw">Q.65</span>）。'),
   ('d', '菌状息肉症', False, '<span class="kw4">皮膚T細胞リンパ腫。紅斑期→扁平浸潤期→腫瘍期と'
                     '年余をかけて進行し、病理で表皮内へ異型リンパ球が浸潤（Pautrier微小膿瘍）</span>する。'
                     '<span class="kw4">腫瘍性疾患でありKöbner現象は示さない</span>。'),
   ('e', '尋常性乾癬', True, '<span class="kw3">Köbner現象を示す最も代表的な疾患</span>。'
                     '<span class="kw3">損傷を受けた角化細胞がLL-37を放出し、'
                     'IL-23／Th17の炎症ループに点火する</span>ため、'
                     '<span class="kw3">肘膝伸側・腰背部・殿裂といった機械的刺激部位に好発する</span>'
                     '（<span class="kw">Q.89</span>）。')],
  'Köbner現象を示すのは扁平苔癬と尋常性乾癬。ほかに尋常性白斑・扁平疣贅が代表。Bowen病・尋常性狼瘡・菌状息肉症は腫瘍性／感染性で示さない。',
  ans_label='ｂ・ｅ',
  patho=('🧩 Köbner現象を示す疾患——「炎症性」か「そうでないか」',
         '<span class="kw3">Köbner現象を示す疾患は、大きく3つのグループに分けられる</span>。'
         'この分類で覚えると、選択肢に見慣れない疾患が出ても推論できる。'
         '<table class="tb"><tr><th>グループ</th><th>疾患</th><th>機序</th></tr>'
         '<tr><td><span class="kw3">①真のKöbner現象（炎症性疾患）</span></td>'
         '<td><span class="kw3">尋常性乾癬・扁平苔癬・尋常性白斑・'
         'Duhring疱疹状皮膚炎</span></td>'
         '<td><span class="kw3">損傷が自己免疫・自己炎症のループを局所で点火する</span></td></tr>'
         '<tr><td><span class="kw3">②偽Köbner現象（感染性）</span></td>'
         '<td><span class="kw3">扁平疣贅・伝染性軟属腫</span></td>'
         '<td><span class="kw3">掻破で病原体（HPV・伝染性軟属腫ウイルス）が'
         '傷口へ機械的に接種される（自家接種）</span></td></tr>'
         '<tr><td><span class="kw4">③示さない</span></td>'
         '<td><span class="kw4">Bowen病・菌状息肉症・悪性黒色腫などの腫瘍性疾患、'
         '尋常性狼瘡などの慢性感染症</span></td>'
         '<td><span class="kw4">腫瘍細胞や肉芽腫は「傷をつけたら増える」性質を持たない</span></td></tr></table>'
         '<span class="kw3">国試で確実に押さえるべき4つ</span>は'
         '<span class="kw3">「尋常性乾癬・扁平苔癬・尋常性白斑・扁平疣贅」</span>である。'
         '<span class="kw3">語呂ではなく「炎症で自己増幅する病気＋掻いて広がるウイルス性」と'
         '理屈で覚える</span>のがよい。<br>'
         '<span class="kw3">尋常性白斑でのKöbner現象</span>も臨床的に重要である。'
         '<span class="kw3">白斑は自己免疫機序でメラノサイトが破壊される疾患だが、'
         '摩擦・外傷を受けた部位に新たな白斑が出現する</span>。'
         '<span class="kw3">ベルトの当たる腰部、時計のバンド、眼鏡の当たる部位に白斑ができる</span>のは'
         'このためで、<span class="kw3">患者には摩擦を減らすよう指導する</span>。<br>'
         '<span class="kw4">臨床応用</span>としては、'
         '<span class="kw4">Köbner現象を示す疾患では、生検・手術・レーザー・タトゥーなどの'
         '医療行為そのものが新たな皮疹を誘発しうる</span>という点が挙げられる。'
         '<span class="kw3">乾癬患者に手術をすると創部に沿って乾癬が出ることがある</span>ため、'
         '<span class="kw3">あらかじめ説明しておく</span>。'),
  deep=('📌 選択肢に出た「示さない側」の疾患を押さえる',
        '<span class="kw3">正解を選ぶだけでなく、誤答肢の疾患も一通り理解しておくと'
        '別の設問で得点できる</span>。'
        '<table class="tb"><tr><th>疾患</th><th>本態</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">Bowen病</span></td>'
        '<td><span class="kw3">表皮内有棘細胞癌（上皮内癌）</span></td>'
        '<td><span class="kw3">境界明瞭・不整形の紅褐色局面＋鱗屑。'
        'ヒ素曝露・HPV。放置で浸潤癌へ。治療は切除</span></td></tr>'
        '<tr><td><span class="kw3">尋常性狼瘡</span></td>'
        '<td><span class="kw3">真性皮膚結核（皮膚に結核菌がいる）</span></td>'
        '<td><span class="kw3">顔面の褐紅色局面、硝子圧法でapple-jelly nodule、'
        '長期経過で有棘細胞癌が発生しうる。治療は抗結核薬</span></td></tr>'
        '<tr><td><span class="kw3">菌状息肉症</span></td>'
        '<td><span class="kw3">皮膚T細胞リンパ腫</span></td>'
        '<td><span class="kw3">紅斑期→扁平浸潤期→腫瘍期。'
        'Pautrier微小膿瘍。白血化するとSézary症候群</span></td></tr></table>'
        '<span class="kw3">皮膚結核の分類</span>を再確認しておく（<span class="kw">Q.65</span>と対応）。'
        '<span class="kw3">真性皮膚結核（菌がいる）＝尋常性狼瘡・皮膚腺病・疣状皮膚結核・粟粒結核</span>、'
        '<span class="kw3">結核疹（菌はいない・アレルギー反応）＝硬結性紅斑〈Bazin〉・'
        '丘疹壊死性結核疹・顔面播種状粟粒性狼瘡</span>。'
        '<span class="kw3">両者とも治療は抗結核薬</span>だが、'
        '<span class="kw3">病巣から菌が検出されるかどうかが決定的に違う</span>。<br>'
        '<span class="kw3">扁平苔癬と尋常性乾癬の対比</span>（本問の正解2つ）も最後に整理する。'
        '<table class="tb"><tr><th></th><th><span class="kw3">扁平苔癬</span></th>'
        '<th><span class="kw3">尋常性乾癬</span></th></tr>'
        '<tr><td>色調・形</td><td><span class="kw3">紫紅色・多角形・扁平・光沢</span></td>'
        '<td><span class="kw3">鮮紅色・境界明瞭・銀白色の厚い鱗屑</span></td></tr>'
        '<tr><td>好発</td><td><span class="kw3">四肢屈側（手関節屈側）</span></td>'
        '<td><span class="kw3">四肢伸側（肘膝）・頭皮・腰背部・臍</span></td></tr>'
        '<tr><td>粘膜</td><td><span class="kw3">口腔にレース状白色線条（約半数）</span></td>'
        '<td><span class="kw3">原則なし</span>（<span class="kw">Q.83</span>）</td></tr>'
        '<tr><td>瘙痒</td><td><span class="kw3">強い</span></td><td>約半数で軽度</td></tr>'
        '<tr><td>病理</td><td><span class="kw3">基底細胞の液状変性＋帯状浸潤＋顆粒層の楔状肥厚</span></td>'
        '<td><span class="kw3">錯角化＋顆粒層消失＋Munro微小膿瘍</span></td></tr>'
        '<tr><td>Köbner</td><td><span class="kw3">陽性</span></td>'
        '<td><span class="kw3">陽性</span></td></tr></table>'),
  point=('🎯 国試ポイント',
         '① Köbner現象を示す4つ＝<span class="kw3">尋常性乾癬・扁平苔癬・尋常性白斑・扁平疣贅</span>。<br>'
         '② 扁平疣贅・伝染性軟属腫は<span class="kw3">偽Köbner現象（掻破による自家接種）</span>。<br>'
         '③ <span class="kw4">腫瘍性（Bowen病・菌状息肉症）・慢性感染（尋常性狼瘡）は示さない</span>。<br>'
         '④ <span class="kw3">Bowen病＝表皮内有棘細胞癌</span>（ヒ素・HPV）。<br>'
         '⑤ <span class="kw3">尋常性狼瘡＝真性皮膚結核、apple-jelly nodule</span>。'
         '<span class="kw3">硬結性紅斑は結核疹</span>（<span class="kw">Q.65</span>）。<br>'
         '⑥ <span class="kw3">扁平苔癬は屈側・紫紅色・粘膜あり、乾癬は伸側・鱗屑・粘膜なし</span>。<br>'
         '⑦ Köbner陽性疾患では<span class="kw3">手術・生検・タトゥーが新皮疹を誘発</span>しうる。')),

Q('101H-24', 59, [('bi', '📷')],
  '78歳の男性。<span class="kw">口腔内病変と四肢の皮疹</span>とを主訴に来院した。'
  '<span class="kw">3年前から両側頬粘膜に粘膜疹</span>がある。'
  '<span class="kw">最近、四肢に皮疹が出現</span>してきた。'
  '頬粘膜病変の写真（A）と皮膚病変の写真（B）とを示す。<br>'
  '<strong>最も考えられるのはどれか。</strong>',
  [('a', '白板症', False, '<span class="kw4">こすっても取れない白色板状病変で、他の疾患に分類できないもの</span>。'
                     '<span class="kw4">前癌病変であり生検が要る</span>が、'
                     '<span class="kw4">レース状の線条をなさず、四肢の皮疹を伴わない</span>。'
                     '高齢男性・喫煙者に多い点は本例と重なるので、'
                     '<span class="kw4">「網目状か・両側性か」で切る</span>。'),
   ('b', '扁平苔癬', True, '<span class="kw3">両側頬粘膜のレース状白色線条が3年持続し、'
                     '遅れて四肢に紫紅色の扁平丘疹が出現</span>——'
                     '<span class="kw3">扁平苔癬</span>である'
                     '（<span class="kw">Q.85・Q.92・Q.97</span>）。'
                     '<span class="kw3">粘膜と皮膚の両方を診て初めて診断が固まる</span>典型例。'),
   ('c', 'Behçet病', False, '<span class="kw4">口腔病変は再発性のアフタ性潰瘍</span>であり、'
                     '<span class="kw4">3年間持続する白色線条ではない</span>。'
                     '外陰部潰瘍・ぶどう膜炎・結節性紅斑様皮疹を伴う'
                     '（<span class="kw">Q.76</span>）。'),
   ('d', '尋常性天疱瘡', False, '<span class="kw4">口腔粘膜のびらんで初発することが多い</span>点が紛らわしいが、'
                     '<span class="kw4">病変はびらんであって網目状の白色線条ではない</span>。'
                     '皮膚では弛緩性水疱・びらんが緩徐に拡大し、'
                     '<span class="kw4">Nikolsky現象陽性・抗デスモグレイン3抗体陽性</span>となる。'),
   ('e', 'ヘルペス性歯肉口内炎', False, '<span class="kw4">単純ヘルペスウイルスの初感染で、'
                     '主に小児が発熱とともに口腔内に多数の小水疱・アフタを生じ、'
                     '歯肉の発赤腫脹と強い疼痛を伴う</span>。'
                     '<span class="kw4">急性の経過（1〜2週で軽快）であり、3年持続する病変とは相容れない</span>。')],
  '両側頬粘膜のレース状白色線条が3年持続し、遅れて四肢に皮疹。扁平苔癬。Q.92（105G-51）と同一の症例文・写真で選択肢eのみが異なる。',
  imgs=['images/101H-24_1.jpeg', 'images/101H-24_2.jpeg'],
  patho=('🔁 同じ症例が別年度に出る——だからこそ確実に取る',
         '<span class="kw3">本問（101H-24）は Q.92（105G-51）とまったく同じ症例文・同じ写真</span>で、'
         '<span class="kw3">違うのは患者の年齢（78歳／68歳）と選択肢eだけ</span>である。'
         '<span class="kw4">それでも正答率は101H-24が59％、105G-51が72％と差がある</span>——'
         '<span class="kw4">選択肢eが「ヘルペス性歯肉口内炎」か「多形滲出性紅斑」かで'
         '迷い方が変わった</span>ことがうかがえる。'
         '<span class="kw3">いずれにせよ「両側頬粘膜のレース状白色線条＋四肢の紫紅色扁平丘疹＝扁平苔癬」という'
         'パターンを一度覚えれば、どちらも確実に取れる</span>。<br>'
         '<span class="kw3">扁平苔癬の診断における「時間軸」</span>に注目したい。'
         '<span class="kw3">粘膜病変が3年持続している</span>——'
         '<span class="kw3">この慢性経過だけで、急性疾患（ヘルペス性歯肉口内炎・多形滲出性紅斑・'
         'SJS）はすべて除外できる</span>。'
         '<span class="kw3">口腔粘膜の慢性病変を来す疾患は限られており、'
         '扁平苔癬・白板症・尋常性天疱瘡・粘膜類天疱瘡・慢性カンジダ症・Behçet病（再発性）</span>'
         'くらいである。'
         '<span class="kw3">そこへ「両側対称のレース状白色線条」と「四肢の皮疹」が加われば'
         '扁平苔癬に絞られる</span>。<br>'
         '<span class="kw3">高齢者の口腔病変で気をつけること</span>: '
         '<span class="kw3">①口腔癌の除外</span>——'
         '<span class="kw3">高齢・喫煙・飲酒歴があれば、白色病変でも紅色病変でも'
         '悪性を念頭に置き、硬結・潰瘍・易出血性があれば生検</span>する。'
         '<span class="kw3">②義歯・歯科金属による機械的／アレルギー性の刺激</span>——'
         '<span class="kw3">不適合義歯の当たる部位に一致した病変は刺激性で、義歯調整で改善する</span>。'
         '<span class="kw3">③口腔カンジダ症の合併</span>——'
         '<span class="kw3">扁平苔癬にカンジダが二次感染すると症状が急に悪化する</span>。'
         '<span class="kw3">④薬剤</span>——'
         '<span class="kw3">高齢者は多剤併用のため苔癬型薬疹の頻度が高い</span>'
         '（<span class="kw">Q.85</span>）。'),
  deep=('📌 扁平苔癬の全体像を1枚にまとめる',
        '<table class="tb"><tr><th>項目</th><th>内容</th></tr>'
        '<tr><td><span class="kw3">本態</span></td>'
        '<td><span class="kw3">基底細胞に対する細胞傷害性T細胞の攻撃（界面皮膚炎）</span></td></tr>'
        '<tr><td><span class="kw3">皮疹</span></td>'
        '<td><span class="kw3">紫紅色・多角形・扁平・光沢のある丘疹（6つのP）＋Wickham線条</span></td></tr>'
        '<tr><td><span class="kw3">好発部位</span></td>'
        '<td><span class="kw3">手関節屈側・前腕・下腿・腰部</span>。'
        '<span class="kw3">Köbner現象陽性</span></td></tr>'
        '<tr><td><span class="kw3">粘膜</span></td>'
        '<td><span class="kw3">両側頬粘膜のレース状白色線条（皮膚病変の約半数）、'
        '外陰・腟、食道</span></td></tr>'
        '<tr><td><span class="kw3">爪</span></td>'
        '<td><span class="kw3">縦線条・菲薄化・翼状片〈pterygium〉・爪甲消失</span></td></tr>'
        '<tr><td><span class="kw3">頭皮</span></td>'
        '<td><span class="kw3">毛孔性扁平苔癬→瘢痕性脱毛</span></td></tr>'
        '<tr><td><span class="kw3">病理</span></td>'
        '<td><span class="kw3">基底細胞の液状変性・帯状リンパ球浸潤・顆粒層の楔状肥厚・'
        '鋸歯状の表皮突起・Civatte小体</span></td></tr>'
        '<tr><td><span class="kw3">背景</span></td>'
        '<td><span class="kw3">C型肝炎・薬剤（苔癬型薬疹）・歯科金属・慢性GVHD</span></td></tr>'
        '<tr><td><span class="kw3">合併症</span></td>'
        '<td><span class="kw4">びらん型口腔扁平苔癬からの有棘細胞癌</span></td></tr>'
        '<tr><td><span class="kw3">治療</span></td>'
        '<td><span class="kw3">ステロイド外用（強力なもの・必要なら密封）、抗ヒスタミン薬、'
        '広範例に光線療法・レチノイド・シクロスポリン、粘膜には局所ステロイド、'
        '誘因の除去、定期観察</span></td></tr></table>'
        '<span class="kw3">扁平苔癬は本章で6問（Q.85・92・94・95・97・98）出題されており、'
        '尋常性乾癬と並ぶ「角化症」章の二本柱</span>である。'
        '<span class="kw3">乾癬との対比（伸側／屈側、鱗屑／光沢、粘膜なし／あり）を軸に'
        'まとめて覚えるのが効率的</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">両側頬粘膜のレース状白色線条＋四肢の紫紅色扁平丘疹＝扁平苔癬</span>。<br>'
         '② <span class="kw3">3年持続という慢性経過</span>で'
         '<span class="kw3">急性疾患（ヘルペス性歯肉口内炎・多形滲出性紅斑）は除外</span>。<br>'
         '③ 口腔の慢性病変＝<span class="kw3">扁平苔癬・白板症・天疱瘡・粘膜類天疱瘡・'
         'カンジダ症・Behçet病</span>。<br>'
         '④ <span class="kw3">高齢者では口腔癌の除外</span>（硬結・潰瘍・易出血なら生検）。<br>'
         '⑤ 扁平苔癬は<span class="kw3">爪（翼状片）・頭皮（瘢痕性脱毛）・外陰</span>も侵す。<br>'
         '⑥ 背景＝<span class="kw3">C型肝炎・薬剤・歯科金属・GVHD</span>。<br>'
         '⑦ <span class="kw3">Q.92 と同一症例</span>——'
         'パターンで覚えれば両方確実に取れる。')),

Q('100B-11', 96, [],
  '<strong>乾癬について正しいのはどれか。</strong>',
  [('a', '糸状菌感染症である。', False, '<span class="kw4">乾癬は感染症ではない</span>。'
                     '<span class="kw4">糸状菌（皮膚糸状菌）による感染症は白癬</span>で、'
                     '<span class="kw4">境界明瞭な鱗屑性紅斑という点で乾癬と紛らわしいため、'
                     'KOH直接鏡検で必ず否定する</span>（<span class="kw">Q.89</span>）。'
                     '<span class="kw4">名前の「癬」に惑わされない</span>。'),
   ('b', '真皮に好中球が集積する。', False, '<span class="kw4">乾癬で好中球が集まるのは「角層内」（Munro微小膿瘍）と'
                     '「表皮有棘層上部」（Kogoj海綿状膿疱）であって真皮ではない</span>'
                     '（<span class="kw">Q.86</span>）。'
                     '<span class="kw4">真皮にびまん性の好中球浸潤を来すのはSweet病</span>'
                     '（<span class="kw">Q.64・Q.80</span>）。'),
   ('c', '表皮角化細胞の分裂能が低下する。', False, '<span class="kw4">逆で、分裂能は著しく亢進する</span>。'
                     '<span class="kw4">ターンオーバーが約45日から3〜4日へ短縮</span>し、'
                     '<span class="kw4">未熟な角層が厚く積み上がる（錯角化）</span>。'
                     'これが銀白色の鱗屑の正体である。'),
   ('d', 'PUVA療法が用いられる。', True, '<span class="kw3">ソラレン（光感受性物質）を外用または内服してから'
                     '長波長紫外線〈UVA〉を照射する光化学療法</span>。'
                     '<span class="kw3">活性化したT細胞のアポトーシスを誘導し、乾癬の標準的治療の一つ</span>である。'
                     '<span class="kw3">現在はナローバンドUVB（311nm）がより簡便で主流</span>だが、'
                     'PUVAも用いられる。'),
   ('e', '副腎皮質ステロイド内服が第一選択である。', False, '<span class="kw4">乾癬にステロイドの全身投与は原則行わない</span>。'
                     '<span class="kw4">一時的には効くが、中止・減量時に'
                     '膿疱性乾癬や乾癬性紅皮症へ悪化させる（リバウンド）</span>'
                     '（<span class="kw">Q.84</span>）。'
                     '<span class="kw4">ステロイドは「外用」が第一選択であり、「内服」ではない</span>。')],
  '乾癬は感染症ではなく、角化細胞の増殖が亢進する炎症性角化症。好中球は角層内（Munro微小膿瘍）に集まる。治療にPUVA療法が用いられ、ステロイド全身投与は行わない。',
  patho=('☀️ 光線療法——なぜ紫外線が乾癬に効くのか',
         '<span class="kw3">紫外線療法〈光線療法〉は乾癬治療の重要な柱</span>であり、'
         '<span class="kw3">外用でコントロールできない中等症以上で、内服や生物学的製剤の前に'
         '選択される</span>。<br>'
         '<span class="kw3">作用機序</span>は'
         '<span class="kw3">①皮膚に浸潤した活性化T細胞（Th17など）にDNA損傷を与えてアポトーシスを誘導する、'
         '②ランゲルハンス細胞の抗原提示能を抑える、'
         '③制御性T細胞を誘導して免疫寛容を促す、'
         '④角化細胞の増殖を抑制する</span>——'
         '要するに<span class="kw3">「乾癬の炎症ループを担う細胞を局所で減らす」</span>治療である。'
         '<span class="kw3">「夏に軽快し冬に悪化する」という乾癬の季節変動</span>は、'
         '日光（自然のUVB）による同じ効果で説明できる。<br>'
         '<span class="kw3">主な光線療法</span>: '
         '<table class="tb"><tr><th>方法</th><th>内容</th><th>特徴</th></tr>'
         '<tr><td><span class="kw3">PUVA療法</span></td>'
         '<td><span class="kw3">ソラレン（P：psoralen）を外用／内服＋UVA照射</span></td>'
         '<td><span class="kw3">ソラレンがDNAに結合しUVAで架橋を作る。'
         '効果は高いが、内服では照射後も一定時間の遮光とサングラス（白内障予防）が必要</span>。'
         '<span class="kw4">長期・累積照射で皮膚癌（有棘細胞癌）のリスク</span></td></tr>'
         '<tr><td><span class="kw3">ナローバンドUVB（311nm）</span></td>'
         '<td><span class="kw3">狭い波長域のUVBのみを照射</span></td>'
         '<td><span class="kw3">ソラレン不要で簡便、紅斑を起こしにくく、'
         '発癌リスクもPUVAより低いため現在の主流</span>。'
         '<span class="kw">尋常性白斑・アトピー性皮膚炎・菌状息肉症にも用いる</span></td></tr>'
         '<tr><td>エキシマライト（308nm）</td><td>病変部だけに高出力で照射</td>'
         '<td><span class="kw3">限局性の病変に有効。健常部を照射しない</span></td></tr></table>'
         '<span class="kw4">注意点</span>: '
         '<span class="kw4">①累積照射量を記録し、皮膚癌のリスクを管理する</span>、'
         '<span class="kw4">②光線過敏を来す疾患（SLE・色素性乾皮症・ポルフィリン症）や'
         '光感受性薬剤の内服中は禁忌または慎重投与</span>、'
         '<span class="kw4">③シクロスポリンとの併用は発癌リスクを高めるため避ける</span>。'),
  deep=('📌 乾癬治療の「してはいけない」——ステロイド全身投与',
        '<span class="kw3">本問の最重要ポイントは選択肢eを切ること</span>である。'
        '<span class="kw4">乾癬に副腎皮質ステロイドの全身投与（内服・注射）は原則として行わない</span>。'
        '理由は明確で、'
        '<span class="kw4">①投与中は劇的に軽快するが、'
        '②減量・中止に伴って強いリバウンドを起こし、'
        '③しばしば膿疱性乾癬（汎発型）や乾癬性紅皮症という'
        '入院を要する重症型へ移行させてしまう</span>からである'
        '（<span class="kw">Q.84</span>の症例はまさにこの誘因で発症しうる病型）。'
        '<span class="kw3">ステロイドは「外用」が第一選択</span>で、'
        '<span class="kw3">活性型ビタミンD3外用との配合剤</span>が広く使われる。<br>'
        '<span class="kw3">乾癬治療の全体像（再掲・階段状に上げる）</span>: '
        '<table class="tb"><tr><th>段階</th><th>治療</th></tr>'
        '<tr><td>軽症（BSA 10％未満）</td>'
        '<td><span class="kw3">ステロイド外用＋活性型ビタミンD3外用（配合剤）</span></td></tr>'
        '<tr><td>中等症</td>'
        '<td><span class="kw3">光線療法（ナローバンドUVB・PUVA）</span></td></tr>'
        '<tr><td>中等症〜重症</td>'
        '<td><span class="kw3">エトレチナート、シクロスポリン、メトトレキサート、'
        'アプレミラスト、JAK/TYK2阻害薬</span></td></tr>'
        '<tr><td>難治・関節症性・膿疱性</td>'
        '<td><span class="kw3">生物学的製剤（TNF-α／IL-17／IL-23阻害薬）</span></td></tr></table>'
        '<span class="kw3">白癬との鑑別</span>も本問の選択肢aから思い出しておく。'
        '<table class="tb"><tr><th></th><th><span class="kw3">尋常性乾癬</span></th>'
        '<th><span class="kw3">体部白癬</span></th></tr>'
        '<tr><td>辺縁</td><td><span class="kw3">全体が均一に浸潤・鱗屑</span></td>'
        '<td><span class="kw3">辺縁が堤防状に隆起し中心が治癒（中心治癒傾向）</span></td></tr>'
        '<tr><td>分布</td><td><span class="kw3">左右対称・伸側・頭皮・爪・殿裂</span></td>'
        '<td><span class="kw3">非対称・単発〜数個</span></td></tr>'
        '<tr><td>検査</td><td>—</td><td><span class="kw3">KOH直接鏡検で菌糸を証明</span></td></tr>'
        '<tr><td>治療</td><td>ステロイド外用</td>'
        '<td><span class="kw3">抗真菌薬外用</span>'
        '（<span class="kw4">ステロイドを塗ると異型白癬になる</span>）</td></tr></table>'
        '<span class="kw4">「癬」という字がつく疾患（乾癬・白癬・疥癬・魚鱗癬）のうち、'
        '感染症は白癬（真菌）と疥癬（ヒゼンダニ）だけ</span>である。'),
  point=('🎯 国試ポイント',
         '① 乾癬は<span class="kw4">感染症ではない</span>——'
         '<span class="kw3">IL-23／Th17による炎症性角化症</span>。<br>'
         '② <span class="kw3">角化細胞の増殖は亢進</span>（ターンオーバー45日→3〜4日）。<br>'
         '③ 好中球は<span class="kw3">角層内（Munro微小膿瘍）</span>に集まる'
         '（<span class="kw4">真皮ならSweet病</span>）。<br>'
         '④ <span class="kw3">PUVA療法・ナローバンドUVBが用いられる</span>。'
         '<span class="kw4">PUVAは長期で皮膚癌のリスク</span>。<br>'
         '⑤ <span class="kw4">ステロイドの全身投与は行わない</span>（中止時に膿疱性乾癬・紅皮症へ）。'
         '<span class="kw3">外用が第一選択</span>。<br>'
         '⑥ 白癬との鑑別＝<span class="kw3">中心治癒傾向とKOH直接鏡検</span>。<br>'
         '⑦ 「癬」がつく疾患で感染症は<span class="kw3">白癬・疥癬</span>のみ。')),

Q('97G-76', None, [],
  '<strong>粘膜疹がみられるのはどれか。</strong>',
  [('a', 'うっ滞性皮膚炎', False, '<span class="kw4">下肢静脈瘤・深部静脈血栓後遺症による慢性静脈うっ滞を背景に、'
                     '下腿下1/3〜足関節周囲に色素沈着・湿疹・硬化を生じる</span>。'
                     '<span class="kw4">下肢に限局する疾患で粘膜とは無縁</span>である。'),
   ('b', '硬結性紅斑', False, '<span class="kw4">下腿（とくに後面）の慢性の小葉性脂肪織炎で、結核アレルギー（結核疹）</span>'
                     '（<span class="kw">Q.65・Q.68</span>）。'
                     '<span class="kw4">皮下脂肪織の病変であり粘膜疹は生じない</span>。'),
   ('c', '光線角化症', False, '<span class="kw4">日光角化症。長期の紫外線曝露により高齢者の露光部（顔・手背・禿頭）に'
                     '生じる前癌病変（表皮内癌）</span>で、'
                     '<span class="kw4">鱗屑・痂皮を伴う紅褐色斑</span>。'
                     '<span class="kw4">紫外線が届かない粘膜には生じない</span>'
                     '（口唇には光線口唇炎という類縁病態がある）。'),
   ('d', '扁平苔癬', True, '<span class="kw3">皮膚病変の約半数に口腔粘膜病変を伴い、'
                     '頬粘膜にレース状の白色線条〈Wickham線条〉を生じる</span>'
                     '（<span class="kw">Q.85・Q.92・Q.95</span>）。'
                     '<span class="kw3">外陰・腟・食道の粘膜も侵しうる</span>。'),
   ('e', 'Gibert薔薇色粃糠疹', False, '<span class="kw4">herald patchに続いて体幹に楕円形の紅斑が'
                     '皮膚割線に沿って多発し、1〜2か月で自然治癒する</span>'
                     '（<span class="kw">Q.88</span>）。'
                     '<span class="kw4">粘膜病変はまれ（あっても軽微）</span>で、'
                     '診断の手がかりにはならない。')],
  '粘膜疹がみられるのは扁平苔癬。頬粘膜のレース状白色線条（Wickham線条）が特徴で、皮膚病変の約半数に伴う。',
  patho=('👅 粘膜疹を伴う皮膚疾患——もう一度、体系で押さえる',
         '<span class="kw3">本問は Q.83（粘膜疹が最も少ないのは？）の裏返し</span>で、'
         '<span class="kw3">「粘膜疹があるか」という一つの軸で疾患を仕分ける練習</span>である。'
         '<span class="kw3">扁平苔癬は「皮膚科疾患でありながら口腔粘膜が主戦場になりうる」代表格</span>で、'
         '本章では6問（<span class="kw">Q.85・92・94・95・97・98</span>）が扁平苔癬に関わる。<br>'
         '<span class="kw3">粘膜疹を伴う皮膚疾患・全身疾患の一覧</span>: '
         '<table class="tb"><tr><th>疾患</th><th>粘膜所見</th></tr>'
         '<tr><td><span class="kw3">扁平苔癬</span></td>'
         '<td><span class="kw3">両側頬粘膜のレース状白色線条（Wickham線条）、'
         'びらん型は疼痛と癌化リスク</span></td></tr>'
         '<tr><td><span class="kw3">尋常性天疱瘡</span></td>'
         '<td><span class="kw3">口腔粘膜のびらんで初発（皮膚病変に数か月先行することも）</span></td></tr>'
         '<tr><td><span class="kw3">粘膜類天疱瘡（瘢痕性類天疱瘡）</span></td>'
         '<td><span class="kw3">眼結膜の瘢痕・癒着（失明のリスク）、口腔・咽頭・食道の狭窄</span></td></tr>'
         '<tr><td><span class="kw3">SJS／TEN</span></td>'
         '<td><span class="kw3">眼・口唇口腔・外陰のびらん（2か所以上）</span>'
         '（<span class="kw">Q.69</span>）</td></tr>'
         '<tr><td><span class="kw3">多形滲出性紅斑（major）</span></td>'
         '<td><span class="kw3">口唇・口腔のびらん</span></td></tr>'
         '<tr><td><span class="kw3">Behçet病</span></td>'
         '<td><span class="kw3">再発性アフタ性潰瘍・外陰部潰瘍</span>（<span class="kw">Q.76</span>）</td></tr>'
         '<tr><td><span class="kw3">膿疱性乾癬</span></td>'
         '<td><span class="kw3">地図状舌・溝状舌</span>（<span class="kw">Q.84</span>）</td></tr>'
         '<tr><td>Darier病</td><td>口腔粘膜の白色小丘疹（<span class="kw">Q.82</span>）</td></tr>'
         '<tr><td>手足口病・ヘルパンギーナ</td><td>口腔内の小水疱・アフタ</td></tr>'
         '<tr><td>麻疹</td><td><span class="kw3">Koplik斑</span></td></tr>'
         '<tr><td>川崎病</td><td><span class="kw3">口唇紅潮・亀裂、苺舌、眼球結膜充血</span></td></tr>'
         '<tr><td>梅毒（第2期）</td><td>粘膜斑・扁平コンジローマ</td></tr></table>'
         '<span class="kw3">逆に粘膜疹を伴わない代表</span>は'
         '<span class="kw3">尋常性乾癬・落葉状天疱瘡・SSSS・水疱性類天疱瘡（軽度）・'
         'うっ滞性皮膚炎・硬結性紅斑・結節性紅斑・光線角化症・Gibertばら色粃糠疹</span>である。'),
  deep=('📌 選択肢の疾患を1つずつ押さえる',
        '<span class="kw3">本問は「粘膜疹の有無」だけで解けるが、'
        '誤答肢の疾患もそれぞれ独立に出題される重要疾患</span>である。'
        '<table class="tb"><tr><th>疾患</th><th>要点</th></tr>'
        '<tr><td><span class="kw3">うっ滞性皮膚炎</span></td>'
        '<td><span class="kw3">下腿下1/3の色素沈着（ヘモジデリン）・湿疹・浮腫・静脈瘤・'
        '脂肪皮膚硬化症。進行すると静脈性下腿潰瘍</span>。'
        '<span class="kw3">治療は圧迫療法（ABIを測って動脈性を除外してから）</span>。'
        '<span class="kw3">自家感作性皮膚炎の原発巣になりやすい</span></td></tr>'
        '<tr><td><span class="kw3">硬結性紅斑〈Bazin〉</span></td>'
        '<td><span class="kw3">中年女性・下腿後面・慢性・潰瘍化。'
        '小葉性脂肪織炎＋血管炎＋乾酪壊死。結核アレルギー。'
        'ツ反／IGRA陽性、抗結核薬が著効</span>（<span class="kw">Q.65</span>）</td></tr>'
        '<tr><td><span class="kw3">光線角化症（日光角化症）</span></td>'
        '<td><span class="kw3">高齢者の露光部の前癌病変（表皮内癌）。'
        '放置すると有棘細胞癌へ進展。'
        '治療は凍結療法・イミキモド外用・5-FU外用・切除</span>。'
        '<span class="kw3">多発例は「フィールドがん化」として面で治療する</span></td></tr>'
        '<tr><td><span class="kw3">Gibert薔薇色粃糠疹</span></td>'
        '<td><span class="kw3">herald patch→皮膚割線に沿う配列→自然治癒。'
        'HHV-6／7。第2期梅毒疹との鑑別</span>（<span class="kw">Q.88</span>）</td></tr></table>'
        '<span class="kw4">本問（97G-76）は古い国試のため解答一覧表に正答率が載っていない</span>。'
        '<span class="kw3">しかし「粘膜疹の有無で疾患を仕分ける」という発想は'
        'Q.83・Q.85・Q.92・Q.95 と繰り返し問われており、現在も頻出のテーマ</span>である。'),
  point=('🎯 国試ポイント',
         '① <span class="kw3">粘膜疹がみられる＝扁平苔癬</span>'
         '（頬粘膜のレース状白色線条）。<br>'
         '② 粘膜疹を伴う疾患＝<span class="kw3">扁平苔癬・尋常性天疱瘡・粘膜類天疱瘡・'
         'SJS/TEN・多形滲出性紅斑（major）・Behçet病・膿疱性乾癬</span>。<br>'
         '③ 伴わない＝<span class="kw4">尋常性乾癬・うっ滞性皮膚炎・硬結性紅斑・'
         '光線角化症・Gibertばら色粃糠疹</span>。<br>'
         '④ <span class="kw3">うっ滞性皮膚炎＝下腿下1/3・色素沈着・圧迫療法（ABI測定を先に）</span>。<br>'
         '⑤ <span class="kw3">光線角化症＝露光部の前癌病変</span>→有棘細胞癌へ。<br>'
         '⑥ <span class="kw3">粘膜類天疱瘡は眼結膜の瘢痕で失明しうる</span>。<br>'
         '⑦ 「粘膜疹の有無」は疾患を仕分ける最重要の軸の一つ（<span class="kw">Q.83</span>）。')),

Q('92B-10', None, [],
  '<strong>扁平苔癬について<span class="kw4">誤っている</span>のはどれか。</strong>',
  [('a', '皮疹は紫紅色である。', False, '<span class="kw">正しい</span>。'
                     '<span class="kw">扁平苔癬の皮疹は特徴的な紫紅色〜暗赤紫色</span>で、'
                     '<span class="kw">6つのPの1つ（Purple）</span>である'
                     '（<span class="kw">Q.85</span>）。'),
   ('b', '扁平な丘疹である。', False, '<span class="kw">正しい</span>。'
                     '<span class="kw">頂面が平ら（flat-topped）で多角形の扁平な丘疹</span>であり、'
                     '<span class="kw">表面に光沢とWickham線条を伴う</span>。'
                     '疾患名の「扁平」がこれを指している。'),
   ('c', '痒みがある。', False, '<span class="kw">正しい</span>。'
                     '<span class="kw">強い瘙痒を伴う（Pruritic）</span>のが扁平苔癬の特徴で、'
                     '<span class="kw">Q.85の症例も「激しい瘙痒を伴う皮疹」と記載</span>されている。'),
   ('d', '口腔粘膜にも生じる。', False, '<span class="kw">正しい</span>。'
                     '<span class="kw">皮膚病変の約半数に口腔粘膜病変（両側頬粘膜のレース状白色線条）を伴う</span>'
                     '（<span class="kw">Q.92・Q.95・Q.97</span>）。'
                     '粘膜病変のみで発症することもある。'),
   ('e', '2〜3週で自然消退する。', True, '<span class="kw3">これが誤り</span>。'
                     '<span class="kw3">扁平苔癬は慢性の経過をとり、数か月〜数年持続する</span>。'
                     '<span class="kw3">皮膚病変は平均1〜2年で軽快することが多いが、'
                     '口腔病変はさらに長く（10年以上）持続し、消退後に色素沈着を残す</span>。'
                     '<span class="kw3">2〜3週で自然消退するのはGibert薔薇色粃糠疹（4〜8週）や'
                     '多形滲出性紅斑（2〜4週）</span>のような一過性疾患である。')],
  '扁平苔癬は紫紅色・扁平・多角形の丘疹で強い瘙痒を伴い、口腔粘膜も侵す。ただし経過は慢性（数か月〜数年）であり、2〜3週で自然消退はしない。',
  patho=('⏳ 「経過の長さ」で皮膚疾患を仕分ける',
         '<span class="kw3">本問は扁平苔癬の知識を問いつつ、'
         '実質的には「この病気はどのくらいで治るか」を問うている</span>。'
         '<span class="kw3">経過（急性か慢性か、自然治癒するか）は、'
         '皮疹の形や色と並ぶ重要な診断軸</span>である。'
         '<table class="tb"><tr><th>経過</th><th>疾患</th><th>目安</th></tr>'
         '<tr><td><span class="kw3">数分〜数時間</span></td>'
         '<td><span class="kw3">蕁麻疹（個疹）・血管性浮腫</span></td>'
         '<td><span class="kw3">個々の膨疹は24時間以内に跡形なく消える</span></td></tr>'
         '<tr><td><span class="kw3">数日〜2週</span></td>'
         '<td><span class="kw3">固定薬疹・多形滲出性紅斑・SJS/TEN（急性期）・'
         'ヘルペス性歯肉口内炎・AGEP</span></td>'
         '<td><span class="kw3">誘因を除けば軽快へ向かう</span></td></tr>'
         '<tr><td><span class="kw3">数週〜2か月</span></td>'
         '<td><span class="kw3">結節性紅斑・Gibertばら色粃糠疹・滴状乾癬</span></td>'
         '<td><span class="kw3">自然治癒するのが原則</span></td></tr>'
         '<tr><td><span class="kw3">数か月〜数年（慢性）</span></td>'
         '<td><span class="kw3">扁平苔癬・尋常性乾癬・硬結性紅斑・'
         'アトピー性皮膚炎・尋常性天疱瘡・菌状息肉症</span></td>'
         '<td><span class="kw3">治療でコントロールする疾患</span></td></tr></table>'
         '<span class="kw3">この軸を使うと本章の問題が一気に解ける</span>。'
         '<span class="kw3">Q.65（硬結性紅斑）は「3か月前から出現し治癒していない」慢性経過で'
         '結節性紅斑を否定し、'
         'Q.95（扁平苔癬）は「3年前から」でヘルペス性歯肉口内炎を否定した</span>。'
         '<span class="kw3">問題文の「〇年前から」「〇日前から」は必ず診断に使われる情報</span>である。<br>'
         '<span class="kw3">扁平苔癬の具体的な経過</span>: '
         '<span class="kw3">①皮膚病変は数か月〜2年程度で自然に軽快することが多いが、'
         'その後に長く色素沈着を残す</span>。'
         '<span class="kw3">②口腔病変は難治で、10年以上持続することも珍しくない</span>。'
         '<span class="kw3">③肥厚性扁平苔癬（下腿の疣状に厚い局面）はとくに難治</span>。'
         '<span class="kw3">④毛孔性扁平苔癬（頭皮）は瘢痕性脱毛を残し、毛は再生しない</span>。'
         '<span class="kw3">⑤爪の翼状片も不可逆</span>。'
         '<span class="kw4">つまり「放っておけば治る病気」ではなく、'
         '不可逆的な後遺症を防ぐために治療する疾患</span>である。'),
  deep=('📌 扁平苔癬——最後に総復習',
        '<span class="kw3">本章の扁平苔癬6問（Q.85・92・94・95・97・98）を横断して'
        '問われた事項をまとめる</span>。'
        '<table class="tb"><tr><th>問われ方</th><th>該当問題</th><th>答え</th></tr>'
        '<tr><td>さらに確認すべき部位</td><td><span class="kw">Q.85</span></td>'
        '<td><span class="kw3">口腔粘膜</span></td></tr>'
        '<tr><td>症例からの診断（口腔＋四肢）</td>'
        '<td><span class="kw">Q.92・Q.95</span></td>'
        '<td><span class="kw3">扁平苔癬</span></td></tr>'
        '<tr><td>Köbner現象を示す疾患</td><td><span class="kw">Q.94</span></td>'
        '<td><span class="kw3">扁平苔癬（＋尋常性乾癬）</span></td></tr>'
        '<tr><td>粘膜疹がみられる疾患</td><td><span class="kw">Q.97</span></td>'
        '<td><span class="kw3">扁平苔癬</span></td></tr>'
        '<tr><td>誤っている記述</td><td><span class="kw">Q.98</span></td>'
        '<td><span class="kw3">「2〜3週で自然消退」（慢性が正しい）</span></td></tr></table>'
        '<span class="kw3">扁平苔癬のチェックリスト</span>: '
        '<span class="kw3">①6つのP（紫紅色・多角形・扁平・瘙痒・丘疹・局面）＋光沢＋Wickham線条</span>、'
        '<span class="kw3">②好発は四肢屈側（手関節屈側）・下腿・腰部</span>、'
        '<span class="kw3">③Köbner現象陽性</span>、'
        '<span class="kw3">④口腔粘膜（約半数）・外陰・爪（翼状片）・頭皮（瘢痕性脱毛）</span>、'
        '<span class="kw3">⑤病理は界面皮膚炎（基底細胞の液状変性＋帯状リンパ球浸潤）＋顆粒層の楔状肥厚</span>、'
        '<span class="kw3">⑥背景にC型肝炎・薬剤・歯科金属・GVHD</span>、'
        '<span class="kw3">⑦経過は慢性、びらん型口腔病変は有棘細胞癌のリスク</span>、'
        '<span class="kw3">⑧治療はステロイド外用が主軸</span>。<br>'
        '<span class="kw3">本章「角化症」の総括</span>: '
        '<span class="kw3">尋常性乾癬（Q.83・86・89・90・91・93・94・96）と'
        '扁平苔癬（Q.85・92・94・95・97・98）が二本柱</span>で、'
        '<span class="kw3">これに膿疱性乾癬（Q.84）・乾癬性関節炎（Q.87）・'
        'Darier病（Q.82）・Gibertばら色粃糠疹（Q.88）が加わる</span>。'
        '<span class="kw3">「伸側の銀白色鱗屑・粘膜なし・Auspitz／Köbner」が乾癬、'
        '「屈側の紫紅色光沢・粘膜あり・Wickham線条・Köbner」が扁平苔癬</span>——'
        'この対比を軸に整理すれば本章は攻略できる。'),
  point=('🎯 国試ポイント',
         '① 扁平苔癬の経過は<span class="kw3">慢性（数か月〜数年）</span>——'
         '<span class="kw4">2〜3週で自然消退はしない</span>。<br>'
         '② 2〜4週で自然消退するのは<span class="kw3">多形滲出性紅斑</span>、'
         '4〜8週なら<span class="kw3">Gibertばら色粃糠疹</span>。<br>'
         '③ 扁平苔癬＝<span class="kw3">紫紅色・多角形・扁平・光沢・強い瘙痒・Wickham線条</span>。<br>'
         '④ <span class="kw3">口腔粘膜病変が約半数</span>、外陰・爪・頭皮も侵す。<br>'
         '⑤ <span class="kw3">頭皮の毛孔性扁平苔癬は瘢痕性脱毛（不可逆）、爪は翼状片</span>。<br>'
         '⑥ <span class="kw3">問題文の「〇年前から／〇日前から」は必ず診断に使う</span>。<br>'
         '⑦ 本章の二本柱＝<span class="kw3">尋常性乾癬（伸側・鱗屑・粘膜なし）</span>と'
         '<span class="kw3">扁平苔癬（屈側・紫紅色・粘膜あり）</span>。')),

]


# ============================================================
# レンダリング
# ============================================================

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 2),
    ('s3', 'B問題', '', 7),
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


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        'MEC皮膚科 第4章 角化症 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#B45309')
                .replace('--orl:#FCE4EC', '--orl:#FEF3C7')
                .replace('--ord:#880E4F', '--ord:#78350F'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 皮膚科</div>'
        '<h1>第<span>4</span>章｜角化症</h1>'
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
