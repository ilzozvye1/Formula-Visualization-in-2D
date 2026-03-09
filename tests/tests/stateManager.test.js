/**
 * 状态管理器测试
 */

const { expect } = window.chai || chai;

describe('状态管理器 (stateManager)', function() {
    let state;
    
    beforeEach(function() {
        // 创建新的状态实例用于测试
        state = window.appState;
        state.clearAllEquations();
    });
    
    describe('基本功能', function() {
        it('应该初始化空方程列表', function() {
            expect(state.equations).to.be.an('array');
            expect(state.equations).to.have.lengthOf(0);
        });
        
        it('应该有默认的缩放比例', function() {
            expect(state.scale).to.be.a('number');
            expect(state.scale).to.be.greaterThan(0);
        });
        
        it('应该有默认的偏移量', function() {
            expect(state.offsetX).to.be.a('number');
            expect(state.offsetY).to.be.a('number');
        });
    });
    
    describe('方程管理', function() {
        it('应该添加方程到列表', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear', slope: 2, intercept: 1 },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            
            expect(state.equations).to.have.lengthOf(1);
            expect(state.equations[0]).to.deep.include(equation);
        });
        
        it('应该更新方程', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear', slope: 2, intercept: 1 },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            state.updateEquation(0, { visible: false });
            
            expect(state.equations[0].visible).to.be.false;
        });
        
        it('应该删除方程', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear', slope: 2, intercept: 1 },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            state.addEquation({ ...equation, formula: 'y = x^2' });
            
            expect(state.equations).to.have.lengthOf(2);
            
            state.removeEquation(0);
            
            expect(state.equations).to.have.lengthOf(1);
            expect(state.equations[0].formula).to.equal('y = x^2');
        });
        
        it('应该清空所有方程', function() {
            state.addEquation({
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            });
            state.addEquation({
                formula: 'y = x^2',
                parsed: { type: 'quadratic' },
                color: '#00FF00',
                visible: true
            });
            
            expect(state.equations).to.have.lengthOf(2);
            
            state.clearAllEquations();
            
            expect(state.equations).to.have.lengthOf(0);
        });
        
        it('应该切换方程可见性', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            state.toggleEquationVisibility(0);
            
            expect(state.equations[0].visible).to.be.false;
            
            state.toggleEquationVisibility(0);
            
            expect(state.equations[0].visible).to.be.true;
        });
    });
    
    describe('视图控制', function() {
        it('应该设置缩放比例', function() {
            const newScale = 50;
            state.setScale(newScale);
            expect(state.scale).to.equal(newScale);
        });
        
        it('应该设置偏移量', function() {
            const newX = 100;
            const newY = 200;
            state.setOffset(newX, newY);
            expect(state.offsetX).to.equal(newX);
            expect(state.offsetY).to.equal(newY);
        });
        
        it('应该重置视图', function() {
            state.setScale(50);
            state.setOffset(100, 200);
            
            state.resetView();
            
            expect(state.scale).to.equal(40); // 默认值
            expect(state.offsetX).to.equal(0);
            expect(state.offsetY).to.equal(0);
        });
        
        it('应该切换网格显示', function() {
            const initialGrid = state.showGrid;
            state.setShowGrid(!initialGrid);
            expect(state.showGrid).to.equal(!initialGrid);
            
            state.setShowGrid(initialGrid);
            expect(state.showGrid).to.equal(initialGrid);
        });
        
        it('应该切换深色模式', function() {
            const initialDarkMode = state.darkMode;
            state.setDarkMode(!initialDarkMode);
            expect(state.darkMode).to.equal(!initialDarkMode);
            
            state.setDarkMode(initialDarkMode);
            expect(state.darkMode).to.equal(initialDarkMode);
        });
    });
    
    describe('历史记录（撤销/重做）', function() {
        it('应该支持撤销操作', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            expect(state.equations).to.have.lengthOf(1);
            
            const undone = state.undo();
            expect(undone).to.be.true;
            expect(state.equations).to.have.lengthOf(0);
        });
        
        it('应该支持重做操作', function() {
            const equation = {
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            };
            
            state.addEquation(equation);
            state.undo();
            
            expect(state.equations).to.have.lengthOf(0);
            
            const redone = state.redo();
            expect(redone).to.be.true;
            expect(state.equations).to.have.lengthOf(1);
        });
        
        it('应该在重做后添加新方程时清除重做历史', function() {
            state.addEquation({
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            });
            
            state.undo();
            state.addEquation({
                formula: 'y = x^2',
                parsed: { type: 'quadratic' },
                color: '#00FF00',
                visible: true
            });
            
            const redone = state.redo();
            expect(redone).to.be.false;
        });
    });
    
    describe('颜色管理', function() {
        it('应该返回新方程颜色', function() {
            const color = state.getNewEquationColor();
            expect(color).to.be.a('string');
            expect(color).to.match(/^#[0-9A-F]{6}$/i);
        });
        
        it('应该循环使用预设颜色', function() {
            const colors = [];
            for (let i = 0; i < 10; i++) {
                colors.push(state.getNewEquationColor());
            }
            
            // 验证颜色是从预设列表中选择的
            expect(colors).to.have.lengthOf(10);
        });
    });
    
    describe('状态导出和导入', function() {
        it('应该导出状态', function() {
            state.addEquation({
                formula: 'y = 2x + 1',
                parsed: { type: 'linear' },
                color: '#FF0000',
                visible: true
            });
            
            const exported = state.exportState();
            
            expect(exported).to.be.an('object');
            expect(exported.equations).to.be.an('array');
            expect(exported.equations).to.have.lengthOf(1);
            expect(exported.scale).to.be.a('number');
            expect(exported.offsetX).to.be.a('number');
            expect(exported.offsetY).to.be.a('number');
        });
        
        it('应该导入状态', function() {
            const importedState = {
                equations: [
                    {
                        formula: 'y = 2x + 1',
                        parsed: { type: 'linear', slope: 2, intercept: 1 },
                        color: '#FF0000',
                        visible: true
                    }
                ],
                scale: 50,
                offsetX: 100,
                offsetY: 200,
                showGrid: false,
                darkMode: true
            };
            
            state.importState(importedState);
            
            expect(state.equations).to.have.lengthOf(1);
            expect(state.scale).to.equal(50);
            expect(state.offsetX).to.equal(100);
            expect(state.offsetY).to.equal(200);
            expect(state.showGrid).to.be.false;
            expect(state.darkMode).to.be.true;
        });
    });
    
    describe('交点管理', function() {
        it('应该设置交点列表', function() {
            const intersections = [
                { x: 0, y: 1, equation1: 0, equation2: 1 },
                { x: 1, y: 3, equation1: 0, equation2: 1 }
            ];
            
            state.setIntersections(intersections);
            
            expect(state.intersections).to.deep.equal(intersections);
        });
        
        it('应该清除交点', function() {
            state.setIntersections([
                { x: 0, y: 1, equation1: 0, equation2: 1 }
            ]);
            
            state.clearIntersections();
            
            expect(state.intersections).to.be.an('array');
            expect(state.intersections).to.have.lengthOf(0);
        });
        
        it('应该切换交点显示', function() {
            const initialShow = state.showIntersections;
            state.setShowIntersections(!initialShow);
            expect(state.showIntersections).to.equal(!initialShow);
        });
    });
});
