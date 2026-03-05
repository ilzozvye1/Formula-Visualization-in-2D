/**
 * 动画控制UI模块
 * 功能：
 * 1. 播放控制面板（播放/暂停/停止）
 * 2. 时间轴滑块
 * 3. 参数动画设置
 * 4. 录制和导出控制
 */

export class AnimationUI {
    constructor(container, animationEngine) {
        this.container = container;
        this.engine = animationEngine;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
        this.bindEngineEvents();
    }

    createUI() {
        this.container.innerHTML = `
            <div class="animation-panel">
                <div class="animation-section">
                    <h3>动画控制</h3>
                    <div class="playback-controls">
                        <button id="btnPlay" class="btn-control" title="播放">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                        <button id="btnPause" class="btn-control" title="暂停">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        </button>
                        <button id="btnStop" class="btn-control" title="停止">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M6 6h12v12H6z"/>
                            </svg>
                        </button>
                        <button id="btnRecord" class="btn-control btn-record" title="录制">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <circle cx="12" cy="12" r="8" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>

                    <div class="timeline-container">
                        <div class="time-display">
                            <span id="currentTime">0.00</span>
                            <span>/</span>
                            <span id="totalTime">10.00</span>
                            <span>s</span>
                        </div>
                        <div class="timeline-slider">
                            <input type="range" id="timeline" min="0" max="1000" value="0" step="1">
                            <div class="timeline-progress" id="timelineProgress"></div>
                        </div>
                    </div>

                    <div class="animation-settings">
                        <div class="setting-row">
                            <label>速度:</label>
                            <input type="range" id="speedControl" min="0.1" max="3" value="1" step="0.1">
                            <span id="speedValue">1.0x</span>
                        </div>
                        <div class="setting-row">
                            <label>时长:</label>
                            <input type="number" id="durationControl" value="10" min="1" max="60">
                            <span>秒</span>
                        </div>
                        <div class="setting-row">
                            <label>循环:</label>
                            <input type="checkbox" id="loopControl" checked>
                        </div>
                    </div>
                </div>

                <div class="animation-section">
                    <h3>参数动画</h3>
                    <div id="paramAnimations" class="param-list">
                        <div class="empty-state">暂无参数动画</div>
                    </div>
                    <button id="btnAddParamAnim" class="btn-secondary">添加参数动画</button>
                </div>

                <div class="animation-section">
                    <h3>关键帧</h3>
                    <div id="keyframesList" class="keyframes-list">
                        <div class="empty-state">暂无关键帧</div>
                    </div>
                    <div class="keyframe-controls">
                        <button id="btnAddKeyframe" class="btn-secondary">添加关键帧</button>
                        <button id="btnClearKeyframes" class="btn-text">清除所有</button>
                    </div>
                </div>

                <div class="animation-section">
                    <h3>导出</h3>
                    <div class="export-options">
                        <div class="export-format">
                            <label>格式:</label>
                            <select id="exportFormat">
                                <option value="gif">GIF</option>
                                <option value="webm">WebM视频</option>
                                <option value="mp4">MP4视频</option>
                            </select>
                        </div>
                        <div class="export-quality">
                            <label>质量:</label>
                            <select id="exportQuality">
                                <option value="low">低 (480p)</option>
                                <option value="medium" selected>中 (720p)</option>
                                <option value="high">高 (1080p)</option>
                            </select>
                        </div>
                    </div>
                    <button id="btnExport" class="btn-primary">导出动画</button>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .animation-panel {
                padding: 15px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .animation-section {
                margin-bottom: 20px;
                padding: 15px;
                background: var(--bg-secondary, #f7fafc);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
            }
            .animation-section h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: var(--text-primary, #2d3748);
            }
            .playback-controls {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-bottom: 15px;
            }
            .btn-control {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                background: #4299e1;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .btn-control:hover {
                background: #3182ce;
                transform: scale(1.05);
            }
            .btn-control:active {
                transform: scale(0.95);
            }
            .btn-control:disabled {
                background: #a0aec0;
                cursor: not-allowed;
            }
            .btn-record {
                background: #e53e3e;
            }
            .btn-record:hover {
                background: #c53030;
            }
            .btn-record.recording {
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .timeline-container {
                margin-bottom: 15px;
            }
            .time-display {
                text-align: center;
                font-family: monospace;
                font-size: 14px;
                color: var(--text-secondary, #4a5568);
                margin-bottom: 8px;
            }
            .timeline-slider {
                position: relative;
                height: 20px;
            }
            .timeline-slider input[type="range"] {
                width: 100%;
                height: 6px;
                -webkit-appearance: none;
                appearance: none;
                background: #e2e8f0;
                border-radius: 3px;
                outline: none;
                cursor: pointer;
            }
            .timeline-slider input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #4299e1;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .timeline-slider input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
            }
            .animation-settings {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .setting-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .setting-row label {
                width: 50px;
                font-size: 13px;
                color: var(--text-secondary, #4a5568);
            }
            .setting-row input[type="range"] {
                flex: 1;
            }
            .setting-row input[type="number"] {
                width: 60px;
                padding: 4px 8px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
            }
            .setting-row span {
                font-size: 13px;
                color: var(--text-secondary, #4a5568);
                min-width: 40px;
            }
            .param-list, .keyframes-list {
                max-height: 150px;
                overflow-y: auto;
                margin-bottom: 10px;
            }
            .empty-state {
                text-align: center;
                padding: 20px;
                color: var(--text-tertiary, #718096);
                font-size: 13px;
            }
            .param-item, .keyframe-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background: white;
                border-radius: 4px;
                margin-bottom: 6px;
                font-size: 13px;
            }
            .param-info, .keyframe-info {
                flex: 1;
            }
            .param-name, .keyframe-time {
                font-weight: 500;
                color: var(--text-primary, #2d3748);
            }
            .param-value, .keyframe-value {
                font-size: 12px;
                color: var(--text-secondary, #4a5568);
            }
            .keyframe-controls {
                display: flex;
                gap: 10px;
            }
            .btn-secondary {
                flex: 1;
                padding: 8px;
                background: #edf2f7;
                color: #4a5568;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-secondary:hover {
                background: #e2e8f0;
            }
            .btn-text {
                padding: 8px;
                background: transparent;
                color: #e53e3e;
                border: none;
                font-size: 13px;
                cursor: pointer;
            }
            .btn-text:hover {
                text-decoration: underline;
            }
            .btn-primary {
                width: 100%;
                padding: 10px;
                background: #4299e1;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .btn-primary:hover {
                background: #3182ce;
            }
            .export-options {
                margin-bottom: 12px;
            }
            .export-format, .export-quality {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            .export-format label, .export-quality label {
                width: 50px;
                font-size: 13px;
                color: var(--text-secondary, #4a5568);
            }
            .export-format select, .export-quality select {
                flex: 1;
                padding: 6px 10px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
                font-size: 13px;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // 播放控制
        this.container.querySelector('#btnPlay').addEventListener('click', () => {
            this.engine.play();
            this.updatePlayButton();
        });

        this.container.querySelector('#btnPause').addEventListener('click', () => {
            this.engine.pause();
            this.updatePlayButton();
        });

        this.container.querySelector('#btnStop').addEventListener('click', () => {
            this.engine.stop();
            this.updatePlayButton();
            this.updateTimeline();
        });

        // 录制
        const btnRecord = this.container.querySelector('#btnRecord');
        btnRecord.addEventListener('click', () => {
            if (this.engine.isRecording) {
                this.engine.stopRecording();
                btnRecord.classList.remove('recording');
            } else {
                this.engine.startRecording();
                btnRecord.classList.add('recording');
            }
        });

        // 时间轴
        const timeline = this.container.querySelector('#timeline');
        timeline.addEventListener('mousedown', () => {
            this.isDragging = true;
            this.engine.pause();
        });
        timeline.addEventListener('input', (e) => {
            const time = (e.target.value / 1000) * this.engine.duration;
            this.engine.seek(time);
            this.updateTimeDisplay();
        });
        timeline.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // 速度控制
        const speedControl = this.container.querySelector('#speedControl');
        speedControl.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.engine.setSpeed(speed);
            this.container.querySelector('#speedValue').textContent = speed.toFixed(1) + 'x';
        });

        // 时长控制
        const durationControl = this.container.querySelector('#durationControl');
        durationControl.addEventListener('change', (e) => {
            const duration = parseFloat(e.target.value);
            this.engine.setDuration(duration);
            this.container.querySelector('#totalTime').textContent = duration.toFixed(2);
        });

        // 循环控制
        const loopControl = this.container.querySelector('#loopControl');
        loopControl.addEventListener('change', (e) => {
            this.engine.setLoop(e.target.checked);
        });

        // 添加参数动画
        this.container.querySelector('#btnAddParamAnim').addEventListener('click', () => {
            this.showAddParamDialog();
        });

        // 关键帧
        this.container.querySelector('#btnAddKeyframe').addEventListener('click', () => {
            this.addKeyframe();
        });
        this.container.querySelector('#btnClearKeyframes').addEventListener('click', () => {
            this.clearKeyframes();
        });

        // 导出
        this.container.querySelector('#btnExport').addEventListener('click', () => {
            this.exportAnimation();
        });
    }

    bindEngineEvents() {
        this.engine.onUpdate((time, progress) => {
            if (!this.isDragging) {
                this.updateTimeline();
                this.updateTimeDisplay();
            }
        });
    }

    updatePlayButton() {
        const btnPlay = this.container.querySelector('#btnPlay');
        const btnPause = this.container.querySelector('#btnPause');

        if (this.engine.isPlaying) {
            btnPlay.style.display = 'none';
            btnPause.style.display = 'flex';
        } else {
            btnPlay.style.display = 'flex';
            btnPause.style.display = 'none';
        }
    }

    updateTimeline() {
        const timeline = this.container.querySelector('#timeline');
        const progress = (this.engine.currentTime / this.engine.duration) * 1000;
        timeline.value = progress;
    }

    updateTimeDisplay() {
        this.container.querySelector('#currentTime').textContent = this.engine.currentTime.toFixed(2);
    }

    showAddParamDialog() {
        // 简化实现，实际应该显示一个对话框让用户选择参数
        const paramName = prompt('输入参数名:');
        if (paramName) {
            const startValue = parseFloat(prompt('起始值:', '0'));
            const endValue = parseFloat(prompt('结束值:', '10'));

            if (!isNaN(startValue) && !isNaN(endValue)) {
                this.addParamAnimation(paramName, startValue, endValue);
            }
        }
    }

    addParamAnimation(name, startValue, endValue) {
        const paramData = {
            name,
            startValue,
            endValue,
            id: `param_${Date.now()}`
        };

        const container = this.container.querySelector('#paramAnimations');
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const item = document.createElement('div');
        item.className = 'param-item';
        item.innerHTML = `
            <div class="param-info">
                <div class="param-name">${name}</div>
                <div class="param-value">${startValue} → ${endValue}</div>
            </div>
            <button class="btn-icon" data-action="delete">×</button>
        `;

        item.querySelector('[data-action="delete"]').addEventListener('click', () => {
            item.remove();
            if (container.children.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无参数动画</div>';
            }
        });

        container.appendChild(item);
    }

    addKeyframe() {
        const time = this.engine.currentTime;
        const value = prompt(`添加关键帧 at ${time.toFixed(2)}s\n输入值:`);

        if (value !== null) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                this.engine.addKeyframe('default', time, numValue);
                this.updateKeyframesList();
            }
        }
    }

    updateKeyframesList() {
        const container = this.container.querySelector('#keyframesList');
        const frames = this.engine.keyframes.get('default') || [];

        if (frames.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无关键帧</div>';
            return;
        }

        container.innerHTML = frames.map((frame, index) => `
            <div class="keyframe-item" data-index="${index}">
                <div class="keyframe-info">
                    <div class="keyframe-time">${frame.time.toFixed(2)}s</div>
                    <div class="keyframe-value">${frame.value}</div>
                </div>
                <button class="btn-icon" data-action="delete" data-index="${index}">×</button>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const frames = this.engine.keyframes.get('default') || [];
                frames.splice(index, 1);
                this.updateKeyframesList();
            });
        });
    }

    clearKeyframes() {
        if (confirm('确定要清除所有关键帧吗?')) {
            this.engine.keyframes.clear();
            this.updateKeyframesList();
        }
    }

    async exportAnimation() {
        const format = this.container.querySelector('#exportFormat').value;
        const quality = this.container.querySelector('#exportQuality').value;

        const qualitySettings = {
            low: { width: 854, height: 480 },
            medium: { width: 1280, height: 720 },
            high: { width: 1920, height: 1080 }
        };

        const settings = qualitySettings[quality];

        try {
            this.container.querySelector('#btnExport').textContent = '导出中...';
            this.container.querySelector('#btnExport').disabled = true;

            let blob;
            if (format === 'gif') {
                blob = await this.engine.exportToGIF(settings);
            } else {
                blob = await this.engine.exportToVideo({
                    format: format === 'mp4' ? 'mp4' : 'webm',
                    ...settings
                });
            }

            // 下载文件
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animation.${format}`;
            a.click();
            URL.revokeObjectURL(url);

            alert('导出成功!');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        } finally {
            this.container.querySelector('#btnExport').textContent = '导出动画';
            this.container.querySelector('#btnExport').disabled = false;
        }
    }

    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

    destroy() {
        this.engine.destroy();
    }
}

export default AnimationUI;
