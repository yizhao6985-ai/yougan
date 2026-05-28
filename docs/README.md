# 有感 · 文档中心

## 业务文档（商业计划书素材）

面向产品、运营、融资的**业务梳理**，均基于当前代码与文案整理：

→ **[docs/business/](./business/README.md)**

| 文档 | 内容 |
|------|------|
| [产品定位与价值主张](./business/product-positioning.md) | 问题、解决方案、差异化 |
| [目标用户与场景](./business/target-users.md) | 用户画像、使用场景 |
| [用户旅程](./business/user-journeys.md) | 获客→激活→变现→留存 |
| [功能目录](./business/feature-catalog.md) | 功能清单与实现状态 |
| [创作方法论](./business/creation-methodology.md) | 灵感·大纲·创作三步模型 |
| [内容与社区](./business/content-ecosystem.md) | 发现灵感、发布、主页 |
| [商业化与定价](./business/monetization.md) | 套餐、计费、单位经济 |
| [平台集成](./business/platform-integrations.md) | 多平台 OAuth 与分发 |
| [竞争与替代](./business/competitive-positioning.md) | 定位、SWOT |
| [产品成熟度与规划](./business/product-maturity.md) | 缺口、路线图、风险 |

撰写商业计划书时，建议结构：

1. 执行摘要 ← `product-positioning` + `monetization` 摘要  
2. 市场与用户 ← `target-users` + `competitive-positioning`  
3. 产品与服务 ← `creation-methodology` + `feature-catalog`  
4. 商业模式 ← `monetization` + `platform-integrations`  
5. 运营与增长 ← `user-journeys` + `content-ecosystem`  
6. 进展与计划 ← `product-maturity`  

**完整初稿**：[business/business-plan.md](./business/business-plan.md)

## 技术文档

| 文档 | 说明 |
|------|------|
| [根目录 README](../README.md) | Monorepo 架构、本地开发、常用命令 |
| [apps/web/README.md](../apps/web/README.md) | 前端路由、环境变量 |
| [apps/api/README.md](../apps/api/README.md) | API 路由、Prisma、OpenAPI |
| [apps/agent/README.md](../apps/agent/README.md) | LangGraph、模型分工 |
| [platform-oauth.md](./platform-oauth.md) | 第三方平台 OAuth 环境变量与回调 |

## 文档维护原则

- **业务文档**随产品文案、定价、功能门禁变更而更新。
- **技术文档**随架构、命令、环境变量变更而更新。
- 商业计划书中的**市场规模数字**需另行调研，业务文档不提供虚构 TAM 数据。
