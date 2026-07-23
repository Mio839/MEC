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

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + fails.length) + ')');
if (fails.length) process.exit(1);
