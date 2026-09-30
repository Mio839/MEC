// ward.js — 定着プロトコル（旧・病棟回診。今日の復習＝SRS復習セッションの見せ方）（2026-09-25 新設・2026-09-30 拡張）
//
// 今日 due の問題を病棟（科目）のベッドに並べ、1問解く＝1床を診る。
//   ・正解 … 定着。次に会う日＝SRS の次回予定日
//   ・誤答 … もう一度（明日また出る）
//   ・期限切れの日数と間隔から状態（予定どおり／遅れ／大きく遅れ）を付ける。並び順（_srsUrgency の降順）が
//     そのまま「遅れの大きい問題から出す」の意味になる。
//
// 2026-09-30 の拡張（ユーザーが _work/protocol_demo.html 第7版の「全部入り」を採用）：
//   A 動き … 申し送りのベッドが1床ずつ現れ・数字が数え上がり・大きく遅れた床が点滅・開始ボタンに光。
//            解答ごとに床がはじける（誤答は帯が小さく揺れる）。結果は数字が数え上がり棒が伸びる。
//   B 円ゲージ … 申し送りに状態の内訳のドーナツ／帯の左端に定着ともう一度のリング／結果に定着率のリング
//   C 大きな病棟ボード … 帯を科目ごとの2列の段組みにし、いま解いている科目を光らせる
//   D 結果のグラフ … 状態ごとの定着率・大きく遅れた問題の前後・次に会う日の14日間の棒
//   E 言葉 … ハブのボタン「♾️ 定着プロトコル」に揃えた（朝の回診→定着プロトコル・重症/要注意/安定→
//            大きく遅れ/遅れ/予定どおり・退院/入院継続→定着/もう一度）。ベッドの見た目は残した。
//   ⚠️ 作り直し（第1〜6版）はすべて却下され「現行が一番見やすい」と決まった経緯がある。枠・配色・ベッドの形を変えないこと。
//
// ⚠️ 確信度の宣言（確実／たぶん／勘）は 2026-09-25 に撤去した（キー操作が面倒＝ユーザー判断）。戻さないこと。
//
// 呼び口（boss.js と同じ形）:
//   study.html startSRSReview → briefing()（申し送り）→ 開始ボタンで startExam + start()
//   study_exam.js _tallyQuestion → onAnswer()（3つの採点経路の合流点）
//   study_exam.js exitExam → onExit()／showExamSummary → decorateSummary()
//
// ⚠️ SRS復習（_srsReviewMode）だけの見せ方。今日の誤答・統合カンファレンス・弱点強化には出さない。
// ⚠️ 記録は新しい localStorage キーを持たない（SRS の採点は従来どおり study_exam.js が行う）。
// ⚠️ 誤答の再試験（結果画面から）は start() を通らないので対象外＝active() が false。
// ⚠️ 演出はどれも時間の決まった一回きり（infinite を置かない）。rAF で数えるものには setTimeout の落とし所を付ける
//    （非表示タブでは rAF が来ない）。帯は表示だけ（pointer-events:none）。
(function () {
  'use strict';

  const SEV_LABEL = { crit: '大きく遅れ', warn: '遅れ', stable: '予定どおり' };
  const OUT_LABEL = { discharge: '定着', stay: 'もう一度' };
  const SEV_ORDER = { stable: 0, warn: 1, crit: 2 };   // 申し送りの床の並び（緑→黄→赤）
  const C_OK = '#34D399', C_NG = '#F87171', C_WARN = '#FBBF24';

  let S = null;          // 状態。onExit 後も結果画面のために残す（active=false）
  let TIMERS = [];

  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function _todayJ() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function _dd(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
  function _srs() {
    try { if (typeof _srsData !== 'undefined' && _srsData) return _srsData; } catch (e) {}
    try { return JSON.parse(localStorage.getItem('mec_srs_v1') || '{}'); } catch (e) { return {}; }
  }
  function _subj(sid) {
    try { const s = (typeof STUDY_SUBJECTS !== 'undefined' ? STUDY_SUBJECTS : []).find(x => x.id === sid); if (s) return s; } catch (e) {}
    return { id: sid, name: sid, icon: '📘', color: '#7FA7B5' };
  }
  function _sidOf(uid) { return String(uid).split('_ch')[0]; }

  // ── 純粋関数（テストが直接呼ぶ） ─────────────────────────────────────
  // 状態：期限切れの日数と「待たされ具合」（_srsUrgency と同じ式）から
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

  // ── 演出の道具（時間の決まった一回きり） ────────────────────────────
  function _later(fn, ms) { const t = setTimeout(fn, ms); TIMERS.push(t); return t; }
  function _clearTimers() { TIMERS.forEach(clearTimeout); TIMERS = []; }
  function _anim(el, kf, opt) { try { return el && el.animate ? el.animate(kf, Object.assign({ fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)' }, opt)) : null; } catch (e) { return null; } }
  function _countUp(el, to, dur, fmt) {
    if (!el) return; fmt = fmt || (v => String(v)); const t0 = performance.now(); let done = false;
    const fin = () => { if (done) return; done = true; el.textContent = fmt(to); _anim(el, [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 350 }); };
    const step = now => { if (done) return; const p = Math.min(1, (now - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); else fin(); };
    requestAnimationFrame(step); _later(fin, dur + 400);
  }
  function _burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'wh-pt'; p.style.background = color; p.style.boxShadow = '0 0 6px ' + color; document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 26;
      _anim(p, [{ transform: 'translate(' + x + 'px,' + y + 'px)', opacity: 1 }, { transform: 'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d) + 'px) scale(0)', opacity: 0 }], { duration: 600 + Math.random() * 300 });
      setTimeout(() => p.remove(), 1000);
    }
  }
  // 円（ドーナツ・リング）：parts=[[値, 色, class], ...]・total を一周とする
  function _donut(parts, total, size, sw) {
    const r = (size - sw) / 2, c = size / 2; let off = 0;
    let s = '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="' + sw + '"/>';
    parts.forEach(([v, col, cls]) => { const p = total ? v / total * 100 : 0;
      s += '<circle class="w-seg ' + (cls || '') + '" cx="' + c + '" cy="' + c + '" r="' + r + '" pathLength="100" stroke="' + col + '" stroke-width="' + sw + '" stroke-dasharray="' + p.toFixed(2) + ' 100" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>'; off += p; });
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' + s + '</svg>';
  }
  // 描き終わりの値を控えて 0 から伸ばす
  function _growSegs(root, start, gap) {
    [...root.querySelectorAll('.w-seg')].forEach((s, i) => { const d = s.getAttribute('stroke-dasharray'); s.setAttribute('stroke-dasharray', '0 100'); _later(() => s.setAttribute('stroke-dasharray', d), start + i * gap); });
  }

  // ── CSS ─────────────────────────────────────────────────────────────
  // 意匠は「病棟のホワイトボード」（2026-09-25 から変えていない）。⚠️ infinite のアニメは置かない（読む道具）。
  const WARD_CSS = `
#wardHud{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));translate:-50% 0;z-index:8000;
  width:min(600px,calc(100% - 20px));box-sizing:border-box;padding:9px 12px 10px;border-radius:16px;display:flex;align-items:center;gap:10px;
  background:linear-gradient(170deg,#12303A 0%,#0C2129 60%,#0F2630 100%);
  border:1px solid rgba(126,214,223,.55);box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22),0 12px 30px rgba(0,0,0,.55);
  color:#E8F6F8;pointer-events:none;transition:opacity .3s ease,translate .4s cubic-bezier(.2,1.3,.4,1);}
#wardHud.hide{opacity:0;translate:-50% 140%;}
#wardHud .wh-ring{width:40px;flex-shrink:0;}
#wardHud .wh-ring svg{display:block;width:100%;height:auto;overflow:visible;}
#wardHud .wh-main{flex:1;min-width:0;}
#wardHud .wh-top{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;white-space:nowrap;}
#wardHud .wh-tag{font-size:9.5px;letter-spacing:.28em;color:#7ED6DF;}
#wardHud .wh-now{font-size:11px;color:#7ED6DF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
#wardHud .wh-cnt{margin-left:auto;font-variant-numeric:tabular-nums;font-size:11.5px;color:rgba(232,246,248,.8);overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}
#wardHud .wh-cnt b{font-size:13px;display:inline-block;}
#wardHud .wh-cnt .d{color:#6EE7B7}#wardHud .wh-cnt .s{color:#FCA5A5}
#wardHud .wh-wards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 12px;margin-top:6px;}
#wardHud .wh-ward{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;min-width:0;padding:2px 4px;border-radius:6px;transition:background .3s ease;}
#wardHud .wh-ward .n{width:5.8em;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.8;}
#wardHud .wh-ward .bs{display:flex;gap:3px;flex-wrap:wrap;min-width:0;}
#wardHud .wh-ward .k{margin-left:auto;font-variant-numeric:tabular-nums;opacity:.7;white-space:nowrap;}
#wardHud .wh-ward.cur{background:rgba(126,214,223,.14);box-shadow:inset 0 0 0 1px rgba(126,214,223,.4);}
#wardHud .wh-ward.cur .n{opacity:1;color:#7ED6DF;}
#wardHud .wh-bed{width:9px;height:9px;flex-shrink:0;border-radius:3px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);transition:background .35s ease,scale .35s ease;}
#wardHud .wh-bed.crit{box-shadow:inset 0 0 0 1.5px #F87171}
#wardHud .wh-bed.warn{box-shadow:inset 0 0 0 1.5px #FBBF24}
#wardHud .wh-bed.now{scale:1.35;background:rgba(126,214,223,.55)}
#wardHud .wh-bed.discharge{background:#34D399;box-shadow:none}
#wardHud .wh-bed.stay{background:#F87171;box-shadow:none}
.w-seg{fill:none;transition:stroke-dasharray .6s cubic-bezier(.16,1,.3,1),stroke-dashoffset .6s cubic-bezier(.16,1,.3,1);}
.wh-pt{position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;pointer-events:none;z-index:9600;}
.wh-pop{position:fixed;z-index:8001;pointer-events:none;font-weight:900;font-size:15px;white-space:nowrap;translate:-50% 0;
  padding:3px 10px;border-radius:99px;background:rgba(6,16,20,.85);border:1px solid currentColor;animation:whPop 1.1s cubic-bezier(.2,1,.3,1) forwards;}
.wh-pop.discharge{color:#6EE7B7}.wh-pop.stay{color:#FCA5A5}
@keyframes whPop{0%{opacity:0;transform:translateY(6px)}18%{opacity:1;transform:translateY(-6px)}75%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}
body.ward-on .ct{padding-bottom:130px;}
/* 申し送り */
#wardBrief{position:fixed;left:0;top:0;width:100%;height:100dvh;z-index:9500;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;
  background:rgba(4,12,16,.72);animation:wbIn .25s ease both;}
#wardBrief .wb-box{width:min(620px,100%);max-height:100%;overflow-y:auto;box-sizing:border-box;padding:20px 18px 16px;border-radius:18px;
  background:linear-gradient(170deg,#12303A,#0B1E25 70%);border:1px solid rgba(126,214,223,.6);
  box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22),0 20px 50px rgba(0,0,0,.6);color:#E8F6F8;animation:wbRise .35s cubic-bezier(.2,1.2,.4,1) both;}
#wardBrief .wb-tag{font-size:10px;font-weight:900;letter-spacing:.32em;color:#7ED6DF;}
#wardBrief h3{margin:4px 0 2px;font-size:22px;font-weight:900;}
#wardBrief .wb-date{font-size:12px;color:rgba(232,246,248,.65);}
#wardBrief .wb-sum{display:flex;align-items:center;gap:10px;margin:14px 0 12px;}
#wardBrief .wb-donut{flex:0 0 96px;position:relative;}
#wardBrief .wb-donut svg{display:block;width:100%;height:auto;overflow:visible;}
#wardBrief .wb-donut .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;}
#wardBrief .wb-donut .c b{font-size:24px;font-variant-numeric:tabular-nums;}
#wardBrief .wb-donut .c span{font-size:9.5px;font-weight:800;opacity:.7;}
#wardBrief .wb-ks{flex:1;display:flex;flex-direction:column;gap:5px;min-width:0;}
#wardBrief .wb-k{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
#wardBrief .wb-k b{order:2;font-size:18px;font-variant-numeric:tabular-nums;line-height:1.1;}
#wardBrief .wb-k span{font-size:10.5px;font-weight:800;opacity:.75;}
#wardBrief .wb-k.crit b{color:#F87171}#wardBrief .wb-k.warn b{color:#FBBF24}#wardBrief .wb-k.stable b{color:#6EE7B7}
#wardBrief .wb-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px;}
#wardBrief .wb-room{padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-left:3px solid var(--rc,#7ED6DF);
  animation:wbIn .3s ease both;position:relative;transition:background .5s ease,border-color .5s ease;}
#wardBrief .wb-rn{font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#wardBrief .wb-rn small{font-weight:700;opacity:.6;margin-left:4px;}
/* 科目のベッドが並び終わった合図（_work/ward_signal_demo.html の案2・3・5 を採用）。
   残る状態＝カードの地が科目の色に染まる（案2）＋最後の床から一周して閉じた光る枠（案3・.wb-frame） */
#wardBrief .wb-room.done{background:linear-gradient(135deg,color-mix(in srgb,var(--rc) 26%,transparent),color-mix(in srgb,var(--rc) 8%,transparent));border-color:color-mix(in srgb,var(--rc) 55%,transparent);}
#wardBrief .wb-frame{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);pointer-events:none;overflow:visible;}
#wardBrief .wb-frame path{fill:none;stroke:var(--rc);stroke-width:2;stroke-linejoin:round;filter:drop-shadow(0 0 4px var(--rc));}
/* 案4：枠が閉じた直後に右上へ押される READY の判子（残る） */
#wardBrief .wb-stamp{position:absolute;right:6px;top:5px;padding:2px 7px;border:2px solid var(--rc);border-radius:6px;color:var(--rc);font-size:10.5px;font-weight:900;letter-spacing:.14em;
  rotate:-12deg;background:rgba(6,16,20,.6);text-shadow:0 0 6px color-mix(in srgb,var(--rc) 70%,transparent);pointer-events:none;}
#wardBrief .wb-beds{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;}
#wardBrief .wb-bed{width:10px;height:10px;border-radius:3px;background:#34D399;}
#wardBrief .wb-bed.warn{background:#FBBF24}#wardBrief .wb-bed.crit{background:#F87171}
#wardBrief .wb-more{font-size:11.5px;color:rgba(232,246,248,.65);margin-top:10px;}
#wardBrief .wb-howto{margin-top:12px;padding:9px 11px;border-radius:11px;font-size:12px;line-height:1.6;background:rgba(126,214,223,.08);border:1px dashed rgba(126,214,223,.4);}
#wardBrief .wb-howto b{color:#7ED6DF;}
#wardBrief .wb-btns{display:flex;gap:8px;margin-top:14px;}
#wardBrief .wb-go{position:relative;overflow:hidden;flex:1;padding:12px;border:0;border-radius:12px;font:inherit;font-size:15px;font-weight:900;cursor:pointer;color:#06201F;
  background:linear-gradient(180deg,#8BE9F0,#4FC3CF);box-shadow:0 4px 16px rgba(79,195,207,.4);}
#wardBrief .wb-go::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.7) 50%,transparent 65%);translate:-110% 0;}
#wardBrief .wb-go.shine::after{animation:wbShine .9s cubic-bezier(.16,1,.3,1) forwards;}
#wardBrief .wb-back{padding:12px 14px;border-radius:12px;font-size:13px;font-weight:800;color:#E8F6F8;text-decoration:none;border:1px solid rgba(255,255,255,.25);}
@keyframes wbIn{from{opacity:0}to{opacity:1}}
@keyframes wbRise{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
@keyframes wbShine{from{translate:-110% 0}to{translate:110% 0}}
/* 結果画面 */
.exam-ward-res{margin:4px 0 12px;padding:14px 14px 12px;border-radius:14px;text-align:left;
  background:linear-gradient(170deg,#12303A,#0B1E25 70%);border:1px solid rgba(126,214,223,.6);color:#E8F6F8;
  box-shadow:inset 0 0 0 3px rgba(6,16,20,.85),inset 0 0 0 4px rgba(126,214,223,.22);}
.exam-ward-res .ewr-tag{font-size:10px;font-weight:900;letter-spacing:.3em;color:#7ED6DF;}
.exam-ward-res .ewr-top{display:flex;align-items:center;gap:12px;margin:8px 0 10px;}
.exam-ward-res .ewr-ring{position:relative;width:104px;flex-shrink:0;}
.exam-ward-res .ewr-ring svg{display:block;width:100%;height:auto;overflow:visible;}
.exam-ward-res .ewr-ring .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;}
.exam-ward-res .ewr-ring .c b{font-size:22px;color:#6EE7B7;font-variant-numeric:tabular-nums;}
.exam-ward-res .ewr-ring .c span{font-size:9.5px;font-weight:800;opacity:.7;}
.exam-ward-res .ewr-sum{flex:1;display:flex;flex-direction:column;gap:6px;}
.exam-ward-res .ewr-k{flex:1;text-align:center;padding:6px 4px;border-radius:10px;background:rgba(255,255,255,.05);}
.exam-ward-res .ewr-k b{display:block;font-size:20px;font-variant-numeric:tabular-nums;}
.exam-ward-res .ewr-k span{font-size:10.5px;font-weight:800;opacity:.75;}
.exam-ward-res .ewr-k.d b{color:#6EE7B7}.exam-ward-res .ewr-k.s b{color:#FCA5A5}
.exam-ward-res .ewr-h{font-size:11.5px;font-weight:900;margin:10px 0 5px;color:#BDEFF3;}
.exam-ward-res .ewr-row{display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0;}
.exam-ward-res .ewr-row .l{width:92px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800;}
.exam-ward-res .ewr-row .bar{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;display:flex;}
.exam-ward-res .ewr-row .bar i,.exam-ward-res .ewr-ba .bar i,.exam-ward-res .ewr-sev .sb i{display:block;height:100%;transition:width .9s cubic-bezier(.16,1,.3,1);}
.exam-ward-res .ewr-row .v{width:74px;flex-shrink:0;text-align:right;font-variant-numeric:tabular-nums;opacity:.85;}
.exam-ward-res .ewr-sev{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}
.exam-ward-res .ewr-sev > div{padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.05);font-size:10.5px;font-weight:800;min-width:0;}
.exam-ward-res .ewr-sev b{float:right;font-variant-numeric:tabular-nums;}
.exam-ward-res .ewr-sev .sb{height:5px;border-radius:99px;background:rgba(255,255,255,.1);margin-top:5px;overflow:hidden;}
.exam-ward-res .ewr-sev .sb i{background:#34D399;border-radius:99px;}
.exam-ward-res .ewr-ba{display:flex;align-items:center;gap:8px;font-size:11.5px;margin-top:4px;}
.exam-ward-res .ewr-ba .l{width:2.2em;flex-shrink:0;font-weight:800;opacity:.8;}
.exam-ward-res .ewr-ba .bar{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.08);display:flex;overflow:hidden;}
.exam-ward-res .ewr-ba .v{flex-shrink:0;font-variant-numeric:tabular-nums;white-space:nowrap;}
.exam-ward-res .ewr-cal{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;align-items:end;height:64px;padding-bottom:2px;border-bottom:1px solid rgba(126,214,223,.3);}
.exam-ward-res .ewr-cal .d{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:0;}
.exam-ward-res .ewr-cal .d i{display:block;width:100%;max-width:12px;background:#34D399;transform-origin:bottom;}
.exam-ward-res .ewr-cal .d i:first-of-type{border-radius:3px 3px 0 0;}
.exam-ward-res .ewr-cal .d i.st{background:#F87171;}
.exam-ward-res .ewr-cal .d em{font-style:normal;font-size:9.5px;font-weight:800;margin-bottom:2px;opacity:.85;}
.exam-ward-res .ewr-calx{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;margin-top:3px;font-size:9px;white-space:nowrap;letter-spacing:-.04em;text-align:center;opacity:.6;font-variant-numeric:tabular-nums;}
.exam-ward-res .ewr-later{font-size:10.5px;opacity:.7;text-align:right;margin-top:4px;}
.exam-ward-res .ewr-note{font-size:12px;line-height:1.6;margin-top:6px;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.05);}
.exam-ward-res .ewr-note.alert{background:rgba(248,113,113,.14);border:1px solid rgba(248,113,113,.45);}
/* 細い画面：科目名はアイコンだけ・ベッドを小さく（2列のまま1行に収める） */
@media (max-width:560px){#wardHud .wh-ward .n{width:auto;}#wardHud .wh-ward .n .nm{display:none;}#wardHud .wh-ward .bs{gap:2px;}#wardHud .wh-wards .wh-bed{width:7px;height:7px;border-radius:2px;}#wardHud .wh-wards{gap:3px 8px;}}
@media (prefers-reduced-motion:reduce){#wardHud,#wardHud *,.wh-pop,#wardBrief,#wardBrief *{animation:none!important;transition:none!important}}
`;
  function _css() {
    if (document.getElementById('mecWardCss')) return;
    const st = document.createElement('style'); st.id = 'mecWardCss'; st.textContent = WARD_CSS;
    document.head.appendChild(st);
  }

  // 科目ごとに束ねる。並びは問題の多い順
  function _rooms(uids, srs, today) {
    const m = new Map();
    uids.forEach(uid => {
      const sid = _sidOf(uid);
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid).push({ uid, sev: severityOf(srs[uid], today) });
    });
    return [...m.entries()].map(([sid, pts]) => ({ sid, pts })).sort((a, b) => b.pts.length - a.pts.length);
  }

  // ── 公開：申し送り（開始前の画面） ────────────────────────────────────
  // ⚠️ onGo は「はじめる」のタップの中で呼ぶ＝起動音の自動再生制限（iOS）をそのまま通せる
  function briefing(uids, remaining, onGo) {
    _css(); _clearTimers();
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
      '<div class="wb-tag">RETENTION PROTOCOL</div><h3>♾️ 定着プロトコル</h3>' +
      '<div class="wb-date">' + (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日(' + wd + ')　今日の問題 ' + uids.length + '問・' + rooms.length + '科目</div>' +
      '<div class="wb-sum"><div class="wb-donut">' + _donut([[cnt.crit, C_NG], [cnt.warn, C_WARN], [cnt.stable, C_OK]], uids.length, 96, 11) +
        '<div class="c"><b>' + uids.length + '</b><span>問</span></div></div><div class="wb-ks">' +
        '<div class="wb-k crit"><b>' + cnt.crit + '</b><span>' + SEV_LABEL.crit + '</span></div>' +
        '<div class="wb-k warn"><b>' + cnt.warn + '</b><span>' + SEV_LABEL.warn + '</span></div>' +
        '<div class="wb-k stable"><b>' + cnt.stable + '</b><span>' + SEV_LABEL.stable + '</span></div></div></div>' +
      '<div class="wb-rooms">' + rooms.map((r, i) => {
        const s = _subj(r.sid);
        return '<div class="wb-room" style="--rc:' + _esc(s.color) + ';--i:' + i + '"><div class="wb-rn">' + _esc(s.icon + ' ' + s.name) + '<small>' + r.pts.length + '問</small></div>' +
          // 床は 緑（予定どおり）→ 黄（遅れ）→ 赤（大きく遅れ）の順に並べる（2026-09-30 ユーザー指定。
          //   見た目だけの並び＝試験の出題順〔遅れの大きい順〕とは同期させない）
          '<div class="wb-beds">' + r.pts.slice().sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]).map(p => '<i class="wb-bed ' + p.sev + '" title="' + SEV_LABEL[p.sev] + '"></i>').join('') + '</div></div>';
      }).join('') + '</div>' +
      (remaining > 0 ? '<div class="wb-more">ほか ' + remaining + '問は次の回で（この回を終えると続けられます）</div>' : '') +
      '<div class="wb-howto">予定より大きく遅れた問題から順に出します。正解で<b>定着</b>、誤答は<b>もう一度</b>（明日また出ます）。</div>' +
      '<div class="wb-btns"><a class="wb-back" href="index.html">ハブへ</a><button type="button" class="wb-go">はじめる ▶</button></div></div>';
    document.body.appendChild(el);
    const go = el.querySelector('.wb-go');
    go.addEventListener('click', () => { _clearTimers(); el.remove(); try { onGo && onGo(); } catch (e) { console.error('[ward]', e); } }, { once: true });
    try { go.focus({ preventScroll: true }); } catch (e) {}
    // 演出：ドーナツが伸びる → 数字が数え上がる → 床が1つずつ現れ、大きく遅れた床が点滅 → ボタンに光
    _growSegs(el, 250, 180);
    [...el.querySelectorAll('.wb-k b')].forEach((b, i) => { const v = +b.textContent; b.textContent = '0'; _later(() => _countUp(b, v, 900), 200 + i * 120); });
    // 床は全科目で同時に並べる（科目の中だけ左から順に・2026-09-30 ユーザー指定＝科目を1つずつ待たせない）
    const roomBeds = [...el.querySelectorAll('.wb-room')].map(r => [...r.querySelectorAll('.wb-bed')]);
    const most = Math.max(1, ...roomBeds.map(b => b.length));
    const per = Math.min(40, 1000 / most);   // いちばん床の多い科目も1秒ほどで並び終える
    roomBeds.forEach(beds => beds.forEach((b, k) => { b.style.opacity = '0'; _later(() => { b.style.opacity = '';
      _anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.5)', offset: .6 }, { transform: 'scale(1)' }], { duration: 360 });
      if (b.classList.contains('crit')) _later(() => _anim(b, [{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 900 }), 380); }, 300 + k * per); }));
    // 科目のベッドが並び終わった合図（_work/ward_signal_demo.html の案2・3・5 をユーザーが採用・2026-09-30）。床の少ない科目から順に鳴る。
    //   5 カードが持ち上がって光り、床が白く瞬いて着地する
    //   2 床が左から順に一斉に跳ねる（ウェーブ）→ カードの地が科目の色に染まったまま（.done）
    //   3 最後の床の真下から、科目の色の線がカードの縁を一周して閉じ、光る枠が残る（.wb-frame）
    //   ⚠️ 一瞬で消える合図だけ（旧：輪・粒）は「分かりづらい」と言われた＝揃った状態を必ず残すこと
    [...el.querySelectorAll('.wb-room')].forEach((room, i) => {
      const beds = roomBeds[i]; if (!beds || !beds.length) return;
      const last = beds[beds.length - 1], c = rooms[i] ? _subj(rooms[i].sid).color : '#7ED6DF';
      _later(() => {
        // 5 持ち上がる
        _anim(room, [{ transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 transparent' },
          { transform: 'translateY(-6px) scale(1.04)', boxShadow: '0 10px 24px rgba(0,0,0,.45), 0 0 18px ' + c, offset: .4 },
          { transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 transparent' }], { duration: 800, fill: 'none' });
        beds.forEach((b, k) => {
          _anim(b, [{ filter: 'brightness(1)' }, { filter: 'brightness(2.4)', offset: .4 }, { filter: 'brightness(1)' }], { duration: 600, fill: 'none' });
          // 2 ウェーブ
          _anim(b, [{ transform: 'translateY(0)' }, { transform: 'translateY(-7px) scale(1.25)', offset: .4 }, { transform: 'translateY(0)' }], { duration: 420, delay: k * 45, fill: 'none' });
        });
        _later(() => room.classList.add('done'), Math.max(500, beds.length * 45));
        // 3 枠：最後の床の真下（下の辺）から時計回りに一周する角丸の枠
        const rr = room.getBoundingClientRect(), br = last.getBoundingClientRect();
        const W = rr.width + 2, H = rr.height + 2, r = 11;
        const x0 = Math.max(r + 1, Math.min(W - r - 1, br.left + br.width / 2 - rr.left + 1));
        const d = 'M' + x0 + ' ' + (H - 1) + ' H' + r + ' Q1 ' + (H - 1) + ' 1 ' + (H - r) + ' V' + r + ' Q1 1 ' + r + ' 1 H' + (W - r) + ' Q' + (W - 1) + ' 1 ' + (W - 1) + ' ' + r +
          ' V' + (H - r) + ' Q' + (W - 1) + ' ' + (H - 1) + ' ' + (W - r) + ' ' + (H - 1) + ' Z';
        const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'wb-frame'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = '<path pathLength="1" d="' + d + '"/>';
        room.appendChild(svg);
        const p = svg.querySelector('path'); p.style.strokeDasharray = '1';
        _anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' });
        // 4 枠が閉じたら READY の判子を押す（大きい所から押し付け・粒が少し散る）
        _later(() => {
          const s = document.createElement('span'); s.className = 'wb-stamp'; s.textContent = 'READY'; room.appendChild(s);
          _anim(s, [{ opacity: 0, transform: 'scale(3)' }, { opacity: 1, transform: 'scale(.92)', offset: .6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
          _later(() => { const sr = s.getBoundingClientRect(); _burst(sr.left + sr.width / 2, sr.top + sr.height / 2, c, 7); }, 250);
        }, 650);
      }, 300 + (beds.length - 1) * per + 340);
    });
    _later(() => go.classList.add('shine'), 300 + most * per + 1500);
  }

  // ── 帯（病棟ボード） ─────────────────────────────────────────────────
  // ⚠️ 表示だけ（pointer-events:none）。押せる物を置かない＝解答の邪魔をしない。
  function _hud() {
    let h = document.getElementById('wardHud');
    if (!h) {
      h = document.createElement('div');
      h.id = 'wardHud'; h.className = 'hide';
      h.setAttribute('role', 'status');
      document.body.appendChild(h);
    }
    return h;
  }
  function _buildHud() {
    const h = _hud();
    const rooms = new Map();
    S.order.forEach(uid => { const sid = _sidOf(uid); if (!rooms.has(sid)) rooms.set(sid, []); rooms.get(sid).push(uid); });
    const ordered = [...rooms.entries()].sort((a, b) => b[1].length - a[1].length);
    h.innerHTML = '<div class="wh-ring">' + _donut([[0, C_OK, 'rd'], [0, C_NG, 'rs']], S.order.length, 40, 6) + '</div>' +
      '<div class="wh-main"><div class="wh-top"><span class="wh-tag">♾️ 定着プロトコル</span><span class="wh-now"></span><span class="wh-cnt"></span></div>' +
      '<div class="wh-wards">' + ordered.map(([sid, uids]) => { const s = _subj(sid);
        return '<div class="wh-ward" data-sid="' + _esc(sid) + '"><span class="n">' + _esc(s.icon) + '<span class="nm"> ' + _esc(s.name) + '</span></span><span class="bs">' +
          uids.map(u => '<i class="wh-bed ' + S.sev[u] + '" data-u="' + _esc(u) + '"></i>').join('') + '</span><span class="k"></span></div>'; }).join('') + '</div></div>';
  }

  function _paint() {
    if (!S) return;
    const h = _hud();
    if (!h.querySelector('.wh-wards')) _buildHud();
    const n = S.order.length, done = S.recs.length;
    h.querySelector('.wh-cnt').innerHTML = '解答 <b>' + done + '</b>/' + n +
      '　<span class="d">定着 <b>' + S.out.discharge + '</b></span>　<span class="s">もう一度 <b>' + S.out.stay + '</b></span>';
    [...h.querySelectorAll('.wh-bed')].forEach(b => {
      const r = S.res[b.dataset.u];
      b.className = 'wh-bed ' + (r ? r : S.sev[b.dataset.u]) + (!r && b.dataset.u === S.now ? ' now' : '');
    });
    const [rd, rs] = h.querySelectorAll('.wh-ring .w-seg');
    if (rd && rs) { const pd = S.out.discharge / n * 100, ps = S.out.stay / n * 100;
      rd.setAttribute('stroke-dasharray', pd.toFixed(2) + ' 100'); rs.setAttribute('stroke-dasharray', ps.toFixed(2) + ' 100'); rs.setAttribute('stroke-dashoffset', (-pd).toFixed(2)); }
    const cur = S.now ? _sidOf(S.now) : null;
    [...h.querySelectorAll('.wh-ward')].forEach(w => {
      const uids = S.order.filter(u => _sidOf(u) === w.dataset.sid);
      w.querySelector('.k').textContent = uids.filter(u => S.res[u]).length + '/' + uids.length;
      w.classList.toggle('cur', w.dataset.sid === cur);
    });
    const nw = h.querySelector('.wh-now');
    if (nw) { if (cur) { const s = _subj(cur), uids = S.order.filter(u => _sidOf(u) === cur);
        nw.textContent = 'いま：' + s.icon + ' ' + s.name + ' ' + Math.min(uids.length, uids.filter(u => S.res[u]).length + 1) + '/' + uids.length; }
      else nw.textContent = ''; }
  }

  // いま焦点が当たっている問題をボードで示す（_updateExamFocus の代わりに軽く追う）
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
    _hud().innerHTML = '';
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
    _pop(o, o === 'discharge' ? '✓ 定着' : '↻ もう一度');
    _paint();
    // 演出：その床がはじける（誤答は帯が小さく揺れる）・数字が跳ねる
    const h = _hud(), b = h.querySelector('.wh-bed[data-u="' + CSS.escape(uid) + '"]');
    if (b) { _anim(b, [{ transform: 'scale(2.4)' }, { transform: 'scale(1)' }], { duration: 500 });
      if (o === 'discharge') { const br = b.getBoundingClientRect(); _burst(br.left + br.width / 2, br.top + br.height / 2, '#6EE7B7', 10); } }
    if (o === 'stay') _anim(h, [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 300, fill: 'none' });
    const cb = h.querySelector('.wh-cnt ' + (o === 'discharge' ? '.d' : '.s') + ' b'); _anim(cb, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 350 });
  }

  function active() { return !!(S && S.active); }

  function onExit() {
    const h = document.getElementById('wardHud');
    if (h) h.classList.add('hide');
    document.body.classList.remove('ward-on');
    document.querySelectorAll('.wh-pop,.wh-pt').forEach(el => el.remove());
    if (S) { clearInterval(S._t); S.active = false; }
  }

  // ── 公開：結果画面 ────────────────────────────────────────────────────
  function decorateSummary() {
    // 1回につき1回だけ（結果画面からの誤答再試験は同じ S を引きずるので二重に出さない）
    if (!S || S.shown || !S.recs.length) return;
    S.shown = true;
    const note = document.getElementById('sumFlagNote');
    if (!note) return;
    const srs = _srs();
    const n = S.recs.length;
    const pct = Math.round(S.out.discharge / n * 100);
    // 科目ごとの転帰
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
        '<i data-w="' + w('discharge') + '" style="background:' + C_OK + '"></i><i data-w="' + w('stay') + '" style="background:' + C_NG + '"></i></span>' +
        '<span class="v">定着 ' + b.discharge + '/' + b.n + '</span></div>';
    }).join('');
    // 状態ごとの定着率
    const sevHtml = ['crit', 'warn', 'stable'].map(sv => {
      const g = S.recs.filter(r => S.sev[r.uid] === sv), k = g.filter(r => r.ok).length;
      return '<div>' + SEV_LABEL[sv] + '<b>' + k + '/' + g.length + '</b><div class="sb"><i data-w="' + (g.length ? k / g.length * 100 : 0).toFixed(1) + '%"></i></div></div>';
    }).join('');
    // 大きく遅れていた問題の転帰
    const crit = S.recs.filter(r => S.sev[r.uid] === 'crit');
    const critOut = crit.filter(r => r.ok).length;
    const cw = v => (crit.length ? v / crit.length * 100 : 0).toFixed(1) + '%';
    const critHtml = crit.length ? '<div class="ewr-h">大きく遅れていた問題（前→後）</div>' +
      '<div class="ewr-ba"><span class="l">前</span><span class="bar"><i data-w="100%" style="background:' + C_NG + '"></i></span><span class="v">' + crit.length + '問</span></div>' +
      '<div class="ewr-ba"><span class="l">後</span><span class="bar"><i data-w="' + cw(critOut) + '" style="background:' + C_OK + '"></i><i data-w="' + cw(crit.length - critOut) + '" style="background:' + C_NG + '"></i></span><span class="v">定着 ' + critOut + '</span></div>' : '';
    // 次に会う日（_updateSRS が書いた後の予定日）：これから14日の棒
    const cal = {}; let later14 = 0;
    S.recs.forEach(r => { const e = srs[r.uid]; if (!e || !e.nextReview) return; const d = _dd(S.today, e.nextReview); if (d < 1) return;
      if (d > 14) { later14++; return; } (cal[d] = cal[d] || { d: 0, s: 0 })[r.ok ? 'd' : 's']++; });
    let mx = 1; for (let d = 1; d <= 14; d++) if (cal[d]) mx = Math.max(mx, cal[d].d + cal[d].s);
    const base = Date.parse(S.today + 'T00:00:00Z'); let cb = '', cx = '';
    for (let d = 1; d <= 14; d++) { const c = cal[d] || { d: 0, s: 0 };
      cb += '<div class="d">' + ((c.d + c.s) ? '<em>' + (c.d + c.s) + '</em>' : '') + (c.s ? '<i class="st" style="height:' + Math.round(c.s / mx * 44) + 'px"></i>' : '') + (c.d ? '<i style="height:' + Math.round(c.d / mx * 44) + 'px"></i>' : '') + '</div>';
      cx += '<span>' + (d === 1 ? '明日' : new Date(base + d * 86400000).getUTCDate()) + '</span>'; }
    // 定着した問題の次に会う日の中央値
    const next = S.recs.filter(r => S.res[r.uid] === 'discharge').map(r => srs[r.uid] && srs[r.uid].nextReview)
      .filter(Boolean).map(d => _dd(S.today, d)).filter(v => v >= 0).sort((a, b) => a - b);
    const med = next.length ? next[Math.floor(next.length / 2)] : null;

    let notes = '';
    if (crit.length) notes += '<div class="ewr-note' + (critOut < crit.length ? ' alert' : '') + '">🚨 大きく遅れていた ' + crit.length + '問のうち <b>' + critOut + '問が定着</b>' +
      (critOut < crit.length ? '。残る ' + (crit.length - critOut) + '問は明日また出ます。' : '。遅れを取り戻しました。') + '</div>';
    if (med != null) notes += '<div class="ewr-note">📅 定着した ' + next.length + '問に次に会うのは 中央値 <b>' + med + '日後</b>。</div>';

    const html = '<div class="exam-ward-res"><div class="ewr-tag">♾️ 本日のプロトコル</div>' +
      '<div class="ewr-top"><div class="ewr-ring">' + _donut([[S.out.discharge, C_OK], [S.out.stay, C_NG]], n, 104, 10) + '<div class="c"><b>' + pct + '%</b><span>定着率</span></div></div>' +
        '<div class="ewr-sum"><div class="ewr-k d"><b>' + S.out.discharge + '</b><span>定着</span></div><div class="ewr-k s"><b>' + S.out.stay + '</b><span>もう一度</span></div></div></div>' +
      '<div class="ewr-h">科目ごとの定着</div>' + roomHtml +
      '<div class="ewr-h">遅れ具合ごとの定着率</div><div class="ewr-sev">' + sevHtml + '</div>' +
      critHtml +
      '<div class="ewr-h">次に会う日（これから14日）</div><div class="ewr-cal">' + cb + '</div><div class="ewr-calx">' + cx + '</div>' +
      (later14 ? '<div class="ewr-later">15日以降 ' + later14 + '問</div>' : '') +
      notes + '</div>';
    note.insertAdjacentHTML('beforebegin', html);
    // 演出：リングが伸びる → 数字が数え上がる → 棒が左から伸びる → 14日の棒が立ち上がる → 所見が浮かぶ
    const R = note.previousElementSibling;
    if (!R || !R.classList.contains('exam-ward-res')) return;
    _growSegs(R, 300, 400);
    [...R.querySelectorAll('.ewr-k b')].forEach(b => { const v = +b.textContent; b.textContent = '0'; _later(() => _countUp(b, v, 900), 300); });
    const bars = [...R.querySelectorAll('i[data-w]')];
    bars.forEach(i => { i.style.width = '0'; });
    _later(() => bars.forEach(i => { i.style.width = i.dataset.w; }), 500);   // 全科目の棒を同時に伸ばす
    [...R.querySelectorAll('.ewr-cal .d i')].forEach((i, k) => _anim(i, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, delay: 900 + k * 40 }));
    [...R.querySelectorAll('.ewr-note')].forEach((el, k) => _anim(el, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 1300 + k * 150 }));
    // rAF・WAAPI が止まっても（非表示タブ）棒は必ず最終値に着地させる
    setTimeout(() => bars.forEach(i => { i.style.width = i.dataset.w; }), 2600);
  }

  window.MecWard = {
    briefing, start, onAnswer, active, onExit, decorateSummary,
    severityOf, outcomeOf,
    state: () => S,
  };
})();
