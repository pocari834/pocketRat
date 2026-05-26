/**
 * 精灵图切割工具
 * 将精灵图（Sprite Sheet）切割为单独的 PNG 帧
 * 适用于：canvas_node_generated_mpdx8dgeao9x5r4.png（2列×3行，6帧）
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function splitSpriteSheet() {
  console.log('=== 精灵图切割工具 ===');
  
  const spriteSheetPath = path.join(__dirname, '../renderer/assets/canvas_node_generated_mpdx8dgeao9x5r4.png');
  const outputDir = path.join(__dirname, '../renderer/assets/animations/idle');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`创建输出目录: ${outputDir}`);
  }
  
  // 配置参数（根据实际图片调整）
  const config = {
    cols: 2,          // 列数
    rows: 3,          // 行数
    totalFrames: 6,   // 总帧数
    frameWidth: 100,  // 每帧宽度（需要根据实际图片调整）
    frameHeight: 100, // 每帧高度（需要根据实际图片调整）
    outputPrefix: 'idle_l_', // 输出文件名前缀
    outputFormat: 'png'      // 输出格式
  };
  
  try {
    console.log(`加载精灵图: ${spriteSheetPath}`);
    
    // 加载图片
    const image = await loadImage(spriteSheetPath);
    console.log(`图片尺寸: ${image.width} x ${image.height}`);
    
    // 根据图片尺寸计算帧大小
    const actualFrameWidth = image.width / config.cols;
    const actualFrameHeight = image.height / config.rows;
    
    console.log(`计算出的帧尺寸: ${actualFrameWidth} x ${actualFrameHeight}`);
    console.log(`行列: ${config.cols}列 × ${config.rows}行`);
    console.log(`总帧数: ${config.totalFrames}`);
    
    // 创建画布
    const canvas = createCanvas(actualFrameWidth, actualFrameHeight);
    const ctx = canvas.getContext('2d');
    
    // 切割并保存每一帧
    for (let frameIndex = 0; frameIndex < config.totalFrames; frameIndex++) {
      const col = frameIndex % config.cols;
      const row = Math.floor(frameIndex / config.cols);
      
      // 清空画布
      ctx.clearRect(0, 0, actualFrameWidth, actualFrameHeight);
      
      // 绘制当前帧
      ctx.drawImage(
        image,
        col * actualFrameWidth,    // 源X
        row * actualFrameHeight,   // 源Y
        actualFrameWidth,          // 源宽度
        actualFrameHeight,         // 源高度
        0, 0,                      // 目标X,Y
        actualFrameWidth,          // 目标宽度
        actualFrameHeight          // 目标高度
      );
      
      // 生成文件名
      const frameNumber = (frameIndex + 1).toString().padStart(2, '0');
      const outputFileName = `${config.outputPrefix}${frameNumber}.${config.outputFormat}`;
      const outputPath = path.join(outputDir, outputFileName);
      
      // 保存为PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`保存帧 ${frameIndex + 1}: ${outputFileName} (${actualFrameWidth}x${actualFrameHeight})`);
    }
    
    console.log('\n✅ 切割完成！');
    console.log(`输出目录: ${outputDir}`);
    console.log(`文件格式: ${config.outputPrefix}01-${config.totalFrames}.png`);
    
    // 生成配置文件
    const configData = {
      animationName: 'idle',
      description: '待机动画（呼吸、轻微摇摆）',
      frames: config.totalFrames,
      frameRate: 8,
      loop: true,
      frameWidth: actualFrameWidth,
      frameHeight: actualFrameHeight,
      spriteSheet: path.basename(spriteSheetPath),
      files: Array.from({length: config.totalFrames}, (_, i) => 
        `${config.outputPrefix}${(i + 1).toString().padStart(2, '0')}.${config.outputFormat}`
      )
    };
    
    const configPath = path.join(outputDir, 'animation-config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`配置文件: ${configPath}`);
    
  } catch (error) {
    console.error('❌ 切割失败:', error.message);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n需要安装依赖:');
      console.log('1. 在项目根目录运行: npm install canvas');
      console.log('2. 如果安装失败，可能需要安装系统依赖（Windows可能需要安装GTK+）');
    }
  }
}

// 如果没有安装 canvas，提供手动操作指南
function showManualInstructions() {
  console.log('\n=== 手动切割指南 ===');
  console.log('如果自动工具不可用，可以手动切割：');
  console.log('\n方法1：使用在线工具');
  console.log('1. 访问 https://ezgif.com/sprite-cutter');
  console.log('2. 上传 canvas_node_generated_mpdx8dgeao9x5r4.png');
  console.log('3. 设置：2列 × 3行');
  console.log('4. 点击切割，下载所有帧');
  console.log('5. 重命名为: idle_l_01.png ... idle_l_06.png');
  console.log('6. 放到: renderer/assets/animations/idle/');
  
  console.log('\n方法2：使用图片编辑软件');
  console.log('（Photoshop、GIMP、Krita 等都支持图层切割）');
  console.log('1. 打开精灵图');
  console.log('2. 使用切片工具（2列×3行）');
  console.log('3. 导出为单个文件');
  
  console.log('\n方法3：使用 JavaScript 代码（无需额外依赖）');
  console.log('可以修改 renderer.js 直接读取精灵图：');
  console.log(`
// 直接使用精灵图（无需切割）
const spriteSheet = new Image();
spriteSheet.src = './assets/canvas_node_generated_mpdx8dgeao9x5r4.png';

function drawSpriteFrame(ctx, frameIndex, x, y) {
  const cols = 2;
  const rows = 3;
  const frameWidth = spriteSheet.width / cols;
  const frameHeight = spriteSheet.height / rows;
  
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  
  ctx.drawImage(
    spriteSheet,
    col * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,
    x, y,
    frameWidth,
    frameHeight
  );
}
  `);
}

// 执行切割
if (require.main === module) {
  // 检查是否安装了 canvas
  try {
    require('canvas');
    splitSpriteSheet().catch(console.error);
  } catch (error) {
    console.log('❌ canvas 模块未安装，无法自动切割');
    showManualInstructions();
  }
}

module.exports = { splitSpriteSheet, showManualInstructions };