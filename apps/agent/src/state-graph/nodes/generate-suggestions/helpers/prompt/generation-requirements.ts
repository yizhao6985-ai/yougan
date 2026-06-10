import type { NextStepSuggestionsPromptInput } from "./types.js";

function buildTopicModeRequirements(count: number): string {
  return `

## 开题要求（作品尚空白）
- 每条 = 一个**具体可执行的创作方向**（含场景/对象/切口/体裁），像用户会真的动手做的那件作品
- message 里要点名：做什么、给谁看、什么角度或表达形式
- 好例：「我想做一组赛博朋克城市插画，面向科幻爱好者，偏霓虹夜景」
- 坏例（禁止）：「聊聊方向」「定受众」「找灵感」「探索可能性」「优化内容」「理清思路」
- 恰好 ${count} 条，互斥、可区分，覆盖不同子题/体裁/切口，全部落在标题相关领域内
- kind 以 explore 为主
- label：方向短名（≤10 字）`;
}

function buildTurnRequirements(count: number): string {
  return `

## 生成要求
1. 结合当前阶段（方案拟定 / 答疑 / 出稿 / 改稿 / 发布准备）给出**具体可执行**的下一步，承接上表状态与（若有）用户上一条消息
2. **禁止**把已有方案或成稿进度当成空白来推「开题」；不要生成「我想做一件…具体方向」类消息，除非作品规格里确实尚无创作主题且用户在补创作方向
3. message 须像用户亲自打字，点名方案中的具体主题、节拍或段落；禁止空泛套话（如「聊聊方向」「找灵感」「理清思路」「探索可能性」）
4. label ≤10 字；message 一句说清、可稍长，点击后原样发送
5. kind：explore / confirm / navigate 按意图选择；用户已表达开写/出稿意图，或 assistant 刚确认可开始时，用 navigate 引导进入出稿或改稿
6. 恰好 ${count} 条，互斥、可区分`;
}

export function buildGenerationRequirements(
  input: NextStepSuggestionsPromptInput,
): string {
  return input.topicMode
    ? buildTopicModeRequirements(input.count)
    : buildTurnRequirements(input.count);
}
