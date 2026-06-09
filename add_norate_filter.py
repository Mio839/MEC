"""
add_norate_filter.py — 「正答率なし」フィルターボタンを追加する
rate-based filter (難問/標準/易問) を持つ科目にのみ適用
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")

# rate-based filterを持つ科目のみ (消化器は全問率あり)
RATE_SUBJECTS = {"神経", "内分泌", "循環器", "呼吸器", "血液", "肝胆膵", "消化器"}

NORATE_BUTTON = '<button class="nb" data-filter="norate" onclick="filterCards(\'norate\')">正答率なし</button>'

NORATE_CSS = '[data-filter="norate"].fc-on{background:#78909C;border-color:#78909C;color:#fff;}'

NEW_FILTER_JS = r"""function filterCards(f){
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('fc-on',b.dataset.filter===f));
  document.querySelectorAll('.qc').forEach(c=>{
    const r=c.dataset.rate!==undefined&&c.dataset.rate!==''?+c.dataset.rate:null;
    let show;
    if(f==='all'){show=true;}
    else if(f==='norate'){show=r===null;}
    else if(r!==null){show=(f==='hard'&&r<60)||(f==='mid'&&r>=60&&r<80)||(f==='easy'&&r>=80);}
    else{show=false;}
    c.style.display=show?'':'none';
  });
}"""


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


def process_file(html_path):
    with open(html_path, encoding='utf-8') as f:
        content = f.read()

    # rate-based filterを持つファイルのみ対象
    if not re.search(r'<button[^>]*data-filter="hard"', content):
        return False, 'skip (no rate filter)'

    # 既に正答率なしボタンがあればスキップ
    if 'data-filter="norate"' in content:
        return False, 'skip (already has norate)'

    # 1) filterCards 関数を更新
    idx = content.find('function filterCards(f){')
    if idx != -1:
        brace_start = content.index('{', idx)
        brace_end = find_matching_brace(content, brace_start)
        if brace_end != -1:
            content = content[:idx] + NEW_FILTER_JS + content[brace_end + 1:]

    # 2) 易問ボタンの直後に正答率なしボタンを挿入
    content = re.sub(
        r'(<button[^>]*data-filter="easy"[^>]*>易問</button>)',
        r'\1' + NORATE_BUTTON,
        content
    )

    # 3) norate CSS 追加 (easy CSS の後)
    if 'data-filter="norate"]' not in content:
        content = content.replace(
            '[data-filter="easy"].fc-on{background:var(--gr);border-color:var(--gr);}',
            '[data-filter="easy"].fc-on{background:var(--gr);border-color:var(--gr);}' + NORATE_CSS
        )

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return True, 'updated'


def main():
    total_updated = 0
    for subj_dir in sorted(DST.iterdir()):
        if not subj_dir.is_dir() or subj_dir.name not in RATE_SUBJECTS:
            continue
        html_files = sorted(subj_dir.glob("*.html"))
        if not html_files:
            continue

        updated = 0
        print(f"\n=== {subj_dir.name} ===")
        for html_file in html_files:
            changed, msg = process_file(html_file)
            print(f"  {'✓' if changed else '─'} {html_file.name} — {msg}")
            if changed:
                updated += 1

        print(f"  → 更新: {updated}/{len(html_files)}")
        total_updated += updated

    print(f"\n合計 {total_updated} ファイル更新")


if __name__ == '__main__':
    main()
