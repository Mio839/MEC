<#
MEC自動再開ツール（auto_resume.ps1）

上限で止まったセッションに、上限リセット後「続き」を送るだけのツール。

  上限で停止 → StopFailureフックが発火 → リセット時刻と本体PIDを解析してタスクを1本登録 → 終了
  リセット時刻 → 止まったままの旧プロセスを終了 → claude --resume <id> "続き" を起動 → 終了

使い方（通常はユーザーの操作は不要）:
  状態確認:   powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Status
  今すぐ再開: powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Resume -SessionId <ID>
  手動予約:   powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Arm -SessionId <ID> -At "23:02"
  解除:       powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Cancel

⚠️ 再開したウィンドウは --dangerously-skip-permissions で起動する（無人で進めるため）。
⚠️ 再開したウィンドウは --remote-control 付きで起動する（他マシンから届くように）。下の罠7を読むこと。

⚠️⚠️ 過去に踏んだ罠（消さないこと）:
  1) 状態ファイル（.auto_resume_state.json）は**持たない**。PSCustomObjectに存在しない
     プロパティを "." で代入すると SetValueInvocationException で即死し、ログ1行も残さず
     スクリプトごと落ちた（2026-08-28朝、05:52の再開がこれで消えた）。
     → session_id はタスクのコマンドラインに埋める。状態を持たなければ壊れる状態も無い。
  2) `schtasks /sc once` は **予定時刻にPCが寝ていたら永久に発火しない**（取りこぼしを拾い直さない）。
     → StartWhenAvailable（取りこぼし復帰）＋ WakeToRun（スリープ解除）で受ける。
       Register-ScheduledTask でないとこれらは設定できない。
     → -AtLogOn を -User 無しで作ると管理者権限が要る（Access is denied で丸ごと失敗する）。
  3) ネイティブexeのstderrをPowerShellが直接リダイレクトすると $ErrorActionPreference='Stop' 下で
     終端エラー化する（タスク未登録時の「見つかりません」が毎回クラッシュになる）。
     → schtasks の呼び出しは cmd.exe 越しに握りつぶす。
  4) レート制限の文言・reset時刻の書式はClaude Code非公開のため正規表現で推定検出している。
     捕まえられなかったら auto_resume.log の「フック生入力」を見て Parse-ResetTime を調整すること。
  5) --dangerously-skip-permissions は**初回だけ全画面の同意ダイアログ**を出す（"Yes, I accept"）。
     無人の再開ウィンドウでは誰も Enter を押さないのでそこで止まり、リセット枠を丸ごと落とす
     （2026-08-28 18:02 に発生）。同意は ~/.claude/settings.json の
     skipDangerousModePermissionPrompt に記録される（claude本体は userSettings / localSettings /
     flagSettings / policySettings のどれかに true があればダイアログを出さない）。
     → Start-Resume が起動直前に Ensure-BypassAccepted で立っていることを確かめ、無ければ立てる。
  6) 上限で止まった claude.exe は**終了せずプロンプトに戻って生き続ける**。放っておくと同じ会話に
     プロセスが2つ並び、**Remote Control の権利を旧プロセスが握ったまま**になる（RCは会話ごとに
     1プロセスの排他）。2026-09-01 に実際に発生——13:02 の再開ウィンドウに
     「another Claude Code on this machine (started 4h ago) already has Remote Control」が出た。
     → Start-Resume が起動前に Stop-OldSession で旧プロセスを終了させる。
     ⚠️ 3分ガード（人が操作中なら見送り）を**必ず先に**通すこと。人が使っている窓を殺さないため。
     ⚠️ PIDは上限ヒット時にフックが記録し、タスクのコマンドラインへ埋める（罠1と同じ理由で
        状態ファイルは持たない）。**数時間空くのでPIDは再利用されうる**＝起動時刻(FileTime)も
        一緒に埋めて、名前と起動時刻の両方が一致した時だけ終了させる。
  7) **Remote Control セッションは ~/.claude/sessions/<pid>.json を書かない**（<pid>.<hash>.key
     だけ書く）。対話セッションは両方書く。2026-09-01 に実測（rc-probe で確認）。
     → session_id → PID の逆引きをこのレジストリに頼れない＝フックが先祖を辿って拾うのが本命で、
       レジストリはフォールバックにすぎない。
     → 再開後の接続確認もこの形（key有り・json無し）を手がかりにしているが、**非公開の挙動なので
       形が変われば黙って外れる**。外れても再開は止めず、ログに1行残すだけにすること。

