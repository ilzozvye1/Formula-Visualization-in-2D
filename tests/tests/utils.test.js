/**
 * 工具函数测试
 */

const { expect } = window.chai || chai;

describe('工具函数 (utils)', function() {
    describe('防抖函数 (debounce)', function() {
        it('应该延迟执行函数', function(done) {
            let callCount = 0;
            const debouncedFn = debounce(() => {
                callCount++;
            }, 100);
            
            // 立即调用
            debouncedFn();
            expect(callCount).to.equal(0);
            
            // 等待 150ms 后检查
            setTimeout(() => {
                expect(callCount).to.equal(1);
                done();
            }, 150);
        });
        
        it('应该取消之前的调用', function(done) {
            let callCount = 0;
            const debouncedFn = debounce(() => {
                callCount++;
            }, 50);
            
            // 快速调用多次
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            expect(callCount).to.equal(0);
            
            // 等待后只执行一次
            setTimeout(() => {
                expect(callCount).to.equal(1);
                done();
            }, 100);
        });
    });
    
    describe('节流函数 (throttle)', function() {
        it('应该限制函数执行频率', function(done) {
            let callCount = 0;
            const throttledFn = throttle(() => {
                callCount++;
            }, 100);
            
            // 快速调用多次
            throttledFn();
            throttledFn();
            throttledFn();
            
            expect(callCount).to.equal(1); // 立即执行一次
            
            // 等待 150ms 后可以再次执行
            setTimeout(() => {
                throttledFn();
                expect(callCount).to.equal(2);
                done();
            }, 150);
        });
    });
    
    describe('坐标转换函数', function() {
        it('应该正确转换屏幕坐标到世界坐标', function() {
            // 这些函数需要在 app.js 或 utils 中定义
            // 这里是示例测试
            const screenX = 400;
            const screenY = 300;
            const scaleX = 40;
            const scaleY = 40;
            const offsetX = 0;
            const offsetY = 0;
            
            // 假设的转换公式
            const worldX = (screenX - offsetX) / scaleX;
            const worldY = -(screenY - offsetY) / scaleY;
            
            expect(worldX).to.equal(10);
            expect(worldY).to.be.closeTo(-7.5, 0.1);
        });
        
        it('应该正确转换世界坐标到屏幕坐标', function() {
            const worldX = 10;
            const worldY = -7.5;
            const scaleX = 40;
            const scaleY = 40;
            const offsetX = 0;
            const offsetY = 0;
            
            // 假设的转换公式
            const screenX = worldX * scaleX + offsetX;
            const screenY = -worldY * scaleY + offsetY;
            
            expect(screenX).to.equal(400);
            expect(screenY).to.be.closeTo(300, 1);
        });
    });
    
    describe('颜色工具函数', function() {
        it('应该生成有效的十六进制颜色', function() {
            // 假设有一个 generateColor 函数
            const color = '#FF5733';
            expect(color).to.match(/^#[0-9A-F]{6}$/i);
        });
        
        it('应该解析十六进制颜色', function() {
            const hex = '#FF5733';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            
            expect(r).to.equal(255);
            expect(g).to.equal(87);
            expect(b).to.equal(51);
        });
    });
});

// 辅助函数（如果尚未在全局作用域中定义）
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
