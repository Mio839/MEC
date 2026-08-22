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

function generatePreviewHtml(theme, isExam = false) {
  return `<!DOCTYPE html>
<html class="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/study.css">
<link rel="stylesheet" href="/ui_theme.css">
<title>Theme Preview - ${theme} (Exam: ${isExam})</title>
<style>
body { margin: 24px auto; max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.preview-container { display: flex; flex-direction: column; gap: 20px; }
</style>
</head>
<body class="${isExam ? 'exam-mode' : ''}">
<div class="preview-container">
  <div class="st-hdr" style="padding: 12px 18px;">
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <span class="st-stat">118A-12</span>
      <span class="st-stat exam-mode-chip">⚡ 試験モード</span>
      <span class="st-stat">正答率: 84%</span>
    </div>
  </div>

  <!-- 問題カード (未解答カード) -->
  <div class="qc" style="padding: 24px;">
    <div class="qh" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <div style="display:flex; gap:10px; align-items:center;">
        <span class="qn">問 12</span>
        <span class="bg">必修</span>
        <span class="cr">84%</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="mec-grade-btn">○</button>
        <button class="mec-grade-btn">×</button>
        <button class="mec-flag-btn">🚩</button>
      </div>
    </div>

    <div class="qq" style="font-size:16.5px; line-height:1.65; margin-bottom:20px; color:#fff; font-weight:500;">
      68歳の男性。労作時の息切れと下腿浮腫を主訴に来院した。心エコー検査にて左室駆出率35%のびまん性壁運動低下を認める。第一選択となる治療薬として最も適切なのはどれか。
    </div>

    <div class="qch" style="display:flex; flex-direction:column; gap:12px;">
      <div class="ch2" style="padding:14px 18px;">a  ループ利尿薬</div>
      <div class="ch2 ${isExam ? 'exam-selected' : ''}" style="padding:14px 18px;">b  β遮断薬およびACE阻害薬/ARNI</div>
      <div class="ch2" style="padding:14px 18px;">c  ジギタリス製剤</div>
      <div class="ch2 ok" style="padding:14px 18px;">d  SGLT2阻害薬・MRA併用療法</div>
      <div class="ch2" style="padding:14px 18px;">e  カルシウム拮抗薬</div>
    </div>

    <div class="ab" style="margin-top:20px; padding:14px 18px;">
      <strong>【正解】 b, d</strong>
    </div>

    <div class="eg" style="margin-top:16px; padding:16px 20px;">
      <div style="font-weight:bold; margin-bottom:8px;">💡 解説・エピソード</div>
      HFrEF（駆出率低下型心不全）の予後改善薬は「Fantastic 4」（β遮断薬、ARNI/ACEI、MRA、SGLT2阻害薬）が基本となる。
    </div>
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
    let reqPath = req.url.split('?')[0];
    if (reqPath.startsWith('/preview/')) {
      const isExam = reqPath.includes('_exam');
      const theme = reqPath.replace('/preview/', '').replace('_exam', '').replace('.html', '');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generatePreviewHtml(theme, isExam));
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

async function captureAll(iterName = 'iter1') {
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
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false
  }, msgId++);

  const themes = ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid'];
  const captured = {};

  for (const t of themes) {
    // 1. 通常モード（解答開示状態）
    const previewUrl = `http://localhost:${PORT}/preview/${t}.html`;
    await cdpSend(ws, 'Page.navigate', { url: previewUrl }, msgId++);
    await new Promise(r => setTimeout(r, 800));

    const shot = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    const outFile = path.join(SHOTS_DIR, `${iterName}_${t}.png`);
    fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
    captured[t] = outFile;
    console.log(`Saved screenshot: ${outFile}`);

    // 2. 試験モード中（未解答・未開示状態）
    const examUrl = `http://localhost:${PORT}/preview/${t}_exam.html`;
    await cdpSend(ws, 'Page.navigate', { url: examUrl }, msgId++);
    await new Promise(r => setTimeout(r, 800));

    const examShot = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    const examOutFile = path.join(SHOTS_DIR, `${iterName}_${t}_exam.png`);
    fs.writeFileSync(examOutFile, Buffer.from(examShot.data, 'base64'));
    captured[`${t}_exam`] = examOutFile;
    console.log(`Saved screenshot: ${examOutFile}`);
  }

  ws.close();
  chromeProc.kill();
  server.close();
  return captured;
}

const iter = process.argv[2] || 'iter1';
captureAll(iter).then(() => {
  console.log('Capture completed successfully.');
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
