/**
 * 指数和对数预设模块
 * @module presets/exponentialPresets
 */

import { FormulaPreset } from '../modules/FormulaPreset.js';
import { PresetCategory, PresetItem } from '../modules/presetDecorators.js';

class NaturalExponentialPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.exp(x - h) + k;
    }
}
PresetCategory('指数对数', { order: 3, icon: '📊' })(NaturalExponentialPreset);
PresetItem({
    id: 'natural-exponential', name: 'y = e^x', formula: 'e^x',
    description: '自然指数函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#FF5722', lineStyle: 'solid' }, tags: ['指数', '自然指数', '增长']
})(NaturalExponentialPreset);

class GeneralExponentialPreset extends FormulaPreset {
    calculate(x) {
        const coefficient = this.getParam('coefficient');
        const base = this.getParam('base');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return coefficient * Math.pow(base, x - h) + k;
    }
}
PresetCategory('指数对数')(GeneralExponentialPreset);
PresetItem({
    id: 'general-exponential', name: 'y = a·b^x', formula: '{base}^x',
    description: '一般指数函数', params: { coefficient: 1, base: 2, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#FF9800', lineStyle: 'solid' }, tags: ['指数', '增长', '衰减']
})(GeneralExponentialPreset);

class NaturalLogarithmPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX <= 0 ? NaN : Math.log(shiftedX) + k;
    }
}
PresetCategory('指数对数')(NaturalLogarithmPreset);
PresetItem({
    id: 'natural-logarithm', name: 'y = ln(x)', formula: 'log(x)',
    description: '自然对数函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#4CAF50', lineStyle: 'solid' }, tags: ['对数', '自然对数']
})(NaturalLogarithmPreset);

class CommonLogarithmPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX <= 0 ? NaN : Math.log10(shiftedX) + k;
    }
}
PresetCategory('指数对数')(CommonLogarithmPreset);
PresetItem({
    id: 'common-logarithm', name: 'y = log₁₀(x)', formula: 'log10(x)',
    description: '常用对数函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#8BC34A', lineStyle: 'solid' }, tags: ['对数', '常用对数']
})(CommonLogarithmPreset);

class GaussianPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const sigma = this.getParam('sigma');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return A * Math.exp(-shiftedX * shiftedX / (2 * sigma * sigma)) + k;
    }
}
PresetCategory('指数对数')(GaussianPreset);
PresetItem({
    id: 'gaussian-function', name: 'y = A·e^(-x²/2σ²)', formula: 'e^(-x^2)',
    description: '高斯函数', params: { amplitude: 1, sigma: 1, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#9C27B0', lineStyle: 'solid' }, tags: ['指数', '高斯', '钟形曲线', '概率'], difficulty: 'intermediate'
})(GaussianPreset);

class SigmoidPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return 1 / (1 + Math.exp(-(x - h))) + k;
    }
}
PresetCategory('指数对数')(SigmoidPreset);
PresetItem({
    id: 'sigmoid-function', name: 'y = 1/(1+e^(-x))', formula: '1/(1+exp(-x))',
    description: 'Sigmoid函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#00BCD4', lineStyle: 'solid' }, tags: ['指数', 'Sigmoid', 'S型', '神经网络'], difficulty: 'intermediate'
})(SigmoidPreset);

class HyperbolicSinePreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.sinh(x - h) + k;
    }
}
PresetCategory('指数对数')(HyperbolicSinePreset);
PresetItem({
    id: 'hyperbolic-sine', name: 'y = sinh(x)', formula: 'sinh(x)',
    description: '双曲正弦函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#3F51B5', lineStyle: 'solid' }, tags: ['双曲函数', '指数']
})(HyperbolicSinePreset);

class HyperbolicCosinePreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.cosh(x - h) + k;
    }
}
PresetCategory('指数对数')(HyperbolicCosinePreset);
PresetItem({
    id: 'hyperbolic-cosine', name: 'y = cosh(x)', formula: 'cosh(x)',
    description: '双曲余弦函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#2196F3', lineStyle: 'solid' }, tags: ['双曲函数', '指数']
})(HyperbolicCosinePreset);

class HyperbolicTangentPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.tanh(x - h) + k;
    }
}
PresetCategory('指数对数')(HyperbolicTangentPreset);
PresetItem({
    id: 'hyperbolic-tangent', name: 'y = tanh(x)', formula: 'tanh(x)',
    description: '双曲正切函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#00BCD4', lineStyle: 'solid' }, tags: ['双曲函数', '指数', '神经网络']
})(HyperbolicTangentPreset);

export { NaturalExponentialPreset, GeneralExponentialPreset, NaturalLogarithmPreset, CommonLogarithmPreset, GaussianPreset, SigmoidPreset, HyperbolicSinePreset, HyperbolicCosinePreset, HyperbolicTangentPreset };
export default { NaturalExponentialPreset, GeneralExponentialPreset, NaturalLogarithmPreset, CommonLogarithmPreset, GaussianPreset, SigmoidPreset, HyperbolicSinePreset, HyperbolicCosinePreset, HyperbolicTangentPreset };
