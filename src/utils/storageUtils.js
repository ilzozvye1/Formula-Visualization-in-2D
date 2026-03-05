/**
 * 存储工具模块
 * @module utils/storageUtils
 */

const STORAGE_KEY = 'formula_visualization_data';

/**
 * 保存数据到本地存储
 * @param {Object} data - 要保存的数据
 */
export function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

/**
 * 从本地存储加载数据
 * @returns {Object|null} 加载的数据
 */
export function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('从本地存储加载失败:', error);
        return null;
    }
}

/**
 * 清除本地存储
 */
export function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('清除本地存储失败:', error);
    }
}

/**
 * 导出数据为JSON文件
 * @param {Object} data - 要导出的数据
 * @param {string} filename - 文件名
 */
export function exportToJSON(data, filename = 'formula_data.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 从JSON文件导入数据
 * @param {Function} callback - 回调函数
 */
export function importFromJSON(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                callback(null, data);
            } catch (error) {
                callback(error, null);
            }
        };
        reader.onerror = () => callback(new Error('读取文件失败'), null);
        reader.readAsText(file);
    };
    input.click();
}
