# 作品版本历史（单线）

有感采用 **单线 revision** 管理每件作品的状态：每次有意义的 Agent 操作写入一条 `WorkRevision`（类似 commit），所有对话共享同一份 `brief / plan / draft`。

## 核心概念

| 概念 | 说明 |
|------|------|
| `WorkRevision` | 一次状态快照 + 元数据（kind、summary、parent） |
| `Work.headRevisionId` | 当前 head 指针 |
| 物化列 | `Work.profile / brief / plan / draft` 始终反映 head |
| 多对话 | 仅不同 LangGraph thread；**不 fork 状态** |

## 平行探索：另存为新作品

换平台、换选题等场景，使用 **另存为新作品**（`POST /api/works/:id/duplicate`）：

- 从当前 head 或指定 revision 复制 snapshot
- 创建独立 `Work`，写入 `work_duplicated` revision
- 可选记录 `sourceWorkId` / `sourceRevisionId`

## 数据流

```text
用户发消息 → LangGraph run（注入 Work 物化列）
         → stream 结束 → applyAgentRunToWork
         → append WorkRevision、更新 head + 物化列
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/works/:workId/revisions` | 版本列表 |
| POST | `/api/works/:workId/restore/:revisionId` | 回到历史版本 |
| POST | `/api/works/:workId/duplicate` | 另存为新作品 |
| GET | `/api/works/:workId/agent-context?conversationId=` | 对话 mode/thread + 作品状态 |

## 前端

- 创作脉络 **「历史」** tab：`WorkHistoryPanel`（时间线、回到这一版、另存为新作品）
- 新建对话：仅新聊天 thread，共享作品状态

## 相关代码

- `apps/api/src/services/work-revisions.ts`
- `apps/api/src/services/revisions.ts`
- `apps/web/src/services/work-history.ts`
- `apps/web/src/components/studio/work-history-panel.tsx`
