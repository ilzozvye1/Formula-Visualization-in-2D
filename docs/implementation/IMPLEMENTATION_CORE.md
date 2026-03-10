# 共享核心模块规格

> 版本: 1.0 | 模块: 核心共享 | 更新日期: 2026-03-10

---

## 目录

1. [模块架构概述](#1-模块架构概述)
2. [核心共享模块](#2-核心共享模块)
3. [渲染引擎](#3-渲染引擎)
4. [公式解析器](#4-公式解析器)
5. [状态管理](#5-状态管理)
6. [存储层](#6-存储层)
7. [平台适配层](#7-平台适配层)
8. [事件系统](#8-事件系统)
9. [工具函数](#9-工具函数)

---

## 1. 模块架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                      Platform Layer                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│      Web        │       App       │       Desktop           │
│  (浏览器环境)    │   (Cordova)     │     (Electron)          │
└────────┬────────┴────────┬────────┴────────────┬──────────┘
         │                 │                      │
         └─────────────────┼──────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   Platform Adapter      │
              │   (平台适配抽象层)        │
              └────────────┬────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                      Core Layer                             │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│   Render    │   Parser    │   State     │    Storage      │
│   Engine    │   Engine    │   Manager   │    Manager      │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

---

## 2. 核心共享模块

### 2.1 目录结构

```
core/
├── src/
│   ├── index.js              # 导出入口
│   ├── render/
│   │   ├── RenderEngine.js   # 渲染引擎基类
│   │   ├── Canvas2D.js       # 2D 渲染器
│   │   ├── WebGLRenderer.js  # 3D 渲染器
│   │   └── Shaders.js        # 着色器
│   ├── parser/
│   │   ├── Parser.js         # 解析器
│   │   ├── Lexer.js         # 词法分析器
│   │   └── Evaluator.js     # 求值器
│   ├── state/
│   │   ├── StateManager.js  # 状态管理器
│   │   └── History.js       # 历史记录
│   ├── storage/
│   │   ├── Storage.js       # 存储抽象
│   │   └── LocalStorage.js # 本地存储
│   ├── events/
│   │   ├── EventEmitter.js  # 事件发射器
│   │   └── Events.js        # 事件类型定义
│   ├── utils/
│   │   ├── math.js          # 数学工具
│   │   ├── color.js         # 颜色工具
│   │   └── validation.js    # 验证工具
│   └── adapters/
│       ├── PlatformAdapter.js   # 平台适配器
│       ├── WebAdapter.js        # Web 适配器
│       ├── AppAdapter.js        # App 适配器
│       └── DesktopAdapter.js     # Desktop 适配器
└── package.json
```

### 2.2 入口文件

```javascript
// src/index.js
export { RenderEngine } from './render/RenderEngine.js';
export { Canvas2DRenderer } from './render/Canvas2D.js';
export { WebGLRenderer } from './render/WebGLRenderer.js';
export { FormulaParser } from './parser/Parser.js';
export { Evaluator } from './parser/Evaluator.js';
export { StateManager } from './state/StateManager.js';
export { HistoryManager } from './state/History.js';
export { StorageManager } from './storage/Storage.js';
export { EventEmitter } from './events/EventEmitter.js';
export { PlatformAdapter } from './adapters/PlatformAdapter.js';
export * from './utils/math.js';
export * from './utils/color.js';
export * from './utils/validation.js';
```

---

## 3. 渲染引擎

### 3.1 RenderEngine 基类

```javascript
// src/render/RenderEngine.js
export class RenderEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      background: options.background || '#ffffff',
      pixelRatio: options.pixelRatio || window.devicePixelRatio || 1,
      antialias: options.antialias !== false
    };
    
    this.equations = [];
    this.axisRange = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
    this.showGrid = true;
    this.showIntersections = true;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    
    this.init();
  }

  init() {
    this.resize(this.options.width, this.options.height);
  }

  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    this.canvas.width = width * this.options.pixelRatio;
    this.canvas.height = height * this.options.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.options.pixelRatio, this.options.pixelRatio);
    this.render();
  }

  addEquation(equation) {
    this.equations.push(equation);
    this.render();
    this.emit('equation:added', equation);
  }

  removeEquation(index) {
    const removed = this.equations.splice(index, 1)[0];
    this.render();
    this.emit('equation:removed', removed);
  }

  clearEquations() {
    this.equations = [];
    this.render();
    this.emit('equations:cleared');
  }

  setAxisRange(range) {
    this.axisRange = { ...this.axisRange, ...range };
    this.render();
    this.emit('axis:changed', this.axisRange);
  }

  setZoom(zoom) {
    this.zoom = Math.max(0.1, Math.min(10, zoom));
    this.render();
    this.emit('zoom:changed', this.zoom);
  }

  setPan(x, y) {
    this.pan = { x, y };
    this.render();
    this.emit('pan:changed', this.pan);
  }

  render() {
    throw new Error('render() must be implemented by subclass');
  }

  toDataURL(type = 'image/png', quality = 1) {
    return this.canvas.toDataURL(type, quality);
  }

  exportPNG() {
    const link = document.createElement('a');
    link.download = `formula-${Date.now()}.png`;
    link.href = this.toDataURL();
    link.click();
  }
}

// 事件发射器混入
import { EventEmitter } from '../events/EventEmitter.js';
Object.assign(RenderEngine.prototype, EventEmitter.prototype);
```

### 3.2 Canvas2D 渲染器

```javascript
// src/render/Canvas2D.js
import { RenderEngine } from './RenderEngine.js';
import { evaluateFormula } from '../parser/Evaluator.js';

export class Canvas2DRenderer extends RenderEngine {
  constructor(canvas, options = {}) {
    super(canvas, {
      ...options,
      antialias: true
    });
    
    this.gridColor = options.gridColor || '#e2e8f0';
    this.axisColor = options.axisColor || '#64748b';
    this.textColor = options.textColor || '#64748b';
  }

  render() {
    const { width, height } = this.options;
    const { xMin, xMax, yMin, yMax } = this.axisRange;
    
    // 清空画布
    this.ctx.fillStyle = this.options.background;
    this.ctx.fillRect(0, 0, width, height);
    
    // 绘制网格
    if (this.showGrid) {
      this.drawGrid(xMin, xMax, yMin, yMax);
    }
    
    // 绘制坐标轴
    this.drawAxes(xMin, xMax, yMin, yMax);
    
    // 绘制方程曲线
    this.equations.forEach((eq, index) => {
      if (eq.visible !== false) {
        this.drawEquation(eq, xMin, xMax, yMin, yMax);
      }
    });
    
    // 绘制交点
    if (this.showIntersections && this.equations.length > 1) {
      this.drawIntersections();
    }
  }

  drawGrid(xMin, xMax, yMin, yMax) {
    const { width, height } = this.options;
    const ctx = this.ctx;
    
    // 计算网格间距
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xStep = this.calculateGridStep(xRange);
    const yStep = this.calculateGridStep(yRange);
    
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const screenX = this.toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }
    
    // 水平网格线
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const screenY = this.toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }
  }

  drawAxes(xMin, xMax, yMin, yMax) {
    const { width, height } = this.options;
    const ctx = this.ctx;
    
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 2;
    
    // X 轴
    if (yMin <= 0 && yMax >= 0) {
      const y = this.toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Y 轴
    if (xMin <= 0 && xMax >= 0) {
      const x = this.toScreenX(0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 刻度标签
    ctx.fillStyle = this.textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const xStep = this.calculateGridStep(xMax - xMin);
    const yStep = this.calculateGridStep(yMax - yMin);
    
    // X 轴刻度
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) > 0.001) {
        const screenX = this.toScreenX(x);
        const screenY = this.toScreenY(0);
        ctx.fillText(this.formatNumber(x), screenX, screenY + 4);
      }
    }
    
    // Y 轴刻度
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) > 0.001) {
        const screenX = this.toScreenX(0);
        const screenY = this.toScreenY(y);
        ctx.fillText(this.formatNumber(y), screenX - 4, screenY);
      }
    }
  }

  drawEquation(equation, xMin, xMax, yMin, yMax) {
    const { width, height } = this.options;
    const ctx = this.ctx;
    
    ctx.strokeStyle = equation.color || '#3b82f6';
    ctx.lineWidth = equation.lineWidth || 2;
    ctx.setLineDash(this.getLineDash(equation.style));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    const step = (xMax - xMin) / width * 2;
    let isFirstPoint = true;
    
    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y = evaluateFormula(equation.formula, { x });
        
        if (isFinite(y) && y >= yMin * 2 && y <= yMax * 2) {
          const screenX = this.toScreenX(x);
          const screenY = this.toScreenY(y);
          
          if (isFirstPoint) {
            ctx.moveTo(screenX, screenY);
            isFirstPoint = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        } else {
          isFirstPoint = true;
        }
      } catch (e) {
        isFirstPoint = true;
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawIntersections() {
    // 计算并绘制交点
  }

  toScreenX(x) {
    const { width } = this.options;
    const { xMin, xMax } = this.axisRange;
    return ((x - xMin) / (xMax - xMin)) * width * this.zoom + this.pan.x;
  }

  toScreenY(y) {
    const { height } = this.options;
    const { yMin, yMax } = this.axisRange;
    return height - ((y - yMin) / (yMax - yMin)) * height * this.zoom + this.pan.y;
  }

  toWorldX(screenX) {
    const { width } = this.options;
    const { xMin, xMax } = this.axisRange;
    return ((screenX - this.pan.x) / (width * this.zoom)) * (xMax - xMin) + xMin;
  }

  toWorldY(screenY) {
    const { height } = this.options;
    const { yMin, yMax } = this.axisRange;
    return ((height - screenY - this.pan.y) / (height * this.zoom)) * (yMax - yMin) + yMin;
  }

  calculateGridStep(range) {
    const target = 10;
    const rawStep = range / target;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    
    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }

  formatNumber(num) {
    if (Math.abs(num) >= 1000) return num.toExponential(1);
    if (Math.abs(num) < 0.01) return num.toExponential(1);
    return Number(num.toFixed(2)).toString();
  }

  getLineDash(style) {
    switch (style) {
      case 'dashed': return [8, 4];
      case 'dotted': return [2, 4];
      default: return [];
    }
  }
}
```

---

## 4. 公式解析器

### 4.1 Parser 类

```javascript
// src/parser/Parser.js
export class FormulaParser {
  constructor() {
    this.lexer = new Lexer();
    this.operators = {
      '+': { precedence: 1, associativity: 'left' },
      '-': { precedence: 1, associativity: 'left' },
      '*': { precedence: 2, associativity: 'left' },
      '/': { precedence: 2, associativity: 'left' },
      '^': { precedence: 3, associativity: 'right' }
    };
    this.functions = {
      'sin': Math.sin,
      'cos': Math.cos,
      'tan': Math.tan,
      'asin': Math.asin,
      'acos': Math.acos,
      'atan': Math.atan,
      'sinh': Math.sinh,
      'cosh': Math.cosh,
      'tanh': Math.tanh,
      'sqrt': Math.sqrt,
      'abs': Math.abs,
      'log': Math.log,
      'log10': Math.log10,
      'log2': Math.log2,
      'exp': Math.exp,
      'pow': Math.pow,
      'floor': Math.floor,
      'ceil': Math.ceil,
      'round': Math.round,
      'PI': Math.PI,
      'E': Math.E
    };
  }

  parse(formula) {
    const tokens = this.lexer.tokenize(formula);
    return this.buildAST(tokens);
  }

  buildAST(tokens) {
    const output = [];
    const operators = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'number' || token.type === 'variable') {
        output.push(token);
      } else if (token.type === 'function') {
        operators.push(token);
      } else if (token.type === 'operator') {
        while (operators.length > 0) {
          const top = operators[operators.length - 1];
          if (top.type === 'operator' && 
              (this.operators[top.value].precedence > this.operators[token.value].precedence ||
               (this.operators[top.value].precedence === this.operators[token.value].precedence &&
                this.operators[token.value].associativity === 'left'))) {
            output.push(operators.pop());
          } else {
            break;
          }
        }
        operators.push(token);
      } else if (token.value === '(') {
        operators.push(token);
      } else if (token.value === ')') {
        while (operators.length > 0 && operators[operators.length - 1].value !== '(') {
          output.push(operators.pop());
        }
        operators.pop();
        if (operators.length > 0 && operators[operators.length - 1].type === 'function') {
          output.push(operators.pop());
        }
      }
    }
    
    while (operators.length > 0) {
      output.push(operators.pop());
    }
    
    return output;
  }

  validate(formula) {
    try {
      const tokens = this.lexer.tokenize(formula);
      
      let parenCount = 0;
      for (const token of tokens) {
        if (token.value === '(') parenCount++;
        if (token.value === ')') parenCount--;
        if (parenCount < 0) {
          return { valid: false, error: '括号不匹配' };
        }
      }
      
      if (parenCount !== 0) {
        return { valid: false, error: '括号不匹配' };
      }
      
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
}

class Lexer {
  tokenize(formula) {
    const tokens = [];
    let i = 0;
    
    while (i < formula.length) {
      const char = formula[i];
      
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1]))) {
        let num = '';
        while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
          num += formula[i++];
        }
        tokens.push({ type: 'number', value: parseFloat(num) });
        continue;
      }
      
      if (/[a-zA-Z_]/.test(char)) {
        let name = '';
        while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
          name += formula[i++];
        }
        
        if (this.isOperator(name) || name === '(' || name === ')') {
          tokens.push({ type: 'operator', value: name });
        } else if (this.isFunction(name)) {
          tokens.push({ type: 'function', value: name });
        } else if (name === 'x' || name === 'X') {
          tokens.push({ type: 'variable', value: 'x' });
        } else {
          tokens.push({ type: 'constant', value: name });
        }
        continue;
      }
      
      if (this.isOperator(char)) {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }
      
      if (char === '(' || char === ')') {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }
      
      i++;
    }
    
    return tokens;
  }

  isOperator(char) {
    return ['+', '-', '*', '/', '^'].includes(char);
  }

  isFunction(name) {
    const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'log', 'exp', 'pow', 'floor', 'ceil', 'round', 'sinh', 'cosh', 'tanh'];
    return functions.includes(name.toLowerCase());
  }
}
```

### 4.2 Evaluator 类

```javascript
// src/parser/Evaluator.js
export class Evaluator {
  constructor() {
    this.constants = {
      'PI': Math.PI,
      'E': Math.E
    };
    this.functions = {
      'sin': Math.sin,
      'cos': Math.cos,
      'tan': Math.tan,
      'asin': Math.asin,
      'acos': Math.acos,
      'atan': Math.atan,
      'sinh': x => (Math.exp(x) - Math.exp(-x)) / 2,
      'cosh': x => (Math.exp(x) + Math.exp(-x)) / 2,
      'tanh': x => (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x)),
      'sqrt': Math.sqrt,
      'abs': Math.abs,
      'log': Math.log,
      'log10': Math.log10,
      'log2': Math.log2,
      'exp': Math.exp,
      'pow': Math.pow,
      'floor': Math.floor,
      'ceil': Math.ceil,
      'round': Math.round,
      'max': Math.max,
      'min': Math.min
    };
  }

  evaluate(ast, variables = {}) {
    const stack = [];
    
    for (const token of ast) {
      if (token.type === 'number') {
        stack.push(token.value);
      } else if (token.type === 'variable') {
        if (!(token.value in variables)) {
          throw new Error(`未定义的变量: ${token.value}`);
        }
        stack.push(variables[token.value]);
      } else if (token.type === 'constant') {
        if (token.value in this.constants) {
          stack.push(this.constants[token.value]);
        } else if (token.value in this.functions) {
          stack.push(token.value);
        } else {
          throw new Error(`未定义的常量: ${token.value}`);
        }
      } else if (token.type === 'operator') {
        if (token.value === '-' && stack.length > 0 && typeof stack[stack.length - 1] === 'number') {
          const b = stack.pop();
          stack.push(-b);
        } else if (token.value === '+' && stack.length > 0) {
          // 一元加号，直接跳过
        } else {
          const b = stack.pop();
          const a = stack.pop();
          
          switch (token.value) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/': 
              if (b === 0) throw new Error('除数不能为零');
              stack.push(a / b); 
              break;
            case '^': stack.push(Math.pow(a, b)); break;
          }
        }
      } else if (token.type === 'function') {
        const fn = this.functions[token.value];
        if (!fn) {
          throw new Error(`未定义的函数: ${token.value}`);
        }
        
        const args = [];
        for (let i = 0; i < fn.length; i++) {
          if (stack.length === 0) break;
          args.unshift(stack.pop());
        }
        stack.push(fn(...args));
      }
    }
    
    return stack[0];
  }
}

const parser = new FormulaParser();
const evaluator = new Evaluator();

export function evaluateFormula(formula, variables = {}) {
  const ast = parser.parse(formula);
  return evaluator.evaluate(ast, variables);
}

export function validateFormula(formula) {
  return parser.validate(formula);
}
```

---

## 5. 状态管理

### 5.1 StateManager 类

```javascript
// src/state/StateManager.js
import { EventEmitter } from '../events/EventEmitter.js';

export class StateManager extends EventEmitter {
  constructor(initialState = {}) {
    super();
    this.state = { ...initialState };
    this.listeners = new Map();
  }

  getState(path) {
    if (!path) return { ...this.state };
    
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }

  setState(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;
    
    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    this.emit('state:change', { path, oldValue, newValue: value });
    this.emit(`state:change:${path}`, value);
  }

  updateState(updates) {
    const changes = [];
    
    const applyUpdates = (obj, prefix = '') => {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          applyUpdates(value, path);
        } else {
          const oldValue = this.getState(path);
          this.setState(path, value);
          changes.push({ path, oldValue, newValue: value });
        }
      }
    };
    
    applyUpdates(updates);
    this.emit('state:bulkChange', changes);
  }

  subscribe(path, callback) {
    const event = path ? `state:change:${path}` : 'state:change';
    this.on(event, callback);
    
    return () => this.off(event, callback);
  }

  resetState(newState = {}) {
    const oldState = { ...this.state };
    this.state = { ...newState };
    this.emit('state:reset', { oldState, newState: this.state });
  }

  exportState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  importState(state) {
    this.resetState(state);
  }
}
```

### 5.2 HistoryManager 类

```javascript
// src/state/History.js
import { EventEmitter } from '../events/EventEmitter.js';

export class HistoryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxSize = options.maxSize || 50;
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
  }

  saveState(state) {
    const snapshot = JSON.stringify(state);
    
    if (snapshot === this.currentState) {
      return;
    }
    
    if (this.currentState !== null) {
      this.undoStack.push(this.currentState);
      
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
    }
    
    this.currentState = snapshot;
    this.redoStack = [];
    this.emit('history:save', { undoSize: this.undoStack.length, redoSize: 0 });
  }

  undo() {
    if (!this.canUndo()) return null;
    
    if (this.currentState !== null) {
      this.redoStack.push(this.currentState);
    }
    
    this.currentState = this.undoStack.pop();
    const state = JSON.parse(this.currentState);
    
    this.emit('history:undo', { state, undoSize: this.undoStack.length, redoSize: this.redoStack.length });
    return state;
  }

  redo() {
    if (!this.canRedo()) return null;
    
    if (this.currentState !== null) {
      this.undoStack.push(this.currentState);
    }
    
    this.currentState = this.redoStack.pop();
    const state = JSON.parse(this.currentState);
    
    this.emit('history:redo', { state, undoSize: this.undoStack.length, redoSize: this.redoStack.length });
    return state;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
    this.emit('history:clear');
  }

  getUndoSize() {
    return this.undoStack.length;
  }

  getRedoSize() {
    return this.redoStack.length;
  }
}
```

---

## 6. 存储层

### 6.1 StorageManager 类

```javascript
// src/storage/Storage.js
import { EventEmitter } from '../events/EventEmitter.js';

export class StorageManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.storage = options.storage || window.localStorage;
    this.prefix = options.prefix || 'formula_viz_';
    this.encoder = options.encoder || new JSONEncoder();
  }

  getKey(key) {
    return `${this.prefix}${key}`;
  }

  set(key, value) {
    const encoded = this.encoder.encode(value);
    this.storage.setItem(this.getKey(key), encoded);
    this.emit('storage:set', { key, value });
  }

  get(key, defaultValue = null) {
    const encoded = this.storage.getItem(this.getKey(key));
    if (encoded === null) return defaultValue;
    return this.encoder.decode(encoded);
  }

  remove(key) {
    this.storage.removeItem(this.getKey(key));
    this.emit('storage:remove', { key });
  }

  clear() {
    const keys = this.keys();
    keys.forEach(key => this.remove(key));
    this.emit('storage:clear');
  }

  keys() {
    const allKeys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        allKeys.push(key.replace(this.prefix, ''));
      }
    }
    return allKeys;
  }

  has(key) {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  export() {
    const data = {};
    this.keys().forEach(key => {
      data[key] = this.get(key);
    });
    return data;
  }

  import(data) {
    for (const key in data) {
      this.set(key, data[key]);
    }
  }
}

class JSONEncoder {
  encode(value) {
    return JSON.stringify(value);
  }

  decode(encoded) {
    return JSON.parse(encoded);
  }
}
```

---

## 7. 平台适配层

### 7.1 PlatformAdapter 基类

```javascript
// src/adapters/PlatformAdapter.js
export class PlatformAdapter {
  constructor() {
    this.platform = this.detectPlatform();
  }

  detectPlatform() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return 'desktop';
    }
    if (typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return 'app';
    }
    return 'web';
  }

  getPlatform() {
    return this.platform;
  }

  isMobile() {
    return this.platform === 'app';
  }

  isDesktop() {
    return this.platform === 'desktop';
  }

  isWeb() {
    return this.platform === 'web';
  }

  getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  onResize(callback) {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  }

  onOrientationChange(callback) {
    window.addEventListener('orientationchange', callback);
    return () => window.removeEventListener('orientationchange', callback);
  }

  getOrientation() {
    return window.orientation || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  }

  supportsTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  getLanguage() {
    return navigator.language || navigator.userLanguage || 'zh-CN';
  }

  getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}
```

### 7.2 Web 适配器

```javascript
// src/adapters/WebAdapter.js
import { PlatformAdapter } from './PlatformAdapter.js';

export class WebAdapter extends PlatformAdapter {
  constructor() {
    super();
    this.platform = 'web';
  }

  init() {
    this.registerServiceWorker();
    this.setupPWA();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('ServiceWorker registration failed:', err);
      });
    }
  }

  setupPWA() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isPWA = true;
    }
  }

  isStandalone() {
    return this.isPWA || window.matchMedia('(display-mode: standalone)').matches;
  }

  getBaseURL() {
    return window.location.origin;
  }

  navigate(url) {
    window.location.href = url;
  }
}
```

### 7.3 App 适配器

```javascript
// src/adapters/AppAdapter.js
import { PlatformAdapter } from './PlatformAdapter.js';

export class AppAdapter extends PlatformAdapter {
  constructor() {
    super();
    this.platform = 'app';
    this.cordova = typeof cordova !== 'undefined' ? cordova : null;
  }

  init() {
    if (this.cordova) {
      this.setupCordova();
    }
    this.setupSafeArea();
  }

  setupCordova() {
    document.addEventListener('deviceready', () => {
      this.setupStatusBar();
      this.setupKeyboard();
    }, false);
  }

  setupStatusBar() {
    if (this.cordova && this.cordova.statusBar) {
      this.cordova.statusBar.show();
      this.cordova.statusBar.styleLightContent();
    }
  }

  setupKeyboard() {
    if (this.cordova && this.cordova.plugins && this.cordova.plugins.keyboard) {
      this.cordova.plugins.keyboard.hideKeyboardAccessoryBar(true);
    }
  }

  setupSafeArea() {
    const setSafeArea = () => {
      const safeArea = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0,
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab')) || 0,
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal')) || 0,
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar')) || 0
      };
      
      document.documentElement.style.setProperty('--safe-area-top', `${safeArea.top}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-left', `${safeArea.left}px`);
      document.documentElement.style.setProperty('--safe-area-right', `${safeArea.right}px`);
    };
    
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
      setSafeArea();
    }
  }

  vibrate(ms = 100) {
    if (this.cordova && this.cordova.vibrate) {
      this.cordova.vibrate(ms);
    } else if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  getDeviceInfo() {
    if (this.cordova && this.cordova.device) {
      return {
        platform: this.cordova.device.platform,
        version: this.cordova.device.version,
        model: this.cordova.device.model,
        uuid: this.cordova.device.uuid
      };
    }
    return {
      platform: 'unknown',
      version: 'unknown',
      model: 'unknown',
      uuid: 'unknown'
    };
  }
}
```

### 7.4 Desktop 适配器

```javascript
// src/adapters/DesktopAdapter.js
import { PlatformAdapter } from './PlatformAdapter.js';

export class DesktopAdapter extends PlatformAdapter {
  constructor() {
    super();
    this.platform = 'desktop';
    this.electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;
  }

  init() {
    if (this.isElectron()) {
      this.setupElectron();
    }
  }

  isElectron() {
    return this.electronAPI !== null;
  }

  setupElectron() {
    this.setupMenuHandler();
    this.setupWindowControls();
  }

  setupMenuHandler() {
    if (this.electronAPI) {
      this.electronAPI.onMenuAction((action) => {
        window.dispatchEvent(new CustomEvent('electron-menu-action', { detail: action }));
      });
    }
  }

  setupWindowControls() {
    document.addEventListener('electron-menu-action', (e) => {
      console.log('Menu action:', e.detail);
    });
  }

  async saveFile(data, defaultPath) {
    if (this.electronAPI) {
      return await this.electronAPI.saveFile(JSON.stringify(data, null, 2), defaultPath);
    }
    return this.downloadFile(data, defaultPath);
  }

  async openFile() {
    if (this.electronAPI) {
      const result = await this.electronAPI.openFile();
      if (result.success) {
        return JSON.parse(result.data);
      }
    }
    return null;
  }

  async exportImage(dataUrl, defaultName, type = 'png') {
    if (this.electronAPI) {
      return await this.electronAPI.exportImage(dataUrl, defaultName, type);
    }
    this.downloadFile(dataUrl, defaultName);
  }

  downloadFile(data, filename) {
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  showTrayNotification(title, body) {
    if (this.electronAPI && this.electronAPI.showNotification) {
      this.electronAPI.showNotification(title, body);
    }
  }

  minimize() {
    if (this.electronAPI && this.electronAPI.minimize) {
      this.electronAPI.minimize();
    }
  }

  maximize() {
    if (this.electronAPI && this.electronAPI.maximize) {
      this.electronAPI.maximize();
    }
  }

  close() {
    if (this.electronAPI && this.electronAPI.close) {
      this.electronAPI.close();
    }
  }
}
```

---

## 8. 事件系统

### 8.1 EventEmitter 类

```javascript
// src/events/EventEmitter.js
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
    return () => this.off(event, listener);
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listener);
    }
  }

  emit(event, ...args) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).size : 0;
  }

  listeners(event) {
    return this.events.has(event) ? Array.from(this.events.get(event)) : [];
  }
}
```

### 8.2 事件类型定义

```javascript
// src/events/Events.js
export const AppEvents = {
  EQUATION_ADDED: 'equation:added',
  EQUATION_REMOVED: 'equation:removed',
  EQUATION_UPDATED: 'equation:updated',
  EQUATIONS_CLEARED: 'equations:cleared',
  
  STATE_CHANGE: 'state:change',
  STATE_RESET: 'state:reset',
  
  RENDER_START: 'render:start',
  RENDER_COMPLETE: 'render:complete',
  
  ZOOM_CHANGE: 'zoom:changed',
  PAN_CHANGE: 'pan:changed',
  AXIS_CHANGE: 'axis:changed',
  
  THEME_CHANGE: 'theme:changed',
  LANGUAGE_CHANGE: 'language:changed',
  
  FILE_SAVED: 'file:saved',
  FILE_OPENED: 'file:opened',
  FILE_EXPORTED: 'file:exported',
  
  ERROR: 'error',
  WARNING: 'warning'
};

export const EventPayloads = {
  [AppEvents.EQUATION_ADDED]: equation => ({ equation }),
  [AppEvents.EQUATION_REMOVED]: (equation, index) => ({ equation, index }),
  [AppEvents.EQUATION_UPDATED]: (index, oldEquation, newEquation) => ({ index, oldEquation, newEquation }),
  [AppEvents.ZOOM_CHANGE]: zoom => ({ zoom }),
  [AppEvents.PAN_CHANGE]: (x, y) => ({ x, y }),
  [AppEvents.AXIS_CHANGE]: axisRange => ({ axisRange }),
  [AppEvents.ERROR]: error => ({ error: error.message || error })
};
```

---

## 9. 工具函数

### 9.1 数学工具

```javascript
// src/utils/math.js
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

export function roundTo(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

export function nextPowerOf2(value) {
  let v = value;
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;
  return v;
}
```

### 9.2 颜色工具

```javascript
// src/utils/color.js
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbaToHex(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
  }
  return null;
}

export function hexToRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function lighten(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    clamp(rgb.r + (255 - rgb.r) * percent, 0, 255),
    clamp(rgb.g + (255 - rgb.g) * percent, 0, 255),
    clamp(rgb.b + (255 - rgb.b) * percent, 0, 255)
  );
}

