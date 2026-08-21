#!/usr/bin/env node
// 既存9科目の _archive/mindmap_src/{科目}_mindmap.html から CHAPTERS / RELATIONS を取り出し、
// mindmap_data/{prefix}.js を生成する（段A・2026-08-21）。
//
// ⚠️ 正規表現でHTMLを刻まないこと。配列リテラルの範囲だけを括弧の対応で切り出し、
//    中身は vm で「実際に評価」する。既存テスト群（test_*.js）と同じ手口で、
//    引用符・入れ子・改行の取りこぼしが原理的に起きない。
//
// 生成時に以下を機械的に処理する:
//   - link:            捨てる（章別HTMLは _archive/ へ移動済みで全部404）
//   - color:           捨てる（章の色は「系統」ではなく隣接章を見分けるための回転パレットだった。
//                      移行後はエンジンが章インデックスから引く＝MM_PALETTE が唯一の正本）
//   - angle:           捨てる（エンジンが章数から自動計算する）
//   - imgs:            'images/x.jpeg' → '{科目}/images/x.jpeg' へ書き換え、存在しないものは落とす
//
// 使い方:
//   node _work/extract_mindmap_data.js            生成する
//   node _work/extract_mindmap_data.js --dry-run  レポートだけ出す

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'mindmap_data');
// 移行元は _archive/mindmap_src/（旧マップは 2026-08-21 にそこへ退避した）。
// ⚠️ 退避先を消さないこと。消すと、この抽出をやり直して結果を突き合わせることができなくなる。
const SRC_DIR = path.join(ROOT, '_archive', 'mindmap_src');
const DRY = process.argv.includes('--dry-run');

// フォルダ名 → questions_*.json の科目prefix（study.html?sid= がこれを受け取る）
const SUBJECTS = [
  { dir: '内分泌',   sid: 'endo' },
  { dir: '呼吸器',   sid: 'resp' },
  { dir: '循環器',   sid: 'circ' },
  { dir: '消化器',   sid: 'dige' },
  { dir: '神経',     sid: 'neur' },
  { dir: '肝胆膵',   sid: 'hbp' },
  { dir: '腎臓',     sid: 'jinzo_d' },
  { dir: '血液',     sid: 'hema' },
  { dir: '免アレ膠', sid: 'imma' },
];

