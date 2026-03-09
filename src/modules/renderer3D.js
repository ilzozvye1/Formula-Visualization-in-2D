/**
 * 3D渲染模块
 * @module modules/renderer3D
 */

import { project3DTo2D } from '../utils/mathUtils.js';
import { COLORS } from '../config/constants.js';

/**
 * 3D渲染器类
 */
export class Renderer3D {
    constructor(ctx, state) {
        this.ctx = ctx;
        this.state = state;
    }

    /**
     * 渲染3D场景
     */
    render3DScene() {
        const { canvas } = this.ctx;
        const { darkMode } = this.state;

        // 清空画布
        this.ctx.fillStyle = darkMode ? COLORS.backgroundDark : COLORS.background;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制3D坐标系
        this.draw3DAxes();

        // 绘制3D网格
        this.draw3DGrid();

        // 绘制方程
        this.state.equations.forEach((equation, index) => {
            if (equation.visible) {
                this.draw3DEquation(equation, index);
            }
        });

        // 绘制交点
        if (this.state.showIntersections) {
            this.drawIntersections3D();
        }
    }

    /**
     * 绘制3D坐标轴
     */
    draw3DAxes() {
        const { scale, offsetX, offsetY, rotationX, rotationY } = this.state;
        const axisLength = 10 * scale;

        // X轴 (红色)
        this.draw3DLine(0, 0, 0, axisLength, 0, 0, COLORS.axisX);

        // Y轴 (绿色)
        this.draw3DLine(0, 0, 0, 0, axisLength, 0, COLORS.axisY);

        // Z轴 (蓝色)
        this.draw3DLine(0, 0, 0, 0, 0, axisLength, COLORS.axisZ);

        // 绘制负轴
        this.draw3DLine(0, 0, 0, -axisLength, 0, 0, COLORS.axisX);
        this.draw3DLine(0, 0, 0, 0, -axisLength, 0, COLORS.axisY);
        this.draw3DLine(0, 0, 0, 0, 0, -axisLength, COLORS.axisZ);

        // 绘制坐标轴标签
        this.drawAxisLabels(axisLength);
    }

