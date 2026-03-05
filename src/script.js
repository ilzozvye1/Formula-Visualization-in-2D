// 版本号
const APP_VERSION = '1.1.0';
const APP_NAME = '公式可视化';
// 构建日期动态生成（格式：YYYY-MM-DD）
const APP_BUILD_DATE = '2026-03-04';

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

// 3D模式相关变量
let is3DMode = false;
let rotationX = 0.5; // X轴旋转角度（弧度）
let rotationY = 0.5; // Y轴旋转角度（弧度）
let rotationZ = 0;   // Z轴旋转角度（弧度）
let isRotating = false;
let lastMouseX, lastMouseY;
let zScale = 20; // Z轴缩放比例

// 自动旋转相关变量
let isAutoRotating = false;
let autoRotateAnimationId = null;
let autoRotateSpeed = 0.005;

// 深度雾化相关变量
let fogEnabled = false;
let fogDensity = 0.02;
let fogColor = darkMode ? '#1a1a1a' : '#ffffff';

// 历史记录相关变量
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY_SIZE = 50;

// 保存当前状态到历史记录
function saveHistory() {
    // 删除当前位置之后的历史记录
    historyStack = historyStack.slice(0, historyIndex + 1);
    
    // 保存当前状态
    const state = {
        equations: JSON.parse(JSON.stringify(equations)),
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY,
        rotationX: rotationX,
        rotationY: rotationY,
        rotationZ: rotationZ
    };
    
    historyStack.push(state);
    
    // 限制历史记录大小
    if (historyStack.length > MAX_HISTORY_SIZE) {
        historyStack.shift();
    } else {
        historyIndex++;
    }
}

// 撤销
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyStack[historyIndex]);
    }
}

// 重做
function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreState(historyStack[historyIndex]);
    }
}

// 恢复状态
function restoreState(state) {
    equations = JSON.parse(JSON.stringify(state.equations));
    scale = state.scale;
    offsetX = state.offsetX;
    offsetY = state.offsetY;
    rotationX = state.rotationX;
    rotationY = state.rotationY;
    rotationZ = state.rotationZ;
    
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

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
        saveHistory();
        removeEquation(selectedEquationIndex);
        return;
    }

    // Ctrl/Cmd + Z: 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }

    // Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z: 重做
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
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
        saveHistory();
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
    if (is3DMode) {
        draw3DCoordinateSystem();
    } else {
        draw2DCoordinateSystem();
    }
    updateLegend();
}

// 绘制2D坐标系
function draw2DCoordinateSystem() {
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

// 3D点投影到2D画布
function project3DTo2D(x, y, z) {
    return project3DTo2DWithFog(x, y, z);
}

// 绘制3D坐标系
function draw3DCoordinateSystem() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置背景色
    if (darkMode) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 绘制3D网格
    if (showGrid) {
        draw3DGrid();
    }

    // 绘制3D坐标轴
    draw3DAxes();

    // 绘制3D方程
    drawAllEquations3D();
}

// 绘制3D网格
function draw3DGrid() {
    ctx.strokeStyle = darkMode ? '#333' : '#e0e0e0';
    ctx.lineWidth = 0.5;

    let gridRange = 10;
    let gridStep = 1;

    // XY平面网格
    for (let i = -gridRange; i <= gridRange; i += gridStep) {
        // 沿X方向的线
        let start1 = project3DTo2D(-gridRange * scale, i * scale, 0);
        let end1 = project3DTo2D(gridRange * scale, i * scale, 0);
        ctx.beginPath();
        ctx.moveTo(start1.x, start1.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.stroke();

        // 沿Y方向的线
        let start2 = project3DTo2D(i * scale, -gridRange * scale, 0);
        let end2 = project3DTo2D(i * scale, gridRange * scale, 0);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
    }

    // XZ平面网格
    for (let i = -gridRange; i <= gridRange; i += gridStep) {
        // 沿X方向的线
        let start1 = project3DTo2D(-gridRange * scale, 0, i * scale);
        let end1 = project3DTo2D(gridRange * scale, 0, i * scale);
        ctx.beginPath();
        ctx.moveTo(start1.x, start1.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.stroke();

        // 沿Z方向的线
        let start2 = project3DTo2D(i * scale, 0, -gridRange * scale);
        let end2 = project3DTo2D(i * scale, 0, gridRange * scale);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
    }
}

// 绘制3D坐标轴
function draw3DAxes() {
    ctx.strokeStyle = darkMode ? '#888' : '#000';
    ctx.lineWidth = 2;

    let axisLength = 12 * scale;

    // X轴（红色）
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    let xAxisStart = project3DTo2D(-axisLength, 0, 0);
    let xAxisEnd = project3DTo2D(axisLength, 0, 0);
    ctx.moveTo(xAxisStart.x, xAxisStart.y);
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y);
    ctx.stroke();

    // Y轴（绿色）
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    let yAxisStart = project3DTo2D(0, -axisLength, 0);
    let yAxisEnd = project3DTo2D(0, axisLength, 0);
    ctx.moveTo(yAxisStart.x, yAxisStart.y);
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y);
    ctx.stroke();

    // Z轴（蓝色）
    ctx.strokeStyle = '#0000ff';
    ctx.beginPath();
    let zAxisStart = project3DTo2D(0, 0, -axisLength);
    let zAxisEnd = project3DTo2D(0, 0, axisLength);
    ctx.moveTo(zAxisStart.x, zAxisStart.y);
    ctx.lineTo(zAxisEnd.x, zAxisEnd.y);
    ctx.stroke();

    // 绘制坐标轴标签
    ctx.fillStyle = darkMode ? '#ccc' : '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';

    // X轴标签
    ctx.fillStyle = '#ff0000';
    let xLabel = project3DTo2D(axisLength + 0.5 * scale, 0, 0);
    ctx.fillText('X', xLabel.x, xLabel.y);

    // Y轴标签
    ctx.fillStyle = '#00ff00';
    let yLabel = project3DTo2D(0, axisLength + 0.5 * scale, 0);
    ctx.fillText('Y', yLabel.x, yLabel.y);

    // Z轴标签
    ctx.fillStyle = '#0000ff';
    let zLabel = project3DTo2D(0, 0, axisLength + 0.5 * scale);
    ctx.fillText('Z', zLabel.x, zLabel.y);

    // 绘制原点
    ctx.fillStyle = darkMode ? '#fff' : '#000';
    let origin = project3DTo2D(0, 0, 0);
    ctx.fillText('O', origin.x - 15, origin.y + 15);

    // 绘制刻度标签
    ctx.font = '11px Arial';
    ctx.fillStyle = darkMode ? '#ccc' : '#000';

    let decimalPlaces = getDecimalPlaces(scale);
    let labelStep = Math.max(1, Math.floor(5 / scale));

    // X轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(i * scale, 0, 0);
        ctx.fillText(formatNumber(i, decimalPlaces), pos.x, pos.y + 15);
    }

    // Y轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(0, i * scale, 0);
        ctx.fillText(formatNumber(i, decimalPlaces), pos.x - 5, pos.y);
    }

    // Z轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(0, 0, i * scale);
        ctx.fillText(formatNumber(i, decimalPlaces), pos.x + 5, pos.y);
    }
}

