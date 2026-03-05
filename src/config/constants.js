/**
 * 公式可视化 - 常量配置
 * @module config/constants
 */

// 版本信息
export const APP_VERSION = '1.1.0';
export const APP_NAME = '公式可视化';

// 画布默认配置
export const DEFAULT_SCALE = 20;
export const DEFAULT_OFFSET_X = 400;
export const DEFAULT_OFFSET_Y = 300;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// 缩放限制
export const MIN_SCALE = 5;
export const MAX_SCALE_2D = 100;
export const MAX_SCALE_3D = 200;

// 3D默认配置
export const DEFAULT_ROTATION_X = 0.5;
export const DEFAULT_ROTATION_Y = 0.5;
export const DEFAULT_ROTATION_Z = 0;
export const Z_SCALE = 20;

// 历史记录配置
export const MAX_HISTORY_SIZE = 50;

// 雾化配置
export const DEFAULT_FOG_DENSITY = 0.02;

// 自动旋转配置
export const DEFAULT_AUTO_ROTATE_SPEED = 0.005;

// 采样步长
export const SAMPLE_STEP_2D = 0.5;
export const SAMPLE_STEP_3D_CURVE = 0.02;
export const SAMPLE_STEP_3D_SURFACE_U = 0.4;
export const SAMPLE_STEP_3D_SURFACE_V = 0.4;

// 坐标轴范围
export const DEFAULT_AXIS_RANGE = {
    x: { min: -10, max: 10 },
    y: { min: -10, max: 10 }
};

// 颜色配置
export const COLORS = {
    axisX: '#ff0000',
    axisY: '#00aa00',
    axisZ: '#0000ff',
    grid: '#e0e0e0',
    gridDark: '#444444',
    background: '#ffffff',
    backgroundDark: '#1a1a1a',
    text: '#333333',
    textDark: '#e0e0e0'
};

// 预设公式类别
export const PRESET_CATEGORIES = {
    linear: '一次方程',
    quadratic: '二次方程',
    power: '幂函数',
    exponential: '指数函数',
    logarithmic: '对数函数',
    trigonometric: '三角函数',
    inverseTrigonometric: '反三角函数',
    hyperbolic: '双曲函数',
    absolute: '绝对值函数',
    rounding: '取整函数',
    special: '特殊函数',
    derivative: '微分',
    integral: '积分',
    '3dCurves': '3D空间曲线',
    '3dSurfaces': '3D曲面'
};

// 线条样式
export const LINE_STYLES = {
    solid: { dash: [], label: '实线' },
    dashed: { dash: [10, 5], label: '虚线' },
    dotted: { dash: [3, 3], label: '点线' }
};

// 预设颜色列表
export const PRESET_COLORS = [
    '#ff0000', '#00aa00', '#0000ff', '#ff8800', '#8800ff',
    '#00aaaa', '#ff0088', '#88ff00', '#0088ff', '#ff4444'
];
