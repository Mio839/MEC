/**
 * ベース配色: 深夜のインディゴ固定（2026-08-23）
 *
 * 既定（深夜のインディゴ）はクラス無し＝vars.css の :root の値がそのまま効く。
 * 以前のテーマ設定（mec_theme_v1）をクリアし、常にインディゴを適用する。
 */
(function () {
  'use strict';

  var KEY = 'mec_theme_v1';

  // 以前のベース配色設定があればクリア
  try {
    if (localStorage.getItem(KEY)) {
      localStorage.removeItem(KEY);
    }
  } catch (e) {}

  // 既存の th-* クラスをすべて除去（深夜のインディゴ＝クラスなし）
  var el = document.documentElement;
  ['charcoal', 'forest', 'teal', 'amber', 'rose'].forEach(function (id) {
    el.classList.remove('th-' + id);
  });

  function get() { return ''; }
  function apply() {}
  function set() {}

  window.MecTheme = { list: [], get: get, set: set, apply: apply };
})();

