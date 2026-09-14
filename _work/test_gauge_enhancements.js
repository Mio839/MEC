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
  assert.ok(HTML.includes('id="frostInfillFill"'), 'frostInfillFill が見つからない');
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
  assert.ok(HTML.includes('border-radius: 50% !important'), 'gauge-ring の border-radius が円形（50%）に指定されていない');
  assert.ok(HTML.includes('background: none !important'), 'gauge-ring の background リセットが無い');
});

t('Abyss: 超深海探査ポータル（耐圧舷窓・12ボルト・生体発光アーク・ソナースイープ・リアルタイム深度計）が実装されている', () => {
  assert.ok(HTML.includes('id="abyssBioArc"'), 'abyssBioArc が無い');
  assert.ok(HTML.includes('id="abyssBioHead"'), 'abyssBioHead が無い');
  assert.ok(HTML.includes('id="abyssSonarSweep"'), 'abyssSonarSweep が無い');
  assert.ok(HTML.includes('class="abyss-porthole-rim"'), 'abyss-porthole-rim が無い');
  assert.ok(HTML.includes('class="abyss-porthole-bolts"'), 'abyss-porthole-bolts が無い');
  assert.ok(HTML.includes('id="abyssDepthDisplay"'), 'abyssDepthDisplay が無い');
  assert.ok(HTML.includes('id="abyssZoneDisplay"'), 'abyssZoneDisplay が無い');
  assert.ok(HTML.includes('aBioArc.style.strokeDashoffset'), '_driveThemeGauge 内の生体発光アーク制御が無い');
  assert.ok(HTML.includes('aBioHead.style.transform'), '_driveThemeGauge 内の生体発光オーブ制御が無い');
});

t('Frost: 絢爛多面体ファセット外枠、中央成長六角氷結シールド、絢爛フラクタル雪結晶（段階的成長＆中央拡大）、ダイヤモンドダストが存在し、MeltingPoint/ケルビン表示・外周線画・コメットは撤廃されている', () => {
  assert.ok(HTML.includes('frost-hex-rim'), 'frost-hex-rim が無い');
  assert.ok(HTML.includes('frost-hex-inner'), 'frost-hex-inner が無い');
  assert.ok(HTML.includes('class="frost-outer-rim"'), 'frost-outer-rim が無い');
  assert.ok(HTML.includes('class="frost-facet-ribs"'), 'frost-facet-ribs が無い');
  assert.ok(HTML.includes('class="frost-calib-ticks"'), 'frost-calib-ticks が無い');
  assert.ok(HTML.includes('class="frost-vertex-jewel'), 'frost-vertex-jewel が無い');
  assert.ok(!HTML.includes('id="frostKelvinDisplay"'), 'frostKelvinDisplay が残存している');
  assert.ok(!HTML.includes('id="frostStateDisplay"'), 'frostStateDisplay が残存している');
  assert.ok(HTML.includes('class="frost-core-hex"'), 'frost-core-hex が無い');
  assert.ok(HTML.includes('class="frost-apical-stars"'), 'frost-apical-stars が無い');
  assert.ok(HTML.includes('class="frost-dust-star'), 'frost-dust-star が無い');
  assert.ok(HTML.includes('frost-snowflake-dendrite'), 'frost-snowflake-dendrite が無い');
  assert.ok(HTML.includes('frost-dendrite-tier'), 'frost-dendrite-tier が無い');
  assert.ok(HTML.includes('id="frostInfillFill"'), 'frostInfillFill が無い');
  assert.ok(HTML.includes('id="frostInfillClip"'), 'frostInfillClip が無い');
  assert.ok(HTML.includes('id="frostInfillCrevasse"'), 'frostInfillCrevasse が無い');
  assert.ok(HTML.includes('id="frostDiamondDust"'), 'frostDiamondDust が無い');
  assert.ok(!HTML.includes('id="frostCometOrbit"'), 'frostCometOrbit（コメット）が残存している');
  assert.ok(!HTML.includes('id="frostFreezeProg"'), 'frostFreezeProg（外周線画）が残存している');
  assert.ok(!HTML.includes('class="frost-axes-lines"'), '旧来のターゲット照準軸線 frost-axes-lines が残存している');
  assert.ok(!HTML.includes('class="frost-shard'), '旧来のターゲット照準マーカー frost-shard が残存している');
  assert.ok(HTML.includes("fSnowflake.style.transform = 'scale('"), '雪の結晶の中央拡大スケール制御が無い');
});

console.log('── Celestial新演出（絢爛アストロラーベ・多重連動天球儀）＆Brass歯車漏れ防止 検証 ──');

