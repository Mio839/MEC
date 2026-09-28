/**
 * 解答ログの集計（mec_attempts_roll_v1・2026-09-28〜）の検証。
 * 実ソース（progress.js・attempts.js・hub_opening.js）を vm で読み込む。
 *
 * 守るもの:
 *   ① 上限からあふれた行は捨てずに集計へ畳まれ、生ログ＋集計の合計が全解答数と一致する
 *   ② 2台の端末がそれぞれ畳んでから同期しても二重に数えない
 *   ③ 同じ分に並んだ行を途中で切らない（ウォーターマークの前後で n が欠けない）
 *   ④ 最長連続正解は畳んだ前半から生ログの後半へ数え継がれる
 *   ⑤ 難問は行の全国正答率（9番目）→ MEC_RATE の順で判定する
 *   ⑥ 週の結果発表（hub_opening）が畳んだ分も数える
 *   ⑦ 規則を書き写していない（index.html の復元が progress.js の関数を通る）
 *
 * Run: node _work/test_attempts_roll.js
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const P_SRC = fs.readFileSync(path.join(ROOT, 'progress.js'), 'utf8');
const A_SRC = fs.readFileSync(path.join(ROOT, 'attempts.js'), 'utf8');
const H_SRC = fs.readFileSync(path.join(ROOT, 'hub_opening.js'), 'utf8');
const INDEX = require('./lib_hub_source')();

const KAT = 'mec_attempts_v1', KROLL = 'mec_attempts_roll_v1';

function makeEnv(initial, extra) {
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
  const win = Object.assign({ addEventListener() {} }, extra || {});
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
  // progress.js と attempts.js は window を共有する（ページと同じ）
  Object.assign(sb, win);
  vm.runInContext(A_SRC, sb, { filename: 'attempts.js' });
  vm.runInContext(H_SRC, sb, { filename: 'hub_opening.js' });
  return {
    store, win, M: win.MECSync, A: win.MecAttempts, H: win.MecOpening && win.MecOpening._calc,
    lines: () => JSON.parse(store[KAT] || '[]'),
    roll: () => JSON.parse(store[KROLL] || '{}'),
  };
}

// uid|t|c|o|s|m|sess|n[|r]
function line(uid, t, ok, sess, n, r) {
  return [uid, t, 'a', ok ? 1 : 0, 10, 'e', sess, n].join('|') + (r === undefined ? '' : '|' + r);
}
function tMin(ds, hh) { return Math.floor((Date.parse(ds + 'T00:00:00Z') - 9 * 3600000 + (hh || 10) * 3600000) / 60000); }

// 集計＋生ログから全解答数・正解数を数える
function totals(lines, roll) {
  let t = 0, c = 0;
  lines.forEach(l => { t++; if (l.split('|')[3] === '1') c++; });
  for (const k in roll) for (const d in roll[k].d) for (const s in roll[k].d[d]) { t += roll[k].d[d][s][0]; c += roll[k].d[d][s][1]; }
  return { t, c };
}

// 決定論の擬似乱数（テストの再現性のため）
function rng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }

// 数日にまたがるセッション群を作る（1日あたり sessPerDay セッション × perSess 問）
function makeHistory(days, sessPerDay, perSess, seed, prefix) {
  const r = rng(seed), out = [];
  for (let d = 0; d < days; d++) {
    const ds = new Date(Date.parse('2026-09-01T00:00:00Z') + d * 86400000).toISOString().slice(0, 10);
    for (let s = 0; s < sessPerDay; s++) {
      const sess = (prefix || 's') + d + '_' + s;
      let t = tMin(ds, 9 + s);
      for (let n = 1; n <= perSess; n++) {
        if (r() < 0.6) t++;                 // 同じ分に2問並ぶことがある
        const sid = ['circ', 'resp', 'hema'][(n + s) % 3];
        out.push(line(sid + '_ch01_q' + n, t, r() < 0.7, sess, n, Math.floor(r() * 100)));
      }
    }
  }
  return out;
}

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + (e && e.stack || e)); } }

test('① 上限以下なら何も畳まない', () => {
  const E = makeEnv();
  const hist = makeHistory(1, 2, 10, 1);
  const r = E.M.attCompact(hist, {}, 5000);
  assert.strictEqual(r.lines.length, 20);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.roll)), {});
});

test('① あふれた分を畳む: 生ログ＋集計＝全解答（件数も正解数も）', () => {
  const E = makeEnv();
  const hist = makeHistory(10, 4, 50, 2);          // 2000件
  const want = totals(hist, {});
  const r = E.M.attCompact(hist, {}, 300);
  assert(r.lines.length <= 300, '上限を守る: ' + r.lines.length);
  assert.deepStrictEqual(totals(r.lines, r.roll), want);
});

test('③ 同じセッションの n ≤ u は生ログに1行も残らない', () => {
  const E = makeEnv();
  const hist = makeHistory(6, 3, 40, 3);
  const r = E.M.attCompact(hist, {}, 250);
  r.lines.forEach(l => {
    const p = l.split('|'); const R = r.roll[p[6]];
    assert(!(R && Number(p[7]) <= R.u), '畳んだはずの行が残っている: ' + l);
  });
});

test('① 何度に分けて畳んでも一度に畳んだのと同じ集計になる', () => {
  const E = makeEnv();
  const hist = makeHistory(8, 3, 40, 4);
  const once = E.M.attCompact(hist, {}, 200);
  let lines = [], roll = {};
  for (let i = 0; i < hist.length; i += 37) {
    const r = E.M.attCompact(lines.concat(hist.slice(i, i + 37)), roll, 200);
    lines = r.lines; roll = r.roll;
  }
  assert.deepStrictEqual(totals(lines, roll), totals(hist, {}));
  // 最終的な上限は同じなので、残る生ログも同じ
  assert.deepStrictEqual(lines, once.lines);
});

test('④ 最長連続正解を畳んだ前半から数え継ぐ', () => {
  const E = makeEnv();
  const ds = '2026-09-02';
  const hist = [];
  // 1〜3 正解・4 誤答・5〜12 正解（最長8）
  for (let n = 1; n <= 12; n++) hist.push(line('circ_ch01_q' + n, tMin(ds) + n, n !== 4, 'S1', n));
  const r = E.M.attCompact(hist, {}, 4);          // 前半8問を畳む → 生ログは9〜12
  const R = r.roll.S1;
  assert.strictEqual(R.u, 8);
  assert.strictEqual(R.tr, 4, '畳んだ範囲の末尾から続く連続（5〜8）');
  const attempts = r.lines.map(l => E.A && (function () { const p = l.split('|'); const t = Number(p[1]); return { uid: p[0], t, ms: t * 60000, ok: p[3] === '1', sess: p[6], n: Number(p[7]) }; })());
  const st = E.H.attemptStats({ attempts, roll: r.roll, rate: {} }, ds, ds);
  assert.strictEqual(st.total, 12);
  assert.strictEqual(st.ok, 11);
  assert.strictEqual(st.bestRun, 8);
  assert.strictEqual(st.sessions, 1);
});

test('⑤ 難問は行の全国正答率を優先し、無ければ MEC_RATE を引く', () => {
  const E = makeEnv({}, { MEC_RATE: { circ_ch01_q2: 30, circ_ch01_q3: 90 } });
  const ds = '2026-09-03';
  const hist = [
    line('circ_ch01_q1', tMin(ds) + 1, true, 'H', 1, 50),   // 行に 50% → 難問
    line('circ_ch01_q2', tMin(ds) + 2, true, 'H', 2),       // 行に無い → MEC_RATE 30% → 難問
    line('circ_ch01_q3', tMin(ds) + 3, false, 'H', 3),      // MEC_RATE 90% → 難問ではない
    line('circ_ch01_q4', tMin(ds) + 4, true, 'H', 4),       // どちらにも無い → 数えない
    line('circ_ch01_q5', tMin(ds) + 5, true, 'Z', 1),
  ];
  E.M.attStore(hist.slice(0, 4).concat(hist[4]), {});        // 上限5000なのでまだ畳まない
  const r = E.M.attCompact(hist, {}, 1, n => E.win.MEC_RATE[n]);
  assert.deepStrictEqual(Array.from(r.roll.H.d[ds].circ), [4, 3, 2, 2]);
});

test('② 2台がそれぞれ畳んでから同期しても二重に数えない', () => {
  // 端末A・B の履歴（セッションIDは端末ごとに別）
  const histA = makeHistory(6, 3, 40, 5, 'a');
  const histB = makeHistory(6, 2, 40, 6, 'b');
  const all = totals(histA.concat(histB), {});

  // A は自分の分を上限300で畳む。B は A の分を途中まで受け取った状態で畳む
  const A = makeEnv(), B = makeEnv();
  const ra = A.M.attCompact(histA, {}, 300);
  const rb = B.M.attCompact(histB.concat(histA.slice(0, 400)), {}, 300);
  A.store[KAT] = JSON.stringify(ra.lines); A.store[KROLL] = JSON.stringify(ra.roll);
  B.store[KAT] = JSON.stringify(rb.lines); B.store[KROLL] = JSON.stringify(rb.roll);

  // A ← B、B ← A の順に同期（_mergeRemote は Gist の payload を受ける）
  A.win.__mergeRemote({ [KAT]: B.lines(), [KROLL]: B.roll() });
  B.win.__mergeRemote({ [KAT]: A.lines(), [KROLL]: A.roll() });
  const ta = totals(A.lines(), A.roll()), tb = totals(B.lines(), B.roll());
  assert.deepStrictEqual(ta, all, 'A: ' + JSON.stringify(ta) + ' want ' + JSON.stringify(all));
  assert.deepStrictEqual(tb, all, 'B: ' + JSON.stringify(tb));
  // もう一往復しても変わらない（冪等）
  A.win.__mergeRemote({ [KAT]: B.lines(), [KROLL]: B.roll() });
  assert.deepStrictEqual(totals(A.lines(), A.roll()), all);
});

test('② 集計だけを持つリモート（生ログ0件）でも取り込む', () => {
  const E = makeEnv();
  const hist = makeHistory(3, 2, 30, 7);
  const r = E.M.attCompact(hist, {}, 20);
  E.win.__mergeRemote({ [KAT]: [], [KROLL]: r.roll });
  assert.deepStrictEqual(E.roll(), JSON.parse(JSON.stringify(r.roll)));
});

test('attempts.log は progress.js を通して畳む（上限5000）と9番目に全国正答率を付ける', () => {
  const hist = makeHistory(1, 1, 5000, 8);
  const E = makeEnv({ [KAT]: JSON.stringify(hist) });
  E.A.log({ uid: 'resp_ch02_q9', ok: true, choice: 'b', sec: 12, mode: 'e', sess: 'NEW', n: 1, rate: 42.4 });
  const lines = E.lines();
  assert.strictEqual(lines.length <= 5000, true);
  assert.strictEqual(lines[lines.length - 1].split('|')[8], '42');
  assert.deepStrictEqual(totals(lines, E.roll()).t, 5001);
});

test('attempts.log は全国正答率が無ければ8項目のまま', () => {
  const E = makeEnv();
  E.A.log({ uid: 'q1', ok: true, sess: 's', n: 1 });
  assert.strictEqual(E.lines()[0].split('|').length, 8);
});

test('容量超過の処理は生ログを捨てずに集計へ畳む', () => {
  const E = makeEnv();
  const hist = makeHistory(4, 2, 50, 9);
  E.store[KAT] = JSON.stringify(hist);
  // 容量超過で呼ばれる経路（lsRaw の catch）を直接たたけないので、同じ関数を通していることを見る
  assert(/_handleStorageQuota[\s\S]{0,1200}attCompact\(att, attReadRoll\(\)/.test(P_SRC), '_handleStorageQuota が attCompact を通していない');
});

test('⑥ 週の結果発表が畳んだ分を数える（今週・先週）', () => {
  const E = makeEnv();
  const hist = makeHistory(14, 3, 40, 10);        // 9/1〜9/14、1680件
  const want = { t: 0, c: 0 };
  hist.forEach(l => { const p = l.split('|'); const d = new Date(Number(p[1]) * 60000 + 9 * 3600000).toISOString().slice(0, 10); if (d >= '2026-09-07' && d <= '2026-09-13') { want.t++; if (p[3] === '1') want.c++; } });
  const r = E.M.attCompact(hist, {}, 200);        // 生ログは最後の2日分も残らない
  const attempts = r.lines.map(l => { const p = l.split('|'); const t = Number(p[1]); return { uid: p[0], t, ms: t * 60000, ok: p[3] === '1', sess: p[6], n: Number(p[7]) }; });
  const st = E.H.attemptStats({ attempts, roll: r.roll, rate: {} }, '2026-09-07', '2026-09-13');
  assert.strictEqual(st.total, want.t);
  assert.strictEqual(st.ok, want.c);
  assert.strictEqual(st.sessions, 21);
});

test('⑦ index.html のバックアップ復元は progress.js の関数を通し、上限を書き写していない', () => {
  const i = INDEX.indexOf('function _applyBackupData');
  const body = INDEX.slice(i, INDEX.indexOf('\nfunction ', i + 10));
  assert(/MECSync\.attMerge\(/.test(body) && /MECSync\.attStore\(/.test(body), '共有の関数を通していない');
  assert(!/slice\(-\d+\)/.test(body.slice(body.indexOf('mec_attempts_v1'))), '上限の数字が書き写されている');
  assert(/mec_attempts_roll_v1/.test(INDEX.slice(INDEX.indexOf('function exportBackup'), i)), 'バックアップに集計が入っていない');
});

test('⑦ 今日の所見が畳んだ分を読む', () => {
  const i = INDEX.indexOf('function _noteFacts');
  const body = INDEX.slice(i, INDEX.indexOf('\nfunction ', i + 10));
  assert(/MecAttempts\.roll\(\)/.test(body));
});

test('attempts.js と progress.js の集計キー・難問の境目が一致する', () => {
  assert(/K_ROLL = 'mec_attempts_roll_v1'/.test(A_SRC));
  assert(/K_ATT_ROLL = 'mec_attempts_roll_v1'/.test(P_SRC));
  const ex = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
  const h1 = Number((P_SRC.match(/ATT_HARD_RATE = (\d+)/) || [])[1]);
  const h2 = Number((ex.match(/EXAM_HARD_RATE = (\d+)/) || [])[1]);
  assert.strictEqual(h1, h2);
});

console.log('\n' + (fails.length ? 'FAILED ' + fails.length + ' / ' : 'all passed  ') + '(' + passed + '/' + (passed + fails.length) + ')');
process.exit(fails.length ? 1 : 0);