⚠️ トークンを食っているのはこのスクリプトではなく再開先のセッション（実測 341ターン×
   平均326kトークンで $25.92／1回）。自動再開が通常セッションより多く食っている事実は無い
   （文脈長を揃えると書込も出力も自動再開のほうが少ない）。効くのは $ClaudeArgs だけ。
#>

param(
    [switch]$FromHook,
    [switch]$Resume,
    [switch]$Arm,
    [switch]$Cancel,
    [switch]$Status,
    [string]$SessionId,
    [string]$At,
    # 罠6: 上限で止まったまま生きている claude.exe。起動時刻(FileTime)とセットでのみ信用する。
    [int]$OldPid = 0,
    [string]$OldStart
)

$ErrorActionPreference = 'Stop'
$RepoRoot  = Split-Path -Parent $PSScriptRoot
$LogFile   = Join-Path $PSScriptRoot 'auto_resume.log'
$TaskName  = 'MEC_AutoResume'
$ClaudeExe = 'claude'
# ⚠️ 2026-08-28 導入・試用中。継続するかは `python _work/autocompact_review.py` で判断する。
#   既定の 'auto' は contextWindow=1M のため341ターン回しても一度も圧縮せず、文脈が
#   195k→444k と伸び続けていた（実測）。400k で1回だけ畳む見込み＝推定 -28%。
#   撤回するときはこの行を @() に戻すだけ（他はどこも触らない）。
$ClaudeArgs = @('--autocompact','400000')
$ResumePrompt = '続きから再開してください。まず何をどこまでやったかを自分で確認し、確認の質問はせず、判断が要る箇所は妥当な既定を選んで進めてください。'

function Write-Log {
    param([string]$Msg)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg
    # ログが太ると毎フックの追記が重くなるので512KBで頭を捨てる
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 512KB)) {
        Set-Content -Path $LogFile -Value (Get-Content $LogFile -Tail 200 -Encoding UTF8) -Encoding UTF8
    }
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Parse-ResetTime {
    param([string]$Text)
    $now = Get-Date
    # 分は省略されることがある（実測: "resets 7pm (Asia/Tokyo)" ← コロン無し）。
    # タイムゾーン注記 "(Asia/Tokyo)" はこのマシンのロケールと一致する前提でローカル時刻として解釈する。
    $timeToken = '(\d{1,2})(?::(\d{2}))?\s*([ap]m)'

    # 例: "resets 2026-08-09 00:00 UTC"
    if ($Text -match 'resets\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*(UTC)?') {
        $dt = [datetime]::Parse("$($Matches[1]) $($Matches[2])")
        if ($Matches[3] -eq 'UTC') { $dt = [datetime]::SpecifyKind($dt, [DateTimeKind]::Utc).ToLocalTime() }
        return $dt
    }

    # 例: "resets Mon 12:00am" / "resets Mon 7pm"（週次・分省略あり）
    if ($Text -match "resets\s+([A-Za-z]{3})\s+$timeToken") {
        $dayName = $Matches[1]
        $hour = [int]$Matches[2]
        $min  = if ($Matches[3]) { [int]$Matches[3] } else { 0 }
        if ($Matches[4] -eq 'pm' -and $hour -ne 12) { $hour += 12 }
        if ($Matches[4] -eq 'am' -and $hour -eq 12) { $hour = 0 }
        $targetDow = [array]::IndexOf(@('Sun','Mon','Tue','Wed','Thu','Fri','Sat'), $dayName)
        for ($i = 0; $i -le 7; $i++) {
            $cand = $now.Date.AddDays($i)
            if ([int]$cand.DayOfWeek -eq $targetDow) {
                $result = $cand.AddHours($hour).AddMinutes($min)
                if ($result -gt $now) { return $result }
            }
        }
        return $now.AddDays(7)
    }

    # 例: "resets 3:45pm" / "resets 7pm"（当日 or 翌日・分省略あり）
    if ($Text -match "resets\s+$timeToken") {
        $hour = [int]$Matches[1]
        $min  = if ($Matches[2]) { [int]$Matches[2] } else { 0 }
        if ($Matches[3] -eq 'pm' -and $hour -ne 12) { $hour += 12 }
        if ($Matches[3] -eq 'am' -and $hour -eq 12) { $hour = 0 }
        $result = $now.Date.AddHours($hour).AddMinutes($min)
        if ($result -le $now) { $result = $result.AddDays(1) }
        return $result
    }

    return $null
}

