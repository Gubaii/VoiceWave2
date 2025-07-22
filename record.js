// 录音页面相关变量
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let recordingTimer = null;
let remainingTime = 10; // 最大录音时长10秒
let isRecording = false;
let audioContext = null;
let analyser = null;
let animationId = null;
let recordedBlob = null;
let speechRecognition = null;
let microphoneSelect = null;
let refreshMicrophonesBtn = null;
let permissionGranted = false; // 添加权限状态标记

// 页面元素
let recordBtn = null;
let recordBtnText = null;
let timer = null;
let recordingHint = null;
let recordingActions = null;
let waveformCanvas = null;
let waveformCtx = null;
let loadingOverlay = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化录音页面');
    setTimeout(() => {
    initializeRecordingPage();
    }, 100); // 延迟100ms确保所有元素都已渲染
});

// 初始化录音页面
function initializeRecordingPage() {
    console.log('开始初始化录音页面');
    
    try {
    // 获取页面元素
    recordBtn = document.getElementById('recordBtn');
    recordBtnText = document.getElementById('recordBtnText');
    timer = document.getElementById('timer');
    recordingHint = document.getElementById('recordingHint');
    recordingActions = document.getElementById('recordingActions');
    waveformCanvas = document.getElementById('waveformCanvas');
    loadingOverlay = document.getElementById('loadingOverlay');
        microphoneSelect = document.getElementById('microphoneSelect');
        refreshMicrophonesBtn = document.getElementById('refreshMicrophones');
        
        console.log('元素获取结果:', {
            recordBtn: !!recordBtn,
            recordBtnText: !!recordBtnText,
            timer: !!timer,
            recordingHint: !!recordingHint,
            recordingActions: !!recordingActions,
            waveformCanvas: !!waveformCanvas,
            loadingOverlay: !!loadingOverlay,
            microphoneSelect: !!microphoneSelect,
            refreshMicrophonesBtn: !!refreshMicrophonesBtn
        });
        
        // 检查必要元素是否存在
        const missingElements = [];
        if (!recordBtn) missingElements.push('recordBtn');
        if (!recordBtnText) missingElements.push('recordBtnText');
        if (!timer) missingElements.push('timer');
        if (!recordingHint) missingElements.push('recordingHint');
        if (!recordingActions) missingElements.push('recordingActions');
        if (!waveformCanvas) missingElements.push('waveformCanvas');
        if (!loadingOverlay) missingElements.push('loadingOverlay');
        
        if (missingElements.length > 0) {
            console.error('页面元素获取失败，缺失的元素:', missingElements);
            console.error('页面元素获取失败详情:', {
                recordBtn: !!recordBtn,
                recordBtnText: !!recordBtnText,
                timer: !!timer,
                recordingHint: !!recordingHint,
                recordingActions: !!recordingActions,
                waveformCanvas: !!waveformCanvas,
                loadingOverlay: !!loadingOverlay
            });
            
            // 尝试重新获取元素
            console.log('尝试重新获取元素...');
            setTimeout(() => {
                retryElementInitialization();
            }, 500);
            return;
        }
        
        console.log('所有页面元素获取成功');
    
    // 初始化画布
    if (waveformCanvas) {
        waveformCtx = waveformCanvas.getContext('2d');
            if (waveformCtx) {
        initializeWaveform();
                console.log('波形画布初始化成功');
            } else {
                console.error('无法获取画布上下文');
            }
    }
    
    // 检查选择的样式
    const selectedStyle = localStorage.getItem('selectedStyle');
    if (selectedStyle) {
        console.log('当前选择的样式:', selectedStyle);
    } else {
        console.warn('未找到选择的样式，返回首页');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
            return;
    }
    
        // 初始化麦克风列表（不请求权限）
        initializeMicrophoneList();
    
    // 初始化语音识别
    initializeSpeechRecognition();
    
        // 检查麦克风权限状态（但不主动请求）
        checkMicrophonePermission();
        
        // 绑定麦克风相关事件
        if (refreshMicrophonesBtn) {
            refreshMicrophonesBtn.addEventListener('click', refreshMicrophoneList);
        }
        if (microphoneSelect) {
            microphoneSelect.addEventListener('change', changeMicrophone);
        }
        
        console.log('录音页面初始化完成');
        
    } catch (error) {
        console.error('初始化录音页面时发生错误:', error);
        showNotification('页面初始化失败: ' + error.message, 'error');
    }
}

