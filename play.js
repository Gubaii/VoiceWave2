/**
 * 播放页面脚本 - 支持多种音频来源
 */

// 全局变量
let audioPlayer;
let isPlaying = false;
let currentTimeDisplay;
let durationDisplay;
let progressBar;
let progressContainer;

// 音频信息
let currentAudioInfo = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 初始化播放页面...');
    
    // 检测微信环境并显示提示
    detectWeChatEnvironment();
    
    initializeElements();
    const audioInfo = getAudioInfoFromUrl();
    initializePlayPage(audioInfo);
});

// 检测微信环境
function detectWeChatEnvironment() {
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
    if (isWeChat) {
        console.log('📱 检测到微信环境');
        
        // 显示微信提示
        const wechatTip = document.createElement('div');
        wechatTip.className = 'wechat-tip';
        wechatTip.innerHTML = `
            <div style="
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                font-size: 14px;
                color: #856404;
                text-align: center;
            ">
                <strong>微信提示：</strong>如果音频无法播放，请点击右上角菜单选择"在浏览器中打开"
            </div>
        `;
        
        // 插入到页面顶部
        const container = document.querySelector('.play-container') || document.body;
        container.insertBefore(wechatTip, container.firstChild);
    }
}

// 显示移动设备播放提示
function showMobilePlayHint() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    
    if (isMobile && !document.querySelector('.mobile-play-hint')) {
        console.log('📱 显示移动设备播放提示');
        
        const mobileTip = document.createElement('div');
        mobileTip.className = 'mobile-play-hint';
        mobileTip.innerHTML = `
            <div style="
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                font-size: 14px;
                color: #155724;
                text-align: center;
            ">
                <strong>播放提示：</strong>${isSafari ? 'Safari浏览器需要点击播放按钮才能播放音频' : '移动设备请点击播放按钮开始播放'}
            </div>
        `;
        
        // 插入到页面顶部
        const container = document.querySelector('.play-container') || document.body;
        container.insertBefore(mobileTip, container.firstChild);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (mobileTip.parentNode) {
                mobileTip.parentNode.removeChild(mobileTip);
            }
        }, 5000);
    }
}

// 获取页面元素
function initializeElements() {
    audioPlayer = document.getElementById('audioPlayer');
    currentTimeDisplay = document.getElementById('currentTime');
    durationDisplay = document.getElementById('duration');
    progressBar = document.getElementById('progressBar');
    progressContainer = document.getElementById('progressContainer');
    
    setupAudioControls();
}

// 从URL参数获取音频信息
function getAudioInfoFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
        id: urlParams.get('id'),
        cloudUrl: urlParams.get('cloudUrl') || urlParams.get('audioUrl'), // 支持新的audioUrl参数
        fileId: urlParams.get('fileId'), // 新增：文件ID
        title: urlParams.get('title'), // 新增：标题
        description: urlParams.get('description'), // 新增：描述
        waveformImage: urlParams.get('waveformImage'), // 新增：声纹图片URL
        isLocal: urlParams.get('local') === 'true',
        isCloud: urlParams.get('cloud') === 'true', // 新增：云端音频标识
        selfHosted: urlParams.get('selfHosted') // 自建存储标识
    };
}

// 初始化播放页面
function initializePlayPage(audioInfo) {
    console.log('🔍 音频信息:', audioInfo);
    currentAudioInfo = audioInfo;
    
    if (!audioInfo || (!audioInfo.id && !audioInfo.cloudUrl && !audioInfo.selfHosted)) {
        showError('无效的音频链接');
        return;
    }
    
    // 优先显示声纹图片
    if (audioInfo.waveformImage) {
        displayWaveformImage(audioInfo.waveformImage);
    }
    
    loadAudioData(audioInfo);
}

// 加载音频数据
async function loadAudioData(audioInfo) {
    try {
        console.log('📡 加载音频数据...');
        
        // 优先级1: 自建存储
        if (audioInfo.selfHosted) {
            console.log('🏠 从自建存储加载音频...');
            await loadSelfHostedAudio(audioInfo.selfHosted);
            return;
        }
        
        // 优先级2: 云存储URL（直接从URL参数获取）
        if (audioInfo.cloudUrl) {
            console.log('☁️ 从云存储加载音频...');
            await loadCloudAudio(audioInfo.cloudUrl);
            return;
        }
        
        // 优先级3: 云端短ID（从localStorage获取云端URL）
        if (audioInfo.isCloud && audioInfo.id) {
            console.log('☁️ 从云端短ID加载音频...');
            await loadCloudAudioFromShortId(audioInfo.id);
            return;
        }
        
        // 优先级4: 本地存储ID
        if (audioInfo.id) {
            console.log('💾 从本地存储加载音频...');
            await loadLocalAudio(audioInfo.id);
            return;
        }
        
        throw new Error('未找到有效的音频来源');
        
    } catch (error) {
        console.error('❌ 加载音频失败:', error);
        showError('加载音频失败: ' + error.message);
    }
}

