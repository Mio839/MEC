/* hub_liquid.js — ハブのヒーローゲージ（UIテーマ Liquid）
   2026-09-29 新設。デモ `_work/gauge_liquid_demo.html`（第8版の採用版＋案2「中を揺れる光の網」）をそのまま移したもの。
   旧 Liquid ゲージ（ガラスの丸窓・ラバ・セル・膜のくびれ・真珠の輪・メニスカス・毛細管の弧）はユーザー判断で全部撤去した。

   中央の塊がフヨフヨ揺れ、一部がゆっくりちぎれて漂い（塊のまわりを回らず、ちぎれた場所のあたりで行きつ戻りつ）、
   また戻って溶け込む。75% あたりからかけらの小さな雫も分かれ、漂ったあと中央へ引き寄せられて吸い込まれる。
   塊の中には光の網（コースティクス）。外周に進捗の弧（r=74）、100% 超は外周 r=80 にもう1本。
   ⚠️ 100% を超えても色は変えない（以前のデモは金色へ移っていた＝ユーザーの指示で撤去）。派手さは勢い e（達成率/100・160% で頭打ち）で
      揺れ・にじみ・縁の照り・弧の光・かけらの数（150%で7）・ちぎれる頻度・気泡・小さな雫・光の網の本数を上げる。
   ⚠️ 動きの正本はデモ。ここを直したらデモも直す（逆も）。動きを変えるときはデモで 10 分早回しの検査をしてから移すこと
      （止まる・弧へはみ出す・NaN・雫の取り残し。手順はデモ冒頭のコメント）。
   index.js の _driveThemeGauge が MecLiquidGauge.set(pct) を呼ぶだけ。canvas は index.html の #gaugeLiquidCanvas。
   テスト: node _work/test_hub_liquid.js */
