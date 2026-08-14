/**
 * ハブ（index.html）のヒーローのボタンと計器ベイの演出を実ソースで検証する。
 * Run: node _work/test_hero_cta.js
 *
 * 守りたいこと（2026-08-14に足した E1〜E10）:
 *   - 遷移の横取り（E10）が「普通のリンクとして扱うべきクリック」を殺さない。
 *     修飾キー・中クリック・target・href なし・is-off は必ず素通しする。
 *     ここを壊すと「新しいタブで開けない」「押しても何も起きない」になる。
 *   - 横取りしたクリックは必ず遷移させる（演出が例外を投げても・保険のタイマーでも）。
 *   - ボタンの演出色は「席」ではなく「中身」で決まる（主ボタンは日によって
 *     復習と科目選びが入れ替わるので、席で色を固定すると意味が濁る）。
 *   - 計器行のカウントアップが非表示タブ（rAF が止まる）でも最終値に着地する。
 *     ここを落とすと、裏で開いたハブの数字が 0 のまま凍る。
 *   - 在庫の段（誤答の件数・復習待ちの滞留）が 0 件で必ず外れる。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}
function sec(s) { console.log('\n' + s); }

// ── index.html から実装を切り出す（ロジックの二重管理をしない） ─────────
function extract(name) {
  const i = HTML.indexOf('function ' + name + '(');
  assert.ok(i > 0, name + ' が index.html に無い（名前を変えたらこのテストも直すこと）');
  let depth = 0, started = false;
  for (let j = HTML.indexOf('{', i); j < HTML.length; j++) {
    if (HTML[j] === '{') { depth++; started = true; }
    else if (HTML[j] === '}') { depth--; if (started && depth === 0) return HTML.slice(i, j + 1); }
  }
  throw new Error(name + ' の本体を切り出せなかった');
}
const CTA_COLORS_SRC = (HTML.match(/^const CTA_FX_COLORS = \{[\s\S]*?\};$/m) || [])[0];
assert.ok(CTA_COLORS_SRC, 'CTA_FX_COLORS の宣言が index.html に無い');
const EXIT_MS_SRC = (HTML.match(/^const CTA_EXIT_MS = \d+;$/m) || [])[0];
assert.ok(EXIT_MS_SRC, 'CTA_EXIT_MS の宣言が index.html に無い');

// ── 最小の DOM もどき ────────────────────────────────────────────
function mkEl(o) {
  o = o || {};
  const cls = new Set(o.cls || []);
  const attrs = Object.assign({}, o.attrs);
  const el = {
    id: o.id || '', dataset: Object.assign({}, o.dataset), style: { setProperty(k, v) { this[k] = v; } },
    children: [], _text: o.text || '', target: o.target || '',
    classList: {
      add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c),
      toggle: (c, on) => { if (on === undefined) { cls.has(c) ? cls.delete(c) : cls.add(c); } else if (on) cls.add(c); else cls.delete(c); },
    },
    getAttribute: k => (k in attrs ? attrs[k] : null),
    setAttribute: (k, v) => { attrs[k] = String(v); },
    removeAttribute: k => { delete attrs[k]; if (k === 'data-load') delete el.dataset.load; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); },
    remove() {}, addEventListener() {}, animate: () => ({}),
    closest(sel) { return sel === 'dd' ? el._dd || null : el; },
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 44, right: 200, bottom: 44 }),
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
  };
  return el;
}

// _initCtaExit / _initCtaRipple は document へ委譲で貼るので、その1本を掴んで直接叩く
function makeCtx(opts) {
  opts = opts || {};
  const handlers = {};
  const nav = [];
  // 仮想時計。rAF と setTimeout を同じ時間軸に並べ、期限の早い順に流す。
  // ⚠️ performance.now() を固定にすると _tweenNum の進捗 k が永久に 0 のままになり、
  //    「トゥイーンが終わらない」というテスト側の嘘の失敗が出る。必ず時計を進めること。
  let clock = 0, seq = 0;
  const timers = [];
  const at = (fn, ms, raf) => { timers.push({ fn, at: clock + ms, seq: seq++, raf }); return seq; };
  const ctx = {
    console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, Set, Map,
    document: {
      hidden: !!opts.hidden,
      addEventListener: (type, fn) => { (handlers[type] = handlers[type] || []).push(fn); },
      createElement: () => mkEl(),
      getElementById: id => (opts.els && opts.els[id]) || null,
    },
    location: { set href(v) { nav.push(v); }, get href() { return nav[nav.length - 1] || ''; } },
    matchMedia: () => ({ matches: !!opts.reduced }),
    setTimeout: (fn, ms) => at(fn, ms || 0, false),
    clearTimeout: id => { const i = timers.findIndex(j => j.seq === id - 1); if (i >= 0) timers.splice(i, 1); },
    // 非表示タブでは rAF が動かない（＝ここが no-op になるのが実機の挙動）
    requestAnimationFrame: opts.hidden ? () => 0 : (fn => at(fn, 16, true)),
    performance: { now: () => clock },
    MecFX: opts.noFx ? null : {
      burst() { if (opts.fxThrows) throw new Error('fx boom'); },
      rings() {}, glyphBurst() {}, steam() {}, dust() {},
    },
    getComputedStyle: () => ({ getPropertyValue: () => '#FF9A3C' }),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(
    CTA_COLORS_SRC + '\n' + EXIT_MS_SRC + '\n' +
    extract('_reducedMotion') + '\n' + extract('_accent') + '\n' +
    extract('_fxOk') + '\n' + extract('_centerOf') + '\n' + extract('_fmtN') + '\n' +
    extract('_tweenNum') + '\n' + extract('_tickStat') + '\n' +
    extract('_setRedoLoad') + '\n' + extract('_ctaColors') + '\n' +
    extract('_initCtaRipple') + '\n' + extract('_initCtaExit') + '\n' +
    'window.__init = { ripple: _initCtaRipple, exit: _initCtaExit };\n' +
    'window.__fn = { tickStat: _tickStat, setRedoLoad: _setRedoLoad, ctaColors: _ctaColors, tweenNum: _tweenNum };',
    ctx
  );
  // 溜まったタイマーを期限順に流す（rAF もここで回る）。
  // 同じ期限なら登録順＝実機のキューの順に合わせる。
  const drain = () => {
    for (let i = 0; i < 2000 && timers.length; i++) {
      timers.sort((a, b) => (a.at - b.at) || (a.seq - b.seq));
      const job = timers.shift();
      clock = job.at;
      job.fn(clock);
    }
  };
  return { ctx, handlers, nav, timers, drain };
}

// クリックイベントの最小形。closest はボタン自身を返す
function mkClick(btn, o) {
  o = o || {};
  return {
    target: { closest: sel => (sel.indexOf('cta') >= 0 ? btn : null) },
    button: o.button === undefined ? 0 : o.button,
    metaKey: !!o.metaKey, ctrlKey: !!o.ctrlKey, shiftKey: !!o.shiftKey, altKey: !!o.altKey,
    clientX: 10, clientY: 10,
    defaultPrevented: !!o.defaultPrevented,
    preventDefault() { this.defaultPrevented = true; },
  };
}

/* ══════════ E10: 遷移の横取り ══════════ */
sec('E10 遷移の横取り（普通のリンクとして扱うべきクリックを殺さない）');

