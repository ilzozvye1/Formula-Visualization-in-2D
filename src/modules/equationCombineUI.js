/**
 * 方程组合运算UI模块
 * 功能：
 * 1. 方程选择界面
 * 2. 布尔运算操作界面
 * 3. 隐函数输入界面
 * 4. 不等式区域设置
 */

export class EquationCombineUI {
    constructor(container, equationManager, combiner, renderer) {
        this.container = container;
        this.equationManager = equationManager;
        this.combiner = combiner;
        this.renderer = renderer;
        this.selectedEquations = [];
        this.combinedEquations = [];
        this.intersections = [];

        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        this.container.innerHTML = `
            <div class="combine-panel">
                <div class="combine-section">
                    <h3>方程布尔运算</h3>
                    <div class="equation-selector">
                        <label>选择方程:</label>
                        <div id="equationCheckboxes" class="checkbox-list"></div>
                    </div>
                    <div class="operation-selector">
                        <label>运算类型:</label>
                        <select id="combineOperation">
                            <option value="union">并集 (OR)</option>
                            <option value="intersection">交集 (AND)</option>
                            <option value="difference">差集 (SUBTRACT)</option>
                            <option value="xor">异或 (XOR)</option>
                        </select>
                    </div>
                    <button id="btnCombine" class="btn-primary">执行运算</button>
                </div>

                <div class="combine-section">
                    <h3>隐函数绘制</h3>
                    <div class="input-group">
                        <label>表达式 F(x,y) = 0:</label>
                        <input type="text" id="implicitExpr" placeholder="例如: x^2 + y^2 - 1" />
                    </div>
                    <div class="bounds-inputs">
                        <label>范围:</label>
                        <div class="input-row">
                            <input type="number" id="implicitXMin" value="-5" placeholder="X最小" />
                            <input type="number" id="implicitXMax" value="5" placeholder="X最大" />
                        </div>
                        <div class="input-row">
                            <input type="number" id="implicitYMin" value="-5" placeholder="Y最小" />
                            <input type="number" id="implicitYMax" value="5" placeholder="Y最大" />
                        </div>
                    </div>
                    <button id="btnDrawImplicit" class="btn-primary">绘制隐函数</button>
                </div>

                <div class="combine-section">
                    <h3>不等式区域</h3>
                    <div class="input-group">
                        <label>不等式:</label>
                        <input type="text" id="inequalityExpr" placeholder="例如: y > x^2" />
                    </div>
                    <div class="color-picker-group">
                        <label>填充颜色:</label>
                        <input type="color" id="inequalityColor" value="#4299e1" />
                        <input type="range" id="inequalityOpacity" min="0" max="100" value="30" />
                        <span id="opacityValue">30%</span>
                    </div>
                    <button id="btnDrawInequality" class="btn-primary">绘制区域</button>
                </div>

                <div class="combine-section">
                    <h3>方程组求解</h3>
                    <div class="equation-selector">
                        <label>选择要求解的方程:</label>
                        <div id="solveCheckboxes" class="checkbox-list"></div>
                    </div>
                    <div class="solve-options">
                        <label>求解精度:</label>
                        <input type="range" id="solveTolerance" min="1" max="100" value="10" />
                        <span id="toleranceValue">0.01</span>
                    </div>
                    <button id="btnSolveSystem" class="btn-primary">求解交点</button>
                    <div id="solveResults" class="solve-results"></div>
                </div>

                <div class="combine-section combined-list">
                    <h3>组合方程列表</h3>
                    <div id="combinedEquationsList" class="equation-list"></div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .combine-panel {
                padding: 15px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .combine-section {
                margin-bottom: 20px;
                padding: 15px;
                background: var(--bg-secondary, #f7fafc);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
            }
            .combine-section h3 {
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
            .input-group input[type="text"] {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
                font-size: 14px;
            }
            .bounds-inputs .input-row {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
            }
            .bounds-inputs input {
                flex: 1;
                padding: 6px 10px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
            }
            .checkbox-list {
                max-height: 120px;
                overflow-y: auto;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
                padding: 8px;
                margin-top: 5px;
            }
            .checkbox-item {
                display: flex;
                align-items: center;
                padding: 5px 0;
                cursor: pointer;
            }
            .checkbox-item input[type="checkbox"] {
                margin-right: 8px;
            }
            .checkbox-item .eq-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                margin-right: 8px;
            }
            .checkbox-item .eq-expression {
                font-family: monospace;
                font-size: 13px;
            }
            .operation-selector select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 4px;
                font-size: 14px;
                margin-top: 5px;
            }
            .color-picker-group {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
            }
            .color-picker-group input[type="color"] {
                width: 40px;
                height: 30px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .color-picker-group input[type="range"] {
                flex: 1;
            }
            .solve-options {
                margin-bottom: 12px;
            }
            .solve-options input[type="range"] {
                width: 100%;
                margin-top: 5px;
            }
            .solve-results {
                margin-top: 10px;
                padding: 10px;
                background: var(--bg-tertiary, #edf2f7);
                border-radius: 4px;
                font-size: 13px;
                max-height: 150px;
                overflow-y: auto;
            }
            .solve-results .result-item {
                padding: 4px 0;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
            }
            .solve-results .result-item:last-child {
                border-bottom: none;
            }
            .equation-list {
                max-height: 200px;
                overflow-y: auto;
            }
            .equation-list .equation-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background: white;
                border-radius: 4px;
                margin-bottom: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
            }
            .equation-list .equation-info {
                flex: 1;
            }
            .equation-list .equation-type {
                font-size: 11px;
                color: var(--text-tertiary, #718096);
                text-transform: uppercase;
            }
            .equation-list .equation-expr {
                font-family: monospace;
                font-size: 13px;
                color: var(--text-primary, #2d3748);
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
            }
            .btn-primary:hover {
                background: #3182ce;
            }
            .btn-primary:disabled {
                background: #a0aec0;
                cursor: not-allowed;
            }
            .btn-icon {
                background: none;
                border: none;
                color: #e53e3e;
                cursor: pointer;
                font-size: 16px;
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
        this.container.querySelector('#btnCombine').addEventListener('click', () => this.handleCombine());
        this.container.querySelector('#btnDrawImplicit').addEventListener('click', () => this.handleDrawImplicit());
        this.container.querySelector('#btnDrawInequality').addEventListener('click', () => this.handleDrawInequality());
        this.container.querySelector('#btnSolveSystem').addEventListener('click', () => this.handleSolveSystem());

        const opacitySlider = this.container.querySelector('#inequalityOpacity');
        const opacityValue = this.container.querySelector('#opacityValue');
        opacitySlider.addEventListener('input', (e) => {
            opacityValue.textContent = e.target.value + '%';
        });

        const toleranceSlider = this.container.querySelector('#solveTolerance');
        const toleranceValue = this.container.querySelector('#toleranceValue');
        toleranceSlider.addEventListener('input', (e) => {
            toleranceValue.textContent = (e.target.value / 1000).toFixed(3);
        });
    }

    updateEquationList() {
        const equations = this.equationManager.getEquations ? 
            this.equationManager.getEquations() : 
            (this.equationManager.equations || []);

        const createCheckboxHTML = (idPrefix) => equations.map((eq, index) => `
            <label class="checkbox-item">
                <input type="checkbox" value="${index}" data-eq-id="${eq.id || index}">
                <span class="eq-color" style="background: ${eq.color || '#4299e1'}"></span>
                <span class="eq-expression">${eq.expression || eq.type}</span>
            </label>
        `).join('');

        const equationCheckboxes = this.container.querySelector('#equationCheckboxes');
        const solveCheckboxes = this.container.querySelector('#solveCheckboxes');

        if (equationCheckboxes) {
            equationCheckboxes.innerHTML = createCheckboxHTML('combine');
        }
        if (solveCheckboxes) {
            solveCheckboxes.innerHTML = createCheckboxHTML('solve');
        }
    }

    handleCombine() {
        const checkboxes = this.container.querySelectorAll('#equationCheckboxes input[type="checkbox"]:checked');
        if (checkboxes.length < 2) {
            alert('请至少选择两个方程进行组合');
            return;
        }

        const equations = this.equationManager.getEquations ? 
            this.equationManager.getEquations() : 
            (this.equationManager.equations || []);

        const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));
        const selectedEquations = selectedIndices.map(i => equations[i]);

        const operation = this.container.querySelector('#combineOperation').value;

        const validation = this.combiner.validateCombination(selectedEquations);
        if (!validation.valid) {
            alert('验证失败: ' + validation.errors.join(', '));
            return;
        }

        let result = selectedEquations[0];
        for (let i = 1; i < selectedEquations.length; i++) {
            result = this.combiner.combine(result, selectedEquations[i], operation);
        }

        result.id = 'combined_' + Date.now();
        result.name = `${operation}(${selectedIndices.join(', ')})`;
        result.visible = true;

        this.combinedEquations.push(result);
        this.updateCombinedList();

        if (this.equationManager.addEquation) {
            this.equationManager.addEquation(result);
        }

        this.render();
    }

    handleDrawImplicit() {
        const expression = this.container.querySelector('#implicitExpr').value.trim();
        if (!expression) {
            alert('请输入隐函数表达式');
            return;
        }

        const bounds = {
            xMin: parseFloat(this.container.querySelector('#implicitXMin').value) || -5,
            xMax: parseFloat(this.container.querySelector('#implicitXMax').value) || 5,
            yMin: parseFloat(this.container.querySelector('#implicitYMin').value) || -5,
            yMax: parseFloat(this.container.querySelector('#implicitYMax').value) || 5
        };

        const implicitFunc = this.combiner.createImplicitFunction(expression, { bounds });
        implicitFunc.id = 'implicit_' + Date.now();
        implicitFunc.name = `F(x,y)=0: ${expression}`;
        implicitFunc.visible = true;

        this.combinedEquations.push(implicitFunc);
        this.updateCombinedList();

        if (this.equationManager.addEquation) {
            this.equationManager.addEquation(implicitFunc);
        }

        this.render();
    }

    handleDrawInequality() {
        const expression = this.container.querySelector('#inequalityExpr').value.trim();
        if (!expression) {
            alert('请输入不等式表达式');
            return;
        }

        const color = this.container.querySelector('#inequalityColor').value;
        const opacity = parseInt(this.container.querySelector('#inequalityOpacity').value) / 100;

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        const borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;

        const region = this.combiner.createInequalityRegion(expression, {
            fillColor,
            borderColor
        });
        region.id = 'inequality_' + Date.now();
        region.name = expression;
        region.visible = true;

        this.combinedEquations.push(region);
        this.updateCombinedList();

        if (this.equationManager.addEquation) {
            this.equationManager.addEquation(region);
        }

        this.render();
    }

    handleSolveSystem() {
        const checkboxes = this.container.querySelectorAll('#solveCheckboxes input[type="checkbox"]:checked');
        if (checkboxes.length < 2) {
            alert('请至少选择两个方程进行求解');
            return;
        }

        const equations = this.equationManager.getEquations ? 
            this.equationManager.getEquations() : 
            (this.equationManager.equations || []);

        const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));
        const selectedEquations = selectedIndices.map(i => equations[i]);

        const tolerance = parseInt(this.container.querySelector('#solveTolerance').value) / 1000;

        this.intersections = this.combiner.solveSystem(selectedEquations, { tolerance });

        const resultsContainer = this.container.querySelector('#solveResults');
        if (this.intersections.length === 0) {
            resultsContainer.innerHTML = '<div class="result-item">未找到交点</div>';
        } else {
            resultsContainer.innerHTML = this.intersections.map((point, i) => `
                <div class="result-item">
                    交点 ${i + 1}: (${point.x.toFixed(4)}, ${point.y.toFixed(4)})
                </div>
            `).join('');
        }

        this.render();
    }

    updateCombinedList() {
        const listContainer = this.container.querySelector('#combinedEquationsList');
        if (!listContainer) return;

        listContainer.innerHTML = this.combinedEquations.map((eq, index) => `
            <div class="equation-item" data-index="${index}">
                <div class="equation-info">
                    <div class="equation-type">${eq.type}</div>
                    <div class="equation-expr">${eq.name || eq.expression || '组合方程'}</div>
                </div>
                <button class="btn-icon" data-action="delete" data-index="${index}" title="删除">×</button>
            </div>
        `).join('');

        listContainer.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteCombinedEquation(index);
            });
        });
    }

    deleteCombinedEquation(index) {
        const eq = this.combinedEquations[index];
        this.combinedEquations.splice(index, 1);

        if (this.equationManager.removeEquation && eq.id) {
            this.equationManager.removeEquation(eq.id);
        }

        this.updateCombinedList();
        this.render();
    }

    render() {
        if (this.renderer && this.renderer.render) {
            this.renderer.render();
        }
    }

    show() {
        this.container.style.display = 'block';
        this.updateEquationList();
    }

    hide() {
        this.container.style.display = 'none';
    }

    getIntersections() {
        return this.intersections;
    }

    getCombinedEquations() {
        return this.combinedEquations;
    }
}

export default EquationCombineUI;
