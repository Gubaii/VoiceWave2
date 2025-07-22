const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // 设置CORS头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    
    console.log(`📡 请求: ${req.method} ${pathname}`);
    
    // 默认页面
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 安全检查：防止访问上级目录
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>403 - 禁止访问</h1>');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`❌ 文件读取错误: ${filePath}`, err.message);
            if (err.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>404 - 文件未找到</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e74c3c; }
                            .file-list { text-align: left; max-width: 600px; margin: 20px auto; }
                            .file-list a { color: #3498db; text-decoration: none; }
                            .file-list a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - 文件未找到</h1>
                        <p>请求的文件不存在: <code>${pathname}</code></p>
                        <div class="file-list">
                            <h3>可用的文件:</h3>
                            <ul>
                                <li><a href="/index.html">index.html</a> - 主页</li>
                                <li><a href="/record.html">record.html</a> - 录音页面</li>
                                <li><a href="/完整流程测试.html">完整流程测试.html</a> - 完整流程测试</li>
                                <li><a href="/play-generator.html">play-generator.html</a> - 播放页面生成器</li>
                                <li><a href="/二维码测试.html">二维码测试.html</a> - 二维码测试</li>
                                <li><a href="/edit.html">edit.html</a> - 编辑页面</li>
                                <li><a href="/play.html">play.html</a> - 播放页面</li>
                            </ul>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                // 服务器错误
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>500 - 服务器内部错误</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - 服务器内部错误</h1>
                        <p>错误信息: ${err.message}</p>
                    </body>
                    </html>
                `);
            }
        } else {
            // 成功响应
            console.log(`✅ 文件发送成功: ${filePath}`);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 本地服务器已启动`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`📁 当前目录: ${__dirname}`);
    console.log(`\n📋 可访问的文件:`);
    console.log(`   - http://localhost:${PORT}/index.html (主页)`);
    console.log(`   - http://localhost:${PORT}/record.html (录音页面)`);
    console.log(`   - http://localhost:${PORT}/完整流程测试.html (完整流程测试)`);
    console.log(`   - http://localhost:${PORT}/play-generator.html (播放页面生成器)`);
    console.log(`   - http://localhost:${PORT}/二维码测试.html (二维码测试)`);
    console.log(`   - http://localhost:${PORT}/edit.html (编辑页面)`);
    console.log(`   - http://localhost:${PORT}/play.html (播放页面)`);
    console.log(`\n💡 提示: 使用本地服务器可以避免CORS问题`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
}); 