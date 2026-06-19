# @yougan/domain

共享领域类型与纯函数。`models/` 只放类型和常量；业务逻辑在 `utils/`。

## models/ 目录边界

```text
models/
├── content-form/ # 内容形态目录（`formats.ts` 体裁、`modalities.ts` 媒介）
├── discover/     # 发现页目录与筛选结构（主题分类、意图入口、发布元数据类型）
├── work/         # 作品聚合根（落库 / 物化列 / 版本快照）
├── agent/        # LangGraph 运行时（checkpoint、单轮 staging）
├── conversation/ # 对话 UI 约束
└── messages/     # LangChain human 消息多模态 content part
```

### 判断口诀

| 问题 | 放哪里 |
|------|--------|
| 会 commit 后进 `Work` 表？ | `work/` |
| 只活在一轮 turn / checkpoint？ | `agent/` |
| HTTP / OpenAPI 对外契约？ | `apps/api/schemas.ts`（Web 用 codegen） |
| 无业务实例，只有 id/label 目录？ | `content-form/` 或 `discover/` |
| 对话标题等 UI 规则？ | `conversation/` |

### 依赖方向

`content-form` / `discover` → `work` → `agent`（content-form、discover 不依赖 work/agent）

### 对外导出

包入口 `src/index.ts` 通过 `models/index.ts` 统一 re-export；`@yougan/domain` 的类型名保持不变，仅内部路径调整。

## utils/ 约定

- 与 `models/work/` 对应的工具放在 `utils/work/`
- 与 `models/discover/` 对应的放在 `utils/discover/` 等
- 内容形态运行时推断放在 `utils/content-form-resolve.ts`
- 函数不入 `models/`
