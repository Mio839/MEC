/*
 * 修正済み問題 UID 一覧
 *
 * UID を追加するだけでカードに「✏修正」バッジが表示される。
 *
 * Python スクリプトからの参照:
 *   import re
 *   with open('fixed_uids.js', encoding='utf-8') as f:
 *       fixed_uids = set(re.findall(r"'([a-z0-9_]+)'", f.read()))
 *   # 処理対象から除外:
 *   if uid in fixed_uids:
 *       continue
 */
const FIXED_UIDS = new Set([
  // 循環器
  'circ_ch02_q85',   // 不要画像削除
  'circ_ch03_q133',  // 問題文確認済み
  'circ_ch03_q134',  // 問題文確認済み
  // 神経
  'neur_ch02_q87',   // 問題文確認済み
  'neur_ch02_q128',  // 問題文確認済み
  'neur_ch04_q244',  // 不要画像削除
  'neur_ch04_q253',  // 不足画像追加（108B-44）
  'neur_ch05_q270',  // 欠落画像追加（120A-16 A/B）
  'neur_ch05_q271',  // 誤挿入3枚目削除（A/B 2枚に）
  'neur_ch05_q290',  // 画像修正（_1は誤挿入→_2/_3に変更）
  'neur_ch06_q344',  // 不要画像削除
]);
