# Web 平台实现规格

> 版本: 1.0 | 平台: Web | 更新日期: 2026-03-10

---

## 目录

1. [项目结构](#1-项目结构)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [核心组件规格](#4-核心组件规格)
5. [API 接口设计](#5-api-接口设计)
6. [状态管理](#6-状态管理)
7. [响应式断点](#7-响应式断点)
8. [性能优化](#8-性能优化)

---

## 1. 项目结构

```
web/
├── index.html              # 入口 HTML
├── main.js                 # 应用入口
├── styles/
│   ├── main.css           # 主样式
│   ├── components.css     # 组件样式
│   ├── tokens.css         # Design Tokens
│   └── responsive.css     # 响应式样式
├── js/
│   ├── app.js             # 应用主逻辑
│   ├── components/        # UI 组件
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── EquationInput.js
│   │   ├── EquationList.js
│   │   ├── PropertiesPanel.js
│   │   ├── CanvasToolbar.js
│   │   └── StatusBar.js
│   ├── adapters/         # 平台适配层
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

---

## 3. 目录结构

### 3.1 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>公式可视化</title>
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/responsive.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header class="header" id="header"></header>
    
    <!-- Main Content -->
    <main class="main-content">
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar"></aside>
      
      <!-- Canvas Area -->
      <section class="canvas-area">
        <div class="canvas-toolbar" id="canvas-toolbar"></div>
        <div class="canvas-container">
          <canvas id="coordinate-system"></canvas>
        </div>
        <div class="status-bar" id="status-bar"></div>
      </section>
      
      <!-- Properties Panel -->
      <aside class="properties-panel" id="properties-panel"></aside>
    </main>
  </div>
  
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

### 3.2 CSS 文件组织

#### tokens.css - Design Tokens

```css
:root {
  /* 颜色 - 品牌色 */
  --color-brand-50: #f0f9ff;
  --color-brand-100: #e0f2fe;
  --color-brand-200: #bae6fd;
  --color-brand-300: #7dd3fc;
  --color-brand-400: #38bdf8;
  --color-brand-500: #0ea5e9;
  --color-brand-600: #0284c7;
  --color-brand-700: #0369a1;
  --color-brand-800: #075985;
  --color-brand-900: #0c4a6e;

  /* 颜色 - 表面色 */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-tertiary: #f1f5f9;
  --surface-border: #e2e8f0;
  --surface-hover: #f1f5f9;
  --surface-active: #e2e8f0;

  /* 颜色 - 文本色 */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* 颜色 - 语义色 */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* 动画 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* 布局尺寸 */
  --header-height: 56px;
  --sidebar-width: 280px;
  --properties-width: 260px;
  --status-bar-height: 28px;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-primary: #0f172a;
    --surface-secondary: #1e293b;
    --surface-tertiary: #334155;
    --surface-border: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
  }
}
```

#### components.css - 组件样式

```css
/* ==================== Button ==================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 36px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-brand-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-600);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-secondary {
  background: var(--surface-primary);
  color: var(--text-secondary);
  border: 1px solid var(--surface-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-sm {
  height: 28px;
  padding: 0 var(--space-2);
  font-size: 12px;
}

/* ==================== Input ==================== */
.input {
  height: 36px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--surface-primary);
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-default);
}

.input:focus {
  outline: none;
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.input::placeholder {
  color: var(--text-muted);
}

/* ==================== Select ==================== */
.select {
  height: 36px;
  padding: var(--space-2) var(--space-3);
  padding-right: var(--space-8);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  font-size: 13px;
  background: var(--surface-primary);
  color: var(--text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select:focus {
  outline: none;
  border-color: var(--color-brand-500);
}

/* ==================== Slider ==================== */
.slider-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--surface-border);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-brand-500);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-default);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-value {
  min-width: 36px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
}

/* ==================== Checkbox ==================== */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-brand-500);
}

/* ==================== Color Picker ==================== */
.color-picker {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  cursor: pointer;
  overflow: hidden;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}
