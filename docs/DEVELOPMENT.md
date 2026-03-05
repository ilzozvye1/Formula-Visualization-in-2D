# 公式可视化 - 开发文档

## 项目概述

**项目名称**: 公式可视化  
**当前版本**: v1.1.0  
**开发日期**: 2026-03-04  
**技术栈**: HTML5 + CSS3 + JavaScript (ES6+) + Canvas API

---

## 目录

1. [功能架构](#功能架构)
2. [核心模块](#核心模块)
3. [数据流](#数据流)
4. [API参考](#api参考)
5. [事件系统](#事件系统)
6. [状态管理](#状态管理)
7. [后续开发计划](#后续开发计划)
8. [多平台支持方案](#多平台支持方案)

---

## 功能架构

### 1. 2D可视化模块

#### 支持的方程类型（11大类）

| 类型 | 示例 | 解析函数 |
|------|------|----------|
| 线性方程 | `y=2x+1` | `parseLinearEquation()` |
| 二次方程 | `y=x^2+2x+1` | `parseQuadraticEquation()` |
| 幂函数 | `y=x^3`, `y=sqrt(x)` | `parsePowerEquation()` |
| 指数函数 | `y=e^x`, `y=2^x` | `parseExponentialEquation()` |
| 对数函数 | `y=ln(x)`, `y=log10(x)` | `parseLogarithmicEquation()` |
| 三角函数 | `y=sin(x)`, `y=cos(x)` | `parseTrigonometricEquation()` |
| 反三角函数 | `y=arcsin(x)` | `parseInverseTrigonometricEquation()` |
| 双曲函数 | `y=sinh(x)`, `y=cosh(x)` | `parseHyperbolicEquation()` |
| 绝对值函数 | `y=abs(x)` | `parseAbsoluteEquation()` |
| 取整函数 | `y=floor(x)`, `y=ceil(x)` | `parseRoundingEquation()` |
| 特殊函数 | `y=1/x`, `y=sinc(x)` | `parseSpecialEquation()` |

#### 微积分功能

| 功能 | 语法 | 说明 |
|------|------|------|
| 微分 | `deriv:x^2` 或 `y=deriv(x^2)` | 计算导数并绘制 |
| 积分 | `integ:x^2:0:1` 或 `y=integ(x^2,0,1)` | 计算定积分并显示面积 |

### 2. 3D可视化模块

#### 3D空间曲线（12种）

| 曲线名称 | 标识符 | 参数 | 公式 |
|---------|--------|------|------|
| 螺旋线 | `3d:helix` | a, b | x=a·cos(t), y=a·sin(t), z=b·t |
| 三叶结 | `3d:trefoil` | a | x=a(sin(t)+2sin(2t)), y=a(cos(t)-2cos(2t)), z=-a·sin(3t) |
| 环面结 | `3d:torus` | R, r, p, q | (R+r·cos(qt))cos(pt), (R+r·cos(qt))sin(pt), r·sin(qt) |
| 利萨茹曲线 | `3d:lissajous` | a,b,c,nx,ny,nz | x=a·sin(nx·t), y=b·sin(ny·t), z=c·sin(nz·t) |
| 维维亚尼曲线 | `3d:viviani` | a | x=a(1+cos(t)), y=a·sin(t), z=2a·sin(t/2) |
| 球面螺旋线 | `3d:spherical-spiral` | a, b | x=a·cos(t)·cos(bt), y=a·sin(t)·cos(bt), z=a·sin(bt) |
| 圆锥螺旋线 | `3d:conical-spiral` | a, b | x=at·cos(t), y=at·sin(t), z=b·t |
| 3D玫瑰线 | `3d:rose` | a, n, k | r=a·cos(n·t), x=r·cos(t), y=r·sin(t), z=k·t |
| 扭曲立方曲线 | `3d:twisted-cubic` | a | x=t, y=a·t², z=a²·t³/3 |
| 3D正弦波 | `3d:sine-wave` | a, b, c | x=a·t, y=b·sin(ct), z=b·cos(ct) |
| 8字结 | `3d:figure-eight` | a | x=a(2+cos(2t))cos(3t), y=a(2+cos(2t))sin(3t), z=a·sin(4t) |
| 五叶结 | `3d:cinquefoil` | a | x=a·cos(2t)(3+cos(5t)), y=a·sin(2t)(3+cos(5t)), z=a·sin(5t) |

#### 3D曲面（10种）

| 曲面名称 | 标识符 | 参数 | 公式 |
|---------|--------|------|------|
| 平面 | `3dsurf:plane` | a, b, c | z = ax + by + c |
| 球面 | `3dsurf:sphere` | r | x² + y² + z² = r² |
| 圆锥面 | `3dsurf:cone` | a | z² = a(x² + y²) |
| 抛物面 | `3dsurf:paraboloid` | a | z = a(x² + y²) |
| 单叶双曲面 | `3dsurf:hyperboloid` | a, b, c | x²/a² + y²/b² - z²/c² = 1 |
| 马鞍面 | `3dsurf:saddle` | a | z = a(x² - y²) |
| 波浪面 | `3dsurf:wave` | a, b, c | z = a·sin(bx)·cos(cy) |
| 环面 | `3dsurf:torus-surf` | R, r | (R-√(x²+y²))² + z² = r² |
| 高斯曲面 | `3dsurf:gaussian` | a, b | z = a·exp(-(x²+y²)/b²) |
| 涟漪面 | `3dsurf:ripple` | a, b | z = a·sin(b·√(x²+y²)) |

### 3. 交互功能模块

#### 2D交互
- 鼠标滚轮缩放坐标系
- 鼠标拖动移动坐标系
- 点击方程曲线选中
- 拖拽选中方程移动位置
- 方向键微调方程位置
- Shift+方向键快速微调

#### 3D交互
- 鼠标拖拽旋转视角
- 滚轮缩放视图
- 自动旋转（可开关）
- 正视图/俯视图/侧视图快速切换
- 深度雾化效果（可开关）

#### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` / `Ctrl+Shift+Z` | 重做 |
| `Ctrl+A` | 聚焦输入框 |
| `Ctrl+E` | 导出图像 |
| `Ctrl+R` | 重置视图 |
| `Ctrl+0` | 重置缩放 |
| `Delete` | 删除选中方程 |
| `Escape` | 取消选中/关闭菜单 |
| `方向键` | 微调方程位置 |
| `Shift+方向键` | 快速微调 |

### 4. 数据管理模块

#### 本地存储
- 自动保存方程列表到 LocalStorage
- 保存视图设置（缩放、偏移、旋转角度）
- 保存主题设置（深色/浅色模式）

#### 导入/导出
- 导出图像为 PNG 格式
- 导出3D数据为 JSON 格式
- 导入3D数据从 JSON 文件

#### 历史记录
- 支持最多50步撤销/重做
- 在关键操作时自动保存状态

---

## 核心模块

### 1. 方程解析模块

```javascript
// 主解析函数
function parseFormula(formula)

// 各类方程解析函数
function parseLinearEquation(expression)
function parseQuadraticEquation(expression)
function parsePowerEquation(expression)
function parseExponentialEquation(expression)
function parseLogarithmicEquation(expression)
function parseTrigonometricEquation(expression)
function parseInverseTrigonometricEquation(expression)
function parseHyperbolicEquation(expression)
function parseAbsoluteEquation(expression)
function parseRoundingEquation(expression)
function parseSpecialEquation(expression)
function parseDerivativeEquation(expression)
function parseIntegralEquation(expression, a, b)
function parse3DCurveEquation(curveType)
function parse3DSurfaceEquation(surfaceType)
```

### 2. 渲染模块

```javascript
// 2D渲染
function draw2DCoordinateSystem()
function drawEquation(equation, index)
function drawLinearEquation(parsed)
function drawQuadraticEquation(parsed)
// ... 其他绘制函数

// 3D渲染
function draw3DCoordinateSystem()
function draw3DAxes()
function draw3DGrid()
function draw3DCurve(parsed)
function draw3DSurface(parsed)
function project3DTo2D(x, y, z)

// 计算函数
function calculateEquationY(parsed, x)
function calculate3DCurvePoint(curveType, t, params)
function calculate3DSurfacePoint(surfaceType, u, v, params)
```

### 3. 交互模块

```javascript
// 鼠标事件
function handleMouseDown(e)
function handleMouseMove(e)
function handleMouseUp(e)
function handleMouseLeave(e)
function handleWheel(e)

// 键盘事件
function handleKeyDown(e)

// 3D控制
function switchTo2D()
function switchTo3D()
function toggleAutoRotate()
function resetViewFront()
function resetViewTop()
function resetViewSide()
```

### 4. 数据管理模块

```javascript
// 方程管理
function addFormula()
function removeEquation(index)
function clearAllEquations()
function updateEquationPosition(index, deltaX, deltaY)
function updateEquationParam(index, param, value)
function update3DCurveParam(index, param, value)
function update3DSurfaceParam(index, param, value)

// 存储
function saveEquations()
function loadEquations()

// 历史记录
function saveHistory()
function undo()
function redo()
function restoreState(state)

// 导入/导出
function exportImage()
function export3DData()
function import3DData()
```

---

## 数据流

```
用户输入 → parseFormula() → equations数组 → saveEquations() → LocalStorage
                                    ↓
                            drawCoordinateSystem() → Canvas渲染
                                    ↓
                            updateEquationsList() → DOM更新
```

---

## API参考

### 全局变量

```javascript
// 核心对象
canvas, ctx                    // Canvas上下文
scale                          // 缩放比例（默认20）
offsetX, offsetY              // 坐标系偏移（默认400, 300）
rotationX, rotationY, rotationZ  // 3D旋转角度
equations                      // 方程数组
selectedEquationIndex          // 当前选中方程索引
is3DMode                       // 是否3D模式

// 配置
showGrid                       // 显示网格
darkMode                       // 深色模式
showIntersections              // 显示交点
fogEnabled                     // 深度雾化
isAutoRotating                 // 自动旋转

// 历史记录
historyStack                   // 历史状态栈
historyIndex                   // 当前历史索引
```

### 方程对象结构

```javascript
{
    formula: "y=x^2",           // 原始公式字符串
    parsed: {                   // 解析后的对象
        type: "quadratic",      // 方程类型
        a: 1, b: 0, c: 0,       // 参数
        // ... 其他参数
    },
    color: "#ff0000",           // 颜色
    style: "solid",             // 线条样式（solid/dashed/dotted）
    visible: true               // 是否可见
}
```

---

## 事件系统

### 事件监听

```javascript
// Canvas事件
canvas.addEventListener('mousedown', handleMouseDown)
canvas.addEventListener('mousemove', handleMouseMove)
canvas.addEventListener('mouseup', handleMouseUp)
canvas.addEventListener('mouseleave', handleMouseLeave)
canvas.addEventListener('wheel', handleWheel)

// 键盘事件
document.addEventListener('keydown', handleKeyDown)

// 全局点击事件（关闭菜单）
document.addEventListener('click', closeMenus)
```

---

## 状态管理

### 状态切换

```javascript
// 2D/3D模式切换
switchTo2D()  // 切换到2D模式
switchTo3D()  // 切换到3D模式

// 主题切换
toggleDarkMode()

// 视图控制
resetView()
resetViewFront()
resetViewTop()
resetViewSide()
```

---

## 后续开发计划

### 高优先级

1. **性能优化**
   - 3D曲面渲染性能优化（WebGL支持）
   - 大量方程时的性能优化
   - 虚拟滚动优化方程列表

2. **功能增强**
   - 参数动画（时间变量t）
   - 方程组合（多个方程的布尔运算）
   - 区域填充（积分区域、不等式区域）

3. **交互改进**
   - 触摸屏手势优化
   - 多点触控支持
   - 手势识别（捏合缩放、旋转）

### 中优先级

4. **数据功能**
   - 数据点标注
   - 测量工具（距离、角度）
   - 表格数据导入（CSV/Excel）

5. **导出功能**
   - 导出为PDF
   - 导出为SVG矢量图
   - 导出为3D模型格式（OBJ/STL）

6. **分享功能**
   - 生成分享链接
   - 二维码分享
   - 嵌入代码生成

### 低优先级

7. **教育功能**
   - 教学模式（步骤演示）
   - 方程推导动画
   - 练习题生成

8. **社交功能**
   - 用户账号系统
   - 云端保存
   - 社区分享

---

## 多平台支持方案

### 当前架构

```
核心代码（src/）
├── index.html      # Web版本
├── script.js       # 核心逻辑
├── styles.css      # 样式
├── main.js         # Electron主进程
└── preload.js      # Electron预加载

cordova/            # Cordova移动版
├── config.xml
└── www/            # 移动端资源
```

### 分支策略建议

#### 方案一：单仓库多分支

```
main                # 主分支（Web版）
├── feature/xxx     # 功能分支
├── electron        # Electron桌面版
├── cordova         # Cordova移动版
└── pwa             # PWA版本
```

**优点**: 代码共享，易于维护  
**缺点**: 分支管理复杂

#### 方案二：单仓库多入口

```
src/
├── core/           # 核心逻辑（共享）
├── web/            # Web版入口
├── electron/       # Electron入口
├── mobile/         # 移动端入口
└── shared/         # 共享组件
```

**优点**: 代码复用率高，构建灵活  
**缺点**: 目录结构复杂

#### 方案三：多仓库（推荐）

```
formula-visualization-core      # 核心库（npm包）
formula-visualization-web       # Web版
formula-visualization-electron  # 桌面版
formula-visualization-mobile    # 移动版
```

**优点**: 职责清晰，独立发布  
**缺点**: 需要维护多个仓库

### 各平台扩展功能

#### Web版
- 无需额外功能
- 保持轻量级

#### Electron桌面版
- 文件系统访问（直接保存文件）
- 打印功能
- 系统托盘
- 自动更新
- 多窗口支持

#### 移动版（Android/iOS）
- 触摸手势优化
- 振动反馈
- 分享功能（调用系统分享）
- 离线缓存
- 推送通知

#### PWA版
- Service Worker缓存
- 离线使用
- 添加到主屏幕
- 后台同步

---

## 技术债务

### 待优化项

1. **代码组织**
   - 将大文件 script.js 拆分为模块
   - 使用 ES6 模块系统
   - 引入构建工具（Webpack/Vite）

2. **类型安全**
   - 添加 TypeScript 支持
   - 添加类型定义

3. **测试覆盖**
   - 单元测试
   - 集成测试
   - E2E测试

4. **文档完善**
   - API文档（JSDoc）
   - 开发者指南
   - 贡献指南

---

## 附录

### 文件清单

```
Formula Visualization/
├── src/                        # 源代码
│   ├── index.html             # 主页面
│   ├── script.js              # 核心逻辑（~4300行）
│   ├── styles.css             # 样式
│   ├── main.js                # Electron主进程
│   ├── preload.js             # Electron预加载
│   └── assets/                # 图标资源
├── cordova/                    # Cordova移动版
│   ├── config.xml
│   ├── package.json
│   └── www/
├── docs/                       # 文档
│   ├── README.md              # 用户文档
│   ├── DEVELOPMENT.md         # 开发文档（本文件）
│   ├── BUILD_GUIDE.md         # 构建指南
│   └── CHANGELOG.md           # 更新日志
├── package.json               # 项目配置
├── LICENSE                    # 许可证
└── .gitignore                 # Git忽略规则
```

### 依赖清单

**开发依赖**:
- electron
- electron-builder
- cordova

**无运行时依赖**（纯原生JavaScript）

---

*文档版本: v1.0*  
*最后更新: 2026-03-04*
