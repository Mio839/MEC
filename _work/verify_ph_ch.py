# -*- coding: utf-8 -*-
"""
questions_ph.json を新科目HTML生成ガイド §2（品質基準）・§4（採点/画像の不変条件）で検査する。
`_work/verify_ortho_ch.py` の公衆衛生版。

  python _work/verify_ph_ch.py            全章
  python _work/verify_ph_ch.py --ch 1     指定章のみ

さらに巻末解答一覧表（_work/_ph_tmp/anstable.json）と
 正解ラベル・正答率・バッジ・問題数 を突合する（PDFが正本）。
"""
import argparse, io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON = os.path.join(BASE, 'questions_ph.json')
ANS = os.path.join(BASE, '_work', '_ph_tmp', 'anstable.json')
FW2A = {'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g'}

# --- §2 品質基準（問題単位・ERROR） ----------------------------------------
# 2026-08-26: 章平均・WARN 止まりだったのを問題単位の ERROR へ変えた。
# 章平均だと「章の後半だけ薄い」が平均に埋もれて検出できず、しかもガイドの
# 閾値（500字/kw10/ブロック3.8）は実測より遥かに低いので事実上ノーガードだった。
# 下限は第1〜5章155問の実測（最小 863字 / kw31 / 4ブロック）に合わせてある。
# ⚠️ 下げるときは「速度優先でいくつへ下げたか」を必ず引き継ぎ.md に書くこと。
EG_ORDER = ['ep', 'ee', 'em', 'ept']   # 155問すべてがこの順・この4枚だった
MIN_CHARS = 800                        # 1問あたりの解説文字数（タグを除く）
MIN_KW = 25                            # 1問あたりの kw/kw2/kw3/kw4 の数


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def is_calc(q):
    return not q["choices"] and (q.get("ans_label") or "").startswith("計算答：")


def check_answer_label(q, uid, excluded, errs):
    """`.ac`（ans_label）と ok 肢の一致を見る。

    表・図を目視で書き起こした問題は、肢を直したのに ans_label を直し忘れる事故が
    起きる（2026-08-19 のエラー報告修正で3問がこれだった）。ans_label は採点に
    使われないので、ずれても試験モードは無言で通る＝ここで捕まえるしかない。

    規約（第1〜5章155問で実証済み）:
      採点除外 → '（採点除外）'                     ／ 複数正解 → 'ａ・ｄ'
      単一正解 → 正解肢の本文そのまま（全角字＋全角空白＋本文）
    """
    if is_calc(q):
        return
    al = (q.get('ans_label') or '').strip()
    oks = [c['t'].strip() for c in q['choices'] if c['ok']]
    if excluded:
        if '採点除外' not in al:
            errs.append('%s: 採点除外なのに ans_label が「%s」' % (uid, al))
        return
    if not al:
        errs.append('%s: ans_label が空' % uid)
        return
    if re.fullmatch(r'[ａ-ｇ](・[ａ-ｇ])+', al):
        got, want = set(al.split('・')), {t[0] for t in oks}
        if got != want:
            errs.append('%s: ans_label と ok 肢がずれている label=%s ok=%s'
                        % (uid, al, ''.join(sorted(want))))
    elif len(oks) != 1 or al != oks[0]:
        errs.append('%s: ans_label が正解肢の本文と一致しない label=%r ok=%r'
                    % (uid, al[:40], (oks[0][:40] if oks else None)))


def check_quality(q, uid, errs):
    """§2 の品質基準を1問ずつ見る（章平均ではなく問題単位）。"""
    cls = [e['cls'] for e in q['eg']]
    if cls != EG_ORDER:
        errs.append('%s: 解説ブロックが %s（正しくは %s）' % (uid, cls, EG_ORDER))
    body = ''.join(e['c'] for e in q['eg'])
    n = len(strip_tags(body))
    if n < MIN_CHARS:
        errs.append('%s: 解説 %d字 < %d' % (uid, n, MIN_CHARS))
    kw = len(re.findall(r'<span class="kw[234]?"', body))
    if kw < MIN_KW:
        errs.append('%s: kw強調 %d個 < %d' % (uid, kw, MIN_KW))
    # ee は全肢を1つずつ検討する表なので、行数は「見出し行＋選択肢数」以上になる
    tr = sum(len(re.findall(r'<tr', e['c'])) for e in q['eg'] if e['cls'] == 'ee')
    if tr < len(q['choices']) + 1:
        errs.append('%s: ee の行が %d（選択肢%d個ぶんの検討が足りない）'
                    % (uid, tr, len(q['choices'])))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ch', type=int)
    a = ap.parse_args()

    d = json.load(io.open(JSON, encoding='utf-8'))
    if not os.path.exists(ANS):
        # _work/_ph_tmp/ は .gitignore 済み＝別マシンでは存在しない。作り直す。
        print('%s が無い。先に `python _work/ph_pdf.py anstable` を実行すること。' % ANS)
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
            calc = is_calc(q)
            n_ok = sum(1 for c in q['choices'] if c['ok'])
            if n_ok == 0 and not excluded and not calc:
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
            if not excluded and not calc and n_ok != want:
                errs.append('%s: 「%dつ選べ」だが ok=%d 個' % (uid, want, n_ok))

            check_answer_label(q, uid, excluded, errs)
            check_quality(q, uid, errs)

            # --- PDF解答一覧表との突合 ---------------------------------------
            r = rows.get(no)
            if r is None:
                errs.append('%s: 解答一覧表に NO.%d が無い' % (uid, no))
            else:
                # 解答表の国試番号には注記が付くことがある
                # （`※採点除外` のほか、ph NO.15・33・616 は `※不正解者のみ採点除外`）。
                if r['kid'] != q['episode'].strip('()'):
                    errs.append('%s: 国試番号ずれ HTML=%s PDF=%s'
                                % (uid, q['episode'], r['kid']))
                if not calc:
                    pdf_ans = sorted(r['ans'].strip().split(',')) if r['ans'].strip() != 'なし' else []
                    got = sorted(FW2A[c['t'][0]] for c in q['choices'] if c['ok'])
                    if pdf_ans != got:
                        errs.append('%s: 正解ずれ HTML=%s PDF=%s' % (uid, got, pdf_ans))
                pdf_rate = r['rate'].strip()
                pdf_rate = None if pdf_rate in ('', '－', '-') else int(pdf_rate)
                got_rate = q['rate'] if q['rate'] >= 0 else None
                if pdf_rate != got_rate:
                    errs.append('%s: 正答率ずれ HTML=%s PDF=%s' % (uid, got_rate, pdf_rate))
                for cls, col, mark in (('bs', 'sh', '★'), ('bc', 'cbt', '○'), ('bh', 'hisshu', '○')):
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
            # 章平均は「読み値」＝合否は上の問題単位の ERROR が決める。
            # ここは章全体が痩せていないかを一目で見るためだけに残してある。
            if nchr / n < MIN_CHARS * 1.2:
                warns.append('ch%02d: 章平均 %.0f字 が下限 %d の1.2倍を切っている'
                             % (ci, nchr / n, MIN_CHARS))

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