```

---

## 4. 核心组件规格

### 4.1 Header 组件

```javascript
// js/components/Header.js
export class Header {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      logo: 'FormulaViz',
      version: 'v1.0',
      onViewChange: options.onViewChange || (() => {}),
      onThemeToggle: options.onThemeToggle || (() => {}),
      onSettingsClick: options.onSettingsClick || (() => {}),
      onHelpClick: options.onHelpClick || (() => {})
    };
    this.currentView = '2d';
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="header-left">
        <div class="logo">
          ${this.options.logo} 
          <span class="version">${this.options.version}</span>
        </div>
        <div class="view-toggle">
          <button class="view-toggle-btn ${this.currentView === '2d' ? 'active' : ''}" 
                  data-view="2d">2D</button>
          <button class="view-toggle-btn ${this.currentView === '3d' ? 'active' : ''}" 
                  data-view="3d">3D</button>
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn" id="theme-toggle" title="切换主题">
          <span class="theme-icon">🌙</span>
        </button>
        <button class="icon-btn" id="settings-btn" title="设置">
          <span>⚙️</span>
        </button>
        <button class="icon-btn" id="help-btn" title="帮助">
          <span>❓</span>
        </button>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    // View Toggle
    this.container.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.setView(view);
        this.options.onViewChange(view);
      });
    });

    // Theme Toggle
    this.container.querySelector('#theme-toggle').addEventListener('click', () => {
      this.options.onThemeToggle();
    });

    // Settings
    this.container.querySelector('#settings-btn').addEventListener('click', () => {
      this.options.onSettingsClick();
    });

    // Help
    this.container.querySelector('#help-btn').addEventListener('click', () => {
      this.options.onHelpClick();
    });
  }

  setView(view) {
    this.currentView = view;
    this.container.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }

  setThemeIcon(isDark) {
    const icon = this.container.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';
  }
}
```

#### Header 样式

```css
.header {
  height: var(--header-height);
  background: var(--surface-primary);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo .version {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: var(--space-2);
}

.view-toggle {
  display: flex;
  background: var(--surface-tertiary);
  border-radius: var(--radius);
  padding: 3px;
}

.view-toggle-btn {
  padding: 6px 16px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all var(--duration-fast) var(--ease-default);
}

.icon-btn:hover {
  background: var(--surface-hover);
}
```

### 4.2 EquationInput 组件

```javascript
// js/components/EquationInput.js
export class EquationInput {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      presets: options.presets || [],
      onSubmit: options.onSubmit || ((formula, color, style) => {}),
      onPresetSelect: options.onPresetSelect || ((preset) => {})
    };
    this.state = {
      formula: '',
      color: '#ff4444',
      style: 'solid'
    };
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="sidebar-section">
        <div class="section-title">📝 输入方程</div>
        <div class="preset-dropdown">
          <button class="preset-dropdown-btn" id="preset-btn">
            选择预设公式 ▼
          </button>
          <div class="preset-menu" id="preset-menu">
            ${this.renderPresetMenu()}
          </div>
        </div>
        <div class="formula-input-group">
          <div class="input-row">
            <span class="input-prefix">y =</span>
            <input type="text" class="input formula-input" id="formula-field" 
                   value="${this.state.formula}" placeholder="输入表达式">
          </div>
          <div class="input-row">
            <input type="color" class="color-picker" id="color-field" 
                   value="${this.state.color}" title="选择颜色">
            <select class="select" id="style-field">
              <option value="solid" ${this.state.style === 'solid' ? 'selected' : ''}>实线</option>
              <option value="dashed" ${this.state.style === 'dashed' ? 'selected' : ''}>虚线</option>
              <option value="dotted" ${this.state.style === 'dotted' ? 'selected' : ''}>点线</option>
            </select>
            <button class="btn btn-primary" id="add-btn">添加</button>
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  renderPresetMenu() {
    return this.options.presets.map(category => `
      <div class="preset-category">
        <div class="preset-category-header">
          <span>${category.icon} ${category.name}</span>
        </div>
        <div class="preset-submenu">
          ${category.items.map(item => `
            <div class="preset-item" data-formula="${item.formula}">
              ${item.label}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    // Preset dropdown toggle
    const presetBtn = this.container.querySelector('#preset-btn');
    const presetMenu = this.container.querySelector('#preset-menu');
    
    presetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetMenu.classList.toggle('hidden');
    });

    // Close menu on outside click
    document.addEventListener('click', () => {
      presetMenu.classList.add('hidden');
    });

    // Preset item selection
    presetMenu.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const formula = e.target.dataset.formula;
        this.setFormula(formula);
        presetMenu.classList.add('hidden');
        this.options.onPresetSelect(formula);
      });
    });

    // Color change
    this.container.querySelector('#color-field').addEventListener('change', (e) => {
      this.state.color = e.target.value;
    });

    // Style change
    this.container.querySelector('#style-field').addEventListener('change', (e) => {
      this.state.style = e.target.value;
    });

    // Add button
    this.container.querySelector('#add-btn').addEventListener('click', () => {
      this.submit();
    });

    // Enter key to submit
    this.container.querySelector('#formula-field').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submit();
      }
    });
  }

  setFormula(formula) {
    this.state.formula = formula;
    this.container.querySelector('#formula-field').value = formula;
  }

  submit() {
    const formula = this.container.querySelector('#formula-field').value.trim();
    if (!formula) {
      alert('请输入方程');
      return;
    }
    this.options.onSubmit(formula, this.state.color, this.state.style);
    this.setFormula('');
  }
}
```

### 4.3 EquationList 组件

```javascript
// js/components/EquationList.js
export class EquationList {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      equations: options.equations || [],
      selectedIndex: options.selectedIndex ?? -1,
      onSelect: options.onSelect || ((index) => {}),
      onDelete: options.onDelete || ((index) => {}),
      onToggleVisibility: options.onToggleVisibility || ((index) => {}),
      onShowAll: options.onShowAll || (() => {}),
      onHideAll: options.onHideAll || (() => {}),
      onClearAll: options.onClearAll || (() => {})
    };
    this.render();
  }

  setEquations(equations) {
    this.options.equations = equations;
    this.render();
  }

  setSelectedIndex(index) {
    this.options.selectedIndex = index;
    this.render();
  }

  render() {
    const { equations, selectedIndex } = this.options;
    
    this.container.innerHTML = `
      <div class="sidebar-section">
        <div class="section-title">📋 方程列表 (${equations.length})</div>
        <div class="equation-list">
          ${equations.length === 0 ? `
            <div class="empty-state">暂无方程，请添加</div>
          ` : equations.map((eq, index) => `
            <div class="equation-item ${index === selectedIndex ? 'selected' : ''}" 
                 data-index="${index}">
              <input type="checkbox" class="eq-visibility" 
                     ${eq.visible ? 'checked' : ''} data-index="${index}">
              <span class="equation-color" style="background: ${eq.color}"></span>
              <span class="equation-text">y = ${eq.formula}</span>
              <div class="equation-actions">
                <button class="btn-sm edit-btn" data-index="${index}">编辑</button>
                <button class="btn-sm delete-btn" data-index="${index}">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
        ${equations.length > 0 ? `
          <div class="btn-group">
            <button class="btn-sm" id="show-all-btn">全显</button>
            <button class="btn-sm" id="hide-all-btn">全隐</button>
            <button class="btn-sm" id="clear-all-btn">清空</button>
          </div>
        ` : ''}
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    // Item click - select
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

    // Show all
    const showAllBtn = this.container.querySelector('#show-all-btn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => this.options.onShowAll());
    }

    // Hide all
    const hideAllBtn = this.container.querySelector('#hide-all-btn');
    if (hideAllBtn) {
      hideAllBtn.addEventListener('click', () => this.options.onHideAll());
    }

    // Clear all
    const clearAllBtn = this.container.querySelector('#clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有方程吗？')) {
          this.options.onClearAll();
        }
      });
    }
  }
}
```

### 4.4 PropertiesPanel 组件

```javascript
// js/components/PropertiesPanel.js
export class PropertiesPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      equation: options.equation || null,
      axisRange: options.axisRange || { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      showGrid: options.showGrid ?? true,
      showIntersections: options.showIntersections ?? true,
      onPropertyChange: options.onPropertyChange || ((key, value) => {}),
      onAxisChange: options.onAxisChange || ((range) => {}),
      onToggleGrid: options.onToggleGrid || ((show) => {}),
      onToggleIntersections: options.onToggleIntersections || ((show) => {})
    };
    this.render();
  }

  setEquation(equation) {
    this.options.equation = equation;
    this.render();
  }

  render() {
    const { equation, axisRange, showGrid, showIntersections } = this.options;
    
    this.container.innerHTML = `
      ${equation ? this.renderEquationProps(equation) : ''}
      ${this.renderTransformProps(equation)}
      ${this.renderAxisProps()}
    `;
    this.bindEvents();
  }

  renderEquationProps(equation) {
    return `
      <div class="properties-section">
        <div class="properties-header" data-section="equation">
          <span>方程属性</span>
          <span class="chevron">▼</span>
        </div>
        <div class="properties-content">
          <div class="property-row">
            <span class="property-label">颜色</span>
            <input type="color" class="color-picker" id="prop-color" 
                   value="${equation.color}">
          </div>
          <div class="property-row">
            <span class="property-label">线宽</span>
            <div class="slider-container">
              <input type="range" class="slider" id="prop-linewidth" 
                     min="1" max="5" value="${equation.lineWidth || 2}">
              <span class="slider-value" id="prop-linewidth-val">${equation.lineWidth || 2}px</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTransformProps(equation) {
    const transform = equation?.transform || { translateX: 0, translateY: 0, scale: 1, rotate: 0 };
    return `
      <div class="properties-section">
        <div class="properties-header" data-section="transform">
          <span>变换控制</span>
          <span class="chevron">▼</span>
        </div>
        <div class="properties-content">
          <div class="property-row">
            <span class="property-label">平移 X</span>
            <div class="slider-container">
              <input type="range" class="slider" id="prop-translate-x" 
                     min="-10" max="10" step="0.1" value="${transform.translateX}">
              <span class="slider-value" id="prop-translate-x-val">${transform.translateX}</span>
            </div>
          </div>
          <div class="property-row">
            <span class="property-label">平移 Y</span>
            <div class="slider-container">
              <input type="range" class="slider" id="prop-translate-y" 
                     min="-10" max="10" step="0.1" value="${transform.translateY}">
              <span class="slider-value" id="prop-translate-y-val">${transform.translateY}</span>
            </div>
          </div>
          <div class="property-row">
            <span class="property-label">缩放</span>
            <div class="slider-container">
              <input type="range" class="slider" id="prop-scale" 
                     min="0.1" max="3" step="0.1" value="${transform.scale}">
              <span class="slider-value" id="prop-scale-val">${transform.scale}</span>
            </div>
          </div>
          <div class="property-row">
            <span class="property-label">旋转</span>
            <div class="slider-container">
              <input type="range" class="slider" id="prop-rotate" 
                     min="0" max="360" value="${transform.rotate}">
              <span class="slider-value" id="prop-rotate-val">${transform.rotate}°</span>
            </div>
          </div>
          <button class="btn-sm" id="reset-transform" style="width: 100%; margin-top: var(--space-2);">
            重置变换
          </button>
        </div>
      </div>
    `;
  }

  renderAxisProps() {
    const { axisRange, showGrid, showIntersections } = this.options;
    return `
      <div class="properties-section">
        <div class="properties-header" data-section="axis">
          <span>坐标轴设置</span>
          <span class="chevron">▼</span>
        </div>
        <div class="properties-content">
          <div class="property-row">
            <span class="property-label">X 轴范围</span>
          </div>
          <div class="input-row" style="margin-bottom: var(--space-2);">
            <input type="number" class="input" id="axis-x-min" 
                   value="${axisRange.xMin}" style="padding: 4px 8px;">
            <span>~</span>
            <input type="number" class="input" id="axis-x-max" 
                   value="${axisRange.xMax}" style="padding: 4px 8px;">
          </div>
          <div class="property-row">
            <span class="property-label">Y 轴范围</span>
          </div>
          <div class="input-row" style="margin-bottom: var(--space-2);">
            <input type="number" class="input" id="axis-y-min" 
                   value="${axisRange.yMin}" style="padding: 4px 8px;">
            <span>~</span>
            <input type="number" class="input" id="axis-y-max" 
                   value="${axisRange.yMax}" style="padding: 4px 8px;">
          </div>
          <label class="checkbox-row">
            <input type="checkbox" class="checkbox" id="show-grid" 
                   ${showGrid ? 'checked' : ''}>
            <span>显示网格</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" class="checkbox" id="show-intersections" 
                   ${showIntersections ? 'checked' : ''}>
            <span>显示交点</span>
          </label>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Color
    const colorInput = this.container.querySelector('#prop-color');
    if (colorInput) {
      colorInput.addEventListener('change', (e) => {
        this.options.onPropertyChange('color', e.target.value);
      });
    }

    // Line width
    const linewidthInput = this.container.querySelector('#prop-linewidth');
    if (linewidthInput) {
      linewidthInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.container.querySelector('#prop-linewidth-val').textContent = value + 'px';
        this.options.onPropertyChange('lineWidth', value);
      });
    }

    // Transform sliders
    const sliders = ['translate-x', 'translate-y', 'scale', 'rotate'];
    sliders.forEach(id => {
      const input = this.container.querySelector(`#prop-${id}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          const suffix = id === 'rotate' ? '°' : (id === 'scale' ? '' : '');
          this.container.querySelector(`#prop-${id}-val`).textContent = value + suffix;
          
          const keyMap = {
            'translate-x': 'translateX',
            'translate-y': 'translateY',
            'scale': 'scale',
            'rotate': 'rotate'
          };
          this.options.onPropertyChange('transform.' + keyMap[id], value);
        });
      }
    });

    // Reset transform
    const resetBtn = this.container.querySelector('#reset-transform');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.options.onPropertyChange('transform', {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotate: 0
        });
        this.render();
      });
    }

    // Axis range
    ['x-min', 'x-max', 'y-min', 'y-max'].forEach(id => {
      const input = this.container.querySelector(`#axis-${id}`);
      if (input) {
        input.addEventListener('change', () => {
          this.options.onAxisChange({
            xMin: parseFloat(this.container.querySelector('#axis-x-min').value),
            xMax: parseFloat(this.container.querySelector('#axis-x-max').value),
            yMin: parseFloat(this.container.querySelector('#axis-y-min').value),
            yMax: parseFloat(this.container.querySelector('#axis-y-max').value)
          });
        });
      }
    });

    // Show grid
    const gridCheckbox = this.container.querySelector('#show-grid');
    if (gridCheckbox) {
      gridCheckbox.addEventListener('change', (e) => {
        this.options.onToggleGrid(e.target.checked);
      });
    }

    // Show intersections
    const intersectionsCheckbox = this.container.querySelector('#show-intersections');
    if (intersectionsCheckbox) {
      intersectionsCheckbox.addEventListener('change', (e) => {
        this.options.onToggleIntersections(e.target.checked);
      });
    }

    // Section collapse
    this.container.querySelectorAll('.properties-header').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        content.classList.toggle('hidden');
        header.querySelector('.chevron').textContent = content.classList.contains('hidden') ? '▶' : '▼';
      });
    });
  }
}
```

---

## 5. API 接口设计

### 5.1 全局状态

```javascript
// js/core/state.js
export const AppState = {
  // 视图模式
  viewMode: '2d', // '2d' | '3d'
  
  // 方程列表
  equations: [],
  
  // 当前选中
  selectedEquationIndex: -1,
  
  // 坐标轴范围
  axisRange: {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
  },
  
  // 显示选项
  showGrid: true,
  showIntersections: true,
  
  // 主题
  theme: 'light', // 'light' | 'dark' | 'auto'
  
  // 缩放
  zoom: 1,
  
  // 坐标显示
  mousePosition: { x: 0, y: 0 }
};
```

### 5.2 应用主类

```javascript
// js/app.js
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { EquationInput } from './components/EquationInput.js';
import { EquationList } from './components/EquationList.js';
import { PropertiesPanel } from './components/PropertiesPanel.js';
import { CanvasToolbar } from './components/CanvasToolbar.js';
import { StatusBar } from './components/StatusBar.js';

