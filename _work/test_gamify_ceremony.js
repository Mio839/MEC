/**
 * セレモニー／トーストのキューと「試験中は溜める」制御を実ソース（gamify.js）で検証する。
 * Run: node _work/test_gamify_ceremony.js
 *
 * 背景（2026-08-18 の演出強化 Phase 1）:
 *   - ceremony() は overlay の innerHTML を上書きするだけでキューが無く、近接して2つ発火すると
 *     先の1つが誰にも見られないまま消えていた。しかもそれが起きる条件が「40問目の解答」
 *     そのもので、_bumpMission → MISSION COMPLETE の直後に同じ同期呼び出しの中で
 *     _afterEvent → LEVEL UP が走り、MISSION COMPLETE が常に上書きされて消えていた。
 *   - _microLapFx / _lapMilestoneFx は examMode を見て黙るのに、一番大きい全画面セレモニーだけが
 *     素通しで tier 演出の真上に被っていた。トーストも top:14px 固定なので iPad では
 *     約180pxある試験ヘッダの裏＝出しても読めない。
 *     → 試験中は両方とも溜め、結果画面（onExamFinish が置く静粛時間の後）で順に再生する。
 *
 * 背景（2026-08-20 の Phase 6・授与トレイ）:
 *   - セレモニーとトーストは _cerQ / _toastQ の2列で「並行に」流れていたため、全画面
 *     セレモニーの真上にトーストが重なって両方読めず、しかも「あと何件来るか」を数えられ
 *     なかった。→ _annQ 1本に併合し、位置表示（3 / 4）と授与トレイ（#gmTrayMount）を足した。
 *   - トレイは「これから来る件数」を先に見せる目次で、行はセレモニーの再生に合わせて点灯する。
 *     スキップ（タップで次へ／まとめて受け取る）で打ち切っても、行はトレイに残る＝情報が
 *     失われないことがスキップを許せる前提になっている。
 *
 * ⚠️ このテストは setTimeout / setInterval / Date.now を差し替えた仮想時計で回す。
 *    gamify.js 側でこれらの名前を使わなくなったらここも直すこと。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');

// ── 仮想時計 ────────────────────────────────────────────────────────────
// 実時間を待たずにキューの順序を検査するため、時刻とタイマーを完全に手で進める。
function makeClock() {
  let now = 1750000000000, seq = 0;
  const timers = new Map();   // id → { at, fn, every }
  const c = {
    now: () => now,
    setTimeout(fn, ms) { const id = ++seq; timers.set(id, { at: now + (ms | 0), fn }); return id; },
    setInterval(fn, ms) { const id = ++seq; timers.set(id, { at: now + (ms | 0), fn, every: Math.max(1, ms | 0) }); return id; },
    clearTimeout(id) { timers.delete(id); },
    clearInterval(id) { timers.delete(id); },
    // ms ぶん進める。途中で積まれたタイマーもその時刻に達すれば発火する。
    tick(ms) {
      const end = now + ms;
      for (;;) {
        let next = null, nextId = -1;
        for (const [id, t] of timers) if (t.at <= end && (next === null || t.at < next.at)) { next = t; nextId = id; }
        if (!next) break;
        now = next.at;
        if (next.every) next.at = now + next.every; else timers.delete(nextId);
        next.fn();
      }
      now = end;
    },
    // 生きている繰り返しタイマーの数（保留タイマーの張りっぱなしを検出する）
    intervals: () => { let n = 0; for (const t of timers.values()) if (t.every) n++; return n; },
  };
  return c;
}

// ── 最小DOM ────────────────────────────────────────────────────────────
// gamify.js は要素が無ければ静かに何もしない作りなので、演出系は getElementById が null を
// 返すだけで no-op になる。ここでは #gmCerOv / #gmToast だけを本物のように振る舞わせて
// 「今どちらのセレモニーが画面に出ているか」を読めるようにする。
function makeEl(id) {
  const cls = new Set();
  const el = {
    id: id || '', style: {}, dataset: {}, children: [], _html: '', _text: {},
    classList: {
      add(...c) { c.forEach(x => cls.add(x)); },
      remove(...c) { c.forEach(x => cls.delete(x)); },
      toggle() {}, contains: c => cls.has(c),
    },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, addEventListener() {}, setAttribute() {},
    animate: () => ({}), getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    getClientRects: () => [],   // 既定は「画面に見えていない」＝トレイを描かない
    querySelector(sel) {
      // .gm-cer は out クラスを付けられるだけなので使い捨てで足りる
      if (sel === '.gm-cer') return this._cer || (this._cer = makeEl());
      return (this._text[sel] = this._text[sel] || makeEl(sel));
    },
    querySelectorAll: () => [],
    set innerHTML(v) { this._html = v; this._cer = null; },
    get innerHTML() { return this._html; },
  };
  return el;
}

function makeCtx(clock, opt) {
  const store = {};
  const els = { gmCerOv: makeEl('gmCerOv'), gmToast: makeEl('gmToast') };
  // トレイは「マウント要素があり、かつ画面に見えている」ときだけ描かれる（結果画面だけ）
  if (opt && opt.tray) {
    els.gmTrayMount = makeEl('gmTrayMount');
    els.gmTrayMount.getClientRects = () => [{}];
  }
  const ctx = {
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      readyState: 'complete', head: makeEl(), body: makeEl(),
      getElementById: id => els[id] || null,
      querySelector: () => null, querySelectorAll: () => [],
      createElement: makeEl, addEventListener() {}, dispatchEvent() {},
    },
    setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval, clearInterval: clock.clearInterval,
    // requestAnimationFrame は「次のフレーム」＝ここでは即時で足りる（表示クラスを付けるだけ）
    requestAnimationFrame: fn => { fn(); return 0; }, requestIdleCallback: null,
    matchMedia: () => ({ matches: false }),
    Date: new Proxy(Date, { get: (t, k) => (k === 'now' ? clock.now : t[k]) }),
    Math, JSON, console, Set, Map, Object, Array, String, Number, Error, Proxy,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  ctx._store = store;
  ctx._els = els;
  // 画面に今出ているセレモニーの中身（出ていなければ null）
  ctx._onScreen = () => (els.gmCerOv.classList.contains('show') ? els.gmCerOv.innerHTML : null);
  ctx._toastOnScreen = () => (els.gmToast.classList.contains('show') ? els.gmToast._text['.tt']._t : null);
  return ctx;
}

// トーストの本文は querySelector('.tt').textContent に入る。スタブでは _t に控える。
// （makeEl の子要素は textContent を素直に持てないので、ここで足しておく）
function armToastCapture(ctx) {
  const tt = ctx._els.gmToast.querySelector('.tt');
  Object.defineProperty(tt, 'textContent', { set(v) { this._t = v; }, get() { return this._t; } });
}

// ── ミニテストランナー ─────────────────────────────────────────────────
let pass = 0, fail = 0;
function group(name) { console.log('\n' + name); }
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}

// セレモニー1本ぶんの寿命 = dur + 420（フェードアウト）。既定 dur は 2300。
const LIFE = d => (d || 2300) + 420;

group('キュー（上書きで消えないこと）');

t('近接して2つ発火しても、1つ目が最後まで再生されてから2つ目が出る', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const { ceremony } = ctx.window.MecGamify._defs;
  ceremony('<i>MISSION</i>');
  ceremony('<i>LEVEL</i>');
  assert.match(ctx._onScreen(), /MISSION/, '1つ目が即座に出ること');
  clock.tick(2000);
  assert.match(ctx._onScreen(), /MISSION/, '寿命の途中で2つ目に上書きされないこと');
  clock.tick(LIFE() - 2000 + 300);   // 1つ目の寿命 + CER_GAP_MS
  assert.match(ctx._onScreen(), /LEVEL/, '1つ目が消えてから2つ目が出ること');
});

t('3つ積んでも順序どおりに全部出る（1つも失われない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const { ceremony } = ctx.window.MecGamify._defs;
  ['A', 'B', 'C'].forEach(x => ceremony('<i>' + x + '</i>'));
  const seen = [];
  for (let i = 0; i < 60; i++) {
    const s = ctx._onScreen();
    // ⚠️ 位置表示（gm-ann-pos の "2 / 3"）が入るので、数字ではなくラベルで拾うこと
    const lb = s && (s.match(/<i>([A-C])<\/i>/) || [])[1];
    if (lb && seen[seen.length - 1] !== lb) seen.push(lb);
    clock.tick(200);
  }
  assert.deepStrictEqual(seen, ['A', 'B', 'C']);
});

t('opts.dur が長いセレモニーでも、その寿命が尽きるまで次は出ない', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const { ceremony } = ctx.window.MecGamify._defs;
  ceremony('<i>SUBJ</i>', { dur: 3000 });   // 科目制覇は 3000ms
  ceremony('<i>NEXT</i>');
  clock.tick(2900);
  assert.match(ctx._onScreen(), /SUBJ/);
  clock.tick(LIFE(3000) - 2900 + 300);
  assert.match(ctx._onScreen(), /NEXT/);
});

t('fx / snd はそのセレモニーが実際に出る瞬間に1回だけ呼ばれる', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const { ceremony } = ctx.window.MecGamify._defs;
  let fx1 = 0, fx2 = 0;
  ceremony('<i>A</i>', { fx: () => fx1++ });
  ceremony('<i>B</i>', { fx: () => fx2++ });
  assert.strictEqual(fx1, 1);
  assert.strictEqual(fx2, 0, '2つ目のfxは積まれた時点では鳴らないこと');
  clock.tick(LIFE() + 300);
  assert.strictEqual(fx2, 1);
  clock.tick(LIFE() * 3);
  assert.strictEqual(fx1 + fx2, 2, '再生は各1回だけ');
});

group('試験中は溜める（examMode）');

t('examMode が真の間は1つも再生されない', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>');
  D.ceremony('<i>B</i>');
  clock.tick(30000);
  assert.strictEqual(ctx._onScreen(), null, '試験中に画面へ出ないこと');
  assert.strictEqual(D.cerPending(), 2, '溜まったまま失われないこと');
});

t('examMode 解除後に、溜まったものが順序どおり全部再生される', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>');
  D.ceremony('<i>B</i>');
  clock.tick(10000);
  ctx.examMode = false;
  clock.tick(600);                       // 保留タイマー（400ms間隔）が解除に気づく
  assert.match(ctx._onScreen(), /A/);
  clock.tick(LIFE() + 300);
  assert.match(ctx._onScreen(), /B/);
  clock.tick(LIFE() + 300);
  assert.strictEqual(D.cerPending(), 0);
});

t('トーストも試験中は溜まり、解除後に出る（試験ヘッダの裏に消さない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  armToastCapture(ctx);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.toast('🎯', 'ミッション達成！', 'x');
  clock.tick(20000);
  assert.strictEqual(ctx._toastOnScreen(), null);
  assert.strictEqual(D.toastPending(), 1);
  ctx.examMode = false;
  clock.tick(600);
  assert.strictEqual(ctx._toastOnScreen(), 'ミッション達成！');
});

t('トーストの音は「溜めた時」ではなく「出た時」に鳴る', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  armToastCapture(ctx);
  ctx.examMode = true;
  let rang = 0;
  ctx.window.MecGamify._defs.toast('🎯', 'x', 'y', () => rang++);
  clock.tick(20000);
  assert.strictEqual(rang, 0, '画面に出ていないのに鳴らないこと');
  ctx.examMode = false;
  clock.tick(600);
  assert.strictEqual(rang, 1);
});

t('試験を通らないページ（examMode 未定義＝ハブ）では即座に出る', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  assert.strictEqual(typeof ctx.examMode, 'undefined');
  ctx.window.MecGamify._defs.ceremony('<i>A</i>');
  assert.match(ctx._onScreen(), /A/);
});

group('結果画面へ集約する（静粛時間）');

t('onExamFinish の直後は静粛時間ぶん待ってから再生が始まる', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  ctx.examMode = true;
  const G = ctx.window.MecGamify, D = G._defs;
  D.ceremony('<i>A</i>');
  clock.tick(5000);
  // exitExam は examMode を落としてから showExamSummary を呼び、その末尾で onExamFinish が走る
  ctx.examMode = false;
  G.onExamFinish(20, 18, {});
  clock.tick(D.settleMs - 200);
  assert.strictEqual(ctx._onScreen(), null,
    '結果画面のランクスタンプ(950ms)・祝賀花火(980ms)の上に被せないこと');
  clock.tick(1200);
  assert.match(ctx._onScreen(), /A/);
});

t('静粛時間の中で積まれたセレモニーも、時計が進むまで出ない', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const G = ctx.window.MecGamify, D = G._defs;
  // answered<10 なのでミッション加算は走らない＝静粛時間だけが効く条件にする
  G.onExamFinish(5, 5, {});
  D.ceremony('<i>MISSION</i>');
  assert.strictEqual(ctx._onScreen(), null);
  clock.tick(D.settleMs + 600);
  assert.match(ctx._onScreen(), /MISSION/);
});

t('onExamFinish 自身が生む達成も、静粛時間の後に1件も落とさず出る', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const G = ctx.window.MecGamify, D = G._defs;
  G.onExamFinish(20, 18, {});     // exam / acc80 が達成される
  D.ceremony('<i>MISSION</i>');
  const total = D.annState().total;
  assert.ok(total >= 2, 'onExamFinish 自身の達成も同じ列に積まれること（実測 ' + total + '件）');
  assert.strictEqual(ctx._onScreen(), null);
  clock.tick(60000);
  const st = D.annState();
  assert.strictEqual(st.pending, 0, '全部再生し終えること');
  assert.strictEqual(st.done.length, total, '1件も落とさないこと');
});

t('flushCeremonies() は静粛時間を打ち切って今すぐ出す', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const G = ctx.window.MecGamify;
  G.onExamFinish(5, 5, {});      // 列を A だけにする（ミッション加算を走らせない）
  G._defs.ceremony('<i>A</i>');
  assert.strictEqual(ctx._onScreen(), null);
  G.flushCeremonies();
  assert.match(ctx._onScreen(), /A/);
});

t('flushCeremonies() でも examMode 中なら出さない（試験を割り込ませない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  ctx.examMode = true;
  const G = ctx.window.MecGamify;
  G._defs.ceremony('<i>A</i>');
  G.flushCeremonies();
  assert.strictEqual(ctx._onScreen(), null);
  assert.strictEqual(G._defs.cerPending(), 1);
});

group('保留タイマーの後始末');

t('溜まっていないときは保留タイマーを張らない（無駄なポーリングをしない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const base = clock.intervals();
  ctx.examMode = true;
  clock.tick(20000);
  assert.strictEqual(clock.intervals(), base, '何も積んでいなければ繰り返しタイマーは増えない');
  // 積んだときだけ1本だけ張る（2つ積んでも2本にならない）
  ctx.window.MecGamify._defs.ceremony('<i>A</i>');
  ctx.window.MecGamify._defs.ceremony('<i>B</i>');
  assert.strictEqual(clock.intervals(), base + 1);
});

t('解除後に保留タイマーが止まる（再生し終えたら回り続けない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>');
  assert.strictEqual(clock.intervals(), 1, '溜まっている間だけ保留タイマーが1本');
  ctx.examMode = false;
  clock.tick(600);
  assert.match(ctx._onScreen(), /A/);
  clock.tick(LIFE() + 1000);
  assert.strictEqual(ctx._onScreen(), null);
  assert.strictEqual(clock.intervals(), 0, '再生し終えたら保留タイマーが残らないこと');
  // もう一度積んだときに、止まったタイマーとは無関係にすぐ出ること
  D.ceremony('<i>B</i>');
  assert.match(ctx._onScreen(), /B/);
});

group('併合キュー（セレモニーとトーストを1本の列にする）');

t('ceremony と toast は push 順に直列で出る（重ならない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  armToastCapture(ctx);
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>');
  D.toast('🎖', 'T1', 'x');
  // 1件目のセレモニーが出ている間、トーストは画面に出ていないこと
  assert.match(ctx._onScreen(), /A/);
  assert.strictEqual(ctx._toastOnScreen(), null,
    '⚠️ 全画面セレモニーの真上にトーストを重ねないこと（2列に戻すとここが落ちる）');
  clock.tick(LIFE() + 300);
  assert.strictEqual(ctx._onScreen(), null);
  assert.strictEqual(ctx._toastOnScreen(), 'T1');
});

t('annState が総数と位置を返す（あと何件かの正本）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  armToastCapture(ctx);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>');
  D.toast('🎖', 'T1', 'x');
  D.ceremony('<i>B</i>');
  let st = D.annState();
  assert.strictEqual(st.total, 3);
  assert.strictEqual(st.pos, 0, '再生前は0件目');
  // ⚠️ vm コンテキスト内で作られた配列は prototype が別なので deepStrictEqual は使えない
  assert.strictEqual(st.kinds.join(','), 'cer,toast,cer', 'push 順が保たれること');
  ctx.examMode = false;
  clock.tick(600);
  st = D.annState();
  assert.strictEqual(st.pos, 1);
  assert.strictEqual(st.total, 3, '再生が進んでも総数は減らない');
});

t('位置表示は本編にも載る（総数1件のときは出さない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>ONLY</i>');
  assert.ok(!/gm-ann-pos/.test(ctx._onScreen()), '1件だけのときに 1 / 1 を出さないこと');
  clock.tick(LIFE() * 2);
  const ctx2 = makeCtx(makeClock());
  ctx2.examMode = true;
  ctx2.window.MecGamify._defs.ceremony('<i>A</i>');
  ctx2.window.MecGamify._defs.ceremony('<i>B</i>');
  ctx2.examMode = false;
  ctx2.window.MecGamify.flushCeremonies();
  assert.match(ctx2._onScreen(), /gm-ann-pos/);
  assert.match(ctx2._onScreen(), /1 \/ 2/);
});

group('スキップ（飛ばしても情報が残ること）');

t('skipOne は今の1件を切り上げて次へ進む', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>', { label: 'A' });
  D.ceremony('<i>B</i>', { label: 'B' });
  assert.match(ctx._onScreen(), /A/);
  D.skipOne();
  assert.strictEqual(ctx._onScreen(), null, '即座に消えること');
  clock.tick(200);
  assert.match(ctx._onScreen(), /B/);
  assert.strictEqual(D.annState().done[0], 'A', '飛ばした1件もトレイの再生済みに残ること');
});

t('skipAll は残り全部を打ち切り、1件も捨てずにトレイへ載せる', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const D = ctx.window.MecGamify._defs;
  ['A', 'B', 'C', 'D'].forEach(x => D.ceremony('<i>' + x + '</i>', { label: x }));
  D.skipAll();
  assert.strictEqual(ctx._onScreen(), null);
  clock.tick(1000);
  const st = D.annState();
  assert.strictEqual(st.pending, 0);
  assert.strictEqual(st.done.join(','), 'A,B,C,D',
    '⚠️ 飛ばしても内容が残ることがスキップを許せる前提。ここが落ちたら情報が失われている');
});

t('skipAll は音も fx も鳴らさない（一気に鳴ると事故に聞こえる）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  const D = ctx.window.MecGamify._defs;
  let rang = 0, fx = 0;
  D.ceremony('<i>A</i>', { label: 'A' });
  D.ceremony('<i>B</i>', { label: 'B', snd: () => rang++, fx: () => fx++ });
  D.ceremony('<i>C</i>', { label: 'C', snd: () => rang++, fx: () => fx++ });
  D.skipAll();
  clock.tick(2000);
  assert.strictEqual(rang, 0);
  assert.strictEqual(fx, 0);
});

group('授与トレイ（#gmTrayMount）');

t('マウント要素が無いページには何も描かない（結果画面だけ）', () => {
  const clock = makeClock(), ctx = makeCtx(clock);
  assert.strictEqual(ctx.document.getElementById('gmTrayMount'), null);
  ctx.window.MecGamify._defs.ceremony('<i>A</i>', { label: 'A' });   // 例外を投げないこと
  assert.match(ctx._onScreen(), /A/);
});

t('マウントがあると全件の一覧を先に描く（総数が最初から読める）', () => {
  const clock = makeClock(), ctx = makeCtx(clock, { tray: true });
  armToastCapture(ctx);
  ctx.examMode = true;
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>', { icon: '🎉', label: 'LEVEL UP' });
  D.toast('🎖', '実績解除「難問ハンター」', 'x');
  D.ceremony('<i>B</i>', { icon: '🏆', label: '第3章 制覇' });
  const html = ctx._els.gmTrayMount.innerHTML;
  assert.strictEqual((html.match(/gm-tray-row/g) || []).length, 3,
    '再生前から3行すべてが並ぶこと（＝あと何件来るかが読める）');
  assert.match(html, /LEVEL UP/);
  assert.match(html, /難問ハンター/);
  assert.match(html, /第3章 制覇/);
  assert.match(html, /まとめて受け取る/);
});

t('トレイの行はラベルをエスケープする（章名がそのまま入る経路）', () => {
  const clock = makeClock(), ctx = makeCtx(clock, { tray: true });
  ctx.examMode = true;
  ctx.window.MecGamify._defs.ceremony('<i>A</i>', { label: '<img onerror=x>章' });
  const html = ctx._els.gmTrayMount.innerHTML;
  assert.ok(!/<img/.test(html), 'ラベルを生HTMLとして流し込まないこと');
  assert.match(html, /&lt;img/);
});

t('ラベル省略時は gm-cer-big から拾う（既存の呼び出しでも行が空にならない）', () => {
  const clock = makeClock(), ctx = makeCtx(clock, { tray: true });
  ctx.examMode = true;
  ctx.window.MecGamify._defs.ceremony('<div class="gm-cer-big">章 制覇！</div>');
  assert.match(ctx._els.gmTrayMount.innerHTML, /章 制覇！/);
});

t('獲得0件のセッションでは前回の一覧を残さない', () => {
  const clock = makeClock(), ctx = makeCtx(clock, { tray: true });
  const G = ctx.window.MecGamify, D = G._defs;
  D.ceremony('<i>A</i>', { label: 'A' });
  clock.tick(LIFE() * 2);
  assert.match(ctx._els.gmTrayMount.innerHTML, /gm-tray-row/, '1回目は出ること');
  // 2回目のセッションで何も獲得しなかった場合（積むものが無い＝_annPush が走らない）
  G.onExamFinish(5, 5, {});
  assert.strictEqual(ctx._els.gmTrayMount.innerHTML, '',
    '⚠️ 前回の「今回の獲得」が新しい結果画面に残らないこと');
});

t('新しい一群を積むと前回の行は畳まれる', () => {
  const clock = makeClock(), ctx = makeCtx(clock, { tray: true });
  const D = ctx.window.MecGamify._defs;
  D.ceremony('<i>A</i>', { label: 'A' });
  clock.tick(LIFE() * 2);
  D.ceremony('<i>B</i>', { label: 'B' });
  assert.strictEqual(D.annState().total, 1, '前回のぶんを数に混ぜないこと');
  assert.strictEqual((ctx._els.gmTrayMount.innerHTML.match(/gm-tray-row/g) || []).length, 1);
});

console.log('\n' + (fail ? 'FAILED  ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
