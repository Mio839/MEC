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
    }
  ];

  function get() {
    try {
      return localStorage.getItem(KEY) || 'aurora';
    } catch (e) {
      return 'aurora';
    }
  }

  function apply(id) {
    var validId = (id === 'brass' || id === 'cyber' || id === 'liquid') ? id : 'aurora';
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
      if (MecFX.diamondSparkle) MecFX.diamondSparkle(cx, cy, { count: 18, color: '#00DFD8' });
      if (MecFX.rings) MecFX.rings(cx, cy, { count: 2, maxR: 200, color: '#0070F3', additive: true });
    } else if (id === 'brass') {
      if (MecFX.astrolabeRings) MecFX.astrolabeRings(cx, cy, { maxR: 180, color: '#E0C25E' });
      if (MecFX.gears) MecFX.gears(cx, cy, { count: 6, spread: 220, w: 20 });
    } else if (id === 'cyber') {
      if (MecFX.glitchBars) MecFX.glitchBars(cx, cy, { count: 8, color: '#00E5FF' });
      if (MecFX.defibShock) MecFX.defibShock(cx, cy, { color: '#00FF66' });
    } else if (id === 'liquid') {
      if (MecFX.irisShutter) MecFX.irisShutter(cx, cy, { maxR: 200, color: '#FF007F' });
      if (MecFX.bubbles) MecFX.bubbles(cx, cy, { count: 12, colors: ['#FF007F', '#7928CA'] });
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
