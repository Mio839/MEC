/**
 * _work/test_hub_fx.js
 * ハブ画面：Heroゲージ以外の文字・表示・計器ベイ・全8テーマ差別化の演出強化 検証テスト
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const HTML = fs.readFileSync(HTML_PATH, 'utf8');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ok  - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(err);
  }
}

console.log('── 1. ヒーロー左列（特大数字・コンソール・国試カウントダウン）演出検証 ──');

test('ヒーロー左列に .hero-console クラスがマークアップに存在する', () => {
  assert.ok(/class="hero-console"/.test(HTML), 'hero-console がマークアップに存在しない');
});

test('特大数字（.hero-num）に立体ネオンテキストシャドウが定義されている', () => {
  assert.ok(/\.hero-num\{[^}]*text-shadow:/.test(HTML), '.hero-num の立体 text-shadow が存在しない');
});

test('目標達成時（data-goal="1", "2"）のゴールドオーラとオーバードライブ覚醒が定義されている', () => {
  assert.ok(/\.hero-num\[data-goal="1"\]\{[^}]*text-shadow:/.test(HTML), 'data-goal="1" のゴールドオーラが無い');
  assert.ok(/\.hero-num\[data-goal="2"\]\{[^}]*animation:goalOverdrivePulse/.test(HTML), 'data-goal="2" のオーバードライブ覚醒が無い');
});

test('国試カウントダウン（.exam-countdown）が計器バッジ調に強化され、パルス発光が定義されている', () => {
  assert.ok(/\.exam-countdown\{[^}]*box-shadow:/.test(HTML), '.exam-countdown の計器バッジ調スタイルが無い');
  assert.ok(/\.exam-countdown::before\{[^}]*animation:countdownPulse/.test(HTML), 'countdownPulse アニメーションが無い');
  assert.ok(/\.exam-countdown \.cd-num\{[^}]*filter:drop-shadow/.test(HTML), '.cd-num の発光フィルターが無い');
});

test('生体バイタルサイン（.hero-live）に鼓動ダブルパルスが定義されている', () => {
  assert.ok(/\.hero-live\{[^}]*animation:vitalPulse/.test(HTML), 'vitalPulse アニメーションが無い');
});

console.log('── 2. 計器ベイ（HUDモジュールカード）演出検証 ──');

test('計器行（.strip, .strip-c）が独立したHUDモジュールカードとして定義されている', () => {
  assert.ok(/\.strip\{[^}]*gap:var\(--sp-2\)/.test(HTML), '.strip の gap 指定が無い');
  assert.ok(/\.strip-c\{[^}]*border-radius:var\(--r-sm\)/.test(HTML), '.strip-c のモジュールカード枠が無い');
  assert.ok(/\.strip-c:hover\{[^}]*transform:translateY/.test(HTML), '.strip-c のホバーリアクションが無い');
});

console.log('── 3. セクション見出し（.sec-h）演出検証 ──');

test('セクション見出しのインジケータ（::before）と罫線（.ln）に光彩＆シマーが定義されている', () => {
  assert.ok(/\.sec-h::before\{[^}]*animation:secBeamGlow/.test(HTML), 'secBeamGlow アニメーションが無い');
  assert.ok(/\.sec-h \.ln::after\{[^}]*animation:sheen/.test(HTML), '見出し罫線の sheen 走査線が無い');
});

console.log('── 4. 全8テーマ完全差別化（文字・表示・コンソール）検証 ──');

const THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];

THEMES.forEach(th => {
  test(`html.ui-${th} で特大数字（.hero-num）と計器セル（.strip-c）とカウントダウンの独自装飾が定義されている`, () => {
    const reNum = new RegExp(`html\\.ui-${th}\\s+\\.hero-num`);
    const reStrip = new RegExp(`html\\.ui-${th}\\s+\\.strip-c`);
    const reCountdown = new RegExp(`html\\.ui-${th}\\s+\\.exam-countdown`);
    const reConsole = new RegExp(`html\\.ui-${th}\\s+\\.hero-console`);

    assert.ok(reNum.test(HTML), `html.ui-${th} の .hero-num スタイルが無い`);
    assert.ok(reStrip.test(HTML), `html.ui-${th} の .strip-c スタイルが無い`);
    assert.ok(reCountdown.test(HTML), `html.ui-${th} の .exam-countdown スタイルが無い`);
    assert.ok(reConsole.test(HTML), `html.ui-${th} の .hero-console スタイルが無い`);
  });
});

console.log('── 5. アクセシビリティ（prefers-reduced-motion）検証 ──');

test('新規アニメーションが prefers-reduced-motion で確実に停止されている', () => {
  const rm = HTML.slice(HTML.indexOf('@media (prefers-reduced-motion:reduce)'));
  assert.ok(rm.indexOf('.hero-live') > 0, '.hero-live の停止が無い');
  assert.ok(rm.indexOf('.exam-countdown::before') > 0, '.exam-countdown::before の停止が無い');
  assert.ok(rm.indexOf('.sec-h::before') > 0, '.sec-h::before の停止が無い');
  assert.ok(rm.indexOf('.hero-num[data-goal="1"]') > 0, '目標達成パルスの停止が無い');
  assert.ok(rm.indexOf('.hero-num[data-goal="2"]') > 0, '超過達成パルスの停止が無い');
});

console.log(`\n結果: ${passedTests} / ${totalTests} 件 PASSED\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
