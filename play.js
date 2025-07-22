/**
 * 播放页面脚本 - 支持多种音频来源
 */

// 全局变量
let audioPlayer;
let currentAudioInfo = {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 初始化播放页面...');
    
    initializeElements();
    const audioInfo = getAudioInfoFromUrl();
    console.log('🔍 获取到的音频信息:', audioInfo);
    initializePlayPage(audioInfo);
});

// 初始化页面元素
function initializeElements() {
    audioPlayer = document.getElementById('audioPlayer');
    if (!audioPlayer) {
        console.error('❌ 找不到音频播放器元素');
        return;
    }
    
    // 设置音频播放器事件
    audioPlayer.addEventListener('loadeddata', onAudioLoaded);
    audioPlayer.addEventListener('error', onAudioError);
    audioPlayer.addEventListener('canplay', onAudioCanPlay);
}

// 从URL获取音频信息
function getAudioInfoFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 调试：打印所有URL参数
    console.log('🔍 所有URL参数:');
    for (let [key, value] of urlParams.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    const audioInfo = {
        cloudUrl: urlParams.get('cloudUrl'),
        fileId: urlParams.get('fileId'),
        id: urlParams.get('id'), // 兼容旧版本
        isCloud: urlParams.get('cloud') === 'true',
        local: urlParams.get('local') === 'true',
        title: urlParams.get('title') || '声纹作品',
        description: urlParams.get('description') || ''
    };
    
    console.log('📡 解析后的音频信息:', audioInfo);
    return audioInfo;
}

// 初始化播放页面
function initializePlayPage(audioInfo) {
    try {
        currentAudioInfo = audioInfo;
        
        // 检查是否有任何音频信息
        if (!audioInfo.cloudUrl && !audioInfo.fileId && !audioInfo.id) {
            throw new Error('未找到音频信息，请检查链接是否正确');
        }
        
        loadAudioData(audioInfo);
        
    } catch (error) {
        console.error('❌ 初始化播放页面失败:', error);
        showError('音频加载失败: ' + error.message);
    }
}

// 加载音频数据
function loadAudioData(audioInfo) {
    try {
        console.log('📡 加载音频数据...');
        
        // 优先级1: 云存储URL
        if (audioInfo.cloudUrl) {
            console.log('☁️ 从云存储加载音频...');
            loadCloudAudio(audioInfo.cloudUrl);
            return;
        }
        
        // 优先级2: 本地存储ID (新版本)
        if (audioInfo.fileId) {
            console.log('💾 从本地存储加载音频 (fileId)...');
            loadLocalAudio(audioInfo.fileId);
            return;
        }
        
        // 优先级3: 本地存储ID (旧版本兼容)
        if (audioInfo.id) {
            console.log('💾 从本地存储加载音频 (id)...');
            loadLocalAudio(audioInfo.id);
            return;
        }
        
        throw new Error('未找到有效的音频来源');
        
    } catch (error) {
        console.error('❌ 加载音频数据失败:', error);
        showError('加载音频数据失败: ' + error.message);
    }
}

// 加载云端音频
function loadCloudAudio(cloudUrl) {
    try {
        console.log('☁️ 云存储URL:', cloudUrl);
        
        // 确保URL是HTTPS
        if (cloudUrl && !cloudUrl.startsWith('https://')) {
            cloudUrl = cloudUrl.replace('http://', 'https://');
            console.log('🔒 强制使用HTTPS:', cloudUrl);
        }
        
        // 设置音频源
        audioPlayer.src = cloudUrl;
        
        // 更新状态
        updateStatus('正在加载云端音频...');
        
    } catch (error) {
        console.error('❌ 加载云端音频失败:', error);
        showError('云端音频加载失败: ' + error.message);
    }
}

