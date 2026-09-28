# -*- coding: utf-8 -*-
"""実ブラウザで画面の「見た目」を撮り、変更の前後で差が無いかを比べる。

  python _work/visual_snapshot.py shoot before        # 撮る（_work/_visual/before/ に保存）
  python _work/visual_snapshot.py shoot after
  python _work/visual_snapshot.py shoot before2       # 同じコードでもう1回（揺れの見本）
  python _work/visual_snapshot.py compare before after --noise before2

撮るもの（UIテーマ8種 × 場面3つ）:
  hub   … index.html（ブリーフィングは既読にして閉じた状態）
  study … study.html?sid=anes の通常モード
  exam  … 同じ科目で試験を開始し、1問目を正解・2問目を誤答にした状態

比べるもの（2つ）:
  ① 全要素（::before / ::after を含む）の計算済みスタイル … CSS の削除・分割で「生きている要素」に
     効くルールが1つでも変われば必ず出る。画素より確実（色が同じでも別のルールに変われば出る）。
     アニメーションの名前・長さは素の状態で、それ以外はアニメーションと遷移を止めてから読む。
  ② スクリーンショットの画素 … アニメーションと遷移を止め、粒子の canvas とタイマーを隠して撮る。

⚠️ 乱数（肢のシャッフル・起動音の抽選など）はページを開く前に種付きのものへ差し替える
   ＝前後で同じ並びになる。localStorage は場面ごとに空から始める。
⚠️ 用途は「消しても見た目が変わらないこと」の確認（2026-09-28 の演出の死んだコード削除・
   テーマ別 CSS の分割）。演出そのものの正しさは見ない。
要: Chrome・python の websockets と Pillow。
"""
import asyncio, json, os, socket, subprocess, sys, tempfile, time, urllib.request
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

import websockets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_work', '_visual')
THEMES = ['aurora', 'brass', 'cyber', 'liquid', 'kintsugi', 'celestial', 'abyss', 'frost']
SCENES = ['hub', 'study', 'exam']
SID = 'anes'
W, H = 1280, 1000
CHROME = [r'C:/Program Files/Google/Chrome/Application/chrome.exe',
          r'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']

# ページより先に走らせる：乱数を種付きに、時計を決まった時刻から進むものに
# （週次ミッションのペース目盛りなど、今の時刻で位置が決まる表示があるため。
#   時計はページを開いてからの経過ぶんだけ進むので、タイマーや遅延は普段どおり動く）
PRELUDE = r'''
(() => { let s = 123456789; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
(() => {
  const T0 = Date.parse('2026-09-28T03:00:00Z'), P0 = performance.now(), RealDate = Date;
  const now = () => T0 + (performance.now() - P0);
  function FakeDate(...a) {
    if (!new.target) return new RealDate(now()).toString();
    return a.length ? new RealDate(...a) : new RealDate(now());
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = now; FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
  Date = FakeDate;
})();
// 外部 API（ハブの最終更新バッジ＝GitHub の最新コミット）は答えが撮るたびに変わり、連続で撮ると
// レート制限(403)で空になる。見た目の比較に要らないので空の結果を返す
(() => { const f = window.fetch; window.fetch = (u, o) => String(u).includes('api.github.com')
  ? Promise.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } })) : f(u, o); })();
'''

FREEZE_CSS = r'''
*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
#mecFxCanvas,canvas{visibility:hidden!important}
#examTimer{visibility:hidden!important}
'''

