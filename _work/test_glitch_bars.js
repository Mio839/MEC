/*
 * test_glitch_bars.js — §13 G1 / P1
 *
 * グリッチ帯（`bar`）は _fxBand() を一切見ない最後のエミッタだった。
 * 全幅 × 高さ2〜9px を「全高のランダムな y」に毎フレーム描くので、
 *   ① iPad で約180px あるヘッダの裏にも帯が出る
 *   ② body に filter が掛かってキャンバスが伸びた状態では画面を貫く縦線に見える（§13-1）
 *
 * さらに §13-3 P1: 呼び出し8箇所が `glitchBars(cx, cy, {count, color})` の3引数形で
 * 書かれているのに関数は `glitchBars(o)` の1引数だったため、cx（数値）が o に入って
 * **count も color も黙って捨てられていた**（cyber スキンは緑を指定したつもりが既定の赤で出ていた）。
 *
 * この検査は実ソースの fx_engine.js を vm で回し、描かれた矩形そのものを見る:
 *   ① オプション無しの1引数は**従来どおり**（全幅・全高・既定色）＝エミッタの変更は純増
 *   ② band を渡すと可視帯の中だけに描く
 *   ③ 3引数で count / color が効く（P1）
 *   ④ w を渡すと x を中心にした断片になる
 */
// fx_engine.js の glitchBars を実ソースで回して、描かれた矩形を検査する。
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'fx_engine.js'), 'utf8');

const rects = [];
let fillStyle = '';
const ctx = new Proxy({
  save(){}, restore(){}, beginPath(){}, closePath(){}, moveTo(){}, lineTo(){}, arc(){},
  stroke(){}, fill(){}, clearRect(){}, setTransform(){}, translate(){}, rotate(){}, scale(){},
  drawImage(){}, createRadialGradient(){ return { addColorStop(){} }; },
  createLinearGradient(){ return { addColorStop(){} }; },
  fillText(){}, measureText(){ return { width: 10 }; }, quadraticCurveTo(){}, bezierCurveTo(){},
  ellipse(){}, rect(){}, clip(){}, putImageData(){}, getImageData(){ return {data:[]}; },
  fillRect(x, y, w, h) { rects.push({ x, y, w, h, col: fillStyle }); },
  strokeRect(){}, setLineDash(){},
}, {
  get(t, k) { if (k === 'fillStyle') return fillStyle; return t[k] !== undefined ? t[k] : undefined; },
  set(t, k, v) { if (k === 'fillStyle') fillStyle = v; t[k] = v; return true; }
});

let rafCb = null;
const W = 1920, H = 1080;
const canvasEl = { id:'', style:{ cssText:'' }, width:0, height:0, getContext: () => ctx };
const sandbox = {
  window: null, document: null, console,
  requestAnimationFrame: cb => { rafCb = cb; return 1; },
  cancelAnimationFrame(){}, performance: { now: () => Date.now() },
  setTimeout, clearTimeout, Math, Date, JSON,
};
sandbox.window = sandbox;
sandbox.document = {
  hidden: false,
  createElement: (t) => (t === 'canvas' ? { ...canvasEl, getContext: () => ctx, style:{}, width:0, height:0 } : { style:{} }),
  body: { appendChild(el){ sandbox._canvas = el; } },
  addEventListener(){}, documentElement:{ className:'' },
};
sandbox.window.innerWidth = W; sandbox.window.innerHeight = H;
sandbox.window.devicePixelRatio = 1;
sandbox.window.addEventListener = () => {};
sandbox.window.visualViewport = null;
sandbox.window.matchMedia = () => ({ matches: false, addEventListener(){} });
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const FX = sandbox.window.MecFX;

let T = 1000;
function run(label, fire, check) {
  if (FX.clear) FX.clear();
  fire();
  // delay は最大 0.1s・ttl は 0.14〜0.28s。全部が出そろう t≒0.12s まで進めてから
  // 「最後の1フレームに描かれた矩形」を見る（毎フレーム y が飛ぶ型なので1フレームで数える）。
  let last = [];
  for (let i = 0; i < 9; i++) {
    if (!rafCb) break;
    rects.length = 0;
    const cb = rafCb; rafCb = null;
    T += 16; cb(T);
    last = rects.filter(r => r.h <= 16 && r.w > 30).slice();
  }
  const bars = last;
  const res = check(bars);
  console.log(`
${label}`);
  console.log('  bars:', bars.length, bars[0] ? JSON.stringify(bars[0]) : '');
  Object.entries(res).forEach(([k, v]) => console.log(`   ${v === true ? '✓' : '✗'} ${k}: ${v}`));
  return res;
}

let bad = 0;
const r1 = run('① 1引数・オプションなし（従来どおり全幅・全高・既定色）',
  () => FX.glitchBars({ count: 8 }),
  bars => ({
    'n>0': bars.length > 0,
    '全幅 (x=0, w=W)': bars.every(b => b.x === 0 && b.w === W),
    'y は 0〜H': bars.every(b => b.y >= 0 && b.y <= H),
    '既定色（赤/シアン/白）': bars.every(b => /255,0,60|0,210,255|255,255,255/.test(b.col)),
  }));

const r2 = run('② 1引数 + band（全幅のまま可視帯へ収める）',
  () => FX.glitchBars({ count: 10, band: { top: 209, vBottom: 900 } }),
  bars => ({
    'n>0': bars.length > 0,
    '全幅': bars.every(b => b.x === 0 && b.w === W),
    'y が帯の中 (209〜900)': bars.every(b => b.y >= 209 && b.y <= 900),
  }));

const r3 = run('③ 3引数 (x,y,o) — P1: count と color が効く',
  () => FX.glitchBars(700, 500, { count: 5, color: '#00FF66' }),
  bars => ({
    'count が効く (5本)': bars.length === 5,
    'color が効く (#00FF66)': bars.every(b => b.col === '#00FF66'),
    '全幅（w 未指定なので従来どおり）': bars.every(b => b.x === 0 && b.w === W),
  }));

const r4 = run('④ 3引数 + w + band — x を中心にした断片',
  () => FX.glitchBars(700, 500, { count: 6, color: '#00FF66', w: 400, band: { top: 209, vBottom: 900 } }),
  bars => ({
    'count が効く (6本)': bars.length === 6,
    '幅 400': bars.every(b => b.w === 400),
    'x=700 を中心 (左端 500)': bars.every(b => b.x === 500),
    'y が帯の中': bars.every(b => b.y >= 209 && b.y <= 900),
  }));

[r1, r2, r3, r4].forEach(r => Object.values(r).forEach(v => { if (v === false) bad++; }));
console.log(bad ? `\n✗ ${bad} 件` : '\n✓ 全部 OK');
process.exit(bad ? 1 : 0);
