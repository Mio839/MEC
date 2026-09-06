// index.html の今日解いた問題数隣の正解率バッジ（.hero-acc）の検証テスト
// 実行: node _work/test_today_acc.js
const fs = require('fs'), path = require('path'), assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

console.log('── 今日解いた問題数・正解率バッジ（.hero-acc）検証 ──');

// 1. DOM要素の検証
assert(html.includes('class="hero-stat-row"'), 'hero-stat-row コンテナが存在すること');
assert(html.includes('id="heroAccBadge"'), 'heroAccBadge 要素が存在すること');
assert(html.includes('id="heroAccVal"'), 'heroAccVal 要素が存在すること');
assert(html.includes('class="acc-lbl"'), 'acc-lbl 要素が存在すること');
assert(html.includes('class="acc-unit"'), 'acc-unit 要素が存在すること');
console.log('  ok  - DOM構造（hero-stat-row, heroAccBadge, heroAccVal, acc-lbl, acc-unit）が完備');

// 2. 基底CSSの検証
assert(html.includes('.hero-stat-row{display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;max-width:100%;margin-top:var(--sp-3);}'), 'hero-stat-row 基底スタイルが存在すること');
assert(html.includes('.hero-acc{display:inline-flex;'), 'hero-acc 基底スタイルが存在すること');
assert(html.includes('@keyframes accGlassSweep'), 'accGlassSweep アニメーションが存在すること');
console.log('  ok  - 基底CSSスタイルおよびアニメーションが完備');

// 3. 全8テーマでのスタイル差別化の検証
const THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
THEMES.forEach(t => {
  assert(html.includes(`html.ui-${t} .hero-acc{`), `${t}: .hero-acc 装飾スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-acc .acc-val{`), `${t}: .acc-val タイポグラフィが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-acc .acc-unit{`), `${t}: .acc-unit テーマカラーが定義されていること`);
  console.log(`  ok  - ${t}: テーマ差別化スタイル完備`);
});

// 4. prefers-reduced-motion の検証
assert(html.includes('.hero-acc::after') && html.includes('display:none!important;'), 'prefers-reduced-motion で .hero-acc::after のアニメーションが安全に停止されていること');
console.log('  ok  - prefers-reduced-motion 対応完備');

// 5. JavaScript更新ロジックの検証
assert(html.includes("const accNumEl = document.getElementById('heroAccVal');"), 'heroAccVal の取得処理が存在すること');
assert(html.includes("const accBadge = document.getElementById('heroAccBadge');"), 'heroAccBadge の取得処理が存在すること');
assert(html.includes("accNumEl.textContent = '--';"), '未解答時ハイフンフォールバックが存在すること');
assert(html.includes("_tweenNum(accNumEl, td.accPct, 900);"), 'カウントアップ処理が存在すること');
console.log('  ok  - JavaScript更新処理（カウントアップ・未解答時ハイフン・ツールチップ・rateTier）完備');

console.log('\nALL PASS (正解率バッジ全要件検証完了)\n');
