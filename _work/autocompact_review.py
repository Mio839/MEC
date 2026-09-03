# -*- coding: utf-8 -*-
"""
--autocompact 400000 を使い続けるかを判断するための計測ツール（2026-08-28 新設）。

    python _work/autocompact_review.py            # 導入日(2026-08-28)を境に前後比較
    python _work/autocompact_review.py --since 2026-09-05   # 境を変える

背景:
  auto_resume.ps1 の $ClaudeArgs に '--autocompact','400000' を入れた。
  既定の 'auto' は contextWindow=1M のため341ターン回しても一度も圧縮せず、
  文脈が 195k→444k と伸び続けていた（実測）。400k なら1回だけ畳まれる見込み。

このツールが答える2つの問い:
  ① 効いたか   … 1メッセージあたりの文脈長が下がったか
                  ⚠️素の $/msg はモデル（Sonnet$2 vs Opus$5）と出力量で
                    簡単に反転するので、「入力側だけ」の行で判断する
  ② 損したか   … 圧縮の直後に「前に読んだファイルを読み直す」が増えていないか
                  （試算の唯一の弱点がここ。ターン数が増えれば削減は相殺される）

⚠️ --autocompact が効くのは auto_resume.ps1 が起動したセッションだけなので、
   auto_resume.log の再開記録で対象ウィンドウを特定してから比べる。
   手で開いた通常セッションと混ぜると設定と無関係な差を見ることになる。
"""
import json, glob, os, re, sys, datetime, statistics, collections

JST      = datetime.timezone(datetime.timedelta(hours=9))
PROJ     = os.path.expanduser(r"~\.claude\projects\C--Users-coool-Desktop-MEC")
LOG      = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auto_resume.log")
# ログから逆算した単価（Sonnet/Opusとも実測が丸い数字に一致したので確度は高い）
PRICE    = {"claude-opus-5": 5.0, "claude-sonnet-5": 2.0, "claude-haiku-4-5-20251001": 0.8}
MULT     = {"in": 1.0, "write": 2.0, "read": 0.1, "out": 5.0}
WINDOW_H = 6      # 再開1回ぶんとみなす時間幅
REWORK_N = 20     # 圧縮の直後、何メッセージぶんを「取り直し」の観察対象にするか


def cost(u, model):
    b = PRICE.get(model, 2.0) / 1e6
    return b * (u.get("input_tokens", 0) * MULT["in"]
                + u.get("cache_creation_input_tokens", 0) * MULT["write"]
                + u.get("cache_read_input_tokens", 0) * MULT["read"]
                + u.get("output_tokens", 0) * MULT["out"])


def resume_windows():
    """auto_resume.log から『いつ・どのセッションを再開したか』を拾う。"""
    if not os.path.exists(LOG):
        return []
    # 新形式「Windows Terminal で再開: <sid>」／旧形式「Claude起動: resume=<sid>」の両方
    pat = re.compile(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\].*?(?:で再開|Claude起動).*?(?:resume=)?"
                     r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})")
    out = []
    for enc in ("utf-8-sig", "utf-8", "cp932"):
        try:
            text = open(LOG, encoding=enc, errors="replace").read()
            break
        except Exception:
            continue
    else:
        return []
    for m in pat.finditer(text):
        t = datetime.datetime.strptime(m.group(1), "%Y-%m-%d %H:%M:%S").replace(tzinfo=JST)
        out.append((m.group(2), t, t + datetime.timedelta(hours=WINDOW_H)))
    return out


def load_messages():
    """全transcriptから assistant メッセージを時系列で読む。"""
    msgs = []
    for p in glob.glob(os.path.join(PROJ, "*.jsonl")):
        sid = os.path.basename(p)[:-6]
        for line in open(p, encoding="utf-8", errors="replace"):
            try:
                d = json.loads(line)
            except Exception:
                continue
            if d.get("type") != "assistant":
                continue
            msg = d.get("message", {})
            u = msg.get("usage")
            if not u or "cache_read_input_tokens" not in u:
                continue
            try:
                t = datetime.datetime.fromisoformat(
                    d.get("timestamp", "").replace("Z", "+00:00")).astimezone(JST)
            except Exception:
                continue
            files = []
            for c in msg.get("content", []) or []:
                if isinstance(c, dict) and c.get("type") == "tool_use":
                    fp = (c.get("input") or {}).get("file_path")
                    if fp and c.get("name") in ("Read", "Grep"):
                        files.append(os.path.normcase(fp))
            msgs.append(dict(sid=sid, t=t, model=msg.get("model", ""), files=files,
                             read=u.get("cache_read_input_tokens", 0),
                             write=u.get("cache_creation_input_tokens", 0),
                             out=u.get("output_tokens", 0), cost=cost(u, msg.get("model", ""))))
    msgs.sort(key=lambda x: x["t"])
    return msgs


def compactions(seq):
    """文脈が半分未満へ急落した箇所＝圧縮。index のリストを返す。"""
    return [i for i in range(1, len(seq))
            if seq[i - 1]["read"] > 150_000 and 0 < seq[i]["read"] < seq[i - 1]["read"] * 0.5]


