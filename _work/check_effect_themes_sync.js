/**
 * 試験モード演出テーマの乖離チェック
 *
 * study_exam.js の EXAM_EFFECT_THEMES と chapter_exam.js の CE_EFFECT_THEMES は
 * 同一配色のミラー実装（CLAUDE.md「片方を変えたらもう片方も合わせる」）。
 * このスクリプトは両者をソースから抽出して比較し、乖離をテーマ×キー単位で報告する。
 *
 * - 関数値（shapes/ringColor/labels/comboLabel）は tier/n = 0..8 で呼んだ出力を比較
 * - `fx` キーは study.html 通常モードFX専用（chapter側に存在しなくて正しい）→ 除外
 * - EXAM_EFFECT_SETS / CE_EFFECT_SETS（テーマ一覧）も比較
 *
 * Run:  node _work/check_effect_themes_sync.js   （乖離ありなら exit 1）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const STUDY_SRC = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const CH_SRC = fs.readFileSync(path.join(ROOT, 'chapter_exam.js'), 'utf8');

// study_exam.js にのみ存在してよいキー（study.html の通常モード正解FXが参照）
const STUDY_ONLY_KEYS = new Set(['fx']);

// anchor（"NAME = {"）直後の { から、文字列リテラルを考慮した深さカウントで
// 対応する } までを抜き出す
function extractObjectLiteral(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('anchor not found: ' + anchor);
  const start = src.indexOf('{', i);
  let depth = 0, quote = null;
  for (let p = start; p < src.length; p++) {
    const c = src[p];
    if (quote) {
      if (c === '\\') { p++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, p + 1); }
  }
  throw new Error('unbalanced braces after: ' + anchor);
}

function evalObject(literal, filename) {
  return vm.runInNewContext('(' + literal + ')', {}, { filename });
}

// 関数はサンプル呼び出しの出力に置換して比較可能にする
function normalizeValue(v) {
  if (typeof v === 'function') {
    const out = {};
    for (let n = 0; n <= 8; n++) {
      try { out[n] = v(n); } catch (e) { out[n] = 'ERR:' + e.message; }
    }
    return { __fnSamples__: out };
  }
  return v;
}

const studyThemes = evalObject(extractObjectLiteral(STUDY_SRC, 'EXAM_EFFECT_THEMES = '), 'EXAM_EFFECT_THEMES');
const chThemes = evalObject(extractObjectLiteral(CH_SRC, 'CE_EFFECT_THEMES = '), 'CE_EFFECT_THEMES');

const problems = [];

// テーマ一覧（SETS 配列）の比較 — 配列リテラルなので [ ... ] を直接抜く
function extractArrayLiteral(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('anchor not found: ' + anchor);
  const start = src.indexOf('[', i);
  const end = src.indexOf(']', start);
  return src.slice(start, end + 1);
}
const setsA = evalObject(extractArrayLiteral(STUDY_SRC, 'EXAM_EFFECT_SETS = '), 'EXAM_EFFECT_SETS');
const setsB = evalObject(extractArrayLiteral(CH_SRC, 'CE_EFFECT_SETS = '), 'CE_EFFECT_SETS');
if (JSON.stringify(setsA) !== JSON.stringify(setsB)) {
  problems.push('SETS: EXAM_EFFECT_SETS ' + JSON.stringify(setsA) + ' != CE_EFFECT_SETS ' + JSON.stringify(setsB));
}

// テーマ名の集合
const namesA = Object.keys(studyThemes), namesB = Object.keys(chThemes);
namesA.filter(n => !namesB.includes(n)).forEach(n => problems.push('theme "' + n + '": study_exam.js のみに存在'));
namesB.filter(n => !namesA.includes(n)).forEach(n => problems.push('theme "' + n + '": chapter_exam.js のみに存在'));

// テーマごとのキー単位比較
for (const name of namesA.filter(n => namesB.includes(n))) {
  const a = studyThemes[name], b = chThemes[name];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (STUDY_ONLY_KEYS.has(key)) continue;
    if (!(key in a)) { problems.push(name + '.' + key + ': chapter_exam.js のみに存在'); continue; }
    if (!(key in b)) { problems.push(name + '.' + key + ': study_exam.js のみに存在'); continue; }
    const va = JSON.stringify(normalizeValue(a[key]));
    const vb = JSON.stringify(normalizeValue(b[key]));
    if (va !== vb) {
      problems.push(name + '.' + key + ': 値が乖離\n    study:   ' + va.slice(0, 200) + '\n    chapter: ' + vb.slice(0, 200));
    }
  }
}

if (problems.length) {
  console.error('[NG] 演出テーマの乖離 ' + problems.length + '件:');
  problems.forEach(p => console.error('  - ' + p));
  console.error('\nstudy_exam.js が正本。chapter_exam.js 側を合わせること（またはその逆を意図する場合は両方更新）。');
  process.exit(1);
}
console.log('[OK] EXAM_EFFECT_THEMES と CE_EFFECT_THEMES は一致（' + namesA.length + 'テーマ、fxキー除外）');
