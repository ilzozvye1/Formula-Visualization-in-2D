// 坐标系绘制相关函数
import * as globals from './globals.js';
import { getDecimalPlaces, formatNumber } from './utils.js';
import { drawAllEquations, drawAllEquations3D } from './equations.js';
import { drawIntersections } from './intersections.js';
import { updateLegend } from './ui.js';

// 绘制坐标系
export function drawCoordinateSystem() {
    console.log('绘制坐标系');
    if (!globals.canvas || !globals.ctx) {
        console.error('Canvas or context not initialized');
        return;
    }
    
    if (globals.is3DMode) {
        draw3DCoordinateSystem();
    } else {
        draw2DCoordinateSystem();
    }
    updateLegend();
}

// 绘制2D坐标系
export function draw2DCoordinateSystem() {
    globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);

    // 设置背景色
    if (globals.darkMode) {
        globals.ctx.fillStyle = '#1a1a1a';
        globals.ctx.fillRect(0, 0, globals.canvas.width, globals.canvas.height);
    }

    if (globals.showGrid) {
        // 确定网格间距
        let gridSpacing = Math.max(20, globals.scale);

        // 绘制网格
        globals.ctx.strokeStyle = globals.darkMode ? '#333' : '#e0e0e0';
        globals.ctx.lineWidth = 0.5;

        // 垂直线
        for (let x = 0; x < globals.canvas.width; x += gridSpacing) {
            globals.ctx.beginPath();
            globals.ctx.moveTo(x, 0);
            globals.ctx.lineTo(x, globals.canvas.height);
            globals.ctx.stroke();
        }

        // 水平线
        for (let y = 0; y < globals.canvas.height; y += gridSpacing) {
            globals.ctx.beginPath();
            globals.ctx.moveTo(0, y);
            globals.ctx.lineTo(globals.canvas.width, y);
            globals.ctx.stroke();
        }
    }

    // 绘制坐标轴
    globals.ctx.strokeStyle = globals.darkMode ? '#888' : '#000';
    globals.ctx.lineWidth = 2;

    // X轴
    globals.ctx.beginPath();
    globals.ctx.moveTo(0, globals.offsetY);
    globals.ctx.lineTo(globals.canvas.width, globals.offsetY);
    globals.ctx.stroke();

    // Y轴
    globals.ctx.beginPath();
    globals.ctx.moveTo(globals.offsetX, 0);
    globals.ctx.lineTo(globals.offsetX, globals.canvas.height);
    globals.ctx.stroke();

    // 绘制坐标轴标签
    globals.ctx.fillStyle = globals.darkMode ? '#ccc' : '#000';
    globals.ctx.font = '12px Arial';
    globals.ctx.textAlign = 'center';

    let decimalPlaces = getDecimalPlaces(globals.scale);
    let labelSpacing = Math.max(40, globals.scale * 2);

    // X轴标签
    for (let x = globals.offsetX; x < globals.canvas.width; x += labelSpacing) {
        let value = (x - globals.offsetX) / globals.scale;
        globals.ctx.fillText(formatNumber(value, decimalPlaces), x, globals.offsetY + 15);
    }
    for (let x = globals.offsetX; x > 0; x -= labelSpacing) {
        let value = (x - globals.offsetX) / globals.scale;
        globals.ctx.fillText(formatNumber(value, decimalPlaces), x, globals.offsetY + 15);
    }

    // Y轴标签
    globals.ctx.textAlign = 'right';
    for (let y = globals.offsetY; y > 0; y -= labelSpacing) {
        let value = (globals.offsetY - y) / globals.scale;
        globals.ctx.fillText(formatNumber(value, decimalPlaces), globals.offsetX - 5, y + 4);
    }
    for (let y = globals.offsetY; y < globals.canvas.height; y += labelSpacing) {
        let value = (globals.offsetY - y) / globals.scale;
        globals.ctx.fillText(formatNumber(value, decimalPlaces), globals.offsetX - 5, y + 4);
    }

    // 绘制原点
    globals.ctx.fillText('O', globals.offsetX - 10, globals.offsetY + 15);

    // 绘制所有方程
    drawAllEquations();

    // 绘制交点
    if (globals.showIntersections) {
        drawIntersections();
    }
}

// 3D投影带雾效
export function project3DTo2DWithFog(x, y, z) {
    // 简单的3D投影实现
    // 这里省略了复杂的透视投影和雾效实现
    return {
        x: x + globals.offsetX,
        y: globals.offsetY - y,
        z: z
    };
}

// 3D点投影到2D画布
export function project3DTo2D(x, y, z) {
    return project3DTo2DWithFog(x, y, z);
}

// 绘制3D坐标系
export function draw3DCoordinateSystem() {
    globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);

    // 设置背景色
    if (globals.darkMode) {
        globals.ctx.fillStyle = '#1a1a1a';
        globals.ctx.fillRect(0, 0, globals.canvas.width, globals.canvas.height);
    }

    // 绘制3D网格
    if (globals.showGrid) {
        draw3DGrid();
    }

    // 绘制3D坐标轴
    draw3DAxes();

    // 绘制3D方程
    drawAllEquations3D();
}

