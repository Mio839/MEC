/**
 * 自己採点3段階（× / △ / ○）の SRS 更新を実ソース（study.html の _updateSRS）で検証する。
 * Run: node _work/test_srs_grade.js
 *
 * 背景: 2026-07-24 まで通常モードの「済」は無条件で正解扱いだった。想起テストを経ずに
 * 間隔だけが伸び、SRSが「定着済み」で埋まる一方 myrate_v1 とは食い違っていた。
 * ここで守りたい不変条件:
 *   - × は必ず翌日に戻し reps を 0 にする（間隔が伸びたまま残らない）
 *   - △ は伸びるが ○ より必ず遅い
 *   - 試験モードは真偽値で呼ぶ（true=○ / false=×）ので互換が壊れていない
 *   - 間隔は 90日、ef は 1.3〜2.5 を出ない
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');

// study.html のインラインJSから関数を名前で切り出す（波括弧の対応で末尾を決める）
function grabFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.ok(start > 0, 'not found: ' + name);
  let depth = 0;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

function makeCtx() {
  const ctx = {
    _srsData: {},
    _saveSRS() {},
    _markGradeOn() {},
    document: { querySelectorAll: () => [] },
    Math, Date, JSON, console,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(
    grabFn(HTML, '_today') + '\n' +
    grabFn(HTML, '_addDays') + '\n' +
    grabFn(HTML, '_updateSRS') + '\n', ctx);
  return ctx;
}

// 別 vm コンテキストで作られたオブジェクトは prototype が異なり deepStrictEqual が
// 「same structure but not reference-equal」で落ちる。中身だけを比べる。
const same = (a, b, msg) =>
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

const U = 'endo_ch01_q1';

t('初回 ○ は翌日・reps=1', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 1);
  assert.strictEqual(c._srsData[U].reps, 1);
  assert.strictEqual(c._srsData[U].g, 'ok');
});

t('○ を重ねると 1 → 6 → ef倍 と伸びる', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 6);
  c._updateSRS(U, 'ok');
  assert.ok(c._srsData[U].interval > 6, '3回目で6日より伸びる');
});

t('△ の伸びは常に ○ より遅い', () => {
  const mid = makeCtx(), ok = makeCtx();
  for (let i = 0; i < 4; i++) { mid._updateSRS(U, 'mid'); ok._updateSRS(U, 'ok'); }
  assert.ok(mid._srsData[U].interval < ok._srsData[U].interval,
    `mid=${mid._srsData[U].interval} < ok=${ok._srsData[U].interval}`);
});

t('△ でも間隔は単調に伸びる（同じ日に張り付かない）', () => {
  const c = makeCtx();
  const seen = [];
  for (let i = 0; i < 6; i++) { c._updateSRS(U, 'mid'); seen.push(c._srsData[U].interval); }
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i] >= seen[i - 1], '間隔が縮まない: ' + seen.join(','));
  }
  assert.ok(seen[seen.length - 1] > seen[0], '最終的には伸びる: ' + seen.join(','));
});

t('× は間隔を1日へ戻し reps を 0 にする', () => {
  const c = makeCtx();
  for (let i = 0; i < 5; i++) c._updateSRS(U, 'ok');
  assert.ok(c._srsData[U].interval > 10, '前提: 十分伸びている');
  c._updateSRS(U, 'ng');
  assert.strictEqual(c._srsData[U].interval, 1);
  assert.strictEqual(c._srsData[U].reps, 0);
  assert.strictEqual(c._srsData[U].g, 'ng');
});

t('× は ef を下げ、△ は ef を据え置く', () => {
  const a = makeCtx(), b = makeCtx();
  a._updateSRS(U, 'ng');
  b._updateSRS(U, 'mid');
  assert.ok(a._srsData[U].ef < 2.5, '× で ef が下がる');
  assert.strictEqual(b._srsData[U].ef, 2.5, '△ は ef 据え置き');
});

t('試験モードの真偽値呼び出しと互換（true=○ / false=×）', () => {
  const bool = makeCtx(), str = makeCtx();
  bool._updateSRS(U, true); str._updateSRS(U, 'ok');
  same(bool._srsData[U], str._srsData[U], 'true が ok と一致');
  bool._updateSRS(U, false); str._updateSRS(U, 'ng');
  same(bool._srsData[U], str._srsData[U], 'false が ng と一致');
});

t('未知の grade は ○ とみなす（旧呼び出しを壊さない）', () => {
  const a = makeCtx(), b = makeCtx();
  a._updateSRS(U, undefined); b._updateSRS(U, 'ok');
  same(a._srsData[U], b._srsData[U], 'undefined が ok と一致');
});

t('間隔は90日、ef は 1.3〜2.5 を出ない', () => {
  const c = makeCtx();
  for (let i = 0; i < 40; i++) c._updateSRS(U, 'ok');
  assert.ok(c._srsData[U].interval <= 90, 'interval=' + c._srsData[U].interval);
  assert.ok(c._srsData[U].ef <= 2.5);
  const d = makeCtx();
  for (let i = 0; i < 40; i++) d._updateSRS(U, 'ng');
  assert.ok(d._srsData[U].ef >= 1.3, 'ef=' + d._srsData[U].ef);
});

t('nextReview は今日+interval（JST）', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const want = new Date(new Date(today + 'T00:00:00Z').getTime() + 86400000)
    .toISOString().slice(0, 10);
  assert.strictEqual(c._srsData[U].nextReview, want);
  assert.strictEqual(c._srsData[U].lastSeen, today);
});

console.log(`\n${fail ? 'FAILED' : 'all passed'}  (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
