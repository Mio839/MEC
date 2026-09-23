// boss.js — ボス戦（study.html?mode=boss）（2026-09-23 新設）
//
// 苦手な問題（🚩・何度も落とした問題）を科目横断で集め、ボスの体力ゲージを削っていく試験。
//   ・正解でボスにダメージ（難問は大ダメージ・3連続ごとに会心）
//   ・誤答するとボスが回復し、控えの問題が1問「増援」としてキューの末尾に足される（上限あり）
//   ・体力を0にした時点で撃破＝試験を切り上げて結果画面へ。問題が尽きても体力が残れば撤退。
//   ⚠️ 誤答の「罰」は回復と増援だけ。こちらの体力や敗北は作らない（ユーザー判断 2026-09-23）。
//
// 出題の配管は study.html の startBossBattle（今日の誤答の再履修と同じ「専用ホストに必要な問題だけを
// 起こす」方式）。このファイルは体力の計算・画面下の体力ゲージ・演出だけを持つ。
// 呼び口は study_exam.js の2か所だけ：_tallyQuestion → onAnswer（3つの採点経路の合流点）、
// exitExam → onExit、showExamSummary → decorateSummary。
//
// ⚠️ 増援はキュー（examQueue）へ足してから _examSyncQueue() を呼ぶこと（出題範囲の正本は examQueue）。
// ⚠️ 画面を揺らさない（正解・連続正解時の画面の揺れは禁止）。揺れるのは体力ゲージのボスの絵だけ。
// ⚠️ 戦績 mec_boss_v1 は UIローカル・非同期（ハブのタイルの脚に出すだけ）。同期対象へ足さないこと。
(function () {
  'use strict';

  const HP_MAX = 100;
  const DMG = 12;            // 通常の正解
  const DMG_HARD = 18;       // 難問（全国正答率60%未満＝_isHardCard）
  const CRIT_EVERY = 3;      // この連続数ごとに会心（×1.5）
  const HEAL = 8;            // 誤答でボスが回復する量
  const K_REC = 'mec_boss_v1';
  const BOSSES = ['👹', '🐉', '👾', '🦑', '💀', '🦂', '🐙', '🧟'];
  const TITLES = ['魔王', '番人', '巨獣', '亡霊', '覇者', '主'];

  let S = null;   // 戦闘の状態（start で作る。onExit 後も結果画面のために残す）

  function _hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function _reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function _fxOk() { return !!window.MecFX && !_reduced() && !document.hidden; }
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // ボスの名前（その日の苦手の多い科目から。乱数にしない＝同じ日は同じ相手）
  function makeBoss(subj, day) {
    const h = _hash((subj && subj.id || '') + day);
    return {
      glyph: BOSSES[h % BOSSES.length],
      name: (subj ? subj.name : '苦手') + 'の' + TITLES[(h >>> 5) % TITLES.length],
      icon: subj ? subj.icon : '⚔️',
    };
  }

  // 1問ぶんのダメージ。streakAfter = この正解を含めた連続正解数
  function damageOf(isHard, streakAfter) {
    const base = isHard ? DMG_HARD : DMG;
    const crit = streakAfter > 0 && streakAfter % CRIT_EVERY === 0;
    return { dmg: Math.round(base * (crit ? 1.5 : 1)), crit };
  }

  // ── 体力ゲージ（画面下に固定。ヘッダの高さは1pxも変えない＝_fxBand の基準を動かさない） ──
  const CSS = `
#bossHud{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));translate:-50% 0;z-index:8000;
  width:min(560px,calc(100% - 20px));box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:16px;
  background:linear-gradient(160deg,rgba(40,12,24,.95),rgba(14,8,20,.96));border:1px solid rgba(255,90,120,.45);
  box-shadow:0 10px 30px rgba(0,0,0,.55),0 0 26px rgba(255,60,100,.25);color:#fff;pointer-events:none;
  transition:opacity .3s ease,translate .4s cubic-bezier(.2,1.3,.4,1);}
#bossHud.hide{opacity:0;translate:-50% 140%;}
#bossHud .bh-face{font-size:34px;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 10px rgba(255,80,110,.7));}
#bossHud .bh-mid{flex:1;min-width:0;}
#bossHud .bh-top{display:flex;align-items:baseline;gap:8px;font-size:12px;font-weight:900;}
#bossHud .bh-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#bossHud .bh-hp{margin-left:auto;font-variant-numeric:tabular-nums;color:#FFB3C2;white-space:nowrap;}
#bossHud .bh-bar{position:relative;height:12px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:4px;border:1px solid rgba(255,255,255,.12);}
#bossHud .bh-lag{position:absolute;inset:0 auto 0 0;background:rgba(255,230,160,.85);transition:width .9s .35s ease;}
#bossHud .bh-fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#FF2E63,#FF7A59,#FFC15E);box-shadow:0 0 12px rgba(255,80,110,.8);transition:width .28s ease;}
#bossHud.low .bh-fill{background:linear-gradient(90deg,#FF1744,#FF5252);}
#bossHud .bh-sub{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.62);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#bossHud .bh-sub b{color:#fff;}
#bossHud.hit .bh-face{animation:bhHit .38s ease;}
#bossHud.heal .bh-bar{animation:bhHeal .6s ease;}
@keyframes bhHit{0%{translate:0 0;filter:brightness(3) drop-shadow(0 0 16px #fff)}25%{translate:-6px 0}50%{translate:5px 0}75%{translate:-3px 0}100%{translate:0 0}}
@keyframes bhHeal{0%,100%{box-shadow:none}40%{box-shadow:0 0 0 2px #3DD68C,0 0 18px #3DD68C}}
.bh-pop{position:fixed;z-index:8001;pointer-events:none;font-weight:900;font-size:22px;white-space:nowrap;translate:-50% 0;
  text-shadow:0 2px 8px rgba(0,0,0,.8);animation:bhPop 1s cubic-bezier(.2,1,.3,1) forwards;}
.bh-pop.crit{font-size:30px;color:#FFD166;}
.bh-pop.dmg{color:#FFFFFF;} .bh-pop.heal{color:#6CF0A8;font-size:18px;}
@keyframes bhPop{0%{opacity:0;transform:translateY(8px) scale(.6)}20%{opacity:1;transform:translateY(-10px) scale(1.15)}100%{opacity:0;transform:translateY(-58px) scale(1)}}
#bossWin{position:fixed;inset:0;z-index:8500;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;
  background:radial-gradient(circle at 50% 45%,rgba(255,200,80,.25),rgba(0,0,0,.55) 70%);animation:bwIn .3s ease both;}
#bossWin .bw-face{font-size:84px;filter:grayscale(1) brightness(.6);animation:bwFall 1.1s .15s ease-in both;}
#bossWin .bw-t{font-family:var(--font-display,inherit);font-size:clamp(26px,8.4vw,64px);font-weight:900;letter-spacing:.03em;white-space:nowrap;color:#FFD166;
  text-shadow:0 0 30px rgba(255,209,102,.95),0 4px 12px rgba(0,0,0,.8);animation:bwStamp .6s .35s cubic-bezier(.3,1.6,.5,1) both;}
#bossWin .bw-s{margin-top:6px;font-size:15px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.9);animation:bwIn .4s .8s both;}
@keyframes bwIn{from{opacity:0}to{opacity:1}}
@keyframes bwFall{0%{transform:none;opacity:1}100%{transform:translateY(40px) rotate(28deg) scale(.6);opacity:0}}
@keyframes bwStamp{0%{transform:scale(3);opacity:0}70%{transform:scale(.92);opacity:1}100%{transform:scale(1)}}
body.boss-on .ct{padding-bottom:84px;}
.exam-boss-res{margin:4px 0 10px;padding:12px 14px;border-radius:14px;text-align:center;font-weight:900;font-size:16px;
  background:linear-gradient(160deg,rgba(255,200,80,.18),rgba(255,120,60,.08));border:1px solid rgba(255,209,102,.55);color:#FFE3A8;}
.exam-boss-res.lose{background:linear-gradient(160deg,rgba(120,140,200,.16),rgba(80,90,140,.08));border-color:rgba(150,170,230,.45);color:#D6E0FF;}
.exam-boss-res span{display:block;margin-top:4px;font-size:12px;font-weight:700;color:rgba(255,255,255,.78);}
@media (prefers-reduced-motion:reduce){#bossHud *,#bossHud,.bh-pop,#bossWin,#bossWin *{animation:none!important;transition:none!important}}
`;
  function _css() {
    if (document.getElementById('mecBossCss')) return;
    const st = document.createElement('style'); st.id = 'mecBossCss'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function _hud() {
    let h = document.getElementById('bossHud');
    if (!h) {
      h = document.createElement('div');
      h.id = 'bossHud'; h.className = 'hide';
      h.setAttribute('role', 'status'); h.setAttribute('aria-live', 'polite');
      h.innerHTML = '<span class="bh-face"></span><div class="bh-mid"><div class="bh-top"><span class="bh-name"></span><span class="bh-hp"></span></div>' +
        '<div class="bh-bar"><i class="bh-lag"></i><i class="bh-fill"></i></div><div class="bh-sub"></div></div>';
      document.body.appendChild(h);
    }
    return h;
  }

  function _paint() {
    if (!S) return;
    const h = _hud();
    const pct = Math.max(0, S.hp) / HP_MAX * 100;
    h.querySelector('.bh-face').textContent = S.boss.glyph;
    h.querySelector('.bh-name').textContent = S.boss.icon + ' ' + S.boss.name;
    h.querySelector('.bh-hp').textContent = 'HP ' + Math.max(0, S.hp) + ' / ' + HP_MAX;
    h.querySelector('.bh-fill').style.width = pct + '%';
    h.querySelector('.bh-lag').style.width = pct + '%';
    const left = (typeof examQueue !== 'undefined') ? examQueue.filter(c => !c.classList.contains('exam-revealed')).length : 0;
    h.querySelector('.bh-sub').innerHTML = S.won
      ? '<b>撃破！</b>　' + S.hits + '撃・会心 <b>' + S.crits + '</b>・増援 ' + S.added + '/' + S.reserveMax
      : '残り <b>' + left + '</b>問　増援 <b>' + S.added + '</b>/' + S.reserveMax + '　会心 <b>' + S.crits + '</b>';
    h.classList.toggle('low', pct <= 30);
  }

  function _pulse(cls) {
    const h = _hud();
    h.classList.remove(cls); void h.offsetWidth; h.classList.add(cls);
    setTimeout(() => h.classList.remove(cls), 650);
  }

  function _pop(text, cls) {
    const face = _hud().querySelector('.bh-face').getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'bh-pop ' + cls;
    el.textContent = text;
    el.style.left = (face.left + face.width / 2 + (cls === 'heal' ? 60 : 0)) + 'px';
    el.style.top = (face.top - 12) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function _hitFx(crit) {
    if (!_fxOk()) return;
    const r = _hud().querySelector('.bh-face').getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    MecFX.burst(x, y, { tier: crit ? 5 : 3, count: crit ? 46 : 22, colors: crit ? ['#FFD166', '#FFFFFF', '#FF7A59'] : ['#FF7A59', '#FFFFFF', '#FFC15E'], shapes: ['star', 'circle', 'square'] });
    if (crit && MecFX.rings) MecFX.rings(x, y, { count: 2, maxR: 140, color: '#FFD166', thickness: 3, additive: true, stagger: .1 });
  }

  // ── 公開：開始 ──────────────────────────────────────────────────────
  // info = { boss, reserve: [card...]（増援の控え。DOM に描画済みで出題範囲の外） }
  function start(info) {
    _css();
    S = {
      boss: info.boss, hp: HP_MAX, reserve: (info.reserve || []).slice(), reserveMax: (info.reserve || []).length,
      added: 0, crits: 0, heals: 0, hits: 0, won: false, over: false, startN: info.startN || 0,
    };
    document.body.classList.add('boss-on');
    _paint();
    // カウントダウンの幕が明けてから下からせり上がる
    setTimeout(() => { if (S && !S.over) _hud().classList.remove('hide'); }, 900);
  }

  // 増援：控えの先頭を1問、出題範囲の末尾へ足す
  function _reinforce() {
    const card = S.reserve.shift();
    if (!card || typeof examQueue === 'undefined') return false;
    const last = _examOrder[_examOrder.length - 1];
    if (last && last.parentNode) last.after(card);
    examQueue.push(card);
    _examSyncQueue();
    card.style.display = '';
    _prepExamCard(card, false);
    // 目盛りを敷き直す。⚠️ 難問の成績（分子）は _renderExamProgMarks が 0 に戻すので控えて戻す
    const hs = Object.assign({}, _examHardStat);
    _renderExamProgMarks();
    _examHardStat.answered = hs.answered; _examHardStat.correct = hs.correct;
    S.added++;
    return true;
  }

  // ── 公開：1問の採点（study_exam.js の _tallyQuestion から） ─────────────
  function onAnswer(card, isCorrect) {
    if (!S || S.over) return;
    if (isCorrect) {
      const streakAfter = (typeof examStreak !== 'undefined' ? examStreak : 0) + 1;   // examStreak++ はこの後
      const d = damageOf(typeof _isHardCard === 'function' && _isHardCard(card), streakAfter);
      S.hp = Math.max(0, S.hp - d.dmg);
      S.hits++; if (d.crit) S.crits++;
      _pulse('hit');
      _pop((d.crit ? '会心！ ' : '') + '-' + d.dmg, d.crit ? 'crit' : 'dmg');
      _hitFx(d.crit);
      if (S.hp <= 0) { _defeat(card); return; }
    } else {
      const before = S.hp;
      S.hp = Math.min(HP_MAX, S.hp + HEAL);
      S.heals++;
      const added = _reinforce();
      _pulse('heal');
      _pop('+' + (S.hp - before) + (added ? '　増援 +1問' : ''), 'heal');
    }
    _paint();
  }

  // 撃破：出題範囲を「解いた問題＋いま解いた1問」に切り詰めて、演出の後に結果画面へ
  function _defeat(card) {
    S.won = true; S.over = true;
    examQueue = examQueue.filter(c => c === card || c.classList.contains('exam-revealed'));
    _examSyncQueue();
    document.querySelectorAll('#srsReviewHost .qc[data-uid]').forEach(c => { if (!_examHas(c)) c.style.display = 'none'; });
    _paint();
    _recordResult(true);
    const reduced = _reduced();
    setTimeout(() => {
      if (!S || !examMode) return;
      const w = document.createElement('div');
      w.id = 'bossWin';
      w.innerHTML = '<div class="bw-face">' + S.boss.glyph + '</div><div class="bw-t">BOSS DEFEATED!</div>' +
        '<div class="bw-s">' + _esc(S.boss.name) + ' を撃破</div>';
      document.body.appendChild(w);
      if (_fxOk()) {
        const x = innerWidth / 2, y = innerHeight * .45;
        MecFX.burst(x, y, { tier: 6, count: 140, colors: ['#FFD166', '#FFFFFF', '#FF7A59', '#FF2E63'], shapes: ['star', 'circle', 'square'] });
        MecFX.rings && MecFX.rings(x, y, { count: 3, maxR: 420, color: '#FFD166', thickness: 4, additive: true, stagger: .12 });
        MecFX.confetti && MecFX.confetti({ count: 180 });
        MecFX.fireworks && setTimeout(() => MecFX.fireworks({ tier: 6, count: 7 }), 500);
      }
      setTimeout(() => { w.remove(); if (examMode) exitExam(); }, reduced ? 1400 : 2600);
    }, 700);   // 正解の演出をひと呼吸見せてから
  }

  function _recordResult(won) {
    try {
      const r = JSON.parse(localStorage.getItem(K_REC) || '{}');
      r.fights = (r.fights || 0) + 1;
      if (won) r.wins = (r.wins || 0) + 1;
      r.last = { day: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), won: !!won, boss: S.boss.name, glyph: S.boss.glyph };
      localStorage.setItem(K_REC, JSON.stringify(r));
    } catch (e) {}
  }

  // ── 公開：試験の終わり（exitExam から） ────────────────────────────────
  function onExit() {
    const h = document.getElementById('bossHud');
    if (h) h.classList.add('hide');
    document.body.classList.remove('boss-on');
    document.querySelectorAll('.bh-pop,#bossWin').forEach(el => el.remove());
    if (S && !S.over) { S.over = true; _recordResult(false); }
  }

  function decorateSummary() {
    if (!S) return;
    const note = document.getElementById('sumFlagNote');
    if (!note) return;
    const html = S.won
      ? '<div class="exam-boss-res">⚔️ ' + S.boss.glyph + ' ' + _esc(S.boss.name) + ' を撃破！' +
        '<span>' + (typeof examAnswered !== 'undefined' ? examAnswered : 0) + '問で討伐・会心 ' + S.crits + '回・回復されたのは ' + S.heals + '回</span></div>'
      : '<div class="exam-boss-res lose">🛡 撤退… ' + S.boss.glyph + ' ' + _esc(S.boss.name) + ' の残り体力 ' + S.hp + '%' +
        '<span>苦手はまだ残っている。誤答を解き直して、次こそ討伐しよう</span></div>';
    note.insertAdjacentHTML('beforebegin', html);
  }

  function record() { try { return JSON.parse(localStorage.getItem(K_REC) || '{}'); } catch { return {}; } }

  window.MecBoss = {
    start, onAnswer, onExit, decorateSummary, makeBoss, damageOf, record,
    state: () => S,
    _consts: { HP_MAX, DMG, DMG_HARD, CRIT_EVERY, HEAL },
  };
})();
