// questions_*.json を正本として questions_*.js (file://フォールバック用コピー) を
// 自動生成する。手動同期を廃し、.json/.js のズレ事故を根絶するための正式スクリプト。
//
// 使い方:
//   node _work/gen_js_from_json.js            全 questions_*.json を再生成
//   node _work/gen_js_from_json.js circ hema  指定prefixのみ再生成
//
// 出力形式:  window["_cardJSON_<prefix>"]=<pretty JSON>;\n   (POSIX標準・末尾改行あり)
// （check_json_js_sync.js が正規化比較するため厳密な空白は問わない。
//   全ファイルを2スペース整形・末尾改行ありで統一する）
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const only = process.argv.slice(2); // 指定があればそのprefixのみ

const jsonFiles = fs.readdirSync(root)
  .filter(f => /^questions_.+\.json$/.test(f))
  .filter(f => {
    if (!only.length) return true;
    const prefix = f.replace(/^questions_/, '').replace(/\.json$/, '');
    return only.includes(prefix);
  });

let changed = 0;
for (const jsonFile of jsonFiles) {
  const prefix = jsonFile.replace(/^questions_/, '').replace(/\.json$/, '');
  const jsFile = `questions_${prefix}.js`;
  const data = JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8'));
  const out = `window["_cardJSON_${prefix}"]=${JSON.stringify(data, null, 2)};\n`;
  const jsPath = path.join(root, jsFile);
  const prev = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : null;
  if (prev === out) {
    console.log(`[unchanged] ${jsFile}`);
    continue;
  }
  fs.writeFileSync(jsPath, out);
  console.log(`[written]   ${jsFile}`);
  changed++;
}
console.log(`\n${changed} file(s) regenerated.`);
