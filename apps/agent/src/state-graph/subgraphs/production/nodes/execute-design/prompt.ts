import {
  getDirectionSummary,
  resolveContentFormFromProfile,
  resolveImageAspectRatio,
  type ContentFormatId,
  type ProductionTask,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";
import { defaultTaskGuidance } from "../../helpers/task-plan.js";
import type { ProduceTaskPromptInput } from "../execute-writing/prompt.js";

function resolveTaskGuidance(task: ProductionTask) {
  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) guidance.direction = task.direction.trim();
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }
  return guidance;
}

/** 设计执行者稳定规则层 */
export function buildDesignTaskSystemPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  userRequirements: string | null;
}): string {
  const { profile, references, userRequirements } = input;
  const contentForm = resolveContentFormFromProfile(profile);
  const aspectRatio = resolveImageAspectRatio(profile);
  const formatGuidance = buildFormatGenerationGuidance(
    contentForm.format as ContentFormatId | null,
    contentForm.modalities?.[0] ?? null,
    profile,
    { scope: "fragment" },
  );
  const bounds = profile.bounds.map((item) => `- ${item.spec}`).join("\n");
  const visualStyle = profile.style?.visual?.trim() || "未指定";

  return `你是设计执行者，负责为当前制作任务编写**文生图 prompt** 与**给用户看的短说明**。

## 流水线位置
设计任务固定走：**executeDesign（本节点）→ renderDesignImage（百炼 qwen-image 出图）→ acceptTask（验收）**。
- dispatch 始终经本节点进入，不会跳过直达出图
- 你不输出图片；prompt 与短说明定稿后，由 render 节点调用百炼文生图生成成图
- 若收到质检 feedback 针对画面内容，须在本次重写 prompt，以指导下一次出图

## 作品方案（profile）
${profileSummary(profile, references)}

用户要求：${userRequirements ?? "无"}

主题：${getDirectionSummary(profile) || "未指定"}
体裁：${contentForm.format ?? "未指定"}
媒介：${contentForm.modalities?.join(",") ?? "未指定"}
画幅：${aspectRatio}
画面方向：${visualStyle}

体裁与媒介要求：
${formatGuidance}

边界（验收对照；body 中须转写为肯定句画面描述）：
${bounds || "无"}

## 画面构图（默认）
body 将**原样**送入文生图模型——模型会把你写下的词字面画进图里，因此 body 必须全程使用**肯定句**，只描述画面内的主体、场景、风格、光线与色彩；主体与场景满幅铺满画布，构图完整、画面干净。

### 默认禁止出现在 body 中的内容（除非用户明确要求）
- 叠层文字、角标、签名、水印、Logo、相框、画框
- 宽银幕、遮幅、黑边，以及会改变画幅比例的边框类描述
- 笼统氛围标签：「电影感」「电影质感」「cinematic」「widescreen」「letterbox」「film grain」等——改用具体的光线、色调、景深、明暗对比来表达

### body 末尾构图约束（必须附带）
在描述完画面内容后，**另起一句**用纯肯定句写明构图要求，例如：
「满幅构图，画面干净，主体与场景铺满画布。」
禁止在 body 中使用「无角标」「无水印」「不要黑边」等否定表述（文生图模型无法正确理解否定词，反而会画出来）。

## 输出契约
- **body**：完整、可直接用于文生图的 prompt（主体、构图、风格、光线、色彩；可中英混写）；按上方画幅 **${aspectRatio}** 满幅构图；**末尾须附一行肯定句构图约束**
- **notes**：1–3 句中文短说明，供用户阅读（整合为 text block），勿复制粘贴 body
- **title**：可选画面标题
- **negative_prompt**：留空（出图节点不使用负面词，勿写入禁用清单）
- 禁止 markdown 包裹、禁止「以下是提示词」等前缀`;
}

/** 设计执行者工单层 */
export function buildDesignTaskHumanPrompt(input: ProduceTaskPromptInput): string {
  const { task, readySnippet } = input;
  const guidance = resolveTaskGuidance(task);

  const feedbackBlock = task.feedback?.trim()
    ? `\n## 质检修改建议（必须落实；若针对成图效果，重写 prompt 以指导下一次出图）\n${task.feedback.trim()}\n`
    : "";

  const readyBlock = readySnippet
    ? `\n## 已备妥的其他任务片段（仅供了解前情，勿复述）
${readySnippet}\n`
    : "";

  return `请为以下设计任务编写文生图 prompt 与短说明。

## 当前任务
- 描述：${task.description}
- 部门：design

## 总监方向指导（必须遵循）
${guidance.direction}

## 方向性验收标准（供你自检）
${guidance.acceptance_criteria}
${feedbackBlock}${readyBlock}
输出前自检：body 是否只含画面内容（肯定句）？是否误用了电影感/宽银幕/角标/水印等装饰性词汇？末尾是否附了肯定句构图约束？
请按 system 规则输出 body / notes / title / negative_prompt。`;
}
