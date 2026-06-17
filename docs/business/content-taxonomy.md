# 内容分类体系（Content Taxonomy）

有感的内容分类采用 **两层正交维度**，分别服务创作推断、发布确认与发现页筛选。

## 设计原则

| 阶段 | 用户是否感知分类 | 平台行为 |
|------|------------------|----------|
| 创作（灵感→创作→提问） | **不暴露**完整 taxonomy | AI 根据对话意图隐式写入 `Work.profile` |
| 发布 | **轻量确认** | 展示 AI 推断标签，用户可修改后发布 |
| 发现（消费） | **结构化筛选** | 使用稳定枚举字段驱动筛选与展示 |

核心思路：**创作时意图驱动，发布时确认标签，消费时结构化过滤。**

---

## 两层分类维度

### 1. 媒介形态（`mediaType`）

描述内容的**呈现载体**，决定未来渲染组件（阅读器 / 播放器 / 图库等）。

| ID | 标签 | 说明 |
|----|------|------|
| `text` | 纯文字 | 无配图 |
| `image` | 图文 | 以图片为主或短图文 |
| `audio` | 音频 | 播客、音乐、语音 |
| `video` | 视频 | 短视频、口播 |
| `mixed` | 混合 | 长文 + 配图 |

### 2. 内容体裁（`contentFormat`）

描述内容的**写作/叙事形式**，用于发现页「我想看什么类型」。

| ID | 标签 | 说明 |
|----|------|------|
| `note` | 图文笔记 | 小红书风格种草笔记 |
| `short_post` | 短帖动态 | 微博式短内容 |
| `article` | 长文深度 | 公众号式长文 |
| `blog` | 博客专栏 | 技术/观点专栏 |
| `novel` | 小说故事 | fiction、连载 |
| `video_script` | 视频脚本 | 口播稿、分镜文案 |
| `short_video` | 短视频 | 短视频成品（规划） |
| `podcast` | 播客 | 音频节目（规划） |
| `music` | 音乐音频 | BGM、歌曲（规划） |

### 3. 主题类别（`topicCategory`）

| ID | 标签 |
|----|------|
| `life` | 生活方式 |
| `career` | 职场成长 |
| `tech` | 科技数码 |
| `culture` | 人文艺术 |
| `story` | 故事叙事 |
| `knowledge` | 知识干货 |
| `brand` | 品牌营销 |
| `general` | 综合 |

### 4. 目标平台（`platform`）

创作时的分发目标，同时参与体裁推断兜底。

`yougan` · `xiaohongshu` · `weibo` · `wechat` · `douyin` · `kuaishou` · `bilibili`

---

## 分类推断流程

```mermaid
flowchart LR
  A[对话意图 / profile] --> B[buildPublicationMetadata]
  B --> C{正则匹配 content_type}
  C -->|命中| D[确定 contentFormat / mediaType]
  C -->|未命中| E[平台 + 正文长度兜底]
  D --> F[发布确认弹窗]
  E --> F
  F -->|用户可改| G[Publication 入库]
  G --> H[发现页 facet 筛选]
```

### 推断优先级

1. **`profile.intent.summary`** 自由文本 → 正则映射到 `contentFormat` / `topicCategory`
2. **`profile.delivery.format` / `profile.delivery.category`** → 结构化体裁与主题分类
3. **平台 + 正文长度 + 是否有配图** → 兜底推断
4. **发布时用户覆盖** → `applyMetadataOverrides` 校验 taxonomy ID 后写入

### 代码位置

| 模块 | 路径 |
|------|------|
| Taxonomy 定义与推断 | `packages/domain/src/utils/discover/taxonomy.ts` |
| 体裁写作约束 | `apps/agent/src/state-graph/subgraphs/production/helpers/format-guidance.ts` |
| 前端 taxonomy 展示 | `apps/web/src/lib/discover-taxonomy.ts` |
| 发布入库 | `apps/api/src/services/publications.ts` |
| 预览 API | `GET /api/publications/preview-metadata?workId=` |
| 发布 API | `POST /api/publications`（可选 `metadata` 覆盖） |

---

## 发布确认（Publish Confirm）

### 用户流程

1. production 子图生成 `preview.body`
2. 点击「发布到有感」→ 打开确认弹窗
3. 系统调用 `preview-metadata` 展示 AI 推断标签
4. 用户可在下拉框中修改：体裁 / 主题 / 媒介 / 平台
5. 确认后携带 `metadata` 覆盖项发布

### 为什么只在发布时暴露

- 创作过程中体裁可能变化（先写博客后改短帖）
- 发布是对外承诺的时刻，此时确认标签成本最低
- C 端用户心智是「我要发布了」，不是「我要填 metadata」

---

## 发现页消费意图

发现页（`/content`）提供两层入口：

### 消费意图快捷入口

| 入口 | 筛选条件 |
|------|----------|
| 读故事 | `topicCategory=story` |
| 看干货 | `topicCategory=knowledge` |
| 刷笔记 | `contentFormat=note` |
| 听内容 | `mediaType=audio` |
| 看视频 | `mediaType=video` |

### 详细筛选面板

平台形态 · 内容体裁 · 主题类别 · 媒介形态（四维 facet，仅展示有内容的选项）

---

## 创作侧 profile 字段

`Work.profile` 按五步组织（Studio「制作方案」侧栏）：

| 步骤 | 字段 | 用途 |
|------|------|------|
| ① 创作定位 | `intent.summary` | 一句话说清作品要做什么；发布推断 `contentTopic` |
| ② 体裁与参数 | `delivery.format` / `params` / `platform` / `category` | 结构化体裁、平台与主题分类 |
| ③ 表达设定 | `expression.*` | 受众、文字与画面风格 |
| ④ 结构与要素 | `structure.settings` / `segments` | 固定设定与结构节拍 |
| ⑤ 创作规则 | `constraints.rules` | 必须遵守或需避免的事项 |

参考素材在 `Work.references` 顶层维护，不在 `profile` 内。

### Agent 写入时机

| 阶段 | 入口 | 行为 |
|------|------|------|
| 侧栏 / API | `PATCH Work` + 线程同步 | 可更新 `profile`、`references`、`preview` |
| 聊天 | profile / reference / production / ask 子图 | 对话工具改方案、参考与作品预览 |
| 定方案 | profile 子图按步骤工具 | 用户明确体裁/形式/结构/规则时写入对应步骤 |
| 备参考 | reference 子图 `preprocessReferences` | 新附件预处理分析入库 |
| 制作入口 | `planProduction` 节点 | 创意总监基于现有方案（可不完整）制定制作计划 |
| 制作执行 | `execute_task` 等 | 单任务执行、方向验收、备妥后整合 |
| 发布 | 发布确认弹窗 | 用户可覆盖最终分类 |

回合队列与线程同步详见 [agent-turn-queue.md](../technical/agent-turn-queue.md)。

---

## 扩展规划

| 能力 | 当前状态 | 下一步 |
|------|----------|--------|
| 文本文案生成 | ✅ 已实现 | — |
| 配图 | 部分（Publication 支持 images） | 生成工具写入 images |
| 音频/视频 | taxonomy 已预留 | 增加生成 pipeline + 渲染组件 |
| 外部平台一键发布 | OAuth 脚手架 | 与发布流程打通 |

当音频/视频生成能力上线后，`mediaType=audio|video` 的推断将不仅依赖 `content_type` 关键词，还会检测成稿中的媒体附件。
