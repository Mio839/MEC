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
  function _handleStorageQuota() {
    document.querySelectorAll('.mec-sync-badge').forEach(el => {
      el.textContent = '⚠️ ストレージ不足';
      el.dataset.status = 'error';
      el.title = 'localStorageの空き容量が不足しています。古い学習記録を削除して容量を確保しました。';
    });
    try {
      const a = JSON.parse(localStorage.getItem(KA) || '{}');
      const keys = Object.keys(a).sort();
      if (keys.length > 30) {
        keys.slice(0, keys.length - 30).forEach(k => delete a[k]);
        localStorage.setItem(KA, JSON.stringify(a));
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
    const body = JSON.stringify({
      description: 'MEC 医師国試 学習進捗',
      public: false,
      files: { 'mec_progress.json': { content: JSON.stringify(payload, null, 2) } }
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
      const numEl = lapBtnEl.querySelector('.mec-lap-num');
      if (numEl) numEl.textContent = prevCount > 0 ? prevCount : '';
      lapBtnEl.classList.toggle('mec-lapped', prevCount > 0);
      const card = lapBtnEl.closest('.qc, .qcard');
      if (card) card.classList.toggle('mec-done', prevCount > 0);
    }
    _updateChapterProgress();
    if (typeof window.applyFilters === 'function') window.applyFilters();
  };

  window.mecIncrLap = function (btn) {
    const uid = btn.dataset.uid;
    const done = lsGet(KD);
    const prevCount = done[uid] || 0;
    done[uid] = prevCount + 1;
    lsRaw(KD, done);
    const isFirstThisSession = !window.mecSessionDone.has(uid);
    window.mecSessionDone.add(uid);
    window.mecMarkStale?.();
    if (isFirstThisSession) logActivity();
    scheduleSync();
    // ページ側がSRSを持つ場合は「済＝正解扱い」で復習キューにも反映（study.htmlが定義）
    try { window.mecOnLapSRS?.(uid); } catch {}

    const lapCount = done[uid];
    const numEl = btn.querySelector('.mec-lap-num');
    if (numEl) numEl.textContent = lapCount;
    btn.classList.add('mec-lapped');

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
      if (flagBtn && flags[uid]) flagBtn.classList.add('mec-flagged');
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
