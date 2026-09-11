/**
 * 🕸 実力の輪郭（ハブの8軸レーダー）— 集計・幾何・ゴーストの検証
 * Run: node _work/test_hub_radar.js
 *
 * 実ソース（index.html のインライン JS）を切り出して回す＝ロジックを二重に持たない。
 * ⚠️ RADAR_AXES / _radarStats / _radarSnapshot / _radarPt / _radarGapCls の名前を変えると
 *    ここも直す必要がある。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const html = R('index.html');

const i0 = html.indexOf('// ── 🕸 実力の輪郭');
const i1 = html.indexOf('function renderHero() {');
assert.ok(i0 > 0 && i1 > i0, 'レーダーのブロックが index.html に見つからない');
const src = html.slice(i0, i1);          // レーダー ＋ 所見（_noteSid 等を使うので両方入れる）

let store = {};
const sandbox = {
  console, JSON, Math, Object, Array, String, Number, Date,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
  document: { getElementById: () => null, addEventListener: () => {}, querySelectorAll: () => [] },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(R('mindmap_data/index.js'), sandbox);
vm.runInContext(R('chapters_meta.js'), sandbox);
vm.runInContext(R('attempts.js'), sandbox);
vm.runInContext(R('rate_index.js'), sandbox);
vm.runInContext(
  "function _jstDay(ms){return new Date(ms+9*3600000).toISOString().slice(0,10);}\n" +
  "function _fmtN(n){return (n||0).toLocaleString('ja-JP');}\n", sandbox);
vm.runInContext(src, sandbox);

const S = sandbox;
const K = n => vm.runInContext(n, sandbox);
const AXES = K('RADAR_AXES'), MIN_N = K('RADAR_MIN_N'), SNAP_KEY = K('RADAR_SNAP_KEY');
const CX = K('RADAR_CX'), CY = K('RADAR_CY'), RR = K('RADAR_R');
const RATE = S.window.MEC_RATE;

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; console.log('  ok  - ' + m); };
const jst = ms => new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
const ax = id => S._radarStats().axes.filter(a => a.id === id)[0];

console.log('── 🕸 実力の輪郭（ハブ）検証 ──');

// ── 1. 軸の定義 ──────────────────────────────────────────────
assert.strictEqual(AXES.length, 8, '8軸');
{
  const seen = new Set();
  AXES.forEach(a => {
    assert.ok(a.id && a.label && a.full && a.sids.length, '軸の要素が揃っている: ' + a.id);
    assert.ok(a.label.length <= 6, 'チャート上のラベルは短く保つ（切れの原因）: ' + a.label);
    a.sids.forEach(s => { assert.ok(!seen.has(s), '科目が2つの軸に属していない: ' + s); seen.add(s); });
  });
  ok(true, '8軸・ラベルは6文字以内・科目の重複なし');

  // mindmap_data/index.js（＝gamify.js の SUBJECTS）にある科目を取りこぼしていないか。
  // ⚠️ 科目を足したら RADAR_AXES にも入れること。どの軸にも入らない科目は黙って落ちる。
  const known = new Set(S.window.MM_SUBJECTS.map(x => x.sid));
  // 模試・必修講座は回ごと／横断で臓器別の軸に載らない（意図的な除外）
  ['m121s', 'hisshu'].forEach(x => known.delete(x));
  const missing = [...known].filter(s => !seen.has(s));
  assert.deepStrictEqual(missing, [], '軸に入っていない科目: ' + missing.join(','));
  ok(true, '模試・必修講座を除く全科目がどれかの軸に属している');
}

// ── 2. 全国正答率の索引 ──────────────────────────────────────
{
  assert.ok(RATE && Object.keys(RATE).length > 8000, 'MEC_RATE の件数: ' + Object.keys(RATE).length);
  // 旧 rate_index.js はコア12科目だけだった。全科目を持っていることを見張る
  ['ph_ch01_q1', 'psy_ch01_q1', 'ortho_ch01_q1', 'kansen_ch01_q1', 'kakumon_116A_q1']
    .forEach(u => assert.ok(typeof RATE[u] === 'number', '索引に無い: ' + u));
  Object.keys(RATE).slice(0, 200).forEach(u => {
    const v = RATE[u];
    assert.ok(v >= 0 && v <= 100 && v === Math.round(v), '0-100の整数: ' + u + '=' + v);
  });
  ok(true, 'window.MEC_RATE が全科目＋過去問を uid 単位で持つ（' + Object.keys(RATE).length + '件）');
}

// ── 3. 集計（自分 vs 同じ問題の全国）──────────────────────────
{
  // 循環器の40問を「全国より10pt 高い」正答率で解いたことにする
  const uids = Object.keys(RATE).filter(u => u.startsWith('circ_ch')).slice(0, 40);
  const mr = {};
  let natSum = 0, corr = 0, tot = 0;
  uids.forEach(u => {
    const t = 4, target = Math.min(100, RATE[u] + 10);
    const c = Math.round(t * target / 100);
    mr[u] = { correct: c, total: t };
    natSum += RATE[u] * t; corr += c; tot += t;
  });
  store = { myrate_v1: JSON.stringify(mr) };
  const a = ax('cr');
  assert.strictEqual(a.t, tot, '受験回数は myrate の total の合計');
  assert.strictEqual(a.c, corr);
  assert.ok(Math.abs(a.nat - natSum / tot) < 1e-9, '全国は「その uid を解いた回数」で重み付けした平均');
  assert.ok(Math.abs(a.gap - (a.self - a.nat)) < 1e-9, 'gap は自分 − 全国');
  assert.ok(a.gap > 8 && a.gap < 12, '仕込んだ +10pt 付近: ' + a.gap.toFixed(1));
  ok(true, '自分と全国を同じ uid どうしで比べる（科目平均で代用していない）');
  assert.strictEqual(a.measured, true, MIN_N + '問以上なので測定済み');
}

// ── 4. 最低件数に満たない軸は「未測定」──────────────────────
{
  const uids = Object.keys(RATE).filter(u => u.startsWith('neur_ch')).slice(0, 3);
  const mr = {};
  uids.forEach(u => { mr[u] = { correct: 1, total: 1 }; });
  store = { myrate_v1: JSON.stringify(mr) };
  const a = ax('ne');
  assert.strictEqual(a.t, 3);
  assert.strictEqual(a.measured, false, MIN_N + '問未満は未測定');
  ok(true, RADARMINLABEL() + '問未満の軸は measured=false（測れたふりをしない）');
}
function RADARMINLABEL() { return MIN_N; }

// ── 5. 軸に載らない解答は outside へ回す ────────────────────
{
  // 過去問・模試・必修講座・自作には科目が付かない（過去問1,825問に科目バッジが1つも無い）
  store = { myrate_v1: JSON.stringify({
    'kakumon_116A_q1': { correct: 1, total: 3 },
    'm121s_ch01_q1':   { correct: 1, total: 2 },
    'custom_q1':       { correct: 1, total: 1 },
    'circ_ch01_q1':    { correct: 1, total: 2 },
  }) };
  const st = S._radarStats();
  assert.strictEqual(st.outside, 6, '軸に載らないぶん: ' + st.outside);
  assert.strictEqual(st.covered, 2, '軸に載るぶん: ' + st.covered);
  ok(true, '過去問・模試・自作は軸に載せず outside として数える（脚に出す材料）');
}

// ── 6. 全国正答率を持たない問題は noRate へ ─────────────────
{
  store = { myrate_v1: JSON.stringify({ 'circ_ch99_q999': { correct: 1, total: 5 } }) };
  const st = S._radarStats();
  assert.strictEqual(st.noRate, 5);
  assert.strictEqual(st.covered, 0, '全国正答率が無い問題は比較に使わない');
  ok(true, '全国正答率を持たない問題は比べずに noRate へ逃がす');
}

// ── 7. いちばん下回っている科目を軸ごとに拾う ────────────────
{
  const mk = (pre, d, n) => {
    const out = {};
    Object.keys(RATE).filter(u => u.startsWith(pre)).slice(0, n).forEach(u => {
      const t = 4, c = Math.round(t * Math.max(0, Math.min(100, RATE[u] + d)) / 100);
      out[u] = { correct: c, total: t };
    });
    return out;
  };
  store = { myrate_v1: JSON.stringify(Object.assign(mk('circ_ch', +8, 20), mk('resp_ch', -20, 20))) };
  const a = ax('cr');
  assert.strictEqual(a.worst.sid, 'resp', '下回っている方: ' + (a.worst && a.worst.sid));
  assert.ok(a.worst.gap < -10, 'その科目の差: ' + a.worst.gap.toFixed(1));
  ok(true, '軸の中でいちばん下回っている科目を拾う（リンク先になる）');
}

// ── 8. 幾何 ──────────────────────────────────────────────────
{
  const top = S._radarPt(0, 1);
  assert.ok(Math.abs(top[0] - CX) < 1e-6 && Math.abs(top[1] - (CY - RR)) < 1e-6, '0番目の軸は真上');
  const c = S._radarPt(3, 0);
  assert.ok(Math.abs(c[0] - CX) < 1e-6 && Math.abs(c[1] - CY) < 1e-6, '0% は中心');
  // 8軸が等間隔・同じ半径
  const rs = AXES.map((_, i) => {
    const p = S._radarPt(i, 1);
    return Math.hypot(p[0] - CX, p[1] - CY);
  });
  rs.forEach(r => assert.ok(Math.abs(r - RR) < 1e-6, '外周は同じ半径'));
  // 1 を超える値は外周で頭打ち（130% で盤面からはみ出さない）
  const over = S._radarPt(0, 1.3);
  assert.ok(Math.abs(Math.hypot(over[0] - CX, over[1] - CY) - RR) < 1e-6, '1 を超えても外周で止まる');
  ok(true, '8軸は等間隔・同半径、0%は中心、100%超は外周で頭打ち');

  // ラベル用の余白が viewBox にあること（旧レーダーはここが無くて文字が切れた）
  const m = /id="radarSvg" viewBox="0 0 (\d+) (\d+)"/.exec(html);
  assert.ok(m, 'radarSvg の viewBox が読めない');
  const vw = +m[1], vh = +m[2];
  assert.ok(CX + RR + 40 <= vw, '右にラベルの余白がある: ' + (vw - CX - RR));
  assert.ok(CX - RR - 40 >= 0, '左にラベルの余白がある: ' + (CX - RR));
  assert.ok(CY + RR + 20 <= vh, '下にラベルの余白がある: ' + (vh - CY - RR));
  assert.ok(CY - RR - 12 >= 0, '上にラベルの余白がある: ' + (CY - RR));
  ok(true, 'viewBox にラベルぶんの余白がある（旧レーダーの文字切れの再発を防ぐ）');
}

// ── 9. 差の色分け（弱点カルテと同じ帯）──────────────────────
{
  assert.strictEqual(S._radarGapCls(0), 'n0');
  assert.strictEqual(S._radarGapCls(4.9), 'n0');
  assert.strictEqual(S._radarGapCls(-4.9), 'n0', '±5pt 以内は無彩色');
  assert.strictEqual(S._radarGapCls(5), 'u1');
  assert.strictEqual(S._radarGapCls(12), 'u2');
  assert.strictEqual(S._radarGapCls(-5), 'd1');
  assert.strictEqual(S._radarGapCls(-12), 'd2');
  ok(true, '±5pt 以内は無彩色・上回り青2段・下回り琥珀2段（カルテと同じ帯）');

  // ⚠️ 意味を持つ色はテーマに振らないこと
  const themed = /html\.ui-\w+ \.rd-dot/.test(html);
  assert.ok(!themed, '頂点の色（上回り／下回り）がテーマ別に上書きされていない');
  ok(true, '上回り／下回りの色はテーマで変えない（意味を持つ色だから）');
}

// ── 10. ゴースト（30日前の自分）────────────────────────────
{
  const uids = Object.keys(RATE).filter(u => u.startsWith('circ_ch')).slice(0, 30);
  const mr = {};
  uids.forEach(u => { mr[u] = { correct: 3, total: 4 }; });
  store = { myrate_v1: JSON.stringify(mr) };

  // 初日: 履歴が無いのでゴーストは出ない。同時にその日のスナップショットが書かれる
  let st = S._radarStats();
  assert.strictEqual(S._radarSnapshot(st), null, '履歴が無い日はゴーストを描かない');
  const today = jst(Date.now());
  assert.ok(JSON.parse(store[SNAP_KEY])[today], '今日のスナップショットが書かれた');
  ok(true, '初回はゴーストなし（自分自身を重ねない）・当日のスナップショットは残す');

  // 30日前の履歴を仕込むとゴーストが出る
  const snap = JSON.parse(store[SNAP_KEY]);
  const d30 = jst(Date.now() - 30 * 86400000);
  snap[d30] = { cr: [120, 60, 120 * 70] };          // 30日前は 50%
  store[SNAP_KEY] = JSON.stringify(snap);
  const gh = S._radarSnapshot(S._radarStats());
  assert.ok(gh && gh.ax.cr, 'ゴーストが返る');
  assert.strictEqual(gh.age, 30);
  assert.ok(Math.abs(gh.ax.cr.self - 50) < 1e-9, '30日前の自分は50%: ' + gh.ax.cr.self);
  ok(true, '30日前のスナップショットをゴーストとして返す');

  // 近すぎる履歴はゴーストにしない
  store[SNAP_KEY] = JSON.stringify({ [jst(Date.now() - 3 * 86400000)]: { cr: [120, 60, 120 * 70] } });
  assert.strictEqual(S._radarSnapshot(S._radarStats()), null, '3日前は近すぎる');
  ok(true, '近すぎる履歴はゴーストにしない（' + K('RADAR_GHOST_DAYS') + '±' + K('RADAR_GHOST_TOL') + '日）');

  // 最低件数に満たない軸はゴーストにも出さない
  store[SNAP_KEY] = JSON.stringify({ [jst(Date.now() - 30 * 86400000)]: { cr: [3, 1, 3 * 70] } });
  assert.strictEqual(S._radarSnapshot(S._radarStats()), null, '薄い履歴はゴーストにしない');
  ok(true, '受験が薄い軸は過去のぶんもゴーストに出さない');

  // 100日より古い履歴は捨てる
  store = { myrate_v1: JSON.stringify(mr) };
  store[SNAP_KEY] = JSON.stringify({ [jst(Date.now() - 200 * 86400000)]: { cr: [50, 25, 50 * 70] } });
  S._radarSnapshot(S._radarStats());
  assert.deepStrictEqual(Object.keys(JSON.parse(store[SNAP_KEY])), [today], '古い履歴を捨てた');
  ok(true, '100日より古いスナップショットは捨てる');
}

// ── 11. 配線と不変条件（index.html 側）──────────────────────
{
  assert.ok(/<script src="rate_index\.js"><\/script>/.test(html), 'ハブが rate_index.js を読み込む');
  assert.ok(!html.includes('<script src="qmeta.json"'), 'qmeta.json は読み込まない');
  assert.ok(html.includes('_renderHubRadar();'), 'renderHero からレーダーを描く');
  assert.ok(html.includes('id="radarReadout"') && html.includes('id="radarFoot"'),
    '読み取り行と脚が常設されている');
  // ⚠️ 未測定の軸を 0 に落とすと「実力ゼロ」に見える。中立値へ置いていること
  assert.ok(html.includes('const natMid =') && html.includes('a.measured ? a.self : natMid'),
    '未測定の軸は中立値へ置く（0 に落とさない）');
  // ⚠️ スナップショットは端末ローカル
  assert.ok(!R('progress.js').includes('mec_radar_snap_v1'),
    'スナップショットが同期対象に入っていない');
  ok(true, '配線・軽さ・未測定の扱い・同期対象外');

  // sw.js の SHELL に索引が入っていること（オフラインでレーダーが白紙にならない）
  assert.ok(R('sw.js').includes('"./rate_index.js"'), 'sw.js の SHELL に rate_index.js がある');
  ok(true, 'sw.js の SHELL に全国正答率の索引が入っている');
}

// ── 12. 索引が現物と一致しているか ──────────────────────────
{
  const { execFileSync } = require('child_process');
  const out = execFileSync(process.execPath,
    [path.join(__dirname, 'build_natrate_index.js'), '--check'],
    { encoding: 'utf8', cwd: path.join(__dirname, '..') });
  assert.ok(/OK: 現物と一致/.test(out), 'rate_index.js が questions_*.json と食い違っている:\n' + out);
  ok(true, 'rate_index.js が現行データから作り直した内容と一致している');
}

console.log('\nALL PASS (' + pass + ' 項目)\n');
