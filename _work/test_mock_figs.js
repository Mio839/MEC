// 夏メック模試の設問図（夏メック模試/images/）が壊れていないかを見る。
//
// ⚠️ PDF はリポジトリに無い（.gitignore 済み）ので、**再抽出はここでは検証できない**。
//    ここが守るのは「mock_data/m121s.js が参照する図が、実体として全部ある」という
//    生成物どうしの整合だけ。抽出そのものの正しさは _work/mock_pdf.py のコメントと、
//    2026-09-08 に全138枚を目視で突き合わせた事実（引き継ぎ §6-2）が根拠。
//
// 実行: node _work/test_mock_figs.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, '夏メック模試', 'images');

global.window = {};
require(path.join(ROOT, 'mock_data', 'm121s.js'));
const D = global.window.MecMockData.m121s;

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// 連問の兄弟は「群の先頭の設問」の図を共有する（CLAUDE.md「連問の図」と同じ約束）。
// ⚠️ 兄弟ごとに同じ絵を別名で保存しないこと。差し替えたとき片方だけ古いまま残る。
const owner = {};
D.questions.forEach(q => {
  if (q.series && !owner[q.series]) owner[q.series] = q.block + q.no;
});
const tagOf = q => (q.series ? owner[q.series] : q.block + q.no);

const withFig = D.questions.filter(q => q.fig);

console.log('夏メック模試 設問図');

test('図を参照する設問は122問（引き継ぎ §3-3 の実測）', () => {
  assert.strictEqual(withFig.length, 122);
});

test('参照される画像が1枚残らず実在する', () => {
  const missing = [];
  withFig.forEach(q => {
    const tag = tagOf(q);
    q.fig.forEach((_f, i) => {
      const f = tag + '_' + (i + 1) + '.jpeg';
      if (!fs.existsSync(path.join(IMG, f))) missing.push(q.uid + ' -> ' + f);
    });
  });
  assert.deepStrictEqual(missing, [], '実体の無い参照: ' + missing.join(', '));
});

test('images/ に参照されない余りファイルが無い', () => {
  const want = new Set();
  withFig.forEach(q => {
    const tag = tagOf(q);
    q.fig.forEach((_f, i) => want.add(tag + '_' + (i + 1) + '.jpeg'));
  });
  const have = fs.readdirSync(IMG).filter(f => f.endsWith('.jpeg'));
  const extra = have.filter(f => !want.has(f));
  // ⚠️ 余りは「図を差し替えたのに古い名前が残った」合図。消すのは参照が無いと確かめてから。
  assert.deepStrictEqual(extra, [], '参照されないファイル: ' + extra.join(', '));
  assert.strictEqual(have.length, want.size);
});

test('画像は138枚（=(ブロック,別冊No)の種類と一致）', () => {
  const species = new Set();
  withFig.forEach(q => q.fig.forEach(f => species.add(q.block + '-' + f)));
  const have = fs.readdirSync(IMG).filter(f => f.endsWith('.jpeg'));
  // 枚数と種類が一致しなくなったら、枝番（「15 A、B」）かステムの図を取り落とした合図。
  assert.strictEqual(species.size, 138, '(ブロック, 別冊No) の種類');
  assert.strictEqual(have.length, 138, '画像の枚数');
});

test('連問の兄弟は同じ画像を指す（重複保存していない）', () => {
  const bySeries = {};
  withFig.filter(q => q.series).forEach(q => {
    (bySeries[q.series] = bySeries[q.series] || []).push(q);
  });
  Object.keys(bySeries).forEach(s => {
    const tags = new Set(bySeries[s].map(tagOf));
    assert.strictEqual(tags.size, 1, s + ' の兄弟が別々の画像を指している');
    const figs = new Set(bySeries[s].map(q => q.fig.join(',')));
    assert.strictEqual(figs.size, 1, s + ' の兄弟で fig が食い違う');
  });
});

test('どの画像も空でなく、極端に小さくない', () => {
  const bad = fs.readdirSync(IMG).filter(f => f.endsWith('.jpeg'))
    .filter(f => fs.statSync(path.join(IMG, f)).size < 3000);
  assert.deepStrictEqual(bad, [], '中身が無さそうな画像: ' + bad.join(', '));
});

console.log('\n' + (fail ? 'FAILED ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
