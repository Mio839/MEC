// v124: 眼科 第2章「結膜・角膜疾患」26問を追加（questions_oph.json が 50→76問）。
// 画像も15問16枚を追加したので CACHE を bump。本章はアデノウイルス関連が9問を占める。
// v123: 眼科(oph)を新科目として追加（第1章「眼科の基本」NO.1-50・画像11問13枚）。
// questions_oph.json を CARDS に加え、眼科/images/ を追加したので CACHE を bump。
// 眼科は全8章213問の予定で、章頭NO.は 1／51／77／97／116／162／179／192。
// v122: エラー報告2件を修正。circ_ch03_q134(119F-70) に欠けていた心電図モニター波形を
// PDFから書き出して割り当て（循環器/images/119F-70_1.jpeg を新規追加）、peds_ch03_q127(115C-41)
// の「男児（％）／女児（％）」2列の表の選択肢から女児列が落ちていたのを復元。
// questions_circ/peds.json と画像を更新したので CACHE を bump。
// v121: 皮膚科 第9章「その他の皮膚疾患」27問を追加（questions_derm.json が 222→249問）。
// これで皮膚科は全9章・NO.1-249 が完成。画像も6問6枚を追加したので CACHE を bump。
// v120: 皮膚科 第8章「感染症」32問を追加（questions_derm.json が 190→222問）。
// 画像も21問32枚を追加したので CACHE を bump。
// v119: 皮膚科 第7章「悪性腫瘍」40問を追加（questions_derm.json が 150→190問）。
// derm では最大の章。画像も25問46枚を追加したので CACHE を bump。
// v118: 皮膚科 第6章「母斑と良性腫瘍」29問を追加（questions_derm.json が 121→150問）。
// 画像も18問26枚を追加したので CACHE を bump。
// v117: 皮膚科 第5章「水疱・膿疱」23問を追加（questions_derm.json が 98→121問）。
// 画像も20問33枚を追加したので CACHE を bump。
// v116: 皮膚科 第4章「角化症」17問を追加（questions_derm.json が 81→98問）。
// 画像も8問13枚を追加したので CACHE を bump。
// v115: 皮膚科 第3章「紅斑」27問を追加（questions_derm.json が 54→81問）。
// 画像も16問23枚を追加したので CACHE を bump。
// v114: 皮膚科 第2章「皮膚炎と蕁麻疹」27問を追加（questions_derm.json が 27→54問）。
// 画像も10問15枚を追加したので CACHE を bump。
// v113: 皮膚科(derm)を新科目として追加（第1章「皮膚科の基本」27問・画像8問）。
// questions_derm.json を CARDS に加え、皮膚科/images/ を追加したので CACHE を bump。
// v112: 精神科 第8章「その他の精神疾患」14問を追加（questions_psy.json が 242→256問）。
// これで精神科は全8章・NO.1-256 が完成。
// v111: 精神科 第7章「発達障害と小児の精神障害」24問を追加（questions_psy.json が 218→242問）。
// v110: 精神科 第6章「薬物に伴う精神行動障害」25問を追加（questions_psy.json が 193→218問）。
// v109: 精神科 第5章「睡眠の生理と睡眠障害」18問を追加（questions_psy.json が 175→193問）。
// あわせて psy のQ番号をPDF通し番号へ是正（章ごとにQ.1へ振り直していたのをやめた）。
// ch02〜ch04 の uid が psy_chNN_q1.. から通し番号へ変わるため、旧uidの進捗は引き継がれない。
// v108: 選択肢が欠落していた残り14問を復元（表・図の選択肢11問＋設問文ごと壊れていた3問）。
// questions_circ/jinzo_d.json を更新したので bump。過去問HTMLはシェル側の更新。
// v107: 精神科 第4章「神経症性障害」36問を追加（questions_psy.json が 139→175問）。データ更新のため bump。
// v106: 精神科 第3章「気分障害」41問を追加（questions_psy.json が 98→139問）。データ更新のため bump。
// v105: 精神科 第2章「統合失調症」25問を追加（questions_psy.json が 73→98問）。データ更新のため bump。
// v104: 精神科(psy)を新科目として追加。questions_psy.json を CARDS に加えたので CACHE を bump。
// v103: 計算問題を桁入力で解答できるようにした（calc_input.js 新設）。
// questions_circ/dige/endo/jinzo_d/peds/resp.json の ans_label を正規形へ書き換えたので、
// CARDS が旧内容のままだと入力欄が作れず解答不能のままになる。よって CACHE を bump する。
const CACHE = "mec-v124";
// シェル更新トリガ: この文字列を変えると sw.js のバイトが変わり SW 更新が走る。CACHE 名は
// 据え置きなので CARDS(問題JSON 約15MB)は再DLされない。install が cache:'reload' でシェルだけ
// 最新取得して上書きするため、シェル(html/css/js)を変えたらここを日付+連番で bump すれば確実に届く。
// （questions_*.json を変えた時だけ CACHE 自体を bump ＝全再DL）
const SHELL_VERSION = "2026-07-29c";
// パスは相対必須: GitHub Pages のプロジェクトサイト（/MEC/ 配下）では
// "/study.html" は 404 になり caches.addAll が失敗 → SW インストール自体が失敗する
const SHELL = [
  "./study.html",
  "./index.html",
  "./stats.html",
  "./knowledge.html",
  "./knowledge_notes.js",
  "./progress.js",
  "./attempts.js",
  "./fx_engine.js",
  "./calc_input.js",
  "./study_exam.js",
  "./fixed_uids.js",
  "./vars.css",
  "./theme.js",
  "./study.css",
  "./chapters_meta.js",
  "./rate_index.js",
  "./qmeta.json",
  "./image_dims.json",
  "./card_renderer.js",
  "./gamify.js",
];
// 新科目追加時は必ずここにも questions_{prefix}.json を追加すること（chapters_meta.js の sid 一覧と一致させる）
const CARDS = [
  "questions_endo.json","questions_resp.json","questions_circ.json","questions_dige.json",
  "questions_neur.json","questions_hbp.json","questions_jinzo_d.json","questions_hema.json",
  "questions_imma.json","questions_kansen.json","questions_jitsu1.json",
  "questions_peds.json","questions_obg.json","questions_psy.json",
  "questions_derm.json","questions_oph.json"
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
