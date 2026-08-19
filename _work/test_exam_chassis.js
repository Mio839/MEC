/**
 * Phase 4「筐体／盤面の分離による意匠統一」の規約を実ソースで検証する。
 * Run: node _work/test_exam_chassis.js
 *
 * 背景（2026-08-19 の演出強化 Phase 4・設計 §5）:
 *   ハブ（index.html）は真鍮・銅で固定、試験モードは演出7テーマでランダムに配色が変わる。
 *   片方に寄せるともう片方の意味が壊れるので、層を分けた。
 *     筐体（シャーシ）＝真鍮固定。稜線・チャネル・リベット・レール
 *     盤面（表示）    ＝可変。進捗の塗り・数字・スコアリング・難問印・粒子
 *
 * ⚠️ ここで守りたい設計上の決定:
 *   ① 筐体が盤面を1つも侵さない（D6）。これが Phase 4 の目的そのもの。
 *   ② ヘッダの高さを1pxも増やさない（5-5）。_fxBand() の焦点が動く。
 *      ⚠️ test_fx_band.js は .st-hdr の高さをスタブしていて CSS を1バイトも読まないので、
 *         この不変条件を守らない。守るのはここ（項目3）。
 *   ③ 動くのは稼働灯（D9）ただ1つ。理由のない常時アニメを増やさない（5-6）。
 *   ④ 6テーマすべてで稜線が見える＝テーマ別の分岐を作らない（5-7）。
 *
 * ブラウザも jsdom も使わない（この環境に jsdom は無い）。実ソースを読んで
 * 正規表現と数値計算だけで検査する＝ロジックの二重管理をしない。
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const CSS  = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
const VARS = fs.readFileSync(path.join(ROOT, 'vars.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const JS   = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  - ' + name); pass++; }
  catch (e) { console.log('  NG  - ' + name + '\n        ' + (e && e.message)); fail++; }
}

// ── CSS を「セレクタ → 宣言本文」へ雑に割る ────────────────────────────────
// ⚠️ 先にコメントを落とすこと。study.css の注意書きには「逃げ道はこの1行で書ける」といった
//    実例が書いてあり、落とさないとコメント中の規則を本物として拾う（実際に踏んだ）。
// @keyframes の中身は宣言ではないので落とす（0%{...} を規則と誤認しないため）。
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
const NOCOMMENT = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const FLAT = stripAtBlocks(NOCOMMENT);

/** [{sel, body}] を返す。ネストしていないフラットな CSS 前提（study.css はそう）。 */
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!sel || sel.startsWith('@')) continue;
    out.push({ sel, body: m[2] });
  }
  return out;
}
const RULES = rules(FLAT);

/** セレクタ文字列（カンマ区切り）に、対象セレクタを「単体で」含むルールを集める。 */
function rulesFor(target) {
  return RULES.filter(r => r.sel.split(',').some(s => s.trim().includes(target)));
}
/** `.foo{...}` のように単独セレクタで宣言しているルール本文（最初の1つ）。 */
function soleBody(sel) {
  const re = new RegExp('(?:^|\\})\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^{}]*)\\}');
  const m = re.exec(FLAT);
  return m ? m[1] : null;
}

const BRASS_RE = /var\(\s*--exam-(brass|brass-hi|copper|bevel-hi|bevel-lo|rivet)\s*\)/;

// ══ 1. トークンの命名 ═══════════════════════════════════════════════════════
t('1. study.css の --exam-* 定義が vars.css の全カスタムプロパティ名と1つも被らない', () => {
  const mine = new Set((CSS.match(/^\s*(--exam-[a-z0-9-]+)\s*:/gm) || [])
    .map(s => s.trim().replace(/\s*:$/, '')));
  assert.ok(mine.size >= 6, 'study.css に --exam-* の定義が見当たらない（現在 ' + mine.size + ' 個）');
  const theirs = new Set((VARS.match(/(--[a-z0-9-]+)\s*:/g) || [])
    .map(s => s.replace(/\s*:$/, '').trim()));
  const clash = [...mine].filter(n => theirs.has(n));
  assert.deepStrictEqual(clash, [],
    'vars.css と衝突するトークン: ' + clash.join(', ') +
    '（--exam- 接頭辞だけでは不十分。vars.css は --exam-modal-a/b を既に持つ）');
  // 全て --exam- 始まりであること
  const bad = [...mine].filter(n => !/^--exam-/.test(n));
  assert.deepStrictEqual(bad, [], '--exam- 接頭辞の無いトークン: ' + bad.join(', '));
});

