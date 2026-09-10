/**
 * 第121回 夏メック模試の「成績表」を mock_data/m121s_rates.js へ書き出す。
 *
 * 入力（どちらも手で転記したもの＝ここが唯一の手作業）:
 *   _work/m121s_seiseki_2026-09-10.tsv   正誤一覧（400問の正答・解答・全国正答率）
 *   _work/m121s_report_2026-09-10.json   成績表の総合成績タブ（得点・順位・平均・偏差値）
 *
 * 出力: mock_data/m121s_rates.js
 *   window.MecMockRates.m121s  = { "A1": 31.2, ... }   ← 成績カルテの全国正答率の正本
 *   window.MecMockReport.m121s = { sections, picks, ... } ← 公式成績と、MECが読み取った解答
 *
 * ⚠️ 転記の誤りを通さないため、書き出す前に3つの独立な材料と突き合わせる:
 *   ① 正誤一覧の「正答」列 ＝ 解答表（mock_data/m121s.js の ans）… 400問すべて一致すること
 *      → 行ずれ・取り落としがあれば必ずここで落ちる
 *   ② 正誤一覧の「解答」列を mock.js の score() で採点した結果 ＝ 成績表の得点
 *      … 9つの区分すべてで一致すること（採点の式は mock.js のものを使う＝ここに式を書かない）
 *   ③ 「禁」の印の数 ＝ 成績表の禁忌肢選択数
 *
 * 実行: node _work/build_mock_m121s_rates.js           書き出す
 *       node _work/build_mock_m121s_rates.js --check   現物と一致するかだけ見る
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXAM_ID = 'm121s';
const TSV = path.join(__dirname, 'm121s_seiseki_2026-09-10.tsv');
const REPORT = path.join(__dirname, 'm121s_report_2026-09-10.json');
const OUT = path.join(ROOT, 'mock_data', EXAM_ID + '_rates.js');

function loadMock() {
  const sb = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of ['mock_data/' + EXAM_ID + '.js', 'mock.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  }
  return { M: sb.window.MecMock, D: sb.window.MecMockData[EXAM_ID] };
}

function readTsv() {
  const out = {};
  fs.readFileSync(TSV, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (!line || line[0] === '#') return;
    const c = line.split('\t');
    if (c.length < 4) throw new Error(`TSV ${i + 1}行目: 列が足りない: ${line}`);
    if (out[c[0]]) throw new Error(`TSV ${i + 1}行目: ${c[0]} が重複`);
    const rate = Number(c[3]);
    if (!(rate >= 0 && rate <= 100)) throw new Error(`TSV ${i + 1}行目: 全国正答率が範囲外: ${c[3]}`);
    out[c[0]] = { key: c[1], mine: c[2], rate, mark: c[4] || '' };
  });
  return out;
}

function build() {
  const { M, D } = loadMock();
  const T = readTsv();
  const R = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const errs = [];

  // ① 正答列 ＝ 解答表
  const keys = D.questions.map(M.qkey);
  keys.forEach((k, i) => {
    const q = D.questions[i], t = T[k];
    if (!t) return errs.push(`${k}: 正誤一覧に無い`);
    if (M.normPick(q, t.key) !== M.normPick(q, q.type === 'calc' ? q.ans[0] : q.ans.join(''))) {
      errs.push(`${k}: 正答が解答表と違う（MEC ${t.key} / 解答表 ${q.ans.join('')}）`);
    }
  });
  Object.keys(T).forEach(k => { if (keys.indexOf(k) < 0) errs.push(`${k}: 解答表に無い問題`); });

  // ② 解答列を mock.js で採点 ＝ 成績表の得点（区分ごと）
  const picks = {};
  D.questions.forEach(q => { const k = M.qkey(q); if (T[k]) picks[k] = M.normPick(q, T[k].mine); });
  const S = M.score(EXAM_ID, picks);
  R.sections.forEach(sec => {
    let got = 0, max = 0;
    S.rows.forEach(row => {
      if (sec.blocks.indexOf(row.q.block) < 0) return;
      if (sec.cat && row.q.cat !== sec.cat) return;
      got += row.r.pts; max += row.q.pts;
    });
    if (got !== sec.got || max !== sec.max) {
      errs.push(`${sec.label}: 解答列の採点 ${got}/${max} ≠ 成績表 ${sec.got}/${sec.max}`);
    }
  });

  // ③ 禁の印 ＝ 禁忌肢選択数（しかも mock.js の判定と同じ問題であること）
  const marked = Object.keys(T).filter(k => T[k].mark.indexOf('禁') >= 0).sort();
  const judged = S.taboo.hit.slice().sort();
  if (marked.length !== R.taboo || marked.join() !== judged.join()) {
    errs.push(`禁忌肢: 印 [${marked}] / 採点 [${judged}] / 成績表 ${R.taboo}問`);
  }

  if (errs.length) {
    console.error('✗ 転記の検算に失敗（書き出さない）:\n  ' + errs.join('\n  '));
    process.exit(1);
  }

  const rates = {};
  keys.forEach(k => { rates[k] = T[k].rate; });
  const report = {
    source: R.source, examinees: R.examinees, school: R.school, taboo: R.taboo,
    grades: R.grades, sections: R.sections, picks
  };
  const lines = [];
  for (let i = 0; i < keys.length; i += 10) {
    lines.push('  ' + keys.slice(i, i + 10).map(k => JSON.stringify(k) + ':' + rates[k]).join(', '));
  }
  const js =
`// 第121回 夏メック模試（m121s）の成績表 — 自動生成・編集しないこと
//   生成: node _work/build_mock_m121s_rates.js
//   材料: _work/m121s_seiseki_2026-09-10.tsv（正誤一覧）/ _work/m121s_report_2026-09-10.json（総合成績）
//
// ⚠️⚠️ ここが全国正答率の唯一の正本。mock_karte.html にも mock.js にも数字を書かないこと。
//    MecMockRates が入るだけで、成績カルテの「取りこぼし検出」・科目別の「全国比 ±pt」・
//    設問一覧の全国正答率の列と並べ替えが自動で有効になる（HTML もロジックも触らない）。
//
// キーは「ブロック＋番号」＝ mock.js の qkey() と同じ形（例 A58 / C49 / F75）。値は％。
// ⚠️ 推測値を入れないこと。成績表に載っていない問題は「無い」ままにしておく。
//
// MecMockReport.picks は MEC がマークシートから読み取った解答（正誤は持たない＝
// 正誤は mock.js が解答表と突き合わせて毎回計算する、という不変条件はここでも同じ）。
// カルテはこれを自己採点の入力と突き合わせ、転記の食い違いを知らせるのに使う。

window.MecMockRates = window.MecMockRates || {};
window.MecMockRates.${EXAM_ID} = {
${lines.join(',\n')}
};

window.MecMockReport = window.MecMockReport || {};
window.MecMockReport.${EXAM_ID} = ${JSON.stringify(report, null, 1)};
`;
  return { js, S, T, keys };
}

const { js, S, keys } = build();
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur.replace(/\r\n/g, '\n') !== js) { console.error('✗ ' + path.relative(ROOT, OUT) + ' が材料と一致しない（再生成が要る）'); process.exit(1); }
  console.log('✓ 一致');
} else {
  fs.writeFileSync(OUT, js);
  console.log(`✓ ${path.relative(ROOT, OUT)} を書き出した（${keys.length}問・公式 ${S.total.pts}/${S.total.max}・禁忌肢 ${S.taboo.count}）`);
}
