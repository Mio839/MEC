"""
update_done_ui.py — 済ボタンを checkbox → 済Ⅰ〜済Ⅴ の5段階ボタンに更新する
全章HTMLファイルを対象に一括パッチ
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")
SUBJECTS = ["神経", "内分泌", "循環器", "呼吸器", "血液", "肝胆膵", "消化器", "腎臓"]

ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ']

DONE_BTN_CSS = (
    ".mec-done-btns{display:flex;gap:3px;}"
    ".mec-done-btn{padding:2px 7px;border-radius:12px;font-size:10px;font-weight:700;"
    "border:1.5px solid #E0E5EB;color:#A0AAB8;background:none;cursor:pointer;"
    "font-family:inherit;transition:all .2s;white-space:nowrap;}"
    ".mec-done-btn.passed{background:#C8EBD4;border-color:#A5D6A7;color:#2D8C4E;}"
    ".mec-done-btn.active{background:#2D8C4E;border-color:#2D8C4E;color:#fff;}"
)

# Matches: <label class="mec-check-wrap"><input ... data-uid="UID" .../><span ...>✓ 済</span></label>
CHECK_WRAP_PAT = re.compile(
    r'<label class="mec-check-wrap">'
    r'<input[^>]*data-uid="([^"]+)"[^>]*/>'
    r'<span class="mec-check-box">✓ 済</span>'
    r'</label>'
)

# Fallback: some parsers may emit <input ...> without self-closing slash
CHECK_WRAP_PAT2 = re.compile(
    r'<label class="mec-check-wrap">'
    r'<input[^>]*data-uid="([^"]+)"[^>]*>'
    r'<span class="mec-check-box">✓ 済</span>'
    r'</label>'
)

INJECT_CSS_PAT = re.compile(r'(<style id="mec-inject-css">)([\s\S]*?)(</style>)')


def make_done_btns(uid):
    btns = ''.join(
        f'<button class="mec-done-btn" data-uid="{uid}" data-level="{i}" '
        f'onclick="mecSetDone(this,{i})">済{ROMAN[i]}</button>'
        for i in range(1, 6)
    )
    return f'<div class="mec-done-btns">{btns}</div>'


def process_file(path):
    content = path.read_text(encoding='utf-8')

    if 'mec-done-btns' in content:
        return False, 'skip (already updated)'
    if 'mec-check-wrap' not in content:
        return False, 'skip (no checkbox found)'

    # Replace checkbox with 5-level buttons
    new_content, n1 = CHECK_WRAP_PAT.subn(lambda m: make_done_btns(m.group(1)), content)
    if n1 == 0:
        new_content, n1 = CHECK_WRAP_PAT2.subn(lambda m: make_done_btns(m.group(1)), content)
    if n1 == 0:
        return False, 'skip (pattern not matched)'

    # Remove old checkbox CSS from mec-inject-css block, add new done-btn CSS
    def patch_inject_css(m):
        css = m.group(2)
        # Remove old checkbox styles
        css = re.sub(r'\.mec-check-wrap\{[^}]+\}', '', css)
        css = re.sub(r'\.mec-check-wrap\s+input\{[^}]+\}', '', css)
        css = re.sub(r'\.mec-check-box\{[^}]+\}', '', css)
        css = re.sub(r'\.mec-check-wrap\s+input:checked\+\.mec-check-box\{[^}]+\}', '', css)
        css = css.rstrip() + '\n' + DONE_BTN_CSS
        return m.group(1) + css + m.group(3)

    new_content = INJECT_CSS_PAT.sub(patch_inject_css, new_content, count=1)

    path.write_text(new_content, encoding='utf-8')
    return True, f'updated ({n1} cards)'


def main():
    total_files = total_updated = 0

    for subj in SUBJECTS:
        subj_dir = DST / subj
        if not subj_dir.exists():
            print(f"SKIP {subj}: folder not found")
            continue

        html_files = sorted(subj_dir.glob("*.html"))
        print(f"\n=== {subj} ===")
        for path in html_files:
            changed, msg = process_file(path)
            print(f"  {'✓' if changed else '─'} {path.name} — {msg}")
            total_files += 1
            if changed:
                total_updated += 1

    print(f"\n合計 {total_updated}/{total_files} ファイル更新")


if __name__ == '__main__':
    main()
