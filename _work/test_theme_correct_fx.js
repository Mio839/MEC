/**
 * _work/test_theme_correct_fx.js
 * 正解時演出刷新・コンボバッジ完全削除・8テーマ固有12要素統合演出の自動検証
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const uiThemeCss = fs.readFileSync(path.join(rootDir, 'ui_theme.css'), 'utf8');
const studyExamJs = fs.readFileSync(path.join(rootDir, 'study_exam.js'), 'utf8');
const chapterExamJs = fs.readFileSync(path.join(rootDir, 'chapter_exam.js'), 'utf8');

console.log('🧪 正解時演出刷新 & 8テーマ固有12要素統合 自動テスト開始...\n');

// 1. .mec-combo-badge の完全撤廃チェック
console.log('[1] コンボバッジ（.mec-combo-badge）の完全削除検証');
assert(!uiThemeCss.includes('.mec-combo-badge'), '❌ ui_theme.css に .mec-combo-badge が残っています');
assert(!studyExamJs.includes('.mec-combo-badge'), '❌ study_exam.js に .mec-combo-badge が残っています');
assert(!chapterExamJs.includes('.mec-combo-badge'), '❌ chapter_exam.js に .mec-combo-badge が残っています');
console.log('  ✅ ui_theme.css, study_exam.js, chapter_exam.js から .mec-combo-badge を完全に除去確認');

// 2. 全8テーマのセレクタ定義検証
console.log('\n[2] 全8テーマ固有の12要素セレクタ検証');
const themes = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];

themes.forEach(theme => {
  console.log(`  Checking theme: ui-${theme}...`);
  
  // 予備動作
  assert(uiThemeCss.includes(`html.ui-${theme} .qc .ch2.ch2-pressing`) || uiThemeCss.includes(`html.ui-${theme} .qc .ch2:active`), `Missing anticipatory pressing style for ${theme}`);
  
  // OKグリフ
  assert(uiThemeCss.includes(`html.ui-${theme} .qc .ch2.ok.correct::before`), `Missing OK glyph for ${theme}`);
  
  // 不正解肢消滅
  assert(uiThemeCss.includes(`html.ui-${theme} .qc.fx-correct .ch2:not(.ok)`), `Missing sink/fade for other choices in ${theme}`);
  
  // 次問登場
  assert(uiThemeCss.includes(`html.ui-${theme} .qc.exam-next-entering`), `Missing next card enter animation for ${theme}`);
  
  // 画面枠パルス
  assert(uiThemeCss.includes(`html.ui-${theme} #examEdgePulse.active`), `Missing edge pulse for ${theme}`);
  
  // 透かし活性化
  assert(uiThemeCss.includes(`html.ui-${theme} .qc.fx-correct::after`), `Missing watermark flash for ${theme}`);
  
  // 誤答ダメージ
  assert(uiThemeCss.includes(`html.ui-${theme} .qc.exam-wrong-hit`), `Missing wrong hit damage animation for ${theme}`);
  
  // ゾーン呼吸
  // §13 Z1: 呼吸は body の filter ではなく、専用レイヤー #examZoneBreath へ渡す変数で表す。
  //          body に filter を掛けると #mecFxCanvas が文書全体の高さへ引き伸ばされる。
  assert(new RegExp(`html\\.ui-${theme}\\s+body\\.exam-streak-zone[^}]*--zone-col`).test(uiThemeCss), `Missing --zone-col for ${theme}`);
  assert(!new RegExp(`@keyframes\\s+${theme}ZoneBreathe`).test(uiThemeCss), `${theme}ZoneBreathe が復活している（body に filter・§13-1 ①）`);
  
  // 速答クリティカル
  assert(uiThemeCss.includes(`html.ui-${theme} .qc.exam-fast-hit .ch2.ok.correct`), `Missing fast hit style for ${theme}`);
});
console.log('  ✅ 全8テーマ（aurora, brass, cyber, liquid, kintsugi, celestial, abyss, frost）の全要素が正しく定義されています');

// 3. study_exam.js と chapter_exam.js のJS関数同期検証
console.log('\n[3] JS演出ハンドラ & 同期検証');
assert(studyExamJs.includes('_triggerThemeHaptics'), 'Missing _triggerThemeHaptics in study_exam.js');
assert(chapterExamJs.includes('ceTriggerThemeHaptics'), 'Missing ceTriggerThemeHaptics in chapter_exam.js');

assert(studyExamJs.includes('_triggerEdgePulse'), 'Missing _triggerEdgePulse in study_exam.js');
assert(chapterExamJs.includes('ceTriggerEdgePulse'), 'Missing ceTriggerEdgePulse in chapter_exam.js');

assert(studyExamJs.includes('exam-streak-zone'), 'Missing exam-streak-zone in study_exam.js');
assert(chapterExamJs.includes('exam-streak-zone'), 'Missing exam-streak-zone in chapter_exam.js');

assert(studyExamJs.includes('exam-next-entering'), 'Missing exam-next-entering in study_exam.js');
assert(chapterExamJs.includes('exam-next-entering'), 'Missing exam-next-entering in chapter_exam.js');

assert(studyExamJs.includes('ch2-pressing'), 'Missing ch2-pressing in study_exam.js');
assert(chapterExamJs.includes('ch2-pressing'), 'Missing ch2-pressing in chapter_exam.js');

assert(studyExamJs.includes('exam-fast-hit'), 'Missing exam-fast-hit in study_exam.js');
assert(studyExamJs.includes('exam-wrong-hit'), 'Missing exam-wrong-hit in study_exam.js');
assert(chapterExamJs.includes('exam-wrong-hit'), 'Missing exam-wrong-hit in chapter_exam.js');

console.log('  ✅ study_exam.js と chapter_exam.js の完全同期を確認');

console.log('\n🎉 すべてのテストに合格しました！');
