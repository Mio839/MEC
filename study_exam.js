// study_exam.js — study.html の試験モード関連ロジック（state・効果音・演出エフェクト・SRS採点連携）
// study.html からの分割。classic script として study.html のインライン <script> より前に読み込むこと。
// 全トップレベル宣言（examMode 等の let/const・関数）は共有グローバルスコープに置かれ、
// study.html 側のインラインコードと相互参照する（挙動は分割前と同一）。
// Exam mode state
let examMode = false;
let examQueue = [];
let examAnswered = 0;
let examCorrect = 0;
let examStreak = 0;
const EXAM_EFFECT_SETS = ['classic', 'neon', 'ink', 'ecg', 'space', 'retro', 'luxury'];
// classic は他セットの半分の重み（1票 vs 各2票）で選ばれる
const EXAM_EFFECT_POOL = EXAM_EFFECT_SETS.flatMap(s => s === 'classic' ? [s] : [s, s]);
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
function _isHostSession() { return _srsReviewMode || _todayWrongMode; }
// 直前に終えたセッションが復習だったか。誤答再試験で復習モードへ戻すために使う
// （exitExam が _srsReviewMode を false に戻すので、その前に控えておく必要がある）。
let _lastSessionWasSrs = false;
let _lastSessionWasTodayWrong = false;
const _examChoiceBackup = new Map();
let _examAudioCtx = null;
/* 効果音のファイル名・キー・音量は **sounds_index.js（window.MecSounds）が唯一の正本**。
   ここにも index.html にも chapter_exam.js にも表を持たない（2026-08-21）。
   ⚠️ 音を足すのは「sounds/{正解音|起動音|選択音}/ にファイルを置く → sounds/meta.json に
      1行足す → node _work/build_sounds_index.js」の3手順。コードは1文字も触らない。
   ⚠️ 2026-08-21 に合成音（ping/chime/pop…）は正解音・選択音とも全廃した。ユーザーが
      置いた音だけを鳴らす。合成音が残っているのはコンボ音（_playComboNote）だけ。 */
function _sndList(slot) {
  const l = window.MecSounds && window.MecSounds[slot];
  return Array.isArray(l) ? l : [];
}
function _sndFind(slot, key) { return _sndList(slot).find(s => s.key === key) || null; }
/* 保存されている設定を実在するキーへ解決する。'off' はそのまま通し、見当たらないキー
   （消したファイル／旧・合成音のキー）は先頭＝既定へ落とす。
   ⚠️ localStorage は書き換えない——別端末の設定を同期で壊さないため、解決は読む側で行う。 */
function _sndResolve(slot, stored) {
  if (stored === 'off') return 'off';
  if (stored && _sndFind(slot, stored)) return stored;
  const first = _sndList(slot)[0];
  return first ? first.key : 'off';
}

let _correctSound = _sndResolve('correct', localStorage.getItem('mec_correct_sound_v1'));
let _selectSound  = _sndResolve('select',  localStorage.getItem('mec_select_sound_v1'));

/* 起動音は設定で1つに固定せず、**試験開始のたびにランダムで1つ**鳴る（2026-08-21〜）。
   localStorage('mec_boot_sound_v1') が持つのは「鳴らす／鳴らさない」だけ。
   ⚠️ 旧値（'ms' 等＝ファイルを指していた頃の設定）は 'off' 以外なので鳴らす側へ落ちる。
   ⚠️ 起動音の尺（現在 4.73s / 4.85s）はカウントダウン演出（2.535〜2.745s）より長いが、
      **鳴らし切る**のが仕様（2026-08-21 にユーザーが選択）。カウントダウンが明けて1問目に
      入っても音だけ続く。_examCountdown の尺は1msも増やさないこと。 */
let _bootSound = (localStorage.getItem('mec_boot_sound_v1') === 'off') ? 'off' : 'on';
/* 「開始」を押したそのタップの中で1つ選んで prepare しておく＝iOS の自動再生制限を
   通せる唯一の機会。_playBootSound はここで選ばれたものを鳴らすだけ。 */
let _pendingBootSpec = null;
function _pickBootSpec() {
  const l = _sndList('boot');
  return l.length ? l[(Math.random() * l.length) | 0] : null;
}

let _pendingResultSpec = null;
function _pickResultSpec() {
  const l = _sndList('result');
  return l.length ? l[(Math.random() * l.length) | 0] : null;
}
function _prepareResultSound() {
  _pendingResultSpec = _pickResultSpec();
  if (_pendingResultSpec) _prepareWavSound(_pendingResultSpec);
}
function _playResultSound() {
  const spec = _pendingResultSpec || _pickResultSpec();
  if (spec) _playWavSound(spec);
}

let _comboSound = localStorage.getItem('mec_combo_sound_v1') || 'rise';

/* 選択音・正解音・起動音・結果音はすべて同じ wav/mp3 の配管（_prepareWavSound / _playWavSound）に
   乗る。⚠️ 種類ごとの受け皿は _wavSlot が1つずつだけ作る（プレビューのたびに Audio を
   new すると溜まる）。 */
function _prepareSelectSound() { _prepareWavSound(_sndFind('select', _selectSound)); }
function _playSelectSound() {
  if (_selectSound === 'off') return;
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
  if (_bootSound === 'off') return;
  _playWavSound(_pendingBootSpec || _pickBootSpec());
}

function _playCorrectSound() {
  if (_correctSound === 'off') return;
  _playWavSound(_sndFind('correct', _correctSound));
  if (!_fxOff() && window.MecFX && window.MecFX.sonicWave) {
    const b = _fxBand();
    const theme = _examTheme();
    const t = Math.max(2, Math.min(_examTier(examStreak) || 2, 7));
    window.MecFX.sonicWave(b.cx, b.cy, { color: theme.ringColor(t), count: 3, maxR: 260 + t * 20 });
  }
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
  const subjNameMap = { endo:'内分泌', resp:'呼吸器', circ:'循環器', dige:'消化器', neur:'神経', hbp:'肝胆膵', jinzo_d:'腎臓', hema:'血液', imma:'免アレ膠', kansen:'感染症', peds:'小児科', obg:'産婦人科', psy:'精神科', derm:'皮膚科', oph:'眼科', ent:'耳鼻咽喉科', uro:'泌尿器科', ortho:'整形外科', anes:'麻酔科', rad:'放射線科', tox:'中毒・職業病' };
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
function openSelfcheck(){document.getElementById('scOv').classList.add('open');}
function closeSelfcheck(){document.getElementById('scOv').classList.remove('open');}
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
  const seenCount = examQueue.filter(c =>
    c.classList.contains('exam-revealed') ||
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
    if (card.classList.contains('exam-revealed')) {
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
  if (_lastSessionWasSrs || _lastSessionWasTodayWrong) {
    _srsReviewMode = _lastSessionWasSrs;
    _todayWrongMode = _lastSessionWasTodayWrong;
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
  _prepareSelectSound();
  _prepareWavSound(_sndFind('correct', _correctSound));
  _prepareResultSound();
  // 起動音は「開始を押した」このタップの中で選んで用意する＝iOS の自動再生制限を通せる
  // 唯一の機会。⚠️ ランダムの抽選もここで済ませること（_playBootSound では遅い）。
  _pendingBootSpec = null;
  if (_bootSound !== 'off') { _pendingBootSpec = _pickBootSpec(); _prepareWavSound(_pendingBootSpec); }
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
  examMode = true; examAnswered = 0; examCorrect = 0; examStreak = 0; examBySubj = {}; examByChapter = {}; examWrong = []; _examSessionWrongChoices.clear(); examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  _attemptSessionId = window.MecAttempts ? MecAttempts.newSession() : '';
  _examCardSeenAt.clear(); _zoneStop(false); _setAwaken(false); _examRecoverPending = false;
  _examIsRematch = _rematchPending > 0; _rematchPending = 0;   // B8
  _clearRecapChips(); _examSessionResults.clear();             // B5: 前回の成績表示を畳む
  _renderExamProgMarks();                                      // B2: 目盛りと難問印を敷く
  examEffectSet = EXAM_EFFECT_POOL[Math.floor(Math.random() * EXAM_EFFECT_POOL.length)];
  document.body.classList.remove('exam-effect-neon', 'exam-effect-ink');
  if (examEffectSet !== 'classic') document.body.classList.add('exam-effect-' + examEffectSet);
  if (location.search.indexOf('debug=1') !== -1) alert('[study.html] effectSet: ' + examEffectSet);
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  if (!_isHostSession()) localStorage.setItem('mec_exam_active_key', _examSessionKey);
  _examChoiceBackup.clear();
  document.body.classList.add('exam-mode');
  const _eqSet = new Set(examQueue);
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_eqSet.has(c)) c.style.display = 'none'; });
  let _firstFlips = null;   // B6: 1問目だけ並べ替えの移動量を控える
  examQueue.forEach((card, qi) => {
    card.style.display = '';
    { const f = _shuffleChoices(card, qi === 0); if (qi === 0) _firstFlips = f; }
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
    card.querySelectorAll('.ch2').forEach(ch => {
      if (!ch.dataset.examInit) {
        ch.dataset.examInit = '1';
        ch.addEventListener('click', function(e) {
          if (!examMode || this.closest('.qc').classList.contains('exam-revealed')) return;
          _playSelectSound();
          const c = this.closest('.qc');
          const r = _getRequiredCount(c);

          // 【案10】重厚メカニカル接点電気スパーク
          if (!_fxOff() && window.MecFX && window.MecFX.sparks) {
            const rect = this.getBoundingClientRect();
            window.MecFX.sparks(e.clientX || (rect.left + 24), e.clientY || (rect.top + rect.height / 2), { count: 7 });
          }

          // 【案2】超集中バレットタイム
          if (!_fxOff()) document.body.classList.add('exam-bullet-time');

          if (_isExamUngraded(c)) { // 採点除外＝赤フラッシュ無しでそのまま中立表示へ
            this.closest('.cs').querySelectorAll('.ch2').forEach(x => x.classList.remove('exam-selected'));
            this.classList.add('exam-selected');
            setTimeout(() => revealAnswer(c), 10);
            return;
          }
          if (r > 1) {
            this.classList.toggle('exam-selected');
            if (this.classList.contains('exam-selected') && !this.classList.contains('ok')) {
              this.classList.add('exam-instant-wrong');
              setTimeout(() => revealAnswer(c), 400);
            } else {
              _updateMultiInfo(c);
              const sel = [...c.querySelectorAll('.ch2.exam-selected')];
              if (sel.length === r && sel.every(ch => ch.classList.contains('ok'))) {
                sel.forEach(ch => ch.classList.add('exam-instant-correct'));
                setTimeout(() => revealAnswer(c), 10);
              }
            }
          } else {
            this.closest('.cs').querySelectorAll('.ch2').forEach(x => x.classList.remove('exam-selected'));
            this.classList.add('exam-selected');
            if (this.classList.contains('ok')) {
              this.classList.add('exam-instant-correct');
              setTimeout(() => revealAnswer(c), 10);
            } else {
              this.classList.add('exam-instant-wrong');
              setTimeout(() => revealAnswer(c), 400);
            }
          }
        });
      }
    });
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
  // Phase 5 段2: R1 の圧（蒸気）と R10 のスリープ番。⚠️ どちらも exitExam で必ず落とすこと。
  clearInterval(_examSteamInt);
  _examSteamInt = setInterval(_examSteamTick, STEAM_EVERY_MS);
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
    _firstCardEntrance(examQueue[0]);
    setTimeout(() => { if (examMode) _revealShuffleFx(_firstFlips); }, 180);
  }, _cdEnd + 60);
}

function revealAnswer(card) {
  document.body.classList.remove('exam-bullet-time');
  if (card.classList.contains('exam-revealed')) return;
  // 採点除外（正解肢なし）は採点対象外。分母・正誤・myrate・赤旗・再試験のどれにも入れない。
  if (_isExamUngraded(card)) { _revealExcludedNeutral(card); return; }
  const req = _getRequiredCount(card);
  const sid = card.dataset.uid.split('_ch')[0];
  if (!examBySubj[sid]) examBySubj[sid] = { correct: 0, total: 0 };

  // 入力型（計算問題）は選択肢が無いので専用の採点へ回す
  if (window.MecCalc && MecCalc.isCalc(card)) { _revealCalcAnswer(card, sid); return; }

  if (req > 1) {
    const selected = [...card.querySelectorAll('.ch2.exam-selected')];
    if (selected.length < req) {
      const info = card.querySelector('.exam-multi-info');
      if (info) { info.style.animation = 'none'; void info.offsetHeight; info.style.animation = 'examShake .3s'; }
      return;
    }
    const isCorrect = selected.length === req && selected.every(ch => ch.classList.contains('ok'));
    examAnswered++;
    examBySubj[sid].total++;
    _tallyChapter(card.dataset.uid, isCorrect);
    _tallyQuestion(card, isCorrect);          // B3/B5: 難問の成績とセッションの正誤
    _markExamDone(card.dataset.uid);
    _recordMyRate(card.dataset.uid, isCorrect);
    _logAttempt(card, isCorrect, _selectedChoiceStr(selected));
    if (!_isScoreExcluded(card)) _updateSRS(card.dataset.uid, isCorrect);
    const revBtn = card.querySelector('.exam-reveal-btn');
    if (isCorrect) {
      examCorrect++;
      examStreak++;
      examBySubj[sid].correct++;
      _playCorrectSound();
      _showStreakEffect(examStreak);
      { const _t=_examTier(examStreak); card.querySelectorAll('.ch2.ok').forEach(c=>_triggerChoiceCorrectPop(c)); _spawnFloatingCombo(card,examStreak,_t); }
      // A2/A3/A1: ショックウェーブ・ボーダートレース・速答ボーナス
      { const _ok = card.querySelector('.ch2.ok'); _correctShockwave(_ok); if (_isFastAnswer(card)) setTimeout(() => _triggerFastBonus(_ok), 90); }
      _traceCardBorder(card);
      _afterCorrectFx(card, card.querySelector('.ch2.ok') || selected[0]);
      card.classList.add('exam-revealed', 'exam-multi-correct');
      if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
    } else {
      examStreak = 0;
      _resetComboMeter();
      _clearDarkFx();
      _zoneStop(true);   // B5: ゾーン崩壊（漂う粒子が一点に吸い込まれて消える）
      document.body.classList.remove('exam-overdrive');
      if (!_fxOff()) {
        document.body.classList.remove('exam-screen-shake', 'exam-red-flash');
        void document.body.offsetWidth;
        document.body.classList.add('exam-screen-shake', 'exam-red-flash');
        setTimeout(() => document.body.classList.remove('exam-screen-shake', 'exam-red-flash'), 420);
      }
      examWrong.push(card.dataset.uid);
      card.classList.add('exam-revealed');
      if (revBtn) { revBtn.textContent = '▼ 解答を隠す'; revBtn.onclick = () => _toggleWrongAnswer(card, revBtn); }
    }
    _updateExamProg(isCorrect);
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    if (isCorrect) setTimeout(() => _scrollToNextCard(card), 400);
    else _maybeShowFinishBtn();
    return;
  }

  const revBtn = card.querySelector('.exam-reveal-btn');
  const sel = card.querySelector('.ch2.exam-selected') || card.querySelector('.ch2.exam-instant-correct') || card.querySelector('.ch2.ok') || card.querySelector('.ch2');
  if (!sel) return;
  const isCorrect = sel.classList.contains('ok');
  examAnswered++;
  examBySubj[sid].total++;
  _tallyChapter(card.dataset.uid, isCorrect);
  _tallyQuestion(card, isCorrect);            // B3/B5: 難問の成績とセッションの正誤
  _markExamDone(card.dataset.uid);
  _recordMyRate(card.dataset.uid, isCorrect);
  _logAttempt(card, isCorrect, _selectedChoiceStr([sel]));
  if (!_isScoreExcluded(card)) _updateSRS(card.dataset.uid, isCorrect);
  if (!isCorrect) {
    _recordWrongChoice(card.dataset.uid, (sel?.textContent?.trim() || '').charAt(0) || '?');
    _examSessionWrongChoices.set(card.dataset.uid, sel?.textContent?.trim() || '');
  }
  if (isCorrect) {
    examCorrect++;
    examStreak++;
    examBySubj[sid].correct++;
    _playCorrectSound();
    _showStreakEffect(examStreak);
    { const _t=_examTier(examStreak); _triggerChoiceCorrectPop(sel); _spawnFloatingCombo(card,examStreak,_t); }
    // A2/A3/A1: ショックウェーブ・ボーダートレース・速答ボーナス
    _correctShockwave(sel);
    _traceCardBorder(card);
    _afterCorrectFx(card, sel);
    card.classList.add('exam-revealed', 'exam-multi-correct');
    if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
    _updateExamProg(true);
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    setTimeout(() => _scrollToNextCard(card), 350);
  } else {
    const _broke = examStreak;   // C1: 崩落の規模は「途切れた時点の連続数」で決まる（0 にする前に控える）
    examStreak = 0;
    _resetComboMeter();
    _clearDarkFx();
    _zoneStop(true);   // B5: ゾーン崩壊
    _afterWrongFx(card, sel, _broke);
    examWrong.push(card.dataset.uid);
    card.classList.add('exam-revealed');
    if (revBtn) { revBtn.textContent = '▼ 解答を隠す'; revBtn.onclick = () => _toggleWrongAnswer(card, revBtn); }
    _updateExamProg();
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    _maybeShowFinishBtn();
  }
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
  const ov = document.getElementById('examTimestopOv');
  if (ov) {
    ov.getAnimations?.().forEach(a => a.cancel());
    ov.style.display = 'none';
    ov.style.opacity = '0';
  }
  document.querySelectorAll('.exam-fx-temp').forEach(el => {
    el.getAnimations?.().forEach(a => a.cancel());
    el.remove();
  });
}

function _triggerTimeStop(tier) {
  const ov = document.getElementById('examTimestopOv');
  if (!ov) return;
  ov.getAnimations?.().forEach(a => a.cancel());
  ov.style.display = '';
  ov.style.removeProperty('opacity');
  ov.style.backdropFilter = '';
  ov.style['-webkit-backdrop-filter'] = '';
  const holdMs = tier >= 7 ? 520 : tier >= 6 ? 400 : tier >= 5 ? 300 : 220;
  const anim = ov.animate(
    [{opacity:1},{opacity:1},{opacity:0}],
    {duration: holdMs + 150, easing:'ease-in',
     composite:'replace', iterationComposite:'replace'}
  );
  // アニメ終了後は必ず display:none に戻す。これをしないと iPad/WebKit では
  // opacity:0 でも要素の backdrop-filter(brightness .72 等)が描画され続け、
  // 一度でも高ストリークが出ると以降ずっと画面が暗い（＝「間違えると真っ暗」）状態になる。
  const _hide = () => { ov.style.display = 'none'; };
  anim.onfinish = _hide;
  anim.oncancel = _hide;
}

