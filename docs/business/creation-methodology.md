# 创作方法论：三模式流水线

有感的核心产品逻辑是**分阶段确认**，而非单次 Prompt 生成全文。每件作品采用 **单线 revision** 记录状态（见 [revision-graph.md](../technical/revision-graph.md)）。

## 总流程

```
灵感模式 ──► 创作模式 ──► 发布
   │              │
   ▼              ▼
Work.brief     Work.plan + Work.draft
                      ▲
                 提问模式（并行答疑，不改 plan/draft）
```

同一件作品内可有多轮对话，但 **共享同一份 brief/plan/draft**。换平台、换选题请 **另存为新作品**。

---

## 第一步：灵感模式（inspiration）

### 数据对象：`WorkBrief`

| 字段 | 含义 |
|------|------|
| `requirements[]` | 已确认需求 |
| `ready` | brief 是否定稿 |

### 工具

`add_brief_requirement` / `update_brief_requirement` / `delete_brief_requirement` / `clear_brief` / `confirm_brief_ready`

---

## 第二步：创作模式（creation）

### 数据对象

- `Work.plan` — `pending_tasks` / `executed_tasks` / `ready` / `summary` …
- `Work.draft` — 成稿

---

## 版本与另存

- **版本记录**：Agent 有意义操作写入单线 timeline
- **回到这一版**：restore，追加 `work_restored` revision
- **另存为新作品**：从当前或历史 snapshot 复制为新 `Work`（小红书 / 公众号并行探索）

---

## 第三步：提问模式（ask）

答疑与创作咨询；不直接改 plan/draft。
