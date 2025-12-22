@echo off
chcp 65001 >nul
title Vietnam MES - Browser Mode

echo ========================================
echo   Vietnam MES (브라우저 모드)
echo ========================================
echo.
echo   브라우저에서 자동으로 열립니다.
echo   종료: Ctrl+C
echo.

cd /d "%~dp0"

:: 브라우저 전용 모드 설정
set BROWSER_ONLY=true

:: 브라우저에서 바로 열기 (3초 후)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Vite 개발 서버만 실행 (Electron 없이)
npx vite --host
