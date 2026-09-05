/**
 * MEC UIテーマセット（着せ替えスキン）マネージャー
 * 4つの洗練された世界観を1タップで切り替え可能
 */
(function () {
  'use strict';

  var KEY = 'mec_ui_theme_v1';

  var UI_THEMES = [
    {
      id: 'aurora',
      name: '🌟 オーロラ・グラス',
      enName: 'Aurora Glass',
      desc: '虹色屈折ガラス ＆ オーロラネオン背景。Appleライクな極上の透明感',
      accent: '#00E5FF',
      colors: ['#7928CA', '#0070F3', '#00DFD8']
    },
    {
      id: 'brass',
      name: '🕰️ 真鍮クロックワーク',
      enName: 'Steampunk Brass',
      desc: 'スケルトン時計歯車 ＆ 3Dゴールド箔押し。重厚な精密機械工芸美',
      accent: '#E0C25E',
      colors: ['#C9A227', '#E0C25E', '#8C6D1F']
    },
    {
      id: 'cyber',
      name: '🚀 サイバー・ホログラム',
      enName: 'Cyber Hologram HUD',
      desc: '3Dネオングリッド ＆ 照準スコープ。SF戦闘機コックピットの疾走感',
      accent: '#00FF66',
      colors: ['#00E5FF', '#76FF03', '#D500F9']
    },
    {
      id: 'liquid',
      name: '🌸 幻想リキッド・アート',
      enName: 'Liquid Art',
      desc: '蛍光流体インク ＆ 幻想グラデーション。現代アートのような有機的快感',
      accent: '#FF007F',
      colors: ['#FF007F', '#7928CA', '#FF7A00']
    },
    {
      id: 'kintsugi',
      name: '🌑 漆黒金継ぎ・禅',
      enName: 'Kintsugi Zen',
      desc: '漆黒 ＆ 黄金の金継ぎクラック。和の静寂と極限の集中美',
      accent: '#F5D061',
      colors: ['#F5D061', '#D9383A', '#1E2028']
    },
    {
      id: 'celestial',
      name: '🌌 賢者の星図・魔導書',
      enName: 'Celestial Grimoire',
      desc: '深遠な夜空 ＆ 天球儀・幾何学星図。知の探求者たる古代魔導学',
      accent: '#FFD166',
      colors: ['#FFD166', '#8A2BE2', '#48CAE4']
    },
    {
      id: 'abyss',
      name: '🌊 深海アビス・発光生物',
      enName: 'Abyss Bioluminescence',
      desc: '深海ブラック ＆ 生体発光エメラルド。超集中へ沈潜するディープオーシャン',
      accent: '#00FFA3',
      colors: ['#00FFA3', '#00B4D8', '#030914']
    },
    {
      id: 'frost',
      name: '❄️ 絶対零度・フロスト氷晶',
      enName: 'Glacial Absolute Zero',
      desc: '氷河フロスト ＆ 多面体クリスタル。冷徹な思考力を研ぎ澄ます絶対零度',
      accent: '#70D6FF',
      colors: ['#70D6FF', '#FFFFFF', '#0A1D33']
    }
  ];

  var VALID_IDS = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost'];

  function get() {
    try {
      var saved = localStorage.getItem(KEY);
      return (VALID_IDS.indexOf(saved) >= 0) ? saved : 'aurora';
    } catch (e) {
      return 'aurora';
    }
  }

  function apply(id) {
    var validId = (VALID_IDS.indexOf(id) >= 0) ? id : 'aurora';
    var el = document.documentElement;
    UI_THEMES.forEach(function (t) {
      el.classList.remove('ui-' + t.id);
    });
    el.classList.add('ui-' + validId);
  }

  function triggerThemeChangeFx(id) {
    if (!window.MecFX) return;
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    if (id === 'aurora') {
      if (MecFX.diamondSparkle) MecFX.diamondSparkle(cx, cy, { count: 36, colors: ['#00DFD8', '#FFFDF0', '#7928CA', '#FF0080'], additive: true });
      if (MecFX.dust) MecFX.dust({ count: 30, colors: ['#00DFD8', '#7928CA', '#FF0080', '#FFFFFF'] });
      if (MecFX.slashRibbon) {
        MecFX.slashRibbon(cx - 200, cy - 60, cx + 200, cy + 60, { color: '#00DFD8', width: 4.2 });
        MecFX.slashRibbon(cx + 180, cy - 70, cx - 180, cy + 70, { color: '#7928CA', width: 3.5, delay: 0.05 });
      }
      if (MecFX.stars) MecFX.stars(cx, cy, { count: 20, colors: ['#00DFD8', '#7928CA', '#FF0080'] });
      if (MecFX.burst) MecFX.burst(cx, cy, { count: 28, colors: ['#00DFD8', '#7928CA', '#FFFFFF'], shapes: ['gem', 'star'], speed: 400, glow: true });
    } else if (id === 'brass') {
      if (MecFX.irisShutter) MecFX.irisShutter(cx, cy, { maxR: 220, blades: 12, color: '#FFD700', thickness: 3 });
      if (MecFX.gears) MecFX.gears(cx, cy, { count: 12, spread: 280, w: 24 });
      if (MecFX.steam) MecFX.steam(cx, cy, { count: 8, w: 60, rise: 120, alpha: 0.35 });
      if (MecFX.sparkFountain) MecFX.sparkFountain(cx, cy, { count: 18, color: '#E0C25E' });
    } else if (id === 'cyber') {
      if (MecFX.glitchBars) MecFX.glitchBars(cx, cy, { count: 16, color: '#00E5FF' });
      if (MecFX.defibShock) MecFX.defibShock(cx, cy, { color: '#00FF66' });
      if (MecFX.diamondSparkle) MecFX.diamondSparkle(cx, cy, { count: 24, colors: ['#00E5FF', '#00FF9D'], additive: true });
      if (MecFX.pixelPop) MecFX.pixelPop(cx, cy, { count: 28, colors: ['#00E5FF', '#00FF9D', '#FFFFFF'] });
    } else if (id === 'liquid') {
      if (MecFX.irisShutter) MecFX.irisShutter(cx, cy, { maxR: 240, color: '#FF007F' });
      if (MecFX.bubbles) MecFX.bubbles(cx, cy, { count: 18, colors: ['#FF007F', '#7928CA', '#FF7A00'] });
      if (MecFX.rings) MecFX.rings(cx, cy, { count: 2, maxR: 220, color: '#FF007F', additive: true });
    } else if (id === 'kintsugi') {
      if (MecFX.kintsugiCrack) MecFX.kintsugiCrack(cx, cy, { maxR: 240 });
      else if (MecFX.sparks) MecFX.sparks(cx, cy, { count: 20, colors: ['#F5D061', '#D9383A', '#FFFFFF'] });
    } else if (id === 'celestial') {
      if (MecFX.diamondSparkle) MecFX.diamondSparkle(cx, cy, { count: 36, colors: ['#FFD166', '#FFFDF0', '#8A2BE2'], additive: true });
      if (MecFX.stars) MecFX.stars(cx, cy, { count: 20, colors: ['#FFD166', '#8A2BE2', '#48CAE4'] });
      if (MecFX.dust) MecFX.dust({ count: 28, colors: ['#FFD166', '#8A2BE2', '#48CAE4', '#FFFDF0'] });
      if (MecFX.burst) MecFX.burst(cx, cy, { count: 24, colors: ['#FFFDF0', '#FFD166', '#8A2BE2'], shapes: ['star', 'gem'], speed: 380, glow: true });
    } else if (id === 'abyss') {
      if (MecFX.abyssSonarPulse) MecFX.abyssSonarPulse(cx, cy, { maxR: 240 });
      else if (MecFX.rippleInterference) MecFX.rippleInterference(cx, cy, { maxR: 240, color: '#00FFA3' });
    } else if (id === 'frost') {
      if (MecFX.frostCrystalShatter) MecFX.frostCrystalShatter(cx, cy, { maxR: 220 });
      else if (MecFX.shatter) MecFX.shatter(cx, cy, { count: 24, colors: ['#70D6FF', '#FFFFFF', '#A0E7E5'] });
    }
  }

  function set(id) {
    try {
      localStorage.setItem(KEY, id);
    } catch (e) {}
    apply(id);
    try {
      triggerThemeChangeFx(id);
    } catch (e) {}
    try {
      document.dispatchEvent(new CustomEvent('mecUIThemeChange', { detail: { id: id } }));
    } catch (e) {}
  }

  // 即時適用（ちらつき防止）
  apply(get());

  window.MecUITheme = {
    list: UI_THEMES,
    get: get,
    set: set,
    apply: apply,
    triggerFx: triggerThemeChangeFx
  };
})();
