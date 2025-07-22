@echo off
echo 🚀 启动本地服务器...
echo.
echo 📁 当前目录: %CD%
echo.
echo 📋 检查Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装，请先安装Node.js
    echo 📥 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js已安装
echo.
echo 🚀 启动服务器...
node server.js
pause 