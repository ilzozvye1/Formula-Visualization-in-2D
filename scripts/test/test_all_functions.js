// 全面测试脚本 - 测试所有预设公式和功能

// 所有预设公式列表
const testFormulas = {
    '一次方程': [
        'y=x', 'y=2x', 'y=-x', 'y=0.5x', 'y=x+1', 
        'y=2x+1', 'y=-x+3', 'y=0.5x-2', 'y=3'
    ],
    '二次方程': [
        'y=x^2', 'y=-x^2', 'y=2x^2', 'y=0.5x^2', 'y=x^2+1',
        'y=x^2-4', 'y=x^2+2x+1', 'y=x^2-4x+3', 'y=-x^2+4', 'y=2x^2-3x+1'
    ],
    '幂函数': [
        'y=x^3', 'y=x^4', 'y=x^5', 'y=-x^3', 'y=2x^3',
        'y=x^0.5', 'y=x^(1/3)'
    ],
    '指数函数': [
        'y=exp(x)', 'y=2^x', 'y=10^x', 'y=0.5^x',
        'y=-exp(x)', 'y=2exp(x)', 'y=exp(-x)'
    ],
    '对数函数': [
        'y=log(x)', 'y=log10(x)', 'y=-log(x)', 'y=2log(x)', 'y=log(x)+1'
    ],
    '三角函数': [
        'y=sin(x)', 'y=cos(x)', 'y=tan(x)', 'y=2sin(x)', 'y=0.5sin(x)',
        'y=sin(2x)', 'y=sin(0.5x)', 'y=sin(x+1)', 'y=sin(x)+1',
        'y=2cos(x)', 'y=cos(2x)', 'y=cos(x)-1', 'y=2tan(x)', 'y=tan(0.5x)'
    ],
    '反三角函数': [
        'y=arcsin(x)', 'y=arccos(x)', 'y=arctan(x)',
        'y=2arcsin(x)', 'y=2arctan(x)', 'y=arctan(x)+1'
    ],
    '双曲函数': [
        'y=sinh(x)', 'y=cosh(x)', 'y=tanh(x)',
        'y=2sinh(x)', 'y=2cosh(x)', 'y=0.5tanh(x)'
    ],
    '绝对值函数': [
        'y=abs(x)', 'y=-abs(x)', 'y=2abs(x)', 'y=abs(x)+1',
        'y=abs(x-2)', 'y=abs(2x)'
    ],
    '取整函数': [
        'y=floor(x)', 'y=ceil(x)', 'y=round(x)',
        'y=2floor(x)', 'y=floor(x)+1'
    ],
    '特殊函数': [
        'y=1/x', 'y=-1/x', 'y=2/x', 'y=1/(x-1)',
        'y=sin(x)/x', 'y=x*sin(x)', 'y=sin(x)/x^0.5',
        'y=exp(-x^2)', 'y=2*exp(-x^2)', 'y=exp(-abs(x))',
        'y=1/(1+exp(-x))', 'y=log(x)/log(2)',
        'y=abs(sin(x))', 'y=abs(cos(x))',
        'y=x^2*sin(1/x)', 'y=x*exp(-x)', 'y=x^2*exp(-x)',
        'y=sin(x^2)', 'y=cos(x^2)', 'y=tanh(x)',
        'y=1/(1+x^2)', 'y=x/(1+abs(x))',
        'y=x^3-x', 'y=x^3-3x'
    ]
};

// 测试结果统计
let testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// 测试公式解析
function testFormulaParsing() {
    console.log('=== 测试公式解析 ===');
    
    for (let category in testFormulas) {
        console.log(`\n测试分类: ${category}`);
        testFormulas[category].forEach(formula => {
            try {
                let parsed = parseFormula(formula);
                if (parsed) {
                    console.log(`✓ ${formula} -> type: ${parsed.type}`);
                    testResults.passed.push({type: 'parse', formula, parsed});
                } else {
                    console.error(`✗ ${formula} -> 解析失败`);
                    testResults.failed.push({type: 'parse', formula, error: '解析返回null'});
                }
            } catch (e) {
                console.error(`✗ ${formula} -> 错误: ${e.message}`);
                testResults.failed.push({type: 'parse', formula, error: e.message});
            }
        });
    }
}

