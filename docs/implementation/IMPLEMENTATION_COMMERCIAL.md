# 商业化功能实现规格

> 版本: 1.0 | 模块: 商业化功能 | 更新日期: 2026-03-10

---

## 目录

1. [功能开关系统](#1-功能开关系统)
2. [许可证管理](#2-许可证管理)
3. [支付流程](#3-支付流程)
4. [用户界面更新](#4-用户界面更新)
5. [存储与同步](#5-存储与同步)

---

## 1. 功能开关系统

### 1.1 统一配置

```javascript
// js/core/FeatureFlags.js
export const FeatureFlags = {
  // ========== 通用功能 ==========
  maxEquations: {
    free: 3,
    pro: Infinity
  },
  
  maxPresets: {
    free: 30,
    pro: 200
  },
  
  allowPDFExport: {
    free: false,
    pro: true
  },
  
  allowSVGExport: {
    free: false,
    pro: true
  },
  
  // ========== 2D函数类型 ==========
  available2DFunctions: {
    free: 15,
    pro: 25
  },
  
  free2DFunctions: [
    'linear', 'quadratic', 'cubic', 'quartic',
    'sine', 'cosine', 'tangent',
    'exponential', 'logarithmic',
    'polynomial', 'rational',
    'square-root', 'absolute', 'sign', 'step'
  ],
  
  proOnly2DFunctions: [
    'bessel', 'erf', 'gamma', 'digamma',
    'elliptic', 'hypergeometric', 'lambert-w'
  ],
  
  // ========== 3D功能 ==========
  free3DCurves: ['helix', 'trefoil', 'torus-knot'],
  pro3DCurves: [
    'helix', 'trefoil', 'torus-knot',
    'lissajous', 'viviani', 'spherical-spiral',
    'conical-spiral', 'rose', 'twisted-cubic',
    'sine-wave', 'figure-eight', 'cinquefoil'
  ],
  
  free3DSurfaces: ['plane', 'sphere', 'cone'],
  pro3DSurfaces: [
    'plane', 'sphere', 'cone',
    'paraboloid', 'hyperboloid', 'saddle',
    'wave', 'torus-surf', 'gaussian', 'ripple'
  ],
  
  // ========== 桌面专属 ==========
  desktopOnlyFeatures: {
    autoStart: { free: false, pro: true },
    systemTray: { free: false, pro: true },
    distractionFree: { free: false, pro: true },
    fileAssociation: { free: false, pro: true }
  },
  
  // ========== 移动专属 ==========
  mobileOnlyFeatures: {
    multiTouch: { free: false, pro: true },
    applePencil: { free: false, pro: true }
  }
};

export class FeatureManager {
  constructor(licenseManager) {
    this.licenseManager = licenseManager;
  }
  
  isPro() {
    return this.licenseManager.isPro();
  }
  
  canUse(feature) {
    if (this.isPro()) return true;
    
    const config = FeatureFlags[feature];
    if (!config) return true;
    
    if (typeof config === 'boolean') return config;
    if (config.free !== undefined) return config.free;
    
    return true;
  }
  
  getLimit(limitName) {
    if (this.isPro()) return Infinity;
    
    const limit = FeatureFlags[limitName];
    if (!limit || !limit.free) return Infinity;
    
    return limit.free;
  }
  
  isFeatureProOnly(featureName) {
    const flag = FeatureFlags[featureName];
    if (!flag) return false;
    
    if (flag.free === false) return true;
    if (flag.free !== undefined && flag.pro !== undefined) {
      return flag.free === false || flag.pro === true;
    }
    
    return false;
  }
}
```

---

## 2. 许可证管理

### 2.1 许可证密钥生成器

```javascript
// js/core/LicenseKeyGenerator.js
export class LicenseKeyGenerator {
  static TYPES = {
    MONTHLY: 'M',
    YEARLY: 'Y',
    LIFETIME: 'L'
  };
  
  static PERIODS = {
    M: 30 * 24 * 60 * 60 * 1000,
    Y: 365 * 24 * 60 * 60 * 1000,
    L: null
  };
  
  static generate(type = 'Y') {
    const date = this.formatDate(new Date());
    const random = this.generateRandomCode();
    return `PRO-${type}-${date}-${random}`;
  }
  
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  
  static generateRandomCode() {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  static validateFormat(key) {
    if (!key || typeof key !== 'string') return false;
    
    const regex = /^PRO-[MYL]-\d{8}-[a-z2-9]{6}$/i;
    return regex.test(key);
  }
  
  static getType(key) {
    const parts = key.split('-');
    return parts[1] || null;
  }
  
  static getDate(key) {
    const parts = key.split('-');
    return parts[2] || null;
  }
  
  static getExpiryDate(key) {
    const type = this.getType(key);
    const period = this.PERIODS[type];
    
    if (period === null) return null;
    
    const keyDate = this.getDate(key);
    if (!keyDate) return null;
    
    const year = parseInt(keyDate.substring(0, 4));
    const month = parseInt(keyDate.substring(4, 6)) - 1;
    const day = parseInt(keyDate.substring(6, 8));
    
    const issueDate = new Date(year, month, day);
    return new Date(issueDate.getTime() + period);
  }
}
```

### 2.2 许可证管理器

```javascript
// js/core/LicenseManager.js
import { LicenseKeyGenerator } from './LicenseKeyGenerator.js';
import { StorageManager } from './StorageManager.js';

export class LicenseManager {
  constructor(storageManager) {
    this.storage = storageManager || new StorageManager({ prefix: 'fv_license_' });
    this.license = null;
    this.listeners = [];
    this.loadLicense();
  }
  
  loadLicense() {
    const stored = this.storage.get('license');
    if (stored) {
      this.license = stored;
    }
  }
  
  saveLicense() {
    this.storage.set('license', this.license);
    this.notifyListeners();
  }
  
  activate(key) {
    if (!LicenseKeyGenerator.validateFormat(key)) {
      return { success: false, error: '无效的密钥格式' };
    }
    
    const expiryDate = LicenseKeyGenerator.getExpiryDate(key);
    
    if (expiryDate && expiryDate < new Date()) {
      return { success: false, error: '密钥已过期' };
    }
    
    this.license = {
      key: key,
      type: LicenseKeyGenerator.getType(key),
      activatedAt: new Date().toISOString(),
      expiresAt: expiryDate ? expiryDate.toISOString() : null
    };
    
    this.saveLicense();
    
    return { success: true, message: '激活成功' };
  }
  
  deactivate() {
    this.license = null;
    this.storage.remove('license');
    this.notifyListeners();
  }
  
  isPro() {
    if (!this.license) return false;
    
    if (this.license.type === 'L') return true;
    
    if (this.license.expiresAt) {
      const expiryDate = new Date(this.license.expiresAt);
      if (expiryDate < new Date()) {
        return false;
      }
    }
    
    return true;
  }
  
  getLicenseInfo() {
    if (!this.license) {
      return {
        activated: false,
        type: null,
        expiresAt: null,
        isPro: false
      };
    }
    
    return {
      activated: true,
      type: this.license.type,
      typeName: this.getTypeName(this.license.type),
      activatedAt: this.license.activatedAt,
      expiresAt: this.license.expiresAt,
      isPro: this.isPro()
    };
  }
  
  getTypeName(type) {
    const names = {
      'M': '月卡',
      'Y': '年卡',
      'L': '终身'
    };
    return names[type] || '未知';
  }
  
  onLicenseChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getLicenseInfo()));
  }
  
  getDaysRemaining() {
    if (!this.license || !this.license.expiresAt) return null;
    
    const expiryDate = new Date(this.license.expiresAt);
    const now = new Date();
    const diff = expiryDate - now;
    
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
```

---

## 3. 支付流程

### 3.1 支付管理器

```javascript
// js/core/PaymentManager.js
export class PaymentManager {
  constructor(options = {}) {
    this.onPaymentSuccess = options.onPaymentSuccess || (() => {});
    this.onPaymentError = options.onPaymentError || (() => {});
    
    this.plans = {
      web: {
        monthly: { id: 'web-monthly', name: 'Web Pro 月卡', price: 9, period: 30 },
        yearly: { id: 'web-yearly', name: 'Web Pro 年卡', price: 68, period: 365 }
      },
      desktop: {
        lifetime: { id: 'desktop-lifetime', name: '桌面专业版', price: 38, period: null }
      },
      app: {
        lifetime: { id: 'app-lifetime', name: '移动专业版', price: 18, period: null }
      }
    };
  }
  
  getPlans(platform) {
    return this.plans[platform] || this.plans.web;
  }
  
  selectPlan(platform, planId) {
    const plans = this.getPlans(platform);
    return plans[planId] || null;
  }
  
  initiatePayment(platform, planId) {
    const plan = this.selectPlan(platform, planId);
    if (!plan) {
      return { success: false, error: '无效的套餐' };
    }
    
    return {
      success: true,
      plan: plan,
      paymentInfo: this.generatePaymentInfo(plan)
    };
  }
  
  generatePaymentInfo(plan) {
    return {
      title: plan.name,
      amount: plan.price,
      description: this.getPlanDescription(plan)
    };
  }
  
  getPlanDescription(plan) {
    if (plan.period === null) {
      return '终身有效，无需续费';
    }
    return `${plan.period}天有效期`;
  }
  
  confirmPayment(paymentData) {
    setTimeout(() => {
      const key = LicenseKeyGenerator.generate(
        paymentData.plan.period === 30 ? 'M' :
        paymentData.plan.period === 365 ? 'Y' : 'L'
      );
      
      this.onPaymentSuccess({
        licenseKey: key,
        plan: paymentData.plan
      });
    }, 1000);
  }
}
```

### 3.2 支付页面组件

```javascript
// js/components/PaymentModal.js
export class PaymentModal {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      platform: options.platform || 'web',
      onClose: options.onClose || (() => {}),
      onActivate: options.onActivate || (() => {})
    };
    
    this.paymentManager = new PaymentManager();
    this.selectedPlan = null;
    
    this.render();
  }
  
  render() {
    const plans = this.paymentManager.getPlans(this.options.platform);
    
    this.container.innerHTML = `
      <div class="payment-modal">
        <div class="payment-header">
          <h2>升级 Pro 版</h2>
          <p class="payment-subtitle">解锁全部 Pro 专属功能</p>
          <button class="modal-close" id="payment-close">✕</button>
        </div>
        
        <div class="payment-plans">
          ${Object.entries(plans).map(([key, plan]) => `
            <div class="payment-plan" data-plan="${key}">
              <div class="plan-header">
                <span class="plan-name">${plan.name}</span>
                <span class="plan-price">¥${plan.price}</span>
              </div>
              <div class="plan-description">${this.getPlanDescription(plan)}</div>
              <div class="plan-features">
                <ul>
                  <li>✓ 无限方程数量</li>
                  <li>✓ 200+ 预设公式</li>
                  <li>✓ PDF 导出</li>
                  <li>✓ SVG 导出</li>
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="payment-footer">
          <div class="payment-methods">
            <span>支付方式：</span>
            <button class="payment-method" data-method="wechat">
              <span class="method-icon">💚</span> 微信
            </button>
            <button class="payment-method" data-method="alipay">
              <span class="method-icon">💙</span> 支付宝
            </button>
          </div>
          
          <button class="btn btn-primary btn-lg" id="payment-submit" disabled>
            选择套餐后支付
          </button>
        </div>
        
        <div class="payment-qrcode hidden" id="payment-qrcode">
          <div class="qrcode-title">请扫码支付 <span id="payment-amount">¥0</span></div>
          <div class="qrcode-image" id="qrcode-image"></div>
          <div class="qrcode-instructions">
            <p>1. 保存收款码图片</p>
            <p>2. 使用${this.getCurrentMethodName()}扫码支付</p>
            <p>3. 支付成功后联系客服获取密钥</p>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  getPlanDescription(plan) {
    if (plan.period === null) {
      return '终身有效';
    }
    return `${plan.period}天有效期`;
  }
  
  getCurrentMethodName() {
    return this.currentMethod === 'wechat' ? '微信' : '支付宝';
  }
  
  bindEvents() {
    const closeBtn = this.container.querySelector('#payment-close');
    closeBtn.addEventListener('click', () => this.close());
    
    const plans = this.container.querySelectorAll('.payment-plan');
    plans.forEach(plan => {
      plan.addEventListener('click', () => this.selectPlan(plan.dataset.plan));
    });
    
    const methods = this.container.querySelectorAll('.payment-method');
    methods.forEach(method => {
      method.addEventListener('click', () => this.selectMethod(method.dataset.method));
    });
    
    const submitBtn = this.container.querySelector('#payment-submit');
    submitBtn.addEventListener('click', () => this.initiatePayment());
  }
  
  selectPlan(planKey) {
    const plans = this.container.querySelectorAll('.payment-plan');
    plans.forEach(p => p.classList.remove('selected'));
    
    const selectedPlan = this.container.querySelector(`[data-plan="${planKey}"]`);
    selectedPlan.classList.add('selected');
    
    this.selectedPlan = planKey;
    this.updateSubmitButton();
  }
  
  selectMethod(method) {
    const methods = this.container.querySelectorAll('.payment-method');
    methods.forEach(m => m.classList.remove('selected'));
    
    const selectedMethod = this.container.querySelector(`[data-method="${method}"]`);
    selectedMethod.classList.add('selected');
    
    this.currentMethod = method;
    this.updateSubmitButton();
  }
  
  updateSubmitButton() {
    const submitBtn = this.container.querySelector('#payment-submit');
    
    if (this.selectedPlan && this.currentMethod) {
      const plan = this.paymentManager.selectPlan(this.options.platform, this.selectedPlan);
      submitBtn.disabled = false;
      submitBtn.textContent = `立即支付 ¥${plan.price}`;
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = '选择套餐后支付';
    }
  }
  
  initiatePayment() {
    if (!this.selectedPlan || !this.currentMethod) return;
    
    const result = this.paymentManager.initiatePayment(this.options.platform, this.selectedPlan);
    
    if (result.success) {
      this.showQRCode(result.paymentInfo);
    }
  }
  
  showQRCode(paymentInfo) {
    const qrcodeSection = this.container.querySelector('#payment-qrcode');
    const amountSpan = this.container.querySelector('#payment-amount');
    
    amountSpan.textContent = `¥${paymentInfo.amount}`;
    qrcodeSection.classList.remove('hidden');
    
    const qrContainer = this.container.querySelector('#qrcode-image');
    this.generateQRCode(qrContainer, paymentInfo.amount);
  }
  
  generateQRCode(container, amount) {
    container.innerHTML = `
      <div class="qr-placeholder">
        <div class="qr-icon">📱</div>
        <div class="qr-text">收款码图片</div>
        <div class="qr-amount">¥${amount}</div>
      </div>
    `;
  }
  
  open() {
    this.container.classList.remove('hidden');
  }
  
  close() {
    this.container.classList.add('hidden');
    this.options.onClose();
  }
}
```

---

## 4. 用户界面更新

### 4.1 Pro 标识组件

```javascript
// js/components/ProBadge.js
export class ProBadge {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      variant: options.variant || 'default',
      onUpgradeClick: options.onUpgradeClick || (() => {})
    };
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <span class="pro-badge ${this.options.variant}">
        <span class="pro-icon">⚡</span>
        <span class="pro-text">Pro</span>
      </span>
    `;
  }
  
  update(isPro) {
    if (isPro) {
      this.container.innerHTML = `
        <span class="pro-badge pro-active">
          <span class="pro-icon">✓</span>
          <span class="pro-text">已激活</span>
        </span>
      `;
    } else {
      this.render();
      this.container.querySelector('.pro-badge').addEventListener('click', () => {
        this.options.onUpgradeClick();
      });
    }
  }
}
```

### 4.2 功能限制提示

```javascript
// js/components/FeatureGate.js
export class FeatureGate {
  constructor(featureManager) {
    this.featureManager = featureManager;
    this.toastContainer = null;
  }
  
  checkAndPrompt(feature, action) {
    if (this.featureManager.canUse(feature)) {
      return true;
    }
    
    this.showUpgradePrompt(feature, action);
    return false;
  }
  
  checkEquationLimit() {
    const currentCount = this.getCurrentEquationCount();
    const limit = this.featureManager.getLimit('maxEquations');
    
    if (currentCount >= limit) {
      this.showLimitReached('方程数量已达上限', limit);
      return false;
    }
    
    return true;
  }
  
  showUpgradePrompt(feature, action) {
    const featureNames = {
      'allowPDFExport': 'PDF 导出',
      'allowSVGExport': 'SVG 导出',
      'maxEquations': '更多方程',
      'maxPresets': '更多预设公式'
    };
    
    const message = `${featureNames[feature] || feature}是 Pro 专属功能`;
    
    this.showToast(`
      <div class="toast-pro-prompt">
        <div class="toast-message">${message}</div>
        <button class="btn btn-pro btn-sm" onclick="window.showPaymentModal()">
          升级 Pro
        </button>
      </div>
    `, 'warning');
  }
  
  showLimitReached(feature, limit) {
    this.showToast(`
      <div class="toast-pro-prompt">
        <div class="toast-message">
          ${feature}已达上限（${limit}个）
        </div>
        <button class="btn btn-pro btn-sm" onclick="window.showPaymentModal()">
          升级 Pro 解锁无限
        </button>
      </div>
    `, 'warning');
  }
  
  showToast(html, type = 'info') {
    if (!this.toastContainer) {
      this.createToastContainer();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = html;
    
    this.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
  
  createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }
  
  getCurrentEquationCount() {
    const canvas = document.getElementById('coordinate-system');
    if (!canvas || !canvas.equations) return 0;
    return canvas.equations.length;
  }
}
```

---

## 5. 存储与同步

### 5.1 许可证存储

```javascript
// 存储键名定义
export const STORAGE_KEYS = {
  LICENSE: 'fv_license_license',
  LICENSE_TYPE: 'fv_license_type',
  LICENSE_EXPIRES: 'fv_license_expires',
  USER_PREFERENCES: 'fv_user_preferences',
  EQUATIONS: 'fv_equations',
  PRESETS: 'fv_presets',
  THEME: 'fv_theme'
};

export class LicenseStorage {
  constructor() {
    this.storage = window.localStorage;
  }
  
  saveLicense(license) {
    this.storage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(license));
  }
  
  loadLicense() {
    const data = this.storage.getItem(STORAGE_KEYS.LICENSE);
    return data ? JSON.parse(data) : null;
  }
  
  clearLicense() {
    this.storage.removeItem(STORAGE_KEYS.LICENSE);
  }
  
  isLicenseValid() {
    const license = this.loadLicense();
    if (!license) return false;
    
    if (license.type === 'L') return true;
    
    if (license.expiresAt) {
      return new Date(license.expiresAt) > new Date();
    }
    
    return false;
  }
}
```

### 5.2 Web 端 License API

```javascript
// js/api/license.js
const API_ENDPOINTS = {
  VALIDATE: '/api/license/validate',
  ACTIVATE: '/api/license/activate',
  DEACTIVATE: '/api/license/deactivate',
  CHECK_UPDATE: '/api/license/check-update'
};

export class LicenseAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }
  
  async validateLicense(key) {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.VALIDATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });
      
      return await response.json();
    } catch (error) {
      console.error('License validation failed:', error);
      return { valid: false, error: '网络错误' };
    }
  }
  
  async activateLicense(key, deviceInfo = {}) {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.ACTIVATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, deviceInfo })
      });
      
      return await response.json();
    } catch (error) {
      console.error('License activation failed:', error);
      return { success: false, error: '网络错误' };
    }
  }
  
  async checkForUpdates() {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.CHECK_UPDATE}`);
      return await response.json();
    } catch (error) {
      return { hasUpdate: false };
    }
  }
}
```

