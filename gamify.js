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
    { id: 'resp',    name: '呼吸器',     icon: '🌬️', color: '#3B82F6', total: 506 },
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
    { id: 'psy',     name: '精神科',     icon: '💭', color: '#5E60CE', total: 256 },
    { id: 'derm',    name: '皮膚科',     icon: '🩹', color: '#B5654A', total: 249 },
    { id: 'oph',     name: '眼科',       icon: '👁️', color: '#0E7490', total: 213 },
    { id: 'ent',     name: '耳鼻咽喉科', icon: '👂', color: '#0F766E', total: 214 },
    { id: 'uro',     name: '泌尿器科',   icon: '💦', color: '#0891B2', total: 242 },
    { id: 'ortho',   name: '整形外科',   icon: '🦴', color: '#A16207', total: 174 },
    { id: 'anes',    name: '麻酔科',     icon: '💉', color: '#7C3AED', total: 52 },
    { id: 'rad',     name: '放射線科',   icon: '☢️', color: '#475569', total: 60 },
    { id: 'jitsu1',  name: '実力試験Ⅰ', icon: '🎯', color: '#6366F1', total: 160 },
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
    for (const uid in done) {
      const v = done[uid] || 0;
      if (v <= 0) continue;
      laps += v; doneCount++;
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
.gm-mission-ic{font-size:16px;flex-shrink:0;}
.gm-mission-lbl{flex:1;font-size:12px;font-weight:700;color:#EAF0FA;}
.gm-mission.done .gm-mission-lbl{color:#7CEFB2;}
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
#gmToast.show{transform:translate(-50%,0);}
#gmToast .ti{font-size:26px;line-height:1;}
#gmToast .tt{font-size:13px;font-weight:800;color:#FFD166;line-height:1.3;}
#gmToast .ts{font-size:11px;font-weight:700;color:rgba(255,255,255,.75);line-height:1.35;}
/* ── セレモニー（レベルアップ・章/科目制覇・ミッション） ── */
#gmCerOv{position:fixed;inset:0;z-index:var(--z-gm-cer,9550);display:none;align-items:center;justify-content:center;background:rgba(var(--ov-rgb),.55);pointer-events:none;}
#gmCerOv.show{display:flex;}
.gm-cer{text-align:center;animation:gmCerIn .55s cubic-bezier(.2,1.4,.3,1) both;}
@keyframes gmCerIn{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.gm-cer.out{animation:gmCerOut .4s ease both;}
@keyframes gmCerOut{to{transform:scale(1.15);opacity:0}}
.gm-cer-ic{font-size:64px;line-height:1;animation:gmCerFloat 1.6s ease-in-out infinite;}
@keyframes gmCerFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.gm-cer-big{font-size:30px;font-weight:900;letter-spacing:2px;color:#FFD166;text-shadow:0 0 24px rgba(255,209,102,.9),0 2px 8px rgba(0,0,0,.6);margin-top:6px;}
.gm-cer-sub{font-size:15px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.7);margin-top:6px;}
.gm-cer-note{font-size:12px;font-weight:700;color:rgba(255,255,255,.8);text-shadow:0 2px 8px rgba(0,0,0,.7);margin-top:4px;}
.gm-cer-stars{font-size:22px;letter-spacing:4px;color:#FFD166;text-shadow:0 0 16px rgba(255,209,102,.8);margin-top:4px;}
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

  /* ── 演出の保留（試験中は溜めて結果画面で再生する） ────────────────────
     ⚠️ 試験モード中はトーストもセレモニーも「出さずに溜める」。理由は2つ:
       ① 全画面セレモニー(2.4秒)は tier 演出の真上に被る。_microLapFx / _lapMilestoneFx は
          先頭で examMode を見て黙るのに、一番大きいこれだけが素通しだった。
       ② トーストは top:14px 固定＝iPad では約180pxある試験ヘッダ(.st-hdr)の裏に出る。
          出しても読めないので、出さずに取っておく方が情報が残る。
     溜めたものは結果画面で順に再生する。再生の開始は examMode 解除の直後ではなく
     _quiet() が置く静粛時間の後——showExamSummary はランクスタンプ(950ms)と祝賀花火(980ms)を
     自前で走らせるので、その上に重ねると両方読めなくなる。静粛時間は onExamFinish が置く
     （結果画面の末尾で必ず1回呼ばれる＝セッションの終わりを知る唯一の確実な合図）。 */
  const CER_SETTLE_MS = 2000;   // 結果画面の祝賀演出が終わるまでの待ち
  const CER_GAP_MS = 280;       // セレモニーを続けて出すときの間（詰めると1つの演出に見える）
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
      _drainToast(); _drainCer();
    }, 400);
  }
  // 保留を解いて今すぐ再生する（テスト・手動用）
  function flushCeremonies() {
    _quietUntil = 0;
    if (_holdTimer) { clearInterval(_holdTimer); _holdTimer = null; }
    _drainToast(); _drainCer();
  }

  // ── トースト（キュー式） ─────────────────────────────────────────
  const _toastQ = [];
  let _toastBusy = false;
  // snd … 表示の瞬間に鳴らす音（保留されたトーストは再生時に鳴る＝音と絵がずれない）
  function toast(icon, title, sub, snd) {
    _toastQ.push({ icon, title, sub, snd });
    _drainToast();
  }
  function _drainToast() {
    if (_toastBusy || !_toastQ.length) return;
    if (_fxHeld()) { _armHold(); return; }
    _toastBusy = true;
    let el = document.getElementById('gmToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gmToast';
      el.innerHTML = '<span class="ti"></span><span><div class="tt"></div><div class="ts"></div></span>';
      document.body.appendChild(el);
    }
    const { icon, title, sub, snd } = _toastQ.shift();
    el.querySelector('.ti').textContent = icon;
    el.querySelector('.tt').textContent = title;
    el.querySelector('.ts').textContent = sub || '';
    requestAnimationFrame(() => el.classList.add('show'));
    try { snd && snd(); } catch {}
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { _toastBusy = false; _drainToast(); }, 420);
    }, 3000);
  }

  /* ── セレモニー（全画面・自動フェード・キュー式） ──────────────────────
     ⚠️ 以前は overlay の innerHTML を上書きするだけでキューが無く、近接して2つ発火すると
        先の1つが誰にも見られないまま消えていた。しかもそれが起きる条件が「40問目の解答」
        そのもので、_bumpMission → MISSION COMPLETE の直後に同じ同期呼び出しの中で
        _afterEvent → LEVEL UP が走り、MISSION COMPLETE は常に上書きされて消えていた。
        toast() と同じくキューに積み、1つが消えてから次を出す。 */
  const _cerQ = [];
  let _cerBusy = false;
  function ceremony(html, opts) {
    _cerQ.push({ html, opts: opts || {} });
    _drainCer();
  }
  function _drainCer() {
    if (_cerBusy || !_cerQ.length) return;
    if (_fxHeld()) { _armHold(); return; }
    _cerBusy = true;
    const { html, opts } = _cerQ.shift();
    let ov = document.getElementById('gmCerOv');
    if (!ov) { ov = document.createElement('div'); ov.id = 'gmCerOv'; document.body.appendChild(ov); }
    ov.innerHTML = '<div class="gm-cer">' + html + '</div>';
    ov.classList.add('show');
    const dur = opts.dur || 2300;
    setTimeout(() => {
      const c = ov.querySelector('.gm-cer');
      if (c) c.classList.add('out');
      setTimeout(() => {
        ov.classList.remove('show');
        _cerBusy = false;
        if (_cerQ.length) setTimeout(_drainCer, CER_GAP_MS);
      }, 420);
    }, dur);
    try { opts.fx && opts.fx(); } catch {}
    try { opts.snd && opts.snd(); } catch {}
  }

  function _fxConfetti(big) {
    if (!window.MecFX) return;
    try {
      window.MecFX.confetti({ count: big ? 90 : 45, colors: ['#FFD166', '#3DD68C', '#60A5FA', '#FF5E8A', '#A78BFA'], big: !!big });
      if (big) window.MecFX.fireworks({ count: 4, colors: ['#FFD166', '#3DD68C', '#60A5FA', '#FF5E8A'], tier: 5 });
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
          { fx: () => _fxConfetti(true), snd: SND.levelup, dur: 2400 }
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
  const MISSIONS_DAILY = [
    { id: 'ans',     tier: 'core',  xp: 40, icon: '📝', label: '40問 解答する',           target: 40, counter: 'ans' },
    { id: 'exam',    tier: 'core',  xp: 40, icon: '🎓', label: '試験セッション1本(10問+)', target: 1,  counter: 'exam' },
    { id: 'cor',     tier: 'core',  xp: 60, icon: '✅', label: '試験で20問 正解',          target: 20, counter: 'cor' },
    { id: 'srs',     tier: 'bonus', xp: 60, icon: '🔁', label: 'SRS復習を20問 こなす',     target: 20, counter: 'srs' },
    { id: 'redo',    tier: 'bonus', xp: 70, icon: '♻️', label: '落とした問題を10問 奪回',  target: 10, counter: 'redo' },
    { id: 'subj',    tier: 'bonus', xp: 50, icon: '🧭', label: '科目を2つ以上またぐ',       target: 2,  counter: 'subj' },
    { id: 'acc',     tier: 'bonus', xp: 50, icon: '🎯', label: '正答率80%以上を1回',       target: 1,  counter: 'acc80' },
    { id: 'perfect', tier: 'bonus', xp: 80, icon: '💯', label: '試験で全問正解を1回',      target: 1,  counter: 'perfect' },
  ];
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
          toast(def.icon, 'ミッション達成！', def.label + '（+' + def.xp + ' XP）', SND.mission);
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
            { fx: () => _fxConfetti(true), snd: SND.clear, dur: 2400 }
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
  // 目標も進捗も日次ミッション ans（40問 解答する）から借りる＝ゲージのすぐ下に並ぶ
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

  function _chapterStars(entry) {
    const my = _g('myrate_v1', {});
    let t = 0, c = 0, answered = 0;
    entry.uids.forEach(u => { const r = my[u]; if (r && r.total > 0) { answered++; t += r.total; c += r.correct || 0; } });
    if (!t || answered < entry.uids.length * 0.5) return 0; // 章の半分以上を解答してから評価
    const pct = c / t * 100;
    return pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
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
    const title = (entry.divEl && entry.divEl.childNodes[0] && entry.divEl.childNodes[0].textContent || '').trim() || '章';
    const n = _chapterStars(entry);
    ceremony(
      '<div class="gm-cer-ic">🏆</div><div class="gm-cer-big">章 制覇！</div>' +
      '<div class="gm-cer-sub">' + title.replace(/[<>&]/g, '') + '</div>' +
      (n ? '<div class="gm-cer-stars">' + '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(3 - n) + '</span></div>' : '') +
      '<div class="gm-cer-note">全' + entry.uids.length + '問クリア</div>',
      { fx: () => _fxConfetti(false), snd: SND.clear, dur: 2300 }
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
      '<div class="gm-cer-ic">' + sub.icon + '</div><div class="gm-cer-big">' + sub.name + ' 全問制覇！！</div>' +
      '<div class="gm-cer-sub">' + sub.total + '問 完全走破</div>' +
      '<div class="gm-cer-note">「' + sub.name + 'マスター」の称号を獲得</div>',
      { fx: () => _fxConfetti(true), snd: SND.subject, dur: 3000 }
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
    const row = document.querySelector('.st-stats');
    if (!row || document.getElementById('gmLvChip')) return;
    // キーボード操作可能にするため <button>（見た目は .st-stat ＋チップ用リセットで維持）
    const lv = document.createElement('button');
    lv.type = 'button';
    lv.className = 'st-stat gm-lv-chip';
    lv.id = 'gmLvChip';
    lv.title = 'タップでレベル・実績・ミッションを表示';
    lv.innerHTML = 'Lv.<b id="gmLvNum">–</b><span class="gm-chip-bar"><span class="gm-chip-fill" id="gmChipFill" style="width:0%"></span></span>';
    lv.addEventListener('click', openPanelModal);
    const mi = document.createElement('button');
    mi.type = 'button';
    mi.className = 'st-stat gm-mission-chip';
    mi.id = 'gmMissionChip';
    mi.title = '今日のミッション（必須が揃うと緑）';
    mi.textContent = '🎯 –';
    mi.addEventListener('click', openPanelModal);
    row.appendChild(lv);
    row.appendChild(mi);
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
      // data-tier は index.html（ハブ）が「必須だけ揃ったか」を判定するのに使う
      return '<div class="gm-mission' + (done ? ' done' : '') + (behind ? ' behind' : '') +
        '" data-tier="' + d.tier + '">' +
        '<span class="gm-mission-ic">' + (done ? '✅' : d.icon) + '</span>' +
        '<span class="gm-mission-lbl">' + d.label + '</span>' +
        '<span class="gm-mission-bar"><span class="gm-mission-fill" style="width:' + Math.round(ratio * 100) + '%"></span>' +
          (pace != null && !done ? '<i class="gm-pace" style="left:' + (pace * 100).toFixed(1) + '%"></i>' : '') +
        '</span>' +
        '<span class="gm-mission-num">' + cur + '/' + d.target + '</span></div>';
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

  function onLap(uid, btn) {
    const bumps = ['ans']; // 「済」も解答数ミッションに算入
    if (_isHardQ(uid)) bumps.push('hard');
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
    _bumpMission(bumps.concat(_dailyFirstBumps(uid)));
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

  window.MecGamify = {
    onLap, onAnswer, onFlag, onExamFinish, stats, missionSummary, missionXp, dailyGoal,
    renderPanel, openPanelModal, refreshAllStars, flushCeremonies,
    // テスト用（_work/test_missions.js / test_gamify_ceremony.js）
    _defs: {
      daily: MISSIONS_DAILY, weekly: MISSIONS_WEEKLY, allXp: MISSION_ALL_XP,
      ceremony, toast, cerPending: () => _cerQ.length, toastPending: () => _toastQ.length,
      settleMs: CER_SETTLE_MS, gapMs: CER_GAP_MS,
    },
  };
})();
