#requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [ValidateRange(60, 1800)]
    [int]$StartupTimeoutSeconds = 420
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectRoot = $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot 'docker-compose.yml'
$FrontendUrl = 'http://localhost:5173'
$BackendHealthUrl = 'http://localhost:3001/api/health'
$DockerPackageId = 'Docker.DockerDesktop'

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Refresh-ProcessPath {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = @($machinePath, $userPath) -join ';'
}

function Add-DockerCliToPath {
    $candidateDirectories = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin'),
        (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin')
    )

    foreach ($directory in $candidateDirectories) {
        if ((Test-Path -LiteralPath $directory) -and ($env:Path -notlike "*$directory*")) {
            $env:Path = "$directory;$env:Path"
        }
    }
}

function Test-DockerEngine {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return $false
    }

    # Windows PowerShell 5.1 can turn redirected native stderr into a terminating
    # ErrorRecord when the engine is stopped. Keep this availability probe inert.
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'SilentlyContinue'
        & docker info --format '{{.ServerVersion}}' *> $null
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Get-DockerDesktopExecutable {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
        (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
    )

    return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Ensure-Wsl {
    & wsl.exe --version *> $null
    if ($LASTEXITCODE -eq 0) {
        return
    }

    Write-Step 'Installing or updating the Windows Subsystem for Linux (WSL 2)'
    Write-Host 'Windows may display an administrator approval prompt.' -ForegroundColor Yellow

    $isAdministrator = ([Security.Principal.WindowsPrincipal] `
        [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator
        )

    if ($isAdministrator) {
        & wsl.exe --install --no-distribution
        $installExitCode = $LASTEXITCODE
        if ($installExitCode -eq 0) {
            & wsl.exe --update
        }
    }
    else {
        $wslCommand = 'wsl.exe --install --no-distribution; if ($LASTEXITCODE -eq 0) { wsl.exe --update }; exit $LASTEXITCODE'
        $elevated = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru `
            -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $wslCommand)
        $installExitCode = $elevated.ExitCode
    }

    & wsl.exe --version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw @"
WSL 2 installation returned exit code $installExitCode and is not ready yet.
Restart Windows if requested, then run this script again; it will continue automatically.
"@
    }
}

