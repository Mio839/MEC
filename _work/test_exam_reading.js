/**
 * Phase 5「読んでいる間の演出」の規約を実ソースで検証する。
 * Run: node _work/test_exam_reading.js
 *
 * 背景（2026-08-19・設計 §11）:
 *   正解時・連続正解時の演出は厚いのに、解答するまでの 8〜15 秒は
 *   「3px の静止した枠」と「1px の稼働灯」しか無かった。読書時間を
 *   「機械が待っている時間」として作り直したのが Phase 5。
 *
 *     段1 R13 持ち上げ ／ R5 真鍮のクランプ ／ R3 連続正解を枠の色に残す
 *     段2 R1 圧が溜まり解答で放出（蒸気）／ R8 スクロールに応答 ／ R10 スリープ ／ R2 歯車
 *     段3 R7 読影灯 ／ R9 読む→決めるの相転移 ／ R6 キーキャップ
 *
 * ⚠️ ここで守りたい設計上の決定:
 *   ① 読書の邪魔をしない（原則1〜5）。中心視野に置かない・急かさない・バイアスを与えない。
 *   ② 焦点状態（.exam-key-focus）が土台。開始直後に付かない穴を塞いだ状態を保つ。
 *   ③ JS が落ちても情報が失われない（R7 が画像を暗いまま残さない）。
 *   ④ exitExam で全部落とす。タイマーは種類ごとに1本。
 *
 * ブラウザも jsdom も使わない。実ソースを読んで正規表現だけで検査する。
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const CSS  = fs.readFileSync(path.join(ROOT, 'study.css'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'study.html'), 'utf8');
const JS   = fs.readFileSync(path.join(ROOT, 'study_exam.js'), 'utf8');
const VARS = fs.readFileSync(path.join(ROOT, 'vars.css'), 'utf8');

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
/** @media ブロックの中身を取り出す（study.css には prefers-reduced-motion が3本ある）。 */
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
/** @media を丸ごと落とす。中の上書き（animation:none 等）を素のルールと混ぜないため。 */
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
/** 関数本体を雑に切り出す（ネストした波括弧を数える）。 */
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

// ══ 1. 段1 の土台：開始直後に焦点が付かない穴が塞がっている ═══════════════════
t('1. startExam のカウントダウン明けに _updateExamFocus() を呼んでいる（1問目の演出が抜けない）', () => {
  const start = fnBody('startExam');
  assert.ok(start, 'startExam が見つからない');
  // B6/B7 が1問目を立ち上げる setTimeout の中に、素の呼び出しがあること
  const seg = start.slice(start.indexOf('_cdEnd') >= 0 ? 0 : 0);
  const m = /_firstCardEntrance\(examQueue\[0\]\)/.exec(seg);
  assert.ok(m, '1問目の立ち上げ（_firstCardEntrance）が見つからない');
  const before = seg.slice(0, m.index);
  assert.ok(/_updateExamFocus\(\)\s*;/.test(before),
    'カウントダウン明けに _updateExamFocus() の素の呼び出しが無い' +
    '（rAF 版は1度きりでカードが出そろう前に走る＝1問目だけ R3/R5/R13 が抜ける）');
});

t('2. _updateExamFocus は焦点が変わった時だけクラスを付け替える（クランプが繰り返し閉じない）', () => {
  const b = fnBody('_updateExamFocus');
  assert.ok(b, '_updateExamFocus が見つからない');
  assert.ok(/if\s*\(\s*prevFocus\s*!==\s*card\s*\)/.test(b),
    '焦点の同一判定が無い（スクロールのたびに R5 のクランプが閉じ直す）');
});

