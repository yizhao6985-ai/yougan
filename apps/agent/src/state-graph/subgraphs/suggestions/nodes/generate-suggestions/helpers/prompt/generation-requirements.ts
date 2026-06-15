import {
  buildProfileSetupSuggestionSlotRecipe,
  type ProfileSetupSuggestionFocus,
  type WorkProfile,
} from "@yougan/domain";

import type { NextStepSuggestionsPromptInput } from "./types.js";

function buildTopicModeRequirements(count: number): string {
  return `

## 开题要求（作品尚空白）
- 每条 = 一个**具体可执行的创作方向**（含场景/对象/切口/体裁），像用户会真的动手做的那件作品
- message 里要点名：做什么、给谁看、什么角度或表达形式；覆盖图文、绘画、音视频等不同形态
- 好例：「我想做一组赛博朋克城市插画，面向科幻爱好者，偏霓虹夜景」
- 坏例（禁止）：「聊聊方向」「定受众」「找灵感」「探索可能性」「优化内容」「理清思路」
- 恰好 ${count} 条，互斥、可区分，覆盖不同子题/体裁/切口，全部落在标题相关领域内`;
}

function buildProfileSetupRequirements(
  count: number,
  focus?: ProfileSetupSuggestionFocus,
  profile?: WorkProfile,
): string {
  const slotRecipe = focus
    ? `\n\n${buildProfileSetupSuggestionSlotRecipe(focus, count, profile)}`
    : "";

  return `

## 生成要求（方案步骤引导 · 巩固 3 + 推进 1）
- 只需输出 message；step/role 由系统按槽位配方自动写入，勿在 JSON 里填写
1. **巩固层（前 3 条）**：锚定**当前推进步**，给灵感与可填入示例；须互斥、可区分
2. **推进层（最后 1 条）**：引导用户**进入下一步**（见槽位配方中的下一步 step）；message 须像用户主动推进，可简要承接本步已聊内容并点明要去做的下一步
3. 下一步为 ready 时：推进层引导「开始制作」
4. 推进层好例（当前为创作定位、下一步为体裁）：「定位清楚了，接下来定体裁和发布平台」；坏例：「这一步可以填 summary」（元说明、非用户口吻）
5. 禁止空泛套话（「继续填写」「聊聊方向」）；禁止巩固层内容偏离当前步
6. 恰好 ${count} 条，顺序与槽位配方一致
7. hint：说明「前 3 条给当前步灵感，最后 1 条引导下一步」${slotRecipe}`;
}

function buildTurnRequirements(count: number): string {
  return `

## 生成要求
1. 结合当前阶段（方案拟定 / 答疑 / 出稿 / 改稿 / 发布准备）给出**具体可执行**的下一步，承接上表状态与（若有）用户上一条消息
2. **禁止**把已有方案或成稿进度当成空白来推「开题」；不要生成「我想做一件…具体方向」类 message，除非作品规格里确实尚无创作主题且用户在补创作方向
3. message 须像用户亲自打字，点名方案中的具体主题、节拍或段落；禁止空泛套话（如「聊聊方向」「找灵感」「理清思路」「探索可能性」）
4. 恰好 ${count} 条，互斥、可区分`;
}

export function buildGenerationRequirements(
  input: NextStepSuggestionsPromptInput,
  profile?: WorkProfile,
): string {
  if (input.topicMode) {
    return buildTopicModeRequirements(input.count);
  }
  if (input.profileSetupMode) {
    return buildProfileSetupRequirements(
      input.count,
      input.profileSetupFocus,
      profile,
    );
  }
  return buildTurnRequirements(input.count);
}
