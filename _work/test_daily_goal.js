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

// ── 歯車の意匠（スチームパンク） ───────────────────────────────────────────
// 「噛み合って見える」は絵の話ではなく寸法の話なので、寸法として固定する。
sec('ゲージの歯車列（index.html の _gearPath / GEARS）');

// GEARS 定義と _gearPath を本文から切り出して実行する
const GEAR_CTX = (() => {
  const defs = (HTML.match(/^const GEARS = \[[\s\S]*?^\];$/m) || [])[0];
  assert.ok(defs, 'GEARS の定義が index.html に無い');
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  // const 宣言は vm のグローバルに生えないので、最後の式で明示的に取り出す
  return vm.runInContext(extract('_gearPath') + '\n' + defs + '\n({_gearPath, GEARS})', ctx);
})();
const MAIN = GEAR_CTX.GEARS.find(g => g.id === 'gearMain');
const SMALL = GEAR_CTX.GEARS.filter(g => g.id !== 'gearMain');
// path の全座標を中心からの距離に直す
function radiiOf(g) {
  const d = GEAR_CTX._gearPath(g.cx, g.cy, g.root, g.tip, g.n);
  const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const out = [];
  // "A r r 0 0 1 x y" の r,r,0,0,1 を飛ばしつつ、末尾の座標対だけを拾う
  d.split(/(?=[MLA])/).forEach(seg => {
    const v = (seg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (!v.length) return;
    const xy = v.slice(-2);
    out.push(Math.hypot(xy[0] - g.cx, xy[1] - g.cy));
  });
  assert.ok(nums.length, 'path が空');
  return out;
}

t('歯先は tip・歯底は root の半径にちょうど乗る', () => {
  GEAR_CTX.GEARS.forEach(g => {
    radiiOf(g).forEach(r => {
      const onTip = Math.abs(r - g.tip) < .05, onRoot = Math.abs(r - g.root) < .05;
      assert.ok(onTip || onRoot, g.id + ' に tip/root どちらでもない頂点がある: ' + r.toFixed(2));
    });
  });
});

t('歯数ぶんの歯が出る（頂点数が歯数に比例する）', () => {
  GEAR_CTX.GEARS.forEach(g => {
    const rs = radiiOf(g);
    const tips = rs.filter(r => Math.abs(r - g.tip) < .05).length;
    assert.strictEqual(tips, g.n * 2, g.id + ' の歯先の頂点が歯数×2になっていない');
  });
});

t('小歯車は大歯車と必ず噛み合う（歯先が相手の歯の領域へ食い込む）', () => {
  SMALL.forEach(g => {
    const dist = Math.hypot(g.cx - MAIN.cx, g.cy - MAIN.cy);
    const reach = dist - g.tip;               // 小歯車の歯先が中心へ届く距離
    assert.ok(reach < MAIN.tip, g.id + ' が大歯車から離れている（隙間 ' + (reach - MAIN.tip).toFixed(2) + '）');
    assert.ok(reach > MAIN.root, g.id + ' が大歯車へ深く刺さりすぎている（歯底より内側）');
  });
});

t('どの歯車も viewBox(140x140) からはみ出さない', () => {
  GEAR_CTX.GEARS.forEach(g => {
    assert.ok(g.cx - g.tip >= -0.5 && g.cx + g.tip <= 140.5, g.id + ' が横にはみ出す');
    assert.ok(g.cy - g.tip >= -0.5 && g.cy + g.tip <= 140.5, g.id + ' が縦にはみ出す');
  });
});

t('軸穴は歯底より内側にある（穴が歯を食わない）', () => {
  GEAR_CTX.GEARS.forEach(g => assert.ok(g.hole < g.root, g.id + ' の軸穴が歯底以上'));
});

t('CSSの回転速度は歯数比と一致する（噛み合いが嘘にならない）', () => {
  // --gear-t（大歯車の周期）に対する係数。小歯車は歯数比のぶんだけ速く回る
  const want = { 'gear-a': 12 / 24, 'gear-b': 16 / 24, 'gear-c': 10 / 24 };
  Object.keys(want).forEach(cls => {
    const m = HTML.match(new RegExp('\\.' + cls + '\\{animation:gearSpin calc\\(var\\(--gear-t[^)]*\\) \\* ([\\d.]+)\\)'));
    assert.ok(m, '.' + cls + ' の animation 指定が読めない');
    assert.ok(Math.abs(Number(m[1]) - want[cls]) < .002,
      '.' + cls + ' の係数 ' + m[1] + ' が歯数比 ' + want[cls].toFixed(3) + ' と違う');
  });
  // 小歯車は必ず逆回り（同じ向きだと噛み合っていないのが一目で分かる）
  ['gear-a', 'gear-b', 'gear-c'].forEach(cls => {
    const line = HTML.match(new RegExp('\\.' + cls + '\\{animation:[^}]*\\}'))[0];
    assert.ok(/reverse/.test(line), '.' + cls + ' が逆回りになっていない');
  });
});

t('速さは --gear-t 1本で決まる（個別に duration を上書きしていない）', () => {
  assert.ok(!/\.gear-(main|a|b|c)\{animation-duration/.test(HTML),
    '歯車ごとに animation-duration を上書きすると歯数比が崩れる');
  const tiers = HTML.match(/\.gauge\[data-tier="\d"\]\{--gear-t:[\d.]+s;\}/g) || [];
  assert.ok(tiers.length >= 5, '段ごとの --gear-t が足りない');
});

// ── fx_engine.js のスチームパンク粒子 ─────────────────────────────────────
sec('fx_engine.js の歯車・蒸気パーティクル');

// Canvas2D を録画するスタブ。rAF のコールバックを掴んでおき、こちらから1フレーム
// 進めることで drawParticle まで実際に走らせる（歯車の輪郭を絵として検査するため）。
function loadFx() {
  const rec = { path: [], fills: [], reset() { this.path = []; this.fills = []; } };
  const c2d = new Proxy({
    moveTo: (x, y) => rec.path.push(['m', x, y]),
    lineTo: (x, y) => rec.path.push(['l', x, y]),
    arc: (x, y, r) => rec.path.push(['a', x, y, r]),
    beginPath: () => rec.path.push(['begin']),
    closePath: () => rec.path.push(['close']),
    fill: rule => rec.fills.push(rule || 'nonzero'),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get: (o, k) => (k in o ? o[k] : () => undefined), set: () => true });
  const canvas = { style: {}, width: 0, height: 0, id: '', getContext: () => c2d };
  let frame = null;
  const ctx = {
    console, Math, Date, performance: { now: () => 0 },
    requestAnimationFrame: fn => { frame = fn; return 1; },
    cancelAnimationFrame: () => { frame = null; },
    document: { createElement: () => canvas, body: { appendChild() {} }, addEventListener() {} },
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, addEventListener() {},
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'fx_engine.js'), 'utf8'), ctx);
  const fx = ctx.window.MecFX;
  // 描画フレームを n 枚回す。1フレームの dt は engine 側で 50ms に頭打ちされるので、
  // 粒子の delay（既定で最大 .18s）を消化するには数フレーム必要
  fx._step = n => { for (let i = 1; i <= (n || 8); i++) if (frame) frame(i * 50); };
  fx._rec = rec;
  return fx;
}
const FX = loadFx();
// 撒いた粒子を数えるには count() の差分を見る（pool は非公開）
function spawned(fn) { const a = FX.count(); fn(); return FX.count() - a; }

