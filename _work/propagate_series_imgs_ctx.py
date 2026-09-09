# -*- coding: utf-8 -*-
"""連問の「共通ステムが参照する図」を、そのステムを表示する兄弟全員に付ける（書式②）。

⚠️ 兄弟の**書式①**（作り直した科目の「次の文を読み、40 と41 の問いに答えよ。」宣言文）は
   `_work/propagate_series_imgs.py` が扱う。こちらは**書式②＝旧コア12科目**が使う
   `<span class="qt-context">` に共通ステムを丸ごと入れる形が対象。2本あるのは
   「群をどう見つけるか」だけが違うからで、規約そのものは同じ:

CLAUDE.md「連問の図」の 2026-09-06 規約:
  設問Mが持つ図 ＝ Mの qt に含まれる図の宣言文に対応する図すべて。
書式②は兄弟全員が同じステムを画面に出すので、ステムに宣言文があれば全員がその図を持つ。

⚠️ サブ設問が自分の図を宣言している群には触らない（その図はその兄弟だけのもの）。
⚠️ ステムの宣言枚数と、図を持つ兄弟の実際の枚数が合わない群にも触らない。
   合わないのは「サブ設問の図が混ざっている」（dige_ch05_q252 は
   「生検組織のH-E 染色標本（C ①～⑤）のうち…どれか。」＝**「示す」で終わらない宣言**）か、
   「ステムの図がそもそも欠けている」（dige_ch04_q203 は A，B，C の宣言に対し1枚しか無い）
   のどちらかで、**どちらも機械では決められない**。
⚠️ ファイル名は図を持ち込んだ設問の国試番号のまま（119B-43_1.jpeg が 119B-44 にも付く）。
   `pdf_audit.py` は同じ連問グループの兄弟の番号なら不一致として挙げない。
⚠️ imgs を足した設問には 📷バッジ(bi) も足すこと（バッジと imgs の一致は監査項目）。

  python _work/propagate_series_imgs_ctx.py --dry-run [questions_*.json ...]

引数を省くと questions_neur.json だけを見る。冪等。
"""
import json, io, re, sys
sys.stdout.reconfigure(encoding='utf-8')

DECL = re.compile(r'[^\n。]{0,80}?を(?:別に)?示す。')
CTX_OPEN = '<span class="qt-context">'
LABELS = re.compile(r'[（(]\s*([A-Z](?:\s*[，,、]\s*[A-Z])*|[A-Z]\s*[～~〜-]\s*[A-Z])\s*[）)]')


def split_qt(qt):
    """qt を（共通ステム, サブ設問）に割る。ステムの中に <span> が入れ子になるので数える。

    ⚠️ 非貪欲な正規表現で `(.*?)</span>` と書くと series-label の閉じタグで切れて、
       すべての設問のステムが「連問 1/3」だけになる＝全問が同じ群に見える。"""
    i = qt.find(CTX_OPEN)
    if i < 0:
        return None, qt
    j = i + len(CTX_OPEN)
    depth, k = 1, len(qt)
    for m in re.finditer(r'<span[ >][^>]*>|</span>', qt[j:]):
        if m.group(0) == '</span>':
            depth -= 1
            if depth == 0:
                k = j + m.start()
                break
        else:
            depth += 1
    return qt[j:k], qt[k + len('</span>'):]


def txt(h):
    h = re.sub(r'<span class="series-label">.*?</span>', '', h)
    return re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>', '\n', h))


def declared(stem_text):
    """ステムが宣言している図の枚数。宣言が無ければ 0。

    「胸部造影CT（A，B，C）を示す。」→ 3 ／「頸部MRA を示す。」→ 1 ／「（A～C）」→ 3。"""
    n = 0
    for s in DECL.findall(stem_text):
        m = LABELS.search(re.sub(r'を(?:別に)?示す。$', '', s))
        if not m:
            n += 1
            continue
        body = m.group(1)
        if re.search(r'[～~〜-]', body):
            a, b = re.findall(r'[A-Z]', body)[:2]
            n += ord(b) - ord(a) + 1
        else:
            n += len(re.findall(r'[A-Z]', body))
    return n


def dump(d, raw):
    """元の整形を崩さずに書き戻す。

    ⚠️ questions_*.json の整形はファイルごとにバラバラ（compact / indent=1 / indent=2 /
       CRLF 等）で、揃えると1問直しただけで全行が差分になりレビューできない
       （CLAUDE.md「データソースの方針」）。**元の文字列を再現できる形を見つけてから**
       書く——見つからなければ書かずに落とす。
    ⚠️ indent を付けると json.dumps の既定の要素区切りは ',' になる（行末に空白を残さない）。
       (', ', ': ') を明示すると全行の末尾に空白が1つ増えてどの整形にも一致しなくなる。"""
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
    changed = []
    for ch in d['chapters']:
        groups = {}
        for q in ch['qs']:
            stem, rest = split_qt(q['qt'])
            if stem is None:
                continue
            groups.setdefault(re.sub(r'\s+', '', txt(stem)), []).append((q, stem, rest))
        for items in groups.values():
            if len(items) < 2:
                continue
            want = declared(txt(items[0][1]))
            if not want:
                continue                      # ステムが図を宣言していない群は対象外
            holders = [x for x in items if x[0].get('imgs')]
            if len(holders) != 1:
                continue                      # 図の出どころが1問に定まらない群は手で見る
            q0, _, rest0 = holders[0]
            if DECL.search(txt(rest0)):
                continue                      # その図はサブ設問のもの＝兄弟に配らない
            if len(q0['imgs']) != want:
                print('  skip %-18s ステム宣言 %d枚 ≠ 実際 %d枚'
                      % (q0['uid'], want, len(q0['imgs'])))
                continue
            for q, _, _ in items:
                if q is q0 or q.get('imgs'):
                    continue
                q['imgs'] = list(q0['imgs'])
                if not any(b['cls'] == 'bi' for b in q['badges']):
                    q['badges'].append({'cls': 'bi', 't': '📷 画像'})
                changed.append((q['uid'], q0['uid'], q['imgs']))
    for uid, src, imgs in changed:
        print('%-20s ← %-16s %s' % (uid, src, imgs))
    print('---- %s: %d 問に付けた' % (path, len(changed)))
    if changed and not dry:
        io.open(path, 'w', encoding='utf-8', newline='').write(dump(d, raw))
    return len(changed)


if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    paths = [a for a in sys.argv[1:] if not a.startswith('--')] or ['questions_neur.json']
    for p in paths:
        run(p, dry)
