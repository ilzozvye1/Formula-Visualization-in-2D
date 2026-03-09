// 存储相关函数
import * as globals from './globals.js';

// 保存方程到本地存储
export function saveEquations() {
    try {
        const data = {
            equations: globals.equations,
            scale: globals.scale,
            offsetX: globals.offsetX,
            offsetY: globals.offsetY,
            showGrid: globals.showGrid,
            darkMode: globals.darkMode,
            xMin: globals.xMin,
            xMax: globals.xMax,
            yMin: globals.yMin,
            yMax: globals.yMax,
            showIntersections: globals.showIntersections,
            intersectionColor: globals.intersectionColor,
            intersectionSize: globals.intersectionSize
        };
        localStorage.setItem('formula_visualization_data', JSON.stringify(data));
    } catch (error) {
        console.error('保存方程失败:', error);
    }
}

// 从本地存储加载方程
export function loadEquations() {
    try {
        const data = localStorage.getItem('formula_visualization_data');
        if (data) {
            const parsedData = JSON.parse(data);
            
            // 恢复方程
            if (parsedData.equations) {
                globals.equations = parsedData.equations;
            }
            
            // 恢复视图设置
            if (typeof parsedData.scale === 'number') {
                globals.scale = parsedData.scale;
            }
            if (typeof parsedData.offsetX === 'number') {
                globals.offsetX = parsedData.offsetX;
            }
            if (typeof parsedData.offsetY === 'number') {
                globals.offsetY = parsedData.offsetY;
            }
            if (typeof parsedData.showGrid === 'boolean') {
                globals.showGrid = parsedData.showGrid;
                document.getElementById('show-grid').checked = parsedData.showGrid;
            }
            if (typeof parsedData.darkMode === 'boolean') {
                globals.darkMode = parsedData.darkMode;
                document.body.classList.toggle('dark-mode', parsedData.darkMode);
                document.getElementById('dark-mode').checked = parsedData.darkMode;
            }
            
            // 恢复坐标轴范围
            if (typeof parsedData.xMin === 'number') {
                globals.xMin = parsedData.xMin;
                document.getElementById('x-min').value = parsedData.xMin;
            }
            if (typeof parsedData.xMax === 'number') {
                globals.xMax = parsedData.xMax;
                document.getElementById('x-max').value = parsedData.xMax;
            }
            if (typeof parsedData.yMin === 'number') {
                globals.yMin = parsedData.yMin;
                document.getElementById('y-min').value = parsedData.yMin;
            }
            if (typeof parsedData.yMax === 'number') {
                globals.yMax = parsedData.yMax;
                document.getElementById('y-max').value = parsedData.yMax;
            }
            
            // 恢复交点设置
            if (typeof parsedData.showIntersections === 'boolean') {
                globals.showIntersections = parsedData.showIntersections;
                document.getElementById('show-intersections').checked = parsedData.showIntersections;
            }
            if (parsedData.intersectionColor) {
                globals.intersectionColor = parsedData.intersectionColor;
                document.getElementById('intersection-color').value = parsedData.intersectionColor;
            }
            if (typeof parsedData.intersectionSize === 'number') {
                globals.intersectionSize = parsedData.intersectionSize;
            }
        }
    } catch (error) {
        console.error('加载方程失败:', error);
    }
}
