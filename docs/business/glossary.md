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
| 制作方案 | `Work.profile` | 按步骤组织：`direction`、`style`、`setting`、`requirements`、`bounds` |
| 方向 | `profile.direction` | 第 1 步：`summary`（创作定位）、`format`（内容形式）、`audience`（受众，可选） |
| 风格 | `profile.style` | 第 2 步：`verbal`（文字风格）、`visual`（画面方向） |
| 背景 | `profile.setting` | 第 3 步：品牌事实、故事背景、人设等 `{ id, spec }[]` |
| 需求 | `profile.requirements` | 第 4 步：对成稿的期望（字数、结构顺序等 `{ id, spec }[]`） |
| 边界 | `profile.bounds` | 第 5 步：反向离散说明（禁止项、红线 `{ id, spec }[]`） |
| 方案就绪 | `isProfileSetupReady` | `direction.summary` + `direction.format` 已填即可进入制作 |
| 制作计划 | `Work.productionPlan` | 内部待执行/已执行任务（不对用户主展示） |
| 作品预览 | `Work.preview` | 标题、正文等；版本时间轴主体 |
| 参考素材 | `Work.references` | 文本/图片/音视频/网页参考及分析、借鉴意图 |
| 作品 | `Work` | 跨对话共享的状态容器 |
| 对话 | `WorkConversation` | 作品下独立 LangGraph `threadId` |

`WorkProfile` 仅接受上述五步结构；媒介与画幅等运行时由 `resolveContentFormFromProfile` 推断，不入库。

任务类型与路由详见 [agent-turn-queue.md](../technical/agent-turn-queue.md)。
