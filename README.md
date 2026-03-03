# 2D公式可视化

![版本](https://img.shields.io/badge/版本-1.0.0-blue.svg)
![构建日期](https://img.shields.io/badge/构建-2025--01--09-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

一个功能强大的2D公式可视化工具，可以在二维坐标系中展示多种类型的数学方程。

---

## 📋 版本信息

- **当前版本**: v1.0.0
- **构建日期**: 2025-01-09
- **应用名称**: 2D公式可视化
- **开发者**: Formula Visualization Team

---

## ✨ 功能特性

### 支持的方程类型
- ✅ **一次方程**（线性方程）：例如 `y=2x+1`
- ✅ **二次方程**：例如 `y=x²+2x+1`
- ✅ **幂函数**：例如 `y=x³`, `y=√x`, `y=1/x`
- ✅ **指数函数**：例如 `y=e^x`, `y=2^x`
- ✅ **对数函数**：例如 `y=ln(x)`, `y=log₁₀(x)`
- ✅ **三角函数**：例如 `y=sin(x)`, `y=cos(x)`, `y=tan(x)`
- ✅ **反三角函数**：例如 `y=arcsin(x)`, `y=arccos(x)`, `y=arctan(x)`
- ✅ **双曲函数**：例如 `y=sinh(x)`, `y=cosh(x)`, `y=tanh(x)`
- ✅ **绝对值函数**：例如 `y=|x|`, `y=|x-2|`
- ✅ **取整函数**：例如 `y=floor(x)`, `y=ceil(x)`, `y=round(x)`
- ✅ **特殊函数**：例如 `y=1/x`, `y=sin(x)/x`, `y=e^(-x²)`
- ✅ **微分函数**：例如 `deriv:x^2` 或 `y=deriv(x^2)`
- ✅ **积分函数**：例如 `integ:x^2:0:1` 或 `y=integ(x^2,0,1)`

### 核心功能
- 📊 **多方程绘制**：支持同时绘制多条方程
- 🎨 **自定义样式**：每条方程可选择不同颜色和线条样式（实线/虚线/点线）
- 👁️ **显示控制**：支持单独显示/隐藏每个方程
- 🖱️ **交互操作**：
  - 鼠标滚轮缩放坐标系
  - 鼠标拖动移动坐标系
  - 点击方程选中并拖拽移动
  - 方向键微调方程位置
- 💾 **数据持久化**：方程自动保存到本地存储
- 🌙 **深色模式**：支持浅色/深色主题切换
- 📤 **导出功能**：支持导出图像为PNG格式
- ⌨️ **快捷键支持**：丰富的键盘快捷键

---

## 🚀 快速开始

### Web 版（推荐）
直接在浏览器中打开 `index.html` 即可使用。

```bash
# 或使用本地服务器
python -m http.server 8080
# 然后访问 http://localhost:8080
```

### Windows 桌面版
1. 下载 Windows 安装包或便携版
2. 运行 `2D公式可视化 Setup 1.0.0.exe` 或 `2D公式可视化 1.0.0.exe`
3. 享受原生应用体验

### Android 移动版
1. 下载 APK 文件
2. 安装到 Android 设备（Android 7.0+）
3. 支持触摸手势操作

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + A` | 聚焦输入框 |
| `Ctrl + E` | 导出图像 |
| `Ctrl + R` | 重置视图 |
| `Ctrl + 0` | 重置缩放 |
| `Delete` | 删除选中方程 |
| `Escape` | 取消选中 / 关闭菜单 |
| `方向键` | 微调方程位置 |
| `Shift + 方向键` | 快速微调 |
| `鼠标滚轮` | 缩放坐标系 |
| `鼠标拖动` | 移动坐标系 |

---

## 📖 使用示例

### 基础方程
```
y=x                    # 过原点的直线
y=2x+1                 # 斜率为2，截距为1的直线
y=x^2                  # 标准抛物线
y=-x^2+4               # 开口向下的抛物线
```

### 三角函数
```
y=sin(x)               # 正弦函数
y=2cos(x)              # 振幅为2的余弦函数
y=sin(2x)              # 频率加倍的正弦函数
y=sin(x)+1             # 向上平移1个单位
```

### 特殊函数
```
y=exp(x)               # 自然指数函数
y=log(x)               # 自然对数函数
y=abs(x)               # 绝对值函数
y=floor(x)             # 向下取整函数
```

### 微分和积分
```
deriv:x^2              # x² 的导数
y=deriv(sin(x))        # sin(x) 的导数
integ:x^2:0:1          # x² 在 [0,1] 的定积分
y=integ(x^2,0,1)       # 同上，另一种写法
```

---

## 📦 打包指南

详细的打包说明请参考 [BUILD_GUIDE.md](./BUILD_GUIDE.md)

### Windows EXE
```bash
npm install
npm run build:win
```

### Android APK
```bash
cd cordova
npm install
npm run setup
npm run build
```

---

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **图形渲染**: HTML5 Canvas API
- **桌面端**: Electron
- **移动端**: Cordova / Android WebView
- **数据存储**: LocalStorage

---

## 📁 项目结构

```
Formula Visualization in 2D/
├── index.html              # 主页面
├── script.js               # 主要逻辑（含版本号 v1.0.0）
├── styles.css              # 样式文件
├── package.json            # Electron 配置
├── main.js                 # Electron 主进程
├── preload.js              # Electron 预加载脚本
├── assets/                 # 图标资源
├── cordova/                # Cordova 移动版配置
│   ├── config.xml          # Cordova 配置
│   ├── package.json        # Cordova 依赖
│   └── www/                # 移动端资源
├── README.md               # 本文件
└── BUILD_GUIDE.md          # 打包指南
```

---

## 📝 更新日志

### v1.0.0 (2025-01-09)
- ✨ 初始版本发布
- ✨ 支持 11 大类方程类型
- ✨ 添加微分和积分功能
- ✨ 实现方程拖拽交互
- ✨ 添加深色模式
- ✨ 支持导出图像
- ✨ 添加键盘快捷键
- ✨ 支持 Windows 和 Android 打包

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 邮箱: support@formulavisualization.com
- 🌐 项目主页: https://formulavisualization.com
- 💬 Issues: [GitHub Issues](../../issues)

---

<p align="center">
  <strong>Made with ❤️ by Formula Visualization Team</strong><br>
  <sub>Version 1.0.0 | Build 2025-01-09</sub>
</p>
