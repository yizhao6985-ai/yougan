/** tool：仅请求 generateDraft work node，内部不调 LLM */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  hasProfileSegments,
  isPlanReady,
  isProfileActionable,
} from "@yougan/domain";
import {
  getActiveTurnKind,
  getProductionPlan,
  getProfile,
  getState,
  patchPendingProductionMeta,
} from "#agent/state-io/index.js";

export const generateDraft = tool(
  async (_input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const state = getState();

    if (getActiveTurnKind(state) !== "production") {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "generate_draft 仅在制作模式可用。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const profile = getProfile(state);
    const plan = getProductionPlan(state);

    if (!hasProfileSegments(profile)) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "生成被阻止：尚无作品方案结构段。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    if (!plan.pending_tasks.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "生成被阻止：内部创作计划尚无待执行任务。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    if (!isPlanReady(plan)) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "生成被阻止：创作计划尚未就绪。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    if (!isProfileActionable(profile)) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "生成被阻止：请先在作品方案中确认创作主题与结构段。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已提交文案出稿任务，将由文案总监执行。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProductionMeta(state, { pendingGenerateDraft: true }),
      },
    });
  },
  {
    name: "generate_draft",
    description:
      "文案管线专用：文案总监根据内部计划生成或更新成稿。须先 add_plan_task；设计/音频/视频请用 spawn_specialist。",
    schema: z.object({}),
  },
);
