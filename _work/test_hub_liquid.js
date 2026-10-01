/**
 * ハブのヒーローゲージ（UIテーマ Liquid・hub_liquid.js）の動きの検査
 * Run: node _work/test_hub_liquid.js
 *
 * 実ソースを vm で読み込み、描画（canvas）だけを空の偽物に差し替えて、シミュレーションを早回しする。
 * 見るのは、デモ（_work/gauge_liquid_demo.html）でユーザーと決めた約束:
 *   ・ちぎれたかけらは止まらない／外周の弧へはみ出さない／塊のまわりをぐるぐる回らない
 *   ・ちぎれ始めるのは一度に1つ／見えるかけらは達成率ごとの上限まで
 *   ・小さな雫はその場で消えず、中央の塊へ吸い込まれてから消える
 *   ・100% を超えても色は変えない（派手さは勢いで上げる）／NaN を出さない
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'hub_liquid.js'), 'utf8');

function load() {
  const cls = new Set(['ui-liquid']);
  const win = { devicePixelRatio: 1 };
  const ctx = {
    window: win, Math, Map, Set, Float32Array, performance: { now: () => 0 },
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    document: { documentElement: { classList: { contains: (c) => cls.has(c) } }, hidden: false, addEventListener() {} }
  };
  ctx.window = win;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return win.MecLiquidGauge;
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// 達成率 v で sec 秒回して集計する（描画はしない）
function run(v, sec) {
  const L = load(), T = L._t, G = T.G;
  G.blob = new T.Blob(11, T.CFG); G.goo = { hot: 0, render() {} };
  G.dv = v; G.v = v; G.heat = Math.min(1.6, v / 100); G.blob.e = G.heat; G.started = true;
  const st = { nan: 0, out: 0, float: 0, slow: 0, maxCount: 0, overCap: 0, tearingTwo: 0, rot: [], dropsBorn: 0, dropsDied: 0, dropDiedOutside: 0 };
  const seen = new Map(), dseen = new Map();
  const dt = 1 / 60;
  for (let i = 0; i < sec * 60; i++) {
    T.tick(dt, false);
    const B = G.blob;
    const tearing = B.lobes.filter((l) => l.st === 'bud' || l.st === 'out').length;
    if (tearing > 1) st.tearingTwo++;
    const n = B.count(); st.maxCount = Math.max(st.maxCount, n);
    if (n > T.CFG.cap(G.dv)) st.overCap++;
    const alive = new Set();
    for (const l of B.lobes) {
      if (l.st === 'gone') continue;
      alive.add(l);
      if (![l.x, l.y, l.r, l.a].every(Number.isFinite)) st.nan++;
      if (!seen.has(l)) seen.set(l, { prev: l.a, net: 0, px: l.x, py: l.y });
      const s = seen.get(l);
      s.net += Math.atan2(Math.sin(l.a - s.prev), Math.cos(l.a - s.prev)); s.prev = l.a;
      if (l.st === 'float') {
        st.float++;
        const rho = Math.hypot(l.x - B.cx, l.y - B.cy);
        if (rho + l.rDraw > 69) st.out++;
        if (Math.hypot(l.x - s.px, l.y - s.py) / dt < 1) st.slow++;
      }
      s.px = l.x; s.py = l.y;
    }
    for (const [l, s] of seen) if (!alive.has(l) && !s.done) { s.done = 1; st.rot.push(Math.abs(s.net) * 180 / Math.PI); }
    const dAlive = new Set(B.drops);
    for (const d of B.drops) {
      if (!dseen.has(d)) { dseen.set(d, {}); st.dropsBorn++; }
      if (![d.x, d.y, d.r].every(Number.isFinite)) st.nan++;
      if (Math.hypot(d.x - B.cx, d.y - B.cy) + d.r > 69) st.out++;
      dseen.get(d).rho = Math.hypot(d.x - B.cx, d.y - B.cy);
    }
    for (const [d, s] of dseen) if (!dAlive.has(d) && !s.done) { s.done = 1; st.dropsDied++; if (s.rho > B.E) st.dropDiedOutside++; }
  }
  st.rot.sort((a, b) => a - b);
  st.rotMed = st.rot.length ? st.rot[st.rot.length >> 1] : 0;
  st.slowPct = st.float ? st.slow / st.float * 100 : 0;
  st.outPct = st.float ? st.out / st.float * 100 : 0;
  return st;
}

console.log('── hub_liquid.js：読み込みと公開口 ──');
t('MecLiquidGauge が mount / set を公開し、mount 前の set で落ちない', () => {
  const L = load();
  assert.strictEqual(typeof L.mount, 'function');
  assert.strictEqual(typeof L.set, 'function');
  L.set(40); L.set(40); L.set(130);
});

console.log('── 動き（各 5 分ぶん早回し）──');
const R = {};
for (const v of [10, 60, 100, 160]) R[v] = run(v, 300);
t('NaN を出さない', () => { for (const v in R) assert.strictEqual(R[v].nan, 0, v + '% で NaN ' + R[v].nan); });
t('漂うかけら・雫が外周の弧へはみ出さない（漂う時間の 0.5% 未満）', () => {
  for (const v in R) assert.ok(R[v].outPct < 0.5, v + '% で ' + R[v].outPct.toFixed(2) + '%');
});
t('漂うかけらは止まらない（速さ 1 未満が 3% 未満）', () => {
  for (const v in R) assert.ok(R[v].slowPct < 3, v + '% で ' + R[v].slowPct.toFixed(1) + '%');
});
t('塊のまわりをぐるぐる回らない（1つのかけらが帰るまでに回る角度の中央値 150° 未満）', () => {
  for (const v in R) assert.ok(R[v].rot.length >= 5 && R[v].rotMed < 150, v + '% で中央値 ' + R[v].rotMed.toFixed(0) + '°（' + R[v].rot.length + '個）');
});
t('ちぎれ始めるのは一度に1つ・見えるかけらは上限まで', () => {
  for (const v in R) { assert.strictEqual(R[v].tearingTwo, 0, v + '%'); assert.strictEqual(R[v].overCap, 0, v + '%'); }
});
t('% が上がるとかけらが増える（10% は1つ・160% は 5 つ以上）', () => {
  assert.strictEqual(R[10].maxCount, 1);
  assert.ok(R[160].maxCount >= 5, '160% で最大 ' + R[160].maxCount);
});
t('小さな雫は 75% から出て、すべて塊の縁より内側で消える（その場で消えない）', () => {
  assert.strictEqual(R[10].dropsBorn, 0); assert.strictEqual(R[60].dropsBorn, 0);
  assert.ok(R[160].dropsBorn > 50, '160% で ' + R[160].dropsBorn);
  for (const v of [100, 160]) {
    assert.ok(R[v].dropsDied >= R[v].dropsBorn - 8, v + '% で取り残し ' + (R[v].dropsBorn - R[v].dropsDied));
    assert.strictEqual(R[v].dropDiedOutside, 0, v + '% で塊の外で消えた雫 ' + R[v].dropDiedOutside);
  }
});

console.log('── 表示の値・段の演出 ──');
t('set は目標へ値を伸ばし、通過した段（25/50/75）と 100% でかけら・光を積む', () => {
  const L = load(), T = L._t, G = T.G;
  G.blob = new T.Blob(11, T.CFG); G.goo = { hot: 0, render() {} };
  L.set(120);
  let glows = 0;
  for (let i = 0; i < 60 * 3; i++) { T.tick(1 / 60, false); glows = Math.max(glows, G.glows.length); }
  assert.ok(Math.abs(G.dv - 120) < 1e-6, 'dv=' + G.dv);
  assert.ok(glows >= 1, '段・到達の光が出ていない');
  assert.ok(!('ticks' in G), '外周の目盛り（2026-10-01 撤去）が復活している');
});
t('同じ値で何度 set しても伸び直さない（同期のたびに renderHero が走る）', () => {
  const L = load(), T = L._t, G = T.G;
  G.blob = new T.Blob(11, T.CFG); G.goo = { hot: 0, render() {} };
  L.set(50); for (let i = 0; i < 120; i++) T.tick(1 / 60, false);
  L.set(50);
  assert.strictEqual(G.tw, null, '同じ値で伸び直しが始まった');
});

console.log('── 色 ──');
t('100% を超えても色は変えない（金色の配色が無い）', () => {
  assert.ok(!/PALG|gold|#FFD166|255,\s*209,\s*102/i.test(SRC));
});
t('光の網（コースティクス）は % で筋が増える（3→8本）', () => {
  assert.ok(/n = 3 \+ Math\.round\(hot \* 5\)/.test(SRC));
});

console.log('\n' + (fail ? 'FAIL' : 'ALL PASS') + ' (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
