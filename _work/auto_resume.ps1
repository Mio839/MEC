<#
MEC自動再開ツール（auto_resume.ps1）

上限で止まったセッションに、上限リセット後「続き」を送るだけのツール。

  上限で停止 → StopFailureフックが発火 → リセット時刻を解析してタスクを1本登録 → 終了
  リセット時刻 → claude --resume <id> "続き" を新しいウィンドウで起動 → 終了

使い方（通常はユーザーの操作は不要）:
  状態確認:   powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Status
  今すぐ再開: powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Resume -SessionId <ID>
  手動予約:   powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Arm -SessionId <ID> -At "23:02"
  解除:       powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Cancel

⚠️ 再開したウィンドウは --dangerously-skip-permissions で起動する（無人で進めるため）。

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
    [string]$At
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
    param([datetime]$When, [string]$SessId)
    Remove-Task
    $argLine = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Resume -SessionId $SessId"
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

function Start-Resume {
    param([string]$SessId)
    # ⚠️ 人が同じセッションを触っている最中に開くと、同じtranscriptを2つのClaudeが書く。
    #   Claudeのプロジェクトディレクトリ名はパスの非英数字を '-' に潰したもの。
    $tp = Join-Path $env:USERPROFILE (".claude\projects\" + ($RepoRoot -replace '[:\\/_.]', '-') + "\$SessId.jsonl")
    if ((Test-Path $tp) -and (((Get-Date) - (Get-Item $tp).LastWriteTime).TotalMinutes -lt 3)) {
        Write-Log '会話が3分以内に動いています（人が操作中）。再開を見送ります。'
        return
    }
    Remove-Task
    Ensure-BypassAccepted

    $exe = (Get-Command $ClaudeExe -ErrorAction SilentlyContinue).Source
    if (-not $exe) { $exe = $ClaudeExe }
    # プロンプトはコマンドラインに載るので、引用符と ;（Windows Terminalの区切り）を除く
    $safe = ($ResumePrompt -replace '"', '') -replace ';', '、'
    $tail = ((@('--resume', $SessId, '--dangerously-skip-permissions') + $ClaudeArgs) -join ' ')

    $wt = (Get-Command wt.exe -ErrorAction SilentlyContinue).Source
    if ($wt) {
        Start-Process -FilePath $wt -ArgumentList "-d `"$RepoRoot`" `"$exe`" $tail `"$safe`"" -WindowStyle Normal | Out-Null
        Write-Log "Windows Terminal で再開: $SessId"
    } else {
        Start-Process -FilePath $exe -ArgumentList "$tail `"$safe`"" -WorkingDirectory $RepoRoot -WindowStyle Normal | Out-Null
        Write-Log "コンソールで再開: $SessId"
    }
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
        Write-Log "上限ヒットを検知（session_id=$sess）。"
        # 同じ上限ヒットで本体＋サブエージェントから複数回呼ばれる（実測2回）。
        # 同名タスクを登録し直すだけなので害はない。
        Register-Task $when.AddMinutes(2) $sess
        exit 0
    }

    if ($Cancel) { Remove-Task; Write-Log '自動再開を解除しました。'; exit 0 }

    if ($Status) {
        $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if (-not $t) { Write-Host "→ タスク $TaskName は登録されていません（再開待ちなし）。"; exit 0 }
        $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
        Write-Host "→ 状態=$($t.State) 次回=$($info.NextRunTime) 前回=$($info.LastRunTime) 結果=$($info.LastTaskResult)"
        Write-Host "→ 対象: $(($t.Actions[0].Arguments -split '-SessionId ')[-1])"
        exit 0
    }

    if ($Arm) {
        if (-not $SessionId) { Write-Log '❌ -Arm には -SessionId が必要です。'; exit 1 }
        $when = if ($At) { [datetime]::Parse($At) } else { (Get-Date).AddHours(1) }
        if ($when -le (Get-Date)) { $when = $when.AddDays(1) }
        Register-Task $when $SessionId
        exit 0
    }

    if ($Resume) {
        if (-not $SessionId) { Write-Log '❌ -Resume には -SessionId が必要です。'; exit 1 }
        Start-Resume $SessionId
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
