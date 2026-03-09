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
import { presetManager } from './modules/PresetManager.js';
import { debounce, throttle, rafThrottle, GridOffscreenRenderer, performanceMonitor } from './utils/performance.js';
import { animationManager, Animation } from './modules/animationManager.js';

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
        this.presetManager = presetManager;
        
        // 性能优化组件
        this.gridRenderer = null; // 离屏网格渲染器
        this.renderScheduled = false; // 渲染节流标志
        this.lastRenderTime = 0; // 上次渲染时间
        
        // 动画组件
        this.animationManager = animationManager;
        this.currentAnimationId = null;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 获取画布
            this.canvas = document.getElementById('coordinate-system');
            if (!this.canvas) {
                console.error('Canvas element not found');
                throw new Error('画布元素未找到');
            }

            this.ctx = this.canvas.getContext('2d');
            appState.initCanvas(this.canvas);

            // 初始化离屏网格渲染器
            this.gridRenderer = new GridOffscreenRenderer(this.canvas.width, this.canvas.height);

            // 初始化渲染器
            this.renderer2D = new Renderer2D(this.ctx, appState);
            this.renderer3D = new Renderer3D(this.ctx, appState);

            // 初始化交互处理器（使用防抖和节流）
            this.interactionHandler = new InteractionHandler(
                this.canvas,
                appState,
                this.renderer2D,
                this.renderer3D
            );
            
            // 包装交互处理器的方法以应用节流
            this.interactionHandler.handleWheel = throttle(
                this.interactionHandler.handleWheel.bind(this.interactionHandler),
                50
            );
            this.interactionHandler.handleMouseDown = throttle(
                this.interactionHandler.handleMouseDown.bind(this.interactionHandler),
                100
            );

            // 初始化预设管理器
            await this.presetManager.initialize();

            // 初始化动画管理器
            this.animationManager.init(this);

            // 加载保存的数据
            this.loadData();

            // 初始化 UI
            this.initUI();

            // 开始渲染循环
            this.render();

            // 设置版本号
            this.updateVersionDisplay();

            console.log(`${APP_NAME} v${APP_VERSION} initialized`);
        } catch (error) {
            console.error('应用初始化失败:', error);
            alert('应用初始化失败：' + error.message);
        }
    }

    /**
     * 初始化 UI
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
        
        // 窗口大小调整（使用防抖）
        const handleResize = debounce(() => {
            if (this.canvas && this.gridRenderer) {
                this.gridRenderer.resize(this.canvas.width, this.canvas.height);
                this.render();
            }
        }, 250);
        
        window.addEventListener('resize', handleResize);
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        console.log('🔧 初始化按钮事件监听器...');
        
        // 添加方程按钮
        const addBtn = document.getElementById('add-formula-btn');
        console.log('添加方程按钮:', addBtn);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addEquation());
            console.log('✅ 添加方程按钮事件已绑定');
        }
        
        // 全部显示按钮
        const showAllBtn = document.querySelector('.show-all-btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => this.showAllEquations());
            console.log('✅ 全部显示按钮事件已绑定');
        }
        
        // 全部隐藏按钮
        const hideAllBtn = document.querySelector('.hide-all-btn');
        if (hideAllBtn) {
            hideAllBtn.addEventListener('click', () => this.hideAllEquations());
            console.log('✅ 全部隐藏按钮事件已绑定');
        }
        
        // 清空所有按钮
        const clearBtn = document.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllEquations());
            console.log('✅ 清空所有按钮事件已绑定');
        }
        
        // 导出 PNG 按钮
        const exportPngBtn = document.querySelector('.png-btn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => this.exportImage());
            console.log('✅ 导出 PNG 按钮事件已绑定');
        }
        
        // 导出 PDF 按钮
        const exportPdfBtn = document.querySelector('.pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportPDF());
            console.log('✅ 导出 PDF 按钮事件已绑定');
        }
        
        // 重置视图按钮
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
            console.log('✅ 重置视图按钮事件已绑定');
        }
        
        // 帮助按钮
        const helpBtn = document.querySelector('.help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.toggleHelp());
            console.log('✅ 帮助按钮事件已绑定');
        }
        
        console.log('🎉 所有按钮事件监听器初始化完成');
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
            // 使用 once 选项确保只绑定一次
            const toggleMenu = (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('hidden');
            };
            
            settingsBtn.addEventListener('click', toggleMenu);

            // 点击其他地方关闭菜单 - 使用事件委托
            document.addEventListener('click', function closeMenu(e) {
                if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                    settingsMenu.classList.add('hidden');
                    // 移除自身，避免重复触发
                    document.removeEventListener('click', closeMenu);
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
            // 动态生成预设菜单内容
            this.generatePresetMenu(presetMenu);

            presetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                presetMenu.classList.toggle('hidden');
            });

            // 绑定分类标题点击事件（二级菜单展开/折叠）
            const categoryHeaders = presetMenu.querySelectorAll('.preset-category-header');
            categoryHeaders.forEach(header => {
                header.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const category = header.closest('.preset-category');
                    const submenu = category.querySelector('.preset-submenu');
                    const arrow = header.querySelector('.preset-arrow');
                    
                    if (submenu) {
                        submenu.classList.toggle('hidden');
                        if (arrow) {
                            arrow.textContent = submenu.classList.contains('hidden') ? '▶' : '▼';
                        }
                    }
                });
            });

            // 绑定预设项点击事件
            const presetItems = presetMenu.querySelectorAll('.preset-item');
            presetItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const presetId = item.getAttribute('data-preset-id');
                    if (presetId) {
                        this.fillFormulaInput(presetId);
                        // 关闭菜单
                        presetMenu.classList.add('hidden');
                    }
                });
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
     * 生成预设菜单
     * @param {HTMLElement} menuContainer - 菜单容器
     */
    generatePresetMenu(menuContainer) {
        const categories = this.presetManager.getCategoriesForUI();
        
        let html = '';
        categories.forEach(cat => {
            html += `
                <div class="preset-category" data-category="${cat.id}">
                    <div class="preset-category-header">
                        <span>${cat.icon} ${cat.name}</span>
                        <span class="preset-arrow">▶</span>
                    </div>
                    <div class="preset-submenu hidden">
                        ${cat.presets.map(p => `
                            <div class="preset-item" data-preset-id="${p.id}" title="${p.description}">
                                <span class="preset-color" style="background-color: ${p.style.color}"></span>
                                <span class="preset-name">${p.name}</span>
                                ${p.difficulty !== 'basic' ? `<span class="preset-badge preset-badge-${p.difficulty}">${p.difficulty === 'intermediate' ? '中' : '高'}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        menuContainer.innerHTML = html;
    }

    /**
     * 将预设公式填入输入框
     * @param {string} presetId - 预设ID
     */
    fillFormulaInput(presetId) {
        const presetInfo = this.presetManager.getPresetInfo(presetId);
        if (!presetInfo) {
            console.error('预设未找到:', presetId);
            return;
        }
        
        const formulaInput = document.getElementById('formula');
        if (formulaInput) {
            // 使用默认参数生成实际公式
            let formula = presetInfo.formula;
            const params = presetInfo.params || {};
            
            // 替换参数占位符
            for (const [key, value] of Object.entries(params)) {
                const placeholder = new RegExp(`\\{${key}\\}`, 'g');
                formula = formula.replace(placeholder, value);
            }
            
            // 简化公式
            formula = this.simplifyFormulaDisplay(formula);
            
            // 将公式填入输入框
            formulaInput.value = formula;
            // 聚焦输入框，方便用户修改
            formulaInput.focus();
            console.log(`已填入预设公式: ${formula}`);
        }
    }
    
    /**
     * 简化公式显示
     * @param {string} formula - 原始公式
     * @returns {string} 简化后的公式
     */
    simplifyFormulaDisplay(formula) {
        // 多轮简化
        let prev = '';
        while (prev !== formula) {
            prev = formula;
            
            // 简化 1*函数 为 函数
            formula = formula.replace(/(^|[\+\-\*\(])1(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|log10|exp|sqrt|abs|floor|ceil|round|arcsin|arccos|arctan)/g, '$1$2');
            
            // 简化 1x 为 x
            formula = formula.replace(/(^|[\+\-\(])1x/g, '$1x');
            
            // 简化 1* 为空
            formula = formula.replace(/(^|[\+\-\(])1\*/g, '$1');
            
            // 简化 *1 为空（后面不是字母）
            formula = formula.replace(/\*1(?![a-z])/g, '');
            
            // 简化 +0 或 -0（后面不是小数点，也不是 x）
            formula = formula.replace(/[\+\-]0(?![\.\dx])/g, '');
            
            // 简化 函数(1x) -> 函数
            formula = formula.replace(/(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|log10|exp|sqrt|abs|floor|ceil|round|arcsin|arccos|arctan)\(1x/g, '$1(x');
            
            // 简化 函数(x+0) -> 函数
            formula = formula.replace(/(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|log10|exp|sqrt|abs|floor|ceil|round|arcsin|arccos|arctan)\(x\+0\)/g, '$1(x)');
            
            // 处理连续的运算符
            formula = formula.replace(/\+\+/g, '+');
            formula = formula.replace(/\-\-/g, '+');
            formula = formula.replace(/\+\-/g, '-');
            formula = formula.replace(/\-\+/g, '-');
        }
        
        // 移除开头多余的 + 号
        if (formula.startsWith('+')) {
            formula = formula.substring(1);
        }
        
        // 如果公式为空，返回 0
        if (formula === '' || formula === '+' || formula === '-') {
            formula = '0';
        }
        
        return formula;
    }

    /**
     * 添加预设方程
     * @param {string} presetId - 预设ID
     * @param {Object} customParams - 自定义参数
     */
    addPresetEquation(presetId, customParams = {}) {
        try {
            const equation = this.presetManager.addPresetToApp(presetId, appState, customParams);
            this.render();
            
            console.log(`已添加预设方程: ${equation.name || equation.formula}`);
        } catch (error) {
            console.error('添加预设失败:', error);
            alert('添加预设失败: ' + error.message);
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
        try {
            const formulaInput = document.getElementById('formula');
            if (!formulaInput) {
                throw new Error('公式输入框未找到');
            }

            const expression = formulaInput.value.trim();
            console.log('addEquation called with expression:', expression);
            
            if (!expression) {
                alert('请输入公式');
                return;
            }

            // 添加 "y = " 前缀
            const formula = 'y = ' + expression;

            const parsed = parseFormula(formula);
            console.log('parseFormula result:', parsed);
            
            if (!parsed) {
                alert('无法解析公式，请检查输入。提示：确保使用正确的数学符号和格式');
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
            
            console.log('方程添加成功:', formula);
        } catch (error) {
            console.error('添加方程失败:', error);
            alert('添加方程失败：' + error.message);
        }
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
        appState.clearAllEquations();
        this.render();
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
        const listContainer = document.getElementById('equations-container');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        appState.equations.forEach((equation, index) => {
            const item = document.createElement('div');
            item.className = `equation-item ${index === appState.selectedEquationIndex ? 'selected' : ''}`;
            item.dataset.index = index;

            const displayText = formatEquation(equation.parsed);
            const paramsHtml = this.generateParamsHtml(equation.parsed, index);

            item.innerHTML = `
                <div class="equation-header">
                    <span class="equation-color" style="background-color: ${equation.color}"></span>
                    <span class="equation-text">${displayText}</span>
                    <button class="remove-btn" onclick="event.stopPropagation(); app.removeEquation(${index})">×</button>
                </div>
                <div class="equation-params" id="eq-params-${index}">
                    ${paramsHtml}
                </div>
            `;

            listContainer.appendChild(item);
        });

        // 更新图例
        this.updateLegend();
    }

    /**
     * 生成方程参数HTML
     * @param {Object} parsed - 解析后的方程
     * @param {number} index - 方程索引
     * @returns {string} HTML字符串
     */
    generateParamsHtml(parsed, index) {
        const { type } = parsed;
        console.log('generateParamsHtml called with type:', type, 'parsed:', parsed);
        let html = '';

        switch (type) {
            case 'linear':
                html = `
                    <div class="param-row">
                        <label>斜率 (k):</label>
                        <input type="text" step="0.1" value="${parsed.slope}" 
                               autocomplete="off"
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'slope', this.value)">
                    </div>
                    <div class="param-row">
                        <label>截距 (b):</label>
                        <input type="text" step="0.1" value="${parsed.intercept}" 
                               autocomplete="off"
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'intercept', this.value)">
                    </div>
                `;
                break;
            case 'quadratic':
                html = `
                    <div class="param-row">
                        <label>a:</label>
                        <input type="number" step="0.1" value="${parsed.a}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'a', this.value)">
                    </div>
                    <div class="param-row">
                        <label>b:</label>
                        <input type="number" step="0.1" value="${parsed.b}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'b', this.value)">
                    </div>
                    <div class="param-row">
                        <label>c:</label>
                        <input type="number" step="0.1" value="${parsed.c}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'c', this.value)">
                    </div>
                `;
                break;
            case 'trigonometric':
                html = `
                    <div class="param-row">
                        <label>振幅 (A):</label>
                        <input type="number" step="0.1" value="${parsed.amplitude}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'amplitude', this.value)">
                    </div>
                    <div class="param-row">
                        <label>频率 (f):</label>
                        <input type="number" step="0.1" value="${parsed.frequency}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'frequency', this.value)">
                    </div>
                    <div class="param-row">
                        <label>相位 (φ):</label>
                        <input type="number" step="0.1" value="${parsed.phase || 0}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'phase', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'inverseTrigonometric':
                html = `
                    <div class="param-row">
                        <label>振幅 (A):</label>
                        <input type="number" step="0.1" value="${parsed.amplitude || 1}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'amplitude', this.value)">
                    </div>
                    <div class="param-row">
                        <label>频率 (f):</label>
                        <input type="number" step="0.1" value="${parsed.frequency || 1}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'frequency', this.value)">
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${parsed.horizontalShift || 0}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onfocus="event.stopPropagation()"
                               oninput="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'power':
                html = `
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${parsed.coefficient || 1}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>指数:</label>
                        <input type="number" step="0.1" value="${parsed.exponent || parsed.power || 1}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'exponent', this.value)">
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${parsed.horizontalShift || parsed.phase || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'hyperbolic':
                html = `
                    <div class="param-row">
                        <label>函数:</label>
                        <span>${parsed.func || 'sinh'}</span>
                    </div>
                    <div class="param-row">
                        <label>振幅 (A):</label>
                        <input type="number" step="0.1" value="${(parsed.amplitude || 1).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'amplitude', this.value)">
                    </div>
                    <div class="param-row">
                        <label>频率 (f):</label>
                        <input type="number" step="0.1" value="${(parsed.frequency || 1).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'frequency', this.value)">
                    </div>
                    <div class="param-row">
                        <label>相位 (φ):</label>
                        <input type="number" step="0.1" value="${(parsed.phase || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'phase', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${(parsed.verticalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'exponential':
                html = `
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${parsed.coefficient}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>底数:</label>
                        <input type="text" value="${parsed.base}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'base', this.value)">
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${parsed.horizontalShift || parsed.phase || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'logarithmic':
                html = `
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${parsed.coefficient}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>底数:</label>
                        <input type="text" value="${parsed.base}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'base', this.value)">
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${parsed.horizontalShift || parsed.phase || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'rounding':
                html = `
                    <div class="param-row">
                        <label>函数:</label>
                        <span>${parsed.func || 'floor'}</span>
                    </div>
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${(parsed.coefficient || 1).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>频率:</label>
                        <input type="number" step="0.1" value="${(parsed.frequency || 1).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'frequency', this.value)">
                    </div>
                    <div class="param-row">
                        <label>相位:</label>
                        <input type="number" step="0.1" value="${(parsed.phase || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'phase', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${(parsed.verticalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'absolute':
                html = `
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${parsed.coefficient}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>频率:</label>
                        <input type="number" step="0.1" value="${parsed.frequency}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'frequency', this.value)">
                    </div>
                    <div class="param-row">
                        <label>相位:</label>
                        <input type="number" step="0.1" value="${parsed.phase || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'phase', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${parsed.verticalShift || 0}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'special':
                html = `
                    <div class="param-row">
                        <label>函数:</label>
                        <span>${parsed.name || '特殊函数'}</span>
                    </div>
                    <div class="param-row">
                        <label>系数:</label>
                        <input type="number" step="0.1" value="${(parsed.coefficient || 1).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'coefficient', this.value)">
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${(parsed.horizontalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${(parsed.verticalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            case 'generic':
                html = `
                    <div class="param-row">
                        <label>表达式:</label>
                        <span>${parsed.expression || '未知'}</span>
                    </div>
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${(parsed.horizontalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${(parsed.verticalShift || 0).toFixed(2)}" 
                               onclick="event.stopPropagation()"
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
                break;
            default:
                html = `
                    <div class="param-row">
                        <label>水平位移:</label>
                        <input type="number" step="0.1" value="${(parsed.horizontalShift || 0).toFixed(2)}" 
                               onchange="app.updateEquationParam(${index}, 'horizontalShift', this.value)">
                    </div>
                    <div class="param-row">
                        <label>垂直位移:</label>
                        <input type="number" step="0.1" value="${(parsed.verticalShift || 0).toFixed(2)}" 
                               onchange="app.updateEquationParam(${index}, 'verticalShift', this.value)">
                    </div>
                `;
        }

        return html;
    }

    /**
     * 更新方程参数
     * @param {number} index - 方程索引
     * @param {string} param - 参数名
     * @param {string} value - 参数值
     */
    updateEquationParam(index, param, value) {
        console.log('updateEquationParam called:', index, param, value);
        const equation = appState.equations[index];
        if (!equation) {
            console.log('Equation not found at index:', index);
            return;
        }

        const parsed = equation.parsed;
        console.log('Before update - parsed:', JSON.stringify(parsed));
        const numValue = parseFloat(value) || 0;

        // 处理水平位移和垂直位移
        if (param === 'horizontalShift') {
            // 对于 special、inverseTrigonometric、power 类型，直接设置 horizontalShift
            if (parsed.type === 'special' || parsed.type === 'inverseTrigonometric' || parsed.type === 'power' || parsed.type === 'exponential' || parsed.type === 'logarithmic') {
                parsed.horizontalShift = numValue;
                console.log('Set horizontalShift:', numValue);
            } else {
                // 三角函数等类型映射到相位（phase）
                if (!parsed.phase) parsed.phase = 0;
                parsed.phase = -numValue; // 水平位移与相位方向相反
            }
        } else if (param === 'verticalShift') {
            parsed.verticalShift = numValue;
            console.log('Set verticalShift:', numValue);
        } else if (param === 'base') {
            parsed[param] = value;
        } else {
            parsed[param] = numValue;
            console.log('Set', param, ':', numValue);
        }

        console.log('After update - parsed:', JSON.stringify(parsed));

        // 更新方程
        appState.updateEquation(index, { parsed: parsed });
        this.render();
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

            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${equation.color}"></div>
                    <div class="legend-text">${displayText}</div>
                </div>
            `;
        });

        legendDisplay.innerHTML = html;
        legendDisplay.style.display = 'block';
        
        // 根据view-controls-canvas是否存在调整legend-display位置
        this.adjustLegendPosition();
    }
    
    /**
     * 调整图例位置
     */
    adjustLegendPosition() {
        const legendDisplay = document.getElementById('legend-display');
        const viewControlsCanvas = document.getElementById('view-controls-canvas');
        
        if (!legendDisplay) return;
        
        // 检查view-controls-canvas是否存在且可见
        const hasToolbar = viewControlsCanvas && 
                          viewControlsCanvas.style.display !== 'none' &&
                          !viewControlsCanvas.classList.contains('hidden');
        
        if (hasToolbar) {
            // 有工具栏时，移除no-toolbar类，图例显示在工具栏下方
            legendDisplay.classList.remove('no-toolbar');
        } else {
            // 无工具栏时，添加no-toolbar类，图例升高到工具栏位置
            legendDisplay.classList.add('no-toolbar');
        }
    }

    /**
     * 切换交点显示
     */
    toggleIntersections() {
        appState.setShowIntersections(!appState.showIntersections);
        this.render();
    }

    /**
     * 更新交点颜色
     */
    updateIntersectionColor() {
        const colorInput = document.getElementById('intersection-color');
        if (colorInput) {
            appState.setIntersectionColor(colorInput.value);
            this.render();
        }
    }

    /**
     * 重置视图
     */
    resetView() {
        appState.resetView();
        this.render();
    }

    /**
     * 重置为正视图
     */
    resetViewFront() {
        appState.setRotation(0, 0, 0);
        this.render();
    }

    /**
     * 重置为俯视图
     */
    resetViewTop() {
        appState.setRotation(-Math.PI / 2, 0, 0);
        this.render();
    }

    /**
     * 重置为侧视图
     */
    resetViewSide() {
        appState.setRotation(0, Math.PI / 2, 0);
        this.render();
    }

    /**
     * 导入3D数据
     */
    import3DData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (data.equations) {
                            data.equations.forEach(eq => appState.addEquation(eq));
                            this.updateEquationsList();
                            this.render();
                            alert('3D数据导入成功！');
                        }
                    } catch (error) {
                        alert('导入失败：文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * 导出3D数据
     */
    export3DData() {
        const data = appState.exportState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `3d_formula_data_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
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
     * 导出 PDF
     */
    exportPDF() {
        // 检查是否有 pdfExporter 模块
        import('./modules/pdfExporter.js').then(({ exportToPDF }) => {
            exportToPDF(this.canvas, appState); // 传递 appState
        }).catch(error => {
            console.error('PDF 导出模块加载失败:', error);
            alert('PDF 导出功能暂时不可用，请使用截图工具');
        });
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
     * 渲染场景（使用 RAF 节流优化）
     */
    render() {
        // 使用 requestAnimationFrame 节流
        if (this.renderScheduled) {
            return;
        }
        
        this.renderScheduled = true;
        
        requestAnimationFrame(() => {
            const startTime = performance.now();
            
            if (appState.is3DMode) {
                this.renderer3D.render3DScene();
            } else {
                // 使用离屏渲染器绘制网格
                if (appState.showGrid && this.gridRenderer) {
                    const gridParams = {
                        scale: appState.scale,
                        offsetX: appState.offsetX,
                        offsetY: appState.offsetY,
                        gridColor: appState.darkMode ? '#404040' : '#e0e0e0',
                        axisColor: appState.darkMode ? '#666' : '#999',
                        darkMode: appState.darkMode
                    };
                    
                    // 尝试使用缓存渲染网格
                    const fromCache = this.gridRenderer.renderGrid(gridParams);
                    
                    // 如果不是从缓存绘制，记录日志
                    if (!fromCache) {
                        // console.log('Grid cache miss - re-rendered');
                    }
                }
                
                this.renderer2D.renderCoordinateSystem();
            }
            
            // 记录性能指标
            performanceMonitor.recordRenderTime(startTime);
            performanceMonitor.recordFrame();
            
            this.renderScheduled = false;
        });
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
        // 启动时清空方程列表，不加载保存的数据
        appState.clearAllEquations();
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

    /**
     * 显示所有方程
     */
    showAllEquations() {
        appState.equations.forEach((equation, index) => {
            if (!equation.visible) {
                equation.visible = true;
                appState.updateEquation(index, { visible: true });
            }
        });
        this.render();
    }

    /**
     * 隐藏所有方程
     */
    hideAllEquations() {
        appState.equations.forEach((equation, index) => {
            if (equation.visible) {
                equation.visible = false;
                appState.updateEquation(index, { visible: false });
            }
        });
        this.render();
    }

    /**
     * 切换网格显示
     */
    toggleGrid() {
        appState.setShowGrid(!appState.showGrid);
        this.render();
    }

    /**
     * 切换深色模式
     */
    toggleDarkMode() {
        appState.setDarkMode(!appState.darkMode);
        this.render();
    }

    /**
     * 更新轴范围
     */
    updateAxisRange() {
        const xMinInput = document.getElementById('x-min');
        const xMaxInput = document.getElementById('x-max');
        const yMinInput = document.getElementById('y-min');
        const yMaxInput = document.getElementById('y-max');
        
        if (!xMinInput || !xMaxInput || !yMinInput || !yMaxInput) {
            console.warn('轴范围输入框未找到');
            return;
        }
        
        const xMin = parseFloat(xMinInput.value) || -10;
        const xMax = parseFloat(xMaxInput.value) || 10;
        const yMin = parseFloat(yMinInput.value) || -10;
        const yMax = parseFloat(yMaxInput.value) || 10;
        
        // 验证范围有效性
        if (xMin >= xMax || yMin >= yMax) {
            alert('轴范围无效：最小值必须小于最大值');
            return;
        }
        
        // 计算新的缩放和偏移
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        
        // 计算缩放比例（保持纵横比）
        const scaleX = canvasWidth / xRange;
        const scaleY = canvasHeight / yRange;
        const newScale = Math.min(scaleX, scaleY);
        
        // 计算偏移（使坐标轴居中）
        const newOffsetX = canvasWidth / 2 - ((xMin + xMax) / 2) * newScale;
        const newOffsetY = canvasHeight / 2 + ((yMin + yMax) / 2) * newScale;
        
        // 更新状态
        appState.setScale(newScale);
        appState.setOffset(newOffsetX, newOffsetY);
        
        this.render();
        console.log(`轴范围已更新：X[${xMin}, ${xMax}], Y[${yMin}, ${yMax}]`);
    }

    /**
     * 切换帮助面板
     */
    toggleHelp() {
        const helpPanel = document.getElementById('help-panel');
        if (helpPanel) {
            helpPanel.classList.toggle('hidden');
        }
    }

    /**
     * 撤销
     */
    undo() {
        if (appState.undo()) {
            this.updateEquationsList();
            this.render();
        }
    }

    /**
     * 重做
     */
    redo() {
        if (appState.redo()) {
            this.updateEquationsList();
            this.render();
        }
    }

    /**
     * 选择预设（兼容旧代码）
     * @param {string} formula - 公式字符串
     */
    selectPreset(formula) {
        const formulaInput = document.getElementById('formula');
        if (formulaInput) {
            formulaInput.value = formula;
            formulaInput.focus();
        }
    }

    /**
     * 切换预设菜单（兼容旧代码）
     */
    togglePresetMenu() {
        const presetMenu = document.getElementById('preset-menu');
        if (presetMenu) {
            presetMenu.classList.toggle('hidden');
        }
    }
}

// 创建全局应用实例
const app = new FormulaVisualizationApp();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出全局引用（供 HTML 中的 onclick 使用）
window.app = app;

// 为了兼容旧 HTML 的 onclick 事件，将常用方法直接暴露到 window 对象
window.addFormula = () => app.addEquation();
window.clearAllEquations = () => app.clearAllEquations();
window.exportImage = () => app.exportImage();
window.exportPDF = () => app.exportPDF();
window.resetView = () => app.resetView();
window.selectPresetFormula = (formula) => app.selectPreset(formula);
window.togglePresetMenu = () => app.togglePresetMenu();
window.removeEquation = (index) => app.removeEquation(index);
window.toggleEquationVisibility = (index) => app.toggleEquationVisibility(index);
window.showAllEquations = () => app.showAllEquations();
window.hideAllEquations = () => app.hideAllEquations();
window.toggleGrid = () => app.toggleGrid();
window.toggleDarkMode = () => app.toggleDarkMode();
window.toggleIntersections = () => app.toggleIntersections();
window.updateIntersectionColor = (color) => app.updateIntersectionColor(color);
window.updateAxisRange = () => app.updateAxisRange();
window.switchTo3D = () => app.switchTo3D();
window.switchTo2D = () => app.switchTo2D();
window.toggleHelp = () => app.toggleHelp();
window.undo = () => app.undo();
window.redo = () => app.redo();

export default app;
