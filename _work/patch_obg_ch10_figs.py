# -*- coding: utf-8 -*-
"""産婦人科 ch10 の連問 601〜603（100C-22〜24）に、ステムの経腟超音波写真を入れる。

⚠️ 産婦人科は**章別HTMLが正本**で `questions_obg.json` はそこから
   `_work/build_obg_json.py` が作る派生物（CLAUDE.md のファイル構成表）。
   JSON だけ直すと次の再生成で消えるので、HTML を直してから JSON を作り直すこと。

⚠️ 連問のステムが宣言した図は兄弟全員に付ける（CLAUDE.md「連問の図」2026-09-06 規約）。
   601〜603 は3問とも同じステムを表示するので3問に同じ1枚を入れる。

  python _work/patch_obg_ch10_figs.py --dry-run
"""
import io, re, sys
sys.stdout.reconfigure(encoding='utf-8')

SRC = '産婦人科/ch10_fujinka_shuyou.html'
IMG = '<div class="qimg-row"><img alt="" class="qimg" loading="lazy" src="images/100C-22_1.jpeg"/></div>'
BADGE = '<span class="bg bi">📷 画像</span>'
# ⚠️ 602・603 は入れない。産婦人科は**兄弟が要約だけを持つ書式**（CLAUDE.md 連問の書式③）で、
#    602/603 の qt は「（65歳の女性。閉経後の性器出血。…）」の1段落だけ＝**ステムも
#    「経腟超音波写真を示す。」の一文も画面に出ない**。宣言文を表示しない兄弟に図を付けない、
#    というのが 2026-09-06 規約の意味（枝分かれと同じ扱い）。
UIDS = ['q601']


def main():
    dry = '--dry-run' in sys.argv
    s = io.open(SRC, encoding='utf-8', newline='').read()
    n = 0
    for uid in UIDS:
        i = s.find('<div class="qc" id="%s">' % uid)
        if i < 0:
            sys.exit('%s が見つからない' % uid)
        nxt = s.find('<div class="qc" id="q', i + 10)
        card = s[i:nxt if nxt > 0 else len(s)]
        new = card
        # ① 図を .qt の直後（選択肢 .cs の直前）へ入れる
        if 'images/100C-22_1.jpeg' not in new:
            k = new.find('<div class="cs">')
            if k < 0:
                sys.exit('%s に選択肢ブロックが無い' % uid)
            new = new[:k] + IMG + new[k:]
        # ② 📷バッジを 正答率(.cr) の手前へ入れる（既存の並びに合わせる）
        if 'bg bi' not in new:
            m = re.search(r'<span class="cr ', new)
            if not m:
                sys.exit('%s に正答率バッジが無い' % uid)
            new = new[:m.start()] + BADGE + new[m.start():]
        if new != card:
            n += 1
            print('  %s: 図とバッジを入れた' % uid)
            s = s[:i] + new + (s[nxt:] if nxt > 0 else '')
    print('---- %s: %d 問' % (SRC, n))
    if n and not dry:
        io.open(SRC, 'w', encoding='utf-8', newline='').write(s)


if __name__ == '__main__':
    main()
