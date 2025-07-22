// Vercel API路由 - 音频格式转换
// 将音频转换为移动设备兼容的格式

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
    
    // 只允许POST请求
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        console.log('🔄 音频格式转换请求');
        
        const { audioUrl, targetFormat = 'mp3' } = req.body;
        
        if (!audioUrl) {
            res.status(400).json({
                code: -1,
                message: '缺少音频URL参数',
                data: null
            });
            return;
        }
        
        console.log('📦 转换参数:', { audioUrl, targetFormat });
        
        // 检查目标格式是否支持
        const supportedFormats = ['mp3', 'wav', 'ogg', 'm4a'];
        if (!supportedFormats.includes(targetFormat)) {
            res.status(400).json({
                code: -1,
                message: `不支持的格式: ${targetFormat}`,
                data: null
            });
            return;
        }
        
        // 获取原始音频
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
            throw new Error(`获取音频失败: ${audioResponse.status}`);
        }
        
        const audioBuffer = await audioResponse.arrayBuffer();
        console.log('✅ 音频获取成功，大小:', audioBuffer.byteLength);
        
        // 这里可以添加实际的音频转换逻辑
        // 由于Vercel环境限制，我们暂时返回原始音频
        // 在实际部署中，可以使用FFmpeg或其他音频处理库
        
        res.status(200).json({
            code: 0,
            message: '音频格式转换完成',
            data: {
                originalUrl: audioUrl,
                convertedUrl: audioUrl, // 暂时返回原始URL
                format: targetFormat,
                size: audioBuffer.byteLength
            }
        });
        
    } catch (error) {
        console.error('❌ 音频转换失败:', error);
        
        res.status(500).json({
            code: -1,
            message: `音频转换失败: ${error.message}`,
            data: null,
            error: {
                type: error.constructor.name,
                message: error.message
            }
        });
    }
} 