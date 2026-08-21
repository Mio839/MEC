// calc_input.js — 計算問題の桁入力エンジン（window.MecCalc）
//
// ■ 何のためにあるか
// 原文がマークシートの桁入力（"解答：①. ② ℓ/分/m2"）である計算問題は、選択肢が1つも
// 無いため試験モードで解答不能だった。採点は `.ch2.ok` の個数で決まる仕様（CLAUDE.md
// 「採点データの不変条件」）なので、選択肢ゼロの問題は何をしても前に進めない。
//
// 選択肢を機械生成して5択にする案は採らなかった。正解の±10%で誤答肢を作ると、昇順に
// 並べた中央値が常に正解になり「真ん中を選べば当たる」を学習してしまう。myrate_v1 や
// mec_attempts_v1 に偽の正解が入り、弱点カルテ（stats.html）の calc 指標が実際より
// 良く出る。国試の計算問題は元から桁入力なので、本番と同じ入力型で採点する。
//
// ■ 正解データ
// カード内 `.ac`（ans_label）の "計算答：<桁文字列>" が正本。
//   "計算答：2.0" → 2桁・小数点は1桁目の後ろ / "計算答：0.40" → 3桁
// 先頭ゼロ・末尾ゼロが意味を持つため、正解は数値ではなく**桁文字列**として扱い、
// 採点は文字列の完全一致で行う（本番のマークシートと同じ厳しさ）。
// 形式の統一は `_work/normalize_calc_answers.js` が行った。
//
// ■ 共有する理由
// study.html（study_exam.js）と 国家試験過去問/*.html（chapter_exam.js）の両方に計算
// 問題がある。演出テーマ（EXAM_EFFECT_THEMES / CE_EFFECT_THEMES）でミラー実装が
// 乖離した前例があるため、ここは1ファイルを両方から読む。CSSも自前で注入して、
// 30個の過去問HTMLへスタイルを配る必要をなくしている。

