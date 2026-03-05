/**
 * 公式可视化 - 主应用入口
 * @module app
 */

import appState from './modules/stateManager.js';
import { Renderer2D } from './modules/renderer2D.js';
import { Renderer3D } from './modules/renderer3D.js';
import { InteractionHandler } from './modules/interactionHandler.js';
import { parseFormula, formatEquation } from './modules/equationParser.js';
import { saveToStorage, loadFromStorage, exportToJSON, importFromJSON } from './utils/storageUtils.js';
import { APP_VERSION, APP_NAME, PRESET_COLORS } from './config/constants.js';

/**
 * 公式可视化应用类
 */
class FormulaVisualizationApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.renderer2D = null;
        this.renderer3D = null;
        this.interactionHandler = null;
        this.autoRotateId = null;
    }

    /**
     * 初始化应用
     */
    init() {
        // 获取画布
        this.canvas = document.getElementById('graph-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        appState.initCanvas(this.canvas);

        // 初始化渲染器
        this.renderer2D = new Renderer2D(this.ctx, appState);
        this.renderer3D = new Renderer3D(this.ctx, appState);

        // 初始化交互处理器
        this.interactionHandler = new InteractionHandler(
            this.canvas,
            appState,
            this.renderer2D,
            this.renderer3D
        );

        // 加载保存的数据
        this.loadData();

        // 初始化UI
        this.initUI();

        // 开始渲染循环
        this.render();

        // 设置版本号
        this.updateVersionDisplay();

        console.log(`${APP_NAME} v${APP_VERSION} initialized`);
    }

    /**
     * 初始化UI
     */
    initUI() {
        // 绑定按钮事件
        this.bindButtonEvents();

        // 绑定模式切换
        this.bindModeSwitch();

        // 绑定设置菜单
        this.bindSettingsMenu();

        // 绑定预设菜单
        this.bindPresetMenu();

        // 订阅状态变化
        this.subscribeStateChanges();
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        // 添加方程按钮
        const addBtn = document.getElementById('add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addEquation());
        }

        // 清空所有按钮
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllEquations());
        }

        // 导出图像按钮
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportImage());
        }

        // 重置视图按钮
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
        }
    }

    /**
     * 绑定模式切换
     */
    bindModeSwitch() {
        const btn2D = document.getElementById('btn-2d');
        const btn3D = document.getElementById('btn-3d');

        if (btn2D) {
            btn2D.addEventListener('click', () => this.switchTo2D());
        }

        if (btn3D) {
            btn3D.addEventListener('click', () => this.switchTo3D());
        }
    }

    /**
     * 绑定设置菜单
     */
    bindSettingsMenu() {
        const settingsBtn = document.querySelector('.settings-btn');
        const settingsMenu = document.getElementById('settings-menu');

        if (settingsBtn && settingsMenu) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('hidden');
            });

            // 点击其他地方关闭菜单
            document.addEventListener('click', (e) => {
                if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                    settingsMenu.classList.add('hidden');
                }
            });
        }
    }

    /**
     * 绑定预设菜单
     */
    bindPresetMenu() {
        const presetBtn = document.querySelector('.preset-dropdown-btn');
        const presetMenu = document.getElementById('preset-menu');

        if (presetBtn && presetMenu) {
            presetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                presetMenu.classList.toggle('hidden');
            });

            // 点击其他地方关闭菜单
            document.addEventListener('click', (e) => {
                if (!presetMenu.contains(e.target) && !presetBtn.contains(e.target)) {
                    presetMenu.classList.add('hidden');
                }
            });
        }
    }

    /**
     * 订阅状态变化
     */
    subscribeStateChanges() {
        // 方程列表变化时更新UI
        appState.subscribe('equations', () => {
            this.updateEquationsList();
            this.saveData();
        });

        // 选中方程变化时更新UI
        appState.subscribe('selectedEquation', () => {
            this.updateEquationsList();
        });

        // 深色模式变化时更新UI
        appState.subscribe('darkMode', (darkMode) => {
            document.body.classList.toggle('dark-mode', darkMode);
            this.render();
        });
    }

    /**
     * 切换到2D模式
     */
    switchTo2D() {
        appState.set3DMode(false);

        // 更新按钮状态
        const btn2D = document.getElementById('btn-2d');
        const btn3D = document.getElementById('btn-3d');
        if (btn2D) btn2D.classList.add('active');
        if (btn3D) btn3D.classList.remove('active');

        // 隐藏3D控制按钮
        const viewControls = document.getElementById('view-controls-canvas');
        if (viewControls) viewControls.style.display = 'none';

        // 停止自动旋转
        this.stopAutoRotate();

        // 更新图例位置
        const legendDisplay = document.getElementById('legend-display');
        if (legendDisplay) legendDisplay.style.top = '10px';

        this.render();
    }

    /**
     * 切换到3D模式
     */
    switchTo3D() {
        appState.set3DMode(true);

        // 更新按钮状态
        const btn2D = document.getElementById('btn-2d');
        const btn3D = document.getElementById('btn-3d');
        if (btn2D) btn2D.classList.remove('active');
        if (btn3D) btn3D.classList.add('active');

        // 显示3D控制按钮
        const viewControls = document.getElementById('view-controls-canvas');
        if (viewControls) viewControls.style.display = 'flex';

        // 更新图例位置
        const legendDisplay = document.getElementById('legend-display');
        if (legendDisplay) legendDisplay.style.top = '45px';

        this.render();
    }

    /**
     * 添加方程
     */
    addEquation() {
        const formulaInput = document.getElementById('formula');
        if (!formulaInput) return;

        const formula = formulaInput.value.trim();
        if (!formula) return;

        const parsed = parseFormula(formula);
        if (!parsed) {
            alert('无法解析公式，请检查输入');
            return;
        }

        const equation = {
            formula,
            parsed,
            color: appState.getNewEquationColor(),
            style: 'solid',
            visible: true
        };

        appState.addEquation(equation);
        formulaInput.value = '';
        this.render();
    }

    /**
     * 移除方程
     * @param {number} index - 方程索引
     */
    removeEquation(index) {
        appState.removeEquation(index);
        this.render();
    }

    /**
     * 清空所有方程
     */
    clearAllEquations() {
        if (confirm('确定要清空所有方程吗？')) {
            appState.clearAllEquations();
            this.render();
        }
    }

    /**
     * 切换方程可见性
     * @param {number} index - 方程索引
     */
    toggleEquationVisibility(index) {
        const equation = appState.equations[index];
        if (equation) {
            equation.visible = !equation.visible;
            appState.updateEquation(index, { visible: equation.visible });
            this.render();
        }
    }

    /**
     * 选择方程
     * @param {number} index - 方程索引
     */
    selectEquation(index) {
        appState.setSelectedEquation(index);
        this.render();
    }

    /**
     * 更新方程列表UI
     */
    updateEquationsList() {
        const listContainer = document.getElementById('equations-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        appState.equations.forEach((equation, index) => {
            const item = document.createElement('div');
            item.className = `equation-item ${index === appState.selectedEquationIndex ? 'selected' : ''}`;

            const displayText = formatEquation(equation.parsed);

            item.innerHTML = `
                <input type="checkbox" ${equation.visible ? 'checked' : ''} 
                       onchange="app.toggleEquationVisibility(${index})">
                <span class="equation-color" style="background-color: ${equation.color}"></span>
                <span class="equation-text">${displayText}</span>
                <button onclick="app.selectEquation(${index})">选择</button>
                <button onclick="app.removeEquation(${index})">删除</button>
            `;

            listContainer.appendChild(item);
        });

        // 更新图例
        this.updateLegend();
    }

    /**
     * 更新图例
     */
    updateLegend() {
        const legendDisplay = document.getElementById('legend-display');
        if (!legendDisplay) return;

        const visibleEquations = appState.equations.filter(eq => eq.visible);

        if (visibleEquations.length === 0) {
            legendDisplay.style.display = 'none';
            return;
        }

        let html = '';
        visibleEquations.forEach(equation => {
            const displayText = formatEquation(equation.parsed);
            const truncatedText = displayText.length > 25 
                ? displayText.substring(0, 22) + '...' 
                : displayText;

            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${equation.color}"></div>
                    <div class="legend-text">${truncatedText}</div>
                </div>
            `;
        });

        legendDisplay.innerHTML = html;
        legendDisplay.style.display = 'block';
    }

    /**
     * 重置视图
     */
    resetView() {
        appState.resetView();
        this.render();
    }

    /**
     * 导出图像
     */
    exportImage() {
        const link = document.createElement('a');
        link.download = `formula_visualization_${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    /**
     * 切换自动旋转
     */
    toggleAutoRotate() {
        if (appState.isAutoRotating) {
            this.stopAutoRotate();
        } else {
            this.startAutoRotate();
        }
    }

    /**
     * 开始自动旋转
     */
    startAutoRotate() {
        appState.setAutoRotating(true);

        const animate = () => {
            if (!appState.isAutoRotating || !appState.is3DMode) {
                this.stopAutoRotate();
                return;
            }

            appState.rotationY += 0.005;
            this.render();
            this.autoRotateId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 停止自动旋转
     */
    stopAutoRotate() {
        appState.setAutoRotating(false);
        if (this.autoRotateId) {
            cancelAnimationFrame(this.autoRotateId);
            this.autoRotateId = null;
        }
    }

    /**
     * 渲染场景
     */
    render() {
        if (appState.is3DMode) {
            this.renderer3D.render3DScene();
        } else {
            this.renderer2D.renderCoordinateSystem();
        }
    }

    /**
     * 保存数据
     */
    saveData() {
        const data = appState.exportState();
        saveToStorage(data);
    }

    /**
     * 加载数据
     */
    loadData() {
        const data = loadFromStorage();
        if (data) {
            appState.importState(data);
        }
    }

    /**
     * 更新版本显示
     */
    updateVersionDisplay() {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = `v${APP_VERSION}`;
        }
    }
}

// 创建全局应用实例
const app = new FormulaVisualizationApp();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出全局引用（供HTML中的onclick使用）
window.app = app;

export default app;
