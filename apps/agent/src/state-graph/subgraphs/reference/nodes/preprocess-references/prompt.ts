import type { MediaKind } from "@yougan/domain";

import { profileReferencesSummary } from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import type { UnprocessedReferenceJob } from "./helpers/list-unprocessed-jobs.js";
import { isSupportedReferencePreprocessKind } from "./helpers/skip-unsupported-reference-jobs.js";

const MEDIA_LABEL: Record<MediaKind, string> = {
  text: "文本",
  image: "图片",
  audio: "音频（暂不支持自动分析）",
  video: "视频（暂不支持自动分析）",
  file: "文件",
};

const MEDIA_TOOL: Record<MediaKind, string> = {
  text: "preprocess_reference_text",
  image: "preprocess_reference_image",
  audio: "（跳过）",
  video: "（跳过）",
  file: "preprocess_reference_text",
};

function formatUnprocessedJobs(jobs: UnprocessedReferenceJob[]): string {
  if (!jobs.length) return "（无）";
  return jobs
    .map((job) => {
      const label = MEDIA_LABEL[job.media_kind] ?? job.media_kind;
      const name = job.original_name?.trim();
      const tool = MEDIA_TOOL[job.media_kind] ?? "对应媒介工具";
      const skipNote = isSupportedReferencePreprocessKind(job.media_kind)
        ? ""
        : "｜将自动跳过";
      return `- ${tool}｜${label}${skipNote}｜${name ? `文件名：${name}｜` : ""}url：${job.asset_url}`;
    })
    .join("\n");
}

export function buildPreprocessReferencesPrompt(
  state: AgentStateType,
  jobs: UnprocessedReferenceJob[],
): string {
  const references = getReferences(state);

  const modePrompt = `当前任务：参考素材预处理（客观分析入库，不写借鉴意图）

**职责**：对尚未完成分析的参考资源执行预处理（读取文本、感知图片），写入 analysis；intent 保持待确认。音视频素材暂不支持自动分析，系统会自动跳过。

**流程**
- 下方「待预处理」列表中**文本与图片**须调用且仅调用一次对应媒介工具（asset_url 原样传入）
- 全部可处理项完成前不要结束本轮；无 tool_calls 表示预处理已结束
- 禁止修改 intent、禁止删除参考、禁止向${YOUGAN_USER_LABEL}回复（后续节点负责）

**工具对照**
- 文本 → preprocess_reference_text
- 图片 → preprocess_reference_image

当前参考列表：
${profileReferencesSummary(references)}

待预处理（${jobs.length} 条）：
${formatUnprocessedJobs(jobs)}`;

  return composeSystemPrompt(modePrompt);
}
