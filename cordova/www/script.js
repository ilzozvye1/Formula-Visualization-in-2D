// 版本号
const APP_VERSION = '1.0.0';
const APP_NAME = '2D公式可视化';
// 构建日期动态生成（格式：YYYY-MM-DD）
const APP_BUILD_DATE = '2026-03-03';

// 全局变量
let canvas, ctx;
let scale = 20;
let offsetX = 400;
let offsetY = 300;
let isDragging = false;
let lastX, lastY;
let equations = [];
let showGrid = true;
let darkMode = false;
let xMin = -10, xMax = 10, yMin = -10, yMax = 10;
let selectedEquationIndex = -1;
let isDraggingEquation = false;
let dragStartX, dragStartY;

// 交点显示配置
let showIntersections = true;
let intersectionColor = '#ff00ff';
let intersectionSize = 6;

// 根据缩放级别确定小数位数
function getDecimalPlaces(scale) {
    if (scale >= 20) {
        return 2; // 放大时，显示2位小数
    } else if (scale >= 10) {
        return 1; // 中等缩放，显示1位小数
    } else {
        return 0; // 缩小时，显示整数（不显示小数点）
    }
}

// 格式化数字，确保整数不显示小数点
function formatNumber(value, decimalPlaces) {
    if (decimalPlaces === 0) {
        return Math.round(value).toString();
    } else {
        return value.toFixed(decimalPlaces);
    }
}

// 初始化
function init() {
    // 显示版本号
    document.getElementById('app-version').textContent = 'v' + APP_VERSION;
    
    canvas = document.getElementById('coordinate-system');
    ctx = canvas.getContext('2d');
    
    // 绘制初始坐标系
    drawCoordinateSystem();
    
    // 添加事件监听器
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // 触摸屏支持
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // 键盘Delete键删除选中的方程
    document.addEventListener('keydown', handleKeyDown);
    
    // 双击取消选中
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    // 加载保存的方程
    loadEquations();
    
    // 控制台显示版本信息
    console.log(`${APP_NAME} v${APP_VERSION} (${APP_BUILD_DATE})`);
    
    // 初始化Electron菜单事件监听
    initElectronMenuListeners();
}

// 初始化Electron菜单事件监听
function initElectronMenuListeners() {
    if (typeof window.electronAPI !== 'undefined') {
        // 导出图像
        window.electronAPI.onMenuExportImage(() => {
            exportImage();
        });
        
        // 重置视图
        window.electronAPI.onMenuResetView(() => {
            resetView();
        });
        
        // 切换网格
        window.electronAPI.onMenuToggleGrid(() => {
            document.getElementById('show-grid').checked = !showGrid;
            toggleGrid();
        });
        
        // 切换深色模式
        window.electronAPI.onMenuToggleDarkMode(() => {
            document.getElementById('dark-mode').checked = !darkMode;
            toggleDarkMode();
        });
        
        // 放大
        window.electronAPI.onMenuZoomIn(() => {
            scale *= 1.2;
            scale = Math.min(100, scale);
            drawCoordinateSystem();
        });
        
        // 缩小
        window.electronAPI.onMenuZoomOut(() => {
            scale *= 0.8;
            scale = Math.max(5, scale);
            drawCoordinateSystem();
        });
        
        // 全部显示
        window.electronAPI.onMenuShowAll(() => {
            showAllEquations();
        });
        
        // 全部隐藏
        window.electronAPI.onMenuHideAll(() => {
            hideAllEquations();
        });
        
        // 清空所有
        window.electronAPI.onMenuClearAll(() => {
            clearAllEquations();
        });
        
        // 切换帮助
        window.electronAPI.onMenuToggleHelp(() => {
            toggleHelp();
        });
    }
}

// 处理双击事件
function handleDoubleClick(e) {
    if (selectedEquationIndex >= 0) {
        selectedEquationIndex = -1;
        updateEquationsList();
        drawCoordinateSystem();
        canvas.style.cursor = 'crosshair';
    }
}

// 处理键盘事件
function handleKeyDown(e) {
    // Delete键删除选中的方程
    if (e.key === 'Delete' && selectedEquationIndex >= 0) {
        removeEquation(selectedEquationIndex);
        return;
    }
    
    // Ctrl/Cmd + A: 添加方程（聚焦到输入框）
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('formula').focus();
        return;
    }
    
    // Ctrl/Cmd + E: 导出图像
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportImage();
        return;
    }
    
    // Ctrl/Cmd + R: 重置视图
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetView();
        return;
    }
    
    // Ctrl/Cmd + 0: 重置缩放
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetView();
        return;
    }
    
    // Escape: 取消选中
    if (e.key === 'Escape') {
        if (selectedEquationIndex >= 0) {
            selectedEquationIndex = -1;
            updateEquationsList();
            drawCoordinateSystem();
        }
        // 关闭菜单
        document.getElementById('preset-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.add('hidden');
        return;
    }
    
    // 方向键微调选中的方程
    if (selectedEquationIndex >= 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 0.1; // Shift键加速
        switch (e.key) {
            case 'ArrowUp':
                updateEquationPosition(selectedEquationIndex, 0, step);
                break;
            case 'ArrowDown':
                updateEquationPosition(selectedEquationIndex, 0, -step);
                break;
            case 'ArrowLeft':
                updateEquationPosition(selectedEquationIndex, -step, 0);
                break;
            case 'ArrowRight':
                updateEquationPosition(selectedEquationIndex, step, 0);
                break;
        }
        drawCoordinateSystem();
        updateEquationsList();
    }
}

// 绘制坐标系
function drawCoordinateSystem() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置背景色
    if (darkMode) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (showGrid) {
        // 确定网格间距
        let gridSpacing = Math.max(20, scale);
        
        // 绘制网格
        ctx.strokeStyle = darkMode ? '#333' : '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        // 垂直线
        for (let x = 0; x < canvas.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y < canvas.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = darkMode ? '#888' : '#000';
    ctx.lineWidth = 2;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.stroke();
    
    // 绘制坐标轴标签
    ctx.fillStyle = darkMode ? '#ccc' : '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    let decimalPlaces = getDecimalPlaces(scale);
    let labelSpacing = Math.max(40, scale * 2);
    
    // X轴标签
    for (let x = offsetX; x < canvas.width; x += labelSpacing) {
        let value = (x - offsetX) / scale;
        ctx.fillText(formatNumber(value, decimalPlaces), x, offsetY + 15);
    }
    for (let x = offsetX; x > 0; x -= labelSpacing) {
        let value = (x - offsetX) / scale;
        ctx.fillText(formatNumber(value, decimalPlaces), x, offsetY + 15);
    }
    
    // Y轴标签
    ctx.textAlign = 'right';
    for (let y = offsetY; y > 0; y -= labelSpacing) {
        let value = (offsetY - y) / scale;
        ctx.fillText(formatNumber(value, decimalPlaces), offsetX - 5, y + 4);
    }
    for (let y = offsetY; y < canvas.height; y += labelSpacing) {
        let value = (offsetY - y) / scale;
        ctx.fillText(formatNumber(value, decimalPlaces), offsetX - 5, y + 4);
    }
    
    // 绘制原点
    ctx.fillText('O', offsetX - 10, offsetY + 15);
    
    // 绘制所有方程
    drawAllEquations();
    
    // 绘制交点
    if (showIntersections) {
        drawIntersections();
    }
}

// 解析公式
function parseFormula(formula) {
    formula = formula.replace(/\s/g, '');
    
    // 支持多种公式格式
    
    // 检查是否为微分公式 (deriv:expression 或 y=deriv(...))
    if (formula.startsWith('deriv:')) {
        let expression = formula.substring(6);
        return parseDerivativeEquation(expression);
    }
    
    // 检查是否为积分公式 (integ:expression:a:b)
    if (formula.startsWith('integ:')) {
        let parts = formula.substring(6).split(':');
        if (parts.length >= 3) {
            let expression = parts[0];
            let a = parseFloat(parts[1]);
            let b = parseFloat(parts[2]);
            return parseIntegralEquation(expression, a, b);
        }
        return null;
    }
    
    // 检查是否为 y=deriv(...) 格式
    if (formula.startsWith('y=deriv(') && formula.endsWith(')')) {
        let expression = formula.substring(8, formula.length - 1);
        return parseDerivativeEquation(expression);
    }
    
    // 检查是否为 y=integ(...) 格式 (y=integ(expression,a,b))
    if (formula.startsWith('y=integ(') && formula.endsWith(')')) {
        let content = formula.substring(8, formula.length - 1);
        let parts = content.split(',');
        if (parts.length >= 3) {
            let expression = parts[0];
            let a = parseFloat(parts[1]);
            let b = parseFloat(parts[2]);
            return parseIntegralEquation(expression, a, b);
        }
        return null;
    }
    
    if (!formula.startsWith('y=')) {
        return null;
    }
    
    let expression = formula.substring(2);
    
    // 检查是否为特殊函数（包含除法、嵌套函数或复杂组合）
    if (expression.includes('/') || 
        (expression.includes('sin(') && expression.includes('*')) ||
        (expression.includes('exp(') && expression.includes('*')) ||
        (expression.includes('sin(') && expression.includes('^')) ||
        expression.includes('sin(x^2)') || expression.includes('cos(x^2)') ||
        expression.includes('abs(sin(') || expression.includes('abs(cos(') || expression.includes('abs(tan(') ||
        expression.includes('sin(abs(') || expression.includes('cos(abs(') || expression.includes('tan(abs(') ||
        expression.includes('abs(exp(') || expression.includes('abs(log(') || expression.includes('abs(ln(')) {
        return parseSpecialEquation(expression);
    }
    
    // 检查是否为二次方程
    if (expression.includes('x^2') || expression.includes('x²')) {
        expression = expression.replace('x²', 'x^2');
        return parseQuadraticEquation(expression);
    }
    
    // 检查是否为幂函数
    if (expression.includes('x^')) {
        return parsePowerEquation(expression);
    }
    
    // 检查是否为指数函数
    if (expression.includes('exp(') || expression.includes('e^') || expression.includes('^x')) {
        return parseExponentialEquation(expression);
    }
    
    // 检查是否为对数函数
    if (expression.includes('log(') || expression.includes('ln(')) {
        return parseLogarithmicEquation(expression);
    }
    
    // 检查是否为反三角函数（必须在三角函数之前检查）
    if (expression.includes('arcsin(') || expression.includes('asin(') ||
        expression.includes('arccos(') || expression.includes('acos(') ||
        expression.includes('arctan(') || expression.includes('atan(')) {
        return parseInverseTrigonometricEquation(expression);
    }
    
    // 检查是否为三角函数
    if (expression.includes('sin(') || expression.includes('cos(') || expression.includes('tan(')) {
        return parseTrigonometricEquation(expression);
    }
    
    // 检查是否为双曲函数
    if (expression.includes('sinh(') || expression.includes('cosh(') || expression.includes('tanh(')) {
        return parseHyperbolicEquation(expression);
    }
    
    // 检查是否为绝对值函数
    if (expression.includes('abs(') || expression.includes('|')) {
        return parseAbsoluteEquation(expression);
    }
    
    // 检查是否为取整函数
    if (expression.includes('floor(') || expression.includes('ceil(') || expression.includes('round(')) {
        return parseRoundingEquation(expression);
    }
    
    // 默认为一次方程
    return parseLinearEquation(expression);
}

// 解析微分方程
function parseDerivativeEquation(expression) {
    return { type: 'derivative', expression: expression };
}

// 解析积分方程
function parseIntegralEquation(expression, a, b) {
    return { type: 'integral', expression: expression, a: a, b: b };
}

// 解析一次方程
function parseLinearEquation(expression) {
    let slope = 1;
    let intercept = 0;
    
    if (expression.includes('x')) {
        let parts = expression.split('x');
        if (parts[0] !== '') {
            slope = parseFloat(parts[0]);
        }
        if (parts[1] !== '') {
            intercept = parseFloat(parts[1]);
        }
    } else {
        intercept = parseFloat(expression);
        slope = 0;
    }
    
    return { type: 'linear', slope, intercept };
}

// 解析二次方程
function parseQuadraticEquation(expression) {
    let a = 1, b = 0, c = 0;
    
    let x2Index = expression.indexOf('x^2');
    if (x2Index > 0) {
        let aStr = expression.substring(0, x2Index);
        a = aStr === '' ? 1 : parseFloat(aStr);
    }
    
    let remaining = expression.substring(x2Index + 3);
    if (remaining.includes('x')) {
        let xIndex = remaining.indexOf('x');
        let bStr = remaining.substring(0, xIndex);
        b = bStr === '' ? 1 : parseFloat(bStr);
        let cStr = remaining.substring(xIndex + 1);
        c = cStr === '' ? 0 : parseFloat(cStr);
    } else {
        c = remaining === '' ? 0 : parseFloat(remaining);
    }
    
    return { type: 'quadratic', a, b, c };
}

// 解析幂函数
function parsePowerEquation(expression) {
    let xIndex = expression.indexOf('x^');
    let powerStr = expression.substring(xIndex + 2);
    let power = parseFloat(powerStr);
    
    let coeffStr = expression.substring(0, xIndex);
    let coefficient = coeffStr === '' ? 1 : parseFloat(coeffStr);
    
    // 添加频率和相位参数，默认为1和0
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    return { type: 'power', coefficient, power, frequency, phase, verticalShift };
}

// 解析指数函数
function parseExponentialEquation(expression) {
    // 添加频率和相位参数，默认为1和0
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('exp(')) {
        let startIndex = expression.indexOf('exp(') + 4;
        let endIndex = expression.indexOf(')', startIndex);
        let exponent = expression.substring(startIndex, endIndex);
        
        let coeffStr = expression.substring(0, expression.indexOf('exp('));
        let coefficient = coeffStr === '' ? 1 : parseFloat(coeffStr);
        
        return { type: 'exponential', base: 'e', exponent, coefficient, frequency, phase, verticalShift };
    } else if (expression.includes('e^')) {
        return { type: 'exponential', base: 'e', exponent: 'x', coefficient: 1, frequency, phase, verticalShift };
    } else if (expression.includes('^x')) {
        let baseIndex = expression.indexOf('^x');
        let baseStr = expression.substring(0, baseIndex);
        let base = parseFloat(baseStr);
        
        return { type: 'exponential', base, exponent: 'x', coefficient: 1, frequency, phase, verticalShift };
    }
    
    return null;
}

