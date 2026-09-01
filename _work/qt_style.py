# -*- coding: utf-8 -*-
"""① qt の機械整形（旧コア12科目を整形外科式へ）。**変換の正本はこのモジュール1本**。

    旧: <span class="qt-context"><span class="series-label">連問 1/2</span>ステム</span><br/>…で<strong>誤っているの</strong>はどれか。
    新: <span class="kw">次の文を読み、40 と41 の問いに答えよ。</span><br/>ステム<br/><strong>…で誤っているのはどれか。</strong>

やること（この4つだけ。文字は1字も足し引きしない＝下の不変条件で機械検査する）:
  1. qt-context を解体し、連問の宣言文を `<span class="kw">` で先頭に出す
  2. PDFの折り返しに由来する `<br/>` を落とす（項目見出しの直前と設問文の直前だけ残す）
  3. 項目見出し（現病歴：など）を `<b>` で囲む／`SpO2` を `SpO<sub>2</sub>` に
  4. 設問文を1文まるごと `<strong>` で囲む（末尾の「N つ選べ。」まで含める）

⚠️ **不変条件**: タグを剥がして空白を正規化した文字列は、変換の前後で完全一致しなければならない。
   唯一の例外は 1 で補う「次の文を読み、N と M の問いに答えよ。」（PDF原文からの転記）で、
   これは `added` に返して呼び出し側が明示的に数える。破ったものは変換せず素通しさせること。

⚠️ 2026-09-01 に `_work/_circ_tmp/qt_style.py`（gitignore下の作業スクラッチ）から昇格させた。
   循環器で書いたものを呼吸器でもそのまま使う＝**科目固有の分岐を1つも持たせないこと**。
   科目ごとの事情（計算問題の版面など）は呼び出し側で吸収する。

⚠️ **ステムの中身には触らない**。連問6グループで兄弟どうしのステムが違う（Q.80/84/179/204/329/331）が、
   それは原文照合(④)の仕事であって整形の仕事ではない。
"""
import re

# 症例文の項目見出し。PDFの版面で行頭に来るものだけを並べる（長いものを先に）
HEADS = ['入院後経過', '来院時現症', '初診時現症', '現病歴', '既往歴', '家族歴', '生活歴',
         '検査所見', '身体所見', '検査結果', '現　症', '現症', '経過', '所見']
HEAD_RE = re.compile(r'^(?:' + '|'.join(HEADS) + r')\s*[：:]')
TAG = re.compile(r'<[^>]+>')
# 設問文の終わり方（この語を含む最後の文から qt の末尾までが設問文）
Q_MARK = re.compile(r'(どれか|どこか|いくつか|選べ|答えよ|求めよ|正しいのは|誤っているのは|適切なのは|What is|Which of)')
STEM_DECL = re.compile(r'^\s*次の文を読み[、,][^。]{1,40}の問いに答えよ。')


def strip_tags(s):
    """タグを剥がし空白を潰す。不変条件の比較に使う正規形。"""
    return re.sub(r'\s+', '', TAG.sub('', s))