function Remove-Task {
    # ⚠️ 罠3: schtasks のstderrを直接受けると終端エラー化するので cmd.exe 越しに握りつぶす。
    cmd /c "schtasks /delete /tn `"$TaskName`" /f >nul 2>&1"
}

function Register-Task {
    param([datetime]$When, [string]$SessId, [int]$OldPid = 0, [string]$OldStart)
    Remove-Task
    $argLine = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Resume -SessionId $SessId"
    # 罠6: 旧プロセスの素性もコマンドラインに埋める（状態ファイルは持たない＝罠1）。
    if ($OldPid -gt 0 -and $OldStart) { $argLine += " -OldPid $OldPid -OldStart $OldStart" }
    try {
        # ⚠️ 罠2: StartWhenAvailable=取りこぼし復帰 / WakeToRun=スリープ解除。
        #   -AtLogOn は -User を必ず付ける（無しだと管理者権限が要り Access is denied で全体が失敗する）。
        $me      = "$env:USERDOMAIN\$env:USERNAME"
        $tLogon  = New-ScheduledTaskTrigger -AtLogOn -User $me
        $tLogon.Delay = 'PT2M'
        Register-ScheduledTask -TaskName $TaskName -Force -ErrorAction Stop `
            -Action    (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argLine -WorkingDirectory $RepoRoot) `
            -Trigger   @((New-ScheduledTaskTrigger -Once -At $When), $tLogon) `
            -Settings  (New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries `
                            -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero)) `
            -Principal (New-ScheduledTaskPrincipal -UserId $me -LogonType Interactive -RunLevel Limited) | Out-Null
        Write-Log "再開を予約: $When （session_id=$SessId／取りこぼし復帰・スリープ解除・ログオン点検つき）"
    } catch {
        Write-Log "⚠️ Register-ScheduledTask に失敗（$_）。schtasks へ落とします（取りこぼし復帰は効きません）。"
        schtasks /create /tn $TaskName /tr "powershell.exe $argLine" /sc once `
                 /st $When.ToString('HH:mm') /sd $When.ToString('yyyy/MM/dd') /f | Out-Null
        Write-Log "再開を予約(schtasks): $When （session_id=$SessId）"
    }
}

function Ensure-BypassAccepted {
    # ⚠️⚠️ --dangerously-skip-permissions は初回だけ全画面の同意ダイアログ（"Yes, I accept"）を出す。
    #   無人の再開ウィンドウでは誰も Enter を押さないのでそこで止まり、その回のリセット枠を
    #   丸ごと落とす（2026-08-28 18:02 に実際に発生）。同意は
    #   ~/.claude/settings.json の skipDangerousModePermissionPrompt に記録されるので、
    #   起動直前に立っていることを確かめ、無ければ立てる（一度ユーザーが受諾した同意の
    #   再宣言。claude 本体の更新でフラグが落ちてもここで自己修復する）。
    # ⚠️ JSONの往復（ConvertFrom/To-Json）はしない。settings.json は hooks を抱えていて整形が
    #   丸ごと変わるし、Set-Content -Encoding UTF8 は BOM を付けて JSON.parse を壊す。
    $f = Join-Path $env:USERPROFILE '.claude\settings.json'
    try {
        if (-not (Test-Path $f)) { return }
        $raw = [System.IO.File]::ReadAllText($f)
        if ($raw -match '"skipDangerousModePermissionPrompt"\s*:\s*true') { return }
        Copy-Item $f "$f.bak" -Force
        if ($raw -match '"skipDangerousModePermissionPrompt"\s*:\s*false') {
            $new = $raw -replace '("skipDangerousModePermissionPrompt"\s*:\s*)false', '${1}true'
        } else {
            # \A ＝文字列の先頭だけ（^ と違い1箇所しか当たらない）。最初の { の直後に1行差し込む。
            $new = [regex]::Replace($raw, '\A\s*\{', "{`r`n  `"skipDangerousModePermissionPrompt`": true,")
        }
        if ($new -eq $raw) { Write-Log '⚠️ 同意フラグを入れられませんでした（settings.json の形が想定外）。'; return }
        [System.IO.File]::WriteAllText($f, $new, (New-Object System.Text.UTF8Encoding($false)))
        Write-Log '同意フラグ skipDangerousModePermissionPrompt を立てました（再開が同意ダイアログで止まらないように）。'
    } catch {
        Write-Log "⚠️ 同意フラグの確認に失敗（$_）。再開ウィンドウがダイアログで止まる可能性があります。"
    }
}

