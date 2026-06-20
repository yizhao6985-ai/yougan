/** 制作环节 staging 草稿类型（验收前；assemble 后进 preview.blocks，commit 时剥离） */

/** 设计任务 deliverable 中的单张配图草稿 */
export interface ProductionDraftImage {
  url: string;
  alt?: string | null;
  prompt?: string | null;
  /** 临时外链；API 物化到自有 storage 后剥离 */
  transient?: boolean;
}
