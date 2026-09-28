#!/usr/bin/env node
/**
 * UIテーマ別の CSS を作る（2026-09-28〜・派生物）。
 *
 *   node _work/build_theme_css.js           書き出す
 *   node _work/build_theme_css.js --check   現物と一致するかだけ見る（run_all.js が流す）
 *
 * 材料（人が編集する正本。ページはこれを直接読まない）:
 *   ui_theme.css  … 8テーマの着せ替え（study/index/stats/knowledge/mock/mock_karte が使う）
 *   index.css     … ハブ（index.html）の CSS。2026-09-28 に index.html のインライン <style> から外へ出した
 *
 * 出力（ページが読む）: theme_css/{材料名}.{テーマ}.css ＝ 8テーマ × 2 ＝ 16ファイル
 *   = 材料から「ほかの7テーマにしか当たらないルール」だけを取り除いたもの。
 *   ⚠️⚠️ ルールの並びは1つも入れ替えない。共通のルールとテーマのルールを別ファイルに分けると
 *   読み込み順が変わってカスケードの勝ち負けが変わりうるので、共通のルールは各テーマのファイルに
 *   そのまま残す（＝そのテーマの <html> に対しては、元の1ファイルと同じ結果になる）。
 *
 * 取り除く規則:
 *   - セレクタのリストをトップレベルのカンマで分け、`.ui-{ほかのテーマ}` を含み自分のテーマを含まない
 *     セレクタだけを落とす。全部落ちたらルールごと落とす。@media / @supports の中も同じ。
 *   - ⚠️ `:not(...)` の中に `.ui-` があるセレクタ（`html:not(.ui-brass) …`）は意味が反転するので残す。
 *     `[class*="ui-"]` も残す（テーマ名を含まない）。
 *   - @keyframes は、残ったルール・材料以外のファイル（study.css・JS など）のどこからも名前が
 *     参照されないときだけ落とす。
 *   - コメントは落とす（読むのは材料の方）。
 *
 * ページ側は <link> を直接書かず、`<script>MecUITheme.css('ui_theme')</script>` で書き出す
 * （ui_theme.js。テーマを切り替えたときは新しいファイルを読み終えてからクラスを付け替える）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'theme_css');
const THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
const SOURCES = ['ui_theme', 'index'];
const CHECK = process.argv.includes('--check');

// ── 字句: コメントを落とし、ブロックの木にする ─────────────────────────────
function stripComments(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) { if (css[j] === '\\') j++; j++; }
      out += css.slice(i, j + 1); i = j + 1;
    } else if (c === '/' && css[i + 1] === '*') {
      const j = css.indexOf('*/', i + 2);
      i = j < 0 ? css.length : j + 2;
    } else { out += c; i++; }
  }
  return out;
}

// { prelude, body }（body は宣言の文字列）または { prelude, children }（入れ子の at-rule）
const NESTED = /^@(media|supports|layer|container|document)\b/i;
function parse(css) {
  let i = 0;
  function block(top) {
    const items = [];
    while (i < css.length) {
      let j = i, depth = 0, q = null;
      // プレリュードを { または ; または } まで読む
      for (; j < css.length; j++) {
        const c = css[j];
        if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'") q = c;
        else if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (depth === 0 && (c === '{' || c === ';' || c === '}')) break;
      }
      const prelude = css.slice(i, j).trim();
      if (j >= css.length) { if (prelude) items.push({ stmt: prelude }); i = j; break; }
      if (css[j] === '}') {
        // ⚠️ 最上位に閉じ括弧が余っている＝材料の書き損じ。ブラウザは次のルールのセレクタごと
        //   捨てるので、黙って通さず止める（2026-09-28 に ui_theme.css の frost で実際にあった）
        if (top) throw new Error('対応する { の無い } がある（' + (css.slice(0, j).split('\n').length) + '行目付近・コメント除去後）: ' + prelude.slice(0, 60));
        i = j + 1; if (prelude) items.push({ stmt: prelude }); return items;
      }
      if (css[j] === ';') { items.push({ stmt: prelude + ';' }); i = j + 1; continue; }
      i = j + 1;
      if (NESTED.test(prelude)) { items.push({ prelude, children: block() }); continue; }
      // 葉のブロック（通常のルール・@keyframes・@font-face）: 対応する } まで丸ごと
      let d = 1, k = i; q = null;
      for (; k < css.length; k++) {
        const c = css[k];
        if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'") q = c;
        else if (c === '{') d++;
        else if (c === '}') { if (--d === 0) break; }
      }
      items.push({ prelude, body: css.slice(i, k) });
      i = k + 1;
    }
    return items;
  }
  return block(true);
}

function splitSelectors(s) {
  const out = []; let depth = 0, q = null, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(s.slice(last, i)); last = i + 1; }
  }
  out.push(s.slice(last));
  return out.map(x => x.trim()).filter(Boolean);
}

