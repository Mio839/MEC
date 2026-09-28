# -*- coding: utf-8 -*-
"""ページの読み込みの重さを実ブラウザで測る（2026-09-28・重いファイルの分割の前後比較用）。

  python _work/measure_load.py                 # このリポジトリを測る
  python _work/measure_load.py ../MEC_base     # 別の作業ツリー（変更前の HEAD など）を測る

測るもの（ページ × UIテーマ、CPU を 4倍に絞って iPad 相当に寄せる。各5回の中央値）:
  bytes   … 読み込んだ CSS / JS / HTML の合計（http.server は圧縮しないので素のバイト数）と、その gzip 後
  load    … ナビゲーション開始から load イベントまで
  style   … スタイル計算の合計時間（RecalcStyleDuration）
  layout  … レイアウトの合計時間（LayoutDuration）
  script  … スクリプト実行の合計時間（ScriptDuration）
  task    … メインスレッドの全作業時間（TaskDuration）
⚠️ 絶対値は機械で変わる。見るのは同じ機械での前後の差だけ。
要: Chrome・python の websockets。
"""
import asyncio, gzip, json, os, socket, statistics, subprocess, sys, tempfile, time, urllib.request
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
import websockets

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [('hub', 'index.html', None), ('study', 'study.html?sid=neur', ".querySelectorAll('.qc[data-uid]').length>=500"),
         ('stats', 'stats.html', None)]
