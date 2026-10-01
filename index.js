// ハブ（index.html）の JS。2026-09-28 に index.html のインライン <script> から外へ出した（中身は1文字も変えていない）。
// ⚠️ 読み込み位置は index.html の <body> の末尾＝元のインラインと同じ。classic script なので、
//    let / const / function はこれまでどおりページ全体の共有スコープに入る。
// ── データ定義 ────────────────────────────────────────────────
// 統合学習ツール（study.html）はカードではなくヒーローの主ボタンになった（2026-07-23 の再構成）。
// タイルの面はテーマのアクセント（--or）に揃えるので、ここに配色は持たせない。
const MINDMAP_TOOL = {
  id: 'mindmap',
  name: '科目マインドマップ',
  icon: '🗺️',
  color: '#1C2E4A',
  type: 'mindmap',
  // ⚠️ 科目の一覧をここに書かないこと。正本は mindmap_data/index.js（さらにその元は
  //    gamify.js の SUBJECTS）で、旧実装はここに9科目を直書きしていたため、
  //    科目色が gamify.js・chapters_meta.js・旧統合マップの3系統に割れていた。
  get maps() {
    const list = (window.MM_SUBJECTS || []).filter(s => s.ready);
    return [{ subject: '全科目統合', href: 'mindmap.html', color: 'var(--yl)', icon: '🗺️', ready: true }]
      .concat(list.map(s => ({
        subject: s.label, href: 'mindmap.html?sid=' + s.sid, color: s.color, icon: s.icon, ready: true,
      })));
  },
  // まだ作っていない科目（ランチャーに薄く並べて「これから増える」ことを見せる）
  get pending() {
    return (window.MM_SUBJECTS || []).filter(s => !s.ready);
  }
};

// ── 過去問モード定義 ──────────────────────────────────────────
// ⚠️ 表の正本は progress.js（統合学習ツール・学習統計と「全問題数」を揃えるため 2026-09-11 に移した）
const KAKUMON_BLOCKS = window.MEC_KAKUMON_BLOCKS || {};

const KAKUMON_YEARS = [
  { year:120, label:'第120回（2026年）', blocks:['A','B','C','D','E','F'] },
  { year:119, label:'第119回（2025年）', blocks:['A','B','C','D','E','F'] },
  { year:118, label:'第118回（2024年）', blocks:['A','B','C','D','E','F'] },
  { year:117, label:'第117回（2023年）', blocks:['C','D','F'] },
  { year:116, label:'第116回（2022年）', blocks:['A','B','C','D','E','F'] },
];

// ── 実力試験モード定義 ──────────────────────────────────────
const JITSU1_CHAPTERS = window.MEC_JITSU1_CHAPTERS || [];   // 正本は progress.js

// ヒーローに載らない行き先。expand は #hubDetail に中身を出す・link はそのまま遷移する。
// span は非対称ベントでの面の重さ:
//   lead = 縦長（大きな読み値を持つ）/ wide = 横長 / 無指定 = 1マス。
//   4枚固定の並びなので CSS 側は nth-child ではなくこのクラスで組んでいる。
const HUB_TILES = [
  // 2026-09-24: 縦長（lead）を過去問からボス戦へ入れ替え、名前を「統合カンファレンス」に（ユーザー判断）。
  //   id 'boss' と mec_boss_v1 は据え置き（戦績と配線をそのまま使う）。
  { id:'boss',      icon:'🏛️', name:'統合カンファレンス', kind:'link', href:'study.html?mode=boss', span:'lead' },
  { id:'jitsu1',    icon:'🎯',  name:'実力試験Ⅰ',        kind:'expand' },
  { id:'mock',      icon:'🧮',  name:'模試 自己採点',     kind:'link', href:'mock.html' },
  { id:'knowledge', icon:'🔎',  name:'検索知識ノート',    kind:'link', href:'knowledge.html' },
  { id:'selfcheck', icon:'✏️',  name:'セルフチェック',    kind:'expand' },
  // 2026-09-23: トロフィー棚とボス戦（現・統合カンファレンス）を1マスずつ足した（2列グリッドで並んで穴を作らない）
  { id:'trophy',    icon:'🏆',  name:'トロフィー棚',      kind:'expand' },
  { id:'kakumon',   icon:'📝',  name:'国家試験 過去問',   kind:'expand' },
  // ⚠️ 成績カルテは wide にしてある。ここを1マスにすると mindmap（wide）が2列を取れず
  //    4段目の右に穴が空く（2列グリッドの都合であって、重要度の主張ではない）。
  { id:'karte',     icon:'🩺',  name:'模試 成績カルテ',   kind:'link', href:'mock_karte.html', span:'wide' },
  { id:'mindmap',   icon:'🗺️', name:'科目マインドマップ', kind:'expand', span:'wide' },
];

// ── SRS due 件数 ─────────────────────────────────────────────
function getSRSDueCount() {
  try {
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    const srs = JSON.parse(localStorage.getItem('mec_srs_v1') || '{}');
    // ⚠️ 同じ国試問題の重複コピーは代表だけを数える（study.html の出題と同じ数え方）
    return Object.keys(srs).filter(uid => { const e = srs[uid]; return e && e.nextReview && e.nextReview <= today && !(window.MECSync && MECSync.srsIsShadow && MECSync.srsIsShadow(uid)); }).length;
  } catch { return 0; }
}

// ── SRS 忘却リスク内訳 ─────────────────────────────────────────
function _diffDaysStr(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

function _calcSrsUrgency(e, today) {
  const late = _diffDaysStr(e.nextReview || today, today);
  return (late + 1) / Math.max(1, e.interval || 1);
}

function getSrsRiskBreakdown(sessionLimit = 50) {
  try {
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    const srs = JSON.parse(localStorage.getItem('mec_srs_v1') || '{}');
    const allDue = Object.keys(srs).filter(uid => {
      const e = srs[uid];
      return e && e.nextReview && e.nextReview <= today && !(window.MECSync && MECSync.srsIsShadow && MECSync.srsIsShadow(uid));
    });
    if (!allDue.length) return { total: 0, high: 0, mid: 0, dueToday: 0 };

    // study.html の startSRSReview と同様に待たされ具合（urgency）降順で並べる
    allDue.sort((a, b) => {
      const A = srs[a] || {}, B = srs[b] || {};
      const ua = _calcSrsUrgency(A, today), ub = _calcSrsUrgency(B, today);
      if (ua !== ub) return ub - ua;
      return (A.ef == null ? 2.5 : A.ef) - (B.ef == null ? 2.5 : B.ef);
    });

    const target = allDue.slice(0, sessionLimit);
    let high = 0, mid = 0, dueToday = 0;
    target.forEach(uid => {
      const e = srs[uid];
      if (!e) return;
      const late = _diffDaysStr(e.nextReview || today, today);
      const urg = _calcSrsUrgency(e, today);
      if (late <= 0) dueToday++;
      else if (urg >= 2.0 || late >= 7) high++;
      else mid++;
    });
    return { total: target.length, high, mid, dueToday };
  } catch {
    return { total: 0, high: 0, mid: 0, dueToday: 0 };
  }
}

// ── SRS の予定表（プロトコル待機列の図の材料）─────────────────────
// 今日を0として days 日ぶん、nextReview がその日に来る件数を数える。0日目は期限切れ込み
// （late＝昨日以前が期限だったぶん）。科目の内訳は「いま復習待ちのもの」全部（出題50問に限らない）。
// ⚠️ 重複コピーの影は数えない（getSRSDueCount と同じ数え方＝0日目の合計は due と必ず一致する）。
function getSrsForecast(days = 14) {
  const out = { days: [], late: 0, maxLate: 0, odd: 0, subj: [] };
  const today = _jstDay(Date.now());
  const base = Date.parse(today + 'T00:00:00Z');
  for (let d = 0; d < days; d++) {
    out.days.push({ date: new Date(base + d * 86400000).toISOString().slice(0, 10), n: 0 });
  }
  try {
    const srs = JSON.parse(localStorage.getItem('mec_srs_v1') || '{}');
    const bySid = {};
    const shadow = window.MECSync && MECSync.srsIsShadow;
    // 「最大の遅れ」の下限。予定日は必ず「最後に解いた日＋1日以上」なので、それより前の予定日はありえない
    // （2026-10-01、今年から使っているのに「最大の遅れ 2465日」＝予定日 2020-01-01 の札が実データに混じっていた。
    //  書き込み口は study.html の _updateSRS だけで、そこからは出ない値＝出どころ不明の外れ値）。
    // そういう札は、最後に解いた日（無ければ学習記録 activity_v1 の最初の日）を期限だったとみなして遅れを測る。
    // ⚠️ 件数（復習待ち・0日目）からは外さない＝上段の数字と食い違わせない。直すのは遅れの日数だけ。
    let firstDay = '';
    try {
      const act = JSON.parse(localStorage.getItem('activity_v1') || '{}');
      for (const k in act) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && (!firstDay || k < firstDay)) firstDay = k;
    } catch (e) {}
    for (const uid in srs) {
      const e = srs[uid];
      if (!e || !e.nextReview) continue;
      const d = _diffDaysStr(today, e.nextReview);
      if (d >= days) continue;
      if (shadow && MECSync.srsIsShadow(uid)) continue;
      if (d <= 0) {
        out.days[0].n++;
        if (d < 0) {
          out.late++;
          const floor = e.lastSeen || firstDay;
          let lateD = -d;
          if (floor && e.nextReview < floor) { out.odd++; lateD = Math.max(0, _diffDaysStr(floor, today)); }
          if (lateD > out.maxLate) out.maxLate = lateD;
        }
        const sid = _noteSid(uid);
        bySid[sid] = (bySid[sid] || 0) + 1;
      } else {
        out.days[d].n++;
      }
    }
    out.subj = Object.keys(bySid).map(sid => ({ sid, n: bySid[sid] })).sort((a, b) => b.n - a.n);
  } catch (e) {}
  return out;
}

// 科目色。正本は gamify.js の SUBJECTS（→ mindmap_data/index.js の MM_SUBJECTS）。
// 過去問・実力試験Ⅰなどそこに載らない科目は灰色でまとめて見せる。
function _srsSubjColor(sid) {
  const s = (window.MM_SUBJECTS || []).find(x => x.sid === sid);
  return s && s.color ? s.color : '#8a8fa3';
}

// プロトコル待機列の図（2026-10-01・デモ _work/protocol_feed_demo.html の E 案）:
//   本日消化の大きいリング／今後14日の予定（今日は数字の箱・明日以降は別の縮尺の棒）／科目別の復習待ち（上位5科目の横棒）。
// ⚠️ 数字の正本はカード上段（本日消化・復習待ち）と同じ値を受け取って描くだけ＝ここで数え直さない。
// dp（2026-10-01・day_progress.js の MecDay.srsResult / srsStages）があれば、横幅いっぱいの段に
// 「今日の復習の結果」と「定着までの道のり」を足す（デモ _work/queue_result_demo.html の A1・B1 案）。
function _srsVizHtml(done, goal, fc, due, dp) {
  const ringR = 40, ringC = 2 * Math.PI * ringR;
  const ratio = goal > 0 ? Math.min(1, done / goal) : (done > 0 ? 1 : 0);
  const ok = goal > 0 && done >= goal;
  const ring =
    '<div class="srs-viz-ring' + (ok ? ' is-ok' : '') + '">' +
      '<span class="vr-box"><svg viewBox="0 0 92 92" aria-hidden="true">' +
        '<circle class="vr-track" cx="46" cy="46" r="' + ringR + '"></circle>' +
        '<circle class="vr-fill" data-sk="ring" cx="46" cy="46" r="' + ringR + '" stroke-dasharray="' + ringC.toFixed(2) + '" stroke-dashoffset="' + (ringC * (1 - ratio)).toFixed(2) + '"></circle>' +
      '</svg>' +
      '<span class="vr-mid"><b>' + _sfx('ring', done) + '</b>' + (goal > 0 ? '<small>/ ' + _fmtN(goal) + '問</small>' : '<small>問</small>') + '</span></span>' +
      '<span class="srs-viz-cap">本日消化' + (goal > 0 ? ' <b>' + _sfx('pct', Math.round(ratio * 100)) + '%</b>' : '') + '</span>' +
    '</div>';

  // 14日の予定（2026-10-01・デモ _work/forecast_demo.html の B 案「今日を切り離す」）。
  // 今日（期限切れ込み）だけ飛び抜けて大きく、同じ縮尺だと明日以降の棒が潰れて読めなかった。
  // そこで今日は左の数字の箱に切り出し、明日以降の13日は自分たちだけの縮尺で描く。
  // ⚠️ 件数を全部の棒に載せない（13本だと3桁が重なる）。明日・一番多い日・一番少ない日だけ。
  const today0 = fc.days[0] || { n: 0 };
  const fut = fc.days.slice(1);
  const top = Math.max(1, ...fut.map(d => d.n));
  let mxI = 0, mnI = 0;
  fut.forEach((d, i) => { if (d.n > fut[mxI].n) mxI = i; if (d.n < fut[mnI].n) mnI = i; });
  const cols = fut.map((d, i) => {
    const h = d.n / top * 100;
    const md = d.date.slice(5).replace('-', '/');
    const num = (i === 0 || i === mxI || i === mnI) ? _fmtN(d.n) : '';
    return '<div class="fb-col" title="' + md + ': ' + _fmtN(d.n) + '問"><span class="fb-n">' + num + '</span>' +
      '<div class="fb-slot"><span class="fb-bar' + (i === mxI && d.n > 0 ? ' is-peak' : '') + '" style="height:' + h.toFixed(1) + '%"></span></div>' +
      '<span class="fb-lbl">' + (i % 2 === 0 ? String(Number(d.date.slice(8, 10))) : '') + '</span></div>';
  }).join('');
  const todayBox =
    '<div class="fb-today' + (today0.n === 0 ? ' is-clear' : '') + '" title="今日が期限（期限切れ ' + _fmtN(fc.late) + '問を含む）">' +
      '<span class="fbt-l">今日</span><b>' + _sfx('today0', today0.n) + '</b>' +
      (fc.late > 0 ? '<small>期限切れ ' + _sfx('late', fc.late) + '</small>' : '<small>' + (today0.n ? '問' : 'なし') + '</small>') +
    '</div>';
  const forecast =
    '<div class="srs-viz-fc srs-viz-pane">' +
      '<div class="srs-viz-hd"><span class="srs-viz-t">今後14日の予定</span></div>' +
      '<div class="fb-wrap">' + todayBox + '<div class="fb-chart">' + cols + '</div></div>' +
    '</div>';

  // 科目別の復習待ち（復習待ちがある日だけ）。上位5科目を横棒で、残りは「ほかN科目」にまとめる
  let subj = '';
  if (due > 0 && fc.subj.length) {
    const mx = fc.subj[0].n || 1;
    const top5 = fc.subj.slice(0, 5);
    const restList = fc.subj.slice(5);
    const rest = restList.reduce((s, x) => s + x.n, 0);
    const rows = top5.map(x => {
      const sj = _noteSubj(x.sid);
      return '<div class="sv-sr" title="' + sj.label + ' ' + _fmtN(x.n) + '問"><span class="sv-sn">' + sj.label + '</span>' +
        '<span class="sv-track"><i data-sk="sv-' + x.sid + '" style="width:' + (x.n / mx * 100).toFixed(1) + '%;background:' + _srsSubjColor(x.sid) + '"></i></span>' +
        '<b>' + _sfx('sv-' + x.sid, x.n) + '</b></div>';
    }).join('') +
      (rest > 0 ? '<div class="sv-sr is-rest"><span class="sv-sn">ほか' + restList.length + '科目</span><span></span><b>' + _fmtN(rest) + '</b></div>' : '');
    subj =
      '<div class="srs-viz-sb srs-viz-pane">' +
        '<div class="srs-viz-hd"><span class="srs-viz-t">科目別の復習待ち</span><span class="srs-viz-note"><b>' + fc.subj.length + '</b>科目</span></div>' +
        rows +
      '</div>';
  }
  // 今日の復習の結果（2色の帯）。今日 SRS で1問も解いていない日は出さない。
  // ⚠️ 2026-10-01 まではここに「今日の復習の減り方」（右下がりの階段）があった。解いた数だけ1ずつ減るので
  //    傾きが必ず一定になり、本日消化のリングと同じことしか言っていなかった（ユーザー「全く無意味」）。戻さないこと。
  let resHtml = '';
  const res = dp && dp.res;
  if (res && res.n > 0) {
    resHtml =
      '<div class="srs-viz-x srs-viz-res srs-viz-pane">' +
        '<div class="srs-viz-hd"><span class="srs-viz-t">今日の復習の結果</span><span class="srs-viz-note"><b>' + _sfx('rn', res.n) + '</b>問</span></div>' +
        '<div class="rs-bar" aria-hidden="true"><i class="rs-up" data-sk="rs-up" style="flex:' + res.up + '"></i><i class="rs-back" data-sk="rs-back" style="flex:' + res.back + '"></i></div>' +
        '<div class="rs-legs">' +
          '<span class="rs-leg">✅ 間隔が伸びた <b class="rs-ok">' + _sfx('rup', res.up) + '</b>' +
            (res.up && res.avgNext ? '<small>→ 次は平均 ' + _fmtN(res.avgNext) + '日後</small>' : '') + '</span>' +
          '<span class="rs-leg">❌ 明日に戻った <b class="rs-ng">' + _sfx('rback', res.back) + '</b>' +
            (res.back ? '<small>→ 明日の予定に +' + _fmtN(res.back) + '</small>' : '') + '</span>' +
        '</div>' +
      '</div>';
  }
  // 定着までの道のり（4段階の積み上げ帯・地域医療構想の病床区分に倣った名前）。SRS の札が1枚も無い日は出さない。
  // ⚠️ 増減は慢性期（＝定着）の「今日 +N」だけ（札の md で正確に出せる）。ほかの段階の前回の値は保存しない。
  let stHtml = '';
  const st = dp && dp.st;
  if (st && st.total > 0 && window.MecDay) {
    const S = MecDay.STAGES;
    stHtml =
      '<div class="srs-viz-x srs-viz-st srs-viz-pane">' +
        '<div class="srs-viz-hd"><span class="srs-viz-t">定着までの道のり</span><span class="srs-viz-note">全 <b>' + _sfx('stt', st.total) + '</b>問</span></div>' +
        '<div class="st-bar" aria-hidden="true">' + S.map((x, i) => '<i class="st-' + i + '" data-sk="st' + i + '" style="flex:' + st.n[i] + '"></i>').join('') + '</div>' +
        '<div class="st-legs">' + S.map((x, i) =>
          '<span class="st-leg" title="' + x.label + '（' + (i === 3 ? '定着＝トロフィーと同じ判定' : '次に会うまで ' + x.span) + '）">' +
            '<span class="st-lb"><i class="st-' + i + '"></i>' + x.label + '<small>' + x.span + '</small></span>' +
            '<b>' + _sfx('st' + i, st.n[i]) + (i === 3 && st.today > 0 ? '<span class="st-up">今日 +' + _fmtN(st.today) + '</span>' : '') + '</b>' +
          '</span>').join('') +
        '</div>' +
      '</div>';
  }
  return '<div class="srs-viz' + (subj ? '' : ' no-band') + '">' + ring + forecast + subj + resHtml + stHtml + '</div>';
}

// ── 今日の学習量とXP ──────────────────────────────────────────
// ⚠️ 数字の出どころ（ここを崩すと嘘の数字が出る）:
//   ・試験/SRS/章別試験は mec_attempts_v1 に1解答=1行で時刻付きで残る＝今日ぶんは正確。
//   ・通常モードの「済」には時刻が一切残らない（done_v2 は uid→周回数だけ）。
//     そこで activity_v1[today]（＝その日セッション内で初めて触れた問題の数・
//     mecIncrLap と _markExamDone の両方が同じ条件で足す）から
//     今日の試験ぶん（セッション×UIDの異なり数）を引いて通常モードぶんを出す。
//   ・XP式は gamify.js の stats() と同じ: laps×10 + 試験解答×4 + 試験正解×6。
//     _markExamDone は解答のたびに done_v2 も +1 するので、試験1問 = 14XP（正解なら20XP）。
//   ・既知の誤差: 同一セッションで同じ問題を2回「済」にすると通常モードぶんが
//     1問（10XP）少なく出る。無くすには日別台帳の新設＝同期キー追加が要る。
const XP_LAP = 10, XP_EX_ANSWER = 4, XP_EX_CORRECT = 6;
const SRS_DEFAULT_SESSION_LIMIT = 50;
const SRS_DAILY_TARGET = 200;   // 1日の復習目標（根拠は renderHero の srsGoal のコメント）

// 将来的に 10 / 25 / 50 問などのセッション選択に対応可能な拡張口
function getSrsSessionLimit() {
  return SRS_DEFAULT_SESSION_LIMIT;
}

function _jstDay(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0, 10); }

function getTodayLearning() {
  const today = _jstDay(Date.now());
  let att = [];
  try { att = JSON.parse(localStorage.getItem('mec_attempts_v1') || '[]'); } catch {}

  let exT = 0, exC = 0, srsDone = 0;
  (Array.isArray(att) ? att : []).forEach(line => {
    if (typeof line !== 'string') return;
    const p = line.split('|');
    if (p.length < 8) return;
    const t = Number(p[1]);              // 分単位epoch
    if (!t || _jstDay(t * 60000) !== today) return;
    exT++;
    if (p[3] === '1') exC++;
    if (p[5] === 's') srsDone++;
  });

  let act = 0;
  try { act = (JSON.parse(localStorage.getItem('activity_v1') || '{}'))[today] || 0; } catch {}
  // 通常モードぶん: 今日の全活動回数(act)から試験・再試験の解答回数(exT)を引いたもの（負なら0）
  const normal = Math.max(0, act - exT);

  return {
    solved: exT + normal,
    exT, exC, normal, srsDone,
    accPct: exT > 0 ? Math.round(exC / exT * 100) : 0,
    xp: (exT + normal) * XP_LAP + exT * XP_EX_ANSWER + exC * XP_EX_CORRECT,
  };
}

// ── 統計計算 ──────────────────────────────────────────────────
// 全問題数と「済」は progress.js の MECSync.totalInScope / doneInScope が正本（2026-09-11）。
// 統合学習ツール・学習統計も同じ関数を読むので、ここで数え方を書かないこと——
// 以前は4か所が別々に数えていて、ハブの「済 累計」と統合学習ツールの「済」が食い違っていた。
// ⚠️ MEC_CHAPTER_META（小児科・産婦人科だけの部分マップ）を合計しないこと。
//    2026-07-23まで META を合計していたため「合計3043問」と過少表示されていた。
function calcTotalQ() {
  return window.MECSync ? MECSync.totalInScope() : 0;
}
function calcDoneInScope() {
  return window.MECSync ? MECSync.doneInScope() : 0;
}

function _fmtN(n) { return (n || 0).toLocaleString('ja-JP'); }

// ヒーローに出す今日の日付（「2026年8月13日(木)」）。
// ⚠️ 端末のタイムゾーンではなく JST で切ること。activity_v1・ミッション・attempts の
//    日境界が全部 UTC+9 なので、ここだけ端末ローカルにすると深夜に日付と数字がずれる。
const _WD_JA = ['日', '月', '火', '水', '木', '金', '土'];
function _todayLabelJa() {
  const d = new Date(Date.now() + 9 * 3600000);   // 以降 getUTC* で読む＝JSTの暦日になる
  return d.getUTCFullYear() + '年' + (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日'
    + '(' + _WD_JA[d.getUTCDay()] + ')';
}

// done_v2 のキーを prefix で数える。ハブの進捗表示はすべてこれが根拠
function _doneCountBy(prefix) {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  return Object.keys(done).filter(k => k.startsWith(prefix)).length;
}

// 過去問（全年度・全ブロックの合計）
function getKakumonProgress() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  let total = 0, doneCount = 0;
  Object.keys(KAKUMON_BLOCKS).forEach(id => {
    total += KAKUMON_BLOCKS[id];
    doneCount += Object.keys(done).filter(k => k.startsWith('kakumon_' + id + '_q')).length;
  });
  return { total, doneCount, pct: total ? Math.round(doneCount / total * 100) : 0 };
}

// 実力試験Ⅰ（A/B の合計）
function getJitsuProgress() {
  let total = 0, doneCount = 0;
  JITSU1_CHAPTERS.forEach(ch => { total += ch.count; doneCount += _doneCountBy(ch.prefix + '_q'); });
  return { total, doneCount, pct: total ? Math.round(doneCount / total * 100) : 0 };
}

// ── UI 描画 ───────────────────────────────────────────────────
// Stat-Led ヒーロー: 「いま何をすべきか」を1つの巨大な数字で名指しする。
// 復習期限が来ていればその件数、無ければ到達済み問題数を出す。
// ⚠️ 数字は必ず実データ由来にすること。架空の数字を置くくらいなら数字を出さない。
// 初回描画が済んだか。2回目以降は盤面の入場アニメ（円弧・波形・棒）を止める
let _heroSettled = false;

// 円弧の全長 = 2π×54。CSS の .gauge-val の stroke-dasharray / @keyframes ringDraw と
// 必ず同じ値にすること（片方だけ変えるとゲージが常に満タン or 空になる）
const GAUGE_C = 339.29;

// gamify.js が読めなかったときだけ使うゲージの分母。
// 正本は gamify.js の MISSIONS_DAILY の ans（200問）で、通常はそちらが使われる。
const DAILY_GOAL_FALLBACK = 200;

// 直近14日の学習量・ペース分析・連続学習トラック。素材は activity_v1（日→解答回数）。
let _sparkRecordShown = false;
let _activeSparkTip = null;
let _prevTodaySparkCount = -1;