---

## 6. 样式扩展

### 6.1 Pro 相关样式

```css
/* Pro Badge 样式 */
.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.pro-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.pro-badge.pro-active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  cursor: default;
}

.pro-badge.pro-active:hover {
  transform: none;
  box-shadow: none;
}

/* Pro 按钮 */
.btn-pro {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
}

.btn-pro:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

/* Toast 提示 */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  min-width: 280px;
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

.toast-pro-prompt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast-message {
  font-size: 14px;
  color: var(--text-primary);
}

/* 支付模态框 */
.payment-modal {
  max-width: 480px;
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.payment-header {
  position: relative;
  padding: 24px;
  text-align: center;
  background: linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 100%);
  color: white;
}

.payment-header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.payment-subtitle {
  font-size: 14px;
  opacity: 0.9;
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

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
}

.plan-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-brand-500);
}

.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.plan-features li {
  padding: 4px 0;
}

.payment-footer {
  padding: 20px;
  border-top: 1px solid var(--surface-border);
}

.payment-methods {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius);
  background: var(--surface-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.payment-method.selected {
  border-color: var(--color-brand-500);
  background: rgba(14, 165, 233, 0.05);
}

.payment-qrcode {
  padding: 24px;
  text-align: center;
  background: var(--surface-secondary);
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  background: white;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.qr-text {
  font-size: 14px;
  color: var(--text-muted);
}

.qr-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 8px;
}

.qrcode-instructions {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.qrcode-instructions p {
  margin: 4px 0;
}

/* 禁用状态的 Pro 功能 */
.feature-locked {
  position: relative;
  opacity: 0.6;
  pointer-events: none;
}

.feature-locked::after {
  content: '⚡ Pro';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-brand-500);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
