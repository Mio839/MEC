/**
 * attempts.js（解答イベントログ）の検証。実ソースを vm で読み込む。
 * Run: node _work/test_attempts.js
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'attempts.js'), 'utf8');

function env(initial) {
  const store = Object.assign(Object.create(null), initial || {});
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  };
  const win = {};
  const ctx = { window: win, localStorage };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { A: win.MecAttempts, store };
}

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + e.message); } }

test('log then all: round-trips every field', () => {
  const { A } = env();
  A.log({ uid: 'circ_ch03_q12', ok: false, choice: 'c', sec: 14, mode: 'e', sess: 'abc123', n: 23 });
  const [a] = A.all();
  assert.strictEqual(a.uid, 'circ_ch03_q12');
  assert.strictEqual(a.ok, false);
  assert.strictEqual(a.choice, 'c');
  assert.strictEqual(a.sec, 14);
  assert.strictEqual(a.mode, 'e');
  assert.strictEqual(a.sess, 'abc123');
  assert.strictEqual(a.n, 23);
});

test('record is a single pipe-delimited line (keeps the synced payload small)', () => {
  const { A, store } = env();
  A.log({ uid: 'q1', ok: true, choice: 'a', sec: 5, sess: 's', n: 1 });
  const arr = JSON.parse(store['mec_attempts_v1']);
  assert.strictEqual(arr.length, 1);
  assert.strictEqual(typeof arr[0], 'string');
  assert.strictEqual(arr[0].split('|').length, 8);
});

test('seenAt is converted to elapsed seconds', () => {
  const { A } = env();
  A.log({ uid: 'q1', ok: true, choice: 'a', seenAt: Date.now() - 7400, sess: 's', n: 1 });
  assert.strictEqual(A.all()[0].sec, 7);
});

test('absurd elapsed time (left the tab open) is stored as null, not a bogus number', () => {
  const { A } = env();
  A.log({ uid: 'q1', ok: true, choice: 'a', seenAt: Date.now() - 3600 * 1000, sess: 's', n: 1 });
  assert.strictEqual(A.all()[0].sec, null);
});

test('normChoice folds full-width labels to half-width lowercase', () => {
  const { A } = env();
  assert.strictEqual(A.normChoice('ａ　視床下部'), 'a');
  assert.strictEqual(A.normChoice('Ｅ　性腺'), 'e');
  assert.strictEqual(A.normChoice('c 副腎'), 'c');
  assert.strictEqual(A.normChoice('①なにか'), '');
  assert.strictEqual(A.normChoice(''), '');
});

test('ring buffer keeps only the newest CAP records', () => {
  const { A } = env();
  for (let i = 0; i < A.CAP + 50; i++) A.log({ uid: 'q' + i, ok: true, choice: 'a', sec: 1, sess: 's', n: i });
  const all = A.all();
  assert.strictEqual(all.length, A.CAP);
  assert.strictEqual(all[all.length - 1].uid, 'q' + (A.CAP + 49));
});

test('uid containing the delimiter is refused rather than corrupting the log', () => {
  const { A } = env();
  A.log({ uid: 'bad|uid', ok: true, choice: 'a', sec: 1, sess: 's', n: 1 });
  assert.strictEqual(A.all().length, 0);
});

test('corrupt storage does not throw', () => {
  const { A } = env({ 'mec_attempts_v1': '{not json' });
  assert.strictEqual(A.all().length, 0);
  A.log({ uid: 'q1', ok: true, choice: 'a', sec: 1, sess: 's', n: 1 });
  assert.strictEqual(A.all().length, 1);
});

test('all() returns oldest-first so flip detection reads in order', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify(['q2|200|a|0|3|e|s|2', 'q1|100|a|1|3|e|s|1']);
  assert.strictEqual(A.all().map(a => a.uid).join(','), 'q1,q2');
});

// ── todayWrongUids（ハブの「今日の誤答を再履修」の正本） ──────────────────────
// 行を直接組み立てる（log() は必ず「今」の時刻を打つので、昨日ぶんを作れないため）。
const MIN = 60000;
function line(uid, ms, ok) {
  return [uid, Math.floor(ms / MIN), 'a', ok ? 1 : 0, 3, 'e', 's', 1].join('|');
}
// JSTのその日の正午。日境界のテストが実行時刻に左右されないようにする
function jstNoon(dayOffset) {
  const d = new Date(Date.now() + 9 * 3600000);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - 9 * 3600000 + (12 + 24 * (dayOffset || 0)) * 3600000;
}

test('todayWrongUids: 今日の誤答だけを拾う（正解は入らない）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([
    line('endo_ch01_q1', jstNoon(), false),
    line('endo_ch01_q2', jstNoon(), true),
    line('endo_ch01_q3', jstNoon(), false),
  ]);
  assert.strictEqual(A.todayWrongUids().join(","), ['endo_ch01_q1', 'endo_ch01_q3'].join(","));
});

test('todayWrongUids: 昨日の誤答は入らない（日はJSTで切る）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([
    line('endo_ch01_q9', jstNoon(-1), false),
    line('endo_ch01_q1', jstNoon(), false),
  ]);
  assert.strictEqual(A.todayWrongUids().join(","), ['endo_ch01_q1'].join(","));
});

test('todayWrongUids: あとで正解し直しても残る（今日間違えた問題すべてが対象）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([
    line('endo_ch01_q1', jstNoon(), false),
    line('endo_ch01_q1', jstNoon() + 30 * MIN, true),   // 再履修で正解し直した
  ]);
  assert.strictEqual(A.todayWrongUids().join(","), ['endo_ch01_q1'].join(","));
});

test('todayWrongUids: 同じ問題を何度落としても1件（出題が重複しない）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([
    line('endo_ch01_q1', jstNoon(), false),
    line('endo_ch01_q1', jstNoon() + 10 * MIN, false),
  ]);
  assert.strictEqual(A.todayWrongUids().join(","), ['endo_ch01_q1'].join(","));
});

test('todayWrongUids: 並びは最初に落とした順（時系列で取りこぼしに戻る）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([
    line('b', jstNoon() + 20 * MIN, false),
    line('a', jstNoon() + 5 * MIN, false),
    line('c', jstNoon() + 40 * MIN, false),
  ]);
  assert.strictEqual(A.todayWrongUids().join(","), ['a', 'b', 'c'].join(","));
});

test('todayWrongUids: 誤答が無ければ空（ボタンは押せない状態になる）', () => {
  const { A, store } = env();
  store['mec_attempts_v1'] = JSON.stringify([line('endo_ch01_q2', jstNoon(), true)]);
  assert.strictEqual(A.todayWrongUids().join(","), [].join(","));
  assert.strictEqual(env().A.todayWrongUids().join(","), [].join(","));   // ログ自体が無い場合
});

test('jstDay は study.html の _today() と同じ式（日境界がページ間でずれない）', () => {
  const { A } = env();
  const same = ms => new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
  [Date.now(), jstNoon(), jstNoon(-3), Date.UTC(2026, 7, 4, 14, 59)].forEach(ms => {
    assert.strictEqual(A.jstDay(ms), same(ms));
  });
});

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + fails.length) + ')');
if (fails.length) process.exit(1);