(function () {
'use strict';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => { k = clamp(k, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const soft = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ══════════════════════ 配色（Liquid） ══════════════════════
   縁＝ネオンのマゼンタ → バイオレット。深い藍は塊の中心のまわり（数字の下）だけ。縁にシアンの照り返し。100% を超えても変えない。 */
const PAL = { edgeT: [255, 60, 175], edgeB: [255, 0, 127], mid: [121, 40, 202], core: [18, 8, 46], rim: [0, 242, 254], halo: [255, 0, 127] };

/* ══════════════════════ ② 輪郭を線で描く ══════════════════════
   1.5 単位の格子で場を計算し、マーチングスクエアで f=1 の等高線を拾う。点をつないで閉じた輪にし、
   Catmull-Rom の曲線でなめらかにして canvas のパスで塗る（どの大きさでも縁が鋭くなめらか）。
   塗りは塊の中心からの放射グラデーション（中心＝藍 → バイオレット → 縁＝マゼンタ）。縁の照り・光沢・にじみはパスで描き足す。 */
const CG = 1.5, CM = Math.round(168 / CG) + 1;
const MS = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 6: [[0, 2]], 7: [[3, 0]], 8: [[3, 0]], 9: [[0, 2]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]] };
class PathGoo {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.hot = 0; this.F = new Float32Array(CM * CM); this.resize(); }
  resize() {
    resize();   // 解像度はゲージ側で決める（省電力で下げる）
  }
  loops(B) {
    const F = this.F, nb = B.length;
    for (let j = 0; j < CM; j++) for (let i = 0; i < CM; i++) {
      const x = i * CG, y = j * CG; let v = 0;
      for (let k = 0; k < nb; k += 3) { const dx = x - B[k], dy = y - B[k + 1], q = B[k + 2] / (dx * dx + dy * dy + 0.4); v += q * q; }
      F[j * CM + i] = v;
    }
    const pt = new Map(), adj = new Map();
    const ep = (i, j, e) => {   // 辺の番号（上0・右1・下2・左3）→ 点の鍵と位置
      let a, b, key;
      if (e === 0) { a = [i, j]; b = [i + 1, j]; key = (j * CM + i) * 2; }
      else if (e === 2) { a = [i, j + 1]; b = [i + 1, j + 1]; key = ((j + 1) * CM + i) * 2; }
      else if (e === 3) { a = [i, j]; b = [i, j + 1]; key = (j * CM + i) * 2 + 1; }
      else { a = [i + 1, j]; b = [i + 1, j + 1]; key = (j * CM + i + 1) * 2 + 1; }
      if (!pt.has(key)) {
        const va = F[a[1] * CM + a[0]], vb = F[b[1] * CM + b[0]], k = clamp((1 - va) / (vb - va), 0, 1);
        pt.set(key, [lerp(a[0], b[0], k) * CG, lerp(a[1], b[1], k) * CG]);
      }
      return key;
    };
    const link = (p, q) => { (adj.get(p) || adj.set(p, []).get(p)).push(q); (adj.get(q) || adj.set(q, []).get(q)).push(p); };
    for (let j = 0; j < CM - 1; j++) for (let i = 0; i < CM - 1; i++) {
      const v0 = F[j * CM + i], v1 = F[j * CM + i + 1], v2 = F[(j + 1) * CM + i + 1], v3 = F[(j + 1) * CM + i];
      const c = (v0 >= 1 ? 8 : 0) | (v1 >= 1 ? 4 : 0) | (v2 >= 1 ? 2 : 0) | (v3 >= 1 ? 1 : 0);
      if (c === 0 || c === 15) continue;
      let segs = MS[c];
      if (c === 5 || c === 10) {   // 鞍点：中心の値でつなぎ方を決める
        const mid = (v0 + v1 + v2 + v3) / 4 >= 1;
        segs = (c === 5) === mid ? [[3, 0], [2, 1]] : [[3, 2], [0, 1]];
      }
      for (const [e1, e2] of segs) link(ep(i, j, e1), ep(i, j, e2));
    }
    const seen = new Set(), out = [];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const loop = []; let prev = -1, cur = start;
      while (cur != null && !seen.has(cur)) {
        seen.add(cur); loop.push(pt.get(cur));
        const nb2 = adj.get(cur); const nx = nb2[0] !== prev ? nb2[0] : nb2[1];
        prev = cur; cur = nx;
      }
      if (loop.length >= 4) out.push(loop);
    }
    return out;
  }
  render(B, cx, cy, heads, bubbles, hk) {   // hk＝追加演出の差し込み口 { under（塊の後ろ）, inside（塊の中・切り抜き済み）, over（塊の上） }
    const c = this.ctx, W = this.cv.width, s = W / 168, P = PAL, hot = this.hot;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, this.cv.height);
    c.setTransform(s, 0, 0, s, 0, 0);
    if (hk && hk.under) { c.save(); hk.under(c, s); c.restore(); }
    const path = new Path2D();
    for (const L of this.loops(B)) {
      const n = L.length;
      path.moveTo(L[0][0], L[0][1]);
      for (let i = 0; i < n; i++) {
        const p0 = L[(i - 1 + n) % n], p1 = L[i], p2 = L[(i + 1) % n], p3 = L[(i + 2) % n];
        path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
      }
      path.closePath();
    }
    const gr = c.createRadialGradient(cx, cy, 0, cx, cy, 64);
    gr.addColorStop(0, rgba(P.core, 1)); gr.addColorStop(0.3, rgba(P.core, 1)); gr.addColorStop(0.5, rgba(P.mid, 1));
    gr.addColorStop(0.64, rgba(P.edgeB, 1)); gr.addColorStop(1, rgba(P.edgeT, 1));
    // にじみ（外の光）と塗り
    // にじみは達成率とともに広く濃くなる（色相は変えない）
    c.save(); c.shadowColor = rgba(P.halo, 0.38 + hot * 0.42); c.shadowBlur = (6 + hot * 14) * s; c.fillStyle = gr; c.fill(path);
    if (hot > 0.6) { c.shadowBlur = (4 + (hot - 0.6) * 30) * s; c.shadowColor = rgba(P.edgeT, (hot - 0.6) * 0.9); c.fill(path); }   // 100% を越えたあたりから二重の光
    c.restore();
    c.save(); c.clip(path);
    // 縁の照り（内側にだけ）：太く淡いシアン＋細く明るい線
    c.lineJoin = 'round';
    c.strokeStyle = rgba(P.rim, 0.1 + hot * 0.1); c.lineWidth = 9; c.stroke(path);
    c.strokeStyle = rgba(P.rim, 0.32 + hot * 0.3); c.lineWidth = 2.6; c.stroke(path);
    c.strokeStyle = rgba(P.edgeT, 0.45 + hot * 0.25); c.lineWidth = 1.2; c.stroke(path);
    // 中の気泡：塊の中をゆっくり昇る小さな泡（数は達成率で増える）
    for (const b of bubbles) {
      const al = b.al * Math.min(1, b.t / 0.8) * Math.min(1, (b.life - b.t) / 0.8);
      if (al <= 0) continue;
      const bg = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
      bg.addColorStop(0, `rgba(255,255,255,${(al * 0.9).toFixed(3)})`); bg.addColorStop(0.6, rgba(P.rim, al * 0.35)); bg.addColorStop(1, rgba(P.rim, 0));
      c.fillStyle = bg; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
    }
    // 光沢：塊とかけらの左上に白い照り
    for (const [x, y, r] of heads) {
      const hx = x - r * 0.32, hy = y - r * 0.42, hg = c.createRadialGradient(hx, hy, 0, hx, hy, r * 0.55);
      hg.addColorStop(0, 'rgba(255,255,255,.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hg; c.fillRect(hx - r, hy - r, r * 2, r * 2);
    }
    if (hk && hk.inside) { c.save(); hk.inside(c, path, s); c.restore(); }
    c.restore();
    if (hk && hk.over) { c.save(); hk.over(c, path, s); c.restore(); }
  }
}

/* ══════════════════════ 設定 ══════════════════════ */
const CFG = {
  core0: 28, E: 41, wobD: 17, wobA: 5, wobR: 20,
  bud: 4.2, tOut: 5.6, tBack: 4.6, melt: 3.2, hold: [14, 24], rT: [6, 8], out: [54, 60],   // 泳ぐ時間を長くして、上限までかけらが揃って泳ぐようにする
  cap: (v) => Math.min(7, 1 + Math.floor(Math.min(150, v) / 25)),   // 見えるかけらは 0%で1つ → 25%ごとに1つ → 100%で5つ → 125%で6つ → 150%で7つ
  rate: (e) => 0.14 + e * 0.22   // 前のかけらがちぎれ終わったら、あまり待たずに次がちぎれ始める（達成率が高いほど待たない）
};

