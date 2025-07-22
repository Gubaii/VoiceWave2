// 云存储管理器
// 防止重复声明
if (typeof CloudStorageManager === 'undefined') {
class CloudStorageManager {
    constructor(config) {
        this.config = config;
        this.uniCloudStorage = null;
        this.isInitialized = false;
        this.init();
    }
    
    // 初始化云存储
    async init() {
        try {
            if (typeof UniCloudStorage === 'undefined') {
                console.error('💥 UniCloudStorage SDK未加载！请检查：');
                console.error('1. 是否正确引入了uni-cloud-storage.js文件');
                console.error('2. 网络连接是否正常（CDN可能被阻止）');
                console.error('3. 可以访问 云存储调试工具.html 进行诊断');
                throw new Error('UniCloudStorage SDK未加载');
            }
            
            console.log('📡 开始初始化云存储...');
            console.log('配置信息:', {
                spaceId: this.config.spaceId,
                provider: this.config.provider,
                hasClientSecret: !!this.config.clientSecret
            });
            
            // 初始化uni-cloud-storage
            this.uniCloudStorage = new UniCloudStorage(
                this.config.spaceId,
                this.config.clientSecret
            );
            
            this.isInitialized = true;
            console.log('✅ 云存储初始化成功');
        } catch (error) {
            console.error('❌ 云存储初始化失败:', error);
            console.error('请使用 云存储调试工具.html 进行故障排除');
            this.isInitialized = false;
        }
    }
    
    // 上传音频文件到云存储
    async uploadAudioFile(audioBlob, filename) {
        if (!this.isInitialized) {
            throw new Error('云存储未初始化');
        }
        
        try {
            console.log('开始上传音频文件到云存储:', filename);
            
            // 检查文件大小
            if (audioBlob.size > this.config.uploadConfig.maxFileSize) {
                throw new Error(`文件大小超过限制 (${this.config.uploadConfig.maxFileSize / 1024 / 1024}MB)`);
            }
            
            // 检查文件类型
            if (!this.config.uploadConfig.allowedTypes.includes(audioBlob.type)) {
                throw new Error(`不支持的文件类型: ${audioBlob.type}`);
            }
            
            // 生成云存储文件名
            const cloudFileName = this.generateCloudFileName(filename);
            
            // 将Blob转换为Base64
            const base64 = await this.blobToBase64(audioBlob);
            
            // 构造上传参数
            const uploadParams = {
                fileData: base64,
                fileName: cloudFileName,
                cloudPath: cloudFileName,
                fileType: audioBlob.type
            };
            
            console.log('上传参数:', uploadParams);
            
            // 调用云函数上传
            const result = await this.uniCloudStorage.callCloudFunction('uploadAudio', uploadParams);
            console.log('云函数上传结果:', result);
            
            if (result.success) {
                const cloudFileUrl = result.data.fileId; // 这是完整的下载URL
                const simpleFileId = result.data.simpleFileId || cloudFileUrl.split('/').pop();
                
                console.log('文件上传成功，云存储URL:', cloudFileUrl);
                console.log('简化文件ID:', simpleFileId);
                
                // 保存云存储信息到localStorage
                this.saveCloudFileInfo(filename, {
                    cloudUrl: cloudFileUrl,
                    simpleFileId: simpleFileId,
                    cloudFileName: cloudFileName,
                    uploadTime: new Date().toISOString(),
                    fileSize: audioBlob.size,
                    fileType: audioBlob.type
                });
                
                return {
                    success: true,
                    cloudUrl: cloudFileUrl,
                    simpleFileId: simpleFileId,
                    playUrl: this.generatePlayUrl(cloudFileUrl, simpleFileId)
                };
            } else {
                throw new Error(result.message || '上传失败');
            }
            
        } catch (error) {
            console.error('❌ 上传音频文件失败:', error);
            
            // 提供详细的错误分析
            if (error.message.includes('403')) {
                console.error('🔒 403权限错误，可能的原因：');
                console.error('1. spaceId或clientSecret配置错误');
                console.error('2. uniCloud控制台中云存储权限未开启');
                console.error('3. 云空间状态异常');
                console.error('📋 建议：检查uniCloud控制台 > 云存储 > 权限设置');
            } else if (error.message.includes('404')) {
                console.error('🔍 404错误：云空间不存在或spaceId错误');
            } else if (error.message.includes('网络') || error.message.includes('NETWORK')) {
                console.error('🌐 网络错误：请检查网络连接');
            } else if (error.message.includes('文件大小')) {
                console.error('📦 文件大小超限：当前限制10MB');
            } else if (error.message.includes('文件类型')) {
                console.error('📄 文件类型不支持：仅支持音频文件');
            }
            
            console.error('🛠️ 请访问 云存储调试工具.html 进行详细诊断');
            throw error;
        }
    }
    
    // 生成云存储文件名
    generateCloudFileName(originalName) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = originalName.split('.').pop();
        return `${this.config.uploadConfig.path}${timestamp}_${randomStr}.${extension}`;
    }
    
    // 生成播放URL
    generatePlayUrl(cloudFileUrl, simpleFileId) {
        const playUrl = new URL(this.config.playPageUrl);
        playUrl.searchParams.set('cloudUrl', cloudFileUrl);
        playUrl.searchParams.set('fileId', simpleFileId);
        playUrl.searchParams.set('timestamp', Date.now());
        return playUrl.toString();
    }
    
    // Blob转Base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // 移除 data:audio/webm;base64, 前缀
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    // 保存云文件信息到localStorage
    saveCloudFileInfo(localKey, cloudInfo) {
        const cloudFiles = this.getCloudFiles();
        cloudFiles[localKey] = cloudInfo;
        localStorage.setItem('cloudFiles', JSON.stringify(cloudFiles));
    }
    
    // 获取云文件信息
    getCloudFiles() {
        try {
            return JSON.parse(localStorage.getItem('cloudFiles') || '{}');
        } catch {
            return {};
        }
    }
    
    // 获取特定文件的云信息
    getCloudFileInfo(localKey) {
        const cloudFiles = this.getCloudFiles();
        return cloudFiles[localKey] || null;
    }
    
    // 删除云文件信息
    removeCloudFileInfo(localKey) {
        const cloudFiles = this.getCloudFiles();
        delete cloudFiles[localKey];
        localStorage.setItem('cloudFiles', JSON.stringify(cloudFiles));
    }
    
    // 检查是否支持云存储上传
    isCloudUploadSupported() {
        return this.isInitialized && this.config.spaceId && this.config.clientSecret;
    }
    
    // 获取上传状态信息
    getUploadStatus() {
        return {
            isInitialized: this.isInitialized,
            isSupported: this.isCloudUploadSupported(),
            config: {
                maxFileSize: this.config.uploadConfig.maxFileSize,
                allowedTypes: this.config.uploadConfig.allowedTypes,
                provider: this.config.provider
            }
        };
    }
}