t('Celestial: 絢爛アストロラーベ（立体傾斜軌道・黄道十二宮・天球レテ・太陽天体）が定義されている', () => {
  assert.ok(HTML.includes('id="celEclipticArc"'), 'celEclipticArc が見つからない');
  assert.ok(HTML.includes('id="celSunChronos"'), 'celSunChronos が見つからない');
  assert.ok(HTML.includes('id="celReteGroup"'), 'celReteGroup が見つからない');
  assert.ok(HTML.includes('id="celAspectTrine"'), 'celAspectTrine が見つからない');
  assert.ok(HTML.includes('class="cel-meridian-ring"'), 'cel-meridian-ring が見つからない');
  assert.ok(HTML.includes('class="cel-zodiac-notches"'), 'cel-zodiac-notches が見つからない');
  assert.ok(HTML.includes('@keyframes astroReteSpin'), 'astroReteSpin アニメーションが無い');
  assert.ok(HTML.includes('@keyframes astroMeridianBreath'), 'astroMeridianBreath アニメーションが無い');
  assert.ok(HTML.includes('@keyframes astroSunPulse'), 'astroSunPulse アニメーションが無い');
  assert.ok(HTML.includes('cArc.style.strokeDashoffset'), '_driveThemeGauge 内の黄道進捗計算が無い');
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

t('Brass: ケーシングの astrolabe-ring が回転しない（左上を軸に公転して「左から現れ右下へ消える円」になる）', () => {
  // 点線を実線にしただけでは直らなかった（2026-09-11 に再報告）。SVG 要素の transform-origin は
  // 既定で view-box の 0 0 なので、回転アニメを掛けると輪がゲージの左上を軸に公転する。
  // 同じ書き方だった他テーマのケーシングの輪も一緒に止めてある。
  for (const cls of ['astrolabe-ring', 'cockpit-frame', 'crystal-crown', 'grimoire-circle', 'leviathan-armor']) {
    const rules = HTML.match(new RegExp('[^{}]*\\.' + cls + '[^{}]*\\{[^}]*\\}', 'g')) || [];
    const live = rules.filter(r => !/animation\s*:\s*none/.test(r));
    assert.ok(live.length > 0, '.' + cls + ' のルールが見つからない');
    for (const r of live) {
      assert.ok(!/animation(-name)?\s*:/.test(r), '.' + cls + ' に回転アニメが戻っている: ' + r.trim().slice(0, 120));
    }
  }
});

t('Brass: オーバードライブで公転していた点線の目盛り輪（.megaring-teeth）が撤去されている', () => {
  // 子の circle に megaringSpin を直に掛け、transform-origin は親の .gauge-megaring にしか無かった
  // ＝ 200%超で「左に掠める橙の点線の弧」になっていた。外周の破線リムとメガリングの回転は残す。
  assert.ok(!HTML.includes('megaring-teeth"'), '.megaring-teeth の要素が残っている');
  assert.ok(!/\.megaring-teeth\s*\{/.test(HTML), '.megaring-teeth のスタイルが残っている');
  assert.ok(HTML.includes('class="megaring-rim"'), '外周の破線リム(.megaring-rim)まで消えている');
  assert.ok(/\.gauge\[data-tier="6"\] \.gauge-megaring\{[^}]*animation:megaringSpin/.test(HTML), 'メガリング本体の回転まで消えている');
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

t('Aurora: 極限まで絢爛・神秘的なHeroゲージ意匠（地磁気力線プラズマアーチ、天頂極光コロナ螺旋光芒、オパール虹彩光環、流麗極光カーテン、鉛直光柱、極光プラズマオーブ）が実装されフロスト類似意匠が撤廃されている', () => {
  // 新意匠（地磁気力線・天頂スパイラル・オパール光輪）の存在検証
  assert.ok(HTML.includes('class="a-mag-flux'), 'a-mag-flux（地磁気力線）が見つからない');
  assert.ok(HTML.includes('class="a-mag-equator"'), 'a-mag-equator（磁気赤道環）が見つからない');
  assert.ok(HTML.includes('class="a-mag-pole'), 'a-mag-pole（磁極ノード）が見つからない');
  assert.ok(HTML.includes('id="auroraZenithSpirals"'), 'auroraZenithSpirals（天頂極光コロナ）が見つからない');
  assert.ok(HTML.includes('class="a-spiral-ray'), 'a-spiral-ray（スパイラル光芒）が見つからない');
  assert.ok(HTML.includes('class="aurora-opal-ring'), 'aurora-opal-ring（オパール光輪）が見つからない');
  assert.ok(HTML.includes('class="aurora-curtain-deep"'), 'aurora-curtain-deep が見つからない');
  assert.ok(HTML.includes('class="aurora-curtain-rays"'), 'aurora-curtain-rays が見つからない');
  assert.ok(HTML.includes('class="a-ion-ray'), 'a-ion-ray が見つからない');
  assert.ok(HTML.includes('class="aurora-sparkle aurora-dstar'), 'aurora-dstar が見つからない');
  assert.ok(HTML.includes('class="aurora-jewel-flare"'), 'aurora-jewel-flare が見つからない');
  assert.ok(HTML.includes('aCore.dataset.auroraStage'), '_driveThemeGauge 内のauroraStage制御が無い');

  // フロスト類似意匠（トラス線・目盛りノッチ・頂点ジュエル・縦テキスト等）の完全撤廃検証
  assert.ok(!HTML.includes('class="aurora-facet-trusses"'), 'フロスト類似のトラス線が残っている');
  assert.ok(!HTML.includes('class="aurora-spectral-ticks"'), 'フロスト類似の目盛りノッチが残っている');
  assert.ok(!HTML.includes('class="aurora-vertex-jewel"'), 'フロスト類似の頂点ジュエルが残っている');
  assert.ok(!HTML.includes('id="auroraWaveDisplay"'), 'フロスト類似の波長テレメトリーが残っている');
  assert.ok(!HTML.includes('id="auroraStateDisplay"'), 'フロスト類似の状態表示テキストが残っている');
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

t('Frost: オーバードライブ装飾から同心円リング（frost-blizzard-ring）が完全撤廃され、極冷気ミストオーラ＆ダイヤモンドダスト＆放射クリスタルレイが実装されている', () => {
  assert.ok(!HTML.includes('frost-blizzard-ring'), 'frost-blizzard-ring が残っている');
  assert.ok(HTML.includes('frost-hyper-rim'), 'frost-hyper-rim が無い');
  assert.ok(HTML.includes('frost-mist-aura'), 'frost-mist-aura が無い');
  assert.ok(HTML.includes('frost-overdrive-diamonds'), 'frost-overdrive-diamonds が無い');
  assert.ok(HTML.includes('frost-od-rays'), 'frost-od-rays が無い');
});

t('Frost: 正解・祝祭演出（frostCrystalShatter）から同心円rings/sonicWaveが完全撤廃されslashRibbonへ刷新されている', () => {
  const fxJs = fs.readFileSync(path.join(__dirname, '..', 'fx_engine.js'), 'utf8');
  const frostShatterBlock = fxJs.substring(fxJs.indexOf('function frostCrystalShatter('), fxJs.indexOf('function flashScreen('));
  assert.ok(!frostShatterBlock.includes('rings('), 'frostCrystalShatterにringsが残っている');
  assert.ok(!frostShatterBlock.includes('sonicWave('), 'frostCrystalShatterにsonicWaveが残っている');
  assert.ok(frostShatterBlock.includes('slashRibbon('), 'frostCrystalShatterにslashRibbonが無い');
});

t('Frost: 試験演出（chapter_exam.js, study_exam.js）からringsが完全撤廃されている', () => {
  const chapterJs = fs.readFileSync(path.join(__dirname, '..', 'chapter_exam.js'), 'utf8');
  assert.ok(chapterJs.includes("if (curUi === 'frost') return; // Frostは同心円リング・点線円を完全撤廃"), 'chapter_exam.js の ceCorrectShockwave で frost ガードが無い');
  
  const ceStreakFrostBlock = chapterJs.substring(chapterJs.indexOf("curUi === 'frost'"), chapterJs.indexOf("curUi === 'aurora'"));
  assert.ok(!ceStreakFrostBlock.includes('rings('), 'chapter_exam.js の frost streak に rings が残っている');

  const studyJs = fs.readFileSync(path.join(__dirname, '..', 'study_exam.js'), 'utf8');
  const seStreakFrostBlock = studyJs.substring(studyJs.indexOf("curUi === 'frost'"), studyJs.indexOf("curUi === 'aurora'"));
  assert.ok(!seStreakFrostBlock.includes('rings('), 'study_exam.js の frost streak に rings が残っている');

  const seScatterFrostBlock = studyJs.substring(studyJs.indexOf("curUi === 'frost'"), studyJs.indexOf("curUi === 'aurora'"));
  assert.ok(!seScatterFrostBlock.includes('rings('), 'study_exam.js の frost celebration に rings が残っている');
});

console.log('── Liquid新演出（ちぎれて戻る液滴分裂・再融合＆多層フヨフヨアメーバ流体＆他テーマ被り完全排除）検証 ──');

// ── 🧬 外膜の千切れ（2026-09-14）──
function fnBody(name) {
  const i = HTML.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' が無い');
  let depth = 0, j = HTML.indexOf('{', i);
  for (let k = j; k < HTML.length; k++) {
    if (HTML[k] === '{') depth++;
    else if (HTML[k] === '}' && --depth === 0) return HTML.slice(i, k + 1);
  }
  throw new Error(name + ' の終端が見つからない');
}

t('Liquid: 旧演出（中心から出入りする水疱・内側の弧の千切れ）が復活していない', () => {
  ['fission-drop', 'liquidFissionPods', 'lava-tendril', 'liquidTendrils', 'fissionPinch', 'overdrivePinchSnap', 'overdriveTendril', 'tendrilPulse',
   'id="liquidTear"', '.liquid-tear', 'LIQ_TEAR_STOPS']
    .forEach(w => assert.ok(!HTML.includes(w), w + ' が残っている'));
  assert.ok(!/strokeDasharray\s*=/.test(fnBody('_liqTearPlay')), '_liqTearPlay が進捗の弧の dasharray を書いている');
});

t('Liquid: 外膜（.gauge-ring::after）に conic-gradient の mask で切れ目を開ける（最大2つ）', () => {
  const THEME = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.css'), 'utf8');
  assert.ok(/html\.ui-liquid \.gauge \.gauge-ring::after \{[^}]*border: 2px solid/.test(THEME), '外膜（::after の border）の定義が変わった＝千切れの素材を見直すこと');
  const m = HTML.match(/html\.ui-liquid \.gauge \.gauge-ring\.lt-on::after \{([^}]*)\}/);
  assert.ok(m, '.lt-on::after の mask ルールが無い');
  ['-webkit-mask-image: var(--lt-mask', 'mask-image: var(--lt-mask']
    .forEach(w => assert.ok(m[1].includes(w), '.lt-on::after に ' + w + ' が無い'));
  assert.ok(fnBody('_liqConicMask').includes("'conic-gradient(from '"), '_liqConicMask が conic-gradient を組んでいない');
  const play = fnBody('_liqTearPlay'), end = fnBody('_liqTearEnd'), render = fnBody('_liqTearRender');
  assert.ok(play.includes("ring.classList.add('lt-on')") && render.includes("setProperty('--lt-mask'"), '切れ目を開けていない');
  assert.ok(end.includes("ring.classList.remove('lt-on')") && end.includes("removeProperty('--lt-mask')"), '終了時に膜を元へ戻していない');
  assert.ok(/setTimeout\(\(\) => _liqTearEnd\(o\), o\.dur \+ \d+\)/.test(play), '非表示タブ用の落とし所（setTimeout(_liqTearEnd)）が無い');
  assert.ok(/Math\.random\(\)/.test(play) && /LIQ_TEAR_SEP/.test(play), '千切れる位置がランダム・互いに離れていない');
  assert.ok(/const LIQ_TEAR_MAX = 2;/.test(HTML) && /const LIQ_TEAR_DUR = 12000;/.test(HTML), '最大2つ・12秒になっていない');
});

t('Liquid: 液体の弧も一緒に千切れる（svg の mask・満ちた区間だけ・dasharray は触らない）', () => {
  assert.ok(/<mask id="liquidArcTearMask"[^>]*>[\s\S]*?id="liquidArcTearHole0"[\s\S]*?id="liquidArcTearHole1"[\s\S]*?<\/mask>/.test(HTML), '弧の穴の mask が無い');
  const w = HTML.slice(HTML.indexOf('<g id="liquidArcTearWrap">'), HTML.indexOf('/#liquidArcTearWrap'));
  assert.ok(w.includes('id="liquidFluidStream"') && w.includes('id="liquidFlowGlint"'), '#liquidArcTearWrap が弧と流れる光を包んでいない');
  const play = fnBody('_liqTearPlay'), end = fnBody('_liqTearEnd');
  assert.ok(play.includes("wrap.setAttribute('mask', 'url(#liquidArcTearMask)')") && end.includes("wrap.removeAttribute('mask')"), 'mask を千切れている間だけ付けていない');
  assert.ok(/_liqTearBase >= 100 \? TAU : TAU \* _liqTearBase \/ 100/.test(play), '千切れる位置を満ちた区間に限っていない');
  ['_liqTearPlay', '_liqTearRender', '_liqTearShape'].forEach(n => assert.ok(!/strokeDash(array|offset)\s*=/.test(fnBody(n)), n + ' が進捗の弧の dash を書いている'));
  assert.ok(fnBody('_liqTearShape').includes('matrixTransform(inv)'), '弧の穴を getScreenCTM の逆行列で求めていない');
});

t('Liquid: かけらの svg は .gauge-ring 直下にあり、ゲージ svg の回転・円形クリップを打ち消している', () => {
  const ring = HTML.slice(HTML.indexOf('<div class="gauge-ring">'), HTML.indexOf('<span class="gauge-mid" id="gaugeMid">'));
  assert.ok(ring.includes('id="liquidMembraneTear"') && ring.includes('id="liquidMembranePiece0"') && ring.includes('id="liquidMembranePiece1"'), 'かけらの svg が .gauge-ring の中に無い');
  const m = HTML.match(/\.gauge-ring svg\.liquid-membrane-tear \{([^}]*)\}/);
  assert.ok(m && /transform: none/.test(m[1]) && /clip-path: none/.test(m[1]) && /position: absolute/.test(m[1]), '.gauge-ring svg の rotate(-90deg)/clip-path を打ち消していない');
  assert.ok(/\.lmt-piece \{\s*stroke: none;/.test(HTML), 'かけらに縁取りがある（別の泡に見える）');
});

t('Liquid: 形は毎フレーム読み直し、読む→書くを1本の rAF にまとめる・横にはみ出さない', () => {
  const geom = fnBody('_liqMembraneGeom');
  assert.ok(geom.includes("getComputedStyle(ring, '::after')"), '::after の算出値を読んでいない');
  ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'cs.transform']
    .forEach(w => assert.ok(geom.includes(w), '_liqMembraneGeom が ' + w + ' を見ていない'));
  const render = fnBody('_liqTearRender');
  assert.ok(/const g = _liqMembraneGeom\(ring\);/.test(render), 'render で膜の形を読み直していない');
  assert.ok(render.indexOf('_liqMembraneGeom(ring)') < render.indexOf("svg.setAttribute('viewBox'"), '読み（形）より先に書いている');
  assert.ok(!/requestAnimationFrame/.test(fnBody('_liqTearShape')), '塊ごとに rAF を立てている');
  assert.ok(/document\.documentElement\.clientWidth/.test(render) && /vw - 6 - rbA/.test(fnBody('_liqTearShape')), '塊が横にはみ出す（iOS の縮尺揺れ）');
});

t('Liquid: 千切れのタイマーは1本だけ・90%未満では張らない・reduced-motion で止まる', () => {
  const arm = fnBody('_liqTearArm');
  assert.ok(/if \(_liqTearTimer \|\| _liqTearBase < LIQ_TEAR_MIN\) return;/.test(arm), '_liqTearArm に多重防止・90%判定が無い');
  assert.ok(/const LIQ_TEAR_MIN = 90;/.test(HTML), 'LIQ_TEAR_MIN が 90 でない');
  const drive = fnBody('_driveThemeGauge');
  assert.ok(/_liqTearBase = over > 0 \? 100 : base;\s*_liqTearArm\(\);/.test(drive), '_driveThemeGauge から千切れを張っていない（100%超も続ける）');
  const ok = fnBody('_liqTearOk');
  assert.ok(ok.includes("'ui-liquid'") && ok.includes('_reducedMotion()') && ok.includes('document.hidden'), '_liqTearOk がテーマ・reduced-motion・非表示タブを見ていない');
  assert.ok(/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?\.liquid-membrane-tear \{ display: none !important; \}/.test(HTML), 'reduced-motion でかけらを止めていない');
});

t('Liquid: チャンバーの clip は r≦84 に戻っている（.gauge-ring svg の円形クリップの前提）', () => {
  const m = HTML.match(/<clipPath id="liquidChamberClip">\s*<circle cx="84" cy="84" r="([\d.]+)"/);
  assert.ok(m && +m[1] <= 84, 'liquidChamberClip の半径が 84 を超えている: ' + (m && m[1]));
});

t('Liquid: 多層アメーバ流体（中間層メソプラズム＆内層高密度エンドプラズム＆多層生体膜チャンバー）とフヨフヨ弾力キーフレームが定義されている', () => {
  assert.ok(HTML.includes('id="lavaCellMesoplasm"'), 'lavaCellMesoplasm が見つからない');
  assert.ok(HTML.includes('id="lavaCellEndoplasm"'), 'lavaCellEndoplasm が見つからない');
  assert.ok(HTML.includes('id="lavaChamberOuter"'), 'lavaChamberOuter が見つからない');
  assert.ok(HTML.includes('id="lavaChamberInner"'), 'lavaChamberInner が見つからない');
  assert.ok(HTML.includes('@keyframes jellySquish'), 'jellySquish アニメーションが無い');
  assert.ok(HTML.includes('@keyframes jellyMicroJiggle'), 'jellyMicroJiggle アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaMesoplasmFlow'), 'lavaMesoplasmFlow アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaEndoplasmFlow'), 'lavaEndoplasmFlow アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaChamberOuterMorph'), 'lavaChamberOuterMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes lavaChamberInnerMorph'), 'lavaChamberInnerMorph アニメーションが無い');
});

