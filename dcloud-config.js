/**
 * DCloud云存储配置
 * 使用购买的云存储服务
 */

const DCLOUD_CONFIG = {
    // 您的云存储空间配置 - 请从DCloud开发者中心获取
    spaceId: 'mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81',      // 服务空间ID
    clientSecret: '8mpDH12DbZas99JfoPi8xg==', // 客户端密钥
    
    // 云存储配置
    provider: 'aliyun',  // 服务商：aliyun、tencent
    
    // 上传配置
    uploadConfig: {
        maxFileSize: 10 * 1024 * 1024,  // 最大文件大小 10MB
        allowedTypes: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'],
        timeout: 30000,  // 上传超时时间 30秒
        retryCount: 3,   // 重试次数
        path: 'voicewave-audio/'  // 云存储路径
    },
    
    // 音频文件配置
    audioConfig: {
        folder: 'voicewave-audio/',    // 存储文件夹
        filePrefix: 'voice_',          // 文件名前缀
        generateFilename: function() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `${this.filePrefix}${timestamp}_${random}`;
        }
    },
    
    // 播放页面配置
    playPageUrl: '',  // 自动根据当前域名生成
    
    // 云函数配置
    cloudFunctions: {
        upload: 'uploadAudio',     // 上传云函数名称
        delete: 'deleteAudio',     // 删除云函数名称
        getUrl: 'getAudioUrl'      // 获取音频URL云函数名称
    },
    
    // 生成云存储文件ID
    generateFileId: function() {
        return this.audioConfig.generateFilename() + '.webm';
    },
    
    // 生成播放URL
    generatePlayUrl: function(fileId) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        let baseUrl;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
        } else {
            baseUrl = `${protocol}//${hostname}`;
        }
        
        return `${baseUrl}/play.html?cloudFileId=${fileId}&provider=dcloud`;
    },
    
    // 验证配置
    isValid: function() {
        return this.spaceId !== 'your-space-id' && 
               this.clientSecret !== 'your-client-secret' &&
               this.spaceId && this.clientSecret;
    }
};

// 导出配置
window.DCLOUD_CONFIG = DCLOUD_CONFIG;

// 配置状态检查
if (DCLOUD_CONFIG.isValid()) {
    console.log('✅ DCloud云存储配置已加载');
    console.log('📦 服务空间ID:', DCLOUD_CONFIG.spaceId);
} else {
    console.warn('⚠️ DCloud配置未完成，请填写spaceId和clientSecret');
    console.log('📚 配置指南: 查看DCloud配置指南.md');
} 