# 全要素の計算済みスタイル。animOnly=true はアニメーション系だけ（止める前に読む）
DUMP = r'''
((animOnly) => {
  const P = animOnly
    ? ['animation-name','animation-duration','animation-iteration-count','animation-timing-function']
    : ['display','position','top','left','right','bottom','width','height','margin','padding','color',
       'background-color','background-image','border-top','border-right','border-bottom','border-left',
       'border-radius','box-shadow','text-shadow','opacity','transform','filter','backdrop-filter',
       'font-size','font-weight','font-family','letter-spacing','z-index','visibility','overflow','content',
       'outline','clip-path','mask-image','mix-blend-mode','scale','translate','rotate',
       'background-position','background-size','-webkit-text-fill-color','inset','text-decoration-line'];
  const out = {};
  const path = el => {
    const a = [];
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      // 番号は display:none でない兄弟の中で数える。見えない要素（script・閉じたモーダル等）を
      // 消しても後ろの要素の番号がずれない＝消した物そのもの以外は差に出ない
      let i = 0; for (let s = e; (s = s.previousElementSibling);) if (!hidden(s)) i++;
      a.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ':' + i);
    }
    return a.join('>');
  };
  const hc = new Map();
  const hidden = e => {
    if (hc.has(e)) return hc.get(e);
    const v = getComputedStyle(e).display === 'none' || (e.parentElement && e.parentElement !== document.documentElement && hidden(e.parentElement));
    hc.set(e, v); return v;
  };
  const els = [document.documentElement, ...document.querySelectorAll('body, body *')];
  for (const el of els) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (el !== document.documentElement && hidden(el)) continue;   // 見えない要素は見た目を持たない
    const k = path(el) + '|' + el.className.toString();
    for (const pe of ['', '::before', '::after']) {
      const cs = getComputedStyle(el, pe || null);
      if (pe && (cs.content === 'none' || cs.content === 'normal')) continue;
      // JS が入れたインラインの style（CSS 変数を含む）も比べる＝計算値に出ない揺れの出どころが分かる
      out[k + pe] = P.map(p => cs.getPropertyValue(p)).join('¦') + (pe || animOnly ? '' : '¦style=' + (el.getAttribute('style') || ''));
    }
  }
  return out;
})
'''


class Page:
    def __init__(self, ws):
        self.ws, self.n, self.pending, self.console = ws, 0, {}, []
        self.reader = asyncio.ensure_future(self._read())

    async def _read(self):
        async for msg in self.ws:
            m = json.loads(msg)
            if 'id' in m and m['id'] in self.pending:
                self.pending.pop(m['id']).set_result(m)
            elif m.get('method') == 'Runtime.exceptionThrown':
                d = m['params']['exceptionDetails']
                self.console.append('EXC ' + (d.get('exception', {}).get('description') or d.get('text', ''))[:300])

    async def send(self, method, **params):
        self.n += 1
        fut = asyncio.get_event_loop().create_future()
        self.pending[self.n] = fut
        await self.ws.send(json.dumps(dict(id=self.n, method=method, params=params)))
        r = await asyncio.wait_for(fut, 120)
        if 'error' in r:
            raise RuntimeError(r['error'])
        return r['result']

    async def ev(self, expr):
        r = await self.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(r['exceptionDetails'].get('exception', {}).get('description') or r['exceptionDetails'])
        return r['result'].get('value')

    async def wait(self, expr, timeout=30):
        t0 = time.time()
        while time.time() - t0 < timeout:
            try:
                if await self.ev(expr):
                    return True
            except Exception:
                pass
            await asyncio.sleep(0.2)
        raise RuntimeError('timeout: ' + expr)


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


async def open_scene(pg, base, theme, scene):
    # 同じオリジンの軽いページで localStorage を空にしてテーマだけ入れる
    await pg.send('Page.navigate', url=base + 'vars.css')
    await asyncio.sleep(0.3)
    jst = "new Date(Date.now()+9*3600000).toISOString().slice(0,10)"
    await pg.ev("""(() => { localStorage.clear();
      localStorage.setItem('mec_ui_theme_v1', %s);
      const d = %s; const w = new Date(Date.parse(d+'T00:00:00Z') - ((new Date(d+'T00:00:00Z').getUTCDay()+6)%%7)*86400000).toISOString().slice(0,10);
      localStorage.setItem('mec_hub_opening_v1', JSON.stringify({day: d, week: w}));
    })()""" % (json.dumps(theme), jst))
    if scene == 'hub':
        await pg.send('Page.navigate', url=base + 'index.html')
        await pg.wait("document.readyState==='complete'")
        await asyncio.sleep(2.5)
        return
    await pg.send('Page.navigate', url=base + 'study.html?sid=' + SID)
    await pg.wait("document.querySelectorAll('.qc[data-uid]').length >= 50", 60)
    await asyncio.sleep(1.5)
    if scene == 'exam':
        await pg.ev("startExam()")
        await asyncio.sleep(4.0)   # 起動の演出が明けるまで
        await pg.ev("""(() => { const cs = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.offsetParent && c.querySelector('.ch2'));
          const a = cs[0], b = cs[1];
          a.scrollIntoView({block:'center'}); a.querySelector('.ch2.ok').click();
          return !!b; })()""")
        await asyncio.sleep(2.0)
        await pg.ev("""(() => { const cs = [...document.querySelectorAll('.qc[data-uid]')].filter(c => c.offsetParent && c.querySelector('.ch2') && !c.classList.contains('exam-revealed'));
          const b = cs[0]; b.scrollIntoView({block:'center'}); const w = b.querySelector('.ch2:not(.ok)'); if (w) w.click(); })()""")
        # 正解の演出（UIテーマ固有の canvas 描画など）が描き終わるまで待つ。途中で撮ると前後で揺れる
        await asyncio.sleep(7.0)


