// 工具函数

// 根据缩放级别确定小数位数
export function getDecimalPlaces(scale) {
    if (scale >= 20) {
        return 2; // 放大时，显示2位小数
    } else if (scale >= 10) {
        return 1; // 中等缩放，显示1位小数
    } else {
        return 0; // 缩小时，显示整数（不显示小数点）
    }
}

// 格式化数字，确保整数不显示小数点
export function formatNumber(value, decimalPlaces) {
    if (decimalPlaces === 0) {
        return Math.round(value).toString();
    } else {
        return value.toFixed(decimalPlaces);
    }
}