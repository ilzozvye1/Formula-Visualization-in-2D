/**
 * 性能优化工具模块
 * 提供防抖、节流、离屏 Canvas 等性能优化功能
 * @module utils/performance
 */

/**
 * 防抖函数
 * 在指定的延迟后执行函数，如果在延迟期间再次调用则重新计时
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
    let timeout = null;
    
    return function debounced(...args) {
        const context = this;
        
        // 清除之前的定时器
        if (timeout) {
            clearTimeout(timeout);
        }
        
        // 设置新的定时器
        timeout = setTimeout(() => {
            func.apply(context, args);
            timeout = null;
        }, wait);
    };
}

/**
 * 节流函数
 * 限制函数在指定的时间间隔内只执行一次
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
    let inThrottle = false;
    let lastResult = null;
    
    return function throttled(...args) {
        const context = this;
        
        // 如果正在节流中，返回上次的结果
        if (inThrottle) {
            return lastResult;
        }
        
        // 执行函数
        inThrottle = true;
        lastResult = func.apply(context, args);
        
        // 设置节流结束时间
        setTimeout(() => {
            inThrottle = false;
        }, limit);
        
        return lastResult;
    };
}

/**
 * 请求动画帧节流
 * 确保函数在每个动画帧只执行一次
 * @param {Function} func - 要执行的函数
 * @returns {Function} 优化后的函数
 */
export function rafThrottle(func) {
    let rafId = null;
    let lastArgs = null;
    
    return function(...args) {
        lastArgs = args;
        const context = this;
        
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                func.apply(context, lastArgs);
                rafId = null;
                lastArgs = null;
            });
        }
    };
}

/**
 * 离屏 Canvas 渲染器
 * 用于预渲染静态元素，提高渲染性能
 */
export class OffscreenCanvasRenderer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.cache = new Map();
    }
    
    /**
     * 调整离屏 Canvas 大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.clearCache();
    }
    
    /**
     * 缓存渲染结果
     * @param {string} key - 缓存键
     * @param {Function} renderFunc - 渲染函数
     * @returns {boolean} 是否从缓存中获取
     */
    renderWithCache(key, renderFunc) {
        if (this.cache.has(key)) {
            // 从缓存中获取
            const cached = this.cache.get(key);
            this.ctx.drawImage(cached.canvas, 0, 0);
            return true;
        } else {
            // 执行渲染并缓存
            const offscreen = document.createElement('canvas');
            offscreen.width = this.width;
            offscreen.height = this.height;
            const offCtx = offscreen.getContext('2d');
            
            // 临时替换 context 进行渲染
            const originalCtx = this.ctx;
            this.ctx = offCtx;
            renderFunc();
            this.ctx = originalCtx;
            
            // 缓存结果
            this.cache.set(key, offscreen);
            
            // 绘制到主 canvas
            this.ctx.drawImage(offscreen, 0, 0);
            return false;
        }
    }
    
    /**
     * 绘制离屏 Canvas 到目标 context
     * @param {CanvasRenderingContext2D} targetCtx - 目标 context
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    drawTo(targetCtx, x = 0, y = 0) {
        targetCtx.drawImage(this.canvas, x, y);
    }
    
    /**
     * 清空离屏 Canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * 从缓存中移除指定 key
     * @param {string} key - 缓存键
     */
    removeFromCache(key) {
        this.cache.delete(key);
    }
}

/**
 * 网格线离屏渲染器
 * 专门用于预渲染坐标网格线
 */
export class GridOffscreenRenderer extends OffscreenCanvasRenderer {
    constructor(width, height) {
        super(width, height);
        this.lastGridParams = null;
    }
    
