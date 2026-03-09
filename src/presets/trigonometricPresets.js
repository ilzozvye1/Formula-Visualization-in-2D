/**
 * 三角函数预设模块
 * @module presets/trigonometricPresets
 */

import { FormulaPreset } from '../modules/FormulaPreset.js';
import { PresetCategory, PresetItem } from '../modules/presetDecorators.js';

/**
 * 正弦波预设
 */
class SineWavePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift');
        const h = this.getParam('horizontalShift') || 0;
        
        return A * Math.sin(B * (x - h) + C) + D;
    }
}

// 应用装饰器 - 公式格式必须匹配解析器期望的格式
PresetCategory('三角函数', { order: 1, icon: '📐' })(SineWavePreset);
PresetItem({
    id: 'sine-wave-basic',
    name: 'y = sin(x)',
    formula: '{amplitude}sin({frequency}x+{phase})+{verticalShift}',
    description: '标准正弦波',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#2196F3', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '波动'],
    difficulty: 'basic'
})(SineWavePreset);

/**
 * 余弦波预设
 */
class CosineWavePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift');
        const h = this.getParam('horizontalShift') || 0;
        return A * Math.cos(B * (x - h) + C) + D;
    }
}

PresetCategory('三角函数')(CosineWavePreset);
PresetItem({
    id: 'cosine-wave-basic',
    name: 'y = cos(x)',
    formula: '{amplitude}cos({frequency}x+{phase})+{verticalShift}',
    description: '标准余弦波',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#4CAF50', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '波动']
})(CosineWavePreset);

/**
 * 正切函数预设
 */
class TangentPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift');
        const h = this.getParam('horizontalShift') || 0;
        const tanArg = B * (x - h) + C;
        if (Math.abs(Math.cos(tanArg)) < 0.001) return NaN;
        return A * Math.tan(tanArg) + D;
    }
}

PresetCategory('三角函数')(TangentPreset);
PresetItem({
    id: 'tangent-basic',
    name: 'y = tan(x)',
    formula: '{amplitude}tan({frequency}x+{phase})+{verticalShift}',
    description: '正切函数',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#FF9800', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '渐近线'],
    difficulty: 'intermediate'
})(TangentPreset);

/**
 * 阻尼正弦波
 */
class DampedSineWavePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const alpha = this.getParam('damping');
        const omega = this.getParam('angularFreq');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return A * Math.exp(-alpha * (x - h)) * Math.sin(omega * (x - h)) + k;
    }
}

PresetCategory('三角函数')(DampedSineWavePreset);
PresetItem({
    id: 'damped-sine-wave',
    name: 'y = e^(-αx)·sin(ωx)',
    formula: '{amplitude}exp(-{damping}x)sin({angularFreq}x)',
    description: '阻尼正弦波',
    params: { amplitude: 1, damping: 0.1, angularFreq: 2, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#9C27B0', lineStyle: 'solid' },
    tags: ['三角函数', '衰减', '物理'],
    difficulty: 'intermediate'
})(DampedSineWavePreset);

/**
 * 拍频波
 */
class BeatWavePreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const deltaOmega = this.getParam('deltaFreq');
        const omega = this.getParam('carrierFreq');
        const h = this.getParam('horizontalShift') || 0;
        const k = this.getParam('verticalShift') || 0;
        return 2 * A * Math.cos(deltaOmega * (x - h)) * Math.sin(omega * (x - h)) + k;
    }
}

PresetCategory('三角函数')(BeatWavePreset);
PresetItem({
    id: 'beat-wave',
    name: 'y = 2A·cos(Δωx)·sin(ωx)',
    formula: '2*{amplitude}cos({deltaFreq}x)sin({carrierFreq}x)',
    description: '拍频波',
    params: { amplitude: 1, deltaFreq: 0.5, carrierFreq: 5, horizontalShift: 0, verticalShift: 0 },
    style: { color: '#E91E63', lineStyle: 'solid' },
    tags: ['三角函数', '拍频', '叠加'],
    difficulty: 'advanced'
})(BeatWavePreset);

export { SineWavePreset, CosineWavePreset, TangentPreset, DampedSineWavePreset, BeatWavePreset };
export default { SineWavePreset, CosineWavePreset, TangentPreset, DampedSineWavePreset, BeatWavePreset };

class CotangentPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift') || 0;
        const h = this.getParam('horizontalShift') || 0;
        const angle = B * (x - h) + C;
        if (Math.abs(Math.tan(angle)) < 0.001) return NaN;
        return A / Math.tan(angle) + D;
    }
}
PresetCategory('三角函数')(CotangentPreset);
PresetItem({
    id: 'cotangent-basic',
    name: 'y = cot(x)',
    formula: '{amplitude}cot({frequency}x+{phase})+{verticalShift}',
    description: '余切函数',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#00BCD4', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '渐近线'],
    difficulty: 'intermediate'
})(CotangentPreset);

class SecantPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift') || 0;
        const h = this.getParam('horizontalShift') || 0;
        const angle = B * (x - h) + C;
        if (Math.abs(Math.cos(angle)) < 0.001) return NaN;
        return A / Math.cos(angle) + D;
    }
}
PresetCategory('三角函数')(SecantPreset);
PresetItem({
    id: 'secant-basic',
    name: 'y = sec(x)',
    formula: '{amplitude}sec({frequency}x+{phase})+{verticalShift}',
    description: '正割函数',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#FF5722', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '渐近线'],
    difficulty: 'intermediate'
})(SecantPreset);

class CosecantPreset extends FormulaPreset {
    calculate(x) {
        const A = this.getParam('amplitude');
        const B = this.getParam('frequency');
        const C = this.getParam('phase');
        const D = this.getParam('verticalShift') || 0;
        const h = this.getParam('horizontalShift') || 0;
        const angle = B * (x - h) + C;
        if (Math.abs(Math.sin(angle)) < 0.001) return NaN;
        return A / Math.sin(angle) + D;
    }
}
PresetCategory('三角函数')(CosecantPreset);
PresetItem({
    id: 'cosecant-basic',
    name: 'y = csc(x)',
    formula: '{amplitude}csc({frequency}x+{phase})+{verticalShift}',
    description: '余割函数',
    params: { amplitude: 1, frequency: 1, phase: 0, verticalShift: 0, horizontalShift: 0 },
    style: { color: '#8BC34A', lineStyle: 'solid' },
    tags: ['三角函数', '周期', '渐近线'],
    difficulty: 'intermediate'
})(CosecantPreset);
