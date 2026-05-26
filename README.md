# Pocket Rat 🐹

Steam Desktop Companion - 一个可爱的桌面宠物应用

## 项目概述

Pocket Rat 是「口袋鼠宝」生态系统的 Steam PC 端，提供长期桌面陪伴体验。

### 核心功能

- 🐹 **7种桌宠行为**: 散步、睡觉、啃东西、洗脸、站立张望、跟随鼠标、钻洞
- 🖱️ **5种交互方式**: 摸头、喂食、点击、惊吓、聊天
- ⏰ **工作效率模式**: 专注模式、休息提醒、喝水提醒、深夜陪伴
- 🎮 **4款小游戏**: 追光标、零食雨、钻洞竞速、接住我
- ⚙️ **窗口管理**: 置顶、穿透点击、半透明、贴边隐藏、多显示器支持
- ☁️ **云同步**: CloudKit + Steam Cloud 双向同步
- 🏆 **Steam 集成**: 成就系统、集换式卡牌、创意工坊

### 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 跨平台桌面框架 |
| TypeScript | 类型安全开发 |
| Canvas 2D | 桌宠渲染（色块占位） |
| electron-store | 本地配置存储 |
| CloudKit Web API | iOS 数据同步 |

## 项目结构

```
pocketRat/
├── src/
│   ├── main/
│   │   ├── main.ts          # Electron 主进程入口
│   │   └── store.ts         # 本地存储管理
│   └── shared/
│       └── types.ts         # 共享类型定义
├── renderer/
│   ├── pet.html             # 桌宠渲染页面
│   ├── settings.html        # 设置面板页面
│   └── js/
│       ├── pet.ts           # 桌宠主入口
│       ├── renderer.ts      # 色块渲染器
│       ├── state-machine.ts # 行为状态机
│       ├── interaction.ts   # 交互检测系统
│       ├── work-mode.ts     # 工作效率模式
│       └── mini-games.ts    # 小游戏系统
├── package.json
├── tsconfig.json
└── README.md
```

## 开发说明

> ⚠️ 美术资源当前使用**色块占位**，正式版本需要替换为 2D 手绘风格的精灵图/Lottie 动画。

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 构建

```bash
npm run build
npm run dist
```

## 设计文档

完整产品设计文档请参考 `report_final.md`。
