const fs = require('fs');
const path = require('path');

// ICO 文件格式写入器
class ICOWriter {
  constructor() {
    this.images = [];
  }

  addImage(width, height, pngBuffer) {
    this.images.push({ width, height, buffer: pngBuffer });
  }

  write(filename) {
    const numImages = this.images.length;
    const headerSize = 6;
    const entrySize = 16;
    const headerOffset = headerSize + (numImages * entrySize);
    
    let offset = headerOffset;
    const entries = [];
    const imageData = [];

    for (const img of this.images) {
      entries.push({
        width: img.width >= 256 ? 0 : img.width,
        height: img.height >= 256 ? 0 : img.height,
        colors: 0,
        reserved: 0,
        planes: 1,
        bpp: 32,
        size: img.buffer.length,
        offset: offset
      });
      imageData.push(img.buffer);
      offset += img.buffer.length;
    }

    const buffer = Buffer.alloc(offset);
    
    // 写入 ICO 头部
    buffer.writeUInt16LE(0, 0); // 保留
    buffer.writeUInt16LE(1, 2); // ICO 类型
    buffer.writeUInt16LE(numImages, 4); // 图像数量

    // 写入目录条目
    let entryOffset = headerSize;
    for (const entry of entries) {
      buffer.writeUInt8(entry.width, entryOffset);
      buffer.writeUInt8(entry.height, entryOffset + 1);
      buffer.writeUInt8(entry.colors, entryOffset + 2);
      buffer.writeUInt8(entry.reserved, entryOffset + 3);
      buffer.writeUInt16LE(entry.planes, entryOffset + 4);
      buffer.writeUInt16LE(entry.bpp, entryOffset + 6);
      buffer.writeUInt32LE(entry.size, entryOffset + 8);
      buffer.writeUInt32LE(entry.offset, entryOffset + 12);
      entryOffset += entrySize;
    }

    // 写入图像数据
    let dataOffset = headerOffset;
    for (const data of imageData) {
      data.copy(buffer, dataOffset);
      dataOffset += data.length;
    }

    fs.writeFileSync(filename, buffer);
  }
}

// 简单的 PNG 编码器（无压缩，仅用于小图标）
function createSimplePNG(width, height, pixels) {
  const chunks = [];
  
  // PNG 签名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR 块
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type: RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  chunks.push(createChunk('IHDR', ihdr));
  
  // IDAT 块（图像数据）
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];     // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }
  
  const compressed = require('zlib').deflateSync(rawData);
  chunks.push(createChunk('IDAT', compressed));
  
  // IEND 块
  chunks.push(createChunk('IEND', Buffer.alloc(0)));
  
  return Buffer.concat([signature, ...chunks]);
}

function createChunk(type, data) {
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4);
  data.copy(chunk, 8);
  const crc = require('zlib').crc32(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc >>> 0, 8 + data.length);
  return chunk;
}

