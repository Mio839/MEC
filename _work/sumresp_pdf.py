# -*- coding: utf-8 -*-
"""サマライズ呼吸器（sumresp）の PDF 読み取り。

  python _work/sumresp_pdf.py parse            2冊の問題 → _work/sumresp_parsed.json（生成器の材料）
  python _work/sumresp_pdf.py render S P [dpi] ページ P を scratch へ PNG で描画（S = sum / lesson / ref）

PDF は3冊（MEC問題文pdf/）:
  sum    国試サマライズ・メジャー・呼吸器（表紙2026）.pdf   56p・8章39問。解答は巻末 p.54 の表
  lesson 2026Lesson呼吸器.pdf                              10p・19問
  ref    2026Lesson呼吸器　参考資料・問題リスト.pdf          6p・Lesson の参考資料1〜27と解答（p.6）

版面:
  - sum は必修講座と同じ組版（本文 x≈67・右端 x>555 に縦書きの章見出し）なので、行を読む関数は
    hisshu_pdf.page_lines / merged_lines をそのまま使う。見出しは「N.\t（国試番号）↗2」。
  - lesson は別の組版（本文 x≈54・右端まで本文が届く）。見出しは「問題N」、国試番号は選択肢の
    後ろの「[113E-8 改変]」。選択肢が1行に「ａ 胸部MRI  ｂ 冠動脈造影 …」と並ぶ問題がある。
    ⚠️ 康熙部首（⾞ U+2F9E など）が混ざっているので NFKC で普通の漢字へ戻す。
"""
import io, json, os, re, sys, unicodedata

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hisshu_pdf as H                                        # noqa: E402

PDFS = {
    'sum': 'MEC問題文pdf/国試サマライズ・メジャー・呼吸器（表紙2026）.pdf',
    'lesson': 'MEC問題文pdf/2026Lesson呼吸器.pdf',
    'ref': 'MEC問題文pdf/2026Lesson呼吸器　参考資料・問題リスト.pdf',
}
PARSED = '_work/sumresp_parsed.json'
SUM_PAGES = range(5, 54)            # 1始まり（p.54 が解答表）
FW = H.FW


def die(msg):
    print('*** ' + msg)
    sys.exit(1)


# CJK部首補助（U+2E80〜U+2EFF）はほとんど NFKC の分解を持たないので手で対応させる
RADICAL_SUP = str.maketrans('⻑⻩⻘⻝⻭⻄⻣⻤⻲⻨⻯⻫⻖⻌', '長黄青食歯西骨鬼亀麦竜斉阝辶')


def kangxi(s):
    """康熙部首（U+2F00〜U+2FDF）は NFKC で、CJK部首補助は RADICAL_SUP で普通の漢字へ。"""
    s = s.translate(RADICAL_SUP)
    return ''.join(unicodedata.normalize('NFKC', c) if '⼀' <= c <= '⿟' else c for c in s)


SUM_HDR = re.compile(r'^(\d+)\.\s*（(.+?)）\s*(↗[₁₂₃₄1-4]|↘|→)?\s*$')
CHOICE_START = re.compile(r'^[' + FW + r'f](?:　|\t| {1,3})')
CHOICE_SPLIT = re.compile(r'(?:^|(?<=[\t ]))([' + FW + r'f])(?:　|\t| {1,3})')
LABEL = re.compile(r'[A-EＡ-Ｅa-e]')


def _lines(page):
    return [l for l in H.merged_lines(page) if not LABEL.fullmatch(l['text'].strip())]


def parse_sum(doc):
    probs, cur, mode = [], None, None
    for pn in SUM_PAGES:
        page = doc[pn - 1]
        cur, mode = None, None                      # 問題はページをまたがない（検算で確かめる）
        for ln in _lines(page):
            st = ln['text'].strip()
            uni = ln['uni'].strip()
            if st == '□□□':
                cur, mode = None, 'wait'
                continue
            m = SUM_HDR.match(uni.replace('\t', ' '))
            if m and mode == 'wait':
                cur = dict(src='sum', no=int(m.group(1)), kid=m.group(2).strip(), irt=m.group(3) or '',
                           page=pn, y=ln['y0'], qt=[], choices=[])
                probs.append(cur)
                mode = 'qt'
                continue
            if cur is None:
                continue
            if CHOICE_START.match(st) and mode in ('qt', 'ch'):
                parts = CHOICE_SPLIT.split(uni)[1:]
                for i in range(0, len(parts), 2):
                    cur['choices'].append([parts[i], parts[i + 1].strip('\t 　')])
                cur['last_y'] = ln['y0']
                mode = 'ch'
                continue
            if mode == 'qt':
                cur['qt'].append([ln['y0'], ln['x0'], ln['text'], ln['html'], ln['x1']])
            elif mode == 'ch':
                # 折り返した選択肢（Q.35 の「…入院して治療しま／しょう」）
                if ln['x0'] >= 76 and ln['y0'] - cur['last_y'] < 16 and ln['x0'] < 300:
                    cur['choices'][-1][1] += uni
                    cur['last_y'] = ln['y0']
                else:
                    cur['end_y'] = ln['y0']
                    cur, mode = None, None
    return probs


