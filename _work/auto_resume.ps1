<#
MEC自動再開ツール（auto_resume.ps1）

Claude Codeが使用上限（session/weekly limit）に達して停止したとき、
上限がリセットされる時刻にWindowsタスクスケジューラで自動的に
`claude --resume` を実行し、中断していたタスクを無人で続行させる。

使い方:
  新規タスクを無人で開始:
    powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Start "<タスクの指示文>"

  ⚠️ 対話セッション（通常のclaude起動）が使用上限で止まった場合は手動操作は不要。
  .claude\settings.json の StopFailure フック（matcher: rate_limit）が自動的に
  このスクリプトを -FromHook 付きで呼び出し、session_idを検知してリセット時刻に
  自動再開を登録する。ユーザーは何もしなくてよい。

  （フックが未設定・失敗した場合の手動フォールバック）
    claude --resume  （引数なしで一覧表示 → 該当セッションIDを控える）
    powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Start "続けて" -SessionId <そのID>

  状態確認:
    powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Status

  解除（スケジュール済みタスクと状態ファイルを削除）:
    powershell -ExecutionPolicy Bypass -File _work\auto_resume.ps1 -Cancel

  ※ -Resume と -FromHook はそれぞれタスクスケジューラ／Claude Codeフックから
    内部的に呼ばれる。手で叩く必要はない。

⚠️ --dangerously-skip-permissions で実行する（無人実行のため全ツール呼び出しを確認なしで承認）。
   このリポジトリ専用として作った。他のリポジトリで使い回さないこと。
⚠️ レート制限時のメッセージ文言・reset時刻の書式はClaude Code非公開のため正規表現で推定検出している。
   初回に実際の上限到達で捕まえられなかったら auto_resume.log を見て Parse-ResetTime / Test-RateLimited を調整すること。
⚠️ Windowsタスクスケジューラは既定で「ユーザーがログオンしているときのみ実行」。
   PCがスリープ・シャットダウンしていると発火しない。
#>

param(
    [string]$Start,
    [string]$SessionId,
    [switch]$Resume,
    [switch]$Status,
    [switch]$Cancel,
    [switch]$FromHook
)

$ErrorActionPreference = 'Stop'
$RepoRoot  = Split-Path -Parent $PSScriptRoot
$StateFile = Join-Path $PSScriptRoot '.auto_resume_state.json'
$LogFile   = Join-Path $PSScriptRoot 'auto_resume.log'
$TaskName  = 'MEC_AutoResume'
$ClaudeExe = 'claude'   # PATH上のclaudeを使う。見つからなければフルパスに書き換える

function Write-Log {
    param([string]$Msg)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Show-ResumeToast {
    # 音（beep_stop_hook.ps1等）だけでは「レート制限で止まっていたセッションを
    # 自動再開した」という具体的な内容が伝わらず、気づけないという指摘（2026-08-28）
    # を受けて追加。Windows標準のトースト通知（追加モジュール不要・非ブロッキング）。
    # 失敗しても再開処理自体は止めない（ログにだけ残す）。
    param([string]$Title, [string]$Message)
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $texts = $template.GetElementsByTagName('text')
        [void]$texts.Item(0).AppendChild($template.CreateTextNode($Title))
        [void]$texts.Item(1).AppendChild($template.CreateTextNode($Message))
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Windows PowerShell').Show($toast)
    } catch {
        Write-Log "⚠️ トースト通知に失敗（$_）。処理は続行します。"
    }
}

function Load-State {
    if (Test-Path $StateFile) {
        return Get-Content $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
    }
    return $null
}

function Save-State {
    param($StateObj)
    $StateObj | ConvertTo-Json -Depth 5 | Set-Content -Path $StateFile -Encoding UTF8
}

