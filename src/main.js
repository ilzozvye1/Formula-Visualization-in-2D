const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');

// 版本信息
const APP_VERSION = '1.1.0';
const APP_NAME = '公式可视化';

let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: `${APP_NAME} v${APP_VERSION}`,
        icon: path.join(__dirname, 'assets/icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false, // 先不显示，等加载完成后再显示
        backgroundColor: '#f0f0f0'
    });

    // 加载应用
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 加载完成后显示窗口
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // 开发环境打开开发者工具
        if (process.argv.includes('--dev')) {
            mainWindow.webContents.openDevTools();
        }
    });

    // 窗口关闭时
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 创建菜单
    createMenu();
}

// 创建应用菜单
function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '导出图像',
                    accelerator: 'Ctrl+E',
                    click: () => {
                        mainWindow.webContents.send('menu-export-image');
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '重置视图',
                    accelerator: 'Ctrl+R',
                    click: () => {
                        mainWindow.webContents.send('menu-reset-view');
                    }
                },
                {
                    label: '显示/隐藏网格',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-grid');
                    }
                },
                {
                    label: '深色模式',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-dark-mode');
                    }
                },
                { type: 'separator' },
                {
                    label: '放大',
                    accelerator: 'Ctrl++',
                    click: () => {
                        mainWindow.webContents.send('menu-zoom-in');
                    }
                },
                {
                    label: '缩小',
                    accelerator: 'Ctrl+-',
                    click: () => {
                        mainWindow.webContents.send('menu-zoom-out');
                    }
                }
            ]
        },
        {
            label: '方程',
            submenu: [
                {
                    label: '全部显示',
                    click: () => {
                        mainWindow.webContents.send('menu-show-all');
                    }
                },
                {
                    label: '全部隐藏',
                    click: () => {
                        mainWindow.webContents.send('menu-hide-all');
                    }
                },
                { type: 'separator' },
                {
                    label: '清空所有',
                    click: () => {
                        mainWindow.webContents.send('menu-clear-all');
                    }
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '使用帮助',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-help');
                    }
                },
                { type: 'separator' },
                {
                    label: '关于',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于',
                            message: APP_NAME,
                            detail: `版本: v${APP_VERSION}\n\n一个功能强大的2D公式可视化工具，支持多种类型的方程绘制。\n\n支持方程类型:\n• 一次方程、二次方程\n• 幂函数、指数函数、对数函数\n• 三角函数、反三角函数、双曲函数\n• 绝对值函数、取整函数\n• 特殊函数、微分、积分`,
                            buttons: ['确定'],
                            icon: path.join(__dirname, 'assets/icon.ico')
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 应用准备就绪
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// macOS: 点击dock图标时重新创建窗口
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
