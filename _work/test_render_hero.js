/**
 * ハブ（index.html）のヒーロー・14日間の推移（_renderSpark）レンダリング検証テスト
 * Run: node _work/test_render_hero.js
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const html = require('./lib_hub_source')();
const fxJs = fs.readFileSync(path.join(__dirname, '../fx_engine.js'), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

// 今日（JST）から n 日ずらした YYYY-MM-DD（index.html の日付の切り方と同じ）
const JST_DAY = n => new Date(Date.now() + 9 * 3600000 + n * 86400000).toISOString().slice(0, 10);

const elements = {};
function createMockElement(tagName = 'div', id = '') {
  const dataset = {};
  const classList = {
    _classes: new Set(),
    add: (c) => classList._classes.add(c),
    remove: (c) => classList._classes.delete(c),
    toggle: (c, on) => {
      if (on === undefined) on = !classList._classes.has(c);
      if (on) classList._classes.add(c);
      else classList._classes.delete(c);
    },
    contains: (c) => classList._classes.has(c)
  };
  const style = {
    setProperty: (k, v) => { style[k] = v; },
    getPropertyValue: (k) => style[k] || ''
  };
  const children = [];
  const el = {
    tagName,
    id,
    dataset,
    classList,
    style,
    children,
    textContent: '',
    innerHTML: '',
    hidden: false,
    setAttribute: (k, v) => { el.dataset[k] = v; },
    getAttribute: (k) => el.dataset[k] || '',
    removeAttribute: (k) => { delete el.dataset[k]; },
    querySelector: (sel) => {
      if (sel.startsWith('.bead-')) {
        return createMockElement('circle');
      }
      return createMockElement();
    },
    querySelectorAll: (sel) => [createMockElement()],
    closest: () => createMockElement(),
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: (c) => { children.push(c); return c; },
    getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 })
  };
  if (id) elements[id] = el;
  return el;
}

const canvasCtx = new Proxy({}, {
  get: (target, prop) => {
    return (...args) => {};
  }
});

const mockDoc = {
  getElementById: (id) => elements[id] || createMockElement('div', id),
  querySelector: (sel) => createMockElement(),
  querySelectorAll: (sel) => [createMockElement()],
  addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') mockDoc._onReady = fn; },
  createElement: (t) => {
    if (t === 'canvas') {
      return {
        getContext: () => canvasCtx,
        style: {},
        width: 100,
        height: 100
      };
    }
    return createMockElement(t);
  },
  createTextNode: (t) => ({ textContent: t }),
  documentElement: createMockElement('html'),
  body: createMockElement('body')
};

const mockWindow = {
  document: mockDoc,
  localStorage: {
    getItem: (k) => {
      // ⚠️ 日付は今日（JST）から数える。固定の日付だと14日の窓から外れた日にテストが落ちる
      //    （2026-08-31 固定で書かれていて、9月半ばから黙って落ちていた）
      if (k === 'activity_v1') return JSON.stringify({ [JST_DAY(-1)]: 15, [JST_DAY(0)]: 20 });
      if (k === 'mec_missions_v1') return JSON.stringify({ d: { [JST_DAY(0)]: { ans: 40 } } });
      return null;
    },
    setItem: () => {},
    removeItem: () => {}
  },
  navigator: { userAgent: 'test', serviceWorker: { register: () => Promise.resolve() } },
  addEventListener: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
  innerWidth: 1024,
  innerHeight: 768,
  Date: Date,
  Math: Math,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  performance: { now: () => Date.now() },
  setTimeout: (fn) => fn(),
  setInterval: () => {},
  clearTimeout: () => {},
  clearInterval: () => {},
  requestAnimationFrame: (fn) => fn(),
  cancelAnimationFrame: () => {},
  console: console,
  location: { href: 'http://localhost/index.html', search: '' }
};
mockWindow.window = mockWindow;

const ctx = vm.createContext(mockWindow);

// fx_engine.js ロード
vm.runInContext(fxJs, ctx);

vm.runInContext(`
  var chapters_meta = [];
  var KNOWLEDGE_NOTES = [];
  var MecAttempts = { todayWrongUids: () => [] };
  var MecGamify = { stats: () => ({ level: 1, title: '医学生', lvNeedXp: 100, lvCurXp: 0, lvProgress: 0 }), dailyGoal: () => ({ count: 20, target: 40, pct: 50 }) };
  var MECSync = { calcStreak: () => 2 };
`, ctx);

let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok  - ' + name);
    pass++;
  } catch (e) {
    console.error('  NG  - ' + name + '\n        ' + e.message);
    fail++;
  }
}

console.log('── index.html ヒーロー・14日間の推移テスト ──');

// ⚠️ 先頭のスクリプトとは限らない（index.html のインラインスクリプトは3本ある）。
//    renderHero を定義している1本を名前で探して読む。
const heroScript = inlineScripts.find(s => /function renderHero\s*\(/.test(s));

test('インラインスクリプトの評価に例外が発生しない', () => {
  assert.ok(heroScript, 'renderHero を定義しているインラインスクリプトが見つからない');
  vm.runInContext(heroScript, ctx);
});

// ⚠️ renderHero() 全体は呼ばない。ヒーローは MECSync.doneInScope・MecGamify など多くの口を読むので、
//    スタブが本物の API に追いつかずテストごと動かなくなっていた（2026-09-28 に発覚）。
//    このテストの対象は 14日間の推移（_renderSpark）だけなので、それを直接呼ぶ。
test('_renderSpark() が例外なく完走する', () => {
  vm.runInContext('_renderSpark()', ctx);
});

test('直近14日間のバー (heroSpark) が14本描画される', () => {
  const spark = elements['heroSpark'];
  assert.ok(spark, 'heroSpark要素が存在する');
  const barCols = (spark.innerHTML.match(/class="bar-col/g) || []).length;
  assert.strictEqual(barCols, 14, '14日分のバーカラムが描画されている');
});

test('週末ゾーン背景 (weekend) と週境界線 (week-end) が正しく付与される', () => {
  const spark = elements['heroSpark'];
  assert.ok(spark.innerHTML.includes('weekend'), '週末クラスが付与されている');
  assert.ok(spark.innerHTML.includes('week-end'), '週境界クラスが付与されている');
});

test('2週間最多日バーに record クラスと 👑 王冠が付与される', () => {
  const spark = elements['heroSpark'];
  assert.ok(spark.innerHTML.includes('record'), '最多日バーに record クラスが付与されている');
  assert.ok(spark.innerHTML.includes('bar-crown'), '最多日バーに王冠が付与されている');
});

test('直近14日間の日付ラベル (heroSparkDates) が14日分描画される', () => {
  const dates = elements['heroSparkDates'];
  assert.ok(dates, 'heroSparkDates要素が存在する');
  const dateLabels = (dates.innerHTML.match(/class="date-lbl/g) || []).length;
  assert.strictEqual(dateLabels, 14, '14日分の日付ラベルが描画されている');
});

test('連続学習トラック (heroStreakTrack) が14日分描画される', () => {
  const streakTrack = elements['heroStreakTrack'];
  assert.ok(streakTrack, 'heroStreakTrack要素が存在する');
  const segs = (streakTrack.innerHTML.match(/class="streak-seg/g) || []).length;
  assert.strictEqual(segs, 14, '14日分のストリークセグメントが描画されている');
});

test('2週間最多記録ヘッダー (heroSparkRecord) が正しく表示される', () => {
  const recordHdr = elements['heroSparkRecord'];
  assert.ok(recordHdr, 'heroSparkRecord要素が存在する');
  assert.ok(recordHdr.textContent.includes('2週間最多: 20問'), '最多記録テキストが含まれる');
});

if (fail > 0) {
  console.log(`\nFAILED (${pass}/${pass + fail})`);
  process.exit(1);
} else {
  console.log(`\nALL PASS (${pass}/${pass})`);
}
