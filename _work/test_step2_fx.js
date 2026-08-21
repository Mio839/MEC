// _work/test_step2_fx.js — Step 2 演出強化の検証スクリプト
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

console.log('── Step 2: 解説カードのシャッター展開 & 重要ポイント走光 (案8) ──');
test('1. .ab と .eg にシャッター展開アニメーションが定義されている', () => {
  assert(cssSrc.includes('abShutterIn'), 'Missing abShutterIn keyframe in study.css');
  assert(cssSrc.includes('egShutterIn'), 'Missing egShutterIn keyframe in study.css');
});

test('2. .ept に金色の走光ハイライトアニメーションが定義されている', () => {
  assert(cssSrc.includes('eptSweepShine'), 'Missing eptSweepShine in study.css');
  assert(cssSrc.includes('.ept::after'), 'Missing .ept::after pseudo-element in study.css');
});

console.log('── Step 2: 画像シャウカステン読影灯演出 (案7) ──');
test('3. #mecImgLb にシャウカステン暗室とフィルムドロップアニメーションが定義されている', () => {
  assert(cssSrc.includes('filmDropIn'), 'Missing filmDropIn in study.css');
  assert(cssSrc.includes('radial-gradient'), 'Missing radial-gradient background for #mecImgLb');
});

console.log('── Step 2: SRS復習定着刻印 & カルテ修復 (案3) ──');
test('4. _afterCorrectFx に SRS復習モードの定着刻印 (stamp) がある', () => {
  assert(examSrc.includes('_srsReviewMode && !_fxOff() && window.MecFX && card'), 'Missing SRS check in _afterCorrectFx');
  assert(examSrc.includes('window.MecFX.stamp(cr.right - 35, cr.top + 25'), 'Missing MecFX.stamp for SRS');
});

test('5. showExamSummary に再履修全問克服時の修復演出がある', () => {
  assert(examSrc.includes('examCorrect === examAnswered && window.MecFX && !_fxOff()'), 'Missing rematch full clear check in showExamSummary');
});

test('6. prefers-reduced-motion で Step 2 のアニメーションが停止する', () => {
  assert(cssSrc.includes('.ab,.eg,.ept::after,#mecImgLb.open img{animation:none;}'), 'Missing reduced-motion disable in study.css');
});

console.log('\n全 ' + passed + ' 件 ok\n');
