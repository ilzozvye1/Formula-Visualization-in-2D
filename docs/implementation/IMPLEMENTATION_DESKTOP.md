# Desktop 平台实现规格

> 版本: 1.0 | 平台: Desktop (Electron) | 更新日期: 2026-03-10

---

## 目录

1. [项目结构](#1-项目结构)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [核心组件规格](#4-核心组件规格)
5. [Electron 集成](#5-electron-集成)
6. [快捷键系统](#6-快捷键系统)
7. [窗口管理](#7-窗口管理)
8. [系统集成](#8-系统集成)

---

## 1. 项目结构

```
desktop/
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本
├── index.html              # 入口 HTML
├── styles/
│   ├── main.css           # 主样式
│   ├── components.css     # 组件样式
│   ├── tokens.css         # Design Tokens
│   └── desktop.css        # 桌面端专用样式
├── js/
│   ├── app.js             # 应用主逻辑
│   ├── components/        # UI 组件
│   │   ├── MenuBar.js
│   │   ├── Toolbar.js
│   │   ├── Dock.js
│   │   ├── EquationList.js
│   │   ├── PropertiesPanel.js
│   │   └── StatusBar.js
│   ├── ipc/              # IPC 通信
│   │   └── handlers.js
│   └── index.js           # 导出入口
└── assets/
    └── icons/             # 图标资源
```

---

## 2. 技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| Electron | 28.x | 桌面应用框架 |
| Node.js | 20.x | 运行时 |
| HTML5 | - | 语义化结构 |
| CSS3 | - | 样式与动画 |
| ES6+ | - | JavaScript 核心 |
| Canvas API | - | 图形渲染 |
| WebGL | - | 3D 渲染 |

---

## 3. 目录结构

### 3.1 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
  <title>公式可视化</title>
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/desktop.css">
</head>
<body>
  <div id="app">
    <!-- Menu Bar -->
    <div class="menu-bar" id="menu-bar"></div>

    <!-- Toolbar -->
    <div class="toolbar" id="toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-new" title="新建 (Ctrl+N)">
          <span class="btn-icon">📂</span>
          <span class="btn-label">新建</span>
        </button>
        <button class="toolbar-btn" id="btn-open" title="打开 (Ctrl+O)">
          <span class="btn-icon">📂</span>
          <span class="btn-label">打开</span>
        </button>
        <button class="toolbar-btn" id="btn-save" title="保存 (Ctrl+S)">
          <span class="btn-icon">💾</span>
          <span class="btn-label">保存</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <div class="view-toggle-group">
          <button class="view-toggle-btn active" data-view="2d">2D</button>
          <button class="view-toggle-btn" data-view="3d">3D</button>
        </div>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-export-png" title="导出 PNG (Ctrl+E)">
          <span class="btn-icon">📷</span>
          <span class="btn-label">PNG</span>
        </button>
        <button class="toolbar-btn" id="btn-export-pdf" title="导出 PDF">
          <span class="btn-icon">📄</span>
          <span class="btn-label">PDF</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-undo" title="撤销 (Ctrl+Z)">
          <span class="btn-icon">↩️</span>
        </button>
        <button class="toolbar-btn" id="btn-redo" title="重做 (Ctrl+Y)">
          <span class="btn-icon">↪️</span>
        </button>
      </div>
      
      <div class="toolbar-spacer"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-settings" title="设置">
          <span class="btn-icon">⚙️</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="desktop-main">
      <!-- Dock -->
      <aside class="dock" id="dock">
        <button class="dock-btn active" data-panel="tools" title="工具">
          <span class="dock-icon">📐</span>
          <span class="dock-tooltip">工具</span>
        </button>
        <button class="dock-btn" data-panel="presets" title="预设">
          <span class="dock-icon">📊</span>
          <span class="dock-tooltip">预设</span>
        </button>
        <button class="dock-btn" data-panel="styles" title="样式">
          <span class="dock-icon">🎨</span>
          <span class="dock-tooltip">样式</span>
        </button>
        <button class="dock-btn" data-panel="layers" title="图层">
          <span class="dock-icon">🖼️</span>
          <span class="dock-tooltip">图层</span>
        </button>
        <button class="dock-btn" data-panel="files" title="文件">
          <span class="dock-icon">📁</span>
          <span class="dock-tooltip">文件</span>
        </button>
        <button class="dock-btn" data-panel="history" title="历史">
          <span class="dock-icon">📝</span>
          <span class="dock-tooltip">历史</span>
        </button>
        
        <div class="dock-spacer"></div>
        
        <button class="dock-btn" id="dock-settings" title="设置">
          <span class="dock-icon">⚙️</span>
          <span class="dock-tooltip">设置</span>
        </button>
      </aside>

      <!-- Canvas Area -->
      <section class="canvas-area">
        <div class="canvas-container">
          <canvas id="coordinate-system"></canvas>
        </div>
        
        <!-- Canvas Controls -->
        <div class="canvas-controls">
          <button class="canvas-control-btn" id="canvas-zoom-out" title="缩小">
            <span>−</span>
          </button>
          <span class="canvas-zoom-level" id="zoom-level">100%</span>
          <button class="canvas-control-btn" id="canvas-zoom-in" title="放大">
            <span>+</span>
          </button>
          <button class="canvas-control-btn" id="canvas-fit" title="适应窗口">
            <span>⊡</span>
          </button>
        </div>
      </section>

      <!-- Properties Panel -->
      <aside class="properties-panel" id="properties-panel">
        <!-- Equations Section -->
        <div class="panel-section">
          <div class="panel-header" data-section="equations">
            <span class="panel-title">方程列表</span>
            <span class="panel-badge">3</span>
            <span class="panel-chevron">▼</span>
          </div>
          <div class="panel-content">
            <div class="equation-list">
              <div class="equation-item selected">
                <input type="checkbox" checked>
                <span class="equation-color" style="background: #ff4444"></span>
                <span class="equation-text">y = sin(x)</span>
                <button class="visibility-btn" title="切换可见">👁️</button>
              </div>
              <div class="equation-item">
                <input type="checkbox" checked>
                <span class="equation-color" style="background: #4488ff"></span>
                <span class="equation-text">y = cos(x)</span>
                <button class="visibility-btn" title="切换可见">👁️</button>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm btn-block" id="add-equation-btn">
              + 添加方程
            </button>
          </div>
        </div>

        <!-- Properties Section -->
        <div class="panel-section">
          <div class="panel-header" data-section="properties">
            <span class="panel-title">属性</span>
            <span class="panel-chevron">▼</span>
          </div>
          <div class="panel-content">
            <div class="property-group">
              <div class="property-row">
                <span class="property-label">颜色</span>
                <input type="color" class="color-picker" value="#ff4444">
              </div>
              <div class="property-row">
                <span class="property-label">线宽</span>
                <div class="slider-container">
                  <input type="range" class="slider" min="1" max="10" value="2">
                  <span class="slider-value">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transform Section -->
        <div class="panel-section">
          <div class="panel-header" data-section="transform">
            <span class="panel-title">变换</span>
            <span class="panel-chevron">▼</span>
          </div>
          <div class="panel-content">
            <div class="property-group">
              <div class="property-row">
                <span class="property-label">X</span>
                <div class="slider-container">
                  <input type="range" class="slider" min="-10" max="10" value="0" step="0.1">
                  <span class="slider-value">0</span>
                </div>
              </div>
              <div class="property-row">
                <span class="property-label">Y</span>
                <div class="slider-container">
                  <input type="range" class="slider" min="-10" max="10" value="0" step="0.1">
                  <span class="slider-value">0</span>
                </div>
              </div>
              <div class="property-row">
                <span class="property-label">缩放</span>
                <div class="slider-container">
                  <input type="range" class="slider" min="0.1" max="3" value="1" step="0.1">
                  <span class="slider-value">1.0</span>
                </div>
              </div>
              <div class="property-row">
                <span class="property-label">旋转</span>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="360" value="0">
                  <span class="slider-value">0°</span>
                </div>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm btn-block" id="reset-transform-btn">
              重置变换
            </button>
          </div>
        </div>

        <!-- Axis Section -->
        <div class="panel-section">
          <div class="panel-header" data-section="axis">
            <span class="panel-title">坐标轴</span>
            <span class="panel-chevron">▼</span>
          </div>
          <div class="panel-content">
            <div class="property-group">
              <div class="property-row">
                <span class="property-label">X 范围</span>
              </div>
              <div class="range-inputs">
                <input type="number" class="input input-sm" value="-10">
                <span>~</span>
                <input type="number" class="input input-sm" value="10">
              </div>
              <div class="property-row">
                <span class="property-label">Y 范围</span>
              </div>
              <div class="range-inputs">
                <input type="number" class="input input-sm" value="-10">
                <span>~</span>
                <input type="number" class="input input-sm" value="10">
              </div>
            </div>
            <label class="checkbox-row">
              <input type="checkbox" checked>
              <span>显示网格</span>
            </label>
            <label class="checkbox-row">
              <input type="checkbox" checked>
              <span>显示交点</span>
            </label>
          </div>
        </div>
      </aside>
    </main>

    <!-- Status Bar -->
    <footer class="status-bar" id="status-bar">
      <div class="status-item">
        <span class="status-icon">✓</span>
        <span>就绪</span>
      </div>
      <div class="status-item">
        <span>缩放:</span>
        <span id="status-zoom">100%</span>
      </div>
      <div class="status-item">
        <span>坐标:</span>
        <span id="status-coord">(0.00, 0.00)</span>
      </div>
      <div class="status-spacer"></div>
      <div class="status-item">
        <span>方程:</span>
        <span id="status-equations">3</span>
      </div>
    </footer>
  </div>
  
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

### 3.2 桌面端专用样式 (desktop.css)

```css
/* desktop.css - 桌面端专用样式 */

:root {
  /* 桌面端尺寸 */
  --menu-bar-height: 32px;
  --toolbar-height: 44px;
  --dock-width: 52px;
  --properties-width: 260px;
  --status-bar-height: 28px;
  
  /* 桌面端间距 */
  --space-desktop: 12px;
  --space-desktop-lg: 16px;
  
  /* 桌面端圆角 */
  --radius-desktop: 6px;
}

/* ==================== Menu Bar ==================== */
.menu-bar {
  height: var(--menu-bar-height);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  font-size: 13px;
}

.menu-item {
  position: relative;
  padding: 4px 12px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) var(--ease-default);
}

.menu-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--surface-primary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1) 0;
  display: none;
  z-index: 1000;
}

.menu-item:hover .menu-dropdown {
  display: block;
}

.menu-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}

.menu-dropdown-item:hover {
  background: var(--surface-hover);
}

.menu-dropdown-item .shortcut {
  color: var(--text-muted);
  font-size: 12px;
  margin-left: 24px;
}

.menu-divider {
  height: 1px;
  background: var(--surface-border);
  margin: var(--space-1) 0;
}

/* ==================== Toolbar ==================== */
.toolbar {
  height: var(--toolbar-height);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  gap: var(--space-2);
  position: fixed;
  top: var(--menu-bar-height);
  left: 0;
  right: 0;
  z-index: 99;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.toolbar-btn {
  height: 32px;
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-default);
}

.toolbar-btn:hover {
  background: var(--surface-hover);
  border-color: var(--surface-border);
  color: var(--text-primary);
}

.toolbar-btn:active {
  background: var(--surface-active);
}

.toolbar-btn.active {
  background: var(--color-brand-500);
  color: white;
  border-color: var(--color-brand-500);
}

.btn-icon {
  font-size: 16px;
}

.btn-label {
  font-size: 12px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--surface-border);
  margin: 0 var(--space-2);
}

.toolbar-spacer {
  flex: 1;
}

.view-toggle-group {
  display: flex;
  background: var(--surface-tertiary);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.view-toggle-btn {
  padding: 4px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-default);
}

.view-toggle-btn.active {
  background: var(--surface-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* ==================== Dock ==================== */
.dock {
  width: var(--dock-width);
  background: var(--surface-primary);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2) 0;
  gap: var(--space-1);
  position: fixed;
  top: calc(var(--menu-bar-height) + var(--toolbar-height));
  left: 0;
  bottom: var(--status-bar-height);
  z-index: 90;
}

.dock-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: var(--radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 20px;
  position: relative;
  transition: all var(--duration-fast) var(--ease-default);
}

.dock-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.dock-btn.active {
  background: var(--surface-tertiary);
  color: var(--color-brand-500);
}

.dock-icon {
  font-size: 22px;
}

.dock-tooltip {
  position: absolute;
  left: 48px;
  background: var(--text);
  color: white;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-fast) var(--ease-default);
  z-index: 200;
  pointer-events: none;
}

.dock-btn:hover .dock-tooltip {
  opacity: 1;
  visibility: visible;
}

.dock-spacer {
  flex: 1;
}

/* ==================== Main Content ==================== */
.desktop-main {
  display: flex;
  margin-top: calc(var(--menu-bar-height) + var(--toolbar-height));
  height: calc(100vh - var(--menu-bar-height) - var(--toolbar-height) - var(--status-bar-height));
}

/* ==================== Canvas Area ==================== */
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: var(--dock-width);
  margin-right: var(--properties-width);
  background: var(--surface-secondary);
  position: relative;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-desktop-lg);
}

.canvas-container canvas {
  max-width: 100%;
  max-height: 100%;
  background: var(--surface-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.canvas-controls {
  position: absolute;
  bottom: var(--space-desktop);
  right: var(--space-desktop);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--surface-primary);
  padding: var(--space-1);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.canvas-control-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-default);
}

.canvas-control-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.canvas-zoom-level {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* ==================== Properties Panel ==================== */
.properties-panel {
  width: var(--properties-width);
  background: var(--surface-primary);
  border-left: 1px solid var(--surface-border);
  position: fixed;
  top: calc(var(--menu-bar-height) + var(--toolbar-height));
  right: 0;
  bottom: var(--status-bar-height);
  overflow-y: auto;
  z-index: 80;
}

.panel-section {
  border-bottom: 1px solid var(--surface-border);
}

.panel-header {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  user-select: none;
}

.panel-header:hover {
  background: var(--surface-hover);
}

.panel-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-badge {
  background: var(--color-brand-500);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  margin-right: var(--space-2);
}

.panel-chevron {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform var(--duration-fast) var(--ease-default);
}

.panel-header.collapsed .panel-chevron {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 var(--space-4) var(--space-4);
}

.panel-header.collapsed + .panel-content {
  display: none;
}

/* ==================== Status Bar ==================== */
.status-bar {
  height: var(--status-bar-height);
  background: var(--surface-secondary);
  border-top: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-6);
  font-size: 12px;
  color: var(--text-muted);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.status-icon {
  font-size: 10px;
}

.status-spacer {
  flex: 1;
}

/* ==================== Inputs ==================== */
.input-sm {
  height: 28px;
  padding: 4px 8px;
  font-size: 12px;
  width: 60px;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.range-inputs .input {
  flex: 1;
}

.btn-block {
  width: 100%;
  margin-top: var(--space-2);
}
```

---

## 4. 核心组件规格

### 4.1 MenuBar 组件

```javascript
// js/components/MenuBar.js
export class MenuBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      onNew: options.onNew || (() => {}),
      onOpen: options.onOpen || (() => {}),
      onSave: options.onSave || (() => {}),
      onSaveAs: options.onSaveAs || (() => {}),
      onExportPNG: options.onExportPNG || (() => {}),
      onExportPDF: options.onExportPDF || (() => {}),
      onUndo: options.onUndo || (() => {}),
      onRedo: options.onRedo || (() => {}),
      onView2D: options.onView2D || (() => {}),
      onView3D: options.onView3D || (() => {}),
      onZoomFit: options.onZoomFit || (() => {}),
      onToggleGrid: options.onToggleGrid || (() => {}),
      onToggleDarkMode: options.onToggleDarkMode || (() => {}),
      onAddEquation: options.onAddEquation || (() => {}),
      onShowAll: options.onShowAll || (() => {}),
      onHideAll: options.onHideAll || (() => {}),
      onClearAll: options.onClearAll || (() => {}),
      onHelp: options.onHelp || (() => {}),
      onAbout: options.onAbout || (() => {})
    };
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="menu-item" data-menu="file">
        文件
        <div class="menu-dropdown">
          <div class="menu-dropdown-item" data-action="new">
            新建画布 <span class="shortcut">Ctrl+N</span>
          </div>
          <div class="menu-dropdown-item" data-action="open">
            打开... <span class="shortcut">Ctrl+O</span>
          </div>
          <div class="menu-dropdown-item" data-action="save">
            保存 <span class="shortcut">Ctrl+S</span>
          </div>
          <div class="menu-dropdown-item" data-action="saveAs">
            另存为... <span class="shortcut">Ctrl+Shift+S</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="exportPNG">
            导出 PNG... <span class="shortcut">Ctrl+E</span>
          </div>
          <div class="menu-dropdown-item" data-action="exportPDF">
            导出 PDF... <span class="shortcut">Ctrl+Shift+E</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="exit">
            退出 <span class="shortcut">Alt+F4</span>
          </div>
        </div>
      </div>
      
      <div class="menu-item" data-menu="edit">
        编辑
        <div class="menu-dropdown">
          <div class="menu-dropdown-item" data-action="undo">
            撤销 <span class="shortcut">Ctrl+Z</span>
          </div>
          <div class="menu-dropdown-item" data-action="redo">
            重做 <span class="shortcut">Ctrl+Y</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="cut">
            剪切 <span class="shortcut">Ctrl+X</span>
          </div>
          <div class="menu-dropdown-item" data-action="copy">
            复制 <span class="shortcut">Ctrl+C</span>
          </div>
          <div class="menu-dropdown-item" data-action="paste">
            粘贴 <span class="shortcut">Ctrl+V</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="selectAll">
            全选 <span class="shortcut">Ctrl+A</span>
          </div>
          <div class="menu-dropdown-item" data-action="delete">
            删除 <span class="shortcut">Delete</span>
          </div>
        </div>
      </div>
      
      <div class="menu-item" data-menu="view">
        视图
        <div class="menu-dropdown">
          <div class="menu-dropdown-item" data-action="view2D">
            2D 模式 <span class="shortcut">Ctrl+1</span>
          </div>
          <div class="menu-dropdown-item" data-action="view3D">
            3D 模式 <span class="shortcut">Ctrl+2</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="zoomFit">
            缩放至适合 <span class="shortcut">Ctrl+0</span>
          </div>
          <div class="menu-dropdown-item" data-action="zoomIn">
            放大 <span class="shortcut">Ctrl++</span>
          </div>
          <div class="menu-dropdown-item" data-action="zoomOut">
            缩小 <span class="shortcut">Ctrl+-</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="toggleGrid">
            显示网格 <span class="shortcut">Ctrl+G</span>
          </div>
          <div class="menu-dropdown-item" data-action="toggleDarkMode">
            深色模式 <span class="shortcut">Ctrl+D</span>
          </div>
        </div>
      </div>
      
      <div class="menu-item" data-menu="equation">
        方程
        <div class="menu-dropdown">
          <div class="menu-dropdown-item" data-action="addEquation">
            添加方程 <span class="shortcut">Ctrl+Enter</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="showAll">
            全部显示 <span class="shortcut">Ctrl+Shift+H</span>
          </div>
          <div class="menu-dropdown-item" data-action="hideAll">
            全部隐藏
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="clearAll">
            清空所有 <span class="shortcut">Ctrl+Shift+Delete</span>
          </div>
        </div>
      </div>
      
      <div class="menu-item" data-menu="help">
        帮助
        <div class="menu-dropdown">
          <div class="menu-dropdown-item" data-action="help">
            使用教程 <span class="shortcut">F1</span>
          </div>
          <div class="menu-dropdown-item" data-action="shortcuts">
            快捷键参考
          </div>
          <div class="menu-divider"></div>
          <div class="menu-dropdown-item" data-action="about">
            关于
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.menu-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });
  }

  handleAction(action) {
    const actions = {
      new: this.options.onNew,
      open: this.options.onOpen,
      save: this.options.onSave,
      saveAs: this.options.onSaveAs,
      exportPNG: this.options.onExportPNG,
      exportPDF: this.options.onExportPDF,
      exit: () => window.close(),
      undo: this.options.onUndo,
      redo: this.options.onRedo,
      cut: () => document.execCommand('cut'),
      copy: () => document.execCommand('copy'),
      paste: () => document.execCommand('paste'),
      selectAll: () => document.execCommand('selectAll'),
      delete: this.options.onDelete,
      view2D: this.options.onView2D,
      view3D: this.options.onView3D,
      zoomFit: this.options.onZoomFit,
      zoomIn: this.options.onZoomIn,
      zoomOut: this.options.onZoomOut,
      toggleGrid: this.options.onToggleGrid,
      toggleDarkMode: this.options.onToggleDarkMode,
      addEquation: this.options.onAddEquation,
      showAll: this.options.onShowAll,
      hideAll: this.options.onHideAll,
      clearAll: this.options.onClearAll,
      help: this.options.onHelp,
      about: this.options.onAbout
    };
    
    if (actions[action]) {
      actions[action]();
    }
  }
}
```

### 4.2 Dock 组件

```javascript
// js/components/Dock.js
export class Dock {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      activePanel: options.activePanel || 'tools',
      onPanelChange: options.onPanelChange || ((panel) => {})
    };
    this.panels = {};
    this.render();
  }

  registerPanel(name, panel) {
    this.panels[name] = panel;
  }

  render() {
    this.container.querySelectorAll('.dock-btn[data-panel]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const panel = e.currentTarget.dataset.panel;
        this.setActivePanel(panel);
      });
    });
  }

  setActivePanel(panel) {
    this.container.querySelectorAll('.dock-btn[data-panel]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panel);
    });
    this.options.onPanelChange(panel);
  }
}
```

---

## 5. Electron 集成

### 5.1 主进程 (main.js)

```javascript
// main.js - Electron 主进程
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: '公式可视化',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile('index.html');

  // 创建应用菜单
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        { label: '新建', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new') },
        { label: '打开', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-action', 'open') },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-action', 'save') },
        { type: 'separator' },
        { label: '导出 PNG', accelerator: 'CmdOrCtrl+E', click: () => mainWindow.webContents.send('menu-action', 'exportPNG') },
        { label: '导出 PDF', accelerator: 'CmdOrCtrl+Shift+E', click: () => mainWindow.webContents.send('menu-action', 'exportPDF') },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('menu-action', 'undo') },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', click: () => mainWindow.webContents.send('menu-action', 'redo') },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '2D 模式', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('menu-action', 'view2D') },
        { label: '3D 模式', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('menu-action', 'view3D') },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.send('menu-action', 'zoomIn') },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('menu-action', 'zoomOut') },
        { label: '缩放至适合', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.send('menu-action', 'zoomFit') },
        { type: 'separator' },
        { label: '显示网格', accelerator: 'CmdOrCtrl+G', click: () => mainWindow.webContents.send('menu-action', 'toggleGrid') },
        { label: '深色模式', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('menu-action', 'toggleDarkMode') },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '使用教程', accelerator: 'F1', click: () => mainWindow.webContents.send('menu-action', 'help') },
        { type: 'separator' },
        { label: '关于', click: () => mainWindow.webContents.send('menu-action', 'about') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 处理器
ipcMain.handle('save-file', async (event, { data, defaultPath }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, data);
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const fs = require('fs');
    const data = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, data, filePath: result.filePaths[0] };
  }
  return { success: false };
});

ipcMain.handle('export-image', async (event, { dataUrl, defaultName, type }) => {
  const filters = type === 'png' 
    ? [{ name: 'PNG', extensions: ['png'] }]
    : [{ name: 'PDF', extensions: ['pdf'] }];
    
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters
  });
  
  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});
```

### 5.2 预加载脚本 (preload.js)

```javascript
// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', { data, defaultPath }),
  openFile: () => ipcRenderer.invoke('open-file'),
  exportImage: (dataUrl, defaultName, type) => ipcRenderer.invoke('export-image', { dataUrl, defaultName, type }),
  
  // 菜单操作
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  
  // 系统信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform
});
```

---

## 6. 快捷键系统

### 6.1 快捷键配置

```javascript
// js/core/shortcuts.js
export const Shortcuts = {
  // 文件操作
  'Ctrl+N': { action: 'new', description: '新建画布' },
  'Ctrl+O': { action: 'open', description: '打开文件' },
  'Ctrl+S': { action: 'save', description: '保存' },
  'Ctrl+Shift+S': { action: 'saveAs', description: '另存为' },
  'Ctrl+E': { action: 'exportPNG', description: '导出 PNG' },
  'Ctrl+Shift+E': { action: 'exportPDF', description: '导出 PDF' },
  
  // 编辑操作
  'Ctrl+Z': { action: 'undo', description: '撤销' },
  'Ctrl+Y': { action: 'redo', description: '重做' },
  'Ctrl+X': { action: 'cut', description: '剪切' },
  'Ctrl+C': { action: 'copy', description: '复制' },
  'Ctrl+V': { action: 'paste', description: '粘贴' },
  'Ctrl+A': { action: 'selectAll', description: '全选' },
  'Delete': { action: 'delete', description: '删除选中' },
  
  // 视图操作
  'Ctrl+1': { action: 'view2D', description: '2D 模式' },
  'Ctrl+2': { action: 'view3D', description: '3D 模式' },
  'Ctrl+0': { action: 'zoomFit', description: '缩放至适合' },
  'Ctrl+=': { action: 'zoomIn', description: '放大' },
  'Ctrl+-': { action: 'zoomOut', description: '缩小' },
  'Ctrl+G': { action: 'toggleGrid', description: '显示/隐藏网格' },
  'Ctrl+D': { action: 'toggleDarkMode', description: '切换深色模式' },
  
  // 方程操作
  'Ctrl+Enter': { action: 'addEquation', description: '添加方程' },
  'Ctrl+Shift+H': { action: 'showAll', description: '全部显示' },
  'Ctrl+Shift+Delete': { action: 'clearAll', description: '清空所有' },
  
  // 其他
  'Escape': { action: 'cancel', description: '取消选中' },
  'F1': { action: 'help', description: '帮助' }
};

export class ShortcutManager {
  constructor(options = {}) {
    this.shortcuts = Shortcuts;
    this.handlers = {};
    this.enabled = true;
    
    this.registerDefaultHandlers(options);
    this.bindEvents();
  }

  registerDefaultHandlers(handlers) {
    this.handlers = handlers;
  }

  register(key, handler) {
    if (this.shortcuts[key]) {
      this.handlers[this.shortcuts[key].action] = handler;
    }
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      const key = this.getKeyString(e);
      const shortcut = this.shortcuts[key];
      
      if (shortcut && this.handlers[shortcut.action]) {
        e.preventDefault();
        this.handlers[shortcut.action]();
      }
    });
  }

  getKeyString(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    
    let key = e.key.toUpperCase();
    if (key === ' ') key = 'Space';
    if (key === 'ENTER') key = 'Enter';
    if (key === 'DELETE') key = 'Delete';
    if (key === 'ESCAPE') key = 'Escape';
    
    parts.push(key);
    
    return parts.join('+');
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}
```

---

## 7. 窗口管理

### 7.1 窗口状态管理

```javascript
// js/core/windowState.js
export class WindowStateManager {
  constructor() {
    this.state = {
      width: 1280,
      height: 800,
      x: undefined,
      y: undefined,
      isMaximized: false,
      isFullScreen: false
    };
    
    this.loadState();
    this.applyState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('windowState');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load window state:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem('windowState', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save window state:', e);
    }
  }

  applyState() {
    if (window.electronAPI) {
      // Electron 环境
      window.electronAPI.setWindowState(this.state);
    } else {
      // 浏览器环境
      if (this.state.width) {
        window.innerWidth = this.state.width;
        window.innerHeight = this.state.height;
      }
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.saveState();
  }
}
```

---

## 8. 系统集成

### 8.1 托盘图标

```javascript
// 在 main.js 中添加托盘功能
const { Tray, Menu, nativeImage } = require('electron');

let tray = null;

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => mainWindow.show() },
    { label: '隐藏', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  
  tray.setToolTip('公式可视化');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}
```

### 8.2 通知

```javascript
// 通知功能
export function showNotification(title, body) {
  if (window.electronAPI) {
    window.electronAPI.showNotification(title, body);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
```

---

## 9. 商业化功能

### 9.1 功能限制

| 功能 | 免费版 | Pro版 |
|------|--------|-------|
| 方程数量 | ≤3个 | 无限 |
| 2D函数类型 | 15种 | 全部25种 |
| 3D曲线 | 3种 | 12种 |
| 3D曲面 | 3种 | 9种 |
| 预设公式 | 30个 | 200+个 |
| PNG导出 | ✅ | ✅ |
| PDF导出 | ❌ | ✅ |
| SVG导出 | ❌ | ✅ |
| 开机启动 | ❌ | ✅ |
| 系统托盘 | ❌ | ✅ |
| 无干扰模式 | ❌ | ✅ |
| 文件关联 | ❌ | ✅ |

### 9.2 定价

| 版本 | 价格 | 备注 |
|------|------|------|
| 桌面免费版 | ¥0 | 基础功能 |
| 桌面专业版 | ¥38 | 终身买断（首发¥28） |
| 桌面教育版 | ¥399/学期 | 10人团队 |

### 9.3 桌面端 Pro 菜单

```javascript
// 在菜单中添加 Pro 相关选项
const menuTemplate = [
  {
    label: '帮助',
    submenu: [
      { label: '使用教程', accelerator: 'F1', click: () => mainWindow.webContents.send('menu-action', 'help') },
      { type: 'separator' },
      { label: '升级 Pro', click: () => mainWindow.webContents.send('menu-action', 'showPro') },
      { label: '激活许可证', click: () => mainWindow.webContents.send('menu-action', 'activateLicense') },
      { type: 'separator' },
      { label: '关于', click: () => mainWindow.webContents.send('menu-action', 'about') }
    ]
  }
];
```

### 9.4 桌面端 Pro 标识

```html
<!-- Header 中的 Pro 标识 -->
<header class="desktop-header">
  <div class="header-left">
    <div class="app-title">FormulaViz</div>
  </div>
  <div class="header-right">
    <div class="pro-badge-container" id="pro-badge"></div>
  </div>
</header>
```

### 9.5 桌面端支付流程

```javascript
// js/components/PaymentWindow.js
export class PaymentWindow {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.window = null;
    this.plans = {
      lifetime: { id: 'desktop-lifetime', name: '桌面专业版', price: 38, period: null },
      education: { id: 'desktop-education', name: '桌面教育版', price: 399, period: null }
    };
  }

  open() {
    if (this.window) {
      this.window.focus();
      return;
    }

    this.window = new BrowserWindow({
      width: 500,
      height: 600,
      parent: this.mainWindow,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      title: '升级 Pro 版',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.window.loadURL('payment.html');
    this.window.setMenu(null);

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  close() {
    if (this.window) {
      this.window.close();
    }
  }
}
```

### 9.6 桌面端许可证激活

```javascript
// js/components/LicenseDialog.js
export class LicenseDialog {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  show() {
    const result = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'question',
      title: '激活许可证',
      message: '请输入您的许可证密钥',
      buttons: ['激活', '取消'],
      defaultId: 0
    });

    if (result === 0) {
      this.promptLicenseKey();
    }
  }

  async promptLicenseKey() {
    const { response, checkboxChecked } = await dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      title: '输入密钥',
      message: '请输入许可证密钥:',
      buttons: ['确定', '取消'],
      defaultId: 0,
      cancelId: 1
    });
  }
}
```

### 9.7 桌面端 Pro 功能实现

```javascript
// 开机启动
function setAutoStart(enabled) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe')
    });
  } else if (process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe')
    });
  }
}

// 系统托盘（Pro 功能）
function createProTray() {
  const trayMenu = Menu.buildFromTemplate([
    { 
      label: '显示 FormulaViz Pro', 
      click: () => mainWindow.show() 
    },
    { type: 'separator' },
    { 
      label: '开机启动', 
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => setAutoStart(menuItem.checked)
    },
    { type: 'separator' },
    { 
      label: '关于', 
      click: () => showAbout() 
    }
  ]);

  tray.setContextMenu(trayMenu);
}

// 文件关联（Pro 功能）
function setupFileAssociation() {
  if (process.platform === 'win32') {
    app.setAsDefaultProtocolClient('formulaviz');
  }
}
```

### 9.8 功能限制检查

```javascript
// js/core/FeatureGate.js
export class FeatureGate {
  constructor(featureManager) {
    this.featureManager = featureManager;
  }

  checkEquationLimit() {
    const limit = this.featureManager.getLimit('maxEquations');
    const currentCount = this.getCurrentEquationCount();

    if (currentCount >= limit) {
      this.showProDialog('方程数量已达上限', `免费版最多 ${limit} 个方程`);
      return false;
    }
    return true;
  }

  checkExportFormat(format) {
    if (format === 'pdf' || format === 'svg') {
      if (!this.featureManager.canUse(`allow${format.toUpperCase()}Export`)) {
        this.showProDialog(
          `${format.toUpperCase()} 导出是 Pro 专属功能`,
          '升级 Pro 版解锁 PDF 和 SVG 导出'
        );
        return false;
      }
    }
    return true;
  }

  checkDesktopFeature(feature) {
    if (!this.featureManager.canUse(feature)) {
      const featureNames = {
        'autoStart': '开机启动',
        'systemTray': '系统托盘',
        'distractionFree': '无干扰模式',
        'fileAssociation': '文件关联'
      };
      this.showProDialog(
        `${featureNames[feature] || feature}是 Pro 专属功能`,
        '升级 Pro 版解锁桌面端高级功能'
      );
      return false;
    }
    return true;
  }

  showProDialog(title, message) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Pro 专属功能',
      message: title,
      detail: message,
      buttons: ['升级 Pro', '取消'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        window.dispatchEvent(new CustomEvent('show-payment'));
      }
    });
  }

  getCurrentEquationCount() {
    return window.app ? window.app.state.equations.length : 0;
  }
}
```

### 9.9 桌面端样式扩展

```css
/* pro.css - 桌面端 Pro 样式 */

/* Header Pro Badge */
.pro-badge-container {
  display: flex;
  align-items: center;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.pro-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.pro-badge.activated {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  cursor: default;
}

.pro-badge.activated:hover {
  transform: none;
  box-shadow: none;
}

/* Pro 专属菜单项 */
.menu-item-pro {
  position: relative;
}

.menu-item-pro::after {
  content: '⚡';
  font-size: 10px;
  margin-left: 8px;
  opacity: 0.7;
}

/* Pro 功能禁用状态 */
.pro-feature-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 支付窗口样式 */
.payment-window {
  background: var(--surface-primary);
}

.payment-plan-card {
  padding: 20px;
  border: 2px solid var(--surface-border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.payment-plan-card:hover {
  border-color: var(--color-brand-300);
}

.payment-plan-card.selected {
  border-color: var(--color-brand-500);
  background: rgba(14, 165, 233, 0.05);
}

.payment-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-plan-name {
  font-size: 16px;
  font-weight: 600;
}

.payment-plan-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-brand-500);
}

.payment-plan-description {
  font-size: 13px;
  color: var(--text-muted);
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