// 重试元素初始化
function retryElementInitialization() {
    console.log('重试元素初始化...');
    
    // 重新获取页面元素
    recordBtn = document.getElementById('recordBtn');
    recordBtnText = document.getElementById('recordBtnText');
    timer = document.getElementById('timer');
    recordingHint = document.getElementById('recordingHint');
    recordingActions = document.getElementById('recordingActions');
    waveformCanvas = document.getElementById('waveformCanvas');
    loadingOverlay = document.getElementById('loadingOverlay');
    microphoneSelect = document.getElementById('microphoneSelect');
    refreshMicrophonesBtn = document.getElementById('refreshMicrophones');
    
    console.log('重试后的元素获取结果:', {
        recordBtn: !!recordBtn,
        recordBtnText: !!recordBtnText,
        timer: !!timer,
        recordingHint: !!recordingHint,
        recordingActions: !!recordingActions,
        waveformCanvas: !!waveformCanvas,
        loadingOverlay: !!loadingOverlay,
        microphoneSelect: !!microphoneSelect,
        refreshMicrophonesBtn: !!refreshMicrophonesBtn
    });
    
    // 检查必要元素是否存在
    if (!recordBtn || !recordBtnText || !timer || !recordingHint || !recordingActions || !waveformCanvas || !loadingOverlay) {
        console.error('重试后仍然有元素获取失败');
        showNotification('页面初始化失败，请刷新页面重试', 'error');
        return;
    }
    
    console.log('重试成功，继续初始化...');
    
    // 继续初始化流程
    if (waveformCanvas) {
        waveformCtx = waveformCanvas.getContext('2d');
        initializeWaveform();
    }
    
    const selectedStyle = localStorage.getItem('selectedStyle');
    if (selectedStyle) {
        initializeMicrophoneList();
        initializeSpeechRecognition();
        checkMicrophonePermission();
    } else {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// 初始化声波显示
function initializeWaveform() {
    if (!waveformCtx) return;
    
    waveformCtx.fillStyle = '#f8f9fa';
    waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    
    // 绘制静态的声波提示
    waveformCtx.strokeStyle = '#e5e7eb';
    waveformCtx.lineWidth = 2;
    waveformCtx.beginPath();
    waveformCtx.moveTo(0, waveformCanvas.height / 2);
    waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
    waveformCtx.stroke();
    
    // 添加提示文字
    waveformCtx.fillStyle = '#999';
    waveformCtx.font = '14px "Noto Sans SC", sans-serif';
    waveformCtx.textAlign = 'center';
    waveformCtx.fillText('声波将在录音时显示', waveformCanvas.width / 2, waveformCanvas.height / 2 + 5);
}

// 检查麦克风权限状态
async function checkMicrophonePermission() {
    try {
        // 检查是否已经有权限
        const permission = await navigator.permissions.query({ name: 'microphone' });
        
        if (permission.state === 'granted') {
            console.log('麦克风权限已授予');
            permissionGranted = true;
            // 直接获取麦克风流，不显示权限弹窗
            await getMicrophoneStream();
        } else if (permission.state === 'denied') {
            console.log('麦克风权限被拒绝');
            showNotification('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问', 'warning');
            if (recordBtn) {
                recordBtn.disabled = true;
            }
            if (recordBtnText) {
                recordBtnText.textContent = '无法录音';
            }
        } else {
            console.log('麦克风权限未确定，需要用户授权');
            // 只在用户点击录音按钮时请求权限
            showNotification('点击录音按钮时将会请求麦克风权限', 'info');
        }
        
        // 监听权限变化
        permission.onchange = function() {
            if (permission.state === 'granted') {
                permissionGranted = true;
                getMicrophoneStream();
            } else if (permission.state === 'denied') {
                permissionGranted = false;
                showNotification('麦克风权限被拒绝', 'warning');
            }
        };
        
    } catch (error) {
        console.error('检查麦克风权限失败:', error);
        // 如果权限API不支持，回退到传统方式
        showNotification('点击录音按钮时将会请求麦克风权限', 'info');
    }
}

// 请求麦克风权限
async function requestMicrophonePermission() {
    try {
        console.log('请求麦克风权限...');
        await getMicrophoneStream();
        permissionGranted = true;
        console.log('麦克风权限获取成功');
    } catch (error) {
        console.error('麦克风权限请求失败:', error);
        permissionGranted = false;
        throw error;
    }
}

// 获取麦克风流（不显示权限弹窗）
async function getMicrophoneStream() {
    try {
        // 获取当前选择的麦克风设备ID
        const selectedDeviceId = microphoneSelect ? microphoneSelect.value : null;
        
        let audioConstraints = {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
        };
        
        // 如果选择了特定麦克风，使用该设备
        if (selectedDeviceId) {
            audioConstraints.deviceId = { exact: selectedDeviceId };
            } 
        
        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: audioConstraints
        });
        console.log('麦克风流已获取');
        
        // 设置音频上下文用于可视化
        if (audioContext) {
            audioContext.close();
        }
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        
        // 显示当前使用的麦克风信息
        const currentDevice = audioStream.getAudioTracks()[0];
        if (currentDevice) {
            const deviceLabel = currentDevice.label || '未知设备';
            console.log('当前使用的麦克风:', deviceLabel);
            showNotification(`麦克风已准备就绪: ${deviceLabel}`, 'success');
        } else {
        showNotification('麦克风已准备就绪', 'success');
        }
        
        // 启用录音按钮
        if (recordBtn) {
            recordBtn.disabled = false;
        }
        if (recordBtnText) {
            recordBtnText.textContent = '开始录音';
        }
        
    } catch (error) {
        console.error('获取麦克风流失败:', error);
        permissionGranted = false;
        
        let errorMessage = '无法获取麦克风';
        
        if (error.name === 'NotFoundError') {
            errorMessage = '未找到指定的麦克风设备，请检查设备连接';
        } else if (error.name === 'NotAllowedError') {
            errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '麦克风设备被其他应用占用，请关闭其他录音应用';
        }
        
        showNotification(errorMessage, 'warning');
        
        if (recordBtn) {
        recordBtn.disabled = true;
        }
        if (recordBtnText) {
        recordBtnText.textContent = '无法录音';
    }
}
}

