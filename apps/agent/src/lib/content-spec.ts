/** 体裁 / 媒介与制作管线判定，复用 domain */
export {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  contentFormatLabel,
  contentSpecSummary,
  isValidContentFormat,
  mediaModalitiesLabel,
  mediaModalityLabel,
  normalizeMediaModalities,
  resolveContentSpec,
  routeProductionPipeline,
  sortMediaModalities,
  type ContentFormatId,
  type ProductionPipelineId,
  type MediaModalityId,
} from "@yougan/domain";
