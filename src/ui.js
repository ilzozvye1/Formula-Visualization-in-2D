// UI交互相关函数
import * as globals from './globals.js';
import { drawCoordinateSystem } from './drawing.js';
import { drawAllEquations } from './equations.js';
import { saveHistory } from './history.js';

// 更新方程列表
export function updateEquationsList() {
    const container = document.getElementById('equations-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    globals.equations.forEach((equation, index) => {
        const div = document.createElement('div');
        div.className = `equation-item ${index === globals.selectedEquationIndex ? 'selected' : ''}`;
        
        div.innerHTML = `
            <input type="checkbox" id="eq-visible-${index}" ${equation.visible ? 'checked' : ''} 
                   onchange="toggleEquationVisibility(${index})">
            <span class="equation-color" style="background-color: ${equation.color}"></span>
            <span class="equation-text">${equation.formula}</span>
            <button onclick="selectEquation(${index})" ${index === globals.selectedEquationIndex ? 'disabled' : ''}>选择</button>
            <button onclick="removeEquation(${index})">删除</button>
        `;
        
        container.appendChild(div);
    });
}

// 显示所有方程
export function showAllEquations() {
    saveHistory();
    globals.equations.forEach(eq => {
        eq.visible = true;
    });
    drawCoordinateSystem();
    updateEquationsList();
}

// 隐藏所有方程
export function hideAllEquations() {
    saveHistory();
    globals.equations.forEach(eq => {
        eq.visible = false;
    });
    drawCoordinateSystem();
    updateEquationsList();
}

// 清空所有方程
export function clearAllEquations() {
    if (confirm('确定要清空所有方程吗？')) {
        saveHistory();
        globals.equations = [];
        globals.selectedEquationIndex = -1;
        drawCoordinateSystem();
        updateEquationsList();
    }
}

// 选择方程
export function selectEquation(index) {
    globals.selectedEquationIndex = index;
    updateEquationsList();
    drawCoordinateSystem();
}

// 移除方程
export function removeEquation(index) {
    saveHistory();
    globals.equations.splice(index, 1);
    if (globals.selectedEquationIndex === index) {
        globals.selectedEquationIndex = -1;
    } else if (globals.selectedEquationIndex > index) {
        globals.selectedEquationIndex--;
    }
    drawCoordinateSystem();
    updateEquationsList();
}

// 切换方程可见性
export function toggleEquationVisibility(index) {
    saveHistory();
    globals.equations[index].visible = !globals.equations[index].visible;
    drawCoordinateSystem();
}

// 显示/隐藏设置菜单
export function toggleSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// 切换网格显示
export function toggleGrid() {
    globals.showGrid = document.getElementById('show-grid').checked;
    drawCoordinateSystem();
}

// 切换深色模式
export function toggleDarkMode() {
    globals.darkMode = document.getElementById('dark-mode').checked;
    document.body.classList.toggle('dark-mode', globals.darkMode);
    drawCoordinateSystem();
}

// 切换交点显示
export function toggleIntersections() {
    globals.showIntersections = document.getElementById('show-intersections').checked;
    drawCoordinateSystem();
}

// 更新交点颜色
export function updateIntersectionColor() {
    globals.intersectionColor = document.getElementById('intersection-color').value;
    drawCoordinateSystem();
}

// 更新坐标轴范围
export function updateAxisRange() {
    const xMin = parseFloat(document.getElementById('x-min').value);
    const xMax = parseFloat(document.getElementById('x-max').value);
    const yMin = parseFloat(document.getElementById('y-min').value);
    const yMax = parseFloat(document.getElementById('y-max').value);
    
    if (!isNaN(xMin) && !isNaN(xMax) && xMin < xMax) {
        globals.xMin = xMin;
        globals.xMax = xMax;
    }
    
    if (!isNaN(yMin) && !isNaN(yMax) && yMin < yMax) {
        globals.yMin = yMin;
        globals.yMax = yMax;
    }
    
    drawCoordinateSystem();
}

