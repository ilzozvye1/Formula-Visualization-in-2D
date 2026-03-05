/**
 * 方程组合运算模块
 * 功能：
 * 1. 方程布尔运算（交、并、差）
 * 2. 方程组求解可视化
 * 3. 隐函数绘制
 */

import { EquationParser } from './equationParser.js';

export class EquationCombiner {
    constructor() {
        this.parser = new EquationParser();
        this.epsilon = 1e-6;
    }

    /**
     * 组合两个方程
     * @param {Object} eq1 - 第一个方程
     * @param {Object} eq2 - 第二个方程
     * @param {string} operation - 操作类型: 'union', 'intersection', 'difference', 'xor'
     * @returns {Object} 组合后的方程对象
     */
    combine(eq1, eq2, operation) {
        const func1 = this.createEvaluator(eq1);
        const func2 = this.createEvaluator(eq2);

        return {
            type: 'combined',
            operation: operation,
            equations: [eq1, eq2],
            evaluator: (x, y, z = 0) => {
                const val1 = func1(x, y, z);
                const val2 = func2(x, y, z);
                return this.applyOperation(val1, val2, operation);
            },
            bounds: this.mergeBounds(eq1.bounds, eq2.bounds)
        };
    }

    /**
     * 创建方程求值函数
     * @param {Object} equation - 方程对象
     * @returns {Function} 求值函数
     */
    createEvaluator(equation) {
        const { type, expression, variable } = equation;

        switch (type) {
            case 'cartesian':
                return (x, y, z) => {
                    try {
                        const scope = { x, y, z, t: 0 };
                        return this.parser.evaluate(expression, scope);
                    } catch (e) {
                        return NaN;
                    }
                };

            case 'implicit':
                return (x, y, z) => {
                    try {
                        const scope = { x, y, z, t: 0 };
                        return this.parser.evaluate(expression, scope);
                    } catch (e) {
                        return NaN;
                    }
                };

            case 'inequality':
                return (x, y, z) => {
                    try {
                        const scope = { x, y, z, t: 0 };
                        const result = this.parser.evaluate(expression, scope);
                        return result ? 1 : -1;
                    } catch (e) {
                        return NaN;
                    }
                };

            case 'parametric':
                return (x, y, z) => {
                    try {
                        const scope = { t: x };
                        const px = this.parser.evaluate(equation.xExpression, scope);
                        const py = this.parser.evaluate(equation.yExpression, scope);
                        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
                        return distance;
                    } catch (e) {
                        return NaN;
                    }
                };

            default:
                return () => NaN;
        }
    }

    /**
     * 应用布尔运算
     * @param {number} val1 - 第一个值
     * @param {number} val2 - 第二个值
     * @param {string} operation - 操作类型
     * @returns {number} 运算结果
     */
    applyOperation(val1, val2, operation) {
        const in1 = !isNaN(val1) && Math.abs(val1) < this.epsilon;
        const in2 = !isNaN(val2) && Math.abs(val2) < this.epsilon;

        switch (operation) {
            case 'union':
            case 'OR':
                return (in1 || in2) ? 0 : Math.min(Math.abs(val1), Math.abs(val2));

            case 'intersection':
            case 'AND':
                return (in1 && in2) ? 0 : Math.max(Math.abs(val1), Math.abs(val2));

            case 'difference':
            case 'SUBTRACT':
                return (in1 && !in2) ? 0 : (in1 ? val2 : Math.abs(val1));

            case 'xor':
            case 'XOR':
                return (in1 !== in2) ? 0 : Math.max(Math.abs(val1), Math.abs(val2));

            default:
                return NaN;
        }
    }

    /**
     * 合并边界
     * @param {Object} bounds1 - 第一个边界
     * @param {Object} bounds2 - 第二个边界
     * @returns {Object} 合并后的边界
     */
    mergeBounds(bounds1, bounds2) {
        if (!bounds1) return bounds2;
        if (!bounds2) return bounds1;

        return {
            xMin: Math.min(bounds1.xMin || -10, bounds2.xMin || -10),
            xMax: Math.max(bounds1.xMax || 10, bounds2.xMax || 10),
            yMin: Math.min(bounds1.yMin || -10, bounds2.yMin || -10),
            yMax: Math.max(bounds1.yMax || 10, bounds2.yMax || 10),
            zMin: Math.min(bounds1.zMin || -10, bounds2.zMin || -10),
            zMax: Math.max(bounds1.zMax || 10, bounds2.zMax || 10)
        };
    }

    /**
     * 求解方程组
     * @param {Array} equations - 方程数组
     * @param {Object} options - 求解选项
     * @returns {Array} 交点数组
     */
    solveSystem(equations, options = {}) {
        const {
            bounds = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
            step = 0.1,
            tolerance = 0.01
        } = options;

        const solutions = [];
        const evaluators = equations.map(eq => this.createEvaluator(eq));

        for (let x = bounds.xMin; x <= bounds.xMax; x += step) {
            for (let y = bounds.yMin; y <= bounds.yMax; y += step) {
                const values = evaluators.map(fn => fn(x, y, 0));
                
                if (values.every(v => !isNaN(v))) {
                    const maxDiff = Math.max(...values.map(v => Math.abs(v)));
                    if (maxDiff < tolerance) {
                        solutions.push({ x, y, values });
                    }
                }
            }
        }

        return this.clusterSolutions(solutions, step * 2);
    }

