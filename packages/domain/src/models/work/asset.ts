/**
 * 已上传文件元数据（上传结果 / API files 路由）。
 * 纯文件事实，不含业务语义；参考素材、头像、封面等共用此结构。
 */
export interface Asset {
  /** 存储 key，如 references/xxx.mp4 */
  key: string;
  /** 可访问 URL：本地模式为 /api/files/{key}，OSS 模式为公网读地址 */
  url: string;
  /** MIME，如 image/jpeg、audio/mpeg、video/mp4 */
  mime_type: string;
  size_bytes?: number | null;
  /** 用户上传时的原始文件名 */
  original_name?: string | null;
}
