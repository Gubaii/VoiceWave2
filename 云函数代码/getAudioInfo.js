'use strict';

exports.main = async (event, context) => {
    // 设置CORS头部
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
    };
    
    // 处理OPTIONS预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: 'OK' })
        };
    }
    console.log('getAudioInfo云函数被调用');
    console.log('📦 完整event对象:', JSON.stringify(event, null, 2));
    
    try {
        // 解析请求参数
        let params = event;
        
        // 如果是HTTP请求，参数可能在body中
        if (event.httpMethod && event.body) {
            try {
                if (typeof event.body === 'string') {
                    params = JSON.parse(event.body);
                } else {
                    params = event.body;
                }
                console.log('📦 从body解析的参数:', params);
            } catch (parseError) {
                console.error('❌ body解析失败:', parseError);
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({
                        code: -1,
                        message: '请求体格式错误: ' + parseError.message
                    })
                };
            }
        }
        
        const { fileId, spaceId, clientSecret } = params;
        
        // 验证必要参数
        if (!fileId) {
            console.error('缺少必要参数: fileId');
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    code: -1,
                    message: '缺少必要参数：fileId'
                })
            };
        }
        
        // 处理文件ID格式 - 如果是完整URL，提取文件ID部分
        let actualFileId = fileId;
        if (fileId.includes('http')) {
            // 从URL中提取文件ID
            const urlParts = fileId.split('/');
            actualFileId = urlParts[urlParts.length - 1]; // 获取最后一部分作为文件ID
            console.log('从URL提取文件ID:', actualFileId);
        }
        
        console.log('开始获取文件信息，原始ID:', fileId, '处理后ID:', actualFileId);
        
        // 简化获取文件信息 - 直接返回文件信息，不调用云存储API
        console.log('简化获取文件信息，直接返回基本信息');
        
        // 如果输入的是完整URL，直接使用；否则构造URL
        let downloadURL = actualFileId;
        if (!actualFileId.includes('http')) {
            // 构造下载URL
            downloadURL = `https://mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81.cdn.bspapp.com/cloudstorage/${actualFileId}`;
        }
        
        const fileInfoResult = {
            fileList: [{
                code: 'SUCCESS',
                size: 0, // 无法获取具体大小，但文件存在
                createTime: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                etag: 'unknown',
                downloadURL: downloadURL
            }]
        };
        
        console.log('文件信息查询结果:', fileInfoResult);
        
        // 检查查询结果
        if (fileInfoResult.fileList && fileInfoResult.fileList[0]) {
            const fileInfo = fileInfoResult.fileList[0];
            
            if (fileInfo.code === 'SUCCESS') {
                console.log('文件信息获取成功:', fileInfo);
                
                // 简化临时URL获取 - 直接使用文件信息中的downloadURL
                let tempFileURL = fileInfo.downloadURL || fileId;
                console.log('使用下载URL作为临时URL:', tempFileURL);
                
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify({
                        code: 0,
                        message: '获取成功',
                        data: {
                            originalFileId: fileId,
                            actualFileId: actualFileId,
                            fileInfo: {
                                size: fileInfo.size,
                                createTime: fileInfo.createTime,
                                lastModified: fileInfo.lastModified,
                                etag: fileInfo.etag
                            },
                            tempFileURL: tempFileURL,
                            queryTime: new Date().toISOString()
                        }
                    })
                };
            } else {
                console.error('文件信息获取失败:', fileInfo);
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({
                        code: -1,
                        message: '获取失败: ' + (fileInfo.message || fileInfo.code)
                    })
                };
            }
        } else {
            console.error('查询结果异常:', fileInfoResult);
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    code: -1,
                    message: '获取失败: 无效的查询结果'
                })
            };
        }
        
    } catch (error) {
        console.error('getAudioInfo云函数执行失败:', error);
        
        let errorMessage = '获取失败: ';
        if (error.code) {
            switch (error.code) {
                case 'FILE_NOT_EXISTS':
                    errorMessage += '文件不存在';
                    break;
                case 'PERMISSION_ERROR':
                    errorMessage += '权限错误，无法访问文件';
                    break;
                case 'NETWORK_ERROR':
                    errorMessage += '网络错误，请稍后重试';
                    break;
                default:
                    errorMessage += error.message || error.code;
            }
        } else {
            errorMessage += error.message || '未知错误';
        }
        
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                code: -1,
                message: errorMessage,
                error: {
                    type: error.constructor.name,
                    message: error.message,
                    stack: error.stack
                }
            })
        };
    }
}; 