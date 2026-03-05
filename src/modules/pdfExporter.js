/**
 * PDF导出模块
 * @module modules/pdfExporter
 */

/**
 * PDF导出器类
 */
export class PDFExporter {
    constructor() {
        this.pageSize = {
            width: 595.28,  // A4宽度（点）
            height: 841.89  // A4高度（点）
        };
        this.margin = 50;
    }

    /**
     * 导出为PDF
     * @param {HTMLCanvasElement} canvas - 画布元素
     * @param {Object} options - 导出选项
     * @returns {Promise<Blob>} PDF Blob
     */
    async export(canvas, options = {}) {
        const {
            title = '公式可视化',
            equations = [],
            includeLegend = true,
            includeEquations = true,
            date = new Date().toLocaleDateString()
        } = options;

        // 创建SVG内容
        const svgContent = this.createSVGContent(canvas, equations, {
            title,
            includeLegend,
            includeEquations,
            date
        });

        // 转换为PDF（使用简单的PDF生成）
        return this.generatePDF(svgContent, canvas);
    }

    /**
     * 创建SVG内容
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {Array} equations - 方程列表
     * @param {Object} options - 选项
     * @returns {string} SVG字符串
     */
    createSVGContent(canvas, equations, options) {
        const { title, includeLegend, includeEquations, date } = options;
        const { width, height } = this.pageSize;
        const contentWidth = width - 2 * this.margin;
        const contentHeight = height - 2 * this.margin;

        // 计算画布缩放比例
        const canvasAspect = canvas.width / canvas.height;
        const contentAspect = contentWidth / (contentHeight * 0.6);
        
        let drawWidth, drawHeight;
        if (canvasAspect > contentAspect) {
            drawWidth = contentWidth;
            drawHeight = drawWidth / canvasAspect;
        } else {
            drawHeight = contentHeight * 0.6;
            drawWidth = drawHeight * canvasAspect;
        }

        // 生成SVG
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
        <style>
            .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; }
            .subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: #666; }
            .equation { font-family: 'Times New Roman', serif; font-size: 14px; }
            .legend-item { font-family: Arial, sans-serif; font-size: 10px; }
        </style>
    </defs>
    
    <!-- 背景 -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- 标题 -->
    <text x="${width/2}" y="${this.margin}" class="title" text-anchor="middle">${this.escapeXML(title)}</text>
    <text x="${width/2}" y="${this.margin + 20}" class="subtitle" text-anchor="middle">生成日期: ${date}</text>
    