    /**
     * 聚类相近的解
     * @param {Array} solutions - 解数组
     * @param {number} threshold - 聚类阈值
     * @returns {Array} 聚类后的解
     */
    clusterSolutions(solutions, threshold) {
        if (solutions.length === 0) return [];

        const clusters = [];
        const visited = new Set();

        for (let i = 0; i < solutions.length; i++) {
            if (visited.has(i)) continue;

            const cluster = [solutions[i]];
            visited.add(i);

            for (let j = i + 1; j < solutions.length; j++) {
                if (visited.has(j)) continue;

                const dist = Math.sqrt(
                    (solutions[i].x - solutions[j].x) ** 2 +
                    (solutions[i].y - solutions[j].y) ** 2
                );

                if (dist < threshold) {
                    cluster.push(solutions[j]);
                    visited.add(j);
                }
            }

            const centroid = {
                x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
                y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length
            };
            clusters.push(centroid);
        }

        return clusters;
    }

    /**
     * 绘制隐函数
     * @param {string} expression - 隐函数表达式 (如 "x^2 + y^2 - 1")
     * @param {Object} options - 绘制选项
     * @returns {Object} 隐函数数据
     */
    createImplicitFunction(expression, options = {}) {
        const {
            bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
            resolution = 100
        } = options;

        return {
            type: 'implicit',
            expression: expression,
            bounds: bounds,
            resolution: resolution,
            evaluator: (x, y) => {
                try {
                    const scope = { x, y, z: 0, t: 0 };
                    return this.parser.evaluate(expression, scope);
                } catch (e) {
                    return NaN;
                }
            }
        };
    }

    /**
     * 生成隐函数轮廓点
     * @param {Object} implicitFunc - 隐函数对象
     * @returns {Array} 轮廓点数组
     */
    generateContourPoints(implicitFunc) {
        const { bounds, resolution, evaluator } = implicitFunc;
        const points = [];

        const xStep = (bounds.xMax - bounds.xMin) / resolution;
        const yStep = (bounds.yMax - bounds.yMin) / resolution;

        const grid = [];
        for (let i = 0; i <= resolution; i++) {
            grid[i] = [];
            for (let j = 0; j <= resolution; j++) {
                const x = bounds.xMin + i * xStep;
                const y = bounds.yMin + j * yStep;
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
                    const x = bounds.xMin + (i + 0.5) * xStep;
                    const y = bounds.yMin + (j + 0.5) * yStep;
                    points.push({ x, y });
                }
            }
        }

        return points;
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
     * 创建不等式区域
     * @param {string} expression - 不等式表达式 (如 "y > x^2")
     * @param {Object} options - 选项
     * @returns {Object} 不等式区域对象
     */
    createInequalityRegion(expression, options = {}) {
        const {
            bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
            fillColor = 'rgba(66, 153, 225, 0.3)',
            borderColor = 'rgba(66, 153, 225, 0.8)'
        } = options;

        return {
            type: 'inequality',
            expression: expression,
            bounds: bounds,
            fillColor: fillColor,
            borderColor: borderColor,
            evaluator: (x, y) => {
                try {
                    const scope = { x, y, z: 0, t: 0 };
                    return this.parser.evaluate(expression, scope);
                } catch (e) {
                    return false;
                }
            }
        };
    }

    /**
     * 计算两个方程的交点
     * @param {Object} eq1 - 第一个方程
     * @param {Object} eq2 - 第二个方程
     * @param {Object} options - 求解选项
     * @returns {Array} 交点数组
     */
    findIntersections(eq1, eq2, options = {}) {
        return this.solveSystem([eq1, eq2], options);
    }

    /**
     * 计算方程的导数
     * @param {Object} equation - 方程对象
     * @param {string} variable - 求导变量
     * @param {number} point - 求导点
     * @returns {number} 导数值
     */
    calculateDerivative(equation, variable, point) {
        const h = 1e-5;
        const evaluator = this.createEvaluator(equation);

        if (variable === 'x') {
            const f1 = evaluator(point + h, 0, 0);
            const f2 = evaluator(point - h, 0, 0);
            return (f1 - f2) / (2 * h);
        } else if (variable === 'y') {
            const f1 = evaluator(0, point + h, 0);
            const f2 = evaluator(0, point - h, 0);
            return (f1 - f2) / (2 * h);
        }

        return NaN;
    }

    /**
     * 验证方程组合是否有效
     * @param {Array} equations - 方程数组
     * @returns {Object} 验证结果
     */
    validateCombination(equations) {
        const errors = [];

        if (!Array.isArray(equations) || equations.length < 2) {
            errors.push('至少需要两个方程进行组合');
            return { valid: false, errors };
        }

        for (const eq of equations) {
            if (!eq.type) {
                errors.push('方程缺少类型定义');
            }
            if (!eq.expression && eq.type !== 'parametric') {
                errors.push('方程缺少表达式');
            }
        }

        const types = equations.map(eq => eq.type);
        const hasInequality = types.includes('inequality');
        const hasImplicit = types.includes('implicit');

        if (hasInequality && hasImplicit) {
            errors.push('不等式和隐函数的组合可能产生意外结果');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: hasInequality ? ['不等式组合仅支持交集和并集操作'] : []
        };
    }
}

export default EquationCombiner;
