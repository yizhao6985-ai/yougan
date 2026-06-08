# 有感 · 业务文档

本目录基于当前代码与产品文案梳理，描述**已实现或已设计**的业务能力，供产品、运营与融资文档使用。撰写商业计划书时，建议按下列顺序引用。

## 文档索引

| 文档 | 用途（商业计划书对应章节） |
|------|---------------------------|
| [产品定位与价值主张](./product-positioning.md) | 摘要、问题定义、解决方案、差异化 |
| [目标用户与场景](./target-users.md) | 市场细分、用户画像、使用场景 |
| [用户旅程](./user-journeys.md) | 客户获取、激活、留存、变现路径 |
| [功能目录](./feature-catalog.md) | 产品功能清单与实现状态 |
| [创作方法论](./creation-methodology.md) | 灵感·大纲·创作·提问、侧栏与聊天分工 |
| [内容与社区](./content-ecosystem.md) | 发现灵感、发布、主页与传播 |
| [内容分类体系](./content-taxonomy.md) | 两层 taxonomy、推断逻辑、发布确认 |
| [商业化与定价](./monetization.md) | 收入模式、套餐、计费规则 |
| [平台集成](./platform-integrations.md) | 多平台发布、OAuth 商业价值 |
| [竞争与替代](./competitive-positioning.md) | 竞品对比、替代方案 |
| [产品成熟度与规划](./product-maturity.md) | MVP 边界、待建设能力、风险 |
| [术语表](./glossary.md) | 产品/技术名词对照 |
| [商业计划书提纲](./business-plan-outline.md) | 章节骨架与文档映射 |
| [**商业计划书初稿**](./business-plan.md) | 完整 Markdown 初稿（可直接对外改写） |

## 代码溯源说明

文档内容主要来自：

- 产品文案：`apps/web/src/lib/site-copy.ts`、`product-capabilities.ts`
- 商业规则：`apps/api/src/lib/subscription-plans.ts`、计费与订阅服务
- 数据模型：`apps/api/prisma/schema.prisma`、`packages/domain`
- Agent 编排：`apps/agent/src/graph.ts`、[agent-turn-queue.md](../technical/agent-turn-queue.md)
- 平台能力：`apps/api/src/lib/publish-platforms.ts`

若代码变更，请同步更新对应业务文档。

## 相关技术文档

- [根目录 README](../../README.md) — 开发与部署
- [agent-turn-queue.md](../technical/agent-turn-queue.md) — 回合队列与线程同步
- [version-graph.md](../technical/version-graph.md) — 版本时间轴
- [platform-oauth.md](../platform-oauth.md) — OAuth 技术配置
