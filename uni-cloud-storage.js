/**
 * DCloud云存储专用SDK
 * 只通过调用云函数的方式实现文件上传 - 禁止模拟上传
 */

class UniCloudStorage {
    constructor(spaceId, clientSecret) {
        this.spaceId = spaceId || (window.DCLOUD_CONFIG && window.DCLOUD_CONFIG.spaceId);
        this.clientSecret = clientSecret || (window.DCLOUD_CONFIG && window.DCLOUD_CONFIG.clientSecret);
        
        console.log('🚀 DCloud云函数存储SDK已初始化');
        console.log('📦 服务空间ID:', this.spaceId);
        console.log('⚠️ 禁用模拟上传，只使用真实DCloud云函数上传');
    }

    async upload(file) {
        console.log('🚀 开始通过云函数上传:', file.name, '大小:', Math.round(file.size/1024) + 'KB');
        
        if (!file || !file.size) {
            throw new Error('无效的文件');
        }

        if (!this.spaceId || !this.clientSecret) {
            throw new Error('DCloud配置不完整，请检查spaceId和clientSecret');
        }

        try {
            const result = await this.uploadViaCloudFunction(file);
            
            if (result.success) {
                console.log('✅ 云函数上传成功!');
                console.log('🔗 文件URL:', result.url);
                
                return {
                    success: true,
                    data: {
                        target: result.url,
                        fileId: result.fileId,
                        url: result.url
                    },
                    message: 'DCloud云存储上传成功',
                    provider: 'DCloud云存储'
                };
            } else {
                throw new Error(result.message || 'DCloud上传失败');
            }
        } catch (error) {
            console.error('❌ 云函数上传失败:', error);
            throw error;
        }
    }

    // 通过云函数上传文件
    async uploadViaCloudFunction(file) {
        console.log('📡 通过云函数上传文件...');
        
        try {
            // 生成文件路径
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            const filename = `voice_${timestamp}_${random}.webm`;
            const cloudPath = `voicewave-audio/${filename}`;
            
            console.log('📄 云存储路径:', cloudPath);
            
            // 将文件转换为base64
            const base64Data = await this.fileToBase64(file);
            
            // 调用云函数
            const result = await this.callCloudFunction('uploadAudio', {
                fileData: base64Data,
                fileName: filename,
                cloudPath: cloudPath,
                fileType: file.type
            });
            
            if (result.success) {
                const playUrl = this.generatePlayUrl(result.data.fileId);
                
                return {
                    success: true,
                    url: playUrl,
                    fileId: result.data.fileId,
                    cloudPath: cloudPath,
                    downloadURL: result.data.downloadURL
                };
            } else {
                throw new Error(result.message || '云函数上传失败');
            }
            
        } catch (error) {
            console.error('云函数上传错误:', error);
            throw error;
        }
    }

    // 调用云函数
    async callCloudFunction(functionName, params) {
        console.log('📞 调用云函数:', functionName);
        
        try {
            // 构建云函数调用URL - 使用正确的DCloud HTTP触发器格式
            const cloudFunctionUrl = this.buildCloudFunctionUrl(functionName);
            
            console.log('🌐 云函数URL:', cloudFunctionUrl);
            
            const response = await fetch(cloudFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'VoiceWave-HTML-App/1.0'
                },
                body: JSON.stringify(params)
            });

            console.log('📡 云函数响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ 云函数HTTP错误:', errorText);
                throw new Error(`云函数调用失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📦 云函数返回结果:', result);
            
            // 处理HTTP响应格式
            if (response.ok) {
                // 解析云函数响应格式
                let responseData;
                if (result.statusCode && result.body) {
                    // 新的HTTP响应格式
                    responseData = JSON.parse(result.body);
                    console.log('解析后的响应数据:', responseData);
                } else {
                    // 直接的JSON格式
                    responseData = typeof result === 'string' ? JSON.parse(result) : result;
                }
                
                if (responseData.code === 0) {
                    console.log('✅ 云函数调用成功');
                    return { success: true, data: responseData.data, message: responseData.message };
                } else {
                    console.error('❌ 云函数执行失败:', responseData.message);
                    throw new Error(responseData.message || '云函数执行失败');
                }
            } else {
                console.error('❌ HTTP请求失败:', response.status, response.statusText);
                throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ 云函数调用失败:', error);
            
            // 详细的错误分析
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                throw new Error('无法连接到DCloud云函数，请检查：\n1. 云函数是否已部署\n2. HTTP触发器是否已配置\n3. 网络连接是否正常\n4. 域名是否正确');
            } else if (error.message.includes('404')) {
                throw new Error('云函数不存在，请检查：\n1. 云函数名称是否正确\n2. 云函数是否已部署\n3. HTTP触发器是否已开启');
            } else if (error.message.includes('403')) {
                throw new Error('云函数访问被拒绝，请检查：\n1. HTTP触发器权限设置\n2. 云函数是否已发布');
            } else {
                throw new Error('DCloud云函数执行失败：' + error.message);
            }
        }
    }

    // 构建云函数URL - 修复为正确的DCloud格式
    buildCloudFunctionUrl(functionName) {
        // DCloud云函数的HTTP触发器URL格式
        // 正确格式: https://fc-mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81.next.bspapp.com/{functionName}
        return `https://fc-mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81.next.bspapp.com/${functionName}`;
    }

