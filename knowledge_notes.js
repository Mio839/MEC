// MEC 検索知識ノート データ
// ChatGPT等で調べた知識を整理してまとめたノート集。将来的に「検索知識問題」として
// study.html 側のQ&A形式に転用する際は、ここに書かれた内容を元ネタにする。

// 科目メタ情報（絵文字・色）。既存9科目は index.html の MINDMAP_TOOL と統一。
// 精神科・薬理・感染症など既存9科目に収まらないものは、必要になった時点でここへ追記する。
const KNOWLEDGE_SUBJECTS = {
  '内分泌':   { emoji: '🔬', color: '#7B1FA2' },
  '呼吸器':   { emoji: '🌬️', color: '#0288D1' },
  '循環器':   { emoji: '❤️', color: '#C62828' },
  '消化器':   { emoji: '🍴', color: '#388E3C' },
  '神経':     { emoji: '🧠', color: '#1565C0' },
  '肝胆膵':   { emoji: '🔶', color: '#E65100' },
  '腎臓':     { emoji: '💧', color: '#1976D2' },
  '血液':     { emoji: '🩸', color: '#DC2626' },
  '免アレ膠': { emoji: '🛡️', color: '#00897B' },
  '感染症':   { emoji: '🦠', color: '#F9A825' },
  '精神科':   { emoji: '💭', color: '#5C6BC0' },
  '薬理':     { emoji: '💊', color: '#6D4C41' },
  '総合':     { emoji: '📌', color: '#546E7A' },
};

