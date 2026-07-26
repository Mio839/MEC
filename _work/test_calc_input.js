/**
 * calc_input.js（計算問題の桁入力）を実ソースで検証する。
 * Run: node _work/test_calc_input.js
 *
 * 守りたいこと:
 *   - 正解は「数値」ではなく「桁文字列」として扱う。0.40 と 0.4 は別物であり、
 *     先頭ゼロ・末尾ゼロを落とすと採点が壊れる
 *   - 採点は完全一致・部分点なし（本番のマークシートと同じ厳しさ）
 *   - 全角数字を受け付ける（iPad の日本語キーボードで全角が入る）
 *   - ans_label が正規形（"計算答：2.0"）から外れた問題を混入させない。
 *     旧形式 "計算答：2,0" が戻ると桁数と小数点位置が読めず入力欄が作れない
 *   - 桁数が問題文の解答テンプレート（"解答：① ② ％"）と一致する
 *   - 同じ正規表現を持つ3箇所（calc_input.js / build_qmeta.py / pdf_audit.py）が乖離しない
 *   - 両ホスト（study.html / 国家試験過去問）が calc_input.js を読み込んでいる
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

const M = require(path.join(ROOT, 'calc_input.js'));
const NORM = require(path.join(__dirname, 'normalize_calc_answers.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// 実装の DOM 依存部分（querySelector）だけを差し替えた最小のカード。
// spec/value/isComplete/display/grade は本物のコードが動く。
function fakeCard(ansLabel, entered) {
  const boxes = (entered || []).map(v => ({
    value: v, disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  }));
  return {
    querySelector(sel) {
      if (sel === '.ac') return { textContent: ansLabel };
      return null;                       // .ch2 なし＝選択肢を持たない問題
    },
    querySelectorAll(sel) { return sel === '.calc-box' ? boxes : []; },
  };
}

console.log('\n── 正解のパース ──');

t('計算答：2.0 は 2桁・小数点は1桁目の後ろ', () => {
  const s = M.parse('計算答：2.0');
  assert.deepStrictEqual(s, { answer: '2.0', digits: '20', dec: 1 });
});

t('整数は小数点なし', () => {
  assert.deepStrictEqual(M.parse('計算答：315'), { answer: '315', digits: '315', dec: null });
});

t('0.40 の先頭ゼロ・末尾ゼロを落とさない（数値化すると 0.4 になり採点が壊れる）', () => {
  const s = M.parse('計算答：0.40');
  assert.strictEqual(s.digits, '040');
  assert.strictEqual(s.dec, 1);
  assert.strictEqual(s.answer, '0.40');
});

t('19.5 は小数点が2桁目の後ろ', () => {
  assert.deepStrictEqual(M.parse('計算答：19.5'), { answer: '19.5', digits: '195', dec: 2 });
});

t('全角コロンも受け付ける', () => {
  assert.strictEqual(M.parse('計算答：36').digits, '36');
  assert.strictEqual(M.parse('計算答:36').digits, '36');
});

t('旧形式のカンマ区切りは受け付けない（桁と小数点が読めない）', () => {
  assert.strictEqual(M.parse('計算答：2,0'), null);
});

t('計算問題でない ans_label は null', () => {
  assert.strictEqual(M.parse('ｅ　（急速流入期）'), null);
  assert.strictEqual(M.parse('ｄ　①ウ・②ア・③イ'), null);
  assert.strictEqual(M.parse('A-aDO₂ = 36 Torr'), null);
  assert.strictEqual(M.parse(''), null);
  assert.strictEqual(M.parse(null), null);
});

t('単位や余計な語が付いた形は受け付けない（正規形のみ）', () => {
  assert.strictEqual(M.parse('計算答：36 Torr'), null);
  assert.strictEqual(M.parse('計算答：約36'), null);
});

console.log('\n── 入力の正規化 ──');

t('全角数字を半角に寄せる（iPadの日本語キーボード対策）', () => {
  assert.strictEqual(M.normStr('３６'), '36');
  assert.strictEqual(M.normStr('4'), '4');
});

t('数字以外は落とす', () => {
  assert.strictEqual(M.normStr('a'), '');
  assert.strictEqual(M.normStr('１a２'), '12');
  assert.strictEqual(M.normStr('-'), '');
  assert.strictEqual(M.normStr(''), '');
  assert.strictEqual(M.normStr(null), '');
});

console.log('\n── 採点 ──');

t('完全一致で正解', () => {
  const g = M.grade(fakeCard('計算答：2.0', ['2', '0']));
  assert.strictEqual(g.correct, true);
  assert.strictEqual(g.entered, '20');
  assert.strictEqual(g.display, '2.0');
});

t('1桁違えば不正解（部分点なし）', () => {
  const g = M.grade(fakeCard('計算答：2.0', ['2', '1']));
  assert.strictEqual(g.correct, false);
  assert.strictEqual(g.display, '2.1');
});

t('末尾ゼロを省いた入力は不正解（本番のマークシートと同じ）', () => {
  // 正解 0.40 に対して 0.4 を入れると3桁目が空 → 未完成なので不正解
  const g = M.grade(fakeCard('計算答：0.40', ['0', '4', '']));
  assert.strictEqual(g.correct, false);
  assert.strictEqual(M.isComplete(fakeCard('計算答：0.40', ['0', '4', ''])), false);
});

t('桁が埋まるまで未完成として扱う', () => {
  assert.strictEqual(M.isComplete(fakeCard('計算答：36', ['3', ''])), false);
  assert.strictEqual(M.isComplete(fakeCard('計算答：36', ['3', '6'])), true);
});

t('未入力の桁は _ で残す（解答ログに何桁目が空だったか残す）', () => {
  assert.strictEqual(M.value(fakeCard('計算答：315', ['3', '', '5'])), '3_5');
});

t('全角で入力しても正解になる', () => {
  const g = M.grade(fakeCard('計算答：36', ['３', '６']));
  assert.strictEqual(g.correct, true);
  assert.strictEqual(g.entered, '36');
});

t('0 埋めした入力を数値として丸めない（040 は 40 と別物）', () => {
  assert.strictEqual(M.grade(fakeCard('計算答：0.40', ['0', '4', '0'])).correct, true);
  assert.strictEqual(M.grade(fakeCard('計算答：0.40', ['4', '0', '0'])).correct, false);
});

t('選択肢を持つカードは入力型として扱わない', () => {
  const card = {
    querySelector: sel => (sel === '.ch2' ? {} : sel === '.ac' ? { textContent: '計算答：36' } : null),
    querySelectorAll: () => [],
  };
  assert.strictEqual(M.isCalc(card), false);
  assert.strictEqual(M.spec(card), null);
});

console.log('\n── リポジトリのデータ整合 ──');

const rows = NORM.collect();
const calc = rows.filter(r => M.parse(r.al));
const other = rows.filter(r => !M.parse(r.al));

t('選択肢を持たない問題は 74件（計算48・選択肢欠落26）', () => {
  assert.strictEqual(rows.length, 74, '実際は ' + rows.length + '件');
  assert.strictEqual(calc.length, 48, '計算問題が ' + calc.length + '件');
  assert.strictEqual(other.length, 26, '非計算が ' + other.length + '件');
});

t('計算問題の ans_label は全件が正規形（旧カンマ形式の混入なし）', () => {
  const bad = rows.filter(r => /計算答/.test(r.al) && !M.parse(r.al));
  assert.strictEqual(bad.length, 0,
    '正規形でない: ' + bad.map(r => r.uid + '=' + JSON.stringify(r.al)).join(', '));
});

t('桁数が問題文の解答テンプレートと一致する', () => {
  const bad = [];
  for (const r of calc) {
    const sp = M.parse(r.al);
    const run = NORM.pickRun(r.qt, sp.digits.length);
    if (!run) continue;                       // テンプレートが無い問題は照合対象外
    if (run.slots !== sp.digits.length) bad.push(r.uid + ' tmpl=' + run.slots + ' ans=' + sp.digits.length);
    if ((run.dec === null ? null : run.dec) !== sp.dec) bad.push(r.uid + ' 小数点 tmpl=' + run.dec + ' ans=' + sp.dec);
  }
  assert.strictEqual(bad.length, 0, bad.join(' / '));
});

t('同一問題が科目JSONと過去問HTMLの双方にある場合、正解が一致する', () => {
  const byEp = {};
  calc.forEach(r => { const k = NORM.epKey(r.ep); (byEp[k] = byEp[k] || []).push(r); });
  const bad = [];
  for (const k of Object.keys(byEp)) {
    const g = byEp[k];
    if (g.length < 2) continue;
    const vals = [...new Set(g.map(r => M.parse(r.al).answer))];
    if (vals.length > 1) bad.push(k + ': ' + g.map(r => r.uid + '=' + M.parse(r.al).answer).join(' vs '));
  }
  assert.strictEqual(bad.length, 0, bad.join(' / '));
  assert.ok(Object.values(byEp).filter(g => g.length > 1).length >= 10,
    '相互検証できる重複が少なすぎる（過去問側の抽出が壊れた疑い）');
});

t('全問が1〜6桁に収まる', () => {
  calc.forEach(r => {
    const n = M.parse(r.al).digits.length;
    assert.ok(n >= 1 && n <= 6, r.uid + ' の桁数 ' + n);
  });
});

console.log('\n── 読み込み構成と規約の同期 ──');

// コメント中のファイル名を拾わないよう、<script src="..."> の位置だけを見る
function scriptPos(html, file) {
  const m = html.match(new RegExp('<script src="[^"]*' + file.replace('.', '\\.') + '[^"]*"'));
  return m ? m.index : -1;
}

t('study.html は calc_input.js を study_exam.js より前に読む', () => {
  const h = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
  const a = scriptPos(h, 'calc_input.js'), b = scriptPos(h, 'study_exam.js');
  assert.ok(a >= 0, 'study.html が calc_input.js を読んでいない');
  assert.ok(b >= 0, 'study.html が study_exam.js を読んでいない');
  assert.ok(a < b, 'calc_input.js が study_exam.js より後ろにある');
});

t('計算問題を含む過去問HTMLは calc_input.js を chapter_exam.js より前に読む', () => {
  const files = [...new Set(rows.filter(r => r.kind === 'html' && M.parse(r.al)).map(r => r.file))];
  assert.ok(files.length >= 13, '計算問題を含む過去問HTMLが ' + files.length + '件しかない');
  const bad = [];
  for (const f of files) {
    const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const a = scriptPos(h, 'calc_input.js'), b = scriptPos(h, 'chapter_exam.js');
    if (a < 0 || b < 0 || a > b) bad.push(f);
  }
  assert.strictEqual(bad.length, 0, bad.join(', '));
});

t('正解の正規表現が calc_input.js / build_qmeta.py / pdf_audit.py で一致する', () => {
  // 3箇所に同じ規約が写っている。片方だけ緩めると qmeta の calc 判定や監査がすり抜ける。
  // ソース自体が正規表現なので、パターンとしてではなく文字列として突き合わせる。
  const src = {
    'calc_input.js': fs.readFileSync(path.join(ROOT, 'calc_input.js'), 'utf8'),
    'build_qmeta.py': fs.readFileSync(path.join(__dirname, 'build_qmeta.py'), 'utf8'),
    'pdf_audit.py': fs.readFileSync(path.join(__dirname, 'pdf_audit.py'), 'utf8'),
  };
  const parts = ['計算答[：:]\\s*', '[0-9]+(?:\\.[0-9]+)?'];
  for (const [name, text] of Object.entries(src)) {
    for (const p of parts) {
      assert.ok(text.includes(p), name + ' に規約 ' + JSON.stringify(p) + ' が無い（他の2箇所と乖離）');
    }
  }
});

t('sw.js の SHELL に calc_input.js が入っている（オフラインで採点不能にならない）', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes('calc_input.js'), 'sw.js が calc_input.js をキャッシュしていない');
});

console.log('\n' + (fail ? `NG ${fail}件 / ok ${pass}件` : `全 ${pass} 件 ok`));
process.exit(fail ? 1 : 0);