// 切换录音状态
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

// 开始录音
async function startRecording() {
    try {
        // 检查是否已经有麦克风流
        if (!audioStream || !permissionGranted) {
            console.log('需要请求麦克风权限');
            showNotification('正在请求麦克风权限...', 'info');
            
            // 请求麦克风权限（这里会显示权限弹窗）
            await requestMicrophonePermission();
            
            // 如果权限获取失败，直接返回
            if (!audioStream) {
                return;
            }
        }
        
        // 确保音频上下文处于运行状态
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        // 重置录音状态
        audioChunks = [];
        remainingTime = 10;
        isRecording = true;
        
        // 更新UI
        if (recordBtn) {
            recordBtn.classList.add('recording');
        }
        if (recordBtnText) {
            recordBtnText.textContent = '停止录音';
        }
        if (recordingHint) {
            recordingHint.textContent = '正在录音...';
        }
        
        // 隐藏录音操作按钮
        if (recordingActions) {
            recordingActions.style.display = 'none';
        }
        
        // 开始录音
        mediaRecorder = new MediaRecorder(audioStream);
        
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
            console.log('录音完成，文件大小:', recordedBlob.size, 'bytes');
            
            // 显示录音操作按钮
            if (recordingActions) {
                recordingActions.style.display = 'flex';
            }
            
            // 显示播放按钮
            const playRecordingBtn = document.getElementById('playRecordingBtn');
            if (playRecordingBtn) {
                playRecordingBtn.style.display = 'inline-block';
            }
        
            // 语音识别已在录音过程中进行，这里不需要重新启动
            console.log('录音结束，语音识别结果已保存');
        };
        
        mediaRecorder.start();
        console.log('录音已开始');
        
        // 开始语音识别（与录音同时进行）
        startSpeechRecognition();
        
        // 开始波形可视化
        startWaveformVisualization();
        
        // 开始倒计时
        startTimer();
        
    } catch (error) {
        console.error('开始录音失败:', error);
        showNotification('开始录音失败，请重试', 'error');
        resetRecording();
    }
}

