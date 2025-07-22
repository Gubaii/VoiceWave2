#!/bin/bash

echo "🚀 启动本地服务器..."
echo ""
echo "📁 当前目录: $(pwd)"
echo ""

echo "📋 检查Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    echo "📥 下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js已安装 (版本: $(node --version))"
echo ""

echo "🚀 启动服务器..."
node server.js 