function _renderSpark() {
  const host = document.getElementById('heroSpark');
  const dateHost = document.getElementById('heroSparkDates');
  const streakHost = document.getElementById('heroStreakTrack');
  const paceBanner = document.getElementById('heroPaceBanner');
  const recordHdr = document.getElementById('heroSparkRecord');
  const targetLine = document.getElementById('heroSparkTargetLine');
  if (!host) return;

  let log = {};
  try { log = JSON.parse(localStorage.getItem('activity_v1') || '{}'); } catch {}
  const base = Date.now() + 9 * 3600000;   // JST。日付の切り方を calcStreak と揃える

  // 直近14日分の配列を生成（0 = 13日前, 13 = 今日）
  const days14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(base - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    days14.push({
      iso: iso,
      dateObj: d,
      day: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      wd: _WD_JA[d.getUTCDay()],
      dayIdx: d.getUTCDay(),
      count: log[iso] || 0,
      isToday: i === 0,
    });
  }

  const counts = days14.map(d => d.count);
  const todayCount = days14[13].count;
  const mx = Math.max(1, ...counts);
  const past13Max = Math.max(0, ...counts.slice(0, 13));
  const isRecord = todayCount > 0 && todayCount > past13Max;
  const activeDays = counts.filter(v => v > 0).length;

  // 期間内最多日（最も問題数を解いた日）
  let maxDay = null;
  if (mx > 0) {
    for (let i = 13; i >= 0; i--) {
      if (days14[i].count === mx) { maxDay = days14[i]; break; }
    }
  }

  // 1. ヘッダー記録表示
  if (recordHdr) {
    if (maxDay && mx > 0) {
      const isTodayMax = maxDay.isToday;
      recordHdr.textContent = '👑 2週間最多: ' + mx + '問 (' + (isTodayMax ? '今日' : maxDay.month + '/' + maxDay.day) + ')';
    } else {
      recordHdr.textContent = '';
    }
  }

  // 2. ペース分析インサイトバナー
  if (paceBanner) {
    // 直近3日間（今日＋昨日＋一昨日）
    const recent3 = days14[13].count + days14[12].count + days14[11].count;
    // 前週の同3日間（7日前＋8日前＋9日前）
    const d7 = log[new Date(base - 7 * 86400000).toISOString().slice(0, 10)] || 0;
    const d8 = log[new Date(base - 8 * 86400000).toISOString().slice(0, 10)] || 0;
    const d9 = log[new Date(base - 9 * 86400000).toISOString().slice(0, 10)] || 0;
    const prev3 = d7 + d8 + d9;

    let pCls = 'steady', pIcon = '⚖️', pMsg = '';
    if (prev3 > 0) {
      const diffPct = Math.round(((recent3 - prev3) / prev3) * 100);
      const diffCount = recent3 - prev3;
      if (diffPct >= 30) {
        pCls = 'good'; pIcon = '🚀';
        pMsg = '驚異的なペース！直近3日は先週比 +' + diffPct + '%（+' + diffCount + '問）加速中！';
      } else if (diffPct >= 5) {
        pCls = 'neutral'; pIcon = '📈';
        pMsg = '順調！直近3日は先週比 +' + diffPct + '%（+' + diffCount + '問）ペースを維持しています';
      } else if (diffPct >= -5) {
        pCls = 'steady'; pIcon = '⚖️';
        pMsg = '直近3日は先週と同水準（' + recent3 + '問）で着実に進行中';
      } else if (diffPct >= -35) {
        pCls = 'warn'; pIcon = '⚠️';
        const need = Math.max(1, prev3 - recent3);
        pMsg = '直近3日は先週比 ' + diffPct + '% ペース。あと' + need + '問で先週ペース維持！';
      } else {
        pCls = 'bad'; pIcon = '📉';
        pMsg = '直近3日は先週比 ' + diffPct + '%。まずは今日の1問からリズムを取り戻そう！';
      }
    } else {
      if (recent3 > 0) {
        pCls = 'good'; pIcon = '✨';
        pMsg = '直近3日で ' + recent3 + '問 解答！いい調子で進んでいます';
      } else {
        pCls = 'steady'; pIcon = '💡';
        pMsg = '今日のミッションを解いて、直近14日間のペースグラフを伸ばそう！';
      }
    }
    paceBanner.className = 'pace-banner ' + pCls;
    paceBanner.innerHTML = '<span class="pace-banner-ic">' + pIcon + '</span><span class="pace-banner-tx">' + pMsg + '</span>';
    paceBanner.hidden = false;
  }

  // 3. デイリー目標ライン（MecGamify.dailyGoal() と連動、既定200問）＆ オーバードライブ判定
  const targetGoal = (window.MecGamify && MecGamify.dailyGoal) ? MecGamify.dailyGoal().target : DAILY_GOAL_FALLBACK;
  const scaleMax = Math.max(targetGoal * 1.15, mx);
  if (targetLine) {
    const targetPct = Math.min(88, Math.max(16, Math.round(targetGoal / scaleMax * 100)));
    targetLine.style.bottom = targetPct + '%';
    const isTargetAchieved = todayCount >= targetGoal;
    targetLine.classList.toggle('achieved', isTargetAchieved);
    const targetLbl = targetLine.querySelector('.spark-target-lbl');
    if (targetLbl) targetLbl.textContent = isTargetAchieved ? ('目標 ' + targetGoal + ' ✓') : ('目標 ' + targetGoal);
  }

  // 第1位: 前回の今日解答数との差分検知（リアルタイム伸長 & +N ポップアップ）
  let diffCount = 0;
  let storedLastCount = -1;
  try { storedLastCount = parseInt(sessionStorage.getItem('mec_last_today_ans') || '-1', 10); } catch (e) {}
  if (_prevTodaySparkCount >= 0 && todayCount > _prevTodaySparkCount) {
    diffCount = todayCount - _prevTodaySparkCount;
  } else if (storedLastCount >= 0 && todayCount > storedLastCount) {
    diffCount = todayCount - storedLastCount;
  }
  _prevTodaySparkCount = todayCount;
  try { sessionStorage.setItem('mec_last_today_ans', String(todayCount)); } catch (e) {}

  // 4. 14本のバー列
  host.innerHTML = days14.map((d, i) => {
    const isPeak = d.count === mx && d.count > 0;
    const isOverdrive = d.count >= targetGoal;
    const isSat = d.dayIdx === 6;
    const isSun = d.dayIdx === 0;
    const isWeekEnd = (i === 6); // 先週（i=0〜6）と今週（i=7〜13）の境界
    const h = d.count ? Math.max(10, Math.round(d.count / scaleMax * 100)) + '%' : '2px';
    const cls = 'bar' + (d.count ? ' on' : '') + (d.isToday && d.count ? ' today' : '') + (isPeak ? ' record' : '') + (isOverdrive ? ' overdrive' : '');
    const crown = isPeak ? '<span class="bar-crown" aria-hidden="true">👑</span>' : '';
    const popBadge = (d.isToday && diffCount > 0) ? '<span class="spark-pop-badge" aria-hidden="true">+' + diffCount + '問</span>' : '';

    let colCls = 'bar-col';
    if (isSat) colCls += ' weekend sat';
    else if (isSun) colCls += ' weekend sun';
    if (isWeekEnd) colCls += ' week-end';

    return '<div class="' + colCls + '" data-i="' + i + '" data-iso="' + d.iso + '" data-count="' + d.count + '" data-month="' + d.month + '" data-day="' + d.day + '" data-wd="' + d.wd + '" data-peak="' + (isPeak ? '1' : '0') + '" data-today="' + (d.isToday ? '1' : '0') + '" style="--i:' + i + '">'
      + popBadge + crown + '<i class="' + cls + '" style="height:' + h + '"></i></div>';
  }).join('');

  host.setAttribute('aria-label', '直近14日間の学習量。学習した日は ' + activeDays + ' 日' +
    (isRecord ? '。今日は2週間で最多記録更新' : ''));

  // 5. 日付・曜日行
  if (dateHost) {
    dateHost.innerHTML = days14.map(d => {
      let cls = 'date-lbl';
      if (d.dayIdx === 6) cls += ' sat';
      else if (d.dayIdx === 0) cls += ' sun';
      if (d.isToday) cls += ' today';
      const label = d.isToday ? '今日' : d.day;
      return '<div class="' + cls + '">' + label + '</div>';
    }).join('');
  }

  // 6. 連続学習（Streak）アンダーライン
  if (streakHost) {
    const streak = window.MECSync ? MECSync.calcStreak() : 0;
    streakHost.innerHTML = days14.map((d, i) => {
      // 連続記録中の日数（末尾の今日から streak 日前まで）
      const inStreak = streak > 0 && (13 - i) < streak && d.count > 0;
      const isStreakToday = inStreak && d.isToday;
      const cls = 'streak-seg' + (inStreak ? ' active' : '') + (isStreakToday ? ' today' : '');
      return '<div class="' + cls + '"></div>';
    }).join('');
  }

  // 7. インタラクティブ・ツールチップ（タップ/ホバー）
  _bindSparkTooltips(host);

  // 8. 🎉【第7位】2週間最多記録の更新ファンファーレ（Record Burst）
  if (isRecord && !_sparkRecordShown) {
    _sparkRecordShown = true;
    setTimeout(() => {
      const bar = host.querySelector('.bar-col[data-today="1"] .bar');
      const c = _centerOf(bar);
      if (c && _fxOk()) {
        MecFX.glyphBurst(c.x, c.r.top, { glyphs: ['👑', '✨', '✦', '🎉'], count: 8, spread: 110, w: 12 });
        const curTheme = localStorage.getItem('mec_ui_theme_v1') || 'aurora';
        if (curTheme === 'brass' && MecFX.gears) {
          MecFX.gears(c.x, c.r.top, { count: 5 });
        } else if (MecFX.sparks) {
          MecFX.sparks(c.x, c.r.top, { count: 12, speed: 220 });
        }
      }
      // ⚠️ ここで結果音（sounds/結果画面/）を鳴らさないこと（2026-09-28 撤去）。
      // _sparkRecordShown はページを読むたびに戻るので、今日が最多記録の日は
      // ハブを再読み込みするたびに試験の結果画面のファンファーレが鳴っていた。
    }, 700);
  }
}

// ツールチップの制御
function _bindSparkTooltips(host) {
  if (!host) return;
  const cols = host.querySelectorAll('.bar-col');
  cols.forEach(col => {
    const show = (e) => {
      e.stopPropagation();
      if (_activeSparkTip) _activeSparkTip.remove();
      const count = parseInt(col.dataset.count || '0', 10);
      const m = col.dataset.month;
      const d = col.dataset.day;
      const wd = col.dataset.wd;
      const isPeak = col.dataset.peak === '1';
      const isToday = col.dataset.today === '1';

      const tip = document.createElement('div');
      tip.className = 'spark-tip';
      let title = (isToday ? '今日 ' : '') + m + '月' + d + '日 (' + wd + ')';
      let sub = count + '問 解答';
      if (isPeak && count > 0) sub += ' 👑 期間最多';
      tip.innerHTML = '<span>' + title + '</span><span class="spark-tip-sub">' + sub + '</span>';
      col.appendChild(tip);
      _activeSparkTip = tip;
    };
    col.addEventListener('pointerenter', show);
    col.addEventListener('click', show);
  });
}

// 画面外タップでツールチップを閉じる
document.addEventListener('click', (e) => {
  if (_activeSparkTip && !e.target.closest('.spark-container')) {
    _activeSparkTip.remove();
    _activeSparkTip = null;
  }
});

// ── 🕸 実力の輪郭（8軸レーダー）────────────────────────────────
// 2026-09-12。旧「臨床スキルプロファイル」の席に、今度は本物のデータで描く。
//
// ⚠️⚠️ 半径に「自分の生の正答率」だけを使わないこと。弱点カルテで確立した理屈がそのまま
//    効く——検査・治療のように全国的にも難しい問題が多い領域は、生の％で塗ると
//    **問題の難しさが弱点に見える**。ここは実線＝自分／点線＝**同じ問題の**全国正答率の
//    二重ポリゴンで描き、**面積の差**を実力として読ませる。
// ⚠️ 全国正答率は uid 単位で引く（window.MEC_RATE）。**科目平均で代用しないこと**——
//    stats.html が廃止した「📐本番との差」と同じ誤り（引き算の左右で分母が違う）になる。
// ⚠️ 集計の式は stats.html の buildKarte / karteGap と同じ（解いた uid ごとに全国正答率を
//    足し込み、自分 − 全国）。ハブのレーダーと統計のカルテが必ず同じ数字を言うため。
// ⚠️ 配色は緑赤ではなく **青＝上回り／琥珀＝下回り**（カルテと同じ言語・色覚の都合）。
//    所見フィードの緑とは別軸なので混ぜないこと。
//
// ⚠️ 過去問・実力試験Ⅰ・模試・必修講座・自作・暗記メモは**科目が付かない**ので軸に載らない
//    （過去問1,825問には科目バッジが1つも無い）。対象外の件数は脚に必ず出すこと。

const RADAR_CX = 150, RADAR_CY = 120, RADAR_R = 78;
const RADAR_MIN_N = 20;                  // これ未満の軸は「未測定」＝測れたふりをしない
const RADAR_SNAP_KEY = 'mec_radar_snap_v1';   // ⚠️ UIローカル（非同期）
const RADAR_GHOST_DAYS = 30;             // 何日前の自分を点線で重ねるか
const RADAR_GHOST_TOL = 12;              // ±この日数まではゴーストとして採る

// 8つの科目群。⚠️ 科目を足したらここへ入れること（どの軸にも入らない科目は黙って落ちる）。
//    実測（2026-09-12）で 735〜1,204問・全国正答率 88〜99% と均衡している。
const RADAR_AXES = [
  { id: 'cr', label: '循環・呼吸',   full: '循環器・呼吸器',           sids: ['circ', 'resp'] },
  { id: 'gi', label: '消化・肝胆',   full: '消化器・肝胆膵',           sids: ['dige', 'hbp'] },
  { id: 'en', label: '腎・内分泌',   full: '腎臓・内分泌',             sids: ['jinzo_d', 'endo'] },
  { id: 'hm', label: '血液・免疫',   full: '血液・免アレ膠・感染症',   sids: ['hema', 'imma', 'kansen'] },
  { id: 'ne', label: '神経・精神',   full: '神経・精神科',             sids: ['neur', 'psy'] },
  { id: 'pd', label: '小児・産婦',   full: '小児科・産婦人科',         sids: ['peds', 'obg'] },
  { id: 'sg', label: '外科系',       full: '整形・眼・耳鼻・泌尿・皮膚・麻酔・放射線',
    sids: ['ortho', 'oph', 'ent', 'uro', 'derm', 'anes', 'rad'] },
  { id: 'em', label: '救急・公衆',   full: '救急・中毒・公衆衛生',     sids: ['emg', 'tox', 'ph'] },
];
const _RADAR_SID2AX = (function () {
  const m = {};
  RADAR_AXES.forEach(a => a.sids.forEach(s => { m[s] = a.id; }));
  return m;
})();

// ── 集計 ─────────────────────────────────────────────────────
// 自分 = myrate_v1（試験モードの自己正答率・uid → {correct,total}）。
// 全国 = 同じ uid の MEC_RATE を「その uid を解いた回数」で重み付けした平均。
function _radarStats() {
  const ax = {};
  RADAR_AXES.forEach(a => { ax[a.id] = { t: 0, c: 0, nat: 0, uids: 0, bySid: {} }; });
  let outside = 0, noRate = 0;

  let mr = {};
  try { mr = JSON.parse(localStorage.getItem('myrate_v1') || '{}'); } catch (e) {}
  const RATE = window.MEC_RATE || {};

  for (const uid in mr) {
    const e = mr[uid]; if (!e) continue;
    const t = e.total || 0; if (t <= 0) continue;
    const id = _RADAR_SID2AX[_noteSid(uid)];
    if (!id) { outside += t; continue; }          // 過去問・模試・必修講座・自作など
    const r = RATE[uid];
    if (typeof r !== 'number') { noRate += t; continue; }
    const A = ax[id];
    A.t += t; A.c += (e.correct || 0); A.nat += r * t; A.uids++;
    const sid = _noteSid(uid);
    const B = A.bySid[sid] || (A.bySid[sid] = { t: 0, c: 0, nat: 0 });
    B.t += t; B.c += (e.correct || 0); B.nat += r * t;
  }

  const axes = RADAR_AXES.map(a => {
    const A = ax[a.id];
    const measured = A.t >= RADAR_MIN_N;
    const self = A.t ? A.c / A.t * 100 : 0;
    const nat = A.t ? A.nat / A.t : 0;
    // その軸でいちばん下回っている科目（リンク先に使う）
    let worst = null;
    for (const sid in A.bySid) {
      const B = A.bySid[sid];
      if (B.t < 8) continue;
      const g = (B.c / B.t * 100) - (B.nat / B.t);
      if (!worst || g < worst.gap) worst = { sid: sid, gap: g, t: B.t };
    }
    return {
      id: a.id, label: a.label, full: a.full, sids: a.sids,
      t: A.t, c: A.c, uids: A.uids,
      self: self, nat: nat, gap: self - nat, measured: measured, worst: worst,
    };
  });
  return { axes: axes, outside: outside, noRate: noRate,
           covered: axes.reduce((s, a) => s + a.t, 0) };
}

// ── 30日前の自分（ゴースト）─────────────────────────────────
// ⚠️ 1日1回だけ書く。myrate_v1 は累積で履歴を持たないので、ここで薄い履歴を作る。
// ⚠️ 同期対象にしないこと（端末ごとに履歴が違ってよい。同期させるなら日付キーの
//    union マージを progress.js 側に足す必要がある）。
function _radarSnapshot(stats) {
  const today = _jstDay(Date.now());
  let snap = {};
  try { snap = JSON.parse(localStorage.getItem(RADAR_SNAP_KEY) || '{}'); } catch (e) {}

  // ゴーストを先に選ぶ（今日ぶんを書く前に。初日に自分自身を重ねないため）
  let ghost = null, best = 1e9;
  for (const d in snap) {
    const age = _noteDayDiff(d, today);
    const off = Math.abs(age - RADAR_GHOST_DAYS);
    if (age >= RADAR_GHOST_DAYS - RADAR_GHOST_TOL && off < best) { best = off; ghost = { day: d, v: snap[d], age: age }; }
  }

  if (!snap[today]) {
    const row = {};
    stats.axes.forEach(a => { if (a.t > 0) row[a.id] = [a.t, a.c, Math.round(a.nat * a.t)]; });
    snap[today] = row;
    // 100日より古いものは捨てる
    Object.keys(snap).forEach(d => { if (_noteDayDiff(d, today) > 100) delete snap[d]; });
    try { localStorage.setItem(RADAR_SNAP_KEY, JSON.stringify(snap)); } catch (e) {}
  }

  if (!ghost) return null;
  const out = {};
  RADAR_AXES.forEach(a => {
    const v = ghost.v[a.id];
    if (!v || !(v[0] >= RADAR_MIN_N)) return;
    out[a.id] = { self: v[1] / v[0] * 100, nat: v[2] / v[0], t: v[0] };
  });
  return Object.keys(out).length ? { day: ghost.day, age: ghost.age, ax: out } : null;
}

// ── 幾何 ─────────────────────────────────────────────────────
function _radarPt(i, frac) {
  const a = (-90 + 45 * i) * Math.PI / 180;
  const r = RADAR_R * Math.max(0, Math.min(1, frac));
  return [RADAR_CX + r * Math.cos(a), RADAR_CY + r * Math.sin(a)];
}
function _radarPoly(fracs) {
  return fracs.map((f, i) => _radarPt(i, f).map(v => Math.round(v * 10) / 10).join(',')).join(' ');
}
// ±5pt 以内は無彩色（カルテの karteLv と同じ帯）
function _radarGapCls(gap) {
  if (gap >= 12) return 'u2'; if (gap >= 5) return 'u1';
  if (gap <= -12) return 'd2'; if (gap <= -5) return 'd1';
  return 'n0';
}

// ── 描画 ─────────────────────────────────────────────────────
let _radarSel = -1;      // 選択中の軸（-1 = 既定＝いちばん下回っている軸）
let _radarLast = null;   // 直近の集計。軸をタップしたときに数え直さないため
let _radarLastHtml = '';  // ⚠️ 中身が同じなら innerHTML を差し替えない
                          //    （同期のたびに描き直すと選択中の軸の見た目が飛ぶ）
function _renderHubRadar() {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;
  const S = _radarStats();
  const ghost = _radarSnapshot(S);
  _radarLast = { S: S, ghost: ghost };
  const measured = S.axes.filter(a => a.measured);

  const g = [];
  // 目盛り（25 / 50 / 75 / 100%）
  [0.25, 0.5, 0.75, 1].forEach((f, i) => {
    g.push('<polygon class="rd-grid' + (i === 3 ? ' rd-grid-out' : '') + '" points="'
      + _radarPoly(RADAR_AXES.map(() => f)) + '"></polygon>');
  });
  RADAR_AXES.forEach((a, i) => {
    const p = _radarPt(i, 1);
    g.push('<line class="rd-axis" x1="' + RADAR_CX + '" y1="' + RADAR_CY
      + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"></line>');
  });

  // ⚠️⚠️ 未測定の軸を 0 に落とさないこと。落とすとその軸だけポリゴンが中心へ食い込み、
  //    「実力ゼロ」に見える（測っていないことと、できないことは違う）。自分と全国の両方を
  //    同じ中立値（測定済みの軸の全国平均）へ置き、頂点の白抜きとラベルの薄さで
  //    「測っていない」と読ませる＝形に影響を与えない。
  const natMid = measured.length ? measured.reduce((s2, a) => s2 + a.nat, 0) / measured.length : 60;
  const selfFrac = a => (a.measured ? a.self : natMid) / 100;
  const natFrac  = a => (a.measured ? a.nat  : natMid) / 100;

  if (measured.length >= 3) {
    // 全国（点線）→ ゴースト → 自分（実線）の順に描く。後に描いた方が上に載る
    g.push('<polygon class="rd-nat" points="' + _radarPoly(S.axes.map(natFrac)) + '"></polygon>');
    if (ghost) {
      const gf = S.axes.map(a => {
        const v = ghost.ax[a.id];
        return (a.measured && v) ? v.self / 100 : selfFrac(a);
      });
      g.push('<polygon class="rd-ghost" points="' + _radarPoly(gf) + '"></polygon>');
    }
    g.push('<polygon class="rd-self" points="' + _radarPoly(S.axes.map(selfFrac)) + '"></polygon>');
  }

  // 頂点と当たり判定。⚠️ 未測定は塗らない（白抜き）＝「平均」ではなく「測っていない」
  S.axes.forEach((a, i) => {
    const p = _radarPt(i, selfFrac(a));   // 未測定はポリゴンと同じ中立位置へ（上のコメント参照）
    g.push('<circle class="rd-dot ' + (a.measured ? 'rd-' + _radarGapCls(a.gap) : 'rd-none')
      + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (a.measured ? 3.4 : 2.8) + '"></circle>');
  });

  // ラベル（盤面の外・viewBox に余白を取ってあるので切れない）
  S.axes.forEach((a, i) => {
    const p = _radarPt(i, 1);
    const ang = (-90 + 45 * i) * Math.PI / 180;
    const cx = Math.cos(ang), cy = Math.sin(ang);
    const x = RADAR_CX + (RADAR_R + 15) * cx, y = RADAR_CY + (RADAR_R + 15) * cy;
    const anchor = Math.abs(cx) < 0.2 ? 'middle' : (cx > 0 ? 'start' : 'end');
    const dy = Math.abs(cy) < 0.2 ? 4 : (cy > 0 ? 10 : -2);
    g.push('<text class="rd-lbl' + (a.measured ? '' : ' rd-lbl-off') + (i === _radarSel ? ' rd-lbl-sel' : '')
      + '" x="' + x.toFixed(1) + '" y="' + (y + dy).toFixed(1) + '" text-anchor="' + anchor
      + '" data-ax="' + i + '" role="button" tabindex="0">' + a.label + '</text>');
    // 押しやすいように透明の当たり判定を重ねる（文字だけだと細すぎる）
    g.push('<circle class="rd-hit" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1)
      + '" r="16" data-ax="' + i + '"></circle>');
  });

  const html = g.join('');
  if (html !== _radarLastHtml) { svg.innerHTML = html; _radarLastHtml = html; }
  svg.setAttribute('aria-label', '実力の輪郭。' + measured.length + '軸を測定済み。'
    + measured.map(a => a.full + ' 自分' + Math.round(a.self) + '% 全国' + Math.round(a.nat) + '%').join('、'));

  // 既定の選択＝いちばん下回っている軸（無ければ最も受験数が多い軸）
  if (_radarSel < 0) {
    let bi = -1, bg = 1e9;
    S.axes.forEach((a, i) => { if (a.measured && a.gap < bg) { bg = a.gap; bi = i; } });
    if (bi < 0) S.axes.forEach((a, i) => { if (a.t > (S.axes[bi] ? S.axes[bi].t : -1)) bi = i; });
    _radarSel = bi < 0 ? 0 : bi;
  }
  _radarReadout(S, ghost);

  const foot = document.getElementById('radarFoot');
  if (foot) {
    const parts = ['対象 ' + _fmtN(S.covered) + '問'];
    if (S.outside) parts.push('過去問・模試・必修などは科目が付かないため対象外 ' + _fmtN(S.outside) + '問');
    if (ghost) parts.push('点線は ' + ghost.age + '日前の自分');
    foot.textContent = parts.join(' / ');
  }
}

function _radarReadout(S, ghost) {
  const el = document.getElementById('radarReadout');
  if (!el) return;
  const a = S.axes[_radarSel];
  if (!a) { el.textContent = ''; return; }
  if (!a.measured) {
    el.className = 'rd-read rd-none';
    el.innerHTML = '<b>' + _noteEsc(a.full) + '</b> 未測定（試験モードで ' + _fmtN(a.t) + '問 / '
      + RADAR_MIN_N + '問から測ります）'
      + '<a class="rd-go" href="study.html?sid=' + encodeURIComponent(a.sids[0]) + '">解きに行く →</a>';
    return;
  }
  const gap = Math.round(a.gap);
  const cls = _radarGapCls(a.gap);
  let mv = '';
  if (ghost && ghost.ax[a.id]) {
    const d = Math.round(a.self - ghost.ax[a.id].self);
    if (Math.abs(d) >= 1) mv = '<em class="rd-mv ' + (d > 0 ? 'up' : 'dn') + '">'
      + ghost.age + '日前から ' + (d > 0 ? '+' : '') + d + 'pt</em>';
  }
  el.className = 'rd-read rd-' + cls;
  el.innerHTML = '<b>' + _noteEsc(a.full) + '</b> 自分 <b>' + Math.round(a.self) + '%</b>'
    + ' / 全国 ' + Math.round(a.nat) + '%'
    + '（<b>' + (gap > 0 ? '+' : '') + gap + 'pt</b>・' + _fmtN(a.t) + '問）' + mv
    + (a.worst ? '<a class="rd-go" href="study.html?sid=' + encodeURIComponent(a.worst.sid) + '">'
        + _noteEsc(_noteSubj(a.worst.sid).label) + ' →</a>' : '');
}

// 軸のタップ。⚠️ 再描画はしない（選択を変えるだけ）——描き直すと入場アニメが走り直す
function _radarPick(i) {
  if (!(i >= 0 && i < RADAR_AXES.length)) return;
  _radarSel = i;
  const svg = document.getElementById('radarSvg');
  if (svg) svg.querySelectorAll('.rd-lbl').forEach((t, k) => t.classList.toggle('rd-lbl-sel', k === i));
  // ⚠️ ここで数え直さないこと（_radarSnapshot は書き込みも行う）。描画時の集計を使い回す
  if (_radarLast) _radarReadout(_radarLast.S, _radarLast.ghost);
}
document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target.closest('[data-ax]') : null;
  if (t && t.ownerSVGElement && t.ownerSVGElement.id === 'radarSvg') _radarPick(+t.dataset.ax);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = document.activeElement;
  if (t && t.dataset && t.dataset.ax && t.ownerSVGElement && t.ownerSVGElement.id === 'radarSvg') {
    e.preventDefault(); _radarPick(+t.dataset.ax);
  }
});

// ── 📋 今日の所見 ─────────────────────────────────────────────
// 2026-09-12 に「🩺 臨床スキルプロファイル」（六角レーダー＋弱点探知ソナー）を置き換えたもの。
// 旧実装は6軸が全部「今日の正答率 × 固定係数 [1,1.06,.94,1.08,.92,1.04]」で、形が原理的に
// 変わらず科目のデータを1ビットも読んでいなかった＝毎日まったく同じ絵が出ていた。
// ここはその席に「その日のデータからしか作れない観察」を置く。
//
// ⚠️⚠️ 追加のファイル読み込みを1つも増やさないこと。材料は localStorage と、ハブが既に
//    読んでいる chapters_meta.js（MEC_CHAPTERS）/ mindmap_data/index.js（MM_SUBJECTS）だけ。
//    qmeta.json(564KB)・rate_index.js(98KB)・模試の解答表(107KB) をここへ持ち込むと
//    ハブを開くたびにその重さを払うことになる（全国正答率との比較は stats.html の
//    弱点カルテの担当で、ハブに劣化版を置かない）。
// ⚠️ 日境界は必ず JST（_jstDay）。attempts・activity_v1・ミッションと同じ切り方にする。
// ⚠️ 正誤が残るのは試験モード・SRS復習・章別試験だけ（通常モードの「済」は正誤を持たない）。
//    したがって通常モードだけで解いた日は正答率系の所見が出ない。これは仕様。

const NOTE_KEY  = 'mec_hub_notes_v1';  // ⚠️ UIローカル（非同期）。Gist の payload に足さないこと
const NOTE_SHOW = 3;                   // 一度に出す件数
const NOTE_KEEP = 30;                  // 「いつ出したか」を覚えておく日数

// 科目の表示名。正本は gamify.js の SUBJECTS（→ mindmap_data/index.js）。
// 過去問・実力試験Ⅰはそこに載らないのでここで補う。
const _NOTE_SUBJ = (function () {
  const m = {};
  (window.MM_SUBJECTS || []).forEach(s => { m[s.sid] = { label: s.label, icon: s.icon }; });
  m.kakumon = { label: '国試過去問', icon: '📖' };
  m.jitsu1  = { label: '実力試験Ⅰ', icon: '📝' };
  m.custom  = { label: '自作問題',   icon: '✏️' };
  m.memo    = { label: '暗記メモ',   icon: '📌' };
  return m;
})();

// uid → 科目id。jinzo_d_ch03_q136 のように prefix に '_' を含む科目があるので
// '_ch' の前までを取る（kakumon_116A_q12 だけ '_ch' を持たないので先に弾く）
function _noteSid(uid) {
  if (!uid) return '';
  if (uid.indexOf('kakumon_') === 0) return 'kakumon';
  const i = uid.indexOf('_ch');
  if (i > 0) return uid.slice(0, i);
  const j = uid.indexOf('_q');
  return j > 0 ? uid.slice(0, j) : uid;
}
function _noteSubj(sid) { return _NOTE_SUBJ[sid] || { label: sid, icon: '📘' }; }

// 'MEC内分泌代謝 第1章 内分泌代謝の基本 解答解説' → '第1章 内分泌代謝の基本'
// ⚠️ 末尾の「解答解説」を先に落とすこと（1つの正規表現に混ぜると章名の無い title で残る）
function _noteChTitle(title) {
  const t = String(title || '').replace(/\s*解答解説\s*$/, '').trim();
  const m = t.match(/(第\d+章.*)$/);
  return (m ? m[1] : t).trim();
}
function _noteEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function _noteDayDiff(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}
function _notePct(c, t) { return t > 0 ? Math.round(c / t * 100) : 0; }

