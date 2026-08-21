// _work/test_ui_theme.js — UIテーマセット（着せ替えスキン）の検証スクリプト
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok  - ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL - ' + name + '\n    ' + e.message);
    process.exitCode = 1;
  }
}

const themeJs = fs.readFileSync(path.join(__dirname, '../ui_theme.js'), 'utf8');
const themeCss = fs.readFileSync(path.join(__dirname, '../ui_theme.css'), 'utf8');
const studyHtml = fs.readFileSync(path.join(__dirname, '../study.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const statsHtml = fs.readFileSync(path.join(__dirname, '../stats.html'), 'utf8');
const knHtml = fs.readFileSync(path.join(__dirname, '../knowledge.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

console.log('── 1. ui_theme.js の 4大テーマ定義 ──');
test('ui_theme.js に aurora, brass, cyber, liquid の4テーマが定義されている', () => {
  assert(themeJs.includes('id: \'aurora\''), 'Missing aurora theme in ui_theme.js');
  assert(themeJs.includes('id: \'brass\''), 'Missing brass theme in ui_theme.js');
  assert(themeJs.includes('id: \'cyber\''), 'Missing cyber theme in ui_theme.js');
  assert(themeJs.includes('id: \'liquid\''), 'Missing liquid theme in ui_theme.js');
  assert(themeJs.includes('window.MecUITheme'), 'Missing MecUITheme export in ui_theme.js');
});

console.log('── 2. ui_theme.css のスタイル定義 ──');
test('ui_theme.css に 4テーマのセレクタとスタイルがある', () => {
  assert(themeCss.includes('html.ui-aurora'), 'Missing html.ui-aurora in ui_theme.css');
  assert(themeCss.includes('html.ui-brass'), 'Missing html.ui-brass in ui_theme.css');
  assert(themeCss.includes('html.ui-cyber'), 'Missing html.ui-cyber in ui_theme.css');
  assert(themeCss.includes('html.ui-liquid'), 'Missing html.ui-liquid in ui_theme.css');
  assert(themeCss.includes('.ui-theme-grid'), 'Missing .ui-theme-grid in ui_theme.css');
  assert(themeCss.includes('.ui-theme-btn'), 'Missing .ui-theme-btn in ui_theme.css');
});

console.log('── 3. HTMLファイルでの同期読み込みと選択UI ──');
test('study.html と index.html に ui_theme.js / css が読み込まれ、選択UIがある', () => {
  assert(studyHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in study.html');
  assert(studyHtml.includes('href="ui_theme.css"'), 'Missing ui_theme.css in study.html');
  assert(studyHtml.includes('id="uiThemeGrid"'), 'Missing uiThemeGrid in study.html');
  assert(studyHtml.includes('_renderUIThemePicker'), 'Missing _renderUIThemePicker in study.html');

  assert(indexHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in index.html');
  assert(indexHtml.includes('href="ui_theme.css"'), 'Missing ui_theme.css in index.html');
  assert(indexHtml.includes('id="hubUiThemeGrid"'), 'Missing hubUiThemeGrid in index.html');
  assert(indexHtml.includes('_renderHubUIThemeGrid'), 'Missing _renderHubUIThemeGrid in index.html');

  assert(statsHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in stats.html');
  assert(knHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in knowledge.html');
});

console.log('── 4. sw.js の SHELL キャッシュ登録 ──');
test('sw.js の SHELL に ui_theme.js と ui_theme.css が登録されている', () => {
  assert(swJs.includes('"./ui_theme.js"'), 'Missing ./ui_theme.js in sw.js SHELL');
  assert(swJs.includes('"./ui_theme.css"'), 'Missing ./ui_theme.css in sw.js SHELL');
});

console.log('\n全 ' + passed + ' 件 ok\n');
