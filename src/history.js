// 历史记录相关函数
import * as globals from './globals.js';

// 保存当前状态到历史记录
export function saveHistory() {
    // 删除当前位置之后的历史记录
    globals.historyStack = globals.historyStack.slice(0, globals.historyIndex + 1);
    
    // 保存当前状态
    const state = {
        equations: JSON.parse(JSON.stringify(globals.equations)),
        scale: globals.scale,
        offsetX: globals.offsetX,
        offsetY: globals.offsetY,
        rotationX: globals.rotationX,
        rotationY: globals.rotationY,
        rotationZ: globals.rotationZ
    };
    
    globals.historyStack.push(state);
    
    // 限制历史记录大小
    if (globals.historyStack.length > globals.MAX_HISTORY_SIZE) {
        globals.historyStack.shift();
    } else {
        globals.historyIndex++;
    }
}

// 撤销
export function undo() {
    if (globals.historyIndex > 0) {
        globals.historyIndex--;
        restoreState(globals.historyStack[globals.historyIndex]);
    }
}

// 重做
export function redo() {
    if (globals.historyIndex < globals.historyStack.length - 1) {
        globals.historyIndex++;
        restoreState(globals.historyStack[globals.historyIndex]);
    }
}

// 恢复状态
export function restoreState(state) {
    globals.equations = JSON.parse(JSON.stringify(state.equations));
    globals.scale = state.scale;
    globals.offsetX = state.offsetX;
    globals.offsetY = state.offsetY;
    globals.rotationX = state.rotationX;
    globals.rotationY = state.rotationY;
    globals.rotationZ = state.rotationZ;
    
    saveEquations();
    updateEquationsList();
    drawCoordinateSystem();
}