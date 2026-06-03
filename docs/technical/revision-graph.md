# 作品版本历史（单线）

有感采用 **单线 revision** 管理每件作品对用户可见的里程碑；`Work` 物化列始终反映当前进度，所有对话共享同一份 `brief / plan / draft`。

## 对用户可见的只有一类

| phase | 含义 | 何时写入 |
|-------|------|----------|
| `draft` | 内容预览 | 创作模式产出有效 `draft`（正文预览） |

**灵感**（brief / profile）、**大纲**（outline）、**制作计划**（plan）会同步到物化列，但 **不写入版本时间轴**。

## 核心概念

| 概念 | 说明 |
|------|------|
| `WorkRevision` | 用户可见里程碑的快照 + summary |
| `Work.headRevisionId` | 当前所处的版本节点 |
| 物化列 | `Work.profile / brief / plan / draft` 始终反映最新进度 |
| 新建作品 | 无版本记录，直到首次生成内容预览 |
| 另存为新作品 | 复制源作品可见版本链 + 当前 snapshot |
| 回到这一版 | 将 head 指回所选节点并物化，不追加操作记录 |

## 平行探索：另存为新作品

`POST /api/works/:id/duplicate`：

- 从当前进度或指定 revision 复制 snapshot 到新 `Work`
- **复用**源作品上已有的内容预览版本链（可选截断到指定 revision）
- 记录 `sourceWorkId` / `sourceRevisionId`

## 数据流

```text
用户发消息 → LangGraph run（注入 Work 物化列）
         → resolveTurnQueue → 各对话子图（见 agent-turn-queue.md）
         → stream 结束 → applyAgentRunToWork
         → 若 draft（内容预览）变更：append WorkRevision
         → 若仅 brief / outline / plan 等变更：只更新物化列
```

任务编排与 UI/API 线程同步说明：[agent-turn-queue.md](./agent-turn-queue.md)。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/works/:workId/revisions` | 版本列表（仅内容预览里程碑） |
| POST | `/api/works/:workId/restore/:revisionId` | 回到历史版本 |
| POST | `/api/works/:workId/duplicate` | 另存为新作品 |
| GET | `/api/works/:workId/agent-context?conversationId=` | 对话 thread + 作品状态 |

## 前端

- 作品面板 **「版本」** tab：`WorkHistoryPanel`（内容预览时间线、回到这一版、另存为新作品）

## 相关文档

- [agent-turn-queue.md](./agent-turn-queue.md) — Agent 回合队列与线程同步

## 相关代码

- `apps/api/src/services/work-revisions.ts`
- `apps/api/src/services/revisions.ts`
- `packages/domain/src/revision.ts`
- `apps/web/src/components/studio/work-history-panel.tsx`
