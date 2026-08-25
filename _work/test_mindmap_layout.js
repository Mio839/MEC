#!/usr/bin/env node
// マインドマップのレイアウトとデータ整合（2026-08-21・段A）
//
// 実ソース（mindmap.js）と実データ（mindmap_data/*.js）を読み込んで検査する。
// ロジックの二重管理をしない＝寸法定数を変えたらここが落ちる。
//
//   node _work/test_mindmap_layout.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  … ' + extra : '')); }
}
function section(t) { console.log('\n' + t); }

// ── 実ソースを読む ──────────────────────────────────────────────
const sandbox = { window: null, console, performance: { now: () => 0 },
                  requestAnimationFrame: () => 0, setTimeout, clearTimeout, document: undefined };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'mindmap.js'), 'utf8'), sandbox, { filename: 'mindmap.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'mindmap_data', 'index.js'), 'utf8'), sandbox);

const E = sandbox.MMEngine;
const D = E.dims;
const SUBJECTS = sandbox.MM_SUBJECTS;

section('1. エンジンの公開面');
ok(typeof E.boot === 'function', 'MMEngine.boot がある');
ok(typeof E.computeLayout === 'function', 'MMEngine.computeLayout がある');
ok(Array.isArray(E.MM_PALETTE) && E.MM_PALETTE.length >= 11, 'MM_PALETTE が11色以上ある', 'len=' + E.MM_PALETTE.length);
ok(new Set(E.MM_PALETTE).size === E.MM_PALETTE.length, 'MM_PALETTE に重複が無い');

section('2. 科目レジストリ');
// ⚠️ 科目数を直接書かない。レジストリは gamify.js の SUBJECTS から
//    _work/build_mindmap_index.js が生成する派生物なので、科目を1つ足すたびに
//    ここを直す羽目になる。gamify.js 側の id 数と突き合わせる。
const _gam = fs.readFileSync(path.join(ROOT, 'gamify.js'), 'utf8');
//    非コア科目（jitsu1/custom/memo）は build_mindmap_index.js の SKIP と同じく除く。
const _skip = new Set(['jitsu1', 'custom', 'memo']);
const _gamIds = [...(_gam.slice(_gam.indexOf('SUBJECTS'), _gam.indexOf('SUBJECTS') + 4000)
  .matchAll(/\bid:\s*'([a-z_0-9]+)'/g))].map(m => m[1]).filter(x => !_skip.has(x));
ok(SUBJECTS.length === _gamIds.length, 'gamify.js の科目数とレジストリが一致している',
   'registry=' + SUBJECTS.length + ' gamify=' + _gamIds.length);
ok(_gamIds.every(id => SUBJECTS.some(s => s.sid === id)),
   'gamify.js の全科目がレジストリにある',
   '欠け=' + _gamIds.filter(id => !SUBJECTS.some(s => s.sid === id)).join(','));
ok(SUBJECTS.filter(s => s.ready).length >= 9, 'ready な科目が9以上ある');
ok(new Set(SUBJECTS.map(s => s.sid)).size === SUBJECTS.length, 'sid が重複していない');
ok(SUBJECTS.every(s => /^#[0-9A-Fa-f]{6}$/.test(s.color)), '色が全部6桁hex');

// ── データを読む ────────────────────────────────────────────────
const ready = SUBJECTS.filter(s => s.ready);
ready.forEach(s => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'mindmap_data', s.sid + '.js'), 'utf8'), sandbox);
});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'mindmap_data', '_hub.js'), 'utf8'), sandbox);
const MM_DATA = sandbox.MM_DATA || {};
const MM_HUB = sandbox.MM_HUB;

section('3. データが読める');
ok(ready.every(s => MM_DATA[s.sid]), 'ready な科目のデータが全部ある');
ok(MM_HUB && Array.isArray(MM_HUB.subjects), 'ハブのデータがある');

