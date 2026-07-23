# -*- coding: utf-8 -*-
"""
build_qmeta.py — questions_*.json から設問メタ qmeta.json（全科目1ファイル）を生成する。

なぜ別ファイルか:
  問題データ(questions_*.json)は pdf_audit.py がPDFを正本に中身まで照合している「正本」であり、
  分析用の派生情報を混ぜると監査対象が汚れる。qmeta は完全な派生物（いつでも再生成できる）なので
  独立したファイルに置き、questions_*.json には一切触れない。

何を出すか:
  ty  主分類（1つだけ）: ix=検査 / tx=治療 / mgmt=対応・方針 / dx=診断 / know=知識
  f   フラグ（複数可）: neg=否定形 / multi=複数選択 / img=画像 / calc=計算 / case=症例 /
                        excl=採点除外 / ungraded=正解肢ゼロ（何を選んでも不正解になる問題）
  n   必要選択数（.choices の ok の個数。CLAUDE.md の不変条件どおり採点の根拠はこれだけ）
  r   本番正答率（rate。無い問題は null）
  y   国試回（episode "(117B-24)" の 117）

使い方:
  python _work/build_qmeta.py            # 全科目（questions_*.json を変えたら都度これを流す）
  python _work/build_qmeta.py endo resp  # 集計表示を指定prefixに絞る（出力は常に全科目）
"""
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TAG_RE = re.compile(r'<[^>]+>')
WS_RE = re.compile(r'\s+')
# 末尾の「Nつ選べ」は設問の型ではなく選択数の指定なので、主分類の判定前に落とす
NSEL_RE = re.compile(r'[0-9０-９一二三四五六七八九]+\s*つ選べ[。．]?\s*$')


def plain(html):
    """HTMLタグと空白を落として素のテキストにする"""
    return WS_RE.sub('', TAG_RE.sub('', html or ''))


# 主分類。上から順に最初に当たったものを採る。
# 検査を治療・診断より先に見るのは「診断に有用な検査はどれか」「次に行うべき検査はどれか」を
# 診断/対応ではなく検査として拾うため（設問が求めているのは検査の選択だから）。
TYPE_RULES = [
    ('ix',   re.compile(r'検査|所見|測定|採取|精査|培養|染色|生検|診断に(最も)?(有用|役立つ|必要)')),
    ('tx',   re.compile(r'治療|投与|薬|処置|手術|術式|化学療法|放射線|輸血|禁忌')),
    ('mgmt', re.compile(r'対応|対処|方針|管理|説明|指導|まず行う|次に行う|まず.{0,3}すべき|搬送|紹介')),
    ('dx',   re.compile(r'診断|考えられる|可能性が高い|疑われる|疾患はどれか|病態はどれか|原因は')),
]
TYPE_DEFAULT = 'know'

NEG_RE = re.compile(
    r'でないのはどれか|ないのはどれか|誤っている|適切でない|正しくない|不適切|'
    r'必要(が|は)?ないの|行わないの|該当しないの|含まれないの'
)
# 症例問題: 「52歳の男性」「生後3か月の男児」等。年齢表記が無くても来院/受診の記述があれば症例とみなす
CASE_AGE_RE = re.compile(r'[0-9０-９]+\s*(歳|か月|ヵ月|ヶ月|週|日)[^。]{0,8}?(男|女)')
CASE_CTX_RE = re.compile(r'(患者|患児).{0,20}(来院|受診|搬送|入院|紹介)|主訴|現病歴')
# 計算問題は「設問文に数値が出てくるか」では判定できない（症例文の検査値でほぼ全問が引っかかる）。
# 選択肢そのものが数値であることを根拠にする。
CHOICE_LABEL_RE = re.compile(r'^[ａ-ｅa-eA-Eア-オ①-⑩]\s*[　\s.．、]*')
NUMERIC_CHOICE_RE = re.compile(
    r'^[約およそ]?[0-9０-９][0-9０-９.,．，/]*\s*'
    r'(mg|g|kg|mL|L|mEq|mmol|mmHg|kcal|単位|%|％|℃|倍|/分|/日|回|歳|日|週|時間|分|秒|mm|cm)?$'
)
EPISODE_RE = re.compile(r'(\d+)[A-Za-z]')


def ask_sentence(stem):
    """設問が実際に問うている最後の一文を返す。

    症例文まで含めて分類すると「血液所見…」「胸部エックス線所見…」の記述で
    ほぼ全問が『検査』判定になってしまう。判定対象は末尾の設問文に限定する。
    """
    parts = [p for p in re.split(r'[。．]', stem) if p]
    if not parts:
        return stem
    ask = parts[-1]
    # 「（図）」等で終わる場合は直前の文まで遡って設問文を拾う
    i = len(parts) - 2
    while len(ask) < 8 and i >= 0:
        ask = parts[i] + ask
        i -= 1
    return ask


