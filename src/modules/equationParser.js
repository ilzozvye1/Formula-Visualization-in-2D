/**
 * 方程解析模块
 * @module modules/equationParser
 */

/**
 * 解析公式字符串
 * @param {string} formula - 公式字符串
 * @returns {Object|null} 解析结果
 */
export function parseFormula(formula) {
    formula = formula.trim().toLowerCase();

    // 检查是否为3D空间曲线公式
    if (formula.startsWith('3d:')) {
        const curveType = formula.substring(3);
        return parse3DCurveEquation(curveType);
    }

    // 检查是否为3D曲面公式
    if (formula.startsWith('3dsurf:')) {
        const surfaceType = formula.substring(7);
        return parse3DSurfaceEquation(surfaceType);
    }

    // 检查是否为微分公式
    if (formula.startsWith('deriv:') || formula.startsWith('d/dx:')) {
        return parseDerivativeEquation(formula);
    }

    // 检查是否为积分公式
    if (formula.startsWith('integ:') || formula.startsWith('∫:')) {
        return parseIntegralEquation(formula);
    }

    // 解析2D方程
    return parse2DEquation(formula);
}

/**
 * 解析2D方程
 * @param {string} formula - 公式字符串
 * @returns {Object|null} 解析结果
 */
function parse2DEquation(formula) {
    // 移除空格
    formula = formula.replace(/\s/g, '');

    // 提取表达式部分
    let expression = formula;
    if (formula.startsWith('y=')) {
        expression = formula.substring(2);
    }

    // 尝试各种方程类型解析
    const parsers = [
        parseLinearEquation,
        parseQuadraticEquation,
        parsePowerEquation,
        parseExponentialEquation,
        parseLogarithmicEquation,
        parseTrigonometricEquation,
        parseInverseTrigonometricEquation,
        parseHyperbolicEquation,
        parseAbsoluteEquation,
        parseRoundingEquation,
        parseSpecialEquation
    ];

    for (const parser of parsers) {
        const result = parser(expression);
        if (result) return result;
    }

    // 通用表达式解析
    return parseGenericEquation(expression);
}

