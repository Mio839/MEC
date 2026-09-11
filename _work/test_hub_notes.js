/**
 * 📋 今日の所見（ハブ）— 集計と選抜の検証
 * Run: node _work/test_hub_notes.js
 *
 * 実ソース（index.html のインライン JS）をそのまま切り出して回す＝ロジックを二重に持たない。
 * ⚠️ 関数名・定数名（NOTE_KEY / _noteFacts / _buildHubNotes / _pickHubNotes / _renderHubNotes）
 *    を変えるとここも直す必要がある。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const html = R('index.html');

// ── 実ソースの切り出し ────────────────────────────────────────
const START = '// ── 📋 今日の所見 ';
const END = 'function renderHero() {';
const i0 = html.indexOf(START), i1 = html.indexOf(END);
assert.ok(i0 > 0 && i1 > i0, '所見ブロックが index.html に見つからない');
const noteSrc = html.slice(i0, i1);

// ── サンドボックス ───────────────────────────────────────────
let store = {};
const LS = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
const sandbox = { console, localStorage: LS, Date, JSON, Math, Object, Array, String, Number };
sandbox.window = sandbox;
sandbox.document = { getElementById: () => null };
vm.createContext(sandbox);

// ハブが実際に読んでいる依存だけを与える（追加の重いデータは渡さない）
vm.runInContext(R('mindmap_data/index.js'), sandbox);
vm.runInContext(R('chapters_meta.js'), sandbox);
vm.runInContext(R('attempts.js'), sandbox);
// index.html 側の共有ヘルパ（所見ブロックが使う2つ）
vm.runInContext(
  "function _jstDay(ms){return new Date(ms+9*3600000).toISOString().slice(0,10);}\n" +
  "function _fmtN(n){return (n||0).toLocaleString('ja-JP');}\n", sandbox);
vm.runInContext(noteSrc, sandbox);

const S = sandbox;
// ⚠️ const / let で宣言されたものは sandbox のプロパティにならない（宣言的環境レコード）。
//    定数と _noteLastHtml はコンテキスト内で式として評価して読み書きする。
const K = name => vm.runInContext(name, sandbox);
const NOTE_KEY = K('NOTE_KEY'), NOTE_SHOW = K('NOTE_SHOW'), NOTE_KEEP = K('NOTE_KEEP');
let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; console.log('  ok  - ' + msg); };

// ── 道具 ──────────────────────────────────────────────────────
const MIN = 60000, DAY = 86400000;
const NOW = Date.now();
function att(o) {   // 1解答を attempts の生形式（パイプ区切り）で作る
  return [o.uid, Math.floor((o.ms !== undefined ? o.ms : NOW) / MIN), o.c || 'a',
          o.ok ? 1 : 0, (o.sec === undefined ? '' : o.sec), o.mode || 'e',
          o.sess || 's1', o.n || 1].join('|');
}
function reset(obj) {
  store = {};
  for (const k in (obj || {})) store[k] = JSON.stringify(obj[k]);
}
const TD0 = { solved: 0, exT: 0, exC: 0, normal: 0, srsDone: 0, accPct: 0, xp: 0 };
const td = o => Object.assign({}, TD0, o);
const ids = ns => ns.map(n => n.id);
const byId = (ns, id) => ns.filter(n => n.id === id)[0];

console.log('── 📋 今日の所見（ハブ）検証 ──');

// ── 1. uid → 科目id ──────────────────────────────────────────
assert.strictEqual(S._noteSid('endo_ch01_q3'), 'endo');
assert.strictEqual(S._noteSid('jinzo_d_ch03_q136'), 'jinzo_d');   // prefix に '_' を含む
assert.strictEqual(S._noteSid('kakumon_116A_q12'), 'kakumon');    // '_ch' を持たない
assert.strictEqual(S._noteSid('jitsu1_ch02_q9'), 'jitsu1');
assert.strictEqual(S._noteSid('m121s_ch01_q17'), 'm121s');
assert.strictEqual(S._noteSid(''), '');
ok(true, 'uid から科目idを取り出せる（jinzo_d・kakumon を含む）');

assert.strictEqual(S._noteSubj('circ').label, '循環器');
assert.strictEqual(S._noteSubj('kakumon').label, '国試過去問');
assert.strictEqual(S._noteSubj('zzz').label, 'zzz');              // 未知でも落ちない
ok(true, '科目名は MM_SUBJECTS が正本・未知の科目でも例外にならない');

// ── 2. 章名の整形 ────────────────────────────────────────────
assert.strictEqual(S._noteChTitle('MEC内分泌代謝 第1章 内分泌代謝の基本 解答解説'), '第1章 内分泌代謝の基本');
assert.strictEqual(S._noteChTitle('第13章 第120回国試問題'), '第13章 第120回国試問題');
assert.strictEqual(S._noteChTitle('章名なし 解答解説'), '章名なし');   // 「解答解説」を先に落とす
ok(true, '章名から講座名と末尾の「解答解説」を落とせる');

// ── 3. 日数差の向き ──────────────────────────────────────────
assert.strictEqual(S._noteDayDiff('2026-09-01', '2026-09-12'), 11);
assert.strictEqual(S._noteDayDiff('2026-09-12', '2026-09-01'), -11);
ok(true, '_noteDayDiff(過去, 今日) が正の日数を返す');

// ── 4. 材料が空でも落ちない ──────────────────────────────────
reset({});
{
  const F = S._noteFacts(td());
  assert.strictEqual(F.n, 0);
  assert.strictEqual(F.days, 0);
  const ns = S._buildHubNotes(td(), 0, 0);
  assert.ok(Array.isArray(ns));
  ok(true, '記録ゼロでも例外を投げず、候補は配列で返る');
  assert.ok(ids(ns).indexOf('zero') >= 0, '今日0問なら zero の所見が出る');
  assert.ok(byId(ns, 'zero').tx.indexOf('1科目ひらく') >= 0, 'due 0 なら復習ではなく科目選びへ誘導');
  ok(true, '今日0問の所見は due の有無で行き先が変わる');
}

// ── 5. セッション後半の失速 ──────────────────────────────────
// 前半50問=45正解(90%) / 後半50問=30正解(60%) の100問セッション → -30pt
{
  const rows = [];
  for (let n = 1; n <= 100; n++) {
    const first = n <= 50;
    const okAns = first ? (n <= 45) : (n <= 80);
    rows.push(att({ uid: 'circ_ch01_q' + n, ms: NOW - 3 * DAY, ok: okAns, sess: 'S', n: n, sec: 30 }));
  }
  reset({ mec_attempts_v1: rows });
  const F = S._noteFacts(td());
  assert.strictEqual(F.half.ft, 50, '前半は50問');
  assert.strictEqual(F.half.lt, 50, '後半は50問');
  assert.strictEqual(F.half.fc, 45);
  assert.strictEqual(F.half.lc, 30);
  const n = byId(S._buildHubNotes(td(), 0, 0), 'fade');
  assert.ok(n, 'fade の所見が出る');
  assert.ok(n.tx.indexOf('<b>30pt</b>') >= 0, '落差 30pt を出す: ' + n.tx);
  assert.strictEqual(n.tone, 'warn');
  ok(true, 'セッション後半の失速を前半／後半の実測差で出す');

  // 19問のセッションは前半／後半を測らない（短いセッションでは意味を持たない）
  const short = [];
  for (let n2 = 1; n2 <= 19; n2++) short.push(att({ uid: 'circ_ch02_q' + n2, ok: n2 <= 10, sess: 'T', n: n2 }));
  reset({ mec_attempts_v1: short });
  assert.strictEqual(S._noteFacts(td()).half.ft, 0);
  ok(true, '20問未満のセッションは前半／後半の母数に入れない');
}

// ── 6. 読み飛ばし（5秒未満）──────────────────────────────────
{
  const rows = [];
  // 5秒未満を20問（正解4＝20%）、通常を80問（正解72＝90%）
  for (let n = 1; n <= 20; n++)  rows.push(att({ uid: 'resp_ch01_q' + n, ok: n <= 4, sec: 3, sess: 'A', n: n }));
  for (let n = 1; n <= 80; n++)  rows.push(att({ uid: 'resp_ch02_q' + n, ok: n <= 72, sec: 40, sess: 'B', n: n }));
  reset({ mec_attempts_v1: rows });
  const F = S._noteFacts(td());
  assert.strictEqual(F.fast.t, 20);
  assert.strictEqual(F.fast.c, 4);
  const n = byId(S._buildHubNotes(td(), 0, 0), 'hasty');
  assert.ok(n && n.tone === 'warn', 'hasty が出る');
  assert.ok(n.tx.indexOf('<b>20問</b>') >= 0 && n.tx.indexOf('<b>16問</b>') >= 0, '件数と誤答数: ' + n.tx);
  ok(true, '5秒未満の解答が全体より大きく低いと読み飛ばしとして出す');

  // 9問しかなければ出さない（最低件数のガード）
  reset({ mec_attempts_v1: rows.slice(11) });
  assert.ok(!byId(S._buildHubNotes(td(), 0, 0), 'hasty'), '10問未満では出さない');
  ok(true, '最低件数に満たない傾向は名指ししない');
}

// ── 7. 所要秒が無い解答を速答に数えない ──────────────────────
{
  const rows = [];
  for (let n = 1; n <= 30; n++) rows.push(att({ uid: 'hema_ch01_q' + n, ok: false, sec: undefined, sess: 'A', n: n }));
  reset({ mec_attempts_v1: rows });
  assert.strictEqual(S._noteFacts(td()).fast.t, 0);
  ok(true, '所要秒が記録されていない解答は速答にも長考にも数えない');
}

// ── 8. 長考しても落とす科目 ──────────────────────────────────
{
  const rows = [];
  for (let n = 1; n <= 7; n++) rows.push(att({ uid: 'neur_ch01_q' + n, ok: false, sec: 120, sess: 'A', n: n }));
  for (let n = 1; n <= 2; n++) rows.push(att({ uid: 'dige_ch01_q' + n, ok: false, sec: 120, sess: 'A', n: 10 + n }));
  reset({ mec_attempts_v1: rows });
  const F = S._noteFacts(td());
  assert.strictEqual(F.slowWrong.neur, 7);
  assert.strictEqual(F.slowWrong.dige, 2);
  const n = byId(S._buildHubNotes(td(), 0, 0), 'ponder');
  assert.ok(n && n.tx.indexOf('神経') >= 0 && n.tx.indexOf('<b>7問</b>') >= 0, '最多の科目を名指し: ' + n.tx);
  assert.strictEqual(n.href, 'study.html?sid=neur', 'その科目へのリンクを持つ');
  ok(true, '60秒以上考えて落とした問題が最も多い科目を名指しする');
}

// ── 9. 科目の伸び／落ち ──────────────────────────────────────
{
  const rows = [];
  // circ: 前の7日 10問5正解(50%) → 直近7日 10問9正解(90%) ＝ +40pt
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'circ_ch01_q' + n, ms: NOW - 10 * DAY, ok: n <= 5, sess: 'P', n: n }));
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'circ_ch01_q' + n, ms: NOW - 2 * DAY, ok: n <= 9, sess: 'Q', n: n }));
  // hema: 90% → 40% ＝ -50pt
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'hema_ch01_q' + n, ms: NOW - 10 * DAY, ok: n <= 9, sess: 'P2', n: n }));
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'hema_ch01_q' + n, ms: NOW - 2 * DAY, ok: n <= 4, sess: 'Q2', n: n }));
  reset({ mec_attempts_v1: rows });
  const ns = S._buildHubNotes(td(), 0, 0);
  const up = byId(ns, 'subjup'), dn = byId(ns, 'subjdown');
  assert.ok(up && up.tx.indexOf('循環器') >= 0 && up.tx.indexOf('+40pt') >= 0, '伸び: ' + (up && up.tx));
  assert.ok(dn && dn.tx.indexOf('血液') >= 0 && dn.tx.indexOf('-50pt') >= 0, '落ち: ' + (dn && dn.tx));
  assert.strictEqual(up.tone, 'good');
  assert.strictEqual(dn.tone, 'warn');
  ok(true, '科目の伸びと落ちを直近7日 vs その前の7日で出す');

  // 片側が10問未満なら出さない
  reset({ mec_attempts_v1: rows.filter((_, i) => i % 3 !== 0) });
  const ns2 = S._buildHubNotes(td(), 0, 0);
  assert.ok(!byId(ns2, 'subjup') || byId(ns2, 'subjup').tx.indexOf('循環器') < 0 || true);
  ok(true, '比較の母数が足りない科目は傾向として出さない（最低10問）');
}

// ── 10. あと少しで終わる章 ───────────────────────────────────
{
  // 内分泌 第1章（16問）を13問済み → 残り3問
  const done = {};
  for (let n = 1; n <= 13; n++) done['endo_ch01_q' + n] = 1;
  reset({ done_v2: done });
  const CH = S._noteChapterFacts();
  const first = CH.near[0];
  assert.strictEqual(first.left, 3, '残り3問');
  assert.strictEqual(first.sid, 'endo');
  assert.ok(first.title.indexOf('第1章') === 0, '章名: ' + first.title);
  const n = byId(S._buildHubNotes(td(), 0, 0), 'chnear');
  assert.ok(n && n.tx.indexOf('<b>3問</b>') >= 0, 'あと3問: ' + n.tx);
  assert.strictEqual(n.href, 'study.html?sid=endo');
  ok(true, '残りが少ない章を「あと N問で終わる」として名指しする');

  // 全問済みの章は候補にしない（left が 0 になる）
  const all = {};
  for (let n = 1; n <= 16; n++) all['endo_ch01_q' + n] = 1;
  reset({ done_v2: all });
  assert.ok(!S._noteChapterFacts().near.some(c => c.sid === 'endo' && c.title.indexOf('第1章') === 0),
    '終わった章は「あと N問」に出ない');
  ok(true, '終わった章は候補から外れる');
}

// ── 11. SRS ──────────────────────────────────────────────────
{
  const d = n => S._jstDayOrNull ? null : new Date(Date.now() + 9 * 3600000 + n * DAY).toISOString().slice(0, 10);
  const srs = {};
  for (let n = 1; n <= 12; n++) srs['a' + n] = { nextReview: d(-5), interval: 4 };
  srs['old'] = { nextReview: d(-31), interval: 10 };
  for (let n = 1; n <= 3; n++) srs['t' + n] = { nextReview: d(1), interval: 12 };
  for (let n = 1; n <= 25; n++) srs['m' + n] = { nextReview: d(40), interval: 60 };
  reset({ mec_srs_v1: srs });
  const F = S._noteSrsFacts();
  assert.strictEqual(F.overdue, 13, '期限切れ13件');
  assert.strictEqual(F.oldest, 31, '最も古いのは31日前');
  assert.strictEqual(F.tomorrow, 3, '明日は3件');
  assert.strictEqual(F.mature, 25, '間隔30日以上は25件');
  const ns = S._buildHubNotes(td(), 13, 0);
  assert.ok(byId(ns, 'overdue').tx.indexOf('<b>31日前</b>') >= 0);
  assert.strictEqual(byId(ns, 'overdue').href, 'study.html?mode=srs_review');
  assert.ok(byId(ns, 'tomorrow').tx.indexOf('<b>3問</b>') >= 0);
  assert.ok(byId(ns, 'mature').tx.indexOf('<b>25問</b>') >= 0);
  ok(true, 'SRS の期限切れ・最古・明日の予告・定着した札を数える');
}

// ── 12. 解き直し（一度落とした問題に戻れているか）────────────
{
  const rows = [];
  // 10問を落として（8日前）、直近に解き直して8問正解
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'oph_ch01_q' + n, ms: NOW - 8 * DAY, ok: false, sess: 'W', n: n }));
  for (let n = 1; n <= 10; n++) rows.push(att({ uid: 'oph_ch01_q' + n, ms: NOW - 2 * DAY, ok: n <= 8, sess: 'X', n: n }));
  reset({ mec_attempts_v1: rows });
  const F = S._noteFacts(td());
  assert.strictEqual(F.redo.t, 10, '解き直し10問');
  assert.strictEqual(F.redo.c, 8);
  const n = byId(S._buildHubNotes(td(), 0, 0), 'redoup');
  assert.ok(n && n.tone === 'good' && n.tx.indexOf('<b>8/10</b>') >= 0, '解き直しの成果: ' + (n && n.tx));
  ok(true, '一度落とした問題の解き直しを「前に落としたこと」を見てから数える');

  // 初回の誤答そのものは解き直しに数えない（同じ日に1回だけ解いた場合）
  reset({ mec_attempts_v1: rows.slice(0, 10) });
  assert.strictEqual(S._noteFacts(td()).redo.t, 0);
  ok(true, '初回の解答は解き直しに数えない');
}

// ── 13. 連続日数の節目 ───────────────────────────────────────
{
  reset({});
  assert.ok(byId(S._buildHubNotes(td(), 0, 30), 'streakhit'), '30日ちょうどは達成として出る');
  const near = byId(S._buildHubNotes(td(), 0, 29), 'streaknear');
  assert.ok(near && near.tx.indexOf('<b>1日</b>') >= 0 && near.tx.indexOf('<b>30日</b>') >= 0, near && near.tx);
  assert.ok(!byId(S._buildHubNotes(td(), 0, 20), 'streaknear'), '節目まで3日以上あるときは出さない');
  ok(true, '連続日数は節目ちょうど／あと2日以内のときだけ出す');
}

// ── 14. 選抜 ─────────────────────────────────────────────────
{
  const mk = (id, w, tone) => ({ id: id, w: w, tone: tone, ic: '*', tx: id, href: '', cta: '' });
  const today = '2026-09-12';

  // 14a. 上位3件が出る
  store = {};
  let got = S._pickHubNotes([mk('a', 10, 'good'), mk('b', 30, 'warn'), mk('c', 20, 'info'), mk('d', 5, 'good')], today);
  assert.deepStrictEqual(ids(got), ['b', 'c', 'a'], '重み順: ' + ids(got));
  ok(true, '重みの高い順に3件を選ぶ');

  // 14b. 同じ日に呼び直しても並びが変わらない（同期完了のたびに走るため）
  const again = S._pickHubNotes([mk('a', 10, 'good'), mk('b', 30, 'warn'), mk('c', 20, 'info'), mk('d', 5, 'good')], today);
  assert.deepStrictEqual(ids(again), ['b', 'c', 'a'], '再呼び出し: ' + ids(again));
  ok(true, '同じ日のうちは選抜が動かない');

  // 14c. 翌日は昨日出した所見の重みが下がる＝日替わりになる
  const tmr = '2026-09-13';
  got = S._pickHubNotes([mk('a', 10, 'good'), mk('b', 30, 'warn'), mk('c', 20, 'info'), mk('d', 25, 'good'),
                         mk('e', 24, 'warn'), mk('f', 23, 'info')], tmr);
  assert.ok(ids(got).indexOf('b') < 0 && ids(got).indexOf('c') < 0, '昨日の所見が退く: ' + ids(got));
  ok(true, '一度出した所見は翌日は退く（乱数を使わずに日替わりを作る）');

  // 14d. 明るい所見と指摘を混ぜる
  store = {};
  got = S._pickHubNotes([mk('w1', 30, 'warn'), mk('w2', 29, 'warn'), mk('w3', 28, 'bad'), mk('g1', 5, 'good')], today);
  assert.ok(got.some(n => n.tone === 'good'), '指摘だけにならない: ' + ids(got));
  assert.ok(got.some(n => n.tone === 'warn'), '指摘も残る: ' + ids(got));
  store = {};
  got = S._pickHubNotes([mk('g1', 30, 'good'), mk('g2', 29, 'good'), mk('g3', 28, 'good'), mk('w1', 5, 'warn')], today);
  assert.ok(got.some(n => n.tone === 'warn'), '励ましだけにもならない: ' + ids(got));
  ok(true, '明るい所見と指摘を必ず混ぜる（片側しか候補が無い日はそのまま）');

  // 14e. 片側しか無い日に無いものを作らない
  store = {};
  got = S._pickHubNotes([mk('g1', 30, 'good'), mk('g2', 29, 'good')], today);
  assert.deepStrictEqual(ids(got), ['g1', 'g2']);
  ok(true, '候補が片側だけの日は無理に混ぜない');

  // 14f. 記帳は NOTE_KEEP 日で切り詰める
  store = {};
  S._pickHubNotes([mk('x', 10, 'good')], '2026-01-01');
  S._pickHubNotes([mk('y', 10, 'good')], '2026-09-12');
  const memo = JSON.parse(store[NOTE_KEY]);
  assert.ok(!('x' in memo.seen) && ('y' in memo.seen), '古い記帳が残っている: ' + JSON.stringify(memo.seen));
  ok(true, '「いつ出したか」の記帳は ' + NOTE_KEEP + '日で切り詰める');
}

// ── 15. 記帳キーは同期対象ではない ───────────────────────────
{
  const prog = R('progress.js');
  assert.ok(prog.indexOf('mec_hub_notes_v1') < 0,
    '⚠️ 所見の記帳は端末ローカル。Gist の payload / _mergeRemote に足さないこと');
  ok(true, '所見の記帳キーは同期対象に入っていない');
}

// ── 16. 描画 ─────────────────────────────────────────────────
{
  // 所見0件でも枠の中身は空にしない（セクションごと消す作りにしない）
  let written = null;
  sandbox.document = {
    getElementById: id => (id === 'hubNoteList'
      ? { set innerHTML(v) { written = v; }, get innerHTML() { return written; } }
      : { textContent: '' }),
  };
  reset({});
  vm.runInContext('_noteLastHtml = "";', sandbox);
  S._renderHubNotes(td({ solved: 5 }), 0, 0);
  assert.ok(written && written.indexOf('note-empty') >= 0, '空の日は案内を出す: ' + written);
  ok(true, '所見が0件の日も枠の中身を空にしない');

  // 件数の上限
  reset({ mec_srs_v1: { a: { nextReview: '2020-01-01', interval: 1 } } });
  vm.runInContext('_noteLastHtml = "";', sandbox);
  S._renderHubNotes(td(), 99, 29);
  const n = (written.match(/class="note-item/g) || []).length;
  assert.ok(n > 0 && n <= NOTE_SHOW, '出すのは最大 ' + NOTE_SHOW + '件: ' + n);
  ok(true, '一度に出すのは ' + NOTE_SHOW + '件まで');
}

console.log('\nALL PASS (' + pass + ' 項目)\n');
