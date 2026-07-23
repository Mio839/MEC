/**
 * ベース配色テーマの切替（2026-07-23）
 *
 * 仕組み: html 要素に th-* クラスを付けるだけ。実際の色は vars.css の
 * html.th-* が :root のベーストークンを上書きして全ページへ伝播する。
 * 既定（深夜のインディゴ）はクラス無し＝:root の値がそのまま効く。
 *
 * ⚠️ このファイルは <head> で同期読込すること。body 描画より前にクラスを付けないと
 *    既定色で一度描いてから切り替わり、読み込みのたびに色がちらつく。
 *
 * ⚠️ テーマを追加するときの制約（vars.css の html.th-* 冒頭コメントに詳細）:
 *    カード面（ページ地 + --glass-rgb 6%）の相対輝度を 0.0235 以下に保つこと。
 *    科目18色をこの明るさ基準で導出しているため、超えると科目色が読めなくなる。
 *    追加後は node _work/check_themes.js で検証する。
 *
 * 選択は端末ローカル（Gist同期しない）。iPadは夜・PCは昼のように
 * 端末ごとに違う雰囲気にできた方が実用的なため。
 */
(function () {
  'use strict';

  var KEY = 'mec_theme_v1';

  // sw は vars.css の html.th-* と1対1。sw は選択UIのスウォッチ色（bg-g2 相当）
  var THEMES = [
    { id: '',         name: '深夜のインディゴ', note: '鮮やかな紫紺。既定',                 sw: '#0D0541' },
    { id: 'charcoal', name: '炭',               note: '無彩色。色を主張せず問題文だけが立つ', sw: '#1B1E24' },
    { id: 'forest',   name: '深緑',             note: '落ち着いた森。長時間でも疲れにくい',   sw: '#0A251A' },
    { id: 'teal',     name: '深海',             note: 'インディゴから最も遠い寒色',           sw: '#052531' },
    { id: 'amber',    name: '琥珀の書斎',       note: '暖色。夜に紙の本を読む雰囲気',         sw: '#301715' },
    { id: 'rose',     name: '薔薇',             note: '柔らかいローズ。彩度は抑えてある',     sw: '#39182C' }
  ];

  function get() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  function apply(id) {
    var el = document.documentElement;
    THEMES.forEach(function (t) { if (t.id) el.classList.remove('th-' + t.id); });
    if (id) el.classList.add('th-' + id);
  }

  function set(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
    apply(id);
    // 同一タブ内の購読者（ハブの選択UI等）へ通知。storage イベントは他タブにしか飛ばない
    try { document.dispatchEvent(new CustomEvent('mecThemeChange', { detail: { id: id } })); } catch (e) {}
  }

  // head 実行時点で当てる＝body描画前なのでちらつかない
  apply(get());

  window.MecTheme = { list: THEMES, get: get, set: set, apply: apply };
})();
