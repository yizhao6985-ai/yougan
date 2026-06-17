# 有感 · 商业计划书素材库（BP Source Materials）

本目录是为**撰写商业计划书（BP）**准备的素材底稿。所有事实性内容（品牌、定价、套餐、计量、平台、模型、数据模型、功能状态）均**核验自当前代码与配置**，可直接引用；市场规模、财务预测、团队与融资信息为**框架与占位**，须由创始团队用调研数据和真实运营数据替换。

> 校准日期：2026-06。代码若变更，请先更新本目录 `00-fact-sheet.md`，再调整其余素材与 BP 正文。

## 与 `docs/business/` 的关系

| 目录 | 定位 |
|------|------|
| `docs/bp/`（本目录） | **事实底稿 + 按 BP 章节归档的写作素材**；强调可核验、标注「已核验 / 待调研 / 待填」 |
| `docs/business/` | 已成稿的**业务叙事文档**与一份 BP 初稿（`business-plan.md`） |

两者互补。注意：`docs/business/` 部分文档（定价、套餐、平台数量、计量单位）写于旧版本，与现行代码已有出入；**以本目录 `00-fact-sheet.md` 为准**。差异详见该文末「与旧文档的差异」。

## 素材清单

| 文件 | 内容 | 对应 BP 章节 |
|------|------|--------------|
| [00-fact-sheet.md](./00-fact-sheet.md) | **事实底稿**：品牌、定价、计量、平台、模型、数据模型、功能状态 | 全篇引用基准 / 附录 |
| [01-executive-summary.md](./01-executive-summary.md) | 一句话、电梯演讲、执行摘要要点 | 执行摘要 |
| [02-problem-and-market.md](./02-problem-and-market.md) | 痛点、趋势、TAM/SAM/SOM 框架 | 问题与市场机会 |
| [03-product-and-solution.md](./03-product-and-solution.md) | 三步方法论、创作台、文生图、发现灵感、技术架构 | 产品与服务 |
| [04-users-and-scenarios.md](./04-users-and-scenarios.md) | 用户画像、使用场景、非目标用户 | 目标市场与客户 |
| [05-business-model-and-pricing.md](./05-business-model-and-pricing.md) | 收入结构、三档套餐、microCredit 计量、单位经济 | 商业模式与定价 |
| [06-competition.md](./06-competition.md) | 竞争格局、差异化、SWOT、护城河 | 竞争分析 |
| [07-gtm-and-growth.md](./07-gtm-and-growth.md) | AARRR 漏斗、获客/激活/转化/留存、KPI | 市场进入与增长 |
| [08-roadmap-and-milestones.md](./08-roadmap-and-milestones.md) | 产品成熟度、里程碑、资金用途 | 运营计划 / 里程碑 |
| [09-financials-and-financing.md](./09-financials-and-financing.md) | 财务假设、单位经济模型、团队与融资占位 | 财务预测 / 融资 |
| [10-risks-and-faq.md](./10-risks-and-faq.md) | 风险与对策、投资人常见问答 | 风险 / 附录 |
| [11-glossary.md](./11-glossary.md) | 产品与技术术语对照 | 附录 |

## 使用说明

1. **先读 `00-fact-sheet.md`**，所有数字以此为准，避免 BP 与产品现状矛盾。
2. 每篇素材标注三类信息：
   - **【已核验】** 来自代码/配置，可直接写入 BP。
   - **【待调研】** 需第三方行业报告或市场数据支撑（如 TAM）。
   - **【待填】** 需创始团队补充（团队、融资额、联系方式、真实运营数据）。
3. 写作时把内部字段名（如 `production`、`microCredits`）改写为投资人可读表述。
4. 所有金额、用户数、增长率须与财务模型一致。

## 代码溯源（事实来源文件）

- 定价/套餐：`apps/api/src/lib/subscription-plans.ts`
- 计量与模型价：`packages/domain/src/utils/ai-metering/`（`pricing.ts`、`types.ts`）
- 模型目录：`apps/agent/src/llm/providers/catalog.ts`
- 平台清单：`packages/domain/src/models/taxonomy/platform.ts`
- 数据模型：`apps/api/prisma/schema.prisma`
- 产品文案：`apps/web/src/lib/site-copy.ts`、`product-capabilities.ts`
- 文生图链路：`docs/technical/design-image-generation.md`
- Agent 工作流：`docs/technical/agent-turn-queue.md`
