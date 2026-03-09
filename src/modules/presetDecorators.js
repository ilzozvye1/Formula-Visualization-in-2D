/**
 * 预设公式装饰器模块
 * 提供类似 C# Attribute 的装饰器功能
 * @module modules/presetDecorators
 */

/**
 * 预设公式注册表 - 全局单例
 */
class PresetRegistry {
    constructor() {
        this.categories = new Map();
        this.presets = new Map();
    }

    /**
     * 注册分类
     * @param {Function} target - 目标类
     * @param {string} categoryName - 分类名称
     * @param {Object} options - 配置选项
     */
    registerCategory(target, categoryName, options = {}) {
        if (!this.categories.has(categoryName)) {
            this.categories.set(categoryName, {
                name: categoryName,
                order: options.order || 999,
                icon: options.icon || '📐',
                presets: []
            });
        }
        target._presetCategory = categoryName;
        return this;
    }

    /**
     * 注册预设项
     * @param {Function} target - 目标类
     * @param {Object} config - 预设配置
     */
    registerPreset(target, config) {
        const category = target._presetCategory || '未分类';
        
        if (!this.categories.has(category)) {
            this.registerCategory(target, category);
        }

        const presetInfo = {
            id: config.id || this.generateId(),
            name: config.name,
            formula: config.formula,
            description: config.description || '',
            category: category,
            params: config.params || {},
            defaultStyle: config.style || { color: '#ff0000', lineStyle: 'solid' },
            targetClass: target,
            metadata: {
                createdAt: new Date(),
                author: config.author || 'system',
                tags: config.tags || [],
                difficulty: config.difficulty || 'basic'
            }
        };

        this.presets.set(presetInfo.id, presetInfo);
        this.categories.get(category).presets.push(presetInfo);
        
        // 按order排序
        this.categories.get(category).presets.sort((a, b) => {
            const orderA = a.params.order || 999;
            const orderB = b.params.order || 999;
            return orderA - orderB;
        });

        return this;
    }

    generateId() {
        return 'preset_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取所有分类
     * @returns {Array} 分类数组
     */
    getCategories() {
        return Array.from(this.categories.values())
            .sort((a, b) => a.order - b.order);
    }

    /**
     * 获取分类下的所有预设
     * @param {string} categoryName - 分类名称
     * @returns {Array} 预设数组
     */
    getPresetsByCategory(categoryName) {
        const category = this.categories.get(categoryName);
        return category ? category.presets : [];
    }

    /**
     * 通过ID获取预设
     * @param {string} id - 预设ID
     * @returns {Object|null} 预设信息
     */
    getPreset(id) {
        return this.presets.get(id);
    }

    /**
     * 搜索预设
     * @param {string} keyword - 关键词
     * @returns {Array} 搜索结果
     */
    searchPresets(keyword) {
        const results = [];
        const lowerKeyword = keyword.toLowerCase();
        
        for (const preset of this.presets.values()) {
            if (preset.name.toLowerCase().includes(lowerKeyword) || 
                preset.description.toLowerCase().includes(lowerKeyword) ||
                preset.metadata.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))) {
                results.push(preset);
            }
        }
        return results;
    }
}

// 全局注册表实例
export const presetRegistry = new PresetRegistry();

/**
 * 分类装饰器 - 类似于 [Category("名称")]
 * @param {string} name - 分类名称
 * @param {Object} options - 配置选项 { order, icon }
 * @returns {Function} 装饰器函数
 */
export function PresetCategory(name, options = {}) {
    return function(target) {
        presetRegistry.registerCategory(target, name, options);
        return target;
    };
}

/**
 * 预设项装饰器 - 类似于 [PresetItem(...)]
 * @param {Object} config - 预设配置
 * @returns {Function} 装饰器函数
 */
export function PresetItem(config) {
    return function(target) {
        presetRegistry.registerPreset(target, config);
        
        // 为类添加预设相关方法
        target.prototype.getPresetId = function() {
            return config.id;
        };
        
        target.prototype.getFormula = function() {
            return config.formula;
        };
        
        target.prototype.getParams = function() {
            return { ...config.params, ...this._instanceParams };
        };
        
        // 注入 getPresetInfo 方法
        target.prototype.getPresetInfo = function() {
            return presetRegistry.getPreset(config.id);
        };
        
        return target;
    };
}

/**
 * 参数定义装饰器 - 定义可配置参数
 * @param {string} name - 参数名
 * @param {Object} config - 参数配置
 * @returns {Function} 装饰器函数
 */
export function Param(name, config = {}) {
    return function(target, propertyKey) {
        if (!target._paramDefinitions) {
            target._paramDefinitions = {};
        }
        
        target._paramDefinitions[name] = {
            name: name,
            propertyKey: propertyKey,
            type: config.type || 'number',
            default: config.default,
            min: config.min,
            max: config.max,
            step: config.step || 0.1,
            label: config.label || name,
            description: config.description || ''
        };
    };
}

export default presetRegistry;
