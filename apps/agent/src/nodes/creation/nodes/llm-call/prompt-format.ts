/**
 * 按 content_format 注入生成约束，供创作模式 prompt 与 generate_content 共用。
 */
import type { ContentFormatId } from "../../../../lib/content-spec.js"

const FORMAT_GUIDANCE: Record<ContentFormatId, string> = {
  note: "图文笔记：开头强钩子，3-5 个可扫读要点，口语化，适合小红书种草风格，正文 300-800 字。",
  short_post: "短帖动态：信息密度高，1-3 段，适合微博/快讯，正文 50-280 字。",
  article: "长文深度：清晰标题与导语，分节小标题，论据或案例支撑，适合公众号，正文 800-2500 字。",
  blog: "博客专栏：观点鲜明，逻辑递进，可带个人经验，适合技术/观点专栏。",
  novel: "小说故事：有人物、冲突与情节推进，场景描写与对话结合，按章节或完整短篇结构输出。",
  video_script: "视频脚本：分镜/段落标注，口播文案 + 画面提示，标注时长感，适合口播或短视频拍摄。",
  short_video: "短视频：极短口播稿 + 分镜提示，前 3 秒强钩子，适合抖音/快手。",
  podcast: "播客：对话感或独白结构，分段主题，适合音频节目结构与口播稿。",
  music: "音乐音频：歌词或音频节目文案结构，标注段落与情绪变化。",
};

const MODALITY_GUIDANCE: Record<string, string> = {
  text: "输出以纯文字为主。",
  image: "输出以图文笔记为主，正文需配合配图场景描述（notes 字段可写配图建议）。",
  mixed: "输出长文或笔记正文，并在 notes 中给出配图/封面建议。",
  audio: "输出适合朗读的口播稿；音频文件生成功能即将上线，当前先出文字稿。",
  video: "输出视频脚本或口播分镜；视频合成即将上线，当前先出脚本稿。",
};

export function buildFormatGenerationGuidance(
  contentFormat: ContentFormatId | null | undefined,
  mediaModality: string | null | undefined,
) {
  const formatKey = contentFormat ?? "short_post";
  const formatGuide =
    FORMAT_GUIDANCE[formatKey as ContentFormatId] ??
    FORMAT_GUIDANCE.short_post;
  const modalityGuide =
    MODALITY_GUIDANCE[mediaModality ?? "text"] ?? MODALITY_GUIDANCE.text;
  return `${formatGuide}\n${modalityGuide}`;
}

export const PLAN_FORMAT_HINTS: Record<ContentFormatId, string> = {
  note: "制作计划建议包含：钩子、核心卖点、体验细节、行动号召。",
  short_post: "制作计划建议包含：核心观点、支撑句、话题标签方向。",
  article: "制作计划建议包含：标题方向、导语、分节主题、总结。",
  blog: "制作计划建议包含：论点、论据、案例、结论。",
  novel: "制作计划建议包含：人物、背景、冲突、情节节点、结局走向。",
  video_script: "制作计划建议包含：开场钩子、分镜/段落、口播要点、结尾 CTA。",
  short_video: "制作计划建议包含：3 秒钩子、核心信息、结尾引导。",
  podcast: "制作计划建议包含：节目主题、分段话题、过渡语、结尾。",
  music: "制作计划建议包含：情绪基调、段落结构、关键词/歌词方向。",
};

export function buildPlanFormatHint(contentFormat: ContentFormatId | null | undefined) {
  if (!contentFormat) return "";
  return PLAN_FORMAT_HINTS[contentFormat] ?? "";
}
