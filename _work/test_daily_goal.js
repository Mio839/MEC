/**
 * ハブ（index.html）のゲージ＝「今日やるべき問題数のうち何％まで来たか」を実ソースで検証する。
 * Run: node _work/test_daily_goal.js
 *
 * 守りたいこと:
 *   - 目標も進捗も gamify.js の日次ミッション ans が正本（ゲージのすぐ下に並ぶ
 *     ミッション行と数字が食い違わない）。index.html に独自の目標値を持たせない。
 *   - 達成率を 100% で頭打ちにしない。目標を超えた日は 130% と読める。
 *     弧だけが2周目（.gauge-ovf）に回り、数字は素の値を出す。
 *   - 達成率が上がるほど演出の段（data-tier）が上がり、下がる方向では鳴らない。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}
function sec(s) { console.log('\n' + s); }

// ── gamify.js を最小スタブで読み込む（test_missions.js と同じ器） ─────────
// gamify.js は要素が無ければ静かに何もしない作りなので、getElementById が null を
// 返すだけで演出系は全部 no-op になる。
const GAMIFY_SRC = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');
function makeEl() {
  return {
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, addEventListener() {}, setAttribute() {},
    animate: () => ({}), getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    querySelector: () => makeEl(), querySelectorAll: () => [],
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
  };
}
function loadGamify(missions) {
  const store = { mec_missions_v1: JSON.stringify(missions) };
  const ctx = {
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      readyState: 'complete', head: makeEl(), body: makeEl(),
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: makeEl, addEventListener() {}, dispatchEvent() {},
    },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
    requestAnimationFrame: () => 0, requestIdleCallback: null,
    Math, Date, JSON, console, Set, Map, Object, Array, String, Number, Error,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(GAMIFY_SRC, ctx);
  return ctx.window.MecGamify;
}
const TODAY = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
// 端末別カウンタ。表示・判定は端末横断で sum する（gamify.js の _missionSum と同じ形）
function withAns(byDevice) {
  const dev = {};
  Object.keys(byDevice).forEach(d => { dev[d] = { ans: byDevice[d] }; });
  return { d: { [TODAY]: dev }, w: {}, xp: { banked: 0, ledger: {} } };
}

sec('MecGamify.dailyGoal()（ゲージの分子・分母の正本）');

t('目標は日次ミッション ans の target をそのまま返す', () => {
  const g = loadGamify(withAns({}));
  const def = g._defs.daily.find(d => d.counter === 'ans');
  assert.strictEqual(g.dailyGoal().target, def.target);
  assert.ok(def.target > 0, 'ans ミッションの target が 0 だとゲージが常に 0% になる');
});

t('進捗は端末をまたいで合計される', () => {
  const g = loadGamify(withAns({ devA: 12, devB: 7 }));
  assert.strictEqual(g.dailyGoal().count, 19);
});

t('未着手は 0問 0%', () => {
  const r = loadGamify(withAns({})).dailyGoal();
  assert.strictEqual(r.count, 0);
  assert.strictEqual(r.pct, 0);
});

t('達成率は 100% で頭打ちにしない（目標超過をそのまま返す）', () => {
  const g = loadGamify(withAns({ devA: 100 }));
  const r = g.dailyGoal();
  const target = g._defs.daily.find(d => d.counter === 'ans').target;
  assert.strictEqual(r.pct, Math.round(100 / target * 100));
  assert.ok(r.pct > 100, '超過した日に pct が 100 に丸められている');
});

t('ちょうど目標ぶん解いたら 100%', () => {
  const g = loadGamify(withAns({}));
  const target = g._defs.daily.find(d => d.counter === 'ans').target;
  assert.strictEqual(loadGamify(withAns({ devA: target })).dailyGoal().pct, 100);
});

t('他のカウンタ（cor/srs 等）はゲージに混ざらない', () => {
  const m = withAns({ devA: 5 });
  m.d[TODAY].devA.cor = 999; m.d[TODAY].devA.srs = 999;
  assert.strictEqual(loadGamify(m).dailyGoal().count, 5);
});

t('昨日ぶんは今日のゲージに入らない', () => {
  const y = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);
  const m = withAns({ devA: 3 });
  m.d[y] = { devA: { ans: 500 } };
  assert.strictEqual(loadGamify(m).dailyGoal().count, 3);
});

// ── index.html のゲージ描画 ───────────────────────────────────────────────
// インラインJS全体は他のグローバルに依存するので、ゲージを描く3つの関数だけを切り出す。
sec('index.html のゲージ描画（_goalTier / _driveGauge）');

const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function extract(name) {
  const i = HTML.indexOf('function ' + name + '(');
  assert.ok(i > 0, name + ' が index.html に無い（名前を変えたらこのテストも直すこと）');
  let depth = 0, started = false;
  for (let j = HTML.indexOf('{', i); j < HTML.length; j++) {
    if (HTML[j] === '{') { depth++; started = true; }
    else if (HTML[j] === '}') { depth--; if (started && depth === 0) return HTML.slice(i, j + 1); }
  }
  throw new Error(name + ' の本体を切り出せなかった');
}
const GAUGE_C = Number((HTML.match(/const GAUGE_C = ([\d.]+);/) || [])[1]);
assert.ok(GAUGE_C > 0, 'GAUGE_C を読み取れない');
// 「もう鳴らした段」を覚えている関数外の変数。宣言ごと本文から借りる
const TIER_STATE = (HTML.match(/^let _gaugeTierShown = .+;$/m) || [])[0];
assert.ok(TIER_STATE, '_gaugeTierShown の宣言が index.html に無い');

// 弧・光点・段だけを見る器。祝砲（_gaugeCelebrate）は撒かれた段を記録するだけにする
function makeGauge() {
  const mk = () => ({ style: {}, dataset: {} });
  const els = { gaugeBox: mk(), gaugeVal: mk(), gaugeOvf: mk(), gaugeDot: mk() };
  const fired = [];
  const ctx = {
    console, GAUGE_C, setTimeout: (fn) => { fn(); return 0; },
    _gaugeCelebrate: tier => fired.push(tier),
    document: { getElementById: id => els[id] || null },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(TIER_STATE + '\n' + extract('_goalTier') + '\n' + extract('_driveGauge'), ctx);
  // 弧の残り長さ → 描かれた割合（%）
  const pctOf = el => Math.round((1 - Number(el.style.strokeDashoffset) / GAUGE_C) * 1000) / 10;
  return {
    drive: p => ctx._driveGauge(p),
    tierOf: p => ctx._goalTier(p),
    base: () => pctOf(els.gaugeVal), over: () => pctOf(els.gaugeOvf),
    tier: () => Number(els.gaugeBox.dataset.tier),
    dotDeg: () => Number(String(els.gaugeDot.style.transform).replace(/[^\d.-]/g, '')),
    fired,
  };
}

t('段は 0 / 25 / 50 / 75 / 100 / 150% で切り替わる', () => {
  const g = makeGauge();
  const at = [[0, 0], [1, 1], [24, 1], [25, 2], [49, 2], [50, 3], [74, 3],
              [75, 4], [99, 4], [100, 5], [149, 5], [150, 6], [400, 6]];
  at.forEach(([p, tier]) => assert.strictEqual(g.tierOf(p), tier, p + '% の段が違う'));
});

t('100%未満は1周目だけが伸び、2周目は長さ0', () => {
  const g = makeGauge(); g.drive(60);
  assert.strictEqual(g.base(), 60);
  assert.strictEqual(g.over(), 0);
  assert.strictEqual(g.dotDeg(), 216);   // 60% = 216deg
});

t('100%超は1周目が満タンになり、超過ぶんだけ2周目が伸びる', () => {
  const g = makeGauge(); g.drive(130);
  assert.strictEqual(g.base(), 100);
  assert.strictEqual(g.over(), 30);
  assert.strictEqual(g.dotDeg(), 108);   // 光点は2周目の先端へ移る
});

t('200%超でも弧は壊れない（2周目が満タンで頭打ち・負の長さを作らない）', () => {
  const g = makeGauge(); g.drive(420);
  assert.strictEqual(g.base(), 100);
  assert.strictEqual(g.over(), 100);
  assert.ok(Number(g.tier()) === 6);
});

t('達成率の数字そのものは頭打ちにしない（描画側で min を掛けていない）', () => {
  // renderHero が #statPct に入れているのが goal.pct 素のままであることを本文で確かめる。
  // ここを Math.min(100, ...) にすると「100%を超えても％が読める」が壊れる。
  const line = (HTML.match(/getElementById\('statPct'\)\.textContent\s*=\s*(.+);/) || [])[1];
  assert.ok(line, '#statPct への代入が見つからない');
  assert.ok(!/min\s*\(/.test(line), '#statPct に上限が掛かっている: ' + line);
  assert.ok(/goal\.pct/.test(line), '#statPct が dailyGoal() の値を出していない: ' + line);
});

t('段が上がったときだけ祝砲が鳴る（同期の再描画で毎回は鳴らない）', () => {
  const g = makeGauge();
  g.drive(10); g.drive(10); g.drive(12);      // 段1のまま
  assert.deepStrictEqual(g.fired, [1]);
  g.drive(80);                                 // 段4へ
  assert.deepStrictEqual(g.fired, [1, 4]);
  g.drive(30);                                 // 下がる方向では鳴らない
  assert.deepStrictEqual(g.fired, [1, 4]);
});

t('0% では祝砲を撒かない', () => {
  const g = makeGauge(); g.drive(0);
  assert.strictEqual(g.tier(), 0);
  assert.deepStrictEqual(g.fired, []);
});

t('ゲージが読む値は index.html ではなく dailyGoal() が正本', () => {
  assert.ok(/MecGamify\.dailyGoal\(\)/.test(HTML), 'index.html が dailyGoal() を呼んでいない');
  // 代用値は1箇所（定数）だけ。マジックナンバーが散らばると目標がずれる
  const lits = HTML.match(/DAILY_GOAL_FALLBACK/g) || [];
  assert.ok(lits.length >= 2, '代用値が定数になっていない');
});

console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
