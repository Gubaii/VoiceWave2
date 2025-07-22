// 编辑页面相关变量
let currentTheme = 'equalizer';
let currentQRStyle = 'default';
let currentFont = 'Inter';
let audioBuffer = null;
let waveformData = null;
let showText = true;
let speechRecognition = null;
let recognizedText = '';

// 页面元素
let mainCanvas = null;
let mainCtx = null;
let textInput = null;
let customText = null;
let fontSelect = null;
let showTextCheckbox = null;
let qrDisplay = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEditPage();
});

// 初始化编辑页面
function initializeEditPage() {
    console.log('编辑页面已加载');
    
    // 获取页面元素
    mainCanvas = document.getElementById('mainWaveform');
    textInput = document.getElementById('textInput');
    customText = document.getElementById('customText');
    fontSelect = document.getElementById('fontSelect');
    showTextCheckbox = document.getElementById('showText');
    qrDisplay = document.getElementById('qrDisplay');
    
    // 初始化画布
    if (mainCanvas) {
        mainCtx = mainCanvas.getContext('2d');
    }
    
    // 检查录音数据
    loadRecordedAudio();
    
    // 从本地存储获取选择的样式
    const selectedStyle = localStorage.getItem('selectedStyle');
    if (selectedStyle) {
        currentTheme = selectedStyle;
        updateThemeSelection();
    }
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化语音识别
    initializeSpeechRecognition();
    
    // 生成初始声纹图
    generateWaveform();
    
    // 生成二维码
    generateQRCode();
    
    // 加载识别的文字（如果有的话）
    loadRecognizedText();
}

// 加载录音数据
function loadRecordedAudio() {
    const audioData = localStorage.getItem('recordedAudio');
    if (audioData) {
        // 将base64数据转换为Blob
        fetch(audioData)
            .then(res => res.blob())
            .then(blob => {
                return blob.arrayBuffer();
            })
            .then(buffer => {
                // 解码音频数据
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return audioContext.decodeAudioData(buffer);
            })
            .then(decodedBuffer => {
                audioBuffer = decodedBuffer;
                extractWaveformData();
                generateWaveform();
                
                // 尝试语音识别
                if (audioData) {
                    performSpeechRecognition(audioData);
                }
            })
            .catch(error => {
                console.error('音频数据加载失败:', error);
                // 使用模拟数据
                generateMockWaveformData();
                generateWaveform();
            });
    } else {
        console.warn('未找到录音数据，使用模拟数据');
        generateMockWaveformData();
        generateWaveform();
    }
}

// 提取声纹数据
function extractWaveformData() {
    if (!audioBuffer) return;
    
    const channelData = audioBuffer.getChannelData(0);
    const samples = 200; // 取样点数
    const blockSize = Math.floor(channelData.length / samples);
    
    waveformData = [];
    for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
        }
        waveformData.push(sum / blockSize);
    }
    
    // 归一化数据
    const maxValue = Math.max(...waveformData);
    waveformData = waveformData.map(value => value / maxValue);
}

// 生成模拟声纹数据
function generateMockWaveformData() {
    waveformData = [];
    for (let i = 0; i < 200; i++) {
        // 生成模拟的声音波形数据
        const base = Math.sin(i * 0.1) * 0.5 + 0.5;
        const noise = Math.random() * 0.3;
        const envelope = Math.exp(-Math.abs(i - 100) / 50); // 包络
        waveformData.push((base + noise) * envelope);
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 主题选择
    document.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            selectTheme(theme);
        });
    });
    
    // 二维码样式选择
    document.querySelectorAll('.qr-option').forEach(option => {
        option.addEventListener('click', function() {
            const qrStyle = this.getAttribute('data-qr');
            selectQRStyle(qrStyle);
        });
    });
    
    // 文本输入
    textInput.addEventListener('input', function() {
        updateCustomText();
    });
    
    // 显示文字开关
    showTextCheckbox.addEventListener('change', function() {
        showText = this.checked;
        updateTextVisibility();
    });
    
    // 字体选择
    fontSelect.addEventListener('change', function() {
        currentFont = this.value;
        updateTextStyle();
    });
    
    // 双击文本输入启动语音识别
    textInput.addEventListener('dblclick', function() {
        startSpeechRecognition();
    });
}

// 选择主题
function selectTheme(theme) {
    currentTheme = theme;
    updateThemeSelection();
    generateWaveform();
}

