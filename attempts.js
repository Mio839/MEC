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
//   c    : 選んだ肢を半角小文字で連結（複数選択は昇順 "ac"）。不明時は空
//   o    : 1=正解 / 0=誤答
//   s    : 所要秒（カードが画面に出てから解答するまで）。不明・異常値は空
//   m    : モード e=試験 / s=SRS復習 / c=章別試験
//   sess : セッションID（起動ごとに生成）
//   n    : そのセッションで何問目か（1始まり）
//
// オブジェクトのままJSONに載せるとGist同期のpayloadが pretty-print で桁違いに膨らむ
// （payloadは JSON.stringify(payload, null, 2)）。文字列1行なら2000件でも約130KBに収まる。
//
// ■ 同期
// 追記専用なので sess+n をキーにした union でマージできる（衝突しない）。
// マージ本体は progress.js の _mergeRemote 側に置いてある（同期規則の正本をそこに集約するため）。

(function () {
  'use strict';

  const K_ATT = 'mec_attempts_v1';
  const CAP = 2000;              // 上限件数。1日50問なら約40日分・実測120KB前後
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

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(K_ATT) || '[]');
      return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }

  function write(arr) {
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
    return [
      a.uid,
      Math.floor(Date.now() / 60000),
      a.choice || '',
      a.ok ? 1 : 0,
      (a.sec === null || a.sec === undefined) ? '' : a.sec,
      a.mode || 'e',
      a.sess || '',
      a.n || 0,
    ].join('|');
  }

  const MecAttempts = {
    KEY: K_ATT,
    CAP,
    FIELDS: ATT_FIELDS,
    normChoice,

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

    // 直近 n 件
    recent(n) {
      const a = this.all();
      return n ? a.slice(-n) : a;
    },

    clear() {
      try { localStorage.removeItem(K_ATT); } catch {}
    },
  };

  window.MecAttempts = MecAttempts;
})();
