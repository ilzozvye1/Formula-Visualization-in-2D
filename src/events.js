// 事件处理相关函数
import * as globals from './globals.js';
import { drawCoordinateSystem } from './drawing.js';
import { saveHistory } from './history.js';

// 处理鼠标滚轮缩放
export function handleWheel(e) {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.2;
    const newScale = Math.max(5, Math.min(100, globals.scale * zoomFactor));
    
    if (newScale !== globals.scale) {
        saveHistory();
        globals.scale = newScale;
        drawCoordinateSystem();
    }
}

// 处理鼠标按下事件
export function handleMouseDown(e) {
    if (e.button === 0) { // 左键
        globals.isDragging = true;
        globals.lastX = e.clientX;
        globals.lastY = e.clientY;
        globals.canvas.style.cursor = 'grabbing';
        
        // 检查是否点击了方程
        // 这里应该实现方程点击检测逻辑
    }
}

// 处理鼠标移动事件
export function handleMouseMove(e) {
    // 显示坐标
    const rect = globals.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 转换为坐标系坐标
    const coordX = (x - globals.offsetX) / globals.scale;
    const coordY = (globals.offsetY - y) / globals.scale;
    
    const coordinateDisplay = document.getElementById('coordinate-display');
    if (coordinateDisplay) {
        coordinateDisplay.textContent = `(${coordX.toFixed(2)}, ${coordY.toFixed(2)})`;
    }
    
    // 处理拖动
    if (globals.isDragging) {
        saveHistory();
        const dx = e.clientX - globals.lastX;
        const dy = e.clientY - globals.lastY;
        
        globals.offsetX += dx;
        globals.offsetY += dy;
        
        globals.lastX = e.clientX;
        globals.lastY = e.clientY;
        
        drawCoordinateSystem();
    }
    
    // 处理3D旋转
    if (globals.isRotating) {
        const dx = e.clientX - globals.lastMouseX;
        const dy = e.clientY - globals.lastMouseY;
        
        globals.rotationY += dx * 0.005;
        globals.rotationX += dy * 0.005;
        
        globals.lastMouseX = e.clientX;
        globals.lastMouseY = e.clientY;
        
        drawCoordinateSystem();
    }
}

// 处理鼠标释放事件
export function handleMouseUp(e) {
    if (e.button === 0) { // 左键
        globals.isDragging = false;
        globals.canvas.style.cursor = 'crosshair';
    }
    
    globals.isRotating = false;
}

// 处理鼠标离开事件
export function handleMouseLeave() {
    globals.isDragging = false;
    globals.isRotating = false;
    globals.canvas.style.cursor = 'crosshair';
}

// 处理触摸开始事件
export function handleTouchStart(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        globals.isDragging = true;
        globals.lastX = touch.clientX;
        globals.lastY = touch.clientY;
        globals.canvas.style.cursor = 'grabbing';
    }
}

// 处理触摸移动事件
export function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && globals.isDragging) {
        const touch = e.touches[0];
        const dx = touch.clientX - globals.lastX;
        const dy = touch.clientY - globals.lastY;
        
        saveHistory();
        globals.offsetX += dx;
        globals.offsetY += dy;
        
        globals.lastX = touch.clientX;
        globals.lastY = touch.clientY;
        
        drawCoordinateSystem();
    }
    
    // 处理双指缩放
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (globals.lastDistance) {
            const zoomFactor = distance / globals.lastDistance;
            const newScale = Math.max(5, Math.min(100, globals.scale * zoomFactor));
            
            if (newScale !== globals.scale) {
                saveHistory();
                globals.scale = newScale;
                drawCoordinateSystem();
            }
        }
        
        globals.lastDistance = distance;
    }
}

// 处理触摸结束事件
export function handleTouchEnd() {
    globals.isDragging = false;
    globals.lastDistance = null;
    globals.canvas.style.cursor = 'crosshair';
}

// 处理键盘事件
export function handleKeyDown(e) {
    // Delete键删除选中的方程
    if (e.key === 'Delete' && globals.selectedEquationIndex >= 0) {
        saveHistory();
        // 调用removeEquation函数，该函数应该在ui.js中定义
        window.removeEquation(globals.selectedEquationIndex);
        return;
    }

    // Ctrl/Cmd + Z: 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        window.undo();
        return;
    }

    // Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z: 重做
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        window.redo();
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
        window.exportImage();
        return;
    }

    // Ctrl/Cmd + R: 重置视图
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        window.resetView();
        return;
    }

    // Ctrl/Cmd + 0: 重置缩放
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        window.resetView();
        return;
    }

    // Escape: 取消选中/关闭菜单
    if (e.key === 'Escape') {
        if (globals.selectedEquationIndex >= 0) {
            globals.selectedEquationIndex = -1;
            window.updateEquationsList();
            drawCoordinateSystem();
        }
        // 关闭菜单
        document.getElementById('preset-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.add('hidden');
        return;
    }

    // 方向键微调选中的方程
    if (globals.selectedEquationIndex >= 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        saveHistory();
        const step = e.shiftKey ? 0.5 : 0.1; // Shift键加速
        
        // 调用updateEquationPosition函数，该函数应该在ui.js中定义
        switch (e.key) {
            case 'ArrowUp':
                window.updateEquationPosition(globals.selectedEquationIndex, 0, step);
                break;
            case 'ArrowDown':
                window.updateEquationPosition(globals.selectedEquationIndex, 0, -step);
                break;
            case 'ArrowLeft':
                window.updateEquationPosition(globals.selectedEquationIndex, -step, 0);
                break;
            case 'ArrowRight':
                window.updateEquationPosition(globals.selectedEquationIndex, step, 0);
                break;
        }
        
        drawCoordinateSystem();
        window.updateEquationsList();
    }
}

// 处理双击事件
export function handleDoubleClick(e) {
    if (globals.selectedEquationIndex >= 0) {
        globals.selectedEquationIndex = -1;
        window.updateEquationsList();
        drawCoordinateSystem();
        globals.canvas.style.cursor = 'crosshair';
    }
}
