// _work/test_step4_fx.js — Step 4 演出強化の検証スクリプト
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

const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const statsSrc = fs.readFileSync(path.join(__dirname, '../stats.html'), 'utf8');
const knSrc = fs.readFileSync(path.join(__dirname, '../knowledge.html'), 'utf8');

console.log('── Step 4: ハブの全弁開放スチーム (案4) ──');
test('1. _stampGoalSeal に左右両舷からの全弁開放スチームがある', () => {
  assert(indexSrc.includes('MecFX.steam(c.x - c.r * .8'), 'Missing left steam valve in index.html');
  assert(indexSrc.includes('MecFX.steam(c.x + c.r * .8'), 'Missing right steam valve in index.html');
});

console.log('── Step 4: 統計ページのトゥールビヨン時計 & 生体スキャナー (案9) ──');
test('2. stats.html にトゥールビヨン呼吸アニメーションがある', () => {
  assert(statsSrc.includes('tourbillonBreathe'), 'Missing tourbillonBreathe in stats.html');
  assert(statsSrc.includes('.hero-ring'), 'Missing .hero-ring style in stats.html');
});

test('3. stats.html に弱点カルテの生体スキャナー走査線がある', () => {
  assert(statsSrc.includes('scannerSweep'), 'Missing scannerSweep in stats.html');
  assert(statsSrc.includes('.hm-scroll::after'), 'Missing .hm-scroll::after in stats.html');
});

console.log('── Step 4: 知識ノートのカードキャビネット & 活版印刷 (案10) ──');
test('4. knowledge.html にカード引き出しホバーと活版印刷シャドウがある', () => {
  assert(knSrc.includes('.kn-card:hover{translate:0 -2px'), 'Missing hover translate in knowledge.html');
  assert(knSrc.includes('box-shadow:inset 0 1px 3px rgba(0,0,0,.2)'), 'Missing inset letterpress shadow in knowledge.html');
});

test('5. prefers-reduced-motion でアニメーションが停止する', () => {
  assert(statsSrc.includes('.hero-ring{animation:none;}'), 'Missing reduced-motion in stats.html');
  assert(knSrc.includes('.kn-card:hover{translate:none;}'), 'Missing reduced-motion in knowledge.html');
});

console.log('\n全 ' + passed + ' 件 ok\n');
