/**
 * 预设公式基类
 * 所有预设公式都继承此类
 * @module modules/FormulaPreset
 */

import { parseFormula } from './equationParser.js';

/**
 * 预设公式基类
 */
export class FormulaPreset {
    constructor(instanceParams = {}) {
        this._instanceParams = instanceParams;
        this._cachedFormula = null;
    }

    /**
     * 计算函数值 - 子类必须实现
     * @abstract
     * @param {number} x - x值
     * @returns {number} y值
     */
    calculate(x) {
        throw new Error('子类必须实现 calculate 方法');
    }

    /**
     * 获取参数定义
     * @returns {Object} 参数定义对象
     */
    getParamDefinitions() {
        return this.constructor._paramDefinitions || {};
    }

    /**
     * 设置参数值
     * @param {string} name - 参数名
     * @param {*} value - 参数值
     */
    setParam(name, value) {
        this._instanceParams[name] = value;
        this._cachedFormula = null; // 清除缓存
    }

    /**
     * 获取参数值
     * @param {string} name - 参数名
     * @returns {*} 参数值
     */
    getParam(name) {
        // 优先使用实例参数
        if (this._instanceParams && name in this._instanceParams) {
            return this._instanceParams[name];
        }
        
        // 从预设信息中获取默认参数
        const presetInfo = this.getPresetInfo();
        if (presetInfo && presetInfo.params && name in presetInfo.params) {
            return presetInfo.params[name];
        }
        
        // 从参数定义中获取
        const definitions = this.getParamDefinitions();
        const def = definitions[name];
        return def ? def.default : undefined;
    }

    /**
     * 获取所有参数值
     * @returns {Object} 参数值对象
     */
    getAllParams() {
        const params = {};
        
        // 首先从预设信息中获取所有默认参数
        const presetInfo = this.getPresetInfo();
        if (presetInfo && presetInfo.params) {
            Object.assign(params, presetInfo.params);
        }
        
        // 然后用实例参数覆盖
        if (this._instanceParams) {
            Object.assign(params, this._instanceParams);
        }
        
        return params;
    }

    /**
     * 生成实际公式字符串
     * @returns {string} 公式字符串
     */
    generateFormula() {
        if (this._cachedFormula) return this._cachedFormula;
        
        const presetInfo = this.getPresetInfo();
        if (!presetInfo) {
            throw new Error('无法获取预设信息');
        }
        
        let formula = presetInfo.formula;
        
        // 替换参数占位符
        const params = this.getAllParams();
        for (const [key, value] of Object.entries(params)) {
            // 使用正则替换 {paramName} 格式的占位符
            const placeholder = new RegExp(`\\{${key}\\}`, 'g');
            formula = formula.replace(placeholder, value);
        }
        
        // 简化公式格式以匹配解析器
        formula = this.simplifyFormula(formula);
        
        this._cachedFormula = formula;
        return formula;
    }

