// boss.js — 統合カンファレンス（旧ボス戦・study.html?mode=boss）（2026-09-23 新設・2026-09-24 改名）
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
  // 2026-09-24: 表示名を「ボス戦」→「統合カンファレンス」へ（ユーザー判断）。相手は怪物ではなく「難症例」。
  //   内部の名前（id 'boss'・mec_boss_v1・MecBoss・体力 hp）は据え置き＝戦績と配線をそのまま使う。
  //   画面では体力を反転して「診断確度」（0→100%）として見せる。hp が 0 ＝診断確定。
  const BOSSES = ['🩻', '🫀', '🫁', '🧠', '🦠', '🧬', '🩸', '🔬'];
  const TITLES = ['難症例', '鑑別困難例', '診断未確定例', '紹介症例', '重症例', '症例検討'];

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

  // ── 診断確度のゲージ（画面下に固定。ヘッダの高さは1pxも変えない＝_fxBand の基準を動かさない） ──
  // 意匠は「金の額縁＋記章」。⚠️ 常時動くのはこのゲージ1枚の中だけ（光沢・記章の輪・バーの光）で、
  //   どれも箱の中を動く background / rotate＝箱の外へはみ出さない（iOS のビューポート拡大を起こさない）。
  const CSS = `
#bossHud{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));translate:-50% 0;z-index:8000;
  width:min(580px,calc(100% - 20px));box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:10px 16px 10px 12px;border-radius:18px;overflow:hidden;
  background:radial-gradient(120% 160% at 0% 0%,rgba(255,214,120,.18),transparent 55%),radial-gradient(90% 140% at 100% 100%,rgba(120,190,255,.12),transparent 60%),
    linear-gradient(160deg,#1C1233 0%,#0E1530 55%,#1B1024 100%);
  border:1px solid rgba(232,196,110,.8);
  box-shadow:inset 0 0 0 3px rgba(14,10,24,.92),inset 0 0 0 4px rgba(232,196,110,.38),0 12px 32px rgba(0,0,0,.6),0 0 30px rgba(232,196,110,.3);
  color:#fff;pointer-events:none;transition:opacity .3s ease,translate .4s cubic-bezier(.2,1.3,.4,1);}
#bossHud.hide{opacity:0;translate:-50% 140%;}
/* 四隅の金の装飾 */
#bossHud::before{content:'';position:absolute;inset:7px;border-radius:12px;pointer-events:none;
  --g:rgba(240,206,120,.95);
  background:linear-gradient(var(--g),var(--g)) top left/16px 2px no-repeat,linear-gradient(var(--g),var(--g)) top left/2px 16px no-repeat,
    linear-gradient(var(--g),var(--g)) top right/16px 2px no-repeat,linear-gradient(var(--g),var(--g)) top right/2px 16px no-repeat,
    linear-gradient(var(--g),var(--g)) bottom left/16px 2px no-repeat,linear-gradient(var(--g),var(--g)) bottom left/2px 16px no-repeat,
    linear-gradient(var(--g),var(--g)) bottom right/16px 2px no-repeat,linear-gradient(var(--g),var(--g)) bottom right/2px 16px no-repeat;}
/* 額縁の上を流れる光沢（箱いっぱいの要素の中で background だけが動く） */
#bossHud::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(105deg,transparent 42%,rgba(255,236,180,.16) 50%,transparent 58%) 0 0/260% 100% no-repeat;
  animation:bhSheen 5.2s linear infinite;}
@keyframes bhSheen{from{background-position:120% 0}to{background-position:-20% 0}}
#bossHud .bh-seal{position:relative;flex-shrink:0;width:50px;height:50px;display:grid;place-items:center;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#3D2C58,#120C20 72%);
  box-shadow:0 0 0 2px #E8C46E,0 0 0 4px rgba(20,14,30,.95),0 0 0 5px rgba(232,196,110,.55),0 0 20px rgba(232,196,110,.5);}
#bossHud .bh-seal::before{content:'';position:absolute;inset:-8px;border-radius:50%;pointer-events:none;
  background:conic-gradient(from 0deg,transparent 0 18%,rgba(255,226,150,.95) 24%,transparent 30% 68%,rgba(140,220,255,.85) 74%,transparent 80%);
  -webkit-mask:radial-gradient(circle,transparent 60%,#000 62%,#000 68%,transparent 70%);mask:radial-gradient(circle,transparent 60%,#000 62%,#000 68%,transparent 70%);
  animation:bhSpin 6s linear infinite;}
@keyframes bhSpin{to{rotate:360deg}}
#bossHud .bh-face{font-size:27px;line-height:1;filter:drop-shadow(0 0 8px rgba(255,226,150,.65));}
#bossHud .bh-mid{position:relative;z-index:1;flex:1;min-width:0;}
#bossHud .bh-tag{font-size:9.5px;font-weight:900;letter-spacing:.3em;white-space:nowrap;
  color:transparent;background:linear-gradient(90deg,#B98E34,#FFE9A8 50%,#B98E34);-webkit-background-clip:text;background-clip:text;}
#bossHud .bh-top{display:flex;align-items:baseline;gap:8px;font-size:12.5px;font-weight:900;margin-top:1px;}
#bossHud .bh-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#bossHud .bh-hp{margin-left:auto;font-variant-numeric:tabular-nums;color:#FFE08A;white-space:nowrap;text-shadow:0 0 10px rgba(255,210,110,.55);}
#bossHud .bh-hp small{font-size:9.5px;font-weight:800;color:rgba(255,236,190,.7);margin-right:4px;letter-spacing:.08em;}
#bossHud .bh-bar{position:relative;height:12px;border-radius:99px;overflow:hidden;margin-top:5px;
  background:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),rgba(232,196,110,.5) calc(25% - 1px) 25%),rgba(255,255,255,.08);
  border:1px solid rgba(232,196,110,.45);box-shadow:inset 0 1px 3px rgba(0,0,0,.6);}
#bossHud .bh-lag{position:absolute;inset:0 auto 0 0;background:rgba(255,110,140,.85);transition:width .9s .35s ease;}
#bossHud .bh-fill{position:absolute;inset:0 auto 0 0;overflow:hidden;border-radius:99px;
  background:linear-gradient(90deg,#3FA7FF,#7CE0FF 45%,#FFE08A 80%,#FFC24B);box-shadow:0 0 12px rgba(124,224,255,.7);transition:width .45s cubic-bezier(.2,1,.3,1);}
#bossHud .bh-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%) 0 0/220% 100% no-repeat;animation:bhFillShine 2.4s linear infinite;}
@keyframes bhFillShine{from{background-position:130% 0}to{background-position:-30% 0}}
#bossHud.near .bh-fill{box-shadow:0 0 16px rgba(255,214,110,.95);}
#bossHud.near .bh-seal{animation:bhNear 1.6s ease-in-out infinite;}
@keyframes bhNear{0%,100%{box-shadow:0 0 0 2px #E8C46E,0 0 0 4px rgba(20,14,30,.95),0 0 0 5px rgba(232,196,110,.55),0 0 20px rgba(232,196,110,.5)}
  50%{box-shadow:0 0 0 2px #FFE9A8,0 0 0 4px rgba(20,14,30,.95),0 0 0 5px rgba(255,233,168,.9),0 0 34px rgba(255,214,110,.95)}}
#bossHud .bh-sub{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.66);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#bossHud .bh-sub b{color:#FFE9A8;}
#bossHud.hit .bh-face{animation:bhHit .42s ease;}
#bossHud.heal .bh-bar{animation:bhHeal .6s ease;}
@keyframes bhHit{0%{scale:1;filter:brightness(2.6) drop-shadow(0 0 16px #fff)}35%{scale:1.3}100%{scale:1}}
@keyframes bhHeal{0%,100%{box-shadow:inset 0 1px 3px rgba(0,0,0,.6)}40%{box-shadow:0 0 0 2px #FF6E8C,0 0 18px #FF6E8C}}
.bh-pop{position:fixed;z-index:8001;pointer-events:none;font-weight:900;font-size:22px;white-space:nowrap;translate:-50% 0;
  text-shadow:0 2px 8px rgba(0,0,0,.85);animation:bhPop 1s cubic-bezier(.2,1,.3,1) forwards;}
.bh-pop.crit{font-size:30px;color:#FFD166;text-shadow:0 0 18px rgba(255,209,102,.9),0 2px 8px rgba(0,0,0,.85);}
.bh-pop.dmg{color:#9FE8FF;} .bh-pop.heal{color:#FF9DB0;font-size:17px;}
@keyframes bhPop{0%{opacity:0;transform:translateY(8px) scale(.6)}20%{opacity:1;transform:translateY(-10px) scale(1.15)}100%{opacity:0;transform:translateY(-58px) scale(1)}}
/* 診断確定の幕。⚠️ overflow:hidden を外さないこと（光条は画面より大きい） */
#bossWin{position:fixed;inset:0;z-index:8500;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;
  background:radial-gradient(circle at 50% 45%,rgba(255,214,120,.34),rgba(8,6,20,.8) 70%);animation:bwIn .3s ease both;}
#bossWin .bw-rays{position:absolute;left:50%;top:45%;width:170vmax;height:170vmax;translate:-50% -50%;border-radius:50%;
  background:repeating-conic-gradient(from 0deg,rgba(255,222,140,.22) 0 6deg,transparent 6deg 15deg);
  -webkit-mask:radial-gradient(circle,#000 8%,transparent 55%);mask:radial-gradient(circle,#000 8%,transparent 55%);animation:bwSpin 14s linear infinite,bwIn .6s ease both;}
@keyframes bwSpin{to{rotate:360deg}}
#bossWin .bw-seal{position:relative;width:128px;height:128px;display:grid;place-items:center;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#4A3668,#140D24 72%);
  box-shadow:0 0 0 3px #F0CE78,0 0 0 7px rgba(20,14,30,.95),0 0 0 9px rgba(240,206,120,.7),0 0 60px rgba(255,214,110,.8);animation:bwRise .7s .1s cubic-bezier(.2,1.4,.4,1) both;}
#bossWin .bw-face{font-size:68px;line-height:1;filter:drop-shadow(0 0 14px rgba(255,236,180,.8));}
#bossWin .bw-stamp{position:absolute;right:-26px;bottom:-10px;padding:4px 12px;border:3px solid #E0344F;border-radius:10px;rotate:-14deg;
  font-weight:900;font-size:26px;letter-spacing:.12em;color:#FF4D67;background:rgba(20,6,12,.55);text-shadow:0 0 12px rgba(255,77,103,.7);
  animation:bwStampHit .45s .75s cubic-bezier(.3,1.6,.5,1) both;}
#bossWin .bw-t{margin-top:22px;font-family:var(--font-display,inherit);font-size:clamp(34px,11vw,76px);font-weight:900;letter-spacing:.12em;white-space:nowrap;
  color:transparent;background:linear-gradient(180deg,#FFF6D6 0%,#FFD978 45%,#C8902E 100%);-webkit-background-clip:text;background-clip:text;
  filter:drop-shadow(0 0 22px rgba(255,209,102,.85)) drop-shadow(0 4px 10px rgba(0,0,0,.8));animation:bwStamp .6s .35s cubic-bezier(.3,1.6,.5,1) both;}
#bossWin .bw-en{margin-top:2px;font-size:clamp(10px,2.6vw,14px);font-weight:900;letter-spacing:.5em;color:#FFE9A8;text-shadow:0 0 10px rgba(255,209,102,.8);animation:bwIn .4s .7s both;}
#bossWin .bw-rule{width:min(360px,70vw);height:2px;margin:12px 0 8px;background:linear-gradient(90deg,transparent,#F0CE78 20%,#FFF3C4 50%,#F0CE78 80%,transparent);animation:bwIn .4s .75s both;}
#bossWin .bw-s{font-size:15px;font-weight:800;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.9);animation:bwIn .4s .85s both;}
@keyframes bwIn{from{opacity:0}to{opacity:1}}
@keyframes bwRise{0%{opacity:0;scale:.4}100%{opacity:1;scale:1}}
@keyframes bwStamp{0%{transform:scale(3);opacity:0}70%{transform:scale(.92);opacity:1}100%{transform:scale(1)}}
@keyframes bwStampHit{0%{opacity:0;scale:2.6}70%{opacity:1;scale:.9}100%{opacity:1;scale:1}}
body.boss-on .ct{padding-bottom:100px;}
/* 結果画面の帯 */
.exam-boss-res{position:relative;margin:4px 0 12px;padding:16px 18px 14px;border-radius:16px;text-align:center;font-weight:900;font-size:16px;color:#FFE9B8;
  background:radial-gradient(120% 140% at 50% 0%,rgba(255,214,120,.22),transparent 60%),linear-gradient(160deg,#241634,#121A34 60%,#21122A);
  border:1px solid rgba(232,196,110,.85);
  box-shadow:inset 0 0 0 3px rgba(14,10,24,.9),inset 0 0 0 4px rgba(232,196,110,.4),0 0 26px rgba(232,196,110,.28);}
.exam-boss-res::before{content:'';position:absolute;inset:7px;border-radius:10px;pointer-events:none;--g:rgba(240,206,120,.95);
  background:linear-gradient(var(--g),var(--g)) top left/18px 2px no-repeat,linear-gradient(var(--g),var(--g)) top left/2px 18px no-repeat,
    linear-gradient(var(--g),var(--g)) top right/18px 2px no-repeat,linear-gradient(var(--g),var(--g)) top right/2px 18px no-repeat,
    linear-gradient(var(--g),var(--g)) bottom left/18px 2px no-repeat,linear-gradient(var(--g),var(--g)) bottom left/2px 18px no-repeat,
    linear-gradient(var(--g),var(--g)) bottom right/18px 2px no-repeat,linear-gradient(var(--g),var(--g)) bottom right/2px 18px no-repeat;}
.exam-boss-res .ebr-tag{display:block;font-size:10px;letter-spacing:.34em;color:transparent;background:linear-gradient(90deg,#B98E34,#FFE9A8 50%,#B98E34);-webkit-background-clip:text;background-clip:text;}
.exam-boss-res .ebr-main{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:17px;}
.exam-boss-res .ebr-seal{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;font-size:20px;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%,#3D2C58,#120C20 72%);box-shadow:0 0 0 2px #E8C46E,0 0 14px rgba(232,196,110,.5);}
.exam-boss-res .ebr-verdict{padding:1px 9px;border:2px solid #E0344F;border-radius:7px;rotate:-6deg;color:#FF5A72;font-size:14px;letter-spacing:.1em;}
.exam-boss-res .ebr-note{display:block;margin-top:8px;font-size:12px;font-weight:700;color:rgba(255,255,255,.8);}
.exam-boss-res.lose{color:#DCE6FF;border-color:rgba(170,190,240,.7);
  box-shadow:inset 0 0 0 3px rgba(14,10,24,.9),inset 0 0 0 4px rgba(170,190,240,.35),0 0 22px rgba(150,170,230,.22);}
.exam-boss-res.lose::before{--g:rgba(190,205,245,.85);}
.exam-boss-res.lose .ebr-verdict{border-color:#8FA6E0;color:#B9C9F5;}
@media (prefers-reduced-motion:reduce){#bossHud,#bossHud *,#bossHud::before,#bossHud::after,#bossHud *::before,#bossHud *::after,.bh-pop,#bossWin,#bossWin *{animation:none!important;transition:none!important}}
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
      h.innerHTML = '<span class="bh-seal"><span class="bh-face"></span></span><div class="bh-mid"><div class="bh-tag">❦ 統合カンファレンス ❦</div>' +
        '<div class="bh-top"><span class="bh-name"></span><span class="bh-hp"></span></div>' +
        '<div class="bh-bar"><i class="bh-lag"></i><i class="bh-fill"></i></div><div class="bh-sub"></div></div>';
      document.body.appendChild(h);
    }
    return h;
  }

  // 画面に出すのは「診断確度」＝体力の裏返し（0→100%）
  function _conf() { return S ? Math.round((HP_MAX - Math.max(0, S.hp)) / HP_MAX * 100) : 0; }

  function _paint() {
    if (!S) return;
    const h = _hud();
    const pct = _conf();
    h.querySelector('.bh-face').textContent = S.boss.glyph;
    h.querySelector('.bh-name').textContent = S.boss.icon + ' ' + S.boss.name;
    h.querySelector('.bh-hp').innerHTML = '<small>診断確度</small>' + pct + '%';
    h.querySelector('.bh-fill').style.width = pct + '%';
    h.querySelector('.bh-lag').style.width = pct + '%';
    const left = (typeof examQueue !== 'undefined') ? examQueue.filter(c => !c.classList.contains('exam-revealed')).length : 0;
    h.querySelector('.bh-sub').innerHTML = S.won
      ? '<b>診断確定！</b>　所見 ' + S.hits + '・決め手 <b>' + S.crits + '</b>・追加検討 ' + S.added + '/' + S.reserveMax
      : '残り <b>' + left + '</b>問　追加検討 <b>' + S.added + '</b>/' + S.reserveMax + '　決め手 <b>' + S.crits + '</b>';
    h.classList.toggle('near', pct >= 70 && !S.won);
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
    el.style.left = (face.left + face.width / 2 + (cls === 'heal' ? 70 : 0)) + 'px';
    el.style.top = (face.top - 14) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function _hitFx(crit) {
    if (!_fxOk()) return;
    const r = _hud().querySelector('.bh-face').getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    MecFX.burst(x, y, { tier: crit ? 5 : 3, count: crit ? 46 : 22, colors: crit ? ['#FFD166', '#FFFFFF', '#FFE9A8'] : ['#7CE0FF', '#FFFFFF', '#FFE08A'], shapes: ['star', 'circle', 'square'] });
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
      _pop((d.crit ? '決め手！ ' : '') + '+' + d.dmg + '%', d.crit ? 'crit' : 'dmg');
      _hitFx(d.crit);
      if (S.hp <= 0) { _defeat(card); return; }
    } else {
      const before = S.hp;
      S.hp = Math.min(HP_MAX, S.hp + HEAL);
      S.heals++;
      const added = _reinforce();
      _pulse('heal');
      _pop('所見が揺らぐ −' + (S.hp - before) + '%' + (added ? '　追加検討 +1問' : ''), 'heal');
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
      w.innerHTML = '<div class="bw-rays"></div>' +
        '<div class="bw-seal"><span class="bw-face">' + S.boss.glyph + '</span><span class="bw-stamp">確定</span></div>' +
        '<div class="bw-t">診断確定</div><div class="bw-en">DIAGNOSIS CONFIRMED</div><div class="bw-rule"></div>' +
        '<div class="bw-s">' + _esc(S.boss.icon + ' ' + S.boss.name) + ' — 統合カンファレンスにて確定</div>';
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
    const n = (typeof examAnswered !== 'undefined' ? examAnswered : 0);
    const head = '<span class="ebr-tag">❦ 統合カンファレンス ❦</span>' +
      '<div class="ebr-main"><span class="ebr-seal">' + S.boss.glyph + '</span>' + _esc(S.boss.name);
    const html = S.won
      ? '<div class="exam-boss-res">' + head + '<span class="ebr-verdict">診断確定</span></div>' +
        '<span class="ebr-note">' + n + '問で確定・決め手 ' + S.crits + '回・所見が揺らいだのは ' + S.heals + '回</span></div>'
      : '<div class="exam-boss-res lose">' + head + '<span class="ebr-verdict">結論持ち越し</span></div>' +
        '<span class="ebr-note">診断確度 ' + _conf() + '%。未解決の所見は次回のカンファレンスへ——誤答を解き直して、次こそ確定させよう</span></div>';
    note.insertAdjacentHTML('beforebegin', html);
  }

  function record() { try { return JSON.parse(localStorage.getItem(K_REC) || '{}'); } catch { return {}; } }

  window.MecBoss = {
    start, onAnswer, onExit, decorateSummary, makeBoss, damageOf, record,
    state: () => S,
    _consts: { HP_MAX, DMG, DMG_HARD, CRIT_EVERY, HEAL },
  };
})();
