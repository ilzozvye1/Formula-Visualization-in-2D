/**
 * 状态管理模块
 * @module modules/stateManager
 */

import { 
    DEFAULT_SCALE, 
    DEFAULT_OFFSET_X, 
    DEFAULT_OFFSET_Y,
    DEFAULT_ROTATION_X,
    DEFAULT_ROTATION_Y,
    DEFAULT_ROTATION_Z,
    MAX_HISTORY_SIZE,
    PRESET_COLORS
} from '../config/constants.js';

/**
 * 应用状态类
 */
class AppState {
    constructor() {
        // 画布状态
        this.scale = DEFAULT_SCALE;
        this.offsetX = DEFAULT_OFFSET_X;
        this.offsetY = DEFAULT_OFFSET_Y;
        
        // 3D状态
        this.rotationX = DEFAULT_ROTATION_X;
        this.rotationY = DEFAULT_ROTATION_Y;
        this.rotationZ = DEFAULT_ROTATION_Z;
        this.is3DMode = false;
        
        // 方程列表
        this.equations = [];
        this.selectedEquationIndex = -1;
        
        // 视图状态
        this.showGrid = true;
        this.darkMode = false;
        this.showIntersections = false;
        
        // 3D特效
        this.fogEnabled = false;
        this.isAutoRotating = false;
        
        // 历史记录
        this.historyStack = [];
        this.historyIndex = -1;
        
        // 画布引用
        this.canvas = null;
        this.ctx = null;
        
        // 监听器
        this.listeners = new Map();
    }
    
