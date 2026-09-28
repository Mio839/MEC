/**
 * 同じ国試問題の重複コピー（dup_index.js）と、新しく覚える問題の上限（MECSync.srsNewBudget）を
 * 実ソースで検証する。Run: node _work/test_srs_dups_newcap.js
 *
 * 守りたい不変条件:
 *   - dup_index.js は派生物で、questions_*.json から作り直すと現物と一致する
 *   - 組の全員が実在の uid で、自作・暗記メモ・実力試験Ⅰ・模試を含まない。代表は必修講座ではない（科目がある限り）
 *   - 組の中の SRS は「いちばん最近の復習」に揃う（読み込み時と同期のマージ後の両方）
 *   - 件数（ハブ・統計・ブリーフィング・復習キュー）は代表だけを数える
 *   - study.html の _updateSRS は組の全員へ同じ予定を写し、上限を超えた新規は正解・あやふやなら登録しない
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const read = f => f === 'index.html' ? require('./lib_hub_source')() : fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('  NG  - ' + name + '\n        ' + (e && e.message)); }
}

// ── dup_index.js を読む ──────────────────────────────────────────────
const dupWin = {};
vm.runInNewContext(read('dup_index.js'), { window: dupWin });
const GROUPS = dupWin.MEC_DUP_GROUPS;

// progress.js を vm で読む（_mergeRemote を露出させる）
function loadProgress(store) {
  const RAW = read('progress.js');
  const PATCHED = RAW.replace('window.MECSync = {', 'window.__mergeRemote = _mergeRemote;\n  window.MECSync = {');
  const ls = {
    getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  };
  const el = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, querySelector: () => null, querySelectorAll: () => [] });
  const win = { addEventListener() {}, MEC_DUP_GROUPS: GROUPS };
  const sb = {
    window: win, localStorage: ls, console, setTimeout, clearTimeout,
    document: { addEventListener() {}, createElement: el, head: { appendChild() {} }, body: { appendChild() {} }, querySelector: () => null, querySelectorAll: () => [], dispatchEvent: () => true, getElementById: () => null },
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState() {} },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
  };
  vm.createContext(sb);
  vm.runInContext(PATCHED, sb, { filename: 'progress.js' });
  return win;
}
const jstToday = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);

console.log('# dup_index.js');
t('派生物が questions_*.json と一致している（--check）', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'build_dup_index.js'), '--check'], { stdio: 'pipe' });
});
t('組が100以上あり、全員が2人以上', () => {
  assert.ok(Array.isArray(GROUPS) && GROUPS.length >= 100, 'groups=' + (GROUPS && GROUPS.length));
  GROUPS.forEach(g => assert.ok(g.length >= 2, JSON.stringify(g)));
});
t('全員が実在の uid・対象外の科目を含まない・同じ uid が2つの組に出ない', () => {
  const all = new Set();
  for (const f of fs.readdirSync(ROOT).filter(f => /^questions_.+\.json$/.test(f))) {
    const j = JSON.parse(read(f));
    (j.chapters || []).forEach(ch => (ch.qs || []).forEach(q => all.add(q.uid)));
  }
  const seen = new Set();
  GROUPS.forEach(g => g.forEach(u => {
    assert.ok(all.has(u), '存在しない uid: ' + u);
    assert.ok(!/^(custom|memo|jitsu1|m121s)_/.test(u), '対象外: ' + u);
    assert.ok(!seen.has(u), '2つの組に出る: ' + u);
    seen.add(u);
  }));
});
t('代表は必修講座ではない（組に科目がある限り）', () => {
  GROUPS.forEach(g => {
    const hasSubj = g.some(u => !/^hisshu2?_/.test(u));
    if (hasSubj) assert.ok(!/^hisshu2?_/.test(g[0]), JSON.stringify(g));
  });
});

console.log('# progress.js');
const [A, B] = GROUPS[0];
t('srsIsShadow: 代表は false・コピーは true・組に無い uid は false', () => {
  const w = loadProgress({});
  assert.strictEqual(w.MECSync.srsIsShadow(A), false);
  assert.strictEqual(w.MECSync.srsIsShadow(B), true);
  assert.strictEqual(w.MECSync.srsIsShadow('zzz_ch01_q1'), false);
});
t('読み込み時に、組の予定がいちばん最近の復習へ揃う（無い側にも写る）', () => {
  const srs = { [B]: { reps: 3, ef: 2.3, interval: 12, nextReview: '2026-10-01', lastSeen: '2026-09-19' } };
  const store = { mec_srs_v1: JSON.stringify(srs) };
  loadProgress(store);
  const out = JSON.parse(store.mec_srs_v1);
  assert.deepStrictEqual(out[A], out[B]);
  assert.strictEqual(out[A].interval, 12);
});
t('揃えるときは lastSeen の新しい方が勝つ', () => {
  const srs = {
    [A]: { reps: 1, interval: 1, nextReview: '2026-09-20', lastSeen: '2026-09-19' },
    [B]: { reps: 2, interval: 6, nextReview: '2026-09-30', lastSeen: '2026-09-24' },
  };
  const store = { mec_srs_v1: JSON.stringify(srs) };
  loadProgress(store);
  const out = JSON.parse(store.mec_srs_v1);
  assert.strictEqual(out[A].interval, 6);
  assert.strictEqual(out[B].interval, 6);
});
t('同期のマージ後にも揃う（旧版の端末が片方だけ更新して持ち込んだ場合）', () => {
  const store = { mec_srs_v1: JSON.stringify({ [A]: { reps: 1, interval: 1, nextReview: '2026-09-20', lastSeen: '2026-09-19' }, [B]: { reps: 1, interval: 1, nextReview: '2026-09-20', lastSeen: '2026-09-19' } }) };
  const w = loadProgress(store);
  w.__mergeRemote({ mec_srs_v1: { [B]: { reps: 2, interval: 6, nextReview: '2026-09-30', lastSeen: '2026-09-24' } } });
  const out = JSON.parse(store.mec_srs_v1);
  assert.strictEqual(out[A].interval, 6);
  assert.deepStrictEqual(out[A], out[B]);
});

t('srsNewBudget: 待ちが少ない日は上限いっぱい・多い日は下限・その間は直線', () => {
  const w = loadProgress({});
  const C = w.MECSync.NEW_CAP;
  const today = '2026-09-27';
  const mk = n => { const s = {}; for (let i = 0; i < n; i++) s['x_ch01_q' + i] = { nextReview: '2026-09-01' }; return s; };
  assert.strictEqual(w.MECSync.srsNewBudget(mk(0), today).cap, C.max);
  assert.strictEqual(w.MECSync.srsNewBudget(mk(C.lowDue), today).cap, C.max);
  assert.strictEqual(w.MECSync.srsNewBudget(mk(C.highDue), today).cap, C.min);
  assert.strictEqual(w.MECSync.srsNewBudget(mk(C.highDue * 3), today).cap, C.min);
  const mid = w.MECSync.srsNewBudget(mk((C.lowDue + C.highDue) / 2), today).cap;
  assert.strictEqual(mid, Math.round((C.max + C.min) / 2));
});
t('srsNewBudget: 新規は born＝今日の数・重複コピーの影は数えない', () => {
  const w = loadProgress({});
  const today = '2026-09-27';
  const s = {
    'x_ch01_q1': { born: today, nextReview: '2026-09-28' },
    'x_ch01_q2': { born: '2026-09-26', nextReview: '2026-09-28' },
    'x_ch01_q3': { nextReview: '2026-09-28' },
    [A]: { born: today, nextReview: '2026-09-20' },
    [B]: { born: today, nextReview: '2026-09-20' },
  };
  const b = w.MECSync.srsNewBudget(s, today);
  assert.strictEqual(b.newToday, 2);
  assert.strictEqual(b.due, 1);
  assert.strictEqual(b.left, b.cap - 2);
});

console.log('# study.html の _updateSRS');
const HTML = read('study.html');
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
const grabConst = (src, name) => new RegExp('^const ' + name + ' = .*;$', 'm').exec(src)[0];
function studyCtx(srsInit, budget) {
  const notes = [];
  const w = loadProgress({});
  const ctx = {
    _srsData: srsInit, _saveSRS() {}, _markGradeOn() {}, _mecNotify: m => notes.push(m),
    localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; })(),
    document: { querySelectorAll: () => [] }, Math, Date, JSON, console,
  };
  ctx.window = ctx;
  ctx.MECSync = Object.assign({}, w.MECSync, budget ? { srsNewBudget: () => budget } : {});
  vm.createContext(ctx);
  vm.runInContext([
    grabConst(HTML, 'SRS_FUZZ_PCT'), grabConst(HTML, 'SRS_EXAM_FRACTION'),
    grabFn(HTML, '_today'), grabFn(HTML, '_addDays'), grabFn(HTML, '_daysDiff'),
    grabFn(HTML, '_srsExamCap'), grabFn(HTML, '_srsFuzz'), grabFn(HTML, '_noteNewCapHit'), grabFn(HTML, '_updateSRS'),
  ].join('\n'), ctx);
  ctx.notes = notes;
  return ctx;
}
t('解くと組の全員へ同じ予定が写る', () => {
  const c = studyCtx({}, { cap: 100, newToday: 0, due: 0, left: 100 });
  c._updateSRS(B, 'ok');
  assert.ok(c._srsData[A] && c._srsData[B]);
  assert.strictEqual(JSON.stringify(c._srsData[A]), JSON.stringify(c._srsData[B]));
});
t('新規には born（初めて登録した日）が付く', () => {
  const c = studyCtx({}, { cap: 100, newToday: 0, due: 0, left: 100 });
  c._updateSRS('x_ch01_q9', 'ok');
  assert.strictEqual(c._srsData['x_ch01_q9'].born, jstToday());
});
t('上限に達した日の新規は、正解・あやふやなら登録しない（知らせは出す）', () => {
  const c = studyCtx({}, { cap: 20, newToday: 20, due: 3000, left: 0 });
  c._updateSRS('x_ch01_q9', 'ok');
  c._updateSRS('x_ch01_q8', 'mid');
  c._updateSRS('x_ch01_q7', true);
  assert.strictEqual(c._srsData['x_ch01_q9'], undefined);
  assert.strictEqual(c._srsData['x_ch01_q8'], undefined);
  assert.strictEqual(c._srsData['x_ch01_q7'], undefined);
  assert.strictEqual(c.notes.length, 1, '知らせは1日1回だけのはずが ' + c.notes.length);
});
t('上限に達していても誤答の新規は登録する', () => {
  const c = studyCtx({}, { cap: 20, newToday: 20, due: 3000, left: 0 });
  c._updateSRS('x_ch01_q9', 'ng');
  c._updateSRS('x_ch01_q8', false);
  assert.ok(c._srsData['x_ch01_q9'] && c._srsData['x_ch01_q8']);
});
t('上限に達していても、既に登録済みの問題の復習は止めない', () => {
  const c = studyCtx({ 'x_ch01_q9': { reps: 1, ef: 2.5, interval: 1, nextReview: '2026-09-01', lastSeen: '2026-08-31' } },
    { cap: 20, newToday: 20, due: 3000, left: 0 });
  c._updateSRS('x_ch01_q9', 'ok');
  assert.ok(c._srsData['x_ch01_q9'].reps === 2);
});

console.log('# 件数の数え方（全ページが代表だけを数える）');
const SH = 'srsIsShadow';
t('study.html: 残り件数と復習キューが影を外す', () => {
  const body1 = grabFn(HTML, 'startSRSReview');
  assert.ok(/_srsShadow\(uid\)/.test(body1), 'startSRSReview');
  assert.ok(/_srsDueRemaining[\s\S]{0,400}_srsShadow\(uid\)/.test(HTML), '_srsDueRemaining');
});
t('index.html: 件数・リスク内訳・所見が影を外す', () => {
  const idx = require('./lib_hub_source')();
  ['getSRSDueCount', 'getSrsRiskBreakdown', '_noteSrsFacts'].forEach(n => assert.ok(grabFn(idx, n).includes(SH), n));
});
t('stats.html と hub_opening.js が影を外す', () => {
  const st = read('stats.html');
  assert.ok((st.match(/srsIsShadow/g) || []).length >= 2, 'stats.html');
  assert.ok(read('hub_opening.js').includes(SH), 'hub_opening.js');
});
t('dup_index.js を progress.js より前に読む（study/index/stats）・sw.js に載る', () => {
  ['study.html', 'index.html', 'stats.html'].forEach(f => {
    const s = read(f);
    const a = s.indexOf('<script src="dup_index.js"'), b = s.indexOf('<script src="progress.js');
    assert.ok(a > 0 && a < b, f);
  });
  assert.ok(read('sw.js').includes('"./dup_index.js"'), 'sw.js');
});
t('上限の定数は progress.js だけにある（ページ側に書き写さない）', () => {
  ['study.html', 'index.html', 'stats.html'].forEach(f => assert.ok(!/NEW_CAP_(MAX|MIN|LOW_DUE|HIGH_DUE)\s*=/.test(read(f)), f));
});

console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
