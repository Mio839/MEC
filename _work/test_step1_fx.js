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
// 2026-09-24: 正解の演出は _rfCorrectFx に一本化し、UIテーマ固有の意匠は _spawnStreakParticles が
//   「正解の肢の位置で」出す（_spawnScatteredCelebration は旧演出ごと削除した）。
test('3. UIテーマ8種の固有演出が正解の肢の位置から出る', () => {
  const a = examSrc.indexOf('function _spawnStreakParticles('), b = examSrc.indexOf('\n}\n', a);
  const body = examSrc.slice(a, b);
  ['kintsugiCrack', 'celestialAstrolabe', 'abyssSonarPulse', 'frostCrystalShatter', 'auroraPrismSweep',
   'brassClockworkBurst', 'cyberTargetLock', 'liquidBloomRipple'].forEach(k =>
    assert(body.includes(k), 'Missing ' + k + ' in _spawnStreakParticles'));
  assert(/const pos = at \|\| /.test(body), '発火位置 at を受け取っていない');
  assert(/_spawnStreakParticles\(Math\.max\(1, tier\), p\)/.test(examSrc), '_rfCorrectFx が肢の位置を渡していない');
});

test('4. 克服時に金床火花 (burst) が発火する', () => {
  assert(examSrc.includes('prior && prior.wasWrong'), 'Missing prior.wasWrong check');
  assert(examSrc.includes('shapes: [\'shard\', \'square\']'), 'Missing spark burst in prior.wasWrong');
});

test('5. 超速答時に神速ライトニングバースト (godSpeedBurst) が発火する', () => {
  assert(examSrc.includes('godSpeedBurst'), 'Missing godSpeedBurst in examSrc');
  assert(examSrc.includes('_fastGrade'), 'Missing _fastGrade check');
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
