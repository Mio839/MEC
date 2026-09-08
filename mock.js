/**
 * MEC Mock — 模試の自己採点エンジン（window.MecMock）
 *
 * 役割は3つだけ。UI（mock.html）はここを呼ぶだけで、採点の式を1つも持たない。
 *   (1) 解答の正規化と保存（localStorage `mec_mock_v1`・Gist同期対象）
 *   (2) 採点（ブロック別／一般・臨床別／必修80%／禁忌肢／科目別）
 *   (3) 解説の重さ（weights）— 今後つくる解説HTMLが読む唯一の出口
 *
 * ⚠️⚠️ 正誤そのものを保存しないこと。保存するのは「何を選んだか（picked）」だけで、
 *      正誤は解答表（mock_data/{id}.js）と突き合わせて毎回計算する。正解表を直したときに
 *      過去の記録が黙って古いままになるのを防ぐため＝正誤の式がこのファイルの1か所に
 *      しか無い状態を保つ。
 *
 * ⚠️ 部分点は無い（国試・模試とも完全一致のみ）。「2つ選べ」で1つだけ合っていても0点。
 * ⚠️ 計算問題（桁入力）の正解は数値ではなく桁文字列。先頭ゼロ・末尾ゼロが意味を持つので
 *    数値化しないこと（study.html の calc_input.js と同じ約束）。
 */