    /**
     * 绘制坐标轴标签
     * @param {number} axisLength - 坐标轴长度
     */
    drawAxisLabels(axisLength) {
        const { offsetX, offsetY, rotationX, rotationY, scale, fogEnabled, canvas } = this.state;
        const labelOffset = 0.3 * (axisLength / 10); // 减小标签偏移量，避免超出画布

        // 设置文本样式
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // X轴标签 (正方向)
        const xLabelPos = project3DTo2D(axisLength + labelOffset, 0, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(xLabelPos, canvas)) {
            this.ctx.fillStyle = COLORS.axisX;
            this.ctx.fillText('X', xLabelPos.x, xLabelPos.y);
        }

        // X轴标签 (负方向)
        const xNegLabelPos = project3DTo2D(-axisLength - labelOffset, 0, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(xNegLabelPos, canvas)) {
            this.ctx.fillText('-X', xNegLabelPos.x, xNegLabelPos.y);
        }

        // Y轴标签 (正方向)
        const yLabelPos = project3DTo2D(0, axisLength + labelOffset, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(yLabelPos, canvas)) {
            this.ctx.fillStyle = COLORS.axisY;
            this.ctx.fillText('Y', yLabelPos.x, yLabelPos.y);
        }

        // Y轴标签 (负方向)
        const yNegLabelPos = project3DTo2D(0, -axisLength - labelOffset, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(yNegLabelPos, canvas)) {
            this.ctx.fillText('-Y', yNegLabelPos.x, yNegLabelPos.y);
        }

        // Z轴标签 (正方向)
        const zLabelPos = project3DTo2D(0, 0, axisLength + labelOffset, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(zLabelPos, canvas)) {
            this.ctx.fillStyle = COLORS.axisZ;
            this.ctx.fillText('Z', zLabelPos.x, zLabelPos.y);
        }

        // Z轴标签 (负方向)
        const zNegLabelPos = project3DTo2D(0, 0, -axisLength - labelOffset, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
        if (this.isPointInCanvas(zNegLabelPos, canvas)) {
            this.ctx.fillText('-Z', zNegLabelPos.x, zNegLabelPos.y);
        }

        // 绘制刻度标签
        this.drawScaleLabels(axisLength);
    }
    
    /**
     * 检查点是否在画布内
     * @param {Object} point - 点坐标 {x, y}
     * @param {HTMLCanvasElement} canvas - 画布
     * @returns {boolean} 是否在画布内
     */
    isPointInCanvas(point, canvas) {
        const margin = 20; // 边距
        return point.x >= -margin && 
               point.x <= canvas.width + margin && 
               point.y >= -margin && 
               point.y <= canvas.height + margin;
    }

    /**
     * 绘制刻度标签
     * @param {number} axisLength - 坐标轴长度
     */
    drawScaleLabels(axisLength) {
        const { offsetX, offsetY, rotationX, rotationY, scale, fogEnabled, canvas } = this.state;
        const maxVal = Math.floor(axisLength / scale);

        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // X轴刻度
        this.ctx.fillStyle = COLORS.axisX;
        for (let i = -maxVal; i <= maxVal; i++) {
            if (i === 0) continue;
            const pos = project3DTo2D(i * scale, -0.3 * scale, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
            if (this.isPointInCanvas(pos, canvas)) {
                this.ctx.fillText(i.toString(), pos.x, pos.y);
            }
        }

        // Y轴刻度
        this.ctx.fillStyle = COLORS.axisY;
        for (let i = -maxVal; i <= maxVal; i++) {
            if (i === 0) continue;
            const pos = project3DTo2D(0.3 * scale, i * scale, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
            if (this.isPointInCanvas(pos, canvas)) {
                this.ctx.fillText(i.toString(), pos.x, pos.y);
            }
        }

        // Z轴刻度
        this.ctx.fillStyle = COLORS.axisZ;
        for (let i = -maxVal; i <= maxVal; i++) {
            if (i === 0) continue;
            const pos = project3DTo2D(0, -0.3 * scale, i * scale, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);
            if (this.isPointInCanvas(pos, canvas)) {
                this.ctx.fillText(i.toString(), pos.x, pos.y);
            }
        }
    }

    /**
     * 绘制3D网格
     */
    draw3DGrid() {
        const { darkMode, scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;
        const gridSize = 10;
        const step = scale;

        this.ctx.strokeStyle = darkMode ? COLORS.gridDark : COLORS.grid;
        this.ctx.lineWidth = 1;

        // XY平面网格
        for (let i = -gridSize; i <= gridSize; i++) {
            this.draw3DLine(i * step, -gridSize * step, 0, i * step, gridSize * step, 0, null, true);
            this.draw3DLine(-gridSize * step, i * step, 0, gridSize * step, i * step, 0, null, true);
        }
    }

    /**
     * 绘制3D方程
     * @param {Object} equation - 方程对象
     * @param {number} index - 方程索引
     */
    draw3DEquation(equation, index) {
        const { parsed, color, style } = equation;
        const isSelected = index === this.state.selectedEquationIndex;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = isSelected ? 4 : 2;

        // 设置线条样式
        if (style === 'dashed') {
            this.ctx.setLineDash([8, 4]);
        } else if (style === 'dotted') {
            this.ctx.setLineDash([2, 2]);
        } else {
            this.ctx.setLineDash([]);
        }

        // 选中方程发光效果
        if (isSelected) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
        }

        // 根据方程类型绘制
        if (parsed.type === '3dcurve') {
            this.draw3DCurve(parsed);
        } else if (parsed.type === '3dsurface') {
            this.draw3DSurface(parsed);
        } else {
            // 在3D模式下绘制2D方程（将Z设为0）
            this.draw2DEquationIn3D(parsed);
        }

        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]);
    }

    /**
     * 在 3D 模式下绘制 2D 方程
     * @param {Object} parsed - 解析后的方程
     */
    draw2DEquationIn3D(parsed) {
        const { scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;
        const { horizontalShift = 0, verticalShift = 0 } = parsed;

        this.ctx.beginPath();
        let isFirstPoint = true;

        // 采样范围
        const range = 10;
        const step = 0.1;

        for (let x = -range; x <= range; x += step) {
            // 应用水平位移
            const shiftedX = x - horizontalShift;
            let y;

            // 根据方程类型计算 Y 值
            try {
                switch (parsed.type) {
                    case 'linear':
                        y = parsed.slope * shiftedX + parsed.intercept;
                        break;
                    case 'quadratic':
                        y = parsed.a * shiftedX * shiftedX + parsed.b * shiftedX + parsed.c;
                        break;
                    case 'power':
                        y = parsed.coefficient * Math.pow(shiftedX, parsed.exponent);
                        break;
                    case 'exponential':
                        y = parsed.coefficient * Math.pow(parsed.base === 'e' ? Math.E : parsed.base, shiftedX);
                        break;
                    case 'logarithmic':
                        if (shiftedX <= 0) continue;
                        y = parsed.coefficient * (parsed.base === 'e' ? Math.log(shiftedX) : Math.log(shiftedX) / Math.log(parsed.base));
                        break;
                    case 'trigonometric':
                        y = parsed.amplitude * Math[parsed.func](parsed.frequency * shiftedX + parsed.phase);
                        break;
                    case 'inverseTrigonometric':
                        const invShiftedX = shiftedX;
                        if ((parsed.func === 'arcsin' || parsed.func === 'arccos') && (invShiftedX < -1 || invShiftedX > 1)) {
                            isFirstPoint = true;
                            continue;
                        }
                        const amplitude = parsed.amplitude || 1;
                        switch (parsed.func) {
                            case 'arcsin': y = amplitude * Math.asin(invShiftedX); break;
                            case 'arccos': y = amplitude * Math.acos(invShiftedX); break;
                            case 'arctan': y = amplitude * Math.atan(invShiftedX); break;
                            default: y = 0;
                        }
                        break;
                    case 'hyperbolic':
                        const hypTransformedX = (parsed.frequency || 1) * shiftedX;
                        const hypAmplitude = parsed.amplitude || 1;
                        switch (parsed.func) {
                            case 'sinh': y = hypAmplitude * Math.sinh(hypTransformedX); break;
                            case 'cosh': y = hypAmplitude * Math.cosh(hypTransformedX); break;
                            case 'tanh': y = hypAmplitude * Math.tanh(hypTransformedX); break;
                            default: y = 0;
                        }
                        break;
                    case 'rounding':
                        const roundAmplitude = parsed.coefficient || 1;
                        switch (parsed.func) {
                            case 'floor': y = roundAmplitude * Math.floor(shiftedX); break;
                            case 'ceil': y = roundAmplitude * Math.ceil(shiftedX); break;
                            case 'round': y = roundAmplitude * Math.round(shiftedX); break;
                            default: y = 0;
                        }
                        break;
                    case 'absolute':
                        y = (parsed.coefficient || 1) * Math.abs((parsed.frequency || 1) * shiftedX + (parsed.phase || 0));
                        break;
                    case 'special':
                        if (parsed.func && typeof parsed.func === 'function') {
                            y = parsed.func(shiftedX, parsed.coefficient || 1);
                        } else {
                            y = 0;
                        }
                        break;
                    default:
                        y = 0;
                }
            } catch (error) {
                isFirstPoint = true;
                continue;
            }

            // 应用垂直位移
            y += verticalShift;

            if (!isFinite(y)) {
                isFirstPoint = true;
                continue;
            }

            // 将 3D 坐标投影到 2D 画布（Z=0）
            const projected = project3DTo2D(x * scale, y * scale, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);

            if (isFirstPoint) {
                this.ctx.moveTo(projected.x, projected.y);
                isFirstPoint = false;
            } else {
                this.ctx.lineTo(projected.x, projected.y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 在3D模式下绘制交点
     */
    drawIntersections3D() {
        const { equations, showIntersections, intersectionColor } = this.state;

        if (!showIntersections) {
            return;
        }

        const visibleEquations = equations.filter(eq => eq.visible);
        if (visibleEquations.length === 0) {
            return;
        }

        // 计算所有交点（包括与坐标轴的交点）
        const intersections = this.calculateIntersections3D(visibleEquations);

        // 绘制交点
        const { scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;

        this.ctx.fillStyle = intersectionColor || '#ff0000';
        intersections.forEach(point => {
            // 将3D坐标投影到2D画布
            const projected = project3DTo2D(point.x * scale, point.y * scale, 0, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled);

            // 检查点是否在画布内
            if (!this.isPointInCanvas(projected, this.state.canvas)) {
                return;
            }

            // 绘制交点圆圈
            this.ctx.beginPath();
            this.ctx.arc(projected.x, projected.y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制交点坐标标签
            this.ctx.fillStyle = this.state.darkMode ? '#ffffff' : '#000000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                projected.x + 8,
                projected.y - 8
            );
            this.ctx.fillStyle = intersectionColor || '#ff0000';
        });
    }

    /**
     * 计算3D模式下的交点
     * @param {Array} equations - 可见方程数组
     * @returns {Array} 交点数组
     */
    calculateIntersections3D(equations) {
        const intersections = [];
        const range = 10; // 计算范围
        const step = 0.1; // 采样步长

        // 遍历所有方程对，计算方程之间的交点
        for (let i = 0; i < equations.length; i++) {
            for (let j = i + 1; j < equations.length; j++) {
                const eq1 = equations[i];
                const eq2 = equations[j];

                // 在范围内采样寻找交点
                for (let x = -range; x <= range; x += step) {
                    const y1 = this.getEquationY3D(x, eq1.parsed);
                    const y2 = this.getEquationY3D(x, eq2.parsed);

                    if (!isFinite(y1) || !isFinite(y2)) continue;

                    // 检查是否相交（Y值接近）
                    if (Math.abs(y1 - y2) < 0.1) {
                        // 找到交点，使用更精确的方法优化
                        const refinedPoint = this.refineIntersection3D(x, eq1.parsed, eq2.parsed);
                        if (refinedPoint && !this.isDuplicatePoint3D(refinedPoint, intersections)) {
                            intersections.push(refinedPoint);
                        }
                    }
                }
            }
        }

        // 计算方程与坐标轴的交点
        equations.forEach(equation => {
            const axisIntersections = this.calculateAxisIntersections3D(equation.parsed);
            axisIntersections.forEach(point => {
                if (!this.isDuplicatePoint3D(point, intersections)) {
                    intersections.push(point);
                }
            });
        });

        return intersections;
    }

    /**
     * 获取方程在指定 X 处的 Y 值（3D 模式）
     * @param {number} x - X 坐标
     * @param {Object} parsed - 解析后的方程
     * @returns {number} Y 坐标
     */
    getEquationY3D(x, parsed) {
        const { horizontalShift = 0, verticalShift = 0 } = parsed;
        const shiftedX = x - horizontalShift;

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
                    const invShiftedX = shiftedX;
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
                    const hypAmplitude = parsed.amplitude || 1;
                    switch (parsed.func) {
                        case 'sinh': return hypAmplitude * Math.sinh(hypTransformedX) + verticalShift;
                        case 'cosh': return hypAmplitude * Math.cosh(hypTransformedX) + verticalShift;
                        case 'tanh': return hypAmplitude * Math.tanh(hypTransformedX) + verticalShift;
                        default: return verticalShift;
                    }
                case 'rounding':
                    const roundAmplitude = parsed.coefficient || 1;
                    switch (parsed.func) {
                        case 'floor': return roundAmplitude * Math.floor(shiftedX) + verticalShift;
                        case 'ceil': return roundAmplitude * Math.ceil(shiftedX) + verticalShift;
                        case 'round': return roundAmplitude * Math.round(shiftedX) + verticalShift;
                        default: return verticalShift;
                    }
                case 'absolute':
                    return (parsed.coefficient || 1) * Math.abs((parsed.frequency || 1) * shiftedX + (parsed.phase || 0)) + verticalShift;
                case 'special':
                    if (parsed.func && typeof parsed.func === 'function') {
                        return parsed.func(shiftedX, parsed.coefficient || 1) + verticalShift;
                    }
                    return verticalShift;
                default:
                    return verticalShift;
            }
        } catch (error) {
            return NaN;
        }
    }

    /**
     * 优化3D交点位置
     * @param {number} x - 初始X坐标
     * @param {Object} parsed1 - 第一个方程
     * @param {Object} parsed2 - 第二个方程
     * @returns {Object|null} 优化后的交点
     */
    refineIntersection3D(x, parsed1, parsed2) {
        let left = x - 0.1;
        let right = x + 0.1;
        let bestX = x;
        let minDiff = Infinity;

        for (let iter = 0; iter < 10; iter++) {
            const mid = (left + right) / 2;
            const y1Left = this.getEquationY3D(left, parsed1);
            const y2Left = this.getEquationY3D(left, parsed2);
            const y1Mid = this.getEquationY3D(mid, parsed1);
            const y2Mid = this.getEquationY3D(mid, parsed2);

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

        const y = this.getEquationY3D(bestX, parsed1);
        if (!isFinite(y) || minDiff > 0.01) {
            return null;
        }

        return { x: bestX, y };
    }

    /**
     * 计算3D模式下方程与坐标轴的交点
     * @param {Object} parsed - 解析后的方程
     * @returns {Array} 交点数组
     */
    calculateAxisIntersections3D(parsed) {
        const intersections = [];

        // 计算与Y轴的交点（X=0）
        const yIntercept = this.getEquationY3D(0, parsed);
        if (isFinite(yIntercept)) {
            intersections.push({ x: 0, y: yIntercept, type: 'y-axis' });
        }

        // 计算与X轴的交点（Y=0）
        const range = 10;
        const step = 0.05;

        for (let x = -range; x <= range; x += step) {
            const y = this.getEquationY3D(x, parsed);
            const yNext = this.getEquationY3D(x + step, parsed);

            if (!isFinite(y) || !isFinite(yNext)) continue;

            // 检查是否跨越X轴（Y值变号）
            if (y * yNext < 0 || Math.abs(y) < 0.01) {
                // 使用二分法精确计算
                const xIntercept = this.refineXAxisIntersection3D(x, x + step, parsed);
                if (xIntercept !== null) {
                    intersections.push({ x: xIntercept, y: 0, type: 'x-axis' });
                }
            }
        }

        return intersections;
    }

    /**
     * 精确计算3D模式下与X轴的交点
     * @param {number} left - 左边界
     * @param {number} right - 右边界
     * @param {Object} parsed - 解析后的方程
     * @returns {number|null} X坐标
     */
    refineXAxisIntersection3D(left, right, parsed) {
        let bestX = null;
        let minAbsY = Infinity;

        for (let iter = 0; iter < 20; iter++) {
            const mid = (left + right) / 2;
            const yLeft = this.getEquationY3D(left, parsed);
            const yMid = this.getEquationY3D(mid, parsed);
            const yRight = this.getEquationY3D(right, parsed);

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
     * 检查3D点是否是重复点
     * @param {Object} point - 待检查的点
     * @param {Array} existingPoints - 已存在的点数组
     * @returns {boolean} 是否重复
     */
    isDuplicatePoint3D(point, existingPoints) {
        return existingPoints.some(p =>
            Math.abs(p.x - point.x) < 0.1 && Math.abs(p.y - point.y) < 0.1
        );
    }

    /**
     * 绘制3D曲线
     * @param {Object} parsed - 解析后的方程
     */
    draw3DCurve(parsed) {
        const { curveType, params } = parsed;
        const { scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;

        const points = this.calculate3DCurvePoints(curveType, params);
        
        // 按深度排序（画家算法）
        const projectedPoints = points.map(p => ({
            ...p,
            projected: project3DTo2D(p.x * scale, p.y * scale, p.z * scale, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled)
        }));

        // 绘制曲线
        this.ctx.beginPath();
        let isFirstPoint = true;

        for (const p of projectedPoints) {
            const { x, y, fogFactor } = p.projected;

            if (isFinite(x) && isFinite(y)) {
                // 应用雾化效果
                if (fogEnabled) {
                    const alpha = Math.floor(fogFactor * 255).toString(16).padStart(2, '0');
                    this.ctx.strokeStyle = this.ctx.strokeStyle.slice(0, 7) + alpha;
                }

                if (isFirstPoint) {
                    this.ctx.moveTo(x, y);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 计算3D曲线点
     * @param {string} curveType - 曲线类型
     * @param {Object} params - 曲线参数
     * @returns {Array} 点数组
     */
    calculate3DCurvePoints(curveType, params) {
        const points = [];
        const step = 0.02;
        const tRange = curveType === 'twisted-cubic' ? 6 : 4 * Math.PI;
        const tStart = curveType === 'twisted-cubic' ? -3 : 0;

        for (let t = tStart; t <= tStart + tRange; t += step) {
            const point = this.calculate3DCurvePoint(curveType, t, params);
            if (point && isFinite(point.x) && isFinite(point.y) && isFinite(point.z)) {
                points.push(point);
            }
        }

        return points;
    }

    /**
     * 计算单个3D曲线点
     * @param {string} curveType - 曲线类型
     * @param {number} t - 参数
     * @param {Object} params - 曲线参数
     * @returns {Object} 点坐标
     */
    calculate3DCurvePoint(curveType, t, params) {
        const { a = 5, b = 2, R = 5, r = 2, p = 2, q = 3, n = 3 } = params;

        switch (curveType) {
            case 'helix':
                return {
                    x: a * Math.cos(t),
                    y: a * Math.sin(t),
                    z: b * t
                };
            case 'trefoil':
                return {
                    x: a * (Math.sin(t) + 2 * Math.sin(2 * t)),
                    y: a * (Math.cos(t) - 2 * Math.cos(2 * t)),
                    z: -a * Math.sin(3 * t)
                };
            case 'torus':
                return {
                    x: (R + r * Math.cos(q * t)) * Math.cos(p * t),
                    y: (R + r * Math.cos(q * t)) * Math.sin(p * t),
                    z: r * Math.sin(q * t)
                };
            case 'lissajous':
                return {
                    x: a * Math.sin(params.nx * t),
                    y: params.b * Math.sin(params.ny * t),
                    z: params.c * Math.sin(params.nz * t)
                };
            case 'viviani':
                return {
                    x: a * (1 + Math.cos(t)),
                    y: a * Math.sin(t),
                    z: 2 * a * Math.sin(t / 2)
                };
            case 'spherical-spiral':
                return {
                    x: a * Math.cos(t) * Math.cos(params.b * t),
                    y: a * Math.sin(t) * Math.cos(params.b * t),
                    z: a * Math.sin(params.b * t)
                };
            case 'conical-spiral':
                return {
                    x: a * t * Math.cos(t),
                    y: a * t * Math.sin(t),
                    z: b * t
                };
            case 'rose':
                const radius = a * Math.cos(n * t);
                return {
                    x: radius * Math.cos(t),
                    y: radius * Math.sin(t),
                    z: params.k * t
                };
            case 'twisted-cubic':
                return {
                    x: t,
                    y: a * t * t,
                    z: a * a * t * t * t / 3
                };
            case 'sine-wave':
                return {
                    x: a * t,
                    y: b * Math.sin(params.c * t),
                    z: b * Math.cos(params.c * t)
                };
            case 'figure-eight':
                return {
                    x: a * (2 + Math.cos(2 * t)) * Math.cos(3 * t),
                    y: a * (2 + Math.cos(2 * t)) * Math.sin(3 * t),
                    z: a * Math.sin(4 * t)
                };
            case 'cinquefoil':
                return {
                    x: a * Math.cos(2 * t) * (3 + Math.cos(5 * t)),
                    y: a * Math.sin(2 * t) * (3 + Math.cos(5 * t)),
                    z: a * Math.sin(5 * t)
                };
            default:
                return null;
        }
    }

    /**
     * 绘制3D曲面
     * @param {Object} parsed - 解析后的方程
     */
    draw3DSurface(parsed) {
        const { surfaceType, params } = parsed;
        const { scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;

        // 获取曲面参数范围
        const { uRange, vRange, uStep, vStep } = this.getSurfaceRange(surfaceType);

        // 计算所有点
        const points = [];
        for (let u = uRange.min; u <= uRange.max; u += uStep) {
            for (let v = vRange.min; v <= vRange.max; v += vStep) {
                const point = this.calculate3DSurfacePoint(surfaceType, u, v, params);
                if (point) {
                    const projected = project3DTo2D(
                        point.x * scale, 
                        point.y * scale, 
                        point.z * scale, 
                        rotationX, rotationY, 
                        offsetX, offsetY, scale, 
                        fogEnabled
                    );
                    points.push({ ...point, projected, u, v });
                }
            }
        }

        // 按深度排序
        points.sort((a, b) => b.projected.z - a.projected.z);

        // 绘制网格线
        this.drawSurfaceGrid(points, uRange, vRange, uStep, vStep);
    }

    /**
     * 获取曲面参数范围
     * @param {string} surfaceType - 曲面类型
     * @returns {Object} 参数范围
     */
    getSurfaceRange(surfaceType) {
        switch (surfaceType) {
            case 'sphere':
            case 'torus-surf':
                return {
                    uRange: { min: 0, max: 2 * Math.PI },
                    vRange: { min: 0, max: 2 * Math.PI },
                    uStep: 0.15,
                    vStep: 0.15
                };
            case 'cone':
            case 'paraboloid':
                return {
                    uRange: { min: 0, max: 8 },
                    vRange: { min: 0, max: 2 * Math.PI },
                    uStep: 0.3,
                    vStep: 0.15
                };
            case 'hyperboloid':
                return {
                    uRange: { min: -2, max: 2 },
                    vRange: { min: 0, max: 2 * Math.PI },
                    uStep: 0.1,
                    vStep: 0.15
                };
            default:
                return {
                    uRange: { min: -8, max: 8 },
                    vRange: { min: -8, max: 8 },
                    uStep: 0.4,
                    vStep: 0.4
                };
        }
    }

    /**
     * 计算3D曲面点
     * @param {string} surfaceType - 曲面类型
     * @param {number} u - 参数u
     * @param {number} v - 参数v
     * @param {Object} params - 曲面参数
     * @returns {Object} 点坐标
     */
    calculate3DSurfacePoint(surfaceType, u, v, params) {
        const { a = 0.5, b = 0.3, c = 0, r = 5, R = 5 } = params;

        switch (surfaceType) {
            case 'plane':
                return { x: u, y: v, z: a * u + b * v + c };
            case 'sphere':
                return {
                    x: r * Math.sin(u) * Math.cos(v),
                    y: r * Math.sin(u) * Math.sin(v),
                    z: r * Math.cos(u)
                };
            case 'cone':
                return {
                    x: u * Math.cos(v),
                    y: u * Math.sin(v),
                    z: a * u
                };
            case 'paraboloid':
                return {
                    x: u * Math.cos(v),
                    y: u * Math.sin(v),
                    z: a * u * u
                };
            case 'hyperboloid':
                return {
                    x: a * Math.cosh(u) * Math.cos(v),
                    y: b * Math.cosh(u) * Math.sin(v),
                    z: c * Math.sinh(u)
                };
            case 'saddle':
                return { x: u, y: v, z: a * (u * u - v * v) };
            case 'wave':
                return { x: u, y: v, z: a * Math.sin(b * u) * Math.cos(params.c * v) };
            case 'torus-surf':
                return {
                    x: (R + r * Math.cos(v)) * Math.cos(u),
                    y: (R + r * Math.cos(v)) * Math.sin(u),
                    z: r * Math.sin(v)
                };
            case 'gaussian':
                return { x: u, y: v, z: a * Math.exp(-(u * u + v * v) / (b * b)) };
            case 'ripple':
                const dist = Math.sqrt(u * u + v * v);
                return { x: u, y: v, z: a * Math.sin(b * dist) };
            default:
                return null;
        }
    }

    /**
     * 绘制曲面网格
     * @param {Array} points - 点数组
     * @param {Object} uRange - u范围
     * @param {Object} vRange - v范围
     * @param {number} uStep - u步长
     * @param {number} vStep - v步长
     */
    drawSurfaceGrid(points, uRange, vRange, uStep, vStep) {
        // 绘制u线（经线）
        for (let u = uRange.min; u <= uRange.max; u += uStep * 2) {
            const linePoints = points.filter(p => Math.abs(p.u - u) < uStep / 2);
            this.drawSurfaceLine(linePoints);
        }

        // 绘制v线（纬线）
        for (let v = vRange.min; v <= vRange.max; v += vStep * 2) {
            const linePoints = points.filter(p => Math.abs(p.v - v) < vStep / 2);
            this.drawSurfaceLine(linePoints);
        }
    }

    /**
     * 绘制曲面线
     * @param {Array} points - 点数组
     */
    drawSurfaceLine(points) {
        if (points.length < 2) return;

        // 按v排序
        points.sort((a, b) => a.v - b.v);

        this.ctx.beginPath();
        let isFirstPoint = true;

        for (const p of points) {
            const { x, y, fogFactor } = p.projected;

            if (isFinite(x) && isFinite(y)) {
                // 应用雾化效果
                if (this.state.fogEnabled && fogFactor !== undefined) {
                    const color = this.ctx.strokeStyle;
                    const alpha = Math.floor(fogFactor * 255).toString(16).padStart(2, '0');
                    this.ctx.strokeStyle = color.slice(0, 7) + alpha;
                }

                if (isFirstPoint) {
                    this.ctx.moveTo(x, y);
                    isFirstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            } else {
                isFirstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    /**
     * 绘制3D线段
     * @param {number} x1 - 起点X
     * @param {number} y1 - 起点Y
     * @param {number} z1 - 起点Z
     * @param {number} x2 - 终点X
     * @param {number} y2 - 终点Y
     * @param {number} z2 - 终点Z
     * @param {string} color - 颜色
     * @param {boolean} useFog - 是否使用雾化
     */
    draw3DLine(x1, y1, z1, x2, y2, z2, color, useFog = false) {
        const { scale, offsetX, offsetY, rotationX, rotationY, fogEnabled } = this.state;

        const p1 = project3DTo2D(x1, y1, z1, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled && useFog);
        const p2 = project3DTo2D(x2, y2, z2, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled && useFog);

        if (!isFinite(p1.x) || !isFinite(p1.y) || !isFinite(p2.x) || !isFinite(p2.y)) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);

        if (color) {
            this.ctx.strokeStyle = color;
        }

        // 应用雾化
        if (fogEnabled && useFog && p1.fogFactor !== undefined) {
            const alpha = Math.floor(p1.fogFactor * 255).toString(16).padStart(2, '0');
            this.ctx.strokeStyle = this.ctx.strokeStyle.slice(0, 7) + alpha;
        }

        this.ctx.stroke();
    }
}

export default Renderer3D;