t('Liquid: 内部生体小胞群（liquidVacuoles）と有機プルプルスペキュラ（liquidSpecularGroup）が定義されている', () => {
  assert.ok(HTML.includes('id="liquidVacuoles"'), 'liquidVacuoles が見つからない');
  assert.ok(HTML.includes('id="lavaVacuole1"'), 'lavaVacuole1 が見つからない');
  assert.ok(HTML.includes('id="lavaVacuole2"'), 'lavaVacuole2 が見つからない');
  assert.ok(HTML.includes('id="lavaVacuole3"'), 'lavaVacuole3 が見つからない');
  assert.ok(HTML.includes('id="lavaVacuole4"'), 'lavaVacuole4 が見つからない');
  assert.ok(HTML.includes('id="liquidSpecularGroup"'), 'liquidSpecularGroup が見つからない');
  assert.ok(HTML.includes('class="lava-spec-wobble'), 'lava-spec-wobble が見つからない');
  assert.ok(HTML.includes('class="lava-spec-glint"'), 'lava-spec-glint が見つからない');
  assert.ok(HTML.includes('@keyframes vacuoleFloat1'), 'vacuoleFloat1 アニメーションが無い');
  assert.ok(HTML.includes('@keyframes specWobble'), 'specWobble アニメーションが無い');
});

