// MEC の Service Worker（オフラインキャッシュ）。
// ⚠️ 変更履歴は _work/sw_changelog.md に書く（ここにコメントを積まない。sw.js はページを開くたびに
//    更新確認で取り直されるので、コメントも毎回ダウンロードされる＝2026-09-28 に 238KB を移した）。
const CACHE = "mec-v731";
// シェル更新トリガ: この文字列を変えると sw.js のバイトが変わり SW 更新が走る。CACHE 名は
// 据え置きなので CARDS(問題JSON 約15MB)は再DLされない。install が cache:'reload' でシェルだけ
// 最新取得して上書きするため、シェル(html/css/js)を変えたらここを日付+連番で bump すれば確実に届く。
// （questions_*.json を変えた時だけ CACHE 自体を bump ＝全再DL）
const SHELL_VERSION = "2026-10-03a";
// パスは相対必須: GitHub Pages のプロジェクトサイト（/MEC/ 配下）では
// "/study.html" は 404 になり caches.addAll が失敗 → SW インストール自体が失敗する
const SHELL = [
  "./study.html",
  "./index.html",
  "./index.js",
  "./stats.html",
  "./knowledge.html",
  "./knowledge_notes.js",
  "./dup_index.js",
  "./progress.js",
  "./attempts.js",
  "./fx_engine.js",
  "./calc_input.js",
  "./study_exam.js",
  "./fixed_uids.js",
  "./vars.css",
  "./theme.js",
  "./ui_theme.js",
  // テーマ別の CSS（node _work/build_theme_css.js の生成物）。ページは使うテーマの1つだけ読むが、
  // オフラインでもテーマを切り替えられるよう8テーマぶん全部を入れておく
  "./theme_css/ui_theme.aurora.css",
  "./theme_css/ui_theme.brass.css",
  "./theme_css/ui_theme.cyber.css",
  "./theme_css/ui_theme.liquid.css",
  "./theme_css/ui_theme.kintsugi.css",
  "./theme_css/ui_theme.celestial.css",
  "./theme_css/ui_theme.abyss.css",
  "./theme_css/ui_theme.frost.css",
  "./theme_css/index.aurora.css",
  "./theme_css/index.brass.css",
  "./theme_css/index.cyber.css",
  "./theme_css/index.liquid.css",
  "./theme_css/index.kintsugi.css",
  "./theme_css/index.celestial.css",
  "./theme_css/index.abyss.css",
  "./theme_css/index.frost.css",
  "./study.css",
  "./chapters_meta.js",
  "./rate_index.js",
  "./qmeta.json",
  "./image_dims.json",
  "./card_renderer.js",
  "./gamify.js",
  // 1日の最初のブリーフィング／週の結果発表（2026-09-23）
  "./hub_opening.js",
  // ハブのヒーローゲージ（UIテーマ Liquid・canvas）
  "./hub_liquid.js",
  "./hub_brass.js",
  "./fonts/nixie_oldstandard.woff2",
  // トロフィー棚（定着コレクション・章メダル・科目制覇）
  "./trophy.js",
  // 今日の進み（ハブの待機列・今日の歩み／試験の結果画面）
  "./day_progress.js",
  // ボス戦（study.html?mode=boss）
  "./boss.js",
  // 病棟回診（SRS復習の見せ方）＋確信度の宣言
  "./ward.js",
  // 効果音の一覧（派生物）。⚠️ sounds/ の音そのものは入れていない（オフラインでは鳴らない）。
  "./sounds_index.js",
  // 疾患マインドマップ（2026-08-21・段A）。旧9本＋統合マップは1エンジン＋データ分離へ移行した。
  // ⚠️ 新しい科目のマップを作ったら mindmap_data/{sid}.js をここへ足すこと（足さないとその科目だけ
  //    オフラインで開けない）。index.js の ready:true と一致していること。
  // 模試の自己採点（2026-09-08）。⚠️ 模試を1つ足したら mock_data/{id}.js をここへ足すこと
  //    （足さないとその模試だけオフラインで開けない）。mock_data/index.js の登録と一致させる。
  "./mock.html",
  "./mock.js",
  "./mock_data/index.js",
  "./mock_data/m121s.js",
  // 成績カルテ（2026-09-09）。採点は mock.js に任せ、ここは集計して並べるだけ。
  // ⚠️ {id}_rates.js は全国正答率の受け口で、中身が空でも必ず置く＝カルテが読みに行く。
  "./mock_karte.html",
  "./mock_data/m121s_rates.js",
  "./mindmap.html",
  "./mindmap.js",
  "./mindmap.css",
  "./mindmap_data/index.js",
  "./mindmap_data/_hub.js",
  "./mindmap_data/endo.js",
  "./mindmap_data/resp.js",
  "./mindmap_data/circ.js",
  "./mindmap_data/dige.js",
  "./mindmap_data/neur.js",
  "./mindmap_data/hbp.js",
  "./mindmap_data/jinzo_d.js",
  "./mindmap_data/hema.js",
  "./mindmap_data/imma.js",
  "./mindmap_data/tox.js",
  "./mindmap_data/anes.js",
  "./mindmap_data/rad.js",
  "./mindmap_data/uro.js",
  "./mindmap_data/ortho.js",
  "./mindmap_data/ent.js",
  "./mindmap_data/psy.js",
  "./mindmap_data/derm.js",
  "./mindmap_data/oph.js",
  "./mindmap_data/peds.js",
  "./mindmap_data/obg.js",
  "./mindmap_data/kansen.js",
];
// 新科目追加時は必ずここにも questions_{prefix}.json を追加すること（chapters_meta.js の sid 一覧と一致させる）
const CARDS = [
  "questions_endo.json","questions_resp.json","questions_circ.json","questions_dige.json",
  "questions_neur.json","questions_hbp.json","questions_jinzo_d.json","questions_hema.json",
  "questions_imma.json","questions_kansen.json","questions_jitsu1.json",
  "questions_peds.json","questions_obg.json","questions_psy.json",
  "questions_derm.json","questions_oph.json","questions_ent.json","questions_uro.json","questions_ortho.json","questions_anes.json","questions_rad.json","questions_tox.json","questions_emg.json","questions_ph.json",
  "questions_hisshu.json","questions_hisshu2.json","questions_sumresp.json","questions_lesdige.json","questions_knock.json","questions_m121s.json"
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

// Cache API に保存してよいレスポンスか。
// ⚠️ res.ok は 200〜299 で true なので 206 Partial Content も通してしまうが、Cache API は
// 部分レスポンスの保存を仕様で禁じており put() が必ず reject する（"Partial response
// (status code 206) is unsupported"）。効果音の <audio> は Range リクエストを投げるため
// 206 が日常的に返り、catch を付けていないと未処理の promise 拒否がコンソールに出続けて
// 本物のエラーを埋もれさせる。Range 付きリクエスト自体もキャッシュ対象から外す。
function _cacheable(req, res) {
  return res && res.ok && res.status !== 206 && !req.headers.has("range");
}
// put の失敗でレスポンス配送を巻き込まないよう握り潰す（容量超過などでも落とさない）。
function _putSafe(cache, req, res) {
  try { cache.put(req, res).catch(() => {}); } catch (e) {}
}

// 版数バッジ（progress.js）の問い合わせ口。この SW が配っている版＝SHELL_VERSION を返す。
self.addEventListener("message", e => {
  if (e.data && e.data.type === "mec-ver" && e.ports && e.ports[0]) e.ports[0].postMessage({ v: SHELL_VERSION });
});

self.addEventListener("fetch", e => {
  // GET かつ同一オリジンのみ（Gist API 等の POST/PATCH は cache.put が例外を投げる）
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // sw.js は横取りしない（版数バッジが毎回クエリ付きで取り直す＝キャッシュに溜めると増え続ける）
  if (url.pathname.endsWith("/sw.js")) return;
  if (CARDS.some(c => url.pathname.endsWith(c))) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (_cacheable(e.request, res)) _putSafe(c, e.request, res.clone());
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
        if (_cacheable(e.request, res)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => _putSafe(c, e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
