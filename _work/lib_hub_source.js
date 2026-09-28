/**
 * テストが読む「ハブの全ソース」（2026-09-28〜）。
 *
 * index.html のインライン CSS は index.css へ、インライン JS は index.js へ外出しした。
 * テストは長く index.html を1枚のファイルとして読んで関数や CSS を切り出してきたので、
 * 外出し前と同じ形（<style>…</style> と <script>…</script> を元の位置に戻したもの）を組み立てて返す。
 * ⚠️ ページが実際に読むのは theme_css/index.{テーマ}.css（index.css からの生成物）。
 *    テストは材料の index.css を見る（生成物の一致は build_theme_css.js --check が見る）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
module.exports = function hubSource() {
  const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  let html = rd('index.html');
  const cssTag = "<script>MecUITheme.css('index')</script>";
  const jsTag = '<script src="index.js"></script>';
  if (!html.includes(cssTag) || !html.includes(jsTag)) throw new Error('index.html に index.css / index.js の読み込みが無い');
  html = html.replace(cssTag, () => cssTag + '\n<style>\n' + rd('index.css') + '</style>');
  html = html.replace(jsTag, () => '<script>\n' + rd('index.js') + '</script>');
  return html;
};
