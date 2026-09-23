// hub_opening.js — ハブの「1日の最初のブリーフィング」と「週の結果発表」（2026-09-23 新設）
//
// その日はじめてハブを開いたときに1回だけ、全画面で数枚のページを見せる。
//   ① 前回のリザルト（直近の学習日の解答数・正答率・最長連続正解・難問突破・学習時間・連続日数・Lv）
//   ② 週の結果発表（その週はじめて開いたときだけ。先週の成績・ランク・ミッションのメダル・伸びた科目）
//   ③ 今日のブリーフィング（国試までの日数・今日の目標・復習待ち・今日のコアミッション）
//
// ⚠️ 材料は全部 localStorage と、ハブが既に読んでいるグローバル（MECSync / MecAttempts /
//    MecGamify / MEC_RATE / MM_SUBJECTS）だけ。新しい fetch を足さないこと（ハブが重くなる）。
// ⚠️ 既視の記録 mec_hub_opening_v1 は UIローカル・非同期（端末ごとに1回見せてよい）。
//    progress.js の同期対象へ足さないこと。
// ⚠️ 前回の結果を「昨日」に固定しない。休んだ翌日に空のページを出すことになるので、
//    今日より前で最後に学習した日を拾う（activity_v1 が正本）。
// ⚠️ 週の結果発表は「月曜」ではなく「その週に最初に開いた日」。月曜に開かない週に見逃すため。
// ⚠️ 演出は reduced-motion で止めるが、ページ自体は出す（中身は情報なので捨てない）。
(function () {
  'use strict';

  const K_SEEN = 'mec_hub_opening_v1';   // { day:'YYYY-MM-DD', week:'YYYY-MM-DD(月曜)' }
  const DAY_MS = 86400000;

  // ── 日付（すべて JST。activity_v1・ミッション・attempts の日境界と揃える） ──
  function jstDate(ms) { return new Date((ms == null ? Date.now() : ms) + 9 * 3600000); }
  function dayStr(ms) { return jstDate(ms).toISOString().slice(0, 10); }
  function addDays(ds, n) {
    const d = new Date(ds + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function mondayOf(ds) {
    const d = new Date(ds + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
    return d.toISOString().slice(0, 10);
  }
  function diffDays(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / DAY_MS); }
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  function jaDate(ds) {
    const d = new Date(ds + 'T00:00:00Z');
    return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日(' + WD[d.getUTCDay()] + ')';
  }
  function shortDate(ds) { const d = new Date(ds + 'T00:00:00Z'); return (d.getUTCMonth() + 1) + '/' + d.getUTCDate(); }

  function _g(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch { return d; } }
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function _fmt(n) { return Number(n || 0).toLocaleString('ja-JP'); }
  function _fmtMin(m) { m = Math.round(m || 0); return m >= 60 ? Math.floor(m / 60) + '時間' + (m % 60 ? (m % 60) + '分' : '') : m + '分'; }

  // ── 集計（純関数。src を差し替えるとテストで回せる） ─────────────────────
  function _src() {
    return {
      activity: _g('activity_v1', {}),
      studytime: _g('studytime_v1', {}),
      missions: _g('mec_missions_v1', {}),
      srs: _g('mec_srs_v1', {}),
      attempts: (window.MecAttempts && MecAttempts.all) ? MecAttempts.all() : [],
      rate: window.MEC_RATE || {},
      subjects: window.MM_SUBJECTS || [],
    };
  }

  function missionSum(src, period, key, counter) {
    const bucket = ((src.missions || {})[period] || {})[key] || {};
    let n = 0;
    for (const dev in bucket) n += (bucket[dev] && bucket[dev][counter]) || 0;
    return n;
  }

  function subjOf(uid) { const i = uid.indexOf('_ch'); return i > 0 ? uid.slice(0, i) : ''; }

  // 解答ログ（試験モード・SRS復習・章別試験）を日付の範囲 [from, to] で集計する
  function attemptStats(src, from, to) {
    const rows = src.attempts.filter(a => { const d = dayStr(a.ms); return d >= from && d <= to; });
    let ok = 0, hardOk = 0;
    const bySess = {}, bySubj = {};
    rows.forEach(a => {
      if (a.ok) ok++;
      const r = src.rate[a.uid];
      if (a.ok && typeof r === 'number' && r < 60) hardOk++;
      (bySess[a.sess || '_'] = bySess[a.sess || '_'] || []).push(a);
      const s = subjOf(a.uid);
      if (s) { const b = bySubj[s] = bySubj[s] || { t: 0, c: 0 }; b.t++; if (a.ok) b.c++; }
    });
    // 最長連続正解はセッションの中だけで数える（別のセッションをまたいで繋げない）
    let bestRun = 0;
    Object.keys(bySess).forEach(k => {
      let run = 0;
      bySess[k].sort((x, y) => (x.n - y.n) || (x.t - y.t)).forEach(a => {
        run = a.ok ? run + 1 : 0; if (run > bestRun) bestRun = run;
      });
    });
    return {
      total: rows.length, ok, acc: rows.length ? Math.round(ok / rows.length * 100) : null,
      hardOk, bestRun, sessions: Object.keys(bySess).length, bySubj,
    };
  }

  // 今日より前で最後に学習した日（activity_v1 が正本）。無ければ null。
  function lastStudyDay(src, today) {
    const ks = Object.keys(src.activity || {}).filter(k => k < today && (src.activity[k] || 0) > 0).sort();
    return ks.length ? ks[ks.length - 1] : null;
  }

  function calcLast(src, today) {
    const day = lastStudyDay(src, today);
    if (!day) return null;
    const at = attemptStats(src, day, day);
    const ans = missionSum(src, 'd', day, 'ans');
    return {
      day, gap: diffDays(day, today),
      ans: Math.max(ans, at.total),             // 日次バケットが14日で切れた後は解答ログで代用
      at, minutes: (src.studytime || {})[day] || 0,
    };
  }

  const RANKS = [
    { r: 'S', col: '#FFD166', say: '文句なしの一週間。この勢いを今週も。' },
    { r: 'A', col: '#7CE3A1', say: 'コアミッション完走。上出来の一週間。' },
    { r: 'B', col: '#6CB8FF', say: 'あと一歩。今週はコアの完走を狙おう。' },
    { r: 'C', col: '#C7A2FF', say: '立て直しの週。今日の1セッションから。' },
  ];

  function calcWeek(src, monday, weeklyDefs) {
    const sunday = addDays(monday, 6);
    const prevMon = addDays(monday, -7);
    const at = attemptStats(src, monday, sunday);
    const prev = attemptStats(src, prevMon, addDays(monday, -1));
    const days = [];
    let minutes = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      days.push((src.activity[d] || 0) > 0);
      minutes += (src.studytime || {})[d] || 0;
    }
    const wAns = missionSum(src, 'w', monday, 'ans');
    const pAns = missionSum(src, 'w', prevMon, 'ans');
    const ans = Math.max(wAns, at.total), ansPrev = Math.max(pAns, prev.total);
    const defs = weeklyDefs || [];
    const missions = defs.map(d => ({
      icon: d.icon, label: d.label, tier: d.tier,
      hit: missionSum(src, 'w', monday, d.counter) >= d.target,
    }));
    const coreDefs = missions.filter(m => m.tier === 'core');
    const coreDone = coreDefs.filter(m => m.hit).length;
    const bonusDone = missions.filter(m => m.tier !== 'core' && m.hit).length;
    let rank;
    if (coreDefs.length && coreDone === coreDefs.length && bonusDone >= 3) rank = RANKS[0];
    else if (coreDefs.length && coreDone === coreDefs.length) rank = RANKS[1];
    else if (coreDone >= 2 || (coreDefs.length === 0 && days.filter(Boolean).length >= 5)) rank = RANKS[2];
    else rank = RANKS[3];
    // 正答率が一番高い科目（10問以上）と、先週から一番伸びた科目（両週とも10問以上）
    const name = sid => { const s = src.subjects.find(x => x.sid === sid); return s ? { icon: s.icon, label: s.label } : { icon: '📘', label: sid }; };
    let best = null, up = null;
    Object.keys(at.bySubj).forEach(sid => {
      const b = at.bySubj[sid]; if (b.t < 10) return;
      const acc = b.c / b.t * 100;
      if (!best || acc > best.acc) best = Object.assign({ sid, acc: Math.round(acc), n: b.t }, name(sid));
      const p = prev.bySubj[sid];
      if (p && p.t >= 10) {
        const d = acc - p.c / p.t * 100;
        if (d > 0 && (!up || d > up.d)) up = Object.assign({ sid, d: Math.round(d) }, name(sid));
      }
    });
    return {
      monday, sunday, ans, ansPrev, at, prev, days, studyDays: days.filter(Boolean).length, minutes,
      missions, coreDone, coreTotal: coreDefs.length, hitCount: missions.filter(m => m.hit).length,
      rank, best, up,
    };
  }

  function calcToday(src, today) {
    let due = 0;
    for (const uid in src.srs) { const e = src.srs[uid]; if (e && e.nextReview && e.nextReview <= today) due++; }
    const ex = (window.MECSync && MECSync.examDate) ? MECSync.examDate() : '';
    const daysLeft = /^\d{4}-\d{2}-\d{2}$/.test(ex) ? diffDays(today, ex) : null;
    const G = window.MecGamify;
    const goal = (G && G.dailyGoal) ? G.dailyGoal() : { target: 100, count: 0 };
    // 解答数のミッション（ans）は「今日の目標」の行と同じ数字なので並べない
    const core = (G && G._defs && G._defs.daily) ? G._defs.daily.filter(d => d.tier === 'core' && d.counter !== 'ans') : [];
    return { today, due, daysLeft, examDate: ex, goal, core };
  }

  // 日替わりのひと言（乱数にしない＝同じ日に開き直しても同じ文）
  const LINES = {
    far: ['積み上げた1問が、2月の1点になる。', '今日の復習が、明日の得点源。', '基礎の穴を今のうちに全部ふさぐ。', '量は裏切らない。今日も淡々と。'],
    mid: ['ここからは「落とさない」練習。', '弱点を1つ、今日つぶす。', '全国が取る問題を確実に取る。', '仕上げの季節。1問ずつ確実に。'],
    near: ['直前期。新しいことより、確実に取る。', '必修と禁忌を最後まで磨く。', '体調も実力のうち。今日も良いリズムで。', 'ここまで来た。あとは出し切るだけ。'],
  };
  function lineFor(today, daysLeft) {
    const pool = daysLeft == null || daysLeft > 120 ? LINES.far : daysLeft > 45 ? LINES.mid : LINES.near;
    let h = 0; for (let i = 0; i < today.length; i++) h = (h * 31 + today.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  }

  // 出すページの組み立て。seen は mec_hub_opening_v1。
  function buildPages(src, today, seen, weeklyDefs) {
    const pages = [];
    const last = calcLast(src, today);
    pages.push({ kind: 'last', data: last });
    const thisMon = mondayOf(today);
    if ((seen || {}).week !== thisMon) {
      const w = calcWeek(src, addDays(thisMon, -7), weeklyDefs);
      if (w.studyDays > 0 || w.ans > 0) pages.push({ kind: 'week', data: w });
    }
    pages.push({ kind: 'today', data: calcToday(src, today) });
    return pages;
  }

  // ── 描画 ─────────────────────────────────────────────────────────────
  const CSS = `
#mecOpenOv{position:fixed;left:0;top:0;width:100%;height:100vh;height:100dvh;z-index:var(--z-gm-cer,9550);
  display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;
  background:radial-gradient(120% 90% at 50% 20%,rgba(var(--ov-rgb,8,10,20),.72),rgba(var(--ov-rgb,8,10,20),.93));
  opacity:0;transition:opacity .35s ease;-webkit-tap-highlight-color:transparent;}
#mecOpenOv.show{opacity:1;}
#mecOpenOv.out{opacity:0;transition:opacity .3s ease;}
.op-card{position:relative;width:100%;max-width:440px;max-height:calc(100% - 8px);overflow-y:auto;overscroll-behavior:contain;
  border-radius:22px;padding:22px 20px 16px;box-sizing:border-box;color:#fff;
  background:linear-gradient(160deg,rgba(28,32,52,.97),rgba(12,14,26,.98));
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 0 0 1px rgba(0,0,0,.4),0 24px 70px rgba(0,0,0,.6),0 0 60px color-mix(in srgb,var(--or,#FF9A3C) 22%,transparent);}
.op-card::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.07) 45%,transparent 60%) no-repeat;background-size:250% 100%;}
html.op-fx .op-card{animation:opIn .6s cubic-bezier(.2,1.25,.35,1) both;}
html.op-fx .op-card::before{animation:opSheen 1.6s .35s ease-out both;}
@keyframes opIn{0%{transform:translateY(26px) scale(.9);opacity:0}100%{transform:none;opacity:1}}
@keyframes opSheen{0%{background-position:120% 0}100%{background-position:-60% 0}}
.op-kick{display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--or,#FF9A3C);}
.op-kick b{font-family:var(--font-display,inherit);font-size:12px;letter-spacing:.2em;}
.op-kick span{margin-left:auto;letter-spacing:.04em;color:rgba(255,255,255,.62);font-weight:700;}
.op-ttl{font-size:21px;font-weight:900;margin:6px 0 12px;letter-spacing:.02em;}
.op-hero{display:flex;align-items:baseline;justify-content:center;gap:8px;margin:4px 0 12px;}
.op-big{font-family:var(--font-display,inherit);font-size:64px;line-height:1;font-weight:900;font-variant-numeric:tabular-nums;
  background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--or,#FF9A3C) 70%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 18px color-mix(in srgb,var(--or,#FF9A3C) 55%,transparent));}
.op-unit{font-size:15px;font-weight:800;color:rgba(255,255,255,.8);}
.op-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.op-tile{border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);min-width:0;}
html.op-fx .op-tile{animation:opRise .5s cubic-bezier(.2,1.3,.4,1) both;animation-delay:calc(.25s + var(--i,0) * .08s);}
@keyframes opRise{0%{transform:translateY(12px) scale(.94);opacity:0}100%{transform:none;opacity:1}}
.op-tile i{display:block;font-style:normal;font-size:10.5px;font-weight:800;color:rgba(255,255,255,.6);letter-spacing:.04em;}
.op-tile b{display:block;font-family:var(--font-display,inherit);font-size:22px;font-weight:900;margin-top:2px;font-variant-numeric:tabular-nums;white-space:nowrap;}
.op-tile small{font-size:11px;font-weight:700;color:rgba(255,255,255,.6);margin-left:3px;}
.op-tile .up{color:#7CE3A1;} .op-tile .dn{color:#FFB86B;}
.op-row{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);}
html.op-fx .op-row{animation:opRise .5s cubic-bezier(.2,1.3,.4,1) both;animation-delay:calc(.45s + var(--i,0) * .08s);}
.op-row .ic{font-size:24px;line-height:1;flex-shrink:0;}
.op-row .tx{flex:1;min-width:0;font-size:13px;font-weight:700;line-height:1.45;color:rgba(255,255,255,.88);}
.op-row .tx b{color:#fff;font-weight:900;}
.op-flame{display:inline-block;}
html.op-fx .op-flame{animation:opFlame 1.1s ease-in-out infinite alternate;transform-origin:50% 90%;}
@keyframes opFlame{0%{transform:scale(1) rotate(-4deg)}100%{transform:scale(1.18) rotate(4deg)}}
.op-lv{margin-top:10px;}
.op-lv-top{display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:rgba(255,255,255,.75);}
.op-lv-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:5px;}
.op-lv-bar i{display:block;height:100%;width:var(--w,0%);border-radius:inherit;
  background:linear-gradient(90deg,var(--or,#FF9A3C),#FFD166);box-shadow:0 0 12px var(--or,#FF9A3C);}
html.op-fx .op-lv-bar i{animation:opBar 1.2s .5s cubic-bezier(.2,.9,.3,1) both;}
@keyframes opBar{from{width:0}}
.op-rank{position:relative;display:flex;align-items:center;justify-content:center;gap:14px;margin:4px 0 10px;}
.op-rank-mark{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:var(--font-display,inherit);font-size:58px;font-weight:900;color:var(--rk);
  border:4px solid var(--rk);box-shadow:0 0 30px var(--rk),inset 0 0 22px color-mix(in srgb,var(--rk) 40%,transparent);
  text-shadow:0 0 18px var(--rk);transform:rotate(-8deg);}
html.op-fx .op-rank-mark{animation:opStamp .55s .35s cubic-bezier(.3,1.6,.5,1) both;}
@keyframes opStamp{0%{transform:scale(3.2) rotate(-24deg);opacity:0}70%{transform:scale(.92) rotate(-6deg);opacity:1}100%{transform:scale(1) rotate(-8deg)}}
.op-rank-say{font-size:13px;font-weight:800;line-height:1.5;max-width:210px;}
.op-days{display:flex;gap:6px;justify-content:space-between;margin-top:4px;}
.op-day{flex:1;text-align:center;font-size:10px;font-weight:800;color:rgba(255,255,255,.45);}
.op-day i{display:block;height:22px;border-radius:7px;margin-bottom:3px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);}
.op-day.on{color:#fff;}
.op-day.on i{background:linear-gradient(180deg,#FFD166,var(--or,#FF9A3C));border-color:transparent;box-shadow:0 0 12px color-mix(in srgb,var(--or,#FF9A3C) 70%,transparent);}
html.op-fx .op-day.on i{animation:opLight .45s both;animation-delay:calc(.5s + var(--i,0) * .09s);}
@keyframes opLight{0%{opacity:.1;transform:scaleY(.3)}70%{transform:scaleY(1.15)}100%{opacity:1;transform:none}}
.op-medals{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
.op-medal{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);filter:grayscale(1);opacity:.35;}
.op-medal.hit{filter:none;opacity:1;background:radial-gradient(circle at 35% 30%,rgba(255,236,170,.4),rgba(255,180,60,.14));
  border-color:rgba(255,209,102,.7);box-shadow:0 0 12px rgba(255,209,102,.45);}
html.op-fx .op-medal.hit{animation:opPop .5s cubic-bezier(.3,1.7,.5,1) both;animation-delay:calc(.7s + var(--i,0) * .1s);}
@keyframes opPop{0%{transform:scale(0) rotate(-40deg)}100%{transform:none}}
.op-count{text-align:center;margin:2px 0 8px;}
.op-count .lbl{font-size:12px;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:.1em;}
.op-count .num{font-family:var(--font-display,inherit);font-size:74px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;
  color:#fff;text-shadow:0 0 26px color-mix(in srgb,var(--or,#FF9A3C) 80%,transparent);}
.op-count .num small{font-size:20px;margin-left:4px;}
.op-line{margin-top:12px;text-align:center;font-size:13.5px;font-weight:800;color:#FFE3A8;line-height:1.5;}
.op-foot{display:flex;align-items:center;gap:10px;margin-top:16px;}
.op-dots{display:flex;gap:5px;}
.op-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.22);}
.op-dots i.on{background:var(--or,#FF9A3C);box-shadow:0 0 8px var(--or,#FF9A3C);}
.op-skip{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.55);font-size:12px;font-weight:700;padding:10px 6px;cursor:pointer;}
.op-next{border:none;border-radius:99px;padding:11px 20px;font-size:14px;font-weight:900;cursor:pointer;color:#1A1206;
  background:linear-gradient(180deg,#FFE08A,var(--or,#FF9A3C));box-shadow:0 6px 20px color-mix(in srgb,var(--or,#FF9A3C) 50%,transparent);}
.op-next:active{scale:.96;}
.op-go{display:block;text-align:center;margin-top:10px;padding:11px;border-radius:14px;font-size:13.5px;font-weight:900;text-decoration:none;
  color:#fff;background:linear-gradient(90deg,rgba(80,150,255,.35),rgba(80,150,255,.18));border:1px solid rgba(120,180,255,.45);}
@media (max-width:380px){.op-big{font-size:54px}.op-count .num{font-size:62px}.op-tile b{font-size:19px}.op-rank-mark{width:80px;height:80px;font-size:50px}}
@media (prefers-reduced-motion:reduce){#mecOpenOv *{animation:none!important}}
`;

  function _injectCss() {
    if (document.getElementById('mecOpenCss')) return;
    const st = document.createElement('style'); st.id = 'mecOpenCss'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function _reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function _fxOk() { return !!window.MecFX && !_reduced() && !document.hidden; }

  function tile(i, label, value, sub) {
    return '<div class="op-tile" style="--i:' + i + '"><i>' + label + '</i><b>' + value + (sub ? '<small>' + sub + '</small>' : '') + '</b></div>';
  }

  function htmlLast(d) {
    const G = window.MecGamify;
    const s = (G && G.stats) ? G.stats() : null;
    const streak = (window.MECSync && MECSync.calcStreak) ? MECSync.calcStreak() : 0;
    const lv = s ? '<div class="op-lv"><div class="op-lv-top"><span>Lv.' + s.level + '　' + _esc(s.title) + '</span><span>次のLvまで ' + _fmt(Math.max(0, s.lvNeedXp - s.lvCurXp)) + ' XP</span></div>' +
      '<div class="op-lv-bar"><i style="--w:' + Math.round(s.lvProgress * 100) + '%"></i></div></div>' : '';
    if (!d) {
      return '<div class="op-kick"><b>WELCOME</b></div><div class="op-ttl">はじめの一歩を踏み出そう</div>' +
        '<div class="op-row"><span class="ic">🌱</span><span class="tx">まだ学習の記録がありません。今日の1問目から、記録が積み上がっていきます。</span></div>' + lv;
    }
    const when = d.gap === 1 ? '昨日' : d.gap + '日前';
    const at = d.at;
    const tiles = [];
    tiles.push(tile(0, '正答率', at.acc == null ? '—' : at.acc + '%', at.total ? at.total + '問中' : '試験モードなし'));
    tiles.push(tile(1, '最長連続正解', at.bestRun ? at.bestRun : '—', at.bestRun ? '連続' : ''));
    tiles.push(tile(2, '難問突破', _fmt(at.hardOk), '問'));
    tiles.push(tile(3, '学習時間', d.minutes ? _fmtMin(d.minutes) : '—', ''));
    let streakRow;
    const todayDone = ((_g('activity_v1', {}))[dayStr()] || 0) > 0;
    if (todayDone && streak > 0) {
      streakRow = '<div class="op-row" style="--i:0"><span class="ic op-flame">🔥</span><span class="tx">連続 <b>' + streak + '日</b>。今日の火はもう点いている。</span></div>';
    } else if (d.gap === 1 && streak > 0) {
      streakRow = '<div class="op-row" style="--i:0"><span class="ic op-flame">🔥</span><span class="tx">連続 <b>' + streak + '日</b>。今日やれば <b>' + (streak + 1) + '日目</b> に火が伸びる。</span></div>';
    } else {
      streakRow = '<div class="op-row" style="--i:0"><span class="ic op-flame">🕯️</span><span class="tx">連続記録はいったん途切れました。<b>今日から再点火</b>しよう。</span></div>';
    }
    return '<div class="op-kick"><b>LAST RESULT</b><span>' + when + '・' + jaDate(d.day) + '</span></div>' +
      '<div class="op-ttl">' + (d.gap === 1 ? '昨日のリザルト' : '前回のリザルト') + '</div>' +
      '<div class="op-hero"><span class="op-big" data-cu="' + d.ans + '">' + _fmt(d.ans) + '</span><span class="op-unit">問 解答</span></div>' +
      '<div class="op-grid">' + tiles.join('') + '</div>' + streakRow + lv;
  }

  function htmlWeek(w) {
    const dAns = w.ansPrev ? Math.round((w.ans - w.ansPrev) / w.ansPrev * 100) : null;
    const dAcc = (w.at.acc != null && w.prev.acc != null) ? w.at.acc - w.prev.acc : null;
    const sgn = (v, u) => v == null ? '' : '<span class="' + (v >= 0 ? 'up' : 'dn') + '">' + (v >= 0 ? '+' : '') + v + u + '</span>';
    const days = w.days.map((on, i) => '<div class="op-day' + (on ? ' on' : '') + '" style="--i:' + i + '"><i></i>' + WD[(i + 1) % 7] + '</div>').join('');
    const medals = w.missions.map((m, i) => '<span class="op-medal' + (m.hit ? ' hit' : '') + '" style="--i:' + i + '" title="' + _esc(m.label) + '">' + m.icon + '</span>').join('');
    let subj = '';
    if (w.best) subj += '<div class="op-row" style="--i:1"><span class="ic">' + w.best.icon + '</span><span class="tx">いちばん取れた科目は <b>' + _esc(w.best.label) + '</b>（正答率 ' + w.best.acc + '%・' + w.best.n + '問）</span></div>';
    if (w.up && (!w.best || w.up.sid !== w.best.sid)) subj += '<div class="op-row" style="--i:2"><span class="ic">📈</span><span class="tx">いちばん伸びた科目は <b>' + w.up.icon + ' ' + _esc(w.up.label) + '</b>（先週比 +' + w.up.d + 'pt）</span></div>';
    else if (w.up) subj += '<div class="op-row" style="--i:2"><span class="ic">📈</span><span class="tx">しかも先週から <b>+' + w.up.d + 'pt</b> 伸びています</span></div>';
    return '<div class="op-kick"><b>WEEKLY REPORT</b><span>' + shortDate(w.monday) + '〜' + shortDate(w.sunday) + '</span></div>' +
      '<div class="op-ttl">先週の結果発表</div>' +
      '<div class="op-rank" style="--rk:' + w.rank.col + '"><div class="op-rank-mark">' + w.rank.r + '</div>' +
      '<div class="op-rank-say">' + _esc(w.rank.say) + '<br><span style="color:rgba(255,255,255,.6);font-size:11.5px">コアミッション ' + w.coreDone + '/' + w.coreTotal + '・全体 ' + w.hitCount + '/' + w.missions.length + '</span></div></div>' +
      '<div class="op-grid">' +
        tile(0, '解答数', '<span data-cu="' + w.ans + '">' + _fmt(w.ans) + '</span>', '問 ' + sgn(dAns, '%')) +
        tile(1, '正答率', w.at.acc == null ? '—' : w.at.acc + '%', sgn(dAcc, 'pt')) +
        tile(2, '学習日', w.studyDays + '/7', '日') +
        tile(3, '学習時間', w.minutes ? _fmtMin(w.minutes) : '—', '') +
      '</div>' +
      '<div class="op-days" style="margin-top:10px">' + days + '</div>' +
      '<div class="op-medals">' + medals + '</div>' + subj;
  }

  function htmlToday(t) {
    const cnt = t.daysLeft != null && t.daysLeft >= 0
      ? '<div class="op-count"><div class="lbl">医師国家試験まで</div><div class="num"><span data-cu="' + t.daysLeft + '">' + t.daysLeft + '</span><small>日</small></div></div>'
      : '';
    const rows = [];
    rows.push('<div class="op-row" style="--i:0"><span class="ic">🎯</span><span class="tx">今日の目標 <b>' + _fmt(t.goal.target) + '問</b>' + (t.goal.count ? '（すでに ' + _fmt(t.goal.count) + '問）' : '') + '</span></div>');
    rows.push('<div class="op-row" style="--i:1"><span class="ic">🔔</span><span class="tx">' + (t.due ? '復習待ち <b>' + _fmt(t.due) + '問</b>。忘れる前に取り返そう。' : '今日の復習はなし。新しい問題へ攻めよう。') + '</span></div>');
    t.core.forEach((m, i) => rows.push('<div class="op-row" style="--i:' + (i + 2) + '"><span class="ic">' + m.icon + '</span><span class="tx">' + _esc(m.label) + '</span></div>'));
    const go = t.due ? '<a class="op-go" href="study.html?mode=srs_review">🔔 復習 ' + _fmt(t.due) + '問からはじめる</a>' : '';
    return '<div class="op-kick"><b>TODAY\'S BRIEFING</b><span>' + jaDate(t.today) + '</span></div>' +
      '<div class="op-ttl">今日のブリーフィング</div>' + cnt + rows.join('') +
      '<div class="op-line">' + _esc(lineFor(t.today, t.daysLeft)) + '</div>' + go;
  }

  // ── 再生 ─────────────────────────────────────────────────────────────
  let _ov = null, _pages = [], _idx = 0, _shownAt = 0, _vvBound = false;

  function _fit() {
    if (!_ov) return;
    const vv = window.visualViewport;
    if (!vv) return;
    _ov.style.height = vv.height + 'px';
    _ov.style.transform = 'translate(' + vv.offsetLeft + 'px,' + vv.offsetTop + 'px)';
  }

  function _countUp(root) {
    root.querySelectorAll('[data-cu]').forEach(el => {
      const to = Number(el.dataset.cu) || 0;
      if (to <= 0 || _reduced()) return;
      const dur = 900, t0 = performance.now();
      let fin = false;
      const finish = () => { if (fin) return; fin = true; el.textContent = _fmt(to); };
      const step = now => {
        if (fin) return;
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = _fmt(Math.round(to * e));
        if (p < 1) requestAnimationFrame(step); else finish();
      };
      el.textContent = '0';
      requestAnimationFrame(step);
      setTimeout(finish, dur + 400);   // 非表示タブでは rAF が来ない＝必ず確定値へ戻す
    });
  }

  function _pageFx(kind, card) {
    if (!_fxOk()) return;
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const acc = (getComputedStyle(document.body).getPropertyValue('--or') || '').trim() || '#FF9A3C';
    if (kind === 'last') {
      const big = card.querySelector('.op-big');
      const b = big ? big.getBoundingClientRect() : r;
      setTimeout(() => {
        MecFX.burst(b.left + b.width / 2, b.top + b.height / 2, { tier: 4, count: 36, colors: [acc, '#FFD166', '#FFFFFF'], shapes: ['circle', 'star'] });
        MecFX.rings && MecFX.rings(b.left + b.width / 2, b.top + b.height / 2, { count: 2, maxR: 160, color: acc, thickness: 2, additive: true });
      }, 950);
      const fl = card.querySelector('.op-flame');
      if (fl) setTimeout(() => { const f = fl.getBoundingClientRect(); MecFX.glyphBurst(f.left + f.width / 2, f.top, { glyphs: ['🔥', '✨'], count: 6, spread: 70, w: 16 }); }, 700);
    } else if (kind === 'week') {
      const mk = card.querySelector('.op-rank-mark');
      if (mk) setTimeout(() => {
        const m = mk.getBoundingClientRect(), x = m.left + m.width / 2, y = m.top + m.height / 2;
        const col = getComputedStyle(mk).color;
        MecFX.rings && MecFX.rings(x, y, { count: 3, maxR: 220, color: col, thickness: 3, additive: true, stagger: .1 });
        MecFX.burst(x, y, { tier: 5, count: 60, colors: [col, '#FFFFFF', '#FFD166'], shapes: ['star', 'circle', 'square'] });
        const rk = mk.textContent;
        if ((rk === 'S' || rk === 'A') && MecFX.confetti) MecFX.confetti({ count: rk === 'S' ? 160 : 90 });
        if (rk === 'S' && MecFX.fireworks) MecFX.fireworks({ tier: 6, count: 5 });
      }, 620);
    } else if (kind === 'today') {
      const n = card.querySelector('.op-count .num');
      if (n) setTimeout(() => {
        const m = n.getBoundingClientRect();
        MecFX.glyphBurst(cx, m.top + m.height / 2, { glyphs: ['✦', '✧', '⭐'], count: 10, spread: 120, w: m.width * .6 });
        MecFX.sparks && MecFX.sparks(cx, m.top + m.height / 2, { count: 18, colors: [acc, '#FFD166', '#FFFFFF'] });
      }, 950);
    }
  }

  // quiet = 同期後の描き直し（数え上げも粒子も走らせない）
  function _render(quiet) {
    const pg = _pages[_idx];
    const last = _idx === _pages.length - 1;
    const body = pg.kind === 'last' ? htmlLast(pg.data) : pg.kind === 'week' ? htmlWeek(pg.data) : htmlToday(pg.data);
    const dots = _pages.length > 1 ? '<span class="op-dots">' + _pages.map((_, i) => '<i class="' + (i <= _idx ? 'on' : '') + '"></i>').join('') + '</span>' : '';
    _ov.innerHTML = '<div class="op-card" role="dialog" aria-modal="true" aria-label="今日のブリーフィング">' + body +
      '<div class="op-foot">' + dots +
      (last ? '' : '<button class="op-skip" type="button" data-op="skip">スキップ</button>') +
      '<button class="op-next" type="button" data-op="next"' + (last ? ' style="margin-left:auto"' : '') + '>' + (last ? 'はじめる ▶' : '次へ ▶') + '</button>' +
      '</div></div>';
    const card = _ov.querySelector('.op-card');
    if (quiet) return;
    _shownAt = Date.now();
    _countUp(card);
    _pageFx(pg.kind, card);
    const nb = _ov.querySelector('[data-op="next"]'); if (nb) try { nb.focus({ preventScroll: true }); } catch {}
  }

  function _next() {
    if (Date.now() - _shownAt < 300) return;   // 入場中の指を拾わない
    if (_idx < _pages.length - 1) { _idx++; _render(); return; }
    _close(true);
  }

  function _close(celebrate) {
    if (!_ov) return;
    const ov = _ov; _ov = null;
    document.removeEventListener('keydown', _onKey, true);
    if (celebrate && _fxOk()) {
      const b = ov.querySelector('[data-op="next"]');
      if (b) { const r = b.getBoundingClientRect(); MecFX.burst(r.left + r.width / 2, r.top + r.height / 2, { tier: 3, count: 26, colors: ['#FFD166', '#FFFFFF'] }); }
    }
    ov.classList.add('out');
    setTimeout(() => { ov.remove(); document.documentElement.classList.remove('op-fx'); }, 320);
  }

  function _onKey(e) {
    if (!_ov) return;
    if (e.key === 'Escape') { e.preventDefault(); _close(false); }
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); _next(); }
  }

  function open(opts) {
    if (_ov) return;
    _injectCss();
    const seen = _g(K_SEEN, {});
    const today = dayStr();
    const G = window.MecGamify;
    const weekly = (G && G._defs && G._defs.weekly) || [];
    const src = _src();
    // 手動で開き直したとき（opts.manual）は先週の結果発表も必ず含める。既視の記録は書き換えない。
    _pages = buildPages(src, today, (opts && opts.manual) ? {} : seen, weekly);
    _idx = 0;
    if (!_reduced()) document.documentElement.classList.add('op-fx');
    _ov = document.createElement('div');
    _ov.id = 'mecOpenOv';
    document.body.appendChild(_ov);
    _ov.addEventListener('click', e => {
      const b = e.target.closest('[data-op]');
      if (b && b.dataset.op === 'skip') { _close(false); return; }
      if (b && b.dataset.op === 'next') { _next(); return; }
      if (e.target.closest('a')) return;
      if (!e.target.closest('.op-card')) _next();   // 背景タップでも送る
    });
    document.addEventListener('keydown', _onKey, true);
    if (!_vvBound && window.visualViewport) {
      _vvBound = true;
      visualViewport.addEventListener('resize', _fit);
      visualViewport.addEventListener('scroll', _fit);
    }
    _fit();
    _render();
    requestAnimationFrame(() => _ov && _ov.classList.add('show'));
    setTimeout(() => _ov && _ov.classList.add('show'), 60);
    if (!(opts && opts.manual)) {
      try { localStorage.setItem(K_SEEN, JSON.stringify({ day: today, week: mondayOf(today) })); } catch {}
    }
  }

  // その日はじめて開いたときだけ出す。非表示タブで開かれたら表に出るまで待つ。
  function maybeShow(delay) {
    const seen = _g(K_SEEN, {});
    if (seen.day === dayStr()) return false;
    const go = () => setTimeout(() => { if (_g(K_SEEN, {}).day !== dayStr()) open(); }, delay == null ? 900 : delay);
    if (document.hidden) {
      const h = () => { if (document.hidden) return; document.removeEventListener('visibilitychange', h); go(); };
      document.addEventListener('visibilitychange', h);
    } else go();
    return true;
  }

  // 同期で数字が変わったら、開いている最中のページを静かに描き直す。
  // ⚠️ 入場アニメを走らせ直さないよう op-fx は外したままにする（付け直すと全部やり直しになる）。
  document.addEventListener('mecSyncComplete', () => {
    if (!_ov) return;
    const G = window.MecGamify;
    const hadWeek = _pages.some(p => p.kind === 'week');
    const fresh = buildPages(_src(), dayStr(), hadWeek ? {} : { week: mondayOf(dayStr()) }, (G && G._defs && G._defs.weekly) || []);
    if (fresh.length !== _pages.length) return;
    _pages = fresh;
    document.documentElement.classList.remove('op-fx');
    _render(true);
  });

  window.MecOpening = {
    maybeShow, open, close: () => _close(false),
    _calc: { dayStr, addDays, mondayOf, diffDays, missionSum, attemptStats, lastStudyDay, calcLast, calcWeek, calcToday, buildPages, lineFor, RANKS },
  };
})();