function Get-ClaudeAncestorPid {
    # StopFailureフックは claude.exe の子として走るので、先祖を辿れば本体が取れる。
    # ⚠️ 罠7: Remote Control セッションは sessions\<pid>.json を書かないので、
    #    session_id からの逆引きはこの経路でしか成立しない。ここが本命。
    $cur = $PID
    for ($i = 0; $i -lt 8 -and $cur -gt 0; $i++) {
        $p = Get-CimInstance Win32_Process -Filter "ProcessId=$cur" -ErrorAction SilentlyContinue
        if (-not $p) { return $null }
        if ($p.Name -eq 'claude.exe') { return $p }
        $cur = [int]$p.ParentProcessId
    }
    return $null
}

function Find-SessionPid {
    # フォールバック。対話セッションだけが ~/.claude/sessions/<pid>.json に session_id を書く
    # （罠7＝Remote Control セッションはここに載らない）。
    param([string]$SessId)
    $dir = Join-Path $env:USERPROFILE '.claude\sessions'
    if (-not (Test-Path $dir)) { return 0 }
    foreach ($f in (Get-ChildItem "$dir\*.json" -ErrorAction SilentlyContinue)) {
        try { $o = Get-Content $f.FullName -Raw -ErrorAction Stop | ConvertFrom-Json } catch { continue }
        if ($o.sessionId -eq $SessId -and $o.pid) { return [int]$o.pid }
    }
    return 0
}

