#!/usr/bin/env node
/* sounds/ を走査して sounds_index.js（効果音の一覧・派生物）を作り直す。
 *
 *   node _work/build_sounds_index.js            生成する
 *   node _work/build_sounds_index.js --check    生成せず、いまの sounds_index.js と一致するかだけ見る
 *
 * ⚠️ sounds_index.js は**派生物**＝直接編集しないこと。編集するのは sounds/meta.json の方。
 * ⚠️ この一覧が「ファイル名とキーの唯一の正本」。以前は study_exam.js / index.html /
 *    chapter_exam.js の3か所に同じ表があり、片方だけ増やすと黙って乖離した。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOUNDS = path.join(ROOT, 'sounds');
const OUT = path.join(ROOT, 'sounds_index.js');

/* フォルダ名 → 一覧のキー。フォルダを増やすならここに足す（順序＝出力順）。 */
const GROUPS = [
  { dir: '正解音', slot: 'correct' },
  { dir: '起動音', slot: 'boot' },
  { dir: '選択音', slot: 'select' }
];
const AUDIO_RE = /\.(wav|mp3|ogg|m4a)$/i;

/* 台帳に載っていないファイルの key を機械的に作る（ASCII の英数だけ拾い、無ければ連番）。
   ⚠️ 自動 key は「置いた瞬間に鳴らせる」ための保険であって推奨ではない——日本語名だと
      s1 / s2 のような無意味な key になり、あとで台帳へ書くと設定が落ちるため。 */
function autoKey(file, i) {
  const stem = file.replace(AUDIO_RE, '');
  const ascii = stem.replace(/[^A-Za-z0-9]+/g, '').toLowerCase();
  return ascii || ('s' + (i + 1));
}

function build() {
  const meta = JSON.parse(fs.readFileSync(path.join(SOUNDS, 'meta.json'), 'utf8'));
  const warn = [];
  const out = {};

  for (const g of GROUPS) {
    const dir = path.join(SOUNDS, g.dir);
    if (!fs.existsSync(dir)) { warn.push('フォルダが無い: sounds/' + g.dir); out[g.slot] = []; continue; }
    const led = meta[g.dir] || {};
    // 台帳の順を先に、台帳に無いものを名前順で後ろへ（既存ユーザーのボタン位置を動かさない）
    const files = fs.readdirSync(dir).filter(f => AUDIO_RE.test(f));
    const ordered = Object.keys(led).filter(f => files.includes(f))
      .concat(files.filter(f => !led[f]).sort());
    for (const f of Object.keys(led)) if (!files.includes(f)) warn.push('台帳にあるがファイルが無い: sounds/' + g.dir + '/' + f);

    const seen = new Set();
    out[g.slot] = ordered.map((f, i) => {
      const m = led[f] || {};
      let key = m.key || autoKey(f, i);
      if (seen.has(key)) { warn.push('key が重複: ' + key + '（' + f + '）'); key = key + '_' + i; }
      seen.add(key);
      if (!led[f]) warn.push('台帳に無い（key=' + key + ' / vol=1 で登録した）: sounds/' + g.dir + '/' + f);
      const e = { key, file: g.dir + '/' + f, label: m.label || f.replace(AUDIO_RE, ''), vol: m.vol == null ? 1 : m.vol };
      if (m.peak != null) e.peak = m.peak;
      if (m.dur != null) e.dur = m.dur;
      return e;
    });
    if (!out[g.slot].length) warn.push('1つも音が無い: sounds/' + g.dir);
  }

  const body = GROUPS.map(g =>
    '  ' + g.slot + ': [\n' +
    out[g.slot].map(e => '    ' + JSON.stringify(e)).join(',\n') +
    '\n  ]'
  ).join(',\n');

  const src =
`/* ⚠️ 自動生成ファイル（派生物）— 直接編集しないこと。
 *    node _work/build_sounds_index.js が sounds/ と sounds/meta.json から作り直す。
 *    音を足す手順は sounds/meta.json の _readme を読むこと。
 *
 * ここが「効果音のファイル名・キー・音量の唯一の正本」。study.html(study_exam.js)・
 * index.html・chapter_exam.js の3つが全部これを読むので、表が乖離しようがない。
 *
 * file はリポジトリ直下の sounds/ からの相対パス。国家試験過去問/ のような下の階層から
 * 読むページは base ではなく自前の scriptBase を前置すること（chapter_exam.js がそうしている）。
 */
window.MecSounds = {
  base: 'sounds/',
${body}
};
`;
  return { src, warn };
}

const { src, warn } = build();
warn.forEach(w => console.warn('⚠️  ' + w));

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== src) { console.error('✗ sounds_index.js が最新でない。node _work/build_sounds_index.js を流すこと'); process.exit(1); }
  console.log('✓ sounds_index.js は最新');
} else {
  fs.writeFileSync(OUT, src);
  console.log('✓ sounds_index.js を生成した');
}
