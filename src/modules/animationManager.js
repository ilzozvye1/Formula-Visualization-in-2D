/**
 * 动画管理模块
 * 提供方程参数动画、视图动画等功能
 * @module modules/animationManager
 */

/**
 * 动画类型枚举
 */
export const AnimationType = {
    PARAMETER: 'parameter',      // 参数动画
    VIEW: 'view',                // 视图动画
    PRESET: 'preset'            // 预设动画
};

/**
 * 缓动函数
 */
export const EasingFunctions = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (1 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: t => Math.sin((t * Math.PI) / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInBounce: t => 1 - EasingFunctions.easeOutBounce(1 - t),
    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

/**
 * 动画类
 */
export class Animation {
    constructor(options = {}) {
        this.id = options.id || `anim_${Date.now()}_${Math.random()}`;
        this.type = options.type || AnimationType.PARAMETER;
        this.target = options.target || null; // 动画目标（方程索引或视图）
        this.property = options.property || null; // 要动画的属性
        this.from = options.from || 0; // 起始值
        this.to = options.to || 1; // 结束值
        this.duration = options.duration || 1000; // 持续时间（ms）
        this.delay = options.delay || 0; // 延迟（ms）
        this.easing = options.easing || 'linear'; // 缓动函数
        this.repeat = options.repeat || 0; // 重复次数（-1 为无限循环）
        this.yoyo = options.yoyo || false; // 是否往返动画
        this.onUpdate = options.onUpdate || null; // 更新回调
        this.onComplete = options.onComplete || null; // 完成回调
        
        this.startTime = null;
        this.elapsedTime = 0;
        this.currentRepeat = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.direction = 1; // 1: 正向，-1: 反向
    }
    
    /**
     * 开始动画
     */
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = performance.now() + this.delay;
        this.elapsedTime = 0;
        this.currentRepeat = 0;
        this.direction = 1;
        return this;
    }
    
    /**
     * 停止动画
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.onComplete) {
            this.onComplete(this.target, this.property, this.to);
        }
        return this;
    }
    
    /**
     * 暂停动画
     */
    pause() {
        this.isPaused = true;
        return this;
    }
    
    /**
     * 恢复动画
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.startTime = performance.now() - this.elapsedTime;
        }
        return this;
    }
    
    /**
     * 更新动画
     * @param {number} currentTime - 当前时间
     * @returns {boolean} 是否继续播放
     */
    update(currentTime) {
        if (!this.isPlaying || this.isPaused) {
            return true;
        }
        
        if (currentTime < this.startTime) {
            return true;
        }
        
        this.elapsedTime = currentTime - this.startTime;
        let progress = Math.min(this.elapsedTime / this.duration, 1);
        
        // 应用缓动函数
        const easingFunc = EasingFunctions[this.easing] || EasingFunctions.linear;
        progress = easingFunc(progress);
        
        // 计算当前值
        const currentValue = this.from + (this.to - this.from) * progress * this.direction;
        
        // 调用更新回调
        if (this.onUpdate) {
            this.onUpdate(this.target, this.property, currentValue);
        }
        
        // 检查是否完成
        if (progress >= 1) {
            if (this.repeat === -1 || this.currentRepeat < this.repeat) {
                // 重复动画
                this.currentRepeat++;
                this.startTime = currentTime;
                this.elapsedTime = 0;
                
                if (this.yoyo) {
                    // 往返动画
                    this.direction *= -1;
                    [this.from, this.to] = [this.to, this.from];
                }
                return true;
            } else {
                // 动画完成
                this.stop();
                return false;
            }
        }
        
        return true;
    }
}

/**
 * 动画管理器类
 */
export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.animationFrameId = null;
        this.isRunning = false;
        this.app = null; // 应用引用
    }
    
    /**
     * 初始化
     * @param {Object} app - 应用实例
     */
    init(app) {
        this.app = app;
        this.start();
    }
    
    /**
     * 开始动画循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }
    
    /**
     * 停止动画循环
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * 动画循环
     */
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        // 更新所有动画
        const animationsToRemove = [];
        this.animations.forEach((animation, id) => {
            const shouldContinue = animation.update(currentTime);
            if (!shouldContinue) {
                animationsToRemove.push(id);
            }
        });
        
        // 移除完成的动画
        animationsToRemove.forEach(id => {
            this.animations.delete(id);
        });
        
        // 继续动画循环
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * 添加动画
     * @param {Animation} animation - 动画实例
     */
    addAnimation(animation) {
        this.animations.set(animation.id, animation);
        animation.start();
        return animation.id;
    }
    
    /**
     * 移除动画
     * @param {string} id - 动画 ID
     */
    removeAnimation(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.stop();
            this.animations.delete(id);
        }
    }
    
    /**
     * 获取动画
     * @param {string} id - 动画 ID
     */
    getAnimation(id) {
        return this.animations.get(id);
    }
    
    /**
     * 停止所有动画
     */
    stopAll() {
        this.animations.forEach(animation => animation.stop());
        this.animations.clear();
    }
    
    /**
     * 暂停所有动画
     */
    pauseAll() {
        this.animations.forEach(animation => animation.pause());
    }
    
    /**
     * 恢复所有动画
     */
    resumeAll() {
        this.animations.forEach(animation => animation.resume());
    }
    
    /**
     * 创建参数动画
     * @param {number} equationIndex - 方程索引
     * @param {string} property - 属性名（amplitude, frequency, phase 等）
     * @param {number} from - 起始值
     * @param {number} to - 结束值
     * @param {Object} options - 动画选项
     */
    createParameterAnimation(equationIndex, property, from, to, options = {}) {
        const animation = new Animation({
            type: AnimationType.PARAMETER,
            target: equationIndex,
            property: property,
            from: from,
            to: to,
            duration: options.duration || 1000,
            easing: options.easing || 'linear',
            repeat: options.repeat || 0,
            yoyo: options.yoyo || false,
            onUpdate: (target, prop, value) => {
                this.updateEquationParameter(target, prop, value);
            }
        });
        
        return this.addAnimation(animation);
    }
    
    /**
     * 更新方程参数
     * @param {number} index - 方程索引
     * @param {string} property - 属性名
     * @param {number} value - 属性值
     */
    updateEquationParameter(index, property, value) {
        if (!this.app || !this.app.appState) return;
        
        const equations = this.app.appState.equations;
        if (index >= 0 && index < equations.length) {
            const equation = equations[index];
            if (equation.parsed) {
                equation.parsed[property] = value;
                this.app.render();
            }
        }
    }
    
    /**
     * 创建视图动画
     * @param {Object} options - 动画选项
     */
    createViewAnimation(options = {}) {
        const {
            fromScale,
            toScale,
            fromOffsetX,
            toOffsetX,
            fromOffsetY,
            toOffsetY,
            duration = 1000,
            easing = 'easeInOutQuad'
        } = options;
        
        const appState = this.app.appState;
        const fromScaleVal = fromScale !== undefined ? fromScale : appState.scale;
        const toScaleVal = toScale !== undefined ? toScale : appState.scale;
        const fromOffsetXVal = fromOffsetX !== undefined ? fromOffsetX : appState.offsetX;
        const toOffsetXVal = toOffsetX !== undefined ? toOffsetX : appState.offsetX;
        const fromOffsetYVal = fromOffsetY !== undefined ? fromOffsetY : appState.offsetY;
        const toOffsetYVal = toOffsetY !== undefined ? toOffsetY : appState.offsetY;
        
        // 创建缩放动画
        if (fromScale !== undefined && toScale !== undefined) {
            const scaleAnim = new Animation({
                type: AnimationType.VIEW,
                target: 'view',
                property: 'scale',
                from: fromScaleVal,
                to: toScaleVal,
                duration: duration,
                easing: easing,
                onUpdate: (target, prop, value) => {
                    appState.setScale(value);
                    this.app.render();
                }
            });
            this.addAnimation(scaleAnim);
        }
        
        // 创建偏移动画
        if ((fromOffsetX !== undefined || fromOffsetY !== undefined) &&
            (toOffsetX !== undefined || toOffsetY !== undefined)) {
            const offsetAnim = new Animation({
                type: AnimationType.VIEW,
                target: 'view',
                property: 'offset',
                from: 0,
                to: 1,
                duration: duration,
                easing: easing,
                onUpdate: (target, prop, progress) => {
                    const currentOffsetX = fromOffsetXVal + (toOffsetXVal - fromOffsetXVal) * progress;
                    const currentOffsetY = fromOffsetYVal + (toOffsetYVal - fromOffsetYVal) * progress;
                    appState.setOffset(currentOffsetX, currentOffsetY);
                    this.app.render();
                }
            });
            this.addAnimation(offsetAnim);
        }
    }
    
    /**
     * 创建预设动画
     * @param {string} presetName - 预设名称
     * @param {number} equationIndex - 方程索引
     */
    createPresetAnimation(presetName, equationIndex = 0) {
        const presets = {
            // 振幅波动
            'amplitudeWave': () => {
                return this.createParameterAnimation(
                    equationIndex,
                    'amplitude',
                    1,
                    3,
                    { duration: 2000, repeat: -1, yoyo: true, easing: 'easeInOutSine' }
                );
            },
            // 频率变化
            'frequencyChange': () => {
                return this.createParameterAnimation(
                    equationIndex,
                    'frequency',
                    1,
                    3,
                    { duration: 3000, repeat: -1, yoyo: true, easing: 'easeInOutSine' }
                );
            },
            // 相位旋转
            'phaseRotation': () => {
                return this.createParameterAnimation(
                    equationIndex,
                    'phase',
                    0,
                    Math.PI * 2,
                    { duration: 4000, repeat: -1, easing: 'linear' }
                );
            },
            // 缩放脉冲
            'zoomPulse': () => {
                return this.createViewAnimation({
                    fromScale: 40,
                    toScale: 60,
                    duration: 1000,
                    easing: 'easeInOutQuad'
                });
            },
            // 视图平移
            'viewPan': () => {
                return this.createViewAnimation({
                    fromOffsetX: 0,
                    toOffsetX: 100,
                    fromOffsetY: 0,
                    toOffsetY: 50,
                    duration: 2000,
                    easing: 'easeInOutQuad'
                });
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            return preset();
        } else {
            console.warn(`未知的动画预设：${presetName}`);
            return null;
        }
    }
    
    /**
     * 获取动画状态
     */
    getStats() {
        return {
            total: this.animations.size,
            playing: Array.from(this.animations.values()).filter(a => a.isPlaying && !a.isPaused).length,
            paused: Array.from(this.animations.values()).filter(a => a.isPaused).length
        };
    }
}

// 创建单例实例
export const animationManager = new AnimationManager();

export default animationManager;
