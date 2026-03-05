/**
 * 数学工具函数
 * @module utils/mathUtils
 */

/**
 * 根据缩放级别确定小数位数
 * @param {number} scale - 当前缩放级别
 * @returns {number} 小数位数
 */
export function getDecimalPlaces(scale) {
    if (scale >= 50) return 2;
    if (scale >= 20) return 1;
    return 0;
}

/**
 * 格式化坐标值
 * @param {number} value - 坐标值
 * @param {number} scale - 当前缩放级别
 * @returns {string} 格式化后的字符串
 */
export function formatCoordinate(value, scale) {
    const decimalPlaces = getDecimalPlaces(scale);
    return value.toFixed(decimalPlaces);
}

/**
 * 将画布坐标转换为数学坐标
 * @param {number} canvasX - 画布X坐标
 * @param {number} canvasY - 画布Y坐标
 * @param {number} offsetX - X轴偏移
 * @param {number} offsetY - Y轴偏移
 * @param {number} scale - 缩放比例
 * @returns {Object} {x, y} 数学坐标
 */
export function canvasToMath(canvasX, canvasY, offsetX, offsetY, scale) {
    return {
        x: (canvasX - offsetX) / scale,
        y: (offsetY - canvasY) / scale
    };
}

/**
 * 将数学坐标转换为画布坐标
 * @param {number} mathX - 数学X坐标
 * @param {number} mathY - 数学Y坐标
 * @param {number} offsetX - X轴偏移
 * @param {number} offsetY - Y轴偏移
 * @param {number} scale - 缩放比例
 * @returns {Object} {x, y} 画布坐标
 */
export function mathToCanvas(mathX, mathY, offsetX, offsetY, scale) {
    return {
        x: offsetX + mathX * scale,
        y: offsetY - mathY * scale
    };
}

/**
 * 3D点投影到2D
 * @param {number} x - 3D X坐标
 * @param {number} y - 3D Y坐标
 * @param {number} z - 3D Z坐标
 * @param {number} rotationX - X轴旋转角度
 * @param {number} rotationY - Y轴旋转角度
 * @param {number} offsetX - 画布X偏移
 * @param {number} offsetY - 画布Y偏移
 * @param {number} scale - 缩放比例
 * @param {boolean} fogEnabled - 是否启用雾化
 * @param {number} fogDensity - 雾化密度
 * @returns {Object} {x, y, z, fogFactor} 投影后的坐标和雾化因子
 */
export function project3DTo2D(x, y, z, rotationX, rotationY, offsetX, offsetY, scale, fogEnabled = false, fogDensity = 0.02) {
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    // 绕Y轴旋转
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // 绕X轴旋转
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // 投影到2D
    const screenX = offsetX + x1;
    const screenY = offsetY - y2;

    // 计算雾化因子
    let fogFactor = 1;
    if (fogEnabled) {
        const distance = Math.abs(z2) / scale;
        fogFactor = Math.exp(-fogDensity * distance);
        fogFactor = Math.max(0.1, Math.min(1, fogFactor));
    }

    return { x: screenX, y: screenY, z: z2, fogFactor };
}

/**
 * 计算两点间距离
 * @param {number} x1 - 点1 X坐标
 * @param {number} y1 - 点1 Y坐标
 * @param {number} x2 - 点2 X坐标
 * @param {number} y2 - 点2 Y坐标
 * @returns {number} 距离
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 限制数值在范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} t - 插值系数(0-1)
 * @returns {number} 插值结果
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
export function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
export function toDegrees(radians) {
    return radians * (180 / Math.PI);
}
