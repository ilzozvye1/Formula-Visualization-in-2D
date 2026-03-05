/**
 * 区域填充UI模块
 * 功能：
 * 1. 填充类型选择
 * 2. 颜色和透明度设置
 * 3. 填充区域管理
 * 4. 面积计算显示
 */

export class AreaFillUI {
    constructor(container, areaFill, equationManager) {
        this.container = container;
        this.areaFill = areaFill;
        this.equationManager = equationManager;
        this.fillRegions = [];

        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        this.container.innerHTML = `
            <div class="area-fill-panel">
                <div class="fill-section">
                    <h3>函数下方填充</h3>
                    <div class="input-group">
                        <label>选择方程:</label>
                        <select id="belowEquationSelect">
                            <option value="">-- 选择方程 --</option>
                        </select>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>X范围:</label>
                            <input type="number" id="belowXMin" value="-5" step="0.1">
                            <span>到</span>
                            <input type="number" id="belowXMax" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>基线:</label>
                            <input type="number" id="belowBaseline" value="0" step="0.1">
                        </div>
                    </div>
                    <div class="color-settings">
                        <div class="input-group">
                            <label>填充颜色:</label>
                            <input type="color" id="belowFillColor" value="#4299e1">
                            <input type="range" id="belowOpacity" min="0" max="100" value="30">
                            <span id="belowOpacityValue">30%</span>
                        </div>
                    </div>
                    <button id="btnFillBelow" class="btn-primary">填充下方区域</button>
                </div>

                <div class="fill-section">
                    <h3>函数上方填充</h3>
                    <div class="input-group">
                        <label>选择方程:</label>
                        <select id="aboveEquationSelect">
                            <option value="">-- 选择方程 --</option>
                        </select>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>X范围:</label>
                            <input type="number" id="aboveXMin" value="-5" step="0.1">
                            <span>到</span>
                            <input type="number" id="aboveXMax" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="color-settings">
                        <div class="input-group">
                            <label>填充颜色:</label>
                            <input type="color" id="aboveFillColor" value="#ec7063">
                            <input type="range" id="aboveOpacity" min="0" max="100" value="30">
                            <span id="aboveOpacityValue">30%</span>
                        </div>
                    </div>
                    <button id="btnFillAbove" class="btn-primary">填充上方区域</button>
                </div>

                <div class="fill-section">
                    <h3>两函数之间填充</h3>
                    <div class="input-group">
                        <label>第一个方程:</label>
                        <select id="betweenEq1Select">
                            <option value="">-- 选择方程 --</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>第二个方程:</label>
                        <select id="betweenEq2Select">
                            <option value="">-- 选择方程 --</option>
                        </select>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>X范围:</label>
                            <input type="number" id="betweenXMin" value="-5" step="0.1">
                            <span>到</span>
                            <input type="number" id="betweenXMax" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="color-settings">
                        <div class="input-group">
                            <label>填充颜色:</label>
                            <input type="color" id="betweenFillColor" value="#9b59b6">
                            <input type="range" id="betweenOpacity" min="0" max="100" value="30">
                            <span id="betweenOpacityValue">30%</span>
                        </div>
                    </div>
                    <button id="btnFillBetween" class="btn-primary">填充之间区域</button>
                </div>

                <div class="fill-section">
                    <h3>积分区域</h3>
                    <div class="input-group">
                        <label>选择方程:</label>
                        <select id="integralEquationSelect">
                            <option value="">-- 选择方程 --</option>
                        </select>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>积分区间:</label>
                            <input type="number" id="integralA" value="0" step="0.1">
                            <span>到</span>
                            <input type="number" id="integralB" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>梯形数量:</label>
                            <input type="number" id="integralN" value="50" min="10" max="200">
                        </div>
                    </div>
                    <div class="color-settings">
                        <div class="input-group">
                            <label>填充颜色:</label>
                            <input type="color" id="integralFillColor" value="#f1c40f">
                            <input type="range" id="integralOpacity" min="0" max="100" value="30">
                            <span id="integralOpacityValue">30%</span>
                        </div>
                    </div>
                    <button id="btnFillIntegral" class="btn-primary">显示积分区域</button>
                    <div id="integralResult" class="result-box"></div>
                </div>

                <div class="fill-section">
                    <h3>不等式区域</h3>
                    <div class="input-group">
                        <label>不等式表达式:</label>
                        <input type="text" id="inequalityExpr" placeholder="例如: y > x^2">
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>X范围:</label>
                            <input type="number" id="inequalityXMin" value="-5" step="0.1">
                            <span>到</span>
                            <input type="number" id="inequalityXMax" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="input-row">
                        <div class="input-group">
                            <label>Y范围:</label>
                            <input type="number" id="inequalityYMin" value="-5" step="0.1">
                            <span>到</span>
                            <input type="number" id="inequalityYMax" value="5" step="0.1">
                        </div>
                    </div>
                    <div class="color-settings">
                        <div class="input-group">
                            <label>填充颜色:</label>
                            <input type="color" id="inequalityFillColor" value="#2ecc71">
                            <input type="range" id="inequalityOpacity" min="0" max="100" value="30">
                            <span id="inequalityOpacityValue">30%</span>
                        </div>
                    </div>
                    <button id="btnFillInequality" class="btn-primary">填充不等式区域</button>
                </div>

                <div class="fill-section">
                    <h3>填充区域列表</h3>
                    <div id="fillRegionsList" class="regions-list">
                        <div class="empty-state">暂无填充区域</div>
                    </div>
                    <button id="btnClearAllFills" class="btn-text">清除所有填充</button>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .area-fill-panel {
                padding: 15px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .fill-section {
                margin-bottom: 20px;
                padding: 15px;
                background: var(--bg-secondary, #f7fafc);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
            }
            .fill-section h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: var(--text-primary, #2d3748);
            }
            .input-group {
                margin-bottom: 12px;
            }
            .input-group label {
                display: block;
                margin-bottom: 5px;
                font-size: 14px;
                color: var(--text-secondary, #4a5568);
            }
            .input-group select,
            .input-group input[type="text"] {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
                font-size: 14px;
            }
            .input-row {
                display: flex;
                gap: 10px;
                align-items: flex-end;
            }
            .input-row .input-group {
                flex: 1;
            }
            .input-row span {
                padding-bottom: 8px;
                color: var(--text-secondary, #4a5568);
            }
            .input-group input[type="number"] {
                width: 80px;
                padding: 6px 10px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
            }
            .color-settings {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .color-settings input[type="color"] {
                width: 40px;
                height: 30px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .color-settings input[type="range"] {
                flex: 1;
            }
            .btn-primary {
                width: 100%;
                padding: 10px;
                background: #4299e1;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s;
                margin-top: 10px;
            }
            .btn-primary:hover {
                background: #3182ce;
            }
            .btn-text {
                width: 100%;
                padding: 8px;
                background: transparent;
                color: #e53e3e;
                border: none;
                font-size: 13px;
                cursor: pointer;
                margin-top: 10px;
            }
            .btn-text:hover {
                text-decoration: underline;
            }
            .result-box {
                margin-top: 10px;
                padding: 10px;
                background: #edf2f7;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
                color: #2d3748;
            }
            .regions-list {
                max-height: 200px;
                overflow-y: auto;
            }
            .empty-state {
                text-align: center;
                padding: 20px;
                color: var(--text-tertiary, #718096);
                font-size: 13px;
            }
            .region-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background: white;
                border-radius: 4px;
                margin-bottom: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
            }
            .region-info {
                flex: 1;
            }
            .region-type {
                font-size: 11px;
                color: var(--text-tertiary, #718096);
                text-transform: uppercase;
            }
            .region-desc {
                font-size: 13px;
                color: var(--text-primary, #2d3748);
            }
            .region-color {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                margin-right: 10px;
            }
            .btn-icon {
                background: none;
                border: none;
                color: #e53e3e;
                cursor: pointer;
                font-size: 18px;
                padding: 4px 8px;
            }
            .btn-icon:hover {
                background: #fed7d7;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // 透明度滑块
        ['below', 'above', 'between', 'integral', 'inequality'].forEach(type => {
            const slider = this.container.querySelector(`#${type}Opacity`);
            const value = this.container.querySelector(`#${type}OpacityValue`);
            if (slider && value) {
                slider.addEventListener('input', (e) => {
                    value.textContent = e.target.value + '%';
                });
            }
        });

        // 填充按钮
        this.container.querySelector('#btnFillBelow').addEventListener('click', () => this.fillBelow());
        this.container.querySelector('#btnFillAbove').addEventListener('click', () => this.fillAbove());
        this.container.querySelector('#btnFillBetween').addEventListener('click', () => this.fillBetween());
        this.container.querySelector('#btnFillIntegral').addEventListener('click', () => this.fillIntegral());
        this.container.querySelector('#btnFillInequality').addEventListener('click', () => this.fillInequality());
        this.container.querySelector('#btnClearAllFills').addEventListener('click', () => this.clearAllFills());
    }

    updateEquationSelects() {
        const equations = this.equationManager.getEquations ? 
            this.equationManager.getEquations() : 
            (this.equationManager.equations || []);

        const options = equations.map((eq, index) => 
            `<option value="${index}">${eq.expression || eq.type}</option>`
        ).join('');

        ['belowEquationSelect', 'aboveEquationSelect', 'betweenEq1Select', 'betweenEq2Select', 'integralEquationSelect'].forEach(id => {
            const select = this.container.querySelector(`#${id}`);
            if (select) {
                select.innerHTML = '<option value="">-- 选择方程 --</option>' + options;
            }
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    fillBelow() {
        const eqIndex = this.container.querySelector('#belowEquationSelect').value;
        if (!eqIndex) {
            alert('请选择一个方程');
            return;
        }

        const equations = this.equationManager.getEquations ? 
            this.equationManager.getEquations() : 
            (this.equationManager.equations || []);
        
        const equation = equations[parseInt(eqIndex)];
        const xMin = parseFloat(this.container.querySelector('#belowXMin').value);
        const xMax = parseFloat(this.container.querySelector('#belowXMax').value);
        const baseline = parseFloat(this.container.querySelector('#belowBaseline').value);
        const color = this.container.querySelector('#belowFillColor').value;
        const opacity = parseInt(this.container.querySelector('#belowOpacity').value) / 100;

        const fillColor = this.hexToRgba(color, opacity);
        const strokeColor = this.hexToRgba(color, 0.8);

        // 创建求值函数
        const fn = (x) => {
            try {
                // 简化的求值，实际应该使用 equationParser
                return Math.sin(x); // 示例
            } catch (e) {
                return 0;
            }
        };

        this.areaFill.fillBelowFunction(fn, { xMin, xMax }, {
            fillColor,
            strokeColor,
            baseline
        });

        this.addFillRegion('below', `y < f(x), x∈[${xMin}, ${xMax}]`, color);
    }

    fillAbove() {
        const eqIndex = this.container.querySelector('#aboveEquationSelect').value;
        if (!eqIndex) {
            alert('请选择一个方程');
            return;
        }

        const xMin = parseFloat(this.container.querySelector('#aboveXMin').value);
        const xMax = parseFloat(this.container.querySelector('#aboveXMax').value);
        const color = this.container.querySelector('#aboveFillColor').value;
        const opacity = parseInt(this.container.querySelector('#aboveOpacity').value) / 100;

        const fillColor = this.hexToRgba(color, opacity);
        const strokeColor = this.hexToRgba(color, 0.8);

        const fn = (x) => Math.sin(x); // 示例

        this.areaFill.fillAboveFunction(fn, { xMin, xMax, yMax: 5 }, {
            fillColor,
            strokeColor
        });

        this.addFillRegion('above', `y > f(x), x∈[${xMin}, ${xMax}]`, color);
    }

    fillBetween() {
        const eq1Index = this.container.querySelector('#betweenEq1Select').value;
        const eq2Index = this.container.querySelector('#betweenEq2Select').value;
        
        if (!eq1Index || !eq2Index) {
            alert('请选择两个方程');
            return;
        }

        const xMin = parseFloat(this.container.querySelector('#betweenXMin').value);
        const xMax = parseFloat(this.container.querySelector('#betweenXMax').value);
        const color = this.container.querySelector('#betweenFillColor').value;
        const opacity = parseInt(this.container.querySelector('#betweenOpacity').value) / 100;

        const fillColor = this.hexToRgba(color, opacity);

        const fn1 = (x) => Math.sin(x);
        const fn2 = (x) => Math.cos(x);

        this.areaFill.fillBetweenFunctions(fn1, fn2, { xMin, xMax }, {
            fillColor
        });

        this.addFillRegion('between', `f₁(x) < y < f₂(x), x∈[${xMin}, ${xMax}]`, color);
    }

    fillIntegral() {
        const eqIndex = this.container.querySelector('#integralEquationSelect').value;
        if (!eqIndex) {
            alert('请选择一个方程');
            return;
        }

        const a = parseFloat(this.container.querySelector('#integralA').value);
        const b = parseFloat(this.container.querySelector('#integralB').value);
        const n = parseInt(this.container.querySelector('#integralN').value);
        const color = this.container.querySelector('#integralFillColor').value;
        const opacity = parseInt(this.container.querySelector('#integralOpacity').value) / 100;

        const fillColor = this.hexToRgba(color, opacity);
        const strokeColor = this.hexToRgba(color, 0.8);

        const fn = (x) => Math.sin(x);

        this.areaFill.fillIntegralRegion(fn, a, b, {
            fillColor,
            strokeColor,
            n,
            showTrapezoids: true
        });

        // 计算面积
        const area = this.areaFill.calculateArea(fn, a, b, n);
        
        const resultDiv = this.container.querySelector('#integralResult');
        resultDiv.innerHTML = `
            <strong>积分结果:</strong><br>
            ∫<sub>${a}</sub><sup>${b}</sup> f(x) dx ≈ ${area.toFixed(4)}<br>
            <small>使用 ${n} 个梯形计算</small>
        `;

        this.addFillRegion('integral', `∫${a}^{b} f(x)dx`, color);
    }

    fillInequality() {
        const expr = this.container.querySelector('#inequalityExpr').value.trim();
        if (!expr) {
            alert('请输入不等式表达式');
            return;
        }

        const xMin = parseFloat(this.container.querySelector('#inequalityXMin').value);
        const xMax = parseFloat(this.container.querySelector('#inequalityXMax').value);
        const yMin = parseFloat(this.container.querySelector('#inequalityYMin').value);
        const yMax = parseFloat(this.container.querySelector('#inequalityYMax').value);
        const color = this.container.querySelector('#inequalityFillColor').value;
        const opacity = parseInt(this.container.querySelector('#inequalityOpacity').value) / 100;

        const fillColor = this.hexToRgba(color, opacity);

        // 简化的不等式求值
        const inequality = (x, y) => y > x * x;

        this.areaFill.fillInequalityRegion(inequality, { xMin, xMax, yMin, yMax }, {
            fillColor,
            resolution: 100
        });

        this.addFillRegion('inequality', expr, color);
    }

    addFillRegion(type, description, color) {
        const region = {
            id: 'fill_' + Date.now(),
            type: type,
            description: description,
            color: color,
            createdAt: new Date().toLocaleString()
        };

        this.fillRegions.push(region);
        this.updateRegionsList();
    }

    updateRegionsList() {
        const listContainer = this.container.querySelector('#fillRegionsList');
        
        if (this.fillRegions.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">暂无填充区域</div>';
            return;
        }

        const typeNames = {
            below: '下方填充',
            above: '上方填充',
            between: '之间填充',
            integral: '积分区域',
            inequality: '不等式区域'
        };

        listContainer.innerHTML = this.fillRegions.map((region, index) => `
            <div class="region-item" data-index="${index}">
                <div class="region-color" style="background: ${region.color}"></div>
                <div class="region-info">
                    <div class="region-type">${typeNames[region.type] || region.type}</div>
                    <div class="region-desc">${region.description}</div>
                </div>
                <button class="btn-icon" data-action="delete" data-index="${index}">×</button>
            </div>
        `).join('');

        listContainer.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFillRegion(index);
            });
        });
    }

    removeFillRegion(index) {
        this.fillRegions.splice(index, 1);
        this.updateRegionsList();
    }

    clearAllFills() {
        if (confirm('确定要清除所有填充区域吗？')) {
            this.fillRegions = [];
            this.updateRegionsList();
            // 触发重绘
            if (this.equationManager.render) {
                this.equationManager.render();
            }
        }
    }

    show() {
        this.container.style.display = 'block';
        this.updateEquationSelects();
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default AreaFillUI;
