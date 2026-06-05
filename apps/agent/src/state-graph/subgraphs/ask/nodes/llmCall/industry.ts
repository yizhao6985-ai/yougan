/** ask 子图：根据平台、体裁、媒介动态解析行业经验提示 */
import type { FlatContentSpec } from "@yougan/domain";

const PLATFORM_INDUSTRY: Record<string, string> = {
  xiaohongshu:
    "小红书：真实体验感、封面与标题决定点击率；种草需具体场景与对比；避免硬广感；话题标签 3-5 个为宜。",
  weibo:
    "微博：热点借势、短句传播；适合观点输出与话题讨论；注意 140 字内核心信息。",
  wechat:
    "微信公众号：深度与结构并重；标题决定打开率；适合分节小标题与金句；注意排版留白。",
  douyin:
    "抖音：前 3 秒钩子决定完播；口播口语化；节奏快、信息密度高；结尾引导互动。",
  kuaishou:
    "快手：下沉市场、真实接地气；强调人情味与信任感；适合故事化叙述。",
  bilibili:
    "哔哩哔哩：年轻受众、玩梗与干货并存；适合系列化与 UP 主人设；注意弹幕文化。",
};

const FORMAT_INDUSTRY: Record<string, string> = {
  note: "笔记体裁：短平快、分点清晰、emoji 适度、行动号召明确。",
  article: "长文体裁：论点—论据—案例—总结；小标题分段；适合深度种草或科普。",
  illustration:
    "绘画体裁：画面即主交付；明确风格流派、构图、光影、色彩与主体细节；文生图提示词需具体可执行。",
  short_video: "短视频：分镜思维、口播脚本、字幕要点、BGM 情绪配合。",
  video_script: "视频脚本：镜头语言 + 旁白 + 画面描述；注意转场与节奏。",
  podcast: "播客/音频：对话感或独白；分段主题；适合通勤场景收听。",
  music: "音乐/歌词：情绪基调、段落结构、押韵与记忆点。",
};

const MODALITY_INDUSTRY: Record<string, string> = {
  image:
    "图片媒介：可为独立绘画（仅 image）或图文组合（text + image）；前者走设计管线，后者文案为主。",
};

export function resolveIndustryContext(spec: FlatContentSpec): string {
  const parts: string[] = [];

  const platform = spec.platform?.trim().toLowerCase();
  if (platform && PLATFORM_INDUSTRY[platform]) {
    parts.push(PLATFORM_INDUSTRY[platform]);
  }

  const format = spec.content_format?.trim().toLowerCase();
  if (format && FORMAT_INDUSTRY[format]) {
    parts.push(FORMAT_INDUSTRY[format]);
  }

  const modalities = spec.media_modalities ?? [];
  if (modalities.includes("image") && !modalities.includes("text")) {
    parts.push(
      "绘画组合：仅含图片原子，走设计管线，交付插画/海报/封面等视觉资产。",
    );
  } else if (modalities.includes("text") && modalities.includes("image")) {
    parts.push("图文组合：文字为主、图片辅助表达。");
  }
  for (const modality of modalities) {
    if (MODALITY_INDUSTRY[modality]) {
      parts.push(MODALITY_INDUSTRY[modality]);
    }
  }

  if (spec.content_topic) {
    parts.push(
      `创作主题「${spec.content_topic}」：需结合该领域受众关注点与常见内容形式。`,
    );
  }

  return parts.length
    ? parts.join("\n")
    : "通用内容创作：注重平台特性、受众需求与可传播性。";
}
