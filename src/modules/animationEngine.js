/**
 * 动画引擎模块
 * @module modules/animationEngine
 */

import appState from './stateManager.js';

/**
 * 动画引擎类 - 管理参数动画
 */
export class AnimationEngine {
    constructor() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 10; // 默认10秒一个周期
        this.speed = 1; // 播放速度
        this.animationId = null;
        this.paramAnimations = new Map(); // 参数动画映射
        this.onUpdate = null; // 更新回调
        this.onComplete = null; // 完成回调
    }

    /**
     * 添加参数动画
     * @param {string} equationId - 方程ID
     * @param {string} paramName - 参数名
     * @param {Object} config - 动画配置
     * @param {number} config.start - 起始值
     * @param {number} config.end - 结束值
     * @param {string} config.type - 动画类型 (linear, easeIn, easeOut, easeInOut, sine, bounce)
     * @param {number} config.delay - 延迟（秒）
     * @param {number} config.duration - 持续时间（秒）
     */
    addParamAnimation(equationId, paramName, config) {
        const key = `${equationId}_${paramName}`;
        this.paramAnimations.set(key, {
            equationId,
            paramName,
            start: config.start ?? 0,
            end: config.end ?? 1,
            type: config.type ?? 'linear',
            delay: config.delay ?? 0,
            duration: config.duration ?? this.duration,
            initialValue: null // 将在播放开始时记录
        });
    }

    /**
     * 移除参数动画
     * @param {string} equationId - 方程ID
     * @param {string} paramName - 参数名
     */
    removeParamAnimation(equationId, paramName) {
        const key = `${equationId}_${paramName}`;
        this.paramAnimations.delete(key);
    }

    /**
     * 清除所有动画
     */
    clearAnimations() {
        this.paramAnimations.clear();
    }

    /**
     * 开始播放
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        
        // 记录初始值
        this.paramAnimations.forEach((anim) => {
            const equation = this.getEquation(anim.equationId);
            if (equation && equation.parsed.params) {
                anim.initialValue = equation.parsed.params[anim.paramName];
            }
        });
        
        this.animate();
    }

    /**
     * 暂停播放
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 停止播放
     */
    stop() {
        this.pause();
        this.currentTime = 0;
        this.resetParams();
    }

    /**
     * 重置参数
     */
    resetParams() {
        this.paramAnimations.forEach((anim) => {
            if (anim.initialValue !== null) {
                this.updateParam(anim.equationId, anim.paramName, anim.initialValue);
            }
        });
    }

    /**
     * 设置播放速度
     * @param {number} speed - 速度倍率
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(5, speed));
    }

    /**
     * 设置时间
     * @param {number} time - 时间（秒）
     */
    setTime(time) {
        this.currentTime = Math.max(0, time);
        this.updateParams();
    }

    /**
     * 动画循环
     */
    animate() {
        if (!this.isPlaying) return;

        const timestamp = performance.now();
        const deltaTime = (timestamp - this.lastTimestamp) / 1000; // 转换为秒
        this.lastTimestamp = timestamp;

        // 更新时间
        this.currentTime += deltaTime * this.speed;

        // 检查是否完成一个周期
        const maxDuration = this.getMaxDuration();
        if (this.currentTime >= maxDuration) {
            this.currentTime = 0; // 循环播放
            if (this.onComplete) {
                this.onComplete();
            }
        }

        // 更新参数
        this.updateParams();

        // 回调
        if (this.onUpdate) {
            this.onUpdate(this.currentTime);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 获取最大动画时长
     * @returns {number} 最大时长
     */
    getMaxDuration() {
        let max = this.duration;
        this.paramAnimations.forEach((anim) => {
            const totalDuration = anim.delay + anim.duration;
            if (totalDuration > max) {
                max = totalDuration;
            }
        });
        return max;
    }

    /**
     * 更新所有参数
     */
    updateParams() {
        this.paramAnimations.forEach((anim) => {
            const value = this.calculateParamValue(anim);
            if (value !== null) {
                this.updateParam(anim.equationId, anim.paramName, value);
            }
        });
    }

    /**
     * 计算参数值
     * @param {Object} anim - 动画配置
     * @returns {number|null} 参数值
     */
    calculateParamValue(anim) {
        const elapsed = this.currentTime - anim.delay;
        
        if (elapsed < 0) {
            return anim.start;
        }
        
        if (elapsed >= anim.duration) {
            return anim.end;
        }

        const progress = elapsed / anim.duration;
        const easedProgress = this.ease(progress, anim.type);
        
        return anim.start + (anim.end - anim.start) * easedProgress;
    }

    /**
     * 缓动函数
     * @param {number} t - 进度 (0-1)
     * @param {string} type - 缓动类型
     * @returns {number} 缓动后的进度
     */
    ease(t, type) {
        switch (type) {
            case 'linear':
                return t;
            
            case 'easeIn':
                return t * t;
            
            case 'easeOut':
                return 1 - (1 - t) * (1 - t);
            
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            case 'sine':
                return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2;
            
            case 'bounce':
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
            
            default:
                return t;
        }
    }

    /**
     * 更新方程参数
     * @param {string} equationId - 方程ID
     * @param {string} paramName - 参数名
     * @param {number} value - 参数值
     */
    updateParam(equationId, paramName, value) {
        // 查找方程
        const index = parseInt(equationId);
        if (isNaN(index) || index < 0 || index >= appState.equations.length) {
            return;
        }

        const equation = appState.equations[index];
        if (!equation || !equation.parsed.params) {
            return;
        }

        // 更新参数
        equation.parsed.params[paramName] = value;
        
        // 通知状态更新
        appState.updateEquation(index, { parsed: equation.parsed });
    }

    /**
     * 获取方程
     * @param {string} equationId - 方程ID
     * @returns {Object|null} 方程对象
     */
    getEquation(equationId) {
        const index = parseInt(equationId);
        if (isNaN(index) || index < 0 || index >= appState.equations.length) {
            return null;
        }
        return appState.equations[index];
    }

    /**
     * 导出动画数据
     * @returns {Object} 动画数据
     */
    exportAnimation() {
        return {
            currentTime: this.currentTime,
            duration: this.duration,
            speed: this.speed,
            animations: Array.from(this.paramAnimations.values())
        };
    }

    /**
     * 导入动画数据
     * @param {Object} data - 动画数据
     */
    importAnimation(data) {
        this.currentTime = data.currentTime ?? 0;
        this.duration = data.duration ?? 10;
        this.speed = data.speed ?? 1;
        
        this.paramAnimations.clear();
        if (data.animations) {
            data.animations.forEach((anim) => {
                const key = `${anim.equationId}_${anim.paramName}`;
                this.paramAnimations.set(key, anim);
            });
        }
    }
}

// 创建单例实例
const animationEngine = new AnimationEngine();

export default animationEngine;
export { AnimationEngine };
