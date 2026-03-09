/**
 * PDF 导出模块
 * 使用 jsPDF 库生成真正的 PDF 文件
 * @module modules/pdfExporter
 */

/**
 * PDF 导出器类
 */
export class PDFExporter {
    constructor() {
        this.pageSize = 'a4'; // A4 纸张大小
        this.orientation = 'p'; // 纵向
        this.margin = 20; // 毫米
    }

    /**
     * 导出为 PDF
     * @param {HTMLCanvasElement} canvas - 画布元素
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async export(canvas, options = {}) {
        const {
            title = '公式可视化',
            equations = [],
            includeLegend = true,
            includeEquations = true,
            filename = `formula_visualization_${Date.now()}.pdf`
        } = options;

        try {
            // 动态导入 jsPDF
            const { jsPDF } = await this.loadJsPDF();
            
            // 创建 PDF 文档（A4 纵向）
            const doc = new jsPDF({
                orientation: this.orientation,
                unit: 'mm',
                format: this.pageSize
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - 2 * this.margin;
            
            // 添加标题
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(title, pageWidth / 2, this.margin + 10, { align: 'center' });
            
            // 添加日期
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const dateStr = `生成日期：${new Date().toLocaleDateString('zh-CN')}`;
            doc.text(dateStr, pageWidth / 2, this.margin + 18, { align: 'center' });
            
            // 添加画布图像
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // 计算图像尺寸（保持纵横比）
            const canvasAspect = canvas.width / canvas.height;
            const maxImgHeight = pageHeight - this.margin * 2 - 30; // 留出标题和图例空间
            const imgHeight = Math.min(contentWidth / canvasAspect, maxImgHeight);
            const imgWidth = imgHeight * canvasAspect;
            
            // 添加图像到 PDF
            doc.addImage(
                imgData,
                'PNG',
                (pageWidth - imgWidth) / 2,
                this.margin + 25,
                imgWidth,
                imgHeight
            );
            
            // 添加图例
            if (includeLegend && equations.length > 0) {
                const legendY = this.margin + 25 + imgHeight + 10;
                this.addLegend(doc, equations, legendY, pageWidth);
            }
            
            // 添加方程列表
            if (includeEquations && equations.length > 0) {
                const eqY = includeLegend 
                    ? this.margin + 25 + imgHeight + 40
                    : this.margin + 25 + imgHeight + 10;
                this.addEquationsList(doc, equations, eqY, pageWidth);
            }
            
            // 保存 PDF
            doc.save(filename);
            
            console.log('PDF 导出成功');
        } catch (error) {
            console.error('PDF 导出失败:', error);
            throw new Error('PDF 导出失败：' + error.message);
        }
    }

    /**
     * 加载 jsPDF 库
     * @returns {Promise<Object>} jsPDF 模块
     */
    async loadJsPDF() {
        // 尝试从 CDN 加载 jsPDF
        try {
            // 检查是否已经加载
            if (window.jspdf && window.jspdf.jsPDF) {
                return window.jspdf;
            }
            
            // 动态加载脚本
            return await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        resolve(window.jspdf);
                    } else {
                        reject(new Error('jsPDF 加载失败'));
                    }
                };
                script.onerror = () => reject(new Error('无法加载 jsPDF 库'));
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('无法加载 jsPDF，使用备用方案:', error);
            throw new Error('需要网络连接来加载 jsPDF 库');
        }
    }

    /**
     * 添加图例到 PDF
     * @param {jsPDF} doc - PDF 文档
     * @param {Array} equations - 方程列表
     * @param {number} y - Y 坐标
     * @param {number} pageWidth - 页面宽度
     */
    addLegend(doc, equations, y, pageWidth) {
        const visibleEquations = equations.filter(eq => eq.visible);
        if (visibleEquations.length === 0) return;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('图例', this.margin, y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        let currentY = y + 8;
        const lineHeight = 6;
        const colorBoxSize = 3;
        
        visibleEquations.forEach(eq => {
            if (currentY > 270) { // 检查是否需要新页面
                doc.addPage();
                currentY = this.margin;
            }
            
            // 绘制颜色框
            doc.setFillColor(eq.color);
            doc.rect(this.margin, currentY - 2, colorBoxSize, colorBoxSize, 'F');
            
            // 添加方程文本
            const equationText = this.formatEquationText(eq.formula);
            doc.text(equationText, this.margin + colorBoxSize + 2, currentY);
            
            currentY += lineHeight;
        });
    }

    /**
     * 添加方程列表到 PDF
     * @param {jsPDF} doc - PDF 文档
     * @param {Array} equations - 方程列表
     * @param {number} y - Y 坐标
     * @param {number} pageWidth - 页面宽度
     */
    addEquationsList(doc, equations, y, pageWidth) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('方程列表', this.margin, y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        let currentY = y + 8;
        const lineHeight = 6;
        
        equations.forEach((eq, index) => {
            if (currentY > 270) { // 检查是否需要新页面
                doc.addPage();
                currentY = this.margin;
            }
            
            const equationText = `${index + 1}. ${this.formatEquationText(eq.formula)}`;
            doc.text(equationText, this.margin, currentY);
            
            currentY += lineHeight;
        });
    }

    /**
     * 格式化方程文本（移除特殊字符）
     * @param {string} formula - 方程公式
     * @returns {string} 格式化后的文本
     */
    formatEquationText(formula) {
        if (!formula) return '';
        
        // 替换特殊字符为 ASCII 等效字符
        return formula
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/√/g, 'sqrt')
            .replace(/∫/g, 'int')
            .replace(/π/g, 'pi')
            .replace(/·/g, '*')
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/≤/g, '<=')
            .replace(/≥/g, '>=')
            .replace(/≠/g, '!=')
            .replace(/±/g, '+/-')
            .substring(0, 80); // 限制长度
    }
}

// 创建单例实例
const pdfExporter = new PDFExporter();

/**
 * 导出为 PDF 的辅助函数
 * @param {HTMLCanvasElement} canvas - 画布元素
 * @param {Object} appState - 应用状态对象
 */
export function exportToPDF(canvas, appState) {
    // 使用当前的应用状态
    const state = appState || window.appState;
    if (!state) {
        console.error('应用状态未找到');
        return;
    }
    
    const options = {
        title: '公式可视化',
        equations: state.equations,
        includeLegend: true,
        includeEquations: true,
        filename: `formula_visualization_${Date.now()}.pdf`
    };
    
    pdfExporter.export(canvas, options).catch(error => {
        console.error('PDF 导出失败:', error);
        alert('PDF 导出失败：' + error.message);
    });
}

export default pdfExporter;
export { PDFExporter };
