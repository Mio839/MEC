/**
 * 科目ごとの問題数が「実データ（questions_*.json）」と一致しているかを検証する。
 * Run: node _work/test_subject_totals.js
 *
 * 背景: 同じ数字が3か所にある。
 *   - questions_*.json      … 実データ（正本）
 *   - gamify.js の SUBJECTS … 科目制覇の判定に使うハードコード（ハブでは科目JSONを読まない）
 *   - chapters_meta.js      … ハブの合計問題数 calcTotalQ の材料（build.py が生成）
 * 問題を足し引きしたのに片方だけ直し忘れると、「科目制覇」が永久に来ない／進捗％が
 * ずれる、といった静かな不具合になる。ここで突き合わせて事故を止める。
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

// ── 実データを数える ────────────────────────────────────────────────
function countFromJson(sid) {
  const p = path.join(ROOT, `questions_${sid}.json`);
  if (!fs.existsSync(p)) return null;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (d.chapters || []).reduce((s, ch) => s + (ch.qs || []).length, 0);
}

// ── gamify.js の SUBJECTS を取り出す ────────────────────────────────
function gamifySubjects() {
  const src = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');
  const start = src.indexOf('const SUBJECTS = [');
  assert.ok(start > 0, 'gamify.js に SUBJECTS が見つからない');
  const open = src.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (!depth) { end = i; break; } }
  }
  assert.ok(end > 0, 'SUBJECTS の括弧が閉じていない');
  return vm.runInNewContext(src.slice(open, end + 1));
}

// ── chapters_meta.js の MEC_CHAPTERS を取り出す ─────────────────────
function metaChapters() {
  const src = fs.readFileSync(path.join(ROOT, 'chapters_meta.js'), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\n;globalThis.__out = typeof MEC_CHAPTERS !== "undefined" ? MEC_CHAPTERS : null;', ctx);
  return ctx.__out;
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

const subjects = gamifySubjects();

t('gamify.js の SUBJECTS は questions_*.json の実数と一致する', () => {
  const bad = [];
  subjects.forEach(s => {
    const actual = countFromJson(s.id);
    if (actual === null) { bad.push(`${s.id}: questions_${s.id}.json が無い`); return; }
    if (actual !== s.total) bad.push(`${s.id}: gamify=${s.total} 実データ=${actual}`);
  });
  assert.strictEqual(bad.length, 0, '\n        ' + bad.join('\n        '));
});

t('chapters_meta.js の章合計も実データと一致する', () => {
  const meta = metaChapters();
  assert.ok(Array.isArray(meta), 'MEC_CHAPTERS が読めない');
  const bad = [];
  meta.forEach(subj => {
    const actual = countFromJson(subj.id);
    if (actual === null) return;            // 過去問など questions_*.json を持たない項目
    const metaTotal = (subj.chapters || []).reduce((s, ch) => s + (ch.count || 0), 0);
    if (metaTotal !== actual) bad.push(`${subj.id}: meta=${metaTotal} 実データ=${actual}`);
  });
  assert.strictEqual(bad.length, 0, '\n        ' + bad.join('\n        '));
});

t('gamify.js と chapters_meta.js が同じ科目集合を見ている', () => {
  const meta = metaChapters() || [];
  const metaIds = new Set(meta.map(s => s.id));
  // jitsu1 は実力試験で chapters_meta.js には載らない（ハブ側は JITSU1_CHAPTERS が持つ）
  const missing = subjects.map(s => s.id).filter(id => id !== 'jitsu1' && !metaIds.has(id));
  assert.strictEqual(missing.length, 0, 'chapters_meta.js に無い: ' + missing.join(','));
});

console.log(`\n${fail ? 'FAILED' : 'all passed'}  (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