function exitCase(btnOpts, evOpts, ctxOpts) {
  const btn = mkEl(Object.assign({ id: 'heroPrimary', attrs: { href: 'study.html' } }, btnOpts));
  const h = makeCtx(Object.assign({ els: { heroPrimary: btn } }, ctxOpts));
  h.ctx.window.__init.exit();
  const ev = mkClick(btn, evOpts);
  (h.handlers.click || []).forEach(fn => fn(ev));
  return { ev, h, btn };
}

t('通常の左クリックは横取りして、演出のあとに自前で遷移する', () => {
  const { ev, h } = exitCase();
  assert.strictEqual(ev.defaultPrevented, true, '横取りしていない');
  assert.deepStrictEqual(h.nav, [], '演出を挟まずその場で遷移している');
  h.drain();
  assert.deepStrictEqual(h.nav, ['study.html'], '遷移していない');
});

t('遷移は1回だけ（余韻のタイマーと保険のタイマーで二重に飛ばない）', () => {
  const { h } = exitCase();
  h.drain();
  assert.strictEqual(h.nav.length, 1, '遷移が ' + h.nav.length + ' 回起きた');
});

[['Ctrl', { ctrlKey: true }], ['Meta(⌘)', { metaKey: true }], ['Shift', { shiftKey: true }],
 ['Alt', { altKey: true }]].forEach(([label, ev]) => {
  t(label + '＋クリックは素通し（新しいタブ/ウィンドウで開けなくなる）', () => {
    const r = exitCase(null, ev);
    assert.strictEqual(r.ev.defaultPrevented, false, '横取りしてしまった');
    r.h.drain();
    assert.deepStrictEqual(r.h.nav, [], '自前で遷移してしまった');
  });
});

