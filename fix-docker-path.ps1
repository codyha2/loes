# Script kiem tra va sua PATH cho Docker

Write-Host "=== KIEM TRA VA SUA DOCKER PATH ===" -ForegroundColor Cyan
Write-Host ""

# Kiem tra Docker Desktop dang chay
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Write-Host "[ERROR] Docker Desktop chua chay. Vui long mo Docker Desktop truoc." -ForegroundColor Red
    exit
}

Write-Host "[OK] Docker Desktop dang chay" -ForegroundColor Green
Write-Host ""

# Tim Docker executable
Write-Host "Dang tim Docker executable..." -ForegroundColor Yellow

$dockerPaths = @(
    "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
    "$env:ProgramFiles\Docker\Docker\resources\bin\docker-compose.exe",
    "$env:LOCALAPPDATA\Docker\resources\bin\docker.exe",
    "$env:LOCALAPPDATA\Docker\resources\bin\docker-compose.exe"
)

$foundDocker = $null
foreach ($path in $dockerPaths) {
    if (Test-Path $path) {
        $foundDocker = $path
        Write-Host "[OK] Tim thay Docker tai: $path" -ForegroundColor Green
        break
    }
}

if (-not $foundDocker) {
    Write-Host "[ERROR] Khong tim thay Docker executable" -ForegroundColor Red
    Write-Host "Thu cac cach sau:" -ForegroundColor Yellow
    Write-Host "1. Dong va mo lai PowerShell" -ForegroundColor Yellow
    Write-Host "2. Khoi dong lai may tinh" -ForegroundColor Yellow
    Write-Host "3. Kiem tra Docker Desktop da khoi dong hoan toan chua" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "=== GIAI PHAP ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker Desktop dang chay nhung PowerShell chua nhan dien lenh docker." -ForegroundColor Yellow
Write-Host ""
Write-Host "Thu cac cach sau (theo thu tu):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. DONG VA MO LAI POWERSHELL" -ForegroundColor Green
Write-Host "   - Dong PowerShell hien tai" -ForegroundColor White
Write-Host "   - Mo PowerShell moi" -ForegroundColor White
Write-Host "   - Chay lai: docker --version" -ForegroundColor White
Write-Host ""
Write-Host "2. KHOI DONG LAI MAY TINH" -ForegroundColor Green
Write-Host "   - Khoi dong lai may tinh" -ForegroundColor White
Write-Host "   - Mo Docker Desktop" -ForegroundColor White
Write-Host "   - Doi Docker Desktop khoi dong hoan toan" -ForegroundColor White
Write-Host "   - Mo PowerShell moi va thu lai" -ForegroundColor White
Write-Host ""
Write-Host "3. KIEM TRA DOCKER DESKTOP" -ForegroundColor Green
Write-Host "   - Mo Docker Desktop" -ForegroundColor White
Write-Host "   - Doi den khi icon Docker o system tray khong con canh bao" -ForegroundColor White
Write-Host "   - Thu lai lenh docker" -ForegroundColor White
Write-Host ""


