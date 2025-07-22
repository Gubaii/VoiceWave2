// Vercel API路由 - 云函数代理
// 解决CORS问题，作为前端和DCloud云函数之间的中间层

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
        console.log('🚀 Vercel API代理被调用');
        
        const { fileData, fileName, cloudPath, fileType } = req.body;
        
        // 验证必要参数
        if (!fileData || !fileName || !cloudPath) {
            res.status(400).json({
                code: -1,
                message: '缺少必要参数：fileData, fileName, cloudPath',
                data: null
            });
            return;
        }
        
        console.log('📦 代理参数:', {
            fileName,
            cloudPath,
            fileType,
            fileDataLength: fileData ? fileData.length : 0
        });
        
        // 调用DCloud云函数
        const cloudFunctionUrl = 'https://fc-mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81.next.bspapp.com/uploadAudio';
        
        const response = await fetch(cloudFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                fileData,
                fileName,
                cloudPath,
                fileType
            })
        });
        
        if (!response.ok) {
            throw new Error(`云函数响应错误: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ 云函数调用成功:', result);
        
        // 返回结果给前端
        res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ 代理调用失败:', error);
        
        res.status(500).json({
            code: -1,
            message: `代理调用失败: ${error.message}`,
            data: null,
            error: {
                type: error.constructor.name,
                message: error.message
            }
        });
    }
} 