/**
 * 解析线性方程 y = kx + b
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseLinearEquation(expression) {
    // 匹配形如 2x+1, x, -3x, 2x-5 等
    const match = expression.match(/^([+-]?\d*\.?\d*)x([+-]?\d+\.?\d*)?$/);
    if (match) {
        const slope = match[1] === '' || match[1] === '+' ? 1 : 
                      match[1] === '-' ? -1 : parseFloat(match[1]);
        const intercept = match[2] ? parseFloat(match[2]) : 0;
        
        return {
            type: 'linear',
            slope,
            intercept,
            formula: `y = ${slope === 1 ? '' : slope === -1 ? '-' : slope}x${intercept >= 0 ? '+' : ''}${intercept}`
        };
    }
    return null;
}

/**
 * 解析二次方程 y = ax² + bx + c
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseQuadraticEquation(expression) {
    // 匹配形如 x^2, 2x^2+3x+1, -x^2+2 等
    const regex = /^([+-]?\d*\.?\d*)x\^2(?:([+-]?\d*\.?\d*)x)?([+-]?\d+\.?\d*)?$/;
    const match = expression.match(regex);
    
    if (match) {
        const a = match[1] === '' || match[1] === '+' ? 1 : 
                  match[1] === '-' ? -1 : parseFloat(match[1]);
        const b = match[2] ? (match[2] === '+' ? 1 : match[2] === '-' ? -1 : parseFloat(match[2])) : 0;
        const c = match[3] ? parseFloat(match[3]) : 0;
        
        return {
            type: 'quadratic',
            a,
            b,
            c,
            formula: `y = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`
        };
    }
    return null;
}

/**
 * 解析幂函数 y = x^n
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parsePowerEquation(expression) {
    // 匹配形如 x^3, 2x^0.5, sqrt(x) 等
    
    // 平方根特殊处理
    if (expression === 'sqrt(x)' || expression === '√x') {
        return {
            type: 'power',
            coefficient: 1,
            power: 0.5,
            formula: 'y = √x'
        };
    }
    
    // 立方根
    if (expression === 'cbrt(x)' || expression === '∛x') {
        return {
            type: 'power',
            coefficient: 1,
            power: 1/3,
            formula: 'y = ∛x'
        };
    }
    
    // 一般幂函数 x^n
    const match = expression.match(/^([+-]?\d*\.?\d*)x\^([+-]?\d+\.?\d*)$/);
    if (match) {
        const coefficient = match[1] === '' ? 1 : parseFloat(match[1]);
        const power = parseFloat(match[2]);
        
        return {
            type: 'power',
            coefficient,
            power,
            formula: `y = ${coefficient}x^${power}`
        };
    }
    
    // 倒数 1/x
    if (expression === '1/x') {
        return {
            type: 'power',
            coefficient: 1,
            power: -1,
            formula: 'y = 1/x'
        };
    }
    
    return null;
}

/**
 * 解析指数函数 y = a^x
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseExponentialEquation(expression) {
    // 自然指数 e^x
    if (expression === 'e^x' || expression === 'exp(x)') {
        return {
            type: 'exponential',
            base: 'e',
            coefficient: 1,
            formula: 'y = e^x'
        };
    }
    
    // 一般指数 a^x
    const match = expression.match(/^([+-]?\d+\.?\d*)\^x$/);
    if (match) {
        const base = parseFloat(match[1]);
        return {
            type: 'exponential',
            base,
            coefficient: 1,
            formula: `y = ${base}^x`
        };
    }
    
    return null;
}

/**
 * 解析对数函数 y = log(x)
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseLogarithmicEquation(expression) {
    // 自然对数
    if (expression === 'ln(x)' || expression === 'log(x)') {
        return {
            type: 'logarithmic',
            base: 'e',
            formula: 'y = ln(x)'
        };
    }
    
    // 常用对数
    if (expression === 'log10(x)' || expression === 'lg(x)') {
        return {
            type: 'logarithmic',
            base: 10,
            formula: 'y = log₁₀(x)'
        };
    }
    
    // 一般对数
    const match = expression.match(/^log(\d+)\(x\)$/);
    if (match) {
        const base = parseInt(match[1]);
        return {
            type: 'logarithmic',
            base,
            formula: `y = log${base}(x)`
        };
    }
    
    return null;
}

/**
 * 解析三角函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseTrigonometricEquation(expression) {
    const trigFunctions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];
    
    for (const func of trigFunctions) {
        // 匹配 sin(x), 2sin(x), sin(2x), 2sin(3x+1) 等
        const regex = new RegExp(`^([+-]?\\d*\\.?\\d*)?${func}\\(([+-]?\\d*\\.?\\d*)x([+-]?\\d+\\.?\\d*)?\\)$`);
        const match = expression.match(regex);
        
        if (match) {
            const amplitude = match[1] ? parseFloat(match[1]) : 1;
            const frequency = match[2] ? (match[2] === '' ? 1 : parseFloat(match[2])) : 1;
            const phase = match[3] ? parseFloat(match[3]) : 0;
            
            const result = {
                type: 'trigonometric',
                func,
                amplitude,
                frequency,
                phase,
                formula: `y = ${amplitude}${func}(${frequency}x${phase >= 0 ? '+' : ''}${phase})`
            };
            
            // 为有渐近线的函数添加渐近线信息
            if (func === 'tan' || func === 'cot' || func === 'sec' || func === 'csc') {
                result.hasAsymptotes = true;
                result.asymptoteType = func;
            }
            
            return result;
        }
        
        // 简单形式 sin(x)
        if (expression === `${func}(x)`) {
            const result = {
                type: 'trigonometric',
                func,
                amplitude: 1,
                frequency: 1,
                phase: 0,
                formula: `y = ${func}(x)`
            };
            
            // 为有渐近线的函数添加渐近线信息
            if (func === 'tan' || func === 'cot' || func === 'sec' || func === 'csc') {
                result.hasAsymptotes = true;
                result.asymptoteType = func;
            }
            
            return result;
        }
    }
    
    return null;
}

/**
 * 解析反三角函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseInverseTrigonometricEquation(expression) {
    const inverseTrigFunctions = ['arcsin', 'arccos', 'arctan', 'asin', 'acos', 'atan'];
    
    for (const func of inverseTrigFunctions) {
        if (expression === `${func}(x)`) {
            const standardName = func.replace('as', 'arcs').replace('at', 'arct');
            return {
                type: 'inverseTrigonometric',
                func: standardName,
                formula: `y = ${standardName}(x)`
            };
        }
    }
    
    return null;
}

/**
 * 解析双曲函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseHyperbolicEquation(expression) {
    const hyperbolicFunctions = ['sinh', 'cosh', 'tanh'];

    for (const func of hyperbolicFunctions) {
        // 匹配 sinh(x), sinh(x)+c, c*sinh(x) 等形式
        const regex = new RegExp(`^(-?\\d*\\.?\\d*)\\*?${func}\\(x\\)?([+-]?\\d+\\.?\\d*)?$`);
        const match = expression.match(regex);

        if (match || expression === `${func}(x)`) {
            let amplitude = 1;
            let verticalShift = 0;

            if (match) {
                const ampStr = match[1];
                if (ampStr && ampStr !== '') {
                    amplitude = ampStr === '-' ? -1 : parseFloat(ampStr);
                }
                if (match[2]) {
                    verticalShift = parseFloat(match[2]);
                }
            }

            return {
                type: 'hyperbolic',
                func,
                amplitude,
                frequency: 1,
                phase: 0,
                verticalShift,
                formula: `y = ${amplitude !== 1 ? amplitude : ''}${func}(x)${verticalShift !== 0 ? (verticalShift >= 0 ? '+' : '') + verticalShift : ''}`
            };
        }
    }

    return null;
}

/**
 * 解析绝对值函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseAbsoluteEquation(expression) {
    // 匹配 |x|, abs(x)
    if (expression === '|x|' || expression === 'abs(x)') {
        return {
            type: 'absolute',
            coefficient: 1,
            frequency: 1,
            phase: 0,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = |x|'
        };
    }
    
    // 匹配 |x-a|
    const match = expression.match(/^\|x([+-]\d+\.?\d*)\|$/);
    if (match) {
        const shift = parseFloat(match[1]);
        return {
            type: 'absolute',
            coefficient: 1,
            frequency: 1,
            phase: -shift,
            horizontalShift: shift,
            verticalShift: 0,
            shift,
            formula: `y = |x${shift >= 0 ? '+' : ''}${shift}|`
        };
    }
    
    return null;
}

/**
 * 解析取整函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseRoundingEquation(expression) {
    const roundingFunctions = {
        'floor': 'floor',
        'ceil': 'ceil',
        'round': 'round',
        'int': 'floor',
        '[x]': 'floor'
    };

    for (const [pattern, func] of Object.entries(roundingFunctions)) {
        // 匹配 floor(x), floor(x)+c, floor(x)-c, c*floor(x) 等形式
        const regex = new RegExp(`^(-?\\d*\\.?\\d*)\\*?${pattern}\\(x\\)?([+-]?\\d+\\.?\\d*)?$`);
        const match = expression.match(regex);

        if (match || expression === `${pattern}(x)` || expression === pattern) {
            let coefficient = 1;
            let verticalShift = 0;

            if (match) {
                const coeffStr = match[1];
                if (coeffStr && coeffStr !== '') {
                    coefficient = coeffStr === '-' ? -1 : parseFloat(coeffStr);
                }
                if (match[2]) {
                    verticalShift = parseFloat(match[2]);
                }
            }

            return {
                type: 'rounding',
                func,
                coefficient,
                frequency: 1,
                phase: 0,
                horizontalShift: 0,
                verticalShift,
                formula: `y = ${coefficient !== 1 ? coefficient : ''}${func}(x)${verticalShift !== 0 ? (verticalShift >= 0 ? '+' : '') + verticalShift : ''}`
            };
        }
    }

    return null;
}

/**
 * 解析特殊函数
 * @param {string} expression - 表达式
 * @returns {Object|null} 解析结果
 */
