# Script kiem tra Docker da duoc cai dat chua

Write-Host "=== KIEM TRA DOCKER ===" -ForegroundColor Cyan
Write-Host ""

# Kiem tra Docker
Write-Host "1. Kiem tra Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker da duoc cai dat: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Docker chua duoc cai dat" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Docker chua duoc cai dat" -ForegroundColor Red
    Write-Host "   -> Vui long cai dat Docker Desktop tu: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

Write-Host ""

# Kiem tra Docker Compose
Write-Host "2. Kiem tra Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker Compose da san sang: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Docker Compose chua san sang" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Docker Compose chua san sang" -ForegroundColor Red
}

Write-Host ""

# Kiem tra Docker Desktop dang chay
Write-Host "3. Kiem tra Docker Desktop dang chay..." -ForegroundColor Yellow
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcess) {
    Write-Host "   [OK] Docker Desktop dang chay" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Docker Desktop chua chay" -ForegroundColor Red
    Write-Host "   -> Vui long mo Docker Desktop tu Start Menu" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== KET QUA ===" -ForegroundColor Cyan

# Tong ket
$dockerInstalled = (Get-Command docker -ErrorAction SilentlyContinue) -ne $null
$dockerRunning = (Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue) -ne $null

if ($dockerInstalled -and $dockerRunning) {
    Write-Host "[OK] Docker da san sang! Ban co the chay: docker compose up --build" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Docker chua san sang. Vui long:" -ForegroundColor Red
    Write-Host "  1. Tai va cai dat Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "  2. Khoi dong lai may tinh" -ForegroundColor Yellow
    Write-Host "  3. Mo Docker Desktop va doi no khoi dong hoan toan" -ForegroundColor Yellow
    Write-Host "  4. Chay lai script nay de kiem tra" -ForegroundColor Yellow
}

Write-Host ""
