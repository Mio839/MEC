// ACHIEVEMENTS（統合セレモニー）の意匠がUIテーマ全種ぶん揃っているか。
//   node _work/test_ach_theme.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } }

const ids = JSON.parse(/var VALID_IDS = (\[[^\]]*\])/.exec(read('ui_theme.js'))[1].replace(/'/g, '"'));
const G = read('gamify.js');
const table = G.slice(G.indexOf('const ACH_THEME = {'), G.indexOf('function _achTheme('));
ok(ids.length >= 8, 'UIテーマの一覧が読める');
ids.forEach(id => {
  ok(new RegExp('\\b' + id + ':\\s*\\{[^}]*kicker:').test(table), id + ' の文言と粒子（ACH_THEME）がある');
  // aurora は既定の意匠（.gm-ach-card の素の変数）がそのまま aurora
  if (id !== 'aurora') ok(G.includes('html.ui-' + id + ' .gm-ach-card{'), id + ' のカードの意匠（CSS）がある');
});
const batch = G.slice(G.indexOf('function _playBatchCer('), G.indexOf('function _playCer('));
ok(/今回の獲得・達成/.test(batch), '見出しの下に「今回の獲得・達成（N件）」');
ok(/_achFx\(t\)/.test(batch) && !/_fxConfetti\(/.test(batch), '粒子はテーマの色で撒く（共通の紙吹雪ではない）');
const css = G.slice(G.indexOf('ACHIEVEMENTS（統合セレモニー）の意匠'), G.indexOf('/* ── セレモニー（レベルアップ'));
ok(!/animation:[^;]*infinite/.test(css), 'ACHIEVEMENTS の意匠に infinite のアニメを置かない');
ok(!/--(?!ach-)[a-z-]+:/.test(css.replace(/var\(--[a-z-]+/g, '')), 'CSS 変数は --ach- 接頭辞だけ（vars.css のトークンと衝突させない）');

console.log((fail ? '✗ ' : '✓ ') + 'test_ach_theme: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
