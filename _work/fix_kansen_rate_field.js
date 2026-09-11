/**
 * questions_kansen.json の rate フィールドを rate_text から埋め直す（冪等・--dry-run あり）
 * Run: node _work/fix_kansen_rate_field.js [--dry-run]
 *
 * 感染症だけ `rate: -1` が全問に入っていて、正答率は `rate_text`（"63%"）にしか無かった
 * （356問中348問）。`rate_cls`（cm/ch/cl）は正しく入っていたので、落ちていたのは数値だけ。
 *
 * ⚠️ これが効く範囲は広い——`rate` は
 *   ・study.html の難易度フィルタ（難問/標準/易問）と `data-rate`
 *   ・`_work/build_qmeta.py` が作る qmeta.r（弱点カルテの全国正答率のフォールバック）
 *   ・rate_index.js（全国正答率の索引）
 *   が読む。-1 のままだと感染症356問が「正答率なし」として全国比の分析から構造的に抜ける。
 *
 * ⚠️ 整形を変えないこと。questions_kansen.json は `JSON.stringify(j, null, 1)` + LF で
 *    往復一致する（ファイルごとに整形が違うので、他の科目へ流用するときは必ず確認する）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry-run');
const FILE = path.join(__dirname, '..', 'questions_kansen.json');
const raw = fs.readFileSync(FILE, 'utf8');
const json = JSON.parse(raw);

// 往復一致の確認（ここが崩れていたら書き戻さない＝全行が差分になるのを防ぐ）
const INDENT = 1;
if (raw.trim() !== JSON.stringify(json, null, INDENT)) {
  console.error('NG: 現物が JSON.stringify(j, null, ' + INDENT + ') と一致しない。整形を調べ直すこと。');
  process.exit(1);
}

const qs = [];
(function walk(o) {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') { if (o.uid) qs.push(o); else Object.values(o).forEach(walk); }
})(json);

let fixed = 0, already = 0, noText = 0, conflict = 0;
qs.forEach(q => {
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(q.rate_text || '');
  const txt = m ? Math.round(parseFloat(m[1])) : null;
  const cur = (typeof q.rate === 'number') ? q.rate : -1;
  if (txt === null) { noText++; return; }              // 正答率なし（採点除外など）はそのまま
  if (cur >= 0) {
    if (cur !== txt) { conflict++; console.log('  ! ' + q.uid + ' rate=' + cur + ' text=' + q.rate_text); }
    else already++;
    return;                                            // 既に数値がある問題には触らない
  }
  q.rate = txt;
  fixed++;
});

console.log('感染症 ' + qs.length + '問: 埋めた ' + fixed + ' / 既に数値あり ' + already
  + ' / 正答率なし ' + noText + ' / 食い違い ' + conflict);

if (conflict) { console.error('NG: rate と rate_text が食い違う問題がある。手で確かめること。'); process.exit(1); }
if (DRY) { console.log('(--dry-run なので書き戻していない)'); process.exit(0); }
if (!fixed) { console.log('変更なし'); process.exit(0); }

// ⚠️ 現物は末尾に改行を持たない。足すと1行ぶん無駄な差分が出る
fs.writeFileSync(FILE, JSON.stringify(json, null, INDENT), 'utf8');
console.log('書き戻した: questions_kansen.json');
