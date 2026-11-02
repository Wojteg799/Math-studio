@echo off
title Math Studio - OBS & Huion Broadcast System
setlocal enabledelayedexpansion

echo ========================================================
echo   MATH STUDIO - SYSTEM TRANSMISJI OBS ^& TABLETU
echo ========================================================
echo.

:: 1. Sprawdzenie czy Node.js jest zainstalowany
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Na tym komputerze nie jest zainstalowane srodowisko Node.js!
    echo Pobierz i zainstaluj Node.js (v18 lub nowszy) ze strony:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 2. Sprawdzenie czy to pierwsze uruchomienie po sklonowaniu z Gita
if not exist node_modules (
    echo [INFO] Wykryto pierwsze uruchomienie po pobraniu projektu z Git!
    echo [INFO] Trwa automatyczna instalacja wymaganych bibliotek (npm install)...
    echo Prosze czekac, to zajmie okolo 20-30 sekund...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [BLAD] Instalacja bibliotek nie powiodla sie. Sprawdz polaczenie z internetem.
        pause
        exit /b
    )
    echo.
    echo [INFO] Biblioteki zainstalowane pomyslnie!
    echo.
)

:: 3. Wykrycie biezacego adresu IP komputera w sieci Wi-Fi
set DETECTED_IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Adres IPv4"') do (
    set RAW_IP=%%a
    set CLEAN_IP=!RAW_IP: =!
    if not "!CLEAN_IP!"=="" (
        set DETECTED_IP=!CLEAN_IP!
        goto :ip_done
    )
)
:ip_done

echo [INFO] Serwery uruchamiaja sie...
echo   - Na tym komputerze:     http://localhost:3000/
echo   - Nakladka w OBS:        http://localhost:3000/overlay
echo   - Telefon / Tablet Wi-Fi: http://%DETECTED_IP%:3000/director
echo.
echo Otwieranie przegladarki...
start http://localhost:3000/
echo.

:: 4. Uruchomienie aplikacji
call npm run dev
pause
