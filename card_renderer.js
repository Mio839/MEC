// card_renderer.js — renders questions_*.json → HTML string for study.html
// Produces the same DOM structure as cards_*.js / cards_*.html

(function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCard(q) {
    const uid = q.uid;
    const rateAttr = q.rate >= 0 ? ' data-rate="' + q.rate + '"' : '';
    const idVal = uid.replace(/^.*_ch\d+_/, '');  // endo_ch01_q1 → q1, jinzo_d_ch01_q1 → q1

    // Header: qn, episode, badges, rate
    let qhInner = '<span class="qn">' + esc(q.qn) + '</span>';
    if (q.episode) qhInner += '<span class="qe">' + esc(q.episode) + '</span>';
    q.badges.forEach(function (b) {
      qhInner += '<span class="bg ' + esc(b.cls) + '">' + esc(b.t) + '</span>';
    });
    if (q.rate_cls && q.rate_text) {
      qhInner += '<span class="cr ' + esc(q.rate_cls) + '">' + esc(q.rate_text) + '</span>';
    }
    qhInner +=
      '<div class="mec-controls">' +
      '<button type="button" class="mec-err-btn" data-uid="' + esc(uid) + '" data-action="error" title="エラー報告" aria-label="この問題のエラーを報告">⚠️報告</button>' +
      '<button type="button" class="mec-flag-btn" data-uid="' + esc(uid) + '" data-action="flag" title="苦手フラグ" aria-label="苦手フラグ" aria-pressed="false">🚩</button>' +
      // 自己採点（× あやふや ○）。旧「済」ボタンは ○ に相当し、class も data-action も
      // そのまま残してある — study_exam.js / progress.js / selfcheck_intro.html /
      // キーボードショートカット(btn.click())が .mec-lap-btn を掴んでいるため、
      // ここを別クラスに変えると周回数の表示と試験後の同期が黙って壊れる。
      // 3つとも data-action="lap" で、違いは data-grade だけ（既定は ok）。
      '<div class="mec-grade" role="group" aria-label="自己採点して次へ">' +
      '<button type="button" class="mec-grade-btn g-ng" data-uid="' + esc(uid) + '" data-action="lap" data-grade="ng" title="わからなかった（明日また出す）" aria-label="わからなかった">×</button>' +
      '<button type="button" class="mec-grade-btn g-mid" data-uid="' + esc(uid) + '" data-action="lap" data-grade="mid" title="あやふや（間隔を控えめに伸ばす）" aria-label="あやふや">△</button>' +
      '<button type="button" class="mec-lap-btn" data-uid="' + esc(uid) + '" data-action="lap" data-grade="ok" title="余裕だった（間隔を伸ばす）" aria-label="余裕だった">○<span class="mec-lap-num"></span></button>' +
      '</div>' +
      '</div>';

    // Images
    // width/height は必ず出すこと。無いと loading="lazy" の画像はデコードまで高さ0で、
    // デコード後に最大220pxへ跳ねる＝画像問題が並ぶ科目でスクロール位置が後からズレ続ける
    // （章ジャンプが目標に収束しなかった原因）。属性があればブラウザが aspect-ratio を
    // 先に確定させ、デコード前から正しい高さの箱を確保する。
    // 実寸の出所は image_dims.json（_work/build_image_dims.py が生成する派生物）。
    // 未ロード・未知パスのときは属性を省くだけで、表示自体は従来どおり成立する。
    let imgRow = '';
    if (q.imgs && q.imgs.length) {
      const dims = (typeof window !== 'undefined' && window.MEC_IMG_DIMS) || null;
      imgRow = '<div class="qimg-row">' +
        q.imgs.map(function (src) {
          const d = dims && dims[src];
          const size = (d && d.length === 2)
            ? ' width="' + d[0] + '" height="' + d[1] + '"'
            : '';
          return '<img loading="lazy" decoding="async"' + size +
                 ' alt="" class="qimg" src="' + esc(src) + '"/>';
        }).join('') +
        '</div>';
    }

    // Choices
    const choices = q.choices.map(function (c) {
      return '<div class="ch2' + (c.ok ? ' ok' : '') + '">' + esc(c.t) + '</div>';
    }).join('');

    // Explanation blocks
    const egBlocks = (q.eg || []).map(function (eb) {
      return '<div class="eb ' + esc(eb.cls) + '"><h4>' + esc(eb.h) + '</h4>' + eb.c + '</div>';
    }).join('');

    return (
      '<div class="qc"' + rateAttr + ' data-uid="' + esc(uid) + '" id="' + esc(idVal) + '">' +
        '<div class="qh">' + qhInner + '</div>' +
        '<div class="qb">' +
          '<div class="qt">' + q.qt + '</div>' +
          imgRow +
          '<div class="cs">' + choices + '</div>' +
          '<div class="ab">' +
            '<span class="ai">✅</span>' +
            '<div>' +
              '<div class="ac">' + esc(q.ans_label) + '</div>' +
              '<div class="as">' + esc(q.ans_sub) + '</div>' +
            '</div>' +
          '</div>' +
          (egBlocks ? '<div class="eg">' + egBlocks + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderSubject(data) {
    const parts = [];
    data.chapters.forEach(function (ch) {
      parts.push('<div class="ch-divider">' + esc(ch.title) + '</div>');
      ch.qs.forEach(function (q) {
        parts.push(renderCard(q));
      });
    });
    return parts.join('\n');
  }

  // Replaces _fetchSubjectCards for JSON-based loading.
  // Called from study.html after this file is loaded.
  window._renderSubjectFromJson = renderSubject;
  // 単一問題のカードHTMLを描画（SRS復習でdueカードだけを起こす用途）。
  window._renderCardFromJson = renderCard;
})();
