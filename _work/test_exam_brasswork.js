/**
 * Phase 7「スチームパンクの語彙を筐体の外へ広げる」の規約を実ソースで検証する。
 * Run: node _work/test_exam_brasswork.js
 *
 * 背景（2026-08-21・設計 §12）:
 *   Phase 4 が筐体（真鍮固定）を、Phase 5 が読書中の演出を作った。Phase 7 はその語彙を
 *   筐体の外——カードの左端・選択肢・結果画面・起動画面・画面の縁——へ広げる。
 *
 *     段A S6 押した手応え ／ S5 傷 → 真鍮の補強プレート
 *     段B S10 結果画面を計器盤にする
 *     段C S8 蒸気ブート ／ S9 レールを管の断面にする
 *     段D S11 炉のヴィネット
 *     段E S4 軸光 ／ S1+S1' 排圧計 ／ S12 ヘッダの管 ／ S13 トーストの打撃
 *
 * ⚠️ ここで守りたい設計上の決定:
 *   ① transform は既存アニメに殺される＝沈み込みは translate / 回転は rotate / 拡大は scale。
 *   ② 水平の「線」を1本も作らない（下線部が選択肢そのものになる設問が実在する）。
 *   ③ 箱の外へ出る要素・width/height/transform を作らない（iOS の縮尺振動の再発防止）。
 *   ④ 筐体で常時動けるのは .exam-idle-lit に連動するものだけ。
 *   ⑤ exitExam で全部落とす／reduced-motion で動きだけ止め意匠は残す。
 *   ⑥ vars.css / index.html / gamify.js / chapter_exam.js には1行も触れない。
 *
 * ブラウザも jsdom も使わない。実ソースを読んで正規表現だけで検査する。
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const CSS  = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const JS   = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}

// ⚠️ コメントを先に落とすこと。注意書きに実例のコード片が書いてあり、拾うと誤検出になる。
const CSS_NC = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const JS_NC  = JS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function stripAtBlocks(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const at = css.indexOf('@keyframes', i);
    if (at < 0) { out += css.slice(i); break; }
    out += css.slice(i, at);
    let j = css.indexOf('{', at), depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) { j++; break; } }
    }
    i = j;
  }
  return out;
}
function mediaBlocks(css, needle) {
  const out = [];
  const re = new RegExp('@media[^{]*' + needle + '[^{]*\\{', 'g');
  let m;
  while ((m = re.exec(css))) {
    let j = m.index + m[0].length - 1, depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) break; }
    }
    out.push(css.slice(m.index + m[0].length, j));
  }
  return out;
}
function stripMedia(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) { out += css.slice(i); break; }
    out += css.slice(i, at);
    let j = css.indexOf('{', at), depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) { j++; break; } }
    }
    i = j;
  }
  return out;
}
const FLAT = stripMedia(stripAtBlocks(CSS_NC));
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith('@')) continue;
    out.push({ sel, body: m[2] });
  }
  return out;
}
const RULES = rules(FLAT);
function ruleFor(re) { return RULES.filter(r => re.test(r.sel)); }
function fnBody(name) {
  const i = JS.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let j = JS.indexOf('{', i), depth = 0;
  for (; j < JS.length; j++) {
    if (JS[j] === '{') depth++;
    else if (JS[j] === '}') { depth--; if (!depth) return JS.slice(i, j + 1); }
  }
  return null;
}
/** 「縦オフセットがあるのに blur が 0」＝水平の線を引いている box-shadow を探す（§11-6-3'）。
    ⚠️ カンマは括弧の外だけで割ること。rgba(...) / color-mix(...) の中にもカンマがあるので、
       素の split(',') だと 1 つの影が複数の層に割れて誤検出になる（実際に踏んだ）。
    ⚠️ 長さの抽出では単位なしの 0 も拾うこと。`0 4px 14px rgba(...)` を px だけで拾うと
       dy=14 / blur=無し と読み違える。 */
function splitTopLevel(str) {
  const out = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}
