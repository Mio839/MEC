# -*- coding: utf-8 -*-
"""
耳鼻咽喉科 第4章「鼻・口・唾液腺①：鼻・口・唾液腺の基本」(NO.99-101) の章別HTML
(耳鼻咽喉科/ch04_hana_kihon.html)を生成する。
_work/新科目HTML生成ガイド.md の品質基準に従い、build_ent_ch01〜03.py と同方式。

問題文・選択肢はPDF(MECマイナー講座・耳鼻咽喉科 耳Q-62〜63／PDF p.65-66)を書き起こし、
正解/正答率/種別は巻末解答一覧表(PDF p.137-141) を x 座標で列に切って読んだもの。
解説はPDFに無いため国試標準知識に基づき執筆（医学的正確性は要ユーザー確認）。

全3問（entで最小の章）。画像は1問1枚（NO.101の顔面裂創シェーマ）。
セクションは A問題(★)=NO.99／B問題(★)=NO.100-101（SECTIONS の idx は 0/1）。
★問題は3問すべて。採点除外・正答率なしの問題は無い。

⚠️ NO.100 の episode は巻末解答一覧表の表記に合わせて `112E-26／106H-15類` とする。
   表のセルが `112E-26／` / `106H-15類` の2行で、「類」で切れている（本文は「類題」）。
   verify_ent_ch.py は解答一覧表と突合するので、表側の文字列を正本にする。

⚠️ NO.101(103D-8) は本章唯一の難問（正答率32%）。頰部の裂創で切れるのは
   **耳下腺管（Stenon管）**。顔面神経の枝（側頭枝・下顎縁枝）は走行の高さが違う。
"""
from pathlib import Path

BASE = Path(r'C:\Users\coool\Desktop\MEC')
SRC_HEAD = BASE / '精神科' / 'ch01_seishinka_kihon.html'
OUT = BASE / '耳鼻咽喉科' / 'ch04_hana_kihon.html'

# この章の先頭問題のPDF通し番号（NO.）。Q番号・カードidはこれを基点にする。
Q_START = 99

# 5択決め打ちにしない（ガイド§4）。ent は NO.19 が a〜g の7択。
FW = {'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ', 'f': 'ｆ', 'g': 'ｇ'}


def rcls(r):
    return 'ch' if r >= 80 else ('cm' if r >= 60 else 'cl')


def Q(id, rate, badges, qt, choices, ans_sub, patho=None, deep=None, point=None,
      imgs=None, ans_label=None):
    imgs = imgs or []
    # 📷バッジ(bi)と imgs は必ず対（ガイド§4）。手書きの取りこぼしを防ぐため自動で付ける。
    badges = list(badges)
    if imgs and not any(c == 'bi' for c, _ in badges):
        badges.append(('bi', '📷'))
    return dict(id=id, rate=rate, badges=badges, qt=qt, choices=choices, ans_sub=ans_sub,
                patho=patho, deep=deep, point=point, imgs=imgs, ans_label=ans_label)


QUESTIONS = []

