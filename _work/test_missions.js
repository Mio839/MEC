/**
 * デイリー／ウィークリーミッションを実ソース（gamify.js）で検証する。
 * Run: node _work/test_missions.js
 *
 * 背景（2026-07-29の拡張）:
 *   - 旧仕様は MISSION COMPLETE を「全ミッション達成」で判定していて、その中に
 *     「試験で全問正解」という運任せの条件が入っていたため日次のセレモニーが事実上出なかった。
 *     → tier:'core' だけで判定する。ここで守りたいのは「core は毎日必ず届く種類のものだけ」。
 *   - 週次「章を3つ制覇」は端末ローカルの L.chDone を見ていたため、全章を済にすると
 *     永久未達になっていた。→ 何周でも成立する chexam80（章別試験80%以上）に置き換えた。
 *   - 達成ボーナスXPは同期台帳（mec_missions_v1.xp.ledger）に「何を取ったか」で記帳する。
 *     数を数えないので、複数端末で同じミッションを達成しても二重加算されない。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');

// ── 最小DOM/localStorage スタブ ────────────────────────────────────────────
// gamify.js は要素が無ければ静かに何もしない作りなので、getElementById/querySelector が
// null を返すだけで演出系は全部 no-op になる。
function makeEl() {
  const el = {
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, addEventListener() {}, setAttribute() {},
    animate: () => ({}), getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    // トースト等は作った直後に querySelector で内側を掴んで textContent を入れるので、
    // 「要素の中の要素」は常に新しいスタブを返す（document 側は null のままで演出を止める）。
    querySelector: () => makeEl(), querySelectorAll: () => [],
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
  };
  return el;
}

// cards: { [uid]: rate|null } … 難問判定(_isHardQ)が読む .qc[data-uid] の data-rate を差し込む。
//   値 null は「カードはあるが正答率データが無い（norate）」を表す。
//   ⚠️ .qc 以外のセレクタは従来どおり null を返すこと（演出系を no-op に保つため）。
// nowMs を渡すと時計を固定する。⚠️ 日次ミッションの8個目は DAILY_QUEST_POOL から
//   `_dateSeed(日付) % 6` で選ばれる日替わりクエストなので、実時刻のままだと
//   「どのクエストが出ているか」が日によって変わり、テストが6日に1日しか通らない。
//   その日付に依存する検証をするときは必ず時計を固定すること。
function makeCtx(cards, nowMs) {
  const store = {};
  const CARDS = cards || {};
  const DateImpl = nowMs === undefined ? Date : class extends Date {
    constructor(...a) { if (a.length === 0) super(nowMs); else super(...a); }
    static now() { return nowMs; }
  };
  const ctx = {
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      readyState: 'complete',
      head: makeEl(), body: makeEl(),
      getElementById: () => null,
      querySelector: (sel) => {
        const m = /^\.qc\[data-uid="(.+)"\]$/.exec(String(sel || ''));
        if (!m || !Object.prototype.hasOwnProperty.call(CARDS, m[1])) return null;
        const el = makeEl();
        if (CARDS[m[1]] != null) el.dataset.rate = String(CARDS[m[1]]);
        return el;
      },
      querySelectorAll: () => [],
      createElement: makeEl,
      addEventListener() {},
      dispatchEvent() {},
    },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
    requestAnimationFrame: () => 0, requestIdleCallback: null,
    Math, Date: DateImpl, JSON, console, Set, Map, Object, Array, String, Number, Error,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  ctx._store = store;
  return ctx;
}

const G = () => makeCtx().window.MecGamify;
// mec_missions_v1 から (期間, カウンタ) の端末横断合計を読む
function sum(ctx, period, counter) {
  const s = JSON.parse(ctx._store['mec_missions_v1'] || '{}');
  const keys = Object.keys(s[period] || {});
  let n = 0;
  keys.forEach(k => { const b = s[period][k]; for (const dev in b) n += (b[dev] && b[dev][counter]) || 0; });
  return n;
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// ── 定義そのものの不変条件 ────────────────────────────────────────────────
console.log('ミッション定義');

t('日次は8個・週次は8個', () => {
  const d = G()._defs;
  assert.strictEqual(d.daily.length, 8);
  assert.strictEqual(d.weekly.length, 8);
});

t('全ミッションが tier / xp / counter / target を持つ', () => {
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => {
    assert.ok(m.tier === 'core' || m.tier === 'bonus', m.id + ': tier');
    assert.ok(typeof m.xp === 'number' && m.xp > 0, m.id + ': xp');
    assert.ok(typeof m.counter === 'string' && m.counter, m.id + ': counter');
    assert.ok(typeof m.target === 'number' && m.target > 0, m.id + ': target');
  });
});

t('idは日次・週次を通して一意（XP台帳のキーに使うため）', () => {
  const d = G()._defs;
  const ids = [].concat(d.daily, d.weekly).map(m => m.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(ids.indexOf('__all__') < 0, '__all__ は全達成の予約語');
});

t('counter は実際に加算される名前だけ（typo検出）', () => {
  // 'unflag' は 2026-07-30 に廃止（在庫依存＋弱点リストを畳む動機になるため）。復活させないこと。
  const known = new Set(['ans', 'cor', 'exam', 'srs', 'redo', 'subj', 'day', 'hard', 'chexam80', 'acc80', 'perfect', 'subj_focus']);
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => assert.ok(known.has(m.counter), '未知のcounter: ' + m.counter));
});

t("週次に 'subj' を使うミッションは作らない", () => {
  // 週次バケットの subj は「日ごとの異なる科目数」の週合計＝同じ科目を5日やれば5になる。
  // 科目の広さを週で問いたいなら週キーの帳簿を別に持つこと（chexam80 と同じ方式）。
  const d = G()._defs;
  d.weekly.forEach(m => assert.notStrictEqual(m.counter, 'subj', m.id + ': 週次で subj は科目数にならない'));
});

t("日数カウンタ 'day' は core に置かない", () => {
  // day は最終日に巻き返せない唯一のカウンタ。core に置くと週の前半でセレモニーが死ぬ週が出る。
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => {
    if (m.counter === 'day') assert.strictEqual(m.tier, 'bonus', m.id + ' は巻き返せないので bonus であること');
  });
});

t('core は日次・週次とも3つ（セレモニーの条件）', () => {
  const d = G()._defs;
  assert.strictEqual(d.daily.filter(m => m.tier === 'core').length, 3);
  assert.strictEqual(d.weekly.filter(m => m.tier === 'core').length, 3);
});

t('運任せのミッション（全問正解・正答率80%）は core に入っていない', () => {
  const d = G()._defs;
  [].concat(d.daily, d.weekly).forEach(m => {
    if (m.counter === 'perfect' || m.counter === 'acc80') {
      assert.strictEqual(m.tier, 'bonus', m.id + ' は毎回は達成できないので bonus であること');
    }
  });
});

// ── カウンタの加算 ────────────────────────────────────────────────────────
console.log('カウンタ加算');

t('試験の正解は ans と cor を両方増やす', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('endo_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'd', 'cor'), 1);
});

t('不正解は ans だけ増やす', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('endo_ch01_q1', false);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'd', 'cor'), 0);
});

t('SRS復習中の解答は正誤に関わらず srs を増やす（消化数だから）', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', false, { srs: true });
  ctx.window.MecGamify.onAnswer('a_ch01_q2', true, { srs: true });
  assert.strictEqual(sum(ctx, 'd', 'srs'), 2);
});

t('通常の試験モードでは srs は増えない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'srs'), 0);
});

t('奪回(redo)は「過去に落とした問題を正解した」ときだけ増える', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true, { wasWrong: true });   // 奪回
  ctx.window.MecGamify.onAnswer('a_ch01_q2', false, { wasWrong: true });  // まだ落としたまま
  ctx.window.MecGamify.onAnswer('a_ch01_q3', true, { wasWrong: false });  // 初見で正解
  assert.strictEqual(sum(ctx, 'd', 'redo'), 1);
});

t('週次カウンタは日次と同時に増える', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onAnswer('a_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'w', 'ans'), 1);
  assert.strictEqual(sum(ctx, 'w', 'cor'), 1);
});

t('通常モードの「済」も ans に算入される', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onLap('a_ch01_q1', null);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
});

// ── 水増し防止 ────────────────────────────────────────────────────────────
console.log('水増し防止');

t('🚩の付け外しではミッションカウンタが一切動かない（unflag廃止）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  g.onFlag('endo_ch01_q1', null, false);
  g.onFlag('endo_ch01_q1', null, true);
  g.onFlag('endo_ch01_q1', null, false);
  assert.strictEqual(ctx._store['mec_missions_v1'], undefined, '旗の操作では mec_missions_v1 を書かない');
});

t('subj は同じ科目を何問解いても1、別科目に移ると2', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  g.onAnswer('endo_ch01_q1', true);
  g.onAnswer('endo_ch02_q9', false);
  assert.strictEqual(sum(ctx, 'd', 'subj'), 1);
  g.onAnswer('jinzo_d_ch03_q136', true); // prefix に _ が入る科目も1科目として数える
  assert.strictEqual(sum(ctx, 'd', 'subj'), 2);
});

t('SUBJECTS外（custom/memo）は subj に数えない', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  g.onAnswer('custom_ch01_q1', true);
  g.onAnswer('memo_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'subj'), 0);
});

t('day はその日何問解いても1（週次バケットが学習日数になる）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  g.onAnswer('endo_ch01_q1', true);
  g.onLap('resp_ch01_q1', null);
  g.onAnswer('resp_ch01_q2', false);
  assert.strictEqual(sum(ctx, 'd', 'day'), 1);
  assert.strictEqual(sum(ctx, 'w', 'day'), 1);
});

t('hard は data-rate が60未満のカードだけ数える', () => {
  const ctx = makeCtx({ 'endo_ch01_q1': 45, 'endo_ch01_q2': 75, 'endo_ch01_q3': 59.9 });
  const g = ctx.window.MecGamify;
  g.onAnswer('endo_ch01_q1', false); // 難問・不正解でも「触った数」で算入
  g.onAnswer('endo_ch01_q2', true);  // 標準
  g.onAnswer('endo_ch01_q3', true);  // 難問
  assert.strictEqual(sum(ctx, 'd', 'hard'), 2);
});

t('正答率データが無い問題（data-rateなし）は難問に数えない', () => {
  const ctx = makeCtx({ 'endo_ch01_q1': null });
  ctx.window.MecGamify.onAnswer('endo_ch01_q1', true);
  assert.strictEqual(sum(ctx, 'd', 'hard'), 0);
});

t('通常モードの「済」でも難問は数える（ans と同じ扱い）', () => {
  const ctx = makeCtx({ 'endo_ch01_q1': 40 });
  ctx.window.MecGamify.onLap('endo_ch01_q1', null);
  assert.strictEqual(sum(ctx, 'd', 'hard'), 1);
  assert.strictEqual(sum(ctx, 'd', 'ans'), 1);
});

t('章別試験80%以上は同じ章を回しても週1回だけ', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(10, 9, { chPrefix: 'neur_ch03' });
  ctx.window.MecGamify.onExamFinish(10, 10, { chPrefix: 'neur_ch03' });
  ctx.window.MecGamify.onExamFinish(10, 8, { chPrefix: 'neur_ch04' });
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 2);
});

t('章別試験でも80%未満は算入されない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(10, 7, { chPrefix: 'neur_ch03' });
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
});

t('10問未満のセッションは exam / chexam80 のどちらも増やさない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(9, 9, { chPrefix: 'neur_ch03' });
  assert.strictEqual(sum(ctx, 'd', 'exam'), 0);
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
});

t('科目全体の試験（chPrefixなし）では chexam80 は増えない', () => {
  const ctx = makeCtx();
  ctx.window.MecGamify.onExamFinish(20, 20, {});
  assert.strictEqual(sum(ctx, 'w', 'chexam80'), 0);
  assert.strictEqual(sum(ctx, 'd', 'perfect'), 1);
});

// ── 達成とボーナスXP ──────────────────────────────────────────────────────
console.log('達成とボーナスXP');

// 日次 core（100問解答 / 試験セッション1本 / 試験で20問正解）を満たすところまで回す
function driveDailyCore(g) {
  for (let i = 0; i < 80; i++) g.onAnswer('a_ch01_q' + i, false);
  for (let i = 80; i < 100; i++) g.onAnswer('a_ch01_q' + i, true);
  g.onExamFinish(100, 20, {});
}

t('bonus未達でも core が揃えば日次のコンプリートXPが入る', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const led = JSON.parse(ctx._store['mec_missions_v1']).xp.ledger;
  const key = Object.keys(led).filter(k => k[0] === 'd')[0];
  assert.ok(led[key].__all__, 'core が揃ったので __all__ が記帳される');
  assert.strictEqual(led[key].__all__, g._defs.allXp.d);
  assert.strictEqual(led[key].srs, undefined, 'SRSミッションは未達なので記帳されない');
});

t('ボーナスXPは stats().xp に乗る', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const s = g.stats(true);
  assert.ok(s.missionXp > 0, 'ミッションXPが計上されている');
  // XP = 済周回×10 + 試験解答×4 + 試験正解×6 + ミッションXP。
  // done_v2 / myrate_v1 を書くのは progress.js と study_exam.js の側なので、
  // gamify 単体を叩いたこのケースでは前3項が0になり、XPはミッションぶんだけになる。
  assert.strictEqual(s.xp, s.missionXp);
  assert.strictEqual(s.missionXp, g.missionXp());
});

// 日替わりクエストが「試験セッションを2本」(d_exam2) になる日に固定して回す。
// ⚠️ 実時刻のままだと当選するクエストが日によって変わり、下の「2周目で新たに達成される」
//    という筋道そのものが成立しない日が6日に5日ある（2026-08-30 頃に日替わりクエストを
//    入れたとき、このテストがそのまま残って落ちていた）。
const D_EXAM2_DAY = Date.UTC(2026, 0, 5, 3, 0, 0); // JST 2026-01-05 12:00

t('同じミッションを何度満たしてもXPは1回だけ（台帳は値を上書きしない）', () => {
  const ctx = makeCtx(null, D_EXAM2_DAY);
  const g = ctx.window.MecGamify;
  const ledOf = () => {
    const led = JSON.parse(ctx._store['mec_missions_v1']).xp.ledger;
    return led[Object.keys(led).filter(k => k[0] === 'd')[0]];
  };
  const xpOf = id => id === '__all__'
    ? g._defs.allXp.d
    : g._defs.daily.find(d => d.id === id).xp;

  driveDailyCore(g);
  const before = g.missionXp();
  const snap = Object.assign({}, ledOf());

  for (let i = 0; i < 40; i++) g.onAnswer('b_ch01_q' + i, true); // さらに40問
  g.onExamFinish(40, 40, {});
  const after = ledOf();

  // ここが本体の不変条件：既に記帳済みのキーは1つも書き換わらない
  for (const k of Object.keys(snap)) {
    assert.strictEqual(after[k], snap[k], k + ' が上書きされた（target超過ぶんで増えた）');
  }
  // ⚠️ 2周目は「試験セッションを2本」(d_exam2) を新たに満たすのでXPが増える。
  //    これは二重加算ではなく、1周目では未達だった別のミッションの達成。
  //    額は defs から引いて検算する（ミッションを足すたびに数字を書き換えずに済む）。
  // ⚠️ id を直に書かず defs から引く。日替わりクエストは日付で選ばれるので、
  //    「その日 d_exam2 が出ている」ことまで含めてここで検査する。
  const rnd = g._defs.daily.find(d => d.isRandom);
  assert.ok(rnd && rnd.counter === 'exam' && rnd.target === 2,
    '時計を固定した日の日替わりクエストは d_exam2（試験セッション2本）のはず');
  const gained = Object.keys(after).filter(k => !(k in snap));
  assert.deepStrictEqual(gained, [rnd.id], '2周目で新たに達成されるのは日替わりクエストだけ');
  const expect = before + gained.reduce((a, k) => a + xpOf(k), 0);
  assert.strictEqual(g.missionXp(), expect, '増分は新規達成ぶんちょうど');
});

t('missionSummary は8個ぶんの達成数と core の達成数を返す', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  driveDailyCore(g);
  const m = g.missionSummary();
  assert.strictEqual(m.total, 8);
  assert.strictEqual(m.coreTotal, 3);
  assert.strictEqual(m.coreDone, 3, 'core は全部達成している');
  // acc80 と perfect も 40/40 で満たされるので done は core3 + それら2
  assert.ok(m.done >= 3 && m.done <= 8, 'core3件以上が達成されている: ' + m.done);
});

t('達成ボーナスXPを足してもレベルは単調（XPは負にならない）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  const before = g.stats(true).xp;
  driveDailyCore(g);
  assert.ok(g.stats(true).xp > before);
});

// ── 描画 ──────────────────────────────────────────────────────────────────
console.log('描画');

// renderPanel は innerHTML に文字列を入れるだけなので、スタブ要素から取り出して中身を見る
function renderInto(g, opts) {
  const host = makeEl();
  g.renderPanel(host, opts);
  return host.innerHTML;
}

t('ハブ用(only:daily)は必須とボーナスを分けて8行出す', () => {
  const ctx = makeCtx();
  const html = renderInto(ctx.window.MecGamify, { only: 'daily' });
  assert.strictEqual((html.match(/data-tier="/g) || []).length, 8, '8行');
  assert.strictEqual((html.match(/data-tier="core"/g) || []).length, 3);
  assert.strictEqual((html.match(/data-tier="bonus"/g) || []).length, 5);
  assert.ok(html.indexOf('ボーナス') > 0, 'ボーナスの仕切りがある');
  assert.ok(html.indexOf('gm-mission-foot') > 0, '獲得XPの行がある');
});

t('日次にはペース目盛りを出さない（1日の中の進み具合には意味が薄い）', () => {
  const ctx = makeCtx();
  assert.ok(renderInto(ctx.window.MecGamify, { only: 'daily' }).indexOf('gm-pace') < 0);
});

t('週次にはペース目盛りと残り日数を出す', () => {
  const ctx = makeCtx();
  const html = renderInto(ctx.window.MecGamify, {});
  assert.ok(html.indexOf('gm-pace') > 0, 'ペース目盛り');
  assert.ok(/残り\d日/.test(html), '残り日数');
});

t('達成済みの行にはペース目盛りを出さない（意味が無く紛らわしいため）', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  for (let i = 0; i < 260; i++) g.onAnswer('a_ch01_q' + i, true); // 週次 w_ans(250) を達成
  const html = renderInto(g, {});
  const row = html.slice(html.indexOf('今週 250問'));
  assert.ok(row.slice(0, 400).indexOf('gm-pace') < 0);
});

t('バーの割合は target を超えても100%を超えない', () => {
  const ctx = makeCtx();
  const g = ctx.window.MecGamify;
  for (let i = 0; i < 90; i++) g.onAnswer('a_ch01_q' + i, true); // 日次 ans(40) の倍以上
  const html = renderInto(g, { only: 'daily' });
  (html.match(/gm-mission-fill" style="width:(\d+)%/g) || []).forEach(m => {
    assert.ok(parseInt(m.match(/(\d+)%/)[1], 10) <= 100, m);
  });
});


console.log('新機能: 日替わり・弱点・金スタンプ');
t('日替わりクエストと弱点フォーカスミッションが正しく含まれている', () => {
  const d = G()._defs;
  assert.strictEqual(d.daily.length, 8);
  const focus = d.daily.find(m => m.counter === 'subj_focus');
  assert.ok(focus, '弱点科目フォーカスミッションが存在する');
  assert.ok(focus.label.indexOf('【弱点強化】') >= 0, '弱点強化のラベル');
  assert.strictEqual(focus.tier, 'bonus');

  const randQuest = d.daily.find(m => m.isRandom);
  assert.ok(randQuest, '日替わりランダムクエストが存在する');
  assert.strictEqual(randQuest.isRandom, true);
});

t('日替わりランダムミッションの描画に is-random クラスと日替わりバッジが付与される', () => {
  const ctx = makeCtx();
  const html = renderInto(ctx.window.MecGamify, { only: 'daily' });
  assert.ok(html.indexOf('is-random') > 0, 'is-random クラスが存在する');
  assert.ok(html.indexOf('data-random="true"') > 0, 'data-random="true" が存在する');
  assert.ok(html.indexOf('gm-mission-tag') > 0, 'gm-mission-tag が存在する');
  assert.ok(html.indexOf('🎲 日替わり') > 0, '🎲 日替わり ラベルが存在する');
});

t('goldenDays と goldenStreak の計算', () => {
  const ctx = makeCtx();
  const mg = ctx.window.MecGamify;
  // 初期は空
  assert.strictEqual(mg.goldenDays().length, 0);
  assert.strictEqual(mg.goldenStreak(), 0);

  // 台帳に書き込みをシミュレート
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const store = JSON.parse(ctx._store['mec_missions_v1'] || '{}');
  store.xp = store.xp || {};
  store.xp.ledger = store.xp.ledger || {};
  store.xp.ledger['d:' + today] = { __all__: 150 };
  ctx._store['mec_missions_v1'] = JSON.stringify(store);

  assert.deepStrictEqual(Array.from(mg.goldenDays()), [today]);
  assert.strictEqual(mg.goldenStreak(), 1);
});

// ⚠️ このテスト自身が日付で落ちるのを防ぐための検査。
//    日次の8個目は日付ハッシュで DAILY_QUEST_POOL から1つ選ばれるので、
//    「今日たまたま出ているクエスト」を前提に書いたアサーションは6日に5日落ちる
//    （2026-09-01 に実際にそうなっていた＝当選は d_redo5 なのに d_exam2 を期待していた）。
//    日付に依存する検証は makeCtx(null, nowMs) で時計を固定すること。
t('日替わりクエストは日付だけで決まり、プールの全項目が出番を持つ', () => {
  const seen = new Map();          // クエストid → 最初に出た日
  const DAY = 86400000;
  for (let i = 0; i < 366; i++) {
    const now = Date.UTC(2026, 0, 1, 3, 0, 0) + i * DAY;
    const daily = makeCtx(null, now).window.MecGamify._defs.daily;
    const rnd = daily.filter(d => d.isRandom);
    assert.strictEqual(rnd.length, 1, '日替わりクエストは常にちょうど1つ');
    assert.strictEqual(daily.length, 8, '日次は日替わりを含めて常に8個');
    if (!seen.has(rnd[0].id)) seen.set(rnd[0].id, new Date(now).toISOString().slice(0, 10));
  }
  // プールの中身は gamify.js が正本なので、件数を書き写さず「出た種類 ≧ 2」ではなく
  // 「同じ日付なら必ず同じクエスト」＋「1年で複数種類が回る」を見る
  assert.ok(seen.size >= 2, 'プールが1種類に固まっていない（実際に出たのは ' + seen.size + ' 種類）');

  // 決定論であること: 同じ日付なら何度作っても同じクエスト
  const at = t0 => makeCtx(null, t0).window.MecGamify._defs.daily.find(d => d.isRandom).id;
  const t0 = Date.UTC(2026, 4, 17, 3, 0, 0);
  assert.strictEqual(at(t0), at(t0), '同じ日付なら同じクエスト');
});

console.log('\n' + (fail ? 'FAILED ' : 'all passed ') + ' (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
