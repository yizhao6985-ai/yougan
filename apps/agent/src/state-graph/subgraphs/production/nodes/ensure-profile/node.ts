/**
 * 制作子图节点：补全尚不可执行的 profile。
 * 进入制作前，根据用户消息与已有数据合理补全缺口字段。
 */
import { HumanMessage } from "@langchain/core/messages";

import {
  isProfileActionable,
  newProfileSegment,
  resolveDeliveryFromProfile,
  type WorkProfile,
} from "@yougan/domain";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { resolveIndustryContext } from "../llm-call/prompt.js";
import {
  profileSummary,
  profileReferencesSummary,
} from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import { getProfile, getReferences } from "#agent/state-io/index.js";
import { patchPendingProfile } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";
import {
  EnsureProfileResponseSchema,
  type EnsureProfileResponse,
} from "./schema.js";

export function shouldEnsureProfileForProduction(
  state: AgentStateType,
): boolean {
  return !isProfileActionable(getProfile(state));
}

function buildEnsureProfilePrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const userMessage = getLatestHumanMessageText(state.messages);
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;
  const industry = resolveIndustryContext(resolveDeliveryFromProfile(profile));

  return `你是制作前方案补全助手（内部角色，不对${YOUGAN_USER_LABEL}直接说话）。
${YOUGAN_USER_LABEL}已触发**制作/出稿**，但作品方案尚不完整。请根据已有信息与用户最新消息，**合理推断并补全**缺失字段，使方案足以开写。

已有方案（保留已有非空字段，只补缺口）：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

行业经验：
${industry}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}

请输出：
1. topic：创作主题（若已有则沿用或精炼）
2. summary：一句话定位
3. segments：3–8 个有序结构段
4. audience / tone：可据体裁合理默认
5. 只补结构，不生成正文`;
}

function applyEnsureProfileResponse(
  existing: WorkProfile,
  response: EnsureProfileResponse,
): WorkProfile {
  const topic =
    existing.delivery.topic?.trim() ||
    response.topic.trim() ||
    "未命名创作主题";

  return {
    ...existing,
    delivery: {
      ...existing.delivery,
      topic,
    },
    expression: {
      ...existing.expression,
      audience:
        existing.expression.audience?.trim() ||
        response.audience?.trim() ||
        existing.expression.audience,
      verbal: {
        ...existing.expression.verbal,
        tone:
          existing.expression.verbal?.tone?.trim() ||
          response.tone?.trim() ||
          existing.expression.verbal?.tone,
      },
    },
    blueprint: {
      summary:
        existing.blueprint.summary.trim() || response.summary.trim() || topic,
      segments:
        existing.blueprint.segments.length > 0
          ? existing.blueprint.segments
          : response.segments.map((s) =>
              newProfileSegment(s.description, s.role),
            ),
    },
  };
}

function fallbackProfile(
  state: AgentStateType,
  existing: WorkProfile,
): WorkProfile {
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const topic =
    existing.delivery.topic?.trim() ||
    userMessage.slice(0, 48) ||
    "未命名创作主题";

  return {
    ...existing,
    delivery: { ...existing.delivery, topic },
    blueprint: {
      summary: existing.blueprint.summary.trim() || topic,
      segments:
        existing.blueprint.segments.length > 0
          ? existing.blueprint.segments
          : [
              newProfileSegment("开篇钩子与核心观点", "hook"),
              newProfileSegment("主体内容与案例展开", "point"),
              newProfileSegment("总结与行动号召", "cta"),
            ],
    },
  };
}

export async function ensureProfileNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  if (!shouldEnsureProfileForProduction(state)) {
    return {};
  }

  const existing = getProfile(state);
  const llm = createChatModel({ temperature: 0.5 });

  try {
    const parsed = (await invokeStructured(
      llm,
      EnsureProfileResponseSchema,
      [new HumanMessage(buildEnsureProfilePrompt(state))],
      { name: "production_ensure_profile" },
    )) as EnsureProfileResponse;
    return patchPendingProfile(
      state,
      applyEnsureProfileResponse(existing, parsed),
    );
  } catch {
    return patchPendingProfile(state, fallbackProfile(state, existing));
  }
}
