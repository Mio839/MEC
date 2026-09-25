// 病棟回診（ward.js）と確信度の宣言のテスト。実ソースを vm で読み込む。
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

// [2] 確信度 → SRS の段と転帰
ok(W.gradeFor(true, 'sure') === true && W.gradeFor(true, 'maybe') === true, '確実・たぶんで正解＝従来どおり true（ok）');
ok(W.gradeFor(true, 'guess') === 'mid', '勘で正解＝mid（間隔を控えめに）');
ok(W.gradeFor(false, 'sure') === false && W.gradeFor(false, 'guess') === false, '誤答は確信度に関わらず false（ng）');
ok(W.outcomeOf(true, 'sure') === 'discharge' && W.outcomeOf(true, 'guess') === 'watch' && W.outcomeOf(false, 'maybe') === 'stay', '転帰：退院／経過観察／入院継続');

// [3] 的中の集計
const c = W.calib([{ conf: 'sure', ok: true }, { conf: 'sure', ok: false }, { conf: 'guess', ok: true }, { conf: 'x', ok: true }]);
ok(c.sure.n === 2 && c.sure.ok === 1, '確実 2問中1問');
ok(c.guess.n === 1 && c.maybe.n === 1, '未知の値は「たぶん」へ寄せる');

// [4] 配線
const EXAM = read('study_exam.js');
const tally = EXAM.slice(EXAM.indexOf('function _tallyQuestion('), EXAM.indexOf('function _renderExamProgMarks('));
ok(/_srsReviewMode && window\.MecWard/.test(tally) && /MecWard\.onAnswer\(/.test(tally), '転帰は _tallyQuestion（3つの採点経路の合流点）で記帳');
ok((EXAM.match(/_updateSRS\(uid, _examSrsGrade\(true\)\)/g) || []).length === 2, '正解の2経路（選択肢・計算）が _examSrsGrade を通す');
ok(!/_updateSRS\(uid, true\)/.test(EXAM), '素の _updateSRS(uid, true) が残っていない');
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