// 创建全局云存储实例
let cloudStorageManager = null;

// 初始化云存储管理器
function initCloudStorage() {
    if (typeof DCLOUD_CONFIG !== 'undefined') {
        cloudStorageManager = new CloudStorageManager(DCLOUD_CONFIG);
        console.log('云存储管理器初始化完成');
    } else {
        console.warn('Dcloud配置未找到，将使用本地存储');
    }
}

// 上传音频到云存储（带降级处理）
async function uploadAudioToCloud(audioBlob, filename) {
    if (!cloudStorageManager || !cloudStorageManager.isCloudUploadSupported()) {
        console.log('云存储不可用，使用本地存储');
        return {
            success: true,
            isCloudUpload: false,
            localUrl: URL.createObjectURL(audioBlob),
            playUrl: generateLocalPlayUrl(filename)
        };
    }
    
    try {
        const result = await cloudStorageManager.uploadAudioFile(audioBlob, filename);
        return {
            ...result,
            isCloudUpload: true
        };
    } catch (error) {
        console.error('云存储上传失败，降级到本地存储:', error);
        
        // 降级到本地存储
        return {
            success: true,
            isCloudUpload: false,
            localUrl: URL.createObjectURL(audioBlob),
            playUrl: generateLocalPlayUrl(filename),
            error: error.message
        };
    }
}

// 生成本地播放URL（降级方案）
function generateLocalPlayUrl(filename) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    let baseUrl;
    
    // 本地开发环境 - 保持localhost（在本地网络中使用）
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // 在本地开发时，对于移动设备访问，可以尝试使用局域网IP
        // 但对于大多数用途，直接使用localhost即可
        baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
    // Vercel或其他云平台 - 使用当前域名
    else {
        baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
    
    const timestamp = Date.now();
    return `${baseUrl}/play.html?id=${timestamp}&local=true`;
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保配置已加载
    setTimeout(initCloudStorage, 100);
});

// 导出到全局
window.CloudStorageManager = CloudStorageManager;
window.uploadAudioToCloud = uploadAudioToCloud;
} 