function parseSpecialEquation(expression) {
    // sinc函数 sin(x)/x
    if (expression === 'sin(x)/x' || expression === 'sinc(x)') {
        return {
            type: 'special',
            name: 'sinc',
            func: (x, coeff) => coeff * (x === 0 ? 1 : Math.sin(x) / x),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = sin(x)/x'
        };
    }

    // 高斯函数 e^(-x^2)
    if (expression === 'e^(-x^2)' || expression === 'exp(-x^2)') {
        return {
            type: 'special',
            name: 'gaussian',
            func: (x, coeff) => coeff * Math.exp(-x * x),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = e^(-x²)'
        };
    }

    // 高斯函数 2e^(-x^2)
    const gaussian2Match = expression.match(/^(\d+(?:\.\d+)?)e\^\(-x\^2\)$/);
    if (gaussian2Match) {
        const coefficient = parseFloat(gaussian2Match[1]);
        return {
            type: 'special',
            name: 'gaussian2',
            func: (x, coeff) => coeff * Math.exp(-x * x),
            coefficient: coefficient,
            horizontalShift: 0,
            verticalShift: 0,
            formula: `y = ${coefficient}e^(-x²)`
        };
    }

    // 拉普拉斯函数 e^(-|x|)
    if (expression === 'e^(-|x|)' || expression === 'exp(-|x|)') {
        return {
            type: 'special',
            name: 'laplace',
            func: (x, coeff) => coeff * Math.exp(-Math.abs(x)),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = e^(-|x|)'
        };
    }

    // sigmoid函数
    if (expression === '1/(1+e^(-x))' || expression === 'sigmoid(x)') {
        return {
            type: 'special',
            name: 'sigmoid',
            func: (x, coeff) => coeff / (1 + Math.exp(-x)),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = 1/(1+e^(-x))'
        };
    }

    // x*sin(x) - 振荡放大
    if (expression === 'x*sin(x)' || expression === 'x*sin(x)') {
        return {
            type: 'special',
            name: 'xsin',
            func: (x, coeff) => coeff * x * Math.sin(x),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = x·sin(x)'
        };
    }

    // |sin(x)| - 全波整流
    if (expression === '|sin(x)|' || expression === 'abs(sin(x))') {
        return {
            type: 'special',
            name: 'abs_sin',
            func: (x, coeff) => coeff * Math.abs(Math.sin(x)),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = |sin(x)|'
        };
    }

    // |cos(x)|
    if (expression === '|cos(x)|' || expression === 'abs(cos(x))') {
        return {
            type: 'special',
            name: 'abs_cos',
            func: (x, coeff) => coeff * Math.abs(Math.cos(x)),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = |cos(x)|'
        };
    }

    // x^2*sin(1/x) - 振荡函数
    if (expression === 'x^2*sin(1/x)' || expression === 'x*x*sin(1/x)') {
        return {
            type: 'special',
            name: 'x2sin1x',
            func: (x, coeff) => coeff * (x === 0 ? 0 : x * x * Math.sin(1 / x)),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = x²·sin(1/x)'
        };
    }

    // x*exp(-x) - Gamma核函数
    if (expression === 'x*exp(-x)' || expression === 'x*e^(-x)') {
        return {
            type: 'special',
            name: 'gamma_kernel',
            func: (x, coeff) => coeff * (x >= 0 ? x * Math.exp(-x) : 0),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = x·e^(-x)'
        };
    }

    // sin(x)/sqrt(x) - 衰减振荡
    if (expression === 'sin(x)/x^0.5' || expression === 'sin(x)/sqrt(x)') {
        return {
            type: 'special',
            name: 'damped_oscillation',
            func: (x, coeff) => coeff * (x > 0 ? Math.sin(x) / Math.sqrt(x) : 0),
            coefficient: 1,
            horizontalShift: 0,
            verticalShift: 0,
            formula: 'y = sin(x)/√x'
        };
    }

    return null;
}

