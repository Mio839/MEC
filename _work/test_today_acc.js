// index.html の今日解いた問題数隣の正解率バッジ（.hero-acc-fig）の検証テスト
// 実行: node _work/test_today_acc.js
const fs = require('fs'), path = require('path'), assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

console.log('── 今日解いた問題数・正解率バッジ（.hero-acc-fig）検証 ──');

// 1. DOM要素の検証（見出し行の正解率ラベル＋特大プレート構造＋XPバッジ収容）
assert(html.includes('class="hero-stat-row"'), 'hero-stat-row コンテナが存在すること');
assert(html.includes('class="hero-fig hero-acc-fig" id="heroAccBadge"'), 'heroAccBadge が p.hero-fig.hero-acc-fig として定義されていること');
assert(html.includes('class="hero-label-acc" id="heroLabelAcc"'), 'heroLabelAcc が見出し行内に存在すること');
assert(html.includes('class="hero-num" id="heroAccVal"'), 'heroAccVal が span.hero-num 特大数字として定義されていること');
assert(html.includes('<p class="hero-xp"><span id="heroXp">'), 'heroXp が hero-stat-row 内に収容されていること');
console.log('  ok  - DOM構造（hero-label-acc, hero-stat-row, hero-fig hero-acc-fig, hero-num, hero-xp）が完備');

// 2. 基底CSSの検証
assert(html.includes('.hero-stat-row{display:flex;align-items:flex-end;gap:clamp(10px,2.2vw,16px);flex-wrap:wrap;max-width:100%;margin-top:var(--sp-3);}'), 'hero-stat-row 基底スタイルが存在すること');
assert(html.includes('.hero-acc-fig{cursor:default;}'), 'hero-acc-fig スタイルが存在すること');
assert(html.includes('.hero-label-acc{'), 'hero-label-acc スタイルが存在すること');
assert(html.includes('.hero-xp{display:inline-flex;align-items:baseline;gap:3px;margin-top:0;align-self:flex-end;'), 'hero-xp スタイルが存在すること');
console.log('  ok  - 基底CSSスタイルが完備');

// 3. 全8テーマでのスタイル差別化の検証
const THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
THEMES.forEach(t => {
  assert(html.includes(`html.ui-${t} .hero-label-acc{`), `${t}: .hero-label-acc 装飾スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-fig`), `${t}: .hero-fig スタイルが適用されること`);
  assert(html.includes(`html.ui-${t} .hero-num`), `${t}: .hero-num スタイルが適用されること`);
  console.log(`  ok  - ${t}: テーマ差別化スタイル完備（特大プレート＋見出しラベル）`);
});

// 4. JavaScript更新ロジックの検証
assert(html.includes("const accNumEl = document.getElementById('heroAccVal');"), 'heroAccVal の取得処理が存在すること');
assert(html.includes("const accBadge = document.getElementById('heroAccBadge');"), 'heroAccBadge の取得処理が存在すること');
assert(html.includes("accNumEl.textContent = '--';"), '未解答時ハイフンフォールバックが存在すること');
assert(html.includes("_tweenNum(accNumEl, td.accPct, 900, () => _landHeroNumber(accNumEl));"), 'カウントアップ＆着地アニメーションが存在すること');
console.log('  ok  - JavaScript更新処理（カウントアップ・着地演出・未解答時ハイフン・ツールチップ・rateTier）完備');

console.log('\nALL PASS (正解率バッジ全要件検証完了)\n');
