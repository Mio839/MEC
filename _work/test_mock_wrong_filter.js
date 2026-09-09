/**
 * ❌ 模試誤答フィルタ（study.html?sid=m121s&filter=mock_wrong）の検査。
 *
 * 見るのは3つ。
 *   §1 対象の数え方が study.html と mock.html で一致すること
 *       （weight>0 かつ「1問も入力していないブロックは丸ごと除く」）
 *   §2 採点uid → 解説uid の対応が questions_m121s.json に実在すること
 *   §3 study.html 側の配線が落ちていないこと（正誤を保存していない・遅延読み込み・
 *       模試以外へ切り替えたら全問へ戻す）
 *
 * 実ソースを読み込む（ロジックを二重に持たない）。mock.js は window を要求するので
 * 最小のシムを立てて評価する。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ok  - ' + name); }
  else { fail++; console.log('  NG  - ' + name); }
}
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

// ── mock.js を localStorage シム付きで起動する ────────────────────────────────
function bootMock(stored) {
  const store = { mec_mock_v1: JSON.stringify(stored || {}) };
  // mock.js は素の localStorage を参照する（window.localStorage ではない）ので両方に置く
  const ls = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const win = { localStorage: ls };
  const ctx = { window: win, localStorage: ls, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('mock_data/index.js'), ctx);
  vm.runInContext(read('mock_data/m121s.js'), ctx);
  vm.runInContext(read('mock.js'), ctx);
  return { M: win.MecMock, index: win.MecMockIndex, data: win.MecMockData };
}

// study.html / mock.html それぞれの数え方を、実ソースから切り出して同じ入力で回す。
function fnBodyOf(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('関数が見つからない: ' + name);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) { j = k; break; } }
  }
  return src.slice(i, j + 1);
}

console.log('§1 対象の数え方が study.html と mock.html で一致する');

const studySrc = read('study.html');
const mockSrc = read('mock.html');

// 全ブロック入力済み・一部を誤答にした状態を作る
function answersFor(data, wrongKeys) {
  const ans = {};
  data.questions.forEach(q => {
    const key = q.block + q.no;
    const correct = q.type === 'calc' ? q.ans[0] : q.ans.join('');
    ans[key] = { p: wrongKeys.has(key) ? pickWrong(q) : correct, t: 1 };
  });
  return ans;
}
function pickWrong(q) {
  // 正解と違う肢を1つ返す（計算問題は違う桁文字列）
  if (q.type === 'calc') return String(q.ans[0]) + '9';
  const set = new Set(q.ans);
  for (const c of 'abcde') if (!set.has(c)) return c;
  return '';
}

{
  const boot0 = bootMock();
  const data = boot0.data.m121s;
  const wrongKeys = new Set(['A3', 'B10', 'C49', 'F66']);
  const stored = { m121s: { cur: 'r1', rounds: { r1: { started: 1, graded: 2, ans: answersFor(data, wrongKeys) } } } };
  const { M } = bootMock(stored);

  // study.html の _computeMockWrong を実ソースから起こす
  const computeSrc = fnBodyOf(studySrc, '_computeMockWrong');
  const studyCompute = new Function('window', computeSrc + '; return _computeMockWrong;')({ MecMock: M });
  const set = studyCompute('m121s');

  // mock.html の mockWrongCount を実ソースから起こす
  const countSrc = fnBodyOf(mockSrc, 'mockWrongCount');
  const mockCount = new Function('M', 'examId', countSrc + '; return mockWrongCount;')(M, 'm121s');
  const n = mockCount(M.score('m121s'));

  ok(set.size === wrongKeys.size, '誤答4問なら study 側の集合も4件（実際 ' + set.size + '）');
  ok(n === set.size, 'mock.html の件数（' + n + '）と study.html の集合（' + set.size + '）が一致する');
}

{
  // A・B しか入力していない日：C〜F の未解答が対象に化けないこと
  const boot0 = bootMock();
  const data = boot0.data.m121s;
  const ans = {};
  data.questions.forEach(q => {
    if (q.block !== 'A' && q.block !== 'B') return;
    const key = q.block + q.no;
    const correct = q.type === 'calc' ? q.ans[0] : q.ans.join('');
    ans[key] = { p: key === 'A3' ? pickWrong(q) : correct, t: 1 };
  });
  const stored = { m121s: { cur: 'r1', rounds: { r1: { started: 1, graded: 2, ans: ans } } } };
  const { M } = bootMock(stored);

  const studyCompute = new Function('window', fnBodyOf(studySrc, '_computeMockWrong') + '; return _computeMockWrong;')({ MecMock: M });
  const set = studyCompute('m121s');
  const mockCount = new Function('M', 'examId', fnBodyOf(mockSrc, 'mockWrongCount') + '; return mockWrongCount;')(M, 'm121s');
  const n = mockCount(M.score('m121s'));

  ok(set.size === 1, '未入力ブロック（C〜F）の225問は対象に入らない（実際 ' + set.size + '件）');
  ok(n === 1, 'mock.html 側も同じく1件（実際 ' + n + '件）');
  ok([...set][0].startsWith('m121s_ch01_'), '残る1件は A問題＝ch01 の uid（' + [...set][0] + '）');
}

console.log('§2 採点uid → 解説uid が questions_m121s.json に実在する');

{
  const { M, data } = bootMock();
  const qs = JSON.parse(read('questions_m121s.json'));
  const uids = new Set();
  (function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (typeof o.uid === 'string') uids.add(o.uid);
      Object.values(o).forEach(walk);
    }
  })(qs);

  let bad = 0, n = 0;
  data.m121s.questions.forEach(q => {
    const u = M.studyUid('m121s', q.block, q.no);
    n++;
    if (!uids.has(u)) { if (bad < 3) console.log('     欠落: ' + q.block + q.no + ' -> ' + u); bad++; }
  });
  ok(n === 400, '採点側の設問は400問（実際 ' + n + '）');
  ok(bad === 0, '400問すべての解説uidが questions_m121s.json に在る（欠落 ' + bad + '）');
}

console.log('§3 study.html / mock.html の配線');

{
  ok(/VALID_FILTERS\s*=\s*new Set\(\[[^\]]*'mock_wrong'/.test(studySrc),
    'VALID_FILTERS に mock_wrong が入っている（?filter=mock_wrong が捨てられない）');
  ok(studySrc.includes('id="fMockWrong"') && studySrc.includes("data-filter=\"mock_wrong\""),
    '❌模試誤答のチップが filter 行にある');
  ok(/function _syncMockFilterChip\(\)[\s\S]*?setFilter\('all'\)/.test(studySrc),
    '模試以外の科目へ切り替えたら全問へ戻す（1問も出ない画面を作らない）');

  // ⚠️ 正誤を保存していないこと（CLAUDE.md「模試の自己採点」の不変条件）
  const compute = fnBodyOf(studySrc, '_computeMockWrong');
  ok(/MecMock\.weights\(/.test(compute), '対象は MecMock.weights() から毎回計算する');
  ok(!/setItem\(/.test(compute) && !/localStorage/.test(compute),
    '誤答uidの一覧を localStorage へ書き出していない（2つ目の正本を作らない）');
  ok(/MecMock\.studyUid\(/.test(compute),
    'uid の対応は MecMock.studyUid() に任せている（規則を書き写していない）');
  ok(/score\(sid\)\.live|score\(\s*sid\s*\)\.live/.test(compute),
    '入力済みブロックの判定に score().live を使っている');

  // ⚠️ 採点エンジンと解答表は遅延読み込み（121KB を全ページに載せない）
  ok(!/<script[^>]+src="mock\.js"/.test(studySrc),
    'mock.js を <script> で常時読み込んでいない（遅延読み込みのまま）');
  ok(!/<script[^>]+src="mock_data\/m121s\.js"/.test(studySrc),
    '解答表を <script> で常時読み込んでいない');
  ok(/<script[^>]+src="mock_data\/index\.js"/.test(studySrc),
    'レジストリ（737B）だけは常時読み込む＝「模試かどうか」を同期で判定できる');
  ok(/_loadScriptOnce\('mock\.js'\)/.test(studySrc) && /_loadScriptOnce\(e\.file\)/.test(studySrc),
    'mock.js と解答表はフィルタを使うときだけ読む');

  // 絞った状態から試験を始めれば誤答だけのセッションになる（表示中のカードだけを拾う実装に依存）
  const exam = read('study_exam.js');
  ok(/function _examCandidateCards[\s\S]{0,300}style\.display === 'none'/.test(exam),
    '_examCandidateCards() が表示中のカードだけを拾う（フィルタがそのまま出題範囲になる）');

  ok(mockSrc.includes('filter=mock_wrong') && mockSrc.includes('間違えた'),
    'mock.html の結果画面に演習ボタンがある');
  ok(/sid=' \+\s*encodeURIComponent\(examId\)/.test(mockSrc),
    '演習ボタンの sid は examId から作る（模試を足しても直さなくてよい）');
}

console.log('');
console.log(fail ? '  ' + fail + ' 件 NG（' + pass + ' 件 ok）' : '全 ' + pass + ' 件 ok');
process.exit(fail ? 1 : 0);
