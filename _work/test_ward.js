// 病棟回診（ward.js）のテスト。実ソースを vm で読み込む。
//   node _work/test_ward.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

const ctx = { window: {}, console, setTimeout, clearTimeout, setInterval, clearInterval, localStorage: { getItem: () => null } };
vm.createContext(ctx);
vm.runInContext(read('ward.js'), ctx);
const W = ctx.window.MecWard;
ok(!!W, 'window.MecWard が公開される');

// [1] 病状
const T = '2026-09-25';
ok(W.severityOf({ nextReview: T, interval: 6 }, T) === 'stable', '今日が予定日・間隔6日＝安定');
ok(W.severityOf({ nextReview: '2026-09-24', interval: 10 }, T) === 'warn', '1日遅れ＝要注意');
ok(W.severityOf({ nextReview: '2026-09-18', interval: 30 }, T) === 'crit', '7日遅れ＝重症');
ok(W.severityOf({ nextReview: '2026-09-23', interval: 1 }, T) === 'crit', '間隔1日が2日遅れ（待たされ具合3）＝重症');
ok(W.severityOf(null, T) === 'stable', 'エントリなし＝安定（落ちない）');

// [2] 転帰
ok(W.outcomeOf(true) === 'discharge' && W.outcomeOf(false) === 'stay', '転帰：正解＝退院／誤答＝入院継続');
// [2b] 結果画面の追加の段（2026-10-01）の材料
ok(W.dueCount({ a: { nextReview: '2026-09-20' }, b: { nextReview: T }, c: { nextReview: '2026-09-26' }, d: {} }, T) === 2, '期限切れ＝予定日が今日以前（未来・予定なしは数えない）');
ok(W.bestRun([{ ok: 1 }, { ok: 1 }, { ok: 0 }, { ok: 1 }, { ok: 1 }, { ok: 1 }, { ok: 0 }]) === 3 && W.bestRun([]) === 0, '最長の連続定着＝解いた順で途切れずに続いた数');
const cd = W.chainDays({ '2026-09-25': 3, '2026-09-23': 1, '2026-09-19': 2, '2026-09-18': 9 }, T);
ok(cd.length === 7 && cd[0].ds === '2026-09-19' && cd[6].ds === T && cd.map(d => d.on ? 1 : 0).join('') === '1000101', '連続の鎖＝直近7日（古い順・今日が右端）');
// 確信度の宣言は 2026-09-25 に撤去（キー操作が面倒＝ユーザー判断）。戻っていないこと
const WARD = read('ward.js');
ok(!/wh-cb|setConf|gradeFor|srsGrade|keydown/.test(WARD), '確信度の宣言（ボタン・キー・SRSの段）が残っていない');
ok(/#wardHud\{[^}]*pointer-events:none/.test(WARD), '病棟ボードは表示だけ（押せる物を置かない）');

// [3] 配線
const EXAM = read('study_exam.js');
const tally = EXAM.slice(EXAM.indexOf('function _tallyQuestion('), EXAM.indexOf('function _renderExamProgMarks('));
ok(/_srsReviewMode && window\.MecWard/.test(tally) && /MecWard\.onAnswer\(/.test(tally), '転帰は _tallyQuestion（3つの採点経路の合流点）で記帳');
ok(!/_examSrsGrade/.test(EXAM), 'SRS の採点は従来どおり（確信度で段を変えない）');
ok(/MecWard\?\.onExit/.test(EXAM.slice(EXAM.indexOf('function exitExam('))), 'exitExam で onExit');
const HTML = read('study.html');
ok(/<script src="ward\.js"><\/script>/.test(HTML), 'study.html が ward.js を読む');
const srsFn = HTML.slice(HTML.indexOf('async function startSRSReview('), HTML.indexOf('const TODAY_WRONG_LIMIT'));
ok(/MecWard\.briefing\([\s\S]*startExam\(availableUids\);\s*MecWard\.start\(/.test(srsFn), '申し送りのタップの中で startExam → start');
ok(/"\.\/ward\.js"/.test(read('sw.js')), 'sw.js の SHELL に ward.js');
ok(!/localStorage\.setItem/.test(read('ward.js')), 'ward.js は新しい localStorage キーを書かない');
ok(!/animation:[^;`]*infinite/.test(read('ward.js')), 'ward.js に infinite のアニメを置かない');

console.log((fail ? '✗ ' : '✓ ') + 'test_ward: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
