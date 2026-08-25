/**
 * stats.html の再構成（演出強化 Phase 3）を実ソースから検証する。
 *   ・弱点リスト（統合）の判定とタグ付け・並び（weakUnified / wkPicks）
 *   ・章別ヒートマップ 2段の集計（hmStat / hmCls）
 *   ・「減らす」側の不変条件（廃止したセクションが戻っていないこと）
 *   ・rAF が止まった時の落とし所（countUp / 達成リング）
 * ロジックはコピペせず stats.html の該当関数をそのまま eval するので実装と乖離しない。
 * Run: node _work/test_stats_sections.js
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'stats.html'), 'utf8');

// test_karte.js と同じ切り出し方（名前付き関数を波かっこの対応で取る）
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
function constNum(name) {
  const m = html.match(new RegExp('const ' + name + '\\s*=\\s*(\\d+)'));
  assert.ok(m, 'const not found: ' + name);
  return Number(m[1]);
}

let passed = 0; const fails = [];
function test(n, f) { try { f(); passed++; console.log('  ok  - ' + n); } catch (e) { fails.push(n); console.log('FAIL  - ' + n + '\n        ' + e.message); } }

// ══════════ 弱点リスト（統合）══════════

const WK_GAP_PT = constNum('WK_GAP_PT');
const WK_LIMIT  = constNum('WK_LIMIT');

// weakUnified は myrate / RATE / uidInfo / WK_TAGS に依存する。uidInfo は章メタを
// 引くだけなので、ここでは素通しのスタブを渡して判定とタグ付けだけを見る
function makeWeak(myrate, RATE) {
  const wkTags = html.match(/const WK_TAGS = \{[\s\S]*?\n  \};/);
  assert.ok(wkTags, 'WK_TAGS not found');
  const fn = new Function('myrate', 'RATE', 'uidInfo',
    wkTags[0] + '\nconst WK_GAP_PT = ' + WK_GAP_PT + ';\n' +
    grab('weakUnified') + '\nreturn weakUnified();');
  return fn(myrate, RATE, uid => ({ qNum: uid.split('_q')[1], prefix: uid.split('_q')[0], info: null }));
}

test('本番80%以上を50%未満で落とすと 💡取りこぼし が付く', () => {
  const r = makeWeak({ circ_ch01_q1: { correct: 1, total: 4 } }, { circ_ch01_q1: 92 });
  assert.strictEqual(r.length, 1);
  assert.ok(r[0].tags.includes('miss'), 'miss tag missing: ' + r[0].tags);
});

test('同じ問題で本番を WK_GAP_PT 以上下回ると 🔻本番差 が付く（分母は揃っている）', () => {
  const r = makeWeak({ a_ch01_q1: { correct: 3, total: 10 } }, { a_ch01_q1: 30 + WK_GAP_PT });
  assert.ok(r[0].tags.includes('gap'), 'gap tag missing');
  assert.strictEqual(r[0].gap, WK_GAP_PT);
  // 境界の1pt手前では付かない
  const r2 = makeWeak({ a_ch01_q1: { correct: 3, total: 10 } }, { a_ch01_q1: 30 + WK_GAP_PT - 1 });
  assert.ok(!r2.length || !r2[0].tags.includes('gap'), 'gap tag should not fire below threshold');
});

test('3回以上受けて50%未満なら 🔁反復ミス が付く（2回では付かない）', () => {
  const r3 = makeWeak({ a_ch01_q1: { correct: 1, total: 3 } }, {});
  assert.ok(r3.length === 1 && r3[0].tags.includes('rep'), '3回で rep が付かない');
  const r2 = makeWeak({ a_ch01_q1: { correct: 0, total: 2 } }, {});
  assert.strictEqual(r2.length, 0, '2回だけの誤答は弱点に挙げない');
});

test('本番正答率が無い問題でも反復ミスなら挙がり、gap は null になる', () => {
  const r = makeWeak({ a_ch01_q1: { correct: 0, total: 5 } }, {});
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].gap, null);
  assert.deepStrictEqual(r[0].tags, ['rep']);
});

test('弱点でない問題（よく解けている）は挙がらない', () => {
  const r = makeWeak({ a_ch01_q1: { correct: 9, total: 10 } }, { a_ch01_q1: 95 });
  assert.strictEqual(r.length, 0);
});

test('受験0回のエントリは無視する（0除算しない）', () => {
  const r = makeWeak({ a_ch01_q1: { correct: 0, total: 0 } }, { a_ch01_q1: 90 });
  assert.strictEqual(r.length, 0);
});

test('並びはタグ数 → 本番との差 の順。差の無い問題は差を持つ問題の後ろ', () => {
  const r = makeWeak({
    onlyRep:   { correct: 0, total: 5 },            // タグ1・差なし
    bigGap:    { correct: 1, total: 10 },           // タグ2（gap+rep）
    threeTags: { correct: 1, total: 10 },           // タグ3（miss+gap+rep）
  }, { bigGap: 60, threeTags: 95 });
  assert.deepStrictEqual(r.map(x => x.uid), ['threeTags', 'bigGap', 'onlyRep']);
  assert.strictEqual(r[0].tags.length, 3);
});

test('同じ問題が複数の理由で挙がっても行は1つ（4本のリストを畳んだのが主旨）', () => {
  const r = makeWeak({ a_ch01_q1: { correct: 1, total: 10 } }, { a_ch01_q1: 95 });
  assert.strictEqual(r.length, 1, '重複して載ってはいけない');
  assert.deepStrictEqual(r[0].tags.slice().sort(), ['gap', 'miss', 'rep']);
});

test('wkPicks は _last を除き、多い順に並べる', () => {
  const fn = new Function('choiceData', grab('wkPicks') + '\nreturn wkPicks;');
  const picks = fn({ u1: { 'ａ': 1, 'ｃ': 3, 'ｅ': 0, _last: 'ｃ' } })('u1');
  assert.deepStrictEqual(picks, [{ c: 'ｃ', n: 3 }, { c: 'ａ', n: 1 }]);
  assert.deepStrictEqual(fn({})('none'), []);
});

// ══════════ 章別ヒートマップ 2段 ══════════

function makeHm(myrateByCh, doneByCh) {
  const fn = new Function('_mrByCh', '_doneByCh',
    grab('hmStat') + '\n' + grab('hmCls') + '\nreturn { hmStat, hmCls };');
  return fn(myrateByCh, doneByCh);
}

test('hmStat: 正答率モードは章をまたいで合算する（科目タイル＝章の集合）', () => {
  const { hmStat } = makeHm({ s_ch01: { correct: 8, total: 10 }, s_ch02: { correct: 2, total: 10 } }, {});
  const chs = [{ prefix: 's_ch01', count: 10 }, { prefix: 's_ch02', count: 10 }];
  assert.strictEqual(hmStat(chs, 'acc').txt, '50%');
  assert.strictEqual(hmStat([chs[0]], 'acc').txt, '80%');
});

test('hmStat: 未受験は段0＝ランプの外（「弱い」と誤読させない）', () => {
  const { hmStat, hmCls } = makeHm({}, {});
  const st = hmStat([{ prefix: 'x_ch01', count: 5 }], 'acc');
  assert.strictEqual(st.s, 0);
  assert.strictEqual(st.has, false);
  assert.strictEqual(st.txt, '未受験');
  assert.strictEqual(hmCls('acc', 0), 'n0');
});

test('hmStat: 進捗モードは done の件数 / 問題数', () => {
  const { hmStat } = makeHm({}, { s_ch01: 5 });
  const st = hmStat([{ prefix: 's_ch01', count: 10 }], 'prog');
  assert.strictEqual(st.txt, '50%');
  assert.strictEqual(st.sub, '5/10');
  assert.strictEqual(st.s, 3);
});

test('hmCls: 正答率は a*、進捗は p*（2つの配色言語を混ぜない）', () => {
  const { hmCls } = makeHm({}, {});
  assert.strictEqual(hmCls('acc', 3), 'a3');
  assert.strictEqual(hmCls('prog', 3), 'p3');
});

test('hmStat は章prefixの索引を引くだけ（章ごとに myrate 全件を走査しない）', () => {
  const src = grab('hmStat');
  assert.ok(!/Object\.(entries|keys)\s*\(\s*myrate/.test(src),
    'hmStat の中で myrate を全件走査している（180章 × 全解答の二乗になる）');
  assert.ok(/_mrByCh/.test(src) && /_doneByCh/.test(src), '事前に作った索引を使っていない');
});

// ══════════ 章名の整形（2段目で章名を出すようになったので効く）══════════

test('cleanChTitle: 講座名の残り（内分泌→「代謝」）が章名に混ざらない', () => {
  const fn = new Function(grab('cleanChTitle') + '\nreturn cleanChTitle;')();
  assert.strictEqual(fn('MEC内分泌代謝 第1章 内分泌代謝の基本 解答解説', '内分泌'), '内分泌代謝の基本');
  assert.strictEqual(fn('第2章 放射線診断学', '放射線科'), '放射線診断学');
  assert.strictEqual(fn('第1章 序　章', '放射線科'), '序　章');
  // 「第N章」が無い形は旧来の削り方に落ちる
  assert.strictEqual(fn('MEC血液 総論 解答解説', '血液'), '総論');
  // 章名が無い title で「解答解説」が章名として残らないこと（test_karte.js と同じ境界）
  assert.strictEqual(fn('MEC呼吸器 第1章 解答解説', '呼吸器'), '');
  assert.strictEqual(fn('', '血液'), '');
});

test('chapters_meta の全章で、章名に「第N章」も「解答解説」も残らない', () => {
  const fn = new Function(grab('cleanChTitle') + '\nreturn cleanChTitle;')();
  const src = fs.readFileSync(path.join(ROOT, 'chapters_meta.js'), 'utf8');
  const CH = new Function(src + ';return MEC_CHAPTERS;')();
  CH.forEach(s => s.chapters.forEach(c => {
    const t = fn(c.title, s.name);
    // 現物162章はすべて章名を持つ（空になるのは章名の無い title だけ）
    assert.ok(t, '章名が空になった: ' + c.title);
    assert.ok(!/^第\s*[0-9０-９]+\s*章/.test(t), '章番号が残っている: ' + t);
    assert.ok(!/解答\s*解説/.test(t), '「解答解説」が残っている: ' + t);
  }));
});

// ══════════ 「減らす」側の不変条件 ══════════

test('📐本番との差（科目単位）は廃止されたまま', () => {
  // 引き算の左右で分母が違い（左＝自分が解いた問題／右＝科目の全問）原理的に読めない値だった。
  // 作り直すなら「同じ uid どうし」＝弱点リストの 🔻本番差 タグの形にすること。
  assert.ok(!/function renderGap/.test(html), 'renderGap が戻っている');
  assert.ok(!/id="gapSec"/.test(html), 'gapSec が戻っている');
  // ⚠️ 「本番との差」の文字列自体は、廃止の理由を書いたコメントとして各所に残してある
  //    （作り直さないための根拠）。見出しとして復活していないことだけを見る
  const titles = html.match(/<h2 class="sec-title">[\s\S]*?<\/h2>/g) || [];
  assert.ok(titles.length, 'セクション見出しが1つも取れていない');
  titles.forEach(t => assert.ok(!t.includes('本番との差'), '見出しに「本番との差」が戻っている: ' + t));
});

test('弱点のリストは1本だけ（旧4本が復活していない）', () => {
  const body = html.slice(html.indexOf('<main class="ct">'), html.indexOf('</main>'));
  // ⚠️ 統合リストのセクションキーが data-sec-id="weakList" なので、素の substring だと
  //    それ自身に当たる。id 属性の頭（空白か引用符の直後）を見て区別する。
  ['missSec', 'weakList', 'choiceSec', 'gapSec'].forEach(id => {
    assert.ok(!new RegExp('(^|[\s"])id="' + id + '"').test(body),
      '廃止したセクションが戻っている: ' + id);
  });
  assert.ok(body.includes('data-sec-id="weakList"') && body.includes('id="wkCards"'),
    '統合リストが無い');
});

test('時間の記録は学習カレンダー1本（30日の棒グラフ2本は畳んだまま）', () => {
  const body = html.slice(html.indexOf('<main class="ct">'), html.indexOf('</main>'));
  ['id="actBars"', 'id="timeBars"'].forEach(id => {
    assert.ok(!body.includes(id), '30日の棒グラフが戻っている: ' + id);
  });
  assert.ok(body.includes('id="calGrid"') && body.includes('id="calFigs"'), 'カレンダーと合計欄が無い');
});

test('セクションが display:none から出入りしない（日によってページの形が変わらない）', () => {
  const body = html.slice(html.indexOf('<main class="ct">'), html.indexOf('</main>'));
  assert.ok(!/<section[^>]*style="display:none"/.test(body),
    'display:none で始まるセクションがある');
  assert.ok(body.includes('id="karteEmpty"'), '弱点カルテの空の状態が無い');
});

/* 2026-08-26: 4層の縦積み（今の状態 / 積み上げ / どこが弱いか / 道具）は f9c351a で
   4つのタブに畳まれた。「1画面に全部積まない」という趣旨は同じなので、層の見出しではなく
   タブの構成を見張る。⚠️ タブを増やすときは、情報のタブと道具のタブを混ぜないこと。 */