t('中クリック（button!==0）は素通し', () => {
  const r = exitCase(null, { button: 1 });
  assert.strictEqual(r.ev.defaultPrevented, false);
});

t('href の無いボタン（0件で押させない席）は素通し', () => {
  const r = exitCase({ attrs: {} });
  assert.strictEqual(r.ev.defaultPrevented, false);
  r.h.drain();
  assert.deepStrictEqual(r.h.nav, []);
});

t('is-off のボタンは触らない', () => {
  const r = exitCase({ cls: ['is-off'] });
  assert.strictEqual(r.ev.defaultPrevented, false);
});

t('target 付き（別タブ指定）は素通し', () => {
  const r = exitCase({ target: '_blank' });
  assert.strictEqual(r.ev.defaultPrevented, false);
});

t('すでに他で preventDefault 済みのクリックには割り込まない', () => {
  const r = exitCase(null, { defaultPrevented: true });
  r.h.drain();
  assert.deepStrictEqual(r.h.nav, [], '他のハンドラの判断を上書きしている');
});

t('演出が例外を投げても遷移は必ず起きる（押しても何も起きないボタンを作らない）', () => {
  const { h } = exitCase(null, null, { fxThrows: true });
  h.drain();
  assert.deepStrictEqual(h.nav, ['study.html'], '演出の例外で遷移が落ちた');
});

t('MecFX が読めていなくても遷移は起きる', () => {
  const { h } = exitCase(null, null, { noFx: true });
  h.drain();
  assert.deepStrictEqual(h.nav, ['study.html']);
});

t('reduced-motion では横取りそのものをしない（素のリンクに戻す）', () => {
  const btn = mkEl({ id: 'heroPrimary', attrs: { href: 'study.html' } });
  const h = makeCtx({ els: { heroPrimary: btn }, reduced: true });
  h.ctx.window.__init.exit();
  assert.strictEqual((h.handlers.click || []).length, 0, 'reduced-motion でハンドラを貼っている');
});

/* ══════════ E2: リップル ══════════ */
sec('E2 リップル');

t('押した位置が --rx/--ry で渡る', () => {
  const btn = mkEl({ id: 'heroPrimary', attrs: { href: '#' } });
  const h = makeCtx({ els: { heroPrimary: btn } });
  h.ctx.window.__init.ripple();
  (h.handlers.pointerdown || []).forEach(fn => fn({ target: { closest: () => btn }, clientX: 30, clientY: 12 }));
  assert.strictEqual(btn.children.length, 1, 'リップルが挿さっていない');
  assert.strictEqual(btn.children[0].style['--rx'], '30px');
  assert.strictEqual(btn.children[0].style['--ry'], '12px');
});