/* ══════════════════════ 中央の塊 ══════════════════════
   芯の球＋ゆっくり巡る5つの球＝輪郭がフヨフヨ変わる。塊の中心もゆっくり漂う。
   ちぎれる一部（lobe）は bud（縁がふくらむ）→ out（糸を引いて離れる）→ float（泳ぐ）→ back（戻る）→ melt（溶け込む）。 */
class Blob {
  constructor(seed, C) {
    const R = this.R = rng(seed);
    this.C = C; this.t = 0; this.E = C.E; this.core0 = C.core0; this.amp = 1; this.e = 0;
    this.wob = Array.from({ length: 5 }, (_, i) => ({ a: i * TAU / 5 + R() * 0.5, om: (R() < 0.5 ? -1 : 1) * (0.05 + R() * 0.07), w: 0.3 + R() * 0.3, w2: 0.2 + R() * 0.25, ph: R() * 6 }));
    this.lobes = []; this.drops = []; this.bubbles = []; this.dropCd = 2; this.cx = 84; this.cy = 84;
    this.ev = [];   // 追加演出へ知らせる出来事（{k:'absorb', a, r}＝かけら・雫が塊に溶け込み始めた）。ゲージが毎コマ空にする
  }
  P(r, a) { return [this.cx + r * Math.sin(a), this.cy - r * Math.cos(a)]; }
  polarOf(x, y) { const dx = x - this.cx, dy = y - this.cy; return [Math.atan2(dx, -dy), Math.hypot(dx, dy)]; }
  add(o) {
    const R = this.R, C = this.C;
    const l = Object.assign({ st: 'bud', t: 0, r: 0, rT: lerp(C.rT[0], C.rT[1], R()), hold: lerp(C.hold[0], C.hold[1], R()), s: R() * 6, s2: R() * 6, s3: R() * 6,
      dir: R() < 0.5 ? -1 : 1, spd: 0.14 + R() * 0.1, rmid: lerp(C.out[0], C.out[1], R()), vx: 0, vy: 0 }, o);
    l.hold *= 1 + 0.6 * this.e;   // 達成率が高いほど長く漂う＝ちぎれ始めは一度に1つ・ゆっくりのまま、見えるかけらが増える
    l.a = l.a0; this.lobes.push(l); return l;
  }
  count() { return this.lobes.filter((l) => l.st !== 'gone' && l.st !== 'melt').length; }
  // ふくらむ・離れる・戻るときの泳ぐ向きと速さ（角速度）。止まらないよう最低速度を持たせる
  // 周回に見えないよう控えめ（第8版・改で 0.45 倍に）
  swimW(l) { return 0.45 * l.dir * (l.spd + 0.06 * Math.sin(l.t * 0.55 + l.s) + 0.05 * Math.sin(this.t * 0.9 + l.s2)); }
  // かけら同士の出会い：近づいたらくっつき（約1.4秒）、そろって漂い（約2.2秒）、またちぎれて離れる（約1.6秒）。
  // 離れたあと8秒はどちらも次の相手とくっつかない。力は drift() の中でかける（ここは組と段階を決めるだけ）
  meet(dt) {
    const fl = this.lobes.filter((l) => l.st === 'float');
    for (const l of this.lobes) l.cool = Math.max(0, (l.cool || 0) - dt);
    for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
      const a = fl[i], b = fl[j];
      if (a.mate || b.mate || a.cool > 0 || b.cool > 0) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < (a.rDraw + b.rDraw) * 1.9) { a.mate = b; b.mate = a; a.mt = b.mt = 0; }
    }
    for (const a of this.lobes) {
      if (!a.mate) continue;
      a.mt += dt;
      if (a.mt >= 5.2 || a.mate.st !== 'float' || a.st !== 'float') { a.mate = null; a.cool = 8; }
    }
  }
  // 漂う（第8版・改）：位置と速度を持ち、ゆらぐ流れ（周波数の違う正弦の和）に押されて慣性で動く。
  // 周回はさせない：かけらには「居場所」（ちぎれた角度）があり、居場所はごくゆっくりしか移らない（1回の漂いで数十度）。
  // かけらは居場所のまわりをゆらぎで行きつ戻りつし、ゆるいばねで居場所へ引き戻される。帯（塊と外周の弧のあいだ）からは押し戻す。
  // 以前は泳ぐ向きへの流れを常にかけていたので、塊のまわりをぐるぐる回って見えた（ユーザー指摘）。
  drift(l, dt) {
    const e = this.e, t = l.t, dx = l.x - this.cx, dy = l.y - this.cy, rho = Math.hypot(dx, dy) || 1, ux = dx / rho, uy = dy / rho;
    let fx = 0, fy = 0;
    if (l.home == null) l.home = l.a;
    l.home += l.dir * (0.018 + 0.014 * Math.sin(t * 0.11 + l.s3)) * (1 + 0.3 * e) * dt;
    const [hx, hy] = this.P(l.rmid, l.home);
    fx += (hx - l.x) * 0.3; fy += (hy - l.y) * 0.3;
    const vr = l.vx * ux + l.vy * uy;
    fx -= vr * ux * 0.5; fy -= vr * uy * 0.5;   // 内外へのふらつきは、じわっと止まる（弧へ飛び出さない）
    // ゆらぐ流れ（乱数ではなく決定論の正弦の和）。達成率が上がると強い
    const nA = 4.2 * (1 + 0.45 * e);
    fx += nA * (Math.sin(t * 0.31 + l.s) + 0.7 * Math.sin(t * 0.67 + l.s2 * 1.7) + 0.4 * Math.sin(t * 1.29 + l.s3));
    fy += nA * (Math.cos(t * 0.27 + l.s2) + 0.7 * Math.sin(t * 0.59 + l.s * 1.3) + 0.4 * Math.cos(t * 1.13 + l.s3 * 0.7));
    // 帯：塊から離れすぎず、外周の弧に触れない（中ほどへもゆるく）
    const lo = this.E + l.rDraw + 4, hi = 65.5 - l.rDraw;
    let fr = (l.rmid - rho) * 0.4;
    if (rho < lo) fr += (lo - rho) * 9; else if (rho > hi) fr -= (rho - hi) * 16;
    fx += fr * ux; fy += fr * uy;
    // 近くの相手へゆるく寄る（出会う機会を増やす）
    if (!l.mate && !(l.cool > 0)) for (const o of this.lobes) {
      if (o === l || o.st !== 'float' || o.mate || o.cool > 0) continue;
      const ox = o.x - l.x, oy = o.y - l.y, d = Math.hypot(ox, oy);
      if (d < 30 && d > 0.1) { const k = 1.1 * (1 - d / 30); fx += ox / d * k; fy += oy / d * k; }
    }
    // くっついている間：少し重なる間隔までばねで寄り、速度を揃える。離れる段では押し離す
    if (l.mate) {
      const o = l.mate, ox = o.x - l.x, oy = o.y - l.y, d = Math.hypot(ox, oy) || 1, d0 = (l.r + o.r) * 0.62;
      if (l.mt < 3.6) {
        const k = l.mt < 1.4 ? 0.6 + 1.4 * ease(l.mt / 1.4) : 2;
        fx += ox / d * (d - d0) * k; fy += oy / d * (d - d0) * k;
        fx += (o.vx - l.vx) * 1.2; fy += (o.vy - l.vy) * 1.2;
      } else {
        const k = 3.2 * Math.sin(Math.PI * clamp((l.mt - 3.6) / 1.6, 0, 1));
        fx -= ox / d * k; fy -= oy / d * k;
      }
    }
    // 下支え：ゆるんでも止まりはしない（速さ 3 未満なら、今の向きへそっと押す＝止まった塊に見せない）
    const sp = Math.hypot(l.vx, l.vy);
    if (sp < 3) { const k = (3 - sp) * 2.2, gx = sp > 0.05 ? l.vx / sp : -uy * l.dir, gy = sp > 0.05 ? l.vy / sp : ux * l.dir; fx += gx * k; fy += gy * k; }
    const damp = Math.exp(-0.6 * dt);
    l.vx = (l.vx + fx * dt) * damp; l.vy = (l.vy + fy * dt) * damp;
    l.x += l.vx * dt; l.y += l.vy * dt;
    [l.a, l.rho] = this.polarOf(l.x, l.y);
  }
  // 75% あたりから、漂うかけらから小さな雫が分かれて漂い、やがて中央の塊へ引き寄せられて吸い込まれる（数は達成率で増える：100%で2・130%で5・160%で8）
  maxDrops() { return this.e < 0.75 ? 0 : Math.min(8, Math.round((this.e - 0.75) * 9.5)); }
  stepDrops(dt) {
    const R = this.R, fl = this.lobes.filter((l) => l.st === 'float' && l.r > 4);
    this.dropCd -= dt * (0.4 + this.e * 0.5);
    if (this.dropCd <= 0 && this.drops.length < this.maxDrops() && fl.length) {
      const l = fl[Math.floor(R() * fl.length)], ux = (l.x - this.cx) / (l.rho || 1), uy = (l.y - this.cy) / (l.rho || 1);
      const side = R() < 0.5 ? -1 : 1, nx = ux * 0.5 - uy * side * 0.85, ny = uy * 0.5 + ux * side * 0.85;
      this.drops.push({ x: l.x + nx * l.rDraw * 0.6, y: l.y + ny * l.rDraw * 0.6, vx: l.vx + nx * 5, vy: l.vy + ny * 5, r: 0, rT: 2.6 + R() * 1.4,
        t: 0, life: 4 + R() * 3.5, s: R() * 6, s2: R() * 6 });
      this.dropCd = 0.8 + R() * 1.6;
    }
    // 雫の一生：分かれる（0.9秒でふくらむ）→ 漂う（life 秒）→ 中央の塊へ引き寄せられる → 縁に触れて吸い込まれる。
    // その場で消えはしない（ユーザー指示・第8版）。塊の縁も近づいてきた雫の方へ少しふくらんで迎える。
    for (const d of this.drops) {
      d.t += dt;
      const dx = d.x - this.cx, dy = d.y - this.cy, rho = Math.hypot(dx, dy) || 1, ux = dx / rho, uy = dy / rho, vr = d.vx * ux + d.vy * uy;
      let fx = 0, fy = 0;
      if (d.st === 'sink') {
        // 縁に触れた：中へ沈みながら小さくなる（metaball なので塊の輪郭に溶け込んで見える）
        const k = soft(d.tk / 1.1); d.tk += dt;
        d.r = d.r0 * (1 - k); d.reach = d.rT * 0.7 * (1 - k);
        fx -= ux * 14; fy -= uy * 14;
        if (d.tk >= 1.1) d.dead = 1;
      } else if (d.t < d.life) {
        d.r = d.rT * soft(d.t / 0.9);
        fx = 3.4 * (Math.sin(d.t * 0.6 + d.s) + 0.5 * Math.sin(d.t * 1.5 + d.s2)); fy = 3.4 * (Math.cos(d.t * 0.5 + d.s2) + 0.5 * Math.sin(d.t * 1.3 + d.s));
        const lo = this.E + 8, hi = 66 - d.rT;
        fx -= ux * vr * 0.8; fy -= uy * vr * 0.8;
        if (rho < lo) { fx += ux * (lo - rho) * 9; fy += uy * (lo - rho) * 9; } else if (rho > hi) { fx -= ux * (rho - hi) * 16; fy -= uy * (rho - hi) * 16; }
      } else {
        // 引き寄せ：はじめはそっと、近づくほど強く（最後はすっと吸い込まれる）。横へのゆらぎは弱めて残す
        const k = soft((d.t - d.life) / 2.2), gap = Math.max(0, rho - this.E);
        const pull = (2 + 10 * k) * (1 + 18 / (gap + 6));
        fx -= ux * pull; fy -= uy * pull;
        fx += 1.6 * Math.sin(d.t * 0.9 + d.s) * (1 - k); fy += 1.6 * Math.cos(d.t * 0.8 + d.s2) * (1 - k);
        d.r = d.rT;
        d.reach = d.rT * 0.7 * soft(1 - (gap - d.rT) / 12);   // 縁が迎えに伸びる
        if (rho < this.E + d.rT * 0.4) { d.st = 'sink'; d.tk = 0; d.r0 = d.r; this.ev.push({ k: 'absorb', a: d.a, r: d.rT * 0.6 }); }
      }
      const damp = Math.exp(-1.1 * dt);
      d.vx = (d.vx + fx * dt) * damp; d.vy = (d.vy + fy * dt) * damp; d.x += d.vx * dt; d.y += d.vy * dt;
      d.a = Math.atan2(d.x - this.cx, -(d.y - this.cy));
    }
    this.drops = this.drops.filter((d) => !d.dead);
  }
  // 塊の中をゆっくり昇る気泡（0% で1つ → 100% で6つ → 160% で9つ）
  stepBubbles(dt) {
    const R = this.R, want = Math.round(1 + this.e * 5.2);
    if (this.bubbles.length < want && R() < dt * (0.6 + this.e)) {
      const a = R() * TAU, d = Math.sqrt(R()) * this.E * 0.7;
      this.bubbles.push({ x: this.cx + d * Math.sin(a), y: this.cy + d * 0.6 + 6, r: 1.1 + R() * 1.8, t: 0, life: 3 + R() * 3, al: 0.35 + R() * 0.35 + this.e * 0.12, s: R() * 6, up: 3 + R() * 4 });
    }
    for (const b of this.bubbles) { b.t += dt; b.y -= b.up * (0.8 + 0.4 * this.e) * dt; b.x += Math.sin(b.t * 2 + b.s) * 2.2 * dt; }
    this.bubbles = this.bubbles.filter((b) => b.t < b.life);
  }
  step(dt, e) {
    this.t += dt; this.e = e; const t = this.t, C = this.C;
    this.cx = 84 + Math.sin(t * 0.23) * 1.4; this.cy = 84 + Math.cos(t * 0.29) * 1.2;
    this.amp = 1 + e * 0.38;   // 揺れの大きさ：0% で1倍 → 100% で1.38倍 → 160% で1.6倍
    this.meet(dt);
    for (const l of this.lobes) {
      l.t += dt;
      const E = this.E, px = l.x, py = l.y;
      if (l.st === 'bud') {
        const k = ease(l.t / C.bud);
        l.rho = E - 6 + l.rT * 0.95 * k; l.r = l.rT * k;
        l.a += this.swimW(l) * dt * 0.15 * k;   // ふくらみながら、わずかに横へずれはじめる
        if (l.t >= C.bud) { l.st = 'out'; l.t = 0; l.rho0 = l.rho; const [x, y] = this.P(l.rho, l.a); l.tl = { x, y, r: l.rT * 0.84, on: 1, a: l.a }; }
      } else if (l.st === 'out') {
        const k = ease(l.t / C.tOut);
        l.rho = lerp(l.rho0, l.rmid, k);
        l.a += this.swimW(l) * dt * (0.15 + 0.85 * k);   // 離れながら泳ぎ出す
        if (l.tl && l.tl.on) {
          const [ox, oy] = this.P(E - 3, l.tl.a), [hx, hy] = this.P(l.rho, l.a);
          l.tl.x = lerp(ox, hx, 0.42); l.tl.y = lerp(oy, hy, 0.42); l.tl.r = l.rT * (0.84 - 0.34 * k);
          // 糸は伸びきったら切れる。届かなくても離れ終わる前には必ず切る（切れずに残った尾が止まった塊になっていた）
          if (Math.hypot(hx - l.tl.x, hy - l.tl.y) > l.rT * 1.35 || k > 0.8) l.tl.on = 0;
        }
        if (l.t >= C.tOut) { l.st = 'float'; l.t = 0; }   // 速度（vx, vy）は直前のコマの動きを引き継ぐ
      } else if (l.st === 'float') {
        this.drift(l, dt);
        if (l.t >= l.hold && !l.mate) {   // くっついている間は帰らない
          l.st = 'back'; l.t = 0; l.rho0 = l.rho;
          // 漂っていた角速度から戻り始める（向きが折れ曲がらない）。角が増える向きの単位ベクトルは (cos a, sin a)
          l.w0 = (l.vx * Math.cos(l.a) + l.vy * Math.sin(l.a)) / (l.rho || 1);
        }
      } else if (l.st === 'back') {
        const k = ease(l.t / C.tBack);
        l.rho = lerp(l.rho0, E + l.rT * 0.25, k);
        l.a += lerp(l.w0 || 0, this.swimW(l) * (1 - 0.5 * k), soft(l.t / 1.2)) * dt;   // 泳ぎながら近づく
        // 後半は塊の縁もかけらの方へふくらんで伸び、迎えに行く
        const rk = soft((k - 0.3) / 0.7);
        l.reachR = l.rT * 0.75 * rk; l.reachRho = E - 4 + l.rT * 0.9 * rk;
        if (l.t >= C.tBack) { l.st = 'melt'; l.t = 0; l.rho0 = l.rho; this.ev.push({ k: 'absorb', a: l.a, r: l.rT }); }
      } else if (l.st === 'melt') {
        const k = soft(l.t / C.melt);
        l.rho = lerp(l.rho0, E - 8, k); l.r = l.rT * (1 - k);
        l.a += this.swimW(l) * dt * 0.5 * (1 - k);   // 溶けながら流れが止まっていく
        l.bulge = l.rT * 0.8 * Math.sin(Math.PI * k);
        l.reachR = l.rT * 0.75 * (1 - k); l.reachRho = E - 4 + l.rT * 0.9 * (1 - 0.6 * k);   // 伸ばした縁も一緒に引いていく
        if (l.t >= C.melt) { l.st = 'gone'; l.reachR = 0; }
      }
      if (l.st !== 'gone') {
        // ふわふわ：かけら自身もゆっくり息をするように大きさが揺れる
        const breathe = l.st === 'float' || l.st === 'back' ? 1 + 0.06 * Math.sin(l.t * 1.4 + l.s) : 1;
        if (l.st !== 'float') [l.x, l.y] = this.P(l.rho, l.a);
        l.rDraw = l.r * breathe;
      }
      // 動く向きへ少し伸びる（後ろに小さな球を引く）
      if (px != null && dt > 0 && l.st !== 'gone') {
        const vx = (l.x - px) / dt, vy = (l.y - py) / dt, sp = Math.hypot(vx, vy);
        if (l.st !== 'float') { l.vx = vx; l.vy = vy; }
        const k = clamp(sp / 9, 0, 1) * (l.st === 'bud' ? 0 : 1);
        l.trail = k > 0.05 ? { x: l.x - vx / sp * l.rT * 0.6 * k, y: l.y - vy / sp * l.rT * 0.6 * k, r: l.rDraw * 0.7 } : null;
      }
      if (l.tl && !l.tl.on) {   // 切れた糸は塊へゆっくり吸い戻る
        const [hx, hy] = this.P(E - 8, l.tl.a);
        l.tl.x += (hx - l.tl.x) * Math.min(1, dt * 1.4); l.tl.y += (hy - l.tl.y) * Math.min(1, dt * 1.4); l.tl.r -= dt * 2.2;
        if (l.tl.r < 0.3) l.tl = null;
      }
      if (l.st === 'gone' && l.tl) l.tl.on = 0;
    }
    this.lobes = this.lobes.filter((l) => l.st !== 'gone' || l.tl);
    this.stepDrops(dt); this.stepBubbles(dt);
  }
  sources(S) {
    const t = this.t, C = this.C;
    let lost = 0;
    for (const l of this.lobes) if (l.st !== 'gone') lost += l.r * l.r;
    const core = Math.sqrt(Math.max(this.core0 * this.core0 * 0.6, this.core0 * this.core0 - lost * 0.5));
    S.push(this.cx, this.cy, core * core);
    for (const w of this.wob) {   // 達成率が上がると、揺れが大きく・速くなる
      const a = w.a + t * w.om * (1 + this.e * 0.4), d = C.wobD + C.wobA * this.amp * Math.sin(t * w.w * (1 + this.e * 0.25) + w.ph), r = C.wobR + 1.6 * Math.sin(t * w.w2 + w.ph * 2);
      const [x, y] = this.P(d, a); S.push(x, y, r * r);
    }
    for (const l of this.lobes) {
      if (l.st !== 'gone' && l.r > 0.2) S.push(l.x, l.y, l.rDraw * l.rDraw);
      if (l.trail && l.st !== 'gone' && l.trail.r > 0.2) S.push(l.trail.x, l.trail.y, l.trail.r * l.trail.r);
      if (l.tl) S.push(l.tl.x, l.tl.y, l.tl.r * l.tl.r);
      if (l.bulge > 0.2 && l.st === 'melt') { const [bx, by] = this.P(this.E - 3, l.a); S.push(bx, by, l.bulge * l.bulge); }   // 以前は使っていない l.a1 を見ていて NaN になっていた
      if (l.reachR > 0.2 && l.st !== 'gone') { const [rx, ry] = this.P(l.reachRho, l.a); S.push(rx, ry, l.reachR * l.reachR); }
    }
    for (const d of this.drops) {
      if (d.r > 0.3) S.push(d.x, d.y, d.r * d.r);
      if (d.reach > 0.3) { const [rx, ry] = this.P(this.E - 3, d.a); S.push(rx, ry, d.reach * d.reach); }   // 迎えに伸びる縁
    }
  }
  heads() {   // ② の光沢を置く場所（塊とかけらの頭）
    const h = [[this.cx, this.cy, this.E * 0.95]];
    for (const l of this.lobes) if (l.st !== 'gone' && l.r > 1.5) h.push([l.x, l.y, l.rDraw]);
    return h;
  }
}

