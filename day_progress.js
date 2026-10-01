// day_progress.js — 今日の進み（2026-10-01 新設・window.MecDay）
//
// 「1日の学習を進めるなかで、その日の進捗が感じられる」ための集計と小さな図をまとめた共有モジュール。
// 読むのは index.html（待機列の「今日の復習の減り方」・ヒーローの「今日の歩み」）と
// study.html（試験の結果画面の「今日の進み」）。数え方を2ページに書き分けないためにここへ置く。
//
// ⚠️ 新しい同期キーを持たない。材料は既存の mec_attempts_v1（MecAttempts）・mec_srs_v1・
//    MecGamify.dailyGoal()・MecTrophy.isMastered だけ。
//    例外は SRS の札に足した `md`（定着した日）で、study.html の _updateSRS が「定着していなかった札が
//    定着した回」にだけ書く（札ごと同期されるので端末間で揃う）。`md` の無い札（2026-10-01 より前に
//    定着したもの）は「今日の定着」に数えない＝導入した日から数え始める。
// ⚠️ 今日の集計は生ログ（MecAttempts.all）だけで出す。畳んだ集計（roll）には時刻もセッションの
//    並びも無いが、上限 5,000 件は1日ぶんを必ず超える（実績の最大は1日1,434解答）ので今日は欠けない。
(function () {
  'use strict';

  // 1日の復習目標。⚠️ index.js の SRS_DAILY_TARGET と同じ値にすること（test_day_progress.js が見張る）。
  const SRS_TARGET = 200;
  // 正答率の推移に載せるセッションの最小解答数（2〜3問のつまみ食いで線が暴れないように）
  const SPARK_MIN_N = 5;

  function jstDay(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0, 10); }
  function today() { return jstDay(Date.now()); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function fmt(n) { return (n || 0).toLocaleString('ja-JP'); }
  function hm(ms) { const d = new Date(ms + 9 * 3600000); return d.getUTCHours() + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }

  // 今日（JST）の解答行。古い順。材料を差し替えられるようにしておく（テスト用）。
  function todayRows(all, day) {
    day = day || today();
    const rows = all || (window.MecAttempts ? window.MecAttempts.all() : []);
    return rows.filter(a => a && a.ms && jstDay(a.ms) === day);
  }

  // セッションごとの解答数と正答率（最初に解いた時刻の順）
  function sessions(rows) {
    const map = new Map();
    rows.forEach(a => {
      const k = a.sess || ('_' + (a.mode || ''));
      let s = map.get(k);
      if (!s) { s = { sess: a.sess || '', mode: a.mode || 'e', n: 0, ok: 0, t0: a.ms, t1: a.ms }; map.set(k, s); }
      s.n++; if (a.ok) s.ok++;
      if (a.ms < s.t0) s.t0 = a.ms;
      if (a.ms > s.t1) s.t1 = a.ms;
    });
    return [...map.values()].sort((x, y) => x.t0 - y.t0).map(s => ({ ...s, pct: Math.round(s.ok / s.n * 100) }));
  }

  // 今日の復習（SRS復習モードの解答）の減り方。
  // 起点＝いまの復習待ち＋今日すでに SRS で解いた数（保存せずに逆算する）。終点は必ずいまの復習待ち。
  // ⚠️ 予定日は1日の中で動かない（誤答も翌日へ送られる）ので、今日の復習待ちは解いた数だけ減る。
  function srsBurn(rows, due) {
    const s = rows.filter(a => a.mode === 's');
    const start = (due || 0) + s.length;
    const pts = [];
    s.forEach((a, i) => pts.push({ ms: a.ms, left: start - i - 1 }));
    return { start, done: s.length, left: due || 0, pts, goal: Math.min(SRS_TARGET, start) };
  }

  function _srs() { try { return JSON.parse(localStorage.getItem('mec_srs_v1') || '{}') || {}; } catch { return {}; } }
  function _shadow(uid) { const S = window.MECSync; return !!(S && S.srsIsShadow && S.srsIsShadow(uid)); }
  function _isM(e) { const T = window.MecTrophy; return !!(T && T.isMastered && T.isMastered(e)); }

  // 定着している問題の総数（重複コピーの影は数えない）
  function masteredTotal(srs) {
    srs = srs || _srs();
    let n = 0;
    for (const uid in srs) if (_isM(srs[uid]) && !_shadow(uid)) n++;
    return n;
  }
  // 今日定着した問題の数（今日 `md` が付き、いまも定着しているもの）
  function masteredToday(srs, day) {
    srs = srs || _srs(); day = day || today();
    let n = 0;
    for (const uid in srs) { const e = srs[uid]; if (e && e.md === day && _isM(e) && !_shadow(uid)) n++; }
    return n;
  }

  // ── 小さな図 ───────────────────────────────────────────────
  // 正答率の推移（セッションごとの点を結ぶ）。cur＝強調するセッションID（結果画面の「今回」）。
  // 返すのは { html, first, last, n }。点が1つも無ければ html は空。
  function sparkHtml(sess, cur) {
    const ss = sess.filter(s => s.n >= SPARK_MIN_N || (cur && s.sess === cur));
    if (!ss.length) return { html: '', n: 0 };
    const W = 120, H = 30, P = 4;
    const lo = Math.min(50, ...ss.map(s => s.pct));
    const x = i => ss.length === 1 ? W / 2 : P + i * (W - 2 * P) / (ss.length - 1);
    const y = p => P + (100 - p) / (100 - lo || 1) * (H - 2 * P);
    const line = ss.length > 1
      ? '<polyline class="dp-sp-line" points="' + ss.map((s, i) => x(i).toFixed(1) + ',' + y(s.pct).toFixed(1)).join(' ') + '"></polyline>'
      : '';
    const dots = ss.map((s, i) => {
      const isCur = cur ? s.sess === cur : i === ss.length - 1;
      return '<circle class="dp-sp-dot' + (isCur ? ' is-cur' : '') + '" cx="' + x(i).toFixed(1) + '" cy="' + y(s.pct).toFixed(1) + '" r="' + (isCur ? 3.4 : 2.2) + '">' +
        '<title>' + hm(s.t0) + '〜 ' + s.n + '問 ' + s.pct + '%</title></circle>';
    }).join('');
    return {
      html: '<svg class="dp-spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="今日のセッションごとの正答率">' +
        '<line class="dp-sp-base" x1="' + P + '" x2="' + (W - P) + '" y1="' + y(lo).toFixed(1) + '" y2="' + y(lo).toFixed(1) + '"></line>' +
        line + dots + '</svg>',
      first: ss[0].pct, last: ss[ss.length - 1].pct, n: ss.length,
    };
  }

  // 今日の復習の減り方（右下がりの階段）。目標の高さに点線を引く。
  function burnSvg(b, nowMs) {
    const W = 300, H = 56, P = 3;
    const t0 = b.pts.length ? b.pts[0].ms - 60000 : (nowMs || Date.now()) - 60000;
    const t1 = Math.max(nowMs || Date.now(), t0 + 60000);
    // 縦軸は「目標の高さ・いまの残りの低い方」〜起点。0 からにすると、復習待ちが多い日は減り方が平らに潰れる。
    const lo = Math.max(0, Math.min(b.left, b.start - b.goal) - Math.max(1, Math.round(b.start * 0.04)));
    const span = Math.max(1, b.start - lo);
    const x = ms => P + (ms - t0) / (t1 - t0) * (W - 2 * P);
    const y = v => P + (1 - (v - lo) / span) * (H - 2 * P);
    let d = 'M' + x(t0).toFixed(1) + ',' + y(b.start).toFixed(1);
    b.pts.forEach(p => { d += ' H' + x(p.ms).toFixed(1) + ' V' + y(p.left).toFixed(1); });
    d += ' H' + x(t1).toFixed(1);
    const area = d + ' V' + (H - P) + ' H' + x(t0).toFixed(1) + ' Z';
    const goalLv = b.start - b.goal;
    const goal = b.goal > 0
      ? '<line class="dp-bn-goal" x1="' + P + '" x2="' + (W - P) + '" y1="' + y(goalLv).toFixed(1) + '" y2="' + y(goalLv).toFixed(1) + '"></line>'
      : '';
    return '<svg class="dp-burn" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="dp-bn-area" d="' + area + '"></path>' + goal +
      '<path class="dp-bn-line" d="' + d + '"></path></svg>';
  }

  // ── 結果画面（study.html）：このセッションで今日の進みがどれだけ動いたか ──────────
  // 呼ぶのは study_exam.js の結果画面（MecTrophy.flushSession の直前）。
  //   sess … このセッションの attempts のセッションID（_attemptSessionId）
  // 「前」は保存しない。今日の数からこのセッションの解答数を引いて出す（中断・再開をまたいでも同じ式）。
  function _row(label, before, after, goal, unit) {
    const pb = goal > 0 ? before / goal * 100 : 0, pa = goal > 0 ? after / goal * 100 : 0;
    const okNow = goal > 0 && after >= goal, okBefore = goal > 0 && before >= goal;
    const w1 = Math.min(100, pb), w2 = Math.max(0, Math.min(100, pa) - w1);
    const st = !goal ? '' : okNow
      ? (okBefore ? '<span class="ed-st is-ok">達成 ✓</span>' : '<span class="ed-st is-hit">今回で達成！</span>')
      : '<span class="ed-st">あと <b>' + fmt(goal - after) + '</b>' + unit + '</span>';
    return '<div class="ed-row' + (okNow ? ' is-ok' : '') + (okNow && !okBefore ? ' is-hit' : '') + '" title="' + esc(label) + ' ' + fmt(before) + ' → ' + fmt(after) + ' / ' + fmt(goal) + unit + '">' +
      '<span class="ed-l">' + label + '</span>' +
      '<span class="ed-v">' + Math.round(pb) + '% → <b>' + Math.round(pa) + '%</b></span>' + st +
      '<span class="ed-bar"><i class="ed-pre" style="width:' + w1.toFixed(1) + '%"></i><i class="ed-now" style="left:' + w1.toFixed(1) + '%;width:' + w2.toFixed(1) + '%"></i></span>' +
    '</div>';
  }

  function summaryHtml(o) {
    o = o || {};
    const rows = todayRows(o.rows);
    const mine = o.sess ? rows.filter(a => a.sess === o.sess) : [];
    let html = '';
    // 1) 今日の解答（ハブのゲージと同じ正本＝MecGamify.dailyGoal）
    const G = window.MecGamify; const g = G && G.dailyGoal ? G.dailyGoal() : null;
    if (g && g.target > 0) {
      const before = Math.max(0, g.count - mine.length);
      html += _row('今日の解答', before, g.count, g.target, '問');
    }
    // 2) 今日の復習（ハブのリング「本日消化 N / 目標」と同じ式）
    const srsAll = rows.filter(a => a.mode === 's').length;
    if (srsAll > 0 || o.srsMode) {
      const srsMine = mine.filter(a => a.mode === 's').length;
      const due = typeof o.due === 'number' ? o.due : 0;
      const goal = Math.min(SRS_TARGET, srsAll + due);
      html += _row('今日の復習', Math.max(0, srsAll - srsMine), srsAll, goal, '問');
    }
    // 3) 今日の定着と正答率の推移
    const gem = masteredToday();
    const sp = sparkHtml(sessions(rows), o.sess);
    let foot = '<span class="ed-gem" title="今日はじめて定着（3回続けて正解し、間隔が十分に伸びた）した問題">💎 今日の定着 <b>+' + fmt(gem) + '</b>問</span>';
    if (sp.html) {
      foot += '<span class="ed-acc" title="今日のセッションごとの正答率（' + SPARK_MIN_N + '問未満のセッションは除く）">正答率の推移 ' + sp.html +
        (sp.n > 1 ? '<span class="ed-acc-v">' + sp.first + '% → <b>' + sp.last + '%</b></span>' : '<span class="ed-acc-v"><b>' + sp.last + '%</b></span>') + '</span>';
    }
    html += '<div class="ed-foot">' + foot + '</div>';
    return '<div class="exam-subj-wrap exam-day" id="sumDayProg"><h3>今日の進み</h3>' + html + '</div>';
  }

  function decorateSummary(o) {
    const old = document.getElementById('sumDayProg');
    if (old) old.remove();
    const anchor = document.getElementById('gmTrayMount') || document.getElementById('sumHardNote');
    if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', summaryHtml(o));
  }

  window.MecDay = {
    SRS_TARGET, SPARK_MIN_N,
    today, todayRows, sessions, srsBurn, masteredTotal, masteredToday,
    sparkHtml, burnSvg, summaryHtml, decorateSummary, hm,
  };
})();