t('2. --exam-brass の定義は study.css に1か所だけ／vars.css には無い', () => {
  const n = (CSS.match(/--exam-brass\s*:/g) || []).length;
  assert.strictEqual(n, 1, '--exam-brass の定義が ' + n + ' か所ある（真鍮の二重管理）');
  assert.ok(!/--exam-brass/.test(VARS), 'vars.css に --exam-brass が現れる（vars.css は不可侵）');
  // 6トークンが揃っていること
  ['--exam-brass', '--exam-brass-hi', '--exam-copper',
   '--exam-bevel-hi', '--exam-bevel-lo', '--exam-rivet'].forEach(n2 => {
    assert.ok(new RegExp(n2 + '\\s*:').test(CSS), n2 + ' が定義されていない');
  });
});

// ══ 3. ヘッダの高さ不変（最優先） ═══════════════════════════════════════════
t('3. ヘッダと計器ベイの寸法が現行値のまま（_fxBand() の焦点を動かさない）', () => {
  const hdr = soleBody('.st-hdr');
  assert.ok(hdr, '.st-hdr のルールが見つからない');
  assert.ok(/padding:10px 12px 8px/.test(hdr), '.st-hdr の padding が変わっている');
  assert.ok(/border-bottom:1px solid rgba\(255,255,255,\.08\)/.test(hdr),
    '.st-hdr の border-bottom が変わっている（レールは疑似要素で重ねる・書き換えない）');
  const prog = soleBody('.exam-prog');
  assert.ok(prog && /padding:4px 14px/.test(prog), '.exam-prog の padding が変わっている');
  const track = soleBody('.exam-prog-track');
  assert.ok(track, '.exam-prog-track のルールが見つからない');
  assert.ok(/height:7px/.test(track), '.exam-prog-track の height が 7px でない');
  assert.ok(/border-radius:4px/.test(track), '.exam-prog-track の border-radius が 4px でない');
  assert.ok(/overflow:hidden/.test(track), '.exam-prog-track の overflow:hidden が消えている（ep-sweep がはみ出す）');
});

// ══ 4. 盤面を侵さない（D6・この節が Phase 4 の目的そのもの） ════════════════
t('4. 真鍮トークンが盤面のセレクタに1つも現れない（D6 の禁止リスト）', () => {
  const banned = ['.exam-prog-fill', '.ep-sprint', '.ep-hard', '.ep-last', '.ep-tick',
    '.exam-pct-ring', '.exam-pct', '.exam-detail-item', '.exam-go-btn', '.exam-retry-btn',
    '.exam-review-btn', '.exam-close-btn', '.exam-fresh-btn', '.exam-hard-note',
    '.exam-predict', '.exam-ch-card', '.exam-finish-btn'];
  banned.forEach(sel => {
    rulesFor(sel).forEach(r => {
      // 筐体側のセレクタ（.exam-prog-track など）を巻き込まないよう、対象を含む部分だけ見る
      const hits = r.sel.split(',').filter(s => s.trim().includes(sel));
      if (!hits.length) return;
      assert.ok(!BRASS_RE.test(r.body),
        '盤面 ' + sel + ' に真鍮が現れる → ' + r.sel.trim());
    });
  });
});

/* ⚠️ 2026-08-19（Phase 5 段1）に条件を1段だけ緩めた。旧: 「.qc に真鍮が1つも現れない」。
   R5（真鍮のクランプ）は焦点カードだけを掴む筐体の部品なので、.exam-key-focus に限って許す。
   緩めたのはここだけで、「答え終わったカード・素のカードには真鍮を入れない」は据え置き
   ——傷(C5)・成績(B5)・カード本体が真鍮になると「機械の部品」と「問題」の区別が消えるため。 */
