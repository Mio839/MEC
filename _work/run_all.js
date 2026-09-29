#!/usr/bin/env node
/**
 * テストと生成物の食い違い検査を1本で流す（2026-09-28〜）。
 *
 *   node _work/run_all.js            テスト全部＋生成物の --check（約20〜40秒）
 *   node _work/run_all.js --quick    テストだけ
 *   node _work/run_all.js --browser  上に加えて実ブラウザのテスト（Chrome が要る・章ジャンプの計測で約15分）
 *   node _work/run_all.js --ci       PDF など Git 管理外のものが要る検査を「スキップ」と明示して流す
 *
 * 合否は**終了コードだけ**で決める。出力の最後の行は信用しない——2026-09-28 まで8本のテストが
 * 失敗しても「全 N 件 ok」（合格数）を最後に出しており、目で見ると合格に見えた。
 * 例外は validate_images.py だけ（終了コードを返さないので、pre-commit と同じく「! [」の行で判定する）。
 *
 * 生成物は「作り直したら現物と同じになるか」を見る。必修講座（hisshu）は他の科目の解説を借りるので、
 * 元の科目を直したら必修講座も作り直す必要がある——ここがそれを捕まえる。
 *
 * push の前にフック（_work/hooks/pre-push）がこれを流す。GitHub Actions でも --ci で流している。
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const BROWSER = args.includes('--browser');
const CI = args.includes('--ci');
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

// PDF（Git 管理外）を読む生成器。PDF が無ければスキップする
const PDF = {
  m121s: 'MEC問題文pdf/2026年度 夏メック模試_解説書.pdf',
  hisshu: 'MEC問題文pdf/MEC必修講座Part1（表紙2026）.pdf',
  hisshu2: 'MEC問題文pdf/MEC必修講座Part2（表紙2026）.pdf',
  sumresp: 'MEC問題文pdf/国試サマライズ・メジャー・呼吸器（表紙2026）.pdf',
};
const hasPdf = k => fs.existsSync(path.join(ROOT, PDF[k]));

const jobs = [];
// ── テスト（node）──────────────────────────────────────────────
for (const f of fs.readdirSync(path.join(ROOT, '_work')).sort()) {
  if (/^(test_.*|check_.*)\.js$/.test(f)) jobs.push({ group: 'テスト', name: f, cmd: 'node', argv: ['_work/' + f] });
}
// ── 生成物の食い違い ────────────────────────────────────────────
if (!QUICK) {
  const gen = (name, cmd, argv, need) => jobs.push({ group: '生成物', name, cmd, argv, need });
  gen('rate_index.js（全国正答率の索引）', 'node', ['_work/build_natrate_index.js', '--check']);
  gen('dup_index.js（重複コピーの組）', 'node', ['_work/build_dup_index.js', '--check']);
  gen('sounds_index.js（効果音の一覧）', 'node', ['_work/build_sounds_index.js', '--check']);
  gen('theme_css/（テーマ別の CSS）', 'node', ['_work/build_theme_css.js', '--check']);
  gen('mindmap_data/index.js（マインドマップのレジストリ）', 'node', ['_work/build_mindmap_index.js', '--check']);
  gen('mock_data/m121s_rates.js（模試の成績表）', 'node', ['_work/build_mock_m121s_rates.js', '--check']);
  gen('qmeta.json（設問形式）', PY, ['_work/build_qmeta.py', '--check']);
  gen('image_dims.json（画像の実寸）', PY, ['_work/build_image_dims.py', '--check']);
  gen('questions_m121s.json（模試の解説）', PY, ['_work/build_mock_m121s_json.py', '--check'], 'm121s');
  gen('questions_hisshu.json（必修講座Part1）', PY, ['_work/build_hisshu_json.py', '--check'], 'hisshu');
  gen('questions_hisshu2.json（必修講座Part2）', PY, ['_work/build_hisshu2_json.py', '--check'], 'hisshu2');
  gen('questions_sumresp.json（サマライズ呼吸器）', PY, ['_work/build_sumresp_json.py', '--check'], 'sumresp');
  jobs.push({ group: '生成物', name: '画像の整合性（validate_images.py A・D）', cmd: PY, argv: ['_work/validate_images.py', '--only', 'A', 'D'],
              judge: out => !/! \[/.test(out) });
}
// ── 実ブラウザ ────────────────────────────────────────────────
if (BROWSER) {
  jobs.push({ group: 'ブラウザ', name: 'test_jumps_browser.py（章・番号ジャンプ）', cmd: PY, argv: ['_work/test_jumps_browser.py'], timeout: 3600e3 });
  for (const h of ['test_mock_browser.html', 'test_mock_wrong_browser.html', 'test_err_note_browser.html']) {
    jobs.push({ group: 'ブラウザ', name: h, html: h });
  }
}

function run(job) {
  return new Promise(resolve => {
    if (job.need && !hasPdf(job.need)) {
      return resolve({ job, status: 'skip', out: 'PDF が無い（Git 管理外）: ' + PDF[job.need] });
    }
    if (job.html) return runHtml(job).then(resolve);
    const t0 = Date.now();
    const p = spawn(job.cmd, job.argv, { cwd: ROOT, env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' }) });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    const timer = setTimeout(() => { p.kill(); out += '\n(時間切れ)'; }, job.timeout || 300e3);
    p.on('error', e => { clearTimeout(timer); resolve({ job, status: 'fail', out: String(e), ms: Date.now() - t0 }); });
    p.on('close', code => {
      clearTimeout(timer);
      const ok = code === 0 && (!job.judge || job.judge(out));
      resolve({ job, status: ok ? 'pass' : 'fail', out, ms: Date.now() - t0 });
    });
  });
}

// html のテストは <title> が ALLPASS になるかを headless Chrome で見る（http で開く必要がある）
function runHtml(job) {
  const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
                  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(c => fs.existsSync(c));
  if (!chrome) return Promise.resolve({ job, status: 'skip', out: 'Chrome が見つからない' });
  return new Promise(resolve => {
    const http = require('http');
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      const ext = path.extname(f);
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
      fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'mecrun_'));
      const p = spawn(chrome, ['--headless=new', '--disable-gpu', '--user-data-dir=' + prof, '--virtual-time-budget=20000',
                               '--dump-dom', 'http://127.0.0.1:' + port + '/_work/' + job.html]);
      let out = '';
      p.stdout.on('data', d => { out += d; });
      p.on('close', () => {
        srv.close();
        const title = (/<title>([\s\S]*?)<\/title>/.exec(out) || [])[1] || '(title なし)';
        resolve({ job, status: /^ALLPASS/.test(title.trim()) ? 'pass' : 'fail', out: title.slice(0, 400) });
      });
    });
  });
}

async function main() {
  const t0 = Date.now();
  const results = [];
  // 並列で流す（ブラウザ系は重いので1本ずつ）
  const light = jobs.filter(j => j.group !== 'ブラウザ'), heavy = jobs.filter(j => j.group === 'ブラウザ');
  const N = Math.max(2, Math.min(8, os.cpus().length));
  let i = 0;
  await Promise.all(Array.from({ length: N }, async () => {
    while (i < light.length) results.push(await run(light[i++]));
  }));
  for (const j of heavy) results.push(await run(j));

  const order = new Map(jobs.map((j, k) => [j, k]));
  results.sort((a, b) => order.get(a.job) - order.get(b.job));
  const by = s => results.filter(r => r.status === s);
  for (const g of ['テスト', '生成物', 'ブラウザ']) {
    const rs = results.filter(r => r.job.group === g);
    if (!rs.length) continue;
    const f = rs.filter(r => r.status === 'fail').length, s = rs.filter(r => r.status === 'skip').length;
    console.log(`■ ${g}  ${rs.length - f - s} 合格` + (f ? ` / ${f} 失敗` : '') + (s ? ` / ${s} スキップ` : ''));
    for (const r of rs) {
      if (r.status === 'pass') continue;
      console.log(`  ${r.status === 'fail' ? '✗ 失敗' : '－ スキップ'}  ${r.job.name}`);
      const tail = String(r.out || '').trim().split(/\r?\n/).filter(Boolean).slice(-8);
      if (r.status === 'fail') tail.forEach(l => console.log('      ' + l.slice(0, 220)));
      else console.log('      ' + tail.join(' '));
    }
  }
  const fails = by('fail').length;
  console.log(`\n${fails ? '✗ ' + fails + ' 件失敗' : '✓ すべて合格'}（${results.length} 件・スキップ ${by('skip').length}・${((Date.now() - t0) / 1000).toFixed(1)} 秒）`);
  if (by('skip').length && !CI) console.log('  ※ スキップは PDF など Git 管理外のものが無いため。この環境では検査していない');
  // フック（_work/hooks/）は Git 管理下にあるが、有効にする設定はマシンごとに1回要る
  if (!CI) {
    try {
      const hp = require('child_process').execSync('git config core.hooksPath', { cwd: ROOT }).toString().trim();
      if (hp !== '_work/hooks') throw new Error(hp);
    } catch (e) {
      console.log('  ※ このマシンでは _work/hooks/ のフックが無効。有効にするには: git config core.hooksPath _work/hooks');
    }
  }
  process.exit(fails ? 1 : 0);
}

main();
