# -*- coding: utf-8 -*-
"""
耳鼻咽喉科の章別HTML（耳鼻咽喉科/chNN_*.html）から questions_ent.json を生成する。
build_oph_json.py と同構造:
  - uid = ent_ch{nn}_{card_id}（例 ent_ch01_q1）
  - rate は cr スパンの "45%" から解析
  - 各ファイル=1章、章名は ent_questions.json から取得
  - 画像 src は "images/xxx" → "耳鼻咽喉科/images/xxx"（study.htmlはルート基準）
"""
import json, re, glob, os, sys
from pathlib import Path
from bs4 import BeautifulSoup, Tag

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(r'C:\Users\coool\Desktop\MEC')
ENT_DIR = BASE / '耳鼻咽喉科'
SID = 'ent'


def inner_html(el: Tag) -> str:
    return el.decode_contents()


def extract_eg_blocks(eg_div: Tag) -> list:
    blocks = []
    for eb in eg_div.find_all('div', class_='eb', recursive=False):
        classes = [c for c in eb.get('class', []) if c != 'eb']
        cls = classes[0] if classes else ''
        h4 = eb.find('h4')
        h_text = h4.get_text() if h4 else ''
        if h4:
            h4.extract()
        blocks.append({'cls': cls, 'h': h_text, 'c': inner_html(eb).strip()})
    return blocks


def extract_question(qc: Tag, uid: str) -> dict:
    qh = qc.find('div', class_='qh', recursive=False)
    qn = episode = rate_cls = rate_text = ''
    badges = []
    rate = -1

    if qh:
        qn_el = qh.find('span', class_='qn')
        qn = qn_el.get_text() if qn_el else ''
        qe_el = qh.find('span', class_='qe')
        episode = qe_el.get_text() if qe_el else ''
        cr_el = qh.find('span', class_='cr')
        if cr_el:
            cr_classes = [c for c in cr_el.get('class', []) if c != 'cr']
            rate_cls = cr_classes[0] if cr_classes else ''
            rate_text = cr_el.get_text()
            m = re.search(r'(\d+)\s*%', rate_text)
            if m:
                rate = int(m.group(1))
        for bg_el in qh.find_all('span', class_='bg'):
            bg_classes = [c for c in bg_el.get('class', []) if c != 'bg']
            if bg_classes:
                badges.append({'cls': bg_classes[0], 't': bg_el.get_text()})

    qb = qc.find('div', class_='qb', recursive=False)
    qt = ''
    imgs = []
    choices = []
    ans_label = ans_sub = ''
    eg = []

    if qb:
        qt_el = qb.find('div', class_='qt', recursive=False)
        qt = inner_html(qt_el).strip() if qt_el else ''

        qimg_row = qb.find('div', class_='qimg-row', recursive=False)
        if qimg_row:
            for img in qimg_row.find_all('img'):
                src = img.get('src', '')
                if not src:
                    continue
                if src.startswith('images/'):
                    src = '耳鼻咽喉科/' + src
                imgs.append(src)

        cs_el = qb.find('div', class_='cs', recursive=False)
        if cs_el:
            for ch2 in cs_el.find_all('div', class_='ch2', recursive=False):
                choices.append({'t': ch2.get_text(), 'ok': 'ok' in ch2.get('class', [])})

        ab_el = qb.find('div', class_='ab', recursive=False)
        if ab_el:
            ac_el = ab_el.find('div', class_='ac')
            ans_label = ac_el.get_text() if ac_el else ''
            as_el = ab_el.find('div', class_='as')
            ans_sub = as_el.get_text() if as_el else ''

        eg_el = qb.find('div', class_='eg', recursive=False)
        if eg_el:
            eg = extract_eg_blocks(eg_el)

    return {
        'uid': uid, 'qn': qn, 'episode': episode, 'rate': rate,
        'rate_cls': rate_cls, 'rate_text': rate_text, 'badges': badges,
        'qt': qt, 'choices': choices, 'ans_label': ans_label,
        'ans_sub': ans_sub, 'eg': eg, 'imgs': imgs,
    }


with open(ENT_DIR / 'ent_questions.json', encoding='utf-8') as f:
    ent_meta = json.load(f)
chap_names = {c['chapter']['num']: c['chapter']['name'] for c in ent_meta}

chapters = []
total = n_img = 0
for hf in sorted(glob.glob(str(ENT_DIR / 'ch*.html'))):
    m = re.match(r'ch(\d+)', os.path.basename(hf))
    if not m:
        continue
    ch_num = int(m.group(1))
    ch_tag = f'ch{ch_num:02d}'
    soup = BeautifulSoup(Path(hf).read_text(encoding='utf-8'), 'html.parser')
    qs = []
    for card in soup.find_all('div', class_='qc'):
        cid = card.get('id', '')
        if not cid:
            continue
        qs.append(extract_question(card, f'{SID}_{ch_tag}_{cid}'))
    title = f'第{ch_num}章 {chap_names.get(ch_num, "")}'.strip()
    chapters.append({'title': title, 'qs': qs})
    total += len(qs)
    n_img += sum(1 for q in qs if q['imgs'])
    print(f'  {ch_tag} {title}: {len(qs)}問（画像{sum(1 for q in qs if q["imgs"])}問）')

data = {'sid': SID, 'chapters': chapters}
out = BASE / f'questions_{SID}.json'
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'\n-> {out.name} ({out.stat().st_size // 1024}KB, {total}問, 画像{n_img}問)')
