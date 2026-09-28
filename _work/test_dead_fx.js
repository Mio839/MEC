/**
 * 演出まわりの「死んだコード」が増えていないかを見張る（2026-09-28〜）。
 *
 *   ① 演出テーマの表（EXAM_EFFECT_THEMES / CE_EFFECT_THEMES）のキーが、表の外で1回以上読まれている
 *   ② study_exam.js / chapter_exam.js / fx_engine.js / gamify.js の関数が、定義以外で1回以上参照されている
 *   ③ study.css / ui_theme.css / vars.css の @keyframes が、どこかから名前で参照されている
 *
 * 2026-09-24 に正解・誤答の演出を置き換えたとき、旧演出だけが読んでいた設定値16個・呼ばれない関数・
 * 一度も付かないクラスの CSS とアニメ定義が残り、数か月そのまま読み手を迷わせていた。
 * 演出を置き換えたら**古い側を消し忘れていないか**をここが捕まえる。
 *
 * ⚠️ 例外を足すときは ALLOW に理由つきで書くこと（黙って通すと元の状態に戻る）。
 * Run: node _work/test_dead_fx.js
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// 名前で参照を探す範囲：リポジトリ直下の js/html と 国家試験過去問/*.html（生成物・問題データは除く）
const SRC_FILES = fs.readdirSync(ROOT)
  .filter(f => /\.(js|html)$/.test(f) && !/^(questions_|rate_index|dup_index|chapters_meta|sounds_index|image_dims)/.test(f));
const KAKO = fs.readdirSync(path.join(ROOT, '国家試験過去問')).filter(f => f.endsWith('.html')).map(f => '国家試験過去問/' + f);
// index.css はハブの CSS（2026-09-28 に index.html から外出し）。ほかの CSS の @keyframes を名前で使う
const SRC = SRC_FILES.concat(KAKO, ['index.css']).map(read).join('\n');
const CSS_FILES = ['study.css', 'ui_theme.css', 'vars.css'];
const CSS = CSS_FILES.map(read).join('\n');

const ALLOW = {
  keys: [],        // 例: 'someKey' — 理由
  functions: [],
  keyframes: [],
};

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('FAIL  - ' + name + '\n        ' + e.message); }
}
const esc = s => s.replace(/[$]/g, '\\$');
const wordRe = n => new RegExp('(^|[^\\w$])' + esc(n) + '(?![\\w$])', 'g');

// 表の範囲（{ … } の対応括弧）と、テーマ直下（深さ2）のキー
function tableOf(src, name) {
  const m = new RegExp(name + '\\s*=\\s*\\{').exec(src);
  if (!m) throw new Error(name + ' が見つからない');
  let i = src.indexOf('{', m.index), d = 0, k = i;
  for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) break; } }
  return { body: src.slice(i, k + 1), rest: src.slice(0, m.index) + src.slice(k + 1) };
}
function topKeys(body) {
  const keys = new Set(); let d = 0, i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === "'" || c === '"' || c === '`') { const q = c; i++; while (i < body.length && body[i] !== q) { if (body[i] === '\\') i++; i++; } i++; continue; }
    if (c === '/' && body[i + 1] === '/') { while (i < body.length && body[i] !== '\n') i++; continue; }
    if (c === '/' && body[i + 1] === '*') { i = body.indexOf('*/', i) + 2; continue; }
    if ('{[('.includes(c)) d++;
    else if ('}])'.includes(c)) d--;
    else if (d === 2 && !/[\w$.]/.test(body[i - 1] || '')) {
      const m = /^([A-Za-z_]\w*)\s*:/.exec(body.slice(i));
      if (m) { keys.add(m[1]); i += m[1].length; continue; }
    }
    i++;
  }
  return keys;
}

t('① 演出テーマの表のキーが表の外で読まれている（study・過去問ビューアのどちらか）', () => {
  const S = tableOf(read('study_exam.js'), 'EXAM_EFFECT_THEMES');
  const C = tableOf(read('chapter_exam.js'), 'CE_EFFECT_THEMES');
  const rest = S.rest + '\n' + C.rest;
  const keys = new Set([...topKeys(S.body), ...topKeys(C.body)]);
  const unread = [...keys].filter(k => !ALLOW.keys.includes(k) &&
    !new RegExp('\\.\\s*' + k + '\\b|\\[\\s*[\'"]' + k + '[\'"]\\s*\\]').test(rest));
  if (keys.size < 20) throw new Error('キーの読み取りに失敗している（' + keys.size + '個）');
  if (unread.length) throw new Error('誰も読まないキー: ' + unread.join(', '));
});

t('② 演出まわりの関数が定義以外で参照されている', () => {
  const dead = [];
  for (const f of ['study_exam.js', 'chapter_exam.js', 'fx_engine.js', 'gamify.js']) {
    const s = read(f);
    // 即時実行の関数式 (function name(){…})() は名前で呼ばれないのが正しいので除く
    const iife = new Set([...s.matchAll(/\(\s*function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
    const names = new Set([...s.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
    for (const n of names) {
      if (iife.has(n) || ALLOW.functions.includes(n)) continue;
      if ((SRC.match(wordRe(n)) || []).length <= 1) dead.push(f + ':' + n);
    }
  }
  if (dead.length) throw new Error('呼ばれない関数: ' + dead.join(', '));
});

t('③ @keyframes がどこかから名前で参照されている', () => {
  const dead = [];
  for (const f of CSS_FILES) {
    for (const m of read(f).matchAll(/@keyframes\s+([\w-]+)/g)) {
      const n = m[1];
      if (ALLOW.keyframes.includes(n)) continue;
      const re = new RegExp('(?<![\\w-])' + n + '(?![\\w-])', 'g');
      if ((CSS.match(re) || []).length <= 1 && !re.test(SRC)) dead.push(f + ':' + n);
    }
  }
  if (dead.length) throw new Error('参照されない @keyframes: ' + dead.join(', '));
});

t('検査そのものが空回りしていない（既知の生きた名前を拾える）', () => {
  const S = tableOf(read('study_exam.js'), 'EXAM_EFFECT_THEMES');
  if (!topKeys(S.body).has('comboColors')) throw new Error('comboColors を拾えていない');
  if ((SRC.match(wordRe('startExam')) || []).length < 2) throw new Error('startExam の参照を拾えていない');
});

console.log('\n' + (fail ? 'FAILED ' + fail + ' / ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
