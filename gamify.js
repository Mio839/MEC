// gamify.js — MEC 学習ゲーミフィケーション共有モジュール
// XP/レベル・実績バッジ・連続日数の炎・デイリーミッション・章/科目制覇演出・通常モードのマイクロ演出。
// study.html / index.html の両方から読み込む。CSSは自己注入（study.cssには依存しない）。
//
// データ方針:
//  - XP・実績は既存の同期済みデータ（done_v2 / myrate_v1 / activity_v1 / mec_srs_v1）から毎回
//    決定論的に算出する → 新しい同期キーをほぼ増やさず、複数デバイスで自動的に一致し、
//    導入前の学習履歴も遡って反映される。
//  - 唯一の新・同期キーは mec_gamify_v1 = {bestStreak}（最高連続正解。field-wise max でマージ。
//    progress.js の payload / _mergeRemote に追加済み）。
//  - mec_gamify_local_v1 は端末ローカル（演出の既視管理・デイリーミッション進捗）で同期しない。
//
// iPad/iOS 注意: backdrop-filter は使わない・アニメは transform/opacity のみ・confirm() 不使用。
(function () {
  'use strict';

  const K_SYNC = 'mec_gamify_v1';        // 同期対象 {bestStreak}
  const K_LOCAL = 'mec_gamify_local_v1'; // 端末ローカル {lastLevel,seenAch,chDone,subjDone,sound,devId,mDone,dDay,dSubj,wChEx}
  const K_MISSIONS = 'mec_missions_v1';  // 同期対象。日次/週次ミッションの進捗を端末別カウンタで保持
  //   構造: { d:{ [YYYY-MM-DD]:{ [devId]:{ans,cor,exam,srs,redo,subj,day,hard,chexam80,acc80,perfect} } },
  //           w:{ [週(月曜日付)]:{ [devId]:{...} } },
  //           xp:{ banked:number, ledger:{ [期間キー]:{ [missionId]:xp } } } }
  //   マージ: 同一(期間,端末,カウンタ)は max（端末内は単調増加）／表示・達成判定は端末横断で sum。
  //   → iPad と iPhone で分担しても合算されるので「達成状況」が正しく共有される。
  //   xp はミッション達成ボーナスの台帳（下の MISSION_XP_KEEP_DAYS 参照）。

  // 科目メタ（total は CLAUDE.md の実測値。科目全問制覇の判定にのみ使用）
  const SUBJECTS = [
    { id: 'endo',    name: '内分泌',     icon: '⚗️', color: '#00A5B5', total: 542 },
    { id: 'resp',    name: '呼吸器',     icon: '🌬️', color: '#3B82F6', total: 511 },
    { id: 'circ',    name: '循環器',     icon: '❤️', color: '#EF4444', total: 572 },
    { id: 'dige',    name: '消化器',     icon: '🌿', color: '#A855F7', total: 501 },
    { id: 'neur',    name: '神経',       icon: '🧠', color: '#22C55E', total: 594 },
    { id: 'hbp',     name: '肝胆膵',     icon: '🧪', color: '#F97316', total: 418 },
    { id: 'jinzo_d', name: '腎臓',       icon: '💧', color: '#94A3B8', total: 315 },
    { id: 'hema',    name: '血液',       icon: '🩸', color: '#DC2626', total: 378 },
    { id: 'imma',    name: '免アレ膠',   icon: '🛡️', color: '#EC4899', total: 247 },
    { id: 'kansen',  name: '感染症',     icon: '🦠', color: '#14B8A6', total: 356 },
    { id: 'peds',    name: '小児科',     icon: '🧸', color: '#F472B6', total: 373 },
    { id: 'obg',     name: '産婦人科',   icon: '🤰', color: '#E11D48', total: 685 },
    { id: 'psy',     name: '精神科',     icon: '💭', color: '#7386F2', total: 256 },
    { id: 'derm',    name: '皮膚科',     icon: '🩹', color: '#BF7F60', total: 249 },
    { id: 'oph',     name: '眼科',       icon: '👁️', color: '#5197B7', total: 213 },
    { id: 'ent',     name: '耳鼻咽喉科', icon: '👂', color: '#549C93', total: 214 },
    { id: 'uro',     name: '泌尿器科',   icon: '💦', color: '#0F9CC0', total: 242 },
    { id: 'ortho',   name: '整形外科',   icon: '🦴', color: '#C57E3A', total: 174 },
    { id: 'anes',    name: '麻酔科',     icon: '💉', color: '#A373FE', total: 52 },
    { id: 'rad',     name: '放射線科',   icon: '☢️', color: '#8790A9', total: 60 },
    { id: 'tox',     name: '中毒・職業病', icon: '☠️', color: '#65A30D', total: 48 },
    { id: 'emg',     name: '救急',       icon: '🚑', color: '#FF8A5B', total: 68 },
    { id: 'ph',      name: '公衆衛生',   icon: '🏛', color: '#3097CE', total: 619 },
    { id: 'hisshu',  name: '必修講座',   icon: '🏅', color: '#D4AF37', total: 327 },
    { id: 'jitsu1',  name: '実力試験Ⅰ', icon: '🎯', color: '#6366F1', total: 160 },
    { id: 'm121s',   name: '第121回 夏メック模試', icon: '🏁', color: '#F0ABFC', total: 400 },
  ];

  const TITLES = [
    [100, '伝説の医師'], [90, '名医'], [80, '教授'], [70, '准教授'], [60, '専門医'],
    [50, '指導医'], [40, '主治医'], [30, '医員'], [20, '専攻医'], [10, '研修医'], [1, '医学生'],
  ];

  function _todayJST() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function _g(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } }
  function _s(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  // ── ローカル状態 ─────────────────────────────────────────────────
  const L = _g(K_LOCAL, {});
  L.seenAch = L.seenAch || [];   // 解除演出を見せた実績id
  L.chDone = L.chDone || [];     // 章制覇演出を見せた章prefix
  L.subjDone = L.subjDone || []; // 科目制覇演出を見せたsid
  L.mDone = L.mDone || {};       // ミッション達成トースト既視管理 { ['d:'|'w:'+期間キー]:[missionId] }（ローカル）
  if (!L.devId) L.devId = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  delete L.missions;             // 旧・端末ローカルのみのミッション進捗は廃止（同期版へ移行）
  delete L.dUnflag;              // 旧・🚩克服ミッションの日別帳簿（counter 'unflag' 廃止に伴い不要）
  if (!L.sound) L.sound = 'on';
  function saveL() { _s(K_LOCAL, L); }

  // ── XP・レベル・統計 ─────────────────────────────────────────────
  // XP = 済周回×10 + 試験解答×4 + 試験正解×6 + ミッション達成ボーナス（すべて同期済みデータから再計算）
  function _cumXp(level) { const n = level - 1; return 30 * n * n + 70 * n; } // Lv.level 到達に必要な累計XP
  function _levelFromXp(xp) { let n = 1; while (n < 999 && _cumXp(n + 1) <= xp) n++; return n; }
  function _titleFor(level) { for (const [min, t] of TITLES) { if (level >= min) return t; } return TITLES[TITLES.length - 1][1]; }

  let _statsCache = null, _statsAt = 0;
  function stats(force) {
    if (!force && _statsCache && Date.now() - _statsAt < 400) return _statsCache;
    const done = _g('done_v2', {});
    const myrate = _g('myrate_v1', {});
    let laps = 0, doneCount = 0;
    const bySubj = {};
    // 「済」の範囲はハブ・統合学習ツール・学習統計と同じ正本（progress.js の isDoneInScope）。
    // ⚠️ XP の材料 laps は据え置き（範囲を狭めるとレベルが下がる）。揃えるのは表示と実績の「済 N問」だけ
    const inScope = (window.MECSync && typeof MECSync.isDoneInScope === 'function') ? MECSync.isDoneInScope : null;
    for (const uid in done) {
      const v = done[uid] || 0;
      if (v <= 0) continue;
      laps += v;
      if (!inScope || inScope(uid)) doneCount++;
      const i = uid.indexOf('_ch');
      if (i > 0) { const sid = uid.slice(0, i); bySubj[sid] = (bySubj[sid] || 0) + 1; }
    }
    let exT = 0, exC = 0;
    for (const uid in myrate) { const r = myrate[uid]; if (r) { exT += r.total || 0; exC += r.correct || 0; } }
    let srsLong = 0;
    const srs = _g('mec_srs_v1', {});
    for (const uid in srs) { const e = srs[uid]; if (e && (e.reps || 0) > 0 && (e.interval || 0) >= 30) srsLong++; }
    // ミッションXPは同期台帳（mec_missions_v1.xp）から読むので、他の項と同様に端末間で一致する
    const mXp = missionXp();
    const xp = laps * 10 + exT * 4 + exC * 6 + mXp;
    const level = _levelFromXp(xp);
    const cur = _cumXp(level), next = _cumXp(level + 1);
    const streak = (window.MECSync && MECSync.calcStreak) ? MECSync.calcStreak() : 0;
    const sync = _g(K_SYNC, {});
    _statsCache = {
      xp, level, title: _titleFor(level),
      lvProgress: Math.max(0, Math.min(1, (xp - cur) / Math.max(1, next - cur))),
      lvCurXp: xp - cur, lvNeedXp: next - cur,
      laps, doneCount, exT, exC, bySubj, srsLong, streak, missionXp: mXp,
      accPct: exT > 0 ? Math.round(exC / exT * 100) : 0,
      bestStreak: sync.bestStreak || 0,
    };
    _statsAt = Date.now();
    return _statsCache;
  }

  // ── 実績定義 ─────────────────────────────────────────────────────
  // g(s) → [現在値, 目標値]。現在値>=目標値 で解除。
  const ACH = [
    { id: 'd1',    icon: '🌱', name: 'はじめの一歩',   desc: '1問を済にする',            g: s => [s.doneCount, 1] },
    { id: 'd100',  icon: '💪', name: '百問修行',       desc: '100問を済にする',          g: s => [s.doneCount, 100] },
    { id: 'd500',  icon: '🥉', name: '五百問の壁',     desc: '500問を済にする',          g: s => [s.doneCount, 500] },
    { id: 'd1000', icon: '🥈', name: '千問クラブ',     desc: '1000問を済にする',         g: s => [s.doneCount, 1000] },
    { id: 'd3000', icon: '🥇', name: '三千問の高み',   desc: '3000問を済にする',         g: s => [s.doneCount, 3000] },
    { id: 'd5000', icon: '👑', name: '五千問の王者',   desc: '5000問を済にする',         g: s => [s.doneCount, 5000] },
    { id: 'lap10000', icon: '🔁', name: '周回重ねて一万', desc: '延べ周回1万回',         g: s => [s.laps, 10000] },
    { id: 's3',    icon: '🔥', name: '三日坊主卒業',   desc: '3日連続で学習',            g: s => [s.streak, 3] },
    { id: 's7',    icon: '⚡', name: '一週間の炎',     desc: '7日連続で学習',            g: s => [s.streak, 7] },
    { id: 's14',   icon: '🌋', name: '二週間の溶岩',   desc: '14日連続で学習',           g: s => [s.streak, 14] },
    { id: 's30',   icon: '☄️', name: '一ヶ月の彗星',   desc: '30日連続で学習',           g: s => [s.streak, 30] },
    { id: 's60',   icon: '💫', name: '六十日の超新星', desc: '60日連続で学習',           g: s => [s.streak, 60] },
    { id: 'c10',   icon: '🎯', name: '十連撃',         desc: '試験モードで10連続正解',   g: s => [s.bestStreak, 10] },
    { id: 'c20',   icon: '🚀', name: '二十連撃',       desc: '試験モードで20連続正解',   g: s => [s.bestStreak, 20] },
    { id: 'c30',   icon: '🌟', name: '三十連撃・無双', desc: '試験モードで30連続正解',   g: s => [s.bestStreak, 30] },
    { id: 'e100',  icon: '📝', name: '試験百戦',       desc: '試験モードで100問解答',    g: s => [s.exT, 100] },
    { id: 'e1000', icon: '🎓', name: '試験千戦',       desc: '試験モードで1000問解答',   g: s => [s.exT, 1000] },
    { id: 'e5000', icon: '🏛️', name: '試験五千戦',     desc: '試験モードで5000問解答',   g: s => [s.exT, 5000] },
    { id: 'acc80', icon: '🎖️', name: '精密射撃',       desc: '通算正答率80%以上（200問以上解答）', g: s => [s.exT >= 200 ? s.accPct : 0, 80] },
    { id: 'srs100', icon: '🧬', name: '長期記憶百問',  desc: 'SRS間隔30日以上の問題を100問', g: s => [s.srsLong, 100] },
    { id: 'lv10',  icon: '🩺', name: '研修医デビュー', desc: 'Lv.10に到達',              g: s => [s.level, 10] },
    { id: 'lv30',  icon: '⚕️', name: '医員の風格',     desc: 'Lv.30に到達',              g: s => [s.level, 30] },
    { id: 'lv50',  icon: '🏥', name: '指導医の貫禄',   desc: 'Lv.50に到達',              g: s => [s.level, 50] },
    { id: 'lv80',  icon: '🎓', name: '教授就任',       desc: 'Lv.80に到達',              g: s => [s.level, 80] },
  ].concat(SUBJECTS.map(sub => ({
    id: 'm_' + sub.id, icon: sub.icon, name: sub.name + 'マスター',
    desc: sub.name + ' 全' + sub.total + '問を済にする',
    g: s => [s.bySubj[sub.id] || 0, sub.total],
  })));

  function achState(s) {
    return ACH.map(a => {
      const [cur, target] = a.g(s);
      return { ...a, cur: Math.min(cur, target), target, unlocked: cur >= target || L.seenAch.includes(a.id) };
    });
  }

  // ── 効果音（軽量シンセ・低音量） ─────────────────────────────────
  let _ctx = null;
  function _audio() {
    if (L.sound === 'off') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!_ctx) { try { _ctx = new AC(); } catch { return null; } }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  }
  function _notes(notes, type, gap, dur, vol) {
    const ctx = _audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(vol, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur + gap * Math.max(0, notes.length - 1));
    master.connect(ctx.destination);
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const t = now + i * gap;
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(1 / Math.max(1, notes.length), t);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
    });
  }
  const SND = {
    levelup: () => _notes([392, 523.25, 659.25, 783.99, 1046.5], 'triangle', 0.09, 0.7, 0.11),
    ach:     () => _notes([1046.5, 1318.51, 1567.98, 2093], 'sine', 0.05, 0.45, 0.08),
    mission: () => _notes([1318.51, 1760], 'triangle', 0.06, 0.3, 0.09),
    clear:   () => _notes([261.63, 392, 523.25, 783.99], 'triangle', 0.08, 0.6, 0.1),
    subject: () => _notes([523.25, 659.25, 783.99, 1046.5, 1318.51], 'triangle', 0.1, 0.8, 0.11),
  };

  // ── CSS 注入 ─────────────────────────────────────────────────────
  const CSS = `
.gm-panel{background:linear-gradient(160deg,rgba(var(--panel-a),.96),rgba(var(--panel-b),.97));border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px 14px 12px;color:#EAF0FA;box-shadow:0 6px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);font-family:inherit;}
.gm-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.gm-ring{--p:0;width:86px;height:86px;border-radius:50%;background:conic-gradient(#FFD166 calc(var(--p)*360deg),rgba(255,255,255,.09) 0);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.gm-ring-in{width:72px;height:72px;border-radius:50%;background:var(--surf-3);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;}
.gm-lv-big{font-size:19px;font-weight:900;color:#FFD166;letter-spacing:.5px;}
.gm-lv-title{font-size:9px;font-weight:700;color:rgba(255,255,255,.65);margin-top:1px;}
.gm-xp-col{flex:1;min-width:150px;}
.gm-xp-line{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:4px;}
.gm-xp-line b{color:#FFD166;font-size:13px;}
.gm-xp-bar{height:8px;border-radius:6px;background:rgba(var(--glass-rgb),.09);overflow:hidden;}
.gm-xp-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,#F5A623,#FFD166,#FFF3C4);transition:width .6s cubic-bezier(.2,.8,.2,1);}
.gm-xp-total{font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;font-weight:700;}
.gm-flame{display:flex;flex-direction:column;align-items:center;flex-shrink:0;min-width:74px;}
.gm-flame-emoji{font-size:34px;line-height:1;filter:grayscale(1) opacity(.45);transform-origin:50% 90%;}
.gm-flame-days{font-size:11px;font-weight:800;color:rgba(255,255,255,.7);margin-top:2px;}
.gm-flame-days b{font-size:16px;color:#FFB84D;}
.gm-flame.t1 .gm-flame-emoji{filter:none;}
.gm-flame.t2 .gm-flame-emoji{filter:drop-shadow(0 0 8px rgba(255,150,50,.8));animation:gmFlicker 1.6s ease-in-out infinite;}
.gm-flame.t3 .gm-flame-emoji{font-size:40px;filter:drop-shadow(0 0 12px rgba(255,90,40,.95));animation:gmFlicker 1.1s ease-in-out infinite;}
.gm-flame.t4 .gm-flame-emoji{font-size:44px;filter:drop-shadow(0 0 14px rgba(255,60,120,.9)) hue-rotate(-20deg);animation:gmFlicker .9s ease-in-out infinite;}
.gm-flame.t5 .gm-flame-emoji{font-size:48px;filter:drop-shadow(0 0 18px rgba(80,160,255,.95)) hue-rotate(180deg);animation:gmFlicker .7s ease-in-out infinite;}
.gm-flame.t4 .gm-flame-days b{color:#FF5E8A;}
.gm-flame.t5 .gm-flame-days b{color:#60A5FA;}
@keyframes gmFlicker{0%,100%{transform:scale(1) rotate(-2deg)}30%{transform:scale(1.08) rotate(2deg)}60%{transform:scale(.96) rotate(-1deg)}}
.gm-sec-title{font-size:11px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:1px;margin:12px 0 6px;display:flex;align-items:center;gap:6px;}
.gm-sec-title .gm-cnt{color:#FFD166;}
.gm-missions{display:flex;flex-direction:column;gap:6px;}
.gm-mission{display:flex;align-items:center;gap:8px;background:rgba(var(--glass-rgb),.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px 10px;}
.gm-mission.done{background:rgba(61,214,140,.1);border-color:rgba(61,214,140,.35);}
a.gm-mission.is-launch{text-decoration:none;color:inherit;cursor:pointer;border-color:rgba(245,158,11,.45);}
a.gm-mission.is-launch:hover{background:rgba(245,158,11,.1);}
a.gm-mission.is-launch:active{scale:.98;}
.gm-mission-go{flex-shrink:0;font-size:10px;font-weight:900;color:#FBBF24;}
.gm-mission-ic{font-size:16px;flex-shrink:0;}
.gm-mission-lbl{flex:1;font-size:12px;font-weight:700;color:#EAF0FA;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.gm-mission.done .gm-mission-lbl{color:#7CEFB2;}
.gm-mission-tag{display:inline-flex;align-items:center;gap:2px;font-size:9.5px;font-weight:900;letter-spacing:.3px;padding:1px 5px;border-radius:5px;background:linear-gradient(135deg,rgba(168,85,247,.38),rgba(236,72,153,.38));border:1px solid rgba(236,72,153,.55);color:#FFD6F9;text-shadow:0 0 6px rgba(236,72,153,.8);flex-shrink:0;line-height:1.2;animation:gmTagGlow 3s ease-in-out infinite;}
@keyframes gmTagGlow{0%,100%{box-shadow:0 0 4px rgba(168,85,247,.3);}50%{box-shadow:0 0 10px rgba(236,72,153,.7);}}
/* ── ランダム（日替わり）ミッション特別デザイン ── */
.gm-mission.is-random{background:linear-gradient(135deg,rgba(168,85,247,.14),rgba(56,189,248,.08),rgba(245,158,11,.09));border:1px solid rgba(192,132,252,.4);box-shadow:0 0 14px rgba(168,85,247,.16),inset 0 1px 0 rgba(255,255,255,.12);animation:gmRandomBreath 4.5s ease-in-out infinite alternate;position:relative;}
@keyframes gmRandomBreath{0%{border-color:rgba(192,132,252,.4);box-shadow:0 0 10px rgba(168,85,247,.15);}50%{border-color:rgba(236,72,153,.55);box-shadow:0 0 16px rgba(236,72,153,.26),inset 0 0 8px rgba(168,85,247,.12);}100%{border-color:rgba(56,189,248,.48);box-shadow:0 0 14px rgba(56,189,248,.22);}}
.gm-mission.is-random .gm-mission-ic{display:inline-block;animation:gmDiceWiggle 5.5s ease-in-out infinite;transform-origin:center;}
@keyframes gmDiceWiggle{0%,84%,100%{transform:rotate(0deg) scale(1);}88%{transform:rotate(-14deg) scale(1.18);}92%{transform:rotate(12deg) scale(1.14);}96%{transform:rotate(-6deg) scale(1.06);}}
.gm-mission.is-random .gm-mission-fill{background:linear-gradient(90deg,#A855F7,#EC4899,#F59E0B);}
.gm-mission.is-random.done{background:linear-gradient(135deg,rgba(168,85,247,.22),rgba(61,214,140,.18),rgba(245,158,11,.15));border-color:rgba(236,72,153,.65);box-shadow:0 0 20px rgba(236,72,153,.32),inset 0 0 14px rgba(168,85,247,.2);}
.gm-mission.is-random.done .gm-mission-lbl{color:#FFF0F8;text-shadow:0 0 10px rgba(236,72,153,.7);}
.gm-mission.is-random.done .gm-mission-tag{background:linear-gradient(135deg,rgba(61,214,140,.4),rgba(236,72,153,.4));border-color:rgba(61,214,140,.7);color:#D1FAE5;text-shadow:0 0 6px rgba(61,214,140,.8);}
.gm-mission-bar{position:relative;width:64px;height:6px;border-radius:4px;background:rgba(var(--glass-rgb),.1);overflow:hidden;flex-shrink:0;}
/* ⚠️ display:block は必須。span のままだと inline 扱いで width/height が無視され、
   親(.gm-mission-bar)がフレックスアイテムで枠だけ見えるため「常に空のゲージ」になる */
.gm-mission-fill{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#3DD68C,#7CEFB2);transition:width .4s;}
/* 週次のペース目盛り＝「今そこまで進んでいるべき位置」。親が overflow:hidden なので内側に収める */
.gm-pace{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:rgba(255,255,255,.55);}
.gm-mission-num{font-size:10px;font-weight:800;color:rgba(255,255,255,.6);width:42px;text-align:right;flex-shrink:0;}
.gm-mission.done .gm-mission-num{color:#3DD68C;}
.gm-mission.behind .gm-mission-num{color:#FFB454;}
.gm-sub-title{font-size:10px;font-weight:800;color:rgba(255,255,255,.42);letter-spacing:.5px;margin:8px 0 5px;}
.gm-mission-foot{font-size:10px;font-weight:700;color:rgba(255,255,255,.45);margin-top:6px;text-align:right;}
.gm-mission-foot b{color:#FFD166;}
.gm-badges{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;-webkit-overflow-scrolling:touch;}
.gm-badge{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:58px;padding:8px 4px 6px;border-radius:12px;background:rgba(var(--glass-rgb),.05);border:1px solid rgba(255,255,255,.1);cursor:pointer;flex-shrink:0;transition:transform .15s;font-family:inherit;color:inherit;}
.gm-badge:active{transform:scale(.94);}
.gm-badge .bi{font-size:22px;line-height:1;}
.gm-badge .bn{font-size:8px;font-weight:700;color:rgba(255,255,255,.75);text-align:center;line-height:1.2;}
.gm-badge.locked{opacity:.75;}
.gm-badge.locked .bi{filter:grayscale(1) opacity(.4);}
.gm-badge.locked .bn{color:rgba(255,255,255,.35);}
.gm-badge.unlocked{background:linear-gradient(160deg,rgba(255,209,102,.16),rgba(255,255,255,.04));border-color:rgba(255,209,102,.45);}
.gm-badge-desc{font-size:11px;color:rgba(255,255,255,.75);background:rgba(var(--glass-rgb),.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 10px;margin-top:2px;line-height:1.6;display:none;}
.gm-badge-desc.show{display:block;}
.gm-badge-desc b{color:#FFD166;}
.gm-sound-btn{float:right;background:none;border:1px solid rgba(255,255,255,.18);border-radius:8px;color:rgba(255,255,255,.7);font-size:11px;font-weight:700;padding:2px 8px;cursor:pointer;font-family:inherit;}
/* ── study.html ヘッダーチップ ── */
.gm-lv-chip{cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none;font-family:inherit;color:inherit;}
.gm-lv-chip b{color:#FFD166;}
.gm-chip-bar{width:44px;height:5px;border-radius:4px;background:rgba(var(--glass-rgb),.14);overflow:hidden;display:inline-block;}
.gm-chip-fill{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#F5A623,#FFD166);transition:width .5s;}
.gm-mission-chip{cursor:pointer;user-select:none;font-family:inherit;color:inherit;}
.gm-mission-chip.all{color:#7CEFB2!important;}
.st-streak.gm-t2{color:#FF9A3C;text-shadow:0 0 8px rgba(255,150,50,.6);}
.st-streak.gm-t3{color:#FF7043;text-shadow:0 0 10px rgba(255,90,40,.75);}
.st-streak.gm-t4{color:#FF5E8A;text-shadow:0 0 12px rgba(255,60,120,.8);}
.st-streak.gm-t5{color:#60A5FA;text-shadow:0 0 12px rgba(80,160,255,.9);}
/* ── モーダル（study.html でチップから開く） ── */
#gmOv{position:fixed;inset:0;z-index:var(--z-gm-ov,9500);display:none;align-items:flex-start;justify-content:center;background:rgba(var(--ov-rgb),.78);padding:24px 12px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
#gmOv.open{display:flex;}
#gmOv .gm-panel{width:100%;max-width:560px;margin:auto 0;}
.gm-close-btn{width:100%;margin-top:12px;padding:9px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(var(--glass-rgb),.06);color:rgba(255,255,255,.8);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
/* ── トースト ── */
#gmToast{position:fixed;top:14px;left:50%;z-index:var(--z-gm-toast,9600);transform:translate(-50%,-130%);transition:transform .35s cubic-bezier(.2,.9,.3,1.2);display:flex;align-items:center;gap:10px;background:linear-gradient(160deg,rgba(var(--gmtoast-a),.97),rgba(var(--gmtoast-b),.97));border:1px solid rgba(255,209,102,.5);border-radius:14px;padding:10px 18px;box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:none;max-width:min(92vw,420px);}
#gmToast.show{transform:translate(-50%,0);pointer-events:auto;cursor:pointer;}
#gmToast .ti{font-size:26px;line-height:1;}
#gmToast .tt{font-size:13px;font-weight:800;color:#FFD166;line-height:1.3;}
#gmToast .ts{font-size:11px;font-weight:700;color:rgba(255,255,255,.75);line-height:1.35;}
/* ── 統合バッチセレモニー（複数達成の一括表示） ── */
.gm-batch-list{display:flex;flex-direction:column;gap:6px;margin:12px auto 8px;max-width:min(90vw,420px);max-height:48vh;overflow-y:auto;padding:2px 4px;-webkit-overflow-scrolling:touch;}
.gm-batch-row{display:flex;align-items:center;gap:10px;background:rgba(var(--glass-rgb),.14);border:1px solid rgba(255,209,102,.35);border-radius:10px;padding:7px 12px;text-align:left;animation:gmCerIn .4s cubic-bezier(.2,1.2,.3,1) both;}
.gm-batch-ic{font-size:22px;line-height:1;flex-shrink:0;}
.gm-batch-info{flex:1;min-width:0;}
.gm-batch-tt{font-size:12.5px;font-weight:800;color:#FFD166;line-height:1.3;}
.gm-batch-sub{font-size:11px;font-weight:700;color:rgba(255,255,255,.82);line-height:1.3;margin-top:1px;}
/* ── ACHIEVEMENTS（統合セレモニー）の意匠はUIテーマ8種ぶん（2026-09-25） ──
   カードの骨格は共通で、色・地模様・縁・書体だけをテーマが変数で差し替える。
   縁は padding-box / border-box の2枚重ね（グラデーションの縁）。
   ::before＝地模様（テーマ固有）／::after＝一度だけ走る光沢。⚠️ infinite を置かない（数秒で消える画面）。
   ⚠️ 意匠のために変数を足すときは --ach- 接頭辞（vars.css のトークンを継承で拾わないため）。 */
.gm-cer.gm-ach{animation:none;}
.gm-cer.gm-ach.out{animation:gmCerOut .4s ease both;}
.gm-ach-card{--ach-bg:linear-gradient(155deg,#1A1440,#0B1830 75%);--ach-edge:linear-gradient(120deg,#7CFFCB,#8A7CFF 50%,#FF8AD8);
  --ach-ink:#EEF2FF;--ach-acc:#D9CCFF;--ach-acc2:#8FF5D6;--ach-sub:rgba(226,232,255,.74);
  --ach-title:linear-gradient(90deg,#9BFFE0,#B9A6FF 50%,#FFB3E6);--ach-glow:0 0 18px rgba(170,150,255,.55);
  --ach-row:rgba(255,255,255,.06);--ach-row-edge:rgba(185,166,255,.28);--ach-ic-bg:rgba(155,255,224,.1);
  --ach-em-bg:radial-gradient(circle at 35% 30%,#3B2F7A,#140F33 75%);--ach-em-sh:0 0 0 2px rgba(185,166,255,.8),0 0 24px rgba(155,255,224,.45);
  --ach-rule:linear-gradient(90deg,transparent,#9BFFE0 30%,#FFB3E6 70%,transparent);--ach-sheen:rgba(255,255,255,.16);
  position:relative;isolation:isolate;width:min(92vw,440px);box-sizing:border-box;margin:0 auto;padding:26px 20px 14px;
  border-radius:var(--ach-r,22px);overflow:hidden;text-align:center;color:var(--ach-ink);font-family:var(--ach-font,inherit);
  background:var(--ach-bg) padding-box,var(--ach-edge) border-box;border:var(--ach-bw,1.5px) solid transparent;
  box-shadow:var(--ach-shadow,0 24px 60px rgba(0,0,0,.55),0 0 40px rgba(140,120,255,.25));
  animation:gmAchIn .6s cubic-bezier(.2,1.25,.3,1) both;}
.gm-ach-card::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(70% 55% at 12% 0%,rgba(124,255,203,.28),transparent 70%),radial-gradient(60% 60% at 95% 8%,rgba(160,120,255,.32),transparent 70%),radial-gradient(80% 50% at 50% 110%,rgba(255,138,216,.18),transparent 70%);}
.gm-ach-card::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 40%,var(--ach-sheen) 50%,transparent 60%) 0 0/250% 100% no-repeat;
  animation:gmAchSheen 1.6s .35s ease-out both;}
.gm-ach-emblem{position:relative;width:64px;height:64px;margin:0 auto 10px;display:grid;place-items:center;border-radius:var(--ach-er,50%);
  font-size:30px;line-height:1;background:var(--ach-em-bg);box-shadow:var(--ach-em-sh);color:var(--ach-acc);
  animation:gmAchEmblem .8s .08s cubic-bezier(.3,1.6,.5,1) both;}
.gm-ach-emblem::after{content:'';position:absolute;inset:-4px;border-radius:inherit;border:2px solid var(--ach-acc2);opacity:0;animation:gmAchRing 1.1s .45s ease-out both;}
.gm-ach-emblem span{display:inline-block;}
.gm-ach-kicker{font-size:10px;font-weight:800;letter-spacing:.34em;color:var(--ach-acc2);animation:gmAchFade .5s .2s both;}
.gm-ach-title{margin:4px 0 0;font-size:clamp(21px,7.2vw,34px);white-space:nowrap;font-weight:900;letter-spacing:var(--ach-ls,.05em);line-height:1.15;
  color:transparent;background:var(--ach-title);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(var(--ach-glow));
  animation:gmAchTitle .7s .15s cubic-bezier(.2,1.2,.3,1) both;}
.gm-ach-rule{height:1px;width:72%;margin:11px auto 8px;background:var(--ach-rule);animation:gmAchRule .6s .35s ease-out both;}
.gm-ach-count{font-size:12px;font-weight:800;color:var(--ach-sub);animation:gmAchFade .5s .4s both;}
.gm-ach-count b{font-size:16px;color:var(--ach-acc);margin:0 2px;font-variant-numeric:tabular-nums;}
.gm-ach-list{display:flex;flex-direction:column;gap:7px;margin:12px 0 4px;max-height:44vh;overflow-y:auto;-webkit-overflow-scrolling:touch;text-align:left;padding:2px;}
.gm-ach-row{position:relative;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 10px;border-radius:var(--ach-rr,12px);
  background:var(--ach-row);border:1px solid var(--ach-row-edge);animation:gmAchRow .45s calc(.45s + var(--i,0) * .09s) cubic-bezier(.2,1.2,.3,1) both;}
.gm-ach-no{flex-shrink:0;width:18px;font-size:10px;font-weight:900;font-variant-numeric:tabular-nums;color:var(--ach-acc2);opacity:.8;}
.gm-ach-ic{flex-shrink:0;width:34px;height:34px;display:grid;place-items:center;font-size:20px;line-height:1;border-radius:var(--ach-ir,10px);background:var(--ach-ic-bg);}
.gm-ach-info{flex:1;min-width:0;}
.gm-ach-tt{font-size:13px;font-weight:800;color:var(--ach-acc);line-height:1.3;}
.gm-ach-sub{font-size:11px;font-weight:700;color:var(--ach-sub);line-height:1.35;margin-top:1px;}
.gm-ach-note{margin-top:8px;font-size:10.5px;font-weight:700;letter-spacing:.12em;color:var(--ach-sub);opacity:.75;animation:gmAchFade .5s 1s both;}
@keyframes gmAchIn{0%{opacity:0;scale:.7;translate:0 30px}60%{opacity:1;scale:1.03}100%{opacity:1;scale:1;translate:0 0}}
@keyframes gmAchSheen{from{background-position:130% 0}to{background-position:-30% 0}}
@keyframes gmAchEmblem{0%{opacity:0;scale:2.2;rotate:-25deg}70%{opacity:1;scale:.92;rotate:4deg}100%{opacity:1;scale:1;rotate:0deg}}
@keyframes gmAchRing{0%{opacity:.9;scale:.8}100%{opacity:0;scale:1.9}}
@keyframes gmAchTitle{0%{opacity:0;letter-spacing:.6em}100%{opacity:1}}
@keyframes gmAchRule{from{scale:0 1}to{scale:1 1}}
@keyframes gmAchFade{from{opacity:0}to{opacity:1}}
@keyframes gmAchRow{from{opacity:0;translate:-14px 0}to{opacity:1;translate:0 0}}
/* Brass — ギヨシェ彫りの真鍮銘板・四隅のビス */
html.ui-brass .gm-ach-card{--ach-bg:linear-gradient(165deg,#3A2A14,#1C140A 72%);--ach-edge:linear-gradient(180deg,#F6DE92,#9C7424 45%,#E9C46E 70%,#6B4E16);
  --ach-ink:#F6E7C1;--ach-acc:#F3D27A;--ach-acc2:#D9A441;--ach-sub:rgba(246,231,193,.72);--ach-font:Georgia,"Times New Roman","Hiragino Mincho ProN","BIZ UDPMincho",serif;
  --ach-title:linear-gradient(180deg,#FFF6D2,#EBC15A 55%,#9C6B1E);--ach-glow:0 2px 0 rgba(0,0,0,.6);--ach-ls:.28em;--ach-r:10px;--ach-bw:3px;--ach-rr:5px;--ach-ir:50%;
  --ach-row:rgba(0,0,0,.28);--ach-row-edge:rgba(232,196,110,.35);--ach-ic-bg:radial-gradient(circle at 35% 30%,#6B5324,#2A1F0C);
  --ach-em-bg:radial-gradient(circle at 35% 30%,#F3D98B,#9C7424 60%,#4A3610);--ach-em-sh:0 0 0 2px #2A1F0C,0 0 0 4px #D9A441,0 6px 18px rgba(0,0,0,.6);
  --ach-rule:linear-gradient(90deg,transparent,#D9A441 20%,#FFF1C0 50%,#D9A441 80%,transparent);--ach-sheen:rgba(255,236,180,.22);
  --ach-shadow:inset 0 0 0 1px rgba(0,0,0,.6),0 24px 60px rgba(0,0,0,.6),0 0 30px rgba(217,164,65,.3);}
html.ui-brass .gm-ach-card::before{background:
  radial-gradient(circle at 12px 12px,#F3D98B 0 3px,#6B4E16 3.5px 4.5px,transparent 5px),radial-gradient(circle at calc(100% - 12px) 12px,#F3D98B 0 3px,#6B4E16 3.5px 4.5px,transparent 5px),
  radial-gradient(circle at 12px calc(100% - 12px),#F3D98B 0 3px,#6B4E16 3.5px 4.5px,transparent 5px),radial-gradient(circle at calc(100% - 12px) calc(100% - 12px),#F3D98B 0 3px,#6B4E16 3.5px 4.5px,transparent 5px),
  repeating-radial-gradient(circle at 50% 18%,rgba(243,217,139,.07) 0 1px,transparent 1px 7px),
  repeating-conic-gradient(from 0deg at 50% 18%,rgba(243,217,139,.05) 0 3deg,transparent 3deg 9deg);}
html.ui-brass .gm-ach-emblem span{color:#2A1F0C;text-shadow:0 1px 0 rgba(255,240,190,.6);font-size:32px;}
/* Cyber — 角を落とした戦術HUD・走査線 */
html.ui-cyber .gm-cer.gm-ach{filter:drop-shadow(0 0 18px rgba(0,240,255,.35));}
html.ui-cyber .gm-ach-card{--ach-bg:linear-gradient(180deg,#060B18,#03050C);--ach-edge:linear-gradient(90deg,#00F0FF,#7A5CFF 50%,#FF2E88);
  --ach-ink:#D8F6FF;--ach-acc:#5CF6FF;--ach-acc2:#FF4FA3;--ach-sub:rgba(180,230,255,.72);--ach-font:"SFMono-Regular",Menlo,Consolas,monospace;
  --ach-title:linear-gradient(90deg,#00F0FF,#FF2E88);--ach-glow:0 0 10px rgba(0,240,255,.7);--ach-ls:.08em;--ach-r:0;--ach-rr:0;--ach-ir:0;--ach-er:6px;
  --ach-row:linear-gradient(90deg,rgba(0,240,255,.1),rgba(0,240,255,.02));--ach-row-edge:#00F0FF;--ach-ic-bg:rgba(255,46,136,.12);
  --ach-em-bg:linear-gradient(135deg,#0A1A2E,#140726);--ach-em-sh:0 0 0 1px #00F0FF,0 0 18px rgba(0,240,255,.6),inset 0 0 12px rgba(255,46,136,.35);
  --ach-rule:linear-gradient(90deg,#00F0FF,transparent 45%,transparent 55%,#FF2E88);--ach-sheen:rgba(0,240,255,.18);
  clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);}
html.ui-cyber .gm-ach-card::before{background:repeating-linear-gradient(0deg,rgba(0,240,255,.05) 0 1px,transparent 1px 3px),
  linear-gradient(rgba(0,240,255,.07) 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,rgba(0,240,255,.07) 1px,transparent 1px) 0 0/22px 22px;}
html.ui-cyber .gm-ach-emblem{rotate:45deg;width:50px;height:50px;margin-top:4px;margin-bottom:18px;}
html.ui-cyber .gm-ach-emblem span{rotate:-45deg;font-size:22px;color:#FF4FA3;text-shadow:0 0 10px #FF2E88;}
html.ui-cyber .gm-ach-row{border-width:0 0 0 3px;}
html.ui-cyber .gm-ach-no{width:30px;}
html.ui-cyber .gm-ach-no::before{content:'0x';opacity:.6;}
/* Liquid — ラバランプのガラス・浮かぶ気泡 */
html.ui-liquid .gm-ach-card{--ach-bg:linear-gradient(165deg,rgba(46,14,78,.96),rgba(12,38,82,.96));--ach-edge:linear-gradient(140deg,rgba(255,255,255,.75),rgba(255,160,120,.5) 40%,rgba(120,210,255,.65));
  --ach-ink:#FFF3FA;--ach-acc:#FFD6E8;--ach-acc2:#8DE3FF;--ach-sub:rgba(255,236,246,.74);--ach-font:"Avenir Next",-apple-system,sans-serif;
  --ach-title:linear-gradient(90deg,#FFB36B,#FF5FA2 50%,#7CD8FF);--ach-glow:0 0 16px rgba(255,95,162,.5);--ach-r:32px;--ach-rr:20px;--ach-ir:50%;
  --ach-row:rgba(255,255,255,.08);--ach-row-edge:rgba(255,255,255,.2);--ach-ic-bg:radial-gradient(circle at 30% 30%,rgba(255,255,255,.45),rgba(255,255,255,.06) 55%);
  --ach-em-bg:radial-gradient(circle at 30% 28%,rgba(255,255,255,.75),rgba(255,255,255,.12) 38%,rgba(255,95,162,.25) 70%);--ach-em-sh:0 0 0 1px rgba(255,255,255,.5),0 0 30px rgba(255,120,180,.5);
  --ach-rule:linear-gradient(90deg,transparent,#FFB36B,#FF5FA2,#7CD8FF,transparent);}
html.ui-liquid .gm-ach-card::before{filter:blur(22px);background:radial-gradient(40% 32% at 18% 22%,rgba(255,120,80,.6),transparent 70%),radial-gradient(38% 34% at 85% 30%,rgba(255,70,160,.55),transparent 70%),radial-gradient(45% 36% at 55% 95%,rgba(80,190,255,.55),transparent 70%);}
html.ui-liquid .gm-ach-emblem::before{content:'';position:absolute;width:9px;height:9px;left:-12px;top:42px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:66px -32px 0 -2px rgba(255,255,255,.3),74px 8px 0 -3px rgba(255,255,255,.25);}
/* Kintsugi — 漆黒の器を走る金の継ぎ目 */
html.ui-kintsugi .gm-ach-card{--ach-bg:radial-gradient(120% 80% at 50% 0%,#221B17,#0B0908 70%);--ach-edge:linear-gradient(135deg,#8A6420,#E9C46A 30%,#6B4E16 60%,#D4A93B);
  --ach-ink:#F3E9D2;--ach-acc:#EBCB7A;--ach-acc2:#C39A42;--ach-sub:rgba(243,233,210,.66);--ach-font:"Hiragino Mincho ProN","BIZ UDPMincho","Yu Mincho",Georgia,serif;
  --ach-title:linear-gradient(180deg,#FFF1C1,#D4A93B 55%,#8A6420);--ach-glow:0 0 12px rgba(212,169,59,.45);--ach-ls:.45em;--ach-r:6px;--ach-rr:3px;--ach-ir:50%;--ach-bw:1px;
  --ach-row:transparent;--ach-row-edge:rgba(201,162,74,.26);--ach-ic-bg:radial-gradient(circle,#1A1512,#0B0908);
  --ach-em-bg:radial-gradient(circle at 40% 35%,#2A221D,#0B0908 70%);--ach-em-sh:0 0 0 1px #D4A93B,0 0 0 5px rgba(11,9,8,.9),0 0 0 6px rgba(212,169,59,.45);
  --ach-rule:linear-gradient(90deg,transparent,#D4A93B 25%,transparent 45%,#D4A93B 60%,transparent);--ach-sheen:rgba(255,226,150,.12);}
html.ui-kintsugi .gm-ach-card::before{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 440 520' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23D4A93B' stroke-linecap='round' stroke-linejoin='round' opacity='.38'%3E%3Cpath d='M0 92 L58 110 L96 96 L150 140 L188 128 L232 170' stroke-width='1.6'/%3E%3Cpath d='M440 300 L392 318 L360 296 L318 344 L276 352 L250 404 L214 420' stroke-width='1.4'/%3E%3Cpath d='M96 96 L104 60 L128 34' stroke-width='1'/%3E%3Cpath d='M318 344 L338 392 L330 440 L352 520' stroke-width='1.1'/%3E%3C/g%3E%3C/svg%3E") 0 0/100% 100% no-repeat;}
html.ui-kintsugi .gm-ach-emblem span{font-size:28px;font-weight:700;color:transparent;background:linear-gradient(180deg,#FFF1C1,#D4A93B 60%,#8A6420);-webkit-background-clip:text;background-clip:text;}
html.ui-kintsugi .gm-ach-row{border-width:0 0 1px;}
/* Celestial — 星図と金の菱星 */
html.ui-celestial .gm-ach-card{--ach-bg:radial-gradient(130% 90% at 50% 0%,#1E2760,#070A1F 72%);--ach-edge:linear-gradient(180deg,#F5DC96,#8C7440 50%,#F5DC96);
  --ach-ink:#EEF0FF;--ach-acc:#F2D58B;--ach-acc2:#B3C1FF;--ach-sub:rgba(220,226,255,.72);--ach-font:"Cinzel",Georgia,"Hiragino Mincho ProN",serif;
  --ach-title:linear-gradient(180deg,#FFF8DE,#E9C46A 70%,#B08B3C);--ach-glow:0 0 14px rgba(233,196,106,.55);--ach-ls:.1em;--ach-r:18px;--ach-rr:10px;
  --ach-row:rgba(169,184,255,.07);--ach-row-edge:rgba(233,196,106,.28);--ach-ic-bg:radial-gradient(circle,rgba(233,196,106,.18),transparent 70%);
  --ach-em-bg:radial-gradient(circle at 50% 45%,#2A3478,#0B0F2E 70%);--ach-em-sh:0 0 0 1px rgba(242,213,139,.8),0 0 0 7px rgba(11,15,46,.8),0 0 0 8px rgba(242,213,139,.35),0 0 28px rgba(169,184,255,.45);
  --ach-rule:linear-gradient(90deg,transparent,#E9C46A 40%,#FFF8DE 50%,#E9C46A 60%,transparent);--ach-sheen:rgba(255,248,222,.14);}
html.ui-celestial .gm-ach-card::before{background:
  radial-gradient(1.2px 1.2px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 72%,#fff,transparent),radial-gradient(1.4px 1.4px at 44% 10%,#FFF3C4,transparent),
  radial-gradient(1px 1px at 63% 58%,#fff,transparent),radial-gradient(1.3px 1.3px at 82% 24%,#fff,transparent),radial-gradient(1px 1px at 91% 80%,#FFF3C4,transparent),
  radial-gradient(1px 1px at 7% 88%,#fff,transparent),radial-gradient(1.2px 1.2px at 55% 92%,#fff,transparent),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 440 520' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23A9B8FF' stroke-width='.8' opacity='.35'%3E%3Cpath d='M30 60 L110 40 L150 90 L230 70'/%3E%3Cpath d='M320 470 L370 420 L420 440'/%3E%3Ccircle cx='220' cy='130' r='120' stroke-dasharray='2 6'/%3E%3C/g%3E%3C/svg%3E") 0 0/100% 100% no-repeat;}
html.ui-celestial .gm-ach-emblem span{font-size:30px;color:#F2D58B;text-shadow:0 0 14px rgba(242,213,139,.9);}
/* Abyss — 耐圧殻とソナー */
html.ui-abyss .gm-ach-card{--ach-bg:linear-gradient(180deg,#05303B,#021018 70%);--ach-edge:linear-gradient(180deg,#34F5C5,#0B5563 50%,#0E3A45);
  --ach-ink:#DDFBFF;--ach-acc:#8FFFE8;--ach-acc2:#3FD2E8;--ach-sub:rgba(200,240,248,.7);
  --ach-title:linear-gradient(180deg,#C9FFF4,#34F5C5 50%,#00A8C6);--ach-glow:0 0 16px rgba(52,245,197,.5);--ach-ls:.12em;--ach-r:26px;--ach-bw:2px;--ach-rr:14px;--ach-ir:50%;
  --ach-row:rgba(52,245,197,.06);--ach-row-edge:rgba(52,245,197,.22);--ach-ic-bg:radial-gradient(circle,rgba(46,200,224,.2),transparent 70%);
  --ach-em-bg:radial-gradient(circle at 50% 50%,#0B4A57,#021018 70%);--ach-em-sh:0 0 0 2px #0E3A45,0 0 0 4px rgba(52,245,197,.6),0 0 30px rgba(52,245,197,.45);
  --ach-rule:linear-gradient(90deg,transparent,#34F5C5 50%,transparent);--ach-sheen:rgba(127,255,228,.14);
  --ach-shadow:inset 0 0 40px rgba(0,0,0,.6),0 24px 60px rgba(0,0,0,.6),0 0 36px rgba(52,245,197,.22);}
html.ui-abyss .gm-ach-card::before{background:repeating-radial-gradient(circle at 50% 58px,rgba(52,245,197,.10) 0 1px,transparent 1px 26px),
  radial-gradient(1.5px 1.5px at 18% 80%,rgba(200,255,245,.6),transparent),radial-gradient(2px 2px at 84% 66%,rgba(200,255,245,.5),transparent),radial-gradient(1.2px 1.2px at 70% 90%,rgba(200,255,245,.5),transparent);}
html.ui-abyss .gm-ach-emblem::before{content:'';position:absolute;inset:-60px;border-radius:50%;pointer-events:none;
  background:conic-gradient(from 0deg,rgba(52,245,197,.45),transparent 22%);-webkit-mask:radial-gradient(circle,#000 30%,transparent 70%);mask:radial-gradient(circle,#000 30%,transparent 70%);
  animation:gmAchSonar 1.8s .3s ease-out both;}
@keyframes gmAchSonar{0%{opacity:0;rotate:0deg}20%{opacity:1}100%{opacity:0;rotate:360deg}}
/* Frost — 六花の氷結板（明るい面） */
html.ui-frost .gm-ach-card{--ach-bg:linear-gradient(165deg,#F4FAFF,#D6EBFB 60%,#C3E0F7);--ach-edge:linear-gradient(135deg,#FFFFFF,#8EC9F2 50%,#FFFFFF);
  --ach-ink:#12304F;--ach-acc:#17497F;--ach-acc2:#2F7FC0;--ach-sub:#40627F;--ach-font:"SF Pro Display",-apple-system,"Segoe UI",sans-serif;
  --ach-title:linear-gradient(180deg,#2C73B8,#123E6E);--ach-glow:0 1px 0 rgba(255,255,255,.9);--ach-ls:.12em;--ach-r:20px;--ach-bw:2px;--ach-rr:12px;
  --ach-row:rgba(255,255,255,.62);--ach-row-edge:rgba(99,170,230,.38);--ach-ic-bg:linear-gradient(160deg,#FFFFFF,#DCEEFC);
  --ach-em-bg:radial-gradient(circle at 35% 30%,#FFFFFF,#CFE7FA 65%,#A7D2F2);--ach-em-sh:0 0 0 2px #FFFFFF,0 0 0 4px rgba(99,170,230,.55),0 8px 22px rgba(40,100,160,.3);
  --ach-rule:linear-gradient(90deg,transparent,#8EC9F2 30%,#3F8FD0 50%,#8EC9F2 70%,transparent);--ach-sheen:rgba(255,255,255,.75);
  --ach-shadow:inset 0 1px 0 #fff,0 24px 60px rgba(8,30,60,.45),0 0 40px rgba(170,215,250,.55);}
html.ui-frost .gm-ach-card::before{opacity:.5;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Cg stroke='%238EC9F2' stroke-width='1' fill='none' stroke-linecap='round'%3E%3Cpath d='M30 12v36M14.4 21l31.2 18M14.4 39l31.2-18'/%3E%3Cpath d='M30 18l-4-4M30 18l4-4M30 42l-4 4M30 42l4 4'/%3E%3C/g%3E%3C/svg%3E") 0 0/60px 60px;}
html.ui-frost .gm-ach-emblem span{filter:drop-shadow(0 1px 0 #fff);}
/* ── セレモニー（レベルアップ・章/科目制覇・ミッション） ── */
#gmCerOv{position:fixed;top:0;left:0;right:0;height:100vh;height:100dvh;z-index:var(--z-gm-cer,9550);display:none;align-items:center;justify-content:center;background:rgba(var(--ov-rgb),.55);pointer-events:none;}
#gmCerOv.show{display:flex;pointer-events:auto;cursor:pointer;}
.gm-cer{text-align:center;animation:gmCerIn .55s cubic-bezier(.2,1.4,.3,1) both;}
@keyframes gmCerIn{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.gm-cer.out{animation:gmCerOut .4s ease both;}
@keyframes gmCerOut{to{transform:scale(1.15);opacity:0}}
.gm-cer-ic{font-size:64px;line-height:1;animation:gmCerFloat 1.6s ease-in-out infinite;}
@keyframes gmCerFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.gm-cer-big{font-size:30px;font-weight:900;letter-spacing:2px;color:#FFD166;text-shadow:0 0 24px rgba(255,209,102,.9),0 2px 8px rgba(0,0,0,.6);margin-top:6px;}
.gm-cer-sub{font-size:15px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.7);margin-top:6px;}
.gm-cer-note{font-size:12px;font-weight:700;color:rgba(255,255,255,.8);text-shadow:0 2px 8px rgba(0,0,0,.7);margin-top:4px;}
.gm-cer-medal{display:inline-block;}
.gm-cer-medal.g3{filter:drop-shadow(0 0 22px rgba(255,209,102,.95));animation:gmMedalIn .7s cubic-bezier(.3,1.6,.5,1) both,gmCerFloat 1.6s .7s ease-in-out infinite;}
.gm-cer-medal.g2,.gm-cer-medal.g1{filter:drop-shadow(0 0 16px rgba(255,255,255,.6));animation:gmMedalIn .7s cubic-bezier(.3,1.6,.5,1) both,gmCerFloat 1.6s .7s ease-in-out infinite;}
@keyframes gmMedalIn{0%{transform:scale(3) rotate(-30deg);opacity:0}70%{transform:scale(.9) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gm-cer-crown{font-size:42px;line-height:1;margin-bottom:-6px;filter:drop-shadow(0 0 18px rgba(255,209,102,.95));animation:gmCrownDrop .8s cubic-bezier(.3,1.5,.5,1) both;}
@keyframes gmCrownDrop{0%{transform:translateY(-120px) rotate(-20deg);opacity:0}100%{transform:none;opacity:1}}
.gm-cer-stars{font-size:22px;letter-spacing:4px;color:#FFD166;text-shadow:0 0 16px rgba(255,209,102,.8);margin-top:4px;}
/* ── 位置表示（あと何件来るか）── 併合キューが正本。総数<2 のときは出ない */
.gm-ann-pos{display:flex;align-items:center;justify-content:center;gap:5px;}
/* ⚠️ セレモニーの位置表示は画面下部へ固定する。.gm-cer の直下（＝画面中央付近）に置くと
   授与トレイの見出しに重なる（2026-08-20に実機で確認して移した）。 */
#gmCerOv > .gm-ann-pos{position:absolute;left:0;right:0;bottom:26px;bottom:max(26px,calc(env(safe-area-inset-bottom) + 14px));}
.gm-ann-pos i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.26);}
.gm-ann-pos i.on{background:#FFD166;box-shadow:0 0 8px rgba(255,209,102,.85);}
.gm-ann-pos span{font-size:11px;font-weight:800;color:rgba(255,255,255,.72);letter-spacing:1px;margin-left:3px;text-shadow:0 2px 8px rgba(0,0,0,.7);}
#gmToast .tp{display:flex;align-items:center;}
#gmToast .tp .gm-ann-pos{margin:0 0 0 2px;}
#gmToast .tp span{font-size:10px;margin-left:0;}
/* ── 授与トレイ（結果画面の #gmTrayMount にだけ描かれる）── */
.gm-tray{margin:12px 0 2px;border:1px solid rgba(255,209,102,.28);border-radius:12px;background:linear-gradient(160deg,rgba(255,209,102,.10),rgba(255,255,255,.03));padding:9px 10px;text-align:left;}
.gm-tray-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;}
.gm-tray-ttl{font-size:12px;font-weight:900;color:#FFD166;letter-spacing:.5px;}
.gm-tray-cnt{font-size:11px;font-weight:800;color:rgba(255,255,255,.62);}
.gm-tray-skip{margin-left:auto;padding:4px 10px;border-radius:8px;border:1px solid rgba(255,209,102,.45);background:rgba(255,209,102,.10);color:#FFD166;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;}
.gm-tray-row{display:flex;align-items:center;gap:8px;padding:4px 2px;opacity:.34;transition:opacity .35s ease;}
.gm-tray-row .mk{font-size:10px;width:15px;text-align:center;flex:none;}
.gm-tray-row .ic{font-size:17px;line-height:1;flex:none;filter:grayscale(1);transition:filter .35s ease;}
.gm-tray-row .tx{font-size:12px;font-weight:800;color:rgba(255,255,255,.9);line-height:1.35;}
.gm-tray-row.is-done,.gm-tray-row.is-play{opacity:1;}
.gm-tray-row.is-done .ic,.gm-tray-row.is-play .ic{filter:none;}
.gm-tray-row.is-play{animation:gmTrayPulse 1.1s ease-in-out infinite;}
@keyframes gmTrayPulse{0%,100%{opacity:1}50%{opacity:.6}}
@media (prefers-reduced-motion: reduce){.gm-tray-row.is-play{animation:none;}}
/* ── 章仕切りの星 ── */
.gm-ch-stars{float:right;margin-right:8px;font-size:11px;font-weight:800;color:#FFD166;text-shadow:0 0 6px rgba(255,209,102,.5);letter-spacing:1px;}
.gm-ch-stars .off{color:rgba(255,255,255,.18);text-shadow:none;}
/* E5(2026-08-14): 星が増えた瞬間だけ光る。章の評価が上がったことは今まで無言だった */
.gm-ch-stars.gm-star-gain{animation:gmStarGain .9s cubic-bezier(.2,1.2,.3,1);}
@keyframes gmStarGain{
  0%{transform:scale(1);text-shadow:0 0 6px rgba(255,209,102,.5);}
  35%{transform:scale(1.45);text-shadow:0 0 20px rgba(255,209,102,1),0 0 40px rgba(255,209,102,.6);}
  60%{transform:scale(.96);}
  100%{transform:scale(1);text-shadow:0 0 6px rgba(255,209,102,.5);}
}
/* ── 済ボタンのマイクロ演出 ── */
@keyframes gmPop{0%{transform:scale(1)}40%{transform:scale(1.35) rotate(-4deg)}70%{transform:scale(.92)}100%{transform:scale(1)}}
.gm-pop{animation:gmPop .45s cubic-bezier(.2,1.2,.3,1);}
@keyframes gmFlagWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-16deg) scale(1.25)}60%{transform:rotate(12deg) scale(1.15)}}
.gm-flag-wiggle{animation:gmFlagWiggle .5s ease;}
`;

  function _injectCss() {
    if (document.getElementById('gamifyCss')) return;
    const st = document.createElement('style');
    st.id = 'gamifyCss';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ── 授与トレイと再生キュー（2026-08-20・Phase 6） ─────────────────────
     ⚠️ 試験モード中はトーストもセレモニーも「出さずに溜める」。理由は2つ:
       ① 全画面セレモニー(2.4秒)は tier 演出の真上に被る。_microLapFx / _lapMilestoneFx は
          先頭で examMode を見て黙るのに、一番大きいこれだけが素通しだった。
       ② トーストは top:14px 固定＝iPad では約180pxある試験ヘッダ(.st-hdr)の裏に出る。
          出しても読めないので、出さずに取っておく方が情報が残る。
     溜めたものは結果画面で順に再生する。再生の開始は examMode 解除の直後ではなく
     _quiet() が置く静粛時間の後——showExamSummary はランクスタンプ(950ms)と祝賀花火(980ms)を
     自前で走らせるので、その上に重ねると両方読めなくなる。静粛時間は onExamFinish が置く
     （結果画面の末尾で必ず1回呼ばれる＝セッションの終わりを知る唯一の確実な合図）。

     ⚠️⚠️ セレモニーとトーストは **1本の列（_annQ）** で持つこと。以前は _cerQ と _toastQ が
        並行に流れており、そのせいで (a) 全画面セレモニーの真上にトーストが出て両方読めない
        (b)「あと何件」を数えられない、の2つが同時に起きていた。位置表示（3 / 4）が意味を
        持つ前提条件がこの併合なので、見た目や速さのために2列へ戻さないこと。

     授与トレイ（#gmTrayMount）は「これから何件来るか」を先に見せる目次で、セレモニーはその本編。
     ⚠️ 総数は **結果画面が開いた時点で確定している**（_bumpMission → _afterEvent はすべて同期
        呼び出しなので、onExamFinish が返った時点でキューは完成している）。だから onExamFinish の
        末尾で1度描けば、あとから行が増えて表がガタつくことがない。 */
  const CER_SETTLE_MS = 2000;   // 結果画面の祝賀演出が終わるまでの待ち
  const CER_GAP_MS = 280;       // セレモニーを続けて出すときの間（詰めると1つの演出に見える）
  const ANN_FADE_MS = 420;      // 退場アニメ
  const ANN_TOAST_MS = 3000;    // トーストの表示時間
  const ANN_TAP_GUARD_MS = 350; // 出た直後のタップは無視する（入場中の指は結果画面へ向いた指）
  const ANN_SKIP_STEP_MS = 60;  // 「まとめて受け取る」で行を点灯させる間隔
  const ANN_DOTS_MAX = 8;       // これを超えたら丸を出さず数字だけにする
  let _quietUntil = 0;
  let _holdTimer = null;

  function _fxHeld() {
    if (typeof examMode !== 'undefined' && examMode) return true;
    return Date.now() < _quietUntil;
  }
  function _quiet(ms) { _quietUntil = Math.max(_quietUntil, Date.now() + ms); }
  // 溜まっている間だけ解除を待つタイマーを1本持つ（解除されたら自分で止まる）
  function _armHold() {
    if (_holdTimer) return;
    _holdTimer = setInterval(() => {
      if (_fxHeld()) return;
      clearInterval(_holdTimer); _holdTimer = null;
      _drain();
    }, 400);
  }
  // 保留を解いて今すぐ再生する（テスト・手動用）
  function flushCeremonies() {
    _quietUntil = 0;
    if (_holdTimer) { clearInterval(_holdTimer); _holdTimer = null; }
    _drain();
  }

  // ── 併合キュー ───────────────────────────────────────────────────
  const _annQ = [];      // 未再生（先頭が次に出る）
  const _annDone = [];   // 再生済み（トレイの点灯に使う）
  let _annCur = null;    // 再生中
  let _annTimers = [];   // 再生中アイテムのタイマー（スキップで畳む）
  let _annShownAt = 0;

  function _annTotal() {
    let n = 0;
    _annDone.forEach(x => { n += (x.kind === 'batch' && Array.isArray(x.items)) ? x.items.length : 1; });
    if (_annCur) n += (_annCur.kind === 'batch' && Array.isArray(_annCur.items)) ? _annCur.items.length : 1;
    _annQ.forEach(x => { n += (x.kind === 'batch' && Array.isArray(x.items)) ? x.items.length : 1; });
    return n;
  }
  function _annPos() {
    let n = 0;
    _annDone.forEach(x => { n += (x.kind === 'batch' && Array.isArray(x.items)) ? x.items.length : 1; });
    if (_annCur) n += (_annCur.kind === 'batch' && Array.isArray(_annCur.items)) ? _annCur.items.length : 1;
    return n;
  }

  function _annPush(item) {
    // 前の一群を出し切った後の新しい発火＝新しい一群。トレイを畳んでから積む。
    if (!_annCur && !_annQ.length && _annDone.length) _annDone.length = 0;
    _annQ.push(item);
    _renderTray();
    _drain();
  }

  // opts.icon / opts.label … 授与トレイの行に出す見出し（省略時は gm-cer-big から拾う）
  function ceremony(html, opts) {
    const o = opts || {};
    _annPush({ kind: 'cer', html: html, opts: o, icon: o.icon || '🎉', label: o.label || '' });
  }
  // snd … 表示の瞬間に鳴らす音（保留されたトーストは再生時に鳴る＝音と絵がずれない）
  // label … トレイの行に出す文字（'ミッション達成！' のような汎用タイトルの代わりを渡す）
  function toast(icon, title, sub, snd, label) {
    _annPush({ kind: 'toast', icon: icon, title: title, sub: sub, snd: snd, label: label || title });
  }

  function _drain() {
    if (_annCur || !_annQ.length) return;
    if (_fxHeld()) { _armHold(); return; }
    // reduced-motion: トレイが見えているならそこへ全部載せて終わる（演出を出さずに情報だけ残す）。
    // ⚠️ トレイが無い画面では従来どおり再生する——出さずに捨てると情報が丸ごと失われる。
    if (_reducedMotion() && _trayVisible()) { _annSkipAll(); return; }

    // 複数件たまっている場合（2件以上）は、1枚の統合セレモニーで一括表示する（重なり防止・待ち時間短縮）
    if (_annQ.length > 1) {
      const items = _annQ.splice(0, _annQ.length);
      const batchItem = {
        kind: 'batch',
        items: items,
        icon: '🎉',
        label: items.map(_annLabel).join(' ＆ '),
      };
      _annCur = batchItem;
      _annShownAt = Date.now();
      _annTimers = [];
      _renderTray();
      _playBatchCer(batchItem);
      return;
    }

    const item = _annQ.shift();
    _annCur = item;
    _annShownAt = Date.now();
    _annTimers = [];
    _renderTray();
    if (item.kind === 'cer') _playCer(item); else _playToast(item);
  }

  // ACHIEVEMENTS の文言と粒子はUIテーマごと（カードの意匠は CSS の html.ui-{id} .gm-ach-card）。
  // ⚠️ UIテーマを増やしたらここと CSS の両方に足すこと（無いテーマは aurora の意匠で出る）。
  const ACH_THEME = {
    aurora:    { kicker: 'PRISM RECORD',           title: 'ACHIEVEMENTS', em: '💎', cols: ['#9BFFE0', '#B9A6FF', '#FFB3E6', '#FFFFFF'], shapes: ['gem', 'star'] },
    brass:     { kicker: '— COMMENDATION —',       title: '功 績 録',      em: '⚙',  cols: ['#F3D98B', '#D9A441', '#9C7424', '#FFF1C0'], shapes: ['shard', 'square'], gears: true, matte: true },
    cyber:     { kicker: '> SYSTEM://ACHIEVEMENT', title: 'UNLOCKED',      em: '◆',  cols: ['#00F0FF', '#FF2E88', '#7A5CFF', '#FFFFFF'], shapes: ['square', 'plus'] },
    liquid:    { kicker: 'FLOW STATE',             title: 'ACHIEVEMENTS', em: '🫧', cols: ['#FFB36B', '#FF5FA2', '#7CD8FF', '#FFFFFF'], shapes: ['circle', 'blob'], rise: true },
    kintsugi:  { kicker: '金 継 ぎ の 記',          title: '功 績',        em: '継',  cols: ['#FFF1C1', '#D4A93B', '#8A6420'], shapes: ['shard'], matte: true },
    celestial: { kicker: '✦ CONSTELLATION ✦',      title: 'ACHIEVEMENTS', em: '✦',  cols: ['#FFF8DE', '#E9C46A', '#A9B8FF', '#FFFFFF'], shapes: ['star'], rings: '#E9C46A' },
    abyss:     { kicker: 'DEPTH LOG · SONAR',      title: 'DISCOVERIES',  em: '🔱', cols: ['#7FFFE4', '#34F5C5', '#2EC8E0', '#C9FFF4'], shapes: ['circle'], rise: true, rings: '#34F5C5' },
    frost:     { kicker: '六 花 · FROST SEAL',      title: 'ACHIEVEMENTS', em: '❄️', cols: ['#FFFFFF', '#CFE7FA', '#8EC9F2', '#3F8FD0'], shapes: ['shard', 'star'] },
  };
  function _achTheme() {
    const m = /\bui-([a-z]+)/.exec((document.documentElement && document.documentElement.className) || '');
    return (m && ACH_THEME[m[1]]) ? m[1] : 'aurora';
  }
  function _achFx(t) {
    const fx = window.MecFX;
    if (!fx || _reducedMotion()) return;
    const T = ACH_THEME[t];
    try {
      const x = innerWidth / 2, y = innerHeight * .3;
      if (T.gears && fx.gearRain) fx.gearRain({ count: 34 });
      else if (!T.rise && fx.confetti) fx.confetti({ count: 80, colors: T.cols, big: true });
      const o = { tier: 5, count: 70, colors: T.cols, shapes: T.shapes, additive: !T.matte };
      if (T.rise) { o.gravity = -260; o.upBias = 0; }   // 泡は上へ昇る
      fx.burst(x, y, o);
      if (T.rings && fx.rings) fx.rings(x, y, { count: 3, maxR: 320, color: T.rings, thickness: 2, additive: true, stagger: .16 });
      if (!T.rise && fx.fireworks) setTimeout(() => fx.fireworks({ count: 3, colors: T.cols, tier: 5 }), 450);
    } catch {}
  }

  function _playBatchCer(batch) {
    const items = batch.items || [];
    let ov = document.getElementById('gmCerOv');
    if (!ov) { ov = document.createElement('div'); ov.id = 'gmCerOv'; document.body.appendChild(ov); }

    const hasLv = items.some(x => (x.html || '').includes('LEVEL UP') || (x.label || '').includes('LEVEL UP'));
    const hasClear = items.some(x => (x.html || '').includes('制覇') || (x.label || '').includes('制覇') || (x.html || '').includes('MISSION COMPLETE'));
    const snd = hasLv ? SND.levelup : (hasClear ? SND.clear : SND.mission);
    const t = _achTheme(), T = ACH_THEME[t];

    const rowsHtml = items.map((it, i) => {
      const icon = it.icon || '🎖️';
      const label = _annLabel(it);
      const sub = it.sub || (it.opts && it.opts.label) || '';
      return '<div class="gm-ach-row" style="--i:' + i + '">' +
        '<span class="gm-ach-no">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="gm-ach-ic">' + _esc(icon) + '</span>' +
        '<div class="gm-ach-info">' +
          '<div class="gm-ach-tt">' + _esc(label) + '</div>' +
          (sub && sub !== label ? '<div class="gm-ach-sub">' + _esc(sub) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    // ⚠️ 見出しの下の「今回の獲得・達成（N件）」は授与トレイと同じ言葉（テストが見る）
    ov.innerHTML =
      '<div class="gm-cer gm-ach" data-ach="' + t + '"><div class="gm-ach-card">' +
        '<div class="gm-ach-emblem"><span>' + _esc(T.em) + '</span></div>' +
        '<div class="gm-ach-kicker">' + _esc(T.kicker) + '</div>' +
        '<div class="gm-ach-title">' + _esc(T.title) + '</div>' +
        '<div class="gm-ach-rule"></div>' +
        '<div class="gm-ach-count">今回の獲得・達成（<b>' + items.length + '</b>件）</div>' +
        '<div class="gm-ach-list">' + rowsHtml + '</div>' +
        '<div class="gm-ach-note">タップで閉じる</div>' +
      '</div></div>' + _annPosHtml(false);
    ov.classList.add('show');
    _annBindTap(ov);
    _achFx(t);
    try { snd && snd(); } catch {}

    // 行が多い日は読める時間を足す（4行目から1行 +0.35秒・上限 5.2秒）
    const dur = Math.min(5200, 3200 + Math.max(0, items.length - 3) * 350);
    _annTimers.push(setTimeout(() => {
      const c = ov.querySelector('.gm-cer');
      if (c) c.classList.add('out');
      _annTimers.push(setTimeout(() => { ov.classList.remove('show'); _annFinish(CER_GAP_MS); }, ANN_FADE_MS));
    }, dur));
  }

  function _playCer(item) {
    const opts = item.opts || {};
    let ov = document.getElementById('gmCerOv');
    if (!ov) { ov = document.createElement('div'); ov.id = 'gmCerOv'; document.body.appendChild(ov); }
    ov.innerHTML = '<div class="gm-cer">' + item.html + '</div>' + _annPosHtml(false);
    ov.classList.add('show');
    _annBindTap(ov);
    const dur = opts.dur || 2300;
    _annTimers.push(setTimeout(() => {
      const c = ov.querySelector('.gm-cer');
      if (c) c.classList.add('out');
      _annTimers.push(setTimeout(() => { ov.classList.remove('show'); _annFinish(CER_GAP_MS); }, ANN_FADE_MS));
    }, dur));
    try { opts.fx && opts.fx(); } catch {}
    try { opts.snd && opts.snd(); } catch {}
  }

  function _playToast(item) {
    let el = document.getElementById('gmToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gmToast';
      el.innerHTML = '<span class="ti"></span><span><div class="tt"></div><div class="ts"></div></span><span class="tp"></span>';
      document.body.appendChild(el);
    }
    el.querySelector('.ti').textContent = item.icon;
    el.querySelector('.tt').textContent = item.title;
    el.querySelector('.ts').textContent = item.sub || '';
    const tp = el.querySelector('.tp');
    if (tp) tp.innerHTML = _annPosHtml(true);
    // ⚠️ 非表示タブでは rAF が1フレームも来ない（ハブの _tweenNum・統計の countUp と同じ穴）。
    //    保険を置かないとトーストが一度も出ないまま寿命だけ尽きる。
    requestAnimationFrame(() => el.classList.add('show'));
    _annTimers.push(setTimeout(() => el.classList.add('show'), 60));
    _annBindTap(el);
    try { item.snd && item.snd(); } catch {}
    _annTimers.push(setTimeout(() => {
      el.classList.remove('show');
      _annTimers.push(setTimeout(() => _annFinish(0), ANN_FADE_MS));
    }, ANN_TOAST_MS));
  }

  function _annFinish(gap) {
    if (!_annCur) return;
    _annTimers.forEach(id => clearTimeout(id)); _annTimers = [];
    if (_annCur.kind === 'batch' && Array.isArray(_annCur.items)) {
      _annCur.items.forEach(it => _annDone.push(it));
    } else {
      _annDone.push(_annCur);
    }
    _annCur = null;
    _renderTray();
    if (!_annQ.length) return;
    if (gap > 0) setTimeout(_drain, gap); else _drain();
  }

  function _annHideAll() {
    const ov = document.getElementById('gmCerOv'); if (ov) ov.classList.remove('show');
    const tt = document.getElementById('gmToast'); if (tt) tt.classList.remove('show');
  }

  // 今出ている1件を切り上げて次へ（タップ）
  function _annNext() {
    if (!_annCur) return;
    _annTimers.forEach(id => clearTimeout(id)); _annTimers = [];
    _annHideAll();
    _annFinish(120);
  }

  // 残り全部を打ち切ってトレイへ載せる。⚠️ 音も fx も鳴らさない（一気に鳴ると事故に聞こえる）
  function _annSkipAll() {
    _annTimers.forEach(id => clearTimeout(id)); _annTimers = [];
    _annHideAll();
    if (_annCur) {
      if (_annCur.kind === 'batch' && Array.isArray(_annCur.items)) {
        _annCur.items.forEach(it => _annDone.push(it));
      } else {
        _annDone.push(_annCur);
      }
      _annCur = null;
    }
    const rest = _annQ.splice(0, _annQ.length);
    _renderTray();
    // 一段ずつ点灯させる（一気に全部だと「消えた」に見える）
    rest.forEach((it, i) => setTimeout(() => { _annDone.push(it); _renderTray(); }, (i + 1) * ANN_SKIP_STEP_MS));
  }

  // ⚠️ リスナーは要素ごとに1本だけ張る（アイテムごとに張ると再生数ぶん積み上がる）
  function _annBindTap(el) {
    if (!el || el._gmTap) return;
    el._gmTap = 1;
    el.addEventListener('click', () => {
      if (Date.now() - _annShownAt < ANN_TAP_GUARD_MS) return;  // 入場中の指は結果画面のもの
      _annNext();
    });
  }

  function _annPosHtml(compact) {
    const total = _annTotal(), pos = _annPos();
    if (total < 2) return '';
    let dots = '';
    if (!compact && total <= ANN_DOTS_MAX) {
      for (let i = 1; i <= total; i++) dots += '<i class="' + (i <= pos ? 'on' : '') + '"></i>';
    }
    return '<div class="gm-ann-pos">' + dots + '<span>' + pos + ' / ' + total + '</span></div>';
  }

  // ── 授与トレイ ───────────────────────────────────────────────────
  // ⚠️ マウント要素（#gmTrayMount）は study.html の結果画面の中にしか無い。無いページでは
  //    何も描かず従来どおり流れる＝「結果画面だけ」がコード分岐ではなく構造で決まる。
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function _annLabel(it) {
    if (it.label) return it.label;
    const m = /gm-cer-big[^>]*>([^<]*)</.exec(it.html || '');
    return (m && m[1].trim()) || '獲得';
  }
  function _trayVisible() {
    const m = document.getElementById('gmTrayMount');
    if (!m) return false;
    // 結果画面が閉じている間は描かない（見えない場所に古い一覧を残さない）
    try { return !!(m.getClientRects && m.getClientRects().length); } catch (e) { return false; }
  }
  function _renderTray() {
    const m = document.getElementById('gmTrayMount');
    if (!m || !_trayVisible()) return;
    const rows = _annDone.map(it => ({ it: it, st: 'done' }))
      .concat(_annCur ? [{ it: _annCur, st: 'play' }] : [])
      .concat(_annQ.map(it => ({ it: it, st: 'wait' })));
    if (!rows.length) { m.innerHTML = ''; m._gmKey = ''; return; }
    const key = rows.map(r => _annLabel(r.it)).join('|');
    const left = _annQ.length + (_annCur ? 1 : 0);
    if (m._gmKey !== key) {
      m._gmKey = key;
      m.innerHTML =
        '<div class="gm-tray">' +
          '<div class="gm-tray-hd">' +
            '<span class="gm-tray-ttl">🎖 今回の獲得</span>' +
            '<span class="gm-tray-cnt">' + rows.length + '件</span>' +
            '<button type="button" class="gm-tray-skip">まとめて受け取る</button>' +
          '</div>' +
          rows.map(r =>
            '<div class="gm-tray-row"><span class="mk">⬜</span>' +
            '<span class="ic">' + _esc(r.it.icon || '🎖') + '</span>' +
            '<span class="tx">' + _esc(_annLabel(r.it)) + '</span></div>').join('') +
        '</div>';
      const btn = m.querySelector('.gm-tray-skip');
      if (btn) btn.addEventListener('click', function () { _annSkipAll(); });
    }
    const els = m.querySelectorAll('.gm-tray-row');
    rows.forEach((r, i) => {
      const el = els[i]; if (!el) return;
      el.classList.remove('is-done', 'is-play');
      if (r.st !== 'wait') el.classList.add(r.st === 'done' ? 'is-done' : 'is-play');
      const mk = el.querySelector('.mk');
      if (mk) mk.textContent = r.st === 'done' ? '✅' : r.st === 'play' ? '🔆' : '⬜';
    });
    const cnt = m.querySelector('.gm-tray-cnt');
    if (cnt) cnt.textContent = rows.length + '件' + (left ? '（残り ' + left + '）' : '');
    const btn2 = m.querySelector('.gm-tray-skip');
    if (btn2) btn2.style.display = left ? '' : 'none';
  }

  function _fxConfetti(big) {
    if (!window.MecFX) return;
    try {
      window.MecFX.confetti({ count: big ? 90 : 45, colors: ['#FFD166', '#3DD68C', '#60A5FA', '#FF5E8A', '#A78BFA'], big: !!big });
      if (big) window.MecFX.fireworks({ count: 4, colors: ['#FFD166', '#3DD68C', '#60A5FA', '#FF5E8A'], tier: 5 });
    } catch {}
  }

  // 章・科目制覇の追い打ち。g=0〜3 は章メダルの段、4 は科目制覇。
  function _fxClear(g) {
    _fxConfetti(g >= 3);
    if (!window.MecFX || _reducedMotion()) return;
    try {
      const x = innerWidth / 2, y = innerHeight * .42;
      const col = g >= 3 ? '#FFD166' : g === 2 ? '#E6ECF5' : g === 1 ? '#E0A070' : '#FFD166';
      window.MecFX.rings && window.MecFX.rings(x, y, { count: g >= 3 ? 3 : 2, maxR: g >= 4 ? 360 : 260, color: col, thickness: 3, additive: true, stagger: .12 });
      window.MecFX.burst(x, y, { tier: g >= 3 ? 6 : 4, count: g >= 4 ? 120 : g >= 3 ? 90 : 50, colors: [col, '#FFFFFF', '#FFF3C4'], shapes: ['star', 'circle'] });
      if (g >= 4) setTimeout(() => window.MecFX.fireworks({ count: 6, tier: 6, colors: ['#FFD166', '#FF5E8A', '#60A5FA', '#3DD68C'] }), 700);
    } catch {}
  }

  // ── レベルアップ検知 ─────────────────────────────────────────────
  function _checkLevelUp(celebrate) {
    const s = stats();
    if (L.lastLevel == null) { L.lastLevel = s.level; saveL(); return; }
    if (s.level > L.lastLevel) {
      const from = L.lastLevel;
      L.lastLevel = s.level; saveL();
      if (celebrate) {
        ceremony(
          '<div class="gm-cer-ic">🎉</div><div class="gm-cer-big">LEVEL UP!</div>' +
          '<div class="gm-cer-sub">Lv.' + from + ' → Lv.' + s.level + '</div>' +
          '<div class="gm-cer-note">' + s.title + '</div>',
          { fx: () => _fxConfetti(true), snd: SND.levelup, dur: 2400,
            icon: '🎉', label: 'LEVEL UP　Lv.' + from + ' → Lv.' + s.level }
        );
      } else {
        toast('⬆️', 'Lv.' + s.level + ' にレベルアップ', '同期された学習が反映されました');
      }
    } else if (s.level < L.lastLevel) {
      L.lastLevel = s.level; saveL(); // undo等でXPが減った場合は静かに追従
    }
  }

  // ── 実績検知 ─────────────────────────────────────────────────────
  function _checkAchievements(celebrate) {
    const s = stats();
    const fresh = [];
    for (const a of ACH) {
      if (L.seenAch.includes(a.id)) continue;
      const [cur, target] = a.g(s);
      if (cur >= target) { L.seenAch.push(a.id); fresh.push(a); }
    }
    if (fresh.length) {
      saveL();
      if (celebrate) {
        // 音はトーストに持たせる（保留されても表示の瞬間に鳴る）。連続解除でも鳴るのは先頭だけ
        fresh.forEach((a, i) => toast(a.icon, '実績解除「' + a.name + '」', a.desc, i ? null : SND.ach));
      }
    }
  }

  // ── ミッション（日次・週次／端末別カウンタで同期） ───────────────
  // 各ミッションは counter（ans/cor/exam/srs/redo/subj/day/hard/chexam80/acc80/perfect）の
  // 端末横断合計が target 以上で達成。
  //
  // tier（2026-07-29〜）:
  //   'core'  … 手を動かせば必ず届くもの。MISSION COMPLETE セレモニーは **これだけ** で判定する。
  //   'bonus' … 在庫や運に左右されるもの（SRSの期限到来数・その日に全問正解できるか等）。
  //   ⚠️ 旧仕様はセレモニーが全ミッション達成を条件にしており、その中に「試験で全問正解」が
  //      入っていたため日次のセレモニーが事実上発火しなかった。新しいミッションを足すときは
  //      「毎日必ず達成できるか」を基準に tier を決めること。到達不能なものを core に置かない。
  //
  // 2026-07-30: 日次「🚩を5個 克服する」(counter 'unflag') を廃止し 'subj' へ差し替えた。
  //   ① 在庫依存 … 旗が5個溜まっていない日は物理的に達成不能（chclear と同型の欠陥）。
  //   ② 動機が逆向き … 報酬が「旗を外すこと」に付くので弱点リストを畳む動機になる。旗は
  //      本来「後で戻る印」で、消すことは上達の証明ではない。
  //   ③ 検証を伴わない … 解除はワンタップで想起テストを経ていない（cor/redo と違い証拠が無い）。
  //   'subj' は 'bonus' に置く。到達不能ではないが、単一科目選択UI＋章を順に進める運用では
  //   「その日1科目だけ」が普通に起こるため、core にすると日次セレモニーの敷居が上がりすぎる。
  //
  // xp は達成時に一度だけ入るボーナスXP（_awardMissionXp・重複防止は同期台帳 s.xp.ledger）。
  // ── 日替わりクエストプール ─────────────────────────────────────────
  const DAILY_QUEST_POOL = [
    { id: 'd_hard',    tier: 'bonus', xp: 60, icon: '🔥', label: '正答率60%未満の難問を5問', target: 5,  counter: 'hard',    isRandom: true },
    { id: 'd_srs15',   tier: 'bonus', xp: 60, icon: '🔁', label: 'SRS復習を15問 こなす',     target: 15, counter: 'srs',     isRandom: true },
    { id: 'd_redo5',   tier: 'bonus', xp: 70, icon: '♻️', label: '落とした問題を5問 奪回',   target: 5,  counter: 'redo',    isRandom: true },
    { id: 'd_acc80',   tier: 'bonus', xp: 50, icon: '🎯', label: '正答率80%以上を1回',       target: 1,  counter: 'acc80',   isRandom: true },
    { id: 'd_exam2',   tier: 'bonus', xp: 60, icon: '🎓', label: '試験セッションを2本 解答', target: 2,  counter: 'exam',    isRandom: true },
    { id: 'd_perfect', tier: 'bonus', xp: 80, icon: '💯', label: '試験で全問正解を1回',      target: 1,  counter: 'perfect', isRandom: true },
  ];

  function _dateSeed(dk) {
    let h = 0;
    for (let i = 0; i < dk.length; i++) h = ((h << 5) - h + dk.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // ── 🎯 弱点強化（2026-09-24 に作り直し）────────────────────────────────
  // 対象は「科目」ではなくハブの8軸レーダー（実力の輪郭）の**科目群**。ハブで琥珀に光っている
  // 軸とミッションが同じものを指す。
  // ⚠️ 軸の定義は index.html の RADAR_AXES と同じであること（id・sids）。
  //    test_missions.js が index.html のソースと突き合わせる。科目を足したら両方へ入れる。
  //
  // 旧「【弱点強化】◯◯を10問 解答」（_weakestSubject）は次の理由で廃止した:
  //   ① 受験5回未満の科目を正答率0.5とみなし進捗を30%混ぜていたため、弱点ではなく
  //      「手を付けていない科目」（模試 m121s まで）がほぼ必ず選ばれた
  //   ② 生の正答率＝全国的に難しい科目が弱点に見える（カルテ・レーダーの方針と逆）
  //   ③ 解答のたびに選び直すので1日の途中で科目が変わり、id が d_focus_{科目} だったため
  //      切り替わった瞬間に共有カウンタで達成済みになりボーナスXPが二重に入った
  //   ④ 通常モードの「済」でも数えられた（想起テストの証拠にならない）
  const FOCUS_AXES = [
    { id: 'cr', label: '循環・呼吸', icon: '❤️', sids: ['circ', 'resp'] },
    { id: 'gi', label: '消化・肝胆', icon: '🌿', sids: ['dige', 'hbp'] },
    { id: 'en', label: '腎・内分泌', icon: '⚗️', sids: ['jinzo_d', 'endo'] },
    { id: 'hm', label: '血液・免疫', icon: '🩸', sids: ['hema', 'imma', 'kansen'] },
    { id: 'ne', label: '神経・精神', icon: '🧠', sids: ['neur', 'psy'] },
    { id: 'pd', label: '小児・産婦', icon: '🧸', sids: ['peds', 'obg'] },
    { id: 'sg', label: '外科系',     icon: '🦴', sids: ['ortho', 'oph', 'ent', 'uro', 'derm', 'anes', 'rad'] },
    { id: 'em', label: '救急・公衆', icon: '🚑', sids: ['emg', 'tox', 'ph'] },
  ];
  const FOCUS_MIN_N = 20;                 // = index.html の RADAR_MIN_N（未満は「未測定」）
  const FOCUS_TARGET = 10;
  const K_FOCUS = 'mec_focus_axis_v1';    // ⚠️ UIローカル（非同期）。{day, ax, mode}
  function _uidSid(uid) { const i = uid ? uid.indexOf('_ch') : -1; return i > 0 ? uid.slice(0, i) : ''; }
  function _axisOfSid(sid) { return FOCUS_AXES.find(a => a.sids.indexOf(sid) >= 0) || null; }

  // その日の対象の軸を決める。**1日1回だけ決めて保存し、その日のうちは動かさない**
  // （旧実装の③＝途中で対象が変わってXPが二重に入る穴を塞ぐ）。
  // 材料はハブが1日1回書く mec_radar_snap_v1 の「今日より前の最新の日」＝前日までの実力。
  //   ① 全国を下回る測定済みの軸があれば、差がいちばんマイナスの軸（mode 'weak'）
  //   ② 無ければ未測定（受験20問未満）の軸のうち受験がいちばん少ない軸（mode 'measure'）
  //   ③ それも無ければ（全軸が測定済みで全国以上）差がいちばん小さい軸（mode 'weak'）
  // スナップショットが無い端末（ハブを開いたことがない）は myrate_v1 の受験数だけで②を行う。
  function _focusAxis(dateKey) {
    const dk = dateKey || _todayJST();
    const saved = _g(K_FOCUS, null);
    if (saved && saved.day === dk && _axisById(saved.ax)) return { axis: _axisById(saved.ax), mode: saved.mode };

    const snap = _g('mec_radar_snap_v1', {});
    const prev = Object.keys(snap || {}).filter(d => d < dk).sort().pop();
    const row = prev ? snap[prev] : null;
    const t = {}, gap = {};
    FOCUS_AXES.forEach(a => { t[a.id] = 0; });
    if (row) {
      FOCUS_AXES.forEach(a => {
        const v = row[a.id];
        if (!v || !(v[0] > 0)) return;
        t[a.id] = v[0];
        if (v[0] >= FOCUS_MIN_N) gap[a.id] = v[1] / v[0] * 100 - v[2] / v[0];
      });
    } else {
      const my = _g('myrate_v1', {});
      for (const uid in my) {
        const a = _axisOfSid(_uidSid(uid)); const r = my[uid];
        if (a && r && r.total > 0) t[a.id] += r.total;
      }
    }
    const measured = FOCUS_AXES.filter(a => a.id in gap);
    const unmeasured = FOCUS_AXES.filter(a => !(a.id in gap));
    // 同点は日付のハッシュで割る（毎日同じ軸に固定されないように）
    const tie = a => _dateSeed(dk + a.id);
    const byGap = measured.slice().sort((x, y) => (gap[x.id] - gap[y.id]) || (tie(x) - tie(y)));
    const byT = unmeasured.slice().sort((x, y) => (t[x.id] - t[y.id]) || (tie(x) - tie(y)));
    let pick, mode;
    if (byGap.length && gap[byGap[0].id] < 0) { pick = byGap[0]; mode = 'weak'; }
    else if (byT.length) { pick = byT[0]; mode = 'measure'; }
    else { pick = byGap[0]; mode = 'weak'; }
    try { localStorage.setItem(K_FOCUS, JSON.stringify({ day: dk, ax: pick.id, mode: mode })); } catch (e) {}
    return { axis: pick, mode: mode };
  }
  function _axisById(id) { return FOCUS_AXES.find(a => a.id === id) || null; }

  function _getDailyMissions(dateKey) {
    const dk = dateKey || _todayJST();
    const seed = _dateSeed(dk);
    const quest = DAILY_QUEST_POOL[seed % DAILY_QUEST_POOL.length];
    const fx = _focusAxis(dk);
    return [
      { id: 'ans',        tier: 'core',  xp: 100, icon: '📝', label: '100問 解答する',          target: 100, counter: 'ans' },
      { id: 'exam',       tier: 'core',  xp: 40, icon: '🎓', label: '試験セッション1本(10問+)', target: 1,  counter: 'exam' },
      { id: 'cor',        tier: 'core',  xp: 60, icon: '✅', label: '試験で20問 正解',          target: 20, counter: 'cor' },
      { id: 'srs',        tier: 'bonus', xp: 60, icon: '🔁', label: 'SRS復習を20問 こなす',     target: 20, counter: 'srs' },
      // ⚠️ 50 は SRS_SESSION_LIMIT（復習キュー1セッションの上限）と同じ数＝「復習を1本 完走する」。
      //    study.html の SRS_SESSION_LIMIT を変えたらここも合わせること（数字の意味が消える）。
      //    tier は必ず 'bonus'。due が50件に満たない日があり、手を動かしても届かないため。
      { id: 'srs50',      tier: 'bonus', xp: 120, icon: '🔁', label: 'SRS復習を50問 こなす',     target: 50, counter: 'srs' },
      { id: 'redo',       tier: 'bonus', xp: 70, icon: '♻️', label: '落とした問題を10問 奪回',  target: 10, counter: 'redo' },
      { id: 'subj',       tier: 'bonus', xp: 50, icon: '🧭', label: '科目を2つ以上またぐ',       target: 2,  counter: 'subj' },
      { id: quest.id,     tier: quest.tier, xp: quest.xp, icon: quest.icon, label: quest.label, target: quest.target, counter: quest.counter, isRandom: true },
      // ⚠️ id は軸を含めない固定の 'd_focus'（軸が端末ごとに違っても台帳は1件＝XPは1回だけ）。
      //    counter 'focus' は試験モード（onAnswer）の解答だけ・正誤を問わず数える
      //    （正解だけにすると苦手な問題を避けるほど有利になる＝hard と同じ理由）。
      //    launch … 行を押すと study.html?mode=focus で残り問数ぶんの試験が始まる。
      { id: 'd_focus', tier: 'bonus', xp: 70, icon: fx.axis.icon,
        label: (fx.mode === 'measure' ? '【弱点を測る】' : '【弱点強化】') + fx.axis.label + 'を試験で' + FOCUS_TARGET + '問',
        target: FOCUS_TARGET, counter: 'focus', axis: fx.axis.id, launch: 'study.html?mode=focus' },
    ];
  }

  const MISSIONS_DAILY = _getDailyMissions();
  const MISSIONS_WEEKLY = [
    { id: 'w_ans',     tier: 'core',  xp: 150, icon: '📅', label: '今週 250問 解答する',         target: 250, counter: 'ans' },
    { id: 'w_cor',     tier: 'core',  xp: 200, icon: '✅', label: '今週 試験で120問 正解',       target: 120, counter: 'cor' },
    { id: 'w_exam',    tier: 'core',  xp: 150, icon: '🎓', label: '今週 試験セッション7回',      target: 7,   counter: 'exam' },
    { id: 'w_srs',     tier: 'bonus', xp: 200, icon: '🔁', label: '今週 SRS復習を150問',         target: 150, counter: 'srs' },
    { id: 'w_chexam',  tier: 'bonus', xp: 250, icon: '🏆', label: '今週 章別試験80%以上を3章',   target: 3,   counter: 'chexam80' },
    { id: 'w_perfect', tier: 'bonus', xp: 200, icon: '💯', label: '今週 全問正解を3回',          target: 3,   counter: 'perfect' },
    // ⚠️ w_day は 'bonus' 固定。日数は**最終日に巻き返せない唯一のカウンタ**で、2日空けた時点で
    //    その週は到達不能になる。週次のペース表示は「カウンタ型は理屈の上では最終日でも巻き返せる」
    //    前提で遅れをグレーアウトしない設計なので、これを core に置くと週次セレモニーが
    //    週の前半で死ぬ週が出る。core に上げたいなら target を 4〜5 に落とすこと。
    { id: 'w_day',     tier: 'bonus', xp: 200, icon: '📆', label: '今週 6日 学習する',           target: 6,   counter: 'day' },
    { id: 'w_hard',    tier: 'bonus', xp: 250, icon: '🔥', label: '今週 難問(60%未満)を100問',   target: 100, counter: 'hard' },
  ];
  // 「その期間の core を全部」達成したときのボーナスXP
  const MISSION_ALL_XP = { d: 150, w: 600 };
  // ボーナスXP台帳に期間キーを残す日数。⚠️ progress.js の _mergeRemote にも同じ値がある
  // （両側が同じ日付基準で古いキーを落とすことで、banked へ繰り入れ済みのキーを
  //   同期が復活させて二重加算するのを防いでいる）。片方だけ変えないこと。
  const MISSION_XP_KEEP_DAYS = 150;

  // 週キー = その週の月曜(JST)の日付。日次・週次とも古い期間はプルーニングして肥大化を防ぐ。
  function _weekKeyJST() {
    const d = new Date(Date.now() + 9 * 3600000);
    const dow = (d.getUTCDay() + 6) % 7; // 月=0 … 日=6
    d.setUTCDate(d.getUTCDate() - dow);
    return d.toISOString().slice(0, 10);
  }
  // 週の経過割合（月曜0時=0 / 日曜24時=1）と残り日数。週次ミッションのペース表示に使う。
  function _weekPace() {
    const d = new Date(Date.now() + 9 * 3600000);
    const dow = (d.getUTCDay() + 6) % 7;
    const ms = dow * 86400000 + d.getUTCHours() * 3600000 + d.getUTCMinutes() * 60000;
    return { p: Math.max(0, Math.min(1, ms / (7 * 86400000))), daysLeft: 7 - dow };
  }
  function _missionStore() {
    let s; try { s = JSON.parse(localStorage.getItem(K_MISSIONS) || '{}'); } catch { s = {}; }
    if (!s.d || typeof s.d !== 'object') s.d = {};
    if (!s.w || typeof s.w !== 'object') s.w = {};
    if (!s.xp || typeof s.xp !== 'object') s.xp = {};
    if (typeof s.xp.banked !== 'number') s.xp.banked = 0;
    if (!s.xp.ledger || typeof s.xp.ledger !== 'object') s.xp.ledger = {};
    return s;
  }
  function _pruneMissions(s) {
    const keep = (obj, n) => { const ks = Object.keys(obj).sort(); while (ks.length > n) delete obj[ks.shift()]; };
    keep(s.d, 14); keep(s.w, 10);
    // 台帳から落ちる期間ぶんは banked へ繰り入れる（レベルが下がらないように総額は保存する）。
    // 判定は「今日から MISSION_XP_KEEP_DAYS 日前」の日付との単純比較。日次キーも週次キーも
    // 'd:YYYY-MM-DD' / 'w:YYYY-MM-DD' なので同じ規則で切れる。
    const cut = new Date(Date.now() + 9 * 3600000 - MISSION_XP_KEEP_DAYS * 86400000)
      .toISOString().slice(0, 10);
    Object.keys(s.xp.ledger).forEach(k => {
      if (k.slice(2) >= cut) return;
      const g = s.xp.ledger[k] || {};
      for (const id in g) s.xp.banked += g[id] || 0;
      delete s.xp.ledger[k];
    });
  }
  // 端末横断の合計（period: 'd' | 'w'、key: 日付 or 週キー）
  function _missionSum(period, counter, key) {
    const bucket = (_missionStore()[period] || {})[key] || {};
    let n = 0;
    for (const dev in bucket) n += (bucket[dev] && bucket[dev][counter]) || 0;
    return n;
  }
  // counter は文字列 or 配列。この端末ぶんを日次・週次の両方へ加算し、達成判定＋同期予約。
  function _bumpMission(counters, by) {
    by = by || 1;
    const list = Array.isArray(counters) ? counters : [counters];
    const dev = L.devId, dk = _todayJST(), wk = _weekKeyJST();
    const s = _missionStore();
    const dd = (s.d[dk] = s.d[dk] || {}); dd[dev] = dd[dev] || {};
    const ww = (s.w[wk] = s.w[wk] || {}); ww[dev] = ww[dev] || {};
    list.forEach(c => { dd[dev][c] = (dd[dev][c] || 0) + by; ww[dev][c] = (ww[dev][c] || 0) + by; });
    _pruneMissions(s);
    _s(K_MISSIONS, s);
    _checkMissionCompletions();
    if (window.MECSync) MECSync.scheduleSync();
    _updateHeaderChips();
  }
  // ボーナスXPを台帳へ1回だけ記帳する。同じ (期間キー, missionId) には**どの端末も同じ値**を
  // 書くので、同期のunionマージで合流しても二重に増えない（数を数えず「何を取ったか」を持つ）。
  function _awardMissionXp(ledgerKey, missionId, xp) {
    if (!xp) return;
    const s = _missionStore();
    const g = (s.xp.ledger[ledgerKey] = s.xp.ledger[ledgerKey] || {});
    if (g[missionId]) return; // 記帳済み（自端末で取った／他端末が取ったものを同期で受け取った）
    g[missionId] = xp;
    _pruneMissions(s);
    _s(K_MISSIONS, s);
    _statsCache = null; // XPが増えたのでレベル表示を作り直させる
  }
  // ミッションで獲得した累計ボーナスXP（stats() の xp に足す）
  function missionXp() {
    const x = _missionStore().xp;
    let n = x.banked || 0;
    for (const k in x.ledger) { const g = x.ledger[k]; for (const id in g) n += g[id] || 0; }
    return n;
  }
  // 期間内で獲得済み／獲得可能なボーナスXP（パネルのフッター行用）
  function _missionXpFor(defs, period, key) {
    const g = (_missionStore().xp.ledger[period + ':' + key]) || {};
    let got = g.__all__ || 0, max = MISSION_ALL_XP[period] || 0;
    defs.forEach(d => { max += d.xp || 0; if (g[d.id]) got += g[d.id]; });
    return { got, max };
  }

  // 合計が target を超えた瞬間だけ達成トースト（端末ローカルで既視管理し重複発火を防ぐ）
  function _checkMissionCompletions() {
    const dk = _todayJST(), wk = _weekKeyJST();
    // 期間キーは 'd:'/'w:' で名前空間を分ける。⚠️ 月曜は日次キーと週次キー（＝その週の月曜）が
    // 同じ日付文字列になるため、素の日付で引くと両者が同じ既視リストを共有し、
    // '__all__' が衝突して片方のセレモニーが出なくなる。
    const run = (defs, period, key, allLabel) => {
      const lk = period + ':' + key;
      const seen = (L.mDone[lk] = L.mDone[lk] || []);
      defs.forEach(def => {
        if (_missionSum(period, def.counter, key) < def.target) return;
        _awardMissionXp(lk, def.id, def.xp);
        if (!seen.includes(def.id)) {
          seen.push(def.id);
          const tTitle = def.isRandom ? '🎲 日替わりミッション達成！' : 'ミッション達成！';
          toast(def.icon, tTitle, def.label + '（+' + def.xp + ' XP）', SND.mission, def.label);
        }
      });
      // セレモニーは core のみで判定する（bonus は在庫・運に左右され毎回は達成できないため）
      const core = defs.filter(d => d.tier === 'core');
      if (core.every(def => _missionSum(period, def.counter, key) >= def.target)) {
        _awardMissionXp(lk, '__all__', MISSION_ALL_XP[period]);
        if (!seen.includes('__all__')) {
          seen.push('__all__');
          ceremony(
            '<div class="gm-cer-ic">🎯</div><div class="gm-cer-big">MISSION COMPLETE</div>' +
            '<div class="gm-cer-sub">' + allLabel + '</div>' +
            '<div class="gm-cer-note">+' + MISSION_ALL_XP[period] + ' XP ／ この調子で🔥</div>',
            { fx: () => _fxConfetti(true), snd: SND.clear, dur: 2400,
              icon: '🎯', label: allLabel }
          );
        }
      }
    };
    run(MISSIONS_DAILY, 'd', dk, '本日の必須ミッション 全達成！');
    run(MISSIONS_WEEKLY, 'w', wk, '今週の必須ミッション 全達成！');
    // L.mDone の古い期間キーを掃除
    const alive = new Set(['d:' + dk, 'w:' + wk]);
    Object.keys(L.mDone).forEach(k => { if (!alive.has(k)) delete L.mDone[k]; });
    saveL();
  }
  // ヘッダー🎯チップ用（日次の達成数。緑になるのは core が揃ったとき）
  function missionSummary() {
    const dk = _todayJST();
    const hit = def => _missionSum('d', def.counter, dk) >= def.target;
    const core = MISSIONS_DAILY.filter(d => d.tier === 'core');
    return {
      done: MISSIONS_DAILY.filter(hit).length, total: MISSIONS_DAILY.length,
      coreDone: core.filter(hit).length, coreTotal: core.length,
    };
  }

  // 「今日やるべき問題数のうち何問済んだか」の唯一の正本。ハブ(index.html)のゲージが読む。
  // 目標も進捗も日次ミッション ans（100問 解答する）から借りる＝ゲージのすぐ下に並ぶ
  // ミッション行と必ず同じ数字になる。ここで独自の目標値を持つと二重管理になる。
  // ⚠️ pct は 100 で頭打ちにしない（目標を超えた日はそのまま 130% 等を返す）。
  function dailyGoal() {
    const def = MISSIONS_DAILY.find(d => d.counter === 'ans');
    const target = (def && def.target) || 0;
    const count = _missionSum('d', 'ans', _todayJST());
    return { count, target, pct: target ? Math.round(count / target * 100) : 0 };
  }

  // ── 章・科目の制覇検知＋星 ───────────────────────────────────────
  // 章uid一覧は study.html の _chapterMap（グローバル束縛）を参照。ハブでは存在しない→スキップ。
  let _chIndex = null, _chIndexLen = -1;
  function _chapterFor(uid) {
    if (typeof _chapterMap === 'undefined' || !_chapterMap.length) return null;
    if (!_chIndex || _chIndexLen !== _chapterMap.length) {
      _chIndex = new Map();
      _chapterMap.forEach(entry => {
        if (entry.uids.length) {
          const u0 = entry.uids[0], i = u0.indexOf('_q');
          if (i > 0) _chIndex.set(u0.slice(0, i), entry);
        }
      });
      _chIndexLen = _chapterMap.length;
    }
    const i = uid.indexOf('_q');
    return i > 0 ? _chIndex.get(uid.slice(0, i)) : null;
  }

  // 章の評価（★1〜3 ＝ トロフィー棚の銅・銀・金メダル）の唯一の式。trophy.js もこれを呼ぶ。
  // t/c = 試験モードの延べ受験数・正解数、answered = 1回以上解いた問題数、count = 章の問題数。
  function chapterGrade(t, c, answered, count) {
    if (!t || answered < count * 0.5) return 0; // 章の半分以上を解答してから評価
    const pct = c / t * 100;
    return pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  }
  function _chapterStars(entry) {
    const my = _g('myrate_v1', {});
    let t = 0, c = 0, answered = 0;
    entry.uids.forEach(u => { const r = my[u]; if (r && r.total > 0) { answered++; t += r.total; c += r.correct || 0; } });
    return chapterGrade(t, c, answered, entry.uids.length);
  }
  const _MEDAL = ['', '🥉', '🥈', '🥇'], _MEDAL_NM = ['', '銅', '銀', '金'];
  function _chTitleOf(entry) {
    return ((entry.divEl && entry.divEl.childNodes[0] && entry.divEl.childNodes[0].textContent) || '').trim().replace(/[<>&]/g, '') || '章';
  }

  /* E5(2026-08-14): 星が「増えた瞬間」を演出する。
     ⚠️ animate は解答をきっかけに呼ぶ経路（_checkChapterClear）でだけ true にすること。
        refreshAllStars は全章を一度に描き直すので、ここで祝うと読み込みのたびに
        画面じゅうの章が一斉に光る。 */
  function _renderChapterStars(entry, animate) {
    if (!entry || !entry.divEl || !entry.divEl.isConnected) return;
    const n = _chapterStars(entry);
    let el = entry.divEl.querySelector('.gm-ch-stars');
    if (!n) { if (el) el.remove(); return; }
    let prev = null;
    if (!el) {
      el = document.createElement('span');
      el.className = 'gm-ch-stars';
      const prog = entry.divEl.querySelector('.ch-div-prog');
      if (prog) entry.divEl.insertBefore(el, prog); else entry.divEl.appendChild(el);
    } else if (el.dataset.n !== undefined) {
      prev = Number(el.dataset.n);
    }
    el.dataset.n = String(n);
    el.innerHTML = '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span>';
    el.title = '試験モードの章正答率評価（★3=90%↑ ★2=70%↑）';
    if (animate && prev !== null && n > prev) _starGainFx(el, n);
    // トロフィー棚の章メダルが上がった瞬間を通知する（試験中は保留され、結果画面の授与トレイに並ぶ）。
    // ⚠️ animate は解答きっかけの経路だけ true。読み込み時の描き直し（refreshAllStars）では出さない。
    if (animate && n > (prev || 0)) {
      const title = _chTitleOf(entry);
      toast(_MEDAL[n], _MEDAL_NM[n] + 'メダル獲得！', title + ' がトロフィー棚に並びました', SND.ach,
        _MEDAL[n] + ' ' + title + '（' + _MEDAL_NM[n] + '）');
    }
  }

  function _starGainFx(el, n) {
    if (typeof examMode !== 'undefined' && examMode) return; // 試験中は tier 演出に任せる
    if (_reducedMotion()) return;
    el.classList.remove('gm-star-gain'); void el.offsetWidth; el.classList.add('gm-star-gain');
    setTimeout(() => el.classList.remove('gm-star-gain'), 1000);
    if (!window.MecFX) return;
    try {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      MecFX.glyphBurst(r.left + r.width / 2, r.top + r.height / 2,
        { glyphs: ['★', '✨'], count: 3 + n, spread: 90, w: r.width });
      MecFX.burst(r.left + r.width / 2, r.top + r.height / 2, {
        tier: 3, count: 14 + n * 4, colors: ['#FFD166', '#FFF3C4', '#FFFFFF'], shapes: ['star', 'circle']
      });
    } catch (e) {}
  }

  function refreshAllStars() {
    if (typeof _chapterMap === 'undefined' || !_chapterMap.length) return;
    const list = _chapterMap.slice();
    let i = 0;
    const step = () => {
      const end = Math.min(i + 20, list.length);
      for (; i < end; i++) _renderChapterStars(list[i]);
      if (i < list.length) (window.requestIdleCallback || setTimeout)(step);
    };
    step();
  }

  function _checkChapterClear(uid) {
    const entry = _chapterFor(uid);
    if (!entry) return;
    _renderChapterStars(entry, true);   // E5: 解答きっかけなので星が増えたら祝う
    const i = uid.indexOf('_q');
    const chKey = i > 0 ? uid.slice(0, i) : '';
    if (!chKey || L.chDone.includes(chKey)) return;
    const done = _g('done_v2', {});
    if (!entry.uids.length || !entry.uids.every(u => done[u])) return;
    L.chDone.push(chKey); saveL();
    // ⚠️ ここに週次ミッションの加算を置いてはいけない。L.chDone は端末ローカルで、
    //    一度制覇した章は二度と加算されない＝全章を済にした時点でそのミッションが
    //    永久未達になる（旧 'chclear' がこれで死んでいた）。週次は何周でも成立する
    //    「章別試験で80%以上」（chexam80・onExamFinish）で数える。
    // 章仕切り線を光が一本走る（章を「閉じた」ことを在席する場所で示す）
    // ⚠️ 試験中は出さない。セレモニーは結果画面へ回るがこれは在席の演出で回せないため、
    //    tier 演出とぶつけるくらいなら黙る（_microLapFx / _lapMilestoneFx と同じ扱い）。
    if (entry.divEl && !_reducedMotion() && !(typeof examMode !== 'undefined' && examMode)) {
      const dv = entry.divEl;
      dv.classList.remove('gm-ch-sweep'); void dv.offsetWidth; dv.classList.add('gm-ch-sweep');
      setTimeout(() => dv.classList.remove('gm-ch-sweep'), 1100);
    }
    const title = _chTitleOf(entry);
    const n = _chapterStars(entry);
    // #8(2026-09-23): 制覇の評価をメダルで見せ、トロフィー棚へ飾られたことを告げる。
    //    金は花火まで上げる（章の評価は試験モードの正答率＝運ではなく実力の印なので強く祝う）。
    ceremony(
      '<div class="gm-cer-ic gm-cer-medal g' + n + '">' + (n ? _MEDAL[n] : '🏆') + '</div>' +
      '<div class="gm-cer-big">章 制覇！</div>' +
      '<div class="gm-cer-sub">' + title + '</div>' +
      (n ? '<div class="gm-cer-stars">' + '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(3 - n) + '</span>　' + _MEDAL_NM[n] + 'メダル</div>' : '') +
      '<div class="gm-cer-note">全' + entry.uids.length + '問クリア・トロフィー棚に飾られました</div>',
      { fx: () => _fxClear(n), snd: SND.clear, dur: n === 3 ? 3000 : 2500,
        icon: n ? _MEDAL[n] : '🏆', label: title + ' 制覇' + (n ? '　' + _MEDAL[n] : '') }
    );
  }

  function _checkSubjectClear(uid) {
    const i = uid.indexOf('_ch');
    if (i <= 0) return;
    const sid = uid.slice(0, i);
    const sub = SUBJECTS.find(s => s.id === sid);
    if (!sub || L.subjDone.includes(sid)) return;
    const s = stats();
    if ((s.bySubj[sid] || 0) < sub.total) return;
    L.subjDone.push(sid); saveL();
    ceremony(
      '<div class="gm-cer-crown">👑</div>' +
      '<div class="gm-cer-ic">' + sub.icon + '</div><div class="gm-cer-big">' + sub.name + ' 全問制覇！！</div>' +
      '<div class="gm-cer-sub">' + sub.total + '問 完全走破</div>' +
      '<div class="gm-cer-note">「' + sub.name + 'マスター」の称号と👑勲章をトロフィー棚に獲得</div>',
      { fx: () => { _fxConfetti(true); _fxClear(4); }, snd: SND.subject, dur: 3600,
        icon: '👑', label: sub.name + ' 全問制覇' }
    );
  }

  // ── マイクロ演出（通常モードの済/旗） ─────────────────────────────
  function _microLapFx(btn) {
    if (typeof examMode !== 'undefined' && examMode) return; // 試験モードは既存演出に任せる
    if (!btn) return;
    btn.classList.remove('gm-pop'); void btn.offsetWidth;
    btn.classList.add('gm-pop');
    if (window.MecFX) {
      try {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        window.MecFX.burst(cx, cy, { count: 12, colors: ['#3DD68C', '#7CEFB2', '#FFD166', '#fff'], shapes: ['circle', 'square'], tier: 1, speed: 300, upBias: 80, glow: true });
        window.MecFX.glyphBurst(cx, cy, { glyphs: ['✓', '⭐'], count: 2, spread: 60, w: 20 });
      } catch {}
    }
  }
  function _microFlagFx(btn, nowFlagged) {
    if (!btn) return;
    btn.classList.remove('gm-flag-wiggle'); void btn.offsetWidth;
    btn.classList.add('gm-flag-wiggle');
    if (nowFlagged && window.MecFX) {
      try {
        const r = btn.getBoundingClientRect();
        window.MecFX.glyphBurst(r.left + r.width / 2, r.top + r.height / 2, { glyphs: ['🚩'], count: 2, spread: 55, w: 16 });
      } catch {}
    }
  }

  // ── 連続正解（試験モード）→ bestStreak 同期 ──────────────────────
  let _curStreak = 0;
  function _trackStreak(isCorrect) {
    if (!isCorrect) { _curStreak = 0; return; }
    _curStreak++;
    const sync = _g(K_SYNC, {});
    if (_curStreak > (sync.bestStreak || 0)) {
      sync.bestStreak = _curStreak;
      _s(K_SYNC, sync);
      if (window.MECSync) MECSync.scheduleSync();
    }
  }

  // ── ヘッダーチップ（study.html） ─────────────────────────────────
  function _mountStudyHeader() {
    const row = document.querySelector('.st-stats') || document.querySelector('.st-title-row');
    if (!row) return;
    let lv = document.getElementById('gmLvChip');
    let mi = document.getElementById('gmMissionChip');
    if (!lv) {
      lv = document.createElement('button');
      lv.type = 'button';
      lv.className = 'st-stat gm-lv-chip';
      lv.id = 'gmLvChip';
      lv.title = 'タップでレベル・実績・ミッションを表示';
      lv.innerHTML = 'Lv.<b id="gmLvNum">–</b><span class="gm-chip-bar"><span class="gm-chip-fill" id="gmChipFill" style="width:0%"></span></span>';
      row.appendChild(lv);
    }
    lv.onclick = openPanelModal;

    if (!mi) {
      mi = document.createElement('button');
      mi.type = 'button';
      mi.className = 'st-stat gm-mission-chip';
      mi.id = 'gmMissionChip';
      mi.title = '今日のミッション（必須が揃うと緑）';
      mi.textContent = '🎯 –';
      row.appendChild(mi);
    }
    mi.onclick = openPanelModal;

    // 試験モードボタンを「今日のミッション」の右へ配置
    const examBtn = document.getElementById('examModeBtn');
    if (examBtn && mi && mi.nextSibling !== examBtn && mi.parentNode) {
      mi.parentNode.insertBefore(examBtn, mi.nextSibling);
    }
    _updateHeaderChips();
  }

  function _updateHeaderChips() {
    const s = stats(); // 400msキャッシュ許容（_afterEventが直前にキャッシュを破棄して呼ぶため実質最新）
    const lvNum = document.getElementById('gmLvNum');
    const fill = document.getElementById('gmChipFill');
    if (lvNum) lvNum.textContent = s.level;
    // 整数%へ丸めると1問あたりの微小な伸び（44pxバーで0.1px前後）が消え「増えない」ように見えるため、
    // 端数を保持して実際の進行度をそのまま反映する。
    if (fill) fill.style.width = (Math.max(0, Math.min(1, s.lvProgress)) * 100).toFixed(2) + '%';
    const mc = document.getElementById('gmMissionChip');
    if (mc) {
      const ms = missionSummary();
      // 数字は8個ぶんの達成数、緑になるのは必須3つが揃ったとき（＝セレモニーの条件と一致させる）
      mc.textContent = '🎯 ' + ms.done + '/' + ms.total;
      mc.classList.toggle('all', ms.coreDone >= ms.coreTotal);
    }
    // 既存の🔥連続日数チップにティア色を付ける
    const streakEl = document.querySelector('.st-streak');
    if (streakEl) {
      const t = _flameTier(s.streak);
      streakEl.classList.remove('gm-t2', 'gm-t3', 'gm-t4', 'gm-t5');
      if (t >= 2) streakEl.classList.add('gm-t' + t);
    }
  }

  function _flameTier(days) {
    return days >= 30 ? 5 : days >= 14 ? 4 : days >= 7 ? 3 : days >= 3 ? 2 : days >= 1 ? 1 : 0;
  }

  // 試験の1問ごとに、Lvチップの位置で「+N XP」を立ち上げ＆ゲージを一瞬ハイライトする。
  // レベルが上がるほど1問の伸び幅は小さくなるが、獲得XPそのものを見せることで
  // 「実際の進行度がLvに反映されている」ことを毎問はっきり示す。
  function _gmXpGain(delta) {
    const chip = document.getElementById('gmLvChip');
    if (!chip) return;
    const fill = document.getElementById('gmChipFill');
    if (fill) { try { fill.animate([{ filter: 'brightness(2)' }, { filter: 'brightness(1)' }], { duration: 520, easing: 'ease-out' }); } catch {} }
    if (_reducedMotion()) return;
    const r = chip.getBoundingClientRect();
    if (!r.width) return; // ヘッダーが見えていない等
    const f = document.createElement('div');
    f.textContent = '+' + delta + ' XP';
    f.style.cssText = 'position:fixed;left:' + (r.left + r.width / 2) + 'px;top:' + (r.top - 2) +
      'px;transform:translate(-50%,0);z-index:9300;pointer-events:none;font-weight:800;font-size:11px;' +
      'color:#FFD166;text-shadow:0 1px 6px rgba(0,0,0,.65);white-space:nowrap;font-family:inherit;';
    document.body.appendChild(f);
    f.animate([
      { opacity: 0, transform: 'translate(-50%,5px) scale(.8)' },
      { opacity: 1, transform: 'translate(-50%,-6px) scale(1)', offset: .3 },
      { opacity: 1, transform: 'translate(-50%,-14px) scale(1)', offset: .6 },
      { opacity: 0, transform: 'translate(-50%,-26px) scale(.95)' }
    ], { duration: 950, easing: 'cubic-bezier(.22,.68,0,1.2)', fill: 'forwards' }).onfinish = () => f.remove();
  }

  // ── パネル描画（ハブ埋め込み＋studyモーダルで共用） ───────────────
  // pace（0〜1）を渡すと、バーの上に「今そこまで進んでいるべき位置」の目盛りを1本引き、
  // 遅れている行の数字をアンバーにする。週次だけで使う（日次は1日の中の進み具合に意味が薄い）。
  function _renderMissionList(defs, period, key, pace) {
    return defs.map(d => {
      const raw = _missionSum(period, d.counter, key);
      const cur = Math.min(raw, d.target);
      const done = raw >= d.target;
      const ratio = cur / d.target;
      const behind = !done && pace != null && ratio < pace;
      const isRand = !!d.isRandom;
      // launch を持つ行（🎯 弱点強化）は未達成のあいだだけ押せる＝押すと残り問数の試験が始まる。
      // ⚠️ 達成後は普通の行に戻す（「達成に必要なぶん」が0問なので押しても何も起きない）。
      const tag = (d.launch && !done) ? 'a' : 'div';
      const href = tag === 'a' ? ' href="' + d.launch + '" title="押すと残り ' + (d.target - cur) + '問の試験を始めます"' : '';
      // data-tier は index.html（ハブ）が「必須だけ揃ったか」を判定するのに使う
      return '<' + tag + href + ' class="gm-mission' + (done ? ' done' : '') + (behind ? ' behind' : '') + (isRand ? ' is-random' : '') +
        (tag === 'a' ? ' is-launch' : '') +
        '" data-tier="' + d.tier + '"' + (isRand ? ' data-random="true"' : '') + '>' +
        '<span class="gm-mission-ic">' + (done ? '✅' : d.icon) + '</span>' +
        '<span class="gm-mission-lbl">' + (isRand ? '<span class="gm-mission-tag">🎲 日替わり</span>' : '') + d.label + '</span>' +
        '<span class="gm-mission-bar"><span class="gm-mission-fill" style="width:' + Math.round(ratio * 100) + '%"></span>' +
          (pace != null && !done ? '<i class="gm-pace" style="left:' + (pace * 100).toFixed(1) + '%"></i>' : '') +
        '</span>' +
        '<span class="gm-mission-num">' + cur + '/' + d.target + '</span>' +
        (tag === 'a' ? '<span class="gm-mission-go">▶</span>' : '') + '</' + tag + '>';
    }).join('');
  }

  // 必須（core）とボーナスを見出し付きで分けて出し、末尾に獲得ボーナスXPの行を足す。
  // 「必須だけ達成すればセレモニーが出る」ことを画面上でも分かるようにするための構造。
  function _renderMissionSection(defs, period, key, pace) {
    const hit = d => _missionSum(period, d.counter, key) >= d.target;
    const core = defs.filter(d => d.tier === 'core');
    const bonus = defs.filter(d => d.tier !== 'core');
    const xp = _missionXpFor(defs, period, key);
    return '<div class="gm-missions">' + _renderMissionList(core, period, key, pace) + '</div>' +
      (bonus.length
        ? '<div class="gm-sub-title">✨ ボーナス <span class="gm-cnt">' + bonus.filter(hit).length + '/' + bonus.length + '</span></div>' +
          '<div class="gm-missions">' + _renderMissionList(bonus, period, key, pace) + '</div>'
        : '') +
      '<div class="gm-mission-foot">必須 ' + core.filter(hit).length + '/' + core.length +
        ' 達成でコンプリート ｜ ボーナスXP <b>' + xp.got + '</b> / ' + xp.max + '</div>';
  }

  // opts.only で描き分ける。ハブ（index.html）が「🎯 今日のミッション」だけを
  // ヒーロー直下へ、残り（Lv・週間・実績）を下の折りたたみへ、と2箇所に分けて出すため。
  //   undefined … 全部（study.html のモーダル等・従来どおり）
  //   'daily'   … 今日のミッションの一覧だけ（.gm-panel の枠も付けない）
  //   'rest'    … 今日のミッション以外の全部
  // opts.noXpLine … 「次のレベルまで N XP」の行を出さない。
  //   ハブはこの行をヒーロー側（#heroLv）へ移したので、ここで出すと二重に見える。
  function renderPanel(container, opts) {
    if (!container) return;
    const only = opts && opts.only;
    const noXpLine = !!(opts && opts.noXpLine);

    if (only === 'daily') {
      container.innerHTML = _renderMissionSection(MISSIONS_DAILY, 'd', _todayJST(), null);
      return;
    }

    const s = stats(true);
    const achList = achState(s);
    const unlockedCount = achList.filter(a => a.unlocked).length;
    const tier = _flameTier(s.streak);

    const pace = _weekPace();
    const missionsHtml = _renderMissionSection(MISSIONS_DAILY, 'd', _todayJST(), null);
    const weeklyHtml = _renderMissionSection(MISSIONS_WEEKLY, 'w', _weekKeyJST(), pace.p);

    const badgesHtml = achList.map(a =>
      '<button type="button" class="gm-badge ' + (a.unlocked ? 'unlocked' : 'locked') + '" data-ach="' + a.id + '">' +
      '<span class="bi">' + (a.unlocked ? a.icon : '🔒') + '</span>' +
      '<span class="bn">' + a.name + '</span></button>'
    ).join('');

    container.innerHTML =
      '<div class="gm-panel">' +
      '<button class="gm-sound-btn" id="gmSoundBtn">' + (L.sound === 'off' ? '🔇 演出音OFF' : '🔊 演出音ON') + '</button>' +
      '<div class="gm-top">' +
        '<div class="gm-ring" style="--p:' + s.lvProgress.toFixed(3) + '"><div class="gm-ring-in">' +
          '<div class="gm-lv-big">Lv.' + s.level + '</div><div class="gm-lv-title">' + s.title + '</div></div></div>' +
        '<div class="gm-xp-col">' +
          (noXpLine ? '' :
            '<div class="gm-xp-line"><span>次のレベルまで</span><b>' + (s.lvNeedXp - s.lvCurXp).toLocaleString() + ' XP</b></div>') +
          '<div class="gm-xp-bar"><div class="gm-xp-fill" style="width:' + Math.round(s.lvProgress * 100) + '%"></div></div>' +
          '<div class="gm-xp-total">累計 ' + s.xp.toLocaleString() + ' XP ｜ 済 ' + s.doneCount.toLocaleString() + '問 ｜ 試験 ' + s.exT.toLocaleString() + '問' + (s.exT ? '（正答' + s.accPct + '%）' : '') + '</div>' +
        '</div>' +
        '<div class="gm-flame t' + tier + '"><span class="gm-flame-emoji">🔥</span>' +
          '<div class="gm-flame-days"><b>' + s.streak + '</b>日連続</div></div>' +
      '</div>' +
      (only === 'rest' ? '' :
        '<div class="gm-sec-title">🎯 今日のミッション</div>' + missionsHtml) +
      '<div class="gm-sec-title">📅 今週のミッション <span class="gm-cnt">残り' + pace.daysLeft + '日</span></div>' +
      weeklyHtml +
      '<div class="gm-sec-title">🏆 実績 <span class="gm-cnt">' + unlockedCount + '/' + achList.length + '</span></div>' +
      '<div class="gm-badges">' + badgesHtml + '</div>' +
      '<div class="gm-badge-desc" id="gmBadgeDesc"></div>' +
      '</div>';

    container.querySelectorAll('.gm-badge').forEach(b => {
      b.addEventListener('click', () => {
        const a = achList.find(x => x.id === b.dataset.ach);
        if (!a) return;
        const descEl = container.querySelector('#gmBadgeDesc');
        descEl.innerHTML = '<b>' + a.icon + ' ' + a.name + '</b> — ' + a.desc +
          (a.unlocked ? '（解除済み）' : '　<b>' + a.cur.toLocaleString() + ' / ' + a.target.toLocaleString() + '</b>');
        descEl.classList.add('show');
      });
    });
    const sb = container.querySelector('#gmSoundBtn');
    if (sb) sb.addEventListener('click', () => {
      L.sound = L.sound === 'off' ? 'on' : 'off';
      saveL();
      sb.textContent = L.sound === 'off' ? '🔇 演出音OFF' : '🔊 演出音ON';
      if (L.sound === 'on') { try { SND.mission(); } catch {} }
    });
  }

  function openPanelModal() {
    let ov = document.getElementById('gmOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'gmOv';
      ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div id="gmOvInner" style="width:100%;max-width:560px;margin:auto 0;"></div>';
    const inner = ov.querySelector('#gmOvInner');
    renderPanel(inner);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'gm-close-btn';
    closeBtn.textContent = '閉じる';
    closeBtn.addEventListener('click', () => ov.classList.remove('open'));
    inner.querySelector('.gm-panel').appendChild(closeBtn);
    ov.classList.add('open');
  }

  // ── イベントAPI（progress.js / study_exam.js から呼ばれる） ────────
  // ⚠️ ここに `if (examMode) return;` を足さないこと。記帳（L.lastLevel / L.chDone / L.subjDone）
  //    まで止まると「試験中に上がったレベルが二度と祝われない」＝取りこぼす。試験中の抑止は
  //    演出側（ceremony/toast の保留・_starGainFx・章仕切りの光）だけで行う。
  function _afterEvent(uid) {
    _statsCache = null;
    _updateHeaderChips();
    _checkLevelUp(true);
    _checkAchievements(true);
    if (uid) { _checkChapterClear(uid); _checkSubjectClear(uid); }
    _rerenderHubPanel();
  }

  // 動きを減らす設定のユーザーには gamify 側の追加FXも出さない
  // （index.html は study.html のような MecFX no-op 化を持たないため、ここで自前に判定する）
  function _reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // 周回マイルストーン（3周・5周到達時だけ祝う。毎周鳴らすとうるさいので節目のみ）
  const LAP_MILESTONES = { 3: { label: '3周目！', col: '#FFD166' }, 5: { label: '5周目 完成！', col: '#FFD700' } };
  function _lapMilestoneFx(uid, btn) {
    if (typeof examMode !== 'undefined' && examMode) return;
    if (!btn || _reducedMotion()) return;
    const lap = (_g('done_v2', {})[uid]) | 0;
    const ms = LAP_MILESTONES[lap];
    if (!ms) return;
    const r = btn.getBoundingClientRect();
    if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const lbl = document.createElement('div');
    lbl.textContent = ms.label;
    lbl.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;z-index:9220;pointer-events:none;' +
      'font-size:14px;font-weight:900;letter-spacing:.04em;white-space:nowrap;color:' + ms.col +
      ';text-shadow:0 2px 10px rgba(0,0,0,.75);transform:translate(-50%,0);font-family:inherit;';
    document.body.appendChild(lbl);
    lbl.animate([
      { opacity: 0, transform: 'translate(-50%,0) scale(.7)' },
      { opacity: 1, transform: 'translate(-50%,-18px) scale(1.1)', offset: .3 },
      { opacity: 1, transform: 'translate(-50%,-26px) scale(1)', offset: .6 },
      { opacity: 0, transform: 'translate(-50%,-52px) scale(.95)' }
    ], { duration: 1000, easing: 'cubic-bezier(.22,.68,0,1.2)', fill: 'forwards' }).onfinish = () => lbl.remove();
    if (window.MecFX) {
      try {
        window.MecFX.burst(cx, cy, { count: lap >= 5 ? 34 : 22, colors: ['#FFD700', '#FFD166', '#FFF3C4', '#fff'], shapes: ['circle', 'star'], tier: 3, glow: true, additive: true, upBias: 90 });
        window.MecFX.rings(cx, cy, { count: 1, color: 'rgba(255,209,102,.75)', thickness: 2, maxR: 120, additive: true });
      } catch {}
    }
  }

  // 難問の閾値。study.html のフィルタ「難問(<60%)」と同じ数字にすること（表示と数え方を揃える）。
  const HARD_RATE = 60;
  // その問題が難問かはカードの data-rate（questions_*.json の rate）が正本。
  // ⚠️ 正答率データが無い問題（data-rate 属性そのものが無い＝norate）は難問として数えない。
  //    「難問だから正答率が無い」わけではなく、単に出典に数字が載っていないだけなので。
  function _isHardQ(uid) {
    try {
      const card = document.querySelector('.qc[data-uid="' + uid + '"]');
      const r = card && card.dataset ? card.dataset.rate : null;
      if (r == null || r === '') return false;
      const n = parseFloat(r);
      return isFinite(n) && n < HARD_RATE;
    } catch { return false; }
  }

  // 「その日はじめて」だけ数えるカウンタ（day=学習した日／subj=触った科目）のうち、今回の解答で
  // 立つものを返す（呼び出し側が同じ _bumpMission にまとめて渡す＝1解答につき書き込み・達成判定・
  // 同期予約は1回だけ）。判定は端末ローカルの帳簿（L）で、カウンタ本体は同期されるので
  // 合算は端末横断で正しくなる。
  // ⚠️ _bumpMission は日次バケットと週次バケットの両方へ足すので、週次側の意味は
  //      day  … その週に学習した日数（＝w_day が読む正しい値）
  //      subj … 「日ごとの異なる科目数」の週合計（同じ科目を5日やれば5）＝**科目数ではない**。
  //    週次に科目の広さを問うミッションを作るなら、週キーで別の帳簿を持つこと（w_chexam と同じ方式）。
  function _dailyFirstBumps(uid) {
    const dk = _todayJST();
    const bumps = [];
    if (L.dDay !== dk) { L.dDay = dk; bumps.push('day'); }
    // 科目は SUBJECTS に載っているものだけ数える（custom/memo は非コア科目として意図的に除外＝
    // 自作28問と暗記メモ121問を1問ずつ触って「2科目」にする抜け穴を作らない）。
    const i = uid ? uid.indexOf('_ch') : -1;
    const sid = i > 0 ? uid.slice(0, i) : '';
    if (sid && SUBJECTS.some(s => s.id === sid)) {
      if (!L.dSubj || L.dSubj.k !== dk) L.dSubj = { k: dk, s: [] };
      if (L.dSubj.s.indexOf(sid) < 0) { L.dSubj.s.push(sid); bumps.push('subj'); }
    }
    if (bumps.length) saveL();
    return bumps;
  }

  // 🎯 弱点強化：その日の軸に属する科目の問題なら 'focus'。⚠️ onAnswer（試験モード）からだけ呼ぶ。
  function _focusBump(uid) {
    if (!uid) return [];
    const a = _axisOfSid(_uidSid(uid));
    return (a && a.id === _focusAxis().axis.id) ? ['focus'] : [];
  }

  // study.html?mode=focus が読む。残り問数は「達成に必要なぶん」＝target − 端末横断の進捗。
  function focusMission() {
    const fx = _focusAxis();
    const done = _missionSum('d', 'focus', _todayJST());
    return { axis: fx.axis.id, label: fx.axis.label, sids: fx.axis.sids.slice(), mode: fx.mode,
             target: FOCUS_TARGET, done: Math.min(done, FOCUS_TARGET),
             remaining: Math.max(0, FOCUS_TARGET - done) };
  }

  function onLap(uid, btn) {
    const bumps = ['ans']; // 「済」も解答数ミッションに算入
    if (_isHardQ(uid)) bumps.push('hard');
    // ⚠️ 通常モードの「済」は弱点強化（focus）に数えない（想起テストを経ていないため）
    _bumpMission(bumps.concat(_dailyFirstBumps(uid)));
    _microLapFx(btn);
    _lapMilestoneFx(uid, btn);
    _afterEvent(uid);
  }

  // opts.srs      … SRS復習セッション中の解答（正誤を問わず「消化数」に算入）
  // opts.wasWrong … この解答より前に一度でも落としている問題（正解したら「奪回」に算入）
  function onAnswer(uid, isCorrect, opts) {
    const o = opts || {};
    const bumps = isCorrect ? ['ans', 'cor'] : ['ans'];
    if (o.srs) bumps.push('srs');
    if (isCorrect && o.wasWrong) bumps.push('redo');
    // 難問は正誤を問わず「触った数」で数える（正解だけだと難問を避けるほど有利になる）
    if (_isHardQ(uid)) bumps.push('hard');
    _bumpMission(bumps.concat(_dailyFirstBumps(uid)).concat(_focusBump(uid)));
    _trackStreak(isCorrect);
    _afterEvent(uid);
    // XP = 試験解答×4 ＋ 試験正解×6 → 正解 +10 / 不正解 +4（stats() の配点と一致させること）
    _gmXpGain(isCorrect ? 10 : 4);
  }

  function onFlag(uid, btn, nowFlagged) {
    _microFlagFx(btn, nowFlagged);
    // ⚠️ ここに「🚩を外した数」のミッション加算を戻さないこと（2026-07-30に廃止した counter 'unflag'）。
    //    旗が溜まっていない日は達成不能な在庫依存の指標で、しかも報酬が「弱点リストを畳むこと」に
    //    付いてしまう。旗の扱いは演出だけに留め、達成の記録は解答（ans/cor/hard/redo）で数える。
  }

  // opts.chPrefix … 単一章だけを出題した章別試験のときの章prefix（週次「章別試験80%」用）
  function onExamFinish(answered, correct, opts) {
    const o = opts || {};
    // 結果画面の末尾で必ず1回呼ばれる＝ここがセッションの終わり。試験中に溜めたぶんも、
    // この呼び出し自身が生む達成（exam/acc80/perfect）も、結果画面の祝賀演出が終わってから出す。
    _quiet(CER_SETTLE_MS);
    if (answered >= 10) {
      const bumps = ['exam'];
      if (correct / answered >= 0.8) bumps.push('acc80');   // 高正答率セッション（80%以上）
      if (correct >= answered) bumps.push('perfect');       // 全問正解セッション
      _bumpMission(bumps);
      // 【案8】科目・章制覇の真鍮トロフィー溶鉄鋳造演出
      if (correct >= answered && answered >= 10 && window.MecFX && !_reducedMotion()) {
        setTimeout(() => {
          const w = window.innerWidth, h = window.innerHeight;
          window.MecFX.burst(w / 2, h / 2 - 40, {
            count: 50, colors: ['#FFD700', '#FF8C00', '#FFFFFF', '#FFA040'],
            shapes: ['gem', 'star', 'shard'], tier: 6, scale: 2.2, speed: 650, glow: true, additive: true
          });
          window.MecFX.steam(w / 2, h / 2 - 20, { count: 8, w: 100, rise: 120, min: 30, max: 60, alpha: .4 });
        }, 1100);
      }
      // 章別試験で80%以上。同じ章は週1回だけ算入（同じ章を回して稼げないように）。
      if (o.chPrefix && correct / answered >= 0.8) {
        const wk = _weekKeyJST();
        if (!L.wChEx || L.wChEx.k !== wk) L.wChEx = { k: wk, c: [] };
        if (L.wChEx.c.indexOf(o.chPrefix) < 0) {
          L.wChEx.c.push(o.chPrefix); saveL();
          _bumpMission('chexam80');
        }
      }
    }
    _afterEvent(null);
    // 今回の獲得が1件も無いセッションでは、前回の一覧が結果画面に残ってしまう
    // （_annDone を畳むのは次の _annPush なので、積むものが無いと畳まれない）。
    if (!_annCur && !_annQ.length) _annDone.length = 0;
    // ⚠️ ここが授与トレイを描く唯一のアンカー。_bumpMission も _afterEvent も同期呼び出しなので、
    //    この行に来た時点でキューは完成している＝あとから行が増えて表がガタつくことがない。
    _renderTray();
  }

  // ── ハブパネル ───────────────────────────────────────────────────
  // ハブの炎: 連続日数が前回より伸びた日の初回表示だけ、炎チップから火の粉を立ち上らせる。
  // sessionStorage で1セッション1回に制限し、localStorage で「伸びた日」だけに絞る。
  const K_FLAME_SEEN = 'mec_flame_last_v1';
  function _maybeFlameEmbers(container) {
    if (!container || _reducedMotion()) return;
    try {
      const streak = stats().streak | 0;
      const last = parseInt(localStorage.getItem(K_FLAME_SEEN) || '0', 10) || 0;
      if (streak <= last) { if (streak !== last) localStorage.setItem(K_FLAME_SEEN, String(streak)); return; }
      localStorage.setItem(K_FLAME_SEEN, String(streak));
      if (sessionStorage.getItem('mec_flame_fx_shown')) return;
      sessionStorage.setItem('mec_flame_fx_shown', '1');
      const el = container.querySelector('.gm-flame-emoji');
      if (!el || !window.MecFX) return;
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height * .45;
        try {
          window.MecFX.burst(cx, cy, { count: 30, colors: ['#FFB84D', '#FF7043', '#FFD166', '#FFF3C4'], shapes: ['circle'], tier: 2, glow: true, additive: true, upBias: 140 });
          window.MecFX.glyphBurst(cx, cy, { glyphs: ['🔥', '✨'], count: 4, w: 22, spread: 90 });
        } catch {}
      }, 280);
    } catch {}
  }

  function _rerenderHubPanel() {
    // ハブは「今日のミッション」だけを別ホスト(#gmDaily)へ先に出す。
    // 片方しか無いページ（旧ハブ等）でも壊れないよう、それぞれ独立に判定する。
    const daily = document.getElementById('gmDaily');
    if (daily) {
      renderPanel(daily, { only: 'daily' });
      const cnt = document.getElementById('gmDailyCnt');
      if (cnt) { const m = missionSummary(); cnt.textContent = m.done + '/' + m.total; }
    }
    const host = document.getElementById('gamifyPanel');
    if (host) {
      // 「次のレベルまで」をヒーローへ移したページ（＝#heroLv がある）では出さない
      const moved = !!document.getElementById('heroLv');
      renderPanel(host, (daily || moved) ? { only: daily ? 'rest' : undefined, noXpLine: moved } : undefined);
      _maybeFlameEmbers(host);
    }
  }

  // ── 初期化 ───────────────────────────────────────────────────────
  function _init() {
    _injectCss();
    _rerenderHubPanel();     // index.html（#gamifyPanel がある場合のみ）
    _mountStudyHeader();     // study.html（.st-stats がある場合のみ）
    _checkLevelUp(false);    // 初回は基準記録のみ／同期差分はトースト
    _checkAchievements(false); // 過去データ由来の実績は演出なしで既視化（初回導入時の連発防止）

    // study.html: _chapterMap は非同期構築 → 構築後に星を描画し、再構築(_buildChapterMap)を
    // ラップして以後も追従する（章仕切りは科目の解放/再ロードで作り直されるため）。
    let tries = 0;
    const arm = () => {
      tries++;
      if (typeof window._buildChapterMap === 'function' && !window._buildChapterMap._gmWrapped) {
        const orig = window._buildChapterMap;
        const wrapped = function () {
          const r = orig.apply(this, arguments);
          _chIndex = null;
          (window.requestIdleCallback || setTimeout)(refreshAllStars);
          return r;
        };
        wrapped._gmWrapped = true;
        window._buildChapterMap = wrapped;
      }
      if (typeof _chapterMap !== 'undefined' && _chapterMap.length) {
        refreshAllStars();
        return;
      }
      if (tries < 25) setTimeout(arm, 800);
    };
    setTimeout(arm, 400);

    // 同期完了で他端末の進捗が入ったら表示を追従
    document.addEventListener('mecSyncComplete', () => {
      _statsCache = null;
      _updateHeaderChips();
      _checkLevelUp(false);
      _checkAchievements(false);
      _rerenderHubPanel();
      refreshAllStars();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();

  function goldenDays() {
    const s = _missionStore();
    const g = s.xp && s.xp.ledger ? s.xp.ledger : {};
    const res = [];
    for (const k in g) {
      if (k.startsWith('d:') && g[k] && g[k].__all__) {
        res.push(k.slice(2));
      }
    }
    return res;
  }

  function goldenStreak() {
    const gSet = new Set(goldenDays());
    const d = new Date(Date.now() + 9 * 3600000);
    const today = d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);

    let cur = gSet.has(today) ? today : (gSet.has(yesterday) ? yesterday : null);
    if (!cur) return 0;
    let count = 0;
    const ptr = new Date(cur + 'T00:00:00Z');
    while (gSet.has(ptr.toISOString().slice(0, 10))) {
      count++;
      ptr.setUTCDate(ptr.getUTCDate() - 1);
    }
    return count;
  }

  window.MecGamify = {
    onLap, onAnswer, onFlag, onExamFinish, stats, missionSummary, missionXp, dailyGoal, chapterGrade, focusMission,
    renderPanel, openPanelModal, refreshAllStars, flushCeremonies, goldenDays, goldenStreak,
    // テスト用（_work/test_missions.js / test_gamify_ceremony.js）
    _defs: {
      daily: MISSIONS_DAILY, weekly: MISSIONS_WEEKLY, allXp: MISSION_ALL_XP, focusAxes: FOCUS_AXES,
      ceremony, toast,
      // 併合キューの内訳（旧 _cerQ / _toastQ 相当。未再生ぶんだけを数える）
      cerPending: () => _annQ.filter(x => x.kind === 'cer').length,
      toastPending: () => _annQ.filter(x => x.kind === 'toast').length,
      annState: () => ({
        total: _annTotal(), pos: _annPos(), pending: _annQ.length, playing: !!_annCur,
        done: _annDone.map(_annLabel), queue: _annQ.map(_annLabel),
        kinds: _annDone.concat(_annCur ? [_annCur] : []).concat(_annQ).map(x => x.kind),
      }),
      skipAll: _annSkipAll, skipOne: _annNext, renderTray: _renderTray,
      tapGuardMs: ANN_TAP_GUARD_MS, toastMs: ANN_TOAST_MS, fadeMs: ANN_FADE_MS,
      settleMs: CER_SETTLE_MS, gapMs: CER_GAP_MS,
    },
  };
})();
