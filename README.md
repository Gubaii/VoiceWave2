# 🎵 VoiceWave - 声纹可视化工具

## 📖 **项目简介**

VoiceWave是一个创新的声纹可视化工具，让用户的声音以美丽的视觉形式呈现。用户可以录制声音、生成艺术化的声纹图、添加个性化文字，并通过二维码分享给他人。

### ✨ **主要功能**

- 🎙️ **声音录制**：最多10秒的高质量音频录制
- 🎨 **声纹可视化**：6种精美的可视化样式（连续波形、垂直条形、均衡器等）
- 📝 **文字编辑**：多种中英文字体，自定义文字内容
- ☁️ **云端存储**：音频自动上传到Dcloud云空间
- 📱 **二维码分享**：生成真实可扫描的二维码，永久有效
- 🖼️ **高清导出**：支持PNG(2560x1920)和SVG格式导出
- 🌐 **跨平台访问**：支持PC端和移动端，响应式设计

## 🚀 **快速体验**

### 在线访问
[🔗 点击体验 VoiceWave](https://your-app.vercel.app)

### 本地运行
```bash
# 克隆项目
git clone https://github.com/your-username/voicewave-3.git
cd voicewave-3

# 启动本地服务器
python -m http.server 8000

# 访问应用
open http://localhost:8000
```

## 🛠️ **技术栈**

- **前端框架**：原生JavaScript + HTML5 + CSS3
- **音频处理**：Web Audio API + MediaRecorder API
- **语音识别**：Web Speech API
- **可视化**：Canvas 2D + SVG
- **二维码生成**：qrcode.js
- **图像导出**：html2canvas
- **云存储**：Dcloud uniCloud
- **部署平台**：Vercel

## 📁 **项目结构**

```
voicewave-3/
├── index.html              # 主页 - 样式选择
├── record.html             # 录制页面
├── edit.html               # 编辑页面
├── play.html               # 播放页面
├── style.css               # 全局样式
├── script.js               # 主页逻辑
├── record.js               # 录制逻辑
├── edit.js                 # 编辑逻辑
├── play.js                 # 播放逻辑
├── cloud-storage.js        # 云存储管理
├── dcloud-config.js        # 云存储配置
├── vercel.json             # Vercel部署配置
├── README.md               # 项目文档
├── Vercel部署指南.md       # 部署说明
└── 云存储配置指南.md       # 云存储配置
```

## 🎯 **核心功能流程**

### 1. 声纹生成流程
```
选择样式 → 录制音频 → 云端上传 → 声纹可视化 → 文字编辑 → 导出分享
```

### 2. 二维码分享流程
```
生成二维码 → 扫码访问 → 云端播放 → 声纹展示 → 音频播放
```

## ⚙️ **配置说明**

### Dcloud云存储配置

1. **获取配置信息**
   - 登录 [uniCloud控制台](https://unicloud.dcloud.net.cn/)
   - 创建云空间，获取 `spaceId` 和 `clientSecret`

2. **修改配置文件**
   ```javascript
   // dcloud-config.js
   const DCLOUD_CONFIG = {
       spaceId: 'your-space-id',
       clientSecret: 'your-client-secret',
       // ... 其他配置
   };
   ```

### 环境适配

项目支持多种部署环境：
- 🏠 **本地开发**：localhost自动检测
- ☁️ **Vercel部署**：自动HTTPS域名
- 🌐 **自定义域名**：动态域名适配

## 📱 **功能特点**

### 🎨 声纹样式
- **连续波形**：流畅的音频波形曲线
- **垂直条形**：动态的垂直音频条
- **均衡器**：经典的音频均衡器效果
- **心跳图**：心跳监测风格的波形
- **音频线**：简洁的音频线条
- **点阵图**：点状分布的音频可视化

### 📝 字体支持
- Inter（现代无衬线）
- Noto Sans SC（思源黑体）
- Noto Serif SC（思源宋体）
- Ma Shan Zheng（马善政毛笔）
- ZCOOL XiaoWei（站酷小薇）
- ZCOOL QingKe HuangYou（站酷庆科黄油）
- Zhi Mang Xing（志忙星）

### 🔲 二维码样式
- **方形**：经典方形二维码
- **圆形**：圆形渐变二维码
- **点阵**：点阵图案二维码
- **渐变**：多彩渐变二维码

## 🚀 **部署指南**

### Vercel部署（推荐）

1. **GitHub连接**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercel部署**
   - 访问 [vercel.com](https://vercel.com)
   - 连接GitHub仓库
   - 一键部署

3. **自动获得域名**
   - 类似：`https://voicewave-3-xxx.vercel.app`
   - 支持自定义域名

详细步骤请参考：[📖 Vercel部署指南](./Vercel部署指南.md)

## 🧪 **测试功能**

### 基础测试
- [ ] 访问主页并选择样式
- [ ] 录制10秒音频
- [ ] 编辑文字和字体
- [ ] 导出PNG/SVG文件

### 云存储测试
- [ ] 音频上传到云空间
- [ ] 二维码生成和扫描
- [ ] 跨设备播放测试

### 兼容性测试
- [ ] Chrome/Safari/Firefox
- [ ] PC端/移动端
- [ ] iOS/Android设备

## 🔧 **开发说明**

### 本地开发
```bash
# 启动服务器
python -m http.server 8000

# 或使用Node.js
npx serve .

# 或使用PHP
php -S localhost:8000
```

### 调试技巧
1. **打开浏览器开发者工具**
2. **查看Console面板**：详细的执行日志
3. **查看Network面板**：网络请求状态
4. **查看Application面板**：localStorage数据

## 📊 **性能优化**

### 已实现的优化
- ✅ **CDN加速**：使用Vercel全球CDN
- ✅ **图片压缩**：自动压缩静态资源
- ✅ **缓存策略**：合理的缓存配置
- ✅ **懒加载**：按需加载资源
- ✅ **响应式设计**：适配各种设备

### 性能指标
- **首屏加载**：< 2秒
- **音频录制**：实时处理
- **云端上传**：< 5秒（10秒音频）
- **导出处理**：< 3秒（高清图片）

## 🤝 **贡献指南**

欢迎贡献代码和建议！

1. **Fork项目**
2. **创建功能分支**
3. **提交更改**
4. **发起Pull Request**

### 开发规范
- 使用ES6+语法
- 保持代码注释
- 遵循响应式设计
- 考虑移动端体验

## 📄 **许可证**

本项目基于 MIT 许可证开源。

## 🙏 **致谢**

感谢以下开源项目：
- [qrcode.js](https://github.com/davidshimjs/qrcodejs) - 二维码生成
- [html2canvas](https://github.com/niklasvh/html2canvas) - 截图导出
- [uni-cloud-storage](https://github.com/79W/uni-cloud-storage) - 云存储SDK

## 📞 **联系方式**

- 项目地址：[GitHub](https://github.com/your-username/voicewave-3)
- 在线演示：[Vercel](https://your-app.vercel.app)
- 问题反馈：[Issues](https://github.com/your-username/voicewave-3/issues)

---

**VoiceWave - 让声音可见，让创意无限！** 🎵✨ 