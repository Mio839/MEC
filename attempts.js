// attempts.js — 解答イベントログ（mec_attempts_v1）
//
// 既存の myrate_v1 / mec_choice_v1 は「集計値」しか持たないため、時間軸・出題順・所要時間・
// 「前回正解 → 今回誤答」といった傾向が構造的に取り出せない。ここでは1解答=1レコードの
// 生ログを追記して、後段の分析（弱点カルテ・AI相談）の素材にする。
//
// ■ 保存形式
// 1レコード = パイプ区切りの1文字列。フィールド順は ATT_FIELDS で固定する。
//   uid | t | c | o | s | m | sess | n
//   例: "circ_ch03_q12|29384512|c|0|14|e|k3f9a1|23"
//
//   uid  : 問題UID（'|' を含まない前提）
//   t    : 分単位のepoch（Date.now()/60000）。秒精度は要らないので3桁節約する
//   c    : 選んだ肢を半角小文字で連結（複数選択は昇順 "ac"）。不明時は空。
//          計算問題（入力型・calc_input.js）は肢が無いので**入力した桁列**が入る
//          （例 "36" / 未入力の桁がある場合は "3_"）。誤答値そのものが誤りの構造を示す
//          ため（心係数でBSAを割り忘れれば 36 が出る等）、a〜eに丸めずそのまま残す。
//   o    : 1=正解 / 0=誤答
//   s    : 所要秒（カードが画面に出てから解答するまで）。不明・異常値は空
//   m    : モード e=試験 / s=SRS復習 / c=章別試験
//   sess : セッションID（起動ごとに生成）
//   n    : そのセッションで何問目か（1始まり）
//   r    : （任意・9番目・2026-09-28〜）その問題の全国正答率（整数%）。無ければ付けない。
//          上限からあふれて集計へ畳むときの「難問（<60%）」の判定材料。study.html は
//          rate_index.js を読まないので、行に持たせておかないと畳んだ時点で難問が数えられない。
//          ⚠️ 8項目の古い行と混在してよい（読む側は9番目を任意として扱う）。
//
// ■ 上限からあふれた行（2026-09-28〜）
// 捨てずにセッション単位の集計 mec_attempts_roll_v1 へ畳む。本体は progress.js の attCompact /
// attStore（同期の規則と同じ場所に置く）。ここは追記のたびに attStore を通すだけ。
// 期間の集計を出す側は all()（生ログ）と roll()（畳んだ分）の両方を読むこと。
//
// オブジェクトのままJSONに載せるとGist同期のpayloadが pretty-print で桁違いに膨らむ
// （payloadは JSON.stringify(payload, null, 2)）。文字列1行なら5000件でも約215KBに収まる。
//
// ■ 同期
// 追記専用なので sess+n をキーにした union でマージできる（衝突しない）。
// マージ本体は progress.js の _mergeRemote 側に置いてある（同期規則の正本をそこに集約するため）。

