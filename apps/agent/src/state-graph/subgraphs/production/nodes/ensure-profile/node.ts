/**
 * 制作子图节点：补全尚不可执行的 profile。
 * 进入制作前，根据用户消息与已有数据合理补全缺口字段。
 */
import { HumanMessage } from "@langchain/core/messages";

import {
  isProfileActionable,
  newProfileBeat,
  resolveContentSpecFromProfile,
  type WorkProfile,
} from "@yougan/domain";

import { createStructuredModel } from "#agent/model/dashscope.js";
import { invokeStructuredOutput } from "#agent/llm/structured-output.js";
import {
  getLatestHumanMessageImageUrls,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { resolveIndustryContext } from "../llm-call/prompt.js";
import {
  profileSummary,
  referencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { parseProfile } from "#agent/runtime/state-readers.js";
import { patchStagingProfile } from "#agent/runtime/staging-writes.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EnsureProfileResponseSchema,
  type EnsureProfileResponse,
} from "./schema.js";

export function shouldEnsureProfileForProduction(
  state: AgentStateType,
): boolean {
  return !isProfileActionable(parseProfile(state));
}

function buildEnsureProfilePrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  const userMessage = getLatestHumanMessageText(state.messages);
  const hasImages =
    getLatestHumanMessageImageUrls(state.messages).length > 0;
  const industry = resolveIndustryContext(resolveContentSpecFromProfile(profile));

  return `你是制作前方案补全助手（内部角色，不对${YOUGAN_USER_LABEL}直接说话）。
${YOUGAN_USER_LABEL}已触发**制作/出稿**，但作品方案尚不完整。请根据已有信息与用户最新消息，**合理推断并补全**缺失字段，使方案足以开写。

已有方案（保留已有非空字段，只补缺口）：
${profileSummary(profile)}

${referencesSummary(profile.references)}

行业经验：
${industry}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (hasImages ? "（仅上传图片，无文字说明）" : "（空）")}

请输出：
1. content_topic：创作主题（若已有则沿用或精炼）
2. premise：一句话定位
3. beats：3–8 个有序节拍
4. audience / tone：可据体裁合理默认
5. 只补结构，不生成正文`;
}

function applyEnsureProfileResponse(
  existing: WorkProfile,
  response: {
    content_topic: string;
    premise: string;
    beats: Array<{ description: string; intent?: string | null }>;
    audience?: string | null;
    tone?: string | null;
  },
): WorkProfile {
  const topic =
    existing.spec.content_topic?.trim() ||
    response.content_topic.trim() ||
    "未命名创作主题";

  return {
    ...existing,
    spec: {
      ...existing.spec,
      content_topic: topic,
    },
    voice: {
      ...existing.voice,
      audience:
        existing.voice.audience?.trim() ||
        response.audience?.trim() ||
        existing.voice.audience,
      tone:
        existing.voice.tone?.trim() ||
        response.tone?.trim() ||
        existing.voice.tone,
    },
    premise: existing.premise.trim() || response.premise.trim() || topic,
    beats:
      existing.beats.length > 0
        ? existing.beats
        : response.beats.map((b) => newProfileBeat(b.description, b.intent)),
  };
}

function fallbackProfile(
  state: AgentStateType,
  existing: WorkProfile,
): WorkProfile {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const topic =
    existing.spec.content_topic?.trim() ||
    userMessage.slice(0, 48) ||
    "未命名创作主题";

  return {
    ...existing,
    spec: { ...existing.spec, content_topic: topic },
    premise: existing.premise.trim() || topic,
    beats:
      existing.beats.length > 0
        ? existing.beats
        : [
            newProfileBeat("开篇钩子与核心观点"),
            newProfileBeat("主体内容与案例展开"),
            newProfileBeat("总结与行动号召"),
          ],
  };
}

export async function ensureProfileNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!shouldEnsureProfileForProduction(state)) {
    return {};
  }

  const existing = parseProfile(state);
  const llm = createStructuredModel({ temperature: 0.5 });

  try {
    const parsed = (await invokeStructuredOutput(
      llm,
      EnsureProfileResponseSchema,
      [new HumanMessage(buildEnsureProfilePrompt(state))],
      { name: "production_ensure_profile" },
    )) as EnsureProfileResponse;
    return patchStagingProfile(
      state,
      applyEnsureProfileResponse(existing, parsed),
    );
  } catch {
    return patchStagingProfile(state, fallbackProfile(state, existing));
  }
}
