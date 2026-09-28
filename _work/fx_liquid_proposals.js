/* Liquid の正解演出の新しい案（デモページ専用）。
   _work/fx_all_demo.html が枠（study.html）の中へ <script> で差し込み、_lqLiquidFx を一時的に差し替えて
   本物の _rfCorrectFx から呼ぶ＝送りの時間・連続数・段の判定は実物と同じ。
   study.html からは読まれない（本番には入っていない）。採用が決まったら study_exam.js へ移す。
   これまでの経緯（すべて 2026-09-28）:
     第1弾 K 窓ガラスの雫・L 水銀・M シャボン玉・N 満ちる・O 渦 → M を採用（_lqSoapFx）
     第2弾 P 噴水・Q 炭酸・R 霧の虹・S 水中の光・T 金魚 → 全部不採用
     第3弾 U ガラスの衝撃波・V 液体の○・W 垂れる絵の具・X 液体の額縁・Y ホログラム・Z 跳ねる玉・AA 波形・
           AB ブロブ・AC ドットの波紋・AD ぷるん → U と AD を採用（シャボン玉と3つ重ねて _lqLiquidFx）
     第4弾（このファイル）「もうちょっとおしゃれに」＝映画・雑誌・最近のUIの語彙で10案。今の3つに**足す**前提。
   構造は実物と同じ:
     ① 肢の層（肢の中・文字の裏）…… _rfFit で送り（403ms）の 50ms 手前までに終える
     ② 全画面の層（_rfFullHost）……… 元の尺のまま（_rfK = 1）最後まで
   ⚠️ 肢の文字の色・影を一時的に変える案（BB・BC）は el.animate で戻す＝後に何も残さない。
   ⚠️ 選択肢に水平の線を作らない（下線部はこの教材で意味を持つ記号）。 */
