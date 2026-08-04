/**
 * 試験モードの演出を「画面の見えるところ」で発火させる可視帯(_fxBand / ceBand)を実ソースで検証する。
 * Run: node _work/test_fx_band.js
 *
 * 背景（iPad実機・2026-08-04）:
 *   正解時・連続正解時の演出が画面上部に寄って途切れていた。原因は発火座標が
 *   window.innerHeight の 0.40〜0.44 固定で、sticky ヘッダー(.st-hdr / .sn) の高さも
 *   visualViewport（Safariのツールバー・分割表示・ピンチ）も勘定に入っていなかったこと。
 *
 * 守りたいこと:
 *   - 焦点(cy)は必ずヘッダー下端より下＝隠れない。
 *   - 帯は可視域(visualViewport)の中に収まる＝画面外へはみ出さない。
 *   - ヘッダーが可視域を食い尽くす端末では帯を潰さず可視域全体へ戻す（演出が消えない）。
 *   - study_exam.js と chapter_exam.js のミラーが同じ幾何を返す。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}
function sec(s) { console.log('\n' + s); }

// ── 実ソースから可視帯まわりだけを切り出す ─────────────────────────────
function slice(src, startMark, endMark, label) {
  const a = src.indexOf(startMark);
  assert.ok(a >= 0, label + ': 開始マーカーが見つからない → ' + startMark);
  const b = src.indexOf(endMark, a);
  assert.ok(b > a, label + ': 終了マーカーが見つからない → ' + endMark);
  return src.slice(a, b + endMark.length);
}

// 改行コードはファイルごとにまちまち（CRLF/LF）なので正規化してから切り出す
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const STUDY = read('study_exam.js');
const CHAP  = read('chapter_exam.js');

const STUDY_BAND =
  slice(STUDY, 'function _examFxHeaderBottom()', 'return h ? h.getBoundingClientRect().bottom : 0;\n}', 'study/header') +
  '\n' +
  slice(STUDY, 'const FX_BAND_PAD', '\n}', 'study/band');
const CHAP_BAND =
  slice(CHAP, 'var CE_BAND_PAD', '\n  }\n  function ceBand()', 'chapter/header').replace(/function ceBand\(\)$/, '') +
  slice(CHAP, 'function ceBand()', '\n  }', 'chapter/band');

// ヘッダー h（0..headerH）と visualViewport（vTop..vTop+vH）を持つ最小の DOM を作る。
function evalBand(src, call, geo) {
  const headerRect = { top: geo.headerTop || 0, bottom: geo.headerH, height: geo.headerH, left: 0, width: geo.w };
  const ctx = {
    Math, JSON, console,
    document: {
      querySelector: () => (geo.headerH ? { getBoundingClientRect: () => headerRect } : null),
    },
    getComputedStyle: () => ({ position: 'sticky' }),
  };
  ctx.window = {
    innerWidth: geo.w, innerHeight: geo.h,
    visualViewport: geo.vv ? { offsetLeft: 0, offsetTop: geo.vTop || 0, width: geo.w, height: geo.vH } : null,
  };
  ctx.getComputedStyle = ctx.getComputedStyle;
  Object.assign(ctx, { innerWidth: geo.w, innerHeight: geo.h });
  vm.createContext(ctx);
  vm.runInContext(src + '\n;(' + call + ')', ctx);
  return vm.runInContext(call + '()', ctx);
}
const studyBand = geo => evalBand(STUDY_BAND, '_fxBand', geo);
const chapBand  = geo => evalBand(CHAP_BAND.replace(/\bceHeaderBottom\b/g, 'ceHeaderBottom'), 'ceBand', geo);

// iPad Safari 縦（1024pt・ヘッダー約128px）を基準の紙面にする
const IPAD = { w: 768, h: 1024, vv: true, vH: 1024, headerH: 128 };

sec('可視帯の基本（study_exam.js の _fxBand）');

t('焦点はヘッダーの下＝隠れない', () => {
  const b = studyBand(IPAD);
  assert.ok(b.cy > IPAD.headerH, '焦点 ' + b.cy + 'px がヘッダー下端 ' + IPAD.headerH + 'px より上にある');
  assert.ok(b.top >= IPAD.headerH, '帯の上端がヘッダーに食い込んでいる');
});

t('帯は可視域の中に収まる（画面外へはみ出さない）', () => {
  const b = studyBand(IPAD);
  assert.ok(b.top >= 0 && b.bottom <= IPAD.h, '帯が画面外へ出ている: ' + b.top + '..' + b.bottom);
  assert.ok(b.cy < IPAD.h, '焦点が画面下端より下にある');
});

t('旧実装（画面高の0.44）より下＝上端に寄らない', () => {
  const b = studyBand(IPAD);
  assert.ok(b.cy > IPAD.h * 0.44, '焦点 ' + b.cy + 'px が旧値 ' + Math.round(IPAD.h * 0.44) + 'px より上に戻っている');
});

t('横位置は可視域の中央', () => {
  assert.strictEqual(studyBand(IPAD).cx, 384);
});

t('ヘッダーが無いページでも成立する', () => {
  const b = studyBand({ w: 768, h: 1024, vv: true, vH: 1024, headerH: 0 });
  assert.ok(b.cy > 0 && b.cy < 1024);
  assert.ok(b.top > 0, '上端にパディングが無いと上向きの粒子が切れる');
});

sec('visualViewport 追従（Safariのツールバー・分割表示・ソフトキーボード）');

t('可視域が縮んだら帯も縮む（下端が可視域の外へ出ない）', () => {
  const b = studyBand({ w: 768, h: 1024, vv: true, vH: 620, headerH: 128 });
  assert.ok(b.bottom <= 620, '可視域 620px に対し帯の下端が ' + b.bottom + 'px');
});

t('可視域が下へずれたら帯もずれる（offsetTop に追従）', () => {
  const a = studyBand({ w: 768, h: 1024, vv: true, vH: 800, headerH: 0, vTop: 0 });
  const b = studyBand({ w: 768, h: 1024, vv: true, vH: 800, headerH: 0, vTop: 100 });
  assert.strictEqual(b.cy - a.cy, 100);
});

t('visualViewport が無い環境では innerWidth/innerHeight で成立する', () => {
  const b = studyBand({ w: 768, h: 1024, vv: false, headerH: 128 });
  assert.ok(b.cy > 128 && b.bottom <= 1024);
});

sec('潰れないこと（演出が消えるのが一番まずい）');

t('ヘッダーが可視域を食い尽くしても帯は可視域全体へ戻る', () => {
  const b = studyBand({ w: 768, h: 400, vv: true, vH: 400, headerH: 380 });
  assert.ok(b.height > 140, '帯が潰れて演出が1点に固まる: height=' + b.height);
  assert.ok(b.cy > 0 && b.cy < 400, '焦点が画面外: ' + b.cy);
});

t('高さは常に正（0除算・負のフォントサイズを作らない）', () => {
  [IPAD, { w: 320, h: 480, vv: true, vH: 480, headerH: 300 }].forEach(g => {
    const b = studyBand(g);
    assert.ok(b.height > 0 && b.width > 0);
  });
});

sec('study_exam.js と chapter_exam.js のミラー整合');

t('同じ紙面なら両者の帯は一致する', () => {
  const g = { w: 768, h: 1024, vv: true, vH: 1024, headerH: 128 };
  const a = studyBand(g), b = chapBand(g);
  ['top', 'bottom', 'cx', 'cy', 'width', 'height'].forEach(k => {
    assert.strictEqual(b[k], a[k], k + ' が食い違う: study=' + a[k] + ' / chapter=' + b[k]);
  });
});

t('パディング定数が両者で同じ', () => {
  const s = /const FX_BAND_PAD = (\d+)/.exec(STUDY);
  const c = /var CE_BAND_PAD = (\d+)/.exec(CHAP);
  assert.ok(s && c, '可視帯のパディング定数が見つからない');
  assert.strictEqual(c[1], s[1]);
});

sec('回帰ガード（一度直したものを戻さない）');

t('body を transform する演出が残っていない', () => {
  // body の transform は body 自身を position:fixed の包含ブロックにするため、
  // 揺れている間だけ全演出がページ先頭基準になって画面外へ飛ぶ。
  [['study_exam.js', STUDY], ['chapter_exam.js', CHAP]].forEach(([name, src]) => {
    const m = /document\.body\.animate\s*\(/.exec(src);
    assert.ok(!m, name + ' に document.body.animate() が復活している（演出レイヤーだけを揺らすこと）');
  });
});

t('演出の焦点に window.innerHeight の割合が残っていない', () => {
  const bad = STUDY.match(/window\.innerHeight\s*\*\s*0\.4/g) || [];
  assert.strictEqual(bad.length, 0, 'study_exam.js に画面高基準の焦点が残っている: ' + bad.join(', '));
  const bad2 = CHAP.match(/window\.innerHeight\s*\*\s*0\.4/g) || [];
  assert.strictEqual(bad2.length, 0, 'chapter_exam.js に画面高基準の焦点が残っている: ' + bad2.join(', '));
});

t('試験終了時の opacity:0!important を次の試験で外している', () => {
  // !important は WAAPI アニメより強い。外さないと2回目の試験でトースト・特大×nが出ない。
  ['examStreakToast', 'streakFullscreen', 'examStreakBorder'].forEach(id => {
    const i = STUDY.indexOf("getElementById('" + id + "')");
    assert.ok(i > 0, id + ' の取得箇所が見つからない');
    const near = STUDY.slice(i, i + 700);
    assert.ok(/removeProperty\('opacity'\)/.test(near),
      id + ' で opacity:0!important を外していない（2回目の試験で演出が出なくなる）');
  });
});

console.log('\n' + (fail ? 'FAILED  ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
