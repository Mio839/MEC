// normalize_calc_answers.js — 計算問題の ans_label を「計算答：<桁文字列>」へ正規化する
//
// ■ 背景
// 選択肢が1つも無い問題（＝原文がマークシートの桁入力）は試験モードで解答不能だった。
// 入力型で採点できるようにするため、正解を1つの機械可読な形に寄せる。
//
//   変換前: "計算答：2,0"                     / "A-aDO₂ = 36 Torr"
//   変換後: "計算答：2.0"                     / "計算答：36"（説明文は ans_sub へ退避）
//
// 桁数＝文字数、小数点位置＝文字列そのもの。"0.40" のように先頭ゼロ・末尾ゼロが
// 意味を持つため、正解は「数値」ではなく「桁文字列」として扱う。
//
// ■ 小数点位置の出どころ
// 問題文中の解答テンプレート（"解答：①. ② ℓ/分/m2" 等）から読む。区切りが半角空白では
// なく U+2009 THIN SPACE の紙面があるため、空白は \s 全体を許容する。
// テンプレートが欠けている問題は、同一問題が questions_*.json と 国家試験過去問/*.html の
// 両方にある性質を使って「回数-問番」で相互補完する（両方にあれば桁数の相互検証にもなる）。
//
// ■ 冪等性
// すでに正規化済みの ans_label は再変換しない。--dry-run で差分だけ確認できる。
//
// 使い方: node _work/normalize_calc_answers.js [--dry-run]

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const CIRC = '①②③④⑤⑥⑦⑧⑨';
const CANON = /^計算答[：:]\s*([0-9]+(?:\.[0-9]+)?)\s*$/;

// ── 解答テンプレート（丸数字が空白/ピリオドだけで連結された run）を全部拾う ──
function allRuns(qt) {
  const t = qt.replace(/<[^>]+>/g, ' ');
  const runs = [];
  for (let i = 0; i < t.length; i++) {
    if (CIRC.indexOf(t[i]) < 0) continue;
    let slots = 0, dec = null, j = i;
    while (j < t.length) {
      const c = t[j];
      if (CIRC.indexOf(c) >= 0) { slots++; j++; continue; }
      if (/\s/.test(c)) { j++; continue; }             // U+2009 等も空白として許容
      if (c === '.' || c === '．') { if (dec === null) dec = slots; j++; continue; }
      break;
    }
    if (slots >= 2) runs.push({ slots, dec, at: i });
    i = j - 1;
  }
  return runs;
}

// 桁数が一致する run を選ぶ（複数あれば「解答」等のアンカーに最も近いもの）
function pickRun(qt, nd) {
  const t = qt.replace(/<[^>]+>/g, ' ');
  const cand = allRuns(qt).filter(r => r.slots === nd);
  if (!cand.length) return null;
  if (cand.length === 1) return cand[0];
  const anchors = [...t.matchAll(/解答|求めよ|計算せよ/g)].map(m => m.index);
  if (!anchors.length) return cand[0];
  let best = cand[0], bd = Infinity;
  for (const r of cand) for (const a of anchors) {
    const d = Math.abs(r.at - a);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

const compose = (d, dec) =>
  (dec === null || dec === undefined || dec <= 0 || dec >= d.length) ? d : d.slice(0, dec) + '.' + d.slice(dec);
const epKey = e => (e || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();

// ans_label から桁列を取り出す。戻り値 {digits, dec, desc, already}
function readAnswer(al) {
  const canon = al.match(CANON);
  if (canon) {
    const s = canon[1], dot = s.indexOf('.');
    return { digits: s.replace('.', ''), dec: dot < 0 ? null : dot, desc: null, already: true };
  }
  const calc = al.match(/計算答[：:]\s*(.+)/);
  if (calc) {
    // "2,0" のカンマ区切り。小数点位置は問題文テンプレートから後で入れる
    return { digits: calc[1].trim().split(/\s*,\s*/).join(''), dec: null, desc: null, already: false };
  }
  // 自由記述（"A-aDO₂ = 36 Torr" 等）。'=' の後ろの最初の数値を採る
  const after = al.includes('=') ? al.slice(al.indexOf('=') + 1) : al;
  const m = after.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;                                  // 計算問題ではない（図のa〜e・組合せ等）
  const v = m[1], dot = v.indexOf('.');
  return { digits: v.replace('.', ''), dec: dot < 0 ? null : dot, desc: al.trim(), already: false };
}

// 選択肢を持たない問題を questions_*.json と 国家試験過去問/*.html から拾う。
// テスト（_work/test_calc_input.js）がテンプレート解析を再実装しないよう公開する。
module.exports = { allRuns, pickRun, readAnswer, compose, epKey, CANON, collect };

function collect() {
  const out = [];
  for (const f of fs.readdirSync(ROOT).filter(x => /^questions_.*\.json$/.test(x))) {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    for (const ch of (j.chapters || [])) for (const q of (ch.qs || [])) {
      if ((q.choices || []).length) continue;
      out.push({ kind: 'json', file: f, uid: q.uid, ep: q.episode, al: q.ans_label || '',
                 qt: q.qt || '', rate: q.rate == null ? null : Number(q.rate) });
    }
  }
  const hf = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const x = path.join(d, e.name);
      if (e.isDirectory()) walk(x); else if (/\.html$/.test(e.name)) hf.push(x);
    }
  })(path.join(ROOT, '国家試験過去問'));
  for (const f of hf) {
    for (const c of fs.readFileSync(f, 'utf8').split('<div class="qc"').slice(1)) {
      const cs = c.match(/<div class="cs">([\s\S]*?)<\/div>\s*<div class="ab">/);
      if (!cs || cs[1].trim() !== '') continue;
      out.push({
        kind: 'html', file: path.relative(ROOT, f),
        uid: (c.match(/data-uid="([^"]+)"/) || [])[1],
        ep: (c.match(/class="qe">([^<]*)</) || [])[1] || '',
        al: (c.match(/<div class="ac">([^<]*)<\/div>/) || [])[1] || '',
        qt: (c.match(/<div class="qt">([\s\S]*?)<\/div>/) || [])[1] || '',
        // data-rate は PDF の正答率と突き合わせて「同じ問題を見ているか」を確かめる材料
        rate: (m => m ? Number(m[1]) : null)(c.match(/data-rate="([0-9.]+)"/)),
      });
    }
  }
  return out;
}

