// study_exam.js — study.html の試験モード関連ロジック（state・効果音・演出エフェクト・SRS採点連携）
// study.html からの分割。classic script として study.html のインライン <script> より前に読み込むこと。
// 全トップレベル宣言（examMode 等の let/const・関数）は共有グローバルスコープに置かれ、
// study.html 側のインラインコードと相互参照する（挙動は分割前と同一）。
// Exam mode state
let examMode = false;
let examQueue = [];
/* ⚠️⚠️ 出題キューの正本は examQueue。_examSet（所属判定）と _examOrder（DOM順）はその索引で、
   examQueue を差し替えたら必ず _examSyncQueue() を呼んで作り直すこと。

   2026-08-24: 「1科目で始めた試験が、一度誤答すると他科目を巻き込んだ複数科目の試験になる」
   不具合の修正。原因は examQueue が権威になっていなかったこと——次の問題を決める
   (_getExamTargetCard / _scrollToNextCard)・選択肢のクリック・採点(revealAnswer) の3つが
   すべて DOM を全走査しており、キュー外のカードを締め出していたのは **開始時に1度だけ**
   実行される「キュー外は display:none」の1行だけだった。開始後に DOM へ足されたカード
   （試験中リロード→自動復元が selectedSubjects へ他科目を足して _fetchSubjectCards する
   経路など）はその関所を通らないので、そのまま出題・採点され、revealAnswer が
   examBySubj[sid] を無条件に作るため別科目がセッションに生えた。
   ⚠️ 連続正解中に露見しないのは、正解時だけ _scrollToNextCard が必ずキュー内の次カードへ
      強制スクロールして視界をキュー上に固定するから。誤答時は自動スクロールが無く、
      ユーザーが自力でスクロールしてキュー外へ入り込む＝誤答は原因ではなく露見の契機。
   ⚠️ 判定を display や DOM の並びに戻さないこと（同じ穴が開く）。 */
let _examSet = new Set();
let _examOrder = [];
function _examSyncQueue() {
  _examSet = new Set(examQueue);
  // DOM順（画面の上から下）。examQueue の配列順は出題順であって DOM 順とは限らない。
  _examOrder = examQueue.slice().sort((a, b) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
}
function _examHas(card) { return !!card && _examSet.has(card); }
window._examHas = _examHas;
let examAnswered = 0;
let examCorrect = 0;
let examStreak = 0;
/* 連続正解の猶予（2026-09-28・ユーザー判断）。誤答1回までは連続数を保ち（その問題は数に足さない）、
   2問続けて外したときだけ0に戻す。猶予は次に正解した時点で復活する＝判定は _rfScoreWrong の1か所。 */
let examStreakGrace = true;
const EXAM_EFFECT_SETS = ['classic', 'neon', 'ink', 'ecg', 'space', 'retro', 'luxury'];
/* ⚠️⚠️ 2026-08-31: 試験開始ごとのランダム選択を廃止し、UIテーマから決定論的に引く形にした。
   理由は2つ。① 演出テーマ7種が持っていた「粒子の署名」（花火・雷・レイン・メダル・ブラックホール・
   除細動・ECGスイープ・墨・スポットライト・紙吹雪＝19関数）は、UIテーマ8種の分岐が先に必ず
   return するため **一度も発火していなかった**（到達不能コードだった。同コミットで削除）。
   残っていたのはラベル・フラッシュ色・×n の色・メーターの配色だけで、それがランダムに変わると
   ② ユーザーが自分で選んだUIテーマの色と半分の確率でぶつかる。「今日は何色か」が運で決まる
   状態に情報上の意味は無い。
   ⚠️ この表を「またランダムに戻す」前に、粒子の署名が復活しているかを必ず確認すること。
      復活していないなら、戻しても変わるのは色だけで、UIテーマと衝突する側に戻るだけ。
   ⚠️ frost と celestial が space を共有しているのは意図的（どちらも寒色＋金の世界観で、
      7セットに8テーマを割り当てるため）。8つ目のセットを新設するなら chapter_exam.js の
      CE_EFFECT_THEMES にも同時に足すこと（check_effect_themes_sync.js が対で検査する）。 */
const UI_TO_EXAM_SET = {
  aurora:    'neon',     // 虹色ガラス → シアン/マゼンタ/バイオレット
  brass:     'luxury',   // 真鍮 → 金・プラチナ
  cyber:     'retro',    // HUD → アーケード/CRT
  liquid:    'classic',  // 流体ピンク → 橙〜紫〜桃
  kintsugi:  'ink',      // 漆黒金継ぎ → 朱・墨・金
  celestial: 'space',    // 星図 → 青・紫・金
  abyss:     'ecg',      // 深海発光 → 緑〜赤〜シアン
  frost:     'space'     // 氷晶 → 青・紫（celestial と共有）
};
function _examSetForUi() {
  const ui = (window.MecUITheme && MecUITheme.get) ? MecUITheme.get() : 'aurora';
  return UI_TO_EXAM_SET[ui] || 'classic';
}
let examEffectSet = 'classic';
let examBySubj = {};
// 章別の集計。key = "{sid}_{章番号}"（例 "endo_1"）→ {sid, ch, correct, total}。
// 結果画面の「章別」表と中断再開の復元に使う。examBySubj と同じ寿命で扱う。
let examByChapter = {};
let _examChPrefix = null;   // selected chapter prefix for exam (e.g. "neur_ch01")

// 章名の解決。MEC_CHAPTERS（chapters_meta.js）の prefix→title から章名だけを抜く。
// title は2形式ある: 「MEC○○ 第N章 章名 解答解説」と「第N章 章名」（obg/peds）。
// どちらも「第N章」より前と末尾「解答解説」を捨てれば章名が残る。無ければ空文字。
// 初回だけ prefix→章名の辞書を作ってキャッシュする。
let _chapNameMap = null;
function _chapterName(sid, ch) {
  if (_chapNameMap === null) {
    _chapNameMap = {};
    if (typeof MEC_CHAPTERS !== 'undefined') {
      MEC_CHAPTERS.forEach(subj => (subj.chapters || []).forEach(c => {
        const m = /^(.+)_ch(\d+)$/.exec(c.prefix || '');
        if (!m) return;
        const name = (c.title || '').replace(/^.*?第\d+章\s*/, '').replace(/\s*解答解説\s*$/, '').trim();
        if (name) _chapNameMap[m[1] + '_' + parseInt(m[2], 10)] = name;
      }));
    }
  }
  return _chapNameMap[sid + '_' + ch] || '';
}

// uid から章を1件ぶん集計する。examAnswered/examBySubj を増やす箇所と対で呼ぶこと。
function _tallyChapter(uid, isCorrect) {
  const m = /^(.+)_ch(\d+)_q/.exec(uid || '');
  if (!m) return;                       // jitsu1/custom 等 ch を持たない uid は章別に出さない
  const key = m[1] + '_' + parseInt(m[2], 10);
  if (!examByChapter[key]) examByChapter[key] = { sid: m[1], ch: parseInt(m[2], 10), correct: 0, total: 0 };
  examByChapter[key].total++;
  if (isCorrect) examByChapter[key].correct++;
}
let _examTabSubj = null;    // 試験開始モーダルの章グリッドで表示中の科目タブ
let _examActiveChPrefix = null; // chapter prefix that was active when exam started
let examWrong = [];
// 採点除外（正解肢が無い）問題数。採点対象外にするため分母から差し引く。
let _examExcludedCount = 0;
let _examSessionWrongChoices = new Map(); // uid → 選んだ選択肢のテキスト（今セッション限定）
let examStartTime = null;
let examTimerInt = null;
let _examPausedMs = 0;
let _examPauseStart = null;
function _examActiveMs() { return Date.now() - examStartTime - _examPausedMs; }
function _examVisibilityHandler() {
  if (document.hidden) {
    _examPauseStart = Date.now();
  } else if (_examPauseStart !== null) {
    _examPausedMs += Date.now() - _examPauseStart;
    _examPauseStart = null;
  }
}
let _examCount = 0;
let _examSessionKey = '';
// 解答ログ(mec_attempts_v1)のセッションID。_examSessionKey は "科目:問題数" で一意にならないため別に持つ
let _attemptSessionId = '';
let _examFilterLabel = '';
let _srsReviewMode = false;
// 「今日の誤答を再履修」セッション（study.html?mode=today_wrong）。
// ⚠️ _srsReviewMode とは別物にしてある。SRS復習だけが持つ意味
//    （ミッションの srs カウンタ・attempts の m=s・完走演出の「続けて次の50問」）に
//    再履修が混ざると、SRSの消化数が水増しされ、due が無いのに続きを勧めることになる。
let _todayWrongMode = false;
// SRS復習と今日の誤答の再履修は、どちらも「専用ホストに必要な問題だけを起こして出す」
// 同じ配管に乗る（中断データを持たない・科目フィルターを出さない・ホストを表示する）。
// 配管側の判定は必ずこれを使い、モード固有の分岐だけ個別フラグで書くこと。
// ボス戦（study.html?mode=boss・boss.js）。true=本戦（体力の計算が走る）／'rematch'=結果画面からの
// 誤答再試験（同じホストで出すが体力は無い）。どちらもホスト出題＝中断データを持たない。
let _bossMode = false;
// 🎯 弱点強化ミッション（study.html?mode=focus）。ハブの8軸レーダーでその日いちばん下回っている
// 科目群から、ミッション達成に必要な問題数だけを出す。配管は今日の誤答の再履修と同じホスト出題。
// ⚠️ _srsReviewMode とは混ぜない（ミッションの srs カウンタと attempts の m=s が水増しされる）。
let _focusMode = false;
function _isHostSession() { return _srsReviewMode || _todayWrongMode || !!_bossMode || _focusMode; }
// 直前に終えたセッションが復習だったか。誤答再試験で復習モードへ戻すために使う
// （exitExam が _srsReviewMode を false に戻すので、その前に控えておく必要がある）。
let _lastSessionWasSrs = false;
let _lastSessionWasTodayWrong = false;
let _lastSessionWasBoss = false;
let _lastSessionWasFocus = false;
const _examChoiceBackup = new Map();
let _examAudioCtx = null;
/* 効果音のファイル名・キー・音量は **sounds_index.js（window.MecSounds）が唯一の正本**。
   ここにも index.html にも chapter_exam.js にも表を持たない（2026-08-21）。
   ⚠️ 音を足すのは「sounds/{正解音|起動音|選択音}/ にファイルを置く → sounds/meta.json に
      1行足す → node _work/build_sounds_index.js」の3手順。コードは1文字も触らない。
   ⚠️ 2026-08-21 に合成音（ping/chime/pop…）は全廃した（コンボ音も廃止）。ユーザーが
      置いた音だけを鳴らす。 */
function _sndList(slot) {
  const l = window.MecSounds && window.MecSounds[slot];
  return Array.isArray(l) ? l : [];
}
function _sndFind(slot, key) { return _sndList(slot).find(s => s.key === key) || null; }
/* 保存されている設定を実在するキーへ解決する。見当たらないキー（消したファイル／
   旧・合成音のキー／廃止した 'off'）は先頭＝既定へ落とす。
   ⚠️ localStorage は書き換えない——別端末の設定を同期で壊さないため、解決は読む側で行う。
   ⚠️ 2026-09-10 に「無音」を全スロットから廃止した。設定画面にボタンが無いので、
      保存済みの 'off' をそのまま通すと二度と音を戻せない＝ここで必ず既定へ落とす。 */
function _sndResolve(slot, stored) {
  if (stored && stored !== 'off' && _sndFind(slot, stored)) return stored;
  const first = _sndList(slot)[0];
  return first ? first.key : '';
}

let _correctSound = _sndResolve('correct', localStorage.getItem('mec_correct_sound_v1'));
let _selectSound  = _sndResolve('select',  localStorage.getItem('mec_select_sound_v1'));
let _resultSound  = _sndResolve('result',  localStorage.getItem('mec_result_sound_v1'));

/* 起動音は設定で1つに固定せず、**試験開始のたびにランダムで1つ**鳴る（2026-08-21〜）。
   ⚠️ 2026-09-10 に「無音」を廃止した＝設定は残っていても常に鳴らす（保存値は見ない）。
   ⚠️ 起動音の尺（現在 4.39〜6.36s）はカウントダウン演出（2.535〜2.745s）より長いが、
      **鳴らし切る**のが仕様（2026-08-21 にユーザーが選択）。カウントダウンが明けて1問目に
      入っても音だけ続く。_examCountdown の尺は1msも増やさないこと。 */
/* 「開始」を押したそのタップの中で1つ選んで prepare しておく＝iOS の自動再生制限を
   通せる唯一の機会。_playBootSound はここで選ばれたものを鳴らすだけ。 */
let _pendingBootSpec = null;
function _pickBootSpec() {
  const l = _sndList('boot');
  return l.length ? l[(Math.random() * l.length) | 0] : null;
}

let _pendingResultSpec = null;
function _prepareResultSound() {
  _pendingResultSpec = _sndFind('result', _resultSound);
  if (_pendingResultSpec) _prepareWavSound(_pendingResultSpec);
}
function _playResultSound() {
  const spec = _pendingResultSpec || _sndFind('result', _resultSound);
  if (spec) _playWavSound(spec);
}

/* 選択音・正解音・起動音・結果音はすべて同じ wav/mp3 の配管（_prepareWavSound / _playWavSound）に
   乗る。⚠️ 種類ごとの受け皿は _wavSlot が1つずつだけ作る（プレビューのたびに Audio を
   new すると溜まる）。 */
function _prepareSelectSound() { _prepareWavSound(_sndFind('select', _selectSound)); }
function _playSelectSound() {
  _playWavSound(_sndFind('select', _selectSound));
}

/* wav/mp3 は「AudioContext のバッファ」と「<audio> 要素」の2本立てで持つ。
   バッファは遅延ゼロで多重再生でき、要素は AudioContext が使えない環境の受け皿。
   ⚠️ 種類ごとに1つずつしか作らないこと（プレビューのたびに Audio を new すると溜まる）。
   ⚠️ キーは spec.file（'{フォルダ名}/{ファイル名}' のフォルダ込みの相対パス）。 */
const _wavCache = new Map();
function _wavSlot(spec) {
  let slot = _wavCache.get(spec.file);
  if (!slot) {
    const audio = new Audio('sounds/' + spec.file);
    audio.preload = 'auto';
    slot = { audio, buffer: null, promise: null };
    _wavCache.set(spec.file, slot);
  }
  return slot;
}

function _getExamAudioCtx() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!_examAudioCtx) _examAudioCtx = new AudioContext();
  if (_examAudioCtx.state === 'suspended') _examAudioCtx.resume().catch(() => {});
  return _examAudioCtx;
}

function _prepareWavSound(spec) {
  if (!spec) return;
  const ctx = _getExamAudioCtx();
  const slot = _wavSlot(spec);
  if (!ctx || slot.buffer) return;
  if (!slot.promise) {
    slot.promise = fetch('sounds/' + spec.file)
      .then(res => res.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { slot.buffer = decoded; })
      .catch(() => { slot.promise = null; });
  }
}

function _emitWav(ctx, buffer, spec) {
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(spec.vol == null ? 1 : spec.vol, ctx.currentTime);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime);
}

function _playWavSound(spec) {
  if (!spec) return;
  try {
    const slot = _wavSlot(spec);
    const ctx = _getExamAudioCtx();
    if (ctx) {
      if (slot.buffer) { _emitWav(ctx, slot.buffer, spec); return; }
      _prepareWavSound(spec);
      /* デコードが済んでいなければ、終わり次第そのまま鳴らす。
         ⚠️ 「間に合わないから <audio> へ落とす」をやってはいけない——要素側は音量が 1 で
            頭打ちなので、vol>1 の素材（MHF 4.3 / アカツキ起動 9.8）がほぼ無音になる。
         ⚠️ 待っている間の重複要求は捨てる（連打で同じ音が積み上がるのを防ぐ）。 */
      if (slot.promise && !slot.waiting) {
        slot.waiting = true;
        slot.promise.then(() => {
          slot.waiting = false;
          if (slot.buffer) _emitWav(ctx, slot.buffer, spec);
        });
      }
      if (slot.promise) return;
    }
    // AudioContext が使えない環境の受け皿（音量は 1 で頭打ちにするしかない）
    slot.audio.volume = Math.max(0, Math.min(1, spec.vol == null ? 1 : spec.vol));
    slot.audio.pause();
    slot.audio.currentTime = 0;
    slot.audio.play().catch(() => {});
  } catch (e) {}
}

/* 試験開始の起動アニメ中に1回だけ鳴らす。何を鳴らすかは startExam が
   _pendingBootSpec に入れてある（＝タップの中で選んで prepare 済み）。
   ⚠️ ここで選び直さないこと——prepare していないバッファは iOS で鳴らない。 */
function _playBootSound() {
  _playWavSound(_pendingBootSpec || _pickBootSpec());
}

function _playCorrectSound() {
  _playWavSound(_sndFind('correct', _correctSound));
  // 正解音と一緒に画面中央へ広がる輪（MecFX.sonicWave）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。
}


function _loadResumes() {
  const old = localStorage.getItem('mec_exam_resume_v1');
  if (old) {
    try {
      const entry = JSON.parse(old);
      if (entry && entry.uids && entry.uids.length) {
        const subj = [...new Set(entry.uids.map(u => u.split('_ch')[0]))].sort().join(',');
        entry.key = subj + ':' + (entry.total || entry.uids.length);
        entry.savedAt = entry.savedAt || Date.now();
        const existing = JSON.parse(localStorage.getItem('mec_exam_resumes_v1') || '[]');
        if (!existing.length) localStorage.setItem('mec_exam_resumes_v1', JSON.stringify([entry]));
      }
    } catch {}
    localStorage.removeItem('mec_exam_resume_v1');
  }
  try { return JSON.parse(localStorage.getItem('mec_exam_resumes_v1') || '[]'); } catch { return []; }
}
function _saveResumes(arr) {
  localStorage.setItem('mec_exam_resumes_v1', JSON.stringify(arr.slice(0, 5)));
  if (window.MECSync) window.MECSync.scheduleSync();
}
function _renderResumeList() {
  const subjNameMap = { endo:'内分泌', resp:'呼吸器', circ:'循環器', dige:'消化器', neur:'神経', hbp:'肝胆膵', jinzo_d:'腎臓', hema:'血液', imma:'免アレ膠', kansen:'感染症', peds:'小児科', obg:'産婦人科', psy:'精神科', derm:'皮膚科', oph:'眼科', ent:'耳鼻咽喉科', uro:'泌尿器科', ortho:'整形外科', anes:'麻酔科', rad:'放射線科', tox:'中毒・職業病', emg:'救急', ph:'公衆衛生', hisshu:'必修講座', hisshu2:'必修講座Part2', sumresp:'サマライズ呼吸器' };
  // 達成度は doneCount（開封済み・採点除外含む）基準。旧データは answeredCount にフォールバック。
  const _done = r => (r.doneCount != null ? r.doneCount : r.answeredCount);
  const resumes = _loadResumes().filter(r => r.total > _done(r));
  const sec = document.getElementById('examResumeSection');
  const list = document.getElementById('examResumeList');
  if (!sec || !list) return;
  if (resumes.length) {
    list.innerHTML = resumes.map((r, i) => {
      const subjs = [...new Set((r.uids || []).map(u => u.split('_ch')[0]))];
      const subjLabel = subjs.length <= 2
        ? subjs.map(s => subjNameMap[s] || s).join('・')
        : '複数科目(' + subjs.length + ')';
      // 1科目・1章に収まる出題なら章番号も表示（旧形式の中断データでもuidから導出できる）
      let chLabel = '';
      if (subjs.length === 1) {
        const chNums = [...new Set((r.uids || []).map(u => { const m = u.match(/_ch(\d+)_q/); return m ? parseInt(m[1], 10) : 0; }).filter(Boolean))];
        if (chNums.length === 1) chLabel = ' <span class="er-ch">第' + chNums[0] + '章</span>';
      }
      const dt = r.savedAt ? new Date(r.savedAt).toLocaleString('ja-JP', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
      const doneN = _done(r);
      const prog = doneN > 0
        ? '<span class="er-prog">' + doneN + '/' + r.total + '問</span> 回答済み'
        : '全' + r.total + '問・未回答';
      const pctDone = r.total > 0 ? Math.round(doneN / r.total * 100) : 0;
      const filterTag = r.filterLabel ? ' <span class="er-filter">' + r.filterLabel + '</span>' : '';
      return '<div class="exam-resume-card">'
        + '<div class="exam-resume-info">'
        + '<div class="er-title">📎 ' + subjLabel + chLabel + filterTag + '</div>'
        + '<div class="er-sub">' + prog + (dt ? '　' + dt : '') + '</div>'
        + '<div class="er-bar"><div class="er-bar-fill" style="width:' + pctDone + '%"></div></div>'
        + '</div>'
        + '<div style="display:flex;gap:6px;flex-shrink:0">'
        + '<button class="exam-resume-btn" onclick="resumeExam(' + r.savedAt + ')">再開</button>'
        + '<button onclick="discardExamResume(' + r.savedAt + ')" style="background:none;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:6px 10px;font-size:12px;color:rgba(255,255,255,.55);cursor:pointer;" title="削除">✕</button>'
        + '</div></div>';
    }).join('');
    sec.style.display = '';
  } else {
    sec.style.display = 'none';
  }
}
let _chipRetryInt = null;
function openExamStart() {
  _lastPredictTotal = -1;   // 開いた最初の描画では脈打たせない
  _renderResumeList();
  _populateChapterChips(true);
  document.getElementById('examStartOv').classList.add('open');
  if (window.MECSync) window.MECSync.syncFromGist().then(r => { if (r.status === 'ok') _renderResumeList(); });
  // 段階ローダーでカード読み込み中に開くと章グリッドが空になる。読み込み完了を拾って再描画する
  clearInterval(_chipRetryInt);
  let _tries = 0;
  _chipRetryInt = setInterval(() => {
    const ov = document.getElementById('examStartOv');
    if (!ov || !ov.classList.contains('open') || document.querySelector('.exam-ch-card') || ++_tries > 20) {
      clearInterval(_chipRetryInt);
      return;
    }
    _populateChapterChips(true);
  }, 800);
}

function _populateChapterChips(animate = false) {
  const grid = document.getElementById('examChChips');
  if (!grid) return;

  const visibleCards = [...document.querySelectorAll('.qc[data-uid]')].filter(c => {
    if (c.style.display === 'none') return false;
    const sec = c.closest('.subj-section');
    return !sec || sec.dataset.visible === 'true';
  });

  // 学習カバー率算出用: done_v2>0（済ボタン or 試験で回答済み）を「学習済み」とみなす
  let doneMap = {};
  try { doneMap = JSON.parse(localStorage.getItem('done_v2') || '{}'); } catch { doneMap = {}; }

  const prefixMap = new Map();
  visibleCards.forEach(c => {
    const uid = c.dataset.uid;
    const m = uid.match(/^(.+_ch\d+)_q/);
    if (!m) return;
    const prefix = m[1];
    if (!prefixMap.has(prefix)) {
      const subjId = prefix.replace(/_ch\d+$/, '');
      const chNum = parseInt(prefix.match(/_ch(\d+)$/)[1], 10);
      const subj = STUDY_SUBJECTS.find(s => s.id === subjId);
      // count=フィルター後の出題数 / total等=章の全問（カバー率はフィルターに左右させない）
      prefixMap.set(prefix, { subjId, chNum, subj, count: 0, total: 0, done: 0, star: 0, starDone: 0 });
    }
    prefixMap.get(prefix).count++; // 出題数はフィルター後の可視分
  });

  // カバー率は「章の全問」を固定分母にする＝display:none で隠れた問題も含めて集計。
  // （★フィルター中でも「全問中どれだけ学習したか」がブレないようにする）
  const allChapterCards = [...document.querySelectorAll('.qc[data-uid]')].filter(c => {
    const sec = c.closest('.subj-section');
    return !sec || sec.dataset.visible === 'true';
  });
  allChapterCards.forEach(c => {
    const m = c.dataset.uid.match(/^(.+_ch\d+)_q/);
    if (!m) return;
    const e = prefixMap.get(m[1]);
    if (!e) return; // 現フィルターで1問も可視でない章は表示しない（既存仕様）
    e.total++;
    const isDone = (doneMap[c.dataset.uid] || 0) > 0;
    if (isDone) e.done++;
    if (c.querySelector('.bg.bs')) { e.star++; if (isDone) e.starDone++; } // ★問題の学習内訳
  });

  // Sort: subject order in STUDY_SUBJECTS, then chapter number
  const subjOrder = Object.fromEntries(STUDY_SUBJECTS.map((s, i) => [s.id, i]));
  const entries = [...prefixMap.entries()].sort(([,a],[,b]) => {
    const oi = (subjOrder[a.subjId] ?? 99) - (subjOrder[b.subjId] ?? 99);
    return oi !== 0 ? oi : a.chNum - b.chNum;
  });

  // カード未ロード（段階ロード中 or 科目未選択）なら空白ではなく案内を出す
  if (!entries.length) {
    const tabsEmpty = document.getElementById('examSubjTabs');
    if (tabsEmpty) { tabsEmpty.innerHTML = ''; tabsEmpty.style.display = 'none'; }
    grid.innerHTML = '<div class="exam-ch-empty">⏳ 問題を読み込み中です…（完了すると章が表示されます）</div>';
    const cb = document.getElementById('examChClearBtn');
    if (cb) cb.style.display = 'none';
    _renderExamPredict();   // ⚠️ ここでも呼ぶこと。0問の案内が要るのはまさにこの分岐
    return;
  }

  // 科目タブ: 表示中の科目が2つ以上のときだけ出す
  const subjIds = [...new Set(entries.map(([, i]) => i.subjId))];
  if (!subjIds.includes(_examTabSubj)) {
    const selSubj = _examChPrefix ? _examChPrefix.replace(/_ch\d+$/, '') : null;
    _examTabSubj = subjIds.includes(selSubj) ? selSubj : subjIds[0];
  }
  const tabs = document.getElementById('examSubjTabs');
  if (tabs) {
    tabs.innerHTML = '';
    tabs.style.display = subjIds.length > 1 ? '' : 'none';
    subjIds.forEach(sid => {
      const subj = STUDY_SUBJECTS.find(s => s.id === sid);
      const tbtn = document.createElement('button');
      const hasPick = _examChPrefix && _examChPrefix.replace(/_ch\d+$/, '') === sid;
      tbtn.className = 'exam-subj-tab' + (sid === _examTabSubj ? ' sel' : '') + (hasPick ? ' has-pick' : '');
      tbtn.textContent = subj ? subj.icon + ' ' + subj.name : sid;
      tbtn.onclick = () => { _examTabSubj = sid; _populateChapterChips(true); };
      tabs.appendChild(tbtn);
    });
    const selTab = tabs.querySelector('.exam-subj-tab.sel');
    if (selTab && selTab.scrollIntoView) selTab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }

  const chExamHist = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}');
  grid.innerHTML = '';
  entries.filter(([, info]) => info.subjId === _examTabSubj).forEach(([prefix, info], idx) => {
    const h = chExamHist[prefix];
    const btn = document.createElement('button');
    btn.className = 'exam-ch-card' + (_examChPrefix === prefix ? ' sel' : '');
    btn.dataset.prefix = prefix;
    // ベスト正答率で色分け: 80%↑緑 / 60-79黄 / 60未満赤 / 未受験グレー
    const scoreCls = !h ? ' sc-none' : h.bestScore >= 80 ? ' sc-hi' : h.bestScore >= 60 ? ' sc-mid' : ' sc-lo';
    // 学習カバー率: 章の全問（固定分母）に対する学習済み割合。★だけやったか全問やったかの判別用。
    const total = info.total || info.count;
    const cov = total > 0 ? Math.round(info.done / total * 100) : 0;
    const covCls = cov >= 100 ? ' cov-full' : cov >= 50 ? ' cov-mid' : cov > 0 ? ' cov-lo' : ' cov-none';
    // ★クリア判定: ★を全て学習済み かつ 章はまだ未完（＝「★だけ終わっている」状態）
    const starCleared = info.star > 0 && info.starDone >= info.star && info.done < total;
    btn.innerHTML = '<span class="cc-num">' + info.chNum + '章</span>'
      + (starCleared ? '<span class="cc-star-badge" title="★問は全て学習済み（章はまだ未完）">★</span>' : '')
      + '<span class="cc-cnt">' + info.count + '問</span>'
      + '<span class="cc-cov' + covCls + '"><span class="cc-cov-bar"><span class="cc-cov-fill" style="width:' + cov + '%"></span></span>' + cov + '%</span>'
      + '<span class="cc-score' + scoreCls + '">' + (h ? h.bestScore + '%' : '—') + '</span>';
    btn.title = (info.subj ? info.subj.name : info.subjId) + ' 第' + info.chNum + '章（全' + total + '問）'
      + ' | 学習 ' + info.done + '/' + total + '問(' + cov + '%)'
      + (info.star ? ' · ★ ' + info.starDone + '/' + info.star + '問' + (starCleared ? '（★クリア）' : '') : '')
      + (h ? ' | 最高' + h.bestScore + '% · ' + h.sessions + '回' : '');
    btn.style.animationDelay = (idx * 22) + 'ms';
    btn.onclick = () => _selectExamChapter(prefix);
    grid.appendChild(btn);
  });

  // モーダルを開いた時・タブ切替時だけカードを順番にポップさせる
  // （選択・解除の再描画では replay しない）
  try {
    if (animate) { grid.classList.remove('anim-in'); void grid.offsetWidth; grid.classList.add('anim-in'); }
    else grid.classList.remove('anim-in');
  } catch (e) {}

  const clearBtn = document.getElementById('examChClearBtn');
  if (clearBtn) clearBtn.style.display = _examChPrefix ? '' : 'none';
  _renderExamPredict();
}

/* B4: 「この条件で何問出るのか」を開始を押す前に見せる。演出であると同時に情報で、
   章チップを触るたびに更新される。
   ⚠️ 数え方は _examCandidateCards / _examProgLayout を使い回すこと。startExam と別の式を
      書くと、予告と実際の出題数がずれる（信用を失う種類の不具合になる）。 */
let _lastPredictTotal = -1;
function _renderExamPredict() {
  const el = document.getElementById('examPredict');
  if (!el) return;
  const cards = _examCandidateCards(_examChPrefix);
  const L = _examProgLayout(cards);
  if (!L.total) {
    el.className = 'exam-predict empty';
    el.innerHTML = '出題できる問題がありません<span class="pd-sub">科目・フィルターを確認してください</span>';
    _lastPredictTotal = 0;
    return;
  }
  el.className = 'exam-predict';
  el.innerHTML = 'この条件で <b class="pd-n">' + L.total + '</b> 問'
    + (L.hardTotal ? '<span class="pd-hard">うち難問 <b>' + L.hardTotal + '</b> 問</span>' : '')
    + (L.excluded ? '<span class="pd-ex">採点除外 ' + L.excluded + ' 問</span>' : '');
  // 数が変わった時だけ小さく脈打たせる（開くたびに動くと落ち着かない）
  if (_lastPredictTotal !== -1 && _lastPredictTotal !== L.total && !_fxOff()) {
    const n = el.querySelector('.pd-n');
    if (n) n.animate([{ transform: 'scale(1.35)' }, { transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  _lastPredictTotal = L.total;
}

function _selectExamChapter(prefix) {
  _examChPrefix = (_examChPrefix === prefix) ? null : prefix;
  _populateChapterChips();
}

function clearExamChFilter() {
  _examChPrefix = null;
  _populateChapterChips();
}
function closeExamStart() {
  document.getElementById('examStartOv').classList.remove('open');
}
function _addResumeTombstone(savedAt) {
  if (!savedAt) return;
  const t = JSON.parse(localStorage.getItem('mec_exam_resume_tombstones_v1') || '[]');
  if (!t.includes(savedAt)) {
    t.push(savedAt);
    localStorage.setItem('mec_exam_resume_tombstones_v1', JSON.stringify(t.slice(-200)));
  }
}
// キー別墓標: savedAt は保存のたびに変わるため、savedAt 墓標だけでは他端末に残った
// 古いコピーが同期で復活する。「このキーは時刻Tに削除された」を記録し、それより古い
// 同キーの中断データはどの端末でも復活させない（progress.js の _mergeRemote が参照）。
function _addResumeKeyTombstone(key) {
  if (!key) return;
  try {
    const t = JSON.parse(localStorage.getItem('mec_exam_resume_key_tombs_v1') || '{}');
    t[key] = Date.now();
    const keys = Object.keys(t);
    if (keys.length > 50) keys.sort((a, b) => t[a] - t[b]).slice(0, keys.length - 50).forEach(k => delete t[k]);
    localStorage.setItem('mec_exam_resume_key_tombs_v1', JSON.stringify(t));
  } catch {}
}
function discardExamResume(savedAt) {
  const entry = _loadResumes().find(r => r.savedAt === savedAt);
  _addResumeTombstone(savedAt);
  if (entry && entry.key) _addResumeKeyTombstone(entry.key);
  _saveResumes(_loadResumes().filter(r => r.savedAt !== savedAt));
  if (window.MECSync) window.MECSync.pushToGist();
  _renderResumeList();
}
function startFreshExam() {
  closeExamSummary();
  const sec = document.getElementById('examResumeSection');
  if (sec) sec.style.display = 'none';
  document.getElementById('examStartOv').classList.add('open');
}

function _saveExamResume() {
  if (_isHostSession()) return;
  if (!examQueue.length) return;
  // 開封済み（=対応済み）カード数。採点除外の中立開封も含むので、全問こなせば必ず total に達する。
  // examAnswered は採点除外を除くため、これで判定しないと除外問題がある章で 100% にならなかった。
  // exam-retry（新しい演出の選び直し中）は採点済み＝開封済みとして扱う（再開すると答えが開いた状態で戻る）
  const seenCount = examQueue.filter(c =>
    c.classList.contains('exam-revealed') || c.classList.contains('exam-retry') ||
    c.querySelector('.ch2.exam-instant-wrong, .ch2.exam-instant-correct')).length;
  // 全カード開封済みなら中断データは不要。終了ボタンを押さずに閉じても残らないよう自動削除する
  if (seenCount >= examQueue.length) { _clearExamResume(); return; }
  const revealedUids = {};
  const pendingWrong = [];
  const calcEntered = {};   // 計算問題の入力途中の桁（未確定のカードぶん）
  let pendingCorrect = 0;
  examQueue.forEach(card => {
    const uid = card.dataset.uid;
    const calc = window.MecCalc && MecCalc.isCalc(card);
    if (calc && !card.classList.contains('exam-revealed')) {
      const v = MecCalc.value(card);      // 未入力の桁は '_'。1桁でも入っていれば残す
      if (/[0-9]/.test(v)) calcEntered[uid] = v;
    }
    if (card.classList.contains('exam-revealed') || card.classList.contains('exam-retry')) {
      revealedUids[uid] = { correct: !examWrong.includes(uid) };
      if (calc) revealedUids[uid].entered = MecCalc.value(card);
    } else {
      // Capture answers selected within the 400ms reveal timeout window
      const wrongChoice = card.querySelector('.ch2.exam-instant-wrong');
      const correctChoice = card.querySelector('.ch2.exam-instant-correct');
      if (wrongChoice) {
        revealedUids[uid] = { correct: false };
        pendingWrong.push(uid);
      } else if (correctChoice) {
        revealedUids[uid] = { correct: true };
        pendingCorrect++;
      }
    }
  });
  const entry = {
    key: _examSessionKey,
    savedAt: Date.now(),
    uids: examQueue.map(c => c.dataset.uid),
    revealedUids,
    answeredCount: examAnswered + pendingWrong.length + pendingCorrect, // 採点対象数（examAnswered復元用）
    doneCount: seenCount, // 開封済み総数（採点除外含む・一覧の達成度用）
    correctCount: examCorrect + pendingCorrect,
    wrongUids: [...examWrong, ...pendingWrong],
    bySubj: examBySubj,
    byChapter: examByChapter,
    total: examQueue.length,
    count: _examCount,
    filterLabel: _examFilterLabel,
    chPrefix: _examActiveChPrefix,
    calcEntered
  };
  const resumes = _loadResumes();
  const ri = resumes.findIndex(r => r.key === _examSessionKey);
  if (ri >= 0) resumes[ri] = entry; else resumes.unshift(entry);
  _saveResumes(resumes);
}
function _clearExamResume() {
  const toDelete = _loadResumes().filter(r => r.key === _examSessionKey);
  toDelete.forEach(r => _addResumeTombstone(r.savedAt));
  _addResumeKeyTombstone(_examSessionKey);
  _saveResumes(_loadResumes().filter(r => r.key !== _examSessionKey));
}

// 再開ボタン押下時の演出: 中央に「▶ 続きから再開！」＋MecFXのリング・バースト・グリフ
function _playResumeIntroFx() {
  try {
    const pop = document.createElement('div');
    pop.className = 'resume-intro-pop';
    pop.textContent = '▶ 続きから再開！';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1250);
    if (window.MecFX) {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      window.MecFX.rings(cx, cy, { count: 2, color: 'rgba(61,214,140,.8)', thickness: 3, maxR: 180, additive: true });
      window.MecFX.burst(cx, cy, { count: 26, colors: ['#3DD68C', '#60A5FA', '#FFD37A'], shapes: ['circle', 'star'], tier: 3, scale: 1.3, glow: true, additive: true });
      window.MecFX.glyphBurst(cx, cy, { glyphs: ['📎', '✨', '⚡️'], count: 8, w: 140, spread: 130 });
    }
  } catch (e) {}
}

// 結果画面を閉じるだけ（科目の復元は起こさない）。直後に別の試験を始める経路で使う。
// closeExamSummary は「通常閲覧へ戻る」前提なので復元を走らせてしまう。
function _closeSummaryOverlayOnly() {
  document.getElementById('examOverlay')?.classList.remove('open');
}

/* B8: 誤答再試験は「落とした問題を相手に見立てた」入り方にする（C2 RECOVER と同じ世界観）。
   startExam が消費する。普通の再出題と区別が付かないと、やり直しが作業に見える。 */
let _rematchPending = 0;
let _examIsRematch = false;

function retryWrongExam() {
  const uids = [...examWrong];
  if (!uids.length) return;
  _rematchPending = uids.length;
  _closeSummaryOverlayOnly();
  // 復習セッションの誤答再試験は復習モードのまま続ける。
  // ここで戻さないと通常試験として開始され、科目フィルターと科目セクションが復活する。
  if (_lastSessionWasSrs || _lastSessionWasTodayWrong || _lastSessionWasBoss || _lastSessionWasFocus) {
    _srsReviewMode = _lastSessionWasSrs;
    _todayWrongMode = _lastSessionWasTodayWrong;
    _bossMode = _lastSessionWasBoss ? 'rematch' : false;
    _focusMode = _lastSessionWasFocus;
    document.body.classList.add('srs-review');
    window._srsHostShow?.();
  }
  startExam(uids);
}

/* いま出題される候補カード（科目・フィルター＋章の絞り込み）。
   ⚠️ startExam と開始モーダルの予告（B4）が必ずこの1本を使うこと。数え方が2箇所に分かれると
      「開始を押したら予告と違う問題数だった」が起きる。 */
function _examCandidateCards(chFilter) {
  return [...document.querySelectorAll('.qc[data-uid]')].filter(c => {
    if (c.style.display === 'none') return false;
    const sec = c.closest('.subj-section');
    if (sec && sec.dataset.visible !== 'true') return false;
    if (chFilter && !c.dataset.uid.startsWith(chFilter + '_q')) return false;
    return true;
  });
}

function _buildExamQueue(cards) {
  const groups = [], seenSg = new Set();
  cards.forEach(c => {
    const sg = c.closest('.sg');
    if (sg) {
      if (!seenSg.has(sg)) { seenSg.add(sg); groups.push(cards.filter(x => x.closest('.sg') === sg)); }
    } else { groups.push([c]); }
  });
  return groups.flat();
}

function startExam(overrideUids = null) {
  if (!overrideUids) closeExamStart();
  // SRS復習ホスト（dueカード）を表示状態にしておく。通常試験ではホストは空か、
  // キュー外のカードは直後に display:none にされるため無害。
  window._srsHostShow?.();
  document.getElementById('examFinishBtn')?.remove(); // 前回の結果ボタンが残っていれば除去
  document.getElementById('examPendingBand')?.remove();
  // 週ごとの弱点の推移で使う設問形式（qmeta.json）を、最初の解答より前に取りに行っておく
  try { window.MECSync?.weekPrefetch?.(); } catch (e) {}
  _prepareSelectSound();
  _prepareWavSound(_sndFind('correct', _correctSound));
  _prepareResultSound();
  // 起動音は「開始を押した」このタップの中で選んで用意する＝iOS の自動再生制限を通せる
  // 唯一の機会。⚠️ ランダムの抽選もここで済ませること（_playBootSound では遅い）。
  _pendingBootSpec = _pickBootSpec(); _prepareWavSound(_pendingBootSpec);
  _clxSessionPick = Math.random() < .5 ? 'nova' : 'galaxy';   // Celestial の正解演出（セッションごとに超新星か銀河の渦）
  const chFilter = !overrideUids ? _examChPrefix : null;
  _examActiveChPrefix = chFilter;
  _examChPrefix = null;
  if (!overrideUids) {
    const _fNames = { hard:'難問', normal:'標準', easy:'易問', norank:'正答率なし', star:'★', img:'🖼️' };
    const _sNames = { flag:'🚩赤旗', undone:'未済', done:'済み' };
    const _parts = [];
    if (_fNames[currentFilter]) _parts.push(_fNames[currentFilter]);
    if (_sNames[currentState]) _parts.push(_sNames[currentState]);
    _examFilterLabel = _parts.join('・') || '全問';
  } else if (!_examFilterLabel) {
    _examFilterLabel = '';
  }
  const allVisible = overrideUids
    ? overrideUids.map(uid => document.querySelector(`.qc[data-uid="${uid}"]`)).filter(Boolean)
    : _examCandidateCards(chFilter);
  const shuffled = _buildExamQueue(allVisible);
  examQueue = shuffled;
  _recountExcluded();
  // alert() は iOS PWA で表示されないことがあるためトーストで通知する
  if (!examQueue.length) { (window._mecNotify || function(m){})('表示中の問題がありません。科目・フィルターを確認してください。'); return; }
  const _subj = [...new Set(examQueue.map(c => c.dataset.uid.split('_ch')[0]))].sort().join(',');
  _examSessionKey = _subj + ':' + examQueue.length;
  // ホスト出題（SRS復習・今日の誤答）は中断データを持たないので消さない
  // （同じキーの通常試験の中断データを巻き込まないため）
  if (!_isHostSession()) _clearExamResume();
  document.querySelectorAll('.ch2.correct').forEach(c => c.classList.remove('correct'));
  document.querySelectorAll('.qc.fx-correct').forEach(c => c.classList.remove('fx-correct'));
  examMode = true; examAnswered = 0; examCorrect = 0; examStreak = 0; examStreakGrace = true; examBySubj = {}; examByChapter = {}; examWrong = []; _examSessionWrongChoices.clear(); examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  _attemptSessionId = window.MecAttempts ? MecAttempts.newSession() : '';
  _examCardSeenAt.clear();
  _examIsRematch = _rematchPending > 0; _rematchPending = 0;   // B8
  _clearRecapChips(); _examSessionResults.clear();             // B5: 前回の成績表示を畳む
  _renderExamProgMarks();                                      // B2: 目盛りと難問印を敷く
  examEffectSet = _examSetForUi();
  document.body.classList.remove('exam-effect-neon', 'exam-effect-ink');
  if (examEffectSet !== 'classic') document.body.classList.add('exam-effect-' + examEffectSet);
  if (location.search.indexOf('debug=1') !== -1) alert('[study.html] effectSet: ' + examEffectSet);
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  if (!_isHostSession()) localStorage.setItem('mec_exam_active_key', _examSessionKey);
  _examChoiceBackup.clear();
  document.body.classList.add('exam-mode');
  _examSyncQueue();
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_examSet.has(c)) c.style.display = 'none'; });
  let _firstFlips = null;   // B6: 1問目だけ並べ替えの移動量を控える
  examQueue.forEach((card, qi) => {
    card.style.display = '';
    const f = _prepExamCard(card, qi === 0);
    if (qi === 0) _firstFlips = f;
  });
  _updateExamProg();
  if (examTimerInt) clearInterval(examTimerInt);
  examTimerInt = setInterval(() => {
    const s = Math.floor((_examActiveMs()) / 1000);
    const el = document.getElementById('examTimer');
    if (el) el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }, 1000);
  document.addEventListener('keydown', _examKeyHandler);
  window.addEventListener('scroll', _onExamScroll, { passive: true });
  // Phase 5 段2: R10 のスリープ番。⚠️ exitExam で必ず落とすこと。
  _armExamSleep();
  requestAnimationFrame(_updateExamFocus);
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '📖 終了'; modeBtn.classList.add('exam-on'); modeBtn.onclick = exitExam; }
  window.scrollTo({ top: 0 });
  _saveExamResume();
  const _cdEnd = _examCountdown();   // C9: 3・2・1・START（非ブロッキング＝裏で試験は既に開始済み）
  // B6/B7: 幕が明けてから1問目を立ち上げる。カウントダウン中に走らせると誰も見ていない。
  setTimeout(() => {
    if (!examMode) return;
    // Phase 5(2026-08-19): 開始直後だけ焦点が付かない穴をここで塞ぐ。上の
    // requestAnimationFrame(_updateExamFocus) はカードが出そろう前に1度走るだけで、次に走るのは
    // 最初のスクロールか解答だった。2026-08-19 に「稼働灯が点かないだけ」として一度は許容したが、
    // 段1（R3 焦点枠の色・R5 クランプ・R13 持ち上げ）が全部この状態にぶら下がるので判断を覆した。
    // ⚠️ 直すのはここ1か所。_getExamTargetCard() の条件は触らないこと（解答直後の焦点移動が壊れる）。
    _updateExamFocus();
    setTimeout(() => { if (examMode) _revealShuffleFx(_firstFlips); }, 180);
  }, _cdEnd + 60);
}

/* 出題するカード1枚の支度（肢の並べ替え・計算問題の桁入力・複数選択の表示・確定ボタン・クリック）。
   startExam と、ボス戦の増援（boss.js が試験の途中でキューへ足すカード）が共有する。
   first=true の1問目だけ並べ替えの移動量を返す（B6）。 */
function _prepExamCard(card, first) {
  const flips = _shuffleChoices(card, !!first);
  const isCalc = _setupCalcCard(card);   // 計算問題は桁入力UIを起こす
  const req = _getRequiredCount(card);
  if (!isCalc && req > 1 && !card.querySelector('.exam-multi-info')) {
    const info = document.createElement('div');
    info.className = 'exam-multi-info';
    info.textContent = '0 / ' + req + ' 選択中';
    info.dataset.ready = '0';
    const cs = card.querySelector('.cs');
    if (cs) cs.before(info);
  }
  const qb = card.querySelector('.qb');
  if (qb && !qb.querySelector('.exam-reveal-btn')) {
    const btn = document.createElement('button');
    btn.className = 'exam-reveal-btn';
    btn.textContent = (isCalc || req > 1) ? '▶ 回答を確定する' : '▶ 解答を見る';
    btn.onclick = () => revealAnswer(card);
    const ab = qb.querySelector('.ab');
    if (ab) ab.parentNode.insertBefore(btn, ab); else qb.appendChild(btn);
  }
  _bindExamChoices(card);
  return flips;
}

/* 選択肢のクリックは【ここ1か所】。2026-08-25 に startExam / resumeExam の二重定義を併合した。
   ⚠️ 併合前は resumeExam 側のリスナーに _examHas のガードが無く、2026-08-24 の
      「試験が他科目を巻き込む」修正が**再開経路だけ素通し**になっていた（revealAnswer の
      入口ガードが採点は止めるが、肢は選択状態のまま遊べてしまう）。ガードを2か所に書かないこと。
   ⚠️ 併合前の resumeExam 側は選択音・スパーク・採点除外の中立表示も持っていなかった＝
      「再開した試験だけ手触りが違う」状態だった。分岐を戻さないこと。 */
function _bindExamChoices(card) {
  card.querySelectorAll('.ch2').forEach(ch => {
    if (ch.dataset.examInit) return;   // 一度きり。exitExam はこのフラグを消さない（下の cleanup の注記）
    ch.dataset.examInit = '1';
    ch.addEventListener('pointerdown', function() { this.classList.add('ch2-pressing'); });
    ch.addEventListener('pointerup', function() { this.classList.remove('ch2-pressing'); });
    ch.addEventListener('pointercancel', function() { this.classList.remove('ch2-pressing'); });
    ch.addEventListener('pointerleave', function() { this.classList.remove('ch2-pressing'); });
    ch.addEventListener('click', _examChoiceClick);
  });
}

function _examChoiceClick(e) {
  const c = this.closest('.qc');
  // ⚠️ キュー所属を必ず見ること。このリスナーは dataset.examInit で一度きり付き、
  //    以後どのセッションでも生き続けるので、前のセッションのカード（＝別科目）が
  //    画面に出た瞬間そのまま遊べてしまう。
  if (!examMode || !_examHas(c) || c.classList.contains('exam-revealed')) return;
  _playSelectSound();
  const r = _getRequiredCount(c);

  // 【案10】重厚メカニカル接点電気スパーク
  if (!_fxOff() && window.MecFX && window.MecFX.sparks) {
    const rect = this.getBoundingClientRect();
    window.MecFX.sparks(e.clientX || (rect.left + 24), e.clientY || (rect.top + rect.height / 2), { count: 7 });
  }

  if (_isExamUngraded(c)) { // 採点除外＝そのまま中立表示へ
    this.closest('.cs').querySelectorAll('.ch2').forEach(x => x.classList.remove('exam-selected'));
    this.classList.add('exam-selected');
    setTimeout(() => revealAnswer(c), 10);
    return;
  }
  // 誤答しても答えを見せず選び直させる（2026-09-24）。単一・複数選択の判定は _rfChoiceClick が持つ。
  _rfChoiceClick(c, this, r);
}

function revealAnswer(card) {
  // ⚠️ キュー外のカードを採点しないこと。下で examBySubj[sid] を無条件に作るので、
  //    1問でも通すと1科目で始めた試験が複数科目のセッションとして集計・表示される。
  if (examMode && !_examHas(card)) return;
  if (card.classList.contains('exam-revealed')) return;
  // 選び直し中のカードは採点済み。「▶ 答えを見る」＝打ち切り（計算問題は再確定へ回す）
  if (card.classList.contains('exam-retry') && !(window.MecCalc && MecCalc.isCalc(card))) { _rfGiveUp(card); return; }
  // 採点除外（正解肢なし）は採点対象外。分母・正誤・myrate・赤旗・再試験のどれにも入れない。
  if (_isExamUngraded(card)) { _revealExcludedNeutral(card); return; }
  const req = _getRequiredCount(card);
  const sid = card.dataset.uid.split('_ch')[0];
  if (!examBySubj[sid]) examBySubj[sid] = { correct: 0, total: 0 };

  // 入力型（計算問題）は選択肢が無いので専用の採点へ回す
  if (window.MecCalc && MecCalc.isCalc(card)) { _revealCalcAnswer(card, sid); return; }

  /* ここへ来るのは「初回で正解した」ときだけ（2026-09-24〜）。
     誤答はクリックの時点で _rfChoiceClick → _rfWrongPick が採点して選び直しへ回すので、
     このあとの記録は正解の記録になる。念のため、誤った肢が選ばれた状態で呼ばれたら（旧データの再開など）
     同じ選び直しの経路へ渡す＝誤答の記録口を2つにしない。 */
  let els;
  if (req > 1) {
    els = [...card.querySelectorAll('.ch2.exam-selected')];
    if (els.length < req) {
      const info = card.querySelector('.exam-multi-info');
      if (info) { info.style.animation = 'none'; void info.offsetHeight; info.style.animation = 'examShake .3s'; }
      return;
    }
  } else {
    // 肢を選ばずに「▶ 解答を見る」を押した＝答えを見た。正解扱いにせず、誤答と同じく選び直しの外で開く
    const sel = card.querySelector('.ch2.exam-selected') || card.querySelector('.ch2.exam-instant-correct');
    if (!sel) { _rfRevealUnanswered(card); return; }
    els = [sel];
  }
  const bad = els.find(ch => !ch.classList.contains('ok'));
  if (bad) { _rfWrongPick(card, bad, _selectedChoiceStr(els)); return; }

  const uid = card.dataset.uid;
  examAnswered++;
  examBySubj[sid].total++;
  _tallyChapter(uid, true);
  _tallyQuestion(card, true);            // B3/B5: 難問の成績とセッションの正誤
  _markExamDone(uid);
  _recordMyRate(uid, true);
  _logAttempt(card, true, _selectedChoiceStr(els));
  if (!_isScoreExcluded(card)) _updateSRS(uid, true);
  examCorrect++;
  examStreak++;
  examStreakGrace = true;
  examBySubj[sid].correct++;
  const advMs = req > 1 ? RF_ADVANCE_MS.multi : RF_ADVANCE_MS.one;
  try { _playCorrectSound(); _rfCorrectFx(card, card.querySelector('.ch2.ok') || els[0], advMs); }
  catch (err) { console.error('[ExamFx] Error in correct fx:', err); }
  card.classList.add('exam-revealed', 'exam-multi-correct');
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
  try { _updateExamProg(true); } catch (e) {}
  try { _saveExamResume(); } catch (e) {}
  requestAnimationFrame(_updateExamFocus);
  _rfScrollAfterCorrect(card, advMs);
}


function _toggleWrongAnswer(card, btn) {
  const hidden = card.classList.toggle('exam-ans-hidden');
  btn.textContent = hidden ? '▶ 解答を見る' : '▼ 解答を隠す';
}

function _toggleCorrectAnswer(card, btn) {
  const opened = card.classList.toggle('exam-answer-opened');
  btn.textContent = opened ? '▼ 解説を隠す' : '▶ 解説を見る';
}

// 暗転系オーバーレイ（タイムストップ暗転・ブラックホール暈し・除細動暗転など）を確実に消す。
// 不正解でストリークが途切れた瞬間に呼び、残った暗い全画面要素が居座らないようにする。
function _clearDarkFx() {
  document.querySelectorAll('.exam-fx-temp').forEach(el => {
    el.getAnimations?.().forEach(a => a.cancel());
    el.remove();
  });
}

/* B1(2026-08-14): 天井を tier6（20連続〜）から tier7（30連続〜）へ。
   上限が見えていると「そこまで行けば終わり」になって伸ばす動機が止まるため、
   最上段の手前にもう一段置く。tier7 は各テーマが専用の配色・ラベルを持つ。
   2026-08-25: 段の敷居を前倒しした（4/7/10/15/20/30 → 3/5/7/10/14/20）。
   50問セッションで tier5 以上に一度も届かないことが多く、上段の演出（絵文字群・
   グリッチ・墨スワイプ）が事実上死んでいたため。天井は tier7 のまま。
   ⚠️ この梯子を変えたら ceTier（chapter_exam.js）とも対で直す。 */
function _examTier(n) {
  return n >= 20 ? 7 : n >= 14 ? 6 : n >= 10 ? 5 : n >= 7 ? 4 : n >= 5 ? 3 : n >= 3 ? 2 : 1;
}

/* tier で配列・マップを引くときのクランプ。
   テーマ側の配列は index 7 まで用意してあるが、演出関数の中には index 6 までしか
   持たないローカル配列（粒子数の段など）が混ざる。長さに合わせて丸めることで、
   ローカル配列は tier6 の値を流用し、テーマ配列は tier7 専用の値を引く。
   マップ（burstPalettes・floaterGlyphs・borderColors・lightningCols）は length を
   持たないので 7 で丸める（キー7はテーマ側に追加済み・欠けても呼び出し側に || がある）。 */
function _tIdx(tier, o) {
  return Array.isArray(o) ? Math.min(tier, o.length - 1) : Math.min(tier, 7);
}

// 試験モード演出テーマ。examEffectSet で選ばれ、正解／連続正解エフェクトの見た目を丸ごと切り替える。
const EXAM_EFFECT_THEMES = {
  classic: {
    burstPalettes: {
      2: ['#FFA040','#FFD700','#FFFFFF','#FFB830'],
      3: ['#FF5820','#FF9800','#FFFFFF','#FFD700','#FF6030'],
      4: ['#FFD700','#FFA040','#FFFFFF','#FFB830','#FFF176','#FF9800'],
      5: ['#FFE040','#FFD700','#FF9800','#FFFFFF','#FFF176','#FFB300','#FF5722','#4FC3F7'],
      6: ['#EE88FF','#CC44FF','#FFD700','#FF5722','#4FC3F7','#FFFFFF','#FFE040','#81C784','#F06292'],
      7: ['#FF3D7F','#CC44FF','#FFD700','#FF5722','#4FC3F7','#FFFFFF','#FFE040','#00E5FF','#F06292','#81C784']
    },
    shapes: (tier) => tier >= 3 ? ['circle','square','star','star','square','circle'] : ['circle','square'],
    ringColor: (tier) => tier >= 7 ? 'rgba(255,61,127,.92)' : tier >= 6 ? 'rgba(210,80,255,.85)' : tier >= 4 ? 'rgba(255,210,0,.85)' : tier >= 3 ? 'rgba(255,88,32,.85)' : 'rgba(255,160,64,.75)',
    fullscreenCols:  ['','','#FFA040','#FF5820','#FFD700','#FFE840','#CC44FF','#FF3D7F'],
    fullscreenGlow:  ['','','255,160,64','255,88,32','255,200,0','255,220,0','200,60,255','255,61,127'],
    flashColors: ['','','rgba(255,160,64,.30)','rgba(255,80,40,.42)','rgba(255,200,0,.62)','rgba(255,220,0,.78)','rgba(160,0,255,.68)','rgba(255,61,127,.82)'],
    borderColors: {4:'#FF9800',5:'#FFD700',6:'#CC44FF',7:'#FF3D7F'},
    bgRgbs: ['','61,214,140','255,160,64','255,88,32','255,210,0','255,232,0','210,80,255','255,61,127'],
    meterGrads: ['','linear-gradient(90deg,#3DD68C,#5EF0A8)','linear-gradient(90deg,#FFA040,#FFD060)','linear-gradient(90deg,#FF5820,#FF9040)','linear-gradient(90deg,#FFD700,#FFF060)','linear-gradient(90deg,#FFE040,#FFD700,#FF9800)','linear-gradient(90deg,#CC44FF,#EE88FF,#FF5722,#FFD700)','linear-gradient(90deg,#FF3D7F,#CC44FF,#FFD700,#FF5722,#4FC3F7)'],
    labels: (n) => ['','🎯 '+n+'連続！','🔥 '+n+'連続！！','⚡️ '+n+'連続！！！','💥 '+n+'連続！！！！','🏆 '+n+'連続！！！！！','👑 '+n+'連続！！！！！！','🌋 '+n+'連続・鬼神'],
    popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.22),rgba(61,214,140,.10))',
    comboLabel: (n) => n >= 2 ? '×'+n+' COMBO!' : '+1',
    comboColors: ['','#3DD68C','#FFA040','#FF5820','#FFD700','#FFE840','#EE88FF','#FF3D7F'],
    useGlitch: true,
    floaterGlyphs: { 5:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉'], 6:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉','🎊','🥳','🌈','💎','👑','🎆'], 7:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉','🎊','🥳','🌈','💎','👑','🎆','🌋','☄️'] },
    fastLabel: '⚡ 速答！',
    hardLabel: '💪 難問突破！',
    hardColors: ['#FF5722','#FFD700','#FFFFFF','#FF8A50','#FFB300'],
    recoverLabel: '🔄 立て直し！',
    recoverColors: ['#3DD68C','#5EF0A8','#FFFFFF','#A5F3C4'],
    freshLabel: '🌱 初見突破',
    revengeLabel: '⚔️ リベンジ達成',
    fastLabels: ['⚡ 一閃！','⚡ 速答！','⚡ ナイス'],
    tierUpLabel: (t) => '🔥 TIER ' + Math.max(1, Math.min(t, 7)) + ' 突入',
    signature: (n) => '🔥 ' + n + ' 連鎖',
    zoneGlyphs: ['🔥','✨','💥'],
    zoneColors: ['#FFA040','#FFD700','#FF5820']
  },
  neon: {
    burstPalettes: {
      2: ['#00E5FF','#7A5CFF','#FFFFFF','#39FF88'],
      3: ['#FF2BD6','#00E5FF','#FFFFFF','#7A5CFF','#39FF88'],
      4: ['#00E5FF','#FF2BD6','#FFFFFF','#7A5CFF','#39FF88','#00FFC8'],
      5: ['#00E5FF','#FF2BD6','#7A5CFF','#FFFFFF','#39FF88','#00FFC8','#FFE600','#FF2BD6'],
      6: ['#FF2BD6','#00E5FF','#7A5CFF','#39FF88','#FFFFFF','#00FFC8','#FFE600','#FF6EC7'],
      7: ['#FF3131','#FF2BD6','#00E5FF','#7A5CFF','#39FF88','#FFFFFF','#00FFC8','#FFE600','#FF6EC7']
    },
    shapes: () => ['square','shard'],
    ringColor: (tier) => tier >= 7 ? 'rgba(255,49,49,.92)' : tier >= 6 ? 'rgba(255,43,214,.9)' : tier >= 4 ? 'rgba(0,229,255,.9)' : 'rgba(122,92,255,.8)',
    fullscreenCols:  ['','','#00E5FF','#FF2BD6','#7A5CFF','#39FF88','#FFE600','#FF3131'],
    fullscreenGlow:  ['','','0,229,255','255,43,214','122,92,255','57,255,136','255,230,0','255,49,49'],
    flashColors: ['','','rgba(0,229,255,.30)','rgba(255,43,214,.42)','rgba(122,92,255,.62)','rgba(57,255,136,.70)','rgba(255,230,0,.72)','rgba(255,49,49,.78)'],
    borderColors: {4:'#00E5FF',5:'#FF2BD6',6:'#7A5CFF',7:'#FF3131'},
    bgRgbs: ['','0,229,255','255,43,214','122,92,255','57,255,136','0,255,200','255,230,0','255,49,49'],
    meterGrads: ['','linear-gradient(90deg,#00E5FF,#39FF88)','linear-gradient(90deg,#7A5CFF,#00E5FF)','linear-gradient(90deg,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#39FF88,#00FFC8)','linear-gradient(90deg,#00E5FF,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#FF2BD6,#00E5FF,#39FF88,#FFE600)','linear-gradient(90deg,#FF3131,#FF2BD6,#00E5FF,#39FF88,#FFE600)'],
    labels: (n) => ['','⚡️ x'+n+' STREAK','💠 x'+n+' STREAK!!','🔷 x'+n+' OVERDRIVE','🤖 x'+n+' OVERDRIVE!!','👾 x'+n+' MAXIMUM','🛸 x'+n+' LIMIT BREAK','🌐 x'+n+' SINGULARITY'],
    popOverlay: 'linear-gradient(135deg,rgba(0,229,255,.28),rgba(255,43,214,.14))',
    comboLabel: (n) => n >= 2 ? '⚡️[ x'+n+' ]' : '+1',
    comboColors: ['','#00E5FF','#7A5CFF','#FF2BD6','#39FF88','#00FFC8','#FFE600','#FF3131'],
    correctEmoji: ['⚡️','💠','🔷'],
    floaterScale: 1.5,
    fx: { rgb: '0,229,255', hex: '#00E5FF', particles: ['#00E5FF','#7A5CFF','#FF2BD6','#39FF88','#FFFFFF'], sparkle: ['#FFE600','#39FF88','#00FFC8'], glyph: '⚡️' },
    useGlitch: true,
    useHeavyGlitch: true,
    floaterGlyphs: { 5:['⚡️','💠','🔷','👾','🤖'], 6:['⚡️','💠','🔷','👾','🛸','🤖','🔋','📡'], 7:['⚡️','💠','🔷','👾','🛸','🤖','🔋','📡','🌐','🧬'] },
    fastLabel: '⚡ FAST!',
    hardLabel: '💠 HARD CLEAR',
    hardColors: ['#FF2BD6','#00E5FF','#FFFFFF','#7A5CFF','#FFE600'],
    recoverLabel: '🔄 REBOOT',
    recoverColors: ['#39FF88','#00FFC8','#FFFFFF','#00E5FF'],
    freshLabel: '🆕 FIRST TRY',
    revengeLabel: '⚔️ REVENGE',
    fastLabels: ['⚡ INSTANT!','⚡ FAST!','⚡ GOOD'],
    tierUpLabel: (t) => '▲ LEVEL ' + Math.max(1, Math.min(t, 7)) + ' UNLOCKED',
    signature: (n) => 'SYNC ' + Math.min(99, 40 + n * 3) + '%',
    zoneGlyphs: ['⚡️','💠','🔷'],
    zoneColors: ['#00E5FF','#FF2BD6','#7A5CFF']
  },
  ink: {
    burstPalettes: {
      2: ['#C93A3A','#1a1a1a','#C9A24B','#F5EFE0'],
      3: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0'],
      4: ['#C93A3A','#1a1a1a','#C9A24B','#F5EFE0','#8B1E1E','#E8C468'],
      5: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#4A4A4A','#FFD9D9'],
      6: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#FFD9D9','#2b2b2b'],
      7: ['#D4AF37','#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#FFD9D9']
    },
    shapes: () => ['blob'],
    ringColor: (tier) => tier >= 7 ? 'rgba(212,175,55,.85)' : tier >= 5 ? 'rgba(26,26,26,.75)' : 'rgba(201,58,58,.75)',
    fullscreenCols:  ['','','#C93A3A','#8B1E1E','#C9A24B','#E8C468','#1a1a1a','#D4AF37'],
    fullscreenGlow:  ['','','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26','212,175,55'],
    flashColors: ['','','rgba(201,58,58,.24)','rgba(139,30,30,.34)','rgba(201,162,75,.40)','rgba(26,26,26,.50)','rgba(201,58,58,.55)','rgba(212,175,55,.60)'],
    borderColors: {4:'#C93A3A',5:'#1a1a1a',6:'#C9A24B',7:'#D4AF37'},
    bgRgbs: ['','245,239,224','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26','212,175,55'],
    meterGrads: ['','linear-gradient(90deg,#C9A24B,#E8C468)','linear-gradient(90deg,#C93A3A,#E8925C)','linear-gradient(90deg,#8B1E1E,#C93A3A)','linear-gradient(90deg,#C9A24B,#C93A3A)','linear-gradient(90deg,#1a1a1a,#C93A3A,#C9A24B)','linear-gradient(90deg,#8B1E1E,#1a1a1a,#C9A24B)','linear-gradient(90deg,#D4AF37,#8B1E1E,#1a1a1a,#C93A3A)'],
    labels: (n) => ['','🖌️ '+n+'連続','💮 '+n+'連続','🏮 '+n+'連続','⛩️ '+n+'連続・見事','🀄 '+n+'連続・天晴','🐉 '+n+'連続・極','🔱 '+n+'連続・神域'],
    popOverlay: 'linear-gradient(135deg,rgba(201,58,58,.22),rgba(20,20,20,.12))',
    comboLabel: (n) => n >= 2 ? '💮×'+n+' 連続' : '+1',
    comboColors: ['','#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#E8C468','#8B1E1E','#D4AF37'],
    correctEmoji: ['💮','🖌️','🏮'],
    floaterScale: 1.5,
    fx: { rgb: '201,58,58', hex: '#C93A3A', particles: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0'], sparkle: ['#C9A24B','#E8C468','#8B1E1E'], glyph: '○' },
    useGlitch: false, useBrushSwipe: true,
    floaterGlyphs: { 5:['💮','🏮','🎐','🧧','⛩️'], 6:['💮','🏮','⛩️','🀄','🎐','🧧','🎏','🐉'], 7:['💮','🏮','⛩️','🀄','🎐','🧧','🎏','🐉','🔱','🎴'] },
    fastLabel: '⚡ 早業！',
    hardLabel: '🖌️ 難所を制す',
    hardColors: ['#C93A3A','#1a1a1a','#C9A24B','#F5EFE0','#8B1E1E'],
    recoverLabel: '🔄 持ち直し',
    recoverColors: ['#C9A24B','#E8C468','#F5EFE0','#C93A3A'],
    freshLabel: '🌱 初手にて',
    revengeLabel: '⚔️ 雪辱',
    fastLabels: ['⚡ 電光石火','⚡ 早業！','⚡ 上々'],
    tierUpLabel: (t) => '『 ' + (['','初伝','中伝','奥伝','皆伝','免許','極意','神域'][Math.max(1, Math.min(t, 7))] || '') + ' 』',
    signature: (n) => '連 ' + n + ' 手',
    zoneGlyphs: ['💮','🏮','🎐'],
    zoneColors: ['#C93A3A','#C9A24B','#F5EFE0']
  },
  ecg: {
    burstPalettes: {
      2: ['#00E676','#69F0AE','#FFFFFF','#00BFA5'],
      3: ['#00E676','#FFEA00','#FFFFFF','#69F0AE','#00BFA5'],
      4: ['#FFEA00','#FF9100','#00E676','#FFFFFF','#69F0AE','#FF5252'],
      5: ['#FF9100','#FF1744','#FFEA00','#FFFFFF','#00E676','#FF5252','#00E5FF'],
      6: ['#FF1744','#00E5FF','#FFEA00','#FFFFFF','#FF9100','#00E676','#D500F9','#FF5252'],
      7: ['#D500F9','#FF1744','#00E5FF','#FFEA00','#FFFFFF','#FF9100','#00E676','#FF5252']
    },
    shapes: () => ['circle','plus'],
    ringColor: (tier) => tier >= 7 ? 'rgba(213,0,249,.92)' : tier >= 6 ? 'rgba(0,229,255,.9)' : tier >= 4 ? 'rgba(255,23,68,.85)' : 'rgba(0,230,118,.8)',
    fullscreenCols:  ['','','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF','#D500F9'],
    fullscreenGlow:  ['','','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255','213,0,249'],
    flashColors: ['','','rgba(0,230,118,.28)','rgba(255,234,0,.34)','rgba(255,145,0,.5)','rgba(255,23,68,.65)','rgba(0,229,255,.75)','rgba(213,0,249,.80)'],
    borderColors: {4:'#FF9100',5:'#FF1744',6:'#00E5FF',7:'#D500F9'},
    bgRgbs: ['','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255','213,0,249','213,0,249'],
    meterGrads: ['','linear-gradient(90deg,#00E676,#69F0AE)','linear-gradient(90deg,#FFEA00,#FFF176)','linear-gradient(90deg,#FF9100,#FFC246)','linear-gradient(90deg,#FF1744,#FF6E7F)','linear-gradient(90deg,#00E5FF,#00E676,#FF1744)','linear-gradient(90deg,#D500F9,#00E5FF,#FF1744,#FFEA00)','linear-gradient(90deg,#D500F9,#FF1744,#00E5FF,#FFEA00,#00E676)'],
    labels: (n) => ['','💓 '+n+'連続・正常波形','📈 '+n+'連続・好調','⚡ '+n+'連続・覚醒','🩺 '+n+'連続・絶好調','🫀 '+n+'連続・フル稼働','🏥 '+n+'連続・完全治癒レベル','🧬 '+n+'連続・限界突破'],
    popOverlay: 'linear-gradient(135deg,rgba(0,230,118,.22),rgba(0,191,165,.12))',
    comboLabel: (n) => n >= 2 ? '💓×'+n+' 安定波形' : '+1',
    comboColors: ['','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF','#D500F9','#D500F9'],
    correctEmoji: ['➕','💊','🩺'],
    floaterScale: 1.3,
    fx: { rgb: '0,230,118', hex: '#00E676', particles: ['#00E676','#69F0AE','#FFFFFF','#00BFA5','#FFEA00'], sparkle: ['#FF1744','#FFFFFF','#00E5FF'], glyph: '➕' },
    useGlitch: true,
    pulseBeat: true,
    floaterGlyphs: { 5:['💊','🩺','❤️','➕','💉'], 6:['💊','🩺','❤️','➕','💉','🫀','⚕️','🏥'], 7:['💊','🩺','❤️','➕','💉','🫀','⚕️','🏥','🧬','🔬'] },
    fastLabel: '⚡ 即断！',
    hardLabel: '🩺 重症例クリア',
    hardColors: ['#FF1744','#FFEA00','#FFFFFF','#FF9100','#00E676'],
    recoverLabel: '🔄 リズム回復',
    recoverColors: ['#00E676','#69F0AE','#FFFFFF','#00BFA5'],
    freshLabel: '🌱 初回で正診',
    revengeLabel: '⚔️ 再挑戦成功',
    fastLabels: ['⚡ 即断即決！','⚡ 即断！','⚡ good'],
    useFlatline: true,
    tierUpLabel: (t) => '♥ STAGE ' + Math.max(1, Math.min(t, 7)),
    signature: (n) => '♥ ' + Math.min(180, 60 + n * 6) + ' bpm',
    zoneGlyphs: ['➕','💓','🩺'],
    zoneColors: ['#00E676','#FF1744','#FFEA00']
  },
  space: {
    burstPalettes: {
      2: ['#7C4DFF','#448AFF','#FFFFFF','#FFD54F'],
      3: ['#7C4DFF','#448AFF','#FFD54F','#FFFFFF','#B388FF'],
      4: ['#448AFF','#7C4DFF','#FFD54F','#FFFFFF','#B388FF','#40C4FF'],
      5: ['#7C4DFF','#40C4FF','#FFD54F','#FFFFFF','#B388FF','#FF80AB','#448AFF'],
      6: ['#FFD54F','#7C4DFF','#40C4FF','#FF80AB','#FFFFFF','#B388FF','#448AFF','#E040FB'],
      7: ['#64FFDA','#FFD54F','#7C4DFF','#40C4FF','#FF80AB','#FFFFFF','#B388FF','#448AFF','#E040FB']
    },
    shapes: () => ['star','circle'],
    ringColor: (tier) => tier >= 7 ? 'rgba(100,255,218,.92)' : tier >= 6 ? 'rgba(255,213,79,.9)' : tier >= 4 ? 'rgba(124,77,255,.85)' : 'rgba(68,138,255,.75)',
    fullscreenCols:  ['','','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB','#64FFDA'],
    fullscreenGlow:  ['','','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251','100,255,218'],
    flashColors: ['','','rgba(68,138,255,.28)','rgba(124,77,255,.36)','rgba(64,196,255,.5)','rgba(255,213,79,.6)','rgba(224,64,251,.7)','rgba(100,255,218,.75)'],
    borderColors: {4:'#40C4FF',5:'#FFD54F',6:'#E040FB',7:'#64FFDA'},
    bgRgbs: ['','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251','179,136,255','100,255,218'],
    meterGrads: ['','linear-gradient(90deg,#448AFF,#82B1FF)','linear-gradient(90deg,#7C4DFF,#B388FF)','linear-gradient(90deg,#40C4FF,#80D8FF)','linear-gradient(90deg,#FFD54F,#FFECB3)','linear-gradient(90deg,#E040FB,#7C4DFF,#40C4FF)','linear-gradient(90deg,#FFD54F,#E040FB,#7C4DFF,#40C4FF)','linear-gradient(90deg,#64FFDA,#E040FB,#FFD54F,#7C4DFF,#40C4FF)'],
    labels: (n) => ['','⭐ '+n+'連続','🌟 '+n+'連続','☄️ '+n+'連続・加速中','🚀 '+n+'連続・光速','🪐 '+n+'連続・銀河制覇','🌌 '+n+'連続・宇宙の覇者','🌠 '+n+'連続・特異点'],
    popOverlay: 'linear-gradient(135deg,rgba(124,77,255,.24),rgba(64,196,255,.12))',
    comboLabel: (n) => n >= 2 ? '🌠×'+n+' WARP' : '+1',
    comboColors: ['','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB','#B388FF','#64FFDA'],
    correctEmoji: ['⭐','✨','🌟'],
    fx: { rgb: '124,77,255', hex: '#7C4DFF', particles: ['#7C4DFF','#448AFF','#40C4FF','#FFFFFF','#FFD54F'], sparkle: ['#FFD54F','#FFFFFF','#E040FB'], glyph: '✦' },
    useGlitch: true,
    floaterGlyphs: { 5:['🌟','⭐','☄️','🪐','🚀'], 6:['🌟','⭐','☄️','🪐','🚀','🌌','👽','🛰️'], 7:['🌟','⭐','☄️','🪐','🚀','🌌','👽','🛰️','🌠','🔭'] },
    fastLabel: '⚡ 光速回答！',
    hardLabel: '☄️ 難関突破',
    hardColors: ['#E040FB','#FFD54F','#FFFFFF','#7C4DFF','#40C4FF'],
    recoverLabel: '🔄 軌道修正',
    recoverColors: ['#40C4FF','#B388FF','#FFFFFF','#448AFF'],
    freshLabel: '🌱 初回で到達',
    revengeLabel: '⚔️ 再突入成功',
    fastLabels: ['⚡ 超光速！','⚡ 光速回答！','⚡ good'],
    tierUpLabel: (t) => '🚀 PHASE ' + Math.max(1, Math.min(t, 7)),
    signature: (n) => 'WARP ' + (n * 0.4).toFixed(1) + 'c',
    zoneGlyphs: ['⭐','✨','☄️'],
    zoneColors: ['#7C4DFF','#40C4FF','#FFD54F']
  },
  retro: {
    burstPalettes: {
      2: ['#FF1053','#00A8E8','#FFD400','#FFFFFF'],
      3: ['#FF1053','#00A8E8','#00E676','#FFD400','#FFFFFF'],
      4: ['#00A8E8','#FF1053','#FFD400','#00E676','#FFFFFF','#FF7A00'],
      5: ['#FFD400','#FF1053','#00A8E8','#00E676','#FFFFFF','#FF7A00','#B026FF'],
      6: ['#FF1053','#00A8E8','#FFD400','#00E676','#FF7A00','#B026FF','#FFFFFF'],
      7: ['#39FF14','#FF1053','#00A8E8','#FFD400','#00E676','#FF7A00','#B026FF','#FFFFFF']
    },
    shapes: () => ['square','circle'],
    ringColor: (tier) => tier >= 7 ? 'rgba(57,255,20,.92)' : tier >= 6 ? 'rgba(176,38,255,.9)' : tier >= 4 ? 'rgba(255,16,83,.85)' : 'rgba(0,168,232,.75)',
    fullscreenCols:  ['','','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF','#39FF14'],
    fullscreenGlow:  ['','','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255','57,255,20'],
    flashColors: ['','','rgba(0,168,232,.28)','rgba(255,16,83,.36)','rgba(255,212,0,.5)','rgba(255,122,0,.62)','rgba(176,38,255,.72)','rgba(57,255,20,.75)'],
    borderColors: {4:'#FFD400',5:'#FF7A00',6:'#B026FF',7:'#39FF14'},
    bgRgbs: ['','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255','0,230,118','57,255,20'],
    meterGrads: ['','linear-gradient(90deg,#00A8E8,#4FD8FF)','linear-gradient(90deg,#FF1053,#FF6B8F)','linear-gradient(90deg,#FFD400,#FFF07A)','linear-gradient(90deg,#FF7A00,#FFB74D)','linear-gradient(90deg,#B026FF,#FF1053,#00A8E8)','linear-gradient(90deg,#FF1053,#FFD400,#00A8E8,#B026FF)','linear-gradient(90deg,#39FF14,#B026FF,#FF1053,#FFD400,#00A8E8)'],
    labels: (n) => ['','⭐ '+n+' HIT','👾 '+n+' COMBO','🕹️ '+n+' COMBO!!','💰 '+n+' HIGH SCORE','🏆 '+n+' PERFECT!','👑 '+n+' 1UP!! GAME MASTER','🌟 '+n+' LEGEND!!'],
    popOverlay: 'linear-gradient(135deg,rgba(0,168,232,.24),rgba(255,16,83,.12))',
    comboLabel: (n) => n >= 2 ? '👾 x'+n+' HIT!' : '+1',
    comboColors: ['','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF','#00E676','#39FF14'],
    correctEmoji: ['⭐','💎','🔺'],
    floaterScale: 1.2,
    fx: { rgb: '255,16,83', hex: '#FF1053', particles: ['#FF1053','#00A8E8','#FFD400','#00E676','#FFFFFF'], sparkle: ['#FFD400','#FFFFFF','#B026FF'], glyph: '★' },
    useGlitch: true,
    useCRT: true, chunkyShake: true,
    floaterGlyphs: { 5:['🕹️','👾','🎮','⭐','💎'], 6:['🕹️','👾','🎮','⭐','💎','🍄','🏆','💰'], 7:['🕹️','👾','🎮','⭐','💎','🍄','🏆','💰','🌟','🔫'] },
    fastLabel: '⚡ QUICK!',
    hardLabel: '👾 BOSS DOWN',
    hardColors: ['#FF1053','#FFD400','#FFFFFF','#B026FF','#FF7A00'],
    recoverLabel: '🔄 CONTINUE!',
    recoverColors: ['#00E676','#00A8E8','#FFFFFF','#FFD400'],
    freshLabel: '🆕 NO MISS',
    revengeLabel: '⚔️ REMATCH WIN',
    fastLabels: ['⚡ PERFECT!','⚡ QUICK!','⚡ NICE'],
    tierUpLabel: (t) => '★ STAGE ' + Math.max(1, Math.min(t, 7)) + ' CLEAR',
    signature: (n) => 'SCORE ' + (n * 1000).toLocaleString('en-US'),
    zoneGlyphs: ['★','◆','▲'],
    zoneColors: ['#FF1053','#00A8E8','#FFD400']
  },
  luxury: {
    burstPalettes: {
      2: ['#FFD700','#1a1a1a','#F7E7CE','#FFFFFF'],
      3: ['#FFD700','#1a1a1a','#F7E7CE','#FFFFFF','#C9A227'],
      4: ['#FFD700','#F7E7CE','#1a1a1a','#FFFFFF','#C9A227','#FFF3C4'],
      5: ['#FFD700','#F7E7CE','#C9A227','#FFFFFF','#1a1a1a','#FFF3C4','#E5C158'],
      6: ['#FFD700','#FFF3C4','#F7E7CE','#C9A227','#1a1a1a','#FFFFFF','#E5C158'],
      7: ['#E5E4E2','#FFD700','#FFF3C4','#F7E7CE','#C9A227','#1a1a1a','#FFFFFF','#E5C158']
    },
    shapes: () => ['circle','gem'],
    ringColor: (tier) => tier >= 7 ? 'rgba(229,228,226,.95)' : tier >= 6 ? 'rgba(255,215,0,.95)' : tier >= 4 ? 'rgba(201,162,39,.85)' : 'rgba(255,215,0,.7)',
    fullscreenCols:  ['','','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700','#E5E4E2'],
    fullscreenGlow:  ['','','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0','229,228,226'],
    flashColors: ['','','rgba(255,215,0,.24)','rgba(201,162,39,.3)','rgba(247,231,206,.4)','rgba(255,243,196,.55)','rgba(255,215,0,.7)','rgba(229,228,226,.72)'],
    borderColors: {4:'#C9A227',5:'#FFD700',6:'#FFF3C4',7:'#E5E4E2'},
    bgRgbs: ['','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0','26,26,26','229,228,226'],
    meterGrads: ['','linear-gradient(90deg,#FFD700,#FFF3C4)','linear-gradient(90deg,#C9A227,#E5C158)','linear-gradient(90deg,#F7E7CE,#FFF3C4)','linear-gradient(90deg,#FFD700,#C9A227)','linear-gradient(90deg,#1a1a1a,#FFD700,#F7E7CE)','linear-gradient(90deg,#FFD700,#1a1a1a,#FFF3C4,#C9A227)','linear-gradient(90deg,#E5E4E2,#FFD700,#1a1a1a,#FFF3C4,#C9A227)'],
    labels: (n) => ['','✨ '+n+'連続','💎 '+n+'連続','🥂 '+n+'連続・上質','👑 '+n+'連続・至高','🏆 '+n+'連続・栄光','💰 '+n+'連続・完全制覇','🌟 '+n+'連続・伝説'],
    popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.26),rgba(26,26,26,.14))',
    comboLabel: (n) => n >= 2 ? '💎×'+n+' JACKPOT' : '+1',
    comboColors: ['','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700','#1a1a1a','#E5E4E2'],
    correctEmoji: ['💎','✨','👑'],
    floaterScale: 1.2,
    fx: { rgb: '255,215,0', hex: '#FFD700', particles: ['#FFD700','#F7E7CE','#FFF3C4','#C9A227','#FFFFFF'], sparkle: ['#FFFFFF','#FFD700'], glyph: '♦' },
    useGlitch: false, useBrushSwipe: true,
    brushColorRgb: '255,215,0',
    floaterGlyphs: { 5:['💎','👑','🏆','💰','✨'], 6:['💎','👑','🏆','💰','✨','🥂','🎩','💍'], 7:['💎','👑','🏆','💰','✨','🥂','🎩','💍','🌟','🕯️'] },
    fastLabel: '⚡ 即決！',
    hardLabel: '💎 高難度クリア',
    hardColors: ['#FFD700','#C9A227','#FFF3C4','#FFFFFF','#E5C158'],
    recoverLabel: '🔄 巻き返し',
    recoverColors: ['#F7E7CE','#FFD700','#FFFFFF','#C9A227'],
    freshLabel: '🌱 一発正解',
    revengeLabel: '⚔️ 雪辱達成',
    fastLabels: ['⚡ 即断即決！','⚡ 即決！','⚡ good'],
    tierUpLabel: (t) => '✦ RANK ' + (['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ'][Math.max(1, Math.min(t, 7))] || ''),
    signature: (n) => '× ' + n + ' BONUS',
    zoneGlyphs: ['💎','✨','👑'],
    zoneColors: ['#FFD700','#F7E7CE','#FFF3C4']
  }
};

/* ══════════ 追加演出（2026-07-20）══════════
   設計方針(2026-08-14): 総量を増やすのではなく「山谷」を作る。ティア昇格の瞬間だけフル演出にし、
   同ティア内の連続正解はむしろ軽くする（_showStreakEffect の promoted 分岐）。
   ⚠️ 2026-08-25 にこの山谷設計は撤回した（STREAK_FULL_EVERY_TIME）。同ティア継続でもフル演出を出す。
   DOM系の演出は _fxOff() でガードする（MecFXはstudy.html側で既にno-op化される）。 */
const FAST_ANSWER_MS = 3000;          // これ以内の正解を「速答」とみなす
/* 2026-08-25: 「昇格フレームだけフル演出・同ティア内はあえて軽く」という山谷設計を撤回した。
   同ティア継続でもフル演出を出す（ユーザーの判断）。false へ戻せば旧挙動に戻る。
   ⚠️ TIER UP スタンプだけは promoted のまま——昇格していないのに TIER UP は嘘になる。 */
const _examCardSeenAt = new Map();    // uid → 最初に画面フォーカスされた時刻ms

function _fxOff() {
  return typeof _mecReducedMotion === 'function' && _mecReducedMotion();
}
/* 省電力（`html.mec-lite`）の JS 側の判定 _fxLite は、使い手（稼働灯・読書中の噴気）を 2026-09-28 に
   撤去したので一緒に外した。CSS 側の html.mec-lite はそのまま効いている。 */

/* ══════════ 演出タイマーの登録簿（2026-08-31・§cleanup）══════════
   演出は「クラスを付ける → N ミリ秒後に外す」「少し遅らせて粒子を撒く」の形が多く、
   study_exam.js には setTimeout が64本ある。そのうち `clearTimeout` で管理されていたのは
   10本だけで、**残りは試験を抜けても走り続けていた**。実害:
     ・`_afterCorrectFx` の遅延（90/150/260/420ms）は、正解直後に「終了」を押すと
       **通常閲覧の画面に演出DOMを生やしてから消える**
     ・`exitExam` が `MecFX.clear()` で粒子を消した後から、遅延ぶんが撒き直される
   ⚠️⚠️ **演出の遅延は必ず `_fxTimeout()` を通すこと。** 素の `setTimeout` で書くと
      登録簿に載らず、exitExam で止まらない。
   ⚠️ 逆に「試験を抜けた後も続いてよいもの」は素の setTimeout のままにすること——
      結果画面のランク刻印・祝賀（`_stampRank` / `showExamSummary`）は
      **exitExam の後に動くのが正しい**ので登録簿へ入れない。
   ⚠️ 登録簿は「掃除の一覧」を人が書き写す方式（exitExab の長い手続き）を減らすための
      仕組みなので、新しい演出を足すときに **cleanup へ1行足すことを思い出さなくて済む**
      形を保つこと。 */
let _fxTimers = new Set();
function _fxTimeout(fn, ms) {
  const id = setTimeout(() => { _fxTimers.delete(id); try { fn(); } catch (e) {} }, ms);
  _fxTimers.add(id);
  return id;
}
function _fxClearTimers() {
  _fxTimers.forEach(clearTimeout);
  _fxTimers.clear();
}

function _examTheme() {
  return EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
}

// A1: 出題カードが最初に画面フォーカスされた時刻を控える（速答判定の起点）
function _markCardSeen(card) {
  if (!card || !examMode) return;
  const uid = card.dataset && card.dataset.uid;
  if (uid && !_examCardSeenAt.has(uid)) _examCardSeenAt.set(uid, Date.now());
}

/* 速答ボーナス（一閃・速答・まずまず＝_fastGrade / _triggerFastBonus）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */

// 演出の発火座標を可視領域内に収める。直前の正解カードから次カードへのスムーススクロールが
// まだ動いている間に選んだ肢の矩形を読むと、肢が画面上端まで来ておりリング／ラベルが
// 「上の端」でズレて発火する（再試験は問題数が少なく速答が続くため起きやすい）。
// ヘッダー下端〜画面下端に必ずクランプして、答えたカードの位置で発火させる。
function _examFxHeaderBottom() {
  const h = document.querySelector('.st-hdr');
  return h ? h.getBoundingClientRect().bottom : 0;
}

// ══ 演出の可視帯（2026-08-04）══
// 演出の発火座標は「画面の 0.40〜0.44」ではなく、この帯の中心を正本にする。
// 旧実装は window.innerHeight だけを見ていたため、sticky ヘッダーが高い iPad では
// 中心が実際に見えている領域より上に来て、トースト・特大×n・粒子が上端で切れていた。
//   top    … ヘッダー下端（＝ここより上は隠れる）
//   bottom … 可視域の下端
// visualViewport があればそれを可視域の正本にする（Safariのツールバー出入り・分割表示・
// ピンチ・ソフトキーボードに追従する）。fixed 要素も MecFX の canvas も同じ
// レイアウトビューポート座標系なので、この帯の値をそのまま両方に使える。
const FX_BAND_PAD = 16;
/* ══════════ 可視帯の短命キャッシュ（2026-08-31）══════════
   `_fxBand()` は `.st-hdr` の getBoundingClientRect() を **同期で**読む。この関数は
   study_exam.js の40箇所から呼ばれ、`_examClampFxXY` が内部でもう一度呼ぶので
   `_getDispersedFxPos` は1回の座標決定で2回ぶん消費する。結果、**1解答あたり15〜20回**の
   レイアウト読みになり、その合間に演出側が style を書くので
   read→write→read の Layout Thrashing が起きていた（commit 2eea7fb が
   `void offsetWidth` を7箇所消したのはこの前段で、本丸はこちら）。

   帯は1コマの中では動かないので `FX_BAND_TTL_MS` だけ結果を使い回す。
   ⚠️ TTL を伸ばさないこと。16ms＝60fps の1コマぶんで、これを超えるとスクロール中に
      古い帯へ粒子が出る。
   ⚠️ 無効化の口（`_fxBandInvalidate`）を減らさないこと。ヘッダ下端はスクロールでは
      動かないが、**visualViewport の resize/scroll**（iOS のツールバー出入り・分割表示・
      ピンチ・ソフトキーボード）と window の resize では帯そのものが変わる。
   ⚠️ ここに rAF を使ったキャッシュ無効化を持ち込まないこと——非表示タブでは rAF が
      1コマも来ないので、裏に回した瞬間の帯が永久に固まる。 */
const FX_BAND_TTL_MS = 16;
let _bandCache = null, _bandCacheAt = -1e9;
function _fxBand() {
  const _now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  if (_bandCache && (_now - _bandCacheAt) >= 0 && (_now - _bandCacheAt) <= FX_BAND_TTL_MS) return _bandCache;
  const vv = window.visualViewport;
  const vLeft = vv ? vv.offsetLeft : 0;
  const vTop  = vv ? vv.offsetTop  : 0;
  const vW    = vv ? vv.width  : window.innerWidth;
  const vH    = vv ? vv.height : window.innerHeight;
  let top    = Math.max(vTop + FX_BAND_PAD, _examFxHeaderBottom() + FX_BAND_PAD);
  let bottom = vTop + vH - FX_BAND_PAD;
  // ヘッダーが可視域を食い尽くす（横向きの iPhone 等）ときは帯が潰れるので可視域全体へ戻す。
  if (bottom - top < 140) { top = vTop + FX_BAND_PAD; bottom = vTop + vH - FX_BAND_PAD; }
  _bandCacheAt = _now;
  _bandCache = {
    left: vLeft, width: vW, right: vLeft + vW,
    top: top, bottom: bottom, height: Math.max(1, bottom - top),
    vTop: vTop, vBottom: vTop + vH, vHeight: vH,   // ヘッダーを差し引く前の素の可視域
    cx: Math.round(vLeft + vW / 2),
    cy: Math.round((top + bottom) / 2)
  };
  return _bandCache;
}
function _fxBandInvalidate() { _bandCache = null; _bandCacheAt = -1e9; }
(function _bindBandInvalidate() {
  try {
    window.addEventListener('resize', _fxBandInvalidate);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', _fxBandInvalidate);
      window.visualViewport.addEventListener('scroll', _fxBandInvalidate);
    }
  } catch (e) {}
})();
function _examClampFxXY(cx, cy) {
  const b = _fxBand();
  return [Math.max(b.left + 8, Math.min(b.right - 8, cx)), Math.max(b.top, Math.min(b.bottom, cy))];
}

let _examLastFxAngle = 0;
let _examLastFxPos = { x: 0, y: 0 };

/**
 * 黄金角巡回 ＋ 最小距離保証（重なり最大60% ＝ 40%以上離す） ＋ 均等面積サンプリング
 * baseCx, baseCy: 基準中心（_fxBand().cx, _fxBand().cy）
 * maxR: 最大発火半径（shortSide * 0.45）
 */
function _getDispersedFxPos(baseCx, baseCy, maxR) {
  const GOLDEN_ANGLE = 2.399963; // 約137.5077度（ラジアン）
  const minSeparation = maxR * 0.45; // 2点間の最小離間距離（重なり60%以下）

  for (let attempt = 0; attempt < 4; attempt++) {
    // 黄金角で回転＋乱数微小揺らぎ
    _examLastFxAngle = (_examLastFxAngle + GOLDEN_ANGLE + (Math.random() - 0.5) * 0.35) % (Math.PI * 2);
    // 均等面積サンプリング（中心密集を完全解消し、短辺の20%〜90%に均等分散）
    const dist = maxR * Math.sqrt(0.12 + 0.88 * Math.random());
    const x = baseCx + Math.cos(_examLastFxAngle) * dist;
    const y = baseCy + Math.sin(_examLastFxAngle) * dist;

    const dx = x - _examLastFxPos.x;
    const dy = y - _examLastFxPos.y;
    const distFromLast = Math.hypot(dx, dy);

    if (distFromLast >= minSeparation || attempt === 3) {
      _examLastFxPos = { x, y };
      const [clampedX, clampedY] = _examClampFxXY(x, y);
      return { x: clampedX, y: clampedY };
    }
  }
  return { x: baseCx, y: baseCy };
}


// カード外周を光が1周する演出（_traceCardBorder）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。

/* ══════════ A1: 難問クリア（2026-08-14）══════════
   正答率60%未満の問題を正解したときだけ出す専用演出。易問と同じ祝い方をすると
   「何を突破したのか」という情報を捨てることになる。閾値 60 は study.html の
   フィルタ「難問(<60%)」・gamify.js の hard カウンタと同じ（3か所で揃えること）。
   ⚠️ data-rate が無い問題（正答率なし）は難問に数えない——出典に数字が載っていない
   だけで、難しいという意味ではないため。 */
const EXAM_HARD_RATE = 60;

function _cardRate(card) {
  const r = card && card.dataset ? card.dataset.rate : null;
  if (r == null || r === '') return null;
  const n = parseFloat(r);
  return isFinite(n) ? n : null;
}
function _isHardCard(card) {
  const n = _cardRate(card);
  return n != null && n < EXAM_HARD_RATE;
}

/* ══════════ B2: 進捗バーの「距離感」（2026-08-18）══════════
   バーの幅が伸びて数字が跳ねるだけだったので、残りの見通しを足す。50問セッションでは
   連続正解が切れている間（＝実力的に一番苦しい時間帯）に演出がゼロになっていた。

   ⚠️ 節目は「祝わない」。跨いだ瞬間に光が走るだけで、音も粒子も出さないこと。
      連続正解（tier）と別軸で祝う演出を足すと tier 演出とぶつかって画面が騒がしくなる。
      `node _work/test_exam_prog.js` がこの約束（節目でFX/音のAPIを呼ばないこと）を検査する。
   ⚠️ 難問は _isHardCard（data-rate < EXAM_HARD_RATE=60）が正本。data-rate が無い問題は
      難問に数えない。B2(道中の印)・B3(結果)・B4(開始前の予告)がこの1本を共有する。 */
const PROG_SPRINT_LEFT = 5;   // 残りこの数からラストスパート（盤面の色温度を上げる）
const PROG_TICK_MIN    = 8;   // 総数がこれ未満なら目盛りを打たない（近すぎて意味が無い）
const PROG_LAST_N      = 10;  // 「残り10問」の目盛り

/* 出題キューから目盛り・難問印の位置を作る。at は 0..1（バー左端からの割合）。
   ⚠️ 採点除外はバーの分母から外れる＝進まない区間なので、印も置かない
      （置くと以降の位置が全部ずれて「あと何問」が嘘になる）。
   opts で判定を差し替えられるのはテスト用（実DOM無しで幾何だけを検査する）。 */
function _examProgLayout(cards, opts) {
  const o = opts || {};
  const isExcluded = o.isExcluded || (c => _isExamUngraded(c));
  const isHard = o.isHard || (c => _isHardCard(c));
  const graded = (cards || []).filter(c => !isExcluded(c));
  const total = graded.length;
  const marks = [];
  graded.forEach((c, i) => { if (isHard(c)) marks.push({ n: i + 1, at: (i + 0.5) / total }); });
  const ticks = [];
  if (total >= PROG_TICK_MIN) {
    const half = Math.round(total / 2);
    ticks.push({ kind: 'half', n: half, at: half / total });
    const last = total - PROG_LAST_N;
    if (last > half) ticks.push({ kind: 'last', n: last, at: last / total });
  }
  return {
    total, ticks, marks,
    hardTotal: marks.length,
    excluded: (cards || []).length - total,
    sprintFrom: total > PROG_SPRINT_LEFT ? total - PROG_SPRINT_LEFT : null,
  };
}

let _examProgL = null;                 // 現セッションのレイアウト（startExam が作る）
// B3: 難問の成績。分母は出題時に確定、分子は解答のたびに増える
let _examHardStat = { total: 0, answered: 0, correct: 0 };
/* B5: 直前セッションの uid→正誤。結果画面を閉じた後、解いた問題が「成績付きで並び直す」
   ために持つ。ページ内の記憶だけで、localStorage キーは増やさない。
   ⚠️ C5 の `exam-scar`（誤答の傷）とは別物。あちらはセッション中だけの印で通常閲覧へ
      持ち越さないが、こちらは持ち越すことが目的。混ぜないこと。 */
const _examSessionResults = new Map();

/* ⚠️⚠️ 帯は疑似要素ではなく実要素 `.qc-recap` で描く（2026-09-12）。
   `.qc::after` は UIテーマ全8種が透かし模様（歯車・星図・ソナー等の170〜240pxの円）に使っており、
   テーマ側の詳細度 (0,2,2) が `.qc[data-recap]::after` (0,2,1) に勝つ。帯の left/top と
   テーマの width/height/border-radius が合成され、Brass では**緑の歯車の円がカード左上に居座った**
   （背景色だけ帯から、形はテーマから来る）。Aurora/Liquid/Frost/Cyber では逆に帯の色が消えていた。
   `.qc` の疑似要素はもう空いていない＝ここへ戻さないこと。 */
function _clearRecapChips() {
  document.querySelectorAll('.qc[data-recap]').forEach(c => {
    c.classList.remove('qc-recap-in');
    delete c.dataset.recap;
  });
  document.querySelectorAll('.qc > .qc-recap').forEach(el => el.remove());
}
function _applyRecapChips() {
  if (!_examSessionResults.size) return 0;
  let found = 0;
  _examSessionResults.forEach((ok, uid) => {
    const card = document.querySelector('.qc[data-uid="' + CSS.escape(uid) + '"]');
    if (!card) return;
    const val = ok ? 'ok' : 'ng';
    let bar = card.querySelector(':scope > .qc-recap');
    // _applyRecapChipsSoon が3回呼ぶので、既に同じ成績が付いているカードは入場をやり直さない
    // （やり直すと帯が3回点滅する）
    const fresh = !bar || card.dataset.recap !== val;
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'qc-recap';
      bar.setAttribute('aria-hidden', 'true');
      card.appendChild(bar);
    }
    card.dataset.recap = val;
    // 入場は最初の12枚だけ（画面外のカードまで一斉に動かす意味が無い）
    if (fresh && found < 12 && !_fxOff()) {
      card.style.setProperty('--recap-i', String(found));
      card.classList.remove('qc-recap-in'); void card.offsetWidth;
      card.classList.add('qc-recap-in');
    }
    found++;
  });
  return found;
}
/* 復元（_srsRestoreAfterReview / 科目の読み直し）が非同期なので、カードが戻るまで数回試す。
   1回きりだと復習セッション明けに何も付かない。 */
function _applyRecapChipsSoon() {
  [300, 900, 1800].forEach(ms => setTimeout(() => { if (!examMode) _applyRecapChips(); }, ms));
}

/* 3つの採点経路（複数選択・単一選択・計算問題）から必ず呼ぶ。
   ⚠️ _tallyChapter の隣に置くこと。examAnswered++ と同じ場所が唯一の真実点で、
      _afterCorrectFx は複数選択の経路を通らないのでここには使えない。 */
function _tallyQuestion(card, isCorrect) {
  const uid = card && card.dataset ? card.dataset.uid : '';
  if (uid) _examSessionResults.set(uid, !!isCorrect);
  if (_isHardCard(card)) { _examHardStat.answered++; if (isCorrect) _examHardStat.correct++; }
  // ボス戦の体力はここで動かす（3つの採点経路が必ず通る唯一の点。増援の追加もこの後の
  // _updateExamProg / _maybeShowFinishBtn より前に済ませる必要がある）
  if (_bossMode === true && window.MecBoss) { try { MecBoss.onAnswer(card, !!isCorrect); } catch (e) { console.error('[boss]', e); } }
  // 病棟回診（SRS復習の見せ方・ward.js）。退院／入院継続をここで記帳する
  if (_srsReviewMode && window.MecWard) { try { MecWard.onAnswer(card, !!isCorrect); } catch (e) { console.error('[ward]', e); } }
}

// 目盛りと難問印をバーへ敷く（セッション開始時に一度だけ）
function _renderExamProgMarks() {
  _examProgL = _examProgLayout(examQueue);
  _examHardStat = { total: _examProgL.hardTotal, answered: 0, correct: 0 };
  const track = document.querySelector('.exam-prog-track');
  if (!track) return;
  track.querySelectorAll('.ep-tick,.ep-hard').forEach(el => el.remove());
  track.classList.remove('exam-prog-complete');
  // 難問印（.ep-hard）や目盛り（.ep-tick）などの図形挿入は視覚的ノイズ全廃のため一切行わない
}

/* 節目で進捗バーを光が走る（ep-sweep）・残り5問のラストスパート（ep-sprint / exam-sprint）は
   2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */

/* 難問突破（👑 ラベル・大きな刻印・金の輪・粒＝_triggerHardClear）は 2026-09-28 に撤去した（ユーザー判断）。
   過去問ビューアの ceHardClear（chapter_exam.js）は旧演出のまま残してある。戻さないこと。 */

/* 立て直し（誤答の次を正解＝_triggerRecover）・初見突破／リベンジ達成（_triggerAnswerMark）・
   克服の当て板（_polishPlate）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */


/* A4(2026-08-26 改訂): 正解時の画面中央基準・短辺0〜90%黄金角巡回ダイナミック光彩パルス
   黄金角（137.5°）＋均等面積サンプリング＋重なり最大60%制御で画面全体に心地よく散乱。 */
/* ── ⑦ 触覚フィードバック（Web Haptics: テーマ固有振動パターン） ── */
/* ⚠️ iOS Safari は `navigator.vibrate` を実装していないので、**主環境の iPad では常に no-op**。
   壊れているのではなく「その端末には無い機能」で、Android Chrome では実際に振動する。
   消さずに残してあるのはそのため。iPad で触覚を出したくなっても、ここを直す話にはならない
   （WebKit に相当APIが無い）。 */
function _triggerThemeHaptics() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const curUi = window.MecUITheme ? MecUITheme.get() : 'aurora';
  try {
    if (curUi === 'brass') navigator.vibrate([35]);
    else if (curUi === 'cyber') navigator.vibrate([10, 20, 10]);
    else if (curUi === 'liquid') navigator.vibrate([25]);
    else if (curUi === 'kintsugi') navigator.vibrate([20]);
    else if (curUi === 'celestial') navigator.vibrate([12, 12, 12]);
    else if (curUi === 'abyss') navigator.vibrate([18, 30, 20, 30, 65]);
    else if (curUi === 'frost') navigator.vibrate([18]);
    else navigator.vibrate([15]);
  } catch (e) {}
}

/* UIテーマ固有の正解・連続正解（コンボ）カード装飾。正解のときだけ呼ぶ（誤答の後始末は _rfScoreWrong）。 */
function _applyCardThemeComboFx(card, streak) {
  if (!card) return;
  card.classList.add('fx-correct');
  card.classList.remove('combo-streak-3', 'combo-streak-5', 'combo-streak-10');
  if (streak >= 10) card.classList.add('combo-streak-10');
  else if (streak >= 5) card.classList.add('combo-streak-5');
  else if (streak >= 3) card.classList.add('combo-streak-3');
  // 正解選択肢に .correct クラス付与
  card.querySelectorAll('.ch2.ok').forEach(c => c.classList.add('correct'));
  // ⑦ 触覚フィードバック
  _triggerThemeHaptics();
}

/* ══ 正解／誤答の追加演出の合流点（2026-08-14）══
   revealAnswer（選択肢）と _revealCalcAnswer（計算問題の桁入力）の2経路があるので、
   新しい演出は必ずこの2関数へ足すこと。片方だけに書くと計算問題50問で演出が抜ける。 */
function _afterCorrectFx(card, fxEl) {
  // A5「選ばなかった肢が沈む」（_sinkOtherChoices・.exam-sink）は 2026-09-29 に撤去した（ユーザー判断）。
  // 2026-08-31（4f4a607）に CSS 側で見た目を打ち消して以来、クラスを付け外しするだけで何も見えていなかった。戻さないこと。
  // UIテーマ固有の演出は _rfCorrectFx が「正解の肢の位置で」出す。
  // 速答・初見突破・リベンジ・克服の当て板・立て直しは 2026-09-28 に撤去した（ユーザー判断）。
}


/* コンボメーターが割れて落ちる演出（_shatterComboMeter）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */

/* ══════════ C3: 同じ肢を繰り返し選んでいる（2026-08-14）══════════
   母集団の選択率は手元に無いので、「みんなが引っかかる肢」ではなく
   **自分が前にも同じ肢を選んだか** を出す。mec_choice_v1 が肢ごとの誤答回数を持っている。
   ⚠️ _recordWrongChoice は既に加算済みで呼ばれるので、2回以上＝過去にも選んだ、と読む。 */
function _isRepeatWrongChoice(uid, sel) {
  try {
    const ch = ((sel && sel.textContent || '').trim().charAt(0)) || '';
    if (!ch || ch === '?' || typeof _loadChoices !== 'function') return false;
    const d = _loadChoices()[uid];
    return !!(d && (d[ch] || 0) >= 2);
  } catch (e) { return false; }
}

function _triggerRepeatWrong(el) {
  if (_fxOff()) return;
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const b = _fxBand();
  const [cx, cy] = _examClampFxXY(
    r && r.width ? r.right - Math.min(70, r.width * .26) : b.cx,
    r && r.width ? r.bottom - 2 : b.cy);
  const lab = document.createElement('div');
  lab.className = 'exam-mark-pop warn';
  lab.textContent = '⚠️ 前にも同じ肢';
  lab.style.setProperty('--mk-col', '#FFB830');
  lab.style.left = cx + 'px';
  lab.style.top = cy + 'px';
  document.body.appendChild(lab);
  lab.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(.72)' },
    { opacity: 1, transform: 'translate(-50%,-118%) scale(1)', offset: .3 },
    { opacity: 1, transform: 'translate(-50%,-134%) scale(1)', offset: .72 },
    { opacity: 0, transform: 'translate(-50%,-170%) scale(.96)' }
  ], { duration: 1250, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'forwards' }).onfinish = () => lab.remove();
}

/* 心電図が平坦になる演出（_ecgFlatline / _ecgBeatBack）・誤答の傷（_markCardScar）・
   覚醒（_setAwaken）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。
   ⚠️ 演出テーマ表の useFlatline は過去問ビューア（CE_EFFECT_THEMES）とのキーの一致のために残してある。 */



// C9: 開始カウントダウン（3・2・1・START）。試験自体は裏で既に開始しているので非ブロッキング。
// C9: 開始カウントダウン。メカ起動シーケンス／電脳ダイブの2種を試験ごとにランダムで出す。
// 様式（レイアウトと動き）で世界観を作り、配色は演出テーマ(EXAM_EFFECT_THEMES)から取るので
// 7テーマ×2様式の組み合わせになる。試験自体は裏で既に開始済み＝非ブロッキング。
/* S8(2026-08-21): 'steam' を足した。筐体を真鍮で作り、歯車を回し、蒸気を噴かせておきながら、
   **セッションの入口だけがサイバー**だった＝Phase 4・5 で作った世界観に最後に残っていた語彙の穴。
   ⚠️ 既存インフラ（ランダム選択・タイプ表示・リマッチ分岐・_fxOff() の尊重）にそのまま乗る。
   ⚠️ 起動にかかる時間を1msも増やさないこと——尺（_cdEnd）は3様式で完全に同じ。
      試験を始めたい人にとって起動演出は待ち時間で、長い演出は2回目から邪魔になる。
   ⚠️ 出題数・科目のブートログは**実用を兼ねている**（何が始まるのか読める）ので、
      文体を変えても情報は1つも落とさないこと。 */
const EXAM_BOOT_STYLES = ['mecha', 'cyber', 'steam', 'zen', 'grimoire', 'abyss', 'frost', 'prism', 'liquid'];

function _examStyleForTheme(curUi) {
  if (curUi === 'brass') return 'steam';
  if (curUi === 'cyber') return 'cyber';
  if (curUi === 'kintsugi') return 'zen';
  if (curUi === 'celestial') return 'grimoire';
  if (curUi === 'abyss') return 'abyss';
  if (curUi === 'frost') return 'frost';
  if (curUi === 'aurora') return 'prism';
  if (curUi === 'liquid') return 'liquid';
  return EXAM_BOOT_STYLES[(Math.random() * 3) | 0]; // mecha, cyber, steam fallback
}

// B8: リマッチのブートログ。相手は「前回落とした問題」だと明示する
function _examRematchLines(style, qn) {
  if (style === 'mecha') {
    return [
      'MEC-OS  REMATCH PROTOCOL',
      'TARGET .................. 前回の誤答 ' + qn + ' 問',
      'LOADING OPPONENT DATA ... OK',
      'この ' + qn + ' 問を取り返す'
    ];
  }
  if (style === 'steam') {
    return [
      'MEC 機関   再 点 火',
      '標  的 ................ 前回の誤答 ' + qn + ' 問',
      '当て板 装填 ............ 完了',
      'この ' + qn + ' 問を取り返す'
    ];
  }
  if (style === 'zen') {
    return [
      '雪 辱   再 審',
      '標    的 .............. 過去の誤答 ' + qn + ' 題',
      '修復の心構え .......... 調息完了',
      'この ' + qn + ' 題を取り戻す'
    ];
  }
  if (style === 'abyss') {
    return [
      'ABYSSAL SALVAGE PROTOCOL',
      'TARGET ................. 前回の誤答 ' + qn + ' 問',
      'SALVAGE SCANNER ........ LOCKED',
      '沈んだ ' + qn + ' 問を引き揚げる'
    ];
  }
  if (style === 'prism') {
    return [
      'AURORA REFLECTION PROTOCOL',
      'DISPERSED SPECTRUM ..... ' + qn + ' BANDS',
      'CONVERGENCE LENS ....... READY',
      '散乱した ' + qn + ' 問を収束する'
    ];
  }
  if (style === 'liquid') {
    return [
      'LIQUID RE-FLOW PROTOCOL',
      'FADED PIGMENTS ......... ' + qn + ' MARKS',
      'CANVAS PREPARATION ..... OK',
      '滲んだ ' + qn + ' 問を鮮やかに塗り替える'
    ];
  }
  return ['再戦 / REMATCH', '対象：前回落とした ' + qn + ' 問', 'この ' + qn + ' 問を取り返す'];
}

function _examBootLines(style, qn, subjLabel) {
  if (style === 'mecha') {
    return [
      'MEC-OS  BOOT SEQUENCE',
      'MEMORY CHECK ............ OK',
      'QUESTION BANK ........... ' + qn,
      'SUBJECT ................. ' + subjLabel,
      'ALL SYSTEMS GREEN'
    ];
  }
  if (style === 'steam') {
    return [
      'MEC 機関   始 動 手 順',
      'ボイラー圧 ............. 規定値',
      '装填問題数 ............. ' + qn,
      '科    目 ............... ' + subjLabel,
      '全弁 開放'
    ];
  }
  if (style === 'zen') {
    return [
      '調 息   一 問 一 会',
      '静寂の境地 ............ 到達',
      '出題帳簿 .............. ' + qn + ' 題',
      '科    目 .............. ' + subjLabel,
      '無心にて 挑む'
    ];
  }
  if (style === 'abyss') {
    return [
      'ABYSSAL DIVE PROTOCOL',
      'TARGET DEPTH ........... 1,000m',
      'SONAR ARRAY ............ ONLINE',
      'TARGET ................. ' + qn + ' Q  //  ' + subjLabel,
      'DEEP FOCUS ENGAGED'
    ];
  }
  if (style === 'prism') {
    return [
      'AURORA PRISM ALIGNMENT',
      'SPECTRAL MATRIX ........ ' + qn + ' BANDS',
      'SPECTRUM ............... ' + subjLabel,
      'REFRACTION INDEX ....... 100%',
      'ILLUMINATE THE PATH'
    ];
  }
  if (style === 'liquid') {
    return [
      'LIQUID ART CANVASES',
      'INK INJECTION .......... COMPLETED',
      'PALETTE ................ ' + subjLabel,
      'COLOR CARDS ............ ' + qn + ' LAYERS',
      'PAINT THE TRUTH'
    ];
  }
  return ['接続確立 / LINK ESTABLISHED', '電脳ダイブ ... STAND BY', 'BANK ' + qn + ' Q  //  ' + subjLabel];
}

/* ══════════ Frost の起動画面 4案（2026-09-29）══════════
   デモ（_work/boot_frost_demo.html）でユーザーが採用した4案から、試験ごとにランダムで1つ出す。
   A 結露の窓（締めくくりはデモの ⑤ 霜が昇華する）／B 六花／C 絶対零度／D 氷盤。
   ⚠️ 尺は他の様式と同じ。時刻は _examCountdown の t0・goAt・endAt を ctx で受け取るだけで、ここでは持たない
      （起動演出は待ち時間＝1msも増やさない）。
   ⚠️ 色は演出テーマから取らず氷の色で固定する。Frost の演出テーマは celestial と共用の space（紫）なので、
      旧 frost 様式は紫の文字・「DIVE／GHOST LINK」の起動語（電脳ダイブの流用）になっていた。
   ⚠️ ブートログには出題数と科目名を必ず入れる（実用を兼ねている）。
   ⚠️ rAF のループは _cdLoop だけで回し、ctx.alive() が偽になったら止める（kill() で _cdTok が進む）。
   ⚠️ きらめきは Frost の正解演出と同じスプライト（_frGlint）を貼る。粒ごとにグラデーションを作らない。 */
let _cdTok = 0;
const _cdR = (a, b) => a + Math.random() * (b - a);
function _cdLoop(ctx, fn) {
  const st = performance.now();
  const tick = now => { if (!ctx.alive() || fn(now - st) === false) return; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
// 数字（3・2・1）と起動語の出し方。全様式で共用する
function _cdNumIn(el) {
  el.animate([
    { opacity: 0, transform: 'scale(2.1)', filter: 'blur(6px)' },
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: .32 },
    { opacity: 1, transform: 'scale(1)', offset: .72 },
    { opacity: 0, transform: 'scale(.88)' }
  ], { duration: 400, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
}
function _cdGoIn(num, sub) {
  num.animate([
    { opacity: 0, transform: 'scale(1.5) translateY(6px)' },
    { opacity: 1, transform: 'scale(1)', offset: .3 },
    { opacity: 1, offset: .72 },
    { opacity: 0, transform: 'scale(1.06)' }
  ], { duration: 760, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
  sub.animate([{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 1, offset: .7 }, { opacity: 0 }],
    { duration: 760, easing: 'ease-out', fill: 'forwards' });
}
function _cdFadeLog(c) { c.log.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); }
function _frbHex(cx, cy, r) {
  let d = '';
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); }
  return d + 'Z';
}
// B の雪の結晶。上向きの腕を1本だけ作って60°ずつ回す＝完全な6回対称。枝ぶりは毎回ちがう。
// 段 s0＝核（最初から）／s1＝腕（3）／s2＝枝（2）／s3＝孫枝と先端の六角板（1）
function _frbFlakeSvg() {
  const L = 90, s = [[], [], [], []];
  s[0].push(_frbHex(100, 100, 10), _frbHex(100, 100, 5));
  s[1].push('M100 90 L100 ' + (100 - L));
  const nb = 2 + (Math.random() * 2 | 0), ts = [];
  for (let i = 0; i < nb; i++) ts.push(_cdR(.28, .8));
  ts.sort((a, b) => a - b);
  const sin = Math.sin(Math.PI / 3), cos = Math.cos(Math.PI / 3);
  ts.forEach(t => {
    const y = 100 - L * t, bl = L * (1 - t) * _cdR(.35, .62);
    [-1, 1].forEach(sg => {
      s[2].push('M100 ' + y.toFixed(2) + ' L' + (100 + sg * bl * sin).toFixed(2) + ' ' + (y - bl * cos).toFixed(2));
      const mx = 100 + sg * bl * .55 * sin, my = y - bl * .55 * cos, tl = bl * _cdR(.25, .4);
      s[3].push('M' + mx.toFixed(2) + ' ' + my.toFixed(2) + ' L' + mx.toFixed(2) + ' ' + (my - tl).toFixed(2));
    });
  });
  s[3].push(_frbHex(100, 100 - L, 4.5));
  const yv = 100 - L * .16;
  s[3].push('M100 ' + yv + ' L93 ' + (yv - 4) + ' M100 ' + yv + ' L107 ' + (yv - 4));
  let g = '';
  s.forEach((ps, k) => {
    g += '<g class="s' + k + '">';
    (k === 0 ? [0] : [0, 60, 120, 180, 240, 300]).forEach(a => ps.forEach(d => {
      g += '<path class="frb-dash" pathLength="1" transform="rotate(' + a + ' 100 100)" d="' + d + '"/>';
    }));
    g += '</g>';
  });
  return '<svg class="frb-flake" viewBox="0 0 200 200">' + g + '</svg>';
}

const FROST_BOOTS = [
  /* A 結露の窓：画面が曇りガラスになり、縁から霜が這い込む。ログと数字は指でなぞった跡で、しずくが垂れる。
     起動で曇りと霜がきらめく粒になって上へ舞い上がる（昇華）。
     ⚠️ 曇りは backdrop-filter の全画面1枚。約2.7秒で消える一度きりの層なので許している。 */
  { key: 'a', prefix: '', wipe: true,
    lines: (qn, s) => ['FROSTED GLASS  //  結露の窓', '外 気 温 ............ −18 °C', '出 題 数 ............ ' + qn + ' 問', '科    目 ............ ' + s, '窓を拭う'],
    rematch: qn => ['FROSTED GLASS  //  再 走', '曇った跡 ............ 前回の誤答 ' + qn + ' 問', '指 で 拭 う ......... 準備完了', 'この ' + qn + ' 問をはっきり見る'],
    html: '<div class="frb-pane"><div class="frb-fog"></div></div>',
    build(c) {
      const pane = c.host.querySelector('.frb-pane');
      pane.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
      // 縁から内へ伸びる霜の羽。点列を先に作り、伸びた分だけ描き足す（毎フレーム描き直さない）
      const w = innerWidth, h = innerHeight, x = _frCtx(pane, w, h, 0, 1.5), depth = Math.min(w, h) * .3, paths = [];
      const grow = (x0, y0, a, len, lvl) => {
        const pts = [[x0, y0]]; let px = x0, py = y0, d = 0, ang = a;
        while (d < len) {
          ang += _cdR(-.22, .22); px += Math.cos(ang) * 6; py += Math.sin(ang) * 6; d += 6; pts.push([px, py]);
          if (lvl < 2 && d > 10 && Math.random() < .2) grow(px, py, ang + (Math.random() < .5 ? -1 : 1) * _cdR(.8, 1.1), (len - d) * _cdR(.3, .55), lvl + 1);
        }
        // 伸びる順は「画面の縁からの距離」で決める（枝も幹と同じ前線で伸びる）
        pts.forEach(q => q.push(Math.min(q[0], w - q[0], q[1], h - q[1])));
        paths.push({ pts, i: 1 });
      };
      const edge = (n, f) => { for (let i = 0; i < n; i++) f((i + Math.random()) / n); };
      edge(Math.ceil(w / 30), t => grow(t * w, 0, Math.PI / 2, depth * _cdR(.35, 1), 0));
      edge(Math.ceil(w / 30), t => grow(t * w, h, -Math.PI / 2, depth * _cdR(.35, 1), 0));
      edge(Math.ceil(h / 30), t => grow(0, t * h, 0, depth * _cdR(.35, 1), 0));
      edge(Math.ceil(h / 30), t => grow(w, t * h, Math.PI, depth * _cdR(.35, 1), 0));
      x.strokeStyle = 'rgba(240,250,255,.62)'; x.lineCap = 'round'; x.lineWidth = 1.1;
      _cdLoop(c, t => {
        const G = depth * Math.min(1, Math.pow(t / c.goAt, .7));
        x.beginPath();
        paths.forEach(p => {
          while (p.i < p.pts.length && p.pts[p.i][2] <= G) {
            const a = p.pts[p.i - 1], b = p.pts[p.i]; x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); p.i++;
          }
        });
        x.stroke();
        return t < c.goAt;
      });
    },
    num(c) {
      const el = c.num;
      el.animate([
        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', offset: .35 },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', filter: 'blur(0)', offset: .7 },
        { opacity: 0, clipPath: 'inset(0 0 0 0)', filter: 'blur(5px)' }
      ], { duration: 400, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      // なぞった跡の下端からしずくが1〜2粒垂れる
      const r = el.getBoundingClientRect(), k = Math.random() < .5 ? 2 : 1;
      for (let j = 0; j < k; j++) {
        const d = document.createElement('i'); d.className = 'frb-drip';
        d.style.left = (r.left + r.width * _cdR(.25, .75)) + 'px'; d.style.top = (r.bottom - r.height * .12) + 'px';
        c.host.appendChild(d);
        d.animate([{ opacity: 0, transform: 'translateY(0) scaleY(.6)' }, { opacity: 1, offset: .2 },
                   { opacity: .9, transform: 'translateY(' + (innerHeight * _cdR(.05, .09)) + 'px) scaleY(1.25)' }],
          { duration: 400, delay: 120 + j * 60, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
      }
    },
    goWord: 'CLEAR', goSub: '視 界 良 好 — VISIBILITY CLEAR',
    go(c) {
      c.host.querySelectorAll('.frb-drip').forEach(d => d.remove());
      _cdFadeLog(c);
      const pane = c.host.querySelector('.frb-pane'), cv = pane.querySelector('canvas');
      pane.firstChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, easing: 'ease-in', fill: 'forwards' });
      if (cv) cv.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -24px' }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
      // 昇華：縁（霜のあった場所）に寄せて生まれた粒が上へ舞い上がって消える
      const W = innerWidth, H = innerHeight, x = _frCtx(c.host, W, H, 0, 1.5), P = [];
      const n = Math.round(Math.min(220, 90 + W * H / 9000));
      for (let i = 0; i < n; i++) {
        const e = Math.random(), m = Math.min(W, H) * .28 * Math.pow(Math.random(), 1.6);
        P.push({ x: e < .25 ? m : e < .5 ? W - m : _cdR(0, W), y: e < .5 ? _cdR(0, H) : e < .75 ? m : H - m,
                 vx: _cdR(-20, 20), vy: -_cdR(60, 190), s: _cdR(1.1, 3.2), ph: _cdR(0, 6.28), f: _cdR(10, 20), d: _cdR(0, 180) });
      }
      _cdLoop(c, t => {
        x.clearRect(0, 0, W, H);
        P.forEach(p => {
          const tt = t - p.d; if (tt < 0) return;
          const sec = tt / 1000, life = Math.min(1, tt / 600);
          _frGlint(x, p.x + p.vx * sec, p.y + p.vy * sec, p.s, Math.sin(life * Math.PI) * (.6 + .4 * Math.sin(p.ph + sec * p.f)));
        });
        return t < 780;
      });
      _cdGoIn(c.num, c.sub);
    } },

  /* B 六花：中央で雪の結晶の核ができ、3で腕・2で枝・1で孫枝と先端の六角板が伸びる。
     起動で結晶がほどけてダイヤモンドダストになり舞い落ちる。 */
  { key: 'b', prefix: '· ',
    lines: (qn, s) => ['SIX-FOLD CRYSTAL GROWTH', '過 冷 却 ............ −15 °C', '結 晶 核 ............ ' + qn + ' 問', '科    目 ............ ' + s, '六花、成長開始'],
    rematch: qn => ['RE-CRYSTALLIZATION', '欠けた枝 ............ 前回の誤答 ' + qn + ' 問', '再 結 晶 ............ 準備完了', 'この ' + qn + ' 問で結晶を完成させる'],
    html: '',
    build(c) {
      c.host.insertAdjacentHTML('afterbegin', _frbFlakeSvg());
      const f = c.host.querySelector('.frb-flake');
      f.animate([{ rotate: '-8deg' }, { rotate: '14deg' }], { duration: c.endAt, easing: 'linear', fill: 'forwards' });
      c.at(80, () => f.querySelectorAll('.s0 .frb-dash').forEach(p => p.classList.add('on')));
    },
    num(c, i) {
      c.host.querySelectorAll('.frb-flake .s' + (i + 1) + ' .frb-dash').forEach(p => p.classList.add('on'));
      _cdNumIn(c.num);
    },
    goWord: 'CRYSTAL', goSub: '六 花 — 結 晶 完 了',
    go(c) {
      c.host.querySelector('.frb-flake').animate([
        { scale: '1', opacity: .8, filter: 'drop-shadow(0 0 6px rgba(158,227,255,.85)) brightness(1)' },
        { scale: '1.06', opacity: 1, filter: 'drop-shadow(0 0 14px rgba(255,255,255,1)) brightness(1.8)', offset: .18 },
        { scale: '1.4', opacity: 0, filter: 'drop-shadow(0 0 6px rgba(158,227,255,.5)) brightness(1)' }
      ], { duration: 700, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'forwards' });
      // ダイヤモンドダスト：結晶のあった円の中から生まれ、ゆっくり舞い落ちて瞬く
      const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2, x = _frCtx(c.host, w, h, 0, 1.5);
      const rad = Math.min(Math.min(w, h) * .32, 260), P = [], n = Math.round(Math.min(160, 60 + w * h / 12000));
      for (let i = 0; i < n; i++) {
        const a = _cdR(0, 6.283), r = rad * Math.sqrt(Math.random());
        P.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: Math.cos(a) * _cdR(10, 50), vy: _cdR(20, 70), s: _cdR(.9, 2.8), ph: _cdR(0, 6.28), f: _cdR(8, 16) });
      }
      _cdLoop(c, t => {
        x.clearRect(0, 0, w, h);
        const sec = t / 1000, life = Math.min(1, t / 780);
        P.forEach(p => _frGlint(x, p.x + p.vx * sec + Math.sin(p.ph + sec * 3) * 6, p.y + p.vy * sec, p.s,
          (1 - life) * (.55 + .45 * Math.sin(p.ph + sec * p.f))));
        return t < 780;
      });
      _cdGoIn(c.num, c.sub);
    } },

  /* C 絶対零度：冷却装置の計器。温度計が体温 36.5 ℃ から下がり、3＝N₂・2＝H₂・1＝He の沸点を通り、起動で 0 K。 */
  { key: 'c', prefix: '> ',
    lines: (qn, s) => ['CRYOGENIC SEQUENCE', '冷 却 材 ............ LN₂ 充填', '試 料 数 ............ ' + qn + ' 問', '科    目 ............ ' + s, '絶対零度へ'],
    rematch: qn => ['CRYO RE-SCAN', '解凍した標本 ........ 前回の誤答 ' + qn + ' 問', '再 凍 結 ............ STANDBY', 'この ' + qn + ' 問を凍結し直す'],
    html: '<div class="frb-grid"></div><div class="frb-vig"></div>',
    build(c) {
      let tk = '';
      for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, m = i % 5 === 0, r1 = m ? 86 : 88;
        tk += '<line class="tk' + (m ? ' m' : '') + '" x1="' + (100 + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (100 - r1 * Math.cos(a)).toFixed(2)
            + '" x2="' + (100 + 94 * Math.sin(a)).toFixed(2) + '" y2="' + (100 - 94 * Math.cos(a)).toFixed(2) + '"/>';
      }
      c.host.insertAdjacentHTML('afterbegin',
        '<svg class="frb-gauge" viewBox="0 0 200 200"><defs><linearGradient id="frbCryoG" x1="0" y1="0" x2="1" y2="1">'
        + '<stop offset="0" stop-color="#70D6FF"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs>'
        + tk + '<circle class="trk" cx="100" cy="100" r="78"/>'
        + '<circle class="arc" pathLength="1" cx="100" cy="100" r="78" transform="rotate(-90 100 100)"/></svg>');
      c.host.insertAdjacentHTML('beforeend', '<div class="frb-temp"><b>+36.5 °C</b><span>BODY TEMP</span></div>');
      const arc = c.host.querySelector('.frb-gauge .arc'), tb = c.host.querySelector('.frb-temp b'),
            sp = c.host.querySelector('.frb-temp span'), vig = c.host.querySelector('.frb-vig');
      const KF = [[0, 36.5], [c.t0, -196], [c.t0 + 420, -253], [c.t0 + 840, -269], [c.goAt, -273.15]];
      _cdLoop(c, t => {
        let v = KF[KF.length - 1][1];
        for (let i = 1; i < KF.length; i++) if (t < KF[i][0]) {
          const u = (t - KF[i - 1][0]) / (KF[i][0] - KF[i - 1][0]);
          v = KF[i - 1][1] + (KF[i][1] - KF[i - 1][1]) * (1 - Math.pow(1 - u, 2)); break;
        }
        const fr = Math.min(1, (36.5 - v) / 309.65);
        arc.style.strokeDashoffset = String(1 - fr);
        vig.style.opacity = String(Math.pow(fr, 3) * .9);
        tb.textContent = (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + ' °C';
        if (t < c.t0) sp.textContent = v > 30 ? 'BODY TEMP' : 'COOLING';
        return t < c.goAt;
      });
    },
    num(c, i) {
      c.host.querySelector('.frb-temp span').textContent = ['N₂ 沸点 −196 °C', 'H₂ 沸点 −253 °C', 'He 沸点 −269 °C'][i];
      c.host.querySelector('.frb-gauge').animate([{ scale: '1.035' }, { scale: '1' }], { duration: 300, easing: 'cubic-bezier(.2,1,.3,1)' });
      _cdNumIn(c.num);
    },
    goWord: '0 K', goSub: 'ABSOLUTE ZERO — 雑 念 停 止',
    go(c) {
      c.host.querySelector('.frb-temp b').textContent = '−273.15 °C';
      c.host.querySelector('.frb-temp span').textContent = '0 KELVIN';
      c.host.querySelector('.frb-gauge').animate([
        { scale: '1', opacity: 1, filter: 'brightness(1)' }, { scale: '1.04', opacity: 1, filter: 'brightness(2.2)', offset: .15 },
        { scale: '1.22', opacity: 0, filter: 'brightness(1)' }
      ], { duration: 700, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'forwards' });
      c.host.querySelector('.frb-vig').animate([{ opacity: .9 }, { opacity: 1, offset: .15 }, { opacity: 0 }], { duration: 760, fill: 'forwards' });
      c.host.querySelector('.frb-temp').animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 760, fill: 'forwards' });
      _cdGoIn(c.num, c.sub);
    } },

  /* D 氷盤：画面が厚い氷に閉ざされ、文字は氷の中に封じられて見える。3・2・1 で亀裂が広がり、起動で割れ落ちる。
     破片は亀裂と同じ角度・同じ輪で切る（亀裂と破片の形が揃う）。 */
  { key: 'd', prefix: '— ', wipe: true,
    lines: (qn, s) => ['ICE SHEET  //  氷盤', '氷    厚 ............ 1.2 m', '封じた問題 .......... ' + qn + ' 問', '科    目 ............ ' + s, '亀裂、走る'],
    rematch: qn => ['ICE SHEET  //  再 凍 結', '閉じ込めた誤答 ...... ' + qn + ' 問', '砕    氷 ............ 準備完了', 'この ' + qn + ' 問を割り出す'],
    html: '<div class="frb-slab frb-ice"></div>',
    build(c) {
      const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2, diag = Math.hypot(w, h);
      c.host.querySelector('.frb-slab').animate([{ opacity: 0, scale: '1.03' }, { opacity: 1, scale: '1' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
      const N = 7, base = _cdR(0, 6.283), ang = [];
      for (let i = 0; i < N; i++) ang.push(base + i * 6.283 / N + _cdR(-.22, .22));
      const r1 = Math.min(w, h) * _cdR(.13, .17), r2 = Math.min(w, h) * _cdR(.32, .38);
      c.ice = { cx, cy, ang, r1, r2, diag };
      const P = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      const jag = (a, rA, rB) => {
        let d = ''; const n = Math.max(2, Math.round((rB - rA) / 26));
        for (let i = 0; i <= n; i++) {
          const [x, y] = P(a + ((i === 0 || i === n) ? 0 : _cdR(-.035, .035)), rA + (rB - rA) * i / n);
          d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        return d;
      };
      // 3：3本が中心から r2 まで／2：残り4本と、最初の3本の続きが画面の外まで／1：蜘蛛の巣（r1・r2 の輪）
      const st = [[], [], []];
      [0, 3, 5].forEach(i => st[0].push(jag(ang[i], 0, r2)));
      [1, 2, 4, 6].forEach(i => st[1].push(jag(ang[i], 0, diag * .75)));
      [0, 3, 5].forEach(i => st[1].push(jag(ang[i], r2, diag * .75)));
      [r1, r2].forEach(r => { for (let i = 0; i < N; i++) {
        const a2 = ang[(i + 1) % N] + (i === N - 1 ? 6.283 : 0);
        const [x1, y1] = P(ang[i], r), [x2, y2] = P(a2, r), [mx, my] = P((ang[i] + a2) / 2, r * _cdR(.9, .97));
        st[2].push('M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      } });
      let svg = '<svg class="frb-cracks" viewBox="0 0 ' + w + ' ' + h + '">';
      st.forEach((ps, k) => {
        svg += '<g class="k' + k + '">';
        ps.forEach(d => { svg += '<path class="d frb-dash" pathLength="1" d="' + d + '"/><path class="w frb-dash" pathLength="1" d="' + d + '"/>'; });
        svg += '</g>';
      });
      c.host.insertAdjacentHTML('beforeend', svg + '</svg>');
    },
    num(c, i) {
      c.host.querySelectorAll('.frb-cracks .k' + i + ' .frb-dash').forEach(p => p.classList.add('on'));
      const slab = c.host.querySelector('.frb-slab');
      if (slab) slab.animate([{ translate: '0 0' }, { translate: (i % 2 ? 3 : -3) + 'px 2px' }, { translate: '0 0' }], { duration: 120, easing: 'ease-out' });
      c.num.animate([
        { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.08)' },
        { opacity: 1, filter: 'blur(0)', transform: 'scale(1)', offset: .3 },
        { opacity: 1, offset: .72 },
        { opacity: 0, filter: 'blur(4px)' }
      ], { duration: 400, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
    },
    goWord: 'BREAK', goSub: '氷 解 — THE ICE BREAKS',
    go(c) {
      const { cx, cy, ang, r1, r2, diag } = c.ice, N = ang.length, Rb = diag * 1.2;
      const slab = c.host.querySelector('.frb-slab'); if (slab) slab.remove();
      c.host.querySelector('.frb-cracks').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      c.log.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      const P = (a, r) => (cx + Math.cos(a) * r).toFixed(1) + 'px ' + (cy + Math.sin(a) * r).toFixed(1) + 'px';
      for (let i = 0; i < N; i++) {
        const a1 = ang[i], a2 = ang[(i + 1) % N] + (i === N - 1 ? 6.283 : 0), am = (a1 + a2) / 2;
        [[[cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px', P(a1, r1), P(a2, r1)], 30, 0, r1 * .6],
         [[P(a1, r1), P(a1, r2), P(a2, r2), P(a2, r1)], 90, 30, (r1 + r2) / 2],
         [[P(a1, r2), P(a1, Rb), P(a2, Rb), P(a2, r2)], 170, 60, r2 * 1.4]].forEach(([poly, dist, dl, ro]) => {
          const s = document.createElement('div'); s.className = 'frb-shard frb-ice';
          s.style.clipPath = 'polygon(' + poly.join(',') + ')';
          s.style.transformOrigin = P(am, ro);
          c.host.insertBefore(s, c.log);
          const dx = Math.cos(am) * dist * _cdR(.8, 1.2), dy = Math.sin(am) * dist * _cdR(.8, 1.2);
          s.animate([{ translate: '0 0', rotate: '0deg', opacity: 1 },
                     { translate: dx + 'px ' + (dy + innerHeight * .28) + 'px', rotate: _cdR(-16, 16) + 'deg', opacity: 0 }],
            { duration: 680, delay: dl, easing: 'cubic-bezier(.35,.1,.6,1)', fill: 'both' });
        });
      }
      const fl = document.createElement('div'); fl.className = 'frb-flash'; c.host.appendChild(fl);
      fl.animate([{ opacity: 0, scale: '.4' }, { opacity: 1, scale: '1', offset: .15 }, { opacity: 0, scale: '2.2' }], { duration: 520, easing: 'ease-out', fill: 'forwards' });
      _cdGoIn(c.num, c.sub);
    } }
];

/* ══════════ Celestial の起動画面 4案（2026-09-29）══════════
   デモ（_work/boot_celestial_demo.html）でユーザーが採用した4案から、試験ごとにランダムで1つ出す。
   A 星座を結ぶ／B 天球儀／D 星図の魔導書／E 日周運動（デモの C 皆既日食は不採用）。
   ⚠️ 尺・ctx の受け取り方・_cdLoop・ブートログの情報は FROST_BOOTS と同じ約束（上のコメント）。
   ⚠️ 色は演出テーマ（space の紫）から取らず、Celestial の金・藍・紫で固定する。
      旧 grimoire 様式は紫の魔法陣に「DIVE／GHOST LINK」の起動語（電脳ダイブの流用）だった。
   ⚠️ 正解演出（超新星・銀河の渦・星の軌跡・十二宮の輪）と題材を被らせない。 */
const CL_STAR_COLS = ['255,255,255', '255,236,190', '200,220,255', '214,190,255', '170,236,255'];
let _clbGlintImg = null;
function _clbGlintSprite() {   // 金の4本光条＋芯（粒ごとにグラデーションを作らない）
  if (_clbGlintImg) return _clbGlintImg;
  const s = 32, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const x = cv.getContext('2d'), m = s / 2, g = x.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,236,180,.85)'); g.addColorStop(1, 'rgba(255,209,102,0)');
  x.fillStyle = g; x.beginPath(); x.arc(m, m, m * .5, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,248,225,.9)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(m, 1); x.lineTo(m, s - 1); x.moveTo(1, m); x.lineTo(s - 1, m); x.stroke();
  return (_clbGlintImg = cv);
}
// 静止した星空を1回だけ描く（毎フレーム描き直さない）
function _clbStarfield(parent, n) {
  const w = innerWidth, h = innerHeight, x = _frCtx(parent, w, h, 0, 1.5);
  for (let i = 0; i < n; i++) {
    const r = Math.random() < .08 ? _cdR(1, 1.7) : _cdR(.35, .9);
    x.fillStyle = 'rgba(' + CL_STAR_COLS[(Math.random() * CL_STAR_COLS.length) | 0] + ',' + _cdR(.35, .95).toFixed(2) + ')';
    x.beginPath(); x.arc(_cdR(0, w), _cdR(0, h), r, 0, 7); x.fill();
  }
  parent.insertBefore(x.canvas, parent.firstChild);   // いちばん奥（星座・環・本より下）
  return x.canvas;
}
const _clbStarN = k => Math.round(Math.min(420, innerWidth * innerHeight / k));
// 金の粒が点から放たれて消える
function _clbSparks(c, pts, per, dur) {
  const w = innerWidth, h = innerHeight, x = _frCtx(c.host, w, h, 0, 1.5), spr = _clbGlintSprite(), P = [];
  pts.forEach(([px, py]) => { for (let i = 0; i < per; i++) { const a = _cdR(0, 6.283), v = _cdR(40, 190); P.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: _cdR(5, 14), ph: _cdR(0, 6) }); } });
  _cdLoop(c, t => {
    x.clearRect(0, 0, w, h);
    const life = Math.min(1, t / dur), sec = t / 1000, dmp = 1 - life * .5;
    P.forEach(p => {
      x.globalAlpha = (1 - life) * (.6 + .4 * Math.sin(p.ph + sec * 14));
      x.drawImage(spr, p.x + p.vx * sec * dmp - p.s / 2, p.y + p.vy * sec * dmp - p.s / 2, p.s, p.s);
    });
    x.globalAlpha = 1;
    return t < dur;
  });
}
// 数字は星が灯るように（小さく光ってから大きさが定まる）。起動語は共用の _cdGoIn
function _clbNumIn(el) {
  el.animate([
    { opacity: 0, transform: 'scale(.6)', filter: 'blur(8px) brightness(2.2)' },
    { opacity: 1, transform: 'scale(1.04)', filter: 'blur(0) brightness(1.4)', offset: .3 },
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0) brightness(1)', offset: .72 },
    { opacity: 0, transform: 'scale(1.08)', filter: 'blur(3px) brightness(1)' }
  ], { duration: 400, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
}
// ブートログは星明かりのように、ぼやけて灯ってから焦点が合う
function _clbLineIn(d) {
  d.animate([{ opacity: 0, filter: 'blur(4px)', letterSpacing: '.18em' }, { opacity: 1, filter: 'blur(0)', letterSpacing: '.02em' }],
    { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
}
// A の星座（座標は 0〜100 の正方形・3番目は明るさ）と、3・2・1 で1組ずつ引く結線。へびつかい座は医神アスクレピオス
const CL_CONSTS = [
  { name: 'へびつかい座',
    s: [[50, 8, 3], [67, 25, 2.2], [34, 24, 2.2], [31, 55, 2.4], [40, 62, 2], [60, 67, 2.4], [71, 50, 2.6], [64, 90, 1.8], [22, 40, 1.6], [83, 38, 1.6]],
    e: [[[0, 2], [0, 1]], [[2, 3], [1, 6], [3, 4], [2, 8], [6, 9]], [[4, 5], [5, 6], [5, 7]]] },
  { name: 'オリオン座',
    s: [[30, 20, 3.2], [67, 23, 2.4], [49, 8, 1.8], [41, 50, 2.2], [50, 48, 2.4], [59, 46, 2.2], [36, 84, 2.2], [70, 82, 3.2], [50, 62, 1.5], [14, 16, 1.4], [85, 30, 1.4]],
    e: [[[2, 0], [2, 1], [0, 9], [1, 10]], [[0, 3], [1, 5], [3, 4], [4, 5]], [[3, 6], [5, 7], [4, 8]]] },
  { name: 'おおぐま座 ・ 北斗七星',
    s: [[80, 30, 2.8], [82, 52, 2.4], [62, 57, 2.2], [58, 38, 1.8], [42, 35, 2.6], [27, 39, 2.4], [10, 53, 2.6], [30, 33, 1.2]],
    e: [[[0, 1], [1, 2]], [[2, 3], [3, 0]], [[3, 4], [4, 5], [5, 6], [5, 7]]] }
];
// D の星図の頁（種から決まる＝同じ種なら同じ絵）
function _clbChartSvg(seed) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let g = '<svg viewBox="0 0 100 140">';
  g += '<circle class="g" cx="50" cy="64" r="40"/><circle class="g" cx="50" cy="64" r="26"/><circle class="g" cx="50" cy="64" r="12"/>';
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; g += '<line class="g" x1="' + (50 + Math.cos(a) * 40).toFixed(1) + '" y1="' + (64 + Math.sin(a) * 40).toFixed(1) + '" x2="' + (50 - Math.cos(a) * 40).toFixed(1) + '" y2="' + (64 - Math.sin(a) * 40).toFixed(1) + '"/>'; }
  const pts = [];
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 38, p = [50 + Math.cos(a) * r, 64 + Math.sin(a) * r]; pts.push(p); g += '<circle class="s" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (rnd() * 1 + .35).toFixed(2) + '"/>'; }
  for (let i = 0; i < 6; i++) { const a = pts[i * 2], b = pts[i * 2 + 1]; g += '<line class="l" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>'; }
  const T = ['TABVLA ASTRORVM', 'SPHAERA MVNDI', 'MOTVS STELLARVM', 'CAELVM BOREALE', 'CAELVM AVSTRALE', 'HARMONIA MVNDI'];
  g += '<text x="50" y="14">' + T[seed % 6] + '</text><text x="50" y="124">— ' + ['I', 'II', 'III', 'IV', 'V', 'VI'][seed % 6] + ' —</text>';
  g += '<line class="g" x1="18" y1="18" x2="82" y2="18"/><line class="g" x1="18" y1="118" x2="82" y2="118"/>';
  return g + '</svg>';
}
const CELESTIAL_BOOTS = [
  /* A 星座を結ぶ：星が1つずつ灯り、3・2・1 で結線が1組ずつ引かれる。起動で線が金に灯り、星から光がこぼれる */
  { key: 'a', prefix: '✦ ', lineIn: _clbLineIn,
    lines: (qn, s) => ['CONSTELLATION ATLAS', '観 測 星 野 ........ ' + s, '恒 星 数 ............ ' + qn + ' 問', '赤 経 ・ 赤 緯 ..... 同期完了', '星を結び、形を読む'],
    rematch: qn => ['CONSTELLATION REFORGE', '欠けた星 ............ 前回の誤答 ' + qn + ' 問', '再 結 線 ............ 準備完了', '取り落とした ' + qn + ' の星を結び直す'],
    html: '',
    build(c) {
      _clbStarfield(c.host, _clbStarN(3200));
      const C = CL_CONSTS[(Math.random() * CL_CONSTS.length) | 0];
      c.con = C;
      let g = '';
      C.e.forEach((grp, gi) => grp.forEach(([a, b]) => {
        g += '<line class="clb-dash g' + gi + '" pathLength="1" x1="' + C.s[a][0] + '" y1="' + C.s[a][1] + '" x2="' + C.s[b][0] + '" y2="' + C.s[b][1] + '"/>';
      }));
      C.s.forEach(([x, y, m]) => {
        g += '<g class="st"><circle class="h" cx="' + x + '" cy="' + y + '" r="' + (m * 1.9).toFixed(1) + '"/><circle class="c" cx="' + x + '" cy="' + y + '" r="' + (m * .42).toFixed(2) + '"/></g>';
      });
      c.host.insertAdjacentHTML('afterbegin', '<svg class="clb-con" viewBox="0 0 100 100">' + g + '</svg><div class="clb-cname">' + C.name + '</div>');
      const sv = c.host.querySelector('.clb-con'), st = sv.querySelectorAll('.st');
      sv.animate([{ rotate: '-3deg', scale: '.96' }, { rotate: '2deg', scale: '1' }], { duration: c.endAt, easing: 'linear', fill: 'forwards' });
      // 星はブートログの間に1つずつ灯る（明るい星から）
      const order = C.s.map((s, i) => i).sort((a, b) => C.s[b][2] - C.s[a][2]);
      order.forEach((i, k) => st[i].animate([{ opacity: 0, scale: '2.4' }, { opacity: 1, scale: '.8', offset: .5 }, { opacity: 1, scale: '1' }],
        { duration: 360, delay: 90 + k * (c.t0 - 200) / order.length, easing: 'ease-out', fill: 'forwards' }));
    },
    num(c, i) {
      c.host.querySelectorAll('.clb-con .g' + i).forEach(l => l.classList.add('on'));
      _clbNumIn(c.num);
    },
    goWord: 'LINKED', goSub: '— 星 座 、結 ば れ り —',
    go(c) {
      const sv = c.host.querySelector('.clb-con');
      sv.classList.add('gold');
      sv.querySelectorAll('.st .c').forEach((s, i) => s.animate([{ scale: '1' }, { scale: '2.4' }, { scale: '1' }], { duration: 420, delay: i * 22, easing: 'ease-out' }));
      c.host.querySelector('.clb-cname').animate([{ opacity: 0, letterSpacing: '.8em' }, { opacity: 1, letterSpacing: '.4em', offset: .35 }, { opacity: 1, offset: .75 }, { opacity: 0 }],
        { duration: 780, easing: 'ease-out', fill: 'forwards' });
      const r = sv.getBoundingClientRect();
      _clbSparks(c, c.con.s.map(([x, y]) => [r.left + x / 100 * r.width, r.top + y / 100 * r.height]), 7, 760);
      sv.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 780, fill: 'forwards' });
      _cdGoIn(c.num, c.sub);
    } },

  /* B 天球儀：金・青・紫の環（黄道・天の赤道・子午環）がばらばらに回り、3・2・1 で1本ずつ正面に据わって止まる。
     起動で3本が1つの円に重なり、光条が放たれる（正解演出の ALIGNED と同じ語彙） */
  { key: 'b', prefix: '☉ ', lineIn: _clbLineIn,
    lines: (qn, s) => ['ARMILLARY SPHERE', '天 球 ............... ' + s, '恒 星 表 ............ ' + qn + ' 問', '黄道 ・ 赤道 ・ 子午環 ... 稼働', '環を一つに揃える'],
    rematch: qn => ['ARMILLARY — RECALIBRATE', '狂った環 ............ 前回の誤答 ' + qn + ' 問', '再 較 正 ............ 準備完了', 'この ' + qn + ' 問で天球を合わせ直す'],
    html: '',
    build(c) {
      _clbStarfield(c.host, _clbStarN(5000));
      let d = '<g class="dial"><circle r="96"/><circle r="90"/>';
      for (let i = 0; i < 72; i++) {
        const a = i * 5 * Math.PI / 180, m = i % 6 === 0, r1 = m ? 87 : 90;
        d += '<line class="' + (m ? 'm' : '') + '" x1="' + (Math.cos(a) * r1).toFixed(2) + '" y1="' + (Math.sin(a) * r1).toFixed(2) + '" x2="' + (Math.cos(a) * 96).toFixed(2) + '" y2="' + (Math.sin(a) * 96).toFixed(2) + '"/>';
      }
      ['XII', 'III', 'VI', 'IX'].forEach((t, i) => { const a = (i * 90 - 90) * Math.PI / 180; d += '<text x="' + (Math.cos(a) * 102).toFixed(1) + '" y="' + (Math.sin(a) * 102).toFixed(1) + '">' + t + '</text>'; });
      d += '</g>';
      for (let i = 0; i < 24; i++) {
        const a = i * 15 * Math.PI / 180, r2 = i % 2 ? 100 : 112;
        d += '<line class="ray clb-dash" pathLength="1" x1="' + (Math.cos(a) * 82).toFixed(2) + '" y1="' + (Math.sin(a) * 82).toFixed(2) + '" x2="' + (Math.cos(a) * r2).toFixed(2) + '" y2="' + (Math.sin(a) * r2).toFixed(2) + '"/>';
      }
      c.host.insertAdjacentHTML('afterbegin', '<svg class="clb-arm" viewBox="-115 -115 230 230">' + d
        + '<ellipse class="rg r0"/><ellipse class="rg r1"/><ellipse class="rg r2"/></svg>');
      const sv = c.host.querySelector('.clb-arm'), els = sv.querySelectorAll('.rg'), RR = 74;
      sv.querySelector('.dial').animate([{ rotate: '0deg' }, { rotate: '-24deg' }], { duration: c.endAt, easing: 'linear', fill: 'forwards' });
      sv.animate([{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1' }], { duration: 500, easing: 'ease-out' });
      c.rings = [{ th0: -32, dth: 26, ph0: 1.0, w: 2.3 }, { th0: 38, dth: -34, ph0: .2, w: -2.9 }, { th0: 92, dth: 18, ph0: 2.1, w: 1.7 }]
        .map(r => Object.assign(r, { lock: -1 }));
      c.bt = 0;
      _cdLoop(c, t => {
        c.bt = t;
        c.rings.forEach((r, i) => {
          let th, ph;
          if (r.lock < 0) { th = r.th0 + r.dth * t / 1000; ph = r.ph0 + r.w * t / 1000; }
          else { const k = _frE(Math.min(1, (t - r.lock) / 380)); th = r.thL + (r.thT - r.thL) * k; ph = r.phL + (r.phT - r.phL) * k; }
          els[i].setAttribute('rx', RR); els[i].setAttribute('ry', Math.max(.6, RR * Math.abs(Math.cos(ph))).toFixed(2));
          els[i].setAttribute('transform', 'rotate(' + th.toFixed(2) + ')');
          r.th = th; r.ph = ph;
        });
        return t < c.endAt;
      });
    },
    num(c, i) {
      const r = c.rings[i];
      r.thL = r.th; r.phL = r.ph;
      r.phT = Math.round(r.ph / Math.PI) * Math.PI;   // 正面（楕円が真円になる位相）の最寄りへ
      r.thT = Math.round(r.th / 180) * 180;           // 楕円は180°で同じ形
      r.lock = c.bt;
      _clbNumIn(c.num);
    },
    goWord: 'ALIGNED', goSub: '天 球 儀 — 整 列 完 了',
    go(c) {
      const sv = c.host.querySelector('.clb-arm');
      sv.classList.add('go');
      sv.querySelectorAll('.ray').forEach((l, i) => c.at(c.goAt + i % 3 * 30, () => l.classList.add('on')));
      [0, 110].forEach(dl => {
        const cc = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); cc.setAttribute('class', 'rip'); cc.setAttribute('r', '74'); sv.appendChild(cc);
        cc.animate([{ scale: '1', strokeWidth: 3, opacity: 1 }, { scale: '1.5', strokeWidth: .4, opacity: 0 }], { duration: 620, delay: dl, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      });
      sv.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 1, filter: 'brightness(1.8)', offset: .15 }, { opacity: 1, filter: 'brightness(1)', offset: .55 }, { opacity: 0, filter: 'brightness(1)' }],
        { duration: 780, easing: 'ease-out', fill: 'forwards' });
      _cdGoIn(c.num, c.sub);
    } },

  /* D 星図の魔導書：閉じた本が 3 で開き、2・1 で星図の頁がめくれる。起動でのどから光があふれ、天体記号が立ち昇る。
     ⚠️ 頁の 3D は .clb-book（perspective）の中だけ。body・html には何も掛けない */
  { key: 'd', prefix: '§ ', lineIn: _clbLineIn,
    lines: (qn, s) => ['LIBER CAELESTIS', '巻 ................. ' + s, '頁 ................. ' + qn + ' 問', '封 印 ............... 解除', '星図を、開く'],
    rematch: qn => ['LIBER CAELESTIS — ERRATA', '折り目の頁 .......... 前回の誤答 ' + qn + ' 問', '読 み 直 し ......... 準備完了', 'この ' + qn + ' 頁を読み直す'],
    html: '',
    build(c) {
      _clbStarfield(c.host, _clbStarN(5200));
      const seed = (Math.random() * 6) | 0;
      const cover = '<div class="face f cover"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="30"/>'
        + '<polygon points="50,6 88,72 12,72"/><polygon points="50,94 12,28 88,28"/><circle cx="50" cy="50" r="6"/></svg></div>';
      const leaf = (f, b, z) => '<div class="leaf" style="z-index:' + z + '">' + f + '<div class="face b paper">' + _clbChartSvg(b) + '</div></div>';
      c.host.insertAdjacentHTML('afterbegin', '<div class="clb-book">'
        + '<div class="pg L paper">' + _clbChartSvg(seed) + '</div>'
        + '<div class="pg R paper">' + _clbChartSvg(seed + 5) + '</div>'
        + leaf('<div class="face f paper">' + _clbChartSvg(seed + 3) + '</div>', seed + 4, 3)
        + leaf('<div class="face f paper">' + _clbChartSvg(seed + 1) + '</div>', seed + 2, 4)
        + leaf(cover, seed, 5)
        + '</div><div class="clb-glow"></div>');
      c.host.querySelector('.clb-book').animate([{ translate: '-75% -46%', opacity: 0 }, { translate: '-75% -50%', opacity: .5 }], { duration: 420, easing: 'ease-out' });
    },
    num(c, i) {
      const book = c.host.querySelector('.clb-book'), lf = book.querySelectorAll('.leaf')[2 - i];
      if (i === 0) {   // 閉じた本（表紙が中央）→ 見開き（のどが中央）
        book.animate([{ translate: '-75% -50%' }, { translate: '-50% -50%' }], { duration: 400, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
        book.querySelector('.pg.L').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 180, fill: 'forwards' });
      }
      lf.style.zIndex = 10 + i;
      lf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-90deg)', offset: .5 }, { transform: 'rotateY(-180deg)' }],
        { duration: 400, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
      _clbNumIn(c.num);
    },
    goWord: 'AWAKEN', goSub: '星 図 の 書 — 解 読 開 始',
    go(c) {
      const book = c.host.querySelector('.clb-book');
      c.host.querySelector('.clb-glow').animate([{ opacity: 0, scale: '.6 1' }, { opacity: 1, scale: '1 1', offset: .25 }, { opacity: .5, offset: .6 }, { opacity: 0, scale: '1.2 1.1' }],
        { duration: 760, easing: 'ease-out', fill: 'forwards' });
      book.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 1, filter: 'brightness(1.6)', offset: .2 }, { opacity: 1, filter: 'brightness(1.1)', offset: .6 }, { opacity: 0, filter: 'brightness(1)' }],
        { duration: 780, easing: 'ease-out', fill: 'forwards' });
      const r = book.getBoundingClientRect(), GL = '☉☽☿♀♂♃♄✦✧⚹';
      for (let i = 0; i < 26; i++) {
        const s = document.createElement('span'); s.className = 'clb-glyph'; s.textContent = GL[(Math.random() * GL.length) | 0];
        s.style.left = (r.left + r.width * _cdR(.08, .92)) + 'px'; s.style.top = (r.top + r.height * _cdR(.3, .8)) + 'px';
        s.style.fontSize = _cdR(14, 30).toFixed(0) + 'px';
        c.host.appendChild(s);
        s.animate([{ opacity: 0, translate: '0 0', scale: '.6' }, { opacity: 1, offset: .25 },
                   { opacity: 0, translate: _cdR(-30, 30).toFixed(0) + 'px ' + (-_cdR(90, 220)).toFixed(0) + 'px', scale: '1.1' }],
          { duration: _cdR(560, 760), delay: _cdR(0, 140), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      }
      _cdGoIn(c.num, c.sub);
    } },

  /* E 日周運動：天の北極を中心に星が同心円の光跡を描いて巡る（長時間露光）。3・2・1 で回転が速まり、
     起動で星が北極星へ吸い込まれて一点が輝く。数字は北極星の位置（画面の中央）に灯る。
     ⚠️ 光跡は前のフレームを destination-out で少しずつ消して作る（背景は透かしたまま・全消去しない） */
  { key: 'e', prefix: '✧ ', lineIn: _clbLineIn,
    lines: (qn, s) => ['CELESTIAL POLE TRACKING', '赤 道 儀 ............ 極軸合わせ完了', '観 測 対 象 ........ ' + s, '露 光 ............... ' + qn + ' 問', '天が、巡りはじめる'],
    rematch: qn => ['POLE — RE-EXPOSURE', 'ぶれた星 ............ 前回の誤答 ' + qn + ' 問', '再 露 光 ............ 準備完了', 'この ' + qn + ' 問で軌跡を描き直す'],
    html: '<svg class="clb-hz" viewBox="0 0 1000 240" preserveAspectRatio="none"><path d="M0 150 C120 120 220 140 330 118 C420 100 470 128 560 130 L600 130 L600 96 A62 62 0 0 1 724 96 L724 130 C800 128 880 108 1000 124 L1000 240 L0 240 Z"/>'
        + '<path class="rim" d="M0 150 C120 120 220 140 330 118 C420 100 470 128 560 130 L600 130 L600 96 A62 62 0 0 1 724 96 L724 130 C800 128 880 108 1000 124"/></svg><div class="clb-flash"></div>',
    build(c) {
      const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2, x = _frCtx(c.host, w, h, 0, 1.5);
      x.canvas.style.zIndex = 1;
      const maxR = Math.hypot(w, h) * .56, P = [], n = Math.round(Math.min(340, 120 + w * h / 6000));
      for (let i = 0; i < n; i++) {
        P.push({ r: maxR * Math.pow(Math.random(), .8) + 8, a: _cdR(0, 6.283), lw: Math.random() < .1 ? _cdR(1.4, 2.2) : _cdR(.5, 1.1),
                 col: CL_STAR_COLS[(Math.random() * CL_STAR_COLS.length) | 0], al: _cdR(.4, 1) });
      }
      c.wT = .12; c.pull = 0;
      let last = 0, ang = 0, w0 = .12;
      const spr = _clbGlintSprite();
      _cdLoop(c, t => {
        const dt = Math.min(50, t - last) / 1000; last = t;
        w0 += (c.wT - w0) * Math.min(1, dt * 7);
        ang += w0 * dt;
        x.globalCompositeOperation = 'destination-out';
        x.fillStyle = 'rgba(0,0,0,' + (c.pull ? .16 : .045) + ')'; x.fillRect(0, 0, w, h);
        x.globalCompositeOperation = 'lighter';
        const k = c.pull ? _frE(Math.min(1, (t - c.pull) / 420)) : 0;
        P.forEach(p => {
          const a1 = p.a + ang;
          x.strokeStyle = 'rgba(' + p.col + ',' + (p.al * (c.pull ? 1 : .8)).toFixed(2) + ')'; x.lineWidth = p.lw;
          x.beginPath(); x.arc(cx, cy, Math.max(.5, p.r * (1 - k)), a1 - w0 * dt, a1 + .004); x.stroke();
        });
        x.globalCompositeOperation = 'source-over';
        const ps = 18 + k * 30;
        x.drawImage(spr, cx - ps / 2, cy - ps / 2, ps, ps);
        return t < c.endAt;
      });
    },
    num(c, i) { c.wT = [.45, 1.1, 2.3][i]; _clbNumIn(c.num); },
    goWord: 'POLARIS', goSub: '天 の 北 極 — 観 測 開 始',
    go(c) {
      c.wT = 4; c.pull = c.goAt;
      c.host.querySelector('.clb-flash').animate([{ opacity: 0, scale: '.3' }, { opacity: 0, scale: '.3', offset: .35 }, { opacity: 1, scale: '1', offset: .55 }, { opacity: 0, scale: '1.5' }],
        { duration: 780, easing: 'ease-out', fill: 'forwards' });
      _cdGoIn(c.num, c.sub);
    } }
];

// 戻り値 = カウントダウンが明けるまでのms（B6/B7 がこれに合わせて1問目を立ち上げる）
function _examCountdown() {
  if (_fxOff()) return 0;
  // 起動音は演出と一蓮托生（reduced-motion で演出ごと出ないときは鳴らさない）
  _playBootSound();
  const theme = _examTheme();
  const curUi = window.MecUITheme ? MecUITheme.get() : null;
  const style = _examStyleForTheme(curUi);
  // Frost（FROST_BOOTS）と Celestial（CELESTIAL_BOOTS）は4案から毎回1つ。色・起動語・演出はその案が持つ
  const fbs = style === 'frost' ? FROST_BOOTS : style === 'grimoire' ? CELESTIAL_BOOTS : null;
  const fb = fbs ? fbs[(Math.random() * fbs.length) | 0] : null;
  const tok = ++_cdTok;
  let host = document.getElementById('examCountdown');
  if (!host) {
    host = document.createElement('div');
    host.id = 'examCountdown';
    document.body.appendChild(host);
  }
  // B8: リマッチだけはテーマ配色を外れて赤へ寄せる（「取り返しに来た」と読ませる）
  const col = _examIsRematch ? '#FF8A80'
            : ((theme.fullscreenCols && theme.fullscreenCols[3]) || '#FFD700');
  const glow = _examIsRematch ? '255,138,128'
            : ((theme.fullscreenGlow && theme.fullscreenGlow[3]) || '255,215,0');

  // 出題内容をブートログに出す（何が始まるのかが分かる実用も兼ねる）
  const qn = (typeof examQueue !== 'undefined' && examQueue) ? examQueue.length : 0;
  let subjLabel = '—';
  try {
    const ids = [...new Set(examQueue.map(c => c.dataset.uid.split('_ch')[0]))];
    const names = ids.map(id => (STUDY_SUBJECTS.find(x => x.id === id) || {}).name || id);
    subjLabel = names.length > 1 ? (names[0] + ' 他' + (names.length - 1)) : (names[0] || '—');
    if (_srsReviewMode) subjLabel = 'SRS REVIEW';
    if (_todayWrongMode) subjLabel = "TODAY'S MISSES";
    if (_bossMode === true) subjLabel = 'GRAND CONFERENCE';
    if (_focusMode) subjLabel = 'WEAK POINT DRILL';
    if (_examIsRematch) subjLabel = 'REMATCH ×' + qn;
  } catch (e) {}

  const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロABCDEF0123456789';
  const cols = [];
  if (style === 'cyber') {
    for (let i = 0; i < 7; i++) {
      let t = '';
      for (let j = 0; j < 18; j++) t += katakana[(Math.random() * katakana.length) | 0] + '\n';
      cols.push('<span class="cd-col" style="--d:' + (i * .17).toFixed(2) + 's;--x:' + (6 + i * 14) + '%">' + t + '</span>');
    }
  }

  host.className = 'cd-' + style + (fb ? (style === 'grimoire' ? ' cd-cl-' : ' cd-fr-') + fb.key : '') + (_examIsRematch ? ' cd-rematch' : '');
  host.style.setProperty('--cd-col', col);
  host.style.setProperty('--cd-glow', glow);
  host.style.display = 'flex';
  host.innerHTML = (fb ? fb.html : (
    '<div class="cd-scan"></div>' +
    (style === 'cyber' ? '<div class="cd-stream">' + cols.join('') + '</div>' : '') +
    '<i class="cd-br tl"></i><i class="cd-br tr"></i><i class="cd-br bl"></i><i class="cd-br br"></i>' +
    (style === 'mecha'
      ? '<div class="cd-reticle"><i class="rh"></i><i class="rv"></i>'
        + '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>'
      : style === 'steam'
      ? '<div class="cd-boiler"><i class="cd-bz"></i></div>'
      : style === 'zen'
      ? '<div class="cd-zen-enso"><svg viewBox="0 0 200 200" class="cd-enso-svg"><circle class="enso-circle" cx="100" cy="100" r="72"/></svg></div>'
      : style === 'abyss'
      ? '<div class="cd-abyss-sonar"><svg viewBox="0 0 200 200" class="cd-sonar-svg"><circle class="sn-wave1" cx="100" cy="100" r="28"/><circle class="sn-wave2" cx="100" cy="100" r="58"/><circle class="sn-wave3" cx="100" cy="100" r="88"/><line x1="100" y1="8" x2="100" y2="192" class="sn-axis"/><line x1="8" y1="100" x2="192" y2="100" class="sn-axis"/></svg></div>'
      : style === 'prism'
      ? '<div class="cd-prism-field"><div class="cd-prism-ray ray-1"></div><div class="cd-prism-ray ray-2"></div><div class="cd-prism-ray ray-3"></div></div>'
      : style === 'liquid'
      ? '<div class="cd-liquid-bloom"><div class="cd-drop drop-1"></div><div class="cd-drop drop-2"></div><div class="cd-drop drop-3"></div></div>'
      : '<div class="cd-cyber-hud"><div class="hud-frame"></div><div class="hud-corner hc-tl"></div><div class="hud-corner hc-tr"></div><div class="hud-corner hc-bl"></div><div class="hud-corner hc-br"></div><div class="hud-cross-h"></div><div class="hud-cross-v"></div><div class="hud-scanner-bar"></div></div>'))) +
    '<div class="cd-log"></div>' +
    '<div class="cd-num"></div>' +
    '<div class="cd-sub"></div>';

  /* S8: 歯車は **計器ベイの .ep-gear を複製して使う**（study.html に1つだけある path を借りる）。
     ⚠️ path を書き写して2本目の実装を作らないこと（Phase 4 で「歯車の実装を増やさない」と
        決めてある）。複製なら形が食い違いようがない。 */
  if (style === 'steam') {
    const src = document.querySelector('.ep-gear');
    const boiler = host.querySelector('.cd-boiler');
    if (src && boiler) ['g1', 'g2'].forEach(k => {
      const g = src.cloneNode(true);
      g.setAttribute('class', 'cd-gear ' + k);
      boiler.appendChild(g);
    });
  }
  const bezel = host.querySelector('.cd-bz');

  const logEl = host.querySelector('.cd-log');
  const numEl = host.querySelector('.cd-num');
  const subEl = host.querySelector('.cd-sub');
  const lines = fb ? (_examIsRematch ? fb.rematch(qn) : fb.lines(qn, subjLabel))
              : _examIsRematch ? _examRematchLines(style, qn) : _examBootLines(style, qn, subjLabel);

  const timers = [];
  const kill = () => { if (tok === _cdTok) _cdTok++; timers.forEach(clearTimeout); host.style.display = 'none'; host.innerHTML = ''; host.className = ''; };
  const at = (ms, fn) => timers.push(setTimeout(() => { if (!examMode) { kill(); return; } fn(); }, ms));

  // ① ブートログを1行ずつ点灯
  lines.forEach((ln, i) => at(60 + i * 105, () => {
    const d = document.createElement('div');
    d.className = 'cd-line';
    d.textContent = (fb ? fb.prefix : style === 'mecha' ? '> ' : style === 'steam' ? '— ' : '// ') + ln;
    logEl.appendChild(d);
    if (fb && fb.lineIn) {
      fb.lineIn(d);
    } else if (fb && fb.wipe) {
      // 左から拭われて現れる（A＝指でなぞった跡・D＝氷の中の文字）
      d.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 240, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' });
    } else {
      d.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 200, easing: 'ease-out' });
    }
  }));

  // ② 3 → 2 → 1 → 起動語
  const goWord = fb ? fb.goWord : style === 'mecha' ? 'ALL GREEN' : style === 'steam' ? '全速' : 'DIVE';
  const t0 = 60 + lines.length * 105 + 120;
  const fbc = fb && { host, log: logEl, num: numEl, sub: subEl, t0, goAt: t0 + 3 * 420, endAt: t0 + 3 * 420 + 780,
                      at, alive: () => tok === _cdTok && examMode };
  if (fb) fb.build(fbc);
  ['3', '2', '1'].forEach((n, i) => at(t0 + i * 420, () => {
    host.classList.add('cd-p2');   // ログを上へ退かせて中央を数字に譲る
    // S8: 3・2・1 で絞りが1段ずつ閉じる。⚠️ 尺は増やさない＝既存のカウントに相乗りするだけ
    if (bezel) bezel.style.setProperty('--ap', String(i + 1));
    numEl.textContent = n;
    numEl.className = 'cd-num';
    void numEl.offsetWidth;
    if (fb) { fb.num(fbc, i); return; }
    _cdNumIn(numEl);
    if (window.MecFX) {
      try {
        window.MecFX.rings(window.innerWidth / 2, window.innerHeight / 2,
          { count: 1, color: theme.ringColor(2), thickness: 2, maxR: 200, additive: examEffectSet !== 'ink' });
      } catch (e) {}
    }
  }));

  // ③ 起動。横一閃のスイープを走らせて締める
  at(t0 + 3 * 420, () => {
    numEl.textContent = goWord;
    numEl.className = 'cd-num go';
    if (fb) { subEl.textContent = fb.goSub; void numEl.offsetWidth; fb.go(fbc); return; }
    subEl.textContent = style === 'mecha' ? 'COMBAT MODE ENGAGED'
                      : style === 'steam' ? 'BOILER — FULL PRESSURE'
                      : 'GHOST LINK — ONLINE';
    // S8: 起動の瞬間だけ絞りが開き、下から蒸気が吹き上がる（R1 と同じ MecFX.steam を使う）
    if (bezel) bezel.style.setProperty('--ap', '0');
    if (style === 'steam' && window.MecFX) {
      try {
        const w = window.innerWidth, h = window.innerHeight;
        [-.24, 0, .24].forEach(k => window.MecFX.steam(w / 2 + w * k, h * .92, {
          // ⚠️ 薄く・低くとどめること。この蒸気は起動語と同時に出て、780ms 後には
          //    1問目のカード（B7 の入場）が立ち上がる。濃く高く上げると**最初の問題文の上に
          //    1秒以上かかる**＝読み始めを遅らせる（演出のために情報を遅らせない）。
          count: 12, w: w * .10, rise: 130, max: 68, grow: 2.6,
          // ⚠️ 色は STEAM_TONES から選ぶこと。glowSprite は色ごとにキャッシュするので、
          //    新しい色を1つ足すたびにスプライトが1枚増える。
          alpha: .24, color: STEAM_TONES[1], blend: false
        }));
      } catch (e) {}
    }
    void numEl.offsetWidth;
    _cdGoIn(numEl, subEl);
    const sw = document.createElement('div');
    sw.className = 'cd-sweep';
    host.appendChild(sw);
    sw.animate([{ transform: 'translateX(-110%)' }, { transform: 'translateX(110%)' }],
      { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    if (window.MecFX) {
      try {
        window.MecFX.rings(window.innerWidth / 2, window.innerHeight / 2,
          { count: 3, color: theme.ringColor(5), thickness: 3, maxR: 520, additive: examEffectSet !== 'ink', stagger: .07 });
        window.MecFX.burst(window.innerWidth / 2, window.innerHeight / 2, {
          count: 70, colors: (theme.burstPalettes && theme.burstPalettes[4]) || ['#FFD700'],
          shapes: theme.shapes(4), tier: 4, glow: examEffectSet !== 'ink', additive: examEffectSet !== 'ink'
        });
      } catch (e) {}
    }
  });
  at(t0 + 3 * 420 + 780, kill);
  return t0 + 3 * 420 + 780;
}

// C10: 結果画面のランク刻印スタンプ（S/A/B/C・100%はPERFECT）
function _stampRank(pct) {
  const modal = document.querySelector('#examOverlay .exam-modal');
  if (!modal || _fxOff()) return;
  modal.querySelectorAll('.exam-rank-stamp').forEach(el => el.remove());
  const perfect = pct >= 100;
  // 基準は章カードの色分け（80/60）に合わせ、90以上をSとして上乗せする
  const rank = perfect ? 'PERFECT' : pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C';
  const sub = perfect ? '★ MASTERED ★' : pct >= 90 ? 'EXCELLENT' : pct >= 80 ? 'GREAT' : pct >= 60 ? 'PASS' : 'TRAINING';
  const col = perfect ? '#FFD700' : pct >= 90 ? '#FFD700' : pct >= 80 ? '#3DD68C' : pct >= 60 ? '#FFB830' : '#FF6B6B';
  const glow = perfect ? 'rgba(255,215,0,.45)' : pct >= 90 ? 'rgba(255,215,0,.35)' : pct >= 80 ? 'rgba(61,214,140,.35)' : pct >= 60 ? 'rgba(255,184,48,.32)' : 'rgba(255,107,107,.32)';

  const el = document.createElement('div');
  el.className = 'exam-rank-stamp' + (perfect ? ' perfect' : '');
  el.style.setProperty('--rk-col', col);
  el.style.setProperty('--rk-glow', glow);
  el.innerHTML = '<div class="rk-inner"><div class="rk-val">' + rank + '</div><div class="rk-sub">' + sub + '</div></div>';
  modal.appendChild(el);

  // ハードプレス・落下刻印アニメーション（上空から盤面にズドンと打ち込む）
  el.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(3.2) rotate(-28deg)', filter: 'brightness(2)' },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(.92) rotate(-11deg)', filter: 'brightness(1.8)', offset: .34 },
    { transform: 'translate(-50%,-50%) scale(1.06) rotate(-11deg)', filter: 'brightness(1.2)', offset: .48 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(-11deg)', filter: 'brightness(1)', offset: .62 },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(-11deg)', filter: 'brightness(1)' }
  ], { duration: 750, easing: 'cubic-bezier(.12,1.15,.28,1)', fill: 'forwards' });

  // 激突の瞬間の衝撃演出（スタンプ着地時: 約 255ms）
  setTimeout(() => {
    // 1. モーダルのマイクロバウンス（body は動かさず .exam-modal だけを微振動）
    modal.classList.remove('exam-modal-impact');
    modal.classList.add('exam-modal-impact');
    setTimeout(() => modal.classList.remove('exam-modal-impact'), 300);

    // 2. MecFX テーマ固有の衝撃波 ＆ 祝賀パーティクル
    if (window.MecFX) {
      try {
        const curUi = window.MecUITheme ? MecUITheme.get() : null;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        if (curUi === 'cyber') {
          if (window.MecFX.pixelPop) window.MecFX.pixelPop(cx, cy, { count: perfect ? 24 : 14, color: col });
          if (window.MecFX.rings) window.MecFX.rings(cx, cy, { count: 1, color: col, thickness: 2, maxR: perfect ? 200 : 150, additive: true });
        } else if (curUi === 'kintsugi') {
          if (window.MecFX.dust) window.MecFX.dust({ count: perfect ? 40 : 25, colors: ['#F5D061', '#D4AF37', '#D9383A', '#FFFFFF'] });
          if (window.MecFX.kintsugiCrack) window.MecFX.kintsugiCrack(cx, cy, { maxR: perfect ? 220 : 160 });
        } else if (curUi === 'frost') {
          if (window.MecFX.frostCrystalShatter) window.MecFX.frostCrystalShatter(cx, cy, { maxR: perfect ? 220 : 160, dendriteCount: 8 });
          if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(cx, cy, { count: 16, color: '#70D6FF' });
        } else if (curUi === 'brass') {
          if (window.MecFX.burst) window.MecFX.burst(cx, cy, { count: perfect ? 20 : 12, colors: [col, '#FFF3C4', '#C9A227'], shapes: ['shard', 'square'], gravity: 1200, additive: false });
          if (window.MecFX.steam) window.MecFX.steam(cx, cy - 30, { count: 4, rise: 70, w: 40 });
        } else if (curUi === 'abyss') {
          if (window.MecFX.abyssSonarPulse) window.MecFX.abyssSonarPulse(cx, cy, { maxR: perfect ? 220 : 160 });
          if (window.MecFX.bubbles) window.MecFX.bubbles(cx, cy, { count: 16, colors: ['#00FFA3', '#00B4D8'] });
        } else if (curUi === 'celestial') {
          if (window.MecFX.celestialAstrolabe) window.MecFX.celestialAstrolabe(cx, cy, { maxR: perfect ? 220 : 160 });
          if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(cx, cy, { count: 16, color: '#FFD166' });
        } else if (curUi === 'aurora') {
          if (window.MecFX.auroraPrismSweep) window.MecFX.auroraPrismSweep(cx, cy, { maxR: perfect ? 220 : 160 });
        } else if (curUi === 'liquid') {
          if (window.MecFX.liquidBloomRipple) window.MecFX.liquidBloomRipple(cx, cy, { maxR: perfect ? 220 : 160 });
          if (window.MecFX.bubbles) window.MecFX.bubbles(cx, cy, { count: 16, colors: ['#FF007F', '#7928CA'] });
        } else {
          // 汎用フォールバック
          window.MecFX.rings(cx, cy, {
            count: perfect ? 2 : 1,
            color: col,
            thickness: perfect ? 3 : 2,
            maxR: perfect ? 220 : 170,
            additive: true
          });
          window.MecFX.burst(cx, cy, {
            count: perfect ? 16 : 10,
            colors: [col, '#FFF3C4', '#FFFFFF'],
            shapes: ['shard', 'square'],
            gravity: 1200,
            additive: false,
            scale: perfect ? 1.2 : 1.0
          });
        }
      } catch (e) {}
    }
  }, 255);
}

// C11: SRS復習セッションを完走した時の完了演出（習慣化の達成感）
function _srsCompleteCelebration() {
  if (!window.MecFX) return;
  try {
    window.MecFX.glyphRain({ glyphs: ['🔔', '🎉', '✨', '⭐'], colors: ['#FF9A3C', '#FFD166', '#3DD68C', '#60A5FA'], count: 14 });
    window.MecFX.confetti({ count: 32, colors: ['#FF9A3C', '#FFD166', '#3DD68C', '#60A5FA'] });
  } catch (e) {}
}

/* ══════════ E1: 次に戻ってくる日（2026-08-14）══════════
   SRS復習は「解いて終わり」に見えるのが弱点で、○/△/× の自己申告が何を動かしたのかが
   画面に出ていなかった。完走直後に間隔の分布を見せると、仕組みそのものが体感で分かる。
   間隔の正本は study.html の _updateSRS が書いた mec_srs_v1 の interval（日）。
   ここでは読むだけで、日付の計算をやり直さない（二重管理になるため）。 */
const SRS_PLAN_BUCKETS = [
  { max: 1, label: '明日' },
  { max: 3, label: '2〜3日後' },
  { max: 7, label: '今週中' },
  { max: 14, label: '2週間後' },
  { max: 30, label: '1か月後' },
  { max: Infinity, label: '1か月より先' }
];

function _srsNextPlanData() {
  const src = (typeof _srsData !== 'undefined' && _srsData) || window._srsData;
  if (!src) return null;
  const rows = SRS_PLAN_BUCKETS.map(b => ({ label: b.label, max: b.max, n: 0 }));
  let total = 0;
  examQueue.forEach(card => {
    const e = src[card.dataset && card.dataset.uid];
    const d = e && e.interval;
    if (!d) return;
    const row = rows.find(r => d <= r.max);
    if (row) { row.n++; total++; }
  });
  return total ? { rows: rows.filter(r => r.n > 0), total } : null;
}

function _srsRenderNextPlan(anchorEl) {
  const data = _srsNextPlanData();
  if (!data || !anchorEl || !anchorEl.parentNode) return;
  const max = Math.max(...data.rows.map(r => r.n));
  const host = document.createElement('div');
  host.className = 'exam-srs-plan';
  host.id = 'examSrsPlan';
  host.innerHTML = '<div class="sp-h"></div>' + data.rows.map((r, i) =>
    '<div class="sp-row" style="--i:' + i + '">' +
      '<span class="sp-lbl"></span>' +
      '<span class="sp-bar"><i style="--w:' + Math.max(6, Math.round(r.n / max * 100)) + '%"></i></span>' +
      '<span class="sp-n"></span>' +
    '</div>').join('');
  host.firstChild.textContent = '📅 次に戻ってくる日';
  host.querySelectorAll('.sp-row').forEach((row, i) => {
    row.querySelector('.sp-lbl').textContent = data.rows[i].label;
    row.querySelector('.sp-n').textContent = data.rows[i].n + '問';
  });
  anchorEl.insertAdjacentElement('afterend', host);

  // 見出しから各行へ光が走る＝問題が未来へ配られていく絵。
  // reduced-motion では行のフェードイン（CSS側で無効化）だけにする。
  if (_fxOff() || !window.MecFX) return;
  setTimeout(() => {
    const h = host.querySelector('.sp-h');
    if (!h) return;
    const hr = h.getBoundingClientRect();
    if (!hr.width || hr.bottom < 0 || hr.top > innerHeight) return;
    host.querySelectorAll('.sp-row .sp-bar').forEach((bar, i) => {
      const br = bar.getBoundingClientRect();
      if (!br.width) return;
      try {
        window.MecFX.ribbon(hr.left + 14, hr.bottom - 2, br.left + br.width * .5, br.top + br.height / 2, {
          color: '#FFB830', width: 2.4, ttl: .9, grow: .5, bow: 26, delay: i * .1
        });
      } catch (e) {}
    });
  }, 420);
}

/* オーバードライブ（_setOverdrive）・ゾーンの呼吸（_ensureZoneBreath）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */


/* 画面の縁の光（_triggerBorderGlow・5連続〜・#examStreakBorder）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */


// UIテーマ固有演出＋粒子。at: 発火位置 {x,y}（_rfCorrectFx は正解の肢の位置を渡す）。省略時は可視帯の中で散らす。
/* ctx = { el: 正解の肢, card, promoted }。肢そのものに描くテーマ（liquid）だけが使う。 */
function _spawnStreakParticles(tier, at, ctx) {
  const b = _fxBand();
  const shortSide = Math.min(b.width, b.height);
  const maxR = shortSide * Math.min(0.48, 0.40 + tier * 0.012); // 短辺0〜90%動的スケーリング
  const pos = at || _getDispersedFxPos(b.cx, b.cy, maxR);
  const cx = pos.x;
  const cy = pos.y;
  const curUi = window.MecUITheme ? MecUITheme.get() : null;

  /* ── UIテーマ完全連動型コンボパーティクル（2026-08-23） ──
     ⚠️⚠️ MecUITheme.get() は **必ず8種のどれかを返す**（VALID_IDS 外は 'aurora' に落ちる）。
     つまりこの8分岐は網羅で、どれも return する＝**ここから下には決して到達しない**。
     2026-08-31 まで、この下に演出テーマ7種ぶんの粒子（花火・雷・レイン・メダル・
     ブラックホール・除細動・ECGスイープ・墨円・スポットライト・紙吹雪）が約90行あり、
     burstCounts=[…,1300] も rainWaves も **一度も走っていなかった**。同コミットで
     関連19関数ごと削除した。
     ⚠️ ここに legacy の fallback を書き足さないこと。書いても死ぬ。
        UIテーマを増やしたら **この分岐に足す**（`_spawnLightStreakFx` /
        `_spawnScatteredCelebration` / `_afterCorrectFx` も同じ構造なので4か所セット）。 */
  if (curUi && window.MecFX) {
    if (curUi === 'kintsugi') {
      if (window.MecFX.kintsugiCrack) window.MecFX.kintsugiCrack(cx, cy, { maxR: maxR, branches: Math.min(10, 4 + tier) });
      if (window.MecFX.dust) window.MecFX.dust({ count: 20 + tier * 12, colors: ['#F5D061', '#D4AF37', '#FFFFFF', '#D9383A'] });
      if (tier >= 4 && window.MecFX.rings) window.MecFX.rings(cx, cy, { count: 2, color: '#F5D061', thickness: 3, maxR: maxR * 1.05, additive: true });
      return;
    } else if (curUi === 'celestial') {
      // 2026-09-29：超新星か銀河の渦（セッションごとに抽選・肢の左端）＋4つから正解のたびに1つ（_clxCelestialFx）。liquid・frost と同じく
      // _rfCorrectFx の 0ms で肢の位置に出している。旧 celestialAstrolabe（全画面の紫の閃光・約250粒）は正解演出から外した。
      return;
    } else if (curUi === 'abyss') {
      // 2026-09-29：ソナーの反響（_abyAbyssFx）。liquid・frost・celestial・brass と同じく _rfCorrectFx の 0ms で
      // 肢の位置に出している。旧 abyssSonarPulse（閃光・波紋・マリンスノー）と段4〜の輪3本は正解演出から外した（ユーザー判断）。
      // 泡（MecFX.bubbles）は 2026-09-28 に撤去済み。どれも戻さないこと。
      return;
    } else if (curUi === 'frost') {
      // 2026-09-25：六花＋霜華＋ダイヤモンドダスト（_frFrostFx）。liquid と同じく _rfCorrectFx の 0ms で
      // 肢の位置に出している。旧 frostCrystalShatter（全画面の閃光・破片・約300粒）は正解演出から外した。
      return;
    } else if (curUi === 'aurora') {
      if (window.MecFX.auroraPrismSweep) window.MecFX.auroraPrismSweep(cx, cy, { maxR: maxR, sparkleCount: 18 + tier * 5 });
      if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(cx, cy, { count: 18 + tier * 6, color: '#00DFD8' });
      if (tier >= 4 && window.MecFX.rings) window.MecFX.rings(cx, cy, { count: 2, color: '#00DFD8', thickness: 3, maxR: maxR * 1.05, additive: true });
      return;
    } else if (curUi === 'brass') {
      // 2026-09-26：歯車列＋刻印＋鋳込みの唐草（_brsBrassFx）。liquid・frost・celestial と同じく _rfCorrectFx の 0ms で
      // 肢の位置に出している。旧 brassClockworkBurst（全画面の金の閃光・飛び散る歯車・天球儀の輪・画面全体の蒸気と粉・
      // 火花の二重呼び出し）は正解演出から外した（結果画面では今も使う）。
      return;
    } else if (curUi === 'cyber') {
      if (window.MecFX.cyberTargetLock) window.MecFX.cyberTargetLock(cx, cy, { maxR: maxR, glitchCount: 8 + tier * 3 });
      if (window.MecFX.glitchBars) window.MecFX.glitchBars(cx, cy, { count: 8 + tier * 3, color: '#00FF66', w: maxR * 2, band: b });
      if (tier >= 4 && window.MecFX.rings) window.MecFX.rings(cx, cy, { count: 2, color: '#00FF66', thickness: 2.5, maxR: maxR * 1.05, additive: true });
      return;
    } else if (curUi === 'liquid') {
      // 2026-09-28：ぷるん＋シャボン玉＋ガラスの衝撃波（_lqLiquidFx）。ここ（200ms）ではなく
      // _rfCorrectFx の 0ms で出している——正解の 300〜400ms 後に次のカードへ自動スクロールするので、
      // 200ms 待つと肢が画面から去ってから咲く。粒子・全画面の閃光は出さない。
      return;
    }
  }
}





/* ══════════ Liquid：シャボン玉（2026-09-28）══════════
   デモページ（fx_all_demo.html「Liquid の新しい案」の案M）でユーザーが採用。油膜の虹彩＋メッシュグラデーション
   （2026-09-25・_lqFluidFx／_lqMesh／_lqFilm／.lq-ring）を置き換えた。旧 liquidBloomRipple は結果画面だけで使う。
   - ① 肢の層：正解の肢の**文字の裏**に虹色のシャボンの膜が張り、タップ位置から丸く割れて雫が散る（_lqSoapFilm）。
   - ② 全画面の層（毎回）：タップ位置からシャボン玉が吹き出し、揺れながら昇って1つずつ割れる（_lqBlow）。
        段で玉の数と大きさが増える。段が上がった瞬間は大きな玉が画面の中央まで昇って割れ、細かな玉が散る（_lqGiantBubble）。
   ⚠️ 肢の層は .lq-layer（z-index:-1）＝.qc と .ch2 の疑似要素は使わない（満杯）。canvas と描画ループは frost の
      _frCtx / _frRun を共用（関数宣言なので後ろにあっても呼べる）。
   ⚠️ 片付け（クラス・要素の除去）は素の setTimeout。_fxTimeout だと試験を抜けた瞬間に止まり、
      .lq-host が付いたまま残る。 */
/* 最後にタップした肢と、肢の中の位置（割合）。波の起点にする。キーボードで答えたときは肢の中央。
   ⚠️ 画面座標で持たないこと——正解の直後に次のカードへ自動スクロールするので、演出を出す時点では
      肢が動いていて座標が合わない。 */
let _lqPtr = null;
document.addEventListener('pointerdown', e => {
  const ch = e.target && e.target.closest && e.target.closest('.ch2');
  if (!ch) return;
  const r = ch.getBoundingClientRect();
  _lqPtr = { el: ch, fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height, t: performance.now() };
}, { passive: true, capture: true });
/* UIテーマ固有の正解演出（liquid / frost / celestial / brass）の尺（2026-09-28・ユーザー判断）。
   ① **肢の中で出す層**は、次のカードへ送る前に終わらせる。各演出はラボで決めた尺（ms）のまま書いてあり、
      始める前に _rfFit(予算, 肢の層の全長) で係数 _rfK を決め、送りの RF_FX_END_MARGIN 手前で終わるよう縮める。
      尺を決めている口（_lqDrop の片付け・_frRun の経過時間・各演出の遅延）は
      全部 _rfK を掛ける。
   ② **カードの中で出していた層**は、全画面の層（_rfFullHost・文字の上にデモと同じ濃さで重ねる）へ移し、ラボの尺のまま
      （_rfK = 1）最後まで再生する。0.3秒に縮めるとほとんど見えなかったため。全画面なのでカードと一緒に流れない
      （カードの位置に貼り付けた台 .rf-stage を残す案は「中に浮いておかしな演出」と却下されている）。
   ⚠️ _rfK は大域変数。①の遅延呼び出し（setTimeout の中で肢の層を描くもの）は、②で _rfK を 1 に
      戻した後に走るので、①の係数を控えて呼ぶ直前に入れ直すこと（_rfWithK）。
   送りの時間は 2026-09-28 に 15% 延ばした（ユーザー判断・単一 350→403・複数 400→460・計算 300→345ms）。 */
const RF_ADVANCE_MS = { one: 403, multi: 460, calc: 345 };
const RF_FX_END_MARGIN = 50;
let _rfK = 1;
function _rfFit(budget, nominal) {
  const b = Math.max(60, (budget || RF_ADVANCE_MS.one) - RF_FX_END_MARGIN);
  _rfK = Math.min(1, b / Math.max(1, nominal));
  return _rfK;
}
function _rfWithK(k, fn) { const k0 = _rfK; _rfK = k; try { fn(); } finally { _rfK = k0; } }
/* 全画面の層（②）。固定配置で画面いっぱい・クリックは通す・デモと同じ濃さで重ねる（.rf-full）。
   ms 後に自分で消える。試験を終えたら exitExam が残りを掃除する。 */
function _rfFullHost(ms) {
  const H = document.createElement('div');
  H.className = 'rf-full';
  H.setAttribute('aria-hidden', 'true');
  document.body.appendChild(H);
  setTimeout(() => H.remove(), ms + 100);
  return H;
}
function _lqLayer(host, cls) {
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.classList.add('lq-host');
  host._lqN = (host._lqN || 0) + 1;
  const L = document.createElement('span');
  L.className = 'lq-layer' + (cls ? ' ' + cls : '');
  host.prepend(L);
  return L;
}
function _lqDrop(host, L, ms) {
  setTimeout(() => {
    L.remove();
    if (--host._lqN <= 0) { host._lqN = 0; host.classList.remove('lq-host'); }
  }, ms * _rfK);
}
/* シャボンの膜・玉の縁の虹色（薄膜干渉）。createConicGradient が無い環境は単色 */
const LQ_IRI = ['#ff6ec7', '#ffd36e', '#6effc0', '#6ecbff', '#b66eff', '#ff6ec7'];
function _lqIri(c, x, y, rot, fb) {
  if (!c.createConicGradient) return fb;
  const g = c.createConicGradient(rot, x, y);
  LQ_IRI.forEach((col, i) => g.addColorStop(i / (LQ_IRI.length - 1), col));
  return g;
}
/* シャボン玉1つ。縁は虹色・中はほぼ透明・左上に窓の映り込み。wob で揺れて楕円になる */
function _lqBubble(c, x, y, r, rot, wob, a) {
  if (r < 1 || a <= 0) return;
  c.save(); c.translate(x, y); c.rotate(wob * .3); c.scale(1 + wob, 1 - wob);
  c.globalAlpha = a;
  const g = c.createRadialGradient(0, 0, r * .55, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.16)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.strokeStyle = _lqIri(c, 0, 0, rot, '#ff9fd6');
  c.globalAlpha = a * .9; c.lineWidth = Math.max(1.2, r * .085); c.beginPath(); c.arc(0, 0, r * .95, 0, 7); c.stroke();
  c.globalAlpha = a * .38; c.lineWidth = Math.max(.8, r * .05);
  c.beginPath(); c.arc(0, 0, r * .72, rot, rot + 1.9); c.stroke();
  c.beginPath(); c.arc(0, 0, r * .5, rot + 3, rot + 4.3); c.stroke();
  c.globalAlpha = a * .95; c.fillStyle = 'rgba(255,255,255,.9)';
  c.beginPath(); c.ellipse(-r * .42, -r * .42, r * .2, r * .11, -.75, 0, 7); c.fill();
  c.globalAlpha = a * .55; c.beginPath(); c.arc(r * .44, r * .4, r * .075, 0, 7); c.fill();
  c.restore();
}
/* ① 肢の層：文字の裏に虹色の膜が張り、タップ位置から丸く割れて雫が散る（ラボの尺 820ms を送りまでに縮める） */
function _lqSoapFilm(el, ox, oy, budget) {
  const NOM = 820;
  _rfFit(budget, NOM);
  const L = _lqLayer(el);
  const w = el.clientWidth, h = el.clientHeight;
  const c = _frCtx(L, w, h, 0, 2);
  const diag = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
  const drops = Array.from({ length: 12 }, (_, i) => ({ a: i / 12 * Math.PI * 2 + _frR(-.2, .2), v: _frR(.5, 1) }));
  _frRun(c, w, h, NOM, (c, e) => {
    const film = _frC(e / 180), hole = _frE(_frC((e - 260) / 480)) * diag * 1.05;
    c.globalAlpha = .38 * film; c.fillStyle = _lqIri(c, ox, oy, e * .004, 'rgba(255,110,199,.8)'); c.fillRect(0, 0, w, h);
    c.globalAlpha = .22 * film; c.strokeStyle = '#fff'; c.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(ox, oy, 14 + k * 22 + e * .02, k + e * .005, k + e * .005 + 2.2); c.stroke(); }
    c.globalAlpha = 1;
    if (hole > 0) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(ox, oy, hole, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
    if (hole > 0 && hole < diag) drops.forEach(d => {
      const rr = hole + 6 * d.v;
      c.fillStyle = `rgba(255,235,248,${.9 * (1 - hole / diag)})`;
      c.beginPath(); c.arc(ox + Math.cos(d.a) * rr, oy + Math.sin(d.a) * rr * .7, 1.8, 0, 7); c.fill();
    });
  });
  _lqDrop(el, L, NOM);
}
/* ② 全画面の層のシャボン玉（段で数と大きさが増える）。born＝吹き出す時刻・life＝割れるまで */
function _lqBlow(cx, cy, t) {
  const n = 4 + t + (t >= 3 ? 2 : 0);
  return Array.from({ length: n }, (_, i) => ({
    x: cx, y: cy, vx: _frR(-160, 160), vy: _frR(-260, -120), r: _frR(13, 26) * (1 + t * .07), born: i * 70 + _frR(0, 60),
    life: _frR(1300, 2300), rot: _frR(0, 7), wf: _frR(3, 5), wp: _frR(0, 7)
  }));
}
/* 段が上がった瞬間の大きな玉：画面の中央まで昇って割れ、細かな玉が散る */
function _lqGiantBubble(cx, cy, VW, VH) {
  // 2026-09-28：膨らむ・昇る・割れるまでの尺を半分に（ユーザー判断・320→160／1200→600／1950→975ms）
  return { x: cx, y: cy, x0: cx, y0: cy, giant: true, r: Math.min(VW, VH) * .2, born: 120, life: 975, grow: 160, rise: 600, rot: 0, wf: 2.4, wp: 0 };
}
function _lqSoapFx(el, card, tier, promoted, budget) {
  if (!el || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  let ox = er.width / 2, oy = er.height / 2;
  const pt = _lqPtr;
  if (pt && pt.el === el && performance.now() - pt.t < 2000) { ox = er.width * pt.fx; oy = er.height * pt.fy; }
  const t = Math.max(1, tier), up = promoted && tier >= 2;
  _lqSoapFilm(el, ox, oy, budget);
  if (!card) return;
  // ② 全画面（ラボの尺のまま・毎回）
  _rfK = 1;
  const VW = window.innerWidth, VH = window.innerHeight;
  const cx = er.left + ox, cy = er.top + oy;
  const DUR = 2800 + (up ? 300 : 0);
  const H = _rfFullHost(DUR + 100);
  const c0 = _frCtx(H, VW, VH, 0, 1.5);
  const bs = _lqBlow(cx, cy, t);
  if (up) { const g = _lqGiantBubble(cx, cy, VW, VH); if (g) bs.push(g); }
  const pops = [];
  let lastE = 0;
  _frRun(c0, VW, VH, DUR, (c, e) => {
    const dt = Math.min(.05, (e - lastE) / 1000); lastE = e;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i], le = e - b.born;
      if (le < 0 || b.gone) continue;
      if (le > b.life) {   // 割れる：雫が散り、輪が一瞬広がる
        b.gone = true;
        const k = b.giant ? 42 : 10;
        for (let j = 0; j < k; j++) {
          const a = _frR(0, 7), sp = _frR(80, b.giant ? 520 : 240);
          pops.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0: e, r: _frR(1, 2.4), col: LQ_IRI[j % 5] });
        }
        pops.push({ ring: true, x: b.x, y: b.y, r: b.r, t0: e });
        if (b.giant) for (let j = 0; j < 7; j++) bs.push({ x: b.x, y: b.y, vx: _frR(-260, 260), vy: _frR(-260, 80), r: _frR(8, 15), born: e, life: _frR(500, 800), rot: _frR(0, 7), wf: 4, wp: _frR(0, 7) });
        continue;
      }
      const grow = _frE(_frC(le / (b.grow || 320)));
      if (b.giant) {
        const p = _frC(le / b.rise), q = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        b.x = b.x0 + (VW / 2 - b.x0) * q; b.y = b.y0 + (VH * .45 - b.y0) * q;
      } else {
        b.vy -= 60 * dt; b.vx *= Math.exp(-dt * 1.2); b.vy *= Math.exp(-dt * .9);
        b.x += (b.vx + Math.sin(le * .004 + b.wp) * 30) * dt; b.y += b.vy * dt;
      }
      b.rot += dt * (b.giant ? 1.4 : 2.2);
      const wob = Math.sin(le * .002 * b.wf + b.wp) * .06 * (b.giant ? 1.2 : 1);
      _lqBubble(c, b.x, b.y, b.r * grow, b.rot, wob, 1);
      if (b.giant) {   // 大きな玉は膜の渦を多く
        c.save(); c.globalAlpha = .28; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) { c.strokeStyle = LQ_IRI[k]; c.beginPath(); c.arc(b.x, b.y, b.r * grow * (.2 + k * .14), b.rot * (k % 2 ? -1 : 1) + k, b.rot + k + 1.6); c.stroke(); }
        c.restore();
      }
    }
    for (const p of pops) {
      const le = (e - p.t0) / 1000;
      if (p.ring) {
        const q = _frC(le / .16);
        if (q < 1) { c.strokeStyle = `rgba(255,255,255,${.7 * (1 - q)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + q * .35), 0, 7); c.stroke(); }
        continue;
      }
      const a = 1 - _frC(le / .45);
      if (a <= 0) continue;
      c.globalAlpha = a; c.fillStyle = p.col;
      c.beginPath(); c.arc(p.x + p.vx * le, p.y + p.vy * le + 300 * le * le, p.r, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  });
}

/* ══════════ Liquid：ぷるん＋ガラスの衝撃波（2026-09-28）══════════
   デモページ（fx_all_demo.html「Liquid の新しい案 第3弾」の案AD・案U）でユーザーが採用し、シャボン玉（_lqSoapFx）と
   3つとも重ねて出す（ユーザー判断）。入口は _lqLiquidFx の1本。
   - ぷるん（_lqJelly）：正解の肢そのものがゼリーのように弾み（横に伸びて縦に縮み、戻る）、文字の裏をつやが走る。
       肢の両端から液体の玉がはじけ飛ぶ（_lqJellyDrops・全画面の層）。段3〜はカード全体も揺れる（_lqCardJelly）。
   - ガラスの衝撃波（_lqGlassWave）：タップ位置からリキッドグラスのレンズの輪が広がり、輪が通る所だけ下の画面が
       にじんで色がずれる（本物の backdrop-filter）。縁は虹色。段3〜で2重・段5〜で3重・段が上がった瞬間は4重。
   ⚠️ 肢とカードは scale（独立プロパティ）で動かす。transform を使うと既存のアニメーションに黙って殺される。
   ⚠️ 肢の弾みは送り（_rfFit）の前に終える。カードの揺れと玉・輪は全画面の層と同じく元の尺のまま。
   ⚠️ backdrop-filter を画面より大きい要素に掛けている＝重くなったらまず輪の本数（段）を疑う。 */
function _lqLiquidFx(el, card, tier, promoted, budget) {
  _lqJelly(el, card, tier, promoted, budget);
  _lqSoapFx(el, card, tier, promoted, budget);
  _lqGlassWave(el, card, tier, promoted);
  _lqChroma(el, card, tier, promoted, budget);
  _lqNeon(el, card, tier, promoted, budget);
}
/* つやのある液体の玉（ぷるんの飛び散り） */
function _lqGlossBall(c, x, y, r, sx, sy, a) {
  if (r < .5 || a <= 0) return;
  c.save(); c.translate(x, y); c.scale(sx, sy); c.globalAlpha = a;
  const g = c.createRadialGradient(-r * .35, -r * .4, r * .05, 0, 0, r);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(.25, '#FF7CC0'); g.addColorStop(.65, '#FF007F'); g.addColorStop(1, '#6A1FB8');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(47,224,213,.7)'; c.lineWidth = Math.max(1, r * .12); c.beginPath(); c.arc(0, 0, r * .9, .35, Math.PI - .35); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-r * .35, -r * .45, r * .28, r * .14, -.5, 0, 7); c.fill();
  c.restore();
}
function _lqJelly(el, card, tier, promoted, budget) {
  if (!el || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const t = Math.max(1, tier), up = promoted && tier >= 2;
  // ① 肢：弾み＋文字の裏のつや（送りまでに終える）
  const NOM = 420, k = _rfFit(budget, NOM);
  const L = _lqLayer(el);
  const w = el.clientWidth, h = el.clientHeight;
  _frRun(_frCtx(L, w, h, 0, 2), w, h, NOM, (c, e) => {
    const p = _frC(e / NOM), x = -w * .2 + w * 1.4 * (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const g = c.createRadialGradient(x, h * .25, 0, x, h * .25, w * .3);
    g.addColorStop(0, `rgba(255,255,255,${.55 * (1 - p)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  _lqDrop(el, L, NOM);
  const J = up ? 1.6 : 1;
  el.animate([{ scale: '1 1' }, { scale: `${1 + .06 * J} ${1 - .12 * J}`, offset: .2 }, { scale: `${1 - .03 * J} ${1 + .07 * J}`, offset: .45 },
    { scale: `${1 + .015 * J} ${1 - .03 * J}`, offset: .7 }, { scale: '1 1' }], { duration: NOM * k, easing: 'ease-out' });
  if (!card) return;
  _rfK = 1;
  if (t >= 3 || up) _lqCardJelly(card, up);
  _lqJellyDrops(er, t, up);
}
/* 段3〜：カード全体もぷるんと揺れる */
function _lqCardJelly(card, up) {
  const s = up ? .035 : .014;
  card.animate([{ scale: '1 1' }, { scale: `${1 + s} ${1 - s}`, offset: .25 }, { scale: `${1 - s * .5} ${1 + s * .5}`, offset: .55 }, { scale: '1 1' }],
    { duration: 650, easing: 'ease-out' });
}
/* 全画面の層：肢の両端（段が上がった瞬間は上の縁からも）から液体の玉がはじけ飛ぶ */
function _lqJellyDrops(er, t, up) {
  const DUR = 1400 + (up ? 300 : 0);
  _rfK = 1;
  const H = _rfFullHost(DUR + 100);
  const VW = window.innerWidth, VH = window.innerHeight;
  const c0 = _frCtx(H, VW, VH, 0, 1.5);
  const n = up ? 36 : 8 + t * 2;
  const drops = Array.from({ length: n }, (_, i) => {
    const side = up ? i % 3 : i % 2;   // 0＝左端・1＝右端・2＝上の縁
    const x = side === 0 ? er.left : side === 1 ? er.right : _frR(er.left, er.right), y = side === 2 ? er.top : er.top + er.height / 2;
    const a = side === 0 ? Math.PI + _frR(-.5, .9) : side === 1 ? _frR(-.9, .5) : -Math.PI / 2 + _frR(-.8, .8);
    const sp = _frR(220, 480) * (up ? 1.3 : 1);
    return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: _frR(3, 7) * (up ? 1.2 : 1), t0: _frR(0, 80) };
  });
  _frRun(c0, VW, VH, DUR, (c, e) => {
    const fade = 1 - _frC((e - (DUR - 400)) / 400);
    drops.forEach(d => {
      const le = (e - d.t0) / 1000;
      if (le < 0) return;
      const vy = d.vy + 1200 * le, sq = Math.min(.35, Math.hypot(d.vx, vy) / 2400);
      c.save(); c.translate(d.x + d.vx * le, d.y + d.vy * le + 600 * le * le); c.rotate(Math.atan2(vy, d.vx));
      _lqGlossBall(c, 0, 0, d.r * (1 - _frC((e - 900) / 500) * .6), 1 + sq, 1 - sq, fade);
      c.restore();
    });
  });
}
/* ガラスの衝撃波：レンズの輪（backdrop-filter）と虹色の縁を、タップ位置から画面の端まで広げる */
function _lqGlassWave(el, card, tier, promoted) {
  if (!el || !card || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  let ox = er.width / 2, oy = er.height / 2;
  const pt = _lqPtr;
  if (pt && pt.el === el && performance.now() - pt.t < 2000) { ox = er.width * pt.fx; oy = er.height * pt.fy; }
  const t = Math.max(1, tier), up = promoted && tier >= 2;
  const cx = er.left + ox, cy = er.top + oy;
  const VW = window.innerWidth, VH = window.innerHeight;
  const n = up ? 4 : 1 + (t >= 3) + (t >= 5);
  const dur = 1300 + (up ? 300 : 0);
  const H = _rfFullHost((n - 1) * 200 + dur + 100);
  const D = Math.hypot(Math.max(cx, VW - cx), Math.max(cy, VH - cy)) * 2.1;
  const base = `position:absolute;left:${cx - D / 2}px;top:${cy - D / 2}px;width:${D}px;height:${D}px;border-radius:50%;pointer-events:none;`;
  const bf = `blur(${up ? 4 : 2.5}px) saturate(2.4) brightness(1.3) hue-rotate(${up ? 70 : 40}deg) contrast(1.1)`;
  const m = 'radial-gradient(closest-side, transparent 80%, #000 88%, #000 95%, transparent 100%)';
  const m2 = 'radial-gradient(closest-side, transparent 94.5%, #000 96.5%, transparent 99%)';
  const kf = [{ scale: .03, opacity: 1 }, { scale: .55, opacity: 1, offset: .5 }, { scale: 1, opacity: 0 }];
  for (let i = 0; i < n; i++) setTimeout(() => {
    if (!H.isConnected) return;
    const lens = document.createElement('div'), rim = document.createElement('div');
    lens.style.cssText = base + `backdrop-filter:${bf};-webkit-backdrop-filter:${bf};-webkit-mask:${m};mask:${m};`;
    rim.style.cssText = base + `background:conic-gradient(${LQ_IRI.join(',')});mix-blend-mode:screen;-webkit-mask:${m2};mask:${m2};`;
    H.append(lens, rim);
    [lens, rim].forEach(x => x.animate(kf, { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }));
  }, i * 200);
}

/* ══════════ Liquid：色収差＋ネオン管（2026-09-28）══════════
   デモページ（fx_all_demo.html「Liquid の新しい案 第4弾」の案BC・案BI）でユーザーが採用し、今の3つ（ぷるん・シャボン玉・
   ガラスの衝撃波）に足した。どちらも**肢の層**（送りの前に終える）。
   - 色収差（_lqChroma）：肢の文字が一瞬マゼンタとシアンに左右へ分かれて、すっと重なる。段3〜はカードの輪郭も分かれて戻る。
   - ネオン管（_lqNeon）：肢の縁がネオンサインのように2回瞬いてから点灯する。段3〜はカードの縁も点灯し、段が上がった瞬間はシアン。
   ⚠️ Liquid の正解の肢は text-shadow / box-shadow が !important（ui_theme.css）＝el.animate では上書きできず何も出ない
      （デモで実際に踏んだ）。だから肢の中に重ねた要素（.lq-clone・.lq-tube）で見せる。 */
/* 肢の文字だけを写した重ね（位置・字詰めは元の肢と同じ）。演出の層（.lq-*・.rf-*・svg）は写さない。色は --lqfx-c */
function _lqTextClone(el, col) {
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const cs = getComputedStyle(el);
  const cl = document.createElement('div');
  cl.className = 'lq-clone';
  cl.setAttribute('aria-hidden', 'true');
  cl.style.setProperty('--lqfx-c', col);
  ['display', 'alignItems', 'justifyContent', 'gap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'textAlign',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle', 'flexDirection', 'flexWrap'].forEach(p => { cl.style[p] = cs[p]; });
  cl.style.left = -parseFloat(cs.borderLeftWidth) + 'px'; cl.style.top = -parseFloat(cs.borderTopWidth) + 'px';
  cl.style.right = -parseFloat(cs.borderRightWidth) + 'px'; cl.style.bottom = -parseFloat(cs.borderBottomWidth) + 'px';
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) cl.appendChild(n.cloneNode(true));
    else if (n.nodeType === 1 && typeof n.className === 'string' && !/\blq-|\brf-/.test(n.className)) cl.appendChild(n.cloneNode(true));
  });
  cl.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  el.appendChild(cl);
  return cl;
}
function _lqChroma(el, card, tier, promoted, budget) {
  if (!el || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const t = Math.max(1, tier), up = promoted && tier >= 2;
  const D = 340 * _rfFit(budget, 340), d = up ? 5 : 3.5;
  [['#FF007F', -1], ['#2FE0D5', 1]].forEach(([col, sg]) => {
    const cl = _lqTextClone(el, col);
    const kf = up
      ? [{ translate: '0 0', opacity: 0 }, { translate: `${sg * d}px 0`, opacity: .95, offset: .15 }, { translate: `${sg}px 0`, opacity: .6, offset: .4 }, { translate: `${sg * d * .7}px 0`, opacity: .85, offset: .6 }, { translate: '0 0', opacity: 0 }]
      : [{ translate: '0 0', opacity: 0 }, { translate: `${sg * d}px 0`, opacity: .9, offset: .2 }, { translate: `${sg}px 0`, opacity: .5, offset: .55 }, { translate: '0 0', opacity: 0 }];
    cl.animate(kf, { duration: D, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => cl.remove(), D + 30);
  });
  if (card && (t >= 3 || up)) {
    const f = (x, a) => `drop-shadow(${-x}px 0 0 rgba(255,0,127,${a})) drop-shadow(${x}px 0 0 rgba(47,224,213,${a}))`;
    card.animate([{ filter: f(0, 0) }, { filter: f(up ? 6 : 3, .7), offset: .25 }, { filter: f(0, 0) }], { duration: 420, easing: 'ease-out' });
  }
}
function _lqNeon(el, card, tier, promoted, budget) {
  if (!el || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const t = Math.max(1, tier), up = promoted && tier >= 2;
  const D = 360 * _rfFit(budget, 360);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const col = up ? '47,224,213' : '255,0,127';
  const tube = document.createElement('span');
  tube.className = 'lq-tube';
  tube.setAttribute('aria-hidden', 'true');
  tube.style.boxShadow = `0 0 0 1.5px rgba(${col},1), inset 0 0 0 2px rgba(${col},.9), inset 0 0 16px 2px rgba(${col},.7), inset 0 0 40px rgba(${col},.35)`;
  el.appendChild(tube);
  tube.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: .1, offset: .17 }, { opacity: 1, offset: .27 }, { opacity: .2, offset: .32 }, { opacity: 1, offset: .45 }, { opacity: 1, offset: .82 }, { opacity: 0 }],
    { duration: D, easing: 'linear', fill: 'forwards' });
  setTimeout(() => tube.remove(), D + 30);
  if (card && (t >= 3 || up)) {   // カードの縁も（カードの box-shadow も !important なので、同じく重ねた要素で）
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    const ct = document.createElement('span');
    ct.className = 'lq-tube';
    ct.setAttribute('aria-hidden', 'true');
    ct.style.boxShadow = `inset 0 0 0 2px rgba(${col},.95), inset 0 0 26px 4px rgba(${col},.5)`;
    ct.style.opacity = '0';
    card.appendChild(ct);
    ct.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 0, offset: .16 }, { opacity: 1, offset: .26 }, { opacity: 1, offset: .7 }, { opacity: 0 }],
      { duration: 1200, delay: 120, easing: 'linear', fill: 'forwards' });
    setTimeout(() => ct.remove(), 1360);
  }
}

/* ══════════ Frost：六花＋霜華＋ダイヤモンドダスト（2026-09-25）══════════
   デモ（frost 正解演出ラボの案A・B・F）でユーザーが採用。旧 frostCrystalShatter（全画面の閃光・回る六角形・
   破片68・菱形の光138・十字の斬撃4本・画面全体の粉 85〜170粒）を置き換えた。
   - 霜華（2026-09-28 にデモページで部品ごとに見て撤去した（ユーザー判断）。戻さないこと。）：正解の肢が縁から凍り（霜の樹枝が上下の縁から内側へ這う）、タップ位置から丸く溶ける。
   - 六花：タップ位置の**カードの裏**に雪の結晶が線で描き上がる。枝ぶりは毎回ちがい、
           **段が上がるほど枝が複雑になる**（孫枝・六角板）。TIER3〜は小さな結晶がまわりに咲く。
   - ダイヤモンドダスト：肢の上で細かな光の粒がゆっくり舞い降りて瞬く。TIER3〜はカード全体。
   - 大きな結晶：正解のたびに画面のランダムな位置に1〜3個（2026-09-28〜・旧：段が上がった瞬間だけ）。
   - 段が上がった瞬間：画面の縁が一周凍り、粒が左から右へ瞬く。
   ⚠️ 肢の層は肢の**文字の裏**（.lq-layer・z-index:-1）。全画面の層は2枚＝霜（四隅・縁）だけの .fr-card と、
      結晶＋ダイヤモンドダストの .fr-dust（2026-09-28・負荷軽減で組み替え）。
   ⚠️ 全画面の霜は**描き足して静止させる**（_frKeep・_frDrawFrost の k0）。毎フレーム描き直す形・
      destination-out で溶かす形に戻さないこと——画面 1920×1080 で四隅の霜は約1.6万〜2.8万本・縁の霜は約1.2万本あり、
      それを毎フレーム2回ずつ描き直していたのが重さの大半だった。消えるのは canvas の opacity（描き直し無し）。
   ⚠️ きらめきはスプライトを貼る（_frGlintSprite）。粒ごとに放射グラデーションを作る形に戻さない。
   ⚠️ カードの canvas は肢のまわり最大 FR_BAND px に限る（解説まで開いた長いカードの全面を描くと数十MBになる）。
   ⚠️ 層の出し入れは liquid の _lqLayer / _lqDrop を共用（片付けは素の setTimeout。理由は liquid と同じ）。 */
const FR_SNOW = '#EAF8FF', FR_BAND = 1000;
function _frCtx(L, w, h, top, dmax) {
  // 全画面の層は dmax=1.5（画面いっぱいを 2倍で描くと 1枚で数十MB になる）
  const d = Math.min(dmax || 2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * d)); c.height = Math.max(1, Math.ceil(h * d));
  c.style.cssText = `position:absolute;left:0;top:${top || 0}px;width:${w}px;height:${h}px;pointer-events:none;`;
  L.appendChild(c);
  const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
  return x;
}
// ⚠️ 経過時間を _rfK で割って渡す＝描画側の ms（dur・各区間の開始）は書き換えずに全体が縮む。
// ctx._frKeep が立っていれば**消さずに描き足す**（伸びる一方の霜用・2026-09-28）。dur で最後に1回描いて止まり、
// 描いた絵はそのまま残る（消すのは呼んだ側＝CSS の opacity）。
function _frRun(ctx, w, h, dur, draw) {
  const t0 = performance.now(), k = _rfK, keep = ctx._frKeep;
  (function f(now) {
    if (!ctx.canvas.isConnected) return;
    const e = (now - t0) / k;
    if (keep) { draw(ctx, Math.min(e, dur)); if (e < dur) requestAnimationFrame(f); return; }
    ctx.clearRect(0, 0, w, h);
    if (e < dur) { draw(ctx, e); requestAnimationFrame(f); }
  })(t0);
}
const _frR = (a, b) => a + Math.random() * (b - a);
const _frC = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const _frE = t => 1 - Math.pow(1 - t, 3);
/* 4本の光条のきらめき。絵は最初に1枚だけ描いたスプライト（_frGlintSprite）を拡大縮小して貼る
   （2026-09-28・負荷軽減：粒1つごとに毎フレーム放射グラデーションを作っていた）。 */
const FR_GLINT_S = 48;   // スプライトの中の s（px）。表示の s は最大でも 9 前後なので縮めて貼るだけになる
let _frGlintImg = null;
function _frGlintSprite() {
  if (_frGlintImg) return _frGlintImg;
  const s = FR_GLINT_S, E = Math.ceil(s * 2.3) + 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = E * 2;
  const c = cv.getContext('2d');
  c.translate(E, E); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.3);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.3, 'rgba(158,227,255,.35)'); g.addColorStop(1, 'rgba(112,214,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 1.3, 0, 7); c.fill();
  c.fillStyle = '#fff';
  for (const [w, h] of [[s * .11, s * 2.3], [s * 2.3, s * .11]]) { c.beginPath(); c.moveTo(0, -h); c.lineTo(w, 0); c.lineTo(0, h); c.lineTo(-w, 0); c.closePath(); c.fill(); }
  return (_frGlintImg = { img: cv, E });
}
function _frGlint(c, x, y, s, a, rot) {
  if (!(a > 0) || !(s > 0)) return;
  const sp = _frGlintSprite(), r = sp.E * s / FR_GLINT_S;
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = 'lighter';
  c.drawImage(sp.img, -r, -r, r * 2, r * 2);
  c.restore();
}
/* 六花：腕1本ぶんの線分（6回回して描く）。gens 1〜4 で枝の複雑さが上がる */
function _frFlake(gens) {
  const segs = [], push = (x1, y1, x2, y2, d0) => segs.push({ x1, y1, x2, y2, d0, len: Math.hypot(x2 - x1, y2 - y1) });
  push(0, 0, 1, 0, 0);
  const nb = 1 + gens;
  for (let i = 0; i < nb; i++) {
    const p = .2 + (i + .15 + Math.random() * .6) / nb * .68;
    const l = (1 - p) * (.4 + Math.random() * .35) * (gens === 1 ? .8 : 1);
    for (const sg of [1, -1]) {
      push(p, 0, p + l * .5, sg * l * .866, p);
      if (gens >= 2 && l > .14) { const bx = p + l * .25, by = sg * l * .433; push(bx, by, bx + l * .38, by, p + l * .5); }
      if (gens >= 4 && l > .2) { const bx = p + l * .39, by = sg * l * .675; push(bx, by, bx - l * .12, by + sg * l * .2, p + l * .78); }
    }
  }
  if (gens >= 3) {
    const rr = .18 + Math.random() * .08;
    push(rr, 0, rr * .5, rr * .866, rr); push(rr * 1.35, 0, rr * .675, rr * 1.169, rr * 1.35);   // 六角板（6回回すと六角形になる）
    push(.88, 0, .97, .08, .88); push(.88, 0, .97, -.08, .88);
  }
  return { segs, maxD: Math.max(...segs.map(g => g.d0 + g.len)) };
}
function _frDrawFlake(c, f, x, y, R, rot, k, alpha, lw) {
  if (alpha <= 0 || k <= 0) return;
  const D = k * f.maxD;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = Math.min(1, alpha); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  const path = () => {
    c.beginPath();
    for (let a = 0; a < 6; a++) {
      const ca = Math.cos(a * Math.PI / 3), sa = Math.sin(a * Math.PI / 3);
      for (const g of f.segs) {
        const m = D - g.d0; if (m <= 0) continue;
        const u = Math.min(1, m / g.len), x2 = g.x1 + (g.x2 - g.x1) * u, y2 = g.y1 + (g.y2 - g.y1) * u;
        c.moveTo((g.x1 * ca - g.y1 * sa) * R, (g.x1 * sa + g.y1 * ca) * R);
        c.lineTo((x2 * ca - y2 * sa) * R, (x2 * sa + y2 * ca) * R);
      }
    }
  };
  path(); c.strokeStyle = 'rgba(112,214,255,.45)'; c.lineWidth = lw * 3.2; c.stroke();
  path(); c.strokeStyle = FR_SNOW; c.lineWidth = lw; c.stroke();
  c.restore();
}
/* 霜華：縁の種から霜の樹枝を伸ばす（60°で枝分かれ） */
function _frFrost(seeds, maxLen) {
  const segs = [];
  function grow(x, y, ang, len, d0, depth) {
    let d = d0, left = len;
    while (left > 0) {
      const st = _frR(2.5, 4.5); ang += _frR(-.16, .16);
      const nx = x + Math.cos(ang) * st, ny = y + Math.sin(ang) * st;
      segs.push({ x1: x, y1: y, x2: nx, y2: ny, d0: d, len: st });
      x = nx; y = ny; d += st; left -= st;
      if (depth < 2 && Math.random() < .2) grow(x, y, ang + (Math.random() < .5 ? 1 : -1) * Math.PI / 3, left * _frR(.35, .6), d, depth + 1);
    }
  }
  seeds.forEach(s => grow(s.x, s.y, s.a, maxLen * _frR(.55, 1), 0, 0));
  return { segs, maxD: Math.max(1, ...segs.map(g => g.d0 + g.len)) };
}
/* k0 を渡すと「k0 から k まで伸びた分」だけを描く（消さずに描き足す層用・_frRun の _frKeep）。
   合成は lighter（足し算）なので、光の層と芯の層がフレームをまたいで前後しても絵は同じ。
   つなぎ目が二重に光らないよう、描き足しのときは線端を butt にする。 */
function _frDrawFrost(c, fr, k, alpha, k0) {
  if (k <= 0 || alpha <= 0) return;
  const D = k * fr.maxD, inc = k0 !== undefined, D0 = inc ? k0 * fr.maxD : 0;
  if (D <= D0) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = inc ? 'butt' : 'round'; c.globalAlpha = alpha;
  for (const pass of [0, 1]) {
    c.beginPath();
    for (const g of fr.segs) {
      const m = D - g.d0; if (m <= 0) continue;
      const m0 = D0 - g.d0; if (m0 >= g.len) continue;
      const u0 = Math.max(0, m0 / g.len), u = Math.min(1, m / g.len), dx = g.x2 - g.x1, dy = g.y2 - g.y1;
      c.moveTo(g.x1 + dx * u0, g.y1 + dy * u0); c.lineTo(g.x1 + dx * u, g.y1 + dy * u);
    }
    c.strokeStyle = pass ? 'rgba(234,248,255,.85)' : 'rgba(112,214,255,.35)'; c.lineWidth = pass ? .9 : 3; c.stroke();
  }
  c.restore();
}
/* タップ位置から丸く溶かす（溶けた縁が一瞬光る） */
function _frMelt(c, x, y, r, w, h, rim) {
  c.save(); c.globalCompositeOperation = 'destination-out';
  const g = c.createRadialGradient(x, y, Math.max(0, r - 14), x, y, r + 4);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.beginPath(); c.arc(x, y, Math.max(0, r - 14), 0, 7); c.fillStyle = '#000'; c.fill();
  c.restore();
  if (rim > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); c.arc(x, y, r, 0, 7); c.strokeStyle = `rgba(234,248,255,${rim})`; c.lineWidth = 1.4; c.shadowColor = '#70D6FF'; c.shadowBlur = 8; c.stroke(); c.restore(); }
}
/* 大きな結晶の置き場所：1〜3個をランダムに。結晶は中心から半径 R の円に収まるので、円どうしの重なりの面積が
   小さい方の円の20%以下になるように置く（＝発火点の中心も重ならない）。置けなければ個数を減らす。 */
const FR_BIG_OVERLAP = .2;
function _frOverlap(x1, y1, r1, x2, y2, r2) {   // 2円の重なりの面積 ÷ 小さい方の円の面積
  const d = Math.hypot(x2 - x1, y2 - y1), rs = Math.min(r1, r2);
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return 1;
  const A = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)) + r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2))
    - .5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return A / (Math.PI * rs * rs);
}
/* 六花の2個目以降の置き場所：画面のランダムな位置に n 個。1個目（タップ位置・半径 r0）とも、互いとも、
   重なりは小さい方の面積の20%まで（＝発火点の中心は重ならない）。置けなかった分は出さない。 */
function _frFlakeSpots(n, R, CW, CH, x0, y0) {
  const out = [], all = [{ x: x0, y: y0, R }];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 60; k++) {
      const r = R * _frR(.85, 1.1), x = _frR(CW * .08, CW * .92), y = _frR(CH * .12, CH * .88);
      if (all.every(o => _frOverlap(o.x, o.y, o.R, x, y, r) <= FR_BIG_OVERLAP)) { const q = { x, y, R: r }; out.push(q); all.push(q); break; }
    }
  }
  return out;
}
function _frBigSpots(CW, CH) {
  const base = Math.min(CW, CH, 440);
  for (let n = 1 + Math.floor(Math.random() * 3); n >= 1; n--) {
    const R0 = base * (n === 1 ? .46 : n === 2 ? .36 : .3);
    for (let tries = 0; tries < 40; tries++) {
      const out = [];
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < 30 && out.length === i; k++) {
          const r = R0 * _frR(.85, 1.1), x = _frR(CW * .08, CW * .92), y = _frR(CH * .1, CH * .9);
          if (out.every(o => _frOverlap(o.x, o.y, o.R, x, y, r) <= FR_BIG_OVERLAP)) out.push({ x, y, R: r });
        }
      }
      if (out.length === n) return out;
    }
  }
  return [{ x: CW / 2, y: CH / 2, R: base * .3 }];
}
function _frFrostFx(el, card, tier, promoted, budget) {
  if (!el || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const w = er.width, h = er.height;
  let lx = w / 2, ly = h / 2;
  const pt = _lqPtr;
  if (pt && pt.el === el && performance.now() - pt.t < 2000) { lx = w * pt.fx; ly = h * pt.fy; }
  const T = Math.max(1, tier), up = promoted && tier >= 2;
  _rfFit(budget, 1700);   // ① 肢の層（霜華 1650 ＋ 片付け 50）を送りまでに終える
  // 六花は肢の層とカードの層に**同じ位置・同じ角度で2回**描く。肢の地は不透明（.75）なので、カードの裏だけに
  // 描くと肢に重なる部分が隠れる。肢の中はくっきり、はみ出した先はカードの裏へ続いて見える。
  const gens = Math.min(4, 1 + Math.floor(T / 2));
  const f = _frFlake(gens), R = 24 + T * 3.5, rot0 = _frR(0, Math.PI);
  const flakeAt = (c, e, x, y, fl = f, rr = R, rot = rot0) => {
    const fade = e < 1000 ? 1 : _frC(1 - (e - 1000) / 600);
    _frDrawFlake(c, fl, x, y, rr, rot + e / 4000, _frE(_frC(e / 520)), fade, 1.35);
    if (e > 380 && e < 900) _frGlint(c, x, y, 9 * Math.sin(Math.PI * (e - 380) / 520), .9);
  };

  // ── 肢の裏：霞＋六花。霜華（肢の縁から這う霜と、溶けた縁の光）は 2026-09-28 にデモページで部品ごとに見て撤去した（ユーザー判断）。戻さないこと。 ──
  const reach = Math.hypot(Math.max(lx, w - lx), h) + 20;
  const L = _lqLayer(el);
  const c1 = _frCtx(L, w, h);
  _frRun(c1, w, h, 1650, (c, e) => {
    const k = _frE(_frC(e / 480));
    const hz = c.createLinearGradient(0, 0, 0, h), a = .22 * k;
    hz.addColorStop(0, `rgba(214,238,255,${a})`); hz.addColorStop(.35, 'rgba(214,238,255,0)'); hz.addColorStop(.65, 'rgba(214,238,255,0)'); hz.addColorStop(1, `rgba(214,238,255,${a})`);
    c.fillStyle = hz; c.fillRect(0, 0, w, h);
    if (e > 560) { const km = _frE(_frC((e - 560) / 800)); _frMelt(c, lx, ly, km * reach, w, h, 0); }   // 霞をタップ位置から溶かす
    flakeAt(c, e, lx, ly);
  });
  _lqDrop(el, L, 1700);
  if (!card) return;

  // ── ② 全画面の座標（ラボの尺のまま）。画面の四隅・四辺がカードの四隅・縁の代わりになる ──
  _rfK = 1;
  const CW = window.innerWidth, CHf = window.innerHeight;
  if (!CW || !CHf) return;
  const chL = er.left, chT = er.top, top = 0, CH = CHf;
  const px = chL + lx, py = chT + ly, bT = chT;
  // 画面の外周（四隅の霜・縁の霜）はラボの尺の3倍でゆっくり伸び・長く残る（2026-09-28・ユーザー判断：2倍→さらに延長）。
  // 伸びる長さも画面の短辺から決めて、画面の内側まで届かせる（旧：四隅 45＋段×14px・縁 26px）。結晶と粒は元の尺のまま。
  const FR_EDGE_K = 3;
  // 全画面の六花とまわりの小さな結晶はラボの尺の2倍（描き上がる・残る・消えるを同じ比で延ばす。2026-09-28・ユーザー判断）。
  // 肢の層の六花は送りまでに終える約束のまま（_rfFit）。
  const FR_FLAKE_K = 2;
  const Mf = Math.min(CW, CH);
  // 層は2枚（2026-09-28・負荷軽減）：霜（四隅・縁）だけの canvas と、結晶＋ダイヤモンドダストの canvas。
  // 霜は伸びた分だけ描き足し、伸びきったら描くのをやめて静止させ、canvas ごと opacity で薄れて消える
  // （旧：毎フレーム数万本を描き直し、タップ位置から destination-out で溶かしていた＝ユーザー判断で溶かすのをやめた）。
  const durF = up ? Math.round(2000 * FR_EDGE_K) : T >= 3 ? Math.round(1900 * FR_EDGE_K) : 0;
  const durD = up ? 2900 : T >= 3 ? 2900 : 2700;
  const durC = Math.max(durD, Math.round(1950 * FR_FLAKE_K));
  const H = _rfFullHost(Math.max(durF, durC) + 100);

  // ── 六花（カードの裏）＋ TIER3〜の四隅の霜 ＋ 段が上がった瞬間の縁の霜と大きな結晶 ──
  // まわりの小さな結晶の数は 2026-09-28 に2倍へ（ユーザー判断・旧 min(4, T-1)）
  // 小さな結晶どうしは重ねない（2026-09-28・ユーザー判断）：半径の円が互いに離れる位置を探し、見つからなければ少しずつ外へ広げる。
  // ⚠️ 数は減らさない（デモページが _frFlake を呼んだ数で部品を見分けている）。
  const extras = T >= 3 ? (() => {
    const out = [];
    for (let i = 0, n = Math.min(8, (T - 1) * 2); i < n; i++) {
      const r = R * _frR(.3, .45);
      let x = 0, y = 0;
      for (let k = 0; k < 80; k++) {
        const a = _frR(0, 6.28), d = R * _frR(1.5, 2.3) * (1 + k / 40);
        x = px + Math.cos(a) * d * 1.4; y = py + Math.sin(a) * d * .7;
        if (out.every(o => Math.hypot(o.x - x, o.y - y) >= o.R + r + 2)) break;
      }
      out.push({ f: _frFlake(Math.max(1, gens - 2)), x, y, R: r, dl: 150 + i * 110, rot: _frR(0, 3) });
    }
    return out;
  })() : null;
  // 大きな結晶：画面のランダムな位置に1〜3個（2026-09-28・ユーザー判断）。発火点（中心）は重ねず、結晶どうしの重なりは
  // 小さい方の面積の20%まで（_frBigSpots）。少しずつずらして咲かせる。
  // 正解のたびに毎回出す・不透明度 .32→.6・線 1→1.5（2026-09-28・ユーザー判断：段が上がった瞬間だけ・薄い線では「まったく出ない」と見えた）。
  // 六花は2〜4個（2026-09-28・ユーザー判断・旧1〜3個）。1個目はタップ位置、2個目以降は画面のランダムな位置に 0.15秒ずつ遅れて咲く。
  const flakes2 = _frFlakeSpots(1 + Math.floor(Math.random() * 3), R, CW, CH, px, py)
    .map((q, i) => ({ ...q, f: _frFlake(gens), rot: _frR(0, Math.PI), dl: 150 * (i + 1) }));
  const bigs = _frBigSpots(CW, CH).map((b, i) => ({ ...b, f: _frFlake(4), rot: _frR(0, Math.PI), dl: i * 180 }));
  let corner = null, rim = null;
  if (T >= 3) {
    const cs = [], pts = [[0, 0, Math.PI / 4], [CW, 0, Math.PI * 3 / 4], [0, CH, -Math.PI / 4], [CW, CH, -Math.PI * 3 / 4]];
    pts.forEach(([x, y, a], i) => {
      if (i < 2 && top > 0) return;                    // 帯の上端がカードの上端でなければ上の隅は無い
      if (i >= 2 && top + CH < CHf) return;             // 同じく下
      for (let j = 0; j < 6 + T; j++) cs.push({ x: x + _frR(-6, 6), y: y + _frR(-6, 6), a: a + _frR(-.7, .7) });
    });
    if (cs.length) corner = _frFrost(cs, Mf * Math.min(.34, .2 + T * .02));
  }
  if (up) {
    // 種の間隔は 14→22px（1本が長くなった分、線分の総数が増えすぎないように）
    const bs = [];
    for (let x = 0; x < CW; x += 22) { if (top === 0) bs.push({ x, y: 0, a: Math.PI / 2 + _frR(-.5, .5) }); if (top + CH >= CHf) bs.push({ x, y: CH, a: -Math.PI / 2 + _frR(-.5, .5) }); }
    for (let y = 0; y < CH; y += 22) bs.push({ x: 0, y, a: _frR(-.5, .5) }, { x: CW, y, a: Math.PI + _frR(-.5, .5) });
    rim = _frFrost(bs, Mf * .08);
  }
  if (corner || rim) {
    const C = _lqLayer(H, 'fr-card');
    const c2 = _frCtx(C, CW, CH, top, 1.5);
    c2._frKeep = true;
    // 伸びる区間（四隅 700・縁 650 をラボの尺の FR_EDGE_K 倍）だけ描き足し、あとは静止
    const growEnd = Math.max(corner ? 700 : 0, rim ? 650 : 0) * FR_EDGE_K;
    let kc = 0, kr = 0;
    _frRun(c2, CW, CH, growEnd, (c, e) => {
      const ek = e / FR_EDGE_K;
      if (corner) { const k = _frE(_frC(ek / 700)); _frDrawFrost(c, corner, k, .7, kc); kc = k; }
      if (rim) { const k = _frE(_frC(ek / 650)); _frDrawFrost(c, rim, k, .8, kr); kr = k; }
    });
    // 旧：溶け始め（縁 900・四隅 1000 × FR_EDGE_K）から終わりまで。薄れるのは合成だけで描き直しは無い
    const fadeAt = (rim ? 900 : 1000) * FR_EDGE_K;
    if (c2.canvas.animate) c2.canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.max(1, durF - fadeAt), delay: fadeAt, easing: 'ease-in-out', fill: 'forwards' });
    _lqDrop(H, C, durF + 50);
  }

  // ── ダイヤモンドダスト（小さく疎ら） ──
  const ps = [];
  const dustIn = (l, t, rw, rh, count, lm) => {
    for (let i = 0; i < count; i++) ps.push({ x: _frR(l - 6, l + rw + 6), y: _frR(t - 40, t + rh), dl: _frR(0, 500), L: _frR(1300, 2200) * lm,
      vy: _frR(8, 22), sw: _frR(4, 12), ph: _frR(0, 6), s: _frR(1.8, 4.2), om: _frR(6, 11), rot: _frR(0, .8) });
  };
  dustIn(chL, bT, w, h, 12 + T * 4, 1);
  if (T >= 3) dustIn(0, 0, CW, CH, 14 + T * 4, 1.1);
  const wave = up ? Array.from({ length: 26 }, (_, i) => ({ x: (i + .5) / 26 * CW, y: _frR(20, Math.max(21, CH - 20)), s: _frR(3, 6), dl: i * 35 })) : null;
  const D = document.createElement('span');
  D.className = 'fr-dust';
  H.appendChild(D);
  const c3 = _frCtx(D, CW, CH, top, 1.5);
  // 粒と結晶を同じ canvas に描く（どちらも lighter＝描く順は絵に効かない）。粒を先に描くのは、デモページが
  // この canvas の最初のきらめきを「肢の右上のきらめき」と見分けているため。
  _frRun(c3, CW, CH, durC, (c, e) => {
    if (e < durD) {
      if (e < 600) { const k = e / 600; _frGlint(c, chL + w - 10, bT + 8, 9 * Math.sin(Math.PI * k), 1, k * .6); }
      ps.forEach(q => {
        const life = (e - q.dl) / 1000; if (life < 0 || life * 1000 > q.L) return;
        const Ls = q.L / 1000, env = Math.sin(Math.PI * _frC(life / Ls)), tw = .45 + .55 * Math.max(0, Math.sin(life * q.om + q.ph));
        _frGlint(c, q.x + Math.sin(life * 1.6 + q.ph) * q.sw, q.y + q.vy * life, q.s, env * tw, q.rot);
      });
      if (wave) wave.forEach(q => { const k = (e - q.dl) / 550; if (k > 0 && k < 1) _frGlint(c, q.x, q.y, q.s * Math.sin(Math.PI * k), 1); });
    }
    bigs.forEach(b => {
      const eb = e - b.dl; if (eb <= 0) return;
      const fb = eb < 1800 ? 1 : _frC(1 - (eb - 1800) / 800);
      _frDrawFlake(c, b.f, b.x, b.y, b.R, b.rot + eb / 9000, _frE(_frC(eb / 1500)), .6 * fb, 1.5);
    });
    const ef = e / FR_FLAKE_K;
    flakeAt(c, ef, px, py);
    flakes2.forEach(q => { const eq = ef - q.dl; if (eq > 0) flakeAt(c, eq, q.x, q.y, q.f, q.R, q.rot); });
    if (extras) extras.forEach(x => {
      const ff = ef < 1100 ? 1 : _frC(1 - (ef - 1100) / 500);
      _frDrawFlake(c, x.f, x.x, x.y, x.R, x.rot + ef / 3000, _frE(_frC((ef - x.dl) / 480)), ff * .85, 1);
    });
  });
  setTimeout(() => D.remove(), durC + 50);
}

/* ══════════ Celestial：（超新星 または 銀河の渦）＋（星の軌跡／黄道十二宮の輪／星の網／天球の経緯線 から1つ）（2026-09-29）══════════
   試験演出一覧（_work/fx_all_demo.html）の新案5つ（一等星の点灯・流れ星の ✓・超新星・天球儀のロック・満月）から
   ユーザーが「超新星」だけを採用し、2026-09-25〜の「星座／惑星直列／星の軌跡から毎回ランダムで1つ」を置き換えた
   （旧3案は「おしゃれだが正解時のエフェクトっぽくない」＝ゆっくり描き上がるだけで山場が無かった）。
   - 同日、旧案の「星の軌跡」だけを戻し、**毎回超新星と重ねる**ことにした（ユーザー判断）。
   - 発火位置は超新星が**正解の肢の左端**（縦は肢の中央）、星の軌跡は**タップ位置**（旧のまま）。どちらもユーザー指定。
   - さらに同日、第2弾の新案から「銀河の渦」を採用し、**試験のセッションごとに超新星か銀河の渦のどちらかを抽選**する
     （startExam で _clxSessionPick を決め、そのセッション中は同じもの・星の軌跡はどちらにも重ねる・ユーザー判断）。
     ⚠️ 1問ごとに抽選しないこと（セッションで揃える、がユーザーの指定）。銀河の渦も肢の左端・縦は中央から出る。
   - さらに同日、第3弾の新案「黄道十二宮の輪」を**全画面（画面の中央）**に作り直して採用し、**毎回重ねる**（ユーザー判断）。
     今日の星座が真上で止まる。⚠️ 全画面の絵なので、線と記号は細く・半透明のまま保つこと（カードの文字の上にも重なる）。
   - さらに同日、新案から「星の網」（第6弾・全画面）と「天球の経緯線」（第4弾・肢の左端）を採用し、星の軌跡・十二宮の輪を
     毎回重ねるのをやめて、**この4つから正解のたびに1つを抽選**して超新星／銀河の渦に重ねる（CLX_EXTRAS・ユーザー判断）。
     ⚠️ 4つの方はセッションで固定しないこと（ユーザー指定）。超新星／銀河の渦のセッションごとの抽選はそのまま。
   - 0〜0.18秒：まわりの星屑が左端へ吸い込まれる → 弾けて金の衝撃波とシアンの衝撃波・放射する光の筋・紫の残光、
     星が外へ飛ぶ。1.5秒（段が上がった瞬間は1.8秒）で消える。
   - 段が上がるほど衝撃波が大きく（画面の短辺×0.3→最大0.62）・星と光の筋が増える。段が上がった瞬間は1.3倍＋3本目の輪。
   ⚠️ 金環（2026-09-28）と星座・惑星直列（2026-09-29）はデモページで見て撤去した（ユーザー判断）。戻さないこと。
   ⚠️ 全部を**同じ絵として肢の層と全画面の層の両方に**描く（座標は画面）。肢の地は不透明（.75）なので、
      全画面の層だけだと肢に重なる部分が隠れる（六花と同じ理由）。 */
const CLX_GOLD = '#FFD166', CLX_PALE = '#FFF3C4', CLX_CYAN = '#48CAE4';
const CLX_STARCOL = ['#FFF3C4', '#FFD166', '#CFE6FF', '#A8DDF2', '#FFD9A8', '#E4D2FF'];
/* 2026-09-28 ユーザー要望「もっとはっきり」：線・星・点を太く明るく（尺・構図・ランダムの選び方は変えていない）。 */
const CLX_BOLD = { line: 2, star: 1.45, dot: 1.5, alpha: 1.3 };
const _clxEio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function _clxRgba(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function _clxStar(c, x, y, s, a, rot, col) {
  if (!(a > 0) || !(s > 0)) return;
  col = col || CLX_GOLD;
  s *= CLX_BOLD.star;
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2);
  g.addColorStop(0, '#fff'); g.addColorStop(.22, _clxRgba(col, .8)); g.addColorStop(1, _clxRgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 2, 0, 7); c.fill();
  c.fillStyle = '#fff';
  for (const [w, h] of [[s * .16, s * 2.6], [s * 2.6, s * .16]]) { c.beginPath(); c.moveTo(0, -h); c.lineTo(w, 0); c.lineTo(0, h); c.lineTo(-w, 0); c.closePath(); c.fill(); }
  c.restore();
}
function _clxDot(c, x, y, r, a, col) {
  if (!(a > 0)) return;
  r *= CLX_BOLD.dot;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a);
  const g = c.createRadialGradient(x, y, 0, x, y, r * 3);
  g.addColorStop(0, '#fff'); g.addColorStop(.3, _clxRgba(col || CLX_PALE, .95)); g.addColorStop(1, _clxRgba(col || CLX_PALE, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, 7); c.fill(); c.restore();
}
function _clxLine(c, x1, y1, x2, y2, a, w) {
  if (!(a > 0)) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  const lw = (w || .9) * CLX_BOLD.line, al = Math.min(1, a * CLX_BOLD.alpha);
  c.globalAlpha = al * .3; c.strokeStyle = CLX_GOLD; c.lineWidth = lw * 6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.globalAlpha = al * .8; c.strokeStyle = CLX_GOLD; c.lineWidth = lw * 2.2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.globalAlpha = al; c.strokeStyle = CLX_PALE; c.lineWidth = lw; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.restore();
}

function _clxGlow(c, x, y, r, a, col, mid) {
  if (!(a > 0) || !(r > 0)) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a);
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#fff'); g.addColorStop(mid || .25, _clxRgba(col, .75)); g.addColorStop(1, _clxRgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
}
function _clxRing(c, x, y, r, a, col, lw) {
  if (!(a > 0) || !(r > 0)) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = col;
  c.globalAlpha = Math.min(1, a) * .3; c.lineWidth = lw * 4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.globalAlpha = Math.min(1, a); c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.restore();
}
/* 中心のまわりに n 個の星（画面の内側に収める） */
function _clxAround(n, px, py, rMin, rMax, CW, CH) {
  return Array.from({ length: n }, (_, i) => {
    const a = i / n * 6.28 + _frR(-.3, .3), d = _frR(rMin, rMax);
    return { x: _frC(px + Math.cos(a) * d, 8, CW - 8), y: _frC(py + Math.sin(a) * d, 8, CH - 8),
      s: _frR(1.8, 3.6), col: CLX_STARCOL[i % CLX_STARCOL.length], rot: _frR(0, 1) };
  });
}
/* 超新星。px/py＝発火位置（画面の座標）・M＝画面の短辺・S＝線と星の倍率 */
function _clxNova(T, up, px, py, CW, CH, M, S) {
  const R = M * Math.min(.62, .3 + .05 * T) * (up ? 1.3 : 1);
  const inn = _clxAround(Math.min(28, 12 + 3 * T), px, py, R * .35, R * .7, CW, CH);
  const out = _clxAround(Math.min(30, 10 + 4 * T), px, py, R * .5, R * 1.05, CW, CH);
  const nr = 12 + 2 * Math.min(T, 4);
  const rays = Array.from({ length: nr }, (_, i) => ({ a: i / nr * 6.28 + _frR(-.12, .12), l: _frR(.45, .9) }));
  const B = 180;   // 吸い込みの尺
  return { dur: up ? 1800 : 1500, draw(c, e) {
    if (e < B) {
      const k = _clxEio(e / B);
      inn.forEach(q => _clxDot(c, px + (q.x - px) * (1 - k), py + (q.y - py) * (1 - k), 1.2, .4 + .6 * k, q.col));
      _clxGlow(c, px, py, 14 * S * (1 - .5 * k), .5 + .5 * k, CLX_PALE);
      return;
    }
    const t = e - B, fade = t < 750 ? 1 : _frC(1 - (t - 750) / 550), kf = _frC(t / 120);
    _clxGlow(c, px, py, R * .55 * _frE(_frC(t / 500)), (1 - _frC(t / 1100)) * .55, '#B89CFF', .1);   // 残光の星雲
    _clxGlow(c, px, py, 46 * S * (1 - .6 * _frC(t / 600)), (1 - .5 * kf) * fade, CLX_GOLD);
    const k1 = _frE(_frC(t / 600)), k2 = _frE(_frC((t - 90) / 700));
    _clxRing(c, px, py, R * k1, (1 - k1) * 1.2, CLX_GOLD, 2.6 * S * (1 - .6 * k1));
    _clxRing(c, px, py, R * .78 * k2, 1 - k2, CLX_CYAN, 1.8 * S * (1 - .5 * k2));
    if (up) { const k3 = _frE(_frC((t - 200) / 850)); _clxRing(c, px, py, R * 1.35 * k3, (1 - k3) * .9, CLX_PALE, 1.4 * S); }
    const kr = _frE(_frC(t / 380)), ra = (1 - _frC(t / 700)) * .9;
    rays.forEach(r => {
      const r0 = 20 * S + R * .1 * kr, r1 = r0 + R * r.l * .55 * kr;
      _clxLine(c, px + Math.cos(r.a) * r0, py + Math.sin(r.a) * r0, px + Math.cos(r.a) * r1, py + Math.sin(r.a) * r1, ra, .7);
    });
    const ko = _frE(_frC((t - 20) / 520));
    out.forEach((q, i) => _clxStar(c, px + (q.x - px) * ko, py + (q.y - py) * ko, q.s * S * (1.3 - .5 * ko), fade * (.75 + .25 * Math.sin(e / 70 + i)), q.rot, q.col));
    _clxStar(c, px, py, 10 * S * (1 - .4 * _frC(t / 600)), fade, t / 900);
  } };
}

/* 銀河の渦。星屑が渦を巻いて px/py へ集まり、傾いた渦巻き銀河になる。中心が光り、腕が回りながら広がって消える。
   粒が多い（60〜150）ので、粒は放射グラデーションを作らない塗りの円で描く（_clxDot は使わない）。 */
function _clxGalaxy(T, up, px, py, M, S) {
  const Rg = M * Math.min(.34, .14 + .03 * T) * (up ? 1.3 : 1), arms = up ? 3 : 2;
  const P = Array.from({ length: Math.min(150, 60 + 12 * T) }, (_, i) => ({ arm: i % arms, u: Math.pow(Math.random(), .7), j: _frR(-.25, .25),
    r: _frR(.8, 1.8), col: CLX_STARCOL[i % CLX_STARCOL.length] }));
  const tilt = _frR(.45, .6);   // 傾けて楕円に見せる
  return { dur: up ? 1800 : 1550, draw(c, e) {
    const fade = e < 1000 ? 1 : _frC(1 - (e - 1000) / 550);
    const kin = _frE(_frC(e / 380)), spin = e / 900 + (1 - kin) * 2.2, grow = 1 + .35 * _frC((e - 400) / 1100);
    c.save(); c.globalCompositeOperation = 'lighter';
    P.forEach(p => {
      const a = (.35 + .65 * (1 - p.u)) * fade * (.3 + .7 * kin); if (!(a > 0)) return;
      const th = p.arm * 6.28 / arms + p.u * 3.4 + p.j + spin, r = Rg * p.u * grow * (1 + 1.4 * (1 - kin));
      c.globalAlpha = Math.min(1, a); c.fillStyle = p.col;
      c.beginPath(); c.arc(px + Math.cos(th) * r, py + Math.sin(th) * r * tilt, p.r * S, 0, 7); c.fill();
    });
    c.restore();
    const kf = _frC((e - 300) / 600);
    _clxGlow(c, px, py, Rg * (.35 + .25 * kin), (.5 + .5 * Math.sin(Math.PI * kf)) * fade, CLX_GOLD, .2);
    _clxStar(c, px, py, 9 * S * (.6 + .6 * Math.sin(Math.PI * kf)), fade, spin * .3);
    if (kf > 0 && kf < 1) _clxRing(c, px, py, Rg * 1.3 * _frE(kf), (1 - kf) * .9, CLX_PALE, 1.4 * S);
  } };
}

/* 黄道十二宮の輪（全画面・画面の中央）。正解の肢の左端から光の糸が中央へ走り、画面いっぱいの二重の輪が時計回りに描かれ、
   12の星座記号が1つずつ灯りながら輪ごと回り込んで、**今日の星座が真上**で止まる。止まった瞬間に中心の星と今日の星座が光り、輪が外へ広がる。
   TIER3〜は内側に逆回りの点の輪、段が上がった瞬間は外側の点の輪と中心からの光の筋。
   ⚠️ 記号は字形（U+2648〜2653＋U+FE0E）で描く。FE0E が無いと iOS で絵文字（色つきの四角）になる。 */
const CLX_ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(g => g + '︎');
const CLX_SYMFONT = '"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2","Noto Sans Symbols",serif';
/* 今日の星座（0＝牡羊座 … 11＝魚座）。各星座の始まりの日（年による1日のずれは無視） */
function _clxSignIdx(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  let idx = 9;   // 1/1〜1/19 は山羊座
  for (const [mm, dd, i] of [[1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 22, 3], [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 24, 7], [11, 23, 8], [12, 22, 9]])
    if (m > mm || (m === mm && day >= dd)) idx = i;
  return idx;
}
function _clxZodiac(T, up, px, py, CW, CH, M, S) {
  const cx = CW / 2, cy = CH / 2, R = M * .42, today = _clxSignIdx(new Date());
  const off = _frR(1.4, 2.2) * (Math.random() < .5 ? -1 : 1);   // 回り込んでくる量と向き
  const DRAW = 450, SETTLE = 650, hold = up ? 1450 : 1150, dur = up ? 2000 : 1700;
  const fs = Math.round(Math.max(18, R * .1));
  return { dur, draw(c, e) {
    const fade = e < hold ? 1 : _frC(1 - (e - hold) / (dur - hold));
    if (fade <= 0) return;
    // 肢の左端から中央への光の糸
    const kb = _frE(_frC(e / 220)), ab = _frC(1 - (e - 220) / 300);
    if (ab > 0) _clxLine(c, px, py, px + (cx - px) * kb, py + (cy - py) * kb, ab * .9, 1);
    const kd = _frE(_frC((e - 80) / DRAW)), kin = _frE(_frC((e - 80) / 400));
    const ks = _frE(_frC(e / SETTLE)), rot = off * (1 - ks);
    const angOf = i => -Math.PI / 2 + (i - today) * Math.PI / 6 + rot;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // 二重の輪（真上から時計回りに描く）
    const a0 = -Math.PI / 2, a1 = a0 + 6.28 * kd;
    for (const [rr, lw] of [[R, 1.6], [R * .78, 1.1]]) {
      c.strokeStyle = CLX_GOLD;
      c.globalAlpha = .22 * fade; c.lineWidth = lw * 4 * S; c.beginPath(); c.arc(cx, cy, rr, a0, a1); c.stroke();
      c.globalAlpha = .75 * fade; c.lineWidth = lw * S; c.beginPath(); c.arc(cx, cy, rr, a0, a1); c.stroke();
    }
    // 目盛り（72）と宮の仕切り（12）。輪と一緒に回る
    c.globalAlpha = .5 * kin * fade; c.strokeStyle = CLX_PALE; c.lineWidth = .8 * S; c.beginPath();
    for (let j = 0; j < 72; j++) {
      const a = angOf(0) + Math.PI / 12 + j * Math.PI / 36, l = j % 6 === 0 ? R * .22 : j % 3 === 0 ? 7 * S : 4 * S;
      c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l));
    }
    c.stroke();
    // 星座記号
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const lit = _frC((e - SETTLE) / 520);
    for (let i = 0; i < 12; i++) {
      const j = (i - today + 12) % 12;   // 真上（今日の星座）から時計回りに灯る
      const k = _frC((e - 60 - j * 28) / 180); if (k <= 0) continue;
      const a = angOf(i), x = cx + Math.cos(a) * R * .89, y = cy + Math.sin(a) * R * .89, me = i === today;
      const sz = fs * (me ? 1 + .45 * Math.sin(Math.PI * lit) : 1);
      if (me && lit > 0) _clxGlow(c, x, y, fs * 2.2, Math.sin(Math.PI * lit) * fade, CLX_GOLD, .3);
      c.globalAlpha = _frE(k) * fade * (me ? 1 : .8); c.fillStyle = me ? '#FFFFFF' : (i % 3 ? CLX_GOLD : CLX_PALE);
      c.font = `${Math.round(sz)}px ${CLX_SYMFONT}`; c.fillText(CLX_ZODIAC[i], x, y);
    }
    c.restore();
    // TIER3〜：内側の逆回りの点の輪／段が上がった瞬間：外側の点の輪
    if (T >= 3) for (let i = 0; i < 48; i++) { const a = -rot * .7 + i / 48 * 6.28; _clxDot(c, cx + Math.cos(a) * R * .66, cy + Math.sin(a) * R * .66, .8, kin * fade * .7, i % 2 ? CLX_CYAN : CLX_PALE); }
    if (up) for (let i = 0; i < 72; i++) { const a = rot * .5 + i / 72 * 6.28; _clxDot(c, cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1, .9, kin * fade * .8, i % 3 ? CLX_PALE : CLX_GOLD); }
    // 止まった瞬間
    if (lit > 0) {
      const sn = Math.sin(Math.PI * lit);
      _clxGlow(c, cx, cy, R * .35 * (.6 + .4 * _frE(lit)), sn * .9 * fade, CLX_GOLD, .2);
      _clxRing(c, cx, cy, R * (1 + .25 * _frE(lit)), (1 - lit) * fade, CLX_PALE, 1.6 * S);
      if (up) for (let i = 0; i < 12; i++) { const a = angOf(i) + Math.PI / 12; _clxLine(c, cx + Math.cos(a) * R * .2, cy + Math.sin(a) * R * .2, cx + Math.cos(a) * R * .76, cy + Math.sin(a) * R * .76, sn * .6 * fade, .6); }
    }
    _clxStar(c, cx, cy, (6 + 10 * Math.sin(Math.PI * lit)) * S, kin * fade, rot * .5);
  } };
}

/* 星の軌跡（長時間露光）。弧の色は星の色温度。2026-09-29 に超新星と重ねる形で復活（ユーザー判断）。発火位置はタップ位置のまま */
function _clxArcs(n, rMax, rMin) {
  return Array.from({ length: n }, () => ({
    r: rMin + Math.pow(Math.random(), .8) * (rMax - rMin), a0: _frR(0, 6.28), sp: _frR(.92, 1.05),
    col: CLX_STARCOL[Math.floor(Math.random() * CLX_STARCOL.length)], al: _frR(.65, 1), w: _frR(.7, 1.6) * CLX_BOLD.line }));
}
function _clxArcsDraw(c, e, x, y, arcs, sweep, dur, fadeAt, fadeLen) {
  if (e < 0) return;
  const k = _frE(_frC(e / dur)), fade = e < fadeAt ? 1 : _frC(1 - (e - fadeAt) / fadeLen);
  if (fade <= 0) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  arcs.forEach(a => {
    const a1 = a.a0 + sweep * k * a.sp;
    c.globalAlpha = a.al * fade; c.strokeStyle = a.col; c.lineWidth = a.w;
    c.beginPath(); c.arc(x, y, a.r, a.a0, a1); c.stroke();
  });
  c.restore();
  arcs.forEach(a => { const a1 = a.a0 + sweep * k * a.sp; _clxDot(c, x + Math.cos(a1) * a.r, y + Math.sin(a1) * a.r, a.w * .7, a.al * fade * .9, a.col); });
}
function _clxTrails(T, up, px, py, rMax, CW, CH, bigY) {
  const arcs = _clxArcs(Math.min(40, 12 + T * 4), rMax, 6), sweep = Math.min(1.9, .7 + T * .16);
  const big = up ? _clxArcs(70, Math.hypot(CW, CH) * .95, 14) : null;
  return { dur: up ? 2700 : 1600, draw(c, e) {
    if (big) _clxArcsDraw(c, e - 120, CW / 2, bigY, big, 1.3, 1700, 2000, 700);
    _clxArcsDraw(c, e, px, py, arcs, sweep, 950, 1050, 550);
    _clxStar(c, px, py, 6 * Math.sin(Math.PI * _frC(e / 700)), 1);
  } };
}

/* 星の網（全画面・2026-09-29 に試験演出一覧の新案 第6弾から採用）。画面の角から光が走り出し、画面いっぱいに散った星を
   近い順に線で結んで網が広がる。反対の端まで届くと網全体が金に脈打つ。段で星が細かく、TIER3〜は反対の角からシアンの網も出て
   真ん中で出会う。段が上がった瞬間は光が網を逆向きに駆け戻る。⚠️ 全画面でカードの文字に重なるので線は細く暗いまま保つ。 */
function _clxWeb(T, up, CW, CH, M, S) {
  const sp = M * Math.max(.14, .2 - .01 * Math.min(T, 6)), cols = Math.max(3, Math.round(CW / sp)), rows = Math.max(3, Math.round(CH / sp));
  const N = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++)
    N.push({ x: (q + .5 + _frR(-.38, .38)) * CW / cols, y: (r + .5 + _frR(-.38, .38)) * CH / rows, s: Math.random() < .2, d: 1e9, col: CLX_GOLD });
  // 各点から近い3点へ辺を張る（重複は1本に）
  const E = [], seen = new Set();
  N.forEach((a, i) => {
    N.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 3)
      .forEach(([j, l]) => { const key = Math.min(i, j) + '-' + Math.max(i, j); if (!seen.has(key)) { seen.add(key); E.push([i, j, l]); } });
  });
  const near = (x, y) => N.reduce((b, p, i) => Math.hypot(p.x - x, p.y - y) < Math.hypot(N[b].x - x, N[b].y - y) ? i : b, 0);
  const flip = Math.random() < .5;
  const SRC = [[near(flip ? CW : 0, 0), CLX_GOLD]].concat(T >= 3 ? [[near(flip ? 0 : CW, CH), CLX_CYAN]] : []);
  SRC.forEach(([s, col]) => { N[s].d = 0; N[s].col = col; });
  // 始点からの道のり（辺の長さの和・ベルマン–フォード。点は最大でも百に届かない）
  for (let it = 0; it < N.length; it++) E.forEach(([i, j, l]) => {
    if (N[i].d + l < N[j].d) { N[j].d = N[i].d + l; N[j].col = N[i].col; }
    if (N[j].d + l < N[i].d) { N[i].d = N[j].d + l; N[i].col = N[j].col; }
  });
  const dmax = Math.max(...N.map(p => p.d)), V = dmax / 780, tn = p => p.d / V, END = 840;
  return { dur: up ? 1950 : 1700, draw(c, e) {
    const fade = e < 1200 ? 1 : _frC(1 - (e - 1200) / (up ? 750 : 500));
    const kp = _frC((e - END) / 450), pk = Math.sin(Math.PI * kp);
    E.forEach(([i, j, l]) => {
      let a = N[i], b = N[j]; if (tn(b) < tn(a)) [a, b] = [b, a];
      const k = _frC((e - tn(a)) / (l / V)); if (k <= 0) return;
      const bk = up ? Math.exp(-Math.pow((e - END - 250 - (780 - tn(b)) * .6) / 90, 2)) : 0;
      _clxLine(c, a.x, a.y, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, (.2 + .28 * pk + .5 * bk) * fade, .45 + .2 * pk);
    });
    N.forEach((p, i) => {
      if (e < tn(p)) return;
      const fl = Math.exp(-(e - tn(p)) / 180), col = fl > .3 ? CLX_PALE : p.col;
      if (p.s) { _clxGlow(c, p.x, p.y, (14 + 22 * fl) * S, (.2 + .9 * fl + .3 * pk) * fade, p.col); _clxStar(c, p.x, p.y, (3.5 + 2 * fl + 1.2 * pk) * S, fade, e / 1500 + i, col); }
      else _clxDot(c, p.x, p.y, (1.2 + 1.4 * fl + .5 * pk) * S, (.7 + fl) * fade, col);
    });
  } };
}

/* 天球の経緯線（2026-09-29 に試験演出一覧の新案 第4弾から採用）。正解の肢の左端（縦は中央）を中心に、経線と緯線の球が
   描き上がりながらゆっくり回る。描き上がると交点が1つずつ金に灯り（照準の輪が縮んで止まる）、最後に外周の輪が広がる。
   段で球が大きく・灯る交点が増える（段が上がった瞬間は＋2・球1.2倍）。裏側の線は薄く描く。 */
function _clxGrid(T, up, px, py, M, S) {
  const R = M * Math.min(.3, .14 + .02 * T) * (up ? 1.2 : 1), EPS = .42, PSI = -.3, LOCK = 420;
  const cE = Math.cos(EPS), sE = Math.sin(EPS), cP = Math.cos(PSI), sP = Math.sin(PSI);
  const proj = (b, l, e) => {
    const ll = l + .4 + e / 1400, x = Math.cos(b) * Math.sin(ll), y = Math.sin(b), z = Math.cos(b) * Math.cos(ll);
    const y2 = y * cE - z * sE, z2 = y * sE + z * cE, sx = R * x, sy = -R * y2;
    return { x: px + sx * cP - sy * sP, y: py + sx * sP + sy * cP, z: z2 };
  };
  const MER = Array.from({ length: 6 }, (_, i) => i * Math.PI / 6), PAR = [-60, -30, 0, 30, 60].map(d => d * Math.PI / 180);
  const want = Math.min(7, T) + (up ? 2 : 0), LP = [];
  for (let tries = 0; tries < 200 && LP.length < want; tries++) {
    const b = PAR[Math.floor(Math.random() * PAR.length)], l = MER[Math.floor(Math.random() * MER.length)] + (Math.random() < .5 ? 0 : Math.PI);
    if (proj(b, l, LOCK + 300).z < .25 || LP.some(q => q.b === b && q.l === l)) continue;   // 灯るときに表側にある交点だけ
    LP.push({ b, l, t0: LOCK + LP.length * 70 });
  }
  const curve = (c, e, pts, kd, fade) => {
    if (kd <= 0) return;
    const m = Math.max(2, Math.floor(pts.length * kd));
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const front of [false, true]) {
      c.beginPath(); let on = false;
      for (let i = 0; i < m; i++) {
        const q = proj(pts[i][0], pts[i][1], e);
        if ((q.z > 0) === front) { if (!on) { c.moveTo(q.x, q.y); on = true; } else c.lineTo(q.x, q.y); } else on = false;
      }
      c.globalAlpha = (front ? .28 : .08) * fade; c.strokeStyle = CLX_GOLD; c.lineWidth = 4 * S; c.stroke();
      c.globalAlpha = (front ? .9 : .25) * fade; c.strokeStyle = CLX_PALE; c.lineWidth = 1.1 * S; c.stroke();
    }
    c.restore();
  };
  const NS = 48;
  const MP = MER.map(l => Array.from({ length: NS + 1 }, (_, i) => [-Math.PI / 2 + Math.PI * i / NS, l])
    .concat(Array.from({ length: NS + 1 }, (_, i) => [Math.PI / 2 - Math.PI * i / NS, l + Math.PI])));
  const PP = PAR.map(b => Array.from({ length: NS * 2 + 1 }, (_, i) => [b, 2 * Math.PI * i / (NS * 2)]));
  return { dur: up ? 1850 : 1600, draw(c, e) {
    const fade = e < 1100 ? 1 : _frC(1 - (e - 1100) / 500);
    _clxGlow(c, px, py, R * 1.15, .22 * fade * _frC(e / 200), '#8FA8FF', .5);
    MP.forEach((p, i) => curve(c, e, p, _frE(_frC((e - i * 25) / 330)), fade));
    PP.forEach((p, i) => curve(c, e, p, _frE(_frC((e - 60 - i * 30) / 330)), fade));
    _clxRing(c, px, py, R, .9 * fade * _frC(e / 250), CLX_GOLD, 1.8 * S);
    LP.forEach((q, i) => {
      const k = _frC((e - q.t0) / 260); if (k <= 0) return;
      const p = proj(q.b, q.l, e), ka = _frE(k);
      _clxRing(c, p.x, p.y, 7 * S * (1 + 3 * (1 - ka)), ka * fade, CLX_GOLD, 1.4 * S);
      _clxStar(c, p.x, p.y, 5 * S * (k < 1 ? 1.5 - .5 * ka : 1 + .2 * Math.sin(e / 70 + i)), ka * fade, e / 800);
    });
    const kf = _frC((e - LOCK - 70 * LP.length) / 600);
    if (kf > 0) { _clxRing(c, px, py, R * (1 + .6 * _frE(kf)), (1 - kf) * 1.1, CLX_PALE, 2 * S * (1 - .6 * kf)); _clxGlow(c, px, py, 40 * S, Math.sin(Math.PI * kf), CLX_GOLD); }
    _clxStar(c, px, py, 7 * S, fade, e / 900);
  } };
}

/* 超新星／銀河の渦に重ねる4つ。**正解のたびに**この中から1つを抽選する（セッションで固定しない・ユーザー指定 2026-09-29）。 */
const CLX_EXTRAS = ['trails', 'zodiac', 'web', 'grid'];
let _clxSessionPick = null;   // 'nova' | 'galaxy'。startExam で抽選し、そのセッション中は変えない
function _clxCelestialFx(el, card, tier, promoted, budget) {
  if (!el || !card || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const w = er.width, h = er.height;
  const CW = window.innerWidth, CH = window.innerHeight;
  if (!CW || !CH) return;
  const T = Math.max(1, tier), up = promoted && tier >= 2;
  const M = Math.min(CW, CH), S = _frC(M / 480, 1, 2), D = Math.hypot(CW, CH);
  // 超新星／銀河の渦は肢の左端（縦は中央）で毎回。そこに4つ（星の軌跡＝タップ位置・黄道十二宮の輪＝画面の中央・
  // 星の網＝全画面・天球の経緯線＝肢の左端）から正解のたびに1つを抽選して重ねる
  const ex = CLX_EXTRAS[Math.floor(Math.random() * CLX_EXTRAS.length)];
  let extra;
  if (ex === 'trails') {
    let lx = w * .42, ly = h / 2;   // タップ位置（無ければ肢の左寄り）
    const pt = _lqPtr;
    if (pt && pt.el === el && performance.now() - pt.t < 2000) { lx = w * pt.fx; ly = h * pt.fy; }
    const tx = er.left + lx, ty = er.top + ly;
    extra = _clxTrails(T, up, tx, ty, Math.min(D * .75, D * (.3 + .06 * T)), CW, CH, _frC(ty, CH * .3, CH * .7));
  } else if (ex === 'zodiac') extra = _clxZodiac(T, up, er.left, er.top + h / 2, CW, CH, M, S);
  else if (ex === 'web') extra = _clxWeb(T, up, CW, CH, M, S);
  else extra = _clxGrid(T, up, er.left, er.top + h / 2, M, S);
  const parts = [
    extra,
    (_clxSessionPick || (_clxSessionPick = Math.random() < .5 ? 'nova' : 'galaxy')) === 'galaxy'
      ? _clxGalaxy(T, up, er.left, er.top + h / 2, M, S)
      : _clxNova(T, up, er.left, er.top + h / 2, CW, CH, M, S),
  ];
  const dur = Math.max(...parts.map(p => p.dur));
  const drawAll = (c, e) => parts.forEach(p => p.draw(c, e));
  _rfFit(budget, dur + 50);

  // ① 肢の層（画面の座標をずらして同じ絵を描く・送りまでに終える）
  const L = _lqLayer(el);
  const c1 = _frCtx(L, w, h);
  _frRun(c1, w, h, dur, (c, e) => { c.save(); c.translate(-er.left, -er.top); drawAll(c, e); c.restore(); });
  _lqDrop(el, L, dur + 50);
  // ② 全画面の層（ラボの尺のまま）
  _rfK = 1;
  const H = _rfFullHost(dur + 50);
  const C = _lqLayer(H, 'fr-card');
  const c2 = _frCtx(C, CW, CH, 0, 1.5);
  _frRun(c2, CW, CH, dur, drawAll);
  _lqDrop(H, C, dur + 50);
}

/* ══════════ Abyss：ソナーの反響（2026-09-29）══════════
   試験演出一覧（_work/fx_all_demo.html「abyss 正解演出の新案」の B）でユーザーが採用。旧 MecFX.abyssSonarPulse
   （エメラルドの閃光＋波紋＋マリンスノー）と段4〜の輪3本（MecFX.rings）は正解演出から外した（結果画面では今も使う）。
   - 正解の肢の左端（縦は中央）でピンが鳴って輪が走り、目盛りの円3本と十字が浮かぶ。
   - 光の扇が0.9秒で1周し、通った所の反射点が次々に光って小さな輪を出す。
   - 0.72秒から反響が外周から中心へ戻り、着いた瞬間にもう一度光って深度（連続数×100 m＝連続数の表示の DEPTH と同じ数）が出る。
   - 段で探知の範囲（画面の短辺×0.41→最大0.75）と反射点（6→最大16）が増える。段が上がった瞬間は1.2倍・逆回りの扇がもう1本・反射点＋6。
   ⚠️ 描き方は celestial と同じ2層（肢の層は送る前に縮めて終わる／全画面の層は元の尺）。泡・全画面の閃光は使わない。
   同日、全画面の「ホタルイカの群れ」（_abySquid・新案 第3弾⑦）を毎回重ねることにした（ユーザー判断）。 */
const ABY_EM = '#00FFA3', ABY_CY = '#00E5FF', ABY_DC = '#00B4D8', ABY_BIO = '#64FFDA', ABY_PALE = '#D8FFF1';
// 描画の小道具。どれも呼ぶ側で globalCompositeOperation = 'lighter' にしてある（_abyAbyssFx）
function _abyGlow(c, x, y, r, a, col) {
  if (!(a > 0) || !(r > 0)) return;
  c.globalAlpha = Math.min(1, a);
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, _clxRgba(ABY_PALE, 1)); g.addColorStop(.28, _clxRgba(col, .7)); g.addColorStop(1, _clxRgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
function _abyRing(c, x, y, r, a, col, lw) {
  if (!(a > 0) || !(r > 0)) return;
  c.strokeStyle = col;
  c.globalAlpha = Math.min(1, a) * .3; c.lineWidth = lw * 4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.globalAlpha = Math.min(1, a); c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
}
function _abyDot(c, x, y, r, a, col) {
  if (!(a > 0) || !(r > 0)) return;
  c.fillStyle = col;
  c.globalAlpha = Math.min(1, a) * .28; c.beginPath(); c.arc(x, y, r * 2.8, 0, 7); c.fill();
  c.globalAlpha = Math.min(1, a); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
/* ソナーの反響。px/py＝発火位置（画面の座標）・M＝画面の短辺・S＝線の倍率・n＝連続数 */
function _abySonar(T, up, px, py, M, S, n) {
  const R = M * Math.min(.75, .36 + .05 * T) * (up ? 1.2 : 1);
  const nb = Math.min(16, 4 + 2 * T) + (up ? 6 : 0), a0 = -Math.PI / 2, SW = 900, dur = up ? 2100 : 1800;
  const bl = Array.from({ length: nb }, () => {
    const a = _frR(0, 6.28), d = _frR(.3, .95) * R;
    return { ra: ((a - a0) % 6.28 + 6.28) % 6.28, x: px + Math.cos(a) * d, y: py + Math.sin(a) * d };
  });
  const sweeps = up ? [1, -1] : [1];
  return { dur, draw(c, e) {
    const fade = e < dur - 500 ? 1 : _frC((dur - e) / 500), kg = _frE(_frC(e / 300));
    for (let i = 1; i <= 3; i++) _abyRing(c, px, py, R * i / 3 * kg, .3 * fade, ABY_DC, 1 * S);   // 目盛り
    c.globalAlpha = .22 * fade; c.strokeStyle = ABY_DC; c.lineWidth = 1 * S; c.beginPath();
    c.moveTo(px - R * kg, py); c.lineTo(px + R * kg, py); c.moveTo(px, py - R * kg); c.lineTo(px, py + R * kg); c.stroke();
    const kp = _frC(e / 520);   // ピン
    _abyGlow(c, px, py, (26 + 40 * (1 - kp)) * S, (1.2 - .6 * kp) * fade, ABY_EM);
    _abyRing(c, px, py, R * _frE(kp), (1 - kp) * 1.2, ABY_EM, 2.6 * S * (1 - .5 * kp));
    const sw = Math.min(e / SW, 1) * 6.28;   // 掃引（光の扇が1周）
    if (e < SW + 250) sweeps.forEach(dir => {
      const ang = a0 + dir * sw, ka = e < SW ? 1 : _frC(1 - (e - SW) / 250);
      for (let k = 0; k < 14; k++) {
        const a1 = ang - dir * k * .06, a2 = a1 - dir * .06;
        c.globalAlpha = .26 * (1 - k / 14) * ka * fade; c.fillStyle = k < 2 ? ABY_BIO : ABY_EM;
        c.beginPath(); c.moveTo(px, py); c.arc(px, py, R, Math.min(a1, a2), Math.max(a1, a2)); c.closePath(); c.fill();
      }
      c.globalAlpha = .9 * ka * fade; c.strokeStyle = ABY_PALE; c.lineWidth = 1.6 * S;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(ang) * R, py + Math.sin(ang) * R); c.stroke();
    });
    bl.forEach(b => {   // 反射点：掃引が通ったときに光って小さな輪を出す
      let tb = Infinity;
      sweeps.forEach(dir => { const ra = dir > 0 ? b.ra : (6.28 - b.ra) % 6.28; if (sw >= ra) tb = Math.min(tb, e - ra / 6.28 * SW); });
      if (!isFinite(tb)) return;
      const kb = _frC(tb / 500), br = Math.exp(-tb / 700);
      _abyGlow(c, b.x, b.y, 14 * S, br * 1.1 * fade, ABY_EM);
      _abyDot(c, b.x, b.y, 2 * S, br * 1.2 * fade, ABY_PALE);
      _abyRing(c, b.x, b.y, 18 * S * _frE(kb), (1 - kb) * .9 * fade, ABY_BIO, 1.2 * S);
    });
    const kr = _frC((e - 720) / 450);   // 反響が戻る
    if (kr > 0 && kr < 1) _abyRing(c, px, py, R * (1 - _clxEio(kr)), .9 * fade, ABY_CY, 2 * S);
    const kh = _frC((e - 1170) / 520);
    if (kh > 0) {
      _abyGlow(c, px, py, 80 * S * _frE(kh), Math.sin(Math.PI * kh) * 1.2, ABY_CY);
      _abyRing(c, px, py, R * .5 * _frE(kh), (1 - kh) * 1.1, ABY_PALE, 1.8 * S);
      c.globalAlpha = _frC(kh * 4) * fade; c.fillStyle = ABY_EM; c.textBaseline = 'bottom';
      c.font = '700 ' + Math.round(13 * S) + 'px ui-monospace,Consolas,monospace';
      c.fillText('▼ ' + (Math.max(1, n) * 100) + ' m', px + 12 * S, py - 10 * S);
    }
  } };
}
/* ホタルイカの群れ（2026-09-29・試験演出一覧の新案 第3弾⑦からユーザーが採用・ソナーの反響に重ねる）。
   全画面：画面の左下から右上へ、青い発光器を瞬かせたホタルイカの群れが噴射しながら泳ぎ、0.62秒で一斉に青く光る。
   段で群れが大きくなる（19→最大40匹）。段が上がった瞬間は右からもう一群（14匹）が逆向きに泳ぐ。
   ⚠️ 全画面の層にだけ描く（肢の層には描かない＝肢の左端から始まる絵ではないため）。 */
const ABY_BLUE = '#3D9BFF';
function _abySquid(T, up, CW, CH, S) {
  const dur = up ? 2300 : 2000, n = Math.min(40, 14 + 5 * T) + (up ? 14 : 0), SYNC = 620;
  const Q = Array.from({ length: n }, (_, i) => {
    const back = up && i >= n - 14;
    return { x0: back ? _frR(CW * .6, CW * 1.1) : _frR(-CW * .2, CW * .5), y0: _frR(CH * .5, CH * 1.1),
      vx: (back ? -1 : 1) * _frR(.18, .32) * CW, vy: -_frR(.2, .35) * CH, ph: _frR(0, 6.28), s: _frR(.8, 1.3) * S, bl: _frR(0, 6.28) };
  });
  return { dur, draw(c, e) {
    const fade = e < dur - 550 ? 1 : _frC((dur - e) / 550), t = e / 1000, sync = Math.exp(-Math.pow((e - SYNC) / 90, 2));   // sync＝一斉に光る
    Q.forEach(q => {
      const jet = t + .08 * Math.sin(t * 9 + q.ph);   // 噴射で進む
      const x = q.x0 + q.vx * jet, y = q.y0 + q.vy * jet + Math.sin(t * 3 + q.ph) * 10 * S, s = q.s;
      c.save(); c.translate(x, y); c.rotate(Math.atan2(q.vy, q.vx));
      c.globalAlpha = .35 * fade; c.fillStyle = ABY_BIO; c.beginPath(); c.ellipse(0, 0, 9 * s, 2.8 * s, 0, 0, 7); c.fill();   // 外套
      c.strokeStyle = ABY_BIO; c.lineWidth = .9 * s; c.globalAlpha = .4 * fade;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-8 * s, k * .8 * s); c.lineTo(-15 * s, k * 1.6 * s + Math.sin(e / 80 + k) * s); c.stroke(); }   // 腕
      const blink = Math.max(sync * 1.4, Math.sin(e / 140 + q.bl) > .6 ? .9 : .25);
      if (sync > .05) _abyGlow(c, 0, 0, 16 * s, sync * .8 * fade, ABY_BLUE);
      [[5, 0], [-1, -1.4], [-1, 1.4], [-6, 0]].forEach(([ax, ay], k) => _abyDot(c, ax * s, ay * s, (k ? 1.1 : 1.5) * s, blink * fade, k % 2 ? ABY_BLUE : ABY_CY));
      c.restore();
    });
  } };
}
function _abyAbyssFx(el, card, tier, promoted, budget) {
  if (!el || !card || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const w = er.width, h = er.height;
  const CW = window.innerWidth, CH = window.innerHeight;
  if (!CW || !CH) return;
  const M = Math.min(CW, CH), S = _frC(M / 480, 1, 2), T = Math.max(1, tier), up = promoted && tier >= 2;
  const p = _abySonar(T, up, er.left, er.top + h / 2, M, S, examStreak);
  const sq = _abySquid(T, up, CW, CH, S);
  const lit = (c, fn) => { c.save(); c.globalCompositeOperation = 'lighter'; try { fn(); } finally { c.restore(); } };
  _rfFit(budget, p.dur + 50);
  // ① 肢の層（ソナーだけ・画面の座標をずらして同じ絵を描く・送りまでに終える）
  const L = _lqLayer(el);
  const c1 = _frCtx(L, w, h);
  _frRun(c1, w, h, p.dur, (c, e) => lit(c, () => { c.translate(-er.left, -er.top); p.draw(c, e); }));
  _lqDrop(el, L, p.dur + 50);
  // ② 全画面の層（ソナー＋ホタルイカの群れ・ラボの尺のまま）
  _rfK = 1;
  const dur = Math.max(p.dur, sq.dur);
  const H = _rfFullHost(dur + 50);
  const C = _lqLayer(H, 'fr-card');
  const c2 = _frCtx(C, CW, CH, 0, 1.5);
  _frRun(c2, CW, CH, dur, (c, e) => lit(c, () => { if (e < p.dur) p.draw(c, e); sq.draw(c, e); }));
  _lqDrop(H, C, dur + 50);
}

/* ══════════ Brass：歯車列＋刻印＋鋳込みの唐草（2026-09-26）══════════
   デモ（brass 正解演出ラボの案A・C・D）でユーザーが採用。旧 brassClockworkBurst（全画面の金の閃光・飛び散る歯車・
   天球儀の輪と時計盤・輪4＋衝撃波3・画面全体の蒸気20と粉38・火花 36＋外でもう一度 18＋6×段）を置き換えた。
   - 歯車列：タップ位置に駆動歯車がはまり、左右へ1枚ずつ噛み合って連なり、歯数比どおり（隣は逆回り）に回る。
            枚数は 2＋段（最大9）。TIER3〜は歯車が大きくなりカードまで連なる。噛み合った瞬間に接点から火花が数粒。
   - 刻印：肢の右端に「MEC」の楕円の刻印が打たれ、白熱 → 橙 → 真鍮色へ冷える。左に紙面の問題番号（No.0214）。
            段の数だけ星、TIER2〜は月桂樹の葉。TIER3〜は肢からはみ出す大きさ。
   - 唐草：タップ位置から斜め4方向へ溶けた真鍮の蔓が伸びて渦を巻き、冷えて固まる（十字の飾り＝フルーロン）。
   - 段が上がった瞬間：大きな歯車列がカードの裏を横切り、カードの中央にローマ数字のメダルが打刻され、
            四隅から唐草の飾り金具が鋳込まれて斜めの光沢が走る。
   ⚠️ 肢の中を横に走る長い線を作らないこと（唐草の初版が肢の文字の取り消し線・下線に見えた＝ラボで踏んだ）。
      下線部はこの教材では意味を持つ記号（Phase 5 の R6 と同じ理由）。
   ⚠️ 描くのはカードの裏1枚だけ（.lq-layer.fr-card）。brass の肢の地は半透明なので、frost・celestial のように
      肢の層へ二重に描く必要がない（二重に描くと肢の中だけ半透明の絵が濃くなる）。
   ⚠️ 文字の上に出るのは火花（MecFX.sparks・数粒）だけ。位置は発火の瞬間にカードから測り直す
      （正解の直後に次のカードへ自動スクロールするので、最初に測った画面座標は使えない）。 */
const BRS_BRASS = '#E0C25E', BRS_DARK = '#8C6D1F', BRS_PALE = '#FFF3C4', BRS_AMBER = '#FFA040';
const BRS_SERIF = 'Georgia, "Times New Roman", serif', BRS_MONO = 'ui-monospace, Menlo, Consolas, monospace';
const BRS_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const BRS_MIN_H = 44;
const _brsEio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const _brsBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
/* 冷えていく金属の色（0＝白熱 → 1＝真鍮） */
const BRS_HEAT = [[0, [255, 255, 255]], [.1, [255, 241, 184]], [.28, [255, 179, 71]], [.48, [232, 112, 42]], [.68, [181, 84, 28]], [1, [224, 194, 94]]];
function _brsHeat(k, a) {
  k = _frC(k); if (a == null) a = 1;
  for (let i = 1; i < BRS_HEAT.length; i++) if (k <= BRS_HEAT[i][0]) {
    const [k0, c0] = BRS_HEAT[i - 1], [k1, c1] = BRS_HEAT[i], u = (k - k0) / (k1 - k0);
    return `rgba(${c0.map((v, j) => Math.round(v + (c1[j] - v) * u)).join(',')},${a})`;
  }
  return `rgba(224,194,94,${a})`;
}
function _brsHexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function _brsGlow(c, x, y, r, a) {
  if (!(a > 0)) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,175,65,${a})`); g.addColorStop(1, 'rgba(255,115,30,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
}

/* ── 歯車 ── */
const BRS_PITCH = 5.4, BRS_DEPTH = 2.9;
const _brsTeeth = r => Math.max(8, Math.round(Math.PI * 2 * r / BRS_PITCH));
function _brsGearShape(c, r, n, hole) {
  const ri = r - BRS_DEPTH, s = Math.PI * 2 / n;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = i * s;
    [[a0, ri], [a0 + s * .2, ri], [a0 + s * .32, r], [a0 + s * .58, r], [a0 + s * .7, ri]].forEach(([a, rr], j) => {
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (i === 0 && j === 0) c.moveTo(x, y); else c.lineTo(x, y);
    });
  }
  c.closePath();
  c.moveTo(hole, 0); c.arc(0, 0, hole, 0, Math.PI * 2, true);
}
function _brsDrawGear(c, x, y, r, n, rot, a, sc, outline) {
  if (!(a > 0) || !(sc > 0)) return;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(rot); c.globalAlpha = _frC(a);
  const hole = Math.max(1.6, r * .16);
  _brsGearShape(c, r, n, hole);
  if (outline) { c.strokeStyle = BRS_BRASS; c.lineWidth = 1.2; c.stroke(); }
  else {
    const g = c.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#FFEFB0'); g.addColorStop(.35, BRS_BRASS); g.addColorStop(.72, BRS_DARK); g.addColorStop(1, '#4A370C');
    c.fillStyle = g; c.fill('evenodd');
    c.strokeStyle = 'rgba(40,26,6,.85)'; c.lineWidth = .8; c.stroke();
  }
  if (r >= 13) {   // 肉抜き（スポークの窓）
    const k = r >= 30 ? 6 : 5, r1 = r * .34, r2 = r - BRS_DEPTH - Math.max(2.4, r * .14), span = Math.PI * 2 / k * .6;
    c.fillStyle = 'rgba(14,9,3,.92)';
    c.strokeStyle = outline ? _brsHexA(BRS_BRASS, .7) : 'rgba(255,239,176,.25)'; c.lineWidth = .7;
    for (let i = 0; i < k; i++) {
      const a0 = i / k * Math.PI * 2 + (Math.PI * 2 / k - span) / 2;
      c.beginPath(); c.arc(0, 0, r2, a0, a0 + span); c.arc(0, 0, r1, a0 + span, a0, true); c.closePath();
      if (!outline) c.fill();
      c.stroke();
    }
  }
  c.beginPath(); c.arc(0, 0, hole + 1.4, 0, Math.PI * 2); c.strokeStyle = outline ? BRS_BRASS : 'rgba(255,243,196,.8)'; c.lineWidth = 1; c.stroke();
  c.restore();
}
/* 親の位相から子の位相を決める（親の歯が子の溝に入る）。回しても噛み合いが保たれる */
function _brsMesh(par, ch, parPhase) {
  const sa = Math.PI * 2 / par.n, sb = Math.PI * 2 / ch.n;
  const u = parPhase + .45 * sa - ch.theta;
  return ch.theta + Math.PI - u * (par.n / ch.n) - .95 * sb;
}
function _brsPhases(G, p0) {
  const ph = [p0];
  for (let i = 1; i < G.length; i++) ph[i] = _brsMesh(G[G[i].parent], G[i], ph[G[i].parent]);
  return ph;
}
function _brsGearTrain(T, px, py, lo, CW, spark) {
  const big = T >= 3, count = Math.min(9, 2 + T);
  const rMax = Math.min(lo.h * .42, 17), r0 = big ? 16 + T * 1.6 : rMax;
  const root = { x: px, y: _frC(py, lo.t + 6, lo.t + lo.h - 6), r: r0, n: _brsTeeth(r0), depth: 0, theta: 0 };
  const G = [root], tips = { R: 0, L: 0 };
  for (let i = 1; i < count; i++) {
    const side = i % 2 ? 1 : -1, key = side > 0 ? 'R' : 'L', pi = tips[key], par = G[pi];
    const r = big ? _frR(.55, 1.15) * r0 : rMax * _frR(.62, .95);
    const spread = big ? .75 : .3, theta = (side > 0 ? 0 : Math.PI) + _frR(-spread, spread);
    const d = par.r + r - BRS_DEPTH * .95, x = par.x + Math.cos(theta) * d, y = par.y + Math.sin(theta) * d;
    if (!big && (x - r < lo.l + 6 || x + r > lo.l + lo.w - 4 || y - r < lo.t - 3 || y + r > lo.t + lo.h + 3)) continue;
    if (big && (x < -r * .3 || x > CW + r * .3)) continue;
    G.push({ x, y, r, theta, n: _brsTeeth(r), parent: pi, depth: par.depth + 1 });
    tips[key] = G.length - 1;
  }
  const STEP = 75, turn = (.55 + T * .1) * Math.PI * 2, dur = 1150 + G.length * STEP;
  G.forEach(g => {
    if (g.parent == null) return;
    const par = G[g.parent];
    spark(par.x + Math.cos(g.theta) * (par.r - BRS_DEPTH / 2), par.y + Math.sin(g.theta) * (par.r - BRS_DEPTH / 2), 2 + (T >= 4 ? 1 : 0), g.depth * STEP + 90);
  });
  return { dur: dur + 450, draw(c, e) {
    const fade = e < dur ? 1 : _frC(1 - (e - dur) / 450);
    _brsGlow(c, root.x, root.y, r0 * 2.6, .34 * Math.sin(Math.PI * _frC(e / 500)) * fade);
    const ph = _brsPhases(G, turn * _brsEio(_frC(e / (dur - 150))));
    G.forEach((g, i) => { const ki = _frC((e - g.depth * STEP) / 240); _brsDrawGear(c, g.x, g.y, g.r, g.n, ph[i], _frE(ki) * .95 * fade, _brsBack(ki)); });
  } };
}
function _brsBigTrain(CW, y) {
  const r0 = Math.min(CW * .13, 70), root = { x: -r0 * .15, y, r: r0, n: _brsTeeth(r0), depth: 0, theta: 0 };
  const G = [root]; let par = root;
  for (let i = 1; i < 7; i++) {
    const r = r0 * [0, .62, 1.05, .55, .95, .7, 1][i], theta = _frR(-.55, .55), d = par.r + r - BRS_DEPTH * .95;
    const g = { r, theta, n: _brsTeeth(r), parent: G.length - 1, depth: i, x: par.x + Math.cos(theta) * d, y: par.y + Math.sin(theta) * d };
    G.push(g); par = g; if (g.x - g.r > CW) break;
  }
  return { dur: 2600, draw(c, e) {
    const fade = e < 2000 ? 1 : _frC(1 - (e - 2000) / 600);
    const ph = _brsPhases(G, Math.PI * 1.1 * _brsEio(_frC(e / 2400)));
    G.forEach((g, i) => { const ki = _frC((e - 120 - i * 90) / 320); _brsDrawGear(c, g.x, g.y, g.r, g.n, ph[i], _frE(ki) * .5 * fade, .85 + .15 * _brsBack(ki), true); });
  } };
}

/* ── 刻印 ── */
function _brsLaurel(c, rx, ry, count, col) {
  for (const s of [-1, 1]) for (let i = 0; i < count; i++) {
    const an = Math.PI / 2 + s * (.35 + i * .32), x = Math.cos(an) * (rx + 7), y = Math.sin(an) * (ry + 6);
    c.save(); c.translate(x, y); c.rotate(an + s * Math.PI / 2 + s * .5);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 4.2, 1.7, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
}
function _brsHallmarkShape(c, x, y, rx, ry, T, col, a) {
  c.save(); c.translate(x, y); c.globalAlpha = _frC(a);
  const body = (dx, dy, cc) => {
    c.save(); c.translate(dx, dy); c.strokeStyle = cc; c.fillStyle = cc;
    c.lineWidth = 1.7; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = .8; c.beginPath(); c.ellipse(0, 0, rx - 3, ry - 3, 0, 0, Math.PI * 2); c.stroke();
    c.font = `700 ${Math.round(ry * .78)}px ${BRS_SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('MEC', 0, -ry * .1);
    const k = Math.min(7, T), sp = Math.min(5.5, (rx * 1.1) / Math.max(1, k));
    for (let i = 0; i < k; i++) { const sx = (i - (k - 1) / 2) * sp, sy = ry * .52; c.beginPath(); c.moveTo(sx, sy - 1.8); c.lineTo(sx + 1.3, sy); c.lineTo(sx, sy + 1.8); c.lineTo(sx - 1.3, sy); c.closePath(); c.fill(); }
    if (T >= 2) _brsLaurel(c, rx, ry, Math.min(5, T), cc);
    c.restore();
  };
  body(.9, .9, 'rgba(10,6,2,.9)');          // 彫りの影
  body(-.6, -.6, 'rgba(255,243,196,.45)');   // 縁の光
  body(0, 0, col);
  c.restore();
}
function _brsHallmark(T, lo, serial, spark, press) {
  const big = T >= 3, rx = big ? 26 + T * 2.2 : 20 + T * 1.2, ry = big ? 15 + T * 1.3 : Math.min(lo.h * .3, 13) + T * .4;
  const hx = lo.l + lo.w - rx - (T >= 2 ? 18 : 12), hy = lo.t + lo.h / 2, HIT = 110;
  spark(hx, hy - ry * .3, Math.round(4 + T * 1.2), HIT);
  press(HIT, false);
  return { dur: 1900, draw(c, e) {
    const fade = e < 1450 ? 1 : _frC(1 - (e - 1450) / 450);
    if (e < HIT) {   // 型の影が近づく
      const k = e / HIT; c.fillStyle = `rgba(0,0,0,${.45 * k})`;
      c.beginPath(); c.ellipse(hx + 3 * (1 - k), hy + 3 * (1 - k), rx * (1.5 - .5 * k), ry * (1.5 - .5 * k), 0, 0, Math.PI * 2); c.fill(); return;
    }
    const k = _frC((e - HIT) / 1000), ks = _frC((e - HIT) / 320);
    _brsGlow(c, hx, hy, rx * 1.6, .45 * (1 - k) * fade);
    if (ks < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,220,140,${.7 * (1 - ks)})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(hx, hy, rx * (1 + ks * .8), ry * (1 + ks * .8), 0, 0, Math.PI * 2); c.stroke(); c.restore(); }
    _brsHallmarkShape(c, hx, hy, rx, ry, T, _brsHeat(k), fade);
    const nch = Math.floor(_frC((e - HIT - 180) / 45, 0, serial.length));   // 番号を1文字ずつ打つ
    if (nch > 0) {
      c.save(); c.globalAlpha = fade * .9; c.font = `500 11px ${BRS_MONO}`; c.fillStyle = _brsHeat(_frC(k * 1.3 + .2));
      c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(serial.slice(0, nch), hx - rx - (T >= 2 ? 16 : 8), hy); c.restore();
    }
  } };
}
function _brsMedallion(tier, CW, CH, my, spark, press) {
  const R = Math.min(CW * .33, CH * .38, 150), mx = CW / 2, HIT = 300;
  spark(mx, my - R, 10, HIT);
  press(HIT, true);
  const txt = 'CERTIFIED · CORRECT · CERTIFIED · CORRECT · ';
  const shape = (c, col, rot) => {
    const draw = (dx, dy, cc) => {
      c.save(); c.translate(mx + dx, my + dy); c.strokeStyle = cc; c.fillStyle = cc;
      c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
      c.lineWidth = .9; c.beginPath(); c.arc(0, 0, R * .78, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, 0, R * .96, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 48; i++) { const an = i / 48 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(an) * R * .96, Math.sin(an) * R * .96); c.lineTo(Math.cos(an) * R, Math.sin(an) * R); c.stroke(); }
      c.font = `700 ${Math.round(R * .1)}px ${BRS_SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < txt.length; i++) { c.save(); c.rotate(rot + i / txt.length * Math.PI * 2); c.fillText(txt[i], 0, -R * .87); c.restore(); }
      c.font = `700 ${Math.round(R * .5)}px ${BRS_SERIF}`; c.fillText(BRS_ROMAN[tier] || String(tier), 0, R * .02);
      c.font = `500 ${Math.round(R * .1)}px ${BRS_SERIF}`; c.fillText('TIER', 0, R * .45);
      c.restore();
    };
    draw(1.2, 1.2, 'rgba(10,6,2,.85)'); draw(-.7, -.7, 'rgba(255,243,196,.4)'); draw(0, 0, col);
  };
  return { dur: 2900, draw(c, e) {
    const fade = e < 2250 ? .62 : _frC(1 - (e - 2250) / 650) * .62;
    if (e < HIT) { const k = e / HIT; c.fillStyle = `rgba(0,0,0,${.35 * k})`; c.beginPath(); c.arc(mx + 5 * (1 - k), my + 5 * (1 - k), R * (1.4 - .4 * k), 0, Math.PI * 2); c.fill(); return; }
    const k = _frC((e - HIT) / 1400), ks = _frC((e - HIT) / 520);
    if (ks < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,220,140,${.6 * (1 - ks)})`; c.lineWidth = 2.5; c.beginPath(); c.arc(mx, my, R * (1 + ks * .5), 0, Math.PI * 2); c.stroke(); c.restore(); }
    c.save(); c.globalAlpha = fade; shape(c, _brsHeat(k), -.3 + e / 9000); c.restore();
  } };
}

/* ── 鋳込みの唐草 ── */
function _brsVine(x, y, dir, len, amp, curlR, turns, t0, speed, w0, bend) {
  const P = []; let s = 0, px = x, py = y;
  const ux = Math.cos(dir), uy = Math.sin(dir), nx = -uy, ny = ux;
  const steps = Math.max(8, Math.round(len / 3));
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, off = Math.sin(u * Math.PI * 1.5) * amp * bend;
    const qx = x + ux * len * u + nx * off, qy = y + uy * len * u + ny * off;
    s += Math.hypot(qx - px, qy - py); px = qx; py = qy; P.push({ x: qx, y: qy, s });
  }
  // 端で渦を巻く（進んできた向きのまま内側へ巻き込む）
  const end = P[P.length - 1], prev = P[P.length - 2];
  const an = Math.atan2(end.y - prev.y, end.x - prev.x) + bend * Math.PI / 2;
  const cx = end.x - Math.cos(an) * curlR, cy = end.y - Math.sin(an) * curlR, cs = Math.round(turns * 40);
  for (let i = 1; i <= cs; i++) {
    const u = i / cs, a = an - bend * u * turns * Math.PI * 2, rr = curlR * (1 - u * .82);
    const qx = cx + Math.cos(a) * rr, qy = cy + Math.sin(a) * rr;
    s += Math.hypot(qx - px, qy - py); px = qx; py = qy; P.push({ x: qx, y: qy, s });
  }
  return { P, t0, speed, w0, total: s };
}
function _brsDrawVines(c, e, V, fade, cool) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  V.forEach(v => {
    const head = (e - v.t0) * v.speed; if (head <= 0) return;
    for (let i = 1; i < v.P.length; i++) {
      const a = v.P[i - 1], b = v.P[i]; if (a.s > head) break;
      c.strokeStyle = _brsHeat(_frC((e - v.t0 - b.s / v.speed) / cool), .95 * fade); c.lineWidth = v.w0 * (1 - .55 * b.s / v.total);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    if (head < v.total) { const q = v.P.find(o => o.s >= head) || v.P[v.P.length - 1]; _brsGlow(c, q.x, q.y, 5, .9 * fade); }   // 流れる先端
  });
  c.restore();
}
function _brsSheen(c, w, y0, h, k, a) {   // 斜めの光沢（水平の線にしない）
  if (k <= 0 || k >= 1) return;
  const x = -w * .4 + k * w * 1.8, g = c.createLinearGradient(x - 60, 0, x + 60, 0);
  g.addColorStop(0, 'rgba(255,243,196,0)'); g.addColorStop(.5, `rgba(255,243,196,${a * Math.sin(Math.PI * k)})`); g.addColorStop(1, 'rgba(255,243,196,0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y0 + h / 2); c.transform(1, 0, -.6, 1, 0, 0); c.translate(-x, -(y0 + h / 2));
  c.fillStyle = g; c.fillRect(x - 60, y0, 120, h); c.restore();
}
function _brsFiligree(T, px, lo) {
  // 十字の飾り（フルーロン）：斜め4方向へ短い蔓が伸びて渦を巻く。
  // ⚠️ 肢の中を横に走る長い蔓は作らない（文字の取り消し線・下線に見える）。
  const cy = lo.t + lo.h / 2, sp = .32 + T * .02, V = [];
  const big = T >= 3, len = big ? 26 + T * 7 : lo.h * .72 + T * 4, curl = big ? 8 + T * 1.2 : Math.min(lo.h * .22, 10);
  [-.72, -2.42, .72, 2.42].forEach((d, j) => {
    const side = Math.cos(d) > 0 ? 1 : -1, up = Math.sin(d) < 0 ? 1 : -1;
    const main = _brsVine(px, cy, d, len, big ? 6 : 3, curl, 1.2, j * 30, sp, 2.2, side * up);
    V.push(main);
    for (let b = 0; b < Math.min(2, T - 1); b++) {
      const base = main.P[Math.round((main.P.length - 1) * (.28 + b * .2))];
      V.push(_brsVine(base.x, base.y, d + (b % 2 ? .95 : -.95), len * (.45 - b * .08), 2, curl * .6, 1, j * 30 + base.s / sp, sp, 1.3, b % 2 ? -side * up : side * up));
    }
  });
  if (big) for (const s2 of [1, -1]) V.push(_brsVine(px, cy + s2 * 4, s2 * Math.PI / 2, 22 + T * 8, 5, 7 + T, 1.3, 120, sp, 1.7, s2));
  const dur = Math.max(...V.map(v => v.t0 + v.total / v.speed)) + 500;
  return { dur: dur + 500, draw(c, e) {
    const fade = e < dur ? 1 : _frC(1 - (e - dur) / 500);
    _brsGlow(c, px, cy, 26, .5 * (1 - _frC(e / 700)) * fade);
    _brsDrawVines(c, e, V, fade, 750);
  } };
}
function _brsCornerCast(CW, CH, hasTop, hasBot) {
  const I = 14, BV = [], Lh = CW * .36, Lv = Math.min(CH * .3, 260);
  [[I, I, 1, 1], [CW - I, I, -1, 1], [I, CH - I, 1, -1], [CW - I, CH - I, -1, -1]].forEach(([x, y, sx, sy], j) => {
    if ((sy > 0 && !hasTop) || (sy < 0 && !hasBot)) return;   // 帯の端がカードの端でない側には隅が無い
    const t0 = 80 + j * 60;
    BV.push(_brsVine(x, y, sx > 0 ? 0 : Math.PI, Lh, 7, 12, 1.3, t0, .5, 2.4, sx * sy));
    BV.push(_brsVine(x, y, sy > 0 ? Math.PI / 2 : -Math.PI / 2, Lv, 7, 11, 1.3, t0 + 40, .5, 2.4, -sx * sy));
    BV.push(_brsVine(x, y, Math.atan2(sy, sx), Math.min(CW, CH) * .2, 5, 9, 1.1, t0 + 120, .5, 1.8, sx * sy));
  });
  const bd = BV.length ? Math.max(...BV.map(v => v.t0 + v.total / v.speed)) + 250 : 300;
  return { dur: bd + 1300, draw(c, e) {
    const fade = e < bd + 700 ? .8 : _frC(1 - (e - bd - 700) / 600) * .8;
    _brsDrawVines(c, e, BV, fade, 900);
    _brsSheen(c, CW, 0, CH, _frC((e - bd) / 700), .16);
  } };
}

function _brsBrassFx(el, card, tier, promoted, budget) {
  if (!el || !card || _fxOff()) return;
  const er = el.getBoundingClientRect();
  if (!er.width || !er.height) return;
  const w = er.width, h = er.height;
  let lx = w * .42, ly = h / 2;
  const pt = _lqPtr;
  if (pt && pt.el === el && performance.now() - pt.t < 2000) { lx = w * pt.fx; ly = h * pt.fy; }
  const T = Math.max(1, tier), up = promoted && tier >= 2;
  // brass は肢の層を持たず、全部が全画面の層（ラボの尺のまま）。座標は画面
  const CW = window.innerWidth, CHf = window.innerHeight;
  if (!CW || !CHf) return;
  const chL = er.left, chT = er.top, top = 0, CH = CHf;
  const px = chL + lx, py = chT + ly;
  // 大きさの基準は肢の高さ（最低 BRS_MIN_H）。実物の肢は1行だと約28pxしかなく、そのまま測ると
  // TIER1〜2 の歯車・刻印・唐草が豆粒になる（デモの肢は46px）。肢と同じ中心で高さだけ足した箱で測る。
  const hs = Math.max(h, BRS_MIN_H), lo = { l: chL, t: chT - top + h / 2 - hs / 2, w, h: hs };
  const bigY = _frC(py, CH * .3, CH * .7);
  // 火花と押し込みは部品を組む間に予約だけ集め、全長が決まって _rfFit した後に時刻を縮めて打つ
  const later = [];
  // 火花（数粒）。全画面の層と同じ画面座標で打つ
  const spark = (x, y, n, ms) => later.push([ms, () => {
    if (!examMode || !window.MecFX || !window.MecFX.sparks) return;
    window.MecFX.sparks(x, y, { count: n, colors: [BRS_PALE, '#FFD700', BRS_AMBER, '#FFFFFF'] });
  }]);
  // 刻印を打った手応え（肢／カードが一瞬沈む）。transform は既存アニメに殺されるので translate で
  const press = (ms, whole) => later.push([ms, () => {
    const t = whole ? card : el;
    if (t.isConnected && t.animate) t.animate([{ translate: '0 0' }, { translate: whole ? '0 2px' : '0 1.5px', offset: .25 }, { translate: '0 0' }], { duration: whole ? 260 : 200, easing: MO.spring });
  }]);
  const qn = card.querySelector('.qn'), num = qn && (qn.textContent.match(/\d+/) || [])[0];
  const serial = 'No.' + String(num || examAnswered || 0).padStart(4, '0');

  const parts = [];
  if (up) parts.push(_brsMedallion(tier, CW, CH, bigY, spark, press), _brsCornerCast(CW, CH, top === 0, top + CH >= CHf), _brsBigTrain(CW, bigY));
  parts.push(_brsFiligree(T, px, lo), _brsGearTrain(T, px, py, lo, CW, spark), _brsHallmark(T, lo, serial, spark, press));
  const dur = Math.max(...parts.map(p => p.dur));
  _rfK = 1;
  later.forEach(([ms, f]) => setTimeout(f, ms));
  const H = _rfFullHost(dur + 50);
  const C = _lqLayer(H, 'fr-card');
  const c2 = _frCtx(C, CW, CH, top, 1.5);
  _frRun(c2, CW, CH, dur, (c, e) => parts.forEach(p => p.draw(c, e)));
  _lqDrop(H, C, dur + 50);
}

/* コンボメーター（画面上端の帯・「次の段まで」のラベル・カード赤熱＝_updateComboMeter / _resetComboMeter）は
   2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */

function _spawnChoiceRipple(el) {
  if (!el) return;
  const _fxTheme = (typeof EXAM_EFFECT_THEMES !== 'undefined' && typeof examEffectSet !== 'undefined') ? EXAM_EFFECT_THEMES[examEffectSet] : null;
  const _fxRgb = (_fxTheme && _fxTheme.fx && _fxTheme.fx.rgb) || '61,214,140';
  const r = el.getBoundingClientRect();
  if (r.width === 0) return;
  if (r.top < _examFxHeaderBottom() - 4) return; // スクロール途中で肢がヘッダー下に潜っている＝位置が不正
  const x = r.left, y = r.top, w = r.width, h = r.height;
  [0, 100, 200].forEach((delay, i) => {
    const ring = document.createElement('div');
    ring.style.cssText = `position:fixed;left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${w.toFixed(0)}px;height:${h.toFixed(0)}px;border-radius:6px;border:${2 - i * .3}px solid rgba(${_fxRgb},${.9 - i * .22});box-shadow:0 0 ${10 + i*4}px rgba(${_fxRgb},.45),inset 0 0 6px rgba(${_fxRgb},.15);pointer-events:none;z-index:8000;transform-origin:center;`;
    document.body.appendChild(ring);
    ring.animate([
      {opacity: 1, transform: 'scale(1)'},
      {opacity: 0, transform: `scale(${3.4 + i * .55})`}
    ], {duration: 560 + i * 70, delay, easing: 'ease-out', fill: 'forwards'}).onfinish = () => ring.remove();
  });
}

function _applyChoiceShimmer(card) {
  if (!card) return;
  card.querySelectorAll('.ch2').forEach((ch, i) => {
    _fxTimeout(() => {
      const r = ch.getBoundingClientRect();
      if (r.width === 0) return;
      const wrap = document.createElement('div');
      wrap.style.cssText = `position:fixed;left:${r.left.toFixed(0)}px;top:${r.top.toFixed(0)}px;width:${r.width.toFixed(0)}px;height:${r.height.toFixed(0)}px;pointer-events:none;z-index:9250;overflow:hidden;border-radius:8px;`;
      const beam = document.createElement('div');
      beam.style.cssText = `position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,200,80,.18),rgba(255,220,140,.38),rgba(255,200,80,.18),transparent);transform:skewX(-18deg);`;
      wrap.appendChild(beam);
      document.body.appendChild(wrap);
      beam.animate([{left:'-80%'},{left:'160%'}],
        {duration:380, easing:'ease-in', fill:'forwards'}).onfinish = () => wrap.remove();
    }, 28 + i * 48);
  });
}

function _markExamDone(uid) {
  try {
    const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
    done[uid] = (done[uid] || 0) + 1;
    localStorage.setItem('done_v2', JSON.stringify(done));
  } catch {}
  if (window.mecSessionDone) window.mecSessionDone.add(uid);
  try { window.mecMarkStale?.(); } catch {}   // ヘッダーの「済」を追従させる（study.html の updateStats）
  try { window.mecLogActivity?.(); } catch {}
  if (window.MECSync) window.MECSync.scheduleSync();
}

function _ensureMyRateBadge(card) {
  let badge = card.querySelector('.mec-myrate');
  if (badge) return badge;
  const crEl = card.querySelector('.cr');
  if (!crEl) return null;
  badge = document.createElement('span');
  badge.className = 'mec-myrate';
  badge.dataset.uid = card.dataset.uid;
  crEl.after(badge);
  return badge;
}

function _updateMyRateBadge(uid, data) {
  const card = document.querySelector('.qc[data-uid="' + uid + '"]');
  if (!card) return;
  const badge = _ensureMyRateBadge(card);
  if (!badge) return;
  const pct = Math.round(data.correct / data.total * 100);
  badge.textContent = '自分 ' + pct + '%(' + data.correct + '/' + data.total + ')';
  badge.dataset.ok = pct >= 60 ? 'true' : 'false';
}

function _recordMyRate(uid, isCorrect) {
  // 「奪回」ミッション（過去に落とした問題を正解し直す）の判定は **加算前** の値で行う。
  // 加算後だと今回の不正解自体が wasWrong を立ててしまう。
  const _prev = _myrate[uid];
  const _wasWrong = !!(_prev && (_prev.total || 0) > (_prev.correct || 0));
  if (!_myrate[uid]) _myrate[uid] = { correct: 0, total: 0 };
  _myrate[uid].total++;
  if (isCorrect) _myrate[uid].correct++;
  localStorage.setItem('myrate_v1', JSON.stringify(_myrate));
  if (window.MECSync) window.MECSync.scheduleSync();
  _updateMyRateBadge(uid, _myrate[uid]);
  try { window.MecGamify?.onAnswer?.(uid, isCorrect, { srs: _srsReviewMode, wasWrong: _wasWrong }); } catch {}
}

// 解答イベントを mec_attempts_v1 へ1行追記する（弱点分析の素材）。
// 集計値の myrate_v1 と違い、時刻・セッション内の出題順・所要秒・選んだ肢をそのまま残すので、
// 「一度正解したのに後で落とした」「セッション後半で崩れる」といった時系列の傾向が後から出せる。
function _logAttempt(card, isCorrect, choiceStr) {
  if (!window.MecAttempts) return;
  const uid = card && card.dataset && card.dataset.uid;
  if (!uid) return;
  try {
    MecAttempts.log({
      uid,
      ok: isCorrect,
      choice: choiceStr || '',
      seenAt: _examCardSeenAt.get(uid),
      mode: _srsReviewMode ? 's' : (_examActiveChPrefix ? 'c' : 'e'),
      sess: _attemptSessionId,
      n: examAnswered,
      // 上限からあふれて集計へ畳むときの難問判定に使う（study.html は rate_index.js を読まないため）
      rate: _cardRate(card),
      // 週ごとの弱点の推移（progress.js の weekRecord）の判定材料。呼び出し順が
      // _recordMyRate → ここ → _updateSRS なので、myrate は今回を含んだ後・SRS は更新前の値になる。
      // ⚠️ この順番を入れ替えないこと（weekRecord は myrate から今回ぶんを引いて「直前」を作る）
      mr: _myrate[uid] || null,
      srs: (typeof _srsData !== 'undefined' && _srsData) ? (_srsData[uid] || null) : null,
    });
  } catch {}
}

// カード内の選択済み肢 → 半角小文字の連結（複数選択は昇順 "ac"）
function _selectedChoiceStr(els) {
  if (!window.MecAttempts) return '';
  return [...els]
    .map(ch => MecAttempts.normChoice((ch.textContent || '').trim()))
    .filter(Boolean).sort().join('');
}

function _refreshExamLapUI() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  document.querySelectorAll('.mec-lap-btn[data-uid]').forEach(btn => {
    const count = done[btn.dataset.uid] || 0;
    const numEl = btn.querySelector('.mec-lap-num');
    if (numEl) numEl.textContent = count > 0 ? count : '';
    btn.classList.toggle('mec-lapped', count > 0);
    const card = btn.closest('.qc');
    if (card) card.classList.toggle('mec-done', count > 0);
  });
}

function _getRequiredCount(card) {
  return Math.max(1, card.querySelectorAll('.ch2.ok').length);
}

// 採点除外かつ正解肢が1つも無い＝何を選んでも不正解になる問題。採点対象外として扱う。
// （正解肢ありの採点除外11問は通常採点。判定は正解肢0個に限定して巻き込まない）
function _isExamUngraded(card) {
  if (!card) return false;
  // 入力型（計算問題）は選択肢が無くても桁入力で採点する
  if (window.MecCalc && MecCalc.isCalc(card)) return false;
  // 選択肢が1つも無い＝押す対象が無く前へ進めない。中立で開いて通す。
  // 図のa〜eや組合せの選択肢がデータから欠落している問題がこれに当たる。
  if (!card.querySelector('.ch2')) return true;
  if (card.querySelectorAll('.ch2.ok').length > 0) return false;
  return typeof _isScoreExcluded === 'function' ? _isScoreExcluded(card) : false;
}

// 入力型（計算問題）のカードを試験用に仕立てる。桁入力UIの生成と確定操作の配線。
// 試験開始・中断復帰の双方から呼ぶ。
function _setupCalcCard(card) {
  if (!window.MecCalc || !MecCalc.isCalc(card)) return false;
  MecCalc.build(card);
  if (!card.dataset.calcInit) {
    card.dataset.calcInit = '1';
    // 桁の中で Enter → そのまま確定（_examKeyHandler は INPUT にフォーカスがあると
    // 何もしないので、確定操作はここで拾う必要がある）
    card.addEventListener('calc-submit', () => {
      if (examMode && !card.classList.contains('exam-revealed')) revealAnswer(card);
    });
    card.addEventListener('calc-change', () => {
      const btn = card.querySelector('.exam-reveal-btn');
      if (btn) btn.dataset.ready = MecCalc.isComplete(card) ? '1' : '0';
    });
  }
  return true;
}

// 入力型の採点。選択肢1つの経路（revealAnswer 後半）と同じ順序で集計・演出を行う。
function _revealCalcAnswer(card, sid) {
  const g = MecCalc.grade(card);
  if (!g) return;
  if (!MecCalc.isComplete(card)) { MecCalc.shake(card); return; }   // 桁が埋まるまで確定させない
  // 誤答なら入力し直させる（採点は1回目だけ）。選び直し中の再確定もここで捌く。
  if (_rfCalcSubmit(card, g)) return;
  // ここへ来るのは「初回で正解した」ときだけ
  const uid = card.dataset.uid;
  examAnswered++;
  examBySubj[sid].total++;
  _tallyChapter(uid, true);
  _tallyQuestion(card, true);            // B3/B5: 難問の成績とセッションの正誤
  _markExamDone(uid);
  _recordMyRate(uid, true);
  // 計算問題は「何と答えたか」が誤りの構造を示す（BSAで割り忘れれば 36 が出る等）ので
  // 入力値をそのまま解答ログに残す。肢の概念が無いため mec_choice_v1 には書かない。
  _logAttempt(card, true, g.entered);
  if (!_isScoreExcluded(card)) _updateSRS(uid, true);
  MecCalc.lock(card, true);
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn) delete revBtn.dataset.ready;
  // 演出は選択肢要素を掴む前提なので、入力型では桁の枠をアンカーにする
  const fxEl = MecCalc.anchor(card) || card;
  examCorrect++;
  examStreak++;
  examStreakGrace = true;
  examBySubj[sid].correct++;
  try { _playCorrectSound(); _rfCorrectFx(card, fxEl, RF_ADVANCE_MS.calc); }
  catch (err) { console.error('[ExamFx] Error in calc-correct fx:', err); }
  card.classList.add('exam-revealed', 'exam-multi-correct');
  if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
  try { _updateExamProg(true); } catch (e) {}
  try { _saveExamResume(); } catch (e) {}
  requestAnimationFrame(_updateExamFocus);
  _rfScrollAfterCorrect(card, RF_ADVANCE_MS.calc);
}

function _recountExcluded() {
  try { _examExcludedCount = examQueue.filter(c => _isExamUngraded(c)).length; }
  catch { _examExcludedCount = 0; }
}
// 採点除外問題を中立（○×どちらでもない）で開く。分母・正誤・myrate・赤旗・再試験に含めない。
function _revealExcludedNeutral(card) {
  _markExamDone(card.dataset.uid); // 見た＝周回はカウント（採点はしない）
  card.querySelectorAll('.ch2.exam-instant-wrong,.ch2.exam-instant-correct')
    .forEach(c => c.classList.remove('exam-instant-wrong', 'exam-instant-correct'));
  card.classList.add('exam-revealed');
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
  if (!card.querySelector('.exam-excluded-note')) {
    const note = document.createElement('div');
    note.className = 'exam-excluded-note';
    note.textContent = card.querySelector('.ch2')
      ? '⚠️ 採点除外 — 正解肢が無いため採点対象外です（正誤・正解率・再試験に含めません）'
      : '⚠️ 採点除外 — 選択肢データが欠落しているため採点対象外です（正誤・正解率・再試験に含めません）';
    const qb = card.querySelector('.qb');
    const ab = qb && qb.querySelector('.ab');
    if (ab) ab.parentNode.insertBefore(note, ab); else if (qb) qb.appendChild(note); else card.appendChild(note);
  }
  _updateExamProg();
  _saveExamResume();
  requestAnimationFrame(_updateExamFocus);
  setTimeout(() => _scrollToNextCard(card), 300);
}

function _updateMultiInfo(card) {
  if (!card) return;
  const req = _getRequiredCount(card);
  const sel = card.querySelectorAll('.ch2.exam-selected').length;
  const info = card.querySelector('.exam-multi-info');
  const ready = sel >= req;
  if (info) { info.textContent = sel + ' / ' + req + ' 選択中'; info.dataset.ready = ready ? '1' : '0'; }
  const wasLoaded = card.classList.contains('exam-target-loaded');
  card.classList.toggle('exam-target-loaded', ready);
  if (ready && !wasLoaded && !_fxOff() && window.MecFX) {
    const selected = [...card.querySelectorAll('.ch2.exam-selected')];
    if (selected.length >= 2) {
      const r0 = selected[0].getBoundingClientRect();
      const r1 = selected[selected.length - 1].getBoundingClientRect();
      window.MecFX.slashRibbon(
        r0.left + 15, r0.top + r0.height / 2,
        r1.left + 15, r1.top + r1.height / 2,
        { color: '#60A5FA', width: 3, ttl: .36 }
      );
    }
  }
}

// 全問回答し終えたら「結果画面に進む」ボタンを最後の問題カードの直後に表示する。
// 正解/不正解を問わず、最後の1問を終えた時点で呼ばれる（自動では結果へ飛ばさない）。
function _maybeShowFinishBtn() {
  if (!examMode || !examQueue.length) return null;
  const remaining = examQueue.filter(c => !c.classList.contains('exam-revealed'));
  let btn = document.getElementById('examFinishBtn');
  if (remaining.length) { if (btn) btn.remove(); _syncPendingBand(remaining); return null; } // まだ未回答が残る
  document.getElementById('examPendingBand')?.remove();
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = 'examFinishBtn';
  btn.className = 'exam-finish-btn';
  btn.textContent = '📊 結果画面に進む';
  btn.onclick = () => { btn.disabled = true; exitExam(); };
  // DOM順で最後の試験カードの直後に挿入（並べ替えは _examSyncQueue が済ませてある）
  const lastCard = _examOrder[_examOrder.length - 1];
  if (lastCard && lastCard.parentNode) lastCard.after(btn);
  else (document.querySelector('.ct') || document.body).appendChild(btn);
  return btn;
}

// 未解答の案内の帯（2026-09-28・ユーザー要望「最後まで解いた後、未解答のカードを探すのが大変」）。
// 最後のカードまで手を付けた（開封済み・選び直し中）のに未解答が残っているとき、結果ボタンと同じ場所に出す。
// 押すたびに次の未解答カードへ送る＝画面の上端より下にある最初の未解答、無ければ先頭の未解答。
// ⚠️ 「未解答」は exam-revealed でないカード＝選び直し中（exam-retry）も含む（答えを開くまで結果へ進めないため）。
// 更新は _updateExamProg（解答のたびに必ず通る）→ _maybeShowFinishBtn から。
function _syncPendingBand(remaining) {
  let band = document.getElementById('examPendingBand');
  const shown = _examOrder.filter(c => c.style.display !== 'none');
  const last = shown[shown.length - 1];
  const reached = last && (last.classList.contains('exam-revealed') || last.classList.contains('exam-retry'));
  if (!remaining.length || !reached) { if (band) band.remove(); return null; }
  if (!band) {
    band = document.createElement('button');
    band.id = 'examPendingBand';
    band.className = 'exam-pending-band';
    band.onclick = _jumpToPendingCard;
    last.after(band);
  } else if (band.previousElementSibling !== last) last.after(band);
  const retry = remaining.filter(c => c.classList.contains('exam-retry')).length;
  band.innerHTML = '<span class="epb-n">未解答 <b>' + remaining.length + '</b> 問</span>'
    + (retry ? '<span class="epb-sub">（選び直し中 ' + retry + '問を含む）</span>' : '')
    + '<span class="epb-go">▶ 次の未解答へ</span>';
  return band;
}
function _jumpToPendingCard() {
  const pend = _examOrder.filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
  if (!pend.length) { _showFinishAndScroll(); return; }
  const hdr = document.querySelector('.st-hdr');
  const edge = (hdr ? hdr.getBoundingClientRect().bottom : 0) + 12;
  const next = pend.find(c => c.getBoundingClientRect().top > edge) || pend[0];
  next.classList.remove('exam-next-entering');
  next.classList.add('exam-next-entering');
  setTimeout(() => next.classList.remove('exam-next-entering'), 500);
  const y = next.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 8 : 0);
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}
function _scrollToPendingBand() {
  const band = _maybeShowFinishBtn() || document.getElementById('examPendingBand');
  if (!band) return;
  const hdr = document.querySelector('.st-hdr');
  const y = band.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 20 : 20);
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

function _showFinishAndScroll() {
  const btn = _maybeShowFinishBtn();
  if (!btn) return;
  requestAnimationFrame(() => {
    const hdr = document.querySelector('.st-hdr');
    const y = btn.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 20 : 20);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  });
}

/* 正解の後、次のカードへ送る。送りの時間は RF_ADVANCE_MS（単一 403ms・複数 460ms・計算 345ms）。
   肢の中の正解演出は _rfCorrectFx が同じ時間を予算にして、送る前に終わらせている。
   カードの中で出していた UIテーマ固有の演出は全画面の層でラボの尺のまま再生する（_rfFullHost）。
   ⚠️ 送りを大きく遅らせる案（1.0〜1.7秒）は「カードの送りが遅い」、層をカードの位置の台へ移して残す案は
      「中に浮いておかしな演出」と、どちらも却下された（2026-09-28）。 */
function _rfScrollAfterCorrect(card, ms) {
  setTimeout(() => _scrollToNextCard(card), ms);
}
function _scrollToNextCard(fromCard) {
  // ⚠️ キュー(_examOrder)から選ぶこと。DOM 全走査に戻すとキュー外のカードへ送り込む。
  const allShown = _examOrder.filter(c => c.style.display !== 'none');
  const unrevealed = allShown.filter(c => !c.classList.contains('exam-revealed'));
  if (!unrevealed.length) { _showFinishAndScroll(); return; }
  let next;
  if (fromCard) {
    const idx = allShown.indexOf(fromCard);
    next = allShown.slice(idx + 1).find(c => !c.classList.contains('exam-revealed'));
  }
  // 後ろに未解答が無い（前に飛ばしたカードだけが残る）ときは、最後の案内の帯へ送る。
  // ⚠️ 以前はここで next が未定義のまま下の getBoundingClientRect に進み、例外で止まっていた。
  if (!next) { _scrollToPendingBand(); return; }
  if (next) {
    next.classList.remove('exam-next-entering');
    next.classList.add('exam-next-entering');
    setTimeout(() => next.classList.remove('exam-next-entering'), 500);
    setTimeout(() => _applyChoiceShimmer(next), 140);
  }
  const hdr = document.querySelector('.st-hdr');
  const y = next.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 8 : 0);
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

function _removeCardFromExam(card) {
  const idx = examQueue.indexOf(card);
  if (idx < 0) return;
  // カードを隠す前に次の未回答カードを特定（nullを渡すと先頭スクロールになるため）
  const allShown = _examOrder.filter(c => c.style.display !== 'none');
  const cardIdx = allShown.indexOf(card);
  const nextTarget = allShown.slice(cardIdx + 1).find(c => !c.classList.contains('exam-revealed'));
  examQueue.splice(idx, 1);
  _examSyncQueue();   // ⚠️ キューを触ったら索引を必ず張り直す
  card.querySelectorAll('.mec-err-panel.open').forEach(p => p.classList.remove('open'));
  card.style.display = 'none';
  _updateExamProg();
  _saveExamResume();
  const remaining = _examOrder.filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
  if (!remaining.length) { exitExam(); return; }
  if (nextTarget && remaining.includes(nextTarget)) {
    const hdr = document.querySelector('.st-hdr');
    const y = nextTarget.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 8 : 0);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
}

/* wantFlip=true のときだけ並べ替え前後の位置を測り、[{el,dy}] を返す（B6の種）。
   ⚠️ 測定は強制レイアウトを起こすので、必ず1問目の1枚だけに限ること。
      出題キュー全部で測ると最大600回のリフローになる。 */
function _shuffleChoices(card, wantFlip) {
  if (card.querySelector('.qimg-row')) return null;
  if (card.querySelector('.qt u')) return null;   // 下線部の参照型はシャッフルしない
  const cs = card.querySelector('.cs');
  if (!cs) return null;
  const choices = [...cs.querySelectorAll('.ch2')];
  if (choices.length < 2) return null;
  // 選択肢が「番号・記号の参照」だけの問題はシャッフルしない。
  // 例: Q26「下線部①〜⑤のどれか」/ 表の行 a〜e を選ぶ問題では、問題文が
  // ①②③… や a b c… の順序に依存しており、並べ替えると正誤対応が崩れて意味不明になる。
  // 先頭の選択肢ラベル(ａ-ｅ/a-e)を除いた本文が、丸囲み数字・ローマ数字・単独の英字/カナ/数字
  // だけなら参照型とみなす。
  const _isRefChoice = ch => {
    const body = ch.textContent.trim().replace(/^[ａ-ｅa-e][　\s]*/i, '').trim();
    return body === '' || /^[①-⑳⓪❶-❿Ⅰ-Ⅻⅰ-ⅹ]$/.test(body) || /^[（(]?[0-9]{1,2}[）)]?$/.test(body) || /^[ア-オア-ンa-eA-E]$/.test(body);
  };
  if (choices.every(_isRefChoice)) return null;
  _examChoiceBackup.set(card.dataset.uid, choices.map(c => c.cloneNode(true)));
  const before = wantFlip ? choices.map(c => c.offsetTop) : null;
  const shuffled = choices.slice().sort(() => Math.random() - 0.5);
  shuffled.forEach((ch, i) => {
    cs.appendChild(ch);
    const tn = ch.firstChild;
    if (tn && tn.nodeType === Node.TEXT_NODE)
      tn.textContent = tn.textContent.replace(/^[ａ-ｅa-e][　\s]*/i, (i + 1) + '　');
  });
  if (!before) return null;
  return shuffled.map(ch => ({ el: ch, dy: before[choices.indexOf(ch)] - ch.offsetTop }));
}

/* B6: 「選択肢はシャッフルされます」をモーダルの文字ではなく動きで見せる。
   1問目だけ、元の位置から今の位置へ滑り込ませる（真の FLIP）。
   ⚠️ 参照型・下線部の問題はそもそもシャッフルされないので flips が null になり、
      この演出も出ない（並んでいないのに並び替わって見えるのを防ぐ）。 */
function _revealShuffleFx(flips) {
  if (!flips || !flips.length || _fxOff()) return;
  if (flips.every(f => !f.dy)) return;   // たまたま元の並びのままなら見せない
  flips.forEach((f, i) => {
    if (!f.el.isConnected) return;
    f.el.animate([
      { transform: 'translateY(' + f.dy + 'px)', opacity: .35 },
      { transform: 'translateY(' + (f.dy * .12) + 'px)', opacity: 1, offset: .72 },
      { transform: 'none', opacity: 1 }
    ], { duration: 620, delay: i * 55, easing: 'cubic-bezier(.2,.9,.25,1)' });
  });
}

// 1問目の入場（_firstCardEntrance）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。

function _restoreChoices() {
  _examChoiceBackup.forEach((originals, uid) => {
    const cs = document.querySelector(`.qc[data-uid="${uid}"] .cs`);
    if (!cs) return;
    cs.innerHTML = '';
    originals.forEach(c => {
      c.classList.remove('correct', 'exam-selected', 'exam-instant-correct', 'exam-instant-wrong');
      cs.appendChild(c);
    });
  });
  _examChoiceBackup.clear();
}

function _updateExamProg(isCorrect = false) {
  const total = Math.max(0, examQueue.length - (_examExcludedCount || 0)); // 採点除外は分母から除く
  const fill = document.getElementById('examProgFill');
  const txt = document.getElementById('examProgTxt');
  if (fill) fill.style.width = total > 0 ? (examAnswered / total * 100) + '%' : '0%';
  if (txt) {
    // A(2026-09-24): 動く数字だけを桁が縦に回る表示にする（_rfDigits・連続数と同じ部品）。
    //   比較は表示文字列（dataset.v）で行う——桁の列は 0〜9 を全部持つので textContent は読めない。
    const before = txt.dataset.v || '';
    let head, num, tail;
    if (_isHostSession()) {
      const remaining = total - examAnswered;
      const streakPart = examStreak >= 2 ? `  🔥×${examStreak}` : '';
      head = '残り '; num = remaining; tail = ' 問' + streakPart;
    } else {
      head = ''; num = examAnswered; tail = ' / ' + total + ' 問';
    }
    const shown = head + num + tail;
    const prevN = (txt.dataset.n === undefined || examAnswered === 0) ? num : +txt.dataset.n;   // 開始時は回さない（前のセッションの値から回らないように）
    txt.dataset.v = shown;
    txt.dataset.n = num;
    txt.setAttribute('aria-label', shown);
    txt.innerHTML = head + '<span class="rf-odo" aria-hidden="true">' + _rfDigits(prevN, num) + '</span>' + tail;
    const roll = () => txt.querySelectorAll('.rf-col').forEach(c => c.classList.add('go'));
    requestAnimationFrame(roll);
    setTimeout(roll, 60);   // rAF が止まる裏タブの落とし所
    /* S12(2026-08-21): 管は**数字が変わるたびに**ともる。この数字が量っているのは正誤ではなく
       「進んだこと」だから（R1 の放出を正誤で変えないのと同じ理屈）。
       ⚠️ ただし現在ある報酬信号を消さないため **2段**にした（2026-08-21・ユーザー判断）——
          正解＝強く緑に光る（従来どおり）／誤答・その他の更新＝弱く琥珀にともる。
       ⚠️ 更新の口をここ1つに保つこと（増やすと「進んだ」の合図が2箇所に分かれる）。
       ⚠️ scale は独立プロパティで書くこと。transform だと将来ここに入場アニメを足した
          瞬間に黙って死ぬ（§11-5-4'・S6 と同じ罠）。 */
    if (isCorrect) {
      txt.getAnimations?.().forEach(a => a.cancel());
      txt.animate([
        {scale:'1.45',color:'var(--gr)',textShadow:'0 0 12px rgba(61,214,140,.8)'},
        {scale:'1',color:'currentColor',textShadow:'0 0 8px rgba(255,196,90,.35)'}
      ], {duration:400, easing:'cubic-bezier(.34,1.56,.64,1)'});
    } else if (shown !== before) {
      txt.getAnimations?.().forEach(a => a.cancel());
      txt.animate([
        {scale:'1.12',textShadow:'0 0 14px rgba(255,196,90,.85)'},
        {scale:'1',textShadow:'0 0 8px rgba(255,196,90,.35)'}
      ], {duration:250, easing:'cubic-bezier(.34,1.4,.64,1)'});
    }
  }
  // 10問ごとのワープゲート（_triggerWarpGate）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。
  if (examMode) { try { _maybeShowFinishBtn(); } catch (e) {} }   // 未解答の案内の帯を最新にする
}

let _examScrollRaf = null;

/* 稼働灯・歯車・熾火（D9）、読書中の噴気と蒸気の放出（R1）、歯車の膨張（R2）、
   排圧計の針（S1）、スクロールで機械が速く回る（R8）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。 */

function _getExamTargetCard() {
  const hdr = document.querySelector('.st-hdr');
  const hdrH = hdr ? hdr.getBoundingClientRect().bottom : 0;
  // ⚠️ DOM を全走査しないこと。キュー外のカード（他科目・フィルター外）が display:none を
  //    失っていると、そのまま「次の問題」として焦点が乗り、出題・採点されてしまう。
  const visibleCards = _examOrder.filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
  return visibleCards.find(c => c.getBoundingClientRect().bottom > hdrH) || null;
}
/* R3(Phase 5): 連続正解を読書中も残す。tier の色を焦点枠（盤面側）へ流す。
   ⚠️ クランプ(R5)は筐体なので真鍮固定＝ここで色を振るのは outline と glow だけ。
   ⚠️ tier で配列を引くときは必ず _tIdx を使う（Math.min(tier,6) を新しく書かない）。
   ⚠️ 呼ぶ場所は _updateExamFocus の中だけ。 */
function _hexToRgba(hex, a) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function _syncFocusStreakColor() {
  const st = document.body.style;
  const cols = _examTheme().comboColors;
  const c = examStreak >= 2 && cols ? cols[_tIdx(_examTier(examStreak), cols)] : null;
  const glow = c ? _hexToRgba(c, .22) : null;
  if (c && glow) { st.setProperty('--exam-focus-c', c); st.setProperty('--exam-focus-glow', glow); }
  else { st.removeProperty('--exam-focus-c'); st.removeProperty('--exam-focus-glow'); }
}

function _updateExamFocus() {
  const prevFocus = document.querySelector('.qc.exam-key-focus');
  const card = _getExamTargetCard();
  // ⚠️ 焦点が変わっていない時は付け替えないこと。R5 のクランプは class 付与でアニメが走るので、
  //    スクロールのたびに remove→add すると閉じる動きが繰り返される（この関数はスクロールで
  //    一番呼ばれる）。同一タスク内の remove→add は再生されないが、依存させずに明示で守る。
  if (prevFocus !== card) {
    document.querySelectorAll('.qc.exam-key-focus').forEach(c => c.classList.remove('exam-key-focus'));
    if (card) card.classList.add('exam-key-focus');
  }
  if (card) _markCardSeen(card);
  _syncFocusStreakColor();   // R3
  _examIOWatch(card);        // 段3: 監視対象を焦点カードのぶんだけに張り替える
}
/* ══ Phase 5 段2(2026-08-19): R10 離席でスリープ ═══════════════════════════════
   R1（蒸気）・R2（歯車の膨張）・S1（排圧計）・R8（スクロール応答）は 2026-09-28 に撤去した。 */

/* 蒸気の色（弁元が濃く、外へ行くほど明るい）。開始カウントダウンの steam 様式が使う。
   ⚠️ 色をランダムにしないこと（glowSprite は色ごとにキャッシュされる）。 */
const STEAM_TONES = ['#B9B0A0', '#CFC6B4', '#E0DACB', '#EFEAE0'];

/* R10: 60秒動きが無ければ機械が休み、動いたら起動シーケンスを見せる。
   ⚠️ 「放置＝叱られている」に見せないこと。暗くするだけで印（レール・溝・リベット）は残す。
   ⚠️ タイマーは1本。張り直す前に必ず clearTimeout する
      （_armHold・_startGaugeAmbient で同じ型の前科がある）。 */
const EXAM_SLEEP_MS = 60000;
let _examSleepTimer = null;
let _examWakeTimer = null;
function _armExamSleep() {
  clearTimeout(_examSleepTimer); _examSleepTimer = null;
  if (!examMode || _fxOff()) return;
  _examSleepTimer = setTimeout(() => {
    _examSleepTimer = null;
    if (examMode) document.body.classList.add('exam-asleep');
  }, EXAM_SLEEP_MS);
}
function _examWake() {
  if (!examMode) return;
  const b = document.body;
  if (b.classList.contains('exam-asleep')) {
    b.classList.remove('exam-asleep');
    if (!_fxOff()) {
      b.classList.add('exam-waking');
      clearTimeout(_examWakeTimer);
      _examWakeTimer = setTimeout(() => { _examWakeTimer = null; b.classList.remove('exam-waking'); }, 900);
    }
  }
  _armExamSleep();
}

/* ══ Phase 5 段3(2026-08-19): IntersectionObserver を1本だけ立てて共有する ═════
   R7 読影灯／R9 読む→決めるの相転移／R6 キーキャップ。設計 §11-6。
   ⚠️⚠️ 全カードを observe してはいけない（最大594枚）。焦点カードが変わったら前のカードの
      対象を unobserve し、新しいカードの .qimg と最初の .ch2 だけを observe する＝常に数個。
   ⚠️ rootMargin は 0 のまま。広げると content-visibility:auto のカードの描画を強制することになる。
   ⚠️ observer は1本。exitExam で必ず disconnect する（通常閲覧へ持ち越さない）。 */
let _examIO = null;
let _examIOCard = null;

function _examIOTargets(card) {
  if (!card) return [];
  const t = [...card.querySelectorAll('.qimg')];
  const firstCh = card.querySelector('.ch2');   // 計算問題には .ch2 が無い＝相転移も起きない（正しい）
  if (firstCh) t.push(firstCh);
  return t;
}
function _ensureExamIO() {
  if (_examIO || typeof IntersectionObserver !== 'function') return _examIO;
  _examIO = new IntersectionObserver(ents => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains('qimg')) _examLightbox(e.target);
      else _examPhaseDecide(e.target);
    });
  }, { threshold: .35 });
  return _examIO;
}
function _examIOWatch(card) {
  if (_examIOCard === card) return;
  const io = _ensureExamIO();
  if (!io) return;
  _examIOTargets(_examIOCard).forEach(el => io.unobserve(el));
  if (_examIOCard) _examIOCard.classList.remove('exam-deciding');
  document.body.classList.remove('exam-phase-decide');
  _examIOCard = card;
  if (!card || card.classList.contains('exam-revealed')) return;
  _examIOTargets(card).forEach(el => io.observe(el));
}

/* R7: 医療画像が視野に入った瞬間に読影灯が点く。
   ⚠️ 画像を CSS で暗くしてから JS で戻す形にしないこと。JS が落ちた日に画像が読めなくなる
      （stats.html の armReveal で同じ失敗の型を踏んでいる）。**素の状態は常に通常表示**で、
      クラスが付いたときだけ「暗→明」のアニメが一度走る＝失敗しても情報が失われない。
   ⚠️ 一度点けた画像は二度と点け直さない（スクロールで往復するたびに光ると鬱陶しい）。
   ⚠️ 拡大表示（.qimg の zoom-in クリック）と競合させないこと＝当たり判定を作らない。 */
function _examLightbox(img) {
  if (_fxOff() || img.dataset.examLit) return;
  img.dataset.examLit = '1';
  const lite = () => img.classList.add('qimg-lit');
  if (img.complete && img.naturalWidth) lite();
  else img.addEventListener('load', lite, { once: true });   // lazy 読込がまだの場合
}

/* R9: 選択肢が視野に入った＝「読む」から「決める」への相転移。
   ⚠️ 焦点カードについてのみ判定する（下のカードの選択肢が見えても発火させない）。 */
function _examPhaseDecide(el) {
  const card = el.closest ? el.closest('.qc') : null;
  if (!card || !card.classList.contains('exam-key-focus')) return;
  if (card.classList.contains('exam-revealed')) return;
  card.classList.add('exam-deciding');
  document.body.classList.add('exam-phase-decide');
}

function _onExamScroll() {
  if (_examScrollRaf) cancelAnimationFrame(_examScrollRaf);
  _examScrollRaf = requestAnimationFrame(_updateExamFocus);
  _examWake();          // R10
}
function _examKeyHandler(e) {
  if (!examMode) return;
  _examWake();   // R10: キーボードだけで解いている人もスリープから起こす
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const card = _getExamTargetCard();
  if (!card) return;
  // 入力型（計算問題）に数字キーは「選択肢n番」ではなく桁の入力として渡す。
  // Enter / Space は下の既存分岐へ流し、確定と次カードへのスクロールを共通の挙動に保つ。
  if (window.MecCalc && MecCalc.isCalc(card) && !card.classList.contains('exam-revealed')
      && e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    MecCalc.typeDigit(card, e.key);
    return;
  }
  if (e.key >= '1' && e.key <= '5') {
    e.preventDefault();
    const choices = [...card.querySelectorAll('.ch2')];
    const n = parseInt(e.key) - 1;
    // 数字キーはクリックと同じ経路（_examChoiceClick → 選び直し）へ流す。分岐をここに複製しないこと。
    if (choices[n] && !card.classList.contains('exam-revealed')) choices[n].click();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const hdr2 = document.querySelector('.st-hdr');
    const hdrH2 = hdr2 ? hdr2.getBoundingClientRect().bottom : 0;
    const allShown = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none');
    const viewCard = allShown.find(c => { const r = c.getBoundingClientRect(); return r.top >= hdrH2 - 10 && r.bottom > hdrH2; })
                  || allShown.find(c => c.getBoundingClientRect().bottom > hdrH2);
    if (viewCard && viewCard.classList.contains('exam-revealed')) {
      _scrollToNextCard(viewCard);
    } else {
      revealAnswer(card);
    }
  }
}

function resumeExam(savedAt) {
  const saved = _loadResumes().find(r => r.savedAt == savedAt);
  if (!saved || !saved.uids || !saved.uids.length) { alert('再開データが見つかりません。'); return; }
  _examSessionKey = saved.key || '';
  // 章別試験・フィルター情報を復元する。復元しないと、再開して完走しても章別履歴
  // (mec_ch_exam_v1) に記録されず、再中断時にフィルタータグも消える。
  _examActiveChPrefix = saved.chPrefix || null;
  _examFilterLabel = saved.filterLabel || '';
  closeExamStart();
  setTimeout(_playResumeIntroFx, 200); // モーダルが閉じてから中央演出を発火

  const uidToCard = {};
  document.querySelectorAll('.qc[data-uid]').forEach(c => { uidToCard[c.dataset.uid] = c; });
  examQueue = saved.uids.map(uid => uidToCard[uid]).filter(Boolean);
  _recountExcluded();
  if (!examQueue.length) { alert('前回の試験を復元できませんでした。'); _clearExamResume(); return; }

  // セクション（科目）が非表示でもカードを見せるため visible に強制する
  const examSections = new Set(examQueue.map(c => c.closest('.subj-section')).filter(Boolean));
  examSections.forEach(sec => { sec.dataset.visible = 'true'; });

  examAnswered = saved.answeredCount;
  examCorrect = saved.correctCount;
  examBySubj = saved.bySubj || {};
  examByChapter = saved.byChapter || {};
  examWrong = saved.wrongUids || [];

  _clxSessionPick = Math.random() < .5 ? 'nova' : 'galaxy';   // 再開も1つのセッション＝抽選し直す（startExam と同じ）
  examMode = true;
  examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  // 再開は別セッション扱い（n は examAnswered の続きなので中断前後で連番が繋がる）
  _attemptSessionId = window.MecAttempts ? MecAttempts.newSession() : '';
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  localStorage.setItem('mec_exam_active_key', saved.key || '');
  _examChoiceBackup.clear();
  /* 2026-08-31: 再開経路でも演出テーマを引き直す。ランダム選択だった頃はここで引くと
     中断前と別のテーマになってしまうので意図的に省かれていたが、UIテーマから決定論的に
     引くようになったので **中断前と必ず同じものが復元される**。省くと、リロードを挟んだ
     再開だけ examEffectSet が初期値 'classic' のまま進み、ラベルと色だけが別世界になる。 */
  examEffectSet = _examSetForUi();
  document.body.classList.remove('exam-effect-neon', 'exam-effect-ink');
  if (examEffectSet !== 'classic') document.body.classList.add('exam-effect-' + examEffectSet);
  document.body.classList.add('exam-mode');
  _examSyncQueue();
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_examSet.has(c)) c.style.display = 'none'; });

  const revealedUids = saved.revealedUids || {};

  // B2/B3/B5: 目盛りと難問印を敷き直し、解答済みぶんの成績を中断データから戻す
  _clearRecapChips(); _examSessionResults.clear();
  _renderExamProgMarks();
  examQueue.forEach(c => {
    const r = revealedUids[c.dataset.uid];
    if (r) _tallyQuestion(c, !!r.correct);
  });

  examQueue.forEach(card => {
    card.style.display = '';
    const uid = card.dataset.uid;
    if (revealedUids[uid]) {
      card.classList.add('exam-revealed');
      if (revealedUids[uid].correct) card.classList.add('exam-multi-correct');
      // 採点済みの計算問題は入力欄を答え合わせの状態で見せる（採点はやり直さない）
      if (window.MecCalc && MecCalc.isCalc(card)) {
        MecCalc.build(card);
        if (revealedUids[uid].entered) MecCalc.restore(card, revealedUids[uid].entered);
        MecCalc.lock(card, !!revealedUids[uid].correct);
      }
    } else {
      card.querySelectorAll('.ch2.correct').forEach(c => c.classList.remove('correct'));
      card.classList.remove('fx-correct');
      _shuffleChoices(card);
      const isCalc = _setupCalcCard(card);
      // 中断時に入力途中だった桁を戻す
      if (isCalc && revealedUids[uid] === undefined && (saved.calcEntered || {})[uid]) {
        MecCalc.restore(card, saved.calcEntered[uid]);
      }
      const req = _getRequiredCount(card);
      if (!isCalc && req > 1 && !card.querySelector('.exam-multi-info')) {
        const info = document.createElement('div');
        info.className = 'exam-multi-info';
        info.textContent = '0 / ' + req + ' 選択中';
        info.dataset.ready = '0';
        const cs = card.querySelector('.cs');
        if (cs) cs.before(info);
      }
      const qb = card.querySelector('.qb');
      if (qb && !qb.querySelector('.exam-reveal-btn')) {
        const btn = document.createElement('button');
        btn.className = 'exam-reveal-btn';
        btn.textContent = (isCalc || req > 1) ? '▶ 回答を確定する' : '▶ 解答を見る';
        btn.onclick = () => revealAnswer(card);
        const ab = qb.querySelector('.ab');
        if (ab) ab.parentNode.insertBefore(btn, ab); else qb.appendChild(btn);
      }
      _bindExamChoices(card);
    }
  });

  // 最後に回答した問題の次の未回答カードを特定
  const lastRevealedIdx = examQueue.reduce((last, c, idx) => revealedUids[c.dataset.uid] ? idx : last, -1);
  const firstUnrevealed = examQueue.find((c, idx) => idx > lastRevealedIdx && !revealedUids[c.dataset.uid]) || null;

  // 再開マーカーを挿入
  document.querySelectorAll('.exam-resume-marker').forEach(el => el.remove());
  if (firstUnrevealed) {
    const marker = document.createElement('div');
    marker.className = 'exam-resume-marker';
    marker.textContent = '▼ ここから再開（' + (examAnswered + 1) + '問目）';
    firstUnrevealed.before(marker);
  }

  _updateExamProg();
  if (examTimerInt) clearInterval(examTimerInt);
  examTimerInt = setInterval(() => {
    const s = Math.floor((_examActiveMs()) / 1000);
    const el = document.getElementById('examTimer');
    if (el) el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }, 1000);
  document.addEventListener('keydown', _examKeyHandler);
  window.addEventListener('scroll', _onExamScroll, { passive: true });
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '📖 終了'; modeBtn.classList.add('exam-on'); modeBtn.onclick = exitExam; }

  requestAnimationFrame(_updateExamFocus);
  const progTxt = document.getElementById('examProgTxt');
  if (firstUnrevealed) {
    if (progTxt) {
      progTxt.textContent = (examAnswered + 1) + '問目から再開';
      setTimeout(() => _updateExamProg(), 2500);
    }
    // まず先頭にスクロールして content-visibility レイアウトを安定させる
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      if (!examMode) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const target = document.querySelector('.exam-resume-marker') || firstUnrevealed;
        const hdr = document.querySelector('.st-hdr');
        const hdrH = hdr ? hdr.offsetHeight : 0;
        const rect = target.getBoundingClientRect();
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - hdrH - 8), behavior: 'instant' });
      }));
    }, 600);
  } else {
    window.scrollTo({ top: 0 });
  }
}

function exitExam() {
  if (!examMode) return;
  if (!_isHostSession()) {
    if (examAnswered >= examQueue.length) _clearExamResume();
    else _saveExamResume();
  }
  examMode = false;
  localStorage.removeItem('mec_exam_active_key');
  /* ⚠️ 演出の遅延タイマーを最初に落とす（§cleanup）。ここより後ろの掃除は
     「いま画面に出ているもの」を消すだけなので、先に止めないと掃除の直後に
     遅延ぶんが新しい演出を生やす（正解直後に「終了」を押すと再現する）。 */
  _fxClearTimers();
  // srs-review クラスはここでは外さない。結果画面〜誤答再試験の間も復習の最小表示を保つため、
  // 解除は通常閲覧へ戻る _srsRestoreAfterReview() に集約している。
  _lastSessionWasSrs = _srsReviewMode;
  _lastSessionWasTodayWrong = _todayWrongMode;
  _lastSessionWasBoss = !!_bossMode;
  _lastSessionWasFocus = _focusMode;
  try { window.MecBoss?.onExit?.(); } catch (e) {}
  try { window.MecWard?.onExit?.(); } catch (e) {}
  document.body.classList.remove('exam-mode', 'exam-effect-neon', 'exam-effect-ink', 'exam-screen-shake', 'exam-red-flash', 'exam-slash-freeze', 'exam-bullet-time');
  document.querySelector('.exam-prog-track')?.classList.remove('exam-prog-complete');
  // Phase 5 段1: R3 の焦点色は body のインラインスタイルなので通常閲覧へ持ち越さない。
  document.body.style.removeProperty('--exam-focus-c');
  document.body.style.removeProperty('--exam-focus-glow');
  // Phase 5 段2: R10 のスリープを落とす（通常閲覧のヘッダへ持ち越さない）。
  clearTimeout(_examSleepTimer); _examSleepTimer = null;
  clearTimeout(_examWakeTimer);  _examWakeTimer = null;
  document.body.classList.remove('exam-asleep', 'exam-waking');
  // Phase 5 段3: observer は1本しか無いので必ず disconnect（通常閲覧へ持ち越さない）。
  if (_examIO) { _examIO.disconnect(); _examIO = null; }
  _examIOCard = null;
  document.body.classList.remove('exam-phase-decide');
  document.querySelectorAll('.qc.exam-deciding').forEach(c => c.classList.remove('exam-deciding'));
  document.querySelectorAll('.qimg.qimg-lit').forEach(el => {
    el.classList.remove('qimg-lit'); delete el.dataset.examLit;
  });
  clearInterval(examTimerInt);
  document.removeEventListener('keydown', _examKeyHandler);
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  _examPauseStart = null;
  window.removeEventListener('scroll', _onExamScroll);
  document.querySelectorAll('.qc.exam-key-focus').forEach(c => c.classList.remove('exam-key-focus'));
  document.querySelectorAll('.qc.exam-target-loaded').forEach(c => c.classList.remove('exam-target-loaded'));
  document.querySelectorAll('.exam-resume-marker').forEach(el => el.remove());
  // Feature 1: auto-flag wrong answers
  if (examWrong.length) {
    const flags = JSON.parse(localStorage.getItem('flag_v2') || '{}');
    examWrong.forEach(uid => { flags[uid] = 1; });
    localStorage.setItem('flag_v2', JSON.stringify(flags));
    examWrong.forEach(uid => {
      document.querySelectorAll(`.mec-flag-btn[data-uid="${uid}"]`).forEach(b => b.classList.add('mec-flagged'));
    });
  }
  _restoreChoices();
  document.querySelectorAll('.exam-reveal-btn').forEach(b => b.remove());
  document.getElementById('examFinishBtn')?.remove();
  document.getElementById('examPendingBand')?.remove();
  document.querySelectorAll('.qc.exam-revealed').forEach(c => c.classList.remove('exam-revealed', 'exam-multi-correct', 'exam-answer-opened'));
  document.querySelectorAll('.qc.fx-correct').forEach(c => c.classList.remove('fx-correct'));
  document.querySelectorAll('.ch2.correct').forEach(c => c.classList.remove('correct'));
  document.querySelectorAll('.ch2.exam-selected').forEach(c => c.classList.remove('exam-selected'));
  document.querySelectorAll('.ch2.exam-instant-correct').forEach(c => c.classList.remove('exam-instant-correct'));
  document.querySelectorAll('.ch2.exam-instant-wrong').forEach(c => c.classList.remove('exam-instant-wrong'));
  _rfCleanup();   // 選び直しの印（× ・案内・縁の光・連続数）
  /* ⚠️ dataset.examInit を消さないこと（2026-08-25）。リスナーは removeEventListener していないので、
     フラグだけ消すと次の startExam が2本目を付ける。単一選択は revealAnswer の exam-revealed ガードが
     二重採点を弾くが、**複数選択は classList.toggle が2回走って選択が入らなくなる**（＝その問題が解けない）。
     シャッフルされた問題は直前の _restoreChoices が肢をクローンで差し替えるのでノードごと入れ替わり、
     フラグもリスナーも一緒に落ちる。残るのはシャッフル対象外（画像・下線部参照・参照型）だけで、
     そこはフラグを残して「一度きり」を守るのが正しい。 */
  document.querySelectorAll('.exam-multi-info').forEach(el => el.remove());
  // 計算問題の桁入力UIを畳む（通常モードでは .cs は空のまま＝×△○の自己採点に戻る）
  if (window.MecCalc) document.querySelectorAll('.qc .calc-input')
    .forEach(el => MecCalc.destroy(el.closest('.qc')));
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '🎓 試験モード'; modeBtn.classList.remove('exam-on'); modeBtn.onclick = openExamStart; }
  // ストリーク演出を即座にリセット（サマリーモーダルを隠さないよう）
  document.body.getAnimations?.().forEach(a => a.cancel());
  document.querySelectorAll('.streak-particle,.streak-ring,.exam-fx-temp,.mec-cfx,.exam-tierup,.exam-mark-pop,.rf-full').forEach(el => el.remove());
  { const _cd = document.getElementById('examCountdown'); if (_cd) { _cd.style.display = 'none'; _cd.innerHTML = ''; } }
  if (window.MecFX) window.MecFX.clear();
  // SRS復習ホストを隠す（誤答復習/再試験で再表示される。通常閲覧への漏れを防ぐ）
  window._srsHostHide?.();
  // サマリーを先に表示してから後処理（後処理でエラーが出てもモーダルが開く）
  try { showExamSummary(); } catch(e) { console.error('showExamSummary error:', e); document.getElementById('examOverlay')?.classList.add('open'); }
  _srsReviewMode = false;
  _todayWrongMode = false;
  _bossMode = false;
  _focusMode = false;
  // キューの索引は通常閲覧へ持ち越さない（examQueue は結果画面が読むので触らない）
  _examSet = new Set(); _examOrder = [];
  try { applyFilters(); } catch(e) {}
  try { _refreshExamLapUI(); } catch(e) {}
  try { if (window.MECSync) window.MECSync.pushToGist(); } catch(e) {}
}

// iOS: position:fixed はレイアウトビューポート(アドレスバーの裏まで)基準になり、dvh でも中央寄せが
// 実際の可視領域より上へずれ、モーダル上端が見切れる。visualViewport に合わせてオーバーレイの高さ・
// 位置を補正し可視領域の中央に来るようにする（PC等は offset=0 で従来同等）。
function _fitOverlayToVV(ov) {
  const vv = window.visualViewport;
  if (!ov || !vv) return;
  ov.style.height = vv.height + 'px';
  ov.style.width = vv.width + 'px';
  ov.style.transform = 'translate(' + vv.offsetLeft + 'px,' + vv.offsetTop + 'px)';
  const modal = ov.querySelector('.exam-modal');
  if (modal) modal.style.maxHeight = (vv.height - 24) + 'px';
}
function _bindOverlayVV(ov) {
  if (!ov || ov._vvBound || !window.visualViewport) return;
  ov._vvBound = true;
  const upd = () => { if (ov.classList.contains('open')) _fitOverlayToVV(ov); };
  window.visualViewport.addEventListener('resize', upd);
  window.visualViewport.addEventListener('scroll', upd);
}

function showExamSummary() {
  // 前回セッションの残骸（ランクスタンプ・復習完了バナー）を消してから描き直す
  document.querySelectorAll('#examOverlay .exam-rank-stamp, #examOverlay .exam-srs-done, #examOverlay .exam-srs-continue, #examOverlay .exam-boss-res, #examOverlay .exam-ward-res').forEach(el => el.remove());
  const titleEl = document.querySelector('#examOverlay h2');
  if (titleEl) titleEl.innerHTML =
    _srsReviewMode  ? '🔔 <span class="grad-txt">復習セッション結果</span>' :
    _todayWrongMode ? '🔁 <span class="grad-txt">今日の誤答 再履修の結果</span>' :
    _bossMode === true ? '🏛️ <span class="grad-txt">統合カンファレンスの結果</span>' :
    _bossMode ? '🏛️ <span class="grad-txt">統合カンファレンス 再検討の結果</span>' :
    _focusMode ? '🎯 <span class="grad-txt">弱点強化の結果</span>' :
                      '📊 <span class="grad-txt">セッション結果</span>';
  const elapsed = examStartTime ? Math.floor((_examActiveMs()) / 1000) : 0;
  const pct = examAnswered > 0 ? Math.round(examCorrect / examAnswered * 100) : 0;
  // スコアの色は章カードと同じ基準（80↑緑/60-79黄/60未満赤）。数字は0→pctへカウントアップし、
  // 周囲のconic-gradientリングも同時に伸びる（--p/--ringc は study.css の .exam-pct-ring が参照）
  const pctEl = document.getElementById('sumPct');
  const pctRing = document.getElementById('sumPctRing');
  const corEl = document.getElementById('sumCorrect');
  const wrnEl = document.getElementById('sumWrong');
  const ansEl = document.getElementById('sumAnswered');
  const timEl = document.getElementById('sumTime');

  const targetCorrect = examCorrect;
  const targetWrong = examAnswered - examCorrect;
  const targetAnswered = examAnswered;
  const targetSec = elapsed;

  const pctCol = pct >= 80 ? '#3DD68C' : pct >= 60 ? '#FFB830' : '#FF6B6B';
  if (pctEl) pctEl.style.color = pctCol;
  if (pctRing) { pctRing.style.setProperty('--ringc', pctCol); pctRing.style.setProperty('--p', 0); }

  /* S10(2026-08-21): ニキシー管は「数字が止まった瞬間に一度だけ」ともる＝結果が確定した合図。
     全数字（正答率・正解・不正解・回答・時間）のカウントアップ完了をまとめて確定の合図に使う。
     ⚠️ rAF が止まった時の落とし所を必ず置く。非表示タブでは rAF が1フレームも来ないので、
        保険が無いと**裏で終わったセッションの管が永久に点かない**（_tweenNum・countUp と同じ穴）。 */
  const _modal = document.querySelector('#examOverlay .exam-modal');
  if (_modal) _modal.classList.remove('tubes-lit');
  // リングが伸びる間に4つの数字を順に出す（出そろった状態が静止画）
  if (_modal && !_fxOff()) {
    _modal.querySelectorAll('.exam-detail-item').forEach((it, i) => it.animate(
      [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
      { duration: 420, delay: 360 + i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }
  let _countFinished = false;
  const _litTubes = () => {
    if (_countFinished) return;
    _countFinished = true;
    if (pctEl) pctEl.textContent = pct + '%';
    if (pctRing) pctRing.style.setProperty('--p', pct);
    if (corEl) corEl.textContent = targetCorrect;
    if (wrnEl) wrnEl.textContent = targetWrong;
    if (ansEl) ansEl.textContent = targetAnswered;
    if (timEl) timEl.textContent = Math.floor(targetSec / 60) + '分' + (targetSec % 60) + '秒';
    if (_modal) _modal.classList.add('tubes-lit');
  };

  // 初期値のセット
  if (pctEl) pctEl.textContent = '0%';
  if (corEl) corEl.textContent = '0';
  if (wrnEl) wrnEl.textContent = '0';
  if (ansEl) ansEl.textContent = '0';
  if (timEl) timEl.textContent = '0分0秒';

  if (pctEl || corEl || ansEl) {
    /* B(2026-09-24): リングは「線が描き進む」。先端に光る点（.exam-pct-tip）が付き、数字は同じ速さで数え上がる。
       箱の入場（examBoxIn .32s）が終わってから描き始める＝入ってくる途中で線が伸びて見えないように。
       ⚠️ 線は毎フレーム更新する（旧実装は3%刻みで、線がカクついて先端の点と合わなかった）。 */
    const delay = _fxOff() ? 0 : 280, dur = 1100;
    const t0 = performance.now() + delay;
    if (pctRing) {
      let tip = pctRing.querySelector('.exam-pct-tip');
      if (!tip) { tip = document.createElement('i'); tip.className = 'exam-pct-tip'; tip.setAttribute('aria-hidden', 'true'); pctRing.insertBefore(tip, pctRing.firstChild); }
      tip.style.opacity = pct > 0 ? '' : '0';
    }
    const tick = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      const ease = 1 - Math.pow(1 - k, 3);
      const curPct = Math.round(pct * ease);
      if (pctEl) pctEl.textContent = curPct + '%';
      if (pctRing) pctRing.style.setProperty('--p', (pct * ease).toFixed(2));
      if (corEl) corEl.textContent = Math.round(targetCorrect * ease);
      if (wrnEl) wrnEl.textContent = Math.round(targetWrong * ease);
      if (ansEl) ansEl.textContent = Math.round(targetAnswered * ease);
      if (timEl) {
        const s = Math.round(targetSec * ease);
        timEl.textContent = Math.floor(s / 60) + '分' + (s % 60) + '秒';
      }
      if (k < 1) requestAnimationFrame(tick); else _litTubes();
    };
    requestAnimationFrame(tick);
    setTimeout(_litTubes, delay + dur + 400);
  } else {
    _litTubes();
  }
  const subjEl = document.getElementById('sumSubjTable');
  if (subjEl) {
    // E2(2026-08-14): 数字だけの表に細いバーを重ねて、内訳が一目で読めるようにする。
    // バーは％セルの中に敷き、上から順に伸ばす（--i が遅延）。
    subjEl.innerHTML = Object.entries(examBySubj).map(([sid, s], i) => {
      const subj = STUDY_SUBJECTS.find(x => x.id === sid);
      const p = Math.round(s.correct / s.total * 100);
      const pc = p >= 80 ? '#7CEFB2' : p >= 60 ? '#FFD37A' : '#FF9B9B';
      return `<tr><td>${subj ? subj.icon + ' ' + subj.name : sid}</td><td style="font-weight:700">${s.correct}/${s.total}</td>` +
             `<td class="sum-pct" style="color:${pc}"><i class="sum-bar" style="--w:${p}%;--i:${i};--c:${pc}"></i><b>${p}%</b></td></tr>`;
    }).join('');
  }
  // 章別。どの章をやったかを科目別表の下に出す。sid→章番号順に並べる。
  const chapWrap = document.getElementById('sumChapWrap');
  const chapEl = document.getElementById('sumChapTable');
  if (chapEl) {
    const rows = Object.values(examByChapter)
      .sort((a, b) => a.sid === b.sid ? a.ch - b.ch : (a.sid < b.sid ? -1 : 1));
    if (chapWrap) chapWrap.style.display = rows.length ? '' : 'none';
    // 単一科目のセッションなら各行に科目名を繰り返さない（章番号だけで足りる）
    const multiSubj = new Set(rows.map(r => r.sid)).size > 1;
    chapEl.innerHTML = rows.map((s, i) => {
      const subj = STUDY_SUBJECTS.find(x => x.id === s.sid);
      const p = Math.round(s.correct / s.total * 100);
      const pc = p >= 80 ? '#7CEFB2' : p >= 60 ? '#FFD37A' : '#FF9B9B';
      const prefix = multiSubj && subj ? subj.icon + ' ' + subj.name + ' ' : '';
      const nm = _chapterName(s.sid, s.ch);   // MEC_CHAPTERS 由来の自データ（科目名と同じく生で入れる）
      const chLabel = '第' + s.ch + '章' + (nm ? ' ' + nm : '');
      return `<tr><td>${prefix}${chLabel}</td><td style="font-weight:700">${s.correct}/${s.total}</td>` +
             `<td class="sum-pct" style="color:${pc}"><i class="sum-bar" style="--w:${p}%;--i:${i};--c:${pc}"></i><b>${p}%</b></td></tr>`;
    }).join('');
  }
  /* B3: 難問（本番正答率60%未満）の成績。B4の予告 → B2の道中の印 → ここ、と
     同じ data-rate 1本が経路を貫く＝「難しいところに挑んだ」が3回別の形で返る。
     A1（難問クリアの刻印）とも世界観が揃う。 */
  const hardEl = document.getElementById('sumHardNote');
  if (hardEl) {
    const h = _examHardStat;
    if (h && h.answered > 0) {
      const hp = Math.round(h.correct / h.answered * 100);
      const hc = hp >= 80 ? '#7CEFB2' : hp >= 50 ? '#FFD37A' : '#FF9B9B';
      hardEl.style.display = '';
      hardEl.innerHTML = '<span class="hn-ic">🔥</span>難問 <b>' + h.answered + '</b> 問中 '
        + '<b style="color:' + hc + '">' + h.correct + '</b> 問正解'
        + '<span class="hn-sub">本番正答率' + EXAM_HARD_RATE + '%未満</span>';
    } else {
      hardEl.style.display = 'none';
      hardEl.innerHTML = '';
    }
  }
  const noteEl = document.getElementById('sumFlagNote');
  if (noteEl) noteEl.textContent = examWrong.length > 0 ? `🚩 ${examWrong.length}問を赤旗に自動登録しました` : '';
  const reviewBtn = document.getElementById('sumReviewBtn');
  const reviewCount = document.getElementById('sumReviewCount');
  if (reviewBtn) reviewBtn.style.display = examWrong.length > 0 ? '' : 'none';
  if (reviewCount) reviewCount.textContent = examWrong.length;
  const retryBtn = document.getElementById('sumRetryBtn');
  const retryCount = document.getElementById('sumRetryCount');
  if (retryBtn) retryBtn.style.display = examWrong.length > 0 ? '' : 'none';
  if (retryCount) retryCount.textContent = examWrong.length;
  const _ov = document.getElementById('examOverlay');
  _playResultSound();
  _ov.classList.add('open');
  _bindOverlayVV(_ov);
  _fitOverlayToVV(_ov);
  requestAnimationFrame(() => _fitOverlayToVV(_ov));
  // C10: スコアのカウントアップ完了後にランクスタンプを「ドン」と押す（S/A/B/C・100%はPERFECT）
  if (examAnswered > 0) {
    // B(2026-09-24): リングを描き終えて（280+1100ms）から押す。旧 950ms は描いている途中に落ちていた。
    setTimeout(() => _stampRank(pct), 1250);
  }
  /* スコアに応じた祝賀エフェクト（FXキャンバスはz9070＝モーダルより上に描画される）
     案3: スタンプ着地（約1205ms）の余韻後に発火させて負荷スパイクを分散。

     ⚠️⚠️ **ここは演出を大きくしてよい唯一の場所**（2026-08-31・§情報設計）。
     解答中の演出は「読解の邪魔になりうる」ので全画面レイヤーを1枚に絞ってあるが、
     結果画面は **読むべき本文がもう無い**うえ、セッションの終わりという滅多に来ない
     瞬間なので、制約が掛からない。派手さの置き場をここへ寄せている。
     ⚠️ それでも段は score で切ること。毎回フルで出すと「稀だから効く」が消える。 */
  if (examAnswered > 0 && window.MecFX && !_fxOff()) {
    try {
      const curUi = window.MecUITheme ? MecUITheme.get() : null;
      const _rb = _fxBand();
      if (pct >= 80) {
        // テーマ固有のクライマックス祝賀フィナーレ（80%以上）
        setTimeout(() => {
          if (curUi === 'kintsugi') {
            // 禅・金継ぎ: 黄金の金粉 ＋ 優美な桜吹雪の舞い
            if (window.MecFX.dust) window.MecFX.dust({ count: pct >= 100 ? 50 : 35, colors: ['#F5D061', '#D4AF37', '#FFFFFF', '#D9383A'] });
            if (window.MecFX.petals) window.MecFX.petals({ count: pct >= 100 ? 70 : 45, colors: ['#FFB7C5', '#FFCCD5', '#FFFFFF', '#F5D061'] });
            if (window.MecFX.rings) window.MecFX.rings(_rb.cx, _rb.cy, { count: 2, color: '#F5D061', thickness: 3, maxR: 260, additive: true });
          } else if (curUi === 'cyber') {
            // サイバー: デジタルホログラム花火 ＋ バイナリコードレイン
            if (window.MecFX.fireworks) window.MecFX.fireworks({ count: pct >= 100 ? 12 : 6, colors: ['#00FF66', '#00E5FF', '#FF007F', '#FFFFFF'], tier: 7 });
            if (window.MecFX.glyphRain) window.MecFX.glyphRain({ glyphs: ['0', '1', 'ｱ', 'ｶ', 'ｻ', 'ﾀ', 'ﾅ', '8', '9', 'A', 'F'], colors: ['#00FF66', '#00E5FF', '#39FF88'], count: pct >= 100 ? 28 : 18 });
            if (window.MecFX.glitchBars) window.MecFX.glitchBars(_rb.cx, _rb.cy, { count: 8, color: '#00FF66', w: _rb.width * 0.8, band: _rb });
          } else if (curUi === 'frost') {
            // 絶対零度: ダイヤモンドダスト ＋ 万華鏡氷晶カスケード
            if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(_rb.cx, _rb.cy, { count: pct >= 100 ? 40 : 25, color: '#70D6FF' });
            if (window.MecFX.confetti) window.MecFX.confetti({ count: pct >= 100 ? 120 : 60, colors: ['#70D6FF', '#FFFFFF', '#E0F2FE', '#A0E7E5'], big: true });
            if (window.MecFX.frostCrystalShatter) window.MecFX.frostCrystalShatter(_rb.cx, _rb.cy, { maxR: 280, dendriteCount: 10 });
          } else if (curUi === 'brass') {
            // 真鍮クロックワーク: 真鍮歯車の雨 ＋ ゴールドコインシャワー
            if (window.MecFX.gearRain) window.MecFX.gearRain({ count: pct >= 100 ? 24 : 14, colors: ['#FFD700', '#FFA040', '#C9A227'] });
            if (window.MecFX.confetti) window.MecFX.confetti({ count: pct >= 100 ? 100 : 50, colors: ['#FFD700', '#FFA040', '#C9A227', '#FFFFFF'], big: true });
            if (window.MecFX.steam) window.MecFX.steam(_rb.cx, _rb.cy + 40, { count: 5, rise: 80, w: 50 });
          } else if (curUi === 'abyss') {
            // 深海アビス: 深海発光生物群（エメラルド気泡 ＋ ソナーパルス）の幻想的浮上
            if (window.MecFX.bubbles) window.MecFX.bubbles(_rb.cx, _rb.cy, { count: pct >= 100 ? 50 : 30, colors: ['#00FFA3', '#00B4D8', '#64FFDA', '#FFFFFF'] });
            if (window.MecFX.abyssSonarPulse) window.MecFX.abyssSonarPulse(_rb.cx, _rb.cy, { maxR: 320, marineSnowCount: 30 });
            if (window.MecFX.rings) window.MecFX.rings(_rb.cx, _rb.cy, { count: 3, color: '#00FFA3', thickness: 3, maxR: 280, additive: true });
          } else if (curUi === 'celestial') {
            // 賢者の星図: 天球儀の幾何学星図 ＋ 満天の星屑シャワー
            if (window.MecFX.celestialAstrolabe) window.MecFX.celestialAstrolabe(_rb.cx, _rb.cy, { maxR: 300, sparkleCount: 35 });
            if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(_rb.cx, _rb.cy, { count: pct >= 100 ? 40 : 25, color: '#FFD166' });
            if (window.MecFX.confetti) window.MecFX.confetti({ count: pct >= 100 ? 100 : 50, colors: ['#FFD166', '#8A2BE2', '#48CAE4', '#FFFFFF'] });
          } else if (curUi === 'aurora') {
            // オーロラグラス: 極光プリズムスイープ ＋ 虹色コンフェッティ
            if (window.MecFX.auroraPrismSweep) window.MecFX.auroraPrismSweep(_rb.cx, _rb.cy, { maxR: 300, sparkleCount: 35 });
            if (window.MecFX.confetti) window.MecFX.confetti({ count: pct >= 100 ? 140 : 70, colors: ['#00DFD8', '#7928CA', '#0070F3', '#FF0080', '#FFFFFF'], big: true });
            if (window.MecFX.diamondSparkle) window.MecFX.diamondSparkle(_rb.cx, _rb.cy, { count: 25, color: '#00DFD8' });
          } else if (curUi === 'liquid') {
            // 幻想リキッド: フルイドインクリプル ＋ ネオンバブル
            if (window.MecFX.liquidBloomRipple) window.MecFX.liquidBloomRipple(_rb.cx, _rb.cy, { maxR: 300, bubbleCount: 25 });
            if (window.MecFX.bubbles) window.MecFX.bubbles(_rb.cx, _rb.cy, { count: pct >= 100 ? 40 : 25, colors: ['#FF007F', '#7928CA', '#00DFD8', '#FF7A00'] });
            if (window.MecFX.confetti) window.MecFX.confetti({ count: pct >= 100 ? 100 : 50, colors: ['#FF007F', '#7928CA', '#00DFD8', '#FFFFFF'] });
          } else {
            // クラシック花火フォールバック
            window.MecFX.fireworks({ count: pct >= 100 ? 16 : 5, colors: ['#FFD700', '#FFF3C4', '#3DD68C', '#60A5FA'], tier: 7 });
            window.MecFX.confetti({ count: pct >= 100 ? 240 : 80, colors: ['#FFD700', '#FFF3C4', '#3DD68C', '#60A5FA'], big: true });
          }
        }, 1550);   // スタンプ（1250ms）の後。gamify の静粛時間 CER_SETTLE_MS(2000) より前に収める
      } else if (pct >= 60) {
        setTimeout(() => {
          if (curUi === 'brass' && window.MecFX.steam) {
            window.MecFX.steam(_rb.cx, _rb.cy, { count: 3, rise: 60 });
          } else if (curUi === 'cyber' && window.MecFX.glitchBars) {
            window.MecFX.glitchBars(_rb.cx, _rb.cy, { count: 4, color: '#00E5FF', band: _rb });
          } else if (curUi === 'kintsugi' && window.MecFX.dust) {
            window.MecFX.dust({ count: 18, colors: ['#F5D061', '#D4AF37'] });
          } else {
            window.MecFX.confetti({ count: 40, colors: ['#60A5FA', '#FFB830', '#3DD68C'] });
          }
        }, 1550);   // スタンプ（1250ms）の後。gamify の静粛時間 CER_SETTLE_MS(2000) より前に収める
      } else {
        setTimeout(() => {
          window.MecFX.rings(_rb.cx, _rb.cy, { count: 2, color: 'rgba(96,165,250,.85)', thickness: 3, maxR: 150, additive: true });
        }, 1550);   // スタンプ（1250ms）の後。gamify の静粛時間 CER_SETTLE_MS(2000) より前に収める
      }
    } catch (e) {}
  }
  // C11: SRS復習セッションを完走した時だけの完了演出（習慣化に一番効く場所）
  if (_srsReviewMode && examAnswered > 0 && examAnswered >= examQueue.length) {
    // 上限で切っている場合、この時点の残りdueを数え直す（解いた分は次回日付へ繰り延べ済み）
    const _rest = window._srsDueRemaining ? window._srsDueRemaining() : 0;
    const note = document.getElementById('sumFlagNote');
    if (note) {
      note.insertAdjacentHTML('beforebegin',
        '<div class="exam-srs-done">🔔 今日の復習、完了！' +
        '<span>' + examAnswered + '問すべて消化しました' +
        (_rest > 0 ? ' ／ 残り ' + _rest + '問' : '') + '</span></div>');
      // E1: 完了バナーの直後に「次に戻ってくる日」の分布を出す
      _srsRenderNextPlan(note.previousElementSibling);
    }
    if (_rest > 0) {
      const btn = document.getElementById('sumReviewBtn');
      if (btn && btn.parentNode) {
        const cont = document.createElement('button');
        cont.className = 'exam-review-btn exam-srs-continue';
        cont.textContent = '🔔 続けて次の' + Math.min(_rest, 50) + '問';
        cont.onclick = () => { _closeSummaryOverlayOnly(); setTimeout(() => window.startSRSReview?.(), 120); };
        btn.parentNode.insertBefore(cont, btn);
      }
    }
    setTimeout(_srsCompleteCelebration, 700);
  }
  // 今日の誤答の再履修を完走したとき。誤答が上限（50問）を超えた日は続きの区間があるので
  // SRS復習と同じ形の「続けて次の50問」を出す。
  // ⚠️ 残りの数え方だけが SRS と違う。今日の誤答は解き直しても集合から消えない（今日落とした
  //    問題すべてが対象）ので、集合の大きさではなく未出題の位置で数える（study.html の
  //    _todayWrongDone）。SRS の _srsDueRemaining をここで使うと常に0になる。
  if (_todayWrongMode && examAnswered > 0 && examAnswered >= examQueue.length) {
    const _rest = window._todayWrongRemaining ? window._todayWrongRemaining() : 0;
    const note = document.getElementById('sumFlagNote');
    if (note) {
      note.insertAdjacentHTML('beforebegin',
        '<div class="exam-srs-done">🔁 今日の取りこぼし、やり直し完了！' +
        '<span>' + examAnswered + '問中 ' + examCorrect + '問を正解しました' +
        (_rest > 0 ? ' ／ 未出題 残り ' + _rest + '問' : '') + '</span></div>');
    }
    if (_rest > 0) {
      const btn = document.getElementById('sumReviewBtn');
      if (btn && btn.parentNode) {
        const _lim = (typeof TODAY_WRONG_LIMIT !== 'undefined' ? TODAY_WRONG_LIMIT : 50);
        const cont = document.createElement('button');
        cont.className = 'exam-review-btn exam-srs-continue';
        cont.textContent = '🔁 続けて次の' + Math.min(_rest, _lim) + '問';
        cont.onclick = () => { _closeSummaryOverlayOnly(); setTimeout(() => window.startTodayWrongReview?.({ continue: true }), 120); };
        btn.parentNode.insertBefore(cont, btn);
      }
    }
    setTimeout(_srsCompleteCelebration, 700);
    if (examCorrect === examAnswered && window.MecFX && !_fxOff()) {
      setTimeout(() => {
        const { cx, cy } = _fxBand();
        window.MecFX.burst(cx, cy, {
          count: 18,
          shapes: ['shard', 'gem', 'square'],
          colors: ['#FFD700', '#FFA040', '#FFFFFF', '#C9A227'],
          gravity: 1200,
          speed: 680,
          scale: 1.2
        });
      }, 1050);
    }
  }
  // 週次「章別試験80%以上を3章」ミッション用。下のブロックが _examActiveChPrefix を null に
  // 戻すので、gamify へ渡すぶんを先に控えておく。
  const _gmChPrefix = _examActiveChPrefix;
  // Save per-chapter exam history when a single chapter was tested
  if (_examActiveChPrefix && examAnswered > 0) {
    try {
      const hist = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}');
      const e = hist[_examActiveChPrefix] || { sessions: 0, bestScore: 0 };
      hist[_examActiveChPrefix] = {
        lastDate: _today(),
        sessions: (e.sessions || 0) + 1,
        lastScore: pct,
        lastCorrect: examCorrect,
        lastTotal: examAnswered,
        bestScore: Math.max(e.bestScore || 0, pct)
      };
      localStorage.setItem('mec_ch_exam_v1', JSON.stringify(hist));
    } catch(e) {}
    _examActiveChPrefix = null;
  }
  // ボス戦の勝敗を結果画面の先頭に出す（boss.js）
  if (_bossMode === true) { try { window.MecBoss?.decorateSummary?.(); } catch (e) {} }
  // 病棟回診の転帰と確信度の的中（ward.js）
  if (_srsReviewMode) { try { window.MecWard?.decorateSummary?.(); } catch (e) {} }
  // このセッションで新しく「定着」した問題を1件の通知にまとめて授与トレイへ（trophy.js）
  try { window.MecTrophy?.flushSession?.(); } catch {}
  try { window.MecGamify?.onExamFinish?.(examAnswered, examCorrect, { chPrefix: _gmChPrefix }); } catch {}
  // Exam-to-Hub Absorber: 直前の学習成果をハブ帰還演出（Exam-to-Hub Absorber）用に記録
  if (examAnswered > 0) {
    try {
      sessionStorage.setItem('mec_absorb_payload_v1', JSON.stringify({
        count: examAnswered,
        correct: examCorrect,
        pct: pct,
        xp: examAnswered * 10 + examCorrect * 15,
        ts: Date.now()
      }));
    } catch(e) {}
  }
}

function closeExamSummary() {
  /* B5: 「閉じる」に余韻を付ける。即座に消えると、直前まで見ていた数字が
     どこへ行ったのか分からないまま元の一覧に放り出される。 */
  const ov = document.getElementById('examOverlay');
  if (ov && !_fxOff()) {
    ov.classList.add('closing');
    setTimeout(() => ov.classList.remove('open', 'closing'), 320);
  } else if (ov) {
    ov.classList.remove('open');
  }
  // B5: 戻った先で、今解いた問題が成績付きで並び直す（誤答が赤く残る）
  _applyRecapChipsSoon();
  // 復習モードで起動していた場合、通常閲覧に戻る時点で全科目ロードを開始する
  // （通常フローでは初期化済みのため no-op）。
  window._runDeferredInit?.();
  // 復習のために科目カードを解放していた場合は読み直す（_runDeferredInit は
  // 既に全体初期化が済んでいるケースでは何もしないため、こちらが本命の復帰経路）。
  window._srsRestoreAfterReview?.();
}

/* ══ 新・演出特化10選のヘルパー群 ══ */

/* 【案7】ダイナミック環境ライティング（朝・夕・深夜宿直室） */
function _applyEnvLighting() {
  const h = new Date().getHours();
  document.body.classList.remove('env-morning', 'env-sunset', 'env-nightshift');
  if (h >= 6 && h < 11) document.body.classList.add('env-morning');
  else if (h >= 17 && h < 20) document.body.classList.add('env-sunset');
  else if (h >= 23 || h < 5) document.body.classList.add('env-nightshift');
}
try { _applyEnvLighting(); } catch (e) {}

/* ══════════════════════════════════════════════════════════════════════════
   正解・誤答の演出（2026-09-24 に旧演出から置き換え）
   ══════════════════════════════════════════════════════════════════════════
   2026-09-24 に切り替えスイッチ（mec_fx_style_v1）で旧演出と実機比較し、こちらを採用して旧経路を削除した。

   正解：同じ量の演出を「正解の肢から、順番に」出す。
     0ms   正解の肢の縁を光が1周（.rf-sweep）
     200ms UIテーマ固有の演出（照準・金継ぎ・氷晶…）を**肢の位置で**出す
     240ms 連続数が文字の組み方で出る（#examRfStreak・絵文字と「！」を使わない）
   やめたもの：全画面フラッシュ・画面の揺れ・浮遊コンボ・外周パルス・散らばった位置の粒子。
     その分をテーマ固有演出（肢の位置で・段に応じて大きく）へ振り替えた。

   誤答：答えを見せずに選び直させる（2026-09-24 ユーザー判断）。
     - 1回目の誤答で採点・記録を済ませる（不正解。myrate・SRS・attempts・今日の誤答）。
       ⚠️ 2回目以降のクリックは採点経路に通さない＝記録は必ず1回目の結果。
     - 外した肢は × が付いて押せなくなる（.exam-out）。何回でも選び直せる。
     - カードの「▶ 答えを見る」で打ち切れる。計算問題は入力し直して再確定する。
     - カードは .exam-retry の間 exam-revealed を持たない（焦点も次へ進まない）。
     ⚠️ 選択肢に水平の線を作らないこと（下線部はこの教材で意味を持つ）。× は右端の文字だけ。 */

/* 動きの規則（2026-09-24・案1）。加減速は「入る・出る・押す」の3つ、長さは3段だけ。
   ⚠️ 正本は vars.css の --ease-out / --ease-in / --ease-spring と --dur-micro / --dur-short / --dur-long。
      WAAPI（element.animate）は var() を読めないのでここに写しを持つ。値を変えたら両方直すこと
      （_work/test_rf_polish.js が一致を見張る）。
   ⚠️ この節（正解・誤答の演出）に cubic-bezier を直に書かないこと。長い振り付け（縁の光の1周・
      連続数の滞在）だけは名前付きの定数で持つ。 */
const MO = {
  out: 'cubic-bezier(.16,1,.3,1)',     // 入る（既定）
  in: 'cubic-bezier(.7,0,.84,0)',       // 出る
  spring: 'cubic-bezier(.3,1.4,.5,1)',  // 押す・段が上がる・印が付く
  d1: 120, d2: 220, d3: 420
};
const RF_DESAT_MS = 900;   // 誤答でカードの彩度が一瞬落ちて戻る長さ
/* UIテーマごとの色と連続数の言葉。色は _traceCardBorder と同じ系統（テーマの主色）。 */
const RF_THEME = {
  aurora:    { col: '#00DFD8', lbl: 'STREAK' },
  brass:     { col: '#FFD700', lbl: 'CONSECUTIVE' },
  cyber:     { col: '#00FF66', lbl: 'SYNC' },
  liquid:    { col: '#FF4FA3', lbl: 'FLOW' },
  kintsugi:  { col: '#F5D061', lbl: '連続' },
  celestial: { col: '#FFD166', lbl: 'ALIGNED' },
  abyss:     { col: '#00FFA3', lbl: 'DEPTH' },
  frost:     { col: '#9EE3FF', lbl: 'CRYSTAL' }
};
function _rfUi() { return (window.MecUITheme && MecUITheme.get()) || 'aurora'; }
function _rfTheme() { return RF_THEME[_rfUi()] || RF_THEME.aurora; }
function _rfCenter(el) {
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  if (!r || !r.width) { const b = _fxBand(); return { x: b.cx, y: b.cy }; }
  const [x, y] = _examClampFxXY(r.left + r.width / 2, r.top + r.height / 2);
  return { x, y };
}

/* 肢の左端（番号の列の中）。本文の上を光が横切らないように、ここを通り道にする。 */
function _rfEdge(el) {
  const r = el.getBoundingClientRect();
  const [x, y] = _examClampFxXY(r.left + Math.min(22, r.width * .08), r.top + r.height / 2);
  return { x, y };
}

/* 0ms：正解の肢の縁を光が1周する。肢の子要素として足す（.qc の疑似要素は満杯）。 */
function _rfSweep(el, ms) {
  if (!el || _fxOff()) return;
  el.querySelectorAll(':scope > .rf-sweep').forEach(s => s.remove());
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const s = document.createElement('span');
  s.className = 'rf-sweep';
  s.style.setProperty('--rf-c', _rfTheme().col);
  if (ms) s.style.setProperty('--rf-sweep-t', ms + 'ms');   // 正解の直後はカードを送る前に1周を終える（_rfCorrectFx）
  el.appendChild(s);
  _fxTimeout(() => s.remove(), ms ? ms + 20 : 900);
}

/* 連続数の表示（旧 #examStreakToast の後継）。UIテーマ8種ぶんの書体・枠は study.css の #examRfStreak。 */
function _rfStreakEl() {
  let el = document.getElementById('examRfStreak');
  if (!el) {
    el = document.createElement('div');
    el.id = 'examRfStreak';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}
/* 桁が縦に回る数字。前の値の桁（--from）から今の値の桁（--to）へ回す。 */
function _rfDigits(prev, n) {
  const s = String(n), p = String(Math.max(0, prev)).padStart(s.length, ' ');
  return [...s].map((d, i) => {
    const from = p[i] === ' ' ? 0 : +p[i];
    return '<span class="rf-d"><span class="rf-col" style="--from:' + from + ';--to:' + d + ';--i:' + (s.length - 1 - i) + '">' +
      '0123456789'.split('').map(x => '<span>' + x + '</span>').join('') + '</span></span>';
  }).join('');
}
/* saved＝誤答で猶予を使った表示（数は回さず据え置き・「次も外すと0」を添える）。 */
function _rfShowStreak(n, tier, promoted, saved) {
  if (_fxOff()) return;
  const el = _rfStreakEl();
  const ui = _rfUi(), th = _rfTheme(), et = _examTheme();
  el.getAnimations?.().forEach(a => a.cancel());
  el.style.removeProperty('opacity');
  el.dataset.ui = ui;
  el.classList.toggle('is-saved', !!saved);
  el.style.setProperty('--rf-c', th.col);
  el.style.setProperty('--rf-tier', tier);
  const ticks = Array.from({ length: 7 }, (_, i) => '<i class="' + (i < tier ? 'on' : '') + (i === tier - 1 && promoted ? ' up' : '') + '"></i>').join('');
  // 段が上がった瞬間だけ右に「TIER n / テーマの言葉」を2行で添える（箱の外へ出さない＝問題文に掛からない）
  const esc = t => String(t).replace(/[<>&]/g, '');
  let sub = '';
  if (saved) sub = '<b>猶予を使用</b><span>次も外すと0に</span>';
  else if (tier >= 2 && promoted) {
    const w = et.tierUpLabel && et.tierUpLabel(tier);
    sub = '<b>TIER ' + tier + '</b>' + (w ? '<span>' + esc(w) + '</span>' : '');
  } else if (ui === 'abyss') sub = '<b>' + (n * 100) + ' m</b>';
  el.innerHTML =
    '<span class="rf-n">' + _rfDigits(saved ? n : n - 1, n) + '</span>' +
    '<span class="rf-side"><span class="rf-l">' + th.lbl + '</span><span class="rf-t">' + ticks + '</span></span>' +
    (sub ? '<span class="rf-sub">' + sub + '</span>' : '');
  el.style.top = _rfStreakTop(el.offsetHeight) + 'px';
  // 桁は描いた後に目標へ回す（入った瞬間の位置が --from）。rAF が止まる裏タブ用に setTimeout も張る。
  const go = () => el.querySelectorAll('.rf-col').forEach(c => c.classList.add('go'));
  requestAnimationFrame(go);
  setTimeout(go, 60);
  const hold = 1300 + tier * 180 + (promoted ? 600 : 0);
  const total = hold + 520;
  el.animate([
    { opacity: 0, translate: '-50% -6px' },
    { opacity: 1, translate: '-50% 0', offset: 240 / total },
    { opacity: 1, translate: '-50% 0', offset: (hold + 240) / total },
    { opacity: 0, translate: '-50% -4px' }
  ], { duration: total, easing: MO.out, fill: 'forwards' });
  if (promoted) {
    const n0 = el.querySelector('.rf-n');
    if (n0) n0.animate([{ scale: '1.18' }, { scale: '1' }], { duration: MO.d3, easing: MO.spring });
  }
}
/* 連続数の置き場（G・2026-09-24）。ヘッダーの下端に**下から重ねる**。
   ⚠️ 問題文の側（_fxBand().top より下）へ出さないこと。正解すると次のカードがヘッダー直下へ
      自動スクロールされるので、そこに1.3〜2.8秒居座ると次の問題の番号行と1行目に被る
      （iPad 縦で実測）。ヘッダーの帯（科目チップ・進捗バー）は読んでいる本文ではないので隠してよい。
   ヘッダーが箱より低い（横向きの iPhone 等）ときだけ可視域の上端へ寄せる。 */
function _rfStreakTop(h) {
  const hb = _examFxHeaderBottom();
  const vTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
  return Math.max(vTop + 4, Math.round(hb - (h || 58) - 4));
}
function _rfHideStreak() {
  const el = document.getElementById('examRfStreak');
  if (!el) return;
  el.getAnimations?.().forEach(a => a.cancel());
  el.style.opacity = '0';
}

/* 正解（初回で正解したとき）。revealAnswer（単一・複数選択）と _revealCalcAnswer から呼ぶ。
   budget＝次のカードへ送るまでの ms（RF_ADVANCE_MS）。肢の中で出す演出（肢の縁の光・UIテーマ固有の演出の肢の層）は
   この時間内に終える。UIテーマ固有の演出のうちカードの中で出していた層は全画面でラボの尺のまま（_rfFullHost）。 */
function _rfCorrectFx(card, el, budget) {
  const inCardMs = Math.max(60, (budget || RF_ADVANCE_MS.one) - RF_FX_END_MARGIN);
  const n = examStreak, tier = _examTier(n);
  _applyCardThemeComboFx(card, n);   // カードの状態クラス・触覚
  if (_fxOff()) return;
  const prevTier = (n - 1) < 2 ? 0 : _examTier(n - 1);
  const promoted = tier > prevTier;

  // 0ms：光は正解の肢から
  _rfSweep(el, inCardMs);
  if (_rfUi() === 'liquid') _lqLiquidFx(el, card, tier, promoted, budget);   // ぷるん＋シャボン玉＋ガラスの衝撃波＋色収差＋ネオン管（_spawnStreakParticles の liquid 分岐を参照）
  else if (_rfUi() === 'frost') _frFrostFx(el, card, tier, promoted, budget);   // 雪の結晶・霜・ダイヤモンドダスト（同上の frost 分岐を参照）
  else if (_rfUi() === 'celestial') _clxCelestialFx(el, card, tier, promoted, budget);   // 超新星か銀河の渦（セッションごと・肢の左端）＋星の軌跡／十二宮の輪／星の網／経緯線から正解のたびに1つ
  else if (_rfUi() === 'brass') _brsBrassFx(el, card, tier, promoted, budget);   // 歯車列＋刻印＋鋳込みの唐草（同上の brass 分岐を参照）
  else if (_rfUi() === 'abyss') _abyAbyssFx(el, card, tier, promoted, budget);   // ソナーの反響（肢の左端）＋ホタルイカの群れ（全画面）
  _afterCorrectFx(card, el);

  // 肢から連続数へ光が走る演出（80ms・MecFX.ribbon）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。

  // 200ms：UIテーマ固有の演出を肢の位置で（段に応じて大きく）
  _fxTimeout(() => {
    const p = _rfCenter(el);
    // テーマ固有演出（照準・金継ぎ・氷晶・歯車…）＋粒子。_correctShockwave と同じ意匠が中に入っているので
    // 両方呼ぶと同じ演出が2つ重なる＝こちらだけにする。1問目（tier0）も tier1 の規模で出す。
    _spawnStreakParticles(Math.max(1, tier), p, { el, card, promoted });
  }, 200);

  // 240ms：連続数
  if (n >= 2) _fxTimeout(() => _rfShowStreak(n, tier, promoted), 240);
  /* 2026-09-28 に全テーマ共通の演出を整理して外した: 肢の明るさフラッシュ・ゾーンの粒子と絵文字・
     グリッチ帯・墨のスワイプ・暗転（タイムストップ）・背景の呼吸・神速の稲妻。テーマ固有の演出と重なって
     「ページで決めた演出どおりに見えない」原因になっていたため（ユーザー判断）。戻さないこと。
     同日、デモページで1つずつ見て、正解音の輪・肢から走る光・カード外周の光・コンボメーター・
     ゾーン・オーバードライブ・覚醒・速答・初見・リベンジ・当て板・立て直しも外した。 */
}

/* ── 誤答 → 選び直し ── */
function _rfRetryNote(card, tries, calc) {
  let note = card.querySelector('.rf-retry');
  if (!note) {
    note = document.createElement('div');
    note.className = 'rf-retry';
    const btn = card.querySelector('.exam-reveal-btn');
    const cs = card.querySelector('.cs');
    if (btn && btn.parentNode) btn.parentNode.insertBefore(note, btn);
    else if (cs) cs.after(note);
    else card.appendChild(note);
  }
  note.innerHTML = '<span><b>' + tries + (calc ? '回外しました。' : 'つ外しました。') + '</b>' +
    (calc ? '入力し直して確定してください。' : '残りの肢から選び直してください。') + '</span>' +
    (calc ? '<button type="button" class="rf-give">答えを見る</button>' : '');
  const g = note.querySelector('.rf-give');
  if (g) g.onclick = (e) => { e.stopPropagation(); _rfGiveUp(card); };
  if (!_fxOff()) note.animate([{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], { duration: MO.d2, easing: MO.out });
}

/* 1回目の誤答の採点。revealAnswer の不正解の枝と同じ記録を行い、答えは開かない。 */
function _rfScoreWrong(card, choiceStr, choiceEl) {
  const uid = card.dataset.uid;
  const sid = uid.split('_ch')[0];
  if (!examBySubj[sid]) examBySubj[sid] = { correct: 0, total: 0 };
  examAnswered++;
  examBySubj[sid].total++;
  _tallyChapter(uid, false);
  _tallyQuestion(card, false);
  _markExamDone(uid);
  _recordMyRate(uid, false);
  _logAttempt(card, false, choiceStr);
  if (!_isScoreExcluded(card)) _updateSRS(uid, false);
  if (choiceEl) {
    const t = (choiceEl.textContent || '').trim();
    if (typeof _recordWrongChoice === 'function') _recordWrongChoice(uid, t.charAt(0) || '?');
    _examSessionWrongChoices.set(uid, t);
  }
  // 猶予が残っていれば連続数を保つ（猶予を使い切った状態でもう一度外したら0）
  const saved = examStreak > 0 && examStreakGrace;
  if (saved) examStreakGrace = false;
  else examStreak = 0;
  try {
    // 誤答は静かに：赤いフラッシュも揺れも出さず、連続の状態だけを畳む
    card.classList.remove('fx-correct');
    _clearDarkFx();
    if (saved) {
      if (examStreak >= 2) _rfShowStreak(examStreak, _examTier(examStreak), false, true);
      else _rfHideStreak();
    } else {
      document.querySelectorAll('.qc.combo-streak-3,.qc.combo-streak-5,.qc.combo-streak-10')
        .forEach(c => c.classList.remove('combo-streak-3', 'combo-streak-5', 'combo-streak-10'));
      _rfHideStreak();
    }
    if (choiceEl && _isRepeatWrongChoice(uid, choiceEl)) _fxTimeout(() => _triggerRepeatWrong(choiceEl), 260);
  } catch (err) { console.error('[ExamFx] Error in refined wrong fx:', err); }
  examWrong.push(uid);
  card.classList.add('exam-retry');
  card._rfTries = 0;
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn && !(window.MecCalc && MecCalc.isCalc(card))) revBtn.textContent = '▶ 答えを見る';
  try { _updateExamProg(); } catch (e) {}
  try { _saveExamResume(); } catch (e) {}
}

/* 外した肢を消す（1回目なら採点も）。 */
function _rfWrongPick(card, ch, choiceStr) {
  ch.classList.remove('exam-selected');
  ch.classList.add('exam-out');
  ch.setAttribute('aria-disabled', 'true');
  if (!ch.querySelector(':scope > .rf-x')) {
    const x = document.createElement('span');
    x.className = 'rf-x';
    x.textContent = '×';
    ch.appendChild(x);
    if (!_fxOff()) x.animate([{ opacity: 0, scale: '.6' }, { opacity: 1, scale: '1' }], { duration: MO.d2, easing: MO.spring });
  }
  if (!card.classList.contains('exam-retry')) _rfScoreWrong(card, choiceStr, ch);
  card._rfTries = (card._rfTries || 0) + 1;
  _rfRetryNote(card, card._rfTries, false);
  if (_getRequiredCount(card) > 1) _updateMultiInfo(card);
  if (!_fxOff()) {
    ch.animate([{ translate: '0 0' }, { translate: '-3px 0' }, { translate: '2px 0' }, { translate: '0 0' }], { duration: MO.d2, easing: MO.out });
    card.animate([{ filter: 'saturate(1) brightness(1)' }, { filter: 'saturate(.6) brightness(.95)', offset: .3 }, { filter: 'saturate(1) brightness(1)' }], { duration: RF_DESAT_MS, easing: MO.out });
  }
}

/* 選び直しの末に正解した／打ち切った。どちらも記録は1回目の不正解のまま。 */
function _rfFinishRetry(card, msgHtml) {
  card.classList.remove('exam-retry');
  card.classList.add('exam-revealed', 'exam-rf-done');
  if (!card.querySelector('.rf-retry')) _rfRetryNote(card, 0, false);
  const note = card.querySelector('.rf-retry');
  if (note) { note.classList.add('is-done'); note.innerHTML = '<span>' + msgHtml + '</span>'; }
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn) { revBtn.textContent = '▼ 解答を隠す'; revBtn.onclick = () => _toggleWrongAnswer(card, revBtn); }
  try { _updateExamProg(); } catch (e) {}
  try { _saveExamResume(); } catch (e) {}
  requestAnimationFrame(_updateExamFocus);
  _maybeShowFinishBtn();
}
function _rfLateCorrect(card, els) {
  const tries = (card._rfTries || 1) + 1;
  (els || []).forEach(e => e.classList.add('exam-selected', 'correct'));
  const calc = window.MecCalc && MecCalc.isCalc(card);
  if (calc) MecCalc.lock(card, true);
  const at = (els && els[0]) || (calc && MecCalc.anchor(card)) || null;
  _rfSweep(at);
  _rfReachFx(at, tries, !calc);
  _rfFinishRetry(card, '<b>' + tries + '回目で正解。</b>記録は不正解のまま残ります（連続正解は途切れています）。');
}
/* F(2026-09-24): 選び直してたどり着いた手応え。祝わない（音・粒子の雨・連続数は出さない）が、
   縁の光だけだと「押したのに何も起きない」に見えたので、肢の右端に「N回目」の印と小さな輪を1つ足す。
   ⚠️ 記録は触らない（1回目の不正解のまま）。印は × と同じ右端の文字＝水平の線は作らない。 */
function _rfReachFx(at, tries, mark) {
  if (!at || _fxOff()) return;
  if (mark && !at.querySelector(':scope > .rf-reach')) {
    const k = document.createElement('span');
    k.className = 'rf-reach';
    k.textContent = tries + '回目で正解';
    at.appendChild(k);
    k.animate([{ opacity: 0, translate: '6px 0' }, { opacity: 1, translate: '0 0' }], { duration: MO.d3, easing: MO.out });
  }
  at.animate([{ scale: '1' }, { scale: '1.012' }, { scale: '1' }], { duration: MO.d3, easing: MO.spring });
  if (window.MecFX && window.MecFX.rings) {
    const r = (at.querySelector(':scope > .rf-reach') || at).getBoundingClientRect();   // 印があれば印から
    const [x, y] = _examClampFxXY(r.left + r.width / 2, r.top + r.height / 2);
    window.MecFX.rings(x, y, { count: 1, color: _rfTheme().col, thickness: 2, maxR: 64, additive: true });
  }
}
function _rfGiveUp(card) {
  if (!card.classList.contains('exam-retry')) return;
  const calc = window.MecCalc && MecCalc.isCalc(card);
  if (calc) MecCalc.lock(card, false);
  // 最後に外した肢から正解の肢へ光が滑る（視線を答えへ運ぶ）
  const outs = card.querySelectorAll('.ch2.exam-out');
  const from = outs[outs.length - 1];
  const to = card.querySelector('.ch2.ok');
  if (!calc && from && to && !_fxOff() && window.MecFX && window.MecFX.ribbon) {
    // H(2026-09-24): 肢の左端（番号の列）どうしを結ぶ。旧実装は「中心から左へ40px」固定で、
    //   幅の広い画面では肢の本文の上を横切っていた。
    const a = _rfEdge(from), b = _rfEdge(to);
    window.MecFX.ribbon(a.x, a.y, b.x, b.y, { color: '#3DD68C', width: 2.6, ttl: .55, bow: 26 });
  }
  _rfFinishRetry(card, '<b>答えを表示しました。</b>記録は不正解として残ります。');
}

/* 肢を選ばずに「▶ 解答を見る」（または Enter）で開いた＝答えを見た。不正解として記録して開く。
   ⚠️ 2026-09-24 まではこの操作が「正解の肢を選んだ」扱いになり、正解として記録されていた
      （revealAnswer が選択の無いカードで .ch2.ok を拾っていた）。 */
function _rfRevealUnanswered(card) {
  if (card.classList.contains('exam-revealed') || card.classList.contains('exam-retry')) return;
  _rfScoreWrong(card, '', null);
  _rfFinishRetry(card, '<b>答えを表示しました。</b>記録は不正解として残ります。');
}

/* 計算問題の採点（誤答・選び直し）。_revealCalcAnswer から呼び、処理したら true を返す。 */
function _rfCalcSubmit(card, g) {
  if (card.classList.contains('exam-retry')) {
    if (g.correct) _rfLateCorrect(card, []);
    else { card._rfTries = (card._rfTries || 1) + 1; MecCalc.shake(card); _rfRetryNote(card, card._rfTries, true); }
    return true;
  }
  if (g.correct) return false;   // 初回で正解＝従来の経路で採点する
  _rfScoreWrong(card, g.entered, null);
  _examSessionWrongChoices.set(card.dataset.uid, g.display);
  card._rfTries = 1;
  MecCalc.shake(card);
  _rfRetryNote(card, 1, true);
  if (!_fxOff()) card.animate([{ filter: 'saturate(1) brightness(1)' }, { filter: 'saturate(.6) brightness(.95)', offset: .3 }, { filter: 'saturate(1) brightness(1)' }], { duration: RF_DESAT_MS, easing: MO.out });
  return true;
}

/* 選択肢のクリック（_examChoiceClick から渡される。数字キーもここを通る）。 */
function _rfChoiceClick(card, ch, req) {
  if (ch.classList.contains('exam-out')) return;
  const inRetry = card.classList.contains('exam-retry');
  if (req > 1) {
    const wasSel = ch.classList.contains('exam-selected');
    if (!wasSel && !ch.classList.contains('ok')) {
      const sel = [...card.querySelectorAll('.ch2.exam-selected'), ch];
      _rfWrongPick(card, ch, _selectedChoiceStr(sel));
      return;
    }
    ch.classList.toggle('exam-selected');
    _updateMultiInfo(card);
    const sel = [...card.querySelectorAll('.ch2.exam-selected')];
    if (sel.length === req && sel.every(c => c.classList.contains('ok'))) {
      if (inRetry) { _rfLateCorrect(card, sel); return; }
      sel.forEach(c => c.classList.add('exam-instant-correct'));
      setTimeout(() => revealAnswer(card), 10);
    }
    return;
  }
  card.querySelectorAll('.ch2').forEach(x => x.classList.remove('exam-selected'));
  if (ch.classList.contains('ok')) {
    if (inRetry) { _rfLateCorrect(card, [ch]); return; }
    ch.classList.add('exam-selected', 'exam-instant-correct');
    setTimeout(() => revealAnswer(card), 10);
  } else {
    _rfWrongPick(card, ch, _selectedChoiceStr([ch]));
  }
}

/* 試験の後始末（exitExam から呼ぶ）。セッション中だけの印を通常閲覧へ持ち越さない。 */
function _rfCleanup() {
  document.querySelectorAll('.qc.exam-retry,.qc.exam-rf-done').forEach(c => c.classList.remove('exam-retry', 'exam-rf-done'));
  document.querySelectorAll('.ch2.exam-out').forEach(c => { c.classList.remove('exam-out'); c.removeAttribute('aria-disabled'); });
  document.querySelectorAll('.rf-x,.rf-reach,.rf-retry,.rf-sweep').forEach(el => el.remove());
  _rfHideStreak();
}