LES_HDR = re.compile(r'^問題\s*([０-９0-9]+)\s*$')
LES_KID = re.compile(r'^\[(.+?)\]\s*$')


def parse_lesson(doc):
    H.SIDEBAR_X = 600                               # lesson は右端まで本文が組まれている
    probs, cur, mode = [], None, None
    try:
        for pn in range(1, doc.page_count + 1):
            page = doc[pn - 1]
            for ln in _lines(page):
                st = kangxi(ln['text'].strip())
                uni = kangxi(ln['uni'].strip())
                html = kangxi(ln['html'])
                m = LES_HDR.match(st)
                if m:
                    no = int(unicodedata.normalize('NFKC', m.group(1)))
                    cur = dict(src='lesson', no=no, kid='', page=pn, y=ln['y0'], qt=[], choices=[])
                    probs.append(cur)
                    mode = 'qt'
                    continue
                if cur is None:
                    continue
                m = LES_KID.match(st)
                if m and mode in ('qt', 'ch'):
                    cur['kid'] = m.group(1).strip()
                    cur['end_y'] = ln['y0']
                    cur, mode = None, None
                    continue
                if CHOICE_START.match(st) and mode in ('qt', 'ch'):
                    parts = CHOICE_SPLIT.split(uni)[1:]
                    for i in range(0, len(parts), 2):
                        cur['choices'].append([parts[i], parts[i + 1].strip('\t 　')])
                    mode = 'ch'
                    continue
                if mode == 'qt':
                    cur['qt'].append([ln['y0'], ln['x0'], st, html, ln['x1']])
                elif mode == 'ch':
                    cur.setdefault('tails', []).append(st)
    finally:
        H.SIDEBAR_X = 555
    return probs


def cmd_parse():
    s = parse_sum(fitz.open(PDFS['sum']))
    l = parse_lesson(fitz.open(PDFS['lesson']))
    err = []
    if [p['no'] for p in s] != list(range(1, 40)):
        err.append('sum の番号: %s' % [p['no'] for p in s])
    if [p['no'] for p in l] != list(range(1, 20)):
        err.append('lesson の番号: %s' % [p['no'] for p in l])
    for p in s + l:
        tag = '%s%d' % (p['src'], p['no'])
        letters = [c[0] for c in p['choices']]
        want = list(FW[:len(letters)])
        if len(letters) == 6 and letters[5] == 'f':
            want[5] = 'f'
        if (letters != want or len(letters) < 2) and (p['src'], p['no']) != ('lesson', 15):   # 選択肢が画像
            err.append('%s p%d: 選択肢の並び %s' % (tag, p['page'], ''.join(letters)))
        if not p['qt']:
            err.append('%s: 設問文が空' % tag)
        if p['src'] == 'lesson' and not p['kid']:
            err.append('%s: 国試番号が無い' % tag)
        blob = json.dumps(p, ensure_ascii=False)
        left = sorted({c for c in blob if '⺀' <= c <= '⿟'})
        if left:
            err.append('%s: 部首の字が残っている %s' % (tag, ''.join(left)))
        for t in p.get('tails', []):
            err.append('%s: 選択肢の後ろに残った行 %s' % (tag, t))
    io.open(PARSED, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(dict(sum=s, lesson=l), ensure_ascii=False, indent=1))
    print('sum %d問・lesson %d問 → %s' % (len(s), len(l), PARSED))
    for e in err:
        print('   ', e)
    print('検算 %d件' % len(err))


def cmd_render(which, pn, dpi=150):
    scratch = os.environ.get('SCRATCH', '.')
    doc = fitz.open(PDFS[which])
    out = os.path.join(scratch, 'sr_%s_p%d_%d.png' % (which, pn, dpi))
    doc[pn - 1].get_pixmap(dpi=dpi).save(out)
    print(out)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'parse':
        cmd_parse()
    elif cmd == 'render':
        cmd_render(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]) if len(sys.argv) > 4 else 150)
    else:
        print(__doc__)
