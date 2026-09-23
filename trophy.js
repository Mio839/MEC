// trophy.js — トロフィー棚（定着コレクション・章メダル・科目制覇の勲章）（2026-09-23 新設）
//
// ハブのタイル「🏆 トロフィー棚」の中身と、学習ツールで「定着」が増えた瞬間の通知を持つ。
// 読み込むのは index.html と study.html。
//
// ⚠️ 新しい localStorage キーを持たない。全部を既存の同期済みデータ（mec_srs_v1 / myrate_v1 /
//    done_v2）と chapters_meta.js から毎回計算する＝端末間で自動的に一致し、過去の学習も遡って飾られる。
//
// 【定着の定義】（isMastered が唯一の正本）
//   3回以上続けて正解し（SRS の reps ≥ 3。誤答で 0 に戻る）、かつ間隔が「21日と試験日ゲートの上限の
//   小さい方」以上まで伸びた問題。
//   ⚠️ 「間隔30日以上」にしないこと。_updateSRS は間隔を「試験までの残り日数の半分」で頭打ちにする
//      （CLAUDE.md「間隔は試験日を越えない」）ので、固定の閾値だと直前期に誰も届かなくなり、
//      集めた宝石が日を追って消えていく。閾値の側も同じ上限で下げる。
// 【章メダル】 gamify.js の chapterGrade（章の星 ★1〜3 と同じ式）＝金・銀・銅。
// 【科目制覇】 済が科目の全問数に達した科目（gamify.js の科目制覇演出と同じ条件）。
(function () {
  'use strict';

  const MASTER_REPS = 3;
  const MASTER_DAYS = 21;
  const SRS_EXAM_FRACTION = 0.5;   // ⚠️ study.html の SRS_EXAM_FRACTION と同じ値にすること（テストが見張る）

  // 宝石の段（科目の問題数に対する定着の割合）
  const GEMS = [
    { min: 0,    name: '—',          c1: '#5B6275', c2: '#3A3F4E' },
    { min: 0.0001, name: '原石',     c1: '#B8A58A', c2: '#6E6150' },
    { min: 0.05, name: '水晶',       c1: '#E8F4FF', c2: '#8FB8E0' },
    { min: 0.15, name: '翡翠',       c1: '#8FF0B8', c2: '#1E9B62' },
    { min: 0.30, name: 'サファイア', c1: '#8EC5FF', c2: '#2456D6' },
    { min: 0.50, name: 'ルビー',     c1: '#FF9BB0', c2: '#C4103F' },
    { min: 0.75, name: 'ダイヤ',     c1: '#FFFFFF', c2: '#9FE8FF' },
  ];
  const MEDALS = ['', '🥉', '🥈', '🥇'];
  const MEDAL_NAMES = ['', '銅', '銀', '金'];

  function _g(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch { return d; } }
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function _today() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function _daysDiff(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }

  function masteryDays(today, examDate) {
    let thr = MASTER_DAYS;
    if (examDate && /^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      const left = _daysDiff(today, examDate);
      if (left > 0) thr = Math.min(thr, Math.max(1, Math.floor(left * SRS_EXAM_FRACTION)));
    }
    return thr;
  }
  function _thr() {
    const ex = (window.MECSync && MECSync.examDate) ? MECSync.examDate() : '';
    return masteryDays(_today(), ex);
  }
  function isMastered(e, thr) {
    if (thr == null) thr = _thr();
    return !!e && (e.reps || 0) >= MASTER_REPS && (e.interval || 0) >= thr;
  }

  function gemOf(ratio) {
    let g = GEMS[0];
    GEMS.forEach(x => { if (ratio >= x.min) g = x; });
    return g;
  }
  function gemIndex(ratio) { let i = 0; GEMS.forEach((x, k) => { if (ratio >= x.min) i = k; }); return i; }

  function chapterGrade(t, c, answered, count) {
    const G = window.MecGamify;
    if (G && G.chapterGrade) return G.chapterGrade(t, c, answered, count);
    if (!t || answered < count * 0.5) return 0;
    const pct = c / t * 100;
    return pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  }

  // 棚の中身を全部数える。材料は引数で差し替えられる（テスト用）。
  function collect(src) {
    src = src || {};
    const chapters = src.chapters || (typeof MEC_CHAPTERS !== 'undefined' ? MEC_CHAPTERS : window.MEC_CHAPTERS) || [];
    const myrate = src.myrate || _g('myrate_v1', {});
    const done = src.done || _g('done_v2', {});
    const srs = src.srs || _g('mec_srs_v1', {});
    const thr = src.thr != null ? src.thr : _thr();

    // uid → 章prefix の索引を1回だけ作る（章ごとに全件を走査しない）
    const byCh = {};
    const chOf = uid => { const i = uid.indexOf('_q'); return i > 0 ? uid.slice(0, i) : ''; };
    const slot = p => byCh[p] || (byCh[p] = { t: 0, c: 0, ans: 0, done: 0, gem: 0 });
    for (const uid in myrate) { const r = myrate[uid]; if (!r || !(r.total > 0)) continue; const s = slot(chOf(uid)); s.t += r.total; s.c += r.correct || 0; s.ans++; }
    for (const uid in done) { if ((done[uid] || 0) > 0) slot(chOf(uid)).done++; }
    for (const uid in srs) { if (isMastered(srs[uid], thr)) slot(chOf(uid)).gem++; }

    const out = [];
    let gems = 0, medals = [0, 0, 0, 0], clears = 0, chClears = 0;
    chapters.forEach(sub => {
      if (!sub || !sub.chapters || sub.id === 'custom' || sub.id === 'memo') return;
      let total = 0, doneN = 0, gemN = 0;
      const chs = sub.chapters.map(ch => {
        const s = byCh[ch.prefix] || { t: 0, c: 0, ans: 0, done: 0, gem: 0 };
        const count = ch.count || 0;
        total += count; doneN += Math.min(s.done, count); gemN += Math.min(s.gem, count);
        const grade = count ? chapterGrade(s.t, s.c, s.ans, count) : 0;
        const cleared = count > 0 && s.done >= count;
        medals[grade]++; if (cleared) chClears++;
        return { prefix: ch.prefix, title: cleanTitle(ch.title), count, grade, cleared, pct: s.t ? Math.round(s.c / s.t * 100) : null };
      });
      const ratio = total ? gemN / total : 0;
      const cleared = total > 0 && doneN >= total;
      if (cleared) clears++;
      gems += gemN;
      out.push({ id: sub.id, name: sub.name, icon: sub.icon, color: sub.color, total, done: doneN, cleared,
        gems: gemN, ratio, gem: gemOf(ratio), gemIdx: gemIndex(ratio), chapters: chs });
    });
    return { subjects: out, gems, medals, clears, chClears, thr };
  }

  // 「MEC内分泌代謝 第1章 内分泌代謝の基本 解答解説」→「内分泌代謝の基本」
  function cleanTitle(t) {
    t = String(t || '').replace(/\s*解答解説\s*$/, '');
    const m = t.match(/第\s*\d+\s*章\s*(.+)$/);
    return (m ? m[1] : t).trim() || t;
  }

  // ── 描画 ─────────────────────────────────────────────────────────────
  const CSS = `
.tr-shelf{display:flex;flex-direction:column;gap:12px;}
.tr-sum{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}
.tr-sum div{text-align:center;padding:10px 4px;border-radius:12px;background:rgba(var(--glass-rgb,255,255,255),.06);border:1px solid var(--hair,rgba(255,255,255,.1));min-width:0;}
.tr-sum b{display:block;font-family:var(--font-display,inherit);font-size:22px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums;}
.tr-sum i{display:block;font-style:normal;font-size:10.5px;font-weight:700;color:var(--ts);margin-top:2px;white-space:nowrap;}
.tr-h{font-size:12.5px;font-weight:900;letter-spacing:.06em;color:var(--or);margin:4px 2px 0;display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px;row-gap:2px;white-space:nowrap;}
.tr-h small{font-weight:700;color:var(--ts);letter-spacing:0;font-size:11px;white-space:normal;}
.tr-gems{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;}
.tr-gem{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px 6px;border-radius:12px;text-decoration:none;color:var(--tx);
  background:rgba(var(--glass-rgb,255,255,255),.05);border:1px solid var(--hair,rgba(255,255,255,.1));min-width:0;}
.tr-stone{position:relative;width:26px;height:26px;margin:3px 0 4px;transform:rotate(45deg);border-radius:6px;
  background:linear-gradient(135deg,var(--g1) 0%,var(--g2) 70%);
  box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 0 14px color-mix(in srgb,var(--g1) 60%,transparent);}
.tr-stone::after{content:'';position:absolute;left:4px;top:4px;width:8px;height:8px;border-radius:3px;background:rgba(255,255,255,.55);}
.tr-gem.lv0 .tr-stone{opacity:.35;box-shadow:none;}
.tr-gem.lv0 .tr-stone::after{display:none;}
.tr-gem .nm{font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.tr-gem .ct{font-size:10.5px;font-weight:700;color:var(--ts);font-variant-numeric:tabular-nums;}
.tr-gem .gn{font-size:10px;font-weight:900;letter-spacing:.08em;color:var(--g1);}
.tr-gem.lv0 .gn{color:var(--ts);}
.tr-gem .crown{position:absolute;top:-7px;right:-4px;font-size:17px;filter:drop-shadow(0 0 6px rgba(255,209,102,.9));}
.tr-subj{border-radius:14px;padding:10px 12px;background:rgba(var(--glass-rgb,255,255,255),.04);border:1px solid var(--hair,rgba(255,255,255,.08));}
.tr-subj-h{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;}
.tr-subj-h .cnt{margin-left:auto;font-size:11px;color:var(--ts);font-weight:700;white-space:nowrap;}
.tr-meds{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
.tr-med{position:relative;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;
  background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.14);font-family:var(--font-display,inherit);}
.tr-med.m0{font-size:10px;font-weight:800;color:var(--ts);}
.tr-med.g1{background:radial-gradient(circle at 35% 30%,rgba(230,160,110,.45),rgba(140,80,40,.18));border:1px solid rgba(214,140,90,.6);}
.tr-med.g2{background:radial-gradient(circle at 35% 30%,rgba(235,240,250,.5),rgba(140,150,170,.2));border:1px solid rgba(200,210,225,.7);}
.tr-med.g3{background:radial-gradient(circle at 35% 30%,rgba(255,236,160,.55),rgba(200,150,30,.22));border:1px solid rgba(255,209,102,.8);box-shadow:0 0 10px rgba(255,209,102,.45);}
.tr-med.clr::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--gr,#3DD68C);}
.tr-legend{font-size:10.5px;color:var(--ts);font-weight:700;line-height:1.6;}
.tr-crowns{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;}
.tr-crown{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border-radius:12px;font-size:10.5px;font-weight:800;min-width:0;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:var(--ts);}
.tr-crown span{font-size:22px;filter:grayscale(1);opacity:.3;}
.tr-crown.on{color:#FFD166;border-color:rgba(255,209,102,.6);background:radial-gradient(circle at 50% 20%,rgba(255,209,102,.22),transparent 70%);}
.tr-crown.on span{filter:drop-shadow(0 0 8px rgba(255,209,102,.8));opacity:1;}
.tr-crown em{font-style:normal;font-size:9.5px;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums;}
html.tr-fx .tr-gem{animation:trIn .45s cubic-bezier(.2,1.3,.4,1) both;animation-delay:calc(var(--i,0) * .03s);}
html.tr-fx .tr-gem.lv6 .tr-stone,html.tr-fx .tr-gem.lv5 .tr-stone{animation:trGlint 2.6s ease-in-out infinite;}
@keyframes trIn{0%{transform:translateY(10px) scale(.85);opacity:0}100%{transform:none;opacity:1}}
@keyframes trGlint{0%,100%{filter:brightness(1)}50%{filter:brightness(1.45) saturate(1.2)}}
@media (prefers-reduced-motion:reduce){.tr-shelf *{animation:none!important}}
`;
  function _css() {
    if (document.getElementById('mecTrophyCss')) return;
    const st = document.createElement('style'); st.id = 'mecTrophyCss'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function shelfHtml(data) {
    _css();
    const d = data || collect();
    try { if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('tr-fx'); } catch {}
    const subs = d.subjects;
    const gems = subs.slice().sort((a, b) => (b.gemIdx - a.gemIdx) || (b.gems - a.gems)).map((s, i) =>
      '<a class="tr-gem lv' + s.gemIdx + '" href="study.html?sid=' + encodeURIComponent(s.id) + '" style="--i:' + i + ';--g1:' + s.gem.c1 + ';--g2:' + s.gem.c2 + '" title="' + _esc(s.name) + '：定着 ' + s.gems + ' / ' + s.total + '問">' +
        (s.cleared ? '<span class="crown">👑</span>' : '') +
        '<span class="tr-stone"></span>' +
        '<span class="nm">' + s.icon + ' ' + _esc(s.name) + '</span>' +
        '<span class="gn">' + s.gem.name + '</span>' +
        '<span class="ct">' + s.gems + ' / ' + s.total + '</span>' +
      '</a>').join('');
    const meds = subs.filter(s => s.chapters.some(c => c.grade > 0 || c.cleared)).map(s =>
      '<div class="tr-subj"><div class="tr-subj-h">' + s.icon + ' ' + _esc(s.name) +
        '<span class="cnt">🥇' + s.chapters.filter(c => c.grade === 3).length + ' 🥈' + s.chapters.filter(c => c.grade === 2).length + ' 🥉' + s.chapters.filter(c => c.grade === 1).length + '</span></div>' +
        '<div class="tr-meds">' + s.chapters.map((c, i) =>
          '<span class="tr-med ' + (c.grade ? 'g' + c.grade : 'm0') + (c.cleared ? ' clr' : '') + '" title="' + _esc(c.title) + (c.pct != null ? '（正答率 ' + c.pct + '%）' : '') + (c.cleared ? '・全問済' : '') + '">' +
            (c.grade ? MEDALS[c.grade] : (i + 1)) + '</span>').join('') +
        '</div></div>').join('');
    const crowns = subs.map(s =>
      '<div class="tr-crown' + (s.cleared ? ' on' : '') + '" title="' + _esc(s.name) + ' 済 ' + s.done + ' / ' + s.total + '"><span>' + s.icon + '</span>' + _esc(s.name) + '<em>' + (s.total ? Math.floor(s.done / s.total * 100) : 0) + '%</em></div>').join('');
    return '<div class="tr-shelf">' +
      '<div class="tr-sum">' +
        '<div><b>' + d.gems + '</b><i>💎 定着</i></div>' +
        '<div><b>' + d.medals[3] + '</b><i>🥇 金メダル</i></div>' +
        '<div><b>' + (d.medals[2] + d.medals[1]) + '</b><i>🥈🥉 銀・銅</i></div>' +
        '<div><b>' + d.clears + '</b><i>👑 科目制覇</i></div>' +
      '</div>' +
      '<div class="tr-h">💎 定着コレクション<small>3回連続で正解し、間隔が' + d.thr + '日以上に育った問題</small></div>' +
      '<div class="tr-gems">' + gems + '</div>' +
      '<div class="tr-h">🏅 章メダル<small>試験モードで章の半分以上を解くと評価（金90%・銀70%）</small></div>' +
      (meds || '<div class="tr-legend">まだメダルはありません。試験モードで章の半分以上を解くと、最初のメダルが棚に並びます。</div>') +
      '<div class="tr-legend">緑の輪＝その章を全問「済」にした印</div>' +
      '<div class="tr-h">👑 科目制覇の勲章<small>科目の全問を「済」にすると点灯</small></div>' +
      '<div class="tr-crowns">' + crowns + '</div>' +
    '</div>';
  }

  // 開いた瞬間に上位の宝石から光を撒く（ハブの粒子は MecFX＝固定 canvas）
  function shelfFx(host) {
    try {
      if (!window.MecFX || document.hidden) return;
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const top = [...host.querySelectorAll('.tr-gem')].filter(g => !g.classList.contains('lv0')).slice(0, 4);
      top.forEach((g, i) => setTimeout(() => {
        const r = g.querySelector('.tr-stone').getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const col = getComputedStyle(g).getPropertyValue('--g1').trim() || '#FFFFFF';
        MecFX.burst(r.left + r.width / 2, r.top + r.height / 2, { tier: 3, count: 16, colors: [col, '#FFFFFF'], shapes: ['star', 'circle'] });
      }, 250 + i * 140));
    } catch (e) {}
  }

  // ── 学習ツール側：このセッションで新しく定着した問題 ─────────────────────
  // study.html の _updateSRS が呼ぶ。試験の結果画面で1件のトーストにまとめて出す
  // （1問ごとに出すと授与トレイが埋まる）。
  const _sessionNew = new Set();
  function noteSrsChange(uid, before, after) {
    const thr = _thr();
    if (!isMastered(before, thr) && isMastered(after, thr)) _sessionNew.add(uid);
  }
  function flushSession() {
    const n = _sessionNew.size;
    _sessionNew.clear();
    if (!n) return 0;
    const G = window.MecGamify;
    if (G && G._defs && G._defs.toast) G._defs.toast('💎', n + '問が定着しました', 'トロフィー棚の宝石が育っています', null, '💎 定着 +' + n);
    return n;
  }

  window.MecTrophy = {
    isMastered, masteryDays, collect, shelfHtml, shelfFx, noteSrsChange, flushSession, cleanTitle, gemOf,
    MEDALS, MEDAL_NAMES, _consts: { MASTER_REPS, MASTER_DAYS, SRS_EXAM_FRACTION, GEMS },
  };
})();
