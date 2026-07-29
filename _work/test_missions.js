/**
 * デイリー／ウィークリーミッションを実ソース（gamify.js）で検証する。
 * Run: node _work/test_missions.js
 *
 * 背景（2026-07-29の拡張）:
 *   - 旧仕様は MISSION COMPLETE を「全ミッション達成」で判定していて、その中に
 *     「試験で全問正解」という運任せの条件が入っていたため日次のセレモニーが事実上出なかった。
 *     → tier:'core' だけで判定する。ここで守りたいのは「core は毎日必ず届く種類のものだけ」。
 *   - 週次「章を3つ制覇」は端末ローカルの L.chDone を見ていたため、全章を済にすると
 *     永久未達になっていた。→ 何周でも成立する chexam80（章別試験80%以上）に置き換えた。
 *   - 達成ボーナスXPは同期台帳（mec_missions_v1.xp.ledger）に「何を取ったか」で記帳する。
 *     数を数えないので、複数端末で同じミッションを達成しても二重加算されない。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');

// ── 最小DOM/localStorage スタブ ────────────────────────────────────────────
// gamify.js は要素が無ければ静かに何もしない作りなので、getElementById/querySelector が
// null を返すだけで演出系は全部 no-op になる。
function makeEl() {
  const el = {
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, addEventListener() {}, setAttribute() {},
    animate: () => ({}), getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    // トースト等は作った直後に querySelector で内側を掴んで textContent を入れるので、
    // 「要素の中の要素」は常に新しいスタブを返す（document 側は null のままで演出を止める）。
    querySelector: () => makeEl(), querySelectorAll: () => [],
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
  };
  return el;
}

function makeCtx() {
  const store = {};
  const ctx = {
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      readyState: 'complete',
      head: makeEl(), body: makeEl(),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: makeEl,
      addEventListener() {},
      dispatchEvent() {},
    },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
    requestAnimationFrame: () => 0, requestIdleCallback: null,
    Math, Date, JSON, console, Set, Map, Object, Array, String, Number, Error,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  ctx._store = store;
  return ctx;
}

const G = () => makeCtx().window.MecGamify;
// mec_missions_v1 から (期間, カウンタ) の端末横断合計を読む
function sum(ctx, period, counter) {
  const s = JSON.parse(ctx._store['mec_missions_v1'] || '{}');
  const keys = Object.keys(s[period] || {});
  let n = 0;
  keys.forEach(k => { const b = s[period][k]; for (const dev in b) n += (b[dev] && b[dev][counter]) || 0; });
  return n;
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// ── 定義そのものの不変条件 ────────────────────────────────────────────────
console.log('ミッション定義');

t('日次は8個・週次は6個', () => {
  const d = G()._defs;
  assert.strictEqual(d.daily.length, 8);
  assert.strictEqual(d.weekly.length, 6);
});

t('全ミッションが tier / xp / counter / target を持つ', () => {
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => {
    assert.ok(m.tier === 'core' || m.tier === 'bonus', m.id + ': tier');
    assert.ok(typeof m.xp === 'number' && m.xp > 0, m.id + ': xp');
    assert.ok(typeof m.counter === 'string' && m.counter, m.id + ': counter');
    assert.ok(typeof m.target === 'number' && m.target > 0, m.id + ': target');
  });
});

t('idは日次・週次を通して一意（XP台帳のキーに使うため）', () => {
  const d = G()._defs;
  const ids = [].concat(d.daily, d.weekly).map(m => m.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(ids.indexOf('__all__') < 0, '__all__ は全達成の予約語');
});

t('counter は実際に加算される名前だけ（typo検出）', () => {
  const known = new Set(['ans', 'cor', 'exam', 'srs', 'redo', 'unflag', 'chexam80', 'acc80', 'perfect']);
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => assert.ok(known.has(m.counter), '未知のcounter: ' + m.counter));
});

t('core は日次・週次とも3つ（セレモニーの条件）', () => {
  const d = G()._defs;
  assert.strictEqual(d.daily.filter(m => m.tier === 'core').length, 3);
  assert.strictEqual(d.weekly.filter(m => m.tier === 'core').length, 3);
});

t('運任せのミッション（全問正解・正答率80%）は core に入っていない', () => {
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => {
    if (m.counter === 'perfect' || m.counter === 'acc80') {
      assert.strictEqual(m.tier, 'bonus', m.id + ' は毎回は達成できないので bonus であること');
    }
  });
});

// ── カウンタの加算 ────────────────────────────────────────────────────────
console.log('カウンタ加算');

t('試験の正解は ans と cor を両方増やす', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('endo_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'd', 'cor'), 1);
});

t('不正解は ans だけ増やす', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('endo_ch01_q1', false);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'd', 'cor'), 0);
});

t('SRS復習中の解答は正誤に関わらず srs を増やす（消化数だから）', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', false, { srs: true });
  ctx.window.MecGamify.onAnswer('a_ch01_q2', true, { srs: true });
  assert.strictEqual(sum(ctx, 'd', 'srs'), 2);
});

t('通常の試験モードでは srs は増えない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'srs'), 0);
});

t('奪回(redo)は「過去に落とした問題を正解した」ときだけ増える', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true, { wasWrong: true });   // 奪回
  ctx.window.MecGamify.onAnswer('a_ch01_q2', false, { wasWrong: true });  // まだ落としたまま
  ctx.window.MecGamify.onAnswer('a_ch01_q3', true, { wasWrong: false });  // 初見で正解
  assert.strictEqual(sum(ctx, 'd', 'redo'), 1);
});

t('週次カウンタは日次と同時に増える', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'w', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'w', 'cor'), 1);
});

t('通常モードの「済」も ans に算入される', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onLap('a_ch01_q1', null);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
});

// ── 水増し防止 ────────────────────────────────────────────────────────────
console.log('水増し防止');

t('🚩の付け外しを繰り返しても同じ問題はその日1回だけ', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  g.onFlag('a_ch01_q1', null, false);
  g.onFlag('a_ch01_q1', null, true);
  g.onFlag('a_ch01_q1', null, false);
  assert.strictEqual(sum(ctx, 'd', 'unflag'), 1);
});

t('🚩は問題ごとに数える', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onFlag('a_ch01_q1', null, false);
  ctx.window.MecGamify.onFlag('a_ch01_q2', null, false);
  assert.strictEqual(sum(ctx, 'd', 'unflag'), 2);
});

t('🚩を立てる操作では増えない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onFlag('a_ch01_q1', null, true);
  assert.strictEqual(sum(ctx, 'd', 'unflag'), 0);
});

t('章別試験80%以上は同じ章を回しても週1回だけ', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(10, 9, { chPrefix: 'neur_ch03' });
  ctx.window.MecGamify.onExamFinish(10, 10, { chPrefix: 'neur_ch03' });
  ctx.window.MecGamify.onExamFinish(10, 8, { chPrefix: 'neur_ch04' });
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 2);
});

t('章別試験でも80%未満は算入されない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(10, 7, { chPrefix: 'neur_ch03' });
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
});

t('10問未満のセッションは exam / chexam80 のどちらも増やさない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(9, 9, { chPrefix: 'neur_ch03' });
  assert.strictEqual(sum(ctx, 'd', 'exam'), 0);
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
});

t('科目全体の試験（chPrefixなし）では chexam80 は増えない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(20, 20, {});
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
  assert.strictEqual(sum(ctx, 'd', 'perfect'), 1);
});

// ── 達成とボーナスXP ──────────────────────────────────────────────────────
console.log('達成とボーナスXP');

// 日次 core（40問解答 / 試験セッション1本 / 試験で20問正解）を満たすところまで回す
function driveDailyCore(g) {
  for (let i = 0; i < 40; i++) g.onAnswer('a_ch01_q' + i, true);
  g.onExamFinish(40, 40, {});
}

t('bonus未達でも core が揃えば日次のコンプリートXPが入る', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const led = JSON.parse(ctx._store['mec_missions_v1']).xp.ledger;
  const key = Object.keys(led).filter(k => k[0] === 'd')[0];
  assert.ok(led[key].__all__, 'core が揃ったので __all__ が記帳される');
  assert.strictEqual(led[key].__all__, g._defs.allXp.d);
  assert.strictEqual(led[key].srs, undefined, 'SRSミッションは未達なので記帳されない');
});

t('ボーナスXPは stats().xp に乗る', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const s = g.stats(true);
  assert.ok(s.missionXp > 0, 'ミッションXPが計上されている');
  // XP = 済周回×10 + 試験解答×4 + 試験正解×6 + ミッションXP。
  // done_v2 / myrate_v1 を書くのは progress.js と study_exam.js の側なので、
  // gamify 単体を叩いたこのケースでは前3項が0になり、XPはミッションぶんだけになる。
  assert.strictEqual(s.xp, s.missionXp);
  assert.strictEqual(s.missionXp, g.missionXp());
});

t('同じミッションを何度満たしてもXPは1回だけ（台帳は値を上書きしない）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const before = g.missionXp();
  for (let i = 0; i < 40; i++) g.onAnswer('b_ch01_q' + i, true); // さらに40問
  g.onExamFinish(40, 40, {});
  assert.strictEqual(g.missionXp(), before, 'target超過ぶんでXPは増えない');
});

t('missionSummary は8個ぶんの達成数と core の達成数を返す', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const m = g.missionSummary();
  assert.strictEqual(m.total, 8);
  assert.strictEqual(m.coreTotal, 3);
  assert.strictEqual(m.coreDone, 3, 'core は全部達成している');
  // acc80 と perfect も 40/40 で満たされるので done は core3 + それら2
  assert.strictEqual(m.done, 5);
});

t('達成ボーナスXPを足してもレベルは単調（XPは負にならない）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  const before = g.stats(true).xp;
  driveDailyCore(g);
  assert.ok(g.stats(true).xp > before);
});

// ── 描画 ──────────────────────────────────────────────────────────────────
console.log('描画');

// renderPanel は innerHTML に文字列を入れるだけなので、スタブ要素から取り出して中身を見る
function renderInto(g, opts) {
  const host = makeEl();
  g.renderPanel(host, opts);
  return host.innerHTML;
}

t('ハブ用(only:daily)は必須とボーナスを分けて8行出す', () => {
  const ctx = makeCtx();
  const html = renderInto(ctx.window.MecGamify, { only: 'daily' });
  assert.strictEqual((html.match(/data-tier="/g) || []).length, 8, '8行');
  assert.strictEqual((html.match(/data-tier="core"/g) || []).length, 3);
  assert.strictEqual((html.match(/data-tier="bonus"/g) || []).length, 5);
  assert.ok(html.indexOf('ボーナス') > 0, 'ボーナスの仕切りがある');
  assert.ok(html.indexOf('gm-mission-foot') > 0, '獲得XPの行がある');
});

t('日次にはペース目盛りを出さない（1日の中の進み具合には意味が薄い）', () => {
  const ctx = makeCtx();
  assert.ok(renderInto(ctx.window.MecGamify, { only: 'daily' }).indexOf('gm-pace') < 0);
});

t('週次にはペース目盛りと残り日数を出す', () => {
  const ctx = makeCtx();
  const html = renderInto(ctx.window.MecGamify, {});
  assert.ok(html.indexOf('gm-pace') > 0, 'ペース目盛り');
  assert.ok(/残り\d日/.test(html), '残り日数');
});

t('達成済みの行にはペース目盛りを出さない（意味が無く紛らわしいため）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  for (let i = 0; i < 260; i++) g.onAnswer('a_ch01_q' + i, true); // 週次 w_ans(250) を達成
  const html = renderInto(g, {});
  const row = html.slice(html.indexOf('今週 250問'));
  assert.ok(row.slice(0, 400).indexOf('gm-pace') < 0);
});

t('バーの割合は target を超えても100%を超えない', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  for (let i = 0; i < 90; i++) g.onAnswer('a_ch01_q' + i, true); // 日次 ans(40) の倍以上
  const html = renderInto(g, { only: 'daily' });
  (html.match(/gm-mission-fill" style="width:(\d+)%/g) || []).forEach(m => {
    assert.ok(parseInt(m.match(/(\d+)%/)[1], 10) <= 100, m);
  });
});

console.log('\n' + (fail ? 'FAILED ' : 'all passed ') + ' (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
