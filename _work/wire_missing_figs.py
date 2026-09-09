# -*- coding: utf-8 -*-
"""抜き直した図を設問へ配線し、あわせて紙面のゴミが混ざった qt を1件直す。

  python _work/wire_missing_figs.py --dry-run
  python _work/wire_missing_figs.py

⚠️ 連問のステムが宣言した図は**兄弟全員**に付ける（CLAUDE.md「連問の図」2026-09-06 規約）。
   ファイル名は群の先頭の国試番号のままで、兄弟は1組を共有する。
⚠️ imgs を足した設問には 📷バッジ(`bi`) も対で足す（バッジと imgs の一致は監査項目）。
⚠️ 整形はファイルごとに違うので、元の文字列を再現できる形を見つけてから書き戻す。
"""
import json, io, sys
sys.stdout.reconfigure(encoding='utf-8')

IMG_BADGE = {'cls': 'bi', 't': '📷 画像'}
BADGE_ORDER = ['bs', 'bh', 'bc', 'bip', 'brn', 'bi', 'bm', 'bx']

# uid -> 付ける imgs（既存があれば「ステムの図 → 自分の図」の順に並べ替える）
IMGS = {
    # 内分泌 連問 55〜57（109B-56〜58）のステム図＝頭部エックス線写真
    'endo_ch02_q55':  ['内分泌/images/109B-56_1.jpeg'],
    'endo_ch02_q56':  ['内分泌/images/109B-56_1.jpeg'],
    'endo_ch02_q57':  ['内分泌/images/109B-56_1.jpeg'],
    # 血液（単問）
    'hema_ch07_q308': ['血液/images/108D-12_1.jpeg'],
    'hema_ch07_q318': ['血液/images/103G-49_1.jpeg'],
    # 神経（単問）尺骨神経の運動神経伝導検査
    'neur_ch07_q413': ['神経/images/108B-60_1.jpeg'],
    # 産婦人科 601（100C-22）のステム図＝経腟超音波写真
    # ⚠️ 602・603 には付けない。産婦人科は兄弟が要約だけを持つ書式（書式③）で、
    #    2問の qt は「（65歳の女性。閉経後の性器出血。…）」の1段落だけ＝宣言文が画面に出ない。
    'obg_ch10_q601':  ['産婦人科/images/100C-22_1.jpeg'],
    # 消化器 連問 202〜204（104B-56〜58）のステム図＝胸部造影CT A/B/C
    'dige_ch04_q202': ['消化器/images/104B-56_1.jpeg', '消化器/images/104B-56_2.jpeg',
                       '消化器/images/104B-56_3.jpeg'],
    'dige_ch04_q203': ['消化器/images/104B-56_1.jpeg', '消化器/images/104B-56_2.jpeg',
                       '消化器/images/104B-56_3.jpeg'],
    'dige_ch04_q204': ['消化器/images/104B-56_1.jpeg', '消化器/images/104B-56_2.jpeg',
                       '消化器/images/104B-56_3.jpeg'],
    # 消化器 連問 251〜253（109G-67〜69）のステム図＝上部消化管内視鏡像 A/B
    # ⚠️ 252 は自分のサブ設問の図（生検組織 C ①〜⑤）を既に5枚持っている。
    #    並びは宣言文が qt に出てくる順＝ステムの A,B が先、C ①〜⑤ が後。
    'dige_ch05_q251': ['消化器/images/109G-67_1.jpeg', '消化器/images/109G-67_2.jpeg'],
    'dige_ch05_q252': ['消化器/images/109G-67_1.jpeg', '消化器/images/109G-67_2.jpeg'] +
                      ['消化器/images/109G-68_%d.jpeg' % i for i in range(1, 6)],
    'dige_ch05_q253': ['消化器/images/109G-67_1.jpeg', '消化器/images/109G-67_2.jpeg'],

    # ── 第2弾 ──────────────────────────────────────────────────────────
    # 消化器（単問。宣言はその設問自身のブロックの中）
    'dige_ch02_q79':  ['消化器/images/115C-62_1.jpeg'],
    'dige_ch03_q125': ['消化器/images/111B-60_1.jpeg'],
    # 消化器 連問 139〜141（108G-67〜69）のステム図＝上部消化管内視鏡像 A
    # ⚠️ 140 は自分のサブ設問の図 B（迅速ウレアーゼ試験）を持っている。並びは宣言の順で A→B。
    'dige_ch03_q139': ['消化器/images/108G-67_1.jpeg'],
    'dige_ch03_q140': ['消化器/images/108G-67_1.jpeg', '消化器/images/108G-68_1.jpeg'],
    'dige_ch03_q141': ['消化器/images/108G-67_1.jpeg'],
    # 消化器 連問 319・320（104C-28・29）のステム図＝腹部造影CT
    'dige_ch06_q319': ['消化器/images/104C-28_1.jpeg'],
    'dige_ch06_q320': ['消化器/images/104C-28_1.jpeg'],
    # 消化器 連問 437〜439（107B-58〜60）のステム図＝下行結腸の内視鏡像
    'dige_ch09_q437': ['消化器/images/107B-58_1.jpeg'],
    'dige_ch09_q438': ['消化器/images/107B-58_1.jpeg'],
    'dige_ch09_q439': ['消化器/images/107B-58_1.jpeg'],
    # 内分泌 連問 480・481（110F-26・27）のステム図＝膝X線 A ＋ 関節液 Gram 染色 B
    'endo_ch10_q480': ['内分泌/images/110F-26_1.jpeg', '内分泌/images/110F-26_2.jpeg'],
    'endo_ch10_q481': ['内分泌/images/110F-26_1.jpeg', '内分泌/images/110F-26_2.jpeg'],
    # 血液（単問）
    'hema_ch04_q154': ['血液/images/99A-33_1.jpeg'],
    'hema_ch05_q213': ['血液/images/98B-20_1.jpeg'],
    'hema_ch06_q250': ['血液/images/102D-47_1.jpeg'],
    'hema_ch08_q341': ['血液/images/116A-17_1.jpeg'],
    # 産婦人科 253（102G-61）のステム図＝胎児推定体重の推移 A ＋ 胎児心拍数陣痛図 B
    # ⚠️ 254・255 には付けない（書式③の要約だけの兄弟で、宣言文が画面に出ない）。
    'obg_ch06_q253':  ['産婦人科/images/102G-61_1.jpeg', '産婦人科/images/102G-61_2.jpeg'],
}

