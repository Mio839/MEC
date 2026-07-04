// questions_*.json と questions_*.js (file://フォールバック用コピー) の内容が
// 一致しているか検証する。JSON更新後に.jsの再生成を忘れると、file://環境でのみ
// 古いデータが表示される事故につながるため、コミット前にこれを実行する。
//
// 使い方: node _work/check_json_js_sync.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsonFiles = fs.readdirSync(root).filter(f => /^questions_.+\.json$/.test(f));

let hasMismatch = false;

for (const jsonFile of jsonFiles) {
  const prefix = jsonFile.replace(/^questions_/, '').replace(/\.json$/, '');
  const jsFile = `questions_${prefix}.js`;
  const jsPath = path.join(root, jsFile);

  if (!fs.existsSync(jsPath)) {
    console.log(`[NO .js] ${jsonFile} に対応する ${jsFile} がありません`);
    hasMismatch = true;
    continue;
  }

  const jsonData = JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8'));
  const jsRaw = fs.readFileSync(jsPath, 'utf8')
    .replace(/^window\["_cardJSON_[^"]+"\]\s*=\s*/, '')
    .replace(/;\s*$/, '');

  let jsData;
  try {
    jsData = JSON.parse(jsRaw);
  } catch (e) {
    console.log(`[PARSE ERROR] ${jsFile}: ${e.message}`);
    hasMismatch = true;
    continue;
  }

  const jsonStr = JSON.stringify(jsonData);
  const jsStr = JSON.stringify(jsData);
  if (jsonStr !== jsStr) {
    console.log(`[MISMATCH] ${jsonFile} と ${jsFile} の内容が一致しません → node -e で再生成してください`);
    hasMismatch = true;
  } else {
    console.log(`[OK] ${jsonFile}`);
  }
}

if (hasMismatch) {
  console.log('\n不整合あり。該当ファイルは .json を正として .js を再生成してください。');
  process.exit(1);
} else {
  console.log('\nすべて一致しています。');
}
