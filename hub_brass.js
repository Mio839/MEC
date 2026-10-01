/* hub_brass.js — ハブのヒーローゲージ（UIテーマ Brass）
   2026-10-01 新設。見比べたデモから採用したものを移した：
     _work/gauge_brass_demo.html        案5「蒸気機関」（外周の円＝進捗の弧は外す）
     _work/gauge_brass_steam_demo.html  第2版 A「噛み合いの火花」（量はデモの半分）
     _work/gauge_brass_steam_demo2.html C「奥行きの歯車群」

   中央の大歯車（36枚）が読み値を囲み、四隅の小歯車と噛み合う。左下の小歯車のクランクが連接棒でピストンを往復させ、
   往復の折り返しで排気弁から蒸気を吐く。噛み合い点から回転の向きへ火花が飛び、奥では大きな歯車の影がゆっくり回る。
   ⚠️ 回転数は達成率から連続的に決める（段 data-tier で切り替えない）。中心の歯車の周期は 0%=37.5秒 → 100%≈8.4秒 → 200%≈1.9秒。
      目標の回転数へは慣性で寄せる（時定数 0.9 秒）。角度は rAF で積分する（CSS の animation-duration を書き換えると位相が飛ぶ）。
   ⚠️ 歯は本当に噛み合う：子の角度 = -(親の歯数/子の歯数)×(親の角度 - θ) + θ + π + π/子の歯数（θ は親→子の向き）。
      歯車の座標・歯数・モジュールを変えたら mesh() が位相を作り直すので、座標は at() で「噛み合う距離」に置くこと。
   ⚠️ 外周の円（進捗の弧・真鍮の輪・週のビーズ）は置かない（ユーザー判断）。進み具合は中央の数字と回転の速さで読む。
   ⚠️ 火花・衝撃の輪は盤の外へはみ出してよい（ユーザー判断）。そのため svg は .gauge-ring の直下に置き、
      .gauge-ring svg の rotate(-90deg) と円形クリップを受けない（index.css の .brass-engine）。
   ⚠️ 25/50/75/100/150/200% を上向きにまたいだ瞬間だけ、火花が一斉に噴き衝撃の輪が走り、奥の歯車が「ガコン」と送られる。
   ⚠️ 描くのは html.ui-brass のときだけ。画面外・非表示タブでは rAF を止める。省電力 html.mec-lite では描画を2コマに1回・粒の上限を半分。
   ⚠️ 乱数は種つき（rng）＝開くたびに同じ動きから始まる。
   index.js の _driveThemeGauge が MecBrassGauge.mount / set(pct) を呼ぶだけ。svg は index.html の #gaugeBrassEngine。
   テスト: node _work/test_hub_brass.js */
