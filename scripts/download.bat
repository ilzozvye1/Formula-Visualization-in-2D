@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   自动下载 GitHub 构建
echo ========================================
echo.

:: 检查是否提供了 token
if "%~1"=="" (
    echo 使用方法:
    echo   download.bat ^<GitHub_Token^>
    echo.
    echo 示例:
    echo   download.bat ghp_xxxxxxxxxxxx
    echo.
    echo 提示：GitHub Token 需要在以下位置生成:
    echo   https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo 正在下载最新构建...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0download-builds.ps1" -Token "%~1"

echo.
echo ========================================
echo 完成！
echo ========================================
echo.
echo 构建已保存到：builds\ 目录
echo.
pause
