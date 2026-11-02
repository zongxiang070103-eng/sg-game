@echo off
chcp 65001 >nul
title 战棋 - 开发服务器（关闭此窗口即停止游戏）
cd /d "%~dp0"

if not exist "node_modules" (
  echo 首次运行，正在安装依赖，请稍候...
  call npm install
)

echo.
echo 启动中，3 秒后自动打开浏览器...
echo 浏览器地址： http://localhost:5173
echo 关闭这个黑窗口，游戏就停止了。
echo.
start "" /b cmd /c "timeout /t 3 >nul && start http://localhost:5173"
call npm run dev

pause
