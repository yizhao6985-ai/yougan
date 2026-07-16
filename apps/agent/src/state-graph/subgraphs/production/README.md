# production 子图

每次进入子图会**重置** `staging.production`，再排计划、按任务管线产出与验收，最终写入 `preview` 或保留失败状态。

## 拓扑

```text
START → planProduction → dispatchTask
                              └─ executeWriting → acceptTask → routeProduction
routeProduction
  ├─ dispatchTask（尚有未完成任务）
  ├─ assemblePreview（全部 ready）→ END
  └─ __end__（失败 / 卡住；跳过整合）
```

当前仅支持文本产出（`writing` / `video` 脚本类文案）。无出图、无音频入库。

## 节点职责

| 节点 | 类型 | 职责 |
| ---- | ---- | ---- |
| `planProduction` | llm-work | 写入用户要求（summary），生成可执行 `pending_tasks` |
| `dispatchTask` | plain | 标记当前 `in_progress` 任务 |
| `executeWriting` | llm-work | 单任务文本产出 → `deliverable` |
| `acceptTask` | llm-work | 方向性验收；失败重试或标 `failed` |
| `routeProduction` | plain | 流转锚点（无状态变更） |
| `assemblePreview` | llm-work | 写入 `preview` 后清空 `pending_tasks` |
