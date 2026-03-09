/**
 * 多项式预设模块
 * @module presets/polynomialPresets
 */

import { FormulaPreset } from '../modules/FormulaPreset.js';
import { PresetCategory, PresetItem } from '../modules/presetDecorators.js';

class LinearPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return this.getParam('slope') * (x - h) + this.getParam('intercept') + k;
    }
}
PresetCategory('多项式', { order: 2, icon: '📈' })(LinearPreset);
PresetItem({
    id: 'linear-function', name: 'y = kx + b', formula: '{slope}x+{intercept}',
    description: '一次函数', params: { slope: 1, intercept: 0, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#9C27B0', lineStyle: 'solid' }, tags: ['多项式', '线性', '基础']
})(LinearPreset);

class QuadraticPreset extends FormulaPreset {
    calculate(x) {
        const a = this.getParam('a'), b = this.getParam('b'), c = this.getParam('c');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return a * shiftedX * shiftedX + b * shiftedX + c + k;
    }
}
PresetCategory('多项式')(QuadraticPreset);
PresetItem({
    id: 'quadratic-function', name: 'y = ax² + bx + c', formula: '{a}x^2+{b}x+{c}',
    description: '二次函数', params: { a: 1, b: 0, c: 0, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#E91E63', lineStyle: 'solid' }, tags: ['多项式', '二次', '抛物线']
})(QuadraticPreset);

class CubicPreset extends FormulaPreset {
    calculate(x) {
        const a = this.getParam('a'), b = this.getParam('b'), c = this.getParam('c'), d = this.getParam('d');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return a * shiftedX * shiftedX * shiftedX + b * shiftedX * shiftedX + c * shiftedX + d + k;
    }
}
PresetCategory('多项式')(CubicPreset);
PresetItem({
    id: 'cubic-function', name: 'y = ax³ + bx² + cx + d', formula: '{a}x^3+{b}x^2+{c}x+{d}',
    description: '三次函数', params: { a: 1, b: 0, c: 0, d: 0, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#673AB7', lineStyle: 'solid' }, tags: ['多项式', '三次', 'S形'], difficulty: 'intermediate'
})(CubicPreset);

class PowerPreset extends FormulaPreset {
    calculate(x) {
        const n = this.getParam('n');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        if (shiftedX < 0 && n !== Math.floor(n)) return NaN;
        return Math.pow(shiftedX, n) + k;
    }
}
PresetCategory('多项式')(PowerPreset);
PresetItem({
    id: 'power-function', name: 'y = x^n', formula: 'x^{n}',
    description: '幂函数', params: { n: 2, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#795548', lineStyle: 'solid' }, tags: ['多项式', '幂函数']
})(PowerPreset);

class SquareRootPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX < 0 ? NaN : Math.sqrt(shiftedX) + k;
    }
}
PresetCategory('多项式')(SquareRootPreset);
PresetItem({
    id: 'square-root', name: 'y = √x', formula: 'x^0.5',
    description: '平方根函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#607D8B', lineStyle: 'solid' }, tags: ['多项式', '根式']
})(SquareRootPreset);

export { LinearPreset, QuadraticPreset, CubicPreset, PowerPreset, SquareRootPreset };
export default { LinearPreset, QuadraticPreset, CubicPreset, PowerPreset, SquareRootPreset };
