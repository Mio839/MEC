// _work/test_step1_fx.js — Step 1 演出強化の検証スクリプト
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

const fxSrc = fs.readFileSync(path.join(__dirname, '../fx_engine.js'), 'utf8');
const examSrc = fs.readFileSync(path.join(__dirname, '../study_exam.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(__dirname, '../study.css'), 'utf8');
const calcSrc = fs.readFileSync(path.join(__dirname, '../calc_input.js'), 'utf8');

console.log('── Step 1: fx_engine.js 新規エミッタ ──');
test('1. 新規エミッタが window.MecFX に登録されている', () => {
  ['defibShock', 'brushDust', 'pixelPop', 'diamondSparkle', 'slashRibbon'].forEach(name => {
    assert(fxSrc.includes(name + ': ' + name), 'Missing export: ' + name);
  });
});

test('2. 既存のエミッタが全て保持されている（純増ルール）', () => {
  ['burst', 'confetti', 'glyphRain', 'petals', 'warp', 'bubbles', 'fireworks',
   'lightning', 'rings', 'floaters', 'glyphBurst', 'gears', 'gearRain', 'steam',
   'attractor', 'glitchBars', 'dust', 'shatter', 'ribbon', 'stamp', 'orbit', 'wave'].forEach(name => {
    assert(fxSrc.includes(name + ': ' + name), 'Lost export: ' + name);
  });
});

console.log('── Step 1: study_exam.js テーマシグネチャ & 克服火花 & 神速一閃 ──');
test('3. _spawnScatteredCelebration にテーマ別シグネチャエミッタ呼び出しがある', () => {
  assert(examSrc.includes('defibShock'), 'Missing defibShock in examSrc');
  assert(examSrc.includes('brushDust'), 'Missing brushDust in examSrc');
  assert(examSrc.includes('pixelPop'), 'Missing pixelPop in examSrc');
  assert(examSrc.includes('diamondSparkle'), 'Missing diamondSparkle in examSrc');
});

test('4. 克服時に金床火花 (burst) が発火する', () => {
  assert(examSrc.includes('prior && prior.wasWrong'), 'Missing prior.wasWrong check');
  assert(examSrc.includes('shapes: [\'shard\', \'square\']'), 'Missing spark burst in prior.wasWrong');
});

test('5. 超速答時にスラッシュ光刃 (slashRibbon) が発火する', () => {
  assert(examSrc.includes('slashRibbon'), 'Missing slashRibbon in examSrc');
  assert(examSrc.includes('_fastGrade(card) === 1'), 'Missing _fastGrade check');
});

console.log('── Step 1: 複数選択の装填状態 (exam-target-loaded) ──');
test('6. _updateMultiInfo で .exam-target-loaded を同期している', () => {
  assert(examSrc.includes('exam-target-loaded'), 'Missing exam-target-loaded in examSrc');
});

test('7. study.css に .exam-target-loaded の点火スタイルが定義されている', () => {
  assert(cssSrc.includes('.qc.exam-target-loaded .exam-reveal-btn'), 'Missing button pulse in study.css');
  assert(cssSrc.includes('@keyframes examBtnReady'), 'Missing examBtnReady keyframe in study.css');
});

test('8. exitExam で .exam-target-loaded をクリーンアップしている', () => {
  assert(examSrc.includes('document.querySelectorAll(\'.qc.exam-target-loaded\').forEach'), 'Missing cleanup in exitExam');
});

console.log('── Step 1: 計算問題オドメーター (calc_input.js) ──');
test('9. calc_input.js にドラムスピン・ロックアニメーションが定義されている', () => {
  assert(calcSrc.includes('calcDrumSpin'), 'Missing calcDrumSpin in calc_input.js');
  assert(calcSrc.includes('calcLockIn'), 'Missing calcLockIn in calc_input.js');
  assert(calcSrc.includes('calc-spin'), 'Missing calc-spin class in calc_input.js');
});

test('10. prefers-reduced-motion で calc_input.js のアニメーションが停止する', () => {
  assert(calcSrc.includes('.calc-box.calc-spin{animation:none;}'), 'Missing reduced-motion disable for calc-spin');
});

console.log('\n全 ' + passed + ' 件 ok\n');