// 更新主题选择状态
function updateThemeSelection() {
    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-theme="${currentTheme}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

// 选择二维码样式
function selectQRStyle(qrStyle) {
    currentQRStyle = qrStyle;
    
    document.querySelectorAll('.qr-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`[data-qr="${qrStyle}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    generateQRCode();
}

// 生成声纹图
function generateWaveform() {
    if (!mainCtx || !waveformData) return;
    
    const canvas = mainCanvas;
    const ctx = mainCtx;
    
    // 清除画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 根据主题绘制不同样式的声纹
    switch (currentTheme) {
        case 'equalizer':
            drawEqualizerStyle(ctx, canvas);
            break;
        case 'continuous':
            drawContinuousStyle(ctx, canvas);
            break;
        case 'vertical':
            drawVerticalStyle(ctx, canvas);
            break;
        case 'heartbeat':
            drawHeartbeatStyle(ctx, canvas);
            break;
        case 'audio':
            drawAudioStyle(ctx, canvas);
            break;
        case 'dots':
            drawDotsStyle(ctx, canvas);
            break;
        default:
            drawEqualizerStyle(ctx, canvas);
    }
}

// 绘制均衡器样式
function drawEqualizerStyle(ctx, canvas) {
    const barCount = 60;
    const barWidth = (canvas.width - 100) / barCount;
    const maxHeight = canvas.height - 100;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * waveformData.length);
        const barHeight = waveformData[dataIndex] * maxHeight;
        const x = 50 + i * barWidth;
        const y = canvas.height - 50 - barHeight;
        
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    }
}

