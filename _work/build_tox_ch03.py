# -*- coding: utf-8 -*-
"""
中毒・職業病 第3章「農薬中毒」(NO.10-15) の章別HTML(中毒・職業病/ch03_noyaku_chudoku.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_tox_ch01.py と同方式。

問題文・選択肢はPDF(中毒・職業病 印刷 p.18-21／PDF p.24-27)を書き起こし、
正解/正答率は巻末解答一覧表(PDF p.66-67)から。
解説はPDFのレジュメ部（PDF p.21-23）と国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全6問（画像0枚）。**本章は2組の3連問だけでできている**。

⚠️ **連問は NO.10・11・12（107G-63/64/65＝化学テロ）と
   NO.13・14・15（118F-70/71/72＝自殺企図）の2組**。
   **症例文は組の全カードに載せること**（生成器では `_STEM_10`／`_STEM_13` を
   各問の qt に連結している）。試験モードはカードを1枚ずつ独立に出すので、
   2問目以降に症例が無いと解けない。
   なお **NO.11 の現症は NO.12 にも必要**（治療を決める根拠が現症にある）なので
   `_SHINSHO_11` を NO.12 にも連結してある。

■ 章を貫く4本の筋
  ① **有機リンはChEをリン酸化して止める → アセチルコリンが溢れる**。
     症状は「ムスカリン様（分泌・蠕動・縮瞳・徐脈）」「ニコチン様（筋線維束攣縮→麻痺）」
     「中枢（意識障害・けいれん）」の3系統にしか散らない。
  ② **治療はアトロピン＋PAM**。アトロピンはムスカリン受容体を塞ぐ「対症」、
     PAM〈プラリドキシム〉はChEを脱リン酸化する「原因治療」。
     **カーバメイトにはPAMは無効**（アトロピンのみ）。
  ③ **化学テロでは、患者救命の前に除染**。通常の救急のABCを先にやると
     **医師に二次被害が出る**（NO.10 の正答率26%＝本科目で最低）。
  ④ **トキシドロームは「瞳孔・皮膚・分泌・腸蠕動・体温」の組合せで毒物群を当てる**。
     縮瞳＋発汗＋けいれん＝コリン作動性（NO.15）。

⚠️ **本章の最難は NO.10（107G-63・正答率26%＝48問中で最低）**。
   ｂ動脈血ガス・ｃバイタルサインという「通常の救急なら正しい」肢が並んでおり、
   **化学テロという文脈でのみ「除染が先」に変わる**。
⚠️ 6問すべてに正答率があり、採点除外・必修バッジの問題は無い。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '中毒・職業病' / 'ch03_noyaku_chudoku.html'

Q_START = 10

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


# ------------------------------------------------------------------
# 連問の共通ステム——組の全カードに載せる（ガイド§4）
# ------------------------------------------------------------------
_STEM_10 = (
    '<span class="kw">【連問 NO.10〜12 共通】</span>'
    '25歳の男性。気分不良を主訴に来院した。<br>'
    '<u>現病歴</u>：<span class="kw">官庁街近くのレストランで昼食をとっていたところ'
    '「液体のようなものがまかれた」という声がして、レストラン内で数人が倒れた</span>。'
    '気分が悪くなったためレストランから飛び出し、徒歩で近くの病院を受診した。'
    '会話は可能であり、<span class="kw">目の前が暗く感じ、鼻水が止まらない</span>と'
    '訴えている。病院の受付から報告を受け、'
    '患者を他の患者と接触のない救急室の一室に隔離するよう指示した。<br>')

_SHINSHO_11 = (
    '患者を救急室で診察し以下の情報を得た。<br>'
    '<u>既往歴</u>：幼少時からアレルギー性鼻炎がある。<br>'
    '<u>生活歴</u>：独身。1人暮らし。会社員。喫煙は20本/日を5年間。'
    '飲酒はビール500mL/日を5年間。<br>'
    '<u>家族歴</u>：母親が高血圧症で内服加療中。<br>'
    '<u>現症</u>：意識は清明。頭痛と悪心とを訴えている。体温36.8℃。脈拍108/分、整。'
    '血圧140/90mmHg。呼吸数24/分。SpO<sub>2</sub> 92％（room air）。'
    '<span class="kw">瞳孔は高度に縮瞳し、対光反射は消失</span>している。'
    '<span class="kw">鼻汁、流涎および発汗</span>がみられる。'
    '四肢に運動麻痺を認めない。腱反射の異常を認めない。'
    '呼吸音に異常を認めない。心雑音を聴取しない。<br>')

_STEM_13 = (
    '<span class="kw">【連問 NO.13〜15 共通】</span>'
    '70歳の男性。意識障害のため救急車で搬入された。<br>'
    '<u>現病歴</u>：3か月前に妻が死亡した後、約1週間前から生きていくのが非常に辛いと'
    '悩んでいた。本日、自宅で意識を失った状態で倒れているところを息子が発見し、'
    '救急車を要請した。'
    '<span class="kw">救急搬送中に10分間のけいれん</span>を認めた。'
    '<span class="kw">本人が倒れていた部屋には空の瓶と遺書</span>があった。<br>'
    '<u>既往歴</u>：高血圧症で降圧薬を内服している。<br>'
    '<u>生活歴</u>：息子と2人暮らし。<span class="kw">自宅で農業を営んでいる</span>。<br>'
    '<u>家族歴</u>：特記すべきことはない。<br>'
    '<u>現症</u>：意識レベルはJCSⅢ-100。身長169cm、体重72kg。体温38.8℃。'
    '心拍数120/分、整。血圧120/82mmHg。呼吸数32/分。'
    'SpO<sub>2</sub> 85％（リザーバ付マスク10L/分酸素投与下）。'
    '<span class="kw">瞳孔径は左右2.0mm</span>。対光反射は緩慢である。'
    '<span class="kw">口の周囲に吐物と唾液の混ざったもの</span>を認める。'
    '<span class="kw">全身に著明な発汗</span>を伴い、全身の筋肉はけいれんしている。<br>')

# ------------------------------------------------------------------
# 章を通して何度も参照する表
# ------------------------------------------------------------------

# ① 有機リン中毒の3系統
OP_TABLE = (
    '<table class="tb"><tr><th>系統</th><th>受容体</th><th>症状</th>'
    '<th>覚え方</th></tr>'
    '<tr><td><span class="kw3">ムスカリン様作用</span><br>'
    '（副交感神経のブレーキが壊れた状態）</td>'
    '<td>ムスカリン受容体<br>（副交感神経の効果器）</td>'
    '<td><span class="kw3">流涎・流涙・鼻汁・発汗</span>※・'
    '<span class="kw3">気道分泌物増加・気管支攣縮</span>・'
    '<span class="kw3">蠕動亢進（腹痛）・下痢・嘔吐</span>・'
    '<span class="kw3">縮瞳</span>・<span class="kw3">徐脈</span>・尿失禁</td>'
    '<td><span class="kw3">DUMBELS</span>：Diarrhea／Urination／'
    '<span class="kw3">Miosis</span>／Bradycardia・Bronchorrhea・Bronchospasm／'
    'Emesis／Lacrimation／Salivation</td></tr>'
    '<tr><td><span class="kw3">ニコチン様作用</span></td>'
    '<td>ニコチン受容体<br>（神経筋接合部・自律神経節）</td>'
    '<td><span class="kw3">筋線維束攣縮 → 脱力 → 麻痺</span>'
    '（<u>呼吸筋麻痺が死因</u>）、頻脈・血圧上昇・散瞳（節前刺激による）</td>'
    '<td>脱分極したまま麻痺する'
    '（<span class="kw">スキサメトニウムと同じ形</span>）</td></tr>'
    '<tr><td><span class="kw3">中枢神経作用</span></td>'
    '<td>中枢のAch受容体</td>'
    '<td><span class="kw3">意識障害・けいれん・呼吸中枢抑制</span>、発熱</td>'
    '<td>—</td></tr>'
    '<tr><td colspan="4">'
    '<span class="kw">※ 発汗は交感神経の作用だが、'
    '節後線維がコリン作動性なのでムスカリン様作用として現れる</span>——'
    '<u>「発汗＋縮瞳」という一見矛盾する組合せがコリン作動性の指紋になる</u>'
    '（交感神経興奮なら散瞳＋発汗、抗コリンなら散瞳＋乾燥）</td></tr></table>')

# ② 有機リンとカーバメイトとボツリヌス——Achをめぐる3つの病態
ACH_TABLE = (
    '<table class="tb"><tr><th></th><th>機序</th><th>症状</th><th>治療</th></tr>'
    '<tr><td><span class="kw3">有機リン系農薬</span></td>'
    '<td><span class="kw3">ChEをリン酸化して不可逆的に阻害</span>'
    '（時間が経つと"エイジング"して戻らなくなる）</td>'
    '<td><span class="kw3">Ach過剰</span>'
    '（ムスカリン様＋ニコチン様＋中枢）</td>'
    '<td><span class="kw3">アトロピン静注＋PAM（プラリドキシム）静注</span>'
    '＋胃洗浄・活性炭・下剤</td></tr>'
    '<tr><td><span class="kw3">カーバメイト</span></td>'
    '<td><span class="kw3">ChEをカルバミル化</span>'
    '——<u>有機リンより結合しやすく、解離もしやすい</u></td>'
    '<td>同じくAch過剰だが'
    '<span class="kw3">発症は早く、軽症にとどまることが多い</span></td>'
    '<td><span class="kw3">アトロピン</span>'
    '（<span class="kw4">PAMは無効</span>——'
    '<u>もともと自然に外れるので脱リン酸化薬の出番がない</u>）</td></tr>'
    '<tr><td><span class="kw3">ボツリヌス中毒</span>'
    '（対照）</td>'
    '<td><span class="kw3">Achの放出そのものを止める</span>'
    '（副交感神経のアクセルが壊れた状態）</td>'
    '<td><span class="kw3">抗ムスカリン様＋抗ニコチン様</span>——'
    '<span class="kw3">散瞳・分泌不全（口渇）・排尿障害・'
    '弛緩性麻痺（下行性）</span>。<u>発熱せず意識も清明</u></td>'
    '<td>ボツリヌス抗毒素、呼吸管理</td></tr>'
    '<tr><td colspan="4"><span class="kw3">有機リンとボツリヌスは'
    '「Achが多すぎる／少なすぎる」で完全に鏡像</span>——'
    '<span class="kw3">縮瞳と散瞳、分泌過多と分泌不全</span>で見分ける。'
    '<u>麻痺だけは両方に出る</u>ので、麻痺で分けようとすると間違える</td></tr></table>')

# ③ トキシドローム
TOXIDROME_TABLE = (
    '<table class="tb"><tr><th>トキシドローム</th><th>瞳孔</th>'
    '<th>皮膚・分泌</th><th>その他</th><th>代表的な原因</th></tr>'
    '<tr><td><span class="kw3">コリン作動性</span></td>'
    '<td><span class="kw3">縮瞳</span></td>'
    '<td><span class="kw3">湿潤・発汗著明</span>、流涎・気道分泌物増加</td>'
    '<td><span class="kw3">徐脈（または頻脈）・蠕動亢進・下痢・'
    '筋線維束攣縮・けいれん</span></td>'
    '<td><span class="kw3">有機リン・カーバメイト</span>、'
    'ベサコリン、ネオスチグミンなど抗ChE薬</td></tr>'
    '<tr><td><span class="kw3">抗コリン性</span></td>'
    '<td><span class="kw3">散瞳</span></td>'
    '<td><span class="kw3">乾燥・発汗なし</span>、皮膚紅潮</td>'
    '<td><span class="kw3">頻脈・尿閉・腸蠕動低下・高体温・せん妄</span></td>'
    '<td><span class="kw3">三環系抗うつ薬</span>・抗ヒスタミン薬・'
    'アトロピン・ブチロフェノン</td></tr>'
    '<tr><td><span class="kw3">交感神経興奮性</span></td>'
    '<td><span class="kw3">散瞳</span></td>'
    '<td><span class="kw3">発汗あり</span>'
    '（<u>ここが抗コリン性との分かれ目</u>）</td>'
    '<td><span class="kw3">高血圧・頻脈・高体温・不穏・けいれん</span></td>'
    '<td><span class="kw3">コカイン・アンフェタミン・覚醒剤</span>、'
    'テオフィリン</td></tr>'
    '<tr><td><span class="kw3">オピオイド作動性</span></td>'
    '<td><span class="kw3">著明な縮瞳（pinpoint）</span></td>'
    '<td>正常〜乾燥</td>'
    '<td><span class="kw3">呼吸抑制・徐脈・意識障害</span>。'
    '<u>けいれんも発汗も出ない</u></td>'
    '<td>モルヒネ・ヘロイン・フェンタニル</td></tr>'
    '<tr><td><span class="kw3">鎮静睡眠作用性</span></td>'
    '<td>正常〜縮瞳</td><td>正常</td>'
    '<td><span class="kw3">傾眠〜昏睡・呼吸抑制・低血圧・低体温</span>。'
    '<u>けいれん・縮瞳・発汗はない</u></td>'
    '<td>バルビツール酸・ベンゾジアゼピン・アルコール</td></tr>'
    '<tr><td colspan="5"><span class="kw3">トキシドローム toxidrome は'
    'toxic＋syndrome の造語</span>——'
    '<span class="kw3">作用機序の似た薬剤は同じ症候群を呈する</span>ので、'
    '<u>原因物質が分からなくても「どの毒物群か」までは絞れる</u>。'
    '<span class="kw3">見るのは瞳孔・皮膚（湿潤か乾燥か）・腸蠕動・体温の4点</span>'
    '</td></tr></table>')

# ④ 化学テロ・化学災害への対応
CBRNE_TABLE = (
    '<table class="tb"><tr><th>順序</th><th>やること</th><th>理由</th></tr>'
    '<tr><td><span class="kw3">①</span></td>'
    '<td><span class="kw3">自分と施設の安全確保</span>'
    '（個人防護具・ゾーニング）</td>'
    '<td><span class="kw4">医療者が倒れたら、その後の全員が助からない</span></td></tr>'
    '<tr><td><span class="kw3">②</span></td>'
    '<td><span class="kw3">脱衣と除染</span>'
    '（脱衣だけで曝露の8〜9割が除去できる）</td>'
    '<td><span class="kw3">汚染源を持ち込ませない・広げない</span>。'
    '<u>脱いだ衣類は密封できる袋に詰める</u></td></tr>'
    '<tr><td><span class="kw3">③</span></td>'
    '<td>通常のABC（気道・呼吸・循環）と全身管理</td>'
    '<td>ここでようやく普通の救急に戻る</td></tr>'
    '<tr><td><span class="kw3">④</span></td>'
    '<td>原因物質の同定（トキシドローム・SDS・現場情報）</td>'
    '<td>解毒薬の選択に必要</td></tr>'
    '<tr><td><span class="kw3">⑤</span></td>'
    '<td>解毒薬・拮抗薬</td>'
    '<td>有機リンなら<span class="kw3">アトロピン＋PAM</span></td></tr>'
    '<tr><td colspan="3"><span class="kw3">通常の救急と順序が入れ替わるのは①②だけ</span>——'
    '<span class="kw4">「バイタルを測る」「動脈血ガスを採る」は'
    '普段なら正しいが、除染前にやると医療者が曝露する</span>。'
    '<u>脱衣時は、服の汚染部分が患者の皮膚に触れないように指示する</u>'
    '（Tシャツを普通に脱ぐと顔を通過して途中で意識を失いうる）</td></tr></table>')

IMG = '中毒・職業病/images/'

QUESTIONS = [
    # ------------------------------------------------------------------ NO.10
    Q('107G-63', 26, [],
      _STEM_10 + '<strong>最初に行うべきなのはどれか。</strong>',
      [('a', '警察に問い合わせる。', False,
        '<span class="kw4">患者の救命が優先</span>である。'
        'しかも大規模な化学テロの直後は警察も大混乱に陥っており、'
        '<u>問い合わせても「調査中」という回答しか得られない</u>。'),
       ('b', '動脈血ガスを測定する。', False,
        '<span class="kw4">通常の救急であれば「最初に行うべき」作業だが、'
        '化学テロではこの作業をしているうちに医師に二次被害が生じる</span>。'
        '<span class="kw3">患者救命の前の除染が鉄則</span>。'),
       ('c', 'バイタルサインをチェックする。', False,
        '同上。<span class="kw4">ABCの評価すら除染より後</span>になる。'
        '<u>「普段は正しい」肢が、文脈が変わると誤りになる</u>のがこの設問の核心。'),
       ('d', '症状と発症時の状況とを詳しく聞く。', False,
        '問診している間に汚染された衣服から気化した薬剤に曝露し、'
        '<span class="kw4">医師も目の前が暗く感じ（縮瞳）、鼻水が止まらなくなる</span>だろう。'),
       ('e', '患者に服を脱いでもらい、密封できる袋に詰めてもらう。', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">除染と、汚染の拡大阻止を同時に行う</span>。'
        '<span class="kw3">脱衣だけで曝露の8〜9割が除去できる</span>とされ、'
        '汚染源は密閉しなければならない。'
        '<u>ただし脱ぐ際は、服の汚染部分が皮膚に触れないように指示する</u>'
        '（Tシャツをいつも通りに脱ぐと、その途中で意識を失う可能性がある）。')],
      '化学テロは患者救命より先に除染——脱衣して密封する',
      patho=('□ サリンと化学テロ——「無色・無味・無臭で気付かない」',
             '<p>本連問は<span class="kw3">1995年3月の地下鉄サリン事件</span>を'
             'モデルにした出題である。'
             '<span class="kw3">サリン（イソプロピルメタンフルオロホスホネート）は'
             '有機リン系化合物の一種</span>で、'
             '<span class="kw3">無色・無味・無臭で揮発しやすいため、'
             '曝露されてもその瞬間には気付かない</span>。'
             '加えて殺傷力が高く製造原価も安いため、化学兵器に適している。</p>'
             '<p>症例文の<span class="kw3">「目の前が暗く感じ、鼻水が止まらない」</span>という'
             '2つの訴えが、すでに'
             '<span class="kw3">縮瞳（→視野が暗い）と鼻汁＝ムスカリン様作用</span>を'
             '示している。'
             '<u>患者は徒歩で受診できているので曝露量はそれほど多くない</u>が、'
             '<span class="kw4">その衣服には薬剤が付着したままである</span>。</p>'
             + CBRNE_TABLE),
      deep=('□ 正答率26%——「普段の正しさ」が罠になる設問の型',
            '<p>本問は<span class="kw3">全48問中で最も正答率が低い（26%）</span>。'
            '理由ははっきりしていて、'
            '<span class="kw4">ｂ 動脈血ガス・ｃ バイタルサインという'
            '「通常の救急なら間違いなく正しい」肢が並んでいる</span>からである。'
            '実際、<span class="kw3">これらが誤りになるのは'
            '「化学テロ・化学災害」という文脈のときだけ</span>である。</p>'
            '<p><span class="kw3">読み替えの合図は症例文にすべて置かれている</span>——'
            '<u>①「液体のようなものがまかれた」②「レストラン内で数人が倒れた」'
            '③受付からの報告で「他の患者と接触のない一室に隔離するよう指示した」</u>。'
            '<span class="kw3">③はすでに医師がゾーニングを始めている</span>ことを示し、'
            '<span class="kw3">「この症例は除染の物語である」と宣言している</span>のに等しい。</p>'
            '<p>この構造は他の災害医療でも同じで、'
            '<span class="kw3">放射性物質の付着した患者（→第7章 NO.47）でも'
            '「まず脱衣と除染、医療者は防護、ゾーニング」</span>という'
            '同じ順序が問われる。'
            '<span class="kw3">「自分の安全 → 汚染の遮断 → 患者の治療」という'
            '3段は、CBRNE災害に共通の背骨</span>である。</p>'),
      point=('□ 国試ポイント：CBRNE災害と除染',
             '<ol>'
             '<li><span class="kw3">CBRNE</span>＝'
             'Chemical（化学）／Biological（生物）／Radiological（放射性物質）／'
             'Nuclear（核）／Explosive（爆発物）。'
             '<u>いずれも「二次被害の防止」が最優先</u>。</li>'
             '<li><span class="kw3">ゾーニング</span>——'
             '<span class="kw3">ホットゾーン（汚染区域）／ウォームゾーン（除染区域）／'
             'コールドゾーン（清潔区域）</span>に分け、'
             '<u>人と物の流れを一方向にする</u>。</li>'
             '<li><span class="kw3">除染は「脱衣」が主役</span>——'
             '<span class="kw3">脱衣だけで曝露の8〜9割が除去できる</span>。'
             'その後に微温湯とシャワーによる水的除染。'
             '<span class="kw4">ただし金属ナトリウムなど水と反応する物質は乾式除染</span>。</li>'
             '<li><span class="kw3">サリン事件でのPAM</span>——'
             'PAMは<u>有機リン中毒の解毒薬という特殊な薬剤</u>で、'
             '農業地帯近隣の病院以外には通常常備されていない。'
             '<span class="kw">実際の事件でも全国から都心へかき集めて救命に寄与した</span>。'
             '<u>選択肢にPAMが無くてもアトロピンを選ぶ</u>のはこのため（→ NO.12）。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">DMAT・災害拠点病院</span>、'
             '<span class="kw">START法によるトリアージ</span>、'
             '<span class="kw">個人防護具のレベル（A〜D）</span>、'
             '<span class="kw">神経剤（サリン・VX・ソマン）と'
             'びらん剤（マスタード）・窒息剤（ホスゲン）・血液剤（シアン）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.11
    Q('107G-64', 98, [],
      _STEM_10 + _SHINSHO_11 +
      '<strong>この患者で予想される血液生化学所見はどれか。</strong>',
      [('a', 'CK 高値', False,
        '<span class="kw4">有機リン中毒と直接の関係はない</span>。'
        'CKが上がるのは横紋筋融解症だが、それを示す記載はない。'),
       ('b', '血糖低値', False,
        '<span class="kw4">有機リン中毒と無関係</span>。'
        'しかも<u>患者はレストランで昼食を摂っていた</u>ので低血糖は考えにくい。'),
       ('c', 'ALT 高値', False,
        '<span class="kw4">有機リン中毒と無関係</span>。急性肝不全を示す記載もない。'),
       ('d', 'クレアチニン高値', False,
        '<span class="kw4">有機リン中毒と無関係</span>。急性腎不全を示す記載もない。'),
       ('e', 'コリンエステラーゼ〈ChE〉活性の低下', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">有機リンはChEをリン酸化してその活性を阻害する</span>。'
        '結果としてアセチルコリンが分解されずに溜まり、'
        '縮瞳・鼻汁・流涎・発汗といったムスカリン様作用が現れる。'
        '<u>ChE低値は診断の裏付けであり、重症度の指標にもなる</u>。')],
      '有機リンはChEをリン酸化→ChE活性低下',
      patho=('□ 症例文がすでに「有機リン」と言っている',
             '<p>患者は徒歩で医療機関を受診しており、'
             '<span class="kw3">曝露量はそれほど多くない</span>。'
             'そのため意識は清明だが、'
             '<span class="kw3">縮瞳・対光反射消失・鼻汁・流涎・発汗という'
             'ムスカリン様作用はすでに出そろっている</span>。</p>'
             '<p>一方<span class="kw3">四肢の運動麻痺はなく腱反射も正常</span>なので、'
             '<span class="kw3">ニコチン様作用はまだ十分に出ていない</span>。'
             'ただし<span class="kw4">SpO<sub>2</sub> 92％の低下と、'
             'それを代償する頻脈（108/分）・頻呼吸（24/分）</span>は、'
             '<u>気道分泌物の増加と呼吸筋収縮の弱まりが始まっている</u>ことを示唆する。'
             '<span class="kw3">呼吸筋麻痺こそが有機リン中毒の死因</span>なので、'
             'ここは見逃せない所見である。</p>' + OP_TABLE),
      deep=('□ ChE低下は「有機リン」の指紋——ただし2種類ある',
            '<p>臨床で測るコリンエステラーゼには2種類ある。</p>'
            '<table class="tb"><tr><th></th><th>別名</th><th>存在部位</th>'
            '<th>特徴</th></tr>'
            '<tr><td><span class="kw3">真性ChE</span></td>'
            '<td>アセチルコリンエステラーゼ〈AChE〉、'
            '<span class="kw3">赤血球ChE</span></td>'
            '<td>神経終末・赤血球膜</td>'
            '<td><span class="kw3">症状とよく相関する</span>が、'
            '<u>回復には赤血球の寿命（約120日）に沿った時間がかかる</u></td></tr>'
            '<tr><td><span class="kw3">偽性ChE</span></td>'
            '<td>ブチリルコリンエステラーゼ〈BChE〉、'
            '<span class="kw3">血漿ChE</span></td>'
            '<td>肝で産生され血漿中に存在</td>'
            '<td><span class="kw3">一般検査項目の「ChE」はこちら</span>。'
            '感度が高く早く下がるが、'
            '<u>肝障害・低栄養でも下がる</u>ので特異度は低い。'
            '回復は数日〜数週</td></tr>'
            '<tr><td colspan="4"><span class="kw3">ChEは肝の合成能を反映する項目'
            'でもある</span>——'
            '<u>ネフローゼ症候群・甲状腺機能亢進症・肥満では高値、'
            '肝硬変・低栄養・有機リン中毒では低値</u>。'
            '<span class="kw4">「ChEが下がる」だけでは有機リンと決まらず、'
            '症状（縮瞳・発汗・分泌過多）と合わせて初めて決まる</span></td></tr></table>'
            '<p>なお<span class="kw3">有機リンによるリン酸化は時間が経つと'
            '"エイジング aging"して不可逆になる</span>——'
            '<u>PAMを早期に投与しなければならない理由がここにある</u>。</p>'),
      point=('□ 国試ポイント：ChEが下がる病態を並べる',
             '<ol>'
             '<li><span class="kw3">有機リン中毒でChE低値</span>——'
             '正答率98%の必修レベル。'
             '<u>「農薬・殺虫剤・サリン」を見たらChE</u>。</li>'
             '<li><span class="kw3">ChE低値のその他の原因</span>——'
             '<span class="kw3">肝硬変・劇症肝炎（肝の合成能低下）</span>、'
             '低栄養、悪性腫瘍の末期。'
             '<span class="kw">ChEはアルブミン・コレステロールと同じく'
             '「肝の合成能」の指標</span>として並ぶ。</li>'
             '<li><span class="kw3">ChE高値</span>——'
             'ネフローゼ症候群、脂肪肝、糖尿病、甲状腺機能亢進症、肥満。</li>'
             '<li><span class="kw3">遷延性コリン作動性クリーゼと中間症候群</span>——'
             '<u>急性期を乗り切った1〜4日後に、呼吸筋・近位筋・脳神経支配筋の'
             '麻痺が再燃することがある（中間症候群）</u>。'
             '<span class="kw4">症状が良くなっても人工呼吸の準備を解かない</span>。'
             'さらに数週後に<span class="kw">遅発性多発神経炎</span>が起こりうる。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">スキサメトニウム（脱分極性筋弛緩薬）は'
             '偽性ChEで分解される</span>ので、'
             '<u>ChE低下例・遺伝的ChE欠損例では遷延性無呼吸をきたす</u>。'
             '有機リン曝露者に筋弛緩薬を使うときの落とし穴。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.12
    Q('107G-65', 96, [],
      _STEM_10 + _SHINSHO_11 +
      '<strong>まず行うべき治療はどれか。</strong>',
      [('a', 'アトロピンの静脈内投与', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">有機リン中毒の治療はアトロピンとPAM（プラリドキシム）の静注</span>。'
        '<span class="kw3">アトロピンは抗ムスカリン薬</span>で、'
        '溢れたアセチルコリンからムスカリン受容体を守る'
        '（気道分泌物・徐脈・縮瞳に効く）。'
        '<u>選択肢にPAMは無いが、PAMは有機リン中毒の解毒薬という特殊な薬剤で、'
        '農業地帯近隣の病院以外には通常常備されていない</u>——'
        '実際の地下鉄サリン事件でも全国からかき集めた。'),
       ('b', 'ジアゼパムの筋肉内投与', False,
        '<span class="kw4">患者はけいれんを生じていない</span>ので不要。'
        'けいれんがあればベンゾジアゼピンは正しい治療になる（→ NO.13 の症例と対比）。'),
       ('c', 'アドレナリンの静脈内投与', False,
        '<span class="kw4">アナフィラキシー反応ではない</span>ので不要。'
        '皮疹・気道浮腫・血圧低下といったアナフィラキシーの所見はない。'),
       ('d', 'ネオスチグミンの内服投与', False,
        '<span class="kw4">ネオスチグミンはコリンエステラーゼ阻害薬＝コリン作動薬</span>で、'
        '<span class="kw4">投与すれば病態は確実に悪化する</span>。'
        '<u>禁忌肢と考えてよい</u>——火に油を注ぐ選択。'),
       ('e', '亜硝酸ナトリウムの静脈内投与', False,
        '<span class="kw4">亜硝酸薬はシアン中毒の治療</span>'
        '（メトヘモグロビンを作ってCN<sup>−</sup>を捕まえる）。'
        '本例はシアン中毒ではない。')],
      '有機リン中毒＝アトロピン（＋PAM）',
      patho=('□ アトロピンとPAM——役割が違う2剤',
             '<p><span class="kw3">有機リン中毒の薬物治療は2本立て</span>で、'
             '<u>それぞれ別の場所に効く</u>。</p>'
             '<table class="tb"><tr><th>薬</th><th>作用</th><th>効く症状</th>'
             '<th>効かない症状</th></tr>'
             '<tr><td><span class="kw3">アトロピン</span></td>'
             '<td><span class="kw3">ムスカリン受容体を競合的に遮断</span>'
             '（対症療法）</td>'
             '<td><span class="kw3">気道分泌物増加・気管支攣縮・徐脈・'
             '流涎・発汗・縮瞳・蠕動亢進</span></td>'
             '<td><span class="kw4">ニコチン様作用（筋線維束攣縮・呼吸筋麻痺）'
             'には無効</span>——受容体が違うため</td></tr>'
             '<tr><td><span class="kw3">PAM〈プラリドキシム〉</span></td>'
             '<td><span class="kw3">リン酸化されたChEを脱リン酸化して'
             '酵素そのものを蘇らせる</span>（原因治療）</td>'
             '<td><span class="kw3">ニコチン様作用を含めた全症状</span></td>'
             '<td><span class="kw4">エイジング後は無効</span>'
             '＝<u>早期投与が絶対条件</u>。'
             '<span class="kw4">カーバメイト中毒にも無効</span></td></tr>'
             '<tr><td colspan="4"><span class="kw3">アトロピンの投与量の指標は'
             '「気道分泌物が乾くまで」</span>——'
             '<u>心拍数や瞳孔径ではなく、気道分泌が止まることを目標に'
             '大量・反復投与する</u>（通常の用量では足りない）。'
             '<span class="kw">加えて胃洗浄・活性炭投与・下剤投与、'
             '皮膚曝露なら脱衣と洗浄</span>を並行して行う</td></tr></table>'
             + ACH_TABLE),
      deep=('□ 「選択肢に無い薬」を探しに行かない',
            '<p>本問の正答率は96%と高いが、'
            '<span class="kw3">教科書的な第一選択がPAMとアトロピンの2剤なのに、'
            '選択肢にはアトロピンしかない</span>という点に'
            '一瞬迷う受験生がいる。'
            '<span class="kw3">国試は「並んでいる肢の中で最も適切なものを選ぶ」試験</span>'
            'であって、<u>理想の処方を書く試験ではない</u>。</p>'
            '<p>そして誤りの4肢は、いずれも'
            '<span class="kw3">「別の中毒・別の病態の第一選択」</span>になっている。'
            '<span class="kw3">この構造は中毒分野の頻出パターン</span>なので、'
            '拮抗薬・解毒薬の対応表として一気に覚えてしまうのが得策である。</p>'
            '<table class="tb"><tr><th>中毒</th><th>拮抗薬・解毒薬</th></tr>'
            '<tr><td><span class="kw3">有機リン</span></td>'
            '<td><span class="kw3">アトロピン＋PAM（プラリドキシム）</span></td></tr>'
            '<tr><td><span class="kw3">カーバメイト</span></td>'
            '<td><span class="kw3">アトロピン</span>'
            '（<span class="kw4">PAMは無効</span>）</td></tr>'
            '<tr><td><span class="kw3">ベンゾジアゼピン</span></td>'
            '<td><span class="kw3">フルマゼニル</span></td></tr>'
            '<tr><td><span class="kw3">オピオイド</span></td>'
            '<td><span class="kw3">ナロキソン</span></td></tr>'
            '<tr><td><span class="kw3">シアン</span></td>'
            '<td><span class="kw3">ヒドロキソコバラミン</span>（第一選択）／'
            '亜硝酸薬＋チオ硫酸ナトリウム（第二選択）</td></tr>'
            '<tr><td><span class="kw3">メタノール・エチレングリコール</span></td>'
            '<td><span class="kw3">ホメピゾール</span>（またはエタノール）</td></tr>'
            '<tr><td><span class="kw3">アセトアミノフェン</span></td>'
            '<td><span class="kw3">N-アセチルシステイン</span></td></tr>'
            '<tr><td><span class="kw3">メトヘモグロビン血症</span></td>'
            '<td><span class="kw3">メチルチオニニウム（メチレンブルー）</span></td></tr>'
            '<tr><td><span class="kw3">三環系抗うつ薬</span></td>'
            '<td><span class="kw3">炭酸水素ナトリウム</span>'
            '（Na負荷とpH上昇でNa<sup>+</sup>チャネル遮断を解く）</td></tr>'
            '<tr><td><span class="kw3">一酸化炭素</span></td>'
            '<td><span class="kw3">高濃度酸素・高圧酸素療法</span></td></tr>'
            '<tr><td>ジギタリス</td><td>ジゴキシン抗体Fab</td></tr>'
            '<tr><td>ヘパリン</td><td>プロタミン</td></tr>'
            '<tr><td>ワルファリン</td><td>ビタミンK</td></tr>'
            '<tr><td>鉛・水銀・ヒ素</td>'
            '<td>キレート剤（ジメルカプロール〈BAL〉、EDTA、'
            'ペニシラミン）</td></tr></table>'),
      point=('□ 国試ポイント：有機リン中毒の全身管理',
             '<ol>'
             '<li><span class="kw3">アトロピンの投与目標は「気道分泌物が乾くこと」</span>。'
             '<u>心拍数や瞳孔径を目標にしない</u>。必要量は通常量をはるかに超える。</li>'
             '<li><span class="kw3">PAMは早いほど効く</span>——'
             'リン酸化ChEはエイジングすると再賦活できない。'
             '<span class="kw4">カーバメイトにはPAMを使わない</span>。</li>'
             '<li><span class="kw3">消化管除染</span>——'
             '経口摂取なら<span class="kw">胃洗浄・活性炭投与・下剤</span>。'
             '<u>皮膚曝露なら脱衣と洗浄が優先</u>（→ NO.10）。'
             '<span class="kw4">医療者は手袋・ガウン・必要なら呼吸保護具</span>を装着する'
             '（患者の吐物・呼気・着衣が二次曝露源）。</li>'
             '<li><span class="kw3">呼吸筋麻痺に備えて気管挿管と人工呼吸の準備</span>。'
             '<u>気道分泌物が多いので頻回の吸引が要る</u>（→ NO.13）。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">中間症候群（1〜4日後の呼吸筋麻痺再燃）</span>、'
             '<span class="kw">遅発性多発神経炎</span>、'
             '<span class="kw">パラコート中毒では高濃度酸素が禁忌</span>'
             '（活性酸素が肺線維症を助長するため）——'
             '<u>同じ農薬でも真逆の対応になるので混同しない</u>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.13
    Q('118F-70', 97, [],
      _STEM_13 + '<strong>まず行う処置はどれか。</strong>',
      [('a', '胃管挿入', False,
        '胃洗浄を行うには胃管挿入が必要だが、'
        '<span class="kw4">それより優先すべき処置がある</span>。'
        '<u>重度の意識障害下で胃管を入れると誤嚥のリスクがさらに高まる</u>ので、'
        '順序としては気道確保が先。'),
       ('b', '気管挿管', True,
        '<span class="kw3">◯ 正解</span>。'
        '理由は3つ重なっている——'
        '<span class="kw3">①JCSⅢ-100の重度意識障害で嘔吐しており（口周囲に吐物）、'
        '嚥下性肺炎が必至</span>、'
        '<span class="kw3">②リザーバ付マスク10L/分の酸素投与下でも'
        'SpO<sub>2</sub> 85％と改善しない</span>、'
        '<span class="kw3">③コリン作動性物質は気道分泌物を増やす</span>ので'
        '頻回の吸引と機械的人工呼吸が要る。'),
       ('c', '全身冷却', False,
        '<span class="kw4">熱中症ではない</span>ので無意味。'
        '体温38.8℃は<u>アセチルコリンの中枢神経作用とけいれんによる産熱</u>と'
        '考えられ、冷却で治る病態ではない。'),
       ('d', '大量輸液', False,
        '<span class="kw4">脱水症ではない</span>（血圧120/82mmHgは保たれている）ので'
        '無意味な治療である。'),
       ('e', '中心静脈カテーテル留置', False,
        '<span class="kw4">中心静脈栄養が必要な病態ではない</span>。'
        '急性期に薬剤投与路が要るとしても末梢静脈路で足り、'
        '<u>気道確保より優先されることはない</u>。')],
      '重度意識障害＋嘔吐＋酸素投与下でSpO2 85%＝まず気管挿管',
      patho=('□ 症例文を所見に分解する——縮瞳・発汗・けいれん・農業',
             '<p><span class="kw3">自殺目的で瓶に入った何らかの物質を摂取し、'
             '重度の意識障害と短時間で治まるけいれんを呈した</span>患者である。'
             '所見を並べると原因物質は絞れる。</p>'
             '<table class="tb"><tr><th>所見</th><th>読み</th></tr>'
             '<tr><td><span class="kw3">瞳孔径 左右2.0mm（絶対的縮瞳）</span></td>'
             '<td><span class="kw3">コリン作動性</span>'
             'またはオピオイド作動性</td></tr>'
             '<tr><td><span class="kw3">全身に著明な発汗</span></td>'
             '<td><span class="kw3">コリン作動性</span>'
             '（<u>オピオイドでは発汗しない</u>）</td></tr>'
             '<tr><td><span class="kw3">口周囲に吐物と唾液</span></td>'
             '<td><span class="kw3">流涎・嘔吐＝ムスカリン様作用</span></td></tr>'
             '<tr><td><span class="kw3">けいれん・体温38.8℃</span></td>'
             '<td><span class="kw3">アセチルコリンの中枢神経作用</span>'
             '（<u>オピオイドではけいれんも発熱も起こらない</u>）</td></tr>'
             '<tr><td><span class="kw3">自宅で農業を営んでいる</span></td>'
             '<td><span class="kw3">有機リン系農薬を容易に入手できる</span>'
             '——補強材料</td></tr>'
             '<tr><td><span class="kw4">SpO<sub>2</sub> 85％'
             '（リザーバ付マスク10L/分下）</span></td>'
             '<td><span class="kw4">気道分泌物と呼吸筋の障害。'
             '酸素だけでは上がらない＝気道確保と換気補助が要る</span></td></tr></table>'
             '<p><span class="kw3">「縮瞳＋発汗＋けいれん」の3点セットが揃えば'
             'コリン作動性で確定に近い</span>——'
             '<u>縮瞳をきたすもう一方のオピオイドは、発汗もけいれんも起こさない</u>からである。</p>'),
      deep=('□ 中毒でも順序はABC——ただし「酸素で上がらない」が決め手',
            '<p>中毒診療でも<span class="kw3">全身管理（ABC）が解毒より先</span>である。'
            '本問が問うているのは<u>そのABCの中でどこに手をつけるか</u>で、'
            '<span class="kw3">気道（A）と呼吸（B）の両方が破綻している</span>ので'
            '気管挿管になる。</p>'
            '<p><span class="kw3">「気管挿管を選ばせる」設問の合図は決まっている</span>——</p>'
            '<ol>'
            '<li><span class="kw3">高濃度酸素を投与しているのにSpO<sub>2</sub>が上がらない</span>'
            '（本問：リザーバ付マスク10L/分で85％）。'
            '<u>酸素の量ではなく「換気」の問題だと分かる</u>。</li>'
            '<li><span class="kw3">意識障害＋嘔吐（気道防御反射の消失）</span>'
            '——誤嚥が必至。</li>'
            '<li><span class="kw3">舌根沈下や上気道閉塞があり、'
            'バッグバルブマスク換気でも改善しない</span>'
            '（→ 第4章 NO.17 も同じ形）。</li>'
            '<li><span class="kw3">気道分泌物が多く反復吸引が要る</span>'
            '（コリン作動性物質の特徴）。</li>'
            '</ol>'
            '<p>逆に<span class="kw4">「全身冷却」「大量輸液」「中心静脈カテーテル」は'
            'いずれもその病態が存在しない</span>——'
            '<span class="kw3">正しい治療でも、適応が無ければ誤り</span>という'
            '基本の確認になっている。</p>'),
      point=('□ 国試ポイント：急性中毒の初期対応の順序',
             '<ol>'
             '<li><span class="kw3">①全身管理（ABC）→②消化管除染→③吸着→'
             '④排泄促進→⑤拮抗薬・解毒薬</span>という順序。'
             '<u>解毒薬から入る問題は無い</u>。</li>'
             '<li><span class="kw3">胃洗浄の適応は限定的</span>——'
             '<span class="kw">致死量を摂取し、原則1時間以内</span>。'
             '<span class="kw4">意識障害があれば気管挿管してから行う</span>。'
             '<span class="kw4">腐食性物質（酸・アルカリ）と'
             '石油製品（灯油・ガソリン）では禁忌</span>'
             '（→第4章 NO.21）。</li>'
             '<li><span class="kw3">活性炭</span>は多くの薬毒物を吸着するが、'
             '<span class="kw4">金属・アルコール類・強酸強アルカリ・'
             '石油製品には無効</span>。</li>'
             '<li><span class="kw3">血液浄化が有効なのは'
             '「分子量が小さく・蛋白結合率が低く・分布容積が小さい」もの</span>——'
             '<span class="kw">サリチル酸・メタノール・エチレングリコール・リチウム・'
             'テオフィリン・バルビツール酸</span>。'
             '<u>三環系抗うつ薬やニコチンには無効</u>（分布容積が大きい）。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">腸洗浄（whole bowel irrigation）</span>、'
             '<span class="kw">尿のアルカリ化（サリチル酸中毒）</span>、'
             '<span class="kw">脂肪乳剤（局所麻酔薬中毒）</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.14
    Q('118F-71', 96, [],
      _STEM_13 +
      '<strong>患者の息子への質問のうち搬入直後の治療のために最も重要なのはどれか。</strong>',
      [('a', '「遺書をお持ちですか」', False,
        '<span class="kw4">遺書の記載内容によって治療が変わるわけではない</span>。'
        '自殺企図の背景把握や精神科的介入には意味があるが、'
        '<u>「搬入直後の治療のために」という限定に合わない</u>。'),
       ('b', '「落ちていた空の瓶は持ってきましたか」', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">中毒の原因物質を確定できれば、その後の治療の選択が'
        '一気に決まる</span>——'
        '解毒薬の選択、消化管除染の可否、血液浄化の適応、'
        '起こりうる合併症の予測がすべて物質で変わる。'
        '<u>瓶にはラベル（＝実質的なSDS）が付いており、残量から摂取量も推定できる</u>。'),
       ('c', '「ご家族に精神科通院中の方はいますか」', False,
        '精神疾患の一部には家族集積傾向があるが、'
        '<span class="kw4">「搬入直後」の治療には役に立たない</span>。'),
       ('d', '「お父さんはお酒をどれくらい飲みますか」', False,
        '<span class="kw4">大酒を飲んでその勢いで自殺したわけではない</span>ので'
        '無意味な質問である。'
        '（アルコールの併用は意識障害の増悪因子ではあるが、'
        '本例の縮瞳・発汗・けいれんを説明しない。）'),
       ('e', '「お父さんはけいれんを起こしたことがありますか」', False,
        '<span class="kw4">過去のけいれんの有無で現在の治療法が変わるわけではない</span>。'
        'てんかんの既往があったとしても、'
        '<u>目の前の縮瞳・発汗・分泌過多は説明できない</u>。')],
      '原因物質の同定が治療を決める——空の瓶を持ってきてもらう',
      patho=('□ 中毒診療で「物質を特定する」ことの重み',
             '<p><span class="kw3">中毒の治療は、原因物質が決まるかどうかで'
             '中身が丸ごと変わる</span>。</p>'
             '<table class="tb"><tr><th>物質が分かると決まること</th><th>例</th></tr>'
             '<tr><td><span class="kw3">解毒薬・拮抗薬</span></td>'
             '<td>有機リン→アトロピン＋PAM／'
             'ベンゾジアゼピン→フルマゼニル／'
             'アセトアミノフェン→N-アセチルシステイン</td></tr>'
             '<tr><td><span class="kw3">消化管除染の可否</span></td>'
             '<td><span class="kw4">腐食性物質と石油製品では胃洗浄が禁忌</span>／'
             '活性炭が無効な物質（金属・アルコール）がある</td></tr>'
             '<tr><td><span class="kw3">血液浄化の適応</span></td>'
             '<td>メタノール・リチウム・テオフィリンには有効／'
             '<span class="kw4">三環系抗うつ薬やニコチンには無効</span></td></tr>'
             '<tr><td><span class="kw3">禁忌</span></td>'
             '<td><span class="kw4">パラコート中毒では高濃度酸素が禁忌</span>'
             '（活性酸素が肺線維症を助長する）</td></tr>'
             '<tr><td><span class="kw3">予測すべき合併症と観察期間</span></td>'
             '<td>有機リンなら<span class="kw">中間症候群（1〜4日後の呼吸筋麻痺）</span>／'
             'パラコートなら<span class="kw">3日目の肺水腫〜肺線維症</span></td></tr>'
             '<tr><td colspan="2"><span class="kw3">だから「容器を持ってきてもらう」'
             'ことが治療そのものになる</span>——'
             '<u>ラベルは実質的なSDSであり、残量から摂取量も推定できる</u></td></tr></table>'),
      deep=('□ 「搬入直後の治療のために」という限定を効かせる',
            '<p>本問は<span class="kw3">選択肢のうち4つが'
            '「臨床的には意味があるが、今この瞬間の治療は変えない」もの</span>で'
            '構成されている。'
            '<span class="kw3">遺書・家族歴・飲酒歴・けいれんの既往は、'
            'いずれ聴取すべき情報</span>ではある——'
            '<u>特に遺書と精神科的背景は、救命後の自殺再企図の予防に不可欠</u>だ。'
            'しかし設問はわざわざ'
            '<span class="kw3">「搬入直後の治療のために最も重要な」</span>と'
            '時期と目的を二重に限定している。</p>'
            '<p><span class="kw3">これは第2章 NO.8（勤務先へ照会するもの）と'
            'まったく同じ判断基準</span>——'
            '<span class="kw3">「その情報で、今の治療が変わるか」</span>。'
            '<u>変わらないなら、正しい情報でも「重要でない」</u>。</p>'
            '<p>臨床的には、原因物質を推定する材料は次の3つを組み合わせる。</p>'
            '<ol>'
            '<li><span class="kw3">現場の情報</span>——'
            '<span class="kw3">容器・残薬・処方箋・空シート・臭い</span>'
            '（→第4章 NO.18 では「室内に大量の薬の空シート」がこれに当たる）。</li>'
            '<li><span class="kw3">トキシドローム</span>——'
            '瞳孔・皮膚・分泌・腸蠕動・体温から毒物群を推定（→ NO.15）。</li>'
            '<li><span class="kw3">検査</span>——'
            '<span class="kw3">尿の迅速簡易定性検査（トライエージ）</span>、'
            '血中濃度測定、ChEなどの間接指標。</li>'
            '</ol>'),
      point=('□ 国試ポイント：自殺企図患者への対応',
             '<ol>'
             '<li><span class="kw3">急性期は救命が最優先</span>。'
             '<u>精神科的評価は全身状態が安定してから</u>。</li>'
             '<li><span class="kw3">救命後には必ず精神科的評価を行う</span>——'
             '<span class="kw3">自殺企図の既往は最大の自殺リスク因子</span>であり、'
             '<u>「本人が希望しないから」と評価せずに帰宅させない</u>。</li>'
             '<li><span class="kw3">再企図を防ぐ環境調整</span>——'
             '家族への説明、危険物（残薬・農薬）の管理、'
             '<span class="kw">かかりつけ医・保健所・精神科への連携</span>。'
             '本例は<u>3か月前の配偶者との死別</u>という'
             '明確な喪失体験があり、独居ではないものの高リスクである。</li>'
             '<li><span class="kw3">高齢者の自殺</span>は我が国で大きな問題で、'
             '<span class="kw">身体疾患・うつ病・喪失体験・社会的孤立</span>が'
             '主要な背景因子。'
             '<u>農業従事者では農薬という致死性の高い手段が身近にある</u>ことも'
             'リスクを上げる。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">自殺対策基本法</span>、'
             '<span class="kw">ゲートキーパー</span>、'
             '<span class="kw">日本中毒情報センター（中毒110番）への照会</span>。</li>'
             '</ol>')),

    # ------------------------------------------------------------------ NO.15
    Q('118F-72', 94, [],
      _STEM_13 +
      '<u>検査所見</u>：尿所見：淡黄色透明、蛋白（−）、糖（−）、潜血（−）。'
      '血液所見：赤血球502万、Hb 15.1g/dL、Ht 48％、白血球12,400、血小板30万。'
      '血液生化学所見：総蛋白7.3g/dL、アルブミン4.6g/dL、総ビリルビン0.9mg/dL、'
      '直接ビリルビン0.3mg/dL、AST 22U/L、ALT 18U/L、LD 195U/L（基準124〜222）、'
      'ALP 100U/L（基準38〜113）、'
      '<span class="kw">コリンエステラーゼ〈ChE〉40U/L（基準240〜486）</span>、'
      '尿素窒素12mg/dL、クレアチニン0.5mg/dL、血糖240mg/dL、Na 140mEq/L、'
      'K 3.1mEq/L、Cl 101mEq/L。CRP 11mg/dL。'
      '心電図は洞性頻脈でST-T変化は認めない。'
      '胸部エックス線写真で心胸郭比59％（臥位で撮影）。頭部単純CTで異常を認めない。<br>'
      '<strong>この患者のトキシドロームで最も考えられるのはどれか。</strong>',
      [('a', 'コリン作動性', True,
        '<span class="kw3">◯ 正解</span>。'
        '<span class="kw3">絶対的縮瞳・全身の著明な発汗・流涎と嘔吐・けいれん</span>に、'
        '<span class="kw3">ChE 40U/L（基準240〜486）という著明な低下</span>が加わって'
        'コリン作動性で確定する。'
        '<u>ただし厳密には「コリン作動性薬中毒」までで、'
        '有機リンとカーバメイトなどの区別はここでは付かない</u>'
        '（農業という生活歴が有機リンを強く示唆する）。'),
       ('b', '交感神経興奮性', False,
        '<span class="kw4">アドレナリンなどの交感神経興奮性薬では散瞳し、'
        '粘膜の分泌や発汗も低下する</span>'
        '（※発汗は増える型もあるが、本例の縮瞳・流涎とは合わない）。'
        'コカイン・アンフェタミンが代表。'),
       ('c', '鎮静睡眠作用性', False,
        '<span class="kw4">鎮静睡眠薬では、けいれん・縮瞳・発汗はいずれも認められない</span>。'
        '呼吸抑制・低血圧・低体温を伴う「静かな昏睡」になる。'),
       ('d', 'オピオイド作動性', False,
        '<span class="kw3">オピオイドは縮瞳をもたらす</span>点は一致するが、'
        '<span class="kw4">けいれんや発汗は認められない</span>。'
        '<u>縮瞳をきたす2つのトキシドロームを分けるのは、発汗とけいれんの有無</u>。'),
       ('e', 'ヒスタミン作用性', False,
        'H<sub>1</sub>受容体刺激ならアレルギー症状、'
        'H<sub>2</sub>受容体刺激なら胃酸分泌促進をもたらすが、'
        '<span class="kw4">けいれん・縮瞳・発汗は認められない</span>。')],
      '縮瞳＋発汗＋けいれん＋ChE著減＝コリン作動性',
      patho=('□ トキシドローム——物質が分からなくても「毒物群」までは絞れる',
             '<p><span class="kw3">トキシドローム toxidrome</span>は'
             '<span class="kw3">toxic（毒物の）と syndrome を組み合わせた造語</span>で、'
             '<span class="kw3">特定の毒物群が体内に入ったときに生じる'
             '症状のまとまり</span>を指す。'
             '<span class="kw3">作用機序の類似した薬剤は同じトキシドロームを呈する</span>ため、'
             '<u>原因物質そのものが分からなくても、'
             'どの毒物群かを推測する手掛かりになる</u>。</p>' + TOXIDROME_TABLE),
      deep=('□ 縮瞳する2つを分けるのは「発汗とけいれん」',
            '<p>本問で実質的に競合するのは'
            '<span class="kw3">ａ コリン作動性</span>と'
            '<span class="kw3">ｄ オピオイド作動性</span>の2つである——'
            '<u>どちらも縮瞳をきたす</u>からである。'
            '<span class="kw3">分けるのは発汗とけいれん</span>で、'
            '<span class="kw4">オピオイドは「静かに呼吸が止まる」中毒</span>であり'
            '発汗もけいれんも起こさない。</p>'
            '<table class="tb"><tr><th></th>'
            '<th><span class="kw3">コリン作動性</span></th>'
            '<th><span class="kw3">オピオイド作動性</span></th></tr>'
            '<tr><td>瞳孔</td><td><span class="kw3">縮瞳</span></td>'
            '<td><span class="kw3">縮瞳（pinpoint）</span></td></tr>'
            '<tr><td><span class="kw3">発汗</span></td>'
            '<td><span class="kw3">著明</span></td>'
            '<td><span class="kw4">なし</span></td></tr>'
            '<tr><td><span class="kw3">けいれん</span></td>'
            '<td><span class="kw3">あり</span></td>'
            '<td><span class="kw4">なし</span></td></tr>'
            '<tr><td>分泌・腸蠕動</td>'
            '<td><span class="kw3">流涎・気道分泌増加・下痢</span></td>'
            '<td><span class="kw4">腸蠕動は低下（便秘）</span></td></tr>'
            '<tr><td>体温</td><td>上昇しうる</td><td>低下しうる</td></tr>'
            '<tr><td>検査</td><td><span class="kw3">ChE低下</span></td>'
            '<td>尿の薬物スクリーニング</td></tr>'
            '<tr><td>拮抗薬</td>'
            '<td><span class="kw3">アトロピン（＋PAM）</span></td>'
            '<td><span class="kw3">ナロキソン</span></td></tr></table>'
            '<p>なお<span class="kw3">検査所見の中でこの症例を語っているのは'
            'ChE 40U/L（基準240〜486）だけ</span>である。'
            '<u>白血球12,400・CRP 11・血糖240・心胸郭比59％はいずれも'
            '重症の急性期に非特異的に動く値</u>で、'
            '<span class="kw4">大量の数値に目を奪われて1行を見落とすと解けない</span>。'
            'K 3.1という軽度の低K血症も、嘔吐と急性期のストレスで説明できる。</p>'),
      point=('□ 国試ポイント：トキシドロームの使い方',
             '<ol>'
             '<li><span class="kw3">見るのは瞳孔・皮膚（湿潤か乾燥か）・腸蠕動・体温の4点</span>。'
             '<u>この4つだけで5つのトキシドロームは判別できる</u>。</li>'
             '<li><span class="kw3">縮瞳するのはコリン作動性とオピオイド</span>、'
             '<span class="kw3">散瞳するのは抗コリン性と交感神経興奮性</span>。'
             '<span class="kw3">散瞳する2つは「発汗の有無」で分ける</span>——'
             '<span class="kw4">抗コリンは乾燥、交感神経興奮は湿潤</span>'
             '（"dry as a bone"）。</li>'
             '<li><span class="kw3">コリン作動性は有機リンだけではない</span>——'
             '<span class="kw">カーバメイト（殺虫剤）、'
             'ベサコリン・アセチルコリン塩化物（消化管機能亢進薬）、'
             'ネオスチグミン・ジスチグミン・ピリドスチグミン・アンベノニウム'
             '（重症筋無力症治療薬）</span>。'
             '<u>厳密には現時点で確定できるのは「コリン作動性薬中毒」まで</u>。</li>'
             '<li><span class="kw3">ChEは基準240〜486に対して40</span>＝'
             '10分の1以下で、<u>重症のコリンエステラーゼ阻害</u>を示す。</li>'
             '<li>関連する発展知識：'
             '<span class="kw">セロトニン症候群（発熱・自律神経症状・'
             '腱反射亢進とクローヌス）</span>と'
             '<span class="kw">悪性症候群（発熱・鉛管様筋強剛・CK上昇）</span>——'
             '<u>薬剤性の症候群としてトキシドロームと並べて整理する</u>。</li>'
             '</ol>')),
]

SECTIONS = [
    ('s1', '化学テロ（連問 NO.10〜12）', '', 0),
    ('s2', '自殺企図（連問 NO.13〜15）', '', 3),
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


CH_NUM = 3
CH_NAME = '農薬中毒'


def emit():
    src = SRC_HEAD.read_text(encoding='utf-8')
    head = src[:src.index('<body>')]
    head = head.replace('MEC精神科 第1章 精神科の基本 解答解説',
                        f'MEC中毒・職業病 第{CH_NUM}章 {CH_NAME} 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#65A30D')
                .replace('--orl:#FCE4EC', '--orl:#ECFCCB')
                .replace('--ord:#880E4F', '--ord:#365314'))

    n_hisshu = sum(1 for q in QUESTIONS if any(c == 'bh' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MEC \'26 | 中毒・職業病</div>'
        f'<h1>第<span>{CH_NUM}</span>章｜{CH_NAME}</h1>'
        f'<div class="hs">解答・解説集 全{len(QUESTIONS)}問収録</div>'
        f'<div class="hst"><div class="sp"><strong>{len(QUESTIONS)}</strong>問</div>'
        f'<div class="sp"><strong>必修</strong> {n_hisshu}問</div>'
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
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(''.join(parts), encoding='utf-8')
    print(f'-> {OUT.name}  {len(QUESTIONS)}q (hisshu {n_hisshu}, img {n_img})  '
          f'{OUT.stat().st_size//1024}KB')


if __name__ == '__main__':
    emit()
