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
        this.isDraggingEquation = false; // 重置方程拖拽标志

        // 检查是否点击了方程（2D和3D模式都支持）
        const clickedEquationIndex = this.getClickedEquationIndex(x, y);
        
        if (clickedEquationIndex >= 0) {
            // 点击了方程，选中方程
            this.state.setSelectedEquation(clickedEquationIndex);
            this.dragStartEquationParams = this.getEquationDragParams();
            this.isDraggingEquation = true; // 标记为拖拽方程
        } else {
            // 没有点击方程
            if (this.state.is3DMode) {
                // 3D模式下，进行旋转
                this.isRotating = true;
            }
            // 取消选择
            this.state.setSelectedEquation(-1);
        }
    }
    
    /**
     * 获取点击的方程索引
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     * @returns {number} 方程索引，如果没有点击方程返回-1
     */
    getClickedEquationIndex(x, y) {
        const { scale, offsetX, offsetY, equations } = this.state;
        const threshold = 15; // 点击阈值（像素）
        
        // 将鼠标坐标转换为数学坐标
        const mathPos = canvasToMath(x, y, offsetX, offsetY, scale);
        
        // 遍历所有方程，检查是否点击了某个方程
        // 从后往前检查，优先选中最上层的
        for (let i = equations.length - 1; i >= 0; i--) {
            const equation = equations[i];
            if (!equation.visible) continue;
            
            // 检查鼠标位置是否在方程线条附近
            if (this.isPointNearEquation(mathPos.x, mathPos.y, equation, threshold / scale)) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * 获取当前选中方程的拖拽参数
     * @returns {Object|null} 方程参数
     */
    getEquationDragParams() {
        const { selectedEquationIndex, equations } = this.state;
        if (selectedEquationIndex < 0 || selectedEquationIndex >= equations.length) {
            return null;
        }
        
        const equation = equations[selectedEquationIndex];
        const { parsed } = equation;
        
        // 基础参数
        const baseParams = {
            type: parsed.type,
            verticalShift: parsed.verticalShift || 0,
            horizontalShift: parsed.horizontalShift || 0
        };
        
        // 根据方程类型返回相应的参数
        switch (parsed.type) {
            case 'linear':
                return { 
                    ...baseParams,
                    intercept: parsed.intercept
                };
            case 'quadratic':
                return { 
                    ...baseParams,
                    c: parsed.c
                };
            case 'power':
                return {
                    ...baseParams,
                    coefficient: parsed.coefficient
                };
            case 'exponential':
                return {
                    ...baseParams,
                    coefficient: parsed.coefficient
                };
            case 'logarithmic':
                return {
                    ...baseParams,
                    coefficient: parsed.coefficient
                };
            case 'trigonometric':
                return { 
                    ...baseParams,
                    phase: parsed.phase || 0,
                    frequency: parsed.frequency || 1
                };
            case 'inverseTrigonometric':
                return { 
                    ...baseParams,
                    phase: parsed.phase || 0,
                    frequency: parsed.frequency || 1,
                    amplitude: parsed.amplitude || 1
                };
            case 'hyperbolic':
                return { 
                    ...baseParams,
                    phase: parsed.phase || 0,
                    frequency: parsed.frequency || 1,
                    amplitude: parsed.amplitude || 1
                };
            case 'absolute':
                return { 
                    ...baseParams,
                    phase: parsed.phase || 0,
                    frequency: parsed.frequency || 1
                };
            case 'rounding':
                return { 
                    ...baseParams,
                    phase: parsed.phase || 0,
                    frequency: parsed.frequency || 1,
                    coefficient: parsed.coefficient || 1
                };
            default:
                return baseParams;
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

        if (this.isDraggingEquation) {
            // 拖拽方程 - 传递当前鼠标位置（2D和3D模式都支持）
            this.handleEquationDrag(x, y);
        } else if (this.state.is3DMode && this.isRotating) {
            // 3D旋转
            this.handle3DRotation(deltaX, deltaY);
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
        this.isDragging = false;
        this.isRotating = false;
        this.isDraggingEquation = false;
        this.dragStartEquationParams = null;
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
     * @param {number} currentX - 当前鼠标X坐标
     * @param {number} currentY - 当前鼠标Y坐标
     */
    handleEquationDrag(currentX, currentY) {
        const { scale, selectedEquationIndex, equations } = this.state;
        
        if (selectedEquationIndex < 0 || selectedEquationIndex >= equations.length) {
            return;
        }
        
        const equation = equations[selectedEquationIndex];
        const { parsed } = equation;
        
        // 计算本次移动的位移（像素转换为数学坐标）
        const deltaX = (currentX - this.lastMouseX) / scale;
        const deltaY = -(currentY - this.lastMouseY) / scale; // Y轴方向相反
        
        // 设置移动阈值（降低阈值提高灵敏度）
        const threshold = 0.001;
        
        // 只有移动距离超过阈值才更新
        if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
            return;
        }
        
        // 根据方程类型更新参数（参考原始script.js的实现）
        switch (parsed.type) {
            case 'linear':
                // 对于一次方程 y = slope*x + intercept
                // 水平移动：改变截距（因为 y = slope*x + intercept，向右移动deltaX相当于 y = slope*(x-deltaX) + intercept = slope*x + (intercept - slope*deltaX)）
                // 垂直移动：改变截距
                parsed.intercept += deltaY - parsed.slope * deltaX;
                // 保留两位小数
                parsed.intercept = Math.round(parsed.intercept * 100) / 100;
                break;
                
            case 'quadratic':
                // 对于二次方程 y = a*x² + b*x + c
                // 水平移动：改变b和c（完成平方后的平移）
                // 顶点坐标为 (-b/2a, c - b²/4a)
                // 向右移动deltaX，顶点x坐标增加deltaX
                // 新的b = -2a * (新的顶点x) = -2a * (-b/2a + deltaX) = b - 2a*deltaX
                // 新的c = 新的顶点y + b²/4a = (原来的y在x=-b/2a+deltaX处) + b²/4a
                let oldB = parsed.b;
                parsed.b -= 2 * parsed.a * deltaX;
                // c的变化：保持顶点y坐标不变，但顶点x移动了
                // y = a*(-b/2a)² + b*(-b/2a) + c = c - b²/4a
                // 新的c = 新的顶点y + (新的b)²/4a
                // 由于顶点y不变，所以 c - b²/4a = 新的c - (新的b)²/4a
                // 新的c = c - b²/4a + (新的b)²/4a = c + (新的b² - b²)/4a
                parsed.c += deltaY + (parsed.b * parsed.b - oldB * oldB) / (4 * parsed.a);
                // 保留两位小数
                parsed.b = Math.round(parsed.b * 100) / 100;
                parsed.c = Math.round(parsed.c * 100) / 100;
                break;
                
            case 'power':
                // 对于幂函数 y = coefficient * (x - horizontalShift)^power + verticalShift
                // 水平移动：通过 horizontalShift 参数实现
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            case 'exponential':
                // 对于指数函数 y = coefficient * base^(x - horizontalShift) + verticalShift
                // 水平移动：通过 horizontalShift 参数实现
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            case 'logarithmic':
                // 对于对数函数 y = coefficient * log(x - horizontalShift) + verticalShift
                // 水平移动：通过 horizontalShift 参数实现
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;
                
            case 'trigonometric':
                // 对于三角函数 y = amplitude * sin(frequency*x + phase) + verticalShift
                // 水平移动：改变相位 phase
                // 垂直移动：改变 verticalShift
                if (!parsed.phase) parsed.phase = 0;
                if (!parsed.verticalShift) parsed.verticalShift = 0;
                parsed.phase -= parsed.frequency * deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.phase = Math.round(parsed.phase * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;
                
            case 'absolute':
                // 对于绝对值函数 y = coefficient * |x - horizontalShift| + verticalShift
                // 水平移动：改变 horizontalShift
                // 垂直移动：改变 verticalShift
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            case 'inverseTrigonometric':
                // 对于反三角函数 y = amplitude * arcsin(x - horizontalShift) + verticalShift
                // 水平移动：改变 horizontalShift
                // 垂直移动：改变 verticalShift
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            case 'hyperbolic':
                // 对于双曲函数 y = amplitude * sinh(frequency*(x - horizontalShift)) + verticalShift
                // 水平移动：改变 horizontalShift
                // 垂直移动：改变 verticalShift
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            case 'rounding':
                // 对于取整函数 y = coefficient * floor(x - horizontalShift) + verticalShift
                // 水平移动：改变 horizontalShift
                // 垂直移动：改变 verticalShift
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                // 保留两位小数
                parsed.horizontalShift = Math.round(parsed.horizontalShift * 100) / 100;
                parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
                break;

            default:
                // 对于其他类型，使用horizontalShift和verticalShift
                if (parsed.horizontalShift === undefined) parsed.horizontalShift = 0;
                if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
                parsed.horizontalShift += deltaX;
                parsed.verticalShift += deltaY;
                break;
        }
        
        // 更新方程
        this.state.updateEquation(selectedEquationIndex, { parsed });
        this.render();
    }

    /**
     * 根据拖拽更新方程参数
     * @param {Object} parsed - 解析后的方程
     * @param {number} mathDeltaX - X方向数学位移
     * @param {number} mathDeltaY - Y方向数学位移
     * @param {Object} startParams - 初始参数
     * @param {number} newHorizontalShift - 新的水平位移
     * @param {number} newVerticalShift - 新的垂直位移
     */
    updateEquationParamsByDrag(parsed, mathDeltaX, mathDeltaY, startParams, newHorizontalShift, newVerticalShift) {
        // 根据方程类型更新实际参数
        switch (parsed.type) {
            case 'linear':
                // 线性方程：更新截距
                // y = slope * (x - horizontalShift) + intercept + verticalShift
                // 垂直移动时，截距直接变化
                // 水平移动时，截距需要减去 slope * horizontalShift 的变化量
                const slope = parsed.slope || 1;
                const hShiftDelta = newHorizontalShift - (startParams.horizontalShift || 0);
                const vShiftDelta = newVerticalShift - (startParams.verticalShift || 0);
                parsed.intercept = startParams.intercept + mathDeltaY - slope * hShiftDelta;
                break;
            case 'quadratic':
                // 二次方程：更新c值
                // y = a*(x - h)^2 + b*(x - h) + c + v
                // 其中 h = horizontalShift, v = verticalShift
                // 垂直移动时，c直接变化
                // 水平移动时，需要考虑a和b的影响
                const a = parsed.a || 1;
                const b = parsed.b || 0;
                const hShiftDeltaQuad = newHorizontalShift - (startParams.horizontalShift || 0);
                // c的变化 = 垂直位移 - (a * h^2 + b * h)的变化
                parsed.c = startParams.c + mathDeltaY - (a * hShiftDeltaQuad * hShiftDeltaQuad + b * hShiftDeltaQuad);
                break;
            case 'power':
                // 幂函数：更新系数
                // y = coefficient * x^power
                // 垂直移动时，系数需要调整以保持形状
                if (mathDeltaY !== 0) {
                    parsed.coefficient = (startParams.coefficient || 1) * (1 + mathDeltaY * 0.1);
                }
                break;
            case 'exponential':
                // 指数函数：更新系数
                // y = coefficient * base^x
                if (mathDeltaY !== 0) {
                    parsed.coefficient = (startParams.coefficient || 1) * (1 + mathDeltaY * 0.1);
                }
                break;
            case 'logarithmic':
                // 对数函数：更新系数
                // y = coefficient * log(x)
                if (mathDeltaY !== 0) {
                    parsed.coefficient = (startParams.coefficient || 1) * (1 + mathDeltaY * 0.1);
                }
                break;
            case 'trigonometric':
                // 三角函数：更新垂直位移和相位
                // y = amplitude * sin(frequency * x + phase) + verticalShift
                parsed.verticalShift = (startParams.verticalShift || 0) + mathDeltaY;
                // 水平移动时，更新相位
                if (mathDeltaX !== 0) {
                    parsed.phase = (startParams.phase || 0) - mathDeltaX * (parsed.frequency || 1);
                }
                break;
            case 'absolute':
                // 绝对值函数：更新垂直位移和相位
                // y = coefficient * |frequency * x + phase| + verticalShift
                parsed.verticalShift = (startParams.verticalShift || 0) + mathDeltaY;
                if (mathDeltaX !== 0) {
                    parsed.phase = (startParams.phase || 0) - mathDeltaX * (parsed.frequency || 1);
                }
                break;
            default:
                // 对于其他类型，只更新位移参数
                break;
        }
    }

    /**
     * 检查方程选择
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    checkEquationSelection(x, y) {
        const { scale, offsetX, offsetY, equations } = this.state;
        const threshold = 15; // 增加点击阈值（像素），提高灵敏度
        
        // 将鼠标坐标转换为数学坐标
        const mathPos = canvasToMath(x, y, offsetX, offsetY, scale);
        
        // 遍历所有方程，检查是否点击了某个方程
        // 优先检查已选中的方程，避免在拖拽时切换到其他方程
        const selectedIndex = this.state.selectedEquationIndex;
        if (selectedIndex >= 0 && selectedIndex < equations.length) {
            const selectedEquation = equations[selectedIndex];
            if (selectedEquation.visible && 
                this.isPointNearEquation(mathPos.x, mathPos.y, selectedEquation, threshold / scale)) {
                // 保持选中状态，不重新设置
                return;
            }
        }
        
        // 检查其他方程（从后往前，优先选中最上层的）
        for (let i = equations.length - 1; i >= 0; i--) {
            if (i === selectedIndex) continue; // 跳过已检查的选中方程
            
            const equation = equations[i];
            if (!equation.visible) continue;
            
            // 检查鼠标位置是否在方程线条附近
            if (this.isPointNearEquation(mathPos.x, mathPos.y, equation, threshold / scale)) {
                this.state.setSelectedEquation(i);
                return;
            }
        }
        
        // 如果没有点击任何方程，取消选择
        this.state.setSelectedEquation(-1);
    }
    
    /**
     * 检查点是否在方程附近
     * @param {number} x - 数学X坐标
     * @param {number} y - 数学Y坐标
     * @param {Object} equation - 方程对象
     * @param {number} threshold - 阈值
     * @returns {boolean} 是否在附近
     */
    isPointNearEquation(x, y, equation, threshold) {
        const { parsed } = equation;
        const { horizontalShift = 0, verticalShift = 0, phase = 0 } = parsed;
        
        // 根据方程类型选择正确的水平位移参数
        let actualHorizontalShift;
        switch (parsed.type) {
            case 'power':
            case 'exponential':
            case 'logarithmic':
                // 这些函数使用 horizontalShift 参数来实现水平移动
                actualHorizontalShift = horizontalShift;
                break;
            default:
                actualHorizontalShift = horizontalShift;
        }
        
        // 应用水平位移后的X坐标
        const shiftedX = x - actualHorizontalShift;
        
        // 根据方程类型计算Y值（不包含垂直位移，因为垂直位移在方程定义中已经包含）
        let equationY;
        try {
            switch (parsed.type) {
                case 'linear':
                    equationY = parsed.slope * shiftedX + parsed.intercept + verticalShift;
                    break;
                case 'quadratic':
                    equationY = parsed.a * shiftedX * shiftedX + parsed.b * shiftedX + parsed.c + verticalShift;
                    break;
                case 'power':
                    equationY = parsed.coefficient * Math.pow(shiftedX, parsed.exponent) + verticalShift;
                    break;
                case 'exponential':
                    equationY = parsed.coefficient * Math.pow(parsed.base === 'e' ? Math.E : parsed.base, shiftedX) + verticalShift;
                    break;
                case 'logarithmic':
                    if (shiftedX <= 0) return false;
                    equationY = parsed.coefficient * (parsed.base === 'e' ? Math.log(shiftedX) : Math.log(shiftedX) / Math.log(parsed.base)) + verticalShift;
                    break;
                case 'trigonometric':
                    equationY = parsed.amplitude * Math[parsed.func](parsed.frequency * shiftedX + phase) + verticalShift;
                    break;
                case 'inverseTrigonometric':
                    // 检查定义域
                    const invShiftedX = shiftedX;
                    if ((parsed.func === 'arcsin' || parsed.func === 'arccos') && (invShiftedX < -1 || invShiftedX > 1)) {
                        return false;
                    }
                    const amp = parsed.amplitude || 1;
                    switch (parsed.func) {
                        case 'arcsin': equationY = amp * Math.asin(invShiftedX) + verticalShift; break;
                        case 'arccos': equationY = amp * Math.acos(invShiftedX) + verticalShift; break;
                        case 'arctan': equationY = amp * Math.atan(invShiftedX) + verticalShift; break;
                        default: equationY = verticalShift;
                    }
                    break;
                case 'hyperbolic':
                    const hypTransformedX = (parsed.frequency || 1) * shiftedX;
                    switch (parsed.func) {
                        case 'sinh': equationY = (parsed.amplitude || 1) * Math.sinh(hypTransformedX) + verticalShift; break;
                        case 'cosh': equationY = (parsed.amplitude || 1) * Math.cosh(hypTransformedX) + verticalShift; break;
                        case 'tanh': equationY = (parsed.amplitude || 1) * Math.tanh(hypTransformedX) + verticalShift; break;
                        default: equationY = verticalShift;
                    }
                    break;
                case 'rounding':
                    switch (parsed.func) {
                        case 'floor': equationY = (parsed.coefficient || 1) * Math.floor(shiftedX) + verticalShift; break;
                        case 'ceil': equationY = (parsed.coefficient || 1) * Math.ceil(shiftedX) + verticalShift; break;
                        case 'round': equationY = (parsed.coefficient || 1) * Math.round(shiftedX) + verticalShift; break;
                        default: equationY = verticalShift;
                    }
                    break;
                case 'absolute':
                    equationY = (parsed.coefficient || 1) * Math.abs(shiftedX) + verticalShift;
                    break;
                case 'special':
                    // 特殊函数使用预定义的func计算
                    if (parsed.func) {
                        equationY = parsed.func(shiftedX, parsed.coefficient || 1) + verticalShift;
                    } else {
                        equationY = this.evaluateEquation(shiftedX, parsed) + verticalShift;
                    }
                    break;
                default:
                    // 对于其他类型，使用通用表达式计算
                    equationY = this.evaluateEquation(shiftedX, parsed) + verticalShift;
            }
        } catch (error) {
            return false;
        }
        
        // 检查计算出的Y值是否有效
        if (!isFinite(equationY)) return false;
        
        // 检查鼠标位置是否在方程线条附近
        return Math.abs(y - equationY) < threshold;
    }
    
    /**
     * 通用方程求值
     * @param {number} x - X坐标
     * @param {Object} parsed - 解析后的方程
     * @returns {number} Y坐标
     */
    evaluateEquation(x, parsed) {
        if (parsed.expression) {
            // 使用简单的表达式求值
            const expr = parsed.expression
                .replace(/x/g, `(${x})`)
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/log/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/abs/g, 'Math.abs')
                .replace(/\^/g, '**');
            try {
                return eval(expr);
            } catch (e) {
                return NaN;
            }
        }
        return NaN;
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
            // 3D模式下显示X、Y、Z坐标（Z始终为0，因为2D方程绘制在Z=0平面上）
            coordDisplay.textContent = `X: ${mathPos.x.toFixed(2)}, Y: ${mathPos.y.toFixed(2)}, Z: 0.00`;
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