function _triggerFullscreenCombo(n, tier) {
  const el = document.getElementById('streakFullscreen');
  if (!el) return;
  el.getAnimations?.().forEach(a => a.cancel());
  el.style.removeProperty('opacity');   // 前回の試験終了時に張られた opacity:0!important を外す（下記⚠️）
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const cols = theme.fullscreenCols;
  const glowR = theme.fullscreenGlow;
  const col = cols[_tIdx(tier, cols)];
  const g = glowR[_tIdx(tier, glowR)];
  const spread = 60 + tier * 35;
  el.textContent = '×' + n;
  // 全画面レイヤーを可視帯へ合わせる（CSSの inset:0 は画面全体＝ヘッダーぶん中心が上にずれる）。
  // 文字も帯に収まる大きさへ抑える（42vmin のままだと帯からはみ出して上下が切れる）。
  const b = _fxBand();
  el.style.left = b.left + 'px';
  el.style.top = b.top + 'px';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.width = b.width + 'px';
  el.style.height = b.height + 'px';
  el.style.fontSize = Math.round(Math.min(b.width, b.height) * 0.42) + 'px';
  el.style.color = col;
  el.style.textShadow = `0 0 ${spread}px rgba(${g},.65), 0 0 ${spread*2}px rgba(${g},.35), 0 0 ${spread*3}px rgba(${g},.15)`;
  const dur = tier >= 7 ? 1120 : tier >= 6 ? 980 : tier >= 5 ? 820 : tier >= 4 ? 680 : 560;
  el.animate([
    {opacity:0,  transform:'scale(.28) rotate(-10deg)'},
    {opacity:.9, transform:'scale(1.14) rotate(1.8deg)',  offset:.17},
    {opacity:.82,transform:'scale(.93) rotate(-.6deg)',   offset:.33},
    {opacity:.78,transform:'scale(1.02) rotate(.3deg)',   offset:.48},
    {opacity:.75,transform:'scale(1) rotate(0deg)',       offset:.58},
    {opacity:0,  transform:'scale(1.06) rotate(.5deg)'}
  ], {duration: dur, easing:'cubic-bezier(.22,.68,0,1.25)'});
}

/* B1(2026-08-14): 天井を tier6（20連続〜）から tier7（30連続〜）へ。
   上限が見えていると「そこまで行けば終わり」になって伸ばす動機が止まるため、
   最上段の手前にもう一段置く。tier7 は各テーマが専用の配色・ラベルを持つ。 */
function _examTier(n) {
  return n >= 30 ? 7 : n >= 20 ? 6 : n >= 15 ? 5 : n >= 10 ? 4 : n >= 7 ? 3 : n >= 4 ? 2 : 1;
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
    useConfetti: true, rainType: 'confetti',
    useFireworks: true,
    useLightning: true,
    lightningCols: {3:'rgba(255,120,32,.95)',4:'rgba(255,210,0,1)',5:'rgba(255,235,0,1)',6:'rgba(200,80,255,1)',7:'rgba(255,61,127,1)'},
    useGlitch: true,
    useMedalDrop: true,
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
    useConfetti: false, rainType: 'digital',
    useFireworks: false, useCircuitPulse: true,
    useLightning: true,
    lightningCols: {3:'rgba(0,229,255,.95)',4:'rgba(255,43,214,1)',5:'rgba(122,92,255,1)',6:'rgba(57,255,136,1)',7:'rgba(255,49,49,1)'},
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
    useConfetti: false, rainType: 'petals',
    useFireworks: false, useBrushCircle: true,
    useLightning: false,
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
    useConfetti: false, rainType: 'digital',
    rainGlyphs: ['♥','+','━','●','◆'], rainCols: ['#00E676','#FF1744','#FFEA00','#00E5FF'],
    useFireworks: false, useECGSweep: true,
    useLightning: false,
    useGlitch: true,
    pulseBeat: true, useDefib: true,
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
    useConfetti: false, rainType: 'warp',
    rainCols: ['#7C4DFF','#448AFF','#40C4FF','#FFD54F','#FFFFFF','#E040FB','#B388FF'],
    useFireworks: true,
    useLightning: false,
    useGlitch: true,
    useBlackHole: true,
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
    useConfetti: false, rainType: 'digital',
    rainGlyphs: ['★','■','◆','▲','●'], rainCols: ['#FF1053','#00A8E8','#FFD400','#00E676'],
    useFireworks: false, useCircuitPulse: true,
    useLightning: false,
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
    useConfetti: false, rainType: 'bubbles',
    rainCols: ['#FFD700','#F7E7CE','#FFF3C4','#C9A227','#1a1a1a','#FFFFFF'],
    useFireworks: false, useStampBurst: true,
    stampColor: () => '#FFD700',
    useLightning: false,
    useGlitch: false, useBrushSwipe: true,
    brushColorRgb: '255,215,0',
    useSpotlight: true,
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
   設計方針: 総量を増やすのではなく「山谷」を作る。ティア昇格の瞬間だけフル演出にし、
   同ティア内の連続正解はむしろ軽くする（_showStreakEffect の promoted 分岐）。
   DOM系の演出は _fxOff() でガードする（MecFXはstudy.html側で既にno-op化される）。 */
const FAST_ANSWER_MS = 3000;          // これ以内の正解を「速答」とみなす
const _examCardSeenAt = new Map();    // uid → 最初に画面フォーカスされた時刻ms
let _zoneTimer = null;                // ゾーン（tier4+の常駐環境演出）のemitインターバル
let _zoneActive = false;

function _fxOff() {
  return typeof _mecReducedMotion === 'function' && _mecReducedMotion();
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

function _isFastAnswer(card) {
  return _fastGrade(card) > 0;
}

/* A3(2026-08-14): 速答を3段に割る。
   以前は「3秒以内かどうか」の二値で、迷わず即答したのか少し考えたのかが同じ扱いだった。
   上に一段足す形にしてあるので、従来「速答」だった帯（〜3秒）はほぼそのまま残る。
   返り値 3=一閃 / 2=速答 / 1=まずまず / 0=速答ではない。
   ⚠️ theme.fastLabels の並びは [3段目, 2段目, 1段目]（強い順）。 */
const FAST_TIER_MS = [2000, 4000, 7000];   // [一閃, 速答, まずまず] の上限
function _fastGrade(card) {
  const uid = card && card.dataset && card.dataset.uid;
  if (!uid) return 0;
  const t0 = _examCardSeenAt.get(uid);
  if (!t0) return 0;
  const dt = Date.now() - t0;
  if (dt <= FAST_TIER_MS[0]) return 3;
  if (dt <= FAST_TIER_MS[1]) return 2;
  if (dt <= FAST_TIER_MS[2]) return 1;
  return 0;
}

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
function _fxBand() {
  const vv = window.visualViewport;
  const vLeft = vv ? vv.offsetLeft : 0;
  const vTop  = vv ? vv.offsetTop  : 0;
  const vW    = vv ? vv.width  : window.innerWidth;
  const vH    = vv ? vv.height : window.innerHeight;
  let top    = Math.max(vTop + FX_BAND_PAD, _examFxHeaderBottom() + FX_BAND_PAD);
  let bottom = vTop + vH - FX_BAND_PAD;
  // ヘッダーが可視域を食い尽くす（横向きの iPhone 等）ときは帯が潰れるので可視域全体へ戻す。
  if (bottom - top < 140) { top = vTop + FX_BAND_PAD; bottom = vTop + vH - FX_BAND_PAD; }
  return {
    left: vLeft, width: vW, right: vLeft + vW,
    top: top, bottom: bottom, height: Math.max(1, bottom - top),
    vTop: vTop, vBottom: vTop + vH, vHeight: vH,   // ヘッダーを差し引く前の素の可視域
    cx: Math.round(vLeft + vW / 2),
    cy: Math.round((top + bottom) / 2)
  };
}
function _examClampFxXY(cx, cy) {
  const b = _fxBand();
  return [Math.max(b.left + 8, Math.min(b.right - 8, cx)), Math.max(b.top, Math.min(b.bottom, cy))];
}

// A1: 速答ボーナス。ラベル＋⚡グリフを選んだ肢の位置から出す
// grade は _fastGrade の3段（省略時は従来どおりの「速答」= 2段目）
function _triggerFastBonus(el, grade) {
  if (_fxOff()) return;
  const theme = _examTheme();
  const g = grade || 2;
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const _b0 = _fxBand();
  const cx0 = r && r.width ? r.left + r.width / 2 : _b0.cx;
  const cy0 = r && r.width ? r.top : _b0.cy;
  const [cx, cy] = _examClampFxXY(cx0, cy0);
  const lab = document.createElement('div');
  lab.className = 'exam-fast-pop fast-g' + g;
  // fastLabels は強い順 [一閃, 速答, まずまず]。旧 fastLabel は2段目の文言として残す
  const labels = theme.fastLabels;
  lab.textContent = (labels && labels[3 - g]) || theme.fastLabel || '⚡ 速答！';
  lab.style.left = cx + 'px';
  lab.style.top = cy + 'px';
  lab.style.color = (theme.comboColors && theme.comboColors[3]) || '#FFD700';
  document.body.appendChild(lab);
  lab.animate([
    { opacity: 0, transform: 'translate(-50%,0) scale(.6)' },
    { opacity: 1, transform: 'translate(-50%,-16px) scale(1.15)', offset: .25 },
    { opacity: 1, transform: 'translate(-50%,-24px) scale(1)', offset: .55 },
    { opacity: 0, transform: 'translate(-50%,-52px) scale(.95)' }
  ], { duration: 900, easing: 'cubic-bezier(.22,.68,0,1.2)', fill: 'forwards' }).onfinish = () => lab.remove();
  if (window.MecFX) {
    try { window.MecFX.glyphBurst(cx, cy, { glyphs: ['⚡'], count: 4, w: 50, spread: 130 }); } catch (e) {}
  }
}

// A2: 正解した肢の位置から広がるショックウェーブ（単発正解でも必ず出る手応え）
function _correctShockwave(el) {
  if (!window.MecFX || !el || !el.getBoundingClientRect) return;
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const theme = _examTheme();
  const t = Math.max(1, Math.min(_examTier(examStreak) || 1, 7));
  const [sx, sy] = _examClampFxXY(r.left + r.width / 2, r.top + r.height / 2);
  try {
    window.MecFX.rings(sx, sy, {
      count: t >= 4 ? 3 : 2,
      color: theme.ringColor(t),
      thickness: t >= 4 ? 3 : 2,
      maxR: 150 + t * 45,
      additive: examEffectSet !== 'ink',
      stagger: .075
    });
  } catch (e) {}
}

// A3: カード外周を光が一周するボーダートレース（SVGのstroke-dashoffsetアニメ）
function _traceCardBorder(card) {
  if (!card || _fxOff()) return;
  const r = card.getBoundingClientRect();
  if (!r.width || !r.height) return;
  { const b = _fxBand(); if (r.bottom < b.top + 4 || r.top > b.vBottom) return; } // カードが可視域外＝枠が上端等でズレる
  const theme = _examTheme();
  const col = (theme.fx && theme.fx.hex) || (theme.comboColors && theme.comboColors[3]) || '#FFD700';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'exam-trace-svg');
  svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
  svg.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('x', '1.5'); rect.setAttribute('y', '1.5');
  rect.setAttribute('width', String(Math.max(1, r.width - 3)));
  rect.setAttribute('height', String(Math.max(1, r.height - 3)));
  rect.setAttribute('rx', '12'); rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', col); rect.setAttribute('stroke-width', '2.5');
  rect.setAttribute('stroke-linecap', 'round');
  const per = 2 * (r.width + r.height);
  const seg = per * 0.22;
  rect.setAttribute('stroke-dasharray', seg + ' ' + per);
  svg.appendChild(rect);
  document.body.appendChild(svg);
  rect.animate([
    { strokeDashoffset: String(seg), opacity: 1 },
    { strokeDashoffset: String(-per), opacity: .35 }
  ], { duration: 640, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' }).onfinish = () => svg.remove();
}

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
const _examProgCrossed = new Set();    // 既に跨いだ目盛りの kind
// B3: 難問の成績。分母は出題時に確定、分子は解答のたびに増える
let _examHardStat = { total: 0, answered: 0, correct: 0 };
/* B5: 直前セッションの uid→正誤。結果画面を閉じた後、解いた問題が「成績付きで並び直す」
   ために持つ。ページ内の記憶だけで、localStorage キーは増やさない。
   ⚠️ C5 の `exam-scar`（誤答の傷）とは別物。あちらはセッション中だけの印で通常閲覧へ
      持ち越さないが、こちらは持ち越すことが目的。混ぜないこと。 */
const _examSessionResults = new Map();

function _clearRecapChips() {
  document.querySelectorAll('.qc[data-recap]').forEach(c => {
    c.classList.remove('qc-recap-in');
    delete c.dataset.recap;
  });
}
function _applyRecapChips() {
  if (!_examSessionResults.size) return 0;
  let found = 0;
  _examSessionResults.forEach((ok, uid) => {
    const card = document.querySelector('.qc[data-uid="' + CSS.escape(uid) + '"]');
    if (!card) return;
    card.dataset.recap = ok ? 'ok' : 'ng';
    // 入場は最初の12枚だけ（画面外のカードまで一斉に動かす意味が無い）
    if (found < 12 && !_fxOff()) {
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
}

// 目盛りと難問印をバーへ敷く（セッション開始時に一度だけ）
function _renderExamProgMarks() {
  _examProgCrossed.clear();
  _examProgL = _examProgLayout(examQueue);
  _examHardStat = { total: _examProgL.hardTotal, answered: 0, correct: 0 };
  const track = document.querySelector('.exam-prog-track');
  if (!track) return;
  track.querySelectorAll('.ep-tick,.ep-hard').forEach(el => el.remove());
  track.classList.remove('ep-sprint', 'ep-sweep');
  if (!_examProgL.total) return;
  const frag = document.createDocumentFragment();
  _examProgL.ticks.forEach(t => {
    const i = document.createElement('i');
    i.className = 'ep-tick ep-' + t.kind;
    i.style.left = (t.at * 100).toFixed(3) + '%';
    i.title = t.kind === 'half' ? '折り返し（' + t.n + '問）' : '残り' + PROG_LAST_N + '問';
    frag.appendChild(i);
  });
  _examProgL.marks.forEach(m => {
    const i = document.createElement('i');
    i.className = 'ep-hard';
    i.style.left = (m.at * 100).toFixed(3) + '%';
    i.dataset.n = String(m.n);
    i.title = m.n + '問目：難問（本番正答率' + EXAM_HARD_RATE + '%未満）';
    frag.appendChild(i);
  });
  track.appendChild(frag);
}

// 進行に合わせて目盛り・難問印・ラストスパートを更新する（祝わない＝音も粒子も出さない）
function _syncExamProgMarks() {
  const L = _examProgL;
  const track = document.querySelector('.exam-prog-track');
  if (!L || !L.total || !track) return;
  L.ticks.forEach(t => {
    if (examAnswered < t.n || _examProgCrossed.has(t.kind)) return;
    _examProgCrossed.add(t.kind);
    if (_fxOff()) return;
    const el = track.querySelector('.ep-' + t.kind);
    if (el) { el.classList.remove('lit'); void el.offsetWidth; el.classList.add('lit'); }
    track.classList.remove('ep-sweep'); void track.offsetWidth; track.classList.add('ep-sweep');
    setTimeout(() => track.classList.remove('ep-sweep'), 800);
  });
  track.querySelectorAll('.ep-hard').forEach(el => {
    el.classList.toggle('done', (parseInt(el.dataset.n, 10) || 0) <= examAnswered);
  });
  if (L.sprintFrom != null) {
    const on = examAnswered >= L.sprintFrom && examAnswered < L.total;
    track.classList.toggle('ep-sprint', on);
    document.body.classList.toggle('exam-sprint', on && !_fxOff());
  }
}

/* ⚠️ 難問突破の低い「ドン」は 2026-08-18 に廃止した（ユーザー判断・不快）。
   正解音（mec_correct_sound_v1）に重なって鳴り、しかも設定から切れなかった。
   演出（刻印＋粒子）だけを残す。音を戻さないこと。chapter_exam.js の
   ceHardClear からも同じ理由で ceTone を外してある（ミラー）。 */

function _triggerHardClear(el, card) {
  const theme = _examTheme();
  const rate = _cardRate(card);
  if (_fxOff()) return;
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const b = _fxBand();
  const [cx, cy] = _examClampFxXY(
    r && r.width ? r.left + r.width / 2 : b.cx,
    r && r.width ? r.top + r.height / 2 : b.cy);
  const cols = theme.hardColors || ['#FF5722', '#FFD700', '#FFFFFF'];
  const col = cols[0];

  const lab = document.createElement('div');
  lab.className = 'exam-hard-pop';
  lab.innerHTML = '<span class="hc-lbl"></span><span class="hc-rate"></span>';
  lab.firstChild.textContent = '👑 ' + (theme.hardLabel ? theme.hardLabel.replace(/^[^\s]+\s*/, '') : '難問突破！');
  lab.lastChild.textContent = rate != null ? '正答率 ' + rate + '%' : '';
  lab.style.setProperty('--hc-col', col);
  lab.style.left = cx + 'px';
  lab.style.top = cy + 'px';
  document.body.appendChild(lab);
  lab.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(.4) rotate(-15deg)' },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1.3) rotate(6deg)', offset: .22 },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(-2deg)', offset: .38 },
    { opacity: 1, transform: 'translate(-50%,-62%) scale(1) rotate(0deg)', offset: .72 },
    { opacity: 0, transform: 'translate(-50%,-86%) scale(.96) rotate(0deg)' }
  ], { duration: 1400, easing: 'cubic-bezier(.2,1.3,.35,1)', fill: 'forwards' }).onfinish = () => lab.remove();

  if (window.MecFX) {
    try {
      window.MecFX.burst(cx, cy, {
        count: 48, colors: ['#FFD700', '#FFA040', '#FFD166', '#FFFFFF', '#FF5722'],
        shapes: ['gem', 'star', 'shard'], tier: 5, scale: 1.8, speed: 620, glow: true, additive: true
      });
      window.MecFX.rings(cx, cy, { count: 2, color: '#FFD700', thickness: 5, maxR: 160, additive: true });
      window.MecFX.stamp(cx, cy, { color: col, size: 148, thick: 4, ticks: 12, rot: -8, ttl: 1.0 });
    } catch (e) {}
  }
}

/* ══════════ C2: 立て直し（2026-08-14）══════════
   誤答の次の1問を正解したときだけ出す。連続正解が0に戻った直後は演出が何も無く、
   そこが一番心が折れる場所だった。誤答を罰するのではなく復帰を強化する方が、
   学習ツールとして促したい行動（間違えても次を解く）と一致する。
   ⚠️ examStreak とは別に持つこと。ストリークは正解のたびに伸びるが、立て直しは
   「直前が誤答だった1回」だけの一過性の状態。 */
let _examRecoverPending = false;
// A2: 直前の解答について、myrate_v1 の加算前の状態（_recordMyRate が書く）
let _lastAnswerPrior = { uid: '', fresh: false, wasWrong: false };

function _playRecoverTone() {
  if (_correctSound === 'off') return;
  try {
    const ctx = _getExamAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    master.connect(ctx.destination);
    // 低→高。落ちたところから戻る形にする
    [329.63, 440, 659.25].forEach((f, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      const st = now + i * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, st);
      g.gain.setValueAtTime(.6, st);
      osc.connect(g); g.connect(master);
      osc.start(st); osc.stop(now + 0.62);
    });
  } catch (e) {}
}

function _triggerRecover(el) {
  const theme = _examTheme();
  _playRecoverTone();
  if (_fxOff()) return;
  if (theme.useFlatline) _ecgBeatBack();   // C4: 平坦になった波形に拍が戻る
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const b = _fxBand();
  const [cx, cy] = _examClampFxXY(
    r && r.width ? r.left + r.width / 2 : b.cx,
    r && r.width ? r.top + r.height / 2 : b.cy);
  const cols = theme.recoverColors || ['#3DD68C', '#5EF0A8', '#FFFFFF'];

  const lab = document.createElement('div');
  lab.className = 'exam-recover-pop';
  lab.textContent = theme.recoverLabel || '🔄 立て直し！';
  lab.style.setProperty('--rc-col', cols[0]);
  lab.style.left = cx + 'px';
  lab.style.top = cy + 'px';
  document.body.appendChild(lab);
  lab.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(.7)' },
    { opacity: 1, transform: 'translate(-50%,-64%) scale(1.06)', offset: .26 },
    { opacity: 1, transform: 'translate(-50%,-72%) scale(1)', offset: .62 },
    { opacity: 0, transform: 'translate(-50%,-104%) scale(.97)' }
  ], { duration: 1100, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'forwards' }).onfinish = () => lab.remove();

  if (window.MecFX) {
    try {
      // 粒が輪を巻き直す＝崩れたものが組み上がる絵。バーストのように散らさない
      window.MecFX.orbit(cx, cy, {
        count: 14, r: 74, dr: -34, va: 3.1, colors: cols,
        size: 4.5, ttl: 1.15,
        glow: examEffectSet !== 'ink', additive: examEffectSet !== 'ink'
      });
      window.MecFX.rings(cx, cy, {
        count: 1, color: cols[0], thickness: 2, maxR: 130,
        additive: examEffectSet !== 'ink'
      });
    } catch (e) {}
  }
}

