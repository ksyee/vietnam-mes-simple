@echo off
chcp 65001 >nul
title Vietnam MES - Starting...

echo ========================================
echo   Vietnam MES 실행 중...
echo ========================================
echo.

cd /d "%~dp0"

:: 브라우저에서 바로 열기 (5초 후)
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173"

:: 개발 서버 실행
npm run dev
