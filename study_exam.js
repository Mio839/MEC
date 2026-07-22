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
let _examChPrefix = null;   // selected chapter prefix for exam (e.g. "neur_ch01")
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
let _examFilterLabel = '';
let _srsReviewMode = false;
// 直前に終えたセッションが復習だったか。誤答再試験で復習モードへ戻すために使う
// （exitExam が _srsReviewMode を false に戻すので、その前に控えておく必要がある）。
let _lastSessionWasSrs = false;
const _examChoiceBackup = new Map();
let _examAudioCtx = null;
let _correctSound = localStorage.getItem('mec_correct_sound_v1') || 'ping';
const _customCorrectAudio = new Audio('sounds/correct.wav');
_customCorrectAudio.preload = 'auto';
let _customCorrectBuffer = null;
let _customCorrectBufferPromise = null;

let _selectSound = localStorage.getItem('mec_select_sound_v1') || 'mp3';
const _selectAudio = new Audio('sounds/選択.mp3');
_selectAudio.preload = 'auto';
let _selectBuffer = null;
let _selectBufferPromise = null;

let _comboSound = localStorage.getItem('mec_combo_sound_v1') || 'rise';

function _prepareSelectSound() {
  const ctx = _getExamAudioCtx();
  if (!ctx || _selectBuffer) return;
  if (!_selectBufferPromise) {
    _selectBufferPromise = fetch('sounds/選択.mp3')
      .then(res => res.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { _selectBuffer = decoded; })
      .catch(() => { _selectBufferPromise = null; });
  }
}

function _playSelectSynthFallback() {
  try {
    const ctx = _getExamAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {}
}

function _playSelectSound() {
  if (_selectSound === 'off') return;
  if (_selectSound === 'mp3') {
    try {
      const ctx = _getExamAudioCtx();
      if (ctx && _selectBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = _selectBuffer;
        src.connect(ctx.destination);
        src.start(ctx.currentTime);
        return;
      }
      _prepareSelectSound();
      const clone = _selectAudio.cloneNode();
      clone.volume = 0.6;
      clone.play().catch(() => { _playSelectSynthFallback(); });
    } catch (e) { _playSelectSynthFallback(); }
    return;
  }
  try {
    const ctx = _getExamAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sounds = {
      click: { type: 'square',    freq: 1400, dur: 0.04, vol: 0.030 },
      tick:  { type: 'triangle',  freq: 900,  dur: 0.05, vol: 0.040 },
      blip:  { type: 'sine',      freq: 660,  dur: 0.07, vol: 0.055 },
      soft:  { type: 'sine',      freq: 400,  dur: 0.09, vol: 0.065 }
    };
    const s = sounds[_selectSound] || sounds.click;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.freq, now);
    gain.gain.setValueAtTime(s.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + s.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + s.dur);
  } catch (e) {}
}


function _getExamAudioCtx() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!_examAudioCtx) _examAudioCtx = new AudioContext();
  if (_examAudioCtx.state === 'suspended') _examAudioCtx.resume().catch(() => {});
  return _examAudioCtx;
}

function _prepareCustomCorrectSound() {
  const ctx = _getExamAudioCtx();
  if (!ctx || _customCorrectBuffer) return;
  if (!_customCorrectBufferPromise) {
    _customCorrectBufferPromise = fetch('sounds/correct.wav')
      .then(res => res.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { _customCorrectBuffer = decoded; })
      .catch(() => { _customCorrectBufferPromise = null; });
  }
}

function _playCustomCorrectSound() {
  try {
    const ctx = _getExamAudioCtx();
    if (ctx && _customCorrectBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = _customCorrectBuffer;
      src.connect(ctx.destination);
      src.start(ctx.currentTime);
      return;
    }
    _prepareCustomCorrectSound();
    _customCorrectAudio.pause();
    _customCorrectAudio.currentTime = 0;
    _customCorrectAudio.play().catch(() => {});
  } catch (e) {}
}