// ── 配列リテラルの範囲を括弧の対応で切り出す ───────────────────────
// 文字列（' " `）と行/ブロックコメントの中の括弧は数えない。
function sliceArrayLiteral(src, declRe) {
  const m = declRe.exec(src);
  if (!m) return null;
  let i = src.indexOf('[', m.index + m[0].length - 1);
  if (i < 0) return null;
  const start = i;
  let depth = 0;
  let quote = null;      // ' " ` のいずれか
  let comment = null;    // 'line' | 'block'
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (comment === 'line') { if (c === '\n') comment = null; continue; }
    if (comment === 'block') { if (c === '*' && n === '/') { comment = null; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { comment = 'line'; i++; continue; }
    if (c === '/' && n === '*') { comment = 'block'; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

function evalArray(literal, what, where) {
  try {
    return vm.runInNewContext('(' + literal + ')', Object.create(null), { timeout: 5000 });
  } catch (e) {
    throw new Error(`${where}: ${what} の評価に失敗しました — ${e.message}`);
  }
}

// ── 抽出 ────────────────────────────────────────────────────────
const report = { imgOk: 0, imgMissing: [], noKeys: [], relDropped: [], chapters: 0, diseases: 0, relations: 0 };

function extract(sub) {
  const file = path.join(SRC_DIR, sub.dir + '_mindmap.html');
  const src = fs.readFileSync(file, 'utf8');

  const chLit = sliceArrayLiteral(src, /const\s+CHAPTERS\s*=\s*\[/);
  if (!chLit) throw new Error(`${sub.dir}: CHAPTERS が見つかりません`);
  const relLit = sliceArrayLiteral(src, /const\s+RELATIONS\s*=\s*\[/);

  const CHAPTERS = evalArray(chLit, 'CHAPTERS', sub.dir);
  const RELATIONS = relLit ? evalArray(relLit, 'RELATIONS', sub.dir) : [];

  const known = new Set();
  const chapters = CHAPTERS.map((ch, ci) => {
    const diseases = (ch.diseases || []).map(d => {
      known.add(d.id);
      const imgs = [];
      (d.imgs || []).forEach(rel => {
        // 科目フォルダ相対 → リポジトリルート相対
        const full = rel.startsWith(sub.dir + '/') ? rel : `${sub.dir}/${rel}`;
        if (fs.existsSync(path.join(ROOT, full))) { imgs.push(full); report.imgOk++; }
        else report.imgMissing.push(`${sub.sid} ${d.id} ${full}`);
      });
      const keys = (d.keys || []).filter(k => String(k).trim());
      if (!keys.length) report.noKeys.push(`${sub.sid} ${d.id} ${d.label}`);
      report.diseases++;
      return { id: d.id, label: d.label, imgs, keys };
    });
    report.chapters++;
    return { id: ch.id, label: ch.label, diseases };
  });

  const relations = [];
  RELATIONS.forEach(r => {
    const from = r.from, to = r.to;
    if (!known.has(from) || !known.has(to)) { report.relDropped.push(`${sub.sid} ${from}→${to}（存在しない疾患ID）`); return; }
    const o = { from, to };
    if (r.label) o.label = r.label;
    if (r.explain) o.explain = r.explain;
    relations.push(o);
    report.relations++;
  });

  return { sid: sub.sid, chapters, relations };
}

// ── 書き出し ────────────────────────────────────────────────────
// 読みやすさのため疾患1件＝1行にする（差分レビューできる形）。
function emit(data) {
  const L = [];
  L.push('// 自動生成: node _work/extract_mindmap_data.js — 直接編集してよいが、再生成で消える');
  L.push('// 章の色・角度はここに持たない（エンジンが章インデックスから引く）。');
  L.push('window.MM_DATA = window.MM_DATA || {};');
  L.push(`window.MM_DATA[${JSON.stringify(data.sid)}] = {`);
  L.push(`  sid: ${JSON.stringify(data.sid)},`);
  L.push('  chapters: [');
  data.chapters.forEach(ch => {
    L.push(`    { id: ${JSON.stringify(ch.id)}, label: ${JSON.stringify(ch.label)}, diseases: [`);
    ch.diseases.forEach(d => {
      L.push(`      { id: ${JSON.stringify(d.id)}, label: ${JSON.stringify(d.label)}, imgs: ${JSON.stringify(d.imgs)},`);
      L.push(`        keys: ${JSON.stringify(d.keys)} },`);
    });
    L.push('    ] },');
  });
  L.push('  ],');
  L.push('  relations: [');
  data.relations.forEach(r => { L.push(`    ${JSON.stringify(r)},`); });
  L.push('  ],');
  L.push('};');
  return L.join('\n') + '\n';
}

// ── ハブ（統合マップ）─────────────────────────────────────────────
// ⚠️ ハブは科目マップの射影ではなく、独立に選抜された「科目あたり8疾患」の見取り図。
//    ラベルの対応は72件中55件しかなく、keys の粒度も違う（科目全体を俯瞰する高さで書かれている）。
//    したがって科目データから生成せず、mindmap_integrated.html の内容をそのまま引き継ぐ。
const HUB_SID = { endo:'endo', circ:'circ', resp:'resp', neur:'neur', gi:'dige',
                  hbp:'hbp', jinzo:'jinzo_d', immare:'imma', hema:'hema' };

function extractHub() {
  const src = fs.readFileSync(path.join(SRC_DIR, 'mindmap_integrated.html'), 'utf8');
  const S  = evalArray(sliceArrayLiteral(src, /const\s+SUBJECTS\s*=\s*\[/), 'SUBJECTS', 'hub');
  const C  = evalArray(sliceArrayLiteral(src, /const\s+CROSS\s*=\s*\[/),    'CROSS',    'hub');
  const SA = evalArray(sliceArrayLiteral(src, /const\s+SAME\s*=\s*\[/),     'SAME',     'hub');

  const known = new Set();
  const subjects = S.map(s => {
    const sid = HUB_SID[s.id];
    if (!sid) throw new Error(`hub: 科目id ${s.id} の prefix が未定義`);
    const diseases = s.diseases.map(d => {
      known.add(d.id);
      return { id: d.id, label: d.label, keys: (d.keys || []).filter(k => String(k).trim()) };
    });
    return { sid, diseases };
  });

  const relations = [];
  [...C, ...SA].forEach(r => {
    if (!known.has(r.f) || !known.has(r.t)) { report.relDropped.push(`hub ${r.f}→${r.t}（存在しない疾患ID）`); return; }
    const o = { from: r.f, to: r.t };
    if (r.lb) o.label = r.lb;
    if (r.explain) o.explain = r.explain;
    relations.push(o);
  });
  return { subjects, relations };
}

function emitHub(h) {
  const L = [];
  L.push('// 自動生成: node _work/extract_mindmap_data.js — 直接編集してよいが、再生成で消える');
  L.push('// ハブ（全科目マップ）の代表疾患。科目マップとは別に選抜されたもので、射影ではない。');
  L.push('window.MM_HUB = {');
  L.push('  subjects: [');
  h.subjects.forEach(s => {
    L.push(`    { sid: ${JSON.stringify(s.sid)}, diseases: [`);
    s.diseases.forEach(d => {
      L.push(`      { id: ${JSON.stringify(d.id)}, label: ${JSON.stringify(d.label)},`);
      L.push(`        keys: ${JSON.stringify(d.keys)} },`);
    });
    L.push('    ] },');
  });
  L.push('  ],');
  L.push('  relations: [');
  h.relations.forEach(r => { L.push(`    ${JSON.stringify(r)},`); });
  L.push('  ],');
  L.push('};');
  return L.join('\n') + '\n';
}

// ── main ────────────────────────────────────────────────────────
const all = [];
for (const sub of SUBJECTS) {
  const data = extract(sub);
  all.push({ sub, data });
}

const hub = extractHub();

if (!DRY) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const { data } of all) {
    fs.writeFileSync(path.join(OUT_DIR, data.sid + '.js'), emit(data), 'utf8');
  }
  fs.writeFileSync(path.join(OUT_DIR, '_hub.js'), emitHub(hub), 'utf8');
}

console.log('=== マインドマップ データ抽出 ' + (DRY ? '(--dry-run)' : '') + ' ===');
for (const { sub, data } of all) {
  const dis = data.chapters.reduce((s, c) => s + c.diseases.length, 0);
  const img = data.chapters.reduce((s, c) => s + c.diseases.reduce((t, d) => t + d.imgs.length, 0), 0);
  console.log(`  ${sub.sid.padEnd(8)} 章${String(data.chapters.length).padStart(3)}  疾患${String(dis).padStart(4)}  関連${String(data.relations.length).padStart(3)}  画像${String(img).padStart(3)}`);
}
console.log(`  ---- 合計 章${report.chapters} 疾患${report.diseases} 関連${report.relations} 画像${report.imgOk}`);
console.log(`  hub      科目${hub.subjects.length}  疾患${hub.subjects.reduce((n,s)=>n+s.diseases.length,0)}  関連${hub.relations.length}`);

if (report.imgMissing.length) {
  console.log(`\n⚠️ 存在しない画像を ${report.imgMissing.length} 件落としました:`);
  report.imgMissing.forEach(s => console.log('   ' + s));
}
if (report.noKeys.length) {
  console.log(`\n⚠️ keys が空の疾患 ${report.noKeys.length} 件:`);
  report.noKeys.forEach(s => console.log('   ' + s));
}
if (report.relDropped.length) {
  console.log(`\n⚠️ 落とした関連 ${report.relDropped.length} 件:`);
  report.relDropped.forEach(s => console.log('   ' + s));
}
if (!DRY) console.log(`\n書き出し: mindmap_data/*.js（${all.length}件）`);
