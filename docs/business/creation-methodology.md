# 创作方法论：三步流水线

有感的核心产品逻辑是**分阶段确认**，而非单次 Prompt 生成全文。本文档描述业务规则与数据结构，便于商业计划书中作为「方法论 / 技术壁垒」章节素材。

## 总流程

```
灵感模式 ──► 大纲模式 ──► 创作模式 ──► 发布
   │              │              │
   ▼              ▼              ▼
 WorkInspiration  WorkOutline   GeneratedContent
```

用户可在**同一件作品**内任意时刻切换模式；切换后下一条消息进入对应 Agent 子图，侧栏「创作脉络」持续累积。

---

## 第一步：灵感模式（inspiration）

### 业务目标

在用户尚无清晰选题时，通过对话厘清：**平台、选题、受众、语气、内容类型**等，形成可执行的「已确认需求」。

### 交互原则（产品承诺）

- 每次问 **1–2 个问题**，帮用户想清楚，而非替用户做决定。
- 定期总结「目前理解是……」请用户确认。
- 确认后的需求写入侧栏 **「灵感」**，可补充、修改或删除。
- 方向清楚后建议进入大纲模式。

### 明确不做

- 不直接写出完整方案或正文。
- 不写入创作大纲、不生成正文。

### 数据对象：`WorkInspiration`

| 字段 | 含义 |
|------|------|
| `confirmed_requirements[]` | 用户逐条确认的需求（id、描述、确认时间） |
| `summary` | 阶段性理解摘要 |
| 其他探索态字段 | 对话过程中的临时状态 |

### 工具能力

- `confirm_requirement` / `update_requirement` / `delete_requirement` / `clear_inspirations`
- 确认后**即时**反映到侧栏，无需额外「总结步骤」

### 冷启动：灵感推荐

新建作品时，独立 Graph 根据**作品标题**生成 1–3 条可点击开场白（DeepSeek 结构化输出），降低空白页焦虑。

---

## 第二步：大纲模式（outline）

### 业务目标

将已确认灵感整理为**创作大纲**：结构、段落、风格、封面要求等，用户定稿后再进入出稿。

### 交互原则

- 每条要点记成**大纲条目**（`pending_changes`）。
- 主动询问「还有要补充的吗？」。
- 用户表示「没有了」「就这些」时，列出完整大纲请定稿。
- 定稿后生成大纲摘要，引导进入创作模式。

### 明确不做

- 大纲未定稿前**不生成正文**。
- 不用催促话术，等用户确认后再出稿。

### 数据对象：`WorkOutline`

| 字段 | 含义 |
|------|------|
| `pending_changes[]` | 待实现的大纲条目 |
| `executed_changes[]` | 已在成稿中落地的条目 |
| `outline_ready` | 是否已定稿 |
| `outline_summary` | 定稿摘要 |
| `last_execution_summary` | 最近一次创作执行摘要 |

### 灵感→大纲同步

进入大纲模式时可**自动**根据灵感生成待实现条目（`sync_outline_from_inspiration`，DeepSeek）；若已有成稿则对照已实现/待实现。用户也可手动触发同步。

---

## 第三步：创作模式（creation）

### 业务目标

针对**已定稿**的创作大纲，生成与修改标题、正文、话题标签等最终实现。

### 交互原则

- **严格按创作大纲出稿**，不跳过已定结构。
- 用户调整先记入**待执行项**，再统一执行。
- 每次执行产生**摘要**，便于对比版本。
- 可随时回到灵感或大纲模式调整方向。

### 明确不做

- 不跳过记录修改直接生成。
- 大纲未定稿时不应在此模式出稿。

### 数据对象：`GeneratedContent`（存于 `Work.creation`）

典型字段：`title`、`body`、`hashtags` 等（与发布、预览面板一致）。

### 闭环工具

- `complete_execution`：总结本次修改、更新 `executed_changes`、清空待执行列表。

---

## 跨模式共用：作品画像 `WorkProfile`

贯穿三模式的结构化上下文：

| 维度 | 字段 | 示例 |
|------|------|------|
| platform | 目标平台 | 小红书、公众号 |
| content_topic / content_type | 选题与自然语言描述 | 护肤心得、种草笔记 |
| **content_format** | **结构化体裁** | note、article、novel、video_script |
| **media_modality** | **结构化媒介形式** | text、image、audio、video、mixed |
| audience / tone / style | 受众与表达 | |
| persona / goals | 人设与目标 | |
| references[] | 参考素材 | text/image/web |

`content_format` 与 `media_modality` 与发现页 taxonomy 对齐，发布时优先作为分类来源。

### 内容规格确认（confirm_content_spec）

灵感/大纲模式中，当用户明确体裁或媒介（如「写小红书笔记」「做播客」）时，Agent 调用 `confirm_content_spec` 写入结构化字段；**不**在灵感模式使用 `update_work_profile` 写分类。

创作模式进入时会自动执行 `resolveContentSpec`，补齐缺失的体裁/形式字段。

---

## Agent Graph 架构

主图保持三模式路由（`apps/agent/src/graph.ts`）：

```text
START → routeByMode
  ├─ inspiration → inspirationGraph → END
  ├─ outline     → outlineGraph → clearInspirationChoices → END
  └─ creation    → creationGraph → clearInspirationChoices → END
```

### 创作子图（creationGraph）

创作模式内部采用 **解析 + 路由**，而非按体裁/形式拆成多个顶层 Agent：

```text
START → resolveContentSpec（补齐 content_format / media_modality）
     → routeByModality
          ├─ textCreation
          ├─ imageCreation   （当前复用文字 pipeline，notes 含配图建议）
          ├─ audioCreation   （当前复用文字 pipeline，口播稿）
          └─ videoCreation   （当前复用文字 pipeline，脚本稿）
     → END
```

- **体裁差异**：通过 prompt 与 `generate_content` 的写作约束体现（`format-prompts.ts`）
- **形式差异**：通过 pipeline 节点预留；audio/video/image 独立生成能力上线后替换对应节点
- 详见 [content-taxonomy.md](./content-taxonomy.md) 与 `apps/agent/src/lib/content-spec.ts`

---

## 创作台信息架构

| 区域 | 作用 |
|------|------|
| 左侧 | 作品列表、分组 |
| 中间 | 对话区（三模式共用） |
| 右侧「创作脉络」 | 灵感 / 创作大纲 / 内容预览 / 参考素材 |

与营销文案 `STUDIO_PANELS`、`CREATIVE_CONTEXT_PANEL` 一致。

---

## 推荐用户路径（标准作业程序 SOP）

| 步骤 | 模式 | 用户动作 | 产出 |
|------|------|----------|------|
| 01 | — | 新建作品 | 作品 + thread |
| 02 | 灵感 | 对话确认需求 | 侧栏灵感列表 |
| 03 | 大纲 | 补充并定稿 | `outline_ready` |
| 04 | 创作 | 生成并迭代 | 标题、正文、标签 |
| 05 | — | 发布 | 有感公域 / 第三方平台 |

---

## 对商业计划的意义

1. **可培训的 SOP**：适合制作教程、训练营、MCN 标准化交付。
2. **可计量的里程碑**：灵感条数、大纲定稿率、出稿次数可作为产品分析与计费基础（当前按「每次 LangGraph 请求」计费）。
3. **差异化叙事**：相对「ChatGPT 写一篇」强调**过程资产**（脉络侧栏）而非仅最终文本。
4. **扩展空间**：可按模式售卖模板、行业大纲库、品牌语气包等增值内容。
