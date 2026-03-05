/**
 * 区域填充模块
 * @module modules/areaFill
 */

import { mathToCanvas } from '../utils/mathUtils.js';

/**
 * 区域填充类
 */
export class AreaFill {
    constructor(ctx, state) {
        this.ctx = ctx;
        this.state = state;
    }

    /**
     * 填充积分区域
     * @param {Object} equation - 方程对象
     * @param {number} lowerBound - 下限
     * @param {number} upperBound - 上限
     * @param {string} fillColor - 填充颜色
     * @param {number} alpha - 透明度 (0-1)
     */
    fillIntegralArea(equation, lowerBound, upperBound, fillColor = '#4CAF50', alpha = 0.3) {
        const { scale, offsetX, offsetY } = this.state;
        const { parsed } = equation;

        // 计算填充区域的点
        const points = [];
        const step = 0.1;

        for (let x = lowerBound; x <= upperBound; x += step) {
            const y = this.calculateY(parsed, x);
            if (y !== null && isFinite(y)) {
                const canvasPoint = mathToCanvas(x, y, offsetX, offsetY, scale);
                points.push(canvasPoint);
            }
        }

        if (points.length < 2) return;

        // 创建填充路径
        this.ctx.beginPath();
        
        // 起点（下限处，y=0）
        const startPoint = mathToCanvas(lowerBound, 0, offsetX, offsetY, scale);
        this.ctx.moveTo(startPoint.x, startPoint.y);

        // 沿曲线上移
        points.forEach(point => {
            this.ctx.lineTo(point.x, point.y);
        });

        // 终点（上限处，y=0）
        const endPoint = mathToCanvas(upperBound, 0, offsetX, offsetY, scale);
        this.ctx.lineTo(endPoint.x, endPoint.y);

        this.ctx.closePath();

        // 设置填充样式
        const color = this.hexToRgba(fillColor, alpha);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // 绘制边界线
        this.ctx.strokeStyle = fillColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * 填充不等式区域
     * @param {Object} equation - 方程对象
     * @param {string} inequality - 不等式类型 ('>', '<', '>=', '<=')
     * @param {string} fillColor - 填充颜色
     * @param {number} alpha - 透明度
     */
    fillInequalityArea(equation, inequality = '>', fillColor = '#2196F3', alpha = 0.3) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;
        const { parsed } = equation;

        // 获取画布边界对应的数学坐标
        const xMin = (0 - offsetX) / scale;
        const xMax = (canvas.width - offsetX) / scale;
        const yMin = (offsetY - canvas.height) / scale;
        const yMax = offsetY / scale;

        // 创建填充路径
        this.ctx.beginPath();
        let isFirstPoint = true;

        // 采样点
        const step = 0.5;
        const fillPoints = [];

        for (let x = xMin; x <= xMax; x += step) {
            const curveY = this.calculateY(parsed, x);
            if (curveY === null || !isFinite(curveY)) continue;

            // 根据不等式确定填充范围
            let yStart, yEnd;
            switch (inequality) {
                case '>':
                case '>=':
                    yStart = curveY;
                    yEnd = yMax;
                    break;
                case '<':
                case '<=':
                    yStart = yMin;
                    yEnd = curveY;
                    break;
                default:
                    continue;
            }

            // 限制在画布范围内
            yStart = Math.max(yStart, yMin);
            yEnd = Math.min(yEnd, yMax);

            if (yStart < yEnd) {
                const topPoint = mathToCanvas(x, yEnd, offsetX, offsetY, scale);
                const bottomPoint = mathToCanvas(x, yStart, offsetX, offsetY, scale);
                
                fillPoints.push({
                    x: topPoint.x,
                    yTop: topPoint.y,
                    yBottom: bottomPoint.y
                });
            }
        }

        if (fillPoints.length < 2) return;

        // 绘制填充区域
        this.ctx.beginPath();
        
        // 上边界
        fillPoints.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.yTop);
            } else {
                this.ctx.lineTo(point.x, point.yTop);
            }
        });

        // 下边界（反向）
        for (let i = fillPoints.length - 1; i >= 0; i--) {
            this.ctx.lineTo(fillPoints[i].x, fillPoints[i].yBottom);
        }

        this.ctx.closePath();

        // 填充
        const color = this.hexToRgba(fillColor, alpha);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * 填充两条曲线之间的区域
     * @param {Object} equation1 - 第一条方程
     * @param {Object} equation2 - 第二条方程
     * @param {string} fillColor - 填充颜色
     * @param {number} alpha - 透明度
     */
    fillBetweenCurves(equation1, equation2, fillColor = '#FF9800', alpha = 0.3) {
        const { canvas } = this.ctx;
        const { scale, offsetX, offsetY } = this.state;

        // 获取画布边界
        const xMin = (0 - offsetX) / scale;
        const xMax = (canvas.width - offsetX) / scale;

        // 计算两条曲线的交点
        const intersections = this.findIntersections(equation1, equation2, xMin, xMax);
        
        // 添加边界点
        const segments = [xMin, ...intersections, xMax];

        // 在每个区间内填充
        for (let i = 0; i < segments.length - 1; i++) {
            const xStart = segments[i];
            const xEnd = segments[i + 1];
            
            this.fillCurveSegment(equation1, equation2, xStart, xEnd, fillColor, alpha);
        }
    }

    /**
     * 填充曲线段之间的区域
     * @param {Object} equation1 - 第一条方程
     * @param {Object} equation2 - 第二条方程
     * @param {number} xStart - 起始X
     * @param {number} xEnd - 结束X
     * @param {string} fillColor - 填充颜色
     * @param {number} alpha - 透明度
     */
    fillCurveSegment(equation1, equation2, xStart, xEnd, fillColor, alpha) {
        const { scale, offsetX, offsetY } = this.state;
        const step = 0.1;

        const points1 = [];
        const points2 = [];

        // 采样两条曲线
        for (let x = xStart; x <= xEnd; x += step) {
            const y1 = this.calculateY(equation1.parsed, x);
            const y2 = this.calculateY(equation2.parsed, x);

            if (y1 !== null && y2 !== null && isFinite(y1) && isFinite(y2)) {
                points1.push(mathToCanvas(x, y1, offsetX, offsetY, scale));
                points2.push(mathToCanvas(x, y2, offsetX, offsetY, scale));
            }
        }

        if (points1.length < 2 || points2.length < 2) return;

        // 创建填充路径
        this.ctx.beginPath();

        // 第一条曲线（上边界）
        points1.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });

        // 第二条曲线（下边界，反向）
        for (let i = points2.length - 1; i >= 0; i--) {
            this.ctx.lineTo(points2[i].x, points2[i].y);
        }

        this.ctx.closePath();

        // 填充
        const color = this.hexToRgba(fillColor, alpha);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * 查找两条曲线的交点
     * @param {Object} equation1 - 第一条方程
     * @param {Object} equation2 - 第二条方程
     * @param {number} xMin - 最小X
     * @param {number} xMax - 最大X
     * @returns {Array} 交点X坐标数组
     */
    findIntersections(equation1, equation2, xMin, xMax) {
        const intersections = [];
        const step = 0.01;
        let lastDiff = null;

        for (let x = xMin; x <= xMax; x += step) {
            const y1 = this.calculateY(equation1.parsed, x);
            const y2 = this.calculateY(equation2.parsed, x);

            if (y1 === null || y2 === null) continue;

            const diff = y1 - y2;

            // 检查符号变化（表示有交点）
            if (lastDiff !== null && Math.sign(diff) !== Math.sign(lastDiff)) {
                // 使用二分法精确定位交点
                const intersectionX = this.refineIntersection(
                    equation1.parsed, 
                    equation2.parsed, 
                    x - step, 
                    x
                );
                if (intersectionX !== null) {
                    intersections.push(intersectionX);
                }
            }

            lastDiff = diff;
        }

        return intersections;
    }

    /**
     * 精确化交点位置
     * @param {Object} parsed1 - 第一条方程解析结果
     * @param {Object} parsed2 - 第二条方程解析结果
     * @param {number} x1 - 左边界
     * @param {number} x2 - 右边界
     * @returns {number|null} 精确的交点X坐标
     */
    refineIntersection(parsed1, parsed2, x1, x2) {
        const tolerance = 0.0001;
        let left = x1;
        let right = x2;

        for (let i = 0; i < 20; i++) { // 最多迭代20次
            const mid = (left + right) / 2;
            const y1Left = this.calculateY(parsed1, left);
            const y2Left = this.calculateY(parsed2, left);
            const y1Mid = this.calculateY(parsed1, mid);
            const y2Mid = this.calculateY(parsed2, mid);

            if (y1Left === null || y2Left === null || y1Mid === null || y2Mid === null) {
                return null;
            }

            const diffLeft = y1Left - y2Left;
            const diffMid = y1Mid - y2Mid;

            if (Math.abs(diffMid) < tolerance) {
                return mid;
            }

            if (Math.sign(diffLeft) === Math.sign(diffMid)) {
                left = mid;
            } else {
                right = mid;
            }
        }

        return (left + right) / 2;
    }

    /**
     * 计算Y值
     * @param {Object} parsed - 解析后的方程
     * @param {number} x - X坐标
     * @returns {number|null} Y坐标
     */
    calculateY(parsed, x) {
        try {
            switch (parsed.type) {
                case 'linear':
                    return parsed.slope * x + parsed.intercept;
                case 'quadratic':
                    return parsed.a * x * x + parsed.b * x + parsed.c;
                case 'power':
                    return parsed.coefficient * Math.pow(x, parsed.power);
                case 'exponential':
                    return parsed.base === 'e' 
                        ? Math.exp(x) 
                        : Math.pow(parsed.base, x);
                case 'trigonometric':
                    const angle = parsed.frequency * x + parsed.phase;
                    switch (parsed.func) {
                        case 'sin': return parsed.amplitude * Math.sin(angle);
                        case 'cos': return parsed.amplitude * Math.cos(angle);
                        case 'tan': return parsed.amplitude * Math.tan(angle);
                        default: return 0;
                    }
                default:
                    // 尝试使用通用表达式
                    if (parsed.expression) {
                        return this.evaluateExpression(parsed.expression, x);
                    }
                    return null;
            }
        } catch (e) {
            return null;
        }
    }

    /**
     * 计算表达式
     * @param {string} expression - 表达式
     * @param {number} x - X值
     * @returns {number|null} 结果
     */
    evaluateExpression(expression, x) {
        try {
            // 简单的表达式求值（实际应该使用更安全的解析器）
            const sanitized = expression
                .replace(/x/g, `(${x})`)
                .replace(/\^/g, '**')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/pi/g, 'Math.PI')
                .replace(/e(?![a-z])/g, 'Math.E');

            return new Function('Math', `return ${sanitized}`)(Math);
        } catch (e) {
            return null;
        }
    }

    /**
     * 将十六进制颜色转换为RGBA
     * @param {string} hex - 十六进制颜色
     * @param {number} alpha - 透明度
     * @returns {string} RGBA颜色
     */
    hexToRgba(hex, alpha) {
        // 移除#号
        hex = hex.replace('#', '');

        // 处理简写形式
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 绘制填充图例
     * @param {string} label - 标签
     * @param {string} color - 颜色
     * @param {number} x - X位置
     * @param {number} y - Y位置
     */
    drawFillLegend(label, color, x, y) {
        // 绘制颜色块
        this.ctx.fillStyle = this.hexToRgba(color, 0.5);
        this.ctx.fillRect(x, y, 20, 12);

        // 绘制边框
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, 20, 12);

        // 绘制文字
        this.ctx.fillStyle = this.state.darkMode ? '#e0e0e0' : '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x + 25, y + 6);
    }
}

export default AreaFill;
