// Electron主进程入口文件
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icon.ico')
    });

    // 加载应用的HTML文件
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // 打开开发者工具
    // mainWindow.webContents.openDevTools();

    // 窗口关闭时触发
    mainWindow.on('closed', function () {
        // 取消引用窗口对象，如果你的应用支持多窗口的话，
        // 通常会把多个窗口对象存放在一个数组里，
        // 与此同时，你应该删除相应的元素。
        mainWindow = null;
    });
}

// 当Electron完成初始化并且准备创建浏览器窗口时调用此方法
app.on('ready', createWindow);

// 当所有窗口都被关闭后退出应用
app.on('window-all-closed', function () {
    // 在macOS上，除非用户用Cmd+Q确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活状态。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常在应用中重新创建一个窗口。
    if (mainWindow === null) {
        createWindow();
    }
});

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用require导入。