    // 生成播放URL
    generatePlayUrl(fileId) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        
        let baseUrl;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
        } else {
            baseUrl = `${protocol}//${hostname}`;
        }
        
        return `${baseUrl}/play.html?cloudFileId=${encodeURIComponent(fileId)}&provider=dcloud`;
    }

    // 文件转Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除data:xxx;base64,前缀，只保留base64数据
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 删除文件
    async delete(fileId) {
        console.log('🗑️ 删除文件:', fileId);
        
        try {
            const result = await this.callCloudFunction('deleteAudio', {
                fileId: fileId
            });
            
            if (result.success) {
                console.log('✅ 文件删除成功');
                return { success: true, data: result.data };
            } else {
                throw new Error(result.message || '删除失败');
            }
            
        } catch (error) {
            console.error('删除文件失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取文件信息
    async getFileInfo(fileId) {
        console.log('ℹ️ 获取文件信息:', fileId);
        
        try {
            const result = await this.callCloudFunction('getAudioInfo', {
                fileId: fileId
            });
            
            if (result.success) {
                console.log('✅ 获取文件信息成功');
                return { success: true, data: result.data };
            } else {
                throw new Error(result.message || '获取信息失败');
            }
            
        } catch (error) {
            console.error('获取文件信息失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 简化的测试方法
    async testUpload() {
        console.log('🧪 测试云函数上传...');
        
        // 创建测试文件
        const testBlob = new Blob(['test audio data'], { type: 'audio/webm' });
        const testFile = new File([testBlob], 'test.webm', { type: 'audio/webm' });
        
        try {
            const result = await this.upload(testFile);
            console.log('✅ 测试成功:', result);
            return result;
        } catch (error) {
            console.error('❌ 测试失败:', error);
            throw error;
        }
    }

    // 检查配置
    checkConfig() {
        const config = {
            spaceId: this.spaceId,
            clientSecret: this.clientSecret ? '已配置' : '未配置',
            valid: !!(this.spaceId && this.clientSecret),
            cloudFunctionUrl: this.spaceId ? this.buildCloudFunctionUrl('uploadAudio') : '未配置',
            uploadMode: '仅DCloud云函数上传（禁用模拟上传）'
        };
        
        console.log('🔍 DCloud配置检查:', config);
        return config;
    }

    // 获取云函数部署指南
    getDeploymentGuide() {
        return {
            title: 'DCloud云函数部署指南',
            steps: [
                '1. 在DCloud开发者中心创建云函数',
                '2. 创建 uploadAudio 云函数',
                '3. 在云函数中使用 uniCloud.uploadFile API',
                '4. 设置HTTP触发器',
                '5. 部署云函数到服务空间'
            ],
            example: `
// 云函数示例代码 (uploadAudio)
'use strict';
exports.main = async (event, context) => {
    const { fileData, fileName, cloudPath, fileType } = event;
    
    // 将base64转换为Buffer
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // 上传到云存储
    const result = await uniCloud.uploadFile({
        cloudPath: cloudPath,
        fileContent: fileBuffer
    });
    
    return {
        code: 0,
        data: {
            fileId: result.fileID,
            downloadURL: result.downloadURL
        }
    };
};
            `
        };
    }

    // 兼容旧接口
    async getFileList(options = {}) {
        console.log('📋 获取文件列表:', options);
        return { success: true, data: [] };
    }

    getDownloadUrl(fileId) {
        console.log('🔗 获取下载URL:', fileId);
        return this.generatePlayUrl(fileId);
    }
}

// 导出到全局
window.UniCloudStorage = UniCloudStorage;

// 兼容性检查
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniCloudStorage;
}

console.log('🚀 DCloud云函数存储SDK已加载 (仅支持真实DCloud云函数上传)'); 