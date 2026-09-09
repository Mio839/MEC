/**
 * 模試の自己採点（mock.js）と、その解答データ（mock_data/*.js）の検査。
 *
 * ロジックの二重管理をしないため、実ソースをそのまま vm で読み込んで動かす。
 * 検査は3層:
 *   §1〜§3  データの健全性（配点の検算・「Nつ選べ」と正解数の一致・禁忌肢）
 *   §4〜§7  採点エンジン（正規化・1問の採点・集計・解説の重さ）
 *   §8      Gist同期のマージ（progress.js の実ソース）
 *
 * 実行: node _work/test_mock_score.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const EXAM_ID = 'm121s';

// ── ハーネス ───────────────────────────────────────────────
function makeEnv() {
  const store = Object.create(null);
  const sandbox = {
    window: {},
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    console
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of ['mock_data/m121s.js', 'mock.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
  }
  return { M: sandbox.window.MecMock, D: sandbox.window.MecMockData[EXAM_ID], store };
}

// vm の中で作られた配列・オブジェクトは host とプロトタイプが違うので、
// assert.deepStrictEqual がそのままでは通らない。比べる前に素の値へ落とす。
const plain = (v) => JSON.parse(JSON.stringify(v));

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  - ' + name); }
  catch (e) { failures.push({ name, e }); console.log('FAIL  - ' + name + '\n        ' + (e && e.message)); }
}

const { M, D } = makeEnv();
const key = (q) => q.block + q.no;
const allCorrect = () => {
  const a = {};
  D.questions.forEach(q => { a[key(q)] = q.type === 'calc' ? q.ans[0] : q.ans.join(''); });
  return a;
};

// ─────────────────────────────────────────────────────────────
console.log('§1 データ — 構成と配点');

test('登録が index.js と一致し、6ブロック400問がそろっている', () => {
  const sb = { window: {} };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'mock_data/index.js'), 'utf8'), sb);
  const meta = sb.window.MecMockIndex.filter(x => x.id === EXAM_ID)[0];
  assert(meta, 'mock_data/index.js に ' + EXAM_ID + ' が無い');
  assert.deepStrictEqual(plain(meta.blocks), Object.keys(D.blocks));
  assert.strictEqual(D.questions.length, 400);
});

test('ブロック別の問題数（A75 B50 C75 D75 E50 F75）', () => {
  const want = { A: 75, B: 50, C: 75, D: 75, E: 50, F: 75 };
  Object.keys(want).forEach(b => {
    assert.strictEqual(D.blocks[b].count, want[b], b + ' の count');
    assert.strictEqual(D.questions.filter(q => q.block === b).length, want[b], b + ' の実数');
  });
});

test('配点合計が解説書の記載どおり（A75 B100 C75 D75 E100 F75＝500点）', () => {
  const want = { A: 75, B: 100, C: 75, D: 75, E: 100, F: 75 };
  let all = 0;
  Object.keys(want).forEach(b => {
    const sum = D.questions.filter(q => q.block === b).reduce((s, q) => s + q.pts, 0);
    assert.strictEqual(sum, want[b], b + ' の配点合計');
    assert.strictEqual(D.blocks[b].total, want[b], b + ' の total');
    all += sum;
  });
  assert.strictEqual(all, 500);
});

test('必修は B・E だけで、そこだけ臨床が3点', () => {
  Object.keys(D.blocks).forEach(b => {
    assert.strictEqual(D.blocks[b].hisshu, b === 'B' || b === 'E', b);
  });
  D.questions.forEach(q => {
    const want = q.cat === '一般' ? 1 : (q.block === 'B' || q.block === 'E' ? 3 : 1);
    assert.strictEqual(q.pts, want, q.uid + ' の配点');
  });
});

test('一般／臨床の内訳が解説書の記載どおり（A 15/60・B 25/75・C 35/40）', () => {
  const want = { A: [15, 60], B: [25, 75], C: [35, 40], D: [15, 60], E: [25, 75], F: [35, 40] };
  Object.keys(want).forEach(b => {
    assert.strictEqual(D.blocks[b].ippan, want[b][0], b + ' 一般');
    assert.strictEqual(D.blocks[b].rinsho, want[b][1], b + ' 臨床');
  });
});

// ─────────────────────────────────────────────────────────────
console.log('\n§2 データ — 正解');

test('選択式の正解は a〜e・重複なし・昇順に並べられる', () => {
  D.questions.filter(q => q.type === 'choice').forEach(q => {
    assert(q.ans.length >= 1, q.uid + ' に正解が無い');
    q.ans.forEach(c => assert('abcde'.indexOf(c) >= 0, q.uid + ' の正解 ' + c));
    assert.strictEqual(new Set(q.ans).size, q.ans.length, q.uid + ' の正解に重複');
    assert.deepStrictEqual(plain(q.ans), plain(q.ans).sort(), q.uid + ' の正解が昇順でない');
  });
});

// 正解肢が1つも無いカードは「何を選んでも黙って不正解」になる。
// study.html 側で実際に429問が壊れていた前科があるので、模試側でも必ず見張る。
test('「Nつ選べ」と正解数が全400問で一致する', () => {
  D.questions.filter(q => q.type === 'choice').forEach(q => {
    assert.strictEqual(q.pick, q.ans.length, q.uid + ' pick=' + q.pick + ' ans=' + q.ans.join(''));
  });
});

test('桁入力の計算問題は3問だけで、正解は数字だけの桁文字列', () => {
  const calc = D.questions.filter(q => q.type === 'calc');
  assert.deepStrictEqual(plain(calc.map(q => q.block + q.no)).sort(), ['A74', 'A75', 'D75']);
  calc.forEach(q => {
    assert(/^[0-9]+$/.test(q.ans[0]), q.uid + ' の計算答 ' + q.ans[0]);
    assert.strictEqual(q.ans[0].length, q.digits, q.uid + ' の桁数');
  });
});

// ⚠️ 桁文字列を数値にすると先頭ゼロが消えて別の答えになる。'104' を 104 にした瞬間、
//    '0.40' 形式の答えを持つ模試が来たときに壊れる（study.html の calc_input.js と同じ罠）。
test('計算答は文字列のまま保持されている（数値化されていない）', () => {
  D.questions.filter(q => q.type === 'calc').forEach(q => {
    assert.strictEqual(typeof q.ans[0], 'string', q.uid);
  });
});

// ─────────────────────────────────────────────────────────────
console.log('\n§3 データ — 禁忌肢・科目・出典');

test('禁忌肢問題は17問で、禁忌肢が特定されている', () => {
  const t = D.questions.filter(q => q.taboo);
  assert.strictEqual(t.length, 17);
  t.forEach(q => {
    assert(q.taboo.length >= 1, q.uid);
    q.taboo.forEach(c => assert('abcde'.indexOf(c) >= 0, q.uid + ' の禁忌肢 ' + c));
  });
});

// 禁忌肢が正解肢でもあったらデータ矛盾（正解すると同時に禁忌を踏むことになる）
test('禁忌肢と正解肢が重ならない', () => {
  D.questions.filter(q => q.taboo).forEach(q => {
    q.taboo.forEach(c => assert(q.ans.indexOf(c) < 0, q.uid + ' で禁忌肢 ' + c + ' が正解肢'));
  });
});

test('全問に科目・出題テーマ・解説書のページ範囲が付いている', () => {
  D.questions.forEach(q => {
    assert(q.cat1 && q.cat2, q.uid + ' に科目が無い');
    assert(q.theme, q.uid + ' に出題テーマが無い');
    assert(Array.isArray(q.pdf) && q.pdf[0] > 0 && q.pdf[1] >= q.pdf[0], q.uid + ' のページ範囲');
  });
});

// 別冊（画像小冊子）の図は、解説書PDFでは設問文のすぐ後に埋め込まれている。
// つまり fig は「将来の解説HTMLでどのページから画像を抜くか」の索引そのもの。
// ⚠️ 連問のステムが参照する図を取り落とすと、ここの件数が黙って減る（実際に一度そうなった。
//    ステムを切る区切りに半角スペースを許したせいで「66 歳の男性。」で切れていた）。
// ⚠️ 枝番は「別冊No. 15 A、B」と1つの No. にまとめて書かれる紙面がある（実測7か所）。
//    `([A-Z])?` で1文字だけ拾っていた頃は B が丸ごと落ち、10問ぶんの図が数から消えていた
//    （2026-09-08に是正して 131種 → 138種／2026-09-09に「別/冊」の行折れを拾えるようにして
//    122問138種 → 128問143種）。**種類の数は減らないはず**なので、
//    ここが減ったら枝番かステムのどちらかを取り落とした合図。
test('別冊の図の索引が壊れていない（128問・143種）', () => {
  const withFig = D.questions.filter(q => q.fig);
  assert.strictEqual(withFig.length, 128, 'fig を持つ設問数');
  const pairs = new Set();
  withFig.forEach(q => {
    assert.deepStrictEqual(plain(q.fig), plain(q.fig).slice().sort(), q.uid + ' の fig が昇順でない');
    assert.strictEqual(new Set(q.fig).size, q.fig.length, q.uid + ' の fig に重複');
    q.fig.forEach(f => {
      assert(/^\d+[A-Z]?$/.test(f), q.uid + ' の別冊No が不正 ' + f);
      pairs.add(q.block + '-' + f);   // 別冊No はブロックごとに1から振り直される
    });
  });
  assert.strictEqual(pairs.size, 143, '(ブロック, 別冊No) の種類');
});

test('連問はグループ単位でまとまり、1問だけの群が無い', () => {
  const g = {};
  D.questions.filter(q => q.series).forEach(q => (g[q.series] = g[q.series] || []).push(q));
  assert(Object.keys(g).length > 0);
  Object.keys(g).forEach(k => {
    assert(g[k].length >= 2, k + ' が1問だけの連問');
    // 群の中は同じブロックで、番号が連番
    const nos = g[k].map(q => q.no).sort((a, b) => a - b);
    assert.strictEqual(new Set(g[k].map(q => q.block)).size, 1, k + ' がブロックをまたぐ');
    for (let i = 1; i < nos.length; i++) {
      assert.strictEqual(nos[i], nos[i - 1] + 1, k + ' の番号が連番でない');
    }
  });
});

// ─────────────────────────────────────────────────────────────
console.log('\n§4 エンジン — normPick');

test('選択肢は昇順・重複除去・a〜e以外を捨てる', () => {
  const q = { type: 'choice' };
  assert.strictEqual(M.normPick(q, 'EB'), 'be');
  assert.strictEqual(M.normPick(q, 'bb'), 'b');
  assert.strictEqual(M.normPick(q, 'e,b'), 'be');
  assert.strictEqual(M.normPick(q, 'xyz'), '');
  assert.strictEqual(M.normPick(q, null), '');
});

// 入力順が違うだけの同じ解答が同じ文字列にならないと、同期の last-writer-wins が
// 「別の解答」を比べることになる
test('入力順が違っても同じ文字列になる', () => {
  const q = { type: 'choice' };
  assert.strictEqual(M.normPick(q, 'eba'), M.normPick(q, 'abe'));
});

test('計算は数字だけを残し、桁数で切る', () => {
  const q = { type: 'calc', digits: 3 };
  assert.strictEqual(M.normPick(q, '1a0 4x'), '104');
  assert.strictEqual(M.normPick(q, '12345'), '123');
  assert.strictEqual(M.normPick(q, '040'), '040', '先頭ゼロを落とさないこと');
});

// ─────────────────────────────────────────────────────────────
console.log('\n§5 エンジン — 1問の採点');

test('完全一致だけが正解（部分一致は0点）', () => {
  const q = D.questions.filter(x => x.block === 'A' && x.no === 10)[0];  // 正解 b,e
  assert.deepStrictEqual(plain(q.ans), ['b', 'e']);
  assert.strictEqual(M.judge(q, 'be').state, 'correct');
  assert.strictEqual(M.judge(q, 'eb').state, 'correct', '順不同で正解');
  assert.strictEqual(M.judge(q, 'b').state, 'wrong');
  assert.strictEqual(M.judge(q, 'b').pts, 0, '部分点は無い');
  assert.strictEqual(M.judge(q, 'bce').state, 'wrong', '多く選んでも不正解');
});

test('未入力は wrong ではなく blank', () => {
  const q = D.questions[0];
  const r = M.judge(q, '');
  assert.strictEqual(r.state, 'blank');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.taboo, false, '未入力で禁忌肢を踏んだことにしない');
});

test('計算問題は桁文字列の完全一致', () => {
  const q = D.questions.filter(x => x.block === 'A' && x.no === 74)[0];
  assert.strictEqual(M.judge(q, q.ans[0]).state, 'correct');
  assert.strictEqual(M.judge(q, q.ans[0].slice(0, -1)).state, 'wrong');
});

test('禁忌肢を1つでも選んでいれば taboo が立つ', () => {
  const q = D.questions.filter(x => x.taboo && x.taboo.length === 1)[0];
  assert.strictEqual(M.judge(q, q.taboo[0]).taboo, true);
  assert.strictEqual(M.judge(q, q.ans.join('')).taboo, false);
});

// ─────────────────────────────────────────────────────────────
console.log('\n§6 エンジン — 集計');

test('全問正解で 500 / 500 点', () => {
  const s = M.score(EXAM_ID, allCorrect());
  assert.strictEqual(s.total.pts, 500);
  assert.strictEqual(s.total.max, 500);
  assert.strictEqual(s.taboo.count, 0);
});

test('必修の母数は B・E だけ（200点）で 80% が基準', () => {
  const s = M.score(EXAM_ID, allCorrect());
  assert.deepStrictEqual(plain(s.hisshu.blocks), ['B', 'E']);
  assert.strictEqual(s.hisshu.max, 200);
  assert.strictEqual(s.hisshu.need, 80);
  assert.strictEqual(s.hisshu.pass, true);
  assert.strictEqual(s.ippan.max, 300, '一般・臨床は A/C/D/F の300点');
});

// 「まだA〜Cしか解いていない日」でも意味のある数字が出ることを担保する。
// ここが崩れると、入力していないブロックのぶんだけ得点率が沈む。
test('未入力ブロックは満点にも母数にも入らない', () => {
  const a = allCorrect();
  Object.keys(a).forEach(k => { if ('DEF'.indexOf(k.charAt(0)) >= 0) delete a[k]; });
  const s = M.score(EXAM_ID, a);
  assert.deepStrictEqual(plain(s.live), ['A', 'B', 'C']);
  assert.strictEqual(s.total.max, 250, 'A75+B100+C75');
  assert.strictEqual(s.total.pts, 250);
  assert.strictEqual(s.hisshu.max, 100, '必修はBだけ＝100点満点');
  assert.strictEqual(s.ippan.max, 150);
});

test('1問も入れていなければ満点0・live 空（0除算しない）', () => {
  const s = M.score(EXAM_ID, {});
  assert.deepStrictEqual(plain(s.live), []);
  assert.strictEqual(s.total.max, 0);
  assert.strictEqual(s.total.pct, null);
  assert.strictEqual(s.hisshu.pass, null);
});

test('必修が80%を割ると pass が false', () => {
  const a = allCorrect();
  // B の臨床（3点）を6問落とすと 100 → 82点… ではなく、確実に割るため臨床を全部落とす
  D.questions.filter(q => q.block === 'B' && q.cat === '臨床').forEach(q => { a[key(q)] = 'z'; });
  const s = M.score(EXAM_ID, a);
  assert.strictEqual(s.blocks.B.pts, 25);
  assert.strictEqual(s.hisshu.pass, false);
});

test('禁忌肢は4問以上で pass が false', () => {
  const a = allCorrect();
  const t = D.questions.filter(q => q.taboo);
  t.slice(0, 3).forEach(q => { a[key(q)] = q.taboo[0]; });
  assert.strictEqual(M.score(EXAM_ID, a).taboo.pass, true, '3問なら基準内');
  a[key(t[3])] = t[3].taboo[0];
  const s = M.score(EXAM_ID, a);
  assert.strictEqual(s.taboo.count, 4);
  assert.strictEqual(s.taboo.pass, false);
});

test('科目別は入力済みブロックだけを数え、得点率の低い順に並ぶ', () => {
  const a = allCorrect();
  Object.keys(a).forEach(k => { if (k.charAt(0) !== 'A') delete a[k]; });
  const rows = M.bySubject(EXAM_ID, a);
  assert(rows.length > 0);
  assert.strictEqual(rows.reduce((s, r) => s + r.n, 0), 75, 'A の75問だけ');
  for (let i = 1; i < rows.length; i++) assert(rows[i - 1].pct <= rows[i].pct, '昇順でない');
});

// ─────────────────────────────────────────────────────────────
console.log('\n§7 エンジン — 解説の重さ');

test('weight は 0=正解 / 1=誤答 / 2=未解答 / 3=禁忌肢', () => {
  const a = allCorrect();
  const t = D.questions.filter(q => q.taboo)[0];
  const wrongQ = D.questions.filter(q => !q.taboo && q.block === 'A')[0];
  const blankQ = D.questions.filter(q => !q.taboo && q.block === 'A')[1];
  a[key(t)] = t.taboo[0];
  a[key(wrongQ)] = wrongQ.ans.indexOf('a') >= 0 ? 'b' : 'a';
  delete a[key(blankQ)];
  const w = M.weights(EXAM_ID, a);
  assert.strictEqual(w[t.uid].weight, 3);
  assert.strictEqual(w[wrongQ.uid].weight, 1);
  assert.strictEqual(w[blankQ.uid].weight, 2);
  assert.strictEqual(w[D.questions.filter(q => q.block === 'C')[0].uid].weight, 0);
});

test('weights は全400問ぶんを uid キーで返す（解説HTML側の入口）', () => {
  const w = M.weights(EXAM_ID, {});
  assert.strictEqual(Object.keys(w).length, 400);
  D.questions.forEach(q => {
    assert(w[q.uid], q.uid + ' が weights に無い');
    assert.strictEqual(w[q.uid].weight, 2, '未入力は全部2（未解答）');
  });
});

test('uid は {模試ID}_{ブロック}_q{番号} の形で一意', () => {
  const seen = new Set();
  D.questions.forEach(q => {
    assert.strictEqual(q.uid, EXAM_ID + '_' + q.block + '_q' + q.no, q.uid);
    assert(!seen.has(q.uid), '重複 ' + q.uid);
    seen.add(q.uid);
  });
});

// ─────────────────────────────────────────────────────────────
console.log('\n§8 保存と同期');

test('保存されるのは選んだ肢だけ（正誤は保存しない）', () => {
  const env = makeEnv();
  env.M.setAnswer(EXAM_ID, 'A1', 'B');
  const raw = JSON.parse(env.store['mec_mock_v1']);
  const e = raw[EXAM_ID].rounds[raw[EXAM_ID].cur].ans.A1;
  assert.strictEqual(e.p, 'b', '正規化して保存');
  assert(typeof e.t === 'number');
  assert.deepStrictEqual(Object.keys(e).sort(), ['p', 't'], '正誤・得点を保存しないこと');
});

test('空の入力はキーごと消える（未解答として残らない）', () => {
  const env = makeEnv();
  env.M.setAnswer(EXAM_ID, 'A1', 'b');
  env.M.setAnswer(EXAM_ID, 'A1', '');
  const raw = JSON.parse(env.store['mec_mock_v1']);
  assert.strictEqual(raw[EXAM_ID].rounds.r1.ans.A1, undefined);
});

test('clearBlock は指定ブロックだけを消す', () => {
  const env = makeEnv();
  env.M.setAnswer(EXAM_ID, 'A1', 'b');
  env.M.setAnswer(EXAM_ID, 'B1', 'c');
  assert.strictEqual(env.M.clearBlock(EXAM_ID, 'A'), 1);
  assert.deepStrictEqual(Object.keys(env.M.getAnswers(EXAM_ID)), ['B1']);
});

test('周回は id キーの object（配列にしない＝同期で衝突しない）', () => {
  const env = makeEnv();
  env.M.setAnswer(EXAM_ID, 'A1', 'b');
  const r2 = env.M.newRound(EXAM_ID);
  assert.strictEqual(r2, 'r2');
  assert.deepStrictEqual(plain(env.M.rounds(EXAM_ID)), ['r1', 'r2']);
  assert.deepStrictEqual(plain(env.M.getAnswers(EXAM_ID)), {}, '新しい周は空から始まる');
  env.M.useRound(EXAM_ID, 'r1');
  assert.deepStrictEqual(plain(env.M.getAnswers(EXAM_ID)), { A1: 'b' }, '前の周は残っている');
  const raw = JSON.parse(env.store['mec_mock_v1']);
  assert(!Array.isArray(raw[EXAM_ID].rounds));
});

// progress.js の実ソースで、mec_mock_v1 のマージ戦略を検査する
function mergeEnv(local) {
  const RAW = fs.readFileSync(path.join(ROOT, 'progress.js'), 'utf8');
  const PATCHED = RAW.replace('window.MECSync = {', 'window.__mergeRemote = _mergeRemote;\n  window.MECSync = {');
  assert(PATCHED !== RAW, '__mergeRemote の注入に失敗（アンカーが変わった）');
  const store = Object.create(null);
  if (local) store['mec_mock_v1'] = JSON.stringify(local);
  const stubEl = () => ({
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, textContent: '',
    addEventListener() {}, appendChild() {}, prepend() {}, after() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
    getBoundingClientRect() { return { height: 0, top: 0 }; }
  });
  const sandbox = {
    window: { addEventListener() {} },
    document: {
      addEventListener() {}, createElement: stubEl, head: { appendChild() {} }, body: { appendChild() {} },
      querySelector() { return null; }, querySelectorAll() { return []; },
      dispatchEvent() { return true; }, getElementById() { return null; }
    },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; }
    },
    location: { hash: '', pathname: '/', search: '' },
    history: { replaceState() {} },
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    setTimeout, clearTimeout, console
  };
  sandbox.self = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(PATCHED, sandbox, { filename: 'progress.js' });
  return {
    merge: sandbox.window.__mergeRemote,
    get() { return JSON.parse(store['mec_mock_v1'] || '{}'); }
  };
}

const mk = (ans, extra) => ({
  m121s: Object.assign({ cur: 'r1', rounds: { r1: { started: 1, graded: 0, ans } }, border: null }, extra)
});

test('同期: 1問ごとに時刻の新しい方が勝つ', () => {
  const env = mergeEnv(mk({ A1: { p: 'b', t: 100 }, A2: { p: 'c', t: 300 } }));
  env.merge({ mec_mock_v1: mk({ A1: { p: 'd', t: 200 }, A2: { p: 'e', t: 150 } }) });
  const a = env.get().m121s.rounds.r1.ans;
  assert.strictEqual(a.A1.p, 'd', 'リモートが新しい');
  assert.strictEqual(a.A2.p, 'c', 'ローカルが新しい');
});

test('同期: 片方にしか無い解答も両方残る', () => {
  const env = mergeEnv(mk({ A1: { p: 'b', t: 100 } }));
  env.merge({ mec_mock_v1: mk({ B7: { p: 'e', t: 100 } }) });
  assert.deepStrictEqual(Object.keys(env.get().m121s.rounds.r1.ans).sort(), ['A1', 'B7']);
});

test('同期: 別端末が足した周回が消えない', () => {
  const env = mergeEnv(mk({ A1: { p: 'b', t: 1 } }));
  const remote = mk({ A1: { p: 'b', t: 1 } });
  remote.m121s.rounds.r2 = { started: 9, graded: 0, ans: { A1: { p: 'c', t: 9 } } };
  env.merge({ mec_mock_v1: remote });
  assert.deepStrictEqual(Object.keys(env.get().m121s.rounds).sort(), ['r1', 'r2']);
});

test('同期: 採点済みの印は max（片方で採点していれば残る）', () => {
  const env = mergeEnv(mk({ A1: { p: 'b', t: 1 } }));
  const remote = mk({ A1: { p: 'b', t: 1 } });
  remote.m121s.rounds.r1.graded = 777;
  env.merge({ mec_mock_v1: remote });
  assert.strictEqual(env.get().m121s.rounds.r1.graded, 777);
});

// border は数値スカラで衝突が解けない。自分が入れた値が同期で消えるのが一番困る
test('同期: ボーダーはローカル優先、未設定のときだけリモートを採る', () => {
  let env = mergeEnv(mk({}, { border: 245 }));
  env.merge({ mec_mock_v1: mk({}, { border: 999 }) });
  assert.strictEqual(env.get().m121s.border, 245);
  env = mergeEnv(mk({}, { border: null }));
  env.merge({ mec_mock_v1: mk({}, { border: 999 }) });
  assert.strictEqual(env.get().m121s.border, 999);
});

test('同期: リモートにキーが無ければローカルは無傷', () => {
  const env = mergeEnv(mk({ A1: { p: 'b', t: 100 } }));
  env.merge({});
  assert.strictEqual(env.get().m121s.rounds.r1.ans.A1.p, 'b');
});

test('同期: ローカルが空でもリモートを取り込める（新しい端末）', () => {
  const env = mergeEnv(null);
  env.merge({ mec_mock_v1: mk({ A1: { p: 'b', t: 100 } }) });
  assert.strictEqual(env.get().m121s.rounds.r1.ans.A1.p, 'b');
});

// ─────────────────────────────────────────────────────────────
console.log('\n' + (failures.length ? failures.length + ' FAILED' : 'all passed') +
            '  (' + passed + '/' + (passed + failures.length) + ')');
if (failures.length) process.exit(1);