// 停止录音
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    // 停止语音识别
    stopSpeechRecognition();
    
    isRecording = false;
    stopTimer();
    stopWaveformVisualization();
    updateRecordingUI(false);
}

// 更新录音UI
function updateRecordingUI(recording) {
    if (!recordBtn || !recordBtnText || !recordingHint) return;
    
    if (recording) {
        recordBtn.classList.add('recording', 'pulse');
        recordBtnText.textContent = '录音中...';
        recordingHint.textContent = '点击停止录音';
    } else {
        recordBtn.classList.remove('recording', 'pulse');
        recordBtnText.textContent = '开始录音';
        recordingHint.textContent = '最多10秒';
    }
}

// 开始倒计时
function startTimer() {
    updateTimerDisplay();
    
    recordingTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            stopRecording();
            showNotification('录音时间到，自动停止', 'info');
        }
    }, 1000);
}

// 停止倒计时
function stopTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// 更新倒计时显示
function updateTimerDisplay() {
    if (!timer) return;
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 最后3秒变红色提醒
    if (remainingTime <= 3 && isRecording) {
        timer.style.color = '#ff6b6b';
    } else {
        timer.style.color = '#333';
    }
}

// 开始声波可视化
function startWaveformVisualization() {
    if (!analyser || !waveformCtx) {
        console.warn('声波可视化初始化失败：analyser或waveformCtx未定义');
        return;
    }
    
    console.log('开始声波可视化');
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!isRecording) {
            console.log('录音已停止，停止声波可视化');
            return;
        }
        
        animationId = requestAnimationFrame(draw);
        
        try {
        analyser.getByteFrequencyData(dataArray);
        
        // 清除画布
        waveformCtx.fillStyle = '#f8f9fa';
        waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        
        // 绘制声波
        const barWidth = waveformCanvas.width / bufferLength * 4;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i += 4) {
            const barHeight = (dataArray[i] / 255) * waveformCanvas.height * 0.8;
            
                // 添加最小高度，确保即使没有声音也有轻微显示
                const minHeight = 2;
                const finalHeight = Math.max(barHeight, minHeight);
                
                const gradient = waveformCtx.createLinearGradient(0, waveformCanvas.height, 0, waveformCanvas.height - finalHeight);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            
            waveformCtx.fillStyle = gradient;
                waveformCtx.fillRect(x, waveformCanvas.height - finalHeight, barWidth - 1, finalHeight);
            
            x += barWidth;
            }
        } catch (error) {
            console.error('声波可视化绘制错误:', error);
            cancelAnimationFrame(animationId);
        }
    }
    
    draw();
}

// 停止声波可视化
function stopWaveformVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// 录音完成处理
function onRecordingComplete() {
    if (!recordingActions || !recordBtn || !recordBtnText || !recordingHint) return;
    
    // 显示操作按钮
    recordingActions.style.display = 'flex';
    
    // 显示播放按钮
    const playRecordingBtn = document.getElementById('playRecordingBtn');
    if (playRecordingBtn) {
        playRecordingBtn.style.display = 'inline-block';
    }
    
    // 更新录音按钮状态
    recordBtn.classList.add('completed');
    recordBtnText.textContent = '录音完成';
    recordBtn.disabled = true;
    
    // 重置倒计时显示
    remainingTime = 10;
    updateTimerDisplay();
    recordingHint.textContent = '录音已完成';
    
    // 语音识别已在录音过程中完成
    
    showNotification('录音完成！', 'success');
}

