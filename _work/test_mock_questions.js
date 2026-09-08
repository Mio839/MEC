// 夏メック模試の解説（questions_m121s.json）が壊れていないかを見る。
//
// ⚠️ PDF はリポジトリに無い（.gitignore 済み）ので、**PDFからの抽出そのものは
//    ここでは検証できない**（それは _work/build_mock_m121s_json.py の verify() の担当）。
//    ここが守るのは、独立に作られた2つの生成物どうしの一致:
//
//      mock_data/m121s.js   … 採点ツールのデータ（解答表・科目別一覧表・設問文の3点照合済み）
//      questions_m121s.json … 解説（同じPDFの本文側から起こした）
//
//    正解肢・必要選択数・図の有無・計算問題は**両方が独立に持っている**ので、
//    突き合わせれば片方の読み取りが壊れた時に必ず落ちる。
//
// 実行: node _work/test_mock_questions.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ZEN = 'ａｂｃｄｅ';
const CLS = ['ep', 'ee', 'ept', 'em', 'ec', 'ei'];

global.window = {};
require(path.join(ROOT, 'mock_data', 'm121s.js'));
const D = global.window.MecMockData.m121s;

// mock.js は localStorage を触るので、読み込むためだけの最小のスタブを置く。
global.localStorage = {
  _v: {}, getItem(k) { return this._v[k] || null; },
  setItem(k, v) { this._v[k] = String(v); }, removeItem(k) { delete this._v[k]; },
};
require(path.join(ROOT, 'mock.js'));
const M = global.window.MecMock;

const Q = JSON.parse(fs.readFileSync(path.join(ROOT, 'questions_m121s.json'), 'utf8'));
const cards = [].concat(...Q.chapters.map(c => c.qs));
const byUid = new Map(cards.map(c => [c.uid, c]));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

console.log('夏メック模試 解説（questions_m121s.json）');

// ── ① uid と表示番号 ────────────────────────────────────────────
t('章は6つ、問題は採点ツールと同じ数（' + D.questions.length + '問）', () => {
  assert.strictEqual(Q.sid, 'm121s');
  assert.strictEqual(Q.chapters.length, 6);
  assert.strictEqual(cards.length, D.questions.length);
});

// ⚠️ 規約②「Q.n は科目内で通し」。破ると同じ科目に Q.1 が6つできて jumpToQnum が壊れる
//    （精神科で実際に起きて是正した前科がある）。
t('番号は科目内で通し（1〜400が過不足なく1回ずつ・章の中では昇順）', () => {
  const seen = new Set();
  let prev = 0;
  cards.forEach(c => {
    const m = /^m121s_ch(\d\d)_q(\d+)$/.exec(c.uid);
    assert.ok(m, 'uid の形が違う: ' + c.uid);
    const n = +m[2];
    assert.ok(!seen.has(n), 'Q.' + n + ' が重複');
    seen.add(n);
    assert.strictEqual(c.qn, 'Q.' + n, c.uid + ' の表示番号が ' + c.qn);
    assert.ok(n > prev, c.uid + ' の番号が昇順でない');
    prev = n;
  });
  assert.strictEqual(seen.size, cards.length);
  assert.strictEqual(Math.min(...seen), 1);
  assert.strictEqual(Math.max(...seen), cards.length);
});

// ⚠️⚠️ 採点ツールの uid（m121s_A_q17）と解説の uid（m121s_ch01_q17）は別物。
//    対応は MecMock.studyUid() が唯一の正本で、生成器も同じ規則で作っている。
t('MecMock.studyUid() が解説側の uid をぴたりと指す', () => {
  const bad = [];
  D.questions.forEach(q => {
    const u = M.studyUid('m121s', q.block, q.no);
    if (!byUid.has(u)) bad.push(q.uid + ' -> ' + u);
  });
  assert.deepStrictEqual(bad, [], '解説に無い uid を指した: ' + bad.slice(0, 5).join(', '));
});

