// 模試レジストリ。mock.html はここを見て「どの模試が選べるか」を決める。
// ⚠️ 模試を1つ足す作業 ＝ ここに1行足して mock_data/{id}.js を置くだけ。
//    エンジン（mock.js / mock.html）は触らない。sw.js の SHELL への追記だけ忘れないこと。
window.MecMockIndex = [
  {
    id: 'm121s',
    name: '第121回 夏メック模試',
    short: '夏メック',
    date: '2026-06',
    file: './mock_data/m121s.js',
    // 出題順（＝受験順）。B・E が必修ブロック。
    blocks: ['A', 'B', 'C', 'D', 'E', 'F'],
    // 1日目/2日目の区切り。入力の初期表示をここで決める。
    days: [['A', 'B', 'C'], ['D', 'E', 'F']]
  }
];
