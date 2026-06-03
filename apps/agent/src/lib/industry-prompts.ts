/**
 * 根据创意总监提供的平台、主题、体裁动态加载行业经验提示词。
 */
import type { ProductionDepartment, WorkProfile } from "#agent/schema.js";

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
  short_video: "短视频：分镜思维、口播脚本、字幕要点、BGM 情绪配合。",
  video_script: "视频脚本：镜头语言 + 旁白 + 画面描述；注意转场与节奏。",
  podcast: "播客/音频：对话感或独白；分段主题；适合通勤场景收听。",
  music: "音乐/歌词：情绪基调、段落结构、押韵与记忆点。",
};

const DEPARTMENT_BRIEF: Record<ProductionDepartment, string> = {
  writing: "文案部：负责标题、正文、话题标签、口播稿等文字产出。",
  design: "设计部：负责封面、配图、信息图等视觉产出（当前可输出配图方案与描述）。",
  audio: "音频部：负责配音稿、播客脚本、音效与节奏建议。",
  video: "视频部：负责分镜脚本、口播、字幕与剪辑节奏建议。",
};

export function resolveIndustryContext(profile: WorkProfile): string {
  const parts: string[] = [];

  const platform = profile.platform?.trim().toLowerCase();
  if (platform && PLATFORM_INDUSTRY[platform]) {
    parts.push(PLATFORM_INDUSTRY[platform]);
  }

  const format = profile.content_format?.trim().toLowerCase();
  if (format && FORMAT_INDUSTRY[format]) {
    parts.push(FORMAT_INDUSTRY[format]);
  }

  if (profile.content_topic) {
    parts.push(`创作主题「${profile.content_topic}」：需结合该领域受众关注点与常见内容形式。`);
  }

  if (profile.audience) {
    parts.push(`目标受众「${profile.audience}」：语言与案例应贴合其认知水平与兴趣点。`);
  }

  return parts.length ? parts.join("\n") : "通用内容创作：注重平台特性、受众需求与可传播性。";
}

export function departmentBrief(department: ProductionDepartment): string {
  return DEPARTMENT_BRIEF[department];
}

export function departmentsBrief(departments: ProductionDepartment[]): string {
  return departments.map((d) => departmentBrief(d)).join("\n");
}
