# 术语表

商业、产品与代码中常见术语对照，便于商业计划书与研发沟通一致。

| 术语 | 英文/代码 | 含义 |
|------|-----------|------|
| 有感 | Yougan | 产品品牌 |
| 作品 | Work | 一次完整创作容器，对应一段 AI 对话与一个 LangGraph thread |
| 作品分组 | WorkGroup | 按栏目/系列组织多件作品 |
| 灵感模式 | `inspiration` | 找选题、确认需求，不出正文 |
| 大纲模式 | `outline` | 撰写并定稿创作大纲 |
| 创作模式 | `creation` | 按已定稿大纲生成/修改成稿 |
| 创作脉络 | Creative Context Panel | Studio 右侧栏：灵感、大纲、预览、参考素材 |
| 已确认灵感 | `confirmed_requirements` | 灵感模式中用户确认的需求条目 |
| 创作大纲 | `WorkOutline` / pending_changes | 待实现与已实现的大纲条目集合 |
| 待执行修改 | pending_changes（创作模式） | 用户提出、尚未执行的修改项 |
| 定稿 | `outline_ready` | 大纲模式确认完成，可进入创作模式 |
| 成稿 | `GeneratedContent` / creation | 标题、正文、标签等最终实现 |
| 发布 | Publication | 将成稿发布为有感平台可读内容 |
| 发现灵感 | Discover | 公域内容浏览页 `/content` |
| AI 创作（次） | `consumeAiUsage` | 计费单位，每次 LangGraph 代理请求计 1 |
| 免费版 / Pro | `free` / `pro` | 订阅套餐 ID |
| 平台集成 | PlatformIntegration | 用户绑定的第三方平台 OAuth 账号 |
| 灵感推荐 | inspiration-recommendations graph | 新建作品时的 1–3 条开场建议 |
| Thread | `threadId` | LangGraph 会话标识，存于 Agent checkpoint 库 |
| 模拟支付 | mock checkout | 下单即标记已支付，无真实资金通道 |
