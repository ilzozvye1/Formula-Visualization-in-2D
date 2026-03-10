# 性能优化建议

本文档记录了代码库中已实施和建议的性能优化措施。

## 已实施的优化

### 1. 渲染优化

#### 选择性渲染
- 只渲染可见的方程（`equation.visible === true`）
- 使用 `requestAnimationFrame` 进行渲染循环，避免不必要的重绘

#### 交点计算优化
- 使用采样步长（step = 0.1）减少计算量
- 使用二分法精确计算交点，而不是遍历所有点
- 缓存已计算的交点，避免重复计算

#### 网格线绘制优化
- 只绘制视口内的网格线
- 跳过坐标轴位置的网格线（避免重复绘制）

### 2. 状态管理优化

#### 订阅/发布模式
- 使用事件订阅机制，只在状态变化时更新相关 UI
- 避免轮询，减少不必要的计算

#### 历史记录优化
- 限制历史记录大小（MAX_HISTORY_SIZE）
- 只保存必要的状态数据（方程、缩放、偏移、旋转）

### 3. 代码结构优化

#### 模块化设计
- 将功能分离到不同的模块（renderer, parser, stateManager 等）
- 使用 ES6 模块系统，支持 tree-shaking

#### 单例模式
- `appState` 使用单例模式，避免重复创建
- `presetManager` 使用单例模式，统一管理预设

## 建议的优化

### 1. 渲染性能

#### Web Workers
对于复杂的方程（如 3D 曲面、特殊函数），可以考虑使用 Web Workers 在后台线程计算，避免阻塞主线程。

```javascript
// 示例：使用 Web Worker 计算复杂方程
const worker = new Worker('workers/equationWorker.js');
worker.postMessage({ type: 'calculate', equation: complexEquation });
worker.onmessage = (e) => {
    const points = e.data.points;
    // 使用计算结果进行渲染
};
```

#### 离屏 Canvas
对于静态元素（如坐标轴、网格），可以使用离屏 Canvas 预渲染，然后作为图像绘制到主 Canvas。

```javascript
// 预渲染网格
const gridCanvas = document.createElement('canvas');
gridCanvas.width = canvas.width;
gridCanvas.height = canvas.height;
const gridCtx = gridCanvas.getContext('2d');
// 绘制网格到离屏 Canvas

// 渲染时直接使用
ctx.drawImage(gridCanvas, 0, 0);
```

#### 减少抗锯齿
对于不需要平滑的线条，可以禁用抗锯齿以提高性能：

```javascript
ctx.imageSmoothingEnabled = false;
```

### 2. 内存优化

#### 对象池
对于频繁创建和销毁的对象（如方程点数组），可以使用对象池模式：

```javascript
class PointPool {
    constructor(size = 1000) {
        this.pool = [];
        for (let i = 0; i < size; i++) {
            this.pool.push({ x: 0, y: 0 });
        }
    }
    
    acquire() {
        return this.pool.pop() || { x: 0, y: 0 };
    }
    
    release(point) {
        point.x = 0;
        point.y = 0;
        this.pool.push(point);
    }
}
```

#### 弱引用
对于缓存的数据，使用 `WeakMap` 或 `WeakSet` 允许垃圾回收：

```javascript
const equationCache = new WeakMap();
```

### 3. 加载优化

#### 懒加载
按需加载预设模块，而不是在启动时加载所有预设：

```javascript
// 当前实现已经是懒加载
const presetModules = [
    import('../presets/trigonometricPresets.js'),
    // ... 其他预设
];
await Promise.all(presetModules);
```

#### 代码分割
使用动态导入进行代码分割：

```javascript
// 只在需要时加载 3D 渲染器
if (appState.is3DMode) {
    const { Renderer3D } = await import('./modules/renderer3D.js');
    // 使用 Renderer3D
}
```

### 4. 响应式优化

#### 防抖和节流
对于频繁触发的事件（如窗口调整、输入框变化），使用防抖或节流：

```javascript
// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用示例
window.addEventListener('resize', debounce(() => {
    // 处理窗口调整
}, 250));
```

### 5. 数据结构优化

#### 空间分区
对于大量方程的交点计算，可以使用空间分区数据结构（如四叉树）来减少碰撞检测的次数。

#### Typed Arrays
对于数值计算密集型的代码，使用 Typed Arrays（如 Float32Array）可以提高性能：

```javascript
// 使用 Float32Array 存储点坐标
const points = new Float32Array(width * 2);
for (let i = 0; i < width; i++) {
    points[i * 2] = x;
    points[i * 2 + 1] = y;
}
```

## 性能监控

### 1. 性能指标

建议监控以下性能指标：

- **FPS（Frames Per Second）**: 目标 60 FPS
- **渲染时间**: 每帧渲染时间应 < 16ms
- **内存使用**: 监控堆内存增长
- **方程数量**: 支持同时渲染的方程数量

### 2. 性能分析工具

使用浏览器开发者工具进行性能分析：

```javascript
// 使用 Performance API
const startTime = performance.now();
// 执行代码
const endTime = performance.now();
console.log(`执行时间：${endTime - startTime}ms`);
```

### 3. 内存泄漏检测

定期检查内存泄漏：

```javascript
// 在 Chrome DevTools 中
// 1. 打开 Performance 标签
// 2. 勾选 Memory 选项
// 3. 录制一段时间
// 4. 分析内存增长趋势
```

## 最佳实践

1. **避免在渲染循环中创建对象** - 预先分配并重用对象
2. **减少 DOM 操作** - 批量更新 DOM，使用 DocumentFragment
3. **使用 CSS transforms** - 对于动画，优先使用 transform 而不是 top/left
4. **优化事件监听器** - 使用事件委托，及时移除不需要的监听器
5. **压缩和混淆** - 生产环境使用压缩和混淆代码

## 基准测试

建议建立基准测试，定期运行性能测试：

```javascript
// 性能测试示例
function benchmarkEquationRendering(equationCount) {
    const startTime = performance.now();
    
    // 添加 equationCount 个方程
    for (let i = 0; i < equationCount; i++) {
        app.addEquation(`y = ${Math.random()}x + ${Math.random()}`);
    }
    
    // 强制渲染
    app.render();
    
    const endTime = performance.now();
    return endTime - startTime;
}

// 运行测试
const time = benchmarkEquationRendering(100);
console.log(`渲染 100 个方程耗时：${time}ms`);
```

## 更新日志

- **2026-03-09**: 
  - 实现了轴范围更新功能
  - 改进了 PDF 导出功能（使用 jsPDF）
  - 添加了错误处理机制
  - 修复了反三角函数水平位移问题
