// 交点计算和绘制相关函数
import * as globals from './globals.js';

// 绘制交点
export function drawIntersections() {
    if (globals.equations.length < 2) {
        return; // 至少需要两个方程才能计算交点
    }

    // 计算所有方程对的交点
    const allIntersections = [];
    for (let i = 0; i < globals.equations.length; i++) {
        const eq1 = globals.equations[i];
        if (!eq1.visible) continue;

        for (let j = i + 1; j < globals.equations.length; j++) {
            const eq2 = globals.equations[j];
            if (!eq2.visible) continue;

            // 计算两个方程的交点
            const intersections = calculateLineIntersections(eq1.parsed, eq2.parsed);
            allIntersections.push(...intersections);
        }
    }

    // 绘制所有交点
    allIntersections.forEach(intersection => {
        drawIntersectionPoint(intersection);
    });
}

// 计算坐标轴交点
export function calculateAxisIntersections(parsed) {
    // 这里省略了复杂的坐标轴交点计算逻辑
    return [];
}

// 使用二分法寻找根
export function findRootBisection(parsed, a, b, fa, fb) {
    // 这里省略了复杂的二分法寻找根逻辑
    return 0;
}

// 计算两条线的交点
export function calculateLineIntersections(parsed1, parsed2) {
    // 这里省略了复杂的两条线交点计算逻辑
    return [];
}

// 优化交点坐标
export function refineIntersection(parsed1, parsed2, initialX) {
    // 这里省略了复杂的交点坐标优化逻辑
    return { x: initialX, y: 0 };
}

// 绘制交点
export function drawIntersectionPoint(intersection) {
    // 设置交点样式
    globals.ctx.fillStyle = globals.intersectionColor;
    globals.ctx.strokeStyle = '#ffffff';
    globals.ctx.lineWidth = 2;

    // 计算交点在画布上的位置
    const canvasX = intersection.x * globals.scale + globals.offsetX;
    const canvasY = globals.offsetY - intersection.y * globals.scale;

    // 绘制交点
    globals.ctx.beginPath();
    globals.ctx.arc(canvasX, canvasY, globals.intersectionSize / 2, 0, 2 * Math.PI);
    globals.ctx.fill();
    globals.ctx.stroke();

    // 显示交点坐标
    if (intersection.showLabel) {
        globals.ctx.fillStyle = globals.darkMode ? '#ffffff' : '#000000';
        globals.ctx.font = '10px Arial';
        globals.ctx.textAlign = 'center';
        globals.ctx.fillText(
            `(${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)})`,
            canvasX,
            canvasY - 10
        );
    }
}