    <!-- 画布图像 -->
    <image x="${(width - drawWidth)/2}" y="${this.margin + 40}" 
           width="${drawWidth}" height="${drawHeight}"
           href="${canvas.toDataURL('image/png')}"/>
`;

        // 添加图例
        if (includeLegend && equations.length > 0) {
            svg += this.createLegendSVG(equations, width / 2, this.margin + 40 + drawHeight + 30);
        }

        // 添加方程列表
        if (includeEquations && equations.length > 0) {
            svg += this.createEquationsSVG(equations, this.margin, this.margin + 40 + drawHeight + 80);
        }

        svg += '</svg>';
        return svg;
    }

    /**
     * 创建图例SVG
     * @param {Array} equations - 方程列表
     * @param {number} x - X位置
     * @param {number} y - Y位置
     * @returns {string} SVG字符串
     */
    createLegendSVG(equations, x, y) {
        let svg = '<g>';
        const itemWidth = 150;
        const itemsPerRow = Math.floor((this.pageSize.width - 2 * this.margin) / itemWidth);
        
        equations.forEach((eq, index) => {
            if (!eq.visible) return;
            
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const itemX = x - (itemsPerRow * itemWidth) / 2 + col * itemWidth;
            const itemY = y + row * 25;
            
            svg += `
                <rect x="${itemX}" y="${itemY - 8}" width="15" height="3" fill="${eq.color}"/>
                <text x="${itemX + 20}" y="${itemY}" class="legend-item">${this.escapeXML(eq.formula || '方程')}</text>
            `;
        });
        
        svg += '</g>';
        return svg;
    }

    /**
     * 创建方程列表SVG
     * @param {Array} equations - 方程列表
     * @param {number} x - X位置
     * @param {number} y - Y位置
     * @returns {string} SVG字符串
     */
    createEquationsSVG(equations, x, y) {
        let svg = '<g>';
        
        svg += `<text x="${x}" y="${y}" class="subtitle" font-weight="bold">方程列表:</text>`;
        
        equations.forEach((eq, index) => {
            const itemY = y + 20 + index * 20;
            svg += `
                <text x="${x}" y="${itemY}" class="equation">
                    ${index + 1}. ${this.escapeXML(eq.formula || '未知方程')}
                </text>
            `;
        });
        
        svg += '</g>';
        return svg;
    }

    /**
     * 生成PDF
     * @param {string} svgContent - SVG内容
     * @param {HTMLCanvasElement} canvas - 画布
     * @returns {Promise<Blob>} PDF Blob
     */
    async generatePDF(svgContent, canvas) {
        // 使用简单的PDF生成方法
        // 在实际应用中，可以使用jsPDF或pdfmake等库
        
        // 这里我们创建一个包含SVG的HTML，然后使用浏览器打印功能
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>公式可视化导出</title>
    <style>
        @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; }
            .page { page-break-after: always; }
        }
        body { font-family: Arial, sans-serif; }
        .container { padding: 50px; }
    </style>
</head>
<body>
    <div class="container">
        ${svgContent}
    </div>
</body>
</html>`;

        // 创建Blob
        const blob = new Blob([html], { type: 'text/html' });
        return blob;
    }

    /**
     * 下载PDF
     * @param {Blob} blob - PDF Blob
     * @param {string} filename - 文件名
     */
    download(blob, filename = 'formula_visualization.pdf') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 打印PDF
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {Object} options - 选项
     */
    print(canvas, options = {}) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('请允许弹出窗口以进行打印');
            return;
        }

        const { title = '公式可视化', equations = [] } = options;
        const date = new Date().toLocaleDateString();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .date { font-size: 12px; color: #666; }
        .canvas-container { 
            text-align: center; 
            margin: 20px 0;
        }
        .canvas-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
        }
        .legend {
            margin: 20px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        .legend-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .legend-item {
            display: inline-block;
            margin: 5px 15px 5px 0;
        }
        .legend-color {
            display: inline-block;
            width: 20px;
            height: 3px;
            margin-right: 5px;
            vertical-align: middle;
        }
        .equations {
            margin-top: 20px;
        }
        .equations-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .equation-item {
            margin: 5px 0;
            font-family: 'Times New Roman', serif;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${this.escapeHTML(title)}</div>
        <div class="date">生成日期: ${date}</div>
    </div>
    
    <div class="canvas-container">
        <img src="${canvas.toDataURL('image/png')}" alt="公式可视化">
    </div>
    
    ${equations.length > 0 ? `
    <div class="legend">
        <div class="legend-title">图例</div>
        ${equations.filter(eq => eq.visible).map(eq => `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${eq.color}"></span>
                <span>${this.escapeHTML(eq.formula || '方程')}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="equations">
        <div class="equations-title">方程列表</div>
        ${equations.map((eq, index) => `
            <div class="equation-item">${index + 1}. ${this.escapeHTML(eq.formula || '未知方程')}</div>
        `).join('')}
    </div>
    ` : ''}
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    /**
     * 转义XML特殊字符
     * @param {string} str - 输入字符串
     * @returns {string} 转义后的字符串
     */
    escapeXML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * 转义HTML特殊字符
     * @param {string} str - 输入字符串
     * @returns {string} 转义后的字符串
     */
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// 创建单例实例
const pdfExporter = new PDFExporter();

export default pdfExporter;
export { PDFExporter };
