/**
 * 预设管理器模块
 * 统一管理和使用预设公式
 * @module modules/PresetManager
 */

import { presetRegistry } from './presetDecorators.js';
import { FormulaPreset } from './FormulaPreset.js';

/**
 * 预设管理器类
 */
export class PresetManager {
    constructor() {
        this.registry = presetRegistry;
        this.activePresets = new Map();
        this._initialized = false;
    }

    /**
     * 初始化并加载所有预设
     */
    async initialize() {
        if (this._initialized) {
            return;
        }

        // 加载所有预设模块
        await this.loadAllPresets();
        
        this._initialized = true;
        console.log('PresetManager initialized with', this.registry.presets.size, 'presets');
    }

    /**
     * 加载所有预设模块
     */
    async loadAllPresets() {
        // 使用动态导入加载所有预设
        const presetModules = [
            import('../presets/trigonometricPresets.js'),
            import('../presets/polynomialPresets.js'),
            import('../presets/exponentialPresets.js'),
            import('../presets/specialPresets.js'),
            import('../presets/inverseTrigonometricPresets.js')
        ];

        try {
            await Promise.all(presetModules);
            console.log('All preset modules loaded successfully');
        } catch (error) {
            console.warn('Some preset modules failed to load:', error);
        }
    }

    /**
     * 获取分类列表（用于UI显示）
     * @returns {Array} 分类数组
     */
    getCategoriesForUI() {
        return this.registry.getCategories().map(cat => ({
            id: cat.name,
            name: cat.name,
            icon: cat.icon,
            order: cat.order,
            presets: cat.presets.map(p => ({
                id: p.id,
                name: p.name,
                formula: p.formula,
                description: p.description,
                difficulty: p.metadata.difficulty,
                tags: p.metadata.tags,
                style: p.defaultStyle
            }))
        }));
    }

    /**
     * 通过ID创建预设实例
     * @param {string} presetId - 预设ID
     * @param {Object} customParams - 自定义参数
     * @returns {FormulaPreset} 预设实例
     */
    createPreset(presetId, customParams = {}) {
        const presetInfo = this.registry.getPreset(presetId);
        if (!presetInfo) {
            throw new Error(`预设未找到: ${presetId}`);
        }

        const PresetClass = presetInfo.targetClass;
        const instance = new PresetClass({ ...presetInfo.params, ...customParams });
        
        this.activePresets.set(presetId, instance);
        return instance;
    }

    /**
     * 快速添加预设到应用
     * @param {string} presetId - 预设ID
     * @param {Object} appState - 应用状态对象
     * @param {Object} customParams - 自定义参数
     * @returns {Object} 方程对象
     */
    addPresetToApp(presetId, appState, customParams = {}) {
        const preset = this.createPreset(presetId, customParams);
        const equation = preset.toEquation();
        
        appState.addEquation(equation);
        return equation;
    }

    /**
     * 搜索预设
     * @param {string} keyword - 关键词
     * @returns {Array} 搜索结果
     */
    searchPresets(keyword) {
        return this.registry.searchPresets(keyword);
    }

    /**
     * 获取推荐预设
     * @param {Object} context - 上下文
     * @returns {Array} 推荐预设列表
     */
    getRecommendedPresets(context = {}) {
        const recommendations = [];
        
        // 基础推荐
        const basicPresets = [
            'sine-wave-basic',
            'cosine-wave-basic',
            'linear-function',
            'quadratic-function'
        ];
        
        for (const id of basicPresets) {
            const preset = this.registry.getPreset(id);
            if (preset) {
                recommendations.push(preset);
            }
        }
        
        return recommendations;
    }

    /**
     * 获取预设信息
     * @param {string} presetId - 预设ID
     * @returns {Object|null} 预设信息
     */
    getPresetInfo(presetId) {
        return this.registry.getPreset(presetId);
    }

    /**
     * 检查预设是否存在
     * @param {string} presetId - 预设ID
     * @returns {boolean} 是否存在
     */
    hasPreset(presetId) {
        return this.registry.presets.has(presetId);
    }

    /**
     * 获取所有预设ID
     * @returns {Array} 预设ID数组
     */
    getAllPresetIds() {
        return Array.from(this.registry.presets.keys());
    }

    /**
     * 获取预设数量
     * @returns {number} 预设数量
     */
    getPresetCount() {
        return this.registry.presets.size;
    }

    /**
     * 获取分类数量
     * @returns {number} 分类数量
     */
    getCategoryCount() {
        return this.registry.categories.size;
    }
}

// 单例导出
export const presetManager = new PresetManager();

export default presetManager;
