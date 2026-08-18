
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
