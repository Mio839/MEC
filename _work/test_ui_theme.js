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

console.log('── 1. ui_theme.js: 8大テーマ定義と動的演出トリガー ──');
test('ui_theme.js に 8テーマ定義と triggerFx がある', () => {
  assert(themeJs.includes('id: \'aurora\''), 'Missing aurora theme');
  assert(themeJs.includes('id: \'brass\''), 'Missing brass theme');
  assert(themeJs.includes('id: \'cyber\''), 'Missing cyber theme');
  assert(themeJs.includes('id: \'liquid\''), 'Missing liquid theme');
  assert(themeJs.includes('id: \'kintsugi\''), 'Missing kintsugi theme');
  assert(themeJs.includes('id: \'celestial\''), 'Missing celestial theme');
  assert(themeJs.includes('id: \'abyss\''), 'Missing abyss theme');
  assert(themeJs.includes('id: \'frost\''), 'Missing frost theme');
  assert(themeJs.includes('function triggerThemeChangeFx'), 'Missing triggerThemeChangeFx');
  assert(themeJs.includes('triggerFx: triggerThemeChangeFx'), 'Missing triggerFx export');
});

console.log('── 2. 最重要：全8テーマの問題カード固有装飾の徹底検証 ──');
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

test('🌑 漆黒金継ぎ・禅 (ui-kintsugi) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-kintsugi .qc'), 'Missing html.ui-kintsugi .qc');
  assert(themeCss.includes('html.ui-kintsugi .qc::before'), 'Missing kintsugi edge flow');
  assert(themeCss.includes('html.ui-kintsugi .qc::after'), 'Missing kintsugi enso watermark');
  assert(themeCss.includes('@keyframes kintsugiEnsoPulse'), 'Missing enso pulse animation');
  assert(themeCss.includes('html.ui-kintsugi .qc .qn'), 'Missing kintsugi num badge in kintsugi');
  assert(themeCss.includes('html.ui-kintsugi .qc .ch2:hover'), 'Missing brush choice hover in kintsugi');
  assert(themeCss.includes('html.ui-kintsugi .qc .ab'), 'Missing inkstone answer box in kintsugi');
});

test('🌌 賢者の星図・魔導書 (ui-celestial) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-celestial .qc'), 'Missing html.ui-celestial .qc');
  assert(themeCss.includes('html.ui-celestial .qc::before'), 'Missing celestial edge flow');
  assert(themeCss.includes('html.ui-celestial .qc::after'), 'Missing celestial astrolabe watermark');
  assert(themeCss.includes('@keyframes celestialAstrolabeSpin'), 'Missing astrolabe spin animation');
  assert(themeCss.includes('html.ui-celestial .qc .qn'), 'Missing compass num badge in celestial');
  assert(themeCss.includes('html.ui-celestial .qc .ch2:hover'), 'Missing starlight choice hover in celestial');
  assert(themeCss.includes('html.ui-celestial .qc .ab'), 'Missing grimoire answer box in celestial');
});

test('🌊 深海アビス・発光生物 (ui-abyss) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-abyss .qc'), 'Missing html.ui-abyss .qc');
  assert(themeCss.includes('html.ui-abyss .qc::before'), 'Missing abyss edge flow');
  assert(themeCss.includes('html.ui-abyss .qc::after'), 'Missing abyss sonar watermark');
  assert(themeCss.includes('@keyframes abyssSonarRipple'), 'Missing sonar ripple animation');
  assert(themeCss.includes('html.ui-abyss .qc .qn'), 'Missing capsule num badge in abyss');
  assert(themeCss.includes('html.ui-abyss .qc .ch2:hover'), 'Missing bioluminescent choice hover in abyss');
  assert(themeCss.includes('html.ui-abyss .qc .ab'), 'Missing abyss pod answer box in abyss');
});

test('❄️ 絶対零度・フロスト氷晶 (ui-frost) の問題カード固有装飾', () => {
  assert(themeCss.includes('html.ui-frost .qc'), 'Missing html.ui-frost .qc');
  assert(themeCss.includes('html.ui-frost .qc::before'), 'Missing frost edge flow');
  assert(themeCss.includes('html.ui-frost .qc::after'), 'Missing frost crystal watermark');
  assert(themeCss.includes('@keyframes frostCrystalPulse'), 'Missing crystal pulse animation');
  assert(themeCss.includes('html.ui-frost .qc .qn'), 'Missing crystal num badge in frost');
  assert(themeCss.includes('html.ui-frost .qc .ch2:hover'), 'Missing frost mist choice hover in frost');
  assert(themeCss.includes('html.ui-frost .qc .ab'), 'Missing crystal answer box in frost');
});

