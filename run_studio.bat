@echo off
title Math Studio
cd /d "%~dp0"

echo ========================================================
echo   MATH STUDIO - SYSTEM TRANSMISJI OBS I TABLETU
echo ========================================================
echo.

:: 1. Sprawdzenie czy Node.js jest zainstalowany
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 goto :no_node

:: 2. Sprawdzenie czy zainstalowano biblioteki node_modules
if exist node_modules goto :start_app

echo [INFO] Pierwsze uruchomienie - instalowanie bibliotek...
echo To potrwa okolo 30 sekund, prosze czekac...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 goto :npm_error
echo.
echo [INFO] Biblioteki zainstalowane pomyslnie!
echo.

:start_app
echo [INFO] Serwery uruchamiaja sie...
echo   - Na tym komputerze:  http://localhost:3000/
echo   - Nakladka w OBS:     http://localhost:3000/overlay
echo.
echo Otwieranie przegladarki...
start http://localhost:3000/
echo.

call npm run dev
pause
goto :eof

:no_node
echo.
echo ========================================================
echo   [BLAD] BRAK NODE.JS NA TYM KOMPUTERZE!
echo ========================================================
echo Do dzialania programu wymagane jest srodowisko Node.js.
echo.
echo 1. Wejdz na strone: https://nodejs.org/
echo 2. Pobierz i zainstaluj wersje LTS (np. v20 lub v22)
echo 3. Po zainstalowaniu uruchom ten plik (run_studio.bat) ponownie!
echo ========================================================
echo.
pause
exit /b 1

:npm_error
echo.
echo ========================================================
echo   [BLAD] NIE UDALO SIE ZAINSTALOWAC BIBLIOTEK
echo ========================================================
echo Sprawdz polaczenie z internetem i sprobuj ponownie.
echo ========================================================
echo.
pause
exit /b 1
