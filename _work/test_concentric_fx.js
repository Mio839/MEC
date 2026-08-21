// _work/test_concentric_fx.js — 新・同心円アニメーション5案の検証スクリプト
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
const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

console.log('── 1. fx_engine.js: STATIC_TYPES への登録 ──');
test('新5エミッタが STATIC_TYPES に登録されている', () => {
  assert(fxSrc.includes('astrolabe: 1'), 'Missing astrolabe in STATIC_TYPES');
  assert(fxSrc.includes('iris: 1'), 'Missing iris in STATIC_TYPES');
  assert(fxSrc.includes('ripple_interfere: 1'), 'Missing ripple_interfere in STATIC_TYPES');
  assert(fxSrc.includes('chronos_dial: 1'), 'Missing chronos_dial in STATIC_TYPES');
  assert(fxSrc.includes('bearing_orbit: 1'), 'Missing bearing_orbit in STATIC_TYPES');
});

console.log('── 2. fx_engine.js: drawParticle のレンダリング実装 ──');
test('drawParticle に 5つの新ケースがある', () => {
  assert(fxSrc.includes('case \'astrolabe\':'), 'Missing case astrolabe');
  assert(fxSrc.includes('case \'iris\':'), 'Missing case iris');
  assert(fxSrc.includes('case \'ripple_interfere\':'), 'Missing case ripple_interfere');
  assert(fxSrc.includes('case \'chronos_dial\':'), 'Missing case chronos_dial');
  assert(fxSrc.includes('case \'bearing_orbit\':'), 'Missing case bearing_orbit');
});

console.log('── 3. fx_engine.js: window.MecFX 公開 API ──');
test('MecFX に 5つの新エミッタが公開されている', () => {
  assert(fxSrc.includes('astrolabeRings: astrolabeRings'), 'Missing astrolabeRings in MecFX');
  assert(fxSrc.includes('irisShutter: irisShutter'), 'Missing irisShutter in MecFX');
  assert(fxSrc.includes('rippleInterference: rippleInterference'), 'Missing rippleInterference in MecFX');
  assert(fxSrc.includes('chronosDial: chronosDial'), 'Missing chronosDial in MecFX');
  assert(fxSrc.includes('bearingOrbit: bearingOrbit'), 'Missing bearingOrbit in MecFX');
});

console.log('── 4. index.html: ハブの _gaugeCelebrate と _stampGoalSeal での活用 ──');
test('index.html で新同心円アニメーションが呼ばれている', () => {
  assert(indexSrc.includes('MecFX.astrolabeRings'), 'Missing astrolabeRings in index.html');
  assert(indexSrc.includes('MecFX.irisShutter'), 'Missing irisShutter in index.html');
  assert(indexSrc.includes('MecFX.rippleInterference'), 'Missing rippleInterference in index.html');
  assert(indexSrc.includes('MecFX.chronosDial'), 'Missing chronosDial in index.html');
  assert(indexSrc.includes('MecFX.bearingOrbit'), 'Missing bearingOrbit in index.html');
});

console.log('\n全 ' + passed + ' 件 ok\n');
