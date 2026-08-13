/**
 * Tests for progress.js の Gist 同期 I/O（読み取りの切り詰め対策とファイル分割）。
 *
 * test_merge_remote.js と同じく実ソースをそのまま vm サンドボックスで読み込み、
 * fetch だけをスタブして syncFromGist / pushToGist を直接叩く。
 *
 * 守っている不変条件:
 *   ① API が content を切り詰めた(truncated:true)ら raw_url から取り直す
 *      — 2026-08-13の「Unterminated string in JSON at position 920360」の再発防止
 *   ② raw_url に Authorization を付けない（gist.githubusercontent.com はプリフライトを
 *      通さず "Failed to fetch" になる）
 *   ③ push は payload を GIST_SHARDS に従って複数ファイルへ分け、どのファイルも上限に届かない
 *   ④ リモートを読めなかったら push しない（他端末の進捗を上書きして消さない）
 *
 * Run:  node _work/test_gist_sync.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const RAW = fs.readFileSync(path.join(__dirname, '..', 'progress.js'), 'utf8');

const TOKEN = 'test-token';
const GIST_ID = 'test-gist-id';
const API = `https://api.github.com/gists/${GIST_ID}`;

// 呼び出しを記録する fetch スタブ。routes は URL 部分一致 → ハンドラ。
function makeFetch(routes, calls) {
  return async function fetchStub(url, opts) {
    calls.push({ url, opts: opts || {} });
    for (const [frag, handler] of routes) {
      if (url.includes(frag)) return handler(url, opts || {});
    }
    throw new TypeError('Failed to fetch');
  };
}

function res(body, status) {
  return {
    ok: (status || 200) < 400,
    status: status || 200,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function makeEnv(initialStore, routes) {
  const store = Object.assign(Object.create(null), initialStore || {});
  store['mec_gist_token'] = TOKEN;
  store['mec_gist_id'] = GIST_ID;

  const localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
  };

  const stubEl = () => ({
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '',
    addEventListener() {}, appendChild() {}, prepend() {}, after() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; },
    getBoundingClientRect() { return { height: 0, top: 0 }; },
  });

  const document = {
    addEventListener() {}, createElement: stubEl,
    head: { appendChild() {} }, body: { appendChild() {} },
    querySelector() { return null; }, querySelectorAll() { return []; },
    dispatchEvent() { return true; }, getElementById() { return null; },
  };

  const calls = [];
  const windowObj = { addEventListener() {} };
  const sandbox = {
    window: windowObj, document, localStorage,
    location: { hash: '', pathname: '/', search: '' },
    history: { replaceState() {} },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    TextEncoder,
    setTimeout, clearTimeout, console,
    fetch: makeFetch(routes || [], calls),
    Blob: class { constructor(p) { this.size = Buffer.byteLength(p.join('')); } },
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(RAW, sandbox, { filename: 'progress.js' });

  return {
    sync: windowObj.MECSync,
    store, calls,
    getObj(k) { return JSON.parse(store[k] || '{}'); },
    // PATCH/POST で送られた files を取り出す
    pushedFiles() {
      const c = calls.find(x => x.opts.method === 'PATCH' || x.opts.method === 'POST');
      return c ? JSON.parse(c.opts.body).files : null;
    },
  };
}

// Gist API の応答を組み立てる。files は {name: {content, truncated?, raw_url?}}
function gistRes(files) {
  return res({ files });
}

// 実データと同じ形の payload を作る
function payloadOf(over) {
  return Object.assign({
    done_v2: { a: 1 }, mec_srs_v1: { a: { reps: 1 } },
    myrate_v1: { a: { correct: 1, total: 2 } }, mec_attempts_v1: ['a|1|a|1|10|e|s|1'],
    mec_choice_v1: { a: { _last: 'b' } },
  }, over || {});
}

let passed = 0;
const failures = [];
function test(name, fn) {
  return fn().then(
    () => { passed++; console.log('  ok  - ' + name); },
    e => { failures.push({ name, e }); console.log('FAIL  - ' + name + '\n        ' + (e && e.message)); }
  );
}

(async () => {
  console.log('読み取り: content の切り詰め対策');

  await test('truncated:true なら raw_url から取り直して同期が成功する（920360バイト事件の回帰）', async () => {
    const full = JSON.stringify(payloadOf({ done_v2: { a: 1, b: 2 } }));
    const cut = full.slice(0, full.length - 20); // 途中で切れた JSON
    const env = makeEnv({}, [
      ['gist.githubusercontent.com', () => res(full)],
      [API, () => gistRes({
        'mec_progress.json': { content: cut, truncated: true, raw_url: 'https://gist.githubusercontent.com/raw/x' },
      })],
    ]);
    const r = await env.sync.syncFromGist();
    assert.strictEqual(r.status, 'ok', 'status: ' + JSON.stringify(r));
    assert.deepStrictEqual(env.getObj('done_v2'), { a: 1, b: 2 });
  });

  await test('raw_url は Authorization ヘッダ無しで取得する（付けるとCORSで落ちる）', async () => {
    const full = JSON.stringify(payloadOf());
    const env = makeEnv({}, [
      ['gist.githubusercontent.com', () => res(full)],
      [API, () => gistRes({
        'mec_progress.json': { content: '{"done_v2":', truncated: true, raw_url: 'https://gist.githubusercontent.com/raw/x' },
      })],
    ]);
    await env.sync.syncFromGist();
    const rawCall = env.calls.find(c => c.url.includes('gist.githubusercontent.com'));
    assert(rawCall, 'raw_url が取得されていない');
    const h = (rawCall.opts && rawCall.opts.headers) || {};
    assert(!Object.keys(h).some(k => k.toLowerCase() === 'authorization'),
      'raw_url に Authorization が付いている');
  });

  await test('truncated でなくても content が壊れていれば raw_url へ退避する', async () => {
    const full = JSON.stringify(payloadOf({ done_v2: { z: 9 } }));
    const env = makeEnv({}, [
      ['gist.githubusercontent.com', () => res(full)],
      [API, () => gistRes({
        'mec_progress.json': { content: '{"done_v2":{', raw_url: 'https://gist.githubusercontent.com/raw/x' },
      })],
    ]);
    const r = await env.sync.syncFromGist();
    assert.strictEqual(r.status, 'ok');
    assert.deepStrictEqual(env.getObj('done_v2'), { z: 9 });
  });

  await test('正常な content なら raw_url を取りに行かない（無駄な往復をしない）', async () => {
    const env = makeEnv({}, [[API, () => gistRes({
      'mec_progress.json': { content: JSON.stringify(payloadOf()) },
    })]]);
    const r = await env.sync.syncFromGist();
    assert.strictEqual(r.status, 'ok');
    assert(!env.calls.some(c => c.url.includes('githubusercontent')), 'raw を取りに行った');
  });

  await test('分割された複数ファイルを1つの payload に合成して取り込む', async () => {
    const env = makeEnv({}, [[API, () => gistRes({
      'mec_progress.json': { content: JSON.stringify({ done_v2: { a: 1 } }) },
      'mec_srs.json': { content: JSON.stringify({ mec_srs_v1: { a: { reps: 3, interval: 6 } } }) },
      'mec_rate.json': { content: JSON.stringify({ myrate_v1: { a: { correct: 2, total: 3 } } }) },
      'mec_attempts.json': { content: JSON.stringify({ mec_attempts_v1: ['a|1|a|1|10|e|s|1'] }) },
    })]]);
    const r = await env.sync.syncFromGist();
    assert.strictEqual(r.status, 'ok');
    assert.strictEqual(env.getObj('mec_srs_v1').a.interval, 6);
    assert.strictEqual(env.getObj('myrate_v1').a.total, 3);
    assert.strictEqual(JSON.parse(env.store['mec_attempts_v1']).length, 1);
  });

  await test('旧形式（全キーが mec_progress.json）をそのまま読める', async () => {
    const env = makeEnv({}, [[API, () => gistRes({
      'mec_progress.json': { content: JSON.stringify(payloadOf({ myrate_v1: { q: { correct: 4, total: 5 } } })) },
    })]]);
    const r = await env.sync.syncFromGist();
    assert.strictEqual(r.status, 'ok');
    assert.strictEqual(env.getObj('myrate_v1').q.total, 5);
  });

  await test('混在時は mec_progress.json（旧端末が書いた最新）が分割ファイルより優先される', async () => {
    const env = makeEnv({}, [[API, () => gistRes({
      'mec_srs.json': { content: JSON.stringify({ mec_srs_v1: { a: { reps: 1, interval: 1 } } }) },
      'mec_progress.json': { content: JSON.stringify({ mec_srs_v1: { a: { reps: 5, interval: 90 } } }) },
    })]]);
    await env.sync.syncFromGist();
    assert.strictEqual(env.getObj('mec_srs_v1').a.interval, 90);
  });

  console.log('\n書き込み: ファイル分割');

  await test('push は payload を4ファイルへ分け、どれも単独で JSON として妥当', async () => {
    const env = makeEnv({ done_v2: JSON.stringify({ a: 1 }), mec_srs_v1: JSON.stringify({ a: { reps: 2 } }) },
      [[API, (u, o) => (o.method === 'PATCH' ? res({ id: GIST_ID }) : gistRes({
        'mec_progress.json': { content: '{}' },
      }))]]);
    const r = await env.sync.pushToGist();
    assert.strictEqual(r.status, 'ok');
    const files = env.pushedFiles();
    assert.deepStrictEqual(Object.keys(files).sort(),
      ['mec_attempts.json', 'mec_progress.json', 'mec_rate.json', 'mec_srs.json']);
    for (const [n, f] of Object.entries(files)) JSON.parse(f.content); // 各ファイル単独で妥当
    assert(JSON.parse(files['mec_srs.json'].content).mec_srs_v1, 'srs が分割先にいない');
  });

  await test('大きいキーは mec_progress.json に残さない（1ファイルが上限に届かないため）', async () => {
    const env = makeEnv({}, [[API, (u, o) => (o.method === 'PATCH' ? res({}) : gistRes({
      'mec_progress.json': { content: '{}' },
    }))]]);
    await env.sync.pushToGist();
    const main = JSON.parse(env.pushedFiles()['mec_progress.json'].content);
    ['mec_srs_v1', 'mec_attempts_v1', 'myrate_v1', 'mec_choice_v1'].forEach(k => {
      assert(!(k in main), k + ' が mec_progress.json に残っている');
    });
    assert('done_v2' in main && '_ts' in main, '小さいキーは本体に入る');
  });

  await test('全キーがどこかのファイルに必ず入る（取りこぼしゼロ）', async () => {
    const env = makeEnv({}, [[API, (u, o) => (o.method === 'PATCH' ? res({}) : gistRes({
      'mec_progress.json': { content: '{}' },
    }))]]);
    await env.sync.pushToGist();
    const files = env.pushedFiles();
    const all = {};
    Object.values(files).forEach(f => Object.assign(all, JSON.parse(f.content)));
    ['done_v2', 'flag_v2', 'activity_v1', 'myrate_v1', 'studytime_v1', 'mec_srs_v1',
     'mec_attempts_v1', 'mec_choice_v1', 'mec_ch_exam_v1', 'mec_missions_v1',
     'error_reports_v1', '_ts'].forEach(k => assert(k in all, k + ' が送信対象から漏れた'));
  });

  console.log('\n書き込み: リモートを読めないときは押し切らない');

  await test('事前取得がネットワークエラーなら PATCH しない（他端末の進捗を消さない）', async () => {
    const env = makeEnv({}, []); // どの route にも当たらず throw
    const r = await env.sync.pushToGist();
    assert.strictEqual(r.status, 'error');
    assert(!env.calls.some(c => c.opts.method === 'PATCH'), 'PATCH してしまった');
  });

  await test('事前取得が401なら PATCH しない', async () => {
    const env = makeEnv({}, [[API, () => res({ message: 'Bad credentials' }, 401)]]);
    const r = await env.sync.pushToGist();
    assert.strictEqual(r.status, 'error');
    assert(!env.calls.some(c => c.opts.method === 'PATCH'), 'PATCH してしまった');
  });

  await test('リモートが本当に壊れている(raw も不正JSON)ときは push して直す', async () => {
    const env = makeEnv({}, [
      ['gist.githubusercontent.com', () => res('{"done_v2":{')],
      [API, (u, o) => (o.method === 'PATCH' ? res({}) : gistRes({
        'mec_progress.json': { content: '{"done_v2":{', truncated: true, raw_url: 'https://gist.githubusercontent.com/raw/x' },
      }))],
    ]);
    const r = await env.sync.pushToGist();
    assert.strictEqual(r.status, 'ok', '壊れたリモートを上書き修復できない');
  });

  await test('事前取得が成功したらリモートをマージしてから push する', async () => {
    const env = makeEnv({ done_v2: JSON.stringify({ local: 1 }) }, [
      [API, (u, o) => (o.method === 'PATCH' ? res({}) : gistRes({
        'mec_progress.json': { content: JSON.stringify({ done_v2: { remote: 2 } }) },
      }))],
    ]);
    await env.sync.pushToGist();
    const main = JSON.parse(env.pushedFiles()['mec_progress.json'].content);
    assert.deepStrictEqual(main.done_v2, { remote: 2, local: 1 }, 'read-modify-write が効いていない');
  });

  console.log('\n' + passed + ' passed, ' + failures.length + ' failed');
  if (failures.length) { failures.forEach(f => console.error('\n' + f.name + '\n' + (f.e && f.e.stack))); process.exit(1); }
})();