/* ══════════ A2: 初見突破 / リベンジ達成（2026-08-14）══════════
   「一発で当てた」と「前に落とした問題を取り返した」は価値が違うのに、今まで
   どちらも同じ祝い方だった。判定材料は myrate_v1 の **加算前** の値（_recordMyRate が控える）。
   ⚠️ 初見は易問（正答率80%以上）では出さない。初回の通し学習では毎問出て意味が薄れるため。 */
const EXAM_EASY_RATE = 80;

function _triggerAnswerMark(el, kind) {
  if (_fxOff()) return;
  const theme = _examTheme();
  const isRev = kind === 'revenge';
  const text = isRev ? (theme.revengeLabel || '⚔️ リベンジ達成')
                     : (theme.freshLabel || '🌱 初見突破');
  const col = isRev ? ((theme.comboColors && theme.comboColors[4]) || '#FFD700')
                    : ((theme.recoverColors && theme.recoverColors[0]) || '#3DD68C');
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const b = _fxBand();
  const [cx, cy] = _examClampFxXY(
    r && r.width ? r.right - Math.min(66, r.width * .24) : b.cx,
    r && r.width ? r.bottom - 2 : b.cy);
  const lab = document.createElement('div');
  lab.className = 'exam-mark-pop' + (isRev ? ' rev' : '');
  lab.textContent = text;
  lab.style.setProperty('--mk-col', col);
  lab.style.left = cx + 'px';
  lab.style.top = cy + 'px';
  document.body.appendChild(lab);
  lab.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(.72)' },
    { opacity: 1, transform: 'translate(-50%,-118%) scale(1)', offset: .3 },
    { opacity: 1, transform: 'translate(-50%,-134%) scale(1)', offset: .7 },
    { opacity: 0, transform: 'translate(-50%,-176%) scale(.96)' }
  ], { duration: isRev ? 1150 : 900, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'forwards' })
    .onfinish = () => lab.remove();
  if (isRev && window.MecFX) {
    try { window.MecFX.glyphBurst(cx, cy, { glyphs: ['⚔️', '✨'], count: 5, w: 40, spread: 120 }); } catch (e) {}
  }
}

/* A4(2026-08-14): 正解した肢から解答ブロック(.ab)へ光の線を引く。
   演出であると同時に視線誘導で、「なぜ正解か」を読む場所へ目を運ぶ。 */
function _traceToAnswer(card, fxEl) {
  if (_fxOff() || !window.MecFX || !card) return;
  const ab = card.querySelector('.ab');
  if (!ab || !fxEl || !fxEl.getBoundingClientRect) return;
  const a = fxEl.getBoundingClientRect(), t = ab.getBoundingClientRect();
  if (!a.width || !t.width) return;
  const b = _fxBand();
  // どちらかが可視域の外なら引かない（画面外へ伸びる線になる）
  if (a.bottom < b.top || a.top > b.vBottom || t.bottom < b.top || t.top > b.vBottom) return;
  try {
    window.MecFX.ribbon(
      a.left + a.width * .5, a.bottom - 4,
      t.left + Math.min(48, t.width * .2), t.top + 6,
      { color: (_examTheme().comboColors || [])[4] || '#FFD700', width: 2.6, ttl: .85, grow: .5, bow: 30 }
    );
  } catch (e) {}
}

/* A5(2026-08-14): 選ばなかった肢が一段沈み、正解肢だけが手前に残る。
   一時的な強調なので、解説を読む段階では必ず元へ戻す。 */
function _sinkOtherChoices(card) {
  if (!card || _fxOff()) return;
  card.classList.add('exam-sink');
  setTimeout(() => card.classList.remove('exam-sink'), 1100);
}

/* ══ 正解／誤答の追加演出の合流点（2026-08-14）══
   revealAnswer（選択肢）と _revealCalcAnswer（計算問題の桁入力）の2経路があるので、
   新しい演出は必ずこの2関数へ足すこと。片方だけに書くと計算問題50問で演出が抜ける。
   ⚠️ 「この正解が何だったか」を示すラベル（難問／リベンジ／初見）は必ず1つに絞ること。
      3つ同時に出すと画面が文字だらけになり、どれも読まれなくなる。 */
function _afterCorrectFx(card, fxEl) {
  const fast = _fastGrade(card);
  if (fast > 0) setTimeout(() => _triggerFastBonus(fxEl, fast), 90);

  _sinkOtherChoices(card);
  setTimeout(() => _traceToAnswer(card, fxEl), 260);

  const uid = card && card.dataset && card.dataset.uid;
  const prior = (_lastAnswerPrior.uid && _lastAnswerPrior.uid === uid) ? _lastAnswerPrior : null;
  const rate = _cardRate(card);
  if (_isHardCard(card)) {
    setTimeout(() => _triggerHardClear(fxEl, card), 150);
  } else if (prior && prior.wasWrong) {
    setTimeout(() => _triggerAnswerMark(fxEl, 'revenge'), 150);
  } else if (prior && prior.fresh && !(rate != null && rate >= EXAM_EASY_RATE)) {
    setTimeout(() => _triggerAnswerMark(fxEl, 'fresh'), 150);
  }

  // S5(2026-08-21): 克服＝前に落とした問題を正解し直した瞬間、当て板が打たれて一度だけ磨かれ、消える。
  // ⚠️ ラベル（難問／リベンジ／初見）の else-if 連鎖の外に置くこと。ラベルは1つに絞る約束だが、
  //    プレートはラベルではない＝難問かつ克服のときに両方出てよい。
  // ⚠️ ここ（_afterCorrectFx）が正解の2経路（選択肢・計算問題）の合流点。
  //    revealAnswer 側だけに書くと計算問題50問で抜ける。
  if (prior && prior.wasWrong) {
    _polishPlate(card);
    if (!_fxOff() && window.MecFX && card) {
      const cr = card.getBoundingClientRect();
      window.MecFX.burst(cr.left + 4, cr.top + Math.min(cr.height / 2, 80), {
        count: 24,
        shapes: ['shard', 'square'],
        colors: ['#FFD700', '#FFA040', '#FFFFFF', '#C9A227', '#FF5722'],
        gravity: 1600,
        speed: 760,
        additive: false,
        upBias: 80
      });
    }
  }

  // 【案3】SRS復習モードでの定着刻印（STABLE）
  if (_srsReviewMode && !_fxOff() && window.MecFX && card) {
    const cr = card.getBoundingClientRect();
    window.MecFX.stamp(cr.right - 35, cr.top + 25, {
      color: '#C9A227',
      size: 44,
      thick: 2.2,
      ticks: 12,
      delay: .12
    });
  }

  // 【UIテーマ固有演出】正解時のテーマ別リアクション
  if (!_fxOff() && window.MecFX && card) {
    const curUi = window.MecUITheme ? MecUITheme.get() : 'aurora';
    const cr = card.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + Math.min(cr.height / 2, 90);
    if (curUi === 'aurora' && window.MecFX.diamondSparkle) {
      window.MecFX.diamondSparkle(cx, cy, { count: 12, color: '#00DFD8' });
    } else if (curUi === 'brass' && window.MecFX.sparks) {
      window.MecFX.sparks(cx, cy, { count: 10, colors: ['#FFD700', '#FFA040', '#FFFFFF'] });
    } else if (curUi === 'cyber' && window.MecFX.glitchBars) {
      window.MecFX.glitchBars(cx, cy, { count: 6, color: '#00E5FF' });
    } else if (curUi === 'liquid' && window.MecFX.bubbles) {
      window.MecFX.bubbles(cx, cy, { count: 8, colors: ['#FF007F', '#7928CA'] });
    }
  }

  if (_examRecoverPending) {
    _examRecoverPending = false;
    setTimeout(() => _triggerRecover(fxEl), 220);
  }
}

/* S5 の克服光（2026-08-21）。当て板を一時的に打ってから消す。
   ⚠️ 残さないこと——板が居座ると exam-scar（この回で落とした印）と同じ絵が並び、
      「落とした」と「克服した」が見分けられなくなる。
   ⚠️ exam-scar が付いているカードには出さない（正解では付かないので実際には起きないが、
      将来 scar の条件が変わったときに絵が二重にならないようにしておく）。 */
function _polishPlate(card) {
  if (!card || _fxOff() || card.classList.contains('exam-scar')) return;
  card.classList.remove('exam-plate-fix');
  void card.offsetWidth;                 // アニメを確実に頭から流す
  card.classList.add('exam-plate-fix');
  setTimeout(() => card.classList.remove('exam-plate-fix'), 1150);
}

/* ══════════ C1: コンボメーターの崩落（2026-08-14）══════════
   連続が途切れた瞬間、上端のメーターが割れて破片が落ちる。
   ⚠️ 途切れた時点の連続数で規模を決めるので、examStreak を 0 にする **前** の値を渡すこと。
   3連続以下（tier1）では出さない——失うものが小さいうちから崩落させると、
   ただ誤答を責める演出になる。 */
function _shatterComboMeter(brokeStreak) {
  if (brokeStreak < 4 || _fxOff() || !window.MecFX) return;
  const meter = document.getElementById('examComboMeter');
  const fill = document.getElementById('examComboMeterFill');
  if (!meter) return;
  const src = (fill && fill.getBoundingClientRect().width) ? fill : meter;
  const r = src.getBoundingClientRect();
  if (!r.width) return;
  const tier = _examTier(brokeStreak);
  const theme = _examTheme();
  const cc = theme.comboColors || [];
  const cols = [cc[_tIdx(tier, cc)] || '#FFD700', '#FFFFFF', 'rgba(255,255,255,.55)'];
  try {
    window.MecFX.shatter(r.left + r.width / 2, r.top + r.height / 2, {
      count: Math.min(48, 12 + tier * 6),
      w: r.width, h: Math.max(4, r.height),
      colors: cols, spread: 120 + tier * 40, up: 60 + tier * 16
    });
  } catch (e) {}
}

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

/* C4(2026-08-14): 心電図テーマだけ、誤答で波形が平坦になる。
   次の正解（立て直し）で拍が戻るので、テーマ単位の小さな物語になる。 */
function _ecgFlatline() {
  if (_fxOff() || !window.MecFX) return;
  const b = _fxBand();
  try {
    window.MecFX.wave({
      y: b.cy, x0: b.left, x1: b.right, amp: 0, freq: 0,
      width: 2.6, color: '#FF1744', tail: 340, ttl: 1.15, grow: .78, additive: true
    });
  } catch (e) {}
}
function _ecgBeatBack() {
  if (_fxOff() || !window.MecFX) return;
  const b = _fxBand();
  try {
    window.MecFX.wave({
      y: b.cy, x0: b.left, x1: b.right, amp: 30, freq: 1.6, spike: 2.6, spikeAt: .55,
      width: 2.8, color: '#00E676', tail: 300, ttl: 1.05, grow: .7, additive: true
    });
  } catch (e) {}
}

/* C5(2026-08-14): 落とした問題のカードに傷を残す。
   「今日の誤答を再履修」の対象であることの予告になり、演出とハブの機能が意味でつながる。
   セッション中だけの印なので、試験の後始末（cleanup）で必ず外す。 */
function _markCardScar(card) {
  if (card) card.classList.add('exam-scar');
}

function _afterWrongFx(card, fxEl, brokeStreak) {
  _examRecoverPending = true;   // 次の1問を正解したら「立て直し」を出す
  _markCardScar(card);
  _shatterComboMeter(brokeStreak || 0);
  document.body.classList.remove('exam-overdrive');
  if (!_fxOff()) {
    document.body.classList.remove('exam-screen-shake', 'exam-red-flash');
    void document.body.offsetWidth;
    document.body.classList.add('exam-screen-shake', 'exam-red-flash');
    setTimeout(() => document.body.classList.remove('exam-screen-shake', 'exam-red-flash'), 420);
  }
  if (_examTheme().useFlatline) _ecgFlatline();
  const uid = card && card.dataset && card.dataset.uid;
  if (uid && _isRepeatWrongChoice(uid, fxEl)) setTimeout(() => _triggerRepeatWrong(fxEl), 260);
}

// B4: ティア昇格スタンプ。昇格した瞬間だけ「TIER UP」を叩き込む
function _triggerTierUpStamp(tier, n) {
  if (_fxOff()) return;
  const theme = _examTheme();
  const el = document.createElement('div');
  el.className = 'exam-tierup';
  const col = (theme.fullscreenCols && theme.fullscreenCols[_tIdx(tier, theme.fullscreenCols)]) || '#FFD700';
  const glow = (theme.fullscreenGlow && theme.fullscreenGlow[_tIdx(tier, theme.fullscreenGlow)]) || '255,215,0';
  el.innerHTML = '<span class="tu-lbl">TIER UP</span>' +
    '<span class="tu-main">' + ((theme.tierUpLabel && theme.tierUpLabel(tier)) || ('TIER ' + tier)) + '</span>';
  el.style.setProperty('--tu-col', col);
  el.style.setProperty('--tu-glow', glow);
  el.style.top = _fxBand().cy + 'px';   // CSSの top:38% は画面基準＝ヘッダーの高い端末で上に寄る
  document.body.appendChild(el);
  el.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(3.2) rotate(-16deg)' },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(.92) rotate(-6deg)', offset: .22 },
    { transform: 'translate(-50%,-50%) scale(1.06) rotate(-6deg)', offset: .34 },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(-6deg)', offset: .46 },
    { opacity: 1, offset: .74 },
    { opacity: 0, transform: 'translate(-50%,-50%) scale(1.12) rotate(-6deg)' }
  ], { duration: 1250, easing: 'cubic-bezier(.2,1.3,.35,1)', fill: 'forwards' }).onfinish = () => el.remove();
  // メーター位置からの祝砲（B6と連動）
  if (window.MecFX) {
    try {
      // 祝砲はコンボメーター(画面最上端)ではなく可視帯の上端から上げる。
      // 画面最上端だと上半分が画面外へ抜けて切れる（iPad実機・2026-08-04）。
      const _mb = _fxBand();
      window.MecFX.burst(_mb.cx, _mb.top, {
        count: 40 + tier * 14,
        colors: (theme.burstPalettes && theme.burstPalettes[_tIdx(tier, theme.burstPalettes)]) || ['#FFD700'],
        shapes: theme.shapes(tier), tier: tier, glow: examEffectSet !== 'ink', additive: examEffectSet !== 'ink'
      });
    } catch (e) {}
  }
}

// B5: ゾーン（tier4以上の間だけ画面に薄く漂う環境演出）
function _zoneStart() {
  if (_zoneActive || _fxOff() || !window.MecFX) return;
  _zoneActive = true;
  document.body.classList.add('exam-zone');
  const emit = () => {
    if (!_zoneActive || !window.MecFX || !examMode) return;
    const theme = _examTheme();
    try {
      window.MecFX.dust({ count: 6, colors: theme.zoneColors || ['#FFD700'] });
      if (Math.random() < .55) {
        window.MecFX.floaters({ glyphs: theme.zoneGlyphs || ['✨'], count: 2, scale: .65 });
      }
    } catch (e) {}
  };
  emit();
  _zoneTimer = setInterval(emit, 1100);
}

// B5: ゾーン崩壊。ミスで途切れた瞬間、漂う粒子を一点に吸い込んで消す（喪失の演出）
function _zoneStop(collapse) {
  const wasActive = _zoneActive;
  _zoneActive = false;
  if (_zoneTimer) { clearInterval(_zoneTimer); _zoneTimer = null; }
  document.body.classList.remove('exam-zone', 'exam-awaken');
  if (!wasActive || !collapse || _fxOff()) return;
  const { cx, cy } = _fxBand();
  if (window.MecFX) {
    try {
      window.MecFX.attractor(cx, cy, { ttl: .9, strength: 260000 });
      window.MecFX.rings(cx, cy, { count: 2, color: 'rgba(255,100,100,.65)', thickness: 2, maxR: 240, additive: true });
    } catch (e) {}
  }
  const ov = document.createElement('div');
  ov.className = 'exam-zone-collapse';
  document.body.appendChild(ov);
  ov.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }],
    { duration: 620, easing: 'ease-out', fill: 'forwards' }).onfinish = () => ov.remove();
}

