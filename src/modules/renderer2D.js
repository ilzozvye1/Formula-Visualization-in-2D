/**
 * 2D渲染模块
 * @module modules/renderer2D
 */

import { mathToCanvas } from '../utils/mathUtils.js';
import { COLORS } from '../config/constants.js';

/**
 * 2D渲染器类
 */
export class Renderer2D {
    constructor(ctx, state) {
        this.ctx = ctx;
        this.state = state;
    }

    /**
     * 绘制坐标系
     */
    renderCoordinateSystem() {
        const { canvas } = this.ctx;
        const { darkMode, showGrid, scale, offsetX, offsetY } = this.state;

        // 清空画布
        this.ctx.fillStyle = darkMode ? COLORS.backgroundDark : COLORS.background;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        if (showGrid) {
            this.drawGrid();
        }

        // 绘制坐标轴
        this.drawAxes();

        // 绘制方程
        this.state.equations.forEach((equation, index) => {
            if (equation.visible) {
                this.drawEquation(equation, index);
            }
        });

        // 绘制交点
        if (this.state.showIntersections) {
            this.drawIntersections();
        }
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        const { darkMode, scale, offsetX, offsetY } = this.state;
        const { canvas } = this.ctx;

        this.ctx.strokeStyle = darkMode ? COLORS.gridDark : COLORS.grid;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);

        // 垂直网格线
        const startX = Math.floor((0 - offsetX) / scale);
        const endX = Math.floor((canvas.width - offsetX) / scale);

        for (let i = startX; i <= endX; i++) {
            if (i === 0) continue; // 跳过坐标轴
            const x = offsetX + i * scale;
            this.drawLine(x, 0, x, canvas.height);
        }

        // 水平网格线
        const startY = Math.floor((offsetY - canvas.height) / scale);
        const endY = Math.floor(offsetY / scale);

