/**
 * 試験モードの「出題範囲」が examQueue だけに閉じていることを実ソースで検証する。
 * Run: node _work/test_exam_queue_scope.js
 *
 * 背景（2026-08-24）:
 *   「整形外科だけで試験を始めたのに、一度誤答すると他科目を巻き込んだ複数科目の試験が進む」
 *   という報告の修正。原因は examQueue が権威になっていなかったこと——
 *     ① 次の問題を決める   _getExamTargetCard / _scrollToNextCard
 *     ② 選択肢のクリック   startExam 内の click ハンドラ
 *     ③ 採点               revealAnswer
 *   の3つがすべて document.querySelectorAll('.qc[data-uid]') で DOM を全走査しており、
 *   キュー外のカードを締め出していたのは「開始時に1度だけ」実行される
 *   「キュー外は display:none」の1行だけだった。開始後に DOM へ足されたカード
 *   （試験中リロード→自動復元が selectedSubjects へ他科目を足して _fetchSubjectCards
 *   する経路など）はその関所を通らないため、そのまま出題・採点され、
 *   revealAnswer が examBySubj[sid] を無条件に作るので別科目がセッションに生えた。
 *
 * ⚠️ ここで守りたい設計上の決定は3つ。
 *   ① 所属判定は _examSet（examQueue の索引）だけで行う。display や DOM の並びに戻さない。
 *   ② examQueue を差し替えたら必ず _examSyncQueue() を呼ぶ。
 *   ③ 開始後に読み込まれた科目にも関所を貼り直す（study.html の _fetchSubjectCards）。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');

let pass = 0, fail = 0;
function group(n) { console.log('\n' + n); }
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// ── 実ソースから関数本体を切り出す ────────────────────────────────────────
function slice(name) {
  const m = new RegExp('^function ' + name + '\\(', 'm').exec(SRC);
  assert.ok(m, '実ソースに ' + name + ' が見つからない（名前を変えたらテストも直すこと）');
  let i = SRC.indexOf('{', m.index), depth = 0, end = -1;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') depth++;
    else if (SRC[j] === '}') { depth--; if (!depth) { end = j + 1; break; } }
  }
  assert.ok(end > 0, name + ' の本体を取り出せない');
  return SRC.slice(m.index, end);
}

// ── 偽DOM。カードは _i（DOM上の並び）を持つだけの最小の作り ────────────────
function card(i, opts) {
  opts = opts || {};
  const cls = new Set(opts.revealed ? ['exam-revealed'] : []);
  return {
    _i: i,
    dataset: { uid: (opts.sid || 'ortho') + '_ch01_q' + i },
    style: { display: opts.hidden ? 'none' : '' },
    classList: { contains: c => cls.has(c), add: c => cls.add(c), remove: c => cls.delete(c) },
    compareDocumentPosition(b) { return b._i > this._i ? 4 : 2; },   // 4 = FOLLOWING
    getBoundingClientRect() { return { top: i * 100, bottom: i * 100 + 90 }; },
  };
}

const ctx = { console, Math, Object, Array, Number, String, Boolean, Set, JSON, assert };
ctx.window = ctx;
ctx.Node = { DOCUMENT_POSITION_FOLLOWING: 4 };
ctx.document = { querySelector: () => ({ offsetHeight: 0, getBoundingClientRect: () => ({ bottom: 0 }) }) };
ctx.window.scrollY = 0;
ctx.window.scrollTo = () => {};
ctx.setTimeout = fn => fn();          // shimmer を同期で走らせて「次の1枚」を捕まえる
ctx._shimmered = null;
ctx._applyChoiceShimmer = c => { ctx._shimmered = c; };
ctx._finishCalled = 0;
ctx._showFinishAndScroll = () => { ctx._finishCalled++; };
vm.createContext(ctx);
vm.runInContext([
  'var examQueue = [];',
  'var _examSet = new Set();',
  'var _examOrder = [];',
  slice('_examSyncQueue'),
  slice('_examHas'),
  slice('_getExamTargetCard'),
  slice('_scrollToNextCard'),
  'this.API = {_examSyncQueue,_examHas,_getExamTargetCard,_scrollToNextCard,' +
  '  setQ(q){ examQueue = q; _examSyncQueue(); }, order(){ return _examOrder; }};',
].join('\n'), ctx);
const A = ctx.API;

// ══ 1. 索引そのもの ═══════════════════════════════════════════════════════
group('1. _examSyncQueue / _examHas（キューの索引）');

t('_examHas はキューの一員だけに真を返す', () => {
  const inQ = [card(1), card(2)], out = card(3, { sid: 'circ' });
  A.setQ(inQ);
  assert.ok(A._examHas(inQ[0]) && A._examHas(inQ[1]), 'キュー内が偽になっている');
  assert.ok(!A._examHas(out), 'キュー外のカードを一員と認めている');
});

t('_examHas は null / undefined を安全に false で返す', () => {
  A.setQ([card(1)]);
  assert.strictEqual(A._examHas(null), false);
  assert.strictEqual(A._examHas(undefined), false);
});

t('_examOrder は出題順ではなく DOM順（画面の上から下）に並ぶ', () => {
  const a = card(1), b = card(2), c = card(3);
  A.setQ([c, a, b]);                       // 出題順はシャッフルされうる
  assert.deepStrictEqual(A.order().map(x => x._i), [1, 2, 3], 'DOM順に並んでいない');
});

t('キューを差し替えると索引も入れ替わる（前のセッションが残らない）', () => {
  const old = card(1, { sid: 'circ' });
  A.setQ([old]);
  const fresh = [card(2), card(3)];
  A.setQ(fresh);
  assert.ok(!A._examHas(old), '前のセッションのカードが一員のまま残っている');
  assert.ok(A._examHas(fresh[0]), '新しいキューが索引に入っていない');
});

// ══ 2. 次の問題はキューからしか出ない ════════════════════════════════════
group('2. 次の問題の決定（他科目を巻き込まない）');

// 「キュー外のカードが display を失って画面に出ている」＝不具合が起きていた状態を作る。
function withIntruder() {
  const q1 = card(1), q2 = card(2);
  const intruder = card(3, { sid: 'circ' });   // 他科目・display:none が付いていない
  A.setQ([q1, q2]);
  return { q1, q2, intruder };
}

t('_getExamTargetCard はキュー外の可視カードを焦点にしない', () => {
  const { q1, q2, intruder } = withIntruder();
  q1.classList.add('exam-revealed');
  q2.classList.add('exam-revealed');
  // キュー内は全部解答済み。DOM を走査していれば intruder が返ってしまう。
  assert.strictEqual(A._getExamTargetCard(), null, 'キュー外のカードが「次の問題」に選ばれた');
  assert.ok(intruder, 'intruder は可視のまま（前提の確認）');
});

t('_getExamTargetCard は未解答のキュー内カードを DOM順で返す', () => {
  const q1 = card(1), q2 = card(2);
  A.setQ([q2, q1]);                          // 出題順は逆でも
  q1.classList.add('exam-revealed');
  assert.strictEqual(A._getExamTargetCard(), q2, 'DOM順の先頭の未解答カードを返していない');
});

t('_getExamTargetCard は display:none のキュー内カードを飛ばす', () => {
  const q1 = card(1, { hidden: true }), q2 = card(2);
  A.setQ([q1, q2]);
  assert.strictEqual(A._getExamTargetCard(), q2);
});

t('_scrollToNextCard はキュー外のカードへ送らない', () => {
  const { q1, q2, intruder } = withIntruder();
  ctx._shimmered = null; ctx._finishCalled = 0;
  q1.classList.add('exam-revealed');
  A._scrollToNextCard(q1);
  assert.strictEqual(ctx._shimmered, q2, '次の1枚がキュー内の q2 でない');
  assert.notStrictEqual(ctx._shimmered, intruder, 'キュー外のカードへ送った');
});

t('キュー内が全部解答済みなら、キュー外が可視でも結果画面へ進む', () => {
  const { q1, q2, intruder } = withIntruder();
  ctx._shimmered = null; ctx._finishCalled = 0;
  q1.classList.add('exam-revealed');
  q2.classList.add('exam-revealed');
  A._scrollToNextCard(q2);
  assert.strictEqual(ctx._finishCalled, 1, '結果画面へ進んでいない（試験が終わらない）');
  assert.strictEqual(ctx._shimmered, null, 'キュー外のカードを次の1枚にした');
  assert.ok(intruder);
});

// ══ 3. ソースの不変条件（DOM全走査へ戻さない・ガードを外さない） ═════════
group('3. 実装の不変条件');

const fnSrc = {};
['_getExamTargetCard', '_scrollToNextCard', 'revealAnswer', 'startExam',
 'resumeExam', '_removeCardFromExam', '_maybeShowFinishBtn'].forEach(n => { fnSrc[n] = slice(n); });

t('_getExamTargetCard / _scrollToNextCard は DOM を全走査しない', () => {
  ['_getExamTargetCard', '_scrollToNextCard'].forEach(n => {
    assert.ok(!/querySelectorAll\(\s*'\.qc\[data-uid\]'/.test(fnSrc[n]),
      n + ' が document.querySelectorAll(\'.qc[data-uid]\') に戻っている');
    assert.ok(fnSrc[n].includes('_examOrder'), n + ' が _examOrder を見ていない');
  });
});

t('revealAnswer は採点より前にキュー所属を確かめる', () => {
  // ⚠️ コメントを落としてから位置を比べること。解説コメントにも examBySubj[sid] と
  //    書いてあるので、素の indexOf では常に「ガードが後ろ」と判定してしまう。
  const code = fnSrc.revealAnswer.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const g = code.indexOf('_examHas(card)');
  const b = code.indexOf('examBySubj[sid]');
  assert.ok(g >= 0, 'revealAnswer に _examHas(card) のガードが無い');
  assert.ok(b >= 0, 'revealAnswer が examBySubj を触らなくなった（テストを見直すこと）');
  assert.ok(g < b, 'ガードが examBySubj[sid] の生成より後ろにある＝別科目が生える');
});

t('選択肢の click ハンドラがキュー所属を確かめる', () => {
  const m = /ch\.addEventListener\('click', function\(e\) \{[\s\S]{0,600}?\n/.exec(fnSrc.startExam);
  assert.ok(m, 'startExam に選択肢の click ハンドラが見つからない');
  const head = fnSrc.startExam.slice(m.index, m.index + 800);
  assert.ok(head.includes('_examHas('),
    'click ハンドラに _examHas のガードが無い（リスナーは dataset.examInit で一度きり付き、' +
    '以後どのセッションでも生き続けるので前のセッションのカードが遊べてしまう）');
});

t('キューを触る3か所すべてで _examSyncQueue() を呼ぶ', () => {
  ['startExam', 'resumeExam', '_removeCardFromExam'].forEach(n => {
    assert.ok(fnSrc[n].includes('_examSyncQueue()'), n + ' が _examSyncQueue() を呼んでいない');
  });
});

t('開始時の関所は _examSet を使う（_eqSet のローカル再実装を作らない）', () => {
  ['startExam', 'resumeExam'].forEach(n => {
    assert.ok(/if \(!_examSet\.has\(c\)\) c\.style\.display = 'none'/.test(fnSrc[n]),
      n + ' の関所が _examSet を見ていない');
  });
  assert.ok(!/_eqSet/.test(SRC), '_eqSet（索引の二重管理）が復活している');
});

t('_maybeShowFinishBtn は並べ替えを二重に持たない', () => {
  assert.ok(fnSrc._maybeShowFinishBtn.includes('_examOrder'),
    '_maybeShowFinishBtn が _examOrder を使っていない（DOM順の並べ替えが2箇所になる）');
});

t('study.html は開始後に読み込んだ科目にも関所を貼り直す', () => {
  const m = /function _applyJson\(data\) \{[\s\S]*?\n  \}/.exec(HTML);
  assert.ok(m, 'study.html に _applyJson が見つからない');
  assert.ok(m[0].includes('_examHas'),
    '_applyJson が examMode 中に新カードを display:none にしていない' +
    '（試験中リロードの自動復元が他科目を読み込む経路で複数科目が混入する）');
});

t('_examHas は study.html から呼べるよう window に出ている', () => {
  assert.ok(/window\._examHas\s*=\s*_examHas/.test(SRC),
    'window._examHas の公開が消えている（study.html 側のガードが黙って無効になる）');
});

console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