t('新しいエミッタが公開されている', () => {
  ['gears', 'gearRain', 'steam'].forEach(k =>
    assert.strictEqual(typeof FX[k], 'function', k + ' が公開されていない'));
});

t('既存のエミッタを1つも失っていない（study.html の試験演出を壊さない）', () => {
  ['burst', 'confetti', 'glyphRain', 'petals', 'warp', 'bubbles', 'fireworks', 'lightning',
   'rings', 'floaters', 'glyphBurst', 'attractor', 'glitchBars', 'dust', 'clear', 'count']
    .forEach(k => assert.strictEqual(typeof FX[k], 'function', k + ' が消えている'));
});

t('gears は指定した数だけ歯車を撒く', () => {
  FX.clear();
  assert.strictEqual(spawned(() => FX.gears(100, 100, { count: 9 })), 9);
});

t('gearRain / steam も数どおり撒く', () => {
  FX.clear();
  assert.strictEqual(spawned(() => FX.gearRain({ count: 30 })), 30);
  FX.clear();
  assert.strictEqual(spawned(() => FX.steam(10, 10, { count: 12 })), 12);
});

t('蒸気は加算合成にしない（加算だと湯気ではなく発光体になる）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'fx_engine.js'), 'utf8');
  const body = src.slice(src.indexOf('function steam('), src.indexOf('function steam(') + 1200);
  assert.ok(/blend:\s*false/.test(body), 'steam に blend:false が無い');
});

t('SVG側の歯車も軸穴を evenodd で抜く', () => {
  assert.ok(/fill-rule['"]?,\s*['"]evenodd/.test(HTML), 'SVG 側の軸穴が抜けていない');
});

// 実際に1フレーム描かせて、canvas に落ちた歯車の輪郭そのものを検査する。
// SVG(_gearPath) と canvas(gearPath) は別実装なので、片方だけ直す事故をここで拾う。
t('canvas の歯車も歯先・歯底・軸穴が揃った輪郭になる', () => {
  FX.clear();
  FX._rec.reset();
  // delay を持たない歯車を1つだけ撒く（複数だと輪郭が混ざる）
  FX.gears(600, 400, { count: 1, min: 40, max: 40 });
  FX._step(8);             // delay を消化してから描かせる
  assert.ok(FX.count() > 0, '粒子が生き残っていない（描画中に例外が出て捨てられた可能性）');
  const S = 40, R = S / 2;

  const pts = FX._rec.path.filter(c => c[0] === 'm' || c[0] === 'l').map(c => Math.hypot(c[1], c[2]));
  assert.ok(pts.length > 8, '歯車の輪郭が描かれていない（描画まで到達していない）');
  const tips = pts.filter(r => Math.abs(r - R) < .3).length;
  const roots = pts.filter(r => Math.abs(r - R * .70) < .3).length;
  assert.ok(tips >= 12 && roots >= 6, '歯先/歯底の頂点が足りない tips=' + tips + ' roots=' + roots);
  pts.forEach(r => assert.ok(r <= R + .3, '歯先が指定サイズをはみ出している: ' + r.toFixed(2)));

  // 軸穴: 歯底より内側の半径で円弧が引かれ、evenodd で塗られる
  const arcs = FX._rec.path.filter(c => c[0] === 'a').map(c => c[3]);
  assert.ok(arcs.some(r => r > 0 && r < R * .70), '軸穴の円弧が無い');
  assert.ok(FX._rec.fills.includes('evenodd'), 'evenodd で塗っていない＝軸穴が抜けない');
});

console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