// 解析对数函数
function parseLogarithmicEquation(expression) {
    // 添加频率和相位参数，默认为1和0
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('ln(')) {
        let startIndex = expression.indexOf('ln(') + 3;
        let endIndex = expression.indexOf(')', startIndex);
        let argument = expression.substring(startIndex, endIndex);
        
        let coeffStr = expression.substring(0, expression.indexOf('ln('));
        let coefficient = coeffStr === '' ? 1 : parseFloat(coeffStr);
        
        return { type: 'logarithmic', base: 'e', argument, coefficient, frequency, phase, verticalShift };
    } else if (expression.includes('log10(')) {
        let startIndex = expression.indexOf('log10(') + 6;
        let endIndex = expression.indexOf(')', startIndex);
        let argument = expression.substring(startIndex, endIndex);
        
        return { type: 'logarithmic', base: 10, argument, coefficient: 1, frequency, phase, verticalShift };
    } else if (expression.includes('log(')) {
        let startIndex = expression.indexOf('log(') + 4;
        let endIndex = expression.indexOf(')', startIndex);
        let argument = expression.substring(startIndex, endIndex);
        
        let coeffStr = expression.substring(0, expression.indexOf('log('));
        let coefficient = coeffStr === '' ? 1 : parseFloat(coeffStr);
        
        return { type: 'logarithmic', base: 'e', argument, coefficient, frequency, phase, verticalShift };
    }
    
    return null;
}

// 解析三角函数方程
function parseTrigonometricEquation(expression) {
    let functionType = 'sin';
    let amplitude = 1;
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('sin(')) {
        functionType = 'sin';
    } else if (expression.includes('cos(')) {
        functionType = 'cos';
    } else if (expression.includes('tan(')) {
        functionType = 'tan';
    }
    
    let funcIndex = expression.indexOf(functionType + '(');
    let startIndex = funcIndex + functionType.length + 1;
    let endIndex = expression.indexOf(')', startIndex);
    let argument = expression.substring(startIndex, endIndex);
    
    // 解析振幅
    let ampStr = expression.substring(0, funcIndex);
    if (ampStr !== '') {
        amplitude = parseFloat(ampStr);
    }
    
    // 解析括号内的参数（频率和相位）
    // 支持格式：8x, 8x+8, 8x-8, x+8, x-8 等
    if (argument.includes('x')) {
        let xIndex = argument.indexOf('x');
        let freqStr = argument.substring(0, xIndex);
        if (freqStr !== '') {
            frequency = parseFloat(freqStr);
        }
        
        let phaseStr = argument.substring(xIndex + 1);
        if (phaseStr !== '') {
            phase = parseFloat(phaseStr);
        }
    }
    
    // 解析垂直位移
    let vertStr = expression.substring(endIndex + 1);
    if (vertStr !== '') {
        verticalShift = parseFloat(vertStr);
    }
    
    return { type: 'trigonometric', functionType, amplitude, frequency, phase, verticalShift };
}

// 解析反三角函数方程
function parseInverseTrigonometricEquation(expression) {
    let functionType = 'arcsin';
    let amplitude = 1;
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('arcsin(')) {
        functionType = 'arcsin';
    } else if (expression.includes('asin(')) {
        functionType = 'asin';
    } else if (expression.includes('arccos(')) {
        functionType = 'arccos';
    } else if (expression.includes('acos(')) {
        functionType = 'acos';
    } else if (expression.includes('arctan(')) {
        functionType = 'arctan';
    } else if (expression.includes('atan(')) {
        functionType = 'atan';
    }
    
    let funcIndex = expression.indexOf(functionType + '(');
    let startIndex = funcIndex + functionType.length + 1;
    let endIndex = expression.indexOf(')', startIndex);
    let argument = expression.substring(startIndex, endIndex);
    
    // 解析振幅
    let ampStr = expression.substring(0, funcIndex);
    if (ampStr !== '') {
        amplitude = parseFloat(ampStr);
    }
    
    // 解析括号内的参数（频率和相位）
    if (argument.includes('x')) {
        let xIndex = argument.indexOf('x');
        let freqStr = argument.substring(0, xIndex);
        if (freqStr !== '') {
            frequency = parseFloat(freqStr);
        }
        
        let phaseStr = argument.substring(xIndex + 1);
        if (phaseStr !== '') {
            phase = parseFloat(phaseStr);
        }
    }
    
    // 解析垂直位移
    let vertStr = expression.substring(endIndex + 1);
    if (vertStr !== '') {
        verticalShift = parseFloat(vertStr);
    }
    
    return { type: 'inverseTrigonometric', functionType, amplitude, frequency, phase, verticalShift };
}

// 解析双曲函数方程
function parseHyperbolicEquation(expression) {
    let functionType = 'sinh';
    let amplitude = 1;
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('sinh(')) {
        functionType = 'sinh';
    } else if (expression.includes('cosh(')) {
        functionType = 'cosh';
    } else if (expression.includes('tanh(')) {
        functionType = 'tanh';
    }
    
    let funcIndex = expression.indexOf(functionType + '(');
    let startIndex = funcIndex + functionType.length + 1;
    let endIndex = expression.indexOf(')', startIndex);
    let argument = expression.substring(startIndex, endIndex);
    
    // 解析振幅
    let ampStr = expression.substring(0, funcIndex);
    if (ampStr !== '') {
        amplitude = parseFloat(ampStr);
    }
    
    // 解析括号内的参数（频率和相位）
    if (argument.includes('x')) {
        let xIndex = argument.indexOf('x');
        let freqStr = argument.substring(0, xIndex);
        if (freqStr !== '') {
            frequency = parseFloat(freqStr);
        }
        
        let phaseStr = argument.substring(xIndex + 1);
        if (phaseStr !== '') {
            phase = parseFloat(phaseStr);
        }
    }
    
    // 解析垂直位移
    let vertStr = expression.substring(endIndex + 1);
    if (vertStr !== '') {
        verticalShift = parseFloat(vertStr);
    }
    
    return { type: 'hyperbolic', functionType, amplitude, frequency, phase, verticalShift };
}