/**
 * 解析通用方程
 * @param {string} expression - 表达式
 * @returns {Object} 解析结果
 */
function parseGenericEquation(expression) {
    return {
        type: 'generic',
        expression,
        horizontalShift: 0,
        verticalShift: 0,
        formula: `y = ${expression}`
    };
}

/**
 * 解析微分方程
 * @param {string} formula - 公式字符串
 * @returns {Object|null} 解析结果
 */
function parseDerivativeEquation(formula) {
    // 提取表达式部分
    let expression = formula;
    if (formula.startsWith('deriv:')) {
        expression = formula.substring(6);
    } else if (formula.startsWith('d/dx:')) {
        expression = formula.substring(5);
    }
    
    return {
        type: 'derivative',
        expression,
        formula: `y = d/dx(${expression})`
    };
}

/**
 * 解析积分方程
 * @param {string} formula - 公式字符串
 * @returns {Object|null} 解析结果
 */
function parseIntegralEquation(formula) {
    // 提取表达式和积分限
    let content = formula;
    if (formula.startsWith('integ:')) {
        content = formula.substring(6);
    } else if (formula.startsWith('∫:')) {
        content = formula.substring(2);
    }
    
    // 解析格式: expression:a:b
    const parts = content.split(':');
    if (parts.length >= 3) {
        const expression = parts[0];
        const lowerBound = parseFloat(parts[1]);
        const upperBound = parseFloat(parts[2]);
        
        return {
            type: 'integral',
            expression,
            lowerBound,
            upperBound,
            formula: `y = ∫${lowerBound}^${upperBound} ${expression} dx`
        };
    }
    
    // 不定积分
    return {
        type: 'integral',
        expression: content,
        formula: `y = ∫${content} dx`
    };
}