// ── 材料を1回のパスで作る ────────────────────────────────────
function _noteFacts(td) {
  const now = Date.now();
  const today = _jstDay(now);
  const att = (window.MecAttempts && MecAttempts.all) ? MecAttempts.all() : [];
  // 生ログの上限からあふれて畳まれた分（progress.js の attCompact）。日別・科目別の解答数と正解数だけを持つ
  const roll = (window.MecAttempts && MecAttempts.roll) ? MecAttempts.roll() : {};

  const F = {
    today: today, now: now, n: att.length, days: 0,
    allT: 0, allC: 0, allPct: 0,
    bySid: {},                         // sid → {t,c, r7t,r7c, p7t,p7c, last}
    sess: {},                          // sess → {t,c,last,sid:{}}
    half: { ft: 0, fc: 0, lt: 0, lc: 0 },
    fast: { t: 0, c: 0 }, slowWrong: {},
    night: { t: 0, c: 0 }, day: { t: 0, c: 0 },
    redo: { t: 0, c: 0 },
    byDay: {},
  };
  if (!att.length && !Object.keys(roll).length) return F;

  const d7 = now - 7 * 86400000, d14 = now - 14 * 86400000;

  // セッション長は「そのセッションの最大 n」。前半／後半の境目に要る
  const sessLen = {};
  att.forEach(a => {
    if (!a.sess) return;
    if (!sessLen[a.sess] || a.n > sessLen[a.sess]) sessLen[a.sess] = a.n;
  });

  const everWrong = Object.create(null);
  att.forEach(a => {
    const sid = _noteSid(a.uid);
    const day = _jstDay(a.ms);
    F.allT++; if (a.ok) F.allC++;

    const D = F.byDay[day] || (F.byDay[day] = { t: 0, c: 0 });
    D.t++; if (a.ok) D.c++;

    const S = F.bySid[sid] || (F.bySid[sid] = { t: 0, c: 0, r7t: 0, r7c: 0, p7t: 0, p7c: 0, last: 0 });
    S.t++; if (a.ok) S.c++;
    if (a.ms > S.last) S.last = a.ms;
    if (a.ms >= d7)       { S.r7t++; if (a.ok) S.r7c++; }
    else if (a.ms >= d14) { S.p7t++; if (a.ok) S.p7c++; }

    if (a.sess) {
      const E = F.sess[a.sess] || (F.sess[a.sess] = { t: 0, c: 0, last: 0, sid: {} });
      E.t++; if (a.ok) E.c++;
      if (a.ms > E.last) E.last = a.ms;
      E.sid[sid] = (E.sid[sid] || 0) + 1;
      // 20問以上のセッションだけ「前半／後半」を測る（短いセッションでは意味を持たない）
      const len = sessLen[a.sess] || 0;
      if (len >= 20 && a.n > 0) {
        if (a.n <= len / 2) { F.half.ft++; if (a.ok) F.half.fc++; }
        else                { F.half.lt++; if (a.ok) F.half.lc++; }
      }
    }

    if (a.sec !== null && a.sec !== undefined) {
      if (a.sec < 5) { F.fast.t++; if (a.ok) F.fast.c++; }
      if (a.sec >= 60 && !a.ok) F.slowWrong[sid] = (F.slowWrong[sid] || 0) + 1;
    }

    const h = new Date(a.ms + 9 * 3600000).getUTCHours();   // JSTの時刻
    if (h >= 22 || h < 4)      { F.night.t++; if (a.ok) F.night.c++; }
    else if (h >= 9 && h < 18) { F.day.t++;   if (a.ok) F.day.c++; }

    // 一度落とした問題の解き直し（直近7日ぶんだけ数える）
    if (everWrong[a.uid] && a.ms >= d7) { F.redo.t++; if (a.ok) F.redo.c++; }
    if (!a.ok) everWrong[a.uid] = 1;
  });

  // 畳まれた分を日別・科目別（直近7日／その前7日）・セッションへ足す。
  // ⚠️ 前半後半・5秒未満・60秒以上・時刻帯・解き直しは集計に無い＝生ログに残る数日分だけで判定する。
  const d7day = _jstDay(d7), d14day = _jstDay(d14);
  for (const k in roll) {
    const R = roll[k];
    if (!R || !R.d) continue;
    const E = (k.charAt(0) !== '~') ? (F.sess[k] || (F.sess[k] = { t: 0, c: 0, last: 0, sid: {} })) : null;
    if (E && (R.l || 0) * 60000 > E.last) E.last = (R.l || 0) * 60000;
    for (const day in R.d) {
      for (const sid in R.d[day]) {
        const c = R.d[day][sid] || [], t = c[0] || 0, ok = c[1] || 0;
        if (!t) continue;
        F.n += t;
        F.allT += t; F.allC += ok;
        const D = F.byDay[day] || (F.byDay[day] = { t: 0, c: 0 });
        D.t += t; D.c += ok;
        const S = F.bySid[sid] || (F.bySid[sid] = { t: 0, c: 0, r7t: 0, r7c: 0, p7t: 0, p7c: 0, last: 0 });
        S.t += t; S.c += ok;
        const dayMs = Date.parse(day + 'T00:00:00Z') - 9 * 3600000;
        if (dayMs > S.last) S.last = dayMs;
        if (day >= d7day)       { S.r7t += t; S.r7c += ok; }
        else if (day >= d14day) { S.p7t += t; S.p7c += ok; }
        if (E) { E.t += t; E.c += ok; E.sid[sid] = (E.sid[sid] || 0) + t; }
      }
    }
  }

  F.days = Object.keys(F.byDay).length;
  F.allPct = _notePct(F.allC, F.allT);
  return F;
}

// 章ごとの「あと何問」と科目ごとの済数。done_v2 は1回のパスで畳む
// （218章それぞれで done_v2 を走査すると 218×|done| になる）
function _noteChapterFacts() {
  let done = {};
  try { done = JSON.parse(localStorage.getItem('done_v2') || '{}'); } catch (e) {}
  const byCh = Object.create(null), bySid = Object.create(null);
  for (const uid in done) {
    if (!(done[uid] > 0)) continue;
    const j = uid.indexOf('_q');
    if (j > 0) byCh[uid.slice(0, j)] = (byCh[uid.slice(0, j)] || 0) + 1;
    const sid = _noteSid(uid);
    bySid[sid] = (bySid[sid] || 0) + 1;
  }
  const near = [];
  const sidTotal = Object.create(null);
  (typeof MEC_CHAPTERS !== 'undefined' ? MEC_CHAPTERS : []).forEach(s => {
    (s.chapters || []).forEach(ch => {
      const cnt = ch.count || 0;
      sidTotal[s.id] = (sidTotal[s.id] || 0) + cnt;
      const dn = byCh[ch.prefix] || 0;
      const left = cnt - dn;
      // ⚠️ 「半分以上やった章」だけを候補にする。left <= 15 だけで拾うと、
      //    1問も手を付けていない小さい章（count <= 15）が「あと N問で終わる」に化ける。
      if (cnt > 0 && left >= 1 && left <= 15 && dn / cnt >= 0.5) {
        near.push({ sid: s.id, subj: s.name, title: _noteChTitle(ch.title), left: left, cnt: cnt });
      }
    });
  });
  // 残りが少ない順。同数なら大きい章を先に（片付く量が多い方が嬉しい）
  near.sort((a, b) => a.left - b.left || b.cnt - a.cnt);
  return { near: near, doneBySid: bySid, totalBySid: sidTotal };
}

function _noteSrsFacts() {
  const out = { overdue: 0, oldest: 0, tomorrow: 0, mature: 0 };
  try {
    const today = _jstDay(Date.now());
    const tmr = _jstDay(Date.now() + 86400000);
    const srs = JSON.parse(localStorage.getItem('mec_srs_v1') || '{}');
    for (const uid in srs) {
      const e = srs[uid]; if (!e || !e.nextReview) continue;
      if ((window.MECSync && MECSync.srsIsShadow && MECSync.srsIsShadow(uid))) continue;   // 重複コピーは代表だけ
      if (e.nextReview < today) {
        out.overdue++;
        const late = _noteDayDiff(e.nextReview, today);
        if (late > out.oldest) out.oldest = late;
      }
      if (e.nextReview === tmr) out.tomorrow++;
      if ((e.interval || 0) >= 30) out.mature++;
    }
  } catch (e) {}
  return out;
}

// ── 所見の候補を作る ─────────────────────────────────────────
// 1件 = { id, w(重み), tone, ic, tx(HTML), href, cta }
// ⚠️ 出す条件には必ず最低件数（n）を置くこと。3回中0回のような小さい分母から「傾向」を
//    名指しすると、偶然を指摘として読ませることになる。
function _buildHubNotes(td, due, streak, F, CH, S) {
  F  = F  || _noteFacts(td);
  CH = CH || _noteChapterFacts();
  S  = S  || _noteSrsFacts();
  const out = [];
  const add = (id, w, tone, ic, tx, href, cta) =>
    out.push({ id: id, w: w, tone: tone, ic: ic, tx: tx, href: href || '', cta: cta || '' });

  // 通算の正答率。attempts は直近5000件で切れるので、生涯値は myrate_v1 を使う
  let baseT = F.allT, baseC = F.allC;
  try {
    const mr = JSON.parse(localStorage.getItem('myrate_v1') || '{}');
    let t = 0, c = 0;
    for (const uid in mr) { t += (mr[uid].total || 0); c += (mr[uid].correct || 0); }
    if (t >= baseT) { baseT = t; baseC = c; }
  } catch (e) {}
  const basePct = _notePct(baseC, baseT);

  // ① 今日まだ0問 — その日いちばん行動につながる1行なので重みを高くする
  if ((td.solved || 0) === 0) {
    add('zero', 40, 'info', '🕗',
      due > 0
        ? '今日はまだ0問。復習が <b>' + _fmtN(due) + '問</b>たまっている。<i>ここから始めるのがいちばん速い</i>'
        : '今日はまだ0問。<i>1科目ひらくところから</i>',
      due > 0 ? 'study.html?mode=srs_review' : 'study.html',
      due > 0 ? '復習へ' : '科目を選ぶ');
  }

  // ② 今日の正答率（自己ベスト / 通算との差）
  if (td.exT >= 20) {
    const tp = td.accPct || 0;
    let best = true, cmp = 0;
    for (const d in F.byDay) {
      if (d === F.today) continue;
      if (_noteDayDiff(d, F.today) > 14) continue;
      const x = F.byDay[d];
      if (x.t >= 20) { cmp++; if (_notePct(x.c, x.t) >= tp) best = false; }
    }
    if (best && cmp >= 2) {
      add('best', 32, 'good', '🏅',
        '今日の正答率 <b>' + tp + '%</b> は直近14日で最も高い（' + td.exC + '/' + td.exT + '問）。<i>今日の解き方は合っている</i>');
    } else if (basePct > 0 && tp - basePct >= 8) {
      add('todayup', 24, 'good', '📈',
        '今日の正答率 <b>' + tp + '%</b> は通算より <b>+' + (tp - basePct) + 'pt</b>。<i>調子がいい</i>');
    } else if (basePct > 0 && basePct - tp >= 12) {
      add('todaydown', 22, 'warn', '📉',
        '今日の正答率 <b>' + tp + '%</b> は通算より <b>-' + (basePct - tp) + 'pt</b>。<i>難しい範囲に入っている合図でもある</i>');
    }
  }

  // ③ 直近セッションの手応え
  {
    let key = '', bestMs = 0;
    for (const k in F.sess) {
      const e = F.sess[k];
      if (e.t >= 10 && e.last > bestMs) { bestMs = e.last; key = k; }
    }
    if (key) {
      const e = F.sess[key];
      let sid = '', mx = 0;
      for (const s in e.sid) if (e.sid[s] > mx) { mx = e.sid[s]; sid = s; }
      const sj = _noteSubj(sid), p = _notePct(e.c, e.t), d = p - basePct;
      const ago = _noteDayDiff(_jstDay(e.last), F.today);
      const when = ago === 0 ? '今日' : ago === 1 ? '昨日' : ago + '日前';
      add('lastsess', 18, d >= 5 ? 'good' : d <= -5 ? 'warn' : 'info', sj.icon,
        when + 'の' + _noteEsc(sj.label) + 'のセッションは <b>' + e.t + '問</b>・正答率 <b>' + p + '%</b>'
          + (basePct > 0 ? '（通算 ' + basePct + '% より ' + (d >= 0 ? '+' : '') + d + 'pt）' : ''),
        'study.html?sid=' + encodeURIComponent(sid), _noteEsc(sj.label));
    }
  }

  // ④ セッション後半の失速 ／ 持続
  if (F.half.ft >= 40 && F.half.lt >= 40) {
    const a = _notePct(F.half.fc, F.half.ft), b = _notePct(F.half.lc, F.half.lt), d = b - a;
    if (d <= -8) {
      add('fade', 28, 'warn', '⏳',
        'セッション後半で正答率が <b>' + (-d) + 'pt</b> 落ちる（前半 ' + a + '% → 後半 ' + b + '%）。<i>25問前後で区切ると取りこぼしが減る</i>');
    } else if (d >= 5) {
      add('hold', 18, 'good', '🔋',
        'セッション後半でも正答率が <b>+' + d + 'pt</b>（前半 ' + a + '% → 後半 ' + b + '%）。<i>最後まで集中が切れていない</i>');
    }
  }

  // ⑤ 読み飛ばし（5秒未満の解答）
  if (F.fast.t >= 10 && baseT > 0) {
    const fp = _notePct(F.fast.c, F.fast.t), d = basePct - fp;
    if (d >= 12) {
      add('hasty', 26, 'warn', '⚡',
        '5秒未満で答えた <b>' + F.fast.t + '問</b>のうち <b>' + (F.fast.t - F.fast.c) + '問</b>が誤答（全体より <b>' + d + 'pt</b> 低い）。<i>読み飛ばしのサイン</i>');
    } else if (F.fast.t >= 20 && fp - basePct >= 5) {
      add('quick', 16, 'good', '⚡',
        '5秒未満で答えた <b>' + F.fast.t + '問</b>の正答率が <b>' + fp + '%</b>。<i>即答できる範囲が増えている</i>');
    }
  }

  // ⑥ 長考しても落とす科目＝知識の穴
  {
    let sid = '', n = 0;
    for (const s in F.slowWrong) if (F.slowWrong[s] > n) { n = F.slowWrong[s]; sid = s; }
    if (n >= 5) {
      const sj = _noteSubj(sid);
      add('ponder', 22, 'warn', '🕰',
        '60秒以上考えて落とした問題が' + _noteEsc(sj.label) + 'に <b>' + n + '問</b>。<i>迷いではなく知識の穴</i>',
        'study.html?sid=' + encodeURIComponent(sid), _noteEsc(sj.label));
    }
  }

  // ⑦ 科目の伸び／落ち（直近7日 vs その前の7日）
  {
    let up = null, down = null;
    for (const sid in F.bySid) {
      const X = F.bySid[sid];
      if (X.r7t < 10 || X.p7t < 10) continue;
      const a = _notePct(X.p7c, X.p7t), b = _notePct(X.r7c, X.r7t), d = b - a;
      if (d >= 8 && (!up || d > up.d)) up = { sid: sid, a: a, b: b, d: d };
      if (d <= -8 && (!down || d < down.d)) down = { sid: sid, a: a, b: b, d: d };
    }
    if (up) {
      const sj = _noteSubj(up.sid);
      add('subjup', 28, 'good', sj.icon,
        _noteEsc(sj.label) + 'が直近7日で <b>+' + up.d + 'pt</b>（' + up.a + '% → ' + up.b + '%）。<i>効いている</i>',
        'study.html?sid=' + encodeURIComponent(up.sid), _noteEsc(sj.label));
    }
    if (down) {
      const sj = _noteSubj(down.sid);
      add('subjdown', 28, 'warn', sj.icon,
        _noteEsc(sj.label) + 'が直近7日で <b>-' + (-down.d) + 'pt</b>（' + down.a + '% → ' + down.b + '%）。<i>手を入れ直す価値がある</i>',
        'study.html?sid=' + encodeURIComponent(down.sid), _noteEsc(sj.label));
    }
  }

  // ⑧ あと少しで終わる章
  if (CH.near.length) {
    const c = CH.near[0];
    add('chnear', 25, 'good', '🏁',
      'あと <b>' + c.left + '問</b>で『' + _noteEsc(c.subj) + ' ' + _noteEsc(c.title) + '』が終わる',
      'study.html?sid=' + encodeURIComponent(c.sid), _noteEsc(c.subj));
  }

  // ⑨ 復習の期限切れ
  if (S.overdue >= 10) {
    add('overdue', S.overdue >= 50 ? 30 : 20, S.overdue >= 50 ? 'bad' : 'warn', '⏰',
      '復習の期限切れが <b>' + _fmtN(S.overdue) + '問</b>。最も古いのは <b>' + S.oldest + '日前</b>の予定。<i>待たされた順に出る</i>',
      'study.html?mode=srs_review', '復習へ');
  }

  // ⑩ 明日の予告
  if (S.tomorrow >= 1) {
    add('tomorrow', 12, 'info', '📅', '明日は <b>' + _fmtN(S.tomorrow) + '問</b>が復習に戻ってくる');
  }

  // ⑪ 定着した札
  if (S.mature >= 20) {
    add('mature', 16, 'good', '🌱',
      '復習間隔が30日以上に育った問題が <b>' + _fmtN(S.mature) + '問</b>。<i>ここはもう手が離れている</i>');
  }

  // ⑫ 解き直しの成否（一度落とした問題に戻れているか）
  if (F.redo.t >= 8) {
    const p = _notePct(F.redo.c, F.redo.t);
    if (p >= 60) {
      add('redoup', 24, 'good', '🔁',
        '一度落とした問題の解き直しで <b>' + F.redo.c + '/' + F.redo.t + '</b>（' + p + '%）正解。<i>潰せている</i>');
    } else if (p < 40) {
      add('redodown', 26, 'warn', '🔁',
        '一度落とした問題の解き直しが <b>' + F.redo.c + '/' + F.redo.t + '</b>（' + p + '%）。<i>同じところで止まっている</i>');
    }
  }

  // ⑬ しばらく触っていない科目
  {
    let sid = '', oldest = 0;
    for (const s in F.bySid) {
      if (s === 'custom' || s === 'memo') continue;
      const tot = CH.totalBySid[s] || 0, dn = CH.doneBySid[s] || 0;
      if (tot > 0 && dn / tot >= 0.8) continue;      // ほぼ終わっている科目は「放置」ではない
      const d = _noteDayDiff(_jstDay(F.bySid[s].last), F.today);
      if (d >= 14 && d > oldest) { oldest = d; sid = s; }
    }
    if (sid) {
      const sj = _noteSubj(sid), tot = CH.totalBySid[sid] || 0, dn = CH.doneBySid[sid] || 0;
      add('stale', 20, 'info', sj.icon,
        _noteEsc(sj.label) + 'を <b>' + oldest + '日</b>触っていない' + (tot ? '（済 ' + _notePct(dn, tot) + '%）' : ''),
        'study.html?sid=' + encodeURIComponent(sid), _noteEsc(sj.label));
    }
  }

  // ⑭ 時間帯
  if (F.night.t >= 30 && F.day.t >= 30) {
    const nn = _notePct(F.night.c, F.night.t), dd = _notePct(F.day.c, F.day.t);
    if (dd - nn >= 8) {
      add('night', 18, 'info', '🌙',
        '22時以降の正答率は日中より <b>' + (dd - nn) + 'pt</b> 低い（夜 ' + nn + '% / 日中 ' + dd + '%）');
    } else if (nn - dd >= 8) {
      add('owl', 14, 'good', '🌙',
        '22時以降の正答率が日中より <b>+' + (nn - dd) + 'pt</b>（夜 ' + nn + '% / 日中 ' + dd + '%）。<i>夜が合っている</i>');
    }
  }

  // ⑮ 同じ誤答肢を繰り返している
  try {
    const ch = JSON.parse(localStorage.getItem('mec_choice_v1') || '{}');
    let n = 0;
    for (const uid in ch) {
      const e = ch[uid]; if (!e) continue;
      for (const k in e) { if (k === '_last') continue; if ((e[k] || 0) >= 2) { n++; break; } }
    }
    if (n >= 3) {
      add('samepick', 22, 'warn', '🎯',
        '同じ誤答肢を2回以上選んだ問題が <b>' + _fmtN(n) + '問</b>。<i>覚え違いが固定している</i>');
    }
  } catch (e) {}

  // ⑯ 連続日数の節目
  {
    const MS = [7, 14, 30, 50, 100, 200, 365];
    if (MS.indexOf(streak) >= 0) {
      add('streakhit', 34, 'good', '🔥', '<b>' + streak + '日</b>連続を達成。<i>途切れさせない</i>');
    } else if (streak > 0) {
      let nx = 0;
      for (let i = 0; i < MS.length; i++) if (MS[i] > streak) { nx = MS[i]; break; }
      if (nx && nx - streak <= 2) {
        add('streaknear', 26, 'good', '🔥', 'あと <b>' + (nx - streak) + '日</b>で <b>' + nx + '日</b>連続');
      }
    }
  }

  return out;
}

// ── 出す3件を選ぶ ────────────────────────────────────────────
// ⚠️ 同じ日のうちは並びを動かさないこと。renderHero() は同期完了のたびに走るので、
//    毎回選び直すと読んでいる途中で所見が入れ替わる。
// ⚠️ 一度出した所見は数日ぶん重みを下げる＝日替わりはここで担保する（乱数は使わない。
//    使うと同じ日に開き直すたびに並びが変わる）。
function _pickHubNotes(cands, today) {
  let memo = {};
  try { memo = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}'); } catch (e) {}
  const seen = memo.seen || {};
  const todays = (memo.day === today && Array.isArray(memo.ids)) ? memo.ids : [];

  cands.forEach(c => {
    let s = c.w;
    if (todays.indexOf(c.id) >= 0) s += 30;
    else if (seen[c.id]) {
      const d = _noteDayDiff(seen[c.id], today);
      if (d <= 1) s -= 40; else if (d <= 3) s -= 15;
    }
    c._s = s;
  });
  cands.sort((a, b) => b._s - a._s || (a.id < b.id ? -1 : 1));
  const out = cands.slice(0, NOTE_SHOW);

  // 明るい所見と指摘を必ず混ぜる（ユーザーの選択:「励ましも混ぜる」）。
  // 片側しか候補が無い日はそのまま＝無い所見を作らない。
  const isUp = n => n.tone === 'good';
  const isDown = n => n.tone === 'warn' || n.tone === 'bad';
  if (out.length >= 2) {
    if (!out.some(isUp)) {
      const up = cands.find(c => isUp(c) && out.indexOf(c) < 0);
      if (up) out[out.length - 1] = up;
    } else if (!out.some(isDown)) {
      const dn = cands.find(c => isDown(c) && out.indexOf(c) < 0);
      if (dn) out[out.length - 1] = dn;
    }
  }

  const nseen = {};
  for (const k in seen) if (_noteDayDiff(seen[k], today) <= NOTE_KEEP) nseen[k] = seen[k];
  out.forEach(o => { nseen[o.id] = today; });
  try {
    localStorage.setItem(NOTE_KEY, JSON.stringify({ day: today, ids: out.map(o => o.id), seen: nseen }));
  } catch (e) {}
  return out;
}

// ── 待機列の演出（2026-10-01・デモ _work/protocol_fx_demo.html の A・C・D 案）──────────
//   A 起動シーケンス：ページを開いて最初に描いたとき、待機列が一回きり（約1.6秒）で組み上がる。
//   D 前回からの差分：数字が前回と違うときは、A の代わりに前回の値から今の値へ動かす
//     （起点は「前回ハブを離れたときの数字」＝試験から戻ってきたとき／2回目以降の描き直しでは画面に出ていた数字）。
//   C 状態に応じた警報：最初に描いたときだけ、超危険＞期限切れ＞本日 の強さで回数の決まった脈を打つ。
// ⚠️ 常時アニメにしない（どれも数秒で止まり、クラスも外す）。
// ⚠️ 中身が同じなら書き換えない（renderHero は同期完了のたびに走る＝書き換えると演出が毎回走り直す）。
// ⚠️ 前回の値は UIローカルの mec_hub_since_v1（同期しない）に、ページを離れる・裏へ回る瞬間だけ書く。
//    開いた瞬間・renderHero の中で書かないこと（同期のたびに差分が0に戻る）。前回が今日でなければ使わない。
const K_HUB_SINCE = 'mec_hub_since_v1';
let _sayPrev = null;
try {
  const v = JSON.parse(localStorage.getItem(K_HUB_SINCE) || 'null');
  if (v && v.day === _jstDay(Date.now()) && v.k) _sayPrev = v;
} catch (e) {}
// 待機列の数字。data-k＝数字（カウントで動かす）／data-sk＝長さ（CSS の transition で動かす）
function _sfx(k, v) { return '<span class="sfx" data-k="' + k + '" data-v="' + v + '">' + _fmtN(v) + '</span>'; }
function _skGet(e) {
  if (e.tagName.toLowerCase() === 'circle') return Number(e.getAttribute('stroke-dashoffset')) || 0;
  if (e.style.flexGrow !== '') return Number(e.style.flexGrow) || 0;
  return parseFloat(e.style.width) || 0;
}
function _skSet(e, v) {
  if (e.tagName.toLowerCase() === 'circle') e.setAttribute('stroke-dashoffset', String(v));
  else if (e.style.flexGrow !== '') e.style.flexGrow = String(v);
  else e.style.width = v + '%';
}
function _sayRead(host) {
  const k = {}, sk = {};
  host.querySelectorAll('[data-k]').forEach(e => { k[e.dataset.k] = Number(e.dataset.v); });
  host.querySelectorAll('[data-sk]').forEach(e => { sk[e.dataset.sk] = _skGet(e); });
  return { k, sk };
}
function _saveSince() {
  const say = document.getElementById('heroSay');
  if (!say || !say.querySelector('[data-k]')) return;
  const snap = Object.assign({ day: _jstDay(Date.now()), t: Date.now() }, _sayRead(say));
  try { localStorage.setItem(K_HUB_SINCE, JSON.stringify(snap)); } catch (e) {}
}
if (typeof document.addEventListener === 'function') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') _saveSince();
});
if (typeof window.addEventListener === 'function') window.addEventListener('pagehide', _saveSince);

// 次の描画の後で一度だけ（非表示タブでは rAF が来ないので setTimeout の落とし所を添える）
function _afterPaint(fn) {
  let ran = false;
  const go = () => { if (!ran) { ran = true; fn(); } };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 120);
}
// 増減の札（＋N／−N）。数字の上に浮いて消える
const SAY_CHIP = { done: 1, due: -1, today0: -1 };   // 1＝増えてうれしい／−1＝減ってうれしい
function _sayChip(e, d, good) {
  const c = document.createElement('span');
  c.className = 'sfx-chip ' + (good ? 'is-good' : 'is-bad');
  c.setAttribute('aria-hidden', 'true');
  c.textContent = (d > 0 ? '+' : '−') + _fmtN(Math.abs(d));
  e.appendChild(c);
  setTimeout(() => c.remove(), 1700);
}
// D：from（数字と長さ）から今の値へ。動いたものが1つでもあれば true
function _sayMorph(say, from) {
  let changed = false;
  say.querySelectorAll('[data-k]').forEach(e => {
    const k = e.dataset.k, to = Number(e.dataset.v);
    if (!(k in from.k) || from.k[k] === to) return;
    changed = true;
    e.textContent = _fmtN(from.k[k]);
    e.classList.add('is-changed');
    _tweenNum(e, to, 900);
    if (SAY_CHIP[k]) _sayChip(e, to - from.k[k], (to - from.k[k]) * SAY_CHIP[k] > 0);
  });
  const moves = [];
  say.querySelectorAll('[data-sk]').forEach(e => {
    const k = e.dataset.sk;
    if (!(k in from.sk)) return;
    const to = _skGet(e), was = from.sk[k];
    if (Math.abs(to - was) < 0.01) return;
    changed = true;
    _skSet(e, was);
    moves.push([e, to]);
    // 科目の横棒が縮んだぶんは水色の残像にして消す（どれだけ減ったかが目に残る）
    if (k.indexOf('sv-') === 0 && was > to && e.parentNode) {
      const g = document.createElement('span');
      g.className = 'sv-ghost';
      g.style.left = to + '%'; g.style.width = (was - to) + '%';
      e.parentNode.appendChild(g);
      setTimeout(() => g.remove(), 1500);
    }
  });
  if (moves.length) _afterPaint(() => moves.forEach(([e, to]) => _skSet(e, to)));
  return changed;
}
let _sayLast = '', _sayFirst = true, _sayTimers = [];
const SAY_FX_CLASSES = ['srs-intro', 'srs-alarm', 'lv-alarm', 'lv-caution', 'lv-calm'];
// level: 'alarm'（超危険あり）／'caution'（期限切れのみ）／'calm'（本日分のみ）／''（復習待ち0）
function _paintSay(say, level, html) {
  if (html === _sayLast) return;
  const first = _sayFirst;
  const from = first ? _sayPrev : (_sayLast ? _sayRead(say) : null);
  _sayFirst = false; _sayLast = html;
  _sayTimers.forEach(clearTimeout); _sayTimers = [];
  SAY_FX_CLASSES.forEach(c => say.classList.remove(c));
  say.innerHTML = html;
  const changed = from ? _sayMorph(say, from) : false;
  if (!first) return;
  let lead = 1500;
  if (!changed) {
    // A：数字は0から数え上げ、図はCSSで組み上げる。終わったらクラスを外す（次の描き直しで走り直さないように）
    say.classList.add('srs-intro');
    say.querySelectorAll('[data-k]').forEach(e => { e.textContent = '0'; });
    _sayTimers.push(setTimeout(() => say.querySelectorAll('[data-k]').forEach(e => _tweenNum(e, Number(e.dataset.v), 1000)), 250));
    _sayTimers.push(setTimeout(() => say.classList.remove('srs-intro'), 2000));
    lead = 1700;
  }
  if (level) {
    _sayTimers.push(setTimeout(() => say.classList.add('srs-alarm', 'lv-' + level), lead));
    _sayTimers.push(setTimeout(() => say.classList.remove('srs-alarm', 'lv-' + level), lead + 3600));
  }
}

let _noteLastHtml = '';
function _renderHubNotes(td, due, streak) {
  const host = document.getElementById('hubNoteList');
  if (!host) return;
  let picks = [], F = null;
  try {
    F = _noteFacts(td);
    picks = _pickHubNotes(_buildHubNotes(td, due, streak, F), _jstDay(Date.now()));
  } catch (e) { picks = []; }

  let html;
  if (picks.length) {
    html = picks.map((p, i) =>
      '<li class="note-item tone-' + p.tone + '" style="--i:' + i + '">'
        + '<span class="note-ic" aria-hidden="true">' + p.ic + '</span>'
        + '<span class="note-tx">' + p.tx + '</span>'
        + (p.href ? '<a class="note-go" href="' + p.href + '">' + p.cta + ' →</a>' : '')
      + '</li>').join('');
  } else {
    html = '<li class="note-empty">まだ所見が出せません。<b>試験モード</b>で解くと、'
         + '所要時間・出題順・誤答の傾向が記録され、翌日からここに出ます。</li>';
  }
  // ⚠️ 中身が同じなら書き換えないこと。renderHero() は同期完了のたびに走るので、
  //    毎回 innerHTML を差し替えると入場アニメが何度も走り直す。
  if (html !== _noteLastHtml) { host.innerHTML = html; _noteLastHtml = html; }

  const basis = document.getElementById('hubNoteBasis');
  if (basis) {
    basis.textContent = (F && F.n)
      ? '直近 ' + _fmtN(F.n) + '解答 / ' + F.days + '日ぶんの記録から'
      : '記録なし';
  }
}

