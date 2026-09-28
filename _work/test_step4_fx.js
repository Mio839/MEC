// _work/test_step4_fx.js — Step 4 演出強化の検証スクリプト
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok  - ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL - ' + name + '\n    ' + e.message);
    failed++; process.exitCode = 1;
  }
}

const indexSrc = require('./lib_hub_source')();
const knSrc = fs.readFileSync(path.join(__dirname, '../knowledge.html'), 'utf8');

console.log('── Step 4: ハブの全弁開放スチーム (案4) ──');
test('1. _stampGoalSeal に左右両舷からの全弁開放スチームがある', () => {
  assert(indexSrc.includes('MecFX.steam(c.x - c.r * .8'), 'Missing left steam valve in index.html');
  assert(indexSrc.includes('MecFX.steam(c.x + c.r * .8'), 'Missing right steam valve in index.html');
});

/* ⚠️ 2026-08-26 に「2. トゥールビヨン呼吸」「3. 生体スキャナー走査線」を畳んだ。
   f9c351a（2026-08-23・stats.html の全面書き直し）で統計ページのアニメーションは
   丸ごと無くなっており（現物は @keyframes 0件）、tourbillonBreathe / .hero-ring /
   scannerSweep / .hm-scroll::after はどれも存在しない。**装飾だけで学習ツールの
   運用には関わらない**ので、機能を戻すのではなくテスト側を畳んでいる。
   統計ページに動きを足すときは、この2つを復活させるのではなく
   test_stats_sections.js（reduced-motion と outline の対を見張っている）に足すこと。 */

console.log('── Step 4: 知識ノートのカードキャビネット & 活版印刷 (案10) ──');
test('4. knowledge.html にカード引き出しホバーと活版印刷シャドウがある', () => {
  assert(knSrc.includes('.kn-card:hover{translate:0 -2px'), 'Missing hover translate in knowledge.html');
  assert(knSrc.includes('box-shadow:inset 0 1px 3px rgba(0,0,0,.2)'), 'Missing inset letterpress shadow in knowledge.html');
});

test('5. prefers-reduced-motion でアニメーションが停止する', () => {
  // stats.html は上記のとおり動くものが1つも無いので対象外（動きを足すなら同じコミットで止める指定も置く）
  assert(knSrc.includes('.kn-card:hover{translate:none;}'), 'Missing reduced-motion in knowledge.html');
});

// ⚠️ 失敗があるときは件数を先に出す（以前は合格数だけを「全 N 件 ok」と出していて、
//    失敗しても最後の行が ok に見えた。合否は終了コードで判定すること）
console.log('\n' + (failed ? 'FAILED ' + failed + ' 件（全 ' + (passed + failed) + ' 件中 ' + passed + ' 件 ok）' : '全 ' + passed + ' 件 ok') + '\n');