// 绘制连续波纹样式
function drawContinuousStyle(ctx, canvas) {
    const points = waveformData.length;
    const stepX = (canvas.width - 100) / points;
    const centerY = canvas.height / 2;
    const amplitude = (canvas.height - 100) / 4;
    
    // 主波形
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let i = 0; i < points; i++) {
        const x = 50 + i * stepX;
        const y = centerY + (waveformData[i] - 0.5) * amplitude * 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // 镜像波形
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < points; i++) {
        const x = 50 + i * stepX;
        const y = centerY - (waveformData[i] - 0.5) * amplitude;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制简约竖纹样式
function drawVerticalStyle(ctx, canvas) {
    const lineCount = 80;
    const lineWidth = 2;
    const spacing = (canvas.width - 100) / lineCount;
    const maxHeight = canvas.height - 100;
    
    ctx.fillStyle = '#333';
    
    for (let i = 0; i < lineCount; i++) {
        const dataIndex = Math.floor((i / lineCount) * waveformData.length);
        const lineHeight = waveformData[dataIndex] * maxHeight;
        const x = 50 + i * spacing;
        const y = (canvas.height - lineHeight) / 2;
        
        ctx.fillRect(x, y, lineWidth, lineHeight);
    }
}

// 绘制心电图样式
function drawHeartbeatStyle(ctx, canvas) {
    const points = waveformData.length;
    const stepX = (canvas.width - 100) / points;
    const centerY = canvas.height / 2;
    const amplitude = (canvas.height - 100) / 3;
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < points; i++) {
        const x = 50 + i * stepX;
        let y = centerY;
        
        // 心电图特征：突然的尖峰
        if (waveformData[i] > 0.7) {
            y = centerY - amplitude * 1.5;
        } else if (waveformData[i] > 0.3) {
            y = centerY + amplitude * (waveformData[i] - 0.5);
        } else {
            y = centerY + (waveformData[i] - 0.5) * amplitude * 0.5;
        }
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制音频波形样式
function drawAudioStyle(ctx, canvas) {
    const points = waveformData.length;
    const stepX = (canvas.width - 100) / points;
    const centerY = canvas.height / 2;
    const amplitude = (canvas.height - 100) / 2;
    
    // 填充区域
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(50, centerY);
    
    for (let i = 0; i < points; i++) {
        const x = 50 + i * stepX;
        const y = centerY - (waveformData[i] - 0.5) * amplitude;
        ctx.lineTo(x, y);
    }
    
    for (let i = points - 1; i >= 0; i--) {
        const x = 50 + i * stepX;
        const y = centerY + (waveformData[i] - 0.5) * amplitude;
        ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    for (let i = 0; i < points; i++) {
        const x = 50 + i * stepX;
        const y = centerY - (waveformData[i] - 0.5) * amplitude;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制点线图案样式
function drawDotsStyle(ctx, canvas) {
    const dotCount = 50;
    const spacing = (canvas.width - 100) / dotCount;
    const centerY = canvas.height / 2;
    const maxRadius = 15;
    
    ctx.fillStyle = '#333';
    
    for (let i = 0; i < dotCount; i++) {
        const dataIndex = Math.floor((i / dotCount) * waveformData.length);
        const radius = waveformData[dataIndex] * maxRadius;
        const x = 50 + i * spacing;
        
        ctx.beginPath();
        ctx.arc(x, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// 更新自定义文本
function updateCustomText() {
    const text = textInput.value;
    customText.textContent = text;
    
    // 保存文字到本地存储
    localStorage.setItem('customText', text);
}

// 更新文本可见性
function updateTextVisibility() {
    const contentOverlay = document.querySelector('.content-overlay');
    const qrDisplay = document.getElementById('qrDisplay');
    
    if (showText) {
        // 显示文字时：使用 space-between 布局
        customText.style.display = 'block';
        contentOverlay.style.justifyContent = 'space-between';
    } else {
        // 隐藏文字时：二维码居中
        customText.style.display = 'none';
        contentOverlay.style.justifyContent = 'center';
    }
}

// 获取完整的字体族字符串
function getFontFamily(fontName) {
    switch (fontName) {
        case 'Noto Sans SC':
            return '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
        case 'Noto Serif SC':
            return '"Noto Serif SC", "Songti SC", "SimSun", serif';
        case 'Ma Shan Zheng':
            return '"Ma Shan Zheng", "KaiTi", "STKaiti", cursive';
        case 'ZCOOL XiaoWei':
            return '"ZCOOL XiaoWei", "PingFang SC", "Hiragino Sans GB", sans-serif';
        case 'ZCOOL QingKe HuangYou':
            return '"ZCOOL QingKe HuangYou", "PingFang SC", "Hiragino Sans GB", sans-serif';
        case 'Zhi Mang Xing':
            return '"Zhi Mang Xing", "KaiTi", "STKaiti", cursive';
        case 'Inter':
            return '"Inter", "Noto Sans SC", sans-serif';
        default:
            return `"${fontName}", "Noto Sans SC", sans-serif`;
    }
}

// 更新文本样式
function updateTextStyle() {
    const fontFamily = getFontFamily(currentFont);
    customText.style.fontFamily = fontFamily;
    console.log('字体切换为:', currentFont, '完整字体族:', fontFamily);
}

// 加载识别的文字
function loadRecognizedText() {
    const recognizedText = localStorage.getItem('recognizedText');
    if (recognizedText && recognizedText.trim()) {
        // 替换默认文案
        textInput.value = recognizedText;
        customText.textContent = recognizedText;
        
        // 保存到本地存储
        localStorage.setItem('customText', recognizedText);
        
        showNotification('已自动应用语音识别结果', 'success');
        
        // 使用后清除存储的识别结果
        localStorage.removeItem('recognizedText');
    } else {
        // 如果没有识别结果，加载之前保存的文本或使用默认文本
        const savedText = localStorage.getItem('customText');
        if (savedText) {
            textInput.value = savedText;
            customText.textContent = savedText;
        }
    }
}

// 初始化语音识别
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'zh-CN';
        
        speechRecognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            
            recognizedText = transcript;
            document.getElementById('speechResult').textContent = transcript || '正在识别中...';
        };
        
        speechRecognition.onerror = function(event) {
            console.error('语音识别错误:', event.error);
            document.getElementById('speechResult').textContent = '识别失败，请重试';
        };
        
        speechRecognition.onend = function() {
            console.log('语音识别结束');
        };
    } else {
        console.warn('浏览器不支持语音识别');
    }
}

// 执行语音识别
function performSpeechRecognition(audioData) {
    // 注意：Web Speech API 无法直接处理音频文件
    // 这里提供一个手动触发的接口
    console.log('音频数据可用，可通过双击文本框启动语音识别');
}

// 启动语音识别
function startSpeechRecognition() {
    if (!speechRecognition) {
        showNotification('浏览器不支持语音识别功能', 'warning');
        return;
    }
    
    document.getElementById('speechModal').style.display = 'flex';
    document.getElementById('speechResult').textContent = '正在识别中...';
    
    try {
        speechRecognition.start();
    } catch (error) {
        console.error('启动语音识别失败:', error);
        document.getElementById('speechResult').textContent = '启动识别失败';
    }
}

// 关闭语音识别模态框
function closeSpeechModal() {
    document.getElementById('speechModal').style.display = 'none';
    if (speechRecognition) {
        speechRecognition.stop();
    }
}

// 应用语音识别结果
function applySpeechResult() {
    if (recognizedText) {
        textInput.value = recognizedText;
        updateCustomText();
        showNotification('语音识别结果已应用', 'success');
    }
    closeSpeechModal();
}

// 生成二维码
function generateQRCode() {
    console.log('开始生成编辑页面二维码...');
    console.log('qrDisplay元素:', qrDisplay);
    console.log('当前二维码样式:', currentQRStyle);
    
    if (!qrDisplay) {
        console.error('找不到qrDisplay元素');
        return;
    }
    
    // 获取音频播放链接
    const audioUrl = generateAudioPlayUrl();
    console.log('生成的播放URL:', audioUrl);
    
    // 创建二维码
    console.log('开始生成二维码，样式:', currentQRStyle, 'URL:', audioUrl);
    const qrHTML = generateQRCodeHTML(currentQRStyle, audioUrl);
    console.log('生成的二维码HTML:', qrHTML);
    qrDisplay.innerHTML = qrHTML;
    console.log('编辑页面二维码生成成功');
    
    // 强制刷新二维码图片以避免缓存
    setTimeout(() => {
        const qrImg = qrDisplay.querySelector('img');
        if (qrImg) {
            const currentSrc = qrImg.src;
            qrImg.src = '';
            setTimeout(() => {
                qrImg.src = currentSrc;
            }, 10);
        }
    }, 100);
}

// 生成音频播放URL
function generateAudioPlayUrl() {
    // 检查是否是云存储音频
    const isCloudAudio = localStorage.getItem('isCloudAudio') === 'true';
    const cloudAudioUrl = localStorage.getItem('cloudAudioUrl');
    const simpleFileId = localStorage.getItem('simpleFileId');
    
    if (isCloudAudio && cloudAudioUrl) {
        // 使用短ID，不包含云端URL，保持二维码简洁
        const shortId = simpleFileId || `cloud_${Date.now()}`;
        const playUrl = `${window.location.origin}/play.html?id=${shortId}&cloud=true`;
        console.log('生成云端音频播放URL（短ID）:', playUrl);
        return playUrl;
    } else {
        // 降级到本地音频
        const timestamp = Date.now();
        const playUrl = `${window.location.origin}/play.html?id=${timestamp}&local=true`;
        console.log('生成本地音频播放URL:', playUrl);
        return playUrl;
    }
}



// 生成二维码HTML
function generateQRCodeHTML(style, url) {
    const qrSize = 200; // 使用和二维码2一样的尺寸
    console.log('生成编辑页面二维码，URL:', url, '样式:', style);
    
    const container = document.createElement('div');
    container.style.cssText = `
        width: 80px; 
        height: 80px; 
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        background: white;
        padding: 2px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    const img = document.createElement('img');
    
    // 只使用一个清晰的方案：QR-Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}&ecc=L&margin=3&t=${Date.now()}`;
    img.src = qrUrl;
    
    img.alt = '播放页面二维码';
    img.style.cssText = `
        width: 76px;
        height: 76px;
        object-fit: contain;
    `;
    
    // 应用CSS样式效果
    switch (style) {
        case 'rounded':
            img.style.borderRadius = '50%';
            img.style.filter = 'contrast(1.1)';
            break;
        case 'dots':
            img.style.borderRadius = '12px';
            img.style.filter = 'contrast(1.3) brightness(0.9)';
            break;
        case 'square':
            img.style.borderRadius = '4px';
            img.style.border = '1px solid #667eea';
            img.style.filter = 'hue-rotate(220deg) saturate(1.2)';
            break;
        default:
            img.style.borderRadius = '6px';
    }
    
    container.appendChild(img);
    return container.outerHTML;
}







// 导出PNG - 直接导出预览区域
async function exportPNG() {
    console.log('开始PNG导出...');
    
    // 获取预览区域
    const mainContent = document.querySelector('.main-content');
    const waveformContainer = document.querySelector('.waveform-canvas-container');
    const contentOverlay = document.querySelector('.content-overlay');
    
    if (!mainContent) {
        showNotification('预览区域未找到', 'error');
        return;
    }
    
    // 临时隐藏边框
    const originalBorders = [];
    if (waveformContainer) {
        originalBorders.push({
            element: waveformContainer,
            border: waveformContainer.style.border,
            borderRadius: waveformContainer.style.borderRadius
        });
        waveformContainer.style.border = 'none';
        waveformContainer.style.borderRadius = '0';
    }
    if (contentOverlay) {
        originalBorders.push({
            element: contentOverlay,
            border: contentOverlay.style.border,
            borderRadius: contentOverlay.style.borderRadius
        });
        contentOverlay.style.border = 'none';
        contentOverlay.style.borderRadius = '0';
    }
    
    try {
        // 等待一下让样式更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 使用html2canvas直接捕获预览区域
        const canvas = await html2canvas(mainContent, {
            backgroundColor: '#ffffff',
            scale: 4, // 高分辨率缩放
            useCORS: true,
            allowTaint: true,
            width: mainContent.offsetWidth,
            height: mainContent.offsetHeight
        });
        
        console.log('预览区域捕获成功，尺寸:', canvas.width, 'x', canvas.height);
        
        // 下载PNG并保存URL
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            
            // 保存声纹图片URL到localStorage
            localStorage.setItem('waveformImageUrl', url);
            console.log('声纹图片URL已保存:', url);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `voicewave-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showNotification('PNG文件已下载', 'success');
        });
        
    } catch (error) {
        console.error('PNG导出失败:', error);
        showNotification('PNG导出失败，请重试', 'error');
    } finally {
        // 恢复原来的边框样式
        originalBorders.forEach(item => {
            item.element.style.border = item.border;
            item.element.style.borderRadius = item.borderRadius;
        });
    }
}

// 生成当前声纹的SVG
function generateCurrentWaveformSVG(width, height, x, y) {
    if (!waveformData) return '';
    
    switch (currentTheme) {
        case 'continuous':
            return generateSVGContinuous(width, height, x, y);
        case 'vertical':
            return generateSVGVertical(width, height, x, y);
        default:
            return generateSVGEqualizer(width, height, x, y);
    }
}



// 导出SVG - 简单组合
function exportSVG() {
    console.log('开始SVG导出...');
    
    try {
        // 获取文本内容
        const textInput = document.getElementById('textInput');
        const showText = document.getElementById('showText').checked;
        const text = showText && textInput ? textInput.value : '';
        
        // 创建简单的SVG
        const width = 2560;
        const height = 1920;
        
        let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // 白色背景
        svgContent += `<rect width="100%" height="100%" fill="white"/>`;
        
        // 声纹区域 (占70%高度)
        const waveformHeight = height * 0.7;
        const waveformY = 50;
        svgContent += generateCurrentWaveformSVG(width - 100, waveformHeight, 50, waveformY);
        
        // 底部内容区域
        const overlayY = waveformY + waveformHeight;
        const overlayHeight = 150;
        const overlayPadding = 50;
        
        // 文字和二维码
        const contentY = overlayY + overlayHeight / 2;
        
        if (text) {
            // 有文字时：文字在左，二维码占位符在右
            const fontFamily = getFontFamily(currentFont);
            const fontSize = 48;
            const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            svgContent += `<text x="${overlayPadding + 50}" y="${contentY}" font-family="${fontFamily}" font-size="${fontSize}" fill="#333" dominant-baseline="middle">${escapedText}</text>`;
            
            // 二维码占位符在右边
            const qrSize = 100;
            const qrX = width - overlayPadding - 50 - qrSize;
            const qrY = contentY - qrSize / 2;
            svgContent += `<rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/><text x="${qrX + qrSize/2}" y="${qrY + qrSize/2}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#999">QR</text>`;
        } else {
            // 没有文字时：二维码占位符居中
            const qrSize = 100;
            const qrX = (width - qrSize) / 2;
            const qrY = contentY - qrSize / 2;
            svgContent += `<rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/><text x="${qrX + qrSize/2}" y="${qrY + qrSize/2}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#999">QR</text>`;
        }
        
        svgContent += '</svg>';
        
        // 下载SVG
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `voicewave-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('SVG文件已下载', 'success');
        
    } catch (error) {
        console.error('SVG导出失败:', error);
        showNotification('SVG导出失败，请重试', 'error');
    }
}

// 绘制完整作品
async function drawCompleteArtwork(ctx, canvas, qrCodeDataURL = null) {
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 声纹图区域 (占画布高度的70%)，按比例调整所有尺寸
    const scale = canvas.width / 800; // 计算缩放比例  
    const waveformHeight = canvas.height * 0.7;
    const waveformY = 40 * scale; // 按比例调整顶部留白
    
    console.log('PNG导出缩放信息:', {
        canvasSize: `${canvas.width}x${canvas.height}`,
        scale: scale,
        waveformHeight: waveformHeight,
        waveformY: waveformY
    });
    
    ctx.save();
    ctx.translate(50 * scale, waveformY);
    ctx.scale((canvas.width - 100 * scale) / mainCanvas.width, waveformHeight / mainCanvas.height);
    ctx.drawImage(mainCanvas, 0, 0);
    ctx.restore();
    
    // 绘制内容叠加层的背景
    const overlayY = waveformY + waveformHeight;
    const overlayHeight = 100 * scale;
    const overlayPadding = 50 * scale;
    
    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(overlayPadding, overlayY, canvas.width - overlayPadding * 2, overlayHeight);
    
    // 边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(overlayPadding, overlayY, canvas.width - overlayPadding * 2, overlayHeight);
    
    // 文本和二维码布局 (根据高分辨率调整尺寸)
    const qrSize = Math.floor(60 * scale); // 按比例缩放二维码大小
    const contentPadding = Math.floor(30 * scale);
    const fontSize = Math.floor(20 * scale);
    const contentY = overlayY + overlayHeight / 2;
    
    if (showText && textInput && textInput.value && textInput.value.trim()) {
        // 有文字时：左右布局
        // 绘制文字（左边）
        ctx.fillStyle = '#333';
        const fontFamily = getFontFamily(currentFont);
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(textInput.value, overlayPadding + contentPadding, contentY);
        
        // 绘制真实二维码（右边）
        const qrX = canvas.width - overlayPadding - contentPadding - qrSize;
        const qrY = contentY - qrSize / 2;
        await drawRealQRCodeOnCanvas(ctx, qrX, qrY, qrSize, qrCodeDataURL);
    } else {
        // 没有文字时：二维码居中
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = contentY - qrSize / 2;
        await drawRealQRCodeOnCanvas(ctx, qrX, qrY, qrSize, qrCodeDataURL);
    }
}



// 原有的手绘二维码函数（保留作为备用）
function drawQRCodeOnCanvas(ctx, x, y, size) {
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    
    // 绘制简化但清晰的二维码图案
    ctx.fillStyle = '#000000';
    
    // 计算网格大小，使用更合适的尺寸
    const gridSize = 15; // 15x15 网格，更容易绘制
    const cellSize = size / gridSize;
    
    // 绘制定位点（左上角）
    drawQRFinderPattern(ctx, x, y, cellSize * 7);
    // 绘制定位点（右上角）
    drawQRFinderPattern(ctx, x + size - cellSize * 7, y, cellSize * 7);
    // 绘制定位点（左下角）
    drawQRFinderPattern(ctx, x, y + size - cellSize * 7, cellSize * 7);
    
    // 绘制数据模块（简化版）
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            // 跳过定位点区域
            if ((row < 7 && col < 7) || // 左上
                (row < 7 && col >= gridSize - 7) || // 右上
                (row >= gridSize - 7 && col < 7)) { // 左下
                continue;
            }
            
            // 根据位置决定是否绘制模块（简化的伪随机模式）
            if ((row + col * 3 + row * col) % 3 === 0) {
                const moduleX = x + col * cellSize;
                const moduleY = y + row * cellSize;
                ctx.fillRect(moduleX, moduleY, cellSize * 0.9, cellSize * 0.9);
            }
        }
    }
    
    // 绘制边框
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
}

// 绘制二维码定位图案
function drawQRFinderPattern(ctx, x, y, size) {
    const borderWidth = size / 7;
    
    // 保存当前填充色
    const originalFillStyle = ctx.fillStyle;
    
    // 外边框（黑色）
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    // 内部白色区域
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + borderWidth, y + borderWidth, size - 2 * borderWidth, size - 2 * borderWidth);
    
    // 中心黑色方块
    ctx.fillStyle = '#000000';
    const centerSize = size - 4 * borderWidth;
    const centerOffset = 2 * borderWidth;
    ctx.fillRect(x + centerOffset, y + centerOffset, centerSize, centerSize);
    
    // 恢复原来的填充色
    ctx.fillStyle = originalFillStyle;
}

// 生成SVG内容
async function generateSVGContent(qrCodeDataURL = null) {
    // 超高分辨率SVG尺寸 (2560x1920, 4:3比例)
    const width = 2560;
    const height = 1920;
    
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
    svgContent += `<rect width="100%" height="100%" fill="white"/>`;
    
    // 根据主题生成SVG声纹
    svgContent += generateSVGWaveform(width, height);
    
    // 绘制内容叠加层 (按比例调整所有尺寸)
    const scale = width / 800; // 计算缩放比例
    const waveformHeight = height * 0.7;
    const overlayY = 40 * scale + waveformHeight;
    const overlayHeight = 100 * scale;
    const overlayPadding = 50 * scale;
    
    console.log('SVG导出缩放信息:', {
        svgSize: `${width}x${height}`,
        scale: scale,
        overlayY: overlayY,
        overlayHeight: overlayHeight
    });
    
    // 叠加层背景
    svgContent += `<rect x="${overlayPadding}" y="${overlayY}" width="${width - overlayPadding * 2}" height="${overlayHeight}" fill="white" stroke="#e5e7eb" stroke-width="${2 * scale}"/>`;
    
    // 文本和二维码布局
    const qrSize = Math.floor(60 * scale);
    const contentPadding = 30 * scale;
    const fontSize = 20 * scale;
    const contentY = overlayY + overlayHeight / 2;
    
    if (showText && textInput && textInput.value && textInput.value.trim()) {
        // 有文字时：左右布局
        // 文字（左边）
        const fontFamily = getFontFamily(currentFont);
        const escapedText = textInput.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        svgContent += `<text x="${overlayPadding + contentPadding}" y="${contentY}" font-family="${fontFamily}" font-size="${fontSize}" fill="#333" dominant-baseline="middle">${escapedText}</text>`;
        
        // 真实二维码（右边）
        const qrX = width - overlayPadding - contentPadding - qrSize;
        const qrY = contentY - qrSize / 2;
        svgContent += generateSVGRealQRCode(qrX, qrY, qrSize, qrCodeDataURL);
    } else {
        // 没有文字时：二维码居中
        const qrX = (width - qrSize) / 2;
        const qrY = contentY - qrSize / 2;
        svgContent += generateSVGRealQRCode(qrX, qrY, qrSize, qrCodeDataURL);
    }
    
    svgContent += '</svg>';
    return svgContent;
}

// 生成SVG真实二维码
function generateSVGRealQRCode(x, y, size, qrCodeDataURL) {
    if (qrCodeDataURL) {
        // 使用真实的二维码图片
        return `<image x="${x}" y="${y}" width="${size}" height="${size}" xlink:href="${qrCodeDataURL}"/>`;
    } else {
        // 没有二维码数据时使用占位符
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#f0f0f0" stroke="#cccccc" stroke-width="2"/><text x="${x + size/2}" y="${y + size/2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${Math.floor(size/8)}" fill="#999999">QR</text>`;
    }
}

// 原有的手绘SVG二维码函数（保留作为备用）
function generateSVGQRCode(x, y, size) {
    let qrContent = '';
    
    // 白色背景
    qrContent += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="white" stroke="#cccccc" stroke-width="1"/>`;
    
    // 使用与Canvas一致的15x15网格
    const gridSize = 15;
    const cellSize = size / gridSize;
    
    // 绘制定位点
    qrContent += generateSVGFinderPattern(x, y, cellSize * 7);
    qrContent += generateSVGFinderPattern(x + size - cellSize * 7, y, cellSize * 7);
    qrContent += generateSVGFinderPattern(x, y + size - cellSize * 7, cellSize * 7);
    
    // 绘制数据模块（与Canvas版本一致的模式）
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            // 跳过定位点区域
            if ((row < 7 && col < 7) || // 左上
                (row < 7 && col >= gridSize - 7) || // 右上
                (row >= gridSize - 7 && col < 7)) { // 左下
                continue;
            }
            
            // 使用与Canvas相同的模式
            if ((row + col * 3 + row * col) % 3 === 0) {
                const moduleX = x + col * cellSize;
                const moduleY = y + row * cellSize;
                qrContent += `<rect x="${moduleX}" y="${moduleY}" width="${cellSize * 0.9}" height="${cellSize * 0.9}" fill="black"/>`;
            }
        }
    }
    
    return qrContent;
}

// 生成SVG二维码定位图案
function generateSVGFinderPattern(x, y, size) {
    let finderContent = '';
    const borderWidth = size / 7;
    
    // 外边框（黑色）
    finderContent += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="black"/>`;
    
    // 内部白色区域
    finderContent += `<rect x="${x + borderWidth}" y="${y + borderWidth}" width="${size - 2 * borderWidth}" height="${size - 2 * borderWidth}" fill="white"/>`;
    
    // 中心黑色方块
    const centerSize = size - 4 * borderWidth;
    const centerOffset = 2 * borderWidth;
    finderContent += `<rect x="${x + centerOffset}" y="${y + centerOffset}" width="${centerSize}" height="${centerSize}" fill="black"/>`;
    
    return finderContent;
}

// 生成SVG声纹
function generateSVGWaveform(width, height) {
    if (!waveformData) return '';
    
    // 根据尺寸计算缩放比例，保持布局一致
    const scale = width / 800; // 基于800px基准计算缩放
    const waveformHeight = height * 0.7;
    const waveformY = 40 * scale; // 按比例调整顶部留白
    const waveformX = 50 * scale; // 按比例调整左侧留白
    const waveformWidth = width - 100 * scale; // 按比例调整总留白
    
    switch (currentTheme) {
        case 'continuous':
            return generateSVGContinuous(waveformWidth, waveformHeight, waveformX, waveformY);
        case 'vertical':
            return generateSVGVertical(waveformWidth, waveformHeight, waveformX, waveformY);
        default:
            return generateSVGEqualizer(waveformWidth, waveformHeight, waveformX, waveformY);
    }
}

// 生成SVG连续波纹
function generateSVGContinuous(width, height, x, y) {
    const points = waveformData.length;
    const stepX = width / points;
    const centerY = y + height / 2;
    const amplitude = height / 4;
    
    let path = `M ${x} ${centerY}`;
    for (let i = 0; i < points; i++) {
        const pointX = x + i * stepX;
        const waveY = centerY + (waveformData[i] - 0.5) * amplitude * 2;
        path += ` L ${pointX} ${waveY}`;
    }
    
    return `<path d="${path}" stroke="#333" stroke-width="3" fill="none"/>`;
}

// 生成SVG简约竖纹
function generateSVGVertical(width, height, x, y) {
    const lineCount = 80;
    const spacing = width / lineCount;
    let rects = '';
    
    for (let i = 0; i < lineCount; i++) {
        const dataIndex = Math.floor((i / lineCount) * waveformData.length);
        const lineHeight = waveformData[dataIndex] * height;
        const lineX = x + i * spacing;
        const lineY = y + (height - lineHeight) / 2;
        
        rects += `<rect x="${lineX}" y="${lineY}" width="2" height="${lineHeight}" fill="#333"/>`;
    }
    
    return rects;
}

// 生成SVG均衡器
function generateSVGEqualizer(width, height, x, y) {
    const barCount = 60;
    const barWidth = width / barCount;
    let rects = '';
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * waveformData.length);
        const barHeight = waveformData[dataIndex] * height;
        const barX = x + i * barWidth;
        const barY = y + height - barHeight;
        
        rects += `<rect x="${barX}" y="${barY}" width="${barWidth * 0.8}" height="${barHeight}" fill="url(#gradient)"/>`;
    }
    
    const gradient = `<defs><linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs>`;
    
    return gradient + rects;
}

// 返回录音页面
function goBack() {
    window.location.href = 'record.html';
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="closeNotification(this)">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, 5000);
}

// 关闭通知
function closeNotification(closeBtn) {
    const notification = closeBtn.closest('.notification');
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// 导出全局函数
window.exportPNG = exportPNG;
window.exportSVG = exportSVG;
window.goBack = goBack;
window.startSpeechRecognition = startSpeechRecognition;
window.closeSpeechModal = closeSpeechModal;
window.applySpeechResult = applySpeechResult;
window.closeNotification = closeNotification; 