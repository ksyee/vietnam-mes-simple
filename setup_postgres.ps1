# PostgreSQL Setup Script for Vietnam MES
# Run this script as Administrator

$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"

Write-Host "=== Vietnam MES PostgreSQL Setup ===" -ForegroundColor Cyan

# Backup pg_hba.conf
Write-Host "1. Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaPath "$pgHbaPath.backup"

# Change authentication to trust temporarily
Write-Host "2. Modifying authentication to trust..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath
$newContent = $content -replace "scram-sha-256", "trust"
Set-Content -Path $pgHbaPath -Value $newContent

# Restart PostgreSQL service
Write-Host "3. Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service postgresql-x64-17
Start-Sleep -Seconds 3

# Create database and user
Write-Host "4. Creating database vietnam_mes..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -U postgres -c "CREATE DATABASE vietnam_mes;"
& "$pgBinPath\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Restore original pg_hba.conf
Write-Host "5. Restoring pg_hba.conf..." -ForegroundColor Yellow
Copy-Item "$pgHbaPath.backup" $pgHbaPath -Force

# Restart PostgreSQL service
Write-Host "6. Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service postgresql-x64-17

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Database: vietnam_mes" -ForegroundColor White
Write-Host "User: postgres" -ForegroundColor White
Write-Host "Password: postgres" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
