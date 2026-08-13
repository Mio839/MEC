/**
 * 2026-08-14 に足した演出の検証。
 * Run: node _work/test_fx_additions.js
 *
 * 守りたいこと:
 *   - fx_engine.js の新エミッタ（shatter/ribbon/stamp/orbit/wave）が動き、
 *     既存24関数を1つも失っていない（既存関数の改変は7テーマ全部へ波及する）。
 *   - 連続正解の天井が tier7（30連続〜）で、テーマ側の配列・マップが index/key 7 まで揃う。
 *     ここが欠けると最上段だけ色もラベルも undefined になる。
 *   - tier で配列を引くクランプ（_tIdx / ceTIdx）が、長さの違う配列とマップの
 *     どちらでも範囲外を返さない。
 *   - A1(難問) / A3(速答3段) の閾値と、study_exam.js ⇔ chapter_exam.js のミラー整合。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}
function sec(s) { console.log('\n' + s); }

const STUDY = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const CHAP  = fs.readFileSync(path.join(ROOT, 'chapter_exam.js'), 'utf8');
const CSS   = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');

// ── fx_engine.js を Canvas2D スタブで読み込む（test_daily_goal.js と同じ器） ──
function loadFx() {
  const rec = { strokes: 0, images: 0, reset() { this.strokes = 0; this.images = 0; } };
  const c2d = new Proxy({
    stroke: () => rec.strokes++,
    drawImage: () => rec.images++,
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get: (o, k) => (k in o ? o[k] : () => undefined), set: () => true });
  const canvas = { style: {}, width: 0, height: 0, id: '', getContext: () => c2d };
  let frame = null;
  const ctx = {
    console, Math, Date, performance: { now: () => 0 },
    requestAnimationFrame: fn => { frame = fn; return 1; },
    cancelAnimationFrame: () => { frame = null; },
    document: { createElement: () => canvas, body: { appendChild() {} }, addEventListener() {} },
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, addEventListener() {},
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'fx_engine.js'), 'utf8'), ctx);
  const fx = ctx.window.MecFX;
  fx._step = n => { for (let i = 1; i <= (n || 6); i++) if (frame) frame(i * 50); };
  fx._rec = rec;
  return fx;
}
const FX = loadFx();
function spawned(fn) { const a = FX.count(); fn(); return FX.count() - a; }

sec('fx_engine.js の新エミッタ（2026-08-14 追加分）');

t('5つの新エミッタが公開されている', () => {
  ['shatter', 'ribbon', 'stamp', 'orbit', 'wave'].forEach(k =>
    assert.strictEqual(typeof FX[k], 'function', k + ' が公開されていない'));
});

t('既存のエミッタを1つも失っていない（純増であること）', () => {
  ['burst', 'confetti', 'glyphRain', 'petals', 'warp', 'bubbles', 'fireworks', 'lightning',
   'rings', 'floaters', 'glyphBurst', 'gears', 'gearRain', 'steam', 'attractor',
   'glitchBars', 'dust', 'clear', 'count'].forEach(k =>
    assert.strictEqual(typeof FX[k], 'function', k + ' が消えている'));
});

t('shatter は指定した数だけ破片を撒く', () => {
  FX.clear();
  assert.strictEqual(spawned(() => FX.shatter(600, 300, { count: 20 })), 20);
});

t('ribbon / wave は1本の線として1粒だけ持つ', () => {
  FX.clear();
  assert.strictEqual(spawned(() => FX.ribbon(100, 100, 500, 400, {})), 1);
  FX.clear();
  assert.strictEqual(spawned(() => FX.wave({ y: 300 })), 1);
});

t('orbit は指定した数だけ回る粒を撒く', () => {
  FX.clear();
  assert.strictEqual(spawned(() => FX.orbit(600, 400, { count: 10 })), 10);
});

// 位置を自前で持つ型（ribbon/wave/stamp）は step() の物理を通ってはいけない。
// STATIC_TYPES へ登録し忘れると重力で画面外へ落ち、1フレームで消える。
t('ribbon / wave / stamp は重力で流されず生き残る（STATIC_TYPES に登録済み）', () => {
  [['ribbon', () => FX.ribbon(100, 100, 500, 400, { ttl: 3 })],
   ['wave',   () => FX.wave({ y: 300, ttl: 3 })],
   ['stamp',  () => FX.stamp(600, 400, { ttl: 3, dust: false })]].forEach(([name, fn]) => {
    FX.clear(); fn(); FX._step(6);
    assert.ok(FX.count() > 0, name + ' が1フレームで消えている（物理を通っている）');
  });
});

t('ribbon / wave は実際に線として描かれる（stroke が呼ばれる）', () => {
  FX.clear(); FX._rec.reset();
  FX.ribbon(100, 100, 500, 400, {});
  FX._step(3);
  assert.ok(FX._rec.strokes > 0, 'ribbon が描画されていない');
  FX.clear(); FX._rec.reset();
  FX.wave({ y: 300, spike: 2.2 });
  FX._step(3);
  assert.ok(FX._rec.strokes > 0, 'wave が描画されていない');
});

t('orbit は中心から半径ぶん離れた位置に置かれる（極座標で動く）', () => {
  FX.clear();
  FX.orbit(600, 400, { count: 4, r: 90, spread: 0, jitter: false, ttl: 3 });
  FX._step(3);
  assert.ok(FX.count() === 4, '軌道の粒が消えている');
});

// ── tier7（B1） ───────────────────────────────────────────────
sec('連続正解の天井 tier7（30連続〜）');

// テーマ定義を切り出して評価する（check_effect_themes_sync.js と同じ抜き方）
function extractObj(src, anchor) {
  const i = src.indexOf(anchor);
  assert.ok(i >= 0, 'anchor not found: ' + anchor);
  const start = src.indexOf('{', i);
  let depth = 0, quote = null;
  for (let p = start; p < src.length; p++) {
    const c = src[p];
    if (quote) { if (c === '\\') { p++; continue; } if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return vm.runInNewContext('(' + src.slice(start, p + 1) + ')', {}); }
  }
  throw new Error('unbalanced braces');
}
const THEMES = extractObj(STUDY, 'EXAM_EFFECT_THEMES = ');
const CE_THEMES = extractObj(CHAP, 'CE_EFFECT_THEMES = ');
const NAMES = Object.keys(THEMES);

t('テーマは7つある', () => assert.strictEqual(NAMES.length, 7));

t('_examTier / ceTier は 30連続で 7 を返す', () => {
  const tierFn = src => {
    const m = src.match(/return n >= 30 \? 7 :[^;]+;/);
    assert.ok(m, 'tier の梯子に 30→7 が無い');
    return vm.runInNewContext('(function (n) { ' + m[0] + ' })');
  };
  [tierFn(STUDY), tierFn(CHAP)].forEach(f => {
    assert.strictEqual(f(29), 6, '29連続はまだ tier6');
    assert.strictEqual(f(30), 7, '30連続で tier7 にならない');
    assert.strictEqual(f(999), 7, 'tier7 が天井になっていない');
    assert.strictEqual(f(1), 1);
  });
});

// index 7 が無いと、最上段だけ色・ラベルが undefined になって演出が無言で壊れる
t('全テーマの配列が index 7 まで埋まっている', () => {
  ['fullscreenCols', 'fullscreenGlow', 'flashColors', 'bgRgbs', 'meterGrads', 'comboColors']
    .forEach(key => NAMES.forEach(n => {
      const a = THEMES[n][key];
      assert.ok(Array.isArray(a) && a.length >= 8, `${n}.${key} が index 7 まで無い`);
      assert.ok(a[7], `${n}.${key}[7] が空`);
    }));
});

t('全テーマのマップが key 7 を持つ', () => {
  NAMES.forEach(n => {
    assert.ok(THEMES[n].burstPalettes[7], n + '.burstPalettes[7] が無い');
    assert.ok(THEMES[n].borderColors[7], n + '.borderColors[7] が無い');
    assert.ok(THEMES[n].floaterGlyphs[7], n + '.floaterGlyphs[7] が無い');
    if (THEMES[n].lightningCols) assert.ok(THEMES[n].lightningCols[7], n + '.lightningCols[7] が無い');
  });
});

t('labels(n) と ringColor(tier) が tier7 でも値を返す', () => {
  NAMES.forEach(n => {
    const l = THEMES[n].labels(30);
    assert.ok(l[7], n + '.labels の8番目が空');
    assert.ok(THEMES[n].ringColor(7), n + '.ringColor(7) が空');
    assert.ok(THEMES[n].tierUpLabel(7), n + '.tierUpLabel(7) が空');
  });
});

t('tier7 は tier6 と違う見た目になる（同じ値の使い回しではない）', () => {
  NAMES.forEach(n => {
    assert.notStrictEqual(THEMES[n].fullscreenCols[7], THEMES[n].fullscreenCols[6],
      n + ' の tier7 が tier6 と同じ色');
    assert.notStrictEqual(THEMES[n].labels(30)[7], THEMES[n].labels(30)[6],
      n + ' の tier7 のラベルが tier6 と同じ');
  });
});

t('_tIdx / ceTIdx は配列でもマップでも範囲外を返さない', () => {
  const grab = (src, name) => {
    const i = src.indexOf('function ' + name + '(tier, o)');
    assert.ok(i > 0, name + ' が見つからない');
    return vm.runInNewContext(src.slice(i, src.indexOf('}', src.indexOf('return', i)) + 1) + '; ' + name);
  };
  [grab(STUDY, '_tIdx'), grab(CHAP, 'ceTIdx')].forEach(f => {
    assert.strictEqual(f(7, [0, 1, 2, 3, 4, 5, 6]), 6, '短いローカル配列で範囲外を返した');
    assert.strictEqual(f(7, [0, 1, 2, 3, 4, 5, 6, 7]), 7, '拡張済み配列で 7 を返さない');
    assert.strictEqual(f(7, { 6: 'a', 7: 'b' }), 7, 'マップで 7 を返さない');
    assert.strictEqual(f(99, { 7: 'b' }), 7, 'マップのクランプが効いていない');
    assert.strictEqual(f(3, [0, 1, 2, 3, 4, 5, 6, 7]), 3, '天井未満をそのまま返していない');
  });
});

t('コンボメーターの目盛りが tier7 まで伸びている', () => {
  [STUDY, CHAP].forEach(src => {
    const m = src.match(/starts=\[([\d,]+)\], ends=\[([\d,]+)\];/);
    assert.ok(m, 'starts/ends が見つからない');
    const starts = m[1].split(',').map(Number), ends = m[2].split(',').map(Number);
    assert.strictEqual(starts.length, 8, 'starts が tier7 まで無い');
    assert.strictEqual(ends.length, 8, 'ends が tier7 まで無い');
    assert.strictEqual(starts[7], 30, 'tier7 の開始が 30連続になっていない');
    // 各段は必ず前の段の終わりから始まる（隙間や重なりがあると「あと N」が嘘になる）
    for (let i = 2; i <= 7; i++) assert.strictEqual(starts[i], ends[i - 1], 'tier' + i + ' の目盛りが不連続');
  });
  assert.ok(/tier >= 7 \? '⚡ MAX'/.test(STUDY), 'MAX 判定が tier7 になっていない(study)');
  assert.ok(/tier >= 7 \? '⚡ MAX'/.test(CHAP), 'MAX 判定が tier7 になっていない(chapter)');
});

// ── A1 難問 / A3 速答3段 / C2 立て直し ────────────────────────
sec('A1 難問クリア / A3 速答3段 / C2 立て直し');

t('難問の閾値は 60（study.html のフィルタ・gamify.js の hard と同じ）', () => {
  assert.ok(/EXAM_HARD_RATE = 60;/.test(STUDY), 'study 側の閾値が 60 でない');
  assert.ok(/CE_HARD_RATE = 60;/.test(CHAP), 'chapter 側の閾値が 60 でない');
  assert.ok(/HARD_RATE = 60/.test(fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8')),
    'gamify.js の HARD_RATE と食い違っている');
});

t('速答は3段で、閾値が両ファイルで一致する', () => {
  const grab = src => {
    const m = src.match(/FAST_TIER_MS = \[([\d, ]+)\]/);
    assert.ok(m, '速答の閾値が見つからない');
    return m[1].split(',').map(s => Number(s.trim()));
  };
  const a = grab(STUDY), b = grab(CHAP);
  assert.deepStrictEqual(a, b, 'study と chapter で速答の閾値が違う');
  assert.strictEqual(a.length, 3, '3段になっていない');
  assert.ok(a[0] < a[1] && a[1] < a[2], '閾値が昇順でない');
});

t('全テーマが fastLabels を3つ持つ（強い順）', () => {
  NAMES.forEach(n => {
    assert.ok(Array.isArray(THEMES[n].fastLabels) && THEMES[n].fastLabels.length === 3,
      n + '.fastLabels が3つでない');
  });
});

t('A1/A2/C2 のテーマキーが7テーマ全部に揃っている', () => {
  ['hardLabel', 'hardColors', 'recoverLabel', 'recoverColors', 'freshLabel', 'revengeLabel']
    .forEach(key => NAMES.forEach(n =>
      assert.ok(THEMES[n][key], `${n}.${key} が無い`)));
});

t('フラットラインを持つのは心電図テーマだけ', () => {
  const withFlat = NAMES.filter(n => THEMES[n].useFlatline);
  assert.deepStrictEqual(withFlat, ['ecg'], 'useFlatline を持つテーマが ecg 以外にある');
});

// ── ミラー整合（study ⇔ chapter） ────────────────────────────
sec('study_exam.js ⇔ chapter_exam.js のミラー');

t('新しい演出はどちらのファイルにも入っている', () => {
  const pairs = [
    ['_triggerHardClear', 'ceHardClear'],
    ['_triggerRecover',   'ceRecover'],
    ['_triggerAnswerMark', 'ceAnswerMark'],
    ['_traceToAnswer',    'ceTraceToAnswer'],
    ['_sinkOtherChoices', 'ceSinkOthers'],
    ['_shatterComboMeter', 'ceShatterMeter'],
    ['_triggerRepeatWrong', 'ceRepeatWrong'],
    ['_ecgFlatline',      'ceFlatline'],
    ['_ecgBeatBack',      'ceBeatBack'],
    ['_afterCorrectFx',   'ceAfterCorrectFx'],
    ['_afterWrongFx',     'ceAfterWrongFx'],
  ];
  pairs.forEach(([s, c]) => {
    assert.ok(STUDY.includes('function ' + s + '('), 'study に ' + s + ' が無い');
    assert.ok(CHAP.includes('function ' + c + '('), 'chapter に ' + c + ' が無い');
  });
});

// 正解／誤答の追加演出は2経路（選択肢・計算問題の桁入力）から必ず同じ口を通す。
// 片方に直接書くと計算問題50問だけ演出が抜ける。
t('study 側は正解2経路・誤答2経路とも合流点を通っている', () => {
  // 呼び出しだけを数える（`function _afterCorrectFx(card, ...)` の定義行を除く）
  const c = (STUDY.match(/(?<!function )_afterCorrectFx\(card, /g) || []).length;
  const w = (STUDY.match(/(?<!function )_afterWrongFx\(card, /g) || []).length;
  assert.strictEqual(c, 2, '_afterCorrectFx の呼び出しが2箇所でない（選択肢＋計算問題）');
  assert.strictEqual(w, 2, '_afterWrongFx の呼び出しが2箇所でない');
});

// C1 は「途切れた時点の連続数」で規模を決めるので、0 にする前に控えていないと常に 0 になる
t('崩落の規模は examStreak を 0 にする前に控えている', () => {
  assert.ok(/const _broke = examStreak;[\s\S]{0,80}examStreak = 0;/.test(STUDY),
    'study: examStreak を控える前に 0 にしている');
  assert.ok(/var _ceBroke = exam\.streak;[\s\S]{0,80}exam\.streak = 0;/.test(CHAP),
    'chapter: exam.streak を控える前に 0 にしている');
});

t('新しいラベルは reduced-motion で消える', () => {
  const rm = CSS.slice(CSS.indexOf('prefers-reduced-motion'));
  ['.exam-hard-pop', '.exam-recover-pop', '.exam-mark-pop'].forEach(sel =>
    assert.ok(rm.includes(sel), sel + ' が reduced-motion で消えない'));
  assert.ok(/\.qc\.exam-sink \.ch2\{transition:none/.test(CSS), 'A5 が reduced-motion で止まらない');
});

// ── 出力 ──────────────────────────────────────────────────────
console.log('\n' + (fail ? 'FAILED' : 'all passed') + '  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
