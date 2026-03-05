/**
 * 参数动画系统模块
 * 功能：
 * 1. 时间变量t支持
 * 2. 参数滑块动画控制
 * 3. 录制和回放动画
 * 4. 动画导出为视频/GIF
 */

export class AnimationEngine {
    constructor() {
        this.isPlaying = false;
        this.isRecording = false;
        this.currentTime = 0;
        this.duration = 10;
        this.fps = 60;
        this.speed = 1;
        this.loop = true;
        this.direction = 1; // 1: forward, -1: backward

        this.animations = new Map();
        this.keyframes = new Map();
        this.recordedFrames = [];

        this.animationId = null;
        this.lastFrameTime = 0;
        this.onUpdateCallbacks = [];
        this.onCompleteCallbacks = [];

        this.easingFunctions = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => 1 - (1 - t) * (1 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
            elastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            bounce: t => {
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
    }

    /**
     * 注册动画
     * @param {string} id - 动画ID
     * @param {Object} config - 动画配置
     */
    register(id, config) {
        const {
            target,
            property,
            startValue,
            endValue,
            startTime = 0,
            endTime = this.duration,
            easing = 'linear',
            onUpdate
        } = config;

        this.animations.set(id, {
            target,
            property,
            startValue,
            endValue,
            startTime,
            endTime,
            easing,
            onUpdate
        });
    }

    /**
     * 注销动画
     * @param {string} id - 动画ID
     */
    unregister(id) {
        this.animations.delete(id);
    }

    /**
     * 添加关键帧
     * @param {string} id - 动画ID
     * @param {number} time - 时间点
     * @param {any} value - 关键帧值
     */
    addKeyframe(id, time, value) {
        if (!this.keyframes.has(id)) {
            this.keyframes.set(id, []);
        }
        const frames = this.keyframes.get(id);
        frames.push({ time, value });
        frames.sort((a, b) => a.time - b.time);
    }

    /**
     * 移除关键帧
     * @param {string} id - 动画ID
     * @param {number} time - 时间点
     */
    removeKeyframe(id, time) {
        if (this.keyframes.has(id)) {
            const frames = this.keyframes.get(id);
            const index = frames.findIndex(f => Math.abs(f.time - time) < 0.001);
            if (index !== -1) {
                frames.splice(index, 1);
            }
        }
    }

    /**
     * 播放动画
     */
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    /**
     * 暂停动画
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 停止动画
     */
    stop() {
        this.pause();
        this.currentTime = 0;
        this.updateAnimations();
    }

    /**
     * 跳转到指定时间
     * @param {number} time - 目标时间
     */
    seek(time) {
        this.currentTime = Math.max(0, Math.min(time, this.duration));
        this.updateAnimations();
    }

    /**
     * 设置播放速度
     * @param {number} speed - 播放速度倍数
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(speed, 10));
    }

    /**
     * 设置动画时长
     * @param {number} duration - 时长（秒）
     */
    setDuration(duration) {
        this.duration = Math.max(1, duration);
    }

    /**
     * 设置循环模式
     * @param {boolean} loop - 是否循环
     */
    setLoop(loop) {
        this.loop = loop;
    }

    /**
     * 动画循环
     * @param {number} currentTime - 当前时间戳
     */
    animate(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        this.currentTime += deltaTime * this.speed * this.direction;

        // 处理时间边界
        if (this.currentTime >= this.duration) {
            if (this.loop) {
                this.currentTime = 0;
            } else {
                this.currentTime = this.duration;
                this.pause();
                this.onCompleteCallbacks.forEach(cb => cb());
            }
        } else if (this.currentTime < 0) {
            if (this.loop) {
                this.currentTime = this.duration;
            } else {
                this.currentTime = 0;
                this.pause();
            }
        }

        this.updateAnimations();

        // 录制帧
        if (this.isRecording) {
            this.recordFrame();
        }

        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    /**
     * 更新所有动画
     */
    updateAnimations() {
        const t = this.currentTime / this.duration;

        this.animations.forEach((animation, id) => {
            const { target, property, startTime, endTime } = animation;

            if (this.currentTime < startTime || this.currentTime > endTime) {
                return;
            }

            const localT = (this.currentTime - startTime) / (endTime - startTime);
            const easedT = this.applyEasing(localT, animation.easing);
            const value = this.interpolateValue(
                animation.startValue,
                animation.endValue,
                easedT,
                id
            );

            if (target && property) {
                target[property] = value;
            }

            if (animation.onUpdate) {
                animation.onUpdate(value, this.currentTime);
            }
        });

        this.onUpdateCallbacks.forEach(cb => cb(this.currentTime, t));
    }

    /**
     * 应用缓动函数
     * @param {number} t - 时间比例 (0-1)
     * @param {string} easing - 缓动函数名称
     * @returns {number} 缓动后的值
     */
    applyEasing(t, easing) {
        const easingFn = this.easingFunctions[easing] || this.easingFunctions.linear;
        return easingFn(Math.max(0, Math.min(1, t)));
    }

    /**
     * 插值计算
     * @param {any} start - 起始值
     * @param {any} end - 结束值
     * @param {number} t - 插值比例
     * @param {string} id - 动画ID（用于关键帧插值）
     * @returns {any} 插值结果
     */
    interpolateValue(start, end, t, id) {
        // 如果有关键帧，使用关键帧插值
        if (id && this.keyframes.has(id)) {
            const frames = this.keyframes.get(id);
            return this.interpolateKeyframes(frames, t);
        }

        // 数值插值
        if (typeof start === 'number' && typeof end === 'number') {
            return start + (end - start) * t;
        }

        // 数组插值
        if (Array.isArray(start) && Array.isArray(end)) {
            return start.map((s, i) => s + (end[i] - s) * t);
        }

        // 对象插值
        if (typeof start === 'object' && typeof end === 'object') {
            const result = {};
            for (const key in start) {
                if (end.hasOwnProperty(key)) {
                    result[key] = this.interpolateValue(start[key], end[key], t);
                }
            }
            return result;
        }

        return t < 0.5 ? start : end;
    }

    /**
     * 关键帧插值
     * @param {Array} frames - 关键帧数组
     * @param {number} t - 时间比例
     * @returns {any} 插值结果
     */
    interpolateKeyframes(frames, t) {
        if (frames.length === 0) return null;
        if (frames.length === 1) return frames[0].value;

        const time = t * this.duration;

        // 找到当前时间所在的关键帧区间
        let prevFrame = frames[0];
        let nextFrame = frames[frames.length - 1];

        for (let i = 0; i < frames.length - 1; i++) {
            if (time >= frames[i].time && time <= frames[i + 1].time) {
                prevFrame = frames[i];
                nextFrame = frames[i + 1];
                break;
            }
        }

        if (prevFrame === nextFrame) {
            return prevFrame.value;
        }

        const localT = (time - prevFrame.time) / (nextFrame.time - prevFrame.time);
        return this.interpolateValue(prevFrame.value, nextFrame.value, localT);
    }

    /**
     * 开始录制
     */
    startRecording() {
        this.isRecording = true;
        this.recordedFrames = [];
    }

    /**
     * 停止录制
     */
    stopRecording() {
        this.isRecording = false;
    }

    /**
     * 录制当前帧
     */
    recordFrame() {
        if (this.recordedFrames.length < this.duration * this.fps) {
            this.recordedFrames.push({
                time: this.currentTime,
                data: this.captureFrame()
            });
        }
    }

    /**
     * 捕获当前帧数据
     * @returns {Object} 帧数据
     */
    captureFrame() {
        const frameData = {};
        this.animations.forEach((animation, id) => {
            const { target, property } = animation;
            if (target && property) {
                frameData[id] = target[property];
            }
        });
        return frameData;
    }

    /**
     * 导出录制为GIF
     * @param {Object} options - 导出选项
     * @returns {Promise<Blob>} GIF Blob
     */
    async exportToGIF(options = {}) {
        const {
            width = 800,
            height = 600,
            quality = 10,
            workers = 2
        } = options;

        // 这里需要集成gif.js或其他GIF编码库
        // 暂时返回一个占位实现
        console.log('Exporting to GIF:', { width, height, quality, workers });
        return new Blob(['GIF placeholder'], { type: 'image/gif' });
    }

    /**
     * 导出录制为视频
     * @param {Object} options - 导出选项
     * @returns {Promise<Blob>} 视频 Blob
     */
    async exportToVideo(options = {}) {
        const {
            format = 'webm',
            codec = 'vp9',
            bitrate = 5000000
        } = options;

        // 使用 MediaRecorder API
        const canvas = document.createElement('canvas');
        const stream = canvas.captureStream(this.fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: `video/${format};codecs=${codec}`,
            videoBitsPerSecond: bitrate
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        return new Promise((resolve, reject) => {
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: `video/${format}` });
                resolve(blob);
            };

            mediaRecorder.onerror = reject;

            mediaRecorder.start();

            // 播放录制的帧
            let frameIndex = 0;
            const playFrame = () => {
                if (frameIndex >= this.recordedFrames.length) {
                    mediaRecorder.stop();
                    return;
                }

                const frame = this.recordedFrames[frameIndex];
                this.seek(frame.time);

                frameIndex++;
                setTimeout(playFrame, 1000 / this.fps);
            };

            playFrame();
        });
    }

    /**
     * 创建参数动画（用于方程参数）
     * @param {Object} equation - 方程对象
     * @param {string} paramName - 参数名
     * @param {Object} config - 动画配置
     */
    createParameterAnimation(equation, paramName, config) {
        const id = `param_${equation.id}_${paramName}`;

        this.register(id, {
            target: equation.parameters || equation,
            property: paramName,
            startValue: config.startValue,
            endValue: config.endValue,
            startTime: config.startTime || 0,
            endTime: config.endTime || this.duration,
            easing: config.easing || 'linear',
            onUpdate: (value) => {
                if (equation.update) {
                    equation.update();
                }
                if (config.onUpdate) {
                    config.onUpdate(value);
                }
            }
        });

        return id;
    }

    /**
     * 创建时间变量动画
     * @param {Function} callback - 每帧回调函数
     * @param {Object} options - 选项
     */
    createTimeAnimation(callback, options = {}) {
        const id = `time_animation_${Date.now()}`;

        this.register(id, {
            target: { t: 0 },
            property: 't',
            startValue: options.startTime || 0,
            endValue: options.endTime || this.duration,
            startTime: 0,
            endTime: this.duration,
            easing: 'linear',
            onUpdate: (value) => {
                callback(value, this.currentTime);
            }
        });

        return id;
    }

    /**
     * 添加更新回调
     * @param {Function} callback - 回调函数
     */
    onUpdate(callback) {
        this.onUpdateCallbacks.push(callback);
    }

    /**
     * 添加完成回调
     * @param {Function} callback - 回调函数
     */
    onComplete(callback) {
        this.onCompleteCallbacks.push(callback);
    }

    /**
     * 移除更新回调
     * @param {Function} callback - 回调函数
     */
    offUpdate(callback) {
        const index = this.onUpdateCallbacks.indexOf(callback);
        if (index !== -1) {
            this.onUpdateCallbacks.splice(index, 1);
        }
    }

    /**
     * 获取当前状态
     * @returns {Object} 状态对象
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isRecording: this.isRecording,
            currentTime: this.currentTime,
            duration: this.duration,
            speed: this.speed,
            loop: this.loop,
            progress: this.currentTime / this.duration
        };
    }

    /**
     * 从状态恢复
     * @param {Object} state - 状态对象
     */
    setState(state) {
        if (state.currentTime !== undefined) {
            this.currentTime = state.currentTime;
        }
        if (state.duration !== undefined) {
            this.duration = state.duration;
        }
        if (state.speed !== undefined) {
            this.speed = state.speed;
        }
        if (state.loop !== undefined) {
            this.loop = state.loop;
        }
    }

    /**
     * 销毁动画引擎
     */
    destroy() {
        this.pause();
        this.animations.clear();
        this.keyframes.clear();
        this.recordedFrames = [];
        this.onUpdateCallbacks = [];
        this.onCompleteCallbacks = [];
    }
}

export default AnimationEngine;