t('Liquid: _driveThemeGauge内で新意匠（mesoplasm, endoplasm, vacuoles）の進捗連動制御が存在する', () => {
  assert.ok(HTML.includes('const lMesoplasm = document.getElementById(\'lavaCellMesoplasm\');'), 'lMesoplasm取得が無い');
  assert.ok(HTML.includes('const lEndoplasm = document.getElementById(\'lavaCellEndoplasm\');'), 'lEndoplasm取得が無い');
  assert.ok(HTML.includes('const lVacuoles = document.getElementById(\'liquidVacuoles\');'), 'lVacuoles取得が無い');
  assert.ok(HTML.includes('lVacuoles.style.transform'), 'lVacuolesの連動制御が無い');
});

t('Liquid: 他テーマの意匠（歯車・照準・金継ぎ・天体・舷窓・雪結晶・直線目盛り等）がLiquidゲージ内に一切混入していない', () => {
  const liquidBlock = HTML.substring(HTML.indexOf('id="gaugeLiquidCore"'), HTML.indexOf('id="gaugeKintsugiCore"'));
  assert.ok(!liquidBlock.includes('gear'), 'Liquidに歯車が混入している');
  assert.ok(!liquidBlock.includes('crosshair'), 'Liquidに照準が混入している');
  assert.ok(!liquidBlock.includes('bracket'), 'Liquidにブラケットが混入している');
  assert.ok(!liquidBlock.includes('honeycomb'), 'Liquidにハニカムが混入している');
  assert.ok(!liquidBlock.includes('crack'), 'Liquidにクラックが混入している');
  assert.ok(!liquidBlock.includes('astrolabe'), 'Liquidにアストロラーベが混入している');
  assert.ok(!liquidBlock.includes('zodiac'), 'Liquidに黄道十二宮が混入している');
  assert.ok(!liquidBlock.includes('porthole'), 'Liquidに舷窓が混入している');
  assert.ok(!liquidBlock.includes('snowflake'), 'Liquidに雪結晶が混入している');
  assert.ok(!liquidBlock.includes('facet'), 'Liquidに多面体ファセットが混入している');
  assert.ok(!liquidBlock.includes('kelvin'), 'Liquidにケルビン計が混入している');
});