function renderHero() {
  // 分子は calcTotalQ と同じスコープで数える（custom_ / memo_ は分母に無いので除外）
  const doneCount = calcDoneInScope();
  const totalQ = calcTotalQ();
  const streak = window.MECSync ? MECSync.calcStreak() : 0;
  const due = getSRSDueCount();
  const pct = totalQ ? Math.round(doneCount / totalQ * 100) : 0;

  const td = getTodayLearning();

  const say   = document.getElementById('heroSay');
  const p1    = document.getElementById('heroPrimary');
  const p2    = document.getElementById('heroSecondary');
  const p3    = document.getElementById('heroTertiary');

  // 大きな読み値は常に「今日どれだけやったか」。何をすべきかは主ボタンと計器行が担う。
  // 見出し（今日解いた問題・正解率）は 2026-10-01 に撤去し、日付と国試までの日数はヘッダーへ移した。
  // 日付は ⚠️ 端末のローカル日付ではなく JST で切ること
  //    （activity_v1・ミッション・attempts と同じ日境界＝数字と日付が食い違わない）
  const dateEl = document.getElementById('heroDate');
  if (dateEl) dateEl.textContent = _todayLabelJa();
  document.getElementById('heroUnit').textContent = '問';
  document.getElementById('heroXp').textContent = '+' + _fmtN(td.xp);


  const srsDoneToday = td.srsDone || 0;
  // 1日の復習目標。2026-09-27 に実データ（SRS 6,555件）で study.html の _updateSRS を仮想時計で
  // 試験日まで回して決めた: 1日150件ではどの設定でも試験日の平均想起が80%に届かず、200件＋
  // SRS_EXAM_FRACTION 0.8 で約86%（想起80%未満0件）。⚠️ 残りの復習待ちより大きい目標は出さない
  // （待ちが30件の日に「/ 200」と出すと、終わっているのに未達に見える）。
  const srsGoal = Math.min(SRS_DAILY_TARGET, srsDoneToday + due);
  const srsGoalHtml = srsGoal > 0
    ? '<span class="srs-goal">/ ' + _fmtN(srsGoal) + '</span>' + (srsDoneToday >= srsGoal ? '<span class="srs-goal-ok" aria-label="目標達成">✓</span>' : '')
    : '';
  const sessionLimit = getSrsSessionLimit();
  const sessionCount = Math.min(due, sessionLimit);
  // 新しく覚える問題の上限（正本は progress.js の MECSync.srsNewBudget・study.html の _updateSRS と同じ値）
  let newBudgetHtml = '';
  try {
    const nb = window.MECSync && MECSync.srsNewBudget ? MECSync.srsNewBudget() : null;
    if (nb) newBudgetHtml = '<div class="srs-card-new' + (nb.left <= 0 ? ' is-full' : '') + '" title="復習待ちが多い日は新しく覚える問題の上限が下がる（上限を超えた新規は誤答だけ復習予定に入る）">新規 <b>' + _fmtN(nb.newToday) + '</b><span class="srs-goal">/ ' + _fmtN(nb.cap) + '</span>問</div>';
  } catch (e) {}

  const fc = getSrsForecast(14);
  // 今日の復習の結果と定着までの道のり（day_progress.js）。SRS の札は1回だけ読んで両方に渡す。
  let dp = null;
  if (window.MecDay) {
    try { const srs = JSON.parse(localStorage.getItem('mec_srs_v1') || '{}') || {}; dp = { res: MecDay.srsResult(MecDay.todayRows(), srs), st: MecDay.srsStages(srs) }; } catch (e) {}
  }
  if (due > 0) {
    const risk = getSrsRiskBreakdown(sessionLimit);
    say.classList.remove('is-clear');
    _paintSay(say, risk.high > 0 ? 'alarm' : risk.mid > 0 ? 'caution' : 'calm',
      // 意匠の内枠。中身を持たない飾りなので aria からは外す（読み上げに乗せない）
      '<span class="srs-deco" aria-hidden="true"></span>' +
      '<div class="srs-card-hdr">' +
        '<div class="srs-card-title-grp">' +
          '<span class="srs-card-ttl"><span class="srs-ttl-ic">♾️</span>プロトコル待機列</span>' +
          '<span class="srs-tag srs-tag-cross">科目横断</span>' +
          '<span class="srs-tag srs-tag-risk">忘却リスク順</span>' +
        '</div>' +
        '<div class="srs-card-counts">' +
          '<div class="srs-card-today">本日消化 <b>' + _sfx('done', srsDoneToday) + '</b>' + srsGoalHtml + '問</div>' +
          newBudgetHtml +
        '</div>' +
      '</div>' +
      '<div class="srs-card-stat">' +
        '<div class="srs-stat-cell">' +
          '<span class="srs-stat-lbl">復習待ち</span>' +
          '<span class="srs-stat-val"><b>' + _sfx('due', due) + '</b><small>問</small></span>' +
        '</div>' +
        '<span class="srs-stat-sep" aria-hidden="true">➔</span>' +
        '<div class="srs-stat-cell highlight">' +
          '<span class="srs-stat-lbl">今回の出題</span>' +
          '<span class="srs-stat-val"><b>優先 ' + _sfx('session', sessionCount) + '</b><small>問</small></span>' +
        '</div>' +
        // 「今回の出題」と「忘却リスク内訳」の間の空き（2026-10-01 ユーザー指摘）に、数え方が見てすぐ分かる数字だけを置く:
        //   終わると残り＝復習待ち − 今回の出題／目標まで＝今日の復習目標までの残り／最大の遅れ＝いちばん長く放置している問題の遅れ日数。
        // ⚠️ 推定値（所要時間の見込み等）は置かない（2026-10-01「算出法が謎」で撤去）。
        // ⚠️ 1行死守の行なので、狭い画面（≤560px）では .srs-stat-extra ごと隠す（index.css）。
        '<span class="srs-stat-sep srs-stat-extra" aria-hidden="true">➔</span>' +
        '<div class="srs-stat-cell srs-stat-extra" title="今回の' + _fmtN(sessionCount) + '問を終えたあとに残る復習待ち（復習待ち − 今回の出題）">' +
          '<span class="srs-stat-lbl">終わると残り</span>' +
          '<span class="srs-stat-val"><b>' + _sfx('rest', due - sessionCount) + '</b><small>問</small></span>' +
        '</div>' +
        '<span class="srs-stat-divider srs-stat-extra" aria-hidden="true"></span>' +
        // 「明日の予定」は 2026-10-01 に撤去（目標 200 と並ぶと「明日は115問しかやらない」と読めて紛らわしい）。
        // 代わりに今日の目標までの残り（上の「本日消化 N / 目標」と同じ数から引くだけ）。
        '<div class="srs-stat-cell srs-stat-extra' + (srsGoal > 0 && srsDoneToday >= srsGoal ? ' is-ok' : '') + '" title="今日の復習目標（' + _fmtN(srsGoal) + '問）までの残り">' +
          '<span class="srs-stat-lbl">目標まで</span>' +
          (srsGoal > 0 && srsDoneToday >= srsGoal
            ? '<span class="srs-stat-val"><b>達成</b><small>✓</small></span>'
            : '<span class="srs-stat-val"><small>あと</small><b>' + _sfx('left', Math.max(0, srsGoal - srsDoneToday)) + '</b><small>問</small></span>') +
        '</div>' +
        '<div class="srs-stat-cell srs-stat-extra srs-stat-late' + (fc.maxLate >= 7 ? ' is-bad' : '') + '" title="期限切れの問題のうち、いちばん長く期限を過ぎている日数' + (fc.odd ? '（予定日が記録より前になっている ' + fc.odd + '問は、最後に解いた日から数えた）' : '') + '">' +
          '<span class="srs-stat-lbl">最大の遅れ</span>' +
          '<span class="srs-stat-val"><b>' + _sfx('maxLate', fc.maxLate) + '</b><small>日</small></span>' +
        '</div>' +
        '<span class="srs-stat-divider" aria-hidden="true"></span>' +
        '<div class="srs-stat-cell srs-risk-cell">' +
          '<span class="srs-stat-lbl">忘却リスク内訳</span>' +
          '<div class="srs-risk-pills">' +
            '<span class="srs-risk-pill risk-high' + (risk.high === 0 ? ' is-zero' : '') + '" title="予定の倍以上放置または1週間以上遅延（高リスク）"><span class="srs-pi">🔥</span> 超危険 <b>' + _sfx('ph', risk.high) + '</b></span>' +
            '<span class="srs-risk-pill risk-mid' + (risk.mid === 0 ? ' is-zero' : '') + '" title="予定期日を超過した問題"><span class="srs-pi">⚠️</span> 期限切れ <b>' + _sfx('pm', risk.mid) + '</b></span>' +
            '<span class="srs-risk-pill risk-due' + (risk.dueToday === 0 ? ' is-zero' : '') + '" title="本日期日の問題"><span class="srs-pi">📅</span> 本日 <b>' + _sfx('pt', risk.dueToday) + '</b></span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // 内訳の構成比。数字はピルが持っているので、帯は比率だけを担う飾り。
      // ⚠️ flex-grow に件数をそのまま渡す＝0件の区画は幅0で消える（合計は必ず risk.total）
      '<div class="srs-risk-bar" aria-hidden="true">' +
        '<span class="rb-high" data-sk="fh" style="flex:' + risk.high + '"></span>' +
        '<span class="rb-mid" data-sk="fm" style="flex:' + risk.mid + '"></span>' +
        '<span class="rb-due" data-sk="ft" style="flex:' + risk.dueToday + '"></span>' +
      '</div>' +
      _srsVizHtml(srsDoneToday, srsGoal, fc, due, dp));
  } else {
    say.classList.add('is-clear');
    _paintSay(say, '',
      '<span class="srs-deco" aria-hidden="true"></span>' +
      '<div class="srs-card-hdr">' +
        '<div class="srs-card-title-grp">' +
          '<span class="srs-card-ttl"><span class="srs-ttl-ic">🎉</span>今日の復習はクリア済み</span>' +
        '</div>' +
        '<div class="srs-card-counts">' +
          '<div class="srs-card-today">本日消化 <b>' + _sfx('done', srsDoneToday) + '</b>' + srsGoalHtml + '問</div>' +
          newBudgetHtml +
        '</div>' +
      '</div>' +
      '<p class="srs-card-hint">現在、復習期限を迎えた問題はありません。全 ' + _fmtN(totalQ) + '問から新しい問題を進めましょう！</p>' +
      _srsVizHtml(srsDoneToday, srsGoal, fc, 0, dp));
  }

  // ボタンは3つとも席が固定: 主＝いま一番やるべきこと／副＝復習／3つ目＝今日の誤答。
  // ⚠️ 統計への導線をここに置かないこと。以前は due が0の日だけ副が「📊 統計を見る」に
  //    化けており、その日は復習ボタンがハブから消えていた（席が入れ替わると
  //    「昨日あったボタンが無い」になる）。統計はヘッダーの📊アイコンと☰メニューが入口。
  const dueOn = due > 0;
  // 主: 期限が来た復習があればそれが最優先、無ければ科目を選ぶ導線
  // ⚠️ 文言は _setCtaLabel を通すこと（先頭の絵文字を跳ねる span に包む口がここ1つ）。
  //    textContent へ直接入れると、その席だけ絵文字が動かなくなる。
  if (dueOn) { p1.href = 'study.html?mode=srs_review'; _setCtaLabel(p1, '♾️ 定着プロトコル'); }
  else       { p1.href = 'study.html';                 _setCtaLabel(p1, '📚 全科目から選ぶ'); }
  // E: 演出の色は「席」ではなく「中身」で決める。主ボタンは日によって復習と科目選びが
  //    入れ替わるので、席で色を固定すると同じ緑が復習を指す日ができて意味が濁る。
  p1.dataset.fx = dueOn ? 'srs' : 'browse';
  // 副: 主が復習を持っていったら科目選び、そうでなければ復習（0件の日は押せない表示）
  if (dueOn) {
    p2.href = 'study.html'; _setCtaLabel(p2, '📚 全科目から選ぶ →');
  } else {
    _setCtaLabel(p2, '♾️ 定着プロトコル 完了');
    p2.removeAttribute('href');   // due 0 で起動すると通知だけ出して通常閲覧に戻るため、押させない
  }
  p2.dataset.fx = dueOn ? 'browse' : 'srs';
  p2.classList.toggle('is-off', !dueOn);
  // 「今日の復習はなし」は在庫切れではなく片付いた状態＝✓ を出す（E5）
  p2.classList.toggle('is-clear', !dueOn);
  p2.setAttribute('aria-disabled', dueOn ? 'false' : 'true');

  // 3つ目のボタン: 今日の誤答の再履修。
  // ⚠️ 件数の正本は MecAttempts.todayWrongUids()（attempts.js）＝study.html の
  //    startTodayWrongReview が出題に使うのと同じ関数。ここで数え方を書かないこと。
  // ⚠️ 母数は試験モード・SRS復習・章別試験の解答だけ（通常モードの「済」は正誤を残さない）。
  //    「今日たくさん解いたのに0問」は不具合ではなく、通常モードで解いた日はこうなる。
  // ⚠️ 出題側は科目の実在チェックと採点除外で更に絞るので、実際の出題数はこれ以下になり得る。
  if (p3) {
    const wrongN = window.MecAttempts ? MecAttempts.todayWrongUids().length : 0;
    const on = wrongN > 0;
    _setCtaLabel(p3, on ? ('🔁 今日の誤答 ' + _fmtN(wrongN) + '問を再履修') : '🔁 今日の誤答なし');
    p3.classList.toggle('is-off', !on);
    p3.classList.toggle('is-clear', !on);
    p3.classList.toggle('cylinder-loaded', on);
    p3.setAttribute('aria-disabled', on ? 'false' : 'true');
    p3.dataset.fx = 'redo';
    _setRedoLoad(p3, wrongN);
    if (on) p3.href = 'study.html?mode=today_wrong';
    else    p3.removeAttribute('href');
  }

  // F4（主ボタンから立ち上る粒子）は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。
  // ────────────────────────────────────────────────────────────────────────

  // 大きな読み値: カウントアップ → 着地で桁が順に立ち上がり、下から粒子が散る
  const numEl = document.getElementById('heroNum');
  _tweenNum(numEl, td.solved, 900, () => _landHeroNumber(numEl));

  // 🎯 本日の正解率バッジ: 試験・復習の正解率（未解答時はハイフン表示）
  const accNumEl = document.getElementById('heroAccVal');
  const accBadge = document.getElementById('heroAccBadge');
  if (accNumEl) {
    if (td.exT > 0) {
      _tweenNum(accNumEl, td.accPct, 900, () => _landHeroNumber(accNumEl));
      if (accBadge) {
        accBadge.title = '本日の正解率: ' + td.accPct + '% (' + _fmtN(td.exC) + ' / ' + _fmtN(td.exT) + '問正解)';
        accBadge.dataset.rateTier = td.accPct >= 80 ? 'high' : td.accPct >= 60 ? 'mid' : 'low';
      }
    } else {
      accNumEl.textContent = '--';
      if (accBadge) {
        accBadge.title = '本日の試験・復習問題の正解率（未解答）';
        accBadge.dataset.rateTier = 'none';
      }
    }
  }

  // XP: カウントアップ → 着地で帯がひと突きし、✨が上がる
  const xpEl = document.getElementById('heroXp');
  if (xpEl) {
    const chip = xpEl.closest('.hero-xp');
    _tweenNum(xpEl, td.xp, 1000, () => {
      xpEl.textContent = '+' + _fmtN(td.xp);
      if (!chip || td.xp <= 0) return;
      chip.classList.remove('pop');
      void chip.offsetWidth;            // アニメを再生させるための強制リフロー
      chip.classList.add('pop');
      const c = _centerOf(chip);
      if (c && _fxOk()) MecFX.glyphBurst(c.x, c.y, { glyphs: ['✨'], count: 4, spread: 60, w: c.r.width * .6 });
    });
  }

  // レベルの進み。gamify.js が既存の同期データから決定論で出した値をそのまま借りる
  // （XP式をここで持つと二重管理になり、パネルとハブで数字が食い違う）
  const lvBox = document.getElementById('heroLv');
  const gm = window.MecGamify ? MecGamify.stats(true) : null;
  if (lvBox && gm) {
    lvBox.hidden = false;
    document.getElementById('heroLvNum').textContent = gm.level;
    document.getElementById('heroLvTitle').textContent = gm.title || '';
    _tweenNum(document.getElementById('heroLvNeed'), Math.max(0, gm.lvNeedXp - gm.lvCurXp), 900);
    _driveLevelBar(gm.lvProgress);
  }

  // ⏳ 国試カウントダウン（医師国家試験までの残日数）
  const cdDaysEl = document.getElementById('examCountdownDays');
  if (cdDaysEl) {
    const now = new Date();
    let examDate = new Date(now.getFullYear(), 1, 7);
    if (now.getTime() > examDate.getTime()) {
      examDate = new Date(now.getFullYear() + 1, 1, 7);
    }
    const diffDays = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / 86400000));
    cdDaysEl.textContent = diffDays;
  }

  // 🩺 ドクターランク・メディカルクレスト＆計器ケーシングの進化（累計解答数ベース）
  const crestEl = document.getElementById('doctorCrest');
  const dRank = doneCount >= 5000 ? 'professor' : doneCount >= 2000 ? 'specialist' : doneCount >= 500 ? 'resident' : 'student';
  const gBoxEl = document.getElementById('gaugeBox');
  if (gBoxEl) gBoxEl.dataset.doctorRank = dRank;
  if (crestEl) {
    const crestIcon = doneCount >= 5000 ? '👑' : doneCount >= 2000 ? '🎖️' : doneCount >= 500 ? '⚕️' : '🩺';
    const crestTitle = doneCount >= 5000 ? '指導医・教授' : doneCount >= 2000 ? '専攻医・専門医' : doneCount >= 500 ? '初期研修医' : '医学生';
    crestEl.textContent = crestIcon;
    crestEl.title = 'ドクターランク: ' + crestTitle + ' (累計 ' + _fmtN(doneCount) + '問)';
  }

  // 📋 今日の所見。旧「臨床スキルレーダー」の席（座標を固定係数で作っていただけの図）を
  //    その日のデータから作り直す観察に置き換えた（2026-09-12）。
  _renderHubNotes(td, due, streak);
  _renderHubRadar();

  // E6: 計器行も大きな読み値と同じくカウントアップさせる。
  // ⚠️ 連続日数だけ _fmtN を通さない（12日を「12」と出す桁区切りは要らないが、
  //    _tweenNum は内部で _fmtN するので3桁を超える連続日数は区切られる。実用上問題ない）
  _tickStat('statDue',    due);
  _tickStat('statDone',   doneCount);
  _tickStat('statStreak', streak);
  // E7: 復習待ちの滞留を色でも読ませる（数字だけだと 34 と 340 の重みの差が伝わらない）
  { const d = document.getElementById('statDue');
    if (d) { const t = due >= 120 ? 3 : due >= 50 ? 2 : due >= 15 ? 1 : 0;
             if (t) d.dataset.load = String(t); else d.removeAttribute('data-load'); } }
  // 🔥 ストリークマイルストーン炎上フレーム（7日=1 / 30日=2 / 100日=3）
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const sm = streak >= 100 ? 3 : streak >= 30 ? 2 : streak >= 7 ? 1 : 0;
    if (sm) heroEl.dataset.streakMilestone = String(sm);
    else heroEl.removeAttribute('data-streak-milestone');
  }
  _setStreakEmber(streak);

  // ゲージ＝今日やるべき問題数のうち何％まで来たか。
  // 正本は gamify.js の dailyGoal()（日次ミッション ans）。gamify.js が読めない状況では
  // 今日解いた数と既定値で代用する（数字を出さないより、出どころを1つに絞って代用する）。
  const goal = (window.MecGamify && MecGamify.dailyGoal)
    ? MecGamify.dailyGoal()
    : { count: td.solved, target: DAILY_GOAL_FALLBACK,
        pct: Math.round(td.solved / DAILY_GOAL_FALLBACK * 100) };

  // ⚠️ 100%で頭打ちにしないこと。超えた日は 130% と出す（弧だけが2周目に回る）
  document.getElementById('statPct').textContent    = goal.pct;
  // ゲージ下の「N / 目標問」の行と見出しは 2026-10-01 に撤去（待機列の「本日消化 N / 200問」と数字が二重に並ぶため）。
  // 数字はゲージに触れたとき title で読める。
  const gBox = document.getElementById('gaugeBox');
  if (gBox) gBox.title = '今日の目標 ' + _fmtN(goal.count) + ' / ' + _fmtN(goal.target) + '問（日次ミッション「' + _fmtN(goal.target) + '問 解答する」）';
  document.getElementById('gaugeMid').classList.toggle('wide', goal.pct >= 100);
  // ゲージ下の見出し「今日の目標／🎉 目標達成」（旧 #gaugeCap）も 2026-10-01 に撤去（ユーザー判断）。

  // 帰還注入（試験から戻ったときにゲージへ吸い込まれる演出）は 2026-10-01 に全テーマで撤去した（ユーザー判断）。戻さないこと。
  _driveGauge(goal.pct);

  // 👑 週間達成クラウンビーズ（7-Day Crown Orbit）の更新
  const crownOrbit = document.getElementById('gaugeCrownOrbit');
  if (crownOrbit) {
    let weekAllDone = true;
    const todayJst = new Date(Date.now() + 9 * 3600000);
    const dayOfWeek = (todayJst.getUTCDay() + 6) % 7; // 0=月曜 ... 6=日曜
    const rawMissions = window.localStorage ? JSON.parse(localStorage.getItem('mec_missions_v1') || '{}') : {};
    const dMap = rawMissions.d || {};
    for (let i = 0; i < 7; i++) {
      const bead = crownOrbit.querySelector('.bead-' + i);
      if (!bead) continue;
      // 過去の日付（直近の今週の各曜日）
      const diffDays = dayOfWeek - i;
      const tDate = new Date(todayJst.getTime() - diffDays * 86400000).toISOString().slice(0, 10);
      const devMap = dMap[tDate] || {};
      let ansSum = 0;
      Object.keys(devMap).forEach(k => { ansSum += (devMap[k] && devMap[k].ans) || 0; });
      const isDone = (i === dayOfWeek) ? (goal.pct >= 100) : (ansSum >= goal.target);
      bead.classList.toggle('done', isDone);
      if (!isDone && i <= dayOfWeek) weekAllDone = false;
    }
    const gBox = document.getElementById('gaugeBox');
    if (gBox) gBox.classList.toggle('all-week-crowned', weekAllDone);
  }

  // 👻 理想ペースのゴースト針（Pacer Ghost Indicator: 7:00〜23:00を基準に理想進捗を投影）
  const pacerGhost = document.getElementById('gaugePacerGhost');
  if (pacerGhost) {
    const nowJst = new Date(Date.now() + 9 * 3600000);
    const curHour = nowJst.getUTCHours() + nowJst.getUTCMinutes() / 60;
    // 7時〜23時の16時間で 0% -> 100%
    const pacerPct = Math.min(100, Math.max(0, Math.round(((curHour - 7) / 16) * 100)));
    pacerGhost.style.strokeDashoffset = String(GAUGE_C * (1 - pacerPct / 100));
  }

  // 🌊 Abyss 水深表示テキストの更新
  const depthText = document.getElementById('abyssDepthText');
  if (depthText) {
    const depthM = Math.min(10920, Math.max(200, Math.round(200 + goal.pct * 65)));
    depthText.textContent = 'DEPTH: ' + depthM + 'm';
  }

  // E9: 目標に届いた日は大きな読み値そのものを金にする。
  // ⚠️ 段は goal.pct から引く（_goalTier ではなく2段）。ゲージ（0〜6段）は「機械の動き」、
  //    こちらは「読み値の色」で、同じ事実を別の言い方で2回出している＝どちらか一方でも伝わる。
  // ⚠️ 代入は _tweenNum の着地（約900ms後）より前に済むので、_landHeroNumber は
  //    この属性を見て粒子の色を決められる。
  if (numEl) {
    const g = goal.pct >= 150 ? 2 : goal.pct >= 100 ? 1 : 0;
    if (g) numEl.dataset.goal = String(g); else numEl.removeAttribute('data-goal');
  }

  // 2回目以降（同期完了の再描画）は入場アニメを止めてから描き直す。
  // ⚠️ 波形は innerHTML で作り直すので、.settled を付けるのは _renderSpark() より前でないと
  //    同期のたびに30本が立ち上がり直して読めなくなる
  const hero = document.querySelector('.hero');
  if (hero && _heroSettled) hero.classList.add('settled');
  _renderSpark();
  _heroSettled = true;
}

// ── タイル（ヒーローに従属する行き先） ──────────────────────────
let _tilesSettled = false;

// 模試タイルの脚。⚠️ mock_data/*.js を読み込まないこと（1本80KB超で、ハブの起動が重くなる）。
// 数えるのは mec_mock_v1 に入っている解答の件数だけ＝解答表が無くても数えられる。
function _mockEntered() {
  try {
    const all = JSON.parse(localStorage.getItem('mec_mock_v1') || '{}');
    let n = 0; const blocks = new Set();
    Object.keys(all).forEach(ex => {
      const e = all[ex] || {}, r = (e.rounds || {})[e.cur] || {};
      Object.keys(r.ans || {}).forEach(k => { n++; blocks.add(ex + k[0]); });
    });
    return { n, blocks: blocks.size };
  } catch { return { n: 0, blocks: 0 }; }
}

function _mockTileSub() {
  const m = _mockEntered();
  return m.n ? m.n + ' 問入力（' + m.blocks + ' ブロック）' : '未入力';
}

// 成績カルテの脚。⚠️ ここに得点や正答率を出さないこと——正誤は解答表（107KB）と
//    突き合わせないと分からず、それを読むのはカルテ側の仕事（ハブは軽いままにする）。
function _karteTileSub() {
  const m = _mockEntered();
  return m.n ? m.blocks + ' ブロックぶんを分析' : '模試を入力すると見られます';
}

function _tileHtml(t) {
  let sub = '', pct = null, bigN = null, bigU = '%';
  if (t.id === 'kakumon') {
    const p = getKakumonProgress(); pct = p.pct;
    sub = _fmtN(p.doneCount) + ' / ' + _fmtN(p.total) + '問';
  } else if (t.id === 'jitsu1') {
    const p = getJitsuProgress(); pct = p.pct;
    sub = _fmtN(p.doneCount) + ' / ' + _fmtN(p.total) + '問';
  } else if (t.id === 'mock') {
    // 模試データ本体（1本80KB超）はハブで読まない。入力件数だけを localStorage から数える。
    sub = _mockTileSub();
  } else if (t.id === 'karte') {
    sub = _karteTileSub();
  } else if (t.id === 'knowledge') {
    sub = (typeof KNOWLEDGE_NOTES !== 'undefined' ? KNOWLEDGE_NOTES.length : 0) + ' 件のノート';
  } else if (t.id === 'selfcheck') {
    sub = '10 科目';
  } else if (t.id === 'trophy') {
    sub = _trophyTileSub();
  } else if (t.id === 'boss') {
    sub = _bossTileSub();
    bigN = _bossWins(); bigU = '症例確定';
  } else if (t.id === 'mindmap') {
    sub = (MINDMAP_TOOL.maps.length - 1) + ' / ' + (MINDMAP_TOOL.maps.length - 1 + MINDMAP_TOOL.pending.length) + ' 科目';
  }

  const bar = pct === null ? '' : '<span class="tile-bar"><span style="width:' + pct + '%"></span></span>';
  // 縦長タイルだけ読み値を大きく出す（達成率、統合カンファレンスは確定した症例数）。残りは小さな脚だけ＝面の重さで優先順位を作る
  if (bigN === null) bigN = pct;
  const big = (t.span === 'lead' && bigN !== null)
    ? '<span class="tile-big">' + bigN + '<i>' + bigU + '</i></span>' : '';
  const conf = t.id === 'boss';
  const inner = (conf ? '<span class="conf-deco" aria-hidden="true"></span>' : '') +
    '<span class="tile-top">' +
      '<span class="tile-ic">' + t.icon + '</span>' +
      '<span class="tile-nm">' + t.name + '</span>' +
      '<span class="tile-ar">' + (t.kind === 'link' ? '→' : '▾') + '</span>' +
    '</span>' + (conf ? '<span class="conf-tag">❦ GRAND CONFERENCE ❦</span>' : '') + big + bar +
    '<span class="tile-sub">' + sub + '</span>';

  const cls = 'tile' + (t.span ? ' t-' + t.span : '') + (conf ? ' tile-conf' : '');
  const st = ' style="--i:' + HUB_TILES.indexOf(t) + '"';   // 1枚ずつずらして立ち上げる
  return t.kind === 'link'
    ? '<a class="' + cls + '" href="' + t.href + '"' + st + '>' + inner + '</a>'
    : '<button class="' + cls + '" type="button"' + st + ' data-tile="' + t.id + '" aria-expanded="false" aria-controls="hubDetail">' + inner + '</button>';
}

function renderTiles() {
  const host = document.getElementById('hubTiles');
  if (!host) return;
  // 再描画（同期完了など）で開いていたタイルを閉じてしまわないよう覚えておく
  const openBtn = host.querySelector('.tile[aria-expanded="true"]');
  const keep = openBtn ? openBtn.dataset.tile : null;

  // 2回目以降（同期完了の再描画）は棒の伸びを止める。ヒーローの .settled と同じ理由
  if (_tilesSettled) host.classList.add('settled');
  host.innerHTML = HUB_TILES.map(_tileHtml).join('');
  _tilesSettled = true;

  const detail = document.getElementById('hubDetail');
  if (keep) {
    const b = host.querySelector('.tile[data-tile="' + keep + '"]');
    if (b) {
      b.setAttribute('aria-expanded', 'true');
      detail.innerHTML = tileDetailHtml(keep);
      detail.hidden = false;
    }
  } else if (detail) {
    detail.hidden = true;
    detail.innerHTML = '';
  }
}