async def shoot(label, only_themes=None):
    out = os.path.join(OUT, label)
    os.makedirs(out, exist_ok=True)
    port, dport = free_port(), free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    prof = tempfile.mkdtemp(prefix='mecvis_')
    chrome = next(c for c in CHROME if os.path.exists(c))
    br = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
                           '--remote-debugging-port=%d' % dport, '--user-data-dir=' + prof,
                           '--window-size=%d,%d' % (W, H), 'about:blank'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = 'http://127.0.0.1:%d/' % port
    report = {}
    try:
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen('http://127.0.0.1:%d/json' % dport))
                ws_url = next(t['webSocketDebuggerUrl'] for t in tabs if t['type'] == 'page'); break
            except Exception:
                time.sleep(0.2)
        async with websockets.connect(ws_url, max_size=2 ** 28) as ws:
            pg = Page(ws)
            await pg.send('Page.enable'); await pg.send('Runtime.enable')
            await pg.send('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=1, mobile=False)
            await pg.send('Page.addScriptToEvaluateOnNewDocument', source=PRELUDE)
            for theme in (only_themes or THEMES):
                for scene in SCENES:
                    name = theme + '_' + scene
                    pg.console = []
                    await open_scene(pg, base, theme, scene)
                    anim = await pg.ev(DUMP + '(true)')
                    await pg.ev("(() => { const s = document.createElement('style'); s.id='__freeze'; s.textContent = %s; document.head.appendChild(s); document.getAnimations().forEach(a => { try { a.cancel(); } catch (e) {} }); })()" % json.dumps(FREEZE_CSS))
                    # ヘッダは半透明で背後をぼかすので、滑らかなスクロールの止まり具合の差が画素に出る。
                    # 撮る前にスクロール位置を決め打ちする（試験は最後に答えたカードを画面の上寄りに）
                    await pg.ev("""(() => { document.documentElement.style.scrollBehavior = 'auto';
                      const c = [...document.querySelectorAll('.qc.exam-revealed, .qc.exam-retry')].pop();
                      window.scrollTo(0, c ? Math.round(c.getBoundingClientRect().top + scrollY - 260) : 0); })()""")
                    await asyncio.sleep(0.4)
                    static = await pg.ev(DUMP + '(false)')
                    static['__scrollY'] = str(await pg.ev('scrollY'))
                    shot = await pg.send('Page.captureScreenshot', format='png')
                    import base64
                    with open(os.path.join(out, name + '.png'), 'wb') as f:
                        f.write(base64.b64decode(shot['data']))
                    with open(os.path.join(out, name + '.json'), 'w', encoding='utf-8') as f:
                        json.dump({'anim': anim, 'static': static, 'errors': pg.console}, f, ensure_ascii=False)
                    report[name] = {'elements': len(static), 'errors': len(pg.console)}
                    print('%-16s elements=%d errors=%d' % (name, len(static), len(pg.console)), flush=True)
    finally:
        br.terminate(); srv.terminate()
    return report


def _load(d, name):
    return json.load(open(os.path.join(d, name + '.json'), encoding='utf-8'))


def _style_diffs(A, B):
    out = []
    for kind in ('anim', 'static'):
        for k in sorted(set(A[kind]) | set(B[kind])):
            if A[kind].get(k) != B[kind].get(k):
                out.append((kind, k, A[kind].get(k), B[kind].get(k)))
    return out


def _pix_mask(pa, pb):
    """2枚の画像で違う画素の集合（0/255 の L 画像）。大きさが違えば None"""
    from PIL import Image, ImageChops
    ia, ib = Image.open(pa).convert('RGB'), Image.open(pb).convert('RGB')
    if ia.size != ib.size:
        return None
    # 差が 8/255 以下は文字のアンチエイリアスとぼかしの揺れ（同じコードでも出る・目では見えない）
    d = ImageChops.difference(ia, ib)
    r, g, b = d.split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v > 8 else 0)