THEMES = os.environ.get('MEC_THEMES', 'aurora,abyss').split(',')
if os.environ.get('MEC_PAGES'): PAGES = [p for p in PAGES if p[0] in os.environ['MEC_PAGES'].split(',')]
RUNS = 5
WARMUP = 2
THROTTLE = 4
W, H = 820, 1180   # iPad Air の縦
CHROME = [r'C:/Program Files/Google/Chrome/Application/chrome.exe',
          r'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


class Page:
    def __init__(self, ws):
        self.ws, self.n, self.pend, self.events = ws, 0, {}, []
        self.task = asyncio.ensure_future(self._read())

    async def _read(self):
        async for m in self.ws:
            d = json.loads(m)
            if 'id' in d and d['id'] in self.pend:
                self.pend.pop(d['id']).set_result(d)
            elif 'method' in d:
                self.events.append(d)

    async def send(self, method, **params):
        self.n += 1
        f = asyncio.get_event_loop().create_future()
        self.pend[self.n] = f
        await self.ws.send(json.dumps({'id': self.n, 'method': method, 'params': params}))
        r = await f
        return r.get('result', {})

    async def ev(self, expr):
        r = await self.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        return r.get('result', {}).get('value')


async def measure_one(pg, base, theme, url, ready):
    await pg.send('Page.navigate', url=base + 'vars.css')
    await asyncio.sleep(0.3)
    await pg.ev("localStorage.clear(); localStorage.setItem('mec_ui_theme_v1', %s);"
                "localStorage.setItem('mec_hub_opening_v1', JSON.stringify({day:'2099-01-01', week:'2099-01-01'}))" % json.dumps(theme))
    await pg.send('Network.clearBrowserCache')
    await pg.send('Performance.disable'); await pg.send('Performance.enable')
    pg.events = []
    t0 = time.time()
    await pg.send('Page.navigate', url=base + url)
    for _ in range(600):
        if await pg.ev("document.readyState==='complete'"):
            break
        await asyncio.sleep(0.05)
    if ready:
        for _ in range(1200):
            if await pg.ev('document' + ready):
                break
            await asyncio.sleep(0.05)
    await asyncio.sleep(1.5)
    load = await pg.ev("(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? n.loadEventEnd : 0; })()")
    m = {x['name']: x['value'] for x in (await pg.send('Performance.getMetrics'))['metrics']}
    if os.environ.get('MEC_VERBOSE'):
        print('     state', await pg.ev("JSON.stringify([Math.round(scrollY), document.documentElement.scrollHeight, document.documentElement.className, document.body.className.slice(0,80), document.querySelectorAll('.qc[data-uid]').length])"), round(m.get('LayoutDuration', 0) * 1000), m.get('LayoutCount'), m.get('RecalcStyleCount'))
    # 読み込んだ静的ファイルの大きさ（questions_*.json・画像・音は除く＝分割の対象ではない）
    urls = set()
    for e in pg.events:
        if e['method'] == 'Network.responseReceived':
            u = e['params']['response']['url']
            path = u.split('?')[0].split('#')[0]
            if path.startswith(base) and path.endswith(('.css', '.js', '.html')):
                urls.add(path[len(base):])
    raw = gz = 0
    for rel in urls:
        fp = os.path.join(ROOT, urllib.request.url2pathname(rel))
        if os.path.exists(fp):
            b = open(fp, 'rb').read(); raw += len(b); gz += len(gzip.compress(b, 6))
    return {'load': load, 'style': m.get('RecalcStyleDuration', 0) * 1000, 'layout': m.get('LayoutDuration', 0) * 1000,
            'script': m.get('ScriptDuration', 0) * 1000, 'task': m.get('TaskDuration', 0) * 1000,
            'raw': raw / 1024, 'gz': gz / 1024, 'files': sorted(urls)}


async def main():
    port, dport = free_port(), free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    prof = tempfile.mkdtemp(prefix='mecload_')
    chrome = next(c for c in CHROME if os.path.exists(c))
    br = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--mute-audio', '--remote-debugging-port=%d' % dport,
                           '--user-data-dir=' + prof, '--window-size=%d,%d' % (W, H), 'about:blank'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = 'http://127.0.0.1:%d/' % port
    out = {}
    try:
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen('http://127.0.0.1:%d/json' % dport))
                ws_url = next(t['webSocketDebuggerUrl'] for t in tabs if t['type'] == 'page'); break
            except Exception:
                time.sleep(0.2)
        async with websockets.connect(ws_url, max_size=2 ** 28) as ws:
            pg = Page(ws)
            for d in ('Page', 'Runtime', 'Network'):
                await pg.send(d + '.enable')
            await pg.send('Network.setCacheDisabled', cacheDisabled=True)
            # Service Worker を通さない（前後で同じ条件にする）
            await pg.send('Network.setBypassServiceWorker', bypass=True)
            await pg.send('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=2, mobile=False)
            await pg.send('Emulation.setCPUThrottlingRate', rate=THROTTLE)
            print('%-12s %8s %8s %8s %8s %8s %8s %8s' % ('page', 'rawKB', 'gzKB', 'load', 'style', 'layout', 'script', 'task'))
            for name, url, ready in PAGES:
                for theme in THEMES:
                    # 最初の数回は 12〜15秒のレイアウトが出ることがある（変更の前後どちらでも・計測の立ち上がり）ので捨てる
                    for _ in range(WARMUP):
                        await measure_one(pg, base, theme, url, ready)
                    rs = [await measure_one(pg, base, theme, url, ready) for _ in range(RUNS)]
                    if os.environ.get('MEC_VERBOSE'): print('   runs', [(round(r['layout']), round(r['style']), round(r['task'])) for r in rs])
                    med = {k: statistics.median(r[k] for r in rs) for k in ('load', 'style', 'layout', 'script', 'task', 'raw', 'gz')}
                    key = name + '/' + theme
                    out[key] = dict(med, files=rs[0]['files'])
                    print('%-12s %8.0f %8.0f %8.0f %8.0f %8.0f %8.0f %8.0f' % (key, med['raw'], med['gz'], med['load'], med['style'],
                                                                         med['layout'], med['script'], med['task']), flush=True)
    finally:
        br.terminate(); srv.terminate()
    dst = os.path.join(ROOT, '_work', '_visual')
    os.makedirs(dst, exist_ok=True)
    json.dump(out, open(os.path.join(dst, 'load_metrics.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


asyncio.run(main())
