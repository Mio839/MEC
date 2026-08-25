/**
 * card_renderer.js の出力を実データで検証する。
 * Run: node _work/test_card_render.js
 *
 * 守りたいこと:
 *   - 画像に width/height が必ず載る（無いと遅延読込でレイアウトが後からずれ、
 *     章ジャンプが目標に収束しない旧バグが戻る）
 *   - 実寸は image_dims.json と一致し、questions_*.json の全画像参照を網羅している
 *   - 自己採点3ボタン（× / △ / ○）が data-action="lap" + data-grade で出る
 *   - ○ は .mec-lap-btn のまま（study_exam.js / progress.js / キーボード操作が掴んでいる）
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..');

const DIMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'image_dims.json'), 'utf8'));

// card_renderer.js を window 付きで読み込む
const ctx = { window: {}, console };
ctx.window.MEC_IMG_DIMS = DIMS;
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'card_renderer.js'), 'utf8'), ctx);
const renderCard = ctx.window._renderCardFromJson;
assert.ok(typeof renderCard === 'function', '_renderCardFromJson が公開されていない');

const SIDS = ['endo', 'resp', 'circ', 'dige', 'neur', 'hbp', 'jinzo_d', 'hema', 'imma',
              'kansen', 'peds', 'obg', 'psy', 'derm', 'oph', 'ent', 'uro', 'ortho', 'anes', 'rad', 'tox', 'ph', 'jitsu1', 'custom', 'memo'];

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

// 全科目の画像問題を1回だけ走査して結果を集める
const stats = { imgQs: 0, imgs: 0, noSize: [], wrongSize: [], notInDims: [] };
const sample = {};
for (const sid of SIDS) {
  const p = path.join(ROOT, `questions_${sid}.json`);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const ch of data.chapters || []) {
    for (const q of ch.qs || []) {
      const html = renderCard(q);
      if (!sample.any) sample.any = html;
      if (!(q.imgs && q.imgs.length)) continue;
      if (!sample.img) sample.img = html;
      stats.imgQs++;
      q.imgs.forEach(src => {
        stats.imgs++;
        if (!DIMS[src]) { stats.notInDims.push(src); return; }
        const [w, h] = DIMS[src];
        const tag = html.split('<img').find(s => s.includes('src="' + src + '"'));
        if (!tag) { stats.noSize.push(q.uid + ' / ' + src + ' (imgタグが出ていない)'); return; }
        if (!/ width="\d+" height="\d+"/.test(tag)) { stats.noSize.push(q.uid + ' / ' + src); return; }
        if (!tag.includes(`width="${w}" height="${h}"`)) stats.wrongSize.push(q.uid + ' / ' + src);
      });
    }
  }
}

t('全科目の画像参照が image_dims.json に載っている', () => {
  assert.strictEqual(stats.notInDims.length, 0,
    `${stats.notInDims.length}件: ` + stats.notInDims.slice(0, 3).join(', '));
});

t('すべての <img> に width/height が出る', () => {
  assert.ok(stats.imgs > 2000, '画像参照が少なすぎる: ' + stats.imgs);
  assert.strictEqual(stats.noSize.length, 0,
    `${stats.noSize.length}件: ` + stats.noSize.slice(0, 3).join(', '));
});

t('出力される寸法が image_dims.json と一致する', () => {
  assert.strictEqual(stats.wrongSize.length, 0,
    `${stats.wrongSize.length}件: ` + stats.wrongSize.slice(0, 3).join(', '));
});

t('画像は lazy + async decode のまま', () => {
  assert.ok(sample.img.includes('loading="lazy"'));
  assert.ok(sample.img.includes('decoding="async"'));
});

t('自己採点3段階が出る（× / △ / ○）', () => {
  const h = sample.any;
  ['data-grade="ng"', 'data-grade="mid"', 'data-grade="ok"'].forEach(g =>
    assert.ok(h.includes(g), '見つからない: ' + g));
  assert.strictEqual((h.match(/data-action="lap"/g) || []).length, 3,
    '3つとも data-action="lap" であること');
});

t('○ は .mec-lap-btn のまま（既存コードが掴んでいる）', () => {
  const h = sample.any;
  assert.ok(h.includes('class="mec-lap-btn"'), '.mec-lap-btn が無い');
  assert.ok(h.includes('<span class="mec-lap-num">'), '周回数の入れ物が無い');
  const lap = h.split('<button').find(s => s.includes('class="mec-lap-btn"'));
  assert.ok(lap.includes('data-grade="ok"'), '○ の grade が ok でない');
});

t('実寸が無い画像では属性を省くだけで描画は壊れない', () => {
  const noDims = { window: { MEC_IMG_DIMS: {} }, console };
  noDims.globalThis = noDims;
  vm.createContext(noDims);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'card_renderer.js'), 'utf8'), noDims);
  const html = noDims.window._renderCardFromJson({
    uid: 'x_ch01_q1', qn: 'Q.1', badges: [], qt: 't', choices: [{ t: 'a', ok: true }],
    ans_label: 'a', ans_sub: '', imgs: ['nope/none.jpeg'], eg: [],
  });
  assert.ok(html.includes('src="nope/none.jpeg"'), 'img自体は出る');
  assert.ok(!/ width="/.test(html), '属性は付けない');
});

console.log(`\n画像問題 ${stats.imgQs} 問 / 画像 ${stats.imgs} 枚を検証`);
console.log(`${fail ? 'FAILED' : 'all passed'}  (${pass}/${pass + fail})`);
process.exit(fail ? 1 : 0);
