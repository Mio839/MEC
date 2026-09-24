// _work/test_dynamic_fx.js — ダイナミック演出10案の検証スクリプト
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
const indexSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const mmSrc = fs.readFileSync(path.join(__dirname, '../mindmap.js'), 'utf8');

/* トップレベル `function NAME(...)` の本体を波括弧の対応で切り出す。
   ⚠️ 「ファイル全体に文字列が在るか」で判定しないための道具。在るだけでは
      **その行が実行されるとは限らない**（2026-08-31 に約300行の到達不能コードが
      見つかった原因がまさにこれ）。 */
function fnBodyOf(src, name) {
  const m = new RegExp('^function\\s+' + name + '\\s*\\(', 'm').exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index), depth = 0;
  for (let k = i; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(m.index, k + 1); }
  }
  return src.slice(m.index);
}

/* ⚠️⚠️ 2026-08-31: この2件は「ソースにこの文字列があるか」しか見ていなかった。
   実際にはオーバードライブも稲妻も大爆発バーストも、`_spawnScatteredCelebration` の
   **到達不能な尾部**（MecUITheme.get() が常に8種のどれかを返すため、手前の8分岐が必ず
   return する）に置かれていて **一度も実行されていなかった**のに、文字列はソースに
   在るのでずっと green だった。稲妻に至っては `lightning({count:3,…})` と
   `lightning(x, y, opts)` に対してオブジェクトを x へ渡しており、到達していても
   座標が NaN になる呼び方だった。
   ⚠️ **文字列の存在ではなく「生きた経路から呼ばれているか」を見ること。**
      マジックナンバー（count: 240 のような）を assert に書くと、実装を動かすたびに
      テストが嘘をつくか、意味の無い数字を守るためにコードが歪む。 */