function Install-DockerDesktop {
    Write-Step 'Docker is not installed; installing Docker Desktop'

    Ensure-Wsl

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        & $winget.Source install --id $DockerPackageId --exact --source winget `
            --scope user --silent --accept-package-agreements --accept-source-agreements `
            --disable-interactivity

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "WinGet returned exit code $LASTEXITCODE. Trying Docker's official installer instead."
        }
    }

    Refresh-ProcessPath
    Add-DockerCliToPath
    if (Get-DockerDesktopExecutable) {
        return
    }

    $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'amd64' }
    $installerUrl = "https://desktop.docker.com/win/main/$architecture/Docker%20Desktop%20Installer.exe"
    $installerPath = Join-Path ([IO.Path]::GetTempPath()) 'DockerDesktopInstaller.exe'

    Write-Host 'Downloading Docker Desktop from docker.com...'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -Uri $installerUrl -OutFile $installerPath
        $installer = Start-Process -FilePath $installerPath -Wait -PassThru `
            -ArgumentList @('install', '--user', '--quiet', '--accept-license', '--backend=wsl-2')
        if ($installer.ExitCode -ne 0) {
            throw "Docker Desktop installer exited with code $($installer.ExitCode)."
        }
    }
    finally {
        Remove-Item -LiteralPath $installerPath -Force -ErrorAction SilentlyContinue
    }

    Refresh-ProcessPath
    Add-DockerCliToPath
    if (-not (Get-DockerDesktopExecutable)) {
        throw 'Docker Desktop installation completed, but its executable could not be found.'
    }
}

function Start-DockerEngine {
    if (Test-DockerEngine) {
        Write-Host 'Docker engine is already running.' -ForegroundColor Green
        return
    }

    $desktopExecutable = Get-DockerDesktopExecutable
    if (-not $desktopExecutable) {
        Install-DockerDesktop
        $desktopExecutable = Get-DockerDesktopExecutable
    }

    Write-Step 'Starting Docker Desktop'
    $startedWithCli = $false
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $previousErrorActionPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'SilentlyContinue'
            & docker desktop start --detach *> $null
            $startedWithCli = ($LASTEXITCODE -eq 0)
        }
        catch {
            $startedWithCli = $false
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
        }
    }

    if (-not $startedWithCli) {
        Start-Process -FilePath $desktopExecutable -WindowStyle Hidden | Out-Null
    }

    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        if (Test-DockerEngine) {
            Write-Host 'Docker engine is ready.' -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 3
    } while ([DateTime]::UtcNow -lt $deadline)

    throw @'
Docker Desktop did not become ready in time. Open Docker Desktop once to inspect its message.
On a first installation, Windows may require you to enable hardware virtualization/WSL 2,
accept a UAC prompt, or restart the PC. After resolving that, run this script again.
'@
}

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    $match = Get-Content -LiteralPath $Path | Where-Object {
        $_ -match "^\s*$([regex]::Escape($Name))\s*=" -and $_ -notmatch '^\s*#'
    } | Select-Object -Last 1

    if (-not $match) {
        return $null
    }

    return (($match -split '=', 2)[1]).Trim().Trim('"').Trim("'")
}

function Configure-Environment {
    $envPath = Join-Path $ProjectRoot '.env'
    $examplePath = Join-Path $ProjectRoot '.env.example'

    if (-not (Test-Path -LiteralPath $envPath)) {
        if (-not (Test-Path -LiteralPath $examplePath)) {
            throw 'Neither .env nor .env.example exists. The application configuration is missing.'
        }
        Copy-Item -LiteralPath $examplePath -Destination $envPath
        Write-Host 'Created .env from .env.example.' -ForegroundColor Green
    }

    $liveKitUrl = Get-DotEnvValue -Path $envPath -Name 'LIVEKIT_URL'
    $liveKitKey = Get-DotEnvValue -Path $envPath -Name 'LIVEKIT_API_KEY'
    $liveKitSecret = Get-DotEnvValue -Path $envPath -Name 'LIVEKIT_API_SECRET'
    $hasCloudLiveKit = $liveKitUrl -like 'wss://*' -and $liveKitKey -and $liveKitSecret

    if ($hasCloudLiveKit) {
        Write-Host 'Using the LiveKit Cloud configuration in .env.' -ForegroundColor Green
        return $false
    }

    # Process-level values override incomplete .env values without overwriting the user's file.
    $env:COMPOSE_PROFILES = 'local-audio'
    $env:LIVEKIT_URL = 'ws://localhost:7880'
    $env:LIVEKIT_API_KEY = 'devkey'
    $env:LIVEKIT_API_SECRET = 'secret'
    Write-Host 'Using the local LiveKit container for development audio.' -ForegroundColor Green
    return $true
}

function Invoke-HttpCheck {
    param([Parameter(Mandatory)][string]$Uri)
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 5
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    }
    catch {
        return $false
    }
}

function Wait-ForApplication {
    param([Parameter(Mandatory)][bool]$UsesLocalLiveKit)

    Write-Step 'Waiting for the full stack to become healthy'
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        $backendReady = Invoke-HttpCheck -Uri $BackendHealthUrl
        $frontendReady = Invoke-HttpCheck -Uri $FrontendUrl
        $databaseId = (& docker compose --file $ComposeFile ps --quiet database 2>$null).Trim()
        $databaseReady = $false
        if ($databaseId) {
            $databaseState = (& docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $databaseId 2>$null).Trim()
            $databaseReady = ($databaseState -in @('healthy', 'running'))
        }

        $liveKitReady = $true
        if ($UsesLocalLiveKit) {
            $liveKitId = (& docker compose --file $ComposeFile --profile local-audio ps --quiet livekit 2>$null).Trim()
            $liveKitReady = [bool]$liveKitId -and ((& docker inspect --format '{{.State.Running}}' $liveKitId 2>$null).Trim() -eq 'true')
        }

        if ($backendReady -and $frontendReady -and $databaseReady -and $liveKitReady) {
            Write-Host 'PostgreSQL, backend, frontend, and LiveKit are ready.' -ForegroundColor Green
            return
        }

        Start-Sleep -Seconds 3
    } while ([DateTime]::UtcNow -lt $deadline)

    & docker compose --file $ComposeFile ps
    & docker compose --file $ComposeFile logs --tail 80 database backend frontend livekit
    throw "The stack did not become healthy within $StartupTimeoutSeconds seconds. Recent service logs are shown above."
}

try {
    Write-Host 'Minduel Lite - one-click local startup' -ForegroundColor White
    if (-not (Test-Path -LiteralPath $ComposeFile)) {
        throw "docker-compose.yml was not found beside this script: $ProjectRoot"
    }

    Set-Location -LiteralPath $ProjectRoot
    Refresh-ProcessPath
    Add-DockerCliToPath
    Start-DockerEngine

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI is unavailable after Docker Desktop startup.'
    }
    & docker compose version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose v2 is unavailable. Repair or update Docker Desktop, then run this script again.'
    }

    $usesLocalLiveKit = Configure-Environment

    Write-Step 'Building and starting Minduel Lite'
    if ($usesLocalLiveKit) {
        & docker compose --file $ComposeFile --profile local-audio up --detach --build
    }
    else {
        & docker compose --file $ComposeFile up --detach --build
    }
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose could not build or start the application. Review the output above for details.'
    }

    Wait-ForApplication -UsesLocalLiveKit $usesLocalLiveKit

    Write-Host "`nMinduel Lite is running:" -ForegroundColor Green
    Write-Host "  Frontend: $FrontendUrl"
    Write-Host "  Backend:  $BackendHealthUrl"
    Write-Host "`nTo stop it later, run: docker compose down" -ForegroundColor DarkGray

    if (-not $NoBrowser) {
        Start-Process $FrontendUrl
    }
}
catch {
    Write-Host "`nStartup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Run the script again after correcting the reported issue." -ForegroundColor Yellow
    exit 1
}
