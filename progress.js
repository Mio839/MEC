/**
 * MEC Progress — shared localStorage + GitHub Gist sync module
 * Compatible with both Desktop MEC (.qcard) and OneDrive chapter pages (.qc)
 */
(function () {
  'use strict';

  const KD = 'done_v2', KM = 'memo_v2', KF = 'flag_v2', KS = 'srs_v2', KA = 'activity_v1';
  const K_TOKEN = 'mec_gist_token', K_GIST = 'mec_gist_id';

  let syncTimer = null;
  let syncInProgress = false;

  // session-level done tracking (resets on page reload)
  window.mecSessionDone = new Set();

  // ── Core storage ─────────────────────────────────────────────────
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } }
  function lsRaw(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  // ── Utilities ────────────────────────────────────────────────────
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }

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
    syncTimer = setTimeout(pushToGist, 3000);
  }

  async function syncFromGist() {
    const token = localStorage.getItem(K_TOKEN) || '';
    const gistId = localStorage.getItem(K_GIST) || '';
    if (!token || !gistId) return { status: 'no-config' };

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (!res.ok) return { status: 'error', code: res.status };
      const data = await res.json();
      const raw = data.files?.['mec_progress.json']?.content;
      if (!raw) return { status: 'empty' };
      _mergeRemote(JSON.parse(raw));
      _setSyncBadge('synced');
      return { status: 'ok' };
    } catch (e) {
      _setSyncBadge('error');
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

    const payload = {};
    [KD, KM, KF, KS, KA].forEach(k => { try { payload[k] = JSON.parse(localStorage.getItem(k) || '{}'); } catch { payload[k] = {}; } });
    payload._ts = new Date().toISOString();

    const headers = {
      Authorization: `token ${token}`,
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
      _setSyncBadge(res.ok ? 'synced' : 'error');
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return { status: 'error', code: res.status, message: errBody.message || '' };
      }
      return { status: 'ok' };
    } catch (e) {
      _setSyncBadge('error');
      return { status: 'error', message: e.message };
    } finally {
      syncInProgress = false;
    }
  }

  function _mergeRemote(remote) {
    // done: union (済み は取り消せない)
    const ld = lsGet(KD), rd = remote[KD] || {};
    lsRaw(KD, { ...rd, ...ld });
    // flag: union
    const lf = lsGet(KF), rf = remote[KF] || {};
    lsRaw(KF, { ...rf, ...lf });
    // srs: count が多い方を優先
    const ls = lsGet(KS), rs = remote[KS] || {};
    const ms = { ...rs };
    Object.keys(ls).forEach(uid => {
      if (!ms[uid] || (ls[uid].count || 0) >= (ms[uid].count || 0)) ms[uid] = ls[uid];
    });
    lsRaw(KS, ms);
    // memo: ローカル優先
    const lm = lsGet(KM), rm = remote[KM] || {};
    lsRaw(KM, { ...rm, ...lm });
    // activity: 日ごとの最大値
    const la = lsGet(KA), ra = remote[KA] || {};
    const ma = { ...la };
    Object.keys(ra).forEach(day => { ma[day] = Math.max(ma[day] || 0, ra[day] || 0); });
    lsRaw(KA, ma);
  }

  function _setSyncBadge(status) {
    document.querySelectorAll('.mec-sync-badge').forEach(el => {
      const map = { synced: '☁️ 同期済', syncing: '🔄 同期中...', error: '⚠️ 同期エラー', 'no-config': '⚙️ 未設定' };
      el.textContent = map[status] || status;
      el.dataset.status = status;
    });
  }

  window.mecOnCheck = function (cb) {
    const uid = cb.dataset.uid, done = lsGet(KD);
    if (cb.checked) done[uid] = 1; else delete done[uid];
    lsRaw(KD, done);
    logActivity();
    scheduleSync();
    const card = cb.closest('.qc, .qcard');
    if (card) card.classList.toggle('mec-done', cb.checked);
    _updateChapterProgress();
  };

  window.mecIncrLap = function (btn) {
    const uid = btn.dataset.uid;
    const done = lsGet(KD);
    done[uid] = (done[uid] || 0) + 1;
    lsRaw(KD, done);
    window.mecSessionDone.add(uid);
    logActivity();
    scheduleSync();

    const lapCount = done[uid];
    const numEl = btn.querySelector('.mec-lap-num');
    if (numEl) numEl.textContent = lapCount;
    btn.classList.add('mec-lapped');

    const card = btn.closest('.qc, .qcard');
    if (card) card.classList.add('mec-done');
    _updateChapterProgress();

    const allCards = [...document.querySelectorAll('.qc[data-uid]')].filter(c => {
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
    if (typeof window.applyFilters === 'function') window.applyFilters();
  };

  window.mecSetDone = window.mecIncrLap;

  window.mecToggleFlag = function (btn) {
    const uid = btn.dataset.uid, flags = lsGet(KF);
    if (flags[uid]) { delete flags[uid]; btn.classList.remove('mec-flagged'); }
    else { flags[uid] = 1; btn.classList.add('mec-flagged'); }
    lsRaw(KF, flags);
    scheduleSync();
  };

  window.mecOnMemo = function (ta) {
    const uid = ta.dataset.uid, memos = lsGet(KM);
    if (ta.value.trim()) memos[uid] = ta.value; else delete memos[uid];
    lsRaw(KM, memos);
    scheduleSync();
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
      const memoEl = card.querySelector('.mec-memo-area');
      if (memoEl && lsGet(KM)[uid]) memoEl.value = lsGet(KM)[uid];
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
      + '.mec-lap-num{font-size:9px;margin-left:2px;}';
    document.head.appendChild(style);
  })();

  document.addEventListener('DOMContentLoaded', () => {
    _initSeriesBadges();
    _initQcCards();
    if (typeof window.applyFilters === 'function') window.applyFilters();
    syncFromGist().then(r => {
      if (r.status === 'ok') {
        _initQcCards();
        if (typeof window.applyFilters === 'function') window.applyFilters();
        document.dispatchEvent(new CustomEvent('mecSyncComplete', { detail: r }));
      }
      if (r.status === 'no-config') _setSyncBadge('no-config');
    });
  });

})();
