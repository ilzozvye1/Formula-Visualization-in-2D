@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   清理旧的 build-output 目录
echo ========================================
echo.
echo 这个脚本会删除 build-output 目录中的所有文件
echo.
pause

echo.
echo 正在清理...
echo.

:: 尝试删除 build-output
if exist "build-output" (
    rmdir /s /q "build-output"
    if errorlevel 1 (
        echo.
        echo [警告] 部分文件被占用，无法完全删除
        echo.
        echo 建议：
        echo 1. 关闭所有可能占用文件的程序
        echo 2. 重启电脑后再次运行此脚本
        echo 3. 或者手动删除 build-output 目录
        echo.
    ) else (
        echo [成功] build-output 目录已删除
        echo.
    )
) else (
    echo [信息] build-output 目录不存在或已被删除
    echo.
)

echo.
echo ========================================
echo 完成！
echo ========================================
echo.
pause