// 添加方程到列表
export function addFormula() {
    const formula = document.getElementById('formula').value.trim();
    const color = document.getElementById('line-color').value;
    const style = document.getElementById('line-style').value;
    
    if (!formula) {
        alert('请输入方程');
        return;
    }
    
    // 导入公式解析函数
    import('./modules/equationParser.js').then(({ parseFormula }) => {
        // 使用真正的公式解析功能
        const parsed = parseFormula(formula) || {
            type: 'generic',
            expression: formula
        };
        
        const equation = {
            formula: formula,
            parsed: parsed,
            color: color,
            style: style,
            visible: true
        };
        
        saveHistory();
        globals.equations.push(equation);
        drawCoordinateSystem();
        updateEquationsList();
        
        // 清空输入框
        document.getElementById('formula').value = '';
    }).catch(error => {
        console.error('公式解析失败:', error);
        alert('公式解析失败，请检查输入格式');
    });
}

// 选择预设公式
export function selectPresetFormula(formula) {
    document.getElementById('formula').value = formula;
    // 关闭预设菜单
    document.getElementById('preset-menu').classList.add('hidden');
}

// 切换预设菜单
export function togglePresetMenu() {
    const menu = document.getElementById('preset-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// 初始化预设菜单事件
export function initPresetMenu() {
    // 为预设菜单按钮添加点击事件
    const presetBtn = document.querySelector('.preset-dropdown-btn');
    if (presetBtn) {
        presetBtn.addEventListener('click', () => {
            togglePresetMenu();
        });
    }
    
    // 为所有预设分类标题添加点击事件
    const categoryHeaders = document.querySelectorAll('.preset-category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const category = header.closest('.preset-category');
            const submenu = category.querySelector('.preset-submenu');
            const arrow = category.querySelector('.preset-arrow');
            
            if (submenu) {
                submenu.classList.toggle('hidden');
                arrow.textContent = submenu.classList.contains('hidden') ? '▶' : '▼';
            }
        });
    });
    
    // 为所有预设项添加点击事件
    const presetItems = document.querySelectorAll('.preset-item');
    presetItems.forEach(item => {
        item.addEventListener('click', () => {
            const formula = item.getAttribute('data-formula');
            if (formula) {
                selectPresetFormula(formula);
            }
        });
    });
}

// 切换3D模式
export function switchTo3D() {
    globals.is3DMode = true;
    document.getElementById('btn-3d').classList.add('active');
    document.getElementById('btn-2d').classList.remove('active');
    document.getElementById('view-controls-canvas').style.display = 'flex';
    document.getElementById('fog-control').style.display = 'block';
    document.getElementById('auto-rotate-speed-control').style.display = 'block';
    drawCoordinateSystem();
}

// 切换2D模式
export function switchTo2D() {
    globals.is3DMode = false;
    document.getElementById('btn-2d').classList.add('active');
    document.getElementById('btn-3d').classList.remove('active');
    document.getElementById('view-controls-canvas').style.display = 'none';
    document.getElementById('fog-control').style.display = 'none';
    document.getElementById('auto-rotate-speed-control').style.display = 'none';
    drawCoordinateSystem();
}

