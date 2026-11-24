@echo off
setlocal enabledelayedexpansion
title TalentLens AI - Recruitment Assistant Launcher

echo ========================================================================
echo   TalentLens AI - Recruitment Assistant with Smart RAG Chatbot
echo   Backend: Django + Pure-Python NLP & Hybrid RAG  (Port 8002)
echo   Frontend: React 19 + Vite + Tailwind v4 + ReactBits (Port 5172)
echo ========================================================================
echo.

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "VENV_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"

:: 1. Verify Python & Node are installed
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not on PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 2. Setup Backend Virtual Environment & Requirements if missing
if not exist "%VENV_PY%" (
    echo [1/5] Creating Python virtual environment in backend\.venv ...
    pushd "%BACKEND_DIR%"
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        popd
        pause
        exit /b 1
    )
    echo [1/5] Installing backend Python dependencies ...
    "%VENV_PY%" -m pip install --upgrade pip
    "%VENV_PY%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install requirements.txt.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo [1/5] Backend virtual environment found at backend\.venv
)

:: 3. Run Django Migrations & Idempotent Seed
echo [2/5] Applying Django migrations and seeding recruitment data ...
pushd "%BACKEND_DIR%"
"%VENV_PY%" manage.py migrate --noinput
"%VENV_PY%" manage.py seed_recruitment
popd

:: 4. Install Frontend Node Dependencies if missing
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [3/5] Installing frontend npm dependencies ...
    pushd "%FRONTEND_DIR%"
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo [3/5] Frontend node_modules already installed.
)

:: 5. Launch Django Backend (8002) and Vite Frontend (5172) in titled windows
echo [4/5] Launching TalentLens AI Django Backend on http://localhost:8002 ...
start "TalentLens AI - Django Backend (8002)" /D "%BACKEND_DIR%" cmd /k ".\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8002"

echo [4/5] Launching TalentLens AI React Frontend on http://localhost:5172 ...
start "TalentLens AI - React Frontend (5172)" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"

:: 6. Wait for servers to come online and launch browser
echo [5/5] Waiting for backend and frontend servers to become ready ...
powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(35); while ((Get-Date) -lt $deadline) { try { $b = Invoke-WebRequest -Uri 'http://localhost:8002/api/health/' -UseBasicParsing -TimeoutSec 2; $f = Invoke-WebRequest -Uri 'http://localhost:5172' -UseBasicParsing -TimeoutSec 2; if ($b.StatusCode -eq 200 -and $f.StatusCode -eq 200) { break } } catch {} ; Start-Sleep -Milliseconds 700 }"

echo.
echo [READY] Opening TalentLens AI in your default browser ...
echo   Frontend UI : http://localhost:5172
echo   Backend API : http://localhost:8002/api/health/
echo.
start "" "http://localhost:5172"

endlocal
