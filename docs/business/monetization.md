# 商业化与定价

## 收入模式

有感采用 **SaaS 订阅制**，以 **AI 额度百分比** 对用户展示，内部按 token 成本（microCredits）计量。

| 收入来源 | 状态 | 说明 |
|----------|------|------|
| 付费订阅 | 已实现（模拟支付） | Pro / Pro+ 月付/年付 |
| 免费版 | 已实现 | 获客与体验完整流程 |
| 真实支付手续费 | 待接入 | 微信/支付宝等 |

---

## 套餐定义（代码为准）

来源：`apps/api/src/lib/subscription-plans.ts`

| 档位 | 月价 | 年付 | 月 API 预算 (microCredits) |
|------|------|------|---------------------------|
| 免费版 `free` | ¥0 | — | 800,000（¥8） |
| Pro `pro` | ¥68 | ¥678 | 2,550,000（¥25.5） |
| Pro+ `pro_plus` | ¥128 | ¥1,278 | 5,200,000（¥52） |

1 microCredit = ¥0.0001。用户仅看到 **usagePercent**，不暴露 token 与金额。

---

## 计费规则

1. LangGraph run **开始前**：`assertAiQuotaAvailable`（usagePercent < 100）。
2. Agent 每轮 LLM 调用在 `llm/invoke/` 累计 `runMetering`。
3. Stream **成功且 turn.committed** 后：`settleAiUsage(microCredits)`，按 checkpoint id 幂等。
4. 单次消耗 = Σ(上行 token × 模型输入单价 + 下行 token × 模型输出单价)。

模型单价表：`packages/domain/src/utils/ai-metering/pricing.ts`

---

## 周期重置

| 套餐 | 周期 |
|------|------|
| 免费版 | 自然月（UTC 月首重置 `aiUsageMicroCredits`） |
| 付费 | 订阅周期（月付/年付对应 `currentPeriodStart/End`） |

---

## 功能门禁

| 能力 | 免费 | Pro | Pro+ |
|------|------|--------|-----|
| 用量展示 | 仅 % | 仅 % | 仅 % |
| 平台 OAuth 发布 | 否 | 是 | 是 |
| 响应优先级 | 标准 | 标准 | 优先 |

Agent 代理层在额度用尽时返回 402 `QUOTA_EXCEEDED`。
