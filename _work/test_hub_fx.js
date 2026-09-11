/**
 * ハブ画面（Heroゲージ以外の全要素：アクションボタン群・今日の所見フィード・
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

  // 📋 今日の所見（2026-09-12 に「臨床スキルプロファイル」レーダーを置き換えた）
  assert(html.includes(`html.ui-${t} .note-box`), `${t}: .note-box スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .note-title`), `${t}: .note-title スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .note-item`), `${t}: .note-item スタイルが定義されていること`);
  assert(html.includes(`html.ui-${t} .note-basis`), `${t}: .note-basis スタイルが定義されていること`);

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
assert(prmBlocks.includes('.note-item'), 'reduced-motion で所見の入場アニメが停止');
assert(prmBlocks.includes('.tiles .tile:nth-child(odd)'), 'reduced-motion でタイルの浮遊が停止');
assert(prmBlocks.includes('.sec-h::before'), 'reduced-motion で見出しビームが停止');
assert(prmBlocks.includes('.sec-h .ln::after'), 'reduced-motion で見出し走査線が非表示');
THEMES.forEach(t => {
  assert(prmBlocks.includes(`html.ui-${t} .hero-num[data-goal="1"]`), `reduced-motion で ${t} の data-goal="1" が停止`);
  assert(prmBlocks.includes(`html.ui-${t} .hero-num[data-goal="2"]`), `reduced-motion で ${t} の data-goal="2" が停止`);
});
console.log('  ok  - prefers-reduced-motion で全8テーマの数字目標パルス含む新規演出が安全に停止・抑制');

// 3b. 旧「臨床スキルプロファイル」レーダーの回帰ガード
// ⚠️ あれは6軸すべてが「今日の正答率 × 固定係数」で、形が原理的に変わらず科目のデータを
//    1ビットも読んでいなかった（ラベルも viewBox の外へ出て切れていた）。戻さないこと。
['skill-radar-box', 'radarValPoly', 'radar-sonar-sweep', 'sonar-dot', 'radar-lbl']
  .forEach(dead => assert(!html.includes(dead), `旧レーダーの残骸が復活していないこと: ${dead}`));
// 所見フィードの不変条件
assert(html.includes("const NOTE_KEY  = 'mec_hub_notes_v1'"), '所見の記帳キーが定義されていること');
assert(html.includes('_renderHubNotes(td, due, streak)'), 'renderHero から所見が描かれること');
assert(html.includes('id="hubNoteList"'), '所見の描画先が常設されていること');
assert(html.includes('note-empty'), '所見0件の日も枠を残す（セクションごと消さない）');
// ⚠️ ハブに重いデータを持ち込まない（全国正答率との比較は stats.html の担当）。
//    見るのは <script src> の一覧と fetch()。強制更新ボタンの再取得リストは対象外
//    （あれは「読み込む」ではなく「HTTPキャッシュを捨てる」ためのファイル名）。
const hubScripts = (html.match(/<script\s+src="[^"]+"/g) || []).join(' ');
['qmeta.json', 'rate_index.js', 'mock_data/m121s'].forEach(heavy => {
  assert(!hubScripts.includes(heavy), `ハブが ${heavy} を <script> で読み込んでいないこと`);
  assert(!html.includes(`fetch('${heavy}`) && !html.includes(`fetch("${heavy}`),
    `ハブが ${heavy} を fetch していないこと`);
});
console.log('  ok  - 旧レーダーは撤去済み・所見フィードの配線と軽さの不変条件');

// 4. Service Worker SHELL_VERSION の整合性
const shellVerMatch = swJs.match(/const SHELL_VERSION = "([^"]+)";/);
assert.ok(shellVerMatch[1] >= '2026-09-12b', 'SHELL_VERSION が 2026-09-06g 以上に更新されていること');
console.log(`  ok  - sw.js: SHELL_VERSION = ${shellVerMatch[1]}`);

console.log('\nALL PASS (全8テーマ各25項目 + 不変条件 + reduced-motion + SW整合性)\n');
