const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testCDP() {
  const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1000));

  try {
    const res = await fetch('http://localhost:9222/json/version');
    const data = await res.json();
    console.log('Chrome CDP Version:', data);
  } catch (e) {
    console.error('Fetch error:', e);
  } finally {
    chromeProc.kill();
  }
}

testCDP();
