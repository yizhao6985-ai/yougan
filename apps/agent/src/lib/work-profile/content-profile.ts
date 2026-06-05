/** WorkProfile → FlatContentSpec（行业 prompt、制作管线共用） */
import {
  flattenWorkProfile,
  resolveContentSpecFromProfile,
  type FlatContentSpec,
  type WorkProfile,
} from "@yougan/domain";

/** 从作品 profile 推导体裁路由用的 content spec */
export function profileToContentSpec(profile: WorkProfile): FlatContentSpec {
  return resolveContentSpecFromProfile(profile);
}

export { flattenWorkProfile };
