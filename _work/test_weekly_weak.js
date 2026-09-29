/**
 * 週ごとの弱点の推移（mec_weekly_v1・2026-09-29〜）の検証。
 * 実ソース（progress.js・attempts.js・hub_opening.js）を vm で読み込む。
 *
 * 守るもの:
 *   ① 出来事の判定（克服／忘却／取りこぼし／再発）の境目
 *   ② 同じ日の解き直しの正解を「克服」に数えない
 *   ③ 記帳：章×形式のマスに全国差の材料が貯まり、myrate は今回ぶんを引いて「直前」を作る
 *   ④ 2台の端末で同期しても二重に数えない（何度マージしても同じ）
 *   ⑤ 週の報告：露呈・縮んだ・広がった・慢性
 *   ⑥ 配線：記帳の口は MecAttempts.log（と attempts.js を読まない過去問ビューア）だけ／
 *      study は myrate → log → SRS の順／同期・バックアップが weekMerge を通す
 *
 * Run: node _work/test_weekly_weak.js
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const P_SRC = fs.readFileSync(path.join(ROOT, 'progress.js'), 'utf8');
const A_SRC = fs.readFileSync(path.join(ROOT, 'attempts.js'), 'utf8');
const H_SRC = fs.readFileSync(path.join(ROOT, 'hub_opening.js'), 'utf8');
const EX_SRC = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const CE_SRC = fs.readFileSync(path.join(ROOT, 'chapter_exam.js'), 'utf8');
const STATS = fs.readFileSync(path.join(ROOT, 'stats.html'), 'utf8');
const INDEX = require('./lib_hub_source')();

const KW = 'mec_weekly_v1';

function makeEnv(initial) {
  const store = Object.assign(Object.create(null), initial || {});
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  };
  const stubEl = () => ({
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, textContent: '',
    addEventListener() {}, appendChild() {}, prepend() {}, after() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
    getBoundingClientRect() { return { height: 0, top: 0 }; },
  });
  const document = {
    addEventListener() {}, createElement: stubEl, head: { appendChild() {} }, body: { appendChild() {} },
    querySelector() { return null; }, querySelectorAll() { return []; }, dispatchEvent() { return true; },
    getElementById() { return null; }, hidden: false,
  };
  const win = { addEventListener() {} };
  const sb = {
    window: win, document, localStorage,
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState() {} },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    setTimeout, clearTimeout, console, performance: { now: () => 0 },
  };
  sb.self = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(P_SRC.replace('window.MECSync = {', 'window.__mergeRemote = _mergeRemote;\n  window.MECSync = {'), sb, { filename: 'progress.js' });
  Object.assign(sb, win);
  vm.runInContext(A_SRC, sb, { filename: 'attempts.js' });
  vm.runInContext(H_SRC, sb, { filename: 'hub_opening.js' });
  return { store, win, M: win.MECSync, A: win.MecAttempts, led: () => JSON.parse(store[KW] || '{"w":{}}') };
}
// JST の日付＋時 → 分単位epoch
function tMin(ds, hh) { return Math.floor((Date.parse(ds + 'T00:00:00Z') - 9 * 3600000 + (hh || 10) * 3600000) / 60000); }
const plain = o => JSON.parse(JSON.stringify(o));

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + (e && e.stack || e)); } }

// ── ① 判定 ──
test('① 前回誤答の問題を3日あけて正解＝克服', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 0, total: 1 }, last: { t: t - 3 * 1440, ok: false }, t }), 'R');
});
test('② 同じ日・2日後の解き直しの正解は克服に数えない', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10', 20);
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 0, total: 1 }, last: { t: t - 60, ok: false }, t }), '');
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 0, total: 1 }, last: { t: t - 2 * 1440, ok: false }, t }), '');
});
test('② SRS の最終閲覧（通常モード）が近ければ、生ログが古くても克服に数えない', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  const srs = { reps: 0, interval: 1, lastSeen: '2026-09-09' };
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 0, total: 1 }, srs, last: { t: t - 5 * 1440, ok: false }, t }), '');
});
test('① 弱点ではない問題（前回正解・weakTags なし）の正解は出来事にならない', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 2, total: 2 }, last: { t: t - 10 * 1440, ok: true }, t }), '');
});
test('① 生ログに無くても weakTags（反復ミス・取りこぼし）が付く問題なら克服', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  // 反復ミス：3回中1回
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 1, total: 3 }, srs: { reps: 2, interval: 6, lastSeen: '2026-09-01' }, t }), 'R');
  // 取りこぼし：全国85%で自分0/1
  assert.strictEqual(M.weekClassify({ ok: true, prev: { correct: 0, total: 1 }, nat: 85, srs: { reps: 1, interval: 1, lastSeen: '2026-09-02' }, t }), 'R');
});
test('① 忘却＝間隔7日以上に育った問題を落とした', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 3, total: 3 }, nat: 50, srs: { reps: 3, interval: 7, lastSeen: '2026-09-03' }, t }), 'L');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 2, total: 2 }, nat: 50, srs: { reps: 2, interval: 6, lastSeen: '2026-09-04' }, t }), '');
});
test('① 取りこぼし＝初めて解いて落とした／全国80%以上を落とした', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  assert.strictEqual(M.weekClassify({ ok: false, prev: null, nat: 40, t }), 'M');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 1, total: 2 }, nat: 80, t }), 'M');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 1, total: 2 }, nat: 79, t }), '');
});
test('① 再発＝直近の出来事が克服だった問題を落とした（忘却より優先）', () => {
  const { M } = makeEnv();
  const t = tMin('2026-09-10');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 3, total: 3 }, srs: { reps: 3, interval: 20 }, lastEv: 'R', t }), 'X');
  assert.strictEqual(M.weekClassify({ ok: false, prev: { correct: 3, total: 3 }, lastEv: 'X', t }), '');
});

// ── ③ 記帳 ──
test('③ myrate は今回ぶんを引いて「直前」にする（初回の誤答＝取りこぼし）', () => {
  const E = makeEnv();
  const code = E.M.weekRecord({ uid: 'circ_ch03_q12', ok: false, nat: 55, mr: { correct: 0, total: 1 }, ty: 'tx', t: tMin('2026-09-08') });
  assert.strictEqual(code, 'M');
  const L = E.led();
  const devs = L.w['2026-09-07'];
  assert(devs, '月曜 2026-09-07 の週に入っていない: ' + Object.keys(L.w));
  const D = devs[Object.keys(devs)[0]];
  assert.deepStrictEqual(D.c['circ_ch03|tx'], [1, 0, 1, 0, 55]);
  assert.strictEqual(D.e['circ_ch03_q12'][0], 'M');
});
test('③ 克服 → 同じ週にまた落とす＝再発で上書き', () => {
  const E = makeEnv();
  const u = 'resp_ch02_q5';
  E.M.weekRecord({ uid: u, ok: false, nat: 60, mr: { correct: 0, total: 1 }, ty: 'dx', t: tMin('2026-09-01') });
  const r = E.M.weekRecord({ uid: u, ok: true, nat: 60, mr: { correct: 1, total: 2 }, ty: 'dx', t: tMin('2026-09-04'), last: { t: tMin('2026-09-01'), ok: false } });
  assert.strictEqual(r, 'R');
  const x = E.M.weekRecord({ uid: u, ok: false, nat: 60, mr: { correct: 1, total: 3 }, ty: 'dx', t: tMin('2026-09-05'), last: { t: tMin('2026-09-04'), ok: true } });
  assert.strictEqual(x, 'X');
  const rep = E.M.weekReport(E.led(), '2026-08-31');
  assert.strictEqual(rep.counts.X, 1);
  assert.strictEqual(rep.counts.R, 0);
});
test('③ 自作・暗記メモは記帳しない', () => {
  const E = makeEnv();
  E.M.weekRecord({ uid: 'custom_x_q1', ok: false, t: tMin('2026-09-08') });
  E.M.weekRecord({ uid: 'memo_ch01_q1', ok: false, t: tMin('2026-09-08') });
  assert.deepStrictEqual(E.led().w, {});
});
test('③ MecAttempts.log が台帳へ記帳する（直前の解答は追記前の生ログから拾う）', () => {
  const E = makeEnv();
  E.A.log({ uid: 'hema_ch01_q3', ok: false, rate: 90, mr: { correct: 0, total: 1 }, sess: 's1', n: 1 });
  E.A.log({ uid: 'hema_ch01_q3', ok: true, rate: 90, mr: { correct: 1, total: 2 }, sess: 's1', n: 2 });
  const L = E.led();
  const wk = Object.keys(L.w)[0];
  const D = L.w[wk][Object.keys(L.w[wk])[0]];
  const cell = Object.keys(D.c).find(k => k.startsWith('hema_ch01|'));
  assert.deepStrictEqual(D.c[cell].slice(0, 4), [2, 1, 2, 1]);
  // 同じ分の解き直しなので克服にならず、最初の取りこぼしが残る
  assert.strictEqual(D.e['hema_ch01_q3'][0], 'M');
  assert.strictEqual(E.A.all().length, 2, '解答ログは必ず書く');
});
test('③ 30週より古い週は落とす', () => {
  const E = makeEnv();
  for (let i = 0; i < 35; i++) {
    const d = new Date(Date.parse('2026-01-05T00:00:00Z') + i * 7 * 86400000).toISOString().slice(0, 10);
    E.M.weekRecord({ uid: 'endo_ch01_q1', ok: true, mr: { correct: 1, total: 1 }, ty: 'know', t: tMin(d) });
  }
  const ks = Object.keys(E.led().w).sort();
  assert.strictEqual(ks.length, 30);
  assert.strictEqual(ks[ks.length - 1], '2026-08-31');
});

// ── ④ 同期 ──
function deviceHistory(E, uidBase, days, seed) {
  let x = seed;
  const r = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let d = 0; d < days; d++) {
    const ds = new Date(Date.parse('2026-09-07T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
    for (let n = 1; n <= 20; n++) {
      E.M.weekRecord({ uid: uidBase + '_q' + n, ok: r() < 0.6, nat: 70, mr: { correct: 0, total: 1 }, ty: 'tx', t: tMin(ds, 9) + n });
    }
  }
}
test('④ 2台の台帳を合わせても二重に数えず、何度合わせても同じ', () => {
  const A = makeEnv(), B = makeEnv();
  deviceHistory(A, 'circ_ch01', 3, 1);
  deviceHistory(B, 'circ_ch01', 2, 2);
  const la = A.led(), lb = B.led();
  const m1 = A.M.weekMerge(la, lb);
  const m2 = A.M.weekMerge(m1, lb);
  const m3 = A.M.weekMerge(lb, A.M.weekMerge(la, m1));
  assert.deepStrictEqual(plain(m2), plain(m1));
  assert.deepStrictEqual(plain(A.M.weekReport(m3, '2026-09-07')), plain(A.M.weekReport(m1, '2026-09-07')));
  const rep = A.M.weekReport(m1, '2026-09-07');
  assert.strictEqual(rep.total.n, 100, '3日×20＋2日×20');
});
test('④ 古いコピーが後から来ても新しい方が勝つ', () => {
  const A = makeEnv();
  deviceHistory(A, 'circ_ch01', 1, 3);
  const old = A.led();
  deviceHistory(A, 'circ_ch01', 2, 4);
  const now = A.led();
  assert.deepStrictEqual(plain(A.M.weekMerge(now, old)), plain(A.M.weekMerge(now, {})));
});
test('④ _mergeRemote が週の台帳を取り込む', () => {
  const A = makeEnv(), B = makeEnv();
  deviceHistory(B, 'neur_ch02', 1, 5);
  A.win.__mergeRemote({ [KW]: B.led() });
  assert.strictEqual(A.M.weekReport(A.led(), '2026-09-07').total.n, 20);
});
test('④ push の payload と Gist の分割に入っている', () => {
  assert(/payload\[K_WEEKLY\] = weekRead\(\)/.test(P_SRC));
  assert(/\[K_WEEKLY\]: 'mec_weekly\.json'/.test(P_SRC));
});

// ── ⑤ 報告 ──
function cells(E, mon, key, n, c, nat) {
  // 1週ぶんのマスを直接作る（n 回解いて c 回正解・全国 nat%）
  const L = E.led();
  L.w = L.w || {};
  const W = L.w[mon] = L.w[mon] || {};
  const D = W.dev1 = W.dev1 || { c: {}, e: {} };
  D.c[key] = [n, c, n, c, n * nat];
  E.store[KW] = JSON.stringify(L);
}
test('⑤ 露呈（全国を5pt以上下回る・8回以上）は失点順、縮んだ／広がった／慢性', () => {
  const E = makeEnv();
  // 前4週: circ_ch01 は全国70%に対して40%（−30）、resp_ch01 は70%（±0）
  ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'].forEach(m => {
    cells(E, m, 'circ_ch01|tx', 10, 4, 70);
    cells(E, m, 'resp_ch01|dx', 10, 7, 70);
  });
  // 先々週・先週も hema_ch01 は下回る
  cells(E, '2026-08-24', 'hema_ch01|know', 10, 5, 70);
  cells(E, '2026-08-31', 'hema_ch01|know', 10, 5, 70);
  // 今週: circ は 70%（縮んだ）、resp は 40%（広がった）、hema は 50%（3週連続＝慢性）
  const mon = '2026-09-07';
  cells(E, mon, 'circ_ch01|tx', 10, 7, 70);
  cells(E, mon, 'resp_ch01|dx', 10, 4, 70);
  cells(E, mon, 'hema_ch01|know', 10, 5, 70);
  cells(E, mon, 'neur_ch01|tx', 5, 0, 70);      // 8回未満は露呈に出さない
  const r = E.M.weekReport(E.led(), mon);
  const keys = a => plain(a.map(x => x.key));
  assert.deepStrictEqual(keys(r.views.ch.exposed), ['resp_ch01', 'hema_ch01']);
  assert.deepStrictEqual(keys(r.views.ch.improved), ['circ_ch01']);
  assert.strictEqual(r.views.ch.improved[0].delta, 30);
  assert.deepStrictEqual(keys(r.views.ch.worsened), ['resp_ch01']);
  assert.deepStrictEqual(keys(r.views.ch.chronic), ['hema_ch01']);
  // 科目×形式の見方
  assert.deepStrictEqual(keys(r.views.ty.exposed), ['resp|dx', 'hema|know']);
  assert.strictEqual(r.views.ty.exposed[0].now.gap, -30);
});
test('⑤ 形式が空（qmeta を読む前の解答）は章には入り、形式には入らない', () => {
  const E = makeEnv();
  cells(E, '2026-09-07', 'circ_ch01|', 10, 2, 70);
  const r = E.M.weekReport(E.led(), '2026-09-07');
  assert.strictEqual(r.views.ch.exposed.length, 1);
  assert.strictEqual(r.views.ty.exposed.length, 0);
});
test('⑤ 出来事の件数と一覧（新しい順）・先週の件数', () => {
  const E = makeEnv();
  E.M.weekRecord({ uid: 'a_ch01_q1', ok: false, mr: { correct: 0, total: 1 }, ty: 'tx', t: tMin('2026-09-01') });
  E.M.weekRecord({ uid: 'a_ch01_q2', ok: false, mr: { correct: 0, total: 1 }, ty: 'tx', t: tMin('2026-09-08') });
  E.M.weekRecord({ uid: 'a_ch01_q3', ok: false, mr: { correct: 0, total: 1 }, ty: 'tx', t: tMin('2026-09-09') });
  const r = E.M.weekReport(E.led(), '2026-09-07');
  assert.deepStrictEqual(plain(r.counts), { R: 0, L: 0, M: 2, X: 0 });
  assert.deepStrictEqual(plain(r.prevCounts), { R: 0, L: 0, M: 1, X: 0 });
  assert.deepStrictEqual(plain(r.events.M), ['a_ch01_q3', 'a_ch01_q2']);
  assert.deepStrictEqual(plain(E.M.weekList(E.led())), ['2026-08-31', '2026-09-07']);
});

// ── ⑥ 配線 ──
test('⑥ study の3つの採点経路は myrate → 解答ログ → SRS の順', () => {
  const re = /_recordMyRate\(uid, (true|false)\);[\s\S]{0,200}?_logAttempt\([\s\S]{0,120}?_updateSRS\(uid/g;
  const n = (EX_SRC.match(re) || []).length;
  assert.strictEqual(n, 3, '順番どおりの経路が3つ無い: ' + n);
  const i = EX_SRC.indexOf('function _logAttempt');
  const body = EX_SRC.slice(i, EX_SRC.indexOf('\n}', i));
  assert(/mr: _myrate\[uid\]/.test(body) && /srs: /.test(body), '_logAttempt が判定材料を渡していない');
});
test('⑥ 記帳は log の1本（study_exam.js は weekRecord を直接呼ばない）', () => {
  assert(!/weekRecord\(/.test(EX_SRC));
  assert(/MECSync\.weekRecord\(/.test(A_SRC));
  // 過去問ビューアは attempts.js を読まないので、自前の経路からも記帳する
  assert(/MECSync\.weekRecord\(/.test(CE_SRC));
});
test('⑥ バックアップの復元は weekMerge を通す', () => {
  const i = INDEX.indexOf('function _applyBackupData');
  const body = INDEX.slice(i, INDEX.indexOf('\nfunction ', i + 10));
  assert(/MECSync\.weekMerge\(/.test(body));
  assert(/mec_weekly_v1/.test(INDEX.slice(INDEX.indexOf('function exportBackup'), i)));
});
test('⑥ 画面側は判定を書き写さず weekReport を読む', () => {
  assert(/MECSync\.weekReport\(/.test(STATS), 'stats.html');
  assert(/weekReport\(/.test(H_SRC), 'hub_opening.js');
  assert(!/WK_RECOVER_DAYS|WK_LAPSE_IVL/.test(STATS + H_SRC), '境目の定数を書き写している');
  assert(/data-sec-id="weekTrend"/.test(STATS), '週ごとの推移のセクションが無い');
});

console.log('\n' + (fails.length ? 'FAILED ' + fails.length + ' / ' : 'all passed  ') + '(' + passed + '/' + (passed + fails.length) + ')');
process.exit(fails.length ? 1 : 0);