const THEME_RE = new RegExp('\\.ui-(' + THEMES.join('|') + ')(?![\\w-])', 'g');
function keepSelector(sel, theme) {
  if (/:not\([^)]*\.ui-/.test(sel)) return true;          // 反転の意味を持つ
  const hits = new Set(); let m;
  THEME_RE.lastIndex = 0;
  while ((m = THEME_RE.exec(sel))) hits.add(m[1]);
  return hits.size === 0 || hits.has(theme);
}

const isKeyframes = p => /^@(-webkit-)?keyframes\s/i.test(p);
const kfName = p => p.replace(/^@(-webkit-)?keyframes\s+/i, '').trim().replace(/^["']|["']$/g, '');

function filter(items, theme) {
  const out = [];
  for (const it of items) {
    if (it.stmt) { out.push(it); continue; }
    if (it.children) {
      const ch = filter(it.children, theme);
      if (ch.length) out.push({ prelude: it.prelude, children: ch });
      continue;
    }
    if (it.prelude.startsWith('@')) { out.push(it); continue; }
    const kept = splitSelectors(it.prelude).filter(s => keepSelector(s, theme));
    if (kept.length) out.push({ prelude: kept.join(',\n'), body: it.body });
  }
  return out;
}

function tidy(body, ind) {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return ' ' + (lines[0] || '') + ' ';
  return '\n' + lines.map(l => ind + '  ' + l).join('\n') + '\n' + ind;
}
function emit(items, ind = '') {
  return items.map(it => {
    if (it.stmt) return ind + it.stmt;
    if (it.children) return ind + it.prelude + ' {\n' + emit(it.children, ind + '  ') + '\n' + ind + '}';
    return ind + it.prelude.split('\n').join('\n' + ind) + ' {' + tidy(it.body, ind) + '}';
  }).join('\n');
}

// 材料の外（ページ・JS・ほかの CSS）で名前が出てくる @keyframes は落とさない
function outsideText(srcFile) {
  const skip = new Set([srcFile]);   // ⚠️ もう片方の材料は数える（ui_theme.css の @keyframes を index.css が使うことがある）
  let txt = '';
  for (const f of fs.readdirSync(ROOT)) {
    if (skip.has(f) || !/\.(html|js|css)$/.test(f)) continue;
    txt += fs.readFileSync(path.join(ROOT, f), 'utf8');
  }
  return txt;
}

function dropKeyframes(items, allNames, usedIn) {
  return items.filter(it => {
    if (it.children) { it.children = dropKeyframes(it.children, allNames, usedIn); return it.children.length > 0; }
    if (!it.prelude || !isKeyframes(it.prelude)) return true;
    return usedIn(kfName(it.prelude));
  });
}

function textOf(items) {
  return items.map(it => it.children ? it.prelude + textOf(it.children) : (it.prelude || '') + (it.body || it.stmt || '')).join('\n');
}

function build(src) {
  const file = src + '.css';
  const tree = parse(stripComments(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n')));
  const outside = outsideText(file);
  const res = {};
  for (const theme of THEMES) {
    const kept = filter(tree, theme);
    // 残ったルールの本文（@keyframes 自身を除く）
    const body = textOf(kept.map(function strip(it) {
      if (it.children) return { prelude: it.prelude, children: it.children.map(strip) };
      return it.prelude && isKeyframes(it.prelude) ? { stmt: '' } : it;
    }));
    const used = name => {
      const re = new RegExp('(^|[^\\w-])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])');
      return re.test(body) || re.test(outside);
    };
    const final = dropKeyframes(kept, null, used);
    res[theme] = '/* 生成物: node _work/build_theme_css.js が ' + file + ' から作る（' + theme +
      ' 以外のテーマのルールを除いたもの）。直接編集しないこと。 */\n' + emit(final) + '\n';
  }
  return res;
}

module.exports = { parse, stripComments, filter, splitSelectors, keepSelector, build, THEMES };
if (require.main === module) main();

function main() {
  let bad = 0;
  if (!CHECK) fs.mkdirSync(OUT, { recursive: true });
  for (const src of SOURCES) {
    const res = build(src);
    for (const theme of THEMES) {
      const dst = path.join(OUT, src + '.' + theme + '.css');
      if (CHECK) {
        const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : null;
        if (cur !== res[theme]) { console.log('食い違い: theme_css/' + src + '.' + theme + '.css'); bad++; }
      } else {
        fs.writeFileSync(dst, res[theme]);
        console.log('theme_css/' + src + '.' + theme + '.css  ' + (Buffer.byteLength(res[theme]) / 1024).toFixed(1) + 'KB');
      }
    }
  }
  if (CHECK) {
    if (bad) { console.log('→ node _work/build_theme_css.js で作り直すこと'); process.exit(1); }
    console.log('theme_css/ は材料と一致（' + SOURCES.length * THEMES.length + 'ファイル）');
  }
}