# 紙面から取り落とした一文の復元（図の読み方を指示する注記）
QT_APPEND = {
    'hema_ch07_q308': ('造血器腫瘍細胞の染色体検査写真を示す。',
                       '造血器腫瘍細胞の染色体検査写真を示す。矢印は相互転座型異常を示す。'),
}

# 紙面のゴミ（欄外のページ番号・「メック予備校用」・手書き注釈のOCR）を落とす
QT_TRIM = {
    'jinzo_d_ch01_q21': '（編註：選択肢を省略した。）',
}

FILES = {'endo': 'questions_endo.json', 'hema': 'questions_hema.json',
         'neur': 'questions_neur.json', 'obg': 'questions_obg.json',
         'dige': 'questions_dige.json', 'jinzo_d': 'questions_jinzo_d.json'}


def dump(d, raw):
    """元の整形を崩さずに書き戻す（再現できなければ書かない）。"""
    src = json.loads(raw)
    for sep in ((',', ':'), (',', ': '), (', ', ': ')):
        for ind in (None, 1, 2, 4):
            body = json.dumps(src, ensure_ascii=False, separators=sep, indent=ind)
            for nl in ('\n', '\r\n'):
                for tail in ('', '\n'):
                    if body.replace('\n', nl) + tail == raw:
                        out = json.dumps(d, ensure_ascii=False, separators=sep, indent=ind)
                        return out.replace('\n', nl) + tail
    raise SystemExit('整形を再現できないので書き戻さない（手で見ること）')


def run(path, dry):
    raw = io.open(path, encoding='utf-8', newline='').read()
    d = json.loads(raw)
    n = 0
    for ch in d['chapters']:
        for q in ch['qs']:
            uid, hit = q['uid'], False
            if uid in IMGS and q.get('imgs') != IMGS[uid]:
                print('  %-20s imgs %d枚 -> %d枚' % (uid, len(q.get('imgs') or []), len(IMGS[uid])))
                q['imgs'] = list(IMGS[uid])
                if not any(b['cls'] == 'bi' for b in q['badges']):
                    q['badges'] = sorted(q['badges'] + [dict(IMG_BADGE)],
                                         key=lambda b: BADGE_ORDER.index(b['cls'])
                                         if b['cls'] in BADGE_ORDER else 99)
                hit = True
            if uid in QT_APPEND:
                old, new = QT_APPEND[uid]
                if old in q['qt'] and new not in q['qt']:
                    q['qt'] = q['qt'].replace(old, new, 1)
                    print('  %-20s qt に紙面の注記を戻した' % uid)
                    hit = True
            if uid in QT_TRIM:
                mark = QT_TRIM[uid]
                i = q['qt'].find(mark)
                if i >= 0 and q['qt'][i + len(mark):].strip():
                    print('  %-20s qt 末尾のゴミを落とした: %r' % (uid, q['qt'][i + len(mark):]))
                    q['qt'] = q['qt'][:i + len(mark)]
                    hit = True
            n += hit
    print('---- %s: %d 問' % (path, n))
    if n and not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(dump(d, raw))
    return n


if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    for p in FILES.values():
        run(p, dry)