console.log('── 3. study_exam.js / chapter_exam.js: 正解時のUIテーマ固有リアクション ──');
test('正解処理で UI テーマに応じたエフェクトが発火する', () => {
  assert(studyExamJs.includes('window.MecUITheme ? MecUITheme.get() : \'aurora\''), 'Missing UI theme check in study_exam.js');
  assert(studyExamJs.includes('curUi === \'aurora\''), 'Missing aurora case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'brass\''), 'Missing brass case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'cyber\''), 'Missing cyber case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'liquid\''), 'Missing liquid case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'kintsugi\''), 'Missing kintsugi case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'celestial\''), 'Missing celestial case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'abyss\''), 'Missing abyss case in study_exam.js');
  assert(studyExamJs.includes('curUi === \'frost\''), 'Missing frost case in study_exam.js');

  assert(chapterExamJs.includes('window.MecUITheme ? MecUITheme.get() : \'aurora\''), 'Missing UI theme check in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'aurora\''), 'Missing aurora case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'brass\''), 'Missing brass case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'cyber\''), 'Missing cyber case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'liquid\''), 'Missing liquid case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'kintsugi\''), 'Missing kintsugi case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'celestial\''), 'Missing celestial case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'abyss\''), 'Missing abyss case in chapter_exam.js');
  assert(chapterExamJs.includes('curUi === \'frost\''), 'Missing frost case in chapter_exam.js');
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
test('全8テーマで試験モード未開示時に .ch2.ok が隠蔽される', () => {
  ['ui-aurora', 'ui-brass', 'ui-cyber', 'ui-liquid', 'ui-kintsugi', 'ui-celestial', 'ui-abyss', 'ui-frost'].forEach(theme => {
    assert(themeCss.includes(`html.${theme} body:not(.exam-mode):not(.ch-exam-mode) .qc .ch2.ok`), `Missing normal reveal rule in ${theme}`);
    assert(themeCss.includes(`html.${theme} body.exam-mode .qc.exam-revealed .ch2.ok`), `Missing exam-revealed rule in ${theme}`);
    assert(themeCss.includes(`html.${theme} body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected)`), `Missing exam concealment rule in ${theme}`);
    assert(themeCss.includes(`html.${theme} body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected):hover`), `Missing exam concealment hover rule in ${theme}`);
  });
  assert(themeCss.includes('body.exam-mode .qc:not(.exam-revealed) .ch2::before'), 'Missing global exam ::before concealment rule');
  assert(themeCss.includes('body.ch-exam-mode .qc:not(.ch-exam-revealed) .ch2::before'), 'Missing chapter exam ::before concealment rule');
  assert(studyExamJs.includes("document.querySelectorAll('.ch2.correct').forEach(c => c.classList.remove('correct'))"), 'Missing correct class cleanup in startExam');
  assert(chapterExamJs.includes("document.querySelectorAll('.ch2.correct').forEach(function (c) { c.classList.remove('correct'); })"), 'Missing correct class cleanup in chapter_exam.js _ceStart');
  // 以前のバグ（通常選択肢と乖離した個別定義）が存在しないことを検証
  assert(!themeCss.includes('html.ui-aurora body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected) {\n  background: rgba(255, 255, 255, 0.08) !important;\n  border: 1.5px solid rgba(255, 255, 255, 0.22) !important;\n  border-left: 4px'), 'Aurora must not have distinct border-left in unrevealed exam mode');
  assert(!themeCss.includes('html.ui-liquid body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected) {\n  background: rgba(255, 0, 128, 0.08) !important;\n  border: 1.5px solid rgba(255, 0, 128, 0.35) !important;\n  border-left: 4px solid rgba(255, 0, 128, 0.65) !important;\n  color: #FFFFFF !important;\n  border-radius: 12px'), 'Liquid must not have distinct border-radius (12px) in unrevealed exam mode');
  assert(!themeCss.includes('html.ui-abyss body.exam-mode .qc:not(.exam-revealed) .ch2.ok:not(.exam-selected) {\n  background: rgba(4, 18, 38, 0.75) !important;\n  border: 1.5px solid rgba(0, 255, 163, 0.28) !important;\n  border-left: 1.5px solid rgba(0, 255, 163, 0.28) !important;\n  border-radius: 14px !important;\n  color: #F0FDFA !important;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;\n  font-weight: 500 !important;\n  box-shadow: none'), 'Abyss must not have distinct border-left (1.5px) in unrevealed exam mode');
});

console.log('── 6. 画面に出る文字列に文字化けが無いこと ──');
// 2026-08-26: `.ui-theme-btn.active::after` の content が `'笨� 驕ｩ逕ｨ荳ｭ'` になっており、
// **テーマ選択パネルで「適用中」バッジが文字化けして表示されていた**（U+FFFD 入り）。
// 混入は d86222c（2026-08-23 の UIテーマ自律進化）で、その親は clean。
// ⚠️ コメントの中の文字化けは実害が無いのでここでは見ない。見るのは
//    **レンダリングされる CSS（コメントを除いた本体）** だけ——そこに U+FFFD があれば
//    それは必ず content / font-family など画面に出る文字列である。
test('ui_theme.css のレンダリング対象に U+FFFD が無い（コメントは対象外）', () => {
  const noComments = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = noComments.split('\n').filter(l => l.indexOf('�') >= 0);
  assert(bad.length === 0,
    'コメント外に文字化けがある（画面に出る）→ ' + bad.map(l => l.trim().slice(0, 60)).join(' / '));
});
test('テーマ選択の「適用中」バッジが正しい文字列である', () => {
  const m = /\.ui-theme-btn\.active::after\s*\{[^}]*?content\s*:\s*('[^']*'|"[^"]*")/.exec(themeCss);
  assert(m, '.ui-theme-btn.active::after の content が見つからない');
  assert(m[1].indexOf('�') < 0, 'バッジの文字列が文字化けしている → ' + m[1]);
  assert(/適用中/.test(m[1]), 'バッジが「適用中」でない → ' + m[1]);
});

console.log('\n全 ' + passed + ' 件 ok\n');