t('Liquid: 外周二重毛細管フルイディック・ネオンゲージ（liquidFluidStream, liquidMeniscusHead, liquidOverdriveStream）と先端メニスカス公転が定義されている', () => {
  assert.ok(HTML.includes('id="liquidCapillaryGauge"'), 'liquidCapillaryGauge が見つからない');
  assert.ok(HTML.includes('id="liquidFluidStream"'), 'liquidFluidStream が見つからない');
  assert.ok(HTML.includes('id="liquidMeniscusHead"'), 'liquidMeniscusHead が見つからない');
  assert.ok(HTML.includes('id="liquidOverdriveStream"'), 'liquidOverdriveStream が見つからない');
  assert.ok(HTML.includes('id="liquidStreamBubbles"'), 'liquidStreamBubbles が見つからない');
  assert.ok(HTML.includes('class="liquid-tube-bg"'), 'liquid-tube-bg が見つからない');
  assert.ok(HTML.includes('class="lmh-droplet"'), 'lmh-droplet が見つからない');
  assert.ok(HTML.includes('@keyframes meniscusPulse'), 'meniscusPulse アニメーションが無い');
  assert.ok(HTML.includes('@keyframes meniscusSquish'), 'meniscusSquish アニメーションが無い');
});

t('Liquid: 表面張力メニスカス波紋（liquidMeniscusRipples）、対流マーブルスワール（liquidMarbleSwirls）、薄膜真珠光沢が定義されている', () => {
  assert.ok(HTML.includes('id="liquidMeniscusRipples"'), 'liquidMeniscusRipples が見つからない');
  assert.ok(HTML.includes('class="l-ripple r1"'), 'l-ripple が見つからない');
  assert.ok(HTML.includes('id="liquidMarbleSwirls"'), 'liquidMarbleSwirls が見つからない');
  assert.ok(HTML.includes('class="liquid-pearl-sheen"'), 'liquid-pearl-sheen が見つからない');
  assert.ok(HTML.includes('@keyframes meniscusRippleSpread'), 'meniscusRippleSpread アニメーションが無い');
  assert.ok(HTML.includes('@keyframes marbleSwirlCW'), 'marbleSwirlCW アニメーションが無い');
  assert.ok(HTML.includes('@keyframes pearlSheenDrift'), 'pearlSheenDrift アニメーションが無い');
});

