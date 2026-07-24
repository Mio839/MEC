# -*- coding: utf-8 -*-
"""問題画像の再エンコード（長辺1200px上限・JPEG q85・ファイル名は不変）。

表示側は study.css の `.qimg{max-height:220px;max-width:48%}`、拡大時もライトボックスで
ビューポート内に収まる。元の 827〜1418px・平均185KB は表示解像度に対して過剰で、
1科目開くだけで数十MBを配っていた（神経=372枚≒70MB）。

ファイル名・拡張子・パスは一切変えない。したがって questions_*.json の imgs も
過去問HTMLも sw.js も書き換え不要で、差し替えの事故が起きない。

不可逆な上書きだが、元画像は git 履歴に残るので `git checkout <commit> -- <path>` で戻せる。
再実行は安全（既に1200px以下かつ小さいものはスキップされる）。

使い方:
    python _work/compress_images.py --dry-run        # 見積りだけ
    python _work/compress_images.py                  # 全科目を変換
    python _work/compress_images.py 神経 呼吸器       # 科目を絞る
"""
import io
import os
import sys
import time

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_EDGE = 1200
QUALITY = 85
EXTS = ('.jpg', '.jpeg')          # PNG(18枚/4MB)は図版なので触らない
SKIP_DIRS = {'_work', '.git', '_archive', 'node_modules'}


def iter_images(filters):
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        rel = os.path.relpath(dirpath, ROOT)
        if filters and not any(f in rel for f in filters):
            continue
        for fn in filenames:
            if fn.lower().endswith(EXTS):
                yield os.path.join(dirpath, fn)


def reencode(path, dry_run=False):
    """戻り値: (元サイズ, 新サイズ, 変換したか)。小さくならない場合は元を残す。"""
    before = os.path.getsize(path)
    try:
        with Image.open(path) as im:
            im.load()
            if im.mode not in ('RGB', 'L'):
                im = im.convert('RGB')
            w, h = im.size
            longest = max(w, h)
            if longest > MAX_EDGE:
                scale = MAX_EDGE / longest
                im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))),
                               Image.LANCZOS)
            buf = io.BytesIO()
            # EXIF/ICC は落とす（診断には不要でサイズだけ食う）
            im.save(buf, format='JPEG', quality=QUALITY, optimize=True, progressive=True)
    except Exception as e:
        print(f'  !! SKIP {os.path.relpath(path, ROOT)}: {e}')
        return before, before, False

    data = buf.getvalue()
    # 再エンコードで太る画像（既に十分小さい・低品質）は触らない
    if len(data) >= before:
        return before, before, False
    if dry_run:
        return before, len(data), True

    # 一時ファイル経由で置換し、途中終了でも元画像を壊さない
    tmp = path + '.tmp'
    with open(tmp, 'wb') as f:
        f.write(data)
    os.replace(tmp, path)
    return before, len(data), True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    dry = '--dry-run' in sys.argv

    files = sorted(iter_images(args))
    print(f'対象 {len(files)} 枚  (long edge<={MAX_EDGE}px, JPEG q{QUALITY}'
          + (', DRY RUN)' if dry else ')'))

    tot_before = tot_after = 0
    changed = 0
    t0 = time.time()
    for i, path in enumerate(files, 1):
        b, a, did = reencode(path, dry)
        tot_before += b
        tot_after += a
        if did:
            changed += 1
        if i % 200 == 0 or i == len(files):
            print(f'  {i}/{len(files)}  {tot_before/1048576:.0f}MB -> '
                  f'{tot_after/1048576:.0f}MB  ({time.time()-t0:.0f}s)', flush=True)

    saved = tot_before - tot_after
    pct = saved / tot_before * 100 if tot_before else 0
    print(f'\n変換 {changed}/{len(files)} 枚')
    print(f'{tot_before/1048576:.1f} MB -> {tot_after/1048576:.1f} MB '
          f'（-{saved/1048576:.1f} MB, -{pct:.1f}%）')


if __name__ == '__main__':
    main()