function Remove-ScheduledResume {
    # ネイティブexeのstderrをPowerShellが直接リダイレクトすると
    # $ErrorActionPreference='Stop' 下で終端エラー化する（タスク未登録時の
    # 「見つかりません」を毎回クラッシュにしてしまう）ため、cmd.exe越しに
    # 完全に握りつぶす。
    cmd /c "schtasks /delete /tn `"$TaskName`" /f >nul 2>&1"
}

function Register-ScheduledResume {
    param([datetime]$When)
    Remove-ScheduledResume
    $scriptPath = $PSCommandPath
    $st = $When.ToString('HH:mm')
    $sd = $When.ToString('yyyy/MM/dd')  # schtasksの/sdはこのマシン(日本語ロケール)ではyyyy/MM/dd形式
    $action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Resume"
    schtasks /create /tn $TaskName /tr $action /sc once /st $st /sd $sd /f | Out-Null
    Write-Log "再開タスクを登録: $When （タスク名 $TaskName）"
}

function Parse-ResetTime {
    param([string]$Text)
    $now = Get-Date
    # 分は省略されることがある（実測: "resets 7pm (Asia/Tokyo)" ← コロン無し）。
    # タイムゾーン注記 "(Asia/Tokyo)" は末尾に付くことがあるが、このマシンの
    # ロケール(Asia/Tokyo)と一致する前提でローカル時刻としてそのまま解釈する。
    $timeToken = '(\d{1,2})(?::(\d{2}))?\s*([ap]m)'

    # 例: "resets 2026-08-09 00:00 UTC"
    if ($Text -match 'resets\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*(UTC)?') {
        $dt = [datetime]::Parse("$($Matches[1]) $($Matches[2])")
        if ($Matches[3] -eq 'UTC') {
            $dt = [datetime]::SpecifyKind($dt, [DateTimeKind]::Utc).ToLocalTime()
        }
        return $dt
    }

    # 例: "resets Mon 12:00am" / "resets Mon 7pm"（週次・分省略あり）
    if ($Text -match "resets\s+([A-Za-z]{3})\s+$timeToken") {
        $dayName = $Matches[1]
        $hour = [int]$Matches[2]
        $min = if ($Matches[3]) { [int]$Matches[3] } else { 0 }
        $ampm = $Matches[4]
        if ($ampm -eq 'pm' -and $hour -ne 12) { $hour += 12 }
        if ($ampm -eq 'am' -and $hour -eq 12) { $hour = 0 }
        $days = @('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')
        $targetDow = [array]::IndexOf($days, $dayName)
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
        $min = if ($Matches[2]) { [int]$Matches[2] } else { 0 }
        $ampm = $Matches[3]
        if ($ampm -eq 'pm' -and $hour -ne 12) { $hour += 12 }
        if ($ampm -eq 'am' -and $hour -eq 12) { $hour = 0 }
        $result = $now.Date.AddHours($hour).AddMinutes($min)
        if ($result -le $now) { $result = $result.AddDays(1) }
        return $result
    }

    return $null
}

function Test-RateLimited {
    param([string]$Text)
    return ($Text -match "hit your \S+ limit") -or ($Text -match 'usage limit') -or ($Text -match '\brate limit\b')
}

function Invoke-ClaudeTurn {
    param([string]$Prompt, [string]$SessId)
    $argsList = @('-p', '--output-format', 'json', '--dangerously-skip-permissions')
    if ($SessId) { $argsList += @('--resume', $SessId) }
    $argsList += $Prompt

    Push-Location $RepoRoot
    try {
        $output = & $ClaudeExe @argsList 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    return [pscustomobject]@{ Output = $output; ExitCode = $exitCode }
}

function Handle-Turn {
    param([string]$Prompt, [string]$SessId, [switch]$IsAutoResume)

    $startLabel = if ($SessId) { "resume=$SessId" } else { '新規セッション' }
    Write-Log "Claude起動: $startLabel"

    if ($IsAutoResume) {
        Show-ResumeToast -Title '🔄 MEC自動再開' -Message "レート制限で止まっていたセッションを再開しました（session=$($SessId.Substring(0,8))…）。バックグラウンドで作業を続けます。"
    }

    # ⚠️ ここで status を 'running' に更新しないと、-Status は claude -p が
    # 完了するまで（数十分〜1時間規模になりうる）ずっと 'waiting' のまま表示され、
    # 「動いていない」と誤認する原因になる（2026-08-28 に実測で発覚）。
    # このプロセス自身のPIDも記録し、-Status が生死を裏取りできるようにする。
    #
    # ⚠️⚠️ PSCustomObject（ConvertFrom-Jsonの戻り値）は、既存プロパティへの代入は
    # 通常の "." 代入でよいが、"存在しないプロパティへの代入" は
    # SetValueInvocationException を投げて$ErrorActionPreference='Stop'下で
    # スクリプト全体を即死させる（2026-08-28に実機で確認：runner_pid/run_startedは
    # 元のJSONスキーマに無いプロパティで、代入した瞬間にHandle-Turnがクラッシュし、
    # claude起動どころか"終了コード"ログも一切出さずに落ちていた＝6時間何も動いていない
    # ように見えた真因）。新規プロパティは必ず Add-Member -Force で追加すること。
    $runningState = Load-State
    if ($runningState) {
        $runningState.status     = 'running'
        $runningState.session_id = $SessId
        $runningState | Add-Member -Force -NotePropertyName 'runner_pid' -NotePropertyValue $PID
        $runningState | Add-Member -Force -NotePropertyName 'run_started' -NotePropertyValue (Get-Date).ToString('o')
        Save-State $runningState
    }

    $r = Invoke-ClaudeTurn -Prompt $Prompt -SessId $SessId
    Write-Log "終了コード: $($r.ExitCode)"
    Add-Content -Path $LogFile -Value $r.Output -Encoding UTF8

    $parsed = $null
    try { $parsed = $r.Output | ConvertFrom-Json } catch {}

    $resultText   = if ($parsed -and $parsed.result) { $parsed.result } else { $r.Output }
    $newSessionId = if ($parsed -and $parsed.session_id) { $parsed.session_id } else { $SessId }

    if (Test-RateLimited $resultText) {
        Write-Log '使用上限を検知。リセット時刻を解析します。'
        $resetAt = Parse-ResetTime $resultText
        if (-not $resetAt) {
            Write-Log '⚠️ リセット時刻を自動解析できませんでした。暫定で1時間後に再試行します。ログを確認して手動調整してください。'
            $resetAt = (Get-Date).AddHours(1)
        }
        $resetAt = $resetAt.AddMinutes(2)  # 境界ちょうどでの再試行を避けるバッファ

        $state = Load-State
        $state.session_id = $newSessionId
        $state.status = 'waiting'
        $state.next_run = $resetAt.ToString('o')
        Save-State $state

        Register-ScheduledResume $resetAt
        Write-Log "上限リセット待ち。次回実行予定: $resetAt"
        if ($IsAutoResume) {
            Show-ResumeToast -Title '⏳ MEC自動再開' -Message "再開直後に再びレート制限に到達しました。次回再試行: $($resetAt.ToString('MM/dd HH:mm'))"
        }
        return
    }

    $state = Load-State
    $state.session_id = $newSessionId
    $state.status = if ($r.ExitCode -eq 0) { 'done' } else { 'error' }
    $state.last_result = $resultText.Substring(0, [Math]::Min(500, $resultText.Length))
    Save-State $state
    Remove-ScheduledResume

    if ($r.ExitCode -eq 0) {
        Write-Log 'タスク完了（上限に当たらず正常終了）。'
        if ($IsAutoResume) {
            Show-ResumeToast -Title '✅ MEC自動再開' -Message '自動再開したタスクが完了しました。'
        }
    } else {
        Write-Log "⚠️ 上限以外の理由でエラー終了しました（終了コード $($r.ExitCode)）。自動再試行はしません。ログを確認してください。"
        if ($IsAutoResume) {
            Show-ResumeToast -Title '⚠️ MEC自動再開' -Message "自動再開したタスクがエラー終了しました（コード $($r.ExitCode)）。ログを確認してください。"
        }
    }
}

function Handle-HookCapture {
    # Claude Codeの StopFailure フック（matcher: rate_limit）から呼ばれる。
    # 対話セッションが使用上限で打ち切られた"その瞬間"にstdin経由でJSONが渡される。
    # ここでは claude を起動し直さず、リセット時刻の登録だけを即座に行う（フックのtimeout予算内で終える）。
    $stdinRaw = [Console]::In.ReadToEnd()
    # ⚠️ 正確なJSONスキーマ（フィールド名）はClaude Code非公開で、実測で
    # error_type が空だった前科がある（2026-08-27）。生の入力を必ず全文ログに残す
    # ——次回スキーマが違っても手がかりが残るように。
    Write-Log "フック生入力: $stdinRaw"

    $hookData = $null
    try { $hookData = $stdinRaw | ConvertFrom-Json } catch {
        Write-Log '⚠️ JSON解析に失敗。生テキストからの抽出にフォールバックします。'
    }

    # matcher側で既に rate_limit のみに絞られている想定なので、error_typeの値では
    # ゲートしない（フィールド名が想定と違っていても取りこぼさないため）。
    # session_id はキー名の揺れ（session_id/sessionId等）に備えて生テキストからも探す。
    $sessId = $null
    foreach ($key in @('session_id', 'sessionId', 'sessionID', 'session')) {
        if ($hookData -and $hookData.$key) { $sessId = $hookData.$key; break }
    }
    if (-not $sessId -and $stdinRaw -match '"session_?[Ii][dD]"\s*:\s*"([0-9a-fA-F-]{8,})"') {
        $sessId = $Matches[1]
    }
    if (-not $sessId -and $stdinRaw -match '"transcript_path"\s*:\s*"([^"]+)"') {
        # transcript_path のファイル名(拡張子抜き)がsession_idと一致する仕様を利用
        $tp = $Matches[1] -replace '\\\\', '\'
        $sessId = [System.IO.Path]::GetFileNameWithoutExtension($tp)
    }
    if (-not $sessId) {
        Write-Log '❌ session_id をどの方法でも抽出できませんでした。中断します。生入力をログで確認してください。'
        return
    }

    # メッセージ本文がどのフィールドに入っていても拾えるよう、フィールド指定をせず
    # 生JSON全体に対して直接 "resets ..." を探す。
    Write-Log "使用上限ヒットをフックで検知（session_id=$sessId）。"

    $resetAt = Parse-ResetTime $stdinRaw
    if (-not $resetAt) {
        Write-Log '⚠️ リセット時刻を自動解析できませんでした。暫定で1時間後に再試行します。ログを確認して手動調整してください。'
        $resetAt = (Get-Date).AddHours(1)
    }
    $resetAt = $resetAt.AddMinutes(2)

    if (Test-Path $StateFile) {
        $existing = Load-State
        if ($existing -and $existing.status -eq 'waiting' -and $existing.session_id -ne $sessId) {
            Write-Log "⚠️ 既存の自動再開待ち（session_id=$($existing.session_id)）を上書きします。"
        }
    }

    $state = [pscustomobject]@{
        prompt      = '(StopFailureフックで自動検知)'
        session_id  = $sessId
        status      = 'waiting'
        started     = (Get-Date).ToString('o')
        next_run    = $resetAt.ToString('o')
        last_result = $null
    }
    Save-State $state
    Register-ScheduledResume $resetAt
    Write-Log "上限リセット待ち（フック経由・無操作）。次回実行予定: $resetAt"
    Show-ResumeToast -Title '⏸ MEC自動再開' -Message "レート制限を検知しました。$($resetAt.ToString('MM/dd HH:mm')) に自動再開します。"
}

if ($FromHook) {
    Handle-HookCapture
    exit 0
}

if ($Cancel) {
    Remove-ScheduledResume
    if (Test-Path $StateFile) { Remove-Item $StateFile }
    Write-Log '自動再開を解除しました。'
    exit 0
}

if ($Status) {
    $state = Load-State
    if (-not $state) {
        Write-Host '記録された自動再開タスクはありません。'
        exit 0
    }
    $state | Format-List
    if ($state.status -eq 'running' -and $state.runner_pid) {
        $proc = Get-Process -Id $state.runner_pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "→ 実行中プロセス確認: PID $($state.runner_pid) は生存しています（開始 $($state.run_started)）。"
        } else {
            Write-Host "⚠️ status='running' ですが PID $($state.runner_pid) は既に存在しません。異常終了した可能性があります。auto_resume.log を確認してください。"
        }
    }
    exit 0
}

if ($Start) {
    if (Test-Path $StateFile) {
        Write-Log "⚠️ 既存の自動再開タスクが記録されています。先に -Cancel で解除するか、状態ファイルを確認してください: $StateFile"
        exit 1
    }
    $state = [pscustomobject]@{
        prompt      = $Start
        session_id  = $SessionId
        status      = 'running'
        started     = (Get-Date).ToString('o')
        next_run    = $null
        last_result = $null
    }
    Save-State $state
    Handle-Turn -Prompt $Start -SessId $SessionId
    exit 0
}

if ($Resume) {
    $state = Load-State
    if (-not $state) {
        Write-Log '❌ 状態ファイルが見つかりません。-Start からやり直してください。'
        exit 1
    }
    # 先頭に明示マーカーを付ける。後で `claude --resume` で会話履歴を開いたときに
    # 「これは自動再開ツールが送った合成メッセージであってユーザーの発言ではない」
    # と一目でわかるようにする（2026-08-28）。
    $resumePrompt = "⏰[自動再開] レート制限で中断していたセッションを、上限リセット後（$(Get-Date -Format 'yyyy-MM-dd HH:mm')）に自動再開しました。前回の続きから作業を再開してください。中断していたタスクを最後まで完了させてください。"
    Handle-Turn -Prompt $resumePrompt -SessId $state.session_id -IsAutoResume
    exit 0
}

Write-Host '使い方:'
Write-Host '  新規開始: auto_resume.ps1 -Start "タスクの指示文"'
Write-Host '  既存セッション引き継ぎ: auto_resume.ps1 -Start "続けて" -SessionId <ID>'
Write-Host '  状態確認: auto_resume.ps1 -Status'
Write-Host '  解除:     auto_resume.ps1 -Cancel'
