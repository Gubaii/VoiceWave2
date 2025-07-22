// 全局变量
let selectedStyle = null;
let audioData = null;
let currentRecording = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    console.log('声纹可视化工具已加载');
    
    // 检查浏览器支持
    checkBrowserSupport();
    
    // 为所有样式卡片添加点击事件
    const styleCards = document.querySelectorAll('.style-card');
    styleCards.forEach(card => {
        card.addEventListener('click', function() {
            const style = this.getAttribute('data-style');
            selectStyle(style);
        });
    });
}

// 检查浏览器支持
function checkBrowserSupport() {
    const features = {
        mediaRecorder: 'MediaRecorder' in window,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        canvas: !!document.createElement('canvas').getContext
    };
    
    console.log('浏览器功能支持检查:', features);
    
    if (!features.mediaRecorder || !features.getUserMedia) {
        showNotification('您的浏览器不支持录音功能，请使用现代浏览器', 'warning');
    }
    
    if (!features.speechRecognition) {
        console.warn('浏览器不支持语音识别功能');
    }
}

// 选择样式
function selectStyle(styleName) {
    console.log('选择样式:', styleName);
    
    // 移除之前的选中状态
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 添加新的选中状态
    const selectedCard = document.querySelector(`[data-style="${styleName}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedStyle = styleName;
        
        // 添加选择动画效果
        selectedCard.style.transform = 'scale(1.02)';
        
        showNotification(`已选择 ${getStyleDisplayName(styleName)} 样式`, 'success');
        
        // 延迟一下让用户看到选择效果，然后直接跳转
        setTimeout(() => {
            selectedCard.style.transform = '';
            startRecording();
        }, 300);
    }
}

// 获取样式显示名称
function getStyleDisplayName(styleName) {
    const styleNames = {
        'equalizer': '均衡器风格',
        'continuous': '连续波纹',
        'vertical': '简约竖纹',
        'heartbeat': '心电图风格',
        'audio': '音频波形',
        'dots': '点线图案'
    };
    return styleNames[styleName] || styleName;
}

// 开始录音流程
function startRecording() {
    if (!selectedStyle) {
        showNotification('请先选择一种样式', 'warning');
        return;
    }
    
    console.log('开始录音流程，选择的样式:', selectedStyle);
    
    // 存储选择的样式到本地存储
    localStorage.setItem('selectedStyle', selectedStyle);
    
    // 跳转到录音页面
    window.location.href = 'record.html';
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="closeNotification(this)">×</button>
        </div>
    `;
    
    // 添加通知样式
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
    
    // 触发进入动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动关闭
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

// 工具函数：格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 工具函数：生成随机ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// 工具函数：下载文件
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    if (currentRecording) {
        currentRecording.stop();
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('应用错误:', e.error);
    showNotification('应用遇到错误，请刷新页面重试', 'warning');
});



// 导出全局函数供HTML调用
window.selectStyle = selectStyle;
window.startRecording = startRecording;
window.closeNotification = closeNotification; 