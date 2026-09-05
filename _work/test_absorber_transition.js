/**
 * 学習成果の帰還注入トランジション（Exam-to-Hub Absorber）の検証テスト
 * Run: node _work/test_absorber_transition.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const STUDY_EXAM = fs.readFileSync(path.join(__dirname, '..', 'study_exam.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

console.log('── Exam-to-Hub Absorber トランジション検証 ──');

t('index.html に _runExamToHubAbsorber および _testAbsorber 関数が存在する', () => {
  assert.ok(HTML.includes('function _runExamToHubAbsorber('), '_runExamToHubAbsorber が見つからない');
  assert.ok(HTML.includes('window._testAbsorber ='), 'window._testAbsorber が見つからない');
});

t('全8テーマのオーブスタイル（orb-*）がCSSに定義されている', () => {
  const themes = ['brass', 'cyber', 'aurora', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('.absorber-orb.orb-' + th), 'orb-' + th + ' のCSSクラスが無い');
  });
});

t('ワインドアップ（winding-up）と着弾バウンド（absorb-impact）のCSSが存在する', () => {
  assert.ok(HTML.includes('.gauge.winding-up'), '.gauge.winding-up が無い');
  assert.ok(HTML.includes('.gauge.absorb-impact'), '.gauge.absorb-impact が無い');
  assert.ok(HTML.includes('@keyframes absorbImpact'), '@keyframes absorbImpact が無い');
});

t('renderHero 内で mec_absorb_payload_v1 を取得・消費・分岐するコードが存在する', () => {
  assert.ok(HTML.includes("sessionStorage.getItem('mec_absorb_payload_v1')"), 'sessionStorage取得コードが無い');
  assert.ok(HTML.includes("sessionStorage.removeItem('mec_absorb_payload_v1')"), 'sessionStorage削除コードが無い');
  assert.ok(HTML.includes('_runExamToHubAbsorber(goal.pct, absorbPayload)'), '吸入トランジション呼び出しが無い');
});

t('study_exam.js に学習成果ペイロードを sessionStorage に記録する処理が存在する', () => {
  assert.ok(STUDY_EXAM.includes("sessionStorage.setItem('mec_absorb_payload_v1'"), 'study_exam.js にペイロード記録処理が無い');
});

t('prefers-reduced-motion でオーブおよびワインドアップが安全に停止・非表示化されている', () => {
  assert.ok(HTML.includes('.absorber-orb'), 'reduced-motion に .absorber-orb が含まれていない');
  assert.ok(HTML.includes('.gauge.winding-up'), 'reduced-motion に .gauge.winding-up が含まれていない');
});

console.log(`\nALL PASS (${pass}/${pass + fail})\n`);
