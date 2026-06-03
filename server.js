const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // 解析URL
    const parsedUrl = url.parse(req.url);
    let filePath = path.join(__dirname, parsedUrl.pathname);
    
    // 默认页面
    if (parsedUrl.pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
    }
    
    // 处理文件路径
    fs.stat(filePath, (err, stats) => {
        if (err) {
            // 文件不存在
            if (err.code === 'ENOENT') {
                console.log(`  404: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - 文件未找到</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #dc3545; }
                            .error-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px auto; max-width: 600px; text-align: left; }
                            pre { background: #e9ecef; padding: 10px; border-radius: 3px; overflow: auto; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - 文件未找到</h1>
                        <div class="error-info">
                            <p><strong>请求的文件:</strong> ${req.url}</p>
                            <p><strong>尝试的路径:</strong> ${filePath}</p>
                            <p><strong>建议:</strong></p>
                            <ul>
                                <li>检查文件是否存在</li>
                                <li>检查文件路径是否正确</li>
                                <li>确保文件扩展名正确</li>
                            </ul>
                        </div>
                    </body>
                    </html>
                `);
                return;
            }
            
            // 其他错误
            console.log(`  500: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>500 - 服务器错误</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #dc3545; }
                        .error { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px auto; max-width: 600px; }
                    </style>
                </head>
                <body>
                    <h1>500 - 服务器错误</h1>
                    <div class="error">
                        <p><strong>错误信息:</strong> ${err.message}</p>
                    </div>
                </body>
                </html>
            `);
            return;
        }
        
        // 如果是目录，尝试查找index.html
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.log(`  404: ${filePath} (目录无index.html)`);
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head><title>404 - 目录无索引文件</title></head>
                        <body>
                            <h1>404 - 目录无索引文件</h1>
                            <p>请求的目录没有index.html文件。</p>
                        </body>
                        </html>
                    `);
                    return;
                }
                serveFile(filePath, stats);
            });
            return;
        }
        
        // 服务文件
        serveFile(filePath, stats);
    });
    
    function serveFile(filePath, stats) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, content) => {
            if (err) {
                console.log(`  500: 读取文件失败 - ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 - 读取文件失败</h1>');
                return;
            }
            
            console.log(`  200: ${filePath} (${contentType})`);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stats.size,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        });
    }
});

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('按 Ctrl+C 停止服务器');
    console.log('\n可访问的页面:');
    console.log('  - http://localhost:3000/ (首页)');
    console.log('  - http://localhost:3000/about.html');
    console.log('  - http://localhost:3000/career.html');
    console.log('  - http://localhost:3000/contact.html');
    console.log('  - http://localhost:3000/css/style.css');
    console.log('  - http://localhost:3000/js/main.js');
    console.log('  - http://localhost:3000/images/person/person.jpg');
    console.log('  - http://localhost:3000/gif/station/station-main.gif');
    console.log('  - http://localhost:3000/images/Gas(Hydrogen)StationSCADAMonitoringSystem/scanda_station4.gif');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});