// ── レイアウト検査の道具 ────────────────────────────────────────
function subjectParents(sid) {
  return MM_DATA[sid].chapters.map((ch, ci) => ({
    id: ch.id, label: ch.label, color: E.MM_PALETTE[ci % E.MM_PALETTE.length], children: ch.diseases,
  }));
}
function hubParents() {
  const by = {};
  MM_HUB.subjects.forEach(s => { by[s.sid] = s; });
  return SUBJECTS.filter(s => by[s.sid]).map(s => ({
    id: s.sid, label: s.label, color: s.color, children: by[s.sid].diseases,
  }));
}
function minPairDist(pts) {
  let m = Infinity, who = '';
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < m) { m = d; who = pts[i].id + ' × ' + pts[j].id; }
    }
  }
  return { m, who };
}
function childPoints(layout) {
  return Object.keys(layout.nodes).map(id => ({ id, x: layout.nodes[id].x, y: layout.nodes[id].y }));
}

const CHILD_MIN = 2 * D.DIS_R + 4;
const PARENT_MIN = 2 * D.CH_R + 4;
const MIX_MIN = D.DIS_R + D.CH_R + 4;

section('4. 科目マップ：全章を開いてもノードが重ならない');
ready.forEach(s => {
  const parents = subjectParents(s.sid);
  const layout = E.computeLayout(parents, () => true);
  const kids = childPoints(layout);
  const a = minPairDist(kids);
  ok(a.m >= CHILD_MIN, `${s.sid}: 疾患ノード同士 ≥ ${CHILD_MIN}px`, `min=${a.m.toFixed(1)} (${a.who})`);
  const par = layout.parents.map((p, i) => ({ id: 'ch' + i, x: p.x, y: p.y }));
  const b = minPairDist(par);
  ok(par.length < 2 || b.m >= PARENT_MIN, `${s.sid}: 章ノード同士 ≥ ${PARENT_MIN}px`, `min=${b.m.toFixed(1)}`);
  let mix = Infinity;
  kids.forEach(k => par.forEach(p => { mix = Math.min(mix, Math.hypot(k.x - p.x, k.y - p.y)); }));
  ok(mix >= MIX_MIN, `${s.sid}: 疾患と章 ≥ ${MIX_MIN}px`, `min=${mix.toFixed(1)}`);
});

section('5. 科目マップ：開閉しても他の章のノードが動かない');
// ⚠️ ここが落ちたら「扇は必要なぶんだけ取る」の min が外れている。
//    位置が開閉で動くと「どこにあったか」の記憶が壊れる＝俯瞰の道具として成立しなくなる。
ready.forEach(s => {
  const parents = subjectParents(s.sid);
  const all = E.computeLayout(parents, () => true);
  const one = E.computeLayout(parents, i => i !== 0);   // 先頭の章だけ閉じる
  let moved = 0, sample = '';
  Object.keys(one.nodes).forEach(id => {
    const a = all.nodes[id], b = one.nodes[id];
    if (!a) return;
    if (Math.hypot(a.x - b.x, a.y - b.y) > 0.5) { moved++; if (!sample) sample = id; }
  });
  ok(moved === 0, `${s.sid}: 1章を閉じても他章の疾患が動かない`, `動いた=${moved} 例=${sample}`);
});

section('6. ハブ：隣り合う科目を同時に開いても重ならない');
const hp = hubParents();
ok(hp.length === ready.length, 'ハブの科目数＝レジストリの作成済み科目数（新科目はハブにも代表疾患を足す）', `len=${hp.length} ready=${ready.length}`);
for (let start = 0; start < hp.length; start++) {
  const openIdx = new Set();
  for (let k = 0; k < D.HUB_MAX_OPEN; k++) openIdx.add((start + k) % hp.length);
  const layout = E.computeLayout(hp, i => openIdx.has(i));
  const kids = childPoints(layout);
  const a = minPairDist(kids);
  ok(a.m >= CHILD_MIN, `ハブ: ${[...openIdx].join(',')} を開いて疾患が重ならない`, `min=${a.m.toFixed(1)} (${a.who})`);
}