def numeric_choice_count(choices):
    n = 0
    for c in choices:
        t = plain(c.get('t') or '')
        t = CHOICE_LABEL_RE.sub('', t)
        if t and NUMERIC_CHOICE_RE.match(t):
            n += 1
    return n


def classify(q):
    qt_raw = q.get('qt') or ''
    qt = plain(qt_raw)
    stem = NSEL_RE.sub('', qt)
    ask = ask_sentence(stem)

    ty = TYPE_DEFAULT
    for name, rx in TYPE_RULES:
        if rx.search(ask):
            ty = name
            break

    choices = q.get('choices') or []
    n_ok = sum(1 for c in choices if c.get('ok'))

    flags = []
    if NEG_RE.search(ask):
        flags.append('neg')
    if n_ok >= 2:
        flags.append('multi')
    if q.get('imgs'):
        flags.append('img')
    # 選択肢の過半かつ3つ以上が数値なら計算・数値選択問題とみなす
    if len(choices) >= 3 and numeric_choice_count(choices) >= max(3, len(choices) // 2):
        flags.append('calc')
    if CASE_AGE_RE.search(qt) or CASE_CTX_RE.search(qt):
        flags.append('case')

    badges = q.get('badges') or []
    btexts = [(b.get('t') or '').strip() for b in badges]
    if '採点除外' in btexts or '採点除外' in (q.get('ans_sub') or ''):
        flags.append('excl')
    # 正解肢ゼロ＝何を選んでも不正解。分析の母数から外せるよう印を付ける（CLAUDE.md の不変条件）
    if n_ok == 0:
        flags.append('ungraded')

    y = None
    m = EPISODE_RE.search(q.get('episode') or '')
    if m:
        y = int(m.group(1))

    rate = q.get('rate')
    return {
        'ty': ty,
        'f': flags,
        'n': n_ok,
        'r': rate if isinstance(rate, int) else None,
        'y': y,
    }


def build(prefix):
    """1科目ぶんを分類して {uid: meta} を返す（ファイル書き出しはしない）"""
    src = os.path.join(ROOT, 'questions_%s.json' % prefix)
    with open(src, encoding='utf-8') as f:
        data = json.load(f)

    out = {}
    for ch in data.get('chapters', []):
        for q in ch.get('qs', []):
            uid = q.get('uid')
            if not uid:
                continue
            out[uid] = classify(q)
    return out


def main():
    args = sys.argv[1:]
    prefixes = sorted(
        fn[len('questions_'):-len('.json')]
        for fn in os.listdir(ROOT)
        if fn.startswith('questions_') and fn.endswith('.json')
    )
    only = set(args)

    # 出力は科目別に分けず1ファイルにまとめる。消費側は stats.html だけで、しかも
    # 科目横断のヒートマップを描くため常に全科目を必要とするから、fetchは1回で済ませたい。
    all_q = {}
    grand_ty = {}
    grand_f = {}
    total = 0
    for p in prefixes:
        out = build(p)
        if only and p not in only:
            continue
        all_q.update(out)
        ty, fl = {}, {}
        for m in out.values():
            ty[m['ty']] = ty.get(m['ty'], 0) + 1
            for x in m['f']:
                fl[x] = fl.get(x, 0) + 1
        total += len(out)
        for k, v in ty.items():
            grand_ty[k] = grand_ty.get(k, 0) + v
        for k, v in fl.items():
            grand_f[k] = grand_f.get(k, 0) + v
        tys = ' '.join('%s=%d' % (k, ty[k]) for k in sorted(ty, key=lambda k: -ty[k]))
        print('%-9s %4d問  %s' % (p, len(out), tys))

    if only:
        print('（指定prefixのみ集計。qmeta.json は常に全科目で書き出す）')

    jst = timezone(timedelta(hours=9))
    doc = {
        'v': 1,
        'generated': datetime.now(jst).strftime('%Y-%m-%d'),
        'subjects': prefixes,
        'q': all_q if not only else {},
    }
    if only:
        # 部分指定でも出力は全科目ぶんを作り直す（取りこぼしを残さない）
        doc['q'] = {}
        for p in prefixes:
            doc['q'].update(build(p))
    dst = os.path.join(ROOT, 'qmeta.json')
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))

    print('-' * 60)
    print('qmeta.json: %d問' % len(doc['q']))
    if total:
        print('主分類: ' + ' '.join('%s=%d(%.0f%%)' % (k, v, v * 100.0 / total)
                                    for k, v in sorted(grand_ty.items(), key=lambda x: -x[1])))
        print('フラグ: ' + ' '.join('%s=%d(%.0f%%)' % (k, v, v * 100.0 / total)
                                    for k, v in sorted(grand_f.items(), key=lambda x: -x[1])))


if __name__ == '__main__':
    main()