test('4つのタブに畳まれている（サマリー / 弱点分析 / 進捗・推移 / AIツール）', () => {
  [['summary', 'サマリー'], ['weakness', '弱点分析'], ['progress', '進捗・推移'], ['ai', 'AIツール']]
    .forEach(([k, label]) => {
      assert.ok(new RegExp('data-tab="' + k + '"').test(html), 'タブが無い: ' + k);
      assert.ok(html.includes(label), 'タブ名が無い: ' + label);
      assert.ok(new RegExp('id="pane-' + k + '"').test(html), 'ペインが無い: pane-' + k);
    });
});

test('AI相談エクスポートは道具のタブに隔離されている（情報セクションより後ろ）', () => {
  const ai = html.indexOf('id="pane-ai"');
  assert.ok(ai > 0, 'pane-ai が無い');
  assert.ok(html.indexOf('id="aiExportBtn"') > ai, 'AI相談ボタンが pane-ai の外にある');
  ['data-sec-id="weakList"', 'data-sec-id="chHeatmap"', 'data-sec-id="calendar"'].forEach(k => {
    assert.ok(html.indexOf(k) > 0 && html.indexOf(k) < ai,
      'AIツールより後ろに情報セクションがある: ' + k);
  });
});

// ══════════ 動かす側の担保 ══════════