// B7: 覚醒モード（20連続〜）。テーマ配色を高彩度側へ寄せる。ミスで解除。
function _setAwaken(on) {
  if (on && _fxOff()) return;
  document.body.classList.toggle('exam-awaken', !!on);
}

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
const EXAM_BOOT_STYLES = ['mecha', 'cyber', 'steam'];

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
  return ['接続確立 / LINK ESTABLISHED', '電脳ダイブ ... STAND BY', 'BANK ' + qn + ' Q  //  ' + subjLabel];
}

// 戻り値 = カウントダウンが明けるまでのms（B6/B7 がこれに合わせて1問目を立ち上げる）
function _examCountdown() {
  if (_fxOff()) return 0;
  // 起動音は演出と一蓮托生（reduced-motion で演出ごと出ないときは鳴らさない）
  _playBootSound();
  const theme = _examTheme();
  const style = EXAM_BOOT_STYLES[(Math.random() * EXAM_BOOT_STYLES.length) | 0];
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
    // TEMP（昨日の誤答）: _wrongDayJa() は study.html 側が持つ（'今日' / '昨日'）
    if (_todayWrongMode) subjLabel = (window._wrongDayJa?.() === '昨日') ? "YESTERDAY'S MISSES" : "TODAY'S MISSES";
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

  host.className = 'cd-' + style + (_examIsRematch ? ' cd-rematch' : '');
  host.style.setProperty('--cd-col', col);
  host.style.setProperty('--cd-glow', glow);
  host.style.display = 'flex';
  host.innerHTML =
    '<div class="cd-scan"></div>' +
    (style === 'cyber' ? '<div class="cd-stream">' + cols.join('') + '</div>' : '') +
    '<i class="cd-br tl"></i><i class="cd-br tr"></i><i class="cd-br bl"></i><i class="cd-br br"></i>' +
    (style === 'mecha'
      ? '<div class="cd-reticle"><i class="rh"></i><i class="rv"></i>'
        + '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>'
      : style === 'steam'
      ? '<div class="cd-boiler"><i class="cd-bz"></i></div>'
      : '<svg class="cd-rings" viewBox="0 0 200 200" aria-hidden="true">' +
        '<circle class="r1" cx="100" cy="100" r="86"/><circle class="r2" cx="100" cy="100" r="66"/>' +
        '<circle class="r3" cx="100" cy="100" r="46"/></svg>') +
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
  const lines = _examIsRematch ? _examRematchLines(style, qn) : _examBootLines(style, qn, subjLabel);

  const timers = [];
  const kill = () => { timers.forEach(clearTimeout); host.style.display = 'none'; host.innerHTML = ''; host.className = ''; };
  const at = (ms, fn) => timers.push(setTimeout(() => { if (!examMode) { kill(); return; } fn(); }, ms));

  // ① ブートログを1行ずつ点灯
  lines.forEach((ln, i) => at(60 + i * 105, () => {
    const d = document.createElement('div');
    d.className = 'cd-line';
    d.textContent = (style === 'mecha' ? '> ' : style === 'steam' ? '— ' : '// ') + ln;
    logEl.appendChild(d);
    d.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 200, easing: 'ease-out' });
  }));

  // ② 3 → 2 → 1 → 起動語
  const goWord = style === 'mecha' ? 'ALL GREEN' : style === 'steam' ? '全速' : 'DIVE';
  const t0 = 60 + lines.length * 105 + 120;
  ['3', '2', '1'].forEach((n, i) => at(t0 + i * 420, () => {
    host.classList.add('cd-p2');   // ログを上へ退かせて中央を数字に譲る
    // S8: 3・2・1 で絞りが1段ずつ閉じる。⚠️ 尺は増やさない＝既存のカウントに相乗りするだけ
    if (bezel) bezel.style.setProperty('--ap', String(i + 1));
    numEl.textContent = n;
    numEl.className = 'cd-num';
    void numEl.offsetWidth;
    numEl.animate([
      { opacity: 0, transform: 'scale(2.1)', filter: 'blur(6px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: .32 },
      { opacity: 1, transform: 'scale(1)', offset: .72 },
      { opacity: 0, transform: 'scale(.88)' }
    ], { duration: 400, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
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
    numEl.animate([
      { opacity: 0, transform: 'scale(1.5) translateY(6px)' },
      { opacity: 1, transform: 'scale(1)', offset: .3 },
      { opacity: 1, offset: .72 },
      { opacity: 0, transform: 'scale(1.06)' }
    ], { duration: 760, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
    subEl.animate([{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 1, offset: .7 }, { opacity: 0 }],
      { duration: 760, easing: 'ease-out', fill: 'forwards' });
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

// C10: 結果画面のランクスタンプ（S/A/B/C・100%はPERFECT）
function _stampRank(pct) {
  const modal = document.querySelector('#examOverlay .exam-modal');
  if (!modal || _fxOff()) return;
  modal.querySelectorAll('.exam-rank-stamp').forEach(el => el.remove());
  const perfect = pct >= 100;
  // 基準は章カードの色分け（80/60）に合わせ、90以上をSとして上乗せする
  const rank = perfect ? 'PERFECT' : pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C';
  const col = perfect ? '#FFD700' : pct >= 90 ? '#FFD700' : pct >= 80 ? '#3DD68C' : pct >= 60 ? '#FFB830' : '#FF6B6B';
  const el = document.createElement('div');
  el.className = 'exam-rank-stamp' + (perfect ? ' perfect' : '');
  el.textContent = rank;
  el.style.setProperty('--rk-col', col);
  modal.appendChild(el);
  el.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(2.8) rotate(-24deg)' },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(.94) rotate(-13deg)', offset: .3 },
    { transform: 'translate(-50%,-50%) scale(1.05) rotate(-13deg)', offset: .42 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(-13deg)', offset: .55 },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(-13deg)' }
  ], { duration: 720, easing: 'cubic-bezier(.2,1.35,.35,1)', fill: 'forwards' });
  // 押印の衝撃（スタンプ位置から）
  if (window.MecFX) {
    try {
      const r = el.getBoundingClientRect();
      window.MecFX.rings(r.left + r.width / 2, r.top + r.height / 2,
        { count: 2, color: 'rgba(255,255,255,.55)', thickness: 3, maxR: 220, additive: true });
    } catch (e) {}
  }
}

// C11: SRS復習セッションを完走した時の完了演出（習慣化の達成感）
function _srsCompleteCelebration() {
  if (!window.MecFX) return;
  try {
    window.MecFX.glyphRain({ glyphs: ['🔔', '🎉', '✨', '⭐'], colors: ['#FF9A3C', '#FFD166', '#3DD68C', '#60A5FA'], count: 26 });
    window.MecFX.confetti({ count: 60, colors: ['#FF9A3C', '#FFD166', '#3DD68C', '#60A5FA'] });
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

function _showStreakEffect(n) {
  if (n < 2) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const tier = _examTier(n);
  // B4: 昇格フレーム（tierが上がった瞬間）だけフル演出。同ティア内はあえて軽くして山谷を作る。
  const prevTier = (n - 1) < 2 ? 0 : _examTier(n - 1);
  const promoted = tier > prevTier;
  const labels = theme.labels(n);
  const durs   = [0, 2.0, 2.5, 3.2, 4.2, 5.2, 5.8];

  // B5/B7: tier4以上でゾーン突入、20連続で覚醒モード
  if (tier >= 4) _zoneStart();
  _setAwaken(n >= 20);
  if (promoted) _triggerTierUpStamp(tier, n);

  if (promoted && theme.useCRT) _spawnCRTOverlay(tier);
  if (promoted && tier >= 4) _triggerTimeStop(tier);
  if (promoted && tier >= 2) _triggerFullscreenCombo(n, tier);

  const toast = document.getElementById('examStreakToast');
  if (!toast) return;
  toast.getAnimations?.().forEach(a => a.cancel());
  // ⚠️ 試験終了時(_exitExamMode)に opacity:0!important を張るが、!important は WAAPI アニメより
  // 強いため、外さないと同じページで2回目以降の試験ではトーストが一度も出ない。
  toast.style.removeProperty('opacity');
  // 縦位置は固定値(旧 top:68px)ではなく可視帯の上端＝ヘッダー下端に置く。
  // iPadはヘッダーが高く、68px だとヘッダーに重なって上端で切れていた（実機報告・2026-08-04）。
  toast.style.top = _fxBand().top + 'px';
  toast.className = 't' + tier + (promoted ? '' : ' quiet');
  toast.textContent = labels[tier];
  _showStreakSignature(n, tier, promoted);
  void toast.offsetWidth;
  toast.animate([
    {opacity:0, transform:'translateX(-50%) translateY(-22px) scale(.65) rotate(-4deg)', offset:0},
    {opacity:1, transform:'translateX(-50%) translateY(5px) scale(1.18) rotate(1.5deg)', offset:.12},
    {transform:'translateX(-50%) translateY(-3px) scale(.95) rotate(-.5deg)', offset:.20},
    {transform:'translateX(-50%) translateY(1px) scale(1.05)', offset:.30},
    {transform:'translateX(-50%) translateY(0) scale(.99)', offset:.40},
    {transform:'translateX(-50%) translateY(0) scale(1)', offset:.50},
    {opacity:1, offset:.68},
    {opacity:0, transform:'translateX(-50%) translateY(-16px) scale(.88)', offset:1}
  ], {duration: durs[tier] * (promoted ? 1000 : 520), easing:'ease'});
  /* S13(2026-08-21): 打撃の1フレーム。着地の瞬間に一度だけ沈んで戻る（1文字ずつのタイプはしない
     ——ラベルは一瞬で読めることに価値があり、演出のために情報を遅らせてはいけない）。
     ⚠️ translate プロパティで書くこと。入場アニメが transform を占有している。 */
  {
    const _dur = durs[tier] * (promoted ? 1000 : 520);
    toast.animate([
      {translate:'0 0'}, {translate:'0 1.6px', offset:.35}, {translate:'0 0'}
    ], {duration: 200, delay: _dur * .12, easing:'cubic-bezier(.3,1.5,.5,1)'});
  }

  const flash = document.getElementById('examStreakFlash');
  if (flash && promoted && tier >= 2) {
    flash.getAnimations?.().forEach(a => a.cancel());
    const fc = theme.flashColors;
    flash.style.background = fc[tier];
    flash.style.opacity = '0';
    if (tier >= 4) {
      const pulses = tier >= 7 ? 8 : tier >= 6 ? 6 : tier >= 5 ? 4 : 3;
      const kf = [];
      for (let p = 0; p < pulses; p++) kf.push({opacity: p % 2 === 0 ? 0.95 : 0.06});
      kf.push({opacity: 0});
      flash.animate(kf, {duration: 85 * pulses, easing:'linear'});
    } else {
      flash.className = '';
      void flash.offsetWidth;
      flash.className = 'flash';
    }
  }

  if (promoted) {
    if (tier >= 2) _spawnStreakParticles(tier);
    if (tier >= 3) _triggerScreenShake(tier);
    if (tier >= 4) _triggerBorderGlow(tier);
    if (tier >= 5) {
      setTimeout(() => _spawnEmojiFloaters(tier), 80);
      if (theme.useGlitch) _triggerGlitch(tier);
      else if (theme.useBrushSwipe) _inkBrushSwipe(tier);
    }
  } else {
    // 同ティア内の継続。控えめな中央バースト＋リングのみで「積み上がっている」感じだけ残す
    _spawnLightStreakFx(tier);
  }
  _triggerBgBreath(tier);
  _playComboNote(n);
  _updateComboMeter(n);
}

// B4: 昇格しなかったフレーム用の軽量エフェクト
function _spawnLightStreakFx(tier) {
  if (!window.MecFX) return;
  const { cx, cy } = _fxBand();
  const counts = [0, 14, 22, 30, 40, 52, 64, 80];
  _spawnBurst(cx, cy, tier, counts[_tIdx(tier, counts)] || 14);
  const theme = _examTheme();
  try {
    window.MecFX.rings(cx, cy, { count: 1, color: theme.ringColor(tier), thickness: 2, maxR: 130 + tier * 22, additive: examEffectSet !== 'ink' });
  } catch (e) {}
}

// B8: テーマ固有のシグネチャー表示（ecg=心拍数 / retro=スコア / space=ワープ速度 等）
function _showStreakSignature(n, tier, promoted) {
  if (_fxOff()) return;
  const theme = _examTheme();
  if (!theme.signature) return;
  let el = document.getElementById('examStreakSig');
  if (!el) {
    el = document.createElement('div');
    el.id = 'examStreakSig';
    document.body.appendChild(el);
  }
  el.getAnimations?.().forEach(a => a.cancel());
  el.textContent = theme.signature(n);
  el.style.top = (_fxBand().top + 44) + 'px';   // トーストの直下（CSSの top:112px は画面基準）
  el.style.color = (theme.comboColors && theme.comboColors[_tIdx(tier, theme.comboColors)]) || '#FFD700';
  el.animate([
    { opacity: 0, transform: 'translateX(-50%) translateY(-6px)' },
    { opacity: 1, transform: 'translateX(-50%) translateY(0)', offset: .18 },
    { opacity: 1, offset: promoted ? .72 : .5 },
    { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }
  ], { duration: promoted ? 2200 : 1200, easing: 'ease-out', fill: 'forwards' });
}

// 演出レイヤーだけを揺らす。body を transform すると body が position:fixed の包含ブロックになり、
// 揺れている間だけ全ての演出（トースト・特大×n・粒子canvas）がページ先頭基準になって画面外へ飛ぶ。
function _shakeFxLayers(frames, timing) {
  const fxCanvas = document.getElementById('mecFxCanvas');
  if (fxCanvas) fxCanvas.animate(frames, timing);
  const ov = document.getElementById('examShakeOverlay');
  if (ov) ov.animate(frames, timing);
}

// 演出用の固定オーバーレイ（周縁ヴィネット）。body を揺らさないための受け皿。
function _ensureShakeOverlay() {
  let el = document.getElementById('examShakeOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'examShakeOverlay';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9040;opacity:0;';
    document.body.appendChild(el);
  }
  return el;
}

function _triggerScreenShake(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const si = tier >= 7 ? 17 : tier >= 6 ? 13 : tier >= 5 ? 8 : tier >= 4 ? 5 : 3;
  const dur = tier >= 5 ? 480 : tier >= 4 ? 340 : 210;
  const easing = theme.chunkyShake ? `steps(${tier >= 5 ? 8 : 5})` : 'ease-in-out';
  const kf = [
    {transform:'translate(0,0)'},
    {transform:`translate(-${si}px,-${si*.5}px)`},
    {transform:`translate(${si}px,${si*.6}px)`},
    {transform:`translate(-${si*.6}px,${si}px)`},
    {transform:`translate(${si*.4}px,-${si*.8}px)`},
    {transform:`translate(-${si*.3}px,${si*.4}px)`},
    {transform:'translate(0,0)'}
  ];
  // body 全体（最大約5000カード）を transform すると iPad WebKit が巨大レイヤーを再合成し、
  // 重さ・白タイル化を招く。代わりに fixed な演出レイヤー（パーティクルcanvas＋周縁ヴィネット）
  // だけを揺らす。問題カード本体は静止＝安全なまま「画面枠が揺れる」印象を出す。
  const fxCanvas = document.getElementById('mecFxCanvas');
  if (fxCanvas) fxCanvas.animate(kf, {duration: dur, easing});
  const ov = _ensureShakeOverlay();
  const vig = tier >= 7 ? .58 : tier >= 6 ? .5 : tier >= 5 ? .42 : .3;
  ov.style.boxShadow = `inset 0 0 ${tier >= 5 ? 160 : 110}px ${tier >= 5 ? 30 : 18}px rgba(0,0,0,${vig})`;
  ov.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.7},{opacity:0}], {duration: dur, easing:'ease-out'});
  ov.animate(kf, {duration: dur, easing});
}

function _triggerBorderGlow(tier) {
  const el = document.getElementById('examStreakBorder');
  if (!el) return;
  el.getAnimations?.().forEach(a => a.cancel());
  el.style.removeProperty('opacity');   // 前回の試験終了時の opacity:0!important を外す
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const colors = theme.borderColors;
  const sizes  = {4:'6px',5:'9px',6:'13px',7:'17px'};
  const color = colors[_tIdx(tier, colors)];
  const sz = sizes[_tIdx(tier, sizes)];
  el.style.boxShadow = `inset 0 0 0 ${sz} ${color}`;
  const dur = tier >= 5 ? 1300 : 750;
  if (theme.pulseBeat) {
    el.animate([{opacity:.95},{opacity:.2},{opacity:.85},{opacity:.15},{opacity:.9},{opacity:0}], {duration: dur, easing:'ease-out'});
  } else {
    el.animate([{opacity:.9},{opacity:.45},{opacity:.9},{opacity:0}], {duration: dur, easing:'ease-out'});
  }
}

function _spawnEmojiFloaters(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const sets = theme.floaterGlyphs;
  const scale = theme.floaterScale || 1;
  window.MecFX.floaters({
    glyphs: sets[_tIdx(tier, sets)] || sets[5],
    count: Math.round((tier >= 7 ? 36 : tier >= 6 ? 26 : 14) * scale),
    scale: scale
  });
}

function _spawnShockwaveRings(cx, cy, tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const ringCounts = [0,0,1,2,3,4,6,8];
  const maxScale = tier >= 7 ? 48 : tier >= 6 ? 38 : tier >= 5 ? 30 : tier >= 4 ? 22 : tier >= 3 ? 14 : 9;
  window.MecFX.rings(cx, cy, {
    count: ringCounts[_tIdx(tier, ringCounts)],
    color: theme.ringColor(tier),
    thickness: tier >= 5 ? 4 : tier >= 3 ? 3 : 2,
    maxR: maxScale * 20,
    additive: tier >= 4
  });
}

function _spawnBurst(cx, cy, tier, count) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const palettes = theme.burstPalettes;
  window.MecFX.burst(cx, cy, {
    count: Math.round(count * (theme.floaterScale || 1)),
    colors: palettes[_tIdx(tier, palettes)] || palettes[4],
    shapes: theme.shapes(tier),
    tier: tier,
    glow: examEffectSet !== 'ink',
    additive: examEffectSet !== 'ink'
  });
}

function _spawnStreakParticles(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const toast = document.getElementById('examStreakToast');
  if (!toast) return;
  // パーティクルの発生原点はトースト位置(画面最上部)ではなく可視帯の中心にする。
  // 上端だと上向きに飛ぶ粒子・バーストが画面外に抜けて半分しか見えないため（iPad実機・2026-07-08）。
  // 「画面の 0.44」だとヘッダーの高い iPad でまだ上に寄って切れていたので、
  // ヘッダー下端〜画面下端の中心（_fxBand）へ移した（iPad実機・2026-08-04）。
  const { cx, cy } = _fxBand();

  _spawnShockwaveRings(cx, cy, tier);
  _spawnLightning(cx, cy, tier);

  const burstCounts = [0, 0, 50, 140, 340, 580, 900, 1300];
  _spawnBurst(cx, cy, tier, burstCounts[_tIdx(tier, burstCounts)] || 50);

  // 中tier(2-3)は最頻出。単発だと弱いので時間差の二段バースト＋追撃リングで密度を出す
  // （高tier ≥4 は下で既に多段化されているのでそのまま）。
  if (tier === 2 || tier === 3) {
    setTimeout(() => _spawnBurst(cx, cy, tier, tier === 3 ? 80 : 36), tier === 3 ? 150 : 130);
    setTimeout(() => _spawnShockwaveRings(cx, cy, tier), tier === 3 ? 140 : 120);
  }

  if (tier >= 4) setTimeout(() => _spawnBurst(cx, cy, tier, tier >= 6 ? 220 : tier >= 5 ? 150 : 90), 160);
  if (tier >= 5) setTimeout(() => _spawnBurst(cx, cy, tier, tier >= 6 ? 340 : 200), tier >= 6 ? 200 : 340);
  if (tier >= 6) {
    setTimeout(() => _spawnBurst(cx, cy, tier, 250), 400);
    setTimeout(() => _spawnBurst(cx, cy, tier, 170), 600);
    if (theme.useMedalDrop) _spawnMedalDrop(tier);
    if (theme.useBlackHole) _spawnBlackHoleVignette(tier);
    if (theme.useDefib) setTimeout(() => _ecgDefib(tier), 300);
  }

  if (tier >= 4) {
    if (theme.useFireworks) _spawnFirework(tier);
    else if (theme.useCircuitPulse) _neonCircuitPulse(cx, cy, tier);
    else if (theme.useStampBurst) _inkStampBurst(cx, cy, tier);
    else if (theme.useECGSweep) _ecgSweep(tier);
    else if (theme.useBrushCircle) _inkBrushCircle(cx, cy, tier);
    if (theme.useSpotlight) _spawnSpotlightRays(tier);
  }

  if (tier >= 5 && window.MecFX) {
    if (examEffectSet === 'luxury') window.MecFX.dust({count: tier >= 6 ? 90 : 55});
    else if (examEffectSet === 'space') window.MecFX.dust({count: tier >= 6 ? 80 : 50, colors:['#FFFFFF','#FFD54F','#B388FF','#40C4FF']});
  }

  const rainWaves = [0, 0, 0, 1, 3, 6, 10, 15][Math.min(tier, 7)];
  for (let w = 0; w < rainWaves; w++) {
    setTimeout(() => _spawnRain(tier), 55 + w * 120);
  }
}

function _spawnRain(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  if (theme.rainType === 'digital') _spawnDigitalRain(tier);
  else if (theme.rainType === 'petals') _spawnPetalRain(tier);
  else if (theme.rainType === 'warp') _spawnWarpStreaks(tier);
  else if (theme.rainType === 'bubbles') _spawnBubbleRise(tier);
  else _spawnConfettiRain(tier);
}

function _spawnDigitalRain(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  window.MecFX.glyphRain({
    count: tier >= 6 ? 50 : tier >= 5 ? 36 : tier >= 4 ? 24 : 16,
    glyphs: theme.rainGlyphs || ['0','1','#','$','%','&','∆','◆','▮','▯'],
    colors: theme.rainCols || ['#00E5FF','#FF2BD6','#7A5CFF','#39FF88'],
    bigGlyph: tier >= 5,
    additive: true
  });
}

function _spawnPetalRain(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  window.MecFX.petals({
    count: tier >= 6 ? 44 : tier >= 5 ? 32 : tier >= 4 ? 22 : 15,
    colors: theme.rainCols || ['#F4A6B0','#FFFFFF','#E8C468','#C93A3A']
  });
}

function _neonCircuitPulse(cx, cy, tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const n = tier >= 6 ? 3 : tier >= 5 ? 2 : 1;
  const col = theme.ringColor(tier);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'streak-ring exam-fx-temp';
      el.style.cssText = `left:${cx}px;top:${cy}px;width:60px;height:60px;margin:-30px 0 0 -30px;border:2px solid ${col};border-radius:4px;`;
      document.body.appendChild(el);
      el.animate([
        {transform:'scale(0) rotate(0deg)', opacity:.9},
        {transform:`scale(${tier>=6?14:10}) rotate(20deg)`, opacity:0}
      ], {duration: 520 + i*90, easing:'ease-out', fill:'forwards'}).onfinish = () => el.remove();
    }, i * 140);
  }
}

