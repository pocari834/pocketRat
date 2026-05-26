#!/usr/bin/env node

/**
 * 动画系统设置工具
 * 帮助用户快速设置 PNG 序列帧动画系统
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 POCKET RAT 动画系统设置工具                  ║
║                 PNG 序列帧动画系统设置向导                   ║
╚══════════════════════════════════════════════════════════════╝
`);

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const rendererDir = path.join(projectRoot, 'renderer');
const assetsDir = path.join(rendererDir, 'assets');
const animationsDir = path.join(assetsDir, 'animations');

// 检查当前状态
function checkCurrentStatus() {
  console.log('\n🔍 检查当前状态...\n');
  
  const status = {
    hasSpriteSheet: fs.existsSync(path.join(assetsDir, 'canvas_node_generated_mpdx8dgeao9x5r4.png')),
    hasVideo: fs.existsSync(path.join(assetsDir, '5b58a71a282cefa8334e5dc34d82f187_raw.mp4')),
    hasAnimationManager: fs.existsSync(path.join(rendererDir, 'js', 'animation-manager.js')),
    hasRendererV2: fs.existsSync(path.join(rendererDir, 'js', 'renderer-v2.js')),
    hasTestPage: fs.existsSync(path.join(rendererDir, 'animation-test.html')),
    hasAnimationsDir: fs.existsSync(animationsDir)
  };
  
  console.log('📊 当前状态:');
  console.log(`  ${status.hasSpriteSheet ? '✅' : '❌'} 精灵图文件: canvas_node_generated_mpdx8dgeao9x5r4.png`);
  console.log(`  ${status.hasVideo ? '✅' : '❌'} 视频文件: 5b58a71a282cefa8334e5dc34d82f187_raw.mp4`);
  console.log(`  ${status.hasAnimationManager ? '✅' : '❌'} 动画管理器: animation-manager.js`);
  console.log(`  ${status.hasRendererV2 ? '✅' : '❌'} 新渲染器: renderer-v2.js`);
  console.log(`  ${status.hasTestPage ? '✅' : '❌'} 测试页面: animation-test.html`);
  console.log(`  ${status.hasAnimationsDir ? '✅' : '❌'} 动画目录: animations/`);
  
  return status;
}

// 创建动画目录结构
function createAnimationStructure() {
  console.log('\n📁 创建动画目录结构...\n');
  
  const animationTypes = [
    'idle',     // 待机
    'walk',     // 走路
    'dance',    // 跳舞
    'sleep',    // 睡觉
    'eat',      // 吃东西
    'happy',    // 开心
    'scared',   // 惊吓
    'stand'     // 站立
  ];
  
  // 创建主目录
  if (!fs.existsSync(animationsDir)) {
    fs.mkdirSync(animationsDir, { recursive: true });
    console.log(`✅ 创建目录: ${path.relative(projectRoot, animationsDir)}`);
  }
  
  // 创建子目录
  for (const type of animationTypes) {
    const typeDir = path.join(animationsDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
      console.log(`✅ 创建目录: ${path.relative(projectRoot, typeDir)}`);
    }
  }
  
  // 创建占位文件
  createPlaceholderFiles();
  
  console.log('\n✅ 目录结构创建完成！');
}

// 创建占位文件
function createPlaceholderFiles() {
  console.log('\n📄 创建占位文件...\n');
  
  const placeholderCanvasCode = `
// 创建 150x150 的占位图片
const canvas = document.createElement('canvas');
canvas.width = 150;
canvas.height = 150;
const ctx = canvas.getContext('2d');

// 绘制背景
ctx.fillStyle = '#333';
ctx.fillRect(0, 0, 150, 150);

// 绘制文本
ctx.fillStyle = '#666';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('PLACEHOLDER', 75, 75);

ctx.font = '12px Arial';
ctx.fillText('Replace with actual PNG', 75, 100);

// 转换为 Data URL
const dataUrl = canvas.toDataURL('image/png');
`;
  
  // 创建占位图片生成脚本
  const placeholderScriptPath = path.join(animationsDir, 'create-placeholders.js');
  if (!fs.existsSync(placeholderScriptPath)) {
    fs.writeFileSync(placeholderScriptPath, placeholderCanvasCode);
    console.log(`✅ 创建占位脚本: ${path.relative(projectRoot, placeholderScriptPath)}`);
  }
  
  // 创建 README
  const readmeContent = `# 动画资源目录

## 目录结构
\`\`\`
animations/
├── idle/      # 待机动画 (6帧，8fps，循环)
├── walk/      # 走路动画 (8帧，12fps，循环)
├── dance/     # 跳舞动画 (12帧，15fps，不循环)
├── sleep/     # 睡觉动画 (8帧，6fps，循环)
├── eat/       # 吃东西动画 (6帧，10fps，不循环)
├── happy/     # 开心动画 (6帧，12fps，不循环)
├── scared/    # 惊吓动画 (4帧，15fps，不循环)
└── stand/     # 站立动画 (4帧，8fps，循环)
\`\`\`

## 文件命名规范
- 格式: \`{状态}_{方向}_{帧序号}.png\`
- 方向: \`l\` (左侧)，右侧使用代码镜像
- 帧序号: \`01\`, \`02\`, ... \`12\` (两位数)

## 示例
\`\`\`
idle_l_01.png    # 待机动画第1帧
walk_l_01.png    # 走路动画第1帧
dance_l_01.png   # 跳舞动画第1帧
\`\`\`

## 规格要求
- 尺寸: 150×150px (推荐)
- 背景: 透明 (PNG with alpha)
- 风格: 2D 手绘平涂
- 帧率: 根据动画类型调整

## 工具推荐
1. **精灵图切割**: https://ezgif.com/sprite-cutter
2. **PNG压缩**: https://tinypng.com
3. **动画制作**: Aseprite, Pyxel Edit, Photoshop
`;
  
  const readmePath = path.join(animationsDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log(`✅ 创建 README: ${path.relative(projectRoot, readmePath)}`);
  }
}

// 显示迁移步骤
function showMigrationSteps() {
  console.log('\n📋 迁移步骤:');
  console.log('\n1️⃣ 第一步：准备动画资源');
  console.log('   ├── 切割精灵图为 PNG 序列帧');
  console.log('   ├── 将视频转换为 PNG 序列帧');
  console.log('   └── 放入相应的动画目录');
  
  console.log('\n2️⃣ 第二步：测试动画系统');
  console.log('   ├── 运行: npm run test-animation');
  console.log('   ├── 在浏览器中测试不同动画');
  console.log('   └── 验证透明背景效果');
  
  console.log('\n3️⃣ 第三步：集成到主应用');
  console.log('   ├── 修改 pet.html 引入新渲染器');
  console.log('   ├── 更新状态机使用动画系统');
  console.log('   └── 移除视频相关代码');
  
  console.log('\n4️⃣ 第四步：优化和测试');
  console.log('   ├── 压缩 PNG 文件大小');
  console.log('   ├── 测试性能表现');
  console.log('   └── 修复发现的问题');
}

// 显示快速开始指南
function showQuickStart() {
  console.log('\n🚀 快速开始指南:');
  console.log('\n1. 切割现有的精灵图:');
  console.log('   npm run split-sprite');
  console.log('   或手动使用: https://ezgif.com/sprite-cutter');
  
  console.log('\n2. 测试动画系统:');
  console.log('   npm run test-animation');
  console.log('   在浏览器中打开测试页面');
  
  console.log('\n3. 查看详细指南:');
  console.log('   打开 ANIMATION_MIGRATION_GUIDE.md');
  
  console.log('\n4. 开始迁移:');
  console.log('   按照迁移步骤逐步替换');
}

// 主菜单
function showMainMenu() {
  console.log('\n' + '═'.repeat(60));
  console.log('请选择要执行的操作:');
  console.log('1. 检查当前状态');
  console.log('2. 创建动画目录结构');
  console.log('3. 查看迁移步骤');
  console.log('4. 查看快速开始指南');
  console.log('5. 退出');
  console.log('═'.repeat(60));
  
  rl.question('\n请输入选择 (1-5): ', (choice) => {
    switch (choice) {
      case '1':
        checkCurrentStatus();
        showMainMenu();
        break;
      case '2':
        createAnimationStructure();
        showMainMenu();
        break;
      case '3':
        showMigrationSteps();
        showMainMenu();
        break;
      case '4':
        showQuickStart();
        showMainMenu();
        break;
      case '5':
        console.log('\n👋 再见！');
        rl.close();
        break;
      default:
        console.log('❌ 无效选择，请重试');
        showMainMenu();
    }
  });
}

// 启动
console.log('欢迎使用 Pocket Rat 动画系统设置工具！');
console.log('此工具将帮助您从视频方案迁移到 PNG 序列帧动画系统。\n');

// 检查状态
const status = checkCurrentStatus();

// 如果缺少关键文件，给出提示
if (!status.hasAnimationManager || !status.hasRendererV2) {
  console.log('\n⚠️  检测到缺少关键文件，建议先创建动画目录结构。');
}

// 显示主菜单
showMainMenu();

// 程序结束时显示总结
rl.on('close', () => {
  console.log('\n' + '═'.repeat(60));
  console.log('💡 提示:');
  console.log('• 使用 npm run split-sprite 切割精灵图');
  console.log('• 使用 npm run test-animation 测试动画系统');
  console.log('• 查看 ANIMATION_MIGRATION_GUIDE.md 获取详细指南');
  console.log('═'.repeat(60));
  process.exit(0);
});