# Web 平台实现规格

> 版本: 1.0 | 平台: Web (浏览器) | 更新日期: 2026-03-10

---

## 目录

1. [项目结构](#1-项目结构)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [核心组件规格](#4-核心组件规格)
5. [响应式布局](#5-响应式布局)
6. [PWA 支持](#6-pwa-支持)
7. [性能优化](#7-性能优化)
8. [商业化功能](#8-商业化功能)

---

## 1. 项目结构

```
web/
├── index.html              # 入口 HTML
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker
├── main.js                # 应用入口
├── styles/
│   ├── main.css           # 主样式
│   ├── components.css     # 组件样式
│   ├── tokens.css         # Design Tokens
│   ├── responsive.css     # 响应式样式
│   └── pro.css           # Pro 会员样式
├── js/
│   ├── app.js             # 应用主逻辑
│   ├── core/             # 核心模块
│   │   ├── FeatureFlags.js
│   │   ├── LicenseManager.js
│   │   ├── LicenseKeyGenerator.js
│   │   └── PaymentManager.js
│   ├── components/        # UI 组件
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── EquationInput.js
│   │   ├── EquationList.js
│   │   ├── CanvasToolbar.js
│   │   ├── ProBadge.js
│   │   ├── PaymentModal.js
│   │   └── FeatureGate.js
│   ├── render/            # 渲染引擎
│   │   ├── RenderEngine.js
│   │   └── Canvas2D.js
│   ├── parser/            # 公式解析
│   │   ├── Parser.js
│   │   └── Evaluator.js
│   ├── storage/          # 存储
│   │   └── Storage.js
│   └── index.js           # 导出入口
└── assets/
    ├── icons/             # 图标资源
    └── images/           # 图片资源
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
| Service Worker | - | PWA 离线支持 |
| LocalStorage | - | 数据持久化 |

---

## 3. 目录结构

### 3.1 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="公式可视化工具 - 数学函数图形绘制">
  <meta name="theme-color" content="#0ea5e9">
  <title>公式可视化</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/pro.css">
  <link rel="stylesheet" href="styles/responsive.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header class="web-header" id="header">
      <div class="header-left">
        <button class="menu-toggle" id="menu-toggle">☰</button>
        <div class="logo">
          <span class="logo-text">FormulaViz</span>
          <span class="logo-version">v1.0</span>
        </div>
      </div>
      
      <div class="header-center">
        <div class="view-toggle">
          <button class="view-toggle-btn active" data-view="2d">2D</button>
          <button class="view-toggle-btn" data-view="3d">3D</button>
        </div>
      </div>
      
      <div class="header-right">
        <div class="pro-badge-container" id="pro-badge"></div>
        <button class="header-btn" id="theme-toggle" title="切换主题">
          <span class="theme-icon">🌙</span>
        </button>
        <button class="header-btn" id="help-btn" title="帮助">?</button>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">预设公式</div>
        <div class="preset-categories">
          <button class="category-btn active" data-category="basic">基础</button>
          <button class="category-btn" data-category="trig">三角</button>
          <button class="category-btn" data-category="advanced">进阶</button>
          <button class="category-btn pro-only" data-category="pro">
            Pro <span class="pro-tag">⚡</span>
          </button>
        </div>
        <div class="preset-list" id="preset-list"></div>
      </div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">方程列表 <span class="equation-count" id="equation-count">0/3</span></div>
        <div class="equation-list" id="equation-list"></div>
        <button class="btn btn-primary btn-block" id="add-equation-btn">
          + 添加方程
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="canvas-wrapper">
        <canvas id="coordinate-system"></canvas>
        
        <!-- Canvas Overlay -->
        <div class="canvas-overlay hidden" id="canvas-overlay">
          <div class="overlay-content">
            <div class="overlay-icon">🔒</div>
            <div class="overlay-title">Pro 专属功能</div>
            <div class="overlay-description">升级 Pro 版解锁无限方程</div>
            <button class="btn btn-pro btn-lg" id="overlay-upgrade-btn">
              立即升级
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Toolbar -->
    <div class="toolbar" id="toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" id="zoom-out" title="缩小">
          <span>−</span>
        </button>
        <span class="zoom-level" id="zoom-level">100%</span>
        <button class="toolbar-btn" id="zoom-in" title="放大">
          <span>+</span>
        </button>
        <button class="toolbar-btn" id="zoom-fit" title="适应窗口">
          <span>⊡</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" id="toggle-grid" title="网格">
          <span class="btn-icon">▦</span>
        </button>
        <button class="toolbar-btn" id="toggle-intersections" title="交点">
          <span class="btn-icon">✕</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" id="export-png" title="导出 PNG">
          <span class="btn-icon">📷</span>
          <span class="btn-label">PNG</span>
        </button>
        <button class="toolbar-btn pro-btn" id="export-pdf" title="导出 PDF (Pro)">
          <span class="btn-icon">📄</span>
          <span class="btn-label">PDF</span>
          <span class="pro-indicator">⚡</span>
        </button>
      </div>
    </div>

    <!-- Add Equation Modal -->
    <div class="modal-overlay hidden" id="add-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>添加方程</h3>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        
        <div class="modal-content">
          <div class="input-group">
            <label>y =</label>
            <input type="text" class="formula-input" id="formula-input" 
                   placeholder="输入函数表达式，如 sin(x)">
          </div>
          
          <div class="quick-presets">
            <button class="quick-preset" data-formula="x">y = x</button>
            <button class="quick-preset" data-formula="x^2">y = x²</button>
            <button class="quick-preset" data-formula="sin(x)">y = sin(x)</button>
            <button class="quick-preset" data-formula="cos(x)">y = cos(x)</button>
            <button class="quick-preset" data-formula="exp(x)">y = eˣ</button>
            <button class="quick-preset" data-formula="log(x)">y = ln(x)</button>
          </div>
          
          <div class="style-options">
            <div class="style-option">
              <label>颜色</label>
              <div class="color-picker" id="color-picker">
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
            
            <div class="style-option">
              <label>线型</label>
              <div class="line-style-picker" id="line-style-picker">
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
            
            <div class="style-option">
              <label>线宽</label>
              <input type="range" class="line-width-slider" id="line-width" 
                     min="1" max="10" value="2">
              <span class="line-width-value" id="line-width-value">2px</span>
            </div>
          </div>
          
          <button class="btn btn-primary btn-lg btn-block" id="confirm-add-btn">
            添加到画布
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div class="modal-overlay hidden" id="payment-modal">
      <div class="modal payment-modal">
        <div class="payment-modal-content">
          <!-- 由 PaymentModal 组件渲染 -->
        </div>
      </div>
    </div>

    <!-- License Activation Modal -->
    <div class="modal-overlay hidden" id="license-modal">
      <div class="modal license-modal">
        <div class="modal-header">
          <h3>激活许可证</h3>
          <button class="modal-close" id="license-modal-close">✕</button>
        </div>
        <div class="modal-content">
          <p class="license-description">
            请输入您购买的许可证密钥
          </p>
          <div class="input-group">
            <input type="text" class="license-input" id="license-input" 
                   placeholder="PRO-XXXX-XXXXXX-XXXXXX">
          </div>
          <button class="btn btn-primary btn-lg btn-block" id="activate-license-btn">
            激活
          </button>
          <div class="license-help">
            <p>购买后请联系客服获取密钥</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toast-container"></div>
  </div>
  
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

### 3.2 Pro 样式 (pro.css)

```css
/* pro.css - Pro 会员相关样式 */

:root {
  --pro-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --pro-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Pro Badge */
.pro-badge-container {
  display: flex;
  align-items: center;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--pro-gradient);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.pro-badge:hover {
  transform: scale(1.05);
  box-shadow: var(--pro-shadow);
}

.pro-badge.activated {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.pro-badge.activated:hover {
  transform: none;
  box-shadow: none;
}

/* Pro Tag */
.pro-tag {
  font-size: 10px;
}

/* Pro Button */
.btn-pro {
  background: var(--pro-gradient);
  color: white;
  border: none;
}

.btn-pro:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: var(--pro-shadow);
}

/* Pro Only Category */
.category-btn.pro-only {
  position: relative;
}

.category-btn.pro-only::after {
  content: '⚡';
  font-size: 10px;
  margin-left: 4px;
}

.category-btn.pro-only.locked {
  opacity: 0.5;
}

.category-btn.pro-only.locked::after {
  content: '🔒';
}

/* Pro Indicator */
.pro-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--pro-gradient);
  color: white;
  font-size: 10px;
  border-radius: 50%;
  margin-left: 4px;
}

/* Pro Button in Toolbar */
.toolbar-btn.pro-btn {
  position: relative;
}

.toolbar-btn.pro-btn .pro-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
}

/* Pro Feature Disabled State */
.pro-feature-disabled {
  position: relative;
  pointer-events: none;
}

.pro-feature-disabled::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius);
  z-index: 1;
}

/* Canvas Overlay */
.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.overlay-content {
  text-align: center;
}

.overlay-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.overlay-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.overlay-description {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* Payment Modal */
.payment-modal {
  max-width: 420px;
}

.payment-modal-content {
  padding: 0;
}

.payment-header {
  padding: 24px;
  background: var(--pro-gradient);
  color: white;
  text-align: center;
}

.payment-header h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.payment-plans {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-plan {
  padding: 16px;
  border: 2px solid var(--surface-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.payment-plan:hover {
  border-color: var(--color-brand-300);
}

.payment-plan.selected {
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
  font-size: 15px;
  font-weight: 600;
}

.payment-plan-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-brand-500);
}

.payment-plan-period {
  font-size: 12px;
  color: var(--text-muted);
}

.payment-methods {
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.payment-method {
  flex: 1;
  max-width: 140px;
  padding: 12px;
  border: 2px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--surface-primary);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.payment-method:hover {
  border-color: var(--color-brand-300);
}

.payment-method.selected {
  border-color: var(--color-brand-500);
  background: rgba(14, 165, 233, 0.05);
}

.payment-method-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.payment-method-name {
  font-size: 13px;
}

.payment-actions {
  padding: 0 20px 20px;
}

.payment-submit {
  width: 100%;
}

.payment-qrcode {
  padding: 20px;
  text-align: center;
  background: var(--surface-secondary);
  display: none;
}

.payment-qrcode.visible {
  display: block;
}

.qrcode-placeholder {
  width: 180px;
  height: 180px;
  margin: 0 auto;
  background: white;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* License Modal */
.license-modal {
  max-width: 400px;
}

.license-description {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.license-input {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-family: monospace;
  text-align: center;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.license-help {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* Toast */
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  min-width: 300px;
  padding: 16px;
  background: var(--surface-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  transform: translateX(120%);
  transition: transform var(--duration-normal) var(--ease-default);
}

.toast.show {
  transform: translateX(0);
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-pro-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-pro-btn {
  flex-shrink: 0;
}

/* Dark Mode Pro Styles */
.dark .pro-badge {
  background: var(--pro-gradient);
}

.dark .canvas-overlay {
  background: rgba(15, 23, 42, 0.9);
}

.dark .qrcode-placeholder {
  background: var(--surface-secondary);
}
```

---

## 4. 核心组件规格

### 4.1 应用主逻辑

```javascript
// js/app.js
import { RenderEngine } from './render/RenderEngine.js';
import { Canvas2DRenderer } from './render/Canvas2D.js';
import { FormulaParser } from './parser/Parser.js';
import { StateManager } from './state/StateManager.js';
import { LicenseManager } from './core/LicenseManager.js';
import { FeatureManager } from './core/FeatureFlags.js';
import { PaymentModal } from './components/PaymentModal.js';
import { ProBadge } from './components/ProBadge.js';
import { FeatureGate } from './components/FeatureGate.js';

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
    
    this.initCore();
    this.initComponents();
    this.initEventListeners();
    this.loadFromStorage();
    this.render();
  }
  
  initCore() {
    this.storage = new StorageManager({ prefix: 'fv_' });
    this.licenseManager = new LicenseManager(this.storage);
    this.featureManager = new FeatureManager(this.licenseManager);
    this.featureGate = new FeatureGate(this.featureManager);
    this.parser = new FormulaParser();
    this.stateManager = new StateManager(this.state);
  }
  
  initComponents() {
    this.header = new Header('header', {
      onViewChange: (view) => this.setViewMode(view),
      onThemeToggle: () => this.toggleTheme(),
      onHelpClick: () => this.showHelp()
    });
    
    this.sidebar = new Sidebar('sidebar', {
      equations: this.state.equations,
      onSelect: (index) => this.selectEquation(index),
      onDelete: (index) => this.deleteEquation(index),
      onToggleVisibility: (index) => this.toggleEquationVisibility(index),
      onPresetSelect: (preset) => this.addEquation(preset.formula, preset.color, preset.style)
    });
    
    this.canvasRenderer = new Canvas2DRenderer(
      document.getElementById('coordinate-system'),
      this.state
    );
    
    this.proBadge = new ProBadge('pro-badge-container', {
      onUpgradeClick: () => this.showPaymentModal()
    });
    
    this.paymentModal = new PaymentModal('payment-modal', {
      platform: 'web',
      onActivate: (key) => this.activateLicense(key)
    });
    
    this.updateUI();
  }
  
  updateUI() {
    const isPro = this.licenseManager.isPro();
    this.proBadge.update(isPro);
    this.updateFeatureAccess();
    this.updateEquationCount();
  }
  
  updateFeatureAccess() {
    const isPro = this.licenseManager.isPro();
    
    // PDF 导出按钮
    const pdfBtn = document.getElementById('export-pdf');
    if (pdfBtn) {
      pdfBtn.classList.toggle('pro-btn', !isPro);
      pdfBtn.disabled = !isPro;
    }
    
    // Pro 分类
    const proCategory = document.querySelector('.category-btn.pro-only');
    if (proCategory) {
      proCategory.classList.toggle('locked', !isPro);
    }
    
    // 方程数量限制
    this.checkEquationLimit();
  }
  
  checkEquationLimit() {
    const limit = this.featureManager.getLimit('maxEquations');
    const currentCount = this.state.equations.length;
    
    if (currentCount >= limit) {
      this.showLimitWarning(limit);
    }
    
    this.updateEquationCount();
  }
  
  updateEquationCount() {
    const limit = this.featureManager.getLimit('maxEquations');
    const displayLimit = limit === Infinity ? '∞' : limit;
    const countEl = document.getElementById('equation-count');
    if (countEl) {
      countEl.textContent = `${this.state.equations.length}/${displayLimit}`;
    }
  }
  
  showLimitWarning(limit) {
    const featureGate = new FeatureGate(this.featureManager);
    featureGate.showLimitReached('方程数量', limit);
  }
  
  addEquation(formula, color = '#3b82f6', style = 'solid') {
    if (!this.featureGate.checkEquationLimit()) {
      return false;
    }
    
    const validation = this.parser.validate(formula);
    if (!validation.valid) {
      this.showToast(validation.error, 'error');
      return false;
    }
    
    const equation = {
      id: Date.now(),
      formula,
      color,
      style,
      lineWidth: 2,
      visible: true
    };
    
    this.state.equations.push(equation);
    this.saveToStorage();
    this.canvasRenderer.setEquations(this.state.equations);
    this.sidebar.updateEquations(this.state.equations);
    this.updateEquationCount();
    
    return true;
  }
  
  deleteEquation(index) {
    this.state.equations.splice(index, 1);
    this.saveToStorage();
    this.canvasRenderer.setEquations(this.state.equations);
    this.sidebar.updateEquations(this.state.equations);
    this.updateEquationCount();
  }
  
  toggleEquationVisibility(index) {
    if (this.state.equations[index]) {
      this.state.equations[index].visible = !this.state.equations[index].visible;
      this.saveToStorage();
      this.canvasRenderer.setEquations(this.state.equations);
    }
  }
  
  selectEquation(index) {
    this.state.selectedIndex = index;
    this.canvasRenderer.setSelectedIndex(index);
  }
  
  setViewMode(mode) {
    this.state.viewMode = mode;
    this.stateManager.setState('viewMode', mode);
    this.saveToStorage();
    this.header.setViewMode(mode);
  }
  
  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    this.storage.set('theme', this.state.theme);
  }
  
  showPaymentModal() {
    this.paymentModal.open();
  }
  
  activateLicense(key) {
    const result = this.licenseManager.activate(key);
    if (result.success) {
      this.showToast('许可证激活成功！', 'success');
      this.updateUI();
      this.paymentModal.close();
    } else {
      this.showToast(result.error, 'error');
    }
  }
  
  exportPNG() {
    this.canvasRenderer.exportPNG();
  }
  
  exportPDF() {
    if (!this.featureGate.checkAndPrompt('allowPDFExport', 'exportPDF')) {
      return;
    }
    // PDF 导出逻辑
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      ${!this.licenseManager.isPro() && type === 'warning' ? 
        '<button class="btn btn-pro btn-sm toast-pro-btn" onclick="window.showPaymentModal()">升级</button>' : ''}
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  saveToStorage() {
    this.storage.set('equations', this.state.equations);
    this.storage.set('axisRange', this.state.axisRange);
    this.storage.set('viewMode', this.state.viewMode);
  }
  
  loadFromStorage() {
    const equations = this.storage.get('equations', []);
    const axisRange = this.storage.get('axisRange', null);
    const viewMode = this.storage.get('viewMode', '2d');
    const theme = this.storage.get('theme', 'light');
    
    if (equations.length) this.state.equations = equations;
    if (axisRange) this.state.axisRange = axisRange;
    if (viewMode) this.state.viewMode = viewMode;
    this.state.theme = theme;
    
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  render() {
    this.canvasRenderer.setEquations(this.state.equations);
    this.sidebar.updateEquations(this.state.equations);
    this.updateUI();
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FormulaVizApp();
});
```

---

## 5. 响应式布局

### 5.1 断点定义

```css
/* responsive.css */

:root {
  --breakpoint-xs: 480px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

@media (max-width: 640px) {
  .web-header {
    height: 56px;
    padding: 0 12px;
  }
  
  .logo-version {
    display: none;
  }
  
  .header-btn {
    width: 36px;
    height: 36px;
  }
  
  .view-toggle-btn {
    padding: 6px 16px;
    font-size: 13px;
  }
  
  .sidebar {
    position: fixed;
    left: -280px;
    width: 280px;
    height: calc(100vh - 56px);
    z-index: 100;
    transition: left var(--duration-normal) var(--ease-default);
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .toolbar {
    height: 48px;
    padding: 0 8px;
    gap: 6px;
  }
  
  .toolbar-btn {
    padding: 6px 8px;
  }
  
  .btn-label {
    display: none;
  }
  
  .canvas-wrapper {
    padding: 8px;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .toolbar {
    padding: 0 16px;
  }
}

@media (min-width: 1025px) {
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    margin-left: 280px;
  }
  
  .toolbar {
    left: 280px;
  }
}
```

---

## 6. PWA 支持

### 6.1 Service Worker

```javascript
// sw.js
const CACHE_NAME = 'formula-viz-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/tokens.css',
  '/styles/components.css',
  '/styles/pro.css',
  '/styles/responsive.css',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});
```

### 6.2 Web App Manifest

```json
{
  "name": "公式可视化",
  "short_name": "FormulaViz",
  "description": "数学函数图形绘制工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "icons": [
    {
      "src": "/assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 7. 性能优化

### 7.1 渲染优化

```javascript
// 避免重复渲染
let renderTimeout = null;
const debouncedRender = () => {
  if (renderTimeout) {
    cancelAnimationFrame(renderTimeout);
  }
  renderTimeout = requestAnimationFrame(() => {
    canvasRenderer.render();
    renderTimeout = null;
  });
};

// 使用 requestAnimationFrame
const animate = (timestamp) => {
  update(timestamp);
  draw();
  requestAnimationFrame(animate);
};
```

### 7.2 懒加载

```javascript
// 预设公式懒加载
const presetModules = {
  basic: () => import('./presets/basic.js'),
  trig: () => import('./presets/trig.js'),
  advanced: () => import('./presets/advanced.js'),
  pro: () => import('./presets/pro.js')
};

async function loadPresets(category) {
  const module = await presetModules[category]();
  return module.default;
}
```

---

## 8. 商业化功能

### 8.1 功能限制触发点

| 触发场景 | 免费版限制 | 引导内容 |
|----------|------------|----------|
| 添加第4个方程 | 最多3个 | "升级Pro，无限方程" |
| 点击PDF导出 | 不可用 | "Pro专享功能" |
| 访问Pro预设分类 | 锁定 | "Pro专属200+公式" |
| 点击Pro徽章 | - | 打开支付弹窗 |
| 激活密钥 | - | 打开激活弹窗 |

### 8.2 订阅计划

| 计划 | 价格 | 有效期 | 功能 |
|------|------|--------|------|
| 月卡 | ¥9 | 30天 | 全部Pro功能 |
| 年卡 | ¥68 | 365天 | 全部Pro功能 |

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