def compare(a, b, noise=None):
    """a（前）と b（後）を比べる。noise に「前」をもう1回撮ったものを渡すと、同じコードでも
    撮るたびに揺れる所（演出の途中で止まった位置など）を除いて比べる。"""
    from PIL import ImageChops, ImageFilter
    da, db = os.path.join(OUT, a), os.path.join(OUT, b)
    dn = ','.join(os.path.join(OUT, x) for x in noise.split(',')) if noise else None
    bad = 0
    for f in sorted(os.listdir(da)):
        if not f.endswith('.json'):
            continue
        name = f[:-5]
        ja, jb = _load(da, name), _load(db, name)
        diffs = _style_diffs(ja, jb)
        noisy_keys, nmask = set(), None
        # 揺れの見本は複数渡せる（カンマ区切り）。見本どうし・前との差をすべて揺れとして合わせる
        for dn1 in (dn.split(',') if dn else []):
            jn = _load(dn1, name)
            noisy_keys |= {(d[0], d[1]) for d in _style_diffs(ja, jn)}
            m1 = _pix_mask(os.path.join(da, name + '.png'), os.path.join(dn1, name + '.png'))
            if m1 is not None:
                m1 = m1.filter(ImageFilter.MaxFilter(9))   # 揺れの縁を少し広げる
                nmask = m1 if nmask is None else ImageChops.lighter(nmask, m1)
        diffs = [d for d in diffs if (d[0], d[1]) not in noisy_keys]
        m = _pix_mask(os.path.join(da, name + '.png'), os.path.join(db, name + '.png'))
        if m is None:
            px = -1
        else:
            if nmask is not None:
                m = ImageChops.subtract(m, nmask)
            px = sum(1 for v in m.getdata() if v)
        errs = [e for e in jb.get('errors', []) if e not in ja.get('errors', [])]
        ok = not diffs and px == 0 and not errs
        bad += 0 if ok else 1
        print('%-16s %s  styles=%d  pixels=%d  newErrors=%d%s' % (name, 'OK  ' if ok else 'DIFF', len(diffs), px, len(errs),
              '  (noise: %d styles)' % len(noisy_keys) if dn else ''))
        for kind, k, va, vb in diffs[:8]:
            pa, pb = (va or '').split('¦'), (vb or '').split('¦')
            ch = ['%s→%s' % (x, y) for x, y in zip(pa, pb) if x != y] if va and vb else ['(要素が片方にしか無い)']
            print('    %s %s' % (kind, k[-110:])); print('      %s' % (' / '.join(ch)[:300]))
        for e in errs[:3]:
            print('    ' + e)
    print(); print(('NO DIFFERENCES' if not bad else '%d scene(s) differ' % bad))
    return bad


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'shoot':
        themes = sys.argv[3].split(',') if len(sys.argv) > 3 else None
        asyncio.run(shoot(sys.argv[2], themes))
    elif len(sys.argv) in (4, 6) and sys.argv[1] == 'compare':
        noise = sys.argv[5] if len(sys.argv) == 6 and sys.argv[4] == '--noise' else None
        sys.exit(1 if compare(sys.argv[2], sys.argv[3], noise) else 0)
    else:
        print(__doc__)