export class FormulaVizApp {
  constructor() {
    this.state = {
      viewMode: '2d',
      equations: [],
      selectedIndex: -1,
      axisRange: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      showGrid: true,
      showIntersections: true,
      theme: 'light',
      zoom: 100
    };
    
    this.initComponents();
    this.initEventListeners();
    this.loadFromStorage();
  }

  initComponents() {
    // Header
    this.header = new Header('header', {
      onViewChange: (view) => this.setViewMode(view),
      onThemeToggle: () => this.toggleTheme(),
      onSettingsClick: () => this.showSettings(),
      onHelpClick: () => this.showHelp()
    });

    // Sidebar
    this.sidebar = new Sidebar('sidebar', {
      presets: PRESETS_DATA,
      onPresetSelect: (preset) => this.handlePresetSelect(preset),
      onEquationSubmit: (formula, color, style) => this.addEquation(formula, color, style)
    });

    // Equation List
    this.equationList = new EquationList('equation-list', {
      equations: this.state.equations,
      selectedIndex: this.state.selectedIndex,
      onSelect: (index) => this.selectEquation(index),
      onDelete: (index) => this.deleteEquation(index),
      onToggleVisibility: (index) => this.toggleEquationVisibility(index),
      onShowAll: () => this.showAllEquations(),
      onHideAll: () => this.hideAllEquations(),
      onClearAll: () => this.clearAllEquations()
    });

    // Properties Panel
    this.propertiesPanel = new PropertiesPanel('properties-panel', {
      equation: null,
      axisRange: this.state.axisRange,
      showGrid: this.state.showGrid,
      showIntersections: this.state.showIntersections,
      onPropertyChange: (key, value) => this.updateEquationProperty(key, value),
      onAxisChange: (range) => this.setAxisRange(range),
      onToggleGrid: (show) => this.setShowGrid(show),
      onToggleIntersections: (show) => this.setShowIntersections(show)
    });

    // Canvas Toolbar
    this.canvasToolbar = new CanvasToolbar('canvas-toolbar', {
      onZoomIn: () => this.zoomIn(),
      onZoomOut: () => this.zoomOut(),
      onResetZoom: () => this.resetZoom(),
      onExportPNG: () => this.exportPNG(),
      onExportPDF: () => this.exportPDF(),
      onResetView: () => this.resetView()
    });

    // Status Bar
    this.statusBar = new StatusBar('status-bar');
  }