    /**
     * 渲染网格线（带缓存）
     * @param {Object} params - 网格参数
     * @param {number} params.scale - 缩放比例
     * @param {number} params.offsetX - X 偏移
     * @param {number} params.offsetY - Y 偏移
     * @param {string} params.gridColor - 网格颜色
     * @param {string} params.axisColor - 坐标轴颜色
     * @param {boolean} params.darkMode - 深色模式
     */
    renderGrid(params) {
        const cacheKey = this.generateCacheKey(params);
        
        // 如果参数相同且缓存有效，使用缓存
        if (this.lastGridParams && this.lastGridParams === cacheKey) {
            this.drawTo(arguments[1] || this.ctx);
            return true;
        }
        
        // 清空并重新渲染
        this.clear();
        this.renderGridLines(params);
        this.lastGridParams = cacheKey;
        
        return false;
    }
    
    /**
     * 生成缓存键
     * @param {Object} params - 参数对象
     * @returns {string} 缓存键
     */
    generateCacheKey(params) {
        return `${params.scale}-${params.offsetX}-${params.offsetY}-${params.gridColor}`;
    }
    
    /**
     * 渲染网格线
     * @param {Object} params - 网格参数
     */
    renderGridLines(params) {
        const { scale, offsetX, offsetY, gridColor, axisColor, darkMode } = params;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = gridColor || (darkMode ? '#404040' : '#e0e0e0');
        ctx.lineWidth = 1;
        
        const step = scale; // 网格间距
        
        // 计算可见范围
        const startX = Math.floor(-offsetX / step) * step;
        const endX = startX + this.width + step;
        const startY = Math.floor(-offsetY / step) * step;
        const endY = startY + this.height + step;
        
        // 绘制垂直网格线
        for (let x = startX; x <= endX; x += step) {
            // 跳过坐标轴位置
            if (Math.abs(x * scale + offsetX - this.width / 2) < 1) continue;
            
            ctx.beginPath();
            ctx.moveTo(x * scale + offsetX, 0);
            ctx.lineTo(x * scale + offsetX, this.height);
            ctx.stroke();
        }
        
        // 绘制水平网格线
        for (let y = startY; y <= endY; y += step) {
            // 跳过坐标轴位置
            if (Math.abs(y * scale + offsetY - this.height / 2) < 1) continue;
            
            ctx.beginPath();
            ctx.moveTo(0, y * scale + offsetY);
            ctx.lineTo(this.width, y * scale + offsetY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

/**
 * 性能监控器
 * 用于监控和分析性能指标
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now(),
            renderTime: 0,
            memoryUsage: 0
        };
        this.callbacks = [];
    }
    
    /**
     * 记录帧
     */
    recordFrame() {
        this.metrics.frameCount++;
        
        const now = performance.now();
        const delta = now - this.metrics.lastTime;
        
        // 每秒更新一次 FPS
        if (delta >= 1000) {
            this.metrics.fps = Math.round((this.metrics.frameCount * 1000) / delta);
            this.metrics.frameCount = 0;
            this.metrics.lastTime = now;
            
            // 通知回调
            this.callbacks.forEach(cb => cb(this.metrics));
        }
    }
    
    /**
     * 记录渲染时间
     * @param {number} startTime - 渲染开始时间
     */
    recordRenderTime(startTime) {
        this.metrics.renderTime = performance.now() - startTime;
    }
    
    /**
     * 更新内存使用
     */
    updateMemoryUsage() {
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
    }
    
    /**
     * 获取当前指标
     * @returns {Object} 性能指标
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * 注册回调
     * @param {Function} callback - 回调函数
     */
    onMetricsUpdate(callback) {
        this.callbacks.push(callback);
    }
    
    /**
     * 移除回调
     * @param {Function} callback - 回调函数
     */
    offMetricsUpdate(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }
    
    /**
     * 重置指标
     */
    reset() {
        this.metrics = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now(),
            renderTime: 0,
            memoryUsage: 0
        };
    }
}

// 创建单例实例
export const performanceMonitor = new PerformanceMonitor();

// 导出辅助函数
export default {
    debounce,
    throttle,
    rafThrottle,
    OffscreenCanvasRenderer,
    GridOffscreenRenderer,
    PerformanceMonitor,
    performanceMonitor
};
