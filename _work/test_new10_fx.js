// _work/test_new10_fx.js — 新・演出特化10案の検証スクリプト
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
const fxSrc = fs.readFileSync(path.join(__dirname, '../fx_engine.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const gmSrc = fs.readFileSync(path.join(__dirname, '../gamify.js'), 'utf8');

console.log('── 1. 溶鉄ヒートチャージ & 陽炎 (案1) ──');
test('study.css と study_exam.js に card-heat と heatHaze がある', () => {
  assert(cssSrc.includes('.qc.card-heat-low'), 'Missing .qc.card-heat-low in study.css');
  assert(cssSrc.includes('.qc.card-heat-max'), 'Missing .qc.card-heat-max in study.css');
  assert(cssSrc.includes('@keyframes heatHaze'), 'Missing @keyframes heatHaze in study.css');
  assert(examSrc.includes('card-heat-max'), 'Missing card-heat toggle in study_exam.js');
});

console.log('── 2. 超集中バレットタイム (案2) ──');
test('study.css と study_exam.js に exam-bullet-time がある', () => {
  assert(cssSrc.includes('body.exam-bullet-time'), 'Missing exam-bullet-time in study.css');
  assert(examSrc.includes('document.body.classList.add(\'exam-bullet-time\')'), 'Missing bullet time add in study_exam.js');
  assert(examSrc.includes('document.body.classList.remove(\'exam-bullet-time\')'), 'Missing bullet time remove in study_exam.js');
});

console.log('── 3. 3Dジャイロ・リアル光沢ティルトの完全削除 (案3削除) ──');
test('study.css と study_exam.js から qc-3d-tilt と _initTiltEffect が完全に削除されている', () => {
  assert(!cssSrc.includes('.qc.qc-3d-tilt'), 'Found residual .qc.qc-3d-tilt in study.css');
  assert(!examSrc.includes('function _initTiltEffect()'), 'Found residual _initTiltEffect in study_exam.js');
});

console.log('── 4. チェックポイント・光のワープゲート (案4) ──');
test('study.css と study_exam.js に warp-gate-overlay と _triggerWarpGate がある', () => {
  assert(cssSrc.includes('.warp-gate-overlay'), 'Missing .warp-gate-overlay in study.css');
  assert(cssSrc.includes('@keyframes warpGateRing'), 'Missing warpGateRing in study.css');
  assert(examSrc.includes('function _triggerWarpGate(n)'), 'Missing _triggerWarpGate in study_exam.js');
});

console.log('── 5. 活版インク染み込み (案5) ──');
test('study.css に .ans.open と inkBleedIn がある', () => {
  assert(cssSrc.includes('.ans.open'), 'Missing .ans.open in study.css');
  assert(cssSrc.includes('@keyframes inkBleedIn'), 'Missing inkBleedIn in study.css');
});

console.log('── 6. 全画面オーディオビジュアライザー音波 (案6) ──');
test('fx_engine.js と study_exam.js に sonicWave がある', () => {
  assert(fxSrc.includes('sonicWave: sonicWave'), 'Missing sonicWave export in fx_engine.js');
  assert(examSrc.includes('window.MecFX.sonicWave'), 'Missing sonicWave call in study_exam.js');
});

console.log('── 7. ダイナミック環境ライティング (案7) ──');
test('study.css と study_exam.js に env-nightshift と _applyEnvLighting がある', () => {
  assert(cssSrc.includes('body.env-nightshift'), 'Missing env-nightshift in study.css');
  assert(examSrc.includes('function _applyEnvLighting()'), 'Missing _applyEnvLighting in study_exam.js');
});

console.log('── 8. 真鍮トロフィー溶鉄鋳造 (案8) ──');
test('gamify.js に科目・章制覇時の溶鉄鍛造バーストがある', () => {
  assert(gmSrc.includes('colors: [\'#FFD700\', \'#FF8C00\', \'#FFFFFF\', \'#FFA040\']'), 'Missing foundry colors in gamify.js');
});

console.log('── 9. 星図リンク・天球儀コネクト (案9) ──');
test('index.html に hubConstellation と _initConstellation がある', () => {
  assert(indexSrc.includes('hubConstellation'), 'Missing hubConstellation in index.html');
  assert(indexSrc.includes('function _initConstellation()'), 'Missing _initConstellation in index.html');
});

console.log('── 10. 重厚メカニカルトグル打刻 & 電気スパーク (案10) ──');
test('fx_engine.js, study.css, study_exam.js に sparks と active 押し込みがある', () => {
  assert(fxSrc.includes('sparks: sparks'), 'Missing sparks in fx_engine.js');
  assert(cssSrc.includes('.ch2:active'), 'Missing .ch2:active in study.css');
  assert(examSrc.includes('window.MecFX.sparks'), 'Missing sparks call in study_exam.js');
});

console.log('\n全 ' + passed + ' 件 ok\n');
