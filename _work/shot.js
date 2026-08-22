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

function generatePreviewHtml(theme, isExam = false, state = 'default', isCollapsed = false) {
  const isAnswered = state === 'answered' || !isExam;
  return `<!DOCTYPE html>
<html class="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/study.css">
<link rel="stylesheet" href="/ui_theme.css">
<title>Theme Preview - ${theme} (Exam: ${isExam}, State: ${state}, Collapsed: ${isCollapsed})</title>
<style>
body { margin: 20px auto; max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.preview-container { display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 600px) {
  body { margin: 8px auto; padding: 0 8px; }
}
</style>
</head>
<body class="${isExam ? 'exam-mode' : ''}">
<div class="preview-container">
  <header class="st-hdr ${isCollapsed ? 'hdr-collapsed' : ''}">
    <div class="st-title-row">
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
      <button class="hdr-toggle">${isCollapsed ? '▶' : '▼'}</button>
      <button class="hdr-toggle">🔄</button>
      <button class="hdr-toggle">🎨🔊</button>
      <span id="mecBuildVer" style="font-size:10px;font-weight:700;color:rgba(120,179,255,.85);align-self:center;">b-0725a</span>
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

  <!-- 問題カード -->
  <div class="qc ${isAnswered ? 'answered ok-card' : ''}" style="padding: 24px;">
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
      <div class="ch2 ${isExam && !isAnswered ? 'exam-selected' : (isAnswered ? 'selected ok' : '')}" style="padding:14px 18px;">b  β遮断薬およびACE阻害薬/ARNI</div>
      <div class="ch2" style="padding:14px 18px;">c  ジギタリス製剤</div>
      <div class="ch2 ${isAnswered ? 'ok' : ''}" style="padding:14px 18px;">d  SGLT2阻害薬・MRA併用療法</div>
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
  </div>
</div>
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
    let isCollapsed = reqUrl.searchParams.get('collapsed') === 'true';

    if (reqPath.startsWith('/preview/')) {
      const isExam = reqPath.includes('_exam');
      const theme = reqPath.replace('/preview/', '').replace('_exam', '').replace('.html', '');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generatePreviewHtml(theme, isExam, stateParam, isCollapsed));
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

async function captureAll(iterName = 'iter1', state = 'default', isCollapsed = false) {
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

  const themes = ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid'];
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
      // 1. 通常プレビュー
      const previewUrl = `http://localhost:${PORT}/preview/${t}.html?state=${state}&collapsed=${isCollapsed}`;
      await cdpSend(ws, 'Page.navigate', { url: previewUrl }, msgId++);
      await new Promise(r => setTimeout(r, 600));

      const shot = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' }, msgId++);
      const vpSuffix = vp.name === 'mobile' ? '_mobile' : '';
      const stateSuffix = state !== 'default' ? `_${state}` : '';
      const colSuffix = isCollapsed ? '_collapsed' : '';
      const outFile = path.join(SHOTS_DIR, `${iterName}_${t}${vpSuffix}${stateSuffix}${colSuffix}.png`);
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

for (const arg of args) {
  if (arg.startsWith('--state=')) {
    state = arg.replace('--state=', '');
  } else if (arg === '--collapsed' || arg === '--collapsed=true') {
    isCollapsed = true;
  } else if (!arg.startsWith('--')) {
    iter = arg;
  }
}

captureAll(iter, state, isCollapsed).then(() => {
  console.log('Capture completed successfully.');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
