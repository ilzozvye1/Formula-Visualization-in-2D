/**
 * 手势处理模块
 * @module modules/gestureHandler
 */

/**
 * 手势处理器类 - 处理多点触控手势
 */
export class GestureHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            pinchThreshold: 0.1,      // 捏合阈值
            rotateThreshold: 5,       // 旋转阈值（度）
            panThreshold: 10,         // 平移阈值（像素）
            tapThreshold: 250,        // 点击时间阈值（毫秒）
            doubleTapDelay: 300,      // 双击间隔（毫秒）
            longPressDelay: 500,      // 长按延迟（毫秒）
            ...options
        };

        // 触控状态
        this.touches = new Map();
        this.gestureState = {
            isPinching: false,
            isRotating: false,
            isPanning: false,
            startDistance: 0,
            startAngle: 0,
            lastTapTime: 0,
            longPressTimer: null
        };

        // 回调函数
        this.callbacks = {};

        // 绑定事件处理函数
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        // 初始化
        this.init();
    }

    /**
     * 初始化事件监听
     */
    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    }

    /**
     * 销毁事件监听
     */
    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
    }

    /**
     * 处理触摸开始
     * @param {TouchEvent} e - 触摸事件
     */
    handleTouchStart(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }

        // 记录所有触摸点
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now(),
                currentX: touch.clientX,
                currentY: touch.clientY
            });
        }

        // 处理不同手势
        if (this.touches.size === 1) {
            this.handleSingleTouchStart(e);
        } else if (this.touches.size === 2) {
            this.handleDoubleTouchStart(e);
        }
    }

    /**
     * 处理单指触摸开始
     */
    handleSingleTouchStart(e) {
        const touch = e.touches[0];

        // 检测双击
        const now = Date.now();
        if (now - this.gestureState.lastTapTime < this.options.doubleTapDelay) {
            this.trigger('onDoubleTap', { x: touch.clientX, y: touch.clientY });
            this.gestureState.lastTapTime = 0;
            return;
        }

        // 设置长按定时器
        this.gestureState.longPressTimer = setTimeout(() => {
            this.trigger('onLongPress', { x: touch.clientX, y: touch.clientY });
        }, this.options.longPressDelay);

        // 触发平移开始
        this.gestureState.isPanning = true;
        this.trigger('onPanStart', { x: touch.clientX, y: touch.clientY, deltaX: 0, deltaY: 0 });
    }

    /**
     * 处理双指触摸开始
     */
    handleDoubleTouchStart(e) {
        // 清除长按定时器
        if (this.gestureState.longPressTimer) {
            clearTimeout(this.gestureState.longPressTimer);
            this.gestureState.longPressTimer = null;
        }

        const touches = Array.from(this.touches.values());
        
        // 计算初始距离和角度
        this.gestureState.startDistance = this.getDistance(
            touches[0].startX, touches[0].startY,
            touches[1].startX, touches[1].startY
        );
        this.gestureState.startAngle = this.getAngle(
            touches[0].startX, touches[0].startY,
            touches[1].startX, touches[1].startY
        );

        // 触发捏合开始
        this.gestureState.isPinching = true;
        this.trigger('onPinchStart', {
            scale: 1,
            centerX: (touches[0].startX + touches[1].startX) / 2,
            centerY: (touches[0].startY + touches[1].startY) / 2
        });

        // 触发旋转开始
        this.gestureState.isRotating = true;
        this.trigger('onRotateStart', {
            rotation: 0,
            centerX: (touches[0].startX + touches[1].startX) / 2,
            centerY: (touches[0].startY + touches[1].startY) / 2
        });
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        if (this.touches.size === 0) return;
        e.preventDefault();

        // 更新触摸点位置
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
            }
        }

        // 处理不同手势
        if (this.touches.size === 1) {
            this.handleSingleTouchMove(e);
        } else if (this.touches.size === 2) {
            this.handleDoubleTouchMove(e);
        }
    }

    /**
     * 处理单指移动
     */
    handleSingleTouchMove(e) {
        const touch = e.touches[0];
        const touchData = this.touches.get(touch.identifier);
        if (!touchData) return;

        const deltaX = touch.clientX - touchData.startX;
        const deltaY = touch.clientY - touchData.startY;

        // 如果移动距离超过阈值，取消长按
        if (Math.abs(deltaX) > this.options.panThreshold || Math.abs(deltaY) > this.options.panThreshold) {
            if (this.gestureState.longPressTimer) {
                clearTimeout(this.gestureState.longPressTimer);
                this.gestureState.longPressTimer = null;
            }
        }

        // 触发平移
        if (this.gestureState.isPanning) {
            this.trigger('onPan', {
                x: touch.clientX,
                y: touch.clientY,
                deltaX: touch.clientX - touchData.currentX,
                deltaY: touch.clientY - touchData.currentY
            });
        }
    }

    /**
     * 处理双指移动
     */
    handleDoubleTouchMove(e) {
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return;

        // 计算当前距离和角度
        const currentDistance = this.getDistance(
            touches[0].currentX, touches[0].currentY,
            touches[1].currentX, touches[1].currentY
        );
        const currentAngle = this.getAngle(
            touches[0].currentX, touches[0].currentY,
            touches[1].currentX, touches[1].currentY
        );

        // 触发捏合
        if (this.gestureState.isPinching) {
            const scale = currentDistance / this.gestureState.startDistance;
            this.trigger('onPinch', {
                scale: scale,
                centerX: (touches[0].currentX + touches[1].currentX) / 2,
                centerY: (t