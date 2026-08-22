/**
 * 連続日数（🔥）と activity_v1 の記録を実ソースで検証する。
 * Run: node _work/test_streak.js
 *
 * 背景: 試験モードは done_v2 を直接書いており logActivity を通していなかったため、
 * 試験モードだけで学習した日は activity_v1 に残らず連続日数が伸びなかった。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'progress.js'), 'utf8');
const EXAM = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');

function env(store) {
  const s = Object.assign(Object.create(null), store || {});
  const ls = {
    getItem: k => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: k => { delete s[k]; },
  };
  const mk = () => ({
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    textContent: '', setAttribute() {}, addEventListener() {}, appendChild() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    getBoundingClientRect: () => ({ height: 0, top: 0 }),
  });
  const doc = {
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    createElement: mk, createRange: () => ({ selectNodeContents() {} }),
    execCommand: () => false, head: { appendChild() {} },
    body: { appendChild() {}, classList: { add() {}, remove() {} } },
    querySelector: () => null, querySelectorAll: () => [], documentElement: mk(), hidden: false,
  };
  const w = {
    document: doc, localStorage: ls,
    location: { href: 'https://x/', search: '', hash: '', pathname: '/' },
    history: { replaceState() {} }, getSelection: () => null, navigator: { onLine: true },
    addEventListener() {}, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    CustomEvent: function () {}, atob: x => x, btoa: x => x, requestAnimationFrame: f => f(),
  };
  const ctx = Object.assign(w, { window: w });
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { ctx, store: s };
}

// study_exam.js から関数を1つだけ切り出す（波括弧の対応で末尾を決める）
function grabFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.ok(start > 0, 'not found: ' + name);
  let depth = 0;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

const jstNow = () => new Date(Date.now() + 9 * 3600000);
const dstr = d => d.toISOString().slice(0, 10);
function daysBack(n) { const d = jstNow(); d.setDate(d.getDate() - n); return dstr(d); }
function activityFor(days) { const o = {}; days.forEach(n => { o[daysBack(n)] = 1; }); return o; }

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + e.message); } }

console.log('calcStreak');
test('連続していれば日数ぶん数える', () => {
  const { ctx } = env({ activity_v1: JSON.stringify(activityFor([0, 1, 2, 3, 4])) });
  assert.strictEqual(ctx.MECSync.calcStreak(), 5);
});
test('今日が未学習でも昨日までの連続は保つ', () => {
  const { ctx } = env({ activity_v1: JSON.stringify(activityFor([1, 2, 3])) });
  assert.strictEqual(ctx.MECSync.calcStreak(), 3);
});
test('間が空いたらそこで切れる', () => {
  const { ctx } = env({ activity_v1: JSON.stringify(activityFor([0, 2, 3])) });
  assert.strictEqual(ctx.MECSync.calcStreak(), 1);
});
test('記録が無ければ0', () => {
  const { ctx } = env({});
  assert.strictEqual(ctx.MECSync.calcStreak(), 0);
});

console.log('activity_v1 への記録');
test('通常モードの「済」で今日が記録される', () => {
  const { ctx, store } = env({});
  ctx.window.mecIncrLap({ dataset: { uid: 'dige_ch01_q1' }, querySelector: () => null,
    classList: { add() {}, remove() {}, toggle() {} }, closest: () => null });
  assert.deepStrictEqual(Object.keys(JSON.parse(store.activity_v1)), [daysBack(0)]);
});

test('mecLogActivity が公開されている（試験モードから呼ぶため）', () => {
  const { ctx } = env({});
  assert.strictEqual(typeof ctx.window.mecLogActivity, 'function');
});

test('試験モードの _markExamDone でも今日が記録される', () => {
  const { ctx, store } = env({});
  // study_exam.js から _markExamDone だけを切り出して同じ環境で動かす
  vm.runInContext(grabFn(EXAM, '_markExamDone') + '\n window.__markExamDone = _markExamDone;', ctx);
  ctx.window.__markExamDone('circ_ch02_q7');
  assert.ok(store.activity_v1, '試験モードで activity_v1 が書かれていない');
  assert.deepStrictEqual(Object.keys(JSON.parse(store.activity_v1)), [daysBack(0)]);
  assert.strictEqual(JSON.parse(store.done_v2)['circ_ch02_q7'], 1, '周回数も加算される');
});

test('同じ問題を2回解いた場合（再試験・再演習）も活動回数・周回数ともに積み上がる', () => {
  const { ctx, store } = env({});
  vm.runInContext(grabFn(EXAM, '_markExamDone') + '\n window.__markExamDone = _markExamDone;', ctx);
  ctx.window.__markExamDone('circ_ch02_q7');
  ctx.window.__markExamDone('circ_ch02_q7');
  assert.strictEqual(JSON.parse(store.activity_v1)[daysBack(0)], 2, '再試験・再演習もそれぞれ1問としてカウントされる');
  assert.strictEqual(JSON.parse(store.done_v2)['circ_ch02_q7'], 2, '周回数は2回とも加算される');
});

test('試験モードで学習した翌日も続ければ連続2日になる', () => {
  const yesterday = {}; yesterday[daysBack(1)] = 3;
  const { ctx, store } = env({ activity_v1: JSON.stringify(yesterday) });
  vm.runInContext(grabFn(EXAM, '_markExamDone') + '\n window.__markExamDone = _markExamDone;', ctx);
  ctx.window.__markExamDone('neur_ch01_q1');
  assert.strictEqual(ctx.MECSync.calcStreak(), 2);
});

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + fails.length) + ')');
if (fails.length) process.exit(1);
