/*
 * test_body_containing_block.js — §13 Z5（再発防止の門番）
 *
 * `<body>` / `<html>` に transform / filter / backdrop-filter / perspective / will-change /
 * contain を掛けてはいけない。これらが none 以外の要素は **position:fixed の子孫の
 * 包含ブロック**になるので、`#mecFxCanvas`（fixed / inset:0 / 100%）の基準がビューポートから
 * 文書全体の高さへ切り替わり、キャンバスの絵が丸ごと縦に引き伸ばされる。
 *
 * 実測（2026-08-26・麻酔科52問・1920×1080）:
 *   zone OFF … キャンバスの CSS ボックス 1905×1080
 *   zone ON  … 1905×18680（17.3倍）／解説を開いた状態では 28235（28.7倍）
 * 同心円リングは上下が画面外へ抜け、左右の脇腹だけが天地を貫く縦線として残る。
 *
 * CLAUDE.md の「document.body を transform してはいけない」は **JS 側しか守られておらず**、
 * CSS 側は完全に無防備だった（自律進化ループが2026-08-23〜24 に8個まとめて入れられた）。
 * この門番はそこを塞ぐ。
 *
 * ⚠️ 疑似要素（`body::before` など）は別の箱なので対象外。禁じるのは **body/html 自身**。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 包含ブロックを作ってしまうプロパティ。
// （`contain` は paint / layout / strict / content のときだけだが、区別せず一律に禁じる。
//   body に contain を掛けたい理由が無いので、粗いままで実害が無い。）
const BANNED = ['transform', 'filter', 'backdrop-filter', 'perspective', 'will-change', 'contain'];
// 宣言の先頭（`{` か `;` の直後）にあるものだけを拾う＝`transform-origin` や
// `drop-shadow()` の中身、`backdrop-filter` の "filter" 部分を誤検出しない。
const DECL_RE = new RegExp(
  '(?:^|[;{])\\s*(?:-webkit-|-moz-|-ms-)?(' + BANNED.join('|') + ')\\s*:',
  'gi'
);

let failures = 0;
let checked = 0;

function fail(msg) { failures++; console.error('  ✗ ' + msg); }

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** `prelude { body }` を1階層ぶん切り出す（ネストした波括弧を数える）。 */
function parseBlocks(css) {
  const out = [];
  let i = 0, preludeStart = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '{') {
      const prelude = css.slice(preludeStart, i).trim();
      let depth = 1, j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      out.push({ prelude, body: css.slice(i + 1, j - 1) });
      i = j; preludeStart = i;
    } else if (ch === '}') {
      i++; preludeStart = i;           // 対応が取れていない `}` は読み飛ばす
    } else if (ch === ';' && css.slice(preludeStart, i).trim().charAt(0) === '@') {
      i++; preludeStart = i;           // @import / @charset のような文
    } else {
      i++;
    }
  }
  return out;
}

/** セレクタの「主体」（一番右のコンパウンド）が body / html かどうか。 */
function subjectIsBodyOrHtml(sel) {
  const s = sel.trim();
  if (!s) return false;
  if (/::/.test(s.split(/[\s>+~]+/).pop())) return false;   // 主体が疑似要素なら別の箱
  // 括弧の外の結合子で切って最後のコンパウンドを取る
  let depth = 0, last = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (depth === 0 && /[\s>+~,]/.test(c)) { last = ''; continue; }
    last += c;
  }
  return /^(body|html)(?![\w-])/i.test(last);
}

/** 宣言ブロックから禁止プロパティを拾う。 */
function bannedIn(declBody) {
  const hits = [];
  let m;
  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(declBody)) !== null) hits.push(m[1].toLowerCase());
  return hits;
}

