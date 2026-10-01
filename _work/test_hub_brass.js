/**
 * ハブのヒーローゲージ（UIテーマ Brass・hub_brass.js）の検査
 * Run: node _work/test_hub_brass.js
 *
 * 実ソースを vm で読み込み、DOM だけを最小の偽物に差し替えて早回しする。見るのは、デモで決めた約束:
 *   ・歯は本当に噛み合う（大歯車と小歯車4枚・奥の歯車列）
 *   ・回転数は達成率から連続的に上がり、目標へは慣性で寄る
 *   ・節目（25/50/75/100/150/200%）を上向きにまたいだ瞬間だけ火花が一斉に噴く
 *   ・火花の量はデモの半分（同時に最大45本・省電力は22本）／NaN を出さない
 *   ・外周の円（進捗の弧・真鍮の輪）を置かない／svg は回転と円形クリップの外／Brass のときだけ出す
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'hub_brass.js'), 'utf8');

// ── 最小の偽 DOM ──
function node(tag) {
  return { tag, attrs: {}, style: {}, children: [], parent: null,
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { if (c.parent) c.remove(); c.parent = this; this.children.push(c); return c; },
    insertBefore(c, ref) { c.parent = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } },
    cloneNode() { const n = node(this.tag); n.attrs = Object.assign({}, this.attrs); n.style = Object.assign({}, this.style); return n; } };
}
function load(classes) {
  const cls = new Set(classes || ['ui-brass']);
  const win = {};
  const ctx = {
    window: win, Math, performance: { now: () => 0 },
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    MutationObserver: function () { this.observe = () => {}; },
    document: { documentElement: { classList: { contains: (c) => cls.has(c) } }, hidden: false, addEventListener() {},
      createElementNS: (ns, tag) => node(tag) }
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  const B = win.MecBrassGauge;
  B._cls = cls;
  return B;
}
function walk(n, f) { f(n); n.children.forEach((c) => walk(c, f)); }

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}
const TAU = Math.PI * 2;
const frac = (x) => ((x % 1) + 1) % 1;

console.log('── hub_brass.js：読み込みと公開口 ──');
t('MecBrassGauge が mount / set を公開し、mount 前の set で落ちない', () => {
  const B = load();
  assert.strictEqual(typeof B.mount, 'function'); assert.strictEqual(typeof B.set, 'function');
  B.set(50);
});
t('mount で歯車・連接棒・火花の層を組み立て、最初の1コマを描く（NaN なし）', () => {
  const B = load(), svg = node('svg');
  B.mount(svg);
  let paths = 0, bad = 0;
  walk(svg, (n) => { if (n.tag === 'path') paths++; Object.values(n.attrs).forEach((v) => { if (/NaN|undefined/.test(v)) bad++; }); });
  assert.ok(paths >= 9, '歯車が足りない ' + paths);   // 機関5枚＋奥4枚
  assert.strictEqual(bad, 0, 'NaN/undefined の属性 ' + bad);
});

console.log('── 噛み合い ──');
// A の歯が接点の向き θ でどこにあるか（歯の間隔を1とした位置）と、B の歯の位置の和が 0.5（＝歯の向かいに歯溝）で一定
function meshPhase(A, B) {
  const th = Math.atan2(B.y - A.y, B.x - A.x);
  const fa = frac((th - A.ang) / (TAU / A.N)), fb = frac((th + Math.PI - B.ang) / (TAU / B.N));
  return frac(fa + fb);
}
t('大歯車と小歯車4枚は、どの角度でも歯の向かいに歯溝が来る', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  const M = B._t.S.M;
  for (const Phi of [0, 0.37, 1.9, 5.5, 41.2]) {
    M.all.forEach((g) => g.drive(Phi));
    M.pinions.forEach((g, i) => {
      assert.ok(Math.abs(meshPhase(M.ring, g) - 0.5) < 1e-6, `小歯車${i} が Φ=${Phi} で噛み合っていない (${meshPhase(M.ring, g).toFixed(4)})`);
      const d = Math.hypot(g.x - M.ring.x, g.y - M.ring.y);
      assert.ok(Math.abs(d - (M.ring.r + g.r)) < 1e-9, `小歯車${i} の中心距離がピッチ円の和でない`);
    });
  }
});
t('奥の歯車列（3枚）も噛み合い、隣とは逆回り', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  const [d1, d2, d3] = B._t.S.M.deepAll;
  for (const Phi of [0, 2.2, 13.7]) {
    [d1, d2, d3].forEach((g) => g.drive(Phi));
    assert.ok(Math.abs(meshPhase(d1, d2) - 0.5) < 1e-6, '奥1-2');
    assert.ok(Math.abs(meshPhase(d2, d3) - 0.5) < 1e-6, '奥2-3');
  }
  assert.ok(Math.sign(d1.k) !== Math.sign(d2.k) && Math.sign(d2.k) !== Math.sign(d3.k), '逆回りでない');
});
t('小歯車は歯数比どおりに速い（k = -36/N）', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  B._t.S.M.pinions.forEach((g) => assert.ok(Math.abs(g.k + 36 / g.N) < 1e-9, 'k=' + g.k));
});

console.log('── 回転数 ──');
t('周期は達成率で連続的に短くなる（0%=37.5秒・100%≈8.4秒・200%≈1.9秒・200%で頭打ち）', () => {
  const B = load(), P = B._t.period;
  assert.ok(Math.abs(P(0) - 37.5) < 1e-9 && Math.abs(P(1) - 8.385) < 0.01 && Math.abs(P(2) - 1.875) < 1e-9, [P(0), P(1), P(2)].join());
  let prev = Infinity;
  for (let p = 0; p <= 2; p += 0.01) { assert.ok(P(p) < prev, '単調でない p=' + p); prev = P(p); }
  assert.strictEqual(P(3), P(2));
});
t('達成率を上げると角速度は慣性でじわっと寄る（跳ねない）', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  const S = B._t.S;
  S.dv = 0; S.prev = 0; S.w = -1; B._t.step(1 / 60, false);
  const w0 = S.w; S.dv = 150; S.prev = 150;
  B._t.step(1 / 60, false);
  const w1 = S.w, target = TAU / B._t.period(1.5);
  assert.ok(w1 > w0 && w1 < w0 + (target - w0) * 0.05, '1コマで寄りすぎ');
  for (let i = 0; i < 60 * 5; i++) B._t.step(1 / 60, false);
  assert.ok(Math.abs(S.w - target) / target < 0.01, '5秒で目標に届かない');
});

console.log('── 火花・節目 ──');
function runAt(v, sec, lite) {
  const B = load(lite ? ['ui-brass', 'mec-lite'] : ['ui-brass']), svg = node('svg'); B.mount(svg);
  const S = B._t.S; S.dv = v; S.prev = v; S.v = v; S.started = true;
  let maxSp = 0, nan = 0;
  for (let i = 0; i < sec * 60; i++) {
    B._t.step(1 / 60, true);
    maxSp = Math.max(maxSp, S.M.sparks.length);
    if (![S.w, S.Phi, S.deepPhi].every(Number.isFinite)) nan++;
  }
  let bad = 0; walk(svg, (n) => Object.values(n.attrs).forEach((x) => { if (/NaN/.test(x)) bad++; }));
  return { maxSp, nan: nan + bad, S };
}
t('火花は達成率で増え、同時に最大45本（デモの半分）', () => {
  const lo = runAt(10, 4), hi = runAt(200, 4);
  assert.ok(hi.maxSp > lo.maxSp, `増えていない ${lo.maxSp}→${hi.maxSp}`);
  assert.ok(hi.maxSp <= 45, '上限超え ' + hi.maxSp);
});
t('省電力（mec-lite）では火花の上限が22本', () => {
  assert.ok(runAt(200, 4, true).maxSp <= 22);
});
t('0〜200% を長く回しても NaN を出さない', () => {
  for (const v of [0, 37, 100, 163, 200]) assert.strictEqual(runAt(v, 20).nan, 0, v + '%');
});
t('節目を上向きにまたいだ瞬間だけ火花が一斉に噴き、衝撃の輪が走る（下向き・同じ値では出ない）', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  const S = B._t.S, step = B._t.step;
  S.dv = 90; S.prev = 90; S.w = -1; step(1 / 60, true);
  S.dv = 101; const r = step(1 / 60, true);
  assert.strictEqual(r.mark, 100, 'mark=' + r.mark);
  assert.ok(S.M.waves.length >= 1, '衝撃の輪が無い');
  assert.ok(S.clunk > 0, '奥の歯車が送られていない');
  S.dv = 60; assert.strictEqual(step(1 / 60, true).mark, 0, '下向きで出た');
  assert.strictEqual(step(1 / 60, true).mark, 0, '同じ値で出た');
});
t('set は最初の1回を 0% から伸ばし、同じ値の再 set では伸び直さない', () => {
  const B = load(), svg = node('svg'); B.mount(svg);
  const S = B._t.S;
  B.set(80); assert.ok(S.tw && S.tw.from === 0 && S.tw.to === 80);
  for (let i = 0; i < 120; i++) B._t.step(1 / 60, false);
  assert.ok(Math.abs(S.dv - 80) < 1e-6 && !S.tw);
  B.set(80); assert.ok(!S.tw, '同じ値で伸び直した');
});

console.log('── 配線（index.html / index.css / index.js / hub_liquid.js） ──');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'index.css'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'index.js'), 'utf8');
t('svg は .gauge-ring の直下（回転・円形クリップの外）で、数字より手前に来ない', () => {
  const i = HTML.indexOf('id="gaugeBrassEngine"');
  assert.ok(i > 0, 'gaugeBrassEngine が無い');
  const svgEnd = HTML.lastIndexOf('</svg>', i), svgOpen = HTML.lastIndexOf('<svg', HTML.lastIndexOf('<svg', i) - 1);
  assert.ok(svgEnd > svgOpen, '旧 svg の中に入っている');
  assert.ok(HTML.indexOf('id="gaugeMid"', i) > i, '数字（#gaugeMid）より後ろにある');
  assert.ok(/html\.ui-brass \.gauge-ring svg\.brass-engine \{[^}]*transform:\s*none;[^}]*clip-path:\s*none;[^}]*overflow:\s*visible/.test(CSS), '回転・クリップを外していない');
});
t('機関は枠の 1.3 倍に広げて中心をそろえる（ゲージが小さい＝ユーザー指摘）', () => {
  const m = CSS.match(/html\.ui-brass \.gauge-ring svg\.brass-engine \{[^}]*\}/);
  assert.ok(m && /left:\s*-15%/.test(m[0]) && /top:\s*-15%/.test(m[0]) && /width:\s*130%/.test(m[0]) && /height:\s*130%/.test(m[0]), '1.3 倍・中心合わせになっていない');
});
t('Brass のときだけ出す（.gauge-ring svg{display:block} に負けない詳細度で隠す）', () => {
  assert.ok(/\n\.gauge-ring svg\.brass-engine \{ display: none; \}/.test(CSS), '既定で隠していない（.brass-engine だけだと他テーマに漏れる）');
  assert.ok(/html\.ui-brass \.gauge-ring svg\.brass-engine \{[^}]*display:\s*block/.test(CSS), 'Brass で出していない');
  const B = load(['ui-liquid']), svg = node('svg'); B.mount(svg);
  assert.strictEqual(B._t.S.raf, 0, 'Brass 以外で rAF を回している');
});
t('外周の円を置かない：Brass では旧 svg（弧・光点・週のビーズ）と真鍮の輪 ::before/::after を隠す', () => {
  assert.ok(/html\.ui-brass \.gauge \.gauge-ring > svg:not\(\.brass-engine\),\s*html\.ui-brass \.gauge \.gauge-ring::before,\s*html\.ui-brass \.gauge \.gauge-ring::after \{ display: none !important; \}/.test(CSS), '隠す規則が無い');
  assert.ok(!/\barc\b|弧/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'hub_brass.js が弧を描いている');
});
t('Liquid も外周の弧・目盛りを描かない（2026-10-01 撤去）', () => {
  const L = fs.readFileSync(path.join(ROOT, 'hub_liquid.js'), 'utf8');
  assert.ok(!/ARC_R|OVF_R|arcGrad|drawArc|G\.ticks/.test(L), '弧・目盛りが残っている');
});
t('hub_brass.js を index.js より先に読み、_driveThemeGauge は mount と set(pct) を呼ぶだけ', () => {
  const a = HTML.indexOf('<script src="hub_brass.js"></script>'), b = HTML.indexOf('<script src="index.js"></script>');
  assert.ok(a > 0 && a < b, '読み込み順');
  assert.ok(/MecBrassGauge\.mount\(document\.getElementById\('gaugeBrassEngine'\)\)/.test(JS), 'mount が無い');
  assert.ok(/MecBrassGauge\.set\(pct\)/.test(JS), 'set(pct) が無い（100% 超もそのまま渡す）');
});
t('ニキシー管の数字はヴィクトリア朝の活字（同梱の Old Standard TT・ライセンス付き）で、4桁でも折り返さない', () => {
  const font = path.join(ROOT, 'fonts', 'nixie_oldstandard.woff2');
  assert.ok(fs.existsSync(font) && fs.readFileSync(font).slice(0, 4).toString() === 'wOF2', 'woff2 が無い');
  assert.ok(fs.existsSync(path.join(ROOT, 'fonts', 'OFL_OldStandardTT.txt')), 'ライセンスが無い');
  assert.ok(/@font-face\{font-family:'MecNixie';src:url\('\.\.\/fonts\/nixie_oldstandard\.woff2'\)/.test(CSS), '@font-face が無い（url は theme_css/ から見た ../fonts/）');
  assert.ok(/html\.ui-brass \.hero-num\{\s*font-family:'MecNixie'/.test(CSS), 'ニキシー管に当たっていない');
  assert.ok(/html\.ui-brass \.hero-num\{white-space:nowrap;\}/.test(CSS) && /html\.ui-brass \.hero-num:has\(> :nth-child\(5\)\)\{font-size:/.test(CSS), '4桁の折り返し対策が無い');
  assert.ok(fs.readFileSync(path.join(ROOT, 'theme_css', 'index.brass.css'), 'utf8').includes('nixie_oldstandard.woff2'), '生成物に入っていない');
  assert.ok(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('"./fonts/nixie_oldstandard.woff2"'), 'SHELL に無い');
});
t('sw.js の SHELL に hub_brass.js がある', () => {
  assert.ok(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('"./hub_brass.js"'));
});

console.log(`\n${fail ? 'FAILED' : 'ALL PASS'} (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
