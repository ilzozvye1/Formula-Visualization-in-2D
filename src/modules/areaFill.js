/**
 * 区域填充模块
 * 功能：
 * 1. 积分区域填充
 * 2. 不等式区域显示
 * 3. 自定义填充颜色
 * 4. 填充透明度控制
 * 5. 多区域交集/并集
 */

export class AreaFill {
    constructor(ctx) {
        this.ctx = ctx;
        this.fillRules = ['evenodd', 'nonzero'];
    }

    /**
     * 填充函数下方区域
     * @param {Function} fn - 函数 y = f(x)
     * @param {Object} bounds - 边界 {xMin, xMax, yMin, yMax}
     * @param {Object} options - 填充选项
     */
    fillBelowFunction(fn, bounds, options = {}) {
        const {
            fillColor = 'rgba(66, 153, 225, 0.3)',
            strokeColor = 'rgba(66, 153, 225, 0.8)',
            strokeWidth = 2,
            baseline = 0
        } = options;

        const { xMin, xMax } = bounds;
        const step = (xMax - xMin) / 500;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();

        // 起始点
        this.ctx.moveTo(xMin, baseline);

        // 绘制函数曲线
        for (let x = xMin; x <= xMax; x += step) {
            const y = fn(x);
            if (!isNaN(y) && isFinite(y)) {
                this.ctx.lineTo(x, y);
            }
        }

        // 闭合路径到基线
        this.ctx.lineTo(xMax, baseline);
        this.ctx.lineTo(xMin, baseline);
        this.ctx.closePath();

        // 填充
        this.ctx.fill();

        // 绘制边界线
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.beginPath();
            for (let x = xMin; x <= xMax; x += step) {
                const y = fn(x);
                if (!isNaN(y) && isFinite(y)) {
                    if (x === xMin) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }

    /**
     * 填充函数上方区域
     * @param {Function} fn - 函数 y = f(x)
     * @param {Object} bounds - 边界 {xMin, xMax, yMin, yMax}
     * @param {Object} options - 填充选项
     */
    fillAboveFunction(fn, bounds, options = {}) {
        const {
            fillColor = 'rgba(236, 112, 99, 0.3)',
            strokeColor = 'rgba(236, 112, 99, 0.8)',
            strokeWidth = 2,
            topBoundary = bounds.yMax
        } = options;

        const { xMin, xMax } = bounds;
        const step = (xMax - xMin) / 500;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();

        // 起始点（左上）
        this.ctx.moveTo(xMin, topBoundary);

        // 绘制函数曲线（从右到左）
        for (let x = xMax; x >= xMin; x -= step) {
            const y = fn(x);
            if (!isNaN(y) && isFinite(y)) {
                this.ctx.lineTo(x, y);
            }
        }

        // 闭合路径
        this.ctx.lineTo(xMin, topBoundary);
        this.ctx.closePath();

        this.ctx.fill();

        // 绘制边界线
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.beginPath();
            for (let x = xMin; x <= xMax; x += step) {
                const y = fn(x);
                if (!isNaN(y) && isFinite(y)) {
                    if (x === xMin) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }

    /**
     * 填充两个函数之间的区域
     * @param {Function} fn1 - 第一个函数
     * @param {Function} fn2 - 第二个函数
     * @param {Object} bounds - 边界
     * @param {Object} options - 填充选项
     */
    fillBetweenFunctions(fn1, fn2, bounds, options = {}) {
        const {
            fillColor = 'rgba(155, 89, 182, 0.3)',
            strokeWidth = 0
        } = options;

        const { xMin, xMax } = bounds;
        const step = (xMax - xMin) / 500;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();

        // 绘制第一个函数（从左到右）
        let first = true;
        for (let x = xMin; x <= xMax; x += step) {
            const y = fn1(x);
            if (!isNaN(y) && isFinite(y)) {
                if (first) {
                    this.ctx.moveTo(x, y);
                    first = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }

        // 绘制第二个函数（从右到左）
        for (let x = xMax; x >= xMin; x -= step) {
            const y = fn2(x);
            if (!isNaN(y) && isFinite(y)) {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 填充不等式区域
     * @param {Function} inequality - 不等式函数，返回布尔值
     * @param {Object} bounds - 边界
     * @param {Object} options - 填充选项
     */
    fillInequalityRegion(inequality, bounds, options = {}) {
        const {
            fillColor = 'rgba(46, 204, 113, 0.3)',
            resolution = 100
        } = options;

        const { xMin, xMax, yMin, yMax } = bounds;
        const xStep = (xMax - xMin) / resolution;
        const yStep = (yMax - yMin) / resolution;

        this.ctx.fillStyle = fillColor;

        for (let x = xMin; x < xMax; x += xStep) {
            for (let y = yMin; y < yMax; y += yStep) {
                if (inequality(x, y)) {
                    this.ctx.fillRect(x, y, xStep, yStep);
                }
            }
        }
    }

    /**
     * 填充积分区域（使用梯形法则可视化）
     * @param {Function} fn - 被积函数
     * @param {number} a - 积分下限
     * @param {number} b - 积分上限
     * @param {Object} options - 填充选项
     */
    fillIntegralRegion(fn, a, b, options = {}) {
        const {
            fillColor = 'rgba(241, 196, 15, 0.3)',
            strokeColor = 'rgba(241, 196, 15, 0.8)',
            n = 50, // 梯形数量
            showTrapezoids = true
        } = options;

        const h = (b - a) / n;

        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < n; i++) {
            const x0 = a + i * h;
            const x1 = x0 + h;
            const y0 = fn(x0);
            const y1 = fn(x1);

            if (!isNaN(y0) && !isNaN(y1) && isFinite(y0) && isFinite(y1)) {
                // 绘制梯形
                this.ctx.beginPath();
                this.ctx.moveTo(x0, 0);
                this.ctx.lineTo(x0, y0);
                this.ctx.lineTo(x1, y1);
                this.ctx.lineTo(x1, 0);
                this.ctx.closePath();
                this.ctx.fill();

                if (showTrapezoids) {
                    this.ctx.stroke();
                }
            }
        }

        // 绘制函数曲线
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const step = (b - a) / 200;
            for (let x = a; x <= b; x += step) {
                const y = fn(x);
                if (!isNaN(y) && isFinite(y)) {
                    if (x === a) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }

    /**
     * 填充极坐标区域
     * @param {Function} rFn - 极径函数 r = f(θ)
     * @param {number} thetaMin - 起始角度
     * @param {number} thetaMax - 结束角度
     * @param {Object} options - 填充选项
     */
    fillPolarRegion(rFn, thetaMin, thetaMax, options = {}) {
        const {
            fillColor = 'rgba(231, 76, 60, 0.3)',
            strokeColor = 'rgba(231, 76, 60, 0.8)',
            centerX = 0,
            centerY = 0
        } = options;

        const step = (thetaMax - thetaMin) / 200;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);

        for (let theta = thetaMin; theta <= thetaMax; theta += step) {
            const r = rFn(theta);
            if (!isNaN(r) && isFinite(r)) {
                const x = centerX + r * Math.cos(theta);
                const y = centerY + r * Math.sin(theta);
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fill();

        // 绘制边界
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            let first = true;
            for (let theta = thetaMin; theta <= thetaMax; theta += step) {
                const r = rFn(theta);
                if (!isNaN(r) && isFinite(r)) {
                    const x = centerX + r * Math.cos(theta);
                    const y = centerY + r * Math.sin(theta);
                    if (first) {
                        this.ctx.moveTo(x, y);
                        first = false;
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }

    /**
     * 填充参数方程区域
     * @param {Function} xFn - x = f(t)
     * @param {Function} yFn - y = g(t)
     * @param {number} tMin - 参数起始值
     * @param {number} tMax - 参数结束值
     * @param {Object} options - 填充选项
     */
    fillParametricRegion(xFn, yFn, tMin, tMax, options = {}) {
        const {
            fillColor = 'rgba(52, 152, 219, 0.3)',
            strokeColor = 'rgba(52, 152, 219, 0.8)',
            fillRule = 'evenodd'
        } = options;

        const step = (tMax - tMin) / 500;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();

        let first = true;
        for (let t = tMin; t <= tMax; t += step) {
            const x = xFn(t);
            const y = yFn(t);
            if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
                if (first) {
                    this.ctx.moveTo(x, y);
                    first = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }

        this.ctx.closePath();
        this.ctx.fill(fillRule);

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    /**
     * 创建渐变填充
     * @param {Function} fn - 函数
     * @param {Object} bounds - 边界
     * @param {Object} options - 渐变选项
     */
    fillWithGradient(fn, bounds, options = {}) {
        const {
            gradientColors = ['rgba(66, 153, 225, 0.1)', 'rgba(66, 153, 225, 0.6)'],
            gradientDirection = 'vertical' // 'vertical' 或 'horizontal'
        } = options;

        const { xMin, xMax, yMin, yMax } = bounds;

        let gradient;
        if (gradientDirection === 'vertical') {
            gradient = this.ctx.createLinearGradient(0, yMin, 0, yMax);
        } else {
            gradient = this.ctx.createLinearGradient(xMin, 0, xMax, 0);
        }

        gradientColors.forEach((color, index) => {
            gradient.addColorStop(index / (gradientColors.length - 1), color);
        });

        const step = (xMax - xMin) / 500;

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(xMin, yMin);

        for (let x = xMin; x <= xMax; x += step) {
            const y = fn(x);
            if (!isNaN(y) && isFinite(y)) {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.lineTo(xMax, yMin);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 填充带纹理的区域
     * @param {Function} fn - 函数
     * @param {Object} bounds - 边界
     * @param {Object} options - 纹理选项
     */
    fillWithPattern(fn, bounds, options = {}) {
        const {
            patternType = 'stripes', // 'stripes', 'dots', 'grid'
            patternColor = 'rgba(66, 153, 225, 0.5)',
            patternSize = 10
        } = options;

        // 创建离屏canvas用于图案
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = patternSize * 2;
        patternCanvas.height = patternSize * 2;
        const pctx = patternCanvas.getContext('2d');

        pctx.strokeStyle = patternColor;
        pctx.lineWidth = 1;

        if (patternType === 'stripes') {
            pctx.beginPath();
            pctx.moveTo(0, patternSize);
            pctx.lineTo(patternSize, 0);
            pctx.moveTo(0, patternSize * 2);
            pctx.lineTo(patternSize * 2, 0);
            pctx.moveTo(patternSize, patternSize * 2);
            pctx.lineTo(patternSize * 2, patternSize);
            pctx.stroke();
        } else if (patternType === 'dots') {
            pctx.fillStyle = patternColor;
            pctx.beginPath();
            pctx.arc(patternSize / 2, patternSize / 2, 2, 0, Math.PI * 2);
            pctx.arc(patternSize * 1.5, patternSize * 1.5, 2, 0, Math.PI * 2);
            pctx.fill();
        } else if (patternType === 'grid') {
            pctx.beginPath();
            pctx.moveTo(patternSize, 0);
            pctx.lineTo(patternSize, patternSize * 2);
            pctx.moveTo(0, patternSize);
            pctx.lineTo(patternSize * 2, patternSize);
            pctx.stroke();
        }

        const pattern = this.ctx.createPattern(patternCanvas, 'repeat');

        const { xMin, xMax } = bounds;
        const step = (xMax - xMin) / 500;

        this.ctx.fillStyle = pattern;
        this.ctx.beginPath();
        this.ctx.moveTo(xMin, 0);

        for (let x = xMin; x <= xMax; x += step) {
            const y = fn(x);
            if (!isNaN(y) && isFinite(y)) {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.lineTo(xMax, 0);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 计算区域面积（数值积分）
     * @param {Function} fn - 函数
     * @param {number} a - 下限
     * @param {number} b - 上限
     * @param {number} n - 分割数
     * @returns {number} 面积
     */
    calculateArea(fn, a, b, n = 1000) {
        const h = (b - a) / n;
        let area = 0;

        for (let i = 0; i < n; i++) {
            const x0 = a + i * h;
            const x1 = x0 + h;
            const y0 = fn(x0);
            const y1 = fn(x1);

            if (!isNaN(y0) && !isNaN(y1) && isFinite(y0) && isFinite(y1)) {
                // 梯形法则
                area += (y0 + y1) * h / 2;
            }
        }

        return area;
    }

    /**
     * 高亮显示交点区域
     * @param {Array} intersections - 交点数组 [{x, y}]
     * @param {Object} options - 高亮选项
     */
    highlightIntersections(intersections, options = {}) {
        const {
            highlightColor = 'rgba(255, 235, 59, 0.5)',
            radius = 8,
            showCoordinates = true
        } = options;

        this.ctx.fillStyle = highlightColor;

        intersections.forEach(point => {
            // 绘制高亮圆
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制坐标
            if (showCoordinates) {
                this.ctx.fillStyle = '#333';
                this.ctx.font = '12px sans-serif';
                this.ctx.fillText(
                    `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                    point.x + radius + 5,
                    point.y - radius - 5
                );
                this.ctx.fillStyle = highlightColor;
            }
        });
    }

    /**
     * 填充多边形区域
     * @param {Array} vertices - 顶点数组 [{x, y}, ...]
     * @param {Object} options - 填充选项
     */
    fillPolygon(vertices, options = {}) {
        const {
            fillColor = 'rgba(149, 165, 166, 0.3)',
            strokeColor = 'rgba(149, 165, 166, 0.8)',
            strokeWidth = 2
        } = options;

        if (vertices.length < 3) return;

        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        this.ctx.closePath();
        this.ctx.fill();

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }
    }

    /**
     * 创建填充区域对象（用于保存和恢复）
     * @param {string} type - 填充类型
     * @param {Object} params - 填充参数
     * @returns {Object} 填充区域对象
     */
    createFillRegion(type, params) {
        return {
            id: 'fill_' + Date.now(),
            type: type,
            params: params,
            visible: true,
            createdAt: new Date().toISOString()
        };
    }
}

export default AreaFill;