// 開けるのは常に1つだけ。中身は #hubDetail に全幅で出す
function toggleTile(btn) {
  const host = document.getElementById('hubDetail');
  const wasOpen = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('#hubTiles .tile[data-tile]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (wasOpen) { host.hidden = true; host.innerHTML = ''; return; }
  btn.setAttribute('aria-expanded', 'true');
  host.innerHTML = tileDetailHtml(btn.dataset.tile);
  host.hidden = false;
  if (btn.dataset.tile === 'trophy' && window.MecTrophy) requestAnimationFrame(() => MecTrophy.shelfFx(host));
}

function tileDetailHtml(id) {
  if (id === 'kakumon') return _kakumonDetailHtml();
  if (id === 'jitsu1')  return _jitsuDetailHtml();
  if (id === 'selfcheck') return _selfcheckDetailHtml();
  if (id === 'mindmap') return _mindmapDetailHtml();
  if (id === 'trophy')  return window.MecTrophy ? MecTrophy.shelfHtml() : '';
  return '';
}

// 統合カンファレンス（旧ボス戦）の脚。戦績 mec_boss_v1 は boss.js が書く（UIローカル）。ハブは boss.js を読まない。
function _bossTileSub() {
  try {
    const r = JSON.parse(localStorage.getItem('mec_boss_v1') || '{}');
    if (!r.fights) return '苦手10問の難症例を検討する';
    return '確定 ' + (r.wins || 0) + ' / 検討 ' + r.fights + (r.last ? '　前回 ' + (r.last.won ? '診断確定' : '持ち越し') : '');
  } catch { return ''; }
}
function _bossWins() {
  try { return Number(JSON.parse(localStorage.getItem('mec_boss_v1') || '{}').wins) || 0; }
  catch { return 0; }
}

// トロフィー棚の脚。集計は trophy.js（章の索引を1回作るだけなので同期のたびに走っても軽い）
function _trophyTileSub() {
  if (!window.MecTrophy) return '';
  try {
    const d = MecTrophy.collect();
    return '💎' + _fmtN(d.gems) + '　🥇' + d.medals[3] + '　👑' + d.clears;
  } catch { return ''; }
}

function _kakumonDetailHtml() {
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  return KAKUMON_YEARS.map(yr => {
    let totalYr = 0, doneYr = 0, blocksHtml = '';
    yr.blocks.forEach(blk => {
      const blockId = '' + yr.year + blk;
      const count = KAKUMON_BLOCKS[blockId] || 0;
      const doneCnt = Object.keys(done).filter(k => k.startsWith('kakumon_' + blockId + '_q')).length;
      const pct = count ? Math.round(doneCnt / count * 100) : 0;
      totalYr += count; doneYr += doneCnt;
      blocksHtml +=
        '<a class="chapter-row" href="国家試験過去問/第' + yr.year + '回/' + blockId + '_kakuron.html">' +
          '<span class="chapter-num">' + blk + '問題</span>' +
          '<span class="chapter-title">' + (count === 50 ? '必修' : '一般・臨床') + '（' + count + '問）</span>' +
          '<span class="chapter-prog-bar"><span class="chapter-prog-fill" style="width:' + pct + '%"></span></span>' +
          '<span class="chapter-prog-txt">' + doneCnt + '/' + count + '</span>' +
        '</a>';
    });
    const yrPct = totalYr ? Math.round(doneYr / totalYr * 100) : 0;
    return '<div class="kakumon-year-wrap">' +
      '<div class="chapter-row kakumon-year-hdr" role="button" tabindex="0" aria-expanded="false"' +
        ' onclick="toggleKakumonYear(this)"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleKakumonYear(this);}">' +
        '<span class="chapter-title">' + yr.label + '</span>' +
        '<span class="chapter-prog-bar"><span class="chapter-prog-fill" style="width:' + yrPct + '%"></span></span>' +
        '<span class="chapter-prog-txt">' + doneYr + '/' + totalYr + '</span>' +
        '<span class="kakumon-arrow">▶</span>' +
      '</div>' +
      '<div class="chapter-list hidden">' + blocksHtml + '</div>' +
    '</div>';
  }).join('');
}

function toggleKakumonYear(hdr) {
  const list = hdr.nextElementSibling;
  if (!list) return;
  const nowHidden = list.classList.toggle('hidden');
  hdr.setAttribute('aria-expanded', String(!nowHidden));
  const ar = hdr.querySelector('.kakumon-arrow');
  if (ar) ar.textContent = nowHidden ? '▶' : '▼';
}

function _jitsuDetailHtml() {
  // A/B とも遷移先は統合学習ツールの jitsu1 セクション。ここは進捗の内訳を見せる行
  return JITSU1_CHAPTERS.map(ch => {
    const doneCnt = _doneCountBy(ch.prefix + '_q');
    const pct = ch.count ? Math.round(doneCnt / ch.count * 100) : 0;
    return '<a class="chapter-row" href="study.html?sid=jitsu1">' +
      '<span class="chapter-num">' + ch.label.slice(0, 1) + '問題</span>' +
      '<span class="chapter-title">' + ch.label + '</span>' +
      '<span class="chapter-prog-bar"><span class="chapter-prog-fill" style="width:' + pct + '%"></span></span>' +
      '<span class="chapter-prog-txt">' + doneCnt + '/' + ch.count + '</span>' +
    '</a>';
  }).join('');
}

function _selfcheckDetailHtml() {
  const SELFCHECK_ITEMS = [
    { subject: '⚗️ 内分泌', href: '内分泌/selfcheck_intro.html', color: 'rgba(255, 107, 107, 0.22)' },
    { subject: '🌬️ 呼吸器', href: '呼吸器/selfcheck_intro.html', color: 'rgba(78, 205, 196, 0.22)' },
    { subject: '❤️ 循環器', href: '循環器/selfcheck_intro.html', color: 'rgba(255, 122, 0, 0.22)' },
    { subject: '🌿 消化器', href: '消化器/selfcheck_intro.html', color: 'rgba(61, 214, 140, 0.22)' },
    { subject: '🧠 神経',   href: '神経/selfcheck_intro.html',   color: 'rgba(168, 85, 247, 0.22)' },
    { subject: '🧪 肝胆膵', href: '肝胆膵/selfcheck_intro.html', color: 'rgba(234, 179, 8, 0.22)' },
    { subject: '💧 腎臓',   href: '腎臓/selfcheck_intro.html',   color: 'rgba(59, 130, 246, 0.22)' },
    { subject: '🩸 血液',   href: '血液/selfcheck_intro.html',   color: 'rgba(239, 68, 68, 0.22)' },
    { subject: '🛡️ 免アレ膠', href: '免アレ膠/selfcheck_intro.html', color: 'rgba(14, 165, 233, 0.22)' },
    { subject: '🦠 感染症', href: '感染症/selfcheck_intro.html', color: 'rgba(34, 197, 94, 0.22)' },
  ];
  return '<div class="mindmap-grid">' +
    SELFCHECK_ITEMS.map(s =>
      '<a class="mindmap-btn" href="' + s.href + '" style="background:' + s.color + '">' +
        s.subject +
      '</a>'
    ).join('') +
  '</div>';
}

function _mindmapDetailHtml() {
  // 科目色の正本は gamify.js の SUBJECTS（mindmap_data/index.js 経由）。明るい地なので文字は --subj-ink
  const done = MINDMAP_TOOL.maps.map(m =>
    '<a class="mindmap-btn" href="' + m.href + '" style="background:' + m.color + '">' +
      '<span class="mm-icon">' + m.icon + '</span>' + m.subject +
    '</a>').join('');
  // 未作成の科目は押せない札として並べる。席を消すと「もう無い」に見えるので薄く残す。
  const todo = MINDMAP_TOOL.pending.map(s =>
    '<span class="mindmap-btn is-todo" style="background:' + s.color + '">' +
      '<span class="mm-icon">' + s.icon + '</span>' + s.label + '<em>準備中</em>' +
    '</span>').join('');
  return '<div class="mindmap-grid">' + done + todo + '</div>';
}

function renderHub() {
  renderHero();
  renderTiles();
  updateErrBtn();
}
// 旧名の呼び出し口（saveAndSync / manualSync）が残っているので別名を張っておく
function renderSubjects() { renderHub(); }

// ══════ 演出（粒子は fx_engine.js の MecFX＝全画面の固定canvas・座標はビューポート） ══════
// ⚠️ 新しい position:fixed 要素は足さない（iOSの白wash対策を壊す）。MecFX の canvas を使う。
// ⚠️ 常時ループはタブが非表示・画面外・reduced-motion のとき必ず止める。
//    MecFX 自体も visibilitychange で粒子を捨てるが、撒く側でも止めないと無駄に回る。
function _reducedMotion() {
  return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
}
// テーマのアクセントはその場の計算値を取る（hex を直書きするとテーマで浮く）
function _accent() {
  const v = getComputedStyle(document.body).getPropertyValue('--or');
  return (v || '').trim() || '#FF9A3C';
}
function _fxOk() { return !!window.MecFX && !_reducedMotion() && !document.hidden; }
// 要素の中心のビューポート座標。画面外なら null（撒いても見えないので撒かない）
function _centerOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
}

// 数値のトゥイーン。カウントアップはここに集約する
function _tweenNum(el, to, dur, done) {
  if (!el) return;
  if (el._brNxIdleStop) el._brNxIdleStop();   // Brass の止まったあとのちらつきは、数え直す前に必ず止める
  if (BR_NX_DEG[el.id] != null) _brGearsOn(el);
  if (_reducedMotion()) { el.textContent = _fmtN(to); if (done) done(); return; }
  const from = Number(String(el.textContent).replace(/[^\d-]/g, '')) || 0;
  // Brass の大きな読み値はニキシー管で数える（値が変わらない再描画はふつうの道へ）
  if (from !== to && BR_NX_DEG[el.id] != null && _themeIs('brass')) { _brNixieTween(el, from, to, done); return; }
  const t0 = performance.now();
  let fin = false;
  const finish = () => {
    if (fin) return;
    fin = true;
    el.textContent = _fmtN(to);
    if (done) done();
  };
  // ⚠️ 非表示タブでは requestAnimationFrame が止まるので、rAF だけに任せると数字が
  //    開始値（多くは 0）のまま凍る。ハブが裏で読み込まれる（別タブで開く・起動時の
  //    タブ復元・拡張のバックグラウンドタブ）とそのまま 0 が残るので、必ず落とし所を置く。
  //    表になれば rAF が再開してこの前に走り切るため、通常は保険が発火する前に終わる。
  const guard = setTimeout(finish, dur + 400);
  (function step(t) {
    if (fin) return;
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = _fmtN(Math.round(from + (to - from) * e));
    if (k < 1) { requestAnimationFrame(step); return; }
    clearTimeout(guard);
    finish();
  })(t0);
}

/* ══════════ Brass の読み値：ニキシー管＋歯車連動（2026-10-01 採用・_work/hub_count_demo.html の K6）══════════
   「今日解いた問題」「正答率」の数字がニキシー管の表示器になり（CSS は index.css の html.ui-brass .hero-num）、
   ① 数えている間：桁ごとの管の数字が切り替わるたびに管がちらっと明滅する。数字の枠の左下と右上の歯車列が
      数えた分だけ回り（数え下がると逆回り・左下と右上は逆向き）、止まるとぴたりと止まる。
      十の位が変わるたびに数字がカチッと揺れ、右上の歯車から蒸気がシュッと抜ける。数え終わると左下で火花
   ② 数え終わると焼き入れ（_brQuenchLand）。そのあと BR_NX_IDLE_MS（30秒）の間だけ、ときどきランダムな管が
      ランダムな数字にチカチカ切り替わって戻る（_brNixieIdle）。
   ⚠️ ちらつきは一定時間でやめる（ユーザー判断）。ずっと続けない。1度に動かすのは1本だけ（数字はいつも読める）。
   ⚠️ 数え上げが2本重なる（開いた瞬間と同期の再描画など）と、取り残されたちらつきが同じ管を奪い合い、
      取り違えた数字のまま戻らなくなる（デモで実際に起きた）。始める前・数え直す前に必ず前のを止める。
   ⚠️ 歯車の回転は SVG の transform 属性で書く。歯車は数え始めにその場で取り付ける（開いた瞬間の数え上げに間に合わせる）。 */
const BR_NX_DEG = { heroNum: 6, heroAccVal: 9 };   // 1 増えるごとに大歯車が回る角度
const BR_NX_DUR = 1050;
const BR_NX_IDLE_MS = 30000;   // 数え終わってから、ちらつきを続ける時間
const BR_NX_IDLE_WAIT = 1700;  // 焼き入れ（約1.6秒）が済むのを待つ
function _themeIs(id) {
  return !!(window.MecUITheme && MecUITheme.get && MecUITheme.get() === id);
}
// 歯車列を数字の枠の左下（.bl）と右上（.tr）に1組ずつ取り付ける（何度呼んでも1組ずつ）。
// 各歯車は data-r（大歯車に対する回転比・負＝逆回り）と中心を持つ。3枚とも大歯車と噛み合う位置。
function _brGearsOn(el) {
  const fig = el && el.closest('.hero-fig');
  if (!fig) return null;
  const g = (cx, cy, rt, tp, n, hole, fill, r) => '<g data-r="' + r + '" data-cx="' + cx + '" data-cy="' + cy + '"><path fill="' + fill +
    '" fill-rule="evenodd" d="' + _gearPath(cx, cy, rt, tp, n) + _holePath(cx, cy, hole) + '"/></g>';
  if (!fig.querySelector('.br-gt.bl')) fig.insertAdjacentHTML('beforeend', '<svg class="br-gt bl" viewBox="0 0 44 34" aria-hidden="true">' +
    g(14, 18, 10, 13, 12, 3, '#E0C25E', 1) + g(31.5, 11, 6, 8.5, 8, 2, '#C9A227', -12 / 8) + g(29.5, 27, 5, 7.2, 7, 1.8, '#B87333', -12 / 7) + '</svg>');
  if (!fig.querySelector('.br-gt.tr')) fig.insertAdjacentHTML('beforeend', '<svg class="br-gt tr" viewBox="0 0 44 34" aria-hidden="true">' +
    g(30, 16, 10, 13, 12, 3, '#E0C25E', 1) + g(12.5, 23, 6, 8.5, 8, 2, '#C9A227', -12 / 8) + g(14.5, 7, 5, 7.2, 7, 1.8, '#B87333', -12 / 7) + '</svg>');
  return fig;
}
function _brGearsSpin(fig, a) {
  fig._brGa = a;
  fig.querySelectorAll('.br-gt').forEach(gt => {
    const s = gt.classList.contains('tr') ? -1 : 1;   // 右上の組は左下と逆向きに回す
    gt.querySelectorAll('g[data-r]').forEach(g => {
      g.setAttribute('transform', 'rotate(' + (s * a * +g.dataset.r).toFixed(1) + ' ' + g.dataset.cx + ' ' + g.dataset.cy + ')');
    });
  });
}
function _brNixieTween(el, from, to, done) {
  const fig = _brGearsOn(el);
  const base = (fig && fig._brGa) || 0, per = BR_NX_DEG[el.id];
  const n = String(Math.round(Math.max(Math.abs(from), Math.abs(to)))).length;
  let html = '';
  for (let k = n - 1; k >= 0; k--) {
    html += '<span class="br-nx" data-k="' + k + '"> </span>';
    if (k % 3 === 0 && k > 0) html += '<span class="br-nx-sep">,</span>';
  }
  el.innerHTML = html;
  const tubes = Array.from(el.querySelectorAll('.br-nx'));
  let lastTens = null, fin = false;
  const frame = v => {
    if (fig) _brGearsSpin(fig, base + (v - from) * per);
    const s = String(Math.round(v));
    tubes.forEach(t => {
      const k = +t.dataset.k, ch = k < s.length ? s[s.length - 1 - k] : ' ';
      if (t.textContent !== ch) {
        t.textContent = ch;
        t.classList.remove('flick'); void t.offsetWidth; t.classList.add('flick');
      }
    });
    const tens = Math.floor(Math.round(v) / 10);
    if (lastTens != null && tens !== lastTens) {
      _liqFxPulse(el, 'br-carry', 60);
      const tr = fig && fig.querySelector('.br-gt.tr');
      if (tr && _fxOk()) { const r = tr.getBoundingClientRect(); MecFX.steam(r.left + r.width * .5, r.top + 4, { count: 1, w: 10, rise: 40, min: 8, max: 18, alpha: .4, vx: 30 }); }
    }
    lastTens = tens;
  };
  const finish = () => {
    if (fin) return;
    fin = true;
    if (fig) _brGearsSpin(fig, base + (to - from) * per);
    const bl = fig && fig.querySelector('.br-gt.bl');
    if (bl && _fxOk()) { const r = bl.getBoundingClientRect(); MecFX.sparks(r.left + r.width * .3, r.top + r.height * .5, { count: 8, colors: ['#FFF3C4', '#FFA040'] }); }
    el.textContent = _fmtN(to);
    if (done) done();
  };
  // ⚠️ 非表示タブでは rAF が来ないので、時間でも必ず終える（_tweenNum と同じ約束）
  const guard = setTimeout(finish, BR_NX_DUR + 400);
  const t0 = performance.now();
  (function step(t) {
    if (fin) return;
    const k = Math.min(1, (t - t0) / BR_NX_DUR);
    frame(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) { requestAnimationFrame(step); return; }
    clearTimeout(guard);
    finish();
  })(t0);
}
// 止まったあとのちらつき。着地（_landHeroNumber が桁を .dg に組み直したあと）から BR_NX_IDLE_MS の間だけ。
// 0.6〜2.4秒おきに管を1本選び、2〜5回ランダムな数字に切り替えてから元の数字へ戻す。非表示タブでは休む。
function _brNixieIdle(el) {
  if (!el || _reducedMotion()) return;
  if (el._brNxIdleStop) el._brNxIdleStop();
  const until = performance.now() + BR_NX_IDLE_MS;
  let timer = 0, alive = true;
  const stop = () => {
    alive = false;
    clearTimeout(timer);
    if (el._brNxIdleStop === stop) el._brNxIdleStop = null;
    el.querySelectorAll('.dg').forEach(d => {
      if (d.dataset.real != null) { d.textContent = d.dataset.real; delete d.dataset.real; }
      d.classList.remove('br-nx-idle', 'flick', 'br-nx-glint');
    });
  };
  el._brNxIdleStop = stop;
  const flick = d => { d.classList.remove('flick'); void d.offsetWidth; d.classList.add('flick'); };
  const next = () => {
    if (!alive) return;
    if (performance.now() > until || !_themeIs('brass')) { stop(); return; }
    timer = setTimeout(burst, 600 + Math.random() * 1800);
  };
  const burst = () => {
    if (!alive) return;
    if (document.hidden) { next(); return; }
    const ds = Array.from(el.querySelectorAll('.dg')).filter(d => d.dataset.real == null && /\d/.test(d.textContent));
    if (!ds.length) { next(); return; }
    const d = ds[Math.floor(Math.random() * ds.length)], real = d.textContent;
    d.dataset.real = real;
    d.classList.add('br-nx-idle');
    const n = 2 + Math.floor(Math.random() * 4);
    let i = 0;
    (function swap() {
      if (!alive) return;
      if (i++ < n) {
        let r;
        do { r = String(Math.floor(Math.random() * 10)); } while (r === real);
        d.textContent = r; flick(d);
        timer = setTimeout(swap, 45 + Math.random() * 50);
      } else {
        // 正しい数字へ戻る瞬間は、数え終わったときの焼き入れと同じ白熱で煌めかせる（.br-nx-glint）
        d.textContent = real; d.classList.remove('br-nx-idle', 'flick'); delete d.dataset.real;
        void d.offsetWidth; d.classList.add('br-nx-glint');
        setTimeout(() => d.classList.remove('br-nx-glint'), 600);
        next();
      }
    })();
  };
  timer = setTimeout(next, BR_NX_IDLE_WAIT);
}

/* ══════════ D3: レベルバー（2026-08-14）══════════
   伸び自体は既存の barGrow（scaleX を 0 から。.hero.settled で2回目以降は止まる）が
   担っているので、ここでは触らない。足したのは「あと少しでレベルアップ」の脈だけ。
   ⚠️ 常時光らせない。90%以上のときだけ光るから「あと少し」の意味を持つ。
   ⚠️ barGrow と同じ transform を JS から書かないこと（アニメと取り合いになる）。 */
const LV_NEAR = .9;
function _driveLevelBar(progress) {
  const fill = document.getElementById('heroLvFill');
  if (!fill) return;
  const p = Math.max(0, Math.min(1, progress || 0));
  fill.style.width = Math.round(p * 100) + '%';
  fill.classList.toggle('near', p >= LV_NEAR && !_reducedMotion());
  _armLvBurst(fill, p);
}

/* ══════════ レベルバーが伸び切った瞬間の一撃（2026-09-09）══════════
   合図は barGrow の animationend で受ける。
   ⚠️ setTimeout で「.35s の遅延 ＋ .95s の尺」を数え直さないこと——尺が CSS と JS の
      2か所に散り、片方だけ直された日に必ずずれる。
   ⚠️ 非表示タブでは CSS アニメーションが1frameも進まない＝合図も来ないが、これは
      望ましい振る舞い（表に戻ってバーが実際に伸び切るその瞬間に鳴る）。裏で撒いても
      誰も見ないまま消えるだけなので、rAF のような「落とし所」は要らない。
   ⚠️ 1ページで1回だけ。renderHero は同期完了で何度も走り、2回目以降は
      .hero.settled が barGrow ごと止めるので合図自体が来ないが、_lvBurstArmed でも閉じる。 */
let _lvBurstArmed = false;
const LV_BURST_MS = 1800;   // .on を外すまで（テーマ最長 1.15s ＋ 余韻）

function _armLvBurst(fill, p) {
  const fx = document.getElementById('heroLvBurst');
  // p=0（まだ1XPも入っていない）は伸びるものが無い＝祝う対象が無い。
  // ここで arm しないでおけば、値が入った日の初回描画で改めて張れる
  if (!fx || _lvBurstArmed || p <= 0 || _reducedMotion()) return;
  _lvBurstArmed = true;
  // 先端＝伸び切った位置。CSS はこの1変数だけを見て飾りを置く
  fx.style.setProperty('--lv-p', (p * 100).toFixed(1) + '%');
  const onEnd = (ev) => {
    // .near は lvNear（infinite）も持つ。終わらないので実害は無いが、名前で明示的に絞る
    if (ev.animationName !== 'barGrow') return;
    fill.removeEventListener('animationend', onEnd);
    fx.classList.remove('on');
    void fx.offsetWidth;              // アニメを頭から流すための強制リフロー
    fx.classList.add('on');
    setTimeout(() => fx.classList.remove('on'), LV_BURST_MS);
    _lvBurstFx(fx, p);
  };
  fill.addEventListener('animationend', onEnd);
}

/* 先端で撒く粒。テーマごとに素材が違う。
   ⚠️ THEME_LANDING_CONFIG の署名FX（auroraPrismSweep / kintsugiCrack 等）はここでは
      使わない——あれは全画面フラッシュ付きで、ハブを開くたびに画面全体が光ることになる。
      使ってよいのは座標を取る局所エミッタだけ（burst / rings / sparks / gears …）。 */
const LV_BURST_FX = {
  // プリズムが割れて虹の粒が散る
  aurora: (x, y) => {
    MecFX.diamondSparkle(x, y, { count: 12, colors: ['#00DFD8', '#BD34FE', '#FF0080', '#FFFFFF'], additive: true });
    MecFX.glyphBurst(x, y, { glyphs: ['✦', '✧'], count: 3, spread: 46, w: 18 });
  },
  // 歯車が噛み、火花と蒸気が抜ける
  brass: (x, y) => {
    MecFX.gears(x, y, { count: 3, spread: 150, w: 10, min: 9, max: 16, up: true, upBias: 60 });
    MecFX.sparks(x, y, { count: 12, colors: ['#FFD700', '#E0C25E', '#FFA040', '#FFF8DC'] });
    MecFX.steam(x, y - 4, { count: 5, rise: 60, w: 14, min: 14, max: 30, alpha: .34 });
  },
  // 照準がロックし、データ片が飛ぶ
  cyber: (x, y, r) => {
    MecFX.glitchBars(x, y, {
      count: 4, w: Math.min(300, r.width),
      band: { top: r.top - 16, bottom: r.bottom + 16 },
      colors: ['rgba(0,255,157,.42)', 'rgba(0,229,255,.35)']
    });
    MecFX.pixelPop(x, y, { count: 14, colors: ['#00FF9D', '#00E5FF', '#00FF66', '#FFFFFF'] });
  },
  // 液面が満ちて波紋が開く
  liquid: (x, y) => {
    MecFX.rings(x, y, { count: 2, maxR: 64, color: 'rgba(255,0,127,.75)', thickness: 2, additive: true, stagger: .12 });
    MecFX.burst(x, y, {
      tier: 1, count: 12, colors: ['#FF007F', '#00F2FE', '#FF52A0', '#FFFFFF'],
      shapes: ['circle'], glow: true, additive: true, upBias: 90, gravity: 620
    });
  },
  // 継ぎ目に流し込んだ金が跳ねる
  kintsugi: (x, y) => {
    MecFX.burst(x, y, {
      tier: 1, count: 12, colors: ['#F5D061', '#FFF2A8', '#D4AF37'],
      shapes: ['shard', 'square'], glow: false, additive: false, upBias: 70, gravity: 900
    });
    MecFX.glyphBurst(x, y, { glyphs: ['✨'], count: 3, spread: 40, w: 16 });
  },
  // 星が灯り、金と菫の粒が舞う
  celestial: (x, y) => {
    MecFX.burst(x, y, {
      tier: 2, count: 12, colors: ['#FFD166', '#8A2BE2', '#48CAE4', '#FFFFFF'],
      shapes: ['star'], glow: true, additive: true, upBias: 80
    });
    MecFX.rings(x, y, { count: 1, maxR: 70, color: 'rgba(255,209,102,.7)', thickness: 1.6, additive: true });
  },
  // ソナーの輪が三重に広がる
  abyss: (x, y) => {
    MecFX.rings(x, y, { count: 3, maxR: 90, color: 'rgba(0,255,163,.65)', thickness: 1.6, additive: true, stagger: .14 });
    MecFX.burst(x, y, {
      tier: 1, count: 9, colors: ['#00FFA3', '#00B4D8', '#64FFDA'],
      shapes: ['circle'], glow: true, additive: true, upBias: 120, gravity: 260
    });
  },
  // 張った氷が砕けて粉になる
  frost: (x, y, r) => {
    MecFX.shatter(x, y, {
      count: 12, w: Math.min(180, r.width * .5), h: 8, spread: 190, up: 70,
      colors: ['#FFFFFF', '#A0E7E5', '#70D6FF']
    });
    MecFX.glyphBurst(x, y, { glyphs: ['❄'], count: 2, spread: 34, w: 14 });
  }
};

function _lvBurstFx(fx, p) {
  if (!_fxOk()) return;
  const r = fx.getBoundingClientRect();
  if (!r.width) return;
  const theme = (window.MecUITheme && MecUITheme.get) ? MecUITheme.get() : 'aurora';
  (LV_BURST_FX[theme] || LV_BURST_FX.aurora)(r.left + r.width * p, r.top + r.height / 2, r);
}

/* ══════════ Brass の読み値の着地：焼き入れ（2026-10-01 採用）══════════
   _work/hub_land_demo.html の5案（ドラムカウンター・プレス・歯車・焼き入れ・溶接）からユーザーが選んだもの。
   ① 数字が赤く、さらに白く光るまで熱され（.br-heat の filter）、火の粉がふつふつと上がる
   ② 0.88 秒で一瞬に冷やされ、数字の全面からジュッと蒸気が立ちのぼって真鍮色に戻る（戻り際に表面を光がすべる）
   目標達成の日は蒸気と火の粉が多い。
   ⚠️ 熱の色は filter の animation（!important で .hero-num の filter と目標達成の脈に勝つ）。予定は _liqFxLater の1本。 */
const BR_QUENCH = { hi: '#FFF3C4', orange: '#FFA040', ember: '#FF3D00', white: '#FFFFFF' };
function _brQuenchLand(el, g) {
  if (!el || !_fxOk()) return;
  const c = _centerOf(el);
  if (!c) return;
  const B = BR_QUENCH;
  _liqFxPulse(el, 'br-heat', 1650);
  const ne = g ? 16 : 10;
  for (let i = 0; i < ne; i++) {
    _liqFxLater(120 + i * 45, () => MecFX.burst(c.r.left + Math.random() * c.r.width, c.r.top + c.r.height * (.2 + Math.random() * .6),
      { count: 1, tier: 1, speed: 40, upBias: 140, gravity: -160, colors: [B.ember, B.orange, B.hi], shapes: ['circle'], glow: true }));
  }
  _liqFxLater(880, () => {
    const n = Math.max(3, Math.round(c.r.width / 26)) + (g ? 2 : 0);
    for (let k = 0; k < n; k++) MecFX.steam(c.r.left + c.r.width * (k + .5) / n, c.r.top + c.r.height * .3, { count: g ? 3 : 2, w: c.r.width / n, rise: 110, min: 18, max: 40, alpha: .42 });
    MecFX.sparks(c.x, c.y, { count: 18, colors: [B.white, B.hi, B.orange] });
  });
}

/* ══════════ Liquid の読み値の着地：インクが満ちる（2026-10-01 採用）══════════
   _work/hub_land_demo.html の5案（しずくの着水・ゼリーの震え・溶けて固まる・インクが満ちる・ちぎれて戻る）から
   ユーザーが選んだもの。
   ① 数字がいったん中空の輪郭（光る縁取りだけ）になり、桁の下からネオンのインクが満ちる（桁ごとに 90ms ずらす・1秒）
   ② 満ちきるとたぷんと揺れ（.lq-slosh）、各桁の上からしぶきがあふれる。目標達成の日はしぶきが増える。
   ⚠️ デモにあった「桁の中をのぼる光る泡」はユーザー判断で外した（数字の上に星のように見える）。戻さないこと。
   ⚠️ 金・黄色を使わない（Liquid のゲージの約束）。揺れは独立プロパティ scale。予定は _liqFxLater の1本。 */
