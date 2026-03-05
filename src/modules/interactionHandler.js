/**
 * 交互处理模块
 * @module modules/interactionHandler
 */

import { canvasToMath } from '../utils/mathUtils.js';

/**
 * 交互处理器类
 */
export class InteractionHandler {
    constructor(canvas, state, renderer2D, renderer3D) {
        this.canvas = canvas;
        this.state = state;
        this.renderer2D = renderer2D;
        this.renderer3D = renderer3D;

        // 交互状态
        this.isDragging = false;
        this.isRotating = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // 绑定事件处理函数
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        // 初始化事件监听
        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown);

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
    }

    /**
     * 销毁事件监听器
     */
    destroy() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        document.removeEventListener('keydown', this.handleKeyDown);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    /**
     * 处理鼠标按下
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isDragging = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
        this.dragStartX = x;
        this.dragStartY = y;

        if (this.state.is3DMode) {
            this.isRotating = true;
        } else {
            // 2D模式下检查是否点击了方程
            this.checkEquationSelection(x, y);
        }
    }

    /**
     * 处理鼠标移动
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 更新坐标显示
        this.updateCoordinateDisplay(x, y);

        if (!this.isDragging) {
            // 更新鼠标样式
            this.updateCursor(x, y);
            return;
        }

        const deltaX = x - this.lastMouseX;
        const deltaY = y - this.lastMouseY;

        if (this.state.is3DMode && this.isRotating) {
            // 3D旋转
            this.handle3DRotation(deltaX, deltaY);
        } else if (this.state.selectedEquationIndex >= 0) {
            // 拖拽方程
            this.handleEquationDrag(deltaX, deltaY);
        } else {
            // 平移视图
            this.handleViewPan(deltaX, deltaY);
        }

        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    /**
     * 处理鼠标释放
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 检查是否是点击（移动距离很小）
            const moveDistance = Math.sqrt(
                (x - this.dragStartX) ** 2 + (y - this.dragStartY) ** 2
            );

            if (moveDistance < 5 && !this.state.is3DMode) {
                // 点击选择方程
                this.selectEquationAt(x, y);
            }
        }

        this.isDragging = false;
        this.isRotating = false;
    }

    /**
     * 处理鼠标离开
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseLeave(e) {
        this.isDragging = false;
        this.isRotating = false;
        this.hideCoordinateDisplay();
    }

    /**
     * 处理滚轮
     * @param {WheelEvent} e - 滚轮事件
     */
    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = this.state.scale * scaleFactor;

        // 限制缩放范围
        const minScale = 5;
        const maxScale = this.state.is3DMode ? 200 : 100;

        if (newScale >= minScale && newScale <= maxScale) {
            // 以鼠标位置为中心缩放
            const mathPos = canvasToMath(x, y, this.state.offsetX, this.state.offsetY, this.state.scale);

            this.state.setScale(newScale);
            this.state.setOffset(
                x - mathPos.x * newScale,
                y + mathPos.y * newScale
            );

            this.render();
        }
    }

    /**
     * 处理键盘按下
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        // Delete键删除选中的方程
        if (e.key === 'Delete' && this.state.selectedEquationIndex >= 0) {
            this.state.removeEquation(this.state.selectedEquationIndex);
            this.render();
            return;
        }

        // Ctrl/Cmd + Z: 撤销
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (this.state.undo()) {
                this.render();
            }
            return;
        }

        // Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z: 重做
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            if (this.state.redo()) {
                this.render();
            }
            return;
        }

        // 方向键微调选中的方程
        if (this.state.selectedEquationIndex >= 0 && 
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const step = e.shiftKey ? 0.5 : 0.1;
            let deltaX = 0, deltaY = 0;

            switch (e.key) {
                case 'ArrowUp': deltaY = step; break;
                case 'ArrowDown': deltaY = -step; break;
                case 'ArrowLeft': deltaX = -step; break;
                case 'ArrowRight': deltaX = step; break;
            }

            this.state.saveHistory();
            // TODO: 更新方程位置
            this.render();
        }
    }

    /**
     * 处理触摸开始
     * @param {TouchEvent} e - 触摸事件
     */
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.isDragging = true;
        this.lastMouseX = x;
        this.lastMouseY = y;

        if (this.state.is3DMode) {
            this.isRotating = true;
        }
    }

    /**
     * 处理触摸移动
     * @param {TouchEvent} e - 触摸事件
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const deltaX = x - this.lastMouseX;
        const deltaY = y - this.lastMouseY;

        if (this.state.is3DMode && this.isRotating) {
            this.handle3DRotation(deltaX, deltaY);
        } else {
            this.handleViewPan(deltaX, deltaY);
        }

        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    /**
     * 处理触摸结束
     * @param {TouchEvent} e - 触摸事件
     */
    handleTouchEnd(e) {
        this.isDragging = false;
        this.isRotating = false;
    }

    /**
     * 处理3D旋转
     * @param {number} deltaX - X方向移动
     * @param {number} deltaY - Y方向移动
     */
    handle3DRotation(deltaX, deltaY) {
        const rotationSpeed = 0.01;
        this.state.rotationY += deltaX * rotationSpeed;
        this.state.rotationX += deltaY * rotationSpeed;
        this.render();
    }

    /**
     * 处理视图平移
     * @param {number} deltaX - X方向移动
     * @param {number} deltaY - Y方向移动
     */
    handleViewPan(deltaX, deltaY) {
        this.state.setOffset(
            this.state.offsetX + deltaX,
            this.state.offsetY + deltaY
        );
        this.render();
    }

    /**
     * 处理方程拖拽
     * @param {number} deltaX - X方向移动
     * @param {number} deltaY - Y方向移动
     */
    handleEquationDrag(deltaX, deltaY) {
        // TODO: 实现方程拖拽逻辑
        this.render();
    }

    /**
     * 检查方程选择
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    checkEquationSelection(x, y) {
        // TODO: 实现方程选择检测
    }

    /**
     * 选择指定位置的方程
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    selectEquationAt(x, y) {
        // TODO: 实现方程选择
        this.render();
    }

    /**
     * 更新坐标显示
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    updateCoordinateDisplay(x, y) {
        const coordDisplay = document.getElementById('coordinate-display');
        if (!coordDisplay) return;

        const mathPos = canvasToMath(x, y, this.state.offsetX, this.state.offsetY, this.state.scale);

        if (this.state.is3DMode) {
            coordDisplay.textContent = `X: ${mathPos.x.toFixed(2)}, Y: ${mathPos.y.toFixed(2)}`;
        } else {
            coordDisplay.textContent = `X: ${mathPos.x.toFixed(2)}, Y: ${mathPos.y.toFixed(2)}`;
        }

        coordDisplay.style.display = 'block';
    }

    /**
     * 隐藏坐标显示
     */
    hideCoordinateDisplay() {
        const coordDisplay = document.getElementById('coordinate-display');
        if (coordDisplay) {
            coordDisplay.style.display = 'none';
        }
    }

    /**
     * 更新鼠标样式
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    updateCursor(x, y) {
        if (this.state.is3DMode) {
            this.canvas.style.cursor = 'move';
        } else if (this.state.selectedEquationIndex >= 0) {
            this.canvas.style.cursor = 'move';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * 渲染场景
     */
    render() {
        if (this.state.is3DMode) {
            this.renderer3D.render3DScene();
        } else {
            this.renderer2D.renderCoordinateSystem();
        }
    }
}

export default InteractionHandler;