// 绘制3D网格
export function draw3DGrid() {
    globals.ctx.strokeStyle = globals.darkMode ? '#333' : '#e0e0e0';
    globals.ctx.lineWidth = 0.5;

    let gridRange = 10;
    let gridStep = 1;

    // XY平面网格
    for (let i = -gridRange; i <= gridRange; i += gridStep) {
        // 沿X方向的线
        let start1 = project3DTo2D(-gridRange * globals.scale, i * globals.scale, 0);
        let end1 = project3DTo2D(gridRange * globals.scale, i * globals.scale, 0);
        globals.ctx.beginPath();
        globals.ctx.moveTo(start1.x, start1.y);
        globals.ctx.lineTo(end1.x, end1.y);
        globals.ctx.stroke();

        // 沿Y方向的线
        let start2 = project3DTo2D(i * globals.scale, -gridRange * globals.scale, 0);
        let end2 = project3DTo2D(i * globals.scale, gridRange * globals.scale, 0);
        globals.ctx.beginPath();
        globals.ctx.moveTo(start2.x, start2.y);
        globals.ctx.lineTo(end2.x, end2.y);
        globals.ctx.stroke();
    }

    // XZ平面网格
    for (let i = -gridRange; i <= gridRange; i += gridStep) {
        // 沿X方向的线
        let start1 = project3DTo2D(-gridRange * globals.scale, 0, i * globals.scale);
        let end1 = project3DTo2D(gridRange * globals.scale, 0, i * globals.scale);
        globals.ctx.beginPath();
        globals.ctx.moveTo(start1.x, start1.y);
        globals.ctx.lineTo(end1.x, end1.y);
        globals.ctx.stroke();

        // 沿Z方向的线
        let start2 = project3DTo2D(i * globals.scale, 0, -gridRange * globals.scale);
        let end2 = project3DTo2D(i * globals.scale, 0, gridRange * globals.scale);
        globals.ctx.beginPath();
        globals.ctx.moveTo(start2.x, start2.y);
        globals.ctx.lineTo(end2.x, end2.y);
        globals.ctx.stroke();
    }
}

// 绘制3D坐标轴
export function draw3DAxes() {
    globals.ctx.strokeStyle = globals.darkMode ? '#888' : '#000';
    globals.ctx.lineWidth = 2;

    let axisLength = 12 * globals.scale;

    // X轴（红色）
    globals.ctx.strokeStyle = '#ff0000';
    globals.ctx.beginPath();
    let xAxisStart = project3DTo2D(-axisLength, 0, 0);
    let xAxisEnd = project3DTo2D(axisLength, 0, 0);
    globals.ctx.moveTo(xAxisStart.x, xAxisStart.y);
    globals.ctx.lineTo(xAxisEnd.x, xAxisEnd.y);
    globals.ctx.stroke();

    // Y轴（绿色）
    globals.ctx.strokeStyle = '#00ff00';
    globals.ctx.beginPath();
    let yAxisStart = project3DTo2D(0, -axisLength, 0);
    let yAxisEnd = project3DTo2D(0, axisLength, 0);
    globals.ctx.moveTo(yAxisStart.x, yAxisStart.y);
    globals.ctx.lineTo(yAxisEnd.x, yAxisEnd.y);
    globals.ctx.stroke();

    // Z轴（蓝色）
    globals.ctx.strokeStyle = '#0000ff';
    globals.ctx.beginPath();
    let zAxisStart = project3DTo2D(0, 0, -axisLength);
    let zAxisEnd = project3DTo2D(0, 0, axisLength);
    globals.ctx.moveTo(zAxisStart.x, zAxisStart.y);
    globals.ctx.lineTo(zAxisEnd.x, zAxisEnd.y);
    globals.ctx.stroke();

    // 绘制坐标轴标签
    globals.ctx.fillStyle = globals.darkMode ? '#ccc' : '#000';
    globals.ctx.font = 'bold 14px Arial';
    globals.ctx.textAlign = 'left';

    // X轴标签
    globals.ctx.fillStyle = '#ff0000';
    let xLabel = project3DTo2D(axisLength + 0.5 * globals.scale, 0, 0);
    globals.ctx.fillText('X', xLabel.x, xLabel.y);

    // Y轴标签
    globals.ctx.fillStyle = '#00ff00';
    let yLabel = project3DTo2D(0, axisLength + 0.5 * globals.scale, 0);
    globals.ctx.fillText('Y', yLabel.x, yLabel.y);

    // Z轴标签
    globals.ctx.fillStyle = '#0000ff';
    let zLabel = project3DTo2D(0, 0, axisLength + 0.5 * globals.scale);
    globals.ctx.fillText('Z', zLabel.x, zLabel.y);

    // 绘制原点
    globals.ctx.fillStyle = globals.darkMode ? '#fff' : '#000';
    let origin = project3DTo2D(0, 0, 0);
    globals.ctx.fillText('O', origin.x - 15, origin.y + 15);

    // 绘制刻度标签
    globals.ctx.font = '11px Arial';
    globals.ctx.fillStyle = globals.darkMode ? '#ccc' : '#000';

    let decimalPlaces = getDecimalPlaces(globals.scale);
    let labelStep = Math.max(1, Math.floor(5 / globals.scale));

    // X轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(i * globals.scale, 0, 0);
        globals.ctx.fillText(formatNumber(i, decimalPlaces), pos.x, pos.y + 15);
    }

    // Y轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(0, i * globals.scale, 0);
        globals.ctx.fillText(formatNumber(i, decimalPlaces), pos.x - 5, pos.y);
    }

    // Z轴刻度
    for (let i = -10; i <= 10; i += labelStep) {
        if (i === 0) continue;
        let pos = project3DTo2D(0, 0, i * globals.scale);
        globals.ctx.fillText(formatNumber(i, decimalPlaces), pos.x + 5, pos.y);
    }
}