def main():
    # ⚠️ 境界は「日付」ではなく「設定を入れた時刻」。導入日の午前中に走った再開は
    #   まだ設定が無かったので、日付で切ると全部が『導入後』に落ちてベースラインが消える。
    since = datetime.datetime(2026, 8, 28, 15, 10, tzinfo=JST)
    if "--since" in sys.argv:
        s = sys.argv[sys.argv.index("--since") + 1]
        fmt = "%Y-%m-%d %H:%M" if " " in s else "%Y-%m-%d"
        since = datetime.datetime.strptime(s, fmt).replace(tzinfo=JST)

    wins = resume_windows()
    if not wins:
        print("⚠️ auto_resume.log に再開の記録がありません。まだ自動再開が走っていないようです。")
        return
    msgs = load_messages()

    def in_window(m):
        return any(m["sid"] == s and a <= m["t"] <= b for s, a, b in wins)

    auto = [m for m in msgs if in_window(m)]
    groups = {"導入前": [m for m in auto if m["t"] < since],
              "導入後": [m for m in auto if m["t"] >= since]}

    print(f"■ 対象: auto_resume が再開したセッションのみ（境界 {since:%Y-%m-%d}）\n")
    print("① 効いたか")
    print(f"  {'区分':8}{'msg':>7}{'平均文脈':>11}{'最大文脈':>11}{'平均出力':>10}{'$/msg':>9}{'合計$':>9}")
    for lab, v in groups.items():
        if not v:
            print(f"  {lab:8}{'(データなし)':>44}")
            continue
        n = len(v)
        print(f"  {lab:8}{n:7,}{sum(x['read'] for x in v)//n:11,}"
              f"{max(x['read'] for x in v):11,}{sum(x['out'] for x in v)//n:10,}"
              f"{sum(x['cost'] for x in v)/n:9.4f}{sum(x['cost'] for x in v):9.2f}")

    if groups["導入前"] and groups["導入後"]:
        a = sum(x["cost"] for x in groups["導入前"]) / len(groups["導入前"])
        b = sum(x["cost"] for x in groups["導入後"]) / len(groups["導入後"])
        print(f"\n  → 1メッセージあたり {100*(1-b/a):+.0f}% （⚠️プラスなら安くなった＝式は 1-後/前）")

        # ⚠️⚠️ 上の $/msg だけで判断してはいけない（2026-09-04 に実際に誤読しかけた）。
        #    素の $/msg には「使ったモデル」と「書いた量」が混ざる——実測では
        #    導入前が98%Sonnet($2/MTok)、導入後が99%Opus($5/MTok)で、しかも
        #    平均出力が638→2,588トークン（⑤解説の底上げ＝1問1万字超）になっていた。
        #    --autocompact が触れるのは文脈長だけなので、そこだけを分けて見る。
        def eff_in(v):   # 実効入力トークン/msg（読込0.1倍・書込2.0倍。モデル非依存）
            return sum(x["read"] * MULT["read"] + x["write"] * MULT["write"]
                       for x in v) / len(v)
        ea, eb = eff_in(groups["導入前"]), eff_in(groups["導入後"])
        print("\n  ⚠️ $/msg にはモデルと出力量が混ざる。文脈長だけを分けて見る:")
        for lab, v in groups.items():
            mix = collections.Counter(x["model"] for x in v).most_common(1)[0]
            print(f"     {lab:6} 実効入力tok/msg={eff_in(v):8,.0f}  "
                  f"出力tok/msg={sum(x['out'] for x in v)/len(v):6,.0f}  "
                  f"主モデル={mix[0]}({100*mix[1]//len(v)}%)")
        print(f"     → --autocompact が効く入力側だけなら {100*(1-eb/ea):+.0f}%"
              f" ＝これが①の判定に使う数字")

    print("\n② 損したか（圧縮の直後に前に読んだファイルを読み直していないか）")
    bysid = collections.defaultdict(list)
    for m in auto:
        bysid[m["sid"]].append(m)
    rows = []
    for sid, seq in bysid.items():
        for i in compactions(seq):
            before = set()
            for m in seq[:i]:
                before.update(m["files"])
            after, reread = 0, 0
            for m in seq[i:i + REWORK_N]:
                for f in m["files"]:
                    after += 1
                    if f in before:
                        reread += 1
            rows.append((seq[i]["t"], sid[:8], seq[i - 1]["read"], seq[i]["read"], after, reread))
    if not rows:
        print("  圧縮は1回も起きていません（＝この設定はまだ発火していない）。")
    else:
        print(f"  {'日時':17}{'session':9}{'圧縮':>18}{'直後の読込':>11}{'うち再読':>9}")
        for t, sid, pre, post, after, reread in sorted(rows):
            print(f"  {t:%m/%d %H:%M:%S}  {sid:9}{pre:>8,}→{post:<8,}{after:>11}{reread:>9}")
        tot_a = sum(r[4] for r in rows)
        tot_r = sum(r[5] for r in rows)
        pct = 100 * tot_r / tot_a if tot_a else 0
        # ⚠️ 分母が小さいと割合は意味を持たない（2件中2件で100%と出た前科がある）。
        if tot_a < 10:
            print(f"\n  → 読み込みが {tot_a} 件しかないので割合は評価しない（10件以上たまってから判断）")
        else:
            print(f"\n  → 圧縮直後{REWORK_N}メッセージの読み込み {tot_a} 件のうち {tot_r} 件が再読み（{pct:.0f}%）")

    print("""
■ 判断のしかた
  継続する : ①の「入力側だけ」が +15% 以上（＝15%以上安く）、かつ ②の再読みが 30% 未満
  様子見   : ①の「入力側だけ」が +15% 未満（400k では畳まれる回数が少なすぎる → 300000 を試す）
  撤回する : ②の再読みが 30% 以上、または体感で「同じ作業を繰り返している」
             → auto_resume.ps1 の $ClaudeArgs を @() に戻すだけ（他は触らない）
""")


if __name__ == "__main__":
    main()
