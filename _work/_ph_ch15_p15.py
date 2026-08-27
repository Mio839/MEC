QUESTIONS += [

Q('114F-22', 94, [],
  '<strong>2 歳の男児の予防接種歴を記載した証明書を以下に示す。</strong><br>'
  '<div class="tb-wrap">IMMUNIZATION RECORD／Date:9 Feb. 2020／Name:Taro Kosei '
  'Date of Birth:17 Jan. 2018<br>'
  'Haemophilus influenzae type b：1st 20 Mar. 2018／2nd 20 Apr. 2018／'
  '3rd 20 May. 2018／4th 20 Jan. 2019<br>'
  'Pneumococcal：1st 20 Mar. 2018／2nd 20 Apr. 2018／3rd 20 May. 2018／'
  '4th 20 Jan. 2019<br>'
  'Hepatitis B Virus：1st 20 Mar. 2018／2nd 20 Apr. 2018／3rd 20 Aug. 2018<br>'
  'DPT-IPV：1st 20 Apr. 2018／2nd 20 May. 2018／3rd 20 Aug. 2018／4th 20 Jan. 2019<br>'
  'BCG：20 Jun. 2018<br>'
  'Measles, Rubella：1st 20 Jan. 2019／2nd（未接種）<br>'
  'Varicella：1st 20 Jan. 2019／2nd 20 Nov. 2019</div>'
  'この男児が予防接種を受けていないのはどれか。',
  [('a', '水　痘', False,
    '<span class="kw4">誤り。証明書のVaricella（水痘）の欄には<u>1st・2ndとも接種'
    '記録がある</u>（2019年1月・2019年11月）——水痘ワクチンは接種済みである</span>。'),
   ('b', '麻　疹', False,
    '<span class="kw4">誤り。証明書のMeasles, Rubella（MR）の欄には<u>1回目の接種'
    '記録がある</u>（2019年1月）——2回目（2期）は未接種だが、1回目は接種済みで'
    'あり「受けていない」わけではない</span>。'),
   ('c', '百日咳', False,
    '<span class="kw4">誤り。百日咳はDPT-IPV（4種混合ワクチン）に含まれ、証明書には'
    '<u>1st〜4thまで4回すべての接種記録がある</u>——接種済みである</span>。'),
   ('d', '肺炎球菌', False,
    '<span class="kw4">誤り。証明書のPneumococcal（肺炎球菌）の欄には<u>1st〜4thまで'
    '4回すべての接種記録がある</u>——接種済みである</span>。'),
   ('e', '流行性耳下腺炎', True,
    '<span class="kw3">◯ 正しい。証明書には<u>おたふくかぜ（流行性耳下腺炎・Mumps）'
    'の接種記録が一切記載されていない</u></span>——<span class="kw3">おたふくかぜ'
    'ワクチンは任意接種であり、証明書に記載されているHib・肺炎球菌・B型肝炎・'
    'DPT-IPV・BCG・MR・水痘はいずれもA類疾病の定期接種として標準的に接種される'
    'ため記録があるのに対し、任意接種であるおたふくかぜワクチンだけが記録に登場して'
    'いない</span>。')],
  '証明書にはHib・肺炎球菌・B型肝炎・4種混合・BCG・MR（1回目）・水痘の接種記録がある'
  'が、任意接種のおたふくかぜワクチンの記録だけがない。',
  patho=('📋 英文の予防接種証明書を「記載の有無」で読み解く',
         '<span class="kw3">本問は英語の予防接種証明書（IMMUNIZATION RECORD）を'
         '読み取り、記載が<u>ない</u>ワクチンを特定する設問である——読み取りの'
         'コツは各ワクチン名の英語表記を和名に対応させ、証明書に記載がある行と'
         'ない行を機械的に照合することにある</span>——<span class="kw">'
         '<u>Haemophilus influenzae type b（Hib）・Pneumococcal（肺炎球菌）・'
         'Hepatitis B Virus（B型肝炎）・DPT-IPV（4種混合）・BCG・Measles, Rubella'
         '（MR）・Varicella（水痘）</u>はすべて記載があり、いずれもA類疾病の定期'
         '接種として標準的に受けているワクチンにあたる</span>。<br>'
         '<span class="kw3">選択肢に挙がる<u>流行性耳下腺垂（おたふくかぜ・Mumps）</u>'
         'だけが証明書のどこにも登場せず、これは任意接種であるために保護者の判断で'
         '接種していない（あるいはまだ受けていない）可能性を示している</span>。'),
  deep=('💡 証明書に載っているワクチンの共通点を見抜く',
        '<span class="kw">証明書に記載されている7種類のワクチンは、いずれもA類疾病の'
        '定期接種という共通点を持つ——この規則性に気づけば、記載のないワクチンが'
        '任意接種のおたふくかぜだと推測しやすくなる。</span><br>'
        '<table class="tb"><tr><th>英語表記</th><th>和名</th><th>区分</th></tr>'
        '<tr><td>Haemophilus influenzae type b</td><td>Hib</td><td>A類</td></tr>'
        '<tr><td>Pneumococcal</td><td>肺炎球菌</td><td>A類</td></tr>'
        '<tr><td>Hepatitis B Virus</td><td>B型肝炎</td><td>A類</td></tr>'
        '<tr><td>DPT-IPV</td><td>4種混合（百日咳含む）</td><td>A類</td></tr>'
        '<tr><td>BCG</td><td>結核</td><td>A類</td></tr>'
        '<tr><td>Measles, Rubella</td><td>MR（麻疹風疹）</td><td>A類</td></tr>'
        '<tr><td>Varicella</td><td>水痘</td><td>A類</td></tr>'
        '<tr><td><span class="kw3">（記載なし）</span></td>'
        '<td><span class="kw3">流行性耳下腺炎（おたふくかぜ）</span></td>'
        '<td><span class="kw3">任意接種</span></td></tr></table>'
        '<span class="kw4">⚠️ 「MRの2回目（2期）が未接種」という情報に引きずられて'
        '選択肢bの麻疹を選ばないよう注意する——設問が問うのは<u>「一度も受けていない」'
        'もの</u>であり、1回だけ受けているMR（麻疹）はこれに該当しない</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①流行性耳下腺炎（おたふくかぜ）は<u>任意接種</u>——証明書に'
         '記載がない</span>。<br>'
         '<span class="kw">②Hib・肺炎球菌・B型肝炎・4種混合・BCG・MR・水痘は<u>A類'
         '疾病</u>として証明書に記載されている</span>。<br>'
         '<span class="kw">③「一度も受けていない」と「まだ2回目を受けていない」を'
         '混同しない——麻疹（MR1回目）は接種済み</span>。<br>'
         '<span class="kw">④DPT-IPVは<u>ジフテリア・百日咳・破傷風・ポリオ</u>の4種'
         'を1本でカバーする合剤</span>。<br>'
         '<span class="kw">⑤英語の予防接種証明書は和名との対応を押さえておけば読み'
         '取れる（NO.420と同系統の英語問題）</span>。<br>'
         '<span class="kw">⑥本問の正答率94%は、証明書の記載を丁寧に照合すれば解ける'
         '基礎的な読み取り問題であることを示す</span>。<br>'
         '<span class="kw">⑦BCGは結核を予防するA類疾病の定期接種</span>。<br>'
         '<span class="kw">⑧B型肝炎ワクチンは3回で接種が完了する不活化ワクチン</span>。'
         '<br>'
         '<span class="kw">⑨水痘ワクチンは2回接種で標準的には1歳台に完了する</span>。'
         '<br>'
         '<span class="kw">⑩Hibワクチンは4回接種で生後2か月から開始する</span>。'),
  ),

Q('113B-4', 95, [('bc', 'CBT'), ('bh', '必修')],
  '<strong>病原体と感染予防策の組合せで適切でないのはどれか。</strong>',
  [('a', 'HIV ― 標準予防策〈standard precautions〉', False,
    '<span class="kw4">誤り選択肢ではない。HIVは血液・体液を介して感染するため、'
    'すべての患者に対して行う<u>標準予防策</u>（手指衛生・手袋の適切な使用など）が'
    '基本となる——適切な組合せである</span>。'),
   ('b', 'ヒゼンダニ ― 飛沫予防策〈droplet precautions〉', True,
    '<span class="kw3">◯ これが不適切（＝正解）。ヒゼンダニ（疥癬の原因）は皮膚の'
    '直接接触や寝具・衣類を介して感染するため、必要な感染予防策は<u>接触予防策'
    '〈contact precautions〉</u>であり、<u>飛沫予防策ではない</u></span>——'
    '<span class="kw3">ヒゼンダニは空気中を飛ぶ病原体ではなく、皮膚から皮膚への'
    '直接接触や、寝具・衣類などの共有物を介して伝播するため、手袋・ガウンの着用と'
    '環境の消毒を中心とする接触予防策が適切な対応になる</span>。'),
   ('c', '麻疹ウイルス ― 空気予防策〈airborne precautions〉', False,
    '<span class="kw4">誤り選択肢ではない。麻疹ウイルスは空気感染するため、'
    '<u>空気予防策</u>（陰圧個室・N95マスク）が適切な組合せである（NO.425参照）'
    '</span>。'),
   ('d', 'Clostridium difficile ― 接触予防策〈contact precautions〉', False,
    '<span class="kw4">誤り選択肢ではない。Clostridium difficile（クロストリディオ'
    'イデス・ディフィシル）は芽胞を形成し、環境表面や手指を介して<u>接触感染</u>する'
    'ため、<u>接触予防策</u>が適切な組合せである</span>。'),
   ('e', 'インフルエンザウイルス ― 飛沫予防策〈droplet precautions〉', False,
    '<span class="kw4">誤り選択肢ではない。インフルエンザウイルスは咳・くしゃみに'
    'よる飛沫で感染するため、<u>飛沫予防策</u>（サージカルマスクなど）が適切な組合せ'
    'である</span>。')],
  'ヒゼンダニ（疥癬）は接触感染するため接触予防策が適切——飛沫予防策との組合せは不適切。'
  'HIVは標準予防策、麻疹は空気予防策、C. difficileは接触予防策、インフルエンザは'
  '飛沫予防策が適切な組合せ。',
  patho=('🧴 標準予防策と3つの感染経路別予防策',
         '<span class="kw3">感染予防策は、すべての患者に共通して行う<u>標準予防策'
         '（standard precautions）</u>を土台に、病原体の感染経路に応じて<u>接触予防策・'
         '飛沫予防策・空気予防策</u>を追加するという階層構造を取る</span>——'
         '<span class="kw">本問はこの4つの予防策と病原体の組合せの適否を問う、'
         '感染対策の基本を横断的に確認する設問である</span>。<br>'
         '<span class="kw3">ヒゼンダニによる疥癬は、皮膚と皮膚の直接接触や寝具・'
         '衣類の共有によって伝播する<u>接触感染</u>症であり、飛沫（咳・くしゃみで'
         '飛び散る比較的大きな粒子）を介して感染するものではない——このため'
         '「飛沫予防策」という組合せは誤りで、正しくは「接触予防策」である</span>。'),
  deep=('💡 病原体と感染経路別予防策の対応表',
        '<span class="kw">選択肢の5つの組合せを整理すると、感染経路別予防策の'
        '典型例が一望できる。</span><br>'
        '<table class="tb"><tr><th>病原体</th><th>感染経路</th><th>予防策</th></tr>'
        '<tr><td>HIV</td><td>血液・体液</td><td>標準予防策</td></tr>'
        '<tr><td><span class="kw4">ヒゼンダニ</span></td>'
        '<td><span class="kw4">接触</span></td>'
        '<td><span class="kw4">接触予防策（飛沫予防策ではない）</span></td></tr>'
        '<tr><td>麻疹ウイルス</td><td>空気</td><td>空気予防策</td></tr>'
        '<tr><td>Clostridium difficile</td><td>接触</td><td>接触予防策</td></tr>'
        '<tr><td>インフルエンザウイルス</td><td>飛沫</td><td>飛沫予防策</td></tr>'
        '</table>'
        '<span class="kw4">⚠️ NO.425（麻疹＝空気感染）と本問（ヒゼンダニ＝接触感染）は'
        'いずれも「感染経路に応じた予防策の使い分け」という同じ軸の設問——'
        '<u>空気・飛沫・接触の3経路と代表疾患をセットで覚えておく</u>と両方に対応'
        'できる</span>。'),
  point=('🎯 国試ポイント',
         '<span class="kw">①ヒゼンダニ（疥癬）は<u>接触感染</u>——接触予防策が適切'
         '（飛沫予防策は不適切）</span>。<br>'
         '<span class="kw">②麻疹ウイルスは<u>空気感染</u>——空気予防策が適切</span>。'
         '<br>'
         '<span class="kw">③インフルエンザウイルスは<u>飛沫感染</u>——飛沫予防策が'
         '適切</span>。<br>'
         '<span class="kw">④Clostridium difficileは<u>接触感染</u>——接触予防策が'
         '適切</span>。<br>'
         '<span class="kw">⑤HIVは血液・体液感染——すべての患者に対する<u>標準予防策</u>'
         'が基本</span>。<br>'
         '<span class="kw">⑥本問の正答率95%は、感染経路別予防策の基礎知識が広く定着'
         'していることを示す</span>。<br>'
         '<span class="kw">⑦標準予防策はすべての患者に対する感染対策の土台</span>。'
         '<br>'
         '<span class="kw">⑧空気予防策の代表疾患は麻疹・水痘・結核の3つ</span>。<br>'
         '<span class="kw">⑨接触予防策はノロウイルス・MRSA・疥癬などに用いる</span>。'
         '<br>'
         '<span class="kw">⑩飛沫予防策の代表疾患はインフルエンザ・風疹・流行性耳下腺炎'
         '</span>。'),
  ),
]
