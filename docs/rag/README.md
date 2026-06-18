# 有感 · 用户知识库（RAG 文档集）

本目录收录**面向终端用户**的产品知识，用于 RAG（检索增强生成）场景：帮助用户了解如何使用有感、如何创作出好作品，以及账号、发布、会员等常见问题。

与 `docs/business/`（商业/融资素材）和 `docs/technical/`（开发运维）分离，避免检索时混入内部或技术细节。

## 文档清单

| 文件 | 主题 | 典型用户问题 |
|------|------|--------------|
| [01-product-overview.md](./01-product-overview.md) | 产品是什么、解决什么问题 | 有感和其他 AI 工具有什么不同？ |
| [02-getting-started.md](./02-getting-started.md) | 注册、首件作品、推荐流程 | 怎么开始第一次创作？ |
| [03-studio-guide.md](./03-studio-guide.md) | 创作台布局与操作 | 对话区、侧栏、版本怎么用？ |
| [04-planning-your-work.md](./04-planning-your-work.md) | 定方案环节 | 怎么定选题、受众和结构？ |
| [05-producing-content.md](./05-producing-content.md) | 制作与修改 | 怎么开始制作、改稿、管理版本？ |
| [06-using-references.md](./06-using-references.md) | 参考素材 | 怎么上传参考、让 AI 借鉴？ |
| [07-creation-best-practices.md](./07-creation-best-practices.md) | 创作方法论与技巧 | 怎样写出更好的作品？ |
| [09-publish-and-discover.md](./09-publish-and-discover.md) | 发布与发现灵感 | 怎么发布、被人看到？ |
| [10-membership-and-billing.md](./10-membership-and-billing.md) | 会员与额度 | 免费版和 Pro 有什么区别？ |
| [11-account-and-settings.md](./11-account-and-settings.md) | 账号与设置 | 怎么改资料、管理作品？ |
| [12-faq.md](./12-faq.md) | 常见问题 | 额度用完了怎么办？ |
| [13-glossary.md](./13-glossary.md) | 术语表 | 「定方案」「制作计划」是什么意思？ |

## RAG 接入建议

### 分块策略

- **推荐按 H2 标题分块**：每篇文档的 `##` 小节可独立成 chunk，约 200–600 字。
- **保留 frontmatter**：每篇文件顶部的 YAML 元数据可用于过滤（如 `category: billing`）。
- **不拆分 FAQ**：`12-faq.md` 每个 `###` 问答对宜作为独立 chunk，便于精确命中。

### 元数据字段

```yaml
---
title: 文档标题
description: 一句话摘要（用于 embedding 增强）
category: overview | getting-started | workflow | tips | publish | billing | account | faq
keywords: [有感, 定方案, 制作, ...]
audience: end-user
---
```

### 检索优先级建议

| 用户意图 | 优先检索 |
|----------|----------|
| 不知道怎么开始 | 02、03 |
| 创作流程与环节 | 04、05、06 |
| 写好内容 | 07 |
| 发布与曝光 | 09 |
| 付费与额度 | 10、12 |
| 账号与设置 | 11、12 |

### 不应纳入 RAG 的文档

以下目录面向内部或开发，**不建议**与用户知识库混用：

- `docs/business/` — 商业计划、竞争分析、财务假设
- `docs/technical/` — LangGraph、版本图、Agent 实现
- `apps/*/README.md` — 开发与部署

### 维护原则

- 产品文案、定价、功能变更时，同步更新对应 RAG 文档。
- 以 `apps/web/src/lib/site-copy.ts` 和 `apps/api/src/lib/subscription-plans.ts` 为 C 端口径准绳。
- 每篇文档末尾标注 `最后核对` 日期，便于运营巡检。

## 与业务文档的关系

| 来源 | RAG 文档中的处理 |
|------|------------------|
| `docs/business/creation-methodology.md` | 改写为用户视角，去掉代码字段名 |
| `docs/business/user-journeys.md` | 提炼为上手与推荐流程 |
| `docs/business/feature-catalog.md` | 只保留用户可见功能说明 |
| `docs/business/glossary.md` | 精简为用户术语表 |
