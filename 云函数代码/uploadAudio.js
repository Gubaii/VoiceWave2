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
    console.log('🚀 uploadAudio云函数被调用');
    console.log('📦 完整event对象:', JSON.stringify(event, null, 2));
    console.log('📋 参数详情:', {
        fileName: event.fileName,
        cloudPath: event.cloudPath,
        fileType: event.fileType,
        spaceId: event.spaceId,
        hasFileData: !!event.fileData,
        fileDataLength: event.fileData ? event.fileData.length : 0,
        httpMethod: event.httpMethod,
        body: event.body ? typeof event.body : 'undefined'
    });
    
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
                        message: '请求体格式错误: ' + parseError.message,
                        data: null
                    })
                };
            }
        }
        
        const { fileData, fileName, cloudPath, fileType, spaceId, clientSecret } = params;
        
        // 验证必要参数
        if (!fileData || !fileName || !cloudPath) {
            console.error('❌ 缺少必要参数:', { 
                fileData: !!fileData, 
                fileName, 
                cloudPath,
                receivedParams: Object.keys(event)
            });
                    return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                code: -1,
                message: '缺少必要参数：fileData, fileName, cloudPath',
                data: null
            })
        };
        }
        
        // 验证文件数据
        if (typeof fileData !== 'string' || fileData.length === 0) {
            console.error('❌ 无效的文件数据');
                    return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                code: -1,
                message: '无效的文件数据',
                data: null
            })
        };
        }
        
        console.log('📁 开始处理文件上传:', {
            fileName,
            cloudPath,
            fileType,
            fileDataLength: fileData.length
        });
        
        // 将base64转换为Buffer
        let fileBuffer;
        try {
            fileBuffer = Buffer.from(fileData, 'base64');
            console.log('✅ 文件转换成功, 大小:', Math.round(fileBuffer.length / 1024) + 'KB');
        } catch (error) {
            console.error('❌ base64转换失败:', error);
                    return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                code: -1,
                message: 'base64数据转换失败: ' + error.message,
                data: null
            })
        };
        }
        
        // 验证文件大小 (10MB限制)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fileBuffer.length > maxSize) {
            console.error('❌ 文件过大:', Math.round(fileBuffer.length / 1024 / 1024) + 'MB');
                    return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                code: -1,
                message: `文件过大，最大支持10MB，当前文件: ${Math.round(fileBuffer.length / 1024 / 1024)}MB`,
                data: null
            })
        };
        }
        
        console.log('☁️ 开始上传文件到云存储:', cloudPath);
        
        // 上传文件到云存储
        const uploadResult = await uniCloud.uploadFile({
            cloudPath: cloudPath,
            fileContent: fileBuffer
        });
        
        console.log('✅ 云存储上传成功:', {
            fileID: uploadResult.fileID,
            downloadURL: uploadResult.downloadURL
        });
        
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                code: 0,
                message: '上传成功',
                data: {
                    fileId: uploadResult.fileID,
                    downloadURL: uploadResult.downloadURL,
                    cloudPath: cloudPath,
                    fileName: fileName,
                    fileSize: fileBuffer.length,
                    uploadTime: new Date().toISOString(),
                    // 添加一个简化的文件ID用于后续操作
                    simpleFileId: uploadResult.fileID.split('/').pop()
                }
            })
        };
        
    } catch (error) {
        console.error('❌ uploadAudio云函数执行失败:', error);
        
        // 详细错误分析
        let errorMessage = '上传失败: ';
        let errorCode = -1;
        
        if (error.code) {
            switch (error.code) {
                case 'INVALID_PARAM':
                    errorMessage += '参数错误，请检查文件格式';
                    break;
                case 'PERMISSION_ERROR':
                    errorMessage += '权限错误，请检查云存储权限设置';
                    break;
                case 'NETWORK_ERROR':
                    errorMessage += '网络错误，请稍后重试';
                    break;
                case 'STORAGE_FULL':
                    errorMessage += '存储空间不足';
                    break;
                case 'policy_does_not_allow_file_overwrite':
                    errorMessage += '文件已存在，不允许覆盖';
                    break;
                default:
                    errorMessage += error.message || error.code;
            }
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += '未知错误';
        }
        
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                code: errorCode,
                message: errorMessage,
                data: null,
                error: {
                    type: error.constructor.name,
                    message: error.message,
                    stack: error.stack
                }
            })
        };
    }
}; 