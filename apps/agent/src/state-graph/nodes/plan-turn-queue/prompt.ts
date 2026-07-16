/** planTurnQueue 用：根据用户最新消息判定 turnQueue kinds */
import {
  buildProfileSetupProgressOptions,
  getActiveProfileStep,
  getProfileStepCopy,
  isProfileSetupReady,
  previewHasContent,
  previewSelectionsSummary,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import {
  getPreview,
  getProduction,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import { getLatestHumanMessagePreviewSelections, getLatestHumanMessageText } from "#agent/messages/human.js";

function buildProfileWizardContext(state: AgentStateType): string {
  const profile = getProfile(state);
  const profileSetupOptions = buildProfileSetupProgressOptions({
    profile,
    preview: getPreview(state),
    production: getProduction(state),
  });
  const activeStep = getActiveProfileStep(
    profile,
    profileSetupOptions.skippedSteps ?? [],
    { lockAtReady: profileSetupOptions.lockAtReady },
  );
  const activeStepTitle = getProfileStepCopy(profile, activeStep).title;
  const setupReady = isProfileSetupReady(profile);

  if (!setupReady) {
    return `- 方案向导：当前在「${activeStepTitle}」步；创作定位或体裁未齐 → 只 output profile，**禁止** production`;
  }

  if (activeStep === "ready") {
    return `- 方案向导：已到「${activeStepTitle}」（定位与体裁已齐）；仅当用户**明确要求**开写/整稿重做时可 output production`;
  }

  return `- 方案向导：当前在「${activeStepTitle}」步（定位与体裁已齐，其余步可跳过）；用户在完善风格/背景/需求/边界 → 默认 profile；但若明确说开写/出稿/开始制作/开始创作/可以写了 → **必须** output production，**禁止**因可选步未填而拒绝`;
}

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const hasPreview = previewHasContent(getPreview(state));
  const previewSelections = getLatestHumanMessagePreviewSelections(
    state.messages,
  );
  const hasPreviewSelection = previewSelections.length > 0;
  const selectionSummary = previewSelectionsSummary(previewSelections);

  const messageBody = [
    selectionSummary,
    userMessage.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  return `你是回合 workflow 助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**（仅子图路由，不对用户回复）。

## 可选 kind
- **profile**：改作品方案（定位/选题/体裁/受众/节拍/边界/记入方案）
- **production**：开写或**整稿重做**（无 preview 时明确开写；有 preview 时「重写/另写一版/按方案重新生成/重新制作」——走制作流水线，**不是**在现有成稿上改）
- **collectRevision**：有成稿时，**局部**修改意见（改标题/某段/语气等，写入改稿清单，**不立刻改稿**）
- **revise**：明确要求**现在执行改稿**（「开始改稿 / 按清单改 / 就这些改吧 / 可以改了」——在现有成稿上改，**不重做**）
- **ask**：纯答疑（不改方案、不改成稿、不开写）

**suggestions** 由系统与主回合并行生成、commitTurn 时提交，**勿入队**。

## 改稿 vs 整稿重做（有成稿时**最易混淆**，须严格区分）
- **改稿**（collectRevision / revise）：保留现有成稿，只改其中一部分；用户会点名标题、段落、语气、长度等**局部**问题，或要求「按清单改」
- **整稿重做**（production）：放弃/覆盖当前成稿，按**作品方案**重新走制作流水线；用户会说「重写/另写/重新生成作品/按方案重新制作/不要这篇了重新写」等**整篇级**动作
- 「重新生成」若指向**整篇作品/成稿**或**按方案**→ **production**；若仅指某段/标题等局部 → **collectRevision**
- production 与 collectRevision / revise **互斥**：整稿重做时**禁止**输出 collectRevision 或 revise

## kind 分工速查
| 用户说法 | kind | 说明 |
| 「标题太硬 / 第二段改软一点 / 加个小标题」 | collectRevision | 局部改稿，只记清单 |
| 「开始改稿 / 按刚才说的改 / 就这些改吧」 | revise | 在现有成稿上执行改稿 |
| 「重写一版 / 另写一篇 / 使用方案重新生成作品 / 按方案重新制作」 | production | 整稿重做，非改稿 |
| 「定位改成职场新人 / 体裁换短视频脚本」 | profile | 改方案，非改成稿 |
| 「小红书标题一般多长？」 | ask | 纯答疑 |

## 有成稿（has_preview=true）
- has_preview_selection=true 且用户补充修改说明 → **collectRevision**
- 针对成稿的**局部**润色/改标题/改段落/语气/长度等 → **collectRevision**（除非明确改方案或整稿重做）
- 明确改方案字段 → **profile**
- 要求执行改稿（按清单/就这些改）→ **revise**；仅补充局部意见、未要求执行 → **collectRevision**
- 整稿重做（重写/另写/重新生成作品/按方案重新制作/不要这篇）→ **production**（**禁止** collectRevision / revise）
- 纯咨询 → ask

## 无 preview
- 聊方案/补方向/记要求/确认细节 → profile
- **仅**当用户明确说开写/出稿/开始制作/开始创作/可以写了 → production（定位+体裁已齐时，**不论**其余步是否填完，**必须** output production）
- 纯咨询 → ask

## 禁止误触 production（重要）
- 「好的 / 继续 / 可以 / 没问题 / 就这样 / 方案可以了 / 再补充…」→ **仅 profile**，禁止 production
- 「写一下背景」「帮我写人设」「补一下风格」等是记方案 → **仅 profile**，不是开写成稿
- 创作定位或体裁未齐 → **禁止** production（先补定位与体裁）
- 风格/背景/需求/边界等未填 → **不构成**拒绝开写的理由；用户一旦明确说开始制作/开写/出稿/可以写了 → **必须** production
- 方案内容已较完整 → **不等于**用户要求开写；未听到明确开写口令时 **禁止** output production
- 系统另有「开始创作」确认环节；planner 不得替用户决定开写

## 复合意图
一条消息可同时触发多个 kind（如既改方案又提问）。按 profile → production → collectRevision → revise → ask 排序。

队列至少 1 项。

当前上下文：
- has_preview: ${hasPreview}
- has_preview_selection: ${hasPreviewSelection}
${buildProfileWizardContext(state)}
- 作品方案：${profileSummary(profile, references)}

${YOUGAN_USER_LABEL}最新一条消息：
${messageBody || "（空）"}`;
}
