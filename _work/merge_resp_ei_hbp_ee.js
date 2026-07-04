// 呼吸器: HTML「eb ei」(画像所見)15件のJSON未反映を merge
// 肝胆膵: hbp_ch02_q136 の「eb ee」「eb ept」2件のJSON未反映を merge
// balanced-div抽出で eb 内のネスト崩れにも対応（merge_kansen_ee.js と同方式）
const fs = require('fs');
const path = require('path');

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
      if (depth === 0) return text.slice(tagEnd, pos - 6);
    }
  }
  return null;
}

function extractClsMap(dir, files, uidPrefix, clsName) {
  const map = {};
  for (const fname of files) {
    const raw = fs.readFileSync(path.join(dir, fname), 'utf8');
    const uidRe = new RegExp('class="qc"[^>]*data-uid="(' + uidPrefix + '[a-z0-9_]+)"', 'g');
    const positions = [];
    let m;
    while ((m = uidRe.exec(raw)) !== null) positions.push({ uid: m[1], index: m.index });
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index : raw.length;
      const chunk = raw.slice(start, end);
      const openIdx = chunk.indexOf('<div class="eb ' + clsName + '">');
      if (openIdx === -1) continue;
      const inner = extractDivContent(chunk, openIdx);
      if (inner === null) continue;
      const hMatch = /^<h4>([^<]*)<\/h4>([\s\S]*)$/.exec(inner);
      if (!hMatch) continue;
      map[positions[i].uid] = { h: hMatch[1], c: hMatch[2] };
    }
  }
  return map;
}

// eg配列内での挿入位置(共通クラス順: ep, ee, ept, em, ec, ei)
const CLASS_ORDER = ['ep', 'ee', 'ept', 'em', 'ec', 'ei'];
function insertEntry(eg, entry) {
  const myIdx = CLASS_ORDER.indexOf(entry.cls);
  const insertBefore = eg.findIndex(e => CLASS_ORDER.indexOf(e.cls) > myIdx);
  if (insertBefore >= 0) {
    eg.splice(insertBefore, 0, entry);
  } else {
    eg.push(entry);
  }
}

function mergeCls(jsonPath, jsPath, dir, uidPrefix, clsName) {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('ch') && f.endsWith('.html'));
  const map = extractClsMap(dir, files, uidPrefix, clsName);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let merged = 0, alreadyHad = 0;
  for (const ch of data.chapters) {
    for (const q of (ch.qs || [])) {
      const item = map[q.uid];
      if (!item) continue;
      q.eg = q.eg || [];
      if (q.eg.some(e => e.cls === clsName)) {
        alreadyHad++;
        continue;
      }
      insertEntry(q.eg, { cls: clsName, h: item.h, c: item.c });
      merged++;
      console.log('  merged', clsName, q.uid);
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
  const varName = path.basename(jsonPath, '.json');
  fs.writeFileSync(jsPath, `window["_cardJSON_${varName.replace('questions_', '')}"]=` + JSON.stringify(data, null, 2) + ';\n');
  console.log(jsonPath, clsName, 'マージ:', merged, '既存スキップ:', alreadyHad);
}

console.log('=== 呼吸器: ei ===');
mergeCls('questions_resp.json', 'questions_resp.js', '呼吸器', 'resp_', 'ei');

console.log('=== 肝胆膵: ee ===');
mergeCls('questions_hbp.json', 'questions_hbp.js', '肝胆膵', 'hbp_', 'ee');

console.log('=== 肝胆膵: ept ===');
mergeCls('questions_hbp.json', 'questions_hbp.js', '肝胆膵', 'hbp_', 'ept');