export function darken(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    clamp(rgb.r * (1 - percent), 0, 255),
    clamp(rgb.g * (1 - percent), 0, 255),
    clamp(rgb.b * (1 - percent), 0, 255)
  );
}

export function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export const presetColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
];
```

### 9.3 验证工具

```javascript
// src/utils/validation.js
export function isValidFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return { valid: false, error: '公式不能为空' };
  }
  
  const validChars = /^[a-zA-Z0-9+\-*/^().=xy\s]+$/;
  if (!validChars.test(formula)) {
    return { valid: false, error: '公式包含无效字符' };
  }
  
  const openParens = (formula.match(/\(/g) || []).length;
  const closeParens = (formula.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: '括号不匹配' };
  }
  
  return { valid: true };
}

export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isValidRange(value, min, max) {
  return isValidNumber(value) && value >= min && value <= max;
}

export function isValidColor(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}

export function validateEquationObject(equation) {
  const errors = [];
  
  if (!equation.formula || typeof equation.formula !== 'string') {
    errors.push('缺少公式');
  }
  
  if (!equation.color || !isValidColor(equation.color)) {
    errors.push('无效的颜色值');
  }
  
  if (equation.lineWidth !== undefined) {
    if (!isValidNumber(equation.lineWidth) || equation.lineWidth < 1 || equation.lineWidth > 20) {
      errors.push('线宽必须在 1-20 之间');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

> 文档版本: 1.0 | 最后更新: 2026-03-10
