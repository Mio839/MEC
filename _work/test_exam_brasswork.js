/**
 * Phase 7「スチームパンクの語彙を筐体の外へ広げる」の規約を実ソースで検証する。
 * Run: node _work/test_exam_brasswork.js
 *
 * 背景（2026-08-21・設計 §12）:
 *   Phase 4 が筐体（真鍮固定）を、Phase 5 が読書中の演出を作った。Phase 7 はその語彙を
 *   筐体の外——カードの左端・選択肢・結果画面・起動画面・画面の縁——へ広げる。
 *
 *     段A S6 押した手応え ／ S5 傷 → 真鍮の補強プレート
 *     段B S10 結果画面を計器盤にする
 *     段C S8 蒸気ブート ／ S9 レールを管の断面にする
 *     段D S11 炉のヴィネット
 *     段E S4 軸光 ／ S1+S1' 排圧計 ／ S12 ヘッダの管 ／ S13 トーストの打撃
 *
 * ⚠️ ここで守りたい設計上の決定:
 *   ① transform は既存アニメに殺される＝沈み込みは translate / 回転は rotate / 拡大は scale。
 *   ② 水平の「線」を1本も作らない（下線部が選択肢そのものになる設問が実在する）。
 *   ③ 箱の外へ出る要素・width/height/transform を作らない（iOS の縮尺振動の再発防止）。
 *   ④ 筐体で常時動けるのは .exam-idle-lit に連動するものだけ。
 *   ⑤ exitExam で全部落とす／reduced-motion で動きだけ止め意匠は残す。
 *   ⑥ vars.css / index.html / gamify.js / chapter_exam.js には1行も触れない。
 *
 * ブラウザも jsdom も使わない。実ソースを読んで正規表現だけで検査する。
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const CSS  = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const JS   = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}

// ⚠️ コメントを先に落とすこと。注意書きに実例のコード片が書いてあり、拾うと誤検出になる。
const CSS_NC = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const JS_NC  = JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function stripAtBlocks(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const at = css.indexOf('@keyframes', i);
    if (at < 0) { out += css.slice(i); break; }
    out += css.slice(i, at);
    let j = css.indexOf('{', at), depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) { j++; break; } }
    }
    i = j;
  }
  return out;
}
function mediaBlocks(css, needle) {
  const out = [];
  const re = new RegExp('@media[^{]*' + needle + '[^{]*\\{', 'g');
  let m;
  while ((m = re.exec(css))) {
    let j = m.index + m[0].length - 1, depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) break; }
    }
    out.push(css.slice(m.index + m[0].length, j));
  }
  return out;
}
function stripMedia(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) { out += css.slice(i); break; }
    out += css.slice(i, at);
    let j = css.indexOf('{', at), depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) { j++; break; } }
    }
    i = j;
  }
  return out;
}
const FLAT = stripMedia(stripAtBlocks(CSS_NC));
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith('@')) continue;
    out.push({ sel, body: m[2] });
  }
  return out;
}
const RULES = rules(FLAT);
function ruleFor(re) { return RULES.filter(r => re.test(r.sel)); }
function fnBody(name) {
  const i = JS.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let j = JS.indexOf('{', i), depth = 0;
  for (; j < JS.length; j++) {
    if (JS[j] === '{') depth++;
    else if (JS[j] === '}') { depth--; if (!depth) return JS.slice(i, j + 1); }
  }
  return null;
}
/** 「縦オフセットがあるのに blur が 0」＝水平の線を引いている box-shadow を探す（§11-6-3'）。
    ⚠️ カンマは括弧の外だけで割ること。rgba(...) / color-mix(...) の中にもカンマがあるので、
       素の split(',') だと 1 つの影が複数の層に割れて誤検出になる（実際に踏んだ）。
    ⚠️ 長さの抽出では単位なしの 0 も拾うこと。`0 4px 14px rgba(...)` を px だけで拾うと
       dy=14 / blur=無し と読み違える。 */
