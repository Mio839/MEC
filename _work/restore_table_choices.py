# -*- coding: utf-8 -*-
"""選択肢データが欠落した残り14問を復元する（冪等・--dry-run あり）。

■ 背景
選択肢0個の問題は62問あり、うち48問は計算問題（calc_input.js の桁入力で解決済み）。
残る14問がこれ。2026-07-26 の `extract_missing_choices.py` は PDF のテキスト順で
選択肢を切り出す方式のため、この14問は全て「選択肢を切り出せない（表・図の可能性）」で
弾かれていた。実際に中身を見ると2種類ある。

  (A) 選択肢が表・図の11問 …… PDFのテキスト抽出では列の対応が崩れる。
      ユーザーがスクリーンショットを撮り、それを目視で読んで書き起こした（2026-07-28）。
      → `_work/新科目HTML生成ガイド.md` §1 の「選択肢が表になっている問題」の手順。
  (B) カードの中身が別問題の紙面から作られていた3問（118C15・119E7・119E14）……
      qt に隣の問題の check point の表がまるごと入り、設問文・選択肢が失われていた。
      data-rate と正解の肢は正しかったので、それを手掛かりにPDFの該当問題を特定し復元した。
      119E14 は解説（eg）まで別問題（《処方箋》）のものが入っていたので差し替える。

■ 正しさの根拠
書き起こした選択肢は、既存の ans_label / ac が指す肢と表の行が一致することで検証している
（例 120F14 は ans=d で、表のd行だけが「禁煙成功者一人あたりの費用」最小＝費用対効果最大）。
(B)の3問は data-rate と正解の肢の2つがPDFの該当ページと一致することを確認済み。

■ 整形について
questions_*.json は「書き戻しで整形を変えない」のが原則（1問直しただけで全行差分になる）。
このスクリプトは JSON を読み書きせず、`"choices": []` の1か所だけを文字列置換する。
CRLF・indent=1 という既存の体裁をそのまま再現する。

使い方:
  python _work/restore_table_choices.py --dry-run
  python _work/restore_table_choices.py
"""
import sys, os, io, json, re

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAK = os.path.join(BASE, '国家試験過去問')
FULL = 'ａｂｃｄｅｆ'
SEP = '　'          # 選択肢ラベルの直後は全角空白（既存データと同じ）


def lbl(i, text):
    return f'{FULL[i]}{SEP}{text}'


# ══════════════════════════════════════════════════════════════════
# 選択肢データ（ok は正解の肢のインデックス）
# ══════════════════════════════════════════════════════════════════

JSON_TARGETS = [
    dict(
        file='questions_circ.json', uid='circ_ch01_q24',
        # 103E-15。心周期の図中 a〜e の位置を選ぶ。位置の意味は図の実線から読める:
        # a=左房圧a波（心房収縮期）/ b=左室圧の立ち上がり（僧帽弁閉鎖）/
        # c=大動脈圧の切痕（大動脈弁閉鎖）/ d=左室圧が左房圧まで低下（僧帽弁開放）/
        # e=その直後の急速流入期 ＝ ans_label「ｅ（急速流入期・僧帽弁開放直後）」と一致
        ok=4,
        choices=['図中 a（心房収縮期・左房圧a波の時期）',
                 '図中 b（等容性収縮期の始まり・僧帽弁閉鎖）',
                 '図中 c（等容性弛緩期の始まり・大動脈弁閉鎖）',
                 '図中 d（僧帽弁開放の時点・左室圧＝左房圧）',
                 '図中 e（急速流入期・僧帽弁開放直後）'],
    ),
    dict(
        file='questions_jinzo_d.json', uid='jinzo_d_ch03_q136',
        ok=3,   # ans_label「ｄ　①ウ・②ア・③イ」と一致（下で厳密照合する）
        choices=['①ア・②イ・③ウ', '①ア・②ウ・③イ', '①イ・②ア・③ウ',
                 '①ウ・②ア・③イ', '①ウ・②イ・③ア'],
    ),
]

