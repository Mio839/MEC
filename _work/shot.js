const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8092;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT_DIR = path.resolve(__dirname, '..');
const SHOTS_DIR = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

function generatePreviewHtml(theme, isExam = false, state = 'default', isCollapsed = false, combo = 1) {
  const isAnswered = state === 'answered' || state === 'correct' || state === 'combo' || !isExam;
  const isCorrectState = state === 'correct';
  const isComboState = state === 'combo';
  return `<!DOCTYPE html>
<html class="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/study.css">
<link rel="stylesheet" href="/ui_theme.css">
<title>Theme Preview - ${theme} (Exam: ${isExam}, State: ${state}, Combo: ${combo}, Collapsed: ${isCollapsed})</title>
<style>
body { margin: 20px auto; max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; }
.preview-container { display: flex; flex-direction: column; gap: 16px; position: relative; }
@media (max-width: 600px) {
  body { margin: 8px auto; padding: 0 8px; }
}
</style>
</head>
<body class="${isExam ? 'exam-mode' : ''} ${isComboState ? 'combo-active' : ''}">
<div class="preview-container">
  <header class="st-hdr ${isCollapsed ? 'hdr-collapsed' : ''}">
    <div class="st-title-row">
      <div class="st-title-left">
        <span class="st-title">📚 統合学習ツール</span>
        <a class="hub-link" href="#">← ハブへ</a>
        <div class="st-stat">済 <span>12</span>問</div>
        <div class="st-stat">合計 <span>5487</span>問</div>
        <div class="st-stat"><span class="st-streak">🔥 <span>3</span>日連続</span></div>
        <button type="button" class="st-stat gm-lv-chip">Lv.<b>12</b></button>
        <button type="button" class="st-stat gm-mission-chip">🎯 1/3</button>
        <button class="st-stat exam-mode-chip">🎓 試験モード</button>
        <span class="mec-sync-badge">⚙️ 未設定</span>
        <button class="mec-err-badge" style="display:inline-flex;">⚠️ 0件</button>
        <span class="vis-count">—</span>
      </div>
      <div class="st-title-right">
        <button class="hdr-btn hdr-theme-btn">🎨 テーマ</button>
        <button class="hdr-btn">♻️</button>
        <button class="hdr-toggle">${isCollapsed ? '▶' : '▼'}</button>
        <span id="mecBuildVer" style="font-size:10px;font-weight:700;color:rgba(120,179,255,.85);align-self:center;">b-0725a</span>
      </div>
    </div>
    ${!isCollapsed ? `
    <div class="st-filter-panel" style="margin-top:8px;">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="nb fc-on">全問</button>
        <button class="nb">難問</button>
        <button class="nb">標準</button>
        <button class="nb">易問</button>
      </div>
    </div>` : ''}
  </header>

  <!-- 学習ハブ Heroゲージ (演出確認用) -->
  <div style="display:flex; justify-content:center; align-items:center; padding:16px 0; background:rgba(0,0,0,0.2); border-radius:16px;">
    <div class="gauge" id="gaugeBox" data-tier="4">
      <div class="gauge-ring">
        <svg viewBox="0 0 168 168" aria-hidden="true">
          <path class="gear gear-main" id="gearMain"></path>
          <path class="gear gear-a"    id="gearA"></path>
          <path class="gear gear-b"    id="gearB"></path>
          <path class="gear gear-c"    id="gearC"></path>
          <path class="gear gear-d"    id="gearD"></path>
          <circle class="gauge-trk"  cx="84" cy="84" r="54"></circle>
          <circle class="gauge-val" id="gaugeVal" cx="84" cy="84" r="54" style="stroke-dashoffset: 84.8;"></circle>
          <circle class="gauge-ovf" id="gaugeOvf" cx="84" cy="84" r="54"></circle>
          <g class="gauge-dot" id="gaugeDot" style="transform-origin:84px 84px; transform: rotate(270deg);">
            <circle class="halo" cx="84" cy="30" r="10"></circle>
            <circle cx="84" cy="30" r="5"></circle>
          </g>
        </svg>
        <span class="gauge-mid" id="gaugeMid"><span id="statPct">75</span><em>%</em></span>
      </div>
      <p class="gauge-cap" id="gaugeCap" style="margin:4px 0 2px; font-size:12px; opacity:0.8;">今日の目標 (Tier 4)</p>
      <p class="gauge-goal" style="margin:0; font-size:13px; font-weight:700;"><b id="gaugeDoneN">30</b> / <span id="gaugeGoalN">40</span>問</p>
    </div>
  </div>
  <script>
    function _gearPath(cx, cy, root, tip, n) {
      const step = Math.PI * 2 / n, w = step * .27;
      const pt = (a, r) => (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2);
      let d = 'M' + pt(-w, root);
      for (let i = 0; i < n; i++) {
        const a = i * step;
        d += 'L' + pt(a - w * .58, tip) + 'L' + pt(a + w * .58, tip) + 'L' + pt(a + w, root);
        d += 'A' + root + ' ' + root + ' 0 0 1 ' + pt(a + step - w, root);
      }
      return d + 'Z';
    }
    function _holePath(cx, cy, r) {
      return 'M' + (cx + r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + 'Z';
    }
    [
      { id: 'gearMain', cx: 84,  cy: 84,  root: 74,   tip: 82, n: 24, hole: 66 },
      { id: 'gearA',    cx: 17,  cy: 17,  root: 10.6, tip: 17, n: 12, hole: 4.8 },
      { id: 'gearB',    cx: 151, cy: 151, root: 11.5, tip: 17, n: 16, hole: 5.1 },
      { id: 'gearC',    cx: 148, cy: 20,  root: 8,    tip: 13, n: 10, hole: 3.7 },
      { id: 'gearD',    cx: 18,  cy: 150, root: 10,   tip: 15, n: 14, hole: 4.4 }
    ].forEach(g => {
      const el = document.getElementById(g.id);
      if (el) {
        el.setAttribute('d', _gearPath(g.cx, g.cy, g.root, g.tip, g.n) + _holePath(g.cx, g.cy, g.hole));
        el.setAttribute('fill-rule', 'evenodd');
      }
    });
  </script>

  <!-- 問題カード -->
  <div class="qc ${isAnswered ? 'answered ok-card' : ''} ${isCorrectState ? 'fx-correct' : ''} ${isComboState ? 'combo-streak-' + combo : ''}" style="padding: 24px; position: relative;">
    <div class="qh" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <div style="display:flex; gap:10px; align-items:center;">
        <span class="qn">問 12</span>
        <span class="bg">必修</span>
        <span class="cr">84%</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="mec-grade-btn ${isAnswered ? 'selected-ok' : ''}">○</button>
        <button class="mec-grade-btn">×</button>
        <button class="mec-flag-btn">🚩</button>
      </div>
    </div>

    <div class="qq" style="font-size:16.5px; line-height:1.65; margin-bottom:20px; color:#fff; font-weight:500;">
      68歳の男性。労作時の息切れと下腿浮腫を主訴に来院した。心エコー検査にて左室駆出率35%のびまん性壁運動低下を認める。第一選択となる治療薬として最も適切なのはどれか。
    </div>

    <div class="qch" style="display:flex; flex-direction:column; gap:12px;">
      <div class="ch2" style="padding:14px 18px;">a  ループ利尿薬</div>
      <div class="ch2 ${isExam && !isAnswered ? 'exam-selected' : (isAnswered ? 'selected ok correct' : '')}" style="padding:14px 18px;">b  β遮断薬およびACE阻害薬/ARNI</div>
      <div class="ch2" style="padding:14px 18px;">c  ジギタリス製剤</div>
      <div class="ch2 ${isAnswered ? 'ok correct' : ''}" style="padding:14px 18px;">d  SGLT2阻害薬・MRA併用療法</div>
      <div class="ch2" style="padding:14px 18px;">e  カルシウム拮抗薬</div>
    </div>

    ${isAnswered ? `
    <div class="ab" style="margin-top:20px; padding:14px 18px;">
      <strong>【正解】 b, d</strong>
    </div>

    <div class="eg" style="margin-top:16px; padding:16px 20px;">
      <div style="font-weight:bold; margin-bottom:8px;">💡 解説・エピソード</div>
      HFrEF（駆出率低下型心不全）の予後改善薬は「Fantastic 4」（β遮断薬、ARNI/ACEI、MRA、SGLT2阻害薬）が基本となる。
    </div>` : ''}

    ${isComboState ? `
    <div class="mec-combo-badge combo-badge-${combo}" style="position:absolute; top:-16px; right:20px; z-index:10;">
      <span class="combo-count">${combo}</span>
      <span class="combo-label">${combo >= 10 ? 'PERFECT COMBO!' : combo >= 5 ? 'SUPER COMBO!' : 'COMBO!'}</span>
    </div>` : ''}
  </div>
</div>

<script src="/fx_engine.js"></script>
<script src="/ui_theme.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const rawTheme = "${theme}".replace('ui-', '');
    if (window.MecUITheme) {
      MecUITheme.apply(rawTheme);
    }
    ${isCorrectState ? `
    setTimeout(() => {
      if (window.MecUITheme && MecUITheme.triggerFx) {
        MecUITheme.triggerFx(rawTheme);
      }
    }, 100);` : ''}
    ${isComboState ? `
    setTimeout(() => {
      if (window.MecUITheme && MecUITheme.triggerFx) {
        MecUITheme.triggerFx(rawTheme);
      }
    }, 100);` : ''}
  });
</script>
</body>
</html>`;
}

