/**
 * ベース配色の一時プレビュー用スイッチャー（2026-07-20）
 *
 * ⚠️ これは色を決めるための仮設ツール。採用色が決まったら次の3つを消して撤去する:
 *   1. このファイル（_palette_preview.js）
 *   2. study.html / index.html / stats.html / knowledge.html の <script src="_palette_preview.js">
 *   3. vars.css の html.pal-* ブロック（採用色の値は :root のトークンへ移す）
 *   ＋ sw.js の SHELL からこのファイル名を削除
 *
 * 仕組み: html 要素に pal-* クラスを付けるだけ。実際の色は vars.css の
 * html.pal-* が :root のベーストークンを上書きして全ページへ伝播する。
 * localStorage に保存するのでページを移動しても選択が保たれる。
 */
(function () {
  'use strict';

  var KEY = 'mec_palette_preview';
  var PALETTES = [
    { id: '',           name: '現在（紺）',   sw: '#0D1B35' },
    { id: 'charcoal',   name: 'チャコール',   sw: '#17191E' },
    { id: 'forest',     name: '深緑',         sw: '#0D2018' },
    { id: 'teal',       name: 'ティール',     sw: '#0A2530' },
    { id: 'plum',       name: 'プラム',       sw: '#1F1435' },
    { id: 'warm',       name: '焦茶（暖色）', sw: '#281614' }
  ];

  function current() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  // クラス適用は head 実行時点で行う＝body描画前なので色のちらつきが出ない
  function apply(id) {
    var el = document.documentElement;
    PALETTES.forEach(function (p) { if (p.id) el.classList.remove('pal-' + p.id); });
    if (id) el.classList.add('pal-' + id);
  }

  apply(current());

  function select(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
    apply(id);
    render();
  }

  var host = null;

  function render() {
    if (!host) return;
    var cur = current();
    host.innerHTML = '';

    var bar = document.createElement('div');
    bar.className = 'palprev-bar';

    PALETTES.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'palprev-btn' + (cur === p.id ? ' sel' : '');
      b.title = p.name;
      b.innerHTML = '<span class="palprev-sw" style="background:' + p.sw + '"></span>' +
                    '<span class="palprev-nm"></span>';
      b.querySelector('.palprev-nm').textContent = p.name;
      b.addEventListener('click', function () { select(p.id); });
      bar.appendChild(b);
    });

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'palprev-close';
    close.textContent = '✕';
    close.title = 'このセッションだけ非表示（選択色は保持）';
    close.addEventListener('click', function () { host.style.display = 'none'; });
    bar.appendChild(close);

    host.appendChild(bar);
  }

  function mount() {
    if (document.getElementById('palPreview')) return;

    var css = document.createElement('style');
    css.textContent = [
      '#palPreview{position:fixed;left:8px;bottom:8px;z-index:9700;font-family:-apple-system,"Noto Sans JP",sans-serif;}',
      '.palprev-bar{display:flex;align-items:center;gap:3px;flex-wrap:wrap;max-width:min(94vw,520px);',
      '  background:rgba(8,10,16,.92);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:5px 6px;',
      '  box-shadow:0 6px 22px rgba(0,0,0,.5);}',
      '.palprev-btn{display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;cursor:pointer;',
      '  background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.14);color:rgba(255,255,255,.72);',
      '  font-size:11px;font-weight:700;font-family:inherit;white-space:nowrap;}',
      '.palprev-btn:hover{background:rgba(255,255,255,.12);}',
      '.palprev-btn.sel{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.55);color:#fff;}',
      '.palprev-sw{width:13px;height:13px;border-radius:4px;border:1px solid rgba(255,255,255,.35);flex-shrink:0;}',
      '.palprev-close{background:none;border:1px solid rgba(255,255,255,.2);border-radius:8px;color:rgba(255,255,255,.55);',
      '  font-size:11px;font-weight:700;padding:4px 7px;cursor:pointer;font-family:inherit;margin-left:2px;}',
      '.palprev-close:hover{background:rgba(255,255,255,.12);color:#fff;}',
      // 試験中は演出の邪魔になるので隠す（選択は保持される）
      'body.exam-mode #palPreview,body.ch-exam-mode #palPreview{display:none;}'
    ].join('');
    document.head.appendChild(css);

    host = document.createElement('div');
    host.id = 'palPreview';
    document.body.appendChild(host);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