function stripParens(str) {
  let prev; do { prev = str; str = str.replace(/\([^()]*\)/g, ' '); } while (str !== prev);
  return str;
}
function hardLineShadows(body) {
  const bad = [];
  const m = /box-shadow\s*:([^;]+);/g;
  let x;
  while ((x = m.exec(body))) {
    const decl = x[1];
    if (/\binset\b/.test(decl)) { bad.push('inset: ' + decl.trim()); continue; }
    splitTopLevel(decl).forEach(layer => {
      const clean = stripParens(layer).replace(/#[0-9a-fA-F]{3,8}/g, ' ');
      const nums = clean.match(/-?\d*\.?\d+(?:px)?/g);
      if (!nums || nums.length < 2) return;
      const dy = parseFloat(nums[1]);
      const blur = nums.length >= 3 ? parseFloat(nums[2]) : 0;
      if (dy !== 0 && blur === 0) bad.push(layer.trim());
    });
  }
  return bad;
}

// ══ 段A: S6 押した手応え ════════════════════════════════════════════════
t('1. S6 の沈み込みが translate プロパティで書かれている（transform だと examKeycapUp に殺される）', () => {
  const rs = ruleFor(/\.ch2:active/);
  assert.ok(rs.length, '.ch2:active の規則が無い（押下フィードバックが存在しない）');
  const sink = rs.filter(r => /translate\s*:/.test(r.body));
  assert.ok(sink.length, '.ch2:active に translate プロパティが無い');
  rs.forEach(r => {
    assert.ok(!/[^-]transform\s*:/.test(r.body),
      '.ch2:active が transform を使っている（R6 の examKeycapUp が both で transform を保持し続けるので黙って死ぬ）: ' + r.sel);
  });
});

t('2. S6 が水平の線を作らない（縦オフセットがあるのに blur が 0 の層・inset を禁じる）', () => {
  ruleFor(/\.ch2:active/).forEach(r => {
    const bad = hardLineShadows(r.body);
    assert.ok(!bad.length, r.sel + ' が硬い線を引いている: ' + bad.join(' / '));
  });
});

t('3. S6 が .ch2 の padding / margin を変えていない', () => {
  ruleFor(/\.ch2:active/).forEach(r => {
    assert.ok(!/(^|;|\s)(padding|margin)[-a-z]*\s*:/.test(r.body),
      r.sel + ' が padding/margin を触っている（負マージンで詰めてあり .exam-selected の当たりがずれる）');
  });
});

// ══ 段A: S5 補強プレート ═══════════════════════════════════════════════
t('4. S5 のプレートが .exam-scar::before のまま（::after へ移していない＝data-recap と衝突しない）', () => {
  assert.ok(/\.qc\.exam-scar[^{,]*::before/.test(CSS_NC), '.qc.exam-scar::before が無い');
  assert.ok(!/\.qc\.exam-scar[^{,]*::after/.test(CSS_NC),
    '.exam-scar が ::after を使っている（B5 の data-recap と exam-multi-correct が使っている層）');
});

t('5. S5 が赤（リベット）を残している（真鍮一色にしていない）', () => {
  const rs = ruleFor(/\.qc\.exam-scar::before/);
  assert.ok(rs.length, '.qc.exam-scar::before の規則が無い');
  const body = rs.map(r => r.body).join('');
  assert.ok(/--exam-plate-rivet/.test(body), 'リベットの層が無い');
  assert.ok(/--exam-plate-red/.test(body), '赤の層が無い（真鍮一色だと通過済みカードの中で埋もれる）');
  // トークン名だけ真似て中身が真鍮になっていないか、実体まで見る
  const rivet = /--exam-plate-rivet\s*:([^;]+);/.exec(CSS_NC);
  const red   = /--exam-plate-red\s*:([^;]+);/.exec(CSS_NC);
  assert.ok(rivet && /#F2A07B|rgba\(176,\s*58,\s*40/i.test(rivet[1]), 'リベットが銅赤になっていない');
  assert.ok(red && /255,\s*107,\s*107/.test(red[1]), '赤の層が赤でない');
});

t('6. S5 の幅が R5 のクランプと同値（カード左端の語彙が幅で読み分けられる）', () => {
  const clamp = ruleFor(/exam-key-focus:not\(\.exam-revealed\)::before/);
  const plate = ruleFor(/\.qc\.exam-scar::before/);
  assert.ok(clamp.length && plate.length, 'クランプまたはプレートの規則が無い');
  const w = b => (/width\s*:\s*(\d+)px/.exec(b) || [])[1];
  assert.strictEqual(w(plate[0].body), w(clamp[0].body),
    'プレートとクランプの幅が違う（3px ではリベットの頭が潰れて点にならない）');
  assert.strictEqual(w(plate[0].body), '5', 'プレートの幅が 5px でない');
});

t('7. S5 の克服光が _afterCorrectFx にある（正解の2経路の合流点。片方だけだと計算問題で抜ける）', () => {
  const b = fnBody('_afterCorrectFx');
  assert.ok(b, '_afterCorrectFx が見つからない');
  assert.ok(/_polishPlate\s*\(/.test(b), '_afterCorrectFx から _polishPlate を呼んでいない');
  ['revealAnswer', '_revealCalcAnswer'].forEach(fn => {
    const s = fnBody(fn);
    if (!s) return;
    assert.ok(!/_polishPlate\s*\(/.test(s), fn + ' が _polishPlate を直接呼んでいる（合流点を通すこと）');
  });
  const p = fnBody('_polishPlate');
  assert.ok(p, '_polishPlate が見つからない');
  assert.ok(/_fxOff\(\)/.test(p), '_polishPlate が reduced-motion を尊重していない');
  assert.ok(/classList\.remove\('exam-plate-fix'\)/.test(p),
    '克服光の当て板を消していない（残ると exam-scar と同じ絵が並んで見分けられなくなる）');
});

// ══ 段B: S10 結果画面を計器盤にする ════════════════════════════════════
t('19. S10 が .gm- で始まるセレクタを1つも書いていない（gamify.js 注入＝ハブと共有の CSS を上書きしない）', () => {
  RULES.forEach(r => {
    assert.ok(!/(^|[\s,>+~])\.gm-/.test(r.sel),
      'study.css が .gm-* を上書きしている → ' + r.sel.trim() +
      '（gamify.js が注入する CSS はハブ index.html と共有＝ハブの見た目が黙って動く）');
  });
});

t('20. S10 のボタンの沈み込みが translate プロパティで書かれている（transform は殺される）', () => {
  const btns = ['.exam-review-btn', '.exam-retry-btn', '.exam-close-btn', '.exam-fresh-btn'];
  btns.forEach(b => {
    const rs = RULES.filter(r => r.sel.split(',').some(x => x.trim().startsWith(b) && x.includes(':active')));
    assert.ok(rs.length, b + ':active の規則が無い（押しても沈まない）');
    assert.ok(rs.some(r => /translate\s*:/.test(r.body)),
      b + ':active に translate プロパティが無い（:hover の transform と :active の scale が潰し合う）');
  });
});

t('21. S10 が水平の「線」を作らない（縦オフセットがあるのに blur が 0 の層・inset を禁じる）', () => {
  const sels = ['.exam-detail-item', '.exam-review-btn', '.exam-retry-btn', '.exam-close-btn', '.exam-fresh-btn'];
  RULES.forEach(r => {
    if (!sels.some(x => r.sel.includes(x))) return;
    const bad = hardLineShadows(r.body);
    assert.ok(!bad.length, r.sel.trim() + ' が硬い線を引いている: ' + bad.join(' / '));
  });
});

t('22. S10 の管の点灯がカウントアップの完了後に一度だけで、常時フリッカーが無い', () => {
  const b = fnBody('showExamSummary');
  assert.ok(b, 'showExamSummary が見つからない');
  assert.ok(/tubes-lit/.test(b), '点灯クラス tubes-lit を付けていない');
  assert.ok(/classList\.remove\('tubes-lit'\)/.test(b),
    '前回の点灯を消していない（次のセッションで「ともる瞬間」が無くなる）');
  assert.ok(/else\s+_litTubes\(\)/.test(b),
    'カウントアップの完了で点灯していない（k<1 の else に置くこと）');
  assert.ok(/setTimeout\(_litTubes/.test(b),
    'rAF が止まった時の落とし所が無い（非表示タブでは管が永久に点かない）');
  // 常時フリッカー＝tubes-lit 系に infinite の animation が無いこと
  RULES.forEach(r => {
    if (!/tubes-lit/.test(r.sel)) return;
    assert.ok(!/infinite/.test(r.body), '結果画面の管が常時フリッカーしている → ' + r.sel.trim());
  });
});

t('S10-a. タイルとボタンの「面の色（意味）」が残っている（琥珀一色にしていない）', () => {
  // 4タイルの数字は緑/赤/青/紫のまま＝正解・不正解・回答・時間が見分けられる
  [['di-ok', '#7CEFB2'], ['di-ng', '#FF9B9B'], ['di-n', '#A8CDFF'], ['di-t', '#C9B8FF']].forEach(([k, col]) => {
    const rs = RULES.filter(r => r.sel.includes(k) && /\.val/.test(r.sel));
    assert.ok(rs.some(r => r.body.toUpperCase().includes(col.toUpperCase())),
      k + ' の数字が意味色 ' + col + ' でなくなっている（4つの数字が見分けられなくなる）');
  });
});

t('S10-b. タイルのリベットが --exam-rivet-dot を借りている（額縁の鋲と別物を作らない）', () => {
  const rs = ruleFor(/\.exam-detail-item::before/);
  assert.ok(rs.length, '.exam-detail-item::before が無い');
  assert.ok(/--exam-rivet-dot/.test(rs[0].body),
    'タイルのリベットが --exam-rivet-dot を使っていない（モーダルの額縁の鋲と絵が食い違う）');
  // ⚠️ ::before は位置指定ボックス＝素のテキストより上に描かれる。ラベルと数字を持ち上げること
  const lift = RULES.filter(r => /\.exam-detail-item .*\.(lbl|val)/.test(r.sel) && /position\s*:\s*relative/.test(r.body));
  assert.ok(lift.length, 'ラベル/数字が position:relative で持ち上げられていない（窪みの下に隠れる）');
});

// ══ 段C: S8 蒸気ブート ／ S9 レールを管の断面に ═══════════════════════
t('8. S8 が EXAM_BOOT_STYLES に足され、_examBootLines と _examRematchLines の両方に分岐がある', () => {
  const m = /const EXAM_BOOT_STYLES\s*=\s*\[([^\]]+)\]/.exec(JS_NC);
  assert.ok(m, 'EXAM_BOOT_STYLES が見つからない');
  assert.ok(/'steam'/.test(m[1]), "EXAM_BOOT_STYLES に 'steam' が無い（入口だけサイバーのまま）");
  ['_examBootLines', '_examRematchLines'].forEach(fn => {
    const b = fnBody(fn);
    assert.ok(b, fn + ' が見つからない');
    assert.ok(/style === 'steam'/.test(b),
      fn + " に steam の分岐が無い（片方だけだとリマッチか通常のどちらかがサイバーに戻る）");
  });
});

t('9. S8 が出題数・科目名の情報を落としていない（ブートログは実用を兼ねている）', () => {
  const b = fnBody('_examBootLines');
  const i = b.indexOf("style === 'steam'");
  const seg = b.slice(i, b.indexOf('return [', i) + 400);
  assert.ok(/\+\s*qn\b/.test(seg), 'steam のブートログに出題数(qn)が出ていない');
  assert.ok(/subjLabel/.test(seg), 'steam のブートログに科目名(subjLabel)が出ていない');
  // リマッチ側は科目ではなく「前回の誤答 N 問」を出す＝こちらは qn だけでよい
  assert.ok(/\+\s*qn\b/.test(fnBody('_examRematchLines')), 'リマッチの steam に問題数が出ていない');
});

t('S8-a. 起動の尺を1msも増やしていない（3様式とも同じ _cdEnd を返す）', () => {
  const b = fnBody('_examCountdown');
  assert.ok(b, '_examCountdown が見つからない');
  // 様式ごとに at() の時刻や return 値を分岐させていないこと
  assert.ok(!/style\s*===\s*'steam'\s*\?\s*\d/.test(b),
    'steam だけ時刻を変えている（起動演出は待ち時間＝2回目から邪魔になる）');
  const rets = b.match(/return\s+t0\s*\+[^;]+;/g) || [];
  assert.strictEqual(rets.length, 1, '_examCountdown の戻り値（尺）が様式で分岐している');
});

t('S8-b. 歯車は .ep-gear を複製している（path を書き写して2本目の実装を作らない）', () => {
  const b = fnBody('_examCountdown');
  assert.ok(/querySelector\('\.ep-gear'\)/.test(b) && /cloneNode\(true\)/.test(b),
    '起動画面の歯車が .ep-gear の複製になっていない');
  // study.css 側に歯車の path を直書きしていないこと
  // ⚠️ CSS_NC（コメント除去済み）で見ること。注意書きに fill-rule:evenodd と書いてある。
  assert.ok(!/fill-rule\s*:\s*evenodd/.test(CSS_NC), 'study.css に歯車の輪郭が書き写されている');
});

t('10. S9 のレールが明線と暗線の対になっている（--exam-bevel-hi と --exam-bevel-lo の両方を使う）', () => {
  const rs = ruleFor(/\.st-hdr::before/);
  assert.ok(rs.length, '.st-hdr::before が無い');
  const body = rs.map(r => r.body).join('');
  assert.ok(/height\s*:\s*2px/.test(body), 'レールが 2px になっていない（1px の平線のままでは管に見えない）');
  assert.ok(/--exam-bevel-lo/.test(body), 'レールに暗側が無い（明線だけでは「地が少し明るい帯」にしかならない）');
  assert.ok(/--exam-brass/.test(body), 'レールに真鍮の明側が無い');
});

t('11. S9 の稼働灯（::after）が 1px のままである（太くすると光が帯になり流体に見えない）', () => {
  const rs = ruleFor(/\.st-hdr::after/);
  assert.ok(rs.length, '.st-hdr::after が無い');
  const h = /height\s*:\s*(\d+)px/.exec(rs[0].body);
  assert.ok(h, '稼働灯の height が読めない');
  assert.strictEqual(h[1], '1', '稼働灯が 1px でなくなっている');
});

// ══ 段D: S11 炉のヴィネット ══════════════════════════════════════════
/** S11 の2層＝**body 自身の**疑似要素だけを拾う。
    ⚠️ 子孫セレクタ（body.exam-mode .st-hdr::after ＝ D9 の稼働灯、
       body.exam-mode .qc...::before ＝ R5 のクランプ）を巻き込まないこと。
       巻き込むと稼働灯の opacity:0 を熾火の値として読むなど、全部が誤検出になる。 */
function forgeRules() {
  // §13-3 P4 以降、稜線は body.exam-mode::before ではなく専用レイヤー #examChrome にある
  // （テーマの html.ui-* body::before に z-index を奪われるため）。熾火は ::after のまま。
  return RULES.filter(r => r.sel.split(',').some(one =>
    /^body\.exam-mode[A-Za-z0-9_.-]*(::(before|after)|\s+#examChrome)$/.test(one.trim())));
}

t('23. S11 が exam-mode 前提で書かれている（body::before ではない）', () => {
  const rs = forgeRules();
  assert.ok(rs.length >= 2, 'S11 の2層（縁と熾火）が見つからない');
  assert.ok(rs.some(r => /#examChrome/.test(r.sel)), '縁（#examChrome）が無い');
  assert.ok(rs.some(r => /::after/.test(r.sel)), '熾火（::after）が無い');
  // ⚠️ body::before / body::after（exam-mode 抜き）を書くと通常閲覧へ持ち越す
  RULES.forEach(r => {
    r.sel.split(',').forEach(one => {
      const x = one.trim();
      assert.ok(!/^body::(before|after)$/.test(x),
        'body::before / body::after を素で書いている → ' + x + '（通常閲覧に縁が残る）');
    });
  });
});

t('24. S11 が width / height / transform を1つも使っていない（iOS の縮尺振動の再発防止）', () => {
  forgeRules().forEach(r => {
    ['width', 'height', 'transform'].forEach(prop => {
      const re = new RegExp('(^|;|\\s)' + prop + '\\s*:');
      assert.ok(!re.test(r.body),
        r.sel.trim() + ' が ' + prop + ' を使っている（2026-08-19 にページの縮尺が1.4秒周期で振動した面）');
    });
  });
});

t('25. S11 の呼吸が .exam-idle-lit に連動している（フリーランのアニメを作らない）', () => {
  const animated = forgeRules().filter(r => /(^|;|\s)animation\s*:/.test(r.body));
  assert.ok(animated.length >= 1, '熾火の呼吸が無い');
  animated.forEach(r => {
    assert.ok(/\.exam-idle-lit/.test(r.sel),
      '縁が稼働灯の状態と無関係に動いている → ' + r.sel.trim() +
      '（筐体で常時動けるのは .exam-idle-lit に連動するものだけ・§5-6）');
  });
  // 連動していない素の ::after に infinite が無いこと
  forgeRules().filter(r => !/\.exam-idle-lit/.test(r.sel)).forEach(r => {
    assert.ok(!/infinite/.test(r.body), '素の縁に常時アニメがある → ' + r.sel.trim());
  });
});

t('26. S11 の熾火のピーク不透明度が 0.06 以下・到達距離が 8vmin 以下', () => {
  const after = forgeRules().filter(r => /::after/.test(r.sel));
  assert.ok(after.length, '熾火の規則が無い');
  const body = after.map(r => r.body).join('');
  // 到達距離
  const radii = (body.match(/circle\s+([\d.]+)vmin/g) || []).map(x => parseFloat(/([\d.]+)/.exec(x)[1]));
  assert.ok(radii.length, '熾火の到達距離（circle Nvmin）が読めない');
  radii.forEach(v => assert.ok(v <= 8, '熾火の到達距離が 8vmin を超えている: ' + v + 'vmin'));
  // ピーク不透明度（素の opacity と keyframes の両方）
  const peaks = [];
  const base = /(^|;|\s)opacity\s*:\s*([\d.]+)/.exec(body);
  if (base) peaks.push(parseFloat(base[2]));
  const kf = /@keyframes\s+examForgeBreath\s*\{([\s\S]*?)\}\s*\n/.exec(CSS_NC);
  assert.ok(kf, 'examForgeBreath の keyframes が無い');
  (kf[1].match(/opacity\s*:\s*([\d.]+)/g) || []).forEach(x => peaks.push(parseFloat(/([\d.]+)/.exec(x)[1])));
  assert.ok(peaks.length >= 2, '熾火の不透明度が読めない');
  const hi = Math.max(...peaks), lo = Math.min(...peaks);
  assert.ok(hi <= 0.06, '熾火のピーク不透明度が 0.06 を超えている: ' + hi);
  // 振幅はピークの ±50% 以内
  assert.ok((hi - lo) <= hi * 0.5 + 1e-9,
    '呼吸の振幅がピークの50%を超えている（' + lo + '→' + hi + '）＝カード面のコントラストが動く');
});

t('27. S11 の z-index が --z-hdr より上・モーダル(5000)と #examStreakBorder(9045)より下', () => {
  forgeRules().forEach(r => {
    const m = /z-index\s*:\s*([^;]+)/.exec(r.body);
    if (!m) return;
    assert.ok(/--z-hdr/.test(m[1]),
      r.sel.trim() + ' の z-index が --z-hdr 基準でない（数値直書きだとトークンとずれる）');
    assert.ok(/\+\s*1\b/.test(m[1]),
      r.sel.trim() + ' の z-index が --z-hdr + 1 でない（モーダル 5000 と tier の外周 9045 の下に居ること）');
  });
});

// ══ 段E: S4 軸光 ／ S1+S1' 排圧計 ／ S12 ヘッダの管 ／ S13 トーストの打撃 ══
t('12. S4 の軸光が .exam-idle-lit に連動し、tier 色ではなく琥珀固定である', () => {
  const lit = RULES.filter(r => /\.exam-idle-lit[^,]*\.ep-gear/.test(r.sel));
  assert.ok(lit.length, '軸光が .exam-idle-lit に連動していない（新しい軸を作らない・§5-6）');
  const all = RULES.filter(r => /\.ep-gear/.test(r.sel));
  all.forEach(r => {
    assert.ok(!/--exam-focus-c|--exam-focus-glow/.test(r.body),
      '軸光に tier 色が入っている → ' + r.sel.trim() + '（筐体は真鍮固定・tier で変えてよいのは明るさだけ）');
  });
  // 明るさだけが段で変わる＝--exam-axle は数（0〜7）としてしか使われない
  assert.ok(lit.some(r => /--exam-axle\b/.test(r.body)), '明るさが tier（--exam-axle）に載っていない');
  const js = fnBody('_syncFocusStreakColor');
  assert.ok(js && /--exam-axle/.test(js), 'JS が --exam-axle を渡していない');
  assert.ok(!/setProperty\('--exam-axle',\s*[^)]*#/.test(js), 'JS が --exam-axle に色を渡している（段だけを渡すこと）');
});

t('13. S4 が歯車の実装を3本目にしていない（<circle> を足していない）', () => {
  const gearSvgs = (HTML.match(/class="ep-gear[^"]*"/g) || []).length;
  assert.strictEqual(gearSvgs, 2, '計器ベイの歯車が2枚でなくなっている');
  // .ep-gear の SVG の中に <circle> が増えていないこと（軸光は background で作る）
  const svgs = HTML.match(/<svg class="ep-gear[\s\S]*?<\/svg>/g) || [];
  svgs.forEach(x => assert.ok(!/<circle/.test(x), '歯車の SVG に <circle> を足している（実装が3本目になる）'));
  const lit = RULES.filter(r => /\.ep-gear/.test(r.sel)).map(r => r.body).join('');
  assert.ok(/background\s*:\s*radial-gradient/.test(lit), '軸光が background の radial-gradient で作られていない');
});

t('14. S1 の針が rotate で描かれ、箱の外へ出る要素を作らない（iOS の縮尺振動の再発防止）', () => {
  const dial = ruleFor(/\.ep-relief/);
  const needle = ruleFor(/\.ep-needle/);
  assert.ok(dial.length && needle.length, '排圧計の盤面／針が無い');
  const nb = needle.map(r => r.body).join('');
  assert.ok(/rotate\s*:/.test(nb), '針が rotate プロパティで描かれていない');
  assert.ok(!/[^-]transform\s*:/.test(nb), '針が transform を使っている（走行中のアニメに殺される）');
  // 針は盤面（13px＝半径 6.5px）に収まること
  const dw = parseFloat(/width\s*:\s*([\d.]+)px/.exec(dial[0].body)[1]);
  const nh = parseFloat(/height\s*:\s*([\d.]+)px/.exec(nb)[1]);
  assert.ok(nh <= dw / 2, '針が盤面からはみ出す（' + nh + 'px > 半径 ' + (dw / 2) + 'px）');
  // JS 側も rotate で書くこと
  const k = fnBody('_reliefKick');
  assert.ok(k, '_reliefKick が見つからない');
  assert.ok(/rotate:/.test(k) && !/transform:/.test(k), '_reliefKick が transform を使っている');
});

t('15. S1 の振れ幅が _examCardSeenAt を正本にしている（帳簿を新設していない）', () => {
  const k = fnBody('_reliefKick');
  assert.ok(/_examCardSeenAt\.get\(/.test(k),
    '_reliefKick が _examCardSeenAt を見ていない（経過時刻の帳簿を新設しないこと＝R1 と同じ正本）');
  // 針は「読書中は1度も動かない」＝解答検出の1か所からしか呼ばれない
  const calls = (JS_NC.match(/_reliefKick\(/g) || []).length;
  assert.strictEqual(calls, 2, '_reliefKick の呼び出しが1か所でない（定義1＋呼び出し1＝2）');
  const focus = fnBody('_updateExamFocus');
  assert.ok(/_reliefKick\(/.test(focus),
    '_reliefKick が _updateExamFocus（解答の全経路を捉える唯一の場所）から呼ばれていない');
});

t('16. S1 が正誤で色も振れ幅も変えない', () => {
  const k = fnBody('_reliefKick');
  assert.ok(!/isCorrect|correct|wrong/i.test(k),
    '_reliefKick が正誤を見ている（量っているのは正誤ではなく費やした思考＝誤答を罰しない）');
  // 呼び出し側も正誤を渡していない
  const focus = fnBody('_updateExamFocus');
  const m = /_reliefKick\(([^)]*)\)/.exec(focus);
  assert.ok(m && !/true|false|isCorrect/.test(m[1]), '_reliefKick に正誤が渡されている: ' + (m && m[1]));
});

t("31. S1' のオーバーシュートが rotate プロパティで、箱の外へ出る要素を作らない", () => {
  const k = fnBody('_reliefKick');
  const frames = (k.match(/rotate:\s*[^,}]+/g) || []);
  assert.ok(frames.length >= 4, '針のキーフレームが少なすぎる（オーバーシュートが無い）');
  assert.ok(/over/.test(k), 'オーバーシュートの値が無い');
  // 常時の微振動を入れていないこと（iterations / infinite）
  assert.ok(!/infinite|iterations/.test(k), '針に常時の微振動が入っている（読書中に周辺視野で動き続ける）');
  // レッドゾーンを入れていないこと
  assert.ok(!/#F{0,2}[0-9A-F]{0,2}0000|red/i.test(k), '針にレッドゾーンが入っている（誤答を罰しない方針と噛み合わない）');
});

t('28. S12 が font-family を差し替えていない（等幅化は font-variant-numeric）', () => {
  const rs = RULES.filter(r => /#examProgTxt|#examTimer/.test(r.sel));
  assert.ok(rs.length, 'S12 の規則が無い');
  const body = rs.map(r => r.body).join('');
  assert.ok(!/font-family/.test(body), 'S12 が font-family を差し替えている（メトリクスが変わりヘッダが伸びる）');
  assert.ok(!/font-size|letter-spacing/.test(body), 'S12 が文字サイズ／字送りを変えている（_fxBand の焦点がずれる）');
  assert.ok(/font-variant-numeric\s*:\s*tabular-nums/.test(body), '等幅数字になっていない');
  // 常時フリッカーを入れていないこと
  rs.forEach(r => assert.ok(!/animation/.test(r.body), 'S12 が常時アニメを持っている → ' + r.sel.trim()));
});

t('29. S12 の点灯フックが _updateExamProg の中にあり、更新口を2つに増やしていない', () => {
  const b = fnBody('_updateExamProg');
  assert.ok(b, '_updateExamProg が見つからない');
  assert.ok(/txt\.animate\(/.test(b), '点灯が _updateExamProg にない');
  // 進捗テキストを書き換えているのがここ1か所であること
  const writes = (JS_NC.match(/examProgTxt/g) || []).length;
  assert.ok(writes <= 2, '#examProgTxt を触る場所が増えている（更新の口は1つ）');
  // 2段（正解＝強／それ以外＝弱）になっていること
  assert.ok(/if \(isCorrect\)/.test(b) && /else if \(txt\.textContent !== before\)/.test(b),
    '2段（正解＝強／数字が変わったら弱）になっていない');
});

t('30. S12 / S13 が足すアニメは scale / translate の独立プロパティである', () => {
  const b = fnBody('_updateExamProg');
  assert.ok(/scale:/.test(b), 'S12 が scale プロパティを使っていない');
  assert.ok(!/transform:/.test(b), 'S12 が transform を使っている（将来入場アニメを足した瞬間に黙って死ぬ）');
});

t('32. S13 の沈み込みが translate プロパティである', () => {
  const i = JS.indexOf("getElementById('examStreakToast')");
  assert.ok(i > 0, 'トーストが見つからない');
  const seg = JS.slice(i, i + 3000);
  assert.ok(/translate:'0 [\d.]+px'/.test(seg),
    'トーストの打撃が translate プロパティで書かれていない（入場アニメが transform を占有している）');
});

// ══ 全段共通 ═══════════════════════════════════════════════════════════
t('17. exitExam が Phase 7 で足したクラス・タイマーを全部落とす', () => {
  const b = fnBody('exitExam');
  assert.ok(b, 'exitExam が見つからない');
  assert.ok(/exam-plate-fix/.test(b), 'exitExam が exam-plate-fix を落としていない');
});

t('33. vars.css / index.html / gamify.js / chapter_exam.js に Phase 7 の痕跡が無い', () => {
  const files = ['vars.css', 'index.html', 'gamify.js', 'chapter_exam.js'];
  const marks = ['exam-plate', 'exam-relief', 'exam-forge', 'exam-nixie'];
  files.forEach(f => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    marks.forEach(m => assert.ok(!src.includes(m), f + ' に Phase 7 の識別子 ' + m + ' が入り込んでいる'));
  });
});

console.log('');
if (fail) { console.log('FAILED  (' + pass + '/' + (pass + fail) + ')'); process.exit(1); }
console.log('all passed  (' + pass + '/' + pass + ')');
