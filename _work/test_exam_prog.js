/**
 * 試験の進捗バー（B2）と、それが支える難問の可視化（B3・B4）を実ソースで検証する。
 * Run: node _work/test_exam_prog.js
 *
 * 背景（2026-08-18 の演出強化 Phase 2）:
 *   進捗バーは幅が伸びて数字が跳ねるだけで、50問セッションでは連続正解が切れている間
 *   ＝実力的に一番苦しい時間帯に演出がゼロになっていた。そこへ「距離感」を足した。
 *
 * ⚠️ ここで守りたい設計上の決定は2つ。
 *   ① 節目は「祝わない」。跨いだ瞬間に光が走るだけで、音も粒子も出さない。
 *      連続正解（tier）と別軸で祝う演出を足すと tier 演出とぶつかり画面が騒がしくなる。
 *   ② data-rate が無い問題（正答率なし）は難問に数えない。出典に数字が載っていないだけで、
 *      難しいという意味ではない。閾値 EXAM_HARD_RATE=60 は study.html のフィルタ
 *      「難問(<60%)」・gamify.js の hard カウンタと同じ数字であること。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const GAMIFY = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');

// ── 実ソースから必要な関数だけを切り出して評価する ────────────────────────
// study_exam.js 全体は DOM/他ファイルのグローバルに依存するので、幾何を決めている
// 純粋な部分（定数と _examProgLayout）だけを取り出す。関数名や定数名を変えたらここも直す。
function slice(name, kind) {
  const head = kind === 'const' ? new RegExp('^const ' + name + '\\s*=.*$', 'm')
                                : new RegExp('^function ' + name + '\\(', 'm');
  const m = head.exec(SRC);
  assert.ok(m, '実ソースに ' + name + ' が見つからない（名前を変えたらテストも直すこと）');
  if (kind === 'const') return m[0];
  // 関数は最初の { から括弧の対応で末尾まで取る
  let i = SRC.indexOf('{', m.index), depth = 0, end = -1;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (!depth) { end = j + 1; break; } }
  }
  assert.ok(end > 0, name + ' の本体を取り出せない');
  return SRC.slice(m.index, end);
}

const ctx = { console, Math, Object, Array, Number, String, Boolean, assert };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext([
  slice('PROG_SPRINT_LEFT', 'const'),
  slice('PROG_TICK_MIN', 'const'),
  slice('PROG_LAST_N', 'const'),
  slice('EXAM_HARD_RATE', 'const'),
  slice('_examProgLayout'),
  'this.L = _examProgLayout; this.K = {PROG_SPRINT_LEFT,PROG_TICK_MIN,PROG_LAST_N,EXAM_HARD_RATE};',
].join('\n'), ctx);

const layout = ctx.L, K = ctx.K;

// テスト用のカード。rate=null は「正答率データが無い」（難問に数えない）
const card = (rate, excluded) => ({ rate, excluded: !!excluded });
const OPTS = {
  isExcluded: c => c.excluded,
  isHard: c => c.rate != null && c.rate < K.EXAM_HARD_RATE,
};
const run = cards => layout(cards, OPTS);
// ⚠️ vm の中で作られた配列は prototype が別レルムなので deepStrictEqual が通らない。
//    構造の比較は JSON 経由で行う。
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
const plain = n => Array.from({ length: n }, () => card(90));

// ── ミニテストランナー ────────────────────────────────────────────────
let pass = 0, fail = 0;
function group(n) { console.log('\n' + n); }
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}

group('分母（採点除外を外す）');

t('総数は採点除外を引いた数になる', () => {
  const cards = [card(90), card(90, true), card(90), card(90)];
  const L = run(cards);
  assert.strictEqual(L.total, 3);
  assert.strictEqual(L.excluded, 1);
});

t('採点除外には印を置かない（置くと以降の位置が全部ずれる）', () => {
  // 2枚目が「採点除外かつ低正答率」。バーは進まないので印を置いてはいけない
  const cards = [card(90), card(20, true), card(20)];
  const L = run(cards);
  assert.strictEqual(L.marks.length, 1);
  // 残った難問は「採点対象2問中の2問目」＝(1+0.5)/2
  assert.strictEqual(L.marks[0].n, 2);
  assert.ok(Math.abs(L.marks[0].at - 0.75) < 1e-9);
});

t('全部が採点除外でも壊れない（0除算しない）', () => {
  const L = run([card(20, true), card(20, true)]);
  assert.strictEqual(L.total, 0);
  same(L.marks, []);
  same(L.ticks, []);
  assert.strictEqual(L.sprintFrom, null);
});

t('空のキューでも壊れない', () => {
  const L = run([]);
  assert.strictEqual(L.total, 0);
  assert.strictEqual(L.hardTotal, 0);
});

group('目盛りの位置');

t('半分の目盛りは「解いた数 / 総数」の位置に立つ', () => {
  const L = run(plain(50));
  const half = L.ticks.find(x => x.kind === 'half');
  assert.strictEqual(half.n, 25);
  assert.ok(Math.abs(half.at - 0.5) < 1e-9);
});

t('残り10問の目盛りは total-10 の位置に立つ', () => {
  const L = run(plain(50));
  const last = L.ticks.find(x => x.kind === 'last');
  assert.strictEqual(last.n, 40);
  assert.ok(Math.abs(last.at - 0.8) < 1e-9);
});

t('小さいセッション（総数 < PROG_TICK_MIN）には目盛りを打たない', () => {
  same(run(plain(K.PROG_TICK_MIN - 1)).ticks, []);
  assert.strictEqual(run(plain(K.PROG_TICK_MIN)).ticks.length >= 1, true);
});

t('残り10問が半分より手前になるセッションでは「残り10問」を出さない（重なる）', () => {
  const L = run(plain(18));   // half=9, last=8 → last は出さない
  assert.strictEqual(L.ticks.length, 1);
  assert.strictEqual(L.ticks[0].kind, 'half');
});

t('目盛りの位置は必ず 0 と 1 の間（バーからはみ出さない）', () => {
  [8, 9, 20, 21, 50, 137].forEach(n => {
    run(plain(n)).ticks.forEach(x => assert.ok(x.at > 0 && x.at < 1, n + '問で at=' + x.at));
  });
});

group('難問の印');

t('印の位置は出題順に対応する（i番目は (i-0.5)/total）', () => {
  const cards = [card(90), card(30), card(90), card(45)];
  const L = run(cards);
  same(L.marks.map(m => m.n), [2, 4]);
  assert.ok(Math.abs(L.marks[0].at - 1.5 / 4) < 1e-9);
  assert.ok(Math.abs(L.marks[1].at - 3.5 / 4) < 1e-9);
});

t('data-rate が無い問題は難問に数えない', () => {
  const L = run([card(null), card(null), card(30)]);
  assert.strictEqual(L.hardTotal, 1);
  assert.strictEqual(L.marks[0].n, 3);
});

t('閾値はちょうど60を含まない（60は難問ではない）', () => {
  assert.strictEqual(run([card(59.9)]).hardTotal, 1);
  assert.strictEqual(run([card(60)]).hardTotal, 0);
  assert.strictEqual(run([card(60.1)]).hardTotal, 0);
});

t('難問の数は marks の数と一致する（B3・B4がこの1本を共有する）', () => {
  const cards = [card(30), card(90), card(20), card(null), card(55)];
  const L = run(cards);
  assert.strictEqual(L.hardTotal, 3);
  assert.strictEqual(L.marks.length, L.hardTotal);
});

group('ラストスパート');

t('残り PROG_SPRINT_LEFT 問から始まる', () => {
  const L = run(plain(50));
  assert.strictEqual(L.sprintFrom, 50 - K.PROG_SPRINT_LEFT);
});

t('セッションが短すぎる（総数 <= PROG_SPRINT_LEFT）ときは出さない', () => {
  assert.strictEqual(run(plain(K.PROG_SPRINT_LEFT)).sprintFrom, null);
  assert.strictEqual(run(plain(K.PROG_SPRINT_LEFT + 1)).sprintFrom, 1);
});

group('「祝わない」の担保');

// 目盛りを跨いだときの処理は _syncExamProgMarks に閉じている。ここに音・粒子の
// 呼び出しが混ざっていないことをソースで検査する（混ぜると tier 演出とぶつかる）。
const SYNC = slice('_syncExamProgMarks');

t('節目の処理で音のAPIを呼んでいない', () => {
  assert.ok(!/_play|SND\.|Audio|\.play\(/.test(SYNC), '_syncExamProgMarks に音の呼び出しがある');
});

t('節目の処理で粒子（MecFX）を呼んでいない', () => {
  assert.ok(!/MecFX/.test(SYNC), '_syncExamProgMarks に MecFX の呼び出しがある');
});

t('節目の処理でストリーク演出を呼んでいない', () => {
  assert.ok(!/_showStreakEffect|_triggerFullscreenCombo|_triggerScreenShake|_spawnFloatingCombo/.test(SYNC));
});

t('節目の処理は reduced-motion を通している', () => {
  assert.ok(/_fxOff\(\)/.test(SYNC), '_syncExamProgMarks が _fxOff() を見ていない');
});

group('閾値の三者一致・配線');

t('EXAM_HARD_RATE は study.html のフィルタ・gamify.js の hard と同じ 60', () => {
  assert.strictEqual(K.EXAM_HARD_RATE, 60);
  const g = /HARD_RATE\s*=\s*(\d+)/.exec(GAMIFY);
  assert.ok(g, 'gamify.js に HARD_RATE が無い');
  assert.strictEqual(Number(g[1]), K.EXAM_HARD_RATE);
});

t('出題候補の数え方は1本（startExam と B4 の予告が同じ関数を使う）', () => {
  assert.ok(/function _examCandidateCards\(/.test(SRC));
  // 呼び出しは startExam と _renderExamPredict の2箇所（定義行を除く）
  const calls = (SRC.match(/(?<!function )_examCandidateCards\(/g) || []).length;
  assert.strictEqual(calls, 2, '_examCandidateCards の呼び出しが2箇所でない');
});

t('3つの採点経路すべてが _tallyQuestion を通る（複数選択・単一選択・計算問題）', () => {
  // ⚠️ _afterCorrectFx は複数選択の経路を通らないので、集計をそこに載せてはいけない
  const calls = (SRC.match(/(?<!function )_tallyQuestion\(card, isCorrect\)/g) || []).length;
  assert.strictEqual(calls, 3, '_tallyQuestion の呼び出しが3箇所でない');
  const tally = (SRC.match(/(?<!function )_tallyChapter\((?:card\.dataset\.)?uid, isCorrect\)/g) || []).length;
  assert.strictEqual(tally, 3, '_tallyChapter と同じ数だけ呼ばれていない');
});

t('セッション開始と再開の両方で目盛りを敷き直す', () => {
  const calls = (SRC.match(/(?<!function )_renderExamProgMarks\(\)/g) || []).length;
  assert.strictEqual(calls, 2, 'startExam と resumeExam の2箇所でない');
});

group('マークアップとCSS');

t('開始モーダルに予告の器がある（B4）', () => {
  assert.ok(/id="examPredict"/.test(HTML));
  assert.ok(/\.exam-predict\{/.test(CSS));
});

t('結果画面に難問の器がある（B3）', () => {
  assert.ok(/id="sumHardNote"/.test(HTML));
  assert.ok(/\.exam-hard-note\{/.test(CSS));
});

t('進捗バーの目盛り・難問印・ラストスパートのCSSがある（B2）', () => {
  ['.ep-tick', '.ep-hard', '.ep-sweep', '.ep-sprint'].forEach(sel => {
    assert.ok(CSS.includes(sel), 'study.css に ' + sel + ' が無い');
  });
});

t('進捗バーの track が position:relative（印の絶対配置の土台）', () => {
  const m = /\.exam-prog-track\{([^}]*)\}/.exec(CSS);
  assert.ok(m && /position:relative/.test(m[1]), '.exam-prog-track に position:relative が無い');
});

t('B5 の帯は ::after で描く（::before は C5 の exam-scar が使っている）', () => {
  assert.ok(/\.qc\[data-recap\]::after\{/.test(CSS));
  assert.ok(/\.qc\.exam-scar::before\{/.test(CSS), 'exam-scar が ::before を使う前提が崩れている');
  // .qc の box-shadow を上書きしていないこと（影と内側ハイライトが消えて平らになる）
  assert.ok(!/\.qc\[data-recap\]\{[^}]*box-shadow/.test(CSS), '.qc[data-recap] が box-shadow を上書きしている');
});

t('B1 のチップ変数は --chip- 接頭辞（vars.css の共通トークンと衝突させない）', () => {
  const m = /\.chip\[data-load\]::after\{([^}]*)\}/.exec(CSS);
  assert.ok(m, '.chip[data-load]::after が無い');
  const vars = m[1].match(/var\(--[a-z0-9-]+/g) || [];
  vars.forEach(v => {
    const name = v.slice(4);
    assert.ok(/^--chip-/.test(name) || /^--(yl|or|gr|rd|tx|ts)$/.test(name),
      '接頭辞の無い短い変数 ' + name + ' を使っている（vars.css と衝突しうる）');
  });
});

console.log('\n' + (fail ? 'FAILED  ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
