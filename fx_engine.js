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
    if (pool.length >= MAX_PARTICLES) {
      // 連打・高頻度発火時のオーバーフロー保護: 古い粒子を破棄して最新演出を優先
      pool.splice(0, Math.min(pool.length, 300));
    }
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
  var STATIC_TYPES = {
    bar: 1, bolt: 1, ring: 1, stamp: 1, wave: 1, ribbon: 1,
    astrolabe: 1, iris: 1, ripple_interfere: 1, chronos_dial: 1, bearing_orbit: 1
  };

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
      case 'astrolabe': {
        // 【案1】天球儀アストロラーベ: 相互逆回転する目盛り付き精密同心円 ＆ 公転ドット
        var scA = easeOutCubic(t);
        var nR = p.rings || 3;
        ctx.save();
        ctx.translate(x, y);
        for (var ri = 0; ri < nR; ri++) {
          var cr = (p.maxR * (0.28 + 0.72 * (ri + 1) / nR)) * scA;
          if (cr <= 2) continue;
          var dir = (ri % 2 === 0 ? 1 : -1);
          var rotA = dir * (p.speed || 1.6) * t;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.8, (p.thick || 2.2) * (1 - t * 0.4));
          // 二重円軌道
          ctx.beginPath(); ctx.arc(0, 0, cr, 0, 6.2832); ctx.stroke();
          if (ri === nR - 1) {
            ctx.beginPath(); ctx.arc(0, 0, cr * 0.92, 0, 6.2832); ctx.stroke();
          }
          // 目盛り (Ticks)
          var nTicks = 12 * (ri + 1);
          for (var ti = 0; ti < nTicks; ti++) {
            var aTi = rotA + ti / nTicks * 6.2832;
            var tLen = (ti % 4 === 0) ? cr * 0.12 : cr * 0.06;
            ctx.beginPath();
            ctx.moveTo(Math.cos(aTi) * (cr - tLen), Math.sin(aTi) * (cr - tLen));
            ctx.lineTo(Math.cos(aTi) * cr, Math.sin(aTi) * cr);
            ctx.stroke();
          }
          // 公転ドット (Orbiting satellites)
          var nDots = 2 + ri;
          ctx.fillStyle = p.color;
          for (var di = 0; di < nDots; di++) {
            var aDi = rotA * 2.2 + di / nDots * 6.2832;
            var dx2 = Math.cos(aDi) * cr, dy2 = Math.sin(aDi) * cr;
            ctx.beginPath(); ctx.arc(dx2, dy2, (p.thick || 2.2) * 1.4, 0, 6.2832); ctx.fill();
          }
        }
        ctx.restore();
        return;
      }
      case 'iris': {
        // 【案2】アイリスシャッター: 螺旋状に開く真鍮絞り羽 ＆ 放射サンバースト
        var scI = easeOutCubic(t);
        var nB = p.blades || 10;
        var rI = p.maxR * scI;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (p.thick || 2.5) * (1 - t * 0.35));
        var rotI = t * 1.2;
        // 放射光条 (Sunburst)
        if (p.sunburst !== false) {
          ctx.lineWidth = 0.9;
          for (var sb = 0; sb < nB * 2; sb++) {
            var asb = sb / (nB * 2) * 6.2832 + rotI * 0.5;
            ctx.beginPath();
            ctx.moveTo(Math.cos(asb) * (rI * 0.4), Math.sin(asb) * (rI * 0.4));
            ctx.lineTo(Math.cos(asb) * (rI * 1.2), Math.sin(asb) * (rI * 1.2));
            ctx.stroke();
          }
        }
        // 絞り羽ブレード
        ctx.lineWidth = Math.max(1.2, (p.thick || 2.5));
        for (var bi = 0; bi < nB; bi++) {
          var ab = bi / nB * 6.2832 + rotI;
          var x0 = Math.cos(ab) * (rI * 0.25);
          var y0 = Math.sin(ab) * (rI * 0.25);
          var x1 = Math.cos(ab + 1.2) * rI;
          var y1 = Math.sin(ab + 1.2) * rI;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        // 外周枠
        ctx.beginPath(); ctx.arc(0, 0, rI, 0, 6.2832); ctx.stroke();
        ctx.restore();
        return;
      }
      case 'ripple_interfere': {
        // 【案3】多重波紋干渉: 3軸パルス ＆ 交点スパーク
        var scR = easeOutCubic(t);
        var rR = p.maxR * scR;
        var span = p.span || 70;
        var pts = [{x: x, y: y}, {x: x - span, y: y + span * 0.2}, {x: x + span, y: y + span * 0.2}];
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.8, (p.thick || 2.0) * (1 - t * 0.5));
        for (var pi = 0; pi < pts.length; pi++) {
          var pt = pts[pi];
          for (var rw = 0; rw < 2; rw++) {
            var subR = Math.max(2, (rR - rw * 22) * (pi === 0 ? 1 : 0.75));
            if (subR > 0) {
              ctx.beginPath(); ctx.arc(pt.x, pt.y, subR, 0, 6.2832); ctx.stroke();
            }
          }
        }
        // 交点スパーク (Spark at intersections)
        if (rR > span * 0.5 && t < 0.8) {
          ctx.fillStyle = '#FFFFFF';
          var spY = y + Math.sin(t * 12) * 8;
          ctx.beginPath(); ctx.arc(x - span * 0.45, spY, 2.5, 0, 6.2832); ctx.fill();
          ctx.beginPath(); ctx.arc(x + span * 0.45, spY, 2.5, 0, 6.2832); ctx.fill();
        }
        return;
      }
      case 'chronos_dial': {
        // 【案4】クロノス・タイムダイヤル: 時計文字盤 ＆ 360度走査針
        var scC = easeOutCubic(t);
        var rC = p.maxR * scC;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.8, (p.thick || 2.0));
        // 3重文字盤円
        ctx.beginPath(); ctx.arc(0, 0, rC, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, rC * 0.78, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, rC * 0.45, 0, 6.2832); ctx.stroke();
        // 12時間インデックス
        for (var hi = 0; hi < 12; hi++) {
          var ah = hi / 12 * 6.2832;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ah) * (rC * 0.78), Math.sin(ah) * (rC * 0.78));
          ctx.lineTo(Math.cos(ah) * rC, Math.sin(ah) * rC);
          ctx.stroke();
        }
        // 走査針 (Scan Hand)
        var aHand = t * 6.2832 * 1.75;
        ctx.lineWidth = Math.max(1.5, (p.thick || 2.0) * 1.5);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(aHand) * rC, Math.sin(aHand) * rC); ctx.stroke();
        // 走査残像
        ctx.fillStyle = p.color;
        ctx.globalAlpha *= 0.25;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rC, aHand - 0.75, aHand); ctx.closePath(); ctx.fill();
        ctx.restore();
        return;
      }
      case 'bearing_orbit': {
        // 【案5】真鍮ベアリング・オービット: 周回光球 ＆ 軌道ジャンプ
        var scB = easeOutCubic(t);
        var rB = p.maxR * scB;
        var nBalls = p.balls || 8;
        ctx.save();
        ctx.translate(x, y);
        // 2本の同心円レール
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, rB * 0.55, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, rB, 0, 6.2832); ctx.stroke();
        // 光球
        ctx.fillStyle = p.color;
        for (var bi2 = 0; bi2 < nBalls; bi2++) {
          var aB = bi2 / nBalls * 6.2832 + t * 4.5;
          // 半径が内側レールから外側レールへシフト
          var curRB = rB * (0.55 + 0.45 * Math.min(1, t * 1.5));
          var bx = Math.cos(aB) * curRB, by = Math.sin(aB) * curRB;
          ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, 6.2832); ctx.fill();
          // 尾
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(Math.cos(aB - 0.25) * curRB, Math.sin(aB - 0.25) * curRB);
          ctx.stroke();
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

  /**
   * 【新規】除細動スパーク（ecg用）。可視帯を横断する鋭い放電ボルトと微小粒子。
   * o: {y, color, count, boltCols, delay}
   */
  function defibShock(x, y, o) {
    o = o || {};
    var cy = y == null ? H * .5 : y;
    var cx = x == null ? W * .5 : x;
    var col = o.color || '#00E676';
    // 水平スパークボルト2本
    for (var b = 0; b < 2; b++) {
      var pts = [-20, cy + rnd(-15, 15)];
      var segs = 8;
      var span = W + 40;
      for (var j = 1; j < segs; j++) {
        var t = j / segs;
        pts.push(-20 + span * t, cy + rnd(-35, 35));
      }
      pts.push(W + 20, cy + rnd(-15, 15));
      addP({
        type: 'bolt', x: 0, y: cy, pts: pts,
        color: o.boltColor || '#00E5FF',
        glowW: 8, coreW: 2.2,
        seed: rnd(0, 9), blend: true,
        ttl: .28, fadeOut: .4,
        delay: (o.delay || 0) + b * .06
      });
    }
    // 放電粒子
    var n = o.count || 28;
    for (var i = 0; i < n; i++) {
      var ang = rnd(0, 6.2832);
      var spd = rnd(120, 520);
      addP({
        x: cx + rnd(-80, 80), y: cy + rnd(-15, 15),
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * .45,
        gy: 300, drag: .91,
        size: rnd(2, 5),
        color: pick(o.colors || ['#00E676', '#69F0AE', '#00E5FF', '#FFFFFF']),
        shape: 'circle', glow: true, blend: true,
        ttl: rnd(.35, .75), fadeOut: .4,
        delay: o.delay || 0
      });
    }
  }

  /**
   * 【新規】和風墨飛沫（ink用）。筆払いのように斜めに流れる墨と和紙繊維。
   * o: {x, y, count, colors, delay}
   */
  function brushDust(x, y, o) {
    o = o || {};
    var cx = x == null ? W * .5 : x;
    var cy = y == null ? H * .5 : y;
    var n = o.count || 22;
    var cols = o.colors || ['#C93A3A', '#8B1E1E', '#1a1a1a', '#C9A24B', '#F5EFE0'];
    for (var i = 0; i < n; i++) {
      var ang = rnd(-.6, .6) - .4; // 右上方向への払い
      var spd = rnd(180, 680);
      addP({
        x: cx + rnd(-30, 30), y: cy + rnd(-20, 20),
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        gy: 550, drag: .93,
        size: rnd(3, 9),
        color: pick(cols),
        shape: Math.random() > .4 ? 'blob' : 'shard',
        rot: rnd(0, 360), vr: rnd(-300, 300),
        glow: false, blend: false,
        ttl: rnd(.45, .95), fadeOut: .35,
        delay: o.delay || 0
      });
    }
  }

  /**
   * 【新規】8bitピクセルバースト（retro用）。正方形のピクセルが格子状に跳ねる。
   * o: {x, y, count, colors, delay}
   */
  function pixelPop(x, y, o) {
    o = o || {};
    var cx = x == null ? W * .5 : x;
    var cy = y == null ? H * .5 : y;
    var n = o.count || 24;
    var cols = o.colors || ['#FF1053', '#00A8E8', '#FFD400', '#00E676', '#FFFFFF'];
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * 6.2832 + rnd(-.15, .15);
      var spd = rnd(160, 560);
      addP({
        x: cx, y: cy,
        vx: Math.round(Math.cos(ang) * spd / 20) * 20, // 8bit風のステップ
        vy: Math.round(Math.sin(ang) * spd / 20) * 20 - 120,
        gy: 850, drag: .94,
        size: rnd(5, 10),
        color: pick(cols),
        shape: 'square',
        glow: false, blend: false,
        ttl: rnd(.45, .85), fadeOut: .2,
        delay: o.delay || 0
      });
    }
  }

  /**
   * 【新規】ダイヤモンド＆金箔（luxury用）。幾何学ダイヤと金箔の舞い落ち。
   * o: {x, y, count, colors, delay}
   */
  function diamondSparkle(x, y, o) {
    o = o || {};
    var cx = x == null ? W * .5 : x;
    var cy = y == null ? H * .5 : y;
    var n = o.count || 26;
    var cols = o.colors || ['#FFD700', '#F7E7CE', '#FFF3C4', '#C9A227', '#FFFFFF'];
    for (var i = 0; i < n; i++) {
      var ang = rnd(0, 6.2832);
      var spd = rnd(80, 420);
      addP({
        x: cx + rnd(-20, 20), y: cy + rnd(-20, 20),
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 140,
        gy: 420, drag: .95,
        size: rnd(4, 9),
        color: pick(cols),
        shape: Math.random() > .5 ? 'gem' : 'shard',
        rot: rnd(0, 360), vr: rnd(-240, 240),
        flut: { f: rnd(8, 16), ph: rnd(0, 6.28) },
        glow: true, blend: true,
        ttl: rnd(.6, 1.2), fadeOut: .3,
        delay: o.delay || 0
      });
    }
  }

  /**
   * 【新規】神速の一閃スラッシュ（超速答用）。2点間を高速で切り裂く光刃。
   * o: {x0, y0, x1, y1, color, width, ttl, delay}
   */
  function slashRibbon(x0, y0, x1, y1, o) {
    o = o || {};
    var col = o.color || '#FFE040';
    addP({
      type: 'ribbon',
      x0: x0, y0: y0,
      x1: x1, y1: y1,
      bx: (x0 + x1) / 2 + (o.curveX || 0),
      by: (y0 + y1) / 2 + (o.curveY || 0),
      size: o.width || 4,
      grow: .35,
      tail: .45,
      color: col,
      glow: true,
      blend: true,
      ttl: o.ttl || .48,
      delay: o.delay || 0
    });
  }

  /** 音波ビジュアライザー（正解音と同期する同心多重音波） */
  function sonicWave(x, y, o) {
    o = o || {};
    var n = o.count || 3;
    var maxR = o.maxR || 260;
    var color = o.color || '#FFD700';
    var thick = o.thickness || 3.5;
    for (var i = 0; i < n; i++) {
      addP({
        type: 'ring',
        x: x, y: y,
        r0: 12 + i * 8,
        r1: maxR + i * 30,
        thickness: thick,
        color: color,
        blend: true,
        ttl: 0.55 + i * 0.12,
        delay: (o.delay || 0) + i * 0.07
      });
    }
  }

  /** 接点電気スパーク（微細な高圧放電火花） */
  function sparks(x, y, o) {
    o = o || {};
    var n = o.count || 8;
    var colors = o.colors || ['#00E5FF', '#FFFFFF', '#69F0AE'];
    for (var i = 0; i < n; i++) {
      var ang = rnd(0, 6.2832);
      var spd = rnd(120, 360);
      addP({
        x: x, y: y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        gy: 400, drag: 0.88,
        size: rnd(1.5, 3.2),
        color: pick(colors),
        shape: 'circle',
        glow: true, blend: true,
        ttl: rnd(0.18, 0.35),
        fadeOut: 0.8
      });
    }
  }

  /** 【案1】天球儀アストロラーベ: 相互逆回転する目盛り付き精密同心円 ＆ 公転ドット */
  function astrolabeRings(x, y, o) {
    o = o || {};
    addP({
      type: 'astrolabe',
      x: x == null ? W * .5 : x,
      y: y == null ? H * .5 : y,
      maxR: o.maxR || 220,
      rings: o.rings || 3,
      thick: o.thickness || 2.4,
      speed: o.speed || 1.6,
      color: o.color || '#E0C25E',
      blend: o.additive !== false,
      ttl: o.ttl || 1.1,
      fadeOut: o.fadeOut || 0.35,
      delay: o.delay || 0
    });
  }

  /** 【案2】アイリスシャッター: 螺旋状に開く真鍮絞り羽 ＆ 放射サンバースト */
  function irisShutter(x, y, o) {
    o = o || {};
    addP({
      type: 'iris',
      x: x == null ? W * .5 : x,
      y: y == null ? H * .5 : y,
      maxR: o.maxR || 240,
      blades: o.blades || 10,
      thick: o.thickness || 2.5,
      color: o.color || '#FFD700',
      sunburst: o.sunburst !== false,
      blend: o.additive !== false,
      ttl: o.ttl || 0.85,
      fadeOut: o.fadeOut || 0.3,
      delay: o.delay || 0
    });
  }

  /** 【案3】多重波紋干渉: 3軸パルス ＆ 交点スパーク */
  function rippleInterference(x, y, o) {
    o = o || {};
    addP({
      type: 'ripple_interfere',
      x: x == null ? W * .5 : x,
      y: y == null ? H * .5 : y,
      maxR: o.maxR || 220,
      span: o.span || 70,
      thick: o.thickness || 2.0,
      color: o.color || '#E0C25E',
      blend: o.additive !== false,
      ttl: o.ttl || 0.9,
      fadeOut: o.fadeOut || 0.35,
      delay: o.delay || 0
    });
  }

  /** 【案4】クロノス・タイムダイヤル: 時計文字盤 ＆ 360度走査針 */
  function chronosDial(x, y, o) {
    o = o || {};
    addP({
      type: 'chronos_dial',
      x: x == null ? W * .5 : x,
      y: y == null ? H * .5 : y,
      maxR: o.maxR || 230,
      thick: o.thickness || 2.0,
      color: o.color || '#FFD700',
      blend: o.additive !== false,
      ttl: o.ttl || 1.0,
      fadeOut: o.fadeOut || 0.35,
      delay: o.delay || 0
    });
  }

  /** 【案5】真鍮ベアリング・オービット: 周回光球 ＆ 軌道ジャンプ */
  function bearingOrbit(x, y, o) {
    o = o || {};
    addP({
      type: 'bearing_orbit',
      x: x == null ? W * .5 : x,
      y: y == null ? H * .5 : y,
      maxR: o.maxR || 210,
      balls: o.balls || 8,
      color: o.color || '#E0C25E',
      blend: o.additive !== false,
      ttl: o.ttl || 0.95
    });
  }

  /** 【4テーマ特化】漆黒金継ぎ・禅: 金継ぎクラック修復 ＆ 金粉光彩 */
  function kintsugiCrack(cx, cy, o) {
    o = o || {};
    cx = cx == null ? W * .5 : cx;
    cy = cy == null ? H * .5 : cy;
    var gold = '#F5D061', goldLight = '#FFF2A8', goldDark = '#D4AF37';
    // 1. 折れ線クラック（金色の亀裂が走る）
    var branches = o.branches || 4;
    for (var b = 0; b < branches; b++) {
      var angle = (b / branches) * Math.PI * 2 + rnd(-0.3, 0.3);
      var segLen1 = rnd(40, 75);
      var x1 = cx + Math.cos(angle) * segLen1;
      var y1 = cy + Math.sin(angle) * segLen1;
      slashRibbon(cx, cy, x1, y1, { color: gold, width: 3.5, ttl: 0.42, delay: b * 0.02 });

      var angle2 = angle + rnd(-0.6, 0.6);
      var segLen2 = rnd(35, 65);
      var x2 = x1 + Math.cos(angle2) * segLen2;
      var y2 = y1 + Math.sin(angle2) * segLen2;
      slashRibbon(x1, y1, x2, y2, { color: goldLight, width: 2.2, ttl: 0.48, delay: 0.04 + b * 0.02 });
    }
    // 2. 金粉スパーク＆ブラシダスト
    sparks(cx, cy, { count: o.sparksCount || 18, colors: [gold, goldLight, goldDark, '#FFFFFF'] });
    brushDust({ count: o.dustCount || 14, colors: [gold, goldDark, '#FFE57F'] });
    // 3. 継ぎ目修復の金光グローリング
    rings(cx, cy, { count: 2, maxR: o.maxR || 180, color: gold, additive: true });
  }

  /** 【4テーマ特化】賢者の星図・魔導書: 天球儀回転 ＆ 星座ルーンフラッシュ */
  function celestialAstrolabe(cx, cy, o) {
    o = o || {};
    cx = cx == null ? W * .5 : cx;
    cy = cy == null ? H * .5 : cy;
    var starGold = '#FFD166', manaPurple = '#8A2BE2', cyanGlow = '#48CAE4';
    // 1. 天球儀リング
    astrolabeRings(cx, cy, { maxR: o.maxR || 240, color: starGold, additive: true });
    // 2. 星座接続ライン（星と星を結ぶ神速の光芒）
    var starsN = 6;
    var pts = [];
    for (var s = 0; s < starsN; s++) {
      var a = (s / starsN) * Math.PI * 2 + rnd(-0.2, 0.2);
      var r = rnd(50, 110);
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    for (var i = 0; i < pts.length; i++) {
      var nextP = pts[(i + 1) % pts.length];
      slashRibbon(pts[i].x, pts[i].y, nextP.x, nextP.y, { color: starGold, width: 2.2, ttl: 0.45, delay: i * 0.03 });
    }
    // 3. 星屑ダイヤモンドスパークル
    diamondSparkle(cx, cy, { count: o.sparkleCount || 20, color: starGold, additive: true });
    // 4. 魔導星図リング
    rings(cx, cy, { count: 2, maxR: (o.maxR || 240) * 0.8, color: cyanGlow, additive: true });
    // 5. 魔導ルーンの煌めき
    sparks(cx, cy, { count: o.sparksCount || 14, colors: [starGold, manaPurple, cyanGlow, '#FFFFFF'] });
  }

  /** 【4テーマ特化】深海アビス・発光生物: 生体発光ソナー波紋 ＆ 発光生物パルス */
  function abyssSonarPulse(cx, cy, o) {
    o = o || {};
    cx = cx == null ? W * .5 : cx;
    cy = cy == null ? H * .5 : cy;
    var emerald = '#00FFA3', deepCyan = '#00B4D8', bioGlow = '#64FFDA';
    // 1. ソナー波紋干渉
    rippleInterference(cx, cy, { maxR: o.maxR || 230, color: emerald });
    sonicWave(cx, cy, { count: 3, maxR: (o.maxR || 230) * 1.1, color: deepCyan, thickness: 2.8 });
    // 2. 生体発光微粒子バブル
    bubbles(cx, cy, { count: o.bubbleCount || 18, colors: [emerald, deepCyan, bioGlow] });
    // 3. 発光パルス
    sparks(cx, cy, { count: o.sparksCount || 12, colors: [emerald, bioGlow, '#FFFFFF'] });
  }

  /** 【4テーマ特化】絶対零度・フロスト氷晶: 幾何学結晶急成長 ＆ ダイヤモンドダスト */
  function frostCrystalShatter(cx, cy, o) {
    o = o || {};
    cx = cx == null ? W * .5 : cx;
    cy = cy == null ? H * .5 : cy;
    var iceBlue = '#70D6FF', crystalWhite = '#FFFFFF', frostCyan = '#A0E7E5';
    // 1. 氷晶ファセット破砕
    shatter(cx, cy, { count: o.shatterCount || 24, colors: [iceBlue, crystalWhite, frostCyan] });
    // 2. ダイヤモンドダスト閃光
    diamondSparkle(cx, cy, { count: o.sparkleCount || 22, color: crystalWhite, additive: true });
    // 3. 氷結衝撃リング
    rings(cx, cy, { count: 2, maxR: o.maxR || 190, color: iceBlue, additive: true });
    // 4. 極微粉氷ダスト
    dust({ count: o.dustCount || 16, colors: [iceBlue, crystalWhite] });
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
    defibShock: defibShock,
    brushDust: brushDust,
    pixelPop: pixelPop,
    diamondSparkle: diamondSparkle,
    slashRibbon: slashRibbon,
    sonicWave: sonicWave,
    sparks: sparks,
    astrolabeRings: astrolabeRings,
    irisShutter: irisShutter,
    rippleInterference: rippleInterference,
    chronosDial: chronosDial,
    bearingOrbit: bearingOrbit,
    kintsugiCrack: kintsugiCrack,
    celestialAstrolabe: celestialAstrolabe,
    abyssSonarPulse: abyssSonarPulse,
    frostCrystalShatter: frostCrystalShatter,
    clear: clearAll,
    count: function () { return pool.length; }
  };
})();