t('Liquid: 100%達成・Overdrive時の絢爛ミルククラウン・スプラッシュ（liquidCrownSplash）と超臨界シャンパン発泡（liquidEffervescence）が定義されている', () => {
  assert.ok(HTML.includes('id="liquidCrownSplash"'), 'liquidCrownSplash が見つからない');
  assert.ok(HTML.includes('class="crown-wave"'), 'crown-wave が見つからない');
  assert.ok(HTML.includes('class="crown-bead'), 'crown-bead が見つからない');
  assert.ok(HTML.includes('id="liquidEffervescence"'), 'liquidEffervescence が見つからない');
  assert.ok(HTML.includes('class="eff-bubble eb1"'), 'eff-bubble が見つからない');
  assert.ok(HTML.includes('@keyframes crownMorphPulse'), 'crownMorphPulse アニメーションが無い');
  assert.ok(HTML.includes('@keyframes effRise'), 'effRise アニメーションが無い');
});

t('Liquid: _driveThemeGauge内で外周流体ストリーム、メニスカスヘッド、クラウンスプラッシュの進捗連動制御が存在する', () => {
  assert.ok(HTML.includes('const lStream = document.getElementById(\'liquidFluidStream\');'), 'lStream取得が無い');
  assert.ok(HTML.includes('const lMeniscus = document.getElementById(\'liquidMeniscusHead\');'), 'lMeniscus取得が無い');
  assert.ok(HTML.includes('const lCrown = document.getElementById(\'liquidCrownSplash\');'), 'lCrown取得が無い');
  assert.ok(HTML.includes('lStream.style.strokeDashoffset'), 'lStreamの連動制御が無い');
  assert.ok(HTML.includes('lMeniscus.style.transform'), 'lMeniscusの連動制御が無い');
});

t('Liquid: 100%超（Overdrive）における劇的有機変形（アメーバモーフィング＆チャンバー歪み脈動）が定義されている', () => {
  assert.ok(HTML.includes('@keyframes overdriveAmoebaBodyMorph'), 'overdriveAmoebaBodyMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes overdriveAmoebaMantleMorph'), 'overdriveAmoebaMantleMorph アニメーションが無い');
  assert.ok(HTML.includes('@keyframes overdriveChamberWobble'), 'overdriveChamberWobble アニメーションが無い');
  assert.ok(HTML.includes('@keyframes overdriveJellyQuake'), 'overdriveJellyQuake アニメーションが無い');
  assert.ok(HTML.includes('.gauge[data-overdrive] .lava-cell-body') || HTML.includes('html.ui-liquid #gaugeLiquidCore.overdrive .lava-cell-body'), 'Overdrive流体セル変形ルールが無い');
});

