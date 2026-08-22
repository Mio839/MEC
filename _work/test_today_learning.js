// index.html の getTodayLearning() を実ソースから切り出して検算する（ロジックは二重管理しない）。
// 実行: node _work/test_today_learning.js
const fs = require('fs'), vm = require('vm');
const h = fs.readFileSync(require('path').join(__dirname,'..','index.html'), 'utf8');
const src = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];

// 対象の関数群だけを取り出す（DOM に触らない部分）
const start = src.indexOf('const XP_LAP');
const end = src.indexOf('// ── 統計計算');
const code = src.slice(start, end);

const store = {};
const ctx = { localStorage: { getItem: k => (k in store ? store[k] : null) }, console };
vm.createContext(ctx);
vm.runInContext(code + '\nthis._f = getTodayLearning;', ctx);

const MIN = 60000;
const nowMin = Math.floor(Date.now() / MIN);
const row = (uid, tMin, ok, sess) => [uid, tMin, 'a', ok, '12', 'e', sess, '1'].join('|');
const todayKey = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const ydayKey = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);

function run(name, attempts, activity, expect) {
  store['mec_attempts_v1'] = JSON.stringify(attempts);
  store['activity_v1'] = JSON.stringify(activity);
  const g = ctx._f();
  const got = { solved: g.solved, exT: g.exT, exC: g.exC, normal: g.normal, xp: g.xp };
  const ok = JSON.stringify(got) === JSON.stringify(expect);
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  if (!ok) console.log('  expected', expect, '\n  got     ', got);
  return ok;
}

let all = true;
// 今日3問(2正解・同一セッション・別UID) + 通常モード2問 → xp = 5*10 + 3*4 + 2*6 = 74
all &= run('試験3問＋通常2問',
  [row('a_ch01_q1', nowMin, '1', 's1'), row('a_ch01_q2', nowMin, '1', 's1'), row('a_ch01_q3', nowMin, '0', 's1')],
  { [todayKey]: 5 },
  { solved: 5, exT: 3, exC: 2, normal: 2, xp: 74 });

// 昨日の行は数えない
all &= run('昨日の解答は除外',
  [row('a_ch01_q9', nowMin - 60 * 24 - 60, '1', 's0'), row('a_ch01_q1', nowMin, '1', 's1')],
  { [todayKey]: 1, [ydayKey]: 30 },
  { solved: 1, exT: 1, exC: 1, normal: 0, xp: 20 });

// 同一セッションで同じUIDを2回解答 → 2問としてカウント
all &= run('同一セッション同一UIDの再解答',
  [row('a_ch01_q1', nowMin, '0', 's1'), row('a_ch01_q1', nowMin, '1', 's1')],
  { [todayKey]: 2 },
  { solved: 2, exT: 2, exC: 1, normal: 0, xp: 34 });

// 初回試験10問(7正解3誤答)＋誤答3問を再試験(全正解) → solved = 13問 (exT=13, exC=10)
all &= run('初回試験10問＋誤答3問再試験',
  [
    row('q1', nowMin, '1', 's1'), row('q2', nowMin, '1', 's1'), row('q3', nowMin, '1', 's1'),
    row('q4', nowMin, '1', 's1'), row('q5', nowMin, '1', 's1'), row('q6', nowMin, '1', 's1'),
    row('q7', nowMin, '1', 's1'), row('q8', nowMin, '0', 's1'), row('q9', nowMin, '0', 's1'), row('q10', nowMin, '0', 's1'),
    row('q8', nowMin, '1', 's2'), row('q9', nowMin, '1', 's2'), row('q10', nowMin, '1', 's2')
  ],
  { [todayKey]: 13 },
  { solved: 13, exT: 13, exC: 10, normal: 0, xp: 13 * 10 + 13 * 4 + 10 * 6 });

// attempts だけ他端末から同期されて activity が追いつかない → 負にしない
all &= run('activity 不足でも負にしない',
  [row('a_ch01_q1', nowMin, '1', 's1'), row('a_ch01_q2', nowMin, '1', 's2')],
  { [todayKey]: 0 },
  { solved: 2, exT: 2, exC: 2, normal: 0, xp: 40 });

// 通常モードだけの日
all &= run('通常モードのみ', [], { [todayKey]: 12 },
  { solved: 12, exT: 0, exC: 0, normal: 12, xp: 120 });

// まっさら
all &= run('記録なし', [], {}, { solved: 0, exT: 0, exC: 0, normal: 0, xp: 0 });

// 壊れた行を混ぜても落ちない
all &= run('壊れた行を無視', ['', 'zzz', null, row('a_ch01_q1', nowMin, '1', 's1')], { [todayKey]: 1 },
  { solved: 1, exT: 1, exC: 1, normal: 0, xp: 20 });

console.log(all ? '\nALL PASS' : '\nFAILURES');
process.exit(all ? 0 : 1);
