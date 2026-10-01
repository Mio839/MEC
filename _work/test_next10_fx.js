// _work/test_next10_fx.js — 次の演出改善10案の検証スクリプト
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

const cssSrc = fs.readFileSync(path.join(__dirname, '../study.css'), 'utf8');
const examSrc = fs.readFileSync(path.join(__dirname, '../study_exam.js'), 'utf8');
const progSrc = fs.readFileSync(path.join(__dirname, '../progress.js'), 'utf8');
const indexSrc = require('./lib_hub_source')();
const knSrc = fs.readFileSync(path.join(__dirname, '../knowledge.html'), 'utf8');
const mmCss = fs.readFileSync(path.join(__dirname, '../mindmap.css'), 'utf8');
const statsSrc = fs.readFileSync(path.join(__dirname, '../stats.html'), 'utf8');

console.log('── 1. 章完走メダル封印 (案1) ──');
// ⚠️ 2026-09-28: .sgh.ch-sealed と chSealIn を削除した。ch-sealed を付けるコードがどこにも無く
//    一度も表示されない CSS だったため（test_dead_fx.js が参照されない @keyframes を見張る）。

console.log('── 2. コンボメーターのオーバーヒート & 蒸気 (案3) ──');
// 2026-09-28 に撤去した（ユーザー判断）。戻っていないことを見る
test('コンボメーターのオーバーヒートと蒸気は撤去したまま', () => {
  assert(!cssSrc.includes('#examComboMeter'), 'コンボメーターの CSS が戻っている');
  assert(!examSrc.includes("classList.toggle('tier-overheat'"), 'tier-overheat の切り替えが戻っている');
});

console.log('── 3. 赤旗ピン打刻 & 警戒光彩 (案4) ──');
test('progress.js と study.css に flag-pinned が連携されている', () => {
  assert(progSrc.includes('card.classList.add(\'flag-pinned\')'), 'Missing flag-pinned in progress.js');
  assert(cssSrc.includes('.qc.flag-pinned'), 'Missing .qc.flag-pinned in study.css');
});

// ⚠️ 連続日数の熾火（🔥・⚡の粒子）は 2026-10-01 に撤去した（ユーザー判断）。戻っていないことだけを見る。
console.log('── 4. ストリーク蒼炎・プラズマ炉心 (案5)：撤去済み ──');
test('index.html に熾火の粒子が戻っていない', () => {
  assert(!indexSrc.includes('isPlasma ?'), 'streak ember particles are back in index.html');
});

console.log('── 5. 再履修シリンダーのスタンバイ呼吸 (案6) ──');
test('index.html に .cylinder-loaded と呼吸アニメーションがある', () => {
  assert(indexSrc.includes('p3.classList.toggle(\'cylinder-loaded\', on)'), 'Missing cylinder-loaded toggle in index.html');
  assert(indexSrc.includes('@keyframes cylinderBreathe'), 'Missing cylinderBreathe in index.html');
});

console.log('── 6. キーワードタイプライター走光 (案7) ──');
// ⚠️ 2026-09-28: .kw.type-glow と kwTypeGlow を削除した。type-glow を付けるコードがどこにも無く
//    一度も表示されない CSS だったため。

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
  assert(knSrc.includes('.kn-danger::after{animation:none;}'), 'Missing reduced-motion in knowledge.html');
  // stats.html は動くものが1つも無いので対象外（上の注記を参照）
});

// ⚠️ 失敗があるときは件数を先に出す（以前は合格数だけを「全 N 件 ok」と出していて、
//    失敗しても最後の行が ok に見えた。合否は終了コードで判定すること）
console.log('\n' + (failed ? 'FAILED ' + failed + ' 件（全 ' + (passed + failed) + ' 件中 ' + passed + ' 件 ok）' : '全 ' + passed + ' 件 ok') + '\n');