const KNOWLEDGE_NOTES = [
  {
    id: 'kn_sulpiride',
    title: 'スルピリド',
    subject: '精神科',
    tags: ['精神科', '消化器', '薬理'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '「スルッとプロラクチンが上がるスルピリド」→ 乳汁分泌・無月経・女性化乳房まで一気に連想',
    html: `
<p class="kn-lead">ドパミンD2受容体拮抗薬。<b>少量では胃腸症状やうつ症状に、多量では統合失調症に</b>用いるのがポイント。国試では「用量で作用が変わる」ことが頻出。</p>

<h4 class="kn-h">基本情報</h4>
<ul class="kn-list">
  <li>一般名：スルピリド／商品名：ドグマチール など</li>
  <li>薬効：ベンズアミド系抗精神病薬</li>
</ul>

<h4 class="kn-h">作用機序：用量で効果が逆転</h4>
<table class="kn-table">
  <tr><th>用量</th><th>主な作用部位</th><th>結果</th></tr>
  <tr><td>少量（50〜150mg/日）</td><td>シナプス前D2自己受容体</td><td>ドパミン放出 <b class="kn-up">↑</b> → 抗うつ・意欲賦活、胃腸症状改善</td></tr>
  <tr><td>高用量（300mg/日〜）</td><td>シナプス後D2受容体</td><td>ドパミン作用 <b class="kn-down">↓</b> → 統合失調症陽性症状改善</td></tr>
</table>

<h4 class="kn-h">適応</h4>
<ul class="kn-list">
  <li><b>精神科</b>：統合失調症、うつ状態（現在は他薬が優先されることが多い）</li>
  <li><b>消化器</b>：胃炎・胃潰瘍・機能性ディスペプシア（少量）</li>
  <li><b>産科</b>：乳汁分泌不良への少量投与（高プロラクチン血症という副作用を逆手に取った使用法）</li>
</ul>

<h4 class="kn-h">副作用（重要度順）</h4>
<div class="kn-danger">
  <b>① 高プロラクチン血症</b>　<span class="kn-star">⭐国試最頻出</span><br>
  D2遮断でプロラクチン分泌抑制が外れる → 乳汁分泌・女性化乳房・月経異常・性欲低下・不妊
</div>
<div class="kn-danger">
  <b>② 錐体外路症状（EPS）</b><br>
  黒質線条体系のD2遮断 → パーキンソニズム／アカシジア／急性ジストニア／遅発性ジスキネジア<br>
  <span class="kn-note">※非定型抗精神病薬より起こりやすい傾向</span>
</div>
<div class="kn-danger kn-critical">
  <b>③ 悪性症候群</b>　<span class="kn-star">重篤・要注意</span><br>
  高熱／筋強剛／CK上昇／意識障害／自律神経症状
</div>
<div class="kn-danger">
  <b>④ QT延長</b><br>
  不整脈リスク
</div>

<h4 class="kn-h">禁忌・注意</h4>
<ul class="kn-list">
  <li><b class="kn-contra">禁忌</b>：褐色細胞腫</li>
  <li>パーキンソン病では症状悪化に注意</li>
  <li>腎機能低下では減量が必要（<b>腎排泄が主体</b> — 他の多くの抗精神病薬は肝代謝なのでここが狙われやすい）</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>D2遮断薬</li>
  <li>高プロラクチン血症を起こしやすい</li>
  <li>少量では胃薬としても使われる</li>
  <li>用量で作用が変わる</li>
  <li>腎排泄が主体（腎機能低下で減量）</li>
</ul>
`
  },
  {
    id: 'kn_limbic_system',
    title: '大脳辺縁系',
    subject: '神経',
    tags: ['神経', '精神科'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '扁桃体で「危険」を感じ、視床下部が体に伝え、海馬がその体験を記憶する — 感じる・覚える・行動するをつなぐシステム',
    html: `
<p class="kn-lead">大脳辺縁系（limbic system）は脳の内側にある複数の構造からなる神経ネットワークで、<b>感情・記憶・動機づけ・本能的行動</b>に関わる。</p>

<img class="kn-img" src="knowledge_images/limbic_overview.jpg" alt="大脳辺縁系の全体像">
<div class="kn-img-cap">帯状回・視床・乳頭体・扁桃体・海馬の位置関係</div>

<h4 class="kn-h">主な構成要素</h4>
<ul class="kn-list">
  <li><b>扁桃体</b>：恐怖・不安・怒りなどの情動を処理。危険の察知に重要</li>
  <li><b>海馬</b>：新しい記憶の形成。学習・空間認識に重要</li>
  <li><b>視床下部</b>：体温・食欲・睡眠・ホルモン分泌を調節。感情を身体反応につなげる</li>
  <li><b>帯状回</b>：感情の調節。注意や意思決定に関与</li>
</ul>

<img class="kn-img" src="knowledge_images/limbic_amygdala.jpg" alt="扁桃体の位置">
<div class="kn-img-cap">扁桃体（Amygdala）— 側頭葉内側、海馬の前方</div>

<img class="kn-img" src="knowledge_images/limbic_hippocampus.jpg" alt="海馬の位置と機能">
<div class="kn-img-cap">海馬（Hippocampus）— 短期・長期記憶、学習、空間記憶を担う</div>

<h4 class="kn-h">大脳辺縁系の働き</h4>
<ul class="kn-list">
  <li>感情の生成・調節（喜び・悲しみ・恐怖・怒りなど）</li>
  <li>記憶の形成（特に感情を伴う記憶を強く残す）</li>
  <li>本能的行動（食欲・性欲・防御反応など）</li>
  <li>自律神経・ホルモン調節（ストレス反応、睡眠覚醒リズム）</li>
</ul>

<div class="kn-danger">
  <b>例：熱い鍋に触れてしまったとき</b><br>
  扁桃体が「危険！」と判断 → 視床下部が自律神経を活性化（心拍数↑）→ 海馬がその体験を記憶する
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>扁桃体＝情動・恐怖の処理</li>
  <li>海馬＝新規記憶の形成（障害で前向性健忘）</li>
  <li>視床下部＝自律神経・内分泌の統合中枢</li>
  <li>帯状回＝感情調節・注意</li>
  <li>ストレス・不安障害・うつ病・PTSDとの関連が近年注目されている</li>
</ul>
`
  },
  {
    id: 'kn_psc_steroid',
    title: '原発性硬化性胆管炎とステロイド',
    subject: '肝胆膵',
    tags: ['肝胆膵', '消化器'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: 'PSC → Stent・移植（ステロイド×）／AIH・IgG4 → ステロイド〇',
    html: `
<p class="kn-lead">結論：原発性硬化性胆管炎（PSC）では<b>ステロイドは原則として有効ではない</b>。</p>

<h4 class="kn-h">なぜ効かないのか</h4>
<ul class="kn-list">
  <li>PSCは胆管の慢性炎症だけでなく<b>線維化が主体</b>の疾患 → 免疫を抑えるステロイドでは進行を十分止められない</li>
  <li>ステロイドや免疫抑制薬（アザチオプリンなど）が試された過去はあるが、<b>予後改善効果は証明されていない</b></li>
</ul>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li><b>①第一選択</b>：根本的な薬物治療は未確立。ウルソデオキシコール酸（UDCA）で肝胆道系酵素が改善することはあるが、生存率・進行抑制の明確なエビデンスは乏しい（高用量投与は非推奨）</li>
  <li><b>②狭窄が強い場合</b>：内視鏡的逆行性胆管膵管造影（ERCP）でバルーン拡張／ステント留置</li>
  <li><b>③終末期</b>：肝移植が唯一の根治的治療</li>
</ul>

<h4 class="kn-h">ステロイドを使う例外</h4>
<div class="kn-danger">
  <b>① IgG4関連硬化性胆管炎</b><br>
  PSCとの鑑別が非常に重要 <span class="kn-star">⭐</span>／ステロイドが著効／IgG4高値／膵病変（自己免疫性膵炎）を合併しやすい
</div>
<div class="kn-danger">
  <b>② 自己免疫性肝炎とのオーバーラップ症候群</b><br>
  PSC＋自己免疫性肝炎の所見がある場合、ステロイドが適応になることがある
</div>

<h4 class="kn-h">国試でのポイント</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>ステロイド</th></tr>
  <tr><td>原発性硬化性胆管炎</td><td class="kn-down">❌ 原則無効</td></tr>
  <tr><td>原発性胆汁性胆管炎</td><td class="kn-down">❌ 原則使わない（UDCAが基本）</td></tr>
  <tr><td>自己免疫性肝炎</td><td class="kn-up">✅ 第一選択</td></tr>
  <tr><td>IgG4関連硬化性胆管炎</td><td class="kn-up">✅ 著効</td></tr>
</table>
`
  },
  {
    id: 'kn_alport_syndrome',
    title: 'Alport症候群',
    subject: '腎臓',
    tags: ['腎臓'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '腎（血尿）・耳（感音性難聴）・目（前円錐水晶体）の3臓器障害＋Ⅳ型コラーゲン異常＝Alport症候群',
    html: `
<p class="kn-lead">腎臓・耳・目に障害を起こす遺伝性疾患。腎糸球体基底膜を構成する<b>Ⅳ型コラーゲンの遺伝子異常</b>が原因。</p>

<h4 class="kn-h">主な症状</h4>
<ul class="kn-list">
  <li><b>腎臓</b>：血尿（最も早期に現れる症状）／蛋白尿／腎機能低下／慢性腎臓病（CKD）、進行すると末期腎不全</li>
  <li><b>聴覚</b>：感音性難聴（小児期〜青年期に徐々に進行）</li>
  <li><b>眼</b>：前円錐水晶体（特徴的所見）／網膜異常／視力低下</li>
</ul>

<h4 class="kn-h">遺伝形式</h4>
<ul class="kn-list">
  <li><b>X連鎖性遺伝（約80%）</b>：<b>COL4A5</b>遺伝子変異。男性で重症化しやすい</li>
  <li>その他：常染色体劣性遺伝、常染色体優性遺伝</li>
</ul>

<h4 class="kn-h">診断</h4>
<ul class="kn-list">
  <li>尿検査（血尿・蛋白尿）</li>
  <li>腎機能検査／聴力検査／眼科検査</li>
  <li>遺伝子検査／腎生検（必要な場合）</li>
</ul>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>遺伝子異常そのものを治す治療は未確立</li>
  <li><b>ACE阻害薬／ARB</b>で腎機能低下の進行を遅らせることが重要</li>
  <li>腎不全に進行した場合：透析、腎移植</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>Ⅳ型コラーゲン異常（COL4A5など）による遺伝性腎症</li>
  <li>血尿＋感音性難聴＋前円錐水晶体の3徴</li>
  <li>X連鎖性遺伝が最多、男性で重症化しやすい</li>
  <li>治療の中心はACE阻害薬／ARBによる進行抑制</li>
  <li>家族歴があれば無症状でも検査を推奨</li>
</ul>
`
  },
  {
    id: 'kn_fantastic_four_hf',
    title: 'ファンタスティック・フォー（心不全）',
    subject: '循環器',
    tags: ['循環器', '薬理'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '「A・B・M・S」＝ARNI・β遮断薬・MRA・SGLT2阻害薬。利尿薬は入らない！',
    html: `
<p class="kn-lead">HFrEF（左室駆出率低下型心不全）の治療で、予後改善効果が証明されている<b>4本柱の薬物療法</b>を指す。</p>

<h4 class="kn-h">Fantastic Four（心不全の4本柱）</h4>
<table class="kn-table">
  <tr><th>薬剤</th><th>代表薬</th><th>主な効果</th></tr>
  <tr><td>ARNI（またはACE阻害薬/ARB）</td><td>サクビトリル・バルサルタン</td><td>心不全死亡・入院を減らす</td></tr>
  <tr><td>β遮断薬</td><td>カルベジロール、ビソプロロール</td><td>交感神経抑制、突然死予防</td></tr>
  <tr><td>MRA（ミネラルコルチコイド受容体拮抗薬）</td><td>スピロノラクトン</td><td>心筋リモデリング抑制</td></tr>
  <tr><td>SGLT2阻害薬</td><td>ダパグリフロジン、エンパグリフロジン</td><td>糖尿病の有無にかかわらず予後改善</td></tr>
</table>

<h4 class="kn-h">なぜ「Fantastic」なのか</h4>
<p class="kn-lead">この4剤を早期に導入すると、心血管死↓・心不全入院↓・全死亡↓と非常に大きな予後改善効果があるため「夢の4剤」と呼ばれる。</p>

<h4 class="kn-h">国試向けの覚え方</h4>
<div class="kn-danger">
  <b>「A・B・M・S」</b><br>
  A：ARNI（ACEi/ARB）／B：β遮断薬／M：MRA／S：SGLT2阻害薬
</div>

<h4 class="kn-h">何を間違えやすいか</h4>
<ul class="kn-list">
  <li><b class="kn-contra">利尿薬は入らない</b>：フロセミドなどのループ利尿薬は症状改善には有効だが、生命予後改善効果は明確ではないためFantastic Fourには含まれない</li>
</ul>

<h4 class="kn-h">適応</h4>
<ul class="kn-list">
  <li>主に<b>LVEF ≤40%のHFrEF</b>が対象</li>
  <li>HFpEF（駆出率保持型心不全）ではSGLT2阻害薬の有効性が示されているが、Fantastic Fourという概念は基本的にHFrEFに対して使う</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>ARNI・β遮断薬・MRA・SGLT2阻害薬の4本柱</li>
  <li>利尿薬は入っていない（症状改善のみ、予後改善なし）</li>
  <li>対象はHFrEF（LVEF≤40%）</li>
</ul>
`
  },
  {
    id: 'kn_congestive_hepatomegaly',
    title: '鬱血性肝腫大（congestive hepatomegaly）',
    subject: '循環器',
    tags: ['循環器', '肝胆膵'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '右心不全 → 肝うっ血 → ナツメグ肝。この一本道で覚える',
    html: `
<p class="kn-lead">右心不全などによって肝臓の静脈血がうっ滞し、肝臓が腫大した状態。肝臓は最終的に下大静脈→右心房へ血液を戻すため、右心系の圧が上がると肝臓に血液が渋滞してパンパンになる。</p>

<h4 class="kn-h">原因</h4>
<ul class="kn-list">
  <li><b>最も多い</b>：右心不全、両心不全</li>
  <li>その他：三尖弁閉鎖不全症、収縮性心膜炎、肺高血圧症、心タンポナーデ、Ebstein奇形</li>
</ul>

<h4 class="kn-h">病態生理</h4>
<div class="kn-danger">
  ①右房圧↑ → ②下大静脈圧↑ → ③肝静脈圧↑ → ④肝類洞（sinusoid）がうっ血 → ⑤肝腫大・肝機能障害<br>
  慢性化すると <b>心臓性肝硬変（cardiac cirrhosis）</b> へ進行することがある
</div>

<h4 class="kn-h">症状（身体所見）</h4>
<ul class="kn-list">
  <li>肝腫大／右季肋部痛・圧痛</li>
  <li>頸静脈怒張（JVD）／下腿浮腫／腹水</li>
  <li><b>肝頸静脈逆流（Hepatojugular reflux）</b>：右季肋部を10〜30秒圧迫すると頸静脈がさらに怒張する — 右心不全の重要な身体所見</li>
</ul>

<h4 class="kn-h">検査所見</h4>
<ul class="kn-list">
  <li><b>血液検査</b>：AST↑・ALT↑・LDH↑・ビリルビン↑（軽度の肝逸脱酵素上昇）。慢性ではALP↑・γ-GTP↑など胆汁うっ滞パターンになることも</li>
  <li><b>急性増悪時（虚血性肝炎＝shock liver）</b>：心原性ショックなどで肝血流が極端に低下すると、AST・ALTともに1000以上、LDH著明高値になる</li>
</ul>

<h4 class="kn-h">画像所見</h4>
<img class="kn-img" src="knowledge_images/chf_liver_ct.jpg" alt="鬱血性肝腫大のCT画像">
<div class="kn-img-cap">CT：肝腫大、下大静脈拡張、肝静脈拡張、造影不均一</div>
<ul class="kn-list">
  <li><b>CT</b>：肝腫大／下大静脈拡張／肝静脈拡張／造影不均一</li>
  <li><b>エコー</b>：下大静脈拡張／肝静脈拡張／呼吸性変動の消失</li>
</ul>

<h4 class="kn-h">病理：ナツメグ肝（Nutmeg liver）</h4>
<img class="kn-img" src="knowledge_images/chf_nutmeg_gross.jpg" alt="ナツメグ肝の肉眼所見">
<div class="kn-img-cap">肉眼所見：中心静脈周囲のうっ血がまだら模様（ナツメグ様）を呈する</div>
<img class="kn-img" src="knowledge_images/chf_nutmeg_histology.jpg" alt="ナツメグ肝の組織像">
<div class="kn-img-cap">組織像：中心静脈周囲の類洞うっ血</div>
<p class="kn-lead">肝小葉中心静脈周囲が暗赤色にうっ血し、周囲の正常肝とのまだら模様が<b>ナツメグ（香辛料）</b>に似るためこう呼ばれる。</p>

<div class="kn-danger kn-critical">
  <b>国試頻出の組み合わせ</b> <span class="kn-star">⭐</span><br>
  右心不全／三尖弁閉鎖不全／収縮性心膜炎／ナツメグ肝
</div>

<h4 class="kn-h">鑑別</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>肝腫大</th><th>頸静脈怒張</th></tr>
  <tr><td>鬱血性肝腫大</td><td class="kn-up">○</td><td class="kn-up">○</td></tr>
  <tr><td>急性肝炎</td><td class="kn-up">○</td><td class="kn-down">×</td></tr>
  <tr><td>肝硬変</td><td>初期○、末期は縮小</td><td class="kn-down">×</td></tr>
  <tr><td>Budd-Chiari症候群</td><td class="kn-up">○</td><td>通常×</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>右心不全 → 肝静脈圧↑ → 肝類洞うっ血 → ナツメグ肝</li>
  <li>肝頸静脈逆流は右心不全を示唆する重要な身体所見</li>
  <li>ショックリバー（AST/ALT 1000超）は急性増悪時の虚血性肝炎</li>
  <li>頸静脈怒張の有無が急性肝炎・肝硬変・Budd-Chiari症候群との鑑別点</li>
</ul>
`
  },
  {
    id: 'kn_bicuspid_aortic_valve',
    title: '先天性二尖性大動脈弁（BAV）',
    subject: '循環器',
    tags: ['循環器'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '「二尖弁 → 2つのA」＝Aortic Stenosis と Aortic Aneurysm/Dissection',
    html: `
<p class="kn-lead">正常の大動脈弁は3枚（3尖）だが、BAVでは生まれつき2枚しかない。頻度は約<b>1〜2%</b>と比較的よくみられる先天性心疾患。</p>

<h4 class="kn-h">BAVは何の原因になる？</h4>
<div class="kn-danger kn-critical">
  <b>①大動脈弁狭窄症（最重要）</b><br>
  二尖弁は血流の乱れ・機械的ストレスのため若いうちから石灰化しやすく、大動脈弁狭窄症を起こしやすい。<br>
  <span class="kn-note">高齢者のASは加齢変性が多いが、50〜60代でASを発症したらBAVを疑う</span>
</div>
<div class="kn-danger">
  <b>②大動脈弁閉鎖不全症</b><br>
  弁の変形により閉鎖不全を起こすことがある
</div>
<div class="kn-danger">
  <b>③感染性心内膜炎</b><br>
  異常弁なので細菌が付着しやすく、リスクが上がる
</div>
<div class="kn-danger kn-critical">
  <b>④上行大動脈瘤／大動脈解離（超重要）</b><br>
  BAVでは弁だけでなく大動脈壁そのものにも先天的な脆弱性がある。<br>
  BAV → 上行大動脈拡張 → 大動脈瘤 → 大動脈解離、という流れが起こり得る
</div>

<h4 class="kn-h">合併症まとめ</h4>
<table class="kn-table">
  <tr><th>合併症</th><th>頻度・重要度</th></tr>
  <tr><td>大動脈弁狭窄症</td><td>★★★★★</td></tr>
  <tr><td>大動脈弁閉鎖不全症</td><td>★★★☆☆</td></tr>
  <tr><td>感染性心内膜炎</td><td>★★★☆☆</td></tr>
  <tr><td>上行大動脈瘤</td><td>★★★★☆</td></tr>
  <tr><td>大動脈解離</td><td>★★★★☆</td></tr>
</table>

<h4 class="kn-h">国家試験での典型問題</h4>
<p class="kn-lead">若年〜中年で大動脈弁狭窄症を認め、胸部CTで上行大動脈拡張がある → <b>先天性二尖性大動脈弁</b>を考える。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>大動脈弁は本来3尖 → BAVは2尖</li>
  <li>頻度約1〜2%、先天性心疾患として比較的多い</li>
  <li>若年〜中年のAS（大動脈弁狭窄症）を見たらBAVを疑う</li>
  <li>BAVを見たら大動脈壁（上行大動脈瘤・大動脈解離）も評価する</li>
  <li>感染性心内膜炎のリスクも上昇</li>
</ul>
`
  },
  {
    id: 'kn_bentall_operation',
    title: 'Bentall手術',
    subject: '循環器',
    tags: ['循環器'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: 'Bentall＝Base（基部）を全部取り替える手術。キーワードは大動脈基部・冠動脈ボタン再建・人工弁付き人工血管',
    html: `
<p class="kn-lead">大動脈弁・大動脈基部（大動脈根部）・上行大動脈をまとめて<b>人工血管と人工弁に置換</b>し、冠動脈を再吻合する手術。「大動脈の付け根を全部交換する大手術」。</p>

<h4 class="kn-h">何を置換するの？</h4>
<ul class="kn-list">
  <li>①大動脈弁</li>
  <li>②バルサルバ洞（Valsalva洞）</li>
  <li>③上行大動脈</li>
  <li>④左右冠動脈を人工血管へつなぎ直す（<b>冠動脈ボタン法</b>）</li>
</ul>

<h4 class="kn-h">なぜ冠動脈をつなぎ直すのか</h4>
<div class="kn-danger">
  冠動脈の入口（冠動脈口）は大動脈基部に存在する。大動脈基部を切除すると冠動脈の出口がなくなるため、左右冠動脈を人工血管に再移植する必要がある。
</div>

<h4 class="kn-h">適応</h4>
<ul class="kn-list">
  <li><b>①急性A型大動脈解離</b>：特に大動脈基部まで解離／大動脈弁逆流を合併している場合</li>
  <li><b>②大動脈基部瘤</b></li>
  <li><b>③Marfan症候群</b>：大動脈基部が拡張しやすいため行われることがある</li>
  <li><b>④先天性二尖性大動脈弁（<a style="color:inherit">BAV</a>）</b>：BAV→上行大動脈瘤・大動脈基部拡張を起こすことがあり適応になりうる（<span class="kn-note">→[[先天性二尖性大動脈弁]]も参照</span>）</li>
</ul>

<h4 class="kn-h">David手術との違い（超重要）</h4>
<table class="kn-table">
  <tr><th></th><th>Bentall</th><th>David</th></tr>
  <tr><td>大動脈弁</td><td class="kn-down">置換する</td><td class="kn-up">温存する</td></tr>
  <tr><td>人工弁</td><td class="kn-down">必要</td><td class="kn-up">不要</td></tr>
  <tr><td>抗凝固薬</td><td class="kn-down">機械弁なら必要</td><td class="kn-up">不要なことが多い</td></tr>
  <tr><td>適応</td><td>弁も悪い</td><td>弁が保てる</td></tr>
</table>

<h4 class="kn-h">国試でのひっかけ</h4>
<ul class="kn-list">
  <li><b>Bentall</b>：大動脈弁＋大動脈基部＋上行大動脈＋冠動脈再建</li>
  <li><b>David</b>：自己大動脈弁を残す（Valve-sparing root replacement）</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>Bentall＝弁も基部も置換、冠動脈ボタン再建を伴う</li>
  <li>David＝弁温存（Valve-sparing）、人工弁不要</li>
  <li>若いBAV・Marfanで大動脈基部瘤 → BentallかDavidかを考える</li>
  <li>抗凝固薬の要否はBentallの人工弁の種類（機械弁 vs 生体弁）に依存</li>
</ul>
`
  },
  {
    id: 'kn_klebsiella_ampicillin',
    title: 'クレブシエラとアンピシリン耐性',
    subject: '感染症',
    tags: ['感染症', '薬理'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '「KAMP」＝ Klebsiella＋Ampicillin×（クレブシエラにアンピシリンは効かない）',
    html: `
<p class="kn-lead">クレブシエラ（<i>Klebsiella</i>）にはアンピシリンは基本的に効かない。</p>

<h4 class="kn-h">なぜ効かないのか</h4>
<div class="kn-danger">
  <i>Klebsiella</i>属は染色体性のβラクタマーゼ（主に<b>SHV-1</b>）を自然に産生しており、これがアンピシリンを分解してしまう。<br>
  → 生まれつき（<b>自然耐性</b>）アンピシリン耐性
</div>

<h4 class="kn-h">国試・感染症で重要なポイント</h4>
<ul class="kn-list">
  <li>グラム陰性桿菌</li>
  <li>莢膜あり（mucoid colony）</li>
  <li>肺炎、尿路感染、肝膿瘍の原因</li>
  <li>アンピシリン自然耐性</li>
</ul>

<h4 class="kn-h">じゃあ何が効くの？</h4>
<ul class="kn-list">
  <li>第3世代セフェム（例：セフトリアキソン）</li>
  <li>βラクタマーゼ阻害薬配合剤</li>
  <li>カルバペネム系</li>
</ul>
<p class="kn-lead">ただし近年はESBL産生菌やカルバペネマーゼ産生腸内細菌目細菌（CPE）も増えており、感受性結果を見て選択することが重要。</p>

<h4 class="kn-h">ついでに自然耐性でよく問われるもの</h4>
<table class="kn-table">
  <tr><th>菌</th><th>自然耐性</th></tr>
  <tr><td>クレブシエラ</td><td>アンピシリン</td></tr>
  <tr><td>腸球菌</td><td>セフェム系</td></tr>
  <tr><td>マイコプラズマ</td><td>βラクタム系</td></tr>
  <tr><td>緑膿菌</td><td>多くの抗菌薬</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>クレブシエラ＝アンピシリン無効（自然耐性、SHV-1βラクタマーゼ産生）</li>
  <li>腸球菌はセフェム系、マイコプラズマはβラクタム系全般に自然耐性（細胞壁がない）</li>
  <li>緑膿菌は多くの抗菌薬に自然耐性</li>
  <li>治療は第3世代セフェム／BLI配合剤／カルバペネム系、感受性結果次第</li>
</ul>
`
  },
  {
    id: 'kn_reprise_pertussis',
    title: 'レプリーゼ（百日咳）',
    subject: '呼吸器',
    tags: ['呼吸器', '感染症'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '「ヒューッと息を取り"戻す（reprise＝再開）"音」＝レプリーゼ ＝ 百日咳',
    html: `
<p class="kn-lead">レプリーゼ（reprise）とは、<b>百日咳</b>でみられる特徴的な吸気音（whoop）のこと。</p>

<h4 class="kn-h">どういうものか</h4>
<div class="kn-danger">
  「コンコンコンコン……」と激しく連続して咳き込む（<b>痙咳発作</b>）→ 一度息を吐き切ってしまう → その後勢いよく息を吸い込むときに「ヒューッ」という笛のような音がする。この吸気音が<b>レプリーゼ</b>。
</div>

<h4 class="kn-h">イメージ</h4>
<p class="kn-lead">コンコンコンコンコン……　→　息が吸えない　→　ヒューーーッ！（＝レプリーゼ）</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list">
  <li>百日咳菌に特徴的</li>
  <li>小児で典型的だが、<b>乳児ではレプリーゼが目立たず、無呼吸発作だけ</b>のこともあるので注意</li>
  <li>「発作性咳嗽＋レプリーゼ＋咳嗽後嘔吐」の3つが出てきたら百日咳を強く疑う</li>
</ul>

<h4 class="kn-h">国試ポイントまとめ</h4>
<ul class="kn-list kn-points">
  <li>レプリーゼ＝痙咳発作後の吸気時笛様音（whoop）</li>
  <li>百日咳の3徴：発作性咳嗽・レプリーゼ・咳嗽後嘔吐</li>
  <li>乳児では無呼吸発作のみでレプリーゼが目立たないことがある</li>
</ul>
`
  },
  {
    id: 'kn_pertussis_vs_croup',
    title: '百日咳とクループ症候群の鑑別',
    subject: '呼吸器',
    tags: ['呼吸器', '感染症'],
    date: '2026-07-01',
    source: 'ChatGPT調べ',
    mnemonic: '🐶 犬が吠える（ケンケン）→クループ／😮‍💨 ヒューっと吸う（whoop）→百日咳（[[レプリーゼ（百日咳）]]も参照）',
    html: `
<p class="kn-lead">百日咳（Pertussis）とクループ症候群（Croup）はどちらも咳を主症状とする小児の呼吸器疾患だが、原因・咳の特徴・好発年齢がかなり異なる。</p>

<h4 class="kn-h">比較表</h4>
<table class="kn-table">
  <tr><th>項目</th><th>百日咳</th><th>クループ症候群</th></tr>
  <tr><td>原因</td><td>百日咳菌</td><td>主にパラインフルエンザウイルス</td></tr>
  <tr><td>病変部位</td><td>気道全体</td><td>喉頭・声門下</td></tr>
  <tr><td>好発年齢</td><td>乳児・小児</td><td>6か月〜3歳</td></tr>
  <tr><td>咳の特徴</td><td>発作性・連続性咳嗽</td><td>犬が吠えるような咳</td></tr>
  <tr><td>特徴的な音</td><td>吸気時の「ヒュー（whoop）」</td><td>吸気性喘鳴（stridor）</td></tr>
  <tr><td>発熱</td><td>軽度〜なし</td><td>軽度のことが多い</td></tr>
  <tr><td>重症化</td><td>乳児では無呼吸・チアノーゼ</td><td>気道閉塞</td></tr>
</table>

<h4 class="kn-h">①百日咳</h4>
<ul class="kn-list">
  <li><b>原因</b>：百日咳菌による感染</li>
  <li><b>カタル期（1〜2週）</b>：鼻水・軽い咳、普通の風邪みたい。<b>この時期が最も感染力が強い</b></li>
  <li><b>痙咳期（2〜6週）</b>：咳が止まらない「コンコンコンコン……ヒュー！」、嘔吐を伴うことも</li>
  <li><b>回復期</b>：徐々に改善するが咳だけ数週間続く</li>
</ul>
<div class="kn-danger kn-critical">
  乳児では無呼吸・チアノーゼ・けいれんを起こすことがあり危険
</div>
<ul class="kn-list">
  <li><b>検査</b>：PCR、培養、<b>リンパ球優位の白血球増加</b>（国試頻出）</li>
  <li><b>治療</b>：マクロライド系抗菌薬（アジスロマイシン、クラリスロマイシン）</li>
</ul>

<h4 class="kn-h">②クループ症候群</h4>
<ul class="kn-list">
  <li><b>原因</b>：主にパラインフルエンザウイルス</li>
  <li><b>病態</b>：ウイルス感染により声門下が浮腫を起こし気道が狭くなる</li>
</ul>
<div class="kn-danger">
  <b>三徴</b>：犬吠様咳嗽（ケンケンという咳）／嗄声（声がかれる）／吸気性喘鳴（stridor）
</div>
<ul class="kn-list">
  <li><b>典型例</b>：夜中に突然「ケンケン！」「ゼーゼー！」「声がかすれている！」→ クループを疑う</li>
  <li><b>X線所見</b>：Steeple sign（尖塔徴候）</li>
  <li><b>治療</b>：軽症は加湿・安静、中等症以上はステロイド（デキサメタゾン）・アドレナリン吸入</li>
</ul>

<h4 class="kn-h">国試での超重要な見分け方</h4>
<ul class="kn-list kn-points">
  <li>「コンコンコン→ヒュー！」→ 百日咳</li>
  <li>「ケンケン！＋声がかすれる」→ クループ症候群</li>
  <li>百日咳はリンパ球優位の白血球増加、治療はマクロライド系</li>
  <li>クループはSteeple signとステロイド／アドレナリン吸入</li>
</ul>
`
  },
  {
    id: 'kn_transfusion_gvhd',
    title: '輸血後GVHD（近親者間輸血）',
    subject: '血液',
    tags: ['血液', '免アレ膠'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「HLAが似ているから安全」ではなく、似ているからこそ受血者が供血者リンパ球を排除できないのがミソ',
    html: `
<p class="kn-lead">近親者間の輸血では、受血者が供血者のリンパ球を「異物」と認識できず、逆に供血者のリンパ球が受血者を攻撃してしまうため、<b>輸血後GVHD（graft-versus-host disease）</b>が起こりやすい。</p>

<h4 class="kn-h">普通の他人からの輸血では？</h4>
<p class="kn-lead">供血者：HLA-A,B／受血者：HLA-C,D のようにHLAが全然違うと、受血者の免疫が供血者のリンパ球を排除する。そのため輸血されたT細胞は長く生き残れず、GVHDは起こりにくい。</p>

<h4 class="kn-h">近親者では何が起こる？</h4>
<p class="kn-lead">親子や兄弟姉妹ではHLAを共有していることが多い。例：父 HLA A/A、子 HLA A/B。父から子へ輸血すると——</p>
<div class="kn-danger">
  <b>①子（受血者）から見ると</b><br>
  父のリンパ球は「A」なので「自分にもAがあるから異物じゃない」となり、排除できない
</div>
<div class="kn-danger kn-critical">
  <b>②父のリンパ球から見ると</b><br>
  子の「B」は持っていないので「Bは異物だ！」と認識して攻撃する<br>
  → 供血者T細胞が受血者の皮膚・肝臓・消化管を攻撃 → 輸血後GVHD発症
</div>

<h4 class="kn-h">図で表すと</h4>
<table class="kn-table">
  <tr><th></th><th>父（供血者）A/A</th><th>子（受血者）A/B</th></tr>
  <tr><td>A</td><td>自己</td><td class="kn-down">自己なので攻撃しない</td></tr>
  <tr><td>B</td><td class="kn-up">異物なので攻撃する</td><td>自己</td></tr>
</table>
<p class="kn-lead">このような<b>一方向適合（one-way matching）</b>が起こるのがポイント。</p>

<h4 class="kn-h">だから現在は？</h4>
<div class="kn-danger">
  近親者から輸血する場合だけでなく、日本ではほぼ全ての血液製剤に<b>「放射線照射」</b>が行われている。放射線を当てると輸血中のT細胞が増殖できなくなるため、輸血後GVHDを予防できる。
</div>

<h4 class="kn-h">国試での頻出ポイント</h4>
<ul class="kn-list kn-points">
  <li>近親者間輸血 → 輸血後GVHDリスク↑</li>
  <li>原因 → HLAの一方向適合</li>
  <li>予防 → 放射線照射血液製剤</li>
  <li>発症すると死亡率は極めて高い（90%以上）</li>
</ul>
`
  },
  {
    id: 'kn_reticulocyte_increase',
    title: '網赤血球（Reticulocyte）が増加する病気',
    subject: '血液',
    tags: ['血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「壊れる・漏れる・治る」で網赤↑ ＝ 溶血・出血・治療後',
    html: `
<p class="kn-lead">網赤血球↑＝骨髄が「赤血球が足りない！」と頑張って作っている状態。基本的には赤血球が末梢で失われている病態で上昇する。</p>

<h4 class="kn-h">①溶血性貧血（超重要）</h4>
<ul class="kn-list">
  <li>自己免疫性溶血性貧血／遺伝性球状赤血球症／発作性夜間ヘモグロビン尿症／G6PD欠損症／鎌状赤血球症</li>
</ul>
<div class="kn-danger">
  赤血球が壊される → 腎臓からエリスロポエチン（EPO）↑ → 骨髄で赤血球産生↑ → 網赤血球↑
</div>

<h4 class="kn-h">②急性出血</h4>
<ul class="kn-list">
  <li>消化管出血／外傷／手術後</li>
</ul>
<p class="kn-lead">出血直後はまだ増えないが、<b>2〜3日後から増加</b>し始める。</p>

<h4 class="kn-h">③貧血治療後</h4>
<ul class="kn-list">
  <li>鉄欠乏性貧血に鉄剤投与</li>
  <li>巨赤芽球性貧血にビタミンB12・葉酸投与</li>
</ul>
<div class="kn-danger">
  治療が効くと骨髄が一気に赤血球を作り始めるため、<b>網赤血球クリーゼ（reticulocyte crisis）</b>が起こる
</div>

<h4 class="kn-h">④エリスロポエチン産生増加</h4>
<ul class="kn-list">
  <li>高地生活／慢性低酸素血症／腎性貧血に対するEPO製剤投与</li>
</ul>

<h4 class="kn-h">国試での考え方</h4>
<table class="kn-table">
  <tr><th>網赤血球↑（骨髄は元気）</th><th>網赤血球↓（骨髄が働けない）</th></tr>
  <tr><td>溶血／出血／治療反応</td><td>再生不良性貧血／骨髄異形成症候群／鉄欠乏性貧血（未治療）／巨赤芽球性貧血（未治療）</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「壊れる・漏れる・治る」の3パターンで網赤血球↑を押さえる</li>
  <li>急性出血直後は増加せず、2〜3日後から上昇</li>
  <li>鉄欠乏性・巨赤芽球性貧血の治療反応判定に網赤血球クリーゼを利用できる</li>
  <li>網赤血球↓は骨髄自体が造血できていない病態（再生不良性貧血、MDSなど）を示唆</li>
</ul>
`
  },
  {
    id: 'kn_glycyrrhizin_pseudoaldosteronism',
    title: 'グリチルリチンと偽アルドステロン症',
    subject: '内分泌',
    tags: ['内分泌', '薬理', '腎臓'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '低K＋高血圧＋甘草（漢方）→ グリチルリチンによる偽アルドステロン症を疑う',
    html: `
<p class="kn-lead">グリチルリチン（Glycyrrhizin）は甘草（カンゾウ：Licorice）に含まれる成分で、日本では肝機能改善薬・漢方薬の成分として使われる。代表的な製剤は<b>強力ネオミノファーゲンシー（SNMC）</b>。</p>

<h4 class="kn-h">作用</h4>
<ul class="kn-list">
  <li>抗炎症作用／肝細胞保護作用／免疫調節作用</li>
  <li>慢性肝炎などでAST・ALTの改善目的に用いられることがある</li>
</ul>

<h4 class="kn-h">現在の臨床での位置づけ</h4>
<ul class="kn-list">
  <li>SNMCは慢性肝炎・肝機能障害（AST・ALT高値）の補助療法として現在も使われる</li>
  <li>以前はC型・B型肝炎に広く使用されていたが、抗ウイルス薬（DAA）やB型肝炎の核酸アナログ製剤が非常に有効になったため、グリチルリチン自体が第一選択治療になることはほとんどない</li>
  <li>現在は「肝機能異常の改善目的」「肝障害に対する補助療法」としての位置づけ</li>
</ul>
<p class="kn-lead">国試・臨床では「肝臓の薬」としてよりも、「肝機能障害でSNMCを使用中の患者が高血圧・低K血症・筋力低下を呈した→偽アルドステロン症」という<b>副作用側</b>を問われる頻度の方が高い。</p>

<h4 class="kn-h">国試で超重要な副作用：偽アルドステロン症</h4>
<div class="kn-danger kn-critical">
  グリチルリチンは<b>11β-ヒドロキシステロイド脱水素酵素2（11β-HSD2）</b>を阻害する。通常はコルチゾール→コルチゾンに変換してコルチゾールがミネラルコルチコイド受容体を刺激しないようにしているが、この変換が阻害されると：<br>
  グリチルリチン → 11β-HSD2阻害 → コルチゾール↑ → アルドステロン受容体刺激 → <b>偽アルドステロン症</b>
</div>

<h4 class="kn-h">症状・検査所見</h4>
<ul class="kn-list">
  <li>高血圧／低カリウム血症／代謝性アルカローシス／浮腫／筋力低下</li>
  <li>重症では横紋筋融解症、不整脈</li>
</ul>

<h4 class="kn-h">ホルモン値</h4>
<table class="kn-table">
  <tr><th>項目</th><th>変化</th></tr>
  <tr><td>レニン</td><td class="kn-down">↓</td></tr>
  <tr><td>アルドステロン</td><td class="kn-down">↓</td></tr>
  <tr><td>コルチゾール</td><td>正常</td></tr>
</table>
<p class="kn-lead"><b>「アルドステロンが高いわけではない」</b>のがポイント。</p>

<h4 class="kn-h">甘草を含む代表的な漢方</h4>
<ul class="kn-list">
  <li>芍薬甘草湯／補中益気湯／抑肝散／小青竜湯</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>低K血症＋高血圧＋甘草含有漢方の服用歴 → 偽アルドステロン症を疑う</li>
  <li>機序は11β-HSD2阻害によるコルチゾールのミネラルコルチコイド受容体刺激</li>
  <li>レニン・アルドステロンは低下（原発性アルドステロン症との鑑別ポイント）</li>
  <li>「漢方を飲んでいる高齢者の低K血症」はグリチルリチンを疑う典型パターン</li>
</ul>
`
  },
  {
    id: 'kn_reye_syndrome',
    title: 'Reye症候群',
    subject: '神経',
    tags: ['神経', '消化器', '薬理'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「インフルの子、アスピリンで脳と肝がやられる」＝小児・インフルエンザ/水痘・アスピリン・高アンモニア血症・小滴性脂肪肝・急性脳症',
    html: `
<p class="kn-lead">ウイルス感染後の小児に、アスピリン投与を契機として発症する<b>急性脳症＋脂肪肝</b>。国試頻出。</p>

<h4 class="kn-h">病態</h4>
<div class="kn-danger">
  インフルエンザや水痘などのウイルス感染 → アスピリン投与 → ミトコンドリア障害 → 肝臓で脂肪酸β酸化障害・尿素回路障害 → 脂肪肝＋高アンモニア血症＋脳浮腫
</div>

<h4 class="kn-h">好発年齢・原因ウイルス</h4>
<ul class="kn-list">
  <li>小児（特に15歳未満）</li>
  <li>インフルエンザ、水痘が有名</li>
</ul>

<h4 class="kn-h">症状</h4>
<ul class="kn-list">
  <li><b>初期</b>：感冒症状、嘔吐</li>
  <li><b>進行すると</b>：意識障害、けいれん、昏睡</li>
</ul>

<h4 class="kn-h">検査所見</h4>
<ul class="kn-list">
  <li>肝機能：AST↑、ALT↑</li>
  <li>アンモニア：NH₃↑↑（高アンモニア血症）</li>
  <li>血糖：低血糖</li>
  <li>肝組織：<b>小滴性脂肪変性（microvesicular steatosis）</b>、肝細胞壊死は目立たない</li>
</ul>

<h4 class="kn-h">国試での典型例</h4>
<p class="kn-lead">「インフルエンザに罹患した小児」「解熱目的にアスピリン服用」「嘔吐、意識障害、高アンモニア血症」→ <b>Reye症候群</b></p>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>特異的治療はなく、頭蓋内圧管理・全身管理・低血糖補正・高アンモニア血症への対応などの支持療法が中心</li>
</ul>

<h4 class="kn-h">超重要な予防</h4>
<div class="kn-danger kn-critical">
  小児のインフルエンザ・水痘では<b>アスピリンを使用しない</b>！代わりにアセトアミノフェンを使用する。
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>小児（15歳未満）＋インフルエンザ・水痘＋アスピリン</li>
  <li>高アンモニア血症＋小滴性脂肪肝＋急性脳症</li>
  <li>肝細胞壊死は目立たず脂肪変性が主体</li>
  <li>予防はアスピリンを避けアセトアミノフェンを使用すること</li>
</ul>
`
  },
  {
    id: 'kn_cirrhosis_dilutional_hyponatremia',
    title: '肝硬変の希釈性低Na血症',
    subject: '肝胆膵',
    tags: ['肝胆膵', '腎臓'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '肝硬変・心不全・ネフローゼ→有効循環血漿量↓→ADH↑→希釈性低Na血症、という共通メカニズム',
    html: `
<p class="kn-lead">肝硬変の低Na血症は「Naが失われる」よりも<b>「水をため込みすぎる」</b>ことで起こる<b>希釈性低Na血症（dilutional hyponatremia）</b>。</p>

<h4 class="kn-h">病態を順番に理解する</h4>
<div class="kn-danger">
  ①肝硬変→門脈圧亢進 → ②内臓血管の拡張（<b>一酸化窒素NO</b>の作用で腸管などの血管が拡張）→ ③有効循環血漿量（effective arterial blood volume）が低下（全身の水分量は多いが「血管の中を流れている血液が足りない」と体が勘違い）→ ④RAAS↑・交感神経↑・ADH（バソプレシン）↑ → ⑤ADHにより水だけを再吸収（Naも再吸収されるが、それ以上に水が大量に再吸収される）→ 血清Na濃度が希釈される → 低Na血症
</div>

<h4 class="kn-h">イメージ</h4>
<p class="kn-lead">肝硬変 → 血管拡張 → 有効循環血漿量↓ → ADH↑ → 水の再吸収↑↑ → 希釈性低Na血症</p>

<h4 class="kn-h">国試でのポイント</h4>
<ul class="kn-list">
  <li>肝硬変患者では浮腫・腹水・低Na血症がセットで出てくる</li>
  <li>「水分が多いならNaも高そう」と思いがちだが、実際には水の増加量の方が大きいため低Naになる</li>
</ul>

<h4 class="kn-h">心不全・ネフローゼとの共通点</h4>
<div class="kn-danger">
  肝硬変・心不全・ネフローゼ症候群はいずれも<b>有効循環血漿量↓ → ADH↑ → 希釈性低Na血症</b>という共通のメカニズムで低Naになる
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>肝硬変では有効循環血漿量の低下によりADH分泌が亢進し、水が過剰に再吸収されるため希釈性低Na血症をきたす</li>
  <li>Naが失われるのではなく水が過剰に貯留するのが本態</li>
  <li>心不全・ネフローゼ症候群も同じ機序で低Na血症になる</li>
</ul>
`
  },
  {
    id: 'kn_rovsing_sign',
    title: 'Rovsing徴候',
    subject: '消化器',
    tags: ['消化器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'Rovsing：左を押して右が痛い／Blumberg：離したときに痛い（反跳痛）',
    html: `
<p class="kn-lead">左下腹部を圧迫すると右下腹部（McBurney点）に痛みが誘発される徴候。<b>急性虫垂炎</b>を示唆する身体所見の1つ。</p>

<h4 class="kn-h">やり方</h4>
<ul class="kn-list">
  <li>左下腹部（左腸骨窩）をゆっくり圧迫する</li>
  <li>患者が右下腹部に痛みを訴えるか確認する</li>
</ul>

<h4 class="kn-h">なぜ右が痛くなるのか</h4>
<div class="kn-danger">
  左下腹部を押す → 大腸内のガスや内容物が移動し、盲腸・虫垂周囲の腹膜が伸展 → 炎症を起こしている虫垂周囲の壁側腹膜が刺激される → 右下腹部痛が生じる（間接的に虫垂周囲の腹膜炎を証明する所見）
</div>

<h4 class="kn-h">虫垂炎で有名な身体所見まとめ</h4>
<table class="kn-table">
  <tr><th>所見</th><th>方法</th><th>意味</th></tr>
  <tr><td>McBurney圧痛点</td><td>右下腹部を押す</td><td>虫垂炎の代表的圧痛</td></tr>
  <tr><td>Rovsing徴候</td><td>左下腹部を押して右下腹部痛</td><td>腹膜刺激</td></tr>
  <tr><td>Blumberg徴候（反跳痛）</td><td>押して急に離す</td><td>腹膜刺激</td></tr>
  <tr><td>Psoas徴候</td><td>右股関節伸展で痛み</td><td>後腹膜側の虫垂炎</td></tr>
  <tr><td>Obturator徴候</td><td>右股関節屈曲・内旋で痛み</td><td>骨盤内虫垂炎</td></tr>
</table>

<h4 class="kn-h">国試の典型例</h4>
<p class="kn-lead">「左下腹部を圧迫したところ右下腹部痛が誘発された」→ Rovsing徴候陽性 → 急性虫垂炎を疑う</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>Rovsing徴候＝左を押して右が痛い（腹膜刺激）</li>
  <li>Blumberg徴候＝離したときに痛い（反跳痛）</li>
  <li>Psoas徴候・Obturator徴候は後腹膜・骨盤内虫垂炎で陽性になりやすい</li>
</ul>
`
  },
  {
    id: 'kn_lemmel_syndrome',
    title: 'Lemmel症候群',
    subject: '肝胆膵',
    tags: ['肝胆膵', '消化器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「Lemmel＝憩室（Diverticulum）による閉塞性黄疸」。胆石なし＋十二指腸傍乳頭憩室 → Lemmel症候群',
    html: `
<p class="kn-lead">胆石がないにもかかわらず、<b>傍乳頭憩室</b>（十二指腸乳頭の近くにできた憩室）が総胆管を圧迫し、閉塞性黄疸や胆管炎を起こす病態。</p>

<h4 class="kn-h">病態</h4>
<div class="kn-danger">
  傍乳頭憩室（periampullary diverticulum）→ 総胆管・Vater乳頭を圧迫 → 胆汁うっ滞 → 閉塞性黄疸・胆管炎・膵炎
</div>

<h4 class="kn-h">症状</h4>
<ul class="kn-list">
  <li>黄疸／発熱（胆管炎を合併すると）／右上腹部痛／肝胆道系酵素上昇</li>
  <li>高齢者に多い</li>
</ul>

<h4 class="kn-h">画像所見</h4>
<img class="kn-img" src="knowledge_images/lemmel_ct.jpg" alt="Lemmel症候群のCT画像">
<div class="kn-img-cap">CT：十二指腸下行脚内側の憩室（矢印）と胆管拡張</div>
<img class="kn-img" src="knowledge_images/lemmel_mri.jpg" alt="Lemmel症候群のMRI/MRCP画像">
<div class="kn-img-cap">MRI/MRCP：憩室による総胆管の圧排</div>
<img class="kn-img" src="knowledge_images/lemmel_diagram.jpg" alt="傍乳頭憩室と胆管・十二指腸の位置関係の模式図">
<div class="kn-img-cap">模式図：D＝十二指腸、PBD＝末梢胆管、PAD＝傍乳頭憩室</div>
<ul class="kn-list">
  <li><b>CT</b>：十二指腸下行脚内側にガスを含む憩室／胆管拡張／胆石なし</li>
  <li><b>ERCP・MRCP</b>：総胆管の圧排・狭窄を認める</li>
</ul>

<h4 class="kn-h">鑑別</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>特徴</th></tr>
  <tr><td>胆石性閉塞</td><td>胆石あり、胆管内結石あり</td></tr>
  <tr><td>膵頭部癌</td><td>腫瘤形成、進行性黄疸</td></tr>
  <tr><td>胆管癌</td><td>胆管狭窄像</td></tr>
  <tr><td>Lemmel症候群</td><td>胆石なし、傍乳頭憩室あり</td></tr>
</table>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>症状が軽ければ保存的治療</li>
  <li>胆管炎や閉塞が強い場合：内視鏡的ドレナージ（ERCP）、内視鏡的乳頭切開術（EST）、まれに手術</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「高齢者」「胆石なし」「閉塞性黄疸」「十二指腸憩室」→ Lemmel症候群</li>
  <li>膵頭部癌・胆管癌との鑑別は胆石の有無と憩室の有無</li>
  <li>治療は保存的〜内視鏡的ドレナージ／EST</li>
</ul>
`
  },
  {
    id: 'kn_acute_pancreatitis_severity',
    title: '急性膵炎の重症度判定基準',
    subject: '肝胆膵',
    tags: ['肝胆膵'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '急性膵炎でやばいもの：肺(PaO₂↓)・循環(BE↓,ショック)・炎症(CRP↑,SIRS↑)・凝固(Plt↓)・腎(BUN↑,Cr↑)・Ca↓・高齢',
    html: `
<p class="kn-lead">日本膵臓学会・厚労省の重症度判定基準。国試では<b>予後因子9項目</b>と<b>造影CT Grade</b>が重要。</p>

<h4 class="kn-h">①予後因子（各1点）</h4>
<table class="kn-table">
  <tr><th>項目</th><th>基準</th></tr>
  <tr><td>①Base excess</td><td>≦−3 mEq/L またはショック</td></tr>
  <tr><td>②PaO₂</td><td>≦60 mmHg（室内気）</td></tr>
  <tr><td>③BUN</td><td>≧40 mg/dL または Cr≧2.0 mg/dL、または乏尿</td></tr>
  <tr><td>④LDH</td><td>基準上限の2倍以上</td></tr>
  <tr><td>⑤血小板</td><td>≦10万/μL</td></tr>
  <tr><td>⑥総Ca</td><td>≦7.5 mg/dL</td></tr>
  <tr><td>⑦CRP</td><td>≧15 mg/dL</td></tr>
  <tr><td>⑧SIRS</td><td>3項目以上</td></tr>
  <tr><td>⑨年齢</td><td>≧70歳</td></tr>
</table>

<h4 class="kn-h">SIRSの4項目（復習）</h4>
<ul class="kn-list">
  <li>体温 ＞38℃または＜36℃</li>
  <li>脈拍 ＞90/分</li>
  <li>呼吸数 ＞20/分またはPaCO₂＜32 mmHg</li>
  <li>WBC ＞12,000/μL、＜4,000/μL、または幼若球＞10%</li>
</ul>
<p class="kn-lead">3項目以上で1点。</p>

<h4 class="kn-h">重症急性膵炎の判定</h4>
<div class="kn-danger kn-critical">
  予後因子 <b>3点以上 → 重症</b>
</div>

<h4 class="kn-h">②造影CT Grade</h4>
<ul class="kn-list">
  <li><b>Grade 1</b>：炎症が膵周囲に限局</li>
  <li><b>Grade 2</b>：炎症が腎前傍腔まで進展</li>
  <li><b>Grade 3</b>：炎症が結腸間膜根部や腎下極以遠まで進展、広範な膵壊死</li>
</ul>
<div class="kn-danger kn-critical">
  CT Grade <b>2以上 → 重症</b>
</div>

<h4 class="kn-h">よく出る合併症</h4>
<ul class="kn-list">
  <li><b>早期</b>：ショック、ARDS（急性呼吸窮迫症候群）、DIC、急性腎障害</li>
  <li><b>後期</b>：感染性膵壊死、膵仮性嚢胞</li>
</ul>

<h4 class="kn-h">国試ワンポイント</h4>
<div class="kn-danger">
  急性膵炎では<b>アミラーゼ値やリパーゼ値そのものは重症度判定に含まれない</b>。「アミラーゼが高い＝重症」ではない
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>予後因子3点以上 → 重症</li>
  <li>CT Grade 2以上 → 重症</li>
  <li>CRP≥15 mg/dL、Ca≤7.5 mg/dL、BUN≥40 mg/dL、年齢≥70歳</li>
  <li>アミラーゼ・リパーゼは重症度判定に含まれない</li>
</ul>
`
  },
  {
    id: 'kn_sspe',
    title: '亜急性硬化性全脳炎（SSPE）',
    subject: '神経',
    tags: ['神経', '感染症'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「麻疹の数年後、ピクッ（ミオクローヌス）としながら脳が硬化する」＝麻疹→数年後→ミオクローヌス→周期性同期性放電→SSPE',
    html: `
<p class="kn-lead">麻疹（はしか）に感染してから数年後に発症する、進行性で致死的な中枢神経疾患。</p>

<h4 class="kn-h">原因</h4>
<ul class="kn-list">
  <li>麻疹ウイルスの変異株が脳内に持続感染することが原因</li>
  <li>麻疹感染 → 数年（平均6〜8年）→ SSPE発症</li>
</ul>

<h4 class="kn-h">好発年齢</h4>
<ul class="kn-list">
  <li>小児〜若年者</li>
  <li><b>2歳未満で麻疹にかかった人ほどリスクが高い</b></li>
</ul>

<h4 class="kn-h">症状（徐々に進行）</h4>
<ul class="kn-list">
  <li><b>初期</b>：性格変化、学力低下、物忘れ、集中力低下</li>
  <li><b>中期</b>：ミオクローヌス（突然のピクッとする不随意運動）、てんかん、歩行障害</li>
  <li><b>後期</b>：認知機能低下、意識障害、昏睡</li>
</ul>

<h4 class="kn-h">検査所見</h4>
<ul class="kn-list">
  <li>髄液：麻疹抗体価上昇</li>
</ul>
<div class="kn-danger kn-critical">
  <b>脳波（超重要・国試頻出）</b>：周期性同期性放電（PSD：Periodic Synchronous Discharge）。高振幅の脳波が一定間隔で周期的に出現し、これにミオクローヌスが同期する
</div>
<ul class="kn-list">
  <li>MRI：白質病変や脳萎縮を認める</li>
</ul>

<h4 class="kn-h">診断のキーワード</h4>
<p class="kn-lead">「幼少期の麻疹の既往」「数年後」「知能低下」「ミオクローヌス」「周期性同期性放電」→ SSPE</p>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>根治療法はない。イノシンプラノベクス、インターフェロン療法などが試みられるが予後は不良</li>
</ul>

<h4 class="kn-h">予防（超重要）</h4>
<div class="kn-danger kn-critical">
  麻疹ワクチン接種が最大の予防法。麻疹ワクチンの普及によりSSPEは著しく減少している
</div>

<h4 class="kn-h">国試での鑑別</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>特徴</th></tr>
  <tr><td>SSPE</td><td>麻疹後数年、ミオクローヌス、PSD</td></tr>
  <tr><td>Creutzfeldt-Jakob病</td><td>高齢者、急速進行性認知症、PSD</td></tr>
  <tr><td>自己免疫性脳炎</td><td>精神症状、けいれん</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>麻疹感染から平均6〜8年後に発症</li>
  <li>2歳未満での罹患がリスク因子</li>
  <li>脳波の周期性同期性放電（PSD）とミオクローヌスの同期</li>
  <li>予防は麻疹ワクチン接種</li>
  <li>CJDもPSDを示すが高齢者・急速進行性認知症で鑑別</li>
</ul>
`
  },
  {
    id: 'kn_subacute_combined_degeneration',
    title: '亜急性連合性脊髄変性症（SCD）',
    subject: '神経',
    tags: ['神経', '血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「B12がないと、後ろ（後索）と横（側索）がやられる」＝B12欠乏＋巨赤芽球性貧血＋深部感覚障害＋痙性麻痺',
    html: `
<p class="kn-lead"><b>ビタミンB12欠乏</b>によって脊髄の<b>後索</b>と<b>側索（錐体路）</b>が変性する疾患。国試頻出。</p>

<h4 class="kn-h">原因</h4>
<ul class="kn-list">
  <li>悪性貧血／胃全摘後／萎縮性胃炎／回腸末端切除／長期の菜食／吸収不良症候群</li>
</ul>
<div class="kn-danger">
  ビタミンB12はミエリン形成・DNA合成に必要。欠乏すると脊髄の脱髄が起こる
</div>

<h4 class="kn-h">障害される部位</h4>
<ul class="kn-list">
  <li><b>①後索（posterior column）</b>：深部感覚障害（振動覚↓、位置覚↓）</li>
  <li><b>②側索（lateral corticospinal tract）</b>：錐体路障害（痙性麻痺、腱反射亢進、Babinski反射陽性）</li>
</ul>
<p class="kn-lead">「連合性」とは後索＋側索の<b>両方（combined）</b>が障害されるという意味。</p>

<h4 class="kn-h">症状</h4>
<ul class="kn-list">
  <li><b>感覚障害</b>：四肢のしびれ、深部感覚障害、感覚性失調</li>
  <li><b>運動障害</b>：痙性歩行、下肢筋力低下</li>
  <li>その他：舌炎、認知機能障害</li>
</ul>

<h4 class="kn-h">検査所見</h4>
<ul class="kn-list">
  <li>血液：巨赤芽球性貧血、MCV↑、好中球過分葉</li>
  <li>生化学：ビタミンB12↓、ホモシステイン↑、<b>メチルマロン酸↑（超重要）</b></li>
</ul>
<img class="kn-img" src="knowledge_images/scd_axial.jpg" alt="SCDの頸髄軸位断MRI">
<div class="kn-img-cap">頸髄軸位断：後索の信号変化</div>
<img class="kn-img" src="knowledge_images/scd_sagittal.jpg" alt="SCDの脊髄矢状断MRI">
<div class="kn-img-cap">矢状断：頸髄〜胸髄後索に沿った高信号（矢印）</div>
<img class="kn-img" src="knowledge_images/scd_invertedv.jpg" alt="逆V字サイン（inverted V sign）">
<div class="kn-img-cap">MRI：頸髄後索の逆V字サイン（inverted V sign）</div>

<h4 class="kn-h">国試での典型例</h4>
<p class="kn-lead">胃全摘後＋巨赤芽球性貧血＋下肢のしびれ＋振動覚低下＋Romberg徴候陽性 → 亜急性連合性脊髄変性症</p>

<h4 class="kn-h">鑑別</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>深部感覚</th><th>腱反射</th></tr>
  <tr><td>亜急性連合性脊髄変性症</td><td>低下</td><td>亢進</td></tr>
  <tr><td>糖尿病性ニューロパチー</td><td>低下</td><td>低下</td></tr>
  <tr><td>多発性硬化症</td><td>さまざま</td><td>亢進</td></tr>
</table>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>ビタミンB12補充（ヒドロキソコバラミン、メコバラミン）</li>
</ul>
<div class="kn-danger kn-critical">
  神経症状は進行すると不可逆になるため、早期診断・早期治療が重要
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>B12欠乏で後索（深部感覚）＋側索（錐体路）の両方が障害される</li>
  <li>メチルマロン酸↑がB12欠乏の鋭敏な指標</li>
  <li>MRIで頸髄後索の逆V字サイン</li>
  <li>治療はB12補充、進行すると不可逆</li>
</ul>
`
  },
  {
    id: 'kn_streptococcus_pyogenes',
    title: 'Streptococcus pyogenes（化膿レンサ球菌／GAS）',
    subject: '感染症',
    tags: ['感染症', '腎臓'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「ピオゲネスは、のど（咽頭炎）・皮膚（丹毒）・腎（糸球体腎炎）・心（リウマチ熱）」',
    html: `
<p class="kn-lead">正式名称は<b>Group A Streptococcus（GAS）</b>。A群β溶血性レンサ球菌。国試でも超頻出の細菌。</p>

<h4 class="kn-h">細菌学的特徴</h4>
<ul class="kn-list">
  <li>グラム陽性球菌、連鎖状（strepto-）、β溶血</li>
  <li>カタラーゼ陰性、Bacitracin感受性、PYR試験陽性</li>
</ul>

<h4 class="kn-h">主な病原因子</h4>
<ul class="kn-list">
  <li><b>①M蛋白（最重要）</b>：抗貪食作用、病原性の中心、リウマチ熱との関連あり</li>
  <li><b>②Streptolysin O</b>：赤血球を溶血。抗体はASO（抗ストレプトリジンO抗体）</li>
  <li><b>③Streptokinase</b>：プラスミノーゲンを活性化し血栓を溶解</li>
  <li><b>④Pyrogenic exotoxin（発熱毒素）</b>：猩紅熱、劇症型溶血性レンサ球菌感染症（STSS）を起こす</li>
</ul>

<h4 class="kn-h">起こす疾患</h4>
<ul class="kn-list">
  <li><b>①急性咽頭炎</b>：最も多い。発熱、咽頭痛、扁桃白苔、圧痛を伴う頸部リンパ節腫脹（咳は少ない）</li>
  <li><b>②猩紅熱（Scarlet fever）</b>：イチゴ舌、全身の紅斑、口囲蒼白</li>
  <li><b>③丹毒（Erysipelas）</b>：境界明瞭な皮膚の発赤、顔面に多い</li>
  <li><b>④蜂窩織炎（Cellulitis）</b></li>
  <li><b>⑤壊死性筋膜炎</b>：「人食いバクテリア」として有名</li>
</ul>
<div class="kn-danger kn-critical">
  <b>⑥劇症型溶血性レンサ球菌感染症（STSS）</b>：ショック、多臓器不全、DIC。死亡率が高い
</div>

<h4 class="kn-h">感染後の免疫学的合併症（超重要）</h4>
<div class="kn-danger">
  <b>①急性糸球体腎炎（PSAGN）</b>：感染後1〜3週間。血尿、浮腫、高血圧、補体（C3）低下
</div>
<div class="kn-danger">
  <b>②急性リウマチ熱（ARF）</b>：感染後2〜4週間。Jones基準（多発関節炎、心炎、舞踏病、輪状紅斑、皮下結節）
</div>
<p class="kn-lead">「腎炎は起こすが、リウマチ熱は起こさない」は<b>誤り</b>——両方起こす。</p>

<h4 class="kn-h">診断</h4>
<ul class="kn-list">
  <li>迅速抗原検査、咽頭培養、ASO価↑（既感染の証拠）</li>
</ul>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>第一選択：ペニシリンG、アモキシシリン</li>
  <li>ペニシリンアレルギーならアジスロマイシン</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>M蛋白＝最重要病原因子、抗貪食作用</li>
  <li>ASO価↑＝既感染の証拠</li>
  <li>感染後合併症：急性糸球体腎炎（1〜3週）と急性リウマチ熱（2〜4週）の両方あり</li>
  <li>治療の第一選択はペニシリン系</li>
</ul>
`
  },
  {
    id: 'kn_typhoid_rose_spots',
    title: 'バラ疹（腸チフス）',
    subject: '感染症',
    tags: ['感染症'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「高熱＋徐脈＋お腹にバラ」＝腸チフス',
    html: `
<p class="kn-lead">バラ疹（rose spots）は<b>腸チフス・パラチフス</b>でみられる、淡いピンク色の小さな発疹。</p>

<h4 class="kn-h">見た目</h4>
<ul class="kn-list">
  <li>直径2〜4mm程度、淡いピンク色（サーモンピンク）、少し盛り上がることもある</li>
  <li><b>圧迫すると一時的に消える（退色性）</b></li>
  <li>好発部位：胸部、腹部（特に上腹部）。数個〜十数個程度出現</li>
</ul>

<h4 class="kn-h">いつ出るか</h4>
<p class="kn-lead">発熱（階段状に上昇）→ 1週目後半〜2週目 → バラ疹出現</p>

<h4 class="kn-h">なぜできるのか</h4>
<div class="kn-danger">
  原因菌<i>Salmonella Typhi</i>（腸チフス）が菌血症を起こし、皮膚の毛細血管周囲に炎症を起こすため
</div>

<h4 class="kn-h">腸チフスの典型三徴</h4>
<ul class="kn-list">
  <li>持続する高熱</li>
  <li>徐脈（比較的徐脈、<b>Faget徴候</b>）</li>
  <li>バラ疹</li>
</ul>
<p class="kn-lead">さらに、肝脾腫、下痢または便秘、意識障害（チフス状態）を伴うことがある。</p>

<h4 class="kn-h">梅毒のバラ疹との違い（注意）</h4>
<div class="kn-danger kn-critical">
  「バラ疹」という名前だが、<b>梅毒のバラ疹とは別物</b>
</div>
<table class="kn-table">
  <tr><th></th><th>腸チフス</th><th>梅毒（二期梅毒）</th></tr>
  <tr><td>原因</td><td>Salmonella Typhi</td><td>Treponema pallidum</td></tr>
  <tr><td>部位</td><td>胸腹部</td><td>全身、手掌・足底を含む</td></tr>
  <tr><td>発熱</td><td>高熱あり</td><td>軽度〜なし</td></tr>
  <tr><td>特徴</td><td>少数の淡紅色斑</td><td>全身性発疹</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「東南アジア渡航後、高熱・比較的徐脈・腹部の淡紅色発疹」→ 腸チフスのバラ疹</li>
  <li>比較的徐脈（Faget徴候）＋高熱＋バラ疹の3徴</li>
  <li>梅毒のバラ疹（全身性、手掌・足底含む）とは部位・随伴症状が異なる</li>
</ul>
`
  },
  {
    id: 'kn_obstructive_jaundice_cholesterol',
    title: '閉塞性黄疸と高コレステロール血症（Lp-X）',
    subject: '肝胆膵',
    tags: ['肝胆膵'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '肝硬変→合成能低下→コレステロール↓／閉塞性黄疸→排泄障害＋Lp-X→コレステロール↑',
    html: `
<p class="kn-lead">閉塞性黄疸では、胆汁として排泄されるはずのコレステロールが胆道閉塞によって血液中に逆流・蓄積するため、<b>高コレステロール血症</b>になる。</p>

<h4 class="kn-h">正常ではどうなっているか</h4>
<p class="kn-lead">肝臓でコレステロールは①胆汁中にそのまま分泌　②胆汁酸に変換して排泄——つまり胆汁はコレステロールの重要な排泄経路。</p>

<h4 class="kn-h">閉塞性黄疸では？</h4>
<div class="kn-danger">
  胆石や腫瘍などで胆管が詰まる → 胆汁の流れが止まる → コレステロールが胆汁中へ排泄できない → 胆汁成分が血中へ逆流 → 血清コレステロール↑
</div>

<h4 class="kn-h">さらに重要：Lp-Xの出現</h4>
<div class="kn-danger kn-critical">
  閉塞性黄疸では<b>Lp-X（Lipoprotein X）</b>という異常リポ蛋白が血中に出現する。Lp-Xはコレステロール・リン脂質を多く含み、これがさらに血清総コレステロール値を上昇させる
</div>

<h4 class="kn-h">検査所見の特徴</h4>
<ul class="kn-list">
  <li>ALP↑↑、γ-GTP↑↑、直接ビリルビン↑、総コレステロール↑、Lp-X出現</li>
</ul>

<h4 class="kn-h">肝硬変との対比（頻出）</h4>
<table class="kn-table">
  <tr><th></th><th>機序</th><th>コレステロール</th></tr>
  <tr><td>肝硬変</td><td>肝臓の合成能低下</td><td class="kn-down">↓</td></tr>
  <tr><td>閉塞性黄疸</td><td>排泄障害＋Lp-X出現</td><td class="kn-up">↑</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>閉塞性黄疸＝排泄障害＋Lp-X出現でコレステロール↑</li>
  <li>肝硬変＝合成能低下でコレステロール↓</li>
  <li>ALP・γ-GTP・直接ビリルビン・総コレステロールがセットで上昇</li>
</ul>
`
  },
  {
    id: 'kn_painless_thyroiditis',
    title: '無痛性甲状腺炎',
    subject: '内分泌',
    tags: ['内分泌'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「痛くない・漏れてる・ヨウ素取らない」＝無痛性甲状腺炎→破壊性甲状腺炎→RAIU低下',
    html: `
<p class="kn-lead">自己免疫によって一時的に甲状腺が破壊され、甲状腺ホルモンが漏れ出すことで起こる、一過性の甲状腺中毒症。別名：破壊性甲状腺炎（destructive thyroiditis）、Silent thyroiditis。</p>

<h4 class="kn-h">病態</h4>
<div class="kn-danger">
  甲状腺の炎症 → 甲状腺濾胞が破壊 → 貯蔵されていたT3・T4が血中へ漏出 → 一過性の甲状腺機能亢進症<br>
  「ホルモンを作りすぎている」のではなく<b>漏れ出しているだけ</b>
</div>

<h4 class="kn-h">好発</h4>
<ul class="kn-list">
  <li>女性に多い</li>
  <li>産後1〜6か月（産後甲状腺炎）によくみられる</li>
  <li>橋本病の患者に合併しやすい</li>
</ul>

<h4 class="kn-h">症状</h4>
<ul class="kn-list">
  <li>甲状腺中毒症状：動悸、発汗、手指振戦、体重減少</li>
  <li><b class="kn-contra">甲状腺痛はない</b>（重要）</li>
</ul>

<h4 class="kn-h">検査所見</h4>
<ul class="kn-list">
  <li>FT3↑、FT4↑、TSH↓</li>
  <li>抗TPO抗体陽性、抗サイログロブリン抗体陽性</li>
</ul>
<div class="kn-danger kn-critical">
  <b>放射性ヨウ素摂取率（RAIU）低下（超重要）</b>：ホルモンが漏れているだけなので甲状腺は「もうホルモン十分ある」と判断し新たな合成を止める → ヨウ素を取り込まない → RAIU低下
</div>

<h4 class="kn-h">経過</h4>
<p class="kn-lead">甲状腺中毒期（1〜3か月）→ 甲状腺機能低下期 → 自然回復。多くは半年〜1年で改善する。</p>

<h4 class="kn-h">鑑別：Basedow病との違い</h4>
<table class="kn-table">
  <tr><th></th><th>無痛性甲状腺炎</th><th>Basedow病</th></tr>
  <tr><td>甲状腺痛</td><td>なし</td><td>なし</td></tr>
  <tr><td>TRAb</td><td class="kn-down">陰性</td><td class="kn-up">陽性</td></tr>
  <tr><td>RAIU</td><td class="kn-down">↓</td><td class="kn-up">↑</td></tr>
  <tr><td>血流（エコー）</td><td class="kn-down">↓</td><td class="kn-up">↑↑</td></tr>
  <tr><td>抗甲状腺薬</td><td class="kn-down">無効</td><td class="kn-up">有効</td></tr>
</table>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>基本は自然軽快するので経過観察</li>
  <li>動悸が強い場合はプロプラノロールなどのβ遮断薬</li>
  <li><b class="kn-contra">抗甲状腺薬（チアマゾールなど）は基本的に使わない</b>（ホルモンを作りすぎているわけではないため）</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「産後女性」「甲状腺中毒症」「TRAb陰性」「RAIU低下」→ 無痛性甲状腺炎</li>
  <li>甲状腺痛はない（亜急性甲状腺炎との鑑別点）</li>
  <li>抗甲状腺薬は無効、治療は対症療法（β遮断薬）が基本</li>
</ul>
`
  },
  {
    id: 'kn_pbc_steroid_osteoporosis',
    title: 'PBC（原発性胆汁性胆管炎）とステロイドによる骨粗鬆症',
    subject: '肝胆膵',
    tags: ['肝胆膵'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'PBC自体が骨粗鬆症リスク（ビタミンD吸収低下）＋ステロイドが骨形成↓・骨吸収↑ → リスク大幅増加。原則UDCA、ステロイドは使わない（[[原発性硬化性胆管炎とステロイド]]も参照）',
    html: `
<p class="kn-lead">PBC（原発性胆汁性胆管炎）はもともと骨粗鬆症になりやすく、そこにステロイドが加わるとリスクがさらに上がる。</p>

<h4 class="kn-h">①PBC自体が骨粗鬆症を起こしやすい理由</h4>
<div class="kn-danger">
  胆汁うっ滞によって脂溶性ビタミン（A・D・E・K）の吸収障害が起こる。特に<b>ビタミンD吸収低下 → Ca吸収低下 → 骨形成低下 → 骨粗鬆症</b>。慢性肝疾患そのものによる骨代謝異常（hepatic osteodystrophy）も関与する
</div>

<h4 class="kn-h">②ステロイドが骨粗鬆症を起こす機序</h4>
<div class="kn-danger">
  骨芽細胞（osteoblast）↓→骨形成低下／破骨細胞（osteoclast）↑→骨吸収増加。さらに腸管でのCa吸収↓・腎からのCa排泄↑→低Ca血症傾向→PTH↑→さらに骨吸収↑
</div>

<h4 class="kn-h">PBCで特に問題になる理由</h4>
<p class="kn-lead">PBC（ビタミンD吸収低下でもともと骨粗鬆症になりやすい）＋ステロイド投与（骨形成↓・骨吸収↑）→ 骨粗鬆症リスクが大幅に増加する。</p>

<h4 class="kn-h">国試的には</h4>
<ul class="kn-list">
  <li>PBCの第一選択は<b>ウルソデオキシコール酸（UDCA）</b></li>
  <li><b class="kn-contra">ステロイドは原則として使わない</b>（骨粗鬆症を悪化させるため）</li>
</ul>

<h4 class="kn-h">例外</h4>
<div class="kn-danger">
  PBCに自己免疫性肝炎を合併した<b>PBC-AIHオーバーラップ症候群</b>ではステロイドが必要になることがある。その場合は骨密度測定・Ca/ビタミンD補充・必要に応じてビスホスホネート投与で骨粗鬆症対策を行う
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>PBCでは胆汁うっ滞によるビタミンD吸収障害のため元々骨粗鬆症になりやすい</li>
  <li>ステロイドは骨形成抑制・骨吸収促進作用を有するため骨粗鬆症リスクがさらに増加する</li>
  <li>PBCの第一選択はUDCA、ステロイドは原則不使用（例外はPBC-AIHオーバーラップ）</li>
</ul>
`
  },
  {
    id: 'kn_aminoglycosides',
    title: 'アミノグリコシド系抗菌薬',
    subject: '感染症',
    tags: ['感染症', '薬理', '腎臓'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「アミノ（耳）・グリコ（腎）」＝アミノグリコシド→耳毒性＋腎毒性',
    html: `
<p class="kn-lead">代表薬：ゲンタマイシン、アミカシン、トブラマイシン、ストレプトマイシン。一言でいうと<b>好気性グラム陰性桿菌（GNR）</b>に強い抗菌薬。</p>

<h4 class="kn-h">主な適応①：重症グラム陰性菌感染症</h4>
<ul class="kn-list">
  <li>対象菌：大腸菌、Klebsiella pneumoniae、緑膿菌（Pseudomonas aeruginosa）</li>
  <li>疾患：敗血症、重症肺炎、複雑性尿路感染症、腹腔内感染</li>
</ul>

<h4 class="kn-h">主な適応②：緑膿菌感染</h4>
<p class="kn-lead">特にゲンタマイシン、トブラマイシン、アミカシンは抗緑膿菌活性がある。</p>

<h4 class="kn-h">主な適応③：感染性心内膜炎（併用）</h4>
<div class="kn-danger">
  βラクタム系やバンコマイシンと併用する。理由は<b>相乗効果（synergy）</b>：βラクタム系が細胞壁を壊す → アミノグリコシドが細胞内へ入りやすくなる → 殺菌力UP
</div>

<h4 class="kn-h">主な適応④：結核</h4>
<p class="kn-lead">ストレプトマイシンは昔から有名な抗結核薬。現在は第一選択ではないが、耐性結核などで使われる。</p>

<h4 class="kn-h">主な適応⑤：腸管内殺菌</h4>
<p class="kn-lead">ネオマイシンは肝性脳症、術前腸管処置などで使われることがある。</p>

<h4 class="kn-h">効かないもの（超重要）</h4>
<div class="kn-danger kn-critical">
  <b class="kn-contra">嫌気性菌には無効</b>：アミノグリコシドは酸素依存性輸送機構を使って細菌内に入るため、酸素がない嫌気性菌には効かない
</div>

<h4 class="kn-h">副作用（国試超頻出）</h4>
<ul class="kn-list">
  <li>①腎障害：急性尿細管障害</li>
  <li>②耳毒性：難聴、前庭障害、めまい</li>
  <li>③神経筋接合部遮断：重症筋無力症では注意</li>
</ul>

<h4 class="kn-h">国試でのまとめ</h4>
<table class="kn-table">
  <tr><th>使う菌</th><th>代表例</th></tr>
  <tr><td>好気性グラム陰性桿菌</td><td>大腸菌、クレブシエラ</td></tr>
  <tr><td>緑膿菌</td><td>Pseudomonas</td></tr>
  <tr><td>感染性心内膜炎</td><td>βラクタムと併用</td></tr>
  <tr><td>結核</td><td>ストレプトマイシン</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>好気性グラム陰性桿菌・緑膿菌に有効、嫌気性菌には無効</li>
  <li>感染性心内膜炎ではβラクタム系と併用し相乗効果</li>
  <li>副作用は腎毒性・耳毒性・神経筋接合部遮断</li>
</ul>
`
  },
  {
    id: 'kn_aerobic_anaerobic_bacteria',
    title: '好気性菌・嫌気性菌のまとめ',
    subject: '感染症',
    tags: ['感染症'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '偏性好気性「結構（結核）リョク（緑膿）あるノー（ノカルジア）」／偏性嫌気性「クロ（Clostridium）・バク（Bacteroides）・ペプ（Peptostreptococcus）は酸素嫌い」',
    html: `
<h4 class="kn-h">まず定義</h4>
<table class="kn-table">
  <tr><th>種類</th><th>酸素</th></tr>
  <tr><td>偏性好気性菌</td><td>酸素がないと生きられない</td></tr>
  <tr><td>偏性嫌気性菌</td><td>酸素があると生きられない</td></tr>
  <tr><td>通性嫌気性菌</td><td>酸素があってもなくても生きられる</td></tr>
</table>

<h4 class="kn-h">①偏性好気性菌（酸素大好き）</h4>
<ul class="kn-list">
  <li>Mycobacterium tuberculosis（結核菌）</li>
  <li>Pseudomonas aeruginosa（緑膿菌）</li>
  <li>Nocardia asteroides（ノカルジア）</li>
</ul>

<h4 class="kn-h">②偏性嫌気性菌（酸素嫌い）</h4>
<ul class="kn-list">
  <li><b>グラム陽性桿菌</b>：Clostridium tetani（破傷風菌）、Clostridium botulinum（ボツリヌス菌）、Clostridioides difficile、Clostridium perfringens</li>
  <li><b>グラム陰性桿菌</b>：Bacteroides fragilis、Fusobacterium nucleatum、Prevotella melaninogenica</li>
  <li><b>グラム陽性球菌</b>：Peptostreptococcus anaerobius</li>
</ul>

<h4 class="kn-h">③通性嫌気性菌（何でもあり）</h4>
<p class="kn-lead">国試で出てくる菌の大半がこれ。</p>
<ul class="kn-list">
  <li><b>腸内細菌</b>：Escherichia coli、Klebsiella pneumoniae、Salmonella enterica、Shigella dysenteriae</li>
  <li><b>グラム陽性球菌</b>：Staphylococcus aureus、Streptococcus pyogenes、Enterococcus faecalis</li>
</ul>

<h4 class="kn-h">国試頻出：膿瘍を作る菌</h4>
<div class="kn-danger">
  嫌気性菌を疑う状況：悪臭のある膿／膿瘍形成／誤嚥性肺炎／歯性感染／腸管穿孔後感染<br>
  代表：Bacteroides、Peptostreptococcus、Fusobacterium
</div>

<h4 class="kn-h">アミノグリコシドとの関連（超重要）</h4>
<p class="kn-lead">アミノグリコシドは嫌気性菌には効かない。細菌内への取り込みに酸素依存性輸送が必要なため（→<span class="kn-note">[[アミノグリコシド系抗菌薬]]も参照</span>）。</p>

<h4 class="kn-h">国試向け最終まとめ</h4>
<table class="kn-table">
  <tr><th>菌</th><th>酸素</th></tr>
  <tr><td>結核菌</td><td>偏性好気性</td></tr>
  <tr><td>緑膿菌</td><td>偏性好気性</td></tr>
  <tr><td>ノカルジア</td><td>偏性好気性</td></tr>
  <tr><td>クロストリジウム</td><td>偏性嫌気性</td></tr>
  <tr><td>バクテロイデス</td><td>偏性嫌気性</td></tr>
  <tr><td>ペプトストレプトコッカス</td><td>偏性嫌気性</td></tr>
  <tr><td>ブドウ球菌</td><td>通性嫌気性</td></tr>
  <tr><td>レンサ球菌</td><td>通性嫌気性</td></tr>
  <tr><td>腸内細菌</td><td>通性嫌気性</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>結核菌・緑膿菌・ノカルジアは偏性好気性</li>
  <li>クロストリジウム属・バクテロイデス・ペプトストレプトコッカスは偏性嫌気性</li>
  <li>腸内細菌・ブドウ球菌・レンサ球菌は通性嫌気性（国試頻出菌の大半）</li>
  <li>悪臭のある膿・膿瘍形成・誤嚥性肺炎は嫌気性菌を疑う</li>
</ul>
`
  },
  {
    id: 'kn_ehlers_danlos_syndrome',
    title: 'エーラス・ダンロス症候群（EDS）',
    subject: '免アレ膠',
    tags: ['免アレ膠', '循環器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「EDS＝Elastic（伸びる）・Dislocation（脱臼）・Splitting（破れる）」＝伸びる皮膚・脱臼する関節・破れる血管臓器',
    html: `
<p class="kn-lead">コラーゲンの異常によって皮膚・関節・血管などの結合組織が脆くなる遺伝性疾患群。</p>

<h4 class="kn-h">三徴（超重要）</h4>
<ul class="kn-list">
  <li>皮膚過伸展（hyperextensible skin）</li>
  <li>関節過可動性（joint hypermobility）</li>
  <li>組織脆弱性（tissue fragility）</li>
</ul>

<h4 class="kn-h">病態</h4>
<p class="kn-lead">コラーゲンの合成や構造に異常 → 結合組織が弱くなる → 皮膚、靭帯、血管、消化管などがもろくなる。</p>

<h4 class="kn-h">症状</h4>
<ul class="kn-list">
  <li><b>①皮膚</b>：よく伸びる、傷が開きやすい、傷跡が薄く紙巻きタバコの紙のよう（cigarette paper scar）、あざができやすい</li>
  <li><b>②関節</b>：異常に柔らかい、反復性脱臼、捻挫しやすい（Beighton scoreで評価）</li>
</ul>

<h4 class="kn-h">③血管型EDS（vascular EDS）</h4>
<div class="kn-danger kn-critical">
  原因：<b>Ⅲ型コラーゲン（COL3A1）</b>異常<br>
  合併症：動脈瘤、動脈解離、大血管破裂、腸管穿孔、子宮破裂 — 若年で突然死することがある
</div>

<h4 class="kn-h">国試頻出のコラーゲン型</h4>
<table class="kn-table">
  <tr><th>型</th><th>コラーゲン</th></tr>
  <tr><td>古典型</td><td>V型</td></tr>
  <tr><td>血管型</td><td>III型</td></tr>
</table>
<p class="kn-lead">血管型EDSの特徴：若年者で動脈解離・腸管穿孔・子宮破裂を見たら疑う。</p>

<h4 class="kn-h">鑑別：Marfan症候群との違い</h4>
<table class="kn-table">
  <tr><th></th><th>EDS</th><th>Marfan</th></tr>
  <tr><td>原因</td><td>コラーゲン異常</td><td>フィブリリン異常</td></tr>
  <tr><td>皮膚過伸展</td><td>あり</td><td>なし</td></tr>
  <tr><td>関節過可動性</td><td>あり</td><td>軽度</td></tr>
  <tr><td>水晶体亜脱臼</td><td>なし</td><td>あり</td></tr>
  <tr><td>大動脈病変</td><td>あり（血管型）</td><td>あり</td></tr>
</table>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>根本治療はない。外傷予防、血圧管理、血管病変の定期フォロー、不必要な侵襲的処置を避ける</li>
</ul>

<h4 class="kn-h">国試での典型例</h4>
<p class="kn-lead">「若年女性」「皮膚がよく伸びる」「関節が柔らかい」「反復性脱臼」→ EDS／「若年で動脈破裂・腸管穿孔」→ 血管型EDS（Ⅲ型コラーゲン異常）</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>三徴：皮膚過伸展・関節過可動性・組織脆弱性</li>
  <li>古典型はV型コラーゲン、血管型はIII型コラーゲン（COL3A1）</li>
  <li>血管型は若年での動脈解離・腸管穿孔・子宮破裂がキーワード</li>
  <li>Marfan症候群とは原因蛋白（コラーゲン vs フィブリリン）と水晶体亜脱臼の有無で鑑別</li>
</ul>
`
  },
  {
    id: 'kn_forrester_iv',
    title: 'Forrester分類IV（Cold & Wet）の治療優先順位',
    subject: '循環器',
    tags: ['循環器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'Forrester IVでは低心拍出による循環不全（Cold）が予後を規定するため、まず循環不全を優先し、その後に肺うっ血（Wet）を改善する',
    html: `
<p class="kn-lead">Forrester IV（Cold & Wet）では、まず<b>循環不全（低灌流）の改善が最優先</b>。そのうえで肺うっ血・肺水腫（Wet）を治療する。</p>

<h4 class="kn-h">Forrester分類とは</h4>
<table class="kn-table">
  <tr><th></th><th>うっ血なし（Dry）</th><th>うっ血あり（Wet）</th></tr>
  <tr><td>末梢循環良好（Warm）</td><td>I</td><td>II</td></tr>
  <tr><td>末梢循環不良（Cold）</td><td>III</td><td>IV</td></tr>
</table>
<div class="kn-danger kn-critical">
  IV＝Cold＋Wet：心係数（CI）＜2.2 L/min/m²、肺動脈楔入圧（PCWP）＞18 mmHg<br>
  心拍出量低下（ショック状態）と肺うっ血・肺水腫の両方がある最も重症な病態
</div>

<h4 class="kn-h">なぜ循環不全を優先するのか</h4>
<p class="kn-lead">低灌流が続くと、腎不全→肝不全→乳酸アシドーシス→多臓器不全→死亡につながる。肺うっ血も危険だが、ショックの方がより致命的。</p>

<h4 class="kn-h">治療の実際</h4>
<ul class="kn-list">
  <li><b>血圧が低い場合（SBP&lt;90mmHg）</b>：まずカテコラミン（ドブタミン、ノルアドレナリン）で心拍出量・血圧を維持</li>
  <li><b>血圧が保たれてきたら</b>：利尿薬（フロセミド）、血管拡張薬（ニトログリセリン）で肺うっ血を改善</li>
</ul>

<h4 class="kn-h">国試での考え方</h4>
<p class="kn-lead">「Forrester IVで最初に何をする？」→ ショックがあるか？　ある→循環不全を先に治療／血圧が保たれている→うっ血の治療も並行</p>

<div class="kn-danger">
  注意：肺水腫が極めて重症でSpO₂低下・呼吸不全を来している場合は、酸素投与・NPPV（非侵襲的陽圧換気）は循環管理と<b>同時並行</b>で行う
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>Forrester IV＝CI&lt;2.2、PCWP&gt;18の最重症病態</li>
  <li>循環不全（Cold）の改善が肺うっ血（Wet）の改善より優先</li>
  <li>低血圧時はまずカテコラミン、安定後に利尿薬・血管拡張薬</li>
  <li>重症呼吸不全時は酸素・NPPVを循環管理と並行して行う</li>
</ul>
`
  },
  {
    id: 'kn_antiarrhythmics_vaughan_williams',
    title: '抗不整脈薬まとめ（Vaughan Williams分類）',
    subject: '循環器',
    tags: ['循環器', '薬理'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'VT/VF→アミオダロン／AMI後VT→リドカイン／PSVT→ATP・ベラパミル／Afレートコントロール→β遮断薬／アミオダロン→肺・甲状腺副作用',
    html: `
<p class="kn-lead">国試ではまずVaughan Williams分類（Ⅰ〜Ⅳ群）を覚えるのが大事。</p>

<h4 class="kn-h">全体像</h4>
<table class="kn-table">
  <tr><th>分類</th><th>作用</th><th>代表薬</th></tr>
  <tr><td>Ⅰ群</td><td>Naチャネル遮断</td><td>キニジン、リドカイン、フレカイニド</td></tr>
  <tr><td>Ⅱ群</td><td>β遮断</td><td>ビソプロロール、プロプラノロール</td></tr>
  <tr><td>Ⅲ群</td><td>Kチャネル遮断</td><td>アミオダロン、ソタロール</td></tr>
  <tr><td>Ⅳ群</td><td>Caチャネル遮断</td><td>ベラパミル</td></tr>
</table>

<h4 class="kn-h">Ⅰ群：Naチャネル遮断薬（活動電位0相の抑制）</h4>
<ul class="kn-list">
  <li><b>Ia群</b>（キニジン、ジソピラミド）：QRS延長・QT延長。適応は心房細動、発作性上室頻拍</li>
  <li><b>Ib群</b>（リドカイン、メキシレチン）：適応は心室性不整脈、特に急性心筋梗塞後の心室頻拍・心室細動</li>
  <li><b>Ic群</b>（フレカイニド、ピルシカイニド）：Naチャネルを強力に抑制。適応は発作性心房細動。<b class="kn-contra">器質的心疾患には禁忌</b></li>
</ul>

<h4 class="kn-h">Ⅱ群：β遮断薬</h4>
<ul class="kn-list">
  <li>心房細動→レートコントロール</li>
  <li>PSVT→房室結節抑制</li>
  <li>CPVT（カテコラミン誘発多形性VT）→第一選択</li>
</ul>

<h4 class="kn-h">Ⅲ群：Kチャネル遮断薬</h4>
<p class="kn-lead">活動電位持続時間↑→QT延長。適応：心室頻拍、心室細動、難治性心房細動。</p>
<div class="kn-danger kn-critical">
  <b>アミオダロンの副作用（超頻出）</b>：間質性肺炎、甲状腺機能異常、角膜色素沈着、肝障害
</div>

<h4 class="kn-h">Ⅳ群：Caチャネル遮断薬</h4>
<p class="kn-lead">ベラパミル、ジルチアゼム。適応：発作性上室頻拍（PSVT）、心房細動（レートコントロール）。</p>

<h4 class="kn-h">国試頻出：不整脈ごとの使い分け</h4>
<table class="kn-table">
  <tr><th>不整脈</th><th>第一選択</th></tr>
  <tr><td>PSVT</td><td>ATP、ベラパミル</td></tr>
  <tr><td>心房細動（レート）</td><td>β遮断薬、ベラパミル</td></tr>
  <tr><td>心房細動（リズム）</td><td>ピルシカイニド、フレカイニド</td></tr>
  <tr><td>VT/VF</td><td>アミオダロン</td></tr>
  <tr><td>急性心筋梗塞後VT</td><td>リドカイン</td></tr>
</table>

<h4 class="kn-h">心不全患者では？</h4>
<div class="kn-danger">
  Naチャネル遮断薬（特にIc群）は死亡率を上げるため注意。HFrEFではβ遮断薬・アミオダロンが比較的安全（→<span class="kn-note">[[ファンタスティック・フォー（心不全）]]も参照</span>）
</div>

<h4 class="kn-h">国試で超重要な副作用まとめ</h4>
<table class="kn-table">
  <tr><th>薬</th><th>副作用</th></tr>
  <tr><td>アミオダロン</td><td>間質性肺炎、甲状腺障害</td></tr>
  <tr><td>ジソピラミド</td><td>抗コリン作用</td></tr>
  <tr><td>β遮断薬</td><td>徐脈</td></tr>
  <tr><td>ベラパミル</td><td>房室ブロック</td></tr>
  <tr><td>ピルシカイニド</td><td>器質的心疾患で催不整脈</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>VT/VF→アミオダロン、AMI後VT→リドカイン</li>
  <li>PSVT→ATP・ベラパミル、Afレートコントロール→β遮断薬</li>
  <li>Ic群は器質的心疾患・心不全に禁忌</li>
  <li>アミオダロンは肺・甲状腺・角膜・肝の副作用に注意</li>
</ul>
`
  },
  {
    id: 'kn_verapamil_wpw_af',
    title: 'PSVTとベラパミル：WPW＋心房細動では禁忌',
    subject: '循環器',
    tags: ['循環器', '薬理'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「AV結節が悪いならCa拮抗薬OK」「副伝導路が悪いならCa拮抗薬NG」',
    html: `
<p class="kn-lead">PSVTのほとんど（AVNRT・AVRT）ではベラパミルやジルチアゼムが使える。ただし<b>WPW症候群＋心房細動</b>（幅広いQRS頻拍に見える）では使ってはいけない。</p>

<h4 class="kn-h">①使える場合：AV結節が回路に含まれるPSVT</h4>
<p class="kn-lead">代表：AVNRT（房室結節リエントリー性頻拍）、正方向性AVRT（orthodromic AVRT）</p>
<div class="kn-danger">
  ベラパミル → AV結節のCaチャネルを抑制 → AV結節の伝導を遅くする → リエントリー回路を遮断 → PSVT停止
</div>

<h4 class="kn-h">②使えない場合：WPW症候群＋心房細動（超重要）</h4>
<p class="kn-lead">心房細動 → 副伝導路（Kent束）→ 心室へ高速伝導、という状況でベラパミルを使うと——</p>
<div class="kn-danger kn-critical">
  AV結節が抑制される → AV結節×、Kent束○ → 刺激が全部Kent束を通るようになる → 心室レートがさらに上昇 → <b>心室細動（VF）へ移行する危険</b>
</div>

<h4 class="kn-h">国試で超頻出</h4>
<p class="kn-lead">「不規則で幅広いQRS頻拍」＋「既往にWPW」→ まずWPW合併心房細動を疑う。</p>
<div class="kn-danger kn-critical">
  このとき禁忌：<b class="kn-contra">ベラパミル・ジルチアゼム・β遮断薬・ジギタリス・アデノシン（ATP）</b> — 全部AV結節を抑制する薬
</div>

<h4 class="kn-h">では何を使う？</h4>
<ul class="kn-list">
  <li><b>血行動態安定</b>：プロカインアミド（海外ガイドライン）、日本ではピルシカイニド・シベンゾリンなど</li>
  <li><b>血行動態不安定</b>：同期電気的除細動（カルディオバージョン）</li>
</ul>

<h4 class="kn-h">まとめ</h4>
<table class="kn-table">
  <tr><th>病態</th><th>ベラパミル</th></tr>
  <tr><td>AVNRT</td><td class="kn-up">⭕</td></tr>
  <tr><td>正方向性AVRT</td><td class="kn-up">⭕</td></tr>
  <tr><td>WPW＋心房細動</td><td class="kn-down">❌禁忌</td></tr>
  <tr><td>幅広い不規則頻拍（WPW疑い）</td><td class="kn-down">❌禁忌</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>AVNRT・正方向性AVRTにはベラパミル有効</li>
  <li>WPW＋心房細動（幅広い不規則頻拍）にはAV結節抑制薬は全て禁忌</li>
  <li>禁忌薬使用でKent束のみの伝導となりVFに移行しうる</li>
  <li>血行動態不安定なら電気的除細動が優先</li>
</ul>
`
  },
  {
    id: 'kn_psvt_vs_pseudo_vt',
    title: 'PSVTとpseudo VT（偽性心室頻拍）の鑑別',
    subject: '循環器',
    tags: ['循環器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「規則的」→PSVT／「不規則なwide QRS」→pseudo VT（WPW＋Af）（[[PSVTとベラパミル：WPW＋心房細動では禁忌]]も参照）',
    html: `
<p class="kn-lead">PSVTとpseudo VT（偽性心室頻拍）は別物だが、臨床では混同しやすいので整理する。</p>

<h4 class="kn-h">①PSVT（Paroxysmal Supraventricular Tachycardia）</h4>
<p class="kn-lead">発作性上室頻拍の総称。代表：AVNRT、AVRT。</p>
<ul class="kn-list">
  <li>心電図：規則正しい（regular）、QRSは通常狭い（narrow QRS）、150〜250 bpm</li>
</ul>

<h4 class="kn-h">②pseudo VT（偽性心室頻拍）</h4>
<p class="kn-lead">正式な病名ではなく、WPW症候群に心房細動（Af）が合併して幅広いQRS頻拍になりVTに見える状態。英語ではPre-excited atrial fibrillationということが多い。</p>
<div class="kn-danger">
  機序：Af → 副伝導路（Kent束）→ 高速で心室へ伝導 → 幅広いQRS頻拍
</div>
<ul class="kn-list">
  <li>心電図：不規則（irregular）、QRS幅広い、心拍数250〜300以上になることも</li>
</ul>

<h4 class="kn-h">VTとの鑑別</h4>
<table class="kn-table">
  <tr><th></th><th>VT</th><th>pseudo VT</th></tr>
  <tr><td>RR間隔</td><td>規則的</td><td>不規則</td></tr>
  <tr><td>QRS</td><td>幅広い</td><td>幅広い</td></tr>
  <tr><td>P波</td><td>AV解離</td><td>心房細動</td></tr>
  <tr><td>原因</td><td>心室起源</td><td>WPW＋Af</td></tr>
</table>

<h4 class="kn-h">PSVTとの違い</h4>
<table class="kn-table">
  <tr><th></th><th>PSVT</th><th>pseudo VT</th></tr>
  <tr><td>起源</td><td>上室性リエントリー</td><td>Af＋副伝導路</td></tr>
  <tr><td>RR間隔</td><td>規則的</td><td>不規則</td></tr>
  <tr><td>QRS</td><td>狭いことが多い</td><td>幅広い</td></tr>
  <tr><td>ベラパミル</td><td class="kn-up">⭕</td><td class="kn-down">❌禁忌</td></tr>
</table>

<h4 class="kn-h">なぜベラパミルが危険か</h4>
<div class="kn-danger kn-critical">
  pseudo VTでベラパミルを投与すると、AV結節↓・Kent束のみ伝導 → 心室レートさらに上昇 → VF（心室細動）になることがある
</div>

<h4 class="kn-h">国試の超重要ポイント</h4>
<p class="kn-lead">「幅広いQRS頻拍＋不規則」→ まずWPW合併Af（pseudo VT）を疑う。この場合ATP・ベラパミル・β遮断薬・ジギタリスは禁忌。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>PSVT＝AVNRTやAVRTによる規則的な上室頻拍</li>
  <li>pseudo VT＝WPW＋心房細動による不規則な幅広いQRS頻拍</li>
  <li>「規則的」→PSVT、「不規則なwide QRS」→pseudo VT（WPW＋Af）と反射的に判断する</li>
</ul>
`
  },
  {
    id: 'kn_valve_auscultation_sites',
    title: '弁膜症の聴診部位（三尖弁を中心に）',
    subject: '循環器',
    tags: ['循環器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'APETM＝Aortic(右2)・Pulmonic(左2)・Erb(左3)・Tricuspid(左4-5)・Mitral(心尖部)。上から順に覚える',
    html: `
<p class="kn-lead">三尖弁の音を最もよく聴取する場所は<b>胸骨左縁第4〜5肋間（左下胸骨縁：Left Lower Sternal Border, LLSB）</b>。</p>

<h4 class="kn-h">5つの基本的な弁膜症の聴診部位</h4>
<table class="kn-table">
  <tr><th>弁</th><th>聴診部位</th></tr>
  <tr><td>大動脈弁</td><td>右第2肋間胸骨縁</td></tr>
  <tr><td>肺動脈弁</td><td>左第2肋間胸骨縁</td></tr>
  <tr><td>Erb領域</td><td>左第3肋間胸骨縁</td></tr>
  <tr><td>三尖弁</td><td>左第4〜5肋間胸骨縁</td></tr>
  <tr><td>僧帽弁</td><td>心尖部（左第5肋間鎖骨中線）</td></tr>
</table>
<img class="kn-img" src="knowledge_images/auscult_diagram1.jpg" alt="聴診部位の図（前面）">
<div class="kn-img-cap">聴診部位：Aortic/Pulmonic（第2肋間）、Tricuspid（左第3〜5肋間）、Mitral（心尖部）</div>
<img class="kn-img" src="knowledge_images/auscult_diagram2.jpg" alt="聴診部位の図（正中線基準）">
<div class="kn-img-cap">正中線・鎖骨中線を基準にした4部位の位置関係</div>
<img class="kn-img" src="knowledge_images/auscult_diagram3.jpg" alt="聴診部位の図（Erb's pointを含む）">
<div class="kn-img-cap">Erb's pointを含む5聴診部位の全体図</div>

<h4 class="kn-h">なぜ右心系なのに左胸骨縁で聴くのか</h4>
<p class="kn-lead">解剖学的には三尖弁は右心系だが、心臓が胸郭内で少し左に傾いているため、三尖弁の音は左下胸骨縁で最もよく聞こえる。</p>

<h4 class="kn-h">国試頻出：三尖弁逆流（TR）の雑音</h4>
<div class="kn-danger">
  聴診部位：左下胸骨縁（第4〜5肋間）<br>
  特徴：全収縮期雑音（holosystolic murmur）、<b>吸気で増強する（Carvallo徴候）</b>
</div>

<h4 class="kn-h">Carvallo徴候とは</h4>
<p class="kn-lead">吸気 → 静脈還流↑ → 右心系への血流↑ → 三尖弁逆流雑音↑</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>APETM＝Aortic（右2）・Pulmonic（左2）・Erb（左3）・Tricuspid（左4-5）・Mitral（心尖部）</li>
  <li>三尖弁逆流はCarvallo徴候（吸気で雑音増強）が特徴</li>
  <li>三尖弁は右心系だが心臓の傾きにより左胸骨縁でよく聞こえる</li>
</ul>
`
  },
  {
    id: 'kn_ring_sideroblasts',
    title: '環状鉄芽球（Ring sideroblast）',
    subject: '血液',
    tags: ['血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「鉄はあるのに使えない」が本質。鑑別語呂「B6・アルコール・INHでリングができる」＝B6欠乏・アルコール・イソニアジド・MDS',
    html: `
<p class="kn-lead">鉄はあるのにヘム合成がうまくできず、鉄がミトコンドリア内に蓄積した赤芽球。骨髄の鉄染色（ベルリン青染色）で、核の周りを鉄顆粒がリング状に取り囲むように見える。</p>

<img class="kn-img" src="knowledge_images/ring_sideroblast1.jpg" alt="環状鉄芽球（骨髄穿刺、プルシアンブルー染色）">
<div class="kn-img-cap">骨髄穿刺・プルシアンブルー染色：核周囲にリング状の鉄沈着（ミトコンドリア内鉄蓄積）</div>
<img class="kn-img" src="knowledge_images/ring_sideroblast2.jpg" alt="環状鉄芽球の高倍率像">
<div class="kn-img-cap">高倍率像：赤芽球核周囲の青色顆粒（鉄）</div>
<img class="kn-img" src="knowledge_images/ring_sideroblast3.jpg" alt="環状鉄芽球（末梢血・骨髄塗抹）">
<div class="kn-img-cap">環状鉄芽球の別症例</div>

<h4 class="kn-h">どうしてできるのか</h4>
<div class="kn-danger">
  正常：鉄→ミトコンドリア→ヘム合成→ヘモグロビン<br>
  環状鉄芽球：鉄はある→ヘム合成障害→鉄が使えない→ミトコンドリア内に蓄積→核の周囲にリング状に並ぶ
</div>

<h4 class="kn-h">原因（超重要）</h4>
<ul class="kn-list">
  <li><b>①骨髄異形成症候群（MDS）</b>：特にMDS-RS（MDS with ring sideroblasts）が有名で国試最頻出</li>
  <li><b>②ビタミンB6（ピリドキシン）欠乏</b>：B6はδ-ALA synthase（ヘム合成の律速酵素）の補酵素。欠乏するとヘム合成が障害される</li>
  <li><b>③薬剤</b>：イソニアジド、クロラムフェニコール、リネゾリド</li>
  <li><b>④アルコール</b>：慢性飲酒でも起こる</li>
  <li><b>⑤銅欠乏</b>：稀だが重要</li>
</ul>

<h4 class="kn-h">どんな貧血になるか</h4>
<p class="kn-lead">鉄芽球性貧血（sideroblastic anemia）</p>

<h4 class="kn-h">検査所見</h4>
<table class="kn-table">
  <tr><th>項目</th><th>所見</th></tr>
  <tr><td>血清鉄</td><td class="kn-up">↑</td></tr>
  <tr><td>フェリチン</td><td class="kn-up">↑</td></tr>
  <tr><td>TIBC</td><td>↓〜正常</td></tr>
  <tr><td>骨髄鉄</td><td class="kn-up">↑</td></tr>
</table>

<h4 class="kn-h">鉄欠乏性貧血との違い</h4>
<table class="kn-table">
  <tr><th></th><th>鉄欠乏性貧血</th><th>鉄芽球性貧血</th></tr>
  <tr><td>血清鉄</td><td class="kn-down">↓</td><td class="kn-up">↑</td></tr>
  <tr><td>フェリチン</td><td class="kn-down">↓</td><td class="kn-up">↑</td></tr>
  <tr><td>環状鉄芽球</td><td class="kn-down">❌</td><td class="kn-up">⭕</td></tr>
</table>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「小球性貧血」「血清鉄が高い」「骨髄に環状鉄芽球」→ 鉄芽球性貧血</li>
  <li>MDS-RSが原因の最頻出</li>
  <li>B6欠乏・アルコール・イソニアジドも原因になる</li>
  <li>鉄欠乏性貧血とは血清鉄・フェリチンの変化が逆</li>
</ul>
`
  },
  {
    id: 'kn_conduction_vs_transcortical_sensory_aphasia',
    title: '伝導失語と超皮質性感覚失語の鑑別',
    subject: '神経',
    tags: ['神経'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「理解できないのに復唱できる」→超皮質性感覚失語／「流暢だが復唱だけできない」→伝導失語',
    html: `
<p class="kn-lead">どちらも流暢に話せるが言われたことを理解するのが苦手な失語で混同しやすい。一番大事な違いは<b>復唱（repetition）ができるかどうか</b>。</p>

<h4 class="kn-h">比較表</h4>
<table class="kn-table">
  <tr><th></th><th>伝導失語</th><th>超皮質性感覚失語</th></tr>
  <tr><td>病変部位</td><td>弓状束</td><td>ウェルニッケ野周辺（境界領域）</td></tr>
  <tr><td>発話</td><td>流暢</td><td>流暢</td></tr>
  <tr><td>聴理解</td><td>低下</td><td>低下</td></tr>
  <tr><td>復唱</td><td class="kn-down">❌障害</td><td class="kn-up">⭕保たれる</td></tr>
  <tr><td>錯語</td><td>多い</td><td>多い</td></tr>
  <tr><td>エコラリア（反響言語）</td><td>なし</td><td>あり</td></tr>
</table>

<h4 class="kn-h">①伝導失語（Conduction aphasia）</h4>
<p class="kn-lead">病変：弓状束（arcuate fasciculus）。Wernicke野──弓状束──Broca野の連絡線が切れる。</p>
<div class="kn-danger">
  理解した内容を「聞く」→「話す」へ変換できないため、<b>復唱ができない</b>（理解はしているのに繰り返せない）
</div>
<p class="kn-lead">特徴：流暢な発話／理解は比較的保たれることが多い／復唱障害（最大の特徴）</p>

<h4 class="kn-h">②超皮質性感覚失語（Transcortical sensory aphasia）</h4>
<p class="kn-lead">病変：ウェルニッケ野そのものではなく、その周辺の連合野（MCA-PCA境界領域など）。</p>
<div class="kn-danger">
  意味理解ができないが、Wernicke野⇔Broca野の回路（弓状束）は残っている → <b>聞いた言葉をそのまま繰り返せる</b>
</div>
<p class="kn-lead">エコラリア（反響言語）＝質問をそのまま繰り返す。これが超皮質性感覚失語で有名。</p>

<h4 class="kn-h">なぜ復唱だけ保たれるのか</h4>
<p class="kn-lead">耳→Wernicke野→弓状束→Broca野、というルートは無事なため、意味は分からないがオウム返しはできる。</p>

<h4 class="kn-h">失語のまとめ</h4>
<table class="kn-table">
  <tr><th>失語</th><th>流暢性</th><th>理解</th><th>復唱</th></tr>
  <tr><td>Broca失語</td><td>❌</td><td>⭕</td><td>❌</td></tr>
  <tr><td>Wernicke失語</td><td>⭕</td><td>❌</td><td>❌</td></tr>
  <tr><td>伝導失語</td><td>⭕</td><td>△〜⭕</td><td>❌</td></tr>
  <tr><td>超皮質性感覚失語</td><td>⭕</td><td>❌</td><td>⭕</td></tr>
  <tr><td>超皮質性運動失語</td><td>❌</td><td>⭕</td><td>⭕</td></tr>
  <tr><td>全失語</td><td>❌</td><td>❌</td><td>❌</td></tr>
</table>

<h4 class="kn-h">国試の鉄則</h4>
<ul class="kn-list kn-points">
  <li>「理解できないのに復唱できる」→ 超皮質性感覚失語</li>
  <li>「流暢だが復唱だけできない」→ 伝導失語</li>
  <li>この2つは「復唱」の可否で一発鑑別できる</li>
</ul>
`
  },
  {
    id: 'kn_intravascular_vs_extravascular_hemolysis',
    title: '血管内溶血と血管外溶血の違い',
    subject: '血液',
    tags: ['血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'ヘモグロビン尿＝血管内溶血／脾腫＋胆石＝血管外溶血',
    html: `
<h4 class="kn-h">結論：比較表</h4>
<table class="kn-table">
  <tr><th></th><th>血管内溶血</th><th>血管外溶血</th></tr>
  <tr><td>溶血する場所</td><td>血管の中</td><td>脾臓・肝臓のマクロファージ</td></tr>
  <tr><td>遊離Hb</td><td class="kn-up">↑↑</td><td>軽度↑〜正常</td></tr>
  <tr><td>ハプトグロビン</td><td class="kn-down">↓↓↓</td><td>軽度↓</td></tr>
  <tr><td>ヘモグロビン尿</td><td class="kn-up">⭕</td><td class="kn-down">❌</td></tr>
  <tr><td>ヘモジデリン尿</td><td class="kn-up">⭕</td><td class="kn-down">❌</td></tr>
  <tr><td>LDH</td><td>↑↑</td><td>↑</td></tr>
  <tr><td>間接Bil</td><td>↑</td><td>↑</td></tr>
  <tr><td>脾腫</td><td>△</td><td>⭕</td></tr>
</table>

<h4 class="kn-h">①血管内溶血（Intravascular hemolysis）</h4>
<p class="kn-lead">赤血球が血管内で直接壊れる → Hbが血中へ放出。</p>
<div class="kn-danger">
  遊離Hb↑ → ハプトグロビンと結合 → ハプトグロビン消費 → <b>ハプトグロビン著減</b><br>
  さらにハプトグロビンが枯渇するとHbが尿へ →<b>ヘモグロビン尿</b>／尿細管細胞に鉄が蓄積→<b>ヘモジデリン尿</b>
</div>
<p class="kn-lead">原因：PNH（発作性夜間ヘモグロビン尿症）、MAHA（微小血管障害性溶血性貧血＝DIC、TTP、HUS）、機械弁、不適合輸血</p>

<h4 class="kn-h">②血管外溶血（Extravascular hemolysis）</h4>
<p class="kn-lead">赤血球が脾臓や肝臓のマクロファージに食べられる。ヘモグロビンは血中に出ないため<b class="kn-contra">ヘモグロビン尿なし</b>。</p>
<div class="kn-danger">
  Hb→ヘム→間接Bil→<b>黄疸</b>／脾臓が仕事をしすぎる→<b>脾腫</b>
</div>
<p class="kn-lead">原因：遺伝性球状赤血球症、自己免疫性溶血性貧血（温式）、サラセミア</p>

<h4 class="kn-h">国試で超重要な鑑別</h4>
<ul class="kn-list">
  <li>ハプトグロビン↓↓↓ → 血管内溶血を疑う</li>
  <li>ヘモグロビン尿 → 血管内溶血</li>
  <li>脾腫＋胆石 → 血管外溶血</li>
</ul>

<h4 class="kn-h">典型例</h4>
<ul class="kn-list">
  <li>PNH：血管内溶血、ハプトグロビン↓↓↓、ヘモグロビン尿</li>
  <li>遺伝性球状赤血球症：血管外溶血、脾腫、胆石</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>血管内溶血＝「中で壊れて尿に出る」（ハプトグロビン著減、Hb尿）</li>
  <li>血管外溶血＝「脾臓で食べられて脾腫になる」（間接Bil↑、脾腫、胆石）</li>
  <li>PNH／MAHA系は血管内、遺伝性球状赤血球症／温式AIHAは血管外の代表</li>
</ul>
`
  },
  {
    id: 'kn_pnh_d_dimer_thrombosis',
    title: 'PNHで血栓症（Dダイマー上昇）が起こりやすい機序',
    subject: '血液',
    tags: ['血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「血管内溶血＝Dダイマー↑」ではなく「PNH＝血栓症を起こしやすい」と覚えるのが正確（[[血管内溶血と血管外溶血の違い]]も参照）',
    html: `
<p class="kn-lead">「血管内溶血なら必ずDダイマーが上がる」わけではない。特に<b>PNH（発作性夜間ヘモグロビン尿症）</b>ではDダイマーが上がりやすい、という理解が大事。</p>

<h4 class="kn-h">なぜPNHでDダイマーが上がるのか</h4>
<div class="kn-danger">
  ①血管内溶血：赤血球が壊れる→大量の遊離ヘモグロビン（free Hb）が放出<br>
  ②NO（一酸化窒素）が消費される：Free HbはNOと強く結合→NO↓<br>
  ③NOが減ると血栓ができやすい：NOには血小板凝集抑制・血管拡張の作用がある→NO↓→血小板活性化→血栓形成↑<br>
  ④血栓ができてさらに溶ける：血栓→線溶系が働く→フィブリン分解産物（FDP）→<b>Dダイマー↑</b>
</div>

<h4 class="kn-h">PNHではさらに</h4>
<div class="kn-danger kn-critical">
  PIGA遺伝子異常 → CD55・CD59欠損 → 補体活性化 → 血小板も活性化 → <b>静脈血栓症</b>が起こりやすい
</div>
<p class="kn-lead">好発部位（国試頻出）：Budd-Chiari症候群（肝静脈血栓）、門脈血栓、脳静脈洞血栓</p>
<p class="kn-lead">LDH↑・ハプトグロビン↓・ヘモグロビン尿・Dダイマー↑の組み合わせを見たら<b>血栓症合併PNH</b>を疑う。</p>

<h4 class="kn-h">他の血管内溶血との違い</h4>
<p class="kn-lead">不適合輸血や機械弁など他の血管内溶血でも、赤血球破壊→NO消費→血小板活性化・血管収縮という機序で血栓傾向は上がる（PNHに限らず共通）。ただしPNHだけが特に血栓を起こしやすい。</p>

<h4 class="kn-h">なぜPNHだけ特別なのか</h4>
<ul class="kn-list">
  <li><b>①溶血が慢性的・持続的</b>：機械弁や輸血副反応の溶血は一時的なことが多いが、PNHでは毎日補体による溶血が起こり、NO枯渇状態が慢性的に続く</li>
  <li><b>②血小板そのものも補体に攻撃される</b>：PIGA変異によるCD55・CD59欠損は赤血球だけでなく血小板にも起こる→補体→血小板活性化→血小板由来マイクロパーティクル放出→凝固亢進（他の血管内溶血にはない特徴）</li>
  <li><b>③凝固系そのものも活性化</b>：組織因子発現↑、血小板活性化↑、線溶抑制など複数の機序が重なる</li>
</ul>

<h4 class="kn-h">イメージ</h4>
<p class="kn-lead">普通の血管内溶血：赤血球破壊→NO↓→軽度血栓傾向<br>
PNH：赤血球破壊＋血小板補体活性化＋慢性NO枯渇＋凝固系活性化→著明な血栓形成</p>
<p class="kn-lead">鎌状赤血球症（SCD）も血管内溶血＋血栓傾向が強い疾患で、「溶血→NO枯渇→血管障害」の代表例としてPNHと並んで説明されることが多い。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>「血管内溶血＝Dダイマー↑」ではなく「PNH＝血栓症を起こしやすい」が正確</li>
  <li>機序：遊離Hb→NO消費→血小板活性化・血栓形成→二次的にDダイマー↑</li>
  <li>PNHはさらに血小板自体が補体に攻撃され凝固亢進が加わる</li>
  <li>好発血栓部位：Budd-Chiari症候群、門脈血栓、脳静脈洞血栓</li>
</ul>
`
  },
  {
    id: 'kn_all_vs_aml_lymphadenopathy',
    title: '急性白血病のリンパ節腫脹：ALLとAMLの違い',
    subject: '血液',
    tags: ['血液'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: 'ALL＝「リンパ節が腫れる白血病」／AML＝「骨髄中心。リンパ節腫脹は少ない」／AML M5＝「歯肉と組織に浸潤する」',
    html: `
<p class="kn-lead">急性骨髄性白血病（AML）でもリンパ節腫脹は起こりえるが、頻度は低い。</p>

<h4 class="kn-h">結論</h4>
<table class="kn-table">
  <tr><th>疾患</th><th>リンパ節腫脹</th></tr>
  <tr><td>急性リンパ性白血病（ALL）</td><td>多い</td></tr>
  <tr><td>急性骨髄性白血病（AML）</td><td>少ない</td></tr>
  <tr><td>慢性リンパ性白血病（CLL）</td><td>非常に多い</td></tr>
  <tr><td>慢性骨髄性白血病（CML）</td><td>少ない</td></tr>
</table>

<h4 class="kn-h">なぜAMLでは少ないのか</h4>
<p class="kn-lead">AMLでは骨髄内で骨髄系芽球が増殖することが主病変。貧血・血小板減少・好中球減少・肝脾腫はよくみられるが、リンパ節への浸潤はALLほど多くない。</p>

<h4 class="kn-h">ALLではなぜ多いのか</h4>
<p class="kn-lead">ALLはリンパ系細胞の腫瘍のため、リンパ節・肝臓・脾臓・中枢神経・精巣などのリンパ組織への浸潤を起こしやすい。「小児で発熱＋貧血＋著明なリンパ節腫脹」ならまずALLを疑う。</p>

<h4 class="kn-h">例外：AMLでもリンパ節腫脹が目立つ病型</h4>
<div class="kn-danger kn-critical">
  <b>急性単球性白血病（AML M5）</b>は組織浸潤傾向が強いことで有名。起こしやすいもの：歯肉腫脹（超頻出）、皮膚浸潤（白血病皮膚）、肝脾腫、リンパ節腫脹
</div>

<h4 class="kn-h">国試でのひっかけ</h4>
<p class="kn-lead">「著明なリンパ節腫脹を伴う急性白血病」→ まずALLを考える。ただし「歯肉腫脹＋リンパ節腫脹」なら AML M5（急性単球性白血病）を忘れないようにする。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>ALL＞AMLでリンパ節腫脹が目立つ</li>
  <li>CLLは非常に多い、CMLは少ない</li>
  <li>AML M5（急性単球性白血病）は例外的に歯肉腫脹・組織浸潤が強い</li>
</ul>
`
  },
  {
    id: 'kn_vomiting_hypokalemia',
    title: '嘔吐による低カリウム血症の機序',
    subject: '腎臓',
    tags: ['腎臓', '消化器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '嘔吐→代謝性アルカローシス＋アルドステロン増加→K喪失（胃液中のK喪失が本質ではない）',
    html: `
<p class="kn-lead">嘔吐で低カリウム血症になるのは、胃液に含まれるK⁺を直接失うからではない（胃液のK⁺濃度はそれほど高くない）。主な原因は<b>代謝性アルカローシス</b>と<b>腎臓からのK排泄亢進</b>。</p>

<h4 class="kn-h">①嘔吐で胃酸（HCl）を失う</h4>
<p class="kn-lead">嘔吐 → H⁺喪失 → 代謝性アルカローシス</p>

<h4 class="kn-h">②H⁺が減ると細胞内外でイオン交換</h4>
<div class="kn-danger">
  体はH⁺を細胞外へ出そうとし、その代わりにK⁺が細胞内へ移動する（H⁺：細胞内→細胞外、K⁺：細胞外→細胞内）→ 血清K⁺低下
</div>

<h4 class="kn-h">③嘔吐で脱水になる</h4>
<p class="kn-lead">嘔吐 → 体液量減少 → RAA系活性化</p>

<h4 class="kn-h">④アルドステロンが増える</h4>
<div class="kn-danger kn-critical">
  アルドステロン↑（Na再吸収↑、K排泄↑）→ 腎臓からK排泄↑ → 低K血症
</div>

<h4 class="kn-h">まとめ</h4>
<p class="kn-lead">嘔吐 → ①H⁺喪失→代謝性アルカローシス→Kが細胞内へ／②脱水→アルドステロン↑→尿中K排泄↑ → 低K血症</p>

<h4 class="kn-h">国試で超重要な関連所見</h4>
<ul class="kn-list">
  <li>低Cl血症、低K血症、代謝性アルカローシス、<b>尿Cl低値（&lt;20 mEq/L）</b>の組み合わせが典型的</li>
  <li>尿Clが低いのは脱水のため腎臓がCl⁻を必死に再吸収するから</li>
</ul>

<h4 class="kn-h">ひっかけポイント</h4>
<div class="kn-danger">
  <b class="kn-contra">「胃液にK⁺がたくさん含まれるから低Kになる」は不正確</b>。本質は「嘔吐→代謝性アルカローシス＋アルドステロン増加→K喪失」
</div>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>嘔吐による低K血症の本態は胃液中のK喪失ではない</li>
  <li>代謝性アルカローシスによる細胞内シフトとアルドステロン分泌亢進による尿中排泄増加が主機序</li>
  <li>低Cl血症・低K血症・代謝性アルカローシス・尿Cl低値がセットで出る</li>
</ul>
`
  },
  {
    id: 'kn_1mg_dexamethasone_suppression_test',
    title: 'デキサメタゾン1mg抑制試験（Cushing症候群スクリーニング）',
    subject: '内分泌',
    tags: ['内分泌'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '1mg＝「あるかないか」を調べる（スクリーニング）／8mg＝「どこから出ているか」を調べる（鑑別）',
    html: `
<p class="kn-lead">デキサメタゾン（1mg）抑制試験（1mg DST）はクッシング症候群（Cushing syndrome）の<b>スクリーニング検査</b>。</p>

<h4 class="kn-h">原理</h4>
<div class="kn-danger">
  デキサメタゾン投与 → 下垂体が「コルチゾールが多い」と勘違い → ACTH↓ → コルチゾール↓（負のフィードバックを利用した検査）
</div>

<h4 class="kn-h">方法</h4>
<p class="kn-lead">夜11時ごろデキサメタゾン1mg内服 → 翌朝8時ごろ血中コルチゾール測定</p>

<h4 class="kn-h">判定</h4>
<ul class="kn-list">
  <li>正常：コルチゾールが十分に抑制される（血清コルチゾール≦1.8 μg/dL＝50 nmol/L で正常）</li>
  <li><b class="kn-contra">異常</b>：デキサメタゾン投与してもコルチゾールが抑制されない → クッシング症候群を疑う</li>
</ul>

<h4 class="kn-h">次にどうするか</h4>
<div class="kn-danger">
  1mg DSTで異常 → ACTH測定<br>
  ACTH低値 → <b>ACTH非依存性</b>（副腎腺腫、副腎癌、副腎過形成）<br>
  ACTH正常〜高値 → <b>ACTH依存性</b>（クッシング病＝下垂体腺腫、異所性ACTH症候群）
</div>

<h4 class="kn-h">8mgデキサメタゾン抑制試験との違い</h4>
<table class="kn-table">
  <tr><th></th><th>1mg DST</th><th>8mg DST</th></tr>
  <tr><td>目的</td><td>スクリーニング</td><td>病型鑑別</td></tr>
  <tr><td>正常人</td><td>抑制される</td><td>抑制される</td></tr>
  <tr><td>クッシング病</td><td>抑制されない</td><td>部分的に抑制される</td></tr>
  <tr><td>異所性ACTH症候群</td><td>抑制されない</td><td>抑制されない</td></tr>
</table>

<h4 class="kn-h">国試の流れ</h4>
<p class="kn-lead">クッシング疑い → 1mg DST → 抑制されない → ACTH測定 → ACTH依存性か非依存性かを判断</p>

<h4 class="kn-h">国試頻出ポイント</h4>
<p class="kn-lead">「満月様顔貌・中心性肥満・紫色皮膚線条」→ まず1mgデキサメタゾン抑制試験を考える。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>1mg DST＝スクリーニング（あるかないか）</li>
  <li>8mg DST＝病型鑑別（どこから出ているか）</li>
  <li>1mg DST異常後はACTH測定でACTH依存性/非依存性を判別</li>
</ul>
`
  },
  {
    id: 'kn_adrenal_adenoma_vs_carcinoma',
    title: '副腎腺腫と副腎皮質癌の違い',
    subject: '内分泌',
    tags: ['内分泌'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '小さくて境界明瞭→腺腫／大きくて不整＋男性化→副腎皮質癌（[[デキサメタゾン1mg抑制試験（Cushing症候群スクリーニング）]]も参照）',
    html: `
<h4 class="kn-h">結論</h4>
<table class="kn-table">
  <tr><th></th><th>副腎腺腫</th><th>副腎皮質癌</th></tr>
  <tr><td>良悪性</td><td class="kn-up">良性</td><td class="kn-down">悪性</td></tr>
  <tr><td>頻度</td><td>多い</td><td>非常に稀</td></tr>
  <tr><td>大きさ</td><td>小さい（&lt;4cmが多い）</td><td>大きい（&gt;4〜6cmが多い）</td></tr>
  <tr><td>境界</td><td>平滑</td><td>不整</td></tr>
  <tr><td>壊死・出血</td><td>なし</td><td>多い</td></tr>
  <tr><td>転移</td><td>なし</td><td>肝・肺へ転移</td></tr>
  <tr><td>ホルモン産生</td><td>あり/なし</td><td>ありのことが多い</td></tr>
</table>

<h4 class="kn-h">①副腎腺腫（Adrenal adenoma）</h4>
<p class="kn-lead">副腎偶発腫（incidentaloma）として見つかることが多い。</p>
<ul class="kn-list">
  <li><b>機能性腺腫</b>：コルチゾール産生→クッシング症候群／アルドステロン産生→原発性アルドステロン症（Conn症候群）</li>
  <li><b>非機能性腺腫</b>：ホルモンを出さない（実はかなり多い）</li>
</ul>
<p class="kn-lead">画像所見：CTで小さい・境界明瞭・脂肪成分が多い（低吸収）</p>

<h4 class="kn-h">②副腎皮質癌（Adrenocortical carcinoma：ACC）</h4>
<p class="kn-lead">非常に稀だが悪性度が高い腫瘍。約半数以上でホルモンを分泌、最も多いのはコルチゾール（クッシング症候群）。</p>
<div class="kn-danger kn-critical">
  アンドロゲンも出すことがある：女性では多毛・男性化・無月経をきたす（国試頻出）
</div>
<p class="kn-lead">画像所見：CTで大きい（4〜6cm以上）・不整形・壊死・石灰化・周囲浸潤を認める</p>

<h4 class="kn-h">副腎癌を疑う状況</h4>
<ul class="kn-list">
  <li>急速に進行するクッシング症候群</li>
  <li>男性化徴候を伴う副腎腫瘍</li>
  <li>6cmを超える副腎腫瘍</li>
</ul>

<h4 class="kn-h">ホルモン検査の流れ</h4>
<p class="kn-lead">副腎腫瘍を見つけたら①コルチゾール（1mgデキサメタゾン抑制試験）②アルドステロン・レニン比（ARR）③カテコールアミン（褐色細胞腫の除外）を行う。</p>

<h4 class="kn-h">治療</h4>
<ul class="kn-list">
  <li>副腎腺腫：機能性→手術、非機能性小腫瘍→経過観察</li>
  <li>副腎皮質癌：外科的切除が第一選択、進行例ではミトタンを使用することがある</li>
</ul>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>小さくて境界明瞭→腺腫、大きくて不整＋男性化→副腎皮質癌</li>
  <li>女性のクッシング症候群＋多毛・男性化徴候→まず副腎皮質癌を疑う</li>
  <li>副腎皮質癌は治療の第一選択が外科的切除、進行例はミトタン</li>
</ul>
`
  },
  {
    id: 'kn_palmar_xanthoma_type3',
    title: '手掌線条黄色腫とⅢ型高脂血症',
    subject: '内分泌',
    tags: ['内分泌', '循環器'],
    date: '2026-07-02',
    source: 'ChatGPT調べ',
    mnemonic: '「手掌線条黄色腫を見たらⅢ型！」',
    html: `
<p class="kn-lead">手掌線条黄色腫（Palmar xanthoma）は手のひらのしわ（手掌線条）に沿って黄色〜橙色の脂質沈着がみられる黄色腫。見たらまず<b>Ⅲ型高脂血症（家族性異βリポ蛋白血症：Familial dysbetalipoproteinemia）</b>を疑う。</p>

<h4 class="kn-h">原因</h4>
<div class="kn-danger">
  多くは<b>ApoE2/E2（アポリポ蛋白E2ホモ接合体）</b> → レムナント（IDL、カイロミクロンレムナント）の処理ができない → コレステロール・中性脂肪が増加 → 皮膚に沈着 → 手掌線条黄色腫
</div>

<h4 class="kn-h">検査所見</h4>
<p class="kn-lead">総コレステロール↑、中性脂肪（TG）↑ — <b>TCもTGも両方高い</b>のが特徴。</p>

<h4 class="kn-h">合併症</h4>
<p class="kn-lead">レムナントリポ蛋白は動脈硬化を起こしやすいため、早発性動脈硬化・冠動脈疾患のリスクが上がる。</p>

<h4 class="kn-h">他の黄色腫との違い</h4>
<table class="kn-table">
  <tr><th>黄色腫</th><th>疾患</th></tr>
  <tr><td>腱黄色腫</td><td>家族性高コレステロール血症（IIa型）</td></tr>
  <tr><td>発疹性黄色腫</td><td>高TG血症（I型、V型）</td></tr>
  <tr><td>眼瞼黄色腫</td><td>様々な脂質異常症</td></tr>
  <tr><td>手掌線条黄色腫</td><td>Ⅲ型高脂血症</td></tr>
</table>

<h4 class="kn-h">国試での典型例</h4>
<p class="kn-lead">「手掌のしわに沿った黄色斑」「コレステロールと中性脂肪の両方が高値」→ 家族性異βリポ蛋白血症（Ⅲ型高脂血症）を選ぶ。</p>

<h4 class="kn-h">国試ポイント</h4>
<ul class="kn-list kn-points">
  <li>手掌線条黄色腫＝Ⅲ型高脂血症（ApoE2/E2ホモ接合体）</li>
  <li>TC・TGともに上昇するのが他の脂質異常症との鑑別点</li>
  <li>腱黄色腫はIIa型、発疹性黄色腫は高TG血症（I・V型）と区別する</li>
</ul>
`
  }
];