t('4b. .qc に真鍮が現れてよいのは R5 のクランプと R6 のキーキャップだけ', () => {
  rulesFor('.qc').forEach(r => {
    if (!BRASS_RE.test(r.body)) return;
    // R6: 決断フェーズ（R9）の選択肢＝押す機械のキー。カード面ではなく中身なので許す。
    if (/\.exam-deciding[^,]*\.ch2/.test(r.sel)) return;
    assert.ok(/\.exam-key-focus/.test(r.sel),
      '.qc の非焦点セレクタに真鍮が現れる → ' + r.sel.trim());
    assert.ok(/:not\(\.exam-revealed\)/.test(r.sel),
      'R5 は :not(.exam-revealed) で C5 の傷と排他にすること → ' + r.sel.trim());
  });
  // ⚠️ カード面そのもの（.qc の素のルール）は据え置き＝「機械の部品」と「問題」の区別を保つ
  rulesFor('.qc').forEach(r => {
    if (!BRASS_RE.test(r.body)) return;
    assert.ok(/\.exam-key-focus|\.exam-deciding/.test(r.sel),
      'カード面に真鍮が入っている → ' + r.sel.trim());
  });
});

// ══ 5. 2つのモーダルは同じルールブロック ════════════════════════════════════
t('5. .exam-start-box と .exam-modal が同じルールブロックで枠と稜線を宣言している', () => {
  const shared = RULES.filter(r => {
    const parts = r.sel.split(',').map(s => s.trim());
    return parts.some(s => s === '.exam-start-box') && parts.some(s => s === '.exam-modal');
  });
  assert.ok(shared.length >= 1,
    '.exam-start-box,.exam-modal の共通ルールが無い（片方だけ直されて乖離する）');
  const body = shared.map(r => r.body).join('\n');
  assert.ok(/border:\s*2px solid var\(--exam-brass\)/.test(body),
    '共通ルールで枠が真鍮固定になっていない');
  assert.ok(BRASS_RE.test(body), '共通ルールに真鍮トークンが無い');
});

t('5b. 開始＝琥珀 / 結果＝青 という根拠の無い色分けが消えている', () => {
  const sb = soleBody('.exam-start-box');
  assert.ok(sb && !/rgba\(255,154,60,\.45\)/.test(sb),
    '.exam-start-box に琥珀の即値 rgba(255,154,60,.45) が残っている');
  const mb = soleBody('.exam-modal');
  assert.ok(mb && !/rgba\(96,165,250,\.45\)/.test(mb),
    '.exam-modal に青の即値 rgba(96,165,250,.45) が残っている');
  // 既存の落ち影と内側ハイライトを消していないこと（モーダルの浮き上がりを作っている）
  const shared = RULES.filter(r => {
    const parts = r.sel.split(',').map(x => x.trim());
    return parts.includes('.exam-start-box') && parts.includes('.exam-modal');
  }).map(r => r.body).join('\n');
  assert.ok(/0 24px 60px rgba\(0,0,0,\.55\)/.test(shared), '外側の落ち影が消えている');
  assert.ok(/inset 0 1px 0 rgba\(255,255,255,\.08\)/.test(shared), '内側ハイライトが消えている');
  // border-radius:20px は即値のまま（リベット位置が角丸半径に依存する）
  [sb, mb].forEach((b, i) => {
    assert.ok(/border-radius:20px/.test(b),
      (i ? '.exam-modal' : '.exam-start-box') + ' の border-radius が 20px でない（--r-lg を参照させないこと）');
  });
});