# ============================================================
# A問題（★問題） NO.99
# ============================================================
QUESTIONS += [

Q('117C-23', 79, [('bs', '★')],
  '<strong>上顎洞が開口するのはどこか。</strong>',
  [('a', '嗅　裂', False,
    '<span class="kw4">鼻中隔と中鼻甲介の間の細い隙間</span>で、'
    '<span class="kw4">嗅上皮が張る「においの通り道」</span>。'
    'ここに副鼻腔の自然口は開かない。嗅裂が鼻茸や粘膜腫脹で塞がると'
    '<span class="kw4">嗅覚障害（呼吸性嗅覚障害）</span>が起こる。'),
   ('b', '上鼻道', False,
    '<span class="kw4">後部篩骨洞（後篩骨蜂巣）が開く</span>場所。'
    'なお<span class="kw4">蝶形骨洞は上鼻道ではなく、その後上方の蝶篩陥凹に開く</span>。'
    '「後ろの副鼻腔は後ろ・上に開く」と覚える。'),
   ('c', '中鼻道', True,
    '<span class="kw3">◯ 上顎洞・前部篩骨洞・前頭洞の3つがそろって開く「副鼻腔の玄関」</span>。'
    '中鼻甲介を持ち上げると<span class="kw3">半月裂孔</span>という溝があり、'
    'その前上方の<span class="kw3">篩骨漏斗</span>へ上顎洞の自然口が開く。'
    'この一帯を<span class="kw3">OMC（ostiomeatal complex／自然口・鼻道複合体）</span>と呼び、'
    '<span class="kw3">副鼻腔炎の治療（内視鏡下鼻副鼻腔手術）はここを開けることが目的</span>になる。'),
   ('d', '下鼻道', False,
    '<span class="kw4">鼻涙管が開く</span>場所（Hasner弁）。副鼻腔の開口はない。'
    '涙が鼻に流れるのはこの経路で、'
    '<span class="kw4">先天性鼻涙管閉塞では下鼻道側の出口が開通していない</span>。'
    '上顎洞穿刺・洗浄で針を刺すのも下鼻道だが、それは'
    '<span class="kw4">「骨壁が薄いから穿刺しやすい」だけで自然口ではない</span>。'),
   ('e', '上咽頭', False,
    '<span class="kw4">耳管咽頭口が開く</span>場所。中耳（乳突蜂巣・鼓室）の含気路であって、'
    '副鼻腔とは別系統である。')],
  '上顎洞・前部篩骨洞・前頭洞は中鼻道（半月裂孔〜篩骨漏斗）に開口する。',
  patho=('👃 副鼻腔の自然口——「どこに開くか」が炎症の広がり方を決める',
         '<span class="kw3">副鼻腔は上顎洞・前頭洞・篩骨洞・蝶形骨洞の4つ</span>で、'
         'いずれも<span class="kw3">細い自然口（ostium）1本だけで鼻腔とつながった袋</span>である。'
         '内面は<span class="kw3">線毛上皮</span>で覆われ、'
         '粘液は線毛運動によって<span class="kw3">つねに自然口へ向かって掃き出されている</span>。<br>'
         '<span class="kw">上顎洞の自然口は洞の「底」ではなく「天井近くの内側壁」にある</span>——'
         'つまり<span class="kw">重力に逆らって上へ排出している</span>。'
         'だから線毛が止まる（ウイルス感染・喫煙）か、'
         '自然口が腫れて塞がる（アレルギー・鼻茸）だけで、'
         '<span class="kw">洞内に分泌物が溜まり細菌が増える＝副鼻腔炎</span>になる。<br>'
         '<span class="kw4">前頭洞・前部篩骨洞・上顎洞の3つは中鼻道という同じ狭い場所に集まって開く</span>。'
         'この一帯（OMC）が塞がると<span class="kw4">3つの洞がまとめて炎症を起こす</span>ので、'
         '副鼻腔炎は「上顎洞だけ」ではなく複数洞が同時に曇ることが多い。'),
  deep=('📌 開口部の一覧——国試はここを表で問う',
        '<table class="tb"><tr><th>開口する場所</th><th>開くもの</th><th>臨床での意味</th></tr>'
        '<tr><td><span class="kw3">中鼻道</span></td>'
        '<td><span class="kw3">上顎洞・前部篩骨洞・前頭洞</span></td>'
        '<td><span class="kw3">OMC。副鼻腔炎の主戦場。膿性鼻汁を見る場所</span></td></tr>'
        '<tr><td><span class="kw">上鼻道</span></td><td><span class="kw">後部篩骨洞</span></td>'
        '<td>後部の炎症は眼窩尖・視神経に近い</td></tr>'
        '<tr><td><span class="kw">蝶篩陥凹</span></td><td><span class="kw">蝶形骨洞</span></td>'
        '<td>頭蓋底・海綿静脈洞に接する。頭痛で発症</td></tr>'
        '<tr><td><span class="kw">下鼻道</span></td><td><span class="kw">鼻涙管</span></td>'
        '<td>副鼻腔は開かない。上顎洞穿刺の入口</td></tr>'
        '<tr><td>嗅裂</td><td>（開口なし・嗅上皮）</td><td>塞がると呼吸性嗅覚障害</td></tr>'
        '<tr><td>上咽頭</td><td>耳管咽頭口</td><td>中耳の含気路。滲出性中耳炎</td></tr></table>'
        '<span class="kw3">「膿性鼻汁が中鼻道にあれば急性副鼻腔炎」</span>という所見（本章 NO.104・109・127）は、'
        'この開口部の解剖がそのまま診断根拠になっている。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①上顎洞・前部篩骨洞・前頭洞＝中鼻道</span>。まずこの3つを一息で言えるようにする。<br>'
         '<span class="kw">②後部篩骨洞＝上鼻道、蝶形骨洞＝蝶篩陥凹、鼻涙管＝下鼻道</span>。<br>'
         '<span class="kw">③上顎洞の自然口は上方にあり、排泄は重力に逆らう</span>——'
         'だから貯留しやすく、副鼻腔炎で最初に曇る。<br>'
         '<span class="kw">④OMCを開けるのが内視鏡下鼻副鼻腔手術（ESS）の目的</span>（本章 NO.106・128）。<br>'
         '<span class="kw">⑤中鼻道の膿性鼻汁＝急性副鼻腔炎の他覚所見</span>。'),
  ),

]

