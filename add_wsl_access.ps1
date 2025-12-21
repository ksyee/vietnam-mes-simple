# Add WSL access to PostgreSQL
# Run this script as Administrator

$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

Write-Host "Adding WSL network access to pg_hba.conf..." -ForegroundColor Cyan

# Add rule for WSL network
$wslRule = "`n# WSL2 connections`nhost    all             all             172.16.0.0/12           scram-sha-256"

Add-Content -Path $pgHbaPath -Value $wslRule

Write-Host "Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service postgresql-x64-17

Write-Host "Done! WSL can now connect to PostgreSQL." -ForegroundColor Green
Start-Sleep -Seconds 2
