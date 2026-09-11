# -*- coding: utf-8 -*-
"""章ジャンプ・問題番号ジャンプを、全科目で実ブラウザを動かして測る。

  python _work/test_jumps_browser.py                 # 全科目・PC幅（各章の先頭/末尾＋ランダム12問）
  python _work/test_jumps_browser.py circ,tox        # 科目を絞る
  python _work/test_jumps_browser.py --all-q         # 全問の番号ジャンプ（全科目で1時間以上かかる）
  python _work/test_jumps_browser.py --ios           # iOS と同じ CSS 経路（html.ios-no-cv）で
  python _work/test_jumps_browser.py --size 390x844  # 画面幅を変える

合格の条件: ジャンプ後にスクロールが止まった時点で、目標のカードの上端がヘッダの直下（±6px）に
あること。ページの先頭・末尾でそれ以上スクロールできないときは、ずれが残っていても合格。
加えて「検索欄に番号を打って Enter」を実際のキー入力で行い、絞り込みが掛からないことも見る。

⚠️ node の DOM シムでは測れない（スクロール・content-visibility・scroll-behavior が要る）ので
   本物の Chrome を DevTools Protocol で操作する。要: Chrome と python の websockets。
⚠️ 2026-09-11 に章・番号ジャンプが効かない科目があったのは、html{scroll-behavior:smooth} で
   ジャンプが滑らかに流れている途中に「着いた」と判定して mec-jumping を外し、画面外のカードが
   推定高さへ縮んで目標が数千px先へ逃げていたため（study.html の _jumpScrollToEl を参照）。
   node のテストでは再現しない種類の不具合なので、ジャンプまわりを触ったらこれを流すこと。
"""
import argparse, asyncio, glob, json, os, random, socket, subprocess, sys, time, urllib.request

import websockets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME_CANDIDATES = [
    r'C:/Program Files/Google/Chrome/Application/chrome.exe',
    r'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome', 'chromium',
]
TOL = 6

HELPERS = r'''
window.__stable = async function(maxMs){
  const t0 = performance.now(); let last = -1, same = 0;
  while (performance.now() - t0 < (maxMs||6000)) {
    await new Promise(r => setTimeout(r, 80));
    const y = Math.round(window.scrollY);
    if (y === last) { if (++same >= 6) break; } else { same = 0; last = y; }
  }
};
window.__hdr = () => (document.querySelector('.st-hdr')?.offsetHeight || 112) + 8;
window.__probe = (el) => {
  const off = Math.round(el.getBoundingClientRect().top - __hdr());
  const pin = off > 0 && (scrollY <= 0 || scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
  return {off, pin};
};
window.__qcard = (sid, n) => {
  const sec = document.querySelector('.subj-section[data-sid="' + sid + '"]');
  const qn = [...sec.querySelectorAll('.qc[data-uid] .qn')].find(e => e.textContent.replace(/[^0-9]/g, '') === String(n));
  return qn ? qn.closest('.qc') : null;
};
'''


class Page:
    def __init__(self, ws):
        self.ws, self.n, self.pending = ws, 0, {}
        self.reader = asyncio.ensure_future(self._read())

    async def _read(self):
        async for msg in self.ws:
            m = json.loads(msg)
            if 'id' in m and m['id'] in self.pending:
                self.pending.pop(m['id']).set_result(m)

    async def send(self, method, **params):
        self.n += 1
        fut = asyncio.get_event_loop().create_future()
        self.pending[self.n] = fut
        await self.ws.send(json.dumps(dict(id=self.n, method=method, params=params)))
        r = await asyncio.wait_for(fut, 180)
        if 'error' in r:
            raise RuntimeError(r['error'])
        return r['result']

    async def ev(self, expr):
        r = await self.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in r:
            raise RuntimeError(r['exceptionDetails'].get('exception', {}).get('description') or r['exceptionDetails'])
        return r['result'].get('value')


