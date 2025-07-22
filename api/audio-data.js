// Vercel API路由 - 音频数据
// 返回Base64编码的音频数据，解决移动设备播放问题

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
                usage: '/api/audio-data?url=YOUR_AUDIO_URL'
            });
            return;
        }
        
        console.log('🎵 音频数据请求:', url);
        
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
                'User-Agent': 'Mozilla/5.0 (compatible; AudioData/1.0)'
            }
        });
        
        if (!audioResponse.ok) {
            throw new Error(`获取音频失败: ${audioResponse.status} ${audioResponse.statusText}`);
        }
        
        // 获取音频内容类型
        const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
        
        // 获取音频数据并转换为Base64
        const arrayBuffer = await audioResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        console.log('✅ 音频数据转换成功:', {
            contentType,
            size: arrayBuffer.byteLength,
            base64Length: base64.length
        });
        
        // 返回Base64数据
        res.status(200).json({
            code: 0,
            message: '音频数据获取成功',
            data: {
                dataUrl: dataUrl,
                contentType: contentType,
                size: arrayBuffer.byteLength,
                originalUrl: url
            }
        });
        
    } catch (error) {
        console.error('❌ 音频数据获取失败:', error);
        
        res.status(500).json({
            code: -1,
            message: `音频数据获取失败: ${error.message}`,
            data: null,
            error: {
                type: error.constructor.name,
                message: error.message
            }
        });
    }
} 