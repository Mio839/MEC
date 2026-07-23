/**
 * stats.html の弱点カルテ集計（buildKarte / subjIdOfUid）を実ソースから切り出して検証する。
 * ロジックをコピペせず stats.html の該当関数をそのまま eval するので、実装と乖離しない。
 * Run: node _work/test_karte.js
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'stats.html'), 'utf8');

function grab(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start > 0, 'not found: ' + name);
  let i = html.indexOf('{', start), depth = 0;
  for (let j = i; j < html.length; j++) {
    if (html[j] === '{') depth++;
    else if (html[j] === '}') { depth--; if (!depth) return html.slice(start, j + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

const qmeta = JSON.parse(fs.readFileSync(path.join(ROOT, 'qmeta.json'), 'utf8')).q;
const chaptersSrc = fs.readFileSync(path.join(ROOT, 'chapters_meta.js'), 'utf8');
const sandboxChapters = (new Function(chaptersSrc + '; return typeof MEC_CHAPTERS!=="undefined"?MEC_CHAPTERS:(window&&window.MEC_CHAPTERS);'))
  .call({ window: {} });

// HM_MIN_N など定数も実ソースから拾う
const HM_MIN_N = Number((html.match(/const HM_MIN_N = (\d+)/) || [])[1]);
assert.ok(HM_MIN_N >= 1, 'HM_MIN_N not found');

function makeKarte(myrate, RATE) {
  const fn = new Function('myrate', 'RATE', 'MEC_CHAPTERS', 'qmeta',
    grab('subjIdOfUid') + '\n' + grab('buildKarte') + '\n return buildKarte(qmeta);');
  return fn(myrate, RATE, sandboxChapters, qmeta);
}

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + e.message); } }

// 実データの uid を型ごとに拾ってシナリオを組む
const byType = {};
for (const [uid, m] of Object.entries(qmeta)) {
  if (!uid.startsWith('circ_')) continue;
  (byType[m.ty] = byType[m.ty] || []).push(uid);
}

test('qmeta covers every subject prefix used by chapters_meta', () => {
  const prefixes = new Set(Object.keys(qmeta).map(u => u.slice(0, u.indexOf('_ch'))));
  for (const s of sandboxChapters) {
    assert.ok(prefixes.has(s.id), 'missing qmeta for subject ' + s.id);
  }
});

test('treatment-only weakness shows up as a low tx cell, not a low subject average', () => {
  const myrate = {};
  byType.tx.slice(0, 10).forEach(u => { myrate[u] = { correct: 1, total: 10 }; });   // 治療 10%
  byType.dx.slice(0, 10).forEach(u => { myrate[u] = { correct: 9, total: 10 }; });   // 診断 90%
  const k = makeKarte(myrate, {});
  const tx = k.cells.circ.tx, dx = k.cells.circ.dx;
  assert.strictEqual(Math.round(tx.correct / tx.total * 100), 10);
  assert.strictEqual(Math.round(dx.correct / dx.total * 100), 90);
  const row = k.rowTot.circ;
  assert.strictEqual(Math.round(row.correct / row.total * 100), 50, 'subject average hides it');
});

test('ungraded questions (no correct choice) are excluded from every total', () => {
  const ung = Object.keys(qmeta).find(u => (qmeta[u].f || []).includes('ungraded'));
  assert.ok(ung, 'no ungraded question in qmeta to test with');
  const k = makeKarte({ [ung]: { correct: 0, total: 5 } }, {});
  assert.strictEqual(k.all.total, 0);
  assert.strictEqual(k.rows.length, 0);
});

test('rows only include subjects that actually have data', () => {
  const u = byType.dx[0];
  const k = makeKarte({ [u]: { correct: 1, total: 2 } }, {});
  assert.deepStrictEqual(k.rows.map(r => r.id), ['circ']);
});

test('national-rate bands split by the RATE index', () => {
  const [a, b, c] = byType.ix;
  const k = makeKarte(
    { [a]: { correct: 1, total: 10 }, [b]: { correct: 5, total: 10 }, [c]: { correct: 9, total: 10 } },
    { [a]: 95, [b]: 70, [c]: 30 }
  );
  const g = key => k.bands.find(x => x.k === key);
  assert.strictEqual(g('e').correct / g('e').total, 0.1, '本番易問なのに落としている');
  assert.strictEqual(g('m').correct / g('m').total, 0.5);
  assert.strictEqual(g('x').correct / g('x').total, 0.9);
});

test('flag aggregation counts a question under each of its flags', () => {
  const multi = Object.keys(qmeta).find(u => u.startsWith('circ_') && (qmeta[u].f || []).includes('multi'));
  const k = makeKarte({ [multi]: { correct: 2, total: 8 } }, {});
  assert.strictEqual(k.flagAgg.multi.total, 8);
  assert.strictEqual(k.flagAgg.multi.correct, 2);
});

test('questions with no myrate entry contribute nothing', () => {
  const k = makeKarte({}, {});
  assert.strictEqual(k.all.total, 0);
  assert.deepStrictEqual(k.rows, []);
});

// ── 一問一答プロンプト生成 ──────────────────────────────────────────
function makeDrill(myrate) {
  const karte = makeKarte(myrate, {});
  const chMap = {};
  sandboxChapters.forEach(s => s.chapters.forEach((c, i) => {
    chMap[c.prefix] = { subjName: s.name, subjId: s.id, chNum: i + 1, chTitle: c.title };
  }));
  const QTYPES = JSON.parse(
    (html.match(/const QTYPES = (\[[\s\S]*?\]);/) || [])[1]
      .replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/,(\s*[\]}])/g, '$1')
  );
  const fn = new Function('myrate', 'chMap', 'QTYPES', 'HM_MIN_N', '_karte',
    grab('cleanChTitle') + '\n' + grab('weakChapters') + '\n' + grab('weakCells') + '\n' + grab('buildDrillPrompt') +
    '\n return { p: buildDrillPrompt(), cells: weakCells(6), chs: weakChapters(5,65,8) };');
  return fn(myrate, chMap, QTYPES, HM_MIN_N, karte);
}

console.log('\n一問一答プロンプト');

test('drill: weak subject/type pairs land in the 出題範囲', () => {
  const myrate = {};
  byType.tx.slice(0, 8).forEach(u => { myrate[u] = { correct: 1, total: 10 }; });
  byType.dx.slice(0, 8).forEach(u => { myrate[u] = { correct: 9, total: 10 }; });
  const { p, cells } = makeDrill(myrate);
  assert.ok(cells.some(c => c.type === '治療' && c.pct === 10), '弱い治療セルが拾えていない');
  assert.ok(!cells.some(c => c.type === '診断'), '90%の診断を弱点に入れてはいけない');
  assert.ok(p.includes('循環器の「治療」'), '出題範囲に反映されていない: ' + p.slice(0, 300));
});

test('drill: the fixed rules survive intact (answer must stay hidden)', () => {
  const { p } = makeDrill({});
  assert.ok(p.includes('私が答えを書くまで、正解・解説・次の問題を絶対に書かない'), '最優先ルールが欠落');
  assert.ok(p.includes('1回の発言につき1問だけ'));
  assert.ok(p.includes('症例文は付けない'));
  assert.ok(p.includes('準備ができたら第1問だけを出してください'));
});

test('drill: falls back to random scope when there is no data', () => {
  const { p, cells, chs } = makeDrill({});
  assert.strictEqual(cells.length, 0);
  assert.strictEqual(chs.length, 0);
  assert.ok(p.includes('全科目からランダムに出題してください'));
});

test('drill: strong areas (>=70%) are not listed as weak', () => {
  const myrate = {};
  byType.ix.slice(0, 8).forEach(u => { myrate[u] = { correct: 8, total: 10 } });
  const { cells } = makeDrill(myrate);
  assert.strictEqual(cells.length, 0, '80%を弱点に入れてはいけない');
});

test('drill: weak chapters are named with subject and chapter title', () => {
  const myrate = {};
  byType.ix.slice(0, 6).forEach(u => { myrate[u] = { correct: 1, total: 5 }; });
  const { p, chs } = makeDrill(myrate);
  assert.ok(chs.length >= 1, '弱い章が拾えていない');
  assert.ok(p.includes(chs[0].info.subjName + ' 第' + chs[0].info.chNum + '章'), '章名が出ていない');
});

test('drill: chapter titles drop the duplicated subject name and chapter number', () => {
  const clean = new Function(grab('cleanChTitle') + '\n return cleanChTitle;')();
  assert.strictEqual(clean('MEC循環器 第2章 心不全 解答解説', '循環器'), '心不全');
  assert.strictEqual(clean('第1章 産婦人科総論', '産婦人科'), '産婦人科総論');
  assert.strictEqual(clean('MEC呼吸器 第1章 解答解説', '呼吸器'), '');
  assert.strictEqual(clean('', '神経'), '');
});

test('drill: no chapter line repeats 第N章 twice', () => {
  const myrate = {};
  Object.keys(qmeta).filter(u => u.startsWith('obg_') || u.startsWith('circ_')).slice(0, 40)
    .forEach(u => { myrate[u] = { correct: 1, total: 5 }; });
  const { p } = makeDrill(myrate);
  p.split('\n').filter(l => l.startsWith('- ') && l.includes('章')).forEach(l => {
    assert.strictEqual((l.match(/第\s*[0-9０-９]+\s*章/g) || []).length, 1, '章番号が重複: ' + l);
    assert.ok(!l.includes('解答解説'), '「解答解説」が残っている: ' + l);
    assert.ok(!l.includes('MEC'), '「MEC」接頭辞が残っている: ' + l);
  });
});

console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + fails.length) + ')');
if (fails.length) process.exit(1);
