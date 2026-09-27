// 同じ国試問題の重複コピーの索引 dup_index.js を作る（派生物）。
//
//   node _work/build_dup_index.js          書き出す
//   node _work/build_dup_index.js --check  現物と一致するかだけ見る（食い違えば exit 1）
//
// 同じ国試問題が科目・必修講座・必修講座Part2 などに別の uid で入っている。SRS はそれぞれを
// 別の問題として予定を持つので、復習キューに同じ問題が2回並び、件数も水増しされていた。
// ここで作る組を progress.js の MECSync.srsUnifyDups / srsIsShadow が使い、
//   ・組の中では復習予定を常に同じ値に揃える（どれか1つを解けば全員が同じ予定になる）
//   ・件数と出題は代表（組の先頭）だけを数える
// という扱いにする。「済」と正答率（myrate_v1）は uid ごとのまま（2026-09-27 ユーザー判断）。
//
// 組にする条件（3つとも満たすもの）:
//   ① episode の国試番号が同じ（「117E-29類」のような類題は除く）
//   ② 選択肢の文面の集合が同じ（記号・空白は落として比べる。hisshu2 は肢の並びを入れ替えている）
//   ③ 正解の肢の文面が同じ（計算問題は ans_label も一致）
// ⚠️ 実力試験Ⅰ（jitsu1）は国試番号が同じでも MEC が肢や設問を改変しているので、①だけで
//    組にすると別の問題を同一視する。②③がそれを弾く（2026-09-27 実測で約200組が中身違い）。
// ⚠️ custom / memo / jitsu1 / m121s は対象外（自作・暗記メモ・改変問題・模試）。
// ⚠️ 過去問ビューア（kakumon_*）は study.html の SRS に載らない経路なので対象外。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dup_index.js');
const EXCLUDE = new Set(['custom', 'memo', 'jitsu1', 'm121s']);
// 代表の優先順。解説がいちばん厚いのは科目の側なので、講座（必修）は後ろに回す。
const LATE = ['hisshu', 'hisshu2'];

const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/[\s　\u0001]/g, '');
const normChoice = t => strip(t).replace(/^[a-hａ-ｈ]/, '');
const choiceSet = q => (q.choices || []).map(c => normChoice(c.t)).sort().join('|');
const answerKey = q => (q.choices || []).filter(c => c.ok).map(c => normChoice(c.t)).sort().join('|')
  + '#' + (/^計算答/.test(q.ans_label || '') ? q.ans_label : '');
const prefixOf = uid => (uid.match(/^(.+?)_ch\d+_q\d+$/) || [])[1] || uid.split('_')[0];

function collect() {
  const files = fs.readdirSync(ROOT).filter(f => /^questions_.+\.json$/.test(f)).sort();
  const order = [];               // ファイル順＝科目の並び（代表の同着を決める）
  const qs = [];
  for (const f of files) {
    const sid = f.slice('questions_'.length, -'.json'.length);
    if (EXCLUDE.has(sid)) continue;
    order.push(sid);
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    (j.chapters || []).forEach(ch => (ch.qs || []).forEach(q => { if (q.uid) qs.push(q); }));
  }
  return { order, qs };
}

function build() {
  const { order, qs } = collect();
  const byNum = new Map();
  for (const q of qs) {
    for (const part of String(q.episode || '').split(/[／/,、]/)) {
      if (/類/.test(part)) continue;
      const m = part.match(/(1\d\d)\s*([A-I])\s*[-‐－]?\s*(\d+)/);
      if (!m) continue;
      const k = m[1] + m[2] + Number(m[3]);
      if (!byNum.has(k)) byNum.set(k, []);
      byNum.get(k).push(q);
    }
  }
  const rank = uid => {
    const p = prefixOf(uid);
    const late = LATE.indexOf(p);
    return (late >= 0 ? 1000 + late : order.indexOf(p));
  };
  const cmpUid = (a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    const na = a.match(/\d+/g).map(Number), nb = b.match(/\d+/g).map(Number);
    for (let i = 0; i < Math.max(na.length, nb.length); i++) if ((na[i] || 0) !== (nb[i] || 0)) return (na[i] || 0) - (nb[i] || 0);
    return a < b ? -1 : 1;
  };
  // 同じ uid が2つの国試番号に出ることはある（連問の番号併記）。union-find で畳む。
  const parent = new Map();
  const find = u => { while (parent.get(u) !== u) { parent.set(u, parent.get(parent.get(u))); u = parent.get(u); } return u; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  for (const list of byNum.values()) {
    const buckets = new Map();
    for (const q of list) {
      if (!(q.choices || []).length && !/^計算答/.test(q.ans_label || '')) continue;
      const key = choiceSet(q) + '@' + answerKey(q);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(q.uid);
    }
    for (const us of buckets.values()) {
      const uniq = [...new Set(us)];
      if (uniq.length < 2) continue;
      uniq.forEach(u => { if (!parent.has(u)) parent.set(u, u); });
      for (let i = 1; i < uniq.length; i++) union(uniq[0], uniq[i]);
    }
  }
  const groups = new Map();
  for (const u of parent.keys()) {
    const r = find(u);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(u);
  }
  return [...groups.values()].map(g => g.sort(cmpUid)).sort((a, b) => cmpUid(a[0], b[0]));
}

function render(groups) {
  const n = groups.reduce((s, g) => s + g.length, 0);
  return '// 派生物（node _work/build_dup_index.js が生成）。直接編集しないこと。\n'
    + '// 同じ国試問題の重複コピーの組。先頭が代表（復習の件数・出題に使う）。\n'
    + '// ' + groups.length + '組 ' + n + '問\n'
    + 'window.MEC_DUP_GROUPS=' + JSON.stringify(groups) + ';\n';
}

const groups = build();
const text = render(groups);
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('dup_index.js が古い。node _work/build_dup_index.js で作り直すこと'); process.exit(1); }
  console.log('dup_index.js OK (' + groups.length + '組)');
} else {
  fs.writeFileSync(OUT, text);
  console.log('dup_index.js: ' + groups.length + '組 ' + groups.reduce((s, g) => s + g.length, 0) + '問 '
    + (Buffer.byteLength(text) / 1024).toFixed(1) + 'KB');
}
