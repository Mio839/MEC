/**
 * Heroゲージ演出強化（第1位・第3位・第5位）の包括的検証テスト
 * Run: node _work/test_gauge_enhancements.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = require('./lib_hub_source')();

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

t('ケーシング（casing-*）とオーバードライブ（od-*）がマークアップに揃っている（Liquid は canvas のゲージへ置き換えて撤去）', () => {
  const themes = ['brass', 'cyber', 'aurora', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('class="casing-' + th + '"'), 'casing-' + th + ' が無い');
    assert.ok(HTML.includes('od-' + th), 'od-' + th + ' が無い');
  });
  assert.ok(!HTML.includes('casing-liquid') && !HTML.includes('od-liquid'), 'Liquid のケーシング／オーバードライブが復活している');
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
    'gaugeBrassCore', 'gaugeCyberCore', 'gaugeAuroraCore', 'gaugeLiquidCanvas',
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
  assert.ok(HTML.includes('id="gaugeLiquidCanvas"'), 'gaugeLiquidCanvas が見つからない');
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
  const themes = ['brass', 'cyber', 'aurora', 'kintsugi', 'celestial', 'abyss', 'frost'];
  themes.forEach(th => {
    assert.ok(HTML.includes('.theme-gauge-' + th), '.theme-gauge-' + th + ' のスタイルが無い');
  });
  assert.ok(HTML.includes('html.ui-liquid .liq-canvas'), 'Liquid の canvas の表示切り替えが無い');
  assert.ok(HTML.includes('html.ui-cyber .gauge-trk'), '非Brassテーマでの共通丸パーツ非表示ルールが無い');
});

console.log('── プランB（非円形4種＋円形4種＆Lava Lamp流体）詳細検証 ──');

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

// 2026-09-29: 子午環の菱形4つを撤去・レテの輪を正円に・天の川と「天球儀が開く」を追加
t('Celestial: 菱形4つが無く、レテの輪が正円（r=42）で、星針が同じ円の上にある', () => {
  assert.ok(!HTML.includes('cel-meridian-diamond'), '子午環の菱形が残っている');
  assert.ok(!HTML.includes('astroDiamondGlow'), '菱形のアニメが残っている');
  assert.ok(HTML.includes('class="cel-rete-arms" d="M 84,42 A 42 42 0 1 1 84,126 A 42 42 0 1 1 84,42'), 'レテの輪が正円になっていない');
  const cores = [...HTML.matchAll(/<circle class="sp-core" cx="([\d.]+)" cy="([\d.]+)"/g)];
  assert.strictEqual(cores.length, 4, '星針の芯が4つ無い');
  cores.forEach((m) => assert.ok(Math.abs(Math.hypot(+m[1] - 84, +m[2] - 84) - 42) < 0.01, '星針がレテの円の上に無い: ' + m[0]));
});

t('Celestial: 天の川（進捗のマスク・流れる星屑6本・先頭の星）が配線されている', () => {
  assert.ok(HTML.includes('<mask id="celMwMask">'), '天の川のマスクが無い');
  assert.ok(HTML.includes('id="celMwMaskArc"') && HTML.includes('id="celMwTip"'), '進捗の弧か先頭の星が無い');
  for (let k = 1; k <= 6; k++) {
    assert.ok(HTML.includes('cel-mw-f' + k + '"'), '星屑の流れ ' + k + ' が無い');
    assert.ok(HTML.includes('@keyframes celMwFlow' + k), 'celMwFlow' + k + ' が無い');
  }
  assert.ok(HTML.includes("mwArc.setAttribute('stroke-dasharray'"), '天の川の進捗を JS が置いていない');
});

t('Celestial: 天球儀が開く（環3本・段の閃き・100%の一回転・100%超の回転）が配線されている', () => {
  for (let k = 0; k < 3; k++) assert.ok(HTML.includes('id="celArm' + k + '"'), 'celArm' + k + ' が無い');
  assert.ok(HTML.includes('id="celArm"') && HTML.includes('id="celArmRip"'), '天球の群か波紋が無い');
  assert.ok(HTML.includes('function _celProgressFx(base)') && HTML.includes('_celProgressFx(base);'), '段の演出が呼ばれていない');
  assert.ok(HTML.includes('.cel-arm-sph.cel-spin'), '100% の一回転が無い');
  assert.ok(HTML.includes('.gauge[data-cel-over] .cel-arm-w'), '100% 超の回転が無い');
  // transform 属性を持つ群に CSS の scale を当てない（合成がずれる）
  assert.ok(!/<g class="cel-arm-s"[^>]*transform=/.test(HTML), '.cel-arm-s に transform 属性がある');
  assert.ok(!/<g class="cel-arm-sph"[^>]*transform=/.test(HTML), '.cel-arm-sph に transform 属性がある');
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
    const rules = HTML.match(new RegExp('[^{};\\n]*\\.' + cls + '[^{}]*\\{[^}]*\\}', 'g')) || [];
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

console.log('── Liquid：canvas のゲージ（hub_liquid.js・2026-09-29）──');
// 旧 Liquid ゲージ（ガラスの丸窓・ラバ・セル・膜のくびれ・真珠の輪・メニスカス・毛細管の弧）はユーザー判断で全部撤去した。
// 動きの検査（止まらない・弧へはみ出さない・雫が塊へ戻る 等）は node _work/test_hub_liquid.js。

// 関数の本体（{ から対応する } まで）を切り出す（下の Frost の検査も使う）
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

t('Liquid: 旧ゲージの部品が復活していない（マークアップ・JS・CSS）', () => {
  ['gaugeLiquidCore', 'lavaCellBody', 'lavaChamber', 'liquidMembraneTear', 'liquidPearlRing', 'liquidMeniscusHead',
   'liquidFluidStream', 'liquidCapillaryGauge', 'gaugeLiquidBubbles', 'liquidCrownSplash'].forEach((id) => {
    assert.ok(!HTML.includes('id="' + id + '"'), id + ' が残っている');
  });
  ['_liqTearRender', '_liqTearArm', '_liqProgressFx', 'LIQ_TEAR_'].forEach((k) => assert.ok(!HTML.includes(k), k + ' が残っている'));
  ['lavaContainerMorph', 'lavaCellMorph', 'liquidFilmSpin', 'liquidTierSurge', 'liquidFluidMorph'].forEach((k) =>
    assert.ok(!HTML.includes('@keyframes ' + k), '@keyframes ' + k + ' が残っている'));
});

t('Liquid: canvas は .gauge-ring の直下（svg の外）にあり、数字より手前に来ない', () => {
  const i = HTML.indexOf('id="gaugeLiquidCanvas"');
  assert.ok(i > 0, 'gaugeLiquidCanvas が無い');
  const svgEnd = HTML.lastIndexOf('</svg>', i), svgOpen = HTML.lastIndexOf('<svg', i);
  assert.ok(svgEnd > svgOpen, 'canvas が svg の中にある（rotate(-90deg) と円形クリップを受けてしまう）');
  const mid = HTML.indexOf('id="gaugeMid"', i);
  assert.ok(mid > i, 'canvas が数字（#gaugeMid）より後ろにある');
});

t('Liquid: hub_liquid.js を index.js より先に読み、_driveThemeGauge は値を渡すだけ', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const a = html.indexOf('<script src="hub_liquid.js"></script>'), b = html.indexOf('<script src="index.js"></script>');
  assert.ok(a > 0 && a < b, 'hub_liquid.js の読み込みが index.js より前に無い');
  assert.ok(/MecLiquidGauge\.mount\(document\.getElementById\('gaugeLiquidCanvas'\)\)/.test(HTML), 'mount が無い');
  assert.ok(/MecLiquidGauge\.set\(pct\)/.test(HTML), 'set(pct) が無い（100% 超もそのまま渡す）');
});

t('Liquid: canvas は Liquid のときだけ出し、ゲージ全体を脈打たせない', () => {
  assert.ok(/\.liq-canvas\s*\{\s*display:\s*none;?\s*\}/.test(HTML), '既定で隠していない');
  assert.ok(/html\.ui-liquid \.liq-canvas\s*\{[^}]*display:\s*block/.test(HTML), 'Liquid で出していない');
  // 盤面ごと脈打つ鼓動は 2026-09-29 に全テーマから撤去した（ユーザー判断）
  assert.ok(!/gaugeBeat/.test(HTML.replace(/\/\*[\s\S]*?\*\//g, '')), 'ゲージ全体の鼓動（gaugeBeat）が復活している');
});

t('全テーマ: ゲージ全体を拡大縮小させて脈打たせない（鼓動・高い段の脈動は光の強弱だけ）', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.css'), 'utf8');
  ['auroraTierPulse', 'brassTierBeat', 'cyberTierGlitch', 'kintsugiMaxEnsoPulse',
   'celestialMaxMagicCirclePulse', 'abyssMaxAuroraPulse', 'frostMaxBlizzardPulse'].forEach((k) => {
    const m = ui.match(new RegExp('@keyframes ' + k + ' \\{[\\s\\S]*?\\n\\}'));
    assert.ok(m, '@keyframes ' + k + ' が無い');
    assert.ok(!/scale/.test(m[0]), k + ' がゲージを拡大縮小している');
  });
});

t('Liquid: 100% を超えても黄色にしない（数字の縁取りも含む）', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'ui_theme.css'), 'utf8');
  const m = ui.match(/html\.ui-liquid \.gauge \.gauge-mid \{[^}]*\}/);
  assert.ok(m, 'Liquid の数字の規則が無い');
  assert.ok(!/255,\s*209,\s*102|#FFD166/i.test(m[0]), '数字に金色が入っている');
  assert.ok(!/html\.ui-liquid \.gauge\[data-tier="[56]"\] \.gauge-mid/.test(ui), '高い段で数字の色を変える規則が残っている');
  const js = fs.readFileSync(path.join(__dirname, '..', 'hub_liquid.js'), 'utf8');
  assert.ok(!/PALG|gold|#FFD166|255,\s*209,\s*102|255,\s*196,\s*80/i.test(js), 'hub_liquid.js に金色が残っている');
});

t('Liquid: 演出の予定表（_liqFxLater / _liqFxPulse）は Celestial・Frost のために残っている', () => {
  assert.ok(HTML.includes('function _liqFxLater('), '_liqFxLater が無い');
  assert.ok(HTML.includes('function _liqFxPulse('), '_liqFxPulse が無い');
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