# ============================================================
# B問題（★問題） NO.100-101
# ============================================================
QUESTIONS += [

Q('112E-26／106H-15類', 88, [('bs', '★'), ('bh', '必修')],
  '<strong>成人の口腔内を舌圧子とペンライトとを用いて診察する際、視認できるのはどれか。</strong>',
  [('a', '顎下腺', False,
    '<span class="kw4">顎下三角（下顎骨の下・内側）にある腺で、口腔内からは見えない</span>。'
    '診察は<span class="kw4">口腔内と外の双手診（bimanual）で触れる</span>のが基本。'
    '口腔内から見えるのは<span class="kw4">導管の出口＝舌下小丘（Wharton管開口部）</span>だけである。'),
   ('b', '舌小帯', True,
    '<span class="kw3">◯ 舌を挙上させれば舌下面の正中に張るヒダとして直視できる</span>。'
    '舌小帯の両側には<span class="kw3">舌下小丘（顎下腺・舌下腺の開口部）</span>があり、'
    'ここも見える。<span class="kw3">舌小帯短縮症（強直症）</span>は'
    '新生児の哺乳や構音の評価でこの部位を見て診断する。'),
   ('c', '甲状腺', False,
    '<span class="kw4">頸部前面の気管前にあり、口腔からは見えない</span>。'
    '視診・触診は<span class="kw4">頸部から、嚥下で挙上するかを見る</span>。'
    '例外的に口腔（舌根）に見えるのは<span class="kw4">舌甲状腺（異所性甲状腺）</span>だが、'
    'これは正常構造ではない。'),
   ('d', '咽頭扁桃', False,
    '<span class="kw4">アデノイド＝上咽頭の天井にあるリンパ組織</span>で、'
    '<span class="kw4">口を開けても軟口蓋の裏に隠れて見えない</span>。'
    '観察には<span class="kw4">後鼻鏡・鼻咽腔ファイバー、あるいは側面エックス線</span>が要る。'
    '口を開けて左右に見えるのは<span class="kw4">口蓋扁桃</span>である。'),
   ('e', '下咽頭梨状陥凹', False,
    '<span class="kw4">喉頭の左右にある食物の通り道で、喉頭蓋よりさらに下</span>。'
    '<span class="kw4">間接喉頭鏡か喉頭ファイバー</span>でなければ見えない。'
    '下咽頭癌の好発部位であり、'
    '<span class="kw4">「見えない場所だからこそ発見が遅れる」</span>ことが臨床的に重要。')],
  '舌を挙上すれば舌小帯・舌下小丘は直視できる。顎下腺・甲状腺・咽頭扁桃・梨状陥凹は口腔からは見えない。',
  patho=('👄 舌圧子とペンライトで「どこまで見えるか」を決めておく',
         '<span class="kw3">口腔の視診で見えるのは、口唇・頰粘膜・歯肉・硬口蓋・軟口蓋・口蓋垂・'
         '口蓋扁桃・中咽頭後壁・舌（背面と下面）まで</span>である。'
         'この範囲を<span class="kw3">「口峡から前」</span>と押さえておくとよい。<br>'
         '<span class="kw">導管の開口部は見えるが、腺そのものは見えない</span>のがポイント。'
         '<span class="kw">耳下腺管（Stenon管）は上顎第二大臼歯の対面の頰粘膜</span>に、'
         '<span class="kw">顎下腺管（Wharton管）は舌小帯の両側の舌下小丘</span>に開く。'
         '流行性耳下腺炎や唾石症では、この開口部の発赤・排膿・唾液の流出を見て診断する。<br>'
         '<span class="kw4">上咽頭（咽頭扁桃・耳管咽頭口）と下咽頭・喉頭は口腔からは死角</span>になる。'
         '見るには<span class="kw4">鼻咽腔・喉頭ファイバー</span>が必要で、'
         'これが<span class="kw4">「主訴が咽頭違和感でも、口を開けただけでは癌を否定できない」</span>という'
         '耳鼻咽喉科の基本姿勢につながる。'),
  deep=('📌 口を開けて「見える／見えない」',
        '<table class="tb"><tr><th></th><th>構造</th><th>見るための道具</th></tr>'
        '<tr><td><span class="kw3">見える</span></td>'
        '<td><span class="kw3">舌小帯・舌下小丘・口蓋扁桃・口蓋垂・軟口蓋・'
        '中咽頭後壁・頰粘膜（Stenon管開口部）</span></td>'
        '<td><span class="kw3">舌圧子＋ペンライト</span></td></tr>'
        '<tr><td><span class="kw">見えない（上）</span></td>'
        '<td><span class="kw">咽頭扁桃（アデノイド）・耳管咽頭口・後鼻孔</span></td>'
        '<td><span class="kw">後鼻鏡・鼻咽腔ファイバー</span></td></tr>'
        '<tr><td><span class="kw">見えない（下）</span></td>'
        '<td><span class="kw">喉頭蓋・声帯・梨状陥凹</span></td>'
        '<td><span class="kw">間接喉頭鏡・喉頭ファイバー</span></td></tr>'
        '<tr><td>見えない（外）</td><td>顎下腺・耳下腺本体・甲状腺</td>'
        '<td>頸部の視診／触診（双手診）・超音波</td></tr></table>'
        '<span class="kw3">Waldeyer咽頭輪</span>のうち口から見えるのは'
        '<span class="kw3">口蓋扁桃と舌扁桃（一部）だけ</span>で、'
        '<span class="kw3">咽頭扁桃と耳管扁桃は見えない</span>——この対比が出題の軸になる。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①舌を挙上させれば舌小帯・舌下小丘（Wharton管開口部）が見える</span>。<br>'
         '<span class="kw">②腺本体は見えず、開口部だけが見える</span>（顎下腺・耳下腺）。<br>'
         '<span class="kw">③咽頭扁桃＝アデノイドは上咽頭で、口からは見えない</span>。'
         '見えるのは口蓋扁桃。<br>'
         '<span class="kw">④梨状陥凹・声帯は喉頭ファイバーの領分</span>。<br>'
         '<span class="kw">⑤舌圧子は舌の前2/3を押さえる</span>——'
         '舌根を押すと咽頭反射で嘔吐させてしまう。'),
  ),

Q('103D-8', 32, [('bs', '★')],
  '右頰部の筋肉に達する裂創の図を示す。<br>'
  '<strong>損傷されている可能性が高いのはどれか。</strong>',
  [('a', '舌咽神経', False,
    '<span class="kw4">頸静脈孔から出て咽頭・舌根へ向かう脳神経で、顔面の皮下は通らない</span>。'
    '外からの裂創で切れることはまずない。'
    '障害されると<span class="kw4">咽頭反射消失・舌後1/3の味覚障害</span>が出る。'),
   ('b', '顔面神経側頭枝', False,
    '<span class="kw4">頰骨弓を越えて前額へ上がる枝</span>で、走行は'
    '<span class="kw4">図の裂創よりずっと上方（こめかみ側）</span>。'
    '損傷すると<span class="kw4">前額のしわ寄せができなくなる</span>。'),
   ('c', '顔面神経下顎縁枝', False,
    '<span class="kw4">下顎骨の下縁に沿って口角下制筋へ向かう枝</span>で、'
    '走行は<span class="kw4">図の裂創より下方（下顎縁）</span>。'
    '損傷すると<span class="kw4">口角が下がらず、笑うと口が引きつれる</span>。'
    '頸部郭清や顎下腺摘出で最も注意される枝でもある。'),
   ('d', '耳下腺管（Stenon 管）', True,
    '<span class="kw3">◯ 耳珠と「鼻翼〜口角の中点」を結んだ線のほぼ中央1/3を走る</span>。'
    '図の裂創は<span class="kw3">まさにこの線上（頰部のほぼ中央、咬筋の前縁付近）</span>にあり、'
    '<span class="kw3">咬筋の上を前走して頰筋を貫き、上顎第二大臼歯の対面に開口する</span>。'
    '筋層に達する裂創なら管が断裂している可能性が高く、'
    '見逃すと<span class="kw3">唾液瘻・唾液囊胞</span>を作るため、'
    '<span class="kw3">開口部からの唾液流出や色素・生食の注入で連続性を確認し、'
    'カテーテルを入れて端々吻合する</span>。'),
   ('e', '顎下腺管（Wharton 管）', False,
    '<span class="kw4">口腔底（舌下部）を前走して舌下小丘に開く</span>。'
    '<span class="kw4">口の中の構造なので、頰部の外傷では損傷しない</span>。'
    '口腔底の外傷や唾石症で問題になる管である。')],
  '頰部中央（耳珠—鼻翼/口角中点の線上）を走るのは耳下腺管（Stenon管）。筋層に達する裂創では断裂を疑う。',
  imgs=['images/103D-8_1.jpeg'],
  patho=('💧 耳下腺管（Stenon管）——頰の「体表投影線」を覚えているかを問う問題',
         '<span class="kw3">耳下腺は耳前部から下顎枝の外側に広がる大唾液腺</span>で、'
         'その導管である<span class="kw3">耳下腺管は腺の前縁から出て咬筋の表面を前方に走り、'
         '咬筋の前縁で直角に内側へ曲がって頰筋を貫き、'
         '上顎第二大臼歯に向かい合う頰粘膜に開口する</span>。<br>'
         '<span class="kw">体表では「耳珠」と「鼻翼と口角の中点」を結ぶ線の中1/3</span>——'
         'つまり<span class="kw">頰のほぼ真ん中を水平に走る</span>と投影される。'
         '図の裂創はこの線に一致しており、'
         '<span class="kw">「筋肉（咬筋・頰筋）に達する」深さ</span>である以上、'
         '皮下を走る管が無傷であるとは考えにくい。<br>'
         '<span class="kw4">耳下腺管には顔面神経の頰筋枝が並走する</span>ため、'
         '実際には<span class="kw4">管損傷と頰筋枝麻痺は合併しやすい</span>。'
         'ただし選択肢に挙がっている側頭枝・下顎縁枝は'
         '<span class="kw4">走行の高さがこの裂創と合わない</span>ので、答えは管になる。'),
  deep=('📌 顔面の外傷で「どこを切ると何が切れるか」',
        '<table class="tb"><tr><th>部位</th><th>走る構造</th><th>損傷したときの所見</th></tr>'
        '<tr><td><span class="kw">こめかみ〜眉外側</span></td>'
        '<td><span class="kw">顔面神経側頭枝</span></td><td>前額のしわが寄らない</td></tr>'
        '<tr><td><span class="kw3">頰の中央（耳珠—鼻翼/口角中点線）</span></td>'
        '<td><span class="kw3">耳下腺管＋顔面神経頰筋枝</span></td>'
        '<td><span class="kw3">創から唾液が漏れる・唾液囊胞／頰のふくらませ不能</span></td></tr>'
        '<tr><td><span class="kw">下顎縁</span></td><td><span class="kw">顔面神経下顎縁枝</span></td>'
        '<td>口角が下がらない（笑顔の非対称）</td></tr>'
        '<tr><td>耳前部（耳下腺内）</td><td>顔面神経本幹</td>'
        '<td>同側顔面全体の麻痺（末梢性）</td></tr></table>'
        '<span class="kw3">耳下腺管損傷を疑ったら、口腔内の開口部から生理食塩水や色素を注入して'
        '創部に漏れるかを見る</span>。'
        '<span class="kw3">確認せずに皮膚だけ縫うと、後日唾液瘻になって難治化する</span>——'
        'これが「筋肉に達する裂創」とわざわざ書いてある理由である。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①耳下腺管の体表投影＝耳珠と「鼻翼と口角の中点」を結ぶ線の中1/3</span>。<br>'
         '<span class="kw">②開口部は上顎第二大臼歯の対面の頰粘膜</span>'
         '（顎下腺管は舌下小丘）。<br>'
         '<span class="kw">③頰部の深い裂創では耳下腺管と顔面神経頰筋枝の損傷を必ず確認する</span>。<br>'
         '<span class="kw">④側頭枝は頰骨弓の上、下顎縁枝は下顎の下</span>——高さで除外できる。<br>'
         '<span class="kw">⑤放置すると唾液瘻・唾液囊胞。修復はカテーテル留置下の端々吻合</span>。'
         '本問の正答率は32%で、本章で唯一の難問である。'),
  ),

]

SECTIONS = [
    ('s1', 'A問題（★問題）', '', 0),
    ('s2', 'B問題（★問題）', '', 1),
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
                        'MEC耳鼻咽喉科 第4章 鼻・口・唾液腺①：鼻・口・唾液腺の基本 解答解説')
    head = (head.replace('--or:#C2185B', '--or:#0F766E')
                .replace('--orl:#FCE4EC', '--orl:#CCFBF1')
                .replace('--ord:#880E4F', '--ord:#134E4A'))

    n_star = sum(1 for q in QUESTIONS if any(c == 'bs' for c, _ in q['badges']))
    n_img = sum(1 for q in QUESTIONS if q['imgs'])
    parts = [head, '\n<body>\n<div id="pb"></div>']
    parts.append(
        '<div class="ph"><div class="hb">MECマイナー講座 \'26 | 耳鼻咽喉科</div>'
        '<h1>第<span>4</span>章｜鼻・口・唾液腺①：鼻・口・唾液腺の基本</h1>'
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
