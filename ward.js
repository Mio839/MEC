// ward.js — 病棟回診（今日の復習＝SRS復習セッションの見せ方）（2026-09-25 新設）
//
// 今日 due の問題を「入院患者」として病棟（科目）のベッドに並べ、1問解く＝1人を診察する。
//   ・正解 … 退院。次の外来＝SRS の次回予定日
//   ・誤答 … 入院継続（明日また回る）
//   ・期限切れの日数と間隔から病状（安定／要注意／重症）を付ける。並び順（_srsUrgency の降順）が
//     そのまま「重症の人から回る」の意味になる。
//
// ⚠️ 確信度の宣言（確実／たぶん／勘）は 2026-09-25 に撤去した（キー操作が面倒＝ユーザー判断）。戻さないこと。
//
// 呼び口（boss.js と同じ形）:
//   study.html startSRSReview → briefing()（朝の申し送り）→ 開始ボタンで startExam + start()
//   study_exam.js _tallyQuestion → onAnswer()（3つの採点経路の合流点）
//   study_exam.js exitExam → onExit()／showExamSummary → decorateSummary()
//
// ⚠️ SRS復習（_srsReviewMode）だけの見せ方。今日の誤答・統合カンファレンス・弱点強化には出さない。
// ⚠️ 記録は新しい localStorage キーを持たない（SRS の採点は従来どおり study_exam.js が行う）。
// ⚠️ 誤答の再試験（結果画面から）は start() を通らないので回診にならない＝active() が false。
(function () {
  'use strict';

  const SEV_LABEL = { crit: '重症', warn: '要注意', stable: '安定' };

  let S = null;          // 回診の状態。onExit 後も結果画面のために残す（active=false）

  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function _todayJ() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function _dd(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
  function _srs() {
    try { if (typeof _srsData !== 'undefined' && _srsData) return _srsData; } catch (e) {}
    try { return JSON.parse(localStorage.getItem('mec_srs_v1') || '{}'); } catch (e) { return {}; }
  }
  function _subj(sid) {
    try { const s = (typeof STUDY_SUBJECTS !== 'undefined' ? STUDY_SUBJECTS : []).find(x => x.id === sid); if (s) return s; } catch (e) {}
    return { id: sid, name: sid, icon: '🏥', color: '#7FA7B5' };
  }
  function _sidOf(uid) { return String(uid).split('_ch')[0]; }

  // ── 純粋関数（テストが直接呼ぶ） ─────────────────────────────────────
  // 病状：期限切れの日数と「待たされ具合」（_srsUrgency と同じ式）から
  function severityOf(e, today) {
    if (!e || !e.nextReview) return 'stable';
    const late = Math.max(0, _dd(e.nextReview, today));
    const iv = Math.max(1, e.interval || 1);
    const urg = (late + 1) / iv;
    if (late >= 7 || urg >= 3) return 'crit';
    if (late >= 1 || urg >= 1.5) return 'warn';
    return 'stable';
  }
  function outcomeOf(isCorrect) { return isCorrect ? 'discharge' : 'stay'; }

  // ── CSS ─────────────────────────────────────────────────────────────
  // 意匠は「病棟のホワイトボード」。⚠️ infinite のアニメは置かない（回診は読む道具）。
  const CSS = `
#wardHud{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));translate:-50% 0;z-index:8000;
  width:min(600px,calc(100% - 20px));box-sizing:border-box;padding:9px 12px 10px;border-radius:16px;
  background:linear-gradient(170deg,#12303A 0%,#0C2129 60%,#0F2630 100%);
  border:1px solid rgba(126,214,223,.55);box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22),0 12px 30px rgba(0,0,0,.55);
  color:#E8F6F8;pointer-events:none;transition:opacity .3s ease,translate .4s cubic-bezier(.2,1.3,.4,1);}
#wardHud.hide{opacity:0;translate:-50% 140%;}
#wardHud .wh-top{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;white-space:nowrap;}
#wardHud .wh-tag{font-size:9.5px;letter-spacing:.28em;color:#7ED6DF;}
#wardHud .wh-cnt{margin-left:auto;font-variant-numeric:tabular-nums;font-size:11.5px;color:rgba(232,246,248,.8);overflow:hidden;text-overflow:ellipsis;}
#wardHud .wh-cnt b{font-size:13px;}
#wardHud .wh-cnt .d{color:#6EE7B7}#wardHud .wh-cnt .s{color:#FCA5A5}
#wardHud .wh-beds{display:flex;flex-wrap:wrap;gap:3px;margin-top:7px;}
#wardHud .wh-bed{width:9px;height:9px;border-radius:3px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);transition:background .35s ease,scale .35s ease;}
#wardHud .wh-bed.crit{box-shadow:inset 0 0 0 1.5px #F87171}
#wardHud .wh-bed.warn{box-shadow:inset 0 0 0 1.5px #FBBF24}
#wardHud .wh-bed.now{scale:1.35;background:rgba(126,214,223,.55)}
#wardHud .wh-bed.discharge{background:#34D399;box-shadow:none}
#wardHud .wh-bed.stay{background:#F87171;box-shadow:none}
.wh-pop{position:fixed;z-index:8001;pointer-events:none;font-weight:900;font-size:15px;white-space:nowrap;translate:-50% 0;
  padding:3px 10px;border-radius:99px;background:rgba(6,16,20,.85);border:1px solid currentColor;animation:whPop 1.1s cubic-bezier(.2,1,.3,1) forwards;}
.wh-pop.discharge{color:#6EE7B7}.wh-pop.stay{color:#FCA5A5}
@keyframes whPop{0%{opacity:0;transform:translateY(6px)}18%{opacity:1;transform:translateY(-6px)}75%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}
body.ward-on .ct{padding-bottom:90px;}
/* 朝の申し送り */
#wardBrief{position:fixed;left:0;top:0;width:100%;height:100dvh;z-index:9500;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;
  background:rgba(4,12,16,.72);animation:wbIn .25s ease both;}
#wardBrief .wb-box{width:min(620px,100%);max-height:100%;overflow-y:auto;box-sizing:border-box;padding:20px 18px 16px;border-radius:18px;
  background:linear-gradient(170deg,#12303A,#0B1E25 70%);border:1px solid rgba(126,214,223,.6);
  box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22),0 20px 50px rgba(0,0,0,.6);color:#E8F6F8;animation:wbRise .35s cubic-bezier(.2,1.2,.4,1) both;}
#wardBrief .wb-tag{font-size:10px;font-weight:900;letter-spacing:.32em;color:#7ED6DF;}
#wardBrief h3{margin:4px 0 2px;font-size:22px;font-weight:900;}
#wardBrief .wb-date{font-size:12px;color:rgba(232,246,248,.65);}
#wardBrief .wb-sum{display:flex;gap:8px;margin:14px 0 12px;}
#wardBrief .wb-k{flex:1;padding:8px 6px;border-radius:12px;text-align:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
#wardBrief .wb-k b{display:block;font-size:22px;font-variant-numeric:tabular-nums;line-height:1.1;}
#wardBrief .wb-k span{font-size:10.5px;font-weight:800;opacity:.75;}
#wardBrief .wb-k.crit b{color:#F87171}#wardBrief .wb-k.warn b{color:#FBBF24}#wardBrief .wb-k.stable b{color:#6EE7B7}
#wardBrief .wb-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px;}
#wardBrief .wb-room{padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-left:3px solid var(--rc,#7ED6DF);
  animation:wbIn .3s ease both;animation-delay:calc(var(--i,0) * 40ms);}
#wardBrief .wb-rn{font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#wardBrief .wb-rn small{font-weight:700;opacity:.6;margin-left:4px;}
#wardBrief .wb-beds{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;}
#wardBrief .wb-bed{width:10px;height:10px;border-radius:3px;background:#34D399;}
#wardBrief .wb-bed.warn{background:#FBBF24}#wardBrief .wb-bed.crit{background:#F87171}
#wardBrief .wb-more{font-size:11.5px;color:rgba(232,246,248,.65);margin-top:10px;}
#wardBrief .wb-howto{margin-top:12px;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.6;background:rgba(126,214,223,.08);border:1px dashed rgba(126,214,223,.4);}
#wardBrief .wb-howto b{color:#7ED6DF;}
#wardBrief .wb-btns{display:flex;gap:8px;margin-top:14px;}
#wardBrief .wb-go{flex:1;padding:12px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:900;cursor:pointer;color:#06201F;
  background:linear-gradient(180deg,#8BE9F0,#4FC3CF);box-shadow:0 4px 16px rgba(79,195,207,.4);}
#wardBrief .wb-back{padding:12px 14px;border-radius:12px;font-size:13px;font-weight:800;color:#E8F6F8;text-decoration:none;border:1px solid rgba(255,255,255,.25);}
@keyframes wbIn{from{opacity:0}to{opacity:1}}
@keyframes wbRise{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
/* 結果画面 */
.exam-ward-res{margin:4px 0 12px;padding:14px 14px 12px;border-radius:14px;text-align:left;
  background:linear-gradient(170deg,#12303A,#0B1E25 70%);border:1px solid rgba(126,214,223,.6);color:#E8F6F8;
  box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22);}
.exam-ward-res .ewr-tag{font-size:10px;font-weight:900;letter-spacing:.3em;color:#7ED6DF;}
.exam-ward-res .ewr-sum{display:flex;gap:6px;margin:8px 0 10px;}
.exam-ward-res .ewr-k{flex:1;text-align:center;padding:6px 4px;border-radius:10px;background:rgba(255,255,255,.05);}
.exam-ward-res .ewr-k b{display:block;font-size:20px;font-variant-numeric:tabular-nums;}
.exam-ward-res .ewr-k span{font-size:10.5px;font-weight:800;opacity:.75;}
.exam-ward-res .ewr-k.d b{color:#6EE7B7}.exam-ward-res .ewr-k.s b{color:#FCA5A5}
.exam-ward-res .ewr-h{font-size:11.5px;font-weight:900;margin:10px 0 5px;color:#BDEFF3;}
.exam-ward-res .ewr-row{display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0;}
.exam-ward-res .ewr-row .l{width:92px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800;}
.exam-ward-res .ewr-row .bar{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;display:flex;}
.exam-ward-res .ewr-row .bar i{display:block;height:100%}
.exam-ward-res .ewr-row .v{width:74px;flex-shrink:0;text-align:right;font-variant-numeric:tabular-nums;opacity:.85;}
.exam-ward-res .ewr-note{font-size:12px;line-height:1.6;margin-top:6px;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.05);}
.exam-ward-res .ewr-note.alert{background:rgba(248,113,113,.14);border:1px solid rgba(248,113,113,.45);}
@media (prefers-reduced-motion:reduce){#wardHud,#wardHud *,.wh-pop,#wardBrief,#wardBrief *{animation:none!important;transition:none!important}}
`;
  function _css() {
    if (document.getElementById('mecWardCss')) return;
    const st = document.createElement('style'); st.id = 'mecWardCss'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // 病棟（科目）ごとに束ねる。並びは患者の多い順
  function _rooms(uids, srs, today) {
    const m = new Map();
    uids.forEach(uid => {
      const sid = _sidOf(uid);
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid).push({ uid, sev: severityOf(srs[uid], today) });
    });
    return [...m.entries()].map(([sid, pts]) => ({ sid, pts })).sort((a, b) => b.pts.length - a.pts.length);
  }

  // ── 公開：朝の申し送り（開始前の画面） ────────────────────────────────
  // ⚠️ onGo は「回診を始める」のタップの中で呼ぶ＝起動音の自動再生制限（iOS）をそのまま通せる
  function briefing(uids, remaining, onGo) {
    _css();
    document.getElementById('wardBrief')?.remove();
    const today = _todayJ();
    const srs = _srs();
    const rooms = _rooms(uids, srs, today);
    const cnt = { crit: 0, warn: 0, stable: 0 };
    rooms.forEach(r => r.pts.forEach(p => cnt[p.sev]++));
    const d = new Date(Date.now() + 9 * 3600000);
    const wd = '日月火水木金土'[d.getUTCDay()];
    const el = document.createElement('div');
    el.id = 'wardBrief';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<div class="wb-box">' +
      '<div class="wb-tag">WARD ROUNDS</div><h3>🏥 朝の回診</h3>' +
      '<div class="wb-date">' + (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日(' + wd + ')　入院患者 ' + uids.length + '名・' + rooms.length + '病棟</div>' +
      '<div class="wb-sum">' +
        '<div class="wb-k crit"><b>' + cnt.crit + '</b><span>重症</span></div>' +
        '<div class="wb-k warn"><b>' + cnt.warn + '</b><span>要注意</span></div>' +
        '<div class="wb-k stable"><b>' + cnt.stable + '</b><span>安定</span></div></div>' +
      '<div class="wb-rooms">' + rooms.map((r, i) => {
        const s = _subj(r.sid);
        return '<div class="wb-room" style="--rc:' + _esc(s.color) + ';--i:' + i + '"><div class="wb-rn">' + _esc(s.icon + ' ' + s.name) + '<small>' + r.pts.length + '名</small></div>' +
          '<div class="wb-beds">' + r.pts.map(p => '<i class="wb-bed ' + p.sev + '" title="' + SEV_LABEL[p.sev] + '"></i>').join('') + '</div></div>';
      }).join('') + '</div>' +
      (remaining > 0 ? '<div class="wb-more">ほか ' + remaining + '名は次の回診で（この回診を終えると続けられます）</div>' : '') +
      '<div class="wb-howto">重症（期限を大きく過ぎた問題）から順に回ります。正解で<b>退院</b>、誤答は<b>入院継続</b>（明日また回ります）。</div>' +
      '<div class="wb-btns"><a class="wb-back" href="index.html">ハブへ</a><button type="button" class="wb-go">回診を始める ▶</button></div></div>';
    document.body.appendChild(el);
    const go = el.querySelector('.wb-go');
    go.addEventListener('click', () => { el.remove(); try { onGo && onGo(); } catch (e) { console.error('[ward]', e); } }, { once: true });
    try { go.focus({ preventScroll: true }); } catch (e) {}
  }

  // ── HUD（病棟ボード） ─────────────────────────────────────────────────
  // ⚠️ 表示だけ（pointer-events:none）。押せる物を置かない＝解答の邪魔をしない。
  function _hud() {
    let h = document.getElementById('wardHud');
    if (!h) {
      h = document.createElement('div');
      h.id = 'wardHud'; h.className = 'hide';
      h.setAttribute('role', 'status');
      h.innerHTML = '<div class="wh-top"><span class="wh-tag">🏥 回診中</span><span class="wh-cnt"></span></div>' +
        '<div class="wh-beds"></div>';
      document.body.appendChild(h);
    }
    return h;
  }

  function _paint() {
    if (!S) return;
    const h = _hud();
    const done = S.recs.length;
    h.querySelector('.wh-cnt').innerHTML = '診察 <b>' + done + '</b>/' + S.order.length +
      '　<span class="d">退院 <b>' + S.out.discharge + '</b></span>　<span class="s">継続 <b>' + S.out.stay + '</b></span>';
    const beds = h.querySelector('.wh-beds');
    if (beds.childElementCount !== S.order.length) {
      beds.innerHTML = S.order.map(uid => '<i class="wh-bed ' + S.sev[uid] + '" data-u="' + _esc(uid) + '"></i>').join('');
    }
    [...beds.children].forEach(b => {
      const r = S.res[b.dataset.u];
      b.className = 'wh-bed ' + (r ? r : S.sev[b.dataset.u]) + (!r && b.dataset.u === S.now ? ' now' : '');
    });
  }

  // いま焦点が当たっている患者をボードで示す（_updateExamFocus の代わりに軽く追う）
  function _trackFocus() {
    if (!S || !S.active) return;
    const c = document.querySelector('.qc.exam-key-focus[data-uid]');
    const u = c ? c.dataset.uid : null;
    if (u !== S.now) { S.now = u; _paint(); }
  }

  // ── 公開：開始（startExam の直後） ───────────────────────────────────
  function start(uids) {
    _css();
    const today = _todayJ();
    const srs = _srs();
    const sev = {};
    uids.forEach(u => { sev[u] = severityOf(srs[u], today); });
    S = { active: true, order: uids.slice(), sev, res: {}, recs: [], out: { discharge: 0, stay: 0 }, now: null, today };
    document.body.classList.add('ward-on');
    clearInterval(S._t); S._t = setInterval(_trackFocus, 400);
    _paint();
    setTimeout(() => { if (S && S.active) _hud().classList.remove('hide'); }, 900);   // カウントダウンが明けてから
  }

  function _pop(kind, text) {
    const r = _hud().getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'wh-pop ' + kind;
    el.textContent = text;
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top = (r.top - 34) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ── 公開：1問の採点（_tallyQuestion から・3つの採点経路の合流点） ───────
  function onAnswer(card, isCorrect) {
    if (!S || !S.active) return;
    const uid = card && card.dataset ? card.dataset.uid : '';
    if (!uid || S.res[uid]) return;
    const o = outcomeOf(!!isCorrect);
    S.res[uid] = o;
    S.out[o]++;
    S.recs.push({ uid, ok: !!isCorrect });
    _pop(o, o === 'discharge' ? '🏠 退院' : '🛏 入院継続');
    _paint();
  }

  function active() { return !!(S && S.active); }

  function onExit() {
    const h = document.getElementById('wardHud');
    if (h) h.classList.add('hide');
    document.body.classList.remove('ward-on');
    document.querySelectorAll('.wh-pop').forEach(el => el.remove());
    if (S) { clearInterval(S._t); S.active = false; }
  }

  // ── 公開：結果画面 ────────────────────────────────────────────────────
  function decorateSummary() {
    // 1回の回診につき1回だけ（結果画面からの誤答再試験は同じ S を引きずるので二重に出さない）
    if (!S || S.shown || !S.recs.length) return;
    S.shown = true;
    const note = document.getElementById('sumFlagNote');
    if (!note) return;
    const srs = _srs();
    // 病棟ごとの転帰
    const byRoom = new Map();
    S.recs.forEach(r => {
      const sid = _sidOf(r.uid);
      if (!byRoom.has(sid)) byRoom.set(sid, { discharge: 0, stay: 0, n: 0 });
      const b = byRoom.get(sid); b[S.res[r.uid]]++; b.n++;
    });
    const rooms = [...byRoom.entries()].sort((a, b) => b[1].n - a[1].n);
    const roomHtml = rooms.map(([sid, b]) => {
      const s = _subj(sid);
      const w = k => (b[k] / b.n * 100).toFixed(1) + '%';
      return '<div class="ewr-row"><span class="l">' + _esc(s.icon + ' ' + s.name) + '</span><span class="bar">' +
        '<i style="width:' + w('discharge') + ';background:#34D399"></i><i style="width:' + w('stay') + ';background:#F87171"></i></span>' +
        '<span class="v">退院 ' + b.discharge + '/' + b.n + '</span></div>';
    }).join('');
    // 退院した患者の次の外来（_updateSRS が書いた後の予定日）
    const next = S.recs.filter(r => S.res[r.uid] === 'discharge').map(r => srs[r.uid] && srs[r.uid].nextReview)
      .filter(Boolean).map(d => _dd(S.today, d)).filter(n => n >= 0).sort((a, b) => a - b);
    const med = next.length ? next[Math.floor(next.length / 2)] : null;
    // 重症だった患者の転帰
    const crit = S.recs.filter(r => S.sev[r.uid] === 'crit');
    const critOut = crit.filter(r => r.ok).length;

    let notes = '';
    if (crit.length) notes += '<div class="ewr-note' + (critOut < crit.length ? ' alert' : '') + '">🚨 重症 ' + crit.length + '名のうち <b>' + critOut + '名が退院</b>' +
      (critOut < crit.length ? '。残る ' + (crit.length - critOut) + '名は明日も回ります。' : '。期限切れを取り戻しました。') + '</div>';
    if (med != null) notes += '<div class="ewr-note">🏠 退院した ' + next.length + '名の次の外来は 中央値 <b>' + med + '日後</b>。</div>';

    const html = '<div class="exam-ward-res"><div class="ewr-tag">🏥 本日の回診</div>' +
      '<div class="ewr-sum"><div class="ewr-k d"><b>' + S.out.discharge + '</b><span>退院</span></div>' +
      '<div class="ewr-k s"><b>' + S.out.stay + '</b><span>入院継続</span></div></div>' +
      '<div class="ewr-h">病棟ごとの転帰</div>' + roomHtml +
      notes + '</div>';
    note.insertAdjacentHTML('beforebegin', html);
  }

  window.MecWard = {
    briefing, start, onAnswer, active, onExit, decorateSummary,
    severityOf, outcomeOf,
    state: () => S,
  };
})();
