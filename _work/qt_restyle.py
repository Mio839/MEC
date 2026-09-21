# -*- coding: utf-8 -*-
"""① qt の機械整形を科目まるごとに当てる（`qt_style.transform` の呼び出し側）。

    python _work/qt_restyle.py endo              # 下見（何も書かない）
    python _work/qt_restyle.py endo --apply      # 適用
    python _work/qt_restyle.py endo --show 12    # 変換できなかった問題を12件まで本文つきで出す

循環器・呼吸器・神経・肝胆膵では、この呼び出し側を毎回 gitignore 下のスクラッチに書いていた。
**内分泌代謝から Git 管理下の1本に寄せる**（変換の正本は `qt_style.py` のまま・ここは配管だけ）。

⚠️ **不変条件は `qt_style.verify`**——タグを剥がして空白を潰した本文が、補った宣言文と
   落とした「連問 n/N」を除いて変換の前後で完全一致すること。**破ったものは書き換えない**
   （`Skip` も `ValueError` も verify 失敗も、すべて qt を1バイトも触らずに残して報告する）。

⚠️ **JSON の整形はファイルごとに違う**。読み込んだ生バイトと往復一致する形を自動で探り、
   見つからなければ**書き込まない**（整形が変わると1問直しただけで全行が差分になる）。
"""
import argparse, io, json, os, re, sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qt_style
import stem_pdf
import anstable

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UID_NO = re.compile(r'_q(\d+)$')


def _fmt(raw, obj):
    """生バイトと往復一致する (dumps引数, 改行, 末尾) を探す。見つからなければ None。"""
    for indent in (1, 2, None):
        for sep in (None, (',', ':')):
            s = json.dumps(obj, ensure_ascii=False, indent=indent, separators=sep)
            for nl in ('\n', '\r\n'):
                for tail in ('', nl):
                    if (s.replace('\n', nl) + tail).encode('utf-8') == raw:
                        return indent, sep, nl, tail
    return None


def decl_map(sid):
    """NO -> 宣言文（「次の文を読み、N と M の問いに答えよ。」）。PDF原文からの転記。"""
    doc = fitz.open(os.path.join(BASE, anstable.PDFS[sid]))
    out = {}
    for n0, n1, decl, _body in stem_pdf.find(doc):
        for no in range(n0, n1 + 1):
            out[no] = decl
    doc.close()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sid')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--show', type=int, default=0, help='変換できなかった問題を N 件まで本文つきで出す')
    a = ap.parse_args()

    path = os.path.join(BASE, 'questions_%s.json' % a.sid)
    raw = io.open(path, 'rb').read()
    j = json.loads(raw.decode('utf-8'))
    fmt = _fmt(raw, j)
    if fmt is None:
        sys.exit('⚠️ JSON の整形を再現できない＝書き戻すと全行が差分になる。中止する。')

    decls = decl_map(a.sid)
    qs = [q for ch in j['chapters'] for q in ch['qs']]
    changed, same, skipped = 0, 0, []
    for q in qs:
        no = int(UID_NO.search(q['uid']).group(1))
        old = q.get('qt') or ''
        try:
            new, added, removed = qt_style.transform(old, decls.get(no))
        except qt_style.Skip as e:
            skipped.append((q['uid'], 'Skip: %s' % e, old))
            continue
        except Exception as e:
            skipped.append((q['uid'], '%s: %s' % (type(e).__name__, e), old))
            continue
        err = qt_style.verify(old, new, added, removed)
        if err:
            skipped.append((q['uid'], '不変条件: %s' % err, old))
            continue
        if new == old:
            same += 1
            continue
        q['qt'] = new
        changed += 1

    print('%s: 変換 %d 問 ／ 変化なし %d 問 ／ 見送り %d 問' % (a.sid, changed, same, len(skipped)))
    reasons = {}
    for _uid, why, _old in skipped:
        reasons[why.split('(')[0].strip()] = reasons.get(why.split('(')[0].strip(), 0) + 1
    for why, n in sorted(reasons.items(), key=lambda kv: -kv[1]):
        print('   見送り %4d  %s' % (n, why))
    for uid, why, old in skipped[:a.show]:
        print('\n--- %s  %s\n%s' % (uid, why, old[:600]))

    if not a.apply:
        print('\n（下見。書き込むには --apply）')
        return
    indent, sep, nl, tail = fmt
    s = json.dumps(j, ensure_ascii=False, indent=indent, separators=sep)
    io.open(path, 'wb').write((s.replace('\n', nl) + tail).encode('utf-8'))
    print('-> %s を書き換えた' % path)


if __name__ == '__main__':
    main()
