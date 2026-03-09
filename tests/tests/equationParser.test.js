/**
 * 方程解析器测试
 */

const { expect } = window.chai || chai;

describe('方程解析器 (equationParser)', function() {
    describe('parseFormula - 基本函数解析', function() {
        it('应该解析线性函数 y = 2x + 1', function() {
            const result = parseFormula('y = 2x + 1');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('linear');
            expect(result.slope).to.equal(2);
            expect(result.intercept).to.equal(1);
        });
        
        it('应该解析线性函数 y = x', function() {
            const result = parseFormula('y = x');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('linear');
            expect(result.slope).to.equal(1);
            expect(result.intercept).to.equal(0);
        });
        
        it('应该解析线性函数 y = -3x + 5', function() {
            const result = parseFormula('y = -3x + 5');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('linear');
            expect(result.slope).to.equal(-3);
            expect(result.intercept).to.equal(5);
        });
        
        it('应该解析二次函数 y = x^2', function() {
            const result = parseFormula('y = x^2');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('quadratic');
            expect(result.a).to.equal(1);
        });
        
        it('应该解析二次函数 y = 2x^2 + 3x + 1', function() {
            const result = parseFormula('y = 2x^2 + 3x + 1');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('quadratic');
            expect(result.a).to.equal(2);
            expect(result.b).to.equal(3);
            expect(result.c).to.equal(1);
        });
    });
    
    describe('parseFormula - 三角函数解析', function() {
        it('应该解析正弦函数 y = sin(x)', function() {
            const result = parseFormula('y = sin(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('trigonometric');
            expect(result.func).to.equal('sin');
        });
        
        it('应该解析正弦函数 y = 2sin(3x + 1)', function() {
            const result = parseFormula('y = 2sin(3x + 1)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('trigonometric');
            expect(result.func).to.equal('sin');
            expect(result.amplitude).to.equal(2);
            expect(result.frequency).to.equal(3);
            expect(result.phase).to.equal(1);
        });
        
        it('应该解析余弦函数 y = cos(x)', function() {
            const result = parseFormula('y = cos(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('trigonometric');
            expect(result.func).to.equal('cos');
        });
        
        it('应该解析正切函数 y = tan(x)', function() {
            const result = parseFormula('y = tan(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('trigonometric');
            expect(result.func).to.equal('tan');
        });
    });
    
    describe('parseFormula - 反三角函数解析', function() {
        it('应该解析反正弦函数 y = arcsin(x)', function() {
            const result = parseFormula('y = arcsin(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('inverseTrigonometric');
            expect(result.func).to.equal('arcsin');
        });
        
        it('应该解析反余弦函数 y = arccos(x)', function() {
            const result = parseFormula('y = arccos(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('inverseTrigonometric');
            expect(result.func).to.equal('arccos');
        });
        
        it('应该解析反正切函数 y = arctan(x)', function() {
            const result = parseFormula('y = arctan(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('inverseTrigonometric');
            expect(result.func).to.equal('arctan');
        });
        
        it('应该解析带参数的反正弦函数 y = 2arcsin(3x)', function() {
            const result = parseFormula('y = 2arcsin(3x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('inverseTrigonometric');
            expect(result.func).to.equal('arcsin');
            expect(result.amplitude).to.equal(2);
            expect(result.frequency).to.equal(3);
        });
    });
    
    describe('parseFormula - 指数和对数函数解析', function() {
        it('应该解析指数函数 y = e^x', function() {
            const result = parseFormula('y = e^x');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('exponential');
            expect(result.base).to.equal('e');
        });
        
        it('应该解析指数函数 y = 2^x', function() {
            const result = parseFormula('y = 2^x');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('exponential');
            expect(result.base).to.equal(2);
        });
        
        it('应该解析自然对数 y = ln(x)', function() {
            const result = parseFormula('y = ln(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('logarithmic');
            expect(result.func).to.equal('ln');
        });
        
        it('应该解析常用对数 y = log10(x)', function() {
            const result = parseFormula('y = log10(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('logarithmic');
            expect(result.func).to.equal('log10');
        });
    });
    
    describe('parseFormula - 特殊函数解析', function() {
        it('应该解析绝对值函数 y = |x|', function() {
            const result = parseFormula('y = |x|');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('special');
            expect(result.func).to.equal('abs');
        });
        
        it('应该解析绝对值函数 y = abs(x)', function() {
            const result = parseFormula('y = abs(x)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('special');
            expect(result.func).to.equal('abs');
        });
        
        it('应该解析高斯函数 y = e^(-x^2)', function() {
            const result = parseFormula('y = e^(-x^2)');
            expect(result).to.not.be.null;
            expect(result.type).to.equal('special');
        });
    });
    
    describe('parseFormula - 错误处理', function() {
        it('应该返回 null 对于空字符串', function() {
            const result = parseFormula('');
            expect(result).to.be.null;
        });
        
        it('应该返回 null 对于无效公式', function() {
            const result = parseFormula('y = invalid');
            expect(result).to.be.null;
        });
        
        it('应该返回 null 对于只有空格的字符串', function() {
            const result = parseFormula('   ');
            expect(result).to.be.null;
        });
    });
    
    describe('evaluateEquation - 方程求值', function() {
        it('应该正确计算线性函数 y = 2x + 1 在 x = 3 时的值', function() {
            const parsed = parseFormula('y = 2x + 1');
            const result = evaluateEquation(parsed, 3);
            expect(result).to.equal(7);
        });
        
        it('应该正确计算二次函数 y = x^2 在 x = 4 时的值', function() {
            const parsed = parseFormula('y = x^2');
            const result = evaluateEquation(parsed, 4);
            expect(result).to.equal(16);
        });
        
        it('应该正确计算正弦函数 y = sin(x) 在 x = 0 时的值', function() {
            const parsed = parseFormula('y = sin(x)');
            const result = evaluateEquation(parsed, 0);
            expect(result).to.be.closeTo(0, 0.0001);
        });
        
        it('应该正确计算正弦函数 y = sin(x) 在 x = π/2 时的值', function() {
            const parsed = parseFormula('y = sin(x)');
            const result = evaluateEquation(parsed, Math.PI / 2);
            expect(result).to.be.closeTo(1, 0.0001);
        });
        
        it('应该返回 NaN 对于定义域外的值 (arcsin)', function() {
            const parsed = parseFormula('y = arcsin(x)');
            const result = evaluateEquation(parsed, 2);
            expect(result).to.be.NaN;
        });
        
        it('应该返回 NaN 对于定义域外的值 (ln)', function() {
            const parsed = parseFormula('y = ln(x)');
            const result = evaluateEquation(parsed, -1);
            expect(result).to.be.NaN;
        });
    });
    
    describe('formatEquation - 公式格式化', function() {
        it('应该格式化线性函数', function() {
            const parsed = parseFormula('y = 2x + 1');
            const formatted = formatEquation(parsed);
            expect(formatted).to.include('y = 2x');
        });
        
        it('应该格式化正弦函数', function() {
            const parsed = parseFormula('y = sin(x)');
            const formatted = formatEquation(parsed);
            expect(formatted).to.include('sin');
        });
    });
});