// 重新录制
function resetRecording() {
    // 重置状态
    resetRecordingState();
    
    // 隐藏操作按钮
    if (recordingActions) {
    recordingActions.style.display = 'none';
    }
    
    // 重新初始化波形显示
    initializeWaveform();
    
    showNotification('已重置，可以重新录音', 'info');
}

// 重置录音状态
function resetRecordingState() {
    isRecording = false;
    recordedBlob = null;
    audioChunks = [];
    remainingTime = 10;
    
    stopTimer();
    stopWaveformVisualization();
    stopSpeechRecognition();
    
    // 清除语音识别结果
    localStorage.removeItem('recognizedText');
    
    if (recordBtn && recordBtnText && recordingHint) {
    recordBtn.classList.remove('recording', 'pulse', 'completed');
    recordBtn.disabled = false;
    recordBtnText.textContent = '开始录音';
    recordingHint.textContent = '最多10秒';
    }
    
    // 隐藏播放按钮
    const playRecordingBtn = document.getElementById('playRecordingBtn');
    if (playRecordingBtn) {
        playRecordingBtn.style.display = 'none';
    }
    
    updateTimerDisplay();
    
    console.log('🔄 录音状态已重置');
}

// 完成录制，跳转到编辑页面
function finishRecording() {
    if (!recordedBlob) {
        showNotification('没有录音数据', 'warning');
        return;
    }
    
    // 显示加载提示
    if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    }
    
    // 上传音频到云存储或本地存储
    uploadAudioFile();
    
    async function uploadAudioFile() {
        try {
            const timestamp = Date.now().toString();
            const filename = `voicewave_${timestamp}.webm`;
            
            console.log('开始处理音频文件...');
            
            // 直接调用云函数上传
            const uploadResult = await uploadToCloudDirectly(recordedBlob, filename);
            
            if (uploadResult.success) {
                // 保存上传结果
                if (uploadResult.isCloudUpload) {
                    console.log('音频已处理完成:', uploadResult.cloudUrl);
                    localStorage.setItem('isCloudAudio', 'true');
                    localStorage.setItem('cloudAudioUrl', uploadResult.cloudUrl);
                    localStorage.setItem('simpleFileId', uploadResult.simpleFileId);
                    localStorage.setItem('audioPlayUrl', uploadResult.playUrl);
                    
                    // 显示上传状态
                    updateLoadingText('正在处理...');
                    
                    // 跳转到编辑页面
                    setTimeout(() => {
                        window.location.href = 'edit.html';
                    }, 1500);
                    
                } else {
                    console.log('使用本地存储:', uploadResult.localUrl);
                    localStorage.setItem('isCloudAudio', 'false');
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        localStorage.setItem('recordedAudio', e.target.result);
                    };
                    reader.readAsDataURL(recordedBlob);
                    localStorage.setItem('audioPlayUrl', uploadResult.playUrl);
                    
                    // 显示上传状态
                    updateLoadingText(`处理失败，已保存到本地 (${uploadResult.error})`);
                    
                    // 跳转到编辑页面
                    setTimeout(() => {
                        window.location.href = 'edit.html';
                    }, 1500);
                }
                
                localStorage.setItem('recordingTimestamp', timestamp);
                
            } else {
                throw new Error('音频保存失败');
            }
            
        } catch (error) {
            console.error('音频上传失败:', error);
            hideLoading();
            showNotification('音频保存失败，请重试', 'error');
        }
    }
    
    // 直接调用云函数上传
    async function uploadToCloudDirectly(audioBlob, filename) {
        try {
            console.log('正在处理音频文件...');
            
            // 将Blob转换为Base64
            const base64 = await blobToBase64(audioBlob);
            
            // 构造上传参数
            const uploadParams = {
                fileData: base64,
                fileName: filename,
                cloudPath: `voicewave-audio/${filename}`,
                fileType: audioBlob.type
            };
            
            console.log('处理参数:', uploadParams);
            
            // 调用云函数 - 优化CORS处理
            console.log('📡 尝试调用云函数...');
            
            // 检测云函数URL是否可访问
            const cloudFunctionUrl = 'https://fc-mp-71407943-224d-4e7e-a1f9-e6e1b9bd6d81.next.bspapp.com/uploadAudio';
            console.log('🔗 云函数URL:', cloudFunctionUrl);
            
            // 先进行CORS预检请求
            try {
                const preflightResponse = await fetch(cloudFunctionUrl, {
                    method: 'OPTIONS',
                    headers: {
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type'
                    }
                });
                console.log('✅ CORS预检成功');
            } catch (preflightError) {
                console.warn('⚠️ CORS预检失败，继续尝试POST请求:', preflightError);
            }
            
            let response;
            try {
                response = await fetch(cloudFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors',
                    credentials: 'omit',
                    body: JSON.stringify(uploadParams)
                });
            } catch (fetchError) {
                console.error('❌ 网络请求失败:', fetchError);
                console.log('🌐 检测到Vercel环境，云函数CORS配置可能有问题');
                throw new Error('云函数访问失败，已自动切换到本地存储模式');
            }
            
            const result = await response.json();
            console.log('处理响应:', result);
            
            // 解析响应
            let responseData;
            if (result.statusCode && result.body) {
                responseData = JSON.parse(result.body);
            } else {
                responseData = result;
            }
            
            if (response.ok && responseData.code === 0) {
                const cloudFileUrl = responseData.data.fileId;
                const simpleFileId = responseData.data.simpleFileId || cloudFileUrl.split('/').pop();
                
                return {
                    success: true,
                    isCloudUpload: true,
                    cloudUrl: cloudFileUrl,
                    simpleFileId: simpleFileId,
                    playUrl: generatePlayUrl(cloudFileUrl, simpleFileId)
                };
            } else {
                throw new Error(responseData.message || '处理失败');
            }
            
        } catch (error) {
            console.error('云存储处理失败:', error);
            
            // 检测是否在Vercel环境
            const isVercel = window.location.hostname.includes('vercel.app');
            if (isVercel) {
                console.log('🌐 检测到Vercel环境，云函数CORS配置问题，使用本地存储模式');
                console.log('💡 提示：本地环境云存储功能正常，Vercel环境暂时使用本地存储');
            } else {
                console.log('⚠️ 降级到本地存储模式');
            }
            
            // 降级到本地存储
            return {
                success: true,
                isCloudUpload: false,
                localUrl: URL.createObjectURL(audioBlob),
                playUrl: generateLocalPlayUrl(filename),
                error: error.message,
                fallback: true,
                environment: isVercel ? 'vercel' : 'local'
            };
        }
    }
    
    // Blob转Base64
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    // 生成播放URL
    function generatePlayUrl(cloudFileUrl, simpleFileId) {
        const baseUrl = window.location.origin + window.location.pathname.replace('record.html', 'play.html');
        const url = new URL(baseUrl);
        url.searchParams.set('audioUrl', cloudFileUrl);
        url.searchParams.set('fileId', simpleFileId);
        url.searchParams.set('timestamp', Date.now());
        return url.toString();
    }
    
    // 生成本地播放URL
    function generateLocalPlayUrl(filename) {
        const baseUrl = window.location.origin + window.location.pathname.replace('record.html', 'play.html');
        const url = new URL(baseUrl);
        url.searchParams.set('id', Date.now());
        url.searchParams.set('local', 'true');
        return url.toString();
    }
    
    // 更新加载提示文字
    function updateLoadingText(text) {
        const loadingText = document.querySelector('.loading-content p');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    

}

