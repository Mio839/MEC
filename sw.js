const CACHE = "mec-v84";
// シェル更新トリガ: この文字列を変えると sw.js のバイトが変わり SW 更新が走る。CACHE 名は
// 据え置きなので CARDS(問題JSON 約15MB)は再DLされない。install が cache:'reload' でシェルだけ
// 最新取得して上書きするため、シェル(html/css/js)を変えたらここを日付+連番で bump すれば確実に届く。
// （questions_*.json を変えた時だけ CACHE 自体を bump ＝全再DL）
const SHELL_VERSION = "2026-07-13g";
// パスは相対必須: GitHub Pages のプロジェクトサイト（/MEC/ 配下）では
// "/study.html" は 404 になり caches.addAll が失敗 → SW インストール自体が失敗する
const SHELL = [
  "./study.html",
  "./index.html",
  "./stats.html",
  "./knowledge.html",
  "./knowledge_notes.js",
  "./progress.js",
  "./fx_engine.js",
  "./study_exam.js",
  "./fixed_uids.js",
  "./vars.css",
  "./study.css",
  "./chapters_meta.js",
  "./rate_index.js",
  "./card_renderer.js",
];
// 新科目追加時は必ずここにも questions_{prefix}.json を追加すること（chapters_meta.js の sid 一覧と一致させる）
const CARDS = [
  "questions_endo.json","questions_resp.json","questions_circ.json","questions_dige.json",
  "questions_neur.json","questions_hbp.json","questions_jinzo_d.json","questions_hema.json",
  "questions_imma.json","questions_kansen.json","questions_jitsu1.json",
  "questions_peds.json","questions_obg.json"
];

self.addEventListener("install", e => {
  // cache:'reload' で HTTP キャッシュを無視し必ず最新シェルを取得する（deploy 直後、GitHub Pages の
  // max-age 内でもブラウザHTTPキャッシュの旧ファイルを掴まない＝「pushしたのに反映されない」を根絶）。
  // 1ファイル失敗しても install 全体は落とさない。skipWaiting で待機せず即座に新SWへ切替える。
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      SHELL.map(u => fetch(u, { cache: "reload" }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {}))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // GET かつ同一オリジンのみ（Gist API 等の POST/PATCH は cache.put が例外を投げる）
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (CARDS.some(c => url.pathname.endsWith(c))) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