const LQ_INK = { mag: '#FF007F', pink: '#FF52A0', cyan: '#00F2FE', white: '#FFFFFF' };
function _lqInkFillLand(el, g) {
  if (!el || !_fxOk()) return;
  const spans = Array.from(el.querySelectorAll('.dg'));
  if (!spans.length || !_centerOf(el)) return;
  const dur = 1000 + (spans.length - 1) * 90;
  _liqFxPulse(el, 'lq-fill', dur + 420);
  _liqFxLater(dur, () => {
    _liqFxPulse(el, 'lq-slosh', 640);
    const c = _centerOf(el);
    if (!c) return;
    const Q = LQ_INK;
    spans.forEach(sp => {
      const r = sp.getBoundingClientRect();
      MecFX.burst(r.left + r.width / 2, r.top + r.height * .1, { tier: 1, count: g ? 10 : 6, colors: [Q.mag, Q.pink, Q.cyan, Q.white], shapes: ['circle'], speed: 260, upBias: 300, gravity: 1300, glow: true });
    });
    MecFX.sparks(c.x, c.r.top + c.r.height * .1, { count: 12, colors: [Q.white, Q.cyan] });
  });
}

/* ══════════ Celestial の読み値の着地：超新星（2026-10-01 採用）══════════
   _work/hub_land_demo.html の5案（星座・日食・超新星・天球儀の環・流星群）からユーザーが選んだもの。
   ① 数字が白い光の一点まで縮む（.cel-nova-in・0.34秒）。周りの星屑が中心へ引き込まれる
   ② 一拍おいて爆発：中心の白い閃光（.cel-nova-core）・星と宝石の破片・金と菫の衝撃波の輪・火花、
      数字は勢いよく元の大きさへ戻って少し行き過ぎる（.cel-nova-out）
   目標達成の日（g）は破片と輪が増える。
   ⚠️ 拡大縮小は独立プロパティ scale で書く（.hero-num の animation＝目標達成の脈と取り合わない）。
   ⚠️ 予定は _liqFxLater の1本に積む（Celestial・Frost の段の演出と同じ予定表）。
   ⚠️ 画面全体を光らせない（旧 celestialAstrolabe は全画面の閃光を出していた）。 */
const CEL_NOVA = { gold: '#FFD166', pale: '#FFF8E1', lilac: '#C084FC', cyan: '#48CAE4', white: '#FFFFFF' };
function _celSupernovaLand(el, g) {
  if (!el || !_fxOk()) return;
  const c = _centerOf(el);
  if (!c) return;
  const C = CEL_NOVA, H = c.r.height;
  el.classList.add('cel-nova-in');
  MecFX.orbit(c.x, c.y, { count: 14, r: H * 1.3, spread: H * .3, dr: -H * 3.4, va: 3.5, ttl: .38, colors: [C.gold, C.white, C.lilac], shapes: ['circle'], size: 3 });
  _liqFxLater(360, () => {
    el.classList.remove('cel-nova-in');
    _liqFxPulse(el, 'cel-nova-out', 760);
    const core = document.createElement('div');
    core.className = 'cel-nova-core';
    core.style.cssText = 'left:' + (c.x - H) + 'px;top:' + (c.y - H) + 'px;width:' + (H * 2) + 'px;height:' + (H * 2) + 'px;';
    document.body.appendChild(core);
    _liqFxLater(700, () => core.remove());
    MecFX.burst(c.x, c.y, { tier: 4, count: g ? 60 : 42, colors: [C.gold, C.pale, C.lilac, C.cyan, C.white], shapes: ['star', 'gem'], speed: g ? 620 : 500, upBias: 60, gravity: 260, glow: true });
    MecFX.rings(c.x, c.y, { count: g ? 3 : 2, maxR: H * 2.6, color: 'rgba(255,209,102,.9)', thickness: 2.6, additive: true, stagger: .1 });
    MecFX.rings(c.x, c.y, { count: 1, maxR: H * 3.4, color: 'rgba(138,43,226,.75)', thickness: 3.2, additive: true });
    MecFX.sparks(c.x, c.y, { count: 30, colors: [C.white, C.gold, C.cyan] });
  });
}

// 大きな読み値の着地。桁を span に組み直して順に立ち上げ、全8テーマ固有のシグネチャーFXを発生
function _landHeroNumber(el) {
  if (!el || _reducedMotion()) return;
  const s = el.textContent;
  let d = 0;
  el.innerHTML = [...s].map(ch => (ch >= '0' && ch <= '9')
    ? '<span class="dg" style="--i:' + (d++) + '">' + ch + '</span>'
    : '<span class="dg-s">' + ch + '</span>').join('');
  const c = _centerOf(el);
  if (!c || !_fxOk()) return;
  const g = parseInt(el.dataset.goal || '0', 10) || 0;
  const theme = (window.MecUITheme && window.MecUITheme.get) ? MecUITheme.get() : 'aurora';

  const THEME_LANDING_CONFIG = {
    aurora: {
      color: '#00DFD8',
      ringColor: 'rgba(0,223,216,.8)',
      glyphs: ['✦', '✧', '💎'],
      burstColors: ['#00DFD8', '#FF0080', '#7928CA', '#FFFFFF'],
      shapes: ['circle', 'star'],
      action: (x, y) => { if (window.MecFX && MecFX.auroraPrismSweep) MecFX.auroraPrismSweep(x, y); }
    },
    cyber: {
      color: '#00FF9D',
      ringColor: 'rgba(0,255,157,.85)',
      glyphs: ['0', '1', '■', '▫'],
      burstColors: ['#00FF9D', '#00E5FF', '#76FF03', '#FFFFFF'],
      shapes: ['square', 'circle'],
      action: (x, y) => {
        if (!window.MecFX) return;
        if (MecFX.cyberTargetLock) MecFX.cyberTargetLock(x, y);
        if (MecFX.glitchBars) MecFX.glitchBars(x, y, 2);
      }
    },
    kintsugi: {
      color: '#F5D061',
      ringColor: 'rgba(245,208,97,.85)',
      glyphs: ['✨', '✦', '✧'],
      burstColors: ['#F5D061', '#E5B83A', '#D4AF37', '#FFFFFF'],
      shapes: ['star'],
      action: (x, y) => { if (window.MecFX && MecFX.kintsugiCrack) MecFX.kintsugiCrack(x, y); }
    },
    abyss: {
      color: '#00FFA3',
      ringColor: 'rgba(0,255,163,.85)',
      glyphs: ['🫧', '✦', '✧'],
      burstColors: ['#00FFA3', '#00B4D8', '#48CAE4', '#FFFFFF'],
      shapes: ['circle'],
      action: (x, y) => {
        if (!window.MecFX) return;
        if (MecFX.abyssSonarPulse) MecFX.abyssSonarPulse(x, y);
        if (MecFX.bubbles) MecFX.bubbles(x, y, 6);
      }
    },
    frost: {
      color: '#A0E7E5',
      ringColor: 'rgba(160,231,229,.85)',
      glyphs: ['❄️', '✦', '✧'],
      burstColors: ['#A0E7E5', '#70D6FF', '#FFFFFF', '#D4F8FF'],
      shapes: ['star'],
      action: (x, y) => { if (window.MecFX && MecFX.frostCrystalShatter) MecFX.frostCrystalShatter(x, y); }
    }
  };

  // Celestial は「超新星」（2026-10-01 採用）。数字そのものが光の一点へ縮み、爆発して戻る
  if (theme === 'celestial') { _liqFxLater(d * 55 + 120, () => _celSupernovaLand(el, g)); return; }
  // Liquid は「インクが満ちる」（2026-10-01 採用）。数字が輪郭だけになり、下からネオンのインクが満ちてあふれる
  if (theme === 'liquid') { _liqFxLater(d * 55 + 120, () => _lqInkFillLand(el, g)); return; }
  // Brass は「焼き入れ」（2026-10-01 採用）。数字が赤から白へ熱され、蒸気とともに冷えて真鍮色に戻る
  // 焼き入れのあと、30秒の間だけニキシー管がときどきチカチカする（_brNixieIdle）
  if (theme === 'brass') { _liqFxLater(d * 55 + 120, () => _brQuenchLand(el, g)); _brNixieIdle(el); return; }

  const cfg = THEME_LANDING_CONFIG[theme] || THEME_LANDING_CONFIG.aurora;

  setTimeout(() => {
    // 1. 各テーマ固有シグネチャーFXの発動
    cfg.action(c.x, c.y);

    // 2. テーマ固有グリフ・パーティクル
    if (!g) {
      MecFX.glyphBurst(c.x, c.r.bottom - 6, { glyphs: cfg.glyphs, count: 4, spread: 60, w: c.r.width * .8 });
      MecFX.burst(c.x, c.r.bottom - 6, {
        tier: 2, count: 12, colors: cfg.burstColors,
        shapes: cfg.shapes, glow: true, additive: true, upBias: 60
      });
      return;
    }

    // 目標達成（g=1 / g=2）時の強化バースト
    MecFX.glyphBurst(c.x, c.r.bottom - 6, {
      glyphs: cfg.glyphs, count: g >= 2 ? 8 : 5, spread: 74, w: c.r.width * .8
    });
    MecFX.burst(c.x, c.r.bottom - 6, {
      tier: g >= 2 ? 4 : 3, count: g >= 2 ? 36 : 22,
      colors: cfg.burstColors,
      shapes: cfg.shapes, glow: true, additive: true, upBias: 90
    });

    // 💥 テーマカラー連動ショックウェーブリング
    const layer = document.getElementById('heroShockwaveLayer');
    if (layer) {
      const ring = document.createElement('div');
      ring.className = 'hero-shockwave-ring';
      ring.style.borderColor = cfg.ringColor;
      ring.style.boxShadow = '0 0 16px ' + cfg.color;
      const bRect = layer.getBoundingClientRect();
      ring.style.left = (c.x - bRect.left) + 'px';
      ring.style.top = (c.y - bRect.top) + 'px';
      layer.appendChild(ring);
      setTimeout(() => ring.remove(), 800);
    }
    if (g >= 2) MecFX.rings(c.x, c.y, { count: 1, color: cfg.ringColor, thickness: 2.2, maxR: 160, additive: true });
  }, d * 55 + 120);
}

/* ══════════ E: 計器行とボタンの補助（2026-08-14）══════════ */

// 計器行の1セル。カウントアップし、着地でひと突きする。
// ⚠️ 値が変わっていない再描画（同期完了は renderHero を何度も呼ぶ）では突かない。
//    毎回突くと、何もしていないのに数字が跳ねて「増えた」と誤読される。
function _tickStat(id, to) {
  const el = document.getElementById(id);
  if (!el) return;
  const from = Number(String(el.textContent).replace(/[^\d-]/g, '')) || 0;
  const changed = from !== (to | 0);
  _tweenNum(el, to | 0, 850, () => {
    if (!changed || _reducedMotion()) return;
    const dd = el.closest('dd');
    if (!dd) return;
    dd.classList.remove('tick');
    void dd.offsetWidth;            // アニメを再生させるための強制リフロー
    dd.classList.add('tick');
  });
}

// 誤答ボタンの「在庫の重さ」。件数の段を data-load で渡し、脈の速さ（--rp）はCSSが持つ。
// 0件のときは属性ごと外す（脈が残ると「片付いた」と矛盾する）。
function _setRedoLoad(el, n) {
  if (!el) return;
  const t = n >= 30 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0;
  if (t) el.dataset.load = String(t); else el.removeAttribute('data-load');
}

/* F3: ボタンの文言を入れる唯一の口。先頭の絵文字だけを <span class="cta-ic"> に包んで
   跳ねさせる（文言そのものは動かさない＝読んでいる最中に字が動くと読みづらい）。
   ⚠️ innerHTML では組み立てないこと。件数は数値由来で安全だが、文言を組む口は
      1つしかないので、ここを DOM ノードで作っておけば将来どんな文字が来ても壊れない。
   ⚠️ textContent='' はリップルの残骸ごと消すが、renderHero は頻繁には走らないので無害。 */
function _setCtaLabel(el, text) {
  if (!el) return;
  const i = text.indexOf(' ');
  if (i <= 0) { el.textContent = text; return; }
  el.textContent = '';
  const ic = document.createElement('span');
  ic.className = 'cta-ic';
  ic.textContent = text.slice(0, i);
  // 4つが揃って跳ねると「点滅」に見えるので、席ごとにずらす
  ic.style.setProperty('--hop', ((parseInt(el.style.getPropertyValue('--i'), 10) || 0) * 0.55) + 's');
  el.appendChild(ic);
  el.appendChild(document.createTextNode(text.slice(i)));
}

// ボタンの性格別の色。data-fx は renderHero が「席」ではなく「中身」で入れる。
const CTA_FX_COLORS = {
  srs:    ['#60A5FA', '#A5D8FF', '#FFFFFF'],   // 🔔 復習＝青
  browse: ['#3DD68C', '#A7F3D0', '#FFFFFF'],   // 📚 全科目＝緑
  redo:   ['#FF6B6B', '#FFB4A2', '#FFFFFF']    // 🔁 誤答の再履修＝赤（cta-redo の細線と同系）
};
function _ctaColors(el) {
  const k = el && el.dataset ? el.dataset.fx : '';
  return CTA_FX_COLORS[k] || [_accent(), '#FFFFFF'];
}

// E2: 押した位置からリップル。pointerdown で挿し、アニメ終了で自分を消す。
// ⚠️ is-off のボタンには出さない（pointer-events:none なのでそもそも届かないが、
//    将来 is-off の実装を変えたときに「押せないのに反応する」を作らないため明示する）。
function _initCtaRipple() {
  if (_reducedMotion()) return;
  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.cta-main, .cta-sub');
    if (!btn || btn.classList.contains('is-off')) return;
    const r = btn.getBoundingClientRect();
    const rip = document.createElement('span');
    rip.className = 'cta-rip';
    rip.style.setProperty('--rx', (e.clientX - r.left) + 'px');
    rip.style.setProperty('--ry', (e.clientY - r.top) + 'px');
    btn.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove(), { once: true });
    setTimeout(() => rip.remove(), 900);   // animationend が来ない環境の保険
  }, { passive: true });
}

/* E10: 遷移の余韻。押した瞬間に粒子を撒いても、その場で遷移すると1フレームも見えない。
   ⚠️ 遷移を横取りするので、通常のリンクとして扱うべきものは必ず素通しすること:
      修飾キー（新しいタブで開く）・中クリック・target 指定・別オリジン・href なし。
   ⚠️ 保険のタイマーを必ず置く（例外で遷移が落ちると押しても何も起きないボタンになる）。 */
const CTA_EXIT_MS = 210;
function _initCtaExit() {
  if (_reducedMotion()) return;
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cta-main, .cta-sub');
    if (!btn || btn.classList.contains('is-off')) return;
    const href = btn.getAttribute('href');
    if (!href || btn.target || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    let gone = false;
    const go = () => { if (gone) return; gone = true; location.href = href; };
    try {
      if (_fxOk()) {
        const c = _centerOf(btn);
        if (c) {
          const col = _ctaColors(btn);
          MecFX.burst(c.x, c.y, {
            tier: 3, count: 30, colors: col, shapes: ['circle', 'star'],
            speed: 340, gravity: 380, glow: true, additive: true
          });
          MecFX.rings(c.x, c.y, { count: 2, color: col[0], thickness: 2, maxR: 170, stagger: .07, additive: true });
        }
      }
      btn.animate([{ opacity: 1 }, { opacity: .55 }], { duration: CTA_EXIT_MS, fill: 'forwards' });
    } catch (err) { /* 演出が落ちても遷移は必ず起こす */ }
    setTimeout(go, CTA_EXIT_MS);
    setTimeout(go, 900);            // 保険
  });
}

// ── ゲージの歯車列 ───────────────────────────────────────────
// 歯車の輪郭を歯数から作る。root=歯底半径 / tip=歯先半径 / n=歯数。
// 歯底を円弧でつないで谷を丸くする＝切り出しではなく鋳物に見える。
function _gearPath(cx, cy, root, tip, n) {
  const step = Math.PI * 2 / n, w = step * .27;   // 歯の半幅（歯底側）
  const pt = (a, r) => (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2);
  let d = 'M' + pt(-w, root);
  for (let i = 0; i < n; i++) {
    const a = i * step;
    d += 'L' + pt(a - w * .58, tip) + 'L' + pt(a + w * .58, tip) + 'L' + pt(a + w, root);
    d += 'A' + root + ' ' + root + ' 0 0 1 ' + pt(a + step - w, root);
  }
  return d + 'Z';
}
// 歯車の諸元。⚠️ 歯数と CSS の --gear-t の係数は対（比が噛み合いを作る）。
//   大24枚 : a=12枚(×2) / b=16枚(×1.5) / c=10枚(×2.4) / d=14枚(×1.71)
// 小歯車は中心から約 94.8（＝四隅に置いた 45度 の位置）にあり、歯先が大歯車の歯の領域
// （root 74〜tip 82）へ食い込む距離になっている。ここを動かすと噛み合いが離れて浮く。
// ⚠️ 座標は viewBox 168×168・中心(84,84)。viewBox を変えるならここも全部変える。
const GEARS = [
  { id: 'gearMain', cx: 84,  cy: 84,  root: 74,   tip: 82, n: 24, hole: 66 },
  { id: 'gearA',    cx: 17,  cy: 17,  root: 10.6, tip: 17, n: 12, hole: 4.8 },
  { id: 'gearB',    cx: 151, cy: 151, root: 11.5, tip: 17, n: 16, hole: 5.1 },
  { id: 'gearC',    cx: 148, cy: 20,  root: 8,    tip: 13, n: 10, hole: 3.7 },
  { id: 'gearD',    cx: 18,  cy: 150, root: 10,   tip: 15, n: 14, hole: 4.4 },
];
// 中心の穴。歯車本体と逆回りの円を同じ path に足し、fill-rule:evenodd で抜く
function _holePath(cx, cy, r) {
  return 'M' + (cx + r) + ' ' + cy +
    'A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy +
    'A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + 'Z';
}
function _buildGears() {
  GEARS.forEach(g => {
    const el = document.getElementById(g.id);
    if (!el) return;
    el.setAttribute('d', _gearPath(g.cx, g.cy, g.root, g.tip, g.n) + _holePath(g.cx, g.cy, g.hole));
    el.setAttribute('fill-rule', 'evenodd');
  });
}

// 今日の目標の達成率 → 演出の段（ゲージの data-tier）。上げるほど盤面が熱くなる。
function _goalTier(pct) {
  if (pct <= 0) return 0;
  if (pct < 25)  return 1;
  if (pct < 50)  return 2;
  if (pct < 75)  return 3;
  if (pct < 100) return 4;
  if (pct < 150) return 5;
  return 6;
}

// ゲージ: 達成率を弧と data-tier に反映し、100% へ上がった一度だけ刻印を押す。
// 100%を超えたぶんは2周目の弧（.gauge-ovf）を1周目に重ねて描く。
// ⚠️ 数字（#statPct）は頭打ちにしていないので、弧が満タンでも 210% は 210% と読める。
// ⚠️ 段の祝砲（_gaugeCelebrate）・25/50/75% の小祝砲（_checkpointFx）・ゲージの常時粒子
//    （_startGaugeAmbient）は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。
//    段を覚えておくのは目標達成の刻印（_stampGoalSeal）を一度きりにするため。
let _gaugeTierShown = -1;

// ── 演出の予定表（Celestial・Frost の段の演出が共用）──────────────────────────
// もとは旧 Liquid ゲージ（2026-09-14b）の先端の飛沫・真珠の輪のために作ったもの。旧 Liquid ゲージは 2026-09-29 に
// hub_liquid.js（canvas）へ置き換えて撤去したが、予定表はほかのテーマが使っているので名前ごと残している。
// ⚠️ 予定は _liqFxQ に積み、タイマーは _liqFxTimer の1本だけ（renderHero は同期のたびに走る）。
let _liqFxQ = [], _liqFxTimer = 0;

function _liqFxPump() {
  _liqFxTimer = 0;
  const now = performance.now();
  while (_liqFxQ.length && _liqFxQ[0].at <= now + 8) {
    try { _liqFxQ.shift().fn(); } catch (e) { /* 演出の失敗で残りの予定を止めない */ }
  }
  if (_liqFxQ.length) _liqFxTimer = setTimeout(_liqFxPump, Math.max(16, _liqFxQ[0].at - now));
}
function _liqFxLater(ms, fn) {
  _liqFxQ.push({ at: performance.now() + ms, fn });
  _liqFxQ.sort((a, b) => a.at - b.at);
  clearTimeout(_liqFxTimer);
  _liqFxTimer = setTimeout(_liqFxPump, Math.max(16, _liqFxQ[0].at - performance.now()));
}
// クラスを付け直してアニメを頭から走らせ、ms 後に外す（付け直した後の古い「外す」は無視する）
function _liqFxPulse(el, cls, ms) {
  if (!el) return;
  const tok = (el._liqFxTok || 0) + 1;
  el._liqFxTok = tok;
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
  _liqFxLater(ms, () => { if (el._liqFxTok === tok) el.classList.remove(cls); });
}

// ── 全8テーマ完全差別化：各テーマ固有の進捗描画ロジック ─────────────────────────
function _driveThemeGauge(pct, base, over, tier) {
  // 1. Brass：蒸気機関・噛み合いの火花・奥行きの歯車群（hub_brass.js が #gaugeBrassEngine に描く・2026-10-01）。
  //    描くのは ui-brass のときだけ（テーマの切り替えは hub_brass.js が自分で拾う）。ここは値を渡すだけ。
  //    下の針（#brassNeedle）は Brass では svg ごと隠れている（index.css の html.ui-brass .gauge-ring > svg）
  if (window.MecBrassGauge) {
    MecBrassGauge.mount(document.getElementById('gaugeBrassEngine'));
    MecBrassGauge.set(pct);
  }
  const bNeedle = document.getElementById('brassNeedle');
  if (bNeedle) {
    const bAngle = -135 + (base / 100) * 270;
    bNeedle.style.transform = 'rotate(' + bAngle.toFixed(1) + 'deg)';
  }

  // 2. Cyber: 立体浮遊型タクティカルHUD（360度ホログラムレーザーゲージ＆フォトンヘッド＆ハニカムセル）
  const cHolo = document.getElementById('cyberHoloGauge');
  const cPhoton = document.getElementById('cyberPhotonHead');
  const cHexGroup = document.getElementById('cyberHoneycombArray');
  const cHudStatus = document.getElementById('cyberHudStatus');
  if (cHolo) {
    // 360度ゲージ: C = 402.12
    const cOffset = 402.12 * (1 - base / 100);
    cHolo.style.strokeDashoffset = String(cOffset.toFixed(1));
  }
  if (cPhoton) {
    const cRot = (base / 100) * 360;
    cPhoton.style.transform = 'rotate(' + cRot.toFixed(1) + 'deg)';
  }
  if (cHexGroup && cHexGroup.children) {
    // 6つのハニカムセルを進捗（16.6%刻み）に応じて点灯
    const hActive = Math.round((base / 100) * 6);
    const hexes = cHexGroup.children;
    for (let i = 0; i < hexes.length; i++) {
      hexes[i].classList.toggle('active', i < hActive);
      hexes[i].classList.toggle('overdrive', over > 0);
    }
  }
  if (cHudStatus) {
    if (over > 0) cHudStatus.textContent = 'OVERDRIVE: ACTIVE';
    else if (base >= 100) cHudStatus.textContent = 'TARGET: REACHED';
    else if (base > 0) cHudStatus.textContent = 'SYNC: ' + Math.round(base) + '%';
    else cHudStatus.textContent = 'SYS: READY';
  }

  // 3. Aurora: 地磁気プラズマアーチ ＆ 天頂極光コロナ ＆ 左右対称バイラテラル極光光環
  const aCurtain = document.getElementById('auroraCurtainGroup');
  const aPrismArc = document.getElementById('auroraPrismArc');
  const aPrismArcSym = document.getElementById('auroraPrismArcSym');
  const aPrismJewel = document.getElementById('auroraPrismJewelWrap');
  const aCore = document.getElementById('gaugeAuroraCore');
  if (aCurtain) {
    // 脱・液体水面：下から上への水位上昇を撤廃し、天頂から広がる極光ヴェールの光度・透明度・光芒スケールを進捗で深化
    const curOp = 0.35 + (base / 100) * 0.65;
    aCurtain.style.opacity = curOp.toFixed(2);
    // 天頂からの優雅なドレープ呼吸（テスト互換のため aCurtain.style.transform を保持）
    const vScale = 0.82 + (base / 100) * 0.22 + (over > 0 ? 0.06 : 0);
    aCurtain.style.transform = 'scaleY(' + vScale.toFixed(3) + ') translateY(0px)';
  }
  if (aPrismArc) {
    // 左右対称バイラテラル極光光環: 半周 C = 213.63
    // 天頂（12時）から左右対称に両翼へ向かって均等に光が満ちていき、100%達成時に最下部（6時）で結合
    const aArcOffset = 213.63 * (1 - Math.min(1, base / 100));
    aPrismArc.style.strokeDashoffset = String(aArcOffset.toFixed(1));
    if (aPrismArcSym) {
      aPrismArcSym.style.strokeDashoffset = String(aArcOffset.toFixed(1));
    }
  }
  if (aPrismJewel) {
    // 天頂のマスターオーロラジュエル：進捗およびオーバードライブで光彩パルスと微細スピン
    const jScale = 1 + (base / 100) * 0.35 + (over > 0 ? 0.15 : 0);
    const aRot = (base / 100) * 180;
    aPrismJewel.style.transform = 'scale(' + jScale.toFixed(2) + ') rotate(' + aRot.toFixed(1) + 'deg)';
  }
  if (aCore) {
    const aStage = over > 0 ? '5' : base >= 100 ? '4' : base >= 75 ? '3' : base >= 50 ? '2' : base >= 25 ? '1' : '0';
    aCore.dataset.auroraStage = aStage;
  }
  const aFill = document.getElementById('auroraPrismFill');
  if (aFill) {
    const aH = (base / 100) * 140;
    aFill.setAttribute('y', String(154 - aH));
    aFill.setAttribute('height', String(aH));
  }

  // 4. Liquid：中央の塊・ちぎれて漂うかけら・中の光の網・進捗の弧（hub_liquid.js が #gaugeLiquidCanvas に描く・2026-09-29）。
  //    描くのは ui-liquid のときだけ（テーマを切り替えたら hub_liquid.js が自分で起きる・止まる）。ここは値を渡すだけ
  if (window.MecLiquidGauge) {
    MecLiquidGauge.mount(document.getElementById('gaugeLiquidCanvas'));
    MecLiquidGauge.set(pct);
  }

  // 5. Kintsugi: 3段階黄金接合クラック (長さ約100ずつ)
  const kc1 = document.getElementById('ktCrack1');
  const kc2 = document.getElementById('ktCrack2');
  const kc3 = document.getElementById('ktCrack3');
  if (kc1 && kc2 && kc3) {
    const p1 = Math.min(1, Math.max(0, base / 33.3));
    const p2 = Math.min(1, Math.max(0, (base - 33.3) / 33.3));
    const p3 = Math.min(1, Math.max(0, (base - 66.6) / 33.4));
    kc1.style.strokeDashoffset = String((100 * (1 - p1)).toFixed(1));
    kc2.style.strokeDashoffset = String((100 * (1 - p2)).toFixed(1));
    kc3.style.strokeDashoffset = String((100 * (1 - p3)).toFixed(1));
  }

  // 6. Celestial: 【絢爛アストロラーベ・多重連動天球儀】黄道進捗光弧 ＆ 太陽天体マーカー運行
  const cArc = document.getElementById('celEclipticArc');
  const cSun = document.getElementById('celSunChronos');
  const cTrine = document.getElementById('celAspectTrine');
  const cTotal = 285; // 黄道傾斜環（rx=63, ry=23）の外周長
  const pCel = Math.min(100, Math.max(0, base));

  if (cArc) {
    // 0%で全周非表示(285)、100%で全周点灯(0)
    const cOffset = cTotal * (1 - pCel / 100);
    cArc.style.strokeDashoffset = String(cOffset.toFixed(1));
  }
  if (cSun) {
    // 太陽天体マーカーが黄道楕円環の角度（0%〜100% で 0°〜360°）を運行
    const sunAngle = (pCel / 100) * 360;
    cSun.style.transform = 'rotate(' + sunAngle.toFixed(1) + 'deg)';
  }
  if (cTrine) {
    // 進捗率に応じてアスペクト調和幾何学の角度が連動
    const tRot = (pCel / 100) * 120;
    cTrine.style.transform = 'rotate(' + tRot.toFixed(1) + 'deg)';
  }
  // 互換用フォールバック
  const mShadow = document.getElementById('celMoonShadow');
  if (mShadow) {
    const p = Math.min(1, Math.max(0, base / 100));
    const sRx = Math.max(0, 42 * (1 - p));
    const sCx = 84 + (p * 42);
    mShadow.setAttribute('rx', String(sRx.toFixed(1)));
    mShadow.setAttribute('cx', String(sCx.toFixed(1)));
  }
  // 🌌 天の川（上から時計回りに満ちる）＆ 🪐 天球儀が開く（2026-09-29・_work/gauge_celestial_base_demo.html の案4）
  // ⚠️ どちらも CSS は index.css の「8. 天の川」「9. 天球儀が開く」。値は1周目（pCel）だけで決める
  const mwArc = document.getElementById('celMwMaskArc');
  if (mwArc) mwArc.setAttribute('stroke-dasharray', pCel.toFixed(2) + ' 100');
  const mwTip = document.getElementById('celMwTip');
  if (mwTip) {
    mwTip.style.rotate = (pCel * 3.6).toFixed(1) + 'deg';
    mwTip.style.display = (pCel > 0.3 && pCel < 100) ? '' : 'none';
  }
  // 環 k は 25k〜25(k+1)% の間に、真横から見た線（scale 0）から円（scale 1）へ起き上がる。k=2 は水平の環＝縦に開く
  for (let k = 0; k < 3; k++) {
    const ring = document.getElementById('celArm' + k);
    if (!ring) continue;
    const f = Math.min(1, Math.max(0, (pCel - 25 * k) / 25));
    const open = Math.max(0.02, Math.sin(f * Math.PI / 2)).toFixed(3);
    ring.style.scale = k === 2 ? '1 ' + open : open + ' 1';
    ring.style.opacity = f > 0 ? '1' : '0';
  }
  // 100% を超えている間だけ 3本の環が回り続け、天の川の流れが速まる（CSS は .gauge[data-cel-over]）
  const celBox = document.getElementById('gaugeBox');
  if (celBox) {
    if (pct > 100) celBox.dataset.celOver = '1';
    else if (celBox.removeAttribute) celBox.removeAttribute('data-cel-over');
  }
  _celProgressFx(base);

  // 7. Abyss: 超深海探査ポータル ＆ 生体発光アーク (C=402.12) & 潜航深度計 ＆ 水圧HUD
  const aBioArc = document.getElementById('abyssBioArc');
  const aBioHead = document.getElementById('abyssBioHead');
  if (aBioArc) {
    const cAbyss = 402.12; // 2 * PI * 64
    const p = Math.min(100, Math.max(0, base));
    aBioArc.style.strokeDashoffset = String((cAbyss * (1 - p / 100)).toFixed(2));
    if (aBioHead) {
      aBioHead.style.transform = 'rotate(' + (p * 3.6).toFixed(1) + 'deg)';
    }
  }
  // 互換用hidden要素
  const aProgL = document.getElementById('abyssDiveProgL');
  const aProgR = document.getElementById('abyssDiveProgR');
  if (aProgL && aProgR) {
    const h = (base / 100) * 100;
    aProgL.setAttribute('height', String(h.toFixed(1)));
    aProgR.setAttribute('height', String(h.toFixed(1)));
  }
  const dTx = document.getElementById('abyssDepthDisplay');
  const zTx = document.getElementById('abyssZoneDisplay');
  const aAtm = document.getElementById('abyssAtmDisplay');
  const dMeters = Math.round((base / 100) * 10928);
  if (dTx) {
    dTx.textContent = 'DEPTH: ' + dMeters.toLocaleString() + 'm';
  }
  if (zTx) {
    let zone = 'SURFACE (0m)';
    if (base >= 100) zone = 'HADAL TRENCH (MAX)';
    else if (base >= 75) zone = 'ABYSSOPELAGIC';
    else if (base >= 50) zone = 'BATHYPELAGIC';
    else if (base >= 25) zone = 'MESOPELAGIC';
    else if (base > 0) zone = 'EPIPELAGIC';
    zTx.textContent = zone;
  }
  if (aAtm) {
    const atmVal = Math.max(1, Math.round(1 + dMeters / 10));
    aAtm.textContent = atmVal.toLocaleString() + ' ATM';
  }
  // 熱水噴出孔チムニー活動性（進捗率・オーバードライブに応じた活性化）
  const aVent = document.getElementById('abyssVentGroup');
  if (aVent) {
    const vOpacity = Math.min(1, 0.45 + (base / 100) * 0.55);
    aVent.style.opacity = String(vOpacity.toFixed(2));
  }

  // 8. Frost: 【中央成長型六角フロスト・インフィル ＆ 拡大成長フラクタル雪結晶】
  const fFill = document.getElementById('frostInfillFill');
  const fCrev = document.getElementById('frostInfillCrevasse');
  const fCore = document.getElementById('gaugeFrostCore');
  const fSnowflake = document.getElementById('frostSnowflakeDendrite');

  // 中央 (84, 84) から外側へ拡大する六角氷結シールドと鋭利なクレバス前線
  const fillScale = base / 100;
  if (fFill) {
    fFill.style.transform = 'scale(' + fillScale.toFixed(3) + ')';
    fFill.style.opacity = base > 0 ? String((0.35 + fillScale * 0.65).toFixed(2)) : '0';
  }
  if (fCrev) {
    fCrev.style.transform = 'scale(' + fillScale.toFixed(3) + ')';
    fCrev.style.opacity = (base > 0 && base < 100) ? '1' : '0';
  }

  // 雪の結晶：進捗％の上昇に伴い中央から優雅かつ劇的に拡大（scale: 0.35 -> 1.0, overdriveで1.08）
  if (fSnowflake) {
    let flakeScale = 0.35 + (base / 100) * 0.65;
    if (pct >= 150) flakeScale = 1.08;
    else if (pct >= 100) flakeScale = 1.0 + Math.min(0.06, (pct - 100) * 0.0012);
    fSnowflake.style.transform = 'scale(' + flakeScale.toFixed(3) + ')';
  }

  if (fCore) {
    const stage = base >= 100 ? '4' : base >= 75 ? '3' : base >= 50 ? '2' : base >= 25 ? '1' : '0';
    fCore.dataset.frostStage = stage;
  }

  // 100% を超えている間だけ Hero ゲージがゆっくり回る（CSS は html.ui-frost に閉じている＝他テーマでは無害）
  const fBox = document.getElementById('gaugeBox');
  if (fBox) {
    if (pct > 100) fBox.dataset.frostSpin = '1';
    else if (fBox.removeAttribute) fBox.removeAttribute('data-frost-spin');
  }
  _frostProgressFx(base);
}

