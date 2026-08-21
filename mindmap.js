// MEC 疾患マインドマップ エンジン（2026-08-21・段A）
// 科目マップ（mindmap.html?sid=hema）とハブ（mindmap.html）を同じコードで描く。
//
// ⚠️ この機能の不変条件（後から「かっこいいから」で戻したくなるもの）:
//   1. infinite アニメーションを1つも置かない。試験モードの演出（Phase 4/5）は
//      「読んでいる8〜15秒を埋める」ためのもので目的が違う。ここは眺めて思い出す道具で、
//      動くものがあると視線を奪われる。動くのはタップした瞬間の一度きりだけ。
//   2. SVGフィルタ（filter:url(#…)）を使わない。glow が欲しくなったら同心円を重ねて焼く。
//      旧実装は feGaussianBlur stdDeviation:55 を10枚重ねており、拡縮のたびに再ブラーしていた。
//   3. 巨大SVGを CSS transform:scale で拡縮しない。拡縮は viewBox の書き換えで行う。
//      旧実装は 2000×2000 の SVG を scale 3 まで拡大でき、レイヤーが 6000×6000＝約144MB に
//      なっていた（iPadが最初に音を上げる場所）。viewBox ならテクスチャは常にビューポート大。
//   4. 章の色・角度をデータに持たない。色は MM_PALETTE を章インデックスで引く。
//      旧データは章ごとに色を直書きしていたが、中身は「系統色」ではなく隣接章を見分けるための
//      回転パレットだった（「内分泌の基本」が橙＝代謝系、「脂質代謝」が赤＝炎症系）。
//
// テスト: node _work/test_mindmap_layout.js（実ソースを読み込む）

