# 术语表

| 术语 | 代码 / 字段 | 说明 |
|------|-------------|------|
| 定方案 | `profile`（队列项） | 按步骤整理创作定位、体裁、表达、结构与规则 |
| 备参考 | `reference`（队列项） | 分析新附件或删改参考素材条目 |
| 制作 | `production`（队列项） | 制定制作计划并产出作品预览 |
| 提问 | `ask`（队列项） | 答疑与咨询，不直接改方案与成稿 |
| 侧栏直改 + 线程同步 | `PATCH Work` + `agent-thread-sync` | UI 改 profile/references/preview，同步 LangGraph checkpoint，无对话回复 |
| 聊天改状态 | 对话子图（profile / production / reference 等） | 有 assistant 回复与工具调用 |
| 回合队列 | `turn.queue` | 单条用户消息解析出的有序 `TurnQueueKind[]` |
| 当前队列项 | `turn.activeKind` | 正在执行的 `TurnQueueKind` |
| 作品面板 | Creative Context Panel | Studio 右侧：方案、参考、作品、版本 |
| 制作方案 | `Work.profile` | 按步骤组织：`intent`、`delivery`、`expression`、`structure`、`constraints` |
| 创作定位 | `profile.intent` | 第 1 步：`summary`（面向制作的一句话） |
| 体裁与参数 | `profile.delivery` | 第 2 步：`format`、`modalities`、`platform`、`category`、`params` |
| 表达设定 | `profile.expression` | 第 3 步：`audience`、`verbal`、`visual` |
| 结构与要素 | `profile.structure` | 第 4 步：`settings[]`（固定设定）、`segments[]`（结构段） |
| 结构段 | `profile.structure.segments` | 内容结构节拍（hook、chapter、scene 等角色） |
| 创作设定 | `profile.structure.settings` | 固定对象/背景设定 |
| 创作规则 | `profile.constraints.rules` | 第 5 步：必须遵守或需要避免的约束条目 |
| 方案就绪 | `isProfileSetupReady` | `intent.summary` + `delivery.format` 已填即可进入制作 |
| 制作计划 | `Work.productionPlan` | 内部待执行/已执行任务（不对用户主展示） |
| 作品预览 | `Work.preview` | 标题、正文等；版本时间轴主体 |
| 参考素材 | `Work.references` | 文本/图片/音视频/网页参考及分析、借鉴意图 |
| 作品 | `Work` | 跨对话共享的状态容器 |
| 对话 | `WorkConversation` | 作品下独立 LangGraph `threadId` |

`WorkProfile` 仅接受上述步骤结构，不做旧版字段迁移。

任务类型与路由详见 [agent-turn-queue.md](../technical/agent-turn-queue.md)。
