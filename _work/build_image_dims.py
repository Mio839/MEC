# -*- coding: utf-8 -*-
"""questions_*.json が参照する画像の実寸を集めて image_dims.json を作る（派生物）。

なぜ要るか
----------
card_renderer.js は `<img loading="lazy" …>` を width/height 無しで出していた。
デコード前の画像は高さ0で、デコード後に最大220px へ跳ねる。画像問題は科目あたり
100〜200問あるので、章ジャンプの着地点が後からズレ続ける（_jumpScrollToEl が
settle 24フレーム＋reanchor 12フレーム＋220/520ms のタイマーで殴っていた原因）。

width/height 属性を出せばブラウザが aspect-ratio を先に計算し、デコード前から
正しい高さの箱を確保する＝レイアウトシフトが原理的に消える。

なぜ questions_*.json に直接入れないか
--------------------------------------
15ファイルは生成元がバラバラで整形が混在（compact / indent=1+CRLF / 手書き混在）。
全файлを書き戻すと巨大diffになり、画像の再抽出のたびに再発する。qmeta.json と同じ
「派生物を1枚別に持つ」方式にして、questions_*.json は一切触らない。

    python _work/build_image_dims.py
"""
import json
import os

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'image_dims.json')
SIDS = ['endo', 'resp', 'circ', 'dige', 'neur', 'hbp', 'jinzo_d', 'hema', 'imma',
        'kansen', 'peds', 'obg', 'psy', 'derm', 'oph', 'ent', 'uro', 'ortho', 'anes', 'rad', 'tox', 'ph', 'jitsu1', 'custom', 'memo']


def main():
    paths = set()
    for sid in SIDS:
        p = os.path.join(ROOT, f'questions_{sid}.json')
        if not os.path.exists(p):
            continue
        with open(p, encoding='utf-8') as f:
            data = json.load(f)
        for ch in data.get('chapters', []):
            for q in ch.get('qs', []):
                for src in (q.get('imgs') or []):
                    paths.add(src)

    dims, missing, failed = {}, [], []
    for src in sorted(paths):
        full = os.path.join(ROOT, src.replace('/', os.sep))
        if not os.path.exists(full):
            missing.append(src)
            continue
        try:
            with Image.open(full) as im:
                dims[src] = list(im.size)
        except Exception as e:
            failed.append(f'{src}: {e}')

    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        json.dump(dims, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)

    size_kb = os.path.getsize(OUT) / 1024
    print(f'参照画像 {len(paths)} 件 → 実寸取得 {len(dims)} 件  ({size_kb:.0f} KB)')
    if missing:
        print(f'⚠️ ファイルが無い参照 {len(missing)} 件: {missing[:5]}')
    if failed:
        print(f'⚠️ 読めない画像 {len(failed)} 件: {failed[:5]}')


if __name__ == '__main__':
    main()
