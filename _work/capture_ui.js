const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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
    server.listen(PORT, () => {
      resolve(server);
    });
  });
}

// Chrome headless でスクリーンショット撮影
async function captureTheme(theme, shotName) {
  const outFile = path.join(OUT_DIR, `${shotName}.png`);
  // study.html に直接クエリを渡すかプレビューHTMLを作成
  // study.html では MecUITheme.apply('aurora') などでテーマが設定される
  const cleanTheme = theme.replace('ui-', '');
  const testHtml = `<!DOCTYPE html>
<html class="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/study.css">
<link rel="stylesheet" href="/ui_theme.css">
<title>Theme Preview - ${theme}</title>
<style>
body { margin: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.preview-container { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
</style>
</head>
<body>
<div class="preview-container">
  <div class="st-hdr">
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      <span class="st-stat">118A-12</span>
      <span class="st-stat exam-mode-chip">⚡ 試験モード</span>
      <span class="st-stat">正答率: 84%</span>
    </div>
  </div>

  <!-- 問題カード -->
  <div class="qc">
    <div class="qh" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="qn">問 12</span>
        <span class="bg">必修</span>
        <span class="cr">84%</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="mec-grade-btn">○</button>
        <button class="mec-grade-btn">×</button>
        <button class="mec-flag-btn">🚩</button>
      </div>
    </div>

    <div class="qq" style="font-size:16px; line-height:1.6; margin-bottom:16px; color:#fff;">
      68歳の男性。労作時の息切れと下腿浮腫を主訴に来院した。心エコー検査にて左室駆出率35%のびまん性壁運動低下を認める。第一選択となる治療薬として最も適切なのはどれか。
    </div>

    <div class="qch" style="display:flex; flex-direction:column; gap:10px;">
      <div class="ch2">a  ループ利尿薬</div>
      <div class="ch2 exam-selected">b  β遮断薬およびACE阻害薬/ARNI</div>
      <div class="ch2">c  ジギタリス製剤</div>
      <div class="ch2 ok">d  SGLT2阻害薬・MRA併用療法</div>
      <div class="ch2">e  カルシウム拮抗薬</div>
    </div>

    <div class="ab" style="margin-top:16px; padding:12px;">
      <strong>【正解】 b, d</strong>
    </div>

    <div class="eg" style="margin-top:12px; padding:14px;">
      <div style="font-weight:bold; margin-bottom:6px;">💡 解説・エピソード</div>
      HFrEF（駆出率低下型心不全）の予後改善薬は「Fantastic 4」（β遮断薬、ARNI/ACEI、MRA、SGLT2阻害薬）が基本となる。
    </div>
  </div>
</div>
</body>
</html>`;

  const previewPath = path.join(OUT_DIR, `preview_${shotName}.html`);
  fs.writeFileSync(previewPath, testHtml, 'utf8');

  const url = `http://localhost:${PORT}/_work/screenshots/preview_${shotName}.html`;
  const cmd = `"${CHROME_PATH}" --headless=new --screenshot="${outFile}" --window-size=1200,900 --virtual-time-budget=2000 "${url}"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (e) {
    console.error('Capture error:', e);
  }

  return outFile;
}

async function run() {
  const server = await startServer();
  console.log(`Server started on http://localhost:${PORT}`);

  const themes = ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid'];
  const results = {};

  for (const t of themes) {
    const p = await captureTheme(t, `card_${t}`);
    results[t] = p;
    console.log(`Captured ${t} -> ${p}`);
  }

  server.close();
  console.log('All screenshots ready.');
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { captureTheme, startServer };