// 解析公式
function parseFormula(formula) {
    formula = formula.replace(/\s/g, '');

    // 支持多种公式格式

    // 检查是否为3D空间曲线公式
    if (formula.startsWith('3d:')) {
        let curveType = formula.substring(3);
        return parse3DCurveEquation(curveType);
    }

    // 检查是否为3D曲面公式
    if (formula.startsWith('3dsurf:')) {
        let surfaceType = formula.substring(7);
        return parse3DSurfaceEquation(surfaceType);
    }

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

// 解析3D曲面方程
function parse3DSurfaceEquation(surfaceType) {
    const surfaces = {
        'plane': {
            type: '3dsurface',
            surfaceType: 'plane',
            name: '平面',
            formula: 'z = ax + by + c',
            params: { a: 0.5, b: 0.3, c: 0 },
            paramLabels: { a: 'X系数(a)', b: 'Y系数(b)', c: '常数(c)' }
        },
        'sphere': {
            type: '3dsurface',
            surfaceType: 'sphere',
            name: '球面',
            formula: 'x² + y² + z² = r²',
            params: { r: 5 },
            paramLabels: { r: '半径(r)' }
        },
        'cone': {
            type: '3dsurface',
            surfaceType: 'cone',
            name: '圆锥面',
            formula: 'z² = a(x² + y²)',
            params: { a: 1 },
            paramLabels: { a: '开口系数(a)' }
        },
        'paraboloid': {
            type: '3dsurface',
            surfaceType: 'paraboloid',
            name: '抛物面',
            formula: 'z = a(x² + y²)',
            params: { a: 0.5 },
            paramLabels: { a: '曲率(a)' }
        },
        'hyperboloid': {
            type: '3dsurface',
            surfaceType: 'hyperboloid',
            name: '单叶双曲面',
            formula: 'x²/a² + y²/b² - z²/c² = 1',
            params: { a: 3, b: 3, c: 2 },
            paramLabels: { a: 'X半轴(a)', b: 'Y半轴(b)', c: 'Z半轴(c)' }
        },
        'saddle': {
            type: '3dsurface',
            surfaceType: 'saddle',
            name: '马鞍面',
            formula: 'z = a(x² - y²)',
            params: { a: 0.5 },
            paramLabels: { a: '曲率(a)' }
        },
        'wave': {
            type: '3dsurface',
            surfaceType: 'wave',
            name: '波浪面',
            formula: 'z = a·sin(bx)·cos(cy)',
            params: { a: 2, b: 0.5, c: 0.5 },
            paramLabels: { a: '振幅(a)', b: 'X频率(b)', c: 'Y频率(c)' }
        },
        'torus-surf': {
            type: '3dsurface',
            surfaceType: 'torus-surf',
            name: '环面',
            formula: '(R-√(x²+y²))² + z² = r²',
            params: { R: 5, r: 2 },
            paramLabels: { R: '大半径(R)', r: '小半径(r)' }
        },
        'gaussian': {
            type: '3dsurface',
            surfaceType: 'gaussian',
            name: '高斯曲面',
            formula: 'z = a·exp(-(x²+y²)/b²)',
            params: { a: 5, b: 3 },
            paramLabels: { a: '高度(a)', b: '宽度(b)' }
        },
        'ripple': {
            type: '3dsurface',
            surfaceType: 'ripple',
            name: '涟漪面',
            formula: 'z = a·sin(b·√(x²+y²))',
            params: { a: 2, b: 0.8 },
            paramLabels: { a: '振幅(a)', b: '频率(b)' }
        }
    };

    if (surfaces[surfaceType]) {
        let surf = surfaces[surfaceType];
        return {
            type: surf.type,
            surfaceType: surf.surfaceType,
            name: surf.name,
            formula: surf.formula,
            params: { ...surf.params },
            paramLabels: { ...surf.paramLabels }
        };
    }
    return null;
}

// 解析3D空间曲线方程
function parse3DCurveEquation(curveType) {
    const curves = {
        'helix': {
            type: '3dcurve',
            curveType: 'helix',
            name: '螺旋线',
            formula: 'x = a·cos(t), y = a·sin(t), z = b·t',
            params: { a: 3, b: 0.5 },
            paramLabels: { a: '半径(a)', b: '螺距(b)' }
        },
        'trefoil': {
            type: '3dcurve',
            curveType: 'trefoil',
            name: '三叶结',
            formula: 'x = a(sin(t)+2sin(2t)), y = a(cos(t)-2cos(2t)), z = -a·sin(3t)',
            params: { a: 3 },
            paramLabels: { a: '缩放(a)' }
        },
        'torus': {
            type: '3dcurve',
            curveType: 'torus',
            name: '环面结',
            formula: 'x = (R+r·cos(qt))cos(pt), y = (R+r·cos(qt))sin(pt), z = r·sin(qt)',
            params: { R: 4, r: 1.5, p: 2, q: 3 },
            paramLabels: { R: '大半径(R)', r: '小半径(r)', p: '旋转数(p)', q: '缠绕数(q)' }
        },
        'lissajous': {
            type: '3dcurve',
            curveType: 'lissajous',
            name: '利萨茹曲线',
            formula: 'x = a·sin(nx·t), y = b·sin(ny·t), z = c·sin(nz·t)',
            params: { a: 3, b: 2, c: 1, nx: 3, ny: 2, nz: 1 },
            paramLabels: { a: 'X振幅(a)', b: 'Y振幅(b)', c: 'Z振幅(c)', nx: 'X频率(nx)', ny: 'Y频率(ny)', nz: 'Z频率(nz)' }
        },
        'viviani': {
            type: '3dcurve',
            curveType: 'viviani',
            name: '维维亚尼曲线',
            formula: 'x = a(1+cos(t)), y = a·sin(t), z = 2a·sin(t/2)',
            params: { a: 3 },
            paramLabels: { a: '半径(a)' }
        },
        'spherical-spiral': {
            type: '3dcurve',
            curveType: 'spherical-spiral',
            name: '球面螺旋线',
            formula: 'x = a·cos(t)·cos(bt), y = a·sin(t)·cos(bt), z = a·sin(bt)',
            params: { a: 4, b: 0.3 },
            paramLabels: { a: '半径(a)', b: '螺旋密度(b)' }
        },
        'conical-spiral': {
            type: '3dcurve',
            curveType: 'conical-spiral',
            name: '圆锥螺旋线',
            formula: 'x = at·cos(t), y = at·sin(t), z = b·t',
            params: { a: 0.5, b: 0.3 },
            paramLabels: { a: '圆锥系数(a)', b: '高度系数(b)' }
        },
        'rose': {
            type: '3dcurve',
            curveType: 'rose',
            name: '3D玫瑰线',
            formula: 'r = a·cos(n·t), x = r·cos(t), y = r·sin(t), z = k·t',
            params: { a: 4, n: 5, k: 0.5 },
            paramLabels: { a: '半径(a)', n: '花瓣数(n)', k: '高度系数(k)' }
        },
        'twisted-cubic': {
            type: '3dcurve',
            curveType: 'twisted-cubic',
            name: '扭曲立方曲线',
            formula: 'x = t, y = a·t², z = a²·t³/3',
            params: { a: 0.5 },
            paramLabels: { a: '扭曲系数(a)' }
        },
        'sine-wave': {
            type: '3dcurve',
            curveType: 'sine-wave',
            name: '3D正弦波',
            formula: 'x = a·t, y = b·sin(ct), z = b·cos(ct)',
            params: { a: 3, b: 1, c: 0.5 },
            paramLabels: { a: 'X系数(a)', b: '振幅(b)', c: '频率(c)' }
        },
        'figure-eight': {
            type: '3dcurve',
            curveType: 'figure-eight',
            name: '8字结',
            formula: 'x = a(2+cos(2t))cos(3t), y = a(2+cos(2t))sin(3t), z = a·sin(4t)',
            params: { a: 3 },
            paramLabels: { a: '缩放(a)' }
        },
        'cinquefoil': {
            type: '3dcurve',
            curveType: 'cinquefoil',
            name: '五叶结',
            formula: 'x = a·cos(2t)(3+cos(5t)), y = a·sin(2t)(3+cos(5t)), z = a·sin(5t)',
            params: { a: 3 },
            paramLabels: { a: '缩放(a)' }
        }
    };

    if (curves[curveType]) {
        // 返回对象的深拷贝，避免多个方程共享同一个对象
        let curve = curves[curveType];
        return {
            type: curve.type,
            curveType: curve.curveType,
            name: curve.name,
            formula: curve.formula,
            params: { ...curve.params },
            paramLabels: { ...curve.paramLabels }
        };
    }
    return null;
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

        case '3dcurve':
            display += parsed.name || '3D曲线';
            break;
        case '3dsurface':
            display += parsed.name || '3D曲面';
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
    
    saveHistory();
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

// 绘制所有3D方程
function drawAllEquations3D() {
    equations.forEach((equation, index) => {
        if (equation.visible) {
            drawEquation3D(equation, index);
        }
    });
}

// 绘制单个3D方程
function drawEquation3D(equation, index) {
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

    // 根据方程类型选择绘制方式
    if (equation.parsed.type === '3dcurve') {
        draw3DCurve(equation.parsed);
    } else if (equation.parsed.type === '3dsurface') {
        draw3DSurface(equation.parsed);
    } else {
        // 在3D模式下，将2D函数绘制为XY平面上的曲线（Z=0）
        drawEquation3DInPlane(equation.parsed);
    }

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

// 在3D XY平面上绘制方程
function drawEquation3DInPlane(parsed) {
    let isFirstPoint = true;
    let step = 0.5; // 采样步长

    for (let x = -10; x <= 10; x += step) {
        let y = calculateEquationY(parsed, x);

        if (!isFinite(y)) {
            isFirstPoint = true;
            continue;
        }

        // 将2D坐标转换为3D坐标（Z=0）
        let point3D = project3DTo2D(x * scale, y * scale, 0);

        if (isFirstPoint) {
            ctx.moveTo(point3D.x, point3D.y);
            isFirstPoint = false;
        } else {
            ctx.lineTo(point3D.x, point3D.y);
        }
    }
    ctx.stroke();
}

// 计算3D曲面上的点
function calculate3DSurfacePoint(surfaceType, u, v, params) {
    let x, y, z;

    switch (surfaceType) {
        case 'plane': // 平面 z = ax + by + c
            x = u;
            y = v;
            z = params.a * x + params.b * y + params.c;
            break;

        case 'sphere': // 球面 x² + y² + z² = r²
            let phi = u;
            let theta = v;
            x = params.r * Math.sin(phi) * Math.cos(theta);
            y = params.r * Math.sin(phi) * Math.sin(theta);
            z = params.r * Math.cos(phi);
            break;

        case 'cone': // 圆锥面 z² = a(x² + y²)
            let coneR = u;
            let coneTheta = v;
            x = coneR * Math.cos(coneTheta);
            y = coneR * Math.sin(coneTheta);
            z = Math.sqrt(params.a) * coneR;
            // 创建上下两个锥面
            if (Math.random() > 0.5) z = -z;
            break;

        case 'paraboloid': // 抛物面 z = a(x² + y²)
            let paraR = u;
            let paraTheta = v;
            x = paraR * Math.cos(paraTheta);
            y = paraR * Math.sin(paraTheta);
            z = params.a * (x * x + y * y);
            break;

        case 'hyperboloid': // 单叶双曲面 x²/a² + y²/b² - z²/c² = 1
            let hypU = u;
            let hypV = v;
            x = params.a * Math.cosh(hypU) * Math.cos(hypV);
            y = params.b * Math.cosh(hypU) * Math.sin(hypV);
            z = params.c * Math.sinh(hypU);
            break;

        case 'saddle': // 马鞍面 z = a(x² - y²)
            x = u;
            y = v;
            z = params.a * (x * x - y * y);
            break;

        case 'wave': // 波浪面 z = a·sin(bx)·cos(cy)
            x = u;
            y = v;
            z = params.a * Math.sin(params.b * x) * Math.cos(params.c * y);
            break;

        case 'torus-surf': // 环面
            let torusU = u;
            let torusV = v;
            x = (params.R + params.r * Math.cos(torusV)) * Math.cos(torusU);
            y = (params.R + params.r * Math.cos(torusV)) * Math.sin(torusU);
            z = params.r * Math.sin(torusV);
            break;

        case 'gaussian': // 高斯曲面 z = a·exp(-(x²+y²)/b²)
            x = u;
            y = v;
            z = params.a * Math.exp(-(x * x + y * y) / (params.b * params.b));
            break;

        case 'ripple': // 涟漪面 z = a·sin(b·√(x²+y²))
            x = u;
            y = v;
            let r = Math.sqrt(x * x + y * y);
            z = params.a * Math.sin(params.b * r);
            break;

        default:
            x = 0; y = 0; z = 0;
    }

    return { x, y, z };
}

// 计算3D空间曲线上的点
function calculate3DCurvePoint(curveType, t, params) {
    let x, y, z;

    switch (curveType) {
        case 'helix': // 螺旋线
            x = params.a * Math.cos(t);
            y = params.a * Math.sin(t);
            z = params.b * t;
            break;

        case 'trefoil': // 三叶结
            x = params.a * (Math.sin(t) + 2 * Math.sin(2 * t));
            y = params.a * (Math.cos(t) - 2 * Math.cos(2 * t));
            z = params.a * (-Math.sin(3 * t));
            break;

        case 'torus': // 环面结
            let torusX = (params.R + params.r * Math.cos(params.q * t)) * Math.cos(params.p * t);
            let torusY = (params.R + params.r * Math.cos(params.q * t)) * Math.sin(params.p * t);
            let torusZ = params.r * Math.sin(params.q * t);
            x = torusX;
            y = torusY;
            z = torusZ;
            break;

        case 'lissajous': // 利萨茹曲线
            x = params.a * Math.sin(params.nx * t);
            y = params.b * Math.sin(params.ny * t);
            z = params.c * Math.sin(params.nz * t);
            break;

        case 'viviani': // 维维亚尼曲线
            x = params.a * (1 + Math.cos(t));
            y = params.a * Math.sin(t);
            z = 2 * params.a * Math.sin(t / 2);
            break;

        case 'spherical-spiral': // 球面螺旋线
            x = params.a * Math.cos(t) * Math.cos(params.b * t);
            y = params.a * Math.sin(t) * Math.cos(params.b * t);
            z = params.a * Math.sin(params.b * t);
            break;

        case 'conical-spiral': // 圆锥螺旋线
            let r = params.a * t;
            x = r * Math.cos(t);
            y = r * Math.sin(t);
            z = params.b * t;
            break;

        case 'rose': // 3D玫瑰线
            let roseR = params.a * Math.cos(params.n * t);
            x = roseR * Math.cos(t);
            y = roseR * Math.sin(t);
            z = params.k * t;
            break;

        case 'twisted-cubic': // 扭曲立方曲线
            x = t;
            y = params.a * t * t;
            z = params.a * params.a * t * t * t / 3;
            break;

        case 'sine-wave': // 3D正弦波
            x = params.a * t;
            y = params.b * Math.sin(params.c * t);
            z = params.b * Math.cos(params.c * t);
            break;

        case 'figure-eight': // 8字结
            x = params.a * (2 + Math.cos(2 * t)) * Math.cos(3 * t);
            y = params.a * (2 + Math.cos(2 * t)) * Math.sin(3 * t);
            z = params.a * Math.sin(4 * t);
            break;

        case 'cinquefoil': // 五叶结
            x = params.a * Math.cos(2 * t) * (3 + Math.cos(5 * t));
            y = params.a * Math.sin(2 * t) * (3 + Math.cos(5 * t));
            z = params.a * Math.sin(5 * t);
            break;

        default:
            x = 0; y = 0; z = 0;
    }

    return { x, y, z };
}

// 绘制3D空间曲线
function draw3DCurve(parsed) {
    let isFirstPoint = true;
    let step = 0.02; // 采样步长
    let tRange = parsed.curveType === 'twisted-cubic' ? 6 : 4 * Math.PI;
    let tStart = parsed.curveType === 'twisted-cubic' ? -3 : 0;

    for (let t = tStart; t <= tStart + tRange; t += step) {
        let point = calculate3DCurvePoint(parsed.curveType, t, parsed.params);

        if (!isFinite(point.x) || !isFinite(point.y) || !isFinite(point.z)) {
            isFirstPoint = true;
            continue;
        }

        // 将3D坐标投影到2D画布
        let point2D = project3DTo2D(point.x * scale, point.y * scale, point.z * scale);

        if (isFirstPoint) {
            ctx.moveTo(point2D.x, point2D.y);
            isFirstPoint = false;
        } else {
            ctx.lineTo(point2D.x, point2D.y);
        }
    }
    ctx.stroke();
}

// 绘制3D曲面
function draw3DSurface(parsed) {
    let uRange, vRange, uStep, vStep;
    let surfaceType = parsed.surfaceType;

    // 根据曲面类型设置参数范围
    switch (surfaceType) {
        case 'sphere':
        case 'torus-surf':
            uRange = { min: 0, max: 2 * Math.PI };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.15;
            vStep = 0.15;
            break;
        case 'cone':
        case 'paraboloid':
            uRange = { min: 0, max: 8 };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.3;
            vStep = 0.15;
            break;
        case 'hyperboloid':
            uRange = { min: -2, max: 2 };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.1;
            vStep = 0.15;
            break;
        case 'plane':
        case 'saddle':
        case 'wave':
        case 'gaussian':
        case 'ripple':
        default:
            uRange = { min: -8, max: 8 };
            vRange = { min: -8, max: 8 };
            uStep = 0.4;
            vStep = 0.4;
            break;
    }

    // 绘制经线（固定u，变化v）
    for (let u = uRange.min; u <= uRange.max; u += uStep * 2) {
        let isFirstPoint = true;
        for (let v = vRange.min; v <= vRange.max; v += vStep) {
            let point = calculate3DSurfacePoint(surfaceType, u, v, parsed.params);
            if (!isFinite(point.x) || !isFinite(point.y) || !isFinite(point.z)) {
                isFirstPoint = true;
                continue;
            }
            let point2D = project3DTo2D(point.x * scale, point.y * scale, point.z * scale);
            if (isFirstPoint) {
                ctx.moveTo(point2D.x, point2D.y);
                isFirstPoint = false;
            } else {
                ctx.lineTo(point2D.x, point2D.y);
            }
        }
    }

    // 绘制纬线（固定v，变化u）
    for (let v = vRange.min; v <= vRange.max; v += vStep * 2) {
        let isFirstPoint = true;
        for (let u = uRange.min; u <= uRange.max; u += uStep) {
            let point = calculate3DSurfacePoint(surfaceType, u, v, parsed.params);
            if (!isFinite(point.x) || !isFinite(point.y) || !isFinite(point.z)) {
                isFirstPoint = true;
                continue;
            }
            let point2D = project3DTo2D(point.x * scale, point.y * scale, point.z * scale);
            if (isFirstPoint) {
                ctx.moveTo(point2D.x, point2D.y);
                isFirstPoint = false;
            } else {
                ctx.lineTo(point2D.x, point2D.y);
            }
        }
    }

    ctx.stroke();
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
        case '3dcurve':
            // 在2D模式下，将3D曲线投影到XY平面
            draw3DCurve2DProjection(equation.parsed);
            break;
        case '3dsurface':
            // 在2D模式下，将3D曲面投影到XY平面
            draw3DSurface2DProjection(equation.parsed);
            break;
    }

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

// 在2D模式下绘制3D曲线的XY平面投影
function draw3DCurve2DProjection(parsed) {
    let isFirstPoint = true;
    let step = 0.02;
    let tRange = parsed.curveType === 'twisted-cubic' ? 6 : 4 * Math.PI;
    let tStart = parsed.curveType === 'twisted-cubic' ? -3 : 0;

    for (let t = tStart; t <= tStart + tRange; t += step) {
        let point = calculate3DCurvePoint(parsed.curveType, t, parsed.params);

        if (!isFinite(point.x) || !isFinite(point.y)) {
            isFirstPoint = true;
            continue;
        }

        let canvasX = offsetX + point.x * scale;
        let canvasY = offsetY - point.y * scale;

        if (isFirstPoint) {
            ctx.moveTo(canvasX, canvasY);
            isFirstPoint = false;
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    ctx.stroke();
}

// 在2D模式下绘制3D曲面的XY平面投影
function draw3DSurface2DProjection(parsed) {
    let uRange, vRange, uStep, vStep;
    let surfaceType = parsed.surfaceType;

    // 根据曲面类型设置参数范围（与3D绘制相同）
    switch (surfaceType) {
        case 'sphere':
        case 'torus-surf':
            uRange = { min: 0, max: 2 * Math.PI };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.15;
            vStep = 0.15;
            break;
        case 'cone':
        case 'paraboloid':
            uRange = { min: 0, max: 8 };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.3;
            vStep = 0.15;
            break;
        case 'hyperboloid':
            uRange = { min: -2, max: 2 };
            vRange = { min: 0, max: 2 * Math.PI };
            uStep = 0.1;
            vStep = 0.15;
            break;
        case 'plane':
        case 'saddle':
        case 'wave':
        case 'gaussian':
        case 'ripple':
        default:
            uRange = { min: -8, max: 8 };
            vRange = { min: -8, max: 8 };
            uStep = 0.4;
            vStep = 0.4;
            break;
    }

    // 绘制经线投影
    for (let u = uRange.min; u <= uRange.max; u += uStep * 2) {
        let isFirstPoint = true;
        for (let v = vRange.min; v <= vRange.max; v += vStep) {
            let point = calculate3DSurfacePoint(surfaceType, u, v, parsed.params);
            if (!isFinite(point.x) || !isFinite(point.y)) {
                isFirstPoint = true;
                continue;
            }
            let canvasX = offsetX + point.x * scale;
            let canvasY = offsetY - point.y * scale;
            if (isFirstPoint) {
                ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }

    // 绘制纬线投影
    for (let v = vRange.min; v <= vRange.max; v += vStep * 2) {
        let isFirstPoint = true;
        for (let u = uRange.min; u <= uRange.max; u += uStep) {
            let point = calculate3DSurfacePoint(surfaceType, u, v, parsed.params);
            if (!isFinite(point.x) || !isFinite(point.y)) {
                isFirstPoint = true;
                continue;
            }
            let canvasX = offsetX + point.x * scale;
            let canvasY = offsetY - point.y * scale;
            if (isFirstPoint) {
                ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
    }

    ctx.stroke();
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
        case '3dcurve':
            html += `<div class="equation-formula-row">${parsed.name}</div>`;
            html += `<div class="equation-formula-detail">${parsed.formula}</div>`;
            break;
        case '3dsurface':
            html += `<div class="equation-formula-row">${parsed.name}</div>`;
            html += `<div class="equation-formula-detail">${parsed.formula}</div>`;
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

        case '3dcurve':
            // 为每个参数创建输入框
            if (parsed.params && parsed.paramLabels) {
                for (let paramName in parsed.params) {
                    if (parsed.params.hasOwnProperty(paramName)) {
                        let label = parsed.paramLabels[paramName] || paramName;
                        let value = parsed.params[paramName];
                        html += `<div class="param-group"><span class="param-label">${label}:</span><input type="number" class="param-input" value="${value}" step="0.1" onchange="update3DCurveParam(${index}, '${paramName}', this.value)" title="${label}"></div>`;
                    }
                }
            }
            break;

        case '3dsurface':
            // 为每个参数创建输入框
            if (parsed.params && parsed.paramLabels) {
                for (let paramName in parsed.params) {
                    if (parsed.params.hasOwnProperty(paramName)) {
                        let label = parsed.paramLabels[paramName] || paramName;
                        let value = parsed.params[paramName];
                        html += `<div class="param-group"><span class="param-label">${label}:</span><input type="number" class="param-input" value="${value}" step="0.1" onchange="update3DSurfaceParam(${index}, '${paramName}', this.value)" title="${label}"></div>`;
                    }
                }
            }
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

// 更新3D曲线参数
function update3DCurveParam(index, param, value) {
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
    parsed.params[param] = numValue;

    // 保存并更新
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}

// 更新3D曲面参数
function update3DSurfaceParam(index, param, value) {
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
    parsed.params[param] = numValue;

    // 保存并更新
    saveEquations();
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
    saveHistory();
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
    if (menu && btn && !menu.classList.contains('hidden') && 
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

// 切换到2D模式
function switchTo2D() {
    is3DMode = false;
    document.getElementById('btn-2d').classList.add('active');
    document.getElementById('btn-3d').classList.remove('active');
    let viewControlsCanvas = document.getElementById('view-controls-canvas');
    if (viewControlsCanvas) viewControlsCanvas.style.display = 'none';
    let autoRotateControl = document.getElementById('auto-rotate-speed-control');
    if (autoRotateControl) autoRotateControl.style.display = 'none';
    let fogControl = document.getElementById('fog-control');
    if (fogControl) fogControl.style.display = 'none';
    // 2D模式下，图例与坐标显示同一水平位置
    let legendDisplay = document.getElementById('legend-display');
    if (legendDisplay) legendDisplay.style.top = '10px';
    canvas.style.cursor = 'crosshair';
    stopAutoRotate();
    drawCoordinateSystem();
}

// 切换到3D模式
function switchTo3D() {
    is3DMode = true;
    document.getElementById('btn-2d').classList.remove('active');
    document.getElementById('btn-3d').classList.add('active');
    let viewControlsCanvas = document.getElementById('view-controls-canvas');
    if (viewControlsCanvas) viewControlsCanvas.style.display = 'flex';
    let autoRotateControl = document.getElementById('auto-rotate-speed-control');
    if (autoRotateControl) autoRotateControl.style.display = 'block';
    let fogControl = document.getElementById('fog-control');
    if (fogControl) fogControl.style.display = 'block';
    // 3D模式下，图例位于3D操作按钮下方
    let legendDisplay = document.getElementById('legend-display');
    if (legendDisplay) legendDisplay.style.top = '45px';
    canvas.style.cursor = 'move';
    drawCoordinateSystem();
}

// 切换自动旋转
function toggleAutoRotate() {
    isAutoRotating = !isAutoRotating;
    let btn = document.getElementById('btn-autorotate');
    if (isAutoRotating) {
        btn.classList.add('active');
        startAutoRotate();
    } else {
        btn.classList.remove('active');
        stopAutoRotate();
    }
}

// 开始自动旋转
function startAutoRotate() {
    if (autoRotateAnimationId) return;
    
    function animate() {
        if (!isAutoRotating || !is3DMode) {
            stopAutoRotate();
            return;
        }
        
        rotationY += autoRotateSpeed;
        drawCoordinateSystem();
        autoRotateAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 停止自动旋转
function stopAutoRotate() {
    isAutoRotating = false;
    let btn = document.getElementById('btn-autorotate');
    if (btn) btn.classList.remove('active');
    if (autoRotateAnimationId) {
        cancelAnimationFrame(autoRotateAnimationId);
        autoRotateAnimationId = null;
    }
}

// 更新自动旋转速度
function updateAutoRotateSpeed(value) {
    autoRotateSpeed = value * 0.001;
}

// 更新图例显示
function updateLegend() {
    let legendDisplay = document.getElementById('legend-display');
    if (!legendDisplay) return;

    // 只显示可见的方程
    let visibleEquations = equations.filter(eq => eq.visible);
    
    if (visibleEquations.length === 0) {
        legendDisplay.style.display = 'none';
        return;
    }

    let html = '';
    visibleEquations.forEach((equation, index) => {
        let displayText = formatEquation(equation.parsed);
        // 截断过长的文本
        if (displayText.length > 25) {
            displayText = displayText.substring(0, 22) + '...';
        }
        html += `<div class="legend-item">
            <div class="legend-color" style="background-color: ${equation.color}"></div>
            <div class="legend-text">${displayText}</div>
        </div>`;
    });

    legendDisplay.innerHTML = html;
    legendDisplay.style.display = 'block';
}

// 切换深度雾化
function toggleFog() {
    fogEnabled = document.getElementById('fog-toggle').checked;
    fogColor = darkMode ? '#1a1a1a' : '#ffffff';
    drawCoordinateSystem();
}

// 3D点投影到2D画布（带深度雾化）
function project3DTo2DWithFog(x, y, z) {
    // 应用旋转
    let cosX = Math.cos(rotationX);
    let sinX = Math.sin(rotationX);
    let cosY = Math.cos(rotationY);
    let sinY = Math.sin(rotationY);

    // 绕Y轴旋转
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // 绕X轴旋转
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    // 投影到2D
    let screenX = offsetX + x1;
    let screenY = offsetY - y2;

    // 计算雾化因子（基于深度z2）
    let fogFactor = 1;
    if (fogEnabled) {
        let distance = Math.abs(z2) / scale;
        fogFactor = Math.exp(-fogDensity * distance);
        fogFactor = Math.max(0.1, Math.min(1, fogFactor));
    }

    return { x: screenX, y: screenY, z: z2, fogFactor: fogFactor };
}

// 重置为正视图（从Z轴正方向看）
function resetViewFront() {
    rotationX = 0;
    rotationY = 0;
    rotationZ = 0;
    drawCoordinateSystem();
}

// 重置为俯视图（从Y轴正方向看）
function resetViewTop() {
    rotationX = Math.PI / 2;
    rotationY = 0;
    rotationZ = 0;
    drawCoordinateSystem();
}

// 重置为侧视图（从X轴正方向看）
function resetViewSide() {
    rotationX = 0;
    rotationY = Math.PI / 2;
    rotationZ = 0;
    drawCoordinateSystem();
}

// 导入3D数据
function import3DData() {
    // 创建文件输入元素
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        let file = e.target.files[0];
        if (!file) return;

        let reader = new FileReader();
        reader.onload = function(event) {
            try {
                let data = JSON.parse(event.target.result);

                // 验证数据格式
                if (!data.equations || !Array.isArray(data.equations)) {
                    alert('无效的3D数据文件格式');
                    return;
                }

                // 保存当前状态到历史记录
                saveHistory();

                // 清空当前方程
                equations = [];

                // 恢复方程
                data.equations.forEach(function(eqData) {
                    if (eqData.type === '3dcurve' || eqData.type === '3dsurface') {
                        equations.push({
                            formula: eqData.formula || '',
                            parsed: {
                                type: eqData.type,
                                curveType: eqData.curveType,
                                surfaceType: eqData.surfaceType,
                                name: eqData.name,
                                formula: eqData.formula,
                                params: eqData.params || {},
                                paramLabels: eqData.paramLabels || {}
                            },
                            color: eqData.color || '#ff0000',
                            style: eqData.style || 'solid',
                            visible: true
                        });
                    }
                });

                // 恢复视图设置（可选）
                if (data.viewSettings) {
                    scale = data.viewSettings.scale || 20;
                    offsetX = data.viewSettings.offsetX || 400;
                    offsetY = data.viewSettings.offsetY || 300;
                    rotationX = data.viewSettings.rotationX || 0.5;
                    rotationY = data.viewSettings.rotationY || 0.5;
                    rotationZ = data.viewSettings.rotationZ || 0;
                }

                // 保存并更新
                saveEquations();
                updateEquationsList();
                drawCoordinateSystem();

                alert('3D数据导入成功！');
            } catch (error) {
                alert('导入失败：' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 导出3D数据为JSON格式
function export3DData() {
    // 收集所有3D曲线和曲面的数据
    let exportData = {
        timestamp: new Date().toISOString(),
        viewSettings: {
            rotationX: rotationX,
            rotationY: rotationY,
            rotationZ: rotationZ,
            scale: scale,
            offsetX: offsetX,
            offsetY: offsetY
        },
        equations: []
    };

    equations.forEach((equation, index) => {
        if (!equation.visible) return;

        let eqData = {
            index: index,
            name: formatEquation(equation.parsed),
            color: equation.color,
            style: equation.style,
            type: equation.parsed.type
        };

        if (equation.parsed.type === '3dcurve') {
            eqData.curveType = equation.parsed.curveType;
            eqData.params = equation.parsed.params;
            // 生成曲线点数据
            eqData.points = [];
            let step = 0.05;
            let tRange = equation.parsed.curveType === 'twisted-cubic' ? 6 : 4 * Math.PI;
            let tStart = equation.parsed.curveType === 'twisted-cubic' ? -3 : 0;

            for (let t = tStart; t <= tStart + tRange; t += step) {
                let point = calculate3DCurvePoint(equation.parsed.curveType, t, equation.parsed.params);
                if (isFinite(point.x) && isFinite(point.y) && isFinite(point.z)) {
                    eqData.points.push({ x: point.x, y: point.y, z: point.z });
                }
            }
        } else if (equation.parsed.type === '3dsurface') {
            eqData.surfaceType = equation.parsed.surfaceType;
            eqData.params = equation.parsed.params;
            // 生成曲面点数据（简化版本，只取网格点）
            eqData.points = [];
            let uStep = 0.5, vStep = 0.5;
            let uRange = { min: -5, max: 5 };
            let vRange = { min: -5, max: 5 };

            for (let u = uRange.min; u <= uRange.max; u += uStep) {
                for (let v = vRange.min; v <= vRange.max; v += vStep) {
                    let point = calculate3DSurfacePoint(equation.parsed.surfaceType, u, v, equation.parsed.params);
                    if (isFinite(point.x) && isFinite(point.y) && isFinite(point.z)) {
                        eqData.points.push({ x: point.x, y: point.y, z: point.z, u: u, v: v });
                    }
                }
            }
        }

        exportData.equations.push(eqData);
    });

    // 转换为JSON字符串
    let jsonStr = JSON.stringify(exportData, null, 2);

    // 创建下载链接
    let blob = new Blob([jsonStr], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `3d_data_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('3D数据已导出！');
}

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
    if (menu && btn && !menu.classList.contains('hidden') && 
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
    // 重置3D旋转角度
    rotationX = 0.5;
    rotationY = 0.5;
    rotationZ = 0;
    drawCoordinateSystem();
}

// 处理鼠标滚轮事件
function handleWheel(e) {
    e.preventDefault();

    let scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;

    if (is3DMode) {
        // 3D模式下，滚轮缩放整体视图
        scale *= scaleFactor;
        scale = Math.max(5, Math.min(200, scale));
    } else {
        // 2D模式下，滚轮缩放坐标系
        scale *= scaleFactor;
        scale = Math.max(5, Math.min(100, scale));
    }

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

    if (is3DMode) {
        // 3D模式下，拖拽旋转视角
        isRotating = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        return;
    }

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

    // 3D模式下处理旋转
    if (is3DMode && isRotating) {
        let deltaX = e.clientX - lastMouseX;
        let deltaY = e.clientY - lastMouseY;

        // 更新旋转角度
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;

        // 限制X轴旋转范围，避免翻转
        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        drawCoordinateSystem();
        return;
    }

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
    if (!isDragging && !isDraggingEquation && !isRotating) {
        let hoveredEquationIndex = findEquationAtPoint(x, y);
        if (hoveredEquationIndex >= 0 || selectedEquationIndex >= 0) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = is3DMode ? 'move' : 'crosshair';
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
    isRotating = false;
    canvas.style.cursor = is3DMode ? 'move' : 'crosshair';
    document.getElementById('coordinate-display').style.display = 'none';
}

// 处理鼠标释放事件
function handleMouseUp() {
    isDragging = false;
    isDraggingEquation = false;
    isRotating = false;
    canvas.style.cursor = is3DMode ? 'move' : 'crosshair';
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