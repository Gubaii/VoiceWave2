// Vercel API路由 - 音频代理
// 直接代理音频文件，解决移动设备播放问题

export default async function handler(req, res) {
    // 设置CORS头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'OK' });
        return;
    }
    
    // 只允许GET请求
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { url } = req.query;
        
        if (!url) {
            res.status(400).json({
                error: '缺少音频URL参数',
                usage: '/api/audio-proxy?url=YOUR_AUDIO_URL'
            });
            return;
        }
        
        console.log('🎵 音频代理请求:', url);
        
        // 验证URL格式
        let audioUrl;
        try {
            audioUrl = new URL(url);
        } catch (error) {
            res.status(400).json({ error: '无效的音频URL' });
            return;
        }
        
        // 获取音频文件
        const audioResponse = await fetch(audioUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AudioProxy/1.0)'
            }
        });
        
        if (!audioResponse.ok) {
            throw new Error(`获取音频失败: ${audioResponse.status} ${audioResponse.statusText}`);
        }
        
        // 获取音频内容类型
        const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
        const contentLength = audioResponse.headers.get('content-length');
        
        console.log('✅ 音频获取成功:', {
            contentType,
            contentLength,
            url: audioUrl.toString()
        });
        
        // 设置响应头
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', contentLength);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时
        
        // 如果是范围请求，处理部分内容
        const range = req.headers.range;
        if (range && contentLength) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength, 10) - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
            res.setHeader('Content-Length', chunksize);
            
            // 获取部分内容
            const partialResponse = await fetch(audioUrl.toString(), {
                headers: {
                    'Range': `bytes=${start}-${end}`,
                    'User-Agent': 'Mozilla/5.0 (compatible; AudioProxy/1.0)'
                }
            });
            
            const buffer = await partialResponse.arrayBuffer();
            res.send(Buffer.from(buffer));
        } else {
            // 获取完整内容
            const buffer = await audioResponse.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
        
    } catch (error) {
        console.error('❌ 音频代理失败:', error);
        
        res.status(500).json({
            error: `音频代理失败: ${error.message}`,
            details: error.stack
        });
    }
} 