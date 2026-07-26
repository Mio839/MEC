/**
 * MEC Progress — shared localStorage + GitHub Gist sync module
 * Compatible with both Desktop MEC (.qcard) and OneDrive chapter pages (.qc)
 */
(function () {
  'use strict';

  const KD = 'done_v2', KF = 'flag_v2', KA = 'activity_v1', KR = 'myrate_v1', KT = 'studytime_v1', KE = 'mec_exam_resumes_v1', KDT = 'done_tombstones_v1';
  const KFT = 'flag_tombstones_v1'; // 旗解除の墓標（uid → 解除時刻ms）。同期で解除済み旗が復活するのを防ぐ
  const K_SRS = 'mec_srs_v1';
  const KRT = 'mec_exam_resume_tombstones_v1'; // deleted resume savedAt values
  const KRK = 'mec_exam_resume_key_tombs_v1'; // 中断データのキー別墓標（key → 削除時刻ms）。savedAt墓標だけでは他端末の古いコピーが復活するため
  const KER = 'error_reports_v1';
  const K_ERR_CLEARED = 'mec_err_cleared_at';
  const K_TOKEN = 'mec_gist_token', K_GIST = 'mec_gist_id', K_LAST_SYNC = 'mec_last_sync_v1';
  const K_GAMIFY = 'mec_gamify_v1'; // ゲーミフィケーション（bestStreak等の数値のみ・field-wise maxでマージ）
  const K_ATT = 'mec_attempts_v1';  // 解答イベントログ（attempts.js が追記・追記専用でunionマージ）
  const ATT_CAP = 2000;             // attempts.js の CAP と一致させること
  const K_MISSIONS = 'mec_missions_v1'; // 日次/週次ミッション進捗（端末別G-counter・同一(期間,端末,カウンタ)はmax）

  let syncTimer = null;
  let syncInProgress = false;
  let syncPendingRetry = false; // ネットワークエラーで同期に失敗し、オンライン復帰待ちの状態

  // session-level done tracking (resets on page reload)
  window.mecSessionDone = new Set();

  // ── Core storage ─────────────────────────────────────────────────
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } }
  function lsRaw(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        _handleStorageQuota();
        // 容量確保後に元の書き込みをリトライしないと、そのとき押した済/旗が黙って消える
        try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
      }
    }
  }
  // 容量が尽きたときに何を捨てるか。
  // 捨てる順は「再現できるもの・粒度が粗くても困らないもの」から。
  //   ① attempts … 追記専用の生ログ。上限2000件で最も太い（1件≒40B＝最大80KB）。
  //                 集計済みの myrate_v1 が別にあるので、古い明細を落としても
  //                 弱点カルテの傾向は残る。まずここを半分にする。
  //   ② activity … 日ごとの回数。30日より前は連続日数の計算にも30日グラフにも使わない。
  //   ③ 中断データ … 再開できなくなるだけで学習記録そのものは失わない。
  // done_v2 / flag_v2 / myrate_v1 / mec_srs_v1 は学習の本体なので絶対に捨てない。
  // 旧実装は activity しか削っておらず、実際に太る attempts に触れていなかった。
  function _handleStorageQuota() {
    document.querySelectorAll('.mec-sync-badge').forEach(el => {
      el.textContent = '⚠️ ストレージ不足';
      el.dataset.status = 'error';
      el.title = 'localStorageの空き容量が不足しています。古い解答ログ・学習記録を削除して容量を確保しました。';
    });
    try {
      const att = JSON.parse(localStorage.getItem(K_ATT) || '[]');
      if (Array.isArray(att) && att.length > 200) {
        localStorage.setItem(K_ATT, JSON.stringify(att.slice(-Math.floor(att.length / 2))));
      }
    } catch {}
    try {
      const a = JSON.parse(localStorage.getItem(KA) || '{}');
      const keys = Object.keys(a).sort();
      if (keys.length > 30) {
        keys.slice(0, keys.length - 30).forEach(k => delete a[k]);
        localStorage.setItem(KA, JSON.stringify(a));
      }
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem(KE) || '[]');
      if (Array.isArray(r) && r.length > 1) {
        localStorage.setItem(KE, JSON.stringify(r.slice(0, 1)));
      }
    } catch {}
  }

  // ── Utilities ────────────────────────────────────────────────────
  // JST (UTC+9) で日付文字列を生成 — UTCだと日本時間21時以降に日付が翌日にずれる
  function todayStr() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }

  function _fmtTimeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'たった今';
    if (diff < 60) return diff + '分前';
    if (diff < 1440) return Math.floor(diff / 60) + '時間前';
    return Math.floor(diff / 1440) + '日前';
  }

  function logActivity() {
    const log = lsGet(KA);
    const today = todayStr();
    log[today] = (log[today] || 0) + 1;
    const keys = Object.keys(log).sort();
    if (keys.length > 90) keys.slice(0, keys.length - 90).forEach(k => delete log[k]);
    lsRaw(KA, log);
  }
  // 試験モード側（study_exam.js の _markExamDone）からも呼ぶ。ここを通さないと
  // 試験モードだけで学習した日が activity_v1 に残らず、連続日数も学習記録も0のままになる。
  window.mecLogActivity = logActivity;

  // ── Gist sync ────────────────────────────────────────────────────
  function scheduleSync() {
    if (!localStorage.getItem(K_TOKEN)) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushToGist, 30000);
  }

  async function syncFromGist() {
    const token = localStorage.getItem(K_TOKEN) || '';
    const gistId = localStorage.getItem(K_GIST) || '';
    if (!token || !gistId) return { status: 'no-config' };

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (!res.ok) {
        const detail = res.status === 401 ? 'トークン無効／期限切れ' : res.status === 404 ? 'Gist未検出' : `HTTP ${res.status}`;
        _setSyncBadge('error', detail);
        return { status: 'error', code: res.status, detail };
      }
      const data = await res.json();
      const raw = data.files?.['mec_progress.json']?.content;
      if (!raw) return { status: 'empty' };
      _mergeRemote(JSON.parse(raw));
      localStorage.setItem(K_LAST_SYNC, new Date().toISOString());
      _setSyncBadge('synced');
      syncPendingRetry = false;
      return { status: 'ok' };
    } catch (e) {
      _setSyncBadge('error', 'ネットワークエラー');
      syncPendingRetry = true;
      return { status: 'error', message: e.message };
    }
  }

  async function pushToGist() {
    if (syncInProgress) return;
    const token = localStorage.getItem(K_TOKEN) || '';
    if (!token) return;
    // payload を組む前に、ページ側の遅延書き込みを localStorage へ確定させる
    // （でないと直前の解答ぶんが送信対象から漏れる）
    try { window.mecFlushPending?.(); } catch {}
    let gistId = localStorage.getItem(K_GIST) || '';
    syncInProgress = true;
    _setSyncBadge('syncing');

    // read-modify-write: リモートを取り込んでからpushしないと、他デバイスが
    // 先にpushした進捗をローカル状態で丸ごと上書きして喪失させる
    if (gistId) {
      try {
        const pre = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
        });
        if (pre.ok) {
          const raw = (await pre.json()).files?.['mec_progress.json']?.content;
          if (raw) _mergeRemote(JSON.parse(raw));
        }
        // 401/404 等はこの後のpush本体が同じエラーを踏んでバッジ表示するため続行
      } catch { /* ネットワーク断: push本体のcatchで処理される */ }
    }

    const payload = {};
    [KD, KF, KA, KR, KT, KDT, KFT, K_SRS, 'mec_choice_v1', K_GAMIFY, K_MISSIONS].forEach(k => { try { payload[k] = JSON.parse(localStorage.getItem(k) || '{}'); } catch { payload[k] = {}; } });
    try { payload[KE] = JSON.parse(localStorage.getItem(KE) || '[]'); } catch { payload[KE] = []; }
    try { payload[KRT] = JSON.parse(localStorage.getItem(KRT) || '[]'); } catch { payload[KRT] = []; }
    try { payload[KRK] = JSON.parse(localStorage.getItem(KRK) || '{}'); } catch { payload[KRK] = {}; }
    try { payload[KER] = JSON.parse(localStorage.getItem(KER) || '[]'); } catch { payload[KER] = []; }
    try { payload[K_ATT] = JSON.parse(localStorage.getItem(K_ATT) || '[]'); } catch { payload[K_ATT] = []; }
    try { payload['mec_ch_exam_v1'] = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}'); } catch { payload['mec_ch_exam_v1'] = {}; }
    payload._errClearedAt = localStorage.getItem(K_ERR_CLEARED) || '';
    payload._ts = new Date().toISOString();

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    };
    // インデントを付けない。attempts(最大2000件)・done(7000件超)・srs を毎回まるごと送るので、
    // pretty-print は転送量を1.5倍にするだけで誰も読まない（Gistの中身を直接読む運用は無い）。
    const body = JSON.stringify({
      description: 'MEC 医師国試 学習進捗',
      public: false,
      files: { 'mec_progress.json': { content: JSON.stringify(payload) } }
    });

    try {
      let res;
      if (gistId) {
        res = await fetch(`https://api.github.com/gists/${gistId}`, { method: 'PATCH', headers, body });
      } else {
        res = await fetch('https://api.github.com/gists', { method: 'POST', headers, body });
        if (res.ok) { const d = await res.json(); localStorage.setItem(K_GIST, d.id); }
      }
      if (res.ok) {
        localStorage.setItem(K_LAST_SYNC, new Date().toISOString());
        _setSyncBadge('synced');
        syncPendingRetry = false;
        return { status: 'ok' };
      }
      const errBody = await res.json().catch(() => ({}));
      const ghMsg = errBody.message || '';
      const errDetail = res.status === 401 ? 'トークン無効／期限切れ'
        : res.status === 404 ? 'Gist未検出'
        : res.status === 403 ? `アクセス拒否（書き込み権限不足）${ghMsg ? ' / ' + ghMsg : ''}`
        : res.status === 422 ? 'データ形式エラー'
        : `HTTP ${res.status}${ghMsg ? ' / ' + ghMsg : ''}`;
      _setSyncBadge('error', errDetail);
      return { status: 'error', code: res.status, message: ghMsg };
    } catch (e) {
      _setSyncBadge('error', 'ネットワークエラー');
      syncPendingRetry = true;
      return { status: 'error', message: e.message };
    } finally {
      syncInProgress = false;
    }
  }

  // オフライン→オンライン復帰時に、ネットワークエラーで失敗した同期を自動再送する
  window.addEventListener('online', () => {
    if (syncPendingRetry && localStorage.getItem(K_TOKEN)) {
      pushToGist();
    }
  });

  function _mergeRemote(remote) {
    // ページ側が遅延書き込み（study.html の mec_srs_v1 / mec_choice_v1）を抱えていたら、
    // マージ前に localStorage へ吐き切らせる。順序を守らないと、マージ結果が書かれた後に
    // 古いメモリ内容が上書きされ、他端末ぶんの進捗が静かに消える。
    try { window.mecFlushPending?.(); } catch {}
    // done: union, but tombstones (undo-to-zero) propagate deletions
    const ld = lsGet(KD), rd = remote[KD] || {};
    const localTombs = lsGet(KDT), remoteTombs = remote[KDT] || {};
    const mergedTombs = { ...remoteTombs };
    Object.keys(localTombs).forEach(k => { mergedTombs[k] = Math.max(mergedTombs[k] || 0, localTombs[k]); });
    Object.keys(mergedTombs).forEach(uid => { delete rd[uid]; delete ld[uid]; });
    const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
    Object.keys(mergedTombs).forEach(k => { if (mergedTombs[k] < cutoff) delete mergedTombs[k]; });
    lsRaw(KDT, mergedTombs);
    const mergedDone = { ...rd };
    Object.keys(ld).forEach(k => { mergedDone[k] = Math.max(mergedDone[k] || 0, ld[k] || 0); });
    lsRaw(KD, mergedDone);
    // flag: 墓標つきunion。旗の値は設定時刻ms（旧形式は1）、墓標は解除時刻ms。
    // uidごとに「旗 vs 墓標」の新しい方が勝つ — 解除後に別端末の古い旗が同期されても
    // 復活せず、解除より後に付け直した旗は墓標より新しいので生き残る。
    // 旧形式の旗(値1)は必ず墓標より古い扱い＝解除が優先（意図と一致）。
    const lf = lsGet(KF), rf = remote[KF] || {};
    const lfTombs = lsGet(KFT), rfTombs = remote[KFT] || {};
    const mfTombs = { ...rfTombs };
    Object.keys(lfTombs).forEach(k => { mfTombs[k] = Math.max(mfTombs[k] || 0, lfTombs[k]); });
    const mf = { ...rf };
    Object.keys(lf).forEach(k => { mf[k] = Math.max(mf[k] || 0, lf[k] || 0); });
    Object.keys(mfTombs).forEach(uid => {
      if ((mf[uid] || 0) <= mfTombs[uid]) delete mf[uid]; // 墓標の方が新しい → 旗は解除済み
      else delete mfTombs[uid]; // 旗の方が新しい → 墓標は用済み
    });
    const flagCutoff = Date.now() - 60 * 24 * 3600 * 1000;
    Object.keys(mfTombs).forEach(k => { if (mfTombs[k] < flagCutoff) delete mfTombs[k]; });
    lsRaw(KFT, mfTombs);
    lsRaw(KF, mf);
    // activity: 日ごとの最大値
    const la = lsGet(KA), ra = remote[KA] || {};
    const ma = { ...la };
    Object.keys(ra).forEach(day => { ma[day] = Math.max(ma[day] || 0, ra[day] || 0); });
    lsRaw(KA, ma);
    // myrate: correct/total を各フィールドの最大値で統合する。
    // myrate は端末ごとに単調増加する累積カウンタ（{correct,total}）なので、フィールド
    // ごとに max を取れば履歴を取りこぼさない。旧「total が多い方を総取り」は片側の履歴を
    // まるごと捨てていた。加算は同一回答の二重計上になるため採らない。correct<=total も保たれる。
    const lr = lsGet(KR), rr = remote[KR] || {};
    const mr = { ...rr };
    Object.keys(lr).forEach(uid => {
      const l = lr[uid], r = mr[uid];
      if (!r) { mr[uid] = l; return; }
      mr[uid] = {
        correct: Math.max(l.correct || 0, r.correct || 0),
        total: Math.max(l.total || 0, r.total || 0),
      };
    });
    lsRaw(KR, mr);
    // choice(誤答選択肢の記録): 選択肢ごとの回数はmax、_last(最後に選んだ肢)は
    // タイムスタンプが無いためローカル優先（ローカルに記録がない問題のみリモート採用）。
    // 別端末で受けた試験の誤答復習でも「自分が選んだ肢」をマークできるようにする。
    const lc = lsGet('mec_choice_v1'), rc = remote['mec_choice_v1'] || {};
    if (Object.keys(rc).length) {
      const mc = { ...lc };
      Object.keys(rc).forEach(uid => {
        const r = rc[uid] || {}, l = mc[uid];
        if (!l) { mc[uid] = r; return; }
        Object.keys(r).forEach(ch => {
          if (ch === '_last') return;
          l[ch] = Math.max(l[ch] || 0, r[ch] || 0);
        });
        if (!l._last && r._last) l._last = r._last;
      });
      lsRaw('mec_choice_v1', mc);
    }
    // studytime: 日ごとの最大値
    const lt = lsGet(KT), rt = remote[KT] || {};
    const mt = { ...lt };
    Object.keys(rt).forEach(day => { mt[day] = Math.max(mt[day] || 0, rt[day] || 0); });
    lsRaw(KT, mt);
    // srs: lastSeen が新しい方（より最近の復習履歴）を優先
    const ls = lsGet(K_SRS), rs = remote[K_SRS] || {};
    const ms = { ...rs };
    Object.keys(ls).forEach(uid => {
      const rem = ms[uid], loc = ls[uid];
      if (!rem) { ms[uid] = loc; return; }
      const remDate = rem.lastSeen || '0000-00-00', locDate = loc.lastSeen || '0000-00-00';
      if (locDate >= remDate) ms[uid] = loc;
    });
    lsRaw(K_SRS, ms);
    // gamify: 数値フィールドは max（bestStreak等の単調増加カウンタ）、その他はローカル優先
    const lgm = lsGet(K_GAMIFY), rgm = remote[K_GAMIFY] || {};
    if (Object.keys(rgm).length) {
      const mgm = { ...lgm };
      Object.keys(rgm).forEach(k => {
        if (typeof rgm[k] === 'number') mgm[k] = Math.max(mgm[k] || 0, rgm[k]);
        else if (mgm[k] === undefined) mgm[k] = rgm[k];
      });
      lsRaw(K_GAMIFY, mgm);
    }
    // missions: 日次/週次ミッションの端末別カウンタ。構造 { d:{期間:{端末:{カウンタ:n}}}, w:{...} }。
    // 同一(期間,端末,カウンタ)は max（端末内は単調増加）＝表示時に端末横断 sum で合算される。
    // 別端末の分担ぶんが取りこぼされず「達成状況」が正しく共有される。
    const rmi = remote[K_MISSIONS];
    if (rmi && (rmi.d || rmi.w)) {
      const lmi = lsGet(K_MISSIONS);
      const mmi = { d: (lmi && lmi.d) || {}, w: (lmi && lmi.w) || {} };
      ['d', 'w'].forEach(pk => {
        const rp = rmi[pk] || {};
        Object.keys(rp).forEach(period => {
          mmi[pk][period] = mmi[pk][period] || {};
          const rdev = rp[period] || {};
          Object.keys(rdev).forEach(dev => {
            mmi[pk][period][dev] = mmi[pk][period][dev] || {};
            const rc = rdev[dev] || {};
            Object.keys(rc).forEach(c => {
              mmi[pk][period][dev][c] = Math.max(mmi[pk][period][dev][c] || 0, rc[c] || 0);
            });
          });
        });
      });
      // 古い期間を掃除（日次14件・週次10件）
      const keep = (obj, n) => { const ks = Object.keys(obj).sort(); while (ks.length > n) delete obj[ks.shift()]; };
      keep(mmi.d, 14); keep(mmi.w, 10);
      lsRaw(K_MISSIONS, mmi);
    }
    // attempts: 解答イベントログ（attempts.js の mec_attempts_v1）。1件=パイプ区切り1文字列で
    // "uid|t|c|o|s|m|sess|n"。端末ごとに追記されるだけで書き換わらないため、sess+n を一意キーに
    // した union で衝突なくマージできる。時刻(t・分単位epoch)の昇順に並べて上限件数で打ち切る。
    const latt = JSON.parse(localStorage.getItem(K_ATT) || '[]');
    const ratt = remote[K_ATT] || [];
    if (Array.isArray(ratt) && ratt.length) {
      const seen = new Set();
      const merged = [];
      (Array.isArray(latt) ? latt : []).concat(ratt).forEach(line => {
        if (typeof line !== 'string') return;
        const p = line.split('|');
        if (p.length < 8 || !p[0]) return;
        const key = p[6] + '|' + p[7];   // sess + セッション内の出題順
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(line);
      });
      merged.sort((a, b) => (Number(a.split('|')[1]) || 0) - (Number(b.split('|')[1]) || 0));
      localStorage.setItem(K_ATT, JSON.stringify(merged.slice(-ATT_CAP)));
    }
    // chapter exam history: 章ごとに bestScore の最大値を保持、sessions は最大値、日付は新しい方
    const lch = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}');
    const rch = remote['mec_ch_exam_v1'] || {};
    if (Object.keys(rch).length) {
      const mch = { ...lch };
      Object.keys(rch).forEach(prefix => {
        const l = mch[prefix], r2 = rch[prefix];
        if (!l) { mch[prefix] = r2; return; }
        const bestScore = Math.max(l.bestScore || 0, r2.bestScore || 0);
        const sessions = Math.max(l.sessions || 0, r2.sessions || 0);
        const useRemote = (r2.lastDate || '') > (l.lastDate || '');
        mch[prefix] = {
          lastDate: useRemote ? r2.lastDate : l.lastDate,
          sessions,
          bestScore,
          lastScore: useRemote ? r2.lastScore : l.lastScore,
          lastCorrect: useRemote ? r2.lastCorrect : l.lastCorrect,
          lastTotal: useRemote ? r2.lastTotal : l.lastTotal,
        };
      });
      localStorage.setItem('mec_ch_exam_v1', JSON.stringify(mch));
    }
    // exam resumes: 同じキーは savedAt が新しい方を優先、異なるキーはすべて保持（最大5件）
    const localR = JSON.parse(localStorage.getItem(KE) || '[]');
    const remoteR = remote[KE] || [];
    // Merge tombstones first (union of local + remote)
    const localTomb = JSON.parse(localStorage.getItem(KRT) || '[]');
    const remoteTomb = remote[KRT] || [];
    const allTomb = [...new Set([...localTomb, ...remoteTomb])];
    if (allTomb.length > localTomb.length) localStorage.setItem(KRT, JSON.stringify(allTomb.slice(-200)));
    // key-based tombstones: 「キーKは時刻Tに削除」を端末間で共有し、Tより古い同キーの
    // 中断データはローカル・リモートを問わず破棄する（savedAtは保存のたびに変わるため、
    // savedAt墓標だけでは他端末に残った古いコピーが復活してしまう）
    const localKT = lsGet(KRK);
    const remoteKT = remote[KRK] || {};
    const keyTomb = { ...localKT };
    Object.keys(remoteKT).forEach(k => { if ((remoteKT[k] || 0) > (keyTomb[k] || 0)) keyTomb[k] = remoteKT[k]; });
    const ktCutoff = Date.now() - 60 * 86400000; // 60日で失効（無限に溜めない）
    Object.keys(keyTomb).forEach(k => { if (keyTomb[k] < ktCutoff) delete keyTomb[k]; });
    lsRaw(KRK, keyTomb);
    const _resumeDead = e => allTomb.includes(e.savedAt) || (keyTomb[e.key] || 0) > (e.savedAt || 0);
    const keptLocalR = localR.filter(e => !_resumeDead(e));
    let resumesChanged = keptLocalR.length !== localR.length;
    const merged = [...keptLocalR];
    remoteR.forEach(re => {
      if (_resumeDead(re)) return; // skip tombstoned (deleted) entries
      const idx = merged.findIndex(e => e.key === re.key);
      if (idx >= 0) {
        if ((re.savedAt || 0) > (merged[idx].savedAt || 0)) { merged[idx] = re; resumesChanged = true; }
      } else {
        merged.push(re);
        resumesChanged = true;
      }
    });
    if (resumesChanged) {
      merged.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      localStorage.setItem(KE, JSON.stringify(merged.slice(0, 5)));
      document.dispatchEvent(new CustomEvent('mecResumesUpdated'));
    }
    // error reports: union by uid+type, respecting "clear all" operations
    const localER = JSON.parse(localStorage.getItem(KER) || '[]');
    const remoteER = remote[KER] || [];
    const localClearedAt = localStorage.getItem(K_ERR_CLEARED) || '';
    const remoteClearedAt = remote._errClearedAt || '';
    const effectiveClearedAt = localClearedAt > remoteClearedAt ? localClearedAt : remoteClearedAt;
    if (effectiveClearedAt > localClearedAt) localStorage.setItem(K_ERR_CLEARED, effectiveClearedAt);
    if (remoteER.length) {
      const keys = new Set(localER.map(r => r.uid + '|' + r.type));
      remoteER.forEach(r => {
        if (effectiveClearedAt && (r.reported_at || '') < effectiveClearedAt) return;
        if (!keys.has(r.uid + '|' + r.type)) localER.push(r);
      });
      localStorage.setItem(KER, JSON.stringify(localER));
    } else if (effectiveClearedAt > localClearedAt) {
      const filtered = localER.filter(r => (r.reported_at || '') >= effectiveClearedAt);
      localStorage.setItem(KER, JSON.stringify(filtered));
    }
  }

  function _setSyncBadge(status, detail) {
    const lastSync = localStorage.getItem(K_LAST_SYNC);
    const timeAgo = lastSync ? _fmtTimeAgo(lastSync) : '';
    const syncedHoursAgo = lastSync ? (Date.now() - new Date(lastSync).getTime()) / 3600000 : Infinity;
    const isStale = status === 'synced' && syncedHoursAgo > 24;
    const resolvedStatus = isStale ? 'stale' : status;
    document.querySelectorAll('.mec-sync-badge').forEach(el => {
      const map = {
        synced: '☁️ 同期済',
        stale: '⚠️ 未同期',
        syncing: '🔄 同期中...',
        error: '⚠️ 同期エラー',
        'no-config': '⚙️ 未設定'
      };
      el.textContent = map[resolvedStatus] || resolvedStatus;
      const titleParts = [];
      if (detail) titleParts.push(detail);
      if (timeAgo && (status === 'synced' || status === 'stale')) titleParts.push('最終同期: ' + timeAgo);
      if (isStale) titleParts.push('24時間以上同期されていません');
      el.title = titleParts.join('\n');
      el.dataset.status = resolvedStatus;
      el.dataset.detail = detail || '';
      el.dataset.timeAgo = timeAgo;
    });
  }

  function _showSyncInfoPopup(timeAgo, status) {
    const existing = document.getElementById('_mec_sync_popup');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = '_mec_sync_popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);padding:20px;';
    const staleNote = status === 'stale' ? '<div style="font-size:12px;color:#b05a00;margin-top:6px;">24時間以上同期されていません</div>' : '';
    overlay.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:300px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2);text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">${status === 'stale' ? '⚠️' : '☁️'}</div>
      <div style="font-weight:700;font-size:15px;color:#1a2636;margin-bottom:6px;">最終同期: ${timeAgo}</div>
      ${staleNote}
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button id="_mec_sync_now" style="flex:1;padding:10px;border-radius:10px;border:none;background:#2D6BE4;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">🔄 今すぐ同期</button>
        <button id="_mec_sync_close" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #dde2ea;background:#fff;color:#3a4a5c;font-size:14px;font-weight:700;cursor:pointer;">閉じる</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#_mec_sync_now').addEventListener('click', () => { overlay.remove(); pushToGist(); });
    overlay.querySelector('#_mec_sync_close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  function _showSyncErrorPopup(detail, timeAgo) {
    const existing = document.getElementById('_mec_sync_popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = '_mec_sync_popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);padding:20px;';

    let reasonHtml = '';
    if (detail === 'トークン無効／期限切れ') {
      reasonHtml = '<div style="font-size:13px;color:#c0392b;margin:8px 0;"><strong>原因：</strong>GitHub トークンの期限が切れているか、無効です。</div>'
        + '<div style="font-size:12px;color:#5a6475;margin-bottom:12px;">index.html の「⚙️ 同期設定」から新しいトークンを発行・設定してください。</div>';
    } else if (detail === 'Gist未検出') {
      reasonHtml = '<div style="font-size:13px;color:#c0392b;margin:8px 0;"><strong>原因：</strong>Gist ID が見つかりません。</div>'
        + '<div style="font-size:12px;color:#5a6475;margin-bottom:12px;">index.html の「⚙️ 同期設定」で Gist ID を再設定してください。</div>';
    } else if (detail === 'ネットワークエラー') {
      reasonHtml = '<div style="font-size:13px;color:#c0392b;margin:8px 0;"><strong>原因：</strong>ネットワーク接続を確認してください。</div>';
    } else if (detail) {
      reasonHtml = `<div style="font-size:13px;color:#c0392b;margin:8px 0;"><strong>エラー：</strong>${detail}</div>`;
    }

    const lastSyncLine = timeAgo ? `<div style="font-size:11px;color:#8a9ab0;margin-bottom:12px;">最終同期: ${timeAgo}</div>` : '';

    overlay.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.25);">
      <div style="font-weight:700;font-size:16px;color:#1a2636;margin-bottom:6px;">⚠️ 同期エラー</div>
      ${reasonHtml}${lastSyncLine}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="_mec_sync_retry" style="flex:1;padding:10px;border-radius:10px;border:none;background:#2D6BE4;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">🔄 再試行</button>
        <button id="_mec_sync_close" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #dde2ea;background:#fff;color:#3a4a5c;font-size:14px;font-weight:700;cursor:pointer;">閉じる</button>
      </div>
    </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#_mec_sync_retry').addEventListener('click', () => {
      overlay.remove();
      syncFromGist().then(r => {
        if (r.status === 'ok') {
          _initQcCards && _initQcCards();
          if (typeof window.applyFilters === 'function') window.applyFilters();
        }
      });
    });
    overlay.querySelector('#_mec_sync_close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Undo support for 済み ─────────────────────────────────────────
  window.mecUndoLap = function(uid, prevCount, lapBtnEl) {
    const done = lsGet(KD);
    if (prevCount <= 0) {
      delete done[uid]; window.mecSessionDone.delete(uid);
      const tombs = lsGet(KDT);
      tombs[uid] = Date.now();
      const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
      Object.keys(tombs).forEach(k => { if (tombs[k] < cutoff) delete tombs[k]; });
      lsRaw(KDT, tombs);
    } else { done[uid] = prevCount; }
    lsRaw(KD, done);
    window.mecMarkStale?.();
    scheduleSync();
    if (lapBtnEl) {
      const card = lapBtnEl.closest && lapBtnEl.closest('.qc, .qcard');
      // 取り消しは × / △ から押された可能性がある。カウンタと緑の塗りは常に ○ 側の
      // .mec-lap-btn が持つので、そちらを引き直す（押されたボタンを直接触ると
      // 周回数が消えないまま残る）。判定は mecIncrLap と同じく data-grade で行う。
      const g = (lapBtnEl.dataset && lapBtnEl.dataset.grade) || 'ok';
      const lapBtn = g === 'ok' ? lapBtnEl : (card && card.querySelector('.mec-lap-btn'));
      if (lapBtn && lapBtn.querySelector) {
        const numEl = lapBtn.querySelector('.mec-lap-num');
        if (numEl) numEl.textContent = prevCount > 0 ? prevCount : '';
        lapBtn.classList.toggle('mec-lapped', prevCount > 0);
      }
      if (card) {
        // 自己申告の選択表示も戻す（取り消した以上「今どう申告しているか」は無い）
        card.querySelectorAll('.mec-grade [data-grade]')
          .forEach(b => b.classList.remove('mec-grade-on'));
        card.classList.toggle('mec-done', prevCount > 0);
      }
    }
    _updateChapterProgress();
    if (typeof window.applyFilters === 'function') window.applyFilters();
  };

  // btn は × / △ / ○ のいずれか（data-grade）。旧・章ページ(selfcheck_intro.html)は
  // data-grade を持たない「済」1つなので、既定は 'ok' として従来どおり動く。
  // 3段階のどれを押しても「その問題を1周した」ことに変わりはないので、done_v2 の加算・
  // 学習日の記録・次カードへのスクロールは共通。違いはSRSへ渡す自己申告だけ。
  window.mecIncrLap = function (btn) {
    const uid = btn.dataset.uid;
    const grade = btn.dataset.grade || 'ok';
    const done = lsGet(KD);
    const prevCount = done[uid] || 0;
    done[uid] = prevCount + 1;
    lsRaw(KD, done);
    const isFirstThisSession = !window.mecSessionDone.has(uid);
    window.mecSessionDone.add(uid);
    window.mecMarkStale?.();
    if (isFirstThisSession) logActivity();
    scheduleSync();
    // ページ側がSRSを持つ場合は自己申告つきで復習キューへ反映（study.htmlが定義）
    try { window.mecOnLapSRS?.(uid, grade); } catch {}

    const lapCount = done[uid];
    // 周回数と緑の塗りは常に ○（.mec-lap-btn）が持つ。× や △ を押した場合は押した
    // ボタンにカウンタが無いので、同じカード内の ○ を引き直して更新する。
    // 判定は data-grade で行う（旧・章ページの「済」は data-grade を持たず既定が ok＝
    // それ自体が ○ に相当するので、そのまま自分を使う）。
    const lapBtn = grade === 'ok'
      ? btn
      : (btn.closest && (btn.closest('.mec-grade') || btn.closest('.qc, .qcard')))?.querySelector('.mec-lap-btn');
    const numEl = lapBtn && lapBtn.querySelector && lapBtn.querySelector('.mec-lap-num');
    if (numEl) numEl.textContent = lapCount;
    if (lapBtn && lapBtn.classList) lapBtn.classList.add('mec-lapped');

    const card = btn.closest('.qc, .qcard');
    if (card) card.classList.add('mec-done');
    _updateChapterProgress();

    const _src = (window._studyCards && window._studyCards.length)
      ? window._studyCards.map(m => m.el)
      : [...document.querySelectorAll('.qc[data-uid]')];
    const allCards = _src.filter(c => {
      if (c.style.display === 'none') return false;
      const sec = c.closest('[data-visible]');
      return !(sec && sec.dataset.visible === 'false');
    });
    const idx = card ? allCards.indexOf(card) : -1;
    if (idx !== -1) {
      const next = allCards[idx + 1];
      if (next) {
        setTimeout(() => {
          const hdr = document.querySelector('.st-hdr, .sn, .mec-ch-prog');
          const offset = hdr ? hdr.getBoundingClientRect().height + 24 : 140;
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const y = next.getBoundingClientRect().top + scrollY - offset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }, 300);
      }
    }
    window.mecShowUndoToast?.(uid, prevCount, btn);
    try { window.MecGamify?.onLap?.(uid, btn); } catch {}
    if (typeof window.applyFilters === 'function') window.applyFilters();
  };

  window.mecSetDone = window.mecIncrLap;

  window.mecToggleFlag = function (btn) {
    const uid = btn.dataset.uid, flags = lsGet(KF);
    const tombs = lsGet(KFT);
    let nowFlagged;
    if (flags[uid]) {
      delete flags[uid]; btn.classList.remove('mec-flagged');
      tombs[uid] = Date.now(); // 解除の墓標 — 同期での復活を防ぐ
      nowFlagged = false;
    } else {
      flags[uid] = Date.now(); btn.classList.add('mec-flagged');
      delete tombs[uid];
      nowFlagged = true;
    }
    btn.setAttribute('aria-pressed', String(nowFlagged));
    lsRaw(KFT, tombs);
    lsRaw(KF, flags);
    window.mecMarkStale?.();
    scheduleSync();
    try { window.MecGamify?.onFlag?.(uid, btn, nowFlagged); } catch {}
  };

  window.mecReportError = function(uid, type) {
    let reports = JSON.parse(localStorage.getItem(KER) || '[]');
    const idx = reports.findIndex(r => r.uid === uid && r.type === type);
    if (idx >= 0) {
      reports.splice(idx, 1);
      localStorage.setItem(KER, JSON.stringify(reports));
      scheduleSync();
      return false;
    }
    reports.push({ uid, type, reported_at: new Date().toISOString() });
    localStorage.setItem(KER, JSON.stringify(reports));
    scheduleSync();
    return true;
  };

  window.mecGetErrorReports = function() {
    return JSON.parse(localStorage.getItem(KER) || '[]');
  };

  // ── クリップボードコピー（iOS対応） ──────────────────────────────
  // iOS Safari では navigator.clipboard.writeText が拒否されることがある
  // （ホーム画面追加のPWA・Safariの設定・非セキュアコンテキスト）。しかも拒否は
  // 例外ではなく Promise の reject で返るため、.catch を書いていないと
  // 「ボタンを押しても何も起きない」になる。実際その状態だった。
  //
  // 対策として、まずユーザー操作の同期フレーム内で旧APIの execCommand を試す。
  // Promise を待つと iOS はユーザー操作の文脈を失い、あとから execCommand を
  // 呼んでも効かないので、順序を逆にはできない。
  //
  // iOS の execCommand には固有の作法がある:
  //   - textarea.select() だけでは選択されない。Range を作って Selection に入れる
  //   - readOnly にしないとソフトウェアキーボードがせり上がる
  //   - contentEditable を立てないと選択自体を受け付けない端末がある
  //   - display:none / visibility:hidden だとコピーできない（画面外に1pxで置く）
  function _copyLegacy(text) {
    // copy イベントで内容を直接書き込む。選択範囲に頼らないので確実で、
    // かつ「イベントが発火したか」が本当にコピーされたかの判定になる。
    // execCommand の戻り値は当てにならない（コピーしていなくても true を返す端末がある）。
    let fired = false;
    const onCopy = e => {
      fired = true;
      try {
        e.clipboardData.setData('text/plain', text);
        e.preventDefault();
      } catch { fired = false; }
    };
    document.addEventListener('copy', onCopy, true);

    let ret = false;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.textContent = text;   // .value はDOMに載らない。Range経路の端末のために実体も入れる
    ta.contentEditable = 'true';  // iOS: これが無いと選択を受け付けない端末がある
    ta.readOnly = false;     // 選択中は false。execCommand の直前に true へ戻す
    ta.inputMode = 'none';   // iOS: focus してもソフトウェアキーボードを出さない
    ta.setAttribute('aria-hidden', 'true');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;' +
      'border:none;outline:none;box-shadow:none;background:transparent;opacity:0;' +
      'font-size:16px;';  // 16px未満だとiOSが自動ズームする
    document.body.appendChild(ta);

    const prevActive = document.activeElement;
    const sel = window.getSelection();
    const prevRange = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    try {
      // 順序が重要。Range を張ると textarea 側の選択（selectionStart/End）が 0/0 に
      // 潰れるため、setSelectionRange は必ず最後に呼ぶ。逆にすると選択が空のまま
      // execCommand が走り、コピーしていないのに true が返る。
      ta.focus({ preventScroll: true });
      ta.select();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(ta);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      ta.setSelectionRange(0, text.length);
      ta.readOnly = true;   // キーボードのせり上がりを抑えつつコピーする
      ret = document.execCommand('copy');
    } catch { ret = false; }

    document.removeEventListener('copy', onCopy, true);
    ta.remove();
    // 元の選択とフォーカスを壊さない
    if (sel) {
      sel.removeAllRanges();
      if (prevRange) sel.addRange(prevRange);
    }
    if (prevActive && prevActive.focus) { try { prevActive.focus({ preventScroll: true }); } catch {} }
    return ret && fired;
  }

  // text をクリップボードへ入れる。成功可否を Promise<boolean> で返す。
  // 必ずクリックなどのユーザー操作から同期的に呼ぶこと。
  // 順序は「同期フレーム内で完結する execCommand」→「clipboard API」。
  // 逆にすると、clipboard API の reject を待った時点で iOS はユーザー操作の文脈を失い、
  // あとから execCommand を呼んでも効かなくなる。
  window.mecCopyText = function (text) {
    text = String(text == null ? '' : text);
    if (_copyLegacy(text)) return Promise.resolve(true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => false);
    }
    return Promise.resolve(false);
  };

  // ── エラー報告ビューア（study.html / index.html 共通） ─────────────────
  // 報告そのものは mecReportError / mecGetErrorReports が持っている。閲覧とコピーは
  // どのページからでも要るのでここに置く。ページ側に実装を置くと study と hub で
  // 二重管理になり、片方だけ直る事故が起きる（この repo で何度か起きている）。
  // モーダルのDOMとCSSは初回に注入するので、読み込むだけで使える。

  const ERR_TYPE_LABELS = {
    missing_image:       '🖼️ 画像なし',
    wrong_image_present: '🚫 画像不要',
    wrong_image:         '🔀 画像違い',
    unreadable:          '✂️ 問題文不完全',
    image_extract_error: '🔧 画像抽出エラー',
    choice_extract_error:'📋 選択肢エラー'
  };
  const SID_NAMES = {
    endo:'内分泌', resp:'呼吸器', circ:'循環器', dige:'消化器', neur:'神経',
    hbp:'肝胆膵', jinzo_d:'腎臓', hema:'血液', imma:'免アレ膠', kansen:'感染症',
    peds:'小児科', obg:'産婦人科', psy:'精神科', jitsu1:'実力試験', custom:'自作', memo:'暗記メモ'
  };
  window.mecErrTypeLabels = ERR_TYPE_LABELS;
  window.mecSidNames = SID_NAMES;

  // iOS（ホーム画面追加のPWA・Safariの「追加のダイアログ表示を許可しない」設定）では
  // confirm() がダイアログを出さずに即 false を返し「押しても何も起きない」になる。
  // ネイティブダイアログは使わず、ボタン自体の2段階タップ（3秒以内にもう一度）で確認する。
  window.mecTapConfirm = function (btn, armedLabel) {
    if (!btn) return true;
    if (btn.dataset.armed === '1') {
      clearTimeout(btn._armTimer);
      btn.dataset.armed = '';
      btn.classList.remove('tap-arm');
      btn.textContent = btn.dataset.origLabel || btn.textContent;
      return true;
    }
    btn.dataset.armed = '1';
    btn.dataset.origLabel = btn.textContent;
    btn.textContent = armedLabel;
    btn.classList.add('tap-arm');
    clearTimeout(btn._armTimer);
    btn._armTimer = setTimeout(() => {
      btn.dataset.armed = '';
      btn.textContent = btn.dataset.origLabel;
      btn.classList.remove('tap-arm');
    }, 3000);
    return false;
  };

  const ERR_CSS = `
#mecErrOv{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:var(--z-ov,9000);
  align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
#mecErrOv.open{display:flex;}
.mec-err-box{background:var(--surf-1,#16203a);border:1px solid rgba(255,255,255,.12);border-radius:16px;
  padding:20px;max-width:560px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:12px;}
.mec-err-box h3{font-size:15px;font-weight:800;color:var(--or,#FF9A3C);margin:0;}
.mec-err-list{overflow-y:auto;flex:1;font-size:12px;font-family:monospace;background:rgba(0,0,0,.35);
  border-radius:8px;padding:10px 12px;color:rgba(255,255,255,.8);white-space:pre-wrap;line-height:1.9;min-height:60px;}
.mec-err-msg{font-size:12px;color:var(--or,#FF9A3C);line-height:1.6;}
.mec-err-msg:empty{display:none;}
/* コピーが端末に拒否されたときの退避先。長押しで手動選択するため実体のあるtextareaを出す。
   font-size は16px以上にしないとiOSがフォーカス時に自動ズームする */
.mec-err-fallback{width:100%;min-height:96px;resize:vertical;font-size:16px;font-family:monospace;
  background:rgba(0,0,0,.45);border:1.5px solid rgba(255,154,60,.45);border-radius:8px;padding:10px 12px;
  color:rgba(255,255,255,.9);line-height:1.6;-webkit-user-select:text;user-select:text;}
.mec-err-fallback[hidden]{display:none;}
.mec-err-actions{display:flex;gap:8px;flex-wrap:wrap;}
.mec-err-copy{padding:7px 13px;border-radius:10px;border:1.5px solid rgba(255,154,60,.4);
  background:rgba(255,154,60,.1);color:var(--or,#FF9A3C);font-size:12px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:background .2s;}
.mec-err-copy:hover{background:rgba(255,154,60,.2);}
.mec-err-del{padding:7px 13px;border-radius:10px;border:1.5px solid rgba(255,107,107,.4);
  background:rgba(255,107,107,.08);color:var(--rd,#FF6B6B);font-size:12px;font-weight:700;
  font-family:inherit;cursor:pointer;}
.mec-err-close{padding:7px 13px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);
  background:none;color:rgba(255,255,255,.55);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;}
`;

  function _errEnsureDom() {
    let ov = document.getElementById('mecErrOv');
    if (ov) return ov;
    if (!document.getElementById('mecErrStyle')) {
      const st = document.createElement('style');
      st.id = 'mecErrStyle';
      st.textContent = ERR_CSS;
      document.head.appendChild(st);
    }
    ov = document.createElement('div');
    ov.id = 'mecErrOv';
    // 案内文は枠の前に置く（後ろだと「枠」がどれを指すか分からない）
    ov.innerHTML =
      '<div class="mec-err-box">' +
        '<h3>⚠️ エラー報告一覧</h3>' +
        '<div class="mec-err-list" id="mecErrList">（報告はまだありません）</div>' +
        '<div class="mec-err-msg" id="mecErrMsg"></div>' +
        '<textarea id="mecErrFallback" class="mec-err-fallback" readonly hidden></textarea>' +
        '<div class="mec-err-actions">' +
          '<button class="mec-err-copy" data-err="text">📋 テキストコピー</button>' +
          '<button class="mec-err-copy" data-err="json">📋 JSONコピー</button>' +
          '<button class="mec-err-del" data-err="clear">🗑️ 全消去</button>' +
          '<button class="mec-err-close" data-err="close">閉じる</button>' +
        '</div>' +
      '</div>';
    ov.addEventListener('click', e => {
      if (e.target === ov) { ov.classList.remove('open'); return; }
      const btn = e.target.closest('[data-err]');
      if (!btn) return;
      const act = btn.dataset.err;
      if (act === 'close') ov.classList.remove('open');
      else if (act === 'clear') _errClear(btn);
      else _errCopy(act, btn);
    });
    document.body.appendChild(ov);
    return ov;
  }

  function _errFormat(fmt) {
    const reports = window.mecGetErrorReports ? window.mecGetErrorReports() : [];
    if (fmt === 'json') return JSON.stringify(reports, null, 2);
    return 'エラー報告一覧\n' + '='.repeat(40) + '\n' + reports.map(r => {
      const sid = r.uid.replace(/_ch\d+.*$/, '');
      return '科目: ' + (SID_NAMES[sid] || sid) + '\nUID: ' + r.uid +
             '\n種別: ' + (ERR_TYPE_LABELS[r.type] || r.type) +
             '\n日付: ' + (r.reported_at || '—').slice(0, 10);
    }).join('\n---\n');
  }

  function _errCopy(fmt, btn) {
    const text = _errFormat(fmt);
    const msgEl = document.getElementById('mecErrMsg');
    const fbEl = document.getElementById('mecErrFallback');
    const orig = btn ? btn.textContent : '';
    const done = ok => {
      if (ok) {
        // タップでは :hover が安定しないので押されたボタン自身を書き換える
        if (btn) { btn.textContent = '✅ コピー済み'; setTimeout(() => { btn.textContent = orig; }, 1500); }
        if (msgEl) msgEl.textContent = '';
        if (fbEl) { fbEl.hidden = true; fbEl.value = ''; }
        return;
      }
      // 端末がクリップボードを拒否した場合。黙って終わると原因が分からないので、
      // 全選択済みの枠を出して長押しコピーに逃がす。
      if (btn) { btn.textContent = '⚠️ 手動コピーへ'; setTimeout(() => { btn.textContent = orig; }, 2500); }
      if (fbEl) { fbEl.hidden = false; fbEl.value = text; fbEl.focus(); fbEl.setSelectionRange(0, text.length); }
      if (msgEl) msgEl.textContent = 'この端末ではコピーが許可されていません。下の枠は全選択済みです。枠内を長押しして「コピー」を選んでください。';
    };
    // mecCopyText は必ずタップの同期フレーム内で呼ぶ（iOSはPromiseを跨ぐと操作文脈を失う）
    if (window.mecCopyText) window.mecCopyText(text).then(done);
    else done(false);
  }

  function _errClear(btn) {
    if (!window.mecTapConfirm(btn, '⚠️ もう一度タップで全消去')) return;
    localStorage.removeItem(KER);
    localStorage.setItem(K_ERR_CLEARED, new Date().toISOString());
    if (window.MECSync && window.MECSync.scheduleSync) window.MECSync.scheduleSync();
    if (window._mecUpdateErrBadge) window._mecUpdateErrBadge();
    window.mecOpenErrReports();
    document.dispatchEvent(new CustomEvent('mecErrReportsCleared'));
  }

  window.mecOpenErrReports = function () {
    const ov = _errEnsureDom();
    const reports = window.mecGetErrorReports ? window.mecGetErrorReports() : [];
    const listEl = document.getElementById('mecErrList');
    if (listEl) {
      listEl.textContent = reports.length ? reports.map(r => {
        const sid = r.uid.replace(/_ch\d+.*$/, '');
        return '[' + (SID_NAMES[sid] || sid) + '] ' + r.uid +
               '\n  種別: ' + (ERR_TYPE_LABELS[r.type] || r.type) +
               '\n  日付: ' + (r.reported_at || '—').slice(0, 10);
      }).join('\n\n') : '（報告はまだありません）';
    }
    const msgEl = document.getElementById('mecErrMsg');
    const fbEl = document.getElementById('mecErrFallback');
    if (msgEl) msgEl.textContent = '';
    if (fbEl) { fbEl.hidden = true; fbEl.value = ''; }
    ov.classList.add('open');
  };

  // ── Series (連問) position badges ──────────────────────────────
  function _initSeriesBadges() {
    document.querySelectorAll('.sg').forEach(sg => {
      const cards = sg.querySelectorAll(':scope > .qc[data-uid]');
      const total = cards.length;
      if (total < 2) return;
      cards.forEach((card, i) => {
        if (card.querySelector('.mec-series-pos')) return;
        const badge = document.createElement('span');
        badge.className = 'mec-series-pos';
        badge.textContent = `連問 ${i + 1}/${total}`;
        const qh = card.querySelector('.qh');
        if (!qh) return;
        const qn = qh.querySelector('.qn');
        if (qn) qn.after(badge);
        else qh.prepend(badge);
      });
    });
  }

  // ── Chapter progress bar (OneDrive pages) ───────────────────────
  function _updateChapterProgress() {
    const done = lsGet(KD);
    const cards = document.querySelectorAll('.qc[data-uid]');
    if (!cards.length) return;
    const total = cards.length;
    const doneCount = [...cards].filter(c => done[c.dataset.uid]).length;
    const pct = Math.round(doneCount / total * 100);
    document.querySelectorAll('.mec-ch-prog-fill').forEach(el => { el.style.width = pct + '%'; });
    document.querySelectorAll('.mec-ch-prog-txt').forEach(el => { el.textContent = doneCount + '/' + total; });
  }

  // ── Init UI for OneDrive .qc cards ──────────────────────────────
  function _initQcCards() {
    const done = lsGet(KD), flags = lsGet(KF);
    document.querySelectorAll('.qc[data-uid]').forEach(card => {
      const uid = card.dataset.uid;
      const doneLevel = done[uid] || 0;

      const lapBtn = card.querySelector('.mec-lap-btn');
      if (lapBtn) {
        const numEl = lapBtn.querySelector('.mec-lap-num');
        if (numEl) numEl.textContent = doneLevel > 0 ? doneLevel : '';
        lapBtn.classList.toggle('mec-lapped', doneLevel > 0);
      }
      if (doneLevel) card.classList.add('mec-done');

      const cb = card.querySelector('.mec-done-cb');
      if (cb && doneLevel) { cb.checked = true; card.classList.add('mec-done'); }

      const flagBtn = card.querySelector('.mec-flag-btn');
      if (flagBtn) {
        const flagged = !!flags[uid];
        flagBtn.classList.toggle('mec-flagged', flagged);
        flagBtn.setAttribute('aria-pressed', String(flagged));
      }
    });
    _updateChapterProgress();
  }

  // ── Public API ───────────────────────────────────────────────────
  window.MECSync = {
    syncFromGist,
    pushToGist,
    scheduleSync,
    getToken: () => localStorage.getItem(K_TOKEN) || '',
    setToken: t => localStorage.setItem(K_TOKEN, t),
    clearToken: () => localStorage.removeItem(K_TOKEN),
    getGistId: () => localStorage.getItem(K_GIST) || '',
    setGistId: id => localStorage.setItem(K_GIST, id),
    getStats() {
      const done = lsGet(KD), flags = lsGet(KF);
      return {
        doneCount: Object.keys(done).length,
        flagCount: Object.keys(flags).length,
        done, flags
      };
    },
    getChapterDone(prefix) {
      const done = lsGet(KD);
      return Object.keys(done).filter(k => k.startsWith(prefix + '_q')).length;
    },
    calcStreak() {
      const log = lsGet(KA);
      let streak = 0, d = new Date(Date.now() + 9 * 3600000);
      const todayDs = d.toISOString().slice(0, 10);
      if (!log[todayDs]) d.setDate(d.getDate() - 1); // 今日未学習なら昨日から遡る
      while (true) {
        const ds = d.toISOString().slice(0, 10);
        if (!log[ds]) break;
        streak++;
        d.setDate(d.getDate() - 1);
      }
      return streak;
    }
  };

  // ── URL hash auto-configure (#mec:base64) ───────────────────────
  (function applyHashConfig() {
    const h = location.hash;
    if (!h.startsWith('#mec:')) return;
    try {
      const cfg = JSON.parse(atob(h.slice(5)));
      if (cfg.t) localStorage.setItem(K_TOKEN, cfg.t);
      if (cfg.g) localStorage.setItem(K_GIST, cfg.g);
    } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
  })();

  // ── Auto-init ────────────────────────────────────────────────────
  (function _injectSeriesCSS() {
    const style = document.createElement('style');
    style.textContent = '.mec-series-pos{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px;background:#EDE7F6;color:#512DA8;border:1px solid #B39DDB;white-space:nowrap;flex-shrink:0;}'
      + '.mec-lap-btn{padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid #E0E5EB;color:#A0AAB8;background:none;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}'
      + '.mec-lap-btn.mec-lapped{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}'
      + '.mec-lap-num{font-size:9px;margin-left:2px;}'
      + '.mec-sync-badge[data-status="stale"]{background:#7f3300!important;cursor:pointer;}'
      + '.mec-sync-badge[data-status="error"]{background:rgba(192,57,43,.7)!important;cursor:pointer;}'
      + '.mec-sync-badge[data-status="synced"]{cursor:pointer;}';
    document.head.appendChild(style);
  })();

  document.addEventListener('DOMContentLoaded', () => {
    _initSeriesBadges();
    _initQcCards();

    // タップで同期エラー詳細を表示（iOS Safari では title 属性が見えないため）
    document.addEventListener('click', e => {
      const badge = e.target.closest('.mec-sync-badge');
      if (!badge) return;
      const status = badge.dataset.status;
      if (status === 'error') {
        _showSyncErrorPopup(badge.dataset.detail || '', badge.dataset.timeAgo || '');
      } else if (status === 'synced' || status === 'stale') {
        const timeAgo = badge.dataset.timeAgo;
        if (timeAgo) _showSyncInfoPopup(timeAgo, status);
      }
    });
    // Eagerly show stale badge if token set but last sync was > 24h ago
    const _token = localStorage.getItem(K_TOKEN);
    const _lastSync = localStorage.getItem(K_LAST_SYNC);
    if (_token && _lastSync) {
      const hoursAgo = (Date.now() - new Date(_lastSync).getTime()) / 3600000;
      if (hoursAgo > 24) _setSyncBadge('stale');
    } else if (!_token) {
      _setSyncBadge('no-config');
    }
    if (typeof window.applyFilters === 'function') window.applyFilters();
    syncFromGist().then(r => {
      if (r.status === 'ok') {
        _initQcCards();
        if (typeof window.applyFilters === 'function') window.applyFilters();
        document.dispatchEvent(new CustomEvent('mecSyncComplete', { detail: r }));
      } else if (r.status === 'no-config') {
        _setSyncBadge('no-config');
      } else if (r.status === 'error') {
        _setSyncBadge('error', r.detail || r.message || `HTTP ${r.code || '?'}`);
      }
    });
  });

})();
