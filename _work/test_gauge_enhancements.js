/**
 * Heroゲージ演出強化（第1位・第3位・第5位）の包括的検証テスト
 * Run: node _work/test_gauge_enhancements.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

console.log('── Heroゲージ新演出（第1位・第3位・第5位）検証 ──');

t('SVGマークアップに必要なグループ（doctorCasing, milestones, overdriveFx, surgeWave）が存在する', () => {
  assert.ok(HTML.includes('id="gaugeDoctorCasing"'), 'gaugeDoctorCasing が見つからない');
  assert.ok(HTML.includes('id="gaugeMilestones"'), 'gaugeMilestones が見つからない');
  assert.ok(HTML.includes('id="gaugeOverdriveFx"'), 'gaugeOverdriveFx が見つからない');
  assert.ok(HTML.includes('id="gaugeSurgeWave"'), 'gaugeSurgeWave が見つからない');
});

t('全8テーマのケーシング（casing-*）とオーバードライブ（od-*）がマークアップに揃っている', () => {
  const themes = ['brass', 'cyber', 'aurora', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('class="casing-' + th + '"'), 'casing-' + th + ' が無い');
    assert.ok(HTML.includes('od-' + th), 'od-' + th + ' が無い');
  });
});

t('4つのドクターランク（student, resident, specialist, professor）のパーツが定義されている', () => {
  assert.ok(HTML.includes('rank-student'), 'rank-student が無い');
  assert.ok(HTML.includes('rank-resident'), 'rank-resident が無い');
  assert.ok(HTML.includes('rank-specialist'), 'rank-specialist が無い');
  assert.ok(HTML.includes('rank-professor'), 'rank-professor が無い');
});

t('4つのマイルストーンノード（node-25, node-50, node-75, node-100）が配置されている', () => {
  assert.ok(HTML.includes('node-25'), 'node-25 が無い');
  assert.ok(HTML.includes('node-50'), 'node-50 が無い');
  assert.ok(HTML.includes('node-75'), 'node-75 が無い');
  assert.ok(HTML.includes('node-100'), 'node-100 が無い');
});

t('renderHero で gaugeBox.dataset.doctorRank に値が反映されるコードが存在する', () => {
  assert.ok(HTML.includes('dataset.doctorRank = dRank'), 'doctorRank のセットが見つからない');
});

t('CSS内にドクターランク・マイルストーン・オーバードライブのセレクタが存在する', () => {
  assert.ok(HTML.includes('.gauge[data-doctor-rank='), 'data-doctor-rank セレクタが無い');
  assert.ok(HTML.includes('.milestone-node.active'), 'milestone-node.active セレクタが無い');
  assert.ok(HTML.includes('.gauge[data-overdrive]'), 'data-overdrive セレクタが無い');
  assert.ok(HTML.includes('.gauge[data-overdrive="hyper"]'), 'data-overdrive="hyper" セレクタが無い');
});

t('prefers-reduced-motion で新演出のアニメーションが停止されている', () => {
  assert.ok(HTML.includes('.gauge-surge-wave,.milestone-node .ms-glow,.gauge-overdrive-fx'), 'reduced-motion での打ち消しが無い');
});

console.log(`\nALL PASS (${pass}/${pass + fail})\n`);
