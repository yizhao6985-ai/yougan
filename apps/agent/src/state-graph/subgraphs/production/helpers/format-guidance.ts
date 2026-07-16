/** 按体裁与媒介生成内容指引片段（产出任务等使用） */
import type { ContentFormatId, WorkProfile } from "@yougan/domain";

import { buildWordCountRequirement } from "./word-count-guidance.js";

const FORMAT_GUIDANCE: Record<ContentFormatId, string> = {
  note: "图文笔记：开头抓注意力，3-5 个可扫读要点，口语化；配图建议可写在 notes。",
  short_post: "短帖动态：信息密度高，1-3 段，观点鲜明。",
  article: "长文深度：清晰标题与导语，分节小标题，论据或案例支撑。",
  blog: "博客专栏：观点鲜明，逻辑递进，可带个人经验与案例。",
  novel: "小说故事：有人物、冲突与情节推进，场景描写与对话结合，按章节或完整短篇结构输出。",
  video_script: "视频脚本：分镜/段落标注，旁白 + 画面提示，标注节奏与时长感。",
  short_video: "短视频：极短口播稿 + 分镜提示，开头强钩子，节奏紧凑。",
  podcast: "播客：对话感或独白结构，分段主题，适合音频节目结构与口播稿。",
  music: "音乐/歌词：情绪基调、段落结构与韵律变化。",
  illustration: "绘画插画：以文字描述画面构图、风格与情绪；当前仅产出文字说明，不出图。",
};

const FORMAT_DEFAULT_WORD_HINT: Partial<Record<ContentFormatId, string>> = {
  note: "若无方案字数，正文可参考 300–800 字。",
  short_post: "若无方案字数，正文可参考 50–280 字。",
  article: "若无方案字数，正文可参考 800–2500 字。",
};

const MODALITY_GUIDANCE: Record<string, string> = {
  text: "输出以纯文字内容为主。",
  image: "主交付为文字说明；可在 notes 中给出配图/封面建议。",
  mixed: "输出长文或笔记正文，并在 notes 中给出配图/封面建议。",
  audio: "输出适合朗读的口播稿。",
  video: "输出视频脚本或口播分镜；当前先出脚本稿。",
};

export function buildFormatGenerationGuidance(
  contentFormat: ContentFormatId | null | undefined,
  mediaModality: string | null | undefined,
  profile?: WorkProfile,
  options?: { scope?: "fragment" | "final" },
) {
  const formatKey = contentFormat ?? "short_post";
  const formatGuide =
    FORMAT_GUIDANCE[formatKey as ContentFormatId] ??
    FORMAT_GUIDANCE.short_post;
  const modalityGuide =
    MODALITY_GUIDANCE[mediaModality ?? "text"] ?? MODALITY_GUIDANCE.text;

  const wordCountGuide =
    profile && options?.scope !== "fragment"
      ? buildWordCountRequirement(profile)
      : null;
  const defaultWordHint =
    !wordCountGuide &&
    FORMAT_DEFAULT_WORD_HINT[formatKey as ContentFormatId];

  const lines = [formatGuide];
  if (wordCountGuide) {
    lines.push(wordCountGuide);
  } else if (defaultWordHint) {
    lines.push(defaultWordHint);
  }
  lines.push(modalityGuide);
  return lines.join("\n");
}