// 解析绝对值函数方程
function parseAbsoluteEquation(expression) {
    let coefficient = 1;
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    // 处理 abs(x) 形式
    if (expression.includes('abs(')) {
        let startIndex = expression.indexOf('abs(') + 4;
        let endIndex = expression.indexOf(')', startIndex);
        let argument = expression.substring(startIndex, endIndex);
        
        let coeffStr = expression.substring(0, expression.indexOf('abs('));
        if (coeffStr !== '') {
            coefficient = parseFloat(coeffStr);
        }
        
        // 解析括号内的参数（频率和相位）
        if (argument.includes('x')) {
            let xIndex = argument.indexOf('x');
            let freqStr = argument.substring(0, xIndex);
            if (freqStr !== '') {
                frequency = parseFloat(freqStr);
            }
            
            let phaseStr = argument.substring(xIndex + 1);
            if (phaseStr !== '') {
                phase = parseFloat(phaseStr);
            }
        }
        
        let vertStr = expression.substring(endIndex + 1);
        if (vertStr !== '') {
            verticalShift = parseFloat(vertStr);
        }
    }
    // 处理 |x| 形式
    else if (expression.includes('|')) {
        let startIndex = expression.indexOf('|') + 1;
        let endIndex = expression.indexOf('|', startIndex);
        let argument = expression.substring(startIndex, endIndex);
        
        let coeffStr = expression.substring(0, expression.indexOf('|'));
        if (coeffStr !== '') {
            coefficient = parseFloat(coeffStr);
        }
        
        // 解析括号内的参数（频率和相位）
        if (argument.includes('x')) {
            let xIndex = argument.indexOf('x');
            let freqStr = argument.substring(0, xIndex);
            if (freqStr !== '') {
                frequency = parseFloat(freqStr);
            }
            
            let phaseStr = argument.substring(xIndex + 1);
            if (phaseStr !== '') {
                phase = parseFloat(phaseStr);
            }
        }
        
        let vertStr = expression.substring(endIndex + 1);
        if (vertStr !== '') {
            verticalShift = parseFloat(vertStr);
        }
    }
    
    return { type: 'absolute', coefficient, frequency, phase, verticalShift };
}

// 解析取整函数方程
function parseRoundingEquation(expression) {
    let functionType = 'floor';
    let coefficient = 1;
    let frequency = 1;
    let phase = 0;
    let verticalShift = 0;
    
    if (expression.includes('floor(')) {
        functionType = 'floor';
    } else if (expression.includes('ceil(')) {
        functionType = 'ceil';
    } else if (expression.includes('round(')) {
        functionType = 'round';
    }
    
    let funcIndex = expression.indexOf(functionType + '(');
    let startIndex = funcIndex + functionType.length + 1;
    let endIndex = expression.indexOf(')', startIndex);
    let argument = expression.substring(startIndex, endIndex);
    
    let coeffStr = expression.substring(0, funcIndex);
    if (coeffStr !== '') {
        coefficient = parseFloat(coeffStr);
    }
    
    // 解析括号内的参数（频率和相位）
    if (argument.includes('x')) {
        let xIndex = argument.indexOf('x');
        let freqStr = argument.substring(0, xIndex);
        if (freqStr !== '') {
            frequency = parseFloat(freqStr);
        }
        
        let phaseStr = argument.substring(xIndex + 1);
        if (phaseStr !== '') {
            phase = parseFloat(phaseStr);
        }
    }
    
    let vertStr = expression.substring(endIndex + 1);
    if (vertStr !== '') {
        verticalShift = parseFloat(vertStr);
    }
    
    return { type: 'rounding', functionType, coefficient, frequency, phase, verticalShift };
}

// 解析特殊函数方程
function parseSpecialEquation(expression) {
    return { type: 'special', expression: expression };
}

// 格式化方程显示
function formatEquation(parsed) {
    let display = 'y=';
    
    switch (parsed.type) {
        case 'linear':
            // y = slope*x + intercept
            if (parsed.slope !== 0) {
                if (Math.abs(parsed.slope) !== 1) {
                    display += parsed.slope;
                } else if (parsed.slope === -1) {
                    display += '-';
                }
                display += 'x';
            }
            if (parsed.intercept !== 0) {
                if (parsed.intercept > 0 && parsed.slope !== 0) {
                    display += '+';
                }
                display += parsed.intercept;
            }
            if (parsed.slope === 0 && parsed.intercept === 0) {
                display += '0';
            }
            break;
            
        case 'quadratic':
            // y = a*x² + b*x + c
            if (parsed.a !== 0) {
                if (Math.abs(parsed.a) !== 1) {
                    display += parsed.a;
                } else if (parsed.a === -1) {
                    display += '-';
                }
                display += 'x²';
            }
            if (parsed.b !== 0) {
                if (parsed.b > 0 && parsed.a !== 0) {
                    display += '+';
                }
                if (Math.abs(parsed.b) !== 1) {
                    display += parsed.b;
                } else if (parsed.b === -1) {
                    display += '-';
                }
                display += 'x';
            }
            if (parsed.c !== 0) {
                if (parsed.c > 0 && (parsed.a !== 0 || parsed.b !== 0)) {
                    display += '+';
                }
                display += parsed.c;
            }
            if (parsed.a === 0 && parsed.b === 0 && parsed.c === 0) {
                display += '0';
            }
            break;
            
        case 'power':
            // y = coefficient * x^power + verticalShift
            if (parsed.coefficient !== 0) {
                if (Math.abs(parsed.coefficient) !== 1) {
                    display += parsed.coefficient;
                } else if (parsed.coefficient === -1) {
                    display += '-';
                }
                display += 'x';
                if (parsed.power !== 1) {
                    display += `^${parsed.power}`;
                }
            }
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0 && parsed.coefficient !== 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'exponential':
            // y = coefficient * base^x + verticalShift
            if (parsed.base === 'e') {
                display += 'exp(x)';
            } else {
                display += `${parsed.base}^x`;
            }
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'logarithmic':
            // y = coefficient * log(x) + verticalShift
            if (parsed.base === 'e') {
                display += 'ln(x)';
            } else {
                display += 'log₁₀(x)';
            }
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'trigonometric':
            // y = amplitude * sin(frequency*x + phase) + verticalShift
            display += parsed.functionType + '(x)';
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'inverseTrigonometric':
            // y = amplitude * arcsin(x) + verticalShift
            display += parsed.functionType + '(x)';
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'hyperbolic':
            // y = amplitude * sinh(x) + verticalShift
            display += parsed.functionType + '(x)';
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'absolute':
            // y = coefficient * |x| + verticalShift
            if (parsed.coefficient !== 1) {
                display += parsed.coefficient;
            }
            display += '|x|';
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'rounding':
            // y = coefficient * floor(x) + verticalShift
            if (parsed.coefficient !== 1) {
                display += parsed.coefficient;
            }
            display += parsed.functionType + '(x)';
            if (parsed.verticalShift && parsed.verticalShift !== 0) {
                if (parsed.verticalShift > 0) {
                    display += '+';
                }
                display += parsed.verticalShift;
            }
            break;
            
        case 'special':
            display += parsed.expression;
            break;
            
        case 'derivative':
            display += `d/dx(${parsed.expression})`;
            break;
            
        case 'integral':
            display += `∫[${parsed.a},${parsed.b}] ${parsed.expression} dx`;
            break;
    }
    
    return display;
}

// 添加方程
function addFormula() {
    let formula = document.getElementById('formula').value;
    let color = document.getElementById('line-color').value;
    let style = document.getElementById('line-style').value;
    
    let parsed = parseFormula(formula);
    if (!parsed) {
        alert('请输入正确的公式格式，例如: y=2x+1, y=x^2, y=sin(x)');
        return;
    }
    
    let equation = {
        formula: formula,
        parsed: parsed,
        color: color,
        style: style,
        visible: true
    };
    
    equations.push(equation);
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 绘制所有方程
function drawAllEquations() {
    equations.forEach((equation, index) => {
        if (equation.visible) {
            drawEquation(equation, index);
        }
    });
}

// 计算方程与坐标轴的交点
function calculateAxisIntersections(parsed) {
    let intersections = [];
    
    // 与Y轴的交点 (x = 0)
    let yIntercept = calculateEquationY(parsed, 0);
    if (isFinite(yIntercept)) {
        intersections.push({ x: 0, y: yIntercept, type: 'y-axis' });
    }
    
    // 与X轴的交点 (y = 0) - 使用数值方法求解
    // 在可视范围内搜索符号变化
    let xStart = -offsetX / scale;
    let xEnd = (canvas.width - offsetX) / scale;
    let step = (xEnd - xStart) / 1000;
    
    let prevX = xStart;
    let prevY = calculateEquationY(parsed, prevX);
    
    for (let x = xStart + step; x <= xEnd; x += step) {
        let y = calculateEquationY(parsed, x);
        
        // 检查是否穿过X轴（符号变化）
        if (isFinite(prevY) && isFinite(y) && prevY * y < 0) {
            // 使用二分法精确定位
            let root = findRootBisection(parsed, prevX, x, prevY, y);
            if (root !== null) {
                intersections.push({ x: root, y: 0, type: 'x-axis' });
            }
        }
        
        // 检查是否正好在X轴上
        if (isFinite(y) && Math.abs(y) < 0.0001) {
            intersections.push({ x: x, y: 0, type: 'x-axis' });
        }
        
        prevX = x;
        prevY = y;
    }
    
    return intersections;
}

// 二分法求根
function findRootBisection(parsed, a, b, fa, fb) {
    let tolerance = 0.0001;
    let maxIterations = 50;
    
    for (let i = 0; i < maxIterations; i++) {
        let mid = (a + b) / 2;
        let fmid = calculateEquationY(parsed, mid);
        
        if (!isFinite(fmid)) break;
        
        if (Math.abs(fmid) < tolerance) {
            return mid;
        }
        
        if (fa * fmid < 0) {
            b = mid;
            fb = fmid;
        } else {
            a = mid;
            fa = fmid;
        }
    }
    
    return (a + b) / 2;
}

// 计算两条线的交点
function calculateLineIntersections(parsed1, parsed2) {
    let intersections = [];
    
    // 在可视范围内采样，寻找接近的点
    let xStart = -offsetX / scale;
    let xEnd = (canvas.width - offsetX) / scale;
    let step = (xEnd - xStart) / 500;
    
    let minDistance = Infinity;
    let bestX = null;
    let bestY = null;
    
    for (let x = xStart; x <= xEnd; x += step) {
        let y1 = calculateEquationY(parsed1, x);
        let y2 = calculateEquationY(parsed2, x);
        
        if (!isFinite(y1) || !isFinite(y2)) continue;
        
        let distance = Math.abs(y1 - y2);
        
        if (distance < minDistance) {
            minDistance = distance;
            bestX = x;
            bestY = (y1 + y2) / 2;
        }
    }
    
    // 如果找到足够接近的交点，使用牛顿法精确化
    if (minDistance < step * 10) {
        let refined = refineIntersection(parsed1, parsed2, bestX);
        if (refined !== null) {
            intersections.push(refined);
        }
    }
    
    return intersections;
}

// 使用牛顿法精确定位交点
function refineIntersection(parsed1, parsed2, initialX) {
    let x = initialX;
    let tolerance = 0.0001;
    let maxIterations = 50;
    
    for (let i = 0; i < maxIterations; i++) {
        let y1 = calculateEquationY(parsed1, x);
        let y2 = calculateEquationY(parsed2, x);
        
        if (!isFinite(y1) || !isFinite(y2)) return null;
        
        let diff = y1 - y2;
        
        if (Math.abs(diff) < tolerance) {
            return { x: x, y: y1, type: 'line-line' };
        }
        
        // 数值计算导数
        let h = 0.0001;
        let dy1 = calculateEquationY(parsed1, x + h) - y1;
        let dy2 = calculateEquationY(parsed2, x + h) - y2;
        let derivative = (dy1 - dy2) / h;
        
        if (Math.abs(derivative) < 0.0001) break;
        
        x = x - diff / derivative;
    }
    
    let finalY = calculateEquationY(parsed1, x);
    if (isFinite(finalY)) {
        return { x: x, y: finalY, type: 'line-line' };
    }
    
    return null;
}

// 绘制交点
function drawIntersections() {
    let allIntersections = [];
    
    // 收集所有可见方程与坐标轴的交点
    equations.forEach((equation, index) => {
        if (!equation.visible) return;
        
        let axisIntersections = calculateAxisIntersections(equation.parsed);
        axisIntersections.forEach(intersection => {
            intersection.equationIndex = index;
            allIntersections.push(intersection);
        });
    });
    
    // 收集所有可见方程之间的交点
    for (let i = 0; i < equations.length; i++) {
        if (!equations[i].visible) continue;
        
        for (let j = i + 1; j < equations.length; j++) {
            if (!equations[j].visible) continue;
            
            let lineIntersections = calculateLineIntersections(equations[i].parsed, equations[j].parsed);
            lineIntersections.forEach(intersection => {
                intersection.equationIndex1 = i;
                intersection.equationIndex2 = j;
                allIntersections.push(intersection);
            });
        }
    }
    
    // 去重（避免绘制重叠的交点）
    let uniqueIntersections = [];
    let tolerance = 5 / scale; // 像素容差转换为坐标单位
    
    allIntersections.forEach(intersection => {
        let isDuplicate = uniqueIntersections.some(existing => {
            return Math.abs(existing.x - intersection.x) < tolerance &&
                   Math.abs(existing.y - intersection.y) < tolerance;
        });
        
        if (!isDuplicate) {
            uniqueIntersections.push(intersection);
        }
    });
    
    // 绘制所有交点
    uniqueIntersections.forEach(intersection => {
        drawIntersectionPoint(intersection);
    });
}

// 绘制单个交点
function drawIntersectionPoint(intersection) {
    let canvasX = offsetX + intersection.x * scale;
    let canvasY = offsetY - intersection.y * scale;
    
    // 检查是否在画布范围内
    if (canvasX < 0 || canvasX > canvas.width || canvasY < 0 || canvasY > canvas.height) {
        return;
    }
    
    // 保存当前绘图状态
    ctx.save();
    
    // 绘制交点（圆形）
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, intersectionSize, 0, 2 * Math.PI);
    ctx.fillStyle = intersectionColor;
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = darkMode ? '#fff' : '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制坐标标签
    ctx.fillStyle = darkMode ? '#fff' : '#000';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    let label = `(${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`;
    let labelX = canvasX + intersectionSize + 2;
    let labelY = canvasY - intersectionSize - 2;
    
    // 确保标签不超出画布
    if (labelX + 80 > canvas.width) {
        labelX = canvasX - intersectionSize - 82;
        ctx.textAlign = 'right';
    }
    if (labelY < 15) {
        labelY = canvasY + intersectionSize + 12;
        ctx.textBaseline = 'top';
    }
    
    ctx.fillText(label, labelX, labelY);
    
    ctx.restore();
}