function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    let reqPath = reqUrl.pathname;
    let stateParam = reqUrl.searchParams.get('state') || 'default';
    let comboParam = parseInt(reqUrl.searchParams.get('combo') || '1', 10);
    let isCollapsed = reqUrl.searchParams.get('collapsed') === 'true';

    if (reqPath.startsWith('/preview/')) {
      const isExam = reqPath.includes('_exam');
      const theme = reqPath.replace('/preview/', '').replace('_exam', '').replace('.html', '');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generatePreviewHtml(theme, isExam, stateParam, isCollapsed, comboParam));
      return;
    }

    if (reqPath === '/' || reqPath === '') reqPath = '/study.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => resolve(server));
  });
}

function cdpSend(ws, method, params = {}, id = 1) {
  return new Promise((resolve, reject) => {
    const handleMsg = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handleMsg);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handleMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureAll(iterName = 'iter1', state = 'default', isCollapsed = false, isExam = false, combo = 1, targetTheme = '') {
  const server = await startServer();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mec-'));
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${tmpDir}`,
    '--disable-gpu',
    '--window-size=1200,960',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const listRes = await fetch('http://localhost:9226/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener('open', resolve));

  let msgId = 1;
  await cdpSend(ws, 'Page.enable', {}, msgId++);
  await cdpSend(ws, 'DOM.enable', {}, msgId++);

  const allTargetThemes = ['ui-kintsugi', 'ui-celestial', 'ui-abyss', 'ui-frost'];
  const themes = targetTheme ? (targetTheme.startsWith('ui-') ? [targetTheme] : ['ui-' + targetTheme]) : allTargetThemes;
  const captured = {};

  const viewports = [
    { name: 'desktop', width: 1200, height: 960, mobile: false },
    { name: 'mobile', width: 375, height: 812, mobile: true, deviceScaleFactor: 2 }
  ];

  for (const vp of viewports) {
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor || 1,
      mobile: vp.mobile
    }, msgId++);

    for (const t of themes) {
      const examSuffix = isExam ? '_exam' : '';
      const previewUrl = `http://localhost:${PORT}/preview/${t}${examSuffix}.html?state=${state}&collapsed=${isCollapsed}&combo=${combo}`;
      await cdpSend(ws, 'Page.navigate', { url: previewUrl }, msgId++);
      await new Promise(r => setTimeout(r, 600));

      const shot = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' }, msgId++);
      const vpSuffix = vp.name === 'mobile' ? '_mobile' : '';
      const stateSuffix = state !== 'default' ? `_${state}` : '';
      const comboSuffix = state === 'combo' ? `_combo${combo}` : '';
      const colSuffix = isCollapsed ? '_collapsed' : '';
      const examFileSuffix = isExam ? '_exam' : '';
      const outFile = path.join(SHOTS_DIR, `${iterName}_${t}${vpSuffix}${stateSuffix}${comboSuffix}${colSuffix}${examFileSuffix}.png`);
      fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
      captured[`${t}_${vp.name}`] = outFile;
      console.log(`Saved screenshot: ${outFile}`);
    }
  }

  ws.close();
  chromeProc.kill();
  server.close();
  return captured;
}

const args = process.argv.slice(2);
let iter = 'iter1';
let state = 'default';
let isCollapsed = false;
let isExam = false;
let combo = 1;
let targetTheme = '';

for (const arg of args) {
  if (arg.startsWith('--state=')) {
    state = arg.replace('--state=', '');
  } else if (arg.startsWith('--combo=')) {
    combo = parseInt(arg.replace('--combo=', ''), 10);
  } else if (arg.startsWith('--theme=')) {
    targetTheme = arg.replace('--theme=', '');
  } else if (arg === '--collapsed' || arg === '--collapsed=true') {
    isCollapsed = true;
  } else if (arg === '--exam' || arg === '--exam=true') {
    isExam = true;
  } else if (!arg.startsWith('--')) {
    iter = arg;
  }
}

captureAll(iter, state, isCollapsed, isExam, combo, targetTheme).then(() => {
  console.log('Capture completed successfully.');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
