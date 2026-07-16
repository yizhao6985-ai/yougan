import { ToolMessage } from "@langchain/core/messages";
import { tool, type ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import type { z } from "zod";

import {
  applyProfilePatch,
  type ProfilePatch,
} from "../../../mutate-profile/helpers/apply-profile-patch.js";
import {
  getProfile,
  getState,
  patchPendingProfile,
} from "#agent/state-io/index.js";
import {
  createTurnActivityMessage,
  profileToolActivityId,
  profileToolSubject,
} from "#agent/state-io/turn-activities.js";

export function createProfileTool<T extends z.ZodTypeAny>(options: {
  name: string;
  description: string;
  schema: T;
  toPatch: (input: z.infer<T>) => ProfilePatch;
  emptyMessage?: string;
}) {
  return tool(
    async (input, config) => {
      const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
      const activityBase = {
        id: profileToolActivityId(options.name),
        refId: options.name,
        kind: "profile_update" as const,
        subject: profileToolSubject(options.name),
      };

      try {
        const state = getState();
        const profile = getProfile(state);
        const result = applyProfilePatch(profile, options.toPatch(input));

        if (!result) {
          return new Command({
            update: {
              messages: [
                new ToolMessage({
                  name: options.name,
                  content: options.emptyMessage ?? "未应用方案变更。",
                  tool_call_id: toolCallId,
                }),
                createTurnActivityMessage({
                  ...activityBase,
                  status: "failed",
                }),
              ],
            },
          });
        }

        return new Command({
          update: {
            messages: [
              new ToolMessage({
                name: options.name,
                content: `已更新：${result.changes.join("、")}。`,
                tool_call_id: toolCallId,
              }),
              createTurnActivityMessage({
                ...activityBase,
                status: "done",
              }),
            ],
            ...patchPendingProfile(state, result.profile),
          },
        });
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "方案更新失败。";
        return new Command({
          update: {
            messages: [
              new ToolMessage({
                name: options.name,
                content: detail,
                tool_call_id: toolCallId,
                status: "error",
              }),
              createTurnActivityMessage({
                ...activityBase,
                status: "failed",
              }),
            ],
          },
        });
      }
    },
    {
      name: options.name,
      description: options.description,
      schema: options.schema,
    },
  );
}
