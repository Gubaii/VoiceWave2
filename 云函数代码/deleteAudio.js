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
    console.log('deleteAudio云函数被调用');
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
        
        console.log('开始删除云存储文件，原始ID:', fileId, '处理后ID:', actualFileId);
        
        // 删除云存储文件 - 使用cloudPath而不是fileId
        // 根据DCloud文档，删除文件需要使用cloudPath
        const cloudPath = `voicewave-audio/${actualFileId}`;
        console.log('使用cloudPath删除文件:', cloudPath);
        
        const deleteResult = await uniCloud.deleteFile({
            fileList: [cloudPath]
        });
        
        console.log('云存储删除结果:', deleteResult);
        
        // 检查删除结果
        if (deleteResult.fileList && deleteResult.fileList[0]) {
            const fileResult = deleteResult.fileList[0];
            if (fileResult.code === 'SUCCESS') {
                console.log('文件删除成功:', fileId);
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify({
                        code: 0,
                        message: '删除成功',
                        data: {
                            originalFileId: fileId,
                            actualFileId: actualFileId,
                            cloudPath: cloudPath,
                            deleteTime: new Date().toISOString()
                        }
                    })
                };
            } else {
                console.error('文件删除失败:', fileResult);
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({
                        code: -1,
                        message: '删除失败: ' + (fileResult.message || fileResult.code)
                    })
                };
            }
        } else {
            console.error('删除结果异常:', deleteResult);
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    code: -1,
                    message: '删除失败: 无效的删除结果'
                })
            };
        }
        
    } catch (error) {
        console.error('deleteAudio云函数执行失败:', error);
        
        let errorMessage = '删除失败: ';
        if (error.code) {
            switch (error.code) {
                case 'FILE_NOT_EXISTS':
                    errorMessage += '文件不存在';
                    break;
                case 'PERMISSION_ERROR':
                    errorMessage += '权限错误，无法删除文件';
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