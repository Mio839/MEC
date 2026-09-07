/**
 * 自己採点3段階（× / △ / ○）と復習キューの並びを実ソース（study.html）で検証する。
 * Run: node _work/test_srs_grade.js
 *
 * 背景: 2026-07-24 まで通常モードの「済」は無条件で正解扱いだった。想起テストを経ずに
 * 間隔だけが伸び、SRSが「定着済み」で埋まる一方 myrate_v1 とは食い違っていた。
 * 2026-09-06 に「経過日数を一度も見ていない」「ゆらぎが無い」「並びが古い順のFIFO」
 * 「出題順が科目ブロック」の4点を直した。ここで守りたい不変条件:
 *   - × は必ず翌日に戻し reps を 0 にする（間隔が伸びたまま残らない）
 *   - △ は伸びるが ○ より必ず遅い
 *   - 試験モードは真偽値で呼ぶ（true=○ / false=×）ので互換が壊れていない
 *   - 間隔は 90日、ef は 1.3〜2.5 を出ない
 *   - 予定より早く解いた回は伸びを按分する（同じ日の解き直しでは1日も伸びない）
 *   - ゆらぎは乱数ではなく uid と間隔から決まる（端末をまたいで nextReview がぶれない）
 *   - 復習キューの並びは「待たされ具合」の降順、出題順は科目が交ざる
 *
 * ⚠️ このテストは仮想時計で日付を進める。_updateSRS は経過日数を見るようになったので、
 *    同じ日に連続で呼ぶのは「同日の解き直し」であって「2回目の復習」ではない。
 *    予定どおりの復習を書くときは review() を使うこと。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');

// study.html のインラインJSから関数を名前で切り出す（波括弧の対応で末尾を決める）
function grabFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.ok(start > 0, 'not found: ' + name);
  let depth = 0;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced: ' + name);
}
// `const NAME = ...;` を1行そのまま取る（定数を書き写さないため）
function grabConst(src, name) {
  const m = new RegExp('^const ' + name + ' = .*;$', 'm').exec(src);
  assert.ok(m, 'not found: const ' + name);
  return m[0];
}

const RealDate = Date;
const DAY = 86400000;

function makeCtx(startMs) {
  // JST の正午あたりに置く（UTC との日付ずれを踏まないように）
  let clock = startMs == null ? RealDate.UTC(2026, 0, 1, 3, 0, 0) : startMs;
  class FakeDate extends RealDate {
    constructor(...a) { if (!a.length) super(clock); else super(...a); }
    static now() { return clock; }
  }
  const ctx = {
    _srsData: {},
    _saveSRS() {},
    _markGradeOn() {},
    document: { querySelectorAll: () => [] },
    Math, Date: FakeDate, JSON, console,
    advance(days) { clock += days * DAY; },
    setDay(ymd) { clock = RealDate.parse(ymd + 'T03:00:00Z'); },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(
    grabConst(HTML, 'SRS_FUZZ_PCT') + '\n' +
    grabConst(HTML, 'SRS_EXAM_FRACTION') + '\n' +
    grabFn(HTML, '_today') + '\n' +
    grabFn(HTML, '_addDays') + '\n' +
    grabFn(HTML, '_daysDiff') + '\n' +
    grabFn(HTML, '_srsExamCap') + '\n' +
    grabFn(HTML, '_srsFuzz') + '\n' +
    grabFn(HTML, '_srsUrgency') + '\n' +
    grabFn(HTML, '_srsInterleave') + '\n' +
    grabConst(HTML, 'SERIES_DECL_RE') + '\n' +
    grabConst(HTML, 'SERIES_LABEL_RE') + '\n' +
    grabConst(HTML, 'SRS_SERIES_PULL_MAX') + '\n' +
    grabFn(HTML, '_uidSeq') + '\n' +
    grabFn(HTML, '_seriesInfoOf') + '\n' +
    grabFn(HTML, '_seriesGroupsOf') + '\n' +
    grabFn(HTML, '_srsSeriesPullIns') + '\n' +
    grabFn(HTML, '_updateSRS') + '\n', ctx);
  return ctx;
}

// 「予定どおりに復習する」＝ nextReview まで時計を進めてから解く。
// 初回（まだエントリが無い）はその場で解く。
function review(c, uid, grade) {
  const e = c._srsData[uid];
  if (e && e.interval) c.advance(e.interval);
  c._updateSRS(uid, grade);
  return c._srsData[uid];
}

// 別 vm コンテキストで作られたオブジェクトは prototype が異なり deepStrictEqual が
// 「same structure but not reference-equal」で落ちる。中身だけを比べる。
const same = (a, b, msg) =>
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

const U = 'endo_ch01_q1';

t('初回 ○ は翌日・reps=1', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 1);
  assert.strictEqual(c._srsData[U].reps, 1);
  assert.strictEqual(c._srsData[U].g, 'ok');
});

t('○ を重ねると 1 → 6 → ef倍 と伸びる（ゆらぎの幅を含む）', () => {
  const c = makeCtx();
  review(c, U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 1);
  review(c, U, 'ok');
  const second = c._srsData[U].interval;
  assert.ok(second >= 5 && second <= 7, '2回目は6日±ゆらぎ: ' + second);
  review(c, U, 'ok');
  assert.ok(c._srsData[U].interval > second, '3回目でさらに伸びる: ' + c._srsData[U].interval);
});

t('△ の伸びは常に ○ より遅い', () => {
  const mid = makeCtx(), ok = makeCtx();
  for (let i = 0; i < 4; i++) { review(mid, U, 'mid'); review(ok, U, 'ok'); }
  assert.ok(mid._srsData[U].interval < ok._srsData[U].interval,
    `mid=${mid._srsData[U].interval} < ok=${ok._srsData[U].interval}`);
});

t('△ でも間隔は単調に伸びる（同じ日に張り付かない）', () => {
  const c = makeCtx();
  const seen = [];
  for (let i = 0; i < 6; i++) { review(c, U, 'mid'); seen.push(c._srsData[U].interval); }
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i] >= seen[i - 1], '間隔が縮まない: ' + seen.join(','));
  }
  assert.ok(seen[seen.length - 1] > seen[0], '最終的には伸びる: ' + seen.join(','));
});

t('× は間隔を1日へ戻し reps を 0 にする', () => {
  const c = makeCtx();
  for (let i = 0; i < 5; i++) review(c, U, 'ok');
  assert.ok(c._srsData[U].interval > 10, '前提: 十分伸びている');
  c._updateSRS(U, 'ng');
  assert.strictEqual(c._srsData[U].interval, 1);
  assert.strictEqual(c._srsData[U].reps, 0);
  assert.strictEqual(c._srsData[U].g, 'ng');
});

t('× は経過日数に関わらず翌日へ戻す（早すぎる失敗も失敗）', () => {
  const c = makeCtx();
  for (let i = 0; i < 4; i++) review(c, U, 'ok');
  c._updateSRS(U, 'ng');   // 時計を進めずに＝予定より遥かに早く失敗
  assert.strictEqual(c._srsData[U].interval, 1, '割り引かれずに1日へ戻る');
  assert.strictEqual(c._srsData[U].reps, 0);
});

t('× は ef を下げ、△ は ef を据え置く', () => {
  const a = makeCtx(), b = makeCtx();
  a._updateSRS(U, 'ng');
  b._updateSRS(U, 'mid');
  assert.ok(a._srsData[U].ef < 2.5, '× で ef が下がる');
  assert.strictEqual(b._srsData[U].ef, 2.5, '△ は ef 据え置き');
});

t('試験モードの真偽値呼び出しと互換（true=○ / false=×）', () => {
  const bool = makeCtx(), str = makeCtx();
  bool._updateSRS(U, true); str._updateSRS(U, 'ok');
  same(bool._srsData[U], str._srsData[U], 'true が ok と一致');
  bool.advance(1); str.advance(1);
  bool._updateSRS(U, false); str._updateSRS(U, 'ng');
  same(bool._srsData[U], str._srsData[U], 'false が ng と一致');
});

t('未知の grade は ○ とみなす（旧呼び出しを壊さない）', () => {
  const a = makeCtx(), b = makeCtx();
  a._updateSRS(U, undefined); b._updateSRS(U, 'ok');
  same(a._srsData[U], b._srsData[U], 'undefined が ok と一致');
});

t('間隔は90日、ef は 1.3〜2.5 を出ない', () => {
  const c = makeCtx();
  for (let i = 0; i < 40; i++) review(c, U, 'ok');
  assert.ok(c._srsData[U].interval <= 90, 'interval=' + c._srsData[U].interval);
  assert.ok(c._srsData[U].ef <= 2.5);
  const d = makeCtx();
  for (let i = 0; i < 40; i++) review(d, U, 'ng');
  assert.ok(d._srsData[U].ef >= 1.3, 'ef=' + d._srsData[U].ef);
});

t('nextReview は今日+interval（JST）・lastSeen は今日', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  const today = new Date(c.Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const want = new Date(new Date(today + 'T00:00:00Z').getTime() + 86400000)
    .toISOString().slice(0, 10);
  assert.strictEqual(c._srsData[U].nextReview, want);
  assert.strictEqual(c._srsData[U].lastSeen, today);
});

// ── 経過日数ゲート（2026-09-06） ─────────────────────────────────────────────
// これが無かった頃は、同じ日に6回正解しただけで間隔が90日＝上限に達し、
// その問題は復習キューから事実上消えていた。

t('同じ日に何度 ○ しても間隔は1日も伸びない', () => {
  const c = makeCtx();
  c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 1);
  for (let i = 0; i < 10; i++) c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].interval, 1,
    '同日の解き直しで伸びた: ' + c._srsData[U].interval);
});

t('同じ日に何度 ○ しても ef は上がらない', () => {
  const c = makeCtx();
  review(c, U, 'ng');            // ef を 2.3 まで下げてから
  const ef0 = c._srsData[U].ef;
  for (let i = 0; i < 10; i++) c._updateSRS(U, 'ok');
  assert.strictEqual(c._srsData[U].ef, ef0, 'ef=' + c._srsData[U].ef);
});

t('予定の半分で解いたら伸びも半分（按分される）', () => {
  const onTime = makeCtx(), early = makeCtx();
  // 2回 ○ して間隔を 6日前後まで育てる（両者まったく同じ状態）
  for (let i = 0; i < 2; i++) { review(onTime, U, 'ok'); review(early, U, 'ok'); }
  const base = onTime._srsData[U].interval;
  assert.strictEqual(base, early._srsData[U].interval, '前提: 同じ状態');
  onTime.advance(base);                    // 予定どおり
  early.advance(Math.floor(base / 2));     // 予定の半分
  onTime._updateSRS(U, 'ok');
  early._updateSRS(U, 'ok');
  const full = onTime._srsData[U].interval - base;
  const half = early._srsData[U].interval - base;
  assert.ok(full > 0, '予定どおりなら伸びる: +' + full);
  assert.ok(half > 0 && half < full,
    `早い回の伸びは小さい: 予定どおり +${full} / 半分 +${half}`);
});

t('予定を過ぎてから解いた回は従来と同じ値になる（按分で損しない）', () => {
  const onTime = makeCtx(), late = makeCtx();
  for (let i = 0; i < 3; i++) { review(onTime, U, 'ok'); review(late, U, 'ok'); }
  const base = onTime._srsData[U].interval;
  onTime.advance(base);
  late.advance(base * 3);   // 大幅に遅れて解いた
  onTime._updateSRS(U, 'ok');
  late._updateSRS(U, 'ok');
  assert.strictEqual(late._srsData[U].interval, onTime._srsData[U].interval,
    'ratio は 1 で頭打ち＝遅れても余計に伸びない');
});

t('lastSeen を持たない旧データは満額で伸ばす（進捗を巻き戻さない）', () => {
  const c = makeCtx();
  c._srsData[U] = { reps: 3, ef: 2.5, interval: 10 };   // lastSeen 無し
  c._updateSRS(U, 'ok');
  assert.ok(c._srsData[U].interval > 20,
    '旧データが割り引かれた: ' + c._srsData[U].interval);
});

// ── 間隔のゆらぎ（2026-09-06） ───────────────────────────────────────────────

t('ゆらぎは uid と間隔から決まる＝乱数ではない', () => {
  const c = makeCtx();
  const runs = new Set();
  for (let i = 0; i < 20; i++) runs.add(c._srsFuzz('resp_ch01_q1', 30));
  assert.strictEqual(runs.size, 1, '同じ入力で値が揺れた: ' + [...runs].join(','));
});

t('ゆらぎは ±5%（最低±1日）以内・1〜2日は動かさない', () => {
  const c = makeCtx();
  assert.strictEqual(c._srsFuzz(U, 1), 1, '1日は動かさない');
  assert.strictEqual(c._srsFuzz(U, 2), 2, '2日は動かさない');
  [3, 6, 15, 38, 90].forEach(iv => {
    const j = Math.max(1, Math.round(iv * 0.05));
    for (let n = 0; n < 200; n++) {
      const v = c._srsFuzz('x_ch01_q' + n, iv);
      assert.ok(Math.abs(v - iv) <= j, `interval=${iv} → ${v} (許容±${j})`);
    }
  });
});

t('ゆらぎで問題ごとに予定日がばらける（塊で戻ってこない）', () => {
  const c = makeCtx();
  const days = new Set();
  for (let n = 0; n < 100; n++) days.add(c._srsFuzz('resp_ch01_q' + n, 20));
  assert.ok(days.size >= 3, '同じ日に固まった: ' + [...days].join(','));
});

// ── 復習キューの並び（2026-09-06） ───────────────────────────────────────────

t('待たされ具合は「遅れ日数 ÷ 予定間隔」', () => {
  const c = makeCtx();
  const today = '2026-03-01';
  // 間隔1日で1日遅れ → (1+1)/1 = 2.0 ／ 間隔90日で5日遅れ → (5+1)/90 ≒ 0.067
  const fragile = c._srsUrgency({ nextReview: '2026-02-28', interval: 1 }, today);
  const mature = c._srsUrgency({ nextReview: '2026-02-24', interval: 90 }, today);
  assert.ok(fragile > mature,
    `もろい問題が優先される: fragile=${fragile.toFixed(2)} > mature=${mature.toFixed(2)}`);
});

t('もろい問題は古い期限切れより先に出る（旧FIFOでは後回しだった）', () => {
  const c = makeCtx();
  const today = '2026-03-01';
  const srs = {
    old_mature: { nextReview: '2026-01-01', interval: 90 },  // 59日遅れだが予定も長い
    new_fragile: { nextReview: '2026-02-28', interval: 1 },  // 1日遅れだが予定は1日
  };
  const sorted = Object.keys(srs).sort((a, b) => {
    const ua = c._srsUrgency(srs[a], today), ub = c._srsUrgency(srs[b], today);
    return ub - ua;
  });
  assert.strictEqual(sorted[0], 'new_fragile', '並び: ' + sorted.join(','));
  // 旧実装（nextReview 昇順）なら old_mature が先だったことを明示しておく
  const oldSorted = Object.keys(srs).sort((a, b) =>
    srs[a].nextReview < srs[b].nextReview ? -1 : 1);
  assert.strictEqual(oldSorted[0], 'old_mature', '旧実装の挙動を取り違えている');
});

t('出題順は科目が交ざる（科目ブロックのまま出さない）', () => {
  const c = makeCtx();
  // 実際の due は科目ごとに固まって並ぶ（同じ日に解いた＝同じ科目・同じ nextReview）
  const uids = [];
  ['resp', 'circ', 'neur'].forEach(sid => {
    for (let i = 1; i <= 20; i++) uids.push(sid + '_ch01_q' + i);
  });
  const out = c._srsInterleave(uids);
  assert.strictEqual(out.length, uids.length, '件数が変わった');
  assert.deepStrictEqual([...out].sort(), [...uids].sort(), '中身が変わった');
  // 隣り合う2問が別科目である割合。科目ブロックのままなら 2/59 ≒ 3% にしかならない。
  let switches = 0;
  for (let i = 1; i < out.length; i++) {
    if (out[i].split('_ch')[0] !== out[i - 1].split('_ch')[0]) switches++;
  }
  assert.ok(switches / (out.length - 1) > 0.4,
    '科目が交ざっていない: 切替率 ' + (switches / (out.length - 1)).toFixed(2));
});

t('出題順は同じ日なら何度開いても同じ（乱数ではない）', () => {
  const c = makeCtx();
  const uids = ['a_ch01_q1', 'b_ch01_q2', 'c_ch01_q3', 'd_ch01_q4', 'e_ch01_q5'];
  assert.deepStrictEqual(c._srsInterleave(uids), c._srsInterleave(uids));
  c.advance(1);
  const other = c._srsInterleave(uids);
  assert.deepStrictEqual([...other].sort(), [...uids].sort(), '日が変わっても中身は同じ');
});

t('試験日ゲートは残り日数の半分で間隔を頭打ちにする', () => {
  const c = makeCtx();
  // 今日を 2027-01-01 に設定。試験日 2027-02-06（残り 36 日）
  c.setDay('2027-01-01');
  c.MECSync = { examDate: () => '2027-02-06' };
  // 初回 reps=1 (1日)
  c._updateSRS(U, 'ok');
  // 予定通り進めて reps=2 (6日)
  c.advance(1);
  c._updateSRS(U, 'ok');
  // 6日後、通常なら 6 * 2.5 = 15日
  c.advance(6);
  c._updateSRS(U, 'ok');
  // さらに進めて間隔が大きくなろうとするとき、上限 floor(残り日数 * 0.5) が効く
  // 残り日数が 20 日なら上限は 10 日。±5% のゆらぎ込みでも 11 日を超えない
  c.advance(10);
  // 残り 36 - 1 - 6 - 10 = 19 日。上限 floor(19 * 0.5) = 9 日。
  c._updateSRS(U, 'ok');
  assert.ok(c._srsData[U].interval <= 10, '間隔が上限を超えている: ' + c._srsData[U].interval);
});

t('試験日を過ぎている場合は試験日ゲートを掛けない', () => {
  const c = makeCtx();
  c.setDay('2027-03-01');
  c.MECSync = { examDate: () => '2027-02-06' };
  assert.strictEqual(c._srsExamCap(), Infinity);
});

t('試験日ゲートで上限に切られた成熟札にもゆらぎが適用される', () => {
  const c = makeCtx();
  c.setDay('2027-01-01');
  c.MECSync = { examDate: () => '2027-02-06' }; // 残り 36 日 -> 上限 18 日
  // 成熟札（前回 interval: 60）を予定どおり解いたとする
  c._srsData[U] = { reps: 5, interval: 60, ef: 2.5, nextReview: '2027-01-01', lastSeen: '2026-11-02' };
  c._updateSRS(U, 'ok');
  // 60 から伸びようとするが上限 18 日で切られる。
  // interval <= prev (18 <= 60) だが _capped により _srsFuzz が適用される
  const fuzzed = c._srsFuzz(U, 18);
  assert.strictEqual(c._srsData[U].interval, fuzzed);
});

// ⚠️ このゲートの存在理由そのもの。上の2件は上限値を見ているだけで、
//    「予定日が試験日を越えない」という肝心の不変条件を検査していない。
t('直前期のどの日に解いても予定日が試験日を越えない', () => {
  const EXAM = '2027-02-06';
  // 残り 120日〜1日の各起点で、成熟札・育ちかけ・初回の3種を解いて予定日を確かめる。
  for (let left = 120; left >= 1; left--) {
    const c = makeCtx();
    c.MECSync = { examDate: () => EXAM };
    const start = new RealDate(RealDate.parse(EXAM + 'T00:00:00Z') - left * DAY)
      .toISOString().slice(0, 10);
    c.setDay(start);
    const cases = [
      { uid: 'mature_ch01_q1', e: { reps: 6, interval: 90, ef: 2.5, nextReview: start, lastSeen: '2026-01-01' } },
      { uid: 'mid_ch01_q2', e: { reps: 3, interval: 15, ef: 2.5, nextReview: start, lastSeen: '2026-12-01' } },
      { uid: 'fresh_ch01_q3', e: null },
    ];
    for (const { uid, e } of cases) {
      if (e) c._srsData[uid] = e;
      c._updateSRS(uid, 'ok');
      const nr = c._srsData[uid].nextReview;
      assert.ok(nr <= EXAM,
        `残り${left}日（${start}）の ${uid}: 予定日 ${nr} が試験日 ${EXAM} を越えた`);
      assert.ok(c._srsData[uid].interval >= 1, '間隔が1日を下回った');
    }
  }
});

// 逆方向の回帰ガード。ゲートは直前期のためのもので、余裕がある時期の挙動を
// 1日も変えてはいけない（従来の 90 日上限・ゆらぎ・按分がそのまま残ること）。
t('試験日が遠いうちはゲートが従来の予定日を1日も変えない', () => {
  const withGate = makeCtx();                       // 既定 2027-02-06
  const noGate = makeCtx();
  noGate.MECSync = { examDate: () => '' };          // examDate が空 → cap = Infinity
  // 2026-01-01 起点（残り 401日）。上限 200 日 > 90 日上限なのでゲートは効かないはず。
  for (let i = 0; i < 6; i++) {
    review(withGate, U, 'ok');
    review(noGate, U, 'ok');
  }
  same(withGate._srsData[U], noGate._srsData[U], 'ゲートの有無で結果が変わっている');
  assert.ok(withGate._srsData[U].interval > 1, '育っていない＝検査になっていない');
});

// ── 連問（1つの症例を複数の設問で追うもの）─────────────────────────────────
// 2026-09-07 まで復習キューは uid を1問ずつハッシュで交ぜており、連問は必ずバラバラの順で
// 出ていた（「Q.107 → Q.106」のように症例の途中から始まり、後の設問が前の設問の答え＝
// 診断名や実施した処置を先に見せていた）。ここで守りたい不変条件:
//   - 連問の兄弟は必ず隣り合い、章 → 番号の昇順で出る
//   - 連問を含まないセッションの並びは従来と1問も変わらない
//   - 上限50問の境目で切れた兄弟は、今日 due なものだけ拾い直す（due でないものは出さない）
//   - qt の3つの書式（宣言文・共通ステム・産婦人科の要約）すべてから群を復元できる
//
// ⚠️ 判定材料は qt だけ（データにも DOM にも「連問である」という印は無い）。だから
//    questions_*.json の実データを全数流して復元できることを検査する。書式の追加・変更で
//    ここが落ちたら study.html の SERIES_DECL_RE / SERIES_LABEL_RE / _seriesInfoOf を直す。

// _seriesInfoOf は DOM から qt を読むので、qt の HTML から最小限のノードを組む。
// textContent / querySelector('.qt-context') / cloneNode / querySelectorAll('.series-label')
// と remove() だけを実装する（それ以外は使っていない＝使い始めたらここも足りなくなる）。
class El {
  constructor(cls) { this.cls = cls || []; this.kids = []; this.parent = null; }
  get textContent() {
    return this.kids.map(k => (typeof k === 'string' ? k : k.textContent)).join('');
  }
  _collect(cls, out) {
    this.kids.forEach(k => {
      if (typeof k === 'string') return;
      if (k.cls.indexOf(cls) >= 0) out.push(k);
      k._collect(cls, out);
    });
    return out;
  }
  querySelector(sel) { return this._collect(sel.slice(1), [])[0] || null; }
  querySelectorAll(sel) { return this._collect(sel.slice(1), []); }
  cloneNode() {
    const c = new El(this.cls.slice());
    this.kids.forEach(k => {
      if (typeof k === 'string') { c.kids.push(k); return; }
      const kc = k.cloneNode(true); kc.parent = c; c.kids.push(kc);
    });
    return c;
  }
  remove() {
    const p = this.parent; if (!p) return;
    const i = p.kids.indexOf(this); if (i >= 0) p.kids.splice(i, 1);
  }
}

function parseQt(html) {
  const root = new El([]);
  const stack = [root];
  const re = /<span([^>]*)>|<\/span>|<[^>]+>|[^<]+/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tok = m[0];
    if (tok.indexOf('</span') === 0) { if (stack.length > 1) stack.pop(); }
    else if (tok.indexOf('<span') === 0) {
      const cm = /class="([^"]*)"/.exec(m[1] || '');
      const node = new El(cm ? cm[1].trim().split(/\s+/) : []);
      node.parent = stack[stack.length - 1];
      stack[stack.length - 1].kids.push(node);
      stack.push(node);
    } else if (tok.charAt(0) !== '<') {
      // <b> や <br/> は本文に影響しないので捨て、テキストだけを拾う
      stack[stack.length - 1].kids.push(
        tok.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
           .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));
    }
  }
  return root;
}

// uid → qt(HTML) の対応から、_seriesInfoOf が読める document を差した文脈を作る
function withCards(c, qtByUid) {
  const cache = new Map();
  c.document = {
    querySelector(sel) {
      const m = /data-uid="([^"]+)"/.exec(sel);
      if (!m || qtByUid[m[1]] == null) return null;
      if (!cache.has(m[1])) cache.set(m[1], parseQt(qtByUid[m[1]]));
      return cache.get(m[1]);
    },
    querySelectorAll: () => [],
  };
  return c;
}

const _seq = uid => { const m = /^(.*_ch\d+)_q(\d+)$/.exec(uid); return { ch: m[1], n: +m[2] }; };

t('連問の兄弟は隣り合い、章→番号の昇順で出る', () => {
  const c = makeCtx();
  // infoOf を差し替えて DOM 無しで回す（qt からの復元は下の実データ版が検査する）
  const fam = {
    obg_ch03_q135: { key: 'r:135-136', lo: 135, hi: 136 },
    obg_ch03_q136: { key: 'r:135-136', lo: 135, hi: 136 },
    neur_ch02_q30: { key: 'c:stemA', lo: 30, hi: 32 },
    neur_ch02_q31: { key: 'c:stemA', lo: 30, hi: 32 },
    neur_ch02_q32: { key: 'c:stemA', lo: 30, hi: 32 },
  };
  const uids = ['neur_ch02_q32', 'resp_ch01_q5', 'obg_ch03_q136', 'neur_ch02_q30',
                'circ_ch01_q9', 'obg_ch03_q135', 'neur_ch02_q31', 'hema_ch01_q2'];
  const out = c._srsInterleave(uids, u => fam[u] || null);
  assert.deepStrictEqual([...out].sort(), [...uids].sort(), '中身が変わった');
  const at = u => out.indexOf(u);
  assert.strictEqual(at('obg_ch03_q136') - at('obg_ch03_q135'), 1, '連問が離れた/逆順: ' + out.join(','));
  assert.strictEqual(at('neur_ch02_q31') - at('neur_ch02_q30'), 1, '連問が離れた/逆順: ' + out.join(','));
  assert.strictEqual(at('neur_ch02_q32') - at('neur_ch02_q31'), 1, '連問が離れた/逆順: ' + out.join(','));
});

t('連問を含まないセッションの並びは従来と1問も変わらない', () => {
  const c = makeCtx();
  const uids = [];
  ['resp', 'circ', 'neur'].forEach(sid => {
    for (let i = 1; i <= 20; i++) uids.push(sid + '_ch01_q' + i);
  });
  // 旧実装（1問ずつ uid+日付のハッシュで並べる）を書き下ろして突き合わせる
  const day = c._today();
  const h = u => {
    let x = 2166136261; const s = u + ':' + day;
    for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  };
  const before = uids.map(u => [h(u), u]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  same(c._srsInterleave(uids, () => null), before, '単問だけの並びが変わった');
});

t('上限で切れた連問の兄弟は due なら拾い直す', () => {
  const c = makeCtx();
  const info = {
    obg_ch06_q253: { key: 'r:253-255', lo: 253, hi: 255 },
    obg_ch06_q254: { key: 'r:253-255', lo: 253, hi: 255 },
    obg_ch06_q255: { key: 'r:253-255', lo: 253, hi: 255 },
  };
  const picked = ['obg_ch06_q253', 'resp_ch01_q1'];
  const allDue = picked.concat(['obg_ch06_q254', 'obg_ch06_q255', 'resp_ch01_q9']);
  const got = c._srsSeriesPullIns(picked, allDue, u => info[u] || null);
  same(got.sort(), ['obg_ch06_q254', 'obg_ch06_q255'], '拾えていない: ' + got);
});

t('due でない兄弟は拾わない（SRSの予定を先取りしない）', () => {
  const c = makeCtx();
  const info = { obg_ch06_q253: { key: 'r:253-255', lo: 253, hi: 255 } };
  const picked = ['obg_ch06_q253'];
  const got = c._srsSeriesPullIns(picked, picked.slice(), u => info[u] || null);
  assert.strictEqual(got.length, 0, 'due でないものを拾った: ' + got);
});

t('拾い直しは SRS_SERIES_PULL_MAX で頭打ちになる', () => {
  const c = makeCtx();
  const picked = [], allDue = [];
  for (let g = 0; g < 30; g++) {
    picked.push('obg_ch01_q' + (g * 10 + 1));
    allDue.push('obg_ch01_q' + (g * 10 + 1), 'obg_ch01_q' + (g * 10 + 2));
  }
  const info = u => {
    const n = _seq(u).n;
    return n % 10 === 1 ? { key: 'r:' + n + '-' + (n + 1), lo: n, hi: n + 1 } : null;
  };
  const got = c._srsSeriesPullIns(picked, allDue, info);
  // const は vm の文脈オブジェクトのプロパティにならないので、ソースから読む（数字を書き写さない）
  const cap = +grabConst(HTML, 'SRS_SERIES_PULL_MAX').split('=')[1].replace(';', '').trim();
  assert.strictEqual(got.length, cap, '上限を超えた/届かない: ' + got.length + ' / cap=' + cap);
});

t('番号が uid の連番と一致しない科目では宣言文の番号を信用しない（imma型）', () => {
  const c = makeCtx();
  withCards(c, {
    // 宣言文は PDF の NO.203-204 だが uid は _q6/_q7（章ごとに番号が振り直されている）
    imma_ch05_q6: '<span class="qt-context"><span class="series-label">連問 1/2</span>' +
                  '次の文を読み、203 と204 の問いに答えよ。79 歳の女性。上腕から背中の痛み。</span>設問A',
  });
  const info = c._seriesInfoOf('imma_ch05_q6');
  assert.ok(info && info.key, '手掛かりを読めていない');
  // ラベル（連問 1/2）由来の範囲は uid の番号基準なので 6-7。宣言文の 203-204 を採ってはいけない
  assert.strictEqual(info.lo, 6, '宣言文の番号を uid の番号として信用した: ' + JSON.stringify(info));
  assert.strictEqual(info.hi, 7, JSON.stringify(info));
});

t('実データ全数：3つの書式から連問を復元できる（章をまたがず・番号は連番）', () => {
  const files = fs.readdirSync(ROOT).filter(f => /^questions_.*\.json$/.test(f));
  assert.ok(files.length >= 20, '科目データが見つからない: ' + files.length);
  let groups = 0, cards = 0, pulledIn = 0;
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    const qtByUid = {}, uids = [];
    (data.chapters || []).forEach(ch => (ch.qs || []).forEach(q => {
      if (!q.uid || !/^(.*_ch\d+)_q(\d+)$/.test(q.uid)) return;
      qtByUid[q.uid] = q.qt || ''; uids.push(q.uid);
    }));
    if (!uids.length) return;
    const c = withCards(makeCtx(), qtByUid);
    const keyOf = c._seriesGroupsOf(uids);
    const byKey = new Map();
    keyOf.forEach((k, u) => { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(u); });
    byKey.forEach((list, k) => {
      groups++; cards += list.length;
      assert.ok(list.length >= 2 && list.length <= 6,
        f + ' の群 ' + k + ' が ' + list.length + '問（1問だけ＝兄弟を取り落としている）: ' + list);
      const seqs = list.map(_seq).sort((a, b) => a.n - b.n);
      assert.strictEqual(new Set(seqs.map(s => s.ch)).size, 1, f + ' の群が章をまたいだ: ' + list);
      seqs.forEach((s, i) => assert.strictEqual(s.n, seqs[0].n + i,
        f + ' の群の番号が連番でない: ' + list));
    });
    // ③ 手掛かりを持たない兄弟（産婦人科の要約だけの2問目）を番号で拾えているか
    uids.forEach(u => { if (keyOf.has(u) && !c._seriesInfoOf(u)) pulledIn++; });
  });
  assert.ok(groups >= 250, '復元できた群が少なすぎる（書式の取りこぼし）: ' + groups);
  assert.ok(cards >= 600, '復元できた問題が少なすぎる: ' + cards);
  assert.ok(pulledIn >= 10, '手掛かりの無い兄弟を番号で拾えていない（産婦人科式）: ' + pulledIn);
});

console.log(`\n${fail ? 'FAILED' : 'all passed'}  (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
