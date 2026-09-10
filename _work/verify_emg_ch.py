# -*- coding: utf-8 -*-
"""
questions_emg.json を新科目HTML生成ガイド §2（品質基準）・§4（採点/画像の不変条件）で検査する。
`_work/verify_ph_ch.py` の救急版。

  python _work/verify_emg_ch.py            全章
  python _work/verify_emg_ch.py --ch 1     指定章のみ

さらに巻末解答一覧表（_work/emg_anstable.json）と
 国試番号・正解・正答率・必修/一般/臨床バッジ を突合する（PDFが正本）。

⚠️ この科目の解答一覧表には **★列・CBT列が無い**（中毒・職業病と同じく版面が違う）。
   したがってバッジの突合対象は bh（必修）・bip（一般）・brn（臨床）の3つだけ。
⚠️ NO.33 は「オリジナル」問題で国試番号も正答率も無い。NO.28・29 は「改変」で正答率が無い。
"""
import argparse, io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON = os.path.join(BASE, 'questions_emg.json')
ANS = os.path.join(BASE, '_work', 'emg_anstable.json')
FW2A = {'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g'}

# --- §2 品質基準（問題単位・ERROR） ----------------------------------------
# verify_ph_ch.py と同じ下限。章平均・WARN では「章の後半だけ薄い」が検出できない。
EG_ORDER = ['ep', 'ee', 'em', 'ept']
MIN_CHARS = 800                        # 1問あたりの解説文字数（タグを除く）
MIN_KW = 25                            # 1問あたりの kw/kw2/kw3/kw4 の数

KID = re.compile(r'\d{2,3}[A-Z]-\d{1,3}')


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def check_answer_label(q, uid, errs):
    """`.ac`（ans_label）と ok 肢の一致を見る。

    ans_label は採点に使われないので、ずれても試験モードは無言で通る＝ここでしか止まらない。
      複数正解 → 'ａ・ｄ' ／ 単一正解 → 正解肢の本文そのまま
    """
    al = (q.get('ans_label') or '').strip()
    oks = [c['t'].strip() for c in q['choices'] if c['ok']]
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
    tr = sum(len(re.findall(r'<tr', e['c'])) for e in q['eg'] if e['cls'] == 'ee')
    if tr < len(q['choices']) + 1:
        errs.append('%s: ee の行が %d（選択肢%d個ぶんの検討が足りない）'
                    % (uid, tr, len(q['choices'])))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ch', type=int)
    a = ap.parse_args()

    d = json.load(io.open(JSON, encoding='utf-8'))
    rows = {r['no']: r for r in json.load(io.open(ANS, encoding='utf-8'))}
    errs, warns, lines = [], [], []

    for ci, ch in enumerate(d['chapters'], 1):
        if a.ch and ci != a.ch:
            continue
        nblk = nchr = nkw = 0
        for q in ch['qs']:
            uid = q['uid']
            no = int(re.match(r'.*_q(\d+)$', uid).group(1))
            badge_cls = [b['cls'] for b in q['badges']]

            # --- §4 不変条件 -------------------------------------------------
            n_ok = sum(1 for c in q['choices'] if c['ok'])
            if n_ok == 0:
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
            if n_ok != want:
                errs.append('%s: 「%dつ選べ」だが ok=%d 個' % (uid, want, n_ok))
            # 一般・臨床はどちらか必ず1つ（実測: 68問すべて）
            if ('bip' in badge_cls) == ('brn' in badge_cls):
                errs.append('%s: 一般/臨床バッジがちょうど1つでない' % uid)

            check_answer_label(q, uid, errs)
            check_quality(q, uid, errs)

            # --- PDF解答一覧表との突合 ---------------------------------------
            r = rows.get(no)
            if r is None:
                errs.append('%s: 解答一覧表に NO.%d が無い' % (uid, no))
            else:
                want_kids = KID.findall(r['kokushi'])
                got_kids = KID.findall(q['episode'])
                if want_kids != got_kids:
                    errs.append('%s: 国試番号ずれ HTML=%s PDF=%s'
                                % (uid, got_kids, want_kids))
                pdf_ans = sorted(r['ans'].strip().split(','))
                got = sorted(FW2A[c['t'][0]] for c in q['choices'] if c['ok'])
                if pdf_ans != got:
                    errs.append('%s: 正解ずれ HTML=%s PDF=%s' % (uid, got, pdf_ans))
                got_rate = q['rate'] if q['rate'] >= 0 else None
                if r['rate'] != got_rate:
                    errs.append('%s: 正答率ずれ HTML=%s PDF=%s' % (uid, got_rate, r['rate']))
                for cls, key in (('bh', 'hisshu'), ('bip', 'ippan'), ('brn', 'rinsho')):
                    if r[key] != (cls in badge_cls):
                        errs.append('%s: バッジ %s の不一致 HTML=%s PDF=%s'
                                    % (uid, cls, cls in badge_cls, r[key]))

            # --- §2 品質基準（章平均は読み値） ---------------------------------
            nblk += len(q['eg'])
            body = ''.join(e['c'] for e in q['eg'])
            nchr += len(strip_tags(body))
            nkw += len(re.findall(r'<span class="kw[234]?"', body))

        n = len(ch['qs'])
        if n:
            lines.append('ch%02d %-34s %2d問  ブロック%.2f/問  文字%.0f/問  kw%.1f/問'
                         % (ci, ch['title'], n, nblk / n, nchr / n, nkw / n))
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