(() => {
  const P = window.__LQP = {};
  const R = (a, b) => a + Math.random() * (b - a);
  const C = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const EO = t => 1 - Math.pow(1 - t, 3);
  const EIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const SS = (a, b, x) => { const t = C((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const IRI = ['#ff6ec7', '#ffd36e', '#6effc0', '#6ecbff', '#b66eff', '#ff6ec7'];
  const PAL = ['#FF007F', '#B03CFF', '#FF7A00', '#2FE0D5'];

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
  let styled = false;
  function css() {
    if (styled) return; styled = true;
    const s = document.createElement('style');
    s.textContent = `
      @property --lqp-a { syntax:'<angle>'; inherits:false; initial-value:0deg; }
      .lqp-check { position:absolute; right:12px; top:50%; translate:0 -50%; width:26px; height:26px; pointer-events:none; overflow:visible; z-index:2; }
      .lqp-gt { position:absolute; inset:0; pointer-events:none; z-index:2; box-sizing:border-box; border-color:transparent !important; background-color:transparent !important; box-shadow:none !important; }
      .lqp-gt, .lqp-gt * { color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; }
      .lqp-gt::before, .lqp-gt::after, .lqp-gt *::before, .lqp-gt *::after { display:none !important; }
      .lqp-gt * { background:none !important; border-color:transparent !important; box-shadow:none !important; }
      .lqp-glass { position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:2; }
      .lqp-word { position:absolute; left:0; right:0; text-align:center; pointer-events:none; white-space:nowrap;
        font-family:"Didot","Bodoni 72","Playfair Display","Hiragino Mincho ProN","Yu Mincho",Georgia,serif; font-style:italic; font-weight:400;
        background:linear-gradient(100deg,#ff6ec7,#ffd36e 30%,#ffffff 45%,#6ecbff 65%,#b66eff); -webkit-background-clip:text; background-clip:text;
        color:transparent; -webkit-text-fill-color:transparent; }
    `;
    document.head.appendChild(s);
  }

  /* 肢の文字だけを写した透明な重ね（位置・字詰めは元の肢と同じ）。色は呼び出し側で付ける。
     ⚠️ Liquid の正解の肢は text-shadow / box-shadow が !important＝el.animate では上書きできないので、重ねで見せる。 */
  function textClone(el) {
    css();
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const cs = getComputedStyle(el);
    const cl = document.createElement('div');
    cl.className = 'lqp-gt';
    cl.setAttribute('aria-hidden', 'true');
    ['display', 'alignItems', 'justifyContent', 'gap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'textAlign',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle', 'flexDirection', 'flexWrap'].forEach(p => { cl.style[p] = cs[p]; });
    cl.style.left = -parseFloat(cs.borderLeftWidth) + 'px'; cl.style.top = -parseFloat(cs.borderTopWidth) + 'px';
    cl.style.right = -parseFloat(cs.borderRightWidth) + 'px'; cl.style.bottom = -parseFloat(cs.borderBottomWidth) + 'px';
    [...el.childNodes].forEach(n => {   // 演出の層（.lq-layer・.lqp-*・.rf-*・svg）は写さない
      if (n.nodeType === 3) cl.appendChild(n.cloneNode(true));
      else if (n.nodeType === 1 && typeof n.className === 'string' && !/lq-layer|lqp-|rf-/.test(n.className)) cl.appendChild(n.cloneNode(true));
    });
    cl.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    return cl;
  }

  /* ══════════ AE ✓の一筆（CHECK STROKE）══════════
     肢の右端に、細いグラデーションの「✓」がペン先で一筆書きされ、少し残ってから消える（肢と一緒に流れる）。
     段3〜はペン先の光が✓の上をもう一度なぞり、段が上がった瞬間は✓のまわりに細い輪が描かれる。 */
  P.AE = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    css();
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const k = _rfFit(budget, 360);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const id = 'lqpg' + Math.random().toString(36).slice(2, 8);
    const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sv.setAttribute('viewBox', '0 0 26 26'); sv.setAttribute('class', 'lqp-check'); sv.setAttribute('aria-hidden', 'true');
    sv.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF4FA3"/><stop offset=".5" stop-color="#FFB86B"/><stop offset="1" stop-color="#6EE7F0"/></linearGradient></defs>`
      + (up ? `<circle cx="13" cy="13" r="12" fill="none" stroke="url(#${id})" stroke-width="1" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" class="rg"/>` : '')
      + `<path d="M5.5 13.5 L10.5 18.5 L20.5 7.5" fill="none" stroke="url(#${id})" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" class="ck"/>`
      + (t >= 3 ? `<path d="M5.5 13.5 L10.5 18.5 L20.5 7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray=".12 1" stroke-dashoffset=".12" opacity="0" class="sh"/>` : '');
    el.appendChild(sv);
    const ck = sv.querySelector('.ck');
    ck.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300 * k, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    const sh = sv.querySelector('.sh');
    if (sh) sh.animate([{ strokeDashoffset: .12, opacity: 1 }, { strokeDashoffset: -1, opacity: 1 }], { duration: 420, delay: 300 * k, easing: 'ease-in-out', fill: 'forwards' });
    const rg = sv.querySelector('.rg');
    if (rg) rg.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 500, delay: 150 * k, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    sv.animate([{ opacity: 1 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 1600, fill: 'forwards' });
    setTimeout(() => sv.remove(), 1650);
  };

  /* ══════════ BB 文字の虹色ワイプ（IRIDESCENT TYPE）══════════
     正解の肢の**文字そのもの**を、虹色のグラデーションが左から右へ撫でていく（文字の形のまま色だけが流れる）。
     飾りを1つも足さない、いちばん静かな案。段3〜は2回撫で、段が上がった瞬間は文字がしばらく虹色のまま光って戻る。 */
  P.BB = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    css();
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const k = _rfFit(budget, 360);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const cl = textClone(el);
    const g = 'linear-gradient(100deg, transparent 0 30%, #ff6ec7 38%, #ffd36e 44%, #ffffff 50%, #6ecbff 56%, #b66eff 62%, transparent 70% 100%)';
    cl.style.setProperty('background-image', g, 'important');
    cl.style.setProperty('background-size', '300% 100%', 'important');
    cl.style.setProperty('-webkit-background-clip', 'text', 'important');
    cl.style.setProperty('background-clip', 'text', 'important');
    el.appendChild(cl);
    const passes = (t >= 3 || up) ? 2 : 1, D = 340 * k;
    const kf = [];
    for (let i = 0; i < passes; i++) { kf.push({ backgroundPosition: '100% 0', offset: i / passes }, { backgroundPosition: '0% 0', offset: (i + 1) / passes - .001 }); }
    cl.animate(kf, { duration: D, easing: 'linear', fill: 'forwards' });
    if (up) {
      cl.style.setProperty('background-image', 'linear-gradient(100deg,#ff6ec7,#ffd36e,#6effc0,#6ecbff,#b66eff,#ff6ec7)', 'important');
      cl.animate([{ backgroundPosition: '0% 0', opacity: 1 }, { backgroundPosition: '100% 0', opacity: 1, offset: .7 }, { backgroundPosition: '100% 0', opacity: 0 }], { duration: 1400, fill: 'forwards' });
      setTimeout(() => cl.remove(), 1450);
    } else setTimeout(() => cl.remove(), D + 30);
  };

  /* ══════════ BC 色収差（CHROMATIC SPLIT）══════════
     正解の肢の文字が一瞬だけマゼンタとシアンに左右へ分かれ、すっと重なって戻る（ファッション誌の写真のような）。
     段3〜はカード全体の輪郭も分かれて戻り、段が上がった瞬間は2回、幅も大きく。 */
  P.BC = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const k = _rfFit(budget, 340);
    const d = up ? 5 : 3.5, D = 340 * k;
    [['#FF007F', -1], ['#2FE0D5', 1]].forEach(([col, sg]) => {
      const cl = textClone(el);
      cl.style.setProperty('-webkit-text-fill-color', 'initial', 'important');
      cl.querySelectorAll('*').forEach(n => n.style.setProperty('-webkit-text-fill-color', col, 'important'));
      cl.style.setProperty('color', col, 'important'); cl.style.setProperty('-webkit-text-fill-color', col, 'important');
      cl.style.mixBlendMode = 'screen';
      el.appendChild(cl);
      const kf = up
        ? [{ translate: '0 0', opacity: 0 }, { translate: `${sg * d}px 0`, opacity: .95, offset: .15 }, { translate: `${sg}px 0`, opacity: .6, offset: .4 }, { translate: `${sg * d * .7}px 0`, opacity: .85, offset: .6 }, { translate: '0 0', opacity: 0 }]
        : [{ translate: '0 0', opacity: 0 }, { translate: `${sg * d}px 0`, opacity: .9, offset: .2 }, { translate: `${sg}px 0`, opacity: .5, offset: .55 }, { translate: '0 0', opacity: 0 }];
      cl.animate(kf, { duration: D, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => cl.remove(), D + 30);
    });
    if (card && (t >= 3 || up)) {
      const f = (x, a) => `drop-shadow(${-x}px 0 0 rgba(255,0,127,${a})) drop-shadow(${x}px 0 0 rgba(47,224,213,${a}))`;
      card.animate([{ filter: f(0, 0) }, { filter: f(up ? 6 : 3, .7), offset: .25 }, { filter: f(0, 0) }], { duration: 420, easing: 'ease-out' });
    }
  };

  /* ══════════ BD ボケ（BOKEH）══════════
     タップ位置のまわりに、ピントの外れた光の玉（縁が少し明るい柔らかい円）がふわりと浮かび、ゆっくり昇って消える。
     映画の夜景の背景のような光。段で玉の数と大きさが増え、段が上がった瞬間は画面いっぱいに大きなボケが広がる。 */
  P.BD = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    if (!card) return;
    const DUR = 2600 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const n = up ? 46 : 12 + t * 3;
    const cols = ['255,79,163', '255,184,107', '110,231,240', '182,110,255', '255,255,255'];
    const bs = Array.from({ length: n }, (_, i) => {
      const a = R(0, 7), d = up ? R(0, Math.max(VW, VH) * .6) : R(10, 90 + t * 25);
      return { x: (up ? VW / 2 : o.cx) + Math.cos(a) * d, y: (up ? VH / 2 : o.cy) + Math.sin(a) * d * .7, r: R(8, 22) * (up ? R(1.2, 2.6) : 1 + t * .06),
        col: cols[i % cols.length], t0: R(0, 500), vy: -R(8, 30), vx: R(-10, 10), a: R(.25, .55) };
    });
    run(F.c, DUR, (c, e) => {
      c.globalCompositeOperation = 'screen';
      bs.forEach(b => {
        const le = e - b.t0; if (le < 0) return;
        const env = SS(0, 450, le) * (1 - SS(DUR - b.t0 - 900, DUR - b.t0, le));
        if (env <= 0) return;
        const x = b.x + b.vx * le / 1000, y = b.y + b.vy * le / 1000, r = b.r * (1 + le / 6000);
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.col},${b.a * .55 * env})`); g.addColorStop(.82, `rgba(${b.col},${b.a * .7 * env})`);
        g.addColorStop(.93, `rgba(${b.col},${b.a * env})`); g.addColorStop(1, `rgba(${b.col},0)`);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
      });
    });
  };

  /* ══════════ BE アナモルフィック・フレア（ANAMORPHIC FLARE）══════════
     タップ位置で光が弾け、映画のレンズのような**横に長い光の筋**（芯は白・外はシアンとマゼンタ）が画面の端まで伸びて消える。
     筋の先に小さなゴースト（レンズの反射の丸）が並ぶ。段で筋が太く長く、段が上がった瞬間は十字の光と2本目の筋。 */
  P.BE = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    if (!card) return;
    const DUR = 1500 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const X = o.cx, Y = o.cy;
    const ghosts = Array.from({ length: 5 }, (_, i) => ({ k: -.4 - i * .35, r: R(8, 26), col: ['110,231,240', '255,79,163', '182,110,255', '255,184,107', '110,231,240'][i] }));
    run(F.c, DUR, (c, e) => {
      const I = e < 110 ? EO(e / 110) : Math.exp(-(e - 110) / (380 + t * 40));
      if (I < .01) return;
      c.globalCompositeOperation = 'lighter';
      const len = VW * (.55 + .45 * EO(C(e / 260))) * (.8 + t * .04), th = (2 + t * .35) * (up ? 1.6 : 1);
      const streak = (yy, a) => {
        const g = c.createLinearGradient(X - len, 0, X + len, 0);
        g.addColorStop(0, 'rgba(47,224,213,0)'); g.addColorStop(.35, `rgba(47,224,213,${.35 * a})`); g.addColorStop(.47, `rgba(255,120,200,${.6 * a})`);
        g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(.53, `rgba(255,120,200,${.6 * a})`); g.addColorStop(.65, `rgba(47,224,213,${.35 * a})`); g.addColorStop(1, 'rgba(47,224,213,0)');
        c.fillStyle = g; c.fillRect(X - len, yy - th * 3, len * 2, th * 6);
        c.fillRect(X - len, yy - th * .5, len * 2, th);
      };
      streak(Y, I);
      if (up) streak(Y + 18, I * .45);
      const gl = c.createRadialGradient(X, Y, 0, X, Y, 70 + t * 8);
      gl.addColorStop(0, `rgba(255,255,255,${.95 * I})`); gl.addColorStop(.2, `rgba(255,150,210,${.45 * I})`); gl.addColorStop(1, 'rgba(255,150,210,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(X, Y, 70 + t * 8, 0, 7); c.fill();
      if (up) { c.fillStyle = `rgba(255,255,255,${.6 * I})`; c.fillRect(X - 1.2, Y - VH * .3 * I, 2.4, VH * .6 * I); }
      // ゴースト：画面の中央を挟んだ反対側へ並ぶ
      ghosts.forEach(gh => {
        const gx = VW / 2 + (X - VW / 2) * gh.k, gy = VH / 2 + (Y - VH / 2) * gh.k, a = .22 * I;
        const gg = c.createRadialGradient(gx, gy, gh.r * .6, gx, gy, gh.r);
        gg.addColorStop(0, `rgba(${gh.col},${a * .4})`); gg.addColorStop(.9, `rgba(${gh.col},${a})`); gg.addColorStop(1, `rgba(${gh.col},0)`);
        c.fillStyle = gg; c.beginPath(); c.arc(gx, gy, gh.r, 0, 7); c.fill();
      });
    });
  };

  /* ══════════ BF ライトリーク（LIGHT LEAK）══════════
     フィルムカメラの光漏れのように、タップ位置に近い画面の角から、暖かいオレンジとマゼンタの光がふわっと差し込んで流れて消える。
     うっすらフィルムの粒子（グレイン）も乗る。段で光が強く広くなり、段が上がった瞬間は対角の2つの角から。 */
  let grain = null;
  function grainTile() {
    if (grain) return grain;
    grain = document.createElement('canvas'); grain.width = grain.height = 128;
    const g = grain.getContext('2d'), im = g.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    return grain;
  }
  P.BF = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    if (!card) return;
    const DUR = 1900 + (up ? 400 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH, top = hdrBottom();
    const corner = [o.cx < VW / 2 ? 0 : VW, o.cy < (top + VH) / 2 ? top : VH];
    const corners = up ? [corner, [VW - corner[0], corner[1] === top ? VH : top]] : [corner];
    const tile = grainTile();
    run(F.c, DUR, (c, e) => {
      const env = SS(0, 350, e) * (1 - SS(DUR - 800, DUR, e)) * (.7 + t * .05);
      if (env <= 0) return;
      c.globalCompositeOperation = 'screen';
      corners.forEach(([x0, y0], i) => {
        const p = EO(C(e / DUR)), dx = x0 === 0 ? 1 : -1, dy = y0 === top ? 1 : -1;
        const x = x0 + dx * VW * (.05 + .25 * p), y = y0 + dy * VH * (.05 + .2 * p), r = Math.max(VW, VH) * (.45 + .1 * t / 7);
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,236,200,${.55 * env})`); g.addColorStop(.25, `rgba(255,140,40,${.45 * env})`);
        g.addColorStop(.55, `rgba(255,0,110,${.28 * env})`); g.addColorStop(1, 'rgba(255,0,110,0)');
        c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        const g2 = c.createLinearGradient(x0, y0, x0 + dx * VW * .7, y0 + dy * VH * .3);   // 斜めの光の帯
        g2.addColorStop(0, 'rgba(255,200,120,0)'); g2.addColorStop(.3 + .2 * p, `rgba(255,190,120,${.22 * env})`); g2.addColorStop(.5 + .2 * p, 'rgba(255,190,120,0)');
        c.fillStyle = g2; c.fillRect(0, 0, VW, VH);
      });
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = .1 * env;
      const ox = R(0, 128) | 0, oy = R(0, 128) | 0;
      c.fillStyle = c.createPattern(tile, 'repeat'); c.translate(-ox, -oy); c.fillRect(ox, oy, VW, VH);
    });
  };

  /* ══════════ BG セリフ体の一語（EDITORIAL WORD）══════════
     画面の上のほうに、細いイタリックのセリフ体で一語が浮かぶ（虹色のグラデーション）。字間が広い所からすっと詰まって、溶けるように消える。
     言葉は段で変わる：Correct. → Nice. → Great. → Brilliant. → Superb. → Flawless. → Sublime.。段が上がった瞬間はひと回り大きく。 */
  const WORDS = ['Correct.', 'Correct.', 'Nice.', 'Great.', 'Brilliant.', 'Superb.', 'Flawless.', 'Sublime.'];
  P.BG = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    css();
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    if (!card) return;
    _rfK = 1;
    const H = _rfFullHost(1700);
    const VW = window.innerWidth, VH = window.innerHeight, top = hdrBottom();
    const w = document.createElement('div');
    w.className = 'lqp-word';
    w.textContent = WORDS[Math.min(7, t)];
    w.style.backgroundSize = '200% 100%';
    const fs = Math.min(VW * .12, 64) * (up ? 1.35 : 1);
    w.style.fontSize = fs + 'px';
    w.style.top = (top + (VH - top) * .16) + 'px';
    H.appendChild(w);
    // ⚠️ filter（blur）を掛けない——background-clip:text と一緒だと Chrome で文字が1つも描かれない（実際に踏んだ）
    w.animate([{ letterSpacing: '.45em', opacity: 0, translate: '0 10px' },
      { letterSpacing: '.06em', opacity: 1, translate: '0 0', offset: .35 },
      { letterSpacing: '.02em', opacity: 1, translate: '0 0', offset: .7 },
      { letterSpacing: '0em', opacity: 0, translate: '0 -8px' }], { duration: 1600, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    w.animate([{ backgroundPosition: '0% 0' }, { backgroundPosition: '100% 0' }], { duration: 1600, fill: 'forwards' });
  };

  /* ══════════ BH シルクのリボン（SILK RIBBON）══════════
     タップ位置から、半透明の絹のリボンがひらりと舞い上がって、ねじれながら画面の外へ流れていく。
     ねじれた面は明るく・裏返った面は暗く見える。段でリボンが長く太くなり、段が上がった瞬間は2本が絡み合う。 */
  P.BH = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    const o = org(el); if (!o.er.width) return;
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    if (!card) return;
    const DUR = 2200 + (up ? 300 : 0);
    const F = fullLayer(DUR + 100), VW = F.VW, VH = F.VH;
    const dir = o.cx < VW / 2 ? 1 : -1;
    const mk = (ph, cA, cB) => ({ ph, cA, cB, amp: R(40, 70), W: (10 + t * 1.5) * (up ? 1.4 : 1) });
    const rbs = up ? [mk(0, [255, 79, 163], [182, 110, 255]), mk(Math.PI, [110, 231, 240], [255, 184, 107])] : [mk(R(0, 7), [255, 79, 163], [255, 184, 107])];
    const L = VW * (.55 + t * .04);
    run(F.c, DUR, (c, e) => {
      const head = EO(C(e / 1300)) * 1.25, tail = EIO(C((e - 500) / (DUR - 500))) * 1.25;
      rbs.forEach(rb => {
        const N = 70, pts = [];
        for (let i = 0; i <= N; i++) {
          const s = tail + (head - tail) * i / N; if (s < 0) continue;
          const x = o.cx + dir * s * L, y = o.cy - s * VH * .35 + Math.sin(s * 5 + rb.ph + e * .003) * rb.amp * Math.min(1, s * 3);
          const tw = Math.cos(s * 7 + rb.ph - e * .004);   // ねじれ：-1..1
          pts.push({ x, y, tw });
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
          const wa = rb.W * a.tw, wb = rb.W * b.tw;
          const u = i / pts.length, sh = .45 + .55 * Math.abs(a.tw);
          const col = rb.cA.map((v, j) => (v + (rb.cB[j] - v) * u) * (a.tw > 0 ? 1 : .6) * sh | 0);
          const al = .55 * Math.min(1, i / 6) * Math.min(1, (pts.length - i) / 6);
          c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${al})`;
          c.beginPath();
          c.moveTo(a.x + nx / nl * wa, a.y + ny / nl * wa); c.lineTo(b.x + nx / nl * wb, b.y + ny / nl * wb);
          c.lineTo(b.x - nx / nl * wb, b.y - ny / nl * wb); c.lineTo(a.x - nx / nl * wa, a.y - ny / nl * wa); c.closePath(); c.fill();
          c.strokeStyle = c.fillStyle; c.lineWidth = 1; c.stroke();   // 区切りの隙間を埋める
          if (Math.abs(a.tw) > .92) { c.fillStyle = `rgba(255,255,255,${al * .6})`; c.fill(); }
        }
      });
    });
  };

  /* ══════════ BI ネオン管（NEON SIGN）══════════
     正解の肢の縁が、夜の街のネオン管のように「パチッ、パッ」と2回瞬いてから点灯する（マゼンタの管と滲む光）。
     段3〜はカードの縁も続けて点灯し、段が上がった瞬間は色がマゼンタ→シアンへ切り替わる。 */
  P.BI = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    css();
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const k = _rfFit(budget, 360);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const col = up ? '47,224,213' : '255,0,127';
    const tube = document.createElement('span');
    tube.className = 'lqp-glass';
    tube.setAttribute('aria-hidden', 'true');
    tube.style.cssText += `border:2px solid rgba(255,235,245,.95); box-shadow: 0 0 0 1.5px rgba(${col},1), inset 0 0 0 2px rgba(${col},.9), inset 0 0 16px 2px rgba(${col},.7), inset 0 0 40px rgba(${col},.35);`;
    el.appendChild(tube);
    const D = 360 * k;
    tube.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: .1, offset: .17 }, { opacity: 1, offset: .27 }, { opacity: .2, offset: .32 }, { opacity: 1, offset: .45 }, { opacity: 1, offset: .82 }, { opacity: 0 }],
      { duration: D, easing: 'linear', fill: 'forwards' });
    setTimeout(() => tube.remove(), D + 30);
    if (card && (t >= 3 || up)) {
      const on2 = `0 0 0 2px rgba(${col},.95), 0 0 26px 6px rgba(${col},.55)`, off2 = `0 0 0 2px rgba(${col},0), 0 0 0 0 rgba(${col},0)`;
      card.animate([{ boxShadow: off2 }, { boxShadow: on2, offset: .1 }, { boxShadow: off2, offset: .16 }, { boxShadow: on2, offset: .26 }, { boxShadow: on2, offset: .7 }, { boxShadow: off2 }],
        { duration: 1200, delay: 120, easing: 'linear' });
    }
  };

  /* ══════════ BJ リキッドグラスの縁（LIQUID GLASS BEZEL）══════════
     正解の肢が一瞬だけ「ガラスのカプセル」になる：縁に光を受けたガラスの面取り（上は明るく・下はほのかに虹色）が現れ、
     反射光が縁をぐるりとひと回りする（iOS のリキッドグラスのような質感）。段3〜は反射が2周、段が上がった瞬間は縁が虹色に屈折する。 */
  P.BJ = function (el, card, tier, promoted, budget) {
    if (!el || _fxOff()) return;
    css();
    const t = Math.max(1, tier), up = promoted && tier >= 2;
    const k = _rfFit(budget, 360);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const gl = document.createElement('span');
    gl.className = 'lqp-glass';
    gl.setAttribute('aria-hidden', 'true');
    const rimCol = up ? IRI.join(',') : 'rgba(255,255,255,.95), rgba(255,255,255,.1) 20%, rgba(255,255,255,.05) 45%, rgba(110,231,240,.6) 55%, rgba(255,255,255,.1) 70%, rgba(255,255,255,.95)';
    gl.style.cssText += `padding:3px; background:conic-gradient(from var(--lqp-a), ${rimCol});
      -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor;
      mask:linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
      box-shadow: inset 0 1.5px 0 rgba(255,255,255,.7), inset 0 -1.5px 0 rgba(255,110,199,.45), 0 6px 18px rgba(0,0,0,.25);`;
    const sheen = document.createElement('span');   // 上半分のガラスのつや
    sheen.className = 'lqp-glass';
    sheen.setAttribute('aria-hidden', 'true');
    sheen.style.cssText += 'background:linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.06) 48%, rgba(255,255,255,0) 52%);';
    el.append(gl, sheen);
    sheen.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 360 * k, fill: 'forwards' });
    setTimeout(() => sheen.remove(), 360 * k + 30);
    const loops = (t >= 3 || up) ? 2 : 1;
    gl.animate([{ opacity: 0, '--lqp-a': '0deg' }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0, '--lqp-a': (360 * loops) + 'deg' }], { duration: 360 * k, fill: 'forwards' });
    setTimeout(() => gl.remove(), 360 * k + 30);
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