function _inkStampBurst(cx, cy, tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const col = theme.stampColor ? theme.stampColor(tier) : '#C93A3A';
  const sz = 70 + tier * 8;
  const el = document.createElement('div');
  el.className = 'exam-fx-temp';
  el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;margin:${-sz/2}px 0 0 ${-sz/2}px;border:5px solid ${col};border-radius:50%;pointer-events:none;z-index:9060;box-shadow:0 0 24px ${col}80;`;
  document.body.appendChild(el);
  el.animate([
    {transform:'scale(2.2) rotate(-8deg)', opacity:0},
    {transform:'scale(.9) rotate(3deg)', opacity:1, offset:.4},
    {transform:'scale(1) rotate(0deg)', opacity:.9, offset:.55},
    {transform:'scale(1) rotate(0deg)', opacity:0}
  ], {duration: 700, easing:'ease-out'}).onfinish = () => el.remove();
  setTimeout(() => _spawnBurst(cx, cy, tier, tier >= 6 ? 30 : 18), 120);
}

function _inkBrushSwipe(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const rgb = theme.brushColorRgb || '26,26,26';
  const el = document.createElement('div');
  el.className = 'exam-fx-temp';
  el.style.cssText = `position:fixed;top:-20%;left:-30%;width:160%;height:140%;pointer-events:none;z-index:9070;background:linear-gradient(115deg,transparent 42%,rgba(${rgb},.55) 48%,rgba(${rgb},.75) 50%,rgba(${rgb},.55) 52%,transparent 58%);`;
  document.body.appendChild(el);
  el.animate([
    {transform:'translateX(-120%) rotate(-4deg)', opacity:0},
    {transform:'translateX(-40%) rotate(-4deg)', opacity:1, offset:.35},
    {transform:'translateX(40%) rotate(-4deg)', opacity:1, offset:.65},
    {transform:'translateX(120%) rotate(-4deg)', opacity:0}
  ], {duration: tier >= 6 ? 620 : 480, easing:'ease-in-out'}).onfinish = () => el.remove();
}

function _ecgSweep(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const col = theme.fullscreenCols[_tIdx(tier, theme.fullscreenCols)] || '#00E676';
  const _b = _fxBand();
  const w = window.innerWidth;
  const y = _b.top + _b.height * (0.4 + Math.random() * 0.2);
  const amp = tier >= 6 ? 90 : tier >= 5 ? 65 : 40;
  const segW = w / 10;
  let d = `M0,${y.toFixed(0)}`;
  for (let i = 0; i < 10; i++) {
    const x0 = i * segW;
    if (i % 3 === 1) {
      d += ` L${(x0+segW*.2).toFixed(0)},${y.toFixed(0)} L${(x0+segW*.32).toFixed(0)},${(y-amp*.3).toFixed(0)} L${(x0+segW*.42).toFixed(0)},${(y+amp).toFixed(0)} L${(x0+segW*.52).toFixed(0)},${(y-amp*.6).toFixed(0)} L${(x0+segW*.62).toFixed(0)},${y.toFixed(0)} L${(x0+segW).toFixed(0)},${y.toFixed(0)}`;
    } else {
      d += ` L${(x0+segW).toFixed(0)},${y.toFixed(0)}`;
    }
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9070;overflow:visible;';
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', col);
  path.setAttribute('stroke-width', tier >= 5 ? '4' : '3');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.filter = `drop-shadow(0 0 8px ${col})`;
  path.style.strokeDasharray = '3000';
  path.style.strokeDashoffset = '3000';
  svg.appendChild(path);
  document.body.appendChild(svg);
  const dur = tier >= 6 ? 900 : tier >= 5 ? 750 : 600;
  path.animate([{strokeDashoffset:3000},{strokeDashoffset:0}], {duration: dur * .65, easing:'linear', fill:'forwards'});
  svg.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration: dur, easing:'ease-out', fill:'forwards'}).onfinish = () => svg.remove();
}

function _ecgDefib(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const col = theme.fullscreenCols[6] || '#00E5FF';
  const dim = document.createElement('div');
  dim.className = 'exam-fx-temp';
  dim.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:9400;';
  document.body.appendChild(dim);
  const y = _fxBand().cy;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9401;overflow:visible;';
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1','0'); line.setAttribute('y1', y); line.setAttribute('x2', window.innerWidth); line.setAttribute('y2', y);
  line.setAttribute('stroke', col);
  line.setAttribute('stroke-width','3');
  line.style.filter = `drop-shadow(0 0 6px ${col})`;
  svg.appendChild(line);
  document.body.appendChild(svg);
  dim.animate([{opacity:0},{opacity:.55},{opacity:.55},{opacity:0}], {duration:520, easing:'ease-in'}).onfinish = () => dim.remove();
  svg.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration:520, easing:'linear'}).onfinish = () => svg.remove();
  setTimeout(() => {
    const flash = document.getElementById('examStreakFlash');
    if (flash) {
      flash.getAnimations?.().forEach(a => a.cancel());
      flash.style.background = '#FFFFFF';
      flash.style.opacity = '0';
      flash.animate([{opacity:0},{opacity:.9},{opacity:.08},{opacity:.85},{opacity:0}], {duration:260, easing:'linear'});
    }
    // body ではなく演出レイヤーを揺らす（body の transform は fixed 要素の基準をページ先頭にずらす）
    _shakeFxLayers([
      {transform:'translate(0,0)'},{transform:'translate(6px,-4px)'},{transform:'translate(-8px,5px)'},{transform:'translate(0,0)'}
    ], {duration:180, easing:'ease-out'});
  }, 540);
}

function _spawnBlackHoleVignette(tier) {
  const el = document.createElement('div');
  el.className = 'exam-fx-temp';
  el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9040;background:radial-gradient(circle at center, transparent 28%, rgba(0,0,0,.78) 100%);';
  document.body.appendChild(el);
  el.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration: tier >= 6 ? 950 : 700, easing:'ease-in-out'}).onfinish = () => el.remove();
  // 画面中央の引力点が漂うパーティクルを実際に吸い込み、消滅時に外へ弾ける
  if (window.MecFX) {
    const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
    const { cx: bx, cy: by } = _fxBand();
    window.MecFX.attractor(bx, by, {ttl: .75, strength: 130000});
    setTimeout(() => {
      if (!window.MecFX) return;
      window.MecFX.burst(bx, by, {count: 130, colors: theme.burstPalettes[6], shapes: ['star','circle'], tier: 6, glow: true});
      window.MecFX.rings(bx, by, {count: 2, color: 'rgba(224,64,251,.85)', thickness: 4, maxR: 500, additive: true});
    }, 780);
  }
}

function _spawnWarpStreaks(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  window.MecFX.warp({
    count: tier >= 6 ? 80 : tier >= 5 ? 55 : tier >= 4 ? 36 : 20,
    colors: theme.rainCols || ['#FFFFFF','#7C4DFF','#40C4FF']
  });
}

function _spawnBubbleRise(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  window.MecFX.bubbles({
    count: tier >= 6 ? 40 : tier >= 5 ? 28 : tier >= 4 ? 18 : 12,
    colors: theme.rainCols || ['#FFD700','#FFFFFF']
  });
}

function _spawnSpotlightRays(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const col = theme.fullscreenCols[_tIdx(tier, theme.fullscreenCols)] || '#FFD700';
  const el = document.createElement('div');
  el.className = 'exam-fx-temp';
  el.style.cssText = `position:fixed;inset:-50%;pointer-events:none;z-index:9042;background:conic-gradient(from 0deg, transparent 0deg, ${col}40 8deg, transparent 16deg, transparent 60deg, ${col}40 68deg, transparent 76deg, transparent 120deg, ${col}40 128deg, transparent 136deg, transparent 180deg, ${col}40 188deg, transparent 196deg, transparent 240deg, ${col}40 248deg, transparent 256deg, transparent 300deg, ${col}40 308deg, transparent 316deg);`;
  document.body.appendChild(el);
  const dur = tier >= 6 ? 1400 : 1000;
  el.animate([
    {transform:'rotate(0deg)', opacity:0},
    {opacity:.9, offset:.15},
    {opacity:.9, offset:.8},
    {transform:`rotate(${tier >= 6 ? 140 : 90}deg)`, opacity:0}
  ], {duration: dur, easing:'ease-out'}).onfinish = () => el.remove();
}

function _spawnMedalDrop(tier) {
  const glyphs = ['🏆','🥇','👑'];
  const count = 3;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'exam-fx-temp';
      const b = _fxBand();
      const x = b.left + b.width * (0.25 + i * 0.25);
      // 画面上端(-80px)から落として可視帯の中心で受け止める（0.4×画面高だとヘッダーの高い端末で上に止まる）
      const drop = Math.round(b.cy + 48);
      el.textContent = glyphs[i % glyphs.length];
      el.style.cssText = `position:fixed;left:${x.toFixed(0)}px;top:-80px;font-size:64px;pointer-events:none;z-index:9066;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));`;
      document.body.appendChild(el);
      el.animate([
        {transform:'translateY(0) rotate(-8deg) scale(.6)', opacity:0},
        {transform:`translateY(${drop + 20}px) rotate(4deg) scale(1.15)`, opacity:1, offset:.55},
        {transform:`translateY(${drop - 20}px) rotate(-2deg) scale(1)`, offset:.7},
        {transform:`translateY(${drop}px) rotate(0deg) scale(1)`, opacity:1, offset:.85},
        {opacity:0}
      ], {duration:1400, easing:'cubic-bezier(.22,.9,.3,1.3)'}).onfinish = () => el.remove();
    }, i * 140);
  }
}

function _spawnCRTOverlay(tier) {
  const el = document.createElement('div');
  el.className = 'exam-fx-temp';
  el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9075;mix-blend-mode:multiply;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0px,rgba(0,0,0,.25) 1px,transparent 2px,transparent 4px);';
  document.body.appendChild(el);
  el.animate([{opacity:0},{opacity:.8},{opacity:.8},{opacity:0}], {duration: tier >= 6 ? 900 : 600, easing:'ease-in-out'}).onfinish = () => el.remove();
}

function _inkBrushCircle(cx, cy, tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const col = theme.stampColor ? theme.stampColor(tier) : '#C93A3A';
  const r = 55 + tier * 6;
  const segs = 40;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2 * 1.08;
    const jitter = (Math.random() - .5) * 6;
    pts.push([(cx + Math.cos(a) * (r + jitter)).toFixed(1), (cy + Math.sin(a) * (r + jitter)).toFixed(1)]);
  }
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9070;overflow:visible;';
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', col);
  path.setAttribute('stroke-width', tier >= 6 ? '10' : '7');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.style.filter = `drop-shadow(0 0 6px ${col})`;
  const len = 2 * Math.PI * r * 1.15;
  path.style.strokeDasharray = String(len);
  path.style.strokeDashoffset = String(len);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const drawDur = tier >= 6 ? 520 : 380;
  path.animate([{strokeDashoffset:len},{strokeDashoffset:0}], {duration: drawDur, easing:'ease-in-out', fill:'forwards'});
  svg.animate([{opacity:1},{opacity:1},{opacity:0}], {duration: drawDur + 500, easing:'ease-in', fill:'forwards'}).onfinish = () => svg.remove();
  setTimeout(() => _spawnBurst(cx, cy, tier, tier >= 6 ? 24 : 14), drawDur * 0.7);
}

function _spawnConfettiRain(tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const cols = theme.rainCols || ['#FFD700','#FF9800','#FF5722','#4FC3F7','#81C784','#BA68C8','#F06292','#FFFFFF','#FFE082','#AED581','#EE88FF','#CC44FF'];
  window.MecFX.confetti({
    count: tier >= 6 ? 120 : tier >= 5 ? 85 : tier >= 4 ? 55 : 40,
    colors: cols,
    big: tier >= 5
  });
}

function _spawnLightning(cx, cy, tier) {
  if (tier < 3) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  if (theme.useLightning === false) return;
  if (!window.MecFX) return;
  window.MecFX.lightning(cx, cy, {
    bolts: tier >= 7 ? 18 : tier >= 6 ? 14 : tier >= 5 ? 9 : tier >= 4 ? 5 : 3,
    color: theme.lightningCols[_tIdx(tier, theme.lightningCols)],
    tier: tier
  });
}

function _spawnFirework(tier) {
  if (tier < 4) return;
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const palettes = theme.burstPalettes;
  window.MecFX.fireworks({
    count: tier >= 7 ? 11 : tier >= 6 ? 8 : tier >= 5 ? 5 : 3,
    colors: palettes[_tIdx(tier, palettes)] || palettes[4],
    tier: tier
  });
}

// 旧実装は body 全体への filter で iPad では最重量級だったため、
// 軽い transform ジッター + Canvas のグリッチ帯に置き換え
function _triggerGlitch(tier) {
  if (tier < 5) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const heavy = !!theme.useHeavyGlitch;
  if (window.MecFX) {
    window.MecFX.glitchBars({
      count: (tier >= 6 ? 14 : 9) + (heavy ? 5 : 0),
      thick: tier >= 6,
      long: heavy
    });
  }
  const amp = tier >= 7 ? 9 : tier >= 6 ? 7 : 4;
  const pulses = tier >= 7 ? 9 : tier >= 6 ? 7 : 5;
  const frames = [{transform:'translate(0,0)'}];
  for (let p = 0; p < pulses; p++) {
    frames.push({transform:`translate(${((Math.random()-.5)*amp*2).toFixed(1)}px,${((Math.random()-.5)*amp).toFixed(1)}px)`});
  }
  frames.push({transform:'translate(0,0)'});
  // ⚠️ body を transform してはいけない。transform された要素は position:fixed の包含ブロックに
  // なるため、揺れている間だけ全ての演出レイヤー（トースト・×n・canvas）がページ先頭を基準に
  // 描かれ、画面上部へ飛んで見切れる。_triggerScreenShake と同じく演出レイヤーだけを揺らす。
  _shakeFxLayers(frames, {duration: tier >= 6 ? 480 : 330, easing:`steps(${pulses})`});
}

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

function _triggerChoiceCorrectPop(el) {
  if (!el) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  el.animate([
    {transform:'scale(1)',filter:'brightness(1)'},
    {transform:'scale(1.18) translateY(-6px)',filter:'brightness(2.2)',offset:.15},
    {transform:'scale(.94) translateY(2px)',filter:'brightness(1.4)',offset:.37},
    {transform:'scale(1.06)',offset:.56},
    {transform:'scale(1)',filter:'brightness(1)'}
  ], {duration:480, easing:'cubic-bezier(.22,.8,.36,1.25)'});
  const card = el.closest('.qc');
  if (card) {
    card.classList.remove('card-3d-pop');
    void card.offsetWidth;
    card.classList.add('card-3d-pop');
    setTimeout(() => card.classList.remove('card-3d-pop'), 600);

    const ov = document.createElement('div');
    ov.style.cssText = `position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:${theme.popOverlay};`;
    card.style.position = 'relative';
    card.prepend(ov);
    ov.animate([{opacity:1},{opacity:.6,offset:.3},{opacity:0}], {duration:700, easing:'ease-out'}).onfinish = () => ov.remove();

    // 【案6】神速の一閃スラッシュ ＆ 残像フリーズ（≤2秒の速答時）
    if (!_fxOff() && window.MecFX && _fastGrade(card) === 1) {
      document.body.classList.add('exam-slash-freeze');
      setTimeout(() => document.body.classList.remove('exam-slash-freeze'), 220);
      const cr = card.getBoundingClientRect();
      const col = (theme.fastLabels && theme.burstPalettes && theme.burstPalettes[2]) ? theme.burstPalettes[2][0] : '#FFE040';
      window.MecFX.slashRibbon(cr.left - 30, cr.top - 10, cr.right + 30, cr.bottom + 10, { color: col, width: 8, ttl: .55 });
    }
  }
  _spawnScatteredCelebration(theme);
}

// 選択肢付近以外に出す祝祭エフェクト。中央1点に固定せず、互いに離れたランダムな複数箇所へ
// 0.05秒ずつ遅延して連続発火する（肢のポップは別途肢の上で光る＝そちらは文脈表示として維持）。
// 位置は最小距離リジェクションで重複を避ける。上寄り中央帯に置き、答えた肢や下のカードに被りにくくする。
function _scatterPositions(n, minDist) {
  const b = _fxBand();
  const x0 = b.left + b.width * 0.08, x1 = b.left + b.width * 0.92;
  const y0 = b.top + b.height * 0.06, y1 = b.top + b.height * 0.86;
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard < n * 40) {
    guard++;
    const x = x0 + Math.random() * (x1 - x0);
    const y = y0 + Math.random() * (y1 - y0);
    if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) pts.push({ x, y });
  }
  // 最小距離を満たす点が足りなければ距離条件を無視して埋める
  while (pts.length < n) pts.push({ x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0) });
  return pts;
}

function _spawnScatteredCelebration(theme) {
  if (!window.MecFX) return;
  const t = Math.max(2, Math.min(_examTier(examStreak) || 2, 7));
  const pal = theme.burstPalettes[t] || theme.burstPalettes[2];
  const isInk = examEffectSet === 'ink';
  const glyphs = theme.correctEmoji; // classic は無し
  const n = 5 + Math.min(t, 4);       // 5〜9 箇所
  const _sb = _fxBand();
  const minDist = Math.min(_sb.width, _sb.height) * 0.22;
  const pts = _scatterPositions(n, minDist);
  pts.forEach((p, i) => {
    setTimeout(() => {
      if (!window.MecFX) return;
      window.MecFX.rings(p.x, p.y, { count: 2, color: theme.ringColor(t), thickness: 4, maxR: 130 + t * 24, additive: !isInk });
      window.MecFX.burst(p.x, p.y, { count: 32 + t * 8, colors: pal, shapes: isInk ? ['shard', 'square'] : ['circle', 'star', 'gem'], tier: 4, scale: 1.6, speed: 450 + t * 50, glow: !isInk, additive: !isInk });
      if (glyphs && glyphs.length) window.MecFX.glyphBurst(p.x, p.y, { glyphs: glyphs, count: 4, w: 140, spread: 140 });
    }, i * 45);   // 0.045秒ずつ遅延して連続発火
  });

  // 【案1】高コンボ時の全画面オーバードライブ ＆ 稲妻
  if (t >= 4 && !_fxOff()) {
    document.body.classList.add('exam-overdrive');
    window.MecFX.lightning({ count: 3, color: pal[0] || '#FFD700', glow: true });
  }

  // テーマ固有シグネチャエミッタ（1回だけ可視帯の中心付近から発火）
  if (t >= 3 && !_fxOff()) {
    if (examEffectSet === 'ecg' && window.MecFX.defibShock) {
      window.MecFX.defibShock(_sb.cx, _sb.cy, { color: '#00E676', boltColor: '#00E5FF', count: 48 });
    } else if (examEffectSet === 'ink' && window.MecFX.brushDust) {
      window.MecFX.brushDust(_sb.cx, _sb.cy, { count: 40 + t * 8 });
    } else if (examEffectSet === 'retro' && window.MecFX.pixelPop) {
      window.MecFX.pixelPop(_sb.cx, _sb.cy, { count: 44 + t * 8 });
    } else if (examEffectSet === 'luxury' && window.MecFX.diamondSparkle) {
      window.MecFX.diamondSparkle(_sb.cx, _sb.cy, { count: 48 + t * 8 });
    }
  }
}

function _spawnFloatingCombo(card, n, tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const el = document.createElement('div');
  const cols = theme.comboColors;
  const sz = 16 + Math.min(tier,7) * 4;
  el.textContent = theme.comboLabel(n);
  // 位置はカード相対だとカードのスクロール位置で上端に寄って見切れ、演出ごとに高さがバラつく。
  // 粒子・全画面コンボ数字と同じ可視帯の中心(_fxBand)に統一して、正解/連続正解の演出をまとめる。
  // ⚠️ 上へ70px飛ぶアニメがあるので、焦点は帯の中心より下げない。
  const { cx, cy } = _fxBand();
  el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-weight:900;font-size:${sz}px;color:${cols[_tIdx(tier, cols)]};pointer-events:none;z-index:9200;text-shadow:0 2px 12px rgba(0,0,0,.7);transform:translateX(-50%);white-space:nowrap;`;
  document.body.appendChild(el);
  el.animate([
    {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)'},
    {opacity:0,transform:'translateX(-50%) translateY(-70px) scale(1.3)'}
  ], {duration:900, easing:'cubic-bezier(.22,.68,0,1.2)', fill:'forwards'}).onfinish = () => el.remove();
}