// ── 🪐 Celestial：段が上がった瞬間の演出（2026-09-29）─────────────────────────
// 25/50/75% … 起き上がり切った環（#celArm0〜2）が白く閃いて止まり、波紋（#celArmRip）が出る
// 100%      … 組み上がった天球（#celArm）がくるりと一回転する
// ⚠️ 予定表は Liquid の _liqFxLater / _liqFxPulse を共用する（Frost と同じ）。最初の描画は 0% から伸びたものとして扱う。
const CEL_ARM_MARKS = [25, 50, 75];
let _celPrevBase = null;

function _celFxOk() {
  if (!document.documentElement.classList.contains('ui-celestial')) return false;
  if (_reducedMotion() || document.hidden) return false;
  const box = document.getElementById('gaugeBox');
  if (!box) return false;
  const r = box.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
}
function _celProgressFx(base) {
  const prev = _celPrevBase == null ? 0 : _celPrevBase;
  _celPrevBase = base;
  if (!(base > prev) || !_celFxOk()) return;
  // 環は .85s の ease-out で開く＝割合 f に届くのはおおよそ 850·f² ms 後
  const reach = (m) => 850 * Math.pow(Math.min(1, (m - prev) / (base - prev)), 2);
  const rip = document.getElementById('celArmRip');
  let n = 0;
  CEL_ARM_MARKS.forEach((m, k) => {
    if (!(prev < m && base >= m)) return;
    // まとめて越えたときは1段ずつずらす（波紋は同じ要素を使い回すので、前の段を見せ切ってから次へ）
    _liqFxLater(Math.max(reach(m), n++ * 520), () => {
      _liqFxPulse(document.getElementById('celArm' + k), 'cel-lock', 1100);
      _liqFxPulse(rip, 'cel-go', 1100);
    });
  });
  if (prev < 100 && base >= 100) {
    _liqFxLater(Math.max(900, n * 520), () => {
      _liqFxPulse(document.getElementById('celArm'), 'cel-spin', 1600);
      _liqFxPulse(rip, 'cel-go', 1100);
    });
  }
}

// ── ❄️ Frost：段が上がった瞬間の演出（2026-09-14c）─────────────────────────
// 25/50/75% … 前線の位置から霜の枝が「パキッ」と伸びる（#frostSnapBranches.fr-go）
// 100%      … 雪結晶が30°ひねりながら開き（#frostSnowflakeDendrite.fr-bloom）、頂点から光芒（#frostBloomRays.fr-go）、
//              白い氷の破片が飛ぶ（MecFX.burst・additive:false＝光の玉にしない）
// ⚠️ 予定表は Liquid の _liqFxLater / _liqFxPulse を共用する（タイマー1本の約束をテーマごとに増やさない）。
// ⚠️ 最初の描画は 0% から伸びたものとして扱う（Liquid の飛沫と同じ）。
const FROST_SNAP_MARKS = [25, 50, 75];
let _frostPrevBase = null;

function _frostFxOk() {
  if (!document.documentElement.classList.contains('ui-frost')) return false;
  if (_reducedMotion() || document.hidden) return false;
  const box = document.getElementById('gaugeBox');
  if (!box) return false;
  const r = box.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
}
function _frostProgressFx(base) {
  const prev = _frostPrevBase == null ? 0 : _frostPrevBase;
  _frostPrevBase = base;
  if (!(base > prev) || !_frostFxOk()) return;
  // 氷は .75s の ease-out で伸びる＝割合 f に届くのはおおよそ 750·f² ms 後
  const reach = (m) => 750 * Math.pow(Math.min(1, (m - prev) / (base - prev)), 2);
  const snap = document.getElementById('frostSnapBranches');
  let n = 0;
  FROST_SNAP_MARKS.forEach((m) => {
    if (!(prev < m && base >= m) || !snap) return;
    // まとめて越えたときは1段ずつずらす（同じ要素を使い回すので、前の段を見せ切ってから次へ）
    _liqFxLater(Math.max(reach(m), n++ * 520), () => {
      snap.style.transform = 'scale(' + (m / 100).toFixed(2) + ')';
      _liqFxPulse(snap, 'fr-go', 1000);
    });
  });
  if (prev < 100 && base >= 100) {
    _liqFxLater(Math.max(800, n * 520), () => {
      _liqFxPulse(document.getElementById('frostSnowflakeDendrite'), 'fr-bloom', 1400);
      _liqFxPulse(document.getElementById('frostBloomRays'), 'fr-go', 1300);
      const box = document.getElementById('gaugeBox');
      if (box && window.MecFX && MecFX.burst && _fxOk()) {
        const r = box.getBoundingClientRect();
        MecFX.burst(r.left + r.width / 2, r.top + r.height / 2, {
          count: 22, tier: 3, shapes: ['shard', 'square'], gravity: 900, upBias: 140, additive: false,
          colors: ['#FFFFFF', '#E6F7FF', '#A9DDFF', '#FFD9F2', '#FFF4C2']
        });
      }
    });
  }
}

function _driveGauge(pct) {
  const box = document.getElementById('gaugeBox');
  const val = document.getElementById('gaugeVal');
  const ovf = document.getElementById('gaugeOvf');
  const dot = document.getElementById('gaugeDot');
  const base = Math.min(100, Math.max(0, pct));
  const over = Math.min(100, Math.max(0, pct - 100));   // 200%超は2周目も満タンで頭打ち
  const tier = _goalTier(pct);

  // CSS の ringDraw が backwards fill で全長から引くので、ここは終値を置くだけ
  if (val) val.style.strokeDashoffset = String(GAUGE_C * (1 - base / 100));
  if (ovf) ovf.style.strokeDashoffset = String(GAUGE_C * (1 - over / 100));
  // 光点は「いま描き終わった先端」に置く。2周目に入っていればそちらの先端
  if (dot) dot.style.transform = 'rotate(' + ((over > 0 ? over : base) * 3.6) + 'deg)';
  if (box) {
    box.dataset.tier = String(tier);
    // 第1位: オーバードライブ（100%以上で覚醒、150%以上でハイパー）
    if (pct >= 150) box.dataset.overdrive = 'hyper';
    else if (pct >= 100) box.dataset.overdrive = 'true';
    else if (box.removeAttribute) box.removeAttribute('data-overdrive');
  }

  // 全8テーマ完全差別化：各テーマ固有の進捗描画
  if (typeof _driveThemeGauge === 'function') {
    _driveThemeGauge(pct, base, over, tier);
  }

  // 第3位: 流体サージ波（進捗の軌跡に沿うエネルギー波）
  const surge = document.getElementById('gaugeSurgeWave');
  if (surge) surge.style.strokeDashoffset = String(GAUGE_C * (1 - base / 100));

  // 第3位: マイルストーンノード（25%, 50%, 75%, 100%）
  const msGroup = document.getElementById('gaugeMilestones');
  if (msGroup && msGroup.querySelector) {
    const n25 = msGroup.querySelector('.node-25');
    const n50 = msGroup.querySelector('.node-50');
    const n75 = msGroup.querySelector('.node-75');
    const n100 = msGroup.querySelector('.node-100');
    if (n25) n25.classList.toggle('active', pct >= 25);
    if (n50) n50.classList.toggle('active', pct >= 50);
    if (n75) n75.classList.toggle('active', pct >= 75);
    if (n100) n100.classList.toggle('active', pct >= 100);
  }

  // 同期の再描画で毎回押すと煩いので、段が上がったときだけ
  if (tier <= _gaugeTierShown) return;
  const wasTier = _gaugeTierShown;
  _gaugeTierShown = tier;
  if (tier <= 0) return;
  // D6(2026-08-14): 目標に到達した回だけ真鍮の刻印を押す。
  // 段5（100%）へ上がった一度きりで、以降の再描画・150%超では押し直さない。
  if (tier >= 5 && wasTier < 5) setTimeout(() => _stampGoalSeal(), over > 0 ? 2200 : 1150);
}

// D6: 目標達成の刻印。テーマごとに固有の祝砲を放つ
// ⚠️ ハブの紙吹雪（MecFX.confetti）は 2026-10-01 に全テーマで撤去した（うるさい・ユーザー判断）。刻印・ミッション全達成・昇格・週の結果発表も含めて、ハブでは撒かないこと。
function _stampGoalSeal() {
  if (!_fxOk()) return;
  const box = document.getElementById('gaugeBox');
  const ring = box && (box.querySelector('.gauge-ring') || box);
  const c = _centerOf(ring);
  if (!c) return;
  const r = Math.min(c.r.width, c.r.height);
  const curTheme = window.MecUITheme ? MecUITheme.get() : (document.documentElement.classList.contains('ui-brass') ? 'brass' : 'aurora');

  if (curTheme === 'brass') {
    MecFX.stamp(c.x, c.y, {
      color: '#E0C25E', size: r * 1.1, thick: 5, ticks: 18, rot: -6, ttl: 1.4
    });
    // 【真鍮機構】アイリスシャッターの豪快開放 ＆ スチーム・大歯車展開 (Brass限定・点線円は完全撤廃)
    if (MecFX.irisShutter) MecFX.irisShutter(c.x, c.y, { maxR: r * 1.5, blades: 14, color: '#FFD700', thickness: 3.6 });
    MecFX.burst(c.x, c.y, {
      count: 52, colors: ['#FFD700', '#FFA040', '#FFFFFF', '#C9A227'],
      shapes: ['gem', 'star', 'shard'], tier: 6, scale: 2.0, speed: 720, glow: true, additive: true
    });
    MecFX.gears(c.x, c.y, { count: 28, spread: 400, min: 14, max: 30, gravity: 520, w: 20, delay: .1 });
    // 全方位スチーム大爆発（四方八方からの大蒸気噴出）
    MecFX.steam(c.x - c.r * .8, c.y + c.r * .3, { count: 10, w: c.r * .8, rise: 190, min: 40, max: 80, alpha: .45, vx: -170 });
    MecFX.steam(c.x + c.r * .8, c.y + c.r * .3, { count: 10, w: c.r * .8, rise: 190, min: 40, max: 80, alpha: .45, vx: 170 });
    MecFX.steam(c.x, c.y - c.r * .6, { count: 8, w: c.r * .7, rise: 170, min: 36, max: 70, alpha: .4 });
    return;
  }

  if (curTheme === 'aurora') {
    MecFX.burst(c.x, c.y, {
      count: 50, colors: ['#00DFD8', '#7928CA', '#FFFFFF', '#0070F3', '#FF0080'],
      shapes: ['gem', 'star'], tier: 6, scale: 2.0, speed: 650, glow: true, additive: true
    });
    return;
  }

  if (curTheme === 'cyber') {
    MecFX.burst(c.x, c.y, {
      count: 50, colors: ['#00E5FF', '#00FF9D', '#FFFFFF', '#0070F3'],
      shapes: ['shard', 'star'], tier: 6, scale: 2.0, speed: 700, glow: true, additive: true
    });
    return;
  }

  if (curTheme === 'liquid') {
    if (MecFX.rippleInterference) MecFX.rippleInterference(c.x, c.y, { maxR: r * 1.8, color: '#FF007F' });
    if (MecFX.bubbles) MecFX.bubbles(c.x, c.y, { count: 36, colors: ['#FF007F', '#00F2FE', '#FFD166', '#7928CA', '#FFFFFF'] });
    if (MecFX.dust) MecFX.dust({ count: 32, colors: ['#FF007F', '#00F2FE', '#FFD166', '#FFFFFF'] });
    MecFX.burst(c.x, c.y, {
      count: 36, colors: ['#FF007F', '#7928CA', '#00F2FE', '#FFD166', '#FFFFFF'],
      shapes: ['circle'], tier: 5, scale: 1.2, speed: 420, glow: true
    });
    return;
  }

  if (curTheme === 'kintsugi') {
    if (MecFX.kintsugiCrack) {
      MecFX.kintsugiCrack(c.x, c.y, { maxR: r * 2.5, branches: 14, goldLeafCount: 120 });
    } else {
      MecFX.burst(c.x, c.y, {
        count: 50, colors: ['#F5D061', '#D9383A', '#FFFFFF', '#D4AF37'],
        shapes: ['shard', 'star'], tier: 6, scale: 2.0, speed: 680, glow: true, additive: true
      });
    }
    if (MecFX.slashRibbon) MecFX.slashRibbon(c.x, c.y, { color: '#F5D061', len: 320 });
    return;
  }

  if (curTheme === 'celestial') {
    MecFX.dust({ count: 28, colors: ['#FFFDF0', '#FFD166', '#8A2BE2', '#48CAE4'] });
    MecFX.burst(c.x, c.y, {
      count: 55, colors: ['#FFFDF0', '#FFD166', '#8A2BE2', '#48CAE4', '#FFFFFF'],
      shapes: ['star', 'gem'], tier: 6, scale: 2.2, speed: 680, glow: true, additive: true
    });
    return;
  }

  if (curTheme === 'abyss') {
    if (MecFX.rippleInterference) MecFX.rippleInterference(c.x, c.y, { maxR: r * 1.4, color: '#00FFA3' });
    MecFX.burst(c.x, c.y, {
      count: 50, colors: ['#00FFA3', '#00B4D8', '#64FFDA', '#FFFFFF'],
      shapes: ['circle', 'gem'], tier: 6, scale: 2.0, speed: 620, glow: true, additive: true
    });
    MecFX.bubbles(c.x, c.y, { count: 24, colors: ['#00FFA3', '#00B4D8', '#64FFDA'] });
    return;
  }

  if (curTheme === 'frost') {
    if (MecFX.shatter) MecFX.shatter(c.x, c.y, { count: 32, colors: ['#70D6FF', '#FFFFFF', '#A0E7E5'] });
    MecFX.burst(c.x, c.y, {
      count: 50, colors: ['#70D6FF', '#FFFFFF', '#A0E7E5', '#00DFD8'],
      shapes: ['shard', 'star'], tier: 6, scale: 2.0, speed: 700, glow: true, additive: true
    });
    return;
  }
}

// 連続日数の色（data-ember）。数字が熱を持つだけで粒子は出さない。
// ⚠️ 熾火の 🔥 粒子・ヒーローの星屑・ゲージの常時粒子・段の祝砲は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。
function _emberTier(days) {
  if (days >= 30) return 4;
  if (days >= 14) return 3;
  if (days >= 7)  return 2;
  if (days >= 3)  return 1;
  return 0;
}
function _setStreakEmber(streak) {
  const el = document.getElementById('statStreak');
  if (el) el.dataset.ember = String(_emberTier(streak));
}

// ヘッダー下端のスクロール進捗。
// scroll イベントを使うのはここだけ（進捗そのものがスクロール量なので IO では出せない）。
// passive + rAF で1フレーム1回に間引く。
function _initScrollProgress() {
  const bar = document.getElementById('hubProg');
  if (!bar) return;
  let ticking = false;
  const upd = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  };
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(upd);
  }, { passive: true });
  upd();
}

// 押した場所で弾ける。iPad で「触った」感触が出る
function _initTapBurst() {
  if (_reducedMotion()) return;
  document.addEventListener('pointerdown', e => {
    if (!_fxOk()) return;
    const hit = e.target.closest('.tile, .cta-main, .cta-sub, .hub-icon, .menu-row, .chapter-row, .mindmap-btn');
    if (!hit) return;
    // ヒーローのボタンだけは性格別の色で撒く（🔔復習=青 / 📚全科目=緑 / 🔁誤答=赤）。
    // 席ではなく中身で決まるので、主ボタンの色は日によって入れ替わる（_ctaColors）。
    const cta = hit.classList.contains('cta-main') || hit.classList.contains('cta-sub');
    if (cta && hit.classList.contains('is-off')) return;
    MecFX.burst(e.clientX, e.clientY, {
      tier: cta ? 3 : 2, count: cta ? 18 : 10,
      colors: cta ? _ctaColors(hit) : [_accent(), '#FFFFFF'],
      shapes: cta ? ['circle', 'star'] : ['circle'],
      speed: cta ? 300 : 260, gravity: 520, glow: cta, additive: cta
    });
  }, { passive: true });
}

/* ══════════ D2: 同期の歯車（2026-08-14）══════════
   Gist同期は今まで完全に無演出で、成功も失敗も文字が入れ替わるだけだった。
   盤面の意匠（真鍮の歯車）がそのまま「機械が動いている／噛み合った」の比喩になる。
   状態は progress.js が投げる 'mec:syncstatus' を購読する（演出は progress.js に
   持たせない＝共有モジュールなので study.html・stats.html へ漏れる）。 */
const SYNC_BRASS = ['#C9A227', '#E0C25E', '#B87333'];
let _syncFxTimer = null;
let _syncFxState = '';

function _syncBadgeEl() { return document.querySelector('.mec-sync-badge'); }

function _stopSyncFx() {
  clearInterval(_syncFxTimer);
  _syncFxTimer = null;
  const b = _syncBadgeEl();
  if (b) b.removeAttribute('data-fx');
}

// 同期中：軸から蒸気、噛み合いから小さな歯車。1.1秒ごとに控えめに撒く
function _startSyncFx() {
  _stopSyncFx();
  const b = _syncBadgeEl();
  if (b) b.setAttribute('data-fx', 'spin');
  if (_reducedMotion()) return;
  const puff = () => {
    if (!_fxOk()) return;
    const c = _centerOf(_syncBadgeEl());
    if (!c) return;
    const isBrass = document.documentElement.classList.contains('ui-brass');
    if (isBrass) {
      MecFX.steam(c.x, c.r.bottom - 2, { count: 3, w: 12, rise: 46, min: 12, max: 24, alpha: .34, grow: 2.2 });
      if (MecFX.gears) MecFX.gears(c.x + c.r.width * .34, c.y, { count: 1, spread: 70, min: 7, max: 11, gravity: 240, w: 4 });
    }
  };
  puff();
  _syncFxTimer = setInterval(puff, 1100);
}

// 失敗：噛み合わずに蒸気が抜け、破片がこぼれる（赤は使わない＝盤面の色で語る）
function _syncFxFail() {
  _stopSyncFx();
  if (!_fxOk()) return;
  const c = _centerOf(_syncBadgeEl());
  if (!c) return;
  MecFX.steam(c.x, c.y, { count: 8, w: 18, rise: 70, min: 18, max: 40, alpha: .45, vx: 26 });
  MecFX.shatter(c.x, c.r.bottom - 2, { count: 10, w: c.r.width * .8, colors: SYNC_BRASS, spread: 150, up: 40 });
}

/* D1 起動シーケンス（四隅の金具が開く＋軸から蒸気）は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。 */

function _initSyncFx() {
  const badge = _syncBadgeEl();
  if (badge) _syncFxState = badge.dataset.status || '';
  addEventListener('mec:syncstatus', e => {
    const st = (e.detail && e.detail.status) || '';
    if (st === _syncFxState) return;          // 同じ状態の再通知では鳴らさない
    const was = _syncFxState;
    _syncFxState = st;
    if (st === 'syncing') { _startSyncFx(); return; }
    // 完了の演出（刻印の輪＋金の輪＋歯車）は 2026-09-28 に撤去した（ユーザー判断）。戻さないこと。
    if (st === 'error' && was === 'syncing') { _syncFxFail(); return; }
    _stopSyncFx();
  });
  // タブを離れている間に回り続けないように（粒子は撒かれないがタイマーは無駄）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && _syncFxTimer) _stopSyncFx();
    else if (!document.hidden && _syncFxState === 'syncing') _startSyncFx();
  });
}

// 縦長タイルの達成率を、面に入った時にカウントアップさせる
function _tickLeadTile() {
  const el = document.querySelector('.tile.t-lead .tile-big');
  if (!el) return;
  const node = el.firstChild;                       // 数字のテキストノード（<i>%</i> の手前）
  if (!node || node.nodeType !== 3) return;
  const to = Number(node.nodeValue) || 0;
  if (_reducedMotion()) return;
  node.nodeValue = '0';
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 900);
    node.nodeValue = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// ── 達成ミッションのキラキラ（粒子は fx_engine.js の MecFX） ──────
// CSS 側は常時の光沢と✅の脈動。ここは「達成した瞬間の一発」を担当する。
// ハブでミッションが達成されることは無い（達成は study.html 側）ので、
// 初回表示では達成済みの行すべてに撒き、以後は同期で新たに達成された行だけに撒く。
// ハブ上でミッション行が出るのはこの2箇所だけ（今日＝#gmDaily／週間＝#gamifyPanel）
const MISSION_HOSTS = '.mfx';
function _missionRows() { return [...document.querySelectorAll(MISSION_HOSTS + ' .gm-mission')]; }

const _sparkledMissions = new Set();
function _sparkleMissions() {
  if (!_fxOk()) return;

  const curTheme = window.MecUITheme ? MecUITheme.get() : (document.documentElement.classList.contains('ui-brass') ? 'brass' : 'aurora');
  const rows = _missionRows();
  const doneRows = rows.filter(r => r.classList.contains('done'));
  let n = 0;

  // テーマ別カラー設定
  let themeColors, themeShapes;
  if (curTheme === 'brass') {
    themeColors = ['#E0C25E', '#FFD700', '#B87333', '#FFFFFF'];
    themeShapes = ['circle', 'shard'];
  } else if (curTheme === 'cyber') {
    themeColors = ['#00E5FF', '#00FF9D', '#FFFFFF'];
    themeShapes = ['shard', 'star'];
  } else if (curTheme === 'liquid') {
    themeColors = ['#FF007F', '#00F2FE', '#7928CA', '#FFFFFF'];
    themeShapes = ['circle', 'gem'];
  } else if (curTheme === 'kintsugi') {
    themeColors = ['#F5D061', '#D9383A', '#FFFFFF', '#D4AF37'];
    themeShapes = ['shard', 'star'];
  } else if (curTheme === 'celestial') {
    themeColors = ['#FFD166', '#8A2BE2', '#48CAE4', '#FFFFFF'];
    themeShapes = ['star', 'gem'];
  } else if (curTheme === 'abyss') {
    themeColors = ['#00FFA3', '#00B4D8', '#64FFDA', '#FFFFFF'];
    themeShapes = ['circle', 'gem'];
  } else if (curTheme === 'frost') {
    themeColors = ['#70D6FF', '#FFFFFF', '#A0E7E5', '#E0F7FA'];
    themeShapes = ['shard', 'star'];
  } else { // aurora
    themeColors = ['#00DFD8', '#7928CA', '#FFFFFF', '#0070F3'];
    themeShapes = ['gem', 'star'];
  }

  doneRows.forEach((row, i) => {
    const key = (row.querySelector('.gm-mission-lbl') || {}).textContent || ('m' + rows.indexOf(row));
    if (_sparkledMissions.has(key)) return;
    const c = _centerOf(row);
    if (!c) return;
    _sparkledMissions.add(key);
    n++;
    const isRand = row.classList.contains('is-random');
    const fxColors = isRand ? ['#EC4899', '#A855F7', '#38BDF8', '#FFD166', '#FFFFFF'] : themeColors;
    const fxShapes = isRand ? ['star', 'gem', 'shard'] : themeShapes;
    setTimeout(() => {
      const icX = c.r.left + 24;
      if (isRand && MecFX.glyphBurst) {
        MecFX.glyphBurst(icX, c.y, { glyphs: ['🎲', '✨', '⭐', '💎'], count: 4, spread: 85, w: 24 });
      }
      if (MecFX.sparks && curTheme === 'brass' && !isRand) {
        MecFX.sparks(icX, c.y, { count: 6, colors: themeColors, speed: 120, maxR: 16 });
      }
      MecFX.burst(icX, c.y, {
        tier: isRand ? 3 : 2, count: isRand ? 18 : 12, colors: fxColors, shapes: fxShapes, speed: isRand ? 190 : 160
      });
      MecFX.dust({ count: isRand ? 10 : 6, colors: fxColors, speed: 60 });
    }, i * 130);
  });

  // 全部達成していたら、行ごとの粒子に加えてテーマ別の大祝砲を放つ
  if (n > 0 && doneRows.length === rows.length && rows.length > 0) {
    const c = _centerOf(doneRows[doneRows.length - 1]);
    if (!c) return;
    setTimeout(() => {
      MecFX.burst(c.x, c.y, {
        tier: 4, count: 36, colors: themeColors, shapes: themeShapes
      });
    }, doneRows.length * 130 + 120);
  }
}

// 達成の緑。
const MISSION_GREEN = '#3DD68C';

// 🏆 レベルアップ・アセンション（昇格）カットイン
function openAscension(newLv, title) {
  const overlay = document.getElementById('ascensionOverlay');
  if (!overlay) return;
  document.getElementById('ascensionTitle').textContent = 'Lv.' + newLv;
  document.getElementById('ascensionDesc').textContent = '臨床称号「' + (title || '医師') + '」に昇格しました！';
  overlay.style.display = 'flex';
}
function closeAscension() {
  const overlay = document.getElementById('ascensionOverlay');
  if (overlay) overlay.style.display = 'none';
}

// 全達成なら見出しの件数を緑にして脈打たせる。
// ⚠️ 画面中央の紙吹雪（旧 _fireGrandCeremony）は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。
function _markAllDone() {
  const host = document.getElementById('gmDaily');
  const cnt = document.getElementById('gmDailyCnt');
  if (!host || !cnt) return;
  const core = [...host.querySelectorAll('.gm-mission[data-tier="core"]')];
  const allDone = core.length > 0 && core.every(r => r.classList.contains('done'));
  cnt.classList.toggle('all', allDone);
}

