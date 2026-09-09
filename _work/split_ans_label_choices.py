# -*- coding: utf-8 -*-
"""ans_label で肢が区切り無しにつながっているものを、改行で区切る。

正解が2肢以上ある問題の ans_label は科目ごとに区切りがまちまちで、
`　＋　`（circ）・改行（dige/obg/peds 等7科目 401問）・`／`（custom）と分かれている。
神経だけは**区切りが1つも無く**「ｄ　痛　覚ｅ　振動覚」と肢が地続きになっていた（86問）。
`.ac` は 2026-09-09 に `white-space: pre-line` にしたので、**改行を入れれば行が分かれる**
＝いちばん多い流儀（改行）に揃える。

判定は「肢の頭（全角のａ〜ｅ＋U+3000）が、区切り文字を挟まずに直前の文字へ続いている」かつ
「前の肢より後ろの文字である」こと。⚠️ 後者を落とすと、肢の本文に出てくる
「ａ　」の並びを肢の頭と読み違える。

  python _work/split_ans_label_choices.py --dry-run [questions_*.json ...]

引数を省くと questions_neur.json だけを見る。冪等。
"""
import json, io, re, sys
sys.stdout.reconfigure(encoding='utf-8')

ZEN = 'ａｂｃｄｅ'
HEAD = re.compile(r'[' + ZEN + r']　')
# ⚠️ 空白（半角も U+3000 も）を区切りに数えないこと。① 空白だけでは行が分かれず
#    読みづらさは変わらない ② MEC は2文字語を「散　瞳」「頭　痛」と U+3000 で割って
#    組むので、空白を区切り扱いにすると「散　瞳ｃ　眼瞼下垂」の ｃ を肢の頭と認めず
#    取り落とす（実際に3問で落ちた）。
SEP = set('＋・、,/／\n\r|＆&＜<')


def dump(d, raw):
    """元の整形を崩さずに書き戻す（CLAUDE.md「書き戻しで整形を変えないこと」）。

    ⚠️ indent を付けると json.dumps の既定の要素区切りは ',' になる。(', ', ': ') を
       明示すると全行の末尾に空白が1つ増えて、どの整形にも一致しなくなる。"""
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


def split_label(al):
    """区切り無しでつながっている肢の頭の前に改行を入れる。変化が無ければ None。"""
    marks = list(HEAD.finditer(al))
    if len(marks) < 2:
        return None
    cuts = []
    prev = marks[0].group(0)[0]
    for m in marks[1:]:
        letter = m.group(0)[0]
        if letter <= prev:
            continue                      # 肢は昇順。逆行するものは本文中の偶然の一致
        prev = letter
        if not (set(al[max(0, m.start() - 2):m.start()]) & SEP):
            cuts.append(m.start())
    if not cuts:
        return None
    out, last = [], 0
    for c in cuts:
        out.append(al[last:c].rstrip())
        last = c
    out.append(al[last:])
    return '\n'.join(out)


def run(path, dry):
    raw = io.open(path, encoding='utf-8', newline='').read()
    d = json.loads(raw)
    changed = []
    for ch in d['chapters']:
        for q in ch['qs']:
            new = split_label(q.get('ans_label') or '')
            if new:
                changed.append((q['uid'], q['ans_label'], new))
                q['ans_label'] = new
    for uid, old, new in changed:
        print('%-20s %s' % (uid, ' ⏎ '.join(new.split('\n'))))
    print('---- %s: %d 問' % (path, len(changed)))
    if changed and not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(dump(d, raw))
    return len(changed)


if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    paths = [a for a in sys.argv[1:] if not a.startswith('--')] or ['questions_neur.json']
    for p in paths:
        run(p, dry)
