# -*- coding: utf-8 -*-
"""
questions_ortho.json を新科目HTML生成ガイド §2（品質基準）・§4（採点/画像の不変条件）で検査する。
`_work/verify_uro_ch.py` の整形外科版。

  python _work/verify_uro_ch.py            全章
  python _work/verify_uro_ch.py --ch 1     指定章のみ

さらに巻末解答一覧表（_work/_ortho_tmp/anstable.json）と
 正解ラベル・正答率・バッジ・問題数 を突合する（PDFが正本）。
"""
import argparse, io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON = os.path.join(BASE, 'questions_ortho.json')
ANS = os.path.join(BASE, '_work', '_ortho_tmp', 'anstable.json')
FW2A = {'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g'}


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ch', type=int)
    a = ap.parse_args()

    d = json.load(io.open(JSON, encoding='utf-8'))
    if not os.path.exists(ANS):
        # _work/_ortho_tmp/ は .gitignore 済み＝別マシンでは存在しない。作り直す。
        print('%s が無い。先に `python _work/ortho_pdf.py anstable` を実行すること。' % ANS)
        return 1
    rows = {r['no']: r for r in json.load(io.open(ANS, encoding='utf-8'))}
    errs, warns = [], []
    lines = []

    for ci, ch in enumerate(d['chapters'], 1):
        if a.ch and ci != a.ch:
            continue
        nblk = nchr = nkw = 0
        for q in ch['qs']:
            uid = q['uid']
            no = int(re.match(r'.*_q(\d+)$', uid).group(1))
            badge_cls = [b['cls'] for b in q['badges']]
            excluded = any('採点除外' in b['t'] for b in q['badges'])

            # --- §4 不変条件 -------------------------------------------------
            n_ok = sum(1 for c in q['choices'] if c['ok'])
            if n_ok == 0 and not excluded:
                errs.append('%s: 正解肢(ok)が0個' % uid)
            if bool(q['imgs']) != ('bi' in badge_cls):
                errs.append('%s: 📷バッジと imgs の不一致 (imgs=%d, bi=%s)'
                            % (uid, len(q['imgs']), 'bi' in badge_cls))
            if not any(e['cls'] == 'ee' for e in q['eg']):
                errs.append('%s: ee（選択肢の検討）が無い' % uid)
            for p in q['imgs']:
                if not os.path.exists(os.path.join(BASE, p)):
                    errs.append('%s: 画像が存在しない %s' % (uid, p))
            m = re.search(r'(\d+)\s*つ選べ', strip_tags(q['qt']))
            want = int(m.group(1)) if m else 1
            if not excluded and n_ok != want:
                errs.append('%s: 「%dつ選べ」だが ok=%d 個' % (uid, want, n_ok))

            # --- PDF解答一覧表との突合 ---------------------------------------
            r = rows.get(no)
            if r is None:
                errs.append('%s: 解答一覧表に NO.%d が無い' % (uid, no))
            else:
                if r['kid'].replace('※採点除外', '') != q['episode'].strip('()'):
                    errs.append('%s: 国試番号ずれ HTML=%s PDF=%s'
                                % (uid, q['episode'], r['kid']))
                pdf_ans = sorted(r['ans'].strip().split(',')) if r['ans'].strip() != 'なし' else []
                got = sorted(FW2A[c['t'][0]] for c in q['choices'] if c['ok'])
                if pdf_ans != got:
                    errs.append('%s: 正解ずれ HTML=%s PDF=%s' % (uid, got, pdf_ans))
                pdf_rate = r['rate'].strip()
                pdf_rate = None if pdf_rate in ('', '－', '-') else int(pdf_rate)
                got_rate = q['rate'] if q['rate'] >= 0 else None
                if pdf_rate != got_rate:
                    errs.append('%s: 正答率ずれ HTML=%s PDF=%s' % (uid, got_rate, pdf_rate))
                for cls, col, mark in (('bs', 'type', '★'), ('bc', 'cbt', '○'), ('bh', 'hisshu', '○')):
                    want_b = mark in r[col]
                    if want_b != (cls in badge_cls):
                        errs.append('%s: バッジ %s の不一致 HTML=%s PDF=%s'
                                    % (uid, cls, cls in badge_cls, want_b))

            # --- §2 品質基準 -------------------------------------------------
            nblk += len(q['eg'])
            body = ''.join(e['c'] for e in q['eg'])
            nchr += len(strip_tags(body))
            nkw += len(re.findall(r'<span class="kw[234]?"', body))

        n = len(ch['qs'])
        if n:
            lines.append('ch%02d %-28s %2d問  ブロック%.2f/問  文字%.0f/問  kw%.1f/問'
                         % (ci, ch['title'], n, nblk / n, nchr / n, nkw / n))
            if nblk / n < 3.8:
                warns.append('ch%02d: ブロック数 %.2f < 3.8' % (ci, nblk / n))
            if nchr / n < 500:
                warns.append('ch%02d: 解説文字数 %.0f < 500' % (ci, nchr / n))
            if nkw / n < 10:
                warns.append('ch%02d: kw強調 %.1f < 10' % (ci, nkw / n))

    print('\n'.join(lines))
    print()
    for w in warns:
        print('WARN  ' + w)
    for e in errs:
        print('ERROR ' + e)
    print('\n%s  errors=%d warnings=%d' % ('OK' if not errs else 'NG', len(errs), len(warns)))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
