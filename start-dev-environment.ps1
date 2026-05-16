# Start Development Environment Script
# This script starts MySQL (if needed), the Spring Boot backend, and the Vite frontend.

param (
    [switch]$SkipMySQL,
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Nayan Eye Care Development Environment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Start MySQL if not skipped
if (-not $SkipMySQL) {
    Write-Host "Checking MySQL service status..." -ForegroundColor Yellow
    $mysqlServices = @("MySQL80", "MySQL", "mysql80", "mysql")
    $mysqlRunning = $false

    foreach ($service in $mysqlServices) {
        $status = Get-Service -Name $service -ErrorAction SilentlyContinue
        if ($status -and $status.Status -eq "Running") {
            Write-Host "Found running MySQL service: $service" -ForegroundColor Green
            $mysqlRunning = $true
            break
        }
    }

    if (-not $mysqlRunning) {
        Write-Host "No MySQL service found running. Attempting to start default services..." -ForegroundColor Yellow
        foreach ($service in $mysqlServices) {
            try {
                Start-Service -Name $service -ErrorAction Stop
                Write-Host "Started service: $service" -ForegroundColor Green
                $mysqlRunning = $true
                break
            } catch {
                continue
            }
        }
    }
    
    if (-not $mysqlRunning) {
        Write-Host "Warning: Could not start MySQL service. Ensure MySQL is installed or use H2 (default)." -ForegroundColor Red
    }
}

# 2. Start Spring Boot Backend if not skipped
if (-not $SkipBackend) {
    Write-Host "Starting Spring Boot backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run" -WindowStyle Normal
    Write-Host "Spring Boot starting in a new window..." -ForegroundColor Green
}

# 3. Start Vite Frontend if not skipped
if (-not $SkipFrontend) {
    Write-Host "Starting Frontend development server..." -ForegroundColor Yellow
    # We call 'npm run dev' which is now mapped to 'vite'
    npm run dev
}

Write-Host "`nStartup process initiated!" -ForegroundColor Cyan
