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
        }

        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]);
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