/**
 * 解析3D空间曲线方程
 * @param {string} curveType - 曲线类型
 * @returns {Object|null} 解析结果
 */
function parse3DCurveEquation(curveType) {
    const curves = {
        'helix': { name: '螺旋线', formula: 'x=a·cos(t), y=a·sin(t), z=b·t' },
        'trefoil': { name: '三叶结', formula: '三叶结曲线' },
        'torus': { name: '环面结', formula: '环面结曲线' },
        'lissajous': { name: '利萨茹曲线', formula: '利萨茹曲线' },
        'viviani': { name: '维维亚尼曲线', formula: '维维亚尼曲线' },
        'spherical-spiral': { name: '球面螺旋线', formula: '球面螺旋线' },
        'conical-spiral': { name: '圆锥螺旋线', formula: '圆锥螺旋线' },
        'rose': { name: '3D玫瑰线', formula: '3D玫瑰线' },
        'twisted-cubic': { name: '扭曲立方曲线', formula: '扭曲立方曲线' },
        'sine-wave': { name: '3D正弦波', formula: '3D正弦波' },
        'figure-eight': { name: '8字结', formula: '8字结' },
        'cinquefoil': { name: '五叶结', formula: '五叶结' }
    };
    
    if (curves[curveType]) {
        return {
            type: '3dcurve',
            curveType,
            name: curves[curveType].name,
            formula: curves[curveType].formula,
            params: getDefaultCurveParams(curveType)
        };
    }
    
    return null;
}

/**
 * 解析3D曲面方程
 * @param {string} surfaceType - 曲面类型
 * @returns {Object|null} 解析结果
 */
function parse3DSurfaceEquation(surfaceType) {
    const surfaces = {
        'plane': { name: '平面', formula: 'z = ax + by + c' },
        'sphere': { name: '球面', formula: 'x² + y² + z² = r²' },
        'cone': { name: '圆锥面', formula: 'z² = a(x² + y²)' },
        'paraboloid': { name: '抛物面', formula: 'z = a(x² + y²)' },
        'hyperboloid': { name: '单叶双曲面', formula: 'x²/a² + y²/b² - z²/c² = 1' },
        'saddle': { name: '马鞍面', formula: 'z = a(x² - y²)' },
        'wave': { name: '波浪面', formula: 'z = a·sin(bx)·cos(cy)' },
        'torus-surf': { name: '环面', formula: '(R-√(x²+y²))² + z² = r²' },
        'gaussian': { name: '高斯曲面', formula: 'z = a·exp(-(x²+y²)/b²)' },
        'ripple': { name: '涟漪面', formula: 'z = a·sin(b·√(x²+y²))' }
    };
    
    if (surfaces[surfaceType]) {
        return {
            type: '3dsurface',
            surfaceType,
            name: surfaces[surfaceType].name,
            formula: surfaces[surfaceType].formula,
            params: getDefaultSurfaceParams(surfaceType)
        };
    }
    
    return null;
}

/**
 * 获取默认曲线参数
 * @param {string} curveType - 曲线类型
 * @returns {Object} 默认参数
 */
