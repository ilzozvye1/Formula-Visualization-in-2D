/**
 * 反三角函数预设模块
 * @module presets/inverseTrigonometricPresets
 */

import { FormulaPreset } from '../modules/FormulaPreset.js';
import { PresetCategory, PresetItem } from '../modules/presetDecorators.js';

class ArcSinePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude') || 1;
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        if (shiftedX < -1 || shiftedX > 1) return NaN;
        return A * Math.asin(shiftedX) + k;
    }
}
PresetCategory('反三角函数', { order: 5, icon: '🔄' })(ArcSinePreset);
PresetItem({
    id: 'arcsin-function', name: 'y = arcsin(x)', formula: 'arcsin(x)',
    description: '反正弦函数', params: { amplitude: 1, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#E91E63', lineStyle: 'solid' }, tags: ['反三角函数', '反正弦'], difficulty: 'intermediate'
})(ArcSinePreset);

class ArcCosinePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude') || 1;
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        if (shiftedX < -1 || shiftedX > 1) return NaN;
        return A * Math.acos(shiftedX) + k;
    }
}
PresetCategory('反三角函数')(ArcCosinePreset);
PresetItem({
    id: 'arccos-function', name: 'y = arccos(x)', formula: 'arccos(x)',
    description: '反余弦函数', params: { amplitude: 1, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#9C27B0', lineStyle: 'solid' }, tags: ['反三角函数', '反余弦'], difficulty: 'intermediate'
})(ArcCosinePreset);

class ArcTangentPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude') || 1;
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        const shiftedX = x - h;
        return A * Math.atan(shiftedX) + k;
    }
}
PresetCategory('反三角函数')(ArcTangentPreset);
PresetItem({
    id: 'arctan-function', name: 'y = arctan(x)', formula: 'arctan(x)',
    description: '反正切函数', params: { amplitude: 1, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#673AB7', lineStyle: 'solid' }, tags: ['反三角函数', '反正切'], difficulty: 'intermediate'
})(ArcTangentPreset);

export { ArcSinePreset, ArcCosinePreset, ArcTangentPreset };
export default { ArcSinePreset, ArcCosinePreset, ArcTangentPreset };