        for (let i = startY; i <= endY; i++) {
            if (i === 0) continue; // 跳过坐标轴
            const y = offsetY - i * scale;
            this.drawLine(0, y, canvas.width, y);
        }
    }

    /**
     * 绘制坐标轴
     */
    drawAxes() {
        const { scale, offsetX, offsetY } = this.state;
        const { canvas } = this.ctx;

        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);

        // X轴
        this.ctx.strokeStyle = COLORS.axisX;
        this.drawLine(0, offsetY, canvas.width, offsetY);

        // Y轴
        this.ctx.strokeStyle = COLORS.axisY;
        this.drawLine(offsetX, 0, offsetX, canvas.height);

        // 绘制刻度
        this.drawTicks();
    }

    /**
     * 绘制刻度
     */
    drawTicks() {
        const { darkMode, scale, offsetX, offsetY } = this.state;
        const { canvas } = this.ctx;

        this.ctx.fillStyle = darkMode ? COLORS.textDark : COLORS.text;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        // X轴刻度
        const startX = Math.floor((0 - offsetX) / scale);
        const endX = Math.floor((canvas.width - offsetX) / scale);

        for (let i = startX; i <= endX; i++) {
            if (i === 0) continue;
            const x = offsetX + i * scale;
            const y = offsetY;

            // 刻度线
            this.ctx.strokeStyle = darkMode ? COLORS.textDark : COLORS.text;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 5);
            this.ctx.lineTo(x, y + 5);
            this.ctx.stroke();

            // 刻度值
            this.ctx.fillText(i.toString(), x, y + 8);
        }

        // Y轴刻度
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        const startY = Math.floor((offsetY - canvas.height) / scale);
        const endY = Math.floor(offsetY / scale);

        for (let i = startY; i <= endY; i++) {
            if (i === 0) continue;
            const x = offsetX;
            const y = offsetY - i * scale;

            // 刻度线
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y);
            this.ctx.lineTo(x + 5, y);
            this.ctx.stroke();

            // 刻度值
            this.ctx.fillText(i.toString(), x - 8, y);
        }

        // 原点
        this.ctx.fillText('0', offsetX - 8, offsetY + 8);
    }

    /**
     * 绘制方程
     * @param {Object} equation - 方程对象
     * @param {number} index - 方程索引
     */
    drawEquation(equation, index) {
        const { parsed, color, style } = equation;
        const isSelected = index === this.state.selectedEquationIndex;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = isSelected ? 5 : 3;

        // 设置线条样式
        if (style === 'dashed') {
            this.ctx.setLineDash([10, 5]);
        } else if (style === 'dotted') {
            this.ctx.setLineDash([3, 3]);
        } else {
            this.ctx.setLineDash([]);
        }

        // 选中方程发光效果
        if (isSelected) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        }

        // 根据方程类型绘制
        switch (parsed.type) {
            case 'linear':
                this.drawLinearEquation(parsed);
                break;
            case 'quadratic':
                this.drawQuadraticEquation(parsed);
                break;
            case 'power':
                this.drawPowerEquation(parsed);
                break;
            case 'exponential':
                this.drawExponentialEquation(parsed);
                break;
            case 'logarithmic':
                this.drawLogarithmicEquation(parsed);
                break;
            case 'trigonometric':
                this.drawTrigonometricEquation(parsed);
                break;
            case 'inverseTrigonometric':
                this.drawInverseTrigonometricEquation(parsed);
                break;
            case 'hyperbolic':
                this.drawHyperbolicEquation(parsed);
                break;
            case 'rounding':
                this.drawRoundingEquation(parsed);
                break;
            case 'absolute':
                this.drawAbsoluteEquation(parsed);
                break;
            case 'special':
                this.drawSpecialEquation(parsed);
                break;
            default:
                this.drawGenericEquation(parsed);
        }

        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]);
    }

    /**
     * 绘制线性方程
     * @param {Object} parsed - 解析后的方程
     */
    drawLinearEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { slope, intercept, verticalShift = 0, horizontalShift = 0 } = parsed;

        // 计算两个端点（不考虑位移，位移在转换时应用）
        const x1 = -offsetX / scale;
        const x2 = (canvas.width - offsetX) / scale;
        const y1 = slope * (x1 - horizontalShift) + intercept + verticalShift;
        const y2 = slope * (x2 - horizontalShift) + intercept + verticalShift;

        const start = mathToCanvas(x1, y1, offsetX, offsetY, scale);
        const end = mathToCanvas(x2, y2, offsetX, offsetY, scale);

        this.drawLine(start.x, start.y, end.x, end.y);
    }

    /**
     * 绘制二次方程
     * @param {Object} parsed - 解析后的方程
     */
    drawQuadraticEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { a, b, c, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            // 原始X坐标（不考虑位移）
            const x = (canvasX - offsetX) / scale;
            // 应用水平位移后的X值用于计算Y
            const shiftedX = x - horizontalShift;
            const y = a * shiftedX * shiftedX + b * shiftedX + c + verticalShift;
            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY)) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制幂函数
     * @param {Object} parsed - 解析后的方程
     */
    drawPowerEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { coefficient, exponent, power, verticalShift = 0, horizontalShift = 0 } = parsed;

        // 兼容exponent和power两种属性名
        const actualExponent = exponent !== undefined ? exponent : power;

        // 对于负指数函数（如 1/x），需要分段绘制
        const isNegativeExponent = actualExponent < 0;
        const asymptoteX = horizontalShift; // 垂直渐近线位置

        // 如果是负指数，分成两段绘制（渐近线左侧和右侧）
        if (isNegativeExponent) {
            // 绘制渐近线右侧（x > asymptoteX）
            this.drawPowerEquationSegment(parsed, actualExponent, horizontalShift, verticalShift, asymptoteX + 0.001, canvas.width, scale, offsetX, offsetY);
            // 绘制渐近线左侧（x < asymptoteX）
            this.drawPowerEquationSegment(parsed, actualExponent, horizontalShift, verticalShift, 0, asymptoteX - 0.001, scale, offsetX, offsetY);
        } else {
            // 正常绘制
            this.drawPowerEquationSegment(parsed, actualExponent, horizontalShift, verticalShift, 0, canvas.width, scale, offsetX, offsetY);
        }
    }

    /**
     * 绘制幂函数的一段
     * @param {Object} parsed - 解析后的方程
     * @param {number} actualExponent - 实际指数
     * @param {number} actualPhase - 实际相位
     * @param {number} verticalShift - 垂直位移
     * @param {number} startX - 起始X坐标（canvas坐标）
     * @param {number} endX - 结束X坐标（canvas坐标）
     * @param {number} scale - 缩放比例
     * @param {number} offsetX - X轴偏移
     * @param {number} offsetY - Y轴偏移
     */
    drawPowerEquationSegment(parsed, actualExponent, actualPhase, verticalShift, startX, endX, scale, offsetX, offsetY) {
        const { canvas } = this.ctx;
        const { coefficient } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;
        let lastCanvasY = null;

        for (let canvasX = startX; canvasX <= endX; canvasX += 2) {
            // 原始X坐标
            const x = (canvasX - offsetX) / scale;
            // 应用水平位移后的X值用于计算Y
            const shiftedX = x - actualPhase;

            // 处理定义域限制
            if (actualExponent % 1 !== 0 && shiftedX < 0) continue;

            const y = coefficient * Math.pow(shiftedX, actualExponent) + verticalShift;
            const canvasY = offsetY - y * scale;

            // 检查 y 值是否有效
            if (!isFinite(canvasY) || Math.abs(y) > 10000) {
                isFirstPoint = true;
                lastCanvasY = null;
                continue;
            }

            // 检测 y 值的跳变（从正无穷到负无穷或反之）
            if (lastCanvasY !== null && Math.abs(canvasY - lastCanvasY) > canvas.height * 0.8) {
                isFirstPoint = true;
            }

            if (isFirstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }

            lastCanvasY = canvasY;
        }

        this.ctx.stroke();
    }

    /**
     * 绘制指数函数
     * @param {Object} parsed - 解析后的方程
     */
    drawExponentialEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { base, coefficient = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;
            const y = coefficient * (base === 'e' ? Math.exp(shiftedX) : Math.pow(base, shiftedX)) + verticalShift;
            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY)) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制对数函数
     * @param {Object} parsed - 解析后的方程
     */
    drawLogarithmicEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { base, coefficient = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;

            if (shiftedX <= 0) continue;

            let y;
            if (base === 'e') {
                y = coefficient * Math.log(shiftedX) + verticalShift;
            } else {
                y = coefficient * Math.log(shiftedX) / Math.log(base) + verticalShift;
            }

            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY)) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制三角函数
     * @param {Object} parsed - 解析后的方程
     */
    drawTrigonometricEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, amplitude, frequency, phase, verticalShift = 0, horizontalShift = 0 } = parsed;

        // 如果有渐近线，先绘制渐近线
        if (parsed.hasAsymptotes) {
            this.drawTrigonometricAsymptotes(parsed);
        }

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            // 原始 X 坐标（不考虑位移）
            const x = (canvasX - offsetX) / scale;
            // 应用水平位移后的 X 值用于计算 Y
            const shiftedX = x - horizontalShift;
            const angle = frequency * shiftedX + phase;

            let y;
            switch (func) {
                case 'sin': y = amplitude * Math.sin(angle) + verticalShift; break;
                case 'cos': y = amplitude * Math.cos(angle) + verticalShift; break;
                case 'tan': y = amplitude * Math.tan(angle) + verticalShift; break;
                case 'cot': y = amplitude / Math.tan(angle) + verticalShift; break;
                case 'sec': y = amplitude / Math.cos(angle) + verticalShift; break;
                case 'csc': y = amplitude / Math.sin(angle) + verticalShift; break;
                default: y = verticalShift;
            }

            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY) && Math.abs(canvasY - offsetY) < canvas.height * 2) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制三角函数的渐近线
     * @param {Object} parsed - 解析后的方程
     */
    drawTrigonometricAsymptotes(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, frequency, phase, horizontalShift = 0 } = parsed;

        // 计算渐近线位置
        const asymptotes = [];
        
        // 计算当前视图范围内的 X 坐标范围
        const xMin = -offsetX / scale;
        const xMax = (canvas.width - offsetX) / scale;
        
        // 根据函数类型计算渐近线
        if (func === 'tan' || func === 'sec') {
            // tan(x) 和 sec(x) 的渐近线在 x = π/2 + nπ
            const period = Math.PI / frequency;
            const baseAsymptote = (Math.PI / 2 - phase) / frequency;
            
            // 计算起始和结束的 n 值
            const nStart = Math.floor((xMin - baseAsymptote) / period) - 1;
            const nEnd = Math.ceil((xMax - baseAsymptote) / period) + 1;
            
            for (let n = nStart; n <= nEnd; n++) {
                const x = baseAsymptote + n * period;
                if (x >= xMin && x <= xMax) {
                    asymptotes.push(x);
                }
            }
        } else if (func === 'cot' || func === 'csc') {
            // cot(x) 和 csc(x) 的渐近线在 x = nπ
            const period = Math.PI / frequency;
            const baseAsymptote = -phase / frequency;
            
            const nStart = Math.floor((xMin - baseAsymptote) / period) - 1;
            const nEnd = Math.ceil((xMax - baseAsymptote) / period) + 1;
            
            for (let n = nStart; n <= nEnd; n++) {
                const x = baseAsymptote + n * period;
                if (x >= xMin && x <= xMax) {
                    asymptotes.push(x);
                }
            }
        }

        // 绘制渐近线
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        asymptotes.forEach(x => {
            const canvasX = offsetX + x * scale;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, canvas.height);
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }

    /**
     * 绘制反三角函数
     * @param {Object} parsed - 解析后的方程
     */
    drawInverseTrigonometricEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, amplitude = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        
        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;

            let y;
            switch (func) {
                case 'arcsin': 
                    if (shiftedX < -1 || shiftedX > 1) {
                        isFirstPoint = true;
                        continue;
                    }
                    y = amplitude * Math.asin(shiftedX) + verticalShift; 
                    break;
                case 'arccos': 
                    if (shiftedX < -1 || shiftedX > 1) {
                        isFirstPoint = true;
                        continue;
                    }
                    y = amplitude * Math.acos(shiftedX) + verticalShift; 
                    break;
                case 'arctan': 
                    y = amplitude * Math.atan(shiftedX) + verticalShift; 
                    break;
                default: 
                    y = verticalShift;
            }

            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY) && Math.abs(canvasY - offsetY) < canvas.height * 2) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制双曲函数
     * @param {Object} parsed - 解析后的方程
     */
    drawHyperbolicEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, amplitude = 1, frequency = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;
            const transformedX = frequency * shiftedX;

            let y;
            switch (func) {
                case 'sinh': y = amplitude * Math.sinh(transformedX) + verticalShift; break;
                case 'cosh': y = amplitude * Math.cosh(transformedX) + verticalShift; break;
                case 'tanh': y = amplitude * Math.tanh(transformedX) + verticalShift; break;
                default: y = verticalShift;
            }

            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY) && Math.abs(canvasY - offsetY) < canvas.height * 2) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制绝对值函数
     * @param {Object} parsed - 解析后的方程
     */
    drawAbsoluteEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { coefficient = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;
            const y = coefficient * Math.abs(shiftedX) + verticalShift;
            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY)) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制取整函数
     * @param {Object} parsed - 解析后的方程
     */
    drawRoundingEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, coefficient = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const shiftedX = x - horizontalShift;

            let y;
            switch (func) {
                case 'floor': y = coefficient * Math.floor(shiftedX) + verticalShift; break;
                case 'ceil': y = coefficient * Math.ceil(shiftedX) + verticalShift; break;
                case 'round': y = coefficient * Math.round(shiftedX) + verticalShift; break;
                default: y = verticalShift;
            }

            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY) && Math.abs(canvasY - offsetY) < canvas.height * 2) {
                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制特殊函数
     * @param {Object} parsed - 解析后的方程
     */
    drawSpecialEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { func, coefficient = 1, verticalShift = 0, horizontalShift = 0 } = parsed;

        if (!func) {
            // 如果没有提供func，使用通用绘制
            this.drawGenericEquation(parsed);
            return;
        }

        this.ctx.beginPath();
        let isFirstPoint = true;
        let lastCanvasY = null;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            // 原始X坐标
            const x = (canvasX - offsetX) / scale;
            // 应用水平位移后的X值用于计算Y
            const shiftedX = x - horizontalShift;

            // 计算Y值
            let y = func(shiftedX, coefficient) + verticalShift;

            // 检查y值是否有效
            if (!isFinite(y) || Math.abs(y) > 10000) {
                isFirstPoint = true;
                lastCanvasY = null;
                continue;
            }

            const canvasY = offsetY - y * scale;

            // 检测y值的跳变（避免在渐近线处连线）
            if (lastCanvasY !== null && Math.abs(canvasY - lastCanvasY) > canvas.height * 0.8) {
                isFirstPoint = true;
            }

            if (isFirstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }

            lastCanvasY = canvasY;
        }

        this.ctx.stroke();
    }

    /**
     * 绘制通用方程
     * @param {Object} parsed - 解析后的方程
     */
    drawGenericEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { verticalShift = 0, horizontalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            // 原始X坐标（不考虑位移）
            const x = (canvasX - offsetX) / scale;
            // 应用水平位移后的X值用于计算Y
            const shiftedX = x - horizontalShift;
            const y = this.calculateY(parsed, shiftedX);

            if (y !== null && isFinite(y)) {
                const canvasY = offsetY - (y + verticalShift) * scale;

                if (isFirstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 计算Y值
     * @param {Object} parsed - 解析后的方程
     * @param {number} x - X坐标
     * @returns {number|null} Y坐标
     */
    calculateY(parsed, x) {
        // 这里需要根据方程类型计算Y值
        // 简化版本，实际应该使用完整的计算逻辑
        try {
            // 使用eval计算（实际应该使用更安全的计算方式）
            let expression = parsed.expression || parsed.formula;
            if (expression) {
                // 移除 y= 前缀
                expression = expression.replace(/^y\s*=\s*/g, '');
                expression = expression.replace(/x/g, `(${x})`);
                const result = eval(expression);
                return result;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * 绘制交点
     */
    drawIntersections() {
        const { equations, showIntersections, intersectionColor } = this.state;
        
        if (!showIntersections) {
            return;
        }
        
        const visibleEquations = equations.filter(eq => eq.visible);
        if (visibleEquations.length === 0) {
            return;
        }
        
        // 计算所有方程之间的交点（包括与坐标轴的交点）
        const intersections = this.calculateIntersections(visibleEquations);
        
        // 绘制交点
        this.ctx.fillStyle = intersectionColor || '#ff0000';
        intersections.forEach(point => {
            const canvasPoint = mathToCanvas(point.x, point.y, this.state.offsetX, this.state.offsetY, this.state.scale);
            
            // 绘制交点圆圈
            this.ctx.beginPath();
            this.ctx.arc(canvasPoint.x, canvasPoint.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制交点坐标标签
            this.ctx.fillStyle = this.state.darkMode ? '#ffffff' : '#000000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                canvasPoint.x + 8,
                canvasPoint.y - 8
            );
            this.ctx.fillStyle = intersectionColor || '#ff0000';
        });
    }
    
    /**
     * 计算方程之间的交点
     * @param {Array} equations - 可见方程数组
     * @returns {Array} 交点数组
     */
    calculateIntersections(equations) {
        const intersections = [];
        const { scale } = this.state;
        const range = 20; // 计算范围
        const step = 0.1; // 采样步长
        
        // 遍历所有方程对
        for (let i = 0; i < equations.length; i++) {
            for (let j = i + 1; j < equations.length; j++) {
                const eq1 = equations[i];
                const eq2 = equations[j];
                
                // 在范围内采样寻找交点
                for (let x = -range; x <= range; x += step) {
                    const y1 = this.getEquationY(x, eq1.parsed);
                    const y2 = this.getEquationY(x, eq2.parsed);
                    
                    if (!isFinite(y1) || !isFinite(y2)) continue;
                    
                    // 检查是否相交（Y值接近）
                    if (Math.abs(y1 - y2) < 0.1) {
                        // 找到交点，使用更精确的方法优化
                        const refinedPoint = this.refineIntersection(x, eq1.parsed, eq2.parsed);
                        if (refinedPoint && !this.isDuplicatePoint(refinedPoint, intersections)) {
                            intersections.push(refinedPoint);
                        }
                    }
                }
            }
        }
        
        // 计算方程与坐标轴的交点
        equations.forEach(equation => {
            const axisIntersections = this.calculateAxisIntersections(equation.parsed);
            axisIntersections.forEach(point => {
                if (!this.isDuplicatePoint(point, intersections)) {
                    intersections.push(point);
                }
            });
        });
        
        return intersections;
    }
    
    /**
     * 计算方程与坐标轴的交点
     * @param {Object} parsed - 解析后的方程
     * @returns {Array} 交点数组
     */
    calculateAxisIntersections(parsed) {
        const intersections = [];
        const { horizontalShift = 0, verticalShift = 0 } = parsed;
        
        const yIntercept = this.getEquationY(0, parsed);
        if (isFinite(yIntercept)) {
            intersections.push({ x: 0, y: yIntercept, type: 'y-axis' });
        }
        
        const range = 20;
        const step = 0.05;
        
        let consecutiveZeroCount = 0;
        const maxConsecutiveZeros = 10;
        
        for (let x = -range; x <= range; x += step) {
            const y = this.getEquationY(x, parsed);
            const yNext = this.getEquationY(x + step, parsed);
            
            if (!isFinite(y) || !isFinite(yNext)) {
                consecutiveZeroCount = 0;
                continue;
            }
            
            if (Math.abs(y) < 0.01) {
                consecutiveZeroCount++;
                if (consecutiveZeroCount >= maxConsecutiveZeros) {
                    return intersections.filter(p => p.type !== 'x-axis');
                }
            } else {
                consecutiveZeroCount = 0;
            }
            
            if (y * yNext < 0 || Math.abs(y) < 0.01) {
                const xIntercept = this.refineXAxisIntersection(x, x + step, parsed);
                if (xIntercept !== null) {
                    if (!intersections.some(p => p.type === 'x-axis' && Math.abs(p.x - xIntercept) < 0.1)) {
                        intersections.push({ x: xIntercept, y: 0, type: 'x-axis' });
                    }
                }
            }
        }
        
        return intersections;
    }
    
    /**
     * 精确计算与X轴的交点
     * @param {number} left - 左边界
     * @param {number} right - 右边界
     * @param {Object} parsed - 解析后的方程
     * @returns {number|null} X坐标
     */
    refineXAxisIntersection(left, right, parsed) {
        let bestX = null;
        let minAbsY = Infinity;
        
        for (let iter = 0; iter < 20; iter++) {
            const mid = (left + right) / 2;
            const yLeft = this.getEquationY(left, parsed);
            const yMid = this.getEquationY(mid, parsed);
            const yRight = this.getEquationY(right, parsed);
            
            if (!isFinite(yLeft) || !isFinite(yMid) || !isFinite(yRight)) {
                return null;
            }
            
            // 记录最接近0的Y值
            if (Math.abs(yMid) < minAbsY) {
                minAbsY = Math.abs(yMid);
                bestX = mid;
            }
            
            // 二分法缩小范围
            if (yLeft * yMid < 0) {
                right = mid;
            } else if (yMid * yRight < 0) {
                left = mid;
            } else {
                break;
            }
        }
        
        // 只有当Y值足够接近0时才返回
        return minAbsY < 0.001 ? bestX : null;
    }
    
    /**
     * 获取方程在指定X处的Y值
     * @param {number} x - X坐标
     * @param {Object} parsed - 解析后的方程
     * @returns {number} Y坐标
     */
    getEquationY(x, parsed) {
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
        
        const shiftedX = x - actualHorizontalShift;
        
        try {
            switch (parsed.type) {
                case 'linear':
                    return parsed.slope * shiftedX + parsed.intercept + verticalShift;
                case 'quadratic':
                    return parsed.a * shiftedX * shiftedX + parsed.b * shiftedX + parsed.c + verticalShift;
                case 'power':
                    return parsed.coefficient * Math.pow(shiftedX, parsed.exponent) + verticalShift;
                case 'exponential':
                    return parsed.coefficient * Math.pow(parsed.base === 'e' ? Math.E : parsed.base, shiftedX) + verticalShift;
                case 'logarithmic':
                    if (shiftedX <= 0) return NaN;
                    return parsed.coefficient * (parsed.base === 'e' ? Math.log(shiftedX) : Math.log(shiftedX) / Math.log(parsed.base)) + verticalShift;
                case 'trigonometric':
                    return parsed.amplitude * Math[parsed.func](parsed.frequency * shiftedX + parsed.phase) + verticalShift;
                case 'inverseTrigonometric':
                    const invShiftedX = x - horizontalShift;
                    if ((parsed.func === 'arcsin' || parsed.func === 'arccos') && (invShiftedX < -1 || invShiftedX > 1)) {
                        return NaN;
                    }
                    const amplitude = parsed.amplitude || 1;
                    switch (parsed.func) {
                        case 'arcsin': return amplitude * Math.asin(invShiftedX) + verticalShift;
                        case 'arccos': return amplitude * Math.acos(invShiftedX) + verticalShift;
                        case 'arctan': return amplitude * Math.atan(invShiftedX) + verticalShift;
                        default: return verticalShift;
                    }
                case 'hyperbolic':
                    const hypTransformedX = (parsed.frequency || 1) * shiftedX;
                    switch (parsed.func) {
                        case 'sinh': return (parsed.amplitude || 1) * Math.sinh(hypTransformedX) + verticalShift;
                        case 'cosh': return (parsed.amplitude || 1) * Math.cosh(hypTransformedX) + verticalShift;
                        case 'tanh': return (parsed.amplitude || 1) * Math.tanh(hypTransformedX) + verticalShift;
                        default: return verticalShift;
                    }
                case 'rounding':
                    switch (parsed.func) {
                        case 'floor': return (parsed.coefficient || 1) * Math.floor(shiftedX) + verticalShift;
                        case 'ceil': return (parsed.coefficient || 1) * Math.ceil(shiftedX) + verticalShift;
                        case 'round': return (parsed.coefficient || 1) * Math.round(shiftedX) + verticalShift;
                        default: return verticalShift;
                    }
                case 'absolute':
                    return (parsed.coefficient || 1) * Math.abs(shiftedX) + verticalShift;
                case 'special':
                    // 特殊函数使用预定义的func计算
                    if (parsed.func) {
                        return parsed.func(shiftedX, parsed.coefficient || 1) + verticalShift;
                    }
                    return verticalShift;
                default:
                    return this.calculateY(parsed, shiftedX) + verticalShift;
            }
        } catch (error) {
            return NaN;
        }
    }
    
    /**
     * 优化交点位置
     * @param {number} x - 初始X坐标
     * @param {Object} parsed1 - 第一个方程
     * @param {Object} parsed2 - 第二个方程
     * @returns {Object|null} 优化后的交点
     */
    refineIntersection(x, parsed1, parsed2) {
        // 使用二分法优化交点位置
        let left = x - 0.1;
        let right = x + 0.1;
        let bestX = x;
        let minDiff = Infinity;
        
        for (let iter = 0; iter < 10; iter++) {
            const mid = (left + right) / 2;
            const y1Left = this.getEquationY(left, parsed1);
            const y2Left = this.getEquationY(left, parsed2);
            const y1Mid = this.getEquationY(mid, parsed1);
            const y2Mid = this.getEquationY(mid, parsed2);
            
            if (!isFinite(y1Left) || !isFinite(y2Left) || !isFinite(y1Mid) || !isFinite(y2Mid)) {
                return null;
            }
            
            const diffLeft = Math.abs(y1Left - y2Left);
            const diffMid = Math.abs(y1Mid - y2Mid);
            
            if (diffMid < minDiff) {
                minDiff = diffMid;
                bestX = mid;
            }
            
            if ((y1Left - y2Left) * (y1Mid - y2Mid) < 0) {
                right = mid;
            } else {
                left = mid;
            }
        }
        
        const y = this.getEquationY(bestX, parsed1);
        if (!isFinite(y) || minDiff > 0.01) {
            return null;
        }
        
        return { x: bestX, y };
    }
    
    /**
     * 检查点是否是重复点
     * @param {Object} point - 待检查的点
     * @param {Array} existingPoints - 已存在的点数组
     * @returns {boolean} 是否重复
     */
    isDuplicatePoint(point, existingPoints) {
        return existingPoints.some(p => 
            Math.abs(p.x - point.x) < 0.1 && Math.abs(p.y - point.y) < 0.1
        );
    }

    /**
     * 绘制直线
     * @param {number} x1 - 起点X
     * @param {number} y1 - 起点Y
     * @param {number} x2 - 终点X
     * @param {number} y2 - 终点Y
     */
    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
}

export default Renderer2D;