if (require.main !== module) return;   // require されたときは書き換えを走らせない

// ── 収集 ───────────────────────────────────────────────────
const rows = [];

for (const f of fs.readdirSync(ROOT).filter(x => /^questions_.*\.json$/.test(x))) {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  for (const ch of (j.chapters || [])) for (const q of (ch.qs || [])) {
    if ((q.choices || []).length) continue;
    const a = readAnswer(q.ans_label || '');
    if (!a) { rows.push({ kind: 'json', file: f, uid: q.uid, ep: q.episode, al: q.ans_label, skip: 'NON-NUMERIC' }); continue; }
    const run = a.dec === null ? pickRun(q.qt, a.digits.length) : null;
    rows.push({
      kind: 'json', file: f, uid: q.uid, ep: q.episode, ek: epKey(q.episode), al: q.ans_label,
      digits: a.digits, dec: a.dec !== null ? a.dec : (run ? run.dec : null),
      tmpl: a.dec !== null || !!run, desc: a.desc, already: a.already,
      hasSub: !!(q.ans_sub || '').trim(),
    });
  }
}

const htmlFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const x = path.join(d, e.name);
    if (e.isDirectory()) walk(x); else if (/\.html$/.test(e.name)) htmlFiles.push(x);
  }
})(path.join(ROOT, '国家試験過去問'));

for (const f of htmlFiles) {
  const rel = path.relative(ROOT, f);
  for (const c of fs.readFileSync(f, 'utf8').split('<div class="qc"').slice(1)) {
    const uid = (c.match(/data-uid="([^"]+)"/) || [])[1];
    const ep = (c.match(/class="qe">([^<]*)</) || [])[1] || '';
    const cs = c.match(/<div class="cs">([\s\S]*?)<\/div>\s*<div class="ab">/);
    if (!cs || cs[1].trim() !== '') continue;           // 選択肢ありは対象外
    const qt = (c.match(/<div class="qt">([\s\S]*?)<\/div>/) || [])[1] || '';
    const al = (c.match(/<div class="ac">([^<]*)<\/div>/) || [])[1] || '';
    const a = readAnswer(al);
    if (!a) { rows.push({ kind: 'html', file: rel, uid, ep, al, skip: 'NON-NUMERIC' }); continue; }
    const run = a.dec === null ? pickRun(qt, a.digits.length) : null;
    rows.push({
      kind: 'html', file: rel, uid, ep, ek: epKey(ep), al,
      digits: a.digits, dec: a.dec !== null ? a.dec : (run ? run.dec : null),
      tmpl: a.dec !== null || !!run, desc: a.desc, already: a.already,
    });
  }
}

// ── 回数-問番で相互補完＋相互検証 ─────────────────────────
const calc = rows.filter(r => !r.skip);
const byEk = {};
calc.forEach(r => { (byEk[r.ek] = byEk[r.ek] || []).push(r); });
const conflicts = [];
let filled = 0;
for (const ek of Object.keys(byEk)) {
  const g = byEk[ek];
  if (g.length < 2) continue;
  const ds = [...new Set(g.map(r => r.digits))];
  if (ds.length > 1) { conflicts.push(`${ek} 桁が不一致: ${g.map(r => r.uid + '=' + r.digits).join(' / ')}`); continue; }
  const decs = [...new Set(g.filter(r => r.tmpl).map(r => r.dec))];
  if (decs.length > 1) { conflicts.push(`${ek} 小数点位置が不一致: ${g.map(r => r.uid + '=dec' + r.dec).join(' / ')}`); continue; }
  if (decs.length === 1) g.forEach(r => {
    if (!r.tmpl) { r.dec = decs[0]; r.filledFrom = g.find(x => x.tmpl).uid; filled++; }
  });
}
calc.forEach(r => { r.canon = '計算答：' + compose(r.digits, r.dec); });