  // ... 其他方法
}
```

---

## 6. 状态管理

### 6.1 简单状态管理

```javascript
// js/core/store.js
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const prevState = this.state;
    const nextState = typeof updater === 'function' 
      ? updater(prevState) 
      : updater;
    
    this.state = { ...prevState, ...nextState };
    this.notify(prevState, nextState);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(prevState, nextState) {
    this.listeners.forEach(listener => listener(prevState, nextState));
  }
}

// 全局 store 实例
export const store = new Store({
  equations: [],
  selectedIndex: -1,
  viewMode: '2d',
  axisRange: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
  showGrid: true,
  showIntersections: true,
  theme: 'light'
});
```

---

## 7. 响应式断点

### 7.1 CSS 断点

```css
/* responsive.css */

/* Large Desktop */
@media (min-width: 1440px) {
  :root {
    --sidebar-width: 300px;
    --properties-width: 280px;
  }
}

/* Desktop */
@media (min-width: 1024px) and (max-width: 1439px) {
  :root {
    --sidebar-width: 280px;
    --properties-width: 260px;
  }
  
  .properties-panel {
    display: block;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    --sidebar-width: 240px;
  }
  
  .properties-panel {
    display: none;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .header {
    padding: 0 var(--space-4);
  }
  
  .sidebar {
    display: none;
  }
  
  .properties-panel {
    display: none;
  }
  
  .canvas-toolbar {
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-2);
  }
  
  .status-bar {
    flex-wrap: wrap;
    gap: var(--space-2);
  }
}
```

---

## 8. 性能优化

### 8.1 渲染优化

```javascript
// 使用 requestAnimationFrame 进行渲染
class RenderManager {
  constructor() {
    this.pendingRender = false;
  }

  requestRender(renderFn) {
    if (this.pendingRender) return;
    
    this.pendingRender = true;
    requestAnimationFrame(() => {
      renderFn();
      this.pendingRender = false;
    });
  }
}

// 虚拟滚动 - 大列表优化
class VirtualList {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight);
    this.scrollTop = 0;
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount + 2,
      this.items.length
    );
    
    // 只渲染可见项
    // ...
  }
}
```

### 8.2 懒加载

```javascript
// 模块懒加载
const modules = {
  '3d': () => import('./modules/renderer3D.js'),
  'pdf': () => import('./modules/pdfExporter.js')
};

async function loadModule(name) {
  const module = await modules[name]();
  return module.default;
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
