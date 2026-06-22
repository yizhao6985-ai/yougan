/** 运行中粗步骤（subgraph 级），供 Loading / 顶栏展示 */
export type RunProgressPhase =
  | "turn_planning"
  | "reference"
  | "profile"
  | "collect_revision"
  | "production"
  | "revise"
  | "ask"
  | "suggestions"
  | "messages_summary"
  | "production_confirm"
  | "revise_confirm";

export interface RunProgress {
  phase: RunProgressPhase;
  /** 用户可见主文案 */
  label: string;
  /** 毫秒时间戳 */
  updatedAt: number;
}
