/* Liquid の正解演出の新しい案（デモページ専用）。
   _work/fx_all_demo.html が枠（study.html）の中へ <script> で差し込み、_lqLiquidFx を一時的に差し替えて
   本物の _rfCorrectFx から呼ぶ＝送りの時間・連続数・段の判定は実物と同じ。
   study.html からは読まれない（本番には入っていない）。採用が決まったら study_exam.js へ移す。
   第1弾（2026-09-28）：K 窓ガラスの雫・L 水銀・M シャボン玉・N 満ちる・O 渦 → M だけ採用（本番の _lqSoapFx）。
   第2弾（2026-09-28）：P 噴水・Q 炭酸・R 霧の虹・S 水中の光・T 金魚 → 全部不採用。
   第3弾（2026-09-28・このファイル）：U〜AD の10案。水の「物」を描く案が続けて外れたので、抽象・グラフィックの方向へ振った。
   → U ガラスの衝撃波と AD ぷるんを採用（シャボン玉と3つ重ねて本番の _lqLiquidFx）。ここに残っているのは残りの8案。
   構造は実物と同じ2層:
     ① 肢の層（_lqLayer＝文字の裏）…… _rfFit で送り（403ms）の 50ms 手前までに縮めて終える
     ② 全画面の層（_rfFullHost）……… ラボの尺のまま（_rfK = 1）最後まで。カードが送られても画面に残る
   使っている本物の部品: _lqLayer / _lqDrop / _lqPtr / _rfFit / _rfFullHost / _frCtx / _fxOff / _rfK */