// 隐藏加载提示
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// 播放录音
function playRecording() {
    if (!recordedBlob) {
        showNotification('没有录音数据', 'warning');
        return;
    }
    
    const audio = new Audio();
    const url = URL.createObjectURL(recordedBlob);
    audio.src = url;
    
    audio.play().then(() => {
        showNotification('正在播放录音', 'info');
    }).catch(error => {
        console.error('播放失败:', error);
        showNotification('播放失败', 'warning');
    });
    
    audio.onended = () => {
        URL.revokeObjectURL(url);
    };
}

// 初始化语音识别
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // 如果已经存在语音识别对象，先停止它
        if (speechRecognition) {
            try {
                speechRecognition.stop();
            } catch (error) {
                console.log('停止旧语音识别对象时出错:', error);
            }
        }
        
        // 创建新的语音识别对象
        speechRecognition = new SpeechRecognition();
        
        speechRecognition.continuous = true; // 连续识别
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'zh-CN';
        speechRecognition.maxAlternatives = 1;
        
        speechRecognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // 只保存最终的识别结果
            if (finalTranscript && finalTranscript.trim()) {
                console.log('🎯 语音识别最终结果:', finalTranscript);
                showNotification(`识别到: ${finalTranscript}`, 'success');
                // 将识别结果存储，供编辑页面使用
                localStorage.setItem('recognizedText', finalTranscript.trim());
            } else if (interimTranscript && interimTranscript.trim()) {
                // 显示临时识别结果，但不保存
                console.log('🔄 语音识别临时结果:', interimTranscript);
            }
        };
        
        speechRecognition.onerror = function(event) {
            console.error('❌ 语音识别错误:', event.error);
            if (event.error === 'no-speech') {
                showNotification('未检测到语音，跳过识别', 'info');
            } else if (event.error === 'network') {
                showNotification('网络错误，语音识别失败', 'warning');
            } else if (event.error === 'not-allowed') {
                showNotification('麦克风权限被拒绝', 'warning');
            } else {
                showNotification('语音识别失败: ' + event.error, 'warning');
            }
        };
        
        speechRecognition.onend = function() {
            console.log('🏁 语音识别结束');
            // 检查是否有识别结果
            const recognizedText = localStorage.getItem('recognizedText');
            if (recognizedText) {
                console.log('✅ 语音识别完成，结果已保存:', recognizedText);
                showNotification('语音识别完成', 'success');
            } else {
                console.log('⚠️ 语音识别完成，但未识别到内容');
            }
        };
        
        speechRecognition.onstart = function() {
            console.log('🚀 语音识别开始');
            showNotification('语音识别已开始，请说话...', 'info');
        };
        
        console.log('✅ 语音识别初始化完成');
    } else {
        console.warn('⚠️ 浏览器不支持语音识别');
        showNotification('浏览器不支持语音识别功能', 'warning');
    }
}