function _playCorrectSound() {
  if (_correctSound === 'off') return;
  if (_correctSound === 'custom') {
    _playCustomCorrectSound();
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    if (!_examAudioCtx) _examAudioCtx = new AudioContext();
    if (_examAudioCtx.state === 'suspended') _examAudioCtx.resume();

    const now = _examAudioCtx.currentTime;
    const master = _examAudioCtx.createGain();
    const sounds = {
      ping: { type: 'sine', notes: [659.25, 987.77], gap: 0.045, duration: 0.34, volume: 0.12 },
      chime: { type: 'triangle', notes: [523.25, 659.25, 1046.5], gap: 0.06, duration: 0.56, volume: 0.10 },
      pop: { type: 'square', notes: [392, 523.25], gap: 0.035, duration: 0.22, volume: 0.065 },
      bell: { type: 'sine', notes: [880, 1320], gap: 0.025, duration: 0.5, volume: 0.09 },
      coin: { type: 'triangle', notes: [1318.51, 1760], gap: 0.055, duration: 0.28, volume: 0.095 },
      sparkle: { type: 'sine', notes: [1046.5, 1318.51, 1567.98, 2093], gap: 0.04, duration: 0.42, volume: 0.085 },
      fanfare: { type: 'triangle', notes: [523.25, 659.25, 783.99, 1046.5], gap: 0.075, duration: 0.62, volume: 0.1 },
      level: { type: 'sine', notes: [392, 493.88, 587.33, 783.99], gap: 0.07, duration: 0.5, volume: 0.095 },
      notice: { type: 'triangle', notes: [587.33, 783.99], gap: 0.055, duration: 0.24, volume: 0.075 },
      click: { type: 'square', notes: [1200], gap: 0, duration: 0.06, volume: 0.035 },
      soft: { type: 'sine', notes: [261.63, 392], gap: 0.045, duration: 0.28, volume: 0.09 }
    };
    const sound = sounds[_correctSound] || sounds.ping;
    const totalDuration = sound.duration + sound.gap * Math.max(0, sound.notes.length - 1);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(sound.volume, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);
    master.connect(_examAudioCtx.destination);

    sound.notes.forEach((freq, i) => {
      const osc = _examAudioCtx.createOscillator();
      const gain = _examAudioCtx.createGain();
      const start = now + i * sound.gap;
      osc.type = sound.type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(1 / Math.max(1, sound.notes.length), start);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + sound.duration);
    });
  } catch (e) {}
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
  const subjNameMap = { endo:'内分泌', resp:'呼吸器', circ:'循環器', dige:'消化器', neur:'神経', hbp:'肝胆膵', jinzo_d:'腎臓', hema:'血液', imma:'免アレ膠', kansen:'感染症', peds:'小児科', obg:'産婦人科' };
  const resumes = _loadResumes().filter(r => r.total > r.answeredCount);
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
      const prog = r.answeredCount > 0
        ? '<span class="er-prog">' + r.answeredCount + '/' + r.total + '問</span> 回答済み'
        : '全' + r.total + '問・未回答';
      const pctDone = r.total > 0 ? Math.round(r.answeredCount / r.total * 100) : 0;
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

  const prefixMap = new Map();
  visibleCards.forEach(c => {
    const m = c.dataset.uid.match(/^(.+_ch\d+)_q/);
    if (!m) return;
    const prefix = m[1];
    if (!prefixMap.has(prefix)) {
      const subjId = prefix.replace(/_ch\d+$/, '');
      const chNum = parseInt(prefix.match(/_ch(\d+)$/)[1], 10);
      const subj = STUDY_SUBJECTS.find(s => s.id === subjId);
      prefixMap.set(prefix, { subjId, chNum, subj, count: 0 });
    }
    prefixMap.get(prefix).count++;
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
    btn.innerHTML = '<span class="cc-num">' + info.chNum + '章</span>'
      + '<span class="cc-cnt">' + info.count + '問</span>'
      + '<span class="cc-score' + scoreCls + '">' + (h ? h.bestScore + '%' : '—') + '</span>';
    btn.title = (info.subj ? info.subj.name : info.subjId) + ' 第' + info.chNum + '章（' + info.count + '問）' + (h ? ' | 最高' + h.bestScore + '% · ' + h.sessions + '回' : '');
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
  if (_srsReviewMode) return;
  if (!examQueue.length) return;
  // 全問回答済みなら中断データは不要。終了ボタンを押さずに閉じても残らないよう、ここで自動削除する
  if (examAnswered >= examQueue.length) { _clearExamResume(); return; }
  const revealedUids = {};
  const pendingWrong = [];
  let pendingCorrect = 0;
  examQueue.forEach(card => {
    const uid = card.dataset.uid;
    if (card.classList.contains('exam-revealed')) {
      revealedUids[uid] = { correct: !examWrong.includes(uid) };
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
    answeredCount: examAnswered + pendingWrong.length + pendingCorrect,
    correctCount: examCorrect + pendingCorrect,
    wrongUids: [...examWrong, ...pendingWrong],
    bySubj: examBySubj,
    total: examQueue.length,
    count: _examCount,
    filterLabel: _examFilterLabel,
    chPrefix: _examActiveChPrefix
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

function retryWrongExam() {
  const uids = [...examWrong];
  if (!uids.length) return;
  _closeSummaryOverlayOnly();
  // 復習セッションの誤答再試験は復習モードのまま続ける。
  // ここで戻さないと通常試験として開始され、科目フィルターと科目セクションが復活する。
  if (_lastSessionWasSrs) {
    _srsReviewMode = true;
    document.body.classList.add('srs-review');
    window._srsHostShow?.();
  }
  startExam(uids);
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
  if (_correctSound === 'custom') _prepareCustomCorrectSound();
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
    : [...document.querySelectorAll('.qc[data-uid]')].filter(c => {
        if (c.style.display === 'none') return false;
        const sec = c.closest('.subj-section');
        if (sec && sec.dataset.visible !== 'true') return false;
        if (chFilter && !c.dataset.uid.startsWith(chFilter + '_q')) return false;
        return true;
      });
  const shuffled = _buildExamQueue(allVisible);
  examQueue = shuffled;
  _recountExcluded();
  // alert() は iOS PWA で表示されないことがあるためトーストで通知する
  if (!examQueue.length) { (window._mecNotify || function(m){})('表示中の問題がありません。科目・フィルターを確認してください。'); return; }
  const _subj = [...new Set(examQueue.map(c => c.dataset.uid.split('_ch')[0]))].sort().join(',');
  _examSessionKey = _subj + ':' + examQueue.length;
  // SRS復習は中断データを持たないので消さない（同じキーの通常試験の中断データを巻き込まないため）
  if (!_srsReviewMode) _clearExamResume();
  examMode = true; examAnswered = 0; examCorrect = 0; examStreak = 0; examBySubj = {}; examWrong = []; _examSessionWrongChoices.clear(); examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  _examCardSeenAt.clear(); _zoneStop(false); _setAwaken(false);
  examEffectSet = EXAM_EFFECT_POOL[Math.floor(Math.random() * EXAM_EFFECT_POOL.length)];
  document.body.classList.remove('exam-effect-neon', 'exam-effect-ink');
  if (examEffectSet !== 'classic') document.body.classList.add('exam-effect-' + examEffectSet);
  if (location.search.indexOf('debug=1') !== -1) alert('[study.html] effectSet: ' + examEffectSet);
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  if (!_srsReviewMode) localStorage.setItem('mec_exam_active_key', _examSessionKey);
  _examChoiceBackup.clear();
  document.body.classList.add('exam-mode');
  const _eqSet = new Set(examQueue);
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_eqSet.has(c)) c.style.display = 'none'; });
  examQueue.forEach(card => {
    card.style.display = '';
    _shuffleChoices(card);
    const req = _getRequiredCount(card);
    if (req > 1 && !card.querySelector('.exam-multi-info')) {
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
      btn.textContent = req > 1 ? '▶ 回答を確定する' : '▶ 解答を見る';
      btn.onclick = () => revealAnswer(card);
      const ab = qb.querySelector('.ab');
      if (ab) ab.parentNode.insertBefore(btn, ab); else qb.appendChild(btn);
    }
    card.querySelectorAll('.ch2').forEach(ch => {
      if (!ch.dataset.examInit) {
        ch.dataset.examInit = '1';
        ch.addEventListener('click', function() {
          if (!examMode || this.closest('.qc').classList.contains('exam-revealed')) return;
          _playSelectSound();
          const c = this.closest('.qc');
          const r = _getRequiredCount(c);
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
  requestAnimationFrame(_updateExamFocus);
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '📖 終了'; modeBtn.classList.add('exam-on'); modeBtn.onclick = exitExam; }
  window.scrollTo({ top: 0 });
  _saveExamResume();
  _examCountdown();   // C9: 3・2・1・START（非ブロッキング＝裏で試験は既に開始済み）
}

function revealAnswer(card) {
  if (card.classList.contains('exam-revealed')) return;
  // 採点除外（正解肢なし）は採点対象外。分母・正誤・myrate・赤旗・再試験のどれにも入れない。
  if (_isExamUngraded(card)) { _revealExcludedNeutral(card); return; }
  const req = _getRequiredCount(card);
  const sid = card.dataset.uid.split('_ch')[0];
  if (!examBySubj[sid]) examBySubj[sid] = { correct: 0, total: 0 };

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
    _markExamDone(card.dataset.uid);
    _recordMyRate(card.dataset.uid, isCorrect);
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
      card.classList.add('exam-revealed', 'exam-multi-correct');
      if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
    } else {
      examStreak = 0;
      _resetComboMeter();
      _clearDarkFx();
      _zoneStop(true);   // B5: ゾーン崩壊（漂う粒子が一点に吸い込まれて消える）
      examWrong.push(card.dataset.uid);
      card.classList.add('exam-revealed');
      if (revBtn) { revBtn.textContent = '▼ 解答を隠す'; revBtn.onclick = () => _toggleWrongAnswer(card, revBtn); }
    }
    _updateExamProg(isCorrect);
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    if (isCorrect) setTimeout(() => _scrollToNextCard(card), 500);
    else _maybeShowFinishBtn();
    return;
  }

  const revBtn = card.querySelector('.exam-reveal-btn');
  const sel = card.querySelector('.ch2.exam-selected');
  if (!sel) return;
  const isCorrect = sel.classList.contains('ok');
  examAnswered++;
  examBySubj[sid].total++;
  _markExamDone(card.dataset.uid);
  _recordMyRate(card.dataset.uid, isCorrect);
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
    if (_isFastAnswer(card)) setTimeout(() => _triggerFastBonus(sel), 90);
    card.classList.add('exam-revealed', 'exam-multi-correct');
    if (revBtn) { revBtn.textContent = '▶ 解説を見る'; revBtn.onclick = () => _toggleCorrectAnswer(card, revBtn); }
    _updateExamProg(true);
    _saveExamResume();
    requestAnimationFrame(_updateExamFocus);
    setTimeout(() => _scrollToNextCard(card), 300);
  } else {
    examStreak = 0;
    _resetComboMeter();
    _clearDarkFx();
    _zoneStop(true);   // B5: ゾーン崩壊
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
  const holdMs = tier >= 6 ? 400 : tier >= 5 ? 300 : 220;
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
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const cols = theme.fullscreenCols;
  const glowR = theme.fullscreenGlow;
  const col = cols[Math.min(tier,6)];
  const g = glowR[Math.min(tier,6)];
  const spread = 60 + tier * 35;
  el.textContent = '×' + n;
  el.style.color = col;
  el.style.textShadow = `0 0 ${spread}px rgba(${g},.65), 0 0 ${spread*2}px rgba(${g},.35), 0 0 ${spread*3}px rgba(${g},.15)`;
  const dur = tier >= 6 ? 980 : tier >= 5 ? 820 : tier >= 4 ? 680 : 560;
  el.animate([
    {opacity:0,  transform:'scale(.28) rotate(-10deg)'},
    {opacity:.9, transform:'scale(1.14) rotate(1.8deg)',  offset:.17},
    {opacity:.82,transform:'scale(.93) rotate(-.6deg)',   offset:.33},
    {opacity:.78,transform:'scale(1.02) rotate(.3deg)',   offset:.48},
    {opacity:.75,transform:'scale(1) rotate(0deg)',       offset:.58},
    {opacity:0,  transform:'scale(1.06) rotate(.5deg)'}
  ], {duration: dur, easing:'cubic-bezier(.22,.68,0,1.25)'});
}

function _examTier(n) {
  return n >= 20 ? 6 : n >= 15 ? 5 : n >= 10 ? 4 : n >= 7 ? 3 : n >= 4 ? 2 : 1;
}

// 試験モード演出テーマ。examEffectSet で選ばれ、正解／連続正解エフェクトの見た目を丸ごと切り替える。
const EXAM_EFFECT_THEMES = {
  classic: {
    burstPalettes: {
      2: ['#FFA040','#FFD700','#FFFFFF','#FFB830'],
      3: ['#FF5820','#FF9800','#FFFFFF','#FFD700','#FF6030'],
      4: ['#FFD700','#FFA040','#FFFFFF','#FFB830','#FFF176','#FF9800'],
      5: ['#FFE040','#FFD700','#FF9800','#FFFFFF','#FFF176','#FFB300','#FF5722','#4FC3F7'],
      6: ['#EE88FF','#CC44FF','#FFD700','#FF5722','#4FC3F7','#FFFFFF','#FFE040','#81C784','#F06292']
    },
    shapes: (tier) => tier >= 3 ? ['circle','square','star','star','square','circle'] : ['circle','square'],
    ringColor: (tier) => tier >= 6 ? 'rgba(210,80,255,.85)' : tier >= 4 ? 'rgba(255,210,0,.85)' : tier >= 3 ? 'rgba(255,88,32,.85)' : 'rgba(255,160,64,.75)',
    fullscreenCols:  ['','','#FFA040','#FF5820','#FFD700','#FFE840','#CC44FF'],
    fullscreenGlow:  ['','','255,160,64','255,88,32','255,200,0','255,220,0','200,60,255'],
    flashColors: ['','','rgba(255,160,64,.30)','rgba(255,80,40,.42)','rgba(255,200,0,.62)','rgba(255,220,0,.78)','rgba(160,0,255,.68)'],
    borderColors: {4:'#FF9800',5:'#FFD700',6:'#CC44FF'},
    bgRgbs: ['','61,214,140','255,160,64','255,88,32','255,210,0','255,232,0','210,80,255'],
    meterGrads: ['','linear-gradient(90deg,#3DD68C,#5EF0A8)','linear-gradient(90deg,#FFA040,#FFD060)','linear-gradient(90deg,#FF5820,#FF9040)','linear-gradient(90deg,#FFD700,#FFF060)','linear-gradient(90deg,#FFE040,#FFD700,#FF9800)','linear-gradient(90deg,#CC44FF,#EE88FF,#FF5722,#FFD700)'],
    labels: (n) => ['','🎯 '+n+'連続！','🔥 '+n+'連続！！','⚡️ '+n+'連続！！！','💥 '+n+'連続！！！！','🏆 '+n+'連続！！！！！','👑 '+n+'連続！！！！！！'],
    popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.22),rgba(61,214,140,.10))',
    comboLabel: (n) => n >= 2 ? '×'+n+' COMBO!' : '+1',
    comboColors: ['','#3DD68C','#FFA040','#FF5820','#FFD700','#FFE840','#EE88FF'],
    useConfetti: true, rainType: 'confetti',
    useFireworks: true,
    useLightning: true,
    lightningCols: {3:'rgba(255,120,32,.95)',4:'rgba(255,210,0,1)',5:'rgba(255,235,0,1)',6:'rgba(200,80,255,1)'},
    useGlitch: true,
    useMedalDrop: true,
    floaterGlyphs: { 5:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉'], 6:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉','🎊','🥳','🌈','💎','👑','🎆'] },
    fastLabel: '⚡ 速答！',
    tierUpLabel: (t) => '🔥 TIER ' + Math.max(1, Math.min(t, 6)) + ' 突入',
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
      6: ['#FF2BD6','#00E5FF','#7A5CFF','#39FF88','#FFFFFF','#00FFC8','#FFE600','#FF6EC7']
    },
    shapes: () => ['square','shard'],
    ringColor: (tier) => tier >= 6 ? 'rgba(255,43,214,.9)' : tier >= 4 ? 'rgba(0,229,255,.9)' : 'rgba(122,92,255,.8)',
    fullscreenCols:  ['','','#00E5FF','#FF2BD6','#7A5CFF','#39FF88','#FFE600'],
    fullscreenGlow:  ['','','0,229,255','255,43,214','122,92,255','57,255,136','255,230,0'],
    flashColors: ['','','rgba(0,229,255,.30)','rgba(255,43,214,.42)','rgba(122,92,255,.62)','rgba(57,255,136,.70)','rgba(255,230,0,.72)'],
    borderColors: {4:'#00E5FF',5:'#FF2BD6',6:'#7A5CFF'},
    bgRgbs: ['','0,229,255','255,43,214','122,92,255','57,255,136','0,255,200','255,230,0'],
    meterGrads: ['','linear-gradient(90deg,#00E5FF,#39FF88)','linear-gradient(90deg,#7A5CFF,#00E5FF)','linear-gradient(90deg,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#39FF88,#00FFC8)','linear-gradient(90deg,#00E5FF,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#FF2BD6,#00E5FF,#39FF88,#FFE600)'],
    labels: (n) => ['','⚡️ x'+n+' STREAK','💠 x'+n+' STREAK!!','🔷 x'+n+' OVERDRIVE','🤖 x'+n+' OVERDRIVE!!','👾 x'+n+' MAXIMUM','🛸 x'+n+' LIMIT BREAK'],
    popOverlay: 'linear-gradient(135deg,rgba(0,229,255,.28),rgba(255,43,214,.14))',
    comboLabel: (n) => n >= 2 ? '⚡️[ x'+n+' ]' : '+1',
    comboColors: ['','#00E5FF','#7A5CFF','#FF2BD6','#39FF88','#00FFC8','#FFE600'],
    correctEmoji: ['⚡️','💠','🔷'],
    floaterScale: 1.5,
    fx: { rgb: '0,229,255', hex: '#00E5FF', particles: ['#00E5FF','#7A5CFF','#FF2BD6','#39FF88','#FFFFFF'], sparkle: ['#FFE600','#39FF88','#00FFC8'], glyph: '⚡️' },
    useConfetti: false, rainType: 'digital',
    useFireworks: false, useCircuitPulse: true,
    useLightning: true,
    lightningCols: {3:'rgba(0,229,255,.95)',4:'rgba(255,43,214,1)',5:'rgba(122,92,255,1)',6:'rgba(57,255,136,1)'},
    useGlitch: true,
    useHeavyGlitch: true,
    floaterGlyphs: { 5:['⚡️','💠','🔷','👾','🤖'], 6:['⚡️','💠','🔷','👾','🛸','🤖','🔋','📡'] },
    fastLabel: '⚡ FAST!',
    tierUpLabel: (t) => '▲ LEVEL ' + Math.max(1, Math.min(t, 6)) + ' UNLOCKED',
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
      6: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#FFD9D9','#2b2b2b']
    },
    shapes: () => ['blob'],
    ringColor: (tier) => tier >= 5 ? 'rgba(26,26,26,.75)' : 'rgba(201,58,58,.75)',
    fullscreenCols:  ['','','#C93A3A','#8B1E1E','#C9A24B','#E8C468','#1a1a1a'],
    fullscreenGlow:  ['','','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26'],
    flashColors: ['','','rgba(201,58,58,.24)','rgba(139,30,30,.34)','rgba(201,162,75,.40)','rgba(26,26,26,.50)','rgba(201,58,58,.55)'],
    borderColors: {4:'#C93A3A',5:'#1a1a1a',6:'#C9A24B'},
    bgRgbs: ['','245,239,224','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26'],
    meterGrads: ['','linear-gradient(90deg,#C9A24B,#E8C468)','linear-gradient(90deg,#C93A3A,#E8925C)','linear-gradient(90deg,#8B1E1E,#C93A3A)','linear-gradient(90deg,#C9A24B,#C93A3A)','linear-gradient(90deg,#1a1a1a,#C93A3A,#C9A24B)','linear-gradient(90deg,#8B1E1E,#1a1a1a,#C9A24B)'],
    labels: (n) => ['','🖌️ '+n+'連続','💮 '+n+'連続','🏮 '+n+'連続','⛩️ '+n+'連続・見事','🀄 '+n+'連続・天晴','🐉 '+n+'連続・極'],
    popOverlay: 'linear-gradient(135deg,rgba(201,58,58,.22),rgba(20,20,20,.12))',
    comboLabel: (n) => n >= 2 ? '💮×'+n+' 連続' : '+1',
    comboColors: ['','#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#E8C468','#8B1E1E'],
    correctEmoji: ['💮','🖌️','🏮'],
    floaterScale: 1.5,
    fx: { rgb: '201,58,58', hex: '#C93A3A', particles: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0'], sparkle: ['#C9A24B','#E8C468','#8B1E1E'], glyph: '○' },
    useConfetti: false, rainType: 'petals',
    useFireworks: false, useBrushCircle: true,
    useLightning: false,
    useGlitch: false, useBrushSwipe: true,
    floaterGlyphs: { 5:['💮','🏮','🎐','🧧','⛩️'], 6:['💮','🏮','⛩️','🀄','🎐','🧧','🎏','🐉'] },
    fastLabel: '⚡ 早業！',
    tierUpLabel: (t) => '『 ' + (['','初伝','中伝','奥伝','皆伝','免許','極意'][Math.max(1, Math.min(t, 6))] || '') + ' 』',
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
      6: ['#FF1744','#00E5FF','#FFEA00','#FFFFFF','#FF9100','#00E676','#D500F9','#FF5252']
    },
    shapes: () => ['circle','plus'],
    ringColor: (tier) => tier >= 6 ? 'rgba(0,229,255,.9)' : tier >= 4 ? 'rgba(255,23,68,.85)' : 'rgba(0,230,118,.8)',
    fullscreenCols:  ['','','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF'],
    fullscreenGlow:  ['','','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255'],
    flashColors: ['','','rgba(0,230,118,.28)','rgba(255,234,0,.34)','rgba(255,145,0,.5)','rgba(255,23,68,.65)','rgba(0,229,255,.75)'],
    borderColors: {4:'#FF9100',5:'#FF1744',6:'#00E5FF'},
    bgRgbs: ['','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255','213,0,249'],
    meterGrads: ['','linear-gradient(90deg,#00E676,#69F0AE)','linear-gradient(90deg,#FFEA00,#FFF176)','linear-gradient(90deg,#FF9100,#FFC246)','linear-gradient(90deg,#FF1744,#FF6E7F)','linear-gradient(90deg,#00E5FF,#00E676,#FF1744)','linear-gradient(90deg,#D500F9,#00E5FF,#FF1744,#FFEA00)'],
    labels: (n) => ['','💓 '+n+'連続・正常波形','📈 '+n+'連続・好調','⚡ '+n+'連続・覚醒','🩺 '+n+'連続・絶好調','🫀 '+n+'連続・フル稼働','🏥 '+n+'連続・完全治癒レベル'],
    popOverlay: 'linear-gradient(135deg,rgba(0,230,118,.22),rgba(0,191,165,.12))',
    comboLabel: (n) => n >= 2 ? '💓×'+n+' 安定波形' : '+1',
    comboColors: ['','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF','#D500F9'],
    correctEmoji: ['➕','💊','🩺'],
    floaterScale: 1.3,
    fx: { rgb: '0,230,118', hex: '#00E676', particles: ['#00E676','#69F0AE','#FFFFFF','#00BFA5','#FFEA00'], sparkle: ['#FF1744','#FFFFFF','#00E5FF'], glyph: '➕' },
    useConfetti: false, rainType: 'digital',
    rainGlyphs: ['♥','+','━','●','◆'], rainCols: ['#00E676','#FF1744','#FFEA00','#00E5FF'],
    useFireworks: false, useECGSweep: true,
    useLightning: false,
    useGlitch: true,
    pulseBeat: true, useDefib: true,
    floaterGlyphs: { 5:['💊','🩺','❤️','➕','💉'], 6:['💊','🩺','❤️','➕','💉','🫀','⚕️','🏥'] },
    fastLabel: '⚡ 即断！',
    tierUpLabel: (t) => '♥ STAGE ' + Math.max(1, Math.min(t, 6)),
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
      6: ['#FFD54F','#7C4DFF','#40C4FF','#FF80AB','#FFFFFF','#B388FF','#448AFF','#E040FB']
    },
    shapes: () => ['star','circle'],
    ringColor: (tier) => tier >= 6 ? 'rgba(255,213,79,.9)' : tier >= 4 ? 'rgba(124,77,255,.85)' : 'rgba(68,138,255,.75)',
    fullscreenCols:  ['','','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB'],
    fullscreenGlow:  ['','','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251'],
    flashColors: ['','','rgba(68,138,255,.28)','rgba(124,77,255,.36)','rgba(64,196,255,.5)','rgba(255,213,79,.6)','rgba(224,64,251,.7)'],
    borderColors: {4:'#40C4FF',5:'#FFD54F',6:'#E040FB'},
    bgRgbs: ['','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251','179,136,255'],
    meterGrads: ['','linear-gradient(90deg,#448AFF,#82B1FF)','linear-gradient(90deg,#7C4DFF,#B388FF)','linear-gradient(90deg,#40C4FF,#80D8FF)','linear-gradient(90deg,#FFD54F,#FFECB3)','linear-gradient(90deg,#E040FB,#7C4DFF,#40C4FF)','linear-gradient(90deg,#FFD54F,#E040FB,#7C4DFF,#40C4FF)'],
    labels: (n) => ['','⭐ '+n+'連続','🌟 '+n+'連続','☄️ '+n+'連続・加速中','🚀 '+n+'連続・光速','🪐 '+n+'連続・銀河制覇','🌌 '+n+'連続・宇宙の覇者'],
    popOverlay: 'linear-gradient(135deg,rgba(124,77,255,.24),rgba(64,196,255,.12))',
    comboLabel: (n) => n >= 2 ? '🌠×'+n+' WARP' : '+1',
    comboColors: ['','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB','#B388FF'],
    correctEmoji: ['⭐','✨','🌟'],
    fx: { rgb: '124,77,255', hex: '#7C4DFF', particles: ['#7C4DFF','#448AFF','#40C4FF','#FFFFFF','#FFD54F'], sparkle: ['#FFD54F','#FFFFFF','#E040FB'], glyph: '✦' },
    useConfetti: false, rainType: 'warp',
    rainCols: ['#7C4DFF','#448AFF','#40C4FF','#FFD54F','#FFFFFF','#E040FB','#B388FF'],
    useFireworks: true,
    useLightning: false,
    useGlitch: true,
    useBlackHole: true,
    floaterGlyphs: { 5:['🌟','⭐','☄️','🪐','🚀'], 6:['🌟','⭐','☄️','🪐','🚀','🌌','👽','🛰️'] },
    fastLabel: '⚡ 光速回答！',
    tierUpLabel: (t) => '🚀 PHASE ' + Math.max(1, Math.min(t, 6)),
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
      6: ['#FF1053','#00A8E8','#FFD400','#00E676','#FF7A00','#B026FF','#FFFFFF']
    },
    shapes: () => ['square','circle'],
    ringColor: (tier) => tier >= 6 ? 'rgba(176,38,255,.9)' : tier >= 4 ? 'rgba(255,16,83,.85)' : 'rgba(0,168,232,.75)',
    fullscreenCols:  ['','','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF'],
    fullscreenGlow:  ['','','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255'],
    flashColors: ['','','rgba(0,168,232,.28)','rgba(255,16,83,.36)','rgba(255,212,0,.5)','rgba(255,122,0,.62)','rgba(176,38,255,.72)'],
    borderColors: {4:'#FFD400',5:'#FF7A00',6:'#B026FF'},
    bgRgbs: ['','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255','0,230,118'],
    meterGrads: ['','linear-gradient(90deg,#00A8E8,#4FD8FF)','linear-gradient(90deg,#FF1053,#FF6B8F)','linear-gradient(90deg,#FFD400,#FFF07A)','linear-gradient(90deg,#FF7A00,#FFB74D)','linear-gradient(90deg,#B026FF,#FF1053,#00A8E8)','linear-gradient(90deg,#FF1053,#FFD400,#00A8E8,#B026FF)'],
    labels: (n) => ['','⭐ '+n+' HIT','👾 '+n+' COMBO','🕹️ '+n+' COMBO!!','💰 '+n+' HIGH SCORE','🏆 '+n+' PERFECT!','👑 '+n+' 1UP!! GAME MASTER'],
    popOverlay: 'linear-gradient(135deg,rgba(0,168,232,.24),rgba(255,16,83,.12))',
    comboLabel: (n) => n >= 2 ? '👾 x'+n+' HIT!' : '+1',
    comboColors: ['','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF','#00E676'],
    correctEmoji: ['⭐','💎','🔺'],
    floaterScale: 1.2,
    fx: { rgb: '255,16,83', hex: '#FF1053', particles: ['#FF1053','#00A8E8','#FFD400','#00E676','#FFFFFF'], sparkle: ['#FFD400','#FFFFFF','#B026FF'], glyph: '★' },
    useConfetti: false, rainType: 'digital',
    rainGlyphs: ['★','■','◆','▲','●'], rainCols: ['#FF1053','#00A8E8','#FFD400','#00E676'],
    useFireworks: false, useCircuitPulse: true,
    useLightning: false,
    useGlitch: true,
    useCRT: true, chunkyShake: true,
    floaterGlyphs: { 5:['🕹️','👾','🎮','⭐','💎'], 6:['🕹️','👾','🎮','⭐','💎','🍄','🏆','💰'] },
    fastLabel: '⚡ QUICK!',
    tierUpLabel: (t) => '★ STAGE ' + Math.max(1, Math.min(t, 6)) + ' CLEAR',
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
      6: ['#FFD700','#FFF3C4','#F7E7CE','#C9A227','#1a1a1a','#FFFFFF','#E5C158']
    },
    shapes: () => ['circle','gem'],
    ringColor: (tier) => tier >= 6 ? 'rgba(255,215,0,.95)' : tier >= 4 ? 'rgba(201,162,39,.85)' : 'rgba(255,215,0,.7)',
    fullscreenCols:  ['','','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700'],
    fullscreenGlow:  ['','','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0'],
    flashColors: ['','','rgba(255,215,0,.24)','rgba(201,162,39,.3)','rgba(247,231,206,.4)','rgba(255,243,196,.55)','rgba(255,215,0,.7)'],
    borderColors: {4:'#C9A227',5:'#FFD700',6:'#FFF3C4'},
    bgRgbs: ['','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0','26,26,26'],
    meterGrads: ['','linear-gradient(90deg,#FFD700,#FFF3C4)','linear-gradient(90deg,#C9A227,#E5C158)','linear-gradient(90deg,#F7E7CE,#FFF3C4)','linear-gradient(90deg,#FFD700,#C9A227)','linear-gradient(90deg,#1a1a1a,#FFD700,#F7E7CE)','linear-gradient(90deg,#FFD700,#1a1a1a,#FFF3C4,#C9A227)'],
    labels: (n) => ['','✨ '+n+'連続','💎 '+n+'連続','🥂 '+n+'連続・上質','👑 '+n+'連続・至高','🏆 '+n+'連続・栄光','💰 '+n+'連続・完全制覇'],
    popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.26),rgba(26,26,26,.14))',
    comboLabel: (n) => n >= 2 ? '💎×'+n+' JACKPOT' : '+1',
    comboColors: ['','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700','#1a1a1a'],
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
    floaterGlyphs: { 5:['💎','👑','🏆','💰','✨'], 6:['💎','👑','🏆','💰','✨','🥂','🎩','💍'] },
    fastLabel: '⚡ 即決！',
    tierUpLabel: (t) => '✦ RANK ' + (['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'][Math.max(1, Math.min(t, 6))] || ''),
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
  const uid = card && card.dataset && card.dataset.uid;
  if (!uid) return false;
  const t0 = _examCardSeenAt.get(uid);
  return !!t0 && (Date.now() - t0) <= FAST_ANSWER_MS;
}

