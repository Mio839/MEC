// node _work/test_trophy_boss.js — トロフィー棚（trophy.js）とボス戦（boss.js）（2026-09-23）
// 実ソースを vm で読み込んで回す＋配線をソース検査する。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TROPHY = rd('trophy.js'), BOSS = rd('boss.js'), GAMIFY = rd('gamify.js');
const STUDY = rd('study.html'), EXAM = rd('study_exam.js'), HUB = rd('index.html'), SW = rd('sw.js'), PROG = rd('progress.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } }

function ctx(extra) {
  const store = {};
  const c = Object.assign({
    console, Math, Date, JSON, Number, String, Object, Array, Set, Map, isFinite, setTimeout, clearTimeout,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    document: { addEventListener() {}, getElementById: () => null, hidden: false },
  }, extra || {});
  c.window = c;
  vm.createContext(c);
  return c;
}

console.log('[1] 定着の判定（試験日ゲートで閾値も下がる）');
{
  const c = ctx(); vm.runInContext(TROPHY, c);
  const T = c.MecTrophy;
  ok(T.masteryDays('2026-09-23', '2027-02-06') === 21, '残り136日 → 21日');
  ok(T.masteryDays('2027-01-17', '2027-02-06') === 10, '残り20日 → 上限と同じ10日（直前期でも届く）');
  ok(T.masteryDays('2027-02-10', '2027-02-06') === 21, '試験日を過ぎたらゲートなし');
  ok(T.isMastered({ reps: 3, interval: 21 }, 21), 'reps3・間隔21 は定着');
  ok(!T.isMastered({ reps: 2, interval: 40 }, 21), '連続正解が2回では定着しない');
  ok(!T.isMastered({ reps: 5, interval: 12 }, 21), '間隔が足りなければ定着しない');
  ok(!T.isMastered({ reps: 0, interval: 1 }, 21), '誤答で reps=0 に戻れば外れる');
  // study.html の試験日ゲートと同じ割合
  const m = STUDY.match(/const SRS_EXAM_FRACTION\s*=\s*([\d.]+)/);
  ok(m && Number(m[1]) === T._consts.SRS_EXAM_FRACTION, 'SRS_EXAM_FRACTION が study.html と一致');
}

console.log('[2] 棚の集計');
{
  // gamify.js から chapterGrade だけを切り出して MecGamify として置く（本体は DOM を要求するため）
  const i0 = GAMIFY.indexOf('function chapterGrade(');
  const src = GAMIFY.slice(i0, GAMIFY.indexOf('\n  }\n', i0) + 4);
  const c = ctx(); vm.runInContext(src + '\nwindow.MecGamify = { chapterGrade };', c);
  vm.runInContext(TROPHY, c);
  const T = c.MecTrophy;
  const chapters = [
    { id: 'circ', name: '循環器', icon: '❤️', color: '#f00', chapters: [
      { prefix: 'circ_ch01', title: 'MEC循環器 第1章 循環器の基本 解答解説', count: 4 },
      { prefix: 'circ_ch02', title: 'MEC循環器 第2章 心不全 解答解説', count: 2 } ] },
    { id: 'memo', name: 'メモ', icon: '📝', chapters: [{ prefix: 'memo_ch01', count: 3 }] },
  ];
  const myrate = {
    circ_ch01_q1: { correct: 2, total: 2 }, circ_ch01_q2: { correct: 1, total: 1 }, circ_ch01_q3: { correct: 1, total: 1 },   // 4/4 → 金
    circ_ch02_q5: { correct: 0, total: 1 },                                                                                   // 半分(1/2)解答・0% → 銅
  };
  const done = { circ_ch01_q1: 1, circ_ch01_q2: 2, circ_ch01_q3: 1, circ_ch01_q4: 1, circ_ch02_q5: 1, circ_ch02_q6: 0 };
  const srs = { circ_ch01_q1: { reps: 3, interval: 30 }, circ_ch01_q2: { reps: 3, interval: 5 }, circ_ch02_q5: { reps: 4, interval: 22 } };
  const d = T.collect({ chapters, myrate, done, srs, thr: 21 });
  ok(d.subjects.length === 1, '自作・暗記メモは棚に並べない');
  const s = d.subjects[0];
  ok(s.total === 6 && s.done === 5, '済は周回0を数えない: ' + s.done);
  ok(s.gems === 2 && d.gems === 2, '定着 2問');
  ok(s.chapters[0].grade === 3 && s.chapters[0].cleared, '第1章は金メダル＋全問済');
  ok(s.chapters[1].grade === 1 && !s.chapters[1].cleared, '第2章は銅（半分解いて0%）・未制覇');
  ok(s.chapters[0].title === '循環器の基本', '章名から「MEC…第N章」「解答解説」を落とす: ' + s.chapters[0].title);
  ok(d.medals[3] === 1 && d.medals[1] === 1, 'メダルの内訳');
  ok(!s.cleared && d.clears === 0, '科目制覇はまだ');
  ok(T.gemOf(0).name === '—' && T.gemOf(0.01).name === '原石' && T.gemOf(0.8).name === 'ダイヤ', '宝石の段');
  ok(c.MecGamify.chapterGrade(10, 9, 4, 4) === 3 && c.MecGamify.chapterGrade(10, 7, 4, 4) === 2 && c.MecGamify.chapterGrade(10, 5, 1, 4) === 0,
    'gamify の chapterGrade（章の星と同じ式）を公開している');
}

console.log('[3] ボス戦のダメージと名前');
{
  const c = ctx(); vm.runInContext(BOSS, c);
  const B = c.MecBoss, K = B._consts;
  ok(B.damageOf(false, 1).dmg === K.DMG && !B.damageOf(false, 1).crit, '通常の正解');
  ok(B.damageOf(true, 1).dmg === K.DMG_HARD, '難問は大ダメージ');
  ok(B.damageOf(false, K.CRIT_EVERY).crit && B.damageOf(false, K.CRIT_EVERY).dmg === Math.round(K.DMG * 1.5), '連続ごとに会心');
  const a = B.makeBoss({ id: 'circ', name: '循環器', icon: '❤️' }, '2026-09-23');
  const b = B.makeBoss({ id: 'circ', name: '循環器', icon: '❤️' }, '2026-09-23');
  ok(a.name === b.name && a.glyph === b.glyph && a.name.indexOf('循環器の') === 0, '同じ日は同じボス（乱数なし）');
  ok(!/Math\.random/.test(BOSS), 'boss.js は乱数を使わない');
  // 誤答を全部やり直しても、10問で倒せる計算になっていること（全問正解なら必ず撃破できる）
  ok(K.DMG * 10 >= K.HP_MAX, '10問すべて通常の正解で撃破できる');
}

console.log('[4] 配線（ソース検査）');
{
  const tally = EXAM.slice(EXAM.indexOf('function _tallyQuestion('), EXAM.indexOf('function _renderExamProgMarks('));
  ok(/_bossMode === true && window\.MecBoss/.test(tally) && /MecBoss\.onAnswer\(/.test(tally), '体力は _tallyQuestion（3つの採点経路の合流点）で動かす');
  ok(/function _isHostSession\(\)\s*\{\s*return _srsReviewMode \|\| _todayWrongMode \|\| !!_bossMode\b/.test(EXAM), 'ボス戦はホスト出題（中断データを持たない）');
  ok((EXAM.match(/_prepExamCard\(/g) || []).length >= 2 && /_prepExamCard\(card, false\)/.test(BOSS), '増援は startExam と同じカードの支度を通る');
  ok(/_examSyncQueue\(\)/.test(BOSS.slice(BOSS.indexOf('function _reinforce'))), '増援のあと出題範囲の索引を作り直す');
  ok(/MecBoss\?\.onExit/.test(EXAM) && /_bossMode = false;/.test(EXAM), 'exitExam で片付ける');
  ok(/_launchMode === 'boss'/.test(STUDY) && /startBossBattle/.test(STUDY), 'study.html?mode=boss で起動する');
  ok(/!_srsLaunch && !_todayWrongLaunch && !_bossLaunch/.test(STUDY), 'ボス戦の起動では試験の自動復元をしない');
  ok(/<script src="boss\.js"><\/script>/.test(STUDY) && /<script src="trophy\.js"><\/script>/.test(STUDY), 'study.html が読み込む');
  ok(/MecTrophy\?\.noteSrsChange/.test(STUDY) && /MecTrophy\?\.flushSession/.test(EXAM), '定着の増分を試験の結果でまとめて通知');
  ok(/id:'trophy'/.test(HUB) && /id:'boss'/.test(HUB), 'ハブのタイル');
  ['"./trophy.js"', '"./boss.js"'].forEach(f => ok(SW.indexOf(f) !== -1, 'sw.js SHELL に ' + f));
  ok(PROG.indexOf('mec_boss_v1') === -1, 'ボス戦の戦績は同期しない');
  ok(!/document\.body\.style\.transform|body\.animate/.test(BOSS), 'body を動かさない（揺れは体力ゲージのボスの絵だけ）');
  ok(/prefers-reduced-motion/.test(BOSS) && /prefers-reduced-motion/.test(TROPHY), 'reduced-motion で止める');
  // ハブのタイルが2列グリッドで穴を作らない（1マスのタイルが偶数枚）
  const tiles = HUB.slice(HUB.indexOf('const HUB_TILES = ['), HUB.indexOf('];', HUB.indexOf('const HUB_TILES = [')));
  const singles = (tiles.match(/\{ id:'[^']+'[^}]*\}/g) || []).filter(t => !/span:'(lead|wide)'/.test(t)).length;
  ok(singles % 2 === 0, '1マスのタイルは偶数枚（縦長1＋1マス偶数＋横長）: ' + singles);
}

console.log(fail ? `\n${fail} 件失敗 / ${pass} 件成功` : `\nALL PASS (${pass})`);
process.exit(fail ? 1 : 0);
