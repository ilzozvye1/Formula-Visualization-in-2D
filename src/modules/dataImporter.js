/**
 * 数据导入模块
 * @module modules/dataImporter
 */

import appState from './stateManager.js';
import { parseFormula } from './equationParser.js';

/**
 * 数据导入器类
 */
export class DataImporter {
    constructor() {
        this.supportedFormats = ['csv', 'xlsx', 'xls', 'json'];
    }

    /**
     * 导入CSV文件
     * @param {File} file - CSV文件
     * @returns {Promise<Array>} 数据点数组
     */
    async importCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const data = this.parseCSV(text);
                    resolve(data);
                } catch (error) {
                    reject(new Error('CSV解析失败: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * 解析CSV文本
     * @param {string} text - CSV文本
     * @returns {Array} 数据点数组
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV文件至少需要包含标题行和一行数据');
        }

        // 解析标题行
        const headers = this.parseCSVLine(lines[0]);
        
        // 自动检测列类型
        const columnTypes = this.detectColumnTypes(lines.slice(1, 6), headers);
        
        // 查找X和Y列
        const xColumn = this.findXColumn(headers, columnTypes);
        const yColumn = this.findYColumn(headers, columnTypes);
        
        if (xColumn === -1 || yColumn === -1) {
            throw new Error('无法识别X和Y数据列，请确保列名包含x/y或数据为数值类型');
        }

        // 解析数据行
        const dataPoints = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > Math.max(xColumn, yColumn)) {
                const x = parseFloat(values[xColumn]);
                const y = parseFloat(values[yColumn]);
                
                if (!isNaN(x) && !isNaN(y)) {
                    dataPoints.push({ x, y, row: i });
                }
            }
        }

        return {
            headers,
            data: dataPoints,
            xColumn: headers[xColumn],
            yColumn: headers[yColumn],
            totalRows: lines.length - 1,
            validRows: dataPoints.length
        };
    }

    /**
     * 解析CSV行
     * @param {string} line - CSV行
     * @returns {Array} 值数组
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    /**
     * 检测列类型
     * @param {Array} sampleLines - 样例行
     * @param {Array} headers - 标题
     * @returns {Array} 列类型数组
     */
    detectColumnTypes(sampleLines, headers) {
        const types = new Array(headers.length).fill('unknown');
        
        for (let col = 0; col < headers.length; col++) {
            let numericCount = 0;
            let totalCount = 0;
            
            for (const line of sampleLines) {
                const values = this.parseCSVLine(line);
                if (col < values.length && values[col].trim()) {
                    totalCount++;
                    if (!isNaN(parseFloat(values[col]))) {
                        numericCount++;
                    }
                }
            }
            
            // 如果80%以上是数字，认为是数值列
            if (totalCount > 0 && numericCount / totalCount > 0.8) {
                types[col] = 'numeric';
            } else {
                types[col] = 'text';
            }
        }
        
        return types;
    }

    /**
     * 查找X列
     * @param {Array} headers - 标题
     * @param {Array} types - 类型
     * @returns {number} 列索引
     */
    findXColumn(headers, types) {
        // 首先查找明确的X列
        const xKeywords = ['x', 'X', '横坐标', '横轴', 'horizontal', 'axis_x'];
        for (let i = 0; i < headers.length; i++) {
            if (xKeywords.some(keyword => headers[i].toLowerCase().includes(keyword.toLowerCase()))) {
                return i;
            }
        }
        
        // 然后查找第一个数值列
        for (let i = 0; i < types.length; i++) {
            if (types[i] === 'numeric') {
                return i;
            }
        }
        
        return -1;
    }

    /**
     * 查找Y列
     * @param {Array} headers - 标题
     * @param {Array} types - 类型
     * @returns {number} 列索引
     */
    findYColumn(headers, types) {
        // 首先查找明确的Y列
        const yKeywords = ['y', 'Y', '纵坐标', '纵轴', 'vertical', 'axis_y', 'value', '数值'];
        for (let i = 0; i < headers.length; i++) {
            if (yKeywords.some(keyword => headers[i].toLowerCase().includes(keyword.toLowerCase()))) {
                return i;
            }
        }
        
        // 然后查找第二个数值列
        let foundFirst = false;
        for (let i = 0; i < types.length; i++) {
            if (types[i] === 'numeric') {
                if (foundFirst) {
                    return i;
                }
                foundFirst = true;
            }
        }
        
        return -1;
    }

    /**
     * 从数据点创建散点方程
     * @param {Array} dataPoints - 数据点数组
     * @param {string} name - 方程名称
     * @returns {Object} 方程对象
     */
    createScatterEquation(dataPoints, name = '数据点') {
        return {
            formula: `scatter:${name}`,
            parsed: {
                type: 'scatter',
                name: name,
                dataPoints: dataPoints,
                xMin: Math.min(...dataPoints.map(p => p.x)),
                xMax: Math.max(...dataPoints.map(p => p.x)),
                yMin: Math.min(...dataPoints.map(p => p.y)),
                yMax: Math.max(...dataPoints.map(p => p.y))
            },
            color: appState.getNewEquationColor(),
            style: 'solid',
            visible: true
        };
    }

    /**
     * 从数据点进行线性拟合
     * @param {Array} dataPoints - 数据点数组
     * @returns {Object} 拟合结果
     */
    linearFit(dataPoints) {
        const n = dataPoints.length;
        if (n < 2) return null;

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (const point of dataPoints) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
        }

        const denominator = n * sumX2 - sumX * sumX;
        if (denominator === 0) return null;

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        // 计算R²
        const yMean = sumY / n;
        let ssTotal = 0, ssResidual = 0;
        
        for (const point of dataPoints) {
            const predicted = slope * point.x + intercept;
            ssTotal += Math.pow(point.y - yMean, 2);
            ssResidual += Math.pow(point.y - predicted, 2);
        }
        
        const rSquared = 1 - (ssResidual / ssTotal);

        return {
            slope,
            intercept,
            rSquared,
            formula: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
            equation: {
                formula: `y=${slope.toFixed(4)}x+${intercept.toFixed(4)}`,
                parsed: {
                    type: 'linear',
                    slope,
                    intercept
                },
                color: appState.getNewEquationColor(),
                style: 'dashed',
                visible: true
            }
        };
    }

    /**
     * 导入JSON数据
     * @param {File} file - JSON文件
     * @returns {Promise<Object>} 数据对象
     */
    async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('JSON解析失败: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * 验证文件格式
     * @param {File} file - 文件
     * @returns {boolean} 是否支持
     */
    validateFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    /**
     * 获取文件信息
     * @param {File} file - 文件
     * @returns {Object} 文件信息
     */
    getFileInfo(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return {
            name: file.name,
            extension,
            size: file.size,
            type: file.type,
            isSupported: this.supportedFormats.includes(extension)
        };
    }
}

// 创建单例实例
const dataImporter = new DataImporter();

export default dataImporter;
export { DataImporter };
