"""
add_rates.py — PDFから正答率を抽出してHTMLに追記する
各科目 → data-rate + 正答率バッジ + 難問/標準/易問フィルター
"""
import re, sys, io, json
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
import fitz

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")

SUBJECTS = [
    ("神経",   r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\神経\MEC臓器別講座・神経_問題（表紙2026）.pdf"),
    ("内分泌", r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\内分泌\MEC臓器別講座・内分泌代謝_問題（表紙2026）.pdf"),
    ("循環器", r"C:\Users\coool\OneDrive\MEC_Claude解答解説\_scripts\循環器\MEC臓器別講座・循環器_問題（表紙2026）.pdf"),
    ("呼吸器", r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\呼吸器\MEC臓器別講座・呼吸器_問題（表紙2026）.pdf"),
    ("血液",   r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\血液\MEC臓器別講座・血液_問題（表紙2026）.pdf"),
    ("肝胆膵", r"C:\Users\coool\OneDrive\GoodNotes\MEC - コピー\肝胆膵\MEC臓器別講座・肝胆膵_問題（表紙2026）.pdf"),
]

NEW_FILTER_JS = r"""function filterCards(f){
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('fc-on',b.dataset.filter===f));
  document.querySelectorAll('.qc').forEach(c=>{
    const r=c.dataset.rate!==undefined&&c.dataset.rate!==''?+c.dataset.rate:null;
    let show;
    if(f==='all'){show=true;}
    else if(r!==null){show=(f==='hard'&&r<60)||(f==='mid'&&r>=60&&r<80)||(f==='easy'&&r>=80);}
    else{show=false;}
    c.style.display=show?'':'none';
  });
}"""

RATE_FILTER_BUTTONS = (
    '<span class="fsep"></span>'
    '<button class="nb fc-on" data-filter="all" onclick="filterCards(\'all\')">全問</button>'
    '<button class="nb" data-filter="hard" onclick="filterCards(\'hard\')">難問</button>'
    '<button class="nb" data-filter="mid" onclick="filterCards(\'mid\')">標準</button>'
    '<button class="nb" data-filter="easy" onclick="filterCards(\'easy\')">易問</button>'
)

RATE_CSS_EXTRA = (
    '[data-filter="hard"].fc-on{background:var(--rd);border-color:var(--rd);}'
    '[data-filter="mid"].fc-on{background:var(--yl);border-color:var(--yl);color:#744A00;}'
    '[data-filter="easy"].fc-on{background:var(--gr);border-color:var(--gr);}'
)


def extract_rates_from_pdf(pdf_path):
    """PDFページ末尾の数字列を正答率として抽出する。exam_id -> rate の辞書を返す"""
    doc = fitz.open(pdf_path)
    Q_PAT = re.compile(r'(\d+)\.\s+（(\d{2,3}[A-Z]-\d+)）')
    question_rates = {}

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]

        questions = []
        for line in lines:
            for m in Q_PAT.finditer(line):
                q_num = int(m.group(1))
                exam_id = m.group(2)
                if not any(q[0] == q_num for q in questions):
                    questions.append((q_num, exam_id))

        if not questions:
            continue

        mec_idx = next((i for i, l in enumerate(lines) if 'メック予備校用' in l), None)
        if mec_idx is None:
            continue

        rates = []
        i = mec_idx - 1
        while i >= 0 and i >= mec_idx - 10:
            line = lines[i]
            if re.match(r'^\d{1,3}$', line):
                val = int(line)
                if 0 <= val <= 100:
                    rates.insert(0, val)
                    i -= 1
                    continue
                else:
                    break
            elif line in ('―', '-', '—', '－'):
                rates.insert(0, None)
                i -= 1
                continue
            else:
                break
            i -= 1

        if not rates:
            continue

        if len(rates) == len(questions):
            for (q_num, exam_id), rate in zip(questions, rates):
                if rate is not None:
                    question_rates[exam_id] = rate

    return question_rates


def rate_css_class(rate):
    if rate < 60:
        return 'cl'
    elif rate < 80:
        return 'cm'
    else:
        return 'ch'


def find_matching_brace(s, start):
    depth = 0
    i = start
    while i < len(s):
        if s[i] == '{':
            depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def replace_filter_function(content):
    idx = content.find('function filterCards(f){')
    if idx == -1:
        return content
    brace_start = content.index('{', idx)
    brace_end = find_matching_brace(content, brace_start)
    if brace_end == -1:
        return content
    return content[:idx] + NEW_FILTER_JS + content[brace_end + 1:]


def update_filter_buttons_and_css(content):
    """ナビのstar/nostarボタンをhard/mid/easyに差し替え、CSSも更新"""
    # ボタン差し替え (全問+★問題+無印 → 全問+難問+標準+易問)
    content = re.sub(
        r'<span class="fsep"></span>'
        r'\s*<button[^>]*data-filter="all"[^>]*>全問</button>'
        r'\s*<button[^>]*data-filter="star"[^>]*>★問題</button>'
        r'\s*<button[^>]*data-filter="nostar"[^>]*>無印</button>',
        RATE_FILTER_BUTTONS,
        content
    )

    # 旧star/nostar CSS を削除
    content = re.sub(
        r'\[data-filter="star"\]\.fc-on\{[^}]+\}', '', content
    )
    content = re.sub(
        r'\[data-filter="nostar"\]\.fc-on\{[^}]+\}', '', content
    )

    # hard/mid/easy CSS 追加 (まだなければ)
    if '[data-filter="hard"]' not in content:
        content = content.replace(
            '[data-filter].fc-on{background:var(--or);border-color:var(--or);color:#fff;}',
            '[data-filter].fc-on{background:var(--or);border-color:var(--or);color:#fff;}' + RATE_CSS_EXTRA
        )

    return content


def process_file(html_path, exam_id_to_rate):
    with open(html_path, encoding='utf-8') as f:
        content = f.read()

    # 既にrate-based buttons があればスキップ (ボタンとして存在するかチェック)
    if '<button' in content and 'data-filter="hard"' in content:
        # ボタンタグ内にdata-filter="hard"があるか確認
        if re.search(r'<button[^>]*data-filter="hard"', content):
            return 0, 'skip (already has rate filter)'

    soup = BeautifulSoup(content, 'html.parser')
    cards = soup.find_all('div', class_='qc')

    matched = 0
    for card in cards:
        # 既にdata-rateがあればスキップ
        if card.get('data-rate') is not None:
            continue

        qe = card.find(class_='qe')
        if not qe:
            continue
        raw = qe.get_text().strip()
        exam_id = re.sub(r'[（）()]', '', raw).strip()

        rate = exam_id_to_rate.get(exam_id)
        if rate is None:
            continue

        card['data-rate'] = str(rate)

        qh = card.find(class_='qh')
        if qh:
            # mec-controlsの直前にバッジ挿入
            mec_ctrl = qh.find(class_='mec-controls')
            badge_cls = rate_css_class(rate)
            badge = BeautifulSoup(
                f'<span class="cr {badge_cls}">正答率 {rate}%</span>',
                'html.parser'
            )
            if mec_ctrl:
                mec_ctrl.insert_before(badge)
            else:
                qh.append(badge)

        matched += 1

    new_content = str(soup)

    # フィルターJS・ボタン・CSS更新
    new_content = replace_filter_function(new_content)
    new_content = update_filter_buttons_and_css(new_content)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return matched, f'updated ({matched}/{len(cards)} cards)'


def main():
    for subj_name, pdf_path in SUBJECTS:
        print(f"\n=== {subj_name} ===")
        exam_id_to_rate = extract_rates_from_pdf(pdf_path)
        print(f"  PDF: {len(exam_id_to_rate)} rates extracted")

        subj_dir = DST / subj_name
        if not subj_dir.exists():
            print(f"  SKIP: folder not found")
            continue

        total_matched = 0
        for html_path in sorted(subj_dir.glob("*.html")):
            matched, msg = process_file(html_path, exam_id_to_rate)
            total_matched += matched
            print(f"  {html_path.name}: {msg}")

        print(f"  -> 合計 {total_matched} cards に正答率追記")

    print("\nDone!")


if __name__ == '__main__':
    main()
