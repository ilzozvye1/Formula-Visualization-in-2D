// 初始化和事件处理
import * as globals from './globals.js';
import { drawCoordinateSystem } from './drawing.js';
import * as ui from './ui.js';
import * as events from './events.js';
import * as storage from './storage.js';

// 初始化
export function init() {
    // 显示版本号
    document.getElementById('app-version').textContent = 'v' + globals.APP_VERSION;
    
    globals.canvas = document.getElementById('coordinate-system');
    globals.ctx = globals.canvas.getContext('2d');
    
    // 将canvas赋值给全局变量，方便其他模块访问
    window.canvas = globals.canvas;
    window.ctx = globals.ctx;
    window.equations = globals.equations;
    window.selectedEquationIndex = globals.selectedEquationIndex;
    window.scale = globals.scale;
    window.offsetX = globals.offsetX;
    window.offsetY = globals.offsetY;
    window.darkMode = globals.darkMode;
    window.showGrid = globals.showGrid;
    
    // 绘制初始坐标系
    drawCoordinateSystem();
    
    // 添加事件监听器
    globals.canvas.addEventListener('wheel', events.handleWheel);
    globals.canvas.addEventListener('mousedown', events.handleMouseDown);
    globals.canvas.addEventListener('mousemove', events.handleMouseMove);
    globals.canvas.addEventListener('mouseup', events.handleMouseUp);
    globals.canvas.addEventListener('mouseleave', events.handleMouseLeave);
    
    // 触摸屏支持
    globals.canvas.addEventListener('touchstart', events.handleTouchStart);
    globals.canvas.addEventListener('touchmove', events.handleTouchMove);
    globals.canvas.addEventListener('touchend', events.handleTouchEnd);
    
    // 键盘Delete键删除选中的方程
    document.addEventListener('keydown', events.handleKeyDown);
    
    // 双击取消选中
    globals.canvas.addEventListener('dblclick', events.handleDoubleClick);
    
    // 加载保存的方程
    storage.loadEquations();
    
    // 初始化预设菜单事件
    ui.initPresetMenu();
    
    // 控制台显示版本信息
    console.log(`${globals.APP_NAME} v${globals.APP_VERSION} (${globals.APP_BUILD_DATE})`);
    console.log('✅ Canvas 已赋值给 window.canvas，版本:', globals.APP_VERSION);
    
    // 初始化 Electron 菜单事件监听
    initElectronMenuListeners();
}

// 初始化所有按钮的事件监听器
function initButtonListeners() {
    console.log('🔧 初始化按钮事件监听器...');
    
    // 添加方程按钮
    const addFormulaBtn = document.getElementById('add-formula-btn');
    console.log('添加方程按钮:', addFormulaBtn);
    if (addFormulaBtn) {
        addFormulaBtn.addEventListener('click', ui.addFormula);
        console.log('✅ 添加方程按钮事件已绑定');
    }
    
    // 全部显示按钮
    const showAllBtn = document.querySelector('.show-all-btn');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', ui.showAllEquations);
        console.log('✅ 全部显示按钮事件已绑定');
    }
    
    // 全部隐藏按钮
    const hideAllBtn = document.querySelector('.hide-all-btn');
    if (hideAllBtn) {
        hideAllBtn.addEventListener('click', ui.hideAllEquations);
        console.log('✅ 全部隐藏按钮事件已绑定');
    }
    
    // 清空所有按钮
    const clearAllBtn = document.querySelector('.clear-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', ui.clearAllEquations);
        console.log('✅ 清空所有按钮事件已绑定');
    }
    
    // 导出 PNG 按钮
    const exportPngBtn = document.querySelector('.png-btn');
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', ui.exportImage);
        console.log('✅ 导出 PNG 按钮事件已绑定');
    }
    
    // 导出 PDF 按钮
    const exportPdfBtn = document.querySelector('.pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', ui.exportPDF);
        console.log('✅ 导出 PDF 按钮事件已绑定');
    }
    
    // 重置视图按钮
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', ui.resetView);
        console.log('✅ 重置视图按钮事件已绑定');
    }
    
    // 帮助按钮
    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', ui.toggleHelp);
        console.log('✅ 帮助按钮事件已绑定');
    }
    
    console.log('🎉 所有按钮事件监听器初始化完成');
}

// 初始化 Electron 菜单事件监听
export function initElectronMenuListeners() {
    if (typeof window.electronAPI !== 'undefined') {
        // 导出图像
        window.electronAPI.onMenuExportImage(() => {
            ui.exportImage();
        });
        
        // 重置视图
        window.electronAPI.onMenuResetView(() => {
            ui.resetView();
        });
        
        // 切换网格
        window.electronAPI.onMenuToggleGrid(() => {
            document.getElementById('show-grid').checked = !globals.showGrid;
            ui.toggleGrid();
        });
        
        // 切换深色模式
        window.electronAPI.onMenuToggleDarkMode(() => {
            document.getElementById('dark-mode').checked = !globals.darkMode;
            ui.toggleDarkMode();
        });
        
        // 放大
        window.electronAPI.onMenuZoomIn(() => {
            globals.scale *= 1.2;
            globals.scale = Math.min(100, globals.scale);
            drawCoordinateSystem();
        });
        
        // 缩小
        window.electronAPI.onMenuZoomOut(() => {
            globals.scale *= 0.8;
            globals.scale = Math.max(5, globals.scale);
            drawCoordinateSystem();
        });
        
        // 全部显示
        window.electronAPI.onMenuShowAll(() => {
            ui.showAllEquations();
        });
        
        // 全部隐藏
        window.electronAPI.onMenuHideAll(() => {
            ui.hideAllEquations();
        });
        
        // 清空所有
        window.electronAPI.onMenuClearAll(() => {
            ui.clearAllEquations();
        });
        
        // 切换帮助
        window.electronAPI.onMenuToggleHelp(() => {
            ui.toggleHelp();
        });
    }
}