// ══ 6. 6テーマぶんの稜線コントラストを実測 ══════════════════════════════════
function hexToRgb(h) {
  const s = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
}
function relLum(rgb) {
  const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function over(fg, a, bg) { return fg.map((v, i) => v * a + bg[i] * (1 - a)); }
function ratio(l1, l2) { const a = Math.max(l1, l2), b = Math.min(l1, l2); return (a + 0.05) / (b + 0.05); }

t('6. --exam-bevel-hi が6テーマすべての地の上で 1.9:1 以上（テーマ別の分岐を作らない担保）', () => {
  const m = /--exam-bevel-hi\s*:\s*rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(CSS);
  assert.ok(m, '--exam-bevel-hi が rgba() で定義されていない');
  const fg = [+m[1], +m[2], +m[3]], alpha = parseFloat(m[4]);
  // vars.css の全 --bg-g1（既定 :root と html.th-* の5つ）＝最も明るい地＝最悪ケース
  const bgs = (VARS.match(/--bg-g1\s*:\s*(#[0-9A-Fa-f]{6})/g) || [])
    .map(s => /(#[0-9A-Fa-f]{6})/.exec(s)[1]);
  assert.ok(bgs.length >= 6, '--bg-g1 が6テーマぶん見つからない（' + bgs.length + '個）');
  const worst = bgs.map(bg => {
    const b = hexToRgb(bg);
    return { bg, r: ratio(relLum(over(fg, alpha, b)), relLum(b)) };
  });
  worst.forEach(w => {
    assert.ok(w.r >= 1.9,
      '地 ' + w.bg + ' で稜線が ' + w.r.toFixed(2) + ':1（1.9 未満＝暖色テーマで意匠が消える）');
  });
});

t('7. --exam-bevel-hi を使うルールには --exam-bevel-lo が必ず対で現れる', () => {
  RULES.forEach(r => {
    if (!/var\(\s*--exam-bevel-hi\s*\)/.test(r.body)) return;
    assert.ok(/var\(\s*--exam-bevel-lo\s*\)/.test(r.body),
      '明線だけで暗線が無いルール → ' + r.sel.trim() +
      '（対にしないと「地が少し明るい帯」に見えるだけで金属にならない）');
  });
});

// ══ 8. 動くのは稼働灯ただ1つ ════════════════════════════════════════════════
t('8. 筐体で animation を持つのは .st-hdr::after（D9 稼働灯）だけ', () => {
  const chassis = ['.st-hdr::before', '.st-hdr::after', '.exam-prog-track', '.exam-start-box', '.exam-modal'];
  const animated = [];
  RULES.forEach(r => {
    if (!BRASS_RE.test(r.body) && !/--exam-idle/.test(r.body)) return;
    if (!/(^|;|\s)animation\s*:/.test(r.body)) return;
    animated.push(r.sel.trim());
  });
  // ⚠️ 2026-08-19（Phase 5 段1）に例外を1つ足した。R5 のクランプは「焦点が移った瞬間に閉じる」
  //    一度きりの入場アニメで、常時回り続ける演出ではない＝5-6 の「動くのは稼働灯1つだけ」は
  //    《常時アニメ》についての約束なので破っていない。infinite を持たせないことで担保する。
  /* ⚠️ 2026-08-19（Phase 5）に約束を精密化した。旧: 「animation を持つのは .st-hdr::after だけ」。
     新: **常時アニメ（infinite）を持てるのは「稼働灯の状態（.exam-idle-lit）に連動するもの」だけ**。
     ——稼働灯(D9)と歯車(R2)がこれに当たり、どちらも同じ1つの状態の表現なので
     「動くのは稼働灯1つだけ」（5-6）の趣旨は保たれている。
     一度きりの入場・起動アニメ（R5 クランプ・R10 起動シーケンス）は常時ではないので別扱い。 */
  const INFINITE_OK = ['.st-hdr::after', '.ep-gear'];
  animated.forEach(sel => {
    const r = RULES.find(x => x.sel.trim() === sel);
    if (r && !/infinite/.test(r.body)) return;            // 一度きりのアニメは対象外
    assert.ok(INFINITE_OK.some(ok => sel.includes(ok)),
      '筐体に理由のない常時アニメが増えている → ' + sel + '（動くのは稼働灯1つだけ・5-6）');
  });
  // 常時アニメを持つ筐体は、稼働灯の状態で止まること＝勝手に回り続けない
  assert.ok(/exam-idle-lit[^{]*\.ep-gear\{[^}]*animation-play-state\s*:\s*running/.test(FLAT),
    '歯車(R2)が .exam-idle-lit に連動していない（読書中だけ回り、答えた瞬間に1拍止まる約束）');
  // 一度きりのアニメが infinite に化けていないこと
  ['.exam-key-focus', '.exam-waking'].forEach(k => {
    RULES.forEach(r => {
      if (!r.sel.includes(k) || !/(^|;|\s)animation\s*:/.test(r.body)) return;
      assert.ok(!/infinite/.test(r.body),
        k + ' のアニメが常時になっている → ' + r.sel.trim() + '（入場・起動は1回きりに留めること）');
    });
  });
  void chassis;
});

// ══ 9. iOS の既存禁則を初めて機械化する ═════════════════════════════════════
t('9. .qc / .st-hdr / .sgh の宣言に backdrop-filter が無い（iOS WebKit の白wash）', () => {
  ['.qc', '.st-hdr', '.sgh'].forEach(sel => {
    rulesFor(sel).forEach(r => {
      assert.ok(!/backdrop-filter/.test(r.body),
        sel + ' に backdrop-filter が付いている → ' + r.sel.trim() +
        '（iOS WebKit の合成が破綻して画面下が白くなる）');
    });
  });
});

// ══ 10. .qc の層は満杯。3人目を入れない ════════════════════════════════════
t('10. .qc の疑似要素の前提が生きている（exam-scar=::before / data-recap=::after）', () => {
  assert.ok(/\.qc\.exam-scar::before\{/.test(FLAT), 'exam-scar が ::before を使う前提が崩れている');
  assert.ok(/\.qc\[data-recap\]::after\{/.test(FLAT), 'data-recap が ::after を使う前提が崩れている');
  /* ⚠️ 2026-08-19（Phase 5 段1）に条件を書き換えた。旧: 「.qc の疑似要素に真鍮が入っていない」。
     R5 が ::before を使えるのは《層が空いたから》ではなく《状態で排他だから》——
     .exam-scar は exam-revealed のカードにしか付かず、焦点は _getExamTargetCard() が
     !exam-revealed で絞った未解答カードにしか付かない。排他の担保はあのフィルタにある。
     ここでは CSS 側が :not(.exam-revealed) を明示していることを検査して二重に守る。 */
  RULES.forEach(r => {
    if (!/\.qc[^,]*::(before|after)/.test(r.sel) || !BRASS_RE.test(r.body)) return;
    assert.ok(/\.exam-key-focus[^,]*:not\(\.exam-revealed\)::before/.test(r.sel),
      '.qc の疑似要素に真鍮が入っている → ' + r.sel.trim() +
      '（許されるのは .exam-key-focus:not(.exam-revealed)::before ＝ R5 のクランプだけ）');
  });
});

// ══ 11. 演出7テーマは筐体に触れない ════════════════════════════════════════
t('11. body.exam-effect-* を含むセレクタに真鍮が現れない（筐体を可変にしない）', () => {
  RULES.forEach(r => {
    if (!/body\.exam-effect-/.test(r.sel)) return;
    assert.ok(!BRASS_RE.test(r.body),
      '演出テーマが筐体を上書きしている → ' + r.sel.trim() +
      '（7テーマは盤面の上でだけ暴れる・D7）');
  });
});

// ══ 12. ヘッダの筐体は body.exam-mode でゲートされている ═══════════════════
t('12. .st-hdr::before / ::after が body.exam-mode でゲートされている（通常閲覧は不変）', () => {
  const hits = RULES.filter(r => /\.st-hdr::(before|after)/.test(r.sel));
  assert.ok(hits.length >= 2, '.st-hdr の ::before / ::after が揃っていない（' + hits.length + '本）');
  hits.forEach(r => {
    r.sel.split(',').forEach(s => {
      if (!/\.st-hdr::(before|after)/.test(s)) return;
      assert.ok(/body\.exam-mode/.test(s),
        'ゲートの無い ' + s.trim() + '（通常閲覧のヘッダにも出てしまう）');
    });
  });
});

// ══ 13〜15. D9 稼働灯（唯一 JS を触る項） ═══════════════════════════════════
t('13. 点灯クラスの付け外しは _updateExamFocus と cleanup の2か所だけ', () => {
  const cls = 'exam-idle-lit';
  const n = (JS.match(new RegExp("'" + cls + "'", 'g')) || []).length;
  assert.ok(n >= 2, '点灯クラス ' + cls + ' が study_exam.js に見当たらない');
  // 出現位置が _updateExamFocus 本体と exitExam 本体の中に収まっていること
  function bodyOf(name) {
    const m = new RegExp('function ' + name + '\\(').exec(JS);
    assert.ok(m, name + ' が見つからない');
    let i = JS.indexOf('{', m.index), depth = 0, end = -1;
    for (let j = i; j < JS.length; j++) {
      if (JS[j] === '{') depth++;
      else if (JS[j] === '}') { depth--; if (!depth) { end = j + 1; break; } }
    }
    return { s: m.index, e: end };
  }
  const focus = bodyOf('_updateExamFocus'), exit = bodyOf('exitExam');
  const re = new RegExp("'" + cls + "'", 'g');
  let m2, outside = [];
  while ((m2 = re.exec(JS))) {
    const i = m2.index;
    const inFocus = i >= focus.s && i < focus.e, inExit = i >= exit.s && i < exit.e;
    if (!inFocus && !inExit) outside.push(JS.slice(Math.max(0, i - 40), i + 20).replace(/\n/g, ' '));
  }
  assert.deepStrictEqual(outside, [],
    '_updateExamFocus / exitExam の外で点灯クラスを触っている:\n        ' + outside.join('\n        '));
  // cleanup（exitExam）で点灯クラスとタイマーの両方が落ちること
  const exitBody = JS.slice(exit.s, exit.e);
  assert.ok(new RegExp(cls).test(exitBody), 'cleanup で点灯クラスを落としていない（通常閲覧で光が走り続ける）');
  assert.ok(/clearTimeout\(\s*_examIdleTimer\s*\)/.test(exitBody), 'cleanup でタイマーを落としていない');
});

t('13b. 稼働灯のタイマーは1本（張り直す前に必ず clearTimeout する）', () => {
  const set = (JS.match(/_examIdleTimer\s*=\s*setTimeout\(/g) || []).length;
  const clr = (JS.match(/clearTimeout\(\s*_examIdleTimer\s*\)/g) || []).length;
  assert.ok(set >= 1, '_examIdleTimer に setTimeout を代入する箇所が無い');
  assert.ok(clr >= set, 'clearTimeout(' + clr + ') が setTimeout(' + set + ') に足りない（多重発火の前科2件）');
  assert.ok(/let\s+_examIdleTimer\s*=\s*null/.test(JS), '_examIdleTimer の宣言が無い');
});

t('13c. 稼働灯は _fxOff() を通している（reduced-motion で一度も点けない）', () => {
  const m = /function _updateExamFocus\(/.exec(JS);
  let i = JS.indexOf('{', m.index), depth = 0, end = -1;
  for (let j = i; j < JS.length; j++) {
    if (JS[j] === '{') depth++;
    else if (JS[j] === '}') { depth--; if (!depth) { end = j + 1; break; } }
  }
  const body = JS.slice(m.index, end);
  assert.ok(/_fxOff\(\)/.test(body), '_updateExamFocus が _fxOff() を見ていない');
});

t('14. EXAM_IDLE_DELAY_MS の既定が 0（実測前に勝手な値を入れない）', () => {
  const m = /const\s+EXAM_IDLE_DELAY_MS\s*=\s*(\d+)/.exec(JS);
  assert.ok(m, 'EXAM_IDLE_DELAY_MS が定数として存在しない（値だけで挙動が変わる形にすること）');
  assert.strictEqual(m[1], '0',
    'EXAM_IDLE_DELAY_MS の既定が ' + m[1] + '（ユーザー決定は 0。倒すなら FAST_TIER_MS[2]=7000 を再利用する）');
  assert.ok(/const\s+EXAM_IDLE_BEAT_MS\s*=\s*\d+/.test(JS), 'EXAM_IDLE_BEAT_MS が無い');
});

t('15. レール=::before / 稼働灯=::after／稼働灯は animation-play-state を使わない', () => {
  const before = RULES.find(r => /\.st-hdr::before/.test(r.sel));
  const after  = RULES.find(r => /\.st-hdr::after/.test(r.sel));
  assert.ok(before && after, '.st-hdr の ::before / ::after が揃っていない');
  /* レール（::before）は静止。⚠️ 2026-08-19（Phase 5）の例外は R10 の起動シーケンスだけで、
     これは離席から戻った時に一度きり走る。常時アニメを持たせないことで担保する。 */
  RULES.forEach(r => {
    if (!/\.st-hdr::before/.test(r.sel) || !/(^|;|\s)animation\s*:/.test(r.body)) return;
    assert.ok(/\.exam-waking/.test(r.sel) && !/infinite/.test(r.body),
      'レール（::before）が動いている → ' + r.sel.trim() +
      '（許されるのは .exam-waking の一度きりの起動シーケンスだけ）');
  });
  // 稼働灯（::after）が走る光であること
  assert.ok(/(^|;|\s)animation\s*:/.test(after.body),
    '稼働灯（::after）に animation が無い（レールと ::before/::after を取り違えると光がレールの下に隠れる）');
  // animation-play-state / animation の付け外しで消さない（途中で凍って「固まった」に見える）
  RULES.forEach(r => {
    if (!/\.st-hdr::after/.test(r.sel)) return;
    assert.ok(!/animation-play-state/.test(r.body),
      '稼働灯に animation-play-state が使われている → ' + r.sel.trim());
  });
  /* 消灯は opacity で受ける。
     ⚠️ 2026-08-19（Phase 5）に対象を「稼働灯そのもののルール」へ絞った。歯車(R2)も
        .exam-idle-lit に連動するが、あちらは animation-play-state で止めるのが正しい
        ——光は途中で凍ると「固まった」に見えるが、歯車は途中で止まるのが正しい絵だから。 */
  const lit = RULES.filter(r => /exam-idle-lit/.test(r.sel) && /\.st-hdr::after/.test(r.sel));
  assert.ok(lit.length >= 1, '点灯クラス .exam-idle-lit の稼働灯ルールが無い');
  lit.forEach(r => {
    const props = (r.body.match(/(^|;)\s*([a-z-]+)\s*:/g) || [])
      .map(s => s.replace(/[;:\s]/g, ''));
    assert.deepStrictEqual([...new Set(props)], ['opacity'],
      '点灯クラスが opacity 以外を切り替えている（' + props.join(',') + '）' +
      '＝animation ごと外すと transform が基準値へ戻って光が始点へ飛ぶ');
  });
  // body.exam-sprint で1行で消せる逃げ道があること（＝稼働灯が単独セレクタで指せる）
  assert.ok(/\.st-hdr::after/.test(after.sel),
    '稼働灯が単独セレクタで指せない（body.exam-sprint .st-hdr::after{opacity:0} の逃げ道が書けない）');
});

t('15b. 稼働灯は箱の外へ1pxも出ない（iOS でページの縮尺が振動した回帰のガード）', () => {
  const after = RULES.find(r => /\.st-hdr::after/.test(r.sel));
  assert.ok(after, '.st-hdr::after が無い');
  // 箱いっぱいに広げて固定する＝はみ出しようがない形にすること
  assert.ok(/(^|;)\s*left:\s*0/.test(after.body) && /(^|;)\s*right:\s*0/.test(after.body),
    '稼働灯が left:0 / right:0 で箱に固定されていない（width:N% + translateX で走らせると右へあふれる）');
  assert.ok(!/(^|;)\s*width\s*:/.test(after.body),
    '稼働灯に width が指定されている（left/right で決めること）');
  // 動かすのは background-position だけ。transform で走らせない
  assert.ok(!/transform/.test(after.body), '稼働灯の宣言に transform がある');
  const kf = /@keyframes\s+examIdleRun\s*\{([\s\S]*?)\}\s*\n/.exec(CSS);
  assert.ok(kf, '@keyframes examIdleRun が無い');
  assert.ok(!/translate/i.test(kf[1]),
    'examIdleRun が translate で走っている＝箱の外へ出る。' +
    'iOS Safari は右へあふれた内容でレイアウトビューポートを広げ、ページの縮尺が周期的に振動する');
  assert.ok(/background-position/.test(kf[1]), 'examIdleRun が background-position を動かしていない');
  // 端で光が見切れないだけの振り幅があること（background-size:26% なら基準は 74%）
  const nums = (kf[1].match(/-?\d+(?:\.\d+)?%/g) || []).map(parseFloat);
  assert.ok(nums.length >= 2, 'examIdleRun の位置指定が読めない');
  const sizeM = /background-size:\s*(\d+(?:\.\d+)?)%/.exec(after.body);
  assert.ok(sizeM, '稼働灯に background-size の % 指定が無い');
  const imgW = parseFloat(sizeM[1]) / 100, basis = 1 - imgW;
  const from = Math.min(...nums) / 100, to = Math.max(...nums) / 100;
  assert.ok(from * basis + imgW <= 0.001,
    '開始位置で光が右端にはみ出して見えている（' + (from * basis + imgW).toFixed(3) + ' > 0）');
  assert.ok(to * basis >= 0.999,
    '終了位置で光が左端に残る（' + (to * basis).toFixed(3) + ' < 1）');
});

// ══ 16. モーダルの筐体を疑似要素で描かない ═════════════════════════════════
t('16. .exam-start-box / .exam-modal の ::before / ::after が1つも宣言されていない', () => {
  RULES.forEach(r => {
    r.sel.split(',').forEach(s => {
      const m = /(\.exam-start-box|\.exam-modal)::(before|after)/.exec(s);
      assert.ok(!m, 'モーダルの疑似要素 ' + (m && m[0]) + ' が宣言されている → ' + r.sel.trim() +
        '（overflow-y:auto の中では内容と一緒にスクロールして流れる・D4）');
    });
  });
  // 筐体は background-image と box-shadow:inset で本体に描くこと
  const shared = RULES.filter(r => {
    const parts = r.sel.split(',').map(s => s.trim());
    return parts.includes('.exam-start-box') && parts.includes('.exam-modal');
  }).map(r => r.body).join('\n');
  assert.ok(/box-shadow:[^;]*inset/.test(shared), '稜線が box-shadow:inset で描かれていない');
});

// ══ 17. 撤回した2件を復活させない ══════════════════════════════════════════
t('17. .ep-tick / .ep-last / .exam-prog の宣言に真鍮が現れない（2026-08-19 の撤回）', () => {
  ['.ep-tick', '.ep-last'].forEach(sel => {
    rulesFor(sel).forEach(r => {
      assert.ok(!BRASS_RE.test(r.body),
        sel + ' が真鍮化されている → ' + r.sel.trim() +
        '（真鍮 #E0C25E と --yl #FFB830 は輝度がほぼ同一＝1.008:1 で通過済み区間から消える）');
    });
  });
  const prog = soleBody('.exam-prog');
  assert.ok(prog && !BRASS_RE.test(prog),
    '.exam-prog の床が真鍮化されている（黒のままの方が真鍮のレールとチャネルが立つ）');
  assert.ok(/background:rgba\(0,0,0,\.5\)/.test(prog), '.exam-prog の床 rgba(0,0,0,.5) が変わっている');
  // 目盛りの黒縁が残っていること（明暗の対で塗りの上でも読める）
  const tick = soleBody('.exam-prog-track .ep-tick');
  assert.ok(tick && /box-shadow:0 0 0 1px rgba\(0,0,0,\.5\)/.test(tick),
    '.ep-tick の黒縁が消えている（塗りの上で目盛りが読めなくなる）');
  assert.ok(/background:rgba\(255,255,255,\.85\)/.test(tick), '.ep-tick の白い芯が変わっている');
});

t('17b. .exam-prog-track が筐体化され、.exam-prog-fill は盤面のまま', () => {
  const track = soleBody('.exam-prog-track');
  assert.ok(BRASS_RE.test(track), '.exam-prog-track が筐体化されていない（溝＝チャネルにする）');
  const fill = soleBody('.exam-prog-fill');
  assert.ok(fill && !BRASS_RE.test(fill), '.exam-prog-fill に真鍮が入っている（進捗の塗りは盤面）');
  assert.ok(/background:var\(--yl\)/.test(fill), '.exam-prog-fill の塗りが --yl でなくなっている');
  // ::after は ep-sweep 専用のまま
  const after = RULES.filter(r => /\.exam-prog-track[^,]*::after/.test(r.sel));
  assert.strictEqual(after.length, 1,
    '.exam-prog-track の ::after が ' + after.length + ' 本ある（ep-sweep が使用中・1本のまま）');
  assert.ok(/epSweep/.test(after[0].body), '.exam-prog-track::after が ep-sweep でなくなっている');
});

// ══ 18〜19. 折りたたんでも筐体が消えない ═══════════════════════════════════
t('18. study.html の #examProg が #stFilterPanel の外にある（畳んでも計器ベイが残る）', () => {
  const open = HTML.indexOf('id="stFilterPanel"');
  const close = HTML.indexOf('<!-- /st-filter-panel -->');
  const prog = HTML.indexOf('id="examProg"');
  assert.ok(open > 0 && close > 0 && prog > 0, 'マークアップの目印が見つからない');
  assert.ok(prog > close,
    '#examProg が st-filter-panel の中にある（▼で畳むと計器ベイごと消える）');
});

t('19. .st-hdr.hdr-collapsed のルールが3本のまま（.exam-prog や疑似要素を隠さない）', () => {
  const hits = RULES.filter(r => /\.st-hdr\.hdr-collapsed/.test(r.sel));
  assert.strictEqual(hits.length, 3,
    '.st-hdr.hdr-collapsed のルールが ' + hits.length + ' 本ある（現在は 3 本）:\n        ' +
    hits.map(r => r.sel.trim()).join('\n        '));
  const targets = hits.map(r => r.sel.trim()).sort();
  assert.deepStrictEqual(targets, [
    '.st-hdr.hdr-collapsed .hdr-toggle',
    '.st-hdr.hdr-collapsed .st-filter-panel',
    '.st-hdr.hdr-collapsed .st-stats'
  ], '畳む対象が変わっている（.exam-prog / ::before / ::after を隠すと筐体が消える）');
});

console.log('\n' + (fail ? 'FAILED  ' : 'all passed  ') + '(' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
