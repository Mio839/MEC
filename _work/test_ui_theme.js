// _work/test_ui_theme.js — UIテーマセット（着せ替えスキン）と全テーマ固有装飾の徹底検証スクリプト
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
const studyExamJs = fs.readFileSync(path.join(__dirname, '../study_exam.js'), 'utf8');
const chapterExamJs = fs.readFileSync(path.join(__dirname, '../chapter_exam.js'), 'utf8');
const studyHtml = fs.readFileSync(path.join(__dirname, '../study.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');

console.log('── 1. ui_theme.js: 4大テーマ定義と動的演出トリガー ──');
test('ui_theme.js に 4テーマ定義と triggerFx がある', () => {
  assert(themeJs.includes('id: \'aurora\''), 'Missing aurora theme');
  assert(themeJs.includes('id: \'brass\''), 'Missing brass theme');
  assert(themeJs.includes('id: \'cyber\''), 'Missing cyber theme');
  assert(themeJs.includes('id: \'liquid\''), 'Missing liquid theme');
  assert(themeJs.includes('function triggerThemeChangeFx'), 'Missing triggerThemeChangeFx');
  assert(themeJs.includes('triggerFx: triggerThemeChangeFx'), 'Missing triggerFx export');
});

console.log('── 2. 最重要：全4テーマの問題カード固有装飾の徹底検証 ──');
test('🌟 オーロラ・グラス (ui-aurora) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-aurora .qc'), 'Missing html.ui-aurora .qc');
  assert(themeCss.includes('html.ui-aurora .qc::before'), 'Missing aurora edge flow');
  assert(themeCss.includes('html.ui-aurora .qc::after'), 'Missing aurora prism watermark');
  assert(themeCss.includes('html.ui-aurora .qc .qn'), 'Missing crystal num badge in aurora');
  assert(themeCss.includes('html.ui-aurora .qc .ch2:hover'), 'Missing prism choice hover in aurora');
  assert(themeCss.includes('html.ui-aurora .qc .ab'), 'Missing prism answer box in aurora');
});

test('🕰️ 真鍮クロックワーク (ui-brass) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-brass .qc'), 'Missing html.ui-brass .qc');
  assert(themeCss.includes('html.ui-brass .qc::before'), 'Missing brass gold stripe');
  assert(themeCss.includes('html.ui-brass .qc::after'), 'Missing skeleton gear watermark');
  assert(themeCss.includes('@keyframes brassGearSlowSpin'), 'Missing gear spin animation');
  assert(themeCss.includes('html.ui-brass .qc .qn'), 'Missing engraved medallion num badge in brass');
  assert(themeCss.includes('html.ui-brass .qc .ch2:hover'), 'Missing brass plate hover in brass');
  assert(themeCss.includes('html.ui-brass .qc .ab'), 'Missing brass letterpress answer box in brass');
});

test('🚀 サイバー・ホログラム (ui-cyber) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-cyber .qc'), 'Missing html.ui-cyber .qc');
  assert(themeCss.includes('html.ui-cyber .qc::before'), 'Missing HUD target corner brackets');
  assert(themeCss.includes('html.ui-cyber .qc::after'), 'Missing cyber scanline overlay');
  assert(themeCss.includes('@keyframes cyberScanline'), 'Missing scanline animation');
  assert(themeCss.includes('html.ui-cyber .qc .qn'), 'Missing hexagon target badge in cyber');
  assert(themeCss.includes('html.ui-cyber .qc .ch2:hover'), 'Missing laser lock-on hover in cyber');
  assert(themeCss.includes('html.ui-cyber .qc .ab'), 'Missing cyber terminal answer box in cyber');
});

test('🌸 幻想リキッド・アート (ui-liquid) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-liquid .qc'), 'Missing html.ui-liquid .qc');
  assert(themeCss.includes('html.ui-liquid .qc::before'), 'Missing liquid edge flow');
  assert(themeCss.includes('html.ui-liquid .qc::after'), 'Missing liquid marble blob watermark');
  assert(themeCss.includes('@keyframes liquidBlobMorph'), 'Missing blob morph animation');
  assert(themeCss.includes('html.ui-liquid .qc .qn'), 'Missing liquid droplet num badge in liquid');
  assert(themeCss.includes('html.ui-liquid .qc .ch2:hover'), 'Missing neon fluid choice hover in liquid');
  assert(themeCss.includes('html.ui-liquid .qc .ab'), 'Missing fluid bloom answer box in liquid');
});

console.log('── 3. study_exam.js / chapter_exam.js: 正解時のUIテーマ固有リアクション ──');
test('正解処理で UI テーマに応じたエフェクトが発火する', () => {
  assert(studyExamJs.includes('window.MecUITheme ? MecUITheme.get() : \'aurora\''), 'Missing UI theme check in study_exam.js');
  assert(studyExamJs.includes('curUi === \'aurora\''), 'Missing aurora case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'brass\''), 'Missing brass case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'cyber\''), 'Missing cyber case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'liquid\''), 'Missing liquid case in study_exam.js');

  assert(chapterExamJs.includes('window.MecUITheme ? MecUITheme.get() : \'aurora\''), 'Missing UI theme check in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'aurora\''), 'Missing aurora case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'brass\''), 'Missing brass case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'cyber\''), 'Missing cyber case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'liquid\''), 'Missing liquid case in chapter_exam.js');
});

console.log('── 4. HTML と Service Worker の整合性 ──');
test('study.html, index.html, sw.js が正しく設定されている', () => {
  assert(studyHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in study.html');
  assert(studyHtml.includes('href="ui_theme.css"'), 'Missing ui_theme.css in study.html');
  assert(indexHtml.includes('src="ui_theme.js"'), 'Missing ui_theme.js in index.html');
  assert(indexHtml.includes('href="ui_theme.css"'), 'Missing ui_theme.css in index.html');
  assert(swJs.includes('"./ui_theme.js"'), 'Missing ui_theme.js in sw.js');
  assert(swJs.includes('"./ui_theme.css"'), 'Missing ui_theme.css in sw.js');
});

console.log('── 5. 試験モード中の正解エフェクト完全抑止（ネタバレ防止） ──');
test('全テーマで試験モード未開示時に .ch2.ok が隠蔽される', () => {
  ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid'].forEach(theme => {
    assert(themeCss.includes(`html.${theme} body:not(.exam-mode):not(.ch-exam-mode) .qc .ch2.ok`), `Missing normal reveal rule in ${theme}`);
    assert(themeCss.includes(`html.${theme} body.exam-mode .qc.exam-revealed .ch2.ok`), `Missing exam-revealed rule in ${theme}`);
    assert(themeCss.includes(`html.${theme} body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected)`), `Missing exam concealment rule in ${theme}`);
  });
  assert(themeCss.includes('body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected)'), 'Missing global exam concealment rule');
  assert(!themeCss.includes('html.ui-aurora body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected) {\n  background: rgba(255, 255, 255, 0.08) !important;\n  border: 1.5px solid rgba(255, 255, 255, 0.22) !important;\n  border-left: 4px'), 'Aurora must not have distinct border-left in unrevealed exam mode');
});

console.log('\n全 ' + passed + ' 件 ok\n');

