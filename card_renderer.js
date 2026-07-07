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
      '<button type="button" class="mec-err-btn" data-uid="' + esc(uid) + '" data-action="error" title="エラー報告">⚠️報告</button>' +
      '<button type="button" class="mec-flag-btn" data-uid="' + esc(uid) + '" data-action="flag" title="苦手フラグ">🚩</button>' +
      '<button type="button" class="mec-lap-btn" data-uid="' + esc(uid) + '" data-action="lap">済<span class="mec-lap-num"></span></button>' +
      '</div>';

    // Images
    let imgRow = '';
    if (q.imgs && q.imgs.length) {
      imgRow = '<div class="qimg-row">' +
        q.imgs.map(function (src) {
          return '<img loading="lazy" alt="" class="qimg" src="' + esc(src) + '"/>';
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