function _watchGamifyPanel() {
  const panel = document.getElementById('gamifyPanel');
  if (!panel || !('MutationObserver' in window)) return;
  let t = 0;
  new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => { _markAllDone(); _sparkleMissions(); }, 150);
  }).observe(panel, { childList: true });
}

// 達成行から時々ひと粒（_startMissionAmbient）は 2026-10-01 に撤去した（ユーザー判断）。戻さないこと。

// 達成行を押すとテーマ別の祝いをやり直す
function _initMissionTap() {
  document.addEventListener('pointerdown', e => {
    const row = e.target.closest('.mfx .gm-mission.done');
    if (!row || !_fxOk()) return;
    const isRand = row.classList.contains('is-random');
    const curTheme = window.MecUITheme ? MecUITheme.get() : (document.documentElement.classList.contains('ui-brass') ? 'brass' : 'aurora');
    
    let colors, shapes;
    if (isRand) {
      colors = ['#EC4899', '#A855F7', '#38BDF8', '#FFD166', '#FFFFFF'];
      shapes = ['star', 'gem', 'shard'];
      if (MecFX.glyphBurst) {
        MecFX.glyphBurst(e.clientX, e.clientY, { glyphs: ['🎲', '✨', '⭐', '💎'], count: 5, spread: 90, w: 24 });
      }
    } else if (curTheme === 'brass') {
      colors = ['#FFD700', '#E0C25E', '#B87333'];
      shapes = ['circle', 'shard'];
    } else if (curTheme === 'cyber') {
      colors = ['#00E5FF', '#00FF9D', '#FFFFFF'];
      shapes = ['shard', 'star'];
    } else if (curTheme === 'liquid') {
      colors = ['#FF007F', '#00F2FE', '#7928CA'];
      shapes = ['circle', 'gem'];
    } else if (curTheme === 'kintsugi') {
      colors = ['#F5D061', '#D9383A', '#FFFFFF'];
      shapes = ['shard', 'star'];
    } else if (curTheme === 'celestial') {
      colors = ['#FFD166', '#8A2BE2', '#48CAE4'];
      shapes = ['star', 'gem'];
    } else if (curTheme === 'abyss') {
      colors = ['#00FFA3', '#00B4D8', '#64FFDA'];
      shapes = ['circle', 'gem'];
    } else if (curTheme === 'frost') {
      colors = ['#70D6FF', '#FFFFFF', '#A0E7E5'];
      shapes = ['shard', 'star'];
    } else {
      colors = ['#00DFD8', '#7928CA', '#FFFFFF'];
      shapes = ['gem', 'star'];
    }

    MecFX.burst(e.clientX, e.clientY, {
      tier: isRand ? 3 : 2, count: isRand ? 18 : 14, colors: colors, shapes: shapes, speed: 200
    });
  }, { passive: true });
}

// ── ヒーローの入場（2026-10-01 に作り直し）──────────────────────────
// ① 大きな読み値（.hero-fig）… rAF で .num-in を付ける。CSS だけで走らせると、テーマの CSS を
//    待つ間に時計が進み、画面に出る前に終わっていた（実測：Brass で入場の終わり 950ms・最初の描画
//    940ms／Aurora・Liquid はテーマの animation に上書きされて一度も走っていなかった）。
//    JS で付けても、テーマによっては最初の描画より前に時計が進む（実測：Frost は始まり 302ms・
//    最初の描画 884ms＝ほぼ終わってから写る）。そこで .num-in / .cta-in は html に .hub-painted が
//    付くまで止めておく（止まっている間は入場の頭の姿）。.hub-painted は最初の描画（FCP）の後に付ける。
// ② ボタン（.hero-cta a）… 画面に入ったときに .cta-in を付ける。試験から戻るとスクロール位置が
//    復元されてボタンが画面の外にあり、入場が見えないまま終わっていた。
//    ⚠️ スクロール位置の復元（再読み込み・戻る）は load の後に来る。その2つは判定を load まで
//       待つこと（先に測ると「最上部＝画面内」と誤って、画面の外で入場を走らせる）。
// ⚠️ どちらも「付けなければ素の姿で見えている」形。opacity:0 から始めて JS で外す形にしないこと
//    （非表示タブでは rAF が来ない＝白紙のまま残る）。
// ⚠️ .cta-in は走り終えたら外す。付けたままだと .cta-main:active の押し込み（ctaPress）を詳細度で潰す。
let _ctaInIO = null;
function _ctaEnter(wait) {
  const links = document.querySelectorAll('.hero-cta a');
  if (!links.length) return;
  links.forEach(a => {
    a.classList.remove('cta-in');
    a.style.setProperty('--cta-in-wait', wait + 's');
    void a.offsetWidth;                       // 付け直しでもアニメを頭から走らせる
    a.classList.add('cta-in');
    const off = e => {
      if (e && e.animationName !== 'ctaIn') return;
      a.classList.remove('cta-in');
      a.removeEventListener('animationend', off);
    };
    a.addEventListener('animationend', off);
    // 非表示タブでは animationend が来ないので時間でも外す。⚠️ 時計は付けた瞬間ではなく
    //    最初の描画から進む（読み込み中は 0.4秒ほど遅れる＝実測）ので、尺より十分長く取る
    setTimeout(off, 4000);
  });
}
// 最初の描画が済んだら html に .hub-painted を付ける（入場の時計をそこから進める）。
// ⚠️ 観測できない環境・非表示タブでも止めっぱなしにしない＝2秒で必ず付ける。
function _markHubPainted() {
  const root = document.documentElement;
  if (root.classList.contains('hub-painted')) return;
  const mark = () => root.classList.add('hub-painted');
  setTimeout(mark, 2000);
  try {
    if (performance.getEntriesByName('first-contentful-paint').length) { mark(); return; }
    const po = new PerformanceObserver(l => {
      if (!l.getEntries().some(e => e.name === 'first-contentful-paint')) return;
      po.disconnect(); mark();
    });
    po.observe({ type: 'paint', buffered: true });
  } catch (e) { mark(); }
}
function _heroEnterArm() {
  if (_reducedMotion()) return;
  _markHubPainted();
  const cta = document.querySelector('.hero-cta');
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero-stat-row .hero-fig').forEach(el => el.classList.add('num-in'));
  });
  if (!cta) return;
  const armCta = () => requestAnimationFrame(() => {
    const inView = r => r.bottom > 0 && r.top < innerHeight;
    if (inView(cta.getBoundingClientRect())) { _ctaEnter(.34); return; }
    if (!('IntersectionObserver' in window)) return;
    if (_ctaInIO) _ctaInIO.disconnect();
    _ctaInIO = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      _ctaInIO.disconnect(); _ctaInIO = null;
      _ctaEnter(0);
    }, { threshold: .35 });
    _ctaInIO.observe(cta);
  });
  // 復元されうるのは「再読み込み」と「戻る／進む」だけ。普通に開いた日は最上部から始まるので
  // load を待たない（待つと、描画の後でボタンが一度消えてから出直して見える）
  let nav = '';
  try { nav = (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (e) {}
  if (document.readyState === 'complete' || (nav !== 'reload' && nav !== 'back_forward')) armCta();
  else addEventListener('load', armCta, { once: true });
}

// ── スクロールで下の段を出す（scroll イベントではなく IntersectionObserver） ──
function _initScrollReveal() {
  const targets = document.querySelectorAll('.rv-s');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {   // 非対応ブラウザでは隠したままにしない
    targets.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      obs.unobserve(e.target);   // 出したら二度と戻さない（往復すると酔う）
      // タイルが面に入ったら、縦長タイルの達成率もそこで回し始める
      if (e.target.id === 'hubTiles') setTimeout(_tickLeadTile, 260);
      // 週間ミッションは折り返しの下にいるので、面に入ってから祝う
      if (e.target.classList.contains('hub-sec')) setTimeout(_sparkleMissions, 420);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  targets.forEach(el => io.observe(el));
}

// ── メニュー（旧ヘッダーのボタン群をここへ集約した） ─────────────
function openMenuModal()  {}
function closeMenuModal() {}

// ── レベル・ミッション・実績の開閉 ───────────────────────────────
// この端末だけの UI 設定（同期しない）。progress.js の同期キーには足さないこと。
const K_HUB_GM = 'mec_hub_gm_open_v1';
function toggleGmSection() {
  const btn = document.getElementById('gmToggle');
  const panel = document.getElementById('gamifyPanel');
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!open));
  panel.hidden = open;
  localStorage.setItem(K_HUB_GM, open ? '0' : '1');
}
function initGmSection() {
  if (localStorage.getItem(K_HUB_GM) !== '0') return;
  const btn = document.getElementById('gmToggle');
  const panel = document.getElementById('gamifyPanel');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (panel) panel.hidden = true;
}

// エラー報告（0件なら ☰ の点も行も出さない）。progress.js の共有ビューアが全消去したあとも呼ばれる
function updateErrBtn() {
  const n = (window.mecGetErrorReports ? window.mecGetErrorReports() : []).length;
  const btn = document.getElementById('hubErrBtn');
  const cnt = document.getElementById('hubErrCount');
  if (cnt) cnt.textContent = n;
  if (btn) btn.style.display = n > 0 ? 'inline-grid' : 'none';
}
window._mecUpdateErrBadge = updateErrBtn;

// ── キャッシュ削除＋再読み込み ─────────────────────────────────────
// study.html の同名関数と同じ挙動。confirm() は iOS PWA 等で表示されないことがあるため
// 2段階タップで確認する（1回目で赤くなり「再タップで実行」、3秒で自動解除）。
function _tapConfirm(btn, armedLabel) {
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
}

async function mecForceRefresh(btn) {
  if (!_tapConfirm(btn, '♻️再タップで実行')) return;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ 更新中…'; }
  try {
    // ① Service Worker のキャッシュを全削除（学習データは localStorage なので消えない）
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    // ② SW 自体を登録解除（次回ロードで新しい sw.js が入る）
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    // ③ ブラウザのHTTPキャッシュに残った旧シェルも cache:'reload' の再取得で上書きする
    const shell = ['index.html','study.html','stats.html','knowledge.html',
                   'vars.css','study.css','progress.js','study_exam.js','fx_engine.js',
                   'card_renderer.js','fixed_uids.js','gamify.js','chapters_meta.js',
                   'knowledge_notes.js','rate_index.js','sw.js'];
    await Promise.all(shell.map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
  } catch (e) { /* 失敗してもリロードは実行する */ }
  location.reload();
}

// ── 同期設定 ────────────────────────────────────────────────────
function openSyncModal() {
  if (window.MECSync) {
    document.getElementById('tokenInput').value = MECSync.getToken();
    document.getElementById('gistIdInput').value = MECSync.getGistId();
  }
  document.getElementById('syncModal').classList.add('open');
}
function closeSyncModal() {
  document.getElementById('syncModal').classList.remove('open');
}

async function saveAndSync() {
  const token = document.getElementById('tokenInput').value.trim();
  const gistId = document.getElementById('gistIdInput').value.trim();
  const result = document.getElementById('syncResult');
  if (!token) { showSyncResult('error', 'トークンを入力してください'); return; }
  if (window.MECSync) {
    MECSync.setToken(token);
    MECSync.setGistId(gistId); // 空欄なら '' で上書き（古い値をクリア）
    showSyncResult('ok', '🔄 接続確認中…');

    // Gist ID が空の場合は pull をスキップして直接 push（新規作成）
    if (gistId) {
      const pullRes = await MECSync.syncFromGist();
      if (pullRes.status === 'error') {
        const msg = pullRes.code === 404
          ? 'Gist ID が見つかりません。空欄にして再試行してください。'
          : `取得エラー (${pullRes.code || pullRes.message})。トークンを確認してください。`;
        showSyncResult('error', msg);
        return;
      }
    }

    showSyncResult('ok', '🔄 保存中…');
    const pushRes = await MECSync.pushToGist();
    const newId = MECSync.getGistId();
    document.getElementById('gistIdInput').value = newId;
    if (pushRes && pushRes.status === 'ok') {
      showSyncResult('ok', `✅ 同期成功！Gist ID: ${newId}`);
      renderSubjects();
    } else {
      showSyncResult('error',
        'Gist への書き込みに失敗しました。\n' +
        '→ Classic トークン（Fine-grained ではない）を使っているか確認してください。\n' +
        '→ スコープは「gist」のみチェック。\n' +
        '→ Gist ID 欄を空にして再試行してください。'
      );
    }
  }
}

async function manualSync() {
  if (!window.MECSync || !MECSync.getToken()) {
    openSyncModal();
    return;
  }
  const pullRes = await MECSync.syncFromGist();
  if (pullRes.status === 'ok') {
    await MECSync.pushToGist();
    renderSubjects();
  } else {
    openSyncModal();
  }
}

function copySetupURL() {
  const token = localStorage.getItem('mec_gist_token') || '';
  const gistId = localStorage.getItem('mec_gist_id') || '';
  if (!token) { showSyncResult('error', 'トークンが未設定です。先に「保存して同期」を実行してください。'); return; }
  const encoded = btoa(JSON.stringify({ t: token, g: gistId }));
  const base = location.href.replace(/#.*$/, '').replace(/[^/]*$/, 'index.html');
  const url = base + '#mec:' + encoded;
  // iOSでは navigator.clipboard が拒否されることがあるので mecCopyText（execCommand先行）を使う
  const _copy = window.mecCopyText
    ? window.mecCopyText(url).then(ok => { if (!ok) throw new Error('copy refused'); })
    : navigator.clipboard.writeText(url);
  _copy
    .then(() => showSyncResult('ok', '📋 URLをコピーしました（トークンを含みます・base64は暗号化ではありません）。第三者に共有したりチャット等に貼り付けたりしないでください。別のデバイスでこのURLを開くと自動で設定されます。'))
    .catch(() => {
      // prompt() は iOS PWA / ダイアログ抑制設定で表示されないことがある（alert/confirm と同じ）。
      // モーダル内にURLを選択可能な状態で出して手動コピーしてもらう。
      const el = document.getElementById('syncResult');
      el.className = 'sync-result ok';
      el.style.display = 'block';
      el.textContent = '自動コピーできませんでした。下のURLを選択してコピーしてください（トークンを含むため第三者と共有しないこと）。';
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.readOnly = true;
      inp.value = url;
      inp.className = 'field-input';
      inp.style.cssText = 'margin:8px 0 0;font-size:11px;';
      inp.addEventListener('focus', () => inp.select());
      el.appendChild(inp);
      inp.focus();
      inp.select();
    });
}

function clearSyncToken() {
  if (window.MECSync) MECSync.clearToken();
  localStorage.removeItem('mec_gist_id');
  document.getElementById('tokenInput').value = '';
  document.getElementById('gistIdInput').value = '';
  showSyncResult('ok', '🗑️ トークンを削除しました。');
}

async function testToken() {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) { showSyncResult('error', 'トークンを入力してから検証してください'); return; }
  showSyncResult('ok', '🔄 検証中…');
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
      const u = await res.json();
      showSyncResult('ok', `✅ トークン有効！ GitHubユーザー: @${u.login}  (先頭: ${token.slice(0,6)}...)`);
    } else {
      const e = await res.json().catch(() => ({}));
      showSyncResult('error', `❌ 認証失敗 ${res.status}: ${e.message || ''}  先頭: ${token.slice(0,6)}...`);
    }
  } catch (e) {
    showSyncResult('error', `❌ ネットワークエラー: ${e.message}`);
  }
}

function showSyncResult(type, msg) {
  const el = document.getElementById('syncResult');
  el.className = 'sync-result ' + type;
  el.textContent = msg;
  el.style.display = 'block';
}

// ── JSON バックアップ / 復元 ──────────────────────────────────────
function exportBackup() {
  const keys = ['done_v2', 'flag_v2', 'activity_v1', 'myrate_v1', 'studytime_v1'];
  const payload = { _exportDate: new Date().toISOString() };
  keys.forEach(k => { try { payload[k] = JSON.parse(localStorage.getItem(k) || '{}'); } catch { payload[k] = {}; } });
  // 解答イベントログは配列（{}ではなく[]で初期化する）
  try { payload['mec_attempts_v1'] = JSON.parse(localStorage.getItem('mec_attempts_v1') || '[]'); } catch { payload['mec_attempts_v1'] = []; }
  // 上限からあふれて畳まれた分（progress.js の attCompact）。生ログだけでは古い日が欠ける
  try { payload['mec_attempts_roll_v1'] = JSON.parse(localStorage.getItem('mec_attempts_roll_v1') || '{}'); } catch { payload['mec_attempts_roll_v1'] = {}; }
  // 週ごとの弱点の推移（progress.js の weekRecord）。生ログからは作り直せない
  if (window.MECSync && MECSync.weekRead) payload['mec_weekly_v1'] = MECSync.weekRead();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mec_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSyncResult('ok', '📥 バックアップファイルをダウンロードしました');
}

// 復元の本体（確認後に実行）
function _applyBackupData(data) {
  // done, flag: ローカル優先
  ['done_v2', 'flag_v2'].forEach(k => {
    if (!data[k]) return;
    const local = JSON.parse(localStorage.getItem(k) || '{}');
    localStorage.setItem(k, JSON.stringify({ ...data[k], ...local }));
  });
  // activity, studytime: 日ごと最大値
  ['activity_v1', 'studytime_v1'].forEach(k => {
    if (!data[k]) return;
    const local = JSON.parse(localStorage.getItem(k) || '{}');
    Object.keys(data[k]).forEach(d => { local[d] = Math.max(local[d]||0, data[k][d]||0); });
    localStorage.setItem(k, JSON.stringify(local));
  });
  // myrate: correct/total を各フィールドの最大値で統合（progress.js の _mergeRemote と同一方針）
  if (data.myrate_v1) {
    const lr = JSON.parse(localStorage.getItem('myrate_v1') || '{}');
    Object.keys(data.myrate_v1).forEach(uid => {
      const r = data.myrate_v1[uid], l = lr[uid];
      if (!l) { lr[uid] = r; return; }
      lr[uid] = {
        correct: Math.max(l.correct || 0, r.correct || 0),
        total: Math.max(l.total || 0, r.total || 0),
      };
    });
    localStorage.setItem('myrate_v1', JSON.stringify(lr));
  }
  // attempts: 生ログは sess+n の union、畳んだ集計は sess ごとに上位集合を採る。
  // ⚠️ 規則は progress.js の attMerge / attStore が正本（同期と同じ関数を通す。旧実装はここに
  //    規則を書き写しており、上限が 2000 のまま取り残されて復元のたびに3,000件を捨てていた）。
  if ((Array.isArray(data.mec_attempts_v1) || data.mec_attempts_roll_v1) && window.MECSync && MECSync.attMerge) {
    let la = [];
    try { la = JSON.parse(localStorage.getItem('mec_attempts_v1') || '[]'); } catch {}
    const m = MECSync.attMerge(la, MECSync.attReadRoll(),
      Array.isArray(data.mec_attempts_v1) ? data.mec_attempts_v1 : [], data.mec_attempts_roll_v1 || {});
    MECSync.attStore(m.lines, m.roll);
  }
  // 週ごとの弱点の推移：規則は progress.js の weekMerge（同期と同じ関数を通す）
  if (data.mec_weekly_v1 && data.mec_weekly_v1.w && window.MECSync && MECSync.weekMerge) {
    try { localStorage.setItem(MECSync.WEEKLY_KEY, JSON.stringify(MECSync.weekMerge(MECSync.weekRead(), data.mec_weekly_v1))); } catch {}
  }
  showSyncResult('ok', `✅ 復元完了。ページを再読み込みします…`);
  setTimeout(() => location.reload(), 1200);
}

// confirm() は iOS PWA / Safari設定次第でダイアログを出さず即 false を返すため、
// ネイティブダイアログではなくモーダル内の実行ボタンで確認する。
function showSyncConfirm(msg, onOk) {
  const el = document.getElementById('syncResult');
  el.className = 'sync-result ok';
  el.style.display = 'block';
  el.textContent = '';
  el.append(msg + ' ');
  const btn = document.createElement('button');
  btn.textContent = '復元を実行';
  btn.style.cssText = 'margin-left:8px;padding:4px 12px;border-radius:var(--r-sm);border:none;background:var(--or);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;';
  btn.onclick = () => { el.style.display = 'none'; onOk(); };
  el.appendChild(btn);
}

function importBackup() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.done_v2) { showSyncResult('error', '無効なバックアップファイルです'); return; }
        const importCount = Object.keys(data.done_v2).length;
        showSyncConfirm(
          `バックアップに ${importCount} 問分のデータがあります。現在のデータと統合されます（より多い方を優先）。`,
          () => _applyBackupData(data)
        );
      } catch (e) { showSyncResult('error', '読み込み失敗: ' + e.message); }
    };
    reader.readAsText(file);
  };
  document.body.appendChild(input); input.click(); document.body.removeChild(input);
}

function checkSyncWarning() {
  const hasToken = !!localStorage.getItem('mec_gist_token');
  const done = JSON.parse(localStorage.getItem('done_v2') || '{}');
  const banner = document.getElementById('noSyncWarning');
  if (banner) banner.style.display = (!hasToken && Object.keys(done).length > 0) ? '' : 'none';
}

// ── 効果音設定 ────────────────────────────────────────────────────
// ── テーマ選択 ────────────────────────────────────────────────────
// 実際の配色は vars.css の html.th-*、クラス付与は theme.js（<head>で同期実行）。
// ここは選択UIだけを持つ。押した瞬間に画面全体へ反映される（再読込不要）。
function _renderHubUIThemeGrid() {
  const host = document.getElementById('hubUiThemeGrid');
  if (!host || !window.MecUITheme) return;
  const cur = MecUITheme.get();
  host.innerHTML = MecUITheme.list.map(t => `
    <button type="button" class="ui-theme-btn ${t.id === cur ? 'active' : ''}" style="--theme-accent:${t.accent}" onclick="selectHubUITheme('${t.id}')">
      <div class="ui-theme-preview" style="background:linear-gradient(135deg, ${t.colors.join(', ')})"></div>
      <div class="ui-theme-title">${t.name}</div>
      <div class="ui-theme-desc">${t.desc}</div>
    </button>
  `).join('');
}

function selectHubUITheme(id) {
  if (window.MecUITheme) MecUITheme.set(id);
  _renderHubUIThemeGrid();
  // 新テーマのゲージへ即時に描き直す
  try {
    const g = (typeof MecGamify !== 'undefined' && MecGamify.dailyGoal) ? MecGamify.dailyGoal() : null;
    if (g && typeof _driveGauge === 'function') _driveGauge(g.pct);
  } catch (e) {}
}

function openThemeModal() {
  _renderHubUIThemeGrid();
  document.getElementById('themeModal').classList.add('open');
}
function closeThemeModal() {
  document.getElementById('themeModal').classList.remove('open');
}

/* ハブの効果音プレビュー。ファイル名・音量・並びは sounds_index.js（window.MecSounds）が
   唯一の正本＝ここに表を持たない（2026-08-21）。以前は study_exam.js の表のミラーがここに
   あり、片方だけ増やすと黙って乖離した。
   ⚠️ 音を足すのは「sounds/{正解音|起動音|選択音}/ に置く → sounds/meta.json に1行 →
      node _work/build_sounds_index.js」の3手順。index.html は1文字も触らない。
   ⚠️ ハブは AudioContext を使わず <audio> でプレビューするので音量は 1 で頭打ち。
      vol>1 の素材（MHF 4.3 / アカツキ起動 9.8）は本番より小さく鳴る。 */
function _sndListHub(slot) {
  const l = window.MecSounds && window.MecSounds[slot];
  return Array.isArray(l) ? l : [];
}
function _sndFindHub(slot, key) { return _sndListHub(slot).find(s => s.key === key) || null; }
/* ⚠️ 'off'（無音）は 2026-09-10 に廃止した。保存済みの 'off' は「見当たらないキー」と
   同じ扱いで先頭＝既定へ落とす——localStorage は書き換えない（別端末の設定を壊さない）。 */
function _sndResolveHub(slot, stored) {
  if (stored && stored !== 'off' && _sndFindHub(slot, stored)) return stored;
  const first = _sndListHub(slot)[0];
  return first ? first.key : '';
}

function _renderHubSoundGrid(gridId, slot, attr, type) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const list = _sndListHub(slot);
  grid.textContent = '';
  if (!list.length) {
    grid.innerHTML = '<div style="opacity:.7;font-size:12px">sounds_index.js が読めていません'
      + '（sounds/ に音を置いて node _work/build_sounds_index.js を流してください）</div>';
    return;
  }
  const add = (key, label) => {
    const btn = document.createElement('button');
    btn.className = 'sound-btn';
    btn.dataset[attr] = key;
    btn.textContent = label;
    btn.addEventListener('click', () => saveSoundPref(type, key, btn));
    grid.appendChild(btn);
  };
  list.forEach(sp => add(sp.key, sp.label));
}

function openSoundModal() {
  _renderHubSoundGrid('selectSoundGrid', 'select', 'ssound', 'select');
  _renderHubSoundGrid('correctSoundGrid', 'correct', 'sound', 'correct');
  _renderHubSoundGrid('resultSoundGrid', 'result', 'rsound', 'result');
  // 印は保存値そのものではなく実在するキーへ解決した値に合わせる
  // （消したファイル・旧合成音のキーが残っていても、実際に鳴る方が光る）
  const sel = _sndResolveHub('select', localStorage.getItem('mec_select_sound_v1'));
  const cor = _sndResolveHub('correct', localStorage.getItem('mec_correct_sound_v1'));
  const res = _sndResolveHub('result', localStorage.getItem('mec_result_sound_v1'));
  // 起動音は毎回ランダム＝選択肢が1つしかない（無音は廃止）
  document.querySelectorAll('#selectSoundGrid .sound-btn').forEach(b => b.classList.toggle('sel', b.dataset.ssound === sel));
  document.querySelectorAll('#correctSoundGrid .sound-btn').forEach(b => b.classList.toggle('sel', b.dataset.sound === cor));
  document.querySelectorAll('#resultSoundGrid .sound-btn').forEach(b => b.classList.toggle('sel', b.dataset.rsound === res));
  document.querySelectorAll('#bootSoundGrid .sound-btn').forEach(b => b.classList.add('sel'));
  document.getElementById('soundModal').classList.add('open');
}
function closeSoundModal() {
  document.getElementById('soundModal').classList.remove('open');
}

function _previewWavFile(spec) {
  if (!spec) return;
  try {
    const a = new Audio('sounds/' + spec.file);
    a.volume = Math.max(0, Math.min(1, spec.vol == null ? 1 : spec.vol));
    a.play().catch(() => {});
  } catch (e) {}
}
function _previewSelectSound(value) { _previewWavFile(_sndFindHub('select', value)); }
function _previewCorrectSound(value) { _previewWavFile(_sndFindHub('correct', value)); }
function _previewResultSound(value) { _previewWavFile(_sndFindHub('result', value)); }
/* 「ランダム」の試聴＝押すたびに抽選し直す（何が入っているかを耳で確かめられる） */
function _previewBootSound(value) {
  const l = _sndListHub('boot');
  if (l.length) _previewWavFile(l[(Math.random() * l.length) | 0]);
}

function saveSoundPref(type, value, btn) {
  if (type === 'select') {
    localStorage.setItem('mec_select_sound_v1', value);
    document.querySelectorAll('#selectSoundGrid .sound-btn').forEach(b => b.classList.remove('sel'));
    _previewSelectSound(value);
  } else if (type === 'boot') {
    localStorage.setItem('mec_boot_sound_v1', value);
    document.querySelectorAll('#bootSoundGrid .sound-btn').forEach(b => b.classList.remove('sel'));
    _previewBootSound(value);
  } else if (type === 'result') {
    localStorage.setItem('mec_result_sound_v1', value);
    document.querySelectorAll('#resultSoundGrid .sound-btn').forEach(b => b.classList.remove('sel'));
    _previewResultSound(value);
  } else {
    localStorage.setItem('mec_correct_sound_v1', value);
    document.querySelectorAll('#correctSoundGrid .sound-btn').forEach(b => b.classList.remove('sel'));
    _previewCorrectSound(value);
  }
  btn.classList.add('sel');
}

// ── 初期化 ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initGmSection();
  _buildGears();      // ゲージの歯車の d を入れる。renderHub より前（描き直しの度に作らない）
  renderHub();
  checkSyncWarning();
  _initScrollReveal();
  _heroEnterArm();     // 大きな読み値とボタンの入場（ボタンは画面に入ったとき）
  _initScrollProgress();
  _initTapBurst();
  _initCtaRipple();   // E2: ヒーローのボタンのリップル
  _initCtaExit();     // E10: 遷移直前のひと呼吸（⚠️ 内部で必ず遷移させる保険つき）
  _initSyncFx();
  // 戻る操作で bfcache から復元されたときも、ボタンの入場を「画面に入ったとき」で張り直す
  addEventListener('pageshow', e => { if (e.persisted) _heroEnterArm(); });
  // 1日の最初のブリーフィング（hub_opening.js）。入場の数字が落ち着いてから出す。
  if (window.MecOpening) MecOpening.maybeShow(1100);
  _initMissionTap();
  // gamify.js は <head> で読まれるので _init（＝#gmDaily の描画）はこの前に済んでいる。
  // 粒子は入場アニメが落ち着いてから撒く
  _markAllDone();
  _watchGamifyPanel();
  setTimeout(_sparkleMissions, 700);
  // タイルは再描画で作り直されるので、個々ではなく親に1つだけ委譲で張る
  const tiles = document.getElementById('hubTiles');
  if (tiles) tiles.addEventListener('click', e => {
    const btn = e.target.closest('.tile[data-tile]');
    if (btn) toggleTile(btn);
  });
  // sync 完了後に再描画 + 警告再チェック。gamify.js の再描画も同じイベントで走るので、
  // 他端末で新たに達成されたミッションがあればここでキラキラする
  document.addEventListener('mecSyncComplete', () => {
    renderHub(); checkSyncWarning();
    // gamify.js が #gmDaily を作り直すので、状態クラスも撒き直しもここでやり直す
    _markAllDone();
    setTimeout(_sparkleMissions, 120);
  });
});
