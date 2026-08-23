/* 効果音まわりの不変条件を検査する。
 *   node _work/test_sounds.js
 *
 * 実ソース（sounds/meta.json・sounds_index.js・study_exam.js・study.html・index.html・
 * chapter_exam.js・sw.js）をそのまま読むので、ロジックの二重管理をしない。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log('  OK   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n         ' + e.message); }
};
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };

// sounds_index.js を読む（window だけ用意すれば動く）
const win = {};
new Function('window', R('sounds_index.js'))(win);
const S = win.MecSounds;
const meta = JSON.parse(R('sounds/meta.json'));

const studyExam = R('study_exam.js');
const studyHtml = R('study.html');
const indexHtml = R('index.html');
const chapterExam = R('chapter_exam.js');
const SLOTS = ['correct', 'boot', 'select', 'result'];
const DIRS = ['正解音', '起動音', '選択音', '結果画面'];

console.log('\n[1] 一覧（sounds_index.js）の形');
t('window.MecSounds が correct / boot / select / result を持つ', () => {
  ok(S && SLOTS.every(k => Array.isArray(S[k])), 'slot が足りない');
});
t('どのフォルダも1つ以上の音を持つ', () => {
  SLOTS.forEach(k => ok(S[k].length > 0, k + ' が空'));
});
t('key はフォルダ内で一意', () => {
  SLOTS.forEach(k => {
    const keys = S[k].map(s => s.key);
    ok(new Set(keys).size === keys.length, k + ' に重複した key: ' + keys.join(','));
  });
});
t('key に off を使っていない（無音ボタンと衝突する）', () => {
  SLOTS.forEach(k => S[k].forEach(s => ok(s.key !== 'off', k + ' に key:off がある')));
});
t('file が実在する', () => {
  SLOTS.forEach(k => S[k].forEach(s => {
    ok(fs.existsSync(path.join(ROOT, 'sounds', s.file)), 'sounds/' + s.file + ' が無い');
  }));
});
t('sounds/ に置いてあるのに一覧から漏れている音が無い', () => {
  const listed = new Set(SLOTS.flatMap(k => S[k].map(s => s.file)));
  for (const dir of DIRS) {
    for (const f of fs.readdirSync(path.join(ROOT, 'sounds', dir))) {
      if (!/\.(wav|mp3|ogg|m4a)$/i.test(f)) continue;
      ok(listed.has(dir + '/' + f), 'sounds/' + dir + '/' + f + ' が一覧に無い（生成し直すこと）');
    }
  }
});
t('sounds_index.js が最新（生成し直しても差分が出ない）', () => {
  execFileSync(process.execPath, [path.join(ROOT, '_work/build_sounds_index.js'), '--check'], { cwd: ROOT });
});

console.log('\n[2] 音量（ピーク × vol を揃える）');
t('vol は正の数', () => {
  SLOTS.forEach(k => S[k].forEach(s =>
    ok(typeof s.vol === 'number' && s.vol > 0, s.file + ' の vol が不正')));
});
t('peak を持つ音は実効音量が揃っている（正解/起動/結果 .5±.12・選択 .7±.15）', () => {
  const want = { correct: [0.5, 0.12], boot: [0.5, 0.12], select: [0.7, 0.15], result: [0.5, 0.12] };
  SLOTS.forEach(k => S[k].forEach(s => {
    if (s.peak == null) return;
    const tgt = want[k][0], tol = want[k][1];
    const eff = s.peak * s.vol;
    ok(Math.abs(eff - tgt) <= tol,
      s.file + ' の実効音量 ' + eff.toFixed(2) + ' が ' + tgt + '±' + tol + ' から外れている');
  }));
});

console.log('\n[3] ファイル名の表は1本だけ（3か所に散らさない）');
t('study_exam.js / index.html / chapter_exam.js にファイル名が直書きされていない', () => {
  const names = new Set(SLOTS.flatMap(k => S[k].map(s => path.basename(s.file))));
  [['study_exam.js', studyExam], ['index.html', indexHtml], ['chapter_exam.js', chapterExam]].forEach(pair => {
    names.forEach(n => ok(!pair[1].includes(n), pair[0] + ' に「' + n + '」が直書きされている（一覧を読むこと）'));
  });
});
t('旧ミラー（CORRECT_WAVS / HUB_CORRECT_WAVS / BOOT_WAV）が復活していない', () => {
  ['CORRECT_WAVS', 'HUB_CORRECT_WAVS', 'HUB_BOOT_WAV', 'BOOT_WAV'].forEach(n => {
    ok(!studyExam.includes(n), 'study_exam.js に ' + n + ' が戻っている');
    ok(!indexHtml.includes(n), 'index.html に ' + n + ' が戻っている');
    ok(!studyHtml.includes(n), 'study.html に ' + n + ' が戻っている');
  });
});
t('3ページとも sounds_index.js を読み込む', () => {
  ok(studyHtml.includes('<script src="sounds_index.js"></script>'), 'study.html が読んでいない');
  ok(indexHtml.includes('<script src="sounds_index.js"></script>'), 'index.html が読んでいない');
  ok(chapterExam.includes('sounds_index.js'), 'chapter_exam.js が読んでいない');
});
t('sounds_index.js は sw.js の SHELL に載っている', () => {
  ok(R('sw.js').includes('"./sounds_index.js"'), 'SHELL に無い＝オフラインで設定画面が壊れる');
});

console.log('\n[4] 起動音は設定で選ばせずランダム');
t('study_exam.js が抽選する（_pickBootSpec）', () => {
  ok(/function _pickBootSpec\(\)/.test(studyExam), '_pickBootSpec が無い');
  ok(/Math\.random\(\) \* l\.length/.test(studyExam), '抽選していない');
});
t('抽選は startExam のタップの中で行い prepare してある（iOS の自動再生制限）', () => {
  ok(/function startExam[\s\S]*?_pendingBootSpec = _pickBootSpec\(\); _prepareWavSound\(_pendingBootSpec\)/.test(studyExam),
    'startExam の中で抽選＋prepare していない');
});
t('boot の設定は on/off だけ（ファイルのキーを保存しない）', () => {
  ok(studyExam.includes("localStorage.getItem('mec_boot_sound_v1') === 'off'"), 'study_exam.js が on/off で読んでいない');
  ok(studyHtml.includes('data-bsound="on"') && studyHtml.includes('data-bsound="off"'), 'study.html のボタンが on/off でない');
  ok(indexHtml.includes('data-bsound="on"') && indexHtml.includes('data-bsound="off"'), 'index.html のボタンが on/off でない');
  ok(!(studyHtml + indexHtml).includes('data-bsound="ms"'), '旧 data-bsound="ms" が残っている');
});
t('chapter_exam.js も毎回抽選する', () => {
  ok(/function ceBootSound\(\)[\s\S]*?Math\.random\(\) \* l\.length/.test(chapterExam), 'ceBootSound が抽選していない');
});

console.log('\n[5] 合成音は全廃（正解音・選択音・コンボ音すべて）');
t('_playCorrectSound / _playSelectSound がオシレータを使わない', () => {
  const cor = studyExam.match(/function _playCorrectSound\(\)[\s\S]*?\n\}/)[0];
  const sel = studyExam.match(/function _playSelectSound\(\)[\s\S]*?\n\}/)[0];
  ok(!/createOscillator/.test(cor), '_playCorrectSound に合成音が残っている');
  ok(!/createOscillator/.test(sel), '_playSelectSound に合成音が残っている');
});
t('コンボ音（_playComboNote / cePlayComboNote）は全廃されている', () => {
  ok(!/function _playComboNote/.test(studyExam), 'study_exam.js にコンボ音が残っている');
  ok(!/function cePlayComboNote/.test(chapterExam), 'chapter_exam.js にコンボ音が残っている');
});
t('設定画面のボタンは一覧から生成し、コンボ音設定は残っていない', () => {
  ok(studyHtml.includes('_renderStudySoundGrid'), 'study.html がボタンを生成していない');
  ok(indexHtml.includes('_renderHubSoundGrid'), 'index.html がボタンを生成していない');
  ok(!(studyHtml + indexHtml).includes('data-sound="ping"'), '旧・合成音のボタンが残っている');
  ok(!(studyHtml + indexHtml).includes('data-ssound="click"'), '旧・合成音のボタンが残っている');
  ok(!studyHtml.includes('ssovComboGrid'), 'study.html に ssovComboGrid が残っている');
  ok(!studyHtml.includes('mec_combo_sound_v1'), 'study.html に mec_combo_sound_v1 が残っている');
});

console.log('\n[6] vol>1 は GainNode でしか鳴らない（<audio> へ落とさない）');
t('デコード待ちのとき <audio> ではなくバッファの完了を待つ', () => {
  const f = studyExam.match(/function _playWavSound\(spec\)[\s\S]*?\n\}/)[0];
  ok(/slot\.promise\.then/.test(f), 'デコード完了を待たない＝vol>1 の音がほぼ無音になる');
  ok(/slot\.waiting/.test(f), '待機中の重複要求を捨てていない（連打で音が積み上がる）');
});
t('vol>1 の音が実在する（この検査が空回りしていないこと）', () => {
  ok(SLOTS.flatMap(k => S[k]).some(s => s.vol > 1), 'vol>1 の音が1つも無い');
});

console.log('\n[7] 台帳（sounds/meta.json）');
t('台帳のキーはフォルダ名', () => {
  DIRS.forEach(d => ok(meta[d], 'meta.json に ' + d + ' が無い'));
});
t('台帳に載っていてファイルが無いものが無い', () => {
  DIRS.forEach(d => Object.keys(meta[d]).forEach(f =>
    ok(fs.existsSync(path.join(ROOT, 'sounds', d, f)), 'sounds/' + d + '/' + f + ' が無い')));
});
t('localStorage に刺さる旧キーが生きている', () => {
  const cor = new Set(S.correct.map(s => s.key));
  ['custom', 'msmove', 'saber', 'magnum', 'buppigan'].forEach(k =>
    ok(cor.has(k), '正解音の key ' + k + ' が消えた（その音を選んでいた端末の設定が落ちる）'));
  ok(new Set(S.select.map(s => s.key)).has('mp3'), '選択音の key mp3 が消えた');
  ok(new Set(S.result.map(s => s.key)).has('fanfare'), '結果音の key fanfare が消えた');
});

console.log('\n[8] 結果音の設定と再生');
t('sounds_index.js の result スロットに2つの音声が含まれている', () => {
  const resKeys = S.result.map(s => s.key);
  ok(resKeys.includes('fanfare'), 'fanfare が含まれていない');
  ok(resKeys.includes('sulfa'), 'sulfa が含まれていない');
});
t('study_exam.js / chapter_exam.js が mec_result_sound_v1 を参照している', () => {
  ok(studyExam.includes("localStorage.getItem('mec_result_sound_v1')"), 'study_exam.js が mec_result_sound_v1 を読んでいない');
  ok(chapterExam.includes("localStorage.getItem('mec_result_sound_v1')"), 'chapter_exam.js が mec_result_sound_v1 を読んでいない');
});
t('index.html / study.html が結果音グリッドを生成している', () => {
  ok(indexHtml.includes('resultSoundGrid'), 'index.html に resultSoundGrid が無い');
  ok(studyHtml.includes('ssovResultGrid'), 'study.html に ssovResultGrid が無い');
});

console.log('\n' + (fail ? 'FAILED  ' : 'ALL OK  ') + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