// 加载自建存储的音频
async function loadSelfHostedAudio(fileKey) {
    try {
        const audioData = localStorage.getItem(`audio_${fileKey}`);
        
        if (!audioData) {
            throw new Error('音频文件不存在');
        }
        
        const data = JSON.parse(audioData);
        console.log('📦 自建存储音频数据:', data);
        
        // 设置音频播放器
        audioPlayer.src = data.data; // Base64 data URL
        audioPlayer.addEventListener('loadeddata', () => {
            console.log('✅ 自建存储音频加载完成');
            updateDisplayInfo(data.name || '我的声纹');
            generateMockWaveform();
        });
        
        audioPlayer.addEventListener('error', (e) => {
            console.error('❌ 音频播放错误:', e);
            showError('音频播放失败');
        });
        
        // 更新页面信息
        updatePageTitle(data.name || '我的声纹');
        
    } catch (error) {
        console.error('❌ 加载自建存储音频失败:', error);
        throw error;
    }
}

// 从云端短ID加载音频
async function loadCloudAudioFromShortId(shortId) {
    try {
        console.log('🔍 通过短ID查找云端音频:', shortId);
        
        // 从localStorage获取云端音频信息
        const isCloudAudio = localStorage.getItem('isCloudAudio') === 'true';
        const cloudAudioUrl = localStorage.getItem('cloudAudioUrl');
        const simpleFileId = localStorage.getItem('simpleFileId');
        
        // 验证短ID是否匹配
        if (!isCloudAudio || !cloudAudioUrl) {
            throw new Error('云端音频信息不存在');
        }
        
        if (simpleFileId && simpleFileId !== shortId) {
            throw new Error('音频ID不匹配');
        }
        
        console.log('✅ 找到云端音频URL:', cloudAudioUrl);
        
        // 使用云端URL加载音频
        await loadCloudAudio(cloudAudioUrl);
        
    } catch (error) {
        console.error('❌ 从云端短ID加载音频失败:', error);
        throw error;
    }
}