// 开始语音识别
function startSpeechRecognition() {
    if (!speechRecognition) {
        console.log('语音识别不可用，浏览器可能不支持');
        return;
    }
    
    try {
        // 如果语音识别已经在运行，先停止它
        if (speechRecognition.state === 'recording') {
            console.log('停止正在运行的语音识别');
            speechRecognition.stop();
        }
        
        // 清除之前的识别结果
        localStorage.removeItem('recognizedText');
        
        // 启动语音识别
        speechRecognition.start();
        console.log('🎤 语音识别已启动');
        showNotification('开始语音识别...', 'info');
    } catch (error) {
        console.error('语音识别启动失败:', error);
        if (error.name === 'InvalidStateError') {
            console.log('语音识别状态错误，尝试重新初始化');
            // 重新初始化语音识别
            initializeSpeechRecognition();
            setTimeout(() => {
                try {
                    speechRecognition.start();
                    console.log('🎤 语音识别重新启动成功');
                } catch (retryError) {
                    console.error('语音识别重新启动失败:', retryError);
                    showNotification('语音识别启动失败，但录音功能正常', 'warning');
                }
            }, 100);
        } else {
            showNotification('语音识别启动失败: ' + error.message, 'warning');
        }
    }
}

// 停止语音识别
function stopSpeechRecognition() {
    if (speechRecognition) {
        try {
            speechRecognition.stop();
            console.log('语音识别已停止');
        } catch (error) {
            console.error('停止语音识别失败:', error);
        }
    }
}