(function () {
  'use strict';

  // ans_label の正規形。単位は問題文の解答テンプレート側に出ているので持たせない
  const CANON = /^計算答[：:]\s*([0-9]+(?:\.[0-9]+)?)\s*$/;

  // ── 正解の読み取り ─────────────────────────────────────
  function parse(text) {
    const m = String(text == null ? '' : text).trim().match(CANON);
    if (!m) return null;
    const answer = m[1];
    const dot = answer.indexOf('.');
    const digits = answer.replace('.', '');
    if (!digits.length || digits.length > 6) return null;   // 桁数の常識的な上限
    return { answer: answer, digits: digits, dec: dot < 0 ? null : dot };
  }

  // 入力型として扱えるカードか。選択肢が1つでもあれば通常の選択問題として扱う
  function spec(card) {
    if (!card || !card.querySelector) return null;
    if (card.querySelector('.ch2')) return null;
    const ac = card.querySelector('.ac');
    return ac ? parse(ac.textContent) : null;
  }
  const isCalc = card => !!spec(card);

  // ── 入力の正規化（全角数字・アラビア数字以外を弾く）──────
  function normDigit(ch) {
    if (!ch) return '';
    const c = ch.charCodeAt(0);
    if (c >= 0x30 && c <= 0x39) return ch;                  // 0-9
    if (c >= 0xFF10 && c <= 0xFF19) return String.fromCharCode(c - 0xFF10 + 0x30); // ０-９
    return '';
  }
  const normStr = s => String(s == null ? '' : s).split('').map(normDigit).join('');

  // ── CSS（1回だけ注入）───────────────────────────────────
  // 色は study.css / 過去問HTML の双方が持つ共通トークン名を参照する（両方で成立する）
  const CSS = `
.calc-input{margin:10px 0 4px;}
.calc-boxes{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.calc-box{width:2.4em;height:2.6em;text-align:center;font-size:1.35em;font-weight:700;
  font-variant-numeric:tabular-nums;color:var(--tx,#1A2332);background:var(--cb,#fff);
  border:2px solid var(--bd,#E0E5EB);border-radius:8px;padding:0;
  transition:border-color .15s ease, background-color .15s ease;}
.calc-box:focus{outline:none;border-color:var(--or,#1A237E);}
.calc-box.calc-filled{border-color:var(--ts,#5A6475);}
.calc-box:disabled{opacity:1;}
.calc-dot{font-size:1.5em;font-weight:900;line-height:1;padding:0 1px;color:var(--tx,#1A2332);
  align-self:flex-end;margin-bottom:.25em;}
.calc-unit{font-size:.95em;color:var(--ts,#5A6475);margin-left:2px;}
.calc-hint{font-size:.8em;color:var(--ts,#5A6475);margin-top:5px;}
.calc-hint[data-ready="1"]{color:var(--gr,#2D8C4E);font-weight:700;}
.calc-input.calc-correct .calc-box{border-color:var(--gr,#2D8C4E);background:var(--grl,#EAF7EE);}
.calc-input.calc-wrong .calc-box{border-color:var(--rd,#C0392B);background:var(--rdl,#FDEAEA);}
.calc-answer{margin-top:7px;font-size:.92em;font-weight:700;color:var(--gr,#2D8C4E);}
.calc-answer .calc-yours{color:var(--rd,#C0392B);font-weight:700;}
@keyframes calcDrumSpin{
  0%{transform:translateY(-4px) scale(0.95);opacity:0.6;}
  60%{transform:translateY(1px) scale(1.03);opacity:1;}
  100%{transform:translateY(0) scale(1);opacity:1;}
}
.calc-box.calc-spin{animation:calcDrumSpin .16s cubic-bezier(.2,.8,.4,1.2);}
@keyframes calcLockIn{
  0%{transform:scale(1);}
  50%{transform:scale(0.94) translateY(2px);}
  100%{transform:scale(1) translateY(0);}
}
.calc-input.calc-correct .calc-box, .calc-input.calc-wrong .calc-box{
  animation:calcLockIn .25s ease-out;
}
@keyframes calcShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}
  75%{transform:translateX(5px)}}
.calc-input.calc-shake .calc-boxes{animation:calcShake .28s ease;}
@media (prefers-reduced-motion: reduce){
  .calc-box{transition:none;}
  .calc-box.calc-spin{animation:none;}
  .calc-input.calc-correct .calc-box, .calc-input.calc-wrong .calc-box{animation:none;}
  .calc-input.calc-shake .calc-boxes{animation:none;}
}`;

  let cssDone = false;
  function ensureCss() {
    if (cssDone || typeof document === 'undefined') return;
    cssDone = true;
    const st = document.createElement('style');
    st.id = 'mec-calc-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ── UI 構築 ────────────────────────────────────────────
  function build(card) {
    const sp = spec(card);
    if (!sp) return null;
    const cs = card.querySelector('.cs');
    if (!cs) return null;
    let wrap = cs.querySelector('.calc-input');
    if (wrap) return wrap;                                   // 冪等
    ensureCss();

    wrap = document.createElement('div');
    wrap.className = 'calc-input';
    wrap.dataset.len = String(sp.digits.length);

    const boxes = document.createElement('div');
    boxes.className = 'calc-boxes';
    for (let i = 0; i < sp.digits.length; i++) {
      if (sp.dec !== null && i === sp.dec) {
        const dot = document.createElement('span');
        dot.className = 'calc-dot';
        dot.textContent = '.';
        boxes.appendChild(dot);
      }
      const inp = document.createElement('input');
      inp.className = 'calc-box';
      inp.type = 'text';
      inp.inputMode = 'numeric';           // iOS でテンキーを出す
      inp.autocomplete = 'off';
      inp.maxLength = 1;
      inp.dataset.i = String(i);
      inp.setAttribute('aria-label', (i + 1) + '桁目');
      boxes.appendChild(inp);
    }
    wrap.appendChild(boxes);

    const hint = document.createElement('div');
    hint.className = 'calc-hint';
    hint.textContent = '🔢 計算問題 — ' + sp.digits.length + '桁を入力（本番と同じ桁数です）';
    wrap.appendChild(hint);

    cs.appendChild(wrap);
    _wire(card, wrap);
    return wrap;
  }

  function _boxes(card) {
    return card ? Array.prototype.slice.call(card.querySelectorAll('.calc-box')) : [];
  }

  function _wire(card, wrap) {
    const bs = _boxes(card);
    bs.forEach((inp, i) => {
      // 数字1文字だけ受け付け、埋まったら次へ送る
      inp.addEventListener('input', function () {
        const v = normStr(this.value).slice(-1);
        this.value = v;
        this.classList.toggle('calc-filled', !!v);
        if (v) {
          this.classList.remove('calc-spin');
          void this.offsetWidth;
          this.classList.add('calc-spin');
        }
        if (v && bs[i + 1]) bs[i + 1].focus();
        _changed(card, wrap);
      });
      inp.addEventListener('keydown', function (e) {
        // 試験モードの 1/2/3・Enter が入力を奪わないよう document へ流さない
        e.stopPropagation();
        if (e.key === 'Backspace' && !this.value && bs[i - 1]) {
          e.preventDefault();
          bs[i - 1].value = '';
          bs[i - 1].classList.remove('calc-filled');
          bs[i - 1].focus();
          _changed(card, wrap);
        } else if (e.key === 'ArrowLeft' && bs[i - 1]) {
          e.preventDefault(); bs[i - 1].focus();
        } else if (e.key === 'ArrowRight' && bs[i + 1]) {
          e.preventDefault(); bs[i + 1].focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          wrap.dispatchEvent(new CustomEvent('calc-submit', { bubbles: true }));
        }
      });
      inp.addEventListener('focus', function () { this.select(); });
      // "36" をまとめて貼れるようにする
      inp.addEventListener('paste', function (e) {
        const txt = normStr((e.clipboardData || window.clipboardData).getData('text'));
        if (!txt) return;
        e.preventDefault();
        for (let k = 0; k < txt.length && bs[i + k]; k++) {
          bs[i + k].value = txt[k];
          bs[i + k].classList.add('calc-filled');
        }
        const last = Math.min(i + txt.length, bs.length - 1);
        bs[last].focus();
        _changed(card, wrap);
      });
    });
  }

  function _changed(card, wrap) {
    wrap.classList.remove('calc-shake');
    const hint = wrap.querySelector('.calc-hint');
    const done = isComplete(card);
    if (hint) hint.dataset.ready = done ? '1' : '0';
    card.dispatchEvent(new CustomEvent('calc-change', { bubbles: true, detail: { complete: done } }));
  }

  // ── 状態の読み取り ─────────────────────────────────────
  // 入力済みの桁を連結して返す（未入力の桁は '_' で埋め、何桁目が空かを残す）
  function value(card) {
    return _boxes(card).map(b => normStr(b.value) || '_').join('');
  }
  const isComplete = card => {
    const bs = _boxes(card);
    return bs.length > 0 && bs.every(b => !!normStr(b.value));
  };

  // 入力を「2.0」形式の表示用文字列にする
  function display(card) {
    const sp = spec(card);
    const v = value(card);
    if (!sp || sp.dec === null || sp.dec <= 0 || sp.dec >= v.length) return v;
    return v.slice(0, sp.dec) + '.' + v.slice(sp.dec);
  }

  // ── 採点 ───────────────────────────────────────────────
  // 部分点は付けない（本番のマークシートに部分点が無いのと同じ）
  function grade(card) {
    const sp = spec(card);
    if (!sp) return null;
    const entered = value(card);
    const correct = isComplete(card) && entered === sp.digits;
    return { correct: correct, entered: entered, display: display(card), answer: sp.answer, digits: sp.digits };
  }

  // 採点後に編集不可にして正誤を色で示す。誤答なら正解と自分の答えを並べて出す
  function lock(card, correct) {
    const wrap = card && card.querySelector('.calc-input');
    if (!wrap) return;
    const sp = spec(card);
    _boxes(card).forEach(b => { b.disabled = true; b.readOnly = true; });
    wrap.classList.remove('calc-shake');
    wrap.classList.add(correct ? 'calc-correct' : 'calc-wrong');
    const hint = wrap.querySelector('.calc-hint');
    if (hint) hint.remove();
    if (!correct && sp && !wrap.querySelector('.calc-answer')) {
      const d = document.createElement('div');
      d.className = 'calc-answer';
      const mine = display(card).indexOf('_') >= 0 ? '未入力' : display(card);
      d.textContent = '正解 ' + sp.answer + '（あなたの解答 ' + mine + '）';
      wrap.appendChild(d);
    }
  }

  // 未入力のまま確定しようとしたときの合図
  function shake(card) {
    const wrap = card && card.querySelector('.calc-input');
    if (!wrap) return;
    wrap.classList.remove('calc-shake');
    void wrap.offsetHeight;
    wrap.classList.add('calc-shake');
    const empty = _boxes(card).find(b => !normStr(b.value));
    if (empty) empty.focus();
  }

  // 再試験・中断復帰のためのリセット
  function reset(card) {
    const wrap = card && card.querySelector('.calc-input');
    if (!wrap) return;
    wrap.classList.remove('calc-correct', 'calc-wrong', 'calc-shake');
    const a = wrap.querySelector('.calc-answer');
    if (a) a.remove();
    _boxes(card).forEach(b => {
      b.disabled = false; b.readOnly = false; b.value = '';
      b.classList.remove('calc-filled');
    });
    if (!wrap.querySelector('.calc-hint')) {
      const sp = spec(card);
      const hint = document.createElement('div');
      hint.className = 'calc-hint';
      hint.dataset.ready = '0';
      hint.textContent = '🔢 計算問題 — ' + (sp ? sp.digits.length : 0) + '桁を入力（本番と同じ桁数です）';
      wrap.appendChild(hint);
    }
  }

  // 試験終了時に通常モードへ戻す（.cs は選択肢ゼロの空要素という元の姿に戻る）。
  // data-calc-init は消さない。確定操作のリスナーはカード自身に付いており、消すと次の試験で
  // 二重登録になる。UI本体（.calc-input）だけを外し、次回は build が作り直す。
  function destroy(card) {
    const wrap = card && card.querySelector('.calc-input');
    if (wrap) wrap.remove();
  }

  // 桁の外で数字キーを押されたとき、最初の空き桁へ入れる（打ち直しを強いない）
  function typeDigit(card, ch) {
    const d = normDigit(String(ch || '').charAt(0));
    if (!d) return false;
    const bs = _boxes(card).filter(b => !b.disabled);
    const target = bs.find(b => !normStr(b.value)) || bs[bs.length - 1];
    if (!target) return false;
    target.focus();
    target.value = d;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  // 未入力の桁があればそこへ、無ければ先頭へ寄せる
  const focusFirst = card => {
    const bs = _boxes(card).filter(b => !b.disabled);
    const t = bs.find(b => !normStr(b.value)) || bs[0];
    if (t) t.focus();
  };
  // 演出（ショックウェーブ等）は選択肢要素を掴む前提なので、入力型では枠をアンカーにする
  const anchor = card => (card && card.querySelector('.calc-boxes')) || null;
  // 桁入力中は試験モードの数字キー割り当てを止める
  const isEditing = () => {
    const a = typeof document !== 'undefined' ? document.activeElement : null;
    return !!(a && a.classList && a.classList.contains('calc-box'));
  };
  // 中断・再開用（入力途中の桁を保存／復元する）
  function restore(card, entered) {
    const bs = _boxes(card);
    const s = String(entered || '');
    bs.forEach((b, i) => {
      const v = normDigit(s[i] || '');
      b.value = v;
      b.classList.toggle('calc-filled', !!v);
    });
  }

  const api = {
    parse: parse, spec: spec, isCalc: isCalc, build: build,
    value: value, display: display, isComplete: isComplete,
    grade: grade, lock: lock, shake: shake, reset: reset, restore: restore, destroy: destroy,
    focusFirst: focusFirst, typeDigit: typeDigit, anchor: anchor, isEditing: isEditing,
    normStr: normStr,
  };

  if (typeof window !== 'undefined') window.MecCalc = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;  // テスト用
})();
