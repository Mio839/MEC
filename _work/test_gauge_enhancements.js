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

t('Liquid: 外枠アメーバ変形と内部のオーガニック・ラバ・セル（アメーバ流体ジェル＆浮遊液滴）が定義されている', () => {
  assert.ok(HTML.includes('id="lavaChamber"'), 'lavaChamber が見つからない');
  assert.ok(HTML.includes('id="liquidBlobCoreGroup"'), 'liquidBlobCoreGroup が見つからない');
  assert.ok(HTML.includes('id="lavaCellBody"'), 'lavaCellBody が見つからない');
  assert.ok(HTML.includes('id="lavaCellNucleus"'), 'lavaCellNucleus が見つからない');
  assert.ok(HTML.includes('id="liquidSatellites"'), 'liquidSatellites が見つからない');
  assert.ok(HTML.includes('@keyframes lavaChamberMorph'), 'lavaChamberMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaContainerMorph'), 'lavaContainerMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaCellMorph'), 'lavaCellMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaMantleMorph'), 'lavaMantleMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaNucleusGlow'), 'lavaNucleusGlow アニメーションが無い');
  assert.ok(!HTML.includes('vortex-mag-layer'), 'マゼンタ層が残存している');
  assert.ok(!HTML.includes('vortex-cya-layer'), 'シアン層が残存している');
  assert.ok(!HTML.includes('@keyframes vortexSpin'), 'vortexSpin（高速回転）が残存している');
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