// 加载云存储音频
async function loadCloudAudio(cloudUrl) {
    try {
        console.log('☁️ 云存储URL:', cloudUrl);
        
        // 检测移动设备环境
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
        
        console.log('📱 设备检测:', { isMobile, isWeChat, isSafari });
        
        // 确保URL是HTTPS
        if (cloudUrl && !cloudUrl.startsWith('https://')) {
            cloudUrl = cloudUrl.replace('http://', 'https://');
            console.log('🔒 强制使用HTTPS:', cloudUrl);
        }
        
        // 移动设备特殊处理
        if (isMobile) {
            console.log('📱 移动设备，使用特殊加载策略');
            
            // 先尝试预加载音频
            try {
                const response = await fetch(cloudUrl, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                console.log('✅ 音频URL可访问');
            } catch (fetchError) {
                console.error('❌ 音频URL无法访问:', fetchError);
                throw new Error('音频文件无法访问，请检查网络连接');
            }
        }
        
        // 设置音频源
        audioPlayer.src = cloudUrl;
        
        // 添加加载事件监听器
        audioPlayer.addEventListener('loadeddata', () => {
            console.log('✅ 云存储音频加载完成');
            
            // 使用传入的标题和描述，或使用默认值
            const title = currentAudioInfo.title || '云端声纹';
            const description = currentAudioInfo.description;
            
            updateDisplayInfo(title, description);
            generateMockWaveform();
            
            // 移动设备显示播放提示
            if (isMobile) {
                showMobilePlayHint();
            }
        });
        
        // 添加错误处理
        audioPlayer.addEventListener('error', (e) => {
            console.error('❌ 音频播放错误:', e);
            console.error('错误详情:', audioPlayer.error);
            
            let errorMessage = '无法播放云端音频';
            if (isWeChat) {
                errorMessage += '，微信浏览器限制较多，请点击右上角菜单选择"在浏览器中打开"';
            } else if (isSafari) {
                errorMessage += '，Safari可能需要用户交互才能播放，请点击播放按钮';
            } else if (isMobile) {
                errorMessage += '，移动设备可能需要点击播放按钮才能播放';
            } else {
                errorMessage += '，可能是网络问题或音频格式不支持';
            }
            
            showError(errorMessage);
        });
        
        // 添加加载超时处理
        const loadTimeout = setTimeout(() => {
            if (audioPlayer.readyState < 2) { // HAVE_CURRENT_DATA
                console.warn('⚠️ 音频加载超时');
                showError('音频加载超时，请检查网络连接');
            }
        }, 15000); // 15秒超时
        
        audioPlayer.addEventListener('loadeddata', () => {
            clearTimeout(loadTimeout);
        });
        
        // 立即更新页面标题
        const title = currentAudioInfo.title || '云端声纹';
        updatePageTitle(title);
        
    } catch (error) {
        console.error('❌ 加载云存储音频失败:', error);
        throw error;
    }
}

// 加载本地存储音频
async function loadLocalAudio(audioId) {
    try {
        const audioBlob = localStorage.getItem('recordedAudio');
        const recognizedText = localStorage.getItem('recognizedText');
        
        if (!audioBlob) {
            throw new Error('本地音频数据不存在');
        }
        
        console.log('💾 加载本地音频，ID:', audioId);
        
        // 从本地存储恢复音频
        const blob = await fetch(audioBlob).then(r => r.blob());
        const audioUrl = URL.createObjectURL(blob);
        
        audioPlayer.src = audioUrl;
        audioPlayer.addEventListener('loadeddata', () => {
            console.log('✅ 本地音频加载完成');
            updateDisplayInfo(recognizedText || '我的声纹');
            generateMockWaveform();
        });
        
        updatePageTitle('我的声纹');
        
    } catch (error) {
        console.error('❌ 加载本地音频失败:', error);
        throw error;
    }
}

// 更新显示信息
function updateDisplayInfo(title, description) {
    // 更新文字内容
    if (description) {
        loadTextContent(description);
    } else {
        loadTextContent(title);
    }
    
    // 生成播放URL（用于分享）
    generateAudioPlayUrl();
}

// 加载文字内容（用于页面标题）
function loadTextContent(defaultTitle = '我的声纹') {
    // 尝试从localStorage获取自定义文字
    const customText = localStorage.getItem('customText');
    const recognizedText = localStorage.getItem('recognizedText');
    
    // 优先级：自定义文字 > 识别文字 > 传入的标题 > 默认标题
    const finalText = customText || recognizedText || defaultTitle;
    
    console.log('📝 加载文字内容:', finalText);
    
    // 更新页面标题
    updatePageTitle(finalText);
}

// 更新页面标题
function updatePageTitle(title) {
    document.title = `${title} - 声纹可视化`;
    
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// 生成音频播放URL
function generateAudioPlayUrl() {
    try {
        let playUrl;
        
        if (currentAudioInfo.selfHosted) {
            // 自建存储URL
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const port = window.location.port;
            
            let baseUrl;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
            } else {
                baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
            }
            
            playUrl = `${baseUrl}/play.html?selfHosted=${currentAudioInfo.selfHosted}`;
        } else if (currentAudioInfo.cloudUrl) {
            // 云存储URL
            playUrl = window.location.href;
        } else {
            // 本地存储URL
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const port = window.location.port;
            
            let baseUrl;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
            } else {
                baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
            }
            
            const timestamp = currentAudioInfo.id || localStorage.getItem('recordingTimestamp') || Date.now();
            playUrl = `${baseUrl}/play.html?id=${timestamp}`;
        }
        
        console.log('🔗 生成播放URL:', playUrl);
        
        // 更新分享链接
        const shareUrlElement = document.getElementById('shareUrl');
        if (shareUrlElement) {
            shareUrlElement.value = playUrl;
        }
        
        return playUrl;
        
    } catch (error) {
        console.error('❌ 生成播放URL失败:', error);
        return window.location.href;
    }
}

