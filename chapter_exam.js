/**
 * chapter_exam.js — 章ファイル用試験モード
 * <script src="../chapter_exam.js"></script> で各章HTMLから読み込む
 */
(function () {
  'use strict';

  // ─── Script base (for asset paths independent of HTML file depth) ─
  var scriptBase = '../';
  (function () {
    var cs = document.currentScript;
    if (cs && cs.src) scriptBase = cs.src.replace(/chapter_exam\.js.*$/, '');
  })();

  // ─── fx_engine.js（Canvasパーティクルエンジン）を動的ロード ──
  (function () {
    if (window.MecFX) return;
    var s = document.createElement('script');
    s.src = scriptBase + 'fx_engine.js';
    s.async = true;
    (document.head || document.documentElement).appendChild(s);
  })();

  // ─── State ────────────────────────────────────────────────────
  var exam = {
    active: false,
    queue: [],
    answered: 0,
    correct: 0,
    streak: 0,
    startTime: null,
    timerInt: null,
    count: 50,
    chKey: null,
    effectSet: 'classic',
    sound: localStorage.getItem('chExamCorrectSound') || 'ping',
    ssound: localStorage.getItem('chExamSelectSound') || 'mp3'
  };

  var CE_EFFECT_SETS = ['classic', 'neon', 'ink', 'ecg', 'space', 'retro', 'luxury'];
  // classic は他セットの半分の重み（1票 vs 各2票）で選ばれる
  var CE_EFFECT_POOL = CE_EFFECT_SETS.reduce(function (a, s) { return a.concat(s === 'classic' ? [s] : [s, s]); }, []);
  var _ceChoiceBackup = new Map();
  var _ceScrollRaf = null;

  // ─── CSS ──────────────────────────────────────────────────────
  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = [
      '#chExamBtn.exam-on{background:#C0392B;border-color:#C0392B;color:#fff;}',
      'body.ch-exam-mode .ab,body.ch-exam-mode .eg{display:none!important;}',
      'body.ch-exam-mode .qc.ch-exam-revealed .ab{display:flex!important;}',
      'body.ch-exam-mode .qc.ch-exam-revealed .eg{display:grid!important;}',
      'body.ch-exam-mode .ch2{cursor:pointer;border-radius:5px;padding:2px 5px;margin:-2px -5px;transition:background .1s;}',
      'body.ch-exam-mode .ch2:hover{background:rgba(0,0,0,.06);}',
      'body.ch-exam-mode .qc:not(.ch-exam-revealed) .ch2.ok{color:inherit;font-weight:normal;}',
      'body.ch-exam-mode .qc:not(.ch-exam-revealed) .ch2 .ok{color:inherit;font-weight:normal;}',
      'body.ch-exam-mode .qc.ch-exam-key-focus:not(.ch-exam-revealed){outline:3px solid #FFB830;outline-offset:2px;box-shadow:0 0 0 5px rgba(255,184,48,.15);}',
      '.ch-exam-multi-info{font-size:11px;font-weight:700;padding:4px 8px;margin:4px 0;border-radius:6px;background:rgba(0,0,0,.04);color:#5A6475;border:1.5px solid rgba(0,0,0,.08);transition:background .2s,border-color .2s,color .2s;}',
      '.ch-exam-multi-info[data-ready="1"]{background:rgba(45,140,78,.1);color:#2D8C4E;border-color:rgba(45,140,78,.3);}',
      '@keyframes ceMultiShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
      '@keyframes ceCorrect{0%{background:#00E676;color:#fff;}100%{background:#C8F7C5;color:#1a6b2f;}}',
      'body.ch-exam-mode .ch2.ch-exam-instant-correct{background:#C8F7C5!important;color:#1a6b2f!important;font-weight:700!important;animation:ceCorrect .4s ease-out;}',
      '@keyframes ceCorrectNeon{0%{background:#00E5FF;color:#001018;}100%{background:rgba(0,229,255,.28);color:#00E5FF;}}',
      'body.ch-effect-neon.ch-exam-mode .ch2.ch-exam-instant-correct{background:rgba(0,229,255,.28)!important;color:#00E5FF!important;font-weight:700!important;text-shadow:0 0 6px rgba(0,229,255,.7),0 0 14px rgba(255,43,214,.4);animation:ceCorrectNeon .4s ease-out;}',
      '@keyframes ceCorrectInk{0%{background:#C93A3A;color:#fff;}100%{background:rgba(201,58,58,.18);color:#C93A3A;}}',
      'body.ch-effect-ink.ch-exam-mode .ch2.ch-exam-instant-correct{background:rgba(201,58,58,.18)!important;color:#C93A3A!important;font-weight:700!important;animation:ceCorrectInk .5s ease-out;}',
      '@keyframes ceWrongShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
      '@keyframes ceWrongPop{0%{background:rgba(255,107,107,.35)}100%{background:rgba(255,107,107,.15)}}',
      '@keyframes ceCardGlow{0%{box-shadow:0 0 0 2px #FF6B6B}100%{box-shadow:0 2px 10px rgba(0,0,0,.07)}}',
      'body.ch-exam-mode .ch2.ch-exam-instant-wrong{background:rgba(255,107,107,.15)!important;color:#FF6B6B!important;font-weight:700!important;animation:ceWrongPop .3s ease forwards,ceWrongShake .48s .04s ease;}',
      'body.ch-exam-mode .qc:has(.ch-exam-instant-wrong){animation:ceCardGlow .8s ease forwards;}',
      /* progress bar */
      '#chExamProg{display:none;align-items:center;gap:8px;padding:4px 14px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;font-weight:700;position:sticky;top:var(--ch-sn-h,0px);z-index:99;}',
      'body.ch-exam-mode #chExamProg{display:flex;}',
      '.ce-prog-track{flex:1;height:5px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden;}',
      '.ce-prog-fill{height:100%;background:#FFB830;border-radius:3px;transition:width .3s;}',
      /* start modal */
      '#chExamStartOv{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:5000;align-items:center;justify-content:center;backdrop-filter:blur(4px);}',
      '#chExamStartOv.open{display:flex;}',
      '.ce-box{background:#0F1B35;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:24px;max-width:320px;width:90%;text-align:center;}',
      '.ce-box h2{font-size:17px;font-weight:800;color:var(--tx,#e8edf5);margin-bottom:4px;}',
      '.ce-box p{font-size:12px;color:var(--ts,#8899aa);margin-bottom:14px;}',
      '.ce-cnt-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}',
      '.ce-cnt-btn{padding:10px;border-radius:10px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);font-size:14px;font-weight:700;cursor:pointer;color:var(--tx,#e8edf5);transition:all .15s;font-family:inherit;}',
      '.ce-cnt-btn:hover,.ce-cnt-btn.sel{background:#1E3A5F;border-color:rgba(255,255,255,.32);color:#fff;}',
      '.ce-go-btn{width:100%;padding:11px;border-radius:10px;border:none;background:#FF9A3C;color:#fff;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:8px;font-family:inherit;}',
      '.ce-go-btn:hover{filter:brightness(1.1);}',
      '.ce-cancel-btn{background:none;border:none;color:var(--ts,#8899aa);font-size:12px;cursor:pointer;font-family:inherit;}',
      /* result modal */
      '#chExamResultOv{display:none;position:fixed;top:0;left:0;width:100%;height:100vh;height:100dvh;background:rgba(0,0,0,.75);z-index:5000;align-items:center;justify-content:center;padding:12px;backdrop-filter:blur(4px);}',
      '#chExamResultOv.open{display:flex;}',
      '.ce-result-box{background:#0F1B35;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:24px 28px;max-width:360px;width:90%;text-align:center;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);overflow-y:auto;-webkit-overflow-scrolling:touch;}',
      '.ce-pct{font-size:52px;font-weight:900;line-height:1;color:var(--tx,#e8edf5);}',
      '.ce-pct-sub{font-size:12px;color:var(--ts,#8899aa);margin-bottom:14px;}',
      '.ce-detail{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;}',
      '.ce-di{background:rgba(255,255,255,.06);border-radius:8px;padding:8px;}',
      '.ce-di .lbl{font-size:10px;color:var(--ts,#8899aa);font-weight:700;}',
      '.ce-di .val{font-size:19px;font-weight:800;color:var(--tx,#e8edf5);}',
      '.ce-close-btn{width:100%;padding:11px;border-radius:10px;border:none;background:rgba(255,255,255,.1);color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;}',
      /* streak toast */
      '@keyframes ceStreakIn{0%{opacity:0;transform:translateX(-50%) translateY(-22px) scale(.65) rotate(-4deg);}12%{opacity:1;transform:translateX(-50%) translateY(5px) scale(1.18) rotate(1.5deg);}20%{transform:translateX(-50%) translateY(-3px) scale(.95) rotate(-.5deg);}30%{transform:translateX(-50%) translateY(1px) scale(1.05);}50%{transform:translateX(-50%) translateY(0) scale(1);}68%{opacity:1;}100%{opacity:0;transform:translateX(-50%) translateY(-16px) scale(.88);}}',
      '@keyframes ceFlash{0%{opacity:1;}35%{opacity:.25;}55%{opacity:.75;}100%{opacity:0;}}',
      '@keyframes ceRainbowHue{0%{filter:hue-rotate(0deg);}100%{filter:hue-rotate(360deg);}}',
      '#chExamStreakToast{position:fixed;top:68px;left:50%;transform:translateX(-50%);padding:9px 24px;border-radius:28px;font-weight:900;pointer-events:none;z-index:9100;opacity:0;white-space:nowrap;letter-spacing:.05em;text-shadow:0 2px 10px rgba(0,0,0,.55);}',
      '#chExamStreakToast.show{animation:ceStreakIn var(--sd,2s) ease forwards;}',
      '#chExamStreakToast.t1{background:rgba(61,214,140,.22);color:#3DD68C;border:2px solid rgba(61,214,140,.55);font-size:24px;}',
      '#chExamStreakToast.t2{background:rgba(255,160,64,.24);color:#FFA040;border:2px solid rgba(255,160,64,.65);font-size:28px;box-shadow:0 0 30px rgba(255,160,64,.35);}',
      '#chExamStreakToast.t3{background:rgba(255,80,40,.24);color:#FF5820;border:2px solid rgba(255,100,40,.7);font-size:34px;box-shadow:0 0 45px rgba(255,80,40,.5);}',
      '#chExamStreakToast.t4{background:rgba(255,200,0,.28);color:#FFD700;border:2.5px solid rgba(255,210,0,.8);font-size:40px;box-shadow:0 0 70px rgba(255,200,0,.65),0 0 140px rgba(255,200,0,.3);}',
      '#chExamStreakToast.t5{background:rgba(255,220,0,.32);color:#FFE840;border:3px solid rgba(255,240,0,.9);font-size:46px;box-shadow:0 0 100px rgba(255,220,0,.8),0 0 200px rgba(255,200,0,.4);}',
      '#chExamStreakToast.t6{background:rgba(160,0,255,.35);color:#EE88FF;border:3px solid rgba(210,80,255,.97);font-size:54px;box-shadow:0 0 120px rgba(160,0,255,.9),0 0 260px rgba(100,0,220,.5);}',
      '#chExamStreakToast.t6.show{animation:ceStreakIn var(--sd,2s) ease forwards,ceRainbowHue var(--sd,2s) linear;}',
      /* 演出セット別: トースト配色（ネオン/和風） */
      'body.ch-effect-neon #chExamStreakToast{font-family:\'Courier New\',monospace;border-radius:6px;letter-spacing:.02em;}',
      'body.ch-effect-neon #chExamStreakToast.t1{background:rgba(0,229,255,.18);color:#00E5FF;border:2px solid rgba(0,229,255,.55);}',
      'body.ch-effect-neon #chExamStreakToast.t2{background:rgba(122,92,255,.22);color:#7A5CFF;border:2px solid rgba(122,92,255,.6);box-shadow:0 0 30px rgba(122,92,255,.35),0 0 60px rgba(122,92,255,.12);}',
      'body.ch-effect-neon #chExamStreakToast.t3{background:rgba(255,43,214,.22);color:#FF2BD6;border:2px solid rgba(255,43,214,.65);box-shadow:0 0 45px rgba(255,43,214,.5),0 0 90px rgba(255,43,214,.2);}',
      'body.ch-effect-neon #chExamStreakToast.t4{background:rgba(0,229,255,.26);color:#00E5FF;border:2.5px solid rgba(0,229,255,.8);box-shadow:0 0 70px rgba(0,229,255,.6),0 0 140px rgba(0,229,255,.28);}',
      'body.ch-effect-neon #chExamStreakToast.t5{background:rgba(57,255,136,.28);color:#39FF88;border:3px solid rgba(57,255,136,.85);box-shadow:0 0 100px rgba(57,255,136,.7),0 0 200px rgba(57,255,136,.35);}',
      'body.ch-effect-neon #chExamStreakToast.t6{background:rgba(255,43,214,.32);color:#FF2BD6;border:3px solid rgba(255,43,214,.9);box-shadow:0 0 120px rgba(255,43,214,.85),0 0 260px rgba(0,229,255,.4);}',
      'body.ch-effect-ink #chExamStreakToast{font-family:\'Hiragino Mincho ProN\',\'Yu Mincho\',serif;border-radius:4px;letter-spacing:.08em;}',
      'body.ch-effect-ink #chExamStreakToast.t1{background:rgba(201,162,75,.22);color:#C9A24B;border:2px solid rgba(201,162,75,.55);}',
      'body.ch-effect-ink #chExamStreakToast.t2{background:rgba(201,58,58,.20);color:#C93A3A;border:2px solid rgba(201,58,58,.55);box-shadow:0 0 24px rgba(201,58,58,.3);}',
      'body.ch-effect-ink #chExamStreakToast.t3{background:rgba(139,30,30,.24);color:#E8925C;border:2px solid rgba(139,30,30,.6);box-shadow:0 0 35px rgba(139,30,30,.35);}',
      'body.ch-effect-ink #chExamStreakToast.t4{background:rgba(26,26,26,.4);color:#C9A24B;border:2.5px solid rgba(201,162,75,.7);box-shadow:0 0 50px rgba(201,162,75,.4);}',
      'body.ch-effect-ink #chExamStreakToast.t5{background:rgba(26,26,26,.5);color:#E8C468;border:3px solid rgba(232,196,104,.85);box-shadow:0 0 70px rgba(232,196,104,.5);}',
      'body.ch-effect-ink #chExamStreakToast.t6{background:rgba(201,58,58,.4);color:#FFD9D9;border:3px solid rgba(201,58,58,.95);box-shadow:0 0 100px rgba(201,58,58,.7),0 0 200px rgba(26,26,26,.4);}',
      '#chExamStreakFlash{position:fixed;inset:0;pointer-events:none;z-index:9050;opacity:0;}',
      '#chExamStreakFlash.flash{animation:ceFlash .75s ease forwards;}',
      '#chExamStreakBorder{position:fixed;inset:0;pointer-events:none;z-index:9045;opacity:0;}',
      '.ce-ring{position:fixed;border-radius:50%;pointer-events:none;z-index:9055;}',
      /* new combo effects */
      '#chExamComboMeter{position:fixed;top:0;left:0;right:0;height:3px;z-index:9300;pointer-events:none;opacity:0;transition:opacity .3s;}',
      '#chExamComboMeterFill{height:100%;width:0%;transition:width .35s cubic-bezier(.22,.68,0,1.25),background .4s;}',
      '#chStreakFullscreen{position:fixed;inset:0;z-index:9080;display:flex;align-items:center;justify-content:center;pointer-events:none;font-weight:900;line-height:1;font-size:42vmin;letter-spacing:-.04em;opacity:0;}',
      '#chTimestopOv{position:fixed;inset:0;z-index:9000;backdrop-filter:grayscale(.9) blur(1.8px) brightness(.72);-webkit-backdrop-filter:grayscale(.9) blur(1.8px) brightness(.72);pointer-events:none;opacity:0;display:none;}',
      /* history badge */
      '.ce-hist-badge{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(255,154,60,.15);color:#FF9A3C;border:1px solid rgba(255,154,60,.3);white-space:nowrap;margin-left:6px;cursor:default;}',
      '.ce-hist-badge.good{background:rgba(61,214,140,.15);color:#3DD68C;border-color:rgba(61,214,140,.3);}',
      '.ce-hist-badge.bad{background:rgba(255,107,107,.15);color:#FF6B6B;border-color:rgba(255,107,107,.3);}',
      /* 追加演出（2026-07-20・study側 study.css と同仕様のミラー） */
      '.ce-fast-pop{position:fixed;z-index:9220;pointer-events:none;font-size:18px;font-weight:900;letter-spacing:.06em;white-space:nowrap;text-shadow:0 2px 10px rgba(0,0,0,.7);transform:translate(-50%,0);}',
      '.ce-trace-svg{position:fixed;z-index:8500;pointer-events:none;overflow:visible;}',
      '.ce-tierup{position:fixed;left:50%;top:38%;z-index:9350;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;}',
      '.ce-tierup .tu-lbl{font-size:13px;font-weight:900;letter-spacing:.42em;text-indent:.42em;color:rgba(255,255,255,.92);text-shadow:0 2px 8px rgba(0,0,0,.8);}',
      '.ce-tierup .tu-main{font-size:38px;font-weight:900;letter-spacing:.04em;white-space:nowrap;color:var(--tu-col,#FFD700);text-shadow:0 0 22px rgba(var(--tu-glow,255,215,0),.85),0 0 52px rgba(var(--tu-glow,255,215,0),.45),0 3px 12px rgba(0,0,0,.75);}',
      '.ce-zone-collapse{position:fixed;inset:0;z-index:9060;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 44%,rgba(255,60,60,.20) 0%,rgba(0,0,0,.45) 70%);}',
      '#chExamComboMeterLbl{position:fixed;top:7px;right:10px;z-index:9310;pointer-events:none;opacity:0;font-size:10px;font-weight:800;letter-spacing:.04em;white-space:nowrap;font-variant-numeric:tabular-nums;text-shadow:0 1px 6px rgba(0,0,0,.8);}',
      '#chExamStreakSig{position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:9150;pointer-events:none;opacity:0;font-size:13px;font-weight:800;letter-spacing:.1em;white-space:nowrap;font-variant-numeric:tabular-nums;text-shadow:0 2px 10px rgba(0,0,0,.75);}',
      'body.ce-awaken #mecFxCanvas{filter:saturate(1.45) brightness(1.1);}',
      'body.ce-awaken #chExamComboMeter{height:5px;}',
      '#chExamCountdown{position:fixed;inset:0;z-index:9400;display:none;align-items:center;justify-content:center;pointer-events:none;}',
      '.ce-cd-num{font-size:22vmin;font-weight:900;line-height:1;letter-spacing:-.03em;text-shadow:0 0 40px rgba(0,0,0,.55),0 6px 24px rgba(0,0,0,.7);}',
      '.ce-cd-num.go{font-size:13vmin;letter-spacing:.08em;}',
      /* 開始ブートシーケンス（study.css と同仕様のミラー） */
      '#chExamCountdown{background:rgba(2,5,12,.72);overflow:hidden;}',
      '.cd-scan{position:absolute;inset:0;pointer-events:none;opacity:.5;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.045) 0 1px,transparent 1px 3px);}',
      '.cd-br{position:absolute;width:26px;height:26px;border:2px solid var(--cd-col,#FFD700);opacity:.85;}',
      '.cd-br.tl{top:14px;left:14px;border-right:none;border-bottom:none;}',
      '.cd-br.tr{top:14px;right:14px;border-left:none;border-bottom:none;}',
      '.cd-br.bl{bottom:14px;left:14px;border-right:none;border-top:none;}',
      '.cd-br.br{bottom:14px;right:14px;border-left:none;border-top:none;}',
      '.cd-log{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:Menlo,Consolas,monospace;font-size:clamp(13px,3.4vmin,20px);line-height:2;letter-spacing:.02em;color:var(--cd-col,#FFD700);text-shadow:0 0 12px rgba(var(--cd-glow,255,215,0),.65);white-space:nowrap;text-align:left;transition:top .45s cubic-bezier(.16,1,.3,1),font-size .45s cubic-bezier(.16,1,.3,1),opacity .45s;}',
      '#chExamCountdown.cd-p2 .cd-log{top:19%;font-size:clamp(10px,2vmin,13px);opacity:.5;}',
      '.cd-line{overflow:hidden;}',
      '.cd-num{position:relative;font-size:24vmin;font-weight:900;line-height:1;letter-spacing:-.04em;color:var(--cd-col,#FFD700);opacity:0;text-shadow:0 0 28px rgba(var(--cd-glow,255,215,0),.85),0 0 70px rgba(var(--cd-glow,255,215,0),.4),0 6px 24px rgba(0,0,0,.75);}',
      '.cd-num.go{font-size:11vmin;letter-spacing:.14em;}',
      '.cd-sub{position:absolute;bottom:23%;font-size:12px;font-weight:800;letter-spacing:.3em;text-indent:.3em;opacity:0;color:var(--cd-col,#FFD700);font-family:Menlo,Consolas,monospace;}',
      '.cd-sweep{position:absolute;left:0;right:0;top:calc(50% - 2px);height:4px;background:linear-gradient(90deg,transparent,var(--cd-col,#FFD700),transparent);box-shadow:0 0 24px rgba(var(--cd-glow,255,215,0),.9);}',
      '.cd-reticle{position:absolute;width:52vmin;height:52vmin;animation:cdReticle 2.6s cubic-bezier(.16,1,.3,1);}',
      '.cd-reticle i.c{position:absolute;width:22%;height:22%;border:2.5px solid var(--cd-col,#FFD700);opacity:.65;}',
      '.cd-reticle i.c.tl{top:0;left:0;border-right:none;border-bottom:none;}',
      '.cd-reticle i.c.tr{top:0;right:0;border-left:none;border-bottom:none;}',
      '.cd-reticle i.c.bl{bottom:0;left:0;border-right:none;border-top:none;}',
      '.cd-reticle i.c.br{bottom:0;right:0;border-left:none;border-top:none;}',
      '.cd-reticle .rh,.cd-reticle .rv{position:absolute;background:var(--cd-col,#FFD700);opacity:.35;}',
      '.cd-reticle .rh{left:-24vmin;right:-24vmin;top:50%;height:1px;}',
      '.cd-reticle .rv{top:-24vmin;bottom:-24vmin;left:50%;width:1px;}',
      '@keyframes cdReticle{0%{transform:scale(1.5) rotate(-3deg);opacity:0}35%{opacity:.5}100%{transform:none;opacity:.5}}',
      '.cd-rings{position:absolute;width:58vmin;height:58vmin;overflow:visible;}',
      '.cd-rings circle{fill:none;stroke:var(--cd-col,#00E5FF);transform-origin:100px 100px;}',
      '.cd-rings .r1{stroke-width:1;opacity:.45;stroke-dasharray:34 12;animation:cdSpin 7s linear infinite;}',
      '.cd-rings .r2{stroke-width:2;opacity:.7;stroke-dasharray:110 300;animation:cdSpinR 3.4s linear infinite;}',
      '.cd-rings .r3{stroke-width:1;opacity:.3;stroke-dasharray:4 9;animation:cdSpin 5s linear infinite reverse;}',
      '@keyframes cdSpin{to{transform:rotate(360deg)}}',
      '@keyframes cdSpinR{from{transform:rotate(360deg)}to{transform:rotate(0)}}',
      '.cd-stream{position:absolute;inset:0;overflow:hidden;opacity:.28;}',
      '.cd-col{position:absolute;top:-40%;left:var(--x,0);white-space:pre;line-height:1.25;font-family:Menlo,Consolas,monospace;font-size:13px;color:var(--cd-col,#00E5FF);animation:cdFall 2.6s linear var(--d,0s) both;}',
      '@keyframes cdFall{from{transform:translateY(-30%)}to{transform:translateY(130%)}}',
      '@media (prefers-reduced-motion: reduce){.ce-fast-pop,.ce-trace-svg,.ce-tierup,.ce-zone-collapse,#chExamCountdown,#chExamStreakSig{display:none!important;}}'
    ].join('');
    document.head.appendChild(s);
  }

  // ─── Detect chapter key ────────────────────────────────────────
  function detectChKey() {
    var card = document.querySelector('.qc[data-uid]');
    if (!card) return null;
    var m = card.dataset.uid.match(/^(.+)_q\d+$/);
    return m ? m[1] : null;
  }

  // ─── Inject UI ────────────────────────────────────────────────
  function injectUI() {
    // Exam button in .sn
    var sn = document.querySelector('.sn');
    if (sn) {
      var sep = document.createElement('span');
      sep.className = 'fsep';
      var btn = document.createElement('button');
      btn.className = 'nb';
      btn.id = 'chExamBtn';
      btn.textContent = '🎓 試験';
      btn.onclick = openChExam;
      sn.appendChild(sep);
      sn.appendChild(btn);
    }

    // Progress bar — insert after .sn2 (or .sn)
    var ref = document.querySelector('.sn2') || sn;
    var prog = document.createElement('div');
    prog.id = 'chExamProg';
    prog.innerHTML =
      '<span id="ceProgTxt">0 / 0 問</span>' +
      '<div class="ce-prog-track"><div class="ce-prog-fill" id="ceProgFill" style="width:0%"></div></div>' +
      '<span id="ceTimer">00:00</span>' +
      '<button onclick="window._ceExit()" style="background:none;border:1px solid rgba(255,255,255,.4);border-radius:12px;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;cursor:pointer;font-family:inherit;">終了</button>';
    if (ref && ref.parentNode) {
      ref.parentNode.insertBefore(prog, ref.nextSibling);
    }

    // Start modal
    var startOv = document.createElement('div');
    startOv.id = 'chExamStartOv';
    startOv.innerHTML =
      '<div class="ce-box">' +
        '<h2>🎓 試験モード</h2>' +
        '<p>この章の問題から出題<br>選択肢はシャッフルされます</p>' +
        '<div class="ce-cnt-grid">' +
          '<button class="ce-cnt-btn" data-n="20" onclick="window._ceCnt(20,this)">20問</button>' +
          '<button class="ce-cnt-btn sel" data-n="50" onclick="window._ceCnt(50,this)">50問</button>' +
          '<button class="ce-cnt-btn" data-n="100" onclick="window._ceCnt(100,this)">100問</button>' +
          '<button class="ce-cnt-btn" data-n="0" onclick="window._ceCnt(0,this)">全問</button>' +
        '</div>' +
        '<button class="ce-go-btn" onclick="window._ceStart()">開始</button>' +
        '<button class="ce-cancel-btn" onclick="window._ceCloseStart()">キャンセル</button>' +
      '</div>';
    document.body.appendChild(startOv);

    // Result modal
    var resultOv = document.createElement('div');
    resultOv.id = 'chExamResultOv';
    resultOv.innerHTML =
      '<div class="ce-result-box">' +
        '<h2>📊 試験結果</h2>' +
        '<div class="ce-pct" id="cePctNum">—</div>' +
        '<div class="ce-pct-sub" id="cePctSub"></div>' +
        '<div class="ce-detail" id="ceDetail"></div>' +
        '<button class="ce-close-btn" onclick="window._ceCloseResult()">閉じる</button>' +
      '</div>';
    document.body.appendChild(resultOv);

    // Streak elements
    var toast = document.createElement('div');
    toast.id = 'chExamStreakToast';
    document.body.appendChild(toast);

    var flash = document.createElement('div');
    flash.id = 'chExamStreakFlash';
    document.body.appendChild(flash);

    var border = document.createElement('div');
    border.id = 'chExamStreakBorder';
    document.body.appendChild(border);

    var meter = document.createElement('div');
    meter.id = 'chExamComboMeter';
    meter.innerHTML = '<div id="chExamComboMeterFill"></div>';
    document.body.appendChild(meter);

    var fsCombo = document.createElement('div');
    fsCombo.id = 'chStreakFullscreen';
    document.body.appendChild(fsCombo);

    var tsOv = document.createElement('div');
    tsOv.id = 'chTimestopOv';
    document.body.appendChild(tsOv);
  }

  // ─── Exam history badge ────────────────────────────────────────
  function renderHistBadge() {
    var old = document.querySelector('.ce-hist-badge');
    if (old) old.remove();
    if (!exam.chKey) return;
    var hist;
    try { hist = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}'); } catch (e) { hist = {}; }
    var h = hist[exam.chKey];
    if (!h) return;
    var cls = h.lastScore >= 80 ? 'good' : h.lastScore >= 60 ? '' : 'bad';
    var badge = document.createElement('span');
    badge.className = 'ce-hist-badge ' + cls;
    badge.title = '試験回数: ' + h.sessions + '回 | 最高: ' + h.bestScore + '%';
    badge.textContent = '🎓 ' + h.lastDate + ' ' + h.lastScore + '%';
    var progArea = document.querySelector('.mec-ch-prog');
    if (progArea) progArea.appendChild(badge);
  }

  // ─── Modal controls ────────────────────────────────────────────
  function openChExam() {
    if (exam.chKey && exam.chKey.indexOf('kakumon_') === 0) {
      exam.count = 0;
      window._ceStart();
      return;
    }
    document.getElementById('chExamStartOv').classList.add('open');
  }
  window._ceCloseStart = function () {
    document.getElementById('chExamStartOv').classList.remove('open');
  };
  window._ceCnt = function (n, el) {
    exam.count = n;
    document.querySelectorAll('.ce-cnt-btn').forEach(function (b) { b.classList.remove('sel'); });
    el.classList.add('sel');
  };

  // ─── Start ────────────────────────────────────────────────────
  window._ceStart = function () {
    window._ceCloseStart();

    var cards = Array.from(document.querySelectorAll('.qc[data-uid]')).filter(function (c) {
      return c.style.display !== 'none' && !c.classList.contains('filt-hidden') &&
             getComputedStyle(c).display !== 'none';
    });

    var queue = cards.slice().sort(function () { return Math.random() - .5; });
    if (exam.count > 0) queue = queue.slice(0, exam.count);

    exam.queue = queue;
    exam.answered = 0;
    exam.correct = 0;
    exam.streak = 0;
    exam.active = true;
    exam.startTime = Date.now();
    exam.effectSet = CE_EFFECT_POOL[Math.floor(Math.random() * CE_EFFECT_POOL.length)];
    _ceSeenAt = {}; ceZoneStop(false); ceSetAwaken(false);
    document.body.classList.remove.apply(document.body.classList, CE_EFFECT_SETS.map(function (s) { return 'ch-effect-' + s; }));
    if (exam.effectSet !== 'classic') document.body.classList.add('ch-effect-' + exam.effectSet);
    if (location.search.indexOf('debug=1') !== -1) alert('[chapter_exam.js] effectSet: ' + exam.effectSet);

    document.body.classList.add('ch-exam-mode');
    var btn = document.getElementById('chExamBtn');
    if (btn) btn.classList.add('exam-on');

    _ceChoiceBackup.clear();
    queue.forEach(function (card) {
      ceShuffleChoices(card);
      var req = ceRequiredCount(card);
      if (req > 1 && !card.querySelector('.ch-exam-multi-info')) {
        var info = document.createElement('div');
        info.className = 'ch-exam-multi-info';
        info.textContent = '0 / ' + req + ' 選択中';
        info.dataset.ready = '0';
        var cs = card.querySelector('.cs');
        if (cs) cs.parentNode.insertBefore(info, cs);
      }
    });

    if (queue[0]) queue[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateProg();
    startTimer();
    document.addEventListener('keydown', ceKeyHandler);
    window.addEventListener('scroll', ceOnScroll, { passive: true });
    requestAnimationFrame(ceUpdateFocus);
    ceCountdown();   // 3・2・1・START（非ブロッキング）
  };

  // ─── Choice shuffle (skip images / bare-letter tables) ─────────
  function ceShuffleChoices(card) {
    if (card.querySelector('.qimg-row')) return;
    if (card.querySelector('.qt u')) return;
    var cs = card.querySelector('.cs');
    if (!cs) return;
    var choices = Array.from(cs.querySelectorAll('.ch2'));
    if (choices.length < 2) return;
    if (choices.every(function (ch) { return /^[ａ-ｅa-e]$/.test(ch.textContent.trim()); })) return;
    _ceChoiceBackup.set(card.dataset.uid, choices.map(function (c) { return c.cloneNode(true); }));
    var shuffled = choices.slice().sort(function () { return Math.random() - .5; });
    shuffled.forEach(function (ch, i) {
      cs.appendChild(ch);
      var tn = ch.firstChild;
      if (tn && tn.nodeType === Node.TEXT_NODE) {
        tn.textContent = tn.textContent.replace(/^[ａ-ｅa-e][　\s]*/i, (i + 1) + '　');
      }
    });
  }

  function ceRestoreChoices() {
    _ceChoiceBackup.forEach(function (originals, uid) {
      var cs = document.querySelector('.qc[data-uid="' + uid + '"] .cs');
      if (!cs) return;
      cs.innerHTML = '';
      originals.forEach(function (c) { cs.appendChild(c); });
    });
    _ceChoiceBackup.clear();
  }

  function isChoiceOk(ch2) {
    return ch2.classList.contains('ok') || !!ch2.querySelector('.ok');
  }

  function ceRequiredCount(card) {
    var n = Array.from(card.querySelectorAll('.ch2')).filter(isChoiceOk).length;
    return Math.max(1, n);
  }

  function ceUpdateMultiInfo(card) {
    var req = ceRequiredCount(card);
    var sel = card.querySelectorAll('.ch2.ch-exam-selected').length;
    var info = card.querySelector('.ch-exam-multi-info');
    if (info) { info.textContent = sel + ' / ' + req + ' 選択中'; info.dataset.ready = sel >= req ? '1' : '0'; }
  }

  // ─── Exit ─────────────────────────────────────────────────────
  window._ceExit = function () { cleanup(); };

  function cleanup() {
    exam.active = false;
    ceZoneStop(false); ceSetAwaken(false);
    clearInterval(exam.timerInt);
    document.body.classList.remove.apply(document.body.classList, ['ch-exam-mode'].concat(CE_EFFECT_SETS.map(function (s) { return 'ch-effect-' + s; })));
    var btn = document.getElementById('chExamBtn');
    if (btn) btn.classList.remove('exam-on');
    document.querySelectorAll('.qc').forEach(function (c) {
      c.classList.remove('ch-exam-revealed', 'ch-exam-key-focus');
    });
    document.querySelectorAll('.ch2').forEach(function (c) {
      c.classList.remove('ch-exam-selected', 'ch-exam-instant-correct', 'ch-exam-instant-wrong');
    });
    document.querySelectorAll('.ch-exam-multi-info').forEach(function (el) { el.remove(); });
    document.querySelectorAll('.ce-particle,.ce-ring,.ce-fx-temp,.ce-tierup,.ce-fast-pop,.ce-trace-svg,.ce-zone-collapse').forEach(function (el) {
      el.remove();
    });
    if (window.MecFX) window.MecFX.clear();
    document.removeEventListener('keydown', ceKeyHandler);
    window.removeEventListener('scroll', ceOnScroll);
    ceRestoreChoices();
  }

  // ─── Result ───────────────────────────────────────────────────
  function showResult() {
    var pct = exam.answered > 0 ? Math.round(exam.correct / exam.answered * 100) : 0;
    document.getElementById('cePctNum').textContent = pct + '%';
    document.getElementById('cePctSub').textContent = exam.correct + ' / ' + exam.answered + ' 問正解';

    var s = Math.floor((Date.now() - exam.startTime) / 1000);
    var ts = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    document.getElementById('ceDetail').innerHTML =
      '<div class="ce-di"><div class="lbl">正解</div><div class="val" style="color:#3DD68C">' + exam.correct + '</div></div>' +
      '<div class="ce-di"><div class="lbl">不正解</div><div class="val" style="color:#FF6B6B">' + (exam.answered - exam.correct) + '</div></div>' +
      '<div class="ce-di"><div class="lbl">問題数</div><div class="val">' + exam.answered + '</div></div>' +
      '<div class="ce-di"><div class="lbl">時間</div><div class="val" style="font-size:14px">' + ts + '</div></div>';

    var _rov = document.getElementById('chExamResultOv');
    _rov.classList.add('open');
    _ceBindOverlayVV(_rov);
    _ceFitOverlayVV(_rov);
    requestAnimationFrame(function () { _ceFitOverlayVV(_rov); });
    saveHistory(pct);
  }

  // iOS の position:fixed はレイアウトビューポート基準でモーダル上端が見切れるため、
  // visualViewport に合わせて可視領域の中央へ補正する（study_exam.js と同方針）。
  function _ceFitOverlayVV(ov) {
    var vv = window.visualViewport;
    if (!ov || !vv) return;
    ov.style.height = vv.height + 'px';
    ov.style.width = vv.width + 'px';
    ov.style.transform = 'translate(' + vv.offsetLeft + 'px,' + vv.offsetTop + 'px)';
    var box = ov.querySelector('.ce-result-box');
    if (box) box.style.maxHeight = (vv.height - 24) + 'px';
  }
  function _ceBindOverlayVV(ov) {
    if (!ov || ov._vvBound || !window.visualViewport) return;
    ov._vvBound = true;
    var upd = function () { if (ov.classList.contains('open')) _ceFitOverlayVV(ov); };
    window.visualViewport.addEventListener('resize', upd);
    window.visualViewport.addEventListener('scroll', upd);
  }

  window._ceCloseResult = function () {
    document.getElementById('chExamResultOv').classList.remove('open');
    renderHistBadge();
  };

  function saveHistory(pct) {
    if (!exam.chKey) return;
    try {
      var hist = JSON.parse(localStorage.getItem('mec_ch_exam_v1') || '{}');
      var e = hist[exam.chKey] || { sessions: 0, bestScore: 0 };
      hist[exam.chKey] = {
        lastDate: new Date().toISOString().slice(0, 10),
        sessions: (e.sessions || 0) + 1,
        lastScore: pct,
        lastCorrect: exam.correct,
        lastTotal: exam.answered,
        bestScore: Math.max(e.bestScore || 0, pct)
      };
      localStorage.setItem('mec_ch_exam_v1', JSON.stringify(hist));
    } catch (err) {}
  }

  // ─── Progress & timer ──────────────────────────────────────────
  function updateProg() {
    document.getElementById('ceProgTxt').textContent = exam.answered + ' / ' + exam.queue.length + ' 問';
    var w = exam.queue.length ? exam.answered / exam.queue.length * 100 : 0;
    document.getElementById('ceProgFill').style.width = w + '%';
  }

  function startTimer() {
    clearInterval(exam.timerInt);
    exam.timerInt = setInterval(function () {
      var s = Math.floor((Date.now() - exam.startTime) / 1000);
      var el = document.getElementById('ceTimer');
      if (el) el.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 1000);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  // ─── Answer click ─────────────────────────────────────────────
  function onChoiceClick(e) {
    if (!exam.active) return;
    var ch2 = e.target.closest && e.target.closest('.ch2');
    if (!ch2) return;
    var card = ch2.closest('.qc');
    if (!card || card.classList.contains('ch-exam-revealed')) return;
    ceSelectChoice(card, ch2);
  }

  // ─── Shared answer-selection logic (mouse click + keyboard) ────
  function ceSelectChoice(card, ch2) {
    if (card.classList.contains('ch-exam-revealed')) return;
    var req = ceRequiredCount(card);
    playSelect();
    if (req > 1) {
      ch2.classList.toggle('ch-exam-selected');
      if (ch2.classList.contains('ch-exam-selected') && !isChoiceOk(ch2)) {
        ch2.classList.add('ch-exam-instant-wrong');
        var info = card.querySelector('.ch-exam-multi-info');
        if (info) { info.style.animation = 'none'; void info.offsetHeight; info.style.animation = 'ceMultiShake .3s'; }
        setTimeout(function () { ceFinishAnswer(card, false); }, 400);
      } else {
        ceUpdateMultiInfo(card);
        var sel = Array.from(card.querySelectorAll('.ch2.ch-exam-selected'));
        if (sel.length === req && sel.every(isChoiceOk)) {
          sel.forEach(function (c) { c.classList.add('ch-exam-instant-correct'); });
          setTimeout(function () { ceFinishAnswer(card, true); }, 10);
        }
      }
    } else {
      card.querySelectorAll('.ch2').forEach(function (c) { c.classList.remove('ch-exam-selected'); });
      ch2.classList.add('ch-exam-selected');
      if (isChoiceOk(ch2)) {
        ch2.classList.add('ch-exam-instant-correct');
        setTimeout(function () { ceFinishAnswer(card, true); }, 10);
      } else {
        ch2.classList.add('ch-exam-instant-wrong');
        setTimeout(function () { ceFinishAnswer(card, false); }, 400);
      }
    }
  }

  function ceFinishAnswer(card, isOk) {
    if (card.classList.contains('ch-exam-revealed')) return;
    card.classList.add('ch-exam-revealed');
    exam.answered++;

    if (isOk) {
      exam.correct++;
      exam.streak++;
      showStreak(exam.streak);
      var _ceTier = ceTier(exam.streak);
      card.querySelectorAll('.ch2.ch-exam-instant-correct').forEach(function (c) { ceTriggerChoiceCorrectPop(c); });
      ceSpawnFloatingCombo(card, exam.streak, _ceTier);
      // ショックウェーブ・ボーダートレース・速答ボーナス
      var _ceOk = card.querySelector('.ch2.ch-exam-instant-correct');
      ceCorrectShockwave(_ceOk);
      ceTraceCardBorder(card);
      if (ceIsFast(card)) setTimeout(function () { ceFastBonus(_ceOk); }, 90);
      var _ceIdx = exam.queue.indexOf(card);
      var _ceNext = null;
      for (var _ci = _ceIdx + 1; _ci < exam.queue.length; _ci++) {
        if (!exam.queue[_ci].classList.contains('ch-exam-revealed')) { _ceNext = exam.queue[_ci]; break; }
      }
      if (_ceNext) { (function(nc){ setTimeout(function(){ ceApplyChoiceShimmer(nc); }, 140); })(_ceNext); }
      saveMyRate(card.dataset.uid, true);
    } else {
      card.querySelectorAll('.ch2').forEach(function (c) {
        if (isChoiceOk(c)) c.classList.add('ch-exam-instant-correct');
      });
      exam.streak = 0;
      ceResetComboMeter();
      ceZoneStop(true);   // ゾーン崩壊
      saveMyRate(card.dataset.uid, false);
    }

    if (isOk) setTimeout(playCorrect, 80);
    updateProg();
    ceUpdateFocus();

    if (exam.answered >= exam.queue.length) {
      setTimeout(function () { cleanup(); showResult(); }, 1200);
    }
  }

  // ─── Keyboard input (1-5 select, colored key-focus border) ─────
  function ceGetTargetCard() {
    var prog = document.getElementById('chExamProg');
    var hdrH = prog ? prog.getBoundingClientRect().bottom : 0;
    var cards = document.querySelectorAll('.qc[data-uid]');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.style.display !== 'none' && !c.classList.contains('ch-exam-revealed') && c.getBoundingClientRect().bottom > hdrH) return c;
    }
    return null;
  }

  function ceUpdateFocus() {
    document.querySelectorAll('.qc.ch-exam-key-focus').forEach(function (c) { c.classList.remove('ch-exam-key-focus'); });
    var card = ceGetTargetCard();
    if (card) { card.classList.add('ch-exam-key-focus'); ceMarkSeen(card); }
  }

  function ceOnScroll() {
    if (_ceScrollRaf) cancelAnimationFrame(_ceScrollRaf);
    _ceScrollRaf = requestAnimationFrame(ceUpdateFocus);
  }

  function ceKeyHandler(e) {
    if (!exam.active) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (!(e.key >= '1' && e.key <= '5')) return;
    var card = ceGetTargetCard();
    if (!card) return;
    e.preventDefault();
    var choices = Array.from(card.querySelectorAll('.ch2'));
    var n = parseInt(e.key, 10) - 1;
    if (choices[n]) ceSelectChoice(card, choices[n]);
  }

  // ─── myrate tracking ──────────────────────────────────────────
  function saveMyRate(uid, ok) {
    if (!uid) return;
    try {
      var r = JSON.parse(localStorage.getItem('myrate_v1') || '{}');
      var e = r[uid] || { total: 0, correct: 0 };
      e.total++;
      if (ok) e.correct++;
      r[uid] = e;
      localStorage.setItem('myrate_v1', JSON.stringify(r));
    } catch (err) {}
  }

  // ─── 演出セット（study.html の EXAM_EFFECT_THEMES と同一配色） ──
  function ceTier(n) {
    return n >= 20 ? 6 : n >= 15 ? 5 : n >= 10 ? 4 : n >= 7 ? 3 : n >= 4 ? 2 : 1;
  }

  var CE_EFFECT_THEMES = {
    classic: {
      burstPalettes: {
        2: ['#FFA040','#FFD700','#FFFFFF','#FFB830'],
        3: ['#FF5820','#FF9800','#FFFFFF','#FFD700','#FF6030'],
        4: ['#FFD700','#FFA040','#FFFFFF','#FFB830','#FFF176','#FF9800'],
        5: ['#FFE040','#FFD700','#FF9800','#FFFFFF','#FFF176','#FFB300','#FF5722','#4FC3F7'],
        6: ['#EE88FF','#CC44FF','#FFD700','#FF5722','#4FC3F7','#FFFFFF','#FFE040','#81C784','#F06292']
      },
      shapes: function (tier) { return tier >= 3 ? ['circle','square','star','star','square','circle'] : ['circle','square']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(210,80,255,.85)' : tier >= 4 ? 'rgba(255,210,0,.85)' : tier >= 3 ? 'rgba(255,88,32,.85)' : 'rgba(255,160,64,.75)'; },
      fullscreenCols: ['','','#FFA040','#FF5820','#FFD700','#FFE840','#CC44FF'],
      fullscreenGlow: ['','','255,160,64','255,88,32','255,200,0','255,220,0','200,60,255'],
      flashColors: ['','','rgba(255,160,64,.30)','rgba(255,80,40,.42)','rgba(255,200,0,.62)','rgba(255,220,0,.78)','rgba(160,0,255,.68)'],
      borderColors: {4:'#FF9800',5:'#FFD700',6:'#CC44FF'},
      bgRgbs: ['','61,214,140','255,160,64','255,88,32','255,210,0','255,232,0','210,80,255'],
      meterGrads: ['','linear-gradient(90deg,#3DD68C,#5EF0A8)','linear-gradient(90deg,#FFA040,#FFD060)','linear-gradient(90deg,#FF5820,#FF9040)','linear-gradient(90deg,#FFD700,#FFF060)','linear-gradient(90deg,#FFE040,#FFD700,#FF9800)','linear-gradient(90deg,#CC44FF,#EE88FF,#FF5722,#FFD700)'],
      labels: function (n) { return ['','🎯 '+n+'連続！','🔥 '+n+'連続！！','⚡️ '+n+'連続！！！','💥 '+n+'連続！！！！','🏆 '+n+'連続！！！！！','👑 '+n+'連続！！！！！！']; },
      popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.22),rgba(61,214,140,.10))',
      comboLabel: function (n) { return n >= 2 ? '×'+n+' COMBO!' : '+1'; },
      comboColors: ['','#3DD68C','#FFA040','#FF5820','#FFD700','#FFE840','#EE88FF'],
      useConfetti: true, rainType: 'confetti',
      useFireworks: true,
      useLightning: true,
      lightningCols: {3:'rgba(255,120,32,.95)',4:'rgba(255,210,0,1)',5:'rgba(255,235,0,1)',6:'rgba(200,80,255,1)'},
      useGlitch: true,
      useMedalDrop: true,
      floaterGlyphs: { 5:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉'], 6:['🔥','⚡️','💥','🏆','✨','🌟','💫','🎉','🎊','🥳','🌈','💎','👑','🎆'] },
      fastLabel: '⚡ 速答！',
      tierUpLabel: (t) => '🔥 TIER ' + Math.max(1, Math.min(t, 6)) + ' 突入',
      signature: (n) => '🔥 ' + n + ' 連鎖',
      zoneGlyphs: ['🔥','✨','💥'],
      zoneColors: ['#FFA040','#FFD700','#FF5820']
    },
    neon: {
      burstPalettes: {
        2: ['#00E5FF','#7A5CFF','#FFFFFF','#39FF88'],
        3: ['#FF2BD6','#00E5FF','#FFFFFF','#7A5CFF','#39FF88'],
        4: ['#00E5FF','#FF2BD6','#FFFFFF','#7A5CFF','#39FF88','#00FFC8'],
        5: ['#00E5FF','#FF2BD6','#7A5CFF','#FFFFFF','#39FF88','#00FFC8','#FFE600','#FF2BD6'],
        6: ['#FF2BD6','#00E5FF','#7A5CFF','#39FF88','#FFFFFF','#00FFC8','#FFE600','#FF6EC7']
      },
      shapes: function () { return ['square','shard']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(255,43,214,.9)' : tier >= 4 ? 'rgba(0,229,255,.9)' : 'rgba(122,92,255,.8)'; },
      fullscreenCols: ['','','#00E5FF','#FF2BD6','#7A5CFF','#39FF88','#FFE600'],
      fullscreenGlow: ['','','0,229,255','255,43,214','122,92,255','57,255,136','255,230,0'],
      flashColors: ['','','rgba(0,229,255,.30)','rgba(255,43,214,.42)','rgba(122,92,255,.62)','rgba(57,255,136,.70)','rgba(255,230,0,.72)'],
      borderColors: {4:'#00E5FF',5:'#FF2BD6',6:'#7A5CFF'},
      bgRgbs: ['','0,229,255','255,43,214','122,92,255','57,255,136','0,255,200','255,230,0'],
      meterGrads: ['','linear-gradient(90deg,#00E5FF,#39FF88)','linear-gradient(90deg,#7A5CFF,#00E5FF)','linear-gradient(90deg,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#39FF88,#00FFC8)','linear-gradient(90deg,#00E5FF,#FF2BD6,#7A5CFF)','linear-gradient(90deg,#FF2BD6,#00E5FF,#39FF88,#FFE600)'],
      labels: function (n) { return ['','⚡️ x'+n+' STREAK','💠 x'+n+' STREAK!!','🔷 x'+n+' OVERDRIVE','🤖 x'+n+' OVERDRIVE!!','👾 x'+n+' MAXIMUM','🛸 x'+n+' LIMIT BREAK']; },
      popOverlay: 'linear-gradient(135deg,rgba(0,229,255,.28),rgba(255,43,214,.14))',
      comboLabel: function (n) { return n >= 2 ? '⚡️[ x'+n+' ]' : '+1'; },
      comboColors: ['','#00E5FF','#7A5CFF','#FF2BD6','#39FF88','#00FFC8','#FFE600'],
      correctEmoji: ['⚡️','💠','🔷'],
      floaterScale: 1.5,
      useConfetti: false, rainType: 'digital',
      useFireworks: false, useCircuitPulse: true,
      useLightning: true,
      lightningCols: {3:'rgba(0,229,255,.95)',4:'rgba(255,43,214,1)',5:'rgba(122,92,255,1)',6:'rgba(57,255,136,1)'},
      useGlitch: true,
      useHeavyGlitch: true,
      floaterGlyphs: { 5:['⚡️','💠','🔷','👾','🤖'], 6:['⚡️','💠','🔷','👾','🛸','🤖','🔋','📡'] },
      fastLabel: '⚡ FAST!',
      tierUpLabel: (t) => '▲ LEVEL ' + Math.max(1, Math.min(t, 6)) + ' UNLOCKED',
      signature: (n) => 'SYNC ' + Math.min(99, 40 + n * 3) + '%',
      zoneGlyphs: ['⚡️','💠','🔷'],
      zoneColors: ['#00E5FF','#FF2BD6','#7A5CFF']
    },
    ink: {
      burstPalettes: {
        2: ['#C93A3A','#1a1a1a','#C9A24B','#F5EFE0'],
        3: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0'],
        4: ['#C93A3A','#1a1a1a','#C9A24B','#F5EFE0','#8B1E1E','#E8C468'],
        5: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#4A4A4A','#FFD9D9'],
        6: ['#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#F5EFE0','#E8C468','#FFD9D9','#2b2b2b']
      },
      shapes: function () { return ['blob']; },
      ringColor: function (tier) { return tier >= 5 ? 'rgba(26,26,26,.75)' : 'rgba(201,58,58,.75)'; },
      fullscreenCols: ['','','#C93A3A','#8B1E1E','#C9A24B','#E8C468','#1a1a1a'],
      fullscreenGlow: ['','','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26'],
      flashColors: ['','','rgba(201,58,58,.24)','rgba(139,30,30,.34)','rgba(201,162,75,.40)','rgba(26,26,26,.50)','rgba(201,58,58,.55)'],
      borderColors: {4:'#C93A3A',5:'#1a1a1a',6:'#C9A24B'},
      bgRgbs: ['','245,239,224','201,58,58','139,30,30','201,162,75','232,196,104','26,26,26'],
      meterGrads: ['','linear-gradient(90deg,#C9A24B,#E8C468)','linear-gradient(90deg,#C93A3A,#E8925C)','linear-gradient(90deg,#8B1E1E,#C93A3A)','linear-gradient(90deg,#C9A24B,#C93A3A)','linear-gradient(90deg,#1a1a1a,#C93A3A,#C9A24B)','linear-gradient(90deg,#8B1E1E,#1a1a1a,#C9A24B)'],
      labels: function (n) { return ['','🖌️ '+n+'連続','💮 '+n+'連続','🏮 '+n+'連続','⛩️ '+n+'連続・見事','🀄 '+n+'連続・天晴','🐉 '+n+'連続・極']; },
      popOverlay: 'linear-gradient(135deg,rgba(201,58,58,.22),rgba(20,20,20,.12))',
      comboLabel: function (n) { return n >= 2 ? '💮×'+n+' 連続' : '+1'; },
      comboColors: ['','#C93A3A','#8B1E1E','#1a1a1a','#C9A24B','#E8C468','#8B1E1E'],
      correctEmoji: ['💮','🖌️','🏮'],
      floaterScale: 1.5,
      useConfetti: false, rainType: 'petals',
      useFireworks: false, useBrushCircle: true,
      useLightning: false,
      useGlitch: false, useBrushSwipe: true,
      floaterGlyphs: { 5:['💮','🏮','🎐','🧧','⛩️'], 6:['💮','🏮','⛩️','🀄','🎐','🧧','🎏','🐉'] },
      fastLabel: '⚡ 早業！',
      tierUpLabel: (t) => '『 ' + (['','初伝','中伝','奥伝','皆伝','免許','極意'][Math.max(1, Math.min(t, 6))] || '') + ' 』',
      signature: (n) => '連 ' + n + ' 手',
      zoneGlyphs: ['💮','🏮','🎐'],
      zoneColors: ['#C93A3A','#C9A24B','#F5EFE0']
    },
    ecg: {
      burstPalettes: {
        2: ['#00E676','#69F0AE','#FFFFFF','#00BFA5'],
        3: ['#00E676','#FFEA00','#FFFFFF','#69F0AE','#00BFA5'],
        4: ['#FFEA00','#FF9100','#00E676','#FFFFFF','#69F0AE','#FF5252'],
        5: ['#FF9100','#FF1744','#FFEA00','#FFFFFF','#00E676','#FF5252','#00E5FF'],
        6: ['#FF1744','#00E5FF','#FFEA00','#FFFFFF','#FF9100','#00E676','#D500F9','#FF5252']
      },
      shapes: function () { return ['circle','plus']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(0,229,255,.9)' : tier >= 4 ? 'rgba(255,23,68,.85)' : 'rgba(0,230,118,.8)'; },
      fullscreenCols: ['','','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF'],
      fullscreenGlow: ['','','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255'],
      flashColors: ['','','rgba(0,230,118,.28)','rgba(255,234,0,.34)','rgba(255,145,0,.5)','rgba(255,23,68,.65)','rgba(0,229,255,.75)'],
      borderColors: {4:'#FF9100',5:'#FF1744',6:'#00E5FF'},
      bgRgbs: ['','0,230,118','255,234,0','255,145,0','255,23,68','0,229,255','213,0,249'],
      meterGrads: ['','linear-gradient(90deg,#00E676,#69F0AE)','linear-gradient(90deg,#FFEA00,#FFF176)','linear-gradient(90deg,#FF9100,#FFC246)','linear-gradient(90deg,#FF1744,#FF6E7F)','linear-gradient(90deg,#00E5FF,#00E676,#FF1744)','linear-gradient(90deg,#D500F9,#00E5FF,#FF1744,#FFEA00)'],
      labels: function (n) { return ['','💓 '+n+'連続・正常波形','📈 '+n+'連続・好調','⚡ '+n+'連続・覚醒','🩺 '+n+'連続・絶好調','🫀 '+n+'連続・フル稼働','🏥 '+n+'連続・完全治癒レベル']; },
      popOverlay: 'linear-gradient(135deg,rgba(0,230,118,.22),rgba(0,191,165,.12))',
      comboLabel: function (n) { return n >= 2 ? '💓×'+n+' 安定波形' : '+1'; },
      comboColors: ['','#00E676','#FFEA00','#FF9100','#FF1744','#00E5FF','#D500F9'],
      correctEmoji: ['➕','💊','🩺'],
      floaterScale: 1.3,
      useConfetti: false, rainType: 'digital',
      rainGlyphs: ['♥','+','━','●','◆'], rainCols: ['#00E676','#FF1744','#FFEA00','#00E5FF'],
      useFireworks: false, useECGSweep: true,
      useLightning: false,
      useGlitch: true,
      pulseBeat: true, useDefib: true,
      floaterGlyphs: { 5:['💊','🩺','❤️','➕','💉'], 6:['💊','🩺','❤️','➕','💉','🫀','⚕️','🏥'] },
      fastLabel: '⚡ 即断！',
      tierUpLabel: (t) => '♥ STAGE ' + Math.max(1, Math.min(t, 6)),
      signature: (n) => '♥ ' + Math.min(180, 60 + n * 6) + ' bpm',
      zoneGlyphs: ['➕','💓','🩺'],
      zoneColors: ['#00E676','#FF1744','#FFEA00']
    },
    space: {
      burstPalettes: {
        2: ['#7C4DFF','#448AFF','#FFFFFF','#FFD54F'],
        3: ['#7C4DFF','#448AFF','#FFD54F','#FFFFFF','#B388FF'],
        4: ['#448AFF','#7C4DFF','#FFD54F','#FFFFFF','#B388FF','#40C4FF'],
        5: ['#7C4DFF','#40C4FF','#FFD54F','#FFFFFF','#B388FF','#FF80AB','#448AFF'],
        6: ['#FFD54F','#7C4DFF','#40C4FF','#FF80AB','#FFFFFF','#B388FF','#448AFF','#E040FB']
      },
      shapes: function () { return ['star','circle']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(255,213,79,.9)' : tier >= 4 ? 'rgba(124,77,255,.85)' : 'rgba(68,138,255,.75)'; },
      fullscreenCols: ['','','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB'],
      fullscreenGlow: ['','','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251'],
      flashColors: ['','','rgba(68,138,255,.28)','rgba(124,77,255,.36)','rgba(64,196,255,.5)','rgba(255,213,79,.6)','rgba(224,64,251,.7)'],
      borderColors: {4:'#40C4FF',5:'#FFD54F',6:'#E040FB'},
      bgRgbs: ['','68,138,255','124,77,255','64,196,255','255,213,79','224,64,251','179,136,255'],
      meterGrads: ['','linear-gradient(90deg,#448AFF,#82B1FF)','linear-gradient(90deg,#7C4DFF,#B388FF)','linear-gradient(90deg,#40C4FF,#80D8FF)','linear-gradient(90deg,#FFD54F,#FFECB3)','linear-gradient(90deg,#E040FB,#7C4DFF,#40C4FF)','linear-gradient(90deg,#FFD54F,#E040FB,#7C4DFF,#40C4FF)'],
      labels: function (n) { return ['','⭐ '+n+'連続','🌟 '+n+'連続','☄️ '+n+'連続・加速中','🚀 '+n+'連続・光速','🪐 '+n+'連続・銀河制覇','🌌 '+n+'連続・宇宙の覇者']; },
      popOverlay: 'linear-gradient(135deg,rgba(124,77,255,.24),rgba(64,196,255,.12))',
      comboLabel: function (n) { return n >= 2 ? '🌠×'+n+' WARP' : '+1'; },
      comboColors: ['','#448AFF','#7C4DFF','#40C4FF','#FFD54F','#E040FB','#B388FF'],
      correctEmoji: ['⭐','✨','🌟'],
      useConfetti: false, rainType: 'warp',
      rainCols: ['#7C4DFF','#448AFF','#40C4FF','#FFD54F','#FFFFFF','#E040FB','#B388FF'],
      useFireworks: true,
      useLightning: false,
      useGlitch: true,
      useBlackHole: true,
      floaterGlyphs: { 5:['🌟','⭐','☄️','🪐','🚀'], 6:['🌟','⭐','☄️','🪐','🚀','🌌','👽','🛰️'] },
      fastLabel: '⚡ 光速回答！',
      tierUpLabel: (t) => '🚀 PHASE ' + Math.max(1, Math.min(t, 6)),
      signature: (n) => 'WARP ' + (n * 0.4).toFixed(1) + 'c',
      zoneGlyphs: ['⭐','✨','☄️'],
      zoneColors: ['#7C4DFF','#40C4FF','#FFD54F']
    },
    retro: {
      burstPalettes: {
        2: ['#FF1053','#00A8E8','#FFD400','#FFFFFF'],
        3: ['#FF1053','#00A8E8','#00E676','#FFD400','#FFFFFF'],
        4: ['#00A8E8','#FF1053','#FFD400','#00E676','#FFFFFF','#FF7A00'],
        5: ['#FFD400','#FF1053','#00A8E8','#00E676','#FFFFFF','#FF7A00','#B026FF'],
        6: ['#FF1053','#00A8E8','#FFD400','#00E676','#FF7A00','#B026FF','#FFFFFF']
      },
      shapes: function () { return ['square','circle']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(176,38,255,.9)' : tier >= 4 ? 'rgba(255,16,83,.85)' : 'rgba(0,168,232,.75)'; },
      fullscreenCols: ['','','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF'],
      fullscreenGlow: ['','','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255'],
      flashColors: ['','','rgba(0,168,232,.28)','rgba(255,16,83,.36)','rgba(255,212,0,.5)','rgba(255,122,0,.62)','rgba(176,38,255,.72)'],
      borderColors: {4:'#FFD400',5:'#FF7A00',6:'#B026FF'},
      bgRgbs: ['','0,168,232','255,16,83','255,212,0','255,122,0','176,38,255','0,230,118'],
      meterGrads: ['','linear-gradient(90deg,#00A8E8,#4FD8FF)','linear-gradient(90deg,#FF1053,#FF6B8F)','linear-gradient(90deg,#FFD400,#FFF07A)','linear-gradient(90deg,#FF7A00,#FFB74D)','linear-gradient(90deg,#B026FF,#FF1053,#00A8E8)','linear-gradient(90deg,#FF1053,#FFD400,#00A8E8,#B026FF)'],
      labels: function (n) { return ['','⭐ '+n+' HIT','👾 '+n+' COMBO','🕹️ '+n+' COMBO!!','💰 '+n+' HIGH SCORE','🏆 '+n+' PERFECT!','👑 '+n+' 1UP!! GAME MASTER']; },
      popOverlay: 'linear-gradient(135deg,rgba(0,168,232,.24),rgba(255,16,83,.12))',
      comboLabel: function (n) { return n >= 2 ? '👾 x'+n+' HIT!' : '+1'; },
      comboColors: ['','#00A8E8','#FF1053','#FFD400','#FF7A00','#B026FF','#00E676'],
      correctEmoji: ['⭐','💎','🔺'],
      floaterScale: 1.2,
      useConfetti: false, rainType: 'digital',
      rainGlyphs: ['★','■','◆','▲','●'], rainCols: ['#FF1053','#00A8E8','#FFD400','#00E676'],
      useFireworks: false, useCircuitPulse: true,
      useLightning: false,
      useGlitch: true,
      useCRT: true, chunkyShake: true,
      floaterGlyphs: { 5:['🕹️','👾','🎮','⭐','💎'], 6:['🕹️','👾','🎮','⭐','💎','🍄','🏆','💰'] },
      fastLabel: '⚡ QUICK!',
      tierUpLabel: (t) => '★ STAGE ' + Math.max(1, Math.min(t, 6)) + ' CLEAR',
      signature: (n) => 'SCORE ' + (n * 1000).toLocaleString('en-US'),
      zoneGlyphs: ['★','◆','▲'],
      zoneColors: ['#FF1053','#00A8E8','#FFD400']
    },
    luxury: {
      burstPalettes: {
        2: ['#FFD700','#1a1a1a','#F7E7CE','#FFFFFF'],
        3: ['#FFD700','#1a1a1a','#F7E7CE','#FFFFFF','#C9A227'],
        4: ['#FFD700','#F7E7CE','#1a1a1a','#FFFFFF','#C9A227','#FFF3C4'],
        5: ['#FFD700','#F7E7CE','#C9A227','#FFFFFF','#1a1a1a','#FFF3C4','#E5C158'],
        6: ['#FFD700','#FFF3C4','#F7E7CE','#C9A227','#1a1a1a','#FFFFFF','#E5C158']
      },
      shapes: function () { return ['circle','gem']; },
      ringColor: function (tier) { return tier >= 6 ? 'rgba(255,215,0,.95)' : tier >= 4 ? 'rgba(201,162,39,.85)' : 'rgba(255,215,0,.7)'; },
      fullscreenCols: ['','','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700'],
      fullscreenGlow: ['','','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0'],
      flashColors: ['','','rgba(255,215,0,.24)','rgba(201,162,39,.3)','rgba(247,231,206,.4)','rgba(255,243,196,.55)','rgba(255,215,0,.7)'],
      borderColors: {4:'#C9A227',5:'#FFD700',6:'#FFF3C4'},
      bgRgbs: ['','255,215,0','201,162,39','247,231,206','255,243,196','255,215,0','26,26,26'],
      meterGrads: ['','linear-gradient(90deg,#FFD700,#FFF3C4)','linear-gradient(90deg,#C9A227,#E5C158)','linear-gradient(90deg,#F7E7CE,#FFF3C4)','linear-gradient(90deg,#FFD700,#C9A227)','linear-gradient(90deg,#1a1a1a,#FFD700,#F7E7CE)','linear-gradient(90deg,#FFD700,#1a1a1a,#FFF3C4,#C9A227)'],
      labels: function (n) { return ['','✨ '+n+'連続','💎 '+n+'連続','🥂 '+n+'連続・上質','👑 '+n+'連続・至高','🏆 '+n+'連続・栄光','💰 '+n+'連続・完全制覇']; },
      popOverlay: 'linear-gradient(135deg,rgba(255,215,0,.26),rgba(26,26,26,.14))',
      comboLabel: function (n) { return n >= 2 ? '💎×'+n+' JACKPOT' : '+1'; },
      comboColors: ['','#FFD700','#C9A227','#F7E7CE','#FFF3C4','#FFD700','#1a1a1a'],
      correctEmoji: ['💎','✨','👑'],
      floaterScale: 1.2,
      useConfetti: false, rainType: 'bubbles',
      rainCols: ['#FFD700','#F7E7CE','#FFF3C4','#C9A227','#1a1a1a','#FFFFFF'],
      useFireworks: false, useStampBurst: true,
      stampColor: function () { return '#FFD700'; },
      useLightning: false,
      useGlitch: false, useBrushSwipe: true,
      brushColorRgb: '255,215,0',
      useSpotlight: true,
      floaterGlyphs: { 5:['💎','👑','🏆','💰','✨'], 6:['💎','👑','🏆','💰','✨','🥂','🎩','💍'] },
      fastLabel: '⚡ 即決！',
      tierUpLabel: (t) => '✦ RANK ' + (['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'][Math.max(1, Math.min(t, 6))] || ''),
      signature: (n) => '× ' + n + ' BONUS',
      zoneGlyphs: ['💎','✨','👑'],
      zoneColors: ['#FFD700','#F7E7CE','#FFF3C4']
    }
  };

  function ceTheme() {
    return CE_EFFECT_THEMES[exam.effectSet] || CE_EFFECT_THEMES.classic;
  }

  /* ══ 追加演出（2026-07-20・study_exam.js のミラー）══
     ティア昇格の瞬間だけフル演出にし、同ティア内は軽くして山谷を作る。 */
  var CE_FAST_MS = 3000;
  var _ceSeenAt = {};        // uid → 最初にフォーカスされた時刻ms
  var _ceZoneTimer = null;
  var _ceZoneActive = false;

  function ceReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function ceMarkSeen(card) {
    if (!card || !exam.active) return;
    var uid = card.dataset && card.dataset.uid;
    if (uid && !_ceSeenAt[uid]) _ceSeenAt[uid] = Date.now();
  }
  function ceIsFast(card) {
    var uid = card && card.dataset && card.dataset.uid;
    if (!uid || !_ceSeenAt[uid]) return false;
    return (Date.now() - _ceSeenAt[uid]) <= CE_FAST_MS;
  }
  function ceFastBonus(el) {
    if (ceReduced()) return;
    var theme = ceTheme();
    var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    var cx = r && r.width ? r.left + r.width / 2 : window.innerWidth / 2;
    var cy = r && r.width ? r.top : window.innerHeight * 0.4;
    var lab = document.createElement('div');
    lab.className = 'ce-fast-pop';
    lab.textContent = theme.fastLabel || '⚡ 速答！';
    lab.style.left = cx + 'px'; lab.style.top = cy + 'px';
    lab.style.color = (theme.comboColors && theme.comboColors[3]) || '#FFD700';
    document.body.appendChild(lab);
    lab.animate([
      {opacity:0, transform:'translate(-50%,0) scale(.6)'},
      {opacity:1, transform:'translate(-50%,-16px) scale(1.15)', offset:.25},
      {opacity:1, transform:'translate(-50%,-24px) scale(1)', offset:.55},
      {opacity:0, transform:'translate(-50%,-52px) scale(.95)'}
    ], {duration:900, easing:'cubic-bezier(.22,.68,0,1.2)', fill:'forwards'}).onfinish = function(){ lab.remove(); };
    if (window.MecFX) { try { window.MecFX.glyphBurst(cx, cy, {glyphs:['⚡'], count:4, w:50, spread:130}); } catch(e){} }
  }
  function ceCorrectShockwave(el) {
    if (!window.MecFX || !el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    var theme = ceTheme();
    var t = Math.max(1, Math.min(ceTier(exam.streak) || 1, 6));
    try {
      window.MecFX.rings(r.left + r.width / 2, r.top + r.height / 2, {
        count: t >= 4 ? 3 : 2, color: theme.ringColor(t), thickness: t >= 4 ? 3 : 2,
        maxR: 150 + t * 45, additive: exam.effectSet !== 'ink', stagger: .075
      });
    } catch (e) {}
  }
  function ceTraceCardBorder(card) {
    if (!card || ceReduced()) return;
    var r = card.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var theme = ceTheme();
    var col = (theme.comboColors && theme.comboColors[3]) || '#FFD700';
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ce-trace-svg');
    svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
    svg.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', '1.5'); rect.setAttribute('y', '1.5');
    rect.setAttribute('width', String(Math.max(1, r.width - 3)));
    rect.setAttribute('height', String(Math.max(1, r.height - 3)));
    rect.setAttribute('rx', '12'); rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', col); rect.setAttribute('stroke-width', '2.5');
    rect.setAttribute('stroke-linecap', 'round');
    var per = 2 * (r.width + r.height), seg = per * 0.22;
    rect.setAttribute('stroke-dasharray', seg + ' ' + per);
    svg.appendChild(rect); document.body.appendChild(svg);
    rect.animate([
      {strokeDashoffset:String(seg), opacity:1},
      {strokeDashoffset:String(-per), opacity:.35}
    ], {duration:640, easing:'cubic-bezier(.3,.7,.4,1)', fill:'forwards'}).onfinish = function(){ svg.remove(); };
  }
  function ceTierUpStamp(tier) {
    if (ceReduced()) return;
    var theme = ceTheme();
    var el = document.createElement('div');
    el.className = 'ce-tierup';
    el.innerHTML = '<span class="tu-lbl">TIER UP</span><span class="tu-main"></span>';
    el.querySelector('.tu-main').textContent = (theme.tierUpLabel && theme.tierUpLabel(tier)) || ('TIER ' + tier);
    el.style.setProperty('--tu-col', (theme.fullscreenCols && theme.fullscreenCols[Math.min(tier,6)]) || '#FFD700');
    el.style.setProperty('--tu-glow', (theme.fullscreenGlow && theme.fullscreenGlow[Math.min(tier,6)]) || '255,215,0');
    document.body.appendChild(el);
    el.animate([
      {opacity:0, transform:'translate(-50%,-50%) scale(3.2) rotate(-16deg)'},
      {opacity:1, transform:'translate(-50%,-50%) scale(.92) rotate(-6deg)', offset:.22},
      {transform:'translate(-50%,-50%) scale(1.06) rotate(-6deg)', offset:.34},
      {opacity:1, transform:'translate(-50%,-50%) scale(1) rotate(-6deg)', offset:.46},
      {opacity:1, offset:.74},
      {opacity:0, transform:'translate(-50%,-50%) scale(1.12) rotate(-6deg)'}
    ], {duration:1250, easing:'cubic-bezier(.2,1.3,.35,1)', fill:'forwards'}).onfinish = function(){ el.remove(); };
    if (window.MecFX) {
      try {
        window.MecFX.burst(window.innerWidth / 2, 6, {
          count: 40 + tier * 14,
          colors: (theme.burstPalettes && theme.burstPalettes[Math.min(tier,6)]) || ['#FFD700'],
          shapes: theme.shapes(tier), tier: tier,
          glow: exam.effectSet !== 'ink', additive: exam.effectSet !== 'ink'
        });
      } catch (e) {}
    }
  }
  function ceZoneStart() {
    if (_ceZoneActive || ceReduced() || !window.MecFX) return;
    _ceZoneActive = true;
    var emit = function () {
      if (!_ceZoneActive || !window.MecFX || !exam.active) return;
      var theme = ceTheme();
      try {
        window.MecFX.dust({count:6, colors: theme.zoneColors || ['#FFD700']});
        if (Math.random() < .55) window.MecFX.floaters({glyphs: theme.zoneGlyphs || ['✨'], count:2, scale:.65});
      } catch (e) {}
    };
    emit();
    _ceZoneTimer = setInterval(emit, 1100);
  }
  function ceZoneStop(collapse) {
    var was = _ceZoneActive;
    _ceZoneActive = false;
    if (_ceZoneTimer) { clearInterval(_ceZoneTimer); _ceZoneTimer = null; }
    document.body.classList.remove('ce-awaken');
    if (!was || !collapse || ceReduced()) return;
    var cx = window.innerWidth / 2, cy = Math.round(window.innerHeight * 0.44);
    if (window.MecFX) {
      try {
        window.MecFX.attractor(cx, cy, {ttl:.9, strength:260000});
        window.MecFX.rings(cx, cy, {count:2, color:'rgba(255,100,100,.65)', thickness:2, maxR:240, additive:true});
      } catch (e) {}
    }
    var ov = document.createElement('div');
    ov.className = 'ce-zone-collapse';
    document.body.appendChild(ov);
    ov.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],
      {duration:620, easing:'ease-out', fill:'forwards'}).onfinish = function(){ ov.remove(); };
  }
  function ceSetAwaken(on) {
    if (on && ceReduced()) return;
    document.body.classList.toggle('ce-awaken', !!on);
  }
  function ceShowSignature(n, tier, promoted) {
    if (ceReduced()) return;
    var theme = ceTheme();
    if (!theme.signature) return;
    var el = document.getElementById('chExamStreakSig');
    if (!el) {
      el = document.createElement('div');
      el.id = 'chExamStreakSig';
      document.body.appendChild(el);
    }
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    el.textContent = theme.signature(n);
    el.style.color = (theme.comboColors && theme.comboColors[Math.min(tier,6)]) || '#FFD700';
    el.animate([
      {opacity:0, transform:'translateX(-50%) translateY(-6px)'},
      {opacity:1, transform:'translateX(-50%) translateY(0)', offset:.18},
      {opacity:1, offset: promoted ? .72 : .5},
      {opacity:0, transform:'translateX(-50%) translateY(-8px)'}
    ], {duration: promoted ? 2200 : 1200, easing:'ease-out', fill:'forwards'});
  }
  function ceLightStreakFx(tier) {
    if (!window.MecFX) return;
    var cx = window.innerWidth / 2, cy = Math.round(window.innerHeight * 0.44);
    var counts = [0, 14, 22, 30, 40, 52, 64];
    spawnBurst(cx, cy, tier, counts[Math.min(tier,6)] || 14);
    try {
      window.MecFX.rings(cx, cy, {count:1, color: ceTheme().ringColor(tier), thickness:2, maxR:130 + tier*22, additive: exam.effectSet !== 'ink'});
    } catch (e) {}
  }
  var CE_BOOT_STYLES = ['mecha', 'cyber'];
  // 開始ブートシーケンス（study_exam.js の _examCountdown をミラー）。
  // 様式=レイアウトと動き / 配色=演出テーマ由来 なので7テーマ×2様式になる。
  function ceCountdown() {
    if (ceReduced()) return;
    var theme = ceTheme();
    var style = CE_BOOT_STYLES[(Math.random() * CE_BOOT_STYLES.length) | 0];
    var host = document.getElementById('chExamCountdown');
    if (!host) {
      host = document.createElement('div');
      host.id = 'chExamCountdown';
      document.body.appendChild(host);
    }
    var col = (theme.fullscreenCols && theme.fullscreenCols[3]) || '#FFD700';
    var glow = (theme.fullscreenGlow && theme.fullscreenGlow[3]) || '255,215,0';
    var qn = (exam.queue && exam.queue.length) || 0;
    var label = ((document.querySelector('.sn-title, h1') || {}).textContent || '過去問').trim().slice(0, 18);
    var kana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロABCDEF0123456789';
    var cols = '';
    if (style === 'cyber') {
      for (var i = 0; i < 7; i++) {
        var t = '';
        for (var j = 0; j < 18; j++) t += kana[(Math.random() * kana.length) | 0] + '\n';
        cols += '<span class="cd-col" style="--d:' + (i * .17).toFixed(2) + 's;--x:' + (6 + i * 14) + '%">' + t + '</span>';
      }
    }
    var lines = style === 'mecha'
      ? ['MEC-OS  BOOT SEQUENCE', 'MEMORY CHECK ............ OK', 'QUESTION BANK ........... ' + qn, 'SOURCE .................. ' + label, 'ALL SYSTEMS GREEN']
      : ['接続確立 / LINK ESTABLISHED', '電脳ダイブ ... STAND BY', 'BANK ' + qn + ' Q  //  ' + label];
    host.className = 'cd-' + style;
    host.style.setProperty('--cd-col', col);
    host.style.setProperty('--cd-glow', glow);
    host.style.display = 'flex';
    host.innerHTML = '<div class="cd-scan"></div>' +
      (style === 'cyber' ? '<div class="cd-stream">' + cols + '</div>' : '') +
      '<i class="cd-br tl"></i><i class="cd-br tr"></i><i class="cd-br bl"></i><i class="cd-br br"></i>' +
      (style === 'mecha'
        ? '<div class="cd-reticle"><i class="rh"></i><i class="rv"></i><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>'
        : '<svg class="cd-rings" viewBox="0 0 200 200"><circle class="r1" cx="100" cy="100" r="86"/><circle class="r2" cx="100" cy="100" r="66"/><circle class="r3" cx="100" cy="100" r="46"/></svg>') +
      '<div class="cd-log"></div><div class="cd-num"></div><div class="cd-sub"></div>';
    var logEl = host.querySelector('.cd-log');
    var numEl = host.querySelector('.cd-num');
    var subEl = host.querySelector('.cd-sub');
    var timers = [];
    var kill = function () { timers.forEach(clearTimeout); host.style.display = 'none'; host.innerHTML = ''; host.className = ''; };
    var at = function (ms, fn2) { timers.push(setTimeout(function () { if (!exam.active) { kill(); return; } fn2(); }, ms)); };
    lines.forEach(function (ln, i) {
      at(60 + i * 105, function () {
        var d = document.createElement('div');
        d.className = 'cd-line';
        d.textContent = (style === 'mecha' ? '> ' : '// ') + ln;
        logEl.appendChild(d);
        d.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
      });
    });
    var t0 = 60 + lines.length * 105 + 120;
    ['3', '2', '1'].forEach(function (n, i) {
      at(t0 + i * 420, function () {
        host.classList.add('cd-p2');
        numEl.textContent = n; numEl.className = 'cd-num'; void numEl.offsetWidth;
        numEl.animate([
          { opacity: 0, transform: 'scale(2.1)', filter: 'blur(6px)' },
          { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: .32 },
          { opacity: 1, transform: 'scale(1)', offset: .72 },
          { opacity: 0, transform: 'scale(.88)' }
        ], { duration: 400, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
        if (window.MecFX) {
          try { window.MecFX.rings(window.innerWidth / 2, window.innerHeight / 2, { count: 1, color: theme.ringColor(2), thickness: 2, maxR: 200, additive: exam.effectSet !== 'ink' }); } catch (e) {}
        }
      });
    });
    at(t0 + 3 * 420, function () {
      numEl.textContent = style === 'mecha' ? 'ALL GREEN' : 'DIVE';
      numEl.className = 'cd-num go';
      subEl.textContent = style === 'mecha' ? 'COMBAT MODE ENGAGED' : 'GHOST LINK — ONLINE';
      void numEl.offsetWidth;
      numEl.animate([
        { opacity: 0, transform: 'scale(1.5) translateY(6px)' },
        { opacity: 1, transform: 'scale(1)', offset: .3 },
        { opacity: 1, offset: .72 },
        { opacity: 0, transform: 'scale(1.06)' }
      ], { duration: 760, easing: 'cubic-bezier(.2,1,.3,1)', fill: 'forwards' });
      subEl.animate([{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 760, easing: 'ease-out', fill: 'forwards' });
      var sw = document.createElement('div');
      sw.className = 'cd-sweep';
      host.appendChild(sw);
      sw.animate([{ transform: 'translateX(-110%)' }, { transform: 'translateX(110%)' }], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      if (window.MecFX) {
        try {
          window.MecFX.rings(window.innerWidth / 2, window.innerHeight / 2, { count: 3, color: theme.ringColor(5), thickness: 3, maxR: 520, additive: exam.effectSet !== 'ink', stagger: .07 });
          window.MecFX.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 70, colors: (theme.burstPalettes && theme.burstPalettes[4]) || ['#FFD700'], shapes: theme.shapes(4), tier: 4, glow: exam.effectSet !== 'ink', additive: exam.effectSet !== 'ink' });
        } catch (e) {}
      }
    });
    at(t0 + 3 * 420 + 780, kill);
  }


  // ─── Streak effects ────────────────────────────────────────────
  function showStreak(n) {
    if (n < 2) return;
    var theme = ceTheme();
    var tier = ceTier(n);
    var labels = theme.labels(n);
    var durs = [0, 2.0, 2.5, 3.2, 4.2, 5.2, 5.8];
    // 昇格フレーム（tierが上がった瞬間）だけフル演出にする
    var prevTier = (n - 1) < 2 ? 0 : ceTier(n - 1);
    var promoted = tier > prevTier;
    if (tier >= 4) ceZoneStart();
    ceSetAwaken(n >= 20);
    if (promoted) ceTierUpStamp(tier);
    if (promoted && theme.useCRT) ceSpawnCRTOverlay(tier);
    if (promoted && tier >= 4) ceTimeStop(tier);
    if (promoted && tier >= 2) ceFullscreenCombo(n, tier);
    ceTriggerBgBreath(tier);
    cePlayComboNote(n);
    ceUpdateComboMeter(n);
    ceShowSignature(n, tier, promoted);
    var toast = document.getElementById('chExamStreakToast');
    if (!toast) return;
    toast.className = '';
    void toast.offsetWidth;
    toast.textContent = labels[tier];
    toast.style.setProperty('--sd', (promoted ? durs[tier] : durs[tier] * 0.52) + 's');
    toast.className = 't' + tier + ' show';

    var flash = document.getElementById('chExamStreakFlash');
    if (flash && promoted && tier >= 2) {
      var fc = theme.flashColors;
      flash.style.background = fc[tier];
      flash.style.opacity = '0';
      if (tier >= 4) {
        var pulses = tier >= 6 ? 6 : tier >= 5 ? 4 : 3;
        var kf = [];
        for (var p = 0; p < pulses; p++) kf.push({opacity: p % 2 === 0 ? 0.95 : 0.06});
        kf.push({opacity: 0});
        flash.animate(kf, {duration: 85 * pulses, easing:'linear', fill:'forwards'});
      } else {
        flash.className = '';
        void flash.offsetWidth;
        flash.className = 'flash';
      }
    }
    if (promoted) {
      if (tier >= 2) spawnParticles(tier);
      if (tier >= 3) triggerShake(tier);
      if (tier >= 4) triggerBorderGlow(tier);
      if (tier >= 5) {
        setTimeout(function() { spawnEmojiFloaters(tier); }, 80);
        if (theme.useGlitch) triggerGlitch(tier);
        else if (theme.useBrushSwipe) ceInkBrushSwipe(tier);
      }
    } else {
      ceLightStreakFx(tier);
    }
  }

  function ceEnsureShakeOverlay() {
    var el = document.getElementById('ceExamShakeOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ceExamShakeOverlay';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9040;opacity:0;';
      document.body.appendChild(el);
    }
    return el;
  }

  function triggerShake(tier) {
    var si = tier >= 6 ? 13 : tier >= 5 ? 8 : tier >= 4 ? 5 : 3;
    var dur = tier >= 5 ? 480 : tier >= 4 ? 340 : 210;
    var easing = ceTheme().chunkyShake ? 'steps(' + (tier >= 5 ? 8 : 5) + ')' : 'ease-in-out';
    var kf = [
      {transform:'translate(0,0)'},
      {transform:'translate(-'+si+'px,-'+(si*.5)+'px)'},
      {transform:'translate('+si+'px,'+(si*.6)+'px)'},
      {transform:'translate(-'+(si*.6)+'px,'+si+'px)'},
      {transform:'translate('+(si*.4)+'px,-'+(si*.8)+'px)'},
      {transform:'translate(-'+(si*.3)+'px,'+(si*.4)+'px)'},
      {transform:'translate(0,0)'}
    ];
    // body 全体を transform すると iPad WebKit が重い/白タイル化する。固定の演出レイヤー
    // （パーティクルcanvas＋周縁ヴィネット）だけを揺らす（study_exam.js と同方針）。
    var fxCanvas = document.getElementById('mecFxCanvas');
    if (fxCanvas) fxCanvas.animate(kf, {duration: dur, easing: easing});
    var ov = ceEnsureShakeOverlay();
    var vig = tier >= 6 ? .5 : tier >= 5 ? .42 : .3;
    ov.style.boxShadow = 'inset 0 0 ' + (tier >= 5 ? 160 : 110) + 'px ' + (tier >= 5 ? 30 : 18) + 'px rgba(0,0,0,' + vig + ')';
    ov.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.7},{opacity:0}], {duration: dur, easing:'ease-out'});
    ov.animate(kf, {duration: dur, easing: easing});
  }

  function triggerBorderGlow(tier) {
    var el = document.getElementById('chExamStreakBorder');
    if (!el) return;
    var theme = ceTheme();
    var colors = theme.borderColors;
    var sizes  = {4:'6px',5:'9px',6:'13px'};
    var t = Math.min(tier, 6);
    el.style.boxShadow = 'inset 0 0 0 '+sizes[t]+' '+colors[t];
    var dur = tier >= 5 ? 1300 : 750;
    if (theme.pulseBeat) {
      el.animate([{opacity:.95},{opacity:.2},{opacity:.85},{opacity:.15},{opacity:.9},{opacity:0}], {duration: dur, easing:'ease-out', fill:'forwards'});
    } else {
      el.animate([{opacity:.9},{opacity:.45},{opacity:.9},{opacity:0}], {
        duration: dur, easing:'ease-out', fill:'forwards'
      });
    }
  }

  function spawnEmojiFloaters(tier) {
    if (!window.MecFX) return;
    var theme = ceTheme();
    var glyphs = theme.floaterGlyphs;
    var scale = theme.floaterScale || 1;
    window.MecFX.floaters({
      glyphs: glyphs[Math.min(tier,6)] || glyphs[5],
      count: Math.round((tier >= 6 ? 26 : 14) * scale),
      scale: scale
    });
  }

  function spawnRings(cx, cy, tier) {
    if (!window.MecFX) return;
    var ringCounts = [0,0,1,2,3,4,6];
    var maxScale = tier >= 6 ? 38 : tier >= 5 ? 30 : tier >= 4 ? 22 : tier >= 3 ? 14 : 9;
    window.MecFX.rings(cx, cy, {
      count: ringCounts[Math.min(tier,6)],
      color: ceTheme().ringColor(tier),
      thickness: tier >= 5 ? 4 : tier >= 3 ? 3 : 2,
      maxR: maxScale * 20,
      additive: tier >= 4
    });
  }

  function spawnBurst(cx, cy, tier, count) {
    if (!window.MecFX) return;
    var theme = ceTheme();
    var palettes = theme.burstPalettes;
    window.MecFX.burst(cx, cy, {
      count: Math.round(count * (theme.floaterScale || 1)),
      colors: palettes[Math.min(tier,6)] || palettes[4],
      shapes: theme.shapes(tier),
      tier: tier,
      glow: exam.effectSet !== 'ink',
      additive: exam.effectSet !== 'ink'
    });
  }

  function spawnParticles(tier) {
    var toast = document.getElementById('chExamStreakToast');
    if (!toast) return;
    // パーティクル原点はトースト(画面最上部)でなく画面中央寄りに（上端だと粒子が画面外へ抜けて
    // 半分しか見えない。study_exam.js と同方針・2026-07-08）。
    var cx = window.innerWidth / 2;
    var cy = Math.round(window.innerHeight * 0.44);
    var theme = ceTheme();

    spawnRings(cx, cy, tier);
    spawnLightning(cx, cy, tier);

    var burstCounts = [0, 0, 50, 140, 340, 580, 900];
    spawnBurst(cx, cy, tier, burstCounts[Math.min(tier,6)] || 50);

    // 中tier(2-3)は最頻出。時間差の二段バースト＋追撃リングで密度を出す（study と同方針）。
    if (tier === 2 || tier === 3) {
      setTimeout(function(){ spawnBurst(cx, cy, tier, tier === 3 ? 80 : 36); }, tier === 3 ? 150 : 130);
      setTimeout(function(){ spawnRings(cx, cy, tier); }, tier === 3 ? 140 : 120);
    }

    if (tier >= 4) setTimeout(function(){ spawnBurst(cx, cy, tier, tier>=6?220:tier>=5?150:90); }, 160);
    if (tier >= 5) setTimeout(function(){ spawnBurst(cx, cy, tier, tier>=6?340:200); }, tier>=6?200:340);
    if (tier >= 6) {
      setTimeout(function(){ spawnBurst(cx, cy, tier, 250); }, 400);
      setTimeout(function(){ spawnBurst(cx, cy, tier, 170); }, 600);
      if (theme.useMedalDrop) ceSpawnMedalDrop(tier);
      if (theme.useBlackHole) ceSpawnBlackHoleVignette(tier, cx, cy);
      if (theme.useDefib) setTimeout(function(){ ceEcgDefib(tier); }, 300);
    }

    if (tier >= 4) {
      if (theme.useFireworks) spawnFirework(tier);
      else if (theme.useCircuitPulse) ceNeonCircuitPulse(cx, cy, tier);
      else if (theme.useStampBurst) ceInkStampBurst(cx, cy, tier);
      else if (theme.useECGSweep) ceEcgSweep(tier);
      else if (theme.useBrushCircle) ceInkBrushCircle(cx, cy, tier);
      if (theme.useSpotlight) ceSpawnSpotlightRays(tier);
    }

    if (tier >= 5 && window.MecFX) {
      if (exam.effectSet === 'luxury') window.MecFX.dust({count: tier >= 6 ? 90 : 55});
      else if (exam.effectSet === 'space') window.MecFX.dust({count: tier >= 6 ? 80 : 50, colors:['#FFFFFF','#FFD54F','#B388FF','#40C4FF']});
    }

    var rainWaves = [0, 0, 0, 1, 3, 6, 10][Math.min(tier,6)];
    for (var w = 0; w < rainWaves; w++) {
      (function(wave){ setTimeout(function(){ spawnRain(tier); }, 55 + wave * 120); })(w);
    }
  }

  function spawnRain(tier) {
    var theme = ceTheme();
    if (theme.rainType === 'digital') ceSpawnDigitalRain(tier);
    else if (theme.rainType === 'petals') ceSpawnPetalRain(tier);
    else if (theme.rainType === 'warp') ceSpawnWarpStreaks(tier);
    else if (theme.rainType === 'bubbles') ceSpawnBubbleRise(tier);
    else spawnConfetti(tier);
  }

  function spawnConfetti(tier) {
    if (!window.MecFX) return;
    var cols = ceTheme().rainCols || ['#FFD700','#FF9800','#FF5722','#4FC3F7','#81C784','#BA68C8','#F06292','#FFFFFF','#FFE082','#AED581','#EE88FF','#CC44FF'];
    window.MecFX.confetti({
      count: tier >= 6 ? 120 : tier >= 5 ? 85 : tier >= 4 ? 55 : 40,
      colors: cols,
      big: tier >= 5
    });
  }

  function ceSpawnDigitalRain(tier) {
    if (!window.MecFX) return;
    var theme = ceTheme();
    window.MecFX.glyphRain({
      count: tier >= 6 ? 50 : tier >= 5 ? 36 : tier >= 4 ? 24 : 16,
      glyphs: theme.rainGlyphs || ['0','1','#','$','%','&','∆','◆','▮','▯'],
      colors: theme.rainCols || ['#00E5FF','#FF2BD6','#7A5CFF','#39FF88'],
      bigGlyph: tier >= 5,
      additive: true
    });
  }

  function ceSpawnPetalRain(tier) {
    if (!window.MecFX) return;
    window.MecFX.petals({
      count: tier >= 6 ? 44 : tier >= 5 ? 32 : tier >= 4 ? 22 : 15,
      colors: ceTheme().rainCols || ['#F4A6B0','#FFFFFF','#E8C468','#C93A3A']
    });
  }

  function ceNeonCircuitPulse(cx, cy, tier) {
    var n = tier >= 6 ? 3 : tier >= 5 ? 2 : 1;
    var col = tier >= 6 ? 'rgba(255,43,214,.9)' : 'rgba(0,229,255,.9)';
    for (var i = 0; i < n; i++) {
      (function(idx) {
        setTimeout(function() {
          var el = document.createElement('div');
          el.className = 'ce-ring ce-fx-temp';
          el.style.cssText = 'left:'+cx+'px;top:'+cy+'px;width:60px;height:60px;margin:-30px 0 0 -30px;border:2px solid '+col+';border-radius:4px;';
          document.body.appendChild(el);
          el.animate([
            {transform:'scale(0) rotate(0deg)', opacity:.9},
            {transform:'scale('+(tier>=6?14:10)+') rotate(20deg)', opacity:0}
          ], {duration: 520+idx*90, easing:'ease-out', fill:'forwards'}).onfinish = function(){ el.remove(); };
        }, idx * 140);
      })(i);
    }
  }

  function ceInkStampBurst(cx, cy, tier) {
    var theme = ceTheme();
    var col = theme.stampColor ? theme.stampColor(tier) : '#C93A3A';
    var sz = 70 + tier * 8;
    var el = document.createElement('div');
    el.className = 'ce-fx-temp';
    el.style.cssText = 'position:fixed;left:'+cx+'px;top:'+cy+'px;width:'+sz+'px;height:'+sz+'px;margin:'+(-sz/2)+'px 0 0 '+(-sz/2)+'px;border:5px solid '+col+';border-radius:50%;pointer-events:none;z-index:9060;box-shadow:0 0 24px '+col+'80;';
    document.body.appendChild(el);
    el.animate([
      {transform:'scale(2.2) rotate(-8deg)', opacity:0},
      {transform:'scale(.9) rotate(3deg)', opacity:1, offset:.4},
      {transform:'scale(1) rotate(0deg)', opacity:.9, offset:.55},
      {transform:'scale(1) rotate(0deg)', opacity:0}
    ], {duration: 700, easing:'ease-out', fill:'forwards'}).onfinish = function(){ el.remove(); };
    setTimeout(function(){ spawnBurst(cx, cy, tier, tier >= 6 ? 34 : 20); }, 120);
  }

  function ceInkBrushSwipe(tier) {
    var rgb = ceTheme().brushColorRgb || '26,26,26';
    var el = document.createElement('div');
    el.className = 'ce-fx-temp';
    el.style.cssText = 'position:fixed;top:-20%;left:-30%;width:160%;height:140%;pointer-events:none;z-index:9070;background:linear-gradient(115deg,transparent 42%,rgba('+rgb+',.55) 48%,rgba('+rgb+',.75) 50%,rgba('+rgb+',.55) 52%,transparent 58%);';
    document.body.appendChild(el);
    el.animate([
      {transform:'translateX(-120%) rotate(-4deg)', opacity:0},
      {transform:'translateX(-40%) rotate(-4deg)', opacity:1, offset:.35},
      {transform:'translateX(40%) rotate(-4deg)', opacity:1, offset:.65},
      {transform:'translateX(120%) rotate(-4deg)', opacity:0}
    ], {duration: tier >= 6 ? 620 : 480, easing:'ease-in-out', fill:'forwards'}).onfinish = function(){ el.remove(); };
  }

  function ceEcgSweep(tier) {
    var theme = ceTheme();
    var col = theme.fullscreenCols[Math.min(tier,6)] || '#00E676';
    var w = window.innerWidth;
    var y = window.innerHeight * (0.4 + Math.random() * 0.2);
    var amp = tier >= 6 ? 90 : tier >= 5 ? 65 : 40;
    var segW = w / 10;
    var d = 'M0,' + y.toFixed(0);
    for (var i = 0; i < 10; i++) {
      var x0 = i * segW;
      if (i % 3 === 1) {
        d += ' L'+(x0+segW*.2).toFixed(0)+','+y.toFixed(0)+' L'+(x0+segW*.32).toFixed(0)+','+(y-amp*.3).toFixed(0)+' L'+(x0+segW*.42).toFixed(0)+','+(y+amp).toFixed(0)+' L'+(x0+segW*.52).toFixed(0)+','+(y-amp*.6).toFixed(0)+' L'+(x0+segW*.62).toFixed(0)+','+y.toFixed(0)+' L'+(x0+segW).toFixed(0)+','+y.toFixed(0);
      } else {
        d += ' L'+(x0+segW).toFixed(0)+','+y.toFixed(0);
      }
    }
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9070;overflow:visible;';
    var path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', col);
    path.setAttribute('stroke-width', tier >= 5 ? '4' : '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.style.filter = 'drop-shadow(0 0 8px '+col+')';
    path.style.strokeDasharray = '3000';
    path.style.strokeDashoffset = '3000';
    svg.appendChild(path);
    document.body.appendChild(svg);
    var dur = tier >= 6 ? 900 : tier >= 5 ? 750 : 600;
    path.animate([{strokeDashoffset:3000},{strokeDashoffset:0}], {duration: dur * .65, easing:'linear', fill:'forwards'});
    svg.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration: dur, easing:'ease-out', fill:'forwards'}).onfinish = function(){ svg.remove(); };
  }

  function ceEcgDefib(tier) {
    var theme = ceTheme();
    var col = theme.fullscreenCols[6] || '#00E5FF';
    var dim = document.createElement('div');
    dim.className = 'ce-fx-temp';
    dim.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:9400;';
    document.body.appendChild(dim);
    var y = window.innerHeight / 2;
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9401;overflow:visible;';
    var line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1','0'); line.setAttribute('y1', y); line.setAttribute('x2', window.innerWidth); line.setAttribute('y2', y);
    line.setAttribute('stroke', col);
    line.setAttribute('stroke-width','3');
    line.style.filter = 'drop-shadow(0 0 6px '+col+')';
    svg.appendChild(line);
    document.body.appendChild(svg);
    dim.animate([{opacity:0},{opacity:.55},{opacity:.55},{opacity:0}], {duration:520, easing:'ease-in'}).onfinish = function(){ dim.remove(); };
    svg.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration:520, easing:'linear'}).onfinish = function(){ svg.remove(); };
    setTimeout(function() {
      var flash = document.getElementById('chExamStreakFlash');
      if (flash) {
        flash.style.background = '#FFFFFF';
        flash.style.opacity = '0';
        flash.animate([{opacity:0},{opacity:.9},{opacity:.08},{opacity:.85},{opacity:0}], {duration:260, easing:'linear'});
      }
      document.body.animate([
        {transform:'translate(0,0)'},{transform:'translate(6px,-4px)'},{transform:'translate(-8px,5px)'},{transform:'translate(0,0)'}
      ], {duration:180, easing:'ease-out'});
    }, 540);
  }

  function ceSpawnBlackHoleVignette(tier, cx, cy) {
    var el = document.createElement('div');
    el.className = 'ce-fx-temp';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9040;background:radial-gradient(circle at center, transparent 28%, rgba(0,0,0,.78) 100%);';
    document.body.appendChild(el);
    el.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:0}], {duration: tier >= 6 ? 950 : 700, easing:'ease-in-out'}).onfinish = function(){ el.remove(); };
    // 画面中央の引力点が漂うパーティクルを実際に吸い込み、消滅時に外へ弾ける
    if (window.MecFX) {
      var bx = window.innerWidth / 2, by = window.innerHeight / 2;
      window.MecFX.attractor(bx, by, {ttl: .75, strength: 130000});
      setTimeout(function(){
        if (!window.MecFX) return;
        window.MecFX.burst(bx, by, {count: 130, colors: ceTheme().burstPalettes[6], shapes: ['star','circle'], tier: 6, glow: true});
        window.MecFX.rings(bx, by, {count: 2, color: 'rgba(224,64,251,.85)', thickness: 4, maxR: 500, additive: true});
      }, 780);
    }
  }

  function ceSpawnWarpStreaks(tier) {
    if (!window.MecFX) return;
    window.MecFX.warp({
      count: tier >= 6 ? 80 : tier >= 5 ? 55 : tier >= 4 ? 36 : 20,
      colors: ceTheme().rainCols || ['#FFFFFF','#7C4DFF','#40C4FF']
    });
  }

  function ceSpawnBubbleRise(tier) {
    if (!window.MecFX) return;
    window.MecFX.bubbles({
      count: tier >= 6 ? 40 : tier >= 5 ? 28 : tier >= 4 ? 18 : 12,
      colors: ceTheme().rainCols || ['#FFD700','#FFFFFF']
    });
  }

  function ceSpawnSpotlightRays(tier) {
    var theme = ceTheme();
    var col = theme.fullscreenCols[Math.min(tier,6)] || '#FFD700';
    var el = document.createElement('div');
    el.className = 'ce-fx-temp';
    el.style.cssText = 'position:fixed;inset:-50%;pointer-events:none;z-index:9042;background:conic-gradient(from 0deg, transparent 0deg, '+col+'40 8deg, transparent 16deg, transparent 60deg, '+col+'40 68deg, transparent 76deg, transparent 120deg, '+col+'40 128deg, transparent 136deg, transparent 180deg, '+col+'40 188deg, transparent 196deg, transparent 240deg, '+col+'40 248deg, transparent 256deg, transparent 300deg, '+col+'40 308deg, transparent 316deg);';
    document.body.appendChild(el);
    var dur = tier >= 6 ? 1400 : 1000;
    el.animate([
      {transform:'rotate(0deg)', opacity:0},
      {opacity:.9, offset:.15},
      {opacity:.9, offset:.8},
      {transform:'rotate('+(tier >= 6 ? 140 : 90)+'deg)', opacity:0}
    ], {duration: dur, easing:'ease-out'}).onfinish = function(){ el.remove(); };
  }

  function ceSpawnMedalDrop(tier) {
    var glyphs = ['🏆','🥇','👑'];
    var count = 3;
    for (var i = 0; i < count; i++) {
      (function(idx) {
        setTimeout(function() {
          var el = document.createElement('div');
          el.className = 'ce-fx-temp';
          var x = window.innerWidth * (0.25 + idx * 0.25);
          el.textContent = glyphs[idx % glyphs.length];
          el.style.cssText = 'position:fixed;left:'+x.toFixed(0)+'px;top:-80px;font-size:64px;pointer-events:none;z-index:9066;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));';
          document.body.appendChild(el);
          el.animate([
            {transform:'translateY(0) rotate(-8deg) scale(.6)', opacity:0},
            {transform:'translateY('+(window.innerHeight*0.42).toFixed(0)+'px) rotate(4deg) scale(1.15)', opacity:1, offset:.55},
            {transform:'translateY('+(window.innerHeight*0.38).toFixed(0)+'px) rotate(-2deg) scale(1)', offset:.7},
            {transform:'translateY('+(window.innerHeight*0.4).toFixed(0)+'px) rotate(0deg) scale(1)', opacity:1, offset:.85},
            {opacity:0}
          ], {duration:1400, easing:'cubic-bezier(.22,.9,.3,1.3)'}).onfinish = function(){ el.remove(); };
        }, idx * 140);
      })(i);
    }
  }

  function ceSpawnCRTOverlay(tier) {
    var el = document.createElement('div');
    el.className = 'ce-fx-temp';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9075;mix-blend-mode:multiply;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0px,rgba(0,0,0,.25) 1px,transparent 2px,transparent 4px);';
    document.body.appendChild(el);
    el.animate([{opacity:0},{opacity:.8},{opacity:.8},{opacity:0}], {duration: tier >= 6 ? 900 : 600, easing:'ease-in-out'}).onfinish = function(){ el.remove(); };
  }

  function ceInkBrushCircle(cx, cy, tier) {
    var theme = ceTheme();
    var col = theme.stampColor ? theme.stampColor(tier) : '#C93A3A';
    var r = 55 + tier * 6;
    var segs = 40;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2 * 1.08;
      var jitter = (Math.random() - .5) * 6;
      pts.push((cx + Math.cos(a) * (r + jitter)).toFixed(1) + ',' + (cy + Math.sin(a) * (r + jitter)).toFixed(1));
    }
    var d = 'M' + pts.join(' L');
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9070;overflow:visible;';
    var path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', col);
    path.setAttribute('stroke-width', tier >= 6 ? '10' : '7');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.style.filter = 'drop-shadow(0 0 6px '+col+')';
    var len = 2 * Math.PI * r * 1.15;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    svg.appendChild(path);
    document.body.appendChild(svg);
    var drawDur = tier >= 6 ? 520 : 380;
    path.animate([{strokeDashoffset:len},{strokeDashoffset:0}], {duration: drawDur, easing:'ease-in-out', fill:'forwards'});
    svg.animate([{opacity:1},{opacity:1},{opacity:0}], {duration: drawDur + 500, easing:'ease-in', fill:'forwards'}).onfinish = function(){ svg.remove(); };
    setTimeout(function(){ spawnBurst(cx, cy, tier, tier >= 6 ? 24 : 14); }, drawDur * 0.7);
  }

  function spawnLightning(cx, cy, tier) {
    if (tier < 3) return;
    if (ceTheme().useLightning === false) return;
    if (!window.MecFX) return;
    var cols = ceTheme().lightningCols;
    window.MecFX.lightning(cx, cy, {
      bolts: tier >= 6 ? 14 : tier >= 5 ? 9 : tier >= 4 ? 5 : 3,
      color: cols[Math.min(tier,6)],
      tier: tier
    });
  }

  function spawnFirework(tier) {
    if (tier < 4) return;
    if (!window.MecFX) return;
    var palettes = ceTheme().burstPalettes;
    window.MecFX.fireworks({
      count: tier >= 6 ? 8 : tier >= 5 ? 5 : 3,
      colors: palettes[Math.min(tier,6)] || palettes[4],
      tier: tier
    });
  }

  // 旧実装は body 全体への filter で iPad では最重量級だったため、
  // 軽い transform ジッター + Canvas のグリッチ帯に置き換え
  function triggerGlitch(tier) {
    if (tier < 5) return;
    var heavy = !!ceTheme().useHeavyGlitch;
    if (window.MecFX) {
      window.MecFX.glitchBars({
        count: (tier >= 6 ? 14 : 9) + (heavy ? 5 : 0),
        thick: tier >= 6,
        long: heavy
      });
    }
    var amp = tier >= 6 ? 7 : 4;
    var frames = [{transform:'translate(0,0)'}];
    var pulses = tier >= 6 ? 7 : 5;
    for (var p = 0; p < pulses; p++) {
      frames.push({transform:'translate('+((Math.random()-.5)*amp*2).toFixed(1)+'px,'+((Math.random()-.5)*amp).toFixed(1)+'px)'});
    }
    frames.push({transform:'translate(0,0)'});
    document.body.animate(frames, {duration: tier >= 6 ? 480 : 330, easing:'steps('+pulses+')'});
  }

  function ceTimeStop(tier) {
    var ov = document.getElementById('chTimestopOv');
    if (!ov) return;
    ov.style.display = '';
    var holdMs = tier >= 6 ? 400 : tier >= 5 ? 300 : 220;
    var anim = ov.animate([{opacity:1},{opacity:1},{opacity:0}],
      {duration:holdMs+150, easing:'ease-in', composite:'replace', iterationComposite:'replace'});
    // 演出後は display:none に戻す（backdrop-filter の暗転が残らないように）
    var hide = function(){ ov.style.display = 'none'; };
    anim.onfinish = hide;
    anim.oncancel = hide;
  }

  function ceFullscreenCombo(n, tier) {
    var el = document.getElementById('chStreakFullscreen');
    if (!el) return;
    var theme = ceTheme();
    var cols = theme.fullscreenCols;
    var glowR = theme.fullscreenGlow;
    var col = cols[Math.min(tier,6)];
    var g = glowR[Math.min(tier,6)];
    var spread = 60 + tier * 35;
    el.textContent = '\xd7' + n;
    el.style.color = col;
    el.style.textShadow = '0 0 '+spread+'px rgba('+g+',.65), 0 0 '+(spread*2)+'px rgba('+g+',.35)';
    var dur = tier >= 6 ? 980 : tier >= 5 ? 820 : tier >= 4 ? 680 : 560;
    el.animate([
      {opacity:0,  transform:'scale(.28) rotate(-10deg)'},
      {opacity:.9, transform:'scale(1.14) rotate(1.8deg)',  offset:.17},
      {opacity:.82,transform:'scale(.93) rotate(-.6deg)',   offset:.33},
      {opacity:.75,transform:'scale(1) rotate(0deg)',       offset:.58},
      {opacity:0,  transform:'scale(1.06) rotate(.5deg)'}
    ], {duration:dur, easing:'cubic-bezier(.22,.68,0,1.25)', fill:'forwards'});
  }

  function ceTriggerChoiceCorrectPop(el) {
    if (!el) return;
    el.animate([
      {transform:'scale(1)',filter:'brightness(1)'},
      {transform:'scale(1.1) translateY(-3px)',filter:'brightness(1.8)',offset:.15},
      {transform:'scale(.96) translateY(1px)',filter:'brightness(1.2)',offset:.37},
      {transform:'scale(1.03)',offset:.56},
      {transform:'scale(1)',filter:'brightness(1)'}
    ], {duration:420, easing:'cubic-bezier(.22,.68,0,1.25)'});
    var card = el.closest('.qc');
    if (card) {
      card.animate([
        {transform:'translateY(0) rotate(0deg)'},
        {transform:'translateY(-6px) rotate(-.5deg)',offset:.2},
        {transform:'translateY(2px) rotate(.3deg)',offset:.5},
        {transform:'translateY(-2px)',offset:.7},
        {transform:'translateY(0)'}
      ], {duration:480, easing:'ease-out'});
      var ov = document.createElement('div');
      ov.className = 'ce-fx-temp';
      ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:' + ceTheme().popOverlay + ';';
      var prevPos = getComputedStyle(card).position;
      if (prevPos === 'static') card.style.position = 'relative';
      card.prepend(ov);
      ov.animate([{opacity:1},{opacity:.5,offset:.3},{opacity:0}], {duration:650, easing:'ease-out'}).onfinish = function () { ov.remove(); };
    }
    ceSpawnScatteredCelebration();
  }

  // 選択肢付近以外の祝祭エフェクト。互いに離れたランダム複数箇所へ0.05秒ずつ遅延して連続発火
  // （最小距離リジェクションで重複回避・study_exam.js と同方針）。
  function ceScatterPositions(n, minDist) {
    var W = window.innerWidth, H = window.innerHeight;
    var x0 = W * 0.08, x1 = W * 0.92, y0 = H * 0.10, y1 = H * 0.72;
    var pts = [], guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      var x = x0 + Math.random() * (x1 - x0);
      var y = y0 + Math.random() * (y1 - y0);
      var ok = true;
      for (var j = 0; j < pts.length; j++) { if (Math.hypot(pts[j].x - x, pts[j].y - y) < minDist) { ok = false; break; } }
      if (ok) pts.push({ x: x, y: y });
    }
    while (pts.length < n) pts.push({ x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0) });
    return pts;
  }

  function ceSpawnScatteredCelebration() {
    if (!window.MecFX) return;
    var t = Math.max(2, Math.min(ceTier(exam.streak) || 2, 6));
    var theme = ceTheme();
    var pal = theme.burstPalettes[t] || theme.burstPalettes[2];
    var isInk = exam.effectSet === 'ink';
    var glyphs = theme.correctEmoji;
    var n = 4 + Math.min(t, 3);
    var minDist = Math.min(window.innerWidth, window.innerHeight) * 0.264; // 0.22 ×1.2（重複回避を強化）
    var pts = ceScatterPositions(n, minDist);
    pts.forEach(function (p, i) {
      setTimeout(function () {
        if (!window.MecFX) return;
        window.MecFX.rings(p.x, p.y, { count: 1, color: theme.ringColor(t), thickness: 3, maxR: 105 + t * 18, additive: !isInk });
        window.MecFX.burst(p.x, p.y, { count: 12 + t * 2, colors: pal, shapes: isInk ? ['shard', 'square'] : ['circle', 'star'], tier: 3, scale: 1.2, glow: !isInk, additive: !isInk });
        if (glyphs && glyphs.length) window.MecFX.glyphBurst(p.x, p.y, { glyphs: glyphs, count: 3, w: 110, spread: 110 });
      }, i * 50);
    });
  }

  function ceSpawnFloatingCombo(card, n, tier) {
    var theme = ceTheme();
    var el = document.createElement('div');
    var cols = theme.comboColors;
    var sz = 16 + Math.min(tier,6) * 4;
    el.textContent = theme.comboLabel(n);
    // カード相対だと見切れ・高さバラつきが出るため画面中央(やや上)基準に統一（study_exam.jsと同方針）。
    var cx = window.innerWidth / 2;
    var cy = Math.round(window.innerHeight * 0.40);
    el.style.cssText = 'position:fixed;left:'+cx+'px;top:'+cy+'px;font-weight:900;font-size:'+sz+'px;color:'+cols[Math.min(tier,6)]+';pointer-events:none;z-index:9200;text-shadow:0 2px 12px rgba(0,0,0,.7);transform:translateX(-50%);white-space:nowrap;';
    document.body.appendChild(el);
    el.animate([
      {opacity:1,transform:'translateX(-50%) translateY(0) scale(1)'},
      {opacity:0,transform:'translateX(-50%) translateY(-70px) scale(1.3)'}
    ], {duration:900, easing:'cubic-bezier(.22,.68,0,1.2)', fill:'forwards'}).onfinish = function(){ el.remove(); };
  }

  function ceTriggerBgBreath(tier) {
    var rgbs = ceTheme().bgRgbs;
    var rgb = rgbs[Math.min(tier,6)];
    var dur = tier >= 4 ? 1400 : tier >= 2 ? 1100 : 800;
    var str = tier >= 5 ? .12 : tier >= 3 ? .08 : .05;
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9000;background:radial-gradient(ellipse at 50% 50%,rgba('+rgb+','+str+') 0%,transparent 70%);opacity:0;';
    document.body.appendChild(el);
    el.animate([{opacity:0},{opacity:1,offset:.2},{opacity:.7,offset:.5},{opacity:0}],
      {duration:dur, easing:'ease-in-out', fill:'forwards'}).onfinish = function(){ el.remove(); };
  }

  function cePlayComboNote(n) {
    try {
      var ctx = getCtx();
      if (!ctx || exam.sound === 'off') return;
      var freq = 261.63 * Math.pow(2, Math.min(n-1,23)/12);
      var t = ctx.currentTime;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.09, t+.012);
      g.gain.exponentialRampToValueAtTime(.0001, t+.28);
      osc.start(t); osc.stop(t+.3);
    } catch(e){}
  }

  function ceUpdateComboMeter(n) {
    var meter = document.getElementById('chExamComboMeter');
    var fill  = document.getElementById('chExamComboMeterFill');
    var lbl = document.getElementById('chExamComboMeterLbl');
    if (!meter || !fill) return;
    if (n < 2) { meter.style.opacity='0'; fill.style.width='0%'; if (lbl) lbl.style.opacity='0'; return; }
    meter.style.opacity = '1';
    var tier = ceTier(n);
    var starts=[0,2,4,7,10,15,20], ends=[0,4,7,10,15,20,25];
    var pct = tier>=6 ? 100 : ((n-starts[tier])/(ends[tier]-starts[tier])*100);
    var theme = ceTheme();
    var grads = theme.meterGrads;
    fill.style.background = grads[Math.min(tier,6)];
    fill.style.width = pct.toFixed(1) + '%';
    // 次のティアまで残り何問か
    if (!lbl) {
      lbl = document.createElement('div');
      lbl.id = 'chExamComboMeterLbl';
      document.body.appendChild(lbl);
    }
    lbl.textContent = tier >= 6 ? '⚡ MAX' : ('あと ' + (ends[tier] - n) + ' で TIER ' + (tier + 1));
    lbl.style.color = (theme.comboColors && theme.comboColors[Math.min(tier,6)]) || '#FFD700';
    lbl.style.opacity = '1';
    if (lbl.getAnimations) lbl.getAnimations().forEach(function (a) { a.cancel(); });
    lbl.animate([{opacity:1},{opacity:1,offset:.7},{opacity:0}], {duration:2400, easing:'ease-out', fill:'forwards'});
    var prev = (n-1)>=20?6:(n-1)>=15?5:(n-1)>=10?4:(n-1)>=7?3:(n-1)>=4?2:(n-1)>=2?1:0;
    if (tier > prev) meter.animate([{height:'3px'},{height:'7px'},{height:'3px'}],{duration:400,easing:'ease-out'});
  }

  function ceResetComboMeter() {
    var meter = document.getElementById('chExamComboMeter');
    var fill  = document.getElementById('chExamComboMeterFill');
    var lbl   = document.getElementById('chExamComboMeterLbl');
    if (lbl) { if (lbl.getAnimations) lbl.getAnimations().forEach(function (a) { a.cancel(); }); lbl.style.opacity = '0'; }
    if (!meter || !fill || !parseFloat(fill.style.width)) return;
    fill.animate([{width:fill.style.width},{width:'0%'}],{duration:280,easing:'ease-in',fill:'forwards'})
      .onfinish = function(){ meter.style.opacity='0'; fill.style.width='0%'; };
  }

  function ceApplyChoiceShimmer(card) {
    if (!card) return;
    Array.prototype.forEach.call(card.querySelectorAll('.ch2'), function(ch, i) {
      (function(el, delay) {
        setTimeout(function() {
          var r = el.getBoundingClientRect();
          if (r.width === 0) return;
          var wrap = document.createElement('div');
          wrap.style.cssText = 'position:fixed;left:'+r.left.toFixed(0)+'px;top:'+r.top.toFixed(0)+'px;width:'+r.width.toFixed(0)+'px;height:'+r.height.toFixed(0)+'px;pointer-events:none;z-index:9250;overflow:hidden;border-radius:8px;';
          var beam = document.createElement('div');
          beam.style.cssText = 'position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,200,80,.18),rgba(255,220,140,.38),rgba(255,200,80,.18),transparent);transform:skewX(-18deg);';
          wrap.appendChild(beam);
          document.body.appendChild(wrap);
          beam.animate([{left:'-80%'},{left:'160%'}],
            {duration:380, easing:'ease-in', fill:'forwards'}).onfinish = function(){ wrap.remove(); };
        }, delay);
      })(ch, 28 + i * 48);
    });
  }

  // ─── Audio ────────────────────────────────────────────────────
  var _actx = null;
  function getCtx() {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    return _actx;
  }

  function playSelect() {
    var s = exam.ssound;
    if (s === 'off') return;
    if (s === 'mp3') {
      try { var a = new Audio(scriptBase + 'sounds/選択.mp3'); a.volume = .4; a.play().catch(function(){}); } catch(e){}
      return;
    }
    try {
      var ctx = getCtx(), t = ctx.currentTime;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      if (s === 'click') { osc.type='square'; osc.frequency.value=800; g.gain.setValueAtTime(.08,t); g.gain.exponentialRampToValueAtTime(.001,t+.06); osc.start(t); osc.stop(t+.06); }
      else if (s === 'tick') { osc.type='sine'; osc.frequency.value=1200; g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.001,t+.04); osc.start(t); osc.stop(t+.04); }
      else if (s === 'blip') { osc.type='sine'; osc.frequency.setValueAtTime(600,t); osc.frequency.linearRampToValueAtTime(900,t+.05); g.gain.setValueAtTime(.06,t); g.gain.exponentialRampToValueAtTime(.001,t+.08); osc.start(t); osc.stop(t+.08); }
      else { osc.type='sine'; osc.frequency.value=440; g.gain.setValueAtTime(.04,t); g.gain.exponentialRampToValueAtTime(.001,t+.05); osc.start(t); osc.stop(t+.05); }
    } catch(e){}
  }

  function playCorrect() {
    var s = exam.sound;
    if (s === 'off') return;
    try {
      var ctx = getCtx(), t = ctx.currentTime;
      if (s === 'ping') {
        var o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
        o.type='sine'; o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(1760,t+.1);
        g.gain.setValueAtTime(.15,t); g.gain.exponentialRampToValueAtTime(.001,t+.4); o.start(t); o.stop(t+.4);
      } else if (s === 'chime') {
        [523,659,784].forEach(function(f,i){
          var o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
          o.type='sine'; o.frequency.value=f; var st=t+i*.1;
          g.gain.setValueAtTime(.12,st); g.gain.exponentialRampToValueAtTime(.001,st+.5); o.start(st); o.stop(st+.5);
        });
      } else if (s === 'pop') {
        var o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
        o.type='sine'; o.frequency.setValueAtTime(400,t); o.frequency.exponentialRampToValueAtTime(800,t+.08);
        g.gain.setValueAtTime(.18,t); g.gain.exponentialRampToValueAtTime(.001,t+.18); o.start(t); o.stop(t+.18);
      } else {
        var o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
        o.type='sine'; o.frequency.value=660;
        g.gain.setValueAtTime(.1,t); g.gain.exponentialRampToValueAtTime(.001,t+.3); o.start(t); o.stop(t+.3);
      }
    } catch(e){}
  }

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    injectCSS();
    exam.chKey = detectChKey();
    injectUI();
    renderHistBadge();
    document.addEventListener('click', onChoiceClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