function getDefaultCurveParams(curveType) {
    const params = {
        'helix': { a: 5, b: 2 },
        'trefoil': { a: 5 },
        'torus': { R: 5, r: 2, p: 2, q: 3 },
        'lissajous': { a: 5, b: 5, c: 5, nx: 3, ny: 2, nz: 1 },
        'viviani': { a: 5 },
        'spherical-spiral': { a: 5, b: 0.5 },
        'conical-spiral': { a: 1, b: 0.5 },
        'rose': { a: 5, n: 3, k: 2 },
        'twisted-cubic': { a: 1 },
        'sine-wave': { a: 5, b: 2, c: 1 },
        'figure-eight': { a: 2 },
        'cinquefoil': { a: 2 }
    };
    
    return params[curveType] || {};
}

/**
 * 获取默认曲面参数
 * @param {string} surfaceType - 曲面类型
 * @returns {Object} 默认参数
 */
function getDefaultSurfaceParams(surfaceType) {
    const params = {
        'plane': { a: 0.5, b: 0.3, c: 0 },
        'sphere': { r: 5 },
        'cone': { a: 1 },
        'paraboloid': { a: 0.5 },
        'hyperboloid': { a: 3, b: 3, c: 2 },
        'saddle': { a: 0.5 },
        'wave': { a: 2, b: 0.5, c: 0.5 },
        'torus-surf': { R: 5, r: 2 },
        'gaussian': { a: 5, b: 3 },
        'ripple': { a: 2, b: 0.8 }
    };
    
    return params[surfaceType] || {};
}

/**
 * 格式化方程显示
 * @param {Object} parsed - 解析后的方程对象
 * @returns {string} 格式化后的字符串
 */
