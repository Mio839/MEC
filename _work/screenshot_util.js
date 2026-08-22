const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8099;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT_DIR = path.resolve(__dirname, '..');
const SHOTS_DIR = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
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

async function takeScreenshots(themes = ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid'], iteration = 'iter1') {
  const server = await startServer();
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1200,960',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const listRes = await fetch('http://localhost:9222/json/list');
  const pages = await listRes.json();
  const page = pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    ws.addEventListener('open', resolve);
  });

  let msgId = 1;
  await cdpSend(ws, 'Page.enable', {}, msgId++);
  await cdpSend(ws, 'DOM.enable', {}, msgId++);
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false
  }, msgId++);

  const capturedPaths = {};

  for (const theme of themes) {
    const previewUrl = `http://localhost:${PORT}/_work/screenshots/preview_card_${theme}.html`;
    await cdpSend(ws, 'Page.navigate', { url: previewUrl }, msgId++);
    await new Promise(r => setTimeout(r, 800));

    const shotResult = await cdpSend(ws, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    const outFile = path.join(SHOTS_DIR, `${iteration}_${theme}.png`);
    fs.writeFileSync(outFile, Buffer.from(shotResult.data, 'base64'));
    capturedPaths[theme] = outFile;
    console.log(`[Captured] ${theme} -> ${outFile}`);
  }

  ws.close();
  chromeProc.kill();
  server.close();

  return capturedPaths;
}

if (require.main === module) {
  takeScreenshots().then((res) => {
    console.log('All shots taken:', res);
  }).catch(console.error);
}

module.exports = { takeScreenshots };