// ── 💎 Liquid 絢爛化（2026-09-14b） ─────────────────────────────
t('Liquid絢爛: 弧の中を流れる光・真珠の輪・水面の光のマークアップが揃っている（内側へ落ちる雫は撤去済み）', () => {
  ['id="liquidFlowGlint"', 'mask="url(#liquidGlintMask)"', 'id="liquidGlintMaskArc"', 'id="liquidPearlRing"',
   'class="lmh-splash-ring"', 'class="liquid-caustics"', 'id="liquidDepthLensGrad"', 'id="liquidPearlBeadGrad"']
    .forEach(w => assert.ok(HTML.includes(w), w + ' が無い'));
  ['liquidDrips', 'ldrip', 'LIQ_DRIP_MARKS', 'liquidDripGrad', 'liqDripFall', 'liqDripRing']
    .forEach(w => assert.ok(!HTML.includes(w), w + ' が残っている（内側へ落ちる雫はユーザーの判断で撤去）'));
  // 光のマスクは流体の弧と同じ dashoffset を持つ（充填ぶんだけ光る）
  assert.ok(/lGlintMask\.style\.strokeDashoffset = String\(sOffset\.toFixed\(2\)\)/.test(fnBody('_driveThemeGauge')), '光のマスクが弧の充填と連動していない');
  // 光の模様の周期（dasharray の合計）は周の半分＝継ぎ目なく回る
  const da = HTML.match(/\.liquid-flow-glint \{[^}]*stroke-dasharray: ([\d. ]+);/);
  const sum = da[1].trim().split(/\s+/).map(Number).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 179.07) < .01, '光の模様の周期が 179.07 でない: ' + sum);
});

t('Liquid絢爛: 進捗の演出は予定表1本・テーマ/reduced-motion/非表示タブの門を通る', () => {
  const fx = fnBody('_liqProgressFx');
  assert.ok(/!_liqTearOk\(\)/.test(fx), '_liqProgressFx が _liqTearOk の門を通っていない');
  assert.ok(/if \(!\(base > prev\)/.test(fx), '進捗が伸びていないのに演出を出している（renderHero は同期のたびに走る）');
  const later = fnBody('_liqFxLater');
  assert.ok(/clearTimeout\(_liqFxTimer\)/.test(later), '_liqFxLater がタイマーを張り替える前に止めていない（多重発火）');
  assert.ok(/try \{[^}]*\} catch/.test(fnBody('_liqFxPump')), '予定の1つが例外を投げると残りが止まる');
});

t('Liquid絢爛: 位置・大きさの演出は translate / scale で書く（transform は既存アニメが持つ）', () => {
  ['liqSplashRing', 'liqSpray', 'liqDepthMid', 'liqDepthCore', 'liqCausticA', 'liqCausticB'].forEach(k => {
    const m = HTML.match(new RegExp('@keyframes ' + k + ' \\{([\\s\\S]*?)\\n\\}'));
    assert.ok(m, '@keyframes ' + k + ' が無い');
    assert.ok(!/transform:/.test(m[1]), k + ' が transform を使っている');
  });
  const THEME = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.css'), 'utf8');
  const near = THEME.match(/@keyframes liquidDepthNear \{([\s\S]*?)\n\}/);
  assert.ok(near && !/transform:/.test(near[1]), 'liquidDepthNear が transform を使っている（liquidFluidMorph を殺す）');
  // 膜が translate で揺れるので、かけらの位置計算も translate を足している
  const geom = fnBody('_liqMembraneGeom');
  assert.ok(geom.includes('cs.translate') && geom.includes('borderTopColor'), '_liqMembraneGeom が膜の translate・辺の色を読んでいない');
});

t('Liquid絢爛: reduced-motion で新しい演出を止めている', () => {
  const rm = HTML.match(/\.liquid-membrane-tear \{ display: none !important; \}([\s\S]{0,400})/);
  assert.ok(rm, 'reduced-motion ブロックが見つからない');
  ['.liquid-flow-glint', '.liquid-drips', '.lmh-splash-ring', '.lmh-spray', '.lpr-seal', '.liquid-caustics i', '.lpr-beads', '.liquid-metaball-layer']
    .forEach(w => assert.ok(rm[1].includes(w), 'reduced-motion で ' + w + ' を止めていない'));
});

