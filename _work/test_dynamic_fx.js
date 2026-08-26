// _work/test_dynamic_fx.js — ダイナミック演出10案の検証スクリプト
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok  - ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL - ' + name + '\n    ' + e.message);
    process.exitCode = 1;
  }
}

const cssSrc = fs.readFileSync(path.join(__dirname, '../study.css'), 'utf8');
const examSrc = fs.readFileSync(path.join(__dirname, '../study_exam.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const mmSrc = fs.readFileSync(path.join(__dirname, '../mindmap.js'), 'utf8');

console.log('── 1. 全画面オーバードライブ & 稲妻 (案1) ──');
test('study.css と study_exam.js に exam-overdrive と lightning がある', () => {
  assert(cssSrc.includes('body.exam-overdrive::before'), 'Missing body.exam-overdrive in study.css');
  assert(examSrc.includes('document.body.classList.add(\'exam-overdrive\')'), 'Missing exam-overdrive in study_exam.js');
  assert(examSrc.includes('window.MecFX.lightning'), 'Missing lightning in study_exam.js');
});

console.log('── 2. 正解カード3D浮遊 & 大爆発スターバースト (案2) ──');
test('study.css と study_exam.js に card-3d-pop と大量バーストがある', () => {
  assert(cssSrc.includes('.qc.card-3d-pop'), 'Missing .qc.card-3d-pop in study.css');
  assert(examSrc.includes('card.classList.add(\'card-3d-pop\')'), 'Missing card-3d-pop in study_exam.js');
  assert(examSrc.includes('count: 32 + t * 8'), 'Missing boosted burst count in study_exam.js');
});

console.log('── 3. 誤答スクリーンシェイク & 警告赤フラッシュ (案3) ──');
// §13 Z3: 揺れは `<body>` を transform する CSS ではなく
// _shakeFxLayers()（演出レイヤーだけ）で出す。body を transform すると body が
// position:fixed の包含ブロックになり、揺れている間だけ全演出がページ先頭基準へ飛ぶ。
// 赤フラッシュは body::after の疑似要素なのでクラスのままでよい。
test('誤答ダメージは赤フラッシュ＋_shakeFxLayers で、body を transform しない', () => {
  assert(cssSrc.includes('body.exam-red-flash::after'), 'Missing exam-red-flash in study.css');
  assert(!/@keyframes\s+screenShakeAnim/.test(cssSrc), 'body を transform する screenShakeAnim が復活している（§13-1 ③）');
  assert(!/(?:^|[;}\s])body\.exam-screen-shake\s*\{/m.test(cssSrc), 'body.exam-screen-shake のルールが復活している（§13-1 ③）');
  assert(examSrc.includes('function _wrongDamageFx()'), 'Missing _wrongDamageFx in study_exam.js');
  assert(examSrc.includes('_wrongDamageFx();'), 'Missing _wrongDamageFx call in study_exam.js');
  const fnBody = examSrc.slice(examSrc.indexOf('function _wrongDamageFx()'), examSrc.indexOf('function _wrongDamageFx()') + 1200);
  assert(fnBody.includes('_shakeFxLayers('), '_wrongDamageFx が _shakeFxLayers を使っていない');
});

console.log('── 4. 神速スラッシュ残像フリーズ (案6) ──');
test('study.css と study_exam.js に exam-slash-freeze がある', () => {
  // §13 Z2: filter は body ではなくカード側（.qc）に掛ける。
  assert(cssSrc.includes('body.exam-slash-freeze .qc'), 'Missing exam-slash-freeze .qc in study.css');
  assert(!/(?:^|[;}\s])body\.exam-slash-freeze\s*\{/m.test(cssSrc), 'filter が body へ戻っている（§13-1 ②）');
  assert(examSrc.includes('document.body.classList.add(\'exam-slash-freeze\')'), 'Missing slash freeze in study_exam.js');
});

console.log('── 5. リザルト大花火 & 紙吹雪キャノン (案5) ──');
test('study_exam.js に超大規模花火と紙吹雪がある', () => {
  assert(examSrc.includes('count: 16'), 'Missing 16 fireworks in study_exam.js');
  assert(examSrc.includes('count: 240'), 'Missing 240 confetti in study_exam.js');
});

console.log('── 6. ハブ目標達成の全方位スチーム大爆発 & コイン噴火 (案7) ──');
test('index.html に全方位スチーム・大量ギア・金貨がある', () => {
  assert(indexSrc.includes('count: 24, spread: 380'), 'Missing 24 gears in index.html');
  assert(indexSrc.includes('count: 120'), 'Missing 120 confetti in index.html');
  assert(indexSrc.includes('rise: 180'), 'Missing large steam rise in index.html');
});

console.log('── 7. 難問突破クラウン & 宝石バースト (案10) ──');
test('study_exam.js と study.css に 👑 クラウンと宝石バーストがある', () => {
  assert(examSrc.includes('👑 '), 'Missing crown in study_exam.js');
  assert(examSrc.includes('count: 48'), 'Missing 48 gem burst in study_exam.js');
  assert(cssSrc.includes('@keyframes hardCrownPop'), 'Missing hardCrownPop in study.css');
});

console.log('── 8. 読影X線ビーム走査 (案8) ──');
test('study.css に .qimg.xray-scanned がある', () => {
  assert(cssSrc.includes('.qimg.xray-scanned'), 'Missing xray-scanned in study.css');
});

console.log('── 9. マインドマップ連鎖発光ビッグバン (案9) ──');
test('mindmap.js に親から子への連鎖パルスがある', () => {
  assert(mmSrc.includes('info.rings.forEach(ring => ring.forEach'), 'Missing synaptic chain in mindmap.js');
});

console.log('── 10. exitExam での完全クリーンアップ ──');
test('exitExam でオーバードライブとシェイクが解除される', () => {
  assert(examSrc.includes('exam-overdrive\', \'exam-screen-shake\', \'exam-red-flash\', \'exam-slash-freeze\''), 'Missing exitExam cleanup in study_exam.js');
});

console.log('\n全 ' + passed + ' 件 ok\n');
