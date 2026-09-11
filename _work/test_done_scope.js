/**
 * 「済」と「全問題数」の正本は progress.js の MECSync.doneInScope / totalInScope（2026-09-11）。
 * ハブ「済 累計」・統合学習ツール「済／合計」・学習統計「済み」・Lvパネル「済」が別々に数えていて
 * 表示が食い違っていたので、全部をこの2関数に寄せた。ここはその約束を見張る。
 *   ・progress.js を実際に読み込み、自作・暗記メモを除いて数えること／分母の中身
 *   ・過去問の表が 国家試験過去問/*.html の data-uid 件数と一致すること
 *   ・各ページが自前で done_v2 のキー数を数え直していないこと
 *   ・統合学習ツールの「済」が done_v2 を書く全経路から更新されること
 * Run: node _work/test_done_scope.js
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + e.message); } }

// progress.js を最小の DOM シムで読み込む（MECSync の数える関数だけ使う）
function loadProgress(store) {
  const noop = () => {};
  const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, setAttribute: noop, addEventListener: noop, querySelectorAll: () => [] });
  const ctx = {
    console, JSON, Math, Date, Object, Array, String, Number, Promise, setTimeout, clearTimeout,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { head: el(), body: el(), createElement: el, addEventListener: noop, querySelectorAll: () => [], getElementById: () => null, dispatchEvent: noop },
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState: noop },
    navigator: {}, fetch: () => Promise.reject(new Error('offline')),
    addEventListener: noop, dispatchEvent: noop, CustomEvent: function () {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('chapters_meta.js'), ctx);
  vm.runInContext(read('progress.js'), ctx);
  return ctx;
}

test('済は自作問題・暗記メモを除いて数える（周回数0のキーも数えない）', () => {
  const done = { endo_ch01_q1: 1, kakumon_116A_q3: 2, jitsu1_ch01_q5: 1, custom_x_1: 3, memo_ch01_q2: 1, psy_ch01_q9: 0 };
  const w = loadProgress({ done_v2: JSON.stringify(done) });
  assert.strictEqual(w.MECSync.doneInScope(), 3);
  assert.strictEqual(w.MECSync.getStats().doneCount, 3, 'getStats().doneCount も同じ数え方でなければならない');
  assert.strictEqual(w.MECSync.isDoneInScope('custom_x_1'), false);
  assert.strictEqual(w.MECSync.isDoneInScope('kakumon_120F_q1'), true);
});

test('全問題数 ＝ chapters_meta の全章 ＋ 過去問 ＋ 実力試験Ⅰ', () => {
  const w = loadProgress({});
  const CH = new Function(read('chapters_meta.js') + ';return MEC_CHAPTERS')();
  const chTotal = CH.reduce((s, x) => s + x.chapters.reduce((t, c) => t + c.count, 0), 0);
  const kk = Object.values(w.MEC_KAKUMON_BLOCKS).reduce((a, b) => a + b, 0);
  const jt = w.MEC_JITSU1_CHAPTERS.reduce((a, c) => a + c.count, 0);
  assert.ok(kk > 0 && jt > 0, '過去問・実力試験の表が空');
  assert.strictEqual(w.MECSync.totalInScope(), chTotal + kk + jt);
  assert.strictEqual(w.MECSync.getStats().totalQ, chTotal + kk + jt);
});

test('過去問の表は 国家試験過去問/*.html の問題数と一致する（分母が実数であること）', () => {
  const w = loadProgress({});
  const dir = path.join(ROOT, '国家試験過去問');
  const found = {};
  fs.readdirSync(dir).forEach(d => {
    const p = path.join(dir, d);
    if (!fs.statSync(p).isDirectory()) return;
    fs.readdirSync(p).filter(f => f.endsWith('.html')).forEach(f => {
      for (const m of fs.readFileSync(path.join(p, f), 'utf8').matchAll(/data-uid="(kakumon_([0-9]+[A-Z])_q\d+)"/g)) {
        (found[m[2]] = found[m[2]] || new Set()).add(m[1]);
      }
    });
  });
  const table = w.MEC_KAKUMON_BLOCKS;
  Object.keys(found).forEach(b => assert.ok(b in table, '表に無いブロック: ' + b));
  Object.keys(table).forEach(b => assert.strictEqual((found[b] || new Set()).size, table[b], b + ' の問題数が表と違う'));
});

test('各ページは done_v2 のキー数を自前で数え直さない（正本の関数を読む）', () => {
  const idx = read('index.html'), st = read('study.html'), stats = read('stats.html');
  assert.ok(/function calcDoneInScope\(\)\s*\{\s*return window\.MECSync \? MECSync\.doneInScope\(\)/.test(idx), 'ハブが自前で数えている');
  assert.ok(/function calcTotalQ\(\)\s*\{\s*return window\.MECSync \? MECSync\.totalInScope\(\)/.test(idx), 'ハブが自前で全問題数を数えている');
  assert.ok(!/const KAKUMON_BLOCKS = \{/.test(idx), 'ハブに過去問の表の複製が戻っている');
  assert.ok(/MECSync\.doneInScope\(done\)/.test(stats) && /MECSync\.totalInScope\(\)/.test(stats), '学習統計が正本を読んでいない');
  assert.ok(!/const doneCount = Object\.keys\(done\)\.length;/.test(stats), '学習統計が全キー数を数えている');
  assert.ok(/id="statTotal"/.test(st) && !/合計 <span>\d+<\/span>問/.test(st), '統合学習ツールの合計が固定値のまま');
});

test('統合学習ツールの「済」は done_v2 を書く全経路から更新される', () => {
  const st = read('study.html'), ex = read('study_exam.js'), pg = read('progress.js');
  assert.ok(/window\.mecMarkStale = function\(\) \{[^}]*_scheduleStatsUpdate\(\)/.test(st), 'mecMarkStale が「済」を更新しない');
  // ×△○（mecIncrLap）と取り消し（mecUndoLap）は progress.js で mecMarkStale を呼ぶ
  ['window.mecIncrLap', 'window.mecUndoLap'].forEach(fn => {
    const i = pg.indexOf(fn), body = pg.slice(i, pg.indexOf('};', i));
    assert.ok(/mecMarkStale/.test(body), fn + ' が mecMarkStale を呼ばない');
  });
  const i = ex.indexOf('function _markExamDone'), body = ex.slice(i, ex.indexOf('\n}', i));
  assert.ok(/mecMarkStale/.test(body), '試験モードの _markExamDone が mecMarkStale を呼ばない');
  assert.ok(/addEventListener\('mecSyncComplete', _scheduleStatsUpdate\)/.test(st), '同期の完了で更新しない');
});

console.log('\n' + passed + ' passed' + (fails.length ? ', ' + fails.length + ' FAILED: ' + fails.join(', ') : ''));
process.exit(fails.length ? 1 : 0);
