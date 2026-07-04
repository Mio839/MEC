// 感染症/ch*.html の <div class="eb ee"> ブロックを questions_kansen.json/.js へマージする一回限りのスクリプト
// merge_neuro_em.js を土台に、kansen特有の qs:0コンテナ+§サブ章構造・id="qN"形式・
// eb ee が eb ept に閉じタグ漏れでネストされているケースに対応（balanced-div抽出）
const fs = require('fs');
const path = require('path');

const CHAPTER_FILES = [
  ['ch01', 'ch01_kansen_basics.html'],
  ['ch02', 'ch02_kansen_gi.html'],
  ['ch03', 'ch03_kansen_skin.html'],
  ['ch04', 'ch04_kansen_resp.html'],
  ['ch05', 'ch05_kansen_ntm.html'],
  ['ch06', 'ch06_kansen_hiv.html'],
  ['ch07', 'ch07_kansen_other.html'],
];

function extractDivContent(text, openTagIdx) {
  const tagEnd = text.indexOf('>', openTagIdx) + 1;
  let pos = tagEnd;
  let depth = 1;
  while (pos < text.length) {
    const nextOpen = text.indexOf('<div', pos);
    const nextClose = text.indexOf('</div>', pos);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      pos = nextClose + 6;
      if (depth === 0) {
        return text.slice(tagEnd, pos - 6);
      }
    }
  }
  return null;
}

const eeMap = {}; // uid -> {h, c}

for (const [chId, fname] of CHAPTER_FILES) {
  const filePath = path.join('感染症', fname);
  const raw = fs.readFileSync(filePath, 'utf8');

  const idRe = /<div class="qc" id="q(\d+)"/g;
  const positions = [];
  let m;
  while ((m = idRe.exec(raw)) !== null) {
    positions.push({ num: m[1], index: m.index });
  }

  let extractedCount = 0;
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : raw.length;
    const chunk = raw.slice(start, end);
    const eeOpenIdx = chunk.indexOf('<div class="eb ee">');
    if (eeOpenIdx === -1) continue;
    const inner = extractDivContent(chunk, eeOpenIdx);
    if (inner === null) continue;
    const hMatch = /^<h4>([^<]*)<\/h4>([\s\S]*)$/.exec(inner);
    if (!hMatch) continue;
    const uid = `kansen_${chId}_q${positions[i].num}`;
    eeMap[uid] = { h: hMatch[1], c: hMatch[2] };
    extractedCount++;
  }
  console.log(fname, '-> qc:', positions.length, '件ee抽出:', extractedCount);
}

console.log('抽出合計:', Object.keys(eeMap).length);

const jsonPath = 'questions_kansen.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let merged = 0, alreadyHad = 0, missing = [];

for (const ch of data.chapters) {
  for (const q of (ch.qs || [])) {
    const ee = eeMap[q.uid];
    q.eg = q.eg || [];
    if (q.eg.some(e => e.cls === 'ee')) {
      alreadyHad++;
      continue;
    }
    if (!ee) {
      missing.push(q.uid);
      continue;
    }
    const eeEntry = { cls: 'ee', h: ee.h, c: ee.c };
    const eptIdx = q.eg.findIndex(e => e.cls === 'ept');
    if (eptIdx >= 0) {
      q.eg.splice(eptIdx, 0, eeEntry);
    } else {
      q.eg.push(eeEntry);
    }
    merged++;
  }
}

console.log('マージ件数:', merged, '既存スキップ:', alreadyHad, 'HTML側に対応なし:', missing.length);
if (missing.length) console.log('対応なしUID:', missing.join(', '));

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync('questions_kansen.js', 'window["_cardJSON_kansen"]=' + JSON.stringify(data, null, 2) + ';\n');
console.log('questions_kansen.json / questions_kansen.js 更新完了');