(function () {
  'use strict';

  var KEY = 'mec_mock_v1';
  var LETTERS = 'abcde';

  // 合否の基準。模試の推定ボーダーは配点表に載っていないので、制度として動かないと
  // 決まっているもの（必修80%・禁忌肢4問で不合格）だけを既定値として持ち、
  // 一般・臨床のボーダーは値を持たない（ユーザーが設定したときだけ判定する）。
  var HISSHU_PCT = 80;   // 必修は80%以上
  var TABOO_MAX = 3;     // 禁忌肢は3問まで（4問以上で不合格）

  // ── 保存形式 ────────────────────────────────────────────────
  // mec_mock_v1 = {
  //   "<examId>": {
  //     cur: "r1",
  //     rounds: { "r1": { started:ms, graded:ms|0, ans:{ "A1":{p:"be",t:ms} } } },
  //     border: 245                      // 一般・臨床のボーダー（任意・未設定は null）
  //   }
  // }
  // ⚠️ 周回（rounds）を配列ではなく id キーの object で持つのは同期のため。配列だと
  //    2端末で同時に1周ぶん足したとき index が衝突して片方が黙って消える。

  function _read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function _write(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* 容量は progress.js が面倒を見る */ }
    if (window.MECSync && typeof window.MECSync.scheduleSync === 'function') window.MECSync.scheduleSync();
  }

  function store(examId) {
    var all = _read();
    var e = all[examId];
    if (!e || typeof e !== 'object') e = all[examId] = { cur: 'r1', rounds: {}, border: null };
    if (!e.rounds) e.rounds = {};
    if (!e.cur) e.cur = 'r1';
    if (!e.rounds[e.cur]) e.rounds[e.cur] = { started: Date.now(), graded: 0, ans: {} };
    return { all: all, exam: e, round: e.rounds[e.cur] };
  }

  // ── 解答の正規化 ───────────────────────────────────────────
  // 選択式は a〜e を重複なく昇順に並べた文字列（'be'）。桁入力は数字だけの文字列（'104'）。
  // ⚠️ 昇順に固定するのは、入力順が違うだけの同じ解答を必ず同じ文字列にするため
  //    （固定しないと同期のマージで「違う解答」に見えて last-writer-wins が意味を失う）。
  function normPick(q, raw) {
    var s = String(raw == null ? '' : raw).toLowerCase();
    if (q && q.type === 'calc') return s.replace(/[^0-9]/g, '').slice(0, q.digits || 3);
    var seen = {}, out = '';
    for (var i = 0; i < LETTERS.length; i++) {           // 常に a→e の順で組み直す
      var c = LETTERS.charAt(i);
      if (s.indexOf(c) >= 0 && !seen[c]) { seen[c] = 1; out += c; }
    }
    return out;
  }

  // ── 1問の採点 ──────────────────────────────────────────────
  function judge(q, raw) {
    var p = normPick(q, raw), taboo = false;
    if (q.taboo) {
      for (var i = 0; i < q.taboo.length; i++) {
        if (p.indexOf(q.taboo[i]) >= 0) { taboo = true; break; }
      }
    }
    if (!p) return { state: 'blank', picked: '', ok: false, pts: 0, taboo: false };
    var want = q.type === 'calc' ? q.ans[0] : q.ans.slice().sort().join('');
    var ok = (p === want);
    return { state: ok ? 'correct' : 'wrong', picked: p, ok: ok, pts: ok ? q.pts : 0, taboo: taboo };
  }

  function exam(examId) {
    var d = window.MecMockData && window.MecMockData[examId];
    if (!d) throw new Error('模試データが読み込まれていない: ' + examId);
    return d;
  }
  function qkey(q) { return q.block + q.no; }

  // ── 解答の読み書き ─────────────────────────────────────────
  function getAnswers(examId) {
    var st = store(examId), out = {};
    for (var k in st.round.ans) out[k] = st.round.ans[k].p;
    return out;
  }
  function setAnswer(examId, key, raw) {
    var d = exam(examId), q = null;
    for (var i = 0; i < d.questions.length; i++) {
      if (qkey(d.questions[i]) === key) { q = d.questions[i]; break; }
    }
    if (!q) return null;
    var p = normPick(q, raw), st = store(examId);
    if (p) st.round.ans[key] = { p: p, t: Date.now() };
    else delete st.round.ans[key];
    _write(st.all);
    return p;
  }
  function clearBlock(examId, block) {
    var st = store(examId), n = 0;
    for (var k in st.round.ans) if (k.charAt(0) === block) { delete st.round.ans[k]; n++; }
    _write(st.all);
    return n;
  }

  // ── 採点 ──────────────────────────────────────────────────
  // ⚠️ 入力済みのブロックだけを合計する。未入力ブロックは満点にも母数にも入れない
  //    ＝「まだA〜Cしか解いていない日」でも意味のある数字が出る。逆に言うと、
  //    ブロックを1問も入れていないと満点が減る。表示側はそれを明示すること。
  function score(examId, answers) {
    var d = exam(examId);
    var ans = answers || getAnswers(examId);
    var blocks = {}, rows = [];
    Object.keys(d.blocks).forEach(function (b) {
      blocks[b] = {
        block: b, entered: false, hisshu: !!d.blocks[b].hisshu,
        count: d.blocks[b].count, answered: 0, correct: 0, wrong: 0, blank: 0,
        pts: 0, max: d.blocks[b].total,
        ippan: { pts: 0, max: d.blocks[b].ippan },
        rinsho: { pts: 0, max: d.blocks[b].rinsho },
        taboo: []
      };
    });

    d.questions.forEach(function (q) {
      var k = qkey(q), r = judge(q, ans[k]), b = blocks[q.block];
      if (r.state !== 'blank') { b.entered = true; b.answered++; }
      if (r.state === 'correct') b.correct++;
      else if (r.state === 'wrong') b.wrong++;
      else b.blank++;
      b.pts += r.pts;
      (q.cat === '一般' ? b.ippan : b.rinsho).pts += r.pts;
      if (r.taboo) b.taboo.push(k);
      rows.push({ q: q, key: k, r: r });
    });

    var live = Object.keys(blocks).filter(function (b) { return blocks[b].entered; });
    function sum(list, f) { var s = 0; list.forEach(function (b) { s += f(blocks[b]); }); return s; }
    var hisshuB = live.filter(function (b) { return blocks[b].hisshu; });
    var ippanB = live.filter(function (b) { return !blocks[b].hisshu; });

    var total = { pts: sum(live, function (b) { return b.pts; }), max: sum(live, function (b) { return b.max; }) };
    var hisshu = { pts: sum(hisshuB, function (b) { return b.pts; }), max: sum(hisshuB, function (b) { return b.max; }), blocks: hisshuB };
    var ippan = { pts: sum(ippanB, function (b) { return b.pts; }), max: sum(ippanB, function (b) { return b.max; }), blocks: ippanB };
    [total, hisshu, ippan].forEach(function (o) { o.pct = o.max ? Math.round(o.pts / o.max * 1000) / 10 : null; });
    hisshu.need = HISSHU_PCT;
    hisshu.pass = hisshu.max ? (hisshu.pct >= HISSHU_PCT) : null;

    var hit = [];
    live.forEach(function (b) { hit = hit.concat(blocks[b].taboo); });
    var tabooOf = d.questions.filter(function (q) { return q.taboo && blocks[q.block].entered; }).length;

    return {
      examId: examId, blocks: blocks, live: live, rows: rows,
      total: total, hisshu: hisshu, ippan: ippan,
      taboo: { hit: hit, count: hit.length, of: tabooOf, max: TABOO_MAX, pass: hit.length <= TABOO_MAX },
      answered: sum(live, function (b) { return b.answered; }),
      count: sum(live, function (b) { return b.count; })
    };
  }

  // ── 科目別（cat1／cat2）の得点率 ─────────────────────────────
  // 入力済みブロックのみ。弱点の提示と、解説をどこから厚く書くかの材料。
  function bySubject(examId, answers) {
    var s = score(examId, answers), map = {};
    s.rows.forEach(function (row) {
      if (!s.blocks[row.q.block].entered) return;
      var k = row.q.cat1 + '／' + row.q.cat2;
      var m = map[k] || (map[k] = {
        cat1: row.q.cat1, cat2: row.q.cat2,
        n: 0, correct: 0, wrong: 0, blank: 0, pts: 0, max: 0, missKeys: []
      });
      m.n++; m.max += row.q.pts; m.pts += row.r.pts;
      if (row.r.state === 'correct') m.correct++;
      else { m[row.r.state === 'wrong' ? 'wrong' : 'blank']++; m.missKeys.push(row.key); }
    });
    return Object.keys(map).map(function (k) {
      var m = map[k];
      m.pct = m.max ? Math.round(m.pts / m.max * 1000) / 10 : 0;
      return m;
    }).sort(function (a, b) { return a.pct - b.pct || b.n - a.n; });
  }

  // ── 解説の重さ ────────────────────────────────────────────
  // 今後つくる解説HTMLはこれだけを読む（採点の内部構造に依存させない）。
  //   0 = 正解           … 確認だけでよい
  //   1 = 誤答           … なぜ間違えたかを書く
  //   2 = 未解答         … 知識が無い＝一から書く
  //   3 = 禁忌肢を踏んだ … 最優先。制度上ここが4問で不合格になる
  // ⚠️ 段の意味を増やすときは、この表と weights() の両方を直すこと。HTML 側に
  //    閾値を書かないこと（片方だけに新しい段が入って解釈が食い違う）。
  function weights(examId, answers) {
    var d = exam(examId), ans = answers || getAnswers(examId), out = {};
    d.questions.forEach(function (q) {
      var r = judge(q, ans[qkey(q)]);
      var w = r.taboo ? 3 : (r.state === 'blank' ? 2 : (r.state === 'wrong' ? 1 : 0));
      out[q.uid] = {
        uid: q.uid, block: q.block, no: q.no, weight: w, state: r.state,
        picked: r.picked, ans: q.ans, taboo: r.taboo,
        cat1: q.cat1, cat2: q.cat2, theme: q.theme, pdf: q.pdf
      };
    });
    return out;
  }

  // ── 解説（questions_{examId}.json）側の uid ────────────────
  // 採点ツールの uid（m121s_A_q17）と解説側の uid（m121s_ch01_q17）は**別物**。
  // 前者はブロックごとに1から振り直された紙面の番号、後者は study.html の規約②
  // 「Q.n は科目内で通し」に従う番号（引き継ぎ §6-0）。
  // ⚠️⚠️ 対応を数式で2か所に書かないこと。ここが唯一の正本で、
  //    _work/build_mock_m121s_json.py も同じ規則（ブロックの count を積む）で作る。
  //    _work/test_mock_questions.js が両者の一致を見張る。
  // ⚠️ 章の順は 'ABCDEF' のブロック順そのもの。ブロックを増やす模試が来たら
  //    d.blocks のキーの順（＝解答表の並び）に従わせること。
  function studyUid(examId, block, no) {
    var d = exam(examId), ks = Object.keys(d.blocks), seq = 1, ch = 0;
    for (var i = 0; i < ks.length; i++) {
      if (ks[i] === block) { ch = i + 1; break; }
      seq += d.blocks[ks[i]].count;
    }
    if (!ch) return '';
    return examId + '_ch' + (ch < 10 ? '0' : '') + ch + '_q' + (seq + no - 1);
  }

  // ── 周回 ─────────────────────────────────────────────────
  function rounds(examId) { return Object.keys(store(examId).exam.rounds).sort(); }
  function currentRound(examId) { return store(examId).exam.cur; }
  function useRound(examId, id) {
    var st = store(examId);
    if (!st.exam.rounds[id]) st.exam.rounds[id] = { started: Date.now(), graded: 0, ans: {} };
    st.exam.cur = id; _write(st.all); return id;
  }
  function newRound(examId) {
    var st = store(examId), n = 1;
    while (st.exam.rounds['r' + n]) n++;
    return useRound(examId, 'r' + n);
  }
  function markGraded(examId) { var st = store(examId); st.round.graded = Date.now(); _write(st.all); }
  function gradedAt(examId) { return store(examId).round.graded || 0; }
  function border(examId, v) {
    var st = store(examId);
    if (v === undefined) return st.exam.border == null ? null : st.exam.border;
    st.exam.border = (v === null || v === '') ? null : Number(v);
    _write(st.all);
    return st.exam.border;
  }

  window.MecMock = {
    KEY: KEY, HISSHU_PCT: HISSHU_PCT, TABOO_MAX: TABOO_MAX,
    normPick: normPick, judge: judge, qkey: qkey,
    getAnswers: getAnswers, setAnswer: setAnswer, clearBlock: clearBlock,
    score: score, bySubject: bySubject, weights: weights, studyUid: studyUid,
    rounds: rounds, currentRound: currentRound, useRound: useRound,
    newRound: newRound, markGraded: markGraded, gradedAt: gradedAt, border: border,
    _read: _read
  };
})();
