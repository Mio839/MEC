/**
 * ハブ画面（Heroゲージ以外の全要素：アクションボタン群・臨床スキルレーダー＆探知ソナー・
 * 直近14日推移・タイル群・今日のミッション・アンビエント光彩・セクション見出し）
 * 全8テーマ完全差別化＆演出大幅強化 検証テスト
 * Run: node _work/test_hub_fx.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

console.log('── ハブ画面（Heroゲージ以外）演出強化＆全8テーマ完全差別化 検証 ──');

const THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];

// 1. 各テーマの必須セレクタが index.html 内に存在すること
THEMES.forEach(t => {
  // アクションボタン群
  assert(html.includes(`html.ui-${t} .cta-main`), `${t}: .cta-main スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .cta-sub`), `${t}: .cta-sub スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .cta-redo`), `${t}: .cta-redo スタイルが定義されていること`);

  // 臨床スキルプロファイル ＆ 弱点探知ソナー
  assert(html.includes(`html.ui-${t} .skill-radar-box`), `${t}: .skill-radar-box スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .radar-grid`), `${t}: .radar-grid スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .radar-val`), `${t}: .radar-val スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .radar-sonar-sweep`), `${t}: .radar-sonar-sweep スタイルが定義されていること`);

  // 直近14日推移
  assert(html.includes(`html.ui-${t} .bar.on`), `${t}: .bar.on スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .spark-target-line`), `${t}: .spark-target-line スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .spark-target-lbl`), `${t}: .spark-target-lbl スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .streak-seg.active`), `${t}: .streak-seg.active スタイルが定義されていること`);

  // タイル群
  assert(html.includes(`html.ui-${t} .tiles .tile`), `${t}: .tiles .tile スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .tiles .tile.t-lead`), `${t}: .tiles .tile.t-lead スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .tile-bar span`), `${t}: .tile-bar span スタイルが定義されていること`);

  // 今日のミッション
  assert(html.includes(`html.ui-${t} #gmDaily .gm-mission`), `${t}: #gmDaily .gm-mission スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} #gmDaily .gm-mission.done`), `${t}: #gmDaily .gm-mission.done スタイルが定義されていること`);

  // アンビエント空間光彩
  assert(html.includes(`html.ui-${t} .ambient-nebula`), `${t}: .ambient-nebula スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .ambient-grid`), `${t}: .ambient-grid スタイルが定義されていること`);

  // セクション見出し
  assert(html.includes(`html.ui-${t} .sec-h::before`), `${t}: .sec-h::before スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .sec-h .ln`), `${t}: .sec-h .ln スタイルが定義されていること`);

  // 今日解いた問題の特大数字＆演出（可読性保証＆全8テーマ差別化）
  assert(html.includes(`html.ui-${t} .hero-fig`), `${t}: .hero-fig 装飾プレートスタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-num`), `${t}: .hero-num 高可読性タイポグラフィが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-unit`), `${t}: .hero-unit テーマカラー連携が定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-num[data-goal="1"]`), `${t}: .hero-num[data-goal="1"] テーマ別オーラが定義されていること`);
  assert(html.includes(`html.ui-${t} .hero-num[data-goal="2"]`), `${t}: .hero-num[data-goal="2"] テーマ別オーバードライブが定義されていること`);

  // カウントアップ着地時演出の設定
  assert(html.includes(`${t}: {`), `${t}: THEME_LANDING_CONFIG に着地演出設定が存在すること`);

  console.log(`  ok  - ${t}: 全要素のテーマ差別化スタイル（数字・プレート・目標オーラ含む）が完備`);
});

// 2. ボタン演出の不変条件
assert(html.includes('.cta-main,.cta-sub{min-width:min-content;}'), 'min-width:min-content の不変条件');
assert(html.includes('.cta-sub{position:relative;overflow:hidden;}'), 'position:relative;overflow:hidden の不変条件');

// 3. prefers-reduced-motion ガード（ネストを考慮して抽出）
function getReducedMotionCss(src) {
  let combined = '';
  const re = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/gi;
  let match;
  while ((match = re.exec(src)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    let start = i;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    combined += src.slice(start, i - 1) + '\n';
  }
  return combined;
}
const prmBlocks = getReducedMotionCss(html);
assert(prmBlocks.includes('.radar-sonar-sweep'), 'reduced-motion で .radar-sonar-sweep が停止・非表示');
assert(prmBlocks.includes('.sonar-dot'), 'reduced-motion で .sonar-dot が停止');
assert(prmBlocks.includes('.tiles .tile:nth-child(odd)'), 'reduced-motion でタイルの浮遊が停止');
assert(prmBlocks.includes('.sec-h::before'), 'reduced-motion で見出しビームが停止');
assert(prmBlocks.includes('.sec-h .ln::after'), 'reduced-motion で見出し走査線が非表示');
THEMES.forEach(t => {
  assert(prmBlocks.includes(`html.ui-${t} .hero-num[data-goal="1"]`), `reduced-motion で ${t} の data-goal="1" が停止`);
  assert(prmBlocks.includes(`html.ui-${t} .hero-num[data-goal="2"]`), `reduced-motion で ${t} の data-goal="2" が停止`);
});
console.log('  ok  - prefers-reduced-motion で全8テーマの数字目標パルス含む新規演出が安全に停止・抑制');

// 4. Service Worker SHELL_VERSION の整合性
const shellVerMatch = swJs.match(/const SHELL_VERSION = "([^"]+)";/);
assert.ok(shellVerMatch[1] >= '2026-09-06g', 'SHELL_VERSION が 2026-09-06g 以上に更新されていること');
console.log(`  ok  - sw.js: SHELL_VERSION = ${shellVerMatch[1]}`);

console.log('\nALL PASS (全8テーマ各25項目 + 不変条件 + reduced-motion + SW整合性)\n');