function Stop-OldSession {
    # 罠6: 上限で止まった claude.exe は生き続け、Remote Control の権利を握ったままになる。
    # ⚠️ 呼ぶ前に「人が操作中」ガードを通すこと（Start-Resume が先に見ている）。
    param([int]$OldPid, [string]$OldStart, [string]$SessId)

    $target = 0
    if ($OldPid -gt 0) {
        $c = Get-CimInstance Win32_Process -Filter "ProcessId=$OldPid" -ErrorAction SilentlyContinue
        if (-not $c) {
            Write-Log "旧プロセス PID $OldPid は既に終了しています。"
        } elseif ($c.Name -ne 'claude.exe') {
            Write-Log "⚠️ PID $OldPid は claude.exe ではありません（$($c.Name)）。終了しません。"
        } elseif ($OldStart) {
            # ⚠️ 上限ヒットから数時間空くのでPIDは再利用されうる。起動時刻が一致した時だけ殺す。
            #   FileTime とのサブ秒差は必ず出るので2秒の許容を置く（2026-09-01 実測）。
            $want = [datetime]::FromFileTime([int64]$OldStart)
            if ([Math]::Abs(($c.CreationDate - $want).TotalSeconds) -le 2) { $target = $OldPid }
            else { Write-Log "⚠️ PID $OldPid は再利用されています（起動 $($c.CreationDate) ≠ 記録 $want）。終了しません。" }
        } else { $target = $OldPid }
    }
    if ($target -eq 0 -and $SessId) {
        $alt = Find-SessionPid $SessId
        if ($alt -gt 0) { Write-Log "レジストリから旧プロセスを特定: PID $alt"; $target = $alt }
    }
    if ($target -eq 0) { return }

    try {
        $h = Get-Process -Id $target -ErrorAction Stop
        try { $null = $h.CloseMainWindow() } catch { }
        if (-not $h.WaitForExit(4000)) {
            Stop-Process -Id $target -Force -ErrorAction SilentlyContinue
            $null = $h.WaitForExit(4000)
        }
        if (Get-Process -Id $target -ErrorAction SilentlyContinue) {
            Write-Log "⚠️ 旧プロセス PID $target を終了できませんでした。Remote Control が奪えない可能性があります。"
        } else {
            Write-Log "旧プロセス PID $target を終了しました（Remote Control の権利を解放）。"
        }
    } catch {
        Write-Log "⚠️ 旧プロセスの終了に失敗（$_）。再開は続行します。"
    }
}

function Confirm-Resumed {
    # 再開が本当に立ち上がったか、Remote Control に繋がったかをログへ残す。
    # ⚠️ ここで失敗しても再開そのものは止めない（判定は罠7の非公開挙動に依存する）。
    param([string]$SessId, [datetime]$Since)

    $proc = $null
    for ($i = 0; $i -lt 40; $i++) {
        $proc = Get-CimInstance Win32_Process -Filter "Name='claude.exe'" -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -like "*$SessId*" -and $_.CreationDate -ge $Since } |
                Select-Object -First 1
        if ($proc) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $proc) { Write-Log '⚠️ 再開プロセスを確認できませんでした（起動に失敗した可能性）。'; return }
    Write-Log "再開プロセスを確認: PID $($proc.ProcessId)"

    # ⚠️ 罠7の逆引き: Remote Control は <pid>.<hash>.key だけを書き <pid>.json を書かない。
    #   対話のまま（＝RC未接続）なら .json が2秒ほどで現れる。15秒見て判定する。
    $dir = Join-Path $env:USERPROFILE '.claude\sessions'
    $p   = $proc.ProcessId
    for ($i = 0; $i -lt 30; $i++) {
        if (Test-Path (Join-Path $dir "$p.json")) {
            Write-Log '⚠️ 再開セッションは対話として登録されました＝Remote Control 未接続の可能性。手元で /remote-control を確認してください。'
            return
        }
        if (Get-ChildItem "$dir\$p.*.key" -ErrorAction SilentlyContinue) {
            Write-Log 'Remote Control に接続したと判定しました（key のみ・json 無し）。'
            return
        }
        Start-Sleep -Milliseconds 500
    }
    Write-Log '⚠️ Remote Control の接続を確認できませんでした（レジストリに痕跡なし）。'
}

