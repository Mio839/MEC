# -*- coding: utf-8 -*-
"""
放射線科 第3章「放射線治療学」(NO.35-44) の章別HTML(放射線科/ch03_hoshasen_chiryogaku.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_rad_ch01.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・放射線科 放Q-26〜29／PDF p.29-32)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.39-40)を x 座標で列に切って読んだもの。
解説はPDFの問題編に無いため、同講座のレジュメ編（放-28〜放-31）と国試標準知識に基づき執筆
（医学的正確性は要ユーザー確認）。

全10問（画像0枚・連問なし・採点除外なし・全問に正答率あり）。
PDFのセクションは ★問題=NO.35-38 / 無印問題=NO.39-44（SECTIONS の idx は 0/4）。

■ 章の内訳
  感受性（正常組織）  3問（35 最も低い＝神経／41 最も高い＝小腸／40 比較の正誤）
  感受性（腫瘍）      2問（36 高いもの2つ／42 高い腫瘍＝Ewing肉腫）
  照射方法・総論      3問（37 3つ選べ／43 誤っているもの／44 通常分割照射）
  密封小線源          1問（38 前立腺癌）
  緩和照射            1問（39 疼痛の緩和）

■ 章を貫く3本の筋
  ① **感受性はBergonié-Tribondeauの法則ただ1本で決まる**——
     **①分裂が盛んなほど ②未分化なほど ③将来の分裂回数が多いほど 高感受性**。
     ここから正常組織の3段階（**恒常的細胞再生系＞緊急的細胞再生系＞非細胞再生系**）も、
     腫瘍の序列（**造血系・胚細胞系・未分化癌＞扁平上皮癌＞腺癌＞＞肉腫**）も導ける。
     **NO.35・40・41・42 の4問がこの一点だけで解ける**。
  ② **感受性を上げる／下げる外的因子は「酸素」が最重要**——
     **酸素が多いほど効く（酸素効果）**。**「低酸素の癌は感受性が高い」は必ず誤り**（NO.37c・NO.40e）。
     ほかに細胞周期（**M期＞S期**）・化学療法併用・温度が挙がる。
  ③ **照射のかたちは「外部照射か内部照射か」でまず割る**——
     外部照射は**リニアック（エックス線・電子線）／サイクロトロン（陽子線）**で、
     **通常分割照射＝1回1.8〜2Gy・週5回・総量60Gy前後・6〜7週**が基準（NO.44）。
     内部照射は**密封小線源（組織内＝前立腺癌・口腔癌／腔内＝子宮頸癌・食道癌）**と
     **内用療法（<sup>131</sup>I＝甲状腺、<sup>223</sup>Ra＝前立腺癌骨転移）**に分かれる（NO.37d・NO.38）。

⚠️ 本章の最難は **NO.44（109G-27・正答率31%）**＝通常分割照射は「週に5日照射する」。
   「通常」という言葉から具体的な数字（1回2Gy・週5回・6〜7週）が引き出せるかを問う問題で、
   **c「全治療期間は12週」に票が流れる**。
   次いで **NO.43（110E-11・58%）**＝**二次発がんのリスクは高齢者より小児で高い**（記述が逆）、
   **NO.42（104G-24・59%）**＝**Ewing肉腫は名前は肉腫だが胚細胞系由来なので高感受性**という例外。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '放射線科' / 'ch03_hoshasen_chiryogaku.html'

Q_START = 35

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
# 章を通して何度も参照する表
# ------------------------------------------------------------------

# ① 正常組織の放射線感受性（レジュメ 放-28）
TBL_NORMAL = (
    '<table class="tb">'
    '<tr><th>段階</th><th>分類</th><th>代表的な組織</th><th>感受性</th></tr>'
    '<tr><td>Ａ</td><td><span class="kw3">恒常的細胞再生系</span><br>'
    '（常に分裂して入れ替わっている）</td>'
    '<td><span class="kw3">骨髄（造血細胞）・腸上皮・皮膚（表皮基底層）・'
    '精巣の精上皮・リンパ組織・水晶体上皮・胎児</span></td>'
    '<td><span class="kw3">高い</span></td></tr>'
    '<tr><td>Ｂ</td><td><span class="kw">緊急的細胞再生系</span><br>'
    '（普段は休んでいるが必要なら分裂する）</td>'
    '<td><span class="kw">肝・腎・唾液腺・甲状腺などの腺組織</span><br>'
    '（<span class="kw">血管・結合組織はＢとＣの間</span>）</td>'
    '<td>中くらい</td></tr>'
    '<tr><td>Ｃ</td><td><span class="kw4">非細胞再生系</span><br>'
    '（もう分裂しない）</td>'
    '<td><span class="kw4">神経（脳・脊髄）・筋肉・骨・軟骨</span></td>'
    '<td><span class="kw4">低い</span></td></tr>'
    '<tr><td colspan="4"><span class="kw3">Bergonié-Tribondeauの法則</span>——'
    '<span class="kw3">①細胞分裂が盛んなほど ②未分化なほど '
    '③将来の分裂回数が多いほど、放射線感受性が高い</span>。'
    '上の3段階はこの法則の言い換えにすぎず、'
    '<span class="kw3">「その組織はいま分裂しているか」を問うだけで並べ替えられる</span>。</td></tr>'
    '</table>')

# ② 腫瘍の放射線感受性（レジュメ 放-28）
TBL_TUMOR = (
    '<table class="tb">'
    '<tr><th>感受性</th><th>腫瘍</th><th>治療上の意味</th></tr>'
    '<tr><td><span class="kw3">高い</span></td>'
    '<td><span class="kw3">造血系腫瘍（悪性リンパ腫・白血病）・胚細胞腫瘍（セミノーマ）・'
    '芽細胞腫瘍（腎芽腫・神経芽腫）・未分化癌</span></td>'
    '<td>少ない線量で消える。<span class="kw3">全身療法が主体でも局所制御に併用される</span></td></tr>'
    '<tr><td>やや高い</td><td><span class="kw">扁平上皮癌</span>'
    '（上咽頭・中咽頭・喉頭・下咽頭・子宮頸部・食道・肺）</td>'
    '<td><span class="kw">根治的放射線治療の主戦場</span>——'
    '<span class="kw">とくに上咽頭癌はどの病期でも放射線治療</span>'
    '（未分化癌が多く、解剖学的に手術が困難）</td></tr>'
    '<tr><td>低い</td><td><span class="kw4">腺癌</span>（膵癌・大腸癌・腎細胞癌など）</td>'
    '<td>単独での根治は難しい</td></tr>'
    '<tr><td><span class="kw4">きわめて低い</span></td>'
    '<td><span class="kw4">肉腫・悪性黒色腫・膠芽腫・腎細胞癌</span></td>'
    '<td><span class="kw4">放射線抵抗性の代表</span>。手術・薬物が主</td></tr>'
    '<tr><td colspan="3"><span class="kw3">⚠️ 例外は <u>Ewing肉腫</u></span>——'
    '<span class="kw3">名前は「肉腫」だが胚細胞系（未分化な小円形細胞）由来なので'
    '放射線感受性が高い</span>。'
    '国試ではこの例外そのものが答えになる（NO.42）。</td></tr></table>')

# ③ 感受性を左右する外的因子（レジュメ 放-28）
TBL_FACTOR = (
    '<table class="tb"><tr><th>因子</th><th>向き</th><th>ひとこと</th></tr>'
    '<tr><td><span class="kw3">酸　素</span></td>'
    '<td><span class="kw3">多いほど効く</span></td>'
    '<td><span class="kw3">酸素効果</span>。放射線が水を電離して生じたラジカルが'
    '酸素と結合してDNA損傷を「固定」する。'
    '<span class="kw4">腫瘍の中心部は低酸素で効きにくい＝放射線抵抗性の主因</span></td></tr>'
    '<tr><td><span class="kw">細胞周期</span></td>'
    '<td><span class="kw">短いほど効く</span></td>'
    '<td><span class="kw">M期（有糸分裂期）とその直前が最も高感受性</span>、'
    '<span class="kw4">S期（とくに後期）は抵抗性</span>。'
    '体細胞は普段G0期にいるので効きにくい</td></tr>'
    '<tr><td><span class="kw">化学療法</span></td><td>併用すると効く</td>'
    '<td>化学放射線療法。<span class="kw">細胞周期の同調・修復阻害</span>による</td></tr>'
    '<tr><td><span class="kw">温　度</span></td><td>高いほど効く</td>'
    '<td>温熱療法（ハイパーサーミア）併用の根拠</td></tr></table>')

# ④ 照射方法の全体像（レジュメ 放-29〜31）
TBL_IRRAD = (
    '<table class="tb"><tr><th>大分類</th><th>方法</th><th>使う線種</th>'
    '<th>代表的な適応</th></tr>'
    '<tr><td rowspan="2"><span class="kw3">外部照射</span></td>'
    '<td><span class="kw">リニアック（直線加速器）</span></td>'
    '<td><span class="kw">エックス線・電子線</span></td>'
    '<td>ほとんどの根治照射・緩和照射。'
    '<span class="kw">3次元原体照射／IMRT／IGRT</span></td></tr>'
    '<tr><td><span class="kw">サイクロトロン（円形加速器）</span></td>'
    '<td><span class="kw">陽子線</span></td>'
    '<td><span class="kw3">ブラッグピークを形成し病巣で止まる</span>'
    '＝深部の正常組織を守れる</td></tr>'
    '<tr><td rowspan="2"><span class="kw3">内部照射</span></td>'
    '<td><span class="kw">密封小線源治療</span><br>'
    '（<span class="kw">組織内照射／腔内照射</span>）</td>'
    '<td><span class="kw">γ線</span></td>'
    '<td><span class="kw3">組織内＝前立腺癌・口腔癌（シード線源を刺す）</span><br>'
    '<span class="kw3">腔内＝子宮頸癌・食道癌（管を体腔に入れる）</span></td></tr>'
    '<tr><td><span class="kw">内用療法</span><br>（非密封放射性同位元素）</td>'
    '<td><span class="kw">α線・β線・γ線</span></td>'
    '<td><span class="kw3"><sup>131</sup>I＝甲状腺機能亢進症・甲状腺癌</span>／'
    '<span class="kw3"><sup>223</sup>Ra＝去勢抵抗性前立腺癌の骨転移</span>／'
    '<sup>177</sup>Lu＝神経内分泌腫瘍</td></tr></table>')


QUESTIONS = [

    # ============================ ★問題 ============================

    # ── NO.35 (116F-3) ★ 83% ans=c ─────────────────────────────
    Q('116F-3', 83, [('bs', '★')],
      '<strong>最も放射線感受性が低いのはどれか。</strong>',
      [('a', '甲状腺', False,
        '<span class="kw4">甲状腺は腺組織＝緊急的細胞再生系（Ｂ群）</span>で、'
        '感受性は中くらい。'
        '<span class="kw">普段は静かだが必要になれば分裂できる細胞</span>なので、'
        '神経よりは確実に感受性が高い。'
        '実際、<span class="kw">頸部への照射後には晩期障害として甲状腺機能低下症が起こる</span>し、'
        '<span class="kw">小児期の被曝で甲状腺癌のリスクが上がる</span>ことも知られている。'),
       ('b', '骨　髄', False,
        '<span class="kw4">骨髄（造血細胞）は恒常的細胞再生系（Ａ群）の代表で、'
        '正常組織のなかで最も感受性が高い部類</span>。'
        '<span class="kw">常に分裂し続けている未分化な細胞の集まり</span>だから'
        'Bergonié-Tribondeauの法則にそのまま当てはまる。'
        '<span class="kw">全身被曝で最も早く現れる異常が末梢血のリンパ球減少</span>なのも、'
        'この感受性の高さゆえである。'),
       ('c', '神　経', True,
        '<span class="kw3">◯ 神経（脳・脊髄）は非細胞再生系（Ｃ群）＝'
        'もう分裂しない終末分化細胞なので、正常組織で最も放射線感受性が低い</span>。'
        '<span class="kw3">Bergonié-Tribondeauの法則（分裂が盛んなほど・未分化なほど・'
        '将来の分裂回数が多いほど高感受性）の対極</span>にある。<br>'
        '<span class="kw4">ただし「感受性が低い＝障害されない」ではない</span>。'
        '<span class="kw4">神経は壊れても再生しないので、'
        'いったん耐容線量を超えると回復しない不可逆的な晩期障害（放射線脊髄症）</span>になる。'
        '<span class="kw3">脊髄の耐容線量（およそ45〜50Gy）が治療計画の絶対的な制約になる</span>のは、'
        '感受性が低いからではなく<span class="kw3">取り返しがつかないから</span>である。'),
       ('d', '皮　膚', False,
        '<span class="kw4">皮膚（表皮基底層）は恒常的細胞再生系（Ａ群）</span>。'
        '<span class="kw">基底層の細胞が常に分裂して角層へ送り出している</span>ので感受性は高く、'
        '<span class="kw">放射線皮膚炎・脱毛は早期障害の代表</span>として現れる。'
        '<span class="kw">照射野の皮膚に一致して境界明瞭な紅斑が出る</span>のが特徴。'),
       ('e', '卵　巣', False,
        '<span class="kw4">生殖腺（卵巣・精巣）は放射線感受性が高い臓器の代表</span>。'
        '実際、<span class="kw">実効線量を計算するときの組織加重係数は生殖腺が最大（0.20）</span>で、'
        '<span class="kw">全身の中でとくに守るべき臓器</span>と位置づけられている。'
        '<span class="kw">数Gyで永久不妊をきたし、しかも次世代への遺伝的影響が問題になりうる</span>。')],
      '正常組織の感受性は「いま分裂しているか」で決まる。神経＝非細胞再生系が最低。',
      patho=('🔎 正常組織の感受性——3段階はBergonié-Tribondeauの法則の言い換え',
             '<span class="kw3">放射線が細胞を殺すのは、DNAを切って'
             '「次に分裂しようとしたときに死なせる（分裂death）」から</span>である。'
             'したがって<span class="kw3">分裂しない細胞ほど生き延びる</span>——'
             'これが感受性の序列のすべてである。' + TBL_NORMAL),
      deep=('💡 「感受性が低い」と「障害が軽い」は別物',
            '<span class="kw3">感受性が低い組織ほど安全、と読むのは誤り</span>。'
            '感受性は<span class="kw3">「どのくらいの線量で反応が出るか」</span>の話であって、'
            '<span class="kw3">「壊れたあとに戻れるか」は別問題</span>である。'
            '<table class="tb"><tr><th></th><th>高感受性の組織</th>'
            '<th>低感受性の組織</th></tr>'
            '<tr><td>例</td><td><span class="kw">骨髄・腸上皮・皮膚・生殖腺</span></td>'
            '<td><span class="kw">神経・筋・骨</span></td></tr>'
            '<tr><td>障害が出る時期</td>'
            '<td><span class="kw3">早期（数日〜数週）</span>'
            '——分裂できずに補充が止まるので、細胞の寿命が尽きた時点で症状が出る</td>'
            '<td><span class="kw4">晩期（数か月〜数年）</span>'
            '——血管・結合組織の変化を介してゆっくり進む</td></tr>'
            '<tr><td>回復</td>'
            '<td><span class="kw3">残った幹細胞から再生して回復しうる</span></td>'
            '<td><span class="kw4">再生しないので不可逆</span>'
            '（放射線脊髄症・肺線維症）</td></tr>'
            '<tr><td>治療計画上の扱い</td><td>急性期の副作用として管理する</td>'
            '<td><span class="kw4">耐容線量を絶対に超えない</span>——'
            '<span class="kw3">脊髄はおよそ45〜50Gyが上限</span></td></tr></table>'
            '<span class="kw3">早期障害＝分裂の速い組織／晩期障害＝分裂の遅い組織</span>'
            'という対応は、第4章（医療安全）でそのまま使う。'),
      point=('🎯 国試ポイント',
             '① <span class="kw">Bergonié-Tribondeauの法則＝分裂が盛ん・未分化・'
             '将来の分裂回数が多い ほど高感受性</span>。<br>'
             '② <span class="kw3">正常組織：恒常的細胞再生系（骨髄・腸上皮・皮膚・精上皮）＞'
             '緊急的細胞再生系（肝・腎・唾液腺・甲状腺）＞非細胞再生系（神経・筋）</span>。<br>'
             '③ <span class="kw">生殖腺・胎児・水晶体・リンパ組織も高感受性</span>。<br>'
             '④ <span class="kw4">感受性が低い神経は、障害されると不可逆</span>'
             '（<span class="kw">脊髄の耐容線量45〜50Gy</span>）。<br>'
             '⑤ <span class="kw">早期障害＝分裂の速い組織／晩期障害＝分裂の遅い組織</span>。')),

    # ── NO.36 (107G-37) ★CBT 84% ans=d,e ────────────────────────
    Q('107G-37', 84, [('bs', '★'), ('bc', 'CBT')],
      '<strong>放射線治療の感受性が高いのはどれか。2つ選べ。</strong>',
      [('a', '耳下腺腺癌', False,
        '<span class="kw4">腺癌は放射線感受性が低い群</span>。'
        'しかも<span class="kw4">耳下腺は正常組織としても唾液腺（緊急的細胞再生系）で、'
        '照射すると口腔乾燥という厄介な晩期障害を残す</span>。'
        '<span class="kw">唾液腺癌の治療は手術が第一選択</span>で、'
        '放射線は術後の補助や切除不能例に限られる。'
        '（なお<span class="kw">頭頸部癌のIMRTの目標のひとつが「耳下腺を照射野から外すこと」</span>である）'),
       ('b', '甲状腺乳頭癌', False,
        '<span class="kw4">甲状腺乳頭癌は分化型の腺癌で、外照射の感受性は低い</span>。'
        'そもそも<span class="kw">分化型甲状腺癌には「ヨウ素を取り込む」という'
        '別の特性を利用した<sup>131</sup>I内用療法</span>があり、'
        '<span class="kw">外部照射が主役になることはない</span>。'
        '<span class="kw4">「甲状腺＝放射線」で反射的に選ばないこと</span>——'
        '同じ甲状腺でも<span class="kw4">未分化癌は高感受性</span>という'
        '正反対の性質をもつ。'),
       ('c', '鼻腔悪性黒色腫', False,
        '<span class="kw4">悪性黒色腫は放射線抵抗性の代表格</span>'
        '（ほかに腎細胞癌・膠芽腫・肉腫）。'
        '<span class="kw">DNA修復能が高く、また細胞周期の分布が照射に不利</span>とされる。'
        '<span class="kw">治療の基本は広範切除</span>で、'
        '近年は<span class="kw">免疫チェックポイント阻害薬</span>が中心になっている。'),
       ('d', '上咽頭扁平上皮癌', True,
        '<span class="kw3">◯ 上咽頭癌は放射線治療の最良の適応</span>。理由が2つ重なる。'
        '<span class="kw3">①組織型が扁平上皮癌（とくに上咽頭では未分化型が多く感受性が高い）</span>、'
        '<span class="kw3">②上咽頭は頭蓋底に接する狭く深い場所で、'
        '手術で切除すること自体が難しい</span>。'
        'このため<span class="kw3">上咽頭癌はどの病期でも放射線治療（＋化学療法）が標準</span>で、'
        '<span class="kw3">複雑な形の照射野を作れるIMRTの代表的適応</span>でもある。'),
       ('e', '中咽頭悪性リンパ腫', True,
        '<span class="kw3">◯ 悪性リンパ腫は造血系腫瘍＝放射線感受性が最も高い群</span>。'
        '<span class="kw3">未分化で分裂が速い細胞の塊</span>なので'
        'Bergonié-Tribondeauの法則にそのまま当てはまる。'
        '<span class="kw">現在の治療の主役は化学療法（＋抗CD20抗体）</span>だが、'
        '<span class="kw3">限局期では放射線を併用して局所制御を高める</span>し、'
        '<span class="kw">Waldeyer輪（扁桃・咽頭）は節外性リンパ腫の好発部位</span>である。')],
      '造血系腫瘍（リンパ腫）＝最高感受性、扁平上皮癌＝良好。腺癌・悪性黒色腫は抵抗性。',
      patho=('🔎 腫瘍の感受性——「未分化で分裂が速いほど効く」の一本道',
             '<span class="kw3">腫瘍側の感受性も正常組織とまったく同じ法則で並ぶ</span>。'
             '<span class="kw3">未分化で分裂が速い＝高感受性、'
             '分化して静かな腫瘍＝低感受性</span>。' + TBL_TUMOR),
      deep=('💡 「効くか」だけでなく「なぜ放射線を選ぶか」で決まる',
            '<span class="kw3">臨床で放射線治療が主役になるのは、'
            '感受性が高いときだけではない</span>。'
            '<span class="kw3">手術すると失うものが大きい部位</span>でも選ばれる。'
            '<table class="tb"><tr><th>選ばれる理由</th><th>代表例</th>'
            '<th>ねらい</th></tr>'
            '<tr><td><span class="kw3">感受性が高い</span></td>'
            '<td><span class="kw3">悪性リンパ腫・セミノーマ・小児腫瘍</span></td>'
            '<td>少ない線量で制御できる</td></tr>'
            '<tr><td><span class="kw3">解剖学的に手術が困難</span></td>'
            '<td><span class="kw3">上咽頭癌</span>（頭蓋底に接する）</td>'
            '<td><span class="kw3">全病期で放射線＋化学療法</span></td></tr>'
            '<tr><td><span class="kw3">機能温存がQOLに直結</span></td>'
            '<td><span class="kw3">早期の喉頭癌・下咽頭癌</span>（発声・嚥下）、'
            '<span class="kw">前立腺癌</span>、<span class="kw">乳房温存術後</span></td>'
            '<td><span class="kw3">臓器を残したまま根治を狙う</span></td></tr>'
            '<tr><td><span class="kw4">向かない</span></td>'
            '<td><span class="kw4">可動性の大きい臓器（大腸・卵巣）</span>、'
            '<span class="kw4">抵抗性腫瘍（悪性黒色腫・腎細胞癌・膠芽腫・肉腫）</span></td>'
            '<td><span class="kw4">狙った場所に当たらない／効かない</span></td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">腫瘍の感受性：造血系・胚細胞系・芽細胞系・未分化癌＞'
             '扁平上皮癌＞腺癌＞＞肉腫・悪性黒色腫</span>。<br>'
             '② <span class="kw3">上咽頭癌はどの病期でも放射線治療</span>'
             '（未分化癌が多く、手術が困難）。<br>'
             '③ <span class="kw">早期の喉頭・下咽頭癌は機能温存のため放射線で根治を目指す</span>。<br>'
             '④ <span class="kw4">悪性黒色腫・腎細胞癌・膠芽腫・肉腫は放射線抵抗性</span>'
             '（<span class="kw3">例外＝Ewing肉腫</span>）。<br>'
             '⑤ <span class="kw4">可動性の大きい臓器（大腸・卵巣）は放射線治療に向かない</span>。')),

    # ── NO.37 (111D-19) ★ 68% ans=a,b,e ─────────────────────────
    Q('111D-19', 68, [('bs', '★')],
      '<strong>放射線治療について正しいのはどれか。3つ選べ。</strong>',
      [('a', '乳房温存術後には予防照射を行う。', True,
        '<span class="kw3">◯ 乳房部分切除（温存術）のあとは、残した乳房に'
        '全乳房照射を行うのが標準治療</span>。'
        '<span class="kw3">温存術は「乳房を残す代わりに、目に見えない遺残を放射線で叩く」'
        'という組み合わせで初めて乳房切除術と同等の局所制御が得られる</span>——'
        '<span class="kw3">「温存術＋放射線」で1セット</span>と覚える。'
        '照射しないと局所再発率が数倍に跳ね上がる。'),
       ('b', '陽子線はブラッグピークを形成する。', True,
        '<span class="kw3">◯ 荷電粒子線（陽子線・重粒子線）は、'
        '速度が落ちる終端付近で急激に大きなエネルギーを落とす</span>——'
        'これが<span class="kw3">ブラッグピーク</span>。'
        '<span class="kw3">ピークより深部にはほとんど線量が届かない</span>ので、'
        '<span class="kw3">病巣の手前と奥の正常組織を守れる</span>のが最大の利点である。'
        '<span class="kw4">対してエックス線は体表付近で最大となり、そのまま体を突き抜ける</span>ので、'
        '深部の標的に当てようとすると入射側と出口側の正常組織も被曝する。'),
       ('c', '低酸素状態の癌は放射線感受性が高い。', False,
        '<span class="kw4">逆。酸素が多いほど放射線は効く（酸素効果）</span>。'
        '<span class="kw4">放射線は水を電離してフリーラジカルを作り、'
        'そのラジカルが酸素と結合してDNA損傷を「固定」する</span>——'
        '<span class="kw4">酸素が無いと損傷が修復されてしまう</span>。'
        '<span class="kw4">大きな腫瘍の中心部は血流が乏しく低酸素なので放射線が効きにくい</span>のは、'
        'まさにこの機序による。'
        '<span class="kw4">この肢は放射線治療学で最も繰り返し出る「向きが逆」の誤答</span>である。'),
       ('d', 'Ⅰ-131 内用療法は前立腺癌に用いられる。', False,
        '<span class="kw4"><sup>131</sup>I（ヨウ素131）内用療法の適応は'
        '甲状腺機能亢進症〈Basedow病〉と分化型甲状腺癌</span>。'
        '<span class="kw4">ヨウ素を取り込むのは甲状腺濾胞細胞だけ</span>なので、'
        '<span class="kw4">前立腺癌には理屈のうえで使いようがない</span>。'
        '<span class="kw3">前立腺癌で使う内用療法は、'
        '骨転移のある去勢抵抗性前立腺癌に対する塩化ラジウム（<sup>223</sup>Ra）'
        '＝α線</span>である（カルシウムと同族なので骨に集まる）。'),
       ('e', '粒子線治療では主に陽子線が用いられる。', True,
        '<span class="kw3">◯ 粒子線治療には陽子線と重粒子線（炭素イオン線）があり、'
        '施設数・症例数ともに陽子線が主流</span>。'
        '<span class="kw3">陽子線は2018年から一部の疾患で保険適用</span>となり'
        '（小児腫瘍、切除非適応の骨軟部腫瘍、頭頸部悪性腫瘍、前立腺癌など）、'
        '<span class="kw">重粒子線に比べて装置が小型で導入しやすい</span>。'
        '<span class="kw">なお「粒子線」といえば荷電粒子（陽子・炭素イオン）を指し、'
        'ブラッグピークを形成する</span>のが共通の特徴である。')],
      '酸素は多いほど効く。131Iは甲状腺、前立腺癌骨転移は223Ra。',
      patho=('🔎 感受性を左右する外的因子——酸素が主役',
             '<span class="kw3">同じ腫瘍でも、置かれた条件で放射線の効き方は変わる</span>。'
             '国試で問われる因子は次の4つで、'
             '<span class="kw3">なかでも「酸素は多いほど効く」が圧倒的に頻出</span>である。' + TBL_FACTOR),
      deep=('💡 陽子線 vs エックス線——深さ方向の線量分布がすべて',
            '<span class="kw3">粒子線治療の利点は「よく効く」ことではなく'
            '「余計なところに当たらない」こと</span>である。'
            '<table class="tb"><tr><th></th><th><span class="kw3">陽子線・重粒子線</span></th>'
            '<th>エックス線（リニアック）</th></tr>'
            '<tr><td>深さ方向の線量</td>'
            '<td><span class="kw3">体表付近は低く、終端で急峻に最大'
            '（ブラッグピーク）→ その先はほぼゼロ</span></td>'
            '<td><span class="kw4">体表近くで最大となり、'
            '減衰しながら体を突き抜ける</span></td></tr>'
            '<tr><td>正常組織</td>'
            '<td><span class="kw3">病巣の奥は守れる</span></td>'
            '<td><span class="kw4">入射側も出口側も被曝する</span></td></tr>'
            '<tr><td>加速器</td>'
            '<td><span class="kw">サイクロトロン（円形加速器）</span></td>'
            '<td><span class="kw">リニアック（直線加速器）</span></td></tr>'
            '<tr><td>使いどころ</td>'
            '<td><span class="kw3">小児腫瘍・頭蓋底腫瘍・眼窩内腫瘍など'
            '「すぐ隣に絶対に当てたくない臓器がある」場合</span></td>'
            '<td>あらゆる根治照射・緩和照射の主力</td></tr></table>'
            '<span class="kw3">実際の陽子線治療では、'
            '腫瘍の厚みに合わせてピークを重ね合わせた'
            '「拡大ブラッグピーク」を作って標的全体を覆う</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">酸素効果——酸素が多いほど効く。'
             '「低酸素の癌は感受性が高い」は必ず誤り</span>。<br>'
             '② <span class="kw">細胞周期はM期が最も高感受性、S期後期が抵抗性</span>。<br>'
             '③ <span class="kw3">陽子線・重粒子線＝ブラッグピーク</span>、'
             '<span class="kw">加速器はサイクロトロン</span>。'
             '<span class="kw">エックス線・電子線はリニアック</span>。<br>'
             '④ <span class="kw3">乳房温存術後の全乳房照射は標準治療</span>'
             '（温存術＋放射線で1セット）。<br>'
             '⑤ <span class="kw3"><sup>131</sup>I＝甲状腺（Basedow病・分化型甲状腺癌）／'
             '<sup>223</sup>Ra＝去勢抵抗性前立腺癌の骨転移</span>。')),

    # ── NO.38 (106G-2) ★CBT 97% ans=c ───────────────────────────
    Q('106G-2', 97, [('bs', '★'), ('bc', 'CBT')],
      '<strong>密封小線源治療の適応があるのはどれか。</strong>',
      [('a', '腎　癌', False,
        '<span class="kw4">腎細胞癌は放射線抵抗性の代表</span>であり、'
        'そもそも放射線治療の適応が乏しい。'
        '<span class="kw">後腹膜の深部にあり、呼吸性移動もある</span>ので'
        '線源を留置する術式も現実的でない。'
        '<span class="kw">治療は手術（腎部分切除・根治的腎摘除術）が原則</span>で、'
        '転移例では分子標的薬・免疫チェックポイント阻害薬が用いられる。'),
       ('b', '膀胱癌', False,
        '<span class="kw4">膀胱は尿の貯留量で大きさも位置も変わる臓器</span>なので、'
        '線源を固定して当て続ける密封小線源治療には向かない。'
        '<span class="kw">筋層非浸潤癌はTURBT＋BCG膀胱内注入、'
        '筋層浸潤癌は膀胱全摘除術＋尿路変向</span>が基本で、'
        '放射線を使う場合も膀胱温存を目指した外部照射（＋化学療法）である。'),
       ('c', '前立腺癌', True,
        '<span class="kw3">◯ 前立腺癌は密封小線源治療（組織内照射）の代表的適応</span>。'
        '<span class="kw3">経直腸超音波でガイドしながら会陰から針を刺し、'
        '<sup>125</sup>I などのシード線源を前立腺内に永久留置する</span>。'
        '<span class="kw3">前立腺は骨盤の底に固定されていてほとんど動かず、'
        '直腸から超音波で正確に見える</span>——'
        'この2条件がそろうから線源を置ける。'
        '<span class="kw3">低〜中リスクの限局癌がよい適応</span>で、'
        '<span class="kw">全摘除術や外部照射（IMRT）と並ぶ根治的治療の選択肢</span>である。'),
       ('d', '陰茎癌', False,
        '<span class="kw4">陰茎癌は扁平上皮癌で放射線感受性はあるが、'
        '標準治療は病変の切除（部分／全陰茎切除）＋鼠径リンパ節郭清</span>。'
        '（<span class="kw">陰茎は皮膚由来なのでリンパ流は鼠径へ向かう</span>）。'
        '密封小線源治療が行われることはあるが、'
        '<span class="kw4">国試で「密封小線源といえば」と問われる臓器ではない</span>。'),
       ('e', 'セミノーマ', False,
        '<span class="kw4">セミノーマ（精上皮腫）は胚細胞腫瘍＝放射線高感受性</span>だが、'
        '<span class="kw4">診断も治療もまず高位精巣摘除術</span>であり、'
        '照射するとしても<span class="kw">後腹膜（傍大動脈）リンパ節領域への外部照射</span>である。'
        '<span class="kw4">精巣に線源を刺すという発想自体がない</span>——'
        '<span class="kw4">陰囊を経由すると鼠径リンパ流への播種経路を作ってしまう</span>ので、'
        '精巣腫瘍では針生検すら行わない。')],
      '組織内照射＝前立腺癌・口腔癌。腔内照射＝子宮頸癌・食道癌。',
      patho=('🔎 内部照射の2本立て——「刺す」密封小線源と「飲む・打つ」内用療法',
             '<span class="kw3">放射線治療はまず「外部照射か内部照射か」で割る</span>。'
             '<span class="kw3">内部照射はさらに、線源をカプセルに封じたまま体内に置く'
             '「密封小線源治療」と、放射性医薬品を投与して体内に取り込ませる'
             '「内用療法（非密封）」に分かれる</span>。' + TBL_IRRAD +
             '<span class="kw3">密封小線源治療の利点は、'
             '線源のすぐ近くだけが極端に高線量になり、'
             '距離の2乗に反比例して周囲は急速に低線量になること</span>——'
             '<span class="kw3">第1章で学んだ「距離の2乗に反比例」がそのまま治療原理になっている</span>。'),
      deep=('💡 組織内照射と腔内照射——「刺せる臓器」と「管を入れられる腔」',
            '<span class="kw3">密封小線源治療が成立する条件は、'
            '①線源を置ける場所があること ②その臓器が動かないこと</span>の2つ。'
            '<table class="tb"><tr><th></th><th><span class="kw3">組織内照射</span></th>'
            '<th><span class="kw3">腔内照射</span></th></tr>'
            '<tr><td>やり方</td>'
            '<td><span class="kw3">組織そのものにシード線源・針を刺す</span></td>'
            '<td><span class="kw3">体腔に線源を通す管（アプリケータ）を入れる</span></td></tr>'
            '<tr><td>代表的な適応</td>'
            '<td><span class="kw3">前立腺癌</span>（経直腸超音波ガイド下に会陰から）、'
            '<span class="kw3">口腔癌</span>（舌癌など）、乳癌</td>'
            '<td><span class="kw3">子宮頸癌</span>（腟・子宮腔から）、'
            '<span class="kw3">食道癌</span>、胆管癌</td></tr>'
            '<tr><td>成立する理由</td>'
            '<td><span class="kw3">位置が固定していて画像で正確に見える</span></td>'
            '<td><span class="kw3">腫瘍のすぐ横まで届く「腔」がある</span></td></tr>'
            '<tr><td><span class="kw4">向かないもの</span></td>'
            '<td colspan="2"><span class="kw4">腎・膀胱・大腸・卵巣など'
            '「深い」「動く」「腔が使えない」臓器</span></td></tr></table>'
            '<span class="kw3">⚠️ 前立腺は実質臓器なので「腔内照射」はできない</span>——'
            '<span class="kw3">前立腺癌の根治的放射線治療は'
            '「組織内照射（密封小線源）」か「IMRT（外部照射）」の2つ</span>である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">組織内照射＝前立腺癌・口腔癌</span>（線源を刺す）。<br>'
             '② <span class="kw3">腔内照射＝子宮頸癌・食道癌</span>（体腔に管を入れる）。<br>'
             '③ <span class="kw">前立腺癌の根治的放射線治療は'
             '「密封小線源（組織内照射）」と「IMRT」の2本</span>——'
             '<span class="kw4">実質臓器なので腔内照射は不可</span>。<br>'
             '④ <span class="kw">密封小線源が効くのは「距離の2乗に反比例」するから</span>——'
             '線源の近傍だけ高線量になる。<br>'
             '⑤ <span class="kw4">動く臓器（膀胱・大腸・卵巣）、深い臓器（腎）は不適</span>。')),

    # ============================ 無印問題 ============================

    # ── NO.39 (114F-9) 97% ans=a ────────────────────────────────
    Q('114F-9', 97, [],
      '<strong>四肢の転移性骨腫瘍に対する放射線治療で最も期待される効果はどれか。</strong>',
      [('a', '疼痛の緩和', True,
        '<span class="kw3">◯ 転移性骨腫瘍への放射線治療の第一の目的は除痛（緩和照射）</span>。'
        '<span class="kw3">照射で腫瘍が縮小して骨膜の伸展・圧迫が減り、'
        '同時に破骨細胞の活動や炎症性サイトカインが抑えられる</span>ことで痛みが和らぐ。'
        '<span class="kw3">効果は照射例の7〜8割で得られ、数日〜数週で現れる</span>。'
        '<span class="kw3">「1回8Gyの単回照射」でも「30Gy／10回」でも除痛効果は同等</span>とされ、'
        '<span class="kw">予後が限られた患者には単回照射が選ばれる</span>。'),
       ('b', '病変の根治', False,
        '<span class="kw4">転移＝全身病であり、四肢の骨病変を1か所叩いても根治にはならない</span>。'
        '<span class="kw4">緩和照射は「治す」ためではなく「症状を取る」ための治療</span>で、'
        '線量も根治照射より低く設定される。'
        '<span class="kw">根治を狙うのは原発巣が制御されている少数個転移（オリゴ転移）に'
        '定位放射線治療を行うような特殊な状況に限られる</span>。'),
       ('c', '遠隔転移の抑制', False,
        '<span class="kw4">放射線治療はあくまで局所治療</span>で、'
        '照射野の外に効果は及ばない。'
        '<span class="kw4">遠隔転移の抑制を担うのは全身療法（抗癌化学療法・'
        'ホルモン療法・分子標的薬・骨修飾薬）</span>である。'
        '<span class="kw">「局所は放射線と手術、全身は薬」という役割分担</span>は'
        'あらゆる腫瘍の設問で使える。'),
       ('d', '病的骨折の予防', False,
        '<span class="kw4">照射後に骨が再石灰化して強度が戻るには数か月かかる</span>ため、'
        '<span class="kw4">「予防」として第一に期待する効果ではない</span>。'
        '<span class="kw3">切迫骨折（皮質の広範な破壊・荷重骨）に対しては、'
        'まず整形外科的な内固定（髄内釘など）を行い、'
        'そのあとに放射線を追加する</span>のが順序である。'
        '<span class="kw4">「最も期待される効果」を問われている以上、除痛に劣る</span>。'),
       ('e', '高カルシウム血症の是正', False,
        '<span class="kw4">悪性腫瘍による高カルシウム血症は、'
        '腫瘍が産生するPTHrPによる全身性の病態（液性高カルシウム血症）が主</span>で、'
        '<span class="kw4">1か所の骨病変への照射では是正できない</span>。'
        '<span class="kw3">治療は生理食塩液の大量輸液＋ビスホスホネート'
        '（またはデノスマブ）＋カルシトニン</span>で、'
        '<span class="kw">根本的には原疾患の治療</span>である。')],
      '転移性骨腫瘍への照射＝緩和照射。ねらいは根治ではなく除痛。',
      patho=('🔎 根治照射と緩和照射——目的が違えば線量も分割も変わる',
             '<span class="kw3">放射線治療は「治すため」と「楽にするため」で、'
             '別物として設計される</span>。'
             '<table class="tb"><tr><th></th><th><span class="kw3">根治照射</span></th>'
             '<th><span class="kw3">緩和照射</span></th></tr>'
             '<tr><td>目的</td><td>腫瘍の制御・治癒</td>'
             '<td><span class="kw3">症状（痛み・出血・圧迫）の緩和</span></td></tr>'
             '<tr><td>総線量</td><td><span class="kw">60〜70Gy程度</span></td>'
             '<td><span class="kw">8〜30Gy程度</span></td></tr>'
             '<tr><td>分割</td>'
             '<td><span class="kw">1回1.8〜2Gy・週5回・6〜7週</span></td>'
             '<td><span class="kw3">1回8Gy単回、または3Gy×10回など短期間</span></td></tr>'
             '<tr><td>晩期障害</td><td>厳密に耐容線量を守る</td>'
             '<td><span class="kw">予後を考えれば晩期障害より'
             '「早く楽になること」を優先できる</span></td></tr>'
             '<tr><td>代表的な状況</td>'
             '<td>上咽頭癌・前立腺癌・早期喉頭癌・乳房温存術後</td>'
             '<td><span class="kw3">骨転移の疼痛</span>・'
             '<span class="kw3">脳転移</span>・'
             '<span class="kw3">脊髄圧迫</span>・上大静脈症候群・気道／食道の狭窄・腫瘍出血</td></tr>'
             '</table>'),
      deep=('💡 骨転移をみたら——「痛みか、折れそうか、麻痺か」で手が変わる',
            '<span class="kw3">同じ骨転移でも、答えは「何が起きているか」で分かれる</span>。'
            '<table class="tb"><tr><th>状況</th><th>最初にすること</th><th>理由</th></tr>'
            '<tr><td><span class="kw3">痛みだけ</span></td>'
            '<td><span class="kw3">緩和照射＋鎮痛薬（WHO方式）</span></td>'
            '<td>7〜8割で除痛が得られる</td></tr>'
            '<tr><td><span class="kw3">切迫骨折（皮質破壊が大きい荷重骨）</span></td>'
            '<td><span class="kw3">整形外科的内固定 → そのあと照射</span></td>'
            '<td><span class="kw3">照射で骨が固まるには数か月かかる</span>ので、'
            '先に固定しないと折れる</td></tr>'
            '<tr><td><span class="kw4">脊髄圧迫による麻痺</span></td>'
            '<td><span class="kw4">緊急対応（ステロイド＋除圧固定術／緊急照射）</span></td>'
            '<td><span class="kw4">麻痺は「どれだけ悪いか」ではなく'
            '「いつからか」で決まる</span>——発症から時間が経つほど戻らない</td></tr>'
            '<tr><td>多発骨転移・全身の骨痛</td>'
            '<td><span class="kw">骨修飾薬（ゾレドロン酸・デノスマブ）</span>、'
            '<span class="kw">前立腺癌なら<sup>223</sup>Ra</span></td>'
            '<td>局所照射では覆いきれない</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">転移性骨腫瘍への放射線治療の目的は除痛</span>'
             '（根治・転移抑制・骨折予防ではない）。<br>'
             '② <span class="kw">単回8Gyでも分割でも除痛効果は同等</span>。<br>'
             '③ <span class="kw3">切迫骨折はまず内固定、そのあと照射</span>。<br>'
             '④ <span class="kw4">転移性脊椎腫瘍による麻痺は緊急</span>——'
             '<span class="kw">ステロイド＋除圧固定術／緊急照射</span>。<br>'
             '⑤ <span class="kw">局所は放射線・手術、全身は薬</span>という役割分担。')),

    # ── NO.40 (106B-31) CBT 88% ans=e ───────────────────────────
    Q('106B-31', 88, [('bc', 'CBT')],
      '<strong>放射線感受性の比較で正しいのはどれか。</strong><br>'
      'ただし、「Ａ＞Ｂ」はＡがＢよりも放射線感受性が高いことを示す。',
      [('a', '腺癌 ＞ 扁平上皮癌', False,
        '<span class="kw4">逆。扁平上皮癌＞腺癌</span>。'
        '<span class="kw">腫瘍の感受性は「造血系・胚細胞系・未分化癌＞扁平上皮癌＞'
        '腺癌＞＞肉腫」の序列</span>で、'
        '<span class="kw4">腺癌は分化した細胞が管腔構造を作っている＝比較的おとなしい</span>ぶん'
        '放射線が効きにくい。'
        '<span class="kw">上咽頭・喉頭・子宮頸部・食道といった'
        '放射線治療の主戦場がすべて扁平上皮癌</span>であることからも確認できる。'),
       ('b', '神経細胞 ＞ 骨髄細胞', False,
        '<span class="kw4">逆。骨髄細胞＞神経細胞</span>。'
        '<span class="kw4">神経細胞は分裂を終えた終末分化細胞（非細胞再生系）</span>で'
        '正常組織のなかで最も感受性が低く、'
        '<span class="kw">骨髄は常に分裂し続ける恒常的細胞再生系</span>で最も高い。'
        '<span class="kw">この2つは正常組織の両端</span>なので、'
        '並べられたら迷わず骨髄を上に置く。'),
       ('c', '分化した細胞 ＞ 未分化な細胞', False,
        '<span class="kw4">逆。未分化な細胞＞分化した細胞</span>——'
        '<span class="kw4">これはBergonié-Tribondeauの法則そのもの</span>である。'
        '<span class="kw">未分化な細胞は分裂が盛んで、将来の分裂回数も多い</span>ので'
        '放射線で受けたDNA損傷が「次の分裂での死」に直結する。'),
       ('d', '細胞周期Ｓ期 ＞ 細胞周期Ｍ期', False,
        '<span class="kw4">逆。M期（有糸分裂期）＞S期</span>。'
        '<span class="kw4">細胞周期のなかで最も放射線感受性が高いのはM期と'
        'その直前（G2期後期）</span>で、'
        '<span class="kw4">S期（とくに後期）は最も抵抗性</span>とされる'
        '（DNA合成に伴う修復機構がはたらくため）。'
        '<span class="kw">体細胞は通常G0期にいるので、'
        'そもそも分裂していない組織は効きにくい</span>。'),
       ('e', '酸素分圧が高い組織 ＞ 酸素分圧が低い組織', True,
        '<span class="kw3">◯ 酸素効果——酸素分圧が高いほど放射線感受性は高い</span>。'
        '<span class="kw3">放射線は主に水を電離してフリーラジカルを生じ、'
        'そのラジカルがDNAを傷つける（間接作用）。'
        '生じた損傷は酸素が結合すると「固定」されて修復できなくなる</span>——'
        'つまり<span class="kw3">酸素は損傷を確定させる役をしている</span>。'
        '<span class="kw3">大きな腫瘍の中心部は血流が乏しく低酸素なので、'
        'そこだけ放射線が効き残る（低酸素細胞問題）</span>のが'
        '放射線治療の古典的な壁である。')],
      '4つの誤答はすべて「向きが逆」。酸素だけが正しい向きで並んでいる。',
      patho=('🔎 この設問は「感受性の物差し」を5本まとめて確認する問題',
             '<span class="kw3">a〜dの4肢は、いずれも正しい序列を'
             'そのまま逆さまにしただけ</span>である。'
             '<span class="kw3">正しい向きを1枚の表にしておけば、'
             '本章の感受性の設問（NO.35・36・41・42）はすべてこれで解ける</span>。'
             '<table class="tb"><tr><th>物差し</th>'
             '<th><span class="kw3">感受性が高い側</span></th>'
             '<th><span class="kw4">感受性が低い側</span></th></tr>'
             '<tr><td>分化度</td><td><span class="kw3">未分化</span></td>'
             '<td><span class="kw4">分化</span></td></tr>'
             '<tr><td>分裂</td><td><span class="kw3">盛ん・将来の分裂回数が多い</span></td>'
             '<td><span class="kw4">分裂しない（終末分化）</span></td></tr>'
             '<tr><td>細胞周期</td><td><span class="kw3">M期・G2期後期</span></td>'
             '<td><span class="kw4">S期後期・G0期</span></td></tr>'
             '<tr><td>酸　素</td><td><span class="kw3">酸素分圧が高い</span></td>'
             '<td><span class="kw4">低酸素</span></td></tr>'
             '<tr><td>組織型（腫瘍）</td>'
             '<td><span class="kw3">造血系・胚細胞系・未分化癌＞扁平上皮癌</span></td>'
             '<td><span class="kw4">腺癌＞＞肉腫・悪性黒色腫</span></td></tr>'
             '<tr><td>組織（正常）</td>'
             '<td><span class="kw3">骨髄・腸上皮・皮膚・生殖腺</span></td>'
             '<td><span class="kw4">神経・筋・骨</span></td></tr></table>' + TBL_FACTOR),
      deep=('💡 なぜ酸素で効き方が変わるのか——間接作用とラジカルの「固定」',
            '<span class="kw3">放射線がDNAを壊す経路は2つ</span>ある。'
            '<span class="kw3">①直接作用＝放射線がDNAそのものに当たる。'
            '②間接作用＝放射線が細胞内の水（体重の約60%）を電離して'
            'ヒドロキシラジカル（・OH）を作り、それがDNAを攻撃する</span>。'
            '<span class="kw3">エックス線・γ線のような低LET放射線では'
            '間接作用が7割前後を占める</span>。<br>'
            '<span class="kw3">このとき酸素があると、'
            'できたDNAラジカルに酸素が結合して過酸化物になり、'
            'もとに戻れなくなる（酸素固定説）</span>。'
            '<span class="kw4">逆に低酸素環境ではラジカルが還元されて修復されてしまう</span>——'
            'これが<span class="kw4">低酸素細胞が2〜3倍の線量を必要とする理由</span>である。'
            '<table class="tb"><tr><th></th><th>低LET（エックス線・γ線）</th>'
            '<th>高LET（重粒子線・中性子線・α線）</th></tr>'
            '<tr><td>主な作用</td><td><span class="kw">間接作用</span></td>'
            '<td><span class="kw">直接作用</span></td></tr>'
            '<tr><td>酸素効果</td><td><span class="kw4">大きい（低酸素だと効かない）</span></td>'
            '<td><span class="kw3">小さい（低酸素でも効く）</span></td></tr>'
            '<tr><td>細胞周期依存性</td><td>大きい</td><td>小さい</td></tr></table>'
            '<span class="kw3">重粒子線が「放射線抵抗性の腫瘍」に期待されるのは、'
            'この酸素効果・周期依存性の小ささゆえ</span>である。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">酸素分圧が高いほど感受性が高い（酸素効果）</span>。<br>'
             '② <span class="kw3">未分化＞分化／分裂が盛ん＞分裂しない</span>'
             '（Bergonié-Tribondeauの法則）。<br>'
             '③ <span class="kw3">M期＞S期</span>（S期後期が最も抵抗性）。<br>'
             '④ <span class="kw3">扁平上皮癌＞腺癌／骨髄細胞＞神経細胞</span>。<br>'
             '⑤ <span class="kw">エックス線・γ線は間接作用が主体なので酸素効果が大きい</span>。')),

    # ── NO.41 (104E-11) 82% ans=d ───────────────────────────────
    Q('104E-11', 82, [],
      '<strong>正常組織で放射線感受性が最も高いのはどれか。</strong>',
      [('a', '下咽頭', False,
        '<span class="kw4">咽頭・食道の粘膜は重層扁平上皮</span>で、'
        '<span class="kw">基底層が分裂して表層へ送り出すので感受性は高い部類</span>'
        '（だから頭頸部照射では粘膜炎が最も早く出る）。'
        'しかし<span class="kw4">重層扁平上皮は「何層も重ねて守る」構造</span>なので、'
        '<span class="kw4">1層の円柱上皮で吸収を担う小腸ほど脆くはない</span>。'),
       ('b', '食　道', False,
        '<span class="kw4">食道も重層扁平上皮</span>。'
        '<span class="kw">胸部照射で放射線食道炎が早期障害として出る</span>が、'
        '<span class="kw4">小腸に比べれば細胞回転は遅い</span>。'
        '<span class="kw">消化管のなかで感受性を並べると'
        '「小腸＞胃・大腸＞食道」</span>という順になる。'),
       ('c', '胃', False,
        '<span class="kw4">胃粘膜は分泌腺主体で、細胞回転は小腸より遅い</span>。'
        '<span class="kw">腹部照射では悪心・嘔吐が出る</span>が、'
        'これは<span class="kw">粘膜そのものの破綻というより'
        '化学受容器引金帯〈CTZ〉を介した反応</span>の面が大きい。'),
       ('d', '小　腸', True,
        '<span class="kw3">◯ 小腸粘膜は全身で最も細胞回転が速い組織のひとつ</span>。'
        '<span class="kw3">陰窩（Lieberkühn腺）の幹細胞が'
        '絶えず分裂して絨毛の先端へ押し上げ、約3〜5日ですべて入れ替わる</span>。'
        '<span class="kw3">まさに恒常的細胞再生系の典型</span>で、'
        '<span class="kw3">照射を受けると陰窩の幹細胞が真っ先に死に、'
        '補充が止まった時点で絨毛が短縮・脱落して'
        '下痢・吸収不良・出血をきたす</span>。'
        '<span class="kw3">全身被曝の急性放射線症候群でも、'
        '骨髄型（1〜10Gy）の次に現れるのが腸管型（10〜30Gy）</span>である。'),
       ('e', '直　腸', False,
        '<span class="kw4">直腸は大腸の一部で、小腸ほど細胞回転が速くない</span>。'
        'ただし<span class="kw">骨盤照射（子宮頸癌・前立腺癌）では'
        '直腸が線量制限臓器になる</span>ことは重要で、'
        '<span class="kw">早期には下痢・粘液便、'
        '晩期には放射線直腸炎（出血・狭窄・瘻孔）</span>が問題になる。'
        '<span class="kw4">「よく問題になる臓器＝感受性が最も高い臓器」ではない</span>。')],
      '消化管では小腸が最速の細胞回転。陰窩の幹細胞が最初に倒れる。',
      patho=('🔎 全身被曝で何がいつ壊れるか——急性放射線症候群の3型',
             '<span class="kw3">正常組織の感受性の序列は、'
             '全身被曝したときに「どの臓器の症状が何Gyで出るか」という形で確認できる</span>。'
             '<table class="tb"><tr><th>線量の目安</th><th>型</th>'
             '<th>壊れる組織</th><th>症状</th></tr>'
             '<tr><td><span class="kw">1〜10Gy</span></td>'
             '<td><span class="kw3">骨髄型（造血器型）</span></td>'
             '<td><span class="kw3">骨髄（造血幹細胞）</span></td>'
             '<td><span class="kw3">リンパ球減少 → 好中球減少・血小板減少 → 感染・出血</span>。'
             '<span class="kw">最も早く減るのはリンパ球</span></td></tr>'
             '<tr><td><span class="kw">10〜30Gy</span></td>'
             '<td><span class="kw3">腸管型</span></td>'
             '<td><span class="kw3">小腸の陰窩幹細胞</span></td>'
             '<td><span class="kw3">絨毛の脱落 → 難治性の下痢・脱水・敗血症</span></td></tr>'
             '<tr><td><span class="kw4">30Gy〜</span></td>'
             '<td><span class="kw4">中枢神経型</span></td>'
             '<td><span class="kw4">脳血管・神経</span></td>'
             '<td><span class="kw4">けいれん・昏睡。数日以内に死亡</span></td></tr>'
             '<tr><td colspan="4"><span class="kw3">線量が上がるほど、'
             'より感受性の低い組織まで壊れていく</span>——'
             '<span class="kw3">つまりこの3型の並びが、そのまま感受性の序列'
             '（骨髄＞小腸＞神経）</span>になっている。</td></tr></table>'),
      deep=('💡 骨盤・腹部照射の副作用は「小腸をどれだけ避けられたか」で決まる',
            '<span class="kw3">腹部・骨盤に照射するときの最大の制約が小腸</span>である。'
            '<table class="tb"><tr><th>時期</th><th>小腸に起こること</th>'
            '<th>臨床像</th></tr>'
            '<tr><td><span class="kw3">早期（照射中〜数週）</span></td>'
            '<td><span class="kw3">陰窩幹細胞の死 → 絨毛の短縮</span></td>'
            '<td><span class="kw3">下痢・腹痛・悪心</span>。'
            '<span class="kw3">照射をやめれば残った幹細胞から再生して回復する</span></td></tr>'
            '<tr><td><span class="kw4">晩期（数か月〜数年）</span></td>'
            '<td><span class="kw4">血管内皮障害 → 線維化・虚血</span></td>'
            '<td><span class="kw4">放射線腸炎・狭窄・腸閉塞・瘻孔</span>。'
            '<span class="kw4">不可逆で、手術も癒着と治癒不良で難しい</span></td></tr></table>'
            '<span class="kw3">この「早期＝分裂の速い上皮／晩期＝血管と結合組織」という対応は、'
            '皮膚（紅斑→線維化）でも肺（放射線肺炎→肺線維症）でも同じ</span>——'
            '<span class="kw3">早期障害は回復しうるが、晩期障害は戻らない</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">消化管では小腸が最も放射線感受性が高い</span>'
             '（陰窩幹細胞の回転が3〜5日）。<br>'
             '② <span class="kw3">急性放射線症候群は骨髄型（1〜10Gy）＞腸管型（10〜30Gy）＞'
             '中枢神経型（30Gy〜）</span>の順に現れる。<br>'
             '③ <span class="kw3">全身被曝で末梢血中最も早く減るのはリンパ球</span>。<br>'
             '④ <span class="kw">早期障害＝上皮の再生停止（回復しうる）／'
             '晩期障害＝血管・結合組織の線維化（不可逆）</span>。<br>'
             '⑤ <span class="kw">骨盤照射では直腸・膀胱・小腸が線量制限臓器</span>。')),

    # ── NO.42 (104G-24) 59% ans=c ───────────────────────────────
    Q('104G-24', 59, [],
      '<strong>放射線感受性の高い腫瘍はどれか。</strong>',
      [('a', '膵　癌', False,
        '<span class="kw4">膵癌（浸潤性膵管癌）は腺癌で、放射線感受性は低い</span>。'
        'さらに<span class="kw4">周囲に十二指腸・胃・小腸・脊髄という'
        '線量制限臓器が密集している</span>ので、'
        '<span class="kw4">十分な線量をかけること自体が難しい</span>。'
        '<span class="kw">切除可能例は手術、局所進行例は化学療法（＋化学放射線療法）</span>が基本。'),
       ('b', '腎細胞癌', False,
        '<span class="kw4">腎細胞癌は悪性黒色腫と並ぶ放射線抵抗性の代表</span>。'
        '<span class="kw4">殺細胞性抗癌薬もホルモン療法も効かない</span>ので、'
        '<span class="kw3">「腎細胞癌の治療＝手術（腎部分切除・根治的腎摘除術）'
        '／転移例は分子標的薬・免疫チェックポイント阻害薬」</span>と決まっている。'
        '<span class="kw">泌尿器科では「効かないものを先に消す」型の設問で頻出</span>。'),
       ('c', 'Ewing 肉腫', True,
        '<span class="kw3">◯ Ewing肉腫は「肉腫」を名乗るが放射線感受性が高い</span>——'
        '<span class="kw3">本章で最も問われる例外</span>である。'
        '<span class="kw3">実体は骨・軟部に生じる未分化な小円形細胞腫瘍（胚細胞系）</span>で、'
        '<span class="kw3">Bergonié-Tribondeauの法則どおり未分化なので放射線がよく効く</span>。'
        '<span class="kw">10代の長管骨骨幹部に好発し、'
        '発熱・炎症反応を伴い、エックス線で玉ねぎの皮状（onion peel）の骨膜反応</span>を示す。'
        '<span class="kw3">治療は化学療法＋（手術または放射線）</span>で、'
        '<span class="kw3">同じ10代の骨腫瘍でも骨肉腫（放射線抵抗性・手術が主）とは対照的</span>。'),
       ('d', '悪性黒色腫', False,
        '<span class="kw4">悪性黒色腫は放射線抵抗性の代表</span>。'
        '<span class="kw">DNA修復能が高いことなどが理由</span>とされる。'
        '<span class="kw">治療は十分なマージンをとった広範切除＋センチネルリンパ節生検</span>で、'
        '進行例では<span class="kw">免疫チェックポイント阻害薬・BRAF阻害薬</span>が用いられる。'),
       ('e', '神経膠芽腫', False,
        '<span class="kw4">膠芽腫〈glioblastoma〉も放射線抵抗性</span>で、'
        'しかも<span class="kw4">周囲脳へびまん性に浸潤するため境界を決められない</span>。'
        '<span class="kw">標準治療は可及的摘出＋放射線＋テモゾロミド併用</span>だが、'
        '<span class="kw4">根治は困難で予後不良</span>である。'
        '<span class="kw4">「脳＝非細胞再生系で感受性が低い」という'
        '正常組織の話ともつながる</span>。')],
      '肉腫は抵抗性、ただしEwing肉腫だけは胚細胞系由来で高感受性。',
      patho=('🔎 「名前」ではなく「由来した細胞」で感受性を決める',
             '<span class="kw3">腫瘍の放射線感受性は、'
             '腫瘍名の末尾（癌／肉腫）ではなく'
             '「どれだけ未分化な細胞から出来ているか」で決まる</span>。'
             '<span class="kw3">Ewing肉腫はそこにできた落とし穴</span>で、'
             '骨に生じ「肉腫」と名乗るが、'
             '<span class="kw3">実体は未分化な小円形細胞の腫瘍</span>である。' + TBL_TUMOR),
      deep=('💡 10代の骨腫瘍——骨肉腫とEwing肉腫は「放射線が効くか」で対照的',
            '<span class="kw3">同じ年代・同じ長管骨に出るのに、'
            '治療の組み立てが正反対</span>になる2つ。'
            '<table class="tb"><tr><th></th><th>骨肉腫</th>'
            '<th><span class="kw3">Ewing肉腫</span></th></tr>'
            '<tr><td>好発年齢</td><td>10代</td><td>10代（やや若い）</td></tr>'
            '<tr><td>好発部位</td>'
            '<td><span class="kw">膝周囲（大腿骨遠位・脛骨近位）の骨幹端</span></td>'
            '<td><span class="kw">長管骨の骨幹・骨盤</span></td></tr>'
            '<tr><td>エックス線</td>'
            '<td><span class="kw">Codman三角・sunburst（放射状の骨形成）</span></td>'
            '<td><span class="kw">onion peel（玉ねぎの皮状の層状骨膜反応）</span></td></tr>'
            '<tr><td>全身症状</td><td>乏しい</td>'
            '<td><span class="kw">発熱・炎症反応上昇（骨髄炎と紛らわしい）</span></td></tr>'
            '<tr><td>放射線感受性</td>'
            '<td><span class="kw4">低い</span></td>'
            '<td><span class="kw3">高い</span></td></tr>'
            '<tr><td>治療</td>'
            '<td><span class="kw4">術前化学療法＋広範切除＋術後化学療法</span></td>'
            '<td><span class="kw3">化学療法＋手術<u>または</u>放射線治療</span></td></tr></table>'
            '<span class="kw3">「放射線が治療の選択肢に入るかどうか」だけで'
            'この2つを見分けられる</span>。'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">Ewing肉腫は名前は肉腫だが胚細胞系由来で'
             '放射線感受性が高い</span>——本章唯一の例外。<br>'
             '② <span class="kw4">放射線抵抗性の代表＝悪性黒色腫・腎細胞癌・膠芽腫・'
             '（大部分の）肉腫・膵癌などの腺癌</span>。<br>'
             '③ <span class="kw">腎細胞癌は放射線も殺細胞性抗癌薬もホルモンも効かない</span>——'
             '手術と分子標的薬／免疫療法。<br>'
             '④ <span class="kw">骨肉腫＝Codman三角・sunburst／Ewing肉腫＝onion peel</span>。<br>'
             '⑤ <span class="kw">感受性は腫瘍名ではなく「由来細胞の未分化さ」で決まる</span>。')),

    # ── NO.43 (110E-11) 58% ans=c ───────────────────────────────
    Q('110E-11', 58, [],
      '<strong>悪性腫瘍に対する放射線治療について<u>誤っている</u>のはどれか。</strong>',
      [('a', '粒子線は深部でブラッグピークを形成する。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw">陽子線・重粒子線などの荷電粒子は、'
        '速度が落ちる終端で急激にエネルギーを放出してピークを作り、'
        'その先へはほとんど届かない</span>。'
        '<span class="kw">ピークの深さは入射エネルギーで調節でき、'
        '腫瘍の厚みに合わせて重ね合わせたものが拡大ブラッグピーク</span>である。'
        '<span class="kw4">エックス線は体表付近が最大で体を突き抜ける</span>のと対照的。'),
       ('b', 'ガンマナイフで治療できる脳転移の数には上限がある。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw">ガンマナイフは多数の<sup>60</sup>Co線源からのγ線を'
        '1点に集束させる定位放射線照射</span>で、'
        '<span class="kw">1病巣ずつ座標を決めて照射する</span>。'
        '<span class="kw">病巣数が増えると総治療時間も正常脳の被曝も増える</span>ので、'
        '<span class="kw">おおむね10個前後までが目安</span>とされ、'
        '<span class="kw">それを超える多発転移には全脳照射</span>が選ばれる。'),
       ('c', '治療後の二次発がんのリスクは小児より高齢者で高い。', True,
        '<span class="kw3">◯ これが誤り。二次発がんのリスクは高齢者より小児で高い</span>。'
        '理由は2つ重なる。'
        '<span class="kw3">①小児は細胞分裂が盛んで組織の放射線感受性そのものが高い'
        '（Bergonié-Tribondeauの法則）</span>。'
        '<span class="kw3">②発がんは確率的影響で、被曝から発症までに'
        '長い潜伏期（固形癌で10〜数十年）がある</span>——'
        '<span class="kw3">つまり「潜伏期を生き延びる余命」が長いほど'
        '実際に発症する機会が増える</span>。'
        '<span class="kw3">だからこそ小児腫瘍では、正常組織の被曝を減らせる'
        '陽子線治療が積極的に選ばれる</span>。'),
       ('d', '外科手術の適応がある肺癌に対しても根治的治療が行われる。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw">Ⅰ期の非小細胞肺癌に対する体幹部定位放射線治療〈SBRT〉は、'
        '手術可能な症例でも根治的治療の選択肢になる</span>。'
        '<span class="kw">少数回に大線量を集中させる方法</span>で、'
        '<span class="kw">とくに心肺機能が低下していて手術に耐えられない例では'
        '第一選択</span>となる。'
        '<span class="kw4">「手術できるなら放射線は使わない」という思い込みが罠</span>。'),
       ('e', '頭頸部癌の強度変調放射線治療〈IMRT〉は耳下腺の防護に有効である。', False,
        '<span class="kw3">正しい。</span>'
        '<span class="kw">IMRTは多方向から強度に濃淡をつけたビームを重ねることで、'
        '複雑な形の高線量域を作れる</span>。'
        '<span class="kw3">頭頸部照射で最も避けたい晩期障害が'
        '唾液腺障害による口腔乾燥（さらに齲歯・嚥下障害へつながる）</span>で、'
        '<span class="kw3">IMRTで耳下腺の線量を落とせるかどうかが'
        '照射後のQOLを決める</span>。前立腺癌・上咽頭癌も代表的適応。')],
      '二次発がんは確率的影響。感受性が高く余命の長い小児のほうがリスクが高い。',
      patho=('🔎 二次発がんは「確率的影響」——だから年齢が効く',
             '<span class="kw3">放射線の影響は、閾値のある確定的影響と'
             '閾値のない確率的影響に分けられる</span>（第4章で詳述）。'
             '<span class="kw3">二次発がんは確率的影響の代表</span>で、'
             '<span class="kw3">「どれだけ浴びたか」が'
             '「発症する確率」に効く（重症度には効かない）</span>。'
             '<table class="tb"><tr><th></th><th><span class="kw3">確率的影響</span></th>'
             '<th><span class="kw">確定的影響</span></th></tr>'
             '<tr><td>例</td><td><span class="kw3">発がん・遺伝的影響</span></td>'
             '<td><span class="kw">白内障・脱毛・皮膚炎・不妊・血球減少</span></td></tr>'
             '<tr><td>閾値</td><td><span class="kw3">なし（ゼロにできない）</span></td>'
             '<td><span class="kw">あり（下回れば起きない）</span></td></tr>'
             '<tr><td>線量と何が相関するか</td>'
             '<td><span class="kw3">発生する確率</span></td>'
             '<td><span class="kw">重症度</span></td></tr>'
             '<tr><td>防護の目標</td>'
             '<td><span class="kw3">確率を容認できる水準まで下げる</span></td>'
             '<td><span class="kw">発生そのものを防ぐ（閾値未満に抑える）</span></td></tr>'
             '<tr><td>潜伏期</td>'
             '<td><span class="kw3">長い（白血病2〜数年、固形癌10〜数十年）</span></td>'
             '<td>短い〜中等度</td></tr></table>'
             '<span class="kw3">潜伏期が長いという性質から、'
             '「若い＝余命が長い」ほど発症の機会が増える</span>という結論が出る。'),
      deep=('💡 放射線治療の「新しい形」——どれも狙いは同じ「正常組織を外す」',
            '<span class="kw3">近年の放射線治療の進歩はすべて'
            '「腫瘍に集中させ、正常組織を外す」という一点に向いている</span>。'
            '<table class="tb"><tr><th>技術</th><th>やり方</th><th>代表的な適応</th></tr>'
            '<tr><td><span class="kw">3次元原体照射</span></td>'
            '<td>腫瘍の形に合わせた照射野を多方向から</td><td>広く一般的</td></tr>'
            '<tr><td><span class="kw3">IMRT（強度変調放射線治療）</span></td>'
            '<td><span class="kw3">ビームの強度に濃淡をつけ、凹んだ形の線量分布も作れる</span></td>'
            '<td><span class="kw3">前立腺癌・上咽頭癌など頭頸部癌'
            '（耳下腺・脊髄を避ける）</span></td></tr>'
            '<tr><td><span class="kw">IGRT（画像誘導放射線治療）</span></td>'
            '<td>毎回CTなどで位置を確認してから照射</td>'
            '<td>IMRTとセットで使う</td></tr>'
            '<tr><td><span class="kw3">定位放射線照射（SRS／SBRT）</span></td>'
            '<td><span class="kw3">小さな標的に少数回で大線量を集中</span></td>'
            '<td><span class="kw3">脳転移・脳動静脈奇形（ガンマナイフ）、'
            'Ⅰ期肺癌・肝癌（SBRT）</span></td></tr>'
            '<tr><td><span class="kw">粒子線治療</span></td>'
            '<td><span class="kw">ブラッグピークで深部の正常組織を守る</span></td>'
            '<td><span class="kw">小児腫瘍・頭蓋底腫瘍・前立腺癌</span></td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">二次発がんのリスクは小児で高い</span>'
             '（高感受性＋長い余命＋長い潜伏期）。<br>'
             '② <span class="kw3">発がん・遺伝的影響＝確率的影響（閾値なし）</span>。<br>'
             '③ <span class="kw">ガンマナイフ＝<sup>60</sup>Coのγ線を集束させる定位照射</span>。'
             '多発（10個前後超）なら全脳照射。<br>'
             '④ <span class="kw3">Ⅰ期肺癌のSBRTは手術可能例でも根治的治療になりうる</span>。<br>'
             '⑤ <span class="kw3">頭頸部IMRTのねらいは耳下腺の温存（口腔乾燥の予防）</span>。')),

    # ── NO.44 (109G-27) 31% ans=a ───────────────────────────────
    Q('109G-27', 31, [],
      '<strong>放射線治療の通常分割照射で正しいのはどれか。</strong>',
      [('a', '週に5 日照射する。', True,
        '<span class="kw3">◯ 通常分割照射＝1回1.8〜2Gy を平日毎日（週5回）</span>。'
        '<span class="kw3">土日を空けるのは正常組織に回復の時間を与えるため</span>で、'
        '<span class="kw3">総線量は根治照射で60〜70Gy、全治療期間は6〜7週</span>になる。'
        '<span class="kw3">「分割して当てる」ことに意味があるのは、'
        '正常組織のほうが腫瘍より'
        '亜致死損傷からの回復（Repair）が速いから</span>——'
        '<span class="kw3">1回あたりを小さくして間隔を空けるほど、'
        '腫瘍と正常組織の差（治療可能比）が開く</span>。'),
       ('b', '1 日に2 回以上照射する。', False,
        '<span class="kw4">1日2回以上は「多分割（過分割）照射」であって通常分割ではない</span>。'
        '<span class="kw">1回線量をさらに小さくして回数を増やすことで'
        '晩期障害を減らす狙い</span>があり、'
        '<span class="kw">限局型小細胞肺癌の加速過分割照射</span>などで用いられる。'
        '<span class="kw">6時間以上の間隔を空ける</span>のが条件。'),
       ('c', '全治療期間は12 週である。', False,
        '<span class="kw4">長すぎる。通常分割照射の全治療期間は6〜7週</span>'
        '（2Gy×5回／週×6〜7週＝60〜70Gy）。'
        '<span class="kw4">この肢が最大の受け皿</span>で、'
        '<span class="kw4">「治療期間が延びるほど、'
        'その間に腫瘍細胞が増殖してしまい局所制御率が下がる（加速再増殖）」</span>ので、'
        '<span class="kw4">むしろ期間はいたずらに延ばしてはいけない</span>。'
        '<span class="kw">やむを得ず休止した場合は総線量を調整する</span>。'),
       ('d', '組織内照射において用いる。', False,
        '<span class="kw4">分割照射は外部照射の考え方</span>である。'
        '<span class="kw">組織内照射（密封小線源）は線源を留置して'
        '持続的に低線量率で照射する</span>——'
        '<span class="kw4">前立腺癌のシード線源は永久留置で、'
        '「1日◯Gyを◯回」という分割の概念がそもそも当てはまらない</span>。'
        '（高線量率で行う腔内照射では数回に分けることがあるが、'
        'それも「通常分割照射」とは呼ばない）'),
       ('e', '1 回の線量は5Gy 以上である。', False,
        '<span class="kw4">1回5Gy以上は「寡分割（少分割）照射」や'
        '定位放射線治療の領域</span>で、通常分割ではない。'
        '<span class="kw">通常分割の1回線量は1.8〜2Gy</span>。'
        '<span class="kw">1回線量が大きいほど晩期障害が強く出る</span>ため、'
        '大線量を使うのは<span class="kw">照射体積を極小にできる定位照射</span>か、'
        '<span class="kw">晩期障害を気にしなくてよい緩和照射（1回8Gy単回など）</span>に限られる。')],
      '通常分割＝1回1.8〜2Gy・週5回・総量60〜70Gy・全期間6〜7週。',
      patho=('🔎 なぜ分割するのか——放射線生物学の4つのR',
             '<span class="kw3">同じ60Gyでも、1回で当てるのと30回に分けるのとでは'
             'まったく結果が違う</span>。'
             '<span class="kw3">分割することで腫瘍と正常組織の差を広げられる</span>——'
             'その仕組みが「4つのR」である。'
             '<table class="tb"><tr><th>R</th><th>内容</th>'
             '<th>分割で得られるもの</th></tr>'
             '<tr><td><span class="kw3">Repair</span><br>（回復）</td>'
             '<td>亜致死損傷からのDNA修復</td>'
             '<td><span class="kw3">正常組織のほうが修復が速い</span>ので、'
             '間隔を空けるほど正常組織が助かる</td></tr>'
             '<tr><td><span class="kw3">Redistribution</span><br>（再分布）</td>'
             '<td>生き残った細胞が周期を進み、感受性の高い時期に入る</td>'
             '<td><span class="kw3">次の照射でよく効くようになる</span></td></tr>'
             '<tr><td><span class="kw3">Reoxygenation</span><br>（再酸素化）</td>'
             '<td>外側の細胞が死んで腫瘍が縮み、'
             '中心部の低酸素細胞に酸素が届く</td>'
             '<td><span class="kw3">酸素効果が回復し、'
             '効き残っていた部分に効くようになる</span></td></tr>'
             '<tr><td><span class="kw4">Repopulation</span><br>（再増殖）</td>'
             '<td><span class="kw4">照射の合間に腫瘍細胞も増える</span></td>'
             '<td><span class="kw4">これだけは不利</span>——'
             '<span class="kw4">だから治療期間を延ばしてはいけない</span></td></tr>'
             '<tr><td colspan="3"><span class="kw3">最初の3つは分割の利点、'
             '最後の1つだけが欠点</span>。'
             '<span class="kw3">「毎日・平日は休まず・6〜7週で終わらせる」'
             'という通常分割のかたちは、この4つの綱引きの答え</span>である。</td></tr></table>'),
      deep=('💡 分割の型を整理する——どれも「1回線量×回数」の設計',
            '<table class="tb"><tr><th>型</th><th>1回線量</th><th>頻度・回数</th>'
            '<th>代表例</th></tr>'
            '<tr><td><span class="kw3">通常分割</span></td>'
            '<td><span class="kw3">1.8〜2Gy</span></td>'
            '<td><span class="kw3">週5回・6〜7週（総量60〜70Gy）</span></td>'
            '<td><span class="kw3">ほとんどの根治照射</span></td></tr>'
            '<tr><td><span class="kw">多分割（過分割）</span></td>'
            '<td>1.1〜1.2Gy</td>'
            '<td><span class="kw">1日2回（6時間以上あける）</span></td>'
            '<td><span class="kw">限局型小細胞肺癌の加速過分割</span></td></tr>'
            '<tr><td><span class="kw">寡分割（少分割）</span></td>'
            '<td><span class="kw">2.5〜3Gy以上</span></td>'
            '<td>回数を減らし短期間で</td>'
            '<td><span class="kw">乳癌の術後照射、前立腺癌</span></td></tr>'
            '<tr><td><span class="kw3">定位放射線治療<br>（SRS／SBRT）</span></td>'
            '<td><span class="kw3">8〜20Gy超</span></td>'
            '<td><span class="kw3">1〜数回</span></td>'
            '<td><span class="kw3">脳転移（ガンマナイフ）・Ⅰ期肺癌</span></td></tr>'
            '<tr><td><span class="kw">緩和照射</span></td>'
            '<td><span class="kw">8Gy／3Gy</span></td>'
            '<td><span class="kw">単回、または10回程度</span></td>'
            '<td><span class="kw">骨転移の疼痛</span></td></tr>'
            '<tr><td colspan="4"><span class="kw3">1回線量を大きくするほど'
            '晩期障害が強く出る</span>——'
            '<span class="kw3">だから大線量が許されるのは、'
            '「照射体積を極小にできる（定位）」か'
            '「晩期障害を考えなくてよい（緩和）」場合だけ</span>である。</td></tr></table>'),
      point=('🎯 国試ポイント',
             '① <span class="kw3">通常分割照射＝1回1.8〜2Gy・週5回（平日毎日）・'
             '総線量60〜70Gy・全治療期間6〜7週</span>。<br>'
             '② <span class="kw3">分割の根拠は4つのR</span>——'
             '<span class="kw">Repair・Redistribution・Reoxygenation は利点、'
             'Repopulation だけが欠点</span>。<br>'
             '③ <span class="kw4">治療期間をいたずらに延ばすと'
             '加速再増殖で局所制御が落ちる</span>。<br>'
             '④ <span class="kw">1日2回＝多分割／1回線量が大きい＝寡分割・定位照射</span>。<br>'
             '⑤ <span class="kw4">分割の概念は外部照射のもの</span>——'
             '<span class="kw">組織内照射（シード線源）は持続的低線量率照射</span>。')),

]


SECTIONS = [
    ('s1', '★問題', '', 0),
    ('s2', '無印問題', '', 4),
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


CH_NUM, CH_NAME = 3, '放射線治療学'


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