// 绘制单个方程
function drawEquation(equation, index) {
    ctx.beginPath();
    ctx.strokeStyle = equation.color;
    ctx.lineWidth = index === selectedEquationIndex ? 5 : 3;
    
    // 选中方程时添加发光效果
    if (index === selectedEquationIndex) {
        ctx.shadowColor = equation.color;
        ctx.shadowBlur = 10;
    }
    
    // 设置线条样式
    if (equation.style === 'dashed') {
        ctx.setLineDash([10, 5]);
    } else if (equation.style === 'dotted') {
        ctx.setLineDash([3, 3]);
    } else {
        ctx.setLineDash([]);
    }
    
    switch (equation.parsed.type) {
        case 'linear':
            drawLinearEquation(equation.parsed);
            break;
        case 'quadratic':
            drawQuadraticEquation(equation.parsed);
            break;
        case 'power':
            drawPowerEquation(equation.parsed);
            break;
        case 'exponential':
            drawExponentialEquation(equation.parsed);
            break;
        case 'logarithmic':
            drawLogarithmicEquation(equation.parsed);
            break;
        case 'trigonometric':
            drawTrigonometricEquation(equation.parsed);
            break;
        case 'inverseTrigonometric':
            drawInverseTrigonometricEquation(equation.parsed);
            break;
        case 'hyperbolic':
            drawHyperbolicEquation(equation.parsed);
            break;
        case 'absolute':
            drawAbsoluteEquation(equation.parsed);
            break;
        case 'rounding':
            drawRoundingEquation(equation.parsed);
            break;
        case 'special':
            drawSpecialEquation(equation.parsed);
            break;
        case 'derivative':
            drawDerivativeEquation(equation.parsed);
            break;
        case 'integral':
            drawIntegralEquation(equation.parsed);
            break;
    }
    
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

// 绘制一次方程
function drawLinearEquation(parsed) {
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY = parsed.slope * realX + parsed.intercept;
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制二次方程
function drawQuadraticEquation(parsed) {
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY = parsed.a * realX * realX + parsed.b * realX + parsed.c;
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制幂函数
function drawPowerEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        // 应用相位变换
        let transformedX = realX - phase;
        
        if (transformedX < 0 && parsed.power % 1 !== 0) {
            continue;
        }
        
        realY = parsed.coefficient * Math.pow(transformedX, parsed.power) + verticalShift;
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制指数函数
function drawExponentialEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        // 应用相位变换
        let transformedX = realX - phase;
        
        if (parsed.base === 'e') {
            realY = parsed.coefficient * Math.exp(transformedX) + verticalShift;
        } else {
            realY = parsed.coefficient * Math.pow(parsed.base, transformedX) + verticalShift;
        }
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制对数函数
function drawLogarithmicEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        
        // 应用相位变换
        let transformedX = realX - phase;
        
        if (transformedX <= 0) continue;
        
        let realY;
        if (parsed.base === 'e') {
            realY = parsed.coefficient * Math.log(transformedX) + verticalShift;
        } else {
            realY = parsed.coefficient * Math.log10(transformedX) + verticalShift;
        }
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制三角函数方程
function drawTrigonometricEquation(parsed) {
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        switch (parsed.functionType) {
            case 'sin':
                realY = parsed.amplitude * Math.sin(parsed.frequency * realX + parsed.phase) + parsed.verticalShift;
                break;
            case 'cos':
                realY = parsed.amplitude * Math.cos(parsed.frequency * realX + parsed.phase) + parsed.verticalShift;
                break;
            case 'tan':
                realY = parsed.amplitude * Math.tan(parsed.frequency * realX + parsed.phase) + parsed.verticalShift;
                break;
        }
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            if (parsed.functionType === 'tan') {
                let prevX = (x - 1 - offsetX) / scale;
                let prevY = parsed.amplitude * Math.tan(parsed.frequency * prevX + parsed.phase) + parsed.verticalShift;
                let prevCanvasY = offsetY - prevY * scale;
                
                if (Math.abs(y - prevCanvasY) < 100) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }
            } else {
                ctx.lineTo(x, y);
            }
        }
    }
    ctx.stroke();
}

