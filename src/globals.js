// 版本号
export const APP_VERSION = '1.1.0';
export const APP_NAME = '公式可视化';
// 构建日期动态生成（格式：YYYY-MM-DD）
export const APP_BUILD_DATE = '2026-03-09';

// 全局变量
export let canvas, ctx;
export let scale = 20;
export let offsetX = 400;
export let offsetY = 300;
export let isDragging = false;
export let lastX, lastY;
export let equations = [];
export let showGrid = true;
export let darkMode = false;
export let xMin = -10, xMax = 10, yMin = -10, yMax = 10;
export let selectedEquationIndex = -1;
export let isDraggingEquation = false;
export let dragStartX, dragStartY;

// 交点显示配置
export let showIntersections = true;
export let intersectionColor = '#ff00ff';
export let intersectionSize = 6;

// 3D模式相关变量
export let is3DMode = false;
export let rotationX = 0.5; // X轴旋转角度（弧度）
export let rotationY = 0.5; // Y轴旋转角度（弧度）
export let rotationZ = 0;   // Z轴旋转角度（弧度）
export let isRotating = false;
export let lastMouseX, lastMouseY;
export let zScale = 20; // Z轴缩放比例

// 自动旋转相关变量
export let isAutoRotating = false;
export let autoRotateAnimationId = null;
export let autoRotateSpeed = 0.005;

// 深度雾化相关变量
export let fogEnabled = false;
export let fogDensity = 0.02;
export let fogColor = darkMode ? '#1a1a1a' : '#ffffff';

// 历史记录相关变量
export let historyStack = [];
export let historyIndex = -1;
export const MAX_HISTORY_SIZE = 50;