HTML_TARGETS = [
    dict(
        file='第116回/116D_kakuron.html', uid='kakumon_116D_q1', ok=2,
        choices=['夫RhD（－）／間接Coombs 12週 －・26週 －／出産児RhD（－）',
                 '夫RhD（＋）／間接Coombs 12週 －・26週 －／出産児RhD（－）',
                 '夫RhD（＋）／間接Coombs 12週 －・26週 －／出産児RhD（＋）',
                 '夫RhD（＋）／間接Coombs 12週 －・26週 ＋／出産児RhD（＋）',
                 '夫RhD（＋）／間接Coombs 12週 ＋・26週 ＋／出産児RhD（＋）'],
    ),
    dict(
        file='第117回/117F_kakuron.html', uid='kakumon_117F_q16', ok=0,
        choices=['Child A／最大径4cm／4個／肝外転移なし／門脈本幹閉塞なし',
                 'Child A／最大径4cm／4個／肝外転移あり／門脈本幹閉塞なし',
                 'Child B／最大径4cm／4個／肝外転移なし／門脈本幹閉塞あり',
                 'Child B／最大径4cm／4個／肝外転移あり／門脈本幹閉塞なし',
                 'Child C／最大径4cm／4個／肝外転移なし／門脈本幹閉塞なし'],
        # qt が表と解説を丸ごと飲み込んでいたので設問文だけに戻し、
        # 飲み込まれていた着目point・選択肢考察は eg の正しい位置へ移す
        qt='肝細胞癌に対し<strong>肝動脈化学塞栓療法が行われるのはどれか。</strong>',
        eg_ept='肝細胞癌の治療アルゴリズムを問う問題。門脈本幹閉塞については注意して学習し<br>'
               'ていただろうが、肝外転移については意識が向いていなかった受験生もいただろう。<br>'
               '今後の国試対策として、肝動脈化学塞栓療法と肝動脈動注化学療法を混同しないよう<br>'
               'にしよう。なお〔選択肢ａ〕は肝予備能がChild B でも正答となる。',
        eg_ee='<div style="color:var(--gr);margin-bottom:3px">○ａ</div>'
              '<div style="color:var(--ts);margin-bottom:3px">×ｂ　×ｃ　×ｄ　×ｅ</div>'
              '<div>選択肢は腫瘍径と腫瘍個数が同じであるので、Child-Pugh 分類、肝外転移の<br>'
              '有無、門脈本幹閉塞（門脈腫瘍塞栓）の3 点から判断する。肝動脈化学塞栓療<br>'
              '法は肝細胞癌に対する局所療法であり、肝外転移があるものは適応外となる。<br>'
              'また、門脈本幹に閉塞がある症例では肝動脈化学塞栓療法で肝予備能が急激に<br>'
              '悪化する可能性が大きい。</div>',
    ),
    dict(
        file='第117回/117F_kakuron.html', uid='kakumon_117F_q74', ok=4,
        # ⚠️ この問題だけ a〜f の6択（表が6行ある）
        choices=['Na 0／K 0／ブドウ糖 5％', 'Na 0／K 20／ブドウ糖 5％',
                 'Na 77／K 0／ブドウ糖 2.5％', 'Na 77／K 20／ブドウ糖 2.5％',
                 'Na 154／K 0／ブドウ糖 0％', 'Na 154／K 20／ブドウ糖 0％'],
        qt_append='<br>（Na・K：mEq/L）',
    ),
    dict(
        file='第118回/118C_kakuron.html', uid='kakumon_118C_q15', ok=4,
        # (B) qt に隣の問題(118C18)の check point の表が入っていた。PDF p.312 から復元
        qt='<strong>地域医療支援病院に求められる機能はどれか。</strong>',
        choices=['高度医療技術の開発', '地域住民の栄養改善', '質の高い臨床研究の主導',
                 '難病患者の療養生活支援', '地域の医療従事者に対する研修'],
        eg_ept='地域医療支援病院はしばしば出題される（114F-31、111G-24 など）が、〔選択肢ｅ〕<br>'
               'は国試未出題の内容である。基本的な機能であり、今後の国試対策として確実に押さ<br>'
               'えておきたい。〔選択肢ａ、ｃ〕は特定機能病院と臨床研究中核病院の機能であり、<br>'
               '地域医療支援病院とよく比較されるため整理しておこう。',
        eg_ee='<div style="color:var(--ts);margin-bottom:3px">×ａ　高度医療技術の開発は特定機能病院に求められる。</div>'
              '<div style="color:var(--ts);margin-bottom:3px">×ｂ　地域住民の栄養改善は医療ではなく保健の一つであり、公衆衛生活動として行われる。</div>'
              '<div style="color:var(--ts);margin-bottom:3px">×ｃ　臨床研究の主導は臨床研究中核病院に求められる。</div>'
              '<div style="color:var(--ts);margin-bottom:3px">×ｄ　難病患者の療養生活支援は一般的な医療機関および福祉施設などによって広く行われる。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｅ　地域の医療従事者に対する研修は地域医療支援病院に求められる主要な機能の一つである。</div>',
        eg_replace='<div style="margin-bottom:6px"><strong style="color:var(--nv)">《地域医療支援病院》</strong><br>'
                   '平成9 年の医療法改正に伴い、患者が身近な地域で医療を受けられることが望まし<br>'
                   'いという観点のもと設置された。地域の病院や診療所、かかりつけ医などを後方支援<br>'
                   'する目的がある。具体的な目的を以下に挙げる。<br>'
                   '・地域におけるかかりつけ医やかかりつけ歯科医の支援<br>'
                   '・紹介患者への医療提供（かかりつけ医などへの逆紹介も含む）<br>'
                   '・施設・設備の共同利用や開放<br>'
                   '・救急医療の提供<br>'
                   '・地域の医療従事者に対する研修の実施</div>',
    ),
    dict(
        file='第118回/118D_kakuron.html', uid='kakumon_118D_q35', ok=2,
        choices=['Na 130／K 4／Cl 109／Lactate 28／ブドウ糖 5.0％',
                 'Na 90／K 0／Cl 70／Lactate 20／ブドウ糖 2.6％',
                 'Na 75／K 0／Cl 75／Lactate 0／ブドウ糖 2.5％',
                 'Na 35／K 20／Cl 35／Lactate 20／ブドウ糖 4.3％',
                 'Na 0／K 0／Cl 0／Lactate 0／ブドウ糖 5.0％'],
        qt_append='<br>（Na⁺・K⁺・Cl⁻・Lactate⁻：mEq/L）',
    ),
    dict(
        file='第118回/118D_kakuron.html', uid='kakumon_118D_q63', ok=0,
        choices=['pH 7.22／PCO2 35／HCO3⁻ 14／Na 140／K 4.3／Cl 105',
                 'pH 7.25／PCO2 40／HCO3⁻ 17／Na 139／K 4.3／Cl 110',
                 'pH 7.22／PCO2 76／HCO3⁻ 31／Na 138／K 4.3／Cl 99',
                 'pH 7.38／PCO2 42／HCO3⁻ 24／Na 137／K 3.8／Cl 102',
                 'pH 7.55／PCO2 41／HCO3⁻ 35／Na 135／K 3.0／Cl 87'],
        qt_append='<br>（PCO2：Torr、HCO3⁻・Na・K・Cl：mEq/L）',
    ),
    dict(
        file='第118回/118E_kakuron.html', uid='kakumon_118E_q24', ok=3,
        choices=['炭水化物 35／蛋白質 35／脂質 30',
                 '炭水化物 35／蛋白質 15／脂質 50',
                 '炭水化物 55／蛋白質 35／脂質 10',
                 '炭水化物 55／蛋白質 15／脂質 30',
                 '炭水化物 75／蛋白質 15／脂質 10'],
        qt_append='<br>（単位：％）',
    ),
    dict(
        file='第119回/119A_kakuron.html', uid='kakumon_119A_q40', ok=0,
        choices=['Na 130／K 4／Cl 109／Lactate 28／ブドウ糖 0％',
                 'Na 77.5／K 30／Cl 59／Lactate 48.5／ブドウ糖 0％',
                 'Na 50／K 27／Cl 50／Lactate 14／ブドウ糖 17.5％',
                 'Na 35／K 20／Cl 35／Lactate 20／ブドウ糖 7.5％',
                 'Na 0／K 0／Cl 0／Lactate 0／ブドウ糖 5％'],
        qt_append='<br>（Na⁺・K⁺・Cl⁻・Lactate⁻：mEq/L）',
    ),
    dict(
        file='第119回/119C_kakuron.html', uid='kakumon_119C_q25', ok=2,
        choices=['（ア）リハビリテーション・（イ）バリアフリー・（ウ）ノーマライゼーション',
                 '（ア）リハビリテーション・（イ）ユニバーサルデザイン・（ウ）バリアフリー',
                 '（ア）ノーマライゼーション・（イ）バリアフリー・（ウ）ユニバーサルデザイン',
                 '（ア）ノーマライゼーション・（イ）ユニバーサルデザイン・（ウ）バリアフリー',
                 '（ア）ノーマライゼーション・（イ）リハビリテーション・（ウ）ユニバーサルデザイン'],
    ),
    dict(
        file='第119回/119E_kakuron.html', uid='kakumon_119E_q7', ok=1,
        # (B) qt に隣の問題の check point（脊髄損傷高位とADLの表）が入っていた。PDF p.638 から復元
        qt='医師のプロフェッショナリズムで<strong>誤っているのはどれか。</strong>',
        choices=['科学的根拠を追究する。', '自己の利益を追求する。', '社会のニーズに応える。',
                 '患者の感情に共感を示す。', '医療資源の有限性に配慮する。'],
        eg_ept='医師のプロフェッショナリズムについて、Arnold とStern によるプロフェッショ<br>'
               'ナリズムの定義を中心に選択肢が作られたと考えられるが、その内容を知らずとも、<br>'
               '常識的に解答できる。',
        eg_ee='<div style="color:var(--gr);margin-bottom:3px">○ａ　科学的根拠を追究し、それに基づいた医療を提供することは医師のプロフェッショナリズムに基づく。</div>'
              '<div style="color:var(--ts);margin-bottom:3px">×ｂ　医師のプロフェッショナリズムの背景には社会的使命への貢献があり、自らの利益を追求することはこれに反する。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｃ　社会のニーズに応えることは医師のプロフェッショナリズムに基づく。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｄ　患者の感情に共感を示すことは患者に対する援助者として望ましい態度であり、医師のプロフェッショナリズムに基づく。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｅ　医師のプロフェッショナリズムには有限の医療資源の適正配置に関する責務がある。</div>',
        eg_replace='<div style="margin-bottom:6px"><strong style="color:var(--nv)">《医師に求められる態度》</strong><br>'
                   '<strong>１）社会人として望ましい態度</strong><br>'
                   '・挨拶、身だしなみなどの基本的礼儀作法／適切な敬語の使用／時間、約束の厳守<br>'
                   '・初回診察時には正面を向いて自分の名前を患者に告げる<br>'
                   '<strong>２）患者に対する援助者として望ましい態度</strong><br>'
                   '・共感的態度、傾聴的態度、適切な説明などの医療面接技法<br>'
                   '・インフォームド・コンセント／患者の希望の聴取と尊重<br>'
                   '・プライバシーへの配慮／患者情報の守秘<br>'
                   '<strong>３）医学を学び従事するものとして望ましい態度</strong><br>'
                   '・勉学態度、協調性</div>',
    ),
    dict(
        file='第119回/119E_kakuron.html', uid='kakumon_119E_q14', ok=0,
        # (B) qt も解説も別問題（処方箋の問題）のものが入っていた。
        # data-rate 79.9・正解ａ の2つが PDF p.652「長時間の砕石位」と一致することで同定
        qt='長時間の砕石位による合併症で<strong>誤っているのはどれか。</strong>',
        choices=['視力障害', '下肢の神経損傷', '深部静脈血栓症',
                 '接地部の圧迫性潰瘍', '体位解除後の低血圧'],
        ans_sub='国試初出題のテーマ。砕石位で説明のつかない〔選択肢ａ〕を選ぶ。',
        eg_ept='国試初出題のテーマであり、受験生はその場で考えるしかないが、〔選択肢ｂ～ｅ〕<br>'
               'は論理的にありそうなのに対して、〔選択肢ａ〕は視力に影響するロジックが思い浮<br>'
               'かばないのではないだろうか。ゆえに〔選択肢ａ〕を選ぶ、という解法で十分である。<br>'
               '今後もこのような問題は出題されるだろうが、その場で考えて得点に結びつける姿勢<br>'
               'で取り組むしかない。',
        eg_ee='<div style="color:var(--ts);margin-bottom:3px">×ａ　長時間の腹臥位で顔面が圧迫され続けると、眼球の圧迫による視力障害が生じることがある。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｂ　○ｃ　○ｄ　下肢の長時間の圧迫で生じ得る合併症である。</div>'
              '<div style="color:var(--gr);margin-bottom:3px">○ｅ　砕石位では下肢が挙上されているため、下肢の血液が減少した状態になっている。長時間の砕石位を急に解除すると、下肢に血流が流れ込み、低血圧をきたす。</div>',
        eg_replace='<div style="margin-bottom:6px"><strong style="color:var(--nv)">《診察時の患者の体位》</strong><br>'
                   '一般的に、頭頸部・胸部臓器は座位で、腹部臓器は背臥位（仰臥位）で、骨盤内臓<br>'
                   '器は砕石位で診察することが多い。<br>'
                   '<strong>〈代表的な体位〉</strong><br>'
                   '①立位：腹腔内free air の検出、鼠径ヘルニアの診察、Romberg 試験などに適応。<br>'
                   '②座位：頭頸部の診察、左心不全、慢性閉塞性肺疾患〈COPD〉などで起坐呼吸がある場合に適応。<br>'
                   '③Fowler 位（半座位）：上半身を30～45°起こした体位。呼吸困難、内頸静脈の拍動、'
                   '胃食道逆流症の就寝時などに適応。循環血液量が減少しているときは禁忌である。<br>'
                   '④砕石位：骨盤内臓器の診察・手術に用いる。長時間では下肢の神経損傷・'
                   '深部静脈血栓症・圧迫性潰瘍、解除後の低血圧をきたす。</div>',
    ),
    dict(
        file='第120回/120F_kakuron.html', uid='kakumon_120F_q14', ok=3,
        choices=['参加費用 80,000円／禁煙成功割合 80％／禁煙成功者一人あたり 100,000円',
                 '参加費用 70,000円／禁煙成功割合 90％／禁煙成功者一人あたり 77,778円',
                 '参加費用 50,000円／禁煙成功割合 45％／禁煙成功者一人あたり 111,111円',
                 '参加費用 30,000円／禁煙成功割合 50％／禁煙成功者一人あたり 60,000円',
                 '参加費用 20,000円／禁煙成功割合 25％／禁煙成功者一人あたり 80,000円'],
    ),
]