// 绘制反三角函数方程
function drawInverseTrigonometricEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let frequency = parsed.frequency || 1;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        // 应用频率和相位变换
        let transformedX = frequency * realX + phase;
        
        // 检查定义域
        if (parsed.functionType === 'arcsin' || parsed.functionType === 'arccos') {
            if (transformedX < -1 || transformedX > 1) continue;
        }
        
        switch (parsed.functionType) {
            case 'arcsin':
                realY = parsed.amplitude * Math.asin(transformedX) + verticalShift;
                break;
            case 'arccos':
                realY = parsed.amplitude * Math.acos(transformedX) + verticalShift;
                break;
            case 'arctan':
                realY = parsed.amplitude * Math.atan(transformedX) + verticalShift;
                break;
        }
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制双曲函数方程
function drawHyperbolicEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let frequency = parsed.frequency || 1;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        // 应用频率和相位变换
        let transformedX = frequency * realX + phase;
        
        switch (parsed.functionType) {
            case 'sinh':
                realY = parsed.amplitude * Math.sinh(transformedX) + verticalShift;
                break;
            case 'cosh':
                realY = parsed.amplitude * Math.cosh(transformedX) + verticalShift;
                break;
            case 'tanh':
                realY = parsed.amplitude * Math.tanh(transformedX) + verticalShift;
                break;
        }
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制绝对值函数方程
function drawAbsoluteEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let frequency = parsed.frequency || 1;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        
        // 应用频率和相位变换
        let transformedX = frequency * realX + phase;
        
        let realY = parsed.coefficient * Math.abs(transformedX) + verticalShift;
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制取整函数方程
function drawRoundingEquation(parsed) {
    let verticalShift = parsed.verticalShift || 0;
    let frequency = parsed.frequency || 1;
    let phase = parsed.phase || 0;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY;
        
        // 应用频率和相位变换
        let transformedX = frequency * realX + phase;
        
        switch (parsed.functionType) {
            case 'floor':
                realY = parsed.coefficient * Math.floor(transformedX) + verticalShift;
                break;
            case 'ceil':
                realY = parsed.coefficient * Math.ceil(transformedX) + verticalShift;
                break;
            case 'round':
                realY = parsed.coefficient * Math.round(transformedX) + verticalShift;
                break;
        }
        
        if (!isFinite(realY)) continue;
        
        let y = offsetY - realY * scale;
        
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

// 绘制特殊函数方程
function drawSpecialEquation(parsed) {
    let expression = parsed.expression;
    let prevY = null;
    let isFirstPoint = true;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY = null;
        
        try {
            realY = evaluateSpecialExpression(expression, realX);
        } catch (e) {
            prevY = null;
            isFirstPoint = true;
            continue;
        }
        
        if (realY === null || !isFinite(realY)) {
            prevY = null;
            isFirstPoint = true;
            continue;
        }
        
        let y = offsetY - realY * scale;
        
        // 检测不连续点（如渐近线）
        if (prevY !== null && Math.abs(y - prevY) > canvas.height / 2) {
            ctx.stroke();
            ctx.beginPath();
            isFirstPoint = true;
        }
        
        if (isFirstPoint) {
            ctx.moveTo(x, y);
            isFirstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
        
        prevY = y;
    }
    ctx.stroke();
}

// 计算特殊表达式
function evaluateSpecialExpression(expression, x) {
    // 替换常见数学函数和常量
    let expr = expression
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/log10\(/g, 'Math.log10(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceil\(/g, 'Math.ceil(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/sinh\(/g, 'Math.sinh(')
        .replace(/cosh\(/g, 'Math.cosh(')
        .replace(/tanh\(/g, 'Math.tanh(')
        .replace(/asin\(/g, 'Math.asin(')
        .replace(/acos\(/g, 'Math.acos(')
        .replace(/atan\(/g, 'Math.atan(')
        .replace(/arcsin\(/g, 'Math.asin(')
        .replace(/arccos\(/g, 'Math.acos(')
        .replace(/arctan\(/g, 'Math.atan(')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![xp])/g, 'Math.E');
    
    // 处理幂运算 x^n
    expr = expr.replace(/x\^([0-9.+\-*/()]+)/g, 'Math.pow(x,$1)');
    
    // 处理 2^x, 10^x 等形式
    expr = expr.replace(/([0-9.]+)\^x/g, 'Math.pow($1,x)');
    expr = expr.replace(/\(([^)]+)\)\^x/g, 'Math.pow($1,x)');
    
    // 处理 e^x
    expr = expr.replace(/Math\.E\^x/g, 'Math.exp(x)');
    
    try {
        return Function('x', 'return ' + expr)(x);
    } catch (e) {
        return null;
    }
}

// 绘制微分方程（导数曲线）
function drawDerivativeEquation(parsed) {
    let expression = parsed.expression;
    let h = 0.0001; // 微小增量用于数值微分
    let prevY = null;
    let isFirstPoint = true;
    let currentStrokeStyle = ctx.strokeStyle;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        
        // 数值微分：f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
        let fPlus = evaluateSpecialExpression(expression, realX + h);
        let fMinus = evaluateSpecialExpression(expression, realX - h);
        
        if (fPlus === null || fMinus === null || !isFinite(fPlus) || !isFinite(fMinus)) {
            prevY = null;
            isFirstPoint = true;
            continue;
        }
        
        let derivative = (fPlus - fMinus) / (2 * h);
        
        if (!isFinite(derivative)) {
            prevY = null;
            isFirstPoint = true;
            continue;
        }
        
        let y = offsetY - derivative * scale;
        
        // 检测不连续点
        if (prevY !== null && Math.abs(y - prevY) > canvas.height / 2) {
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = currentStrokeStyle;
            isFirstPoint = true;
        }
        
        if (isFirstPoint) {
            ctx.moveTo(x, y);
            isFirstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
        
        prevY = y;
    }
    ctx.stroke();
}

// 绘制积分方程（定积分面积）
function drawIntegralEquation(parsed) {
    let expression = parsed.expression;
    let a = parsed.a;
    let b = parsed.b;
    
    // 保存当前线条样式
    let currentStrokeStyle = ctx.strokeStyle;
    let currentLineWidth = ctx.lineWidth;
    let currentLineDash = ctx.getLineDash();
    
    // 先绘制填充区域
    ctx.beginPath();
    ctx.fillStyle = currentStrokeStyle + '40'; // 添加透明度
    ctx.globalAlpha = 0.3;
    
    // 转换积分区间到画布坐标
    let startX = offsetX + a * scale;
    let endX = offsetX + b * scale;
    
    // 确保起点在画布范围内
    startX = Math.max(0, Math.min(canvas.width, startX));
    endX = Math.max(0, Math.min(canvas.width, endX));
    
    // 绘制填充区域
    if (startX < endX) {
        ctx.moveTo(startX, offsetY);
        
        for (let x = startX; x <= endX; x += 1) {
            let realX = (x - offsetX) / scale;
            let realY = evaluateSpecialExpression(expression, realX);
            
            if (realY !== null && isFinite(realY)) {
                let y = offsetY - realY * scale;
                ctx.lineTo(x, y);
            }
        }
        
        ctx.lineTo(endX, offsetY);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    
    // 绘制积分区间边界线
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    
    // 左边界
    let leftX = offsetX + a * scale;
    if (leftX >= 0 && leftX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(leftX, 0);
        ctx.lineTo(leftX, canvas.height);
        ctx.stroke();
    }
    
    // 右边界
    let rightX = offsetX + b * scale;
    if (rightX >= 0 && rightX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(rightX, 0);
        ctx.lineTo(rightX, canvas.height);
        ctx.stroke();
    }
    
    // 恢复线条样式
    ctx.setLineDash(currentLineDash);
    ctx.lineWidth = currentLineWidth;
    ctx.strokeStyle = currentStrokeStyle;
    
    // 绘制原函数曲线
    ctx.beginPath();
    let isFirstPoint = true;
    let prevY = null;
    
    for (let x = 0; x < canvas.width; x += 1) {
        let realX = (x - offsetX) / scale;
        let realY = evaluateSpecialExpression(expression, realX);
        
        if (realY === null || !isFinite(realY)) {
            prevY = null;
            isFirstPoint = true;
            continue;
        }
        
        let y = offsetY - realY * scale;
        
        if (prevY !== null && Math.abs(y - prevY) > canvas.height / 2) {
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = currentStrokeStyle;
            isFirstPoint = true;
        }
        
        if (isFirstPoint) {
            ctx.moveTo(x, y);
            isFirstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
        
        prevY = y;
    }
    ctx.stroke();
    
    // 计算并显示积分值
    let integralValue = calculateIntegral(expression, a, b);
    if (integralValue !== null) {
        // 在积分区域上方显示积分值
        let midX = (startX + endX) / 2;
        let displayY = Math.min(30, offsetY - 20);
        
        ctx.fillStyle = darkMode ? '#fff' : '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`∫ = ${integralValue.toFixed(4)}`, midX, displayY);
    }
}

// 数值积分（辛普森法则）
function calculateIntegral(expression, a, b) {
    let n = 1000; // 分割数
    let h = (b - a) / n;
    let sum = 0;
    
    for (let i = 0; i <= n; i++) {
        let x = a + i * h;
        let y = evaluateSpecialExpression(expression, x);
        
        if (y === null || !isFinite(y)) {
            continue;
        }
        
        if (i === 0 || i === n) {
            sum += y;
        } else if (i % 2 === 0) {
            sum += 2 * y;
        } else {
            sum += 4 * y;
        }
    }
    
    return (h / 3) * sum;
}

// 生成方程编辑器HTML - 垂直紧凑布局
function generateEquationEditor(equation, index) {
    let parsed = equation.parsed;
    let html = '<div class="equation-editor">';
    
    // 第一行：显示公式类型
    switch (parsed.type) {
        case 'linear':
            html += '<div class="equation-formula-row">y = k(x-x₀)+y₀</div>';
            break;
        case 'quadratic':
            html += '<div class="equation-formula-row">y = a(x-x₀)²+y₀</div>';
            break;
        case 'trigonometric':
            html += `<div class="equation-formula-row">y = A·${parsed.functionType}(ωx+φ)+c</div>`;
            break;
        case 'inverseTrigonometric':
            html += `<div class="equation-formula-row">y = A·${parsed.functionType}(ωx+φ)+c</div>`;
            break;
        case 'hyperbolic':
            html += `<div class="equation-formula-row">y = A·${parsed.functionType}(ωx+φ)+c</div>`;
            break;
        case 'power':
            html += '<div class="equation-formula-row">y = k·(x-φ)ⁿ+c</div>';
            break;
        case 'exponential':
            html += '<div class="equation-formula-row">y = k·a^(x-φ)+c</div>';
            break;
        case 'logarithmic':
            html += '<div class="equation-formula-row">y = k·log(x-φ)+c</div>';
            break;
        case 'absolute':
            html += '<div class="equation-formula-row">y = k·|ωx+φ|+c</div>';
            break;
        case 'rounding':
            html += `<div class="equation-formula-row">y = k·${parsed.functionType}(ωx+φ)+c</div>`;
            break;
        case 'special':
            html += `<div class="equation-formula-row">${equation.formula}</div>`;
            break;
        case 'derivative':
            html += `<div class="equation-formula-row">d/dx(${parsed.expression})</div>`;
            break;
        case 'integral':
            html += `<div class="equation-formula-row">∫[${parsed.a},${parsed.b}] ${parsed.expression} dx</div>`;
            break;
        default:
            html += `<div class="equation-formula-row">${equation.formula}</div>`;
    }
    
    // 第二行：参数输入
    html += '<div class="equation-params-row">';
    
    switch (parsed.type) {
        case 'linear':
            // 使用顶点式参数：y = k(x-x₀)+y₀，其中(x₀,y₀)是直线上一点
            // 默认使用(0, b)作为点，即y = kx + b
            let linearX0 = 0;
            let linearY0 = parsed.intercept;
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.slope}" onchange="updateEquationParam(${index}, 'slope', this.value)" title="斜率"></div>`;
            html += `<div class="param-group"><span class="param-label">x₀:</span><input type="number" class="param-input" value="${linearX0}" onchange="updateLinearVertex(${index}, 'x0', this.value)" title="x坐标"></div>`;
            html += `<div class="param-group"><span class="param-label">y₀:</span><input type="number" class="param-input" value="${linearY0}" onchange="updateLinearVertex(${index}, 'y0', this.value)" title="y坐标"></div>`;
            break;
            
        case 'quadratic':
            // 使用顶点式参数：y = a(x-x₀)²+y₀
            let quadX0 = -parsed.b / (2 * parsed.a);
            let quadY0 = parsed.c - parsed.b * parsed.b / (4 * parsed.a);
            html += `<div class="param-group"><span class="param-label">a:</span><input type="number" class="param-input" value="${parsed.a}" onchange="updateEquationParam(${index}, 'a', this.value)" title="开口"></div>`;
            html += `<div class="param-group"><span class="param-label">x₀:</span><input type="number" class="param-input" value="${Math.round(quadX0 * 100) / 100}" onchange="updateQuadraticVertex(${index}, 'x0', this.value)" title="顶点x"></div>`;
            html += `<div class="param-group"><span class="param-label">y₀:</span><input type="number" class="param-input" value="${Math.round(quadY0 * 100) / 100}" onchange="updateQuadraticVertex(${index}, 'y0', this.value)" title="顶点y"></div>`;
            break;
            
        case 'trigonometric':
            html += `<div class="param-group"><span class="param-label">A:</span><input type="number" class="param-input" value="${parsed.amplitude}" onchange="updateEquationParam(${index}, 'amplitude', this.value)" title="振幅"></div>`;
            html += `<div class="param-group"><span class="param-label">ω:</span><input type="number" class="param-input" value="${parsed.frequency}" onchange="updateEquationParam(${index}, 'frequency', this.value)" title="频率"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;
            
        case 'inverseTrigonometric':
        case 'hyperbolic':
            html += `<div class="param-group"><span class="param-label">A:</span><input type="number" class="param-input" value="${parsed.amplitude}" onchange="updateEquationParam(${index}, 'amplitude', this.value)" title="振幅"></div>`;
            html += `<div class="param-group"><span class="param-label">ω:</span><input type="number" class="param-input" value="${parsed.frequency}" onchange="updateEquationParam(${index}, 'frequency', this.value)" title="频率"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;
            
        case 'power':
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.coefficient}" onchange="updateEquationParam(${index}, 'coefficient', this.value)" title="系数"></div>`;
            html += `<div class="param-group"><span class="param-label">n:</span><input type="number" class="param-input" value="${parsed.power}" onchange="updateEquationParam(${index}, 'power', this.value)" title="指数"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;

        case 'exponential':
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.coefficient}" onchange="updateEquationParam(${index}, 'coefficient', this.value)" title="系数"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;

        case 'logarithmic':
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.coefficient}" onchange="updateEquationParam(${index}, 'coefficient', this.value)" title="系数"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;
            
        case 'absolute':
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.coefficient}" onchange="updateEquationParam(${index}, 'coefficient', this.value)" title="系数"></div>`;
            html += `<div class="param-group"><span class="param-label">ω:</span><input type="number" class="param-input" value="${parsed.frequency}" onchange="updateEquationParam(${index}, 'frequency', this.value)" title="频率"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;
            
        case 'rounding':
            html += `<div class="param-group"><span class="param-label">k:</span><input type="number" class="param-input" value="${parsed.coefficient}" onchange="updateEquationParam(${index}, 'coefficient', this.value)" title="系数"></div>`;
            html += `<div class="param-group"><span class="param-label">ω:</span><input type="number" class="param-input" value="${parsed.frequency}" onchange="updateEquationParam(${index}, 'frequency', this.value)" title="频率"></div>`;
            html += `<div class="param-group"><span class="param-label">φ:</span><input type="number" class="param-input" value="${parsed.phase}" onchange="updateEquationParam(${index}, 'phase', this.value)" title="相位"></div>`;
            html += `<div class="param-group"><span class="param-label">c:</span><input type="number" class="param-input" value="${parsed.verticalShift || 0}" onchange="updateEquationParam(${index}, 'verticalShift', this.value)" title="位移"></div>`;
            break;
            
        case 'special':
            html += `<input type="text" class="equation-input-full" value="${equation.formula}" onchange="updateEquationFromInput(${index}, this.value)">`;
            break;
            
        case 'derivative':
            html += `<input type="text" class="equation-input-full" value="${equation.formula}" onchange="updateEquationFromInput(${index}, this.value)">`;
            break;
            
        case 'integral':
            html += `<input type="text" class="equation-input-full" value="${equation.formula}" onchange="updateEquationFromInput(${index}, this.value)">`;
            break;
            
        default:
            html += `<input type="text" class="equation-input-full" value="${equation.formula}" onchange="updateEquationFromInput(${index}, this.value)">`;
    }
    
    html += '</div></div>';
    return html;
}

// 更新方程列表
function updateEquationsList() {
    let container = document.getElementById('equations-container');
    container.innerHTML = '';
    
    equations.forEach((equation, index) => {
        let item = document.createElement('div');
        item.className = 'equation-item';
        if (index === selectedEquationIndex) {
            item.classList.add('selected');
        }
        if (!equation.visible) {
            item.classList.add('hidden-equation');
        }
        
        // 生成方程编辑器
        let equationEditor = generateEquationEditor(equation, index);
        
        item.innerHTML = `
            <div class="equation-row">
                <span class="visibility-btn ${equation.visible ? 'visible' : 'hidden'}" onclick="toggleEquationVisibility(${index})" title="${equation.visible ? '隐藏' : '显示'}">
                    ${equation.visible ? '👁' : '🚫'}
                </span>
                ${equationEditor}
                <span class="remove-btn" onclick="removeEquation(${index})" title="删除">×</span>
            </div>
        `;
        
        // 点击方程项选中/取消选中
        item.addEventListener('click', function(e) {
            // 如果点击的是输入框或删除按钮，不触发选中
            if (e.target.tagName === 'INPUT' || 
                e.target.classList.contains('remove-btn')) {
                return;
            }
            
            // 切换选中状态
            if (selectedEquationIndex === index) {
                selectedEquationIndex = -1; // 取消选中
            } else {
                selectedEquationIndex = index; // 选中
            }
            updateEquationsList();
            drawCoordinateSystem();
        });
        
        container.appendChild(item);
    });
}

// 从输入框更新方程
function updateEquationFromInput(index, newFormula) {
    let equation = equations[index];
    let oldFormula = equation.formula;
    
    // 解析新公式
    let parsed = parseFormula(newFormula);
    if (!parsed) {
        alert('公式格式错误：' + newFormula + '\n\n请输入正确的公式格式，例如:\n• y=2x+1\n• y=x^2\n• y=sin(x)\n• y=cos(2x+1)+3');
        
        // 恢复原来的公式显示
        equation.formula = oldFormula;
        updateEquationsList();
        return;
    }
    
    // 保留原来的颜色和样式
    let oldColor = equation.color;
    let oldStyle = equation.style;
    
    // 更新方程
    equation.formula = newFormula;
    equation.parsed = parsed;
    equation.color = oldColor;
    equation.style = oldStyle;
    
    // 保存并更新
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 生成参数编辑器
function generateParamsEditor(equation, index) {
    let parsed = equation.parsed;
    let editor = '<div class="params-editor">';
    
    switch (parsed.type) {
        case 'linear':
            editor += `
                <label>斜率: <input type="number" step="0.1" value="${parsed.slope}" 
                       onchange="updateEquationParam(${index}, 'slope', this.value)"></label>
                <label>截距: <input type="number" step="0.1" value="${parsed.intercept}" 
                       onchange="updateEquationParam(${index}, 'intercept', this.value)"></label>
            `;
            break;
            
        case 'quadratic':
            editor += `
                <label>a: <input type="number" step="0.1" value="${parsed.a}" 
                       onchange="updateEquationParam(${index}, 'a', this.value)"></label>
                <label>b: <input type="number" step="0.1" value="${parsed.b}" 
                       onchange="updateEquationParam(${index}, 'b', this.value)"></label>
                <label>c: <input type="number" step="0.1" value="${parsed.c}" 
                       onchange="updateEquationParam(${index}, 'c', this.value)"></label>
            `;
            break;
            
        case 'power':
            editor += `
                <label>系数: <input type="number" step="0.1" value="${parsed.coefficient}" 
                       onchange="updateEquationParam(${index}, 'coefficient', this.value)"></label>
                <label>指数: <input type="number" step="0.1" value="${parsed.power}" 
                       onchange="updateEquationParam(${index}, 'power', this.value)"></label>
            `;
            if (parsed.verticalShift !== undefined) {
                editor += `
                    <label>垂直位移: <input type="number" step="0.1" value="${parsed.verticalShift}" 
                           onchange="updateEquationParam(${index}, 'verticalShift', this.value)"></label>
                `;
            }
            break;
            
        case 'exponential':
            if (parsed.base !== 'e') {
                editor += `
                    <label>底数: <input type="number" step="0.1" value="${parsed.base}" 
                           onchange="updateEquationParam(${index}, 'base', this.value)"></label>
                `;
            }
            if (parsed.verticalShift !== undefined) {
                editor += `
                    <label>垂直位移: <input type="number" step="0.1" value="${parsed.verticalShift}" 
                           onchange="updateEquationParam(${index}, 'verticalShift', this.value)"></label>
                `;
            }
            break;
            
        case 'logarithmic':
            if (parsed.verticalShift !== undefined) {
                editor += `
                    <label>垂直位移: <input type="number" step="0.1" value="${parsed.verticalShift}" 
                           onchange="updateEquationParam(${index}, 'verticalShift', this.value)"></label>
                `;
            }
            break;
            
        case 'trigonometric':
            editor += `
                <label>振幅: <input type="number" step="0.1" value="${parsed.amplitude}" 
                       onchange="updateEquationParam(${index}, 'amplitude', this.value)"></label>
                <label>频率: <input type="number" step="0.1" value="${parsed.frequency}" 
                       onchange="updateEquationParam(${index}, 'frequency', this.value)"></label>
                <label>相位: <input type="number" step="0.1" value="${parsed.phase}" 
                       onchange="updateEquationParam(${index}, 'phase', this.value)"></label>
            `;
            if (parsed.verticalShift !== undefined) {
                editor += `
                    <label>垂直位移: <input type="number" step="0.1" value="${parsed.verticalShift}" 
                           onchange="updateEquationParam(${index}, 'verticalShift', this.value)"></label>
                `;
            }
            break;
    }
    
    editor += '</div>';
    return editor;
}

// 更新方程参数
function updateEquationParam(index, param, value) {
    let equation = equations[index];
    let parsed = equation.parsed;
    
    // 将字符串转换为数字
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
        alert('请输入有效的数字');
        return;
    }
    
    // 保留两位小数
    numValue = Math.round(numValue * 100) / 100;
    
    // 更新参数
    parsed[param] = numValue;
    
    // 更新方程显示
    equation.formula = formatEquation(parsed);
    
    // 保存并更新
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 选中/取消选中方程
function selectEquation(index, checked) {
    if (checked) {
        selectedEquationIndex = index;
    } else {
        selectedEquationIndex = -1;
    }
    updateEquationsList();
    drawCoordinateSystem();
}

// 更新方程位置（拖拽时）
function updateEquationPosition(index, deltaX, deltaY) {
    let equation = equations[index];
    let parsed = equation.parsed;
    
    // 设置移动阈值
    const threshold = 0.1;
    
    // 只有移动距离超过阈值才更新
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
        return;
    }
    
    // 根据方程类型更新参数
    switch (parsed.type) {
        case 'linear':
            // 对于一次方程 y = slope*x + intercept
            // 水平移动：改变截距（因为 y = slope*x + intercept，向右移动deltaX相当于 y = slope*(x-deltaX) + intercept = slope*x + (intercept - slope*deltaX)）
            // 垂直移动：改变截距
            parsed.intercept += deltaY - parsed.slope * deltaX;
            // 保留两位小数
            parsed.intercept = Math.round(parsed.intercept * 100) / 100;
            break;
            
        case 'quadratic':
            // 对于二次方程 y = a*x² + b*x + c
            // 水平移动：改变b和c（完成平方后的平移）
            // 顶点坐标为 (-b/2a, c - b²/4a)
            // 向右移动deltaX，顶点x坐标增加deltaX
            // 新的b = -2a * (新的顶点x) = -2a * (-b/2a + deltaX) = b - 2a*deltaX
            // 新的c = 新的顶点y + b²/4a = (原来的y在x=-b/2a+deltaX处) + b²/4a
            let oldB = parsed.b;
            parsed.b -= 2 * parsed.a * deltaX;
            // c的变化：保持顶点y坐标不变，但顶点x移动了
            // y = a*(-b/2a)² + b*(-b/2a) + c = c - b²/4a
            // 新的c = 新的顶点y + (新的b)²/4a
            // 由于顶点y不变，所以 c - b²/4a = 新的c - (新的b)²/4a
            // 新的c = c - b²/4a + (新的b)²/4a = c + (新的b² - b²)/4a
            parsed.c += deltaY + (parsed.b * parsed.b - oldB * oldB) / (4 * parsed.a);
            // 保留两位小数
            parsed.b = Math.round(parsed.b * 100) / 100;
            parsed.c = Math.round(parsed.c * 100) / 100;
            break;
            
        case 'power':
            // 对于幂函数 y = coefficient * (x - phase)^power + verticalShift
            // 水平移动：通过相位参数实现
            if (parsed.phase === undefined) parsed.phase = 0;
            if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
            // 直接使用deltaX作为相位变化（向右拖拽，phase增加，图像向右移动）
            parsed.phase += deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;

        case 'exponential':
            // 对于指数函数 y = coefficient * base^(x - phase) + verticalShift
            // 水平移动：通过相位参数实现
            if (parsed.phase === undefined) parsed.phase = 0;
            if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
            // 直接使用deltaX作为相位变化（向右拖拽，phase增加，图像向右移动）
            parsed.phase += deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;

        case 'logarithmic':
            // 对于对数函数 y = coefficient * log(x - phase) + verticalShift
            // 水平移动：通过相位参数实现
            if (parsed.phase === undefined) parsed.phase = 0;
            if (parsed.verticalShift === undefined) parsed.verticalShift = 0;
            // 直接使用deltaX作为相位变化（向右拖拽，phase增加，图像向右移动）
            parsed.phase += deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'trigonometric':
            // 对于三角函数 y = amplitude * sin(frequency*x + phase) + verticalShift
            // 水平移动：改变相位 phase
            // 垂直移动：改变 verticalShift
            if (!parsed.phase) parsed.phase = 0;
            if (!parsed.verticalShift) parsed.verticalShift = 0;
            parsed.phase -= parsed.frequency * deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'inverseTrigonometric':
            // 对于反三角函数 y = amplitude * arcsin(frequency*x + phase) + verticalShift
            // 水平移动：改变相位 phase
            // 垂直移动：改变 verticalShift
            if (!parsed.phase) parsed.phase = 0;
            if (!parsed.verticalShift) parsed.verticalShift = 0;
            parsed.phase -= parsed.frequency * deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'hyperbolic':
            // 对于双曲函数 y = amplitude * sinh(frequency*x + phase) + verticalShift
            // 水平移动：改变相位 phase
            // 垂直移动：改变 verticalShift
            if (!parsed.phase) parsed.phase = 0;
            if (!parsed.verticalShift) parsed.verticalShift = 0;
            parsed.phase -= parsed.frequency * deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'absolute':
            // 对于绝对值函数 y = coefficient * |frequency*x + phase| + verticalShift
            // 水平移动：改变相位 phase
            // 垂直移动：改变 verticalShift
            if (!parsed.phase) parsed.phase = 0;
            if (!parsed.verticalShift) parsed.verticalShift = 0;
            parsed.phase -= parsed.frequency * deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'rounding':
            // 对于取整函数 y = coefficient * floor(frequency*x + phase) + verticalShift
            // 水平移动：改变相位 phase
            // 垂直移动：改变 verticalShift
            if (!parsed.phase) parsed.phase = 0;
            if (!parsed.verticalShift) parsed.verticalShift = 0;
            parsed.phase -= parsed.frequency * deltaX;
            parsed.verticalShift += deltaY;
            // 保留两位小数
            parsed.phase = Math.round(parsed.phase * 100) / 100;
            parsed.verticalShift = Math.round(parsed.verticalShift * 100) / 100;
            break;
            
        case 'derivative':
            // 微分函数不支持拖拽改变参数，保持原样
            break;
            
        case 'integral':
            // 定积分不支持拖拽改变参数，保持原样
            break;
    }
    
    // 使用formatEquation函数格式化方程显示（微分和积分保持原公式不变）
    if (parsed.type !== 'derivative' && parsed.type !== 'integral') {
        equation.formula = formatEquation(parsed);
    }
    
    saveEquations();
    updateEquationsList();
}

// 更新一次方程的顶点式参数
function updateLinearVertex(index, param, value) {
    let equation = equations[index];
    let parsed = equation.parsed;
    let numValue = parseFloat(value);
    
    if (isNaN(numValue)) return;
    
    // 当前直线上的点(0, intercept)
    let currentX0 = 0;
    let currentY0 = parsed.intercept;
    
    if (param === 'x0') {
        // 改变x0，保持y0不变，调整intercept
        // y = k(x-x0) + y0 = kx - k*x0 + y0
        // intercept = y0 - k*x0
        currentY0 = parsed.slope * currentX0 + parsed.intercept;
        parsed.intercept = currentY0 - parsed.slope * numValue;
    } else if (param === 'y0') {
        // 改变y0，调整intercept
        // y = k(x-x0) + y0 = kx - k*x0 + y0
        // intercept = y0 - k*x0
        parsed.intercept = numValue - parsed.slope * currentX0;
    }
    
    // 保留两位小数
    parsed.intercept = Math.round(parsed.intercept * 100) / 100;
    
    // 更新公式显示
    equation.formula = formatEquation(parsed);
    
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 更新二次方程的顶点式参数
function updateQuadraticVertex(index, param, value) {
    let equation = equations[index];
    let parsed = equation.parsed;
    let numValue = parseFloat(value);
    
    if (isNaN(numValue)) return;
    
    // 当前顶点坐标
    let currentX0 = -parsed.b / (2 * parsed.a);
    let currentY0 = parsed.c - parsed.b * parsed.b / (4 * parsed.a);
    
    if (param === 'x0') {
        // 改变顶点x坐标
        // y = a(x-x0)² + y0 = a(x² - 2x0*x + x0²) + y0 = ax² - 2a*x0*x + (a*x0² + y0)
        // b = -2a*x0, c = a*x0² + y0
        parsed.b = -2 * parsed.a * numValue;
        parsed.c = parsed.a * numValue * numValue + currentY0;
    } else if (param === 'y0') {
        // 改变顶点y坐标
        // c = a*x0² + y0
        parsed.c = parsed.a * currentX0 * currentX0 + numValue;
    }
    
    // 保留两位小数
    parsed.b = Math.round(parsed.b * 100) / 100;
    parsed.c = Math.round(parsed.c * 100) / 100;
    
    // 更新公式显示
    equation.formula = formatEquation(parsed);
    
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 切换方程可见性
function toggleEquationVisibility(index) {
    equations[index].visible = !equations[index].visible;
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 删除方程
function removeEquation(index) {
    equations.splice(index, 1);
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 显示所有方程
function showAllEquations() {
    equations.forEach(eq => eq.visible = true);
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 隐藏所有方程
function hideAllEquations() {
    equations.forEach(eq => eq.visible = false);
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 清空所有方程
function clearAllEquations() {
    equations = [];
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 保存方程到本地存储
function saveEquations() {
    localStorage.setItem('equations', JSON.stringify(equations));
}

// 从本地存储加载方程
function loadEquations() {
    let saved = localStorage.getItem('equations');
    if (saved) {
        equations = JSON.parse(saved);
        updateEquationsList();
        drawCoordinateSystem();
    }
}

// 选择预设公式
function selectPreset() {
    let preset = document.getElementById('formula-preset');
    if (preset && preset.value) {
        document.getElementById('formula').value = preset.value;
    }
}

// 切换预设菜单显示
function togglePresetMenu() {
    let menu = document.getElementById('preset-menu');
    menu.classList.toggle('hidden');
}

// 选择预设公式
function selectPresetFormula(formula) {
    document.getElementById('formula').value = formula;
    document.getElementById('preset-menu').classList.add('hidden');
}

// 点击其他地方关闭预设菜单
document.addEventListener('click', function(e) {
    let menu = document.getElementById('preset-menu');
    let btn = document.querySelector('.preset-dropdown-btn');
    
    // 如果点击的不是预设按钮且不是预设菜单内部，则关闭菜单
    if (menu && !menu.classList.contains('hidden') && 
        !menu.contains(e.target) && 
        !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// 初始化预设菜单的二级菜单展开/折叠
document.addEventListener('DOMContentLoaded', function() {
    let categories = document.querySelectorAll('.preset-category');
    categories.forEach(function(category) {
        let header = category.querySelector('.preset-category-header');
        let submenu = category.querySelector('.preset-submenu');
        
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 切换当前分类的展开状态
            category.classList.toggle('expanded');
            submenu.classList.toggle('hidden');
            
            // 可选：折叠其他分类（手风琴效果）
            categories.forEach(function(otherCategory) {
                if (otherCategory !== category) {
                    otherCategory.classList.remove('expanded');
                    otherCategory.querySelector('.preset-submenu').classList.add('hidden');
                }
            });
        });
    });
});

// 切换设置菜单显示
function toggleSettingsMenu() {
    let menu = document.getElementById('settings-menu');
    menu.classList.toggle('hidden');
}

// 切换帮助面板显示
function toggleHelp() {
    let panel = document.getElementById('help-panel');
    panel.classList.toggle('hidden');
}

// 点击其他地方关闭设置菜单
document.addEventListener('click', function(e) {
    let menu = document.getElementById('settings-menu');
    let btn = document.querySelector('.settings-btn');
    
    // 如果点击的不是设置按钮且不是设置菜单内部，则关闭菜单
    if (!menu.classList.contains('hidden') && 
        !menu.contains(e.target) && 
        !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// 切换网格显示
function toggleGrid() {
    showGrid = document.getElementById('show-grid').checked;
    drawCoordinateSystem();
}

// 切换深色模式
function toggleDarkMode() {
    darkMode = document.getElementById('dark-mode').checked;
    document.body.classList.toggle('dark-mode', darkMode);
    drawCoordinateSystem();
}

// 切换交点显示
function toggleIntersections() {
    showIntersections = document.getElementById('show-intersections').checked;
    drawCoordinateSystem();
}

// 更新交点颜色
function updateIntersectionColor() {
    intersectionColor = document.getElementById('intersection-color').value;
    drawCoordinateSystem();
}

// 更新坐标轴范围
function updateAxisRange() {
    xMin = parseFloat(document.getElementById('x-min').value);
    xMax = parseFloat(document.getElementById('x-max').value);
    yMin = parseFloat(document.getElementById('y-min').value);
    yMax = parseFloat(document.getElementById('y-max').value);
    
    // 重新计算scale和offset
    let xRange = xMax - xMin;
    let yRange = yMax - yMin;
    
    scale = Math.min(canvas.width / xRange, canvas.height / yRange) * 0.8;
    offsetX = canvas.width / 2 - (xMin + xMax) / 2 * scale;
    offsetY = canvas.height / 2 + (yMin + yMax) / 2 * scale;
    
    drawCoordinateSystem();
}

// 导出图像
function exportImage() {
    let link = document.createElement('a');
    link.download = 'formula-visualization.png';
    link.href = canvas.toDataURL();
    link.click();
}

// 重置视图
function resetView() {
    scale = 20;
    offsetX = 400;
    offsetY = 300;
    drawCoordinateSystem();
}

// 处理鼠标滚轮事件
function handleWheel(e) {
    e.preventDefault();
    
    let scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    scale *= scaleFactor;
    
    scale = Math.max(5, Math.min(100, scale));
    
    drawCoordinateSystem();
}

// 查找点击位置是否在方程曲线上
function findEquationAtPoint(x, y) {
    const tolerance = 20; // 点击容差（像素），增加到20像素
    
    // 如果已经有选中的方程，优先检查选中的方程
    if (selectedEquationIndex >= 0 && selectedEquationIndex < equations.length) {
        let equation = equations[selectedEquationIndex];
        if (equation.visible) {
            let parsed = equation.parsed;
            let realX = (x - offsetX) / scale;
            
            // 计算该x位置方程的理论y值
            let equationY = calculateEquationY(parsed, realX);
            
            if (isFinite(equationY)) {
                let canvasEquationY = offsetY - equationY * scale;
                if (Math.abs(y - canvasEquationY) <= tolerance * 2) { // 选中的方程有更大的容差
                    return selectedEquationIndex;
                }
            }
        }
    }
    
    // 检查所有方程
    for (let i = 0; i < equations.length; i++) {
        let equation = equations[i];
        if (!equation.visible) continue;
        
        let parsed = equation.parsed;
        let realX = (x - offsetX) / scale;
        
        // 计算该x位置方程的理论y值
        let equationY = calculateEquationY(parsed, realX);
        
        if (!isFinite(equationY)) continue;
        
        let canvasEquationY = offsetY - equationY * scale;
        if (Math.abs(y - canvasEquationY) <= tolerance) {
            return i;
        }
    }
    
    return -1;
}

// 计算方程在指定x位置的y值
function calculateEquationY(parsed, realX) {
    switch (parsed.type) {
        case 'linear':
            return parsed.slope * realX + parsed.intercept;
        case 'quadratic':
            return parsed.a * realX * realX + parsed.b * realX + parsed.c;
        case 'power':
            let transformedXPower = realX - (parsed.phase || 0);
            if (transformedXPower < 0 && parsed.power % 1 !== 0) return NaN;
            let y = parsed.coefficient * Math.pow(transformedXPower, parsed.power);
            if (parsed.verticalShift) y += parsed.verticalShift;
            return y;
        case 'exponential':
            let transformedXExp = realX - (parsed.phase || 0);
            let expY = parsed.coefficient * (parsed.base === 'e' ? Math.exp(transformedXExp) : Math.pow(parsed.base, transformedXExp));
            if (parsed.verticalShift) expY += parsed.verticalShift;
            return expY;
        case 'logarithmic':
            let transformedXLog = realX - (parsed.phase || 0);
            if (transformedXLog <= 0) return NaN;
            let logY = parsed.coefficient * (parsed.base === 'e' ? Math.log(transformedXLog) : Math.log10(transformedXLog));
            if (parsed.verticalShift) logY += parsed.verticalShift;
            return logY;
        case 'trigonometric':
            let trigY;
            switch (parsed.functionType) {
                case 'sin': trigY = parsed.amplitude * Math.sin(parsed.frequency * realX + parsed.phase); break;
                case 'cos': trigY = parsed.amplitude * Math.cos(parsed.frequency * realX + parsed.phase); break;
                case 'tan': trigY = parsed.amplitude * Math.tan(parsed.frequency * realX + parsed.phase); break;
            }
            return trigY + (parsed.verticalShift || 0);
        case 'inverseTrigonometric':
            if ((parsed.functionType === 'arcsin' || parsed.functionType === 'arccos') && 
                (realX < -1 || realX > 1)) return NaN;
            let invY;
            switch (parsed.functionType) {
                case 'arcsin': invY = parsed.amplitude * Math.asin(parsed.frequency * realX + parsed.phase); break;
                case 'arccos': invY = parsed.amplitude * Math.acos(parsed.frequency * realX + parsed.phase); break;
                case 'arctan': invY = parsed.amplitude * Math.atan(parsed.frequency * realX + parsed.phase); break;
            }
            return invY + (parsed.verticalShift || 0);
        case 'hyperbolic':
            let hypY;
            switch (parsed.functionType) {
                case 'sinh': hypY = parsed.amplitude * Math.sinh(parsed.frequency * realX + parsed.phase); break;
                case 'cosh': hypY = parsed.amplitude * Math.cosh(parsed.frequency * realX + parsed.phase); break;
                case 'tanh': hypY = parsed.amplitude * Math.tanh(parsed.frequency * realX + parsed.phase); break;
            }
            return hypY + (parsed.verticalShift || 0);
        case 'absolute':
            return parsed.coefficient * Math.abs(parsed.frequency * realX + parsed.phase) + (parsed.verticalShift || 0);
        case 'rounding':
            let roundY;
            switch (parsed.functionType) {
                case 'floor': roundY = parsed.coefficient * Math.floor(parsed.frequency * realX + parsed.phase); break;
                case 'ceil': roundY = parsed.coefficient * Math.ceil(parsed.frequency * realX + parsed.phase); break;
                case 'round': roundY = parsed.coefficient * Math.round(parsed.frequency * realX + parsed.phase); break;
            }
            return roundY + (parsed.verticalShift || 0);
        case 'derivative':
            // 数值微分计算
            let h = 0.0001;
            let fPlus = evaluateSpecialExpression(parsed.expression, realX + h);
            let fMinus = evaluateSpecialExpression(parsed.expression, realX - h);
            if (fPlus === null || fMinus === null || !isFinite(fPlus) || !isFinite(fMinus)) {
                return NaN;
            }
            return (fPlus - fMinus) / (2 * h);
        case 'integral':
            // 定积分不返回单个Y值，返回NaN
            return NaN;
        case 'special':
            let specialY = evaluateSpecialExpression(parsed.expression, realX);
            return specialY !== null && isFinite(specialY) ? specialY : NaN;
        default:
            return NaN;
    }
}

// 处理鼠标按下事件
function handleMouseDown(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // 检查是否点击了某个方程的曲线
    let clickedEquationIndex = findEquationAtPoint(x, y);
    
    if (clickedEquationIndex >= 0) {
        // 点击了某个方程，选中它并开始拖拽
        selectedEquationIndex = clickedEquationIndex;
        isDraggingEquation = true;
        dragStartX = (x - offsetX) / scale;
        dragStartY = (offsetY - y) / scale;
        canvas.style.cursor = 'move';
        updateEquationsList();
        drawCoordinateSystem();
    } else {
        // 没有点击方程曲线，无论是否有选中的方程，都开始拖拽画布
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    }
}

// 处理鼠标移动事件
function handleMouseMove(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // 显示坐标
    let realX = (x - offsetX) / scale;
    let realY = (offsetY - y) / scale;
    
    let coordDisplay = document.getElementById('coordinate-display');
    coordDisplay.textContent = `X: ${realX.toFixed(2)}, Y: ${realY.toFixed(2)}`;
    coordDisplay.style.display = 'block';
    
    // 如果正在拖拽方程
    if (isDraggingEquation && selectedEquationIndex >= 0) {
        let deltaX = realX - dragStartX;
        let deltaY = realY - dragStartY;
        
        updateEquationPosition(selectedEquationIndex, deltaX, deltaY);
        
        dragStartX = realX;
        dragStartY = realY;
        
        drawCoordinateSystem();
        return;
    }
    
    // 如果没有在拖拽，检测鼠标是否悬停在方程上
    if (!isDragging && !isDraggingEquation) {
        let hoveredEquationIndex = findEquationAtPoint(x, y);
        if (hoveredEquationIndex >= 0 || selectedEquationIndex >= 0) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
    
    if (!isDragging) return;
    
    let deltaClientX = e.clientX - lastX;
    let deltaClientY = e.clientY - lastY;
    
    offsetX += deltaClientX;
    offsetY += deltaClientY;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    drawCoordinateSystem();
}

// 处理鼠标离开事件
function handleMouseLeave() {
    isDragging = false;
    isDraggingEquation = false;
    canvas.style.cursor = 'crosshair';
    document.getElementById('coordinate-display').style.display = 'none';
}

// 处理鼠标释放事件
function handleMouseUp() {
    isDragging = false;
    isDraggingEquation = false;
    canvas.style.cursor = 'crosshair';
}

// 触摸屏支持
let touchStartX, touchStartY, touchStartOffsetX, touchStartOffsetY;
let initialPinchDistance = null;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartOffsetX = offsetX;
        touchStartOffsetY = offsetY;
    } else if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
    e.preventDefault();
}

function handleTouchMove(e) {
    if (e.touches.length === 1) {
        let deltaX = e.touches[0].clientX - touchStartX;
        let deltaY = e.touches[0].clientY - touchStartY;
        
        offsetX = touchStartOffsetX + deltaX;
        offsetY = touchStartOffsetY + deltaY;
        
        drawCoordinateSystem();
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        let currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        let scaleFactor = currentDistance / initialPinchDistance;
        scale = Math.max(5, Math.min(100, scale * scaleFactor));
        initialPinchDistance = currentDistance;
        
        drawCoordinateSystem();
    }
    e.preventDefault();
}

function handleTouchEnd(e) {
    initialPinchDistance = null;
}

// 页面加载完成后初始化
window.onload = init;