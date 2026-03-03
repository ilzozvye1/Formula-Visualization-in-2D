const fs = require('fs');
const path = require('path');

// 创建 SVG 图标内容 - 数学曲线主题
function createSVGIcon(size) {
  const padding = size * 0.1;
  const chartSize = size - (padding * 2);
  const center = size / 2;
  
  // 生成抛物线路径点
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 - 1; // -1 to 1
    const x = center + t * (chartSize / 2);
    const y = center - (t * t) * (chartSize / 3) + (chartSize / 6);
    points.push(`${x},${y}`);
  }
  
  const pathData = `M ${points.join(' L ')}`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="lineGrad${size}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${size}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="url(#bgGrad${size})" filter="url(#shadow${size})"/>
  
  <!-- 坐标轴 -->
  <line x1="${padding}" y1="${center}" x2="${size - padding}" y2="${center}" stroke="rgba(255,255,255,0.4)" stroke-width="${size * 0.015}" stroke-linecap="round"/>
  <line x1="${center}" y1="${padding}" x2="${center}" y2="${size - padding}" stroke="rgba(255,255,255,0.4)" stroke-width="${size * 0.015}" stroke-linecap="round"/>
  
  <!-- 抛物线 -->
  <path d="${pathData}" fill="none" stroke="url(#lineGrad${size})" stroke-width="${size * 0.04}" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- 数据点 -->
  <circle cx="${center}" cy="${center + chartSize/6}" r="${size * 0.04}" fill="#fff"/>
</svg>`;
}

// 确保 assets 目录存在
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 生成不同尺寸的 PNG 图标
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

console.log('正在生成图标...');

// 保存 SVG 文件（可以作为源文件）
const svg1024 = createSVGIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svg1024);
console.log('✓ 生成 icon.svg');

// 由于 Node.js 没有内置的 canvas 支持，我们使用一种替代方法
// 创建一个 HTML 文件，可以在浏览器中打开来生成图标
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>图标生成器</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    canvas { border: 1px solid #ccc; margin: 10px; }
    .icon-row { display: flex; flex-wrap: wrap; align-items: center; }
    .icon-item { margin: 10px; text-align: center; }
  </style>
</head>
<body>
  <h1>2D公式可视化 - 图标生成器</h1>
  <p>请使用浏览器的"另存为"功能保存每个图标</p>
  <div id="icons"></div>
  <script>
    const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
    const container = document.getElementById('icons');
    
    sizes.forEach(size => {
      const div = document.createElement('div');
      div.className = 'icon-item';
      
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.id = 'canvas-' + size;
      
      const ctx = canvas.getContext('2d');
      
      // 绘制背景渐变
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#667eea');
      bgGrad.addColorStop(1, '#764ba2');
      
      // 圆角矩形
      const radius = size * 0.2;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      
      ctx.fillStyle = bgGrad;
      ctx.fill();
      
      // 阴影效果
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = size * 0.03;
      ctx.shadowOffsetY = size * 0.02;
      
      // 坐标轴
      const padding = size * 0.1;
      const center = size / 2;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = size * 0.015;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(padding, center);
      ctx.lineTo(size - padding, center);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center, padding);
      ctx.lineTo(center, size - padding);
      ctx.stroke();
      
      // 抛物线
      const lineGrad = ctx.createLinearGradient(0, 0, size, 0);
      lineGrad.addColorStop(0, '#f093fb');
      lineGrad.addColorStop(1, '#f5576c');
      
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = size * 0.04;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = size * 0.02;
      
      ctx.beginPath();
      const chartSize = size - (padding * 2);
      for (let i = 0; i <= 20; i++) {
        const t = (i / 20) * 2 - 1;
        const x = center + t * (chartSize / 2);
        const y = center - (t * t) * (chartSize / 3) + (chartSize / 6);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // 数据点
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = size * 0.03;
      ctx.beginPath();
      ctx.arc(center, center + chartSize/6, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      
      const label = document.createElement('div');
      label.textContent = size + 'x' + size;
      
      div.appendChild(canvas);
      div.appendChild(label);
      container.appendChild(div);
    });
    
    // 添加下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '下载所有图标 (PNG)';
    downloadBtn.style.cssText = 'padding: 10px 20px; font-size: 16px; margin: 20px 0; cursor: pointer;';
    downloadBtn.onclick = () => {
      sizes.forEach(size => {
        const canvas = document.getElementById('canvas-' + size);
        const link = document.createElement('a');
        link.download = 'icon-' + size + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    };
    container.insertBefore(downloadBtn, container.firstChild);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(assetsDir, 'generate-icons.html'), htmlContent);
console.log('✓ 生成 generate-icons.html');

console.log('\n说明:');
console.log('1. 由于 Node.js 环境没有图形库，我创建了一个 HTML 文件用于生成图标');
console.log('2. 请在浏览器中打开: assets/generate-icons.html');
console.log('3. 点击"下载所有图标"按钮获取各种尺寸的 PNG 图标');
console.log('4. 使用图标转换工具（如 icoconverter.com）将 256x256 PNG 转换为 icon.ico');
console.log('5. 使用图标转换工具将 512x512 PNG 转换为 icon.icns (macOS)');
console.log('6. 将 256x256 PNG 重命名为 icon.png (Linux)');
