// 産婦人科の画像問題の進捗計測。正本はこのスクリプトの実測で、文書に数字を書かない。
//   node _work/obg_img_progress.js          残り件数と次のバッチ
//   node _work/obg_img_progress.js --list   残り全部の uid
//
// 段A（2026-09-20 完了）：「実際の画像は参照できないが」と自白したまま書かれた問題を、
//                          画像を開いて書き直す。判定は RE（下記）。
// 段B（進行中）        ：A に掛からなかった問題も、見ずに書かれている可能性が残る。
//                          画像を開いて点検し、書き直したら見出しを「📸 …」にする。
//                          ⚠️ 見出しの📸が「この問題は実画像を見て書いた」という唯一の印で、
//                             書き直せば自動的にこの一覧から外れる（帳簿を別に持たない）。
const fs = require('fs');
const j = JSON.parse(fs.readFileSync(__dirname + '/../questions_obg.json', 'utf8'));
// 「画像を見ずに書いた」ことを自白している文言。これが0になったら A は完了。
// ⚠️ 「胎囊が確認できない」のような臨床記述を拾わないよう、必ず「実際の〜」等の
//    言い訳の型に限定すること（素の「確認できない」だけで判定しない）。
const RE = /実際の[^。<]{0,40}(参照|確認|提示|掲載)でき(ない|ません)|は参照できな|を参照できな|(画像|写真|像|グラフ|標本|記録)[^。<]{0,12}(示されていない|提示されていない)|画像を直接[^。<]{0,10}でき/;
const SEEN = /^\s*📸/; // 実画像を見て書き直した印
const A = [], B = [], DONE = [];
for (const ch of j.chapters) for (const q of ch.qs) {
  if (!(q.imgs && q.imgs.length)) continue;
  const rec = { uid: q.uid, qn: q.qn, ep: q.episode, n: q.imgs.length };
  if (RE.test(JSON.stringify(q.eg || []) + (q.ans_sub || ''))) A.push(rec);
  else if ((q.eg || []).some(b => SEEN.test(b.h || ''))) DONE.push(rec);
  else B.push(rec);
}
const queue = A.length ? A : B;
const label = A.length ? 'A 画像所見を書く' : 'B 画像を開いて点検する';
console.log('A 言い訳が残っている（要執筆）:', A.length, '問');
console.log('B 📸の印が無い（要点検）:', B.length, '問 ／ 画像', B.reduce((s, x) => s + x.n, 0), '枚');
console.log('済 実画像を見て書いた:', DONE.length, '問');
if (process.argv.includes('--list')) {
  for (const x of queue) console.log(' ', x.uid, x.ep, x.n + '枚');
} else {
  console.log(`次のバッチ（${label}）:`, queue.slice(0, 6).map(x => `${x.uid}(${x.ep}/${x.n}枚)`).join(' '));
}