/* ⚠️ 非表示タブでは rAF が1フレームも来ない（ハブの _tweenNum・旧 countUp で実際に踏んだ）。
   f9c351a の書き直しでカウントアップと入場演出（countUp / armReveal / .rv-on）は
   丸ごと無くなったので、いまこの穴は存在しない。戻すときは落とし所を必ず添えること。 */
test('rAF に依存して数字が0のまま凍る経路が無い', () => {
  if (!/requestAnimationFrame/.test(html)) return;   // 演出そのものが無い＝穴も無い
  assert.ok(/setTimeout\(\s*\w*[Ff]inish\w*\s*,/.test(html),
    'rAF で数字を動かしているのに setTimeout の落とし所が無い');
});

/* ⚠️ CSS だけで本文を隠すと、JS が落ちた日にページが丸ごと白紙になる。
   隠すなら JS が付けるクラスの中でだけ隠すこと（旧 .rv-on .rvs の作り）。 */
test('CSS だけで本文を隠さない（JS が落ちても白紙にならない）', () => {
  assert.ok(!/^\.rvs\s*\{\s*opacity:\s*0/m.test(html), 'CSS だけで .rvs を隠している');
  assert.ok(!/^\.sec\s*\{[^}]*opacity:\s*0/m.test(html), 'セクションを既定で透明にしている');
});

test('reduced-motion で「今日」のセルの呼吸が止まる', () => {
  if (!/\.cal-cell\.is-today[^{]*\{[^}]*animation/.test(html)) return;   // 呼吸そのものが無い
  const rm = (html.match(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\n\}/g) || []).join('\n');
  assert.ok(/cal-cell\.is-today[^}]*animation:\s*none/.test(rm),
    '今日のセルが reduced-motion で止まらない');
});

test('「今日」のセルは動きが無くても outline で位置がわかる（静的な印との二重化）', () => {
  assert.ok(/\.cal-cell\.is-today\s*\{[^}]*outline:/.test(html), '今日のセルの outline が無い');
});

console.log('\n' + passed + ' passed' + (fails.length ? ', ' + fails.length + ' FAILED: ' + fails.join(', ') : ''));
process.exit(fails.length ? 1 : 0);
