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
            case 'absolute':
                this.drawAbsoluteEquation(parsed);
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
        const { slope, intercept } = parsed;

        // 计算两个端点
        const x1 = -offsetX / scale;
        const x2 = (canvas.width - offsetX) / scale;
        const y1 = slope * x1 + intercept;
        const y2 = slope * x2 + intercept;

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
        const { a, b, c } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const y = a * x * x + b * x + c;
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
        const { coefficient, power } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;

            // 处理定义域限制
            if (power < 0 && x === 0) continue;
            if (power % 1 !== 0 && x < 0) continue;

            const y = coefficient * Math.pow(x, power);
            const canvasY = offsetY - y * scale;

            if (isFinite(canvasY) && canvasY >= -1000 && canvasY <= canvas.height + 1000) {
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
     * 绘制指数函数
     * @param {Object} parsed - 解析后的方程
     */
    drawExponentialEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { base } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const y = base === 'e' ? Math.exp(x) : Math.pow(base, x);
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
        const { base } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;

            if (x <= 0) continue;

            let y;
            if (base === 'e') {
                y = Math.log(x);
            } else {
                y = Math.log(x) / Math.log(base);
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
        const { func, amplitude, frequency, phase } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const angle = frequency * x + phase;

            let y;
            switch (func) {
                case 'sin': y = amplitude * Math.sin(angle); break;
                case 'cos': y = amplitude * Math.cos(angle); break;
                case 'tan': y = amplitude * Math.tan(angle); break;
                case 'cot': y = amplitude / Math.tan(angle); break;
                case 'sec': y = amplitude / Math.cos(angle); break;
                case 'csc': y = amplitude / Math.sin(angle); break;
                default: y = 0;
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
        const { shift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const y = Math.abs(x - shift);
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
     * 绘制通用方程
     * @param {Object} parsed - 解析后的方程
     */
    drawGenericEquation(parsed) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (let canvasX = 0; canvasX <= canvas.width; canvasX += 2) {
            const x = (canvasX - offsetX) / scale;
            const y = this.calculateY(parsed, x);

            if (y !== null && isFinite(y)) {
                const canvasY = offsetY - y * scale;

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
            const expression = parsed.expression.replace(/x/g, `(${x})`);
            const result = eval(expression);
            return result;
        } catch (e) {
            return null;
        }
    }

    /**
     * 绘制交点
     */
    drawIntersections() {
        // TODO: 实现交点检测和绘制
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
