# 宠物属性系统 (Pet Stats System) 设计文档

## 概述

为 Pocket Rat 桌面宠物添加三个核心生存属性（饱腹度、心情、精力），驱动老鼠行为变化，增强养成感和互动深度。

## 属性定义

| 属性 | ID | 范围 | 衰减速度 | 满值约持续 |
|------|-----|------|----------|-----------|
| 饱腹度 | `hunger` | 0–100 | 0.05/秒 | ~33 分钟 |
| 心情 | `mood` | 0–100 | 0.03/秒 | ~55 分钟 |
| 精力 | `energy` | 0–100 | 0.02/秒 | ~83 分钟 |

属性值在每次 `gameLoop` 迭代时根据 `delta` 衰减。

## 行为驱动

当属性低于阈值（默认 30）时，调整状态转换权重：

- **饱腹度 < 30**：`chew` 权重 ×3，触发气泡"好饿…"
- **心情 < 30**：`stand` 权重 ×2，`idle` 权重 ×0.5
- **精力 < 30**：`sleep` 权重 ×3，`walk`/`follow` 权重 ×0.3，触发气泡"好困…"

阈值通过常量定义，便于后续调整。

## 互动补充

| 互动 | 饱腹 | 心情 | 精力 | 备注 |
|------|------|------|------|------|
| 抚摸 (`PET`) | - | +20 | - | |
| 喂食 (`FEED`) | +30 | +5 | - | |
| 点击/跳舞 (`CLICK`) | - | +15 | -5 | 消耗体力 |
| 小游戏完成 | - | +25 | -10 | |
| 睡眠中自然恢复 | - | - | +1/秒 | 仅在 `sleep` 状态 |

属性值不超过 100，不低于 0。

## UI 展示

鼠标移入老鼠窗口时，在气泡下方显示三条小进度条：

```
🍔 ████████░░ 70
😊 █████░░░░░ 50
⚡ ██████████ 100
```

- 仅在鼠标悬停时显示（`mouseenter`/`mouseleave`）
- 使用 DOM 元素叠加在 canvas 上方
- 颜色：饱腹=橙色，心情=粉色，精力=蓝色
- 鼠标移出后延迟 1 秒隐藏

## 数据持久化

- 属性值存入 `electron-store`，键名：`petStats.{hunger|mood|energy}`
- 使用 `lastSaveTime` 时间戳，恢复时根据离线时间计算衰减
- 在以下时机保存：退出应用前、状态发生显著变化后（每 30 秒）、喂食/抚摸后立即

## 文件变更

### 新增文件

- `renderer/js/pet-stats.js` — 属性系统核心类 `PetStats`

### 修改文件

- `renderer/js/pet.js` — 初始化 `PetStats`，传入 `stateMachine`
- `renderer/js/state-machine.js` — 接受属性值，调整权重
- `renderer/js/renderer.js` — 添加属性 UI 渲染
- `renderer/js/interaction.js` — 互动时通知属性变化
- `src/main/store.ts` — 添加属性相关默认值
- `src/main/main.ts` — 添加 IPC 处理属性存取和退出时保存

### 接口

```
PetStats {
  hunger, mood, energy: number
  update(deltaMs): void          // 衰减
  modifyHunger(n), modifyMood(n), modifyEnergy(n): void
  getWeights(baseWeights): Weight[]  // 返回调整后的权重
  save(): void                   // 持久化
  load(): void                   // 恢复
}
```

## 注意事项

1. 先用色块渲染属性条，美术资源到位后替换
2. 属性系统的引入不应破坏现有状态机逻辑，仅做权重调整
3. 退出保存需要 IPC 通信，主进程 `before-quit` 事件发送保存指令