def free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    p = s.getsockname()[1]
    s.close()
    return p


def find_chrome():
    for c in CHROME_CANDIDATES:
        if os.path.exists(c):
            return c
    return CHROME_CANDIDATES[-1]


async def load(pg, base, sid, total):
    await pg.send('Page.navigate', url=base + 'study.html?sid=' + sid)
    await asyncio.sleep(1.0)
    for _ in range(400):
        n = await pg.ev("document.querySelectorAll('.subj-section[data-sid=\"%s\"] .qc[data-uid]').length" % sid)
        opts = await pg.ev("(document.getElementById('chJumpSel')||{options:[]}).options.length")
        if n >= total and opts > 1:
            break
        await asyncio.sleep(0.2)
    await pg.ev(HELPERS)
    return n


async def typed_jump(pg, sid, qn):
    """検索欄に番号を1文字ずつ打って Enter を押す（手の操作と同じ経路）。"""
    # ⚠️ focus() は preventScroll で。スマホ幅では検索欄が横スクロール行の画面外にあり、素の focus() だと
    #    ブラウザが入力欄を見せようとしてページごと先頭へ流す（人の操作は「行をずらして見えている欄を
    #    タップ」なので、この流れは起きない）。流れている最中に打つと「46」が「64」に化けた。
    await pg.ev("(()=>{const i=document.getElementById('searchInput'); i.value=''; i.dispatchEvent(new Event('input')); i.focus({preventScroll:true});})()")
    await asyncio.sleep(0.4)
    for ch in str(qn):
        await pg.send('Input.insertText', text=ch)
        await asyncio.sleep(0.04)
    for t in ('keyDown', 'keyUp'):
        await pg.send('Input.dispatchKeyEvent', type=t, key='Enter', code='Enter',
                      windowsVirtualKeyCode=13, **({'text': '\r'} if t == 'keyDown' else {}))
    return await pg.ev('''(async()=>{ await new Promise(r=>setTimeout(r,450)); await __stable();
      const c=__qcard("%s",%d); const sec=document.querySelector('.subj-section[data-sid="%s"]');
      const shown=[...sec.querySelectorAll('.qc[data-uid]')].filter(x=>x.style.display!=='none').length;
      return Object.assign({qn:%d, shown, all:sec.querySelectorAll('.qc[data-uid]').length}, __probe(c)); })()''' % (sid, qn, sid, qn))


