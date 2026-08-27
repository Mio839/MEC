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

    # 例: "resets 2026-08-09 00:00 UTC"
    if ($Text -match 'resets\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*(UTC)?') {
        $dt = [datetime]::Parse("$($Matches[1]) $($Matches[2])")
        if ($Matches[3] -eq 'UTC') {
            $dt = [datetime]::SpecifyKind($dt, [DateTimeKind]::Utc).ToLocalTime()
        }
        return $dt
    }

    # 例: "resets Mon 12:00am"（週次）
    if ($Text -match 'resets\s+([A-Za-z]{3})\s+(\d{1,2}:\d{2}\s*[ap]m)') {
        $dayName = $Matches[1]
        $timePart = $Matches[2]
        $days = @('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')
        $targetDow = [array]::IndexOf($days, $dayName)
        $t = [datetime]::Parse($timePart)
        for ($i = 0; $i -le 7; $i++) {
            $cand = $now.Date.AddDays($i)
            if ([int]$cand.DayOfWeek -eq $targetDow) {
                $result = $cand.Add($t.TimeOfDay)
                if ($result -gt $now) { return $result }
            }
        }
        return $now.AddDays(7)
    }

    # 例: "resets 3:45pm"（当日 or 翌日）
    if ($Text -match 'resets\s+(\d{1,2}:\d{2}\s*[ap]m)') {
        $t = [datetime]::Parse($Matches[1])
        $result = $now.Date.Add($t.TimeOfDay)
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
    param([string]$Prompt, [string]$SessId)

    $startLabel = if ($SessId) { "resume=$SessId" } else { '新規セッション' }
    Write-Log "Claude起動: $startLabel"
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
    } else {
        Write-Log "⚠️ 上限以外の理由でエラー終了しました（終了コード $($r.ExitCode)）。自動再試行はしません。ログを確認してください。"
    }
}

function Handle-HookCapture {
    # Claude Codeの StopFailure フック（matcher: rate_limit）から呼ばれる。
    # 対話セッションが使用上限で打ち切られた"その瞬間"にstdin経由でJSONが渡される。
    # ここでは claude を起動し直さず、リセット時刻の登録だけを即座に行う（フックのtimeout予算内で終える）。
    $stdinRaw = [Console]::In.ReadToEnd()
    $hookData = $null
    try { $hookData = $stdinRaw | ConvertFrom-Json } catch {
        Write-Log "❌ フック入力のJSON解析に失敗しました: $stdinRaw"
        return
    }

    $errType = $hookData.error_type
    if ($errType -ne 'rate_limit') {
        Write-Log "StopFailureフックが発火しましたが error_type=$errType のため何もしません（rate_limit以外）。"
        return
    }

    $sessId = $hookData.session_id
    $errMsg = $hookData.error_message
    if (-not $sessId) {
        Write-Log '⚠️ フック入力に session_id がありません。中断します。'
        return
    }

    Write-Log "使用上限ヒットをフックで検知（session_id=$sessId）。"
    Write-Log "エラーメッセージ: $errMsg"

    $resetAt = Parse-ResetTime $errMsg
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
    Handle-Turn -Prompt '前回の続きから作業を再開してください。中断していたタスクを最後まで完了させてください。' -SessId $state.session_id
    exit 0
}

Write-Host '使い方:'
Write-Host '  新規開始: auto_resume.ps1 -Start "タスクの指示文"'
Write-Host '  既存セッション引き継ぎ: auto_resume.ps1 -Start "続けて" -SessionId <ID>'
Write-Host '  状態確認: auto_resume.ps1 -Status'
Write-Host '  解除:     auto_resume.ps1 -Cancel'
