@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 将星谱 - 本地开发服务器
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%"
set "CHECK=%URL%/src/web/main.ts"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [启动失败] 没有找到 Node.js，请先安装 Node.js 22 或更高版本。
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 首次运行，正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo.
    echo [启动失败] 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

rem ==== 1. 已有本项目的服务器：直接复用，打开浏览器 ====
set "ALIVE="
for /f %%C in ('curl -s -o nul -w "%%{http_code}" --max-time 2 "%CHECK%" 2^>nul') do set "ALIVE=%%C"

set "OURS="
if "%ALIVE%"=="200" (
  for /f %%C in ('curl -s --max-time 3 "%CHECK%" ^| findstr /C:jiangxing') do set "OURS=1"
)

if defined OURS (
  echo.
  echo [已在运行] 检测到将星谱开发服务器：%URL%
  echo 正在打开浏览器。若要重启，请先关闭旧的服务器窗口。
  start "" "%URL%"
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

rem ==== 2. 端口被占用：只在确认是 node 进程时询问是否结束 ====
set "OWNER="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /C:"127.0.0.1:%PORT%" ^| findstr /C:"LISTENING"') do set "OWNER=%%P"

set "IMG="
if defined OWNER for /f "tokens=1" %%I in ('tasklist /FI "PID eq %OWNER%" /NH 2^>nul') do set "IMG=%%I"

if defined OWNER (
  echo.
  echo [端口占用] %PORT% 已被 %IMG% ^(PID %OWNER%^) 占用。
  if /I "%IMG%"=="node.exe" (
    choice /C YN /N /M "结束该 node 进程并重启？[Y/N] "
    if errorlevel 2 (
      echo 已取消。请关闭占用 %PORT% 的程序后重试。
      pause
      exit /b 1
    )
    taskkill /PID %OWNER% /F >nul 2>nul
    ping -n 2 127.0.0.1 >nul
  ) else (
    echo 请关闭该程序后重新双击本脚本。
    pause
    exit /b 1
  )
)

echo.
echo 工作目录：%~dp0
echo 启动地址：%URL%
echo 服务就绪后会自动打开浏览器；关闭这个窗口即停止游戏。
echo.

call npm run dev -- --host 127.0.0.1 --port %PORT% --strictPort --open
set "CODE=%ERRORLEVEL%"

if not "%CODE%"=="0" (
  echo.
  echo 开发服务器已退出，代码 %CODE%。
  echo 如果提示端口被占用：请关闭旧的将星谱窗口，或重新双击本脚本按提示清理。
)

pause
