// node _work/test_hub_opening.js — ハブの1日の最初のブリーフィング／週の結果発表（hub_opening.js）
// 実ソースを vm で読み込み、集計（_calc）を固定データで回す。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'hub_opening.js'), 'utf8');
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } }

function load(ls) {
  const store = Object.assign({}, ls || {});
  const ctx = {
    console, Math, Date, JSON, Number, String, Object, Array, Set, Map, isFinite,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    document: { addEventListener() {}, hidden: false },
    setTimeout, performance: { now: () => 0 },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { ctx, store, C: ctx.MecOpening._calc };
}

// 分単位 epoch（JST の日付文字列と時刻から作る）
function tMin(ds, hh) { return Math.floor((Date.parse(ds + 'T00:00:00Z') - 9 * 3600000 + (hh || 10) * 3600000) / 60000); }
function att(uid, ds, ok, sess, n, hh) { const t = tMin(ds, hh); return { uid, t, ms: t * 60000, ok, sess, n, mode: 'e', choice: '', sec: 5 }; }

console.log('[1] 日付の道具（JST）');
{
  const { C } = load();
  ok(C.mondayOf('2026-09-23') === '2026-09-21', '水曜の月曜は 9/21');
  ok(C.mondayOf('2026-09-21') === '2026-09-21', '月曜はその日');
  ok(C.mondayOf('2026-09-27') === '2026-09-21', '日曜は前の月曜');
  ok(C.addDays('2026-09-01', -1) === '2026-08-31', '月をまたぐ');
  ok(C.diffDays('2026-09-23', '2027-02-06') === 136, '国試までの日数');
}

console.log('[2] 前回の学習日は「昨日」固定ではない');
{
  const { C } = load();
  const src = { activity: { '2026-09-19': 3, '2026-09-20': 0, '2026-09-23': 5 }, studytime: { '2026-09-19': 95 }, missions: {}, srs: {}, attempts: [], rate: {}, subjects: [] };
  const d = C.calcLast(src, '2026-09-23');
  ok(d.day === '2026-09-19', '0回の日と今日は飛ばす: ' + d.day);
  ok(d.gap === 4, 'gap=4');
  ok(d.minutes === 95, '学習時間');
  ok(C.calcLast({ activity: {}, missions: {}, attempts: [] }, '2026-09-23') === null, '記録なしは null');
}

console.log('[3] 解答数・正答率・最長連続・難問突破');
{
  const { C } = load();
  const day = '2026-09-22';
  const A = [
    att('circ_ch01_q1', day, true, 's1', 1), att('circ_ch01_q2', day, true, 's1', 2), att('circ_ch01_q3', day, false, 's1', 3),
    att('circ_ch01_q4', day, true, 's1', 4), att('resp_ch01_q1', day, true, 's2', 1), att('resp_ch01_q2', day, true, 's2', 2),
    att('resp_ch01_q3', day, true, 's2', 3), att('resp_ch01_q4', '2026-09-21', true, 's3', 1),
  ];
  const src = { activity: { [day]: 1 }, missions: { d: { [day]: { devA: { ans: 50 }, devB: { ans: 30 } } } }, attempts: A,
    rate: { 'circ_ch01_q1': 40, 'resp_ch01_q1': 90, 'circ_ch01_q3': 20 }, subjects: [] };
  const d = C.calcLast(src, '2026-09-23');
  ok(d.ans === 80, '解答数は日次ミッションの端末合計: ' + d.ans);
  ok(d.at.total === 7 && d.at.ok === 6, '前日だけを数える');
  ok(d.at.acc === 86, '正答率 6/7=86%: ' + d.at.acc);
  ok(d.at.bestRun === 3, '連続はセッション内だけ（s1 の2と s2 の3をつながない）: ' + d.at.bestRun);
  ok(d.at.hardOk === 1, '難問(<60%)の正解だけ・誤答は数えない: ' + d.at.hardOk);
  const d2 = C.calcLast(Object.assign({}, src, { missions: {} }), '2026-09-23');
  ok(d2.ans === 7, '日次バケットが切れていれば解答ログで代用');
}

console.log('[4] 週の結果発表');
{
  const { C } = load();
  const W = [
    { id: 'w_ans', tier: 'core', icon: '📅', label: 'a', target: 250, counter: 'ans' },
    { id: 'w_cor', tier: 'core', icon: '✅', label: 'b', target: 120, counter: 'cor' },
    { id: 'w_exam', tier: 'core', icon: '🎓', label: 'c', target: 7, counter: 'exam' },
    { id: 'w_srs', tier: 'bonus', icon: '🔁', label: 'd', target: 150, counter: 'srs' },
    { id: 'w_day', tier: 'bonus', icon: '📆', label: 'e', target: 6, counter: 'day' },
    { id: 'w_hard', tier: 'bonus', icon: '🔥', label: 'f', target: 100, counter: 'hard' },
  ];
  const mon = '2026-09-14';
  const act = {}; ['2026-09-14', '2026-09-15', '2026-09-17', '2026-09-20'].forEach(d => { act[d] = 2; });
  const A = [];
  for (let i = 0; i < 20; i++) A.push(att('circ_ch01_q' + i, '2026-09-15', i < 18, 'a', i));     // 90%
  for (let i = 0; i < 12; i++) A.push(att('resp_ch01_q' + i, '2026-09-16', i < 6, 'b', i));      // 50%
  for (let i = 0; i < 10; i++) A.push(att('circ_ch01_q' + i, '2026-09-08', i < 6, 'c', i));      // 先週 60%
  const src = { activity: act, studytime: { '2026-09-15': 60, '2026-09-20': 30 }, attempts: A, rate: {},
    subjects: [{ sid: 'circ', label: '循環器', icon: '❤️' }, { sid: 'resp', label: '呼吸器', icon: '🌬️' }],
    missions: { w: {
      [mon]: { d1: { ans: 200, cor: 100, exam: 7 }, d2: { ans: 60, cor: 30 } },
      '2026-09-07': { d1: { ans: 100 } },
    } } };
  const w = C.calcWeek(src, mon, W);
  ok(w.sunday === '2026-09-20', '日曜まで');
  ok(w.studyDays === 4 && w.days[0] && !w.days[2] && w.days[6], '学習日の並び（月始まり）');
  ok(w.minutes === 90, '学習時間の合計');
  ok(w.ans === 260 && w.ansPrev === 100, '解答数は端末合計');
  ok(w.coreDone === 3 && w.coreTotal === 3, 'コア3つ達成（端末を合算して 250・120 に届く）');
  ok(w.rank.r === 'A', 'コア完走・ボーナス0 → A: ' + w.rank.r);
  ok(w.best && w.best.sid === 'circ' && w.best.acc === 90, 'いちばん取れた科目');
  ok(w.up && w.up.sid === 'circ' && w.up.d === 30, '伸びた科目は両週10問以上だけ: ' + JSON.stringify(w.up));
  const lean = C.calcWeek(Object.assign({}, src, { missions: { w: { [mon]: { d1: { ans: 10 } } } } }), mon, W);
  ok(lean.rank.r === 'C', 'コア0 → C');
}

console.log('[5] ページの組み立てと既視');
{
  const { C } = load();
  const src = { activity: { '2026-09-19': 1 }, missions: {}, attempts: [], srs: {}, rate: {}, subjects: [], studytime: {} };
  const p1 = C.buildPages(src, '2026-09-23', {}, []);
  ok(p1.map(p => p.kind).join() === 'last,week,today', 'その週はじめて: 前回→週→今日');
  const p2 = C.buildPages(src, '2026-09-23', { week: '2026-09-21' }, []);
  ok(p2.map(p => p.kind).join() === 'last,today', '今週もう見た: 週は出さない');
  const p3 = C.buildPages(Object.assign({}, src, { activity: {} }), '2026-09-23', {}, []);
  ok(p3.map(p => p.kind).join() === 'last,today', '先週まったく学習していなければ週は出さない');
}

console.log('[6] ひと言は決定論（同じ日は同じ文）');
{
  const { C } = load();
  ok(C.lineFor('2026-09-23', 136) === C.lineFor('2026-09-23', 136), '同じ日は同じ');
  ok(typeof C.lineFor('2026-09-23', null) === 'string', '試験日なしでも文を返す');
}

console.log('[7] 約束ごと（ソース検査）');
{
  ok(!/Math\.random/.test(SRC), '乱数を使わない');
  ok(!/fetch\(/.test(SRC), 'fetch を足さない（ハブを重くしない）');
  const prog = fs.readFileSync(path.join(ROOT, 'progress.js'), 'utf8');
  ok(prog.indexOf('mec_hub_opening_v1') === -1, '既視の記録を同期対象に入れない');
  const hub = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ok(/<script src="hub_opening\.js"><\/script>/.test(hub), 'ハブが読み込む');
  ok(/MecOpening\.maybeShow\(/.test(hub), 'ハブが起動時に呼ぶ');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  ok(sw.indexOf('"./hub_opening.js"') !== -1, 'sw.js の SHELL に載っている');
  ok(/setTimeout\(finish/.test(SRC), '数え上げに rAF が止まったときの落とし所がある');
  ok(/prefers-reduced-motion/.test(SRC), 'reduced-motion で止める');
}

console.log(fail ? `\n${fail} 件失敗 / ${pass} 件成功` : `\nALL PASS (${pass})`);
process.exit(fail ? 1 : 0);
