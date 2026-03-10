# 2D公式可视化 - 打包指南

## 版本信息
- **版本号**: 1.0.0
- **构建日期**: 2025-01-09
- **应用名称**: 2D公式可视化

---

## 一、Windows EXE 打包

### 前置要求
1. 安装 [Node.js](https://nodejs.org/) (推荐 v18+)
2. 安装 npm 或 yarn

### 打包步骤

1. **安装依赖**
```bash
cd "Formula Visualization in 2D"
npm install
```

2. **开发模式运行**
```bash
npm start
# 或
npm run start -- --dev  # 带开发者工具
```

3. **打包 Windows 应用**
```bash
# 打包所有格式
npm run build

# 仅打包 Windows
npm run build:win

# 仅打包 64 位 Windows
npm run dist
```

4. **输出文件**
打包完成后，在 `dist` 目录下会生成：
- `2D公式可视化 Setup 1.0.0.exe` - 安装程序
- `2D公式可视化 1.0.0.exe` - 便携版（无需安装）

### 注意事项
- 首次打包可能需要下载 Electron，请保持网络畅通
- 如需自定义图标，请替换 `assets/icon.ico` 文件
- 图标要求：256x256 像素的 ICO 格式

---

## 二、Android APK 打包

### 前置要求
1. 安装 [Node.js](https://nodejs.org/)
2. 安装 [Java JDK](https://www.oracle.com/java/technologies/downloads/) (推荐 JDK 11)
3. 安装 [Android Studio](https://developer.android.com/studio)
4. 配置 Android SDK

### 打包步骤

1. **进入 Cordova 目录**
```bash
cd "Formula Visualization in 2D/cordova"
```

2. **安装依赖**
```bash
npm install
```

3. **添加 Android 平台**
```bash
npm run setup
# 或
npx cordova platform add android
```

4. **准备资源文件**
将以下文件复制到 `cordova/www/` 目录：
- `index.html`
- `script.js`
- `styles.css`
- `assets/` 目录

5. **构建 APK**
```bash
# 调试版
npm run build

# 发布版（需要签名）
npm run build-release
```

6. **输出文件**
打包完成后，APK 文件位于：
- `platforms/android/app/build/outputs/apk/debug/app-debug.apk`
- `platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`

### APK 签名（发布版）

1. **生成密钥库**
```bash
keytool -genkey -v -keystore formula-visualization.keystore -alias formula -keyalg RSA -keysize 2048 -validity 10000
```

2. **签名 APK**
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore formula-visualization.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk formula
```

3. **优化 APK**
```bash
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk FormulaVisualization-1.0.0.apk
```

---

## 三、项目结构

```
Formula Visualization in 2D/
├── index.html              # 主页面
├── script.js               # 主要逻辑
├── styles.css              # 样式文件
├── package.json            # Electron 配置
├── main.js                 # Electron 主进程
├── preload.js              # Electron 预加载脚本
├── assets/                 # 图标资源
├── cordova/                # Cordova 移动版
│   ├── config.xml          # Cordova 配置
│   ├── package.json        # Cordova 依赖
│   └── www/                # 移动端资源
└── BUILD_GUIDE.md          # 本文件
```

---

## 四、常见问题

### Windows 打包问题

**Q: 打包时报错 "electron-builder not found"**
```bash
npm install electron-builder --save-dev
```

**Q: 图标不显示**
确保 `assets/icon.ico` 存在且格式正确

### Android 打包问题

**Q: 找不到 Android SDK**
设置环境变量：
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**Q: Gradle 构建失败**
```bash
cd platforms/android
./gradlew clean
./gradlew build
```

---

## 五、功能特性

### Windows 桌面版
- ✅ 原生应用窗口
- ✅ 系统菜单栏
- ✅ 快捷键支持
- ✅ 导出图像
- ✅ 自动更新支持

### Android 移动版
- ✅ 触摸操作支持
- ✅ 响应式布局
- ✅ 手势缩放
- ✅ 离线使用

---

## 六、联系方式

如有问题，请通过以下方式联系：
- 邮箱: support@formulavisualization.com
- 项目主页: https://formulavisualization.com

---

**版权所有 © 2025 Formula Visualization Team**