function splitTopLevel(str) {
  const out = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}
function stripParens(str) {
  let prev; do { prev = str; str = str.replace(/\([^()]*\)/g, ' '); } while (str !== prev);
  return str;
}
function hardLineShadows(body) {
  const bad = [];
  const m = /box-shadow\s*:([^;]+);/g;
  let x;
  while ((x = m.exec(body))) {
    const decl = x[1];
    if (/inset/.test(decl)) { bad.push('inset: ' + decl.trim()); continue; }
    splitTopLevel(decl).forEach(layer => {
      const clean = stripParens(layer).replace(/#[0-9a-fA-F]{3,8}/g, ' ');
      const nums = clean.match(/-?\d*\.?\d+(?:px)?/g);
      if (!nums || nums.length < 2) return;
      const dy = parseFloat(nums[1]);
      const blur = nums.length >= 3 ? parseFloat(nums[2]) : 0;
      if (dy !== 0 && blur === 0) bad.push(layer.trim());
    });
  }
  return bad;
}

// ══ 段A: S6 押した手応え ════════════════════════════════════════════════
t('1. S6 の沈み込みが translate プロパティで書かれている（transform だと examKeycapUp に殺される）', () => {
  const rs = ruleFor(/\.ch2:active/);
  assert.ok(rs.length, '.ch2:active の規則が無い（押下フィードバックが存在しない）');
  const sink = rs.filter(r => /translate\s*:/.test(r.body));
  assert.ok(sink.length, '.ch2:active に translate プロパティが無い');
  rs.forEach(r => {
    assert.ok(!/[^-]transform\s*:/.test(r.body),
      '.ch2:active が transform を使っている（R6 の examKeycapUp が both で transform を保持し続けるので黙って死ぬ）: ' + r.sel);
  });
});

t('2. S6 が水平の線を作らない（縦オフセットがあるのに blur が 0 の層・inset を禁じる）', () => {
  ruleFor(/\.ch2:active/).forEach(r => {
    const bad = hardLineShadows(r.body);
    assert.ok(!bad.length, r.sel + ' が硬い線を引いている: ' + bad.join(' / '));
  });
});

t('3. S6 が .ch2 の padding / margin を変えていない', () => {
  ruleFor(/\.ch2:active/).forEach(r => {
    assert.ok(!/(^|;|\s)(padding|margin)[-a-z]*\s*:/.test(r.body),
      r.sel + ' が padding/margin を触っている（負マージンで詰めてあり .exam-selected の当たりがずれる）');
  });
});

// ══ 段A: S5 補強プレート ═══════════════════════════════════════════════
t('4. S5 のプレートが .exam-scar::before のまま（::after へ移していない＝data-recap と衝突しない）', () => {
  assert.ok(/\.qc\.exam-scar[^{,]*::before/.test(CSS_NC), '.qc.exam-scar::before が無い');
  assert.ok(!/\.qc\.exam-scar[^{,]*::after/.test(CSS_NC),
    '.exam-scar が ::after を使っている（B5 の data-recap と exam-multi-correct が使っている層）');
});

t('5. S5 が赤（リベット）を残している（真鍮一色にしていない）', () => {
  const rs = ruleFor(/\.qc\.exam-scar::before/);
  assert.ok(rs.length, '.qc.exam-scar::before の規則が無い');
  const body = rs.map(r => r.body).join('');
  assert.ok(/--exam-plate-rivet/.test(body), 'リベットの層が無い');
  assert.ok(/--exam-plate-red/.test(body), '赤の層が無い（真鍮一色だと通過済みカードの中で埋もれる）');
  // トークン名だけ真似て中身が真鍮になっていないか、実体まで見る
  const rivet = /--exam-plate-rivet\s*:([^;]+);/.exec(CSS_NC);
  const red   = /--exam-plate-red\s*:([^;]+);/.exec(CSS_NC);
  assert.ok(rivet && /#F2A07B|rgba\(176,\s*58,\s*40/i.test(rivet[1]), 'リベットが銅赤になっていない');
  assert.ok(red && /255,\s*107,\s*107/.test(red[1]), '赤の層が赤でない');
});

t('6. S5 の幅が R5 のクランプと同値（カード左端の語彙が幅で読み分けられる）', () => {
  const clamp = ruleFor(/exam-key-focus:not\(\.exam-revealed\)::before/);
  const plate = ruleFor(/\.qc\.exam-scar::before/);
  assert.ok(clamp.length && plate.length, 'クランプまたはプレートの規則が無い');
  const w = b => (/width\s*:\s*(\d+)px/.exec(b) || [])[1];
  assert.strictEqual(w(plate[0].body), w(clamp[0].body),
    'プレートとクランプの幅が違う（3px ではリベットの頭が潰れて点にならない）');
  assert.strictEqual(w(plate[0].body), '5', 'プレートの幅が 5px でない');
});

t('7. S5 の克服光が _afterCorrectFx にある（正解の2経路の合流点。片方だけだと計算問題で抜ける）', () => {
  const b = fnBody('_afterCorrectFx');
  assert.ok(b, '_afterCorrectFx が見つからない');
  assert.ok(/_polishPlate\s*\(/.test(b), '_afterCorrectFx から _polishPlate を呼んでいない');
  ['revealAnswer', '_revealCalcAnswer'].forEach(fn => {
    const s = fnBody(fn);
    if (!s) return;
    assert.ok(!/_polishPlate\s*\(/.test(s), fn + ' が _polishPlate を直接呼んでいる（合流点を通すこと）');
  });
  const p = fnBody('_polishPlate');
  assert.ok(p, '_polishPlate が見つからない');
  assert.ok(/_fxOff\(\)/.test(p), '_polishPlate が reduced-motion を尊重していない');
  assert.ok(/classList\.remove\('exam-plate-fix'\)/.test(p),
    '克服光の当て板を消していない（残ると exam-scar と同じ絵が並んで見分けられなくなる）');
});

// ══ 段B: S10 結果画面を計器盤にする ════════════════════════════════════
t('19. S10 が .gm- で始まるセレクタを1つも書いていない（gamify.js 注入＝ハブと共有の CSS を上書きしない）', () => {
  RULES.forEach(r => {
    assert.ok(!/(^|[\s,>+~])\.gm-/.test(r.sel),
      'study.css が .gm-* を上書きしている → ' + r.sel.trim() +
      '（gamify.js が注入する CSS はハブ index.html と共有＝ハブの見た目が黙って動く）');
  });
});

t('20. S10 のボタンの沈み込みが translate プロパティで書かれている（transform は殺される）', () => {
  const btns = ['.exam-review-btn', '.exam-retry-btn', '.exam-close-btn', '.exam-fresh-btn'];
  btns.forEach(b => {
    const rs = RULES.filter(r => r.sel.split(',').some(x => x.trim().startsWith(b) && x.includes(':active')));
    assert.ok(rs.length, b + ':active の規則が無い（押しても沈まない）');
    assert.ok(rs.some(r => /translate\s*:/.test(r.body)),
      b + ':active に translate プロパティが無い（:hover の transform と :active の scale が潰し合う）');
  });
});

t('21. S10 が水平の「線」を作らない（縦オフセットがあるのに blur が 0 の層・inset を禁じる）', () => {
  const sels = ['.exam-detail-item', '.exam-review-btn', '.exam-retry-btn', '.exam-close-btn', '.exam-fresh-btn'];
  RULES.forEach(r => {
    if (!sels.some(x => r.sel.includes(x))) return;
    const bad = hardLineShadows(r.body);
    assert.ok(!bad.length, r.sel.trim() + ' が硬い線を引いている: ' + bad.join(' / '));
  });
});

t('22. S10 の管の点灯がカウントアップの完了後に一度だけで、常時フリッカーが無い', () => {
  const b = fnBody('showExamSummary');
  assert.ok(b, 'showExamSummary が見つからない');
  assert.ok(/tubes-lit/.test(b), '点灯クラス tubes-lit を付けていない');
  assert.ok(/classList\.remove\('tubes-lit'\)/.test(b),
    '前回の点灯を消していない（次のセッションで「ともる瞬間」が無くなる）');
  assert.ok(/else\s+_litTubes\(\)/.test(b),
    'カウントアップの完了で点灯していない（k<1 の else に置くこと）');
  assert.ok(/setTimeout\(_litTubes/.test(b),
    'rAF が止まった時の落とし所が無い（非表示タブでは管が永久に点かない）');
  // 常時フリッカー＝tubes-lit 系に infinite の animation が無いこと
  RULES.forEach(r => {
    if (!/tubes-lit/.test(r.sel)) return;
    assert.ok(!/infinite/.test(r.body), '結果画面の管が常時フリッカーしている → ' + r.sel.trim());
  });
});

t('S10-a. タイルとボタンの「面の色（意味）」が残っている（琥珀一色にしていない）', () => {
  // 4タイルの数字は緑/赤/青/紫のまま＝正解・不正解・回答・時間が見分けられる
  [['di-ok', '#7CEFB2'], ['di-ng', '#FF9B9B'], ['di-n', '#A8CDFF'], ['di-t', '#C9B8FF']].forEach(([k, col]) => {
    const rs = RULES.filter(r => r.sel.includes(k) && /\.val/.test(r.sel));
    assert.ok(rs.some(r => r.body.toUpperCase().includes(col.toUpperCase())),
      k + ' の数字が意味色 ' + col + ' でなくなっている（4つの数字が見分けられなくなる）');
  });
});

t('S10-b. タイルのリベットが --exam-rivet-dot を借りている（額縁の鋲と別物を作らない）', () => {
  const rs = ruleFor(/\.exam-detail-item::before/);
  assert.ok(rs.length, '.exam-detail-item::before が無い');
  assert.ok(/--exam-rivet-dot/.test(rs[0].body),
    'タイルのリベットが --exam-rivet-dot を使っていない（モーダルの額縁の鋲と絵が食い違う）');
  // ⚠️ ::before は位置指定ボックス＝素のテキストより上に描かれる。ラベルと数字を持ち上げること
  const lift = RULES.filter(r => /\.exam-detail-item .*\.(lbl|val)/.test(r.sel) && /position\s*:\s*relative/.test(r.body));
  assert.ok(lift.length, 'ラベル/数字が position:relative で持ち上げられていない（窪みの下に隠れる）');
});

// ══ 全段共通 ═══════════════════════════════════════════════════════════
t('17. exitExam が Phase 7 で足したクラス・タイマーを全部落とす', () => {
  const b = fnBody('exitExam');
  assert.ok(b, 'exitExam が見つからない');
  assert.ok(/exam-plate-fix/.test(b), 'exitExam が exam-plate-fix を落としていない');
});

t('33. vars.css / index.html / gamify.js / chapter_exam.js に Phase 7 の痕跡が無い', () => {
  const files = ['vars.css', 'index.html', 'gamify.js', 'chapter_exam.js'];
  const marks = ['exam-plate', 'exam-relief', 'exam-forge', 'exam-nixie'];
  files.forEach(f => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    marks.forEach(m => assert.ok(!src.includes(m), f + ' に Phase 7 の識別子 ' + m + ' が入り込んでいる'));
  });
});

console.log('');
if (fail) { console.log('FAILED  (' + pass + '/' + (pass + fail) + ')'); process.exit(1); }
console.log('all passed  (' + pass + '/' + pass + ')');
