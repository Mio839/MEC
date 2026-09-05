/**
 * Heroゲージ演出強化（第1位・第3位・第5位）の包括的検証テスト
 * Run: node _work/test_gauge_enhancements.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + e.message); fail++; }
}

console.log('── Heroゲージ新演出（第1位・第3位・第5位）検証 ──');

t('SVGマークアップに必要なグループ（doctorCasing, milestones, overdriveFx, surgeWave）が存在する', () => {
  assert.ok(HTML.includes('id="gaugeDoctorCasing"'), 'gaugeDoctorCasing が見つからない');
  assert.ok(HTML.includes('id="gaugeMilestones"'), 'gaugeMilestones が見つからない');
  assert.ok(HTML.includes('id="gaugeOverdriveFx"'), 'gaugeOverdriveFx が見つからない');
  assert.ok(HTML.includes('id="gaugeSurgeWave"'), 'gaugeSurgeWave が見つからない');
});

t('全8テーマのケーシング（casing-*）とオーバードライブ（od-*）がマークアップに揃っている', () => {
  const themes = ['brass', 'cyber', 'aurora', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('class="casing-' + th + '"'), 'casing-' + th + ' が無い');
    assert.ok(HTML.includes('od-' + th), 'od-' + th + ' が無い');
  });
});

t('4つのドクターランク（student, resident, specialist, professor）のパーツが定義されている', () => {
  assert.ok(HTML.includes('rank-student'), 'rank-student が無い');
  assert.ok(HTML.includes('rank-resident'), 'rank-resident が無い');
  assert.ok(HTML.includes('rank-specialist'), 'rank-specialist が無い');
  assert.ok(HTML.includes('rank-professor'), 'rank-professor が無い');
});

t('4つのマイルストーンノード（node-25, node-50, node-75, node-100）が配置されている', () => {
  assert.ok(HTML.includes('node-25'), 'node-25 が無い');
  assert.ok(HTML.includes('node-50'), 'node-50 が無い');
  assert.ok(HTML.includes('node-75'), 'node-75 が無い');
  assert.ok(HTML.includes('node-100'), 'node-100 が無い');
});

t('renderHero で gaugeBox.dataset.doctorRank に値が反映されるコードが存在する', () => {
  assert.ok(HTML.includes('dataset.doctorRank = dRank'), 'doctorRank のセットが見つからない');
});

t('CSS内にドクターランク・マイルストーン・オーバードライブのセレクタが存在する', () => {
  assert.ok(HTML.includes('.gauge[data-doctor-rank='), 'data-doctor-rank セレクタが無い');
  assert.ok(HTML.includes('.milestone-node.active'), 'milestone-node.active セレクタが無い');
  assert.ok(HTML.includes('.gauge[data-overdrive]'), 'data-overdrive セレクタが無い');
  assert.ok(HTML.includes('.gauge[data-overdrive="hyper"]'), 'data-overdrive="hyper" セレクタが無い');
});

t('prefers-reduced-motion で新演出のアニメーションが停止されている', () => {
  assert.ok(HTML.includes('.gauge-surge-wave,.milestone-node .ms-glow,.gauge-overdrive-fx') ||
            HTML.includes('.brass-needle, .aurora-prism-fill'), 'reduced-motion での打ち消しが無い');
});

console.log('── 全8テーマ完全差別化（形状・進捗メカニクス・アニメーション）検証 ──');

t('全8テーマの独自形状グループ（theme-gauge-*）がマークアップに揃っている', () => {
  const cores = [
    'gaugeBrassCore', 'gaugeCyberCore', 'gaugeAuroraCore', 'gaugeLiquidCore',
    'gaugeKintsugiCore', 'gaugeCelestialCore', 'gaugeAbyssCore', 'gaugeFrostCore'
  ];
  cores.forEach(id => {
    assert.ok(HTML.includes('id="' + id + '"'), id + ' が見つからない');
  });
});

t('全8テーマの独自進捗パーツ（針・セグメント・液面・亀裂・星間・深度・六花）が存在する', () => {
  assert.ok(HTML.includes('id="brassNeedle"'), 'brassNeedle が見つからない');
  assert.ok(HTML.includes('id="cyberSegments"'), 'cyberSegments が見つからない');
  assert.ok(HTML.includes('id="auroraPrismFill"'), 'auroraPrismFill が見つからない');
  assert.ok(HTML.includes('id="liquidFluidRect"'), 'liquidFluidRect が見つからない');
  assert.ok(HTML.includes('id="ktCrack1"'), 'ktCrack1 が見つからない');
  assert.ok(HTML.includes('id="celStarlink"'), 'celStarlink が見つからない');
  assert.ok(HTML.includes('id="abyssDiveProg"'), 'abyssDiveProg が見つからない');
  assert.ok(HTML.includes('id="frostFreezeProg"'), 'frostFreezeProg が見つからない');
});

t('_driveThemeGauge 関数が存在し、_driveGauge 内で呼び出されている', () => {
  assert.ok(HTML.includes('function _driveThemeGauge('), '_driveThemeGauge の定義が無い');
  assert.ok(HTML.includes('_driveThemeGauge(pct, base, over, tier)'), '_driveGauge 内での呼び出しが無い');
});

t('CSS内に全8テーマの表示切り替えと共通円形パーツ非表示化ルールが存在する', () => {
  const themes = ['brass', 'cyber', 'aurora', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('.theme-gauge-' + th), '.theme-gauge-' + th + ' のスタイルが無い');
  });
  assert.ok(HTML.includes('html.ui-cyber .gauge-trk'), '非Brassテーマでの共通丸パーツ非表示ルールが無い');
});

console.log('── プランB（非円形4種＋円形4種＆Lava Lamp流体）詳細検証 ──');

t('Liquid: Lava Lamp のフヨフヨ有機的モーフィング流体と浮遊液滴群が定義されている', () => {
  assert.ok(HTML.includes('id="lavaChamber"'), 'lavaChamber が見つからない');
  assert.ok(HTML.includes('id="lavaBlobMain"'), 'lavaBlobMain が見つからない');
  assert.ok(HTML.includes('id="lavaBlobBase"'), 'lavaBlobBase が見つからない');
  assert.ok(HTML.includes('class="lava-blob lava-blob-float1"'), '浮遊液滴1が見つからない');
  assert.ok(HTML.includes('class="lava-blob lava-blob-float2"'), '浮遊液滴2が見つからない');
  assert.ok(HTML.includes('class="lava-blob lava-blob-float3"'), '浮遊液滴3が見つからない');
  assert.ok(HTML.includes('@keyframes lavaChamberMorph'), 'lavaChamberMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaContainerMorph'), 'lavaContainerMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaMainWobble'), 'lavaMainWobble アニメーションが無い');
});

t('非円形テーマ（Cyber, Frost, Abyss, Aurora）で共通円盤・メガリングが完全に解除・非表示化されている', () => {
  assert.ok(HTML.includes('html.ui-cyber .gauge-ring,'), '非円形テーマの gauge-ring リセットセレクタが無い');
  assert.ok(HTML.includes('border-radius: 0 !important'), 'gauge-ring の border-radius リセットが無い');
  assert.ok(HTML.includes('background: none !important'), 'gauge-ring の background リセットが無い');
});

t('Abyss: 潜水艇角丸長方形コンソールと左右垂直深度バーがマークアップ＆制御ロジックに存在する', () => {
  assert.ok(HTML.includes('id="abyssDiveProgL"'), 'abyssDiveProgL が無い');
  assert.ok(HTML.includes('id="abyssDiveProgR"'), 'abyssDiveProgR が無い');
  assert.ok(HTML.includes('id="abyssDepthDisplay"'), 'abyssDepthDisplay が無い');
  assert.ok(HTML.includes('aProgL.setAttribute(\'height\''), '_driveThemeGauge 内の垂直深度バー制御が無い');
});

t('Frost: 正六角形スノークリスタルと六花氷結成長メカニクスが存在する', () => {
  assert.ok(HTML.includes('frost-hex-rim'), 'frost-hex-rim が無い');
  assert.ok(HTML.includes('frost-hex-inner'), 'frost-hex-inner が無い');
  assert.ok(HTML.includes('frost-axes-lines'), 'frost-axes-lines が無い');
  assert.ok(HTML.includes('id="frostFreezeProg"'), 'frostFreezeProg が無い');
});

console.log('── Celestial新演出（月齢ムーンフェイズ＆流星コメット）＆Brass歯車漏れ防止 検証 ──');

t('Celestial: 月齢ムーンフェイズ（新月→三日月→満月）と流星コメット周回が定義されている', () => {
  assert.ok(HTML.includes('id="celMoonShadow"'), 'celMoonShadow が見つからない');
  assert.ok(HTML.includes('id="celMoonLit"'), 'celMoonLit が見つからない');
  assert.ok(HTML.includes('id="celMoonHalo"'), 'celMoonHalo が見つからない');
  assert.ok(HTML.includes('id="celCometOrbit"'), 'celCometOrbit が見つからない');
  assert.ok(HTML.includes('class="cel-comet-tail"'), 'cel-comet-tail が見つからない');
  assert.ok(HTML.includes('class="cel-comet-head"'), 'cel-comet-head が見つからない');
  assert.ok(HTML.includes('@keyframes cometCruise'), 'cometCruise アニメーションが無い');
  assert.ok(HTML.includes('@keyframes celHaloBreathe'), 'celHaloBreathe アニメーションが無い');
  assert.ok(HTML.includes('mShadow.setAttribute(\'rx\''), '_driveThemeGauge 内の月齢計算が無い');
});

t('Celestial: 祝砲から外枠点線円（astrolabeRings）が撤廃されステラダストに統一されている', () => {
  const celebrateFn = HTML.substring(HTML.indexOf('function _gaugeCelebrate(tier)'), HTML.indexOf('function _emberTier('));
  const celBoomBlock = celebrateFn.substring(celebrateFn.indexOf("curTheme === 'celestial'"), celebrateFn.indexOf("curTheme === 'abyss'"));
  assert.ok(!celBoomBlock.includes('MecFX.astrolabeRings'), 'Celestial祝砲にastrolabeRingsが残っている');
  assert.ok(celBoomBlock.includes('MecFX.dust'), 'Celestial祝砲にdustが無い');

  const bigCelebrateFn = HTML.substring(HTML.indexOf('function _stampGoalSeal('), HTML.indexOf('const GAUGE_AMBIENTS ='));
  const celBigBlock = bigCelebrateFn.substring(bigCelebrateFn.indexOf("curTheme === 'celestial'"), bigCelebrateFn.indexOf("curTheme === 'abyss'"));
  assert.ok(!celBigBlock.includes('MecFX.astrolabeRings'), 'Celestial大祝砲にastrolabeRingsが残っている');
  assert.ok(celBigBlock.includes('MecFX.dust'), 'Celestial大祝砲にdustが無い');
});

t('Brass: 歯車演出（MecFX.gears）がBrass以外のテーマで発動しないよう厳格ガードされている', () => {
  assert.ok(HTML.includes('isBrassNow && nowCfg.isBrass'), '_startGaugeAmbient内のBrass厳格判定が無い');
  assert.ok(HTML.includes('isBrass = document.documentElement.classList.contains(\'ui-brass\')'), '同期演出内のBrass判定が無い');
  assert.ok(HTML.includes('selectHubUITheme'), 'selectHubUITheme が見つからない');
  const selectFn = HTML.substring(HTML.indexOf('function selectHubUITheme'), HTML.indexOf('function openThemeModal'));
  assert.ok(selectFn.includes('clearInterval(_gaugeFxTimer)'), 'テーマ切り替え時のタイマークリアが無い');
  assert.ok(selectFn.includes('_startGaugeAmbient'), 'テーマ切り替え時のアンビエント再起動が無い');
});

t('Celestial: Heroゲージ外の点線円（旧cel-layer、gauge-ring::afterのdashed、absorber着弾astrolabe、ui_theme.js切替）が完全撤廃されている', () => {
  assert.ok(HTML.includes('html.ui-celestial #gaugeCelLayer'), '旧gaugeCelLayerの非表示ルールが無い');
  assert.ok(HTML.includes('html.ui-celestial .gauge-ring::after'), 'gauge-ring::afterのセレクタが無い');
  
  const absorberFn = HTML.substring(HTML.indexOf('function _runExamToHubAbsorber('), HTML.indexOf('function _stampGoalSeal('));
  const celAbsorbBlock = absorberFn.substring(absorberFn.lastIndexOf("curTheme === 'celestial'"), absorberFn.lastIndexOf("curTheme === 'abyss'"));
  assert.ok(!celAbsorbBlock.includes('MecFX.astrolabeRings'), 'Celestial吸い込み着弾にastrolabeRingsが残っている');
  assert.ok(celAbsorbBlock.includes('MecFX.diamondSparkle'), 'Celestial吸い込み着弾にdiamondSparkleが無い');

  const themeJs = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.js'), 'utf8');
  const celThemeBlock = themeJs.substring(themeJs.indexOf("id === 'celestial'"), themeJs.indexOf("id === 'abyss'"));
  assert.ok(!celThemeBlock.includes('celestialAstrolabe'), 'ui_theme.jsのCelestialにcelestialAstrolabeが残っている');
  assert.ok(!celThemeBlock.includes('astrolabeRings'), 'ui_theme.jsのCelestialにastrolabeRingsが残っている');
  assert.ok(celThemeBlock.includes('diamondSparkle'), 'ui_theme.jsのCelestialにdiamondSparkleが無い');
});

console.log(`\nALL PASS (${pass}/${pass + fail})\n`);