(function () {
'use strict';
const TAU = Math.PI * 2, PI = Math.PI, DEG = 180 / PI, C = 84;   // 盤面の中心（viewBox 168）
const SVGNS = 'http://www.w3.org/2000/svg';
const ID = 'mbg';   // グラデーション等の id の接頭辞（ページ内で一意）
const MARKS = [25, 50, 75, 100, 150, 200];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (cur, tgt, dt, tau) => cur + (tgt - cur) * (1 - Math.exp(-dt / tau));
const f2 = (v) => Math.round(v * 100) / 100;
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let R = rng(17);
const rnd = (a, b) => a + R() * (b - a);

// ⚠️ fill / stroke は style に書く：index.css の .gauge-ring circle{fill:none} が属性の fill を上書きするため
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) {
    if (k === 'fill' || k === 'stroke') e.style[k] = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function circ(r, x, y) { x = x || 0; y = y || 0;
  return `M${f2(x + r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(x - r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(x + r)} ${f2(y)}Z`; }
// 歯の輪郭。歯は局所角 0 を中心に並ぶ（mesh() の位相計算の前提）。歯先 r+m・歯底 r-1.25m
function teeth(N, m) {
  const r = m * N / 2, pa = TAU / N, rt = r + m, rr = r - 1.25 * m, P = [];
  for (let i = 0; i < N; i++) { const a = i * pa;
    P.push([rr, a - 0.5 * pa], [rr, a - 0.34 * pa], [rt, a - 0.16 * pa], [rt, a + 0.16 * pa], [rr, a + 0.34 * pa]); }
  return 'M' + P.map(([q, a]) => f2(q * Math.cos(a)) + ' ' + f2(q * Math.sin(a))).join('L') + 'Z';
}
function defs(svg) {
  const d = el('defs', {}, svg);
  // ⚠️ 照りは中心対称にする（回る歯車に片寄った照りを付けると、光源ごと回って見える）
  const rg = (name, stops) => { const g = el('radialGradient', {id: ID + name, cx: '50%', cy: '50%', r: '50%'}, d);
    stops.forEach(([o, c, op]) => el('stop', {offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op}, g)); };
  rg('br', [['0', '#F6E3A0'], ['.55', '#E0C25E'], ['.84', '#C9A227'], ['1', '#7E5A18']]);
  rg('cu', [['0', '#F2C08E'], ['.55', '#D08A4A'], ['.84', '#B87333'], ['1', '#6A3A14']]);
  rg('puff', [['0', '#efe9dc', .85], ['1', '#efe9dc', 0]]);
  rg('hot', [['0', '#FFF6D8', 1], ['.3', '#FFC24A', .8], ['1', '#FF5A1F', 0]]);
  rg('sil', [['0', '#3a2a14', .9], ['.8', '#2a1d0d', .9], ['1', '#6b4c1c', .9]]);
  rg('fade', [['0', '#fff'], ['.62', '#fff'], ['1', '#000']]);
  // 奥の層は盤の中ほどだけに見せ、外へ向かってぼかして消す（⚠️ 外周に円の縁を作らない）
  const mk = el('mask', {id: ID + 'win', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 168, height: 168}, d);
  el('circle', {cx: C, cy: C, r: 86, fill: `url(#${ID}fade)`}, mk);
}
// 歯車1枚。角度 = k×Φ + c（Φ は大歯車の角度）
function gear(parent, o) {
  const g = el('g', {}, parent), r = o.m * o.N / 2;
  let d = teeth(o.N, o.m);
  d += o.hole ? circ(o.hole) : circ(Math.max(1.4, o.m * .55));
  if (o.holes) { const rr = r - 1.25 * o.m, hub = Math.max(2.6, o.m * 1.1), hr = (rr - hub) * .34, hm = (rr + hub) / 2;
    for (let i = 0; i < o.holes; i++) { const a = i * TAU / o.holes + PI / o.holes; d += circ(hr, hm * Math.cos(a), hm * Math.sin(a)); } }
  const path = el('path', {d, 'fill-rule': 'evenodd', fill: `url(#${ID}${o.mat || 'br'})`, stroke: '#2e1f07', 'stroke-width': '.6'}, g);
  if (o.rivets) for (let i = 0; i < o.rivets.n; i++) { const a = i * TAU / o.rivets.n;
    el('circle', {cx: f2(o.rivets.r * Math.cos(a)), cy: f2(o.rivets.r * Math.sin(a)), r: '1.05', fill: '#5a3f12', stroke: '#F2D88A', 'stroke-width': '.35'}, g); }
  return {g, path, N: o.N, m: o.m, r, x: o.x, y: o.y, k: o.k || 0, c: o.c || 0, ang: 0,
    set(a) { this.ang = a; this.g.setAttribute('transform', `translate(${f2(this.x)} ${f2(this.y)}) rotate(${f2(a * DEG)})`); },
    drive(Phi) { this.set(this.k * Phi + this.c); }};
}
// B を A の向き th に、歯が噛み合う距離で置く
function at(A, N, m, th) { const d = A.r + m * N / 2; return {x: A.x + d * Math.cos(th), y: A.y + d * Math.sin(th)}; }
function mesh(A, B) { const th = Math.atan2(B.y - A.y, B.x - A.x), q = A.N / B.N; B.k = -A.k * q; B.c = -q * A.c + q * th + th + PI + PI / B.N; }
// 中心の歯車の周期（秒/周）。0%=37.5秒 → 100%≈8.4秒 → 200%≈1.9秒
const period = (p) => 60 * Math.pow(20, -clamp(p, 0, 2) / 2) / 1.6;
const kOf = (p) => clamp(p / 1.5, 0, 1.33);   // 演出の強さ（100% で 0.75、150% で 1）

// 節目の衝撃の輪
function shock(parent, color, from, to, life, w) {
  const c = el('circle', {cx: C, cy: C, r: from, fill: 'none', stroke: color, 'stroke-width': w}, parent);
  return {t: 0, step(dt) { this.t += dt; const k = Math.min(1, this.t / life), e = 1 - Math.pow(1 - k, 3);
    c.setAttribute('r', f2(from + (to - from) * e)); c.setAttribute('stroke-width', f2(w * (1 - k) + .3)); c.setAttribute('opacity', f2(1 - k));
    if (k >= 1) { c.remove(); return false; } return true; }};
}
function runList(list, dt) { for (let i = list.length - 1; i >= 0; i--) if (!list[i].step(dt)) list.splice(i, 1); }

/* ══════════════ 組み立て ══════════════ */
function build(svg) {
  defs(svg);
  const back = el('g', {}, svg), body = el('g', {}, svg), front = el('g', {}, svg);

  // ── 奥行きの歯車群（奥でゆっくり噛み合って回る大きな歯車の影） ──
  const deep = el('g', {mask: `url(#${ID}win)`}, back);
  const mkDeep = (N, m, x, y, op) => { const g = gear(deep, {N, m, x, y, hole: m * N / 2 * .35, mat: 'sil'}); g.g.setAttribute('opacity', op);
    const rim = g.path.cloneNode(); rim.style.fill = 'none'; rim.style.stroke = '#FFC24A'; rim.setAttribute('stroke-width', '.9'); rim.setAttribute('opacity', 0); g.g.appendChild(rim); g.rim = rim; return g; };
  const d1 = mkDeep(30, 4.4, 18, 140, .9);
  const p2 = at(d1, 20, 4.4, -62 / DEG), d2 = mkDeep(20, 4.4, p2.x, p2.y, .75);
  const p3 = at(d2, 14, 4.4, -18 / DEG), d3 = mkDeep(14, 4.4, p3.x, p3.y, .6);
  d1.k = 1; mesh(d1, d2); mesh(d2, d3);
  const d4 = mkDeep(26, 3, 150, 22, .5); d4.k = -1;
  const deepAll = [d1, d2, d3, d4];
  el('circle', {cx: C, cy: C, r: 38.6, fill: '#140e07'}, back);   // 読み値の後ろは暗く（奥の歯車を数字に透かさない）
  const motes = el('g', {mask: `url(#${ID}win)`}, back), dust = [];
  for (let i = 0; i < 16; i++) dust.push({x: rnd(0, 168), y: rnd(0, 168), v: rnd(2, 6), r: rnd(.5, 1.2), n: el('circle', {r: 1, fill: '#FFD27A'}, motes)});

  // ── 蒸気機関 ──
  const cylX = 76, cylY = 140, cylW = 36, cylH = 12;
  el('rect', {x: cylX, y: cylY, width: cylW, height: cylH, rx: 2.5, fill: `url(#${ID}cu)`, stroke: '#2e1f07', 'stroke-width': '.6'}, body);
  for (let i = 1; i < 4; i++) el('line', {x1: cylX + i * 9, y1: cylY, x2: cylX + i * 9, y2: cylY + cylH, stroke: 'rgba(46,31,7,.55)', 'stroke-width': '.7'}, body);
  el('circle', {cx: cylX + cylW, cy: cylY + 2, r: 2.2, fill: `url(#${ID}br)`, stroke: '#2e1f07', 'stroke-width': '.5'}, body);
  const exhaustG = el('g', {}, body), exhaust = [];
  const ring = gear(body, {N: 36, m: 2.5, x: C, y: C, hole: 38, k: 1, rivets: {n: 9, r: 40}});
  const others = [[225, 8, 'cu'], [315, 10, 'br'], [45, 8, 'cu']].map(([deg, N, mat]) => { const p = at(ring, N, 2.5, deg / DEG);
    const g = gear(body, {N, m: 2.5, x: p.x, y: p.y, holes: N === 10 ? 4 : 3, mat}); mesh(ring, g); return g; });
  const dp = at(ring, 10, 2.5, 135 / DEG);
  const drv = gear(body, {N: 10, m: 2.5, x: dp.x, y: dp.y, mat: 'br'}); mesh(ring, drv);
  el('circle', {cx: f2(drv.x), cy: f2(drv.y), r: 9, fill: 'rgba(90,63,18,.95)', stroke: '#F2D88A', 'stroke-width': '.5'}, body);
  const rod = el('line', {stroke: '#E0C25E', 'stroke-width': '2.2', 'stroke-linecap': 'round'}, body);
  const prod = el('line', {stroke: '#BDB6A6', 'stroke-width': '1.6'}, body);
  const head = el('rect', {width: 4, height: cylH - 3, y: cylY + 1.5, rx: 1, fill: '#e8dcc0', stroke: '#2e1f07', 'stroke-width': '.4'}, body);
  const pinDot = el('circle', {r: 2, fill: '#F2D88A', stroke: '#2e1f07', 'stroke-width': '.5'}, body);
  const xhead = el('rect', {width: 6, height: 5, y: 146 - 2.5, rx: 1, fill: `url(#${ID}br)`, stroke: '#2e1f07', 'stroke-width': '.5'}, body);
  const all = [ring, ...others, drv], pinions = [others[0], others[1], others[2], drv];

  // ── 噛み合いの火花（大歯車と小歯車の噛み合い点4つ） ──
  const contacts = pinions.map((g) => { const th = Math.atan2(g.y - C, g.x - C); return {th, x: C + ring.r * Math.cos(th), y: C + ring.r * Math.sin(th)}; });
  const glows = contacts.map((cp) => el('circle', {cx: f2(cp.x), cy: f2(cp.y), r: 11, fill: `url(#${ID}hot)`, opacity: 0}, front));
  const sparkG = el('g', {style: 'mix-blend-mode:screen'}, front), sparks = [], waves = [];
  return {svg, ring, pinions, all, deepAll, dust, exhaustG, exhaust, rod, prod, head, pinDot, xhead, cylX, cylY, cylW, cylH,
    contacts, glows, sparkG, sparks, waves, front};
}

/* ══════════════ 1コマ進める ══════════════ */
const S = { cv: null, M: null, v: 0, dv: 0, tw: null, prev: null, w: -1, Phi: 0, lastHalf: null, sAcc: 0, deepPhi: 0, clunk: 0, t: 0,
  raf: 0, last: 0, vis: true, flip: 0, acc: 0, started: false };
const isOn = () => document.documentElement.classList.contains('ui-brass');
const isLite = () => document.documentElement.classList.contains('mec-lite');

function step(dt, draw) {
  const M = S.M;
  if (S.tw) { S.tw.t += dt; const k = Math.min(1, S.tw.t / S.tw.dur), e = 1 - Math.pow(1 - k, 3);
    S.dv = S.tw.from + (S.tw.to - S.tw.from) * e; if (k >= 1) S.tw = null; }
  const pct = S.dv, p = pct / 100, k = kOf(p), lite = isLite();
  let mark = 0;   // 節目を上向きにまたいだ瞬間だけ入る
  if (S.prev !== null && pct > S.prev) mark = MARKS.filter((x) => S.prev < x && pct >= x).pop() || 0;
  S.prev = pct; S.t += dt;

  // 回転（慣性つき）
  const tw = TAU / period(p);
  if (S.w < 0) S.w = tw;
  S.w = ease(S.w, tw, dt, .9); S.Phi += S.w * dt;
  M.all.forEach((g) => g.drive(S.Phi));

  // クランク → 連接棒 → ピストン
  const drv = M.pinions[3], ph = drv.ang, pin = {x: drv.x + 7 * Math.cos(ph), y: drv.y + 7 * Math.sin(ph)};
  const dy = 146 - pin.y, xh = pin.x + Math.sqrt(Math.max(0, 36 * 36 - dy * dy)), hx = Math.min(M.cylX + M.cylW - 5, xh + 14);
  if (draw) {
    M.rod.setAttribute('x1', f2(pin.x)); M.rod.setAttribute('y1', f2(pin.y)); M.rod.setAttribute('x2', f2(xh)); M.rod.setAttribute('y2', 146);
    M.xhead.setAttribute('x', f2(xh - 3));
    M.prod.setAttribute('x1', f2(xh)); M.prod.setAttribute('y1', 146); M.prod.setAttribute('x2', f2(hx)); M.prod.setAttribute('y2', 146);
    M.head.setAttribute('x', f2(hx));
    M.pinDot.setAttribute('cx', f2(pin.x)); M.pinDot.setAttribute('cy', f2(pin.y));
  }
  // 行程の折り返し（半回転ごと）で排気弁から蒸気を吐く
  const half = Math.floor(ph / PI), stroke = S.lastHalf !== null && half !== S.lastHalf; S.lastHalf = half;
  const big = clamp(p - .6, 0, 1);
  if (stroke && M.exhaust.length < (lite ? 7 : 14))
    M.exhaust.push({x: M.cylX + M.cylW, y: M.cylY + 1, vx: rnd(9, 15), vy: rnd(3, 8), t: 0, life: 1.1 + big * .6, big, n: el('circle', {r: 2, fill: `url(#${ID}puff)`}, M.exhaustG)});
  for (let i = M.exhaust.length - 1; i >= 0; i--) { const q = M.exhaust[i]; q.t += dt; const a = q.t / q.life;
    if (a >= 1) { q.n.remove(); M.exhaust.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (draw) { q.n.setAttribute('cx', f2(q.x)); q.n.setAttribute('cy', f2(q.y)); q.n.setAttribute('r', f2(2 + a * (6 + q.big * 5))); q.n.setAttribute('opacity', f2((1 - a) * (.55 + q.big * .35))); } }

  // 噛み合いの火花（2026-10-01 にデモの半分へ）
  const cap = lite ? 22 : 45, dir = S.w >= 0 ? 1 : -1;
  const spark = (x, y, vx, vy, life) => { if (M.sparks.length >= cap) return; M.sparks.push({x, y, vx, vy, t: 0, life, n: el('line', {'stroke-linecap': 'round'}, M.sparkG)}); };
  S.sAcc += dt * (1.5 + 23 * Math.pow(k, 1.6)) * M.contacts.length * (lite ? .5 : 1);
  while (S.sAcc >= 1) { S.sAcc -= 1; const cp = M.contacts[(R() * M.contacts.length) | 0];
    const tx = -Math.sin(cp.th) * dir, ty = Math.cos(cp.th) * dir, a = rnd(-.5, .5), sp0 = rnd(50, 90) + 120 * k;
    spark(cp.x, cp.y, (tx * Math.cos(a) - ty * Math.sin(a)) * sp0 + Math.cos(cp.th) * 25, (tx * Math.sin(a) + ty * Math.cos(a)) * sp0 + Math.sin(cp.th) * 25 - 20, rnd(.3, .55) + .35 * k); }
  if (mark) {
    M.contacts.forEach((cp) => { for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), v = rnd(80, 190); spark(cp.x, cp.y, Math.cos(a) * v, Math.sin(a) * v - 40, rnd(.5, 1)); } });
    M.waves.push(shock(M.front, '#FFC24A', 46, 92, .7, 4));
    S.clunk = 1;
  }
  for (let i = M.sparks.length - 1; i >= 0; i--) { const q = M.sparks[i]; q.t += dt; const a = q.t / q.life;
    if (a >= 1) { q.n.remove(); M.sparks.splice(i, 1); continue; }
    q.vy += 220 * dt; q.vx *= Math.exp(-1.2 * dt); q.x += q.vx * dt; q.y += q.vy * dt;
    if (draw) { q.n.setAttribute('x1', f2(q.x)); q.n.setAttribute('y1', f2(q.y)); q.n.setAttribute('x2', f2(q.x - q.vx * .035)); q.n.setAttribute('y2', f2(q.y - q.vy * .035));
      q.n.style.stroke = a < .25 ? '#FFFBE8' : a < .55 ? '#FFC24A' : '#FF5A1F';
      q.n.setAttribute('stroke-width', f2(1.5 * (1 - a) + .4)); q.n.setAttribute('opacity', f2(1 - a * a)); } }
  runList(M.waves, dt);
  if (draw) M.glows.forEach((g, i) => g.setAttribute('opacity', f2(clamp(.25 + .9 * k, 0, 1) * (.7 + .3 * Math.sin(S.Phi * 40 + i * 2)))));

  // 奥行きの歯車群：機関の 1/4 の速さで回り、節目では「ガコン」と送られる
  S.clunk = Math.max(0, S.clunk - dt * 2.5);
  S.deepPhi += S.w * .25 * dt + (S.clunk > 0 ? dt * 3 * S.clunk : 0);
  if (draw) {
    M.deepAll.forEach((g) => { g.drive(S.deepPhi); g.rim.setAttribute('opacity', f2(clamp(.1 + .7 * k + S.clunk * .6, 0, 1) * (.8 + .2 * Math.sin(S.t * 3 + g.x)))); });
    M.dust.forEach((q) => { q.y -= q.v * (1 + 2 * k) * dt * 2; if (q.y < -4) { q.y = 172; q.x = rnd(0, 168); }
      q.n.setAttribute('cx', f2(q.x + Math.sin(S.t + q.r * 9) * 2)); q.n.setAttribute('cy', f2(q.y)); q.n.setAttribute('r', f2(q.r));
      q.n.setAttribute('opacity', f2(clamp(.15 + .6 * k, 0, .8) * (.5 + .5 * Math.sin(S.t * 2 + q.x)))); });
  }
  return {pct, mark, stroke};
}

/* ══════════════ rAF・表示の出し入れ ══════════════ */
function frame(now) {
  S.raf = 0;
  if (!running()) return;
  const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
  // 省電力では2コマに1回だけ描く（動きは毎コマ進めるが、描かないコマは属性を書かない）
  S.flip ^= 1;
  if (isLite() && S.flip) { S.acc += dt; } else { step(dt + S.acc, true); S.acc = 0; }
  S.raf = requestAnimationFrame(frame);
}
function running() { return !!S.cv && isOn() && S.vis && !document.hidden; }
function wake() {
  if (running() && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
  else if (!running() && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
}
function mount(svg) {
  if (S.cv || !svg) return;
  S.cv = svg; R = rng(17); S.M = build(svg);
  step(0, true);   // 最初の1コマ（rAF が来る前でも盤面が空にならない）
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { S.vis = es.some((e) => e.isIntersecting); wake(); }).observe(svg);
  new MutationObserver(wake).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });   // テーマの切り替え
  document.addEventListener('visibilitychange', wake);
  wake();
}
// 達成率（%・100 超もそのまま）。同期のたびに同じ値で呼ばれても何もしない。
// 最初の1回は 0% から伸びたものとして扱う（節目の火花が出る＝Liquid・Celestial・Frost と同じ約束）。
function set(v) {
  v = Math.max(0, +v || 0);
  if (S.started && Math.abs(v - S.v) < 0.01) return;
  S.started = true; S.v = v;
  S.tw = { from: S.dv, to: v, t: 0, dur: clamp(Math.abs(v - S.dv) * 0.012, 0.6, 1.6) };
  wake();
}
window.MecBrassGauge = { mount, set, _t: { S, step, build, period, mesh, at, teeth, MARKS } };
})();