section('7. ハブ：21科目まで増えても重ならない（段C の先取り検査）');
// 未作成12科目は「代表疾患8つ」で埋めた仮データを置いて幾何だけを見る。
const fake = SUBJECTS.map((s, i) => ({
  id: s.sid, label: s.label, color: s.color,
  children: Array.from({ length: 8 }, (_, k) => ({ id: s.sid + '_f' + k, label: 'X', keys: ['x'] })),
}));
for (let start = 0; start < fake.length; start += 3) {
  const openIdx = new Set();
  for (let k = 0; k < D.HUB_MAX_OPEN; k++) openIdx.add((start + k) % fake.length);
  const layout = E.computeLayout(fake, i => openIdx.has(i));
  const a = minPairDist(childPoints(layout));
  ok(a.m >= CHILD_MIN, `21科目ハブ: ${[...openIdx].join(',')} を開いて重ならない`, `min=${a.m.toFixed(1)}`);
}
{
  const layout = E.computeLayout(fake, () => false);
  const par = layout.parents.map((p, i) => ({ id: 'p' + i, x: p.x, y: p.y }));
  const b = minPairDist(par);
  ok(b.m >= PARENT_MIN, `21科目ハブ: 科目ノード同士 ≥ ${PARENT_MIN}px`, `min=${b.m.toFixed(1)}`);
}

section('8. 章数22（感染症）でも載る');
// 感染症は22章。1周16.4°しかないので、扇に入りきらない疾患は外側のリングへ積まれる。
const many = Array.from({ length: 22 }, (_, i) => ({
  id: 'ch' + i, label: '章' + i, color: E.MM_PALETTE[i % E.MM_PALETTE.length],
  children: Array.from({ length: 6 }, (_, k) => ({ id: 'ch' + i + '_d' + k, label: 'X', keys: ['x'] })),
}));
{
  const layout = E.computeLayout(many, () => true);
  const a = minPairDist(childPoints(layout));
  ok(a.m >= CHILD_MIN, '22章×6疾患を全部開いて重ならない', `min=${a.m.toFixed(1)} (${a.who})`);
  const par = layout.parents.map((p, i) => ({ id: 'p' + i, x: p.x, y: p.y }));
  ok(minPairDist(par).m >= PARENT_MIN, '22章の章ノードが重ならない', `min=${minPairDist(par).m.toFixed(1)}`);
  const rings = Math.max(...layout.parents.map(p => p.rings.length));
  ok(rings >= 2, '入りきらない疾患が外側のリングへ積まれている', 'rings=' + rings);
  ok(Object.keys(layout.nodes).length === 22 * 6, '疾患が1つも捨てられていない', 'n=' + Object.keys(layout.nodes).length);
}

section('9. データの中身');
ready.forEach(s => {
  const d = MM_DATA[s.sid];
  const ids = [];
  let noKeys = 0, badImg = 0;
  d.chapters.forEach(ch => ch.diseases.forEach(dis => {
    ids.push(dis.id);
    if (!dis.keys || !dis.keys.length) noKeys++;
    (dis.imgs || []).forEach(p => { if (!fs.existsSync(path.join(ROOT, p))) badImg++; });
  }));
  ok(new Set(ids).size === ids.length, `${s.sid}: 疾患IDが重複していない`);
  ok(noKeys === 0, `${s.sid}: keys が空の疾患が無い`, 'n=' + noKeys);
  ok(badImg === 0, `${s.sid}: 画像が全部実在する`, 'n=' + badImg);
  const known = new Set(ids);
  const bad = (d.relations || []).filter(r => !known.has(r.from) || !known.has(r.to));
  ok(bad.length === 0, `${s.sid}: 関連の両端が実在する`, 'n=' + bad.length);
  ok(d.chapters.every(ch => !('color' in ch) && !('angle' in ch) && !('link' in ch)),
     `${s.sid}: 章に color/angle/link を持たない`);
});
{
  const known = new Set();
  MM_HUB.subjects.forEach(s => s.diseases.forEach(d => known.add(d.id)));
  const bad = MM_HUB.relations.filter(r => !known.has(r.from) || !known.has(r.to));
  ok(bad.length === 0, 'ハブ: 関連の両端が実在する', 'n=' + bad.length);
  const sids = new Set(SUBJECTS.map(s => s.sid));
  ok(MM_HUB.subjects.every(s => sids.has(s.sid)), 'ハブ: 科目sidがレジストリに実在する');
}

