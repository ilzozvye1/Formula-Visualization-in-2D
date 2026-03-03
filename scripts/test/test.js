// 公式解析测试脚本
// 用于验证所有支持的公式类型是否能正确解析和显示

const testCases = [
    // 一次方程
    { input: 'y=2x+1', expectedType: 'linear', description: '一次方程' },
    { input: 'y=x', expectedType: 'linear', description: '一次方程(简化)' },
    { input: 'y=-x+3', expectedType: 'linear', description: '一次方程(负数)' },
    
    // 二次方程
    { input: 'y=x^2', expectedType: 'quadratic', description: '二次方程' },
    { input: 'y=2x^2-3x+1', expectedType: 'quadratic', description: '二次方程(完整)' },
    { input: 'y=-x^2+4', expectedType: 'quadratic', description: '二次方程(负数)' },
    
    // 幂函数
    { input: 'y=x^3', expectedType: 'power', description: '幂函数' },
    { input: 'y=x^0.5', expectedType: 'power', description: '幂函数(分数指数)' },
    { input: 'y=2x^-1', expectedType: 'power', description: '幂函数(负指数)' },
    
    // 指数函数
    { input: 'y=exp(x)', expectedType: 'exponential', description: '指数函数(e)' },
    { input: 'y=2^x', expectedType: 'exponential', description: '指数函数(底数2)' },
    { input: 'y=exp(x)+1', expectedType: 'exponential', description: '指数函数(带位移)' },
    
    // 对数函数
    { input: 'y=log(x)', expectedType: 'logarithmic', description: '对数函数(自然对数)' },
    { input: 'y=log10(x)', expectedType: 'logarithmic', description: '对数函数(常用对数)' },
    
    // 三角函数
    { input: 'y=sin(x)', expectedType: 'trigonometric', description: '正弦函数' },
    { input: 'y=cos(x)', expectedType: 'trigonometric', description: '余弦函数' },
    { input: 'y=tan(x)', expectedType: 'trigonometric', description: '正切函数' },
    { input: 'y=2sin(3x+1)+4', expectedType: 'trigonometric', description: '正弦函数(完整参数)' },
    
    // 反三角函数
    { input: 'y=arcsin(x)', expectedType: 'inverseTrigonometric', description: '反正弦函数' },
    { input: 'y=arccos(x)', expectedType: 'inverseTrigonometric', description: '反余弦函数' },
    { input: 'y=arctan(x)', expectedType: 'inverseTrigonometric', description: '反正切函数' },
    { input: 'y=asin(x)', expectedType: 'inverseTrigonometric', description: '反正弦函数(简写)' },
    { input: 'y=acos(x)', expectedType: 'inverseTrigonometric', description: '反余弦函数(简写)' },
    { input: 'y=atan(x)', expectedType: 'inverseTrigonometric', description: '反正切函数(简写)' },
    
    // 双曲函数
    { input: 'y=sinh(x)', expectedType: 'hyperbolic', description: '双曲正弦' },
    { input: 'y=cosh(x)', expectedType: 'hyperbolic', description: '双曲余弦' },
    { input: 'y=tanh(x)', expectedType: 'hyperbolic', description: '双曲正切' },
    
    // 绝对值函数
    { input: 'y=abs(x)', expectedType: 'absolute', description: '绝对值函数' },
    { input: 'y=|x|', expectedType: 'absolute', description: '绝对值函数(符号)' },
    { input: 'y=2abs(x)+1', expectedType: 'absolute', description: '绝对值函数(带参数)' },
    
    // 取整函数
    { input: 'y=floor(x)', expectedType: 'rounding', description: '向下取整' },
    { input: 'y=ceil(x)', expectedType: 'rounding', description: '向上取整' },
    { input: 'y=round(x)', expectedType: 'rounding', description: '四舍五入' },
];

// 运行测试
function runTests() {
    console.log('========================================');
    console.log('    公式解析测试开始');
    console.log('========================================\n');
    
    let passed = 0;
    let failed = 0;
    const errors = [];
    
    testCases.forEach((testCase, index) => {
        console.log(`测试 ${index + 1}/${testCases.length}: ${testCase.description}`);
        console.log(`  输入: ${testCase.input}`);
        
        try {
            // 清理输入（去掉y=前缀）
            let expression = testCase.input.replace(/^y=/, '');
            
            // 调用解析函数
            let result = parseFormula(testCase.input);
            
            if (!result) {
                console.log(`  ❌ 失败: 解析返回null`);
                failed++;
                errors.push({ testCase, error: '解析返回null' });
            } else if (result.type !== testCase.expectedType) {
                console.log(`  ❌ 失败: 类型不匹配`);
                console.log(`     期望: ${testCase.expectedType}`);
                console.log(`     实际: ${result.type}`);
                failed++;
                errors.push({ testCase, error: `类型不匹配: 期望${testCase.expectedType}, 实际${result.type}` });
            } else {
                console.log(`  ✅ 通过: 类型=${result.type}`);
                passed++;
            }
        } catch (error) {
            console.log(`  ❌ 失败: 抛出异常`);
            console.log(`     错误: ${error.message}`);
            failed++;
            errors.push({ testCase, error: error.message });
        }
        
        console.log('');
    });
    
    // 输出总结
    console.log('========================================');
    console.log('    测试结果总结');
    console.log('========================================');
    console.log(`总测试数: ${testCases.length}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(1)}%`);
    console.log('========================================');
    
    if (errors.length > 0) {
        console.log('\n错误详情:');
        errors.forEach((err, index) => {
            console.log(`\n${index + 1}. ${err.testCase.description}`);
            console.log(`   输入: ${err.testCase.input}`);
            console.log(`   错误: ${err.error}`);
        });
    }
    
    return { passed, failed, total: testCases.length };
}

// 如果直接运行此脚本，执行测试
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
    // 在浏览器中运行
    window.runFormulaTests = runTests;
    console.log('测试脚本已加载，调用 runFormulaTests() 开始测试');
}
