@echo off
:: 2D Formula Visualization - Universal Build Script
:: Supports: Web, Windows, Android platforms

:: Set working directory to script location
cd /d "%~dp0"

:: Create log file
> build_log.txt echo 2D Formula Visualization - Universal Build Script
>> build_log.txt echo ===============================================
>> build_log.txt echo Current directory: %cd%
>> build_log.txt echo Script path: %~f0
>> build_log.txt echo Time: %date% %time%

:: Clear screen
cls

echo 2D Formula Visualization - Universal Build Script
echo ===============================================
echo.
echo This script will build for the following platforms:
echo 1. Web (HTML/JS/CSS)
echo 2. Windows (Electron)
echo 3. Android (Cordova)
echo.
echo Build output will be saved to: build-output/
echo.

:: Ask user for build options
echo Build Options:
echo 1. Build all platforms
echo 2. Build Web only
echo 3. Build Windows only
echo 4. Build Android only
echo 5. Exit
echo.
set /p "choice=Please select [1]: "

if "%choice%"=="" set "choice=1"

if "%choice%"=="5" (
    echo Build cancelled.
    pause
    exit /b 0
)

:: Check Node.js
echo Checking Node.js...
where node >nul 2>> build_log.txt
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

:: Check npm
echo Checking npm...
where npm >nul 2>> build_log.txt
if errorlevel 1 (
    echo ERROR: npm not found!
    echo Please install npm first.
    pause
    exit /b 1
)

:: Set build parameters based on user choice
set "build_args="
if "%choice%"=="1" (
    set "build_args=--all"
) else if "%choice%"=="2" (
    set "build_args=--web"
) else if "%choice%"=="3" (
    set "build_args=--win"
) else if "%choice%"=="4" (
    set "build_args=--android"
) else (
    echo Invalid option selected.
    pause
    exit /b 1
)

:: Kill related processes
echo Killing related processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im app-builder.exe >nul 2>&1

:: Run the Node.js build script
echo.
echo Running build.js with args: %build_args%
echo ===============================================
echo.
call node scripts\build\build.js %build_args% >> build_log.txt 2>&1

if errorlevel 1 (
    echo ERROR: Build failed! Check build_log.txt for details.
    pause
    exit /b 1
)

:: Delete dist folder
echo.
echo Cleaning up dist folder...
if exist "dist" (
    rd /s /q "dist"
    echo dist folder deleted.
    >> build_log.txt echo dist folder deleted successfully
) else (
    echo dist folder not found, skipping.
    >> build_log.txt echo dist folder not found, skipping cleanup
)

:: ============================================
:: BUILD SUMMARY
:: ============================================
echo.
echo ===============================================
echo Build Summary
echo ===============================================
echo.

:: Check build output
if not exist "build-output" (
    echo ERROR: No build output found!
    pause
    exit /b 1
)

:: List all platform builds
if exist "build-output\windows" (
    echo [OK] Windows version: build-output\windows\
    dir /b "build-output\windows\*.exe" 2>nul
) else (
    echo [SKIP] Windows version not built
)

if exist "build-output\android" (
    echo [OK] Android version: build-output\android\
    dir /b "build-output\android\*.apk" 2>nul
) else (
    echo [SKIP] Android version not built
)

if exist "build-output\web" (
    echo [OK] Web version: build-output\web\
) else (
    echo [SKIP] Web version not built
)

echo.
echo ===============================================
echo Build process completed!
echo Detailed log saved to: build_log.txt
echo Press any key to exit...
pause