    /**
     * 简化公式格式
     * @param {string} formula - 原始公式
     * @returns {string} 简化后的公式
     */
    simplifyFormula(formula) {
        // 移除 y= 前缀（解析器会处理）
        if (formula.startsWith('y=')) {
            formula = formula.substring(2);
        }
        
        // 多轮简化，直到没有变化
        let prev = '';
        while (prev !== formula) {
            prev = formula;
            
            // 简化 0*函数(...) 形式 - 需要匹配整个函数调用
            formula = formula.replace(/(^|[\+\-])0\*?(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|log10|exp|sqrt|abs|floor|ceil|round|arcsin|arccos|arctan)\([^)]*\)/g, '$1');
            
            // 简化 0*x 或 0x 形式（整个项消失）
            formula = formula.replace(/(^|[\+\-])0\*?x(\^[\d\.]+)?/g, '$1');
            formula = formula.replace(/(^|[\+\-])0\*?x/g, '$1');
            
            // 简化 1* 为空（在开头、+、-、*、( 后面）
            formula = formula.replace(/(^|[\+\-\*\(])1\*/g, '$1');
            
            // 简化 1x 为 x（在开头、+、- 后面）
            formula = formula.replace(/(^|[\+\-])1x/g, '$1x');
            
            // 简化 1sin, 1cos 等为 sin, cos（在开头、+、- 后面）
            formula = formula.replace(/(^|[\+\-])1(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|exp|sqrt|abs|floor|ceil|round|arcsin|arccos|arctan)/g, '$1$2');
            
            // 简化 *1 为空（后面不是字母）
            formula = formula.replace(/\*1(?![a-z])/g, '');
            
            // 简化 +0 或 -0（后面不是小数点，也不是 x）
            formula = formula.replace(/[\+\-]0(?![\.\dx])/g, '');
            
            // 处理 +0) 或 -0)
            formula = formula.replace(/[\+\-]0\)/g, ')');
            
            // 简化 sin(1x) -> sin(x), cos(1x) -> cos(x) 等
            formula = formula.replace(/(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|log10|exp|sqrt|abs|floor|ceil|round)\(1x/g, '$1(x');
            
            // 处理连续的运算符
            formula = formula.replace(/\+\+/g, '+');
            formula = formula.replace(/\-\-/g, '+');
            formula = formula.replace(/\+\-/g, '-');
            formula = formula.replace(/\-\+/g, '-');
        }
        
        // 移除开头多余的 + 号
        if (formula.startsWith('+')) {
            formula = formula.substring(1);
        }
        
        // 如果公式为空或只剩下运算符，返回 0
        if (formula === '' || formula === '+' || formula === '-') {
            formula = '0';
        }
        
        return formula;
    }

    /**
     * 获取预设信息
     * @returns {Object|null} 预设信息
     */
    getPresetInfo() {
        // 从注册表中查找 - 使用动态导入避免循环依赖
        return null; // 将在子类中通过装饰器注入
    }

    /**
     * 创建方程对象
     * @returns {Object} 方程对象
     */
    toEquation() {
        const presetInfo = this.getPresetInfo();
        if (!presetInfo) {
            throw new Error('无法获取预设信息');
        }
        
        const formula = this.generateFormula();
        const parsed = this.parseFormula(formula);
        
        // 将预设参数合并到 parsed 对象中（用于渲染器的位移等参数）
        const params = this.getAllParams();
        
        // 注入所有参数到 parsed 对象
        for (const [key, value] of Object.entries(params)) {
            if (parsed[key] === undefined) {
                parsed[key] = value;
            }
        }
        
        return {
            formula: formula,
            parsed: parsed,
            color: presetInfo.defaultStyle.color,
            style: presetInfo.defaultStyle.lineStyle,
            visible: true
        };
    }

    /**
     * 解析公式
     * @param {string} formula - 公式字符串
     * @returns {Object} 解析结果
     */
    parseFormula(formula) {
        // 调用现有的解析器
        const parsed = parseFormula(formula);
        if (parsed) {
            return parsed;
        }
        
        // 如果解析失败，返回通用类型
        return { 
            type: 'generic', 
            expression: formula,
            original: formula
        };
    }

    /**
     * 克隆预设
     * @param {Object} params - 自定义参数
     * @returns {FormulaPreset} 新的预设实例
     */
    clone(params = {}) {
        const Clazz = this.constructor;
        return new Clazz({ ...this._instanceParams, ...params });
    }

    /**
     * 获取显示名称
     * @returns {string} 显示名称
     */
    getDisplayName() {
        const presetInfo = this.getPresetInfo();
        return presetInfo ? presetInfo.name : this.constructor.name;
    }

    /**
     * 获取描述
     * @returns {string} 描述
     */
    getDescription() {
        const presetInfo = this.getPresetInfo();
        return presetInfo ? presetInfo.description : '';
    }
}

export default FormulaPreset;
