/** 按体裁生成写作指引片段（generate_draft 等使用） */
import type { ContentFormatId } from "@yougan/domain";

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
  illustration:
    "绘画插画：输出文生图提示词与画面说明，明确风格、构图、主体与色彩，画面即主交付。",
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
