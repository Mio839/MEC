/**
 * 学習成果の帰還注入トランジション（Exam-to-Hub Absorber）が撤去されたままかの検査
 * 2026-10-01 に全テーマで撤去した（ユーザー判断）。作り直し案5つも全部不採用。戻さないこと。
 * Run: node _work/test_absorber_transition.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = require('./lib_hub_source')();
const STUDY_EXAM = fs.readFileSync(path.join(__dirname, '..', 'study_exam.js'), 'utf8');
const code = s => s.replace(/\/\/.*$/mg, '').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

console.log('── 帰還注入（撤去済み）──');

t('ハブに帰還注入の関数・オーブ・巻き上げの CSS が戻っていない', () => {
  const c = code(HTML);
  ['_runExamToHubAbsorber', '_testAbsorber', 'absorber-orb', 'absorb-impact', 'winding-up', 'mec_absorb_payload_v1']
    .forEach(k => assert.ok(!c.includes(k), k + ' が戻っている'));
});

t('ゲージはいつも _driveGauge(goal.pct) で描く', () => {
  assert.ok(/_driveGauge\(goal\.pct\);/.test(HTML), '_driveGauge(goal.pct) が無い');
});

t('study_exam.js が帰還注入の材料を記録しない', () => {
  assert.ok(!code(STUDY_EXAM).includes('mec_absorb_payload_v1'), 'mec_absorb_payload_v1 をまだ書いている');
});

console.log('\n' + (fail ? 'FAILED ' + fail + ' 件（全 ' + (pass + fail) + ' 件中 ' + pass + ' 件 ok）' : '全 ' + pass + ' 件 ok') + '\n');
process.exit(fail ? 1 : 0);
