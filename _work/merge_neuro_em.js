// 神経/ch*.html の <div class="eb em"> ブロックを questions_neur.json/.js へマージする一回限りのスクリプト
const fs = require('fs');
const path = require('path');

const CHAPTER_FILES = [
  'ch01_neuro_basics.html',
  'ch02_cranial_nerves.html',
  'ch03_cerebrovascular.html',
  'ch04_higher_brain.html',
  'ch05_dementia_parkinsonism.html',
  'ch06_motor_neuron_demyelination.html',
  'ch07_peripheral_nerve_nmj_muscle.html',
  'ch08_neuro_infection.html',
  'ch09_functional.html',
  'ch10_traumatic_intracranial.html',
  'ch11_brain_tumor.html',
];

const emMap = {}; // uid -> content (h4の次から)

for (const fname of CHAPTER_FILES) {
  const filePath = path.join('神経', fname);
  const raw = fs.readFileSync(filePath, 'utf8');

  // data-uid="neur_chNN_qN" の出現位置を全て集める(qcカードのみ)
  const uidRe = /class="qc"[^>]*data-uid="(neur_[a-z0-9_]+)"/g;
  const positions = [];
  let m;
  while ((m = uidRe.exec(raw)) !== null) {
    positions.push({ uid: m[1], index: m.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : raw.length;
    const chunk = raw.slice(start, end);
    const emRe = /<div class="eb em"><h4>[^<]*<\/h4>([\s\S]*?)<\/div>/;
    const emMatch = emRe.exec(chunk);
    if (emMatch) {
      emMap[positions[i].uid] = emMatch[1];
    }
  }
  console.log(fname, '->', positions.length, '問中', positions.filter(p => emMap[p.uid]).length, '件抽出');
}

const totalExtracted = Object.keys(emMap).length;
console.log('抽出合計:', totalExtracted);

// questions_neur.json へマージ
const jsonPath = 'questions_neur.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let merged = 0;
let alreadyHad = 0;
let missing = [];

for (const ch of data.chapters) {
  for (const q of ch.qs) {
    const emContent = emMap[q.uid];
    if (!emContent) {
      missing.push(q.uid);
      continue;
    }
    q.eg = q.eg || [];
    if (q.eg.some(e => e.cls === 'em')) {
      alreadyHad++;
      continue;
    }
    const emEntry = { cls: 'em', h: '🔍 選択肢解説', c: emContent };
    const eptIdx = q.eg.findIndex(e => e.cls === 'ept');
    if (eptIdx >= 0) {
      q.eg.splice(eptIdx, 0, emEntry);
    } else {
      q.eg.push(emEntry);
    }
    merged++;
  }
}

console.log('マージ件数:', merged, '既存スキップ:', alreadyHad, 'HTML側に対応なし:', missing.length);
if (missing.length) console.log('対応なしUID:', missing.join(', '));

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');

// questions_neur.js を再生成(同一データを window["_cardJSON_neur"]= 形式で書き出す)
const jsPath = 'questions_neur.js';
fs.writeFileSync(jsPath, 'window["_cardJSON_neur"]=' + JSON.stringify(data, null, 2) + ';\n');

console.log('questions_neur.json / questions_neur.js 更新完了');
