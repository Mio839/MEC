"""
validate_images.py — 全科目の問題カード画像整合性チェック

チェック項目:
  A: episodeコードと画像ファイル名の不一致 (例: ep=118F-21 なのに img=117C-8_1.jpeg)
  B: imgs あり かつ qt に「示す」なし (不審な画像付与)
  C: qt に「示す」あり かつ imgs なし (画像が抜けている可能性)
  D: imgs に存在しないファイルパスが含まれている

使い方:
  cd C:/Users/coool/Desktop/MEC
  python _work/validate_images.py             # 全問題チェック
  python _work/validate_images.py --sid circ  # 循環器のみ
  python _work/validate_images.py --only A B  # チェックA・Bのみ
"""

import json, os, re, sys, glob, argparse
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 画像参照を示す語（qt内に「を示す」系の文言があるか）
# 「〇〇を示す」の形で出現するもの
SHIMESU_RE = re.compile(
    r'(?:写真|図|心電図|X線|CT|MRI|エコー|超音波|造影|内視鏡|'
    r'シンチ|SPECT|PET|病理|染色|培養|グラム|スメア|画像|波形|'
    r'カテーテル|スパイロ|スパイログラム|眼底|皮膚|'
    r'検査結果|所見|フローシート|体表|模式)を示す'
)

# episodeフィールドからコードを抽出 e.g. "(118F-21)" -> "118F-21"
EPISODE_RE = re.compile(r'(\d{2,3}[A-Z]-\d+)')

# 画像ファイル名からepisodeコードを抽出 e.g. "循環器/images/118F-21_1.jpeg" -> "118F-21"
IMG_CODE_RE = re.compile(r'(\d{2,3}[A-Z]-\d+)_\d+\.jpe?g$', re.IGNORECASE)


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def get_text(self):
        return ' '.join(self._parts)


def strip_html(html: str) -> str:
    s = _HTMLStripper()
    s.feed(html)
    return s.get_text()


def load_all(sid_filter=None):
    """全 questions_*.json をロードして (sid, chapter_idx, question) のリストを返す"""
    pattern = os.path.join(ROOT, 'questions_*.json')
    results = []
    for fpath in sorted(glob.glob(pattern)):
        with open(fpath, encoding='utf-8') as f:
            data = json.load(f)
        sid = data.get('sid', '')
        if sid_filter and sid != sid_filter:
            continue
        for chi, ch in enumerate(data.get('chapters', [])):
            for q in ch.get('qs', []):
                results.append((sid, chi, ch.get('title', ''), q))
    return results


def get_episode_codes(ep_str: str):
    """episode フィールドから全コードを返す"""
    return EPISODE_RE.findall(ep_str)


def get_img_code(img_path: str):
    """画像パスからepisodeコードを返す（取れない場合 None）"""
    m = IMG_CODE_RE.search(img_path)
    return m.group(1) if m else None


# 異なる回の画像を参照解説で使う既知の問題 (cross-reference images)
_CHECK_A_EXCEPTIONS = {
    'neur_ch04_q253',  # 109B-61 の連問解説で 108B-44 の画像を参照
}


def check_A(q):
    """episodeコードと画像ファイル名の不一致"""
    if q.get('uid') in _CHECK_A_EXCEPTIONS:
        return []
    eps = get_episode_codes(q.get('episode', ''))
    if not eps:
        return []
    ep = eps[0]
    issues = []
    for img in q.get('imgs', []):
        img_code = get_img_code(img)
        if img_code and img_code != ep:
            issues.append(f'episode={ep} だが img={os.path.basename(img)} (code={img_code})')
    return issues


def check_B(q):
    """imgs あり かつ 「示す」なし"""
    if not q.get('imgs'):
        return []
    qt_text = strip_html(q.get('qt', ''))
    if not SHIMESU_RE.search(qt_text):
        return [f'imgs={len(q["imgs"])}枚 あり、qt に「示す」なし']
    return []


# 「を示す」の後に即インラインテキストが続く問題 (画像不要) の既知例外
_CHECK_C_EXCEPTIONS = {
    'kansen_ch06_q301',  # "検査結果を示す。" 後に HBs抗原/HCV抗体値をテキスト列挙
}


def check_C(q):
    """「示す」あり かつ imgs なし"""
    if q.get('uid') in _CHECK_C_EXCEPTIONS:
        return []
    if q.get('imgs'):
        return []
    qt_text = strip_html(q.get('qt', ''))
    m = SHIMESU_RE.search(qt_text)
    if m:
        return [f'qt に「{m.group()}」あり、imgs なし']
    return []


def check_D(q):
    """画像ファイルが存在しない"""
    issues = []
    for img in q.get('imgs', []):
        fpath = os.path.join(ROOT, img.replace('/', os.sep))
        if not os.path.exists(fpath):
            issues.append(f'ファイルなし: {img}')
    return issues


CHECK_FUNCS = {'A': check_A, 'B': check_B, 'C': check_C, 'D': check_D}
CHECK_LABELS = {
    'A': 'episode-image 不一致',
    'B': 'imgs あり・示す なし',
    'C': '示す あり・imgs なし',
    'D': '画像ファイル欠落',
}


def main():
    parser = argparse.ArgumentParser(description='問題カード画像整合性チェック')
    parser.add_argument('--sid', help='特定科目のみ (e.g. circ, kansen)')
    parser.add_argument('--only', nargs='+', choices=['A', 'B', 'C', 'D'],
                        help='実行するチェックを限定 (A B C D)')
    args = parser.parse_args()

    checks = args.only if args.only else list(CHECK_FUNCS.keys())
    questions = load_all(args.sid)

    print(f'チェック対象: {len(questions)} 問  ({", ".join(checks)})')
    print('=' * 70)

    counts = {c: 0 for c in checks}
    report = []

    for sid, chi, ch_title, q in questions:
        uid = q.get('uid', '?')
        for c in checks:
            issues = CHECK_FUNCS[c](q)
            for msg in issues:
                counts[c] += 1
                report.append((c, uid, msg))

    # 出力
    current_check = None
    for c, uid, msg in sorted(report, key=lambda x: (x[0], x[1])):
        if c != current_check:
            current_check = c
            print(f'\n[チェック {c}] {CHECK_LABELS[c]}  ({counts[c]}件)')
            print('-' * 60)
        print(f'  {uid}')
        print(f'    → {msg}')

    print('\n' + '=' * 70)
    print('サマリ:')
    for c in checks:
        label = CHECK_LABELS[c]
        n = counts[c]
        mark = 'OK' if n == 0 else ' !'
        print(f'  {mark} [{c}] {label}: {n}件')
    total = sum(counts.values())
    print(f'\n  合計 {total} 件の問題を検出')
    if total == 0:
        print('  問題なし')


if __name__ == '__main__':
    main()
