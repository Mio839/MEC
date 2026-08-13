/**
 * fx_engine.js — Canvas 2D パーティクルエンジン（正解・連続正解演出用）
 * study.html / chapter_exam.js から共用。window.MecFX を公開する。
 *
 * 設計方針:
 * - パーティクルは全て1枚の fixed キャンバス + 1本の rAF ループで描画（DOM生成なし）
 * - iPad Safari 対策: dpr は 1.5 で頭打ち、同時パーティクル上限、粒が無くなればループ停止
 * - グロー円はオフスクリーンスプライトに事前描画して drawImage（shadowBlur は使わない）
 */
(function () {
  'use strict';
  if (window.MecFX) return;

  var MAX_PARTICLES = 2600;
  var Z_INDEX = 9070;            // トースト(9100)・全画面×n(9080)より下、通常UIより上

  var canvas = null, ctx = null, dpr = 1, W = 0, H = 0;
  var pool = [];
  var attractors = [];
  var running = false, rafId = 0, lastT = 0;
  var curFont = '';

  // ── canvas 準備 ─────────────────────────────────────────────
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'mecFxCanvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:' + Z_INDEX + ';';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    // iPad/iOS はツールバーの出入り・分割表示・ソフトキーボードで可視域だけが変わり
    // window の resize が来ないことがある。canvas の実寸が古いままだと粒子が縦にずれる。
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearAll(); });
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // ── 色ユーティリティ ────────────────────────────────────────
  function hexRgb(col) {
    if (col.charAt(0) !== '#') return null;
    var h = col.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ── グロー円スプライト ──────────────────────────────────────
  var spriteCache = {};
  var SPRITE_R = 24;             // 実体円半径8px + グロー16px
  function glowSprite(color) {
    var sp = spriteCache[color];
    if (sp) return sp;
    var rgb = hexRgb(color);
    var s = document.createElement('canvas');
    s.width = s.height = SPRITE_R * 2;
    var g = s.getContext('2d');
    if (rgb) {
      var grad = g.createRadialGradient(SPRITE_R, SPRITE_R, 0, SPRITE_R, SPRITE_R, SPRITE_R);
      grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',1)');
      grad.addColorStop(.33, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.95)');
      grad.addColorStop(.6, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.35)');
      grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, SPRITE_R * 2, SPRITE_R * 2);
    } else {
      g.fillStyle = color;
      g.beginPath(); g.arc(SPRITE_R, SPRITE_R, 8, 0, 6.2832); g.fill();
    }
    spriteCache[color] = s;
    return s;
  }

  // ── パーティクル生成 ────────────────────────────────────────
  function addP(p) {
    if (pool.length >= MAX_PARTICLES) return null;
    p.age = 0;
    if (p.ttl == null) p.ttl = 1;
    if (p.delay == null) p.delay = 0;
    pool.push(p);
    startLoop();
    return p;
  }

  function startLoop() {
    ensureCanvas();
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(rafId);
    if (ctx) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); }
  }

  function clearAll() {
    pool.length = 0;
    attractors.length = 0;
    stopLoop();
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function easeOutCubic(t) { var u = 1 - t; return 1 - u * u * u; }

  // 位置を自前で持つ（速度で動かさない）型。ここに載せた型は step() の物理を通らない。
  // 型を足したら必ずここに登録すること——登録し忘れると重力で画面外へ落ちて消える。
  var STATIC_TYPES = { bar: 1, bolt: 1, ring: 1, stamp: 1, wave: 1, ribbon: 1 };

  // 2次ベジェ（ribbon の軌道）
  function bez(a, b, c, u) { var v = 1 - u; return v * v * a + 2 * v * u * b + u * u * c; }

  // 波形の高さ。spike を与えると spikeAt 付近に QRS 様の鋭い山が立つ
  function waveY(p, u) {
    var v = Math.sin(u * (p.freq || 6) * 6.2832);
    if (p.spike) {
      var d = (u - (p.spikeAt == null ? .5 : p.spikeAt)) * 34;
      v += p.spike * Math.exp(-d * d) * (d < 0 ? -.35 : 1);
    }
    return p.y - v * p.amp;
  }

  // ── メインループ ────────────────────────────────────────────
  function tick(now) {
    if (!running) return;
    // 描画中の例外で rAF チェーンが切れると running=true のまま恒久停止し、
    // 以降の全エフェクトが無音で消えるため、例外時はプールを捨てて自己回復する
    try {
      step(now);
    } catch (e) {
      clearAll();
      if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
  }

  function step(now) {
    // 初回フレームは rAF タイムスタンプが startLoop 時の performance.now() より
    // 過去になり得る（Chromium）ため、負の dt は 0 に丸める
    var dt = Math.min(Math.max((now - lastT) / 1000, 0), .05);
    lastT = now;

    // update（swap-pop で除去）
    var i, p;
    for (i = attractors.length - 1; i >= 0; i--) {
      attractors[i].age += dt;
      if (attractors[i].age >= attractors[i].ttl) attractors.splice(i, 1);
    }
    for (i = pool.length - 1; i >= 0; i--) {
      p = pool[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      var dead = p.age >= p.ttl;
      if (!dead && p.type === 'orbit') {
        // 極座標で回す。引力点・重力は通さない（軌道が崩れると「回っている」に見えない）
        p.a += p.va * dt;
        if (p.dr) p.r = Math.max(0, p.r + p.dr * dt);
        p.x = p.cx + Math.cos(p.a) * p.r;
        p.y = p.cy + Math.sin(p.a) * p.r * (p.squash == null ? 1 : p.squash);
        if (p.vr) p.rot = (p.rot || 0) + p.vr * dt;
      } else if (!dead && !STATIC_TYPES[p.type]) {
        for (var a = 0; a < attractors.length; a++) {
          var at = attractors[a];
          var dx = at.x - p.x, dy = at.y - p.y;
          var d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
          var acc = at.strength / Math.max(d2, 3600) * 60;
          p.vx += dx / d * acc * dt * 60;
          p.vy += dy / d * acc * dt * 60;
        }
        if (p.gy) p.vy += p.gy * dt;
        if (p.gx) p.vx += p.gx * dt;
        if (p.acc) { // 進行方向へ加速（ワープ演出）
          var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
          p.vx += p.vx / sp * p.acc * dt;
          p.vy += p.vy / sp * p.acc * dt;
        }
        if (p.drag) { var m = Math.pow(p.drag, dt * 60); p.vx *= m; p.vy *= m; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.sway) p.x += Math.sin(p.age * p.sway.f + p.sway.ph) * p.sway.amp * dt;
        if (p.vr) p.rot = (p.rot || 0) + p.vr * dt;
        if (p.emit) { // 尾からの火花（ロケット等）
          p.emit.accum = (p.emit.accum || 0) + p.emit.rate * dt;
          while (p.emit.accum >= 1) { p.emit.accum -= 1; p.emit.make(p); }
        }
        if (p.y > H + 90 && p.vy > 0) dead = true;
        if (p.x < -250 || p.x > W + 250) dead = true;
      }
      if (dead) {
        var od = p.onDeath;
        pool[i] = pool[pool.length - 1];
        pool.pop();
        if (od) od(p);
      }
    }

    if (!pool.length) { stopLoop(); return; }

    // draw（通常 → 加算合成の2パス）
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    curFont = '';
    drawPass(false);
    drawPass(true);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function drawPass(additive) {
    ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (p.delay > 0) continue;
      if (!!p.blend !== additive) continue;
      var t = p.age / p.ttl;
      var alpha = p.alpha != null ? p.alpha : 1;
      var fo = p.fadeOut != null ? p.fadeOut : .35;
      if (t > 1 - fo) alpha *= (1 - t) / fo;
      if (p.pop) alpha *= Math.min(1, p.age * 8);          // 出現時にフッと現れる
      if (p.twinkle) alpha *= .55 + .45 * Math.sin(p.age * p.twinkle.f + p.twinkle.ph);
      if (alpha <= .01) continue;
      ctx.globalAlpha = Math.min(alpha, 1);
      drawParticle(p, t);
    }
  }

  function drawParticle(p, t) {
    var x = p.x, y = p.y, s = p.size;
    switch (p.type) {
      case 'ring': {
        var r = Math.max(4 + (p.maxR - 4) * easeOutCubic(t), 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(p.thick * (1 - t * .6), .8);
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
        return;
      }
      case 'streak': { // 速度方向に伸びる線
        var k = p.trail || .05;
        ctx.lineCap = 'round';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = s;
        ctx.beginPath();
        ctx.moveTo(x - p.vx * k, y - p.vy * k);
        ctx.lineTo(x, y);
        ctx.stroke();
        return;
      }
      case 'bolt': {
        var pts = p.pts;
        ctx.globalAlpha *= (.4 + .6 * Math.abs(Math.sin(p.age * 55 + (p.seed || 0))));
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = p.color; ctx.lineWidth = p.glowW;
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (var j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = p.coreW;
        ctx.stroke();
        return;
      }
      case 'bar': { // グリッチ帯（毎フレーム位置が飛ぶ）
        var by = Math.random() * H;
        ctx.fillStyle = p.color;
        ctx.fillRect(0, by, W, p.h);
        return;
      }
      case 'steam': {
        // 蒸気: グロー円スプライトを膨らませながら薄れさせる。加算合成にしないこと
        // （加算だと光って見え、湯気ではなく発光体になる）
        var sd = s * (1 + (p.grow == null ? 2 : p.grow) * t);
        ctx.drawImage(glowSprite(p.color), x - sd / 2, y - sd / 2, sd, sd);
        return;
      }
      case 'ribbon': {
        // 2点間を走る光の線。頭が進み、尾が一定長で追いかける
        var rh = easeOutCubic(Math.min(t / (p.grow || .55), 1));
        var rt = Math.max(0, rh - (p.tail == null ? .34 : p.tail));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = s;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var q = 0; q <= 16; q++) {
          var u = rt + (rh - rt) * (q / 16);
          var bx = bez(p.x0, p.bx, p.x1, u), by = bez(p.y0, p.by, p.y1, u);
          if (q === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
        }
        ctx.stroke();
        if (p.glow) {
          var hx = bez(p.x0, p.bx, p.x1, rh), hy = bez(p.y0, p.by, p.y1, rh);
          var hd = s * 5;
          ctx.drawImage(glowSprite(p.color), hx - hd / 2, hy - hd / 2, hd, hd);
        }
        return;
      }
      case 'wave': {
        // 走査線のように左から波形が伸びる。尾は一定の長さで切る
        var wp = Math.min(t / (p.grow || .8), 1);
        var span = p.x1 - p.x0;
        var wh = p.x0 + span * wp;
        var wt = Math.max(p.x0, wh - (p.tail || 240));
        var segs = Math.max(2, Math.round((wh - wt) / 7));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = s;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var q2 = 0; q2 <= segs; q2++) {
          var wx = wt + (wh - wt) * (q2 / segs);
          var wy = waveY(p, (wx - p.x0) / (span || 1));
          if (q2 === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        if (p.glow) {
          var gy2 = waveY(p, (wh - p.x0) / (span || 1)), gd = s * 6;
          ctx.drawImage(glowSprite(p.color), wh - gd / 2, gy2 - gd / 2, gd, gd);
        }
        return;
      }
      case 'stamp': {
        // 大きく浮いた輪が落ちてきて紙面に「押される」。落ちきってから薄れる
        var sp3 = Math.min(t / (p.grow || .22), 1);
        var sc = 1 + (p.from == null ? 1.8 : p.from) * (1 - easeOutCubic(sp3));
        var r2 = s / 2 * sc;
        ctx.save();
        ctx.translate(x, y);
        if (p.rot) ctx.rotate(p.rot * .01745);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (p.thick || 5) * sc);
        ctx.beginPath(); ctx.arc(0, 0, r2, 0, 6.2832); ctx.stroke();
        if (p.inner !== false) {
          ctx.lineWidth = Math.max(.8, (p.thick || 5) * .38 * sc);
          ctx.beginPath(); ctx.arc(0, 0, r2 * .78, 0, 6.2832); ctx.stroke();
        }
        if (p.ticks) {   // 外周の刻み＝真鍮の刻印らしさ
          ctx.lineWidth = Math.max(1, (p.thick || 5) * .5 * sc);
          for (var q3 = 0; q3 < p.ticks; q3++) {
            var a3 = q3 / p.ticks * 6.2832;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a3) * r2 * .84, Math.sin(a3) * r2 * .84);
            ctx.lineTo(Math.cos(a3) * r2, Math.sin(a3) * r2);
            ctx.stroke();
          }
        }
        ctx.restore();
        return;
      }
      case 'glyph': {
        var fs = (s | 0) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        if (curFont !== fs) { ctx.font = fs; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; curFont = fs; }
        if (p.color) ctx.fillStyle = p.color;
        if (p.rot) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot * .01745);
          ctx.fillText(p.glyph, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(p.glyph, x, y);
        }
        return;
      }
    }
    // 図形パーティクル
    if (p.shape === 'circle') {
      if (p.glow) {
        var sp = glowSprite(p.color);
        var d = s * 4;                       // グロー込みの描画サイズ
        ctx.drawImage(sp, x - d / 2, y - d / 2, d, d);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(x, y, s / 2, 0, 6.2832); ctx.fill();
      }
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (p.rot) ctx.rotate(p.rot * .01745);
    if (p.flut) { // 紙吹雪の3D回転風フリップ
      var sc = Math.sin(p.age * p.flut.f + p.flut.ph);
      ctx.scale(1, Math.max(Math.abs(sc), .12));
    }
    ctx.fillStyle = p.color;
    var h = s / 2;
    switch (p.shape) {
      case 'square': ctx.fillRect(-h, -h, s, s); break;
      case 'shard': ctx.fillRect(-s * .18, -h, s * .36, s); break;
      case 'star': starPath(s); ctx.fill(); break;
      case 'gear': gearPath(s, p.teeth || 8); break;
      case 'plus':
        ctx.fillRect(-h, -s * .17, s, s * .34);
        ctx.fillRect(-s * .17, -h, s * .34, s);
        break;
      case 'gem':
        ctx.beginPath();
        ctx.moveTo(0, -h); ctx.lineTo(h * .8, -h * .3); ctx.lineTo(h * .48, h); ctx.lineTo(-h * .48, h); ctx.lineTo(-h * .8, -h * .3);
        ctx.closePath(); ctx.fill();
        break;
      case 'blob':
        ctx.beginPath(); ctx.ellipse(0, 0, h, h * .72, 0, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.ellipse(h * .3, h * .2, h * .6, h * .45, .6, 0, 6.2832); ctx.fill();
        break;
      default:
        ctx.fillRect(-h, -h, s, s);
    }
    ctx.restore();
  }

  // 歯車。歯先を s の直径に合わせ、中心に軸穴を空ける（evenodd で穴にする）。
  // 呼び出し側で translate/rotate 済みなので原点中心に描く。
  function gearPath(s, n) {
    var R = s / 2, root = R * .70, hole = R * .26;
    var step = 6.2832 / n, w = step * .27;   // 歯の半幅（歯底側）
    ctx.beginPath();
    ctx.moveTo(Math.cos(-w) * root, Math.sin(-w) * root);
    for (var i = 0; i < n; i++) {
      var a = i * step;
      ctx.lineTo(Math.cos(a - w * .58) * R, Math.sin(a - w * .58) * R);
      ctx.lineTo(Math.cos(a + w * .58) * R, Math.sin(a + w * .58) * R);
      ctx.lineTo(Math.cos(a + w) * root, Math.sin(a + w) * root);
      ctx.arc(0, 0, root, a + w, a + step - w);   // 歯底は円弧＝鋳物らしい谷になる
    }
    ctx.closePath();
    ctx.moveTo(hole, 0);
    ctx.arc(0, 0, hole, 0, 6.2832, true);         // 逆回り＋evenodd で軸穴を抜く
    ctx.fill('evenodd');
  }

  function starPath(s) {
    ctx.beginPath();
    var R = s / 2, r = R * .45;
    for (var i = 0; i < 10; i++) {
      var rad = (i % 2 === 0) ? R : r;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // ── エミッター群 ────────────────────────────────────────────

  /** 放射バースト。o: {count, colors, shapes, tier, scale, glow, gravity, upBias, additive, delay} */
  function burst(x, y, o) {
    var tier = o.tier || 3;
    var colors = o.colors || ['#FFD700'];
    var shapes = o.shapes || ['circle'];
    var scale = o.scale || 1;
    var maxSpd = o.speed || (tier >= 6 ? 1500 : tier >= 5 ? 1150 : tier >= 4 ? 880 : tier >= 3 ? 620 : 430);
    var maxSz = (tier >= 6 ? 15 : tier >= 5 ? 12 : tier >= 4 ? 10 : 7) * scale;
    var n = o.count || 40;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * 6.2832 + rnd(-.4, .4);
      var spd = rnd(maxSpd * .12, maxSpd);
      var shape = pick(shapes);
      addP({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (o.upBias != null ? o.upBias : (tier >= 4 ? 240 : 110)),
        gy: o.gravity != null ? o.gravity : 760,
        drag: .90,
        size: rnd(3, maxSz) + (shape === 'circle' ? 0 : 2),
        color: pick(colors),
        shape: shape,
        rot: rnd(0, 360), vr: rnd(-640, 640),
        glow: o.glow !== false && shape === 'circle',
        blend: o.additive !== false,
        twinkle: Math.random() < .4 ? { f: rnd(14, 26), ph: rnd(0, 6.28) } : null,
        ttl: rnd(.55, tier >= 4 ? 1.7 : 1.15),
        delay: o.delay || 0
      });
    }
  }

  /** 紙吹雪（上から降る・紙のフリップ回転つき） */
  function confetti(o) {
    var colors = o.colors || ['#FFD700', '#FF9800', '#4FC3F7'];
    var n = o.count || 60;
    for (var i = 0; i < n; i++) {
      var r = Math.random();
      addP({
        x: rnd(0, W), y: rnd(-40, -10),
        vx: rnd(-70, 70), vy: rnd(240, 620),
        gy: 140, drag: .995,
        size: rnd(6, o.big ? 16 : 12),
        color: pick(colors),
        shape: r > .72 ? 'circle' : r > .3 ? 'square' : 'star',
        rot: rnd(0, 360), vr: rnd(-300, 300),
        flut: { f: rnd(6, 13), ph: rnd(0, 6.28) },
        sway: { f: rnd(2, 4), ph: rnd(0, 6.28), amp: rnd(30, 90) },
        glow: false, blend: false,
        ttl: 3.2,
        fadeOut: .12,
        delay: (o.delay || 0) + rnd(0, .25)
      });
    }
  }

  /** グリフの雨（デジタル/レトロ/ECG） */
  function glyphRain(o) {
    var glyphs = o.glyphs || ['0', '1', '#', '$', '%', '&', '∆', '◆'];
    var colors = o.colors || ['#00E5FF', '#FF2BD6'];
    var n = o.count || 30;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'glyph',
        glyph: pick(glyphs),
        x: rnd(0, W), y: rnd(-30, -8),
        vx: rnd(-30, 30), vy: rnd(420, 950),
        size: rnd(13, o.bigGlyph ? 30 : 24),
        color: pick(colors),
        blend: !!o.additive,
        ttl: 2.4,
        fadeOut: .15,
        delay: (o.delay || 0) + rnd(0, .2)
      });
    }
  }

  /** 花びらの雨（墨テーマ） */
  function petals(o) {
    var colors = o.colors || ['#F4A6B0', '#FFFFFF', '#E8C468', '#C93A3A'];
    var n = o.count || 26;
    for (var i = 0; i < n; i++) {
      addP({
        x: rnd(0, W), y: rnd(-30, -8),
        vx: rnd(-40, 40), vy: rnd(130, 310),
        size: rnd(9, 17),
        color: pick(colors),
        shape: 'blob',
        rot: rnd(0, 360), vr: rnd(-160, 160),
        sway: { f: rnd(1.6, 3.2), ph: rnd(0, 6.28), amp: rnd(60, 140) },
        glow: false, blend: false,
        ttl: 3.6,
        fadeOut: .15,
        delay: (o.delay || 0) + rnd(0, .3)
      });
    }
  }

  /** 中心から放射するワープ光線 */
  function warp(o) {
    var colors = o.colors || ['#FFFFFF', '#7C4DFF', '#40C4FF'];
    var cx = o.x != null ? o.x : W / 2;
    var cy = o.y != null ? o.y : H / 2;
    var n = o.count || 40;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * 6.2832 + rnd(-.15, .15);
      var spd = rnd(500, 1100);
      var d0 = rnd(15, 90);
      addP({
        type: 'streak',
        x: cx + Math.cos(ang) * d0, y: cy + Math.sin(ang) * d0,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        acc: 2600,
        size: rnd(1.5, 3.8),
        trail: rnd(.05, .1),
        color: pick(colors),
        blend: true,
        ttl: rnd(.45, .85),
        fadeOut: .3,
        delay: o.delay || 0
      });
    }
  }

  /** 下から上る泡（luxury） */
  function bubbles(o) {
    var colors = o.colors || ['#FFD700', '#F7E7CE', '#FFFFFF'];
    var n = o.count || 24;
    for (var i = 0; i < n; i++) {
      addP({
        x: rnd(0, W), y: H + rnd(8, 40),
        vx: rnd(-25, 25), vy: rnd(-330, -130),
        size: rnd(4, 13),
        color: pick(colors),
        shape: 'circle',
        glow: true, blend: false,
        sway: { f: rnd(2.5, 4.5), ph: rnd(0, 6.28), amp: rnd(30, 70) },
        twinkle: { f: rnd(8, 16), ph: rnd(0, 6.28) },
        ttl: 3.0,
        fadeOut: .2,
        delay: (o.delay || 0) + rnd(0, .25)
      });
    }
  }

  /** 打ち上げ花火（軌跡つきロケット → 空中で開花） */
  function fireworks(o) {
    var tier = o.tier || 4;
    var palettes = o.colors || ['#FFD700', '#FF9800', '#FFFFFF'];
    var n = o.count || (tier >= 6 ? 8 : tier >= 5 ? 5 : 3);
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var sx = W * rnd(.1, .9);
        var trailCol = pick(palettes);
        addP({
          type: 'streak',
          x: sx, y: H + 10,
          vx: rnd(-90, 90), vy: -rnd(H * 1.05, H * 1.5),
          gy: 850, drag: .995,
          size: 3, trail: .04,
          color: '#FFE9A0',
          blend: true,
          ttl: rnd(.5, .72),
          fadeOut: .08,
          delay: .1 + idx * .16,
          emit: {
            rate: 70,
            make: function (r) {
              addP({
                x: r.x + rnd(-2, 2), y: r.y + rnd(-2, 2),
                vx: rnd(-40, 40), vy: rnd(0, 70),
                size: rnd(1.6, 3.2), color: trailCol, shape: 'circle',
                glow: true, blend: true, ttl: rnd(.2, .42), fadeOut: .6
              });
            }
          },
          onDeath: function (r) {
            var cnt = tier >= 6 ? 170 : tier >= 5 ? 120 : 80;
            for (var j = 0; j < cnt; j++) {
              var ang = rnd(0, 6.2832);
              var spd = rnd(60, tier >= 5 ? 640 : 480);
              addP({
                x: r.x, y: r.y,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                gy: 330, drag: .93,
                size: rnd(2.2, 5.5),
                color: pick(palettes), shape: 'circle',
                glow: true, blend: true,
                twinkle: Math.random() < .6 ? { f: rnd(16, 30), ph: rnd(0, 6.28) } : null,
                ttl: rnd(.9, 1.8), fadeOut: .45
              });
            }
            addP({ type: 'ring', x: r.x, y: r.y, maxR: tier >= 5 ? 190 : 130, thick: 3, color: pick(palettes), blend: true, ttl: .55 });
          }
        });
      })(i);
    }
  }

  /** 稲妻。o: {bolts, color, tier} */
  function lightning(x, y, o) {
    var tier = o.tier || 4;
    var bolts = o.bolts || 4;
    for (var i = 0; i < bolts; i++) {
      var ang = (i / bolts) * 6.2832 + rnd(-.35, .35);
      var len = 220 + rnd(0, tier >= 5 ? 380 : 220);
      var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      var segs = 5 + (Math.random() * 4 | 0);
      var pts = [x, y];
      for (var j = 1; j < segs; j++) {
        var t = j / segs;
        pts.push(x + (ex - x) * t + rnd(-1, 1) * (tier >= 5 ? 110 : 70));
        pts.push(y + (ey - y) * t + rnd(-1, 1) * (tier >= 5 ? 110 : 70));
      }
      pts.push(ex, ey);
      addP({
        type: 'bolt', x: x, y: y, pts: pts,
        color: o.color || 'rgba(255,210,0,1)',
        glowW: tier >= 5 ? 9 : 6.5,
        coreW: tier >= 5 ? 2.6 : 1.8,
        seed: rnd(0, 9),
        blend: true,
        ttl: .26 + rnd(0, .14),
        fadeOut: .5,
        delay: i * .042
      });
    }
  }

  /** 拡がる衝撃波リング */
  function rings(x, y, o) {
    var n = o.count || 2;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'ring', x: x, y: y,
        maxR: (o.maxR || 300) + i * 60,
        thick: o.thickness || 3,
        color: o.color || 'rgba(255,160,64,.8)',
        blend: !!o.additive,
        ttl: .62 + i * .08,
        delay: i * (o.stagger || .11)
      });
    }
  }

  /** 絵文字フローター（下から浮上） */
  function floaters(o) {
    var glyphs = o.glyphs || ['✨'];
    var scale = o.scale || 1;
    var n = o.count || 14;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'glyph',
        glyph: pick(glyphs),
        x: rnd(0, W), y: H + rnd(10, 50),
        vx: rnd(-60, 60), vy: -rnd(H * .38, H * .95),
        drag: .99,
        size: rnd(24, 48) * scale,
        rot: rnd(-30, 30), vr: rnd(-140, 140),
        sway: { f: rnd(2, 4), ph: rnd(0, 6.28), amp: rnd(20, 60) },
        blend: false,
        ttl: rnd(.9, 1.7),
        fadeOut: .3,
        delay: (o.delay || 0) + rnd(0, .22)
      });
    }
  }

  /** その場でポンと弾ける小さなグリフ（正解時の絵文字ポップ） */
  function glyphBurst(x, y, o) {
    var glyphs = o.glyphs || ['✨'];
    var n = o.count || 6;
    var spread = o.spread || 100;
    for (var i = 0; i < n; i++) {
      var ang = rnd(-2.6, -.5); // 上方向中心
      var spd = rnd(spread, spread * 2.6);
      addP({
        type: 'glyph',
        glyph: pick(glyphs),
        x: x + rnd(-o.w / 2 || -20, o.w / 2 || 20), y: y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        gy: 620, drag: .96,
        size: rnd(20, 34),
        rot: rnd(-20, 20), vr: rnd(-220, 220),
        pop: true,
        blend: false,
        ttl: rnd(.55, .95),
        fadeOut: .4
      });
    }
  }

  // ── スチームパンク（ハブのゲージ演出用） ─────────────────────
  // 真鍮・銅はテーマに振らない固定色。study.html の試験演出は使っていないので、
  // ここを変えても EXAM_EFFECT_THEMES / CE_EFFECT_THEMES には影響しない。
  var BRASS = ['#C9A227', '#E0C25E', '#B87333', '#8C6D1F'];

  /** 歯車が弾け飛ぶ。o: {count, colors, spread, up, upBias, gravity, w, min, max, delay, stagger} */
  function gears(x, y, o) {
    o = o || {};
    var colors = o.colors || BRASS;
    var n = o.count || 10;
    var spread = o.spread || 380;
    for (var i = 0; i < n; i++) {
      // up:true は上方向へ吹き上げる（軸から吹き出す絵）。既定は全方位
      var ang = o.up ? rnd(-2.7, -.45) : rnd(0, 6.2832);
      var spd = rnd(spread * .3, spread);
      addP({
        x: x + rnd(-(o.w || 20), o.w || 20), y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (o.upBias || 0),
        gy: o.gravity != null ? o.gravity : 620, drag: .985,
        size: rnd(o.min || 13, o.max || 30),
        color: pick(colors), shape: 'gear',
        teeth: 6 + (Math.random() * 5 | 0),
        rot: rnd(0, 360), vr: rnd(-320, 320),
        glow: false, blend: false,
        ttl: rnd(1.1, 2.0), fadeOut: .28,
        delay: (o.delay || 0) + rnd(0, o.stagger || .18)
      });
    }
  }

  /** 歯車の雨（紙吹雪のスチームパンク版）。o: {count, colors, big, delay} */
  function gearRain(o) {
    o = o || {};
    var colors = o.colors || BRASS;
    var n = o.count || 40;
    for (var i = 0; i < n; i++) {
      addP({
        x: rnd(0, W), y: rnd(-70, -10),
        vx: rnd(-50, 50), vy: rnd(180, 420),
        gy: 150, drag: .995,
        size: rnd(12, o.big ? 42 : 28),
        color: pick(colors), shape: 'gear',
        teeth: 6 + (Math.random() * 5 | 0),
        rot: rnd(0, 360), vr: rnd(-260, 260),
        sway: { f: rnd(1.5, 3), ph: rnd(0, 6.28), amp: rnd(20, 60) },
        glow: false, blend: false,
        ttl: 3.2, fadeOut: .12,
        delay: (o.delay || 0) + rnd(0, .3)
      });
    }
  }

  /** 蒸気の噴出。o: {count, color, alpha, w, rise, min, max, grow, vx, delay, stagger} */
  function steam(x, y, o) {
    o = o || {};
    var n = o.count || 14, rise = o.rise || 100;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'steam',
        x: x + rnd(-(o.w || 26), o.w || 26), y: y + rnd(-8, 8),
        vx: rnd(-40, 40) + (o.vx || 0), vy: -rnd(rise, rise * 2.2),
        drag: .985,
        size: rnd(o.min || 26, o.max || 62),
        grow: o.grow != null ? o.grow : 2.4,
        color: o.color || '#E8E2D4',
        alpha: o.alpha != null ? o.alpha : .5,
        sway: { f: rnd(1.4, 2.8), ph: rnd(0, 6.28), amp: rnd(20, 55) },
        glow: false, blend: false,
        ttl: rnd(1.0, 1.9), fadeOut: .55,
        delay: (o.delay || 0) + rnd(0, o.stagger || .35)
      });
    }
  }

  /** 引力点（ブラックホール）。生きている間パーティクルを吸い込む */
  function attractor(x, y, o) {
    o = o || {};
    attractors.push({ x: x, y: y, age: 0, ttl: o.ttl || .9, strength: o.strength || 90000 });
    startLoop();
  }

  /** グリッチ帯（RGBスプリット風の水平バー） */
  function glitchBars(o) {
    o = o || {};
    var cols = o.colors || ['rgba(255,0,60,.3)', 'rgba(0,210,255,.3)', 'rgba(255,255,255,.22)'];
    var n = o.count || 10;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'bar',
        x: 0, y: 0,
        h: rnd(2, o.thick ? 14 : 9),
        color: pick(cols),
        blend: false,
        ttl: rnd(.14, o.long ? .4 : .28),
        fadeOut: .25,
        delay: rnd(0, .1)
      });
    }
  }

  /** 金粉・星屑（ゆっくり漂いキラキラ瞬く） */
  function dust(o) {
    o = o || {};
    var colors = o.colors || ['#FFD700', '#FFF3C4', '#FFFFFF'];
    var n = o.count || 50;
    for (var i = 0; i < n; i++) {
      addP({
        x: rnd(0, W), y: rnd(-20, H * .7),
        vx: rnd(-25, 25), vy: rnd(18, 70),
        size: rnd(1.6, 4),
        color: pick(colors), shape: 'circle',
        glow: true, blend: true,
        twinkle: { f: rnd(6, 18), ph: rnd(0, 6.28) },
        ttl: rnd(1.4, 2.8),
        fadeOut: .35,
        delay: (o.delay || 0) + rnd(0, .5)
      });
    }
  }

  // ── 2026-08-14 追加分 ───────────────────────────────────────
  // いずれも純増。既存エミッタの引数・既定値は変えていない（7テーマへ波及するため）。

  /**
   * 帯が割れて破片が落ちる。コンボメーターの崩落など「失われた」ことを描く。
   * o: {w, h, count, colors, gravity, spread, up, delay, ttl}
   */
  function shatter(x, y, o) {
    o = o || {};
    var colors = o.colors || ['#FFFFFF', '#FFD166', '#FF7043'];
    var n = o.count || 22;
    var w = o.w || 220, h = o.h || 8;
    var spread = o.spread || 260;
    for (var i = 0; i < n; i++) {
      // 帯の左右どちらに居たかで飛ぶ向きを分ける＝中心から裂けたように見える
      var fx = rnd(-w / 2, w / 2);
      var dir = fx < 0 ? -1 : 1;
      addP({
        x: x + fx, y: y + rnd(-h / 2, h / 2),
        vx: dir * rnd(spread * .08, spread) * (Math.abs(fx) / (w / 2) * .8 + .2),
        vy: -rnd(o.up == null ? 90 : o.up, (o.up == null ? 90 : o.up) + 190),
        gy: o.gravity != null ? o.gravity : 1500,
        drag: .995,
        size: rnd(5, 15),
        color: pick(colors),
        shape: Math.random() < .55 ? 'shard' : 'square',
        rot: rnd(0, 360), vr: rnd(-700, 700),
        glow: false, blend: false,
        ttl: o.ttl || rnd(.5, .95),
        fadeOut: .4,
        delay: (o.delay || 0) + rnd(0, .06)
      });
    }
  }

  /**
   * 2点間を走る光のリボン。視線を誘導したいときに使う（正解肢 → 解説など）。
   * o: {color, width, tail, ttl, grow, bow, glow, additive, delay}
   * bow は中間点を軌道の法線方向へどれだけ膨らませるか（px・既定は距離の18%）。
   */
  function ribbon(x0, y0, x1, y1, o) {
    o = o || {};
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var bow = o.bow == null ? len * .18 : o.bow;
    addP({
      type: 'ribbon',
      x: x0, y: y0,
      x0: x0, y0: y0, x1: x1, y1: y1,
      bx: (x0 + x1) / 2 - dy / len * bow,
      by: (y0 + y1) / 2 + dx / len * bow,
      size: o.width || 3,
      tail: o.tail == null ? .34 : o.tail,
      grow: o.grow || .55,
      color: o.color || '#FFD54F',
      glow: o.glow !== false,
      blend: o.additive !== false,
      ttl: o.ttl || .8,
      fadeOut: .3,
      delay: o.delay || 0
    });
  }

  /**
   * 刻印。輪が上から降ってきて「押され」、着地の瞬間に埃と衝撃波が出る。
   * o: {color, size, thick, ticks, rot, inner, dust, ttl, delay}
   */
  function stamp(x, y, o) {
    o = o || {};
    var col = o.color || '#E0C25E';
    var size = o.size || 120;
    var grow = .22;
    addP({
      type: 'stamp',
      x: x, y: y,
      size: size,
      thick: o.thick || 5,
      ticks: o.ticks || 0,
      inner: o.inner,
      from: o.from,
      grow: grow,
      rot: o.rot || 0,
      color: col,
      blend: false,
      ttl: o.ttl || .9,
      fadeOut: .45,
      delay: o.delay || 0
    });
    // 着地の瞬間＝輪が縮みきったところに合わせる
    var land = (o.delay || 0) + grow * .82;
    addP({
      type: 'ring', x: x, y: y,
      maxR: size * .95, thick: 2.5, color: col,
      blend: true, ttl: .42, delay: land
    });
    if (o.dust !== false) {
      for (var i = 0; i < 16; i++) {
        var ang = rnd(0, 6.2832);
        var spd = rnd(90, 320);
        addP({
          x: x + Math.cos(ang) * size * .4, y: y + Math.sin(ang) * size * .4,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 60,
          gy: 700, drag: .93,
          size: rnd(2.5, 6), color: col, shape: 'circle',
          glow: true, blend: true,
          ttl: rnd(.35, .7), fadeOut: .5,
          delay: land
        });
      }
    }
  }

  /**
   * 中心の周りを回る粒子。速度ではなく極座標で持つので軌道が崩れない。
   * o: {count, r, dr, va, colors, shapes, size, squash, ttl, glow, additive, teeth, delay}
   */
  function orbit(x, y, o) {
    o = o || {};
    var colors = o.colors || ['#FFD700', '#FFFFFF'];
    var shapes = o.shapes || ['circle'];
    var n = o.count || 12;
    var r = o.r || 90;
    var va = o.va == null ? 2.4 : o.va;
    for (var i = 0; i < n; i++) {
      var shape = pick(shapes);
      addP({
        type: 'orbit',
        cx: x, cy: y,
        r: r + rnd(-(o.spread || 14), o.spread || 14),
        a: (i / n) * 6.2832 + rnd(-.12, .12),
        va: va * (o.jitter === false ? 1 : rnd(.85, 1.15)),
        dr: o.dr || 0,
        squash: o.squash,
        x: x, y: y,
        size: o.size || rnd(3, 7),
        color: pick(colors),
        shape: shape,
        teeth: o.teeth || (6 + (Math.random() * 5 | 0)),
        rot: rnd(0, 360), vr: rnd(-200, 200),
        glow: o.glow !== false && shape === 'circle',
        blend: o.additive !== false,
        twinkle: Math.random() < .35 ? { f: rnd(10, 22), ph: rnd(0, 6.28) } : null,
        ttl: o.ttl || 1.4,
        fadeOut: .35,
        delay: (o.delay || 0) + rnd(0, o.stagger || 0)
      });
    }
  }

  /**
   * 走査線のように走る波形。心電図・同期の進行など「動いている」ことを描く。
   * o: {y, x0, x1, amp, freq, spike, spikeAt, color, width, tail, ttl, grow, glow, additive, delay}
   */
  function wave(o) {
    o = o || {};
    addP({
      type: 'wave',
      x: 0, y: o.y == null ? H * .5 : o.y,
      x0: o.x0 == null ? -20 : o.x0,
      x1: o.x1 == null ? W + 20 : o.x1,
      amp: o.amp == null ? 26 : o.amp,
      freq: o.freq == null ? 6 : o.freq,
      spike: o.spike || 0,
      spikeAt: o.spikeAt,
      tail: o.tail || 240,
      size: o.width || 2.5,
      grow: o.grow || .8,
      color: o.color || '#4DD0E1',
      glow: o.glow !== false,
      blend: o.additive !== false,
      ttl: o.ttl || 1.0,
      fadeOut: .25,
      delay: o.delay || 0
    });
  }

  window.MecFX = {
    burst: burst,
    confetti: confetti,
    glyphRain: glyphRain,
    petals: petals,
    warp: warp,
    bubbles: bubbles,
    fireworks: fireworks,
    lightning: lightning,
    rings: rings,
    floaters: floaters,
    glyphBurst: glyphBurst,
    gears: gears,
    gearRain: gearRain,
    steam: steam,
    attractor: attractor,
    glitchBars: glitchBars,
    dust: dust,
    shatter: shatter,
    ribbon: ribbon,
    stamp: stamp,
    orbit: orbit,
    wave: wave,
    clear: clearAll,
    count: function () { return pool.length; }
  };
})();