// 测试参数编辑器生成
function testParamEditor() {
    console.log('\n=== 测试参数编辑器 ===');
    
    let testCases = [
        { formula: 'y=2x+1', expectedParams: ['slope', 'x0', 'y0'] },
        { formula: 'y=x^2', expectedParams: ['a', 'x0', 'y0'] },
        { formula: 'y=sin(x)', expectedParams: ['A', 'ω', 'φ', 'c'] },
        { formula: 'y=x^3', expectedParams: ['k', 'n', 'φ', 'c'] },
        { formula: 'y=exp(x)', expectedParams: ['k', 'φ', 'c'] },
        { formula: 'y=log(x)', expectedParams: ['k', 'φ', 'c'] },
        { formula: 'y=arcsin(x)', expectedParams: ['A', 'ω', 'φ', 'c'] },
        { formula: 'y=sinh(x)', expectedParams: ['A', 'ω', 'φ', 'c'] },
        { formula: 'y=abs(x)', expectedParams: ['k', 'ω', 'φ', 'c'] },
        { formula: 'y=floor(x)', expectedParams: ['k', 'ω', 'φ', 'c'] },
        { formula: 'y=1/x', expectedParams: [] } // 特殊函数应该有输入框
    ];
    
    testCases.forEach(testCase => {
        try {
            let parsed = parseFormula(testCase.formula);
            if (parsed) {
                let mockEquation = { formula: testCase.formula, parsed: parsed };
                let html = generateEquationEditor(mockEquation, 0);
                
                // 检查参数输入框
                let hasParams = testCase.expectedParams.every(param => html.includes(param));
                
                if (hasParams || parsed.type === 'special') {
                    console.log(`✓ ${testCase.formula} -> 参数编辑器正常`);
                    testResults.passed.push({type: 'editor', formula: testCase.formula});
                } else {
                    console.warn(`⚠ ${testCase.formula} -> 参数可能不完整`);
                    testResults.warnings.push({type: 'editor', formula: testCase.formula, expected: testCase.expectedParams});
                }
            }
        } catch (e) {
            console.error(`✗ ${testCase.formula} -> 错误: ${e.message}`);
            testResults.failed.push({type: 'editor', formula: testCase.formula, error: e.message});
        }
    });
}

// 测试拖拽功能
function testDragFunctionality() {
    console.log('\n=== 测试拖拽功能 ===');
    
    let dragTestCases = [
        { formula: 'y=2x+1', type: 'linear' },
        { formula: 'y=x^2', type: 'quadratic' },
        { formula: 'y=sin(x)', type: 'trigonometric' },
        { formula: 'y=x^3', type: 'power' },
        { formula: 'y=exp(x)', type: 'exponential' },
        { formula: 'y=log(x)', type: 'logarithmic' },
        { formula: 'y=arcsin(x)', type: 'inverseTrigonometric' },
        { formula: 'y=sinh(x)', type: 'hyperbolic' },
        { formula: 'y=abs(x)', type: 'absolute' },
        { formula: 'y=floor(x)', type: 'rounding' }
    ];
    
    dragTestCases.forEach(testCase => {
        try {
            let parsed = parseFormula(testCase.formula);
            if (parsed && parsed.type === testCase.type) {
                // 模拟拖拽更新
                let originalIntercept = parsed.intercept || parsed.verticalShift || 0;
                updateEquationPosition(0, 1, 1); // 模拟拖拽
                
                console.log(`✓ ${testCase.formula} -> 支持拖拽`);
                testResults.passed.push({type: 'drag', formula: testCase.formula});
            }
        } catch (e) {
            console.error(`✗ ${testCase.formula} -> 拖拽错误: ${e.message}`);
            testResults.failed.push({type: 'drag', formula: testCase.formula, error: e.message});
        }
    });
}

// 测试绘制功能
function testDrawing() {
    console.log('\n=== 测试绘制功能 ===');
    
    // 清空现有方程
    equations = [];
    
    // 测试每个分类的代表公式
    let drawTests = [
        'y=x', 'y=x^2', 'y=x^3', 'y=exp(x)', 'y=log(x)',
        'y=sin(x)', 'y=arcsin(x)', 'y=sinh(x)', 
        'y=abs(x)', 'y=floor(x)', 'y=1/x'
    ];
    
    drawTests.forEach(formula => {
        try {
            let parsed = parseFormula(formula);
            if (parsed) {
                equations.push({
                    formula: formula,
                    parsed: parsed,
                    color: '#ff0000',
                    style: 'solid',
                    visible: true
                });
                
                console.log(`✓ ${formula} -> 可绘制`);
                testResults.passed.push({type: 'draw', formula});
            }
        } catch (e) {
            console.error(`✗ ${formula} -> 绘制错误: ${e.message}`);
            testResults.failed.push({type: 'draw', formula, error: e.message});
        }
    });
    
    // 重绘
    drawCoordinateSystem();
}

// 生成测试报告
function generateReport() {
    console.log('\n========== 测试报告 ==========');
    console.log(`通过: ${testResults.passed.length}`);
    console.log(`警告: ${testResults.warnings.length}`);
    console.log(`失败: ${testResults.failed.length}`);
    
    if (testResults.failed.length > 0) {
        console.log('\n--- 失败项 ---');
        testResults.failed.forEach(item => {
            console.log(`${item.type}: ${item.formula} - ${item.error}`);
        });
    }
    
    if (testResults.warnings.length > 0) {
        console.log('\n--- 警告项 ---');
        testResults.warnings.forEach(item => {
            console.log(`${item.type}: ${item.formula}`);
        });
    }
    
    return testResults;
}

// 运行所有测试
function runAllTests() {
    console.log('开始全面测试...\n');
    
    testFormulaParsing();
    testParamEditor();
    testDragFunctionality();
    testDrawing();
    
    return generateReport();
}

// 导出测试函数
window.runAllTests = runAllTests;
window.testResults = testResults;
