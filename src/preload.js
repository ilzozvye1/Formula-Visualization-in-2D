// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 监听菜单事件
    onMenuExportImage: (callback) => ipcRenderer.on('menu-export-image', callback),
    onMenuResetView: (callback) => ipcRenderer.on('menu-reset-view', callback),
    onMenuToggleGrid: (callback) => ipcRenderer.on('menu-toggle-grid', callback),
    onMenuToggleDarkMode: (callback) => ipcRenderer.on('menu-toggle-dark-mode', callback),
    onMenuZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', callback),
    onMenuZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', callback),
    onMenuShowAll: (callback) => ipcRenderer.on('menu-show-all', callback),
    onMenuHideAll: (callback) => ipcRenderer.on('menu-hide-all', callback),
    onMenuClearAll: (callback) => ipcRenderer.on('menu-clear-all', callback),
    onMenuToggleHelp: (callback) => ipcRenderer.on('menu-toggle-help', callback),
    
    // 移除监听器
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// 检测是否在Electron环境中
window.isElectron = true;