t('is-off のボタンには出さない（押せないのに反応する見た目を作らない）', () => {
  const btn = mkEl({ id: 'heroPrimary', cls: ['is-off'] });
  const h = makeCtx({ els: { heroPrimary: btn } });
  h.ctx.window.__init.ripple();
  (h.handlers.pointerdown || []).forEach(fn => fn({ target: { closest: () => btn }, clientX: 1, clientY: 1 }));
  assert.strictEqual(btn.children.length, 0);
});

t('reduced-motion では貼らない', () => {
  const h = makeCtx({ reduced: true });
  h.ctx.window.__init.ripple();
  assert.strictEqual((h.handlers.pointerdown || []).length, 0);
});

/* ══════════ 色は席ではなく中身で決まる ══════════ */
sec('ボタンの演出色（席ではなく中身で決める）');

t('復習=青 / 全科目=緑 / 誤答=赤 の3系統が揃っている', () => {
  const h = makeCtx({});
  const c = h.ctx.window.__fn.ctaColors;
  assert.notDeepStrictEqual(c(mkEl({ dataset: { fx: 'srs' } })), c(mkEl({ dataset: { fx: 'browse' } })));
  assert.notDeepStrictEqual(c(mkEl({ dataset: { fx: 'srs' } })), c(mkEl({ dataset: { fx: 'redo' } })));
  assert.notDeepStrictEqual(c(mkEl({ dataset: { fx: 'browse' } })), c(mkEl({ dataset: { fx: 'redo' } })));
});

t('data-fx が無いものはテーマのアクセントに落ちる（色を失わない）', () => {
  const h = makeCtx({});
  const col = h.ctx.window.__fn.ctaColors(mkEl({}));
  assert.ok(Array.isArray(col) && col.length >= 2, '既定色が配列で返らない');
});

t('renderHero は主ボタンの data-fx を due の有無で入れ替える（席で固定しない）', () => {
  // 実装の意図をソースで守る。席で固定すると「同じ緑が復習を指す日」ができる
  assert.ok(/p1\.dataset\.fx = dueOn \? 'srs' : 'browse'/.test(HTML),
    '主ボタンの data-fx が due で入れ替わらない');
  assert.ok(/p2\.dataset\.fx = dueOn \? 'browse' : 'srs'/.test(HTML),
    '副ボタンの data-fx が due で入れ替わらない');
});

/* ══════════ 在庫の段 ══════════ */
sec('在庫の段（誤答の件数）');

t('0件なら data-load を外す（脈が残ると「片付いた」と矛盾する）', () => {
  const h = makeCtx({});
  const el = mkEl({ dataset: { load: '3' } });
  h.ctx.window.__fn.setRedoLoad(el, 0);
  assert.strictEqual(el.dataset.load, undefined, '0件なのに段が残っている');
});

t('件数が増えるほど段が上がる（1 → 10 → 30）', () => {
  const h = makeCtx({});
  const set = n => { const el = mkEl({}); h.ctx.window.__fn.setRedoLoad(el, n); return el.dataset.load; };
  assert.strictEqual(set(1), '1');
  assert.strictEqual(set(9), '1');
  assert.strictEqual(set(10), '2');
  assert.strictEqual(set(29), '2');
  assert.strictEqual(set(30), '3');
  assert.strictEqual(set(400), '3');
});

/* ══════════ 計器行のカウントアップ ══════════ */
sec('E6 計器行のカウントアップ');

t('非表示タブ（rAF が止まる）でも最終値に着地する', () => {
  // ⚠️ これが落ちると、裏で開いたハブの「復習待ち・連続・済 累計」が 0 のまま凍る
  const el = mkEl({ id: 'statDue', text: '0' });
  const h = makeCtx({ hidden: true, els: { statDue: el } });
  h.ctx.window.__fn.tickStat('statDue', 34);
  assert.notStrictEqual(el.textContent, '34', 'rAF 無しで即着地している（トゥイーンしていない）');
  h.drain();
  assert.strictEqual(el.textContent, '34', '非表示タブで数字が凍った');
});