// 绘制图标
function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const padding = size * 0.1;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // 圆角矩形背景
      const dx = Math.abs(x - center);
      const dy = Math.abs(y - center);
      const cornerRadius = size * 0.2;
      
      let inRect = false;
      if (dx <= center - cornerRadius && dy <= center) {
        inRect = true;
      } else if (dy <= center - cornerRadius && dx <= center) {
        inRect = true;
      } else {
        const cx = dx - (center - cornerRadius);
        const cy = dy - (center - cornerRadius);
        if (cx * cx + cy * cy <= cornerRadius * cornerRadius) {
          inRect = true;
        }
      }
      
      if (!inRect) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }
      
      // 渐变背景
      const t = (x / size + y / size) / 2;
      const r = Math.floor(102 + (118 - 102) * t);
      const g = Math.floor(126 + (75 - 126) * t);
      const b = Math.floor(234 + (162 - 234) * t);
      
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
      
      // 坐标轴
      const axisWidth = Math.max(1, size * 0.015);
      const xAxis = Math.abs(y - center) < axisWidth && x >= padding && x <= size - padding;
      const yAxis = Math.abs(x - center) < axisWidth && y >= padding && y <= size - padding;
      
      if (xAxis || yAxis) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 100;
      }
      
      // 抛物线 y = x^2
      const chartSize = size - padding * 2;
      const px = (x - center) / (chartSize / 2);
      const py = (y - center - chartSize/6) / (-chartSize / 3);
      
      if (px >= -1 && px <= 1) {
        const expectedY = px * px;
        const lineWidth = Math.max(1, size * 0.04);
        if (Math.abs(py - expectedY) < lineWidth / (chartSize / 3)) {
          // 渐变线条颜色
          const lineT = (px + 1) / 2;
          pixels[idx] = Math.floor(240 + (245 - 240) * lineT);
          pixels[idx + 1] = Math.floor(147 + (87 - 147) * lineT);
          pixels[idx + 2] = Math.floor(251 + (108 - 251) * lineT);
          pixels[idx + 3] = 255;
        }
      }
      
      // 顶点
      const vertexX = center;
      const vertexY = center + chartSize/6;
      const dist = Math.sqrt((x - vertexX) ** 2 + (y - vertexY) ** 2);
      if (dist < size * 0.04) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
    }
  }
  
  return pixels;
}

// 主函数
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('正在生成图标...');

// 生成各种尺寸的 PNG
const sizes = [16, 32, 48, 64, 128, 256, 512];
const icoWriter = new ICOWriter();

for (const size of sizes) {
  const pixels = drawIcon(size);
  const png = createSimplePNG(size, size, pixels);
  
  // 保存单独的 PNG
  fs.writeFileSync(path.join(assetsDir, `icon-${size}.png`), png);
  console.log(`✓ 生成 icon-${size}.png`);
  
  // 添加到 ICO
  icoWriter.addImage(size, size, png);
}

// 写入 ICO 文件
icoWriter.write(path.join(assetsDir, 'icon.ico'));
console.log('✓ 生成 icon.ico (包含多尺寸)');

// 复制 256x256 作为 Linux 图标
fs.copyFileSync(path.join(assetsDir, 'icon-256.png'), path.join(assetsDir, 'icon.png'));
console.log('✓ 生成 icon.png (Linux)');

// 生成 ICNS (macOS)
// ICNS 格式需要特殊处理，这里创建一个简单的版本
const icnsSizes = [16, 32, 48, 128, 256, 512];
const icnsData = [];
let icnsOffset = 8; // 头部大小

for (const size of icnsSizes) {
  const pngPath = path.join(assetsDir, `icon-${size}.png`);
  const pngBuffer = fs.readFileSync(pngPath);
  
  // ICNS 类型标识
  let type;
  if (size === 16) type = 'icp4';
  else if (size === 32) type = 'icp5';
  else if (size === 48) type = 'icp6';
  else if (size === 128) type = 'ic07';
  else if (size === 256) type = 'ic08';
  else if (size === 512) type = 'ic09';
  
  const entry = Buffer.alloc(8);
  entry.write(type, 0, 4);
  entry.writeUInt32BE(pngBuffer.length + 8, 4);
  icnsData.push(entry);
  icnsData.push(pngBuffer);
  icnsOffset += 8 + pngBuffer.length;
}

const icnsHeader = Buffer.alloc(8);
icnsHeader.write('icns', 0, 4);
icnsHeader.writeUInt32BE(icnsOffset, 4);

const icnsBuffer = Buffer.concat([icnsHeader, ...icnsData]);
fs.writeFileSync(path.join(assetsDir, 'icon.icns'), icnsBuffer);
console.log('✓ 生成 icon.icns (macOS)');

console.log('\n所有图标已生成到 assets/ 目录');
console.log('- icon.ico: Windows 图标');
console.log('- icon.icns: macOS 图标');
console.log('- icon.png: Linux 图标');