export function formatEquation(parsed) {
    if (!parsed) return '无效方程';

    const { coefficient = 1, verticalShift = 0, horizontalShift = 0, phase = 0, amplitude = 1 } = parsed;
    const actualPhase = phase !== 0 ? phase : horizontalShift;

    // 辅助函数：格式化数值（限制精度，去除末尾0）
    const formatNum = (num) => {
        if (num === undefined || num === null) return '0';
        if (num === 0) return '0';
        // 使用toFixed(4)限制精度，然后去除末尾的0
        let str = parseFloat(num.toFixed(4)).toString();
        return str;
    };

    // 辅助函数：格式化系数（系数为1时省略）
    const formatCoeff = (coeff) => coeff !== 1 ? formatNum(coeff) : '';

    // 辅助函数：格式化相位/水平位移
    const formatPhase = (ph) => {
        if (ph === 0) return 'x';
        return `(x${ph >= 0 ? '+' : ''}${formatNum(ph)})`;
    };

    // 辅助函数：格式化垂直位移
    const formatVertShift = (vs) => vs !== 0 ? ` ${vs >= 0 ? '+' : ''}${formatNum(vs)}` : '';

    switch (parsed.type) {
        case 'linear': {
            const { slope, intercept } = parsed;
            const slopeStr = slope !== 1 ? formatNum(slope) : '';
            const slopeSign = slope < 0 ? '-' : '';
            if (slope === 0) {
                return `y = ${formatNum(intercept)}`;
            }
            return `y = ${slopeSign}${slopeStr}x${formatVertShift(intercept)}`;
        }

        case 'quadratic': {
            const { a, b, c } = parsed;
            let formula = 'y = ';
            if (a !== 1) formula += formatNum(a);
            formula += 'x²';
            if (b !== 0) formula += ` ${b >= 0 ? '+' : ''}${b !== 1 ? formatNum(b) : ''}x`;
            if (c !== 0) formula += ` ${c >= 0 ? '+' : ''}${formatNum(c)}`;
            return formula;
        }

        case 'power': {
            const { exponent } = parsed;
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : 'x';
            if (exponent === -1) {
                return `y = ${coeffStr}/${phaseStr}${formatVertShift(verticalShift)}`;
            }
            if (exponent === 0.5) {
                return `y = ${coeffStr}√${phaseStr}${formatVertShift(verticalShift)}`;
            }
            if (exponent === 1/3) {
                return `y = ${coeffStr}∛${phaseStr}${formatVertShift(verticalShift)}`;
            }
            return `y = ${coeffStr}${phaseStr}^${formatNum(exponent)}${formatVertShift(verticalShift)}`;
        }

        case 'exponential': {
            const { base } = parsed;
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const baseStr = base === 'e' ? 'e' : formatNum(base);
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `^(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : '^x';
            return `y = ${coeffStr}${baseStr}${phaseStr}${formatVertShift(verticalShift)}`;
        }

        case 'logarithmic': {
            const { base } = parsed;
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const baseStr = base === 'e' ? '' : formatNum(base);
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : '(x)';
            return `y = ${coeffStr}log${baseStr}${phaseStr}${formatVertShift(verticalShift)}`;
        }

        case 'trigonometric': {
            const { amplitude, frequency, func } = parsed;
            const ampStr = amplitude !== 1 ? formatNum(amplitude) : '';
            const freqStr = frequency !== 1 ? formatNum(frequency) : '';
            const phaseStr = actualPhase !== 0 ? `${actualPhase >= 0 ? '+' : ''}${formatNum(actualPhase)}` : '';
            return `y = ${ampStr}${func}(${freqStr}x${phaseStr})${formatVertShift(verticalShift)}`;
        }

        case 'inverseTrigonometric': {
            const amp = amplitude !== undefined ? amplitude : 1;
            const freq = parsed.frequency !== undefined ? parsed.frequency : 1;
            const ampStr = amp !== 1 ? formatNum(amp) : '';
            const freqStr = freq !== 1 ? formatNum(freq) : '';
            const phaseStr = actualPhase !== 0 ? `${actualPhase >= 0 ? '+' : ''}${formatNum(actualPhase)}` : '';
            return `y = ${ampStr}${parsed.func}(${freqStr}x${phaseStr})${formatVertShift(verticalShift)}`;
        }

        case 'hyperbolic': {
            const { amplitude, func } = parsed;
            const amp = amplitude !== undefined ? amplitude : 1;
            const ampStr = amp !== 1 ? formatNum(amp) : '';
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : '(x)';
            return `y = ${ampStr}${func}${phaseStr}${formatVertShift(verticalShift)}`;
        }

        case 'absolute': {
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : 'x';
            return `y = ${coeffStr}|${phaseStr}|${formatVertShift(verticalShift)}`;
        }

        case 'rounding': {
            const { func: roundFunc } = parsed;
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const h = horizontalShift !== undefined ? horizontalShift : 0;
            const phaseStr = h !== 0 ? `(x${h >= 0 ? '-' : '+'}${formatNum(Math.abs(h))})` : '(x)';
            return `y = ${coeffStr}${roundFunc}${phaseStr}${formatVertShift(verticalShift)}`;
        }

        case 'special': {
            const { name } = parsed;
            const coeff = coefficient !== undefined ? coefficient : 1;
            const coeffStr = coeff !== 1 ? formatNum(coeff) : '';
            const funcNames = {
                'sinc': 'sin(x)/x',
                'gaussian': 'e^(-x²)',
                'gaussian2': 'e^(-x²)',
                'laplace': 'e^(-|x|)',
                'sigmoid': '1/(1+e^(-x))',
                'xsin': 'x·sin(x)',
                'abs_sin': '|sin(x)|',
                'abs_cos': '|cos(x)|',
                'x2sin1x': 'x²·sin(1/x)',
                'gamma_kernel': 'x·e^(-x)',
                'damped_oscillation': 'sin(x)/√x'
            };
            const funcName = funcNames[name] || name;
            const phaseStr = horizontalShift !== 0 ? ` ${formatPhase(horizontalShift)}` : '';
            return `y = ${coeffStr}${funcName}${phaseStr}${formatVertShift(verticalShift)}`;
        }

        case '3dcurve':
            return `3D曲线: ${parsed.name || parsed.curveType}`;

        case '3dsurface':
            return `3D曲面: ${parsed.name || parsed.surfaceType}`;

        default:
            if (parsed.formula) {
                return parsed.formula;
            }
            return '未知方程类型';
    }
}

/**
 * 验证公式是否有效
 * @param {string} formula - 公式字符串
 * @returns {boolean} 是否有效
 */
export function isValidFormula(formula) {
    return parseFormula(formula) !== null;
}