(function () {
  'use strict';

  const K_ATT = 'mec_attempts_v1';
  const K_ROLL = 'mec_attempts_roll_v1';   // progress.js の K_ATT_ROLL と一致させること
  // 上限件数。1行≒43B なので 5000件で約215KB（localStorage・Gist payload とも余裕がある）。
  // ⚠️ 2026-08-06に 2000 → 5000 へ引き上げた。実データで1日1434解答の日があり、2000件では
  //    バッファが約1.4日分しか持たない＝今日たくさん解くと「昨日の誤答」がその日のうちに
  //    古い方から消えていく（実際に満杯2000/2000で 08-04と08-05 の2日分しか残っていなかった）。
  //    ⚠️ progress.js の ATT_CAP と必ず一致させること（同期マージ側も同じ長さで切り詰める）。
  const CAP = 5000;
  const MAX_SEC = 600;           // これを超える所要秒は「離席」とみなし記録しない
  const ATT_FIELDS = ['uid', 't', 'c', 'o', 's', 'm', 'sess', 'n'];

  // 全角ａ-ｅ・丸数字混じりの選択肢ラベルを半角小文字1文字に寄せる
  function normChoice(raw) {
    if (!raw) return '';
    const ch = String(raw).trim().charAt(0);
    if (!ch) return '';
    const code = ch.charCodeAt(0);
    // 全角ａ(0xFF41)〜ｚ / Ａ(0xFF21)〜Ｚ
    if (code >= 0xFF41 && code <= 0xFF5A) return String.fromCharCode(code - 0xFF41 + 97);
    if (code >= 0xFF21 && code <= 0xFF3A) return String.fromCharCode(code - 0xFF21 + 97);
    if (/[a-zA-Z]/.test(ch)) return ch.toLowerCase();
    return '';
  }

  // JSTの日付（YYYY-MM-DD）。study.html の _today() / index.html の _jstDay() と同じ式。
  function jstDay(ms) {
    return new Date(ms + 9 * 3600000).toISOString().slice(0, 10);
  }

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(K_ATT) || '[]');
      return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }

  function write(arr) {
    // progress.js があれば、あふれた分を集計へ畳んでから書く（全ページで progress.js が先に読まれる）
    // ⚠️ 上限以下の追記は素通しでよい（新しく足した行が集計に畳まれ済みのことは無い）。
    //    毎回 attStore を通すと5,000行の分解と並べ替えが1解答ごとに走る（実測 約4ms）。
    if (arr.length > CAP && window.MECSync && window.MECSync.attStore) {
      try { window.MECSync.attStore(arr); return; } catch (e) {}
    }
    try {
      localStorage.setItem(K_ATT, JSON.stringify(arr.slice(-CAP)));
    } catch (e) {
      // 容量超過時は古い方から半分捨てて一度だけ再試行する（他キーを巻き添えにしない）
      try { localStorage.setItem(K_ATT, JSON.stringify(arr.slice(-Math.floor(CAP / 2)))); } catch {}
    }
  }

  function decode(line) {
    const p = String(line).split('|');
    if (p.length < ATT_FIELDS.length) return null;
    const o = {};
    ATT_FIELDS.forEach((f, i) => { o[f] = p[i]; });
    if (!o.uid) return null;
    return {
      uid: o.uid,
      t: Number(o.t) || 0,               // 分単位epoch
      ms: (Number(o.t) || 0) * 60000,    // 扱いやすいようミリ秒も持たせる
      choice: o.c || '',
      ok: o.o === '1',
      sec: o.s === '' ? null : Number(o.s),
      mode: o.m || 'e',
      sess: o.sess || '',
      n: Number(o.n) || 0,
    };
  }

  function encode(a) {
    const r = (typeof a.rate === 'number' && isFinite(a.rate) && a.rate >= 0) ? '|' + Math.round(a.rate) : '';
    return [
      a.uid,
      Math.floor(Date.now() / 60000),
      a.choice || '',
      a.ok ? 1 : 0,
      (a.sec === null || a.sec === undefined) ? '' : a.sec,
      a.mode || 'e',
      a.sess || '',
      a.n || 0,
    ].join('|') + r;
  }

  const MecAttempts = {
    KEY: K_ATT,
    CAP,
    FIELDS: ATT_FIELDS,
    normChoice,
    jstDay,

    // セッションIDを新規発行（起動ごと・再開ごとに1つ）
    newSession() {
      return Math.random().toString(36).slice(2, 8);
    },

    // 1解答を記録する。seenAt を渡すと所要秒を自動計算する。
    // uid に '|' が入り得るデータは扱わない（現行のUID規則では発生しない）
    log(a) {
      if (!a || !a.uid || a.uid.indexOf('|') !== -1) return;
      let sec = a.sec;
      if (sec === undefined && a.seenAt) sec = Math.round((Date.now() - a.seenAt) / 1000);
      if (typeof sec !== 'number' || !isFinite(sec) || sec < 0 || sec > MAX_SEC) sec = null;
      const arr = read();
      arr.push(encode({
        uid: a.uid,
        choice: (a.choice || '').toLowerCase(),
        ok: !!a.ok,
        sec,
        mode: a.mode || 'e',
        sess: a.sess || '',
        n: a.n || 0,
        rate: a.rate,
      }));
      write(arr);
      if (window.MECSync && window.MECSync.scheduleSync) window.MECSync.scheduleSync();
    },

    // 生の文字列配列（同期・バックアップ用）
    raw: read,

    // デコード済みオブジェクト配列（古い順）。分析側はこれを使う
    all() {
      return read().map(decode).filter(Boolean).sort((x, y) => x.t - y.t);
    },

    // 上限からあふれて畳まれた分（progress.js の attCompact が書く）。
    // { sess: { u, br, tr, l, d: { 'YYYY-MM-DD': { sid: [解答数, 正解数, 難問数, 難問の正解数] } } } }
    roll() {
      try {
        const v = JSON.parse(localStorage.getItem(K_ROLL) || '{}');
        return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      } catch { return {}; }
    },

    // 直近 n 件
    recent(n) {
      const a = this.all();
      return n ? a.slice(-n) : a;
    },

    // 今日（JST）落とした問題のUID。最初に落とした順・同じ問題は1件にまとめる。
    // 「今日の誤答を再履修」（ハブの3つ目のボタン → study.html?mode=today_wrong）の正本。
    //
    // ⚠️ あとで正解し直したかは見ない＝「今日間違えた問題すべて」を返す。
    //    再履修で正解してもリストからは消えない（その日の取りこぼしの記録として残す）。
    // ⚠️ 母数はこのログに残るものだけ＝試験モード・SRS復習・章別試験。通常モードの「済」は
    //    正誤を持たない（done_v2 は uid→周回数だけ）ので構造的に対象外。
    // ⚠️ 返すのは生のUIDで、科目の実在チェックも採点除外の判定もしない。
    //    出題側（study.html の startTodayWrongReview）が STUDY_SUBJECTS と
    //    _isScoreExcluded で絞るため、件数がハブの表示より少なくなることがある。
    todayWrongUids() {
      return this._wrongUidsForDay(0);
    },

    // daysAgo 日前（JST）に落とした問題のUID。0=今日。拾う規則は上の通り。
    _wrongUidsForDay(daysAgo) {
      const day = jstDay(Date.now() - (daysAgo || 0) * 86400000);
      const seen = new Set(), out = [];
      this.all().forEach(a => {
        if (a.ok || seen.has(a.uid)) return;
        if (jstDay(a.ms) !== day) return;
        seen.add(a.uid);
        out.push(a.uid);
      });
      return out;
    },

    clear() {
      try { localStorage.removeItem(K_ATT); localStorage.removeItem(K_ROLL); } catch {}
    },
  };

  window.MecAttempts = MecAttempts;
})();
