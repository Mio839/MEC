// 今日の進み（day_progress.js・2026-10-01）のテスト。実ソースを vm で読み込む。
//   node _work/test_day_progress.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

const store = {};
const ctx = {
  window: {}, console, Date, Math, JSON,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
};
ctx.window.localStorage = ctx.localStorage;
vm.createContext(ctx);
vm.runInContext(read('trophy.js'), ctx);
vm.runInContext(read('day_progress.js'), ctx);
const D = ctx.window.MecDay;
ok(!!D, 'window.MecDay が公開される');

// 今日（JST）の 9:00 を基準に解答行を作る
const day = D.today();
const base = Date.parse(day + 'T00:00:00Z') - 9 * 3600000 + 9 * 3600000;   // JST 9:00
const row = (min, ok, mode, sess) => ({ uid: 'x_ch01_q' + min, ms: base + min * 60000, t: (base / 60000) + min, ok, mode, sess });
const rows = [
  row(0, true, 's', 'A'), row(1, false, 's', 'A'), row(2, true, 's', 'A'), row(3, true, 's', 'A'), row(4, true, 's', 'A'),
  row(30, true, 'e', 'B'), row(31, true, 'e', 'B'), row(32, true, 'e', 'B'), row(33, true, 'e', 'B'), row(34, true, 'e', 'B'),
  row(60, false, 'e', 'C'), row(61, true, 'e', 'C'),   // 2問だけ＝推移からは外れる
  { uid: 'old', ms: base - 2 * 86400000, t: 0, ok: true, mode: 's', sess: 'Z' },   // 一昨日
];

// [1] 今日の行・セッション
const tr = D.todayRows(rows);
ok(tr.length === 12, '今日の行だけを拾う（一昨日の行を落とす）');
const ss = D.sessions(tr);
ok(ss.length === 3 && ss[0].sess === 'A' && ss[0].n === 5 && ss[0].pct === 80 && ss[1].pct === 100, 'セッションごとの解答数と正答率（最初に解いた順）');

// [2] 復習の減り方：起点＝いまの復習待ち＋今日 SRS で解いた数、終点＝いまの復習待ち
const b = D.srsBurn(tr, 100);
ok(b.start === 105 && b.done === 5 && b.left === 100 && b.pts[b.pts.length - 1].left === 100, '減り方の起点と終点');
ok(b.goal === Math.min(D.SRS_TARGET, 105), '目標＝min(1日の復習目標, 起点)');
ok(/<path class="dp-bn-line"/.test(D.burnSvg(b, base + 10 * 60000)) && /dp-bn-goal/.test(D.burnSvg(b, base + 10 * 60000)), '減り方の図に線と目標ラインが出る');
const b2 = D.srsBurn(tr, 300);
ok(b2.goal === D.SRS_TARGET, '起点が目標より大きい日は目標＝1日の復習目標');

// [3] 正答率の推移：5問未満のセッションは外す（ただし結果画面の「今回」は残す）
const sp = D.sparkHtml(ss);
ok(sp.n === 2 && sp.first === 80 && sp.last === 100, '推移は5問以上のセッションだけ');
const spc = D.sparkHtml(ss, 'C');
ok(spc.n === 3 && /is-cur/.test(spc.html), '今回のセッションは5問未満でも載せて強調する');
ok(D.sparkHtml([]).html === '', '記録が無ければ空');

// [4] 今日の定着＝今日 md が付き、いまも定着しているもの
store.mec_srs_v1 = JSON.stringify({
  a: { reps: 3, interval: 30, md: day },
  b: { reps: 3, interval: 30, md: '2026-01-01' },
  c: { reps: 0, interval: 1, md: day },     // 今日定着したが、その後に落とした
  d: { reps: 5, interval: 40 },             // md の無い旧データ（導入前に定着）
});
ok(D.masteredToday() === 1, '今日の定着＝md が今日で、いまも定着');
ok(D.masteredTotal() === 3, '定着の総数（md の有無は問わない）');

// [5] 結果画面：このセッションのぶんを引いて「前」を出す
ctx.window.MecAttempts = { all: () => rows };
ctx.window.MecGamify = { dailyGoal: () => ({ count: 203, target: 200 }) };
const html = D.summaryHtml({ sess: 'B', srsMode: false, due: 50 });
ok(/今日の解答/.test(html) && /今回で達成！/.test(html), '解答：198 → 203 で、このセッションで目標を越えたら「今回で達成！」');
ok(/今日の復習/.test(html), '今日 SRS で解いていれば復習の段も出す');
ctx.window.MecGamify = { dailyGoal: () => ({ count: 120, target: 200 }) };
ok(/あと <b>80<\/b>問/.test(D.summaryHtml({ sess: 'B' })), '未達なら「あと N問」');

// [6] 定数の一致と配線
const IDX = read('index.js');
ok(new RegExp('const SRS_DAILY_TARGET = ' + D.SRS_TARGET + ';').test(IDX), 'index.js の SRS_DAILY_TARGET と MecDay.SRS_TARGET が一致');
ok(/_srsVizHtml\(srsDoneToday, srsGoal, fc, due, burn\)/.test(IDX), 'ハブが減り方を描く');
// 今日の歩み（#heroDay）は 2026-10-01 に撤去（待機列を画面に収めるため・ユーザー判断）
ok(!/_renderHeroDay|id="heroDay"/.test(IDX + read('index.html')), '今日の歩み（#heroDay）を戻さない');
ok(/if \(document\.visibilityState === 'hidden'\) _saveSince\(\)/.test(IDX) && !/^_saveSince\(\);/m.test(IDX), '前回の値は離れるときだけ書く（開いた瞬間に書かない）');
const HTML = read('study.html');
ok(/<script src="day_progress\.js"><\/script>/.test(HTML) && /<script src="day_progress\.js"><\/script>/.test(read('index.html')), 'study.html と index.html が day_progress.js を読む');
ok(/!T\.isMastered\(_before\) && T\.isMastered\(e\)\) e\.md = _today\(\)/.test(HTML), '_updateSRS は定着した回にだけ md を書く');
ok(/MecDay\?\.decorateSummary/.test(read('study_exam.js')), '結果画面に今日の進みを出す');
ok(/"\.\/day_progress\.js"/.test(read('sw.js')), 'sw.js の SHELL に day_progress.js');
ok(!/localStorage\.setItem/.test(read('day_progress.js')), 'day_progress.js は localStorage に書かない');
ok(!/infinite/.test(read('day_progress.js')), 'day_progress.js に infinite のアニメを置かない');

console.log((fail ? '✗ ' : '✓ ') + 'test_day_progress: ' + pass + ' ok / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
