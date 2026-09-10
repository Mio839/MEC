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
    grab('subjIdOfUid') + '\n' + grab('natRateOf') + '\n' + grab('kAdd') + '\n' + grab('kNew') + '\n' +
    grab('buildKarte') + '\n return buildKarte(qmeta);');
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

// ── 全国比（同じ問題どうしの比較）と弱点TOP ──────────────────────────
function constNum(name) {
  const m = html.match(new RegExp('const ' + name + '\\s*=\\s*(\\d+)'));
  assert.ok(m, 'const not found: ' + name);
  return Number(m[1]);
}
const QTYPES_SRC = (html.match(/const QTYPES = (\[[\s\S]*?\]);/) || [])[1];
function makeGapKit() {
  return new Function('HM_MIN_N', 'QTYPES',
    'const KARTE_TOP_MIN_N = ' + constNum('KARTE_TOP_MIN_N') + ', KARTE_TOP_GAP = ' + constNum('KARTE_TOP_GAP') +
    ', KARTE_TOP_LIMIT = ' + constNum('KARTE_TOP_LIMIT') + ';\n' +
    grab('karteGap') + '\n' + grab('karteWeakTop') + '\n' + grab('karteLv') + '\nreturn { karteGap, karteWeakTop, karteLv };'
  )(HM_MIN_N, new Function('return ' + QTYPES_SRC)());
}

console.log('\n全国比');

test('gap compares against the national rate of the SAME questions (not the subject average)', () => {
  // 全国95%の易問を10回中5回・全国30%の難問を10回中5回＝どちらも自分50%。
  // 科目平均で比べると差は同じに見えるが、同じ問題どうしなら易問だけが −45pt になる
  const [easy, hard] = byType.dx;
  const k = makeKarte({ [easy]: { correct: 5, total: 10 }, [hard]: { correct: 5, total: 10 } }, { [easy]: 95, [hard]: 30 });
  const { karteGap } = makeGapKit();
  const g = karteGap(k.cells.circ.dx);
  assert.strictEqual(g.n, 20);
  assert.ok(Math.abs(g.nat - 62.5) < 1e-9, 'national average must be weighted over my attempts: ' + g.nat);
  assert.ok(Math.abs(g.gap + 12.5) < 1e-9, 'gap: ' + g.gap);
  assert.ok(Math.abs(g.lost - 2.5) < 1e-9, 'lost = expected correct − actual correct: ' + g.lost);
  const eb = k.bands.find(b => b.k === 'e'), xb = k.bands.find(b => b.k === 'x');
  assert.strictEqual(Math.round(karteGap(eb).gap), -45);
  assert.strictEqual(Math.round(karteGap(xb).gap), 20);
});

test('national rate falls back to qmeta.r when RATE lacks the question (minor subjects)', () => {
  const uid = Object.keys(qmeta).find(u => u.startsWith('ortho_') && typeof qmeta[u].r === 'number' && qmeta[u].r >= 0);
  assert.ok(uid, 'no ortho question with qmeta.r');
  const k = makeKarte({ [uid]: { correct: 0, total: 4 } }, {});
  assert.strictEqual(k.all.nt, 4, 'qmeta.r was not used');
  assert.strictEqual(Math.round(k.all.ne / 4 * 100), qmeta[uid].r);
  // RATE がある問題は RATE を優先する（既存の帯のテストと同じ前提）
  const k2 = makeKarte({ [uid]: { correct: 0, total: 4 } }, { [uid]: 10 });
  assert.strictEqual(Math.round(k2.all.ne / 4 * 100), 10);
});

test('questions without any national rate count in the raw % but not in the gap', () => {
  const uid = Object.keys(qmeta).find(u => u.startsWith('m121s_'));
  assert.ok(uid, 'no m121s question');
  const k = makeKarte({ [uid]: { correct: 1, total: 5 } }, {});
  assert.strictEqual(k.all.total, 5);
  assert.strictEqual(k.all.nt, 0);
  assert.strictEqual(makeGapKit().karteGap(k.all), null);
});

test('weak TOP ranks by questions lost, skips small cells and cells within the noise band', () => {
  const minN = constNum('KARTE_TOP_MIN_N');
  const myrate = {}, RATE = {};
  // 治療: 全国80%の問題を 30回中10回（−47pt・失点14）
  byType.tx.slice(0, 10).forEach(u => { myrate[u] = { correct: 1, total: 3 }; RATE[u] = 80; });
  // 検査: 全国80%の問題を 10回中3回（−50pt・失点5）→ 率は悪いが失点は少ない
  byType.ix.slice(0, 10).forEach((u, i) => { myrate[u] = { correct: i < 3 ? 1 : 0, total: 1 }; RATE[u] = 80; });
  // 診断: 回数が足りない（下限未満）
  byType.dx.slice(0, minN - 1).forEach(u => { myrate[u] = { correct: 0, total: 1 }; RATE[u] = 90; });
  // 知識: 全国並み（±5pt以内）
  (byType.know || []).slice(0, 10).forEach(u => { myrate[u] = { correct: 8, total: 10 }; RATE[u] = 82; });
  const k = makeKarte(myrate, RATE);
  const top = makeGapKit().karteWeakTop(k);
  assert.deepStrictEqual(top.map(t => t.type), ['tx', 'ix'], 'order must follow questions lost: ' + JSON.stringify(top.map(t => [t.type, t.lost])));
  assert.ok(top.every(t => t.gap <= -constNum('KARTE_TOP_GAP')));
});

test('karteLv: warm shades only below national, blue only above, nothing within ±5pt', () => {
  const { karteLv } = makeGapKit();
  assert.strictEqual(karteLv(-35), 'k-d4');
  assert.strictEqual(karteLv(-6), 'k-d1');
  assert.strictEqual(karteLv(-4), '');
  assert.strictEqual(karteLv(4), '');
  assert.strictEqual(karteLv(7), 'k-u1');
  assert.strictEqual(karteLv(20), 'k-u2');
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
  const fn = new Function('myrate', 'chMap', 'QTYPES', 'HM_MIN_N', '_karteDoc',
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
