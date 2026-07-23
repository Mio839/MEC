/**
 * ベース配色テーマの検証（2026-07-23）
 *
 *   node _work/check_themes.js
 *
 * vars.css の :root（既定テーマ）と html.th-* を実際に読み、
 * chapters_meta.js の科目色と突き合わせて次を確認する:
 *
 *   A. カード面（--bg-g1 の上に --glass-rgb を6%重ねた色）の相対輝度 <= 0.0235
 *      科目色はこの明るさを上限として導出されているので、超えると全科目色が基準割れする。
 *   B. --tx / --ts がカード面に対して 4.5:1 以上
 *   C. 科目色（chapters_meta.js の全科目）がカード面に対して 4.5:1 以上
 *
 * テーマを足す・値を触ったら必ず通すこと。異常があれば終了コード1。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CAP = 0.0235;

const s2l = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hex2rgb = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255);
const relLum = r => { const [a, b, c] = r.map(s2l); return 0.2126 * a + 0.7152 * b + 0.0722 * c; };
const ratio = (a, b) => { const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// ⚠️ コメントを先に落とすこと。解説文中の ":root" や "html.th-*" という文字列を
//    セレクタとして拾ってしまい、別テーマの値を既定として読む事故が実際に起きた。
const css = fs.readFileSync(path.join(ROOT, 'vars.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// セレクタ直下のブロックから宣言を拾う
function block(sel) {
  const i = css.indexOf(sel + ' {') >= 0 ? css.indexOf(sel + ' {') : css.indexOf(sel + '{');
  if (i < 0) return null;
  const s = css.indexOf('{', i), e = css.indexOf('}', s);
  const out = {};
  css.slice(s + 1, e).split(';').forEach(d => {
    const m = d.match(/(--[a-z0-9-]+)\s*:\s*(.+)/i);
    if (m) out[m[1].trim()] = m[2].trim();
  });
  return out;
}

// 既定テーマ = 最初の :root（ベーストークン）+ 2番目の :root（--tx/--ts 等）
const rootBlocks = [];
// ":root" の直後が空白＋{ のものだけ＝実際のルールに限定する
for (const m of css.matchAll(/:root\s*\{/g)) {
  const s = m.index + m[0].length - 1, e = css.indexOf('}', s);
  const o = {};
  css.slice(s + 1, e).split(';').forEach(d => {
    const mm = d.match(/(--[a-z0-9-]+)\s*:\s*(.+)/i);
    if (mm) o[mm[1].trim()] = mm[2].trim();
  });
  rootBlocks.push(o);
}
const base = Object.assign({}, ...rootBlocks);

// html.th-* を列挙
const ids = [...new Set([...css.matchAll(/html\.th-([a-z-]+)\s*\{/g)].map(m => m[1]))];

// 科目色
const sb = {}; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'chapters_meta.js'), 'utf8') + '\n;globalThis.__C=MEC_CHAPTERS;', sb);
const SUBJ = sb.__C.map(s => ({ id: s.id, hex: s.color }));

function evaluate(name, tok) {
  const bg = tok['--bg-g1'], glass = tok['--glass-rgb'], tx = tok['--tx'], ts = tok['--ts'];
  const miss = [];
  if (!bg) miss.push('--bg-g1');
  if (!glass) miss.push('--glass-rgb');
  if (!tx) miss.push('--tx');
  if (!ts) miss.push('--ts');
  if (miss.length) return { name, bad: ['トークン欠落: ' + miss.join(', ')] };

  const b = hex2rgb(bg), g = glass.split(',').map(n => +n / 255);
  const surf = b.map((v, i) => 0.06 * g[i] + 0.94 * v);
  const sl = relLum(surf);
  const txR = ratio(hex2rgb(tx), surf);
  const tsR = ratio(hex2rgb(ts), surf);
  const subj = SUBJ.map(s => ({ id: s.id, r: ratio(hex2rgb(s.hex), surf) })).sort((a, b2) => a.r - b2.r);

  const bad = [];
  if (sl > CAP) bad.push('カード面が明るすぎる L=' + sl.toFixed(4) + ' > ' + CAP + '（科目色が基準割れする）');
  if (txR < 4.5) bad.push('--tx が ' + txR.toFixed(2) + ':1');
  if (tsR < 4.5) bad.push('--ts が ' + tsR.toFixed(2) + ':1');
  if (subj[0].r < 4.5) bad.push('科目色 最小 ' + subj[0].r.toFixed(2) + ':1 (' + subj[0].id + ')');
  return { name, sl, txR, tsR, subjMin: subj[0].r, bad };
}

const results = [evaluate('既定（深夜のインディゴ）', base)];
ids.forEach(id => {
  const tok = Object.assign({}, base, block('html.th-' + id), block('html.th-' + id + ' body') || {});
  results.push(evaluate('th-' + id, tok));
});

let fail = 0;
results.forEach(r => {
  if (r.bad.length) fail++;
  const head = (r.bad.length ? 'NG ' : 'OK ') + r.name.padEnd(24);
  console.log(r.sl === undefined ? head
    : head + '面L=' + r.sl.toFixed(4) + '  tx=' + r.txR.toFixed(1) + ':1  ts=' + r.tsR.toFixed(1) + ':1  科目最小=' + r.subjMin.toFixed(2) + ':1');
  r.bad.forEach(b => console.log('     → ' + b));
});
console.log('\n' + (fail ? fail + ' テーマが不合格' : results.length + ' テーマすべて合格'));
process.exit(fail ? 1 : 0);
