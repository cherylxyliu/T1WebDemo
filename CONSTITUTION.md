# 【替身】(Doppelgänger) 子任务宪法

> 版本：v1.0.0 | 落款：v1.0.0
> 创建日期：2026-07-22
> 状态：**开发中 (MVP)**

---

## §0 红线区（绝对不可违反）

| # | 红线 | 触发条件 | 后果 |
|---|------|----------|------|
| R1 | **禁止 X+SLG skill 加载** | 试图加载 `game-novice-task-designer` / `xslg-novice-designer` | 立即拒绝并提醒 |
| R2 | **禁止编造数据** | 工具返回结果与预期不符时预填/伪造数据 | 记录实际结果，向用户报告偏差 |
| R3 | **iOS 兼容性优先** | 新增代码未考虑 iOS Safari 行为差异 | 必须在 iOS 设备真机验证 |
| R4 | **保持单文件架构** | 试图拆分为多文件/引入构建工具链 | MVP 阶段严格单 HTML 文件 |
| R5 | **文档版本一致性** | 改版时头尾版本号不同步 | 必须双向同步检查 |

### 来源追溯

- R1/R2: 继承自项目宪法 `.codebuddy/CONSTITUTION.md`
- R3: 本任务核心目标（iOS端可运行）
- R4: 技术规格约束（MVP阶段纯静态HTML）
- R5: 文档维护通用规则

---

## §1 项目定位

### 一句话定义
**「替身」是一款悬疑恐怖风格的竖屏交互叙事 H5 Demo，模拟约会 APP 使用体验，通过 Swipe/Hold/Drag 三种手势操作，让玩家体验"被已注销用户逐步接管身份"的心理惊悚过程。**

### 目标平台
- 主目标：**iOS Safari**（全屏 Web App 模式）
- 次目标：Android Chrome / 桌面浏览器（向后兼容）

### 核心体验指标
| 指标 | 目标值 |
|------|--------|
| 单次通关时长 | 10-15 分钟 |
| 完成率目标 | >60%（MVP阶段） |
| 社交分享率 | >15%（设计钩子埋设） |

### 设计风格关键词
> Dark Horror · Suspense Interactive · Dating App Parody · Minimalist Black · Psychological Thriller

---

## §2 信息源（单一事实来源）

| 信息类别 | 文件路径 | 用途 |
|----------|----------|------|
| 游戏本体 | `index.html` | 唯一的可运行游戏文件（从 `!DOCTYPE.html` 重命名+iOS适配） |
| 设计文档 | `docs/游戏创意说明-H5Demo.md` | T1大赛三板块创意说明 |
| 子任务宪法 | `CONSTITUTION.md` | 本文件 |
| 项目概览 | `README.md` | 玩法说明、打开方式、目录结构 |
| 外部评审 Skill | `C:\Users\cherylxyliu\Downloads\t1-minigame-contest-reviewer.md` | T1工作室小游戏创意征集大赛评审框架 |

---

## §3 工作流裁剪

### 当前 Phase：MVP 开发

#### 已裁剪（不在当前范围内）
- ~~音频系统~~ — MVP 阶段无音频，纯视觉+文本反馈
- ~~后端服务~~ — 纯前端实现，无服务器依赖
- ~~多语言/i18n~~ — 仅中文
- ~~原生包装~~ — 不使用 Capacitor/Cordova，纯 H5
- ~~账号持久化~~ — 无登录系统，昵称仅内存存储

#### 可选扩展（未来迭代）
- [ ] 音效层（环境音+BGM+UI反馈音）
- [ ] 成就系统（通关时间/无失误通关等）
- [ ] 多结局分支（当前为线性单一结局）
- [ ] 分享卡片生成（社交裂变）

---

## §4 Skill 调度表

| Phase | Skill 名称 | 触发条件 | 说明 |
|-------|-----------|----------|------|
| 创意说明撰写 | `t1-minigame-contest-reviewer` | 需要按T1大赛格式输出创意说明时加载 | 三板块：为什么是小游戏 / 定位+玩法 / 竞品亮点 |
| UI开发 | `aoem-client-assist` | ❌ 不适用 | AOEM专属，本项目不涉及 |
| 配表导出 | `aoem-excel-export` | ❌ 不适用 | 无配表需求 |
| Layout制作 | `aoem-ui-layout-guide` | ❌ 不适用 | 非AOEM UI体系 |

### Skill 屏蔽声明
- ❌ **不可加载**：`game-novice-task-designer` / `xslg-novice-designer`（X+SLG新项目专用）
- ✅ **可参考其reference中AOEM相关部分**：`aoem-task-system-knowledge.md`、`novice-retention-design.md`（过滤X+内容）
- ❌ **不可参考**：`xslg-novice-task-design-decisions.md` 中X+SLG特有设计约束

---

## §5 约束速查表

### 技术约束
| 约束项 | 值 | 备注 |
|--------|-----|------|
| 文件结构 | `index.html` + `styles.css` + `app.js` + `assets/` | 多文件结构，便于继续扩展交互 |
| 屏幕方向 | 竖屏锁定 (portrait) | 面向移动端单手操作 |
| 触控事件 | Pointer Events 为主 | 统一滑卡、上推、擦拭与长按 |
| 视口缩放 | 禁止 (`user-scalable=no`) | iOS全屏模式必需 |
| 安全区域 | `env(safe-area-inset-*)` | iPhone X+ 刘海屏适配 |
| 字体栈 | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | iOS原生字体优先 |

### 内容约束
| 约束项 | 值 | 备注 |
|--------|-----|------|
| 核心动词 | Swipe / Hold / Drag | 三种手势覆盖全部交互 |
| 叙事结构 | 线性5阶段 | 注册→刷卡→聊天与导航→异常事件→接管终局 |
| 恐怖类型 | 心理微恐 | 无 Jump Scare，靠叙事张力 |
| 玩家昵称 | 动态绑定 | 输入后传递到权限弹窗与资料页 |
| 跳水坑结果 | 动态绑定 | 保留为事件反馈与后续气氛素材 |

### iOS兼容性检查清单
- [x] `apple-mobile-web-app-capable` meta 标签
- [x] `viewport-fit=cover` 适配刘海屏
- [x] `apple-mobile-web-app-status-bar-style: black-translucent`
- [x] 文件名不含特殊字符（`index.html` 非 `!DOCTYPE.html`）
- [x] touch-action 正确设置
- [x] overflow: hidden 禁用页面滚动
- [ ] __待用户真机验证__

---

## §6 修订记录

| 版本 | 日期 | 变更内容 | 操作人 |
|------|------|----------|--------|
| v1.0.0 | 2026-07-22 | 初版创建：红线区/定位/信息源/Skill调度/约束速查表 | Agent |
