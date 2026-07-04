"""
export_errors.py — Gist から error_reports_v1 を CSV に出力する

使い方:
  python _work/export_errors.py --token YOUR_PAT --gist-id YOUR_GIST_ID
  python _work/export_errors.py  # 環境変数 MEC_GIST_TOKEN / MEC_GIST_ID を使用
  python _work/export_errors.py -o my_errors.csv

オプション:
  --token    GitHub PAT（gist スコープ）
  --gist-id  Gist ID（mec_progress.json を含む Gist）
  -o         出力 CSV パス（デフォルト: error_reports.csv）
  --show     CSV を出力せず標準出力に表示
"""

import argparse, csv, json, os, sys, urllib.request, urllib.error

SID_NAME = {
    'endo':    '内分泌',
    'resp':    '呼吸器',
    'circ':    '循環器',
    'dige':    '消化器',
    'neur':    '神経',
    'hbp':     '肝胆膵',
    'jinzo_d': '腎臓',
    'hema':    '血液',
    'imma':    '免アレ膠',
    'kansen':  '感染症',
}

TYPE_LABEL = {
    'missing_image':        '画像なし',
    'wrong_image_present':  '画像不要',
    'wrong_image':          '画像違い',
    'unreadable':           '問題文不完全',
    'image_extract_error':  '画像抽出エラー',
    'choice_extract_error': '選択肢エラー',
}

COLUMNS = ['uid', '科目', '種別コード', '種別', '報告日時']


def uid_to_sid(uid: str) -> str:
    """uid から科目 SID を推定 (e.g. circ_ch02_q84 -> circ)"""
    part = uid.split('_ch')[0] if '_ch' in uid else uid.split('_')[0]
    return part


def fetch_gist(token: str, gist_id: str) -> dict:
    url = f'https://api.github.com/gists/{gist_id}'
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'MEC-export-errors/1.0',
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        sys.exit(f'Gist 取得エラー HTTP {e.code}: {body[:300]}')
    except urllib.error.URLError as e:
        sys.exit(f'ネットワークエラー: {e.reason}')


def extract_error_reports(gist_data: dict) -> list:
    files = gist_data.get('files', {})
    prog_file = files.get('mec_progress.json')
    if not prog_file:
        sys.exit('Gist に mec_progress.json が見つかりません')
    raw = prog_file.get('content', '')
    try:
        progress = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f'mec_progress.json の JSON パースエラー: {e}')
    reports = progress.get('error_reports_v1', [])
    if not isinstance(reports, list):
        sys.exit(f'error_reports_v1 が配列ではありません: {type(reports)}')
    return reports


def build_rows(reports: list) -> list:
    rows = []
    for r in reports:
        if not isinstance(r, dict):
            continue
        uid = r.get('uid', '')
        sid = uid_to_sid(uid)
        kind = r.get('type', '')
        rows.append({
            'uid':    uid,
            '科目':   SID_NAME.get(sid, sid),
            '種別コード': kind,
            '種別':   TYPE_LABEL.get(kind, kind),
            '報告日時': r.get('reported_at', ''),
        })
    rows.sort(key=lambda x: (x['科目'], x['uid'], x['報告日時']))
    return rows


def main():
    parser = argparse.ArgumentParser(description='Gist から error_reports_v1 を CSV 出力')
    parser.add_argument('--token',   default=os.environ.get('MEC_GIST_TOKEN', ''),
                        help='GitHub PAT (gist スコープ)')
    parser.add_argument('--gist-id', default=os.environ.get('MEC_GIST_ID', ''),
                        dest='gist_id', help='Gist ID')
    parser.add_argument('-o', default='error_reports.csv',
                        help='出力 CSV パス (デフォルト: error_reports.csv)')
    parser.add_argument('--show', action='store_true',
                        help='CSV を出力せず標準出力に表示')
    args = parser.parse_args()

    if not args.token:
        sys.exit('--token か 環境変数 MEC_GIST_TOKEN で GitHub PAT を指定してください')
    if not args.gist_id:
        sys.exit('--gist-id か 環境変数 MEC_GIST_ID で Gist ID を指定してください')

    print(f'Gist を取得中: {args.gist_id} ...')
    gist_data = fetch_gist(args.token, args.gist_id)
    reports = extract_error_reports(gist_data)
    print(f'error_reports_v1: {len(reports)} 件')

    rows = build_rows(reports)

    if args.show:
        import io
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)
        print(buf.getvalue())
        return

    out_path = args.o
    with open(out_path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    print(f'出力: {out_path}  ({len(rows)} 行)')

    # 種別ごとの集計
    from collections import Counter
    counts = Counter(r['種別'] for r in rows)
    print('\n種別集計:')
    for label, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f'  {label}: {n}件')


if __name__ == '__main__':
    main()