# ══════════════════════════════════════════════════════════════════
# questions_*.json
# ══════════════════════════════════════════════════════════════════

def patch_json(t, dry):
    path = os.path.join(BASE, t['file'])
    txt = io.open(path, encoding='utf-8', newline='').read()

    i = txt.find(f'"uid": "{t["uid"]}"')
    if i < 0:
        return f'✗ {t["uid"]}: uid が見つからない'
    j = txt.find('"choices": [', i)
    if j < 0:
        return f'✗ {t["uid"]}: choices が見つからない'
    if txt.startswith('"choices": [\r\n', j):
        return f'– {t["uid"]}: 既に選択肢あり（スキップ）'
    if not txt.startswith('"choices": [],', j):
        return f'✗ {t["uid"]}: choices の形が想定外'

    # ans_label と ok の肢が一致するか（正解を取り違えていないかの最終確認）
    m = re.search(r'"ans_label": "(.*?)"', txt[i:i + 4000])
    al = json.loads(f'"{m.group(1)}"') if m else ''
    want = FULL[t['ok']]
    if not al.startswith(want):
        return f'✗ {t["uid"]}: ans_label={al!r} が ok={want} と食い違う'

    arr = [{'t': lbl(k, c), 'ok': (k == t['ok'])} for k, c in enumerate(t['choices'])]
    # 既存の体裁（indent=1・CRLF・"choices" は5字下げ）を再現する
    lines = json.dumps(arr, ensure_ascii=False, indent=1).split('\n')
    body = '\r\n'.join([lines[0]] + ['     ' + ln for ln in lines[1:]])
    new = f'"choices": {body},'
    txt = txt[:j] + new + txt[j + len('"choices": [],'):]

    if not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(txt)
    return f'✓ {t["uid"]}: 選択肢{len(arr)}個（正解 {want}）'


