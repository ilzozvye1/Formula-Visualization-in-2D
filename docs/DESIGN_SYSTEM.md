# FormulaViz 设计系统文档

> 版本: 1.0 | 更新日期: 2026-03-10

---

## 目录

1. [设计原则](#1-设计原则)
2. [Design Tokens](#2-design-tokens)
3. [基础组件](#3-基础组件)
4. [业务组件](#4-业务组件)
5. [三平台布局](#5-三平台布局)
6. [交互规范](#6-交互规范)
7. [可访问性](#7-可访问性)

---

## 1. 设计原则

### 1.1 核心价值观

| 原则 | 描述 |
|-----|------|
| **简洁 (Simplicity)** | 去除不必要的元素，聚焦核心功能 |
| **一致 (Consistency)** | 统一的视觉语言和交互模式 |
| **高效 (Efficiency)** | 减少用户操作步骤，快速完成任务 |
| **可及 (Accessibility)** | 兼顾不同能力的用户群体 |

### 1.2 视觉风格

- **风格**: 现代极简 (Modern Minimalist)
- **参考产品**: Linear, Notion, Figma, Vercel
- **质感**: 轻量、通透、适度留白
- **圆角**: 组件 8px，按钮 6px，标签 4px

### 1.3 色彩策略

- **主色**: 低饱和度蓝色 (#0ea5e9)
- **功能色**: 成功 #22c55e / 警告 #f59e0b / 错误 #ef4444
- **中性色**: 灰度阶梯，用于文本、边框、背景

---

## 2. Design Tokens

### 2.1 颜色系统

#### 2.1.1 品牌色 (Brand Colors)

```css
--color-brand-50: #f0f9ff;
--color-brand-100: #e0f2fe;
--color-brand-200: #bae6fd;
--color-brand-300: #7dd3fc;
--color-brand-400: #38bdf8;
--color-brand-500: #0ea5e9;  /* 主色 */
--color-brand-600: #0284c7;
--color-brand-700: #0369a1;
--color-brand-800: #075985;
--color-brand-900: #0c4a6e;
```

#### 2.1.2 表面色 (Surface Colors) - 浅色模式

```css
--surface-primary: #ffffff;
--surface-secondary: #f8fafc;
--surface-tertiary: #f1f5f9;
--surface-border: #e2e8f0;
--surface-hover: #f1f5f9;
--surface-active: #e2e8f0;
```

#### 2.1.3 表面色 (Surface Colors) - 深色模式

```css
--surface-primary-dark: #0f172a;
--surface-secondary-dark: #1e293b;
--surface-tertiary-dark: #334155;
--surface-border-dark: #475569;
--surface-hover-dark: #334155;
--surface-active-dark: #475569;
```

#### 2.1.4 文本色 (Text Colors)

```css
--text-primary: #0f172a;
--text-secondary: #475569;
--text-muted: #94a3b8;
--text-disabled: #cbd5e1;

--text-primary-dark: #f8fafc;
--text-secondary-dark: #cbd5e1;
--text-muted-dark: #64748b;
```

#### 2.1.5 语义色 (Semantic Colors)

```css
--color-success: #22c55e;
--color-success-light: #dcfce7;
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-info: #3b82f6;
--color-info-light: #dbeafe;
```

### 2.2 间距系统

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* 常用组合 */
--space-inline: 8px;      /* 内联元素间距 */
--space-stack: 16px;       /* 堆叠元素间距 */
--space-section: 24px;     /* 区块间距 */
```

### 2.3 字体系统

#### 2.3.1 字体栈

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### 2.3.2 字号阶梯

```css
--text-xs: 12px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 20px;
--text-3xl: 24px;
--text-4xl: 30px;
```

#### 2.3.3 字重

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### 2.3.4 行高

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 2.4 圆角系统

```css
--radius-none: 0;
--radius-sm: 4px;
--radius: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

### 2.5 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### 2.6 动画系统

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

---

## 3. 基础组件

### 3.1 Button (按钮)

#### 3.1.1 变体

| 变体 | 背景 | 文字 | 边框 | 场景 |
|-----|------|------|------|------|
| Primary | #0ea5e9 | #ffffff | none | 主要操作 |
| Secondary | #ffffff | #475569 | 1px #e2e8f0 | 次要操作 |
| Ghost | transparent | #64748b | none | 辅助操作 |
| Danger | #ef4444 | #ffffff | none | 危险操作 |

#### 3.1.2 尺寸

| 尺寸 | 高度 | 内边距 | 字号 | 圆角 |
|-----|------|--------|------|------|
| sm | 28px | 0 10px | 12px | 4px |
| md | 36px | 0 16px | 14px | 6px |
| lg | 44px | 0 24px | 16px | 8px |

#### 3.1.3 状态

```css
/* Hover */
--btn-hover-bg: var(--color-brand-600);
--btn-hover-scale: 1.02;

/* Active */
--btn-active-bg: var(--color-brand-700);
--btn-active-scale: 0.98;

/* Disabled */
--btn-disabled-opacity: 0.5;
--btn-disabled-cursor: not-allowed;
```

#### 3.1.4 使用示例

```html
<!-- Primary -->
<button class="btn btn-primary">添加方程</button>

<!-- Secondary -->
<button class="btn btn-secondary">取消</button>

<!-- Ghost -->
<button class="btn btn-ghost">删除</button>

<!-- Danger -->
<button class="btn btn-danger">清空所有</button>
```

---

### 3.2 Input (输入框)

#### 3.2.1 规格

| 属性 | 值 |
|-----|-----|
| 高度 | 36px |
| 内边距 | 8px 12px |
| 边框 | 1px solid #e2e8f0 |
| 圆角 | 6px |
| 字号 | 14px |

#### 3.2.2 状态

| 状态 | 边框颜色 | 阴影 |
|-----|---------|------|
| Default | #e2e8f0 | none |
| Focus | #0ea5e9 | 0 0 0 3px rgba(14, 165, 233, 0.15) |
| Error | #ef4444 | 0 0 0 3px rgba(239, 68, 68, 0.15) |
| Disabled | #e2e8f0 | none |
| Readonly | #f1f5f9 | none |

#### 3.2.3 使用示例

```html
<!-- 基础输入框 -->
<input type="text" class="input" placeholder="输入表达式">

<!-- 带前缀 -->
<div class="input-group">
  <span class="input-prefix">y =</span>
  <input type="text" class="input" placeholder="sin(x)">
</div>

<!-- 带后缀 -->
<div class="input-group">
  <input type="text" class="input" placeholder="10">
  <span class="input-suffix">px</span>
</div>
```

---

### 3.3 Select (下拉选择)

#### 3.3.1 规格

| 属性 | 值 |
|-----|-----|
| 高度 | 36px |
| 内边距 | 8px 32px 8px 12px |
| 箭头图标 | 右侧 12px |
| 下拉面板最大高度 | 240px |
| 选项高度 | 32px |

#### 3.3.2 使用示例

```html
<select class="select">
  <option>实线</option>
  <option>虚线</option>
  <option>点线</option>
</select>
```

---

### 3.4 Slider (滑块)

#### 3.4.1 规格

| 属性 | 值 |
|-----|-----|
| 轨道高度 | 4px |
| 轨道背景 | #e2e8f0 |
| 滑块尺寸 | 16px × 16px |
| 滑块背景 | #0ea5e9 |
| 滑块阴影 | 0 1px 3px rgba(0,0,0,0.2) |
| 标签字号 | 12px |

#### 3.4.2 使用示例

```html
<div class="slider-container">
  <span class="slider-label">缩放</span>
  <input type="range" class="slider" min="0.1" max="3" step="0.1" value="1">
  <span class="slider-value">1.0</span>
</div>
```

---

### 3.5 Checkbox (复选框)

#### 3.5.1 规格

| 属性 | 值 |
|-----|-----|
| 尺寸 | 16px × 16px |
| 边框 | 2px #cbd5e1 |
| 圆角 | 4px |
| 选中背景 | #0ea5e9 |
| 选中图标 | 白色对勾 |

#### 3.5.2 使用示例

```html
<label class="checkbox-row">
  <input type="checkbox" class="checkbox" checked>
  <span>显示网格</span>
</label>
```

---

### 3.6 Color Picker (颜色选择器)

#### 3.6.1 规格

| 属性 | 值 |
|-----|-----|
| 尺寸 | 32px × 32px (Web/Desktop), 44px × 44px (App) |
| 边框 | 1px solid #e2e8f0 |
| 圆角 | 6px |
| 触发器 | 点击打开颜色面板 |

---

## 4. 业务组件

### 4.1 方程输入组件 (EquationInput)

#### 4.1.1 结构

```
┌─────────────────────────────────────────────────────┐
│  预设分类: [三角函数 ▼]                              │
├─────────────────────────────────────────────────────┤
│  y = ┌─────────────────────────────────┐ 🖤          │
│      │ sin(x)                         │             │
│      └─────────────────────────────────┘             │
├─────────────────────────────────────────────────────┤
│  [颜色●]  [线型: ▼实线]      [添加]                  │
└─────────────────────────────────────────────────────┘
```

#### 4.1.2 规格

| 元素 | 规格 |
|-----|------|
| 预设下拉 | 与 Select 组件一致 |
| 公式前缀 | 固定 "y = "，背景 #f1f5f9 |
| 输入框 | 与 Input 组件一致 |
| 颜色选择器 | 32px × 32px |
| 间距 | 各元素 gap: 8px |

---

### 4.2 方程列表组件 (EquationList)

#### 4.2.1 结构

```
┌─────────────────────────────────────────────────────┐
│  方程列表 (3)                                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ ☑ [●] y = sin(x)              [编辑] [删除]   ││
│  ├─────────────────────────────────────────────────┤│
│  │ ☑ [●] y = cos(x)              [编辑] [删除]   ││
│  ├─────────────────────────────────────────────────┤│
│  │ ☐ [●] y = tan(x)              [编辑] [删除]   ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  [全显]  [全隐]  [清空]                             │
└─────────────────────────────────────────────────────┘
```

#### 4.2.2 规格

| 元素 | 规格 |
|-----|------|
| 列表项高度 | 48px |
| 列表项内边距 | 12px |
| 列表项圆角 | 6px |
| 颜色标记 | 12px × 12px 圆形 |
| 悬停背景 | #f8fafc |
| 选中边框 | 1px solid #0ea5e9 |
| 选中背景 | rgba(14, 165, 233, 0.05) |

---

### 4.3 属性面板组件 (PropertiesPanel)

#### 4.3.1 结构

```
┌─────────────────────────────────┐
│ ▼ 方程属性                      │
│   颜色: ● #ff4444              │
│   线宽: ────●─── 2px           │
├─────────────────────────────────┤
│ ▼ 变换控制                      │
│   平移 X: ────●─── 0           │
│   平移 Y: ────●─── 0           │
│   缩放:   ────●─── 1.0         │
│   旋转:   ────●─── 0°          │
│   [重置变换]                    │
├─────────────────────────────────┤
│ ▼ 坐标轴设置                    │
│   X: [-10] ~ [10]              │
│   Y: [-10] ~ [10]              │
│   ☑ 显示网格                    │
│   ☑ 显示交点                    │
└─────────────────────────────────┘
```

#### 4.3.2 规格

| 元素 | 规格 |
|-----|------|
| 分组标题高度 | 28px |
| 分组标题字号 | 13px, font-weight: 600 |
| 分组内容间距 | 12px |
| 分割线 | 1px solid #e2e8f0 |
| 折叠图标 | 右侧 chevron |

---

### 4.4 画布工具栏组件 (CanvasToolbar)

#### 4.4.1 结构 (Web)

```
┌─────────────────────────────────────────────────────────────────┐
│ [📷] [📄] [🔄]          [-] [100%] [+]        [2D] [3D]        │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4.2 结构 (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [📂新建] [📂打开] [💾保存] │ 2D/3D │ │ [📷PNG] [📄PDF] │ │ [↩] [↪] │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 预设分类组件 (PresetCategories)

#### 4.5.1 分类结构

```
┌─────────────────────────────┐
│ 📁 一次方程                 │
│ 📁 二次方程                 │
│ 📁 三角函数                 │
│ 📁 指数函数                 │
│ 📁 对数函数                 │
│ 📁 三维曲面                 │
└─────────────────────────────┘
```

#### 4.5.2 规格

| 元素 | 规格 |
|-----|------|
| 分类项高度 | 32px |
| 分类项内边距 | 8px 12px |
| 展开箭头 | 右侧，▶ 字符 |
| 子项缩进 | 16px |

---

## 5. 三平台布局

### 5.1 Web 版布局

#### 5.1.1 断点

| 断点 | 宽度 | 布局 |
|-----|------|------|
| xs | < 640px | 单列，隐藏侧边栏 |
| sm | 640px - 1024px | 双栏，侧边栏可折叠 |
| md | 1024px - 1440px | 三栏 |
| lg | > 1440px | 三栏 (宽) |

#### 5.1.2 布局结构

```
┌────────────────────────────────────────────────────────┐
│ Header (56px)                                          │
├──────────┬─────────────────────────────┬───────────────┤
│ Sidebar  │ Canvas Area                │ Properties    │
│ (280px)  │                            │ (240px)       │
│          │                            │               │
│ - 预设   │  ┌─────────────────────┐   │ - 方程属性   │
│ - 输入   │  │                     │   │ - 变换控制   │
│ - 列表   │  │     Canvas          │   │ - 坐标轴设置 │
│          │  │                     │   │               │
│          │  └─────────────────────┘   │               │
│          │                            │               │
├──────────┴─────────────────────────────┴───────────────┤
│ Status Bar (28px)                                     │
└────────────────────────────────────────────────────────┘
```

#### 5.1.3 响应式行为

| 屏幕宽度 | 侧边栏 | 属性面板 |
|---------|--------|---------|
| < 640px | 隐藏 | 隐藏 (Modal) |
| 640-1024px | 隐藏 | 隐藏 |
| 1024-1440px | 显示 | 隐藏 |
| > 1440px | 显示 | 显示 |

---

### 5.2 App 版布局

#### 5.2.1 设备断点

| 设备 | 宽度 | 布局 |
|-----|------|------|
| Phone | < 768px | 单列，底部导航 |
| Tablet Portrait | 768px - 1024px | 单列，底部导航 |
| Tablet Landscape | > 1024px | 双栏，横屏 |

#### 5.2.2 布局结构 (Phone)

```
┌─────────────────────────────────┐
│ Header (60px)                   │
│ [☰] FormulaViz      [⚙️] [📤] │
├─────────────────────────────────┤
│                                 │
│         Canvas Area             │
│                                 │
├─────────────────────────────────┤
│ [方程]  [导出]  [添加]  [设置]  │
└─────────────────────────────────┘
```

#### 5.2.3 侧边栏 (App)

- 触发: 点击左上角汉堡菜单 ☰
- 位置: 从左侧滑入
- 宽度: 280px
- 遮罩: 背景 30% 黑色
- 动画: 250ms ease-out

---

### 5.3 Desktop 版布局

#### 5.3.1 窗口尺寸

| 模式 | 尺寸 |
|-----|------|
| 默认 | 1280 × 800 |
| 最小 | 960 × 600 |
| 最大 | 100% 屏幕 |

#### 5.3.2 布局结构

```
┌────────────────────────────────────────────────────────────────┐
│ Menu Bar (32px)                                                │
│ 文件 | 编辑 | 视图 | 方程 | 工具 | 帮助                        │
├────────────────────────────────────────────────────────────────┤
│ Toolbar (44px)                                                │
│ [新建][打开][保存] │ 2D/3D │ │ [PNG][PDF] │ │ [撤销][重做]    │
├────┬─────────────────────────────────────────────┬────────────┤
│Dock│ Canvas Area                                  │ Properties │
│(52px)│                                            │ (240px)    │
│     │  ┌─────────────────────────────────────┐   │            │
│ [📐]│  │                                     │   │ Equations  │
│ [📊]│  │         Canvas                     │   │ Props      │
│ [🎨]│  │                                     │   │ Axis       │
│ [🖼️]│  │                                     │   │            │
│ [📁]│  └─────────────────────────────────────┘   │            │
│ [📝]│                                            │            │
├────┴─────────────────────────────────────────────┴────────────┤
│ Status Bar (28px)                                             │
└────────────────────────────────────────────────────────────────┘
```

#### 5.3.3 左侧 Dock

| 元素 | 规格 |
|-----|------|
| 宽度 | 52px |
| 图标尺寸 | 24px |
| 按钮尺寸 | 40px × 40px |
| 提示位置 | 右侧 |
| 提示背景 | #334155 |
| 提示文字 | #ffffff |

---

## 6. 交互规范

### 6.1 手势 (App)

| 手势 | 区域 | 动作 |
|-----|------|------|
| 单击 | 画布 | 选中/取消选中元素 |
| 单指拖动 | 画布 | 移动坐标系 |
| 双指捏合 | 画布 | 缩放视图 |
| 双指旋转 | 画布 (3D) | 旋转视角 |
| 长按 | 方程项 | 弹出操作菜单 |
| 左滑 | 方程项 | 删除 |

### 6.2 快捷键 (Web/Desktop)

| 快捷键 | 功能 |
|--------|------|
| Ctrl + N | 新建画布 |
| Ctrl + O | 打开文件 |
| Ctrl + S | 保存 |
| Ctrl + E | 导出 PNG |
| Ctrl + Shift + E | 导出 PDF |
| Ctrl + Z | 撤销 |
| Ctrl + Y | 重做 |
| Ctrl + 1 | 2D 模式 |
| Ctrl + 2 | 3D 模式 |
| Ctrl + 0 | 缩放至适合 |
| Ctrl + G | 显示/隐藏网格 |
| Delete | 删除选中方程 |
| Escape | 取消选中 |

### 6.3 动画参数

| 动画 | 时长 | 缓动函数 |
|-----|------|---------|
| 页面转场 | 300ms | ease-out |
| 面板展开 | 200ms | ease-out |
| 按钮悬停 | 150ms | ease |
| 颜色变化 | 200ms | linear |
| 模态框弹出 | 250ms | ease-out |
| 侧边栏滑入 | 250ms | ease-out |

---

## 7. 可访问性

### 7.1 颜色对比度

| 场景 | 最小对比度 |
|-----|-----------|
| 正常文本 | 4.5:1 |
| 大文本 (≥18px) | 3:1 |
| UI 组件 | 3:1 |
| 按钮文字 | 4.5:1 |

### 7.2 焦点状态

```css
:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
```

### 7.3 触屏目标

| 平台 | 最小点击区域 |
|-----|-------------|
| Web | 44px × 44px |
| App | 44px × 44px |
| Desktop | 32px × 32px |

---

## 附录

### A. CSS 变量速查表

```css
:root {
  /* 颜色 */
  --color-brand-500: #0ea5e9;
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border: #e2e8f0;
  
  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  
  /* 阴影 */
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  
  /* 动画 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