// ── ② 採点ツールとの照合（独立な2つの読み取りの一致）──────────────
t('正解の肢が採点ツールと一致する（計算問題は桁文字列）', () => {
  const bad = [];
  D.questions.forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    if (q.type === 'calc') {
      if (c.ans_label !== '計算答：' + q.ans[0]) bad.push(c.uid + ': ' + c.ans_label);
      if (c.choices.length) bad.push(c.uid + ': 計算問題に選択肢がある');
      return;
    }
    const got = c.choices.filter(x => x.ok).map(x => 'abcde'[ZEN.indexOf(x.t[0])]);
    if (got.join(',') !== q.ans.join(',')) bad.push(c.uid + ': ' + got + ' != ' + q.ans);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ⚠️ 「Nつ選べ」＝ok の数。設問文と解答表は独立な情報源なので、ここが割れたら
//    どちらかの読み取りが壊れている（CLAUDE.md「採点データの不変条件」）。
t('必要選択数（Nつ選べ）が ok の数と一致する', () => {
  const bad = [];
  D.questions.filter(q => q.type === 'choice').forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    const n = c.choices.filter(x => x.ok).length;
    if (n !== q.pick) bad.push(c.uid + ': pick=' + q.pick + ' ok=' + n);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

t('図を参照する122問が、採点ツールと同じ枚数の画像を持つ', () => {
  const bad = [];
  let n = 0;
  D.questions.forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    const want = (q.fig || []).length;
    if (want) n++;
    if (c.imgs.length !== want) bad.push(c.uid + ': ' + c.imgs.length + ' != ' + want);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
  assert.strictEqual(n, 122, '図を参照する設問が ' + n + '問');
});

t('参照される画像が1枚残らず実在する', () => {
  const missing = [];
  cards.forEach(c => c.imgs.forEach(src => {
    if (!fs.existsSync(path.join(ROOT, src))) missing.push(c.uid + ' -> ' + src);
  }));
  assert.deepStrictEqual(missing, [], missing.slice(0, 5).join(', '));
});

// ── ③ 連問 ──────────────────────────────────────────────────
// study.html の SERIES_DECL_RE。⚠️ ここを写しているのは「宣言文が study 側で
// 実際に連問として読めるか」を見るためで、番号が紙面のまま（41、42）だと
// **自分の番号が範囲に入らず**連問として復元できない。
const SERIES_DECL_RE = /次の文を読み[、,]?(?:Q\.|NO\.)?(\d+)[〜～~と・,、](?:Q\.|NO\.)?(\d+)/;

t('連問20群50問すべてで、宣言文の範囲に自分の番号が入る', () => {
  const groups = new Map();
  const bad = [];
  cards.forEach(c => {
    const m = SERIES_DECL_RE.exec(c.qt.replace(/<[^>]+>/g, ''));
    if (!m) return;
    const lo = +m[1], hi = +m[2], n = +/_q(\d+)$/.exec(c.uid)[1];
    if (!(lo <= n && n <= hi)) bad.push(c.uid + ': Q.' + lo + '〜Q.' + hi);
    const key = c.uid.slice(0, 11) + ':' + lo + '-' + hi;
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 5).join(' / '));
  const wanted = new Set(D.questions.filter(q => q.series).map(q => q.series));
  assert.strictEqual(groups.size, wanted.size, '群が ' + groups.size + '（採点ツールは ' + wanted.size + '）');
  groups.forEach((n, k) => assert.ok(n >= 2, k + ' が1問しかない'));
});

// ⚠️ 共有ブロック（出題ポイント〜check point）は**兄弟全員に配る**（2026-09-08 ユーザー裁定）。
//    SRS は兄弟が揃って出るとは限らないので、2問目だけ出た日に解説が空になってはいけない。
t('連問の兄弟は全員が出題ポイントと check point を持つ', () => {
  const bad = [];
  cards.forEach(c => {
    if (!SERIES_DECL_RE.test(c.qt.replace(/<[^>]+>/g, ''))) return;
    if (!c.eg.some(b => b.cls === 'ept')) bad.push(c.uid + ': 出題ポイントが無い');
    if (c.eg.filter(b => b.cls === 'ep').length === 0) bad.push(c.uid + ': check point が無い');
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 5).join(' / '));
});

// ── ④ カードの作り ──────────────────────────────────────────
t('解説の cls は study.css の6種だけ（独自クラスを作っていない）', () => {
  const bad = [];
  cards.forEach(c => c.eg.forEach(b => {
    if (!CLS.includes(b.cls)) bad.push(c.uid + ': ' + b.cls);
    if (!b.h.trim()) bad.push(c.uid + ': 見出しが空');
  }));
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

t('全問が選択肢考察（em / 計算は ec）を持つ', () => {
  const bad = cards.filter(c => !c.eg.some(b => b.cls === 'em' || b.cls === 'ec')).map(c => c.uid);
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ⚠️ ✅ の下は**正解の肢**の解説。○ の肢ではない——MEC の ○/× は「その記述が
//    正しいか」であって「これが正解か」ではなく、否定形の設問では × が正解になる。
t('✅ の下（ans_sub）が空でない（計算3問を除く）', () => {
  const bad = cards.filter(c => !c.ans_label.startsWith('計算答') && !c.ans_sub.trim())
    .map(c => c.uid);
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

t('選択肢考察で緑（kw3）に光るのは正解の肢だけ', () => {
  const bad = [];
  cards.forEach(c => {
    const em = c.eg.find(b => b.cls === 'em');
    if (!em) return;
    const ok = new Set(c.choices.filter(x => x.ok).map(x => x.t[0]));
    const hl = new Set();
    const re = /<span class="kw3">[○×□] ([ａ-ｅ])/g;
    let m;
    while ((m = re.exec(em.c))) hl.add(m[1]);
    if ([...ok].sort().join('') !== [...hl].sort().join('')) bad.push(c.uid);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ── ⑤ バッジ ────────────────────────────────────────────────
t('bb（模試の問題番号）が全問にあり、紙面の番号を指す', () => {
  const bad = [];
  D.questions.forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    const b = c.badges.find(x => x.cls === 'bb');
    if (!b || b.t !== q.block + '問題 ' + q.no) bad.push(c.uid + ': ' + (b && b.t));
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

t('必修（bh）が付くのは必修ブロック（B・E）の100問だけ', () => {
  const bad = [];
  D.questions.forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    const has = c.badges.some(x => x.cls === 'bh');
    if (has !== D.blocks[q.block].hisshu) bad.push(c.uid);
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
  const n = cards.filter(c => c.badges.some(x => x.cls === 'bh')).length;
  assert.strictEqual(n, 100, '必修が ' + n + '問');
});

t('一般/臨床はどちらか一方が必ず付く', () => {
  const bad = cards.filter(c => {
    const n = c.badges.filter(x => x.cls === 'bip' || x.cls === 'brn').length;
    return n !== 1;
  }).map(c => c.uid);
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ⚠️ 📷バッジと imgs の一致は「🖼️画像だけ」フィルタの根拠（CLAUDE.md の監査項目）。
t('📷バッジと imgs が食い違わない', () => {
  const bad = cards.filter(c => c.badges.some(x => x.cls === 'bi') !== (c.imgs.length > 0))
    .map(c => c.uid);
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

t('バッジのクラスは study.css に定義があるものだけ', () => {
  const css = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
  const used = new Set();
  cards.forEach(c => c.badges.forEach(b => used.add(b.cls)));
  const bad = [...used].filter(cl => !new RegExp('[.,]' + cl + '[,{]').test(css));
  assert.deepStrictEqual(bad, [], 'study.css に定義が無い: ' + bad.join(', '));
});

// ── ⑥ ネタバレ防止 ──────────────────────────────────────────
// ⚠️ 禁忌肢であることをカードの見出し（バッジ）に出さないこと。解説を開く前に
//    「この問題には踏んではいけない肢がある」と分かると、それ自体がヒントになる。
//    紙面の □ 印は選択肢考察の中（＝正解を見たあとの場所）にだけ残す。
t('禁忌肢17問がバッジで先にばれていない（□ は選択肢考察の中だけ）', () => {
  const taboo = D.questions.filter(q => q.taboo);
  assert.strictEqual(taboo.length, 17, '禁忌肢問題が ' + taboo.length + '問');
  const bad = [];
  taboo.forEach(q => {
    const c = byUid.get(M.studyUid('m121s', q.block, q.no));
    if (c.badges.some(b => /禁/.test(b.t))) bad.push(c.uid + ': バッジに禁忌');
    if (/禁忌|□/.test(c.qt)) bad.push(c.uid + ': 設問文に印');
    const em = c.eg.find(b => b.cls === 'em');
    if (!em || !/□ [ａ-ｅ]/.test(em.c)) bad.push(c.uid + ': 選択肢考察に □ の肢が無い');
  });
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ── ⑥' 解説の図（画像診断） ─────────────────────────────────
// ⚠️ 設問の図（imgs）とは別物。設問の図は素の写真で**選択肢より上**に出るが、
//    こちらは矢印と標識の入った読影図で、答えそのものなので解説ブロックの中に置く。
const EX = path.join(ROOT, '夏メック模試', 'images', 'ex');
const exRe = /<img[^>]*src="([^"]+)"/g;

t('画像診断の図140枚が実在し、余りファイルが無い', () => {
  const used = new Set();
  cards.forEach(c => c.eg.forEach(b => {
    let m;
    const re = new RegExp(exRe.source, 'g');
    while ((m = re.exec(b.c))) {
      assert.strictEqual(b.cls, 'ei', c.uid + ': 図が ' + b.cls + ' ブロックに入っている');
      used.add(path.basename(m[1]));
      assert.ok(fs.existsSync(path.join(ROOT, m[1])), c.uid + ' -> ' + m[1] + ' が無い');
    }
  }));
  const have = fs.readdirSync(EX);
  assert.strictEqual(used.size, 140, '参照されている図が ' + used.size + '枚');
  const extra = have.filter(f => !used.has(f));
  assert.deepStrictEqual(extra, [], '誰も参照しない余り: ' + extra.slice(0, 5).join(', '));
});

// ⚠️ 図の width/height は必ず出すこと。無いと遅延読込でカードの高さが後から伸びて
//    章ジャンプが目標に収束しない（image_dims.json を作った理由と同じ）。
//    ⚠️ ex/ の図は image_dims.json に載らない（あれは q.imgs だけを走る）ので、
//       属性は生成時に実ファイルから読んで焼き込んである。
t('解説の図はすべて width/height を持ち、実ファイルの寸法と一致する', () => {
  const bad = [];
  cards.forEach(c => c.eg.forEach(b => {
    const re = /<img([^>]*)src="([^"]+)"/g;
    let m;
    while ((m = re.exec(b.c))) {
      const w = /width="(\d+)"/.exec(m[1]);
      const h = /height="(\d+)"/.exec(m[1]);
      if (!w || !h) { bad.push(c.uid + ': 寸法が無い'); continue; }
      const size = fs.statSync(path.join(ROOT, m[2])).size;
      if (!size) bad.push(m[2] + ': 空ファイル');
      if (+w[1] > 1200 || +h[1] > 1200) bad.push(m[2] + ': 長辺が 1200px を超える');
    }
  }));
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ⚠️ 「写真A　…」の説明文と図は**紙面と同じ交互の並び**で入れること。文を全部先に
//    出して図を後ろへまとめると、どの説明がどの絵のことか読めなくなる。
t('複数の図がある節では、説明文と図が交互に並ぶ', () => {
  const bad = [];
  cards.forEach(c => c.eg.forEach(b => {
    if (b.cls !== 'ei') return;
    const n = (b.c.match(/<img/g) || []).length;
    if (n < 2) return;
    // ⚠️ 「写真A、B　…」と2枚まとめて1つの説明文が付く節がある（E42・F49）ので、
    //    説明文の数と図の数が1対1のときだけ交互かどうかを見る。
    const caps = (b.c.match(/(^|<br\/>|>)写真/g) || []).length;
    if (caps !== n) return;
    const parts = b.c.split(/<img[^>]*>/);
    if (!parts.slice(0, n).every(p => /写真/.test(p))) bad.push(c.uid);
  }));
  assert.deepStrictEqual(bad, [], bad.slice(0, 6).join(' / '));
});

// ── ⑦ 統合の配管 ────────────────────────────────────────────
t('sw.js の CARDS と SHELL に必要なファイルが入っている', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes('"questions_m121s.json"'), 'CARDS に questions_m121s.json が無い');
});

t('image_dims.json が模試の画像138枚の実寸を持つ', () => {
  const dims = JSON.parse(fs.readFileSync(path.join(ROOT, 'image_dims.json'), 'utf8'));
  const bad = [];
  cards.forEach(c => c.imgs.forEach(src => {
    const d = dims[src];
    if (!d || d.length !== 2 || !d[0] || !d[1]) bad.push(src);
  }));
  assert.deepStrictEqual(bad, [], '実寸が無い: ' + bad.slice(0, 5).join(', '));
});

console.log(`\n${fail ? 'FAILED' : 'all passed'}  (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
