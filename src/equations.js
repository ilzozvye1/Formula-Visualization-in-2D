// 方程绘制相关函数
import * as globals from './globals.js';
import { project3DTo2D } from './drawing.js';

// 绘制 2D 方程
export function drawEquation(equation, index) {
    // 检查是否需要绘制渐近线
    const shouldDrawAsymptotes = equation.parsed && equation.parsed.hasAsymptotes;
    console.log('方程:', equation.formula, 'hasAsymptotes:', shouldDrawAsymptotes, 'parsed:', equation.parsed);
    
    globals.ctx.beginPath();
    globals.ctx.strokeStyle = equation.color;
    globals.ctx.lineWidth = index === globals.selectedEquationIndex ? 5 : 3;

    // 选中方程时添加发光效果
    if (index === globals.selectedEquationIndex) {
        globals.ctx.shadowColor = equation.color;
        globals.ctx.shadowBlur = 10;
    }

    // 设置线条样式
    if (equation.style === 'dashed') {
        globals.ctx.setLineDash([10, 5]);
    } else if (equation.style === 'dotted') {
        globals.ctx.setLineDash([3, 3]);
    } else {
        globals.ctx.setLineDash([]);
    }

    // 如果有渐近线，先绘制渐近线
    if (shouldDrawAsymptotes) {
        console.log('✓ 开始绘制渐近线 for', equation.formula);
        drawAsymptotes(equation.parsed);
    } else {
        console.log('✗ 不绘制渐近线，原因:', equation.parsed ? 'hasAsymptotes=false, func=' + equation.parsed.func : 'no parsed object');
    }

    // 改进的 2D 方程绘制实现
    let isFirstPoint = true;
    let lastValidY = null; // 记录上一个有效的 Y 值
    let formula = equation.formula;

    // 从 canvas 的左侧到右侧绘制
    for (let canvasX = 0; canvasX < globals.canvas.width; canvasX += 2) {
        // 将画布坐标转换为数学坐标
        let x = (canvasX - globals.offsetX) / globals.scale;
        
        // 尝试计算 y 值
        let y;
        try {
            // 简单的方程解析和计算
            // 移除"y="前缀
            let expr = formula.replace(/^y=/i, '');
            
            // 替换数学函数
            expr = expr.replace(/sin/g, 'Math.sin')
                       .replace(/cos/g, 'Math.cos')
                       .replace(/tan/g, 'Math.tan')
                       .replace(/log/g, 'Math.log')
                       .replace(/log10/g, 'Math.log10')
                       .replace(/exp/g, 'Math.exp')
                       .replace(/abs/g, 'Math.abs')
                       .replace(/sqrt/g, 'Math.sqrt')
                       .replace(/pow/g, 'Math.pow')
                       .replace(/\^/g, '**')
                       .replace(/floor/g, 'Math.floor')
                       .replace(/ceil/g, 'Math.ceil')
                       .replace(/round/g, 'Math.round')
                       .replace(/sinh/g, 'Math.sinh')
                       .replace(/cosh/g, 'Math.cosh')
                       .replace(/tanh/g, 'Math.tanh');
            
            // 计算 y 值
            y = eval(expr);
        } catch (error) {
            // 如果计算出错，跳过这个点
            isFirstPoint = true;
            lastValidY = null;
            continue;
        }
        
        if (!isFinite(y)) {
            isFirstPoint = true;
            lastValidY = null;
            continue;
        }

        // 将数学坐标转换为画布坐标
        const canvasY = globals.offsetY - y * globals.scale;

        // 检测 Y 值的跳变（避免在渐近线处连线）
        if (lastValidY !== null && Math.abs(canvasY - lastValidY) > globals.canvas.height * 0.5) {
            isFirstPoint = true;
        }

        // 确保点在画布范围内
        if (canvasY >= 0 && canvasY <= globals.canvas.height) {
            if (isFirstPoint) {
                globals.ctx.beginPath();
                globals.ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                globals.ctx.lineTo(canvasX, canvasY);
            }
            lastValidY = canvasY; // 记录有效的 Y 值
        } else {
            isFirstPoint = true;
            lastValidY = null;
        }
    }

    globals.ctx.stroke();
    globals.ctx.setLineDash([]);
    globals.ctx.shadowBlur = 0;
}