# ══════════════════════════════════════════════════════════════════
# 国家試験過去問/*.html
# ══════════════════════════════════════════════════════════════════

def patch_html(t, dry):
    path = os.path.join(KAK, t['file'])
    txt = io.open(path, encoding='utf-8', newline='').read()

    a = txt.rfind('<div class="qc"', 0, txt.find(f'data-uid="{t["uid"]}"'))
    b = txt.find('<div class="qc"', a + 10)
    if a < 0:
        return f'✗ {t["uid"]}: カードが見つからない'
    if b < 0:
        b = len(txt)
    card = txt[a:b]
    if 'class="ch2"' in card:
        return f'– {t["uid"]}: 既に選択肢あり（スキップ）'

    # 正解の肢が ac と一致するか（取り違え防止）
    m = re.search(r'<div class="ac">(.*?)</div>', card, re.S)
    ac = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''
    want_half = 'abcdef'[t['ok']]
    if ac != want_half:
        return f'✗ {t["uid"]}: ac={ac!r} が ok={want_half} と食い違う'

    new = card

    # ① 設問文（壊れているものだけ差し替え／単位の注記だけ足すものもある）
    if t.get('qt'):
        new = re.sub(r'<div class="qt">.*?</div>',
                     lambda _: f'<div class="qt">{t["qt"]}</div>', new, count=1, flags=re.S)
    elif t.get('qt_append'):
        new = re.sub(r'(<div class="qt">.*?)</div>',
                     lambda mm: mm.group(1) + t['qt_append'] + '</div>', new, count=1, flags=re.S)

    # ② 選択肢
    cs = ''.join(
        f'<div class="ch2{" ok" if k == t["ok"] else ""}">{lbl(k, c)}</div>'
        for k, c in enumerate(t['choices']))
    if '<div class="cs"></div>' not in new:
        return f'✗ {t["uid"]}: 空の cs が見つからない'
    new = new.replace('<div class="cs"></div>', f'<div class="cs">{cs}</div>', 1)

    # ③ 正解ラベルを1文字から本文つきへ
    new = new.replace(f'<div class="ac">{want_half}</div>',
                      f'<div class="ac">{lbl(t["ok"], t["choices"][t["ok"]])}</div>', 1)
    if t.get('ans_sub'):
        new = re.sub(r'<div class="as">.*?</div>',
                     lambda _: f'<div class="as">{t["ans_sub"]}</div>', new, count=1, flags=re.S)

    # ④ 解説（着目point → 解説 → 選択肢考察 の順）
    # カードは `…<div class="eg">…</div>(eg)</div>(qb)</div>(qc)` で閉じる。
    # 正規表現で eg の中身を取ろうとすると入れ子の </div> と区別できないので、
    # 「eg の開始位置」と「カード末尾の閉じ3つ」から中身を切り出す。
    if t.get('eg_replace') or t.get('eg_ept') or t.get('eg_ee'):
        OPEN, TAIL = '<div class="eg">', '</div></div></div>'
        s = new.find(OPEN)
        if s < 0 or not new.endswith(TAIL):
            return f'✗ {t["uid"]}: eg の切り出しに失敗（カードの閉じ方が想定外）'
        inner = new[s + len(OPEN):-len(TAIL)]
        if t.get('eg_replace'):
            inner = f'<div class="eb ep"><h4>📖 解説</h4>{t["eg_replace"]}</div>'
        if t.get('eg_ept'):
            inner = f'<div class="eb ept"><h4>🎯 着目point</h4>{t["eg_ept"]}</div>' + inner
        if t.get('eg_ee'):
            inner += f'<div class="eb ep"><h4>📋 選択肢考察</h4>{t["eg_ee"]}</div>'
        new = new[:s] + OPEN + inner + TAIL

    if new == card:
        return f'✗ {t["uid"]}: 変化なし'
    if not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(txt[:a] + new + txt[b:])
    n = len(t['choices'])
    extra = ' ＋設問文復元' if t.get('qt') else ''
    return f'✓ {t["uid"]}: 選択肢{n}個（正解 {FULL[t["ok"]]}）{extra}'


def main():
    dry = '--dry-run' in sys.argv
    print('=== questions_*.json ===')
    for t in JSON_TARGETS:
        print('  ' + patch_json(t, dry))
    print('=== 国家試験過去問 ===')
    for t in HTML_TARGETS:
        print('  ' + patch_html(t, dry))
    if dry:
        print('\n(--dry-run: 書き込みなし)')


if __name__ == '__main__':
    main()