// 加载本地音频
function loadLocalAudio(fileId) {
    try {
        console.log('💾 本地存储ID:', fileId);
        
        // 尝试多种存储键名
        let storedData = localStorage.getItem(`audio_${fileId}`);
        if (!storedData) {
            // 尝试旧版本的存储键名
            storedData = localStorage.getItem('recordedAudio');
        }
        
        if (!storedData) {
            throw new Error('本地音频数据不存在，可能已过期');
        }
        
        let audioData;
        try {
            audioData = JSON.parse(storedData);
        } catch (parseError) {
            // 如果不是JSON，可能是直接的Blob数据
            console.log('📦 检测到直接的Blob数据');
            const blob = new Blob([storedData], { type: 'audio/webm' });
            const blobUrl = URL.createObjectURL(blob);
            audioPlayer.src = blobUrl;
            updateStatus('正在加载本地音频...');
            return;
        }
        
        if (!audioData.audioBlob && !audioData.data) {
            throw new Error('音频数据格式错误');
        }
        
        // 创建Blob URL
        const audioBlob = audioData.audioBlob || audioData.data;
        const blob = new Blob([audioBlob], { type: audioData.type || 'audio/webm' });
        const blobUrl = URL.createObjectURL(blob);
        
        audioPlayer.src = blobUrl;
        
        // 更新状态
        updateStatus('正在加载本地音频...');
        
    } catch (error) {
        console.error('❌ 加载本地音频失败:', error);
        showError('本地音频加载失败: ' + error.message);
    }
}

// 音频加载完成
function onAudioLoaded() {
    console.log('✅ 音频加载完成');
    updateStatus('音频加载完成，可以播放');
    updateDisplayInfo(currentAudioInfo.title, currentAudioInfo.description);
}

// 音频可以播放
function onAudioCanPlay() {
    console.log('🎵 音频可以播放');
    updateStatus('音频准备就绪');
}

// 音频加载错误
function onAudioError(event) {
    console.error('❌ 音频播放错误:', event);
    console.error('错误详情:', audioPlayer.error);
    
    let errorMessage = '音频播放失败';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
    
    if (isWeChat) {
        errorMessage += '，微信浏览器限制较多，请点击右上角菜单选择"在浏览器中打开"';
    } else if (isMobile) {
        errorMessage += '，移动设备可能需要点击播放按钮才能播放';
    } else {
        errorMessage += '，可能是网络问题或音频格式不支持';
    }
    
    showError(errorMessage);
}

// 更新状态信息
function updateStatus(message) {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.innerHTML = message;
    }
}

// 更新显示信息
function updateDisplayInfo(title, description) {
    console.log('📝 更新显示信息:', { title, description });
    // 这里可以添加更多显示逻辑
}

// 显示错误信息
function showError(message) {
    console.error('❌ 错误:', message);
    
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.className = 'error-message';
        statusElement.innerHTML = `❌ ${message}`;
    }
}

// 显示成功信息
function showSuccess(message) {
    console.log('✅ 成功:', message);
    
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.className = 'success-message';
        statusElement.innerHTML = `✅ ${message}`;
    }
}

// 复制链接
function copyLink() {
    try {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showSuccess('链接已复制到剪贴板');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('链接已复制到剪贴板');
        });
    } catch (error) {
        console.error('复制链接失败:', error);
        showError('复制链接失败');
    }
}

// 下载音频
function downloadAudio() {
    try {
        if (!audioPlayer.src) {
            showError('没有可下载的音频');
            return;
        }
        
        const link = document.createElement('a');
        link.href = audioPlayer.src;
        link.download = currentAudioInfo.title || '声纹作品';
        
        // 如果是Blob URL，需要特殊处理
        if (audioPlayer.src.startsWith('blob:')) {
            // 对于Blob URL，我们无法直接下载，提示用户
            showError('本地音频无法直接下载，请使用录音功能重新录制');
            return;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('下载已开始');
        
    } catch (error) {
        console.error('下载音频失败:', error);
        showError('下载失败');
    }
} 