function Start-Resume {
    param([string]$SessId, [int]$OldPid = 0, [string]$OldStart)
    # ⚠️ 人が同じセッションを触っている最中に開くと、同じtranscriptを2つのClaudeが書く。
    #   Claudeのプロジェクトディレクトリ名はパスの非英数字を '-' に潰したもの。
    $tp = Join-Path $env:USERPROFILE (".claude\projects\" + ($RepoRoot -replace '[:\\/_.]', '-') + "\$SessId.jsonl")
    if ((Test-Path $tp) -and (((Get-Date) - (Get-Item $tp).LastWriteTime).TotalMinutes -lt 3)) {
        Write-Log '会話が3分以内に動いています（人が操作中）。再開を見送ります。'
        return
    }
    Remove-Task
    # 罠6: 3分ガードを抜けた＝誰も触っていない。ここで旧プロセスを退かす。
    Stop-OldSession -OldPid $OldPid -OldStart $OldStart -SessId $SessId
    Ensure-BypassAccepted

    $exe = (Get-Command $ClaudeExe -ErrorAction SilentlyContinue).Source
    if (-not $exe) { $exe = $ClaudeExe }
    # プロンプトはコマンドラインに載るので、引用符と ;（Windows Terminalの区切り）を除く
    $safe = ($ResumePrompt -replace '"', '') -replace ';', '、'
    # ⚠️ --remote-control は「省略可能な名前」を取るので、**プロンプトの直前に置かないこと**
    #   （次のトークンを名前として食う）。後ろが必ず - で始まるこの位置なら食わない。2026-09-01 実測。
    $tail = ((@('--resume', $SessId, '--remote-control', '--dangerously-skip-permissions') + $ClaudeArgs) -join ' ')

    $since = Get-Date
    $wt = (Get-Command wt.exe -ErrorAction SilentlyContinue).Source
    if ($wt) {
        Start-Process -FilePath $wt -ArgumentList "-d `"$RepoRoot`" `"$exe`" $tail `"$safe`"" -WindowStyle Normal | Out-Null
        Write-Log "Windows Terminal で再開: $SessId"
    } else {
        Start-Process -FilePath $exe -ArgumentList "$tail `"$safe`"" -WorkingDirectory $RepoRoot -WindowStyle Normal | Out-Null
        Write-Log "コンソールで再開: $SessId"
    }
    Confirm-Resumed $SessId $since
}

# ───────────────────────────── エントリポイント ─────────────────────────────
# ⚠️ 例外を握らずに落ちると「ログ1行も残さず無言で死ぬ」。落ちた事実だけは必ず残す。
try {
    if ($FromHook) {
        # StopFailureフックから呼ばれる。ここでは claude を起動せず、予約だけしてすぐ返す
        # （フックの timeout 15秒の予算内で終える）。
        $raw = [Console]::In.ReadToEnd()
        # ⚠️ JSONスキーマは非公開で、error_type が空だった前科がある（2026-08-27）。
        #   次回スキーマが変わっても手がかりが残るよう生入力を全文残す。
        Write-Log "フック生入力: $raw"

        # ⚠️ matcher に頼らない。文言が変わってもフックが素通りしないよう判定はここで行う。
        if ($raw -notmatch 'hit your \S+ limit|usage limit|\brate limit\b|rate_limit') {
            Write-Log 'レート制限以外の停止です。何もしません。'
            exit 0
        }

        # session_id はキー名の揺れに備えて生テキストから拾う。
        # 取れなければ transcript_path のファイル名（＝session_id）で代替する。
        $sess = $null
        if ($raw -match '"session_?[Ii][dD]"\s*:\s*"([0-9a-fA-F-]{8,})"') { $sess = $Matches[1] }
        elseif ($raw -match '"transcript_path"\s*:\s*"([^"]+)"') {
            $sess = [System.IO.Path]::GetFileNameWithoutExtension(($Matches[1] -replace '\\\\', '\'))
        }
        if (-not $sess) { Write-Log '❌ session_id を抽出できませんでした。生入力をログで確認してください。'; exit 0 }

        $when = Parse-ResetTime $raw
        if (-not $when) {
            Write-Log '⚠️ リセット時刻を解析できませんでした。暫定で1時間後にします。'
            $when = (Get-Date).AddHours(1)
        }
        # 罠6: 上限で止まった本体は生き続けるので、今のうちにPIDと起動時刻を控える
        #   （リセットまで数時間空くのでPIDだけでは足りない＝再利用の見分けに起動時刻が要る）。
        $op = 0; $os = ''
        $anc = Get-ClaudeAncestorPid
        if ($anc) {
            $op = [int]$anc.ProcessId
            $os = $anc.CreationDate.ToFileTime().ToString()
            Write-Log "上限ヒットを検知（session_id=$sess／本体 PID $op 起動 $($anc.CreationDate)）。"
        } else {
            Write-Log "上限ヒットを検知（session_id=$sess）。⚠️ 本体PIDを辿れませんでした（旧プロセスはレジストリ経由で探します）。"
        }
        # 同じ上限ヒットで本体＋サブエージェントから複数回呼ばれる（実測2回）。
        # 同名タスクを登録し直すだけなので害はない。
        Register-Task $when.AddMinutes(2) $sess $op $os
        exit 0
    }

    if ($Cancel) { Remove-Task; Write-Log '自動再開を解除しました。'; exit 0 }

    if ($Status) {
        $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if (-not $t) { Write-Host "→ タスク $TaskName は登録されていません（再開待ちなし）。"; exit 0 }
        $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
        Write-Host "→ 状態=$($t.State) 次回=$($info.NextRunTime) 前回=$($info.LastRunTime) 結果=$($info.LastTaskResult)"
        # ⚠️ 引数には -OldPid / -OldStart も並ぶので、素の分割で末尾を取ると混ざる。
        $args0 = $t.Actions[0].Arguments
        $sid = ''; if ($args0 -match '-SessionId\s+(\S+)') { $sid = $Matches[1] }
        Write-Host "→ 対象: $sid"
        if ($args0 -match '-OldPid\s+(\d+)') {
            $op = [int]$Matches[1]
            $alive = Get-CimInstance Win32_Process -Filter "ProcessId=$op" -ErrorAction SilentlyContinue
            if ($alive -and $alive.Name -eq 'claude.exe') { Write-Host "→ 旧プロセス: PID $op 稼働中（再開時に終了させます）" }
            else { Write-Host "→ 旧プロセス: PID $op は既に終了" }
        } else {
            Write-Host '→ 旧プロセス: 記録なし（レジストリから探します）'
        }
        exit 0
    }

    if ($Arm) {
        if (-not $SessionId) { Write-Log '❌ -Arm には -SessionId が必要です。'; exit 1 }
        $when = if ($At) { [datetime]::Parse($At) } else { (Get-Date).AddHours(1) }
        if ($when -le (Get-Date)) { $when = $when.AddDays(1) }
        Register-Task $when $SessionId $OldPid $OldStart
        exit 0
    }

    if ($Resume) {
        if (-not $SessionId) { Write-Log '❌ -Resume には -SessionId が必要です。'; exit 1 }
        Start-Resume $SessionId $OldPid $OldStart
        exit 0
    }

    Write-Host '使い方:'
    Write-Host '  状態確認:   auto_resume.ps1 -Status'
    Write-Host '  今すぐ再開: auto_resume.ps1 -Resume -SessionId <ID>'
    Write-Host '  手動予約:   auto_resume.ps1 -Arm -SessionId <ID> -At "23:02"'
    Write-Host '  解除:       auto_resume.ps1 -Cancel'
} catch {
    Write-Log "❌ 予期しないエラーで停止: $($_.Exception.Message)"
    Write-Log "   位置: $($_.InvocationInfo.ScriptLineNumber) 行目 / $($_.InvocationInfo.Line.Trim())"
    exit 1
}
