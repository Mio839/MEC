// 産婦人科の画像問題の進捗計測。正本はこのスクリプトの実測で、文書に数字を書かない。
//   node _work/obg_img_progress.js          残り件数と次のバッチ
//   node _work/obg_img_progress.js --list   残り全部の uid
const fs = require('fs');
const j = JSON.parse(fs.readFileSync(__dirname + '/../questions_obg.json', 'utf8'));
// 「画像を見ずに書いた」ことを自白している文言。これが0になったら A は完了
const RE = /参照できない|参照できません|画像は示されて|画像が提示|写真は示され|確認できない|画像を直接|提示されていない/;
const A = [], B = [];
for (const ch of j.chapters) for (const q of ch.qs) {
  if (!(q.imgs && q.imgs.length)) continue;
  (RE.test(JSON.stringify(q.eg || []) + (q.ans_sub || '')) ? A : B)
    .push({ uid: q.uid, qn: q.qn, ep: q.episode, n: q.imgs.length });
}
console.log('A 画像所見を書く（残り）:', A.length, '問 ／ 画像', A.reduce((s, x) => s + x.n, 0), '枚');
console.log('B 既に📸を持つ（要点検）:', B.length, '問');
if (process.argv.includes('--list')) {
  for (const x of A) console.log(' ', x.uid, x.ep, x.n + '枚');
} else {
  console.log('次のバッチ:', A.slice(0, 6).map(x => `${x.uid}(${x.ep}/${x.n}枚)`).join(' '));
}