t('Frost: 六花スノークリスタル（樹枝状幾何学）と氷晶アイスコメット周回軌道が存在する', () => {
  assert.ok(HTML.includes('frost-hex-rim'), 'frost-hex-rim が無い');
  assert.ok(HTML.includes('frost-hex-inner'), 'frost-hex-inner が無い');
  assert.ok(HTML.includes('frost-snowflake-dendrite'), 'frost-snowflake-dendrite が無い');
  assert.ok(HTML.includes('id="frostCometOrbit"'), 'frostCometOrbit が無い');
  assert.ok(HTML.includes('id="frostFreezeProg"'), 'frostFreezeProg が無い');
  assert.ok(!HTML.includes('class="frost-axes-lines"'), '旧来のターゲット照準軸線 frost-axes-lines が残存している');
  assert.ok(!HTML.includes('class="frost-shard'), '旧来のターゲット照準マーカー frost-shard が残存している');
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

console.log('── 点線の円演出完全撤廃＆Aurora・Cyber全面刷新 検証 ──');

t('Brassおよび全テーマ: 外から現れて消える点線の円（astrolabeRings）が祝砲・目標達成・テーマ切替から完全撤廃されている', () => {
  const celebrateFn = HTML.substring(HTML.indexOf('function _gaugeCelebrate(tier)'), HTML.indexOf('function _emberTier('));
  const brassBoomBlock = celebrateFn.substring(celebrateFn.indexOf("curTheme === 'brass'"), celebrateFn.indexOf("curTheme === 'aurora'"));
  assert.ok(!brassBoomBlock.includes('MecFX.astrolabeRings'), 'Brass祝砲にastrolabeRingsが残っている');
  assert.ok(brassBoomBlock.includes('MecFX.irisShutter'), 'Brass祝砲にirisShutterが無い');

  const bigCelebrateFn = HTML.substring(HTML.indexOf('function _stampGoalSeal('), HTML.indexOf('const GAUGE_AMBIENTS ='));
  const brassBigBlock = bigCelebrateFn.substring(bigCelebrateFn.indexOf("curTheme === 'brass'"), bigCelebrateFn.indexOf("curTheme === 'aurora'"));
  assert.ok(!brassBigBlock.includes('MecFX.astrolabeRings'), 'Brass大祝砲にastrolabeRingsが残っている');
  assert.ok(brassBigBlock.includes('MecFX.irisShutter'), 'Brass大祝砲にirisShutterが無い');

  const themeJs = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.js'), 'utf8');
  const brassThemeBlock = themeJs.substring(themeJs.indexOf("id === 'brass'"), themeJs.indexOf("id === 'cyber'"));
  assert.ok(!brassThemeBlock.includes('astrolabeRings'), 'ui_theme.jsのBrassにastrolabeRingsが残っている');
  assert.ok(brassThemeBlock.includes('irisShutter'), 'ui_theme.jsのBrassにirisShutterが無い');
});

t('全テーマ: 外枠疑似要素（::before / ::after）およびケーシングから点線（dashed / dotted）が完全撤廃されている', () => {
  const themeCss = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.css'), 'utf8');
  assert.ok(!themeCss.includes('html.ui-brass .gauge .gauge-ring::before {\n  content: \'\';\n  position: absolute;\n  inset: -2px;\n  border-radius: 50%;\n  border: 1.5px dashed'), 'Brass疑似要素にdashedが残っている');
  assert.ok(!themeCss.includes('border: 1px dotted rgba(255, 235, 150'), 'Brass疑似要素にdottedが残っている');
  assert.ok(!themeCss.includes('border: 2px dashed rgba(0, 255, 157'), 'Cyber疑似要素にdashedが残っている');
  assert.ok(!themeCss.includes('border: 1.5px dashed rgba(245, 208, 97'), 'Kintsugi疑似要素にdashedが残っている');
  assert.ok(!themeCss.includes('border: 1.5px dashed rgba(255, 255, 255'), 'Frost疑似要素にdashedが残っている');

  // SVGケーシングのastrolabe-ringからもdashedが排除されていること
  assert.ok(!HTML.includes('.casing-brass .astrolabe-ring{fill:none;stroke:var(--brass-hi);stroke-width:1.4;stroke-dasharray:2 2;'), 'casing-brass astrolabe-ringにdasharrayが残っている');
});

t('Cyber: 立体浮遊型タクティカルHUD（照準ブラケット・360度ホログラムレーザーゲージ・フォトンヘッド・ハニカムセル）が実装されている', () => {
  assert.ok(HTML.includes('id="cyberHoloGauge"'), 'cyberHoloGauge が見つからない');
  assert.ok(HTML.includes('id="cyberPhotonHead"'), 'cyberPhotonHead が見つからない');
  assert.ok(HTML.includes('id="cyberHoneycombArray"'), 'cyberHoneycombArray が見つからない');
  assert.ok(HTML.includes('id="cyberHudStatus"'), 'cyberHudStatus が見つからない');
  assert.ok(HTML.includes('class="cyber-bracket b-tl"'), 'cyber-bracket が見つからない');
  assert.ok(HTML.includes('class="cyber-scan-ring"'), 'cyber-scan-ring が見つからない');
  assert.ok(HTML.includes('cHolo.style.strokeDashoffset'), '_driveThemeGauge 内のcyberHoloGauge制御が無い');
  assert.ok(HTML.includes('cPhoton.style.transform'), '_driveThemeGauge 内のcyberPhotonHead制御が無い');
});

t('Aurora: 多面体カッティンググラス＆揺らめくオーロラカーテン＆360度プリズム光帯アークが実装されている', () => {
  assert.ok(HTML.includes('class="aurora-glass-bezel"'), 'aurora-glass-bezel が見つからない');
  assert.ok(HTML.includes('id="auroraCurtainGroup"'), 'auroraCurtainGroup が見つからない');
  assert.ok(HTML.includes('id="auroraCurtainFront"'), 'auroraCurtainFront が見つからない');
  assert.ok(HTML.includes('id="auroraPrismArc"'), 'auroraPrismArc が見つからない');
  assert.ok(HTML.includes('id="auroraPrismJewel"'), 'auroraPrismJewel が見つからない');
  assert.ok(HTML.includes('class="aurora-glass-glare"'), 'aurora-glass-glare が見つからない');
  assert.ok(HTML.includes('class="aurora-sparkle'), 'aurora-sparkle が見つからない');
  assert.ok(HTML.includes('aCurtain.style.transform'), '_driveThemeGauge 内のauroraCurtainGroup制御が無い');
  assert.ok(HTML.includes('aPrismArc.style.strokeDashoffset'), '_driveThemeGauge 内のauroraPrismArc制御が無い');
});

t('Aurora & Cyber: オーバードライブ装飾およびHeroゲージから点線円が完全撤廃されている', () => {
  // od-cyber
  assert.ok(HTML.includes('.od-cyber .holo-scanner{fill:none;stroke:#00FF9D;stroke-width:1.8;stroke-dasharray:none;'), 'od-cyber holo-scannerに点線が残っている');
  // od-aurora
  assert.ok(HTML.includes('.od-aurora .chromatic-ring{fill:none;stroke:url(#auroraPrismArcGrad);stroke-width:2;stroke-dasharray:none;'), 'od-aurora chromatic-ringに点線が残っている');
  // cyber-scan-ring
  assert.ok(HTML.includes('.cyber-scan-ring {\n  fill: none;\n  stroke: rgba(0, 229, 255, .25);\n  stroke-width: 1;\n  stroke-dasharray: none;'), 'cyber-scan-ringに点線が残っている');
});

t('Aurora: 成果帰還着弾Absorberおよびui_theme切替からringsが完全撤廃されスラッシュリボン＆ダイヤモンド閃光へ刷新されている', () => {
  const absorberFn = HTML.substring(HTML.indexOf('function _runExamToHubAbsorber('), HTML.indexOf('function _stampGoalSeal('));
  const auroraAbsorbBlock = absorberFn.substring(absorberFn.lastIndexOf("curTheme === 'aurora'"), absorberFn.lastIndexOf("curTheme === 'liquid'"));
  assert.ok(!auroraAbsorbBlock.includes('MecFX.rings'), 'Aurora着弾にMecFX.ringsが残っている');
  assert.ok(auroraAbsorbBlock.includes('MecFX.diamondSparkle'), 'Aurora着弾にdiamondSparkleが無い');
  assert.ok(auroraAbsorbBlock.includes('MecFX.slashRibbon'), 'Aurora着弾にslashRibbonが無い');

  const themeJs = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.js'), 'utf8');
  const auroraThemeBlock = themeJs.substring(themeJs.indexOf("id === 'aurora'"), themeJs.indexOf("id === 'brass'"));
  assert.ok(!auroraThemeBlock.includes('MecFX.rings'), 'ui_theme.jsのAuroraにMecFX.ringsが残っている');
  assert.ok(auroraThemeBlock.includes('MecFX.diamondSparkle'), 'ui_theme.jsのAuroraにdiamondSparkleが無い');
  assert.ok(auroraThemeBlock.includes('MecFX.slashRibbon'), 'ui_theme.jsのAuroraにslashRibbonが無い');
});

t('Aurora & Cyber: 正解演出（auroraPrismSweep, cyberTargetLock）から同心円rings/sonicWaveが完全撤廃されている', () => {
  const fxJs = fs.readFileSync(path.join(__dirname, '..', 'fx_engine.js'), 'utf8');
  const auroraSweepBlock = fxJs.substring(fxJs.indexOf('function auroraPrismSweep('), fxJs.indexOf('function brassClockworkBurst('));
  assert.ok(!auroraSweepBlock.includes('rings('), 'auroraPrismSweepにringsが残っている');
  assert.ok(auroraSweepBlock.includes('slashRibbon('), 'auroraPrismSweepにslashRibbonが無い');

  const cyberLockBlock = fxJs.substring(fxJs.indexOf('function cyberTargetLock('), fxJs.indexOf('function liquidBloomRipple('));
  assert.ok(!cyberLockBlock.includes('sonicWave('), 'cyberTargetLockにsonicWaveが残っている');
  assert.ok(!cyberLockBlock.includes('rings('), 'cyberTargetLockにringsが残っている');
  assert.ok(cyberLockBlock.includes('slashRibbon('), 'cyberTargetLockにslashRibbonが無い');
  assert.ok(cyberLockBlock.includes('defibShock('), 'cyberTargetLockにdefibShockが無い');
});

t('Cyber: カウントダウン画面から点線3重円cd-ringsが完全撤廃されcd-cyber-hudへ刷新されている', () => {
  const studyJs = fs.readFileSync(path.join(__dirname, '..', 'study_exam.js'), 'utf8');
  assert.ok(!studyJs.includes('class="cd-rings"'), 'study_exam.jsにcd-ringsが残っている');
  assert.ok(studyJs.includes('class="cd-cyber-hud"'), 'study_exam.jsにcd-cyber-hudが無い');

  const chapterJs = fs.readFileSync(path.join(__dirname, '..', 'chapter_exam.js'), 'utf8');
  assert.ok(!chapterJs.includes('<svg class="cd-rings"'), 'chapter_exam.jsにcd-ringsが残っている');
  assert.ok(chapterJs.includes('class="cd-cyber-hud"'), 'chapter_exam.jsにcd-cyber-hudが無い');

  const studyCss = fs.readFileSync(path.join(__dirname, '..', 'study.css'), 'utf8');
  assert.ok(studyCss.includes('.cd-cyber-hud{'), 'study.cssに.cd-cyber-hudが無い');
  assert.ok(studyCss.includes('.cd-rings{display:none!important;}'), 'study.cssに.cd-rings非表示が無い');
});

console.log(`\nALL PASS (${pass}/${pass + fail})\n`);





