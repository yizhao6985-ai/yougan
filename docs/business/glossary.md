# 术语表

| 术语 | 代码 / 字段 | 说明 |
|------|-------------|------|
| 灵感模式 | `inspiration`（任务） | 探索选题与受众，对话中确认 brief |
| 大纲模式 | `outline`（任务） | 推敲内容结构，对话中使用大纲工具 |
| 创作模式 | `creation`（任务） | 创意总监定 plan 并出 draft |
| 提问模式 | `ask`（任务） | 答疑与咨询，不直接改 plan/draft |
| 侧栏直改 + 线程同步 | `PATCH Work` + `agent-thread-sync` | UI 改 profile/brief/outline/draft，同步 LangGraph checkpoint，无对话回复 |
| 聊天改状态 | 对话子图（inspiration / outline 等） | 有 assistant 回复与工具调用 |
| 回合队列 | `turnQueue` | 单条用户消息解析出的有序 `TurnQueueKind[]` |
| 当前队列项 | `activeTurnKind` | 正在执行的 `TurnQueueKind` |
| 创作脉络 | Creative Context Panel | Studio 右侧：灵感、大纲、预览、参考、版本 |
| brief | `Work.brief` | 已确认需求列表 |
| 内容大纲 | `Work.outline` | 结构条目（非制作部门分工） |
| 制作计划 | `Work.plan` | 内部待执行/已执行任务（不对用户主展示） |
| 成稿 / 预览 | `Work.draft` | 标题、正文等；版本时间轴主体 |
| 作品 | `Work` | 跨对话共享的状态容器 |
| 对话 | `WorkConversation` | 作品下独立 LangGraph `threadId` |

任务类型与路由详见 [agent-turn-queue.md](../technical/agent-turn-queue.md)。