// 演出の発火座標を可視領域内に収める。直前の正解カードから次カードへのスムーススクロールが
// まだ動いている間に選んだ肢の矩形を読むと、肢が画面上端まで来ておりリング／ラベルが
// 「上の端」でズレて発火する（再試験は問題数が少なく速答が続くため起きやすい）。
// ヘッダー下端〜画面下端に必ずクランプして、答えたカードの位置で発火させる。
function _examFxHeaderBottom() {
  const h = document.querySelector('.st-hdr');
  return h ? h.getBoundingClientRect().bottom : 0;
}
function _examClampFxXY(cx, cy) {
  const top = _examFxHeaderBottom() + 18;
  const bottom = window.innerHeight - 18;
  return [cx, Math.max(top, Math.min(bottom, cy))];
}

// A1: 速答ボーナス。ラベル＋⚡グリフを選んだ肢の位置から出す
function _triggerFastBonus(el) {
  if (_fxOff()) return;
  const theme = _examTheme();
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const cx0 = r && r.width ? r.left + r.width / 2 : window.innerWidth / 2;
  const cy0 = r && r.width ? r.top : window.innerHeight * 0.4;
  const [cx, cy] = _examClampFxXY(cx0, cy0);
  const lab = document.createElement('div');
  lab.className = 'exam-fast-pop';
  lab.textContent = theme.fastLabel || '⚡ 速答！';
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
  const t = Math.max(1, Math.min(_examTier(examStreak) || 1, 6));
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
  if (r.bottom < _examFxHeaderBottom() + 20 || r.top > window.innerHeight) return; // カードが可視域外＝枠が上端等でズレる
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

// B4: ティア昇格スタンプ。昇格した瞬間だけ「TIER UP」を叩き込む
function _triggerTierUpStamp(tier, n) {
  if (_fxOff()) return;
  const theme = _examTheme();
  const el = document.createElement('div');
  el.className = 'exam-tierup';
  const col = (theme.fullscreenCols && theme.fullscreenCols[Math.min(tier, 6)]) || '#FFD700';
  const glow = (theme.fullscreenGlow && theme.fullscreenGlow[Math.min(tier, 6)]) || '255,215,0';
  el.innerHTML = '<span class="tu-lbl">TIER UP</span>' +
    '<span class="tu-main">' + ((theme.tierUpLabel && theme.tierUpLabel(tier)) || ('TIER ' + tier)) + '</span>';
  el.style.setProperty('--tu-col', col);
  el.style.setProperty('--tu-glow', glow);
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
      window.MecFX.burst(window.innerWidth / 2, 6, {
        count: 40 + tier * 14,
        colors: (theme.burstPalettes && theme.burstPalettes[Math.min(tier, 6)]) || ['#FFD700'],
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
  const cx = window.innerWidth / 2, cy = Math.round(window.innerHeight * 0.44);
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
const EXAM_BOOT_STYLES = ['mecha', 'cyber'];

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
  return ['接続確立 / LINK ESTABLISHED', '電脳ダイブ ... STAND BY', 'BANK ' + qn + ' Q  //  ' + subjLabel];
}

function _examCountdown() {
  if (_fxOff()) return;
  const theme = _examTheme();
  const style = EXAM_BOOT_STYLES[(Math.random() * EXAM_BOOT_STYLES.length) | 0];
  let host = document.getElementById('examCountdown');
  if (!host) {
    host = document.createElement('div');
    host.id = 'examCountdown';
    document.body.appendChild(host);
  }
  const col = (theme.fullscreenCols && theme.fullscreenCols[3]) || '#FFD700';
  const glow = (theme.fullscreenGlow && theme.fullscreenGlow[3]) || '255,215,0';

  // 出題内容をブートログに出す（何が始まるのかが分かる実用も兼ねる）
  const qn = (typeof examQueue !== 'undefined' && examQueue) ? examQueue.length : 0;
  let subjLabel = '—';
  try {
    const ids = [...new Set(examQueue.map(c => c.dataset.uid.split('_ch')[0]))];
    const names = ids.map(id => (STUDY_SUBJECTS.find(x => x.id === id) || {}).name || id);
    subjLabel = names.length > 1 ? (names[0] + ' 他' + (names.length - 1)) : (names[0] || '—');
    if (_srsReviewMode) subjLabel = 'SRS REVIEW';
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

  host.className = 'cd-' + style;
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
      : '<svg class="cd-rings" viewBox="0 0 200 200" aria-hidden="true">' +
        '<circle class="r1" cx="100" cy="100" r="86"/><circle class="r2" cx="100" cy="100" r="66"/>' +
        '<circle class="r3" cx="100" cy="100" r="46"/></svg>') +
    '<div class="cd-log"></div>' +
    '<div class="cd-num"></div>' +
    '<div class="cd-sub"></div>';

  const logEl = host.querySelector('.cd-log');
  const numEl = host.querySelector('.cd-num');
  const subEl = host.querySelector('.cd-sub');
  const lines = _examBootLines(style, qn, subjLabel);

  const timers = [];
  const kill = () => { timers.forEach(clearTimeout); host.style.display = 'none'; host.innerHTML = ''; host.className = ''; };
  const at = (ms, fn) => timers.push(setTimeout(() => { if (!examMode) { kill(); return; } fn(); }, ms));

  // ① ブートログを1行ずつ点灯
  lines.forEach((ln, i) => at(60 + i * 105, () => {
    const d = document.createElement('div');
    d.className = 'cd-line';
    d.textContent = (style === 'mecha' ? '> ' : '// ') + ln;
    logEl.appendChild(d);
    d.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 200, easing: 'ease-out' });
  }));

  // ② 3 → 2 → 1 → 起動語
  const goWord = style === 'mecha' ? 'ALL GREEN' : 'DIVE';
  const t0 = 60 + lines.length * 105 + 120;
  ['3', '2', '1'].forEach((n, i) => at(t0 + i * 420, () => {
    host.classList.add('cd-p2');   // ログを上へ退かせて中央を数字に譲る
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
    subEl.textContent = style === 'mecha' ? 'COMBAT MODE ENGAGED' : 'GHOST LINK — ONLINE';
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

  const flash = document.getElementById('examStreakFlash');
  if (flash && promoted && tier >= 2) {
    flash.getAnimations?.().forEach(a => a.cancel());
    const fc = theme.flashColors;
    flash.style.background = fc[tier];
    flash.style.opacity = '0';
    if (tier >= 4) {
      const pulses = tier >= 6 ? 6 : tier >= 5 ? 4 : 3;
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
  const cx = window.innerWidth / 2;
  const cy = Math.round(window.innerHeight * 0.44);
  const counts = [0, 14, 22, 30, 40, 52, 64];
  _spawnBurst(cx, cy, tier, counts[Math.min(tier, 6)] || 14);
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
  el.style.color = (theme.comboColors && theme.comboColors[Math.min(tier, 6)]) || '#FFD700';
  el.animate([
    { opacity: 0, transform: 'translateX(-50%) translateY(-6px)' },
    { opacity: 1, transform: 'translateX(-50%) translateY(0)', offset: .18 },
    { opacity: 1, offset: promoted ? .72 : .5 },
    { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }
  ], { duration: promoted ? 2200 : 1200, easing: 'ease-out', fill: 'forwards' });
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
  const si = tier >= 6 ? 13 : tier >= 5 ? 8 : tier >= 4 ? 5 : 3;
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
  const vig = tier >= 6 ? .5 : tier >= 5 ? .42 : .3;
  ov.style.boxShadow = `inset 0 0 ${tier >= 5 ? 160 : 110}px ${tier >= 5 ? 30 : 18}px rgba(0,0,0,${vig})`;
  ov.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.7},{opacity:0}], {duration: dur, easing:'ease-out'});
  ov.animate(kf, {duration: dur, easing});
}

function _triggerBorderGlow(tier) {
  const el = document.getElementById('examStreakBorder');
  if (!el) return;
  el.getAnimations?.().forEach(a => a.cancel());
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const colors = theme.borderColors;
  const sizes  = {4:'6px',5:'9px',6:'13px'};
  const color = colors[Math.min(tier,6)];
  const sz = sizes[Math.min(tier,6)];
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
    glyphs: sets[Math.min(tier,6)] || sets[5],
    count: Math.round((tier >= 6 ? 26 : 14) * scale),
    scale: scale
  });
}

function _spawnShockwaveRings(cx, cy, tier) {
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const ringCounts = [0,0,1,2,3,4,6];
  const maxScale = tier >= 6 ? 38 : tier >= 5 ? 30 : tier >= 4 ? 22 : tier >= 3 ? 14 : 9;
  window.MecFX.rings(cx, cy, {
    count: ringCounts[Math.min(tier,6)],
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
    colors: palettes[Math.min(tier,6)] || palettes[4],
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
  // パーティクルの発生原点はトースト位置(top:68px≒画面最上部)ではなく画面中央寄りにする。
  // 上端だと上向きに飛ぶ粒子・バーストが画面外に抜けて半分しか見えないため（iPad実機・2026-07-08）。
  // 縦は全画面コンボ数字(#streakFullscreen=中央)と重なる 0.44 付近に置き、四方に広がっても収まるようにする。
  const cx = window.innerWidth / 2;
  const cy = Math.round(window.innerHeight * 0.44);

  _spawnShockwaveRings(cx, cy, tier);
  _spawnLightning(cx, cy, tier);

  const burstCounts = [0, 0, 50, 140, 340, 580, 900];
  _spawnBurst(cx, cy, tier, burstCounts[Math.min(tier,6)] || 50);

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

  const rainWaves = [0, 0, 0, 1, 3, 6, 10][Math.min(tier,6)];
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
  const col = theme.fullscreenCols[Math.min(tier,6)] || '#00E676';
  const w = window.innerWidth;
  const y = window.innerHeight * (0.4 + Math.random() * 0.2);
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
  const y = window.innerHeight / 2;
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
    document.body.animate([
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
    const bx = window.innerWidth / 2, by = window.innerHeight / 2;
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
  const col = theme.fullscreenCols[Math.min(tier,6)] || '#FFD700';
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
      const x = window.innerWidth * (0.25 + i * 0.25);
      el.textContent = glyphs[i % glyphs.length];
      el.style.cssText = `position:fixed;left:${x.toFixed(0)}px;top:-80px;font-size:64px;pointer-events:none;z-index:9066;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));`;
      document.body.appendChild(el);
      el.animate([
        {transform:'translateY(0) rotate(-8deg) scale(.6)', opacity:0},
        {transform:`translateY(${(window.innerHeight*0.42).toFixed(0)}px) rotate(4deg) scale(1.15)`, opacity:1, offset:.55},
        {transform:`translateY(${(window.innerHeight*0.38).toFixed(0)}px) rotate(-2deg) scale(1)`, offset:.7},
        {transform:`translateY(${(window.innerHeight*0.4).toFixed(0)}px) rotate(0deg) scale(1)`, opacity:1, offset:.85},
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
    bolts: tier >= 6 ? 14 : tier >= 5 ? 9 : tier >= 4 ? 5 : 3,
    color: theme.lightningCols[Math.min(tier,6)],
    tier: tier
  });
}

function _spawnFirework(tier) {
  if (tier < 4) return;
  if (!window.MecFX) return;
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const palettes = theme.burstPalettes;
  window.MecFX.fireworks({
    count: tier >= 6 ? 8 : tier >= 5 ? 5 : 3,
    colors: palettes[Math.min(tier,6)] || palettes[4],
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
  document.body.getAnimations?.().forEach(a => a.cancel());
  const amp = tier >= 6 ? 7 : 4;
  const pulses = tier >= 6 ? 7 : 5;
  const frames = [{transform:'translate(0,0)'}];
  for (let p = 0; p < pulses; p++) {
    frames.push({transform:`translate(${((Math.random()-.5)*amp*2).toFixed(1)}px,${((Math.random()-.5)*amp).toFixed(1)}px)`});
  }
  frames.push({transform:'translate(0,0)'});
  document.body.animate(frames, {duration: tier >= 6 ? 480 : 330, easing:`steps(${pulses})`});
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
    {transform:'scale(1.1) translateY(-3px)',filter:'brightness(1.8)',offset:.15},
    {transform:'scale(.96) translateY(1px)',filter:'brightness(1.2)',offset:.37},
    {transform:'scale(1.03)',offset:.56},
    {transform:'scale(1)',filter:'brightness(1)'}
  ], {duration:420, easing:'cubic-bezier(.22,.68,0,1.25)'});
  const card = el.closest('.qc');
  if (card) {
    card.animate([
      {transform:'translateY(0) rotate(0deg)'},
      {transform:'translateY(-6px) rotate(-.5deg)',offset:.2},
      {transform:'translateY(2px) rotate(.3deg)',offset:.5},
      {transform:'translateY(-2px)',offset:.7},
      {transform:'translateY(0)'}
    ], {duration:480, easing:'ease-out'});
    const ov = document.createElement('div');
    ov.style.cssText = `position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:${theme.popOverlay};`;
    card.style.position = 'relative';
    card.prepend(ov);
    ov.animate([{opacity:1},{opacity:.5,offset:.3},{opacity:0}], {duration:650, easing:'ease-out'}).onfinish = () => ov.remove();
  }
  _spawnScatteredCelebration(theme);
}

// 選択肢付近以外に出す祝祭エフェクト。中央1点に固定せず、互いに離れたランダムな複数箇所へ
// 0.05秒ずつ遅延して連続発火する（肢のポップは別途肢の上で光る＝そちらは文脈表示として維持）。
// 位置は最小距離リジェクションで重複を避ける。上寄り中央帯に置き、答えた肢や下のカードに被りにくくする。
function _scatterPositions(n, minDist) {
  const W = window.innerWidth, H = window.innerHeight;
  const x0 = W * 0.08, x1 = W * 0.92;
  const y0 = H * 0.10, y1 = H * 0.72;
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
  const t = Math.max(2, Math.min(_examTier(examStreak) || 2, 6));
  const pal = theme.burstPalettes[t] || theme.burstPalettes[2];
  const isInk = examEffectSet === 'ink';
  const glyphs = theme.correctEmoji; // classic は無し
  const n = 4 + Math.min(t, 3);       // 4〜7 箇所
  const minDist = Math.min(window.innerWidth, window.innerHeight) * 0.264; // 0.22 ×1.2（重複回避を強化）
  const pts = _scatterPositions(n, minDist);
  pts.forEach((p, i) => {
    setTimeout(() => {
      if (!window.MecFX) return;
      window.MecFX.rings(p.x, p.y, { count: 1, color: theme.ringColor(t), thickness: 3, maxR: 105 + t * 18, additive: !isInk });
      window.MecFX.burst(p.x, p.y, { count: 12 + t * 2, colors: pal, shapes: isInk ? ['shard', 'square'] : ['circle', 'star'], tier: 3, scale: 1.2, glow: !isInk, additive: !isInk });
      if (glyphs && glyphs.length) window.MecFX.glyphBurst(p.x, p.y, { glyphs: glyphs, count: 3, w: 110, spread: 110 });
    }, i * 50);   // 0.05秒ずつ遅延して連続発火
  });
}

function _spawnFloatingCombo(card, n, tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const el = document.createElement('div');
  const cols = theme.comboColors;
  const sz = 16 + Math.min(tier,6) * 4;
  el.textContent = theme.comboLabel(n);
  // 位置はカード相対だとカードのスクロール位置で上端に寄って見切れ、演出ごとに高さがバラつく。
  // 粒子・全画面コンボ数字と同じ画面中央(やや上)の焦点に統一して、正解/連続正解の演出をまとめる。
  const cx = window.innerWidth / 2;
  const cy = Math.round(window.innerHeight * 0.40);
  el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-weight:900;font-size:${sz}px;color:${cols[Math.min(tier,6)]};pointer-events:none;z-index:9200;text-shadow:0 2px 12px rgba(0,0,0,.7);transform:translateX(-50%);white-space:nowrap;`;
  document.body.appendChild(el);
  el.animate([
    {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)'},
    {opacity:0,transform:'translateX(-50%) translateY(-70px) scale(1.3)'}
  ], {duration:900, easing:'cubic-bezier(.22,.68,0,1.2)', fill:'forwards'}).onfinish = () => el.remove();
}

function _triggerBgBreath(tier) {
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const rgbs = theme.bgRgbs;
  const rgb = rgbs[Math.min(tier,6)];
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
  if (n < 2) { meter.style.opacity='0'; fill.style.width='0%'; if (lbl) lbl.style.opacity='0'; return; }
  meter.style.opacity = '1';
  const theme = EXAM_EFFECT_THEMES[examEffectSet] || EXAM_EFFECT_THEMES.classic;
  const tier = _examTier(n);
  const starts=[0,2,4,7,10,15,20], ends=[0,4,7,10,15,20,25];
  const pct = tier>=6 ? 100 : ((n-starts[tier])/(ends[tier]-starts[tier])*100);
  const grads = theme.meterGrads;
  fill.style.background = grads[Math.min(tier,6)];
  fill.style.width = pct.toFixed(1) + '%';
  // B6: 次のティアまで残り何問かを表示（今まで3pxバーだけで誰も気づけなかった）
  if (lbl) {
    const remain = tier >= 6 ? 0 : ends[tier] - n;
    lbl.textContent = tier >= 6 ? '⚡ MAX' : ('あと ' + remain + ' で TIER ' + (tier + 1));
    lbl.style.color = (theme.comboColors && theme.comboColors[Math.min(tier,6)]) || '#FFD700';
    lbl.style.opacity = '1';
    lbl.getAnimations?.().forEach(a => a.cancel());
    lbl.animate([{opacity:1},{opacity:1,offset:.7},{opacity:0}], {duration:2400, easing:'ease-out', fill:'forwards'});
  }
  const prev = n-1 < 2 ? 0 : _examTier(n-1);
  if (tier > prev) meter.animate([{height:'3px'},{height:'7px'},{height:'3px'}],{duration:400,easing:'ease-out'});
}

function _resetComboMeter() {
  const meter = document.getElementById('examComboMeter');
  const fill  = document.getElementById('examComboMeterFill');
  const lbl   = document.getElementById('examComboMeterLbl');
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
  if (!_myrate[uid]) _myrate[uid] = { correct: 0, total: 0 };
  _myrate[uid].total++;
  if (isCorrect) _myrate[uid].correct++;
  localStorage.setItem('myrate_v1', JSON.stringify(_myrate));
  if (window.MECSync) window.MECSync.scheduleSync();
  _updateMyRateBadge(uid, _myrate[uid]);
  try { window.MecGamify?.onAnswer?.(uid, isCorrect); } catch {}
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
  if (card.querySelectorAll('.ch2.ok').length > 0) return false;
  return typeof _isScoreExcluded === 'function' ? _isScoreExcluded(card) : false;
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
    note.textContent = '⚠️ 採点除外 — 正解肢が無いため採点対象外です（正誤・正解率・再試験に含めません）';
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
  const req = _getRequiredCount(card);
  const sel = card.querySelectorAll('.ch2.exam-selected').length;
  const info = card.querySelector('.exam-multi-info');
  if (info) { info.textContent = sel + ' / ' + req + ' 選択中'; info.dataset.ready = sel >= req ? '1' : '0'; }
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

function _shuffleChoices(card) {
  if (card.querySelector('.qimg-row')) return;
  if (card.querySelector('.qt u')) return;
  const cs = card.querySelector('.cs');
  if (!cs) return;
  const choices = [...cs.querySelectorAll('.ch2')];
  if (choices.length < 2) return;
  // 選択肢が「番号・記号の参照」だけの問題はシャッフルしない。
  // 例: Q26「下線部①〜⑤のどれか」/ 表の行 a〜e を選ぶ問題では、問題文が
  // ①②③… や a b c… の順序に依存しており、並べ替えると正誤対応が崩れて意味不明になる。
  // 先頭の選択肢ラベル(ａ-ｅ/a-e)を除いた本文が、丸囲み数字・ローマ数字・単独の英字/カナ/数字
  // だけなら参照型とみなす。
  const _isRefChoice = ch => {
    const body = ch.textContent.trim().replace(/^[ａ-ｅa-e][　\s]*/i, '').trim();
    return body === '' || /^[①-⑳⓪❶-❿Ⅰ-Ⅻⅰ-ⅹ]$/.test(body) || /^[（(]?[0-9]{1,2}[）)]?$/.test(body) || /^[ア-オア-ンa-eA-E]$/.test(body);
  };
  if (choices.every(_isRefChoice)) return;
  _examChoiceBackup.set(card.dataset.uid, choices.map(c => c.cloneNode(true)));
  const shuffled = choices.slice().sort(() => Math.random() - 0.5);
  shuffled.forEach((ch, i) => {
    cs.appendChild(ch);
    const tn = ch.firstChild;
    if (tn && tn.nodeType === Node.TEXT_NODE)
      tn.textContent = tn.textContent.replace(/^[ａ-ｅa-e][　\s]*/i, (i + 1) + '　');
  });
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
  if (txt) {
    if (_srsReviewMode) {
      const remaining = total - examAnswered;
      const streakPart = examStreak >= 2 ? `  🔥×${examStreak}` : '';
      txt.textContent = '残り ' + remaining + ' 問' + streakPart;
    } else {
      txt.textContent = examAnswered + ' / ' + total + ' 問';
    }
    if (isCorrect) {
      txt.getAnimations?.().forEach(a => a.cancel());
      txt.animate([
        {transform:'scale(1.45)',color:'var(--gr)',textShadow:'0 0 12px rgba(61,214,140,.8)'},
        {transform:'scale(1)',color:'inherit',textShadow:'none'}
      ], {duration:400, easing:'cubic-bezier(.34,1.56,.64,1)'});
    }
  }
}

let _examScrollRaf = null;
function _getExamTargetCard() {
  const hdr = document.querySelector('.st-hdr');
  const hdrH = hdr ? hdr.getBoundingClientRect().bottom : 0;
  const visibleCards = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.style.display !== 'none' && !c.classList.contains('exam-revealed'));
  return visibleCards.find(c => c.getBoundingClientRect().bottom > hdrH) || null;
}
function _updateExamFocus() {
  const card = _getExamTargetCard();
  document.querySelectorAll('.qc.exam-key-focus').forEach(c => c.classList.remove('exam-key-focus'));
  if (card) { card.classList.add('exam-key-focus'); _markCardSeen(card); }
}
function _onExamScroll() {
  if (_examScrollRaf) cancelAnimationFrame(_examScrollRaf);
  _examScrollRaf = requestAnimationFrame(_updateExamFocus);
}
function _examKeyHandler(e) {
  if (!examMode) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const card = _getExamTargetCard();
  if (!card) return;
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
  examWrong = saved.wrongUids || [];

  examMode = true;
  examStartTime = Date.now(); _examPausedMs = 0; _examPauseStart = null;
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  document.addEventListener('visibilitychange', _examVisibilityHandler);
  localStorage.setItem('mec_exam_active_key', saved.key || '');
  _examChoiceBackup.clear();
  document.body.classList.add('exam-mode');
  const _eqSet = new Set(examQueue);
  document.querySelectorAll('.qc[data-uid]').forEach(c => { if (!_eqSet.has(c)) c.style.display = 'none'; });

  const revealedUids = saved.revealedUids || {};

  examQueue.forEach(card => {
    card.style.display = '';
    const uid = card.dataset.uid;
    if (revealedUids[uid]) {
      card.classList.add('exam-revealed');
      if (revealedUids[uid].correct) card.classList.add('exam-multi-correct');
    } else {
      _shuffleChoices(card);
      const req = _getRequiredCount(card);
      if (req > 1 && !card.querySelector('.exam-multi-info')) {
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
        btn.textContent = req > 1 ? '▶ 回答を確定する' : '▶ 解答を見る';
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
  if (!_srsReviewMode) {
    if (examAnswered >= examQueue.length) _clearExamResume();
    else _saveExamResume();
  }
  examMode = false;
  localStorage.removeItem('mec_exam_active_key');
  _zoneStop(false); _setAwaken(false);
  // srs-review クラスはここでは外さない。結果画面〜誤答再試験の間も復習の最小表示を保つため、
  // 解除は通常閲覧へ戻る _srsRestoreAfterReview() に集約している。
  _lastSessionWasSrs = _srsReviewMode;
  document.body.classList.remove('exam-mode', 'exam-effect-neon', 'exam-effect-ink');
  clearInterval(examTimerInt);
  document.removeEventListener('keydown', _examKeyHandler);
  document.removeEventListener('visibilitychange', _examVisibilityHandler);
  _examPauseStart = null;
  window.removeEventListener('scroll', _onExamScroll);
  document.querySelectorAll('.qc.exam-key-focus').forEach(c => c.classList.remove('exam-key-focus'));
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
  const modeBtn = document.getElementById('examModeBtn');
  if (modeBtn) { modeBtn.textContent = '🎓 試験'; modeBtn.classList.remove('exam-on'); modeBtn.onclick = openExamStart; }
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
  document.querySelectorAll('.streak-particle,.streak-ring,.exam-bg-breath,.exam-fx-temp,.mec-cfx,.exam-tierup,.exam-fast-pop,.exam-trace-svg,.exam-zone-collapse').forEach(el => el.remove());
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
  if (titleEl) titleEl.innerHTML = _srsReviewMode ? '🔔 <span class="grad-txt">復習セッション結果</span>' : '📊 <span class="grad-txt">セッション結果</span>';
  const elapsed = examStartTime ? Math.floor((_examActiveMs()) / 1000) : 0;
  const pct = examAnswered > 0 ? Math.round(examCorrect / examAnswered * 100) : 0;
  // スコアの色は章カードと同じ基準（80↑緑/60-79黄/60未満赤）。数字は0→pctへカウントアップし、
  // 周囲のconic-gradientリングも同時に伸びる（--p/--ringc は study.css の .exam-pct-ring が参照）
  const pctEl = document.getElementById('sumPct');
  const pctRing = document.getElementById('sumPctRing');
  const pctCol = pct >= 80 ? '#3DD68C' : pct >= 60 ? '#FFB830' : '#FF6B6B';
  if (pctEl) pctEl.style.color = pctCol;
  if (pctRing) { pctRing.style.setProperty('--ringc', pctCol); pctRing.style.setProperty('--p', 0); }
  if (pctEl) {
    const t0 = performance.now(), dur = 900;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(pct * (1 - Math.pow(1 - k, 3)));
      pctEl.textContent = v + '%';
      if (pctRing) pctRing.style.setProperty('--p', v);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.getElementById('sumCorrect').textContent = examCorrect;
  document.getElementById('sumWrong').textContent = examAnswered - examCorrect;
  document.getElementById('sumAnswered').textContent = examAnswered;
  document.getElementById('sumTime').textContent = Math.floor(elapsed/60) + '分' + (elapsed%60) + '秒';
  const subjEl = document.getElementById('sumSubjTable');
  if (subjEl) {
    subjEl.innerHTML = Object.entries(examBySubj).map(([sid, s]) => {
      const subj = STUDY_SUBJECTS.find(x => x.id === sid);
      const p = Math.round(s.correct / s.total * 100);
      const pc = p >= 80 ? '#7CEFB2' : p >= 60 ? '#FFD37A' : '#FF9B9B';
      return `<tr><td>${subj ? subj.icon + ' ' + subj.name : sid}</td><td style="font-weight:700">${s.correct}/${s.total}</td><td style="font-weight:700;color:${pc}">${p}%</td></tr>`;
    }).join('');
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
        // PERFECT: 金の花火＋金紙吹雪をスタンプに合わせて遅らせる
        setTimeout(() => {
          window.MecFX.fireworks({ count: 7, colors: ['#FFD700', '#FFF3C4', '#F7E7CE', '#FFB830'], tier: 6 });
          window.MecFX.confetti({ count: 120, colors: ['#FFD700', '#FFF3C4', '#F7E7CE', '#FFB830', '#FFFFFF'], big: true });
          window.MecFX.dust({ count: 70, colors: ['#FFD700', '#FFF3C4', '#FFFFFF'] });
        }, 980);
      } else if (pct >= 90) {
        setTimeout(() => {
          window.MecFX.fireworks({ count: 5, colors: ['#3DD68C', '#60A5FA', '#FFD37A', '#FF5E8A'], tier: 5 });
          window.MecFX.confetti({ count: 90, colors: ['#3DD68C', '#60A5FA', '#FFB830', '#FF5E8A', '#A78BFA'], big: true });
        }, 980);
      } else if (pct >= 80) {
        window.MecFX.confetti({ count: 70, colors: ['#3DD68C', '#60A5FA', '#FFB830', '#A78BFA'], big: true });
      } else if (pct >= 60) {
        window.MecFX.confetti({ count: 50, colors: ['#60A5FA', '#FFB830', '#3DD68C'] });
      } else {
        window.MecFX.rings(window.innerWidth / 2, window.innerHeight * 0.35, { count: 1, color: 'rgba(96,165,250,.7)', thickness: 3, maxR: 140, additive: true });
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
  try { window.MecGamify?.onExamFinish?.(examAnswered, examCorrect); } catch {}
}

function closeExamSummary() {
  document.getElementById('examOverlay').classList.remove('open');
  // 復習モードで起動していた場合、通常閲覧に戻る時点で全科目ロードを開始する
  // （通常フローでは初期化済みのため no-op）。
  window._runDeferredInit?.();
  // 復習のために科目カードを解放していた場合は読み直す（_runDeferredInit は
  // 既に全体初期化が済んでいるケースでは何もしないため、こちらが本命の復帰経路）。
  window._srsRestoreAfterReview?.();
}