console.log('── 1. 全画面オーバードライブ & 稲妻 (案1) ──');
test('オーバードライブは生きた経路から点り、稲妻は正しい引数で呼ばれる', () => {
  // §13-3 P4: テーマの html.ui-* body::before に z-index を奪われるので専用レイヤーへ移した。
  assert(cssSrc.includes('body.exam-overdrive #examOverdriveGlow'), 'Missing body.exam-overdrive layer in study.css');
  assert(!cssSrc.includes('body.exam-overdrive::before {'), 'グローが body::before へ戻っている（§13-3 P4）');
  // 点灯の口は _setOverdrive の1本だけ（散らすと消し忘れが必ず出る）
  assert(/function _setOverdrive\(/.test(examSrc), 'Missing _setOverdrive in study_exam.js');
  const setOd = fnBodyOf(examSrc, '_setOverdrive');
  assert(setOd.includes("classList.toggle('exam-overdrive'"), '_setOverdrive が exam-overdrive を切り替えていない');
  assert(/MecFX\.lightning\(\s*[^{)]/.test(setOd),
    '稲妻が _setOverdrive から座標付きで呼ばれていない（オブジェクトを x に渡す旧形に戻っている）');
  // _setOverdrive は正解の演出（_rfCorrectFx・2026-09-24〜）から実際に呼ばれること
  assert(fnBodyOf(examSrc, '_rfCorrectFx').includes('_setOverdrive('),
    '_rfCorrectFx から _setOverdrive が呼ばれていない＝また誰も点けない状態');
  // 解除の経路（誤答・終了）が残っていること
  assert((examSrc.match(/_setOverdrive\(false\)/g) || []).length >= 2,
    'オーバードライブの解除（誤答・exitExam）が足りない');
});

/* 2026-09-24: 案2（正解カードの3D浮遊・散らばった祝祭）・案3（誤答の赤フラッシュ＋揺れ）・
   案6（神速スラッシュのフリーズ）は、正解・誤答の演出の置き換えで廃止した。
   正解は「正解の肢から順番に」（_rfCorrectFx）、誤答は「答えを見せずに選び直し・静かに」（_rfScoreWrong）。
   ここでは廃止したものが戻っていないこと、置き換え先が生きた経路から呼ばれていることを見る。 */
console.log('── 2. 正解の演出は正解の肢から順番に（2026-09-24〜） ──');
test('正解は _rfCorrectFx に一本化され、UIテーマ固有演出を肢の位置で出す', () => {
  const rf = fnBodyOf(examSrc, '_rfCorrectFx');
  assert(rf.includes('_rfSweep(el)'), '肢の縁の光（_rfSweep）が無い');
  assert(/_spawnStreakParticles\(Math\.max\(1, tier\), p\)/.test(rf), 'テーマ固有演出を肢の位置で出していない');
  assert(fnBodyOf(examSrc, 'revealAnswer').includes('_rfCorrectFx('), 'revealAnswer から _rfCorrectFx が呼ばれていない');
  assert(fnBodyOf(examSrc, '_revealCalcAnswer').includes('_rfCorrectFx('), '_revealCalcAnswer から _rfCorrectFx が呼ばれていない');
  ['_triggerChoiceCorrectPop', '_spawnScatteredCelebration', '_showStreakEffect', '_spawnFloatingCombo', '_triggerFullscreenCombo']
    .forEach(n => assert(!new RegExp('function ' + n + '\\(').test(examSrc), n + ' が復活している'));
  assert(!cssSrc.includes('.qc.card-3d-pop'), 'card-3d-pop（カードを transform で浮かせる）が復活している');
});

console.log('── 3. 誤答は静かに（2026-09-24〜） ──');
test('誤答で赤フラッシュも揺れも出さず、body を transform しない', () => {
  assert(!/@keyframes\s+screenShakeAnim/.test(cssSrc), 'body を transform する screenShakeAnim が復活している（§13-1 ③）');
  assert(!/(?:^|[;}\s])body\.exam-screen-shake\s*\{/m.test(cssSrc), 'body.exam-screen-shake のルールが復活している（§13-1 ③）');
  assert(!/function _wrongDamageFx\(/.test(examSrc), '_wrongDamageFx（赤フラッシュ＋揺れ）が復活している');
  assert(!cssSrc.includes('body.exam-red-flash::after'), '赤フラッシュのCSSが復活している');
  const w = fnBodyOf(examSrc, '_rfScoreWrong');
  assert(w.includes("card.classList.add('exam-retry')"), '誤答が選び直し（exam-retry）へ回っていない');
  assert(!/exam-red-flash|_triggerScreenShake|_shakeFxLayers/.test(w), '誤答が赤フラッシュ／揺れを出している');
});

console.log('── 4. 神速スラッシュのフリーズは廃止 ──');
test('exam-slash-freeze が戻っていない（body の filter も無い）', () => {
  assert(!/(?:^|[;}\s])body\.exam-slash-freeze\s*\{/m.test(cssSrc), 'filter が body へ戻っている（§13-1 ②）');
  assert(!examSrc.includes("document.body.classList.add('exam-slash-freeze')"), 'exam-slash-freeze を付けている');
});

/* 数値の上限を拾う。`count: 240` も `count: pct >= 100 ? 240 : 80` も同じ 240 を返す。
   ⚠️ マジックナンバーそのものを assert に書かないための道具。演出の強さを調整しても
      「大きく出している」という性質だけが守られ、テストが嘘をつかない。 */
function maxNumAfter(body, key, re2) {
  const rx = new RegExp(key + '\\s*:\\s*([^,}\\]]+)', 'g');
  let m, best = 0;
  while ((m = rx.exec(body))) {
    if (re2 && !re2.test(m[0])) continue;
    (m[1].match(/\d+/g) || []).forEach(n => { best = Math.max(best, Number(n)); });
  }
  return best;
}

console.log('── 5. リザルト大花火 & 紙吹雪キャノン (案5) ──');
test('結果画面の祝賀が生きた経路から出て、満点で大きく出る', () => {
  // ⚠️ かつてここは includes('count: 240') だった。実装が
  //    `count: pct >= 100 ? 240 : 80` の三項に変わった時点で文字列が消え、
  //    演出は生きているのにテストだけが落ちた（2026-09-09 に構造検査へ書き換え）。
  const sum = fnBodyOf(examSrc, 'showExamSummary');
  assert(sum, 'showExamSummary が見つからない');
  // 生きた経路：試験の終了処理から必ず呼ばれる
  assert(/try\s*\{\s*showExamSummary\(\)/.test(examSrc),
    'showExamSummary が試験終了の経路から呼ばれていない');
  assert(/MecFX\.fireworks\(/.test(sum), '結果画面に花火が無い');
  assert(/MecFX\.confetti\(/.test(sum), '結果画面に紙吹雪が無い');
  // 満点（pct>=100）の枝だけ大きく出す。段の付け方が変わっても「大きい」ことは守る。
  assert(sum.includes('pct >= 100'), '満点かどうかで段を分けていない');
  assert(maxNumAfter(sum, 'count') >= 200,
    '紙吹雪の最大数が小さすぎる（実際 ' + maxNumAfter(sum, 'count') + '）');
});

console.log('── 6. ハブ目標達成の全方位スチーム大爆発 & コイン噴火 (案7) ──');
test('目標達成の刻印が生きた経路から出て、全方位に大きく撒く', () => {
  // ⚠️ ここも includes('count: 24, spread: 380') というマジックナンバーだった。
  //    値が 28 / 400 に調整された時点で落ちた（演出は生きている）。
  const seal = fnBodyOf(indexSrc, '_stampGoalSeal');
  assert(seal, '_stampGoalSeal が見つからない');
  // 生きた経路：ゲージが段5（目標100%）へ上がった一度きりで押される
  const drive = fnBodyOf(indexSrc, '_driveGauge');
  assert(drive.includes('_stampGoalSeal('), '_driveGauge から刻印が押されていない');
  assert(/tier >= 5 && wasTier < 5/.test(drive), '段5へ上がった一度きり、という条件が消えている');
  assert(/MecFX\.gears\(/.test(seal), '真鍮の歯車が撒かれていない');
  assert(/MecFX\.confetti\(/.test(seal), '金貨（紙吹雪）が撒かれていない');
  assert(/MecFX\.steam\(/.test(seal), '全方位スチームが無い');
  assert(maxNumAfter(seal, 'count') >= 100,
    '撒く量が小さすぎる（実際 ' + maxNumAfter(seal, 'count') + '）');
  assert(maxNumAfter(seal, 'rise') >= 150,
    'スチームの高さが足りない（実際 ' + maxNumAfter(seal, 'rise') + '）');
  // 四方八方＝steam を複数点から呼ぶ（1点だと「全方位」にならない）
  assert((seal.match(/MecFX\.steam\(/g) || []).length >= 3,
    'スチームの発生点が3つ未満＝全方位になっていない');
});

console.log('── 7. 難問突破クラウン & 宝石バースト (案10) ──');
test('study_exam.js と study.css に 👑 クラウンと宝石バーストがある', () => {
  assert(examSrc.includes('👑 '), 'Missing crown in study_exam.js');
  assert(examSrc.includes('count: 48'), 'Missing 48 gem burst in study_exam.js');
  assert(cssSrc.includes('@keyframes hardCrownPop'), 'Missing hardCrownPop in study.css');
});

console.log('── 8. 読影X線ビーム走査 (案8) ──');
test('study.css に .qimg.xray-scanned がある', () => {
  assert(cssSrc.includes('.qimg.xray-scanned'), 'Missing xray-scanned in study.css');
});

console.log('── 9. マインドマップ連鎖発光ビッグバン (案9) ──');
test('mindmap.js に親から子への連鎖パルスがある', () => {
  assert(mmSrc.includes('info.rings.forEach(ring => ring.forEach'), 'Missing synaptic chain in mindmap.js');
});

console.log('── 10. exitExam での完全クリーンアップ ──');
test('exitExam でオーバードライブとシェイクが解除される', () => {
  assert(examSrc.includes('exam-overdrive\', \'exam-screen-shake\', \'exam-red-flash\', \'exam-slash-freeze\''), 'Missing exitExam cleanup in study_exam.js');
});

console.log('\n全 ' + passed + ' 件 ok\n');
