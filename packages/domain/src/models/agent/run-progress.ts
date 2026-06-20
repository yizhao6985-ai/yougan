/** 流式运行中的用户可见进度（SSE updates / custom 心跳） */
export type RunProgressPhase =
  | "turn_planning"
  | "reference"
  | "profile"
  | "production_plan"
  | "production_dispatch"
  | "production_execute_writing"
  | "production_execute_design"
  | "production_render_design"
  | "production_ingest_audio"
  | "production_accept"
  | "production_assemble"
  | "production_summarize"
  | "ask"
  | "suggestions"
  | "messages_summary";

export interface RunProgress {
  phase: RunProgressPhase;
  /** 用户可见主文案 */
  label: string;
  /** 补充说明，如当前任务描述 */
  detail?: string | null;
  /** 毫秒时间戳；心跳时刷新，供前端判断仍在进行 */
  updatedAt: number;
}