def _split_context(qt):
    """qt-context の外側 span を**タグの深さを数えて**切り出す（正規表現では入れ子で誤る）。
    戻り値 (label, stem_html, rest_html)。qt-context が無ければ (None, None, qt)。"""
    head = '<span class="qt-context">'
    if not qt.startswith(head):
        return None, None, qt
    i = len(head)
    depth = 1
    for m in re.finditer(r'<(/?)span\b[^>]*>', qt[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            end = i + m.start()
            inner = qt[i:end]
            rest = qt[i + m.end():]
            lm = re.match(r'<span class="series-label">([^<]*)</span>', inner)
            label = lm.group(1) if lm else None
            if lm:
                inner = inner[lm.end():]
            return label, inner, rest
    raise ValueError('qt-context の span が閉じていない')


def _find_question_span(html):
    """設問文がどこから始まるかを返す（開始オフセット）。設問文は必ず qt の末尾まで続く。

    文の切れ目（`<br/>` `。` `?` `</span>` `</table>`）を末尾から遡り、
    **新しく足す塊自身が設問語（どれか・選べ…）を含む間だけ**さらに遡る。
    ⚠️ 「塊に設問語が無ければ遡る」にしてはいけない——表(<table>)の中身には設問語が無いので
       先頭まで遡ってしまい、症例文まるごとが太字になる（Q.539/Q.565 で実際に起きた）。
    ⚠️ 「…はどれか。N つ選べ。」は2文で1つの設問文なので、1つ目の塊で必ず1回は遡る。
    """
    # ⚠️ 英文問題（116E-38）は「。」を1つも持たないので、英文の文末（小文字＋ピリオド＋空白）も
    #    切れ目に入れる。数値の小数点（0.14）を拾わないよう直前が英小文字のときだけ。
    bnds = [m.end() for m in re.finditer(r'<br/>|。|[?？]|</span>|</table>|(?<=[a-z])\.(?=\s|[A-Z])', html)]
    # ⚠️ 先頭 0 を番兵として必ず入れる。入れないと「Aはどれか。2 つ選べ。」のように
    #    切れ目が1つしかない問題で遡れず、「2 つ選べ。」だけが設問文になる（実際に起きた）。
    # ⚠️ 冪等性: 変換後の qt は末尾が `。</strong>` なので「。」の切れ目が文字列の
    #    末尾ではなくなり、1回目には無かった切れ目が2回目に現れる。そこで**残りがタグと
    #    空白だけになる切れ目は数えない**。これが無いと2回目に設問文が空になり
    #    `<strong>` が閉じない壊れ方をする（呼吸器の NO.2/10/81/313/315/444 で実際に起きた）。
    bnds = [0] + [b for b in bnds if 0 < b < len(html) and TAG.sub('', html[b:]).strip()]
    i = len(bnds) - 1
    while i > 0:
        chunk = TAG.sub('', html[bnds[i - 1]:bnds[i]]).strip()
        if chunk and not Q_MARK.search(chunk):
            break
        i -= 1
    return bnds[i]


def _drop_wrap_breaks(html, q_start):
    """PDFの折り返しに由来する <br/> を落とす。
    残すのは ①直後が項目見出し ②直後が設問文（q_start）——の2つだけ。"""
    out, pos = [], 0
    for m in re.finditer(r'(?:<br/>)+', html):
        out.append(html[pos:m.start()])
        after = html[m.end():]
        keep = False
        if q_start is not None and m.end() == q_start:
            keep = True          # 設問文の直前の1つだけ残す
        elif q_start is not None and m.end() > q_start:
            keep = False         # 設問文の中に改行は入れない
        elif HEAD_RE.match(TAG.sub('', after).lstrip()):
            keep = True
        out.append('<br/>' if keep else '')
        pos = m.end()
    out.append(html[pos:])
    return ''.join(out)


def _bold_heads(html):
    """行頭の項目見出しを <b> で囲む。<br/> の直後と文字列の先頭だけが対象。"""
    def wrap(s):
        m = HEAD_RE.match(s)
        return '<b>%s</b>%s' % (m.group(0), s[m.end():]) if m else s

    parts = re.split(r'(<br/>)', html)
    for i, p in enumerate(parts):
        if p == '<br/>':
            continue
        if i == 0 or parts[i - 1] == '<br/>':
            parts[i] = wrap(p)
    return ''.join(parts)


def _subscript(html):
    html = re.sub(r'SpO2(?!</sub>)', 'SpO<sub>2</sub>', html)
    return html


def _redo(declared, body):
    """既に変換済みの qt を、宣言文を外した状態から作り直す（冪等性のため）。"""
    q_start = _find_question_span(body)
    body = _drop_wrap_breaks(body, q_start)
    q_start = _find_question_span(body)
    head, q = body[:q_start], body[q_start:]
    q = q.replace('<strong>', '').replace('</strong>', '').strip()
    if head and not head.rstrip().endswith('<br/>'):
        head = head.rstrip() + '<br/>'
    out = '<span class="kw">%s</span><br/>' % declared + _bold_heads(head) + '<strong>' + q + '</strong>'
    return _subscript(out), '', ''


class Skip(Exception):
    """機械整形の対象外。呼び出し側は qt を1バイトも変えずに素通しさせること。"""


def transform(qt, decl=None):
    """qt を整形外科式へ。decl はPDF原文の「次の文を読み、N と M の問いに答えよ。」（連問のみ）。
    戻り値 (new_qt, added, removed)。added は補った宣言文、removed は落とした「連問 n/N」。"""
    # ⚠️ 計算問題は「設問文＝qtの末尾まで」が成り立たない（「…を求めよ。」の後ろに
    #    「ただし〜四捨五入すること。」と「解答：① ②」が続く）。整形せず手当てへ回す。
    if '解答：' in qt:
        raise Skip('計算問題（解答：欄がある）')
    label, stem, rest = _split_context(qt)
    added = ''

    # ⚠️ 冪等性: 一度変換した qt は先頭に <span class="kw">次の文を読み…</span><br/> を持つ。
    #    これを外して declared として持ち回らないと、2回目に _drop_wrap_breaks が
    #    その直後の <br/>（見出しの前ではない）を落として結果が変わる（実際に111問で起きた）。
    if stem is None:
        dm = re.match(r'^<span class="kw">(次の文を読み[^<]*?の問いに答えよ。)</span>(?:<br/>)*', qt)
        if dm:
            return _redo(dm.group(1), qt[dm.end():])

    if stem is not None:
        m = STEM_DECL.match(TAG.sub('', stem))
        if m:
            # ステム自身が宣言文を持っている → その文だけを取り出して kw で囲む
            dm = STEM_DECL.match(stem)
            if not dm:
                raise ValueError('宣言文がタグをまたいでいる')
            declared, stem = dm.group(0).strip(), stem[dm.end():]
            stem = re.sub(r'^(?:<br/>)+', '', stem)
        elif decl:
            declared, added = decl, decl
        else:
            raise ValueError('連問なのに宣言文が無く、PDFからも取れない')
        body = stem
    else:
        declared, body = None, rest
        rest = ''

    whole = (body + rest) if stem is not None else body
    q_start = _find_question_span(whole)
    if q_start is None:
        raise ValueError('設問文の始まりを特定できない')

    whole = _drop_wrap_breaks(whole, q_start)
    # <br/> を落とした後の設問文の位置を取り直す
    q_start = _find_question_span(whole)
    head_part, q_part = whole[:q_start], whole[q_start:]

    q_part = q_part.replace('<strong>', '').replace('</strong>', '').strip()
    if head_part and not head_part.rstrip().endswith('<br/>'):
        head_part = head_part.rstrip() + '<br/>'
    out = _bold_heads(head_part) + '<strong>' + q_part + '</strong>'
    if declared:
        out = '<span class="kw">%s</span><br/>' % declared + out
    return _subscript(out), added, (label or '')


def verify(old, new, added, removed=''):
    """不変条件：タグを剥がして空白を潰した文字列が、
    ①補った宣言文（PDF原文からの転記）と ②落とした「連問 n/N」（原文ではなく画面用のラベル）
    の2つを除いて完全一致すること。"""
    a, b = strip_tags(old), strip_tags(new)
    if removed:
        pre = strip_tags(removed)
        if not a.startswith(pre):
            return '「連問 n/N」が先頭に無い'
        a = a[len(pre):]
    if added:
        pre = strip_tags(added)
        if not b.startswith(pre):
            return '補った宣言文が先頭に無い'
        b = b[len(pre):]
    return None if a == b else '本文が変化した (%d -> %d 字)' % (len(a), len(b))