    /**
     * 初始化画布
     * @param {HTMLCanvasElement} canvas - 画布元素
     */
    initCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    /**
     * 订阅状态变化
     * @param {string} key - 状态键
     * @param {Function} callback - 回调函数
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    }
    
    /**
     * 取消订阅
     * @param {string} key - 状态键
     * @param {Function} callback - 回调函数
     */
    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }
    
    /**
     * 通知状态变化
     * @param {string} key - 状态键
     * @param {*} value - 新值
     */
    notify(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value));
        }
    }
    
    /**
     * 设置缩放
     * @param {number} scale - 缩放值
     */
    setScale(scale) {
        this.scale = scale;
        this.notify('scale', scale);
    }
    
    /**
     * 设置偏移
     * @param {number} x - X偏移
     * @param {number} y - Y偏移
     */
    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        this.notify('offset', { x, y });
    }
    
    /**
     * 设置3D旋转
     * @param {number} x - X旋转
     * @param {number} y - Y旋转
     * @param {number} z - Z旋转
     */
    setRotation(x, y, z) {
        this.rotationX = x;
        this.rotationY = y;
        this.rotationZ = z;
        this.notify('rotation', { x, y, z });
    }
    
    /**
     * 切换3D模式
     * @param {boolean} is3D - 是否3D模式
     */
    set3DMode(is3D) {
        this.is3DMode = is3D;
        this.notify('3dMode', is3D);
    }
    
    /**
     * 添加方程
     * @param {Object} equation - 方程对象
     */
    addEquation(equation) {
        this.equations.push(equation);
        this.notify('equations', this.equations);
        this.saveHistory();
    }
    
    /**
     * 移除方程
     * @param {number} index - 方程索引
     */
    removeEquation(index) {
        if (index >= 0 && index < this.equations.length) {
            this.equations.splice(index, 1);
            if (this.selectedEquationIndex === index) {
                this.selectedEquationIndex = -1;
            } else if (this.selectedEquationIndex > index) {
                this.selectedEquationIndex--;
            }
            this.notify('equations', this.equations);
            this.saveHistory();
        }
    }
    
    /**
     * 更新方程
     * @param {number} index - 方程索引
     * @param {Object} updates - 更新内容
     */
    updateEquation(index, updates) {
        if (index >= 0 && index < this.equations.length) {
            Object.assign(this.equations[index], updates);
            this.notify('equations', this.equations);
        }
    }
    
    /**
     * 设置选中方程
     * @param {number} index - 方程索引
     */
    setSelectedEquation(index) {
        this.selectedEquationIndex = index;
        this.notify('selectedEquation', index);
    }
    
    /**
     * 切换深色模式
     * @param {boolean} dark - 是否深色模式
     */
    setDarkMode(dark) {
        this.darkMode = dark;
        this.notify('darkMode', dark);
    }
    
    /**
     * 切换网格显示
     * @param {boolean} show - 是否显示网格
     */
    setShowGrid(show) {
        this.showGrid = show;
        this.notify('showGrid', show);
    }
    
    /**
     * 切换交点显示
     * @param {boolean} show - 是否显示交点
     */
    setShowIntersections(show) {
        this.showIntersections = show;
        this.notify('showIntersections', show);
    }
    
    /**
     * 切换雾化
     * @param {boolean} enabled - 是否启用雾化
     */
    setFogEnabled(enabled) {
        this.fogEnabled = enabled;
        this.notify('fogEnabled', enabled);
    }
    
    /**
     * 切换自动旋转
     * @param {boolean} rotating - 是否自动旋转
     */
    setAutoRotating(rotating) {
        this.isAutoRotating = rotating;
        this.notify('autoRotating', rotating);
    }
    
    /**
     * 保存历史记录
     */
    saveHistory() {
        // 删除当前位置之后的历史
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
        
        // 保存当前状态
        const state = {
            equations: JSON.parse(JSON.stringify(this.equations)),
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            rotationX: this.rotationX,
            rotationY: this.rotationY,
            rotationZ: this.rotationZ
        };
        
        this.historyStack.push(state);
        
        // 限制历史记录大小
        if (this.historyStack.length > MAX_HISTORY_SIZE) {
            this.historyStack.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    /**
     * 撤销
     * @returns {boolean} 是否成功
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.historyStack[this.historyIndex]);
            return true;
        }
        return false;
    }
    
    /**
     * 重做
     * @returns {boolean} 是否成功
     */
    redo() {
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyIndex++;
            this.restoreState(this.historyStack[this.historyIndex]);
            return true;
        }
        return false;
    }
    
    /**
     * 恢复状态
     * @param {Object} state - 状态对象
     */
    restoreState(state) {
        this.equations = JSON.parse(JSON.stringify(state.equations));
        this.scale = state.scale;
        this.offsetX = state.offsetX;
        this.offsetY = state.offsetY;
        this.rotationX = state.rotationX;
        this.rotationY = state.rotationY;
        this.rotationZ = state.rotationZ;
        
        this.notify('stateRestored', state);
    }
    
    /**
     * 清空所有方程
     */
    clearAllEquations() {
        this.equations = [];
        this.selectedEquationIndex = -1;
        this.notify('equations', this.equations);
        this.saveHistory();
    }
    
    /**
     * 获取新方程颜色
     * @returns {string} 颜色值
     */
    getNewEquationColor() {
        const index = this.equations.length % PRESET_COLORS.length;
        return PRESET_COLORS[index];
    }
    
    /**
     * 重置视图
     */
    resetView() {
        this.scale = DEFAULT_SCALE;
        this.offsetX = DEFAULT_OFFSET_X;
        this.offsetY = DEFAULT_OFFSET_Y;
        this.rotationX = DEFAULT_ROTATION_X;
        this.rotationY = DEFAULT_ROTATION_Y;
        this.rotationZ = DEFAULT_ROTATION_Z;
        
        this.notify('viewReset', {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            rotationX: this.rotationX,
            rotationY: this.rotationY,
            rotationZ: this.rotationZ
        });
    }
    
    /**
     * 导出状态
     * @returns {Object} 状态对象
     */
    exportState() {
        return {
            equations: this.equations,
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            rotationX: this.rotationX,
            rotationY: this.rotationY,
            rotationZ: this.rotationZ,
            is3DMode: this.is3DMode,
            showGrid: this.showGrid,
            darkMode: this.darkMode,
            showIntersections: this.showIntersections,
            fogEnabled: this.fogEnabled
        };
    }
    
    /**
     * 导入状态
     * @param {Object} state - 状态对象
     */
    importState(state) {
        if (state.equations) this.equations = state.equations;
        if (state.scale) this.scale = state.scale;
        if (state.offsetX) this.offsetX = state.offsetX;
        if (state.offsetY) this.offsetY = state.offsetY;
        if (state.rotationX !== undefined) this.rotationX = state.rotationX;
        if (state.rotationY !== undefined) this.rotationY = state.rotationY;
        if (state.rotationZ !== undefined) this.rotationZ = state.rotationZ;
        if (state.is3DMode !== undefined) this.is3DMode = state.is3DMode;
        if (state.showGrid !== undefined) this.showGrid = state.showGrid;
        if (state.darkMode !== undefined) this.darkMode = state.darkMode;
        if (state.showIntersections !== undefined) this.showIntersections = state.showIntersections;
        if (state.fogEnabled !== undefined) this.fogEnabled = state.fogEnabled;
        
        this.notify('stateImported', state);
    }
}

// 创建单例实例
const appState = new AppState();

export default appState;
export { AppState };
