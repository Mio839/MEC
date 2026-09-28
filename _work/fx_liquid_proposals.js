/* Liquid の正解演出の新しい案（2026-09-28・デモページ専用）。
   _work/fx_all_demo.html が枠（study.html）の中へ <script> で差し込み、_lqFluidFx を一時的に差し替えて
   本物の _rfCorrectFx から呼ぶ＝送りの時間・連続数・段の判定は実物と同じ。
   study.html からは読まれない（本番には入っていない）。採用が決まったら study_exam.js へ移す。
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
  const SS = (a, b, x) => { const t = C((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const COLS = ['#FF007F', '#7928CA', '#FF7A00', '#2FE0D5'];
  const IRI = ['#ff6ec7', '#ffd36e', '#6effc0', '#6ecbff', '#b66eff', '#ff6ec7'];

  /* タップ位置（肢の中）と画面座標 */
  function org(el) {
    const er = el.getBoundingClientRect();
    let ox = er.width / 2, oy = er.height / 2;
    const pt = _lqPtr;
    if (pt && pt.el === el && performance.now() - pt.t < 2000) { ox = er.width * pt.fx; oy = er.height * pt.fy; }
    return { er, ox, oy, cx: er.left + ox, cy: er.top + oy };
  }
  /* 描画ループ。keep=true なら前のフレームを消さない（軌跡を残す案で使う）。尺は _rfK で縮む */
  function run(c, dur, draw, keep) {
    const t0 = performance.now(), k = _rfK, cv = c.canvas;
    const wipe = () => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.restore(); };
    (function f(now) {
      if (!cv.isConnected) return;
      const e = (now - t0) / k;
      if (!keep) wipe();
      if (e < dur) { draw(c, e); requestAnimationFrame(f); } else wipe();
    })(t0);
  }
  /* ① 肢の層：canvas 1枚（文字の裏） */
  function choiceLayer(el, budget, nominal, draw, keep) {
    _rfFit(budget, nominal);
    const L = _lqLayer(el);
    const w = el.clientWidth, h = el.clientHeight;
    const c = _frCtx(L, w, h, 0, 2);
    run(c, nominal, (c, e) => draw(c, e, w, h), keep);
    _lqDrop(el, L, nominal);
  }
  /* ② 全画面の層：canvas 1枚（dpr ≤ 1.5） */
  function fullLayer(ms) {
    _rfK = 1;
    const H = _rfFullHost(ms);
    const VW = window.innerWidth, VH = window.innerHeight;
    return { H, c: _frCtx(H, VW, VH, 0, 1.5), VW, VH };
  }
  const hdrBottom = () => { const h = document.querySelector('.st-hdr'); return h ? h.getBoundingClientRect().bottom : 0; };

  /* ══════════ K 窓ガラスの雫（RAIN ON GLASS）══════════
     肢：タップ位置から結露の粒が輪になって広がる。
     全画面：タップ位置から雫が画面の「ガラス」へ飛び散って貼り付き、しばらく止まってから筋を残して垂れる。
     雫はレンズとして描く（上に映り込みの白・下の縁に屈折したピンク・縁にシアン）。
     段で雫の数と飛ぶ距離が増え、段が上がった瞬間は水の膜がワイパーのように画面を横切って細かな粒を残す。 */
  function drawDrop(c, x, y, r, s, a) {
    if (r < .4 || a <= 0) return;
    c.save(); c.translate(x, y); c.scale(1 / Math.sqrt(s), s); c.globalAlpha = a;
    let g = c.createRadialGradient(0, r * .35, r * .1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(.7, 'rgba(70,12,90,.25)'); g.addColorStop(1, 'rgba(12,0,24,.6)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    g = c.createRadialGradient(0, -r * .3, r * .45, 0, -r * .3, r * 1.1);
    g.addColorStop(0, 'rgba(255,79,163,0)'); g.addColorStop(.8, 'rgba(255,79,163,0)'); g.addColorStop(1, 'rgba(255,130,205,.95)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.lineWidth = Math.max(.8, r * .08); c.strokeStyle = 'rgba(170,245,255,.6)'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(-r * .35, -r * .42, r * .28, r * .15, -.6, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(r * .32, r * .45, r * .09, 0, 7); c.fill();
    c.restore();
  }
  P.K = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    // ① 結露の粒
    const beads = Array.from({ length: 46 }, () => {
      const x = R(0, o.er.width), y = R(0, o.er.height);
      return { x, y, r: R(1.2, 3.6), d: Math.hypot(x - o.ox, y - o.oy) };
    });
    const dmax = Math.max(...beads.map(b => b.d)) || 1;
    choiceLayer(el, budget, 1000, (c, e, w, h) => {
      const fade = 1 - SS(650, 1000, e);
      const rr = EO(C(e / 500)) * dmax * 1.05;
      const g = c.createRadialGradient(o.ox, o.oy, 0, o.ox, o.oy, Math.max(1, rr));
      g.addColorStop(0, 'rgba(47,224,213,.10)'); g.addColorStop(.8, 'rgba(255,0,127,.16)'); g.addColorStop(1, 'rgba(255,0,127,0)');
      c.globalAlpha = fade; c.fillStyle = g; c.fillRect(0, 0, w, h);
      beads.forEach(b => {
        const a = C((rr - b.d) / 40) * fade;
        if (a > 0) drawDrop(c, b.x, b.y, b.r * (.6 + .4 * a), 1, a);
      });
      c.globalAlpha = 1;
    });
    if (!card) return;
    // ② 画面のガラスに貼り付いて垂れる雫
    const DUR = 2700 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const reach = 90 + t * 55 + (up ? Math.max(VW, VH) * .25 : 0);
    const n = 5 + t * 2 + (up ? 6 : 0);
    const drops = Array.from({ length: n }, (_, i) => {
      const a = R(0, Math.PI * 2), d = R(.25, 1) * reach;
      const lx = o.cx + Math.cos(a) * d, ly = o.cy + Math.sin(a) * d * .8;
      const r = R(6, 13) * (1 + t * .06) * (i === 0 ? 1.5 : 1);
      return { lx, ly, x: lx, y: ly, r, r0: r, land: d / 1.6, stick: R(250, 900), vy: 0, wob: R(0, 6), trail: [], sat: Array.from({ length: 3 }, () => ({ a: R(0, 7), d: r * R(1.4, 2.4), r: r * R(.15, .3) })) };
    });
    const mist = [];
    let lastE = 0;
    run(F.c, DUR, (c, e) => {
      const dt = Math.min(.05, (e - lastE) / 1000); lastE = e;
      const fade = 1 - SS(DUR - 500, DUR, e);
      // 段が上がった瞬間：水の膜が左から右へ
      if (up && e > 250 && e < 1250) {
        const p = EIO((e - 250) / 1000), x = -80 + (VW + 160) * p;
        const g = c.createLinearGradient(x - 70, 0, x + 12, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.75, 'rgba(255,110,199,.16)'); g.addColorStop(.92, 'rgba(110,203,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,.8)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 70, 0); c.lineTo(x + 6, 0); c.quadraticCurveTo(x + 26, VH / 2, x + 6, VH); c.lineTo(x - 70, VH); c.fill();
        for (let k = 0; k < 6; k++) mist.push({ x: x - R(0, 60), y: R(0, VH), r: R(1, 3.2), t0: e });
      }
      mist.forEach(m => drawDrop(c, m.x, m.y, m.r, 1, fade * C((e - m.t0) / 150) * .9));
      drops.forEach(d => {
        if (e < d.land) {   // 飛んでいる間：細い光の筋
          const p = EO(e / d.land), x = o.cx + (d.lx - o.cx) * p, y = o.cy + (d.ly - o.cy) * p;
          c.fillStyle = 'rgba(255,220,240,.9)'; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill();
          return;
        }
        const le = e - d.land;
        const splat = le < 180 ? 1 + .45 * (1 - EO(le / 180)) : 1;
        if (le > d.stick) {   // 垂れる
          d.vy = Math.min(420, d.vy + 900 * dt);
          const py = d.y;
          d.y += d.vy * dt; d.x = d.lx + Math.sin((d.y - d.ly) * .03 + d.wob) * 3;
          if (d.y - (d.trail.length ? d.trail[d.trail.length - 1].y : d.ly) > 9) { d.trail.push({ x: d.x, y: py, r: d.r * R(.18, .3) }); d.r = Math.max(d.r0 * .55, d.r * .985); }
        }
        d.trail.forEach(b => drawDrop(c, b.x, b.y, b.r, 1, fade * .9));
        if (le < 260) d.sat.forEach(s => drawDrop(c, d.x + Math.cos(s.a) * s.d * splat, d.y + Math.sin(s.a) * s.d * splat, s.r, 1, fade * (1 - le / 260)));
        drawDrop(c, d.x, d.y, d.r * splat, 1 + Math.min(.45, d.vy / 900), fade);
      });
    });
  };

  /* ══════════ L 水銀（LIQUID CHROME）══════════
     肢：文字の裏をクロムの映り込みの帯が斜めに走る。
     全画面：タップ位置から水銀の玉が飛び散り、くっつき合いながら連続数の表示へ集まって一粒になり、吸い込まれる。
     玉は環境の映り込み（上＝ピンクの空・地平線の白い線・下＝紫とシアン）で塗る。段で玉の数と勢いが増え、
     段が上がった瞬間は大きな玉が中央に残り、まわりの玉がその周りを1周してから合流する。 */
  const ENV = [[-1, 255, 244, 252], [-.55, 255, 125, 205], [-.12, 150, 64, 225], [-.03, 255, 255, 255], [.04, 26, 4, 40], [.4, 80, 24, 130], [.8, 47, 224, 213], [1, 210, 255, 250]];
  function env(u) {
    u = C(u, -1, 1);
    for (let i = 1; i < ENV.length; i++) if (u <= ENV[i][0]) {
      const a = ENV[i - 1], b = ENV[i], k = (u - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
    }
    return ENV[ENV.length - 1].slice(1);
  }
  P.L = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    // ① クロムの帯
    choiceLayer(el, budget, 700, (c, e, w, h) => {
      const p = EIO(C(e / 620)), a = 1 - SS(480, 700, e);
      const x = -w * .4 + w * 1.8 * p;
      c.save(); c.globalAlpha = .75 * a; c.translate(x, 0); c.transform(1, 0, -.45, 1, 0, 0);
      const g = c.createLinearGradient(-90, 0, 90, 0);
      [[0, 'rgba(255,255,255,0)'], [.2, '#3A0A4A'], [.38, '#FF4FA3'], [.47, '#FFFFFF'], [.53, '#FFE3F2'], [.62, '#2A0838'], [.8, '#2FE0D5'], [1, 'rgba(255,255,255,0)']].forEach(s => g.addColorStop(s[0], s[1]));
      c.fillStyle = g; c.fillRect(-90, 0, 180, h); c.restore();
      const s = 1 - C(e / 260);
      if (s > 0) { const gg = c.createRadialGradient(o.ox, o.oy, 0, o.ox, o.oy, 26); gg.addColorStop(0, `rgba(255,255,255,${.9 * s})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(0, 0, w, h); }
    });
    if (!card) return;
    // ② 水銀の玉
    const DUR = 2300 + (up ? 500 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const cell = Math.max(2, Math.round(Math.max(VW, VH) / 420));
    const gw = Math.ceil(VW / cell), gh = Math.ceil(VH / cell);
    const off = document.createElement('canvas'); off.width = gw; off.height = gh;
    const oc = off.getContext('2d');
    const n = 5 + t + (up ? 3 : 0);
    const blobs = Array.from({ length: n }, (_, i) => {
      const a = R(0, Math.PI * 2), sp = R(260, 480 + t * 60);
      return { x: o.cx, y: o.cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .8, r: R(9, 17) * (1 + t * .05), a0: a };
    });
    if (up) blobs.unshift({ x: o.cx, y: o.cy, vx: 0, vy: 0, r: 30 + t * 2, big: true });
    const target = () => {
      const s = document.getElementById('examRfStreak');
      if (s) { const r = s.getBoundingClientRect(); if (r.width && r.bottom > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      return { x: VW / 2, y: hdrBottom() + 36 };
    };
    let T = null, lastE = 0;
    const tMerge = up ? 1100 : 600, tSink = DUR - 550;
    const L = [-.45, -.62, .64], Ln = Math.hypot(...L); L[0] /= Ln; L[1] /= Ln; L[2] /= Ln;
    run(F.c, DUR, (c, e) => {
      const dt = Math.min(.05, (e - lastE) / 1000); lastE = e;
      if (e > tMerge * .8 && !T) T = target();
      const big = blobs.find(b => b.big);
      blobs.forEach((b, i) => {
        if (e < tMerge) {
          if (b.big) return;
          if (up && e > 350) {   // 大きな玉の周りを回る
            const ang = Math.atan2(b.y - big.y, b.x - big.x) + dt * 4.2, rr = 70 + (i % 3) * 22;
            b.x += (big.x + Math.cos(ang) * rr - b.x) * Math.min(1, dt * 8); b.y += (big.y + Math.sin(ang) * rr - b.y) * Math.min(1, dt * 8);
          } else { b.vx *= Math.exp(-dt * 4.5); b.vy *= Math.exp(-dt * 4.5); b.x += b.vx * dt; b.y += b.vy * dt; }
        } else {
          const tx = T.x, ty = T.y, k = e < tSink ? 7 : 14;
          b.vx += ((tx - b.x) * k - b.vx * 3.2) * dt * 3; b.vy += ((ty - b.y) * k - b.vy * 3.2) * dt * 3;
          b.x += b.vx * dt; b.y += b.vy * dt;
        }
      });
      const shrink = e < tSink ? 1 : 1 - EIO(C((e - tSink) / 480));
      // 玉のある範囲だけ場を計算する
      let x0 = VW, y0 = VH, x1 = 0, y1 = 0;
      blobs.forEach(b => { const m = b.r * 3.2; x0 = Math.min(x0, b.x - m); y0 = Math.min(y0, b.y - m); x1 = Math.max(x1, b.x + m); y1 = Math.max(y1, b.y + m); });
      const gx0 = C(Math.floor(x0 / cell), 0, gw - 1), gy0 = C(Math.floor(y0 / cell), 0, gh - 1);
      const gx1 = C(Math.ceil(x1 / cell), 0, gw), gy1 = C(Math.ceil(y1 / cell), 0, gh);
      oc.clearRect(0, 0, gw, gh);
      const bw = gx1 - gx0, bh = gy1 - gy0;
      if (bw > 0 && bh > 0 && shrink > .01) {
        const img = oc.createImageData(bw, bh), D = img.data;
        const rs = blobs.map(b => (b.r * shrink) * (b.r * shrink));
        const r0 = blobs.reduce((s, b) => s + b.r, 0) / blobs.length * shrink;
        for (let gy = 0; gy < bh; gy++) {
          const py = (gy0 + gy + .5) * cell;
          for (let gx = 0; gx < bw; gx++) {
            const px = (gx0 + gx + .5) * cell;
            let f = 0, fx = 0, fy = 0;
            for (let i = 0; i < blobs.length; i++) {
              const dx = px - blobs[i].x, dy = py - blobs[i].y, d2 = dx * dx + dy * dy + 1, q = rs[i] / d2;
              f += q; fx -= 2 * q * dx / d2; fy -= 2 * q * dy / d2;
            }
            if (f < .6) continue;
            const al = SS(.72, 1.12, f);
            // 高さ h = √(1 − 1/f)（玉が1つなら正確に半球）。法線は (−∂H/∂x, −∂H/∂y, 1)、H = r0·h
            const h = Math.sqrt(Math.max(.004, 1 - 1 / f)), kh = r0 / (2 * h * f * f);
            let nx = -fx * kh, ny = -fy * kh, nz = 1;
            const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
            // 視線 (0,0,1) の反射ベクトルの y で映り込みを引く（上向き＝空・下向き＝地面・中央付近に地平線）
            const col = env(2 * nz * ny + nx * .15);
            const spec = Math.pow(Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), 40) * 255;
            const j = (gy * bw + gx) * 4;
            D[j] = Math.min(255, col[0] + spec); D[j + 1] = Math.min(255, col[1] + spec); D[j + 2] = Math.min(255, col[2] + spec); D[j + 3] = al * 255;
          }
        }
        oc.putImageData(img, gx0, gy0);
        c.imageSmoothingEnabled = true;
        c.drawImage(off, 0, 0, gw, gh, 0, 0, gw * cell, gh * cell);
      }
      // 吸い込まれた瞬間の輪
      if (T && e > tSink + 380) {
        const p = C((e - tSink - 380) / 400);
        c.strokeStyle = `rgba(255,230,245,${(1 - p) * .9})`; c.lineWidth = 2.5 * (1 - p) + .5;
        c.beginPath(); c.arc(T.x, T.y, 10 + p * 46, 0, 7); c.stroke();
      }
    });
  };

  /* ══════════ M シャボン玉（SOAP BUBBLES）══════════
     肢：文字の裏に張ったシャボンの膜が虹色に渦を巻き、タップ位置から丸く割れる。
     全画面：タップ位置からシャボン玉が吹き出して、揺れながら昇り、1つずつ割れて小さな雫が散る。
     段で玉の数と大きさが増え、段が上がった瞬間は大きな玉が画面の中央まで昇って割れ、細かな玉が散る。 */
  function bubble(c, x, y, r, rot, wob, a) {
    if (r < 1 || a <= 0) return;
    c.save(); c.translate(x, y); c.rotate(wob * .3); c.scale(1 + wob, 1 - wob);
    c.globalAlpha = a;
    let g = c.createRadialGradient(0, 0, r * .55, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.16)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    let st = '#ff9fd6';
    if (c.createConicGradient) { st = c.createConicGradient(rot, 0, 0); IRI.forEach((col, i) => st.addColorStop(i / (IRI.length - 1), col)); }
    c.strokeStyle = st;
    c.globalAlpha = a * .9; c.lineWidth = Math.max(1.2, r * .085); c.beginPath(); c.arc(0, 0, r * .95, 0, 7); c.stroke();
    c.globalAlpha = a * .38; c.lineWidth = Math.max(.8, r * .05);
    c.beginPath(); c.arc(0, 0, r * .72, rot, rot + 1.9); c.stroke();
    c.beginPath(); c.arc(0, 0, r * .5, rot + 3, rot + 4.3); c.stroke();
    c.globalAlpha = a * .95; c.fillStyle = 'rgba(255,255,255,.9)';
    c.beginPath(); c.ellipse(-r * .42, -r * .42, r * .2, r * .11, -.75, 0, 7); c.fill();
    c.globalAlpha = a * .55; c.beginPath(); c.arc(r * .44, r * .4, r * .075, 0, 7); c.fill();
    c.restore();
  }
  P.M = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    // ① 膜が張って割れる
    const drops = Array.from({ length: 12 }, (_, i) => ({ a: i / 12 * Math.PI * 2 + R(-.2, .2), v: R(.5, 1) }));
    choiceLayer(el, budget, 820, (c, e, w, h) => {
      const diag = Math.hypot(Math.max(o.ox, w - o.ox), Math.max(o.oy, h - o.oy));
      const film = SS(0, 180, e);
      const hole = EO(C((e - 260) / 480)) * diag * 1.05;
      if (film > 0) {
        let st = 'rgba(255,110,199,.3)';
        if (c.createConicGradient) { st = c.createConicGradient(e * .004, o.ox, o.oy); IRI.forEach((col, i) => st.addColorStop(i / (IRI.length - 1), col)); }
        c.globalAlpha = .38 * film; c.fillStyle = st; c.fillRect(0, 0, w, h);
        c.globalAlpha = .22 * film; c.strokeStyle = '#fff'; c.lineWidth = 1.2;
        for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(o.ox, o.oy, 14 + k * 22 + e * .02, k + e * .005, k + e * .005 + 2.2); c.stroke(); }
        c.globalAlpha = 1;
        if (hole > 0) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(o.ox, o.oy, hole, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
      }
      if (hole > 0 && hole < diag) drops.forEach(d => {
        const rr = hole + 6 * d.v; c.fillStyle = `rgba(255,235,248,${.9 * (1 - hole / diag)})`;
        c.beginPath(); c.arc(o.ox + Math.cos(d.a) * rr, o.oy + Math.sin(d.a) * rr * .7, 1.8, 0, 7); c.fill();
      });
    });
    if (!card) return;
    // ② 吹き出して昇るシャボン玉
    const DUR = 2800 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const n = 4 + t + (t >= 3 ? 2 : 0);
    const bs = Array.from({ length: n }, (_, i) => ({
      x: o.cx, y: o.cy, vx: R(-160, 160), vy: R(-260, -120), r: R(13, 26) * (1 + t * .07), born: i * 70 + R(0, 60),
      life: R(1300, 2300), rot: R(0, 7), wf: R(3, 5), wp: R(0, 7), pops: null
    }));
    if (up) bs.push({ x: o.cx, y: o.cy, giant: true, r: Math.min(VW, VH) * .2, born: 120, life: 1950, rot: 0, wf: 2.4, wp: 0, pops: null });
    const pops = [];
    let lastE = 0;
    run(F.c, DUR, (c, e) => {
      const dt = Math.min(.05, (e - lastE) / 1000); lastE = e;
      bs.forEach(b => {
        const le = e - b.born;
        if (le < 0 || b.gone) return;
        if (le > b.life) {   // 割れる
          b.gone = true;
          const k = b.giant ? 42 : 10;
          for (let i = 0; i < k; i++) { const a = R(0, 7), sp = R(80, b.giant ? 520 : 240); pops.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0: e, r: R(1, 2.4), col: IRI[i % 5] }); }
          pops.push({ ring: true, x: b.x, y: b.y, r: b.r, t0: e });
          if (b.giant) for (let i = 0; i < 7; i++) bs.push({ x: b.x, y: b.y, vx: R(-260, 260), vy: R(-260, 80), r: R(8, 15), born: e, life: R(500, 800), rot: R(0, 7), wf: 4, wp: R(0, 7) });
          return;
        }
        const grow = EO(C(le / 320));
        if (b.giant) {
          const p = EIO(C(le / 1200)); b.x = o.cx + (VW / 2 - o.cx) * p; b.y = o.cy + (VH * .45 - o.cy) * p;
        } else {
          b.vy -= 60 * dt; b.vx *= Math.exp(-dt * 1.2); b.vy *= Math.exp(-dt * .9);
          b.x += (b.vx + Math.sin(le * .004 + b.wp) * 30) * dt; b.y += b.vy * dt;
        }
        b.rot += dt * (b.giant ? 1.4 : 2.2);
        const wob = Math.sin(le * .001 * b.wf * 2 + b.wp) * .06 * (b.giant ? 1.2 : 1);
        bubble(c, b.x, b.y, b.r * grow, b.rot, wob, 1);
        if (b.giant) {   // 大きな玉は膜の渦を多く
          c.save(); c.globalAlpha = .28; c.lineWidth = 2;
          for (let k = 0; k < 5; k++) { c.strokeStyle = IRI[k]; c.beginPath(); c.arc(b.x, b.y, b.r * grow * (.2 + k * .14), b.rot * (k % 2 ? -1 : 1) + k, b.rot + k + 1.6); c.stroke(); }
          c.restore();
        }
      });
      for (const p of pops) {
        const le = (e - p.t0) / 1000;
        if (p.ring) { const q = C(le / .16); if (q < 1) { c.strokeStyle = `rgba(255,255,255,${.7 * (1 - q)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + q * .35), 0, 7); c.stroke(); } continue; }
        const a = 1 - C(le / .45); if (a <= 0) continue;
        c.globalAlpha = a; c.fillStyle = p.col;
        c.beginPath(); c.arc(p.x + p.vx * le, p.y + p.vy * le + 300 * le * le, p.r, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
    });
  };

  /* ══════════ N 満ちる（RISING TIDE）══════════
     肢：文字の裏で液体が下から満ちて、波打ってから引く。
     全画面：タップ位置から液体が細い流れになって画面の下へ注がれ、画面の底から水位が上がって揺れ、引いていく。
     水位＝段（TIER1で画面の約15%〜TIER7で約45%）。中を泡が昇る。
     段が上がった瞬間は水位が一段と上がり、大きな波頭が画面を横切る。 */
  P.N = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    // ① 肢が満ちる
    choiceLayer(el, budget, 760, (c, e, w, h) => {
      const lv = EO(C(e / 330)) * (1 - EIO(C((e - 470) / 290)));
      if (lv <= 0) return;
      const y0 = h * (1 - lv * 1.08);
      const g = c.createLinearGradient(0, y0, 0, h);
      g.addColorStop(0, 'rgba(255,0,127,.55)'); g.addColorStop(1, 'rgba(121,40,202,.5)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) c.lineTo(x, y0 + Math.sin(x * .045 - e * .02) * 3.5 * (1 - lv * .4) - Math.exp(-Math.pow((x - o.ox) / 36, 2)) * 5 * (1 - C(e / 400)));
      c.lineTo(w, h); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,220,240,.85)'; c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x <= w; x += 6) { const y = y0 + Math.sin(x * .045 - e * .02) * 3.5 * (1 - lv * .4) - Math.exp(-Math.pow((x - o.ox) / 36, 2)) * 5 * (1 - C(e / 400)); x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    });
    if (!card) return;
    // ② 画面の底から満ちる
    const DUR = 2700 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const Ht = VH * (.1 + t * .045) + (up ? VH * .1 : 0);
    const bub = Array.from({ length: 12 + t * 4 }, () => ({ x: R(0, VW), y0: R(.2, 1), s: R(40, 110), r: R(1.5, 4), p: R(0, 7) }));
    const surf = (x, e, y0, amp) => {
      const tilt = Math.sin(e * .0055) * amp * 1.6 * (1 - C(e / DUR)) * ((x - VW / 2) / (VW / 2));
      const imp = -Math.exp(-Math.pow((x - o.cx) / 55, 2)) * 14 * (e < 700 ? 1 : Math.max(0, 1 - (e - 700) / 600)) * Math.abs(Math.sin(e * .02));
      const crest = up && e > 500 && e < 1700 ? -Math.exp(-Math.pow((x - (-120 + (VW + 240) * EIO((e - 500) / 1200))) / 70, 2)) * 42 : 0;
      return y0 + Math.sin(x * .018 - e * .004) * amp + Math.sin(x * .041 + e * .0065) * amp * .45 + tilt + imp + crest;
    };
    run(F.c, DUR, (c, e) => {
      const lvl = Ht * EO(C((e - 200) / 800)) * (1 - EIO(C((e - 1800) / (DUR - 1850))));
      const amp = 5 + t * 1.2;
      // 注がれる流れ
      if (e < 750) {
        const fall = EO(C(e / 280)), bot = o.cy + ((VH - lvl) - o.cy) * fall, a = 1 - SS(550, 750, e), top = o.cy + ((VH - lvl) - o.cy) * SS(420, 750, e);
        const g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, `rgba(255,120,200,${.9 * a})`); g.addColorStop(1, `rgba(121,40,202,${.8 * a})`);
        c.fillStyle = g; c.beginPath(); c.moveTo(o.cx - 3, top); c.lineTo(o.cx + 3, top); c.lineTo(o.cx + 1.6, bot); c.lineTo(o.cx - 1.6, bot); c.fill();
      }
      if (lvl < 1) return;
      const y0 = VH - lvl;
      // 奥の波
      c.fillStyle = 'rgba(121,40,202,.34)'; c.beginPath(); c.moveTo(0, VH);
      for (let x = 0; x <= VW + 8; x += 8) c.lineTo(x, surf(x + 60, e * 1.2 + 400, y0 - 10, amp * .8));
      c.lineTo(VW, VH); c.fill();
      // 手前の波
      const g = c.createLinearGradient(0, y0 - amp * 2, 0, VH);
      g.addColorStop(0, 'rgba(255,0,127,.5)'); g.addColorStop(.5, 'rgba(160,30,170,.42)'); g.addColorStop(1, 'rgba(60,10,110,.5)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, VH);
      const pts = [];
      for (let x = 0; x <= VW + 8; x += 8) { const y = surf(x, e, y0, amp); pts.push([x, y]); c.lineTo(x, y); }
      c.lineTo(VW, VH); c.fill();
      c.strokeStyle = 'rgba(255,225,242,.9)'; c.lineWidth = 2; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
      // 泡
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
      bub.forEach(b => {
        const y = VH - ((b.y0 * lvl + (e / 1000) * b.s) % Math.max(1, lvl));
        if (y < y0 + 6) return;
        c.beginPath(); c.arc(b.x + Math.sin(e * .003 + b.p) * 4, y, b.r, 0, 7); c.stroke();
      });
    });
  };

  /* ══════════ O 渦（INK CURL）══════════
     肢：文字の裏でタップ位置から色の糸が渦を巻いて流れる。
     全画面：タップ位置から4色のインクの糸が水の中へ吹き出したように広がり、渦を巻いて尾を引きながら消える。
     段で糸の本数と広がりが増え、段が上がった瞬間は左右一対の渦（キノコ雲のような巻き上がり）が昇っていく。 */
  function curl(x, y, e, S) {
    const a = .012, b = .011, cc = .02, d = .017;
    const s1 = Math.sin(a * x + e * .0006), c1 = Math.cos(a * x + e * .0006), s2 = Math.sin(b * y - e * .0005), c2 = Math.cos(b * y - e * .0005);
    const c3 = Math.cos(cc * x - d * y + e * .0009);
    const px = a * c1 * c2 + .5 * cc * c3, py = -b * s1 * s2 - .5 * d * c3;
    return [py * S, -px * S];
  }
  function inkField(c, e, W, H, ox, oy, parts, opt) {
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = `rgba(0,0,0,${opt.fade(e)})`; c.fillRect(0, 0, W, H); c.restore();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    const dt = Math.min(.05, (e - (opt.last || 0)) / 1000); opt.last = e;
    parts.forEach(p => {
      if (e < p.born) return;
      const [ux, uy] = curl(p.x, p.y, e, opt.S);
      let vx = ux, vy = uy;
      const dx = p.x - ox, dy = p.y - oy, r = Math.hypot(dx, dy) + 1, G = opt.G * Math.exp(-e / 900);
      vx += -dy / r * G / (r + 40); vy += dx / r * G / (r + 40);
      (opt.pairs || []).forEach(v => {
        const vxp = v.x(e), vyp = v.y(e), qx = p.x - vxp, qy = p.y - vyp, q = Math.hypot(qx, qy) + 1;
        vx += -qy / q * v.g / (q + 30); vy += qx / q * v.g / (q + 30);
      });
      p.vx += (vx - p.vx) * Math.min(1, dt * opt.blend); p.vy += (vy - p.vy) * Math.min(1, dt * opt.blend);
      const x0 = p.x, y0 = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
      const a = opt.alpha(e) * C((e - p.born) / 120);
      if (a <= 0) return;
      c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = p.w;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(p.x, p.y); c.stroke();
    });
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  P.O = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    // ① 肢の中の糸
    const cp = Array.from({ length: 110 }, (_, i) => { const a = R(0, 7), sp = R(60, 220); return { x: o.ox, y: o.oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .5, born: R(0, 120), col: COLS[i % 4], w: 1.6 }; });
    const copt = { S: 9000, G: 7000, blend: 3, fade: e => e < 600 ? .14 : .35, alpha: e => .8 * (1 - SS(550, 900, e)) };
    choiceLayer(el, budget, 900, (c, e, w, h) => inkField(c, e, w, h, o.ox, o.oy, cp, copt), true);
    if (!card) return;
    // ② 画面の中へ広がるインク
    const DUR = 2700 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const n = Math.min(1400, 320 + t * 110 + (up ? 350 : 0));
    const sp0 = 180 + t * 40;
    const parts = Array.from({ length: n }, (_, i) => {
      const a = R(0, 7), sp = R(.3, 1) * sp0 * 1.25;
      return { x: o.cx + R(-4, 4), y: o.cy + R(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, born: R(0, 260), col: COLS[i % 4], w: R(1, 2.2) };
    });
    const pairs = up ? [
      { x: e => o.cx - 70, y: e => o.cy - e * .16, g: 26000 },
      { x: e => o.cx + 70, y: e => o.cy - e * .16, g: -26000 },
    ] : [];
    const fopt = {
      S: 16000 + t * 1200, G: 30000 + t * 3500, pairs, blend: 3.2,
      fade: e => e < DUR - 700 ? .1 : .22, alpha: e => .62 * (1 - SS(DUR - 800, DUR - 150, e))
    };
    run(F.c, DUR, (c, e) => inkField(c, e, VW, VH, o.cx, o.cy, parts, fopt), true);
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
