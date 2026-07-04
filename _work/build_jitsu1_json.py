# -*- coding: utf-8 -*-
"""
jitsu1_parsed.json + jitsu1_images_map.json + jitsu1_supplement.py
  → questions_jitsu1.json （study.html の他科目と同一スキーマ）
"""
import json, re, sys
sys.path.insert(0, r'C:\Users\coool\Desktop\MEC\_work')
from jitsu1_supplement import SUPPLEMENT

PARSED = r'C:\Users\coool\Desktop\MEC\_work\jitsu1_parsed.json'
IMAGES_MAP = r'C:\Users\coool\Desktop\MEC\_work\jitsu1_images_map.json'
OUT = r'C:\Users\coool\Desktop\MEC\questions_jitsu1.json'
IMG_BASE = '実力試験/jitsu1/images/'

qs = json.load(open(PARSED, encoding='utf-8'))
img_map = json.load(open(IMAGES_MAP, encoding='utf-8'))
byid = {q['marker']: q for q in qs}


def format_choice_text(label, parts):
    if len(parts) >= 2:
        return f'{label}　{parts[0]}　：{"".join(parts[1:])}'
    elif parts:
        return f'{label}　{parts[0]}'
    return label


def format_qt(stem):
    s = stem.replace('\n', '')
    s = re.sub(r' {2,}', ' ', s).strip()
    sentences = [x for x in s.split('。') if x.strip()]
    if len(sentences) <= 1:
        return s
    body = '。'.join(sentences[:-1]) + '。'
    question = sentences[-1].strip() + '。'
    return body + '<br/>' + question


# 選択肢ラベルの開始位置（文頭 or 句点直後にある ａ / ａ・ｂ / ａ～ｅ 等）
_LABEL_START_RE = re.compile(r'(?:^|(?<=。)|(?<=。 ))([ａ-ｇｎ](?:[・～][ａ-ｇｎ])*)[　 ]')
_RANGE_ORDER = 'abcdefg'


def _parse_label_letters(label_text):
    letter_map = dict(zip('ａｂｃｄｅｆｇ', 'abcdefg'))
    if '～' in label_text:
        parts = label_text.split('～')
        start = letter_map.get(parts[0][:1])
        end = letter_map.get(parts[-1][:1])
        if start and end:
            si, ei = _RANGE_ORDER.index(start), _RANGE_ORDER.index(end)
            return set(_RANGE_ORDER[si:ei + 1])
        return set()
    return {letter_map[ch] for ch in label_text.replace('・', '') if ch in letter_map}


def extract_ans_sub(explanation_raw, answer_letters):
    # PDFの改行はレイアウト上の折返しに過ぎず、単語やフレーズの途中で改行される
    # ことがあるため、\n を除去して連続テキストとして扱い、選択肢ラベル（文頭
    # または句点直後の「ａ」「ａ・ｂ」「ａ～ｅ」等）を境界にセグメント分割する。
    text = explanation_raw.replace('\n', '').strip()
    matches = list(_LABEL_START_RE.finditer(text))
    segments = []
    for i, m in enumerate(matches):
        letters = _parse_label_letters(m.group(1))
        seg_start = m.end()
        seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        segments.append((letters, text[seg_start:seg_end].strip()))

    candidates = [(letters, seg) for letters, seg in segments if letters & answer_letters and seg]
    if candidates:
        candidates.sort(key=lambda x: len(x[0]))
        seg = candidates[0][1].replace('正しい。', '').strip()
        # 「〜よって、ｄが」のような尻切れの結語を末尾から除去する
        seg = re.sub(r'よって、?[ａ-ｇ](?:[・～][ａ-ｇ])*が\s*$', '', seg).strip()
        if seg and seg not in ('上記の通り。', '上記の通り', '上述の通り。', '上述の通り'):
            return seg[:150]
        # 「上記の通り」等、実質的な内容がない場合は選択肢の前にある
        # 症例の推論部分（診断根拠）を代わりに使う。
        if matches:
            pre = text[:matches[0].start()].strip()
            if pre:
                return pre[-150:]

    idx = text.find('正しい。')
    if idx != -1:
        after = text[idx + len('正しい。'):].strip()
        if after:
            return after[:150]
    return text[:150]


def format_explanation_html(explanation_raw):
    lines = [l.strip() for l in explanation_raw.split('\n') if l.strip()]
    return '<br/>'.join(lines)


def build_question(marker, global_n, uid_ch):
    q = byid[marker]
    answer_letters = set(q['answer'].split(','))
    label_to_letter = dict(zip('ａｂｃｄｅｆｇ', 'abcdefg'))

    choices = []
    for c in q['choices']:
        letter = label_to_letter.get(c['label'], '')
        choices.append({
            't': format_choice_text(c['label'], c['parts']),
            'ok': letter in answer_letters,
        })

    ans_choice = next((c for c, raw in zip(choices, q['choices'])
                        if label_to_letter.get(raw['label'], '') in answer_letters), None)
    # 複数正解の場合は正解choiceを「・」で連結
    ans_labels = [format_choice_text(c['label'], c['parts']) for c in q['choices']
                  if label_to_letter.get(c['label'], '') in answer_letters]
    ans_label = '　/　'.join(ans_labels)

    eg = [{
        'cls': 'ee',
        'h': '📝 選択肢解説',
        'c': format_explanation_html(q['explanation_raw']),
    }]
    sup = SUPPLEMENT.get(marker)
    if sup:
        eg.append({'cls': sup['cls'], 'h': sup['h'], 'c': sup['c']})

    imgs = [IMG_BASE + fn for fn in img_map.get(marker, [])]

    uid = f'jitsu1_{uid_ch}_q{global_n}'
    return {
        'uid': uid,
        'qn': f'Q.{global_n}',
        'episode': f"({q['exam_no']})" if q['exam_no'] else '',
        'rate': -1,
        'rate_cls': '',
        'rate_text': '',
        'badges': [{'cls': 'bsub', 't': q['subj']}] if q['subj'] else [],
        'qt': format_qt(q['stem']),
        'choices': choices,
        'ans_label': ans_label,
        'ans_sub': extract_ans_sub(q['explanation_raw'], answer_letters),
        'eg': eg,
        'imgs': imgs,
    }


chapters = []
n = 0
for block, ch_num, title in [('A', 'ch01', 'A問題（一般40問　臨床40問）'),
                              ('B', 'ch02', 'B問題（一般40問　臨床40問）')]:
    qlist = []
    for i in range(1, 81):
        n += 1
        marker = f'{block}-{i}'
        qlist.append(build_question(marker, n, ch_num))
    chapters.append({'title': title, 'qs': qlist})

data = {'sid': 'jitsu1', 'chapters': chapters}

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

total = sum(len(ch['qs']) for ch in chapters)
print(f'written {OUT}: {total} questions')

# ── 簡易検証 ──
no_ok = [q['uid'] for ch in chapters for q in ch['qs'] if not any(c['ok'] for c in q['choices'])]
print('choices with no ok=true:', no_ok)
img_count = sum(1 for ch in chapters for q in ch['qs'] if q['imgs'])
print('questions with images:', img_count)
sup_count = sum(1 for ch in chapters for q in ch['qs'] if len(q['eg']) > 1)
print('questions with supplement:', sup_count)