section('10. 不変条件（描画）');
// ⚠️ コメントを落としてから検査すること。禁止した語（filter:url / feGaussianBlur / infinite）は
//    「なぜ禁止か」を説明する注意書きの中にわざと書いてあるので、素で grep すると必ず誤検出する。
function stripComments(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ 	]*\/\/.*$/gm, ' ');
}
const src = stripComments(fs.readFileSync(path.join(ROOT, 'mindmap.js'), 'utf8'));
const css = stripComments(fs.readFileSync(path.join(ROOT, 'mindmap.css'), 'utf8'));
ok(!/filter\s*:\s*url\(/.test(src) && !/filter\s*:\s*url\(/.test(css), 'SVGフィルタを使っていない');
ok(!/feGaussianBlur/.test(src), 'feGaussianBlur が無い');
ok(!/infinite/.test(css) && !/infinite/.test(src), 'infinite アニメーションが1つも無い');
ok(!/style\.transform\s*=/.test(src), 'CSS transform で盤面を拡縮していない');
ok(/setAttribute\('viewBox'/.test(src), 'viewBox 駆動のパン／ズームである');
ok(/prefers-reduced-motion/.test(css), 'reduced-motion を見ている');
ok(/setTimeout\(/.test(src) && /rAF|requestAnimationFrame/.test(src), 'panTo に rAF が止まった時の落とし所がある');

// ⚠️⚠️ 2026-08-22の回帰。疾患ノード <g class="mm-dis"> の位置は SVG の transform 属性で
//    与えているので、CSS 側で transform を動かすと属性ごと上書きされ、全ノードが原点
//    （盤面の中央）へ折り重なる＝病名が中央に白文字で山になる。独立プロパティの
//    scale / translate / rotate なら合成されるので、動かすならそちらを使う。
{
  const kf = {};                                   // keyframes名 → 本文
  const rxKf = /@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = rxKf.exec(css))) kf[m[1]] = m[2];
  const movesTransform = new Set(
    Object.keys(kf).filter(n => /(^|[\s;{])transform\s*:/.test(kf[n])));

  const bad = [];
  const rxRule = /([^{}]+)\{([^{}]*)\}/g;
  while ((m = rxRule.exec(css))) {
    const sel = m[1].trim(), body = m[2];
    if (!/\.mm-(dis|par)\b/.test(sel)) continue;    // transform属性で置いている要素だけ見る
    if (/(^|[\s;{])transform\s*:/.test(body)) { bad.push(sel + ' が transform を直接指定'); continue; }
    const anim = /animation(?:-name)?\s*:\s*([^;]+)/.exec(body);
    if (!anim) continue;
    const words = anim[1].split(/[\s,]+/).filter(Boolean);
    words.forEach(w => { if (movesTransform.has(w)) bad.push(sel + ' → @keyframes ' + w); });
  }
  ok(bad.length === 0, 'ノード（.mm-dis / .mm-par）の transform を CSS で動かしていない', bad.join(' / '));

  // 走らなければ二度と見えない書き方をしていないか（非表示タブ・reduced-motion）
  const disIn = /\.mm-dis-in\s*\{([^{}]*)\}/.exec(css);
  ok(disIn && !/opacity\s*:\s*0/.test(disIn[1]),
     '.mm-dis-in のベース規則に opacity:0 が無い（アニメが走らなくても見える）');
  const edge = /\.mm-edge-c\s*\{([^{}]*)\}/.exec(css);
  ok(edge && !/stroke-dashoffset/.test(edge[1]),
     '.mm-edge-c のベース規則に stroke-dashoffset が無い（走らなくても実線で出る）');
  ok(/prefers-reduced-motion[\s\S]*\.mm-dis-in/.test(css),
     'reduced-motion で入場アニメを止めている');
}

console.log(`\n${pass + fail} 件中 ${pass} 件成功` + (fail ? ` / ${fail} 件失敗` : ''));
process.exit(fail ? 1 : 0);
