// 主入口文件，整合所有模块
import * as globals from './globals.js';
import { init } from './initialization.js';
import * as ui from './ui.js';
import * as events from './events.js';
import * as drawing from './drawing.js';
import * as equations from './equations.js';
import * as history from './history.js';
import * as storage from './storage.js';

// 将所有模块的函数绑定到window对象上，以便HTML中的onclick事件可以调用
window.app = {
    // 全局变量
    globals: globals,
    
    // 初始化
    init: init,
    
    // UI交互函数
    addFormula: ui.addFormula,
    selectPresetFormula: ui.selectPresetFormula,
    togglePresetMenu: ui.togglePresetMenu,
    selectEquation: ui.selectEquation,
    removeEquation: ui.removeEquation,
    toggleEquationVisibility: ui.toggleEquationVisibility,
    showAllEquations: ui.showAllEquations,
    hideAllEquations: ui.hideAllEquations,
    clearAllEquations: ui.clearAllEquations,
    toggleSettingsMenu: ui.toggleSettingsMenu,
    toggleGrid: ui.toggleGrid,
    toggleDarkMode: ui.toggleDarkMode,
    toggleIntersections: ui.toggleIntersections,
    updateIntersectionColor: ui.updateIntersectionColor,
    updateAxisRange: ui.updateAxisRange,
    switchTo3D: ui.switchTo3D,
    switchTo2D: ui.switchTo2D,
    toggleHelp: ui.toggleHelp,
    resetView: ui.resetView,
    resetViewFront: ui.resetViewFront,
    resetViewTop: ui.resetViewTop,
    resetViewSide: ui.resetViewSide,
    toggleAutoRotate: ui.toggleAutoRotate,
    stopAutoRotate: ui.stopAutoRotate,
    import3DData: ui.import3DData,
    export3DData: ui.export3DData,
    exportImage: ui.exportImage,
    updateEquationPosition: ui.updateEquationPosition,
    
    // 事件处理函数
    handleWheel: events.handleWheel,
    handleMouseDown: events.handleMouseDown,
    handleMouseMove: events.handleMouseMove,
    handleMouseUp: events.handleMouseUp,
    handleMouseLeave: events.handleMouseLeave,
    handleTouchStart: events.handleTouchStart,
    handleTouchMove: events.handleTouchMove,
    handleTouchEnd: events.handleTouchEnd,
    handleKeyDown: events.handleKeyDown,
    handleDoubleClick: events.handleDoubleClick,
    
    // 绘制函数
    drawCoordinateSystem: drawing.drawCoordinateSystem,
    draw2DCoordinateSystem: drawing.draw2DCoordinateSystem,
    draw3DCoordinateSystem: drawing.draw3DCoordinateSystem,
    drawAllEquations: equations.drawAllEquations,
    drawAllEquations3D: equations.drawAllEquations3D,
    
    // 历史记录函数
    undo: history.undo,
    redo: history.redo,
    saveHistory: history.saveHistory,
    
    // 存储函数
    saveEquations: storage.saveEquations,
    loadEquations: storage.loadEquations,
    
    // 更新方程列表
    updateEquationsList: ui.updateEquationsList
};

// 将常用函数直接绑定到window对象上，以便HTML中的onclick事件可以直接调用
// 这是为了保持与原script.js的兼容性
window.addFormula = ui.addFormula;
window.selectPresetFormula = ui.selectPresetFormula;
window.togglePresetMenu = ui.togglePresetMenu;
window.selectEquation = ui.selectEquation;
window.removeEquation = ui.removeEquation;
window.toggleEquationVisibility = ui.toggleEquationVisibility;
window.showAllEquations = ui.showAllEquations;
window.hideAllEquations = ui.hideAllEquations;
window.clearAllEquations = ui.clearAllEquations;
window.toggleSettingsMenu = ui.toggleSettingsMenu;
window.toggleGrid = ui.toggleGrid;
window.toggleDarkMode = ui.toggleDarkMode;
window.toggleIntersections = ui.toggleIntersections;
window.updateIntersectionColor = ui.updateIntersectionColor;
window.updateAxisRange = ui.updateAxisRange;
window.switchTo3D = ui.switchTo3D;
window.switchTo2D = ui.switchTo2D;
window.toggleHelp = ui.toggleHelp;
window.resetView = ui.resetView;
window.resetViewFront = ui.resetViewFront;
window.resetViewTop = ui.resetViewTop;
window.resetViewSide = ui.resetViewSide;
window.toggleAutoRotate = ui.toggleAutoRotate;
window.exportImage = ui.exportImage;
window.exportPDF = ui.exportPDF;
window.undo = history.undo;
window.redo = history.redo;
window.updateEquationPosition = ui.updateEquationPosition;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