// ══ 2. R5：クランプが C5 の傷と排他になっている ═══════════════════════════════
t('3. R5 のクランプが .exam-key-focus:not(.exam-revealed)::before に限定されている', () => {
  const clamp = RULES.filter(r => /\.exam-key-focus[^,{]*::before/.test(r.sel));
  assert.strictEqual(clamp.length, 1, 'R5 のクランプが1本でない（' + clamp.length + '本）');
  assert.ok(/:not\(\.exam-revealed\)/.test(clamp[0].sel),
    'R5 に :not(.exam-revealed) が無い → ' + clamp[0].sel);
});

t('4. C5 の傷は ::before のまま／R5 と同じカードに載らない前提が生きている', () => {
  assert.ok(/\.qc\.exam-scar::before\{/.test(FLAT), 'C5 の傷が ::before を使う前提が崩れている');
  assert.ok(/\.qc\[data-recap\]::after\{/.test(FLAT), 'B5 の成績が ::after を使う前提が崩れている');
  // 排他の担保は _getExamTargetCard() のフィルタにある。ここが消えると2つが同居する。
  const b = fnBody('_getExamTargetCard');
  assert.ok(b && /!c\.classList\.contains\('exam-revealed'\)/.test(b),
    '_getExamTargetCard() が exam-revealed を除外していない' +
    '（R5 のクランプと C5 の傷が同じカードに同居する）');
});

// ══ 3. R13：既存の box-shadow を消していない ══════════════════════════════════
t('5. R13 が .qc の既存 box-shadow（落ち影＋inset ハイライト）を書き足している', () => {
  const focus = RULES.find(r => /\.exam-key-focus/.test(r.sel) && !/::/.test(r.sel));
  assert.ok(focus, '焦点カードのルールが見つからない');
  assert.ok(/inset 0 1px 0 rgba\(255,255,255,\.08\)/.test(focus.body),
    '.qc の inset ハイライトが消えている（box-shadow は合成されないので書き足すこと）');
  assert.ok(/0 4px 24px rgba\(0,0,0,\.3\)/.test(focus.body),
    '.qc の既存の落ち影が消えている（カードが平らになり :hover でも戻らない）');
});

// ══ 4. R3：tier の色は _tIdx 経由 ═════════════════════════════════════════════
t('6. R3 の色は _tIdx で引く（Math.min(tier,6) を新しく書かない）', () => {
  const b = fnBody('_syncFocusStreakColor');
  assert.ok(b, '_syncFocusStreakColor が見つからない');
  assert.ok(/_tIdx\(/.test(b), 'tier の丸めに _tIdx を使っていない');
  assert.ok(!/Math\.min\(\s*[^,)]*tier[^,)]*,\s*6\s*\)/.test(b),
    'Math.min(tier,6) を書いている（tier7 を取りこぼす。_tIdx に寄せること）');
});

t('7. R3 の焦点色トークンが vars.css と衝突していない（--exam- 接頭辞かつ同名が無い）', () => {
  ['--exam-focus-c', '--exam-focus-glow'].forEach(k => {
    assert.ok(new RegExp(k + '\\s*:').test(CSS_NC), k + ' が study.css で定義されていない');
    assert.ok(!VARS.includes(k), k + ' が vars.css にもある（継承で拾って壊れる）');
  });
});

t('8. R3 の色は焦点枠だけに乗る（クランプ＝筐体は真鍮固定のまま）', () => {
  const clamp = RULES.find(r => /\.exam-key-focus[^,{]*::before/.test(r.sel));
  assert.ok(clamp, 'R5 のクランプが見つからない');
  assert.ok(!/--exam-focus-c|--exam-focus-glow/.test(clamp.body),
    'クランプ（筐体）が tier の色に振られている → 筐体は真鍮固定（設計 §11-7 の条件2）');
});

// ══ 5. R1：しきい値を再利用している ═══════════════════════════════════════════
t('9. R1 のしきい値は FAST_TIER_MS[2] の再利用（新しい 7000 を書かない）', () => {
  const b = fnBody('_examPressureBuilt');
  assert.ok(b, '_examPressureBuilt が見つからない');
  assert.ok(/FAST_TIER_MS\[2\]/.test(b),
    'FAST_TIER_MS[2] を再利用していない（A3 が褒める区間は静か、という筋が消える）');
  assert.ok(!/\b7000\b/.test(b), '7000 を即値で書いている（定数を二重に持たない）');
});

t('10. R1 の経過時刻は _examCardSeenAt が正本（帳簿を新設していない）', () => {
  const b = fnBody('_examPressureBuilt');
  assert.ok(/_examCardSeenAt\.get\(/.test(b), '_examCardSeenAt を使っていない');
});

t('11. R1 の放出は解答の全経路を捉える1か所（_updateExamFocus の解答検出）に置く', () => {
  const b = fnBody('_updateExamFocus');
  assert.ok(/_examPuffSteam\(true\)/.test(b),
    '放出が _updateExamFocus に無い（_afterCorrectFx は複数選択を通らず取りこぼす）');
  assert.ok(!/_examPuffSteam/.test(fnBody('_afterCorrectFx') || ''),
    '_afterCorrectFx に放出を置いている（複数選択の経路が抜ける）');
});

t('12. 蒸気は blend:false（加算合成にすると湯気ではなく発光体になる）', () => {
  const b = fnBody('_examPuffSteam');
  assert.ok(b, '_examPuffSteam が見つからない');
  assert.ok(/blend:\s*false/.test(b), 'blend:false を渡していない');
});

// ══ 6. R8：playbackRate で速さを変える ════════════════════════════════════════
t('13. R8 は playbackRate を使い animation-duration を書き換えない（光がワープする）', () => {
  const b = fnBody('_setMachineRate');
  assert.ok(b, '_setMachineRate が見つからない');
  assert.ok(/playbackRate\s*=/.test(b), 'playbackRate を使っていない');
  assert.ok(!/animation-duration|animationDuration|--exam-idle-cycle/.test(JS_NC),
    'JS が稼働灯の duration を書き換えている（走行中に変えると進捗率が飛ぶ）');
});

t('14. R8 は疑似要素のアニメを getAnimations({subtree:true}) で掴む（掴めなければ何もしない）', () => {
  const b = fnBody('_machineAnims');
  assert.ok(b, '_machineAnims が見つからない');
  assert.ok(/getAnimations\(\s*\{\s*subtree:\s*true\s*\}\s*\)/.test(b),
    'subtree:true が無い（::after のアニメは element.animate() では作れない）');
  assert.ok(/catch\s*\(/.test(b), '未対応環境の受けが無い（例外を投げてはいけない）');
});

// ══ 7. R10 / R2：タイマーは種類ごとに1本、歯車は稼働灯に連動 ══════════════════
t('15. R10 のスリープ番は D9 と別のタイマーで、張り直す前に clearTimeout する', () => {
  const b = fnBody('_armExamSleep');
  assert.ok(b, '_armExamSleep が見つからない');
  assert.ok(/clearTimeout\(_examSleepTimer\)/.test(b), '張り直す前に落としていない（多重発火）');
  assert.ok(!/_examIdleTimer/.test(b), 'D9 のタイマーを流用している（経路を分けること）');
});

t('16. R2 の歯車が .exam-idle-lit に連動し、真鍮固定である', () => {
  const gear = RULES.filter(r => /\.ep-gear/.test(r.sel));
  assert.ok(gear.length >= 2, '歯車のルールが足りない');
  assert.ok(/exam-idle-lit[^{]*\.ep-gear\{[^}]*animation-play-state\s*:\s*running/.test(FLAT),
    '歯車が稼働灯の状態に連動していない（読書中だけ回り、答えた瞬間に1拍止まる約束）');
  gear.forEach(r => {
    assert.ok(!/--or\b|--yl\b|--exam-focus-c/.test(r.body),
      '歯車が盤面の色に振られている → ' + r.sel.trim() + '（筐体は真鍮固定）');
  });
});

t('17. 歯車は animation-play-state で止める（animation ごと外すと角度が 0 へワープする）', () => {
  const base = RULES.find(r => r.sel.trim() === '.ep-gear');
  assert.ok(base, '.ep-gear の素のルールが無い');
  assert.ok(/animation-play-state\s*:\s*paused/.test(base.body),
    '既定が paused でない（既定で回ると試験外でも動く）');
});

t('18. 歯車がヘッダの中に入っていて、寸法が行の高さを超えない（_fxBand の焦点を動かさない）', () => {
  assert.ok(/class="ep-gear"/.test(HTML) && /class="ep-gear ep-gear-b"/.test(HTML),
    '歯車が study.html に2つ無い');
  const iProg = HTML.indexOf('<div class="exam-prog"');
  const iGear = HTML.indexOf('class="ep-gear"');
  assert.ok(iProg >= 0 && iGear > iProg, '歯車が .exam-prog の中にない');
  const base = RULES.find(r => r.sel.trim() === '.ep-gear');
  const m = /width:\s*(\d+)px/.exec(base.body);
  assert.ok(m, '歯車に固定幅が無い');
  assert.ok(Number(m[1]) <= 19, '歯車が ' + m[1] + 'px（11px×1.7=約19px の行を超える＝ヘッダが伸びる）');
});

// ══ 8. R7：JS が落ちても画像が読める ══════════════════════════════════════════
t('19. R7 は素の画像を暗くしない（クラスが付いた時だけ暗→明が一度走る）', () => {
  const plain = RULES.filter(r => /\.qimg(?![-\w])/.test(r.sel) && !/qimg-lit/.test(r.sel));
  plain.forEach(r => {
    assert.ok(!/filter\s*:\s*brightness/.test(r.body),
      '素の .qimg が暗くされている → ' + r.sel.trim() +
      '（JS が落ちた日に画像が読めなくなる。stats.html の armReveal と同じ失敗の型）');
  });
  assert.ok(/\.qimg\.qimg-lit\{[^}]*animation:/.test(FLAT),
    '.qimg-lit に一度きりのアニメが無い');
});

t('20. R7 は同じ画像を二度点けない／拡大表示と競合しない', () => {
  const b = fnBody('_examLightbox');
  assert.ok(b, '_examLightbox が見つからない');
  assert.ok(/dataset\.examLit/.test(b), '点灯済みの印が無い（往復のたびに光る）');
  assert.ok(!/pointer-events|addEventListener\('click'/.test(b),
    '当たり判定を作っている（.qimg の zoom-in と競合する）');
  assert.ok(/complete/.test(b) && /'load'/.test(b),
    'lazy 読込がまだの画像を待っていない');
});

// ══ 9. 段3：observer は1本・exitExam で disconnect ═══════════════════════════
t('21. IntersectionObserver は1本だけ生成し、焦点カードのぶんだけ observe する', () => {
  const news = (JS_NC.match(/new IntersectionObserver/g) || []).length;
  assert.strictEqual(news, 1, 'IntersectionObserver を ' + news + ' 本作っている（1本を共有すること）');
  const w = fnBody('_examIOWatch');
  assert.ok(w, '_examIOWatch が見つからない');
  assert.ok(/unobserve\(/.test(w), '前のカードを unobserve していない（594枚まで膨らむ）');
  const io = fnBody('_ensureExamIO');
  assert.ok(!/rootMargin/.test(io || ''),
    'rootMargin を広げている（content-visibility:auto のカードの描画を強制する）');
});

t('22. R9 の相転移は焦点カードについてのみ判定する', () => {
  const b = fnBody('_examPhaseDecide');
  assert.ok(b, '_examPhaseDecide が見つからない');
  assert.ok(/exam-key-focus/.test(b), '焦点カードに限定していない（下のカードで発火する）');
});

t('23. 稼働灯を消す経路が R9（相転移）と R10（スリープ）で分かれている', () => {
  const off = RULES.filter(r => /\.st-hdr::after/.test(r.sel) && /opacity\s*:\s*0\b/.test(r.body));
  const keys = off.map(r => r.sel);
  assert.ok(keys.some(s => /exam-phase-decide/.test(s)), 'R9 の消灯ルールが無い');
  assert.ok(keys.some(s => /exam-asleep/.test(s)), 'R10 の消灯ルールが無い');
  assert.ok(!/exam-asleep[^{]*exam-phase-decide|exam-phase-decide[^{]*exam-asleep/.test(FLAT),
    '2つの経路を1本のルールにまとめている（どちらが消したのか追えなくなる）');
});

t('24. R6 のキーキャップは R9 の相転移とセットで、.exam-selected の青を潰さない', () => {
  const cap = RULES.filter(r => /\.exam-deciding[^,{]*\.ch2(?!\.)/.test(r.sel));
  assert.ok(cap.length >= 1, 'R6 のキーキャップが無い');
  assert.ok(/\.exam-deciding[^,{]*\.ch2\.exam-selected\{/.test(FLAT),
    '.exam-deciding .ch2.exam-selected の再宣言が無い' +
    '（この規則は .exam-selected より後ろにあるので、書かないと選択中の青が消える）');
  cap.forEach(r => {
    assert.ok(!/(^|;)\s*(padding|margin)\s*:/.test(r.body),
      '.ch2 の padding/margin を変えている → ' + r.sel.trim() +
      '（負マージンで詰めてあり、選択中と正解の背景の当たりがずれる）');
  });
});

t('27. R6 のキーキャップが水平の「線」を作らない（下線部と紛れる）', () => {
  /* ⚠️ 2026-08-19 の実害。初版は各肢の上端に明線・下端に暗線・直下に硬い銅の側壁を置いており、
     肢が負マージンで詰めて積まれているため「各行に罫線が引かれた表」に見えた。
     とくに銅の側壁は下線そのもの。**下線部はこの教材では意味を持つ記号**で、
     「本文中の下線部①〜⑤が選択肢そのもの」という問題が実在する（ortho NO.167/171/142・
     rad NO.2）。装飾の線がそこに紛れると設問の読解を壊す。
     判定: box-shadow の各層で「縦オフセットがあるのに blur が 0」＝硬い線、を禁じる。 */
  RULES.filter(r => /\.exam-deciding[^,{]*\.ch2(?!\.)/.test(r.sel)).forEach(r => {
    const m = /box-shadow\s*:([^;]*)/.exec(r.body);
    if (!m) return;
    // rgba(...) / var(...) の中のカンマを潰してから層に割る
    const flat = m[1].replace(/\([^()]*\)/g, '()');
    flat.split(',').forEach((layer, i) => {
      // ⚠️ 長さは `0` のように単位無しで書かれる（`0px` 決め打ちだと硬い線を見逃す）。
      //    括弧を潰したうえで空白区切りにし、数値トークンだけを拾うこと。
      const nums = layer.replace(/\binset\b/g, '').replace(/\(\)/g, '').trim().split(/\s+/)
        .filter(tok => /^-?[\d.]+(px)?$/.test(tok)).map(parseFloat);
      if (nums.length < 3) return;              // 色だけ / 省略形は対象外
      const [, dy, blur] = nums;                // [dx, dy, blur, spread?]
      assert.ok(!(Math.abs(dy) > 0 && blur === 0),
        'キーキャップの影に硬い線がある（層' + (i + 1) + ': ' + layer.trim() + '）' +
        ' → 下線部と紛れる。立体感は拡散した影で出すこと');
    });
    assert.ok(!/inset/.test(m[1]),
      'キーキャップに inset の縁がある → ' + r.sel.trim() +
      '（肢は負マージンで詰めて積まれているので、上下の縁が罫線に見える）');
  });
});

// ══ 10. exitExam が Phase 5 の痕跡を全部落とす ═══════════════════════════════
t('25. exitExam が段1〜3のクラス・タイマー・observer を全部落とす', () => {
  const b = fnBody('exitExam');
  assert.ok(b, 'exitExam が見つからない');
  const need = [
    ['--exam-focus-c',        'R3 の焦点色'],
    ['_examSteamInt',         'R1 の圧のインターバル'],
    ['_machDecayTimers',      'R8 の減速タイマー'],
    ['_examSleepTimer',       'R10 のスリープ番'],
    ['exam-asleep',           'R10 のスリープ状態'],
    ['disconnect()',          '段3 の observer'],
    ['exam-phase-decide',     'R9 の相転移'],
    ['exam-deciding',         'R6 のキーキャップ'],
    ['qimg-lit',              'R7 の点灯済み']
  ];
  need.forEach(([k, why]) => {
    assert.ok(b.includes(k), why + '（' + k + '）が exitExam で落とされていない');
  });
});

t('26. reduced-motion で Phase 5 の動きが全部止まり、意匠は残る', () => {
  // ⚠️ study.css には prefers-reduced-motion のブロックが3本ある。全部を合わせて見ること
  //    （1本目だけ見ると Phase 5 の停止が入っている3本目を取りこぼす）。
  const blocks = mediaBlocks(CSS_NC, 'prefers-reduced-motion');
  assert.ok(blocks.length >= 1, 'reduced-motion のブロックが無い');
  const blk = blocks.join('\n');
  ['.ep-gear', '.qimg.qimg-lit', '.exam-deciding .ch2', '.exam-key-focus'].forEach(k => {
    assert.ok(blk.includes(k), k + ' が reduced-motion で止められていない');
  });
  // ⚠️ display:none で消してはいけない（動きだけ止め、意匠＝静止画は残す）
  assert.ok(!/\.ep-gear[^;{}]*\{[^}]*display\s*:\s*none/.test(blk),
    '歯車を display:none で消している（止まって見えるのが正しい＝絵は残す）');
});

console.log('');
if (fail) { console.log('FAILED  (' + pass + '/' + (pass + fail) + ')'); process.exit(1); }
console.log('all passed  (' + pass + '/' + pass + ')');
