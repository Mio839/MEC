/**
 * progress.js の mecCopyText（iOS向けクリップボード）を実ソースから検証する。
 * Run: node _work/test_copy.js
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'progress.js'), 'utf8');

// 最小限のDOM/ブラウザスタブ。execCommand と clipboard の可否を差し替えて挙動を見る
// execOk … execCommand の戻り値
// fireCopy … 実際に copy イベントが起きるか。execCommand は「コピーしていないのに true」を
//            返す端末があるため、mecCopyText はイベント発火を成功の根拠にしている。
//            この2つを別々に振れることがこのテストの肝。
function env({ execOk = true, fireCopy = true, execThrows = false, clipboard = null, noSelection = false } = {}) {
  const log = [];
  const written = {};
  const store = Object.create(null);
  const mkEl = () => {
    const el = {
      style: { cssText: '' }, dataset: {}, value: '', _attrs: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute(k, v) { this._attrs[k] = v; }, removeAttribute(k) { delete this._attrs[k]; },
      appendChild() {}, prepend() {}, after() {}, remove() { log.push('remove'); },
      addEventListener() {}, focus() { log.push('focus'); },
      select() { log.push('select'); },
      textContent: '',
      setSelectionRange(a, b) { log.push('setSelectionRange:' + a + ',' + b); },
      querySelector: () => null, querySelectorAll: () => [],
      closest: () => null, getBoundingClientRect: () => ({ height: 0, top: 0 }),
    };
    return el;
  };
  const copyListeners = [];
  const document = {
    addEventListener(type, fn) { if (type === 'copy') copyListeners.push(fn); },
    removeEventListener(type, fn) {
      if (type !== 'copy') return;
      const i = copyListeners.indexOf(fn);
      if (i >= 0) copyListeners.splice(i, 1);
    },
    dispatchEvent: () => true,
    createElement(tag) { log.push('createElement:' + tag); return mkEl(); },
    createRange() {
      return { selectNodeContents(n) { log.push('selectNodeContents'); } };
    },
    execCommand(cmd) {
      log.push('execCommand:' + cmd);
      if (execThrows) throw new Error('boom');
      if (fireCopy) {
        // 本物のブラウザと同じく、コピーが成立したときだけ copy イベントが飛ぶ
        const ev = {
          clipboardData: { setData(type, v) { written[type] = v; } },
          preventDefault() { log.push('preventDefault'); },
        };
        copyListeners.slice().forEach(fn => fn(ev));
      }
      return execOk;
    },
    head: { appendChild() {} },
    body: { appendChild(el) { log.push('append'); }, classList: { add() {}, remove() {} } },
    querySelector: () => null, querySelectorAll: () => [],
    documentElement: mkEl(), hidden: false,
  };
  const win = {
    document, localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; },
    },
    location: { href: 'https://x/', search: '', hash: '', pathname: '/' },
    history: { replaceState() {} },
    getSelection: noSelection ? () => null : () => ({
      rangeCount: 0, getRangeAt() { return null; },
      removeAllRanges() { log.push('removeAllRanges'); },
      addRange() { log.push('addRange'); },
    }),
    navigator: clipboard ? { clipboard, onLine: true } : { onLine: true },
    addEventListener() {}, setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener() {} }),
    CustomEvent: function () {}, atob: s => s, btoa: s => s,
    requestAnimationFrame: fn => fn(),
  };
  const ctx = Object.assign(win, { window: win });
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { copy: win.mecCopyText, log, win, written };
}

let passed = 0; const fails = [];
function test(n, f) {
  return Promise.resolve().then(f).then(
    () => { passed++; console.log('  ok  - ' + n); },
    e => { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + (e && e.message)); });
}

(async () => {
  await test('mecCopyText が公開されている', () => {
    const { copy } = env();
    assert.strictEqual(typeof copy, 'function');
  });

  await test('execCommand が成功したら clipboard API を呼ばない（iOSで操作文脈を失わない）', async () => {
    let called = false;
    const { copy, log } = env({ execOk: true, clipboard: { writeText: () => { called = true; return Promise.resolve(); } } });
    assert.strictEqual(await copy('hello'), true);
    assert.ok(log.includes('execCommand:copy'), 'execCommand が呼ばれていない');
    assert.strictEqual(called, false, 'execCommand成功時にclipboard APIを呼んではいけない');
  });

  await test('execCommand が失敗したら clipboard API に落ちる', async () => {
    let got = null;
    const { copy } = env({ execOk: false, clipboard: { writeText: t => { got = t; return Promise.resolve(); } } });
    assert.strictEqual(await copy('fallback'), true);
    assert.strictEqual(got, 'fallback');
  });

  await test('clipboard API が拒否したら false を返す（例外を投げない）', async () => {
    const { copy } = env({ execOk: false, clipboard: { writeText: () => Promise.reject(new Error('NotAllowed')) } });
    assert.strictEqual(await copy('x'), false);
  });

  await test('clipboard API が無くても落ちない', async () => {
    const { copy } = env({ execOk: false, clipboard: null });
    assert.strictEqual(await copy('x'), false);
  });

  await test('execCommand が例外を投げても clipboard API に落ちる', async () => {
    const { copy } = env({ execThrows: true, clipboard: { writeText: () => Promise.resolve() } });
    assert.strictEqual(await copy('x'), true);
  });

  await test('iOS作法: Rangeで選択し setSelectionRange まで行う', async () => {
    const { copy, log } = env({ execOk: true });
    await copy('abcde');
    assert.ok(log.includes('selectNodeContents'), 'Range選択していない（iOSはselect()だけでは効かない）');
    assert.ok(log.includes('setSelectionRange:0,5'), 'setSelectionRange していない');
  });

  await test('作業用textareaは必ず取り除かれる', async () => {
    const { copy, log } = env({ execOk: true });
    await copy('x');
    assert.ok(log.includes('createElement:textarea'));
    assert.ok(log.includes('remove'), 'textarea が残っている');
  });

  await test('getSelection が使えない環境でも例外にならない', async () => {
    const { copy } = env({ execOk: true, noSelection: true });
    assert.strictEqual(await copy('x'), true);
  });

  await test('null / undefined は空文字として扱う', async () => {
    const { copy } = env({ execOk: true });
    assert.strictEqual(await copy(null), true);
    assert.strictEqual(await copy(undefined), true);
  });

  // ── 「コピーしていないのに成功と言う」経路の回帰テスト ────────────────
  // 実際にiPadで、ボタンが✅になるのにクリップボードが空という状態が起きた。
  // 原因は execCommand の戻り値だけを信じていたこと。copy イベントの発火を根拠にする。
  await test('execCommandがtrueでもcopyイベントが起きなければ成功としない', async () => {
    let called = false;
    const { copy } = env({
      execOk: true, fireCopy: false,
      clipboard: { writeText: () => { called = true; return Promise.resolve(); } },
    });
    assert.strictEqual(await copy('x'), true, 'clipboard API に落ちて成功するはず');
    assert.strictEqual(called, true, 'copyイベントが無いのに execCommand を信じてはいけない');
  });

  await test('execCommandがtrueでもcopyイベント無し・clipboard無しなら false', async () => {
    const { copy } = env({ execOk: true, fireCopy: false, clipboard: null });
    assert.strictEqual(await copy('x'), false);
  });

  await test('copyイベントで本文を直接書き込む（選択範囲に依存しない）', async () => {
    const { copy, written, log } = env({ execOk: true });
    assert.strictEqual(await copy('エラー報告一覧\n科目: 消化器'), true);
    assert.strictEqual(written['text/plain'], 'エラー報告一覧\n科目: 消化器', 'クリップボードへ載る中身が違う');
    assert.ok(log.includes('preventDefault'), '既定動作を止めていない');
  });

  await test('textareaはフォーカスしてから選択する（focusを忘れると選択が採用されない）', async () => {
    const { copy, log } = env({ execOk: true });
    await copy('abcde');
    assert.ok(log.includes('focus'), 'focus していない');
    assert.ok(log.includes('select'), 'select() していない');
    // Range を張ると textarea 側の選択が潰れるので setSelectionRange は Range より後
    assert.ok(log.indexOf('selectNodeContents') < log.indexOf('setSelectionRange:0,5'),
      'setSelectionRange は Range のあとに呼ぶこと（順序が逆だと選択が空になる）');
  });

  // ── エラー報告ビューア（study.html / index.html 共通実装） ─────────────
  await test('共有ビューアと定数が公開されている', () => {
    const e = env();
    assert.strictEqual(typeof e.win.mecOpenErrReports, 'function');
    assert.strictEqual(typeof e.win.mecTapConfirm, 'function');
    assert.strictEqual(Object.keys(e.win.mecErrTypeLabels).length, 6, '種別ラベルは6種');
    assert.strictEqual(e.win.mecSidNames.dige, '消化器');
  });

  await test('mecTapConfirm は1回目false・2回目trueで、ラベルを元に戻す', () => {
    const e = env();
    const btn = { dataset: {}, textContent: '🗑️ 全消去', classList: { add() {}, remove() {} } };
    assert.strictEqual(e.win.mecTapConfirm(btn, '⚠️ もう一度'), false, '1回目は実行しない');
    assert.strictEqual(btn.textContent, '⚠️ もう一度', '警告ラベルに変わる');
    assert.strictEqual(e.win.mecTapConfirm(btn, '⚠️ もう一度'), true, '2回目で実行');
    assert.strictEqual(btn.textContent, '🗑️ 全消去', 'ラベルが戻る');
  });

  await test('mecTapConfirm はボタン無しなら素通しする', () => {
    const e = env();
    assert.strictEqual(e.win.mecTapConfirm(null, 'x'), true);
  });

  console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed') +
              '  (' + passed + '/' + (passed + fails.length) + ')');
  if (fails.length) process.exit(1);
})();
