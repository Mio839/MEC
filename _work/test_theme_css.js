#!/usr/bin/env node
/**
 * テーマ別 CSS の分割と、重いファイルを増やさない約束（2026-09-28〜）。
 *
 *   node _work/test_theme_css.js
 *
 * 見るもの:
 *   1. 6ページとも ui_theme.css を直接読まず、ui_theme.js の後で MecUITheme.css('ui_theme') を呼ぶ
 *   2. ハブは index.css / index.js を外に持ち、インラインの <style> を持たない
 *   3. sw.js の SHELL に生成物16本と index.js があり、材料（ui_theme.css・index.css）は無い
 *   4. ui_theme.js のテーマ一覧と生成器のテーマ一覧が一致する
 *   5. 生成物は「ほかのテーマのセレクタだけを落とした」もの（テーマに関係ないセレクタは全テーマに残る）
 *   6. テーマの切り替え: 新しい CSS を読み終えてからクラスを付け替え、古い <link> を外す／2回続けても重複しない
 *   7. 大きさ: sw.js にコメントを積まない・テーマ別 CSS が肥大しない
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const gen = require('./build_theme_css.js');
const THEMES = gen.THEMES;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('FAIL  - ' + name + '\n        ' + (e && e.message)); }
}

const PAGES = ['index.html', 'study.html', 'stats.html', 'knowledge.html', 'mock.html', 'mock_karte.html'];

t('1. 6ページとも ui_theme.css を直接読まず、ui_theme.js の後でテーマ別 CSS を書き出す', () => {
  PAGES.forEach(p => {
    const s = rd(p);
    assert.ok(!/href="ui_theme\.css"/.test(s), p + ' が ui_theme.css を直接読んでいる（8テーマ全部を読むことになる）');
    const a = s.indexOf('<script src="ui_theme.js"></script>'), b = s.indexOf("<script>MecUITheme.css('ui_theme')</script>");
    assert.ok(a >= 0 && b > a, p + ': ui_theme.js の後に MecUITheme.css(\'ui_theme\') が無い');
    assert.ok(b < s.indexOf('<body'), p + ': <head> の中で書き出していない（描画前に効かない）');
  });
});

t('2. ハブは index.css / index.js を外に持ち、インラインの <style> を持たない', () => {
  const s = rd('index.html');
  assert.ok(!/<style[\s>]/.test(s), 'index.html にインラインの <style> が戻っている');
  const a = s.indexOf("MecUITheme.css('ui_theme')"), b = s.indexOf("MecUITheme.css('index')");
  assert.ok(b > a && b < s.indexOf('<body'), "MecUITheme.css('index') は ui_theme の後・<head> の中（元のインライン <style> の位置）");
  assert.ok(s.includes('<script src="index.js"></script>'), 'index.js を読んでいない');
  const big = (s.match(/<script>([\s\S]*?)<\/script>/g) || []).filter(x => x.length > 5000);
  assert.strictEqual(big.length, 0, 'index.html に大きなインライン <script> が戻っている');
});

t('3. sw.js の SHELL に生成物16本と index.js があり、材料は無い', () => {
  const sw = rd('sw.js');
  ['ui_theme', 'index'].forEach(n => THEMES.forEach(th => {
    assert.ok(sw.includes('"./theme_css/' + n + '.' + th + '.css"'), 'SHELL に theme_css/' + n + '.' + th + '.css が無い（オフラインで切り替えると崩れる）');
  }));
  assert.ok(sw.includes('"./index.js"'), 'SHELL に index.js が無い');
  assert.ok(!sw.includes('"./ui_theme.css"') && !sw.includes('"./index.css"'), '材料（ページが読まないファイル）が SHELL に入っている');
});

t('4. ui_theme.js のテーマ一覧と生成器のテーマ一覧が一致する', () => {
  const m = /var VALID_IDS = (\[[^\]]*\])/.exec(rd('ui_theme.js'));
  assert.deepStrictEqual(JSON.parse(m[1].replace(/'/g, '"')), THEMES);
});

t('5. 生成物は「ほかのテーマのセレクタだけを落とした」もの', () => {
  const tree = gen.parse(gen.stripComments(rd('ui_theme.css').replace(/\r\n/g, '\n')));
  const sels = items => items.flatMap(it => it.children ? sels(it.children) : (it.prelude && !it.prelude.startsWith('@') ? gen.splitSelectors(it.prelude) : []));
  const all = sels(tree);
  const re = th => new RegExp('\\.ui-' + th + '(?![\\w-])');
  THEMES.forEach(th => {
    const kept = sels(gen.filter(tree, th));
    const expect = all.filter(s => /:not\([^)]*\.ui-/.test(s) || !THEMES.some(o => re(o).test(s)) || re(th).test(s));
    assert.strictEqual(kept.length, expect.length, th + ': 残ったセレクタの数が合わない');
    assert.ok(!kept.some(s => THEMES.some(o => o !== th && re(o).test(s) && !re(th).test(s) && !/:not\(/.test(s))), th + ': ほかのテーマのセレクタが残っている');
  });
  // 材料の最上位で } が余っていたら生成器が止まる（ブラウザは次のルールを黙って捨てる）
  assert.throws(() => gen.parse('a{color:red}\n  color: blue;\n}\nb{color:red}'), /対応する \{ の無い \}/);
});

// ── 6. 切り替え（ui_theme.js を最小の DOM で動かす）──────────────────────
function mkEnv(theme) {
  const store = { mec_ui_theme_v1: theme };
  const head = { children: [] };
  function mkLink(attrs) {
    const l = { tag: 'link', attrs: Object.assign({}, attrs), listeners: {}, sheet: null, parentNode: head,
      getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      set href(v) { this.attrs.href = v; }, get href() { return this.attrs.href; },
      get nextSibling() { const i = head.children.indexOf(this); return i >= 0 ? head.children[i + 1] || null : null; },
      addEventListener(e, f) { (this.listeners[e] = this.listeners[e] || []).push(f); },
      removeEventListener(e, f) { this.listeners[e] = (this.listeners[e] || []).filter(x => x !== f); },
      fire(e) { if (e === 'load') this.sheet = {}; (this.listeners[e] || []).slice().forEach(f => f()); } };
    return l;
  }
  head.insertBefore = (n, ref) => { const i = ref ? head.children.indexOf(ref) : head.children.length; head.children.splice(i < 0 ? head.children.length : i, 0, n); n.parentNode = head; };
  head.removeChild = n => { head.children.splice(head.children.indexOf(n), 1); n.parentNode = null; };
  const cls = new Set();
  const timers = [];
  const document = {
    documentElement: { classList: { add: c => cls.add(c), remove: c => cls.delete(c) } },
    write(html) {
      const m = /data-mec-css="([^"]+)" href="([^"]+)"/.exec(html);
      const l = mkLink({ rel: 'stylesheet', 'data-mec-css': m[1], href: m[2] }); l.sheet = {};
      head.children.push(l);
    },
    createElement: () => mkLink({}),
    querySelectorAll: sel => head.children.filter(l => l.getAttribute('data-mec-css') !== null),
    dispatchEvent() {},
  };
  const ctx = { window: {}, document, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    setTimeout: (f, ms) => { timers.push(f); return timers.length; }, CustomEvent: function () {}, console };
  vm.createContext(ctx);
  vm.runInContext(rd('ui_theme.js'), ctx);
  return { M: ctx.window.MecUITheme, head, cls, timers };
}

t('6a. 読み込み時: 保存されたテーマの CSS を1つだけ書き出し、クラスもそのテーマ', () => {
  const e = mkEnv('brass');
  e.M.css('ui_theme'); e.M.css('index');
  assert.deepStrictEqual(e.head.children.map(l => l.href), ['theme_css/ui_theme.brass.css', 'theme_css/index.brass.css']);
  assert.ok(e.cls.has('ui-brass') && e.cls.size === 1);
});

t('6b. 切り替え: 新しい CSS を読み終えるまでクラスを変えず、読み終えたら古い <link> を外す', () => {
  const e = mkEnv('aurora');
  e.M.css('ui_theme'); e.M.css('index');
  e.M.set('frost');
  assert.ok(e.cls.has('ui-aurora'), '読み終える前にクラスを付け替えた（一瞬テーマ無しの画面になる）');
  assert.deepStrictEqual(e.head.children.map(l => l.href), ['theme_css/ui_theme.aurora.css', 'theme_css/ui_theme.frost.css',
    'theme_css/index.aurora.css', 'theme_css/index.frost.css'], '新しい <link> は古いものの直後（読み込み順を変えない）');
  e.head.children.filter(l => /frost/.test(l.href)).forEach(l => l.fire('load'));
  assert.ok(e.cls.has('ui-frost') && e.cls.size === 1);
  assert.deepStrictEqual(e.head.children.map(l => l.href), ['theme_css/ui_theme.frost.css', 'theme_css/index.frost.css']);
});

t('6c. 素早く2回切り替えても <link> が重複せず、最後のテーマになる', () => {
  const e = mkEnv('aurora');
  e.M.css('ui_theme');
  e.M.set('brass'); e.M.set('cyber');
  e.head.children.forEach(l => l.fire('load'));
  assert.deepStrictEqual(e.head.children.map(l => l.href), ['theme_css/ui_theme.cyber.css']);
  assert.ok(e.cls.has('ui-cyber') && e.cls.size === 1);
  e.timers.forEach(f => f());   // 保険のタイマーが後から走っても巻き戻らない
  assert.ok(e.cls.has('ui-cyber') && e.cls.size === 1);
});

t('6d. 読み込みに失敗しても（error）・来なくても（保険のタイマー）クラスは付け替わる', () => {
  const e1 = mkEnv('aurora'); e1.M.css('ui_theme'); e1.M.set('abyss');
  e1.head.children.filter(l => /abyss/.test(l.href)).forEach(l => l.fire('error'));
  assert.ok(e1.cls.has('ui-abyss'));
  const e2 = mkEnv('aurora'); e2.M.css('ui_theme'); e2.M.set('abyss');
  assert.ok(e2.cls.has('ui-aurora'));
  e2.timers.forEach(f => f());
  assert.ok(e2.cls.has('ui-abyss'));
});

t('7. 大きさ: sw.js にコメントを積まない・テーマ別 CSS が肥大しない', () => {
  const kb = f => fs.statSync(path.join(ROOT, f)).size / 1024;
  assert.ok(kb('sw.js') < 20, 'sw.js が ' + kb('sw.js').toFixed(0) + 'KB。変更履歴は _work/sw_changelog.md へ（sw.js はページを開くたびに取り直される）');
  THEMES.forEach(th => {
    assert.ok(kb('theme_css/ui_theme.' + th + '.css') < 120, 'theme_css/ui_theme.' + th + '.css が 120KB を超えた');
    assert.ok(kb('theme_css/index.' + th + '.css') < 260, 'theme_css/index.' + th + '.css が 260KB を超えた');
  });
});

console.log('\n' + pass + ' 件 ok / ' + fail + ' 件 失敗');
process.exit(fail ? 1 : 0);