if (conflicts.length) {
  console.error('✗ 相互検証で矛盾があるため中止:');
  conflicts.forEach(c => console.error('  ' + c));
  process.exit(1);
}

// ── 書き戻し ───────────────────────────────────────────────
// JSON は科目ごとに整形がバラバラ（CLAUDE.md）。全体を json.dumps し直すと1問直すだけで
// 全行が差分になるため、uid を起点に該当の ans_label / ans_sub だけを文字列置換する。
const jesc = s => JSON.stringify(s).slice(1, -1);

function patchJson(file, targets) {
  const abs = path.join(ROOT, file);
  let t = fs.readFileSync(abs, 'utf8');
  let n = 0;
  for (const r of targets) {
    const uidRe = new RegExp('"uid"\\s*:\\s*"' + r.uid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"');
    const um = uidRe.exec(t);
    if (!um) { console.error('  ! uid が見つからない: ' + r.uid); continue; }
    // uid の後ろにある最初の ans_label を差し替える
    const alRe = /"ans_label"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    alRe.lastIndex = um.index;
    const am = alRe.exec(t);
    if (!am) { console.error('  ! ans_label が見つからない: ' + r.uid); continue; }
    let repl = '"ans_label": "' + jesc(r.canon) + '"';
    let head = t.slice(0, am.index), tail = t.slice(am.index + am[0].length);
    // 自由記述だった説明文は ans_sub へ退避（空のときだけ・既存を潰さない）
    if (r.desc && !r.hasSub) {
      const subRe = /"ans_sub"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      subRe.lastIndex = 0;
      const sm = subRe.exec(tail);
      if (sm && sm[1] === '') {
        tail = tail.slice(0, sm.index) + '"ans_sub": "' + jesc(r.desc) + '"' + tail.slice(sm.index + sm[0].length);
      } else {
        console.error('  ! ans_sub が空でない/見つからない、説明文を退避せず: ' + r.uid);
      }
    }
    t = head + repl + tail;
    n++;
  }
  if (!DRY) fs.writeFileSync(abs, t, 'utf8');
  return n;
}

function patchHtml(file, targets) {
  const abs = path.join(ROOT, file);
  let t = fs.readFileSync(abs, 'utf8');
  let n = 0;
  for (const r of targets) {
    const uidRe = new RegExp('data-uid="' + r.uid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"');
    const um = uidRe.exec(t);
    if (!um) { console.error('  ! uid が見つからない: ' + r.uid); continue; }
    const acRe = /<div class="ac">([^<]*)<\/div>/g;
    acRe.lastIndex = um.index;
    const am = acRe.exec(t);
    if (!am) { console.error('  ! .ac が見つからない: ' + r.uid); continue; }
    t = t.slice(0, am.index) + '<div class="ac">' + r.canon + '</div>' + t.slice(am.index + am[0].length);
    n++;
  }
  if (!DRY) fs.writeFileSync(abs, t, 'utf8');
  return n;
}

const todo = calc.filter(r => r.canon !== r.al);
const byFile = {};
todo.forEach(r => { (byFile[r.file] = byFile[r.file] || []).push(r); });

console.log(`計算問題 ${calc.length}問（json ${calc.filter(r => r.kind === 'json').length} / 過去問 ${calc.filter(r => r.kind === 'html').length}）`);
console.log(`非計算でスキップ ${rows.filter(r => r.skip).length}問（選択肢が欠落した図・組合せ問題）`);
console.log(`小数点位置を相互補完 ${filled}件・相互検証の矛盾 0件`);
const noTmpl = calc.filter(r => !r.tmpl && r.filledFrom === undefined && r.dec === null);
if (noTmpl.length) console.log(`テンプレート無し（整数として確定）${noTmpl.length}件: ${noTmpl.map(r => r.uid).join(', ')}`);
console.log(`\n書き換え対象 ${todo.length}問${DRY ? '（--dry-run: 書き込みません）' : ''}\n`);

let done = 0;
for (const file of Object.keys(byFile).sort()) {
  const targets = byFile[file];
  targets.forEach(r => console.log(`  ${r.uid.padEnd(20)} ${JSON.stringify(r.al).padEnd(34)} -> ${JSON.stringify(r.canon)}${r.desc ? '  + ans_sub' : ''}`));
  const n = targets[0].kind === 'json' ? patchJson(file, targets) : patchHtml(file, targets);
  console.log(`  ${file}: ${n}/${targets.length} 件\n`);
  done += n;
}
console.log(`${DRY ? '(dry-run) ' : ''}完了: ${done}/${todo.length} 件`);
if (done !== todo.length) process.exit(1);
