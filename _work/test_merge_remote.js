/**
 * Tests for progress.js `_mergeRemote(remote)`.
 *
 * These tests load the REAL progress.js source (no copy/paste of the logic)
 * inside a Node `vm` sandbox with minimal stubs for the browser globals it
 * touches at load time (window/document/location/history/atob/CustomEvent/
 * localStorage). The only source transform is exposing the otherwise-private
 * `_mergeRemote` via `window.__mergeRemote` so tests can call it directly.
 *
 * Run:  node _work/test_merge_remote.js
 * No external deps — Node's built-in `assert`, `vm`, `fs` only.
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const SRC_PATH = path.join(__dirname, '..', 'progress.js');
const RAW = fs.readFileSync(SRC_PATH, 'utf8');

// Expose the private _mergeRemote without altering its behavior.
const PATCHED = RAW.replace(
  'window.MECSync = {',
  'window.__mergeRemote = _mergeRemote;\n  window.MECSync = {'
);
assert(PATCHED !== RAW, 'failed to inject __mergeRemote export (anchor not found)');

const DAY_MS = 24 * 3600 * 1000;

// Build a fresh sandbox + storage for each test, load the real source, and
// return the real _mergeRemote plus the backing store.
function makeEnv(initialStore) {
  const store = Object.assign(Object.create(null), initialStore || {});

  const localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
  };

  const stubEl = () => ({
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '',
    addEventListener() {}, appendChild() {}, prepend() {}, after() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; },
    getBoundingClientRect() { return { height: 0, top: 0 }; },
  });

  const document = {
    addEventListener() {},
    createElement: stubEl,
    head: { appendChild() {} },
    body: { appendChild() {} },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    dispatchEvent() { return true; },
    getElementById() { return null; },
  };

  const windowObj = { addEventListener() {} };

  const sandbox = {
    window: windowObj,
    document,
    localStorage,
    location: { hash: '', pathname: '/', search: '' },
    history: { replaceState() {} },
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; } },
    setTimeout, clearTimeout,
    console,
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(PATCHED, sandbox, { filename: 'progress.js' });

  const mergeRemote = windowObj.__mergeRemote;
  assert(typeof mergeRemote === 'function', '__mergeRemote not exposed after load');

  return {
    mergeRemote,
    store,
    // helpers to read parsed values back out of the (string) store
    getObj(k) { return JSON.parse(store[k] || '{}'); },
    getArr(k) { return JSON.parse(store[k] || '[]'); },
    getRaw(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  };
}

// key constants (mirror progress.js)
const KD = 'done_v2', KF = 'flag_v2', KA = 'activity_v1', KR = 'myrate_v1',
      KT = 'studytime_v1', KE = 'mec_exam_resumes_v1', KDT = 'done_tombstones_v1',
      K_SRS = 'mec_srs_v1', KRT = 'mec_exam_resume_tombstones_v1',
      KRK = 'mec_exam_resume_key_tombs_v1',
      KER = 'error_reports_v1', K_ERR_CLEARED = 'mec_err_cleared_at',
      KCH = 'mec_ch_exam_v1', KFT = 'flag_tombstones_v1', KC = 'mec_choice_v1',
      KAT = 'mec_attempts_v1';

// attempts のレコード文字列を組み立てる: uid|t|c|o|s|m|sess|n
function att(uid, t, sess, n, opt) {
  opt = opt || {};
  return [uid, t, opt.c || 'a', opt.o === undefined ? 1 : opt.o,
          opt.s === undefined ? 10 : opt.s, opt.m || 'e', sess, n].join('|');
}

// seed helper: turn an object map of {key: value} into a store of JSON strings
function seed(map) {
  const s = {};
  for (const k of Object.keys(map)) s[k] = JSON.stringify(map[k]);
  return s;
}

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  - ' + name); }
  catch (e) { failures.push({ name, e }); console.log('FAIL  - ' + name + '\n        ' + (e && e.message)); }
}

// ─────────────────────────────────────────────────────────────────────────
console.log('done_v2 (周回数)');

test('union: distinct UIDs from local and remote both survive', () => {
  const env = makeEnv(seed({ [KD]: { a: 1 } }));
  env.mergeRemote({ [KD]: { b: 2 } });
  assert.deepStrictEqual(env.getObj(KD), { a: 1, b: 2 });
});

test('max-merge: same UID keeps the larger lap count (remote larger)', () => {
  const env = makeEnv(seed({ [KD]: { a: 1 } }));
  env.mergeRemote({ [KD]: { a: 3 } });
  assert.strictEqual(env.getObj(KD).a, 3);
});

test('max-merge: same UID keeps the larger lap count (local larger)', () => {
  const env = makeEnv(seed({ [KD]: { a: 5 } }));
  env.mergeRemote({ [KD]: { a: 2 } });
  assert.strictEqual(env.getObj(KD).a, 5);
});

test('empty remote leaves local done untouched', () => {
  const env = makeEnv(seed({ [KD]: { a: 4, b: 1 } }));
  env.mergeRemote({});
  assert.deepStrictEqual(env.getObj(KD), { a: 4, b: 1 });
});

// ─────────────────────────────────────────────────────────────────────────
console.log('done_tombstones_v1 (削除の伝播)');

test('local tombstone deletes a UID that still exists in remote done', () => {
  const now = Date.now();
  const env = makeEnv(seed({ [KD]: {}, [KDT]: { x: now } }));
  env.mergeRemote({ [KD]: { x: 2 } });
  assert.ok(!('x' in env.getObj(KD)), 'x should be deleted from done');
  assert.ok('x' in env.getObj(KDT), 'fresh tombstone should be persisted');
});

test('remote tombstone deletes a UID that exists in local done', () => {
  const now = Date.now();
  const env = makeEnv(seed({ [KD]: { x: 1 } }));
  env.mergeRemote({ [KD]: { x: 3 }, [KDT]: { x: now } });
  assert.ok(!('x' in env.getObj(KD)), 'x should be deleted from done');
});

test('tombstone timestamps merge to the max of local/remote', () => {
  const older = Date.now() - 5 * DAY_MS;
  const newer = Date.now() - 1 * DAY_MS;
  const env = makeEnv(seed({ [KDT]: { x: older } }));
  env.mergeRemote({ [KDT]: { x: newer } });
  assert.strictEqual(env.getObj(KDT).x, newer);
});

test('non-tombstoned UIDs are unaffected by a tombstone on another UID', () => {
  const now = Date.now();
  const env = makeEnv(seed({ [KD]: { keep: 2 }, [KDT]: { drop: now } }));
  env.mergeRemote({ [KD]: { drop: 5, keep: 1 } });
  const done = env.getObj(KD);
  assert.strictEqual(done.keep, 2);
  assert.ok(!('drop' in done));
});

// ─────────────────────────────────────────────────────────────────────────
console.log('done_tombstones_v1 期限切れ (60日)');

test('expired tombstone (>60d) is dropped from persisted tombstones', () => {
  const expired = Date.now() - 61 * DAY_MS;
  const env = makeEnv(seed({ [KD]: {}, [KDT]: { x: expired } }));
  env.mergeRemote({ [KD]: { x: 2 } });
  assert.ok(!('x' in env.getObj(KDT)), 'expired tombstone must not persist');
});

test('after expiry a subsequent merge lets the remote value come back', () => {
  const expired = Date.now() - 61 * DAY_MS;
  // Persisted local state carries KDT forward across merges via `store`.
  // NOTE: _mergeRemote mutates its `remote` arg (deletes tombstoned keys from
  // remote[KD]); production passes a fresh JSON.parse each sync, so we clone.
  const env = makeEnv(seed({ [KD]: {}, [KDT]: { x: expired } }));
  const freshRemote = () => ({ [KD]: { x: 2 } });
  env.mergeRemote(freshRemote());    // merge #1: tomb applied then expired/dropped
  env.mergeRemote(freshRemote());    // merge #2: no tombstone remains
  assert.strictEqual(env.getObj(KD).x, 2, 'remote value should be restored on 2nd merge');
});

test('QUIRK: within the same merge an expired tombstone still deletes the value', () => {
  // Documents actual behavior: deletion loop runs BEFORE the expiry filter,
  // so an already-expired tombstone still removes the value on THIS pass.
  const expired = Date.now() - 61 * DAY_MS;
  const env = makeEnv(seed({ [KD]: {}, [KDT]: { x: expired } }));
  env.mergeRemote({ [KD]: { x: 2 } });
  assert.ok(!('x' in env.getObj(KD)), 'value still deleted on the expiring pass');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('flag_v2 (union)');

test('flags union across local and remote', () => {
  const env = makeEnv(seed({ [KF]: { a: 1 } }));
  env.mergeRemote({ [KF]: { b: 1 } });
  assert.deepStrictEqual(env.getObj(KF), { a: 1, b: 1 });
});

test('flags: local value wins on key conflict (spread {...remote,...local})', () => {
  const env = makeEnv(seed({ [KF]: { a: 1 } }));
  env.mergeRemote({ [KF]: { a: 1, c: 1 } });
  assert.deepStrictEqual(env.getObj(KF), { a: 1, c: 1 });
});

// ─────────────────────────────────────────────────────────────────────────
console.log('flag_tombstones_v1 (旗解除の伝播)');

test('flag tombstone: local unflag deletes an older remote flag', () => {
  const flaggedAt = Date.now() - 2 * DAY_MS;
  const unflaggedAt = Date.now() - 1 * DAY_MS;
  const env = makeEnv(seed({ [KF]: {}, [KFT]: { x: unflaggedAt } }));
  env.mergeRemote({ [KF]: { x: flaggedAt } });
  assert.ok(!('x' in env.getObj(KF)), 'unflagged x must not revive from remote');
  assert.ok('x' in env.getObj(KFT), 'tombstone persists for future merges');
});

test('flag tombstone: legacy flag value 1 is treated as older than any tombstone', () => {
  const env = makeEnv(seed({ [KF]: {}, [KFT]: { x: Date.now() } }));
  env.mergeRemote({ [KF]: { x: 1 } });
  assert.ok(!('x' in env.getObj(KF)));
});

test('flag tombstone: re-flag newer than tombstone survives and clears the tombstone', () => {
  const unflaggedAt = Date.now() - 2 * DAY_MS;
  const reflaggedAt = Date.now() - 1 * DAY_MS;
  const env = makeEnv(seed({ [KF]: { x: reflaggedAt } }));
  env.mergeRemote({ [KF]: {}, [KFT]: { x: unflaggedAt } });
  assert.strictEqual(env.getObj(KF).x, reflaggedAt, 're-flag must survive an older remote tombstone');
  assert.ok(!('x' in env.getObj(KFT)), 'obsolete tombstone must be dropped');
});

test('flag tombstone: remote tombstone deletes a legacy local flag', () => {
  const env = makeEnv(seed({ [KF]: { x: 1 } }));
  env.mergeRemote({ [KFT]: { x: Date.now() } });
  assert.ok(!('x' in env.getObj(KF)));
});

test('flag tombstone: expired (>60d) tombstone is dropped from persisted store', () => {
  const expired = Date.now() - 61 * DAY_MS;
  const env = makeEnv(seed({ [KF]: {}, [KFT]: { x: expired } }));
  env.mergeRemote({});
  assert.ok(!('x' in env.getObj(KFT)));
});

test('flag tombstone: flags on other UIDs are unaffected', () => {
  const env = makeEnv(seed({ [KF]: { keep: 1 }, [KFT]: { drop: Date.now() } }));
  env.mergeRemote({ [KF]: { drop: 1, keep: 1 } });
  const f = env.getObj(KF);
  assert.ok('keep' in f);
  assert.ok(!('drop' in f));
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_choice_v1 (誤答選択肢の記録)');

test('choice: uid present only in remote is adopted', () => {
  const env = makeEnv(seed({ [KC]: {} }));
  env.mergeRemote({ [KC]: { q1: { a: 2, _last: 'a' } } });
  assert.deepStrictEqual(env.getObj(KC).q1, { a: 2, _last: 'a' });
});

test('choice: per-choice counts take field-wise max', () => {
  const env = makeEnv(seed({ [KC]: { q1: { a: 3, b: 1, _last: 'b' } } }));
  env.mergeRemote({ [KC]: { q1: { a: 1, b: 4, c: 2, _last: 'c' } } });
  assert.deepStrictEqual(env.getObj(KC).q1, { a: 3, b: 4, c: 2, _last: 'b' });
});

test('choice: local _last wins; remote _last fills only when local has none', () => {
  const env = makeEnv(seed({ [KC]: { q1: { a: 1 } } }));
  env.mergeRemote({ [KC]: { q1: { a: 1, _last: 'a' } } });
  assert.strictEqual(env.getObj(KC).q1._last, 'a', 'remote _last adopted when local missing');
});

test('choice: empty remote leaves local untouched', () => {
  const env = makeEnv(seed({ [KC]: { q1: { a: 2, _last: 'a' } } }));
  env.mergeRemote({});
  assert.deepStrictEqual(env.getObj(KC).q1, { a: 2, _last: 'a' });
});

// ─────────────────────────────────────────────────────────────────────────
console.log('activity_v1 / studytime_v1 (日ごと最大値)');

test('activity: per-day max across local and remote', () => {
  const env = makeEnv(seed({ [KA]: { '2026-01-01': 5 } }));
  env.mergeRemote({ [KA]: { '2026-01-01': 3, '2026-01-02': 7 } });
  assert.deepStrictEqual(env.getObj(KA), { '2026-01-01': 5, '2026-01-02': 7 });
});

test('studytime: per-day max across local and remote', () => {
  const env = makeEnv(seed({ [KT]: { '2026-01-01': 10, '2026-01-03': 2 } }));
  env.mergeRemote({ [KT]: { '2026-01-01': 4, '2026-01-02': 8 } });
  assert.deepStrictEqual(env.getObj(KT), { '2026-01-01': 10, '2026-01-02': 8, '2026-01-03': 2 });
});

// ─────────────────────────────────────────────────────────────────────────
console.log('myrate_v1 (correct/total を各フィールドの最大値で統合)');

test('myrate: union of distinct UIDs', () => {
  const env = makeEnv(seed({ [KR]: { a: { total: 3, correct: 2 } } }));
  env.mergeRemote({ [KR]: { b: { total: 1, correct: 0 } } });
  const mr = env.getObj(KR);
  assert.deepStrictEqual(mr.a, { total: 3, correct: 2 });
  assert.deepStrictEqual(mr.b, { total: 1, correct: 0 });
});

test('myrate: field-wise max keeps larger total (local larger)', () => {
  const env = makeEnv(seed({ [KR]: { a: { total: 9, correct: 4 } } }));
  env.mergeRemote({ [KR]: { a: { total: 2, correct: 2 } } });
  assert.deepStrictEqual(env.getObj(KR).a, { total: 9, correct: 4 });
});

test('myrate: field-wise max keeps larger total (remote larger)', () => {
  const env = makeEnv(seed({ [KR]: { a: { total: 1, correct: 1 } } }));
  env.mergeRemote({ [KR]: { a: { total: 8, correct: 3 } } });
  assert.deepStrictEqual(env.getObj(KR).a, { total: 8, correct: 3 });
});

test('myrate: correct と total を独立に max（分岐した履歴を取りこぼさない）', () => {
  // local が correct 多め、remote が total 多め → 双方の最大を採る
  const env = makeEnv(seed({ [KR]: { a: { total: 2, correct: 2 } } }));
  env.mergeRemote({ [KR]: { a: { total: 5, correct: 1 } } });
  assert.deepStrictEqual(env.getObj(KR).a, { total: 5, correct: 2 });
});

test('myrate: correct <= total 不変条件が保たれる', () => {
  const env = makeEnv(seed({ [KR]: { a: { total: 3, correct: 0 } } }));
  env.mergeRemote({ [KR]: { a: { total: 2, correct: 2 } } });
  const a = env.getObj(KR).a;
  assert.strictEqual(a.total, 3);
  assert.strictEqual(a.correct, 2);
  assert.ok(a.correct <= a.total, 'correct must not exceed total');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_srs_v1 (lastSeen 新しい方)');

test('srs: union of distinct UIDs', () => {
  const env = makeEnv(seed({ [K_SRS]: { a: { lastSeen: '2026-01-01' } } }));
  env.mergeRemote({ [K_SRS]: { b: { lastSeen: '2026-01-02' } } });
  const ms = env.getObj(K_SRS);
  assert.ok(ms.a && ms.b);
});

test('srs: newer lastSeen wins (local newer)', () => {
  const env = makeEnv(seed({ [K_SRS]: { a: { lastSeen: '2026-03-01', ef: 2.5 } } }));
  env.mergeRemote({ [K_SRS]: { a: { lastSeen: '2026-01-01', ef: 1.3 } } });
  assert.strictEqual(env.getObj(K_SRS).a.ef, 2.5);
});

test('srs: newer lastSeen wins (remote newer)', () => {
  const env = makeEnv(seed({ [K_SRS]: { a: { lastSeen: '2026-01-01', ef: 1.3 } } }));
  env.mergeRemote({ [K_SRS]: { a: { lastSeen: '2026-03-01', ef: 2.5 } } });
  assert.strictEqual(env.getObj(K_SRS).a.ef, 2.5);
});

test('srs: on equal lastSeen, local wins (>= comparison)', () => {
  const env = makeEnv(seed({ [K_SRS]: { a: { lastSeen: '2026-02-02', tag: 'local' } } }));
  env.mergeRemote({ [K_SRS]: { a: { lastSeen: '2026-02-02', tag: 'remote' } } });
  assert.strictEqual(env.getObj(K_SRS).a.tag, 'local');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_ch_exam_v1 (章別試験履歴)');

test('ch-exam: bestScore & sessions take max; newer lastDate supplies last* fields', () => {
  const local = { neur: { lastDate: '2026-01-01', sessions: 2, bestScore: 70, lastScore: 70, lastCorrect: 7, lastTotal: 10 } };
  const remote = { neur: { lastDate: '2026-02-01', sessions: 1, bestScore: 60, lastScore: 60, lastCorrect: 6, lastTotal: 10 } };
  const env = makeEnv(seed({ [KCH]: local }));
  env.mergeRemote({ [KCH]: remote });
  const m = env.getObj(KCH).neur;
  assert.strictEqual(m.bestScore, 70, 'bestScore max');
  assert.strictEqual(m.sessions, 2, 'sessions max');
  assert.strictEqual(m.lastDate, '2026-02-01', 'newer lastDate wins');
  assert.strictEqual(m.lastScore, 60, 'last* fields come from newer-date side');
});

test('ch-exam: prefix present only in remote is added', () => {
  const env = makeEnv(seed({ [KCH]: {} }));
  env.mergeRemote({ [KCH]: { circ: { lastDate: '2026-01-01', sessions: 1, bestScore: 50 } } });
  assert.ok(env.getObj(KCH).circ);
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_exam_resumes_v1 (中断再開・最大5件)');

test('resumes: same key keeps the newer savedAt', () => {
  const env = makeEnv({ [KE]: JSON.stringify([{ key: 'k1', savedAt: 100 }]) });
  env.mergeRemote({ [KE]: [{ key: 'k1', savedAt: 200 }] });
  const arr = env.getArr(KE);
  assert.strictEqual(arr.length, 1);
  assert.strictEqual(arr[0].savedAt, 200);
});

test('resumes: distinct keys are merged and sorted newest-first', () => {
  const env = makeEnv({ [KE]: JSON.stringify([{ key: 'a', savedAt: 100 }]) });
  env.mergeRemote({ [KE]: [{ key: 'b', savedAt: 300 }] });
  const arr = env.getArr(KE);
  assert.deepStrictEqual(arr.map(e => e.key), ['b', 'a']);
});

test('resumes: capped at 5 entries', () => {
  const local = [];
  for (let i = 0; i < 4; i++) local.push({ key: 'L' + i, savedAt: 10 + i });
  const remote = [];
  for (let i = 0; i < 4; i++) remote.push({ key: 'R' + i, savedAt: 100 + i });
  const env = makeEnv({ [KE]: JSON.stringify(local) });
  env.mergeRemote({ [KE]: remote });
  assert.strictEqual(env.getArr(KE).length, 5);
});

test('resumes: tombstoned savedAt from remote is skipped', () => {
  const env = makeEnv({ [KE]: JSON.stringify([]), [KRT]: JSON.stringify([500]) });
  env.mergeRemote({ [KE]: [{ key: 'x', savedAt: 500 }] });
  assert.strictEqual(env.getArr(KE).length, 0, 'tombstoned resume must not be re-added');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_exam_resume_key_tombs_v1 (キー別墓標: 削除の確実な伝播)');

test('key tombstone: remote copy with an OLDER savedAt of a deleted key is not resurrected', () => {
  // savedAt は保存のたびに変わるため savedAt 墓標では他端末の古いコピーを消せない。
  // キー墓標(削除時刻T)より古い同キーのエントリはリモート由来でも破棄される。
  const T = Date.now();
  const env = makeEnv({ [KE]: JSON.stringify([]), [KRK]: JSON.stringify({ 'neur:50': T }) });
  env.mergeRemote({ [KE]: [{ key: 'neur:50', savedAt: T - 5000 }] });
  assert.strictEqual(env.getArr(KE).length, 0, 'older remote copy of a deleted key must stay deleted');
});

test('key tombstone: remote tombstone deletes a LOCAL older entry (deletion propagates)', () => {
  const T = Date.now();
  const env = makeEnv({ [KE]: JSON.stringify([{ key: 'neur:50', savedAt: T - 5000 }]) });
  env.mergeRemote({ [KRK]: { 'neur:50': T } });
  assert.strictEqual(env.getArr(KE).length, 0, 'local stale entry must be removed by remote key tombstone');
});

test('key tombstone: a NEWER session with the same key survives', () => {
  const T = Date.now() - 60000;
  const env = makeEnv({
    [KE]: JSON.stringify([{ key: 'neur:50', savedAt: T + 30000 }]),
    [KRK]: JSON.stringify({ 'neur:50': T }),
  });
  env.mergeRemote({ [KE]: [] });
  const arr = env.getArr(KE);
  assert.strictEqual(arr.length, 1, 'a session started after the deletion must survive');
});

test('key tombstone: entry saved at the exact tombstone time survives (start-then-save same ms)', () => {
  // startExam は _clearExamResume 直後に _saveExamResume するため、墓標と savedAt が
  // 同一msになり得る。比較は strict > で「同時刻」は生かす。
  const T = Date.now();
  const env = makeEnv({
    [KE]: JSON.stringify([{ key: 'neur:50', savedAt: T }]),
    [KRK]: JSON.stringify({ 'neur:50': T }),
  });
  env.mergeRemote({ [KE]: [] });
  assert.strictEqual(env.getArr(KE).length, 1);
});

test('key tombstone: local and remote tombstones merge to the max time and persist', () => {
  const T = Date.now();
  const env = makeEnv({ [KRK]: JSON.stringify({ a: T - 1000, b: T - 2000 }) });
  env.mergeRemote({ [KRK]: { a: T, c: T - 500 } });
  const kt = env.getObj(KRK);
  assert.strictEqual(kt.a, T, 'newer remote time wins');
  assert.strictEqual(kt.b, T - 2000, 'local-only tombstone kept');
  assert.strictEqual(kt.c, T - 500, 'remote-only tombstone adopted');
});

test('key tombstone: expired (>60d) tombstones are pruned from the persisted store', () => {
  const T = Date.now();
  const env = makeEnv({ [KRK]: JSON.stringify({ old: T - 61 * DAY_MS, fresh: T - 1000 }) });
  env.mergeRemote({});
  const kt = env.getObj(KRK);
  assert.ok(!('old' in kt), 'expired tombstone must be dropped');
  assert.ok('fresh' in kt, 'fresh tombstone must persist');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('error_reports_v1 (union + clear-all)');

test('error reports: union by uid|type', () => {
  const env = makeEnv({ [KER]: JSON.stringify([{ uid: 'q1', type: 'typo', reported_at: '2026-01-01' }]) });
  env.mergeRemote({ [KER]: [{ uid: 'q2', type: 'typo', reported_at: '2026-01-02' }] });
  assert.strictEqual(env.getArr(KER).length, 2);
});

test('error reports: duplicate uid|type not added twice', () => {
  const env = makeEnv({ [KER]: JSON.stringify([{ uid: 'q1', type: 'typo', reported_at: '2026-01-01' }]) });
  env.mergeRemote({ [KER]: [{ uid: 'q1', type: 'typo', reported_at: '2026-01-05' }] });
  assert.strictEqual(env.getArr(KER).length, 1);
});

test('error reports: reports older than effective clearedAt are filtered out', () => {
  const env = makeEnv({ [KER]: JSON.stringify([]), [K_ERR_CLEARED]: '2026-02-01T00:00:00.000Z' });
  env.mergeRemote({
    [KER]: [
      { uid: 'old', type: 't', reported_at: '2026-01-01T00:00:00.000Z' },
      { uid: 'new', type: 't', reported_at: '2026-03-01T00:00:00.000Z' },
    ],
  });
  const arr = env.getArr(KER);
  assert.deepStrictEqual(arr.map(r => r.uid), ['new']);
});

test('error reports: remote clearedAt newer than local is adopted', () => {
  const env = makeEnv({ [KER]: JSON.stringify([]), [K_ERR_CLEARED]: '2026-01-01T00:00:00.000Z' });
  env.mergeRemote({ _errClearedAt: '2026-05-01T00:00:00.000Z' });
  assert.strictEqual(env.getRaw(K_ERR_CLEARED), '2026-05-01T00:00:00.000Z');
});

// ─────────────────────────────────────────────────────────────────────────
console.log('mec_attempts_v1 (append-only union by sess+n)');

test('attempts: local and remote records are unioned', () => {
  const env = makeEnv({ [KAT]: JSON.stringify([att('q1', 100, 'aaa', 1)]) });
  env.mergeRemote({ [KAT]: [att('q2', 101, 'bbb', 1)] });
  const a = env.getArr(KAT);
  assert.strictEqual(a.length, 2);
  assert.deepStrictEqual(a.map(l => l.split('|')[0]), ['q1', 'q2']);
});

test('attempts: same sess+n is not duplicated (local wins)', () => {
  const env = makeEnv({ [KAT]: JSON.stringify([att('q1', 100, 'aaa', 1, { o: 1 })]) });
  env.mergeRemote({ [KAT]: [att('q1', 100, 'aaa', 1, { o: 0 })] });
  const a = env.getArr(KAT);
  assert.strictEqual(a.length, 1);
  assert.strictEqual(a[0].split('|')[3], '1', 'local record must be kept');
});

test('attempts: same uid answered twice in one session is kept (n differs)', () => {
  const env = makeEnv({ [KAT]: JSON.stringify([att('q1', 100, 'aaa', 1)]) });
  env.mergeRemote({ [KAT]: [att('q1', 105, 'aaa', 2)] });
  assert.strictEqual(env.getArr(KAT).length, 2);
});

test('attempts: merged records are sorted by time ascending', () => {
  const env = makeEnv({ [KAT]: JSON.stringify([att('q3', 300, 'aaa', 1)]) });
  env.mergeRemote({ [KAT]: [att('q1', 100, 'bbb', 1), att('q2', 200, 'bbb', 2)] });
  const times = env.getArr(KAT).map(l => Number(l.split('|')[1]));
  assert.deepStrictEqual(times, [100, 200, 300]);
});

test('attempts: total is capped at 2000, oldest dropped', () => {
  const local = [];
  for (let i = 0; i < 1500; i++) local.push(att('q' + i, i, 'aaa', i));
  const remote = [];
  for (let i = 0; i < 1000; i++) remote.push(att('r' + i, 10000 + i, 'bbb', i));
  const env = makeEnv({ [KAT]: JSON.stringify(local) });
  env.mergeRemote({ [KAT]: remote });
  const a = env.getArr(KAT);
  assert.strictEqual(a.length, 2000);
  assert.strictEqual(a[a.length - 1].split('|')[0], 'r999', 'newest must survive');
  assert.strictEqual(a[0].split('|')[0], 'q500', 'oldest 500 must be dropped');
});

test('attempts: malformed lines are dropped', () => {
  const env = makeEnv({ [KAT]: JSON.stringify(['garbage', '', 'a|b|c']) });
  env.mergeRemote({ [KAT]: [att('q1', 100, 'aaa', 1), 42, null] });
  const a = env.getArr(KAT);
  assert.strictEqual(a.length, 1);
  assert.strictEqual(a[0].split('|')[0], 'q1');
});

test('attempts: absent remote key leaves local untouched', () => {
  const env = makeEnv({ [KAT]: JSON.stringify([att('q1', 100, 'aaa', 1)]) });
  env.mergeRemote({});
  assert.strictEqual(env.getArr(KAT).length, 1);
});

// ─────────────────────────────────────────────────────────────────────────
console.log('\n' + (failures.length ? failures.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + failures.length) + ')');
if (failures.length) process.exit(1);
