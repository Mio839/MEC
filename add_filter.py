"""
add_filter.py — 腎臓/消化器以外の科目にフィルター機能を追加する
★/無印ベースのフィルターを注入する（正答率データがない科目向け）

使い方:
  python add_filter.py [--dry-run]
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DST = Path(r"C:\Users\coool\Desktop\MEC")
DRY_RUN = '--dry-run' in sys.argv

SUBJECTS_WITH_RATE = {"腎臓", "消化器"}  # 既にrate+filterCards+ボタン完備

# フィルターボタン HTML (ナビバー末尾に追加)
FILTER_BUTTONS = (
    '<span class="fsep"></span>'
    '<button class="nb fc-on" data-filter="all" onclick="filterCards(\'all\')">全問</button>'
    '<button class="nb" data-filter="star" onclick="filterCards(\'star\')">★問題</button>'
    '<button class="nb" data-filter="nostar" onclick="filterCards(\'nostar\')">無印</button>'
)

# star/nostarに対応したfilterCards (正答率ありの場合はrate基準, なしの場合は★バッジ基準)
NEW_FILTER_JS = """function filterCards(f){
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('fc-on',b.dataset.filter===f));
  document.querySelectorAll('.qc').forEach(c=>{
    const r=c.dataset.rate!==undefined&&c.dataset.rate!==''?+c.dataset.rate:null;
    let show;
    if(f==='all'){show=true;}
    else if(r!==null){show=(f==='hard'&&r<60)||(f==='mid'&&r>=60&&r<80)||(f==='easy'&&r>=80);}
    else{const s=!!c.querySelector('.bg.bs');show=(f==='star'&&s)||(f==='nostar'&&!s);}
    c.style.display=show?'':'none';
  });
}"""

# フィルター用追加CSS
FILTER_CSS_ADDON = (
    '.fsep{width:1px;height:20px;background:var(--bd);margin:0 4px;flex-shrink:0;}'
    '[data-filter].fc-on{background:var(--or);border-color:var(--or);color:#fff;}'
    '[data-filter="star"].fc-on{background:var(--yl);border-color:var(--yl);}'
    '[data-filter="nostar"].fc-on{background:var(--gr);border-color:var(--gr);}'
)


def find_matching_brace(s: str, start: int) -> int:
    """start位置の '{' に対応する '}' のインデックスを返す"""
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


def replace_filter_function(content: str) -> str:
    """既存の filterCards 関数を新しい star-aware 版に置換"""
    idx = content.find('function filterCards(f){')
    if idx == -1:
        return content
    brace_start = content.index('{', idx)
    brace_end = find_matching_brace(content, brace_start)
    if brace_end == -1:
        return content
    return content[:idx] + NEW_FILTER_JS + content[brace_end + 1:]


def inject_filter_js(content: str) -> str:
    """filterCards 関数が存在しない場合、最後の </script> の前に注入"""
    last_script_end = content.rfind('</script>')
    if last_script_end == -1:
        return content
    return content[:last_script_end] + NEW_FILTER_JS + '\n' + content[last_script_end:]


def inject_nav_buttons(content: str) -> str:
    """ナビバー (.sn) の閉じる直前にフィルターボタンを追加"""
    # <div class="sn"> ... </div> の最初の閉じ </div> を探す
    sn_idx = content.find('class="sn"')
    if sn_idx == -1:
        return content
    # .sn div の開始 < を探す
    div_start = content.rfind('<', 0, sn_idx)
    # そこから </div> を探す
    close_idx = content.find('</div>', sn_idx)
    if close_idx == -1:
        return content
    return content[:close_idx] + FILTER_BUTTONS + content[close_idx:]


def inject_filter_css(content: str) -> str:
    """最初の </style> の直前にフィルター用CSSを追加 (.fsepが未定義の場合)"""
    if '.fsep' in content:
        return content
    style_end = content.find('</style>')
    if style_end == -1:
        return content
    return content[:style_end] + FILTER_CSS_ADDON + content[style_end:]


def process_file(html_path: Path, subj_name: str) -> tuple[bool, str]:
    """
    1ファイルを処理してフィルター機能を注入する。
    戻り値: (変更したか, 状態メッセージ)
    """
    with open(html_path, encoding='utf-8') as f:
        content = f.read()

    # 腎臓/消化器はスキップ
    if subj_name in SUBJECTS_WITH_RATE:
        return False, "skip (already complete)"

    # フィルターボタンが既にある場合はスキップ
    if 'data-filter="star"' in content or 'data-filter="nostar"' in content:
        return False, "skip (already has star filter)"
    if 'onclick="filterCards(\'all\')"' in content:
        return False, "skip (already has filter buttons)"

    original = content

    # 1) filterCards 関数の処理
    if 'function filterCards(f){' in content:
        content = replace_filter_function(content)
    else:
        content = inject_filter_js(content)

    # 2) CSS 追加
    content = inject_filter_css(content)

    # 3) ナビバーにボタン追加
    content = inject_nav_buttons(content)

    if content == original:
        return False, "no change (unexpected)"

    if not DRY_RUN:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)

    return True, "updated" + (" [DRY RUN]" if DRY_RUN else "")


def main():
    total_updated = 0
    total_skipped = 0

    for subj_dir in sorted(DST.iterdir()):
        if not subj_dir.is_dir() or subj_dir.name.startswith('.'):
            continue
        html_files = sorted(subj_dir.glob("*.html"))
        if not html_files:
            continue

        print(f"\n=== {subj_dir.name} ===")
        updated = 0
        skipped = 0

        for html_file in html_files:
            changed, msg = process_file(html_file, subj_dir.name)
            if changed:
                print(f"  ✅ {html_file.name} — {msg}")
                updated += 1
            else:
                print(f"  ─  {html_file.name} — {msg}")
                skipped += 1

        print(f"  → 更新: {updated}, スキップ: {skipped}")
        total_updated += updated
        total_skipped += skipped

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}合計: 更新 {total_updated} ファイル, スキップ {total_skipped} ファイル")


if __name__ == '__main__':
    main()
