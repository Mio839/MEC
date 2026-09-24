/**
 * 正解・誤答の演出（2026-09-24 に置き換え）の仕上げ A・B・D・E・F・G・H を実ソースで検査する。
 * Run: node _work/test_rf_polish.js
 *
 *   A ヘッダーの進捗の数字を桁が回る表示にする（_rfDigits を共用）
 *   B 結果画面のリングを線が描き進む（毎フレーム・先端の光）
 *   D 動きの規則を3種類×3段にまとめる（vars.css が正本・JS は MO に写しを持つ）
 *   E 外した肢の × と「外しました」の帯を UIテーマ8種の意匠に合わせる
 *   F 選び直してたどり着いたときの小さな手応え（記録は触らない）
 *   G 連続数を問題文に重ねない（ヘッダーの下端に下から重ねる）
 *   H 「答えを見る」の光は肢の左端どうしを結ぶ
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const JS = rd('study_exam.js'), CSS = rd('study.css'), VARS = rd('vars.css'), HUB = rd('index.html'), STUDY = rd('study.html');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}
function fnBody(name) {
  const i = JS.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let d = 0, j = JS.indexOf('{', i);
  for (let k = j; k < JS.length; k++) {
    if (JS[k] === '{') d++;
    else if (JS[k] === '}' && --d === 0) return JS.slice(j, k + 1);
  }
  return null;
}
const nc = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// 正解・誤答の演出の節（MO の定義から末尾まで）
const RF = JS.slice(JS.indexOf('const MO = {'));
const RF_CSS = CSS.slice(CSS.indexOf('正解・誤答の演出（2026-09-24 に旧演出から置き換え）'));

console.log('── 演出の仕上げ（A・B・D・E・F・G・H）──');

t('D1. MO の値が vars.css のトークンと一致する', () => {
  const tok = n => (VARS.match(new RegExp('--' + n + '\\s*:\\s*([^;]+);')) || [])[1];
  const mo = {};
  RF.slice(0, RF.indexOf('};')).replace(/(\w+):\s*'([^']+)'/g, (_, k, v) => (mo[k] = v));
  RF.slice(0, RF.indexOf('};')).replace(/(d\d):\s*(\d+)/g, (_, k, v) => (mo[k] = +v));
  assert.strictEqual(mo.out, tok('ease-out').trim(), 'MO.out');
  assert.strictEqual(mo.in, tok('ease-in').trim(), 'MO.in');
  assert.strictEqual(mo.spring, tok('ease-spring').trim(), 'MO.spring');
  assert.strictEqual(mo.d1 + 'ms', tok('dur-micro').replace(/\s/g, '').split(';')[0], 'd1');
  const durs = VARS.match(/--dur-micro:(\d+)ms;\s*--dur-short:(\d+)ms;\s*--dur-long:(\d+)ms/);
  assert.ok(durs, 'vars.css に時間3段が無い');
  assert.deepStrictEqual([mo.d1, mo.d2, mo.d3], [+durs[1], +durs[2], +durs[3]]);
});

t('D2. 演出の節（JS・CSS・ハブの質感）に cubic-bezier を直に書いていない', () => {
  const js = nc(RF.slice(RF.indexOf('};'), RF.indexOf('function _rfCleanup')));
  assert.ok(!/cubic-bezier/.test(js), 'study_exam.js の演出の節に cubic-bezier が残っている');
  assert.ok(!/cubic-bezier/.test(nc(RF_CSS)), 'study.css の演出の節に cubic-bezier が残っている');
  const hub = HUB.slice(HUB.indexOf('@property --cta-spec'), HUB.indexOf('/* E5:'));
  assert.ok(hub.length > 50 && !/cubic-bezier/.test(hub), 'index.html の質感の節に cubic-bezier が残っている');
});

t('D3. 時間3段は index.html から vars.css へ移した（二重定義しない）', () => {
  assert.ok(!/--dur-micro\s*:/.test(nc(HUB)), 'index.html にまだ --dur-micro の定義がある');
});

t('D4. @view-transition は CSS に書き、JS で <style> を差し込まない', () => {
  assert.ok(![HUB, STUDY].some(x => /textContent\s*=\s*'@view-transition/.test(x)), 'JS で <style> を差し込んでいる');
  assert.ok(/@view-transition\s*\{\s*navigation:\s*auto/.test(HUB) && /@view-transition\s*\{\s*navigation:\s*auto/.test(CSS));
});

t('A1. ヘッダーの進捗は _rfDigits で描き、比較は表示文字列で行う', () => {
  const b = fnBody('_updateExamProg');
  assert.ok(/_rfDigits\(/.test(b), '_rfDigits を使っていない');
  assert.ok(/dataset\.v/.test(b) && /aria-label/.test(b), '表示文字列を dataset.v / aria-label に残していない');
  assert.ok(/examAnswered === 0/.test(b), '開始時に前のセッションの値から回ってしまう');
});

t('A2. 進捗の桁の窓は 1em（ヘッダーの行を伸ばさない）', () => {
  const r = CSS.match(/#examProgTxt \.rf-d \{([^}]*)\}/);
  assert.ok(r && /height:\s*1em/.test(r[1]) && /overflow:\s*clip/.test(r[1]));
  assert.ok(/#examProgTxt \.rf-odo \{[^}]*vertical-align/.test(CSS));
});

t('B1. 結果のリングは毎フレーム更新し、3%刻みの間引きが無い', () => {
  const b = fnBody('showExamSummary');
  assert.ok(!/_lastRingP/.test(b), '3%刻みの間引きが残っている');
  assert.ok(/exam-pct-tip/.test(b), '先端の光を作っていない');
  assert.ok(/setTimeout\(_litTubes, delay \+ dur \+ 400\)/.test(b), '描き始めの遅れを落とし所に足していない');
});

t('B2. 先端の光は箱の中で回るだけ（transform を使わない）', () => {
  const r = CSS.match(/\.exam-pct-tip\{([^}]*)\}/);
  assert.ok(r && /inset:0/.test(r[1]) && /rotate:/.test(r[1]) && !/transform/.test(r[1]));
});

t('E1. UIテーマ8種すべてに × と帯の意匠がある', () => {
  for (const id of ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost']) {
    assert.ok(new RegExp('html\\.ui-' + id + ' \\.rf-x \\{').test(CSS), id + ' の ×');
    assert.ok(new RegExp('html\\.ui-' + id + ' \\.rf-retry \\{').test(CSS), id + ' の帯');
  }
});

t('E2. テーマの意匠は肢（.ch2）に線を足さない', () => {
  const rules = RF_CSS.match(/html\.ui-\w+ [^{]*\{[^}]*\}/g) || [];
  rules.filter(r => /\.ch2/.test(r)).forEach(r => assert.ok(!/border|text-decoration|box-shadow/.test(r), r));
});

t('F1. 選び直して正解したら印と輪を出すが、採点経路は通らない', () => {
  const late = fnBody('_rfLateCorrect'), fx = fnBody('_rfReachFx');
  assert.ok(/_rfReachFx\(/.test(late), '_rfLateCorrect から呼んでいない');
  assert.ok(fx && /rf-reach/.test(fx) && /MecFX\.rings/.test(fx));
  [late, fx].forEach(b => assert.ok(!/_tallyQuestion|_recordMyRate|_updateSRS|_logAttempt|examCorrect/.test(b), '採点経路を触っている'));
  assert.ok(/\.rf-reach/.test(fnBody('_rfCleanup')), '後始末で .rf-reach を外していない');
});

t('G1. 連続数はヘッダーの下端に置き、問題文の側へはみ出さない', () => {
  const b = fnBody('_rfShowStreak'), top = fnBody('_rfStreakTop');
  assert.ok(/_rfStreakTop\(el\.offsetHeight\)/.test(b), '_rfStreakTop で置いていない');
  assert.ok(!/_fxBand\(\)\.top \+ 8/.test(b), '旧来の「帯の上端＋8px」が残っている');
  assert.ok(/_examFxHeaderBottom\(\)/.test(top));
  const sub = CSS.match(/#examRfStreak \.rf-sub \{([^}]*)\}/);
  assert.ok(sub && !/position:\s*absolute/.test(sub[1]) && !/top:\s*100%/.test(sub[1]), '添え書きが箱の下へはみ出す');
});

t('H1. 「答えを見る」の光は肢の左端どうしを結ぶ', () => {
  const b = fnBody('_rfGiveUp');
  assert.ok(/_rfEdge\(from\)/.test(b) && /_rfEdge\(to\)/.test(b));
  assert.ok(!/- 40/.test(b), '中心から40px の固定ずらしが残っている');
});

console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
