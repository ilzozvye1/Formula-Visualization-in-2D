/**
 * 特殊函数预设模块
 * @module presets/specialPresets
 */

import { FormulaPreset } from '../modules/FormulaPreset.js';
import { PresetCategory, PresetItem } from '../modules/presetDecorators.js';

class AbsoluteValuePreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.abs(x - h) + k;
    }
}
PresetCategory('特殊函数', { order: 4, icon: '🔣' })(AbsoluteValuePreset);
PresetItem({
    id: 'absolute-value', name: 'y = |x|', formula: 'abs(x)',
    description: '绝对值函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#FF5722', lineStyle: 'solid' }, tags: ['特殊函数', '绝对值']
})(AbsoluteValuePreset);

class FloorPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.floor(x - h) + k;
    }
}
PresetCategory('特殊函数')(FloorPreset);
PresetItem({
    id: 'floor-function', name: 'y = ⌊x⌋', formula: 'floor(x)',
    description: '向下取整函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#795548', lineStyle: 'solid' }, tags: ['特殊函数', '取整', '阶梯']
})(FloorPreset);

class CeilingPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.ceil(x - h) + k;
    }
}
PresetCategory('特殊函数')(CeilingPreset);
PresetItem({
    id: 'ceiling-function', name: 'y = ⌈x⌉', formula: 'ceil(x)',
    description: '向上取整函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#8D6E63', lineStyle: 'solid' }, tags: ['特殊函数', '取整', '阶梯']
})(CeilingPreset);

class RoundPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return Math.round(x - h) + k;
    }
}
PresetCategory('特殊函数')(RoundPreset);
PresetItem({
    id: 'round-function', name: 'y = [x]', formula: 'round(x)',
    description: '四舍五入函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#A1887F', lineStyle: 'solid' }, tags: ['特殊函数', '取整', '阶梯']
})(RoundPreset);

class InverseProportionPreset extends FormulaPreset {
    calculate(x) {
        const coefficient = this.getParam('coefficient');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return Math.abs(shiftedX) < 0.0001 ? NaN : coefficient / shiftedX + k;
    }
}
PresetCategory('特殊函数')(InverseProportionPreset);
PresetItem({
    id: 'inverse-proportion', name: 'y = k/x', formula: '{coefficient}/x',
    description: '反比例函数', params: { coefficient: 1, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#9C27B0', lineStyle: 'solid' }, tags: ['特殊函数', '反比例', '双曲线']
})(InverseProportionPreset);

class SincPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return Math.abs(shiftedX) < 0.0001 ? 1 + k : Math.sin(shiftedX) / shiftedX + k;
    }
}
PresetCategory('特殊函数')(SincPreset);
PresetItem({
    id: 'sinc-function', name: 'y = sin(x)/x', formula: 'sin(x)/x',
    description: 'Sinc函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#00BCD4', lineStyle: 'solid' }, tags: ['特殊函数', 'Sinc', '信号处理'], difficulty: 'intermediate'
})(SincPreset);

class OscillatingPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX * Math.sin(shiftedX) + k;
    }
}
PresetCategory('特殊函数')(OscillatingPreset);
PresetItem({
    id: 'oscillating-function', name: 'y = x·sin(x)', formula: 'x*sin(x)',
    description: '振荡增长函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#E91E63', lineStyle: 'solid' }, tags: ['特殊函数', '振荡', '增长']
})(OscillatingPreset);

class DampedOscillationPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX <= 0 ? NaN : Math.sin(shiftedX) / Math.sqrt(shiftedX) + k;
    }
}
PresetCategory('特殊函数')(DampedOscillationPreset);
PresetItem({
    id: 'damped-oscillation', name: 'y = sin(x)/√x', formula: 'sin(x)/x^0.5',
    description: '衰减振荡函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#FF9800', lineStyle: 'solid' }, tags: ['特殊函数', '振荡', '衰减'], difficulty: 'intermediate'
})(DampedOscillationPreset);

class DirichletLikePreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return Math.abs(shiftedX) < 0.0001 ? k : shiftedX * shiftedX * Math.sin(1 / shiftedX) + k;
    }
}
PresetCategory('特殊函数')(DirichletLikePreset);
PresetItem({
    id: 'dirichlet-like', name: 'y = x²·sin(1/x)', formula: 'x^2*sin(1/x)',
    description: '病态振荡函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#673AB7', lineStyle: 'solid' }, tags: ['特殊函数', '振荡', '病态'], difficulty: 'advanced'
})(DirichletLikePreset);

class LorentzianPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return 1 / (1 + shiftedX * shiftedX) + k;
    }
}
PresetCategory('特殊函数')(LorentzianPreset);
PresetItem({
    id: 'lorentzian-function', name: 'y = 1/(1+x²)', formula: '1/(1+x^2)',
    description: '洛伦兹函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#3F51B5', lineStyle: 'solid' }, tags: ['特殊函数', '洛伦兹', '物理']
})(LorentzianPreset);

class SoftSaturationPreset extends FormulaPreset {
    calculate(x) {
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return shiftedX / (1 + Math.abs(shiftedX)) + k;
    }
}
PresetCategory('特殊函数')(SoftSaturationPreset);
PresetItem({
    id: 'soft-saturation', name: 'y = x/(1+|x|)', formula: 'x/(1+abs(x))',
    description: '软饱和函数', params: { horizontalShift: 0, verticalShift: 0 },
    style: { color: '#009688', lineStyle: 'solid' }, tags: ['特殊函数', '饱和', 'S型']
})(SoftSaturationPreset);

export { AbsoluteValuePreset, FloorPreset, CeilingPreset, RoundPreset, InverseProportionPreset, SincPreset, OscillatingPreset, DampedOscillationPreset, DirichletLikePreset, LorentzianPreset, SoftSaturationPreset };
export default { AbsoluteValuePreset, FloorPreset, CeilingPreset, RoundPreset, InverseProportionPreset, SincPreset, OscillatingPreset, DampedOscillationPreset, DirichletLikePreset, LorentzianPreset, SoftSaturationPreset };