/* ══════════════════════ 中を揺れる光の網（コースティクス） ══════════════════════
   水の底に映る光のように、塊の中に細い光の筋がゆらゆら重なって動く（塊の輪郭で切り抜いた中にだけ描く）。
   % が上がるほど筋が増え（3→8本×2方向）、明るく速くなる。デモの「案2」を採用（2026-09-29・ユーザー判断）。 */
function caustics(c, B, hot) {
  const t = B.t * (0.8 + 0.6 * hot), n = 3 + Math.round(hot * 5);
  c.globalCompositeOperation = 'lighter'; c.lineWidth = 0.8;
  c.translate(B.cx, B.cy);
  for (const [rot, col] of [[t * 0.05, PAL.rim], [t * 0.05 + 1.05, PAL.edgeT]]) {
    c.save(); c.rotate(rot);
    c.strokeStyle = rgba(col, 0.07 + 0.13 * hot);
    for (let k = 0; k < n; k++) {
      const y0 = -34 + k * (68 / Math.max(1, n - 1));
      c.beginPath();
      for (let x = -50; x <= 50; x += 4) {
        const y = y0 + 3.5 * Math.sin(x * 0.09 + t * 0.8 + k * 1.7) + 2.5 * Math.sin(x * 0.15 - t * 0.55 + k);
        x === -50 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
    c.restore();
  }
}

/* ══════════════════════ 外周の弧・目盛り・段の光（デモの SVG を canvas で描く） ══════════════════════
   ⚠️ ハブの .gauge-ring svg には rotate(-90deg) と円形クリップが掛かっているので、弧は SVG に足さず canvas に描く。
   弧 r=74（シアン→バイオレット→マゼンタ・3px）／100% 超は外周 r=80 に同じ配色でもう1本（2px）／目盛りは 25・50・75%。 */
const ARC_R = 74, OVF_R = 80;
function arcGrad(c) {
  const g = c.createLinearGradient(10, 10, 158, 158);
  g.addColorStop(0, '#00F2FE'); g.addColorStop(0.5, '#B04CFF'); g.addColorStop(1, '#FF007F');
  return g;
}
function drawArc(c, G, s) {
  const hot = G.heat / 1.6, b = clamp(G.dv, 0, 100), o = clamp(G.dv - 100, 0, 100), top = -Math.PI / 2;
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 3;
  c.beginPath(); c.arc(84, 84, ARC_R, 0, TAU); c.stroke();
  c.save();
  c.shadowColor = `rgba(255,0,127,${(0.5 + hot * 0.4).toFixed(2)})`; c.shadowBlur = (1.5 + hot * 4.5) * s * 0.65;   // 弧の光も同じ色のまま広がる
  c.strokeStyle = arcGrad(c);
  if (b > 0.05) { c.lineWidth = 3; c.beginPath(); c.arc(84, 84, ARC_R, top, top + b / 100 * TAU); c.stroke(); }
  if (o > 0.05) { c.lineWidth = 2; c.beginPath(); c.arc(84, 84, OVF_R, top, top + o / 100 * TAU); c.stroke(); }
  c.restore();
  c.lineWidth = 1;
  G.ticks.forEach((k, i) => {   // 通過した目盛りは 0.6 秒かけてマゼンタへ
    const a = (i + 1) * 0.25 * TAU, x0 = 84 + 67.5 * Math.sin(a), y0 = 84 - 67.5 * Math.cos(a), x1 = 84 + 70.5 * Math.sin(a), y1 = 84 - 70.5 * Math.cos(a);
    c.strokeStyle = rgba([lerp(255, 255, k), lerp(255, 154, k), lerp(255, 203, k)], lerp(0.28, 1, k));
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  });
  for (const g of G.glows) {   // 段・到達のやわらかい光（デモの .soft：2.6秒で 0.3→1.6 倍に広がって消える）
    const k = (g.t - g.delay) / 2.6; if (k <= 0) continue;
    const e2 = 1 - Math.pow(1 - clamp(k, 0, 1), 3), r = g.r * (0.3 + 1.3 * e2), al = k < 0.25 ? 0.9 * k / 0.25 : 0.9 * (1 - (k - 0.25) / 0.75);
    const gr = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
    gr.addColorStop(0, `rgba(255,182,218,${(0.8 * al).toFixed(3)})`); gr.addColorStop(0.5, `rgba(255,0,127,${(0.25 * al).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,0,127,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(g.x, g.y, r, 0, TAU); c.fill();
  }
}

/* ══════════════════════ ゲージ本体（1枚の canvas） ══════════════════════
   ⚠️ 描くのは html.ui-liquid のときだけ。画面外（IntersectionObserver）・非表示タブでは rAF を止める。
   ⚠️ 省電力 html.mec-lite（iPad・スマホ）では描画を2コマに1回・解像度を 1.5 倍までにする（動きは毎コマ進める）。
   ⚠️ 乱数は種つき（rng(11)）＝開くたびに同じ動きから始まる。 */
const G = { cv: null, goo: null, blob: null, v: 0, dv: 0, tw: null, heat: 0, cd: 0.8, queue: [], glows: [], ticks: [0, 0, 0],
  raf: 0, last: 0, vis: true, flip: 0, started: false };
function isOn() { return document.documentElement.classList.contains('ui-liquid'); }
function isLite() { return document.documentElement.classList.contains('mec-lite'); }
function resize() {
  if (!G.cv) return;
  const r = G.cv.getBoundingClientRect(), d = Math.min(isLite() ? 1.5 : 2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (G.cv.width !== w || G.cv.height !== h) { G.cv.width = w; G.cv.height = h; }
}
// ちぎれ始めるのは一度に1つだけ（ふくらむ〜糸が切れるまでの間は次を出さない）
const tearing = () => G.blob.lobes.some((l) => l.st === 'bud' || l.st === 'out');
const cap = () => CFG.cap(G.dv);
function lobe(a0, o = {}) { if (G.blob.count() >= cap() || tearing()) return false; G.blob.add(Object.assign({ a0 }, o)); return true; }
function glow(x, y, r, delay = 0) { G.glows.push({ x, y, r, delay: delay / 1000, t: 0 }); }
function stage(m) { const a = m / 100 * TAU; G.queue.push({ a0: a, o: { rT: CFG.rT[1] + 1.5, hold: 6 }, glow: [84 + 58 * Math.sin(a), 84 - 58 * Math.cos(a), 14] }); }
function bloom() { glow(84, 84, 46, 400); G.queue = [0, 0.25, 0.5, 0.75].map((q) => ({ a0: q * TAU, o: { hold: 9 } })); }
// 表示の値 dv を目標 v へ伸ばす（デモの go()：1 秒前後の ease-out）。通過した段・100% で演出を積む
function moveTo(dv) {
  const prev = G.dv; G.dv = dv;
  if (dv > prev) {
    [25, 50, 75].forEach((m) => { if (prev < m && dv >= m) stage(m); });
    if (prev < 100 && dv >= 100) bloom();
  }
}
function tick(dt, draw) {
  if (G.tw) {
    G.tw.t += dt;
    const k = Math.min(1, G.tw.t / G.tw.dur), e = 1 - Math.pow(1 - k, 3);
    moveTo(G.tw.from + (G.tw.to - G.tw.from) * e);
    if (k >= 1) G.tw = null;
  }
  // 勢い e：達成率/100 を 1.6 で頭打ち（160%）。色は変えず、動き・光・かけらの数だけがこれで強くなる
  G.heat += (clamp(G.dv / 100, 0, 1.6) - G.heat) * Math.min(1, dt * 0.8);
  G.goo.hot = G.heat / 1.6;
  for (let i = 0; i < 3; i++) G.ticks[i] = clamp(G.ticks[i] + (Math.min(100, G.dv) >= (i + 1) * 25 ? dt : -dt) / 0.6, 0, 1);
  for (const g of G.glows) g.t += dt;
  G.glows = G.glows.filter((g) => g.t - g.delay < 2.6);
  const R = G.blob.R;
  if (G.queue.length) {   // 段・到達のかけらは、前のかけらが離れ終わってから順に出す
    const q = G.queue[0];
    if (G.blob.count() >= cap()) G.queue.length = 0;
    else if (lobe(q.a0, q.o)) { G.queue.shift(); if (q.glow) glow(...q.glow); }
  } else {
    G.cd -= dt * CFG.rate(G.heat);
    if (G.cd <= 0) { lobe(R() * TAU); G.cd = 0.6 + R() * 0.8; }
  }
  G.blob.step(dt, G.heat);
  G.blob.ev.length = 0;
  if (draw) {
    const S = []; G.blob.sources(S);
    G.goo.render(S, G.blob.cx, G.blob.cy, G.blob.heads(), G.blob.bubbles, {
      inside: (c) => caustics(c, G.blob, G.goo.hot),
      over: (c, p, s) => drawArc(c, G, s)
    });
  }
}
function frame(now) {
  G.raf = 0;
  if (!running()) return;
  const dt = Math.min(0.05, Math.max(0, (now - G.last) / 1000)); G.last = now;
  G.flip ^= 1;
  tick(dt, !isLite() || G.flip === 1);
  G.raf = requestAnimationFrame(frame);
}
function running() { return !!G.cv && isOn() && G.vis && !document.hidden; }
function wake() {
  if (running() && !G.raf) { resize(); G.last = performance.now(); G.raf = requestAnimationFrame(frame); }
  else if (!running() && G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; }
}
function mount(cv) {
  if (G.cv || !cv) return;
  G.cv = cv; G.goo = new PathGoo(cv); G.blob = new Blob(11, CFG);
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { G.vis = es.some((e) => e.isIntersecting); wake(); }).observe(cv);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
  new MutationObserver(wake).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });   // テーマの切り替え
  document.addEventListener('visibilitychange', wake);
  wake();
}
// 達成率（%・100 超もそのまま）。同期のたびに同じ値で呼ばれても何もしない。
// 最初の1回は 0% から伸びたものとして扱う（段の演出が出る＝Celestial・Frost と同じ約束）。
function set(v) {
  v = Math.max(0, +v || 0);
  if (G.started && Math.abs(v - G.v) < 0.01) return;
  G.started = true; G.v = v;
  G.tw = { from: G.dv, to: v, t: 0, dur: clamp(Math.abs(v - G.dv) * 0.012, 0.6, 1.6) };
  wake();
}
window.MecLiquidGauge = { mount, set, _t: { G, tick, Blob, CFG, PathGoo, caustics, drawArc } };
})();