// 执行语音识别（保留为兼容性，但不再使用）
function performSpeechRecognition() {
    console.log('performSpeechRecognition 已废弃，语音识别现在在录音过程中进行');
}

// 初始化麦克风列表
async function initializeMicrophoneList() {
    try {
        // 先添加一个默认选项
        microphoneSelect.innerHTML = '<option value="">正在获取麦克风列表...</option>';
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        console.log('找到的音频输入设备:', audioInputs);
        
        // 清空选择器
        microphoneSelect.innerHTML = '';
        
        if (audioInputs.length === 0) {
            microphoneSelect.innerHTML = '<option value="">点击录音按钮获取麦克风权限</option>';
            return;
        }
        
        // 添加麦克风选项
        audioInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `麦克风 ${index + 1}`;
            microphoneSelect.appendChild(option);
        });
        
        // 尝试选择默认麦克风（通常是第一个）
        if (audioInputs.length > 0) {
            microphoneSelect.value = audioInputs[0].deviceId;
            console.log('已选择默认麦克风:', audioInputs[0].label || '麦克风 1');
        }
    
    } catch (error) {
        console.error('获取麦克风列表失败:', error);
        microphoneSelect.innerHTML = '<option value="">点击录音按钮获取麦克风权限</option>';
        showNotification('麦克风列表将在获取权限后显示', 'info');
    }
}

// 刷新麦克风列表
async function refreshMicrophoneList() {
    console.log('刷新麦克风列表...');
    showNotification('正在刷新麦克风列表...', 'info');
    
    // 停止当前录音（如果有）
    if (isRecording) {
        stopRecording();
    }
    
    // 清理当前音频流
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    
    // 重新初始化麦克风列表
    await initializeMicrophoneList();
    
    // 如果已经有权限，重新获取麦克风流
    if (permissionGranted) {
        await getMicrophoneStream();
    }
    
    showNotification('麦克风列表已刷新', 'success');
}

// 切换麦克风
async function changeMicrophone() {
    const selectedDeviceId = microphoneSelect.value;
    
    if (!selectedDeviceId) {
        console.log('未选择麦克风设备');
        return;
    }
    
    console.log('切换到麦克风:', selectedDeviceId);
    showNotification('正在切换麦克风...', 'info');
    
    // 停止当前录音（如果有）
    if (isRecording) {
        stopRecording();
    }
    
    // 清理当前音频流
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    
    // 如果已经有权限，直接使用新选择的麦克风
    if (permissionGranted) {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: selectedDeviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // 重新设置音频上下文
            if (audioContext) {
                audioContext.close();
            }
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            
            console.log('麦克风切换成功');
            showNotification('麦克风切换成功', 'success');
            
        } catch (error) {
            console.error('麦克风切换失败:', error);
            showNotification('麦克风切换失败，请重试', 'error');
            
            // 回退到默认麦克风
            await getMicrophoneStream();
        }
    } else {
        // 如果没有权限，提示用户点击录音按钮
        showNotification('请点击录音按钮获取麦克风权限', 'info');
    }
}

// 返回首页
function goBack() {
    // 停止录音
    if (isRecording) {
        stopRecording();
    }
    
    // 清理音频流
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
    
    // 返回首页
    window.location.href = 'index.html';
}

// 显示通知（复用主页面的函数）
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
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#667eea'};
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

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
    if (isRecording) {
        stopRecording();
    }
});

// 导出全局函数
window.toggleRecording = toggleRecording;
window.resetRecording = resetRecording;
window.finishRecording = finishRecording;
window.playRecording = playRecording;
window.goBack = goBack;
window.closeNotification = closeNotification; 