// 设置音频控件
function setupAudioControls() {
    // 播放/暂停按钮
    const playButton = document.getElementById('playBtn');
    if (playButton) {
        playButton.addEventListener('click', togglePlay);
    }
    
    // 进度条点击
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            
            if (audioPlayer.duration) {
                audioPlayer.currentTime = progress * audioPlayer.duration;
            }
        });
    }
    
    // 音频事件监听
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (durationDisplay) {
                durationDisplay.textContent = formatTime(audioPlayer.duration);
            }
        });
        
        audioPlayer.addEventListener('loadeddata', () => {
            if (durationDisplay && audioPlayer.duration) {
                durationDisplay.textContent = formatTime(audioPlayer.duration);
            }
        });
        
        audioPlayer.addEventListener('canplay', () => {
            if (durationDisplay && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                durationDisplay.textContent = formatTime(audioPlayer.duration);
            }
        });
        
        audioPlayer.addEventListener('play', () => {
            isPlaying = true;
            updatePlayButton();
        });
        
        audioPlayer.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayButton();
        });
        
        audioPlayer.addEventListener('error', (e) => {
            console.error('音频加载错误:', e);
            if (durationDisplay) {
                durationDisplay.textContent = '0:00';
            }
        });
    }
}

// 切换播放/暂停
function togglePlay() {
    if (!audioPlayer) return;
    
    // 检测移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        // 移动设备特殊处理
        if (isMobile) {
            console.log('📱 移动设备播放请求');
            
            // 确保音频已加载
            if (audioPlayer.readyState < 2) {
                console.log('⚠️ 音频未完全加载，等待加载完成');
                showNotification('音频正在加载，请稍后重试', 'info');
                return;
            }
            
            // Safari特殊处理
            if (isSafari) {
                console.log('🍎 Safari浏览器播放');
                // Safari需要用户交互，这里已经满足了条件
            }
        }
        
        audioPlayer.play().catch(error => {
            console.error('播放失败:', error);
            
            let errorMessage = '音频播放失败';
            if (isMobile) {
                errorMessage += '，移动设备可能需要用户交互才能播放';
            }
            
            showError(errorMessage);
        });
    }
}

// 更新播放按钮
function updatePlayButton() {
    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.textContent = isPlaying ? '⏸️ 暂停' : '▶️ 播放';
    }
}

// 更新进度
function updateProgress() {
    if (!audioPlayer) return;
    
    // 更新当前时间
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    }
    
    // 更新总时长（如果还没有设置）
    if (durationDisplay && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
        durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
    
    // 更新进度条
    if (progressBar && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
        const progress = audioPlayer.currentTime / audioPlayer.duration;
        progressBar.style.width = (progress * 100) + '%';
    }
}

// 格式化时间
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 生成模拟波形


// 显示声纹图片
function displayWaveformImage(imageUrl) {
    console.log('🖼️ 显示声纹图片:', imageUrl);
    
    const waveformImage = document.getElementById('waveformImage');
    
    if (waveformImage) {
        waveformImage.style.display = 'block';
        waveformImage.src = imageUrl;
        
        // 设置图片样式
        waveformImage.style.width = '100%';
        waveformImage.style.height = 'auto';
        waveformImage.style.maxHeight = '400px';
        waveformImage.style.objectFit = 'contain';
        waveformImage.style.borderRadius = '8px';
    }
}

// 显示错误信息
function showError(message) {
    console.error('❌ 错误:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f87171;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: bold;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 复制分享链接
function copyShareUrl() {
    const shareUrlElement = document.getElementById('shareUrl');
    if (shareUrlElement) {
        shareUrlElement.select();
        shareUrlElement.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showNotification('✅ 链接已复制到剪贴板！');
        } catch (err) {
            console.error('复制失败:', err);
            showNotification('❌ 复制失败，请手动复制');
        }
    }
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4ade80;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: bold;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 复制链接
function copyLink() {
    const currentUrl = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            showNotification('✅ 链接已复制到剪贴板！');
        }).catch(() => {
            fallbackCopyTextToClipboard(currentUrl);
        });
    } else {
        fallbackCopyTextToClipboard(currentUrl);
    }
}

// 备用复制方法
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('✅ 链接已复制到剪贴板！');
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('❌ 复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
}

// 下载音频
function downloadAudio() {
    if (audioPlayer && audioPlayer.src) {
        const a = document.createElement('a');
        a.href = audioPlayer.src;
        a.download = `voicewave-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('✅ 音频下载已开始！');
    } else {
        showNotification('❌ 没有可下载的音频文件');
    }
}

// 跳转到指定时间
function seekTo(event) {
    if (!audioPlayer || !audioPlayer.duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = clickX / rect.width;
    
    audioPlayer.currentTime = progress * audioPlayer.duration;
}

console.log('🎵 播放页面脚本已加载'); 