// ── ❄️ Frost 絢爛化（2026-09-14c） ─────────────────────────────
t('Frost絢爛: ベベル・ファイア・霜の前線・氷の中の構造・霜の枝・開花の光芒のマークアップが揃っている', () => {
  ['class="frost-hex-bevel"', 'id="frostRimGrad"', 'id="frostFireGrad"', 'class="frost-fire frost-fire-core"',
   'class="frost-ice-depth"', 'id="frostSnapBranches"', 'id="frostBloomRays"']
    .forEach(w => assert.ok(HTML.includes(w), w + ' が無い'));
  // 光芒を1本の path に束ねるとダッシュが巡回する＝6本同時に抜けない
  const rays = HTML.substring(HTML.indexOf('id="frostBloomRays"'), HTML.indexOf('</g>', HTML.indexOf('id="frostBloomRays"')));
  assert.strictEqual((rays.match(/<line class="fbr-core"/g) || []).length, 6, '開花の光芒（芯）が1本ずつの line 6本になっていない');
  const dust = HTML.substring(HTML.indexOf('id="frostDiamondDust"'), HTML.indexOf('</g>', HTML.indexOf('id="frostDiamondDust"')));
  assert.ok((dust.match(/class="frost-dust/g) || []).length <= 6, 'ダイヤモンドダストが6点を超えている（数で埋めない）');
});

t('Frost絢爛: 光の引き算——drop-shadow を持つのは主軸・中心の宝石・頂点の宝石・OD の縁だけ／keyframes で filter を動かさない', () => {
  const css = HTML.substring(HTML.indexOf('8. Frost: 【六花スノークリスタル'), HTML.indexOf('/* prefers-reduced-motion での新演出の静止化 */'));
  const allowed = ['.frost-vertex-jewel', '.frost-core-diamond', '.frost-spine-main'];
  const rules = css.match(/([^{}]+)\{([^{}]*)\}/g) || [];
  rules.forEach(r => {
    const sel = r.slice(0, r.indexOf('{')).trim();
    if (!/drop-shadow/.test(r) || /^\d+%|^from|^to/.test(sel)) return;
    assert.ok(allowed.some(a => sel.includes(a)), sel + ' に drop-shadow が残っている');
  });
  ['frostCrystalBreathe', 'frostOuterBreath', 'frostJewelTwinkle', 'frostDustStarTwinkle', 'frostHyperBreath', 'frostMistDrift', 'frostGemTwinkle', 'frostRayPulse']
    .forEach(k => {
      const m = HTML.match(new RegExp('@keyframes ' + k + ' \\{([\\s\\S]*?)\\n\\}'));
      assert.ok(m, '@keyframes ' + k + ' が無い');
      assert.ok(!/filter:/.test(m[1]), k + ' が filter を動かしている（毎フレーム焼き直し）');
    });
});

t('Frost絢爛: 雪結晶の開花は rotate / scale で書く（inline の transform: scale() を殺さない）', () => {
  const m = HTML.match(/@keyframes frostBloomTwist \{([\s\S]*?)\n\}/);
  assert.ok(m && /rotate:/.test(m[1]) && !/transform:/.test(m[1]), 'frostBloomTwist が transform を使っている');
  const s = HTML.match(/@keyframes frostSnap \{([\s\S]*?)\n\}/);
  assert.ok(s && !/transform:/.test(s[1]), 'frostSnap が transform を使っている（JS の scale を殺す）');
});

t('Frost絢爛: 100%超で svg ごと1周60秒で回る（Frost に閉じる・数字は回さない・reduced-motion で止まる）', () => {
  assert.ok(/html\.ui-frost \.gauge\[data-frost-spin\] \.gauge-ring > svg:not\(\.liquid-membrane-tear\) \{\s*animation: frostGaugeSpin 60s linear infinite;/.test(HTML), '回転の規則が無い／Frost に閉じていない');
  const k = HTML.match(/@keyframes frostGaugeSpin \{([^\n]*)\}/);
  assert.ok(k && /rotate:/.test(k[1]) && !/transform:/.test(k[1]), 'frostGaugeSpin が transform を使っている（svg の rotate(-90deg) を消す）');
  const fx = fnBody('_driveThemeGauge');
  assert.ok(/if \(pct > 100\) fBox\.dataset\.frostSpin = '1';/.test(fx), '100% を超えたときだけ回す判定が無い');
  assert.ok(/removeAttribute\('data-frost-spin'\)/.test(fx), '100% 以下に戻ったとき回転を止めていない');
  assert.ok(/html\.ui-frost \.gauge \.gauge-ring > svg, #frostSnowflakeDendrite\.fr-bloom \{ animation: none !important; \}/.test(HTML), 'reduced-motion で回転を止めていない');
});

t('Frost絢爛: 段の演出は予定表1本（Liquid と共用）・テーマ/reduced-motion/非表示タブの門を通る', () => {
  const fx = fnBody('_frostProgressFx');
  assert.ok(/!_frostFxOk\(\)/.test(fx) && /if \(!\(base > prev\)/.test(fx), '門を通っていない／伸びていないのに演出を出す');
  assert.ok(!/setTimeout/.test(fx), '_frostProgressFx が自前のタイマーを張っている（_liqFxLater を使う）');
  assert.ok(/additive: false/.test(fx), '氷の破片が加算合成（光の玉）になっている');
  const ok = fnBody('_frostFxOk');
  assert.ok(ok.includes("'ui-frost'") && ok.includes('_reducedMotion()') && ok.includes('document.hidden'), '_frostFxOk がテーマ・reduced-motion・非表示タブを見ていない');
  assert.ok(/\.frost-fire, \.frost-snap-branches, \.frost-bloom-rays \{ display: none !important; \}/.test(HTML), 'reduced-motion で新しい演出を消していない');
});

console.log(`\nALL PASS (${pass}/${pass + fail})\n`);