(function (global) {
  'use strict';

  // ── 寸法 ────────────────────────────────────────────────────────
  // ⚠️ 変えたら必ず _work/test_mindmap_layout.js を通すこと。
  //    テストは全21科目ぶんのレイアウトを実データで計算し、ノードが重ならないことを見張る。
  const CH_R = 32;          // 親ノード（章／科目）の半径
  const DIS_R = 27;         // 子ノード（疾患）の半径
  const CH_GAP = 26;        // 親ノード同士の最小すきま
  const DIS_GAP = 12;       // 子ノード同士の最小すきま
  const R1_MIN = 250;       // 親リングの最小半径
  const RING_STEP = 2 * DIS_R + 34;  // 子が入りきらないときに足す半径
  const SECTOR_MARGIN = 0.16;        // 隣の扇との余白（1区画に対する割合）
  const HUB_MAX_OPEN = 3;   // ハブで同時に開ける科目数

  // 章の色。隣接章が必ず違う色になるよう、章インデックスで引くだけの回転パレット。
  // ⚠️ 「系統色」ではない。系統で分けたければ意味のある軸を別に設計すること。
  const MM_PALETTE = [
    '#E8635A', '#E8913A', '#D9BE3C', '#8FC44A', '#46B36B', '#35B0A6',
    '#3E9BE0', '#5C7BE8', '#8E6FE0', '#C566CF', '#E0699C',
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // ── 小道具 ──────────────────────────────────────────────────────
  function ns(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function deg(a) { return a * Math.PI / 180; }
  function lighten(hex, p) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return '#' + [r, g, b].map(v => Math.round(v + (255 - v) * p).toString(16).padStart(2, '0')).join('');
  }
  function abbr(label) {
    const m = String(label).match(/^([A-Za-z0-9][A-Za-z0-9\-]*)/);
    if (m && m[1].length >= 2 && m[1].length <= 6) return m[1];
    const s = String(label).replace(/（.+?）/g, '');
    const parts = s.split(/[・\/]/);
    return parts[parts.length - 1].slice(0, 4);
  }
  function shortLabel(label, max) {
    const s = String(label).replace(/（.+?）/g, '').replace(/\/.+/, '').trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  // ── レイアウト ──────────────────────────────────────────────────
  // 親を1周に並べ、各親の「扇」の中に子を多重リングで積む。
  // 扇の幅は「子が1リングに収まる幅」と「隣に迷惑をかけない上限」の小さい方。
  //   ⚠️ この min を外すと、科目マップ（章数が少なく余裕がある）でも扇が
  //      開閉のたびに伸び縮みして、ノードの位置が動く＝「どこにあったか」が壊れる。
  //      余裕がある限り扇は必要なぶんだけ取り、位置は開閉に依存しない。
  function computeLayout(parents, isOpen) {
    const N = parents.length;
    if (!N) return { R1: R1_MIN, R2: R1_MIN, nodes: {}, parents: [], extent: R1_MIN };

    const R1 = Math.max(R1_MIN, N * (2 * CH_R + CH_GAP) / (2 * Math.PI));
    const RADIAL_GAP = 300 + N * 10;
    const R2 = R1 + RADIAL_GAP;
    const step = 360 / N;
    const margin = step * SECTOR_MARGIN;
    const unit = 2 * DIS_R + DIS_GAP;   // 子1つが食う弧長

    const out = { R1, R2, nodes: {}, parents: [], extent: R1 + CH_R };

    parents.forEach((p, i) => {
      const angle = -90 + step * i;
      const px = R1 * Math.cos(deg(angle)), py = R1 * Math.sin(deg(angle));
      const info = { idx: i, angle, x: px, y: py, color: p.color, rings: [] };
      out.parents.push(info);

      const kids = p.children || [];
      if (!kids.length || !isOpen(i)) return;

      // 使える角度：閉じている隣の区画は丸ごと借りられる（閉じた親に子は無いので衝突しない）
      const leftClosed = !isOpen((i - 1 + N) % N);
      const rightClosed = !isOpen((i + 1) % N);
      const availLeft = step * (leftClosed ? 1 : 0.5) - margin;
      const availRight = step * (rightClosed ? 1 : 0.5) - margin;

      // 1リングに収めるのに必要な幅（これ以上は広げない＝位置を開閉に依存させない）
      const needDeg = (kids.length * unit / R2) * 180 / Math.PI;
      const half = Math.min(needDeg / 2, Math.min(availLeft, availRight));
      const a0 = angle - Math.min(half, availLeft);
      const a1 = angle + Math.min(half, availRight);
      const fanRad = deg(a1 - a0);

      // リングごとの収容数
      const counts = [];
      let left = kids.length, k = 0;
      while (left > 0 && k < 8) {
        const r = R2 + k * RING_STEP;
        const cap = Math.max(1, Math.floor(fanRad * r / unit));
        counts.push(Math.min(cap, left));
        left -= cap;
        k++;
      }
      // 端数が最外リングに1つだけ残らないよう、リング数を決めてから均す
      const K = counts.length;
      if (K > 1) {
        const caps = [];
        for (let j = 0; j < K; j++) caps.push(Math.max(1, Math.floor(fanRad * (R2 + j * RING_STEP) / unit)));
        const total = kids.length;
        let assigned = 0;
        for (let j = 0; j < K; j++) {
          const want = Math.round(total * caps[j] / caps.reduce((s, c) => s + c, 0));
          counts[j] = Math.min(caps[j], j === K - 1 ? total - assigned : Math.max(1, want));
          assigned += counts[j];
        }
        // 丸めでこぼれたぶんを内側から詰める
        let short = total - counts.reduce((s, c) => s + c, 0);
        for (let j = 0; short > 0 && j < K; j++) {
          const room = caps[j] - counts[j];
          const add = Math.min(room, short);
          counts[j] += add; short -= add;
        }
      }

      let ki = 0;
      counts.forEach((m, ri) => {
        if (m <= 0) return;
        const r = R2 + ri * RING_STEP;
        const ring = [];
        for (let j = 0; j < m && ki < kids.length; j++, ki++) {
          const a = a0 + (j + 0.5) * (a1 - a0) / m;
          const node = {
            id: kids[ki].id, parent: i, ring: ri,
            x: r * Math.cos(deg(a)), y: r * Math.sin(deg(a)), r: DIS_R, angle: a,
          };
          out.nodes[node.id] = node;
          ring.push(node);
        }
        info.rings.push(ring);
        out.extent = Math.max(out.extent, r + DIS_R + 90);
      });
    });

    return out;
  }

  // ── エンジン本体 ────────────────────────────────────────────────
  function boot(opts) {
    const mode = opts.mode;                  // 'hub' | 'subject'
    const subjects = global.MM_SUBJECTS || [];
    const meta = {};
    subjects.forEach(s => { meta[s.sid] = s; });

    // parents = 親ノードの配列（章 or 科目）。children = 子（疾患）。
    let parents = [];
    let relations = [];
    let title = '';
    let rootLabel = '';
    let rootIcon = '🗺️';
    let studySid = '';

    if (mode === 'subject') {
      const data = (global.MM_DATA || {})[opts.sid];
      const m = meta[opts.sid] || { label: opts.sid, icon: '📘', color: '#888' };
      title = m.label + ' 疾患マインドマップ';
      rootLabel = m.label; rootIcon = m.icon; studySid = opts.sid;
      parents = data.chapters.map((ch, ci) => ({
        id: ch.id, label: ch.label, color: MM_PALETTE[ci % MM_PALETTE.length],
        sid: opts.sid, children: ch.diseases,
      }));
      relations = data.relations || [];
    } else {
      const hub = global.MM_HUB || { subjects: [], relations: [] };
      title = '全科目統合 疾患マインドマップ';
      rootLabel = '統合マップ'; rootIcon = '🗺️';
      // MM_SUBJECTS の並び順を正本にする（ハブの並びが gamify.js の科目順と一致する）
      const byId = {};
      hub.subjects.forEach(s => { byId[s.sid] = s; });
      parents = subjects.filter(s => byId[s.sid]).map(s => ({
        id: s.sid, label: s.label, color: s.color, icon: s.icon,
        sid: s.sid, children: byId[s.sid].diseases,
      }));
      relations = hub.relations || [];
    }

    const childOf = {};   // 疾患id → {data, parentIdx}
    parents.forEach((p, pi) => (p.children || []).forEach(d => { childOf[d.id] = { d, pi }; }));

    document.title = title + ' | MEC';
    const hTitle = document.getElementById('mmTitle');
    if (hTitle) hTitle.textContent = (mode === 'subject' ? meta[opts.sid].icon + ' ' : '🗺️ ') + title;

    // ── 状態 ──
    const open = new Set();
    // 科目マップは最初から全章を開く（俯瞰が目的なので、閉じた円を見せても仕方がない）。
    // ハブは科目が21あるので閉じた状態から始める。
    if (mode === 'subject') parents.forEach((_, i) => open.add(i));

    const svg = document.getElementById('mmSvg');
    const isOpen = i => open.has(i);
    let layout = computeLayout(parents, isOpen);

    // ── レイヤー ──
    const defs = ns('defs');
    const lBg = ns('g'), lEdgeP = ns('g'), lEdgeC = ns('g'), lRel = ns('g'),
          lNodeC = ns('g'), lNodeP = ns('g'), lRoot = ns('g'), lFx = ns('g');
    svg.append(defs, lBg, lEdgeP, lEdgeC, lRel, lNodeC, lNodeP, lRoot, lFx);

    const gradMade = {};
    function gradFor(key, color) {
      if (gradMade[key]) return 'url(#' + key + ')';
      const g = ns('radialGradient', { id: key, cx: '38%', cy: '35%', r: '62%' });
      g.append(ns('stop', { offset: '0%', 'stop-color': lighten(color, 0.45) }),
               ns('stop', { offset: '100%', 'stop-color': color }));
      defs.append(g);
      gradMade[key] = true;
      return 'url(#' + key + ')';
    }

    // ── 背景（同心円の目盛りだけ。星も星雲も置かない＝常時描画の負荷を作らない）──
    function drawBg() {
      lBg.textContent = '';
      [layout.R1 - CH_R - 26, layout.R2 - RING_STEP / 2].forEach(r => {
        if (r > 40) lBg.append(ns('circle', {
          cx: 0, cy: 0, r: r.toFixed(1), fill: 'none',
          stroke: 'rgba(255,255,255,0.05)', 'stroke-width': '1.5', 'stroke-dasharray': '6 12',
        }));
      });
    }

    // ── 中心 ──
    function drawRoot() {
      lRoot.textContent = '';
      const g = ns('g', { class: 'mm-root' });
      g.append(ns('circle', { r: 62, fill: 'rgba(245,166,35,0.10)' }));
      g.append(ns('circle', { r: 52, fill: 'rgba(245,166,35,0.14)' }));
      g.append(ns('circle', { r: 44, fill: gradFor('mmRootGrad', '#E68A00') }));
      const t1 = ns('text', { class: 'mm-root-ic', y: -4 }); t1.textContent = rootIcon;
      const t2 = ns('text', { class: 'mm-root-lb', y: 15 }); t2.textContent = rootLabel;
      g.append(t1, t2);
      lRoot.append(g);
    }

    // ── 親ノード（章／科目）──
    function splitLabel(l) {
      if (l.length <= 5) return [l];
      const p = l.split('・');
      if (p.length === 2) return p;
      if (p.length === 3) return [p[0] + '・' + p[1], p[2]];
      const m = Math.ceil(l.length / 2);
      return [l.slice(0, m), l.slice(m)];
    }
    function drawParents() {
      lEdgeP.textContent = ''; lNodeP.textContent = '';
      layout.parents.forEach((info, i) => {
        const p = parents[i];
        const ex = 46 * Math.cos(deg(info.angle)), ey = 46 * Math.sin(deg(info.angle));
        lEdgeP.append(ns('path', {
          d: `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${info.x.toFixed(1)} ${info.y.toFixed(1)}`,
          fill: 'none', stroke: p.color, 'stroke-width': 2.5, opacity: 0.45,
        }));
        const g = ns('g', { class: 'mm-par', transform: `translate(${info.x.toFixed(1)},${info.y.toFixed(1)})` });
        g.dataset.pi = i;
        if (isOpen(i)) g.classList.add('is-open');
        g.append(ns('circle', { class: 'mm-par-halo', r: CH_R + 11, fill: 'none', stroke: p.color, 'stroke-width': 2 }));
        g.append(ns('circle', { class: 'mm-par-c', r: CH_R, fill: gradFor('g_' + p.id, p.color) }));
        if (p.icon) { const ic = ns('text', { class: 'mm-par-ic', y: -6 }); ic.textContent = p.icon; g.append(ic); }
        const lines = splitLabel(p.label);
        const y0 = p.icon ? 10 : -(lines.length - 1) * 6 + 4;
        lines.forEach((ln, li) => {
          const t = ns('text', { class: 'mm-par-lb', y: y0 + li * 11 });
          t.textContent = ln; g.append(t);
        });
        g.addEventListener('click', e => { e.stopPropagation(); toggle(i); });
        lNodeP.append(g);
      });
    }

    // ── 子ノード（疾患）──
    function anchorFor(x) { return x < -20 ? 'end' : x > 20 ? 'start' : 'middle'; }

    // 習熟度ヘルパー（myrate_v1 から正答率を評価）
    let _mmRateCache = null;
    function getMastery(did) {
      if (_mmRateCache === null) {
        try { _mmRateCache = JSON.parse(localStorage.getItem('myrate_v1') || '{}'); }
        catch { _mmRateCache = {}; }
      }
      // did または関連uidで突合
      const entry = _mmRateCache[did];
      if (!entry || !entry[1]) return 'mm-fresh';
      const pct = Math.round(entry[0] / entry[1] * 100);
      return pct >= 80 ? 'mm-mastered' : (pct < 60 ? 'mm-review' : 'mm-learning');
    }

    function drawChildren() {
      lEdgeC.textContent = ''; lNodeC.textContent = '';
      layout.parents.forEach((info, pi) => {
        if (!isOpen(pi)) return;
        const p = parents[pi];
        let kidIdx = 0;
        info.rings.forEach(ring => ring.forEach(node => {
          const d = childOf[node.id].d;
          const mastery = getMastery(node.id);
          const pth = ns('path', {
            class: 'mm-edge-c',
            d: `M ${info.x.toFixed(1)} ${info.y.toFixed(1)} L ${node.x.toFixed(1)} ${node.y.toFixed(1)}`,
            fill: 'none', stroke: p.color, 'stroke-width': 1.4, opacity: 0.32,
          });
          lEdgeC.append(pth);
          const g = ns('g', {
            class: `mm-dis ${mastery} mm-dis-in`,
            transform: `translate(${node.x.toFixed(1)},${node.y.toFixed(1)})`
          });
          g.style.setProperty('--delay', (kidIdx * 0.02) + 's');
          g.dataset.did = node.id;
          if (d.imgs && d.imgs.length) {
            const cid = 'clip_' + node.id;
            if (!gradMade[cid]) {
              const cp = ns('clipPath', { id: cid });
              cp.append(ns('circle', { cx: 0, cy: 0, r: DIS_R }));
              defs.append(cp); gradMade[cid] = true;
            }
            g.append(ns('image', {
              href: d.imgs[0], x: -DIS_R, y: -DIS_R, width: DIS_R * 2, height: DIS_R * 2,
              'clip-path': 'url(#' + cid + ')', preserveAspectRatio: 'xMidYMid slice',
            }));
            g.append(ns('circle', { class: 'mm-dis-c mm-dis-ring', r: DIS_R, fill: 'none', stroke: p.color, 'stroke-width': 2.5 }));
          } else {
            g.append(ns('circle', { class: 'mm-dis-c', r: DIS_R, fill: gradFor('g_' + p.id, p.color) }));
            const t = ns('text', { class: 'mm-dis-ab', y: 4 });
            t.textContent = abbr(d.label); g.append(t);
          }
          const len = Math.hypot(node.x, node.y) || 1;
          const lx = node.x / len * (DIS_R + 19), ly = node.y / len * (DIS_R + 19);
          const lb = ns('text', {
            class: 'mm-dis-lb', x: lx.toFixed(1), y: (ly + 4).toFixed(1),
            'text-anchor': anchorFor(node.x),
          });
          lb.textContent = shortLabel(d.label, 9);
          g.append(lb);
          g.addEventListener('click', e => { e.stopPropagation(); showDisease(node.id); });
          lNodeC.append(g);
          kidIdx++;
        }));
      });
    }

    // ── 関連線 ──
    function drawRelations() {
      lRel.textContent = '';
      relations.forEach((rel, ri) => {
        const a = layout.nodes[rel.from], b = layout.nodes[rel.to];
        if (!a || !b) return;                // 両端が開いていなければ描かない
        const fp = childOf[rel.from], tp = childOf[rel.to];
        const same = fp.pi === tp.pi;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        let cx, cy;
        if (same) {
          // 同じ親の中：外側へ大きく張り出して、間のノードを避ける
          const l = Math.hypot(mx, my) || 1;
          cx = mx + mx / l * 130; cy = my + my / l * 130;
        } else {
          // 親をまたぐ：中心へ引き込んで放射状の外周を横切る
          cx = mx * 0.62; cy = my * 0.62;
        }
        const color = parents[fp.pi].color;
        const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        lRel.append(ns('path', {
          class: 'mm-rel', d, fill: 'none', stroke: color,
          'stroke-width': 1.6, 'stroke-dasharray': '6 5', opacity: 0.7,
        }));
        // ラベルは親をまたぐ関連にだけ出す（同じ親の中はノード間に文字が重なる）
        if (!same && rel.label) {
          const lx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
          const ly = 0.25 * a.y + 0.5 * cy + 0.25 * b.y - 7;
          const w = rel.label.length * 7.2 + 10;
          lRel.append(ns('rect', {
            class: 'mm-rel-bg', x: (lx - w / 2).toFixed(1), y: (ly - 10).toFixed(1),
            width: w.toFixed(1), height: 14, rx: 4,
          }));
          const t = ns('text', { class: 'mm-rel-lb', x: lx.toFixed(1), y: ly.toFixed(1), fill: color });
          t.textContent = rel.label; lRel.append(t);
        }
        const hit = ns('path', { class: 'mm-rel-hit', d, fill: 'none', stroke: 'transparent', 'stroke-width': 20 });
        hit.addEventListener('click', e => { e.stopPropagation(); showRelation(ri); });
        lRel.append(hit);
      });
    }

    function renderAll() {
      layout = computeLayout(parents, isOpen);
      drawBg(); drawParents(); drawChildren(); drawRelations(); drawRoot();
    }

    // ── 開閉 ──
    function toggle(i) {
      if (open.has(i)) open.delete(i);
      else {
        if (mode === 'hub' && open.size >= HUB_MAX_OPEN) open.delete(open.values().next().value);
        open.add(i);
        pulse(layout.parents[i]);
      }
      renderAll();
      syncButtons();
      if (open.has(i)) focusParent(i);
    }

    // 開いた親の「材料」（親ノード＋その子）が画面に収まるところまで寄る。
    // ⚠️ 親ノードの座標へ panTo するだけでは駄目——子は外側のリングに出るので、
    //    画面には親だけが写って「開いたのに何も増えていない」ように見える。
    function focusParent(i) {
      const info = layout.parents[i];
      const pts = [{ x: info.x, y: info.y, r: CH_R }];
      info.rings.forEach(ring => ring.forEach(n => pts.push({ x: n.x, y: n.y, r: DIS_R + 46 })));
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(p => {
        x0 = Math.min(x0, p.x - p.r); y0 = Math.min(y0, p.y - p.r);
        x1 = Math.max(x1, p.x + p.r); y1 = Math.max(y1, p.y + p.r);
      });
      // 中心（ルート）も視界に残す＝「どこの科目を開いたか」が分かる
      x0 = Math.min(x0, -70); y0 = Math.min(y0, -70);
      x1 = Math.max(x1, 70); y1 = Math.max(y1, 70);
      const r = wrap.getBoundingClientRect();
      const aspect = r.height && r.width ? r.height / r.width : 1;
      let w = Math.max(x1 - x0, (y1 - y0) / aspect) * 1.12;
      w = Math.max(MIN_W, Math.min(MAX_W, w));
      animateView(( x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - w * aspect / 2, w, w * aspect);
    }

    // 開いた瞬間の波紋。超伝導ビッグバン（親から子へ電光連鎖）。
    function pulse(info) {
      if (reduceMotion) return;
      for (let w = 0; w < 3; w++) {
        const c = ns('circle', {
          class: 'mm-pulse', cx: info.x.toFixed(1), cy: info.y.toFixed(1), r: CH_R,
          fill: 'none', stroke: parents[info.idx].color, 'stroke-width': 4 - w,
        });
        c.style.animationDelay = (w * 0.08) + 's';
        lFx.append(c);
        setTimeout(() => c.remove(), 800);
      }
      info.rings.forEach(ring => ring.forEach((n, ni) => {
        setTimeout(() => {
          const cp = ns('circle', {
            class: 'mm-pulse', cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: DIS_R,
            fill: 'none', stroke: parents[info.idx].color, 'stroke-width': 2.5,
          });
          lFx.append(cp);
          setTimeout(() => cp.remove(), 700);
        }, 100 + ni * 22);
      }));
    }

    // ── パネル ─────────────────────────────────────────────────
    const panel = document.getElementById('mmPanel');
    const elChip = document.getElementById('mmChip');
    const elTitle = document.getElementById('mmPanelTitle');
    const elKeys = document.getElementById('mmKeys');
    const elImgs = document.getElementById('mmImgs');
    const elLink = document.getElementById('mmLink');

    function showDisease(did) {
      const { d, pi } = childOf[did];
      const p = parents[pi];
      elChip.textContent = (p.icon ? p.icon + ' ' : '📌 ') + p.label;
      elChip.style.background = p.color;
      elTitle.textContent = d.label;
      elKeys.textContent = '';
      (d.keys || []).forEach(k => {
        const li = document.createElement('li'); li.textContent = k; elKeys.append(li);
      });
      elImgs.textContent = '';
      (d.imgs || []).forEach(src => {
        const im = document.createElement('img');
        im.src = src; im.alt = d.label; im.loading = 'lazy';
        im.addEventListener('click', () => openLightbox(src));
        elImgs.append(im);
      });
      const sid = mode === 'subject' ? studySid : p.sid;
      elLink.href = 'study.html?sid=' + encodeURIComponent(sid);
      elLink.textContent = '📝 ' + (meta[sid] ? meta[sid].label : '') + 'の問題へ';
      elLink.style.display = '';
      panel.classList.add('show');
    }

    function showRelation(ri) {
      const rel = relations[ri];
      const f = childOf[rel.from], t = childOf[rel.to];
      elChip.textContent = '⇔ ' + (rel.label || '関連');
      elChip.style.background = parents[f.pi].color;
      elTitle.textContent = f.d.label + ' ⇔ ' + t.d.label;
      elKeys.textContent = '';
      if (rel.explain) { const li = document.createElement('li'); li.textContent = rel.explain; elKeys.append(li); }
      elImgs.textContent = '';
      const sid = mode === 'subject' ? studySid : parents[f.pi].sid;
      elLink.href = 'study.html?sid=' + encodeURIComponent(sid);
      elLink.textContent = '📝 ' + (meta[sid] ? meta[sid].label : '') + 'の問題へ';
      panel.classList.add('show');
    }

    function hidePanel() { panel.classList.remove('show'); }
    document.getElementById('mmPanelClose').addEventListener('click', hidePanel);
    svg.addEventListener('click', hidePanel);

    const lb = document.getElementById('mmLightbox');
    function openLightbox(src) {
      document.getElementById('mmLightboxImg').src = src;
      lb.classList.add('open');
    }
    lb.addEventListener('click', () => lb.classList.remove('open'));

    // ── パン／ズーム（viewBox 駆動）────────────────────────────
    // ⚠️ CSS transform で拡縮しないこと（不変条件3）。
    const wrap = document.getElementById('mmWrap');
    let view = { x: -600, y: -600, w: 1200, h: 1200 };
    let raf = 0;

    function applyView() {
      raf = 0;
      svg.setAttribute('viewBox', `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(applyView); }

    // 与えられたレイヤーの外形の和を返す（空のレイヤーは無視する）
    function unionBBox(layers) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      layers.forEach(g => {
        if (!g.childNodes.length) return;
        let b;
        try { b = g.getBBox(); } catch (e) { return; }
        if (!b || (!b.width && !b.height)) return;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      });
      if (!isFinite(x0)) return null;
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }

    function matchAspect() {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const want = view.w * (r.height / r.width);
      view.y += (view.h - want) / 2;
      view.h = want;
    }
    function fit() {
      const r = wrap.getBoundingClientRect();
      const aspect = r.height && r.width ? r.height / r.width : 1;
      // ⚠️ 実際に描かれたものの外形（getBBox）で合わせること。
      //    レイアウトの計算値から見積もると、ラベルの張り出しぶんを当て推量で足すことになり、
      //    実測では縦に27%の余白が出ていた（＝地図が必要以上に小さく表示される）。
      // ⚠️ ただし背景（lBg）と演出（lFx）は測らないこと。背景の目盛り円は疾患リングの
      //    大きさで描かれるので、何も展開していないハブだと「中身は中心の10ノードだけなのに
      //    外形は疾患リングぶん」になり、地図が画面の中央で豆粒になる（実機で確認）。
      const bb = unionBBox([lEdgeP, lEdgeC, lRel, lNodeC, lNodeP, lRoot]);
      let cx = 0, cy = 0, halfW = layout.extent + 40, halfH = layout.extent + 40;
      if (bb && bb.width > 1 && bb.height > 1) {
        cx = bb.x + bb.width / 2; cy = bb.y + bb.height / 2;
        halfW = bb.width / 2 + 56; halfH = bb.height / 2 + 56;
      }
      view.w = 2 * halfW; view.h = view.w * aspect;
      if (view.h < 2 * halfH) { view.h = 2 * halfH; view.w = view.h / aspect; }
      view.x = cx - view.w / 2; view.y = cy - view.h / 2;
      applyView();
    }
    function toWorld(clientX, clientY) {
      const r = wrap.getBoundingClientRect();
      return {
        x: view.x + (clientX - r.left) / r.width * view.w,
        y: view.y + (clientY - r.top) / r.height * view.h,
      };
    }
    const MIN_W = 300, MAX_W = 6000;
    function zoomAt(clientX, clientY, factor) {
      const w = Math.max(MIN_W, Math.min(MAX_W, view.w * factor));
      const f = w / view.w;
      const p = toWorld(clientX, clientY);
      view.x = p.x - (p.x - view.x) * f;
      view.y = p.y - (p.y - view.y) * f;
      view.w *= f; view.h *= f;
      schedule();
    }

    let dragging = false, lastX = 0, lastY = 0, lastDist = 0;
    wrap.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; e.preventDefault(); });
    global.addEventListener('mousemove', e => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      view.x -= (e.clientX - lastX) / r.width * view.w;
      view.y -= (e.clientY - lastY) / r.height * view.h;
      lastX = e.clientX; lastY = e.clientY; schedule();
    });
    global.addEventListener('mouseup', () => { dragging = false; });
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });

    wrap.addEventListener('touchstart', e => {
      if (e.touches.length === 1) { dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
      else if (e.touches.length === 2) {
        dragging = false;
        lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    wrap.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && dragging) {
        const r = wrap.getBoundingClientRect();
        view.x -= (e.touches[0].clientX - lastX) / r.width * view.w;
        view.y -= (e.touches[0].clientY - lastY) / r.height * view.h;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        e.preventDefault(); schedule();
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastDist) {
          const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          zoomAt(cx, cy, lastDist / d);
        }
        lastDist = d; e.preventDefault();
      }
    }, { passive: false });
    wrap.addEventListener('touchend', () => { dragging = false; lastDist = 0; });

    // ⚠️ 走っているアニメーションは必ず1本にすること。
    //    連続でタップすると複数の rAF ループが同じ view を奪い合い、
    //    実測でレンダラが応答しなくなった（スクリーンショットが30秒タイムアウトした）。
    let animToken = 0, animLand = 0;
    function animateView(tx, ty, tw, th) {
      animToken++;
      clearTimeout(animLand);
      const me = animToken;
      const land = () => { if (me !== animToken) return; view = { x: tx, y: ty, w: tw, h: th }; applyView(); };
      if (reduceMotion) { land(); return; }
      const s0 = { x: view.x, y: view.y, w: view.w, h: view.h };
      const t0 = performance.now(), D = 430;
      // ⚠️ 裏タブでは rAF が1フレームも来ない。着地点を必ず別に置く
      //    （ハブの _tweenNum・統計の countUp と同じ穴）。
      animLand = setTimeout(land, D + 300);
      (function stepFn(now) {
        if (me !== animToken) return;
        const p = Math.min((now - t0) / D, 1), e = 1 - Math.pow(1 - p, 3);
        view.x = s0.x + (tx - s0.x) * e; view.y = s0.y + (ty - s0.y) * e;
        view.w = s0.w + (tw - s0.w) * e; view.h = s0.h + (th - s0.h) * e;
        applyView();
        if (p < 1) requestAnimationFrame(stepFn);
        else { clearTimeout(animLand); land(); }
      })(performance.now());
    }
    function panTo(wx, wy) {
      animateView(wx - view.w / 2, wy - view.h / 2, view.w, view.h);
    }

    global.addEventListener('resize', () => { matchAspect(); schedule(); });

    // ── 検索 ────────────────────────────────────────────────────
    const search = document.getElementById('mmSearch');
    const results = document.getElementById('mmResults');
    const allChildren = [];
    parents.forEach((p, pi) => (p.children || []).forEach(d => allChildren.push({ d, pi })));

    function runSearch() {
      const q = search.value.trim();
      results.textContent = '';
      if (!q) { results.classList.remove('show'); return; }
      // ⚠️ 疾患名で当たったものを先に出すこと。keys にも本文が入っているので、
      //    素の filter だと「梗塞」で『神経画像・検査』が1位に来る（実測）。
      const scored = [];
      allChildren.forEach(c => {
        if (c.d.label.includes(q)) scored.push({ c, s: c.d.label.startsWith(q) ? 0 : 1 });
        else if ((c.d.keys || []).some(k => k.includes(q))) scored.push({ c, s: 2 });
      });
      scored.sort((a, b) => a.s - b.s);
      const hits = scored.slice(0, 8).map(x => x.c);
      if (!hits.length) {
        const li = document.createElement('li');
        li.className = 'mm-res-none'; li.textContent = '該当なし';
        results.append(li);
      }
      hits.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = '';
        const dot = document.createElement('span');
        dot.className = 'mm-res-dot'; dot.style.background = parents[c.pi].color;
        const tx = document.createElement('span');
        tx.textContent = c.d.label;
        const sub = document.createElement('em');
        sub.textContent = parents[c.pi].label;
        li.append(dot, tx, sub);
        li.addEventListener('click', () => {
          if (!open.has(c.pi)) toggle(c.pi);
          const n = layout.nodes[c.d.id];
          if (n) panTo(n.x, n.y);
          showDisease(c.d.id);
          results.classList.remove('show');
          search.blur();
        });
        results.append(li);
      });
      results.classList.add('show');
    }
    search.addEventListener('input', runSearch);
    search.addEventListener('focus', runSearch);
    document.addEventListener('click', e => {
      if (!e.target.closest('.mm-search')) results.classList.remove('show');
    });

    // ── ボタン ──
    document.getElementById('mmFitAll').addEventListener('click', fit);
    const btnToggle = document.getElementById('mmToggleAll');
    function syncButtons() {
      if (open.size) { btnToggle.textContent = 'すべて閉じる'; btnToggle.style.display = ''; }
      else if (mode === 'subject') { btnToggle.textContent = 'すべて開く'; btnToggle.style.display = ''; }
      // ⚠️ ハブに「すべて開く」は置かない。21科目×代表8疾患を同時に置くと、
      //    どの科目も隣の角度を借りられず必ず衝突する（幾何の要請であって好みではない）。
      else btnToggle.style.display = 'none';
    }
    btnToggle.addEventListener('click', () => {
      if (open.size) open.clear();
      else if (mode === 'subject') parents.forEach((_, i) => open.add(i));
      renderAll(); syncButtons(); fit();
    });

    // ── 初期描画 ──
    renderAll();
    syncButtons();
    fit();

    return { renderAll, fit, open, layout: () => layout };
  }

  global.MMEngine = { boot, computeLayout, MM_PALETTE, dims: { CH_R, DIS_R, CH_GAP, DIS_GAP, R1_MIN, RING_STEP, SECTOR_MARGIN, HUB_MAX_OPEN } };
})(typeof window !== 'undefined' ? window : globalThis);