/** `animation` / `animation-name` が参照している @keyframes 名を拾う。 */
function keyframeNamesIn(declBody) {
  const names = [];
  const re = /(?:^|[;{])\s*animation(?:-name)?\s*:([^;}]*)/gi;
  let m;
  while ((m = re.exec(declBody)) !== null) {
    m[1].split(',').forEach(part => {
      part.trim().split(/\s+/).forEach(tok => {
        const t = tok.replace(/!important/i, '').trim();
        if (!t) return;
        if (/^\d/.test(t) || /^(none|normal|infinite|alternate|reverse|forwards|backwards|both|running|paused|linear|ease|ease-in|ease-out|ease-in-out|initial|inherit|unset|step-start|step-end)$/i.test(t)) return;
        if (/^(steps|cubic-bezier|var)\s*\(/i.test(t)) return;
        if (/^var\(/i.test(t)) return;
        names.push(t);
      });
    });
  }
  return names;
}

function collectKeyframes(blocks, into) {
  blocks.forEach(b => {
    const at = /^@([\w-]+)/.exec(b.prelude);
    if (!at) return;
    const kind = at[1].toLowerCase();
    if (/^(-webkit-)?keyframes$/.test(kind) || kind === 'keyframes') {
      const name = b.prelude.replace(/^@[\w-]+\s*/, '').trim();
      into.set(name, (into.get(name) || []).concat(bannedIn(b.body)));
    } else if (kind === 'media' || kind === 'supports' || kind === 'layer' || kind === 'container' || kind === 'scope') {
      collectKeyframes(parseBlocks(b.body), into);
    }
  });
}

function checkRules(blocks, kf, label) {
  blocks.forEach(b => {
    if (b.prelude.charAt(0) === '@') {
      const kind = (/^@([\w-]+)/.exec(b.prelude) || [, ''])[1].toLowerCase();
      if (kind === 'media' || kind === 'supports' || kind === 'layer' || kind === 'container' || kind === 'scope') {
        checkRules(parseBlocks(b.body), kf, label);
      }
      return;                                     // @keyframes 本体はここでは見ない
    }
    const subjects = b.prelude.split(',').filter(subjectIsBodyOrHtml);
    if (!subjects.length) return;
    checked++;
    const direct = bannedIn(b.body);
    if (direct.length) {
      fail(`${label}: \`${b.prelude.trim().slice(0, 90)}\` が ${[...new Set(direct)].join(' / ')} を宣言している`);
    }
    keyframeNamesIn(b.body).forEach(name => {
      const props = kf.get(name);
      if (props && props.length) {
        fail(`${label}: \`${b.prelude.trim().slice(0, 70)}\` が参照する @keyframes ${name} が ${[...new Set(props)].join(' / ')} を動かしている`);
      }
    });
  });
}

function scanCss(css, label) {
  const clean = stripComments(css);
  const blocks = parseBlocks(clean);
  const kf = new Map();
  collectKeyframes(blocks, kf);
  checkRules(blocks, kf, label);
}

// ── 対象 ────────────────────────────────────────────────────────────
// CSS はルート直下の全ファイル、HTML はインライン <style> を抜き出して検査する。
const cssFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.css'));
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

console.log('§13 Z5: body / html を position:fixed の包含ブロックにする宣言が無いこと\n');

cssFiles.forEach(f => scanCss(fs.readFileSync(path.join(ROOT, f), 'utf8'), f));

htmlFiles.forEach(f => {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m, n = 0;
  while ((m = re.exec(html)) !== null) scanCss(m[1], `${f} <style> #${++n}`);
});

console.log(`  対象CSS ${cssFiles.length}件 / HTML ${htmlFiles.length}件 ・ body|html 主体のルール ${checked}件を検査`);

if (failures) {
  console.error(`\n✗ ${failures}件の違反。`);
  console.error('  body / html 自身に transform / filter / backdrop-filter / perspective /');
  console.error('  will-change / contain を掛けると、#mecFxCanvas をはじめ position:fixed の');
  console.error('  演出レイヤーの基準が文書全体へ切り替わり、絵が縦に引き伸ばされる（§13-1）。');
  console.error('  掛けたい効果は専用の固定レイヤー（#examZoneBreath / #examShakeOverlay）か');
  console.error('  カード側（.qc）へ移すこと。');
  process.exit(1);
}
console.log('\n✓ 違反なし');