function _triggerBgBreath(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const rgbs = theme.bgRgbs;
  const rgb = rgbs[_tIdx(tier, rgbs)];
  const dur = tier >= 4 ? 1400 : tier >= 2 ? 1100 : 800;
  const str = tier >= 5 ? .12 : tier >= 3 ? .08 : .05;
  const el = document.createElement('div');
  el.className = 'exam-bg-breath';
  el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:9000;background:radial-gradient(ellipse at 50% 50%,rgba(${rgb},${str}) 0%,transparent 70%);opacity:0;`;
  document.body.appendChild(el);
  el.animate([{opacity:0},{opacity:1,offset:.2},{opacity:.7,offset:.5},{opacity:0}],
    {duration:dur, easing:'ease-in-out', fill:'forwards'}).onfinish = () => el.remove();
}

function _playComboNote(n) {
  const ctx = _getExamAudioCtx();
  if (!ctx || _comboSound === 'off') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  if (_comboSound === 'ping') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.07, t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.12);
    osc.start(t); osc.stop(t+.13);
  } else if (_comboSound === 'pop') {
    osc.type = 'square'; osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.04, t+.005);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.05);
    osc.start(t); osc.stop(t+.06);
  } else if (_comboSound === 'ding') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.08, t+.01);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.18);
    osc.start(t); osc.stop(t+.2);
  } else if (_comboSound === 'sweep') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(1300, t+.12);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.07, t+.01);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.14);
    osc.start(t); osc.stop(t+.15);
  } else if (_comboSound === 'drum') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t+.07);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.12, t+.005);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.09);
    osc.start(t); osc.stop(t+.1);
  } else {
    // rise (default): sine, pitch rises with streak
    const freq = 261.63 * Math.pow(2, Math.min(n-1,23)/12);
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.09, t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001, t+.28);
    osc.start(t); osc.stop(t+.3);
  }
}

function _updateComboMeter(n) {
  const meter = document.getElementById('examComboMeter');
  const fill  = document.getElementById('examComboMeterFill');
  const lbl   = document.getElementById('examComboMeterLbl');
  if (!meter || !fill) return;
  if (n < 2) {
    meter.style.opacity='0'; fill.style.width='0%'; if (lbl) lbl.style.opacity='0';
    meter.classList.remove('tier-overheat');
    document.querySelectorAll('.qc').forEach(c => c.classList.remove('card-heat-low', 'card-heat-mid', 'card-heat-max'));
    return;
  }
  meter.style.opacity = '1';
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const tier = _examTier(n);
  const starts=[0,2,4,7,10,15,20,30], ends=[0,4,7,10,15,20,30,40];
  const pct = tier>=7 ? 100 : ((n-starts[tier])/(ends[tier]-starts[tier])*100);
  const grads = theme.meterGrads;
  fill.style.background = grads[_tIdx(tier, grads)];
  fill.style.width = pct.toFixed(1) + '%';
  meter.classList.toggle('tier-overheat', tier >= 7);

  // 【案1】カード赤熱ヒートチャージ連動
  const curCard = document.querySelector('.qc.exam-key-focus') || document.querySelector('.qc:not(.exam-revealed)');
  if (curCard) {
    curCard.classList.toggle('card-heat-low', tier >= 2 && tier < 4);
    curCard.classList.toggle('card-heat-mid', tier >= 4 && tier < 6);
    curCard.classList.toggle('card-heat-max', tier >= 6);
  }

  // B6: 次のティアまで残り何問かを表示（今まで3pxバーだけで誰も気づけなかった）
  if (lbl) {
    const remain = tier >= 7 ? 0 : ends[tier] - n;
    lbl.textContent = tier >= 7 ? '⚡ MAX' : ('あと ' + remain + ' で TIER ' + (tier + 1));
    lbl.style.color = (theme.comboColors && theme.comboColors[_tIdx(tier, theme.comboColors)]) || '#FFD700';
    lbl.style.opacity = '1';
    lbl.getAnimations?.().forEach(a => a.cancel());
    lbl.animate([{opacity:1},{opacity:1,offset:.7},{opacity:0}], {duration:2400, easing:'ease-out', fill:'forwards'});
  }
  const prev = n-1 < 2 ? 0 : _examTier(n-1);
  if (tier > prev) {
    meter.animate([{height:'3px'},{height:'7px'},{height:'3px'}],{duration:400,easing:'ease-out'});
    if (tier >= 7 && window.MecFX && !_fxOff()) {
      window.MecFX.steam(window.innerWidth - 60, 20, { count: 3, w: 40, rise: 50, min: 14, max: 28, alpha: .22 });
    }
  }
}

function _resetComboMeter() {
  const meter = document.getElementById('examComboMeter');
  const fill  = document.getElementById('examComboMeterFill');
  const lbl   = document.getElementById('examComboMeterLbl');
  if (meter) meter.classList.remove('tier-overheat');
  document.querySelectorAll('.qc').forEach(c => c.classList.remove('card-heat-low', 'card-heat-mid', 'card-heat-max'));
  if (lbl) { lbl.getAnimations?.().forEach(a => a.cancel()); lbl.style.opacity = '0'; }
  if (!meter || !fill || !parseFloat(fill.style.width)) return;
  fill.animate([{width:fill.style.width},{width:'0%'}],{duration:280,easing:'ease-in',fill:'forwards'})
    .onfinish = () => { meter.style.opacity='0'; fill.style.width='0%'; };
}

function _applyChoiceShimmer(card) {
  if (!card) return;
  card.querySelectorAll('.ch2').forEach((ch, i) => {
    setTimeout(() => {
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
  // A2: 「初見か」「かつて落とした問題か」も同じ加算前の値から取り、演出側へ持ち越す。
  // _afterCorrectFx はこの関数より後に走るので、ここで控えないと判定できない。
  _lastAnswerPrior = { uid: uid, fresh: !(_prev && (_prev.total || 0) > 0), wasWrong: _wasWrong };
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
  const uid = card.dataset.uid;
  const isCorrect = g.correct;
  examAnswered++;
  examBySubj[sid].total++;
  _tallyChapter(uid, isCorrect);
  _tallyQuestion(card, isCorrect);            // B3/B5: 難問の成績とセッションの正誤
  _markExamDone(uid);
  _recordMyRate(uid, isCorrect);
  // 計算問題は「何と答えたか」が誤りの構造を示す（BSAで割り忘れれば 36 が出る等）ので
  // 入力値をそのまま解答ログに残す。肢の概念が無いため mec_choice_v1 には書かない。
  _logAttempt(card, isCorrect, g.entered);
  if (!_isScoreExcluded(card)) _updateSRS(uid, isCorrect);
  MecCalc.lock(card, isCorrect);
  if (!isCorrect) _examSessionWrongChoices.set(uid, g.display);
  const revBtn = card.querySelector('.exam-reveal-btn');
  if (revBtn) delete revBtn.dataset.ready;
  // 演出は選択肢要素を掴む前提なので、入力型では桁の枠をアンカーにする
  const fxEl = MecCalc.anchor(card) || card;
  if (isCorrect) {
    examCorrect++;
    examStreak++;
    examBySubj[sid].correct++;
    _playCorrectSound();
    _showStreakEffect(examStreak);
    { const _t = _examTier(examStreak); _triggerChoiceCorrectPop(fxEl); _spawnFloatingCombo(card, examStreak, _t); }
    _correctShockwave(fxEl);
    _traceCardBorder(card);
    _afterCorrectFx(card, fxEl);
    card.classList.add('exam-revealed', 'exam-multi-correct');
    if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
    _updateExamProg(true);
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    setTimeout(() => _scrollToNextCard(card), 300);
  } else {
    const _broke = examStreak;   // C1: 0 にする前に控える
    examStreak = 0;
    _resetComboMeter();
    _clearDarkFx();
    _zoneStop(true);
    _afterWrongFx(card, fxEl, _broke);
    examWrong.push(uid);
    card.classList.add('exam-revealed');
    if (revBtn) { revBtn.textContent = '▼ 解答を隠す'; revBtn.onclick = () => _toggleWrongAnswer(card, revBtn); }
    _updateExamProg();
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    _maybeShowFinishBtn();
  }
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
  if (remaining.length) { if (btn) btn.remove(); return null; } // まだ未回答が残る
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = 'examFinishBtn';
  btn.className = 'exam-finish-btn';
  btn.textContent = '📊 結果画面に進む';
  btn.onclick = () => { btn.disabled = true; exitExam(); };
  // DOM順で最後の試験カードの直後に挿入
  const ordered = examQueue.slice().sort((a, b) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
  const lastCard = ordered[ordered.length - 1];
  if (lastCard && lastCard.parentNode) lastCard.after(btn);
  else (document.querySelector('.ct') || document.body).appendChild(btn);
  return btn;
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

function _scrollToNextCard(fromCard) {
  const allShown = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none');
  const unrevealed = allShown.filter(c => !c.classList.contains('exam-revealed'));
  if (!unrevealed.length) { _showFinishAndScroll(); return; }
  let next;
  if (fromCard) {
    const idx = allShown.indexOf(fromCard);
    next = allShown.slice(idx + 1).find(c => !c.classList.contains('exam-revealed'));
  }
  if (!next) next = unrevealed[0];
  if (next) setTimeout(() => _applyChoiceShimmer(next), 140);
  const hdr = document.querySelector('.st-hdr');
  const y = next.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight + 8 : 0);
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}

function _removeCardFromExam(card) {
  const idx = examQueue.indexOf(card);
  if (idx < 0) return;
  // カードを隠す前に次の未回答カードを特定（nullを渡すと先頭スクロールになるため）
  const allShown = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none');
  const cardIdx = allShown.indexOf(card);
  const nextTarget = allShown.slice(cardIdx + 1).find(c => !c.classList.contains('exam-revealed'));
  examQueue.splice(idx, 1);
  card.querySelectorAll('.mec-err-panel.open').forEach(p => p.classList.remove('open'));
  card.style.display = 'none';
  _updateExamProg();
  _saveExamResume();
  const remaining = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
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

/* B7: 1問目の入場。カウントダウンが明けた直後の1枚だけ、登場を作る。
   2問目以降と同じ出方だと「幕が上がった」感覚が生まれない。 */
function _firstCardEntrance(card) {
  if (!card || !card.isConnected || _fxOff()) return;
  card.classList.remove('exam-first-in'); void card.offsetWidth;
  card.classList.add('exam-first-in');
  setTimeout(() => card.classList.remove('exam-first-in'), 1200);
}

function _restoreChoices() {
  _examChoiceBackup.forEach((originals, uid) => {
    const cs = document.querySelector(`.qc[data-uid="${uid}"] .cs`);
    if (!cs) return;
    cs.innerHTML = '';
    originals.forEach(c => cs.appendChild(c));
  });
  _examChoiceBackup.clear();
}

function _updateExamProg(isCorrect = false) {
  const total = Math.max(0, examQueue.length - (_examExcludedCount || 0)); // 採点除外は分母から除く
  const fill = document.getElementById('examProgFill');
  const txt = document.getElementById('examProgTxt');
  if (fill) fill.style.width = total > 0 ? (examAnswered / total * 100) + '%' : '0%';
  _syncExamProgMarks();   // B2: 目盛り・難問印・ラストスパート（祝わない）
  if (txt) {
    const before = txt.textContent;
    if (_isHostSession()) {
      const remaining = total - examAnswered;
      const streakPart = examStreak >= 2 ? `  🔥×${examStreak}` : '';
      txt.textContent = '残り ' + remaining + ' 問' + streakPart;
    } else {
      txt.textContent = examAnswered + ' / ' + total + ' 問';
    }
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
    } else if (txt.textContent !== before) {
      txt.getAnimations?.().forEach(a => a.cancel());
      txt.animate([
        {scale:'1.12',textShadow:'0 0 14px rgba(255,196,90,.85)'},
        {scale:'1',textShadow:'0 0 8px rgba(255,196,90,.35)'}
      ], {duration:250, easing:'cubic-bezier(.34,1.4,.64,1)'});
    }
  }
  // 【案4】10問ごとのチェックポイント・ワープゲート突破
  if (examAnswered > 0 && examAnswered % 10 === 0 && examAnswered < total) {
    setTimeout(() => _triggerWarpGate(examAnswered), 320);
  }
}

let _examScrollRaf = null;

/* D9(2026-08-19): 稼働灯。カードに向かっている間だけヘッダのレールを光が走り、答えた瞬間に消える。
   ⚠️ フックは _updateExamFocus の1か所だけにすること。_afterCorrectFx は複数選択の経路を通らず、
      _tallyQuestion は3箇所に散る。_updateExamFocus は開始・スクロール・解答直後の3経路すべてを
      含む9箇所から呼ばれており、1関数で全経路を覆えて取りこぼしが構造的に起きない。 */
// カードに向かってから点灯するまでの遅延。★既定 0（2026-08-19 ユーザー決定）。
// 定数のまま残してあるのは、解答速度によって体感が正反対に振れるため（1問10秒なら拍が読めるが、
// 6秒だと点滅に近くうるさい）。倒すなら FAST_TIER_MS[2]=7000（A3 の「速答ではない」の境目）を
// 再利用する——A3 が褒める区間は静かで、褒めない区間だけ機械が回るという筋が通り、新しい定数も
// 増えない。⚠️ 分布は推測せず mec_attempts_v1 の所要秒（弱点カルテの素材）から出すこと。
const EXAM_IDLE_DELAY_MS = 0;
// 解答してから再点灯するまでの「一息」。解答演出とほぼ同尺。
const EXAM_IDLE_BEAT_MS = 1200;
// ⚠️ タイマーは常に1本。張り直す前に必ず clearTimeout する。_updateExamFocus はスクロールの
//    たびに走る＝この経路で一番呼ばれる関数なので、守らないと多重発火する
//    （_armHold・_startGaugeAmbient で同じ型の前科が2件ある）。
let _examIdleTimer = null;
let _examIdleHoldUntil = 0;   // この時刻までは点けない（解答直後の一息）
let _examIdleFocusUid = null; // いま焦点のカード。変わった時だけ _examIdleFocusAt を打ち直す
let _examIdleFocusAt = 0;

function _getExamTargetCard() {
  const hdr = document.querySelector('.st-hdr');
  const hdrH = hdr ? hdr.getBoundingClientRect().bottom : 0;
  const visibleCards = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
  return visibleCards.find(c => c.getBoundingClientRect().bottom > hdrH) || null;
}
/* R3(Phase 5): 連続正解を読書中も残す。tier の色を焦点枠（盤面側）へ流す。
   ⚠️ クランプ(R5)は筐体なので真鍮固定＝ここで色を振るのは outline と glow だけ。
   ⚠️ tier で配列を引くときは必ず _tIdx を使う（Math.min(tier,6) を新しく書かない）。
   ⚠️ 呼ぶ場所は _updateExamFocus の中だけ。誤答時は C1（コンボメーター崩落）が examStreak を
      読んでから同期処理が走る順になっており、先に色を戻すと崩落と競合する。 */
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
  /* S4(2026-08-21): 軸光の明るさだけ tier に載せる。⚠️ 色は CSS 側で琥珀固定＝ここでは
     段（0〜7）しか渡さない。色まで渡すと筐体がテーマ可変になり Phase 4 の前提が消える。 */
  st.setProperty('--exam-axle', String(examStreak >= 2 ? _examTier(examStreak) : 0));
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

  // ── D9 稼働灯 ───────────────────────────────────────────────────────────
  clearTimeout(_examIdleTimer); _examIdleTimer = null;  // ★張り直す前に必ず落とす
  if (_fxOff()) { document.body.classList.remove('exam-idle-lit'); return; }
  // 直前まで焦点だったカードが解答済みになった＝「答えた瞬間」。ここで止めるのが D9 の要。
  if (prevFocus && prevFocus !== card && prevFocus.classList.contains('exam-revealed')) {
    _examIdleHoldUntil = Date.now() + EXAM_IDLE_BEAT_MS;
    // R1(Phase 5): 溜まっていた圧を解答の瞬間に放出する。⚠️ ここに置く理由は D9 と同じで、
    // この分岐が単一・複数選択・計算・採点除外の**全経路**を1か所で捉える唯一の場所だから
    // （_afterCorrectFx は複数選択を通らず、_tallyQuestion は3箇所に散る）。
    // S1(Phase 7): 排圧計の針も同じ1つの出来事に加わる。⚠️ ここに置くのは D9・R1 と同じ理由で、
    //    この分岐が単一・複数選択・計算・採点除外の**全経路**を1か所で捉える唯一の場所だから。
    if (_examPressureBuilt(prevFocus)) { _examPuffSteam(true); _reliefKick(prevFocus); }
  }
  if (!card) { document.body.classList.remove('exam-idle-lit'); return; }
  const uid = card.dataset.uid || null;
  if (uid !== _examIdleFocusUid) { _examIdleFocusUid = uid; _examIdleFocusAt = Date.now(); }
  // 遅延は「焦点になった時刻」から測る。呼ばれた時刻から測るとスクロールのたびに延び続ける。
  const wait = Math.max(_examIdleFocusAt + EXAM_IDLE_DELAY_MS, _examIdleHoldUntil) - Date.now();
  if (wait <= 0) { document.body.classList.add('exam-idle-lit'); return; }
  document.body.classList.remove('exam-idle-lit');
  _examIdleTimer = setTimeout(() => {
    _examIdleTimer = null;
    if (examMode && !_fxOff() && _getExamTargetCard()) document.body.classList.add('exam-idle-lit');
  }, wait);
}
/* ══ Phase 5 段2(2026-08-19): 稼働灯まわり ═══════════════════════════════════
   R1 圧が溜まり解答で放出する（蒸気）／R8 スクロールに機械が応答する／R10 離席でスリープ。
   設計 §11-5。 */

/* R1: 読書が FAST_TIER_MS[2]（7秒＝A3 が「速答ではない」と判定する境目）を超えたら圧が溜まる。
   ⚠️ 新しいしきい値の定数を作らないこと。この再利用によって「A3 が褒める区間は静かで、
      褒めない区間だけ機械が動く」という筋が通る（D9 のコメントが既に提案していた）。
   ⚠️ 経過時刻の帳簿を新設しないこと。_examCardSeenAt（_markCardSeen が記録・速答判定の起点）が正本。 */
const STEAM_EVERY_MS = 3200;
let _examSteamInt = null;
function _examPressureBuilt(card) {
  const uid = card && card.dataset && card.dataset.uid;
  const t0 = uid ? _examCardSeenAt.get(uid) : 0;
  return !!t0 && (Date.now() - t0) >= FAST_TIER_MS[2];
}
/* 蒸気はレール（＝ヘッダ下端）の両端の安全弁から上がる。
   ⚠️ blend:false を必ず渡すこと。加算合成にすると湯気ではなく発光体になる（ハブのゲージで踏んだ罠）。

   ⚠️⚠️ 噴気（release=false）と放出（release=true）で**掛かる制約がまるで違う**。
      噴気は読んでいる最中に出るので原則1（周辺視野）・原則2（文字に重ねない）に縛られ、
      薄さで止めなければならない。**放出は解答した後＝読解がもう終わっている瞬間**なので
      その制約は掛からず、正解／誤答の演出と同じ土俵で大きく出してよい。
      2026-08-19 の初版は放出量を噴気の延長で決めており（両弁あわせて14粒・最大44px）、
      「小さすぎる」との報告を受けて放出側だけを約2.5倍へ引き上げた。**噴気は据え置き**。
   ⚠️ 正解と誤答で量も色も変えないこと。この演出が量っているのは正誤ではなく**費やした思考**で、
      「機械は判定しない、ただ圧を抜くだけ」という性格が誤答時に効く（誤答は罰さない方針）。
   ⚠️ 発生源はレールの両端2点のまま増やさない。安全弁が2つという筋書きが崩れる。
      量は「点を増やす」のではなく「1つの弁を大きくする」（count と w）で出す。
   ⚠️ w を広げても DOM は1pxも動かない（fixed の canvas 描画なので、あふれても
      iOS のレイアウトビューポートは広がらない＝2026-08-19 の縮尺振動とは無関係）。 */
/* 放出は「弁から内側へ伸びる噴煙」として、左右2本を画面中央で重なるところまで届かせる。
   ⚠️ MecFX.steam の引数や既定値を変えないこと（エミッタは純増の約束＝7テーマ全部に波及する）。
      横へ伸ばすのは **同じ弁から x をずらして複数回呼ぶ**ことで作る。steam の w は左右対称に
      撒くので、弁1点で w を広げると画面外へ半分捨てることになる。
   ⚠️ 到達距離は画面幅に比例させること。固定 px にすると iPad(820〜1024) では中央を大きく
      越え、デスクトップ(1920)では全く届かない。SPAN は「弁から内側へ画面幅の何割伸ばすか」。
   ⚠️ drag は Math.pow(drag, dt*60) ＝ .985 なら1秒で速度が約40%まで落ちる。横speed を上げても
      距離は伸びにくいので、届かせるのは速度ではなく **発生位置の分散（下の STEPS）**で作る。 */
const STEAM_SPAN = .42;   // 弁から内側へ伸ばす割合（画面幅比）
const STEAM_STEPS = 4;    // 弁元から内へ向かう小噴出の数（弁元ほど濃い）
/* 「濃い煙」は alpha だけでなく色でも作る。**弁元（核）を暗く、外へ行くほど明るく**すると
   厚みのある煙に見える（本物の濃煙も核が暗い）。⚠️ 真っ黒にしないこと——蒸気機関の湯気で
   あって火災の煙ではないし、暗くしすぎると濃紺系のベース配色に沈んで逆に見えなくなる。
   ⚠️ glowSprite は色ごとにキャッシュされるので、色を増やすとスプライトが増える（4色なら4枚）。
      色をランダムにしないこと（毎回新しいスプライトを焼くことになる）。 */
const STEAM_TONES = ['#B9B0A0', '#CFC6B4', '#E0DACB', '#EFEAE0'];
function _examPuffSteam(release) {
  if (!window.MecFX || _fxOff()) return;
  const b = _fxBand(), y = _examFxHeaderBottom();
  if (!release) {
    // 噴気（読書中）。⚠️ ここは原則1（周辺視野）・原則2（文字に重ねない）に縛られる＝薄いまま。
    [b.left + 26, b.right - 26].forEach(x => {
      MecFX.steam(x, y, {
        count: 3, alpha: .26, w: 7, rise: 74, min: 14, max: 28,
        grow: 1.8, color: '#E8E2D4', blend: false, stagger: .5
      });
    });
    return;
  }
  // 放出（解答後）。読解はもう終わっているので大きく出してよい。左右が中央で重なるのは意図どおり。
  const w = Math.round(b.width * .10);
  for (let s = 0; s < STEAM_STEPS; s++) {
    const t = s / (STEAM_STEPS - 1);              // 0=弁元 → 1=最も内側
    const dx = b.width * STEAM_SPAN * t;
    const o = {
      // 弁元が濃く、内へ行くほど薄い（14+12+10+8＝片弁44粒・両弁で88粒）
      count: Math.round(14 - 2 * s), alpha: .82 - .07 * s, w: w,
      // ⚠️ rise を上げすぎないこと。発生源はレール（試験ヘッダの下端＝実測 y≒209）で画面上端
      //    までの余地がそれしかなく、初速を上げると寿命1.0〜1.9秒の半分以上を画面外で使い
      //    「速く抜ける細い噴射」になる。大きさは速度ではなく滞留時間と粒径(grow)で出す。
      // ⚠️ 粒径は描画面積に「2乗で」効く。steam の1粒は最大 max*(1+grow) 角のスプライトを
      //    毎フレーム drawImage するので、130×4.2＝546px 角×88粒が上限になる。濃さを上げたい
      //    ときは粒数と粒径ではなく **alpha と色**で稼ぐこと（こちらは実質タダ）。
      rise: 170, min: 26, max: 130, grow: 3.2, color: STEAM_TONES[s] || STEAM_TONES[0],
      blend: false, stagger: .3, delay: s * .05    // 内側ほど遅らせて「伸びていく」ように見せる
    };
    MecFX.steam(b.left  + 34 + dx, y, Object.assign({ vx:  240 }, o));
    MecFX.steam(b.right - 34 - dx, y, Object.assign({ vx: -240 }, o));
  }
  _examGearBlow();
}

/* S1 / S1'(2026-08-21): 排圧計の針。⚠️ 読書中は一度も動かさない＝原則5（急かさない）。
   ⚠️ 振れ幅の元は _examCardSeenAt（速答判定の起点）＝R1 と同じ帳簿。**新設しないこと**。
   ⚠️ 正誤を受け取らない。量っているのは正誤ではなく費やした思考で、これは R1 の放出を
      正誤で変えないのと同じ理由（誤答を罰しない）。
   ⚠️ rotate プロパティで書くこと（transform は走行中のアニメに殺される・§11-5-4'）。
   ⚠️ 520ms は蒸気放出・歯車膨張と同じ1つの出来事の尺。伸ばすと計器だけが遅れて見える。 */
const RELIEF_FULL_MS = 45000;   // ⚠️ 満針＝45秒。国試の配分（1問1分）より短く取り、長考が振り切れるようにしてある
const RELIEF_ZERO_DEG = -72, RELIEF_SPAN_DEG = 144;
function _reliefKick(card) {
  const n = document.getElementById('epNeedle');
  if (!n || _fxOff()) return;
  const uid = card && card.dataset && card.dataset.uid;
  const t0 = uid ? _examCardSeenAt.get(uid) : 0;
  const k = t0 ? Math.max(0, Math.min(1, (Date.now() - t0) / RELIEF_FULL_MS)) : 0;
  const peak = RELIEF_ZERO_DEG + RELIEF_SPAN_DEG * k;
  const over = peak + 8 * k;      // S1': オーバーシュートは1回だけ
  n.getAnimations?.().forEach(a => a.cancel());
  n.animate([
    { rotate: RELIEF_ZERO_DEG + 'deg' },
    { rotate: over + 'deg', offset: .32 },
    { rotate: (peak - 3 * k) + 'deg', offset: .46 },
    { rotate: peak + 'deg', offset: .58 },
    { rotate: RELIEF_ZERO_DEG + 'deg' }
  ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
}
/* 放出に合わせて歯車が大きくなり、噛み合いから火花が飛ぶ。
   ⚠️⚠️ 拡大は `scale` プロパティで行うこと。`transform:scale()` は使えない——歯車は
      `animation:epGearSpin` が transform を占有しており、transform を別途宣言しても
      走行中のアニメーションに上書きされて**何も起きない**（黙って死ぬ型の失敗）。
      `scale` は独立プロパティなので回転と合成される。
   ⚠️ `scale` はレイアウトに影響しないので、拡大してもヘッダの高さは1pxも変わらない
      （_fxBand() の焦点は動かない）。フィードからはみ出すのは意図どおりで、.st-hdr /
      .exam-prog / body / html はいずれも overflow:visible（実測）なので切られない。
   ⚠️ 右の歯車は画面右端から約110px 内側にある（タイマーと終了ボタンのぶんで、画面幅に依らない）。
      GEAR_BLOW_SCALE を上げるときはこの余白を超えないこと——超えると iOS Safari が
      レイアウトビューポートを広げ、2026-08-19 のページ縮尺の振動が再発する。
   ⚠️ タイマーは1本。張り直す前に必ず clearTimeout する。 */
const GEAR_BLOW_MS = 680;   // ⚠️ 回転(約0.4秒/回転)が1回転半ぶん読める長さ。短くすると速さが伝わらない
let _gearBlowTimer = null;
function _examGearBlow() {
  const gears = [...document.querySelectorAll('.ep-gear')];
  if (!gears.length) return;
  gears.forEach(g => {
    g.classList.add('ep-gear-blow');
    const r = g.getBoundingClientRect();
    if (!r.width) return;
    /* 火花。⚠️ additive:false を必ず渡すこと（既定は加算合成＝光の玉になって金属片に見えない）。
       ⚠️ 大きさは tier ではなく scale で上げること——tier は maxSz だけでなく speed の既定と
          ttl も動かすので、tier を上げると「大きく」ではなく「遠くまで長く飛ぶ」になる。
          ここでは speed を明示しているぶん tier の影響は maxSz と ttl に限られる。 */
    MecFX.burst(r.left + r.width / 2, r.top + r.height / 2, {
      count: 26, tier: 5, scale: 2.2, speed: 900,
      colors: ['#E0C25E', '#C9A227', '#B87333', '#FFD9A0'],
      shapes: ['shard', 'square'],
      gravity: 1500, upBias: 40, additive: false, glow: false
    });
  });
  // 圧を抜いた瞬間に弾み車が回り上がる。⚠️ CSS 側で animation-play-state:running を強制して
  // いないと、この時点で D9 が歯車を止めている（1拍止まる）ので1frameも回らない。
  _machSurge(GEAR_BLOW_RATE, GEAR_BLOW_DECAY);
  clearTimeout(_gearBlowTimer);
  _gearBlowTimer = setTimeout(() => {
    _gearBlowTimer = null;
    document.querySelectorAll('.ep-gear-blow').forEach(g => g.classList.remove('ep-gear-blow'));
  }, GEAR_BLOW_MS);
}
function _examSteamTick() {
  if (!examMode || _fxOff() || document.hidden) return;
  if (document.body.classList.contains('exam-asleep')) return;
  const card = _getExamTargetCard();
  if (card && _examPressureBuilt(card)) _examPuffSteam(false);
}

/* R8: スクロール中だけ機械が速く回る＝「待っている機械」から「読みに追従する機械」へ。
   ⚠️⚠️ animation-duration を書き換えてはいけない。走行中に duration を変えると進捗率が
      不連続に飛び、光がワープする。playbackRate は位相を保つので飛ばない。
   ⚠️ 疑似要素(.st-hdr::after)のアニメは element.animate() では作れないので
      getAnimations({subtree:true}) で掴む。掴めなければ何もしない（機能低下で済ませる）。 */
const MACH_SCROLL_RATE = 2.4;
const MACH_DECAY_STEPS = [[1.7, 220], [1.25, 420], [1, 620]];
// 圧を抜いた瞬間に弾み車が回り上がる（R2）。基本周期 5.6s なので 14倍＝約0.4秒/回転。
const GEAR_BLOW_RATE = 14;
const GEAR_BLOW_DECAY = [[6, 380], [2.5, 560], [1, 700]];
let _machDecayTimers = [];
/* ⚠️⚠️ getAnimations() は **CSS transition も返す**。名前で絞らずに playbackRate を書き換えると、
   歯車の scale/opacity の transition まで一緒に加速され、**膨らみのバネ(.16s)が14倍速で潰れて
   瞬間移動に見える**（2026-08-19 に実機で確認）。速さを変えてよいのは「回り続けているもの」
   ＝名前を持つ CSSAnimation だけ。animationName の有無で判別する。 */
function _isNamedAnim(a) { return !!(a && a.animationName); }
function _machineAnims() {
  const out = [];
  const hdr = document.querySelector('.st-hdr');
  if (hdr && hdr.getAnimations) {
    try {
      hdr.getAnimations({ subtree: true }).forEach(a => {
        const ef = a.effect;
        if (_isNamedAnim(a) && ef && ef.pseudoElement === '::after' && ef.target === hdr) out.push(a);
      });
    } catch (e) { /* 未対応環境では稼働灯の速度だけ据え置き */ }
  }
  document.querySelectorAll('.ep-gear').forEach(el => {
    if (!el.getAnimations) return;
    try { el.getAnimations().forEach(a => { if (_isNamedAnim(a)) out.push(a); }); } catch (e) {}
  });
  return out;
}
function _setMachineRate(r) {
  _machineAnims().forEach(a => { try { a.playbackRate = r; } catch (e) {} });
}
/* 速度を一段上げてから段階的に戻す。スクロール応答(R8)と歯車の吹き上がり(R2)の共通の口。
   ⚠️ playbackRate の持ち主を1つにしておくこと。2つの経路が別々のタイマー列を持つと、
      片方の減速がもう片方の加速を打ち消して「たまに速くならない」という追えない挙動になる。
      ここでは必ず既存のタイマーを全部落としてから張り直す＝最後に呼んだ方が勝つ。
   ⚠️ 一気に 1 へ戻すと velocity が跳ねるので段で落とす（位相は playbackRate では飛ばない）。 */
function _machSurge(rate, steps) {
  if (!examMode || _fxOff()) return;
  _machDecayTimers.forEach(clearTimeout); _machDecayTimers = [];
  _setMachineRate(rate);
  steps.forEach(([r, ms]) => _machDecayTimers.push(setTimeout(() => _setMachineRate(r), ms)));
}
function _examScrollPulse() {
  _machSurge(MACH_SCROLL_RATE, MACH_DECAY_STEPS);
}

/* R10: 60秒動きが無ければ機械が休み、動いたら起動シーケンスを見せる。
   ⚠️ 「放置＝叱られている」に見せないこと。暗くするだけで印（レール・溝・リベット）は残す。
   ⚠️ タイマーは D9 の _examIdleTimer とは別に1本持ち、張り直す前に必ず clearTimeout する
      （_armHold・_startGaugeAmbient・D9 で同じ型の前科が3件ある）。 */
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
   ⚠️ 焦点カードについてのみ判定する（下のカードの選択肢が見えても発火させない）。
   ⚠️ 稼働灯の停止は R10（スリープ）と経路を分ける＝専用クラスで表し、どちらが消したのか
      追えるようにしておく（同じ exam-idle-lit を2箇所から落とさない）。 */
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
  _examScrollPulse();   // R8。⚠️ 代入1回だけに留めること（この関数は最も呼ばれる）
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
    if (choices[n]) {
      _playSelectSound();
      const req = _getRequiredCount(card);
      if (req > 1) {
        choices[n].classList.toggle('exam-selected');
        if (choices[n].classList.contains('exam-selected') && !choices[n].classList.contains('ok')) {
          choices[n].classList.add('exam-instant-wrong');
          setTimeout(() => revealAnswer(card), 400);
        } else {
          _updateMultiInfo(card);
          const sel = [...card.querySelectorAll('.ch2.exam-selected')];
          if (sel.length === req && sel.every(ch => ch.classList.contains('ok'))) {
            sel.forEach(ch => ch.classList.add('exam-instant-correct'));
            setTimeout(() => revealAnswer(card), 10);
          }
        }
      } else {
        choices.forEach(c => c.classList.remove('exam-selected'));
        choices[n].classList.add('exam-selected');
        if (choices[n].classList.contains('ok')) {
          choices[n].classList.add('exam-instant-correct');
          setTimeout(() => revealAnswer(card), 10);
        } else {
          choices[n].classList.add('exam-instant-wrong');
          setTimeout(() => revealAnswer(card), 400);
        }
      }
    }
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

  examMode = true;
  examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  // 再開は別セッション扱い（n は examAnswered の続きなので中断前後で連番が繋がる）
  _attemptSessionId = window.MecAttempts ? MecAttempts.newSession() : '';
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  localStorage.setItem('mec_exam_active_key', saved.key || '');
  _examChoiceBackup.clear();
  document.body.classList.add('exam-mode');
  const _eqSet = new Set(examQueue);
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_eqSet.has(c)) c.style.display = 'none'; });

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
      card.querySelectorAll('.ch2').forEach(ch => {
        if (!ch.dataset.examInit) {
          ch.dataset.examInit = '1';
          ch.addEventListener('click', function() {
            if (!examMode || this.closest('.qc').classList.contains('exam-revealed')) return;
            const c = this.closest('.qc');
            const r = _getRequiredCount(c);
            if (r > 1) {
              this.classList.toggle('exam-selected');
              if (this.classList.contains('exam-selected') && !this.classList.contains('ok')) {
                this.classList.add('exam-instant-wrong');
                setTimeout(() => revealAnswer(c), 400);
              } else {
                _updateMultiInfo(c);
                const sel = [...c.querySelectorAll('.ch2.exam-selected')];
                if (sel.length === r && sel.every(ch => ch.classList.contains('ok'))) {
                  sel.forEach(ch => ch.classList.add('exam-instant-correct'));
                  setTimeout(() => revealAnswer(c), 10);
                }
              }
            } else {
              this.closest('.cs').querySelectorAll('.ch2').forEach(x => x.classList.remove('exam-selected'));
              this.classList.add('exam-selected');
              if (this.classList.contains('ok')) {
                this.classList.add('exam-instant-correct');
                setTimeout(() => revealAnswer(c), 10);
              } else {
                this.classList.add('exam-instant-wrong');
                setTimeout(() => revealAnswer(c), 400);
              }
            }
          });
        }
      });
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
  _zoneStop(false); _setAwaken(false);
  // srs-review クラスはここでは外さない。結果画面〜誤答再試験の間も復習の最小表示を保つため、
  // 解除は通常閲覧へ戻る _srsRestoreAfterReview() に集約している。
  _lastSessionWasSrs = _srsReviewMode;
  _lastSessionWasTodayWrong = _todayWrongMode;
  // ⚠️ 稼働灯(D9)は点灯クラスとタイマーの両方を落とすこと。残ると通常閲覧のヘッダで光が走り続ける。
  document.body.classList.remove('exam-mode', 'exam-effect-neon', 'exam-effect-ink', 'exam-sprint', 'exam-idle-lit', 'exam-overdrive', 'exam-screen-shake', 'exam-red-flash', 'exam-slash-freeze');
  document.querySelector('.exam-prog-track')?.classList.remove('exam-prog-complete');
  clearTimeout(_examIdleTimer); _examIdleTimer = null;
  _examIdleHoldUntil = 0; _examIdleFocusUid = null; _examIdleFocusAt = 0;
  // Phase 5 段1: R3 の焦点色は body のインラインスタイルなので通常閲覧へ持ち越さない。
  document.body.style.removeProperty('--exam-focus-c');
  document.body.style.removeProperty('--exam-focus-glow');
  // Phase 5 段2: R1 の圧・R8 の減速・R10 のスリープを全部落とす。
  // ⚠️ 1つでも残すと通常閲覧のヘッダで機械が動き続ける（D9 で同じ失敗を踏んでいる）。
  clearInterval(_examSteamInt); _examSteamInt = null;
  clearTimeout(_gearBlowTimer); _gearBlowTimer = null;
  document.querySelectorAll('.ep-gear-blow').forEach(g => g.classList.remove('ep-gear-blow'));
  _machDecayTimers.forEach(clearTimeout); _machDecayTimers = [];
  _setMachineRate(1);
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
  document.querySelectorAll('.qc.exam-revealed').forEach(c => c.classList.remove('exam-revealed', 'exam-multi-correct', 'exam-answer-opened'));
  document.querySelectorAll('.ch2.exam-selected').forEach(c => c.classList.remove('exam-selected'));
  document.querySelectorAll('.ch2.exam-instant-correct').forEach(c => c.classList.remove('exam-instant-correct'));
  document.querySelectorAll('.ch2.exam-instant-wrong').forEach(c => c.classList.remove('exam-instant-wrong'));
  document.querySelectorAll('.ch2[data-exam-init]').forEach(c => delete c.dataset.examInit);
  document.querySelectorAll('.exam-multi-info').forEach(el => el.remove());
  // 計算問題の桁入力UIを畳む（通常モードでは .cs は空のまま＝×△○の自己採点に戻る）
  if (window.MecCalc) document.querySelectorAll('.qc .calc-input')
    .forEach(el => MecCalc.destroy(el.closest('.qc')));
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '🎓 試験モード'; modeBtn.classList.remove('exam-on'); modeBtn.onclick = openExamStart; }
  // ストリーク演出を即座にリセット（サマリーモーダルを隠さないよう）
  ['examTimestopOv','examStreakToast','examStreakFlash','examStreakBorder','streakFullscreen'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.getAnimations?.().forEach(a => a.cancel());
    el.style.setProperty('opacity', '0', 'important');
    if (id === 'examTimestopOv') {
      el.style.display = 'none';
      el.style.backdropFilter = 'none';
      el.style['-webkit-backdrop-filter'] = 'none';
    }
  });
  document.body.getAnimations?.().forEach(a => a.cancel());
  document.querySelectorAll('.streak-particle,.streak-ring,.exam-bg-breath,.exam-fx-temp,.mec-cfx,.exam-tierup,.exam-fast-pop,.exam-trace-svg,.exam-zone-collapse,.exam-hard-pop,.exam-recover-pop,.exam-mark-pop').forEach(el => el.remove());
  // C5: 誤答の傷はセッション中だけの印。通常閲覧に持ち越さない
  document.querySelectorAll('.qc.exam-scar').forEach(el => el.classList.remove('exam-scar'));
  // S5(2026-08-21): 克服光の当て板も同じく持ち越さない（1.15秒で自分で消えるが、
  //   その途中で終了した場合に残るので必ず落とす）。
  document.querySelectorAll('.qc.exam-plate-fix').forEach(el => el.classList.remove('exam-plate-fix'));
  // S4: 軸光の段も持ち越さない（通常閲覧の計器ベイは消えているが、値が残ると次の試験の
  //     1問目だけ前回の tier の明るさで点く）。
  document.body.style.removeProperty('--exam-axle');
  // S1: 針は 0 に戻して止める（アニメの途中で終了すると中途半端な角度で固まる）。
  { const _n = document.getElementById('epNeedle');
    if (_n) { _n.getAnimations?.().forEach(a => a.cancel()); } }
  { const _cd = document.getElementById('examCountdown'); if (_cd) { _cd.style.display = 'none'; _cd.innerHTML = ''; } }
  { const _sig = document.getElementById('examStreakSig'); if (_sig) { _sig.getAnimations?.().forEach(a => a.cancel()); _sig.style.opacity = '0'; } }
  { const _lbl = document.getElementById('examComboMeterLbl'); if (_lbl) { _lbl.getAnimations?.().forEach(a => a.cancel()); _lbl.style.opacity = '0'; } }
  if (window.MecFX) window.MecFX.clear();
  const _cmFill = document.getElementById('examComboMeterFill');
  const _cmMeter = document.getElementById('examComboMeter');
  if (_cmFill) { _cmFill.getAnimations?.().forEach(a => a.cancel()); _cmFill.style.width = '0%'; }
  if (_cmMeter) { _cmMeter.getAnimations?.().forEach(a => a.cancel()); _cmMeter.style.opacity = '0'; }
  // SRS復習ホストを隠す（誤答復習/再試験で再表示される。通常閲覧への漏れを防ぐ）
  window._srsHostHide?.();
  // サマリーを先に表示してから後処理（後処理でエラーが出てもモーダルが開く）
  try { showExamSummary(); } catch(e) { console.error('showExamSummary error:', e); document.getElementById('examOverlay')?.classList.add('open'); }
  _srsReviewMode = false;
  _todayWrongMode = false;
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
  document.querySelectorAll('#examOverlay .exam-rank-stamp, #examOverlay .exam-srs-done, #examOverlay .exam-srs-continue').forEach(el => el.remove());
  const titleEl = document.querySelector('#examOverlay h2');
  if (titleEl) titleEl.innerHTML =
    _srsReviewMode  ? '🔔 <span class="grad-txt">復習セッション結果</span>' :
    _todayWrongMode ? '🔁 <span class="grad-txt">' + (window._wrongDayJa?.() || '今日') + 'の誤答 再履修の結果</span>' :
                      '📊 <span class="grad-txt">セッション結果</span>';
  const elapsed = examStartTime ? Math.floor((_examActiveMs()) / 1000) : 0;
  const pct = examAnswered > 0 ? Math.round(examCorrect / examAnswered * 100) : 0;
  // スコアの色は章カードと同じ基準（80↑緑/60-79黄/60未満赤）。数字は0→pctへカウントアップし、
  // 周囲のconic-gradientリングも同時に伸びる（--p/--ringc は study.css の .exam-pct-ring が参照）
  const pctEl = document.getElementById('sumPct');
  const pctRing = document.getElementById('sumPctRing');
  const pctCol = pct >= 80 ? '#3DD68C' : pct >= 60 ? '#FFB830' : '#FF6B6B';
  if (pctEl) pctEl.style.color = pctCol;
  if (pctRing) { pctRing.style.setProperty('--ringc', pctCol); pctRing.style.setProperty('--p', 0); }
  /* S10(2026-08-21): ニキシー管は「数字が止まった瞬間に一度だけ」ともる＝結果が確定した合図。
     ⚠️ 動いている数字は #sumPct だけなので、そのカウントアップの完了を5本まとめての合図に使う。
        点灯の口をここ1つに寄せること（タイル側にも作ると2回に分かれて意味が薄まる）。
     ⚠️ rAF が止まった時の落とし所を必ず置く。非表示タブでは rAF が1フレームも来ないので、
        保険が無いと**裏で終わったセッションの管が永久に点かない**（_tweenNum・countUp と同じ穴）。 */
  const _modal = document.querySelector('#examOverlay .exam-modal');
  if (_modal) _modal.classList.remove('tubes-lit');
  const _litTubes = () => { if (_modal) _modal.classList.add('tubes-lit'); };
  if (pctEl) {
    const t0 = performance.now(), dur = 900;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(pct * (1 - Math.pow(1 - k, 3)));
      pctEl.textContent = v + '%';
      if (pctRing) pctRing.style.setProperty('--p', v);
      if (k < 1) requestAnimationFrame(tick); else _litTubes();
    };
    requestAnimationFrame(tick);
    setTimeout(_litTubes, dur + 400);
  } else {
    _litTubes();
  }
  document.getElementById('sumCorrect').textContent = examCorrect;
  document.getElementById('sumWrong').textContent = examAnswered - examCorrect;
  document.getElementById('sumAnswered').textContent = examAnswered;
  document.getElementById('sumTime').textContent = Math.floor(elapsed/60) + '分' + (elapsed%60) + '秒';
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
    setTimeout(() => _stampRank(pct), 950);
  }
  // スコアに応じた祝賀エフェクト（FXキャンバスはz9070＝モーダルより上に描画される）
  if (examAnswered > 0 && window.MecFX) {
    try {
      if (pct >= 100) {
        // PERFECT: 大規模金花火キャノン＋金銀紙吹雪の大嵐
        setTimeout(() => {
          window.MecFX.fireworks({ count: 16, colors: ['#FFD700', '#FFF3C4', '#F7E7CE', '#FFB830', '#FFFFFF'], tier: 7 });
          window.MecFX.confetti({ count: 240, colors: ['#FFD700', '#FFF3C4', '#F7E7CE', '#FFB830', '#FFFFFF'], big: true });
          window.MecFX.dust({ count: 120, colors: ['#FFD700', '#FFF3C4', '#FFFFFF'] });
        }, 980);
      } else if (pct >= 90) {
        setTimeout(() => {
          window.MecFX.fireworks({ count: 10, colors: ['#3DD68C', '#60A5FA', '#FFD37A', '#FF5E8A', '#FFD700'], tier: 6 });
          window.MecFX.confetti({ count: 180, colors: ['#3DD68C', '#60A5FA', '#FFB830', '#FF5E8A', '#A78BFA'], big: true });
        }, 980);
      } else if (pct >= 80) {
        window.MecFX.fireworks({ count: 6, colors: ['#3DD68C', '#60A5FA', '#FFB830'], tier: 4 });
        window.MecFX.confetti({ count: 140, colors: ['#3DD68C', '#60A5FA', '#FFB830', '#A78BFA'], big: true });
      } else if (pct >= 60) {
        window.MecFX.fireworks({ count: 3, colors: ['#60A5FA', '#FFB830'], tier: 3 });
        window.MecFX.confetti({ count: 90, colors: ['#60A5FA', '#FFB830', '#3DD68C'] });
      } else {
        { const _rb = _fxBand(); window.MecFX.rings(_rb.cx, _rb.cy, { count: 3, color: 'rgba(96,165,250,.85)', thickness: 4, maxR: 160, additive: true }); }
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
        '<div class="exam-srs-done">🔁 ' + (window._wrongDayJa?.() || '今日') + 'の取りこぼし、やり直し完了！' +
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
          count: 32,
          shapes: ['shard', 'gem', 'square'],
          colors: ['#FFD700', '#FFA040', '#FFFFFF', '#C9A227'],
          gravity: 1200,
          speed: 680,
          scale: 1.3
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
  try { window.MecGamify?.onExamFinish?.(examAnswered, examCorrect, { chPrefix: _gmChPrefix }); } catch {}
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
/* 【案4】10問ごとのチェックポイント・光のワープゲート突破 */
function _triggerWarpGate(n) {
  if (_fxOff()) return;
  const ov = document.createElement('div');
  ov.className = 'warp-gate-overlay';
  ov.innerHTML = '<div class="warp-ring" style="animation-delay:0s"></div>' +
                 '<div class="warp-ring" style="animation-delay:.15s"></div>' +
                 '<div class="warp-ring" style="animation-delay:.3s"></div>' +
                 '<div class="warp-gate-title">🚀 CHECKPOINT ' + n + ' CLEARED!</div>';
  document.body.appendChild(ov);
  if (window.MecFX) {
    const b = _fxBand();
    window.MecFX.warp({ count: 18, color: '#FFD700' });
    window.MecFX.burst(b.cx, b.cy, { count: 36, colors: ['#FFD700', '#00E5FF', '#FFFFFF'], shapes: ['star', 'gem'], tier: 5, scale: 1.5 });
  }
  setTimeout(() => ov.remove(), 1100);
}

/* 【案7】ダイナミック環境ライティング（朝・夕・深夜宿直室） */
function _applyEnvLighting() {
  const h = new Date().getHours();
  document.body.classList.remove('env-morning', 'env-sunset', 'env-nightshift');
  if (h >= 6 && h < 11) document.body.classList.add('env-morning');
  else if (h >= 17 && h < 20) document.body.classList.add('env-sunset');
  else if (h >= 23 || h < 5) document.body.classList.add('env-nightshift');
}
try { _applyEnvLighting(); } catch (e) {}
