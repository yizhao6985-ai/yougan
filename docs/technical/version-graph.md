# 作品版本历史（单线）

有感采用 **单线 version** 管理每件作品对用户可见的里程碑；`Work` 物化列始终反映当前进度，所有对话共享同一份 `profile / productionPlan / preview`。

## 何时写入版本

仅当创作执行产出新的**作品预览**（`preview`）时，才追加 `WorkVersion` 节点。

**制作方案**（`profile`）、**制作计划**（`productionPlan`）、**参考素材**（`references`）等变更只更新物化列，**不写入版本时间轴**。

## 核心概念

| 概念 | 说明 |
|------|------|
| `WorkVersion` | 用户可见里程碑的快照 + summary |
| `Work.headVersionId` | 当前所处的版本节点 |
| 物化列 | `Work.profile / references / productionPlan / preview` 始终反映最新进度 |
| 新建作品 | 无版本记录，直到首次生成作品预览 |
| 另存为新作品 | 复制源作品可见版本链 + 当前 snapshot |
| 回到这一版 | 将 head 指回所选节点并物化，不追加操作记录 |

## 平行探索：另存为新作品

`POST /api/works/:id/duplicate`：

- 从当前进度或指定 version 复制 snapshot 到新 `Work`
- **复用**源作品上已有的作品预览版本链（可选截断到指定 version）
- 记录 `sourceWorkId` / `sourceVersionId`

## 数据流

```text
用户发消息 → LangGraph run（注入 Work 物化列）
         → planTurnQueue → 各对话子图（见 agent-turn-queue.md）
         → stream 结束 → applyAgentRunToWork
         → 若 preview 变更：append WorkVersion
         → 若仅 profile / references / productionPlan 等变更：只更新物化列
```

任务 workflow 与 UI/API 线程同步说明：[agent-turn-queue.md](./agent-turn-queue.md)。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/works/:workId/versions` | 版本列表（仅作品预览里程碑） |
| POST | `/api/works/:workId/restore/:versionId` | 回到历史版本 |
| POST | `/api/works/:workId/duplicate` | 另存为新作品 |
| GET | `/api/works/:workId/agent-context?conversationId=` | 对话 thread + 作品状态 |

## 前端

- 作品面板 **「版本」** tab：`WorkHistoryPanel`（作品预览时间线、回到这一版、另存为新作品）

## 相关文档

- [agent-turn-queue.md](./agent-turn-queue.md) — Agent 回合队列与线程同步

## 相关代码

- `apps/api/src/services/work-versions.ts`
- `apps/api/src/services/versions.ts`
- `packages/domain/src/models/work/version.ts`
- `apps/web/src/components/studio/work-history-panel.tsx`
