const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testCDP2() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));
  const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${tmpDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const res = await fetch('http://localhost:9223/json/list');
    const data = await res.json();
    console.log('Chrome pages:', data);
  } catch (e) {
    console.error('Fetch error:', e);
  } finally {
    chromeProc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

testCDP2();