async def main(a):
    sids = a.sids.split(',') if a.sids else \
        [os.path.basename(f)[10:-5] for f in sorted(glob.glob(os.path.join(ROOT, 'questions_*.json')))]
    w, h = (int(x) for x in a.size.split('x'))
    hport, cport = free_port(), free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(hport), '--bind', '127.0.0.1'],
                           cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    prof = os.path.join(os.environ.get('TEMP', '/tmp'), 'mec_jump_test_%d' % cport)
    chrome = subprocess.Popen([find_chrome(), '--headless=new', '--disable-gpu', '--no-first-run',
                               '--disable-extensions', '--remote-debugging-port=%d' % cport,
                               '--user-data-dir=' + prof, '--window-size=%d,%d' % (w, h), 'about:blank'],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = 'http://127.0.0.1:%d/' % hport
    fails = []
    try:
        for _ in range(100):
            try:
                tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:%d/json' % cport).read())
                urllib.request.urlopen(base + 'study.html').read()
                break
            except Exception:
                time.sleep(0.1)
        tab = [t for t in tabs if t['type'] == 'page'][0]
        pg = Page(await websockets.connect(tab['webSocketDebuggerUrl'], max_size=2 ** 26))
        for m in ('Runtime.enable', 'Page.enable', 'Network.enable'):
            await pg.send(m)
        await pg.send('Network.setCacheDisabled', cacheDisabled=True)
        await pg.send('Network.setBypassServiceWorker', bypass=True)       # 古いシェルを掴まない
        await pg.send('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=1, mobile=False)
        for sid in sids:
            d = json.load(open(os.path.join(ROOT, 'questions_%s.json' % sid), encoding='utf-8'))
            qs = [q for c in d['chapters'] for q in c['qs']]
            n = await load(pg, base, sid, len(qs))
            if n < len(qs):
                fails.append('%s: カードが %d/%d 枚しか読み込まれない' % (sid, n, len(qs)))
                continue
            if a.ios:
                await pg.ev("document.documentElement.classList.add('ios-no-cv')")
            await asyncio.sleep(0.8)
            bad = []
            opts = await pg.ev("[...document.querySelectorAll('#chJumpSel option')].filter(o=>o.value!=='').map(o=>[o.value,o.textContent])")
            for v, label in opts:
                r = await pg.ev('''(async()=>{ jumpToChapter(%s); await __stable();
                  const ch=_chapterMap[%s]; const el=_firstVisibleCardInChapter(ch)||ch.divEl;
                  return Object.assign({uid: el.dataset.uid||'(見出しのみ)'}, __probe(el)); })()''' % (v, v))
                if abs(r['off']) > TOL and not r['pin']:
                    bad.append('章 %s → %s が %+dpx ずれ' % (label, r['uid'], r['off']))
            num = lambda q: int(q['qn'].split('.')[-1])
            if a.all_q:
                pick = [num(q) for q in qs]
            else:
                pick = {num(c['qs'][0]) for c in d['chapters'] if c['qs']} | \
                       {num(c['qs'][-1]) for c in d['chapters'] if c['qs']} | \
                       {num(q) for q in random.Random(sid).sample(qs, min(12, len(qs)))}
                pick = sorted(pick)
            dup = {k for k in pick if sum(1 for q in qs if num(q) == k) > 1}
            for k in pick:
                if k in dup:
                    continue          # 暗記メモのように同じ番号が複数ある科目は、どれに飛ぶか決まらない
                r = await pg.ev('''(async()=>{ jumpToQnum('%d'); await __stable();
                  const c=__qcard("%s",%d); return c ? __probe(c) : {missing:true}; })()''' % (k, sid, k))
                if r.get('missing') or (abs(r['off']) > TOL and not r['pin']):
                    bad.append('番号 Q.%d が %s' % (k, '見つからない' if r.get('missing') else '%+dpx ずれ' % r['off']))
            nq = len(pick) - len(dup)
            if sid in a.typed.split(','):
                for k in sorted(pick)[-3:]:
                    r = await typed_jump(pg, sid, k)
                    if r['shown'] != r['all']:
                        bad.append('入力 Q.%d で絞り込みが掛かった（%d/%d 枚）' % (k, r['shown'], r['all']))
                    if abs(r['off']) > TOL and not r['pin']:
                        bad.append('入力 Q.%d が %+dpx ずれ' % (k, r['off']))
            print('%s %-8s 章 %2d本・番号 %3d問  %s' % ('NG' if bad else 'ok', sid, len(opts), nq,
                                                  ('' if not bad else '← %d件' % len(bad))), flush=True)
            for b in bad[:8]:
                print('      ' + b, flush=True)
            fails += ['%s: %s' % (sid, b) for b in bad]
    finally:
        chrome.kill()
        srv.kill()
    print('\n%s  (%s・%s)' % ('FAILED %d件' % len(fails) if fails else 'all passed',
                              a.size, 'iOS経路' if a.ios else 'PC経路'))
    return 1 if fails else 0


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('sids', nargs='?', default='')
    ap.add_argument('--all-q', action='store_true')
    ap.add_argument('--ios', action='store_true')
    ap.add_argument('--size', default='1100x900')
    ap.add_argument('--typed', default='tox,circ,hisshu', help='キー入力の経路も試す科目')
    sys.exit(asyncio.run(main(ap.parse_args())))
