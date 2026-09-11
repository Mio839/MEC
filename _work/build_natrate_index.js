/**
 * rate_index.js（全国正答率の索引）を全科目・現行データで作り直す
 * Run: node _work/build_natrate_index.js [--check]
 *
 * ■ なぜ作り直すか
 * 旧 rate_index.js は **コア12科目の 4,939件だけ**で、2026-07-09 から再生成されていなかった。
 * マイナー講座・公衆衛生・必修講座を1問も持たず、しかも stats.html の natRateOf は
 * 「RATE を先に引き、無ければ qmeta.r」なので、作り直した循環器・呼吸器・肝胆膵は
 * **古い正答率で全国比が計算されていた**（弱点カルテの既存バグ）。
 *
 * ■ 材料（どちらも uid 単位＝科目平均で代用しない）
 *   ・questions_*.json の `rate`（無ければ `rate_text` の "63%" から拾う）
 *   ・国家試験過去問/**\/*.html の `data-rate`
 *
 * ■ 出力の形
 * 章ごとに「開始番号:値をカンマで連ねた列」へ畳み、読み込み時に展開して
 * **window.MEC_RATE（uid → 数値）** を作る。**この形は変えないこと**——
 * stats.html:1892 の `const RATE = window.MEC_RATE || {}` が唯一の消費者で、
 * 畳んだことを知らないまま今までどおり引ける（ハブの実力レーダーも同じ表を読む）。
 * 平坦な uid→数値のまま書くと約145KB、畳むと約30KB（gzip 9.7KB）。
 *
 * ⚠️ 値は整数へ丸める。過去問だけ data-rate が小数（87.9）だが、これを読むのは
 *    弱点カルテとレーダーで、どちらも pt 単位の差しか見ない（閾値は 5pt / 40pt）。
 *    ⚠️ study.html の難易度フィルタ（60/80% の境目）は questions_*.json の `rate` を
 *    直接読んでいて**この索引を読まない**ので、丸めの影響を受けない。
 *
 * ⚠️ questions_*.json を更新したら qmeta.json と一緒にここも流し直すこと。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'rate_index.js');
const CHECK = process.argv.includes('--check');

// ── 材料を集める ──────────────────────────────────────────────
const rate = new Map();                       // uid → 整数(0-100)
const bySrc = {};

function put(uid, v, src) {
  if (!uid || typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100) return;
  if (rate.has(uid)) return;                  // 先勝ち（questions_*.json を過去問より優先）
  rate.set(uid, Math.round(v));
  bySrc[src] = (bySrc[src] || 0) + 1;
}

// ① questions_*.json
fs.readdirSync(ROOT).filter(f => /^questions_.+\.json$/.test(f)).sort().forEach(f => {
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const sid = f.replace(/^questions_|\.json$/g, '');
  const qs = [];
  (function walk(o) {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') { if (o.uid) qs.push(o); else Object.values(o).forEach(walk); }
  })(json);
  qs.forEach(q => {
    let v = (typeof q.rate === 'number' && q.rate >= 0) ? q.rate : null;
    if (v === null) {
      // ⚠️ rate_text からの拾い直しを外さないこと。感染症は 2026-09-12 まで rate が
      //    全問 -1 で、正答率は rate_text にしか無かった（348問）。同じ取り落としへの保険。
      const m = /(\d+(?:\.\d+)?)\s*%/.exec(q.rate_text || '');
      if (m) v = parseFloat(m[1]);
    }
    if (v !== null) put(q.uid, v, sid);
  });
});

// ② 国家試験過去問（HTML の data-rate）
// ⚠️ 属性の順は data-rate → data-uid で、逆順の紙面は無い（2026-09-12 に全30ファイルで確認）。
//    どちらの順でも拾えるよう2本のパターンで走査する。
(function walkDir(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkDir(p);
    else if (e.name.endsWith('.html')) {
      const s = fs.readFileSync(p, 'utf8');
      let m;
      const A = /data-rate="([0-9.]+)"[^>]*?data-uid="([^"]+)"/g;
      while ((m = A.exec(s))) put(m[2], parseFloat(m[1]), 'kakumon');
      const B = /data-uid="([^"]+)"[^>]*?data-rate="([0-9.]+)"/g;
      while ((m = B.exec(s))) put(m[1], parseFloat(m[2]), 'kakumon');
    }
  });
})(path.join(ROOT, '国家試験過去問'));

// ── 章ごとの数値列へ畳む ─────────────────────────────────────
const byCh = new Map();
for (const [uid, v] of rate) {
  const i = uid.indexOf('_q');
  if (i < 0) continue;                        // '_q' を持たない uid は畳めない（現行データには無い）
  const ch = uid.slice(0, i), n = parseInt(uid.slice(i + 2), 10);
  if (!isFinite(n)) continue;
  if (!byCh.has(ch)) byCh.set(ch, new Map());
  byCh.get(ch).set(n, v);
}
const packed = {};
[...byCh.keys()].sort().forEach(ch => {
  const m = byCh.get(ch);
  const ns = [...m.keys()].sort((a, b) => a - b);
  const lo = ns[0], hi = ns[ns.length - 1], a = [];
  for (let n = lo; n <= hi; n++) a.push(m.has(n) ? m.get(n) : '');
  packed[ch] = lo + ':' + a.join(',');
});

const body =
  '// 自動生成: node _work/build_natrate_index.js — 手で編集しない\n' +
  '// 全国正答率の索引（uid → %）。材料は questions_*.json の rate/rate_text と\n' +
  '// 国家試験過去問の data-rate。章ごとの数値列に畳んであり、読み込み時に展開する。\n' +
  '// ⚠️ 公開する形は window.MEC_RATE（uid → 数値）のまま変えないこと。\n' +
  '//    消費者は stats.html の弱点カルテと index.html の実力レーダー。\n' +
  '// 生成: ' + new Date().toISOString().slice(0, 10) + ' / ' + rate.size + '件 / ' +
  Object.keys(packed).length + '章\n' +
  'window.MEC_RATE=(function(){var d=' + JSON.stringify(packed) + ',o={},k,p,a,i,v,n;\n' +
  'for(k in d){p=d[k].indexOf(":");n=+d[k].slice(0,p);a=d[k].slice(p+1).split(",");\n' +
  'for(i=0;i<a.length;i++){v=a[i];if(v!=="")o[k+"_q"+(n+i)]=+v;}}\n' +
  'return o;})();\n';

// ── 自己検算（展開して元の表と一致するか）────────────────────
{
  const sb = { window: {} };
  require('vm').createContext(sb);
  require('vm').runInContext(body, sb);
  const got = sb.window.MEC_RATE;
  const gk = Object.keys(got);
  if (gk.length !== rate.size) {
    console.error('NG: 展開した件数が合わない ' + gk.length + ' != ' + rate.size);
    process.exit(1);
  }
  for (const [uid, v] of rate) {
    if (got[uid] !== v) { console.error('NG: ' + uid + ' ' + got[uid] + ' != ' + v); process.exit(1); }
  }
}

const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
console.log('件数 ' + rate.size + ' / ' + Object.keys(packed).length + '章');
console.log('内訳 ' + Object.keys(bySrc).sort().map(k => k + '=' + bySrc[k]).join(' '));
console.log('サイズ ' + prev.length + ' → ' + body.length + ' bytes');

if (CHECK) {
  // 生成日の行だけは毎回変わるので比較から外す
  const strip = s => s.replace(/^\/\/ 生成: .*$/m, '');
  console.log(strip(prev) === strip(body) ? 'OK: 現物と一致' : 'NG: 現物と一致しない（流し直すこと）');
  process.exit(strip(prev) === strip(body) ? 0 : 1);
}
fs.writeFileSync(OUT, body, 'utf8');
console.log('書き出した: rate_index.js');