t('表示中のタブでも最終値に着地する', () => {
  const el = mkEl({ id: 'statDone', text: '0' });
  const h = makeCtx({ els: { statDone: el } });
  h.ctx.window.__fn.tickStat('statDone', 3204);
  h.drain();
  assert.strictEqual(el.textContent, '3,204', '桁区切り付きで着地していない: ' + el.textContent);
});

t('値が変わらない再描画では突かない（同期のたびに数字が跳ねない）', () => {
  const dd = mkEl({});
  const el = mkEl({ id: 'statDue', text: '34' });
  el._dd = dd;
  const h = makeCtx({ els: { statDue: el } });
  h.ctx.window.__fn.tickStat('statDue', 34);
  h.drain();
  assert.strictEqual(dd.classList.contains('tick'), false, '同じ値なのに突いている');
});

t('値が変わった時だけ突く', () => {
  const dd = mkEl({});
  const el = mkEl({ id: 'statDue', text: '34' });
  el._dd = dd;
  const h = makeCtx({ els: { statDue: el } });
  h.ctx.window.__fn.tickStat('statDue', 35);
  h.drain();
  assert.strictEqual(dd.classList.contains('tick'), true, '増えたのに突いていない');
});

t('reduced-motion では即座に最終値（トゥイーンしない）', () => {
  const el = mkEl({ id: 'statDue', text: '0' });
  const h = makeCtx({ reduced: true, els: { statDue: el } });
  h.ctx.window.__fn.tickStat('statDue', 34);
  assert.strictEqual(el.textContent, '34');
});

/* ══════════ マークアップ／CSS の不変条件 ══════════ */
sec('マークアップ・CSS の不変条件');

t('overflow:hidden を付けたフレックス項目に最小幅を明示している', () => {
  // ⚠️ overflow:hidden はフレックス項目の min-width:auto を 0 に解決させる。
  //    明示しないと4つのボタンが折り返さず横一列に潰れて文言が全部切れる（実際に起きた）
  assert.ok(/\.cta-main,\.cta-sub\{min-width:min-content;\}/.test(HTML),
    '.cta-main/.cta-sub の min-width:min-content が無い');
  assert.ok(/\.cta-sub\{position:relative;overflow:hidden;\}/.test(HTML),
    'リップルを隠す overflow:hidden が .cta-sub に無い');
});

t('4つのボタンに入場の順番（--i）が入っている', () => {
  ['heroPrimary', 'heroSecondary', 'heroTertiary', 'heroYesterday'].forEach((id, i) => {
    const re = new RegExp('id="' + id + '"[^>]*style="--i:' + i + '"');
    assert.ok(re.test(HTML), id + ' の --i:' + i + ' が無い');
  });
});

t('計器行の3セルに入場の順番（--i）が入っている', () => {
  [0, 1, 2].forEach(i => {
    assert.ok(new RegExp('class="strip-c" style="--i:' + i + '"').test(HTML),
      'strip-c の --i:' + i + ' が無い');
  });
});

t('新しい常時演出が reduced-motion で止まる', () => {
  const rm = HTML.slice(HTML.indexOf('@media (prefers-reduced-motion:reduce)'));
  ['.cta-rip', '.cta-redo[data-load]::before', '.hero-inst::after'].forEach(sel => {
    assert.ok(rm.indexOf(sel) > 0, sel + ' が reduced-motion で止められていない');
  });
  assert.ok(rm.indexOf('.hero-num[data-goal="2"]') > 0,
    '目標超過の脈が reduced-motion で止められていない');
});

t('_tweenNum に非表示タブ用の落とし所がある', () => {
  const src = extract('_tweenNum');
  assert.ok(/setTimeout\(finish, dur \+ \d+\)/.test(src),
    'rAF が止まった時に最終値へ落とす保険が無い（数字が 0 で凍る）');
});

console.log('\n' + (fail ? 'FAILED  ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