// 切换帮助面板
export function toggleHelp() {
    const panel = document.getElementById('help-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

// 更新自动旋转速度
export function updateAutoRotateSpeed(speed) {
    globals.autoRotateSpeed = speed / 100;
}

// 切换深度雾化
export function toggleFog() {
    globals.fogEnabled = document.getElementById('fog-toggle').checked;
    drawCoordinateSystem();
}

// 更新图例
export function updateLegend() {
    const legend = document.getElementById('legend-display');
    if (!legend) return;
    
    const visibleEquations = globals.equations.filter(eq => eq.visible);
    if (visibleEquations.length === 0) {
        legend.style.display = 'none';
        return;
    }
    
    legend.innerHTML = '';
    visibleEquations.forEach((eq, index) => {
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
            <span class="legend-color" style="background-color: ${eq.color}"></span>
            <span class="legend-text">${eq.formula}</span>
        `;
        legend.appendChild(div);
    });
    
    legend.style.display = 'block';
}

// 重置视图
export function resetView() {
    saveHistory();
    globals.scale = 20;
    globals.offsetX = globals.canvas.width / 2;
    globals.offsetY = globals.canvas.height / 2;
    globals.rotationX = 0.5;
    globals.rotationY = 0.5;
    globals.rotationZ = 0;
    drawCoordinateSystem();
}

// 重置正视图
export function resetViewFront() {
    saveHistory();
    globals.rotationX = 0;
    globals.rotationY = 0;
    globals.rotationZ = 0;
    drawCoordinateSystem();
}

// 重置俯视图
export function resetViewTop() {
    saveHistory();
    globals.rotationX = Math.PI / 2;
    globals.rotationY = 0;
    globals.rotationZ = 0;
    drawCoordinateSystem();
}

// 重置侧视图
export function resetViewSide() {
    saveHistory();
    globals.rotationX = 0;
    globals.rotationY = Math.PI / 2;
    globals.rotationZ = 0;
    drawCoordinateSystem();
}



// 更新方程位置
export function updateEquationPosition(index, dx, dy) {
    // 这里应该更新方程的位置参数，但暂时简化处理
    console.log('更新方程位置:', index, dx, dy);
}

// 切换自动旋转
export function toggleAutoRotate() {
    globals.isAutoRotating = !globals.isAutoRotating;
    const btn = document.getElementById('btn-autorotate');
    if (btn) {
        btn.classList.toggle('active', globals.isAutoRotating);
    }
    
    if (globals.isAutoRotating) {
        startAutoRotate();
    } else {
        stopAutoRotate();
    }
}

// 开始自动旋转
function startAutoRotate() {
    if (globals.autoRotateAnimationId) return;
    
    function animate() {
        if (!globals.isAutoRotating) {
            stopAutoRotate();
            return;
        }
        
        globals.rotationY += globals.autoRotateSpeed;
        drawCoordinateSystem();
        globals.autoRotateAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 停止自动旋转
export function stopAutoRotate() {
    if (globals.autoRotateAnimationId) {
        cancelAnimationFrame(globals.autoRotateAnimationId);
        globals.autoRotateAnimationId = null;
    }
}

// 导入3D数据
export function import3DData() {
    // 这里应该实现3D数据导入功能，但暂时简化处理
    console.log('导入3D数据');
}

// 导出3D数据
export function export3DData() {
    // 这里应该实现3D数据导出功能，但暂时简化处理
    console.log('导出3D数据');
}

// 导出图像
export function exportImage() {
    if (!globals.canvas) {
        console.error('Canvas not found');
        return;
    }
    
    try {
        // 导出为PNG图像
        const dataURL = globals.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `formula_visualization_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        // 显示成功提示
        alert('图像导出成功！');
    } catch (error) {
        console.error('导出图像失败:', error);
        alert('导出图像失败，请重试！');
    }
}

// 导出为PDF
export function exportPDF() {
    if (!globals.canvas) {
        console.error('Canvas not found');
        return;
    }
    
    try {
        // 使用html2canvas和jspdf库生成PDF
        // 首先检查是否加载了必要的库
        if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
            // 动态加载库
            loadPDFLibraries().then(() => {
                generatePDF();
            }).catch(error => {
                console.error('加载PDF库失败:', error);
                alert('导出PDF失败，请重试！');
            });
        } else {
            generatePDF();
        }
    } catch (error) {
        console.error('导出PDF失败:', error);
        alert('导出PDF失败，请重试！');
    }
}

// 加载PDF生成所需的库
function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
        const scripts = [
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
                id: 'html2canvas-script'
            },
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
                id: 'jspdf-script'
            }
        ];
        
        let loadedScripts = 0;
        
        scripts.forEach(script => {
            // 检查脚本是否已加载
            if (!document.getElementById(script.id)) {
                const s = document.createElement('script');
                s.src = script.src;
                s.id = script.id;
                s.onload = () => {
                    loadedScripts++;
                    if (loadedScripts === scripts.length) {
                        resolve();
                    }
                };
                s.onerror = reject;
                document.head.appendChild(s);
            } else {
                loadedScripts++;
                if (loadedScripts === scripts.length) {
                    resolve();
                }
            }
        });
    });
}

// 生成PDF
function generatePDF() {
    // 使用html2canvas捕获canvas内容
    html2canvas(globals.canvas).then(canvas => {
        // 创建PDF文档
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // 将canvas转换为图像并添加到PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 297; // A4宽度（mm）
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // 保存PDF
        pdf.save(`formula_visualization_${Date.now()}.pdf`);
        
        // 显示成功提示
        alert('PDF导出成功！');
    }).catch(error => {
        console.error('生成PDF失败:', error);
        alert('生成PDF失败，请重试！');
    });
}