// 绘制渐近线
export function drawAsymptotes(parsed) {
    console.log('绘制渐近线，parsed:', parsed);
    
    const { func, frequency = 1, phase = 0 } = parsed;
    const asymptotes = [];
    
    // 计算当前视图范围内的 X 坐标范围（稍微扩展范围确保边界渐近线不丢失）
    const margin = 2; // 额外扩展 2 个单位的数学坐标
    const xMin = -globals.offsetX / globals.scale - margin;
    const xMax = (globals.canvas.width - globals.offsetX) / globals.scale + margin;
    
    console.log('视图范围:', { xMin, xMax, margin });
    
    // 根据函数类型计算渐近线
    if (func === 'tan' || func === 'sec') {
        // tan(x) 和 sec(x) 的渐近线在 x = π/2 + nπ
        const period = Math.PI / frequency;
        const baseAsymptote = (Math.PI / 2 - phase) / frequency;
        
        console.log('tan/sec 渐近线参数:', { period, baseAsymptote, frequency, phase });
        
        // 计算起始和结束的 n 值（使用更精确的计算）
        const nStart = Math.floor((xMin - baseAsymptote) / period) - 1;
        const nEnd = Math.ceil((xMax - baseAsymptote) / period) + 1;
        
        console.log('n 范围:', { nStart, nEnd });
        
        for (let n = nStart; n <= nEnd; n++) {
            const x = baseAsymptote + n * period;
            // 检查渐近线是否在画布范围内（使用 canvas 坐标检查更精确）
            const canvasX = globals.offsetX + x * globals.scale;
            console.log('计算渐近线:', { n, x, canvasX });
            if (canvasX >= -50 && canvasX <= globals.canvas.width + 50) {
                asymptotes.push({ x, canvasX });
            }
        }
    } else if (func === 'cot' || func === 'csc') {
        // cot(x) 和 csc(x) 的渐近线在 x = nπ
        const period = Math.PI / frequency;
        const baseAsymptote = -phase / frequency;
        
        console.log('cot/csc 渐近线参数:', { period, baseAsymptote, frequency, phase });
        
        const nStart = Math.floor((xMin - baseAsymptote) / period) - 1;
        const nEnd = Math.ceil((xMax - baseAsymptote) / period) + 1;
        
        console.log('n 范围:', { nStart, nEnd });
        
        for (let n = nStart; n <= nEnd; n++) {
            const x = baseAsymptote + n * period;
            // 检查渐近线是否在画布范围内（使用 canvas 坐标检查更精确）
            const canvasX = globals.offsetX + x * globals.scale;
            console.log('计算渐近线:', { n, x, canvasX });
            if (canvasX >= -50 && canvasX <= globals.canvas.width + 50) {
                asymptotes.push({ x, canvasX });
            }
        }
    }

    console.log('最终渐近线数量:', asymptotes.length);

    // 绘制渐近线 - 使用更明显的样式
    globals.ctx.save();
    globals.ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';  // 更深的颜色，更高的不透明度
    globals.ctx.lineWidth = 2;  // 更粗的线条
    globals.ctx.setLineDash([8, 4]);  // 更长的虚线段
    
    asymptotes.forEach(asymptote => {
        globals.ctx.beginPath();
        globals.ctx.moveTo(asymptote.canvasX, 0);
        globals.ctx.lineTo(asymptote.canvasX, globals.canvas.height);
        globals.ctx.stroke();
    });
    
    globals.ctx.restore();
}

// 绘制所有方程
export function drawAllEquations() {
    globals.equations.forEach((equation, index) => {
        if (equation.visible) {
            drawEquation(equation, index);
        }
    });
}

// 绘制所有3D方程
export function drawAllEquations3D() {
    globals.equations.forEach((equation, index) => {
        if (equation.visible) {
            drawEquation3D(equation, index);
        }
    });
}

// 绘制单个3D方程
export function drawEquation3D(equation, index) {
    globals.ctx.beginPath();
    globals.ctx.strokeStyle = equation.color;
    globals.ctx.lineWidth = index === globals.selectedEquationIndex ? 5 : 3;

    // 选中方程时添加发光效果
    if (index === globals.selectedEquationIndex) {
        globals.ctx.shadowColor = equation.color;
        globals.ctx.shadowBlur = 10;
    }

    // 设置线条样式
    if (equation.style === 'dashed') {
        globals.ctx.setLineDash([10, 5]);
    } else if (equation.style === 'dotted') {
        globals.ctx.setLineDash([3, 3]);
    } else {
        globals.ctx.setLineDash([]);
    }

    // 根据方程类型选择绘制方式
    if (equation.parsed.type === '3dcurve') {
        draw3DCurve(equation.parsed);
    } else if (equation.parsed.type === '3dsurface') {
        draw3DSurface(equation.parsed);
    } else {
        // 在3D模式下，将2D函数绘制为XY平面上的曲线（Z=0）
        drawEquation3DInPlane(equation.parsed);
    }

    globals.ctx.setLineDash([]);
    globals.ctx.shadowBlur = 0;
}

// 在3D XY平面上绘制方程
export function drawEquation3DInPlane(parsed) {
    let isFirstPoint = true;
    let step = 0.5; // 采样步长

    for (let x = -10; x <= 10; x += step) {
        let y = calculateEquationY(parsed, x);

        if (!isFinite(y)) {
            isFirstPoint = true;
            continue;
        }

        // 在3D空间中，Z=0（XY平面）
        let point = project3DTo2D(x * globals.scale, y * globals.scale, 0);

        if (isFirstPoint) {
            globals.ctx.beginPath();
            globals.ctx.moveTo(point.x, point.y);
            isFirstPoint = false;
        } else {
            globals.ctx.lineTo(point.x, point.y);
        }
    }

    globals.ctx.stroke();
}

// 计算方程的Y值
export function calculateEquationY(parsed, x) {
    // 这里省略了复杂的方程计算逻辑
    // 实际实现应该根据不同的方程类型进行计算
    return x;
}

// 计算3D曲面点
export function calculate3DSurfacePoint(surfaceType, u, v, params) {
    // 这里省略了复杂的3D曲面计算逻辑
    return { x: u * globals.scale, y: v * globals.scale, z: 0 };
}

// 计算3D曲线点
export function calculate3DCurvePoint(curveType, t, params) {
    // 这里省略了复杂的3D曲线计算逻辑
    return { x: t * globals.scale, y: 0, z: 0 };
}

// 绘制3D曲线
export function draw3DCurve(parsed) {
    // 这里省略了复杂的3D曲线绘制逻辑
    globals.ctx.stroke();
}

// 绘制3D曲面
export function draw3DSurface(parsed) {
    // 这里省略了复杂的3D曲面绘制逻辑
    globals.ctx.stroke();
}