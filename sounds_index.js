/* ⚠️ 自動生成ファイル（派生物）— 直接編集しないこと。
 *    node _work/build_sounds_index.js が sounds/ と sounds/meta.json から作り直す。
 *    音を足す手順は sounds/meta.json の _readme を読むこと。
 *
 * ここが「効果音のファイル名・キー・音量の唯一の正本」。study.html(study_exam.js)・
 * index.html・chapter_exam.js の3つが全部これを読むので、表が乖離しようがない。
 *
 * file はリポジトリ直下の sounds/ からの相対パス。国家試験過去問/ のような下の階層から
 * 読むページは base ではなく自前の scriptBase を前置すること（chapter_exam.js がそうしている）。
 */
window.MecSounds = {
  base: 'sounds/',
  correct: [
    {"key":"custom","file":"正解音/correct.wav","label":"正解音","vol":1,"peak":0.491,"dur":1.17},
    {"key":"msmove","file":"正解音/ＭＳ動作.wav","label":"ＭＳ動作","vol":0.5,"peak":0.962,"dur":1.56},
    {"key":"saber","file":"正解音/ビームサーベル斬撃.wav","label":"ビームサーベル","vol":0.5,"peak":1,"dur":1.15},
    {"key":"magnum","file":"正解音/ビームマグナム.wav","label":"ビームマグナム","vol":1.5,"peak":0.338,"dur":3.54},
    {"key":"buppigan","file":"正解音/ブッピガン.wav","label":"ブッピガン","vol":0.5,"peak":0.997,"dur":1.21},
    {"key":"zelda","file":"正解音/Zelda.mp3","label":"ゼルダ","vol":0.95,"peak":0.534,"dur":1.9},
    {"key":"kh","file":"正解音/キングダムハーツ項目選択.wav","label":"キングダムハーツ","vol":0.7,"peak":0.701,"dur":4.14},
    {"key":"mhf","file":"正解音/MHF_クエスト開始BGM.wav","label":"MHFクエスト開始","vol":4.3,"peak":0.117,"dur":2},
    {"key":"gomadare","file":"正解音/ごまだれ【ゼルダの伝説】.wav","label":"ごまだれ【ゼルダ】","vol":0.53,"peak":0.948,"dur":2.6},
    {"key":"deen","file":"正解音/デエエエエエエエエン.mp3","label":"デエエエン","vol":0.48,"peak":1.035,"dur":3.59}
  ],
  boot: [
    {"key":"ms","file":"起動音/MS起動.wav","label":"MS起動","vol":0.55,"peak":0.919,"dur":4.73},
    {"key":"akatsuki","file":"起動音/アカツキ起動.wav","label":"アカツキ起動","vol":1,"peak":0.5,"dur":4.85},
    {"key":"motor","file":"起動音/巨大モーター起動.wav","label":"巨大モーター起動","vol":1,"peak":0.502,"dur":5.33}
  ],
  select: [
    {"key":"mp3","file":"選択音/選択.mp3","label":"選択","vol":0.7,"peak":0.996,"dur":1.07},
    {"key":"ffcursor","file":"選択音/カーソル音【FF】.wav","label":"カーソル音【FF】","vol":1.03,"peak":0.678,"dur":0.16},
    {"key":"purahpad","file":"選択音/プルアパッド 起動.wav","label":"プルアパッド起動","vol":0.88,"peak":0.794,"dur":2.7},
    {"key":"ygo","file":"選択音/遊戯王_召喚音.wav","label":"遊戯王 召喚音","vol":3.61,"peak":0.194,"dur":1.71}
  ],
  result: [
    {"key":"fanfare","file":"結果画面/勝利のファンファーレ.wav","label":"勝利のファンファーレ","vol":0.5,"peak":0.992,"dur":4.24},
    {"key":"sulfa","file":"結果画面/レベルアップ音(サルファ).wav","label":"レベルアップ音(サルファ)","vol":0.7,"peak":0.707,"dur":3.36}
  ]
};
