# -*- coding: utf-8 -*-
"""
眼科の章の生成器（_work/build_oph_ch{NN}.py）を巻末解答一覧表と機械照合する。

  python _work/verify_oph_ch.py --ch 3

見るもの:
  1) 国試番号・正解肢・正答率・バッジ(bs/bc/bh) が解答一覧表と一致するか
  2) ガイド§4の不変条件 — 正解肢が1つ以上ある／📷バッジと imgs が対応する／
     画像ファイルが実在する／選択肢が a〜e の順に5個ある／「Nつ選べ」と ok の個数が一致する
  3) 4ブロック（patho/ee/deep/point）が揃い、肢別解説が空でないか
  4) 品質基準（解説ブロック3.8/問・500字/問・kw10/問）を満たすか

⚠️ 正解肢が1つも無い問題は、試験モードで**何を選んでも黙って不正解**になる。
   この検査を通してからでないと commit してはいけない。
"""
import argparse, importlib.util, io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(BASE, '_work', '_oph_tmp')


def load_generator(ch):
    p = os.path.join(BASE, '_work', 'build_oph_ch%02d.py' % ch)
    spec = importlib.util.spec_from_file_location('g%d' % ch, p)
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


def main(ch):
    at = os.path.join(TMP, 'anstable.json')
    if not os.path.exists(at):
        sys.exit('先に `python _work/oph_pdf.py anstable` を実行してください')
    rows = {r['no']: r for r in json.load(io.open(at, encoding='utf-8')) if r['ch'] == ch}

    g = load_generator(ch)
    errs = []
    for idx, q in enumerate(g.QUESTIONS):
        no = g.Q_START + idx
        r = rows.get(no)
        if r is None:
            errs.append('NO.%d: 解答表に行が無い' % no)
            continue
        tag = 'NO.%d(%s)' % (no, q['id'])

        if q['id'] != r['kid']:
            errs.append('%s: 国試番号が表と違う（表は %s）' % (tag, r['kid']))

        oks = ''.join(l for (l, _t, ok, _w) in q['choices'] if ok)
        want = r['ans'].replace(',', '').strip()
        if oks != want:
            errs.append('%s: 正解 %s != 表 %s' % (tag, oks or '(なし)', want))
        if not oks:
            errs.append('%s: 正解肢が無い（何を選んでも不正解になる）' % tag)

        want_rate = int(r['rate']) if r['rate'].strip().isdigit() else None
        if q['rate'] != want_rate:
            errs.append('%s: 正答率 %s != 表 %s' % (tag, q['rate'], want_rate))

        want_b = ([('bs') ] if '★' in r['type'] else []) \
            + (['bc'] if '○' in r['cbt'] else []) + (['bh'] if '○' in r['hisshu'] else [])
        got_b = [c for c, _t in q['badges'] if c in ('bs', 'bc', 'bh')]
        if got_b != want_b:
            errs.append('%s: バッジ %s != 表 %s' % (tag, got_b, want_b))

        has_bi = any(c == 'bi' for c, _t in q['badges'])
        if has_bi != bool(q['imgs']):
            errs.append('%s: 📷バッジ=%s と imgs=%s が不一致' % (tag, has_bi, bool(q['imgs'])))
        for src in q['imgs']:
            if not os.path.exists(os.path.join(BASE, '眼科', src.replace('/', os.sep))):
                errs.append('%s: 画像が無い %s' % (tag, src))

        letters = [l for (l, _t, _ok, _w) in q['choices']]
        if letters != ['a', 'b', 'c', 'd', 'e']:
            errs.append('%s: 選択肢が a〜e の順でない %s' % (tag, letters))

        m = re.search(r'([2-5])\s*つ選べ', q['qt'])
        if m:
            n = int(m.group(1))
            if len(oks) != n:
                errs.append('%s: 「%dつ選べ」だが ok は %d 個' % (tag, n, len(oks)))
        elif len(oks) != 1:
            errs.append('%s: 単一選択なのに ok が %d 個' % (tag, len(oks)))

        for key in ('patho', 'deep', 'point'):
            if not q[key]:
                errs.append('%s: %s ブロックが無い' % (tag, key))
        if not all(w for (_l, _t, _ok, w) in q['choices']):
            errs.append('%s: 肢別解説が空の選択肢がある' % tag)

    n_want = max(rows) - min(rows) + 1
    if len(g.QUESTIONS) != n_want:
        errs.append('問題数が %d（%d であるべき）' % (len(g.QUESTIONS), n_want))

    out = ['ch%d: %d問  ★%d  画像%d問 %d枚'
           % (ch, len(g.QUESTIONS),
              sum(1 for q in g.QUESTIONS if any(c == 'bs' for c, _t in q['badges'])),
              sum(1 for q in g.QUESTIONS if q['imgs']),
              sum(len(q['imgs']) for q in g.QUESTIONS))]

    jp = os.path.join(BASE, 'questions_oph.json')
    if os.path.exists(jp):
        chs = json.load(io.open(jp, encoding='utf-8'))['chapters']
        if len(chs) >= ch:
            qs = chs[ch - 1]['qs']
            nb = sum(len(q['eg']) for q in qs) / len(qs)
            nc = sum(len(re.sub(r'<[^>]+>', '', ''.join(e['h'] + e['c'] for e in q['eg'])))
                     for q in qs) / len(qs)
            nk = sum(len(re.findall(r'class="kw[0-9]?"', ''.join(e['c'] for e in q['eg'])))
                     for q in qs) / len(qs)
            out.append('品質: ブロック %.1f/問（目標3.8）  %.0f字/問（目標500+）  kw %.0f/問（目標10+）'
                       % (nb, nc, nk))

    out.append('')
    out.append('照合エラー: %d 件' % len(errs))
    out += ['  ' + e for e in errs]
    txt = '\n'.join(out)
    os.makedirs(TMP, exist_ok=True)
    io.open(os.path.join(TMP, 'verify_ch%02d.txt' % ch), 'w', encoding='utf-8').write(txt)
    print(txt)
    return 1 if errs else 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser()
    ap.add_argument('--ch', type=int, required=True)
    sys.exit(main(ap.parse_args().ch))
