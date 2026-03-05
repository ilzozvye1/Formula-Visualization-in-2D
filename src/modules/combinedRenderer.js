/**
 * 组合方程渲染模块
 * 功能：
 * 1. 渲染布尔运算后的方程
 * 2. 渲染隐函数
 * 3. 渲染不等式区域
 * 4. 渲染方程组交点
 */

import { COLORS } from '../config/constants.js';

export class CombinedRenderer {
    constructor(ctx, state) {
        this.ctx = ctx;
        this.state = state;
        this.resolution = 200;
    }

    /**
     * 绘制组合方程
     * @param {Object} equation - 组合方程对象
     * @param {number} index - 方程索引
     */
    drawCombinedEquation(equation, index) {
        const { operation, evaluator, bounds } = equation;
        const color = equation.color || COLORS.equations[index % COLORS.equations.length];

        const canvasBounds = this.getCanvasBounds(bounds);
        const stepX = (canvasBounds.xMax - canvasBounds.xMin) / this.resolution;
        const stepY = (canvasBounds.yMax - canvasBounds.yMin) / this.resolution;

        const imageData = this.ctx.createImageData(this.resolution, this.resolution);
        const data = imageData.data;

        for (let i = 0; i < this.resolution; i++) {
            for (let j = 0; j < this.resolution; j++) {
                const x = canvasBounds.xMin + i * stepX;
                const y = canvasBounds.yMin + j * stepY;

                const value = evaluator(x, y, 0);
                const pixelIndex = (j * this.resolution + i) * 4;

                if (Math.abs(value) < 0.1) {
                    const [r, g, b] = this.hexToRgb(color);
                    data[pixelIndex] = r;
                    data[pixelIndex + 1] = g;
                    data[pixelIndex + 2] = b;
                    data[pixelIndex + 3] = 255;
                } else {
                    data[pixelIndex + 3] = 0;
                }
            }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.resolution;
        tempCanvas.height = this.resolution;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        const screenBounds = this.mathToScreen(canvasBounds);
        this.ctx.drawImage(
            tempCanvas,
            screenBounds.xMin,
            screenBounds.yMin,
            screenBounds.xMax - screenBounds.xMin,
            screenBounds.yMax - screenBounds.yMin
        );
    }

    /**
     * 绘制隐函数
     * @param {Object} equation - 隐函数方程对象
     * @param {number} index - 方程索引
     */
    drawImplicitFunction(equation, index) {
        const { expression, bounds, evaluator } = equation;
        const color = equation.color || COLORS.equations[index % COLORS.equations.length];

        const canvasBounds = this.getCanvasBounds(bounds);
        const resolution = equation.resolution || 100;
        const stepX = (canvasBounds.xMax - canvasBounds.xMin) / resolution;
        const stepY = (canvasBounds.yMax - canvasBounds.yMin) / resolution;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const grid = [];
        for (let i = 0; i <= resolution; i++) {
            grid[i] = [];
            for (let j = 0; j <= resolution; j++) {
                const x = canvasBounds.xMin + i * stepX;
                const y = canvasBounds.yMin + j * stepY;
                grid[i][j] = evaluator(x, y);
            }
        }

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const v1 = grid[i][j];
                const v2 = grid[i + 1][j];
                const v3 = grid[i][j + 1];
                const v4 = grid[i + 1][j + 1];

                if (this.hasZeroCrossing(v1, v2, v3, v4)) {
                    const x = canvasBounds.xMin + (i + 0.5) * stepX;
                    const y = canvasBounds.yMin + (j + 0.5) * stepY;
                    const screenPos = this.mathToScreen({ x, y });

                    if (i === 0 && j === 0) {
                        this.ctx.moveTo(screenPos.x, screenPos.y);
                    } else {
                        this.ctx.lineTo(screenPos.x, screenPos.y);
                    }
                }
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制不等式区域
     * @param {Object} equation - 不等式方程对象
     * @param {number} index - 方程索引
     */
    drawInequalityRegion(equation, index) {
        const { expression, bounds, evaluator, fillColor, borderColor } = equation;

        const canvasBounds = this.getCanvasBounds(bounds);
        const resolution = 100;
        const stepX = (canvasBounds.xMax - canvasBounds.xMin) / resolution;
        const stepY = (canvasBounds.yMax - canvasBounds.yMin) / resolution;

        this.ctx.fillStyle = fillColor || 'rgba(66, 153, 225, 0.3)';

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = canvasBounds.xMin + i * stepX;
                const y = canvasBounds.yMin + j * stepY;

                if (evaluator(x, y)) {
                    const screenPos1 = this.mathToScreen({ x, y });
                    const screenPos2 = this.mathToScreen({
                        x: x + stepX,
                        y: y + stepY
                    });

                    this.ctx.fillRect(
                        screenPos1.x,
                        screenPos2.y,
                        screenPos2.x - screenPos1.x,
                        screenPos1.y - screenPos2.y
                    );
                }
            }
        }

        if (borderColor) {
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    /**
     * 绘制方程组交点
     * @param {Array} intersections - 交点数组
     */
    drawIntersections(intersections) {
        if (!intersections || intersections.length === 0) return;

        this.ctx.fillStyle = COLORS.intersection;

        intersections.forEach(point => {
            const screenPos = this.mathToScreen(point);

            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = COLORS.text;
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(
                `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                screenPos.x + 10,
                screenPos.y - 10
            );
        });
    }

    /**
     * 绘制方程边界框
     * @param {Object} bounds - 边界对象
     * @param {string} color - 颜色
     */
    drawBounds(bounds, color = COLORS.grid) {
        const screenBounds = this.mathToScreen({
            x: bounds.xMin,
            y: bounds.yMax
        });
        const screenBounds2 = this.mathToScreen({
            x: bounds.xMax,
            y: bounds.yMin
        });

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            screenBounds.x,
            screenBounds.y,
            screenBounds2.x - screenBounds.x,
            screenBounds2.y - screenBounds.y
        );
        this.ctx.setLineDash([]);
    }

    /**
     * 数学坐标转屏幕坐标
     * @param {Object} point - 数学坐标点
     * @returns {Object} 屏幕坐标点
     */
    mathToScreen(point) {
        const { scale, offsetX, offsetY } = this.state;

        return {
            x: offsetX + point.x * scale,
            y: offsetY - point.y * scale
        };
    }

    /**
     * 屏幕坐标转数学坐标
     * @param {Object} point - 屏幕坐标点
     * @returns {Object} 数学坐标点
     */
    screenToMath(point) {
        const { scale, offsetX, offsetY } = this.state;

        return {
            x: (point.x - offsetX) / scale,
            y: (offsetY - point.y) / scale
        };
    }

    /**
     * 获取画布边界
     * @param {Object} bounds - 数学边界
     * @returns {Object} 画布边界
     */
    getCanvasBounds(bounds) {
        const { canvas } = this.ctx;
        const visibleBounds = this.getVisibleBounds();

        return {
            xMin: Math.max(bounds.xMin, visibleBounds.xMin),
            xMax: Math.min(bounds.xMax, visibleBounds.xMax),
            yMin: Math.max(bounds.yMin, visibleBounds.yMin),
            yMax: Math.min(bounds.yMax, visibleBounds.yMax)
        };
    }

    /**
     * 获取可见区域边界
     * @returns {Object} 可见区域边界
     */
    getVisibleBounds() {
        const { canvas } = this.ctx;
        const topLeft = this.screenToMath({ x: 0, y: 0 });
        const bottomRight = this.screenToMath({ x: canvas.width, y: canvas.height });

        return {
            xMin: topLeft.x,
            xMax: bottomRight.x,
            yMin: bottomRight.y,
            yMax: topLeft.y
        };
    }

    /**
     * 检查是否有零交叉
     * @param {...number} values - 单元格四个角的值
     * @returns {boolean} 是否有零交叉
     */
    hasZeroCrossing(...values) {
        const validValues = values.filter(v => !isNaN(v));
        if (validValues.length < 4) return false;

        const hasPositive = validValues.some(v => v > 0);
        const hasNegative = validValues.some(v => v < 0);

        return hasPositive && hasNegative;
    }

    /**
     * 十六进制颜色转RGB
     * @param {string} hex - 十六进制颜色
     * @returns {Array} RGB数组
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    /**
     * 设置渲染分辨率
     * @param {number} resolution - 分辨率
     */
    setResolution(resolution) {
        this.resolution = Math.max(50, Math.min(500, resolution));
    }
}

export default CombinedRenderer;