(() => {
  const P = window.__LQP = {};
  const R = (a, b) => a + Math.random() * (b - a);
  const C = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const EO = t => 1 - Math.pow(1 - t, 3);
  const EIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const BACK = t => { const s = 1.9; t = t - 1; return t * t * ((s + 1) * t + s) + 1; };   // 行き過ぎて戻る
  const SS = (a, b, x) => { const t = C((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const PAL = ['#FF007F', '#B03CFF', '#FF7A00', '#2FE0D5'];
  const IRI = ['#ff6ec7', '#ffd36e', '#6effc0', '#6ecbff', '#b66eff', '#ff6ec7'];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const PALRGB = PAL.map(hex);
  const palAt = u => {   // 0..1 で4色を巡る
    u = ((u % 1) + 1) % 1; const f = u * 4, i = Math.floor(f) % 4, k = f - Math.floor(f), a = PALRGB[i], b = PALRGB[(i + 1) % 4];
    return `rgb(${a[0] + (b[0] - a[0]) * k | 0},${a[1] + (b[1] - a[1]) * k | 0},${a[2] + (b[2] - a[2]) * k | 0})`;
  };

  function org(el) {
    const er = el.getBoundingClientRect();
    let ox = er.width / 2, oy = er.height / 2;
    const pt = _lqPtr;
    if (pt && pt.el === el && performance.now() - pt.t < 2000) { ox = er.width * pt.fx; oy = er.height * pt.fy; }
    return { er, ox, oy, cx: er.left + ox, cy: er.top + oy };
  }
  function run(c, dur, draw) {
    const t0 = performance.now(), k = _rfK, cv = c.canvas;
    const wipe = () => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.restore(); };
    let last = 0;
    (function f(now) {
      if (!cv.isConnected) return;
      const e = (now - t0) / k, dt = Math.min(.05, (e - last) / 1000); last = e;
      wipe();
      if (e < dur) { c.save(); draw(c, e, dt); c.restore(); requestAnimationFrame(f); }
    })(t0);
  }
  function choiceLayer(el, budget, nominal, draw) {
    const k = _rfFit(budget, nominal);
    const L = _lqLayer(el);
    const w = el.clientWidth, h = el.clientHeight;
    const c = _frCtx(L, w, h, 0, 2);
    run(c, nominal, (c, e, dt) => draw(c, e, w, h, dt));
    _lqDrop(el, L, nominal);
    return k;
  }
  function fullLayer(ms) {
    _rfK = 1;
    const H = _rfFullHost(ms);
    const VW = window.innerWidth, VH = window.innerHeight;
    return { H, c: _frCtx(H, VW, VH, 0, 1.5), VW, VH };
  }
  const hdrBottom = () => { const h = document.querySelector('.st-hdr'); return h ? Math.max(0, h.getBoundingClientRect().bottom) : 0; };
  const iri = (c, x, y, rot, fb) => {
    if (!c.createConicGradient) return fb;
    const g = c.createConicGradient(rot, x, y); IRI.forEach((col, i) => g.addColorStop(i / (IRI.length - 1), col)); return g;
  };
  function glint(c, x, y, s, a) {
    if (a <= 0 || s <= 0) return;
    c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y);
    c.fillStyle = '#fff';
    for (const [w, h] of [[s * .14, s * 2], [s * 2, s * .14]]) { c.beginPath(); c.moveTo(0, -h); c.lineTo(w, 0); c.lineTo(0, h); c.lineTo(-w, 0); c.closePath(); c.fill(); }
    c.restore();
  }
  /* つやのある液体の玉（Z・AD で使う） */
  function ball(c, x, y, r, sx, sy, a) {
    if (r < .5 || a <= 0) return;
    c.save(); c.translate(x, y); c.scale(sx, sy); c.globalAlpha = a;
    const g = c.createRadialGradient(-r * .35, -r * .4, r * .05, 0, 0, r);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(.25, '#FF7CC0'); g.addColorStop(.65, '#FF007F'); g.addColorStop(1, '#6A1FB8');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(47,224,213,.7)'; c.lineWidth = Math.max(1, r * .12); c.beginPath(); c.arc(0, 0, r * .9, .35, Math.PI - .35); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-r * .35, -r * .45, r * .28, r * .14, -.5, 0, 7); c.fill();
    c.restore();
  }

  /* ══════════ V 液体の○（LIQUID MARU）══════════
     肢：タップ位置に小さな○がすっと描かれる。
     全画面：タップ位置に、太い液体の筆で大きな「○」が一筆で描かれ、下半分から絵の具が垂れる。
     筆の色はマゼンタ→紫→オレンジ→シアンへ流れ、筆の中に白いつやが走る。段で○が大きくなって垂れが増え、
     段が上がった瞬間は「◎」（内側にもう一つ）と飛び散り。 */
  P.V = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 650, (c, e, w, h) => {
      const p = EO(C(e / 320)), a = 1 - SS(420, 650, e), r = h * .38;
      c.globalAlpha = a; c.lineCap = 'round'; c.lineWidth = 3.5; c.strokeStyle = '#FF4FA3';
      c.beginPath(); c.arc(o.ox, o.oy, r, -2.2, -2.2 + Math.PI * 2.05 * p); c.stroke();
    });
    if (!card) return;
    const DUR = 2700 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH, top = hdrBottom();
    const Rc = Math.min(VW, VH) * .19 * (1 + t * .05) * (up ? 1.2 : 1);
    const X = C(o.cx, Rc + 20, VW - Rc - 20), Y = C(o.cy, top + Rc + 20, VH - Rc - 20);
    const W = 14 + t * 2 + (up ? 6 : 0);
    const rings = [{ R: Rc, t0: 0, a0: -2.2 }];
    if (up) rings.push({ R: Rc * .6, t0: 380, a0: -2.5 });
    const drips = [];
    rings.forEach(rg => { for (let i = 0; i < 3 + t + (up ? 3 : 0); i++) { const a = R(.15, .85) * Math.PI; drips.push({ rg, a, L: R(25, 70) * (1 + t * .08), w: R(.35, .6), t0: rg.t0 + 380 + R(0, 350) }); } });
    const splat = up ? Array.from({ length: 26 }, () => ({ a: R(0, 7), d: R(1.15, 1.7), r: R(2, 7), col: PAL[(Math.random() * 4) | 0] })) : [];
    run(F.c, DUR, (c, e) => {
      const fade = 1 - SS(DUR - 600, DUR, e);
      c.globalAlpha = fade; c.lineCap = 'round';
      rings.forEach(rg => {
        const p = EO(C((e - rg.t0) / 520)); if (p <= 0) return;
        const span = Math.PI * 2.06 * p, N = Math.max(2, Math.ceil(span / .05));
        for (let i = 0; i < N; i++) {   // 太さは筆の入りと抜きで細く、色は弧に沿って流れる
          const s0 = i / N, s1 = (i + 1) / N, u = s0 * p;
          c.strokeStyle = palAt(u * .9 + .02); c.lineWidth = W * (.35 + .65 * Math.sin(Math.PI * Math.min(1, .15 + u * .95)));
          c.beginPath(); c.arc(X, Y, rg.R, rg.a0 + span * s0, rg.a0 + span * s1 + .01); c.stroke();
        }
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1.5, W * .14);
        c.beginPath(); c.arc(X, Y, rg.R - W * .18, rg.a0 + .3, rg.a0 + .3 + span * .55); c.stroke();
      });
      drips.forEach(d => {
        const p = EO(C((e - d.t0) / 900)); if (p <= 0) return;
        const x = X + Math.cos(d.a) * d.rg.R, y = Y + Math.sin(d.a) * d.rg.R, w = W * d.w, L = d.L * p;
        c.fillStyle = palAt((d.a / Math.PI) * .5 + .3);
        c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w * .35, y + L); c.arc(x, y + L, w * .5, Math.PI, 0, true); c.lineTo(x + w / 2, y); c.fill();
        c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x - w * .25, y, Math.max(1, w * .12), L * .8);
      });
      splat.forEach(s => { const p = EO(C((e - 450) / 300)); if (p <= 0) return; c.fillStyle = s.col; c.beginPath(); c.arc(X + Math.cos(s.a) * Rc * s.d * p, Y + Math.sin(s.a) * Rc * s.d * p, s.r, 0, 7); c.fill(); });
    });
  };

  /* ══════════ W 垂れる絵の具（PAINT DRIP）══════════
     肢：文字の裏を絵の具が左から塗り、下の縁から小さく垂れる。
     全画面：ヘッダーの下の縁から4色の絵の具がとろりと垂れてきて、つやを光らせながら伸び、消える。
     段で垂れの本数と長さが増え、段が上がった瞬間は画面の半分まで一斉に垂れる。 */
  P.W = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const cd = Array.from({ length: 6 }, (_, i) => ({ x: R(.05, .95), L: R(4, 10), w: R(4, 8), col: PAL[i % 4] }));
    choiceLayer(el, budget, 700, (c, e, w, h) => {
      const p = EO(C(e / 280)), a = 1 - SS(470, 700, e);
      c.globalAlpha = .55 * a;
      const g = c.createLinearGradient(0, 0, w, 0); PAL.forEach((col, i) => g.addColorStop(i / 3, col));
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * p, 0);
      for (let y = 0; y <= h; y += 4) c.lineTo(w * p + Math.sin(y * .4 + e * .02) * 5, y);
      c.lineTo(0, h); c.fill();
      cd.forEach(d => { if (d.x > p) return; const L = d.L * EO(C((e - 150) / 300)); c.fillStyle = d.col; c.fillRect(d.x * w - d.w / 2, h - 3, d.w, L); c.beginPath(); c.arc(d.x * w, h - 3 + L, d.w * .6, 0, 7); c.fill(); });
    });
    if (!card) return;
    const DUR = 2700 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH, top = hdrBottom();
    const n = up ? 34 : 8 + t * 3;
    const drips = Array.from({ length: n }, (_, i) => ({ x: R(0, VW), w: R(8, 24), L: R(.12, .4) * (VH - top) * (up ? 1.5 : .7 + t * .06), t0: R(0, 500), col: PAL[i % 4], sp: R(900, 1500) }));
    run(F.c, DUR, (c, e) => {
      const fade = 1 - SS(DUR - 600, DUR, e);
      c.globalAlpha = fade;
      // 上の縁に溜まる帯
      const hb = (8 + t * 2) * EO(C(e / 300));
      const g = c.createLinearGradient(0, 0, VW, 0); PAL.forEach((col, i) => g.addColorStop(i / 3, col));
      c.fillStyle = g; c.beginPath(); c.moveTo(0, top);
      for (let x = 0; x <= VW; x += 12) c.lineTo(x, top + hb + Math.sin(x * .03 + e * .003) * hb * .35);
      c.lineTo(VW, top); c.fill();
      drips.forEach(d => {
        const p = EO(C((e - d.t0) / d.sp)); if (p <= 0) return;
        const L = d.L * p, y0 = top + hb * .5, w = d.w;
        const gg = c.createLinearGradient(0, y0, 0, y0 + L); gg.addColorStop(0, d.col); gg.addColorStop(1, palAt(PAL.indexOf(d.col) / 4 + .2));
        c.fillStyle = gg;
        c.beginPath(); c.moveTo(d.x - w / 2, y0); c.bezierCurveTo(d.x - w / 2, y0 + L * .5, d.x - w * .32, y0 + L * .8, d.x - w * .32, y0 + L);
        c.arc(d.x, y0 + L, w * .5, Math.PI, 0, true); c.bezierCurveTo(d.x + w * .32, y0 + L * .8, d.x + w / 2, y0 + L * .5, d.x + w / 2, y0); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(d.x - w * .28, y0, Math.max(1.2, w * .13), L * .85);
        c.beginPath(); c.arc(d.x - w * .18, y0 + L - w * .12, w * .12, 0, 7); c.fill();
      });
    });
  };

  /* ══════════ X 液体の額縁（LIQUID FRAME）══════════
     肢：肢の縁の内側が液体のように波打って光る。
     全画面：画面の四辺から液体がうねりながら内側へ満ちて額縁になり、波打ってから引いていく（内側の縁に白いつや）。
     段で額縁が厚くなり、段が上がった瞬間は波が速く大きくなって、上の縁から垂れる。 */
  function frame(c, x0, y0, W, H, base, e, sp, amp) {
    const pts = [];
    const per = 2 * (W + H), step = 10;
    for (let s = 0; s < per; s += step) {
      let x, y, nx, ny;
      if (s < W) { x = x0 + s; y = y0; nx = 0; ny = 1; }
      else if (s < W + H) { x = x0 + W; y = y0 + s - W; nx = -1; ny = 0; }
      else if (s < 2 * W + H) { x = x0 + W - (s - W - H); y = y0 + H; nx = 0; ny = -1; }
      else { x = x0; y = y0 + H - (s - 2 * W - H); nx = 1; ny = 0; }
      const d = base * (1 + amp * .45 * Math.sin(s * .018 + e * .006 * sp) + amp * .25 * Math.sin(s * .047 - e * .009 * sp));
      pts.push([x + nx * d, y + ny * d]);
    }
    return pts;
  }
  function framePath(c, x0, y0, W, H, pts) {
    c.beginPath(); c.rect(x0, y0, W, H);
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= pts.length; i++) { const a = pts[i % pts.length], b = pts[(i + 1) % pts.length]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath();
  }
  P.X = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 700, (c, e, w, h) => {
      const g0 = EO(C(e / 250)) * (1 - SS(450, 700, e));
      const pts = frame(c, 0, 0, w, h, 6 * g0, e, 1.6, 1);
      const g = c.createLinearGradient(0, 0, w, h); PAL.forEach((col, i) => g.addColorStop(i / 3, col));
      c.fillStyle = g; c.globalAlpha = .8; framePath(c, 0, 0, w, h, pts); c.fill('evenodd');
    });
    if (!card) return;
    const DUR = 2500 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH, top = hdrBottom();
    const base = Math.min(VW, VH) * (.035 + t * .008) * (up ? 1.7 : 1);
    const drips = up ? Array.from({ length: 10 }, () => ({ x: R(0, VW), w: R(8, 18), L: R(40, 140), t0: R(500, 900) })) : [];
    run(F.c, DUR, (c, e) => {
      const grow = EO(C(e / 450)) * (1 - EIO(C((e - (DUR - 800)) / 800)));
      if (grow <= 0) return;
      const pts = frame(c, 0, top, VW, VH - top, base * grow, e, up ? 1.8 : 1, 1);
      const g = c.createLinearGradient(0, top, VW, VH);
      PAL.forEach((col, i) => g.addColorStop(i / 3, col));
      c.globalAlpha = .88; c.fillStyle = g; framePath(c, 0, top, VW, VH - top, pts); c.fill('evenodd');
      c.globalAlpha = .6 * grow; c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke();
      c.globalAlpha = .88 * grow;
      drips.forEach(d => { const p = EO(C((e - d.t0) / 900)); if (p <= 0) return; const y0 = top + base * grow * .8, L = d.L * p; c.fillStyle = palAt(d.x / VW); c.fillRect(d.x - d.w / 2, y0, d.w, L); c.beginPath(); c.arc(d.x, y0 + L, d.w * .55, 0, 7); c.fill(); });
    });
  };

  /* ══════════ Y ホログラム（HOLO FOIL）══════════
     肢：文字の裏をホログラムの帯が斜めに走る。
     全画面：ホログラムのシールを傾けたように、虹色の帯が画面を斜めに横切る。帯の中には細い回折の線と、瞬くラメ。
     段3〜は帯が2本、段が上がった瞬間は画面全体がホログラムに染まってラメが舞う。 */
  function holoBand(c, VW, VH, p, BW, a, glit) {
    const D = Math.hypot(VW, VH) / 2 + BW;
    c.save(); c.translate(VW / 2, VH / 2); c.rotate(-.55);
    const x = -D + 2 * D * p;
    const g = c.createLinearGradient(x - BW / 2, 0, x + BW / 2, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    IRI.forEach((col, i) => g.addColorStop(.1 + i * .8 / (IRI.length - 1), col));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalCompositeOperation = 'screen'; c.globalAlpha = .42 * a; c.fillStyle = g; c.fillRect(x - BW / 2, -D, BW, 2 * D);
    c.globalAlpha = .14 * a; c.fillStyle = '#fff';
    for (let xx = x - BW / 2; xx < x + BW / 2; xx += 5) c.fillRect(xx, -D, 1, 2 * D);
    c.globalCompositeOperation = 'source-over';
    glit.forEach(s => { const tw = Math.sin(p * 40 + s.ph); if (tw > .3) glint(c, x + s.u * BW / 2, s.v * D, s.s, (tw - .3) * a); });
    c.restore();
  }
  P.Y = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const cg = Array.from({ length: 10 }, () => ({ u: R(-1, 1), v: R(-.5, .5), s: R(2, 4), ph: R(0, 7) }));
    choiceLayer(el, budget, 650, (c, e, w, h) => holoBand(c, w, h, EIO(C(e / 620)), 90, 1, cg));
    if (!card) return;
    const DUR = 2000 + (up ? 800 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const mk = n => Array.from({ length: n }, () => ({ u: R(-1, 1), v: R(-1, 1), s: R(2.5, 6), ph: R(0, 7) }));
    const bands = [{ t0: 0, BW: 220 + t * 20, g: mk(40) }];
    if (t >= 3 || up) bands.push({ t0: 330, BW: 140, g: mk(24) });
    const dust = up ? Array.from({ length: 90 }, () => ({ x: R(0, VW), y: R(0, VH), s: R(2, 5), ph: R(0, 7) })) : [];
    run(F.c, DUR, (c, e) => {
      bands.forEach(b => { const p = C((e - b.t0) / 1300); if (p > 0 && p < 1) holoBand(c, VW, VH, EIO(p), b.BW, 1, b.g); });
      if (up) {
        const a = SS(300, 700, e) * (1 - SS(DUR - 700, DUR, e));
        c.globalCompositeOperation = 'screen'; c.globalAlpha = .2 * a; c.fillStyle = iri(c, VW / 2, VH / 2, e * .002, '#ff9fd6'); c.fillRect(0, 0, VW, VH);
        c.globalCompositeOperation = 'source-over';
        dust.forEach(d => { const tw = Math.sin(e * .012 + d.ph); if (tw > .4) glint(c, d.x, d.y - e * .02, d.s, (tw - .4) * 1.6 * a); });
      }
    });
  };

  /* ══════════ Z 跳ねる液体の玉（BOUNCING DROP）══════════
     肢：タップ位置で雫が跳ねる。
     全画面：タップ位置からつやのある液体の玉が飛び出し、肢の下の線を床にしてぽよん、ぽよんと横へ跳ねていく
     （着地でつぶれて伸びる・しぶき）。最後は水たまりになって消える。段で玉が増え、段が上がった瞬間は大きな玉と小さな玉が扇形に。 */
  P.Z = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 600, (c, e, w, h) => {
      const q = e / 1000, a = 1 - SS(350, 600, e);
      for (let i = 0; i < 8; i++) { const an = -Math.PI / 2 + (i - 3.5) * .3; c.fillStyle = PAL[i % 4]; c.globalAlpha = a; c.beginPath(); c.arc(o.ox + Math.cos(an) * 160 * q, o.oy + Math.sin(an) * 160 * q + 500 * q * q, 2.4, 0, 7); c.fill(); }
      c.globalAlpha = a * .8; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(o.ox, o.oy, 60 * EO(C(e / 400)), 16 * EO(C(e / 400)), 0, 0, 7); c.stroke();
    });
    if (!card) return;
    const DUR = 2700;
    const F = fullLayer(DUR + 100), VW = F.VW;
    const floor = o.er.bottom;
    const nb = up ? 5 : 1 + (t >= 4) + (t >= 6);
    const balls = Array.from({ length: nb }, (_, i) => {
      const dir = (o.cx < VW / 2 ? 1 : -1) * (i % 2 ? -1 : 1) * (up ? R(.6, 1.4) : 1);
      const r = (13 + t * .8) * (up && i === 0 ? 1.8 : up ? .8 : 1);
      const hops = [], hs = [140 + t * 12, .5, .26, .12], ds = [560, 420, 320, 240];
      let x = o.cx, tt = i * 140;
      hs.forEach((h, k) => { const H = k ? hs[0] * h : h, dx = dir * VW * (k ? .12 : .1); hops.push({ x0: x, x1: x + dx, H, t0: tt, d: ds[k], y0: k ? floor - r : o.cy }); x += dx; tt += ds[k]; });
      return { r, hops, end: tt, x, spl: [] };
    });
    run(F.c, DUR, (c, e, dt) => {
      const fade = 1 - SS(DUR - 400, DUR, e);
      balls.forEach(b => {
        const hp = b.hops.find(h => e >= h.t0 && e < h.t0 + h.d);
        if (hp) {
          const p = (e - hp.t0) / hp.d, x = hp.x0 + (hp.x1 - hp.x0) * p;
          const yEnd = floor - b.r, y = hp.y0 + (yEnd - hp.y0) * p - 4 * hp.H * p * (1 - p);
          const land = p > .9 ? (p - .9) / .1 : 0, lift = p < .12 ? 1 - p / .12 : 0;
          const sq = Math.max(land, lift) * (hp.H / 140) * .35;
          ball(c, x, y + sq * b.r * .5, b.r, 1 + sq, 1 - sq, fade);
          if (p > .96 && !hp.sp) { hp.sp = 1; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + R(-1.2, 1.2); b.spl.push({ x, y: floor, vx: Math.cos(a) * R(60, 200), vy: Math.sin(a) * R(120, 300), t0: e, col: PAL[i % 4] }); } b.spl.push({ ring: 1, x, y: floor, t0: e }); }
        } else if (e >= b.end) {   // 水たまり
          const p = C((e - b.end) / 600);
          c.globalAlpha = (1 - p) * fade; c.fillStyle = '#FF007F';
          c.beginPath(); c.ellipse(b.x, floor - 2, b.r * (1 + p * 1.6), b.r * .3 * (1 - p * .5), 0, 0, 7); c.fill(); c.globalAlpha = 1;
        }
        b.spl.forEach(s => {
          const le = (e - s.t0) / 1000;
          if (s.ring) { const q = C(le / .4); if (q < 1) { c.globalAlpha = (1 - q) * .8 * fade; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(s.x, s.y, b.r * (1 + q * 2.5), b.r * .35 * (1 + q * 2.5), 0, 0, 7); c.stroke(); } return; }
          const a = 1 - C(le / .5); if (a <= 0) return;
          c.globalAlpha = a * fade; c.fillStyle = s.col; c.beginPath(); c.arc(s.x + s.vx * le, s.y + s.vy * le + 900 * le * le, 2.2, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
      });
    });
  };

  /* ══════════ AA 液体の波形（LIQUID WAVEFORM）══════════
     肢：文字の裏に細い波形が走る。
     全画面：正解の肢の高さに、画面の端から端まで光る波形が数本重なって立ち上がり、うねって静まる（音声アシスタントの波形のような）。
     段で波の本数と振れ幅が増え、段が上がった瞬間は画面いっぱいの大きな振れ幅に。 */
  P.AA = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 650, (c, e, w, h) => {
      const env = SS(0, 150, e) * (1 - SS(420, 650, e));
      c.globalCompositeOperation = 'lighter'; c.lineWidth = 2;
      PAL.forEach((col, i) => { c.strokeStyle = col; c.globalAlpha = .8 * env; c.beginPath(); for (let x = 0; x <= w; x += 4) { const g = Math.exp(-Math.pow((x - o.ox) / (w * .35), 2)); const y = h / 2 + Math.sin(x * (.05 + i * .012) - e * .02 + i) * h * .35 * g; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
    });
    if (!card) return;
    const DUR = 2300 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const nw = 3 + (t >= 3) + (t >= 5) + (up ? 1 : 0);
    const waves = Array.from({ length: nw }, (_, i) => ({ k: R(.007, .016), w: R(.004, .009) * (i % 2 ? 1 : -1), ph: R(0, 7), amp: R(.55, 1), col: ['#FF007F', '#2FE0D5', '#B03CFF', '#FF7A00', '#FFFFFF', '#FF6FB5'][i] }));
    const Amax = (up ? Math.min(VH * .28, 220) : 38 + t * 8), spread = VW * (up ? .6 : .22 + t * .025);
    const Y0 = up ? VH / 2 : o.cy;
    run(F.c, DUR, (c, e) => {
      const env = SS(0, 350, e) * (1 - SS(DUR - 800, DUR, e)) * (1 + .15 * Math.sin(e * .01));
      if (env <= 0) return;
      c.globalCompositeOperation = 'lighter';
      waves.forEach(wv => {
        const pts = [];
        for (let x = 0; x <= VW; x += 6) { const g = Math.exp(-Math.pow((x - o.cx) / spread, 2)); pts.push([x, Y0 + Math.sin(x * wv.k + e * wv.w + wv.ph) * Amax * wv.amp * g * env]); }
        // 波と中心線の間を薄く塗る
        c.globalAlpha = .12; c.fillStyle = wv.col; c.beginPath(); c.moveTo(0, Y0); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(VW, Y0); c.fill();
        c.globalAlpha = .25; c.strokeStyle = wv.col; c.lineWidth = 7; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
        c.globalAlpha = .95; c.lineWidth = 2; c.stroke();
      });
      c.globalCompositeOperation = 'source-over';
    });
  };

  /* ══════════ AB 液体のブロブ（MORPHING BLOB）══════════
     肢：文字の裏に小さな液体のかたまりがぷくっと膨らんで消える。
     全画面：タップ位置に輪郭のくっきりした液体のかたまりがぷるんと膨らみ、形を変えながら色が回り、
     最後に3つにちぎれて飛んでいく。段でかたまりが大きくなり、段が上がった瞬間は大きく膨らんで6つにちぎれる。 */
  function blob(c, x, y, Rb, e, ph, a, rot) {
    if (Rb < 1 || a <= 0) return;
    const N = 48, pts = [];
    for (let i = 0; i < N; i++) {
      const th = i / N * Math.PI * 2;
      const r = Rb * (1 + .13 * Math.sin(3 * th + e * .004 + ph) + .08 * Math.sin(5 * th - e * .006 + ph * 2) + .05 * Math.sin(2 * th + e * .003));
      pts.push([x + Math.cos(th) * r, y + Math.sin(th) * r]);
    }
    const path = () => { c.beginPath(); c.moveTo((pts[0][0] + pts[N - 1][0]) / 2, (pts[0][1] + pts[N - 1][1]) / 2); for (let i = 0; i < N; i++) { const p = pts[i], q = pts[(i + 1) % N]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.closePath(); };
    c.save(); c.globalAlpha = a;
    const g = c.createLinearGradient(x + Math.cos(rot) * Rb, y + Math.sin(rot) * Rb, x - Math.cos(rot) * Rb, y - Math.sin(rot) * Rb);
    PAL.forEach((col, i) => g.addColorStop(i / 3, col));
    c.fillStyle = g; path(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - Rb * .3, y - Rb * .38, Rb * .32, Rb * .16, -.5, 0, 7); c.fill();
    c.restore();
  }
  P.AB = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 650, (c, e, w, h) => {
      const s = BACK(C(e / 300)) * (1 - SS(420, 650, e));
      blob(c, o.ox, o.oy, h * .75 * s, e, 0, .8, e * .005);
    });
    if (!card) return;
    const DUR = 2500 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const R0 = up ? Math.min(VW, VH) * .2 : 46 + t * 8;
    const X = C(o.cx, R0 + 10, VW - R0 - 10), Y = C(o.cy, hdrBottom() + R0 + 10, VH - R0 - 10);
    const tSplit = 1500 + (up ? 300 : 0);
    const nk = up ? 6 : 3;
    const kids = Array.from({ length: nk }, (_, i) => ({ a: i / nk * Math.PI * 2 + R(-.3, .3) - Math.PI / 2, v: R(.8, 1.2), ph: R(0, 7) }));
    run(F.c, DUR, (c, e) => {
      if (e < tSplit + 120) {
        const s = BACK(C(e / 520)) * (e > tSplit - 250 ? 1 - .45 * EIO(C((e - (tSplit - 250)) / 370)) : 1);
        blob(c, X, Y, R0 * s, e, 0, 1, e * .003);
      }
      if (e > tSplit - 50) {
        const p = C((e - tSplit + 50) / (DUR - tSplit)), q = EO(p);
        kids.forEach(k => blob(c, X + Math.cos(k.a) * R0 * 2.2 * q * k.v, Y + Math.sin(k.a) * R0 * 2.2 * q * k.v, R0 * .38 * (1 - p * .7), e, k.ph, 1 - SS(.6, 1, p), e * .004 + k.ph));
      }
    });
  };

  /* ══════════ AC ドットの波紋（DOT RIPPLE）══════════
     肢：文字の裏に並んだ細かな点が、タップ位置から波打って光る。
     全画面：画面いっぱいに見えない点の格子があり、タップ位置から波が広がると、波の通る所だけ点が光って外へ押し出される
     （点の色は方角で4色に変わる）。段で波の数が増え、段が上がった瞬間は波が強く、通ったあとに点がしばらく光り続ける。 */
  function dotField(c, W, H, x0, y0, ox, oy, step, waves, e, amp, mul, keep) {
    for (let y = y0 + step / 2; y < y0 + H; y += step) for (let x = x0 + step / 2; x < x0 + W; x += step) {
      const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy) + .01;
      let I = 0;
      for (const wv of waves) { const rho = (e - wv.t0) * wv.v; if (rho <= 0) continue; const q = (d - rho) / wv.w; I = Math.max(I, Math.exp(-q * q) * wv.s * Math.exp(-rho / wv.fall)); }
      if (keep) { const key = (x | 0) + ',' + (y | 0); if (I > .3) keep[key] = e; const k0 = keep[key]; if (k0 != null) I = Math.max(I, .35 * Math.exp(-(e - k0) / 700)); }
      if (I < .03) continue;
      const push = amp * I, px = x + dx / d * push, py = y + dy / d * push;
      c.globalAlpha = Math.min(1, I) * mul; c.fillStyle = palAt((Math.atan2(dy, dx) / (Math.PI * 2)) + .5);
      c.beginPath(); c.arc(px, py, .8 + 2.4 * I, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
  P.AC = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 650, (c, e, w, h) => dotField(c, w, h, 0, 0, o.ox, o.oy, 9, [{ t0: 0, v: .9, w: 16, s: 1, fall: 400 }], e, 4, 1 - SS(450, 650, e)));
    if (!card) return;
    const DUR = 2300 + (up ? 500 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH, top = hdrBottom();
    const far = Math.hypot(Math.max(o.cx, VW - o.cx), Math.max(o.cy - top, VH - o.cy));
    const n = (up ? 3 : 0) + 1 + Math.floor(t / 2);
    const waves = Array.from({ length: n }, (_, i) => ({ t0: i * 200, v: up ? 1.2 : .95, w: up ? 46 : 34, s: up ? 1.2 : 1, fall: far * (.7 + t * .06) }));
    const keep = up ? {} : null;
    run(F.c, DUR, (c, e) => {
      dotField(c, VW, VH - top, 0, top, o.cx, o.cy, 22, waves, e, up ? 14 : 9, 1 - SS(DUR - 400, DUR, e), keep);
    });
  };

  /* 送り：実物の _scrollToNextCard と同じく、次のカードへなめらかに */
  P.adv = function (card) {
    const q = (typeof examQueue !== 'undefined' ? examQueue : []).filter(c => c.style.display !== 'none');
    const nx = q[q.indexOf(card) + 1];
    if (!nx) return;
    const hdr = document.querySelector('.st-hdr');
    window.scrollTo({ top: Math.max(0, nx.getBoundingClientRect().top + scrollY - (hdr ? hdr.offsetHeight + 8 : 0)), behavior: 'smooth' });
  };
})();
