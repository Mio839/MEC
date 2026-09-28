/* Liquid の正解演出の新しい案（デモページ専用）。
   _work/fx_all_demo.html が枠（study.html）の中へ <script> で差し込み、_lqSoapFx を一時的に差し替えて
   本物の _rfCorrectFx から呼ぶ＝送りの時間・連続数・段の判定は実物と同じ。
   study.html からは読まれない（本番には入っていない）。採用が決まったら study_exam.js へ移す。
   第1弾（2026-09-28）：K 窓ガラスの雫・L 水銀・M シャボン玉・N 満ちる・O 渦 → M だけ採用（本番の _lqSoapFx）。
   第2弾（2026-09-28）：P 噴水・Q 炭酸・R 霧の虹・S 水中の光・T 金魚（このファイル）。
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
  const RAINBOW = ['#ff3b5c', '#ff9a3b', '#ffe23b', '#4be38b', '#3bb7ff', '#5b6bff', '#b04bff'];

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
      if (e < dur) { draw(c, e, dt); requestAnimationFrame(f); }
    })(t0);
  }
  function choiceLayer(el, budget, nominal, draw) {
    _rfFit(budget, nominal);
    const L = _lqLayer(el);
    const w = el.clientWidth, h = el.clientHeight;
    const c = _frCtx(L, w, h, 0, 2);
    run(c, nominal, (c, e, dt) => draw(c, e, w, h, dt));
    _lqDrop(el, L, nominal);
  }
  function fullLayer(ms) {
    _rfK = 1;
    const H = _rfFullHost(ms);
    const VW = window.innerWidth, VH = window.innerHeight;
    return { H, c: _frCtx(H, VW, VH, 0, 1.5), VW, VH };
  }
  const hdrBottom = () => { const h = document.querySelector('.st-hdr'); return h ? Math.max(0, h.getBoundingClientRect().bottom) : 0; };
  function glint(c, x, y, s, a) {
    if (a <= 0 || s <= 0) return;
    c.save(); c.globalAlpha = Math.min(1, a); c.translate(x, y);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.4);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,200,235,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 1.4, 0, 7); c.fill();
    c.fillStyle = '#fff';
    for (const [w, h] of [[s * .12, s * 2.2], [s * 2.2, s * .12]]) { c.beginPath(); c.moveTo(0, -h); c.lineTo(w, 0); c.lineTo(0, h); c.lineTo(-w, 0); c.closePath(); c.fill(); }
    c.restore();
  }
  function ripples(c, x, y, e, n, gap, R0, dur, col) {
    for (let i = 0; i < n; i++) {
      const p = C((e - i * gap) / dur);
      if (p <= 0 || p >= 1) continue;
      c.strokeStyle = col(i); c.globalAlpha = (1 - p) * .9; c.lineWidth = 2 * (1 - p) + .6;
      c.beginPath(); c.ellipse(x, y, EO(p) * R0, EO(p) * R0 * .55, 0, 0, 7); c.stroke();
    }
    c.globalAlpha = 1;
  }

  /* ══════════ P 噴水（FOUNTAIN）══════════
     肢：タップ位置から水面の波紋が広がる。
     全画面：タップ位置から水柱が弧を描いて噴き上がり、しぶきが光りながら落ちる。頂点のあたりで粒がきらめく。
     段で水柱の本数と高さが増え、段が上がった瞬間は扇形に5本。 */
  P.P = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 750, (c, e, w, h) => {
      const gl = 1 - C(e / 300);
      if (gl > 0) { const g = c.createRadialGradient(o.ox, o.oy, 0, o.ox, o.oy, 40); g.addColorStop(0, `rgba(255,255,255,${.6 * gl})`); g.addColorStop(1, 'rgba(47,224,213,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
      ripples(c, o.ox, o.oy, e, 3, 110, Math.max(w, 120) * .6, 520, i => i % 2 ? '#2FE0D5' : '#FF6FB5');
    });
    if (!card) return;
    const DUR = 2600 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const g = 2000, Hh = Math.min(o.cy - hdrBottom() - 20, VH * (.26 + t * .03)) * (up ? 1.15 : 1);
    const v0 = Math.sqrt(2 * g * Math.max(120, Hh));
    const nj = up ? 5 : 1 + Math.floor(t / 2), spread = up ? .8 : .22 + t * .03;
    const jets = Array.from({ length: nj }, (_, i) => -Math.PI / 2 + (nj === 1 ? R(-.08, .08) : (i / (nj - 1) - .5) * 2 * spread));
    const drops = [];
    let acc = 0;
    run(F.c, DUR, (c, e, dt) => {
      if (e < 700) {   // 水柱を噴く
        acc += dt * (110 + t * 10);
        while (acc >= 1) {
          acc--;
          jets.forEach(a => {
            const aa = a + R(-.035, .035), sp = v0 * R(.9, 1.03);
            drops.push({ x: o.cx + R(-2, 2), y: o.cy, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t0: e, w: R(1.4, 2.8), col: ['#ffffff', '#bff6ff', '#ffc3e3', '#2FE0D5'][drops.length % 4] });
          });
        }
      }
      // 噴き出し口の光
      const gl = 1 - SS(500, 900, e);
      if (gl > 0) { const gg = c.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, 30); gg.addColorStop(0, `rgba(255,255,255,${.8 * gl})`); gg.addColorStop(1, 'rgba(255,111,181,0)'); c.fillStyle = gg; c.beginPath(); c.arc(o.cx, o.cy, 30, 0, 7); c.fill(); }
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      const fade = 1 - SS(DUR - 500, DUR, e);
      for (const d of drops) {
        d.vy += g * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        const age = e - d.t0;
        if (d.y > VH + 20 || age > 2000) continue;
        const a = fade * (1 - C((age - 1300) / 700));
        if (a <= 0) continue;
        c.globalAlpha = a * .85; c.strokeStyle = d.col; c.lineWidth = d.w;
        c.beginPath(); c.moveTo(d.x - d.vx * .018, d.y - d.vy * .018); c.lineTo(d.x, d.y); c.stroke();
        if (Math.abs(d.vy) < 90 && ((d.t0 * 7) | 0) % 5 === 0) { c.globalCompositeOperation = 'source-over'; glint(c, d.x, d.y, 5, a); c.globalCompositeOperation = 'lighter'; }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    });
  };

  /* ══════════ Q 炭酸（FIZZ）══════════
     肢：文字の裏で、下の縁から細かな泡が立ち昇る。
     全画面：肢の上の縁から細かな泡が何本もの列になって昇り、加速しながら少しずつ大きくなって、画面の上で弾ける。
     段で列の数が増え、段が上がった瞬間は瓶を振ったように泡がタップ位置から噴き上がる。 */
  function fizzBubble(c, x, y, r, a) {
    c.globalAlpha = a;
    c.fillStyle = 'rgba(255,190,230,.18)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(.7, r * .28); c.stroke();
    if (r > 2) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .25, 0, 7); c.fill(); }
  }
  P.Q = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const cb = Array.from({ length: 34 }, () => ({ x: R(4, o.er.width - 4), t0: R(0, 380), r: R(.9, 2.2), v: R(.7, 1.3) }));
    choiceLayer(el, budget, 850, (c, e, w, h) => {
      const fade = 1 - SS(600, 850, e);
      cb.forEach(b => {
        const le = (e - b.t0) / 1000; if (le < 0) return;
        const y = h + 3 - (60 * le + 260 * le * le) * b.v;
        if (y < -4) return;
        fizzBubble(c, b.x + Math.sin(le * 20 + b.x) * 1.5, y, b.r * (1 + le), fade);
      });
      c.globalAlpha = 1;
    });
    if (!card) return;
    const DUR = 2600 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100);
    const top = hdrBottom() + 4;
    const cols = Array.from({ length: 8 + t * 3 }, () => ({ x: o.er.left + R(6, o.er.width - 6), next: R(0, 200), gap: R(60, 130) }));
    const bs = [], pops = [];
    if (up) for (let i = 0; i < 140; i++) { const a = -Math.PI / 2 + R(-.55, .55), sp = R(500, 1100); bs.push({ x: o.cx, y: o.cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: R(1, 3.4), t0: R(0, 160), spray: true }); }
    run(F.c, DUR, (c, e, dt) => {
      if (e < 1500) cols.forEach(col => { while (e >= col.next) { bs.push({ x: col.x, y: o.er.top, vx: 0, vy: -R(40, 90), r: R(.9, 1.6), t0: col.next, ph: R(0, 7) }); col.next += col.gap; } });
      const fade = 1 - SS(DUR - 400, DUR, e);
      for (const b of bs) {
        if (b.gone || e < b.t0) continue;
        const le = (e - b.t0) / 1000;
        if (b.spray) { b.vx *= Math.exp(-dt * 2.4); b.vy = b.vy * Math.exp(-dt * 1.6) - 200 * dt; }
        else b.vy = Math.max(-780, b.vy - 700 * dt);
        b.x += (b.vx + (b.spray ? 0 : Math.sin(le * 16 + b.ph) * 12)) * dt; b.y += b.vy * dt;
        const r = b.r * (1 + le * .9);
        if (b.y < top + r) { b.gone = true; pops.push({ x: b.x, y: top + r, t0: e, r }); continue; }
        fizzBubble(c, b.x, b.y, r, fade);
      }
      c.lineWidth = 1; c.strokeStyle = '#fff';
      for (const p of pops) {
        const q = C((e - p.t0) / 140); if (q >= 1) continue;
        c.globalAlpha = (1 - q) * fade;
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .6, r1 = p.r + 2 + q * 5, r2 = r1 + 3; c.beginPath(); c.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1); c.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2); c.stroke(); }
      }
      c.globalAlpha = 1;
    });
  };

  /* ══════════ R 霧の虹（MIST RAINBOW）══════════
     肢：文字の裏を虹色の光が霧のように横切る。
     全画面：タップ位置から霧がふわっと広がり、その上に虹の弧が左から右へ描かれて、しばらく架かってから消える。
     段で弧が大きくなり、段4〜は外側に色の順が逆の薄い副虹。段が上がった瞬間は画面いっぱいの虹と、弧に沿ったきらめき。 */
  P.R = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    choiceLayer(el, budget, 800, (c, e, w, h) => {
      const p = EIO(C(e / 700)), x = -w * .5 + w * 2 * p, a = 1 - SS(550, 800, e);
      const g = c.createLinearGradient(x - w * .45, 0, x + w * .45, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      RAINBOW.forEach((col, i) => g.addColorStop(.12 + i * .76 / 6, col));
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = .42 * a; c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    });
    if (!card) return;
    const DUR = 2900 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const Rr = up ? Math.hypot(VW, VH) * .42 : Math.min(VW * .42, 360) * (.8 + t * .06);
    const X = up ? VW / 2 : o.cx, Y = up ? VH * .92 : o.cy + Rr * .55;
    const band = Math.max(5, Rr * .032);
    const mist = Array.from({ length: 34 }, () => ({ a: R(0, 7), d: R(0, 1), s: R(40, 110), t0: R(0, 300) }));
    const sparks = up ? Array.from({ length: 26 }, () => ({ a: Math.PI + R(.05, .95) * Math.PI, t0: R(600, 1900), s: R(4, 9) })) : [];
    const arc = (c, r0, cols, alpha, sweep) => {
      cols.forEach((col, i) => {
        c.strokeStyle = col; c.globalAlpha = alpha; c.lineWidth = band + 1;
        c.beginPath(); c.arc(X, Y, r0 - i * band, Math.PI, Math.PI + sweep); c.stroke();
      });
    };
    run(F.c, DUR, (c, e) => {
      const fade = 1 - SS(DUR - 800, DUR, e);
      // 霧
      mist.forEach(m => {
        const p = C((e - m.t0) / 1400); if (p <= 0) return;
        const r = m.s * (.4 + EO(p) * .9), d = m.d * 90 * EO(p);
        const x = o.cx + Math.cos(m.a) * d, y = o.cy + Math.sin(m.a) * d * .6;
        const a = .16 * Math.sin(Math.PI * Math.min(1, p * 1.3)) * fade;
        if (a <= 0) return;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,240,250,${a})`); g.addColorStop(1, 'rgba(255,240,250,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      });
      // 虹（左から描かれる）
      const sweep = Math.PI * EIO(C((e - 250) / 1000));
      if (sweep > 0) {
        c.save(); c.filter = 'blur(2px)';
        arc(c, Rr, RAINBOW, .36 * fade, sweep);
        if (t >= 4 || up) arc(c, Rr * 1.28, [...RAINBOW].reverse(), .15 * fade, sweep);
        c.restore();
      }
      sparks.forEach(s => {
        const p = C((e - s.t0) / 500); if (p <= 0 || p >= 1 || s.a > Math.PI + sweep) return;
        glint(c, X + Math.cos(s.a) * (Rr - band * 3), Y + Math.sin(s.a) * (Rr - band * 3), s.s, Math.sin(Math.PI * p) * fade);
      });
      c.globalAlpha = 1;
    });
  };

  /* ══════════ S 水中の光（LIGHT SHAFTS）══════════
     肢：文字の裏で水底のきらめきが瞬く。
     全画面：画面の上（水面）から揺らめく光の筋が何本も差し込み、正解の肢の位置へ集まる。光の中を小さな粒が漂う。
     段で筋が増えて明るくなり、段が上がった瞬間は光の筋が左から右へ画面を掃く。 */
  P.S = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const sp = Array.from({ length: 18 }, () => ({ x: R(0, o.er.width), y: R(0, o.er.height), t0: R(0, 450), s: R(3, 6) }));
    choiceLayer(el, budget, 800, (c, e, w, h) => {
      const a = 1 - SS(550, 800, e);
      const g = c.createRadialGradient(o.ox, o.oy, 0, o.ox, o.oy, w * .6);
      g.addColorStop(0, `rgba(47,224,213,${.28 * a})`); g.addColorStop(1, 'rgba(47,224,213,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      sp.forEach(s => { const p = C((e - s.t0) / 320); if (p > 0 && p < 1) glint(c, s.x, s.y, s.s, Math.sin(Math.PI * p) * a); });
    });
    if (!card) return;
    const DUR = 2900 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW;
    const top = hdrBottom();
    const n = 4 + t + (up ? 4 : 0);
    const rays = Array.from({ length: n }, (_, i) => ({ x: (i + R(.1, .9)) / n * VW, w: R(30, 80), ph: R(0, 7), br: R(.6, 1) }));
    const motes = Array.from({ length: 70 }, () => ({ r: rays[(Math.random() * n) | 0], k: R(.05, .95), j: R(-.4, .4), s: R(.8, 2), ph: R(0, 7) }));
    const T = { x: o.cx, y: o.cy };
    run(F.c, DUR, (c, e) => {
      const env = SS(0, 450, e) * (1 - SS(DUR - 900, DUR, e)) * (.75 + t * .04);
      if (env <= 0) return;
      const sweep = up ? (EIO(C((e - 200) / 1800)) - .5) * VW * .9 : 0;
      c.globalCompositeOperation = 'lighter';
      rays.forEach(r => {
        const x0 = r.x + Math.sin(e * .0011 + r.ph) * 34 + sweep, hw = r.w / 2 * (.8 + .2 * Math.sin(e * .002 + r.ph));
        const bx = T.x + (x0 - T.x) * .12;   // 下の端は肢の少し手前で細くなる
        const g = c.createLinearGradient(x0, top, T.x, T.y);
        g.addColorStop(0, `rgba(255,236,250,${.5 * env * r.br})`); g.addColorStop(.6, `rgba(255,111,181,${.22 * env * r.br})`); g.addColorStop(1, 'rgba(47,224,213,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(x0 - hw, top); c.lineTo(x0 + hw, top); c.lineTo(bx + 3, T.y); c.lineTo(bx - 3, T.y); c.closePath(); c.fill();
      });
      // 水面のゆらぎ
      c.strokeStyle = `rgba(255,255,255,${.35 * env})`; c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x <= VW; x += 10) { const y = top + 3 + Math.sin(x * .03 + e * .004) * 2 + Math.sin(x * .011 - e * .003) * 2; x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      // 漂う粒
      motes.forEach(m => {
        const x0 = m.r.x + Math.sin(e * .0011 + m.r.ph) * 34 + sweep, k = (m.k + e * .00004) % 1;
        const x = x0 + (T.x - x0) * k + m.j * m.r.w * (1 - k) + Math.sin(e * .002 + m.ph) * 4, y = top + (T.y - top) * k;
        c.fillStyle = `rgba(255,255,255,${.7 * env * (.5 + .5 * Math.sin(e * .006 + m.ph))})`;
        c.beginPath(); c.arc(x, y, m.s, 0, 7); c.fill();
      });
      c.globalCompositeOperation = 'source-over';
    });
  };

  /* ══════════ T 金魚（GOLDFISH）══════════
     肢：金魚が跳ねた水の輪としぶき。
     全画面：タップ位置から金魚が尾を振って泳ぎ出し、曲線を描いて画面の外へ去る。泳いだ跡に水の輪が残る。
     段で匹数が増え、段が上がった瞬間は大きな金魚が画面の中央を1周してから去る。 */
  function fish(c, x, y, ang, L, e, ph, kind, a) {
    if (L < 1) return;
    c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = a;
    const wag = Math.sin(e * .022 + ph) * .45;
    // 尾びれ（半透明の2枚）
    c.save(); c.translate(-L * .38, 0); c.rotate(wag);
    c.fillStyle = kind.fin; c.globalAlpha = a * .75;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-L * .25, -L * .34, -L * .5, -L * .3); c.quadraticCurveTo(-L * .3, 0, -L * .5, L * .3); c.quadraticCurveTo(-L * .25, L * .34, 0, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .8;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-L * .45, k * L * .12); c.stroke(); }
    c.restore();
    // 胸びれ
    c.fillStyle = kind.fin; c.globalAlpha = a * .6;
    [-1, 1].forEach(s => { c.beginPath(); c.ellipse(L * .12, s * L * .17, L * .12, L * .05, s * (.6 + Math.sin(e * .03 + ph) * .3), 0, 7); c.fill(); });
    // 体（尾に向かって少し曲がる）
    c.globalAlpha = a; c.rotate(-wag * .15);
    const g = c.createLinearGradient(L * .5, 0, -L * .4, 0);
    kind.body.forEach((col, i) => g.addColorStop(i / (kind.body.length - 1), col));
    c.fillStyle = g;
    c.beginPath(); c.moveTo(L * .55, 0); c.bezierCurveTo(L * .45, -L * .26, -L * .2, -L * .22, -L * .42, 0); c.bezierCurveTo(-L * .2, L * .22, L * .45, L * .26, L * .55, 0); c.fill();
    if (kind.patch) { c.fillStyle = kind.patch; c.beginPath(); c.ellipse(L * .02, -L * .04, L * .16, L * .09, .3, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(L * .12, -L * .1, L * .22, L * .04, -.08, 0, 7); c.fill();
    c.fillStyle = '#1a0612'; c.beginPath(); c.arc(L * .36, -L * .08, L * .045, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(L * .375, -L * .095, L * .015, 0, 7); c.fill();
    c.restore();
  }
  const KINDS = [
    { body: ['#FF7A00', '#FF4F3A', '#FF4FA3'], fin: '#FF8A5C', patch: null },
    { body: ['#FFF4F0', '#FF4F3A', '#FFE8E0'], fin: '#FFB0A0', patch: '#FF3B2F' },
    { body: ['#FF4FA3', '#B34BFF', '#7928CA'], fin: '#D58CFF', patch: null },
    { body: ['#FFD36E', '#FF9A3B', '#FF6FB5'], fin: '#FFC08A', patch: '#FFFFFF' },
  ];
  P.T = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const spl = Array.from({ length: 9 }, () => ({ a: -Math.PI / 2 + R(-1.1, 1.1), v: R(40, 90) }));
    choiceLayer(el, budget, 750, (c, e) => {
      ripples(c, o.ox, o.oy, e, 3, 120, 70, 560, i => i % 2 ? '#FFD36E' : '#FF6FB5');
      const q = e / 1000, a = 1 - C(e / 520);
      if (a > 0) spl.forEach(s => { c.fillStyle = `rgba(255,230,245,${a})`; c.beginPath(); c.arc(o.ox + Math.cos(s.a) * s.v * q * 2.2, o.oy + Math.sin(s.a) * s.v * q * 2.2 + 400 * q * q, 1.8, 0, 7); c.fill(); });
    });
    if (!card) return;
    const DUR = 3000 + (up ? 700 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const edge = () => { const s = (Math.random() * 4) | 0; return s === 0 ? [-120, R(0, VH)] : s === 1 ? [VW + 120, R(0, VH)] : s === 2 ? [R(0, VW), VH + 120] : [R(0, VW), hdrBottom() - 120]; };
    const nf = 1 + Math.floor(t / 2);
    const fishes = Array.from({ length: nf }, (_, i) => {
      const [ex, ey] = edge();
      return { t0: i * 180, dur: R(2000, 2600), L: R(38, 52) * (1 + t * .04), ph: R(0, 7), kind: KINDS[i % KINDS.length],
        p: [[o.cx, o.cy], [o.cx + R(-260, 260), o.cy + R(-220, 120)], [R(VW * .15, VW * .85), R(VH * .2, VH * .8)], [ex, ey]], rip: [] };
    });
    if (up) {
      const cx = VW / 2, cy = VH * .5, rr = Math.min(VW, VH) * .3, a0 = Math.atan2(o.cy - cy, o.cx - cx);
      fishes.push({ t0: 100, dur: 3300, L: Math.min(170, Math.min(VW, VH) * .2), ph: 0, kind: KINDS[1], giant: true, rip: [],
        at: p => {
          if (p < .72) { const q = EIO(p / .72), a = a0 + q * Math.PI * 2, r = rr * (.4 + .6 * Math.min(1, p / .15)); return [cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r]; }
          const q = (p - .72) / .28, a = a0 + Math.PI * 2; return [cx + Math.cos(a) * rr * 1.2 - Math.sin(a) * q * VW, cy + Math.sin(a) * rr + Math.cos(a) * q * VW];
        } });
    }
    const bez = (P4, u) => { const v = 1 - u; return [0, 1].map(k => v * v * v * P4[0][k] + 3 * v * v * u * P4[1][k] + 3 * v * u * u * P4[2][k] + u * u * u * P4[3][k]); };
    run(F.c, DUR, (c, e) => {
      const fade = 1 - SS(DUR - 300, DUR, e);
      fishes.forEach(f => {
        const p = C((e - f.t0) / f.dur); if (p <= 0) return;
        const u = f.giant ? p : p * p * (1.6 - .6 * p);   // 泳ぎ出しはゆっくり
        const pos = f.giant ? f.at(u) : bez(f.p, u), nx = f.giant ? f.at(Math.min(1, u + .004)) : bez(f.p, Math.min(1, u + .01));
        const ang = Math.atan2(nx[1] - pos[1], nx[0] - pos[0]);
        if (!f.lastRip || e - f.lastRip > (f.giant ? 260 : 380)) { f.lastRip = e; f.rip.push({ x: pos[0], y: pos[1], t0: e }); }
        f.rip.forEach(r => { const q = C((e - r.t0) / 900); if (q < 1) { const rr = 6 + q * f.L * .6; c.strokeStyle = `rgba(255,255,255,${.3 * (1 - q) * fade})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(r.x, r.y, rr, rr * .5, 0, 0, 7); c.stroke(); } });
        if (p < 1) fish(c, pos[0], pos[1], ang, f.L * SS(0, .08, p), e, f.ph, f.kind, fade);
      });
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
