# App 平台实现规格

> 版本: 1.0 | 平台: App (移动端) | 更新日期: 2026-03-10

---

## 目录

1. [项目结构](#1-项目结构)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [核心组件规格](#4-核心组件规格)
5. [手势交互](#5-手势交互)
6. [响应式布局](#6-响应式布局)
7. [性能优化](#7-性能优化)

---

## 1. 项目结构

```
app/
├── index.html              # 入口 HTML
├── main.js                # 应用入口
├── styles/
│   ├── main.css           # 主样式
│   ├── components.css     # 组件样式
│   ├── tokens.css         # Design Tokens
│   └── mobile.css         # 移动端专用样式
├── js/
│   ├── app.js             # 应用主逻辑
│   ├── components/        # UI 组件
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── BottomSheet.js
│   │   ├── EquationInput.js
│   │   ├── EquationList.js
│   │   ├── FAB.js
│   │   └── CanvasToolbar.js
│   ├── gestures/          # 手势处理
│   │   ├── TouchHandler.js
│   │   └── GestureConfig.js
│   ├── adapters/          # 平台适配层
│   │   └── platformAdapter.js
│   └── index.js           # 导出入口
└── assets/
    └── icons/             # 图标资源
```

---

## 2. 技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| HTML5 | - | 语义化结构 |
| CSS3 | - | 样式与动画 |
| ES6+ | - | JavaScript 核心 |
| Canvas API | - | 2D 图形渲染 |
| WebGL | - | 3D 图形渲染 |
| Cordova | 12.x | App 打包 |

---

## 3. 目录结构

### 3.1 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>公式可视化</title>
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/mobile.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header class="app-header" id="header">
      <button class="menu-btn" id="menu-btn">☰</button>
      <span class="app-title">FormulaViz</span>
      <div class="header-actions">
        <button class="icon-btn" id="settings-btn">⚙️</button>
        <button class="icon-btn" id="export-btn">📤</button>
      </div>
    </header>

    <!-- Sidebar Overlay -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    
    <!-- Sidebar -->
    <aside class="app-sidebar" id="sidebar"></aside>

    <!-- Main Content -->
    <main class="app-main">
      <div class="canvas-wrapper">
        <canvas id="coordinate-system"></canvas>
      </div>
      
      <!-- View Toggle -->
      <div class="view-toggle-wrapper">
        <div class="view-toggle">
          <button class="view-toggle-btn active" data-view="2d">2D</button>
          <button class="view-toggle-btn" data-view="3d">3D</button>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav class="app-nav" id="bottom-nav">
      <div class="nav-item" data-action="equations">
        <span class="nav-icon">📋</span>
        <span class="nav-label">方程</span>
      </div>
      <div class="nav-item" data-action="export">
        <span class="nav-icon">📷</span>
        <span class="nav-label">导出</span>
      </div>
      <div class="nav-item" data-action="add" id="nav-add">
        <span class="nav-icon">➕</span>
        <span class="nav-label">添加</span>
      </div>
      <div class="nav-item" data-action="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">设置</span>
      </div>
    </nav>

    <!-- FAB -->
    <div class="fab-container" id="fab-container">
      <button class="fab main-fab" id="fab-main">➕</button>
      <div class="fab-actions hidden" id="fab-actions">
        <button class="fab fab-mini" data-action="2d">2D</button>
        <button class="fab fab-mini" data-action="export">📷</button>
        <button class="fab fab-mini" data-action="3d">3D</button>
      </div>
    </div>

    <!-- Add Equation Modal -->
    <div class="modal-overlay hidden" id="add-modal">
      <div class="modal">
        <div class="modal-header">
          <button class="modal-close" id="modal-close">✕</button>
          <span class="modal-title">添加方程</span>
          <button class="modal-done" id="modal-done">完成</button>
        </div>
        <div class="modal-content">
          <!-- Preset Categories -->
          <div class="preset-section">
            <div class="preset-chips">
              <button class="chip" data-category="linear">一次</button>
              <button class="chip" data-category="quadratic">二次</button>
              <button class="chip" data-category="trig">三角</button>
              <button class="chip" data-category="exp">指数</button>
              <button class="chip" data-category="log">对数</button>
              <button class="chip" data-category="3d">3D</button>
            </div>
          </div>
          
          <!-- Formula Input -->
          <div class="input-section">
            <label>方程输入</label>
            <div class="input-group">
              <span class="input-prefix">y =</span>
              <input type="text" class="input formula-input" id="formula-input" 
                     placeholder="sin(x)">
            </div>
          </div>
          
          <!-- Color Picker -->
          <div class="color-section">
            <label>颜色</label>
            <div class="color-grid">
              <button class="color-btn selected" style="background: #ef4444" data-color="#ef4444"></button>
              <button class="color-btn" style="background: #f97316" data-color="#f97316"></button>
              <button class="color-btn" style="background: #eab308" data-color="#eab308"></button>
              <button class="color-btn" style="background: #22c55e" data-color="#22c55e"></button>
              <button class="color-btn" style="background: #06b6d4" data-color="#06b6d4"></button>
              <button class="color-btn" style="background: #3b82f6" data-color="#3b82f6"></button>
              <button class="color-btn" style="background: #8b5cf6" data-color="#8b5cf6"></button>
              <button class="color-btn" style="background: #ec4899" data-color="#ec4899"></button>
            </div>
          </div>
          
          <!-- Line Style -->
          <div class="style-section">
            <label>线型</label>
            <div class="style-options">
              <button class="style-btn selected" data-style="solid">
                <span class="style-preview solid"></span>实线
              </button>
              <button class="style-btn" data-style="dashed">
                <span class="style-preview dashed"></span>虚线
              </button>
              <button class="style-btn" data-style="dotted">
                <span class="style-preview dotted"></span>点线
              </button>
            </div>
          </div>
          
          <!-- Add Button -->
          <button class="btn btn-primary btn-block" id="add-equation-btn">
            ＋ 添加到画布
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

### 3.2 移动端专用样式 (mobile.css)

```css
/* mobile.css - 移动端专用样式 */

:root {
  /* 移动端尺寸 */
  --header-height: 60px;
  --nav-height: 80px;
  --fab-size: 56px;
  --fab-mini-size: 44px;
  --sidebar-width: 85%;
  --max-sidebar-width: 320px;
  
  /* 移动端间距 */
  --space-mobile: 16px;
  --space-mobile-lg: 20px;
  
  /* 触摸区域 */
  --touch-target-min: 44px;
}

/* 基础重置 - 移动端优化 */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 输入框允许选择 */
input, textarea {
  -webkit-user-select: auto;
  user-select: auto;
}

/* ==================== Header ==================== */
.app-header {
  height: var(--header-height);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-mobile);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
}

.menu-btn, .header-actions .icon-btn {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: var(--radius);
}

.menu-btn:active, .header-actions .icon-btn:active {
  background: var(--surface-hover);
}

.header-actions {
  display: flex;
  gap: var(--space-1);
}

/* ==================== Sidebar ==================== */
.sidebar-overlay {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: var(--nav-height);
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-normal) var(--ease-default);
  z-index: 90;
}

.sidebar-overlay.open {
  opacity: 1;
  visibility: visible;
}

.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: var(--nav-height);
  width: var(--sidebar-width);
  max-width: var(--max-sidebar-width);
  background: var(--surface-primary);
  transform: translateX(-100%);
  transition: transform var(--duration-normal) var(--ease-default);
  z-index: 95;
  overflow-y: auto;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

.app-sidebar.open {
  transform: translateX(0);
}

/* ==================== Main Content ==================== */
.app-main {
  padding-top: var(--header-height);
  padding-bottom: var(--nav-height);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-mobile);
}

.canvas-wrapper canvas {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 4/3;
  background: var(--surface-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

/* ==================== View Toggle ==================== */
.view-toggle-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--space-mobile) 0;
}

.view-toggle {
  display: flex;
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  padding: 4px;
  box-shadow: var(--shadow);
}

.view-toggle-btn {
  padding: 10px 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all var(--duration-fast) var(--ease-default);
}

.view-toggle-btn.active {
  background: var(--color-brand-500);
  color: white;
}

/* ==================== Bottom Navigation ==================== */
.app-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: var(--surface-primary);
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 20px);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-muted);
  cursor: pointer;
  min-height: var(--touch-target-min);
  transition: color var(--duration-fast) var(--ease-default);
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: var(--color-brand-500);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 11px;
}

/* ==================== FAB ==================== */
.fab-container {
  position: fixed;
  right: 20px;
  bottom: calc(var(--nav-height) + 20px);
  z-index: 99;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.fab {
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all var(--duration-fast) var(--ease-default);
  box-shadow: var(--shadow-md);
}

.fab:active {
  transform: scale(0.95);
}

.main-fab {
  width: var(--fab-size);
  height: var(--fab-size);
  background: var(--color-brand-500);
  color: white;
  font-size: 24px;
}

.main-fab.open {
  background: var(--color-error);
  transform: rotate(45deg);
}

.fab-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fab-actions.hidden {
  display: none;
}

.fab-mini {
  width: var(--fab-mini-size);
  height: var(--fab-mini-size);
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: 16px;
}

.fab-mini:active {
  background: var(--surface-hover);
}

/* ==================== Modal ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 200;
  opacity: 1;
  visibility: visible;
  transition: all var(--duration-normal) var(--ease-default);
}

.modal-overlay.hidden {
  opacity: 0;
  visibility: hidden;
}

.modal-overlay.hidden .modal {
  transform: translateY(100%);
}

.modal {
  width: 100%;
  max-height: 85vh;
  background: var(--surface-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: translateY(0);
  transition: transform var(--duration-normal) var(--ease-default);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-mobile);
  border-bottom: 1px solid var(--surface-border);
}

.modal-close, .modal-done {
  min-width: var(--touch-target-min);
  height: var(--touch-target-min);
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close {
  color: var(--text-secondary);
}

.modal-done {
  color: var(--color-brand-500);
  font-weight: 500;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
}

.modal-content {
  padding: var(--space-mobile);
  overflow-y: auto;
}

/* ==================== Preset Chips ==================== */
.preset-section {
  margin-bottom: var(--space-mobile);
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  padding: 8px 16px;
  border: none;
  background: var(--surface-tertiary);
  color: var(--text-secondary);
  font-size: 14px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.chip.active {
  background: var(--color-brand-500);
  color: white;
}

.chip:active {
  transform: scale(0.95);
}

/* ==================== Input ==================== */
.input-section, .color-section, .style-section {
  margin-bottom: var(--space-mobile);
}

.input-section label, .color-section label, .style-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.input-group {
  display: flex;
  align-items: center;
  background: var(--surface-tertiary);
  border-radius: var(--radius);
  overflow: hidden;
}

.input-group .input-prefix {
  padding: 12px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  font-weight: 500;
}

.input-group .input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 16px;
}

/* ==================== Color Grid ==================== */
.color-grid {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.color-btn {
  width: 44px;
  height: 44px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.color-btn.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.color-btn:active {
  transform: scale(0.95);
}

/* ==================== Style Options ==================== */
.style-options {
  display: flex;
  gap: var(--space-2);
}

.style-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 12px;
  border: 1px solid var(--surface-border);
  background: var(--surface-primary);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.style-btn.selected {
  border-color: var(--color-brand-500);
  color: var(--color-brand-500);
  background: rgba(14, 165, 233, 0.05);
}

.style-preview {
  width: 24px;
  height: 3px;
  background: var(--text-primary);
}

.style-preview.dashed {
  background: repeating-linear-gradient(
    90deg,
    var(--text-primary),
    var(--text-primary) 4px,
    transparent 4px,
    transparent 6px
  );
}

.style-preview.dotted {
  background: repeating-linear-gradient(
    90deg,
    var(--text-primary),
    var(--text-primary) 2px,
    transparent 2px,
    transparent 4px
  );
}

/* ==================== Button Block ==================== */
.btn-block {
  width: 100%;
  height: 50px;
  font-size: 16px;
  margin-top: var(--space-mobile);
}

/* ==================== Safe Area ==================== */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .app-nav {
    padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  }
  
  .fab-container {
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 20px);
  }
}
```

---

## 4. 核心组件规格

### 4.1 Header 组件

```javascript
// js/components/Header.js
export class AppHeader {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      title: options.title || 'FormulaViz',
      onMenuClick: options.onMenuClick || (() => {}),
      onSettingsClick: options.onSettingsClick || (() => {}),
      onExportClick: options.onExportClick || (() => {})
    };
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <button class="menu-btn" id="menu-btn">☰</button>
      <span class="app-title">${this.options.title}</span>
      <div class="header-actions">
        <button class="icon-btn" id="settings-btn">⚙️</button>
        <button class="icon-btn" id="export-btn">📤</button>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('menu-btn').addEventListener('click', () => {
      this.options.onMenuClick();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.options.onSettingsClick();
    });
    
    document.getElementById('export-btn').addEventListener('click', () => {
      this.options.onExportClick();
    });
  }
}
```

### 4.2 BottomSheet/Sidebar 组件

```javascript
// js/components/Sidebar.js
export class AppSidebar {
  constructor(containerId, overlayId, options = {}) {
    this.container = document.getElementById(containerId);
    this.overlay = document.getElementById(overlayId);
    this.options = {
      equations: options.equations || [],
      onSelect: options.onSelect || ((index) => {}),
      onDelete: options.onDelete || ((index) => {}),
      onToggleVisibility: options.onToggleVisibility || ((index) => {})
    };
    this.isOpen = false;
    this.render();
  }

  render() {
    const { equations } = this.options;
    
    this.container.innerHTML = `
      <div class="sidebar-section">
        <div class="sidebar-title">预设分类</div>
        <div class="preset-list">
          <div class="preset-item">一次方程</div>
          <div class="preset-item">二次方程</div>
          <div class="preset-item">三角函数</div>
          <div class="preset-item">指数/对数</div>
          <div class="preset-item">三维曲面</div>
        </div>
      </div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">方程列表 (${equations.length})</div>
        <div class="equation-list">
          ${equations.length === 0 ? `
            <div class="empty-state">暂无方程</div>
          ` : equations.map((eq, index) => `
            <div class="equation-item" data-index="${index}">
              <input type="checkbox" class="eq-visibility" 
                     ${eq.visible ? 'checked' : ''} data-index="${index}">
              <span class="equation-color" style="background: ${eq.color}"></span>
              <span class="equation-text">y = ${eq.formula}</span>
              <button class="delete-btn" data-index="${index}">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.bindEvents();
  }

  bindEvents() {
    // Close on overlay click
    this.overlay.addEventListener('click', () => this.close());
    
    // Close on swipe
    let touchStartX = 0;
    this.container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    this.container.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].clientX - touchStartX;
      if (deltaX < -50) {
        this.close();
      }
    });
    
    // Equation item click
    this.container.querySelectorAll('.equation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        const index = parseInt(item.dataset.index);
        this.options.onSelect(index);
      });
    });
    
    // Visibility toggle
    this.container.querySelectorAll('.eq-visibility').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.options.onToggleVisibility(index);
      });
    });
    
    // Delete
    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.options.onDelete(index);
      });
    });
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.overlay.classList.add('open');
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
    this.overlay.classList.remove('open');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  setEquations(equations) {
    this.options.equations = equations;
    this.render();
  }
}
```

### 4.3 FAB 组件

```javascript
// js/components/FAB.js
export class FAB {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      onAction: options.onAction || ((action) => {})
    };
    this.isOpen = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <button class="fab main-fab" id="fab-main">➕</button>
      <div class="fab-actions hidden" id="fab-actions">
        <button class="fab fab-mini" data-action="2d">2D</button>
        <button class="fab fab-mini" data-action="export">📷</button>
        <button class="fab fab-mini" data-action="3d">3D</button>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const mainBtn = this.container.querySelector('#fab-main');
    const actions = this.container.querySelector('#fab-actions');
    
    mainBtn.addEventListener('click', () => {
      this.toggle();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && this.isOpen) {
        this.close();
      }
    });
    
    // Action buttons
    this.container.querySelectorAll('.fab-mini').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.options.onAction(action);
        this.close();
      });
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const mainBtn = this.container.querySelector('#fab-main');
    const actions = this.container.querySelector('#fab-actions');
    
    if (this.isOpen) {
      mainBtn.classList.add('open');
      actions.classList.remove('hidden');
    } else {
      mainBtn.classList.remove('open');
      actions.classList.add('hidden');
    }
  }

  close() {
    false;
    const this.isOpen = mainBtn = this.container.querySelector('#fab-main');
    const actions = this.container.querySelector('#fab-actions');
    mainBtn.classList.remove('open');
    actions.classList.add('hidden');
  }
}
```

### 4.4 AddModal 组件

```javascript
// js/components/AddModal.js
export class AddModal {
  constructor(modalId, options = {}) {
    this.modal = document.getElementById(modalId);
    this.options = {
      onSubmit: options.onSubmit || ((formula, color, style) => {}),
      onClose: options.onClose || (() => {})
    };
    this.state = {
      color: '#ef4444',
      style: 'solid'
    };
    this.render();
  }

  render() {
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    this.modal.querySelector('#modal-close').addEventListener('click', () => {
      this.close();
    });
    
    // Done button
    this.modal.querySelector('#modal-done').addEventListener('click', () => {
      this.submit();
    });
    
    // Overlay click to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // Category chips
    this.modal.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.modal.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
    
    // Color buttons
    this.modal.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.modal.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        this.state.color = e.target.dataset.color;
      });
    });
    
    // Style buttons
    this.modal.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.modal.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.state.style = e.currentTarget.dataset.style;
      });
    });
    
    // Add button
    this.modal.querySelector('#add-equation-btn').addEventListener('click', () => {
      this.submit();
    });
  }

  open() {
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal.classList.add('hidden');
    this.options.onClose();
  }

  submit() {
    const formula = this.modal.querySelector('#formula-input').value.trim();
    if (!formula) {
      alert('请输入方程');
      return;
    }
    this.options.onSubmit(formula, this.state.color, this.state.style);
    this.modal.querySelector('#formula-input').value = '';
    this.close();
  }
}
```

---

## 5. 手势交互

### 5.1 手势配置

```javascript
// js/gestures/GestureConfig.js
export const GestureConfig = {
  // 画布手势
  canvas: {
    // 单指拖动 - 移动坐标系
    singleTouchDrag: {
      threshold: 10,
      preventDefault: true
    },
    
    // 双指捏合 - 缩放
    pinch: {
      minDistance: 20,
      scaleThreshold: 0.1,
      preventDefault: true
    },
    
    // 双指旋转 (仅3D模式)
    rotate: {
      minAngle: 5,
      preventDefault: true
    },
    
    // 长按 - 显示坐标十字线
    longPress: {
      duration: 500,
      preventDefault: false
    }
  },
  
  // 列表手势
  list: {
    // 左滑删除
    swipeToDelete: {
      threshold: 80,
      direction: 'left'
    }
  }
};
```

### 5.2 触摸处理器

```javascript
// js/gestures/TouchHandler.js
export class TouchHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      onDrag: options.onDrag || ((deltaX, deltaY) => {}),
      onPinch: options.onPinch || ((scale) => {}),
      onRotate: options.onRotate || ((angle) => {}),
      onLongPress: options.onLongPress || (() => {}),
      onDoubleTap: options.onDoubleTap || (() => {})
    };
    
    this.touches = [];
    this.lastPinchDistance = 0;
    this.lastRotationAngle = 0;
    this.longPressTimer = null;
    this.lastTapTime = 0;
    
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  handleTouchStart(e) {
    e.preventDefault();
    this.touches = Array.from(e.touches);
    
    // 双指检测
    if (this.touches.length === 2) {
      this.lastPinchDistance = this.getDistance(this.touches[0], this.touches[1]);
      this.lastRotationAngle = this.getAngle(this.touches[0], this.touches[1]);
    }
    
    // 长按检测
    this.longPressTimer = setTimeout(() => {
      this.options.onLongPress();
    }, 500);
  }

  handleTouchMove(e) {
    e.preventDefault();
    clearTimeout(this.longPressTimer);
    
    const currentTouches = Array.from(e.touches);
    
    if (currentTouches.length === 1) {
      // 单指拖动
      const deltaX = currentTouches[0].clientX - this.touches[0].clientX;
      const deltaY = currentTouches[0].clientY - this.touches[0].clientY;
      this.options.onDrag(deltaX, deltaY);
    } else if (currentTouches.length === 2) {
      // 双指缩放
      const distance = this.getDistance(currentTouches[0], currentTouches[1]);
      const scale = distance / this.lastPinchDistance;
      if (Math.abs(scale - 1) > 0.01) {
        this.options.onPinch(scale);
        this.lastPinchDistance = distance;
      }
      
      // 双指旋转
      const angle = this.getAngle(currentTouches[0], currentTouches[1]);
      const deltaAngle = angle - this.lastRotationAngle;
      if (Math.abs(deltaAngle) > 1) {
        this.options.onRotate(deltaAngle);
        this.lastRotationAngle = angle;
      }
    }
    
    this.touches = currentTouches;
  }

  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    
    // 双击检测
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      this.options.onDoubleTap();
    }
    this.lastTapTime = now;
    
    this.touches = Array.from(e.touches);
  }

  getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getAngle(touch1, touch2) {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * 180 / Math.PI;
  }
}
```

---

## 6. 响应式布局

### 6.1 平板横屏布局

```css
/* 横屏模式 */
@media (orientation: landscape) and (min-width: 768px) {
  .canvas-wrapper canvas {
    max-width: 60vw;
  }
  
  .modal {
    max-width: 500px;
    margin: auto;
    border-radius: var(--radius-xl);
    max-height: 90vh;
  }
  
  .modal-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-mobile);
  }
  
  .btn-block {
    grid-column: span 2;
  }
}
```

### 6.2 平板适配

```css
/* iPad */
@media (min-width: 768px) {
  :root {
    --header-height: 56px;
    --nav-height: 60px;
  }
  
  .app-sidebar {
    max-width: 360px;
  }
  
  .canvas-wrapper canvas {
    max-width: 600px;
  }
  
  .view-toggle-btn {
    padding: 12px 40px;
  }
}
```

---

## 7. 性能优化

### 7.1 触摸反馈优化

```css
/* 移除300ms点击延迟 */
html {
  touch-action: manipulation;
}

/* 禁用弹性滚动 */
body {
  overscroll-behavior: none;
}

/* 硬件加速动画 */
.fab, .modal, .sidebar {
  will-change: transform;
  transform: translateZ(0);
}
```

### 7.2 渲染优化

```javascript
// 使用 transform 进行动画，避免重排
export function animateWithTransform(element, property, from, to, duration) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = from + (to - from) * easeOutCubic(progress);
    
    element.style[property] = value;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
