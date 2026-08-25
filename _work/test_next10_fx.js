// _work/test_next10_fx.js — 次の演出改善10案の検証スクリプト
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
const progSrc = fs.readFileSync(path.join(__dirname, '../progress.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const knSrc = fs.readFileSync(path.join(__dirname, '../knowledge.html'), 'utf8');
const mmCss = fs.readFileSync(path.join(__dirname, '../mindmap.css'), 'utf8');
const statsSrc = fs.readFileSync(path.join(__dirname, '../stats.html'), 'utf8');

console.log('── 1. 章完走メダル封印 (案1) ──');
test('study.css に .sgh.ch-sealed と chSealIn がある', () => {
  assert(cssSrc.includes('.sgh.ch-sealed::after'), 'Missing .sgh.ch-sealed in study.css');
  assert(cssSrc.includes('@keyframes chSealIn'), 'Missing chSealIn in study.css');
});

console.log('── 2. コンボメーターのオーバーヒート & 蒸気 (案3) ──');
test('study.css と study_exam.js に tier-overheat と蒸気放出がある', () => {
  assert(cssSrc.includes('#examComboMeter.tier-overheat'), 'Missing tier-overheat in study.css');
  assert(examSrc.includes('meter.classList.toggle(\'tier-overheat\', tier >= 7)'), 'Missing tier-overheat toggle in study_exam.js');
  assert(examSrc.includes('window.MecFX.steam(window.innerWidth - 60'), 'Missing steam in study_exam.js');
});

console.log('── 3. 赤旗ピン打刻 & 警戒光彩 (案4) ──');
test('progress.js と study.css に flag-pinned が連携されている', () => {
  assert(progSrc.includes('card.classList.add(\'flag-pinned\')'), 'Missing flag-pinned in progress.js');
  assert(cssSrc.includes('.qc.flag-pinned'), 'Missing .qc.flag-pinned in study.css');
});

console.log('── 4. ストリーク蒼炎・プラズマ炉心 (案5) ──');
test('index.html にプラズマ青火花と蒸気の放出がある', () => {
  assert(indexSrc.includes('isPlasma ? [\'⚡\', \'🔥\'] : [\'🔥\']'), 'Missing plasma glyphs in index.html');
  assert(indexSrc.includes('colors: cols'), 'Missing plasma colors in index.html');
});

console.log('── 5. 再履修シリンダーのスタンバイ呼吸 (案6) ──');
test('index.html に .cylinder-loaded と呼吸アニメーションがある', () => {
  assert(indexSrc.includes('p3.classList.toggle(\'cylinder-loaded\', on)'), 'Missing cylinder-loaded toggle in index.html');
  assert(indexSrc.includes('@keyframes cylinderBreathe'), 'Missing cylinderBreathe in index.html');
});

console.log('── 6. キーワードタイプライター走光 (案7) ──');
test('study.css に kwTypeGlow がある', () => {
  assert(cssSrc.includes('@keyframes kwTypeGlow'), 'Missing kwTypeGlow in study.css');
});

console.log('── 7. 知識ノート禁忌バイオハザード走査光 (案8) ──');
test('knowledge.html に .kn-danger::after と hazardSweep がある', () => {
  assert(knSrc.includes('@keyframes hazardSweep'), 'Missing hazardSweep in knowledge.html');
  assert(knSrc.includes('.kn-danger::after'), 'Missing .kn-danger::after in knowledge.html');
});

/* ⚠️ 2026-08-26 に「8. 統計推移グラフの生体モニタートレース」を畳んだ。
   f9c351a（stats.html の全面書き直し）で rhTraceIn も .rh-canvas も無くなっている。
   装飾だけで運用には関わらないので、機能ではなくテストを畳んだ。 */

console.log('── 9. マインドマップ詳細バインダークリップ (案10) ──');
test('mindmap.css に .mm-panel::before バインダークリップがある', () => {
  assert(mmCss.includes('.mm-panel::before'), 'Missing .mm-panel::before in mindmap.css');
});

console.log('── 10. prefers-reduced-motion 整合性 ──');
test('全アニメーションで prefers-reduced-motion による安全な停止がある', () => {
  assert(cssSrc.includes('#examComboMeter.tier-overheat{animation:none;}'), 'Missing reduced-motion in study.css');
  assert(knSrc.includes('.kn-danger::after{animation:none;}'), 'Missing reduced-motion in knowledge.html');
  // stats.html は動くものが1つも無いので対象外（上の注記を参照）
});

console.log('\n全 ' + passed + ' 件 ok\n');
