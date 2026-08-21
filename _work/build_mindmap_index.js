#!/usr/bin/env node
// mindmap_data/index.js を gamify.js の SUBJECTS から生成する（段A・2026-08-21）。
//
// ⚠️ 科目の name / icon / color をここで新しく決めないこと。
//    gamify.js の SUBJECTS が全21科目を持つアプリ全体の正本で、レベル・実績・科目制覇が
//    同じ表を見ている。マインドマップだけ別の色を持つと、同じ科目が画面によって違う色になる。
//    （旧 mindmap_integrated.html は独自パレット、index.html の MINDMAP_TOOL は
//      chapters_meta 由来のパレットを持っていて、色が3系統に割れていた。ここで1本にする）
//
// ready: mindmap_data/{sid}.js が存在するか＝そのマップが作られているか。
//        index.html のランチャーはこれを見て「準備中」を薄く出す。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'mindmap_data', 'index.js');

// gamify.js から SUBJECTS の配列リテラルだけを切り出して評価する
const gsrc = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');
function sliceArrayLiteral(src, declRe) {
  const m = declRe.exec(src);
  if (!m) return null;
  let i = src.indexOf('[', m.index + m[0].length - 1);
  const start = i;
  let depth = 0, quote = null, comment = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (comment === 'line') { if (c === '\n') comment = null; continue; }
    if (comment === 'block') { if (c === '*' && n === '/') { comment = null; i++; } continue; }
    if (quote) { if (c === String.fromCharCode(92)) { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '/' && n === '/') { comment = 'line'; i++; continue; }
    if (c === '/' && n === '*') { comment = 'block'; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}
const lit = sliceArrayLiteral(gsrc, /const\s+SUBJECTS\s*=\s*\[/);
if (!lit) throw new Error('gamify.js の SUBJECTS を切り出せませんでした');
const SUBJECTS = vm.runInNewContext('(' + lit + ')');

// 実力試験Ⅰ・自作・暗記メモは疾患マップの対象外（章立てが疾患で構成されていない）
const SKIP = new Set(['jitsu1', 'custom', 'memo']);

const rows = SUBJECTS.filter(s => !SKIP.has(s.id)).map(s => ({
  sid: s.id,
  label: s.name,
  icon: s.icon,
  color: s.color,
  ready: fs.existsSync(path.join(ROOT, 'mindmap_data', s.id + '.js')),
}));

const L = [];
L.push('// 自動生成: node _work/build_mindmap_index.js — 手で編集しない');
L.push('// name / icon / color の正本は gamify.js の SUBJECTS（アプリ全体で同じ表を見る）。');
L.push('// ready:false = まだ mindmap_data/{sid}.js が無い科目。ランチャーは薄く出す。');
L.push('window.MM_SUBJECTS = [');
rows.forEach(r => {
  L.push(`  { sid: ${JSON.stringify(r.sid)}, label: ${JSON.stringify(r.label)}, icon: ${JSON.stringify(r.icon)}, color: ${JSON.stringify(r.color)}, ready: ${r.ready} },`);
});
L.push('];');
fs.writeFileSync(OUT, L.join('\n') + '\n', 'utf8');

const ready = rows.filter(r => r.ready).length;
console.log(`mindmap_data/index.js を書き出しました: 全${rows.length}科目（作成済み${ready} / 未作成${rows.length - ready}）`);
rows.filter(r => !r.ready).forEach(r => console.log(`  未作成: ${r.sid.padEnd(8)} ${r.label}`));
